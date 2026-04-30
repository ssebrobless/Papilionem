const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ml_trace_capture_audit');
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

async function waitForMlModel(page) {
  await page.waitForFunction(() => {
    if (typeof mlInferenceSystem === 'undefined') return false;
    if (!mlInferenceSystem.modelConfig?.useModelInference) return true;
    return !!mlInferenceSystem.modelRuntime?.modelLoaded || !!mlInferenceSystem.modelRuntime?.lastLoadError;
  }, null, { timeout: 15000 });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1200);
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
    gameConfig.ml = gameConfig.ml || {};
    gameConfig.ml.traceCapture = {
      ...(gameConfig.ml.traceCapture || {}),
      outcomeWindow: true
    };
  });
  await waitForMlModel(page);
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && state.butterflies?.length >= 6;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(500);
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
    outputDir,
    pageErrors: [],
    consoleErrors: [],
    server: null,
    checks: [],
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

    const result = await page.evaluate(() => {
      const cadenceBefore = {
        mlScoringIntervalFrames: gameConfig?.simulation?.cadence?.mlScoringIntervalFrames,
        mlScoringBudgetMs: gameConfig?.simulation?.cadence?.mlScoringBudgetMs
      };
      const historyLimit = mlInferenceSystem.modelConfig?.decisionHistoryLimit || 0;
      const startFrame = gameCore.getCurrentFrame?.() || 0;

      for (let frame = 0; frame < 1200; frame += 1) {
        gameCore.update();
      }

      const currentFrame = gameCore.getCurrentFrame?.() || mlInferenceSystem.frameCounter || startFrame + 1200;
      const runtimes = [...mlInferenceSystem.runtimeByEntityId.values()];
      const entries = runtimes.flatMap(runtime => runtime.decisionHistory || []);
      const dueEntries = entries.filter(entry => Number.isFinite(entry?.outcomeDueFrame) && currentFrame >= entry.outcomeDueFrame);
      const populatedEntries = dueEntries.filter(entry => !!entry?.outcomeWindow);
      const historiesWithinLimit = runtimes.every(runtime => (runtime.decisionHistory || []).length <= historyLimit);
      const sample = populatedEntries[0]?.outcomeWindow || null;
      const cadenceAfter = {
        mlScoringIntervalFrames: gameConfig?.simulation?.cadence?.mlScoringIntervalFrames,
        mlScoringBudgetMs: gameConfig?.simulation?.cadence?.mlScoringBudgetMs
      };

      gameConfig.ml.traceCapture.outcomeWindow = false;
      const disableStartFrame = gameCore.getCurrentFrame?.() || currentFrame;
      const target = gameCore.getGameState().butterflies?.[0] || null;
      let disabledOutcomeCount = 0;
      if (target) {
        const runtime = mlInferenceSystem.registerEntity(target);
        runtime.decisionHistory = [];
        runtime.lastHistoryKey = null;
        mlInferenceSystem.refreshEntityTrace(
          target,
          gameCore.getGameState(),
          runtime,
          `p8-disabled-${disableStartFrame}`,
          behaviorSystem?.getRuntime?.(target.id) || null,
          { currentFrame: disableStartFrame }
        );
        for (let frame = 1; frame <= 72; frame += 1) {
          mlInferenceSystem.update(gameCore.getGameState(), 1 / 60, { currentFrame: disableStartFrame + frame });
        }
        disabledOutcomeCount = (runtime.decisionHistory || []).filter(entry => !!entry?.outcomeWindow).length;
      }

      return {
        startFrame,
        currentFrame,
        runtimeCount: runtimes.length,
        decisionEntryCount: entries.length,
        dueEntryCount: dueEntries.length,
        populatedEntryCount: populatedEntries.length,
        populatedRatio: dueEntries.length ? populatedEntries.length / dueEntries.length : 0,
        historiesWithinLimit,
        historyLimit,
        sample,
        disabledOutcomeCount,
        cadenceBefore,
        cadenceAfter,
        cadenceUnchanged: JSON.stringify(cadenceBefore) === JSON.stringify(cadenceAfter)
      };
    });

    report.checks.push({
      name: 'focused-garden-1200-frame-outcome-window-fill',
      pass: result.dueEntryCount > 0 && result.populatedRatio >= 0.8,
      details: result
    });
    report.checks.push({
      name: 'decision-history-limit-preserved',
      pass: !!result.historiesWithinLimit,
      details: { historyLimit: result.historyLimit }
    });
    report.checks.push({
      name: 'ml-cadence-cost-config-unchanged',
      pass: !!result.cadenceUnchanged,
      details: {
        before: result.cadenceBefore,
        after: result.cadenceAfter
      }
    });
    report.checks.push({
      name: 'outcome-window-flag-disables-capture',
      pass: result.disabledOutcomeCount === 0,
      details: { disabledOutcomeCount: result.disabledOutcomeCount }
    });
    report.checks.push({
      name: 'browser-clean',
      pass: report.pageErrors.length === 0 && report.consoleErrors.length === 0,
      details: {
        pageErrors: report.pageErrors,
        consoleErrors: report.consoleErrors
      }
    });

    report.overall = report.checks.every(check => check.pass) ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath,
      checks: report.checks.map(check => ({ name: check.name, pass: check.pass }))
    }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
