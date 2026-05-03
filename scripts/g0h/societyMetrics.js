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
  for (const values of byPair.values()) {
    const strengths = values.map(entry => entry.strength).filter(value => Number.isFinite(value));
    if (strengths.length < 2) continue;
    const avg = mean(strengths);
    if (!avg) continue;
    ratios.push(stdev(strengths) / avg);
  }
  return {
    pairCount: ratios.length,
    stdevMeanRatio: mean(ratios) ?? 0
  };
}

function computeRelationshipArcEventChurn(cognitionEvents = [], durationSeconds = 1) {
  const events = (cognitionEvents || []).filter(event => event?.kind === 'relationshipArcEvent');
  const eventTransitions = events.map(event => ({
    pairKey: event.entityId && event.partnerId ? `${event.entityId}->${event.partnerId}` : null,
    fromTier: event.fromTier || event.previousTier || null,
    toTier: event.toTier || event.newTier || null,
    atFrame: event.currentFrame ?? null,
    arcReasons: event.arcReasons || []
  }));
  return {
    eventCount: eventTransitions.length,
    transitionsPerMinute: eventTransitions.length / Math.max(1, durationSeconds / 60),
    eventTransitions,
    sourcePath: 'event-subscription:cognition:triggered:relationshipArcEvent'
  };
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
  const sampleTransitionsPerMinute = transitions / Math.max(1, durationSeconds / 60);
  const eventTransitionsPerMinute = relationshipArcEvents.transitionsPerMinute;
  return {
    transitions,
    transitionsPerMinute: sampleTransitionsPerMinute,
    combinedTransitionsPerMinute: Math.max(sampleTransitionsPerMinute, eventTransitionsPerMinute),
    pairTransitions,
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
      griefById.get(id).push({ frame: sample.frame || 0, intensity: packet.intensity ?? 0 });
    }
  }
  const decayRates = [];
  for (const values of griefById.values()) {
    if (values.length < 2) continue;
    const first = values[0];
    const last = values[values.length - 1];
    const frames = Math.max(1, last.frame - first.frame);
    decayRates.push(Math.max(0, (first.intensity - last.intensity) / frames));
  }
  return {
    packetCount: griefById.size,
    meanDecayPerFrame: mean(decayRates)
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

function evaluateBands(metrics = {}) {
  const checks = [
    {
      id: 'bond-stability',
      pass: metrics.bondStability.stdevMeanRatio <= 0.30,
      observed: metrics.bondStability.stdevMeanRatio,
      expected: '<= 0.30'
    },
    {
      id: 'bond-churn',
      pass: metrics.bondChurn.combinedTransitionsPerMinute >= 0.25 && metrics.bondChurn.combinedTransitionsPerMinute <= 2.0,
      observed: metrics.bondChurn.combinedTransitionsPerMinute,
      expected: '0.25..2.0 transitions/min',
      provisional: true,
      diagnostic: {
        sampleTransitionsPerMinute: metrics.bondChurn.transitionsPerMinute,
        relationshipArcEventTransitionsPerMinute: metrics.bondChurn.relationshipArcEvents?.transitionsPerMinute || 0,
        relationshipArcEventCount: metrics.bondChurn.relationshipArcEvents?.eventCount || 0
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
      expected: '0.001..0.01 per frame, or null if no grief packets',
      residual: metrics.griefRecovery.meanDecayPerFrame == null
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
    metricSources: {
      bondStability: 'sample-series:socialEdges.strength',
      bondChurn: 'sample-series:socialEdges.bondTier + event-subscription:cognition:triggered:relationshipArcEvent',
      partnerRepetition: 'dialogue-history:source-target-window',
      griefRecovery: 'sample-series:memory-packets',
      zoneMigrationEntropy: 'sample-series:entity.zoneId',
      conversationRepetition: 'dialogue-history:template-window',
      witnessedAffectionRate: 'event-subscription:cognition:triggered',
      witnessedAffectionPacketDiagnostic: 'sample-snapshot:latest-packets',
      cleanupGradient: 'sample-series:dirtPileCount'
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
