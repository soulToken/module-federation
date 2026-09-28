import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'version-manifest.json');
const distPath = path.join(rootDir, 'dist');
const vercelStaticPath = path.join(rootDir, '.vercel/output/static');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(`
📖 [微前端一键回滚 CLI 使用指南]
用法: pnpm run rollback <子应用名称> <目标版本号>

示例:
  pnpm run rollback mall v1.0.0       # 将商城子应用一键回滚至 v1.0.0 稳定版
  pnpm run rollback activity v1.0.0   # 将活动子应用一键回滚至 v1.0.0 稳定版
  pnpm run rollback mall v1.1.0       # 将商城子应用切回 v1.1.0 大促版
`);
  process.exit(1);
}

const [rawAppName, targetVersion] = args;

// 1. 规范化应用 ID
const APP_MAP = {
  mall: 'subMall',
  submall: 'subMall',
  subAppMall: 'subMall',
  subMall: 'subMall',
  activity: 'subActivity',
  subactivity: 'subActivity',
  subAppActivity: 'subActivity',
  subActivity: 'subActivity',
  user: 'subUser',
  subuser: 'subUser',
  subAppUser: 'subUser',
  subUser: 'subUser',
};

const appId = APP_MAP[rawAppName.toLowerCase()] || rawAppName;

// 2. 读取并验证 Manifest
if (!fs.existsSync(manifestPath)) {
  console.error(`❌ 未找到 version-manifest.json: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const appConfig = manifest.apps[appId];

if (!appConfig) {
  console.error(`❌ 未知的子应用 ID: "${rawAppName}"。有效应用: ${Object.keys(manifest.apps).join(', ')}`);
  process.exit(1);
}

const versionInfo = appConfig.versions[targetVersion];
if (!versionInfo) {
  console.error(`❌ 版本 "${targetVersion}" 不存在于 ${appConfig.name} 中！`);
  console.error(`   可用版本: ${Object.keys(appConfig.versions).join(', ')}`);
  process.exit(1);
}

const previousVersion = manifest.activeVersions[appId];
if (previousVersion === targetVersion) {
  console.log(`⚠️  ${appConfig.name} 当前激活版本已经是 ${targetVersion}，无需重复切换。`);
  process.exit(0);
}

console.log(`\n======================================================`);
console.log(`🔄 正在执行微前端秒级回滚 / 版本切换`);
console.log(`------------------------------------------------------`);
console.log(`📦 目标应用:   ${appConfig.name} (${appId})`);
console.log(`⏮️  当前版本:   ${previousVersion}`);
console.log(`⏭️  目标版本:   ${targetVersion} [${versionInfo.tag}]`);
console.log(`📝 版本说明:   ${versionInfo.description}`);
console.log(`🔗 资源入口:   ${versionInfo.entry}`);
console.log(`======================================================\n`);

// 3. 更新 Manifest 清单
manifest.activeVersions[appId] = targetVersion;
manifest.updatedAt = new Date().toISOString();

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
const mainAppPublicManifest = path.join(rootDir, 'main-app/public/version-manifest.json');
if (fs.existsSync(mainAppPublicManifest)) {
  fs.writeFileSync(mainAppPublicManifest, JSON.stringify(manifest, null, 2));
}
console.log(`✅ [1/3] 已更新本地与主应用 version-manifest.json`);

// 4. 同步至 dist 和 .vercel/output/static
if (fs.existsSync(distPath)) {
  fs.writeFileSync(path.join(distPath, 'version-manifest.json'), JSON.stringify(manifest, null, 2));
  
  // 更新默认 fallback 目录
  const folderName = appId === 'subMall' ? 'mall' : appId === 'subActivity' ? 'activity' : 'user';
  const targetDir = path.join(distPath, `apps/${folderName}/${targetVersion}`);
  const fallbackDir = path.join(distPath, `apps/${folderName}`);
  if (fs.existsSync(targetDir)) {
    // 拷贝至根目录作为向下兼容兜底
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        fs.copyFileSync(path.join(targetDir, entry.name), path.join(fallbackDir, entry.name));
      }
    }
  }
}

if (fs.existsSync(vercelStaticPath)) {
  fs.writeFileSync(path.join(vercelStaticPath, 'version-manifest.json'), JSON.stringify(manifest, null, 2));
}
console.log(`✅ [2/3] 已同步产物目录静态资源清单`);

// 5. 极速发布至 Vercel (仅需上传清单变更，无须重编译 JS/CSS)
console.log(`🚀 [3/3] 正在秒级同步最新 Manifest 至 Vercel 全球边缘 CDN...`);
try {
  execSync('npx vercel deploy --prebuilt --prod --yes', { cwd: rootDir, stdio: 'inherit' });
  console.log(`\n🎉 [回滚成功] ${appConfig.name} 已在 5 秒内全网无感生效为 ${targetVersion}！`);
  console.log(`🌐 访问验证: https://module-federation-rosy.vercel.app\n`);
} catch (e) {
  console.error(`⚠️ Vercel 推送失败，请检查网络或执行: pnpm run deploy:vercel`, e);
}
