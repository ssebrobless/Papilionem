const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'f1_session_capture_audit');
const DEFAULT_PORT = 3000;
const CAPTURE_ROOT = path.join(ROOT, 'qa_logs', 'session_captures');

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

  const auditPort = reachable ? 3011 : DEFAULT_PORT;
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

function getLatestCaptureDir() {
  if (!fs.existsSync(CAPTURE_ROOT)) return null;
  const directories = fs.readdirSync(CAPTURE_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => ({
      name: entry.name,
      fullPath: path.join(CAPTURE_ROOT, entry.name),
      mtimeMs: fs.statSync(path.join(CAPTURE_ROOT, entry.name)).mtimeMs
    }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  return directories[0] || null;
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
      viewport: { width: 1600, height: 900 }
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
    await saveShot(page, outputDir, '01-garden');

    await page.keyboard.press('KeyD');
    await page.waitForTimeout(300);
    await saveShot(page, outputDir, '02-debug-mode');

    const captureStart = await page.evaluate(() => {
      debugUI?.startSessionCapture?.();
      return gameCore?.telemetrySystem?.getSessionCaptureSummary?.() || null;
    });
    report.phases.push({
      name: 'start-capture',
      pass: !!captureStart?.active,
      details: captureStart
    });

    await page.waitForTimeout(1200);

    const interactionResult = await page.evaluate(() => {
      const zoneIds = gameCore?.getZoneIds?.() || [];
      const nextZoneId = zoneIds.find(zoneId => zoneId !== gameCore?.getFocusedZoneId?.()) || null;
      const focusChanged = nextZoneId ? !!gameCore?.focusZone?.(nextZoneId) : false;
      gameCore?.saveGameToStorage?.({ source: 'f1-audit' });
      return {
        nextZoneId,
        focusChanged,
        telemetry: gameCore?.getTelemetrySnapshot?.() || null
      };
    });
    report.phases.push({
      name: 'generate-session-events',
      pass: !!interactionResult?.telemetry,
      details: {
        nextZoneId: interactionResult?.nextZoneId || null,
        focusChanged: !!interactionResult?.focusChanged,
        capture: interactionResult?.telemetry?.sessionCapture || null
      }
    });

    await page.waitForTimeout(5600);

    const exportResult = await page.evaluate(async () => {
      return await gameCore.telemetrySystem.exportSessionCapture(gameCore.getGameState(), {
        source: 'f1-audit'
      });
    });
    report.exportResult = exportResult;
    await page.waitForTimeout(400);
    await saveShot(page, outputDir, '03-after-export');

    const latestCaptureDir = getLatestCaptureDir();
    const capturePath = exportResult?.capturePath || latestCaptureDir && path.join(latestCaptureDir.fullPath, 'capture.json');
    const summaryPath = exportResult?.summaryPath || latestCaptureDir && path.join(latestCaptureDir.fullPath, 'summary.txt');

    const captureExists = !!capturePath && fs.existsSync(capturePath);
    const summaryExists = !!summaryPath && fs.existsSync(summaryPath);
    const captureJson = captureExists ? JSON.parse(fs.readFileSync(capturePath, 'utf8')) : null;
    const summaryText = summaryExists ? fs.readFileSync(summaryPath, 'utf8') : '';

    report.phases.push({
      name: 'export-files-written',
      pass: captureExists && summaryExists,
      details: {
        capturePath: capturePath || null,
        summaryPath: summaryPath || null
      }
    });

    report.phases.push({
      name: 'capture-payload-shape',
      pass:
        !!captureJson?.session?.sessionId &&
        Number(captureJson?.summary?.durationMs || 0) > 0 &&
        Array.isArray(captureJson?.timeline) &&
        captureJson.timeline.length >= 3 &&
        Array.isArray(captureJson?.eventHistory) &&
        summaryText.includes('Papilionem Session Capture'),
      details: {
        sessionId: captureJson?.session?.sessionId || null,
        durationMs: captureJson?.summary?.durationMs || 0,
        timelineCount: captureJson?.timeline?.length || 0,
        eventHistoryCount: captureJson?.eventHistory?.length || 0,
        runtimeIssueCount: captureJson?.runtimeIssues?.length || 0,
        summaryIncludesHeader: summaryText.includes('Papilionem Session Capture')
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
