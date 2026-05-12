// SR5 - Intrinsic Motivation Audit
//
// Proves lifeSim-owned intrinsic drive state is additive, persisted,
// rollback-safe, and measurably biases behavior without rewriting the
// protected drive/emotion/memory/relationship families.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'sr5_intrinsic_motivation_audit');
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-sr5-default-probe'
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
      config: gameConfig?.cognition?.intrinsicDrives || null,
      schemaVersion: saveSystem.serializeState(gameCore.gameState).version
    }));
    report.phases.presence = phase1;
    assert('intrinsicDrives config present', !!phase1.config, phase1);
    assert('intrinsicDrives enabled by default', phase1.config?.enabled === true, phase1.config);
    assert('intrinsicDrives tuning defaults sane', phase1.config?.smoothingAlpha > 0 && phase1.config?.smoothingAlpha <= 1, phase1.config);
    assert('schema remains v5', phase1.schemaVersion === 5, phase1);

    const phase2 = await page.evaluate(async () => {
      await gameCore.resetGame(true);
      for (let i = 0; i < 240; i += 1) gameCore.update();
      const entities = [...(gameCore.gameState.butterflies || []), ...(gameCore.gameState.caterpillars || [])];
      for (const entity of entities) lifeSimSystem.ensureLifeSimState(entity);
      const validProfile = profile => profile
        && typeof profile.curiosity === 'number'
        && typeof profile.competence === 'number'
        && typeof profile.boredom === 'number'
        && typeof profile.lastUpdatedTick === 'number'
        && profile.curiosity >= 0 && profile.curiosity <= 1
        && profile.competence >= 0 && profile.competence <= 1
        && profile.boredom >= 0 && profile.boredom <= 1;
      return {
        entityCount: entities.length,
        butterflyCount: gameCore.gameState.butterflies?.length || 0,
        caterpillarCount: gameCore.gameState.caterpillars?.length || 0,
        allTyped: entities.every(entity => validProfile(entity.lifeSim?.intrinsicDrives)),
        samples: entities.slice(0, 6).map(entity => ({
          id: entity.id,
          type: entity.type || entity.constructor?.name || 'entity',
          intrinsicDrives: entity.lifeSim?.intrinsicDrives || null
        }))
      };
    });
    report.phases.initialization = phase2;
    assert('fresh entities exist', phase2.entityCount > 0, phase2);
    assert('all fresh butterflies and caterpillars have typed intrinsicDrives fields', phase2.allTyped, phase2.samples);

    const phase3 = await page.evaluate(() => {
      const target = gameCore.gameState.butterflies?.[0] || gameCore.gameState.caterpillars?.[0] || null;
      if (!target) return { error: 'no-target' };
      lifeSimSystem.ensureLifeSimState(target);
      target.lifeSim.intrinsicDrives = createIntrinsicDriveProfile({
        curiosity: 0.37,
        competence: 0.46,
        boredom: 0.18,
        lastUpdatedTick: 12345
      });
      const serialized = saveSystem.serializeState(gameCore.gameState);
      const before = [...(serialized.butterflies || []), ...(serialized.caterpillars || [])]
        .map(entity => [entity.id, entity.lifeSim?.intrinsicDrives || null]);
      const restored = saveSystem.deserializeState(serialized);
      const after = [...(restored.butterflies || []), ...(restored.caterpillars || [])]
        .map(entity => [entity.id, entity.lifeSim?.intrinsicDrives || null]);
      return {
        preserved: JSON.stringify(before) === JSON.stringify(after),
        version: restored.version,
        sample: before.find(([id]) => id === target.id)
      };
    });
    report.phases.saveRoundTrip = phase3;
    assert('intrinsicDrives save round-trip preserves byte shape', phase3.preserved, phase3);
    assert('intrinsicDrives save round-trip stays v5', phase3.version === 5, phase3);

    const phase4 = await page.evaluate(() => {
      const serialized = saveSystem.serializeState(gameCore.gameState);
      const preSr5 = JSON.parse(JSON.stringify(serialized));
      preSr5.version = 5;
      for (const entity of [...(preSr5.butterflies || []), ...(preSr5.caterpillars || [])]) {
        if (entity.lifeSim) delete entity.lifeSim.intrinsicDrives;
      }
      const previousRealSave = window.localStorage.getItem('papilionem-save-v2');
      window.localStorage.setItem('papilionem-sr5-default-probe', JSON.stringify(preSr5));
      const migrated = saveSystem.deserializeState(JSON.parse(window.localStorage.getItem('papilionem-sr5-default-probe')));
      const entities = [...(migrated.butterflies || []), ...(migrated.caterpillars || [])];
      return {
        version: migrated.version,
        entityCount: entities.length,
        allDefaulted: entities.every(entity => {
          const profile = entity.lifeSim?.intrinsicDrives || {};
          return profile.curiosity === 0
            && profile.competence === 0
            && profile.boredom === 0
            && profile.lastUpdatedTick === 0;
        }),
        realSaveUnchanged: previousRealSave === window.localStorage.getItem('papilionem-save-v2')
      };
    });
    report.phases.defaultIfMissing = phase4;
    assert('pre-SR5 v5 save defaults intrinsicDrives without schema bump', phase4.version === 5 && phase4.allDefaulted, phase4);
    assert('SR5 default probe does not mutate real save key', phase4.realSaveUnchanged, phase4);

    const phase5 = await page.evaluate(() => {
      const target = gameCore.gameState.butterflies?.[0] || null;
      if (!target) return { error: 'no-target' };
      gameConfig.cognition.intrinsicDrives.enabled = true;
      lifeSimSystem.ensureLifeSimState(target);
      target.lifeSim.derived.theoryOfMindBias = null;
      target.lifeSim.derived.metacognitionBias = null;
      target.lifeSim.derived.intrinsicMotivationBias = null;
      const runCase = (name, context, expectedSubtype) => {
        target.lifeSim.intrinsicDrives = createIntrinsicDriveProfile();
        target.lifeSim.derived.theoryOfMindBias = null;
        target.lifeSim.derived.metacognitionBias = null;
        target.lifeSim.derived.socialEcology = null;
        behaviorSystem.ensureRuntime(target).overrideSecondsRemaining = 0;
        const beforeDrives = JSON.stringify(target.lifeSim.drives || {});
        const result = lifeSimSystem.updateIntrinsicDrives(target, {
          currentFrame: gameCore.getCurrentFrame() + Math.floor(Math.random() * 1000) + 100,
          alpha: 1,
          ...context
        });
        behaviorSystem.syncRuntimeFromEntity(target);
        const runtime = behaviorSystem.getRuntime(target.id);
        const afterDrives = JSON.stringify(target.lifeSim.drives || {});
        return {
          name,
          result,
          profile: { ...target.lifeSim.intrinsicDrives },
          bias: target.lifeSim.derived.intrinsicMotivationBias,
          runtime,
          expectedSubtype,
          protectedDrivesUnchanged: beforeDrives === afterDrives
        };
      };
      const cases = [
        runCase('curiosity', {
          novelty: 1,
          currentAffordance: 'observe',
          focusType: 'object',
          objectInterest: 0.2,
          trainingAffinity: 0,
          lessonDepth: 0,
          routineMemoryDensity: 0,
          placeMemoryDensity: 0
        }, 'curious-exploration'),
        runCase('competence', {
          novelty: 0.1,
          currentAffordance: 'stack',
          focusType: 'block',
          objectInterest: 0.1,
          trainingAffinity: 1,
          lessonDepth: 1,
          routineMemoryDensity: 0.1,
          placeMemoryDensity: 0.1
        }, 'practice-from-competence'),
        runCase('boredom', {
          novelty: 0,
          currentAffordance: 'observe',
          focusType: 'none',
          objectInterest: 0,
          trainingAffinity: 0,
          lessonDepth: 0,
          routineMemoryDensity: 1,
          placeMemoryDensity: 1
        }, 'novelty-seeking')
      ];
      return {
        targetId: target.id,
        cases,
        allDominantMatch: cases.every(item => item.bias?.dominant === item.name),
        allRuntimeMatch: cases.every(item => item.runtime?.currentActionSubtype === item.expectedSubtype),
        allProtectedDrivesUnchanged: cases.every(item => item.protectedDrivesUnchanged)
      };
    });
    report.phases.meaningfulBias = phase5;
    assert('intrinsic update creates curiosity competence and boredom dominant biases', phase5.allDominantMatch, phase5.cases);
    assert('intrinsic bias changes next behavior decision', phase5.allRuntimeMatch, phase5.cases);
    assert('intrinsic update does not rewrite protected lifeSim.drives', phase5.allProtectedDrivesUnchanged, phase5.cases);

    const phase6 = await page.evaluate(() => {
      const target = gameCore.gameState.butterflies?.[0] || gameCore.gameState.caterpillars?.[0] || null;
      if (!target) return { error: 'no-target' };
      const previous = gameConfig.cognition.intrinsicDrives.enabled;
      gameConfig.cognition.intrinsicDrives.enabled = false;
      lifeSimSystem.ensureLifeSimState(target);
      target.lifeSim.intrinsicDrives = createIntrinsicDriveProfile({
        curiosity: 0.8,
        competence: 0.7,
        boredom: 0.6,
        lastUpdatedTick: 99
      });
      const result = lifeSimSystem.updateIntrinsicDrives(target, {
        currentFrame: gameCore.getCurrentFrame() + 200,
        novelty: 1,
        trainingAffinity: 1,
        routineMemoryDensity: 1,
        alpha: 1
      });
      const detail = gameUI.buildInspectDetailDomState(target, gameCore.gameState);
      const inspectHidden = !(detail?.sections || []).some(section => section?.id === 'intrinsicMotivation' || section?.title === 'Intrinsic Motivation');
      const serialized = saveSystem.serializeState(gameCore.gameState);
      const roundTrip = saveSystem.deserializeState(serialized);
      const persistedEntity = [...(roundTrip.butterflies || []), ...(roundTrip.caterpillars || [])].find(entity => entity.id === target.id);
      gameConfig.cognition.intrinsicDrives.enabled = previous;
      return {
        result,
        profile: { ...target.lifeSim.intrinsicDrives },
        bias: target.lifeSim.derived.intrinsicMotivationBias,
        inspectHidden,
        version: roundTrip.version,
        persisted: !!persistedEntity?.lifeSim?.intrinsicDrives
      };
    });
    report.phases.toggleOff = phase6;
    assert('toggle off zeros intrinsicDrives and stops active influence', phase6.profile?.curiosity === 0 && phase6.profile?.competence === 0 && phase6.profile?.boredom === 0 && phase6.bias?.active === false, phase6);
    assert('toggle off hides inspect intrinsicMotivation section', phase6.inspectHidden, phase6);
    assert('toggle off still saves intrinsicDrives field', phase6.version === 5 && phase6.persisted, phase6);

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
