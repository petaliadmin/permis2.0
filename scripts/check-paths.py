import zipfile
zip_path = r'C:\Users\a844699\AppData\Local\Temp\vienna-convention.zip'
with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist()[:20]:
        print(repr(name))
