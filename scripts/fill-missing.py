import os

out_dir = r'C:\Development\permis2.0\apps\web\public\images\signs'

missing = {
  'AB1': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,8 92,50 50,92 8,50" fill="#F4D03F" stroke="#111827" stroke-width="4"/><text x="50" y="58" text-anchor="middle" font-size="18" font-weight="bold" fill="#111827">AB1</text></svg>',
  'AB2': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" fill="#F4D03F" stroke="#111827" stroke-width="4" transform="rotate(45 50 50)"/><text x="50" y="58" text-anchor="middle" font-size="18" font-weight="bold" fill="#111827">AB2</text></svg>',
  'AB25': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#3498DB" stroke="#111827" stroke-width="4"/><circle cx="50" cy="50" r="28" fill="none" stroke="#fff" stroke-width="4"/><path d="M50 22 L58 38 L76 38 L62 50 L68 66 L50 56 L32 66 L38 50 L24 38 L42 38 Z" fill="#fff"/></svg>',
  'AB3a': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,8 92,50 50,92 8,50" fill="#F4D03F" stroke="#111827" stroke-width="4"/><text x="50" y="58" text-anchor="middle" font-size="18" font-weight="bold" fill="#111827">AB3a</text></svg>',
  'AB6': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" fill="#F4D03F" stroke="#111827" stroke-width="4" transform="rotate(45 50 50)"/><text x="50" y="58" text-anchor="middle" font-size="18" font-weight="bold" fill="#111827">AB6</text></svg>',
  'AB7': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" fill="#D5F5E3" stroke="#111827" stroke-width="4" transform="rotate(45 50 50)"/><text x="50" y="58" text-anchor="middle" font-size="18" font-weight="bold" fill="#111827">AB7</text></svg>',
  'AK1': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" fill="#F4D03F" stroke="#111827" stroke-width="4" stroke-dasharray="8,6"/><text x="50" y="58" text-anchor="middle" font-size="18" font-weight="bold" fill="#111827">AK1</text></svg>',
  'AK4': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" fill="#F4D03F" stroke="#111827" stroke-width="4" stroke-dasharray="8,6"/><text x="50" y="58" text-anchor="middle" font-size="18" font-weight="bold" fill="#111827">AK4</text></svg>',
  'B0': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="#C0392B" stroke-width="6"/><circle cx="50" cy="50" r="34" fill="none" stroke="#C0392B" stroke-width="3"/><rect x="28" y="35" width="44" height="30" fill="#111827"/></svg>',
  'B2c': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="#C0392B" stroke-width="6"/><path d="M30 22 L65 50 L30 78" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round"/><line x1="40" y1="50" x2="75" y2="50" stroke="#111827" stroke-width="6" stroke-linecap="round"/></svg>',
  'B7': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="#C0392B" stroke-width="6"/><text x="50" y="62" text-anchor="middle" font-size="28" font-weight="bold" fill="#111827">⇌</text></svg>',
  'B9': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="#C0392B" stroke-width="6"/><circle cx="50" cy="45" r="10" fill="none" stroke="#111827" stroke-width="3"/><path d="M30 85 Q50 55 70 85" fill="none" stroke="#111827" stroke-width="3"/><line x1="40" y1="55" x2="40" y2="75" stroke="#111827" stroke-width="3"/><line x1="60" y1="55" x2="60" y2="75" stroke="#111827" stroke-width="3"/></svg>',
  'B9a': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="#C0392B" stroke-width="6"/><circle cx="50" cy="45" r="10" fill="none" stroke="#111827" stroke-width="3"/><circle cx="75" cy="55" r="10" fill="none" stroke="#111827" stroke-width="3"/><line x1="32" y1="52" x2="40" y2="55" stroke="#111827" stroke-width="3"/><line x1="68" y1="45" x2="60" y2="50" stroke="#111827" stroke-width="3"/></svg>',
  'M1': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="#8E44AD" stroke-width="6"/><text x="50" y="58" text-anchor="middle" font-size="22" font-weight="bold" fill="#111827">H</text><line x1="50" y1="65" x2="50" y2="85" stroke="#111827" stroke-width="4"/></svg>',
  'M2': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="#8E44AD" stroke-width="6"/><text x="50" y="58" text-anchor="middle" font-size="22" font-weight="bold" fill="#111827">W</text><line x1="50" y1="65" x2="50" y2="85" stroke="#111827" stroke-width="4"/></svg>',
  'M3': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="#8E44AD" stroke-width="6"/><text x="50" y="58" text-anchor="middle" font-size="22" font-weight="bold" fill="#111827">3t</text></svg>',
}

for code, svg in missing.items():
    path = os.path.join(out_dir, code + '.svg')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(svg)
    print('OK\t' + code)
