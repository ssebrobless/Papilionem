const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'environment_shade_shelter_audit');
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
      const clearArea = () => {
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          if (gameCore.getEntityZoneId(flower, null) === zoneId) {
            gameCore.removeFlowerFromGame?.(flower, 'shade-shelter-audit-reset');
          }
        }
        for (const block of [...(gameCore.gameState.blocks || [])]) {
          const blockCell = structureSystem.getBlockCell?.(block, { zoneId });
          if (blockCell?.zoneId === zoneId && blockCell.u >= 17 && blockCell.u <= 23 && blockCell.v >= 13 && blockCell.v <= 18) {
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

      clearArea();
      const baseBlock = spawnBlockAt(20, 15, 0);
      const roofBlock = spawnBlockAt(20, 15, 1, baseBlock);
      structureSystem.rebuild?.(gameCore.gameState);
      structureSystem.lastRebuildSignature = structureSystem.buildRebuildSignature?.(gameCore.gameState);

      const profile = structureSystem.getZoneProfileRef?.(zoneId);
      const shadeColumns = structureSystem.getShadeColumnsForZoneProfile?.(profile) || [];
      add('stack-creates-shade-column', shadeColumns.length >= 1 && shadeColumns.some(column => column.sourceBlockId === roofBlock?.id), {
        shadeColumnCount: shadeColumns.length,
        roofBlockId: roofBlock?.id || null
      });

      const butterfly = (gameCore.gameState.butterflies || [])[0];
      const control = (gameCore.gameState.butterflies || [])[1];
      if (!butterfly || !control) {
        add('audit-has-two-butterflies', false, { butterflyCount: (gameCore.gameState.butterflies || []).length });
        return assertions;
      }
      moveButterflyToCell(butterfly, 20, 16);
      moveButterflyToCell(control, 24, 19);
      butterfly.lifeSim.drives.rest = 0.72;
      butterfly.lifeSim.emotions.exhaustion = 0.48;
      control.lifeSim.drives.rest = 0.72;
      control.lifeSim.emotions.exhaustion = 0.48;

      const shadedContext = structureSystem.getSpatialContextForEntity?.(butterfly, gameCore.gameState);
      const openContext = structureSystem.getSpatialContextForEntity?.(control, gameCore.gameState);
      add('adjacent-butterfly-is-in-shade', shadedContext?.shadeCandidate === true && shadedContext?.inShade === true && shadedContext?.shadeStrength > 0, {
        shadedContext
      });
      add('distant-butterfly-is-not-in-shade', openContext?.inShade !== true, {
        openContext
      });

      const preferredShadePoint = structureSystem.getPreferredShelterPointForEntity?.(butterfly, zoneId);
      const preferredBoard = preferredShadePoint?.boardPos || (preferredShadePoint && renderManager.screenToBoard(preferredShadePoint.x, preferredShadePoint.y, zoneId, 0));
      const preferredOccupancy = preferredBoard ? structureSystem.canOccupyBoardCell?.({
        zoneId,
        u: preferredBoard.u,
        v: preferredBoard.v,
        h: 0,
        occupantType: 'butterfly'
      }) : null;
      add('preferred-shade-point-is-open-cell', !!preferredShadePoint && preferredOccupancy?.accepted === true, {
        preferredShadePoint,
        preferredBoard,
        preferredOccupancy
      });

      lifeSimSystem.updateButterfly?.(butterfly, gameCore.gameState, {
        currentFrame: gameCore.getCurrentFrame?.() || 0,
        deltaSeconds: 1 / 60,
        cadenceIntervalFrames: 1
      });
      lifeSimSystem.updateButterfly?.(control, gameCore.gameState, {
        currentFrame: gameCore.getCurrentFrame?.() || 0,
        deltaSeconds: 1 / 60,
        cadenceIntervalFrames: 1
      });

      add('lifesim-records-shade-truth', butterfly.lifeSim?.spatialAwareness?.inShade === true
        && butterfly.lifeSim?.spatialAwareness?.shadeStrength > 0, {
        spatialAwareness: butterfly.lifeSim?.spatialAwareness || null
      });
      add('shade-can-drive-shelter-affordance', butterfly.lifeSim?.objectAwareness?.currentAffordance === 'shelterUse', {
        objectAwareness: butterfly.lifeSim?.objectAwareness || null,
        drives: butterfly.lifeSim?.drives || null,
        emotions: butterfly.lifeSim?.emotions || null
      });
      add('shade-rest-bias-exceeds-open-control', (butterfly.lifeSim?.derived?.behaviorBiases?.shelterSeeking || 0)
        > (control.lifeSim?.derived?.behaviorBiases?.shelterSeeking || 0), {
        shadedShelterSeeking: butterfly.lifeSim?.derived?.behaviorBiases?.shelterSeeking || 0,
        openShelterSeeking: control.lifeSim?.derived?.behaviorBiases?.shelterSeeking || 0
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
