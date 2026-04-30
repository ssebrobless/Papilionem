const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'spatial_projection_unit_tests');

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

async function main() {
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);

  const report = {
    startedAt: new Date().toISOString(),
    url: URL,
    outputDir,
    server: null,
    consoleMessages: [],
    pageErrors: [],
    assertions: [],
    overall: 'pending'
  };

  let browser;
  let serverProcess = null;

  try {
    serverProcess = await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    const page = await context.newPage();

    page.on('console', msg => {
      report.consoleMessages.push({ type: msg.type(), text: msg.text() });
    });
    page.on('pageerror', error => {
      report.pageErrors.push(String(error));
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);

    const result = await page.evaluate(() => {
      const assertions = [];
      const EPSILON = 1e-6;

      function pass(label, details = {}) {
        assertions.push({ label, pass: true, details });
      }

      function fail(label, details = {}) {
        assertions.push({ label, pass: false, details });
      }

      function near(actual, expected, label, epsilon = EPSILON) {
        const ok = Math.abs(actual - expected) <= epsilon;
        (ok ? pass : fail)(label, { actual, expected, epsilon });
      }

      function assert(condition, label, details = {}) {
        (condition ? pass : fail)(label, details);
      }

      const zoneIds = gameCore.getZoneIds?.() || [];
      assert(zoneIds.length >= 4, 'zone ids available', { zoneIds });
      assert(typeof renderManager.getProjectionForZone === 'function', 'renderManager.getProjectionForZone exists');
      assert(typeof renderManager.boardToScreen === 'function', 'renderManager.boardToScreen exists');
      assert(typeof renderManager.screenToBoard === 'function', 'renderManager.screenToBoard exists');
      assert(typeof renderManager.computeRenderSortKey === 'function', 'renderManager.computeRenderSortKey exists');
      assert(typeof zoneSystem.getBoardConfigForZone === 'function', 'zoneSystem.getBoardConfigForZone exists');
      assert(typeof structureSystem.distanceBoard === 'function', 'structureSystem.distanceBoard exists');
      assert(typeof structureSystem.getProjectionPpu === 'function', 'structureSystem.getProjectionPpu exists');

      for (const zoneId of zoneIds) {
        const board = zoneSystem.getBoardConfigForZone(zoneId);
        const projection = renderManager.getProjectionForZone(zoneId);
        assert(board?.widthUnits === 36, `${zoneId} board width`, { board });
        assert(board?.depthUnits === 22, `${zoneId} board depth`, { board });
        near(projection.ppu, 20, `${zoneId} ppu`);
        near(projection.groundT, 0.56, `${zoneId} groundT`);
        near(projection.hStep, 8, `${zoneId} hStep`);

        const origin = renderManager.boardToScreen({ zoneId, u: 0, v: 0, h: 0 });
        near(origin.x, projection.origin.x, `${zoneId} origin x`);
        near(origin.y, projection.origin.y, `${zoneId} origin y`);

        const uStep = renderManager.boardToScreen({ zoneId, u: 1, v: 0, h: 0 });
        const vStep = renderManager.boardToScreen({ zoneId, u: 0, v: 1, h: 0 });
        const hStep = renderManager.boardToScreen({ zoneId, u: 0, v: 0, h: 1 });
        near(uStep.x - origin.x, projection.ppu, `${zoneId} u step x`);
        near(vStep.y - origin.y, projection.ppu * projection.groundT, `${zoneId} v step y`);
        near(hStep.y, origin.y - projection.hStep, `${zoneId} h step y`);

        const sample = { zoneId, u: 7.25, v: 4.5, h: 2 };
        const screen = renderManager.boardToScreen(sample);
        const roundTrip = renderManager.screenToBoard(screen.x, screen.y, zoneId, sample.h);
        near(roundTrip.u, sample.u, `${zoneId} roundtrip u`, 1e-5);
        near(roundTrip.v, sample.v, `${zoneId} roundtrip v`, 1e-5);
        near(roundTrip.h, sample.h, `${zoneId} roundtrip h`, 1e-5);
      }

      const sortZoneId = zoneIds[0] || 'ivy-cloister';
      const baseSort = renderManager.computeRenderSortKey({ boardPos: { zoneId: sortZoneId, u: 1, v: 1, h: 0 } });
      const vSort = renderManager.computeRenderSortKey({ boardPos: { zoneId: sortZoneId, u: 1, v: 2, h: 0 } });
      const uSort = renderManager.computeRenderSortKey({ boardPos: { zoneId: sortZoneId, u: 2, v: 1, h: 0 } });
      const hSort = renderManager.computeRenderSortKey({ boardPos: { zoneId: sortZoneId, u: 1, v: 1, h: 1 } });
      assert(vSort > baseSort && (vSort - baseSort) >= 1000, 'render sort monotonic by v', { baseSort, vSort });
      assert(uSort > baseSort && Math.abs((uSort - baseSort) - 1) <= EPSILON, 'render sort monotonic by u', { baseSort, uSort });
      assert(hSort > baseSort && Math.abs((hSort - baseSort) - 0.5) <= EPSILON, 'render sort monotonic by h', { baseSort, hSort });
      near(renderManager.computeRenderSortKey({ zIndex: 12345 }), 12345, 'legacy zIndex fallback');
      near(renderManager.computeRenderSortKey({ gridPos: { x: 3, y: 4 } }), 4003, 'legacy gridPos fallback');
      near(structureSystem.distanceBoard({ u: 0, v: 0, h: 0 }, { u: 3, v: 4, h: 0 }), 5, 'structureSystem.distanceBoard flat');
      near(structureSystem.distanceBoard({ boardPos: { u: 0, v: 0, h: 0 } }, { boardPos: { u: 0, v: 0, h: 2 } }), 2, 'structureSystem.distanceBoard height');
      near(structureSystem.getProjectionPpu(sortZoneId), 20, 'structureSystem.getProjectionPpu');

      return {
        assertions,
        zoneIds,
        projection: renderManager.getProjectionForZone(sortZoneId)
      };
    });

    report.assertions = result.assertions;
    report.zoneIds = result.zoneIds;
    report.sampleProjection = result.projection;
    const failedAssertions = report.assertions.filter(assertion => !assertion.pass);
    const consoleErrors = report.consoleMessages.filter(entry => entry.type === 'error');
    report.overall = failedAssertions.length === 0 && report.pageErrors.length === 0 && consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (browser) await browser.close();
    if (serverProcess && !report.server?.reused) {
      try {
        process.kill(-serverProcess.pid);
      } catch (_error) {
        // The detached server may already have exited.
      }
    }
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Spatial projection unit test report: ${reportPath}`);
    console.log(`Overall: ${report.overall}`);
  }

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

main();
