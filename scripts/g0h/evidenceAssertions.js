function countBy(items = [], keyFn) {
  const counts = {};
  for (const item of items || []) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function normalizeCognitionEvent(event = {}) {
  const data = event?.data || event || {};
  return {
    ...data,
    currentFrame: Number(data.currentFrame ?? data.frame ?? 0) || 0,
    entityId: data.entityId || data.sourceId || data.actorId || null,
    partnerId: data.partnerId || data.chosenPartnerId || data.bondPartnerId || null,
    thirdPartyId: data.thirdPartyId || data.rejectedPartnerId || null,
    kind: data.kind || null
  };
}

function cognitionEventKey(event = {}) {
  const normalized = normalizeCognitionEvent(event);
  return [
    normalized.currentFrame,
    normalized.entityId || '',
    normalized.kind || '',
    normalized.partnerId || '',
    normalized.thirdPartyId || ''
  ].join('|');
}

function uniqueCognitionEvents(events = []) {
  const seen = new Set();
  const unique = [];
  for (const event of events || []) {
    const normalized = normalizeCognitionEvent(event);
    if (!normalized.kind) continue;
    const key = cognitionEventKey(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }
  return unique;
}

function summarizeBlockCells(blocks = []) {
  const seen = new Map();
  const duplicateCells = [];
  const halfCells = [];
  const sunCourtBlocks = [];
  const outOfRangeCells = [];
  const unsupportedStacks = [];
  const occupied = new Set();

  for (const block of blocks || []) {
    const cell = block?.boardPos || null;
    if (!cell) {
      halfCells.push({ id: block?.id || null, reason: 'missing-board-pos' });
      continue;
    }
    const zoneId = cell.zoneId || block.currentZoneId || null;
    const key = `${zoneId}:${cell.u}:${cell.v}:${cell.h}`;
    if (seen.has(key)) {
      duplicateCells.push({ key, blockIds: [seen.get(key), block.id] });
    } else {
      seen.set(key, block.id);
    }
    occupied.add(key);
    if (zoneId === 'sun-court') {
      sunCourtBlocks.push(block.id);
    }
    if (!Number.isInteger(cell.u) || !Number.isInteger(cell.v) || !Number.isInteger(cell.h || 0)) {
      halfCells.push({ id: block.id, boardPos: cell });
    }
    if (cell.u < 0 || cell.v < 0 || (cell.h || 0) < 0) {
      outOfRangeCells.push({ id: block.id, boardPos: cell, reason: 'negative-cell' });
    }
  }

  for (const block of blocks || []) {
    const cell = block?.boardPos || null;
    if (!cell || (cell.h || 0) <= 0) continue;
    const supportKey = `${cell.zoneId || block.currentZoneId}:${cell.u}:${cell.v}:${(cell.h || 0) - 1}`;
    if (!occupied.has(supportKey)) {
      unsupportedStacks.push({ id: block.id, boardPos: cell });
    }
  }

  return {
    blockCount: blocks.length,
    duplicateCells,
    halfCells,
    outOfRangeCells,
    unsupportedStacks,
    sunCourtBlocks,
    pass:
      duplicateCells.length === 0 &&
      halfCells.length === 0 &&
      outOfRangeCells.length === 0 &&
      unsupportedStacks.length === 0 &&
      sunCourtBlocks.length === 0
  };
}

function summarizeEvidenceFidelity(scripted = {}) {
  const inspected = scripted.inspections || [];
  const snapshots = scripted.snapshots || [];
  const productionEvents = scripted.productionEvents || {};
  const accumulated = uniqueCognitionEvents([
    ...(productionEvents.accumulatedCognition || []),
    ...(scripted.cognitionAccumulator || [])
  ]);
  const snapshotEvents = uniqueCognitionEvents(
    snapshots.flatMap(snapshot => snapshot?.cognitionEvents || [])
  );
  const accumulatedKeys = new Set(accumulated.map(cognitionEventKey));
  const missingSnapshotEvents = snapshotEvents.filter(event => !accumulatedKeys.has(cognitionEventKey(event)));
  const inspectedWithMemory = inspected.filter(entry => Number(entry?.memoryPacketCount || 0) > 0);
  const snapshotAliasesWithMemory = [];
  for (const snapshot of snapshots) {
    for (const [alias, details] of Object.entries(snapshot?.aliases || {})) {
      if (details && Number(details.memoryPacketCount || 0) > 0) {
        snapshotAliasesWithMemory.push({
          label: snapshot.label || null,
          alias,
          memoryPacketCount: details.memoryPacketCount,
          memoryKindCounts: details.memoryKindCounts || {}
        });
      }
    }
  }
  const gaps = [];
  if (!inspectedWithMemory.length && !snapshotAliasesWithMemory.length) {
    gaps.push('memoryPacketCount=0 across inspections and snapshots; evidence reader may not be seeing family-bucket memories');
  }
  if (!accumulated.length) {
    gaps.push('accumulatedCognition is empty; driver may still be relying on the eventBus ring buffer');
  }
  if (missingSnapshotEvents.length) {
    gaps.push('accumulatedCognition is missing cognition events observed in per-snapshot samples');
  }
  const pass = gaps.length === 0;
  return {
    pass,
    gaps,
    inspectedWithMemory: inspectedWithMemory.map(entry => ({
      alias: entry.alias,
      memoryPacketCount: entry.memoryPacketCount,
      memoryFamilyCounts: entry.memoryFamilyCounts || {},
      memoryKindCounts: entry.memoryKindCounts || {}
    })),
    snapshotAliasesWithMemory,
    accumulatedCognitionCount: accumulated.length,
    snapshotCognitionCount: snapshotEvents.length,
    missingSnapshotEvents: missingSnapshotEvents.map(event => ({
      key: cognitionEventKey(event),
      kind: event.kind,
      entityId: event.entityId || null,
      partnerId: event.partnerId || null,
      thirdPartyId: event.thirdPartyId || null,
      currentFrame: event.currentFrame || 0
    }))
  };
}

function summarizeCognitionCoverage(scripted = {}) {
  const snapshots = scripted.snapshots || [];
  const productionEvents = scripted.productionEvents || {};
  const accumulated = uniqueCognitionEvents([
    ...(productionEvents.accumulatedCognition || []),
    ...(scripted.cognitionAccumulator || []),
    ...snapshots.flatMap(snapshot => snapshot?.cognitionEvents || [])
  ]);
  const eventCounts = {
    bereavementDeath: accumulated.filter(event => event.kind === 'bereavement' && event.trigger === 'butterflyDied').length,
    bereavementLongAbsence: accumulated.filter(event =>
      event.kind === 'bereavement' && (event.trigger === 'longAbsence' || event.subtype === 'long-absence')
    ).length,
    witnessedAffection: accumulated.filter(event => event.kind === 'witnessedAffection').length,
    loyaltyChoice: accumulated.filter(event => event.kind === 'loyalty').length,
    prideBattleWin: accumulated.filter(event => event.kind === 'pride' && event.trigger === 'battleWin').length,
    prideCaregivingSuccess: accumulated.filter(event => event.kind === 'pride' && event.trigger === 'caregivingSuccess').length,
    shameAbandonedAlly: accumulated.filter(event => event.kind === 'shame' && event.trigger === 'abandonedAlly').length,
    shameWarningIgnoredHarm: accumulated.filter(event => event.kind === 'shame' && event.trigger === 'warningIgnoredHarm').length
  };
  const memoryCounts = {
    bereavementDeath: 0,
    bereavementLongAbsence: 0,
    witnessedAffection: 0,
    loyaltyChoice: 0,
    prideAnchor: 0,
    shameAnchor: 0
  };
  for (const snapshot of snapshots) {
    for (const details of Object.values(snapshot?.aliases || {})) {
      const counts = details?.memoryKindCounts || {};
      memoryCounts.bereavementDeath = Math.max(memoryCounts.bereavementDeath, Number(counts.bereavementDeath || 0));
      memoryCounts.bereavementLongAbsence = Math.max(memoryCounts.bereavementLongAbsence, Number(counts.bereavementLongAbsence || 0));
      memoryCounts.witnessedAffection = Math.max(memoryCounts.witnessedAffection, Number(counts.witnessedAffection || 0));
      memoryCounts.loyaltyChoice = Math.max(memoryCounts.loyaltyChoice, Number(counts.loyaltyChoice || 0));
      memoryCounts.prideAnchor = Math.max(memoryCounts.prideAnchor, Number(counts.prideAnchor || 0));
      memoryCounts.shameAnchor = Math.max(memoryCounts.shameAnchor, Number(counts.shameAnchor || 0));
    }
  }
  const checks = {
    bereavementDeath: eventCounts.bereavementDeath > 0 && memoryCounts.bereavementDeath > 0,
    bereavementLongAbsence: eventCounts.bereavementLongAbsence > 0 && memoryCounts.bereavementLongAbsence > 0,
    witnessedAffection: eventCounts.witnessedAffection > 0 && memoryCounts.witnessedAffection > 0,
    loyaltyChoice: eventCounts.loyaltyChoice > 0 && memoryCounts.loyaltyChoice > 0,
    prideBattleWin: eventCounts.prideBattleWin > 0 && memoryCounts.prideAnchor > 0,
    prideCaregivingSuccess: eventCounts.prideCaregivingSuccess > 0 && memoryCounts.prideAnchor > 0,
    shameAbandonedAlly: eventCounts.shameAbandonedAlly > 0 && memoryCounts.shameAnchor > 0,
    shameWarningIgnoredHarm: eventCounts.shameWarningIgnoredHarm > 0 && memoryCounts.shameAnchor > 0
  };
  const evidenceFidelityNotes = [];
  const memoryEventPairs = [
    ['bereavementDeath', 'bereavementDeath'],
    ['bereavementLongAbsence', 'bereavementLongAbsence'],
    ['witnessedAffection', 'witnessedAffection'],
    ['loyaltyChoice', 'loyaltyChoice'],
    ['prideAnchor', 'prideBattleWin'],
    ['prideAnchor', 'prideCaregivingSuccess'],
    ['shameAnchor', 'shameAbandonedAlly'],
    ['shameAnchor', 'shameWarningIgnoredHarm']
  ];
  for (const [memoryKey, eventKey] of memoryEventPairs) {
    if (Number(memoryCounts[memoryKey] || 0) > 0 && Number(eventCounts[eventKey] || 0) === 0) {
      evidenceFidelityNotes.push({
        kind: eventKey,
        memoryKey,
        memoryCount: Number(memoryCounts[memoryKey] || 0),
        eventCount: 0,
        note: `${eventKey} has durable memory evidence but no accumulated cognition event evidence`
      });
    }
  }
  const missingKinds = Object.entries(checks)
    .filter(([, pass]) => !pass)
    .map(([key]) => key);
  return {
    pass: missingKinds.length === 0,
    checks,
    missingKinds,
    eventCounts,
    memoryCounts,
    evidenceFidelityNotes,
    accumulatedCognitionCount: accumulated.length
  };
}

function summarizeAccessibilityPersistence(scripted = {}) {
  const accessibility = scripted.accessibility || null;
  const checks = accessibility?.checks || {};
  const required = [
    'appliedColorblindCycle',
    'appliedTrailCycle',
    'appliedHighContrastCycle',
    'appliedUiScaleCycle',
    'persistedBeforeReload',
    'settingsBeforeReload',
    'persistedAfterReload',
    'settingsAfterReload',
    'domCanvasAgreement',
    'canvasFilterOff'
  ];
  const failed = required.filter(key => checks[key] !== true);
  return {
    pass: !!accessibility && failed.length === 0,
    failed,
    expected: accessibility?.expected || null,
    beforeReload: accessibility?.beforeReload || null,
    afterReload: accessibility?.afterReload || null,
    checks
  };
}

function summarizeContinuity(before = {}, after = {}) {
  const beforeAliases = before.aliases || {};
  const afterAliases = after.aliases || {};
  const aliases = Object.keys(beforeAliases);
  const missingAliases = aliases.filter(alias => !afterAliases[alias]?.id || afterAliases[alias].id !== beforeAliases[alias]?.id);
  const edgeMismatches = aliases.filter(alias => {
    const beforeEdges = beforeAliases[alias]?.edgeCount || 0;
    const afterEdges = afterAliases[alias]?.edgeCount || 0;
    return afterEdges < beforeEdges;
  });
  const memoryMismatches = aliases.filter(alias => {
    const beforePackets = beforeAliases[alias]?.memoryPacketCount || 0;
    const afterPackets = afterAliases[alias]?.memoryPacketCount || 0;
    return afterPackets < beforePackets;
  });
  const beforeCells = JSON.stringify((before.blockCells || []).map(cell => cell.key).sort());
  const afterCells = JSON.stringify((after.blockCells || []).map(cell => cell.key).sort());
  return {
    aliasCount: aliases.length,
    missingAliases,
    edgeMismatches,
    memoryMismatches,
    blockCellsPreserved: beforeCells === afterCells,
    pass:
      aliases.length > 0 &&
      missingAliases.length === 0 &&
      edgeMismatches.length === 0 &&
      memoryMismatches.length === 0 &&
      beforeCells === afterCells
  };
}

function buildEvidenceLanes(report = {}) {
  const lanes = [];
  const runtime = report.runtime || {};
  const capture = report.capture || {};
  const scripted = report.scriptedEvidence || {};
  const latestSnapshot = scripted.snapshots?.[scripted.snapshots.length - 1] || {};
  const blockSummary = summarizeBlockCells(latestSnapshot.blocks || []);
  const continuity = summarizeContinuity(scripted.beforeReload, scripted.afterReload);
  const flowerKinds = countBy(latestSnapshot.flowers || [], flower => flower.lifecycleKind || 'flower');
  const socialEvents = scripted.productionEvents || {};
  const inspected = scripted.inspections || [];
  const postReloadInspections = inspected.filter(entry => entry.afterReload);
  const zonesVisited = Array.from(new Set(scripted.zoneVisits || []));

  lanes.push({
    id: 'runtime-errors',
    pass:
      (runtime.pageErrors || []).length === 0 &&
      (runtime.consoleErrors || []).length === 0 &&
      Number(runtime.errorRuntimeIssueCount || 0) === 0,
    details: runtime
  });
  lanes.push({
    id: 'capture-export',
    pass: !!capture.capturePath && !!capture.summaryPath && Number(capture.durationMs || 0) >= Number(report.minimumDurationMs || 420000),
    details: capture
  });
  lanes.push({
    id: 'zone-visits',
    pass: ['ivy-cloister', 'moss-hollow', 'pool-heart', 'sun-court'].every(zoneId => zonesVisited.includes(zoneId)),
    details: { zonesVisited }
  });
  lanes.push({
    id: 'inspect-coverage',
    pass: new Set(inspected.map(entry => entry.alias)).size >= 3 && postReloadInspections.length >= 1,
    details: { inspections: inspected }
  });
  lanes.push({
    id: 'save-reload-continuity',
    pass: continuity.pass,
    details: continuity
  });
  lanes.push({
    id: 'block-cell-discipline',
    pass: blockSummary.pass,
    details: blockSummary
  });
  lanes.push({
    id: 'production-social-event',
    pass:
      Number(socialEvents.dialogueSpoken || 0) > 0 ||
      Number(socialEvents.communicationSignal || 0) > 0 ||
      Number(socialEvents.loyaltyChoices || 0) > 0 ||
      Number(socialEvents.outcomeAnchors || 0) > 0,
    details: socialEvents
  });
  lanes.push({
    id: 'feed-thread-shape',
    pass: !!scripted.feedShape?.hasMotive && !!scripted.feedShape?.hasTarget && !!scripted.feedShape?.hasResponse && !!scripted.feedShape?.hasConsequence,
    details: scripted.feedShape || null
  });
  const finalDirtPileCount = Number(scripted.flowerLifecycle?.finalPilesAfter ?? flowerKinds['dirt-pile'] ?? 0);
  lanes.push({
    id: 'flower-lifecycle',
    pass:
      !!scripted.flowerLifecycle?.evidenceCaptured &&
      scripted.flowerLifecycle?.noDriverCleanupInjection === true &&
      Number(scripted.flowerLifecycle?.pilesAfter || 0) <= Number(scripted.flowerLifecycle?.pilesBefore || 0) - 5 &&
      finalDirtPileCount < 50,
    details: {
      flowerLifecycle: scripted.flowerLifecycle || null,
      finalDirtPileCount,
      finalFlowerKinds: flowerKinds
    }
  });
  lanes.push({
    id: 'battle-and-ability',
    pass: !!scripted.battle?.evidenceCaptured && !!scripted.ability?.evidenceCaptured,
    residual: !scripted.battle?.evidenceCaptured || !scripted.ability?.evidenceCaptured,
    details: {
      battle: scripted.battle || null,
      ability: scripted.ability || null
    }
  });
  const cognitionCoverage = summarizeCognitionCoverage(scripted);
  const evidenceFidelity = summarizeEvidenceFidelity(scripted);
  if (cognitionCoverage.evidenceFidelityNotes?.length) {
    evidenceFidelity.pass = false;
    evidenceFidelity.evidenceFidelityNotes = cognitionCoverage.evidenceFidelityNotes;
    evidenceFidelity.gaps = [
      ...(evidenceFidelity.gaps || []),
      ...cognitionCoverage.evidenceFidelityNotes.map(note => note.note)
    ];
  }
  lanes.push({
    id: 'evidence-fidelity',
    pass: evidenceFidelity.pass,
    residual: !evidenceFidelity.pass,
    details: evidenceFidelity
  });
  lanes.push({
    id: 'cognition-coverage',
    pass: cognitionCoverage.pass,
    details: cognitionCoverage
  });
  const accessibilityPersistence = summarizeAccessibilityPersistence(scripted);
  lanes.push({
    id: 'accessibility-persistence',
    pass: accessibilityPersistence.pass,
    details: accessibilityPersistence
  });

  return lanes;
}

function summarizeLanes(lanes = []) {
  const failed = lanes.filter(lane => !lane.pass && !lane.residual);
  const residual = lanes.filter(lane => !lane.pass && lane.residual);
  return {
    pass: failed.length === 0,
    total: lanes.length,
    passed: lanes.filter(lane => lane.pass).length,
    failed: failed.map(lane => lane.id),
    residual: residual.map(lane => lane.id)
  };
}

module.exports = {
  buildEvidenceLanes,
  countBy,
  summarizeCognitionCoverage,
  summarizeAccessibilityPersistence,
  summarizeBlockCells,
  summarizeContinuity,
  summarizeLanes
};
