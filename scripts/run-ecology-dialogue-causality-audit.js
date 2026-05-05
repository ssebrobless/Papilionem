const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ecology_dialogue_causality_audit');
const FRAME_COUNT = Math.max(1200, Math.round(Number(getArgValue('--frames', 7200))));
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-world-rendermode'
];

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

function matchCount(dialogues, pattern) {
  return dialogues.filter(entry => pattern.test(String(entry?.phrase || ''))).length;
}

function analyzeEcologyDialogue(dialogues = []) {
  const cleanupPattern = /\b(?:dirt|pile|piles|clean|clear|mess)\b/i;
  const plantingPattern = /\b(?:pollen|plant|flower|flowers|feed us|flowers have room)\b/i;
  const shelterPattern = /\b(?:shade|block|wall|shelter|rest\b(?!\s+of))\b/i;
  const reservePattern = /\b(?:reserve food|reserve|food|scarce|share food|share it)\b/i;
  const scoutPattern = /\b(?:scout|path|zone|come with me|show you the way)\b/i;
  const ecologyDialogues = dialogues.filter(entry =>
    cleanupPattern.test(entry.phrase || '')
    || plantingPattern.test(entry.phrase || '')
    || shelterPattern.test(entry.phrase || '')
    || reservePattern.test(entry.phrase || '')
    || scoutPattern.test(entry.phrase || '')
  );
  return {
    dialogueCount: dialogues.length,
    ecologyDialogueCount: ecologyDialogues.length,
    ecologyDialogueRatio: dialogues.length ? Number((ecologyDialogues.length / dialogues.length).toFixed(4)) : 0,
    cleanupDialogueCount: matchCount(dialogues, cleanupPattern),
    plantingDialogueCount: matchCount(dialogues, plantingPattern),
    shelterDialogueCount: matchCount(dialogues, shelterPattern),
    reserveDialogueCount: matchCount(dialogues, reservePattern),
    scoutDialogueCount: matchCount(dialogues, scoutPattern),
    cleanupSamples: dialogues.filter(entry => cleanupPattern.test(entry.phrase || '')).slice(-8).map(entry => entry.phrase),
    plantingSamples: dialogues.filter(entry => plantingPattern.test(entry.phrase || '')).slice(-8).map(entry => entry.phrase),
    shelterSamples: dialogues.filter(entry => shelterPattern.test(entry.phrase || '')).slice(-8).map(entry => entry.phrase),
    reserveSamples: dialogues.filter(entry => reservePattern.test(entry.phrase || '')).slice(-8).map(entry => entry.phrase),
    scoutSamples: dialogues.filter(entry => scoutPattern.test(entry.phrase || '')).slice(-8).map(entry => entry.phrase),
    intentTagCounts: dialogues.reduce((counts, entry) => {
      for (const tag of entry.intentTags || []) counts[tag] = (counts[tag] || 0) + 1;
      return counts;
    }, {}),
    ecologySamples: ecologyDialogues.slice(-18).map(entry => ({
      phrase: entry.phrase,
      sourceLabel: entry.sourceLabel || entry.sourceId || null,
      targetLabels: entry.targetLabels || entry.targetIds || [],
      intentFamily: entry.intentFamily || null,
      intentTags: entry.intentTags || [],
      reason: entry.metadata?.reason || entry.dialogueMetadata?.reason || null
    }))
  };
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
      if (typeof randomSeed === 'function') randomSeed(4721);
      if (typeof noiseSeed === 'function') noiseSeed(4721);
      await gameCore.resetGame?.(true);
      if (gameUI?.firstSessionGuide) gameUI.firstSessionGuide.visible = false;
      communicationSystem.history = [];
      communicationSystem.dialogueHistory = [];
      communicationSystem.responseQueue = [];
      eventBus.clearHistory?.();

      const zoneId = 'moss-hollow';
      const points = [
        { u: 8, v: 11 },
        { u: 11, v: 11 },
        { u: 14, v: 11 },
        { u: 17, v: 11 },
        { u: 20, v: 11 },
        { u: 23, v: 11 },
        { u: 8, v: 15 },
        { u: 11, v: 15 },
        { u: 14, v: 15 },
        { u: 17, v: 15 },
        { u: 20, v: 15 },
        { u: 23, v: 15 }
      ];
      while ((gameCore.gameState?.butterflies || []).length < 12) {
        const index = gameCore.gameState.butterflies.length;
        const screen = renderManager.boardToScreen({ zoneId, ...points[index % points.length], h: 0 });
        gameCore.godSpawnButterfly(screen.x, screen.y, null);
      }

      const pilePoints = [
        { u: 10, v: 13 },
        { u: 13, v: 13 },
        { u: 16, v: 13 },
        { u: 19, v: 13 }
      ];
      const dirtPileIds = [];
      for (const point of pilePoints) {
        const screen = renderManager.boardToScreen({ zoneId, ...point, h: 0 });
        const flower = gameCore.spawnFlowerAt(zoneId, screen.x, screen.y, {
          exactPoint: true,
          ignoreZoneFlowerCap: true,
          allowFlowerOverlap: true,
          persistentUntilConsumed: true,
          resourceOrigin: 'ecology-dialogue-causality'
        });
        const dirt = gameCore.transformFlowerToDirtPile?.(flower, { source: 'ecology-dialogue-causality' });
        if (dirt?.id) dirtPileIds.push(dirt.id);
      }
      const reserveScreen = renderManager.boardToScreen({ zoneId, u: 22, v: 14, h: 0 });
      const reserveFlower = gameCore.spawnFlowerAt(zoneId, reserveScreen.x, reserveScreen.y, {
        exactPoint: true,
        ignoreZoneFlowerCap: true,
        allowFlowerOverlap: true,
        persistentUntilConsumed: true,
        resourceOrigin: 'ecology-dialogue-reserve'
      });
      const reserveFood = gameCore.convertFlowerToReserveFood?.(reserveFlower, null, {
        source: 'ecology-dialogue-causality'
      });
      const blockPoints = [
        { u: 20, v: 16 },
        { u: 21, v: 16 },
        { u: 20, v: 17 }
      ];
      const blockIds = [];
      for (const point of blockPoints) {
        const screen = renderManager.boardToScreen({ zoneId, ...point, h: 0 });
        const block = gameCore.godSpawnBlock?.(zoneId, screen.x, screen.y);
        if (block?.id) blockIds.push(block.id);
      }

      const butterflies = gameCore.gameState.butterflies.slice(0, 12);
      butterflies.forEach((butterfly, index) => {
        const boardPos = { zoneId, ...points[index % points.length], h: 0 };
        const screen = renderManager.boardToScreen(boardPos);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.boardPos = boardPos;
        butterfly.x = screen.x;
        butterfly.y = screen.y - (butterfly.shadowOffset || 0);
        butterfly.lifeSim.drives.caregiving = index % 2 === 0 ? 0.94 : 0.74;
        butterfly.lifeSim.drives.selfMaintenance = index % 3 === 0 ? 0.92 : 0.7;
        butterfly.lifeSim.drives.rest = index % 4 === 0 ? 0.88 : (butterfly.lifeSim.drives.rest || 0.45);
        butterfly.lifeSim.emotions.exhaustion = index % 4 === 0 ? 0.86 : (butterfly.lifeSim.emotions.exhaustion || 0.2);
        butterfly.lifeSim.drives.socialConnection = 0.72;
        butterfly.lifeSim.social.belonging = index % 4 === 0 ? 0.35 : 0.5;
        if (index < 3) {
          butterfly.pollenInventory = {
            charges: index === 0 ? 2 : 1,
            maxCharges: 2,
            expiresAtFrame: gameCore.getCurrentFrame?.() + 7200
          };
        }
        butterfly.lifeSim.objectAwareness = butterfly.lifeSim.objectAwareness || {};
        butterfly.lifeSim.objectAwareness.dirtPileCount = dirtPileIds.length;
        butterfly.lifeSim.objectAwareness.pollenFamiliarity = index < 3 ? 1 : (butterfly.lifeSim.objectAwareness.pollenFamiliarity || 0);
        butterfly.syncDebugGridPos?.();
      });

      for (let sample = 0; sample < 6; sample += 1) {
        communicationSystem.updateEcologyWorkCommunication?.(gameCore.gameState, 90 * (sample + 1), {
          force: true,
          ignoreMigration: true,
          maxSignals: 4
        });
        gameCore.update?.();
      }

      const previousScoutDiscovery = gameConfig?.world?.scoutDiscovery;
      if (gameConfig?.world) gameConfig.world.scoutDiscovery = false;
      const ecologyFrames = Math.max(600, Math.floor(frameCount * 0.55));
      for (let frame = 0; frame < ecologyFrames; frame += 1) {
        gameCore.update?.();
      }
      if (gameConfig?.world) gameConfig.world.scoutDiscovery = previousScoutDiscovery !== false;
      for (let frame = ecologyFrames; frame < frameCount; frame += 1) {
        gameCore.update?.();
      }
      if (gameConfig?.world) gameConfig.world.scoutDiscovery = previousScoutDiscovery;

      return {
        currentFrame: gameCore.getCurrentFrame?.() || frameCount,
        butterflyCount: gameCore.gameState?.butterflies?.length || 0,
        dirtPileCount: (gameCore.gameState?.flowers || []).filter(flower => flower.lifecycleKind === 'dirt-pile').length,
        reserveFoodCount: (gameCore.gameState?.flowers || []).filter(flower => flower.lifecycleKind === 'reserve-food-ball').length,
        blockCount: blockIds.length,
        dirtPileIds,
        reserveFoodId: reserveFood?.id || null,
        blockIds,
        dialogueHistory: JSON.parse(JSON.stringify(communicationSystem.dialogueHistory || []))
      };
    }, FRAME_COUNT);

    report.browserSummary = {
      currentFrame: browserResult.currentFrame,
      butterflyCount: browserResult.butterflyCount,
      dirtPileCount: browserResult.dirtPileCount,
      reserveFoodCount: browserResult.reserveFoodCount,
      blockCount: browserResult.blockCount,
      dialogueCount: browserResult.dialogueHistory.length
    };
    report.ecologyDialogue = analyzeEcologyDialogue(browserResult.dialogueHistory);
    report.screenshot = path.join(outputDir, 'ecology-dialogue-causality.png');
    await page.screenshot({ path: report.screenshot, fullPage: true });
    await restoreStorage(page, initialStorage);

    report.checks.push({
      name: 'browser-clean',
      pass: report.pageErrors.length === 0 && report.consoleErrors.length === 0,
      details: { pageErrors: report.pageErrors, consoleErrors: report.consoleErrors }
    });
    report.checks.push({
      name: 'dialogue-captured',
      pass: report.ecologyDialogue.dialogueCount >= 20,
      details: { dialogueCount: report.ecologyDialogue.dialogueCount }
    });
    report.checks.push({
      name: 'cleanup-dialogue-produced',
      pass: report.ecologyDialogue.cleanupDialogueCount >= 1,
      details: { cleanupDialogueCount: report.ecologyDialogue.cleanupDialogueCount }
    });
    report.checks.push({
      name: 'pollen-dialogue-produced',
      pass: report.ecologyDialogue.plantingDialogueCount >= 1,
      details: { plantingDialogueCount: report.ecologyDialogue.plantingDialogueCount }
    });
    report.checks.push({
      name: 'reserve-food-dialogue-produced',
      pass: report.ecologyDialogue.reserveDialogueCount >= 1,
      details: { reserveDialogueCount: report.ecologyDialogue.reserveDialogueCount }
    });
    report.checks.push({
      name: 'shade-rest-dialogue-produced',
      pass: report.ecologyDialogue.shelterDialogueCount >= 1,
      details: { shelterDialogueCount: report.ecologyDialogue.shelterDialogueCount }
    });
    report.checks.push({
      name: 'ecology-dialogue-ratio',
      pass: report.ecologyDialogue.ecologyDialogueRatio >= 0.18,
      details: { ecologyDialogueRatio: report.ecologyDialogue.ecologyDialogueRatio }
    });
    report.checks.push({
      name: 'multiple-ecology-lanes-visible',
      pass: [
        report.ecologyDialogue.cleanupDialogueCount,
        report.ecologyDialogue.plantingDialogueCount,
        report.ecologyDialogue.shelterDialogueCount,
        report.ecologyDialogue.reserveDialogueCount,
        report.ecologyDialogue.scoutDialogueCount
      ].filter(count => count > 0).length >= 4,
      details: {
        cleanupDialogueCount: report.ecologyDialogue.cleanupDialogueCount,
        plantingDialogueCount: report.ecologyDialogue.plantingDialogueCount,
        shelterDialogueCount: report.ecologyDialogue.shelterDialogueCount,
        reserveDialogueCount: report.ecologyDialogue.reserveDialogueCount,
        scoutDialogueCount: report.ecologyDialogue.scoutDialogueCount
      }
    });

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
      reportPath,
      checks: report.checks.map(check => ({ name: check.name, pass: check.pass })),
      ecologyDialogue: report.ecologyDialogue || null
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run();
