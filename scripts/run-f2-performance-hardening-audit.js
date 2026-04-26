const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'f2_performance_hardening_audit');
const CAPTURE_ROOT = path.join(ROOT, 'qa_logs', 'session_captures');
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: {
          sessionId: 'audit-probe',
          label: 'audit-probe'
        },
        summary: {
          durationMs: 1
        }
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

  const auditPort = reachable ? 3012 : DEFAULT_PORT;
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
  ensureDir(CAPTURE_ROOT);
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
      deviceScaleFactor: 2.5
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

    const startState = await page.evaluate(() => {
      const caps = gameConfig?.performance?.canvas || {};
      const widthValue = Number(window.width || 0);
      const heightValue = Number(window.height || 0);
      const expectedCap = (widthValue * heightValue * Math.pow(window.devicePixelRatio || 1, 2)) >= (caps.highResolutionPixelThreshold || 1600000)
        ? (caps.largeCanvasPixelDensityCap || 1.5)
        : (caps.defaultPixelDensityCap || 2);
      return {
        devicePixelRatio: window.devicePixelRatio || 1,
        canvasPixelDensity: typeof pixelDensity === 'function' ? pixelDensity() : null,
        width: widthValue,
        height: heightValue,
        expectedCap,
        trailMode: renderManager?.getTrailVisibilityMode?.() || null,
        smoothButterflySprites: typeof renderManager?.shouldUseSmoothedButterflySprites === 'function'
          ? renderManager.shouldUseSmoothedButterflySprites()
          : null,
        pressure: gameCore?.telemetrySystem?.getPressureProfile?.() || null
      };
    });
    report.phases.push({
      name: 'hi-dpi-canvas-cap',
      pass:
        Number(startState?.canvasPixelDensity || 0) <= Number(startState?.expectedCap || 2)
        && startState?.trailMode === 'off',
      details: startState
    });

    await saveShot(page, outputDir, '01-hi-dpi-garden');

    await page.evaluate(() => {
      gameCore?.telemetrySystem?.startSessionCapture?.(gameCore.getGameState(), {
        label: 'f2-performance'
      });
      if (typeof gameUI !== 'undefined') {
        gameUI.activityLogPanel.visible = true;
        gameUI.inspectPanel.visible = false;
        gameUI.accessibilityPanel.visible = false;
        gameUI.resumeLatestFeedView?.();
      }
      const zoneIds = gameCore?.getZoneIds?.() || [];
      const nextZoneId = zoneIds.find(zoneId => zoneId !== gameCore?.getFocusedZoneId?.()) || null;
      if (nextZoneId) {
        gameCore?.focusZone?.(nextZoneId);
      }
      gameCore?.saveGameToStorage?.({ source: 'f2-audit' });
    });

    await page.waitForTimeout(9000);
    await saveShot(page, outputDir, '02-hi-dpi-stress');

    const telemetrySnapshot = await page.evaluate(() => {
      return {
        telemetry: gameCore?.getTelemetrySnapshot?.() || null,
        focusedGardenUpdateBudgetMs: gameConfig?.performance?.focusedGardenUpdateBudgetMs || 16
      };
    });
    report.phases.push({
      name: 'runtime-under-budget',
      pass:
        Number(telemetrySnapshot?.telemetry?.averages?.updateMs || 0) <= Number(telemetrySnapshot?.focusedGardenUpdateBudgetMs || 16)
        && (telemetrySnapshot?.telemetry?.pressure?.tier || 'critical') !== 'critical',
      details: telemetrySnapshot
    });

    const exportResult = await page.evaluate(async () => {
      return await gameCore.telemetrySystem.exportSessionCapture(gameCore.getGameState(), {
        source: 'f2-audit'
      });
    });
    report.exportResult = exportResult;

    report.phases.push({
      name: 'capture-shows-no-freeze-suspects',
      pass:
        Number(exportResult?.summary?.freezeSuspectCount || 0) === 0
        && Number(exportResult?.summary?.runtimeIssueCount || 0) === 0
        && (exportResult?.summary?.pressureTier || 'critical') !== 'critical',
      details: exportResult?.summary || null
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
