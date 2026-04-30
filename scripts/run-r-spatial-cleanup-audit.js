const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_spatial_cleanup_audit');
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
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, detached: true, stdio: 'ignore' });
  child.unref();
  report.server = { reused: false, pid: child.pid };
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ok = await fetch(URL).then(() => true).catch(() => false);
    if (ok) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Server did not become reachable in time');
}

async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, { timeout: 30000 });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(900);
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
    gameUI.firstSessionGuide.visible = false;
  });
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);
  const report = {
    startedAt: new Date().toISOString(),
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    assertions: null,
    screenshot: null,
    overall: 'pending'
  };

  let browser;
  let context;
  let page;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await resetBaseline(page);

    report.assertions = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const zoneIds = gameCore.getZoneIds?.() || [];
      for (let i = 0; i < 30; i += 1) gameCore.update();

      const gridMismatches = [];
      const checkEntity = (entity, kind) => {
        if (!entity?.gridPos || !entity?.boardPos || !gridManager?.isoToScreen || !renderManager?.screenToBoard) return;
        const zoneId = entity.boardPos.zoneId || entity.currentZoneId || gameCore.getFocusedZoneId();
        const screen = gridManager.isoToScreen(entity.gridPos.x || 0, entity.gridPos.y || 0);
        const board = renderManager.screenToBoard(screen.x, screen.y, zoneId, entity.boardPos.h || 0);
        const du = Math.abs((board.u || 0) - (entity.boardPos.u || 0));
        const dv = Math.abs((board.v || 0) - (entity.boardPos.v || 0));
        if (du > 0.5 || dv > 0.5) {
          gridMismatches.push({
            id: entity.id || null,
            kind,
            zoneId,
            du: Number(du.toFixed(3)),
            dv: Number(dv.toFixed(3)),
            gridPos: { ...entity.gridPos },
            boardPos: { ...entity.boardPos }
          });
        }
      };
      for (const butterfly of state.butterflies || []) checkEntity(butterfly, 'butterfly');
      for (const block of state.blocks || []) checkEntity(block, 'block');

      const zoneAtBoard = zoneIds.map(zoneId => {
        const board = zoneSystem.getBoardConfigForZone(zoneId);
        const probe = {
          zoneId,
          u: Math.max(0.5, Math.min((board?.widthUnits || 36) - 0.5, 4)),
          v: Math.max(0.5, Math.min((board?.depthUnits || 22) - 0.5, 4)),
          h: 0
        };
        const zone = zoneSystem.getZoneAtBoard(probe);
        return {
          zoneId,
          returnedZoneId: zone?.id || null,
          pass: zone?.id === zoneId
        };
      });

      const distanceChecks = zoneIds.map(zoneId => {
        const ppu = structureSystem.getBoardPixelsPerUnit(zoneId);
        const left = { x: 10, y: 10, currentZoneId: zoneId };
        const right = { x: 10 + (ppu * 2), y: 10, currentZoneId: zoneId };
        const distance = structureSystem.getBoardDistanceBetweenEntities(left, right);
        return {
          zoneId,
          ppu,
          distance,
          pass: Math.abs(distance - 2) < 0.001
        };
      });

      const first = state.butterflies?.[0] || null;
      const second = state.butterflies?.[1] || null;
      const beforeWarnings = communicationSystem.legacyRadiusWarningSites?.size || 0;
      const legacyRadiusResult = first && second
        ? communicationSystem.isEntityWithinRadius(first, second, 999, null, first.currentZoneId || state.focusedZoneId)
        : false;
      const afterWarnings = communicationSystem.legacyRadiusWarningSites?.size || 0;

      const structureSource = String(structureSystem.getBoardDistanceBetweenEntities || '');
      return {
        gridAgreement: {
          checkedKinds: ['butterfly', 'block'],
          mismatchCount: gridMismatches.length,
          mismatches: gridMismatches.slice(0, 12),
          pass: gridMismatches.length === 0
        },
        zoneAtBoard: {
          results: zoneAtBoard,
          pass: zoneAtBoard.length > 0 && zoneAtBoard.every(entry => entry.pass)
        },
        distancePpu: {
          results: distanceChecks,
          sourceContainsHardcodedDivide20: /\/\s*20\b/.test(structureSource),
          pass: distanceChecks.length > 0
            && distanceChecks.every(entry => entry.pass)
            && !/\/\s*20\b/.test(structureSource)
        },
        legacyRadiusWarning: {
          beforeWarnings,
          afterWarnings,
          legacyRadiusResult,
          pass: afterWarnings > beforeWarnings
        }
      };
    });

    report.screenshot = path.join(outputDir, '01-r11-spatial-cleanup.png');
    await page.screenshot({ path: report.screenshot, fullPage: true });
    report.overall = report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      && Object.values(report.assertions || {}).every(assertion => assertion?.pass === true)
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall, assertions: report.assertions, screenshot: report.screenshot }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run();
