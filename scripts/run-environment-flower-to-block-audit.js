const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'environment_flower_to_block_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
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
  const serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore'
  });
  serverProcess.unref();
  report.server = { reused: false, pid: serverProcess.pid };
  for (let attempt = 0; attempt < 60; attempt += 1) {
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
  await page.waitForTimeout(1000);
}

async function resetBaseline(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
    window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
    window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
    gameCore.focusZone?.('moss-hollow');
  });
  await page.waitForTimeout(700);
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    assertions: [],
    overall: 'pending'
  };

  let browser;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addInitScript(() => {
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await resetBaseline(page);

    report.assertions = await page.evaluate(async () => {
      const assertions = [];
      const add = (id, pass, details = {}) => assertions.push({ id, pass: !!pass, details });
      const zoneId = 'moss-hollow';
      const cell = (u, v, h = 0) => ({ zoneId, u, v, h });
      const screen = (u, v, h = 0) => renderManager.boardToScreen(cell(u, v, h));
      const state = gameCore.gameState;
      const clearZoneObjects = () => {
        for (const flower of [...(state.flowers || [])]) {
          if (gameCore.getEntityZoneId(flower, null) === zoneId) {
            gameCore.removeFlowerFromGame?.(flower, 'flower-to-block-audit-reset');
          }
        }
        for (const block of [...(state.blocks || [])]) {
          if (gameCore.getEntityZoneId(block, null) === zoneId) {
            gameCore.entityManager?.removeEntity?.('blocks', block);
            gameCore.unregisterEntityFromFoundationSystems?.(block);
            state.blocks = (state.blocks || []).filter(entry => entry?.id !== block.id);
          }
        }
      };
      const moveButterflyToCell = (butterfly, u, v) => {
        const point = screen(u, v, 0);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.x = point.x;
        butterfly.y = point.y;
        butterfly.boardPos = cell(u, v, 0);
        butterfly.gridPos = { x: u, y: v };
        butterfly.syncBoardPosFromScreen?.({ zoneId });
      };
      const spawnFlowerAtCell = (u, v) => {
        const point = screen(u, v, 0);
        const flower = gameCore.spawnFlowerAt?.(zoneId, point.x, point.y, {
          exactPoint: true,
          preferredPoint: point,
          minDistance: 0,
          allowObjectCellOverlap: true,
          persistentUntilConsumed: true,
          resourceOrigin: 'flower-to-block-audit'
        });
        if (flower) {
          flower.boardPos = cell(u, v, 0);
          flower.currentZoneId = zoneId;
          flower.syncDebugGridPos?.();
        }
        return flower;
      };

      clearZoneObjects();
      const butterfly = (state.butterflies || [])[0] || null;
      if (!butterfly) {
        add('audit-has-butterfly', false, { butterflyCount: (state.butterflies || []).length });
        return assertions;
      }
      moveButterflyToCell(butterfly, 18, 14);
      const flower = spawnFlowerAtCell(18, 14);
      add('fixture-live-flower-created', !!flower && flower.lifecycleKind === 'flower', {
        flowerId: flower?.id || null,
        flowerCell: flower?.boardPos || null
      });
      if (!flower) return assertions;

      eventBus?.clearHistory?.();
      butterfly.happiness = 52;
      butterfly.baselineHappiness = 30;
      butterfly.lifeSim.drives.rest = 0.82;
      butterfly.lifeSim.drives.exploration = 0.62;
      butterfly.lifeSim.emotions.exhaustion = 0.54;
      butterfly.lifeSim.derived = butterfly.lifeSim.derived || {};
      butterfly.lifeSim.derived.behaviorBiases = {
        ...(butterfly.lifeSim.derived.behaviorBiases || {}),
        objectInterest: 0.86,
        shelterSeeking: 0.88,
        feedUrgency: 0.05
      };
      butterfly.blockInteraction.cooldownFrames = 0;
      const beforeHappiness = butterfly.happiness;
      const beforeExhaustion = butterfly.lifeSim.emotions.exhaustion;
      const beforeFlowerCount = (state.flowers || []).length;
      const beforeBlockCount = (state.blocks || []).length;

      const handled = butterfly.checkFlowerToBlockConversion?.(state.flowers, state.blocks);
      const createdEvent = eventBus?.getHistory?.('building:flower-converted-to-block')?.at(-1) || null;
      const acceptedEvent = eventBus?.getHistory?.('building:flower-to-block-accepted')?.at(-1) || null;
      const createdPayload = createdEvent?.data || createdEvent || {};
      const acceptedPayload = acceptedEvent?.data || acceptedEvent || {};
      const block = createdPayload?.blockId
        ? (state.blocks || []).find(entry => entry.id === createdPayload.blockId) || null
        : null;
      const flowerStillPresent = (state.flowers || []).some(entry => entry?.id === flower.id);
      const inventory = gameCore.ensureButterflyPollenInventory?.(butterfly);
      const objectMemory = (butterfly.lifeSim?.memories?.object || []).find(packet =>
        packet?.metadata?.sourceFlowerId === flower.id
        && (packet.tags || []).includes('converted-flower')
      ) || null;
      const createdCell = createdPayload?.boardPos || null;
      const sourceCellAcceptance = createdCell
        ? structureSystem.acceptCellPlacement?.({
            ...createdCell,
            candidateBlocks: state.blocks,
            ignoreBlockIds: [block?.id].filter(Boolean)
          })
        : null;
      const cellOccupants = createdCell
        ? structureSystem.getBoardCellOccupants?.(zoneId, createdCell.u, createdCell.v, createdCell.h, {
            ignoreBlockIds: [block?.id].filter(Boolean)
          })
        : [];
      add('conversion-action-handled', handled === true, { handled });
      add('flower-removed-and-block-created', !flowerStillPresent && !!block && (state.flowers || []).length === beforeFlowerCount - 1 && (state.blocks || []).length === beforeBlockCount + 1, {
        flowerStillPresent,
        beforeFlowerCount,
        afterFlowerCount: (state.flowers || []).length,
        beforeBlockCount,
        afterBlockCount: (state.blocks || []).length,
        blockId: block?.id || null
      });
      add('conversion-uses-legal-source-cell', !!createdCell && sourceCellAcceptance?.accepted === true && cellOccupants.length === 0, {
        createdCell,
        sourceCellAcceptance,
        cellOccupants
      });
      add('conversion-grants-one-pollen-no-food', inventory?.charges === 1 && butterfly.happiness === beforeHappiness, {
        pollenInventory: inventory,
        beforeHappiness,
        afterHappiness: butterfly.happiness
      });
      add('conversion-has-energy-cost', butterfly.lifeSim.emotions.exhaustion > beforeExhaustion, {
        beforeExhaustion,
        afterExhaustion: butterfly.lifeSim.emotions.exhaustion
      });
      add('conversion-memory-recorded', !!objectMemory && (objectMemory.tags || []).includes('building-cost'), {
        objectMemory
      });
      add('conversion-event-recorded', !!createdEvent && !!acceptedEvent && createdPayload.noFoodGain === true, {
        createdEvent,
        acceptedEvent
      });
      add('new-block-enters-carry-place-loop', !!block && block.carriedById === butterfly.id && butterfly.blockInteraction?.carryingBlockId === block.id && !!butterfly.blockInteraction?.placementTarget, {
        blockCarriedById: block?.carriedById || null,
        carryingBlockId: butterfly.blockInteraction?.carryingBlockId || null,
        placementTarget: butterfly.blockInteraction?.placementTarget || null
      });

      const trainingPoint = renderManager.boardToScreen({ zoneId: 'sun-court', u: 12, v: 12, h: 0 });
      const trainingFlower = new Flower(trainingPoint.x, trainingPoint.y, false, {
        currentZoneId: 'sun-court',
        persistentUntilConsumed: true
      });
      trainingFlower.boardPos = { zoneId: 'sun-court', u: 12, v: 12, h: 0 };
      trainingFlower.currentZoneId = 'sun-court';
      const trainingResult = gameCore.convertFlowerToBlockMaterial?.(trainingFlower, butterfly, {
        source: 'flower-to-block-audit-training'
      });
      add('training-ground-conversion-rejected', trainingResult?.converted !== true && trainingResult?.reason === 'training-no-blocks', {
        trainingResult
      });

      return assertions;
    });

    report.overall = report.assertions.every(assertion => assertion.pass)
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = {
      message: error?.message || String(error),
      stack: error?.stack || null
    };
  } finally {
    report.completedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    if (browser) await browser.close();
  }

  console.log(JSON.stringify({
    overall: report.overall,
    outputDir,
    assertions: report.assertions.map(({ id, pass }) => ({ id, pass })),
    pageErrors: report.pageErrors.length,
    consoleErrors: report.consoleErrors.length
  }, null, 2));

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
