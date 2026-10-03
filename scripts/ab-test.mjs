import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'hyper-registry.json');
const distPath = path.join(rootDir, 'dist');
const vercelStaticPath = path.join(rootDir, '.vercel/output/static');

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

// 1. 读取 Manifest
if (!fs.existsSync(manifestPath)) {
  console.error(`❌ 未找到 hyper-registry.json: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
if (!manifest.experiments) {
  manifest.experiments = {};
}

const args = process.argv.slice(2);

// 若无参数，打印当前所有对等应用的 A/B 实验状态总览
if (args.length === 0) {
  console.log(`\n======================================================`);
  console.log(`🧪 hyper 对等微前端 A/B 流量实验与金丝雀灰度控制台 (CLI)`);
  console.log(`======================================================`);

  for (const [appId, exp] of Object.entries(manifest.experiments)) {
    const appConfig = manifest.apps[appId];
    console.log(`\n📦 对等微应用: ${appConfig?.name || appId} (${appId})`);
    console.log(`   🏷️ 实验名称: ${exp.name}`);
    console.log(`   ⚡ 运行状态: ${exp.enabled ? '🟢 实验运行中' : '⚪ 实验已暂停'}`);
    console.log(`   🎯 核心指标: ${exp.metric || '未设置'}`);
    console.log(`   📊 流量分流:`);
    for (const b of exp.buckets) {
      console.log(`      • [${b.group}组] ${b.name} (${b.version}) -> 权重: ${b.weight}%`);
    }
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`📖 命令行快捷用法:`);
  console.log(`   pnpm run ab-test <app> on            # 开启实验 (如: pnpm run ab-test mall on)`);
  console.log(`   pnpm run ab-test <app> off           # 暂停实验 (如: pnpm run ab-test mall off)`);
  console.log(`   pnpm run ab-test <app> <A比重:B比重> # 调节流量比例 (如: pnpm run ab-test mall 80:20)`);
  console.log(`   pnpm run ab-test <app> 50:50         # 标准对半实验`);
  console.log(`   pnpm run ab-test <app> 0:100         # 全量推全 B 组`);
  console.log(`======================================================\n`);
  process.exit(0);
}

const [rawAppName, actionOrRatio] = args;
const appId = APP_MAP[rawAppName.toLowerCase()] || rawAppName;
const exp = manifest.experiments[appId];

if (!exp) {
  console.error(`❌ 未找到应用 "${rawAppName}" 的 A/B 实验配置！`);
  console.error(`   可用实验应用: ${Object.keys(manifest.experiments).join(', ')}`);
  process.exit(1);
}

const appConfig = manifest.apps[appId];
let updatedSummary = '';

if (actionOrRatio === 'on' || actionOrRatio === 'enable') {
  exp.enabled = true;
  updatedSummary = `🟢 已开启 ${appConfig.name} 的 A/B 实验: [${exp.name}]`;
} else if (actionOrRatio === 'off' || actionOrRatio === 'disable') {
  exp.enabled = false;
  updatedSummary = `⚪ 已暂停 ${appConfig.name} 的 A/B 实验，全网回退至默认版本`;
} else if (actionOrRatio.includes(':')) {
  const parts = actionOrRatio.split(':').map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [wA, wB] = parts;
    exp.enabled = true;
    if (exp.buckets[0]) exp.buckets[0].weight = wA;
    if (exp.buckets[1]) exp.buckets[1].weight = wB;
    updatedSummary = `📊 已调整 ${appConfig.name} 流量分配为 A组:${wA}% / B组:${wB}%`;
  } else {
    console.error(`❌ 比例格式不合法，请输入类似 50:50 或 80:20`);
    process.exit(1);
  }
} else {
  console.error(`❌ 未知操作 "${actionOrRatio}"。支持: on, off, 50:50, 80:20, 20:80 等`);
  process.exit(1);
}

manifest.updatedAt = new Date().toISOString();

// 保存到本地
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
if (fs.existsSync(distPath)) {
  fs.writeFileSync(path.join(distPath, 'hyper-registry.json'), JSON.stringify(manifest, null, 2));
}
if (fs.existsSync(vercelStaticPath)) {
  fs.writeFileSync(path.join(vercelStaticPath, 'hyper-registry.json'), JSON.stringify(manifest, null, 2));
}

console.log(`\n======================================================`);
console.log(`🚀 ${updatedSummary}`);
console.log(`------------------------------------------------------`);
console.log(`📦 目标应用:   ${appConfig.name} (${appId})`);
console.log(`⚡ 实验状态:   ${exp.enabled ? '🟢 运行中' : '⚪ 已暂停'}`);
console.log(`📊 当前分布:   ${exp.buckets.map(b => `${b.group}组:${b.weight}%(${b.version})`).join('  |  ')}`);
console.log(`======================================================\n`);
