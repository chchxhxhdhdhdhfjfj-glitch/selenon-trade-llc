#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function fail(msg) {
  console.error(`CHECK_FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`CHECK_OK: ${msg}`);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

const configText = read('src/scripts/config.js');
const appText = read('src/scripts/app.js');
const storageText = read('src/scripts/storage.js');
const htmlText = read('index.html');
const readmeText = read('README.md');
const handoverText = read('HANDOVER_NOTES.md');
const todoText = read('DEVELOPMENT_TODO.md');
const qaText = read('QA_REGRESSION_CHECKLIST.md');
const testReportText = read('TEST_REPORT_TEMPLATE.md');
const bugLogText = read('BUG_LOG.md');
const prelaunchText = read('PRELAUNCH_CHECKLIST.md');
const adsText = read('src/scripts/ads.js');

const hasMockMode = configText.includes('mockSuccess: true');
const hasRealIaaMode = configText.includes('enabled: true')
  && configText.includes("provider: 'tiktok'")
  && configText.includes('rewarded: {')
  && configText.includes('rewarded')
  && /rewarded\s*:\s*\{[\s\S]*?enabled\s*:\s*true/.test(configText)
  && /rewarded\s*:\s*\{[\s\S]*?adUnitId\s*:\s*'[^']+'/.test(configText);

const levelsMatch = configText.match(/export const LEVELS = \[(.*?)\];/s);
const iconsMatch = configText.match(/export const ICONS = \[(.*?)\];/s);

if (!levelsMatch || !iconsMatch) {
  fail('无法解析 LEVELS 或 ICONS');
} else {
  const pairMatches = [...levelsMatch[1].matchAll(/pairs:\s*(\d+)/g)].map(m => Number(m[1]));
  const iconMatches = [...iconsMatch[1].matchAll(/'[^']+'/g)];
  const maxPairs = Math.max(...pairMatches);
  const iconCount = iconMatches.length;
  if (maxPairs > iconCount) fail(`最大 pairs=${maxPairs} 超过 ICONS 数量 ${iconCount}`);
  else ok(`LEVELS/ICONS 安全：maxPairs=${maxPairs}, iconCount=${iconCount}`);
}

const requiredIds = [
  'homeGoalCard', 'homeGoalKicker', 'homeGoalTitle', 'homeGoalDesc',
  'dailyTaskCards', 'homeTaskCountdown', 'newbieProgress',
  'finalCrown', 'finalSubtitle', 'modalChestBox', 'modalDrops'
];
requiredIds.forEach(id => {
  if (!htmlText.includes(`id="${id}"`)) fail(`index.html 缺少关键 id: ${id}`);
});
if (process.exitCode !== 1) ok('关键 DOM id 存在');

const stateKeys = [...appText.matchAll(/^\s{2}([a-zA-Z0-9_]+):/gm)].map(m => m[1]);
const saveKeys = [...storageText.matchAll(/^\s{4}([a-zA-Z0-9_]+):\s*state\./gm)].map(m => m[1]);
const missingStateForSave = saveKeys.filter(k => !stateKeys.includes(k));
if (missingStateForSave.length) fail(`app.js state 缺少已保存字段: ${missingStateForSave.join(', ')}`);
else ok('app.js 默认 state 与 storage 保存字段基本对齐');

if (!readmeText.includes('v1.0.0-memory-tower')) fail('README 未包含当前版本号');
else ok('README 已包含当前版本号');

const requiredDocs = [
  ['HANDOVER_NOTES.md', handoverText],
  ['DEVELOPMENT_TODO.md', todoText],
  ['QA_REGRESSION_CHECKLIST.md', qaText],
  ['TEST_REPORT_TEMPLATE.md', testReportText],
  ['BUG_LOG.md', bugLogText],
  ['PRELAUNCH_CHECKLIST.md', prelaunchText]
];
requiredDocs.forEach(([name, text]) => {
  if (!text || !text.trim()) fail(`${name} 缺失或为空`);
});
if (requiredDocs.every(([, text]) => text && text.trim())) ok('交接 / TODO / QA / 测试记录 / 缺陷台账 / Prelaunch 文档存在');

const versionDocs = [
  ['README.md', readmeText],
  ['HANDOVER_NOTES.md', handoverText],
  ['DEVELOPMENT_TODO.md', todoText],
  ['QA_REGRESSION_CHECKLIST.md', qaText],
  ['TEST_REPORT_TEMPLATE.md', testReportText],
  ['BUG_LOG.md', bugLogText],
  ['PRELAUNCH_CHECKLIST.md', prelaunchText]
];
const versionMissing = versionDocs.filter(([, text]) => !text.includes('v1.0.0-memory-tower')).map(([name]) => name);
if (versionMissing.length) fail(`以下文档未包含当前版本号 v1.0.0-memory-tower: ${versionMissing.join(', ')}`);
else ok('核心文档版本号一致');

const readmeNavTargets = ['HANDOVER_NOTES.md', 'DEVELOPMENT_TODO.md', 'QA_REGRESSION_CHECKLIST.md', 'TEST_REPORT_TEMPLATE.md', 'BUG_LOG.md', 'PRELAUNCH_CHECKLIST.md'];
const missingReadmeNav = readmeNavTargets.filter(name => !readmeText.includes(name));
if (missingReadmeNav.length) fail(`README 文档导航缺少: ${missingReadmeNav.join(', ')}`);
else ok('README 文档导航存在');

if (!storageText.includes('const SAVE_VERSION =')) fail('storage.js 未声明 SAVE_VERSION');
else ok('storage.js 已声明 SAVE_VERSION');

if (!storageText.includes('function migrateSave(')) fail('storage.js 未提供 migrateSave() 骨架');
else ok('storage.js 已提供 migrateSave() 骨架');

if (!configText.includes("APP_BRAND_NAME = 'Memory Tower'")) fail('config.js 未声明品牌名 Memory Tower');
else ok('品牌名配置存在');

if (!hasMockMode && !hasRealIaaMode) {
  fail('AD_CONFIG 既不是 mock 模式，也不是有效的真实 TikTok IAA 模式');
} else if (hasRealIaaMode) {
  ok('广告配置已启用真实 TikTok IAA 模式');
} else {
  ok('广告 Mock 成功模式已启用');
}

if (!adsText.includes('Mock 成功模式已启用')) fail('ads.js 未暴露 Mock 成功提示文案');
else ok('ads.js 已包含 Mock 成功提示');

if (!process.exitCode) console.log('CHECK_OK: project audit complete');
