const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { buildC2TraceCorpus } = require('./build-c2-trace-corpus');

const ROOT = path.resolve(__dirname, '..');
const POLICY_FAMILIES = ['actionFamily', 'targetPreference', 'signalChoice', 'riskPosture', 'autobattlePosture'];
const BASE_ARTIFACT_PATH = path.join(ROOT, 'assets', 'ml', 'm4-garden-policy.json');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'm7_policy_training');
function getArgValue(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  if (index < 0 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function resolveOutputArtifactPath() {
  const configured = getArgValue('--output-artifact');
  if (!configured) return path.join(ROOT, 'assets', 'ml', 'm7-garden-policy.json');
  return path.isAbsolute(configured) ? configured : path.join(ROOT, configured);
}

const OUTPUT_ARTIFACT_PATH = resolveOutputArtifactPath();
const MODEL_VERSION_ID = getArgValue('--model-version', 'm7-garden-policy-v1');
const HOLDOUT_SEEDS = [1101, 2202, 3303, 4404, 5505];
function getNumericArgValue(flag, fallback) {
  const value = Number(getArgValue(flag, fallback));
  return Number.isFinite(value) ? value : fallback;
}

const TRAINING_OPTIONS = Object.freeze({
  lambda: getNumericArgValue('--lambda', 0.08),
  learningRate: getNumericArgValue('--learning-rate', 0.06),
  epochs: Math.max(1, Math.round(getNumericArgValue('--epochs', 900))),
  protectedEpochs: Math.max(1, Math.round(getNumericArgValue('--protected-epochs', 1800))),
  protectedLearningRate: getNumericArgValue('--protected-learning-rate', 0.12),
  protectedLambda: getNumericArgValue('--protected-lambda', 0.01),
  protectVsHeuristicPolicies: ['signalChoice', 'autobattlePosture']
});

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function digestValue(value) {
  return crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex');
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

function createSeededRandom(seed = 1) {
  let value = Math.max(1, Math.round(Number(seed) || 1)) % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function splitRecordsByScenario(records = [], seed = 1) {
  const grouped = new Map();
  for (const record of records) {
    const scenarioId = record?.scenarioId || `record-${grouped.size}`;
    if (!grouped.has(scenarioId)) grouped.set(scenarioId, []);
    grouped.get(scenarioId).push(record);
  }
  const rng = createSeededRandom(seed);
  const scenarioIds = [...grouped.keys()];
  for (let index = scenarioIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [scenarioIds[index], scenarioIds[swapIndex]] = [scenarioIds[swapIndex], scenarioIds[index]];
  }
  const holdoutCount = Math.max(1, Math.round(scenarioIds.length * 0.2));
  const holdoutIds = new Set(scenarioIds.slice(0, holdoutCount));
  const train = [];
  const holdout = [];
  for (const [scenarioId, scenarioRecords] of grouped.entries()) {
    (holdoutIds.has(scenarioId) ? holdout : train).push(...scenarioRecords);
  }
  return {
    seed,
    train,
    holdout,
    trainScenarioCount: scenarioIds.length - holdoutIds.size,
    holdoutScenarioCount: holdoutIds.size,
    holdoutScenarioIds: [...holdoutIds].sort()
  };
}

function buildCandidateArtifact(baseArtifact, records, metadata = {}) {
  const candidate = {
    ...baseArtifact,
    modelVersionId: MODEL_VERSION_ID,
    trainedFrom: 'b6-balanced-c2-trace-corpus-heldout-ridge-linear-v1',
    training: {
      trainer: 'scripts/train-m7-garden-policy.js',
      generatedAt: new Date().toISOString(),
      baseModelVersionId: baseArtifact.modelVersionId,
      ridgeLambda: TRAINING_OPTIONS.lambda,
      learningRate: TRAINING_OPTIONS.learningRate,
      epochs: TRAINING_OPTIONS.epochs,
      defaultRuntimePromotion: false,
      ...metadata
    },
    policies: {}
  };
  for (const policyName of POLICY_FAMILIES) {
    candidate.policies[policyName] = trainPolicy(baseArtifact.policies[policyName], records, policyName, TRAINING_OPTIONS);
  }
  return candidate;
}

function summarizeHeldOutEvaluations(evaluations = []) {
  const perPolicy = {};
  for (const policyName of POLICY_FAMILIES) {
    const rows = evaluations.map(entry => entry.perPolicy[policyName]).filter(Boolean);
    const mean = key => {
      if (!rows.length) return 0;
      return rows.reduce((sum, row) => sum + Number(row?.[key] || 0), 0) / rows.length;
    };
    const std = (key, avg) => {
      if (rows.length <= 1) return 0;
      const variance = rows.reduce((sum, row) => {
        const delta = Number(row?.[key] || 0) - avg;
        return sum + (delta * delta);
      }, 0) / rows.length;
      return Math.sqrt(variance);
    };
    const artifactRateMean = mean('artifactRate');
    const heuristicRateMean = mean('heuristicRate');
    const m4RateMean = mean('m4Rate');
    perPolicy[policyName] = {
      totalMean: Number(mean('total').toFixed(3)),
      m7RateMean: Number(artifactRateMean.toFixed(3)),
      m7RateStd: Number(std('artifactRate', artifactRateMean).toFixed(3)),
      heuristicRateMean: Number(heuristicRateMean.toFixed(3)),
      m4RateMean: Number(m4RateMean.toFixed(3)),
      noHeuristicRegression: artifactRateMean + 1e-9 >= heuristicRateMean,
      beatsM4: artifactRateMean > m4RateMean + 1e-9,
      m4RegressionWithinFivePercent: artifactRateMean + 0.05 >= m4RateMean
    };
  }
  return perPolicy;
}

function evaluateHeldOut(baseArtifact = {}, records = []) {
  const runs = [];
  for (const seed of HOLDOUT_SEEDS) {
    const split = splitRecordsByScenario(records, seed);
    const candidate = buildCandidateArtifact(baseArtifact, split.train, {
      heldOutTrainingRun: true,
      seed
    });
    const m7Eval = evaluateArtifactAgainstCorpus(candidate, split.holdout);
    const m4Eval = evaluateArtifactAgainstCorpus(baseArtifact, split.holdout);
    const perPolicy = {};
    for (const policyName of POLICY_FAMILIES) {
      perPolicy[policyName] = {
        total: m7Eval.perPolicy[policyName]?.total || 0,
        artifactRate: m7Eval.perPolicy[policyName]?.artifactRate || 0,
        heuristicRate: m7Eval.perPolicy[policyName]?.heuristicRate || 0,
        m4Rate: m4Eval.perPolicy[policyName]?.artifactRate || 0,
        artifactMatches: m7Eval.perPolicy[policyName]?.artifactMatches || 0,
        heuristicMatches: m7Eval.perPolicy[policyName]?.heuristicMatches || 0,
        m4Matches: m4Eval.perPolicy[policyName]?.artifactMatches || 0
      };
    }
    runs.push({
      seed,
      trainRecordCount: split.train.length,
      holdoutRecordCount: split.holdout.length,
      trainScenarioCount: split.trainScenarioCount,
      holdoutScenarioCount: split.holdoutScenarioCount,
      holdoutScenarioIds: split.holdoutScenarioIds,
      perPolicy,
      overall: {
        m7: m7Eval.overall,
        m4: m4Eval.overall
      }
    });
  }
  const perPolicySummary = summarizeHeldOutEvaluations(runs);
  const beatsM4PolicyCount = POLICY_FAMILIES.filter(policyName => perPolicySummary[policyName].beatsM4).length;
  return {
    split: 'scenario-id-80-20',
    seeds: HOLDOUT_SEEDS,
    runs,
    perPolicy: perPolicySummary,
    promotionGate: {
      noHeuristicRegression: POLICY_FAMILIES.every(policyName => perPolicySummary[policyName].noHeuristicRegression),
      protectedPolicyNoHeuristicRegression:
        perPolicySummary.signalChoice?.noHeuristicRegression === true
        && perPolicySummary.autobattlePosture?.noHeuristicRegression === true,
      beatsM4PolicyCount,
      beatsM4AtLeastFour: beatsM4PolicyCount >= 4,
      noM4RegressionWorseThanFivePercent: POLICY_FAMILIES.every(policyName => perPolicySummary[policyName].m4RegressionWithinFivePercent),
      autobattlePostureAtLeastPointSeven: (perPolicySummary.autobattlePosture?.m7RateMean || 0) >= 0.7
    }
  };
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
  const protectedPolicy = (options.protectVsHeuristicPolicies || []).includes(policyName);
  const lambda = protectedPolicy ? Number(options.protectedLambda ?? 0.01) : Number(options.lambda ?? 0.05);
  const learningRate = protectedPolicy ? Number(options.protectedLearningRate ?? 0.12) : Number(options.learningRate ?? 0.08);
  const epochs = protectedPolicy
    ? Math.max(1, Math.round(Number(options.protectedEpochs ?? 1800)))
    : Math.max(1, Math.round(Number(options.epochs ?? 700)));
  const labels = [...(basePolicy.labels || [])];
  const featureNames = collectFeatureNames(records, basePolicy);
  const examples = records
    .filter(record => record?.trainingLabels?.[policyName])
    .map(record => {
      const corrected = Array.isArray(record?.review?.correctedPolicies)
        ? record.review.correctedPolicies.includes(policyName)
        : !!record?.review?.correctedLabels?.[policyName];
      const heuristicLabel = getTraceChosenLabel(record?.heuristicTrace, policyName);
      const protectVsHeuristic = (options.protectVsHeuristicPolicies || []).includes(policyName);
      return {
        label: protectVsHeuristic && !corrected && heuristicLabel ? heuristicLabel : record.trainingLabels[policyName],
        features: record.features?.flatFeatures || {},
        heuristicLabel,
        corrected
      };
    });
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
        const protectVsHeuristic = (options.protectVsHeuristicPolicies || []).includes(policyName);
        const heuristicAgrees = example.heuristicLabel && example.heuristicLabel === example.label;
        const classWeight = protectVsHeuristic && heuristicAgrees ? 4 : 1;
        const correctedWeight = example.corrected ? 1.35 : 1;
        const exampleWeight = classWeight * correctedWeight;
        let raw = bias;
        for (const featureName of featureNames) {
          raw += weights[featureName] * (Number(example.features[featureName]) || 0);
        }
        const error = (sigmoid(raw) - target) * exampleWeight;
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
    sourceAudit: 'train-m7-garden-policy',
    balance: true
  });
  const records = corpus.records || [];
  const baseArtifact = JSON.parse(fs.readFileSync(BASE_ARTIFACT_PATH, 'utf8'));
  const corpusDigest = digestValue({
    recordsDigest: corpus.manifest?.recordsDigest || null,
    recordCount: corpus.manifest?.recordCount || 0,
    correctedRecordCount: corpus.manifest?.correctedRecordCount || 0,
    correctedPolicyCount: corpus.manifest?.correctedPolicyCount || 0
  });
  const heldOutEvaluation = evaluateHeldOut(baseArtifact, records);
  const m7 = buildCandidateArtifact(baseArtifact, records, {
    corpusManifestPath: path.relative(ROOT, corpus.manifestPath).replace(/\\/g, '/'),
    corpusRecordsPath: path.relative(ROOT, corpus.recordsPath).replace(/\\/g, '/'),
    corpusDigest,
    heldOutEvaluation: {
      split: heldOutEvaluation.split,
      seeds: heldOutEvaluation.seeds,
      perPolicy: heldOutEvaluation.perPolicy,
      promotionGate: heldOutEvaluation.promotionGate
    }
  });

  ensureDir(path.dirname(OUTPUT_ARTIFACT_PATH));
  fs.writeFileSync(OUTPUT_ARTIFACT_PATH, JSON.stringify(m7, null, 2));
  const evaluation = {
    generatedAt: new Date().toISOString(),
    baseArtifactPath: path.relative(ROOT, BASE_ARTIFACT_PATH).replace(/\\/g, '/'),
    candidateArtifactPath: path.relative(ROOT, OUTPUT_ARTIFACT_PATH).replace(/\\/g, '/'),
    corpus: {
      manifestPath: corpus.manifestPath,
      recordsPath: corpus.recordsPath,
      manifest: corpus.manifest
    },
    heldOut: heldOutEvaluation,
    m4: evaluateArtifactAgainstCorpus(baseArtifact, records),
    m7: evaluateArtifactAgainstCorpus(m7, records)
  };
  evaluation.promotionGate = {
    corpusRecordCountAtLeastSixty: (corpus.manifest?.recordCount || 0) >= 60,
    correctedRecordCountAtLeastTwelve: (corpus.manifest?.correctedRecordCount || 0) >= 12,
    noHeuristicRegressionHeldOut: heldOutEvaluation.promotionGate.noHeuristicRegression,
    protectedPolicyNoHeuristicRegressionHeldOut: heldOutEvaluation.promotionGate.protectedPolicyNoHeuristicRegression,
    beatsM4PolicyCountHeldOut: heldOutEvaluation.promotionGate.beatsM4PolicyCount,
    beatsM4AtLeastFourHeldOut: heldOutEvaluation.promotionGate.beatsM4AtLeastFour,
    noM4RegressionWorseThanFivePercent: heldOutEvaluation.promotionGate.noM4RegressionWorseThanFivePercent,
    autobattlePostureAtLeastPointSeven: heldOutEvaluation.promotionGate.autobattlePostureAtLeastPointSeven,
    valueMetricsRequired: 'run scripts/run-ml-on-off-capture-audit.js --policy assets/ml/m7-garden-policy.json before default promotion',
    defaultPromoted: false
  };
  evaluation.promotionGate.artifactGatePass =
    evaluation.promotionGate.corpusRecordCountAtLeastSixty
    && evaluation.promotionGate.correctedRecordCountAtLeastTwelve
    && evaluation.promotionGate.protectedPolicyNoHeuristicRegressionHeldOut
    && evaluation.promotionGate.beatsM4AtLeastFourHeldOut
    && evaluation.promotionGate.noM4RegressionWorseThanFivePercent
    && evaluation.promotionGate.autobattlePostureAtLeastPointSeven;
  const evaluationPath = path.join(outputDir, 'm7-training-evaluation.json');
  fs.writeFileSync(evaluationPath, JSON.stringify(evaluation, null, 2));
  console.log(JSON.stringify({
    overall: evaluation.promotionGate.artifactGatePass ? 'candidate-artifact-pass' : 'candidate-artifact-hold',
    artifactPath: OUTPUT_ARTIFACT_PATH,
    evaluationPath,
    m4: evaluation.m4.overall,
    m7: evaluation.m7.overall,
    heldOut: {
      perPolicy: heldOutEvaluation.perPolicy,
      promotionGate: heldOutEvaluation.promotionGate
    },
    promotionGate: evaluation.promotionGate
  }, null, 2));
}

main().catch(error => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
