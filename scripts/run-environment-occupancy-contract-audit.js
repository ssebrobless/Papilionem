const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'environment_occupancy_contract_audit');
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
      const screen = (u, v) => renderManager.boardToScreen(cell(u, v, 0));
      const findOpenCell = (startU, startV) => {
        for (let radius = 0; radius <= 8; radius += 1) {
          for (let du = -radius; du <= radius; du += 1) {
            for (let dv = -radius; dv <= radius; dv += 1) {
              if (radius > 0 && Math.max(Math.abs(du), Math.abs(dv)) !== radius) continue;
              const u = startU + du;
              const v = startV + dv;
              const projected = screen(u, v);
              if (!projected) continue;
              const occupancy = structureSystem.canOccupyBoardCell?.({ zoneId, u, v, h: 0 });
              if (occupancy?.accepted) return { u, v, point: projected };
            }
          }
        }
        throw new Error(`No open cell near ${startU},${startV}`);
      };
      const removeTargetObjects = (u, v) => {
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          const objectCell = structureSystem.getEntityObjectCell?.(flower, { zoneId, h: 0 });
          if (objectCell?.zoneId === zoneId && objectCell.u === u && objectCell.v === v) {
            gameCore.removeFlowerFromGame?.(flower, 'environment-occupancy-audit-reset');
          }
        }
        for (const block of [...(gameCore.gameState.blocks || [])]) {
          const blockCell = structureSystem.getBlockCell?.(block, { zoneId });
          if (blockCell?.zoneId === zoneId && blockCell.u === u && blockCell.v === v) {
            gameCore.entityManager?.removeEntity?.('blocks', block);
            gameCore.unregisterEntityFromFoundationSystems?.(block);
            gameCore.gameState.blocks = (gameCore.gameState.blocks || []).filter(entry => entry?.id !== block.id);
          }
        }
        gameCore.gameState.pendingPollenPlantings = (gameCore.gameState.pendingPollenPlantings || []).filter(planting => {
          const pollenCell = structureSystem.getPollenPlantingCell?.(planting, { zoneId });
          return !(pollenCell?.zoneId === zoneId && pollenCell.u === u && pollenCell.v === v);
        });
      };
      const spawnBlockAt = (u, v, h = 0) => {
        const point = screen(u, v);
        const block = gameCore.godSpawnBlock?.(zoneId, point.x, point.y);
        block?.applyBoardCell?.({ accepted: true, zoneId, u, v, h }, { requireAccepted: false });
        return block;
      };
      const spawnFlowerAtCell = (u, v, options = {}) => {
        const point = screen(u, v);
        return gameCore.spawnFlowerAt(zoneId, point.x, point.y, {
          exactPoint: true,
          ignoreZoneFlowerCap: true,
          minDistance: 0,
          ...options
        });
      };
      const createFlowerAtCell = (u, v, options = {}) => {
        const point = screen(u, v);
        const flower = new Flower(point.x, point.y, false, {
          currentZoneId: zoneId,
          ...options
        });
        flower.boardPos = { zoneId, u, v, h: 0 };
        flower.currentZoneId = zoneId;
        gameCore.assignEntityToZone?.(flower, zoneId);
        gameCore.gameState.flowers.push(flower);
        gameCore.entityManager?.addEntity?.('flowers', flower);
        gameCore.registerEntityWithFoundationSystems?.(flower, 'flower');
        return flower;
      };

      const flowerCell = findOpenCell(18, 18);
      removeTargetObjects(flowerCell.u, flowerCell.v);
      const flower = createFlowerAtCell(flowerCell.u, flowerCell.v);
      const flowerBlockAttempt = structureSystem.acceptCellPlacement({ zoneId, u: flowerCell.u, v: flowerCell.v, h: 0 });
      add('block-rejects-live-flower-cell', flowerBlockAttempt.reason === 'occupied-by-flower', {
        flowerId: flower?.id || null,
        reason: flowerBlockAttempt.reason
      });

      gameCore.transformFlowerToDirtPile?.(flower, { reason: 'environment-occupancy-audit' });
      const dirtBlockAttempt = structureSystem.acceptCellPlacement({ zoneId, u: flowerCell.u, v: flowerCell.v, h: 0 });
      add('block-rejects-dirt-pile-cell', dirtBlockAttempt.reason === 'occupied-by-dirt-pile', {
        reason: dirtBlockAttempt.reason
      });

      const reserveCell = findOpenCell(19, 18);
      removeTargetObjects(reserveCell.u, reserveCell.v);
      const reserveSource = createFlowerAtCell(reserveCell.u, reserveCell.v);
      const reserve = gameCore.convertFlowerToReserveFood?.(reserveSource, null, { reason: 'environment-occupancy-audit' });
      const reserveBlockAttempt = structureSystem.acceptCellPlacement({ zoneId, u: reserveCell.u, v: reserveCell.v, h: 0 });
      add('block-rejects-reserve-food-cell', reserveBlockAttempt.reason === 'occupied-by-reserve-food', {
        reserveId: reserve?.id || null,
        reason: reserveBlockAttempt.reason
      });

      const pollenCell = findOpenCell(20, 18);
      removeTargetObjects(pollenCell.u, pollenCell.v);
      const pollen = gameCore.queuePollenPlanting?.('audit-butterfly', zoneId, pollenCell.point.x, pollenCell.point.y, {
        framesRemaining: 120
      });
      const pollenBlockAttempt = structureSystem.acceptCellPlacement({ zoneId, u: pollenCell.u, v: pollenCell.v, h: 0 });
      const duplicatePollen = gameCore.queuePollenPlanting?.('audit-butterfly', zoneId, pollenCell.point.x, pollenCell.point.y, {
        framesRemaining: 120
      });
      add('block-rejects-pollen-patch-cell', pollenBlockAttempt.reason === 'occupied-by-pollen-patch', {
        pollenId: pollen?.id || null,
        reason: pollenBlockAttempt.reason
      });
      add('duplicate-pollen-patch-rejected', duplicatePollen === false, {
        duplicateResultType: typeof duplicatePollen
      });

      const blockCell = findOpenCell(21, 18);
      removeTargetObjects(blockCell.u, blockCell.v);
      const block = spawnBlockAt(blockCell.u, blockCell.v, 0);
      const flowerOnBlock = spawnFlowerAtCell(blockCell.u, blockCell.v);
      add('flower-rejects-block-cell', !!block && flowerOnBlock === null, {
        blockId: block?.id || null,
        flowerCreated: !!flowerOnBlock
      });

      const dirtCell = findOpenCell(22, 18);
      removeTargetObjects(dirtCell.u, dirtCell.v);
      const dirt = createFlowerAtCell(dirtCell.u, dirtCell.v);
      gameCore.transformFlowerToDirtPile?.(dirt, { reason: 'environment-occupancy-audit' });
      const flowerOnDirt = spawnFlowerAtCell(dirtCell.u, dirtCell.v);
      add('flower-rejects-dirt-pile-cell', flowerOnDirt === null, {
        flowerCreated: !!flowerOnDirt
      });

      return assertions;
    });

    await page.screenshot({ path: path.join(outputDir, 'final.png'), fullPage: true });
    report.finishedAt = new Date().toISOString();
    report.overall = report.assertions.every(assertion => assertion.pass)
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
  } finally {
    if (browser) await browser.close();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  }

  console.log(JSON.stringify({
    overall: report.overall,
    reportPath: path.join(outputDir, 'report.json'),
    assertions: report.assertions
  }, null, 2));

  if (report.overall !== 'pass') process.exit(1);
}

run();
