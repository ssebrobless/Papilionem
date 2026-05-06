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
      if (typeof randomSeed === 'function') randomSeed(7401);
      if (typeof noiseSeed === 'function') noiseSeed(7401);
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
      const currentFrame = () => gameCore.getCurrentFrame?.() || (typeof frameCount === 'number' ? frameCount : 0) || 0;
      const boardToScreen = board => renderManager.boardToScreen(board);
      const placeEntityAtBoard = (entity, u, v) => {
        const board = { zoneId, u, v, h: 0 };
        const screen = boardToScreen(board);
        entity.currentZoneId = zoneId;
        entity.lifeSim.lifecycle.currentZoneId = zoneId;
        entity.boardPos = board;
        entity.x = screen.x;
        entity.y = screen.y - (entity.shadowOffset || 0);
        entity.state = 'normal';
        entity.zoneTravel = null;
        entity.targetFlower = null;
        entity.targetCleanupPile = null;
        entity.pendingPollenDropTarget = null;
        entity.ecologyRestTarget = null;
        entity.blockInteraction = entity.blockInteraction || {};
        entity.blockInteraction.carryingBlockId = null;
        entity.movement?.clearTarget?.('audit-reset');
        entity.syncDebugGridPos?.();
        lifeSimSystem?.ensureLifeSimState?.(entity);
        entity.lifeSim.drives.selfMaintenance = Math.max(entity.lifeSim.drives.selfMaintenance || 0, 0.9);
        return { board, screen };
      };
      const inspectLinesFor = entity => {
        const inspect = gameUI.buildInspectDetailDomState(entity, gameCore.getGameState?.());
        return (inspect?.sections || []).flatMap(section =>
          (section.lines || []).map(line => String(line || ''))
        ).filter(line => /Acting because/i.test(line));
      };
      const refreshFeedEntries = () => {
        gameUI.activityLogCache = { key: null, entries: [] };
        return gameUI.getRecentActivityEntries?.() || [];
      };
      const latestEntry = (entries, eventName) => {
        const matches = entries.filter(entry => entry?.event === eventName || String(entry?.signature || '').startsWith(`${eventName}|`));
        return matches[matches.length - 1] || null;
      };

      while ((gameCore.gameState?.butterflies || []).length < 3) {
        const index = gameCore.gameState.butterflies.length;
        const screen = boardToScreen({ zoneId, u: 12 + (index * 2), v: 12, h: 0 });
        gameCore.godSpawnButterfly(screen.x, screen.y, null);
      }
      const [actor, partner, builder] = gameCore.gameState.butterflies.slice(0, 3);
      placeEntityAtBoard(actor, 12, 12);
      placeEntityAtBoard(partner, 14, 12);
      placeEntityAtBoard(builder, 20, 12);
      ensureLifeSocialEdge?.(actor, partner.id);
      ensureLifeSocialEdge?.(partner, actor.id);

      const dialogue = communicationSystem.createDialogueRecord({
        signalType: 'guidance_signal',
        sourceZoneId: zoneId,
        createdAtSeconds: 30
      }, partner, [actor], {
        id: 'env74_ecology_guidance',
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
        expiresAtFrame: currentFrame() + 7200,
        sourceFlowerTypes: ['audit-pollen'],
        lastUpdatedFrame: currentFrame()
      };
      const pollenBoard = { zoneId, u: 16, v: 12, h: 0 };
      const pollenScreen = boardToScreen(pollenBoard);
      actor.pendingPollenDropTarget = {
        x: pollenScreen.x,
        y: pollenScreen.y,
        zoneId
      };
      behaviorSystem?.assignAction?.(actor, 'work', 'pollen-planting', null, {
        reason: 'planting-pollen-from-earlier-talk',
        priorityScore: 88,
        overrideDurationSeconds: 30
      });

      const pollenInspectBefore = inspectLinesFor(actor);
      const pollenCompleted = gameCore.completePollenDrop?.(actor) === true;
      behaviorSystem?.assignAction?.(actor, 'work', 'pollen-planting', null, {
        reason: 'planting-pollen-from-earlier-talk',
        priorityScore: 88,
        overrideDurationSeconds: 30
      });
      const pollenFeed = refreshFeedEntries();
      const plantedEntry = latestEntry(pollenFeed, 'pollen:planted');
      const pollenInspectAfter = inspectLinesFor(actor);

      const cleanupBoard = { zoneId, u: 18, v: 12, h: 0 };
      const cleanupScreen = boardToScreen(cleanupBoard);
      const flower = gameCore.spawnFlowerAt(zoneId, cleanupScreen.x, cleanupScreen.y, {
        exactPoint: true,
        preferredPoint: cleanupScreen,
        minDistance: 0,
        maxAttempts: 1,
        ignoreZoneFlowerCap: true,
        allowFlowerOverlap: true,
        ignoreObjectIds: []
      });
      const dirtPile = gameCore.transformFlowerToDirtPile?.(flower, { source: 'ecology-ui-causality' }) || flower;
      placeEntityAtBoard(actor, 18.1, 12);
      actor.targetCleanupPile = dirtPile;
      actor.lifeSim.objectAwareness = {
        ...(actor.lifeSim.objectAwareness || {}),
        currentAffordance: 'clean'
      };
      actor.movement?.setBoardTarget?.(cleanupBoard.u, cleanupBoard.v, 'cleanup', 8, 0);
      behaviorSystem?.assignAction?.(actor, 'work', 'cleanup', dirtPile?.id || null, {
        reason: 'cleaning-dirty-ground-for-planting',
        priorityScore: 88,
        overrideDurationSeconds: 30
      });
      const cleanupInspectBefore = inspectLinesFor(actor);
      const cleanupCompleted = dirtPile?.tryCleanupDirtPile?.([actor]) === true;
      behaviorSystem?.assignAction?.(actor, 'work', 'cleanup', dirtPile?.id || null, {
        reason: 'cleaning-dirty-ground-for-planting',
        priorityScore: 88,
        overrideDurationSeconds: 30
      });
      actor.targetCleanupPile = dirtPile;
      actor.movement?.setBoardTarget?.(cleanupBoard.u, cleanupBoard.v, 'cleanup', 8, 0);
      const cleanupFeed = refreshFeedEntries();
      const cleanupEntry = latestEntry(cleanupFeed, 'ecology:cleanup-object-cleaned');
      const cleanupInspectAfter = inspectLinesFor(actor);

      const shadeBoard = { zoneId, u: 22, v: 12, h: 0 };
      const shadeScreen = boardToScreen(shadeBoard);
      placeEntityAtBoard(builder, 22.1, 12);
      builder.ecologyRestTarget = {
        reason: 'shade-rest-help',
        boardPos: shadeBoard,
        x: shadeScreen.x,
        y: shadeScreen.y,
        expiresAtFrame: currentFrame() + 7200
      };
      const block = gameCore.godSpawnBlock?.(zoneId, shadeScreen.x, shadeScreen.y);
      behaviorSystem?.assignAction?.(builder, 'work', 'shade-rest', block?.id || null, {
        reason: 'shade-rest-need',
        priorityScore: 88,
        overrideDurationSeconds: 30
      });
      const shadeInspectBefore = inspectLinesFor(builder);
      const placedBlock = block?.placeAt?.(shadeScreen.x, shadeScreen.y, {
        movedById: builder.id,
        zoneId,
        placementMode: 'ground',
        stackIndex: 0,
        skipClamp: true
      });
      behaviorSystem?.assignAction?.(builder, 'work', 'shade-rest', block?.id || null, {
        reason: 'shade-rest-need',
        priorityScore: 88,
        overrideDurationSeconds: 30
      });
      const shadeFeed = refreshFeedEntries();
      const shadeEntry = latestEntry(shadeFeed, 'object:placed');
      const shadeInspectAfter = inspectLinesFor(builder);

      return {
        actorId: actor.id,
        actorLabel: communicationSystem.getEntityLabel(actor),
        partnerId: partner.id,
        builderId: builder.id,
        builderLabel: communicationSystem.getEntityLabel(builder),
        lanes: {
          pollen: {
            completed: pollenCompleted,
            pendingPlantingCount: gameCore.gameState?.pendingPollenPlantings?.length || 0,
            inspectBeforeLines: pollenInspectBefore,
            inspectAfterLines: pollenInspectAfter,
            feedEntry: plantedEntry
          },
          cleanup: {
            completed: cleanupCompleted,
            dirtPileId: dirtPile?.id || null,
            inspectBeforeLines: cleanupInspectBefore,
            inspectAfterLines: cleanupInspectAfter,
            feedEntry: cleanupEntry
          },
          shade: {
            completed: !!placedBlock,
            blockId: block?.id || null,
            inspectBeforeLines: shadeInspectBefore,
            inspectAfterLines: shadeInspectAfter,
            feedEntry: shadeEntry
          }
        },
        feedEntries: refreshFeedEntries().slice(-12)
      };
    });

    report.browserResult = browserResult;
    report.screenshot = path.join(outputDir, 'ecology-ui-causality.png');
    await page.screenshot({ path: report.screenshot, fullPage: true });
    await restoreStorage(page, initialStorage);

    const pollen = browserResult.lanes?.pollen || {};
    const cleanup = browserResult.lanes?.cleanup || {};
    const shade = browserResult.lanes?.shade || {};

    addCheck(report, 'browser-clean', report.pageErrors.length === 0 && report.consoleErrors.length === 0, {
      pageErrors: report.pageErrors,
      consoleErrors: report.consoleErrors
    });
    addCheck(report, 'pollen-action-completed', pollen.completed === true, {
      completed: pollen.completed,
      pendingPlantingCount: pollen.pendingPlantingCount
    });
    addCheck(report, 'pollen-inspect-causality-before-action', (pollen.inspectBeforeLines || []).some(line =>
      /Acting because/i.test(line) && /pollen|earlier talk/i.test(line)
    ), {
      lines: pollen.inspectBeforeLines
    });
    addCheck(report, 'pollen-inspect-causality-after-action', (pollen.inspectAfterLines || []).some(line =>
      /Acting because/i.test(line) && /pollen|earlier talk/i.test(line)
    ), {
      lines: pollen.inspectAfterLines
    });
    addCheck(report, 'pollen-feed-action-causality-tail', /^Because /i.test(pollen.feedEntry?.consequenceTail || ''), {
      feedEntry: pollen.feedEntry
    });
    addCheck(report, 'cleanup-action-completed', cleanup.completed === true, {
      completed: cleanup.completed,
      dirtPileId: cleanup.dirtPileId
    });
    addCheck(report, 'cleanup-inspect-causality', [...(cleanup.inspectBeforeLines || []), ...(cleanup.inspectAfterLines || [])].some(line =>
      /Acting because/i.test(line) && /dirty|clean|planting/i.test(line)
    ), {
      before: cleanup.inspectBeforeLines,
      after: cleanup.inspectAfterLines
    });
    addCheck(report, 'cleanup-feed-action-causality-tail', /^Because /i.test(cleanup.feedEntry?.consequenceTail || '')
      && /dirty|clean|planting/i.test(cleanup.feedEntry?.consequenceTail || ''), {
      feedEntry: cleanup.feedEntry
    });
    addCheck(report, 'shade-action-completed', shade.completed === true, {
      completed: shade.completed,
      blockId: shade.blockId
    });
    addCheck(report, 'shade-inspect-causality', [...(shade.inspectBeforeLines || []), ...(shade.inspectAfterLines || [])].some(line =>
      /Acting because/i.test(line) && /shade/i.test(line)
    ), {
      before: shade.inspectBeforeLines,
      after: shade.inspectAfterLines
    });
    addCheck(report, 'shade-feed-action-causality-tail', /^Because /i.test(shade.feedEntry?.consequenceTail || '')
      && /shade/i.test(shade.feedEntry?.consequenceTail || ''), {
      feedEntry: shade.feedEntry
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
