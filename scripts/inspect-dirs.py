import zipfile
zip_path = r'C:\Users\a844699\AppData\Local\Temp\vienna-convention.zip'
prefix = 'vienna-convention-main/Traffic_Signs/'
seen = []
with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist():
        if not name.startswith(prefix):
            continue
        rel = name[len(prefix):]
        parts = rel.split('/')
        if len(parts) == 3 and parts[1].startswith('VIENNA:'):
            seen.append(parts[1])
for item in sorted(set(seen)):
    print(item)
