import os, re

root = r'C:\Development\permis2.0\apps\web\public\images\signs'
files = sorted([f for f in os.listdir(root) if f.endswith('.svg')])
changed = 0
errors = 0

def num(s):
    m = re.search(r'[-+]?(?:\d+\.?\d*|\.\d+)', s)
    return float(m.group()) if m else None

for name in files:
    path = os.path.join(root, name)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()
        original = text
        # Remove XML decl + comments + inkscape/sodipodi tags/attrs
        text = re.sub(r'<\?xml[^>]*\?>', '', text)
        text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
        text = re.sub(r'<\s*inkscape:\w[^>]*>', '', text)
        text = re.sub(r'<\s*sodipodi:\w[^>]*>', '', text)
        text = re.sub(r'</\s*(inkscape|sodipodi):\w+>', '', text)
        text = re.sub(r'\s+(inkscape|sodipodi):\w+="[^"]*"', '', text)
        # Find translate on main g and remove it
        text = re.sub(r'<g[^>]*\btransform\s*=\s*"translate\([^"]*\)"[^>]*>', '<g>', text)
        # Collect bounds from shapes
        xs = []
        ys = []
        for m in re.finditer(r'<rect\b[^>]*>', text):
            s = m.group()
            x = num(s.get('x', '0') if hasattr(s, 'get') else (re.search(r'\bx\s*=\s*"([^"]+)"', s) or [None, '0'])[1])
            y = num(s.get('y', '0') if hasattr(s, 'get') else (re.search(r'\by\s*=\s*"([^"]+)"', s) or [None, '0'])[1])
            # fallback regex
            if x is None:
                xm = re.search(r'\bx\s*=\s*"([^"]+)"', s)
                x = float(xm.group(1)) if xm else 0.0
            if y is None:
                ym = re.search(r'\by\s*=\s*"([^"]+)"', s)
                y = float(ym.group(1)) if ym else 0.0
            w = float((re.search(r'\bwidth\s*=\s*"([^"]+)"', s) or [None, '0'])[1])
            h = float((re.search(r'\bheight\s*=\s*"([^"]+)"', s) or [None, '0'])[1])
            xs.extend([x, x + w])
            ys.extend([y, y + h])
        for m in re.finditer(r'<circle\b[^>]*>', text):
            s = m.group()
            cx = float((re.search(r'\bcx\s*=\s*"([^"]+)"', s) or [None, '0'])[1])
            cy = float((re.search(r'\bcy\s*=\s*"([^"]+)"', s) or [None, '0'])[1])
            r = float((re.search(r'\br\s*=\s*"([^"]+)"', s) or [None, '0'])[1])
            xs.extend([cx - r, cx + r])
            ys.extend([cy - r, cy + r])
        for m in re.finditer(r'<path\b[^>]*\sd\s*=\s*"([^"]+)"', text):
            d = m.group(1)
            nums = [float(n) for n in re.findall(r'[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d)]
            if len(nums) >= 2:
                xs.extend(nums[::2])
                ys.extend(nums[1::2])
        if not xs or not ys:
            continue
        min_x = min(xs) - 2
        min_y = min(ys) - 2
        max_x = max(xs) + 2
        max_y = max(ys) + 2
        vb = f'{min_x:.1f} {min_y:.1f} {max_x-min_x:.1f} {max_y-min_y:.1f}'
        text = re.sub(r'viewBox\s*=\s*"[^"]*"', f'viewBox="{vb}"', text)
        text = re.sub(r'width\s*=\s*"[^"]*"', 'width="120"', text)
        text = re.sub(r'height\s*=\s*"[^"]*"', 'height="120"', text)
        if text != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(text)
            changed += 1
    except Exception as e:
        errors += 1
        print('ERR', name, e)
print('done', changed, 'errors', errors)
