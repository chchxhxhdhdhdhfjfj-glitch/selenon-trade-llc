#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function domClick(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { ok: false, reason: 'missing' };
    el.click();
    return { ok: true };
  }, selector);
}

async function capture(page, outDir, name) {
  await page.screenshot({ path: path.join(outDir, name), fullPage: true });
}

(async () => {
  const projectRoot = process.argv[2] || process.cwd();
  const outDir = process.argv[3] || path.join(projectRoot, 'tmp_round4');
  const targetUrl = process.argv[4] || 'http://127.0.0.1:18080/index.html';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });

  const events = [];
  const record = (name, status, note = '') => events.push({ name, status, note });

  page.on('pageerror', err => record('pageerror', 'warn', String(err)));
  page.on('console', msg => {
    if (msg.type() === 'error') record('console-error', 'warn', msg.text());
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 20000 });
  } catch (err) {
    record('home-load', 'fail', `goto failed: ${String(err)}`);
    fs.writeFileSync(path.join(outDir, 'round4-result.json'), JSON.stringify({
      generatedAt: new Date().toISOString(),
      targetUrl,
      events
    }, null, 2));
    await browser.close();
    process.exit(1);
  }

  await capture(page, outDir, '01-home.png');
  record('home-load', 'pass', await page.title());

  const startResult = await domClick(page, '#btnStart');
  record('start-click', startResult?.ok ? 'pass' : 'fail', JSON.stringify(startResult));
  await sleep(1200);
  await capture(page, outDir, '02-start-game.png');
  const gameState = await page.evaluate(() => ({
    hasBackHome: !!document.querySelector('#btnHomeBack'),
    hasRestart: !!document.querySelector('#btnRestartLevel'),
    bodyText: document.body.innerText,
    cards: document.querySelectorAll('#board .card, #gameBoard .card').length
  }));
  record('start-game', (gameState.hasBackHome || gameState.bodyText.includes('返回首页')) ? 'pass' : 'fail', JSON.stringify(gameState));

  const toolSelectors = [
    ['tool-hint', '#btnHintBoost'],
    ['tool-reveal-pair', '#btnRevealPair'],
    ['tool-preview', '#btnPreviewBoost'],
    ['tool-shuffle', '#btnShuffleBoost'],
    ['tool-shield', '#btnShieldBoost'],
    ['tool-freeze', '#btnFreezeBoost'],
    ['tool-life', '#btnBuyLife'],
    ['tool-reward-lives', '#btnRewardLives']
  ];

  for (const [name, selector] of toolSelectors) {
    const exists = await page.$(selector);
    if (!exists) {
      record(name, 'fail', `${selector} missing`);
      continue;
    }
    const clickResult = await domClick(page, selector);
    await sleep(600);
    record(name, clickResult?.ok ? 'pass' : 'warn', JSON.stringify(clickResult));
  }

  await capture(page, outDir, '03-after-tools.png');

  const restartClick = await domClick(page, '#btnRestartLevel');
  record('restart-click', restartClick?.ok ? 'pass' : 'warn', JSON.stringify(restartClick));
  await sleep(900);
  await capture(page, outDir, '04-after-restart.png');
  const restartState = await page.evaluate(() => ({
    cards: document.querySelectorAll('#board .card, #gameBoard .card').length,
    text: document.body.innerText.slice(0, 300)
  }));
  record('restart-level', restartState.cards > 0 ? 'pass' : 'warn', JSON.stringify(restartState));

  const backResult = await domClick(page, '#btnHomeBack');
  record('back-click', backResult?.ok ? 'pass' : 'warn', JSON.stringify(backResult));
  await sleep(500);
  await capture(page, outDir, '05-back-home.png');
  const backHome = await page.evaluate(() => document.body.innerText.includes('立即开玩'));
  record('back-home', backHome ? 'pass' : 'fail');

  const timedModeClick = await domClick(page, '#btnModeTimed');
  record('timed-mode-click', timedModeClick?.ok ? 'pass' : 'warn', JSON.stringify(timedModeClick));
  await sleep(200);
  const timedStart = await domClick(page, '#btnStart');
  record('timed-start-click', timedStart?.ok ? 'pass' : 'warn', JSON.stringify(timedStart));
  await sleep(1200);
  await capture(page, outDir, '06-timed-mode.png');
  const timedState = await page.evaluate(() => ({
    active: document.querySelector('#btnModeTimed')?.classList.contains('active'),
    text: document.body.innerText,
    timerVisible: !!document.querySelector('#timerBox') && getComputedStyle(document.querySelector('#timerBox')).display !== 'none'
  }));
  record('timed-mode-enter', timedState.active ? 'pass' : 'warn', JSON.stringify(timedState));

  const result = {
    generatedAt: new Date().toISOString(),
    targetUrl,
    events
  };
  fs.writeFileSync(path.join(outDir, 'round4-result.json'), JSON.stringify(result, null, 2));
  await browser.close();
})();
