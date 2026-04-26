const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CAPTURE_ROOT = path.join(ROOT, 'qa_logs', 'session_captures');
const OUTPUT_ROOT = path.join(ROOT, 'qa_logs', 'social_measurement_harness');
const FOLLOW_THROUGH_WINDOW_MINUTES = 5;
const MIN_PAIR_RECORDS = 3;
const STOPWORD_ADDRESSEES = new Set([
  'Alright',
  'Are',
  'Do',
  'Got',
  'I',
  'Look',
  'Okay'
]);
const VISIBLE_FOLLOW_THROUGH_STATES = new Set([
  'acting',
  'held',
  'held-at-distance',
  'lingering',
  'repair-open'
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function walk(value, visitor) {
  if (Array.isArray(value)) {
    for (const entry of value) walk(entry, visitor);
    return;
  }
  if (!value || typeof value !== 'object') return;
  visitor(value);
  for (const nested of Object.values(value)) {
    walk(nested, visitor);
  }
}

function increment(map, key, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + amount);
}

function topEntries(map, limit = 10) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function pickLatestCaptureDir(explicitPath = null) {
  if (explicitPath) {
    const resolved = path.resolve(ROOT, explicitPath);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return resolved;
    }
    throw new Error(`Capture directory does not exist: ${resolved}`);
  }
  const entries = fs.readdirSync(CAPTURE_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'v0-baseline')
    .map(entry => path.join(CAPTURE_ROOT, entry.name))
    .filter(dir => fs.existsSync(path.join(dir, 'capture.json')))
    .sort((left, right) => right.localeCompare(left));
  return entries[0] || null;
}

function normalizePhrase(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyMotive(record) {
  const tags = new Set(record.tags || []);
  if (record.residueType === 'protective-warning' || tags.has('warning')) return 'warning';
  if (record.residueType === 'heard-lesson' || tags.has('teaching')) return 'teaching';
  if (record.residueType === 'warm-company' || tags.has('companionship')) return 'companionship';
  if (record.residueType === 'shared-observation' || tags.has('shared_attention')) return 'shared-observation';
  if ((record.residueType || '').includes('comfort') || tags.has('comfort')) return 'comfort';
  if (tags.has('admiration')) return 'admiration';
  if (tags.has('repair')) return 'repair';
  if (tags.has('rivalry')) return 'rivalry';
  if (tags.has('play') || tags.has('playful')) return 'play';
  if (tags.has('flirtation') || tags.has('courtship')) return 'flirtation';
  if (record.residueType === 'acknowledged' || tags.has('agreement')) return 'acknowledgement';
  return 'other';
}

function extractAddressee(phrase) {
  const trimmed = String(phrase || '').trim();
  const commaMatch = trimmed.match(/^([A-Z][A-Za-z]+)\s*,/);
  if (commaMatch && !STOPWORD_ADDRESSEES.has(commaMatch[1])) {
    return commaMatch[1];
  }
  const directMatch = trimmed.match(/^([A-Z][A-Za-z]+)\s+(?:how|are|do|look|you)\b/);
  if (directMatch && !STOPWORD_ADDRESSEES.has(directMatch[1])) {
    return directMatch[1];
  }
  return null;
}

function entropy(probabilities) {
  return probabilities.reduce((sum, value) => {
    if (!value) return sum;
    return sum - (value * Math.log2(value));
  }, 0);
}

function jensenShannonDivergence(leftCounts, rightCounts) {
  const keys = new Set([...leftCounts.keys(), ...rightCounts.keys()]);
  const leftTotal = [...leftCounts.values()].reduce((sum, value) => sum + value, 0);
  const rightTotal = [...rightCounts.values()].reduce((sum, value) => sum + value, 0);
  if (!leftTotal || !rightTotal) return 0;
  const leftProbabilities = [];
  const rightProbabilities = [];
  const meanProbabilities = [];
  for (const key of keys) {
    const leftValue = (leftCounts.get(key) || 0) / leftTotal;
    const rightValue = (rightCounts.get(key) || 0) / rightTotal;
    const meanValue = (leftValue + rightValue) / 2;
    leftProbabilities.push(leftValue);
    rightProbabilities.push(rightValue);
    meanProbabilities.push(meanValue);
  }
  return Number((
    entropy(meanProbabilities) - ((entropy(leftProbabilities) + entropy(rightProbabilities)) / 2)
  ).toFixed(4));
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return Number(sorted[middle].toFixed(4));
  return Number((((sorted[middle - 1] + sorted[middle]) / 2)).toFixed(4));
}

function buildReport(records, captureDir, payload) {
  const motiveCounts = new Map();
  const talkModeCounts = new Map();
  const followThroughCounts = new Map();
  const resolvedAddresseeCounts = new Map();
  const pairRecords = new Map();

  for (const record of records) {
    increment(motiveCounts, record.motiveFamily);
    increment(talkModeCounts, record.talkMode || 'unknown');
    increment(followThroughCounts, record.followThroughState || 'none');
    if (record.addresseeLabel) {
      increment(resolvedAddresseeCounts, record.addresseeLabel);
      const pairKey = `${record.sourceLabel} -> ${record.addresseeLabel}`;
      if (!pairRecords.has(pairKey)) {
        pairRecords.set(pairKey, []);
      }
      pairRecords.get(pairKey).push(record);
    }
  }

  const resolvedPairEntries = [...pairRecords.entries()]
    .map(([pairKey, pairLines]) => ({ pairKey, records: pairLines }))
    .filter(entry => entry.records.length >= MIN_PAIR_RECORDS)
    .map(entry => {
      const distribution = new Map();
      for (const record of entry.records) {
        increment(distribution, record.motiveFamily);
      }
      return {
        pairKey: entry.pairKey,
        recordCount: entry.records.length,
        distribution,
        topMotives: topEntries(distribution, 4)
      };
    })
    .sort((left, right) => right.recordCount - left.recordCount || left.pairKey.localeCompare(right.pairKey));

  const divergenceRows = [];
  for (let index = 0; index < resolvedPairEntries.length; index += 1) {
    for (let inner = index + 1; inner < resolvedPairEntries.length; inner += 1) {
      const left = resolvedPairEntries[index];
      const right = resolvedPairEntries[inner];
      divergenceRows.push({
        leftPair: left.pairKey,
        rightPair: right.pairKey,
        jsDivergence: jensenShannonDivergence(left.distribution, right.distribution)
      });
    }
  }
  divergenceRows.sort((left, right) => right.jsDivergence - left.jsDivergence || left.leftPair.localeCompare(right.leftPair));

  const anchoringRecords = records.filter(record => (record.residueType || 'none') !== 'none');
  const visibleFollowThroughRecords = anchoringRecords.filter(record =>
    VISIBLE_FOLLOW_THROUGH_STATES.has(record.followThroughState || 'none')
  );

  const unresolvedSingleTargetCount = records.filter(record =>
    record.talkMode === 'single_target' && !record.addresseeLabel
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    captureDir,
    captureLabel: payload?.session?.label || null,
    durationMs: payload?.summary?.durationMs || 0,
    dialogueRecordCount: records.length,
    motiveDistribution: topEntries(motiveCounts, 12),
    talkModeDistribution: topEntries(talkModeCounts, 6),
    followThroughStateDistribution: topEntries(followThroughCounts, 12),
    resolvedAddresseeDistribution: topEntries(resolvedAddresseeCounts, 12),
    pairDistinctness: {
      metric: 'Jensen-Shannon divergence over resolved single-target pair motive distributions',
      minimumPairRecords: MIN_PAIR_RECORDS,
      resolvedPairCount: resolvedPairEntries.length,
      resolvedDialogueCount: resolvedPairEntries.reduce((sum, entry) => sum + entry.recordCount, 0),
      unresolvedSingleTargetCount,
      averageJsDivergence: divergenceRows.length
        ? Number((divergenceRows.reduce((sum, row) => sum + row.jsDivergence, 0) / divergenceRows.length).toFixed(4))
        : 0,
      medianJsDivergence: divergenceRows.length
        ? median(divergenceRows.map(row => row.jsDivergence))
        : 0,
      mostDistinctPairs: divergenceRows.slice(0, 8),
      leastDistinctPairs: [...divergenceRows].reverse().slice(0, 8).reverse(),
      topResolvedPairs: resolvedPairEntries.slice(0, 12).map(entry => ({
        pairKey: entry.pairKey,
        recordCount: entry.recordCount,
        topMotives: entry.topMotives
      }))
    },
    followThroughProxy: {
      windowMinutes: FOLLOW_THROUGH_WINDOW_MINUTES,
      methodology: 'Uses the capture-owned followThroughState marker as the current proxy for visible follow-through until later event-linked timing proof lands.',
      anchoringResidueCount: anchoringRecords.length,
      visibleFollowThroughCount: visibleFollowThroughRecords.length,
      visibleFollowThroughRate: anchoringRecords.length
        ? Number((visibleFollowThroughRecords.length / anchoringRecords.length).toFixed(3))
        : 0,
      visibleStates: [...VISIBLE_FOLLOW_THROUGH_STATES.values()],
      weakestStates: topEntries(
        new Map(
          [...followThroughCounts.entries()].filter(([key]) => !VISIBLE_FOLLOW_THROUGH_STATES.has(key))
        ),
        8
      ),
      strongestVisibleExamples: visibleFollowThroughRecords.slice(0, 12).map(record => ({
        sourceLabel: record.sourceLabel,
        addresseeLabel: record.addresseeLabel,
        motiveFamily: record.motiveFamily,
        residueType: record.residueType,
        followThroughState: record.followThroughState,
        phrase: record.phrase
      }))
    },
    measurementNotes: [
      'Resolved pairs currently depend on addressee extraction from the emitted phrase because the live capture format does not yet persist explicit target labels on every dialogue residue.',
      'Unresolved single-target lines remain visible in the output so the next social phases can decide whether target persistence itself needs to widen.',
      'The follow-through rate is a proxy over life-sim-owned followThroughState, not a UI-derived guess.'
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    '# N0.5 Social Measurement Harness',
    '',
    `- capture: \`${report.captureDir}\``,
    `- label: \`${report.captureLabel || 'unknown'}\``,
    `- durationMs: \`${report.durationMs}\``,
    `- dialogue records: \`${report.dialogueRecordCount}\``,
    '',
    '## Motive Distribution',
    '',
    '| family | count |',
    '| --- | ---: |'
  ];

  for (const entry of report.motiveDistribution) {
    lines.push(`| ${entry.label} | ${entry.count} |`);
  }

  lines.push('', '## Pair Distinctness', '');
  lines.push(`- metric: \`${report.pairDistinctness.metric}\``);
  lines.push(`- minimumPairRecords: \`${report.pairDistinctness.minimumPairRecords}\``);
  lines.push(`- resolvedPairCount: \`${report.pairDistinctness.resolvedPairCount}\``);
  lines.push(`- unresolvedSingleTargetCount: \`${report.pairDistinctness.unresolvedSingleTargetCount}\``);
  lines.push(`- averageJsDivergence: \`${report.pairDistinctness.averageJsDivergence}\``);
  lines.push(`- medianJsDivergence: \`${report.pairDistinctness.medianJsDivergence}\``);

  lines.push('', '### Top Resolved Pairs', '', '| pair | lines | top motives |', '| --- | ---: | --- |');
  for (const entry of report.pairDistinctness.topResolvedPairs) {
    const motives = entry.topMotives.map(motive => `${motive.label} (${motive.count})`).join(', ');
    lines.push(`| ${entry.pairKey} | ${entry.recordCount} | ${motives} |`);
  }

  lines.push('', '### Most Distinct Pair Comparisons', '', '| left pair | right pair | JS divergence |', '| --- | --- | ---: |');
  for (const entry of report.pairDistinctness.mostDistinctPairs) {
    lines.push(`| ${entry.leftPair} | ${entry.rightPair} | ${entry.jsDivergence} |`);
  }

  lines.push('', '### Least Distinct Pair Comparisons', '', '| left pair | right pair | JS divergence |', '| --- | --- | ---: |');
  for (const entry of report.pairDistinctness.leastDistinctPairs) {
    lines.push(`| ${entry.leftPair} | ${entry.rightPair} | ${entry.jsDivergence} |`);
  }

  lines.push('', '## Follow-Through Proxy', '');
  lines.push(`- windowMinutes: \`${report.followThroughProxy.windowMinutes}\``);
  lines.push(`- anchoringResidueCount: \`${report.followThroughProxy.anchoringResidueCount}\``);
  lines.push(`- visibleFollowThroughCount: \`${report.followThroughProxy.visibleFollowThroughCount}\``);
  lines.push(`- visibleFollowThroughRate: \`${report.followThroughProxy.visibleFollowThroughRate}\``);
  lines.push(`- methodology: ${report.followThroughProxy.methodology}`);

  lines.push('', '### Weakest States', '', '| state | count |', '| --- | ---: |');
  for (const entry of report.followThroughProxy.weakestStates) {
    lines.push(`| ${entry.label} | ${entry.count} |`);
  }

  lines.push('', '### Strong Visible Examples', '');
  for (const entry of report.followThroughProxy.strongestVisibleExamples) {
    lines.push(`- \`${entry.sourceLabel}\` -> \`${entry.addresseeLabel || 'unresolved'}\` / \`${entry.motiveFamily}\` / \`${entry.followThroughState}\`: ${entry.phrase}`);
  }

  lines.push('', '## Measurement Notes', '');
  for (const note of report.measurementNotes) {
    lines.push(`- ${note}`);
  }

  lines.push('');
  return lines.join('\n');
}

function run() {
  ensureDir(OUTPUT_ROOT);
  const captureDir = pickLatestCaptureDir(process.argv[2] || null);
  if (!captureDir) {
    throw new Error('No capture.json directory was found under qa_logs/session_captures.');
  }
  const capturePath = path.join(captureDir, 'capture.json');
  const payload = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
  const recordsById = new Map();

  walk(payload, node => {
    const phrase = node?.metadata?.phrase;
    const tags = Array.isArray(node?.tags) ? node.tags : [];
    if (typeof phrase !== 'string' || !phrase.trim()) return;
    if (!tags.includes('dialogue')) return;

    const record = {
      id: node.id || `${node.family || 'unknown'}|${node.subjectId || 'none'}|${node.metadata?.sourceLabel || 'unknown'}|${node.createdAtSeconds || ''}|${phrase}`,
      family: node.family || 'unknown',
      subjectId: node.subjectId || null,
      phrase: phrase.trim(),
      normalizedPhrase: normalizePhrase(phrase),
      residueType: node.metadata?.residueType || 'none',
      followThroughState: node.metadata?.followThroughState || 'none',
      stance: node.metadata?.stance || 'unknown',
      sourceLabel: node.metadata?.sourceLabel || 'unknown',
      rememberability: node.metadata?.rememberability || 'none',
      talkMode: node.metadata?.talkMode || 'unknown',
      tags,
      createdAtSeconds: node.createdAtSeconds || null
    };
    record.motiveFamily = classifyMotive(record);
    record.addresseeLabel = record.talkMode === 'single_target'
      ? extractAddressee(record.phrase)
      : null;
    if (!recordsById.has(record.id)) {
      recordsById.set(record.id, record);
    }
  });

  const records = [...recordsById.values()];
  const report = buildReport(records, captureDir, payload);
  const auditDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(auditDir);
  const jsonPath = path.join(auditDir, 'report.json');
  const mdPath = path.join(auditDir, 'REPORT.md');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(mdPath, renderMarkdown(report), 'utf8');
  console.log(JSON.stringify({
    auditDir,
    jsonPath,
    mdPath,
    captureDir,
    dialogueRecordCount: report.dialogueRecordCount,
    resolvedPairCount: report.pairDistinctness.resolvedPairCount,
    averageJsDivergence: report.pairDistinctness.averageJsDivergence,
    visibleFollowThroughRate: report.followThroughProxy.visibleFollowThroughRate
  }, null, 2));
}

run();
