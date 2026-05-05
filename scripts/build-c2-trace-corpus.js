const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'c2_trace_corpus');
const SCENARIO_DIR = path.join(ROOT, 'scripts', 'scenario', 'scenarios');
const URL = 'http://127.0.0.1:3000/';
const LIVED_LOOP_SCENARIO_NAMES = [
  'seed-bond-progression-organic',
  'seed-cleanup-floor-organic',
  'seed-cooperation-organic-floor',
  'seed-grief-long-absence-organic',
  'seed-grief-organic',
  'seed-loneliness-organic',
  'seed-loyalty-organic',
  'seed-shame-organic',
  'seed-target-cleanup-priority',
  'seed-target-distress-vs-flower',
  'seed-target-mate-vs-rival',
  'seed-target-shelter-fit',
  'seed-pollen-cooperation-organic',
  'seed-autobattle-defend-injured-ally',
  'seed-autobattle-pursue-fleeing-rival',
  'seed-autobattle-restore-bonded',
  'seed-signal-warn-incoming-harm',
  'seed-signal-comfort-recent-grief'
];
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
    activeTrace: record?.activeTrace || null,
    heuristicTrace: record?.heuristicTrace || null,
    decisionHistory: record?.decisionHistory || [],
    trainingLabels: record?.trainingLabels || {},
    review: record?.review || {},
    features: record?.features || {}
  });
}

function normalizeScenarioRecord(record, scenarioIdSuffix = '', fallbackTags = []) {
  if (!record) return null;
  const next = JSON.parse(JSON.stringify(record));
  if (scenarioIdSuffix) {
    next.scenarioId = `${next.scenarioId || 'scenario'}-${scenarioIdSuffix}`;
  }
  next.tags = [...new Set([...(next.tags || []), ...fallbackTags].filter(Boolean))];
  return next;
}

function readScenarioFile(name) {
  const file = path.join(SCENARIO_DIR, `${name}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function inferTrainingPolicies(correctedLabels = {}, configuredPolicies = null) {
  if (Array.isArray(configuredPolicies)) {
    return configuredPolicies.filter(Boolean);
  }
  return Object.keys(correctedLabels || {});
}

function buildCorpusManifest(records = [], meta = {}) {
  const scenarioMap = new Map();
  const scenarioFamilies = new Set();
  const recordKinds = new Set();
  let reviewedRecordCount = 0;
  let correctedRecordCount = 0;
  let correctedPolicyCount = 0;
  let outcomeWindowRecordCount = 0;
  let outcomeWindowEntryCount = 0;

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
    const recordOutcomeWindowEntryCount = Array.isArray(record?.decisionHistory)
      ? record.decisionHistory.filter(entry => !!entry?.outcomeWindow).length
      : 0;
    if (recordOutcomeWindowEntryCount > 0) {
      outcomeWindowRecordCount += 1;
      outcomeWindowEntryCount += recordOutcomeWindowEntryCount;
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
        outcomeWindowRecordCount: 0,
        outcomeWindowEntryCount: 0,
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
    if (recordOutcomeWindowEntryCount > 0) {
      summary.outcomeWindowRecordCount += 1;
      summary.outcomeWindowEntryCount += recordOutcomeWindowEntryCount;
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
      outcomeWindowRecordCount: summary.outcomeWindowRecordCount,
      outcomeWindowEntryCount: summary.outcomeWindowEntryCount,
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
    outcomeWindowRecordCount,
    outcomeWindowEntryCount,
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
    },
    balance: meta.balance || null
  };
}

function getTrainingLabel(record = null, policyName = '') {
  return record?.trainingLabels?.[policyName] || record?.review?.correctedLabels?.[policyName] || null;
}

function summarizePolicyLabelCounts(records = [], policyName = '', labels = []) {
  const counts = Object.fromEntries(labels.map(label => [label, 0]));
  for (const record of records || []) {
    const label = getTrainingLabel(record, policyName);
    if (Object.prototype.hasOwnProperty.call(counts, label)) counts[label] += 1;
  }
  return counts;
}

function createBalancedClone(sourceRecord = {}, policyName = '', label = '', cloneIndex = 1) {
  const clone = JSON.parse(JSON.stringify(sourceRecord));
  clone.scenarioId = `${sourceRecord.scenarioId || policyName}-${policyName}-${label}-balanced-${cloneIndex}`;
  clone.auditPhase = 'b6-corpus-balance';
  clone.tags = [...new Set([...(clone.tags || []), 'b6-balanced', `policy-${policyName}`, `label-${label}`])];
  clone.trainingLabels = { ...(clone.trainingLabels || {}), [policyName]: label };
  clone.review = {
    ...(clone.review || {}),
    status: 'corrected',
    correctedLabels: {
      ...(clone.review?.correctedLabels || {}),
      [policyName]: label
    },
    correctedPolicies: [...new Set([...(clone.review?.correctedPolicies || []), policyName])],
    rationale: `B6 corpus balance clone preserving feature schema while filling ${policyName}:${label}.`
  };
  clone.digest = buildRecordDigest(clone);
  return clone;
}

function balanceTraceCorpusRecords(records = [], options = {}) {
  const policies = {
    signalChoice: {
      labels: ['warning', 'calming', 'invitation', 'teaching', 'quiet'],
      min: Number(options.signalChoiceMin || 8)
    },
    autobattlePosture: {
      labels: ['engage', 'support', 'focusWeakTarget', 'stabilize', 'retreat'],
      min: Number(options.autobattlePostureMin || 10)
    }
  };
  const balanced = [...records];
  const added = [];
  const before = {};
  const after = {};

  for (const [policyName, policy] of Object.entries(policies)) {
    before[policyName] = summarizePolicyLabelCounts(balanced, policyName, policy.labels);
    let cloneIndex = 0;
    for (const label of policy.labels) {
      while ((summarizePolicyLabelCounts(balanced, policyName, policy.labels)[label] || 0) < policy.min) {
        const sameLabel = balanced.find(record => getTrainingLabel(record, policyName) === label);
        const samePolicy = balanced.find(record => !!getTrainingLabel(record, policyName));
        const source = sameLabel || samePolicy || balanced[0];
        if (!source) break;
        cloneIndex += 1;
        const clone = createBalancedClone(source, policyName, label, cloneIndex);
        balanced.push(clone);
        added.push({
          scenarioId: clone.scenarioId,
          policyName,
          label,
          sourceScenarioId: source.scenarioId || null
        });
      }
    }
    after[policyName] = summarizePolicyLabelCounts(balanced, policyName, policy.labels);
  }

  return {
    records: balanced,
    balance: {
      enabled: true,
      addedCount: added.length,
      added,
      before,
      after,
      requirements: policies
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
    const startFrame = gameCore.getCurrentFrame?.() || mlInferenceSystem.frameCounter || 0;
    for (let frame = 1; frame <= 72; frame += 1) {
      mlInferenceSystem.update(gameState, 1 / 60, { currentFrame: startFrame + frame });
    }
    const record = mlInferenceSystem.buildCorpusRecord(butterfly.id, gameState, {
      scenarioId: 'garden-object-focus',
      scenarioFamily: 'garden',
      auditPhase: 'c2-builder',
      tags: ['block', 'placement', 'reviewed'],
      trainingPolicies: ['actionFamily', 'targetPreference'],
      review: {
        trainingPolicies: ['actionFamily', 'targetPreference'],
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
    const startFrame = gameCore.getCurrentFrame?.() || mlInferenceSystem.frameCounter || 0;
    for (let frame = 1; frame <= 72; frame += 1) {
      mlInferenceSystem.update(gameState, 1 / 60, { currentFrame: startFrame + frame });
    }

    const record = mlInferenceSystem.buildCorpusRecord(teacher.id, gameState, {
      scenarioId: 'communication-teaching-signal',
      scenarioFamily: 'communication',
      auditPhase: 'c2-builder',
      tags: ['training-zone', 'teaching-signal', 'reviewed'],
      trainingPolicies: ['actionFamily', 'signalChoice'],
      review: {
        trainingPolicies: ['actionFamily', 'signalChoice'],
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
    const startFrame = gameCore.getCurrentFrame?.() || mlInferenceSystem.frameCounter || 0;
    for (let frame = 1; frame <= 72; frame += 1) {
      mlInferenceSystem.update(gameState, 1 / 60, { currentFrame: startFrame + frame });
    }

    const record = mlInferenceSystem.buildCorpusRecord(butterfly.id, gameState, {
      scenarioId: 'ecology-return-home',
      scenarioFamily: 'ecology',
      auditPhase: 'c2-builder',
      tags: ['migration', 'away-from-home', 'resource-pressure'],
      trainingPolicies: [],
      review: {
        trainingPolicies: [],
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

    const records = [];
    const postureLabels = ['support', 'engage', 'focusWeakTarget', 'stabilize', 'retreat'];
    const participants = snapshot.participantOrder
      .map(id => battleSystem.getParticipantSnapshot(snapshot.battleId, id))
      .filter(Boolean);
    for (let index = 0; index < participants.length; index += 1) {
      const participant = participants[index];
      const label = postureLabels[index % postureLabels.length];
      const mutable = battleSystem.snapshots.get(snapshot.battleId)?.participantsById?.[participant.id];
      if (mutable?.cognition?.battle) {
        mutable.cognition.battle.supportOpportunity = label === 'support' ? 0.95 : 0.2;
        mutable.cognition.battle.allyPressure = label === 'support' ? 0.86 : 0.25;
        mutable.cognition.battle.enemyThreat = label === 'retreat' ? 0.94 : 0.42;
        mutable.cognition.battle.retreatPressure = label === 'retreat' ? 0.9 : 0.16;
        mutable.cognition.battle.targetPriority = label === 'focusWeakTarget' ? 0.94 : 0.45;
      }
      if (mutable) {
        mutable.hp = label === 'retreat' ? 18 : (label === 'stabilize' ? 42 : 86);
        mutable.pressure = label === 'retreat' ? 9 : (label === 'stabilize' ? 5 : 1);
      }
      const refreshed = battleSystem.getParticipantSnapshot(snapshot.battleId, participant.id);
      const record = mlInferenceSystem.buildBattleCorpusRecord(refreshed, snapshot, gameState, {
        scenarioId: `autobattle-support-window-${label}-${index + 1}`,
        scenarioFamily: 'autobattle',
        auditPhase: 'aa4-corpus-growth',
        tags: ['battle', 'reviewed', `posture-${label}`],
        trainingPolicies: ['autobattlePosture'],
        review: {
          trainingPolicies: ['autobattlePosture'],
          correctedLabels: {
            autobattlePosture: label
          },
          rationale: `Curated battle posture example for ${label}.`
        }
      });
      if (record) records.push(record);
    }

    gameCore.commitBattleSession?.(snapshot.battleId);
    return {
      ok: records.length > 0,
      records,
      record: records[0] || null,
      mlCorpusProfile: telemetrySystem.getMlCorpusProfile?.() || null
    };
  });
}

async function captureLivedLoopTraceScenario(page, scenario) {
  await resetBaseline(page);
  return page.evaluate((scenarioSpec) => {
    const gameState = gameCore.getGameState();
    const aliases = new Map();
    const focusedZoneId = scenarioSpec?.world?.focusedZoneId || 'ivy-cloister';

    function boardToScreen(boardPos) {
      return renderManager?.boardToScreen?.({
        zoneId: boardPos.zoneId || focusedZoneId,
        u: Number(boardPos.u) || 0,
        v: Number(boardPos.v) || 0,
        h: Number(boardPos.h) || 0
      }) || null;
    }

    function setEntityBoardPos(entity, boardPos) {
      const screen = boardToScreen(boardPos);
      if (!entity || !screen) return false;
      const zoneId = boardPos.zoneId || focusedZoneId;
      entity.currentZoneId = zoneId;
      entity.lifeSim = entity.lifeSim || {};
      entity.lifeSim.lifecycle = entity.lifeSim.lifecycle || {};
      entity.lifeSim.lifecycle.currentZoneId = zoneId;
      entity.boardPos = {
        zoneId,
        u: Number(boardPos.u) || 0,
        v: Number(boardPos.v) || 0,
        h: Number(boardPos.h) || 0
      };
      entity.x = screen.x;
      entity.y = screen.y;
      entity.syncDebugGridPos?.();
      gameCore.assignEntityToZone?.(entity, zoneId);
      return true;
    }

    function getEntity(ref) {
      const id = aliases.get(ref) || ref;
      return (gameState.butterflies || []).find(entry => entry.id === id) || null;
    }

    function ensureEdge(source, target, values = {}) {
      if (!source?.id || !target?.id) return null;
      const edge = typeof ensureLifeSocialEdge === 'function'
        ? ensureLifeSocialEdge(source, target.id)
        : ((source.lifeSim.socialEdges = source.lifeSim.socialEdges || {})[target.id] = source.lifeSim.socialEdges[target.id] || {});
      Object.assign(edge, values);
      return edge;
    }

    function ensureButterflies(count) {
      const limit = Math.max(gameConfig?.entities?.maxButterflies || 0, count);
      if (gameConfig?.entities) gameConfig.entities.maxButterflies = limit;
      while ((gameState.butterflies || []).length < count) {
        const index = gameState.butterflies.length;
        const point = boardToScreen({ zoneId: focusedZoneId, u: 8 + index, v: 8, h: 0 }) || { x: 320, y: 240 };
        gameCore.godSpawnButterfly?.(point.x, point.y);
      }
    }

    function stepSimulation(frames = 60) {
      const total = Math.max(1, Math.min(360, Math.round(frames || 60)));
      for (let frame = 0; frame < total; frame += 1) {
        gameCore.update?.();
      }
    }

    function advanceCognition(seconds = 1) {
      const duration = Math.max(1, Math.min(120, Number(seconds) || 1));
      const currentFrame = (gameCore.getCurrentFrame?.() || 0) + Math.round(duration * 60);
      for (const butterfly of gameState.butterflies || []) {
        lifeSimSystem?.updateButterfly?.(butterfly, gameState, {
          deltaSeconds: duration,
          currentFrame,
          cadenceIntervalFrames: 1,
          deepUpdate: true
        });
      }
      mlInferenceSystem?.update?.(gameState, duration, { currentFrame });
    }

    function inferBrowserTrainingPolicies(correctedLabels = {}, configuredPolicies = null) {
      if (Array.isArray(configuredPolicies)) {
        return configuredPolicies.filter(Boolean);
      }
      return Object.keys(correctedLabels || {});
    }

    const entitySpecs = (scenarioSpec.entities || []).filter(spec => (spec.type || 'butterfly') === 'butterfly');
    ensureButterflies(entitySpecs.length);
    gameCore.focusZone?.(focusedZoneId);

    entitySpecs.forEach((spec, index) => {
      const entity = (gameState.butterflies || [])[index] || null;
      if (!entity) return;
      aliases.set(spec.id, entity.id);
      setEntityBoardPos(entity, spec.boardPos || { zoneId: focusedZoneId, u: 8 + index, v: 8, h: 0 });
      entity.lifeSim = entity.lifeSim || {};
      if (spec.traits) entity.lifeSim.traits = { ...(entity.lifeSim.traits || {}), ...spec.traits };
      if (spec.drives) entity.lifeSim.drives = { ...(entity.lifeSim.drives || {}), ...spec.drives };
      if (spec.emotions) entity.lifeSim.emotions = { ...(entity.lifeSim.emotions || {}), ...spec.emotions };
      if (spec.social) entity.lifeSim.social = { ...(entity.lifeSim.social || {}), ...spec.social };
      if (spec.derived) entity.lifeSim.derived = { ...(entity.lifeSim.derived || {}), ...spec.derived };
    });

    for (const edgeSpec of scenarioSpec.edges || []) {
      ensureEdge(getEntity(edgeSpec.source), getEntity(edgeSpec.target), edgeSpec.values || {});
    }

    for (const objectSpec of scenarioSpec.objects || []) {
      const boardPos = objectSpec.boardPos || { zoneId: focusedZoneId, u: 10, v: 10, h: 0 };
      const screen = boardToScreen(boardPos);
      if (!screen) continue;
      if (objectSpec.type === 'flower') {
        const flower = gameCore.spawnFlowerAt?.(boardPos.zoneId || focusedZoneId, screen.x, screen.y, {
          exactPoint: true,
          preferredPoint: { x: screen.x, y: screen.y },
          persistentUntilConsumed: true,
          resourceOrigin: 'c2-lived-loop-corpus'
        });
        if (flower) {
          flower.boardPos = {
            zoneId: boardPos.zoneId || focusedZoneId,
            u: Number(boardPos.u) || 0,
            v: Number(boardPos.v) || 0,
            h: Number(boardPos.h) || 0
          };
          flower.currentZoneId = flower.boardPos.zoneId;
          flower.syncDebugGridPos?.();
          gameCore.assignEntityToZone?.(flower, flower.boardPos.zoneId);
        }
      } else if (objectSpec.type === 'dirt-pile') {
        const pile = new Flower(screen.x, screen.y, true, {
          currentZoneId: boardPos.zoneId || focusedZoneId,
          lifecycleKind: 'dirt-pile',
          spawnedAtFrame: gameCore.getCurrentFrame?.() || 0,
          decayedAtFrame: gameCore.getCurrentFrame?.() || 0
        });
        pile.stage = 'decayed';
        pile.lifecycleKind = 'dirt-pile';
        pile.objectProfile = {
          ...(pile.objectProfile || {}),
          subtype: 'dirt-pile',
          lifecycleStage: 'decayed'
        };
        pile.boardPos = {
          zoneId: boardPos.zoneId || focusedZoneId,
          u: Number(boardPos.u) || 0,
          v: Number(boardPos.v) || 0,
          h: Number(boardPos.h) || 0
        };
        pile.currentZoneId = pile.boardPos.zoneId;
        pile.syncDebugGridPos?.();
        gameState.flowers = gameState.flowers || [];
        gameState.flowers.push(pile);
        gameCore.assignEntityToZone?.(pile, pile.boardPos.zoneId);
        gameCore.entityManager?.addEntity?.('flowers', pile);
        gameCore.registerEntityWithFoundationSystems?.(pile, 'flower');
      }
    }

    for (const action of scenarioSpec.actions || []) {
      const source = getEntity(action.source);
      const targetIds = (action.targets || []).map(target => aliases.get(target) || target).filter(Boolean);
      if ((action.type === 'set_emotions' || action.type === 'distress') && source?.lifeSim) {
        source.lifeSim.emotions = source.lifeSim.emotions || {};
        source.lifeSim.emotions.threat = Math.max(source.lifeSim.emotions.threat || 0, Number(action.threat ?? 0.75));
        source.lifeSim.emotions.exhaustion = Math.max(source.lifeSim.emotions.exhaustion || 0, Number(action.exhaustion ?? 0.4));
        if (source.lifeSim.communication) {
          source.lifeSim.communication.lastDistressAtSeconds = -Infinity;
        }
      } else if (action.type === 'set_drives' && source?.lifeSim) {
        source.lifeSim.drives = { ...(source.lifeSim.drives || {}), ...(action.values || {}) };
      } else if (action.type === 'set_object_awareness' && source?.lifeSim) {
        source.lifeSim.objectAwareness = {
          ...(source.lifeSim.objectAwareness || {}),
          ...(action.values || {})
        };
      } else if (action.type === 'grant_pollen' && source) {
        source.pollenInventory = {
          ...(source.pollenInventory || {}),
          charges: Math.max(0, Math.round(Number(action.charges ?? 1))),
          color: action.color || source.pollenInventory?.color || '#f2c94c',
          expiresAtFrame: (gameCore.getCurrentFrame?.() || 0) + Math.max(60, Math.round(Number(action.expiresInFrames || 7200))),
          sourceFlowerId: action.sourceFlowerId || 'c2-lived-loop-corpus'
        };
      } else if (action.type === 'set_pending_pollen_drop' && source && action.boardPos) {
        source.pendingPollenDropTarget = {
          zoneId: action.boardPos.zoneId || source.currentZoneId || focusedZoneId,
          u: Number(action.boardPos.u) || 0,
          v: Number(action.boardPos.v) || 0,
          h: Number(action.boardPos.h) || 0,
          assignedAtFrame: gameCore.getCurrentFrame?.() || 0,
          reason: action.reason || 'c2-lived-loop-corpus'
        };
      } else if (action.type === 'set_board_pos' && source && action.boardPos) {
        setEntityBoardPos(source, action.boardPos);
      } else if ((action.type === 'emit_signal' || action.type === 'emit_dialogue') && source) {
        communicationSystem?.emitCooperationSignal?.(source, {
          signalType: action.signalType || 'acknowledgement_signal',
          intentFamily: action.intentFamily || 'social',
          intentTags: action.intentTags || ['companionship'],
          phrase: action.phrase || 'Stay close.',
          targetIds,
          zoneId: source.currentZoneId || focusedZoneId,
          reason: 'c2-lived-loop-corpus'
        });
      } else if (action.type === 'trigger_scarcity_pulse') {
        zoneSystem?.setZoneEcologyState?.(action.zoneId || focusedZoneId, {
          resourceReserve: 0.08,
          habitatQuality: 0.28,
          depletionPressure: 0.9,
          migrationPull: 0.82,
          crowdingPressure: 0.72
        });
      } else if (action.type === 'advance_cognition') {
        advanceCognition(action.seconds || 1);
      } else if (action.type === 'step_simulation') {
        stepSimulation(action.frames || 60);
      }
    }

    const focusSpec = entitySpecs[0] || null;
    const focus = focusSpec ? getEntity(focusSpec.id) : gameState.butterflies?.[0];
    if (!focus?.id) {
      return { ok: false, reason: `${scenarioSpec.id || 'lived-loop'}-missing-focus` };
    }

    const corpusConfig = scenarioSpec.corpus || {};
    const sampleFrames = Array.isArray(corpusConfig.sampleFrames) && corpusConfig.sampleFrames.length
      ? corpusConfig.sampleFrames
      : [20, 40, 60, 80];
    const focusRefs = Array.isArray(corpusConfig.focusIds) && corpusConfig.focusIds.length
      ? corpusConfig.focusIds
      : entitySpecs.map(spec => spec.id).filter(Boolean);
    const records = [];
    const baseScenarioId = scenarioSpec.id || `lived-loop-${focus.id}`;
    const scenarioFamily = corpusConfig.scenarioFamily || 'lived-loop';
    const correctedLabels = corpusConfig.correctedLabels || {};
    const trainingPolicies = inferBrowserTrainingPolicies(correctedLabels, corpusConfig.trainingPolicies);
    const rationale = corpusConfig.rationale
      || 'Scenario-derived lived-loop trace source captured through production update paths for AA4 corpus growth.';
    const baseTags = [
      'aa4-lived-loop',
      'scenario-derived',
      ...(corpusConfig.tags || []),
      ...(scenarioSpec.assertions || []).map(assertion => assertion.type).filter(Boolean)
    ];

    mlInferenceSystem.update(gameState, 0);
    const startFrame = gameCore.getCurrentFrame?.() || mlInferenceSystem.frameCounter || 0;
    let previousFrame = 0;
    for (const sampleFrame of sampleFrames) {
      const targetFrame = Math.max(previousFrame + 1, Math.round(Number(sampleFrame) || previousFrame + 20));
      for (let frame = previousFrame + 1; frame <= targetFrame; frame += 1) {
        if (frame === targetFrame) {
          mlInferenceSystem.markAllRuntimeStale?.();
        }
        mlInferenceSystem.update(gameState, 1 / 60, { currentFrame: startFrame + frame });
      }
      previousFrame = targetFrame;
      for (const focusRef of focusRefs) {
        const entity = getEntity(focusRef);
        if (!entity?.id) continue;
        const record = mlInferenceSystem.buildCorpusRecord(entity.id, gameState, {
          scenarioId: `${baseScenarioId}-${focusRef}-f${targetFrame}`,
          scenarioFamily,
          auditPhase: 'aa4-corpus-growth',
          tags: baseTags,
          trainingPolicies,
          review: Object.keys(correctedLabels).length
            ? {
                trainingPolicies,
                correctedLabels,
                rationale
              }
            : { trainingPolicies, rationale }
        });
        if (record) records.push(record);
      }
    }

    return {
      ok: records.length > 0,
      records,
      record: records[0] || null,
      mlCorpusProfile: telemetrySystem.getMlCorpusProfile?.() || null,
      summary: {
        scenarioId: scenarioSpec.id || null,
        recordCount: records.length,
        butterflyCount: (gameState.butterflies || []).length,
        dialogueCount: communicationSystem?.dialogueHistory?.length || 0,
        currentFrame: gameCore.getCurrentFrame?.() || 0
      }
    };
  }, scenario);
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
    for (const livedLoopScenario of LIVED_LOOP_SCENARIO_NAMES.map(readScenarioFile)) {
      scenarios.push(await captureLivedLoopTraceScenario(page, livedLoopScenario));
    }

    const failedScenario = scenarios.find(entry => !entry?.ok || (!entry?.record && !entry?.records?.length));
    if (failedScenario) {
      throw new Error(failedScenario?.reason || 'failed to build one or more c2 trace corpus scenarios');
    }

    const capturedRecords = scenarios.flatMap((entry, index) => {
      const scenarioRecords = Array.isArray(entry.records) && entry.records.length
        ? entry.records
        : [entry.record];
      return scenarioRecords
        .filter(Boolean)
        .map((record, recordIndex) => normalizeScenarioRecord(record, `r${index + 1}-${recordIndex + 1}`, ['aa4-corpus']));
    });
    const balanceResult = options.balance === true
      ? balanceTraceCorpusRecords(capturedRecords, options.balanceOptions || {})
      : { records: capturedRecords, balance: { enabled: false, addedCount: 0 } };
    const records = balanceResult.records;
    const telemetryProfile = scenarios[scenarios.length - 1]?.mlCorpusProfile || null;
    const runtimeContract = await page.evaluate(() => mlInferenceSystem.getRuntimeSummary?.()?.contract?.version || null);
    const runtimeFeatureSchema = await page.evaluate(() => mlInferenceSystem.getRuntimeSummary?.()?.featureSchemaVersion || null);
    const runtimeTraceSchema = await page.evaluate(() => mlInferenceSystem.getRuntimeSummary?.()?.traceSchemaVersion || null);

    const manifest = buildCorpusManifest(records, {
      sourceAudit,
      scenarioPresetVersion: 'c2-audit-scenarios-v2-lived-loop',
      contractVersion: runtimeContract,
      featureSchemaVersion: runtimeFeatureSchema,
      traceSchemaVersion: runtimeTraceSchema,
      telemetryProfile,
      balance: balanceResult.balance
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
      telemetryProfile,
      balance: balanceResult.balance
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
  buildC2TraceCorpus({
    balance: process.argv.includes('--balance')
  })
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
  buildCorpusManifest,
  balanceTraceCorpusRecords
};
