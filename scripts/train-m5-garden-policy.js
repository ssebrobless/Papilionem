const fs = require('fs');
const path = require('path');
const { buildC2TraceCorpus } = require('./build-c2-trace-corpus');

const ROOT = path.resolve(__dirname, '..');
const POLICY_FAMILIES = ['actionFamily', 'targetPreference', 'signalChoice', 'riskPosture', 'autobattlePosture'];
const BASE_ARTIFACT_PATH = path.join(ROOT, 'assets', 'ml', 'm4-garden-policy.json');
const OUTPUT_ARTIFACT_PATH = path.join(ROOT, 'assets', 'ml', 'm5-garden-policy.json');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'm5_policy_training');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sigmoid(value) {
  const clamped = Math.max(-40, Math.min(40, Number(value) || 0));
  return 1 / (1 + Math.exp(-clamped));
}

function scoreLinearPolicy(policyDefinition = {}, flatFeatures = {}) {
  const scores = {};
  for (const label of policyDefinition.labels || []) {
    let rawScore = Number(policyDefinition.bias?.[label] || 0);
    const labelWeights = policyDefinition.weights?.[label] || {};
    for (const [featureName, weight] of Object.entries(labelWeights)) {
      rawScore += (Number(flatFeatures[featureName]) || 0) * Number(weight || 0);
    }
    scores[label] = sigmoid(rawScore);
  }
  return scores;
}

function pickBestLabel(scores = {}) {
  let bestLabel = null;
  let bestScore = -Infinity;
  for (const [label, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestLabel = label;
      bestScore = score;
    }
  }
  return bestLabel;
}

function getTraceChosenLabel(trace = null, policyName = '') {
  if (!trace || !policyName) return null;
  if (typeof trace.chosenPath?.[policyName] === 'string') return trace.chosenPath[policyName];
  if (policyName === 'autobattlePosture' && typeof trace.chosen === 'string') return trace.chosen;
  if (typeof trace.traces?.[policyName]?.chosen === 'string') return trace.traces[policyName].chosen;
  return null;
}

function evaluateArtifactAgainstCorpus(artifact = {}, records = []) {
  const perPolicy = {};
  const overall = {
    recordCount: records.length,
    evaluatedPolicyCount: 0,
    artifactTotalMatches: 0,
    heuristicTotalMatches: 0
  };
  for (const policyName of POLICY_FAMILIES) {
    perPolicy[policyName] = {
      total: 0,
      artifactMatches: 0,
      heuristicMatches: 0,
      artifactRate: 0,
      heuristicRate: 0,
      beatsHeuristic: false
    };
  }
  for (const record of records) {
    const flatFeatures = record?.features?.flatFeatures || {};
    for (const policyName of POLICY_FAMILIES) {
      const label = record?.trainingLabels?.[policyName] || null;
      const policy = artifact?.policies?.[policyName] || null;
      if (!label || !policy) continue;
      const artifactPrediction = pickBestLabel(scoreLinearPolicy(policy, flatFeatures));
      const heuristicPrediction = getTraceChosenLabel(record?.heuristicTrace, policyName);
      const artifactMatches = artifactPrediction === label;
      const heuristicMatches = heuristicPrediction === label;
      const summary = perPolicy[policyName];
      summary.total += 1;
      if (artifactMatches) {
        summary.artifactMatches += 1;
        overall.artifactTotalMatches += 1;
      }
      if (heuristicMatches) {
        summary.heuristicMatches += 1;
        overall.heuristicTotalMatches += 1;
      }
      overall.evaluatedPolicyCount += 1;
    }
  }
  for (const policyName of POLICY_FAMILIES) {
    const summary = perPolicy[policyName];
    summary.artifactRate = summary.total ? Number((summary.artifactMatches / summary.total).toFixed(3)) : 0;
    summary.heuristicRate = summary.total ? Number((summary.heuristicMatches / summary.total).toFixed(3)) : 0;
    summary.beatsHeuristic = summary.artifactMatches > summary.heuristicMatches;
  }
  return { overall, perPolicy };
}

function collectFeatureNames(records = [], basePolicy = null) {
  const featureNames = new Set();
  for (const weights of Object.values(basePolicy?.weights || {})) {
    for (const featureName of Object.keys(weights || {})) featureNames.add(featureName);
  }
  for (const record of records) {
    for (const featureName of Object.keys(record?.features?.flatFeatures || {})) {
      featureNames.add(featureName);
    }
  }
  return [...featureNames].sort();
}

function trainPolicy(basePolicy, records, policyName, options = {}) {
  const lambda = Number(options.lambda ?? 0.05);
  const learningRate = Number(options.learningRate ?? 0.08);
  const epochs = Math.max(1, Math.round(Number(options.epochs ?? 700)));
  const labels = [...(basePolicy.labels || [])];
  const featureNames = collectFeatureNames(records, basePolicy);
  const examples = records
    .filter(record => record?.trainingLabels?.[policyName])
    .map(record => ({
      label: record.trainingLabels[policyName],
      features: record.features?.flatFeatures || {}
    }));
  const nextPolicy = {
    labels,
    bias: {},
    weights: {}
  };

  for (const label of labels) {
    const baseBias = Number(basePolicy.bias?.[label] || 0);
    let bias = baseBias;
    const weights = {};
    const baseWeights = {};
    for (const featureName of featureNames) {
      const baseWeight = Number(basePolicy.weights?.[label]?.[featureName] || 0);
      weights[featureName] = baseWeight;
      baseWeights[featureName] = baseWeight;
    }
    for (let epoch = 0; epoch < epochs; epoch += 1) {
      let biasGrad = 0;
      const weightGrad = Object.fromEntries(featureNames.map(featureName => [featureName, 0]));
      for (const example of examples) {
        const target = example.label === label ? 1 : 0;
        let raw = bias;
        for (const featureName of featureNames) {
          raw += weights[featureName] * (Number(example.features[featureName]) || 0);
        }
        const error = sigmoid(raw) - target;
        biasGrad += error;
        for (const featureName of featureNames) {
          weightGrad[featureName] += error * (Number(example.features[featureName]) || 0);
        }
      }
      const divisor = Math.max(1, examples.length);
      bias -= learningRate * ((biasGrad / divisor) + (lambda * 0.25 * (bias - baseBias)));
      for (const featureName of featureNames) {
        const ridge = lambda * (weights[featureName] - baseWeights[featureName]);
        weights[featureName] -= learningRate * ((weightGrad[featureName] / divisor) + ridge);
      }
    }
    nextPolicy.bias[label] = Number(bias.toFixed(6));
    nextPolicy.weights[label] = {};
    for (const featureName of featureNames) {
      const value = Number(weights[featureName].toFixed(6));
      if (Math.abs(value) >= 0.0005) nextPolicy.weights[label][featureName] = value;
    }
  }
  return nextPolicy;
}

async function main() {
  ensureDir(OUTPUT_ROOT);
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);

  const corpus = await buildC2TraceCorpus({
    outputRoot: path.join(outputDir, 'c2_trace_corpus'),
    sourceAudit: 'train-m5-garden-policy'
  });
  const records = corpus.records || [];
  const baseArtifact = JSON.parse(fs.readFileSync(BASE_ARTIFACT_PATH, 'utf8'));
  const m5 = {
    ...baseArtifact,
    modelVersionId: 'm5-garden-policy-v1',
    trainedFrom: 'c2-trace-corpus-ridge-regularized-linear-v1',
    training: {
      trainer: 'scripts/train-m5-garden-policy.js',
      generatedAt: new Date().toISOString(),
      baseModelVersionId: baseArtifact.modelVersionId,
      corpusManifestPath: path.relative(ROOT, corpus.manifestPath).replace(/\\/g, '/'),
      corpusRecordsPath: path.relative(ROOT, corpus.recordsPath).replace(/\\/g, '/'),
      ridgeLambda: 0.05,
      epochs: 700,
      defaultRuntimePromotion: false
    },
    policies: {}
  };

  for (const policyName of POLICY_FAMILIES) {
    m5.policies[policyName] = trainPolicy(baseArtifact.policies[policyName], records, policyName);
  }

  ensureDir(path.dirname(OUTPUT_ARTIFACT_PATH));
  fs.writeFileSync(OUTPUT_ARTIFACT_PATH, JSON.stringify(m5, null, 2));
  const evaluation = {
    generatedAt: new Date().toISOString(),
    baseArtifactPath: path.relative(ROOT, BASE_ARTIFACT_PATH).replace(/\\/g, '/'),
    candidateArtifactPath: path.relative(ROOT, OUTPUT_ARTIFACT_PATH).replace(/\\/g, '/'),
    corpus: {
      manifestPath: corpus.manifestPath,
      recordsPath: corpus.recordsPath,
      manifest: corpus.manifest
    },
    m4: evaluateArtifactAgainstCorpus(baseArtifact, records),
    m5: evaluateArtifactAgainstCorpus(m5, records)
  };
  evaluation.promotionGate = {
    artifactMatchBeatsM4:
      evaluation.m5.overall.artifactTotalMatches > evaluation.m4.overall.artifactTotalMatches,
    noPolicyRegression: POLICY_FAMILIES.every(policyName =>
      evaluation.m5.perPolicy[policyName].artifactMatches >= evaluation.m4.perPolicy[policyName].artifactMatches
    ),
    valueMetricsRequired: 'run scripts/run-ml-on-off-capture-audit.js --policy assets/ml/m5-garden-policy.json with shipped cadence; promote only if >=3/6 metrics improve',
    defaultPromoted: false
  };
  evaluation.promotionGate.artifactGatePass =
    evaluation.promotionGate.artifactMatchBeatsM4 && evaluation.promotionGate.noPolicyRegression;
  const evaluationPath = path.join(outputDir, 'm5-training-evaluation.json');
  fs.writeFileSync(evaluationPath, JSON.stringify(evaluation, null, 2));
  console.log(JSON.stringify({
    overall: evaluation.promotionGate.artifactGatePass ? 'candidate-artifact-pass' : 'candidate-artifact-hold',
    artifactPath: OUTPUT_ARTIFACT_PATH,
    evaluationPath,
    m4: evaluation.m4.overall,
    m5: evaluation.m5.overall,
    promotionGate: evaluation.promotionGate
  }, null, 2));
}

main().catch(error => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
