const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'long_soak_generational_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];

function createConfig(mode = 'smoke') {
  return mode === 'full'
    ? {
        mode: 'full',
        timeScale: 32,
        seeds: ['long-soak-a', 'long-soak-b', 'long-soak-c'],
        checkpointRealMs: [0, 15000, 30000, 45000],
        roundTripCheckpointIndexes: [1, 3],
        battleCheckpointIndexes: [2]
      }
    : {
        mode: 'smoke',
        timeScale: 20,
        seeds: ['smoke-soak-a'],
        checkpointRealMs: [0, 4000, 8000],
        roundTripCheckpointIndexes: [1, 2],
        battleCheckpointIndexes: [1]
      };
}

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
  await page.waitForTimeout(1800);
}

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
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
  });
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && state.butterflies?.length >= 4 && state.flowers?.length >= 4;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

function collectSoakSummary({ label }) {
  const state = gameCore.getGameState();
  const replay = gameCore.getReplayMetadata?.() || null;
  const telemetry = gameCore.getTelemetrySnapshot?.() || null;
  const ecologyTelemetry = telemetry?.lastEcologySample || null;
  const zoneIds = gameCore.getZoneIds?.() || [];
  const butterflies = (state.butterflies || []).filter(Boolean);
  const living = butterflies.filter(entry => !(typeof entry.isDead === 'function' && entry.isDead()));
  const hybrids = living.filter(entry => entry.birthSource === 'bred' || entry.isHybrid || entry.hybridEntryId);
  const wild = living.filter(entry => !hybrids.includes(entry));
  const flowers = state.flowers || [];
  const blocks = state.blocks || [];
  const journal = Array.isArray(state.hybridJournal) ? state.hybridJournal : [];
  const mutationJournalEntries = journal.filter(entry => entry?.mutationProfile?.mutatedTraits?.length);
  const liveMutants = living.filter(entry =>
    !!(entry?.mutationProfile?.mutatedTraits?.length || entry?.lifeSim?.genetics?.mutationProfile?.mutatedTraits?.length)
  );
  const shelterUsers = living.filter(entry => {
    const spatial = entry?.lifeSim?.spatialAwareness || {};
    return spatial.structureRole === 'shelter' || spatial.insideShelter === true;
  });
  const carriedBlocks = blocks.filter(entry => !!entry?.carriedById);
  const stackedBlocks = blocks.filter(entry => (entry?.stackIndex || 0) > 0);
  const currentReleaseBatch = progressionManager.getCurrentReleaseBatchSummary?.(state) || { count: 0, nextWaveRemaining: 10 };
  const latestReleaseCohort = progressionManager.getReleaseCohortSummary?.(state) || null;
  const unlockedTypes = progressionManager.getUnlockedTypes?.(state, { allowGolden: true }) || [];
  const unlockHistory = Array.isArray(state.unlockHistory) ? state.unlockHistory : [];
  const sameTypeCompletedTypes = Object.entries(state.perTypeUnlockStatus || {})
    .filter(([, status]) => !!status?.sameTypeChildCompleted)
    .map(([type]) => type);
  const wildProgressEntries = Object.values(state.perWildButterflyProgress || {});
  const battleStateCount = Object.keys(state.roster?.lastBattleStates || {}).length;
  const mlSourceCounts = {
    actionModel: 0,
    actionFallback: 0,
    targetModel: 0,
    targetFallback: 0,
    signalModel: 0,
    signalFallback: 0,
    riskModel: 0,
    riskFallback: 0,
    battleModel: 0,
    battleFallback: 0
  };
  const recentDecisionExamples = [];
  for (const butterfly of living) {
    const trace = mlInferenceSystem?.getEntityTrace?.(butterfly.id) || null;
    const actionSource = trace?.traces?.actionFamily?.source || 'none';
    const targetSource = trace?.traces?.targetPreference?.source || 'none';
    const signalSource = trace?.traces?.signalChoice?.source || 'none';
    const riskSource = trace?.traces?.riskPosture?.source || 'none';
    const battleSource = trace?.traces?.autobattlePosture?.source || 'none';
    mlSourceCounts[actionSource === 'ml' ? 'actionModel' : 'actionFallback'] += 1;
    mlSourceCounts[targetSource === 'ml' ? 'targetModel' : 'targetFallback'] += 1;
    mlSourceCounts[signalSource === 'ml' ? 'signalModel' : 'signalFallback'] += 1;
    mlSourceCounts[riskSource === 'ml' ? 'riskModel' : 'riskFallback'] += 1;
    mlSourceCounts[battleSource === 'ml' ? 'battleModel' : 'battleFallback'] += 1;
    if (recentDecisionExamples.length < 5 && trace?.chosenPath) {
      recentDecisionExamples.push({
        id: butterfly.id,
        action: trace.chosenPath.actionFamily || null,
        target: trace.chosenPath.targetPreference || null,
        signal: trace.chosenPath.signalChoice || null,
        risk: trace.chosenPath.riskPosture || null,
        battle: trace.chosenPath.autobattlePosture || null
      });
    }
  }

  const overlapPairs = [];
  for (let i = 0; i < living.length; i += 1) {
    for (let j = i + 1; j < living.length; j += 1) {
      const left = living[i];
      const right = living[j];
      if ((left.currentZoneId || null) !== (right.currentZoneId || null)) continue;
      if (left.zoneTravel || right.zoneTravel) continue;
      const distance = Math.hypot((left.x || 0) - (right.x || 0), (left.y || 0) - (right.y || 0));
      if (distance > 2.5) continue;
      overlapPairs.push({
        leftId: left.id,
        rightId: right.id,
        zoneId: left.currentZoneId || null,
        distance: Number(distance.toFixed(3))
      });
      if (overlapPairs.length >= 10) break;
    }
    if (overlapPairs.length >= 10) break;
  }

  const orphanCarriedBlocks = carriedBlocks
    .filter(block => !living.some(entry => entry.id === block.carriedById))
    .map(block => block.id);
  const shelterContradictions = shelterUsers
    .filter(entry => entry?.lifeSim?.spatialAwareness?.insideShelter && !entry?.lifeSim?.spatialAwareness?.canUseInterior)
    .map(entry => entry.id);
  const goldenUnlockedWithoutPrereqs =
    unlockedTypes.includes('golden') &&
    progressionManager.getRequiredGoldenUnlockTypes?.().some(type => !unlockedTypes.includes(type));
  const duplicateHybridEntryIds = Array.from(
    journal.reduce((acc, entry) => {
      const id = entry?.id;
      if (id == null) return acc;
      acc.counts[id] = (acc.counts[id] || 0) + 1;
      return acc;
    }, { counts: {} }).counts
  ).filter(([, count]) => count > 1).map(([id]) => Number(id));
  const zoneEcology = zoneIds.map(zoneId => {
    const zoneFlowers = flowers.filter(entry => (gameCore.getEntityZoneId?.(entry, null) || entry.currentZoneId || null) === zoneId);
    const zoneButterflies = living.filter(entry => (gameCore.getEntityZoneId?.(entry, null) || entry.currentZoneId || null) === zoneId);
    const normalFlowers = zoneFlowers.filter(entry => entry.occupancyState === 'normal' && entry.stage !== 'dissolve').length;
    const ecology = gameCore.getZoneEcologySummary?.(zoneId) || {};
    const targets = gameCore.getZoneFlowerSpawnTargets?.(zoneId, {
      flowers: zoneFlowers,
      butterflies: zoneButterflies
    }) || {};
    return {
      zoneId,
      identityLabel: ecology.identityLabel || ecology.label || zoneId,
      signatureLabel: ecology.signatureLabel || null,
      headline: ecology.headline || null,
      normalFlowers,
      totalFlowers: zoneFlowers.length,
      butterflyCount: zoneButterflies.length,
      floorTarget: targets.floorTarget || 1,
      resourceReserve: ecology.resourceReserve || 0,
      recoveryFloor: ecology.recoveryFloor || 0,
      habitatQuality: ecology.habitatQuality || 0,
      depletionPressure: ecology.depletionPressure || 0,
      migrationPull: ecology.migrationPull || 0,
      crowdingPressure: ecology.crowdingPressure || 0,
      socialValence: ecology.socialValence || 0,
      trainingValence: ecology.trainingValence || 0,
      recoveryPressure: ecology.recoveryPressure || 0
    };
  });
  const zoneFloorViolations = zoneEcology
    .filter(entry => entry.normalFlowers < entry.floorTarget || entry.resourceReserve + 0.001 < entry.recoveryFloor)
    .map(entry => ({
      zoneId: entry.zoneId,
      normalFlowers: entry.normalFlowers,
      floorTarget: entry.floorTarget,
      resourceReserve: entry.resourceReserve,
      recoveryFloor: entry.recoveryFloor
    }));
  const migrationProfiles = living
    .map(entry => ({
      currentZoneId: gameCore.getEntityZoneId?.(entry, null) || entry.currentZoneId || null,
      migration: entry?.lifeSim?.migration || null
    }))
    .filter(entry => !!entry.migration);
  const homeAnchoredCount = migrationProfiles.filter(entry => !!entry.migration?.homeZoneId).length;
  const settledHomeCount = migrationProfiles.filter(entry => {
    const homeZoneId = entry.migration?.homeZoneId || null;
    return !!homeZoneId && homeZoneId === entry.currentZoneId;
  }).length;
  const awayFromHomeCount = migrationProfiles.filter(entry => {
    const homeZoneId = entry.migration?.homeZoneId || null;
    return !!homeZoneId && homeZoneId !== entry.currentZoneId;
  }).length;
  const activeTravelerCount = living.filter(entry => !!entry?.zoneTravel?.targetZoneId).length;
  const multiZoneCount = migrationProfiles.filter(entry =>
    Object.values(entry.migration?.zoneVisitCounts || {}).filter(value => (value || 0) > 0).length >= 2
  ).length;
  const completedTravelCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.completedTravelCount || 0), 0);
  const homeReturnCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.homeReturnCount || 0), 0);
  const scoutingTripCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.scoutingTripCount || 0), 0);
  const latestWaveWilds = latestReleaseCohort?.cohortId
    ? wild.filter(entry => {
        const progress = progressionManager.getWildProgress?.(state, entry);
        return progress?.releaseCohortId === latestReleaseCohort.cohortId;
      })
    : [];
  const readableWaveWildCount = latestWaveWilds.reduce((sum, entry) => {
    const profile = statProfileSystem.getEntityProfile?.(entry, state);
    return sum + (((profile?.display?.ecologyLines || []).length >= 1) ? 1 : 0);
  }, 0);
  const distinctIdentityCount = new Set(zoneEcology.map(entry => entry.identityLabel).filter(Boolean)).size;
  const distinctSignatureCount = new Set(zoneEcology.map(entry => entry.signatureLabel).filter(Boolean)).size;

  return {
    label,
    recordedAtIso: new Date().toISOString(),
    frame: typeof frameCount === 'number' ? frameCount : null,
    replay,
    telemetry,
    population: {
      livingButterflies: living.length,
      wildButterflies: wild.length,
      bredButterflies: hybrids.length,
      flowers: flowers.length,
      eggs: flowers.filter(entry => entry.occupancyState === 'egg').length,
      chrysalis: flowers.filter(entry => entry.occupancyState === 'chrysalis').length,
      caterpillars: state.caterpillars?.length || 0,
      blocks: blocks.length,
      stackedBlocks: stackedBlocks.length,
      carriedBlocks: carriedBlocks.length,
      shelterUsers: shelterUsers.length
    },
    genetics: {
      hybridJournalCount: journal.length,
      liveMutants: liveMutants.length,
      journalMutants: mutationJournalEntries.length,
      recentLineages: journal.slice(0, 5).map(entry => ({
        id: entry.id,
        name: entry.name,
        inheritedAbility: entry.inheritedAbility || null,
        mutationSignature: entry.mutationProfile?.signature || null,
        parentA: entry.parentA?.personalityType || entry.parentA?.baseType || null,
        parentB: entry.parentB?.personalityType || entry.parentB?.baseType || null
      }))
    },
    progression: {
      unlockedTypes,
      unlockedTypeCount: unlockedTypes.length,
      unlockHistoryCount: unlockHistory.length,
      goldenUnlocked: !!progressionManager.isGoldenUnlocked?.(state),
      orderedUnlocks: unlockHistory.map(entry => entry?.type).filter(Boolean),
      sameTypeCompletedTypes,
      sameTypeCompletedWildCount: wildProgressEntries.filter(entry => entry?.sameTypeChildCompleted).length,
      hybridDepartureQueuedCount: wildProgressEntries.filter(entry => entry?.permanentDepartureQueued).length
    },
    cognition: {
      mlSourceCounts,
      recentDecisionExamples,
      performanceProfile: telemetry?.mlRuntime || null
    },
    battle: {
      activeBattleId: state.activeBattleId || null,
      viewMode: state.viewMode,
      rosterLastBattleCount: battleStateCount
    },
    ecology: {
      zoneEcology,
      identity: {
        distinctIdentityCount,
        distinctSignatureCount
      },
      migration: {
        livingCount: living.length,
        homeAnchoredCount,
        settledHomeCount,
        awayFromHomeCount,
        activeTravelerCount,
        multiZoneCount,
        completedTravelCount,
        homeReturnCount,
        scoutingTripCount
      },
      releaseFeedback: {
        totalReleases: Math.max(0, state.totalReleases || 0),
        currentBatchCount: Math.max(0, currentReleaseBatch.count || 0),
        nextWaveRemaining: Math.max(0, currentReleaseBatch.nextWaveRemaining ?? 10),
        releaseHistoryCount: Array.isArray(state.releaseHistory) ? state.releaseHistory.length : 0,
        latestCohortId: latestReleaseCohort?.cohortId ?? null,
        latestPreferredZoneId: latestReleaseCohort?.preferredZoneId || null,
        latestBlendGuard: latestReleaseCohort?.blendGuard || 0,
        latestTopLineages: (latestReleaseCohort?.topLineages || []).map(entry => entry.id),
        latestWaveWildCount: latestWaveWilds.length,
        readableWaveWildCount
      },
      telemetry: ecologyTelemetry,
      telemetryProfile: telemetry?.ecology || null
    },
    anomalies: {
      overlapPairs,
      orphanCarriedBlocks,
      shelterContradictions,
      goldenUnlockedWithoutPrereqs,
      battleLeak: !!state.activeBattleId && state.viewMode !== 'battle',
      duplicateHybridEntryIds,
      zoneFloorViolations
    }
  };
}

function buildRoundTripSignature(summary) {
  return {
    replaySeed: summary?.replay?.seed ?? null,
    livingButterflies: summary?.population?.livingButterflies ?? null,
    wildButterflies: summary?.population?.wildButterflies ?? null,
    bredButterflies: summary?.population?.bredButterflies ?? null,
    hybridJournalCount: summary?.genetics?.hybridJournalCount ?? null,
    liveMutants: summary?.genetics?.liveMutants ?? null,
    journalMutants: summary?.genetics?.journalMutants ?? null,
    unlockedTypeCount: summary?.progression?.unlockedTypeCount ?? null,
    unlockHistoryCount: summary?.progression?.unlockHistoryCount ?? null,
    unlockedTypes: (summary?.progression?.unlockedTypes || []).slice().sort(),
    goldenUnlocked: !!summary?.progression?.goldenUnlocked,
    totalReleases: summary?.ecology?.releaseFeedback?.totalReleases ?? null,
    currentBatchCount: summary?.ecology?.releaseFeedback?.currentBatchCount ?? null,
    releaseHistoryCount: summary?.ecology?.releaseFeedback?.releaseHistoryCount ?? null,
    latestCohortId: summary?.ecology?.releaseFeedback?.latestCohortId ?? null,
    activeBattleId: summary?.battle?.activeBattleId || null,
    rosterLastBattleCount: summary?.battle?.rosterLastBattleCount ?? null
  };
}

function diffRoundTrip(beforeSummary, afterSummary) {
  const before = buildRoundTripSignature(beforeSummary);
  const after = buildRoundTripSignature(afterSummary);
  const mismatches = [];
  for (const key of Object.keys(before)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      mismatches.push({
        key,
        before: before[key],
        after: after[key]
      });
    }
  }
  return {
    pass: mismatches.length === 0,
    before,
    after,
    mismatches
  };
}

async function configureSeed(page, seedInput, timeScale) {
  return page.evaluate(async ({ seedInput, timeScale }) => {
    window.__longSoakStimulus = {
      generation1AdultIds: [],
      generation2AdultIds: [],
      generation1LifecycleLabels: [],
      generation2LifecycleLabels: [],
      forcedMutationSignatures: [],
      unlockedTypesSeen: [],
      releaseCohortIds: [],
      migrationReturnTargets: {},
      lastActions: []
    };
    gameCore.reseedReplaySession(seedInput, {
      newSession: true,
      markerLabel: 'long-soak-seed'
    });
    await gameCore.resetGame(true);
    gameCore.reseedReplaySession(seedInput, {
      newSession: false,
      markerLabel: 'long-soak-seed-ready'
    });
    gameCore.getGameState().timeScale = timeScale;
    gameCore.resume?.();
    return {
      replay: gameCore.getReplayMetadata?.() || null,
      timeScale: gameCore.getGameState().timeScale
    };
  }, { seedInput, timeScale });
}

async function runStimulusCheckpoint(page, checkpointIndex, mode) {
  return page.evaluate(({ checkpointIndex, mode }) => {
    const state = gameCore.getGameState();
    const stimulus = window.__longSoakStimulus = window.__longSoakStimulus || {
      generation1AdultIds: [],
      generation2AdultIds: [],
      generation1LifecycleLabels: [],
      generation2LifecycleLabels: [],
      forcedMutationSignatures: [],
      unlockedTypesSeen: [],
      releaseCohortIds: [],
      migrationReturnTargets: {},
      lastActions: []
    };

    const actions = [];
    const particleSystem = state.particleSystem || gameCore?.particleSystem || null;
    const zoneIds = gameCore.getZoneIds?.() || [];

    const getZoneId = entity =>
      entity?.currentZoneId ||
      entity?.lifeSim?.lifecycle?.currentZoneId ||
      entity?.lifecycleData?.currentZoneId ||
      gameCore.getFocusedZoneId?.() ||
      null;

    const assignZone = (entity, zoneId) => {
      if (!entity || !zoneId) return;
      if (typeof gameCore.assignEntityToZone === 'function') {
        gameCore.assignEntityToZone(entity, zoneId);
      } else {
        entity.currentZoneId = zoneId;
        if (entity.lifeSim?.lifecycle) {
          entity.lifeSim.lifecycle.currentZoneId = zoneId;
        }
      }
    };

    const ensureZoneFlowers = (zoneId, minimumCount, preferredPoint = null) => {
      let created = 0;
      const getZoneFlowers = () => (state.flowers || []).filter(flower => getZoneId(flower) === zoneId);
      while (getZoneFlowers().length < minimumCount) {
        const zoneFlowers = getZoneFlowers();
        const point = gameCore.findValidFlowerPosition?.(zoneFlowers, zoneId, {
          preferredPoint,
          maxAttempts: 24,
          minDistance: 24
        }) || gameCore.clampPlacementPoint?.(
          preferredPoint?.x ?? 400,
          preferredPoint?.y ?? 300,
          8
        ) || {
          x: preferredPoint?.x ?? 400,
          y: preferredPoint?.y ?? 300
        };
        const flower = new Flower(point.x, point.y, false, {
          currentZoneId: zoneId,
          flowerType: gameCore.choosePreferredFlowerTypeForZone?.(zoneId, frameCount) || null
        });
        flower.stage = 'mature';
        flower.stageTimer = 0;
        flower.persistentUntilConsumed = true;
        assignZone(flower, zoneId);
        state.flowers.push(flower);
        created += 1;
      }
      return created;
    };

    const livingAdults = () => (state.butterflies || []).filter(entry => !(typeof entry.isDead === 'function' && entry.isDead()));

    const getMigrationAggregate = () => {
      const living = livingAdults();
      const migrationProfiles = living
        .map(entry => ({
          id: entry.id,
          currentZoneId: getZoneId(entry),
          migration: entry?.lifeSim?.migration || null,
          zoneTravel: entry?.zoneTravel || null
        }))
        .filter(entry => !!entry.migration);
      const completedTravelCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.completedTravelCount || 0), 0);
      const homeReturnCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.homeReturnCount || 0), 0);
      const multiZoneCount = migrationProfiles.filter(entry =>
        Object.values(entry.migration?.zoneVisitCounts || {}).filter(value => (value || 0) > 0).length >= 2
      ).length;
      return {
        completedTravelCount,
        homeReturnCount,
        multiZoneCount
      };
    };

    const pickPartner = (sourceButterfly, candidates) => {
      const targetZoneId = getZoneId(sourceButterfly);
      const filtered = candidates.filter(entry =>
        entry.id !== sourceButterfly.id &&
        entry.sex !== sourceButterfly.sex &&
        (entry.fertilityUsesRemaining === Infinity || (entry.fertilityUsesRemaining || 0) > 0) &&
        !(entry.pregnancy?.active)
      );
      filtered.sort((left, right) => {
        const leftZoneBias = getZoneId(left) === targetZoneId ? 0 : 1;
        const rightZoneBias = getZoneId(right) === targetZoneId ? 0 : 1;
        if (leftZoneBias !== rightZoneBias) return leftZoneBias - rightZoneBias;
        return (left.readinessScore || 0) - (right.readinessScore || 0);
      });
      return filtered[0] || null;
    };

    const pickBreedingPair = options => {
      const adults = livingAdults();
      const eligible = adults.filter(entry =>
        (entry.fertilityUsesRemaining === Infinity || (entry.fertilityUsesRemaining || 0) > 0) &&
        !(entry.pregnancy?.active)
      );
      let pool = eligible;
      if (options?.preferBred) {
        const bredPool = eligible.filter(entry => entry.birthSource === 'bred');
        if (bredPool.length) {
          pool = bredPool;
        }
      }
      if (options?.preferMutant) {
        const mutantPool = pool.filter(entry => !!(entry.mutationProfile?.mutatedTraits?.length || entry.lifeSim?.genetics?.mutationProfile?.mutatedTraits?.length));
        if (mutantPool.length) {
          pool = mutantPool;
        }
      }
      const females = pool.filter(entry => entry.sex === 'F');
      const males = eligible.filter(entry => entry.sex === 'M');
      const firstFemale = females[0] || eligible.find(entry => entry.sex === 'F') || null;
      if (!firstFemale) return null;
      const partner = pickPartner(firstFemale, males.length ? males : eligible);
      if (!partner) return null;
      return {
        female: firstFemale,
        male: partner
      };
    };

    const forcePositionsNearZoneCenter = (female, male, zoneId) => {
      const anchor = gameCore.findValidFlowerPosition?.(state.flowers || [], zoneId, {
        maxAttempts: 20,
        minDistance: 16
      }) || gameCore.clampPlacementPoint?.(400, 320, 8) || { x: 400, y: 320 };
      assignZone(female, zoneId);
      assignZone(male, zoneId);
      female.x = anchor.x - 8;
      female.y = anchor.y;
      male.x = anchor.x + 8;
      male.y = anchor.y;
    };

    const chooseLifecycleZoneId = preferredZoneId => {
      const rankedZones = zoneIds.map(zoneId => {
        ensureZoneFlowers(zoneId, Math.max(6, breedingSystem.minZoneFlowersForBreeding || 0));
        const stats = breedingSystem.getZoneStats?.(state, zoneId) || {};
        const zonePressure = breedingSystem.getZonePopulationPressure?.(zoneId, state) || 0;
        const supportsOffspring = breedingSystem.canZoneSupportOffspring?.(zoneId, state) !== false;
        return {
          zoneId,
          supportsOffspring,
          availableFlowers: stats.availableFlowers || 0,
          residentButterflies: stats.residentButterflies || 0,
          pendingReservations: stats.pendingReservations || 0,
          zonePressure,
          preferred: zoneId === preferredZoneId ? 1 : 0
        };
      }).sort((left, right) => {
        if (left.supportsOffspring !== right.supportsOffspring) {
          return left.supportsOffspring ? -1 : 1;
        }
        if (left.availableFlowers !== right.availableFlowers) {
          return right.availableFlowers - left.availableFlowers;
        }
        if (left.zonePressure !== right.zonePressure) {
          return left.zonePressure - right.zonePressure;
        }
        if (left.residentButterflies !== right.residentButterflies) {
          return left.residentButterflies - right.residentButterflies;
        }
        if (left.pendingReservations !== right.pendingReservations) {
          return left.pendingReservations - right.pendingReservations;
        }
        if (left.preferred !== right.preferred) {
          return right.preferred - left.preferred;
        }
        return String(left.zoneId).localeCompare(String(right.zoneId));
      });

      return rankedZones[0]?.zoneId || preferredZoneId || gameCore.getFocusedZoneId?.() || null;
    };

    const createReleasableHybrids = (zoneId, count, batchLabel) => {
      const createdIds = [];
      const anchor = gameCore.findValidFlowerPosition?.(state.flowers || [], zoneId, {
        maxAttempts: 24,
        minDistance: 18
      }) || gameCore.clampPlacementPoint?.(400, 320, 8) || { x: 400, y: 320 };
      const lineageSets = [
        ['friendly', 'wise'],
        ['cautious', 'skittish'],
        ['friendly', 'cautious'],
        ['wise', 'energetic']
      ];
      for (let index = 0; index < count; index += 1) {
        const lineageTypes = lineageSets[index % lineageSets.length];
        const hybrid = new Butterfly(
          anchor.x + ((index % 5) - 2) * 16,
          anchor.y + (Math.floor(index / 5) * 18),
          null,
          false,
          'hybrid',
          {
            currentZoneId: zoneId,
            birthSource: 'bred',
            sex: index % 2 === 0 ? 'F' : 'M',
            hybridGenome: {
              audit: 'long-soak-release',
              batchLabel,
              index,
              heritage: { lineageTypes }
            },
            customTraits: {
              speed: 1.28 + ((index % 3) * 0.02),
              jitteriness: 1.04 + ((index % 2) * 0.03),
              trustPropensity: 1.14,
              trustSpeed: 1.1,
              scareThreshold: 4.46 + ((index % 2) * 0.06),
              happinessBonus: 1.12
            },
            isHybrid: true
          }
        );
        assignZone(hybrid, zoneId);
        state.butterflies.push(hybrid);
        createdIds.push(hybrid.id);
      }
      return createdIds;
    };

    const createAndReleaseHybrids = (zoneId, count, batchLabel) => {
      const createdIds = createReleasableHybrids(zoneId, count, batchLabel);
      const result = gameCore.releaseButterflies(createdIds, { zoneId });
      const latestCohort = progressionManager.getReleaseCohortSummary?.(state) || null;
      if (latestCohort?.cohortId && !stimulus.releaseCohortIds.includes(latestCohort.cohortId)) {
        stimulus.releaseCohortIds.push(latestCohort.cohortId);
      }
      return {
        createdIds,
        result,
        cohortId: latestCohort?.cohortId ?? null,
        currentBatchCount: progressionManager.getCurrentReleaseBatchSummary?.(state)?.count || 0
      };
    };

    const startMigrationPass = ({ reason, count, onlyAwayFromHome = false }) => {
      const living = livingAdults();
      const before = getMigrationAggregate();
      const available = living.filter(entry => {
        if (!entry?.id || entry.zoneTravel) return false;
        if (entry.pregnancy?.active) return false;
        const migration = entry?.lifeSim?.migration || {};
        const currentZoneId = getZoneId(entry);
        if (!currentZoneId) return false;
        if (onlyAwayFromHome) {
          const recordedReturnZoneId = stimulus.migrationReturnTargets?.[entry.id] || null;
          return !!recordedReturnZoneId && recordedReturnZoneId !== currentZoneId;
        }
        return true;
      });

      const sorted = available.sort((left, right) => {
        const leftZone = getZoneId(left);
        const rightZone = getZoneId(right);
        const leftCrowding = gameCore.getZoneEcologySummary?.(leftZone)?.crowdingPressure || 0;
        const rightCrowding = gameCore.getZoneEcologySummary?.(rightZone)?.crowdingPressure || 0;
        return rightCrowding - leftCrowding || String(left.id).localeCompare(String(right.id));
      });

      const started = [];
      for (const butterfly of sorted) {
        if (started.length >= count) break;
        const currentZoneId = getZoneId(butterfly);
        const migration = butterfly?.lifeSim?.migration || {};
        const preferredTargetZoneId = reason === 'return-home'
          ? (stimulus.migrationReturnTargets?.[butterfly.id] || migration.homeZoneId || null)
          : zoneIds
              .filter(zoneId => zoneId && zoneId !== currentZoneId)
              .sort((left, right) => {
                const leftSummary = gameCore.getZoneEcologySummary?.(left) || {};
                const rightSummary = gameCore.getZoneEcologySummary?.(right) || {};
                const leftScore = (leftSummary.migrationPull || 0) + (leftSummary.foodRichness || 0) * 0.3 + (leftSummary.habitatQuality || 0) * 0.2;
                const rightScore = (rightSummary.migrationPull || 0) + (rightSummary.foodRichness || 0) * 0.3 + (rightSummary.habitatQuality || 0) * 0.2;
                return rightScore - leftScore;
              })[0] || null;
        if (!preferredTargetZoneId || preferredTargetZoneId === currentZoneId) continue;
        const startedOk = gameCore.startZoneTravel?.(butterfly, preferredTargetZoneId, reason);
        if (!startedOk) continue;
        started.push({
          butterflyId: butterfly.id,
          fromZoneId: currentZoneId,
          targetZoneId: preferredTargetZoneId
        });
        if (reason === 'scouting') {
          stimulus.migrationReturnTargets[butterfly.id] = currentZoneId;
        }
      }

      return {
        reason,
        started,
        startedCount: started.length,
        expectedCompletedTravelCount: before.completedTravelCount + started.length,
        expectedHomeReturnCount: before.homeReturnCount + (reason === 'return-home' ? started.length : 0),
        expectedMultiZoneCount: Math.max(before.multiZoneCount, started.length > 0 ? 1 : before.multiZoneCount)
      };
    };

    const triggerLifecycle = ({ preferBred = false, preferMutant = false, forceMutation = false, forceMajor = false, label }) => {
      breedingSystem.ensureState(state);
      const pair = pickBreedingPair({ preferBred, preferMutant });
      if (!pair) {
        return { ok: false, reason: 'no-breeding-pair', label };
      }

      const preferredZoneId = getZoneId(pair.female) || getZoneId(pair.male) || gameCore.getFocusedZoneId?.() || null;
      const zoneId = chooseLifecycleZoneId(preferredZoneId);
      ensureZoneFlowers(zoneId, 6, { x: pair.female.x, y: pair.female.y });
      forcePositionsNearZoneCenter(pair.female, pair.male, zoneId);

      breedingSystem.startMating(pair.female, pair.male);
      breedingSystem.completeMating(pair.female, pair.male, state, particleSystem);
      if (!pair.female.pregnancy?.active) {
        return { ok: false, reason: 'pregnancy-not-created', label };
      }

      if (forceMutation) {
        pair.female.pregnancy.lifecycleData = breedingSystem.createLifecycleData(pair.female, pair.male, {
          forceMutation: true,
          forceMajor,
          mutatedTraitCount: 2
        });
      }

      const lifecycleData = pair.female.pregnancy.lifecycleData;
      const targetFlower = pair.female.pregnancy.targetFlower || breedingSystem.findNearestFlowerForEgg(pair.female, state.flowers);
      if (!targetFlower) {
        pair.female.pregnancy = null;
        return { ok: false, reason: 'no-target-flower', label };
      }

      pair.female.x = targetFlower.x;
      pair.female.y = targetFlower.y;
      breedingSystem.layEggAndFeed(pair.female, targetFlower);

      if (forceMutation && lifecycleData?.mutationProfile?.signature) {
        stimulus.forcedMutationSignatures.push(lifecycleData.mutationProfile.signature);
      }

      return {
        ok: true,
        label,
        zoneId,
        motherId: pair.female.id,
        fatherId: pair.male.id,
        flowerId: targetFlower.id,
        mutationSignature: lifecycleData?.mutationProfile?.signature || null,
        childSex: lifecycleData?.childSex || null
      };
    };

    const accelerateLifecycle = label => {
      breedingSystem.hatchAllEggs(state);
      let fedCount = 0;
      let chrysalisCount = 0;
      for (const caterpillar of [...(state.caterpillars || [])]) {
        if (typeof caterpillar.isDead === 'function' && caterpillar.isDead()) continue;
        const zoneId = getZoneId(caterpillar) || gameCore.getFocusedZoneId?.() || null;
        ensureZoneFlowers(zoneId, 6, { x: caterpillar.x, y: caterpillar.y });

        const foodFlower = (state.flowers || []).find(flower =>
          getZoneId(flower) === zoneId &&
          flower.occupancyState === 'normal' &&
          flower.stage !== 'dissolve'
        );
        if (foodFlower) {
          caterpillar.targetFlower = foodFlower;
          caterpillar.phase = 'seekingFood';
          caterpillar.onReachFlower(state);
          fedCount += 1;
        }

        const chrysalisFlower = (state.flowers || []).find(flower =>
          getZoneId(flower) === zoneId &&
          flower.occupancyState === 'normal' &&
          flower.stage !== 'dissolve'
        );
        if (chrysalisFlower) {
          caterpillar.targetFlower = chrysalisFlower;
          caterpillar.phase = 'seekingChrysalis';
          caterpillar.onReachFlower(state);
          chrysalisCount += 1;
        }
      }

      state.caterpillars = (state.caterpillars || []).filter(entry => !(typeof entry.isDead === 'function' && entry.isDead()));
      const beforeIds = new Set(livingAdults().map(entry => entry.id));
      breedingSystem.hatchAllCocoons(state);
      const afterAdults = livingAdults();
      const newAdults = afterAdults.filter(entry => !beforeIds.has(entry.id) && entry.birthSource === 'bred');
      return {
        label,
        fedCount,
        chrysalisCount,
        newAdultIds: newAdults.map(entry => entry.id),
        newAdultMutationSignatures: newAdults.map(entry => entry.mutationProfile?.signature || null).filter(Boolean)
      };
    };

    const unlockedNow = progressionManager.getUnlockedTypes?.(state, { allowGolden: true }) || [];
    stimulus.unlockedTypesSeen = Array.from(new Set([...(stimulus.unlockedTypesSeen || []), ...unlockedNow]));
    actions.push({
      type: 'progression-state',
      unlockedNow
    });

    if (checkpointIndex === 0) {
      const lifecycle = triggerLifecycle({
        label: 'generation-1',
        forceMutation: true,
        forceMajor: mode === 'full'
      });
      actions.push({
        type: 'generation-1-start',
        ...lifecycle
      });
      if (lifecycle.ok) {
        stimulus.generation1LifecycleLabels.push(lifecycle.label);
      }
    } else if (checkpointIndex === 1) {
      const accelerated = accelerateLifecycle('generation-1-hatch');
      actions.push({
        type: 'generation-1-hatch',
        ...accelerated
      });
      for (const id of accelerated.newAdultIds) {
        if (!stimulus.generation1AdultIds.includes(id)) {
          stimulus.generation1AdultIds.push(id);
        }
      }
      const releaseZoneId = getZoneId(livingAdults()[0]) || gameCore.getFocusedZoneId?.() || null;
      if (releaseZoneId) {
        actions.push({
          type: 'release-wave-seeding',
          ...createAndReleaseHybrids(releaseZoneId, 10, 'cohort-a')
        });
      }
      actions.push({
        type: 'migration-scout-wave',
        ...startMigrationPass({
          reason: 'scouting',
          count: mode === 'full' ? 4 : 3
        })
      });
    } else if (checkpointIndex === 2) {
      const lifecycle = triggerLifecycle({
        label: 'generation-2',
        preferBred: true,
        preferMutant: true,
        forceMutation: false
      });
      actions.push({
        type: 'generation-2-start',
        ...lifecycle
      });
      if (lifecycle.ok) {
        stimulus.generation2LifecycleLabels.push(lifecycle.label);
      }
      const releaseZoneId = getZoneId(livingAdults()[0]) || gameCore.getFocusedZoneId?.() || null;
      if (releaseZoneId) {
        actions.push({
          type: 'release-batch-progress',
          ...createAndReleaseHybrids(releaseZoneId, 2, 'batch-b')
        });
      }
      actions.push({
        type: 'migration-return-wave',
        ...startMigrationPass({
          reason: 'return-home',
          count: mode === 'full' ? 3 : 2,
          onlyAwayFromHome: true
        })
      });
    } else {
      const accelerated = accelerateLifecycle('generation-2-hatch');
      actions.push({
        type: 'generation-2-hatch',
        ...accelerated
      });
      for (const id of accelerated.newAdultIds) {
        if (!stimulus.generation2AdultIds.includes(id)) {
          stimulus.generation2AdultIds.push(id);
        }
      }
    }

    stimulus.lastActions = actions;
    return {
      checkpointIndex,
      actions,
      generation1AdultIds: [...stimulus.generation1AdultIds],
      generation2AdultIds: [...stimulus.generation2AdultIds],
      forcedMutationSignatures: [...stimulus.forcedMutationSignatures],
      unlockedTypesSeen: [...stimulus.unlockedTypesSeen],
      releaseCohortIds: [...stimulus.releaseCohortIds]
    };
  }, { checkpointIndex, mode });
}

async function runBattleExercise(page) {
  const start = await page.evaluate(() => {
    const state = gameCore.getGameState();
    state.roster.memberIds = [];
    const sorted = rosterSystem.sortBattleEntities([...(state.butterflies || [])], state);
    const desiredRosterSize = Math.min(4, Math.max(2, Math.floor((state.butterflies?.length || 0) / 2)));
    const rosterIds = sorted.slice(0, desiredRosterSize).map(entry => entry.id);
    for (const id of rosterIds) {
      if (!state.roster.memberIds.includes(id)) {
        rosterSystem.toggleMember(id, state);
      }
    }

    const preview = gameCore.buildSinglePlayerAutoBattlePreview();
    if (!preview?.canStart) {
      return {
        started: false,
        reason: 'preview-cannot-start',
        preview: {
          canStart: !!preview?.canStart,
          teamSize: preview?.teamSize || 0,
          playerCount: preview?.playerTeamIds?.length || 0,
          opponentCount: preview?.opponentTeamIds?.length || 0
        }
      };
    }

    const snapshot = gameCore.startSinglePlayerAutoBattleSession();
    if (snapshot?.battleId) {
      battleSystem.cycleAutoBattleSpeed?.(snapshot.battleId);
      battleSystem.cycleAutoBattleSpeed?.(snapshot.battleId);
    }
    return {
      started: !!snapshot,
      battleId: snapshot?.battleId || null,
      preview: {
        canStart: !!preview?.canStart,
        teamSize: preview?.teamSize || 0,
        playerTeamIds: preview?.playerTeamIds || [],
        opponentTeamIds: preview?.opponentTeamIds || [],
        playerAverageReady: preview?.playerAverageReady || 0,
        opponentAverageReady: preview?.opponentAverageReady || 0
      }
    };
  });

  if (!start.started || !start.battleId) {
    return {
      pass: false,
      details: start
    };
  }

  await page.waitForFunction(() => {
    const state = gameCore.getGameState();
    if (!state.activeBattleId) return false;
    const snapshot = battleSystem.getSnapshot(state.activeBattleId);
    return !!snapshot?.result;
  }, null, { timeout: 30000 });

  const committed = await page.evaluate(() => {
    const activeBattleId = gameCore.getGameState().activeBattleId;
    const snapshot = battleSystem.getSnapshot(activeBattleId);
    const committed = gameCore.commitBattleSession(activeBattleId);
    return {
      activeBattleId,
      hadResult: !!snapshot?.result,
      winnerTeamId: snapshot?.result?.winnerTeamId || null,
      committed: !!committed,
      finalViewMode: gameCore.getGameState().viewMode,
      finalActiveBattleId: gameCore.getGameState().activeBattleId
    };
  });

  return {
    pass:
      !!committed.committed &&
      committed.hadResult &&
      committed.finalViewMode === 'focused-garden' &&
      !committed.finalActiveBattleId,
    details: {
      start,
      committed
    }
  };
}

async function settleMigrationStimulus(page, stimulus, timeoutMs = 15000) {
  const migrationActions = (stimulus?.actions || []).filter(action =>
    action?.type === 'migration-scout-wave' || action?.type === 'migration-return-wave'
  );
  if (!migrationActions.length) return null;

  const expectedButterflyIds = migrationActions.flatMap(action =>
    (action?.started || []).map(entry => entry?.butterflyId).filter(Boolean)
  );
  if (!expectedButterflyIds.length) {
    return {
      waited: false,
      expectedButterflyIds: [],
      observed: null
    };
  }

  const expectedCompletedTravelCount = migrationActions.reduce((max, action) =>
    Math.max(max, action?.expectedCompletedTravelCount || 0), 0);
  const expectedHomeReturnCount = migrationActions.reduce((max, action) =>
    Math.max(max, action?.expectedHomeReturnCount || 0), 0);
  const expectedMultiZoneCount = migrationActions.reduce((max, action) =>
    Math.max(max, action?.expectedMultiZoneCount || 0), 0);

  const observeSettlement = () => page.evaluate(({ expectedButterflyIds }) => {
    const living = (gameCore.getGameState()?.butterflies || []).filter(entry => !(typeof entry.isDead === 'function' && entry.isDead()));
    const migrationProfiles = living
      .map(entry => ({
        id: entry.id,
        currentZoneId: gameCore.getEntityZoneId?.(entry, null) || entry.currentZoneId || null,
        migration: entry?.lifeSim?.migration || null,
        zoneTravel: entry?.zoneTravel || null
      }))
      .filter(entry => !!entry.migration);
    return {
      completedTravelCount: migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.completedTravelCount || 0), 0),
      homeReturnCount: migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.homeReturnCount || 0), 0),
      multiZoneCount: migrationProfiles.filter(entry =>
        Object.values(entry.migration?.zoneVisitCounts || {}).filter(value => (value || 0) > 0).length >= 2
      ).length,
      settledTravelers: migrationProfiles
        .filter(entry => expectedButterflyIds.includes(entry.id))
        .map(entry => ({
          butterflyId: entry.id,
          currentZoneId: entry.currentZoneId,
          activeTravel: !!entry.zoneTravel
        }))
    };
  }, { expectedButterflyIds });

  try {
    await page.waitForFunction(({ expectedButterflyIds, expectedCompletedTravelCount, expectedHomeReturnCount, expectedMultiZoneCount }) => {
      const living = (gameCore.getGameState()?.butterflies || []).filter(entry => !(typeof entry.isDead === 'function' && entry.isDead()));
      const migrationProfiles = living
        .map(entry => ({
          id: entry.id,
          migration: entry?.lifeSim?.migration || null,
          zoneTravel: entry?.zoneTravel || null
        }))
        .filter(entry => !!entry.migration);
      const completedTravelCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.completedTravelCount || 0), 0);
      const homeReturnCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.homeReturnCount || 0), 0);
      const multiZoneCount = migrationProfiles.filter(entry =>
        Object.values(entry.migration?.zoneVisitCounts || {}).filter(value => (value || 0) > 0).length >= 2
      ).length;
      const settledIds = expectedButterflyIds.filter(id =>
        migrationProfiles.some(entry => entry.id === id && !entry.zoneTravel)
      );
      return (
        settledIds.length === expectedButterflyIds.length
        && completedTravelCount >= expectedCompletedTravelCount
        && homeReturnCount >= expectedHomeReturnCount
        && multiZoneCount >= expectedMultiZoneCount
      );
    }, {
      expectedButterflyIds,
      expectedCompletedTravelCount,
      expectedHomeReturnCount,
      expectedMultiZoneCount
    }, { timeout: timeoutMs });

    return {
      waited: true,
      timedOut: false,
      observed: await observeSettlement()
    };
  } catch (error) {
    return {
      waited: false,
      timedOut: true,
      error: error.message,
      observed: await observeSettlement()
    };
  }
}

async function performRoundTrip(page, label) {
  const roundTripState = await page.evaluate(() => {
    const state = gameCore.getGameState();
    const snapshot = {
      previousPaused: !!state.paused,
      previousTimeScale: state.timeScale ?? 1
    };
    state.paused = true;
    state.timeScale = 0;
    return snapshot;
  });
  const before = await page.evaluate(collectSoakSummary, { label: `${label}-before-roundtrip` });
  const restored = await page.evaluate(() => {
    gameCore.saveGameToStorage({ source: 'long-soak-audit' });
    return !!gameCore.loadGameFromStorage();
  });
  const after = await page.evaluate(collectSoakSummary, { label: `${label}-after-roundtrip` });
  await page.evaluate(({ previousPaused, previousTimeScale }) => {
    const state = gameCore.getGameState();
    state.timeScale = previousTimeScale;
    state.paused = previousPaused;
  }, roundTripState);
  const comparison = diffRoundTrip(before, after);
  return {
    restored,
    ...comparison
  };
}

async function runSeed(page, report, rootDir, seedInput, seedIndex, config) {
  const seedLabel = `seed-${seedIndex + 1}`;
  const seedDir = path.join(rootDir, seedLabel);
  ensureDir(seedDir);
  await resetBaseline(page);
  const seedSetup = await configureSeed(page, seedInput, config.timeScale);

  const seedReport = {
    seedInput,
    normalizedSeed: seedSetup?.replay?.seed ?? null,
    timeScale: seedSetup?.timeScale ?? config.timeScale,
    checkpoints: [],
    battleExercises: [],
    overall: 'pending'
  };

  let elapsed = 0;
  for (let checkpointIndex = 0; checkpointIndex < config.checkpointRealMs.length; checkpointIndex += 1) {
    const targetElapsed = config.checkpointRealMs[checkpointIndex];
    const deltaWait = Math.max(0, targetElapsed - elapsed);
    if (deltaWait > 0) {
      await page.waitForTimeout(deltaWait);
      elapsed = targetElapsed;
    }

    const checkpointLabel = `${seedLabel}-cp${checkpointIndex + 1}`;
    await page.evaluate(({ checkpointLabel, elapsed }) => {
      gameCore.recordReplayMarker?.(checkpointLabel, { elapsedRealMs: elapsed });
    }, { checkpointLabel, elapsed });

    const stimulus = await runStimulusCheckpoint(page, checkpointIndex, config.mode);
    const migrationSettlement = await settleMigrationStimulus(page, stimulus);

    let battleExercise = null;
    if (config.battleCheckpointIndexes.includes(checkpointIndex)) {
      battleExercise = await runBattleExercise(page);
    }

    const summary = await page.evaluate(collectSoakSummary, { label: checkpointLabel });
    const screenshot = await saveShot(page, seedDir, checkpointLabel);
    let roundTrip = null;
    if (config.roundTripCheckpointIndexes.includes(checkpointIndex)) {
      roundTrip = await performRoundTrip(page, checkpointLabel);
    }

    seedReport.checkpoints.push({
      checkpointIndex,
      elapsedRealMs: elapsed,
      label: checkpointLabel,
      pass: !roundTrip || roundTrip.pass,
      stimulus,
      migrationSettlement,
      screenshot,
      summary,
      roundTrip
    });

    if (battleExercise) {
      seedReport.battleExercises.push({
        checkpointIndex,
        ...battleExercise
      });
    }
  }

  const checkpointSummaries = seedReport.checkpoints.map(entry => entry.summary || {});
  const maxHybridJournalCount = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.genetics?.hybridJournalCount || 0), 0);
  const maxBredButterflies = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.population?.bredButterflies || 0), 0);
  const maxLiveMutants = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.genetics?.liveMutants || 0), 0);
  const maxJournalMutants = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.genetics?.journalMutants || 0), 0);
  const maxCompletedTravelCount = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.ecology?.migration?.completedTravelCount || 0), 0);
  const maxHomeAnchoredCount = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.ecology?.migration?.homeAnchoredCount || 0), 0);
  const maxHomeReturnCount = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.ecology?.migration?.homeReturnCount || 0), 0);
  const maxMultiZoneCount = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.ecology?.migration?.multiZoneCount || 0), 0);
  const maxReleaseHistoryCount = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.ecology?.releaseFeedback?.releaseHistoryCount || 0), 0);
  const maxReadableWaveWildCount = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.ecology?.releaseFeedback?.readableWaveWildCount || 0), 0);
  const maxWaveWildCount = checkpointSummaries.reduce((max, summary) =>
    Math.max(max, summary?.ecology?.releaseFeedback?.latestWaveWildCount || 0), 0);
  const mlModelObserved = checkpointSummaries.some(summary => {
    const counts = summary?.cognition?.mlSourceCounts || {};
    return (counts.actionModel || 0) >= 1
      && (counts.targetModel || 0) >= 1
      && (counts.signalModel || 0) >= 1
      && (counts.riskModel || 0) >= 1;
  });
  const sustainedCheckpointSummaries = checkpointSummaries.slice(1);
  const mlRuntimeStayedLive = sustainedCheckpointSummaries.every(summary => {
    const profile = summary?.cognition?.performanceProfile || null;
    return !!profile
      && profile.modelLoaded === true
      && profile.useModelInference === true
      && (profile.gardenSampleCount || 0) >= 1;
  });
  const totalAnomalyCount = checkpointSummaries.reduce((sum, summary) => {
    const anomalies = summary?.anomalies || {};
    return sum
      + (anomalies.orphanCarriedBlocks?.length || 0)
      + (anomalies.shelterContradictions?.length || 0)
      + (anomalies.zoneFloorViolations?.length || 0)
      + (anomalies.duplicateHybridEntryIds?.length || 0)
      + (anomalies.goldenUnlockedWithoutPrereqs ? 1 : 0)
      + (anomalies.battleLeak ? 1 : 0);
  }, 0);

  const requiredJournalCount = config.mode === 'full' ? 2 : 1;
  seedReport.assertions = {
    roundTripsPass: seedReport.checkpoints.every(entry => entry.pass),
    producedBreedingLineage: config.mode === 'full'
      ? (maxHybridJournalCount >= requiredJournalCount && maxBredButterflies >= 1)
      : (maxBredButterflies >= 1),
    recordedMutation: config.mode === 'full'
      ? (maxJournalMutants >= 1)
      : ((maxJournalMutants >= 1) || (maxLiveMutants >= 1)),
    ecologyIdentityReadable: checkpointSummaries.every(summary =>
      (summary?.ecology?.identity?.distinctIdentityCount || 0) >= 4
      && (summary?.ecology?.identity?.distinctSignatureCount || 0) >= 4
    ),
    migrationHealthObserved:
      maxCompletedTravelCount >= 1
      && maxHomeAnchoredCount >= 2
      && maxMultiZoneCount >= 1
      && maxHomeReturnCount >= 1,
    mlModelObserved,
    mlRuntimeStayedLive,
    releaseFeedbackObserved: maxReleaseHistoryCount >= 1 && maxWaveWildCount >= 2 && maxReadableWaveWildCount >= 2,
    ecologyFloorsHold: checkpointSummaries.every(summary => (summary?.anomalies?.zoneFloorViolations?.length || 0) === 0),
    noCriticalAnomalies: totalAnomalyCount === 0,
    battleExercisesPass: seedReport.battleExercises.every(entry => entry.pass)
  };
  seedReport.overall = Object.values(seedReport.assertions).every(Boolean) ? 'pass' : 'fail';
  report.seeds.push(seedReport);
  return seedReport;
}

async function run(options = {}) {
  const mode = options.mode || (process.argv.includes('--full') ? 'full' : 'smoke');
  const config = options.config || createConfig(mode);
  const outputRoot = options.outputRoot || OUTPUT_ROOT;
  ensureDir(outputRoot);
  const auditId = stamp();
  const outputDir = path.join(outputRoot, auditId);
  const videoDir = path.join(outputDir, 'video');
  ensureDir(outputDir);
  ensureDir(videoDir);

  const report = {
    auditId,
    mode: config.mode,
    config: {
      timeScale: config.timeScale,
      checkpointRealMs: config.checkpointRealMs,
      roundTripCheckpointIndexes: config.roundTripCheckpointIndexes,
      battleCheckpointIndexes: config.battleCheckpointIndexes,
      seedCount: config.seeds.length
    },
    startedAt: new Date().toISOString(),
    url: URL,
    server: null,
    seeds: [],
    pageErrors: [],
    consoleErrors: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let page;

  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      recordVideo: {
        dir: videoDir,
        size: { width: 1600, height: 900 }
      }
    });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(error?.stack || String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    for (let seedIndex = 0; seedIndex < config.seeds.length; seedIndex += 1) {
      await runSeed(page, report, outputDir, config.seeds[seedIndex], seedIndex, config);
    }

    report.summary = {
      passingSeeds: report.seeds.filter(entry => entry.overall === 'pass').length,
      totalSeeds: report.seeds.length,
      totalCheckpoints: report.seeds.reduce((sum, entry) => sum + entry.checkpoints.length, 0),
      totalRoundTrips: report.seeds.reduce(
        (sum, entry) => sum + entry.checkpoints.filter(checkpoint => checkpoint.roundTrip).length,
        0
      ),
      totalReportedOverlapPairs: report.seeds.reduce(
        (sum, entry) => sum + entry.checkpoints.reduce(
          (inner, checkpoint) => inner + (checkpoint.summary?.anomalies?.overlapPairs?.length || 0),
          0
        ),
        0
      ),
      pageErrors: report.pageErrors.length,
      consoleErrors: report.consoleErrors.length
    };

    report.overall = report.seeds.every(entry => entry.overall === 'pass')
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    report.finishedAt = new Date().toISOString();
    report.reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
    if (page) {
      try {
        await page.close();
      } catch {}
    }
    if (context) {
      try {
        await context.close();
      } catch {}
    }
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }

  return report;
}

if (require.main === module) {
  run().then(report => {
    console.log(JSON.stringify({
      reportPath: report.reportPath,
      overall: report.overall
    }, null, 2));
    process.exit(report.overall === 'pass' ? 0 : 1);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  run,
  createConfig
};
