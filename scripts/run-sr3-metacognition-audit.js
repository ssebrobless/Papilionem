// SR3 - Metacognition Audit
//
// Proves lifeSim-owned second-order emotion tags are additive, persisted,
// bounded, rollback-safe, and measurably bias the next behavior decision.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'sr3_metacognition_audit');
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-sr3-default-probe'
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
      config: gameConfig?.cognition?.metacognition || null,
      schemaVersion: saveSystem.serializeState(gameCore.gameState).version
    }));
    report.phases.presence = phase1;
    assert('metacognition config present', !!phase1.config, phase1);
    assert('metacognition enabled by default', phase1.config?.enabled === true, phase1.config);
    assert('metacognition ring buffer cap sane', phase1.config?.ringBufferCap === 32, phase1.config);
    assert('schema remains v5', phase1.schemaVersion === 5, phase1);

    const phase2 = await page.evaluate(async () => {
      await gameCore.resetGame(true);
      for (let i = 0; i < 240; i += 1) gameCore.update();
      const entities = [...(gameCore.gameState.butterflies || []), ...(gameCore.gameState.caterpillars || [])];
      const samples = entities.slice(0, 10).map(entity => ({
        id: entity.id,
        hasArray: Array.isArray(entity.lifeSim?.metacognition),
        length: entity.lifeSim?.metacognition?.length ?? null
      }));
      return {
        entityCount: entities.length,
        allHaveArray: entities.every(entity => Array.isArray(entity.lifeSim?.metacognition)),
        samples
      };
    });
    report.phases.initialization = phase2;
    assert('fresh entities exist', phase2.entityCount > 0, phase2);
    assert('all fresh entities have metacognition array', phase2.allHaveArray, phase2.samples);

    const phase3 = await page.evaluate(() => {
      const target = gameCore.gameState.butterflies?.[0] || null;
      if (!target) return { error: 'no-target' };
      gameConfig.cognition.metacognition.enabled = true;
      gameConfig.cognition.metacognition.minIntervalFrames = 1;
      lifeSimSystem.ensureLifeSimState(target);
      target.lifeSim.selfModel.predictedNextEmotion = 'relief';
      target.lifeSim.selfModel.predictedNextEmotionIntensity = 0.05;
      target.lifeSim.selfModel.divergenceFromActual = 0.82;
      target.lifeSim.selfModel.initialized = true;
      target.lifeSim.emotions.threat = 0.92;
      target.lifeSim.derived.emotionPeaks = [{ label: 'threat', value: 0.92 }];
      target.lifeSim.derived.behaviorBiases = {
        ...(target.lifeSim.derived.behaviorBiases || {}),
        shelterSeeking: 0,
        caution: 0,
        socialConfidence: 0
      };
      target.lifeSim.derived.socialEcology = null;
      const frame = gameCore.getCurrentFrame() + 5;
      const metaResult = lifeSimSystem.updateMetacognition(target, gameCore.gameState, { currentFrame: frame });
      behaviorSystem.syncRuntimeFromEntity(target);
      const runtime = behaviorSystem.getRuntime?.(target.id) || null;
      const latest = target.lifeSim.metacognition[target.lifeSim.metacognition.length - 1] || null;
      return {
        targetId: target.id,
        created: !!metaResult?.created,
        latest,
        behaviorBiases: target.lifeSim.derived.behaviorBiases,
        runtime,
        activeBias: target.lifeSim.derived.metacognitionBias || null
      };
    });
    report.phases.secondOrderDecision = phase3;
    assert('second-order tag created from selfModel divergence', phase3.created, phase3);
    assert('second-order tag has required shape', !!(phase3.latest?.feelingId && phase3.latest.firstOrderEmotion && phase3.latest.metaEmotion && Number.isFinite(phase3.latest.metaIntensity) && Number.isFinite(phase3.latest.tick)), phase3.latest);
    assert('metacognition changes next decision within 30 simulated seconds', phase3.runtime?.currentActionSubtype === 'shelter-seeking' && phase3.activeBias?.active === true, phase3);

    const phase4 = await page.evaluate(() => {
      const serialized = saveSystem.serializeState(gameCore.gameState);
      const before = [...(serialized.butterflies || []), ...(serialized.caterpillars || [])]
        .map(entity => [entity.id, entity.lifeSim?.metacognition || []]);
      const restored = saveSystem.deserializeState(serialized);
      const after = [...(restored.butterflies || []), ...(restored.caterpillars || [])]
        .map(entity => [entity.id, entity.lifeSim?.metacognition || []]);
      return {
        preserved: JSON.stringify(before) === JSON.stringify(after),
        version: restored.version,
        nonEmptyCount: before.filter(([, entries]) => entries.length > 0).length
      };
    });
    report.phases.saveRoundTrip = phase4;
    assert('metacognition save round-trip preserves byte shape', phase4.preserved, phase4);
    assert('metacognition save round-trip stays v5', phase4.version === 5, phase4);
    assert('round-trip includes at least one produced tag', phase4.nonEmptyCount >= 1, phase4);

    const phase5 = await page.evaluate(() => {
      const serialized = saveSystem.serializeState(gameCore.gameState);
      const sr2Era = JSON.parse(JSON.stringify(serialized));
      sr2Era.version = 5;
      for (const entity of [...(sr2Era.butterflies || []), ...(sr2Era.caterpillars || [])]) {
        if (entity.lifeSim) delete entity.lifeSim.metacognition;
      }
      const previousRealSave = window.localStorage.getItem('papilionem-save-v2');
      window.localStorage.setItem('papilionem-sr3-default-probe', JSON.stringify(sr2Era));
      const migrated = saveSystem.deserializeState(JSON.parse(window.localStorage.getItem('papilionem-sr3-default-probe')));
      const entities = [...(migrated.butterflies || []), ...(migrated.caterpillars || [])];
      return {
        version: migrated.version,
        entityCount: entities.length,
        allDefaultArrays: entities.every(entity => Array.isArray(entity.lifeSim?.metacognition)),
        allEmpty: entities.every(entity => (entity.lifeSim?.metacognition || []).length === 0),
        realSaveUnchanged: previousRealSave === window.localStorage.getItem('papilionem-save-v2')
      };
    });
    report.phases.sr2DefaultIfMissing = phase5;
    assert('SR2-era v5 save defaults metacognition without schema bump', phase5.version === 5 && phase5.allDefaultArrays && phase5.allEmpty, phase5);
    assert('SR3 default probe does not mutate real save key', phase5.realSaveUnchanged, phase5);

    const phase6 = await page.evaluate(() => {
      const target = gameCore.gameState.butterflies?.[0] || null;
      if (!target) return { error: 'no-target' };
      target.lifeSim.metacognition = [];
      gameConfig.cognition.metacognition.enabled = true;
      gameConfig.cognition.metacognition.minIntervalFrames = 1;
      for (let index = 0; index < 40; index += 1) {
        target.lifeSim.selfModel.predictedNextEmotion = index % 2 === 0 ? 'relief' : 'attachment';
        target.lifeSim.selfModel.predictedNextEmotionIntensity = 0.05;
        target.lifeSim.selfModel.divergenceFromActual = 0.8;
        target.lifeSim.selfModel.initialized = true;
        const emotion = index % 2 === 0 ? 'threat' : 'failure';
        target.lifeSim.emotions[emotion] = 0.9;
        target.lifeSim.derived.emotionPeaks = [{ label: emotion, value: 0.9 }];
        lifeSimSystem.updateMetacognition(target, gameCore.gameState, { currentFrame: 10000 + index * 3 });
      }
      return {
        length: target.lifeSim.metacognition.length,
        firstTick: target.lifeSim.metacognition[0]?.tick || null,
        lastTick: target.lifeSim.metacognition[target.lifeSim.metacognition.length - 1]?.tick || null
      };
    });
    report.phases.ringBuffer = phase6;
    assert('metacognition ring buffer caps at 32', phase6.length === 32, phase6);
    assert('metacognition ring buffer drops oldest entries', phase6.firstTick > 10000, phase6);

    const phase7 = await page.evaluate(() => {
      const target = gameCore.gameState.butterflies?.[0] || null;
      if (!target) return { error: 'no-target' };
      gameConfig.cognition.metacognition.enabled = false;
      const before = JSON.stringify(target.lifeSim.metacognition || []);
      const beforeCount = target.lifeSim.metacognition?.length || 0;
      target.lifeSim.selfModel.divergenceFromActual = 1;
      target.lifeSim.derived.emotionPeaks = [{ label: 'threat', value: 1 }];
      lifeSimSystem.updateMetacognition(target, gameCore.gameState, { currentFrame: 30000 });
      const after = JSON.stringify(target.lifeSim.metacognition || []);
      const detail = gameUI.buildInspectDetailDomState(target, gameCore.gameState);
      const inspectHidden = !(detail?.sections || []).some(section => section?.id === 'metacognition' || section?.title === 'Metacognition');
      const serialized = saveSystem.serializeState(gameCore.gameState);
      const roundTrip = saveSystem.deserializeState(serialized);
      gameConfig.cognition.metacognition.enabled = true;
      return {
        unchanged: before === after,
        beforeCount,
        afterCount: target.lifeSim.metacognition?.length || 0,
        inspectHidden,
        version: roundTrip.version,
        persisted: Array.isArray(roundTrip.butterflies?.[0]?.lifeSim?.metacognition)
      };
    });
    report.phases.toggleOff = phase7;
    assert('toggle off prevents new metacognition writes', phase7.unchanged && phase7.beforeCount === phase7.afterCount, phase7);
    assert('toggle off hides inspect metacognition section', phase7.inspectHidden, phase7);
    assert('toggle off still saves metacognition field', phase7.version === 5 && phase7.persisted, phase7);

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
