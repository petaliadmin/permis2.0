import zipfile
zip_path = r'C:\Users\a844699\AppData\Local\Temp\vienna-convention.zip'
prefix = 'vienna-convention-main/Traffic_Signs/'
with zipfile.ZipFile(zip_path, 'r') as z:
    names = z.namelist()
    for n in names:
        if not n.startswith(prefix):
            continue
        rel = n[len(prefix):]
        if any(x in rel for x in ['AB1','AB2','AB25','AB3','AB6','AB7','AK1','AK4','B0','B2c','B7','B9','B9a','M1','M2','M3']):
            print(rel)
