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
  { prefix: '/hyper-registry.json', file: path.join(rootDir, 'hyper-registry.json') },
  { prefix: '/apps/hyper-core/', dir: path.join(rootDir, 'dist/apps/hyper-core'), fallbackDir: path.join(rootDir, 'hyper-core/dist') },
  { prefix: '/apps/hyper-mall/', dir: path.join(rootDir, 'dist/apps/hyper-mall'), fallbackDir: path.join(rootDir, 'hyper-mall/dist') },
  { prefix: '/apps/hyper-activity/', dir: path.join(rootDir, 'dist/apps/hyper-activity'), fallbackDir: path.join(rootDir, 'hyper-activity/dist') },
  { prefix: '/apps/hyper-user/', dir: path.join(rootDir, 'dist/apps/hyper-user'), fallbackDir: path.join(rootDir, 'hyper-user/dist') },
  { prefix: '/', dir: path.join(rootDir, 'dist'), fallbackDir: path.join(rootDir, 'hyper-mall/dist'), spaFallback: true },
];

function setHeaders(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (filePath.endsWith('remoteEntry.js') || filePath.endsWith('hyper-registry.json')) {
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

  // Exact file route
  if (urlPath === '/hyper-registry.json') {
    const f = path.join(rootDir, 'hyper-registry.json');
    if (fs.existsSync(f)) {
      setHeaders(res, f);
      return fs.createReadStream(f).pipe(res);
    }
  }

  for (const route of ROUTES) {
    if (route.dir && urlPath.startsWith(route.prefix)) {
      const relativeSubPath = urlPath.slice(route.prefix.length);
      const targetDir = fs.existsSync(route.dir) ? route.dir : route.fallbackDir;
      const filePath = path.join(targetDir, relativeSubPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        setHeaders(res, filePath);
        return fs.createReadStream(filePath).pipe(res);
      }

      // Check index.html inside the sub-app or SPA fallback
      if (route.spaFallback) {
        const indexPath = path.join(targetDir, 'index.html');
        if (fs.existsSync(indexPath)) {
          setHeaders(res, indexPath);
          return fs.createReadStream(indexPath).pipe(res);
        }
      }
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production Decentralized Peer Gateway running at http://0.0.0.0:${PORT}`);
  console.log(`   • Registry: http://0.0.0.0:${PORT}/hyper-registry.json`);
  console.log(`   • Core:     http://0.0.0.0:${PORT}/apps/hyper-core/`);
  console.log(`   • Mall:     http://0.0.0.0:${PORT}/apps/hyper-mall/`);
  console.log(`   • Activity: http://0.0.0.0:${PORT}/apps/hyper-activity/`);
  console.log(`   • User:     http://0.0.0.0:${PORT}/apps/hyper-user/`);
});
