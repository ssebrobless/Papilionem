const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { computeSocietyMetrics, getEdgeStrength } = require('./g0h/societyMetrics');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_logs', 'long_soak_society');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function timestampLabel() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = new Set(argv);
  const readNumber = (flag, fallback) => {
    const index = argv.indexOf(flag);
    if (index < 0 || index + 1 >= argv.length) return fallback;
    const value = Number(argv[index + 1]);
    return Number.isFinite(value) ? value : fallback;
  };
  const readString = (flag, fallback = null) => {
    const index = argv.indexOf(flag);
    if (index < 0 || index + 1 >= argv.length) return fallback;
    const value = argv[index + 1];
    return value && !value.startsWith('--') ? value : fallback;
  };
  const fast = args.has('--fast');
  const fixture = readString('--fixture', null);
  const minutes = readNumber('--minutes', null);
  const seconds = readNumber('--seconds', minutes ? minutes * 60 : (fast ? 240 : 1200));
  const mlMode = readString('--ml', args.has('--ml') ? 'both' : 'both');
  return {
    fast,
    seconds,
    sampleEveryFrames: readNumber('--sample-every-frames', fast ? 900 : 1800),
    compareMl: !args.has('--skip-ml-comparison') && mlMode !== 'on' && mlMode !== 'ml-on',
    fixture,
    fixturePath: fixture ? path.resolve(ROOT, fixture) : null,
    minutes,
    mlMode
  };
}

function readFixture(options = {}) {
  if (!options.fixturePath) return null;
  const fixture = JSON.parse(fs.readFileSync(options.fixturePath, 'utf8'));
  return {
    ...fixture,
    path: options.fixturePath
  };
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
  await page.waitForTimeout(1000);
}

async function resetGame(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
  });
  await page.waitForFunction(() => (gameCore.getGameState?.().butterflies || []).length >= 8, null, {
    timeout: 30000
  });
}

async function collectRun(page, options, label, useMlInference, fixture = null) {
  await resetGame(page);
  return page.evaluate(async ({ seconds, sampleEveryFrames, label: runLabel, useMlInference: nextUseMlInference, fixtureSpec }) => {
    const previousMl = gameConfig.ml.useModelInference;
    gameConfig.ml.useModelInference = !!nextUseMlInference;
    mlInferenceSystem?.deserializeDurableState?.({ modelConfig: gameConfig.ml });
    await mlInferenceSystem?.loadModelArtifact?.(true);

    const state = gameCore.getGameState();
    const aliases = new Map();

    const installCognitionSubscriber = () => {
      if (typeof eventBus === 'undefined' || typeof eventBus.on !== 'function') {
        return { attached: false, reason: 'eventBus-unavailable' };
      }
      if (typeof window.__LONG_SOAK_COGNITION_UNSUB__ === 'function') {
        window.__LONG_SOAK_COGNITION_UNSUB__();
      }
      window.__LONG_SOAK_COGNITION_LOG__ = [];
      window.__LONG_SOAK_COGNITION_DROPPED__ = 0;
      window.__LONG_SOAK_COGNITION_UNSUB__ = eventBus.on('cognition:triggered', data => {
        const log = window.__LONG_SOAK_COGNITION_LOG__ || [];
        log.push(data);
        if (log.length > 10000) {
          log.shift();
          window.__LONG_SOAK_COGNITION_DROPPED__ = (window.__LONG_SOAK_COGNITION_DROPPED__ || 0) + 1;
        }
        window.__LONG_SOAK_COGNITION_LOG__ = log;
      });
      return { attached: true, eventName: 'cognition:triggered' };
    };

    const flushCognitionSubscriber = () => ({
      attached: typeof window.__LONG_SOAK_COGNITION_UNSUB__ === 'function',
      dropped: Number(window.__LONG_SOAK_COGNITION_DROPPED__ || 0),
      events: Array.isArray(window.__LONG_SOAK_COGNITION_LOG__)
        ? JSON.parse(JSON.stringify(window.__LONG_SOAK_COGNITION_LOG__))
        : []
    });

    const uninstallCognitionSubscriber = () => {
      if (typeof window.__LONG_SOAK_COGNITION_UNSUB__ === 'function') {
        window.__LONG_SOAK_COGNITION_UNSUB__();
      }
      window.__LONG_SOAK_COGNITION_UNSUB__ = null;
    };

    const boardToScreen = boardPos => renderManager?.boardToScreen?.({
      zoneId: boardPos.zoneId,
      u: boardPos.u,
      v: boardPos.v,
      h: boardPos.h || 0
    }) || null;

    const setEntityBoardPos = (entity, boardPos) => {
      const screen = boardToScreen(boardPos);
      if (!entity || !screen) return false;
      entity.currentZoneId = boardPos.zoneId;
      entity.lifeSim = entity.lifeSim || {};
      entity.lifeSim.lifecycle = entity.lifeSim.lifecycle || {};
      entity.lifeSim.lifecycle.currentZoneId = boardPos.zoneId;
      entity.boardPos = {
        zoneId: boardPos.zoneId,
        u: boardPos.u,
        v: boardPos.v,
        h: boardPos.h || 0
      };
      entity.x = screen.x;
      entity.y = screen.y;
      entity.syncDebugGridPos?.();
      gameCore.assignEntityToZone?.(entity, boardPos.zoneId);
      return true;
    };

    const getEntity = ref => {
      const id = aliases.get(ref) || ref;
      return (state.butterflies || []).find(entity => entity.id === id) || null;
    };

    const ensureEdge = (source, target, values = {}) => {
      if (!source?.id || !target?.id) return null;
      const edge = typeof ensureLifeSocialEdge === 'function'
        ? ensureLifeSocialEdge(source, target.id)
        : ((source.lifeSim.socialEdges = source.lifeSim.socialEdges || {})[target.id] = source.lifeSim.socialEdges[target.id] || {});
      Object.assign(edge, values);
      return edge;
    };

    const ensureButterflies = (count, zoneId) => {
      const limit = Math.max(gameConfig?.entities?.maxButterflies || 0, count);
      if (gameConfig?.entities) gameConfig.entities.maxButterflies = limit;
      while ((state.butterflies || []).length < count) {
        const point = boardToScreen({ zoneId, u: 8 + state.butterflies.length, v: 8, h: 0 }) || { x: 320, y: 240 };
        gameCore.godSpawnButterfly?.(point.x, point.y);
      }
    };

    const executeFixtureAction = action => {
      const source = getEntity(action.source);
      const targetIds = (action.targets || []).map(target => aliases.get(target) || target).filter(Boolean);
      if (action.type === 'set_edge') {
        ensureEdge(source, getEntity(action.target), action.values || {});
      }
      if (action.type === 'set_board_pos' && source && action.boardPos) {
        setEntityBoardPos(source, action.boardPos);
      }
      if (action.type === 'witness_affection' && source) {
        communicationSystem?.emitCooperationSignal?.(source, {
          signalType: action.signalType || 'acknowledgement_signal',
          intentFamily: action.intentFamily || 'care',
          intentTags: action.intentTags || ['comfort', 'companionship', 'warmth'],
          phrase: action.phrase || 'I am glad you are here.',
          targetIds,
          zoneId: source.currentZoneId || fixtureSpec?.world?.focusedZoneId || null,
          reason: 'long-soak-fixture-witness-affection',
          metadata: { affectionIntensity: action.affectionIntensity ?? 0.8 }
        });
      }
    };

    const applyFixture = fixture => {
      if (!fixture) return { applied: false };
      if (Number.isFinite(fixture.seed)) {
        if (typeof randomSeed === 'function') randomSeed(fixture.seed);
        if (typeof noiseSeed === 'function') noiseSeed(fixture.seed);
      }
      const entitySpecs = fixture.entities || [];
      ensureButterflies(
        entitySpecs.filter(spec => (spec.type || 'butterfly') === 'butterfly').length,
        fixture.world?.focusedZoneId || 'ivy-cloister'
      );
      let butterflyIndex = 0;
      for (const spec of entitySpecs) {
        if ((spec.type || 'butterfly') !== 'butterfly') continue;
        const entity = (state.butterflies || [])[butterflyIndex] || null;
        butterflyIndex += 1;
        if (!entity) continue;
        aliases.set(spec.id, entity.id);
        if (spec.name) entity.displayName = spec.name;
        setEntityBoardPos(entity, spec.boardPos || { zoneId: fixture.world?.focusedZoneId || 'ivy-cloister', u: 8, v: 8, h: 0 });
        if (spec.traits && entity.lifeSim) entity.lifeSim.traits = { ...(entity.lifeSim.traits || {}), ...spec.traits };
        if (spec.drives && entity.lifeSim) entity.lifeSim.drives = { ...(entity.lifeSim.drives || {}), ...spec.drives };
        if (spec.emotions && entity.lifeSim) entity.lifeSim.emotions = { ...(entity.lifeSim.emotions || {}), ...spec.emotions };
        if (spec.social && entity.lifeSim) entity.lifeSim.social = { ...(entity.lifeSim.social || {}), ...spec.social };
        if (spec.derived && entity.lifeSim) entity.lifeSim.derived = { ...(entity.lifeSim.derived || {}), ...spec.derived };
      }
      for (const edgeSpec of fixture.edges || []) {
        ensureEdge(getEntity(edgeSpec.source), getEntity(edgeSpec.target), edgeSpec.values || {});
      }
      for (const objectSpec of fixture.objects || []) {
        const screen = boardToScreen(objectSpec.boardPos || { zoneId: fixture.world?.focusedZoneId || 'ivy-cloister', u: 10, v: 10, h: 0 });
        if (!screen) continue;
        const flower = objectSpec.type === 'dirt-pile'
          ? new Flower(screen.x, screen.y, true, {
              currentZoneId: objectSpec.boardPos.zoneId,
              lifecycleKind: 'dirt-pile',
              spawnedAtFrame: gameCore.getCurrentFrame?.() || 0,
              decayedAtFrame: gameCore.getCurrentFrame?.() || 0
            })
          : gameCore.spawnFlowerAt?.(objectSpec.boardPos.zoneId, screen.x, screen.y, {
              exactPoint: true,
              preferredPoint: { x: screen.x, y: screen.y },
              persistentUntilConsumed: true,
              resourceOrigin: 'long-soak-fixture'
            });
        if (!flower) continue;
        aliases.set(objectSpec.id, flower.id);
        flower.boardPos = { ...objectSpec.boardPos };
        flower.syncDebugGridPos?.();
        if (objectSpec.type === 'dirt-pile') {
          flower.stage = 'decayed';
          flower.lifecycleKind = 'dirt-pile';
          flower.objectProfile = flower.objectProfile || {};
          flower.objectProfile.subtype = 'dirt-pile';
          flower.objectProfile.lifecycleStage = 'decayed';
          state.flowers = state.flowers || [];
          state.flowers.push(flower);
          gameCore.entityManager?.addEntity?.('flowers', flower);
          gameCore.registerEntityWithFoundationSystems?.(flower, 'flower');
        }
        gameCore.assignEntityToZone?.(flower, objectSpec.boardPos.zoneId);
      }
      structureSystem?.update?.(state, 0);
      objectSystem?.update?.(state);
      state.currentFrame = 0;
      if (gameCore?.gameState) gameCore.gameState.currentFrame = 0;
      eventBus?.clearHistory?.();
      communicationSystem?.reset?.();
      lifeSimSystem?.reset?.();
      for (const action of fixture.actions || []) {
        executeFixtureAction(action);
      }
      return {
        applied: true,
        id: fixture.id || null,
        aliases: Object.fromEntries(aliases.entries()),
        expected: fixture.longSoakExpected || null
      };
    };

    const subscriber = installCognitionSubscriber();
    const fixtureResult = applyFixture(fixtureSpec);
    const totalFrames = Math.max(1, Math.round(seconds * 60));
    const samples = [];
    const initialFrame = gameCore.getCurrentFrame?.() || 0;
    const scheduledActions = [...(fixtureSpec?.longSoakActions || [])]
      .map(action => ({
        ...action,
        frame: Math.max(0, Math.round(action.frame || (action.atSeconds || 0) * 60))
      }))
      .sort((left, right) => left.frame - right.frame);
    let nextScheduledAction = 0;
    const sample = (elapsedFrame) => {
      const currentState = gameCore.getGameState();
      const frame = gameCore.getCurrentFrame?.() || initialFrame + elapsedFrame;
      const butterflies = currentState.butterflies || [];
      const packets = [];
      const edges = [];
      for (const entity of butterflies) {
        const memories = entity.lifeSim?.memories || {};
        for (const family of ['social', 'outcome', 'place']) {
          for (const packet of memories[family] || []) {
            packets.push({
              ...JSON.parse(JSON.stringify(packet)),
              entityId: entity.id,
              family
            });
          }
        }
        for (const [targetId, edge] of Object.entries(entity.lifeSim?.socialEdges || {})) {
          edges.push({
            sourceId: entity.id,
            targetId,
            strength: ((edge.trust || 0) + (edge.comfort || 0) + (edge.attachment || 0)) / 3,
            bondTier: edge.bondTier || 'acquaintance'
          });
        }
      }
      samples.push({
        frame,
        elapsedSeconds: elapsedFrame / 60,
        butterflyCount: butterflies.length,
        flowerCount: (currentState.flowers || []).filter(flower => (flower.lifecycleKind || 'flower') === 'flower').length,
        dirtPileCount: (currentState.flowers || []).filter(flower => flower.lifecycleKind === 'dirt-pile').length,
        entities: butterflies.map(entity => ({
          id: entity.id,
          zoneId: entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null,
          state: entity.state || 'normal'
        })),
        edges,
        packets
      });
    };

    sample(0);
    for (let frame = 1; frame <= totalFrames; frame += 1) {
      gameCore.update();
      while (nextScheduledAction < scheduledActions.length && scheduledActions[nextScheduledAction].frame <= frame) {
        executeFixtureAction(scheduledActions[nextScheduledAction]);
        nextScheduledAction += 1;
      }
      if (frame % sampleEveryFrames === 0 || frame === totalFrames) {
        sample(frame);
      }
      if (frame % 600 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    const dialogues = JSON.parse(JSON.stringify(communicationSystem?.dialogueHistory || []));
    const runtimeSummary = mlInferenceSystem?.getRuntimeSummary?.() || null;
    const cognitionSubscriber = flushCognitionSubscriber();
    uninstallCognitionSubscriber();
    gameConfig.ml.useModelInference = previousMl;
    mlInferenceSystem?.deserializeDurableState?.({ modelConfig: gameConfig.ml });
    return {
      label: runLabel,
      useMlInference: !!nextUseMlInference,
      durationSeconds: seconds,
      fixture: fixtureResult,
      cognitionSubscriber: {
        attached: !!subscriber.attached,
        eventName: subscriber.eventName || null,
        dropped: cognitionSubscriber.dropped,
        eventCount: cognitionSubscriber.events.length
      },
      cognitionEvents: cognitionSubscriber.events,
      samples,
      dialogues,
      runtimeSummary
    };
  }, {
    seconds: options.seconds,
    sampleEveryFrames: options.sampleEveryFrames,
    label,
    useMlInference,
    fixtureSpec: fixture
  });
}

function summarizeComparison(onResult, offResult) {
  if (!onResult || !offResult) return null;
  const on = onResult.metrics;
  const off = offResult.metrics;
  const ratio = (left, right) => Number.isFinite(left) && Number.isFinite(right) && right !== 0
    ? left / right
    : null;
  return {
    bondStabilityRatio: ratio(on.bondStability.stdevMeanRatio, off.bondStability.stdevMeanRatio),
    partnerRepetitionRatio: ratio(on.partnerRepetition.fraction, off.partnerRepetition.fraction),
    zoneEntropyRatio: ratio(on.zoneMigrationEntropy.meanEntropy, off.zoneMigrationEntropy.meanEntropy),
    meanDistinctZonesRatio: ratio(on.zoneMigrationEntropy.meanDistinctZonesVisited, off.zoneMigrationEntropy.meanDistinctZonesVisited),
    conversationRepetitionRatio: ratio(on.conversationRepetition.fraction, off.conversationRepetition.fraction),
    witnessedAffectionRateRatio: ratio(on.witnessedAffectionRate.perMinute, off.witnessedAffectionRate.perMinute)
  };
}

function buildFixtureAssertions(result = {}, fixture = null, rawRun = {}) {
  if (!fixture?.longSoakExpected) return [];
  const expected = fixture.longSoakExpected;
  const metrics = result.metrics || {};
  const aliases = rawRun.fixture?.aliases || {};
  const assertions = [];
  if (Number.isFinite(expected.witnessedAffectionEventCountMin)) {
    const actual = metrics.witnessedAffectionRate?.eventCount || 0;
    assertions.push({
      id: 'fixture-witnessed-affection-event-subscription',
      pass: actual >= expected.witnessedAffectionEventCountMin,
      observed: actual,
      expected: `>= ${expected.witnessedAffectionEventCountMin}`,
      sourcePath: metrics.witnessedAffectionRate?.sourcePath || 'event-subscription:cognition:triggered'
    });
  }
  if (Number.isFinite(expected.bondChurnTransitions)) {
    const pair = expected.bondChurnPair || null;
    const expectedPairKey = pair?.source && pair?.target
      ? `${aliases[pair.source] || pair.source}->${aliases[pair.target] || pair.target}`
      : null;
    const pairTransitions = metrics.bondChurn?.pairTransitions || [];
    const actual = expectedPairKey
      ? pairTransitions.filter(transition => transition.pairKey === expectedPairKey).length
      : (metrics.bondChurn?.transitions || 0);
    assertions.push({
      id: 'fixture-bond-churn-hand-computed',
      pass: actual === expected.bondChurnTransitions,
      observed: actual,
      expected: expected.bondChurnTransitions,
      sourcePath: metrics.bondChurn?.sourcePath || 'sample-series:bondTier',
      pairKey: expectedPairKey,
      totalObservedTransitions: metrics.bondChurn?.transitions || 0,
      handComputed: expected.bondChurnHandComputed || null
    });
  }
  if (Number.isFinite(expected.meanDistinctZonesVisitedMin)) {
    const actual = metrics.zoneMigrationEntropy?.meanDistinctZonesVisited || 0;
    assertions.push({
      id: 'fixture-zone-distinct-count-present',
      pass: actual >= expected.meanDistinctZonesVisitedMin,
      observed: actual,
      expected: `>= ${expected.meanDistinctZonesVisitedMin}`,
      sourcePath: metrics.zoneMigrationEntropy?.sourcePath || 'sample-series:entity.zoneId'
    });
  }
  return assertions;
}

async function run() {
  const options = parseArgs();
  const fixture = readFixture(options);
  if (fixture && !process.argv.includes('--seconds') && !process.argv.includes('--minutes') && !options.fast) {
    const fixtureSeconds = Number(fixture.durationSeconds || fixture.durationMinutes * 60);
    if (Number.isFinite(fixtureSeconds) && fixtureSeconds > 0) {
      options.seconds = fixtureSeconds;
    }
  }
  ensureDir(OUTPUT_ROOT);
  const auditId = timestampLabel();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    outputDir,
    options,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    fixture: fixture ? {
      id: fixture.id || null,
      path: fixture.path,
      durationSeconds: fixture.durationSeconds || null,
      expected: fixture.longSoakExpected || null
    } : null,
    runs: [],
    comparison: null,
    overall: 'pending'
  };

  let browser;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);

    const mlOnRaw = await collectRun(page, options, 'ml-on', true, fixture);
    const mlOn = {
      rawPath: path.join(outputDir, 'ml-on-raw.json'),
      ...computeSocietyMetrics(mlOnRaw)
    };
    const mlOnFixtureAssertions = buildFixtureAssertions(mlOn, fixture, mlOnRaw);
    fs.writeFileSync(mlOn.rawPath, `${JSON.stringify(mlOnRaw, null, 2)}\n`);
    report.runs.push({
      label: 'ml-on',
      useMlInference: true,
      rawPath: mlOn.rawPath,
      fixture: mlOnRaw.fixture || null,
      cognitionSubscriber: mlOnRaw.cognitionSubscriber || null,
      metrics: mlOn.metrics,
      checks: mlOn.checks,
      fixtureAssertions: mlOnFixtureAssertions
    });

    if (options.compareMl) {
      const heuristicRaw = await collectRun(page, options, 'heuristic', false, fixture);
      const heuristic = {
        rawPath: path.join(outputDir, 'heuristic-raw.json'),
        ...computeSocietyMetrics(heuristicRaw)
      };
      const heuristicFixtureAssertions = buildFixtureAssertions(heuristic, fixture, heuristicRaw);
      fs.writeFileSync(heuristic.rawPath, `${JSON.stringify(heuristicRaw, null, 2)}\n`);
      report.runs.push({
        label: 'heuristic',
        useMlInference: false,
        rawPath: heuristic.rawPath,
        fixture: heuristicRaw.fixture || null,
        cognitionSubscriber: heuristicRaw.cognitionSubscriber || null,
        metrics: heuristic.metrics,
        checks: heuristic.checks,
        fixtureAssertions: heuristicFixtureAssertions
      });
      report.comparison = summarizeComparison(mlOn, heuristic);
    }

    const societyFails = report.runs[0].checks.filter(check => !check.pass && !check.residual);
    const fixtureFails = report.runs.flatMap(run =>
      (run.fixtureAssertions || [])
        .filter(assertion => !assertion.pass)
        .map(assertion => ({ run: run.label, ...assertion }))
    );
    report.fixtureAssertions = report.runs.flatMap(run =>
      (run.fixtureAssertions || []).map(assertion => ({ run: run.label, ...assertion }))
    );
    report.overall = report.pageErrors.length || report.consoleErrors.length
      || fixtureFails.length
      ? 'fail'
      : societyFails.length
        ? 'pass-with-society-warnings'
        : 'pass';
    report.societyWarnings = societyFails.map(check => ({
      id: check.id,
      observed: check.observed,
      expected: check.expected,
      provisional: !!check.provisional,
      stretch: !!check.stretch
    }));
    report.fixtureFailures = fixtureFails;
    report.completedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath,
      fixtureAssertions: report.fixtureAssertions,
      mlOn: report.runs[0].checks.map(check => ({
        id: check.id,
        pass: check.pass,
        observed: check.observed,
        expected: check.expected,
        provisional: !!check.provisional,
        residual: !!check.residual,
        stretch: !!check.stretch
      }))
    }, null, 2));
    if (report.overall === 'fail') process.exitCode = 1;
  } catch (error) {
    report.overall = 'error';
    report.error = error?.stack || String(error);
    report.completedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.error(report.error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
}

run();
