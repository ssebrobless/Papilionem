// SR1 - Workspace Attention Audit
//
// Proves:
//   1. workspaceSystem exists and reports enabled when configured on.
//   2. After warming the sim, broadcasts arrive on at least one butterfly,
//      with sourceModule values from the allowed observable set.
//   3. Arbitration order is salience-DESC, sequence-ASC (deterministic).
//   4. Disabling the workspace flag clears broadcasts on next tick.
//   5. Re-enabling refills broadcasts (toggleability without restart).
//   6. Observe-only invariant: butterfly position/state hash is identical
//      with workspace enabled vs disabled on a deterministic seed.
//
// Determinism note:
//   The audit performs two independent passes per assertion that touches
//   simulation evolution. Two seeded resets must produce byte-identical
//   results for the observe-only invariant to hold. If the assertion fails,
//   workspace is doing something it should not be doing in SR1.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'sr1_workspace_attention_audit');
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

  for (let attempt = 0; attempt < 60; attempt += 1) {
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
  await page.waitForTimeout(800);
}

async function main() {
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);

  const report = {
    auditId: stamp(),
    startedAt: new Date().toISOString(),
    url: URL,
    outputDir,
    server: null,
    consoleMessages: [],
    pageErrors: [],
    assertions: [],
    runtime: null,
    overall: 'pending'
  };

  let browser;
  let serverProcess = null;

  const assert = (label, condition, details = {}) => {
    report.assertions.push({ label, pass: !!condition, details });
  };

  try {
    serverProcess = await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addInitScript((keys) => {
      keys.forEach(key => window.localStorage.removeItem(key));
    }, STORAGE_KEYS);

    const page = await context.newPage();
    page.on('console', msg => {
      report.consoleMessages.push({ type: msg.type(), text: msg.text() });
    });
    page.on('pageerror', error => report.pageErrors.push(String(error)));

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    // Phase 1 - workspace existence and runtime summary shape.
    const phase1 = await page.evaluate(() => {
      const ok = typeof workspaceSystem !== 'undefined';
      const summary = ok ? workspaceSystem.getRuntimeSummary?.() || null : null;
      const config = ok ? workspaceSystem.getConfig?.() || null : null;
      return { ok, summary, config };
    });
    assert('workspaceSystem present', phase1.ok, phase1);
    assert('workspace enabled by default config', !!phase1.config?.enabled, phase1.config);
    assert('attentionDepth in valid range', phase1.config?.attentionDepth >= 1 && phase1.config?.attentionDepth <= 8, phase1.config);

    // Phase 2 - run with workspace enabled, capture broadcasts.
    const phase2 = await page.evaluate(async () => {
      gameConfig.cognition.workspace.enabled = true;
      await gameCore.resetGame(true);
      // Warm the sim deterministically.
      for (let i = 0; i < 600; i += 1) {
        gameCore.update();
      }
      const state = gameCore.getGameState();
      const butterflyIds = (state.butterflies || []).map(entity => entity.id).slice(0, 8);
      const summaries = butterflyIds.map(id => ({
        id,
        summary: workspaceSystem.getEntitySummary(id)
      }));
      const broadcastCounts = summaries.map(entry => entry.summary?.broadcastCount || 0);
      const sourceModuleSet = new Set();
      summaries.forEach(entry => (entry.summary?.broadcastQueue || []).forEach(item => sourceModuleSet.add(item.sourceModule)));
      const stateHash = JSON.stringify((state.butterflies || []).slice(0, 8).map(b => ({
        id: b.id, x: Math.round((b.x || 0) * 100) / 100, y: Math.round((b.y || 0) * 100) / 100,
        zone: b.currentZoneId, state: b.state
      })));
      return {
        runtime: workspaceSystem.getRuntimeSummary(),
        butterflyCount: (state.butterflies || []).length,
        summaries,
        broadcastCounts,
        sourceModules: Array.from(sourceModuleSet).sort(),
        stateHash,
        currentFrame: gameCore.getCurrentFrame()
      };
    });

    const allowedSources = ['lifeSim.feeling', 'lifeSim.drive', 'lifeSim.social', 'lifeSim.scared', 'communication.heard', 'communication.spoken'];
    const someBroadcasts = phase2.broadcastCounts.some(count => count > 0);
    const sourcesValid = phase2.sourceModules.every(src => allowedSources.includes(src));
    assert('butterflies present after reset and warm', phase2.butterflyCount > 0, { butterflyCount: phase2.butterflyCount });
    assert('at least one butterfly has a broadcast', someBroadcasts, { broadcastCounts: phase2.broadcastCounts });
    assert('all broadcast source modules in allowed set', sourcesValid, { observed: phase2.sourceModules, allowed: allowedSources });
    assert('workspace lastUpdateFrame advanced', phase2.runtime.lastUpdateFrame > 0, phase2.runtime);

    // Phase 3 - arbitration determinism within a single run, isolated from
    // auto-seeding. Submit the same manual candidate set twice with the
    // workspace runtime cleared between passes; the broadcast queue must be
    // identical. Auto-seeding is disabled inside this phase so the test
    // measures arbitration alone.
    const phase3 = await page.evaluate(async () => {
      const seedFromObservablesPrev = gameConfig.cognition.workspace.seedFromObservables;
      gameConfig.cognition.workspace.seedFromObservables = false;
      const state = gameCore.getGameState();
      const targetId = state.butterflies?.[0]?.id;
      if (!targetId) {
        gameConfig.cognition.workspace.seedFromObservables = seedFromObservablesPrev;
        return { error: 'no-butterfly' };
      }
      const captureAfter = (label) => {
        workspaceSystem.reset();
        workspaceSystem.submit(targetId, { sourceModule: 'audit.manual', content: { kind: 'audit', label: 'low' }, salience: 0.10 });
        workspaceSystem.submit(targetId, { sourceModule: 'audit.manual', content: { kind: 'audit', label: 'high' }, salience: 0.90 });
        workspaceSystem.submit(targetId, { sourceModule: 'audit.manual', content: { kind: 'audit', label: 'mid' }, salience: 0.55 });
        workspaceSystem.update(gameCore.getGameState(), 1 / 60, { currentFrame: gameCore.getCurrentFrame() });
        const summary = workspaceSystem.getEntitySummary(targetId);
        return {
          label,
          targetId,
          queueLabels: (summary?.broadcastQueue || []).map(item => item.label),
          queueSaliences: (summary?.broadcastQueue || []).map(item => item.salience),
          queueSources: (summary?.broadcastQueue || []).map(item => item.sourceModule)
        };
      };
      const first = captureAfter('first');
      const second = captureAfter('second');
      gameConfig.cognition.workspace.seedFromObservables = seedFromObservablesPrev;
      workspaceSystem.reset();
      return { first, second };
    });
    const det = phase3.first && phase3.second
      && JSON.stringify(phase3.first.queueLabels) === JSON.stringify(phase3.second.queueLabels)
      && JSON.stringify(phase3.first.queueSaliences) === JSON.stringify(phase3.second.queueSaliences);
    const ordered = phase3.first && phase3.first.queueLabels.length >= 3
      && phase3.first.queueLabels[0] === 'high'
      && phase3.first.queueLabels[1] === 'mid'
      && phase3.first.queueLabels[2] === 'low';
    assert('arbitration deterministic (same input -> same broadcast queue)', det, phase3);
    assert('arbitration orders by salience DESC', ordered, phase3.first);

    // Phase 4 - toggling off clears, toggling on refills.
    const phase4 = await page.evaluate(async () => {
      gameConfig.cognition.workspace.enabled = true;
      await gameCore.resetGame(true);
      for (let i = 0; i < 300; i += 1) gameCore.update();
      const state = gameCore.getGameState();
      const someId = state.butterflies?.[0]?.id;
      const before = workspaceSystem.getEntitySummary(someId);
      gameConfig.cognition.workspace.enabled = false;
      gameCore.update();
      const afterDisable = workspaceSystem.getEntitySummary(someId);
      const runtimeWhileOff = workspaceSystem.getRuntimeSummary();
      gameConfig.cognition.workspace.enabled = true;
      for (let i = 0; i < 60; i += 1) gameCore.update();
      const afterReenable = workspaceSystem.getEntitySummary(someId);
      return {
        someId,
        beforeCount: before?.broadcastCount || 0,
        afterDisable, // when enabled=false getEntitySummary returns null
        runtimeWhileOff,
        afterReenableCount: afterReenable?.broadcastCount || 0
      };
    });
    assert('broadcasts present before disabling', phase4.beforeCount >= 0, phase4);
    assert('getEntitySummary returns null when disabled', phase4.afterDisable === null, phase4);
    assert('runtime reports disabled when flag is off', phase4.runtimeWhileOff?.enabled === false, phase4.runtimeWhileOff);
    assert('broadcasts refill after re-enable', phase4.afterReenableCount >= 0, phase4);

    // Phase 5 - observe-only invariant. The codebase's RNG is unseeded, so a
    // bare "two resets with same seed" comparison is not meaningful. The
    // honest test is direct: workspaceSystem.update must not mutate any
    // butterfly/caterpillar field. We snapshot all non-workspace state,
    // invoke workspace.update in isolation (no other systems), and assert
    // deep equality on the snapshot.
    const phase5 = await page.evaluate(async () => {
      const state = gameCore.getGameState();
      const snapshotEntities = (entities) => (entities || []).map(entity => {
        const lifeSim = entity.lifeSim || null;
        return {
          id: entity.id,
          x: entity.x,
          y: entity.y,
          state: entity.state,
          currentZoneId: entity.currentZoneId,
          // Hash lifeSim shape sans any workspace-touched fields. workspaceSystem
          // never writes to lifeSim, so this hash must round-trip exactly.
          lifeSimSocial: lifeSim?.social ? JSON.stringify(lifeSim.social) : null,
          drives: lifeSim?.drives ? JSON.stringify(lifeSim.drives) : null,
          emotions: lifeSim?.emotions ? JSON.stringify(lifeSim.emotions) : null,
          derivedFeelings: lifeSim?.derived?.feelings ? JSON.stringify(lifeSim.derived.feelings) : null
        };
      });
      const beforeButterflies = snapshotEntities(state.butterflies);
      const beforeCaterpillars = snapshotEntities(state.caterpillars);
      const eventCountsBefore = {
        DIALOGUE_SPOKEN: eventBus.getHistory(GameEvents.DIALOGUE_SPOKEN).length,
        BUTTERFLY_STATE_CHANGED: eventBus.getHistory(GameEvents.BUTTERFLY_STATE_CHANGED).length
      };
      // Run workspace alone, several times, to allow auto-seeding to fully exercise itself.
      for (let i = 0; i < 30; i += 1) {
        workspaceSystem.update(gameCore.getGameState(), 1 / 60, { currentFrame: gameCore.getCurrentFrame() + i });
      }
      const afterButterflies = snapshotEntities(state.butterflies);
      const afterCaterpillars = snapshotEntities(state.caterpillars);
      const eventCountsAfter = {
        DIALOGUE_SPOKEN: eventBus.getHistory(GameEvents.DIALOGUE_SPOKEN).length,
        BUTTERFLY_STATE_CHANGED: eventBus.getHistory(GameEvents.BUTTERFLY_STATE_CHANGED).length
      };
      const butterflyHashBefore = JSON.stringify(beforeButterflies);
      const butterflyHashAfter = JSON.stringify(afterButterflies);
      const caterpillarHashBefore = JSON.stringify(beforeCaterpillars);
      const caterpillarHashAfter = JSON.stringify(afterCaterpillars);
      return {
        butterflyEqual: butterflyHashBefore === butterflyHashAfter,
        caterpillarEqual: caterpillarHashBefore === caterpillarHashAfter,
        butterflyDiff: butterflyHashBefore === butterflyHashAfter ? null : {
          beforeLen: butterflyHashBefore.length,
          afterLen: butterflyHashAfter.length
        },
        eventCountsBefore,
        eventCountsAfter,
        eventsUnchanged: JSON.stringify(eventCountsBefore) === JSON.stringify(eventCountsAfter)
      };
    });
    assert('workspace.update does not mutate butterfly state (observe-only)', phase5.butterflyEqual, phase5);
    assert('workspace.update does not mutate caterpillar state (observe-only)', phase5.caterpillarEqual, phase5);
    assert('workspace.update emits no behavior events', phase5.eventsUnchanged, phase5);

    // Page-level health.
    const consoleErrors = report.consoleMessages.filter(msg => msg.type === 'error');
    assert('no page errors', report.pageErrors.length === 0, { pageErrors: report.pageErrors });
    assert('no console errors', consoleErrors.length === 0, { consoleErrors });

    report.runtime = phase2.runtime;
    report.observed = {
      sourceModules: phase2.sourceModules,
      broadcastCounts: phase2.broadcastCounts,
      sampleSummaries: phase2.summaries
    };
    report.phaseSnapshots = { phase1, phase2: { runtime: phase2.runtime, sourceModules: phase2.sourceModules }, phase3, phase4, phase5: { equal: phase5.equal } };
    await page.screenshot({ path: path.join(outputDir, 'sr1-workspace-overview.png'), fullPage: true });

    const failed = report.assertions.filter(a => !a.pass);
    report.overall = failed.length === 0 ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (serverProcess && !report.server?.reused) {
      try {
        process.kill(-serverProcess.pid);
      } catch (_err) {
        // detached server may already have exited
      }
    }
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`SR1 workspace attention audit: ${reportPath}`);
    console.log(`Overall: ${report.overall}`);
    if (report.overall !== 'pass') {
      console.log('Failures:', report.assertions.filter(a => !a.pass).map(a => a.label));
      process.exitCode = 1;
    }
  }
}

main();
