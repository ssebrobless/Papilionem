const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'h1_real_save_attribution_audit');
const DEFAULT_PORT = 3000;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function buildUrl(port) {
  return `http://127.0.0.1:${port}/`;
}

async function hasCaptureEndpoint(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}api/session-captures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: { sessionId: 'h1-probe', label: 'h1-probe' },
        summary: { durationMs: 1 }
      })
    });
    return response.ok;
  } catch (_error) {
    return false;
  }
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
  if (reachable && await hasCaptureEndpoint(defaultUrl)) {
    report.server = { reused: true, pid: null, port: DEFAULT_PORT };
    return defaultUrl;
  }

  const auditPort = reachable ? 3014 : DEFAULT_PORT;
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

  const becameReachable = await waitForServer(auditUrl);
  if (!becameReachable) {
    throw new Error(`Server did not become reachable in time on port ${auditPort}`);
  }
  if (!await hasCaptureEndpoint(auditUrl)) {
    throw new Error(`Session capture endpoint was not available on port ${auditPort}`);
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
    url: null,
    server: null,
    phases: [],
    pageErrors: [],
    consoleErrors: [],
    exportResult: null,
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
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2
    });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    await page.evaluate(() => {
      const state = gameCore.getGameState();
      gameCore.telemetrySystem?.startSessionCapture?.(state, {
        label: 'h1-attribution'
      });
      if (typeof gameUI !== 'undefined') {
        gameUI.activityLogPanel.visible = true;
        gameUI.inspectPanel.visible = true;
        gameUI.accessibilityPanel.visible = true;
        gameUI.resumeLatestFeedView?.();
      }
    });

    await page.waitForTimeout(4500);
    await saveShot(page, outputDir, '01-h1-shell-load');

    const shellState = await page.evaluate(() => {
      return gameUI?.getShellPerformanceState?.(gameCore.getGameState()) || null;
    });
    report.phases.push({
      name: 'shell-state-visible',
      pass: Number(shellState?.openPanelCount || 0) >= 3,
      details: shellState
    });

    const exportResult = await page.evaluate(async () => {
      return await gameCore.telemetrySystem.exportSessionCapture(gameCore.getGameState(), {
        source: 'h1-attribution-audit'
      });
    });
    report.exportResult = exportResult;

    const capturePayload = JSON.parse(fs.readFileSync(exportResult.capturePath, 'utf8'));
    const summaryText = fs.readFileSync(exportResult.summaryPath, 'utf8');
    const attribution = capturePayload?.telemetry?.attribution || null;
    const lastUpdateSample = capturePayload?.telemetry?.lastUpdateSample || null;
    const lastRenderSample = capturePayload?.telemetry?.lastRenderSample || null;

    report.phases.push({
      name: 'capture-version-updated',
      pass: capturePayload?.version === 'h1-session-capture-v2',
      details: { version: capturePayload?.version || null }
    });

    report.phases.push({
      name: 'update-breakdowns-present',
      pass:
        attribution
        && Array.isArray(attribution.topUpdateContributors)
        && attribution.topUpdateContributors.length > 0
        && Object.keys(lastUpdateSample?.foundationBreakdown || {}).length > 0
        && Object.keys(lastUpdateSample?.entityBreakdown || {}).length > 0
        && Object.keys(lastUpdateSample?.worldBreakdown || {}).length > 0,
      details: {
        category: attribution?.category || null,
        topUpdateContributors: attribution?.topUpdateContributors || [],
        foundationBreakdown: lastUpdateSample?.foundationBreakdown || null,
        entityBreakdown: lastUpdateSample?.entityBreakdown || null,
        worldBreakdown: lastUpdateSample?.worldBreakdown || null
      }
    });

    report.phases.push({
      name: 'render-breakdowns-present',
      pass:
        attribution
        && Array.isArray(attribution.topRenderContributors)
        && attribution.topRenderContributors.length > 0
        && Object.keys(lastRenderSample?.renderBreakdownFlat || {}).length > 0
        && Number(lastRenderSample?.shellState?.openPanelCount || 0) >= 3,
      details: {
        topRenderContributors: attribution?.topRenderContributors || [],
        renderBreakdown: lastRenderSample?.renderBreakdown || null,
        renderBreakdownFlat: lastRenderSample?.renderBreakdownFlat || null,
        shellState: lastRenderSample?.shellState || null
      }
    });

    report.phases.push({
      name: 'summary-txt-surfaces-attribution',
      pass:
        summaryText.includes('lagCategory:')
        && summaryText.includes('topUpdate:')
        && summaryText.includes('topRender:')
        && summaryText.includes('shell:'),
      details: {
        summaryPreview: summaryText.split('\n').slice(0, 20)
      }
    });

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
