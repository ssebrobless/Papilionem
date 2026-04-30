const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'sim_board_baseline_audit');
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

async function newModePage(browser, mode, report) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 }
  });
  await context.addInitScript(({ storageKeys, renderMode }) => {
    for (const key of storageKeys) {
      window.localStorage.removeItem(key);
    }
    window.__PAPILIONEM_WORLD_RENDERMODE__ = renderMode;
    window.localStorage.setItem('papilionem-world-rendermode', renderMode);
  }, { storageKeys: STORAGE_KEYS, renderMode: mode });
  const page = await context.newPage();
  page.on('console', msg => {
    report.consoleMessages.push({ mode, type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', error => {
    report.pageErrors.push({ mode, error: String(error) });
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
  });
  await page.waitForTimeout(800);
  return { context, page };
}

async function ensureZoneHasVisibleEntities(page, zoneId) {
  return page.evaluate((id) => {
    gameCore.focusZone?.(id);
    const point = gameCore.getRandomZonePoint?.(id, 44) || gameCore.getZoneCenter?.(id) || { x: 400, y: 225 };
    const focusedBlocks = (gameCore.getGameState?.().blocks || []).filter(block => block.currentZoneId === id);
    let focusedButterflies = (gameCore.getGameState?.().butterflies || []).filter(butterfly => butterfly.currentZoneId === id);
    while (focusedButterflies.length < 2 && (gameCore.getGameState?.().butterflies?.length || 0) < (gameConfig.entities.maxButterflies || 500)) {
      gameCore.godSpawnButterfly?.(point.x + (focusedButterflies.length * 18), point.y);
      focusedButterflies = (gameCore.getGameState?.().butterflies || []).filter(butterfly => butterfly.currentZoneId === id);
    }
    renderManager.drawBackground?.();
    renderManager.invalidateScene?.('sim-board-baseline-zone');
    renderManager.render?.();
    return {
      zoneId: id,
      focusedZoneId: gameCore.getFocusedZoneId?.(),
      butterflies: focusedButterflies.length,
      blocks: focusedBlocks.length,
      renderMode: gameConfig.world.renderMode
    };
  }, zoneId);
}

async function captureMode(browser, mode, outputDir, report) {
  const session = await newModePage(browser, mode, report);
  const { page, context } = session;
  try {
    const zoneIds = await page.evaluate(() => gameCore.getZoneIds?.() || []);
    const modeResult = {
      mode,
      zoneIds,
      captures: [],
      spawnCoverCompositeCalls: null,
      renderMode: null
    };

    for (const zoneId of zoneIds) {
      const state = await ensureZoneHasVisibleEntities(page, zoneId);
      await page.waitForTimeout(350);
      const screenshot = await saveShot(page, outputDir, `${mode}-${zoneId}`);
      modeResult.captures.push({
        zoneId,
        screenshot,
        state,
        pass: state.renderMode === mode && state.focusedZoneId === zoneId && state.butterflies > 0 && state.blocks > 0
      });
    }

    const spawnCoverProbe = await page.evaluate(() => {
      let calls = 0;
      const original = renderManager.drawSpawnCover.bind(renderManager);
      renderManager.drawSpawnCover = function patchedDrawSpawnCover(...args) {
        calls += 1;
        return original(...args);
      };
      renderManager.render?.();
      const metrics = renderManager.lastRenderMetrics || null;
      renderManager.drawSpawnCover = original;
      return {
        calls,
        spawnCoverCompositeMs: metrics?.compositeBreakdown?.spawnCoverCompositeMs ?? null,
        renderMode: gameConfig.world.renderMode
      };
    });
    modeResult.spawnCoverCompositeCalls = spawnCoverProbe.calls;
    modeResult.spawnCoverCompositeMs = spawnCoverProbe.spawnCoverCompositeMs;
    modeResult.renderMode = spawnCoverProbe.renderMode;
    modeResult.pass = modeResult.captures.every(capture => capture.pass)
      && (mode !== 'sim-board' || (spawnCoverProbe.calls === 0 && Number(spawnCoverProbe.spawnCoverCompositeMs || 0) === 0));
    return modeResult;
  } finally {
    await context.close();
  }
}

async function main() {
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);
  const report = {
    startedAt: new Date().toISOString(),
    outputDir,
    url: URL,
    server: null,
    consoleMessages: [],
    pageErrors: [],
    modes: [],
    overall: 'pending'
  };

  let browser;
  let serverProcess = null;

  try {
    serverProcess = await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    report.modes.push(await captureMode(browser, 'section-scenes', outputDir, report));
    report.modes.push(await captureMode(browser, 'sim-board', outputDir, report));
    const consoleErrors = report.consoleMessages.filter(entry => entry.type === 'error');
    report.overall = report.modes.every(mode => mode.pass)
      && report.pageErrors.length === 0
      && consoleErrors.length === 0
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
        // Server may already have exited.
      }
    }
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Sim-board baseline audit report: ${reportPath}`);
    console.log(`Overall: ${report.overall}`);
  }

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

main();
