const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ml_pollen_trace_audit');
const URL = 'http://127.0.0.1:3000/';
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

async function ensureServer(report) {
  const reachable = await fetch(URL).then(() => true).catch(() => false);
  if (reachable) {
    report.server = { reused: true, pid: null };
    return;
  }
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  report.server = { reused: false, pid: child.pid };
  for (let attempt = 0; attempt < 80; attempt += 1) {
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
    gameConfig.ml = gameConfig.ml || {};
    gameConfig.ml.traceCapture = {
      ...(gameConfig.ml.traceCapture || {}),
      outcomeWindow: true
    };
    gameCore.focusZone?.('moss-hollow');
  });
}

function addCheck(report, name, pass, details = {}) {
  report.checks.push({ name, pass: !!pass, details });
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    checks: [],
    overall: 'pending'
  };

  let browser;
  let page;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', error => report.pageErrors.push(String(error?.message || error)));
    page.on('console', message => {
      if (message.type() === 'error') report.consoleErrors.push(message.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await resetBaseline(page);

    const result = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const butterfly = state.butterflies?.[0] || null;
      if (!butterfly?.id) return { ok: false, reason: 'missing-butterfly' };

      const boardPos = {
        zoneId: 'moss-hollow',
        u: 12,
        v: 12,
        h: 0
      };
      const screen = renderManager.boardToScreen?.(boardPos) || { x: 400, y: 400 };
      butterfly.currentZoneId = boardPos.zoneId;
      butterfly.boardPos = { ...boardPos };
      butterfly.x = screen.x;
      butterfly.y = screen.y;
      butterfly.lifeSim = butterfly.lifeSim || {};
      butterfly.lifeSim.lifecycle = {
        ...(butterfly.lifeSim.lifecycle || {}),
        currentZoneId: boardPos.zoneId
      };
      butterfly.lifeSim.objectAwareness = {
        flowerFamiliarity: 0.32,
        pollenFamiliarity: 0.12,
        focusType: 'none',
        currentAffordance: 'observe',
        carryingType: 'none'
      };
      butterfly.pollenInventory = {
        charges: 1,
        color: '#f2c94c',
        expiresAtFrame: (gameCore.getCurrentFrame?.() || 0) + 7200,
        sourceFlowerId: 'ml-pollen-trace-audit'
      };
      butterfly.pendingPollenDropTarget = {
        zoneId: boardPos.zoneId,
        u: boardPos.u + 1,
        v: boardPos.v,
        h: 0,
        assignedAtFrame: gameCore.getCurrentFrame?.() || 0,
        reason: 'ml-pollen-trace-audit'
      };
      butterfly.syncDebugGridPos?.();
      gameCore.assignEntityToZone?.(butterfly, boardPos.zoneId);

      const runtime = mlInferenceSystem.registerEntity(butterfly);
      runtime.decisionHistory = [];
      runtime.nextOutcomeDueFrame = null;
      runtime.lastHistoryKey = null;
      const startFrame = gameCore.getCurrentFrame?.() || 0;
      const behaviorRuntime = behaviorSystem?.getRuntime?.(butterfly.id) || null;
      const signature = mlInferenceSystem.computeContextSignature(butterfly, state, behaviorRuntime);
      mlInferenceSystem.refreshEntityTrace(butterfly, state, runtime, signature, behaviorRuntime, {
        currentFrame: startFrame,
        cadenceIntervalFrames: 1,
        cadenceOffset: 0
      });
      const delay = mlInferenceSystem.getOutcomeWindowDelayFrames?.() || 60;
      mlInferenceSystem.populateOutcomeWindows(state, startFrame + delay + 1);

      const features = runtime.features || null;
      const flat = features?.flatFeatures || {};
      const objectAwareness = features?.groups?.objectAwareness || {};
      const latestEntry = runtime.decisionHistory?.[runtime.decisionHistory.length - 1] || null;
      const corpusRecord = mlInferenceSystem.buildCorpusRecord(butterfly.id, state, {
        scenarioId: 'ml-pollen-trace-audit',
        scenarioFamily: 'pollen-cooperation',
        auditPhase: 'env27-pollen-ml-observability',
        tags: ['pollen', 'planting', 'cooperation', 'ml-observability'],
        review: {
          rationale: 'Measurement-only audit proving active pollen carrying and pending planting are visible to the ML trace path.'
        }
      });

      return {
        ok: true,
        entityId: butterfly.id,
        objectAwareness,
        flat: {
          focusIsPollen: flat['object.focusIsPollen'],
          affordanceIsPlant: flat['object.affordanceIsPlant'],
          pollenFamiliarity: flat['object.pollenFamiliarity']
        },
        numericVectorLength: features?.numericVector?.length || 0,
        outcomeWindow: latestEntry?.outcomeWindow || null,
        corpus: {
          scenarioId: corpusRecord?.scenarioId || null,
          scenarioFamily: corpusRecord?.scenarioFamily || null,
          tags: corpusRecord?.tags || [],
          metadataFocusType: corpusRecord?.metadata?.focusType || null,
          featureFocusType: corpusRecord?.features?.groups?.objectAwareness?.focusType || null,
          featureAffordance: corpusRecord?.features?.groups?.objectAwareness?.currentAffordance || null,
          featureCarryingType: corpusRecord?.features?.groups?.objectAwareness?.carryingType || null,
          outcomeWindowCount: corpusRecord?.outcomeWindowCount || 0
        }
      };
    });

    addCheck(report, 'pollen-fixture-created', result.ok === true, result);
    addCheck(report, 'feature-focus-is-pollen', result.objectAwareness?.focusType === 'pollen', {
      objectAwareness: result.objectAwareness
    });
    addCheck(report, 'feature-affordance-is-plant', result.objectAwareness?.currentAffordance === 'plant', {
      objectAwareness: result.objectAwareness
    });
    addCheck(report, 'feature-carrying-type-is-pollen', result.objectAwareness?.carryingType === 'pollen', {
      objectAwareness: result.objectAwareness
    });
    addCheck(report, 'flat-pollen-indicators-present', result.flat?.focusIsPollen === 1 && result.flat?.affordanceIsPlant === 1, {
      flat: result.flat
    });
    addCheck(report, 'outcome-window-captures-pollen-state', result.outcomeWindow?.object?.focusType === 'pollen'
      && result.outcomeWindow?.object?.affordance === 'plant'
      && result.outcomeWindow?.object?.carryingType === 'pollen'
      && result.outcomeWindow?.object?.pendingPollenDrop === true, {
      outcomeWindow: result.outcomeWindow
    });
    addCheck(report, 'corpus-record-carries-pollen-context', result.corpus?.featureFocusType === 'pollen'
      && result.corpus?.featureAffordance === 'plant'
      && result.corpus?.featureCarryingType === 'pollen', {
      corpus: result.corpus
    });
    addCheck(report, 'browser-clean', report.pageErrors.length === 0 && report.consoleErrors.length === 0, {
      pageErrors: report.pageErrors,
      consoleErrors: report.consoleErrors
    });

    report.result = result;
    report.overall = report.checks.every(check => check.pass) ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath,
      checks: report.checks.map(check => ({ name: check.name, pass: check.pass }))
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run();
