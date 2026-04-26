const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'v0_5_free_wins_audit');
const DEFAULT_PORT = 3000;
const FLAG_OVERRIDES = {
  pauseWhenHidden: true,
  asyncImageDecode: true,
  telemetryRingCap: true,
  textMeasureCache: true,
  saveStoreIndexedDbOnly: false
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function buildUrl(port) {
  return `http://127.0.0.1:${port}/`;
}

async function waitForServer(baseUrl) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ok = await fetch(baseUrl).then(() => true).catch(() => false);
    if (ok) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

async function ensureServer(report) {
  const defaultUrl = buildUrl(DEFAULT_PORT);
  const reachable = await fetch(defaultUrl).then(() => true).catch(() => false);
  if (reachable) {
    report.server = { reused: true, pid: null, port: DEFAULT_PORT };
    return defaultUrl;
  }

  const auditPort = 3021;
  const auditUrl = buildUrl(auditPort);
  const { spawn } = require('child_process');
  const serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: String(auditPort)
    }
  });
  serverProcess.unref();
  report.server = { reused: false, pid: serverProcess.pid, port: auditPort };

  const reachableAudit = await waitForServer(auditUrl);
  if (!reachableAudit) {
    throw new Error(`Server did not become reachable on port ${auditPort}`);
  }
  return auditUrl;
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

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    flagOverrides: { ...FLAG_OVERRIDES },
    server: null,
    url: null,
    phases: [],
    pageErrors: [],
    consoleErrors: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let page;

  try {
    const baseUrl = await ensureServer(report);
    report.url = baseUrl;

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    page = await context.newPage();

    await page.addInitScript(overrides => {
      window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = overrides;
    }, FLAG_OVERRIDES);

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    const runtimeFlags = await page.evaluate(() => ({
      flags: { ...(gameConfig?.performance?.flags || {}) },
      spriteDecodeMode: spriteManager?.assetDecodeMode || null
    }));
    report.phases.push({
      name: 'flag-overrides-live',
      pass:
        runtimeFlags.flags.pauseWhenHidden === true &&
        runtimeFlags.flags.asyncImageDecode === true &&
        runtimeFlags.flags.telemetryRingCap === true &&
        runtimeFlags.flags.textMeasureCache === true &&
        runtimeFlags.spriteDecodeMode === 'async-image-decode',
      details: runtimeFlags
    });

    await saveShot(page, outputDir, '01-runtime-ready');

    const v05State = await page.evaluate(async () => {
      const state = gameCore.getGameState();
      const layer = renderManager?.layers?.ui || renderManager?.uiLayer || null;
      gameCore.telemetrySystem.startSessionCapture(state, {
        label: 'v0.5-free-wins-audit'
      });

      gameUI.wrapTextLines(layer, 'Papilionem caches text widths before wrapping long shell copy.', 180, 8);
      gameUI.truncateText(layer, 'Papilionem caches truncation widths too.', 120);
      gameUI.butterflyCollection?.wrapTextLines?.(layer, 'Collection panels also reuse cached width lookups.', 180, 8);
      debugUI.wrapDebugText('Debug panels reuse cached layout measurements as well.', 24);

      for (let index = 0; index < 620; index += 1) {
        gameCore.telemetrySystem.recordSessionEvent('audit', 'ring-cap-event', { index });
      }
      for (let index = 0; index < 120; index += 1) {
        gameCore.telemetrySystem.recordRuntimeIssue('audit-runtime-issue', { index });
      }

      const beforePauseSamples = {
        updates: gameCore.telemetrySystem.recentUpdateSamples.length,
        renders: gameCore.telemetrySystem.recentRenderSamples.length
      };

      gameCore.pauseForHiddenTab();
      const duringPause = {
        hiddenLoopPauseActive: !!gameCore.hiddenLoopPauseActive,
        isLooping: typeof isLooping === 'function' ? isLooping() : null
      };

      gameCore.resumeFromHiddenTab();
      const afterResume = {
        hiddenLoopPauseActive: !!gameCore.hiddenLoopPauseActive,
        isLooping: typeof isLooping === 'function' ? isLooping() : null,
        updates: gameCore.telemetrySystem.recentUpdateSamples.length,
        renders: gameCore.telemetrySystem.recentRenderSamples.length
      };

      await gameCore.saveGameToStorage?.({ source: 'v0.5-audit' });
      const stored = await saveSystem.readPayloadFromStorage('papilionem-save-v2');

      const exportResult = await gameCore.telemetrySystem.exportSessionCapture(gameCore.getGameState(), {
        source: 'v0.5-audit'
      });

      return {
        beforePauseSamples,
        duringPause,
        afterResume,
        textMeasureCacheSize: typeof textMeasureCache !== 'undefined'
          ? textMeasureCache.cache.size
          : 0,
        storedBackend: stored?.backend || null,
        captureSummary: exportResult?.summary || null,
        captureOutput: exportResult?.outputDir || null
      };
    });

    report.phases.push({
      name: 'v0.5-runtime-seams',
      pass:
        v05State.textMeasureCacheSize > 0 &&
        v05State.duringPause.hiddenLoopPauseActive === true &&
        v05State.duringPause.isLooping === false &&
        v05State.afterResume.hiddenLoopPauseActive === false &&
        v05State.afterResume.isLooping === true &&
        Number(v05State.afterResume.updates || 0) <= 1 &&
        Number(v05State.afterResume.renders || 0) <= 1 &&
        v05State.storedBackend === 'indexeddb' &&
        Number(v05State.captureSummary?.totalTimelineEntries || 0) <= 480 &&
        Number(v05State.captureSummary?.timelineDroppedCount || 0) > 0 &&
        Number(v05State.captureSummary?.runtimeIssueCount || 0) <= 96 &&
        Number(v05State.captureSummary?.runtimeIssuesDroppedCount || 0) > 0 &&
        !!v05State.captureOutput,
      details: v05State
    });

    await saveShot(page, outputDir, '02-v0-5-seams');

    report.overall = report.phases.every(phase => phase.pass) && report.pageErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = error?.stack || String(error);
  } finally {
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
