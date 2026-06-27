import os, re

root = r'C:\Development\permis2.0\apps\web\public\images\signs'
files = [f for f in os.listdir(root) if f.endswith('.svg')]
changed = 0
for name in files:
    path = os.path.join(root, name)
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    original = text
    text = re.sub(r'<\?xml[^>]*\?>', '', text)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    text = re.sub(r'<metadata[^>]*>.*?</metadata>\s*', '', text, flags=re.DOTALL)
    text = re.sub(r'<defs[^>]*>.*?</defs>\s*', '', text, flags=re.DOTALL)
    text = re.sub(r'inkc\w+[^>]*>', '', text)
    text = re.sub(r'<\w+:\w+[^>]*>', '', text)
    text = re.sub(r'</\w+:\w+>', '', text)
    text = re.sub(r'\s+xmlns:\w+="[^"]*"', '', text)
    text = re.sub(r'\s+standalone="[^"]*"', '', text)
    text = text.replace('mm', '')
    text = re.sub(r'width="([\d.]+)"', lambda m: f'width="{float(m.group(1)):.0f}"', text)
    text = re.sub(r'height="([\d.]+)"', lambda m: f'height="{float(m.group(1)):.0f}"', text)
    if text != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        changed += 1
print('Cleaned', changed, '/', len(files))
