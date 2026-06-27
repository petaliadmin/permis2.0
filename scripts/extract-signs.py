import zipfile, os

zip_path = r'C:\Users\a844699\AppData\Local\Temp\vienna-convention.zip'
out_dir = r'C:\Development\permis2.0\apps\web\public\images\signs'
os.makedirs(out_dir, exist_ok=True)
prefix = 'vienna-convention-main/Traffic_Signs/'

refs = {
  'A1a','A1b','A1c','A1d','A2a','A3a','A3b','A4a','A4b','A5','A6','A7a','A7b','A7c','A8','A9','A13','A14','A15a','A16','A17','A17a','A17b','A18a','A18e','A18f','A19a','A20','A22','A23','A25','A26a','A26b','A27','A2c','A32','A3c',
  'AB1','AB6','AB7','AB2','AB3a','AB25',
  'B0','B1','B2a','B2b','B2c','B3','B3a','B3b','B4','B5','B6','B6a','B7','B9','B9a',
  'C1','C1a','C1b','C1c','C2','C3a','C3b','C3c','C3d','C3e','C3h','C3i','C3j','C3k','C3l','C4a','C4b','C5','C6','C7','C8','C9','C10','C11a','C11b','C12','C13a','C13b','C14','C15','C16','C17a','C17b','C17c','C18','C19','C20a','C20b',
  'D1','D2','D3','D4','D5','D6','D7','D8','D9','D10a','D10b','D10c','D11',
  'G13','G14','G17','G18','G19','G20','G21','G22a','G22b','G22c','G23a','G23b','G24a','G24b','G24c',
  'E3a','E3b','E5a','E5b','E6a','E6b','E7a','E7b','E7c','E7d','E8a','E8b','E8c','E8d','E9a','E10a','E11a','E11b','E12a','E12b','E13a','E13b','E14a','E14b','E14c','E15','E16',
  'F1a','F1b','F1c','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','F13','F14','F15','F16','F17','F18',
  'H1','AK1','AK4','M1','M2','M3'
}

with zipfile.ZipFile(zip_path, 'r') as z:
    names = z.namelist()
    index = {}
    for n in names:
        if not n.startswith(prefix):
            continue
        rel = n[len(prefix):]
        parts = rel.split('/')
        if len(parts) >= 3 and parts[1].startswith('VIENNA:'):
            key = parts[1].replace('VIENNA:', '')
            index[key] = rel

    copied = 0
    for code in sorted(refs):
        rel = index.get(code)
        if not rel:
            candidates = [k for k in index if k.startswith(code) or code.startswith(k)]
            if candidates:
                rel = index[candidates[0]]
        if not rel:
            print('NOT_FOUND\t' + code)
            continue
        data = z.read(prefix + rel)
        dest = os.path.join(out_dir, code + '.svg')
        with open(dest, 'wb') as f:
            f.write(data)
        copied += 1
        print('OK\t' + code + '\t' + os.path.basename(dest))
    print('COPY_TOTAL\t' + str(copied) + '/' + str(len(refs)))
