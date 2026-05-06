const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ecology_ui_causality_audit');
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-world-rendermode'
];

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

function addCheck(report, name, pass, details = {}) {
  report.checks.push({ name, pass: !!pass, details });
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

    const browserResult = await page.evaluate(async () => {
      if (typeof randomSeed === 'function') randomSeed(7301);
      if (typeof noiseSeed === 'function') noiseSeed(7301);
      await gameCore.resetGame?.(true);
      if (gameUI?.firstSessionGuide) gameUI.firstSessionGuide.visible = false;
      gameUI.activityLogPanel.visible = true;
      gameUI.activityLogPanel.followLatest = true;
      gameUI.activityLogPanel.filters = {
        talk: true,
        action: true,
        learn: true,
        warning: true,
        system: true
      };
      gameUI.activityLogCache = { key: null, entries: [] };
      eventBus.clearHistory?.();
      communicationSystem.history = [];
      communicationSystem.dialogueHistory = [];
      communicationSystem.responseQueue = [];

      const zoneId = 'moss-hollow';
      gameCore.focusZone?.(zoneId);
      while ((gameCore.gameState?.butterflies || []).length < 2) {
        const index = gameCore.gameState.butterflies.length;
        const board = { zoneId, u: 12 + (index * 2), v: 12, h: 0 };
        const screen = renderManager.boardToScreen(board);
        gameCore.godSpawnButterfly(screen.x, screen.y, null);
      }
      const [actor, partner] = gameCore.gameState.butterflies.slice(0, 2);
      [actor, partner].forEach((entity, index) => {
        const board = { zoneId, u: 12 + (index * 2), v: 12, h: 0 };
        const screen = renderManager.boardToScreen(board);
        entity.currentZoneId = zoneId;
        entity.lifeSim.lifecycle.currentZoneId = zoneId;
        entity.boardPos = board;
        entity.x = screen.x;
        entity.y = screen.y - (entity.shadowOffset || 0);
        entity.state = 'normal';
        entity.zoneTravel = null;
        entity.syncDebugGridPos?.();
      });
      lifeSimSystem?.ensureLifeSimState?.(actor);
      lifeSimSystem?.ensureLifeSimState?.(partner);
      ensureLifeSocialEdge?.(actor, partner.id);
      ensureLifeSocialEdge?.(partner, actor.id);

      const dialogue = communicationSystem.createDialogueRecord({
        signalType: 'guidance_signal',
        sourceZoneId: zoneId,
        createdAtSeconds: 30
      }, partner, [actor], {
        id: 'env73_ecology_guidance',
        timestamp: Date.now(),
        createdAtSeconds: 30,
        phrase: 'Plant this pollen before it fades. I will keep the square clear with you.',
        talkMode: 'single_target',
        targetIds: [actor.id],
        targetLabels: [communicationSystem.getEntityLabel(actor)],
        intentFamily: 'task',
        intentTags: ['guidance', 'coordination', 'pollen', 'planting'],
        responseExpected: false
      });
      communicationSystem.emitDialogue(dialogue, [actor]);

      actor.pollenInventory = {
        charges: 1,
        maxCharges: 2,
        expiresAtFrame: gameCore.getCurrentFrame?.() + 7200,
        sourceFlowerTypes: ['audit-pollen'],
        lastUpdatedFrame: gameCore.getCurrentFrame?.() || 0
      };
      const targetBoard = { zoneId, u: 16, v: 12, h: 0 };
      const targetScreen = renderManager.boardToScreen(targetBoard);
      actor.pendingPollenDropTarget = {
        x: targetScreen.x,
        y: targetScreen.y,
        zoneId
      };
      behaviorSystem?.assignAction?.(actor, 'work', 'pollen-planting', null, {
        reason: 'planting-pollen-from-earlier-talk',
        priorityScore: 88,
        overrideDurationSeconds: 30
      });

      const inspectBefore = gameUI.buildInspectDetailDomState(actor, gameCore.getGameState?.());
      const inspectBeforeLines = (inspectBefore?.sections || []).flatMap(section =>
        (section.lines || []).map(line => String(line || ''))
      );
      const completed = gameCore.completePollenDrop?.(actor) === true;
      behaviorSystem?.assignAction?.(actor, 'work', 'pollen-planting', null, {
        reason: 'planting-pollen-from-earlier-talk',
        priorityScore: 88,
        overrideDurationSeconds: 30
      });
      gameUI.activityLogCache = { key: null, entries: [] };
      const feedEntries = gameUI.getRecentActivityEntries?.() || [];
      const plantedEntry = feedEntries.find(entry => /^pollen:planted\b/.test(entry?.signature || '')) || null;
      const inspectAfter = gameUI.buildInspectDetailDomState(actor, gameCore.getGameState?.());
      const inspectAfterLines = (inspectAfter?.sections || []).flatMap(section =>
        (section.lines || []).map(line => String(line || ''))
      );
      return {
        actorId: actor.id,
        actorLabel: communicationSystem.getEntityLabel(actor),
        partnerId: partner.id,
        completed,
        pendingPlantingCount: gameCore.gameState?.pendingPollenPlantings?.length || 0,
        inspectBeforeLines: inspectBeforeLines.filter(line => /Acting because/i.test(line)),
        inspectAfterLines: inspectAfterLines.filter(line => /Acting because/i.test(line)),
        plantedEntry,
        feedEntries: feedEntries.slice(-8)
      };
    });

    report.browserResult = browserResult;
    report.screenshot = path.join(outputDir, 'ecology-ui-causality.png');
    await page.screenshot({ path: report.screenshot, fullPage: true });
    await restoreStorage(page, initialStorage);

    addCheck(report, 'browser-clean', report.pageErrors.length === 0 && report.consoleErrors.length === 0, {
      pageErrors: report.pageErrors,
      consoleErrors: report.consoleErrors
    });
    addCheck(report, 'pollen-action-completed', browserResult.completed === true, {
      completed: browserResult.completed,
      pendingPlantingCount: browserResult.pendingPlantingCount
    });
    addCheck(report, 'inspect-causality-before-action', browserResult.inspectBeforeLines.some(line =>
      /Acting because/i.test(line) && /pollen|earlier talk/i.test(line)
    ), {
      lines: browserResult.inspectBeforeLines
    });
    addCheck(report, 'inspect-causality-after-action', browserResult.inspectAfterLines.some(line =>
      /Acting because/i.test(line) && /pollen|earlier talk/i.test(line)
    ), {
      lines: browserResult.inspectAfterLines
    });
    addCheck(report, 'feed-action-causality-tail', /^Because /i.test(browserResult.plantedEntry?.consequenceTail || ''), {
      plantedEntry: browserResult.plantedEntry
    });
    addCheck(report, 'feed-and-inspect-share-actor-cause', [
      browserResult.plantedEntry?.headline || '',
      browserResult.plantedEntry?.consequenceTail || '',
      ...(browserResult.inspectBeforeLines || []),
      ...(browserResult.inspectAfterLines || [])
    ].some(line => /pollen/i.test(line)), {
      actorLabel: browserResult.actorLabel,
      plantedEntry: browserResult.plantedEntry,
      inspectBeforeLines: browserResult.inspectBeforeLines,
      inspectAfterLines: browserResult.inspectAfterLines
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
      checks: report.checks,
      browserResult: report.browserResult || null
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run();
