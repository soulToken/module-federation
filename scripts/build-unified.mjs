import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist');

console.log('📦 [1/3] Building all micro-frontend apps...');
execSync('pnpm -r run build', { cwd: rootDir, stdio: 'inherit' });

console.log('🧹 [2/3] Cleaning and preparing root dist directory...');
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('🚀 [3/3] Merging micro-frontend artifacts into single domain structure...');
// 1. Copy main app to root dist
copyDir(path.join(rootDir, 'main-app/dist'), outDir);

// 2. Copy sub-apps to /apps/* subdirectories
copyDir(path.join(rootDir, 'sub-app-mall/dist'), path.join(outDir, 'apps/mall'));
copyDir(path.join(rootDir, 'sub-app-activity/dist'), path.join(outDir, 'apps/activity'));
copyDir(path.join(rootDir, 'sub-app-user/dist'), path.join(outDir, 'apps/user'));

// 3. Create static vercel.json for direct deployment
const staticVercelConfig = {
  cleanUrls: true,
  rewrites: [
    { source: '/apps/mall/:match*', destination: '/apps/mall/:match*' },
    { source: '/apps/activity/:match*', destination: '/apps/activity/:match*' },
    { source: '/apps/user/:match*', destination: '/apps/user/:match*' },
    { source: '/(.*)', destination: '/index.html' }
  ],
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: '*' }
      ]
    },
    {
      source: '/(.*)remoteEntry.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }
      ]
    }
  ]
};
fs.writeFileSync(path.join(outDir, 'vercel.json'), JSON.stringify(staticVercelConfig, null, 2));

console.log('✅ Unified production build completed at dist/ !');
