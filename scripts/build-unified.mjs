import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist');
const manifestPath = path.join(rootDir, 'version-manifest.json');

console.log('📦 [1/4] Loading Version Manifest...');
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

console.log('🏗️ [3/4] Building host application (main-app)...');
execSync('pnpm --filter main-app build', { cwd: rootDir, stdio: 'inherit' });
copyDir(path.join(rootDir, 'main-app/dist'), outDir);

console.log('🚀 [4/4] Multi-Version Builds for all Micro-Frontends...');

// 1. Build sub-app-mall versions
console.log('  🛍️ Building Mall v1.0.0 (经典稳定版)...');
execSync('pnpm --filter sub-app-mall build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.0.0', VITE_APP_BASE: '/apps/mall/v1.0.0/' }
});
copyDir(path.join(rootDir, 'sub-app-mall/dist'), path.join(outDir, 'apps/mall/v1.0.0'));

console.log('  🛍️ Building Mall v1.1.0 (大促特惠版)...');
execSync('pnpm --filter sub-app-mall build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.1.0', VITE_APP_BASE: '/apps/mall/v1.1.0/' }
});
copyDir(path.join(rootDir, 'sub-app-mall/dist'), path.join(outDir, 'apps/mall/v1.1.0'));
// Copy active version to /apps/mall/ for compatibility
const mallActiveVer = manifest.activeVersions.subMall || 'v1.1.0';
copyDir(path.join(outDir, `apps/mall/${mallActiveVer}`), path.join(outDir, 'apps/mall'));

// 2. Build sub-app-activity versions
console.log('  🎡 Building Activity v1.0.0 (经典稳定版)...');
execSync('pnpm --filter sub-app-activity build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.0.0', VITE_APP_BASE: '/apps/activity/v1.0.0/' }
});
copyDir(path.join(rootDir, 'sub-app-activity/dist'), path.join(outDir, 'apps/activity/v1.0.0'));

console.log('  🎡 Building Activity v1.1.0 (黄金周狂欢版)...');
execSync('pnpm --filter sub-app-activity build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.1.0', VITE_APP_BASE: '/apps/activity/v1.1.0/' }
});
copyDir(path.join(rootDir, 'sub-app-activity/dist'), path.join(outDir, 'apps/activity/v1.1.0'));
const activityActiveVer = manifest.activeVersions.subActivity || 'v1.1.0';
copyDir(path.join(outDir, `apps/activity/${activityActiveVer}`), path.join(outDir, 'apps/activity'));

// 3. Build sub-app-user version
console.log('  👤 Building User v1.0.0 (会员基础版)...');
execSync('pnpm --filter sub-app-user build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_VERSION: 'v1.0.0', VITE_APP_BASE: '/apps/user/v1.0.0/' }
});
copyDir(path.join(rootDir, 'sub-app-user/dist'), path.join(outDir, 'apps/user/v1.0.0'));
const userActiveVer = manifest.activeVersions.subUser || 'v1.0.0';
copyDir(path.join(outDir, `apps/user/${userActiveVer}`), path.join(outDir, 'apps/user'));

// 4. Copy version-manifest.json to dist
fs.copyFileSync(manifestPath, path.join(outDir, 'version-manifest.json'));

// 5. Generate vercel.json with fine-tuned rewrite rules and caching
const staticVercelConfig = {
  cleanUrls: true,
  rewrites: [
    { source: '/version-manifest.json', destination: '/version-manifest.json' },
    { source: '/apps/:appId/:version/:path*', destination: '/apps/:appId/:version/:path*' },
    { source: '/apps/:appId/:path*', destination: '/apps/:appId/:path*' },
    { source: '/(.*)', destination: '/index.html' }
  ],
  headers: [
    {
      source: '/version-manifest.json',
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

console.log('✅ Multi-version production artifacts merged successfully into dist/ !');

// 6. Sync to .vercel/output/static for Vercel --prebuilt deployment
const vercelOutputDir = path.join(rootDir, '.vercel/output');
const vercelStaticDir = path.join(vercelOutputDir, 'static');
if (fs.existsSync(vercelOutputDir)) {
  console.log('⚡ [5/5] Syncing production build to .vercel/output/static ...');
  if (fs.existsSync(vercelStaticDir)) {
    fs.rmSync(vercelStaticDir, { recursive: true, force: true });
  }
  copyDir(outDir, vercelStaticDir);

  const vercelBuildOutputConfig = {
    version: 3,
    routes: [
      {
        src: "^/version-manifest\\.json$",
        headers: {
          "cache-control": "no-cache, no-store, must-revalidate",
          "access-control-allow-origin": "*"
        },
        continue: true
      },
      {
        src: "^/(.*)remoteEntry\\.js$",
        headers: {
          "cache-control": "no-cache, no-store, must-revalidate",
          "access-control-allow-origin": "*"
        },
        continue: true
      },
      {
        src: "^/(.*)$",
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          "access-control-allow-headers": "*"
        },
        continue: true
      },
      { handle: "filesystem" },
      { src: "^/apps/([^/]+)/([^/]+)/(.*)$", dest: "/apps/$1/$2/$3" },
      { src: "^/apps/([^/]+)/(.*)$", dest: "/apps/$1/$2" },
      { src: "^/.*$", dest: "/index.html" }
    ]
  };
  fs.writeFileSync(path.join(vercelOutputDir, 'config.json'), JSON.stringify(vercelBuildOutputConfig, null, 2));
  console.log('✅ Synchronized .vercel/output/static and config.json successfully!');
}
