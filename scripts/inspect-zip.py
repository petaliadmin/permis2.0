import zipfile
zip_path = r'C:\Users\a844699\AppData\Local\Temp\vienna-convention.zip'
with zipfile.ZipFile(zip_path, 'r') as z:
    names = z.namelist()
    for n in names[:120]:
        print(n)
