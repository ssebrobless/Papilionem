function countBy(items = [], keyFn) {
  const counts = {};
  for (const item of items || []) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
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
  lanes.push({
    id: 'flower-lifecycle',
    pass: !!scripted.flowerLifecycle?.evidenceCaptured,
    details: {
      flowerLifecycle: scripted.flowerLifecycle || null,
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
  summarizeBlockCells,
  summarizeContinuity,
  summarizeLanes
};
