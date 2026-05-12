// SR4 - Theory of Mind Audit
//
// Proves lifeSim-owned partner-belief models are additive, persisted,
// rollback-safe, and satisfy SR0 B3: an agent can act on a divergent model
// of another agent, then adapt when direct observation contradicts that model.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'sr4_theory_of_mind_audit');
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-sr4-default-probe'
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
      config: gameConfig?.cognition?.theoryOfMind || null,
      schemaVersion: saveSystem.serializeState(gameCore.gameState).version
    }));
    report.phases.presence = phase1;
    assert('theoryOfMind config present', !!phase1.config, phase1);
    assert('theoryOfMind enabled by default', phase1.config?.enabled === true, phase1.config);
    assert('schema remains v5', phase1.schemaVersion === 5, phase1);

    const phase2 = await page.evaluate(async () => {
      await gameCore.resetGame(true);
      for (let i = 0; i < 240; i += 1) gameCore.update();
      const entities = [...(gameCore.gameState.butterflies || []), ...(gameCore.gameState.caterpillars || [])];
      const first = entities[0];
      const second = entities[1];
      if (first && second) ensureLifeSocialEdge(first, second.id);
      for (const entity of entities) lifeSimSystem.ensureLifeSimState(entity);
      const edges = entities.flatMap(entity => Object.entries(entity.lifeSim?.socialEdges || {}).map(([targetId, edge]) => ({
        sourceId: entity.id,
        targetId,
        theoryOfMind: edge?.theoryOfMind || null
      })));
      const valid = edges.every(edge => edge.theoryOfMind
        && edge.theoryOfMind.believedDrives && typeof edge.theoryOfMind.believedDrives === 'object'
        && edge.theoryOfMind.believedMood && typeof edge.theoryOfMind.believedMood === 'object'
        && typeof edge.theoryOfMind.divergenceFromActual === 'number'
        && typeof edge.theoryOfMind.initialized === 'boolean'
        && typeof edge.theoryOfMind.lastUpdatedTick === 'number');
      return { entityCount: entities.length, edgeCount: edges.length, valid, samples: edges.slice(0, 6) };
    });
    report.phases.initialization = phase2;
    assert('fresh entities exist', phase2.entityCount > 0, phase2);
    assert('at least one social edge exists for SR4 proof', phase2.edgeCount > 0, phase2);
    assert('all existing edges have typed theoryOfMind fields', phase2.valid, phase2.samples);

    const phase3 = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const serialized = saveSystem.serializeState(state);
      const before = [...(serialized.butterflies || []), ...(serialized.caterpillars || [])]
        .map(entity => [entity.id, JSON.stringify(entity.lifeSim?.socialEdges || {})]);
      const restored = saveSystem.deserializeState(serialized);
      const after = [...(restored.butterflies || []), ...(restored.caterpillars || [])]
        .map(entity => [entity.id, JSON.stringify(entity.lifeSim?.socialEdges || {})]);
      return {
        preserved: JSON.stringify(before) === JSON.stringify(after),
        version: restored.version,
        edgeCount: before.reduce((sum, [, edges]) => sum + Object.keys(JSON.parse(edges)).length, 0)
      };
    });
    report.phases.saveRoundTrip = phase3;
    assert('theoryOfMind save round-trip preserves social edge byte shape', phase3.preserved, phase3);
    assert('theoryOfMind save round-trip stays v5', phase3.version === 5, phase3);

    const phase4 = await page.evaluate(() => {
      const serialized = saveSystem.serializeState(gameCore.getGameState());
      const sr3Era = JSON.parse(JSON.stringify(serialized));
      sr3Era.version = 5;
      for (const entity of [...(sr3Era.butterflies || []), ...(sr3Era.caterpillars || [])]) {
        for (const edge of Object.values(entity.lifeSim?.socialEdges || {})) {
          delete edge.theoryOfMind;
        }
      }
      const previousRealSave = window.localStorage.getItem('papilionem-save-v2');
      window.localStorage.setItem('papilionem-sr4-default-probe', JSON.stringify(sr3Era));
      const migrated = saveSystem.deserializeState(JSON.parse(window.localStorage.getItem('papilionem-sr4-default-probe')));
      const entities = [...(migrated.butterflies || []), ...(migrated.caterpillars || [])];
      const edges = entities.flatMap(entity => Object.values(entity.lifeSim?.socialEdges || {}));
      return {
        version: migrated.version,
        edgeCount: edges.length,
        allDefaulted: edges.every(edge => !!edge.theoryOfMind && edge.theoryOfMind.initialized === false),
        realSaveUnchanged: previousRealSave === window.localStorage.getItem('papilionem-save-v2')
      };
    });
    report.phases.defaultIfMissing = phase4;
    assert('SR3-era v5 save defaults theoryOfMind without schema bump', phase4.version === 5 && phase4.allDefaulted, phase4);
    assert('SR4 default probe does not mutate real save key', phase4.realSaveUnchanged, phase4);

    const phase5 = await page.evaluate(() => {
      const entities = gameCore.gameState.butterflies || [];
      const observer = entities[0];
      const subject = entities[1];
      if (!observer || !subject) return { error: 'needs-two-butterflies' };
      gameConfig.cognition.theoryOfMind.enabled = true;
      const edge = ensureLifeSocialEdge(observer, subject.id);
      subject.lifeSim.emotions.relief = 0.85;
      subject.lifeSim.emotions.threat = 0;
      subject.lifeSim.derived.emotionPeaks = [{ label: 'relief', value: 0.85 }];
      subject.lifeSim.derived.dominantDrive = 'rest';
      edge.theoryOfMind = createTheoryOfMindProfile({
        believedDrives: { safetyAvoidance: 0.92 },
        believedMood: { primary: 'threat', intensity: 0.9 },
        believedGoal: 'needs-help',
        divergenceFromActual: 0.92,
        initialized: true,
        lastUpdatedTick: gameCore.getCurrentFrame()
      });
      lifeSimSystem.applyTheoryOfMindInfluence(observer, subject.id, edge.theoryOfMind, gameCore.getCurrentFrame());
      behaviorSystem.syncRuntimeFromEntity(observer);
      const beforeRuntime = behaviorSystem.getRuntime(observer.id);
      const beforeDivergence = edge.theoryOfMind.divergenceFromActual;
      const result = lifeSimSystem.updateTheoryOfMindModel(observer, subject, gameCore.gameState, {
        currentFrame: gameCore.getCurrentFrame() + 10,
        forceObservation: true,
        alpha: 0.9
      });
      observer.lifeSim.derived.theoryOfMindBias = null;
      lifeSimSystem.applyTheoryOfMindInfluence(observer, subject.id, edge.theoryOfMind, gameCore.getCurrentFrame() + 11);
      behaviorSystem.syncRuntimeFromEntity(observer);
      const afterRuntime = behaviorSystem.getRuntime(observer.id);
      const afterModel = edge.theoryOfMind;
      return {
        observerId: observer.id,
        subjectId: subject.id,
        beforeRuntime,
        afterRuntime,
        beforeDivergence,
        afterDivergence: afterModel.divergenceFromActual,
        believedMoodAfter: afterModel.believedMood,
        believedGoalAfter: afterModel.believedGoal,
        lastContradictionTick: afterModel.lastContradictionTick,
        updateResult: result
      };
    });
    report.phases.deceivableAndAdapts = phase5;
    assert('agent acts on divergent partner-belief model', phase5.beforeRuntime?.currentActionSubtype === 'comfort-from-belief' && phase5.beforeRuntime?.currentTargetId === phase5.subjectId, phase5);
    assert('contradictory observation reduces theoryOfMind divergence', phase5.afterDivergence < phase5.beforeDivergence, phase5);
    assert('belief adapts toward observed actual mood', phase5.believedMoodAfter?.primary === 'relief', phase5);
    assert('adapted belief no longer drives false comfort action', phase5.afterRuntime?.currentActionSubtype !== 'comfort-from-belief', phase5.afterRuntime);

    const phase6 = await page.evaluate(() => {
      const observer = gameCore.gameState.butterflies?.[0] || null;
      const subject = gameCore.gameState.butterflies?.[1] || null;
      if (!observer || !subject) return { error: 'needs-two-butterflies' };
      const edge = ensureLifeSocialEdge(observer, subject.id);
      const previous = gameConfig.cognition.theoryOfMind.enabled;
      gameConfig.cognition.theoryOfMind.enabled = false;
      const before = JSON.stringify(edge.theoryOfMind);
      const beforeTick = edge.theoryOfMind?.lastUpdatedTick || 0;
      lifeSimSystem.updateTheoryOfMindModel(observer, subject, gameCore.gameState, {
        currentFrame: gameCore.getCurrentFrame() + 100,
        forceObservation: true
      });
      const after = JSON.stringify(edge.theoryOfMind);
      const afterTick = edge.theoryOfMind?.lastUpdatedTick || 0;
      const detail = gameUI.buildInspectDetailDomState(observer, gameCore.gameState);
      const inspectHidden = !(detail?.sections || []).some(section => section?.id === 'theoryOfMind' || section?.title === 'Theory of Mind');
      const serialized = saveSystem.serializeState(gameCore.gameState);
      const roundTrip = saveSystem.deserializeState(serialized);
      gameConfig.cognition.theoryOfMind.enabled = previous;
      return {
        unchanged: before === after,
        beforeTick,
        afterTick,
        inspectHidden,
        version: roundTrip.version,
        persisted: !!roundTrip.butterflies?.[0]?.lifeSim?.socialEdges?.[subject.id]?.theoryOfMind
      };
    });
    report.phases.toggleOff = phase6;
    assert('toggle off stops theoryOfMind writes', phase6.unchanged && phase6.beforeTick === phase6.afterTick, phase6);
    assert('toggle off hides inspect theoryOfMind section', phase6.inspectHidden, phase6);
    assert('toggle off still saves theoryOfMind field', phase6.version === 5 && phase6.persisted, phase6);

    const phase7 = await page.evaluate(() => {
      const entries = Array.from(workspaceSystem.runtimeState.entries()).map(([id, state]) => [
        id,
        {
          broadcastQueue: state.broadcastQueue,
          pendingCandidates: state.pendingCandidates,
          lastBroadcastTick: state.lastBroadcastTick,
          totalBroadcasts: state.totalBroadcasts,
          totalCandidates: state.totalCandidates
        }
      ]);
      const before = JSON.stringify(entries);
      const observer = gameCore.gameState.butterflies?.[0] || null;
      const subject = gameCore.gameState.butterflies?.[1] || null;
      if (observer && subject) {
        lifeSimSystem.updateTheoryOfMindModel(observer, subject, gameCore.gameState, {
          currentFrame: gameCore.getCurrentFrame() + 200,
          forceObservation: true
        });
      }
      const afterEntries = Array.from(workspaceSystem.runtimeState.entries()).map(([id, state]) => [
        id,
        {
          broadcastQueue: state.broadcastQueue,
          pendingCandidates: state.pendingCandidates,
          lastBroadcastTick: state.lastBroadcastTick,
          totalBroadcasts: state.totalBroadcasts,
          totalCandidates: state.totalCandidates
        }
      ]);
      const after = JSON.stringify(afterEntries);
      return { unchanged: before === after, beforeLength: before.length, afterLength: after.length };
    });
    report.phases.observeOnly = phase7;
    assert('theoryOfMind isolation leaves workspace queues unchanged', phase7.unchanged, phase7);

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
    report.error = error?.stack || String(error);
    ensureDir(outputDir);
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (serverProcess?.pid) {
      try {
        process.kill(-serverProcess.pid);
      } catch (_error) {
        // ignored
      }
    }
  }
}

main();
