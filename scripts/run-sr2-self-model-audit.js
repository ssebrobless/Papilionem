// SR2 - Self-Model Audit
//
// Proves the additive lifeSim.selfModel field exists, round-trips, migrates
// from v4 saves, updates after workspace without mutating workspace queues, and
// can be disabled without erasing saved state.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'sr2_self_model_audit');
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-sr2-legacy-probe'
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
  for (let attempt = 0; attempt < 80; attempt += 1) {
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
  await page.keyboard.press('Space').catch(() => {});
  await page.waitForTimeout(500);
}

async function main() {
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);
  const report = {
    auditId: stamp(),
    startedAt: new Date().toISOString(),
    outputDir,
    assertions: [],
    consoleMessages: [],
    pageErrors: [],
    phases: {},
    overall: 'pending'
  };
  const assert = (label, condition, details = {}) => {
    report.assertions.push({ label, pass: !!condition, details });
  };

  let browser;
  let serverProcess = null;
  try {
    serverProcess = await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addInitScript(keys => keys.forEach(key => window.localStorage.removeItem(key)), STORAGE_KEYS);
    const page = await context.newPage();
    page.on('console', msg => report.consoleMessages.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await page.evaluate(() => {
      const particle = gameCore?.particleSystem || (typeof particleSystem !== 'undefined' ? particleSystem : null);
      if (!particle) return;
      particle.clear?.();
      particle.emit = () => null;
      particle.emitBurst = () => null;
      particle.emitFountain = () => null;
      particle.emitSpiral = () => null;
      particle.warnPoolExhausted = () => {};
    });

    const phase1 = await page.evaluate(() => ({
      hasConfig: !!gameConfig?.cognition?.selfModel,
      config: gameConfig?.cognition?.selfModel || null,
      hasSystem: typeof selfModelSystem !== 'undefined',
      systemSummary: typeof selfModelSystem !== 'undefined' ? selfModelSystem.getRuntimeSummary?.() || null : null
    }));
    report.phases.presence = phase1;
    assert('selfModel config block present', phase1.hasConfig, phase1.config);
    assert('selfModel enabled by default', phase1.config?.enabled === true, phase1.config);
    assert('selfModel helper system present', phase1.hasSystem, phase1.systemSummary);
    assert('selfModel smoothing defaults sane', phase1.config?.divergenceAlpha > 0 && phase1.config?.divergenceAlpha <= 1, phase1.config);

    const phase2 = await page.evaluate(async () => {
      await gameCore.resetGame(true);
      for (let i = 0; i < 180; i += 1) gameCore.update();
      const entities = [...(gameCore.gameState.butterflies || []), ...(gameCore.gameState.caterpillars || [])];
      const samples = entities.map(entity => ({
        id: entity.id,
        type: entity.lifeSim?.identity?.entityType || entity.constructor?.name || 'entity',
        selfModel: entity.lifeSim?.selfModel || null
      }));
      const valid = samples.every(sample => sample.selfModel
        && typeof sample.selfModel.predictedNextEmotion === 'string'
        && typeof sample.selfModel.currentSelfAssessment === 'object'
        && typeof sample.selfModel.perceivedByOthersBelief === 'object'
        && typeof sample.selfModel.divergenceFromActual === 'number');
      return { entityCount: entities.length, samples: samples.slice(0, 12), valid };
    });
    report.phases.initialization = phase2;
    assert('fresh reset entities exist', phase2.entityCount > 0, { entityCount: phase2.entityCount });
    assert('all fresh entities have typed selfModel fields', phase2.valid, phase2.samples);

    const phase3 = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const serialized = saveSystem.serializeState(state);
      const before = [...(serialized.butterflies || []), ...(serialized.caterpillars || [])]
        .map(entity => [entity.id, entity.lifeSim?.selfModel || null]);
      const restored = saveSystem.deserializeState(serialized);
      const after = [...(restored.butterflies || []), ...(restored.caterpillars || [])]
        .map(entity => [entity.id, entity.lifeSim?.selfModel || null]);
      return {
        beforeCount: before.length,
        afterCount: after.length,
        preserved: JSON.stringify(before) === JSON.stringify(after),
        version: restored.version
      };
    });
    report.phases.saveRoundTrip = phase3;
    assert('selfModel save round-trip preserves byte shape', phase3.preserved, phase3);
    assert('save round-trip remains version 5', phase3.version === 5, phase3);

    const phase4 = await page.evaluate(() => {
      const serialized = saveSystem.serializeState(gameCore.getGameState());
      const legacy = JSON.parse(JSON.stringify(serialized));
      legacy.version = 4;
      for (const entity of [...(legacy.butterflies || []), ...(legacy.caterpillars || [])]) {
        if (entity.lifeSim) delete entity.lifeSim.selfModel;
      }
      const previousRealSave = window.localStorage.getItem('papilionem-save-v2');
      window.localStorage.setItem('papilionem-sr2-legacy-probe', JSON.stringify(legacy));
      const migrated = saveSystem.deserializeState(JSON.parse(window.localStorage.getItem('papilionem-sr2-legacy-probe')));
      const realSaveUnchanged = previousRealSave === window.localStorage.getItem('papilionem-save-v2');
      const entities = [...(migrated.butterflies || []), ...(migrated.caterpillars || [])];
      return {
        version: migrated.version,
        entityCount: entities.length,
        allHaveSelfModel: entities.every(entity => !!entity.lifeSim?.selfModel),
        defaults: entities.slice(0, 6).map(entity => entity.lifeSim?.selfModel || null),
        realSaveUnchanged
      };
    });
    report.phases.legacyMigration = phase4;
    assert('legacy v4 migration bumps to v5', phase4.version === 5, phase4);
    assert('legacy v4 migration populates selfModel on all entities', phase4.allHaveSelfModel, phase4.defaults);
    assert('legacy migration probe does not mutate real save key', phase4.realSaveUnchanged, phase4);

    const phase5 = await page.evaluate(async () => {
      gameConfig.cognition.selfModel.enabled = true;
      await gameCore.resetGame(true);
      for (let i = 0; i < 18000; i += 1) gameCore.update();
      const values = [...(gameCore.gameState.butterflies || []), ...(gameCore.gameState.caterpillars || [])]
        .map(entity => entity.lifeSim?.selfModel?.divergenceFromActual)
        .filter(value => Number.isFinite(value));
      const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
      return {
        count: values.length,
        mean,
        min: values.length ? Math.min(...values) : null,
        max: values.length ? Math.max(...values) : null
      };
    });
    report.phases.divergence = phase5;
    assert('divergence values exist after 5-min warm', phase5.count > 0, phase5);
    assert('mean divergence in meaningful band [0.05, 0.5]', phase5.mean >= 0.05 && phase5.mean <= 0.5, phase5);

    const phase6 = await page.evaluate(() => {
      const snapshotWorkspace = () => JSON.stringify(Array.from(workspaceSystem.runtimeState.entries()).map(([id, state]) => [
        id,
        {
          broadcastQueue: state.broadcastQueue,
          pendingCandidates: state.pendingCandidates,
          lastBroadcastTick: state.lastBroadcastTick,
          totalBroadcasts: state.totalBroadcasts,
          totalCandidates: state.totalCandidates
        }
      ]));
      const before = snapshotWorkspace();
      const frame = gameCore.getCurrentFrame();
      for (const entity of [...(gameCore.gameState.butterflies || []), ...(gameCore.gameState.caterpillars || [])]) {
        lifeSimSystem.updateSelfModel(entity, gameCore.gameState, { currentFrame: frame });
      }
      const after = snapshotWorkspace();
      return { unchanged: before === after, beforeLength: before.length, afterLength: after.length };
    });
    report.phases.observeOnly = phase6;
    assert('selfModel isolation leaves workspace queues unchanged', phase6.unchanged, phase6);

    const phase7 = await page.evaluate(() => {
      const target = gameCore.gameState.butterflies?.[0] || gameCore.gameState.caterpillars?.[0] || null;
      const previous = gameConfig.cognition.selfModel.enabled;
      gameConfig.cognition.selfModel.enabled = false;
      const before = JSON.stringify(target?.lifeSim?.selfModel || null);
      const beforeTick = target?.lifeSim?.selfModel?.lastUpdatedTick || 0;
      for (let i = 0; i < 120; i += 1) gameCore.update();
      const after = JSON.stringify(target?.lifeSim?.selfModel || null);
      const afterTick = target?.lifeSim?.selfModel?.lastUpdatedTick || 0;
      const detail = target ? gameUI.buildInspectDetailDomState(target, gameCore.gameState) : null;
      const inspectHidden = !(detail?.sections || []).some(section => section?.id === 'selfModel' || section?.title === 'Self-Model');
      const serialized = saveSystem.serializeState(gameCore.gameState);
      const roundTrip = saveSystem.deserializeState(serialized);
      gameConfig.cognition.selfModel.enabled = previous;
      return {
        unchanged: before === after,
        beforeTick,
        afterTick,
        inspectHidden,
        roundTripVersion: roundTrip.version,
        persisted: !!roundTrip.butterflies?.[0]?.lifeSim?.selfModel || !!roundTrip.caterpillars?.[0]?.lifeSim?.selfModel
      };
    });
    report.phases.toggleOff = phase7;
    assert('toggle off stops selfModel writes', phase7.unchanged && phase7.beforeTick === phase7.afterTick, phase7);
    assert('toggle off hides inspect selfModel section', phase7.inspectHidden, phase7);
    assert('toggle off still saves selfModel field', phase7.roundTripVersion === 5 && phase7.persisted, phase7);

    const badConsole = report.consoleMessages.filter(message => ['error', 'warning'].includes(message.type));
    assert('zero page errors', report.pageErrors.length === 0, report.pageErrors);
    assert('zero console errors or warnings', badConsole.length === 0, badConsole);

    report.finishedAt = new Date().toISOString();
    report.overall = report.assertions.every(assertion => assertion.pass) ? 'pass' : 'fail';
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      outputDir,
      assertions: report.assertions.length,
      failed: report.assertions.filter(assertion => !assertion.pass).map(assertion => assertion.label)
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.error(report.error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (serverProcess?.pid) {
      try { process.kill(serverProcess.pid); } catch (_) {}
    }
  }
}

main();
