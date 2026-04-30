const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const REPORT_ROOT = path.join(ROOT, 'qa_logs', 'session_captures');
const DENSITIES = [12, 50, 100, 200];
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-world-rendermode'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function isAllowedDensityWarning(entry) {
  const kinds = entry.summary?.runtimeIssueKinds || {};
  const warningKinds = Object.keys(kinds).filter(kind => Number(kinds[kind] || 0) > 0);
  const freezeSuspectCount = Number(entry.summary?.freezeSuspectCount || 0);
  return warningKinds.length === 1
    && warningKinds[0] === 'cadence-budget-overrun'
    && Number(entry.summary?.errorRuntimeIssueCount || 0) === 0
    && (
      freezeSuspectCount === 0 ||
      (entry.targetCount >= 200 && freezeSuspectCount <= 2)
    );
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
    window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    if (gameConfig?.world) {
      gameConfig.world.renderMode = 'sim-board';
    }
    if (gameConfig?.balance?.migration) {
      gameConfig.balance.migration.autoHabitatTravel = false;
    }
    gameUI?.dismissFirstSessionGuide?.(true);
    await gameCore.resetGame(true);
    gameUI?.dismissFirstSessionGuide?.(true);
    gameCore.focusZone?.('ivy-cloister');
  });
  await page.waitForTimeout(700);
}

async function forceDensity(page, targetCount) {
  return await page.evaluate((target) => {
    if (gameConfig?.entities) {
      gameConfig.entities.maxButterflies = Math.max(gameConfig.entities.maxButterflies || 0, target);
    }
    if (gameConfig?.balance?.migration) {
      gameConfig.balance.migration.autoHabitatTravel = false;
    }
    if (gameConfig?.world) {
      gameConfig.world.renderMode = 'sim-board';
    }

    const zoneId = 'ivy-cloister';
    gameCore.focusZone?.(zoneId);
    const center = gameCore.getZoneCenter(zoneId);
    const region = gameCore.getZonePlacementRegion?.(zoneId) || null;
    const before = (gameCore.gameState.butterflies || []).length;
    let attempts = 0;

    while ((gameCore.gameState.butterflies || []).length < target && attempts < target * 4) {
      const index = (gameCore.gameState.butterflies || []).length;
      const cols = Math.max(1, Math.ceil(Math.sqrt(target)));
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = region
        ? region.minX + 28 + ((col + 0.5) / cols) * Math.max(1, region.maxX - region.minX - 56)
        : (center?.x || 400) + ((col % 10) - 5) * 18;
      const y = region
        ? region.minY + 28 + ((row + 0.5) / cols) * Math.max(1, region.maxY - region.minY - 56)
        : (center?.y || 250) + (row - 5) * 14;
      gameCore.godSpawnButterfly(x, y, null);
      attempts += 1;
    }

    return {
      target,
      before,
      after: (gameCore.gameState.butterflies || []).length,
      focusedZoneId: gameCore.getFocusedZoneId?.() || null,
      renderMode: gameConfig?.world?.renderMode || null,
      autoHabitatTravel: gameConfig?.balance?.migration?.autoHabitatTravel ?? null
    };
  }, targetCount);
}

async function runDensity(page, targetCount) {
  await resetBaseline(page);
  const setup = await forceDensity(page, targetCount);
  await page.waitForTimeout(1200);
  await page.evaluate((label) => {
    gameCore.telemetrySystem?.startSessionCapture?.(gameCore.getGameState(), { label });
  }, `p7-sim-board-density-${targetCount}`);
  await page.waitForTimeout(3200);
  const exportResult = await page.evaluate(async () => {
    return await gameCore.telemetrySystem.exportSessionCapture(gameCore.getGameState(), {
      source: 'p7-sim-board-density'
    });
  });
  const screenshotPath = exportResult?.outputDir
    ? path.join(exportResult.outputDir, `density-${targetCount}.png`)
    : path.join(REPORT_ROOT, `p7-density-${targetCount}-${stamp()}.png`);
  ensureDir(path.dirname(screenshotPath));
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    targetCount,
    setup,
    screenshotPath,
    exportResult,
    summary: exportResult?.summary || exportResult?.payloadSummary || null
  };
}

async function run() {
  ensureDir(REPORT_ROOT);
  const report = {
    auditId: stamp(),
    startedAt: new Date().toISOString(),
    url: URL,
    densities: [],
    pageErrors: [],
    consoleErrors: [],
    server: null,
    overall: 'pending'
  };

  let browser;
  let context;
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
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    for (const targetCount of DENSITIES) {
      report.densities.push(await runDensity(page, targetCount));
    }

    report.overall = report.densities.every(entry => {
      const warningCount = Number(entry.summary?.runtimeIssueCount || 0);
      return entry.setup?.after >= entry.targetCount &&
        entry.summary?.endButterflies >= entry.targetCount &&
        Number(entry.summary?.errorCount || 0) === 0 &&
        Number(entry.summary?.warningCount || 0) === 0 &&
        Number(entry.summary?.errorRuntimeIssueCount || 0) === 0 &&
        (
          Number(entry.summary?.freezeSuspectCount || 0) === 0 ||
          isAllowedDensityWarning(entry)
        ) &&
        (warningCount === 0 || isAllowedDensityWarning(entry));
    }) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(REPORT_ROOT, `p7-sim-board-density-report-${report.auditId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify({
      reportPath,
      overall: report.overall,
      densities: report.densities.map(entry => ({
        targetCount: entry.targetCount,
        endButterflies: entry.summary?.endButterflies || null,
        avgUpdateMs: entry.summary?.avgUpdateMs || null,
        avgRenderMs: entry.summary?.avgRenderMs || null,
        p95FrameMs: entry.summary?.p95FrameMs || null,
        outputDir: entry.exportResult?.outputDir || null,
        screenshotPath: entry.screenshotPath || null
      })),
      pageErrors: report.pageErrors,
      consoleErrors: report.consoleErrors
    }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
