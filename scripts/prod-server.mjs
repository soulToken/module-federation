import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 8888;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const ROUTES = [
  { prefix: '/apps/mall/', dir: path.join(rootDir, 'sub-app-mall/dist') },
  { prefix: '/apps/activity/', dir: path.join(rootDir, 'sub-app-activity/dist') },
  { prefix: '/apps/user/', dir: path.join(rootDir, 'sub-app-user/dist') },
  { prefix: '/', dir: path.join(rootDir, 'main-app/dist'), spaFallback: true },
];

function setHeaders(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (filePath.endsWith('remoteEntry.js') || filePath.endsWith('mf-manifest.json')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });
    return res.end();
  }

  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  for (const route of ROUTES) {
    if (urlPath.startsWith(route.prefix)) {
      const relativeSubPath = urlPath.slice(route.prefix.length);
      const filePath = path.join(route.dir, relativeSubPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        setHeaders(res, filePath);
        return fs.createReadStream(filePath).pipe(res);
      }

      // Check index.html inside the sub-app or SPA fallback
      if (route.spaFallback) {
        const indexPath = path.join(route.dir, 'index.html');
        if (fs.existsSync(indexPath)) {
          setHeaders(res, indexPath);
          return fs.createReadStream(indexPath).pipe(res);
        }
      } else {
        const subIndex = path.join(filePath, 'index.html');
        if (fs.existsSync(subIndex) && fs.statSync(subIndex).isFile()) {
          setHeaders(res, subIndex);
          return fs.createReadStream(subIndex).pipe(res);
        }
      }
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production Micro-Frontend Gateway running at http://0.0.0.0:${PORT}`);
});
