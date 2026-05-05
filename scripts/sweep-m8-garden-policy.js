const fs = require('fs');
const path = require('path');
const { buildC2TraceCorpus } = require('./build-c2-trace-corpus');
const {
  evaluateArtifactAgainstCorpus,
  trainCandidate
} = require('./train-m7-garden-policy');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'm8_policy_sweep');
const BASE_M4_PATH = path.join(ROOT, 'assets', 'ml', 'm4-garden-policy.json');
const DEFAULT_M7_PATH = path.join(ROOT, 'assets', 'ml', 'm7-garden-policy.json');

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

function sortCandidateRows(rows = []) {
  return [...rows].sort((left, right) => {
    const leftGate = left.promotionGate?.artifactGatePass ? 1 : 0;
    const rightGate = right.promotionGate?.artifactGatePass ? 1 : 0;
    if (leftGate !== rightGate) return rightGate - leftGate;
    const leftMatches = left.fullCorpus?.artifactTotalMatches || 0;
    const rightMatches = right.fullCorpus?.artifactTotalMatches || 0;
    if (leftMatches !== rightMatches) return rightMatches - leftMatches;
    const leftHeldOutRegressions = countHeldOutRegressions(left);
    const rightHeldOutRegressions = countHeldOutRegressions(right);
    if (leftHeldOutRegressions !== rightHeldOutRegressions) return leftHeldOutRegressions - rightHeldOutRegressions;
    return left.id.localeCompare(right.id);
  });
}

function countHeldOutRegressions(row = {}) {
  return Object.values(row.heldOut?.perPolicy || {})
    .filter(policy => policy?.noHeuristicRegression === false)
    .length;
}

function buildCandidateMatrix(options = {}) {
  const full = [
    {
      id: 'env29-bounded-repeat',
      trainingOptions: {
        epochs: 120,
        protectedEpochs: 180,
        lambda: 0.08,
        learningRate: 0.06,
        protectedLambda: 0.01,
        protectedLearningRate: 0.12
      }
    },
    {
      id: 'protected-slower',
      trainingOptions: {
        epochs: 160,
        protectedEpochs: 360,
        lambda: 0.08,
        learningRate: 0.05,
        protectedLambda: 0.006,
        protectedLearningRate: 0.08
      }
    },
    {
      id: 'target-conservative',
      trainingOptions: {
        epochs: 220,
        protectedEpochs: 300,
        lambda: 0.14,
        learningRate: 0.04,
        protectedLambda: 0.01,
        protectedLearningRate: 0.1
      }
    }
  ];
  return options.quick ? full.slice(0, 2) : full;
}

async function run() {
  const outputRoot = path.resolve(getArgValue('--output-root', OUTPUT_ROOT));
  const auditId = stamp();
  const outputDir = path.join(outputRoot, auditId);
  const candidateDir = path.join(outputDir, 'candidates');
  ensureDir(candidateDir);

  const quick = process.argv.includes('--quick');
  const matrix = buildCandidateMatrix({ quick });
  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    sourceScript: 'scripts/sweep-m8-garden-policy.js',
    mode: quick ? 'quick' : 'full',
    outputDir,
    candidateDir,
    matrix,
    corpus: null,
    baselines: null,
    candidates: [],
    recommendation: 'pending',
    overall: 'pending'
  };

  try {
    const corpus = await buildC2TraceCorpus({
      outputRoot: path.join(outputDir, 'c2_trace_corpus'),
      sourceAudit: 'm8-policy-sweep',
      balance: true
    });
    report.corpus = {
      manifestPath: corpus.manifestPath,
      recordsPath: corpus.recordsPath,
      recordCount: corpus.manifest?.recordCount || 0,
      correctedRecordCount: corpus.manifest?.correctedRecordCount || 0,
      correctedPolicyCount: corpus.manifest?.correctedPolicyCount || 0,
      scenarioFamilies: corpus.manifest?.scenarioFamilies || [],
      rebuildCheck: corpus.manifest?.rebuildCheck || null
    };

    const records = corpus.records || [];
    const m4 = JSON.parse(fs.readFileSync(BASE_M4_PATH, 'utf8'));
    const m7 = JSON.parse(fs.readFileSync(DEFAULT_M7_PATH, 'utf8'));
    report.baselines = {
      m4: evaluateArtifactAgainstCorpus(m4, records).overall,
      m7: evaluateArtifactAgainstCorpus(m7, records).overall
    };

    for (const candidateSpec of matrix) {
      const artifactPath = path.join(candidateDir, `${candidateSpec.id}.json`);
      const result = await trainCandidate({
        outputRoot: path.join(outputDir, 'training-runs'),
        auditId: candidateSpec.id,
        outputArtifactPath: artifactPath,
        modelVersionId: `m8-garden-policy-${candidateSpec.id}`,
        trainingOptions: candidateSpec.trainingOptions,
        corpus,
        sourceAudit: 'm8-policy-sweep'
      });
      report.candidates.push({
        id: candidateSpec.id,
        trainingOptions: candidateSpec.trainingOptions,
        artifactPath,
        evaluationPath: result.evaluationPath,
        overall: result.overall,
        fullCorpus: result.m7,
        heldOut: result.heldOut,
        promotionGate: result.promotionGate,
        heldOutRegressionPolicyCount: countHeldOutRegressions(result)
      });
    }

    const ranked = sortCandidateRows(report.candidates);
    const best = ranked[0] || null;
    report.bestCandidate = best ? {
      id: best.id,
      artifactPath: best.artifactPath,
      evaluationPath: best.evaluationPath,
      artifactGatePass: !!best.promotionGate?.artifactGatePass,
      fullCorpusMatches: best.fullCorpus?.artifactTotalMatches || 0,
      heldOutRegressionPolicyCount: countHeldOutRegressions(best),
      heldOutPerPolicy: best.heldOut?.perPolicy || {}
    } : null;
    report.recommendation = best?.promotionGate?.artifactGatePass
      ? 'promote-after-formal-audit'
      : 'hold-default-and-investigate-label-balance';
    report.overall = report.candidates.length === matrix.length
      && report.corpus?.recordCount >= 60
      && report.corpus?.correctedRecordCount >= 12
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
      recommendation: report.recommendation,
      reportPath: report.reportPath,
      corpus: report.corpus,
      bestCandidate: report.bestCandidate,
      candidates: report.candidates.map(candidate => ({
        id: candidate.id,
        overall: candidate.overall,
        artifactGatePass: candidate.promotionGate?.artifactGatePass || false,
        fullCorpusMatches: candidate.fullCorpus?.artifactTotalMatches || 0,
        heldOutRegressionPolicyCount: candidate.heldOutRegressionPolicyCount,
        heldOutGate: candidate.heldOut?.promotionGate || null
      }))
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run();
