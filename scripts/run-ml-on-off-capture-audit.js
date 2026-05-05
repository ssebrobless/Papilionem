const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ml_on_off_capture_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];
const VALUE_FRAME_COUNT = 7200;
const VALUE_SAMPLE_INTERVAL = 15;
const CADENCE_FACTOR = Math.max(1, Math.round(Number(process.env.PAPILIONEM_ML_CADENCE_FACTOR || 1)));
function getArgValue(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
const POLICY_ARG = getArgValue('--policy');
const FIXTURE_ARG = getArgValue('--fixture');
const VALUE_THRESHOLDS = {
  chiSquareMotiveDistinctness: 3.84,
  policyDisagreementRate: 0.1,
  edgeChurnRatio: 1.15,
  migrationEntropyRatio: 1.1,
  targetAcquisitionLatencyRatio: 1.2,
  topEdgeFractionMax: 0.15,
  jitterRatio: 0.9
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function resolvePolicyArtifactPath(policyArg = POLICY_ARG) {
  if (!policyArg) return getConfiguredPolicyArtifactPath();
  return path.isAbsolute(policyArg) ? policyArg : path.join(ROOT, policyArg);
}

function toBrowserPolicyPath(artifactPath = resolvePolicyArtifactPath()) {
  return path.relative(ROOT, artifactPath).replace(/\\/g, '/');
}

function loadFixture(fixtureArg = FIXTURE_ARG) {
  if (!fixtureArg) return null;
  const fixturePath = path.isAbsolute(fixtureArg) ? fixtureArg : path.join(ROOT, fixtureArg);
  return {
    path: fixturePath,
    scenario: JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
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
  await page.waitForTimeout(1200);
}

function summarizeRows(entries, currentFrame) {
  const dueEntries = entries.filter(entry => Number.isFinite(entry?.outcomeDueFrame) && currentFrame >= entry.outcomeDueFrame);
  const populatedEntries = dueEntries.filter(entry => !!entry?.outcomeWindow);
  const sourceCounts = entries.reduce((counts, entry) => {
    const source = entry?.source || 'unknown';
    counts[source] = (counts[source] || 0) + 1;
    return counts;
  }, {});
  return {
    decisionEntryCount: entries.length,
    dueEntryCount: dueEntries.length,
    populatedEntryCount: populatedEntries.length,
    populatedRatio: dueEntries.length ? populatedEntries.length / dueEntries.length : 0,
    sourceCounts
  };
}

async function captureStorageSnapshot(page) {
  return page.evaluate((keys) => {
    return keys.reduce((snapshot, key) => {
      snapshot[key] = window.localStorage.getItem(key);
      return snapshot;
    }, {});
  }, STORAGE_KEYS);
}

async function restoreStorageSnapshot(page, snapshot) {
  await page.evaluate(({ keys, snapshot: saved }) => {
    keys.forEach(key => {
      if (saved?.[key] == null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, saved[key]);
      }
    });
  }, { keys: STORAGE_KEYS, snapshot });
}

function sumValues(values = {}) {
  return Object.values(values || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function shannonEntropy(counts = {}) {
  const total = sumValues(counts);
  if (total <= 0) return 0;
  return Object.values(counts).reduce((entropy, count) => {
    const p = (Number(count) || 0) / total;
    return p > 0 ? entropy - (p * Math.log2(p)) : entropy;
  }, 0);
}

function ratio(onValue, offValue) {
  if (!Number.isFinite(onValue) || !Number.isFinite(offValue) || offValue === 0) return null;
  return onValue / offValue;
}

function getConfiguredPolicyArtifactPath() {
  const configPath = path.join(ROOT, 'core', 'config.js');
  try {
    const configSource = fs.readFileSync(configPath, 'utf8');
    const match = configSource.match(/policyArtifactPath:\s*['"]([^'"]+)['"]/);
    if (match?.[1]) return path.join(ROOT, match[1]);
  } catch (error) {
    // Fall back below; this audit should still run even if config parsing changes.
  }
  return path.join(ROOT, 'assets', 'ml', 'm8-garden-policy.json');
}

function compareValueMetrics(mlOn, mlOff) {
  const pairKeys = new Set([
    ...Object.keys(mlOn.valueMetricInputs?.motiveByPair || {}),
    ...Object.keys(mlOff.valueMetricInputs?.motiveByPair || {})
  ]);
  const chiSquares = [];
  for (const pairKey of pairKeys) {
    const left = mlOn.valueMetricInputs?.motiveByPair?.[pairKey] || {};
    const right = mlOff.valueMetricInputs?.motiveByPair?.[pairKey] || {};
    const motives = new Set([...Object.keys(left), ...Object.keys(right)]);
    const leftTotal = sumValues(left);
    const rightTotal = sumValues(right);
    const combinedTotal = leftTotal + rightTotal;
    if (combinedTotal <= 0) continue;
    let chi = 0;
    for (const motive of motives) {
      const observedLeft = Number(left[motive] || 0);
      const observedRight = Number(right[motive] || 0);
      const motiveTotal = observedLeft + observedRight;
      const expectedLeft = motiveTotal * (leftTotal / combinedTotal);
      const expectedRight = motiveTotal * (rightTotal / combinedTotal);
      if (expectedLeft > 0) chi += ((observedLeft - expectedLeft) ** 2) / expectedLeft;
      if (expectedRight > 0) chi += ((observedRight - expectedRight) ** 2) / expectedRight;
    }
    chiSquares.push({ pairKey, chiSquare: Number(chi.toFixed(4)), sampleCount: combinedTotal });
  }
  const aggregateChi = chiSquares.reduce((sum, item) => sum + item.chiSquare, 0);
  const policyRowsOn = Array.isArray(mlOn.decisionRows) ? mlOn.decisionRows : [];
  const policyRowsOff = Array.isArray(mlOff.decisionRows) ? mlOff.decisionRows : [];
  const comparablePolicyCount = Math.min(policyRowsOn.length, policyRowsOff.length);
  const policyKeys = ['action', 'target', 'signal', 'risk', 'battle'];
  let disagreementCount = 0;
  let decisionPolicyCount = 0;
  for (let index = 0; index < comparablePolicyCount; index += 1) {
    const left = policyRowsOn[index] || {};
    const right = policyRowsOff[index] || {};
    for (const key of policyKeys) {
      if (!left[key] || !right[key]) continue;
      decisionPolicyCount += 1;
      if (left[key] !== right[key]) disagreementCount += 1;
    }
  }
  const disagreementRate = decisionPolicyCount
    ? disagreementCount / decisionPolicyCount
    : null;
  const onEdgeChurn = mlOn.valueMetricInputs?.edgeChurnPerMinute || 0;
  const offEdgeChurn = mlOff.valueMetricInputs?.edgeChurnPerMinute || 0;
  const onMigrationEntropy = shannonEntropy(mlOn.valueMetricInputs?.migrationTargetCounts || {});
  const offMigrationEntropy = shannonEntropy(mlOff.valueMetricInputs?.migrationTargetCounts || {});
  const onLatency = mlOn.valueMetricInputs?.targetAcquisitionLatencyFrames ?? null;
  const offLatency = mlOff.valueMetricInputs?.targetAcquisitionLatencyFrames ?? null;
  const onTopEdge = mlOn.valueMetricInputs?.topEdgeFraction ?? null;
  const offTopEdge = mlOff.valueMetricInputs?.topEdgeFraction ?? null;
  const onJitter = mlOn.valueMetricInputs?.jitterRatio ?? null;
  const offJitter = mlOff.valueMetricInputs?.jitterRatio ?? null;

  const metrics = [
    {
      name: 'per-policy-disagreement-rate',
      value: Number((disagreementRate ?? 0).toFixed(4)),
      threshold: `>= ${VALUE_THRESHOLDS.policyDisagreementRate}`,
      meetsThreshold: disagreementRate !== null && disagreementRate >= VALUE_THRESHOLDS.policyDisagreementRate,
      evaluated: disagreementRate !== null,
      details: {
        comparableDecisionRows: comparablePolicyCount,
        decisionPolicyCount,
        disagreementCount,
        retiredChiSquareMotiveDistinctness: {
          value: Number(aggregateChi.toFixed(4)),
          evaluated: chiSquares.length > 0,
          pairCount: chiSquares.length,
          pairs: chiSquares,
          reason: aggregateChi === 0
            ? 'informationless-at-current-sample-scale'
            : 'retained-for-diagnostics'
        }
      }
    },
    {
      name: 'edge-delta-churn-per-minute',
      mlOn: onEdgeChurn,
      mlOff: offEdgeChurn,
      ratio: ratio(onEdgeChurn, offEdgeChurn),
      threshold: `ml-on / ml-off >= ${VALUE_THRESHOLDS.edgeChurnRatio}`,
      meetsThreshold: ratio(onEdgeChurn, offEdgeChurn) !== null
        && ratio(onEdgeChurn, offEdgeChurn) >= VALUE_THRESHOLDS.edgeChurnRatio,
      evaluated: Number.isFinite(onEdgeChurn) && Number.isFinite(offEdgeChurn),
      details: {
        mlOnTotal: mlOn.valueMetricInputs?.edgeChurnTotal || 0,
        mlOffTotal: mlOff.valueMetricInputs?.edgeChurnTotal || 0
      }
    },
    {
      name: 'migration-target-shannon-entropy',
      mlOn: Number(onMigrationEntropy.toFixed(4)),
      mlOff: Number(offMigrationEntropy.toFixed(4)),
      ratio: ratio(onMigrationEntropy, offMigrationEntropy),
      threshold: `ml-on / ml-off >= ${VALUE_THRESHOLDS.migrationEntropyRatio}`,
      meetsThreshold: ratio(onMigrationEntropy, offMigrationEntropy) !== null
        && ratio(onMigrationEntropy, offMigrationEntropy) >= VALUE_THRESHOLDS.migrationEntropyRatio,
      evaluated: sumValues(mlOn.valueMetricInputs?.migrationTargetCounts) > 0
        && sumValues(mlOff.valueMetricInputs?.migrationTargetCounts) > 0,
      details: {
        mlOnCounts: mlOn.valueMetricInputs?.migrationTargetCounts || {},
        mlOffCounts: mlOff.valueMetricInputs?.migrationTargetCounts || {}
      }
    },
    {
      name: 'target-acquisition-latency',
      mlOn: onLatency,
      mlOff: offLatency,
      ratio: ratio(onLatency, offLatency),
      threshold: `ml-on / ml-off <= ${VALUE_THRESHOLDS.targetAcquisitionLatencyRatio}`,
      meetsThreshold: ratio(onLatency, offLatency) !== null
        && ratio(onLatency, offLatency) <= VALUE_THRESHOLDS.targetAcquisitionLatencyRatio,
      evaluated: Number.isFinite(onLatency) && Number.isFinite(offLatency),
      details: {
        mlOnSamples: mlOn.valueMetricInputs?.targetAcquisitionSampleCount || 0,
        mlOffSamples: mlOff.valueMetricInputs?.targetAcquisitionSampleCount || 0
      }
    },
    {
      name: 'top-15-percent-top-edge-fraction',
      mlOn: onTopEdge,
      mlOff: offTopEdge,
      threshold: `ml-on <= ${VALUE_THRESHOLDS.topEdgeFractionMax}`,
      meetsThreshold: Number.isFinite(onTopEdge) && onTopEdge <= VALUE_THRESHOLDS.topEdgeFractionMax,
      evaluated: Number.isFinite(onTopEdge) && Number.isFinite(offTopEdge),
      details: {
        mlOnSamples: mlOn.valueMetricInputs?.topEdgeSampleCount || 0,
        mlOffSamples: mlOff.valueMetricInputs?.topEdgeSampleCount || 0
      }
    },
    {
      name: 'near-target-jitter-ratio',
      mlOn: onJitter,
      mlOff: offJitter,
      ratio: ratio(onJitter, offJitter),
      threshold: `ml-on / ml-off <= ${VALUE_THRESHOLDS.jitterRatio}`,
      meetsThreshold: ratio(onJitter, offJitter) !== null
        && ratio(onJitter, offJitter) <= VALUE_THRESHOLDS.jitterRatio,
      evaluated: Number.isFinite(onJitter) && Number.isFinite(offJitter),
      details: {
        mlOnNearTargetSteps: mlOn.valueMetricInputs?.nearTargetStepCount || 0,
        mlOffNearTargetSteps: mlOff.valueMetricInputs?.nearTargetStepCount || 0
      }
    }
  ];
  return {
    frameCount: VALUE_FRAME_COUNT,
    sampleInterval: VALUE_SAMPLE_INTERVAL,
    thresholds: VALUE_THRESHOLDS,
    metrics,
    diagnostics: {
      mlOn: summarizeValueDiagnostics(mlOn),
      mlOff: summarizeValueDiagnostics(mlOff)
    },
    metricsEvaluated: metrics.filter(metric => metric.evaluated).length,
    metricsMeetingThreshold: metrics.filter(metric => metric.evaluated && metric.meetsThreshold).length
  };
}

function summarizeValueDiagnostics(scenario = {}) {
  const inputs = scenario.valueMetricInputs || {};
  const entities = Array.isArray(inputs.entityMovementDiagnostics)
    ? inputs.entityMovementDiagnostics
    : [];
  const byTopEdge = [...entities]
    .sort((left, right) => (right.topEdgeFraction || 0) - (left.topEdgeFraction || 0))
    .slice(0, 5);
  const byLatency = [...entities]
    .filter(entity => Number.isFinite(entity.averageAcquisitionFrames))
    .sort((left, right) => (right.averageAcquisitionFrames || 0) - (left.averageAcquisitionFrames || 0))
    .slice(0, 5);
  const distinctZones = entities.map(entity => entity.distinctZoneCount || 0);
  return {
    modelVersionId: scenario.runtimeSummary?.modelVersionId || null,
    topEdgeOffenders: byTopEdge,
    slowTargetAcquirers: byLatency,
    zoneTopEdgeFractions: inputs.zoneTopEdgeFractions || {},
    migrationTargetCounts: inputs.migrationTargetCounts || {},
    migrationTargetSourceCounts: inputs.migrationTargetSourceCounts || {},
    meanDistinctZonesPerEntity: distinctZones.length
      ? Number((distinctZones.reduce((sum, value) => sum + value, 0) / distinctZones.length).toFixed(4))
      : 0,
    entityCount: entities.length
  };
}

async function runScenario(page, mlOn, storageSnapshot, cadenceFactor = CADENCE_FACTOR, policyBrowserPath = toBrowserPolicyPath(), fixtureScenario = null) {
  await restoreStorageSnapshot(page, storageSnapshot);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);

  await page.evaluate(async ({ useMl, cadenceFactor, policyPath, fixture }) => {
    function boardToScreen(boardPos) {
      return renderManager?.boardToScreen?.({
        zoneId: boardPos.zoneId,
        u: boardPos.u,
        v: boardPos.v,
        h: boardPos.h || 0
      }) || null;
    }

    function setEntityBoardPos(entity, boardPos) {
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
    }

    function ensureEdge(source, target, values = {}) {
      if (!source?.id || !target?.id) return null;
      const edge = typeof ensureLifeSocialEdge === 'function'
        ? ensureLifeSocialEdge(source, target.id)
        : ((source.lifeSim.socialEdges = source.lifeSim.socialEdges || {})[target.id] = source.lifeSim.socialEdges[target.id] || {});
      Object.assign(edge, values);
      return edge;
    }

    async function applyFixture(scenario) {
      if (!scenario) return null;
      const seed = Number(scenario.seed);
      if (Number.isFinite(seed)) {
        if (typeof randomSeed === 'function') randomSeed(seed);
        if (typeof noiseSeed === 'function') noiseSeed(seed);
      }
      await gameCore.resetGame?.(true);
      if (Number.isFinite(seed)) {
        if (typeof randomSeed === 'function') randomSeed(seed);
        if (typeof noiseSeed === 'function') noiseSeed(seed);
      }
      const specs = (scenario.entities || []).filter(spec => (spec.type || 'butterfly') === 'butterfly');
      if (gameConfig?.entities) {
        gameConfig.entities.maxButterflies = Math.max(gameConfig.entities.maxButterflies || 0, specs.length);
      }
      const focusedZoneId = scenario.world?.focusedZoneId || specs[0]?.boardPos?.zoneId || 'ivy-cloister';
      gameCore.focusZone?.(focusedZoneId);
      while ((gameCore.getGameState()?.butterflies || []).length < specs.length) {
        const index = gameCore.getGameState()?.butterflies?.length || 0;
        const point = boardToScreen({ zoneId: focusedZoneId, u: 8 + index, v: 8, h: 0 }) || { x: 320, y: 240 };
        gameCore.godSpawnButterfly?.(point.x, point.y);
      }
      const state = gameCore.getGameState();
      const aliases = {};
      specs.forEach((spec, index) => {
        const entity = (state.butterflies || [])[index];
        if (!entity) return;
        aliases[spec.id] = entity.id;
        entity.name = spec.name || entity.name;
        setEntityBoardPos(entity, spec.boardPos || { zoneId: focusedZoneId, u: 8 + index, v: 8, h: 0 });
        if (spec.traits && entity.lifeSim) entity.lifeSim.traits = { ...(entity.lifeSim.traits || {}), ...spec.traits };
        if (spec.drives && entity.lifeSim) entity.lifeSim.drives = { ...(entity.lifeSim.drives || {}), ...spec.drives };
        if (spec.emotions && entity.lifeSim) entity.lifeSim.emotions = { ...(entity.lifeSim.emotions || {}), ...spec.emotions };
        if (spec.derived && entity.lifeSim) entity.lifeSim.derived = { ...(entity.lifeSim.derived || {}), ...spec.derived };
      });
      for (const edgeSpec of scenario.edges || []) {
        const sourceId = aliases[edgeSpec.source] || edgeSpec.source;
        const targetId = aliases[edgeSpec.target] || edgeSpec.target;
        const source = (state.butterflies || []).find(entity => entity.id === sourceId);
        const target = (state.butterflies || []).find(entity => entity.id === targetId);
        ensureEdge(source, target, edgeSpec.values || {});
      }
      state.currentFrame = 0;
      if (gameCore?.gameState) gameCore.gameState.currentFrame = 0;
      eventBus?.clearHistory?.();
      communicationSystem?.reset?.();
      lifeSimSystem?.reset?.();
      structureSystem?.update?.(state, 0);
      objectSystem?.update?.(state);
      return {
        id: scenario.id || null,
        seed: scenario.seed || null,
        butterflyCount: (state.butterflies || []).length,
        focusedZoneId
      };
    }

    const fixtureSummary = await applyFixture(fixture);
    gameConfig.ml = gameConfig.ml || {};
    gameConfig.ml.policyArtifactPath = policyPath;
    gameConfig.ml.useModelInference = !!useMl;
    gameConfig.ml.cadenceFactor = Math.max(1, Math.round(Number(cadenceFactor || 1)));
    gameConfig.ml.traceCapture = {
      ...(gameConfig.ml.traceCapture || {}),
      outcomeWindow: true,
      outcomeWindowFrames: 60
    };
    gameConfig.ml.useModelInference = !!useMl;
    gameConfig.ml.decisionHistoryLimit = Math.max(128, Number(gameConfig.ml.decisionHistoryLimit || 0));
    mlInferenceSystem.reset();
    mlInferenceSystem.modelConfig.decisionHistoryLimit = Math.max(128, Number(mlInferenceSystem.modelConfig.decisionHistoryLimit || 0));
    mlInferenceSystem.modelConfig.useModelInference = !!useMl;
    mlInferenceSystem.modelConfig.cadenceFactor = gameConfig.ml.cadenceFactor;
    mlInferenceSystem.modelConfig.policyArtifactPath = policyPath;
    await mlInferenceSystem.loadModelArtifact(true);
    window.__PAPILIONEM_ML_VALUE_FIXTURE_SUMMARY__ = fixtureSummary;
  }, { useMl: mlOn, cadenceFactor, policyPath: policyBrowserPath, fixture: fixtureScenario });

  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && state.butterflies?.length >= 6;
  }, null, { timeout: 20000 });

  return page.evaluate(({ useMl, frameCount, sampleInterval, cadenceFactor }) => {
    const startFrame = gameCore.getCurrentFrame?.() || 0;
    const startDialogueCount = communicationSystem?.dialogueHistory?.length || 0;
    const updateSamples = [];
    const movementStats = {};
    const migrationTargetCounts = {};
    const migrationTargetSourceCounts = {};
    const zoneTopEdgeSamples = {};
    const getBoardPos = (entity) => {
      const board = entity?.ensureBoardPos?.() || entity?.boardPos || null;
      if (board && Number.isFinite(board.u) && Number.isFinite(board.v)) return board;
      if (Number.isFinite(entity?.x) && Number.isFinite(entity?.y) && renderManager?.screenToBoard) {
        return renderManager.screenToBoard(entity.x, entity.y + (entity.shadowOffset || 0), entity.currentZoneId || gameCore.getFocusedZoneId(), 0);
      }
      return null;
    };
    const getTarget = (entity) => {
      const target = entity?.getMovementTargetBoardPos?.() || entity?.movement?.target || null;
      if (target && Number.isFinite(target.u) && Number.isFinite(target.v)) return target;
      if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
        return { u: target.x, v: target.y, zoneId: entity.currentZoneId || gameCore.getFocusedZoneId() };
      }
      return null;
    };
    const getDepthUnits = (zoneId) => {
      const zone = zoneSystem?.getZone?.(zoneId) || {};
      return Number(zone?.boardBounds?.depthUnits || zone?.boardBounds?.height || zone?.boardDepthUnits || gameConfig?.world?.simBoard?.depthUnits || 36);
    };
    const sampleMovement = (absoluteFrame) => {
      const state = gameCore.getGameState();
      for (const butterfly of state.butterflies || []) {
        const board = getBoardPos(butterfly);
        if (!board) continue;
        const target = getTarget(butterfly);
        const id = butterfly.id || `butterfly-${Object.keys(movementStats).length}`;
        const stats = movementStats[id] || {
          id,
          name: butterfly.name || id,
          previousBoard: null,
          previousDelta: null,
          activeTargetKey: null,
          activeTargetStartFrame: null,
          acquisitions: [],
          topSamples: 0,
          totalSamples: 0,
          zoneSamples: {},
          zoneTopSamples: {},
          migrationTargetCounts: {},
          migrationTargetSourceCounts: {},
          targetChangeCount: 0,
          nearTargetSteps: 0,
          jitterFlips: 0
        };
        const zoneId = board.zoneId || butterfly.currentZoneId || gameCore.getFocusedZoneId();
        const depth = Math.max(1, getDepthUnits(zoneId));
        const inTopEdge = board.v < depth * 0.15;
        if (inTopEdge) stats.topSamples += 1;
        stats.totalSamples += 1;
        stats.zoneSamples[zoneId] = (stats.zoneSamples[zoneId] || 0) + 1;
        if (inTopEdge) stats.zoneTopSamples[zoneId] = (stats.zoneTopSamples[zoneId] || 0) + 1;
        zoneTopEdgeSamples[zoneId] = zoneTopEdgeSamples[zoneId] || { topSamples: 0, totalSamples: 0 };
        zoneTopEdgeSamples[zoneId].totalSamples += 1;
        if (inTopEdge) zoneTopEdgeSamples[zoneId].topSamples += 1;
        const migration = butterfly.lifeSim?.derived?.migration || butterfly.lifeSim?.migration || {};
        let migrationTarget = 'none';
        let migrationTargetSource = 'none';
        if (migration.travelTargetZoneId) {
          migrationTarget = migration.travelTargetZoneId;
          migrationTargetSource = 'derived.travelTargetZoneId';
        } else if (migration.cohortPreferredZoneId) {
          migrationTarget = migration.cohortPreferredZoneId;
          migrationTargetSource = 'derived.cohortPreferredZoneId';
        } else if (butterfly.zoneTravel?.targetZoneId) {
          migrationTarget = butterfly.zoneTravel.targetZoneId;
          migrationTargetSource = 'zoneTravel.targetZoneId';
        } else if (butterfly.currentZoneId) {
          migrationTarget = butterfly.currentZoneId;
          migrationTargetSource = 'currentZoneId';
        }
        migrationTargetCounts[migrationTarget] = (migrationTargetCounts[migrationTarget] || 0) + 1;
        migrationTargetSourceCounts[migrationTargetSource] = (migrationTargetSourceCounts[migrationTargetSource] || 0) + 1;
        stats.migrationTargetCounts[migrationTarget] = (stats.migrationTargetCounts[migrationTarget] || 0) + 1;
        stats.migrationTargetSourceCounts[migrationTargetSource] = (stats.migrationTargetSourceCounts[migrationTargetSource] || 0) + 1;
        if (target) {
          const targetKey = `${target.zoneId || zoneId}:${Math.round(target.u * 10) / 10}:${Math.round(target.v * 10) / 10}`;
          if (stats.activeTargetKey !== targetKey) {
            if (stats.activeTargetKey != null) stats.targetChangeCount += 1;
            stats.activeTargetKey = targetKey;
            stats.activeTargetStartFrame = absoluteFrame;
          }
          const distanceToTarget = Math.hypot((target.u || 0) - board.u, (target.v || 0) - board.v);
          if (distanceToTarget <= 0.5 && stats.activeTargetStartFrame != null) {
            stats.acquisitions.push(Math.max(0, absoluteFrame - stats.activeTargetStartFrame));
            stats.activeTargetStartFrame = null;
          }
          if (distanceToTarget <= 0.5 && stats.previousBoard) {
            stats.nearTargetSteps += 1;
            const delta = { u: board.u - stats.previousBoard.u, v: board.v - stats.previousBoard.v };
            if (stats.previousDelta) {
              const dot = (delta.u * stats.previousDelta.u) + (delta.v * stats.previousDelta.v);
              const moved = Math.hypot(delta.u, delta.v) > 0.01 && Math.hypot(stats.previousDelta.u, stats.previousDelta.v) > 0.01;
              if (moved && dot < -0.002) stats.jitterFlips += 1;
            }
            stats.previousDelta = delta;
          }
        }
        stats.previousBoard = { u: board.u, v: board.v };
        movementStats[id] = stats;
      }
    };

    for (let frame = 0; frame < frameCount; frame += 1) {
      const sample = gameCore.update();
      if (frame % 120 === 0 && sample?.ml) {
        updateSamples.push(sample.ml);
      }
      if (frame % sampleInterval === 0) {
        sampleMovement(startFrame + frame);
      }
    }

    const currentFrame = gameCore.getCurrentFrame?.() || startFrame + frameCount;
    mlInferenceSystem.populateOutcomeWindows?.(gameCore.getGameState(), currentFrame);

    const runtimes = [...mlInferenceSystem.runtimeByEntityId.values()];
    const traces = runtimes.map(runtime => runtime.trace).filter(Boolean);
    const entries = runtimes.flatMap(runtime => runtime.decisionHistory || []);
    const dueEntries = entries.filter(entry => Number.isFinite(entry?.outcomeDueFrame) && currentFrame >= entry.outcomeDueFrame);
    const populatedEntries = dueEntries.filter(entry => !!entry?.outcomeWindow);
    const rowSummary = {
      decisionEntryCount: entries.length,
      dueEntryCount: dueEntries.length,
      populatedEntryCount: populatedEntries.length,
      populatedRatio: dueEntries.length ? populatedEntries.length / dueEntries.length : 0,
      sourceCounts: entries.reduce((counts, entry) => {
        const source = entry?.source || 'unknown';
        counts[source] = (counts[source] || 0) + 1;
        return counts;
      }, {})
    };
    const policySourceCounts = {};
    for (const trace of traces) {
      for (const source of Object.values(trace.policySources || {})) {
        if (!source) continue;
        policySourceCounts[source] = (policySourceCounts[source] || 0) + 1;
      }
    }
    const topActions = entries.reduce((counts, entry) => {
      const action = entry?.action || 'unknown';
      counts[action] = (counts[action] || 0) + 1;
      return counts;
    }, {});
    const decisionRows = entries.map(entry => ({
      atFrame: entry?.atFrame || null,
      source: entry?.source || null,
      action: entry?.action || null,
      target: entry?.target || null,
      signal: entry?.signal || null,
      risk: entry?.risk || null,
      battle: entry?.battle || null,
      confidence: entry?.confidence ?? null
    }));
    const newDialogues = (communicationSystem?.dialogueHistory || []).slice(startDialogueCount);
    const motiveByPair = {};
    let edgeChurnTotal = 0;
    for (const dialogue of newDialogues) {
      const pairKey = communicationSystem?.getDialoguePairKey?.(dialogue) || dialogue.conversationId || `${dialogue.sourceId || 'source'}:${(dialogue.targetIds || []).join(',') || 'all'}`;
      const motive = communicationSystem?.getDialogueMotiveFamily?.(dialogue) || dialogue.intentFamily || 'social';
      motiveByPair[pairKey] = motiveByPair[pairKey] || {};
      motiveByPair[pairKey][motive] = (motiveByPair[pairKey][motive] || 0) + 1;
      for (const residue of dialogue.residues || []) {
        for (const bucket of [residue?.edgeDeltas || {}, residue?.relationshipDeltas || {}]) {
          for (const value of Object.values(bucket)) {
            const numeric = Number(value || 0);
            if (Number.isFinite(numeric)) edgeChurnTotal += Math.abs(numeric);
          }
        }
      }
    }
    const allStats = Object.values(movementStats);
    const acquisitionFrames = allStats.flatMap(stats => stats.acquisitions || []);
    const totalTopSamples = allStats.reduce((sum, stats) => sum + (stats.topSamples || 0), 0);
    const totalSamples = allStats.reduce((sum, stats) => sum + (stats.totalSamples || 0), 0);
    const totalNearTarget = allStats.reduce((sum, stats) => sum + (stats.nearTargetSteps || 0), 0);
    const totalJitterFlips = allStats.reduce((sum, stats) => sum + (stats.jitterFlips || 0), 0);
    const entityMovementDiagnostics = allStats.map(stats => {
      const acquisitions = stats.acquisitions || [];
      return {
        id: stats.id,
        name: stats.name,
        topSamples: stats.topSamples || 0,
        totalSamples: stats.totalSamples || 0,
        topEdgeFraction: stats.totalSamples
          ? Number(((stats.topSamples || 0) / stats.totalSamples).toFixed(4))
          : 0,
        distinctZoneCount: Object.keys(stats.zoneSamples || {}).length,
        zoneSamples: stats.zoneSamples || {},
        zoneTopSamples: stats.zoneTopSamples || {},
        migrationTargetCounts: stats.migrationTargetCounts || {},
        migrationTargetSourceCounts: stats.migrationTargetSourceCounts || {},
        acquisitionSampleCount: acquisitions.length,
        averageAcquisitionFrames: acquisitions.length
          ? Number((acquisitions.reduce((sum, value) => sum + value, 0) / acquisitions.length).toFixed(2))
          : null,
        targetChangeCount: stats.targetChangeCount || 0,
        nearTargetStepCount: stats.nearTargetSteps || 0,
        jitterFlipCount: stats.jitterFlips || 0
      };
    });
    const zoneTopEdgeFractions = Object.entries(zoneTopEdgeSamples).reduce((summary, [zoneId, stats]) => {
      summary[zoneId] = {
        topSamples: stats.topSamples,
        totalSamples: stats.totalSamples,
        fraction: stats.totalSamples
          ? Number((stats.topSamples / stats.totalSamples).toFixed(4))
          : 0
      };
      return summary;
    }, {});
    const durationMinutes = frameCount / 3600;
    const valueMetricInputs = {
      motiveByPair,
      dialogueSampleCount: newDialogues.length,
      edgeChurnTotal: Number(edgeChurnTotal.toFixed(4)),
      edgeChurnPerMinute: Number((edgeChurnTotal / Math.max(0.001, durationMinutes)).toFixed(4)),
      migrationTargetCounts,
      migrationTargetSourceCounts,
      targetAcquisitionLatencyFrames: acquisitionFrames.length
        ? Number((acquisitionFrames.reduce((sum, value) => sum + value, 0) / acquisitionFrames.length).toFixed(2))
        : null,
      targetAcquisitionSampleCount: acquisitionFrames.length,
      topEdgeFraction: totalSamples ? Number((totalTopSamples / totalSamples).toFixed(4)) : null,
      topEdgeSampleCount: totalSamples,
      zoneTopEdgeFractions,
      entityMovementDiagnostics,
      jitterRatio: totalNearTarget ? Number((totalJitterFlips / totalNearTarget).toFixed(4)) : null,
      nearTargetStepCount: totalNearTarget,
      jitterFlipCount: totalJitterFlips
    };

    return {
      label: useMl ? 'ml-on' : 'ml-off',
      fixtureSummary: window.__PAPILIONEM_ML_VALUE_FIXTURE_SUMMARY__ || null,
      cadenceFactor,
      useModelInference: !!mlInferenceSystem.modelConfig.useModelInference,
      runtimeSummary: mlInferenceSystem.getRuntimeSummary?.() || null,
      startFrame,
      currentFrame,
      runtimeCount: runtimes.length,
      traceCount: traces.length,
      rowSummary,
      policySourceCounts,
      topActions,
      decisionRows,
      valueMetricInputs,
      sampleEntries: entries.slice(0, 8),
      updateSamples
    };
  }, { useMl: mlOn, frameCount: VALUE_FRAME_COUNT, sampleInterval: VALUE_SAMPLE_INTERVAL, cadenceFactor });
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
    cadenceFactor: CADENCE_FACTOR,
    outputDir,
    pageErrors: [],
    consoleErrors: [],
    server: null,
    policyArtifactPath: resolvePolicyArtifactPath(),
    fixture: null,
    scenarios: [],
    checks: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let page;

  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);

    const storageSnapshot = await captureStorageSnapshot(page);
    const fixture = loadFixture();
    report.fixture = fixture
      ? {
          path: fixture.path,
          id: fixture.scenario?.id || null,
          seed: fixture.scenario?.seed || null,
          entityCount: Array.isArray(fixture.scenario?.entities) ? fixture.scenario.entities.length : 0
        }
      : null;
    const policyBrowserPath = toBrowserPolicyPath(resolvePolicyArtifactPath());
    const mlOn = await runScenario(page, true, storageSnapshot, CADENCE_FACTOR, policyBrowserPath, fixture?.scenario || null);
    const mlOff = await runScenario(page, false, storageSnapshot, CADENCE_FACTOR, policyBrowserPath, fixture?.scenario || null);
    await restoreStorageSnapshot(page, storageSnapshot);
    const valueMetrics = compareValueMetrics(mlOn, mlOff);
    report.scenarios.push(mlOn, mlOff);
    report.valueMetrics = valueMetrics;

    report.checks.push({
      name: 'ml-on-loads-static-policy-and-produces-ml-decisions',
      pass: !!mlOn.runtimeSummary?.modelLoaded
        && (mlOn.policySourceCounts.ml || 0) > 0
        && (mlOn.rowSummary.sourceCounts.ml || 0) > 0
        && !mlOn.runtimeSummary?.lastLoadError
        && !mlOn.runtimeSummary?.lastInferenceError,
      details: {
        loadedPolicies: mlOn.runtimeSummary?.loadedPolicies || [],
        policySourceCounts: mlOn.policySourceCounts,
        rowSourceCounts: mlOn.rowSummary.sourceCounts,
        lastLoadError: mlOn.runtimeSummary?.lastLoadError || null,
        lastInferenceError: mlOn.runtimeSummary?.lastInferenceError || null
      }
    });
    report.checks.push({
      name: 'ml-off-stays-on-heuristic-fallback',
      pass: mlOff.useModelInference === false
        && !mlOff.runtimeSummary?.modelLoaded
        && (mlOff.policySourceCounts.ml || 0) === 0
        && (mlOff.rowSummary.sourceCounts.ml || 0) === 0
        && ((mlOff.policySourceCounts['heuristic-fallback'] || 0) > 0 || (mlOff.rowSummary.sourceCounts['heuristic-fallback'] || 0) > 0),
      details: {
        modelLoaded: mlOff.runtimeSummary?.modelLoaded,
        policySourceCounts: mlOff.policySourceCounts,
        rowSourceCounts: mlOff.rowSummary.sourceCounts
      }
    });
    report.checks.push({
      name: 'outcome-window-row-coverage-at-least-80-percent',
      pass: mlOn.rowSummary.dueEntryCount > 0
        && mlOff.rowSummary.dueEntryCount > 0
        && mlOn.rowSummary.populatedRatio >= 0.8
        && mlOff.rowSummary.populatedRatio >= 0.8,
      details: {
        mlOn: mlOn.rowSummary,
        mlOff: mlOff.rowSummary
      }
    });
    report.checks.push({
      name: 'browser-clean',
      pass: report.pageErrors.length === 0 && report.consoleErrors.length === 0,
      details: {
        pageErrors: report.pageErrors,
        consoleErrors: report.consoleErrors
      }
    });
    report.checks.push({
      name: 'value-band-metrics-present-and-tagged',
      pass: valueMetrics.metrics.length === 6
        && valueMetrics.metrics.every(metric => typeof metric.meetsThreshold === 'boolean'),
      details: valueMetrics
    });

    fs.writeFileSync(path.join(outputDir, 'side-by-side.json'), JSON.stringify({ mlOn, mlOff, valueMetrics }, null, 2));
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
