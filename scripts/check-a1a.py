import re
text = open('apps/web/public/images/signs/A1a.svg', 'r', encoding='utf-8').read()
vb = re.search(r'viewBox="([^"]+)"', text)
w = re.search(r'width="([^"]+)"', text)
h = re.search(r'height="([^"]+)"', text)
print('viewBox:', vb.group(1) if vb else 'N/A')
print('width:', w.group(1) if w else 'N/A')
print('height:', h.group(1) if h else 'N/A')
print('has g transform:', 'transform="translate' in text)
