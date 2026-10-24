// Serveert de web-export als single-page app: onbekende paden krijgen index.html
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'dist-web');
const poort = Number(process.argv[3] ?? 8090);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.wav': 'audio/wav',
};

http
  .createServer((req, res) => {
    let bestand = path.join(root, decodeURIComponent((req.url ?? '/').split('?')[0]));
    if (
      !bestand.startsWith(root) ||
      !fs.existsSync(bestand) ||
      fs.statSync(bestand).isDirectory()
    ) {
      bestand = path.join(root, 'index.html');
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(bestand)] ?? 'application/octet-stream',
    });
    fs.createReadStream(bestand).pipe(res);
  })
  .listen(poort);
