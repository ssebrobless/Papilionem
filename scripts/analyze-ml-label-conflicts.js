const fs = require('fs');
const path = require('path');
const { buildC2TraceCorpus } = require('./build-c2-trace-corpus');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ml_label_conflict_analysis');
const POLICY_FAMILIES = ['targetPreference', 'autobattlePosture'];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function getArgValue(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  if (index < 0 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function normalizePath(inputPath = '') {
  if (!inputPath) return null;
  return path.isAbsolute(inputPath) ? inputPath : path.join(ROOT, inputPath);
}

function getTrainingLabel(record = {}, policyName = '') {
  return record?.trainingLabels?.[policyName] || record?.review?.correctedLabels?.[policyName] || null;
}

function getScenarioFamily(record = {}) {
  return record?.scenarioFamily || 'unknown';
}

function getRecordFeatureMap(record = {}) {
  return record?.features?.flatFeatures || {};
}

function featureDistance(left = {}, right = {}, featureNames = []) {
  if (!featureNames.length) return 1;
  let sum = 0;
  for (const featureName of featureNames) {
    const delta = Number(left[featureName] || 0) - Number(right[featureName] || 0);
    sum += delta * delta;
  }
  return Math.sqrt(sum / featureNames.length);
}

function compactFeatureDelta(left = {}, right = {}, featureNames = [], limit = 8) {
  return featureNames
    .map(featureName => ({
      featureName,
      left: Number(left[featureName] || 0),
      right: Number(right[featureName] || 0),
      delta: Math.abs(Number(left[featureName] || 0) - Number(right[featureName] || 0))
    }))
    .filter(entry => entry.delta > 0.001)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit);
}

function buildFeatureNames(rows = []) {
  const names = new Set();
  for (const row of rows) {
    for (const featureName of Object.keys(row.features || {})) {
      names.add(featureName);
    }
  }
  return [...names].sort();
}

function incrementNested(map, outer, inner) {
  if (!map[outer]) map[outer] = {};
  map[outer][inner] = (map[outer][inner] || 0) + 1;
}

function analyzePolicy(records = [], policyName = '') {
  const rows = records
    .map((record, index) => ({
      index,
      scenarioId: record?.scenarioId || `record-${index}`,
      scenarioFamily: getScenarioFamily(record),
      label: getTrainingLabel(record, policyName),
      corrected: Array.isArray(record?.review?.correctedPolicies)
        ? record.review.correctedPolicies.includes(policyName)
        : !!record?.review?.correctedLabels?.[policyName],
      features: getRecordFeatureMap(record),
      activePrediction: record?.activeTrace?.chosenPath?.[policyName]
        || record?.activeTrace?.traces?.[policyName]?.chosen
        || (policyName === 'autobattlePosture' ? record?.activeTrace?.chosen : null)
        || null,
      heuristicPrediction: record?.heuristicTrace?.chosenPath?.[policyName]
        || record?.heuristicTrace?.traces?.[policyName]?.chosen
        || (policyName === 'autobattlePosture' ? record?.heuristicTrace?.chosen : null)
        || null
    }))
    .filter(row => !!row.label);

  const labelCounts = {};
  const familyLabelCounts = {};
  const correctedCounts = {};
  for (const row of rows) {
    labelCounts[row.label] = (labelCounts[row.label] || 0) + 1;
    incrementNested(familyLabelCounts, row.scenarioFamily, row.label);
    if (row.corrected) correctedCounts[row.label] = (correctedCounts[row.label] || 0) + 1;
  }

  const featureNames = buildFeatureNames(rows);
  const pairConflicts = [];
  for (let leftIndex = 0; leftIndex < rows.length; leftIndex += 1) {
    const left = rows[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < rows.length; rightIndex += 1) {
      const right = rows[rightIndex];
      if (left.label === right.label) continue;
      const distance = featureDistance(left.features, right.features, featureNames);
      pairConflicts.push({
        distance: Number(distance.toFixed(5)),
        left: {
          scenarioId: left.scenarioId,
          scenarioFamily: left.scenarioFamily,
          label: left.label,
          corrected: left.corrected,
          heuristicPrediction: left.heuristicPrediction,
          activePrediction: left.activePrediction
        },
        right: {
          scenarioId: right.scenarioId,
          scenarioFamily: right.scenarioFamily,
          label: right.label,
          corrected: right.corrected,
          heuristicPrediction: right.heuristicPrediction,
          activePrediction: right.activePrediction
        },
        largestFeatureDeltas: compactFeatureDelta(left.features, right.features, featureNames)
      });
    }
  }
  pairConflicts.sort((left, right) => left.distance - right.distance);

  const nearConflictThreshold = policyName === 'targetPreference' ? 0.075 : 0.085;
  const nearConflicts = pairConflicts.filter(entry => entry.distance <= nearConflictThreshold);
  const broadLabelCount = Object.keys(labelCounts).length;
  const dominantLabel = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const correctionRatio = rows.length
    ? Object.values(correctedCounts).reduce((sum, count) => sum + count, 0) / rows.length
    : 0;

  let diagnosis = 'healthy-enough';
  if (nearConflicts.length >= 12) {
    diagnosis = 'feature-ambiguous-label-conflicts';
  } else if (dominantLabel && dominantLabel[1] / Math.max(1, rows.length) >= 0.72) {
    diagnosis = 'label-imbalance';
  } else if (correctionRatio >= 0.35 && nearConflicts.length >= 4) {
    diagnosis = 'corrected-label-overlap';
  } else if (broadLabelCount <= 2) {
    diagnosis = 'low-label-diversity';
  }

  return {
    policyName,
    recordCount: rows.length,
    labelCounts,
    correctedCounts,
    familyLabelCounts,
    featureCount: featureNames.length,
    nearConflictThreshold,
    nearConflictCount: nearConflicts.length,
    closestConflicts: pairConflicts.slice(0, 20),
    diagnosis,
    recommendation: buildPolicyRecommendation(policyName, diagnosis, {
      nearConflictCount: nearConflicts.length,
      dominantLabel: dominantLabel ? { label: dominantLabel[0], count: dominantLabel[1] } : null,
      correctionRatio: Number(correctionRatio.toFixed(3))
    })
  };
}

function buildPolicyRecommendation(policyName, diagnosis, details = {}) {
  if (diagnosis === 'feature-ambiguous-label-conflicts') {
    return `Before retraining ${policyName}, add or audit features that distinguish the closest conflicting records; current flat features make incompatible labels look too similar.`;
  }
  if (diagnosis === 'corrected-label-overlap') {
    return `Review broad corrected labels for ${policyName}; several corrected cases overlap near opposite labels and may need narrower scenario-specific corrections.`;
  }
  if (diagnosis === 'label-imbalance') {
    return `Add counterexamples for ${policyName}; dominant label ${details.dominantLabel?.label || 'unknown'} is overrepresented.`;
  }
  if (diagnosis === 'low-label-diversity') {
    return `Add more ${policyName} label diversity before another candidate sweep.`;
  }
  return `No severe ${policyName} label conflict found; candidate failures may be training hyperparameters or missing held-out coverage.`;
}

async function loadCorpus(options = {}) {
  const recordsPath = normalizePath(options.recordsPath);
  const manifestPath = normalizePath(options.manifestPath);
  if (recordsPath) {
    const records = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
    const manifest = manifestPath && fs.existsSync(manifestPath)
      ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      : null;
    return {
      source: 'provided-records',
      recordsPath,
      manifestPath,
      records,
      manifest
    };
  }
  const built = await buildC2TraceCorpus({
    outputRoot: options.outputRoot,
    sourceAudit: 'ml-label-conflict-analysis',
    balance: true
  });
  return {
    source: 'fresh-build',
    recordsPath: built.recordsPath,
    manifestPath: built.manifestPath,
    records: built.records,
    manifest: built.manifest
  };
}

async function run() {
  const outputRoot = path.resolve(getArgValue('--output-root', OUTPUT_ROOT));
  const outputDir = path.join(outputRoot, stamp());
  ensureDir(outputDir);
  const report = {
    auditId: path.basename(outputDir),
    startedAt: new Date().toISOString(),
    sourceScript: 'scripts/analyze-ml-label-conflicts.js',
    outputDir,
    corpus: null,
    policies: {},
    overall: 'pending'
  };

  try {
    const corpus = await loadCorpus({
      recordsPath: getArgValue('--records'),
      manifestPath: getArgValue('--manifest'),
      outputRoot: path.join(outputDir, 'c2_trace_corpus')
    });
    report.corpus = {
      source: corpus.source,
      recordsPath: corpus.recordsPath,
      manifestPath: corpus.manifestPath,
      recordCount: corpus.records.length,
      manifestRecordCount: corpus.manifest?.recordCount || null,
      scenarioFamilies: corpus.manifest?.scenarioFamilies || []
    };

    for (const policyName of POLICY_FAMILIES) {
      report.policies[policyName] = analyzePolicy(corpus.records, policyName);
    }
    report.overall = POLICY_FAMILIES.every(policyName => report.policies[policyName]?.recordCount > 0)
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    report.finishedAt = new Date().toISOString();
    report.reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath: report.reportPath,
      corpus: report.corpus,
      policySummaries: Object.fromEntries(Object.entries(report.policies).map(([policy, summary]) => [policy, {
        recordCount: summary.recordCount,
        labelCounts: summary.labelCounts,
        nearConflictCount: summary.nearConflictCount,
        diagnosis: summary.diagnosis,
        recommendation: summary.recommendation
      }]))
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run();
