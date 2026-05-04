const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'environment_building_intent_audit');
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
  await page.waitForTimeout(1200);
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
    url: URL,
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

      const removeZoneObjects = () => {
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          if (gameCore.getEntityZoneId(flower, null) === zoneId) {
            gameCore.removeFlowerFromGame?.(flower, 'building-intent-audit-reset');
          }
        }
        for (const block of [...(gameCore.gameState.blocks || [])]) {
          const blockCell = structureSystem.getBlockCell?.(block, { zoneId });
          if (blockCell?.zoneId === zoneId) {
            gameCore.entityManager?.removeEntity?.('blocks', block);
            gameCore.unregisterEntityFromFoundationSystems?.(block);
            gameCore.gameState.blocks = (gameCore.gameState.blocks || []).filter(entry => entry?.id !== block.id);
          }
        }
      };

      const spawnBlockAt = (u, v, h = 0, supportBlock = null) => {
        const point = screen(u, v, h);
        const block = gameCore.godSpawnBlock?.(zoneId, point.x, point.y);
        block.supportBlockId = supportBlock?.id || null;
        block.applyBoardCell?.({ accepted: true, zoneId, u, v, h }, { requireAccepted: false });
        return block;
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

      const actor = (gameCore.gameState.butterflies || [])[0];
      if (!actor) {
        add('audit-has-actor', false, { butterflyCount: (gameCore.gameState.butterflies || []).length });
        return assertions;
      }

      actor.lifeSim.drives.rest = 0.86;
      actor.lifeSim.drives.exploration = 0.42;
      actor.lifeSim.emotions.exhaustion = 0.72;
      actor.lifeSim.derived = actor.lifeSim.derived || {};
      actor.lifeSim.derived.behaviorBiases = actor.lifeSim.derived.behaviorBiases || {};
      actor.lifeSim.derived.behaviorBiases.shelterSeeking = 0.92;
      actor.lifeSim.derived.behaviorBiases.objectInterest = 0.68;

      const candidateCells = [
        { u: 20, v: 15 },
        { u: 18, v: 14 },
        { u: 22, v: 14 },
        { u: 16, v: 16 },
        { u: 24, v: 16 },
        { u: 19, v: 19 },
        { u: 22, v: 20 }
      ];
      let fixture = null;
      for (const candidate of candidateCells) {
        removeZoneObjects();
        moveButterflyToCell(actor, candidate.u, candidate.v + 1);
        const baseBlock = spawnBlockAt(candidate.u, candidate.v, 0);
        const fartherBlock = spawnBlockAt(candidate.u + 4, candidate.v + 3, 0);
        const carriedBlock = spawnBlockAt(candidate.u + 1, candidate.v + 1, 0);
        carriedBlock.pickupBy?.(actor);
        actor.blockInteraction.carryingBlockId = carriedBlock.id;
        structureSystem.rebuild?.(gameCore.gameState);
        structureSystem.lastRebuildSignature = structureSystem.buildRebuildSignature?.(gameCore.gameState);
        const baseProfile = structureSystem.getBlockProfileRef?.(baseBlock.id);
        const stackProbe = {
          x: baseBlock.x,
          y: baseBlock.y,
          stackIndex: 1,
          supportBlockId: baseBlock.id,
          placementMode: 'stacked',
          zoneId,
          componentId: baseProfile?.componentId || null,
          supportComponentId: baseProfile?.componentId || null
        };
        if (structureSystem.validatePlacementTargetForBlock?.(actor, carriedBlock, stackProbe, gameCore.gameState.blocks || [])) {
          fixture = { baseBlock, fartherBlock, carriedBlock, candidate, stackProbe };
          break;
        }
      }

      add('fixture-has-valid-stack-cell', !!fixture, {
        candidateCells,
        selectedCell: fixture?.candidate || null
      });
      if (!fixture) return assertions;

      const { baseBlock, fartherBlock, carriedBlock, candidate } = fixture;

      const placement = actor.chooseBlockPlacementTarget?.(carriedBlock, gameCore.gameState.blocks || []);
      add('intent-prefers-stack-completion', placement?.placementMode === 'stacked'
        && placement?.supportBlockId === baseBlock.id
        && placement?.stackIndex === 1, {
        placement,
        baseBlockId: baseBlock.id,
        fartherBlockId: fartherBlock.id
      });
      add('placement-carries-shade-intent', placement?.shadeIntent?.createsShade === true
        && placement?.shadeIntent?.shadeProgress === 'creates-shade'
        && (placement?.shadeIntent?.intentScore || 0) > 0.45, {
        shadeIntent: placement?.shadeIntent || null
      });

      const placed = actor.placeCarriedBlock?.(carriedBlock, zoneId);
      structureSystem.rebuild?.(gameCore.gameState);
      structureSystem.lastRebuildSignature = structureSystem.buildRebuildSignature?.(gameCore.gameState);
      const placedCell = structureSystem.getBlockCell?.(carriedBlock, { zoneId });
      const shadeColumns = structureSystem.getShadeColumnsForZoneProfile?.(structureSystem.getZoneProfileRef?.(zoneId)) || [];
      const shadeEvent = (eventBus.getHistory?.('building:shade-progress') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.butterflyId === actor.id && event?.blockId === carriedBlock.id)
        .slice(-1)[0] || null;
      const objectMemories = [
        ...(actor.lifeSim?.memories?.object || []),
        ...(actor.lifeSim?.memories?.outcome || [])
      ];
      const shadeMemory = objectMemories
        .filter(memory => memory?.subjectId === carriedBlock.id || memory?.targetId === carriedBlock.id)
        .slice(-1)[0] || null;

      add('production-placement-succeeds', placed === true && placedCell?.u === candidate.u && placedCell?.v === candidate.v && placedCell?.h === 1, {
        placed,
        placedCell
      });
      add('placement-creates-shade-column', shadeColumns.some(column => column.sourceBlockId === carriedBlock.id), {
        shadeColumnCount: shadeColumns.length,
        shadeColumns
      });
      add('building-shade-progress-event-fired', shadeEvent?.createsShade === true && shadeEvent?.shadeProgress === 'creates-shade', {
        shadeEvent
      });
      add('shade-building-memory-recorded', shadeMemory?.metadata?.createsShade === true
        && (shadeMemory?.tags || []).includes('creates-shade'), {
        shadeMemory
      });
      add('sun-court-remains-block-free-in-audit', !(gameCore.gameState.blocks || []).some(block => gameCore.getEntityZoneId(block, null) === 'sun-court'), {
        sunCourtBlocks: (gameCore.gameState.blocks || []).filter(block => gameCore.getEntityZoneId(block, null) === 'sun-court').length
      });

      return assertions;
    });

    report.overall = report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      && report.assertions.every(assertion => assertion.pass)
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
  } finally {
    if (browser) await browser.close();
    report.completedAt = new Date().toISOString();
    report.reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath: report.reportPath,
      assertions: report.assertions.map(assertion => ({ id: assertion.id, pass: assertion.pass })),
      pageErrors: report.pageErrors.length,
      consoleErrors: report.consoleErrors.length
    }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
