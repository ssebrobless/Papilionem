const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'c2_trace_corpus');
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

function digestValue(value) {
  return crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex');
}

function buildRecordDigest(record) {
  return digestValue({
    schemaVersion: record?.schemaVersion || null,
    recordKind: record?.recordKind || null,
    scenarioId: record?.scenarioId || null,
    scenarioFamily: record?.scenarioFamily || null,
    tags: Array.isArray(record?.tags) ? [...record.tags].sort() : [],
    featureSchemaVersion: record?.featureSchemaVersion || null,
    traceSchemaVersion: record?.traceSchemaVersion || null,
    heuristicTrace: record?.heuristicTrace || null,
    trainingLabels: record?.trainingLabels || {},
    review: record?.review || {},
    features: record?.features || {}
  });
}

function buildCorpusManifest(records = [], meta = {}) {
  const scenarioMap = new Map();
  const scenarioFamilies = new Set();
  const recordKinds = new Set();
  let reviewedRecordCount = 0;
  let correctedRecordCount = 0;
  let correctedPolicyCount = 0;

  for (const record of records) {
    if (!record) continue;
    scenarioFamilies.add(record.scenarioFamily || 'unknown');
    recordKinds.add(record.recordKind || 'garden');
    if (record?.review?.status && record.review.status !== 'unreviewed') {
      reviewedRecordCount += 1;
    }
    const recordCorrectedPolicies = Array.isArray(record?.review?.correctedPolicies)
      ? record.review.correctedPolicies.filter(Boolean)
      : [];
    if (recordCorrectedPolicies.length) {
      correctedRecordCount += 1;
      correctedPolicyCount += recordCorrectedPolicies.length;
    }
    const key = record.scenarioId || `scenario-${scenarioMap.size + 1}`;
    if (!scenarioMap.has(key)) {
      scenarioMap.set(key, {
        scenarioId: key,
        scenarioFamily: record.scenarioFamily || 'unknown',
        recordCount: 0,
        reviewedRecordCount: 0,
        correctedRecordCount: 0,
        correctedPolicyCount: 0,
        tags: new Set()
      });
    }
    const summary = scenarioMap.get(key);
    summary.recordCount += 1;
    if (record?.review?.status && record.review.status !== 'unreviewed') {
      summary.reviewedRecordCount += 1;
    }
    if (recordCorrectedPolicies.length) {
      summary.correctedRecordCount += 1;
      summary.correctedPolicyCount += recordCorrectedPolicies.length;
    }
    for (const tag of record.tags || []) {
      if (tag) summary.tags.add(tag);
    }
  }

  const scenarioSummaries = [...scenarioMap.values()]
    .map(summary => ({
      scenarioId: summary.scenarioId,
      scenarioFamily: summary.scenarioFamily,
      recordCount: summary.recordCount,
      reviewedRecordCount: summary.reviewedRecordCount,
      correctedRecordCount: summary.correctedRecordCount,
      correctedPolicyCount: summary.correctedPolicyCount,
      tags: [...summary.tags].sort()
    }))
    .sort((left, right) => left.scenarioId.localeCompare(right.scenarioId));

  const recordDigests = records.map(record => ({
    scenarioId: record?.scenarioId || null,
    recordKind: record?.recordKind || null,
    digest: buildRecordDigest(record)
  }));
  const recordsDigest = digestValue(recordDigests);

  return {
    schemaVersion: 'c2-trace-corpus-manifest-v1',
    scenarioPresetVersion: meta.scenarioPresetVersion || 'c2-audit-scenarios-v1',
    sourceAudit: meta.sourceAudit || 'build-c2-trace-corpus',
    sourceScript: 'scripts/build-c2-trace-corpus.js',
    generatedAt: new Date().toISOString(),
    recordCount: records.length,
    scenarioCount: scenarioSummaries.length,
    scenarioFamilies: [...scenarioFamilies].sort(),
    recordKinds: [...recordKinds].sort(),
    reviewedRecordCount,
    correctedRecordCount,
    correctedPolicyCount,
    contractVersion: meta.contractVersion || null,
    featureSchemaVersion: meta.featureSchemaVersion || null,
    traceSchemaVersion: meta.traceSchemaVersion || null,
    telemetryProfile: meta.telemetryProfile || null,
    recordDigests,
    recordsDigest,
    scenarioSummaries,
    artifactFiles: {
      records: 'corpus-records.json',
      manifest: 'corpus-manifest.json'
    }
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

async function waitForMlModel(page) {
  await page.waitForFunction(() => {
    if (typeof mlInferenceSystem === 'undefined') return false;
    if (!mlInferenceSystem.modelConfig?.useModelInference) return true;
    return !!mlInferenceSystem.modelRuntime?.modelLoaded || !!mlInferenceSystem.modelRuntime?.lastLoadError;
  }, null, { timeout: 15000 });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1800);
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
    telemetrySystem.resetMlCorpusCapture?.();
  });
  await waitForMlModel(page);
  await page.waitForTimeout(900);
}

async function captureGardenScenario(page) {
  await resetBaseline(page);
  return page.evaluate(() => {
    const gameState = gameCore.getGameState();
    const butterfly = gameState.butterflies[0];
    const block = gameState.blocks.find(entry => entry.currentZoneId === butterfly?.currentZoneId) || gameState.blocks[0];
    if (!butterfly || !block) {
      return { ok: false, reason: 'garden-scenario-missing-butterfly-or-block' };
    }

    butterfly.lifeSim.derived = butterfly.lifeSim.derived || {};
    butterfly.lifeSim.derived.behaviorBiases = {
      ...(butterfly.lifeSim.derived.behaviorBiases || {}),
      wanderScale: 0.08,
      feedUrgency: 0.12,
      objectInterest: 0.94,
      shelterSeeking: 0.44,
      displayConfidence: 0.24
    };
    butterfly.lifeSim.objectAwareness = {
      ...(butterfly.lifeSim.objectAwareness || {}),
      focusType: 'block',
      currentAffordance: 'carry',
      blockFamiliarity: 0.96,
      shelterConfidence: 0.72
    };

    butterfly.x = block.x + 6;
    butterfly.y = block.y + 4;
    butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
    butterfly.currentZoneId = block.currentZoneId;
    butterfly.state = 'normal';
    butterfly.zoneTravel = null;
    butterfly.blockInteraction.cooldownFrames = 0;
    butterfly.blockInteraction.targetBlockId = block.id;
    butterfly.checkBlockExperimentation(gameState.blocks);

    if (!butterfly.blockInteraction.carryingBlockId) {
      objectSystem.pickupObject(block.id, butterfly.id);
      if (typeof block.pickupBy === 'function') {
        block.pickupBy(butterfly);
      }
      butterfly.blockInteraction.carryingBlockId = block.id;
    }

    butterfly.blockInteraction.placementTarget = butterfly.chooseBlockPlacementTarget(block, gameState.blocks)
      || butterfly.blockInteraction.placementTarget
      || { x: butterfly.x + 24, y: butterfly.y + 12, zoneId: butterfly.currentZoneId };
    butterfly.blockInteraction.lastPlacementMode = 'ground';

    mlInferenceSystem.update(gameState, 0);
    const record = mlInferenceSystem.buildCorpusRecord(butterfly.id, gameState, {
      scenarioId: 'garden-object-focus',
      scenarioFamily: 'garden',
      auditPhase: 'c2-builder',
      tags: ['block', 'placement', 'reviewed'],
      review: {
        correctedLabels: {
          actionFamily: 'buildOrUseObject',
          targetPreference: 'block'
        },
        rationale: 'Curated carried-block placement scenario with a live block focus and placement target.'
      }
    });

    return {
      ok: !!record,
      record,
      mlCorpusProfile: telemetrySystem.getMlCorpusProfile?.() || null
    };
  });
}

async function captureCommunicationScenario(page) {
  await resetBaseline(page);
  return page.evaluate(() => {
    const gameState = gameCore.getGameState();
    const teacher = gameState.butterflies[0];
    const listener = gameState.butterflies[1];
    const trainingZone = zoneSystem.getZones().find(zone => zone.kind === 'training') || zoneSystem.getZones()[0];
    if (!teacher || !listener || !trainingZone) {
      return { ok: false, reason: 'communication-scenario-missing-actors-or-zone' };
    }

    const center = zoneSystem.getZoneCenter(trainingZone.id) || { x: teacher.x, y: teacher.y };
    teacher.x = center.x;
    teacher.y = center.y;
    teacher.gridPos = gridManager.screenToIso(teacher.x, teacher.y);
    teacher.currentZoneId = trainingZone.id;
    listener.x = center.x + 18;
    listener.y = center.y + 12;
    listener.gridPos = gridManager.screenToIso(listener.x, listener.y);
    listener.currentZoneId = trainingZone.id;

    teacher.lifeSim.social = {
      ...(teacher.lifeSim.social || {}),
      reputation: 14,
      activeContext: 'training-ground'
    };
    teacher.lifeSim.derived = teacher.lifeSim.derived || {};
    teacher.lifeSim.derived.behaviorBiases = {
      ...(teacher.lifeSim.derived.behaviorBiases || {}),
      trainingAffinity: 0.96,
      displayConfidence: 0.72,
      socialConfidence: 0.64,
      caution: 0.18
    };

    eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
      sourceId: teacher.id,
      signalType: 'teaching_signal',
      targetId: listener.id,
      phrase: 'remember this pattern',
      zoneId: trainingZone.id
    });
    communicationSystem.update(gameState, 1 / 60);
    mlInferenceSystem.update(gameState, 0);

    const record = mlInferenceSystem.buildCorpusRecord(teacher.id, gameState, {
      scenarioId: 'communication-teaching-signal',
      scenarioFamily: 'communication',
      auditPhase: 'c2-builder',
      tags: ['training-zone', 'teaching-signal', 'reviewed'],
      review: {
        correctedLabels: {
          actionFamily: 'teach',
          signalChoice: 'teaching'
        },
        rationale: 'Curated training-ground teaching exchange with an explicit teaching signal.'
      }
    });

    return {
      ok: !!record,
      record,
      mlCorpusProfile: telemetrySystem.getMlCorpusProfile?.() || null
    };
  });
}

async function captureEcologyScenario(page) {
  await resetBaseline(page);
  return page.evaluate(() => {
    const gameState = gameCore.getGameState();
    const zones = zoneSystem.getZones();
    const butterfly = gameState.butterflies[0];
    const homeZone = zones[0];
    const awayZone = zones.find(zone => zone.id !== homeZone?.id) || zones[0];
    if (!butterfly || !homeZone || !awayZone) {
      return { ok: false, reason: 'ecology-scenario-missing-butterfly-or-zones' };
    }

    const awayCenter = zoneSystem.getZoneCenter(awayZone.id) || { x: butterfly.x, y: butterfly.y };
    butterfly.x = awayCenter.x;
    butterfly.y = awayCenter.y;
    butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
    butterfly.currentZoneId = awayZone.id;
    butterfly.zoneTravel = {
      targetZoneId: homeZone.id,
      reason: 'migration'
    };
    butterfly.lifeSim.derived = butterfly.lifeSim.derived || {};
    butterfly.lifeSim.derived.behaviorBiases = {
      ...(butterfly.lifeSim.derived.behaviorBiases || {}),
      wanderScale: 0.46,
      feedUrgency: 0.28,
      caution: 0.38,
      shelterSeeking: 0.34
    };

    const migration = lifeSimSystem.ensureMigrationState(butterfly, zones.map(zone => zone.id));
    migration.homeZoneId = homeZone.id;
    migration.homeZoneStrength = 0.84;
    migration.lastObservedZoneId = awayZone.id;
    migration.lastTravelReason = 'migration';
    migration.zoneAffinities[homeZone.id] = 0.92;
    migration.zoneAffinities[awayZone.id] = 0.28;
    migration.zoneVisitCounts[homeZone.id] = 4;
    migration.zoneVisitCounts[awayZone.id] = 1;
    migration.zoneDwellSeconds[homeZone.id] = 120;
    migration.zoneDwellSeconds[awayZone.id] = 18;

    zoneSystem.setZoneEcologyState(awayZone.id, {
      resourceReserve: 0.14,
      habitatQuality: 0.24,
      depletionPressure: 0.82,
      migrationPull: 0.88,
      crowdingPressure: 0.74
    });
    zoneSystem.setZoneEcologyState(homeZone.id, {
      resourceReserve: 0.78,
      habitatQuality: 0.82,
      depletionPressure: 0.22,
      migrationPull: 0.28,
      crowdingPressure: 0.24
    });

    lifeSimSystem.syncMigrationState(butterfly, gameState, { deltaSeconds: 5 });
    const ecologySample = gameCore.buildEcologyTelemetrySample?.();
    if (ecologySample) {
      telemetrySystem.recordEcologySample(gameState, ecologySample);
    }
    mlInferenceSystem.update(gameState, 0);

    const record = mlInferenceSystem.buildCorpusRecord(butterfly.id, gameState, {
      scenarioId: 'ecology-return-home',
      scenarioFamily: 'ecology',
      auditPhase: 'c2-builder',
      tags: ['migration', 'away-from-home', 'resource-pressure'],
      review: {
        rationale: 'Curated migration-pressure ecology scenario with an away-from-home butterfly and contrasting zone ecology states.'
      }
    });

    return {
      ok: !!record,
      record,
      ecologyProfile: telemetrySystem.getEcologyProfile?.() || null,
      mlCorpusProfile: telemetrySystem.getMlCorpusProfile?.() || null
    };
  });
}

async function captureAutobattleScenario(page) {
  await resetBaseline(page);
  return page.evaluate(() => {
    const gameState = gameCore.getGameState();
    const butterflies = gameState.butterflies.slice(0, 4);
    if (butterflies.length < 4) {
      return { ok: false, reason: 'autobattle-scenario-missing-butterflies' };
    }

    rosterSystem.reset(gameState);
    butterflies.slice(0, 2).forEach(entry => rosterSystem.assignToSquad(entry.id, 'alpha', gameState));
    butterflies.slice(2, 4).forEach(entry => rosterSystem.assignToSquad(entry.id, 'beta', gameState));
    const snapshot = gameCore.startRosterBattleSession('alpha', 'beta');
    if (!snapshot?.battleId) {
      return { ok: false, reason: 'autobattle-snapshot-missing' };
    }

    const focusId = snapshot.participantOrder[0];
    const focus = battleSystem.getParticipantSnapshot(snapshot.battleId, focusId);
    const allyId = snapshot.participantOrder.find(id => {
      const candidate = battleSystem.getParticipantSnapshot(snapshot.battleId, id);
      return candidate?.teamId === focus?.teamId && candidate.id !== focus?.id;
    });
    if (!focus || !allyId) {
      gameCore.commitBattleSession?.(snapshot.battleId);
      return { ok: false, reason: 'autobattle-focus-or-ally-missing' };
    }

    battleSystem.modifyParticipantHp(snapshot.battleId, allyId, -28);
    battleSystem.applyPressure(snapshot.battleId, allyId, 4);
    const refreshedFocus = battleSystem.getParticipantSnapshot(snapshot.battleId, focusId);
    refreshedFocus.cognition = refreshedFocus.cognition || {};
    refreshedFocus.cognition.battle = {
      allyPressure: 0.74,
      enemyThreat: 0.36,
      targetPriority: 0.42,
      spacingState: 'crowded',
      retreatPressure: 0.22,
      supportOpportunity: 0.91
    };
    refreshedFocus.actionFamily = 'battlePosture';
    refreshedFocus.actionSubtype = 'steady';
    refreshedFocus.targetId = allyId;

    const record = mlInferenceSystem.buildBattleCorpusRecord(refreshedFocus, snapshot, gameState, {
      scenarioId: 'autobattle-support-window',
      scenarioFamily: 'autobattle',
      auditPhase: 'c2-builder',
      tags: ['support-window', 'battle', 'reviewed'],
      review: {
        correctedLabels: {
          autobattlePosture: 'support'
        },
        rationale: 'Curated battle state with a pressured ally and an explicit support opportunity.'
      }
    });

    gameCore.commitBattleSession?.(snapshot.battleId);
    return {
      ok: !!record,
      record,
      mlCorpusProfile: telemetrySystem.getMlCorpusProfile?.() || null
    };
  });
}

async function buildC2TraceCorpus(options = {}) {
  const outputRoot = options.outputRoot || DEFAULT_OUTPUT_ROOT;
  const sourceAudit = options.sourceAudit || 'build-c2-trace-corpus';
  ensureDir(outputRoot);

  const auditId = stamp();
  const outputDir = path.join(outputRoot, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    sourceAudit,
    outputDir,
    server: null
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
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    const scenarios = [
      await captureGardenScenario(page),
      await captureCommunicationScenario(page),
      await captureEcologyScenario(page),
      await captureAutobattleScenario(page)
    ];

    const failedScenario = scenarios.find(entry => !entry?.ok || !entry?.record);
    if (failedScenario) {
      throw new Error(failedScenario?.reason || 'failed to build one or more c2 trace corpus scenarios');
    }

    const records = scenarios.map(entry => entry.record);
    const telemetryProfile = scenarios[scenarios.length - 1]?.mlCorpusProfile || null;
    const runtimeContract = await page.evaluate(() => mlInferenceSystem.getRuntimeSummary?.()?.contract?.version || null);
    const runtimeFeatureSchema = await page.evaluate(() => mlInferenceSystem.getRuntimeSummary?.()?.featureSchemaVersion || null);
    const runtimeTraceSchema = await page.evaluate(() => mlInferenceSystem.getRuntimeSummary?.()?.traceSchemaVersion || null);

    const manifest = buildCorpusManifest(records, {
      sourceAudit,
      scenarioPresetVersion: 'c2-audit-scenarios-v1',
      contractVersion: runtimeContract,
      featureSchemaVersion: runtimeFeatureSchema,
      traceSchemaVersion: runtimeTraceSchema,
      telemetryProfile
    });

    const recordsPath = path.join(outputDir, 'corpus-records.json');
    const manifestPath = path.join(outputDir, 'corpus-manifest.json');
    fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    const reloadedRecords = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
    const rebuiltManifest = buildCorpusManifest(reloadedRecords, {
      sourceAudit,
      scenarioPresetVersion: manifest.scenarioPresetVersion,
      contractVersion: runtimeContract,
      featureSchemaVersion: runtimeFeatureSchema,
      traceSchemaVersion: runtimeTraceSchema,
      telemetryProfile
    });
    manifest.rebuildCheck = {
      matches: rebuiltManifest.recordsDigest === manifest.recordsDigest,
      rebuiltRecordsDigest: rebuiltManifest.recordsDigest
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    return {
      outputDir,
      recordsPath,
      manifestPath,
      records,
      manifest
    };
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

if (require.main === module) {
  buildC2TraceCorpus()
    .then(result => {
      console.log(JSON.stringify({
        outputDir: result.outputDir,
        recordsPath: result.recordsPath,
        manifestPath: result.manifestPath,
        recordCount: result.manifest.recordCount,
        correctedRecordCount: result.manifest.correctedRecordCount,
        overall: result.manifest.rebuildCheck?.matches ? 'pass' : 'warn'
      }, null, 2));
      if (!result.manifest.rebuildCheck?.matches) {
        process.exitCode = 1;
      }
    })
    .catch(error => {
      console.error(error?.stack || String(error));
      process.exitCode = 1;
    });
}

module.exports = {
  buildC2TraceCorpus,
  buildCorpusManifest
};
