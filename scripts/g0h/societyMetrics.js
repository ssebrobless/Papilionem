const BOND_RANK = {
  acquaintance: 0,
  familiar: 1,
  companion: 2,
  bonded: 3,
  family: 4,
  mate: 4
};

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function mean(values = []) {
  const finite = values.filter(value => Number.isFinite(value));
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : null;
}

function stdev(values = []) {
  const avg = mean(values);
  if (!Number.isFinite(avg)) return null;
  const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / Math.max(1, values.length);
  return Math.sqrt(variance);
}

function entropy(labels = []) {
  if (!labels.length) return 0;
  const counts = new Map();
  for (const label of labels) counts.set(label, (counts.get(label) || 0) + 1);
  let value = 0;
  for (const count of counts.values()) {
    const p = count / labels.length;
    value -= p * Math.log2(p);
  }
  return value;
}

function getEdgeStrength(edge = {}) {
  return clamp01(((edge.trust || 0) + (edge.comfort || 0) + (edge.attachment || 0)) / 3);
}

function getTierRank(tier = 'acquaintance') {
  return BOND_RANK[tier] ?? 0;
}

function flattenEdges(samples = []) {
  const byPair = new Map();
  for (const sample of samples) {
    for (const edge of sample.edges || []) {
      const key = `${edge.sourceId}->${edge.targetId}`;
      if (!byPair.has(key)) byPair.set(key, []);
      byPair.get(key).push({
        atSeconds: sample.elapsedSeconds || 0,
        strength: edge.strength,
        tier: edge.bondTier || 'acquaintance'
      });
    }
  }
  return byPair;
}

function computeBondStability(samples = []) {
  const byPair = flattenEdges(samples);
  const ratios = [];
  const pairRatios = [];
  for (const [pairKey, values] of byPair.entries()) {
    const strengths = values.map(entry => entry.strength).filter(value => Number.isFinite(value));
    if (strengths.length < 2) continue;
    const avg = mean(strengths);
    if (!avg) continue;
    const ratio = stdev(strengths) / avg;
    const isMatureEdge = values.some(entry => getTierRank(entry.tier) >= getTierRank('familiar'));
    ratios.push(ratio);
    pairRatios.push({
      pairKey,
      isMatureEdge,
      sampleCount: strengths.length,
      meanStrength: avg,
      stdev: stdev(strengths),
      stdevMeanRatio: ratio,
      firstStrength: strengths[0],
      lastStrength: strengths[strengths.length - 1],
      minStrength: Math.min(...strengths),
      maxStrength: Math.max(...strengths)
    });
  }
  return {
    pairCount: ratios.length,
    stdevMeanRatio: mean(ratios) ?? 0,
    maturePairCount: pairRatios.filter(entry => entry.isMatureEdge).length,
    matureStdevMeanRatio: mean(pairRatios
      .filter(entry => entry.isMatureEdge)
      .map(entry => entry.stdevMeanRatio)) ?? 0,
    topVolatilePairs: pairRatios
      .sort((left, right) => right.stdevMeanRatio - left.stdevMeanRatio)
      .slice(0, 8),
    topMatureVolatilePairs: pairRatios
      .filter(entry => entry.isMatureEdge)
      .sort((left, right) => right.stdevMeanRatio - left.stdevMeanRatio)
      .slice(0, 8)
  };
}

function computeRelationshipArcEventChurn(cognitionEvents = [], durationSeconds = 1) {
  const events = (cognitionEvents || []).filter(event => event?.kind === 'relationshipArcEvent');
  const eventTransitions = events.map(event => ({
    pairKey: event.entityId && event.partnerId ? `${event.entityId}->${event.partnerId}` : null,
    canonicalPairKey: event.entityId && event.partnerId
      ? [event.entityId, event.partnerId].sort().join('<->')
      : null,
    fromTier: event.fromTier || event.previousTier || null,
    toTier: event.toTier || event.newTier || null,
    atFrame: event.currentFrame ?? null,
    arcReasons: event.arcReasons || []
  }));
  const canonicalTransitions = [];
  const canonicalSeen = new Set();
  for (const transition of eventTransitions) {
    const timeBucket = Number.isFinite(transition.atFrame)
      ? Math.floor(transition.atFrame / 900)
      : 0;
    const key = [
      transition.canonicalPairKey || transition.pairKey || 'unknown',
      transition.fromTier || 'unknown',
      transition.toTier || 'unknown',
      timeBucket
    ].join('|');
    if (canonicalSeen.has(key)) continue;
    canonicalSeen.add(key);
    canonicalTransitions.push(transition);
  }
  const topChurnPairs = summarizeTransitionPairs(canonicalTransitions);
  const directionCounts = countTransitionsByDirection(canonicalTransitions);
  return {
    eventCount: eventTransitions.length,
    canonicalEventCount: canonicalTransitions.length,
    transitionsPerMinute: canonicalTransitions.length / Math.max(1, durationSeconds / 60),
    growthTransitionsPerMinute: directionCounts.growth / Math.max(1, durationSeconds / 60),
    regressionTransitionsPerMinute: directionCounts.regression / Math.max(1, durationSeconds / 60),
    lateralTransitionsPerMinute: directionCounts.lateral / Math.max(1, durationSeconds / 60),
    directionCounts,
    eventTransitions,
    canonicalTransitions,
    topChurnPairs,
    sourcePath: 'event-subscription:cognition:triggered:relationshipArcEvent'
  };
}

function getTransitionDirection(fromTier, toTier) {
  const delta = getTierRank(toTier) - getTierRank(fromTier);
  if (delta > 0) return 'growth';
  if (delta < 0) return 'regression';
  return 'lateral';
}

function countTransitionsByDirection(transitions = []) {
  return transitions.reduce((counts, transition) => {
    const direction = getTransitionDirection(transition.fromTier, transition.toTier);
    counts[direction] = (counts[direction] || 0) + 1;
    return counts;
  }, { growth: 0, regression: 0, lateral: 0 });
}

function summarizeTransitionPairs(transitions = []) {
  const byPair = new Map();
  for (const transition of transitions) {
    const key = transition.canonicalPairKey || transition.pairKey || 'unknown';
    if (!byPair.has(key)) {
      byPair.set(key, {
        pairKey: key,
        count: 0,
        transitions: []
      });
    }
    const summary = byPair.get(key);
    const direction = getTransitionDirection(transition.fromTier, transition.toTier);
    summary.count += 1;
    summary.growthCount = (summary.growthCount || 0) + (direction === 'growth' ? 1 : 0);
    summary.regressionCount = (summary.regressionCount || 0) + (direction === 'regression' ? 1 : 0);
    summary.lateralCount = (summary.lateralCount || 0) + (direction === 'lateral' ? 1 : 0);
    summary.hasOscillation = summary.growthCount > 0 && summary.regressionCount > 0;
    summary.transitions.push({
      fromTier: transition.fromTier || null,
      toTier: transition.toTier || null,
      direction,
      atFrame: transition.atFrame ?? null,
      fromSeconds: transition.fromSeconds ?? null,
      toSeconds: transition.toSeconds ?? null,
      arcReasons: transition.arcReasons || []
    });
  }
  return [...byPair.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
}

function computeBondChurn(samples = [], durationSeconds = 1, cognitionEvents = []) {
  const byPair = flattenEdges(samples);
  let transitions = 0;
  const pairTransitions = [];
  for (const [pairKey, values] of byPair.entries()) {
    let previous = null;
    let previousEntry = null;
    for (const entry of values) {
      if (!entry.tier) continue;
      const rank = getTierRank(entry.tier);
      if (previous !== null && rank !== previous) {
        transitions += 1;
        pairTransitions.push({
          pairKey,
          fromTier: previousEntry?.tier || null,
          toTier: entry.tier,
          fromSeconds: previousEntry?.atSeconds ?? null,
          toSeconds: entry.atSeconds ?? null
        });
      }
      previous = rank;
      previousEntry = entry;
    }
  }
  const relationshipArcEvents = computeRelationshipArcEventChurn(cognitionEvents, durationSeconds);
  const sampleTopChurnPairs = summarizeTransitionPairs(pairTransitions.map(transition => ({
    ...transition,
    canonicalPairKey: transition.pairKey?.includes('->')
      ? transition.pairKey.split('->').sort().join('<->')
      : transition.pairKey
  })));
  const sampleDirectionCounts = countTransitionsByDirection(pairTransitions);
  const sampleTransitionsPerMinute = transitions / Math.max(1, durationSeconds / 60);
  const eventTransitionsPerMinute = relationshipArcEvents.transitionsPerMinute;
  const primaryTransitionsPerMinute = relationshipArcEvents.eventCount > 0
    ? eventTransitionsPerMinute
    : sampleTransitionsPerMinute;
  return {
    transitions,
    transitionsPerMinute: sampleTransitionsPerMinute,
    combinedTransitionsPerMinute: Math.max(sampleTransitionsPerMinute, eventTransitionsPerMinute),
    sampleGrowthTransitionsPerMinute: sampleDirectionCounts.growth / Math.max(1, durationSeconds / 60),
    sampleRegressionTransitionsPerMinute: sampleDirectionCounts.regression / Math.max(1, durationSeconds / 60),
    sampleLateralTransitionsPerMinute: sampleDirectionCounts.lateral / Math.max(1, durationSeconds / 60),
    primaryTransitionsPerMinute,
    primarySourcePath: relationshipArcEvents.eventCount > 0
      ? relationshipArcEvents.sourcePath
      : 'sample-series:bondTier',
    sampleDirectionCounts,
    pairTransitions,
    sampleTopChurnPairs,
    relationshipArcEvents,
    sourcePath: 'sample-series:bondTier + event-subscription:relationshipArcEvent'
  };
}

function getDialoguePair(dialogue = {}) {
  const targetId = Array.isArray(dialogue.targetIds) ? dialogue.targetIds[0] : null;
  return targetId ? `${dialogue.sourceId}->${targetId}` : null;
}

function computePartnerRepetition(dialogues = []) {
  const sorted = [...dialogues].sort((left, right) => (left.createdAtSeconds || 0) - (right.createdAtSeconds || 0));
  let repeated = 0;
  let total = 0;
  const recentByPair = new Map();
  for (const dialogue of sorted) {
    const pair = getDialoguePair(dialogue);
    if (!pair) continue;
    total += 1;
    const at = dialogue.createdAtSeconds || 0;
    const previous = recentByPair.get(pair);
    if (Number.isFinite(previous) && at - previous <= 300) repeated += 1;
    recentByPair.set(pair, at);
  }
  return {
    total,
    repeated,
    fraction: total ? repeated / total : 0
  };
}

function computeConversationRepetition(dialogues = []) {
  const sorted = [...dialogues].sort((left, right) => (left.createdAtFrame || 0) - (right.createdAtFrame || 0));
  let repeated = 0;
  let total = 0;
  const recent = new Map();
  for (const dialogue of sorted) {
    const targetKey = (dialogue.targetIds || []).filter(Boolean).sort().join('|');
    const key = [dialogue.sourceId, dialogue.phraseTemplateId || dialogue.basePhrase || dialogue.phrase, targetKey].join('::');
    const frame = Number.isFinite(dialogue.createdAtFrame)
      ? dialogue.createdAtFrame
      : Math.round((dialogue.createdAtSeconds || 0) * 60);
    total += 1;
    const previous = recent.get(key);
    if (Number.isFinite(previous) && Math.abs(frame - previous) <= 30) repeated += 1;
    recent.set(key, frame);
  }
  return {
    total,
    repeated,
    fraction: total ? repeated / total : 0
  };
}

function computeZoneMigrationEntropy(samples = []) {
  const byEntity = new Map();
  for (const sample of samples) {
    for (const entity of sample.entities || []) {
      if (!byEntity.has(entity.id)) byEntity.set(entity.id, []);
      if (entity.zoneId) byEntity.get(entity.id).push(entity.zoneId);
    }
  }
  const values = [...byEntity.values()].map(zones => entropy(zones));
  const distinctZoneCounts = [...byEntity.values()].map(zones => new Set(zones.filter(Boolean)).size);
  return {
    entityCount: values.length,
    meanEntropy: mean(values) ?? 0,
    meanDistinctZonesVisited: mean(distinctZoneCounts) ?? 0,
    distinctZoneCounts,
    sourcePath: 'sample-series:entity.zoneId'
  };
}

function getPackets(samples = []) {
  const latest = samples[samples.length - 1] || {};
  return latest.packets || [];
}

function computeGriefRecovery(samples = []) {
  const griefById = new Map();
  for (const sample of samples) {
    for (const packet of sample.packets || []) {
      if (packet.kind !== 'bereavement') continue;
      const id = packet.id || `${packet.entityId}:${packet.partnerId}:${packet.createdAtFrame || packet.lostAtFrame}`;
      if (!griefById.has(id)) griefById.set(id, []);
      griefById.get(id).push({
        frame: sample.frame || 0,
        intensity: packet.intensity ?? 0,
        decayFrames: packet.decayFrames ?? null,
        reunionAtFrame: Number.isFinite(packet.reunionAtFrame) ? packet.reunionAtFrame : null
      });
    }
  }
  const decayRates = [];
  const skippedPackets = [];
  for (const [packetId, values] of griefById.entries()) {
    if (values.length < 2) continue;
    const first = values[0];
    const last = values[values.length - 1];
    const hasRecoveryOpportunity = values.some(entry => Number.isFinite(entry.reunionAtFrame))
      || values.some(entry => Number.isFinite(entry.decayFrames) && entry.decayFrames <= 600)
      || last.intensity < first.intensity;
    if (!hasRecoveryOpportunity) {
      skippedPackets.push({
        packetId,
        reason: 'no-reunion-or-active-recovery-window',
        firstFrame: first.frame,
        lastFrame: last.frame,
        intensity: first.intensity,
        decayFrames: first.decayFrames
      });
      continue;
    }
    const frames = Math.max(1, last.frame - first.frame);
    decayRates.push(Math.max(0, (first.intensity - last.intensity) / frames));
  }
  return {
    packetCount: griefById.size,
    recoveryOpportunityCount: decayRates.length,
    skippedPacketCount: skippedPackets.length,
    skippedPackets,
    meanDecayPerFrame: mean(decayRates),
    sourcePath: 'sample-series:bereavement-packets:reunion-or-active-recovery-only'
  };
}

function computeWitnessedAffectionRate(samples = [], durationSeconds = 1, cognitionEvents = []) {
  const packets = getPackets(samples).filter(packet => packet.kind === 'witnessedAffection');
  const events = (cognitionEvents || []).filter(event => event?.kind === 'witnessedAffection');
  return {
    eventCount: events.length,
    perMinute: events.length / Math.max(1, durationSeconds / 60),
    packetSnapshotCount: packets.length,
    packetSnapshotPerMinute: packets.length / Math.max(1, durationSeconds / 60),
    sourcePath: 'event-subscription:cognition:triggered',
    diagnosticPath: 'sample-snapshot:latest-packets'
  };
}

function computeCleanupGradient(samples = []) {
  if (samples.length < 2) return { windows: [], nonPositiveFraction: 0 };
  const windowSeconds = 300;
  const windows = [];
  const firstAt = samples[0].elapsedSeconds || 0;
  const lastAt = samples[samples.length - 1].elapsedSeconds || 0;
  for (let start = firstAt; start < lastAt; start += windowSeconds) {
    if (lastAt < start + windowSeconds) continue;
    const startSample = samples.find(sample => (sample.elapsedSeconds || 0) >= start);
    const endSample = [...samples].reverse().find(sample => (sample.elapsedSeconds || 0) <= start + windowSeconds);
    if (!startSample || !endSample || startSample === endSample) continue;
    windows.push({
      startSeconds: start,
      endSeconds: start + windowSeconds,
      delta: (endSample.dirtPileCount || 0) - (startSample.dirtPileCount || 0)
    });
  }
  const nonPositive = windows.filter(window => window.delta <= 0).length;
  return {
    windows,
    nonPositiveFraction: windows.length ? nonPositive / windows.length : 0
  };
}

function computeEcologyLoopPressure(samples = [], dialogues = [], ecologyEvents = [], durationSeconds = 1) {
  const durationMinutes = Math.max(1, durationSeconds / 60);
  const eventCount = type => ecologyEvents.filter(event => event?.type === type).length;
  const compostCreated = eventCount('ecology:cleanup-compost-created');
  const cleanupObjects = eventCount('ecology:cleanup-object-cleaned');
  const compostBoostedSprinkles = ecologyEvents.filter(event =>
    event?.type === 'pollen:sprinkle' && event?.compostBoosted === true
  ).length;
  const compostBoostedBlooms = ecologyEvents.filter(event =>
    event?.type === 'pollen:bloomed' && event?.compostBoosted === true
  ).length;
  const pollenWorkDialogues = dialogues.filter(dialogue =>
    dialogue?.reason === 'pollen-planting-help'
      || dialogue?.metadata?.reason === 'pollen-planting-help'
      || (dialogue?.intentTags || []).includes('pollen')
  );
  const compostAwarePollenDialogues = pollenWorkDialogues.filter(dialogue =>
    dialogue?.metadata?.hasCompostPatch === true
      || Number(dialogue?.metadata?.compostPatchCount || 0) > 0
      || /cleaned ground|compost|cleared square/i.test(dialogue?.phrase || '')
  );
  const compostPatchSamples = samples.map(sample => Math.max(0, Number(sample.compostPatchCount || 0)));
  const dirtPileCounts = samples.map(sample => Math.max(0, Number(sample.dirtPileCount || 0)));
  const flowerCounts = samples.map(sample => Math.max(0, Number(sample.flowerCount || 0)));
  return {
    cleanupObjectCleanedEventCount: cleanupObjects,
    cleanupCompostCreatedEventCount: compostCreated,
    compostCreatedPerMinute: compostCreated / durationMinutes,
    compostBoostedSprinkleCount: compostBoostedSprinkles,
    compostBoostedBloomCount: compostBoostedBlooms,
    compostBoostedBloomPerMinute: compostBoostedBlooms / durationMinutes,
    pollenWorkDialogueCount: pollenWorkDialogues.length,
    compostAwarePollenDialogueCount: compostAwarePollenDialogues.length,
    compostAwarePollenDialogueFraction: pollenWorkDialogues.length
      ? compostAwarePollenDialogues.length / pollenWorkDialogues.length
      : 0,
    maxCompostPatchCount: compostPatchSamples.length ? Math.max(...compostPatchSamples) : 0,
    meanCompostPatchCount: mean(compostPatchSamples) ?? 0,
    dirtPileNetDelta: dirtPileCounts.length >= 2 ? dirtPileCounts.at(-1) - dirtPileCounts[0] : 0,
    flowerNetDelta: flowerCounts.length >= 2 ? flowerCounts.at(-1) - flowerCounts[0] : 0,
    eventSamples: ecologyEvents
      .filter(event => event?.type === 'ecology:cleanup-compost-created' || event?.compostBoosted === true)
      .slice(-8),
    sourcePath: 'event-subscription:ecology + sample-series:compostPatchCount + dialogue-history:pollen'
  };
}

function evaluateBands(metrics = {}) {
  const checks = [
    {
      id: 'bond-stability',
      pass: metrics.bondStability.stdevMeanRatio <= 0.30,
      observed: metrics.bondStability.stdevMeanRatio,
      expected: '<= 0.30',
      diagnostic: {
        pairCount: metrics.bondStability.pairCount,
        maturePairCount: metrics.bondStability.maturePairCount,
        allEdgeStdevMeanRatio: metrics.bondStability.stdevMeanRatio,
        matureEdgeStdevMeanRatio: metrics.bondStability.matureStdevMeanRatio,
        topVolatilePairs: metrics.bondStability.topVolatilePairs || [],
        topMatureVolatilePairs: metrics.bondStability.topMatureVolatilePairs || []
      }
    },
    {
      id: 'bond-churn',
      pass: metrics.bondChurn.primaryTransitionsPerMinute >= 0.25 && metrics.bondChurn.primaryTransitionsPerMinute <= 2.0,
      observed: metrics.bondChurn.primaryTransitionsPerMinute,
      expected: '0.25..2.0 transitions/min',
      provisional: true,
      diagnostic: {
        primarySourcePath: metrics.bondChurn.primarySourcePath,
        sampleTransitionsPerMinute: metrics.bondChurn.transitionsPerMinute,
        combinedTransitionsPerMinute: metrics.bondChurn.combinedTransitionsPerMinute,
        relationshipArcEventTransitionsPerMinute: metrics.bondChurn.relationshipArcEvents?.transitionsPerMinute || 0,
        relationshipArcEventCount: metrics.bondChurn.relationshipArcEvents?.eventCount || 0,
        relationshipArcCanonicalEventCount: metrics.bondChurn.relationshipArcEvents?.canonicalEventCount || 0,
        relationshipArcGrowthTransitionsPerMinute: metrics.bondChurn.relationshipArcEvents?.growthTransitionsPerMinute || 0,
        relationshipArcRegressionTransitionsPerMinute: metrics.bondChurn.relationshipArcEvents?.regressionTransitionsPerMinute || 0,
        sampleGrowthTransitionsPerMinute: metrics.bondChurn.sampleGrowthTransitionsPerMinute || 0,
        sampleRegressionTransitionsPerMinute: metrics.bondChurn.sampleRegressionTransitionsPerMinute || 0,
        eventTopChurnPairs: metrics.bondChurn.relationshipArcEvents?.topChurnPairs || [],
        sampleTopChurnPairs: metrics.bondChurn.sampleTopChurnPairs || []
      }
    },
    {
      id: 'partner-repetition',
      pass: metrics.partnerRepetition.fraction <= 0.40,
      observed: metrics.partnerRepetition.fraction,
      expected: '<= 0.40'
    },
    {
      id: 'grief-recovery',
      pass: metrics.griefRecovery.meanDecayPerFrame == null
        || (metrics.griefRecovery.meanDecayPerFrame >= 0.001 && metrics.griefRecovery.meanDecayPerFrame <= 0.01),
      observed: metrics.griefRecovery.meanDecayPerFrame,
      expected: '0.001..0.01 per frame, or null if no grief recovery opportunity occurred',
      residual: metrics.griefRecovery.meanDecayPerFrame == null,
      diagnostic: {
        packetCount: metrics.griefRecovery.packetCount,
        recoveryOpportunityCount: metrics.griefRecovery.recoveryOpportunityCount,
        skippedPacketCount: metrics.griefRecovery.skippedPacketCount,
        skippedPackets: metrics.griefRecovery.skippedPackets,
        sourcePath: metrics.griefRecovery.sourcePath
      }
    },
    {
      id: 'witnessed-affection-rate',
      pass: metrics.witnessedAffectionRate.perMinute >= 0.10,
      observed: metrics.witnessedAffectionRate.perMinute,
      expected: '>= 0.10/min',
      provisional: true,
      sourcePath: metrics.witnessedAffectionRate.sourcePath,
      diagnostic: {
        packetSnapshotCount: metrics.witnessedAffectionRate.packetSnapshotCount,
        packetSnapshotPerMinute: metrics.witnessedAffectionRate.packetSnapshotPerMinute,
        diagnosticPath: metrics.witnessedAffectionRate.diagnosticPath
      }
    },
    {
      id: 'cleanup-gradient',
      pass: metrics.cleanupGradient.nonPositiveFraction < 0.50 || metrics.cleanupGradient.windows.length === 0,
      observed: metrics.cleanupGradient.nonPositiveFraction,
      expected: '< 0.50 non-positive windows',
      provisional: true,
      residual: metrics.cleanupGradient.windows.length === 0
    },
    {
      id: 'ecology-loop-pressure',
      pass: metrics.ecologyLoopPressure.cleanupCompostCreatedEventCount >= 1
        && metrics.ecologyLoopPressure.compostBoostedBloomCount >= 1,
      observed: {
        cleanupCompostCreatedEventCount: metrics.ecologyLoopPressure.cleanupCompostCreatedEventCount,
        compostBoostedBloomCount: metrics.ecologyLoopPressure.compostBoostedBloomCount,
        compostAwarePollenDialogueFraction: metrics.ecologyLoopPressure.compostAwarePollenDialogueFraction
      },
      expected: '>=1 compost-created event and >=1 compost-boosted bloom when fixture/opportunity exists',
      provisional: true,
      residual: (
        metrics.ecologyLoopPressure.cleanupCompostCreatedEventCount === 0
        && metrics.ecologyLoopPressure.maxCompostPatchCount === 0
      ) || (
          metrics.ecologyLoopPressure.cleanupCompostCreatedEventCount >= 1
          && metrics.ecologyLoopPressure.compostBoostedSprinkleCount === 0
          && metrics.ecologyLoopPressure.pollenWorkDialogueCount === 0
      ),
      diagnostic: {
        sourcePath: metrics.ecologyLoopPressure.sourcePath,
        cleanupObjectCleanedEventCount: metrics.ecologyLoopPressure.cleanupObjectCleanedEventCount,
        compostBoostedSprinkleCount: metrics.ecologyLoopPressure.compostBoostedSprinkleCount,
        pollenWorkDialogueCount: metrics.ecologyLoopPressure.pollenWorkDialogueCount,
        compostAwarePollenDialogueCount: metrics.ecologyLoopPressure.compostAwarePollenDialogueCount,
        meanCompostPatchCount: metrics.ecologyLoopPressure.meanCompostPatchCount,
        dirtPileNetDelta: metrics.ecologyLoopPressure.dirtPileNetDelta,
        flowerNetDelta: metrics.ecologyLoopPressure.flowerNetDelta,
        eventSamples: metrics.ecologyLoopPressure.eventSamples
      }
    },
    {
      id: 'zone-migration-entropy',
      pass: metrics.zoneMigrationEntropy.meanEntropy >= 0.50
        && metrics.zoneMigrationEntropy.meanDistinctZonesVisited >= 2,
      observed: {
        meanEntropy: metrics.zoneMigrationEntropy.meanEntropy,
        meanDistinctZonesVisited: metrics.zoneMigrationEntropy.meanDistinctZonesVisited
      },
      expected: 'meanEntropy >= 0.50 and mean distinct zones visited >= 2',
      stretch: true
    },
    {
      id: 'conversation-repetition',
      pass: metrics.conversationRepetition.fraction <= 0.05,
      observed: metrics.conversationRepetition.fraction,
      expected: '<= 0.05'
    }
  ];
  return checks;
}

function computeSocietyMetrics(run = {}) {
  const samples = run.samples || [];
  const dialogues = run.dialogues || [];
  const cognitionEvents = run.cognitionEvents || [];
  const durationSeconds = run.durationSeconds || (samples.at(-1)?.elapsedSeconds || 1);
  const metrics = {
    durationSeconds,
    sampleCount: samples.length,
    dialogueCount: dialogues.length,
    bondStability: computeBondStability(samples),
    bondChurn: computeBondChurn(samples, durationSeconds, cognitionEvents),
    partnerRepetition: computePartnerRepetition(dialogues),
    griefRecovery: computeGriefRecovery(samples),
    avoidanceAfterHarm: {
      evaluatedPairs: 0,
      fraction: null,
      residual: true,
      reason: 'co-time-before-after sampling is not yet collected by this harness'
    },
    zoneMigrationEntropy: computeZoneMigrationEntropy(samples),
    conversationRepetition: computeConversationRepetition(dialogues),
    witnessedAffectionRate: computeWitnessedAffectionRate(samples, durationSeconds, cognitionEvents),
    cleanupGradient: computeCleanupGradient(samples),
    ecologyLoopPressure: computeEcologyLoopPressure(samples, dialogues, run.ecologyEvents || [], durationSeconds),
    metricSources: {
      bondStability: 'sample-series:socialEdges.strength',
      bondChurn: 'sample-series:socialEdges.bondTier + event-subscription:cognition:triggered:relationshipArcEvent',
      partnerRepetition: 'dialogue-history:source-target-window',
      griefRecovery: 'sample-series:memory-packets',
      zoneMigrationEntropy: 'sample-series:entity.zoneId',
      conversationRepetition: 'dialogue-history:template-window',
      witnessedAffectionRate: 'event-subscription:cognition:triggered',
      witnessedAffectionPacketDiagnostic: 'sample-snapshot:latest-packets',
      cleanupGradient: 'sample-series:dirtPileCount',
      ecologyLoopPressure: 'event-subscription:ecology + sample-series:compostPatchCount + dialogue-history:pollen'
    }
  };
  return {
    metrics,
    checks: evaluateBands(metrics)
  };
}

module.exports = {
  computeSocietyMetrics,
  getEdgeStrength
};
