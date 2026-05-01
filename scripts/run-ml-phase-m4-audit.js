const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { buildC2TraceCorpus } = require('./build-c2-trace-corpus');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ml_phase_m4_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];
const POLICY_FAMILIES = ['actionFamily', 'targetPreference', 'signalChoice', 'riskPosture', 'autobattlePosture'];
const POLICY_ARG_INDEX = process.argv.indexOf('--policy');
const POLICY_ARG = POLICY_ARG_INDEX >= 0 ? process.argv[POLICY_ARG_INDEX + 1] : null;
const EVAL_THRESHOLDS = Object.freeze({
  minRecordCount: 4,
  minScenarioCount: 4,
  minReviewedRecordCount: 3,
  minCorrectedRecordCount: 1,
  minCorrectedPolicyCount: 1,
  minCorrectedImprovementCount: 1
});

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sigmoid(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0.5;
  return 1 / (1 + Math.exp(-numeric));
}

function scoreLinearPolicy(policyDefinition = {}, flatFeatures = {}) {
  const labels = Array.isArray(policyDefinition.labels) ? policyDefinition.labels : [];
  const bias = policyDefinition.bias || {};
  const weights = policyDefinition.weights || {};
  const scores = {};

  for (const label of labels) {
    let rawScore = Number(bias[label] || 0);
    const labelWeights = weights[label] || {};
    for (const [featureName, weight] of Object.entries(labelWeights)) {
      rawScore += (flatFeatures[featureName] || 0) * Number(weight || 0);
    }
    scores[label] = sigmoid(rawScore);
  }

  return scores;
}

function pickBestLabel(scores = {}) {
  let bestLabel = null;
  let bestScore = -Infinity;
  for (const [label, score] of Object.entries(scores || {})) {
    if (score > bestScore) {
      bestLabel = label;
      bestScore = score;
    }
  }
  return {
    label: bestLabel,
    score: Number.isFinite(bestScore) ? bestScore : null
  };
}

function getTraceChosenLabel(trace = null, policyName = '') {
  if (!trace || !policyName) return null;
  if (typeof trace.chosenPath?.[policyName] === 'string') return trace.chosenPath[policyName];
  if (policyName === 'autobattlePosture' && typeof trace.chosen === 'string') return trace.chosen;
  if (typeof trace.traces?.[policyName]?.chosen === 'string') return trace.traces[policyName].chosen;
  return null;
}

function resolvePolicyArtifactPath(policyArg = POLICY_ARG) {
  if (!policyArg) return path.join(ROOT, 'assets', 'ml', 'm4-garden-policy.json');
  return path.isAbsolute(policyArg) ? policyArg : path.join(ROOT, policyArg);
}

function toBrowserPolicyPath(artifactPath = resolvePolicyArtifactPath()) {
  return path.relative(ROOT, artifactPath).replace(/\\/g, '/');
}

function loadPolicyArtifact(policyArg = POLICY_ARG) {
  const artifactPath = resolvePolicyArtifactPath(policyArg);
  return {
    artifactPath,
    artifact: JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
  };
}

function evaluateArtifactAgainstCorpus(artifact = {}, records = []) {
  const summary = {
    evaluatedAt: new Date().toISOString(),
    artifact: {
      schemaVersion: artifact?.schemaVersion || null,
      modelVersionId: artifact?.modelVersionId || null,
      runtime: artifact?.runtime || null,
      backend: artifact?.backend || null,
      artifactFormat: artifact?.artifactFormat || null,
      featureSchemaVersion: artifact?.featureSchemaVersion || null,
      traceSchemaVersion: artifact?.traceSchemaVersion || null,
      contractVersion: artifact?.contractVersion || null,
      trainedFrom: artifact?.trainedFrom || null,
      policyFamilies: Object.keys(artifact?.policies || {})
    },
    thresholds: this?.EVAL_THRESHOLDS || EVAL_THRESHOLDS,
    overall: {
      recordCount: records.length,
      evaluatedPolicyCount: 0,
      artifactTotalMatches: 0,
      heuristicTotalMatches: 0,
      correctedImprovementCount: 0,
      traceAlignmentCount: 0
    },
    perPolicy: {},
    scenarioResults: [],
    thresholdPass: false
  };

  for (const policyName of POLICY_FAMILIES) {
    summary.perPolicy[policyName] = {
      total: 0,
      artifactMatches: 0,
      heuristicMatches: 0,
      correctedCases: 0,
      correctedImprovements: 0,
      traceAlignedCount: 0,
      artifactRate: 0,
      heuristicRate: 0,
      strictlyBetter: false
    };
  }

  for (const record of records) {
    const flatFeatures = record?.features?.flatFeatures || {};
    const correctedPolicies = new Set(record?.review?.correctedPolicies || []);
    const scenarioResult = {
      scenarioId: record?.scenarioId || null,
      scenarioFamily: record?.scenarioFamily || null,
      recordKind: record?.recordKind || null,
      reviewStatus: record?.review?.status || 'unreviewed',
      correctedPolicies: [...correctedPolicies],
      policyChecks: {}
    };

    for (const policyName of POLICY_FAMILIES) {
      const trainingLabel = record?.trainingLabels?.[policyName] || null;
      if (!trainingLabel) continue;

      const artifactPolicy = artifact?.policies?.[policyName] || null;
      const artifactScores = artifactPolicy ? scoreLinearPolicy(artifactPolicy, flatFeatures) : {};
      const artifactPrediction = pickBestLabel(artifactScores).label;
      const activePrediction = getTraceChosenLabel(record?.activeTrace, policyName);
      const heuristicPrediction = getTraceChosenLabel(record?.heuristicTrace, policyName);
      const artifactMatches = artifactPrediction === trainingLabel;
      const heuristicMatches = heuristicPrediction === trainingLabel;
      const traceAligned = artifactPrediction === activePrediction;
      const correctedCase = correctedPolicies.has(policyName);
      const correctedImprovement = correctedCase && artifactMatches && !heuristicMatches;

      const policySummary = summary.perPolicy[policyName];
      policySummary.total += 1;
      if (artifactMatches) policySummary.artifactMatches += 1;
      if (heuristicMatches) policySummary.heuristicMatches += 1;
      if (correctedCase) policySummary.correctedCases += 1;
      if (correctedImprovement) policySummary.correctedImprovements += 1;
      if (traceAligned) policySummary.traceAlignedCount += 1;

      summary.overall.evaluatedPolicyCount += 1;
      if (artifactMatches) summary.overall.artifactTotalMatches += 1;
      if (heuristicMatches) summary.overall.heuristicTotalMatches += 1;
      if (correctedImprovement) summary.overall.correctedImprovementCount += 1;
      if (traceAligned) summary.overall.traceAlignmentCount += 1;

      scenarioResult.policyChecks[policyName] = {
        trainingLabel,
        artifactPrediction,
        activePrediction,
        heuristicPrediction,
        artifactMatches,
        heuristicMatches,
        traceAligned,
        correctedCase,
        correctedImprovement
      };
    }

    summary.scenarioResults.push(scenarioResult);
  }

  for (const policyName of POLICY_FAMILIES) {
    const policySummary = summary.perPolicy[policyName];
    policySummary.artifactRate = policySummary.total > 0
      ? Number((policySummary.artifactMatches / policySummary.total).toFixed(3))
      : 0;
    policySummary.heuristicRate = policySummary.total > 0
      ? Number((policySummary.heuristicMatches / policySummary.total).toFixed(3))
      : 0;
    policySummary.strictlyBetter = policySummary.artifactMatches > policySummary.heuristicMatches;
  }

  summary.thresholdPass =
    summary.overall.evaluatedPolicyCount > 0 &&
    summary.overall.artifactTotalMatches >= summary.overall.heuristicTotalMatches &&
    summary.overall.correctedImprovementCount >= EVAL_THRESHOLDS.minCorrectedImprovementCount &&
    summary.perPolicy.actionFamily.strictlyBetter === true &&
    POLICY_FAMILIES.every(policyName => {
      const policySummary = summary.perPolicy[policyName];
      return policySummary.total > 0
        && policySummary.artifactMatches >= policySummary.heuristicMatches
        && policySummary.traceAlignedCount === policySummary.total;
    });

  return summary;
}

async function ensureServer(report) {
  const reachable = await fetch(URL).then(() => true).catch(() => false);
  if (reachable) {
    report.server = { reused: true, pid: null };
    return;
  }

  const { spawn } = require('child_process');
  const serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore'
  });
  serverProcess.unref();
  report.server = { reused: false, pid: serverProcess.pid };

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ok = await fetch(URL).then(() => true).catch(() => false);
    if (ok) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error('Server did not become reachable in time');
}

async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, {
    timeout: 30000
  });
}

async function waitForMlModel(page) {
  await page.waitForFunction(() => {
    if (typeof mlInferenceSystem === 'undefined') return false;
    if (!mlInferenceSystem.modelConfig?.useModelInference) return true;
    return !!mlInferenceSystem.modelRuntime?.modelLoaded || !!mlInferenceSystem.modelRuntime?.lastLoadError;
  }, null, { timeout: 15000 });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1800);
}

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function resetBaseline(page, policyBrowserPath = toBrowserPolicyPath()) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
  });
  await page.evaluate(async (policyPath) => {
    gameConfig.ml.policyArtifactPath = policyPath;
    gameConfig.ml.useModelInference = true;
    mlInferenceSystem.reset();
    mlInferenceSystem.modelConfig.useModelInference = true;
    mlInferenceSystem.modelConfig.policyArtifactPath = policyPath;
    await mlInferenceSystem.loadModelArtifact(true);
  }, policyBrowserPath);
  await waitForMlModel(page);
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && state.butterflies?.length >= 4;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(900);
}

async function phase(page, report, outputDir, name, run) {
  const result = await run();
  const screenshot = await saveShot(page, outputDir, name);
  report.phases.push({
    name,
    pass: !!result.pass,
    details: result.details || null,
    screenshot
  });
  return result;
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  const videoDir = path.join(outputDir, 'video');
  ensureDir(outputDir);
  ensureDir(videoDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    url: URL,
    phases: [],
    pageErrors: [],
    consoleErrors: [],
    thresholds: EVAL_THRESHOLDS,
    server: null,
    overall: 'pending'
  };

  let browser;
  let context;
  let page;

  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      recordVideo: {
        dir: videoDir,
        size: { width: 1600, height: 900 }
      }
    });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    const { artifactPath: expectedArtifactPath, artifact: expectedArtifact } = loadPolicyArtifact();
    const expectedPolicyFamilies = Object.keys(expectedArtifact?.policies || {});
    report.policyArtifactPath = expectedArtifactPath;
    await resetBaseline(page, toBrowserPolicyPath(expectedArtifactPath));

    await phase(page, report, outputDir, '01-artifact-contract-and-runtime', async () => {
      const state = await page.evaluate(() => {
        const runtime = mlInferenceSystem.getRuntimeSummary?.() || null;
        return {
          runtime
        };
      });
      const runtime = state.runtime || {};
      const artifactSummary = runtime.artifactSummary || {};
      const compatible = artifactSummary.compatibleWithRuntime || {};
      const policyFamilies = artifactSummary.policyFamilies || [];
      return {
        pass:
          runtime.modelLoaded === true &&
          runtime.modelAvailable === true &&
          runtime.runtime === expectedArtifact.runtime &&
          runtime.backend === expectedArtifact.backend &&
          runtime.modelVersionId === expectedArtifact.modelVersionId &&
          runtime.policyArtifactFormat === expectedArtifact.artifactFormat &&
          artifactSummary.schemaVersion === expectedArtifact.schemaVersion &&
          artifactSummary.modelVersionId === expectedArtifact.modelVersionId &&
          artifactSummary.artifactFormat === expectedArtifact.artifactFormat &&
          artifactSummary.featureSchemaVersion === expectedArtifact.featureSchemaVersion &&
          artifactSummary.traceSchemaVersion === expectedArtifact.traceSchemaVersion &&
          artifactSummary.contractVersion === expectedArtifact.contractVersion &&
          artifactSummary.legacyArtifact === false &&
          artifactSummary.missingPolicyFamilies?.length === 0 &&
          policyFamilies.length === expectedPolicyFamilies.length &&
          expectedPolicyFamilies.every(policyName => policyFamilies.includes(policyName)) &&
          compatible.runtime === true &&
          compatible.artifactFormat === true &&
          compatible.featureSchema === true &&
          compatible.traceSchema === true &&
          compatible.contractVersion === true,
        details: state
      };
    });

    await phase(page, report, outputDir, '02-corpus-coverage-and-eval-thresholds', async () => {
      const corpus = await buildC2TraceCorpus({
        outputRoot: path.join(outputDir, 'c2_trace_corpus'),
        sourceAudit: 'run-ml-phase-m4-audit'
      });
      const { artifactPath, artifact } = loadPolicyArtifact();
      const evaluation = evaluateArtifactAgainstCorpus(artifact, corpus.records || []);
      const evaluationPath = path.join(outputDir, 'artifact-evaluation.json');
      fs.writeFileSync(evaluationPath, JSON.stringify(evaluation, null, 2));

      report.corpus = {
        manifestPath: corpus.manifestPath,
        recordsPath: corpus.recordsPath
      };
      report.evaluation = {
        artifactPath,
        evaluationPath
      };

      const manifest = corpus.manifest || {};
      const families = new Set(manifest.scenarioFamilies || []);
      const coveragePass =
        manifest.schemaVersion === 'c2-trace-corpus-manifest-v1' &&
        manifest.recordCount >= EVAL_THRESHOLDS.minRecordCount &&
        manifest.scenarioCount >= EVAL_THRESHOLDS.minScenarioCount &&
        manifest.reviewedRecordCount >= EVAL_THRESHOLDS.minReviewedRecordCount &&
        manifest.correctedRecordCount >= EVAL_THRESHOLDS.minCorrectedRecordCount &&
        manifest.correctedPolicyCount >= EVAL_THRESHOLDS.minCorrectedPolicyCount &&
        families.has('garden') &&
        families.has('communication') &&
        families.has('ecology') &&
        families.has('autobattle') &&
        !!manifest.recordsDigest &&
        manifest.rebuildCheck?.matches === true;

      return {
        pass: coveragePass && evaluation.thresholdPass === true,
        details: {
          manifestPath: corpus.manifestPath,
          recordsPath: corpus.recordsPath,
          evaluationPath,
          coverage: {
            recordCount: manifest.recordCount,
            scenarioCount: manifest.scenarioCount,
            reviewedRecordCount: manifest.reviewedRecordCount,
            correctedRecordCount: manifest.correctedRecordCount,
            correctedPolicyCount: manifest.correctedPolicyCount,
            scenarioFamilies: manifest.scenarioFamilies,
            recordsDigest: manifest.recordsDigest,
            rebuildCheck: manifest.rebuildCheck
          },
          evaluation: {
            overall: evaluation.overall,
            perPolicy: evaluation.perPolicy,
            thresholdPass: evaluation.thresholdPass
          }
        }
      };
    });

    await phase(page, report, outputDir, '03-posture-to-action-mapping', async () => {
      const state = await page.evaluate(() => {
        const clone = value => JSON.parse(JSON.stringify(value));
        const gameState = gameCore.getGameState();
        gameState.roster.memberIds = [];
        const sorted = rosterSystem.sortBattleEntities([...(gameState.butterflies || [])], gameState);
        for (const entity of sorted.slice(0, Math.min(4, sorted.length))) {
          rosterSystem.toggleMember(entity.id, gameState);
        }
        const session = gameCore.startSinglePlayerAutoBattleSession();
        const snapshot = battleSystem.getSnapshot(session?.battleId || gameState.activeBattleId);
        const leftId = snapshot?.teams?.left?.participantIds?.[0] || null;
        if (!snapshot || !leftId) return null;

        const supportSnapshot = clone(snapshot);
        const supportParticipant = supportSnapshot.participantsById[leftId];
        supportParticipant.cognition.battle.supportOpportunity = 100;
        supportParticipant.cognition.battle.allyPressure = 96;
        supportParticipant.cognition.battle.enemyThreat = 20;
        supportParticipant.cognition.battle.retreatPressure = 12;
        supportParticipant.statProfile.battleStats.support = 92;
        supportParticipant.statProfile.battleStats.offense = 30;
        const supportAction = battleSystem.chooseAutoAction(supportSnapshot, supportParticipant);

        const retreatSnapshot = clone(snapshot);
        const retreatParticipant = retreatSnapshot.participantsById[leftId];
        retreatParticipant.hp = 16;
        retreatParticipant.maxHp = 100;
        retreatParticipant.pressure = 8;
        retreatParticipant.cognition.battle.enemyThreat = 100;
        retreatParticipant.cognition.battle.retreatPressure = 100;
        retreatParticipant.cognition.battle.supportOpportunity = 0;
        retreatParticipant.cognition.battle.allyPressure = 18;
        const retreatAction = battleSystem.chooseAutoAction(retreatSnapshot, retreatParticipant);

        const focusSnapshot = clone(snapshot);
        const focusParticipant = focusSnapshot.participantsById[leftId];
        focusParticipant.hp = 92;
        focusParticipant.maxHp = 100;
        focusParticipant.pressure = 0;
        focusParticipant.cognition.battle.targetPriority = 100;
        focusParticipant.cognition.battle.enemyThreat = 42;
        focusParticipant.cognition.battle.retreatPressure = 0;
        focusParticipant.cognition.battle.supportOpportunity = 0;
        focusParticipant.statProfile.battleStats.offense = 98;
        focusParticipant.statProfile.battleStats.support = 18;
        const focusAction = battleSystem.chooseAutoAction(focusSnapshot, focusParticipant);

        return {
          supportAction,
          supportInference: supportParticipant.inference,
          retreatAction,
          retreatInference: retreatParticipant.inference,
          focusAction,
          focusInference: focusParticipant.inference
        };
      });
      return {
        pass:
          ['rally', 'attack'].includes(state?.supportAction?.type) &&
          state?.supportInference?.battleSource === 'ml' &&
          state?.supportInference?.battleLabel === 'support' &&
          state?.retreatAction?.type === 'retreat' &&
          state?.retreatInference?.battleSource === 'ml' &&
          state?.retreatInference?.battleLabel === 'retreat' &&
          state?.focusAction?.type === 'attack' &&
          state?.focusInference?.battleSource === 'ml' &&
          ['engage', 'focusWeakTarget'].includes(state?.focusInference?.battleLabel),
        details: state
      };
    });

    await phase(page, report, outputDir, '04-live-battle-ui-and-rounds', async () => {
      await page.waitForTimeout(1200);
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const snapshot = battleSystem.getSnapshot(gameState.activeBattleId);
        const leftId = snapshot?.teams?.left?.participantIds?.[0] || null;
        if (leftId) gameUI.battleUi.selectedParticipantId = leftId;
        const refreshed = battleSystem.getSnapshot(gameState.activeBattleId);
        const selected = leftId ? refreshed?.participantsById?.[leftId] : null;
        return {
          roundNumber: refreshed?.metadata?.roundNumber || 0,
          selectedInference: selected?.inference || null,
          viewMode: gameState.viewMode,
          runtime: mlInferenceSystem.getRuntimeSummary?.() || null
        };
      });
      return {
        pass:
          state?.viewMode === 'battle' &&
          state?.roundNumber >= 1 &&
          state?.selectedInference?.battleSource === 'ml' &&
          ['engage', 'support', 'focusWeakTarget', 'stabilize', 'retreat'].includes(state?.selectedInference?.battleLabel) &&
          state?.runtime?.artifactSummary?.modelVersionId === 'm4-garden-policy-v1',
        details: state
      };
    });

    report.overall = report.phases.every(entry => entry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'warn';
  } catch (error) {
    report.overall = 'error';
    report.fatalError = String(error?.stack || error);
  } finally {
    if (page && page.video()) {
      report.video = await page.video().path();
    }
    if (context) await context.close();
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall }, null, 2));
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
