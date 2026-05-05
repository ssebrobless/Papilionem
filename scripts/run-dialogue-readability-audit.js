const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'dialogue_readability_audit');
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-world-rendermode'
];
const FRAME_COUNT = Math.max(600, Math.round(Number(getArgValue('--frames', 7200))));
const SAMPLE_LIMIT = Math.max(10, Math.round(Number(getArgValue('--sample-limit', 40))));

function getArgValue(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function ensureServer(report) {
  const reachable = await fetch(URL).then(() => true).catch(() => false);
  if (reachable) {
    report.server = { reused: true, pid: null };
    return;
  }
  const { spawn } = require('child_process');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  report.server = { reused: false, pid: child.pid };
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ok = await fetch(URL).then(() => true).catch(() => false);
    if (ok) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Server did not become reachable in time');
}

async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, {
    timeout: 30000
  });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(900);
}

function fingerprint(text = '') {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function analyzeDialogue(dialogues = []) {
  const atmosphericPattern = /\b(?:air|wind|breeze|hush|shifted|shiver|echo|covered edge|edge turned|light changed)\b/i;
  const systemPattern = /\b(?:grid|cell|runtime|telemetry|packet|frame|affordance|schema|debug)\b/i;
  const socialPattern = /\b(?:you|we|us|me|i|help|stay|follow|share|rest|close|together|bring|plant|clean|carry|move|watch|wait|safe|thank|need)\b/i;
  const taskPattern = /\b(?:flower|pollen|food|block|shade|shelter|dirt|pile|plant|clean|carry|bring|rest|scout|zone|wall)\b/i;
  const phraseCounts = {};
  const pairCounts = {};
  const intentCounts = {};
  const atmospheric = [];
  const systemLike = [];
  const social = [];
  const task = [];

  for (const dialogue of dialogues) {
    const phrase = String(dialogue?.phrase || '').trim();
    const key = fingerprint(phrase);
    if (!phrase) continue;
    phraseCounts[key] = (phraseCounts[key] || 0) + 1;
    const targetId = Array.isArray(dialogue.targetIds) ? dialogue.targetIds[0] : null;
    const pairKey = `${dialogue.sourceId || 'unknown'}->${targetId || 'all'}`;
    pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
    const intent = dialogue.intentFamily || dialogue.intent || dialogue.sourceSignalType || 'unknown';
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    if (atmosphericPattern.test(phrase)) atmospheric.push(dialogue);
    if (systemPattern.test(phrase)) systemLike.push(dialogue);
    if (socialPattern.test(phrase)) social.push(dialogue);
    if (taskPattern.test(phrase)) task.push(dialogue);
  }

  const count = dialogues.length;
  const uniqueCount = Object.keys(phraseCounts).length;
  const repeatedPhrases = Object.entries(phraseCounts)
    .filter(([, value]) => value > 1)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12)
    .map(([phrase, count]) => ({ phrase, count }));
  return {
    dialogueCount: count,
    uniquePhraseCount: uniqueCount,
    uniquePhraseRatio: count ? Number((uniqueCount / count).toFixed(4)) : 0,
    pairCount: Object.keys(pairCounts).length,
    intentCounts,
    socialLanguageCount: social.length,
    socialLanguageRatio: count ? Number((social.length / count).toFixed(4)) : 0,
    taskLanguageCount: task.length,
    taskLanguageRatio: count ? Number((task.length / count).toFixed(4)) : 0,
    atmosphericCount: atmospheric.length,
    atmosphericRatio: count ? Number((atmospheric.length / count).toFixed(4)) : 0,
    systemLikeCount: systemLike.length,
    systemLikeRatio: count ? Number((systemLike.length / count).toFixed(4)) : 0,
    repeatedPhrases,
    atmosphericSamples: atmospheric.slice(-10).map(entry => entry.phrase),
    systemLikeSamples: systemLike.slice(-10).map(entry => entry.phrase),
    recentSamples: dialogues.slice(-SAMPLE_LIMIT).map(entry => ({
      phrase: entry.phrase,
      sourceLabel: entry.sourceLabel || entry.sourceId || null,
      targetLabels: entry.targetLabels || entry.targetIds || [],
      intentFamily: entry.intentFamily || null,
      intentTags: entry.intentTags || []
    }))
  };
}

async function captureStorage(page) {
  return page.evaluate(keys => keys.reduce((snapshot, key) => {
    snapshot[key] = window.localStorage.getItem(key);
    return snapshot;
  }, {}), STORAGE_KEYS);
}

async function restoreStorage(page, snapshot) {
  await page.evaluate(({ keys, snapshot: stored }) => {
    for (const key of keys) {
      if (stored[key] == null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, stored[key]);
    }
  }, { keys: STORAGE_KEYS, snapshot });
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);
  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    url: URL,
    frameCount: FRAME_COUNT,
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    checks: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let page;
  let initialStorage = null;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error?.message || error)));
    page.on('console', message => {
      if (message.type() === 'error') report.consoleErrors.push(message.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    initialStorage = await captureStorage(page);
    await page.evaluate(keys => {
      keys.forEach(key => window.localStorage.removeItem(key));
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    }, STORAGE_KEYS);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    const browserResult = await page.evaluate(async frameCount => {
      if (typeof randomSeed === 'function') randomSeed(4511);
      if (typeof noiseSeed === 'function') noiseSeed(4511);
      await gameCore.resetGame?.(true);
      if (gameUI?.firstSessionGuide) gameUI.firstSessionGuide.visible = false;
      communicationSystem.history = [];
      communicationSystem.dialogueHistory = [];
      communicationSystem.responseQueue = [];
      eventBus.clearHistory?.();
      for (let attempt = 0; attempt < 180 && (gameCore.getGameState?.()?.butterflies?.length || 0) < 6; attempt += 1) {
        gameCore.update?.();
      }
      for (let frame = 0; frame < frameCount; frame += 1) {
        gameCore.update?.();
      }
      return {
        currentFrame: gameCore.getCurrentFrame?.() || frameCount,
        butterflyCount: gameCore.getGameState?.()?.butterflies?.length || 0,
        dialogueHistory: JSON.parse(JSON.stringify(communicationSystem.dialogueHistory || []))
      };
    }, FRAME_COUNT);

    report.browserSummary = {
      currentFrame: browserResult.currentFrame,
      butterflyCount: browserResult.butterflyCount,
      dialogueCount: browserResult.dialogueHistory.length
    };
    report.readability = analyzeDialogue(browserResult.dialogueHistory);
    report.screenshot = path.join(outputDir, 'dialogue-readability.png');
    await page.screenshot({ path: report.screenshot, fullPage: true });
    await restoreStorage(page, initialStorage);

    report.checks.push({
      name: 'browser-clean',
      pass: report.pageErrors.length === 0 && report.consoleErrors.length === 0,
      details: { pageErrors: report.pageErrors, consoleErrors: report.consoleErrors }
    });
    report.checks.push({
      name: 'dialogue-captured',
      pass: report.readability.dialogueCount >= 20,
      details: { dialogueCount: report.readability.dialogueCount }
    });
    report.checks.push({
      name: 'readability-classified',
      pass: true,
      details: {
        socialLanguageRatio: report.readability.socialLanguageRatio,
        taskLanguageRatio: report.readability.taskLanguageRatio,
        atmosphericRatio: report.readability.atmosphericRatio,
        systemLikeRatio: report.readability.systemLikeRatio,
        uniquePhraseRatio: report.readability.uniquePhraseRatio
      }
    });
    report.readabilityVerdict = report.readability.socialLanguageRatio >= 0.55
      && report.readability.atmosphericRatio <= 0.15
      && report.readability.systemLikeRatio <= 0.05
      && report.readability.uniquePhraseRatio >= 0.35
      ? 'pass'
      : 'residual';
    report.overall = report.checks.every(check => check.pass) ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
    if (page && initialStorage) await restoreStorage(page, initialStorage).catch(() => {});
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      readabilityVerdict: report.readabilityVerdict || null,
      reportPath,
      checks: report.checks.map(check => ({ name: check.name, pass: check.pass }))
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run();
