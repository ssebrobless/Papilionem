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

    const details = await page.evaluate(() => {
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

      return {
        blockCount: blocks.length,
        duplicateCells,
        halfCells,
        unsupportedStacks,
        outOfRangeCells,
        trainingBlocks,
        duplicateProbe,
        trainingProbeCreated: !!trainingProbe,
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
