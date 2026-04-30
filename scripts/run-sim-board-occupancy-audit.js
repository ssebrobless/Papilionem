const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'sim_board_occupancy_audit');
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
    return null;
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
    if (ok) return serverProcess;
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

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function phase(page, report, outputDir, name, run) {
  const result = await run();
  const screenshot = await saveShot(page, outputDir, name);
  report.phases.push({
    name,
    pass: !!result.pass,
    details: result.details || null,
    screenshot
  });
  return result;
}

async function main() {
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);
  const report = {
    startedAt: new Date().toISOString(),
    outputDir,
    url: URL,
    server: null,
    phases: [],
    pageErrors: [],
    consoleErrors: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let serverProcess = null;

  try {
    serverProcess = await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    await context.addInitScript(({ storageKeys }) => {
      for (const key of storageKeys) {
        window.localStorage.removeItem(key);
      }
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    }, { storageKeys: STORAGE_KEYS });

    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await page.evaluate(async () => {
      await gameCore.resetGame(true);
    });
    await page.waitForTimeout(800);

    await phase(page, report, outputDir, '01-ground-blocks-board-pos', async () => {
      const details = await page.evaluate(() => {
        const zoneId = 'ivy-cloister';
        gameCore.focusZone?.(zoneId);
        const blocks = gameCore.getBlocksInZone?.(zoneId) || [];
        const targets = [
          { u: 7, v: 14 }, { u: 9, v: 14 }, { u: 11, v: 14 }, { u: 13, v: 14 },
          { u: 15, v: 14 }, { u: 17, v: 14 }, { u: 19, v: 14 }, { u: 21, v: 14 },
          { u: 23, v: 14 }, { u: 25, v: 14 }, { u: 27, v: 14 }, { u: 29, v: 14 }
        ];
        const fixture = blocks.slice(0, targets.length);
        if (fixture.length < targets.length) {
          return { ok: false, reason: 'missing-blocks', count: fixture.length };
        }
        const rows = [];
        for (let index = 0; index < targets.length; index += 1) {
          const block = fixture[index];
          const target = targets[index];
          const screen = renderManager.boardToScreen({ zoneId, u: target.u, v: target.v, h: 0 });
          const legalPoint = gameCore.clampPlacementPointInZone?.(zoneId, screen.x, screen.y, 8) || screen;
          const expectedBoard = renderManager.screenToBoard(legalPoint.x, legalPoint.y, zoneId, 0);
          block.placeAt?.(legalPoint.x, legalPoint.y, {
            movedById: 'p4-audit',
            stackIndex: 0,
            supportBlockId: null,
            placementMode: 'ground',
            zoneId
          });
          block.syncBoardPosFromScreen?.();
          rows.push({
            id: block.id,
            requested: { zoneId, u: target.u, v: target.v, h: 0 },
            expected: { zoneId, u: expectedBoard.u, v: expectedBoard.v, h: 0 },
            actual: block.boardPos,
            zIndex: block.zIndex
          });
        }
        structureSystem.update?.(gameCore.getGameState());
        const failures = rows.filter(row =>
          row.actual?.zoneId !== zoneId
          || Math.abs((row.actual?.u ?? Infinity) - row.expected.u) > 0.05
          || Math.abs((row.actual?.v ?? Infinity) - row.expected.v) > 0.05
          || Math.abs((row.actual?.h ?? Infinity) - row.expected.h) > 0.05
        );
        return {
          ok: failures.length === 0,
          renderMode: gameConfig.world.renderMode,
          rows,
          failures
        };
      });
      return {
        pass: details.ok && details.renderMode === 'sim-board',
        details
      };
    });

    await phase(page, report, outputDir, '02-stacked-towers-support-and-lift', async () => {
      const details = await page.evaluate(() => {
        const zoneId = 'ivy-cloister';
        const blocks = gameCore.getBlocksInZone?.(zoneId) || [];
        const towerOrigins = [
          { u: 9, v: 7 },
          { u: 16, v: 7 },
          { u: 9, v: 14 },
          { u: 16, v: 14 }
        ];
        const fixture = blocks.slice(0, 12);
        const board = zoneSystem.getBoardConfigForZone?.(zoneId) || {};
        const hStep = board.hStep || 8;
        const towers = [];
        if (fixture.length < 12) {
          return { ok: false, reason: 'missing-tower-blocks', count: fixture.length };
        }
        for (let towerIndex = 0; towerIndex < towerOrigins.length; towerIndex += 1) {
          const origin = towerOrigins[towerIndex];
          let supportBlockId = null;
          const towerBlocks = [];
          for (let h = 0; h < 3; h += 1) {
            const block = fixture[(towerIndex * 3) + h];
            const screen = renderManager.boardToScreen({ zoneId, u: origin.u, v: origin.v, h: 0 });
            block.placeAt?.(screen.x, screen.y, {
              movedById: 'p4-audit',
              stackIndex: h,
              supportBlockId,
              placementMode: h > 0 ? 'stacked' : 'ground',
              zoneId
            });
            block.syncBoardPosFromScreen?.();
            supportBlockId = block.id;
            towerBlocks.push(block);
          }
          towers.push({ origin, blockIds: towerBlocks.map(block => block.id) });
        }
        structureSystem.update?.(gameCore.getGameState());
        const rows = fixture.map(block => {
          const support = structureSystem.getBlockSupportContext?.(block, fixture);
          return {
            id: block.id,
            boardPos: block.boardPos,
            stackIndex: block.stackIndex,
            supportState: support?.supportState || null,
            stable: !!support?.stable,
            visualLift: block.getVisualLift?.(),
            expectedLift: (block.boardPos?.h || 0) * hStep
          };
        });
        const columns = (structureSystem.getZoneProfileRef?.(zoneId)?.components || [])
          .flatMap(component => component.occupancyColumns || [])
          .filter(column => column.supportChain?.some(id => fixture.some(block => block.id === id)));
        const failures = rows.filter(row =>
          !row.boardPos
          || Math.abs((row.boardPos.h ?? Infinity) - row.stackIndex) > 0.05
          || (row.stackIndex > 0 && row.supportState !== 'supported')
          || row.stable !== true
          || Math.abs((row.visualLift ?? Infinity) - row.expectedLift) > 0.05
        );
        const columnFailures = columns.filter(column =>
          !column.boardPos
          || column.height !== 3
          || column.topH !== 2
          || column.supportChain?.length !== 3
        );
        return {
          ok: failures.length === 0 && columns.length >= 4 && columnFailures.length === 0,
          hStep,
          towers,
          rows,
          columns,
          failures,
          columnFailures
        };
      });
      return { pass: details.ok, details };
    });

    await phase(page, report, outputDir, '03-carried-block-anchor', async () => {
      const details = await page.evaluate(async () => {
        const waitFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
        const zoneId = 'ivy-cloister';
        gameCore.focusZone?.(zoneId);
        const state = gameCore.getGameState();
        const butterfly = (state.butterflies || []).find(entry =>
          gameCore.getEntityZoneId?.(entry, null) === zoneId
          && !entry.zoneTravel
          && !entry.isSpawning
        ) || null;
        const block = (gameCore.getBlocksInZone?.(zoneId) || [])[12] || null;
        if (!butterfly || !block) {
          return { ok: false, reason: 'missing-carry-fixture' };
        }
        const butterflyPoint = renderManager.boardToScreen({ zoneId, u: 18, v: 11, h: 0 });
        butterfly.x = butterflyPoint.x;
        butterfly.y = butterflyPoint.y - (butterfly.shadowOffset || 0);
        butterfly.syncBoardPosFromScreen?.({ zoneId });
        butterfly.updateZIndex?.();
        block.pickupBy?.(butterfly);
        await waitFrame();
        block.syncCarriedPose?.(butterfly);
        const groundPoint = physicsSystem.getEntityGroundPoint?.(butterfly) || {
          x: butterfly.x,
          y: butterfly.y + (butterfly.shadowOffset || 0)
        };
        const expectedAnchor = structureSystem.getCarryAnchorForGroundPoint?.(butterfly, block, groundPoint)
          || structureSystem.getCarryAnchorForEntity?.(butterfly, block)
          || null;
        const boardPos = block.boardPos || null;
        return {
          ok: !!expectedAnchor
            && block.carriedById === butterfly.id
            && Math.hypot((block.x || 0) - expectedAnchor.x, (block.y || 0) - expectedAnchor.y) <= 0.75
            && !!boardPos
            && boardPos.zoneId === zoneId,
          butterflyId: butterfly.id,
          blockId: block.id,
          carriedById: block.carriedById,
          expectedAnchor,
          actual: { x: block.x, y: block.y, zIndex: block.zIndex, boardPos },
          anchorDistance: expectedAnchor ? Math.hypot((block.x || 0) - expectedAnchor.x, (block.y || 0) - expectedAnchor.y) : null
        };
      });
      return { pass: details.ok, details };
    });

    report.overall = report.phases.every(entry => entry.pass)
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    if (serverProcess && !report.server?.reused) {
      try {
        process.kill(-serverProcess.pid);
      } catch (_error) {}
    }
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Sim-board occupancy audit report: ${reportPath}`);
    console.log(`Overall: ${report.overall}`);
  }

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

main();
