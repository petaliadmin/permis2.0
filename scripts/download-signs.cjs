const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../apps/web/public/images/signs');
const CODES = [
  'Aa-1a-V1', 'Aa-1b-V1', 'Aa-1c-V1', 'Aa-1d-V1',
  'Aa-2a-V1', 'Aa-3a-V1', 'Aa-3b-V1', 'Aa-4-V1',
  'Aa-5a-V1', 'Aa-6-V1', 'Aa-7-V1', 'Aa-8-V1',
  'Aa-13a-V1', 'Aa-13b-V1', 'Aa-14-V1', 'Aa-15a-V1',
  'Aa-15b-V1', 'Aa-15c-V1', 'Aa-16-V1', 'Aa-17-V1',
  'Aa-18-V1', 'Aa-19-V1', 'Aa-20-V1', 'Aa-21-V1',
  'Aa-23-V1', 'Aa-24-V1',
  'AB1-V1', 'AB6-V1', 'AB7-V1', 'AB2-V1', 'AB3a-V1', 'AB25-V1',
  'B0-V1', 'B1-V1', 'B2a-V1', 'B2b-V1', 'B2c-V1',
  'B3-V1', 'B3a-V1', 'B3b-V1', 'B4-V1', 'B5-V1',
  'B6-V1', 'B6a-V1', 'B7-V1', 'B9-V1', 'B9a-V1',
  'C1a-V1', 'C1b-V1', 'C1c-V1', 'C2-V1', 'C3-V1', 'C4-V1',
  'C5-V1', 'C6-V1', 'C1-V1', 'C5a-V1',
  'D1-V1', 'D2-V1',
  'AK1-V1', 'AK4-V1',
  'M1-V1', 'M2-V1', 'M3-V1',
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function searchFile(code) {
  const title = `File:Vienna_Convention_road_sign_${code}.svg`;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
  return fetch(url).then(body => {
    const json = JSON.parse(body);
    const pages = json.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    if (page.missing) return null;
    const info = page.imageinfo?.[0];
    return info?.url || null;
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          const file = fs.createWriteStream(dest);
          res2.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const code of CODES) {
    try {
      const url = await searchFile(code);
      if (!url) {
        console.log('NOT_FOUND\t' + code);
        continue;
      }
      const ext = path.extname(url);
      const dest = path.join(OUTPUT_DIR, code + ext);
      await download(url, dest);
      console.log('OK\t' + code + '\t' + path.basename(dest));
    } catch (e) {
      console.log('ERROR\t' + code + '\t' + e.message);
    }
  }
}

main();
