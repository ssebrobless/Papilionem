const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_block_cell_discipline_audit');
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
  await page.waitForTimeout(1800);
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
  });
  await page.waitForTimeout(1200);
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
    pageErrors: [],
    consoleErrors: [],
    server: null,
    checks: null,
    overall: 'pending'
  };

  let browser;
  let context;
  let page;

  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    await context.addInitScript(() => {
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    });
    page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await resetBaseline(page);

    const details = await page.evaluate(async () => {
      structureSystem.update(gameCore.gameState, 0);
      const maxStackHeight = structureSystem.getMaxStackHeight?.() || 12;
      const blocks = gameCore.gameState.blocks || [];
      const seen = new Map();
      const duplicateCells = [];
      const halfCells = [];
      const unsupportedStacks = [];
      const outOfRangeCells = [];
      const trainingBlocks = [];

      for (const block of blocks) {
        if (!block || block.carriedById) continue;
        const zoneId = block.currentZoneId || block.boardPos?.zoneId || null;
        if (zoneId === 'sun-court') {
          trainingBlocks.push(block.id);
        }
        block.snapToBoardCell?.({ allowInvalidCell: false, reason: 'audit-normalize' });
        const cell = structureSystem.getBlockCell?.(block, { zoneId }) || null;
        if (!cell) {
          halfCells.push({ id: block.id, reason: 'missing-cell' });
          continue;
        }
        const dimensions = structureSystem.getBoardDimensions?.(cell.zoneId);
        if (!Number.isInteger(block.boardPos?.u) || !Number.isInteger(block.boardPos?.v) || !Number.isInteger(block.boardPos?.h)) {
          halfCells.push({
            id: block.id,
            boardPos: block.boardPos
          });
        }
        if (
          !dimensions ||
          cell.u < 0 ||
          cell.v < 0 ||
          cell.u >= dimensions.widthUnits ||
          cell.v >= dimensions.depthUnits ||
          cell.h < 0 ||
          cell.h >= maxStackHeight
        ) {
          outOfRangeCells.push({ id: block.id, cell, dimensions });
        }

        const key = structureSystem.buildBlockCellKey(cell.zoneId, cell.u, cell.v, cell.h);
        if (seen.has(key)) {
          duplicateCells.push({
            key,
            blockIds: [seen.get(key), block.id]
          });
        } else {
          seen.set(key, block.id);
        }

        if (cell.h > 0 && !structureSystem.cellOccupiedBySolid(cell.zoneId, cell.u, cell.v, cell.h - 1, {
          candidateBlocks: blocks,
          ignoreBlockIds: [block.id]
        })) {
          unsupportedStacks.push({
            id: block.id,
            cell,
            supportBlockId: block.supportBlockId || null
          });
        }
      }

      const duplicateProbeBlock = blocks.find(block => block && !block.carriedById && block.currentZoneId !== 'sun-court') || null;
      const duplicateProbeCell = duplicateProbeBlock
        ? structureSystem.getBlockCell?.(duplicateProbeBlock)
        : null;
      const duplicateProbe = duplicateProbeCell
        ? structureSystem.acceptCellPlacement({
          zoneId: duplicateProbeCell.zoneId,
          u: duplicateProbeCell.u,
          v: duplicateProbeCell.v,
          h: duplicateProbeCell.h,
          block: { id: 'audit-probe-block' },
          candidateBlocks: blocks
        })
        : null;
      const trainingProbe = gameCore.godSpawnBlock?.('sun-court') || null;
      const blockStackRoundtrip = await (async () => {
        const lane = {
          id: 'block-stack-roundtrip',
          pass: false,
          zoneId: 'moss-hollow',
          u: 20,
          v: 15,
          injectedLegacyDivergence: false,
          duplicateCellsAfterReload: [],
          restored: []
        };
        try {
          const zoneId = lane.zoneId;
          const u = lane.u;
          const v = lane.v;
          await gameCore.resetGame(true);
          gameCore.focusZone?.(zoneId);
          structureSystem.update(gameCore.gameState, 0);

          const blocksAtTarget = (gameCore.gameState.blocks || []).filter(block => {
            const cell = structureSystem.getBlockCell?.(block, { zoneId }) || null;
            return cell?.zoneId === zoneId && cell.u === u && cell.v === v;
          });
          if (blocksAtTarget.length > 0) {
            const removeIds = new Set(blocksAtTarget.map(block => block.id));
            for (const block of blocksAtTarget) {
              gameCore.entityManager?.removeEntity?.('blocks', block);
              gameCore.unregisterEntityFromFoundationSystems?.(block);
            }
            gameCore.gameState.blocks = (gameCore.gameState.blocks || []).filter(block => !removeIds.has(block?.id));
          }

          const spawnBlockAt = (h) => {
            const screen = renderManager?.boardToScreen?.({ zoneId, u, v, h: 0 }) || null;
            if (!screen) throw new Error(`Unable to project audit block cell h=${h}`);
            const block = gameCore.godSpawnBlock?.(zoneId, screen.x, screen.y) || null;
            if (!block) throw new Error(`Unable to spawn audit block h=${h}`);
            const applied = block.applyBoardCell?.({ accepted: true, zoneId, u, v, h }, { requireAccepted: false });
            if (!applied) throw new Error(`Unable to apply audit block cell h=${h}`);
            return block;
          };

          const groundBlock = spawnBlockAt(0);
          const stackBlock = spawnBlockAt(1);
          structureSystem.update(gameCore.gameState, 0);
          const serialized = saveSystem.serializeState(gameCore.gameState);
          const stackSaved = (serialized.blocks || []).find(block => block?.id === stackBlock.id);
          if (stackSaved) {
            stackSaved.stackIndex = 0;
            lane.injectedLegacyDivergence = true;
          }

          await gameCore.resetGame(true);
          const applied = gameCore.applySerializedState?.(serialized)
            || saveSystem.applyDeserializedState?.(gameCore, serialized);
          structureSystem.update(gameCore.gameState, 0);

          const restoredBlocks = [groundBlock.id, stackBlock.id]
            .map(id => (gameCore.gameState.blocks || []).find(block => block?.id === id) || null);
          lane.restored = restoredBlocks.map(block => {
            const cell = structureSystem.getBlockCell?.(block, { zoneId }) || null;
            return {
              id: block?.id || null,
              boardPos: block?.boardPos || null,
              stackIndex: block?.stackIndex ?? null,
              cell
            };
          });

          const seenAfter = new Map();
          for (const block of gameCore.gameState.blocks || []) {
            if (!block || block.carriedById) continue;
            const cell = structureSystem.getBlockCell?.(block, {
              zoneId: block.currentZoneId || block.boardPos?.zoneId || null
            }) || null;
            if (!cell) continue;
            const key = structureSystem.buildBlockCellKey(cell.zoneId, cell.u, cell.v, cell.h);
            if (seenAfter.has(key)) {
              lane.duplicateCellsAfterReload.push({
                key,
                blockIds: [seenAfter.get(key), block.id]
              });
            } else {
              seenAfter.set(key, block.id);
            }
          }

          const expected = new Map([[groundBlock.id, 0], [stackBlock.id, 1]]);
          const heightsRestored = lane.restored.every(entry => (
            entry.id
            && entry.cell
            && entry.cell.zoneId === zoneId
            && entry.cell.u === u
            && entry.cell.v === v
            && entry.cell.h === expected.get(entry.id)
            && entry.boardPos?.h === expected.get(entry.id)
            && entry.stackIndex === expected.get(entry.id)
          ));
          lane.pass = !!applied
            && lane.injectedLegacyDivergence
            && lane.duplicateCellsAfterReload.length === 0
            && heightsRestored;
        } catch (error) {
          lane.error = {
            message: error?.message || String(error),
            stack: error?.stack || null
          };
        }
        return lane;
      })();
      const gardenObjectOccupancy = await (async () => {
        const lane = {
          id: 'garden-object-occupancy',
          pass: false,
          zoneId: 'moss-hollow',
          probes: []
        };
        try {
          await gameCore.resetGame(true);
          const zoneId = lane.zoneId;
          gameCore.focusZone?.(zoneId);
          const spawnAtCell = (u, v, options = {}) => {
            const screen = renderManager?.boardToScreen?.({ zoneId, u, v, h: 0 }) || null;
            if (!screen) throw new Error(`Unable to project garden object cell ${u},${v}`);
            const flower = gameCore.spawnFlowerAt(zoneId, screen.x, screen.y, {
              exactPoint: true,
              preferredPoint: screen,
              ignoreZoneFlowerCap: true,
              allowFlowerOverlap: true,
              persistentUntilConsumed: true,
              resourceOrigin: options.resourceOrigin || 'block-cell-occupancy-audit'
            });
            if (!flower) throw new Error(`Unable to spawn garden object at ${u},${v}`);
            flower.boardPos = { zoneId, u, v, h: 0 };
            flower.currentZoneId = zoneId;
            flower.syncDebugGridPos?.();
            objectSystem?.syncEntityProfile?.(flower);
            return flower;
          };
          const probeCell = (label, u, v, expectedReason, expectedType = null) => {
            const result = structureSystem.acceptCellPlacement({
              zoneId,
              u,
              v,
              h: 0,
              block: { id: `audit-probe-${label}` },
              candidateBlocks: []
            });
            lane.probes.push({
              label,
              accepted: result?.accepted === true,
              reason: result?.reason || null,
              occupants: result?.occupants || [],
              expectedReason,
              expectedType,
              pass: result?.accepted === false
                && result?.reason === expectedReason
                && (!expectedType || (result?.occupants || []).some(occupant => occupant.type === expectedType))
            });
          };

          spawnAtCell(6, 6, { resourceOrigin: 'block-cell-flower-audit' });
          probeCell('flower', 6, 6, 'occupied-by-flower', 'flower');

          const dirtFlower = spawnAtCell(7, 6, { resourceOrigin: 'block-cell-dirt-audit' });
          gameCore.transformFlowerToDirtPile?.(dirtFlower, { source: 'block-cell-occupancy-audit' });
          probeCell('dirt-pile', 7, 6, 'occupied-by-dirt-pile', 'dirt-pile');

          const reserveFlower = spawnAtCell(8, 6, { resourceOrigin: 'block-cell-reserve-audit' });
          const reserveFood = gameCore.convertFlowerToReserveFood?.(reserveFlower, null, { source: 'block-cell-occupancy-audit' });
          probeCell('reserve-food', 8, 6, 'occupied-by-reserve-food', 'reserve-food-ball');

          const huskFlower = spawnAtCell(9, 6, { resourceOrigin: 'block-cell-husk-audit' });
          const reserveHusk = gameCore.convertFlowerToReserveFood?.(huskFlower, null, { source: 'block-cell-occupancy-audit' });
          if (reserveHusk?.id) {
            objectSystem?.recordInteraction?.(reserveHusk.id, 'seeded depleted reserve husk', null, {
              zoneId,
              reserveFoodUseCount: 6,
              reserveFoodMaxUses: 6,
              reserveFoodDepleted: true
            });
            reserveHusk.refreshLifecycleObjectProfile?.();
          }
          probeCell('reserve-husk', 9, 6, 'occupied-by-reserve-husk', 'depleted-reserve-food');

          gameCore.gameState.pendingPollenPlantings = gameCore.gameState.pendingPollenPlantings || [];
          gameCore.gameState.pendingPollenPlantings.push({
            id: 'audit-pollen-patch',
            zoneId,
            boardPos: { zoneId, u: 10, v: 6, h: 0 },
            x: 0,
            y: 0
          });
          probeCell('pollen-patch', 10, 6, 'occupied-by-pollen-patch', 'pollen-patch');

          lane.pass = lane.probes.length === 5 && lane.probes.every(probe => probe.pass);
        } catch (error) {
          lane.error = {
            message: error?.message || String(error),
            stack: error?.stack || null
          };
        }
        return lane;
      })();

      return {
        blockCount: blocks.length,
        duplicateCells,
        halfCells,
        unsupportedStacks,
        outOfRangeCells,
        trainingBlocks,
        duplicateProbe,
        trainingProbeCreated: !!trainingProbe,
        blockStackRoundtrip,
        gardenObjectOccupancy,
        snapFlag: gameConfig.entities.block.snapToCellInt
      };
    });

    const screenshot = path.join(outputDir, '01-block-cell-discipline.png');
    await page.screenshot({ path: screenshot, fullPage: true });

    report.checks = {
      ...details,
      screenshot,
      pass:
        details.blockCount > 0 &&
        details.snapFlag !== false &&
        details.duplicateCells.length === 0 &&
        details.halfCells.length === 0 &&
        details.unsupportedStacks.length === 0 &&
        details.outOfRangeCells.length === 0 &&
        details.trainingBlocks.length === 0 &&
        details.duplicateProbe?.accepted === false &&
        details.duplicateProbe?.reason === 'duplicate-cell' &&
        details.trainingProbeCreated === false &&
        details.blockStackRoundtrip?.pass === true &&
        details.gardenObjectOccupancy?.pass === true &&
        report.pageErrors.length === 0 &&
        report.consoleErrors.length === 0
    };
    report.overall = report.checks.pass ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
