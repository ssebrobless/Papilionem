const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CAPTURE_ROOT = path.join(ROOT, 'qa_logs', 'session_captures');
const OUTPUT_ROOT = path.join(ROOT, 'qa_logs', 'social_truth_audit');

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

function normalizePhrase(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(bella|wyatt|easton|ian|oliver)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function increment(map, key, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + amount);
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

function topEntries(map, limit = 8) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function buildReport(records, captureDir, payload) {
  const motiveCounts = new Map();
  const residueCounts = new Map();
  const stanceCounts = new Map();
  const phraseCounts = new Map();
  const normalizedPhraseCounts = new Map();
  const followThroughCounts = new Map();
  const sourceCounts = new Map();
  const weakFollowThrough = [];
  const underExpressedTargets = [
    'companionship',
    'shared-observation',
    'comfort',
    'admiration',
    'repair',
    'rivalry',
    'play',
    'flirtation'
  ];

  for (const record of records) {
    increment(motiveCounts, record.motiveFamily);
    increment(residueCounts, record.residueType || 'none');
    increment(stanceCounts, record.stance || 'unknown');
    increment(phraseCounts, record.phrase);
    increment(normalizedPhraseCounts, normalizePhrase(record.phrase));
    increment(followThroughCounts, record.followThroughState || 'none');
    increment(sourceCounts, record.sourceLabel || 'unknown');

    if (['heard', 'considering', 'none', ''].includes(record.followThroughState || 'none')) {
      weakFollowThrough.push(record);
    }
  }

  const underExpressed = underExpressedTargets
    .map(label => ({ label, count: motiveCounts.get(label) || 0 }))
    .filter(entry => entry.count < 2);

  return {
    generatedAt: new Date().toISOString(),
    captureDir,
    captureLabel: payload?.session?.label || null,
    durationMs: payload?.summary?.durationMs || 0,
    recordCount: records.length,
    warningShare: records.length ? Number(((motiveCounts.get('warning') || 0) / records.length).toFixed(3)) : 0,
    acknowledgementShare: records.length ? Number(((motiveCounts.get('acknowledgement') || 0) / records.length).toFixed(3)) : 0,
    topMotiveFamilies: topEntries(motiveCounts, 10),
    topResidueTypes: topEntries(residueCounts, 10),
    topStances: topEntries(stanceCounts, 10),
    topExactPhrases: topEntries(phraseCounts, 12),
    topNormalizedPhrasePatterns: topEntries(normalizedPhraseCounts, 12),
    followThroughCounts: topEntries(followThroughCounts, 10),
    topSourceLabels: topEntries(sourceCounts, 10),
    underExpressedFamilies: underExpressed,
    weakFollowThroughExamples: weakFollowThrough.slice(0, 12).map(record => ({
      phrase: record.phrase,
      motiveFamily: record.motiveFamily,
      residueType: record.residueType,
      stance: record.stance,
      followThroughState: record.followThroughState,
      sourceLabel: record.sourceLabel
    })),
    proofChecklist: [
      'capture repeated-line / repeated-motive dominance from real play',
      'broaden family mix away from warning-heavy loops in ordinary garden play',
      'reduce acknowledgement-only reply saturation',
      'show later behavior that proves anchoring residue mattered',
      'surface distinct pair chemistry without turning UI into truth owner'
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    '# N0 Social Truth Audit',
    '',
    `- capture: \`${report.captureDir}\``,
    `- label: \`${report.captureLabel || 'unknown'}\``,
    `- durationMs: \`${report.durationMs}\``,
    `- dialogue records: \`${report.recordCount}\``,
    '',
    '## Dominance',
    '',
    `- warning share: \`${report.warningShare}\``,
    `- acknowledgement share: \`${report.acknowledgementShare}\``,
    '',
    '## Top Motive Families',
    '',
    '| family | count |',
    '| --- | ---: |'
  ];

  for (const entry of report.topMotiveFamilies) {
    lines.push(`| ${entry.label} | ${entry.count} |`);
  }

  lines.push('', '## Top Residue Types', '', '| residue | count |', '| --- | ---: |');
  for (const entry of report.topResidueTypes) {
    lines.push(`| ${entry.label} | ${entry.count} |`);
  }

  lines.push('', '## Top Phrase Patterns', '', '| phrase pattern | count |', '| --- | ---: |');
  for (const entry of report.topNormalizedPhrasePatterns) {
    lines.push(`| ${entry.label} | ${entry.count} |`);
  }

  lines.push('', '## Under-Expressed Families', '', '| family | count |', '| --- | ---: |');
  for (const entry of report.underExpressedFamilies) {
    lines.push(`| ${entry.label} | ${entry.count} |`);
  }

  lines.push('', '## Weak Follow-Through Examples', '');
  for (const entry of report.weakFollowThroughExamples) {
    lines.push(`- \`${entry.motiveFamily}\` / \`${entry.followThroughState}\` / \`${entry.sourceLabel}\`: ${entry.phrase}`);
  }

  lines.push('', '## Proof Checklist', '');
  for (const item of report.proofChecklist) {
    lines.push(`- ${item}`);
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
      residueType: node.metadata?.residueType || 'none',
      followThroughState: node.metadata?.followThroughState || 'none',
      stance: node.metadata?.stance || 'unknown',
      sourceLabel: node.metadata?.sourceLabel || 'unknown',
      rememberability: node.metadata?.rememberability || 'none',
      tags,
      createdAtSeconds: node.createdAtSeconds || null
    };
    record.motiveFamily = classifyMotive(record);
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
  console.log(JSON.stringify({ auditDir, jsonPath, mdPath, captureDir, recordCount: report.recordCount }, null, 2));
}

run();
