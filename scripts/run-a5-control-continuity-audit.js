const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'a5_control_continuity_audit');
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

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function resetBaseline(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
  });
  await page.waitForTimeout(1000);
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

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    url: URL,
    phases: [],
    pageErrors: [],
    consoleErrors: [],
    server: null,
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

    await phase(page, report, outputDir, '01-redundant-ui-hotkeys-disabled', async () => {
      const details = await page.evaluate(() => {
        const snapshot = () => ({
          journalVisible: !!gameUI.butterflyCollection?.visible,
          inspectVisible: !!gameUI.inspectPanel?.visible,
          accessVisible: !!gameUI.accessibilityPanel?.visible,
          saveState: gameUI.saveStatus?.state || 'idle',
          viewMode: gameCore?.getGameState?.().viewMode || null,
          focusedZoneId: gameCore?.getGameState?.().focusedZoneId || null,
          accessibility: {
            reducedMotion: !!gameUI.accessibilitySettings?.reducedMotion,
            battleMotionSimplify: !!gameUI.accessibilitySettings?.battleMotionSimplify,
            highContrastUI: !!gameUI.accessibilitySettings?.highContrastUI,
            trailVisibility: gameUI.accessibilitySettings?.trailVisibility || null,
            backgroundAtmosphere: gameUI.accessibilitySettings?.backgroundAtmosphere || null
          }
        });

        const before = snapshot();
        const tests = [
          { key: 'C', keyCode: 0 },
          { key: 'I', keyCode: 0 },
          { key: 'A', keyCode: 0 },
          { key: 'K', keyCode: 0 },
          { key: 'M', keyCode: 0 },
          { key: 'T', keyCode: 0 },
          { key: 'G', keyCode: 0 },
          { key: 'H', keyCode: 0 },
          { key: 'S', keyCode: 0 },
          { key: '[', keyCode: 0 },
          { key: ']', keyCode: 0 },
          { key: '1', keyCode: 0 }
        ];

        const results = tests.map(test => {
          const consumed = gameUI.handleKeyPress(test.key, test.keyCode);
          const after = snapshot();
          return {
            key: test.key,
            consumed,
            stateChanged: JSON.stringify(after) !== JSON.stringify(before),
            after
          };
        });

        return {
          before,
          results
        };
      });

      return {
        pass:
          Array.isArray(details.results) &&
          details.results.every(result => result.consumed === false && result.stateChanged === false),
        details
      };
    });

    await phase(page, report, outputDir, '02-escape-cancels-inspect-release', async () => {
      const details = await page.evaluate(() => {
        const startZoneId = progressionManager.getFreshSeedZoneId(gameCore.gameState, gameCore.getZoneIds());
        gameCore.focusZone(startZoneId);
        gameUI.inspectPanel.visible = true;
        gameUI.enterInspectReleaseMode(gameCore.gameState);
        const before = !!gameUI.inspectControl.releaseMode;
        const consumed = gameUI.handleKeyPress('', 27);
        return {
          before,
          consumed,
          after: !!gameUI.inspectControl.releaseMode,
          scrollOffset: gameUI.inspectPanel.scrollOffset
        };
      });

      return {
        pass:
          details.before === true &&
          details.consumed === true &&
          details.after === false &&
          details.scrollOffset === 0,
        details
      };
    });

    await phase(page, report, outputDir, '03-debug-keeps-specimen-counters', async () => {
      const details = await page.evaluate(() => {
        const original = renderManager.drawFPSCounter.bind(renderManager);
        const calls = [];
        renderManager.drawFPSCounter = function(layer, options = {}) {
          calls.push({
            debugEnabled: !!gameCore.getDebugMode?.().enabled,
            panelX: Number.isFinite(options.panelX) ? options.panelX : 8,
            panelY: Number.isFinite(options.panelY) ? options.panelY : 10
          });
          return original(layer, options);
        };

        gameCore.setDebugEnabled(false);
        renderManager.drawUILayer();
        gameCore.setDebugEnabled(true);
        renderManager.drawDebugLayer();
        gameCore.setDebugEnabled(false);
        renderManager.drawFPSCounter = original;

        return { calls };
      });

      const normalCall = (details.calls || []).find(call => call.debugEnabled === false);
      const debugCall = (details.calls || []).find(call => call.debugEnabled === true);
      return {
        pass:
          !!normalCall &&
          !!debugCall &&
          debugCall.panelY > 300,
        details
      };
    });

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
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
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
