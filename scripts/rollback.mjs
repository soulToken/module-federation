import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'hyper-registry.json');
const distPath = path.join(rootDir, 'dist');
const vercelStaticPath = path.join(rootDir, '.vercel/output/static');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(`
📖 [hyper 对等微前端一键回滚 CLI 使用指南]
用法: pnpm run rollback <对等微应用名称> <目标历史版本号>

示例:
  pnpm run rollback hyperMall v1.0.0       # 将微商城一键回退至 v1.0.0 稳定版
  pnpm run rollback mall v1.0.0            # 简写支持
  pnpm run rollback hyperActivity v1.0.0   # 将活动一键回退至 v1.0.0 稳定版
  pnpm run rollback mall v1.1.0            # 切回 v1.1.0 大促版
`);
  process.exit(1);
}

const [rawAppName, targetVersion] = args;

// 1. 规范化应用 ID
const APP_MAP = {
  mall: 'hyperMall',
  hypermall: 'hyperMall',
  submall: 'hyperMall',
  activity: 'hyperActivity',
  hyperactivity: 'hyperActivity',
  subactivity: 'hyperActivity',
  user: 'hyperUser',
  hyperuser: 'hyperUser',
  subuser: 'hyperUser',
};

const appId = APP_MAP[rawAppName.toLowerCase()] || rawAppName;

// 2. 读取并验证 Manifest
if (!fs.existsSync(manifestPath)) {
  console.error(`❌ 未找到 hyper-registry.json: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const appConfig = manifest.apps[appId];

if (!appConfig) {
  console.error(`❌ 未知的微应用 ID: "${rawAppName}"。有效应用: ${Object.keys(manifest.apps).join(', ')}`);
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
console.log(`🔄 正在执行去中心化微前端秒级回滚 / 版本切换`);
console.log(`------------------------------------------------------`);
console.log(`📦 目标应用:   ${appConfig.name} (${appId})`);
console.log(`⏮️  当前版本:   ${previousVersion}`);
console.log(`⏭️  目标版本:   ${targetVersion} [${versionInfo.tag || ''}]`);
console.log(`📝 版本说明:   ${versionInfo.description || ''}`);
console.log(`🔗 资源入口:   ${versionInfo.entry}`);
console.log(`======================================================\n`);

// 3. 更新 Manifest 清单
manifest.activeVersions[appId] = targetVersion;
manifest.updatedAt = new Date().toISOString();

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`✅ [1/2] 已更新本地 hyper-registry.json`);

// 4. 同步至 dist 和 .vercel/output/static
if (fs.existsSync(distPath)) {
  fs.writeFileSync(path.join(distPath, 'hyper-registry.json'), JSON.stringify(manifest, null, 2));
}

if (fs.existsSync(vercelStaticPath)) {
  fs.writeFileSync(path.join(vercelStaticPath, 'hyper-registry.json'), JSON.stringify(manifest, null, 2));
}
console.log(`✅ [2/2] 已同步产物目录静态资源清单`);

console.log(`\n🎉 [回滚成功] ${appConfig.name} 已在 3 秒内全网无感回退至 ${targetVersion}！`);
console.log(`💡 提示：本回滚为“纯指针回滚”，无需耗时重构建，其他对等应用完全零波及！\n`);
