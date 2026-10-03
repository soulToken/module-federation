import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist');
const manifestPath = path.join(rootDir, 'hyper-registry.json');

console.log('📦 [1/4] Loading Hyper Registry Manifest...');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
console.log(`✨ Current Active Versions:`, manifest.activeVersions);

console.log('🧹 [2/4] Cleaning root dist directory...');
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

console.log('🚀 [3/4] Multi-Version Builds for all Peer Micro-Frontends...');

// 0. Build hyper-core (独立部署的核心公共应用)
console.log('  🧩 Building hyper-core (核心公共组件与运行时解析服务)...');
execSync('pnpm --filter hyper-core build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.0.0', VITE_APP_BASE: '/apps/hyper-core/v1.0.0/' }
});
copyDir(path.join(rootDir, 'hyper-core/dist'), path.join(outDir, 'apps/hyper-core/v1.0.0'));
copyDir(path.join(outDir, 'apps/hyper-core/v1.0.0'), path.join(outDir, 'apps/hyper-core'));

// 1. Build hyper-mall versions
console.log('  🛍️ Building hyper-mall v1.0.0 (经典稳定版)...');
execSync('pnpm --filter @hyper/mall build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.0.0', VITE_APP_BASE: '/apps/hyper-mall/v1.0.0/' }
});
copyDir(path.join(rootDir, 'hyper-mall/dist'), path.join(outDir, 'apps/hyper-mall/v1.0.0'));

console.log('  🛍️ Building hyper-mall v1.1.0 (大促特惠版)...');
execSync('pnpm --filter @hyper/mall build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.1.0', VITE_APP_BASE: '/apps/hyper-mall/v1.1.0/' }
});
copyDir(path.join(rootDir, 'hyper-mall/dist'), path.join(outDir, 'apps/hyper-mall/v1.1.0'));
const mallActiveVer = manifest.activeVersions.hyperMall || 'v1.1.0';
copyDir(path.join(outDir, `apps/hyper-mall/${mallActiveVer}`), path.join(outDir, 'apps/hyper-mall'));
// Also copy mall to root index as default landing peer
copyDir(path.join(outDir, `apps/hyper-mall/${mallActiveVer}`), outDir);

// 2. Build hyper-activity versions
console.log('  🎡 Building hyper-activity v1.0.0 (经典稳定版)...');
execSync('pnpm --filter @hyper/activity build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.0.0', VITE_APP_BASE: '/apps/hyper-activity/v1.0.0/' }
});
copyDir(path.join(rootDir, 'hyper-activity/dist'), path.join(outDir, 'apps/hyper-activity/v1.0.0'));

console.log('  🎡 Building hyper-activity v1.1.0 (黄金周狂欢版)...');
execSync('pnpm --filter @hyper/activity build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.1.0', VITE_APP_BASE: '/apps/hyper-activity/v1.1.0/' }
});
copyDir(path.join(rootDir, 'hyper-activity/dist'), path.join(outDir, 'apps/hyper-activity/v1.1.0'));
const activityActiveVer = manifest.activeVersions.hyperActivity || 'v1.1.0';
copyDir(path.join(outDir, `apps/hyper-activity/${activityActiveVer}`), path.join(outDir, 'apps/hyper-activity'));

// 3. Build hyper-user version
console.log('  👤 Building hyper-user v1.0.0 (会员基础版)...');
execSync('pnpm --filter @hyper/user build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.0.0', VITE_APP_BASE: '/apps/hyper-user/v1.0.0/' }
});
copyDir(path.join(rootDir, 'hyper-user/dist'), path.join(outDir, 'apps/hyper-user/v1.0.0'));
const userActiveVer = manifest.activeVersions.hyperUser || 'v1.0.0';
copyDir(path.join(outDir, `apps/hyper-user/${userActiveVer}`), path.join(outDir, 'apps/hyper-user'));

// 4. Copy hyper-registry.json to dist
fs.copyFileSync(manifestPath, path.join(outDir, 'hyper-registry.json'));

// 5. Generate vercel.json with fine-tuned rewrite rules and caching
const staticVercelConfig = {
  buildCommand: 'pnpm run build:all',
  outputDirectory: 'dist',
  cleanUrls: true,
  rewrites: [
    { source: '/hyper-registry.json', destination: '/hyper-registry.json' },
    { source: '/apps/:appId/:version/:path*', destination: '/apps/:appId/:version/:path*' },
    { source: '/apps/:appId/:path*', destination: '/apps/:appId/:path*' },
    { source: '/mall/:path*', destination: '/apps/hyper-mall/index.html' },
    { source: '/activity/:path*', destination: '/apps/hyper-activity/index.html' },
    { source: '/user/:path*', destination: '/apps/hyper-user/index.html' },
    { source: '/core/:path*', destination: '/apps/hyper-core/index.html' },
    { source: '/(.*)', destination: '/index.html' }
  ],
  headers: [
    {
      source: '/hyper-registry.json',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Access-Control-Allow-Origin', value: '*' }
      ]
    },
    {
      source: '/(.*)remoteEntry.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Access-Control-Allow-Origin', value: '*' }
      ]
    },
    {
      source: '/(.*)',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: '*' }
      ]
    }
  ]
};

fs.writeFileSync(path.join(outDir, 'vercel.json'), JSON.stringify(staticVercelConfig, null, 2));
fs.writeFileSync(path.join(rootDir, 'vercel.json'), JSON.stringify(staticVercelConfig, null, 2));

console.log('✅ Decentralized peer production artifacts generated in dist/ !');

// 6. Sync to .vercel/output/static for Vercel
const vercelOutputDir = path.join(rootDir, '.vercel/output');
const vercelStaticDir = path.join(vercelOutputDir, 'static');
if (fs.existsSync(vercelOutputDir)) {
  console.log('⚡ [4/4] Syncing production build to .vercel/output/static ...');
  if (fs.existsSync(vercelStaticDir)) {
    fs.rmSync(vercelStaticDir, { recursive: true, force: true });
  }
  copyDir(outDir, vercelStaticDir);
}
