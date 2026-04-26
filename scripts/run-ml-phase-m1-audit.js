const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { buildC2TraceCorpus } = require('./build-c2-trace-corpus');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ml_phase_m1_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
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

async function resetBaseline(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
  });
  await waitForMlModel(page);
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
    await resetBaseline(page);

    await phase(page, report, outputDir, '01-ml-owner-and-features', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];
        const summary = mlInferenceSystem.getEntitySummary?.(butterfly.id, gameState);
        const features = mlInferenceSystem.getEntityFeatures?.(butterfly.id);
        const runtime = mlInferenceSystem.getRuntimeSummary?.();
        const durable = mlInferenceSystem.serializeDurableState?.();
        return {
          initialized: !!gameCore.mlInferenceSystem?.initialized,
          source: summary?.source || null,
          action: summary?.actionLabel || null,
          target: summary?.targetLabel || null,
          confidence: summary?.confidence || null,
          vectorLength: features?.vectorLength || 0,
          hasIdentity: !!features?.groups?.identity,
          hasGenetics: !!features?.groups?.genetics,
          hasPlayer: !!features?.groups?.playerInteraction,
          hasObjects: !!features?.groups?.objectAwareness,
          hasSpace: !!features?.groups?.spatial,
          hasProgression: !!features?.groups?.progression,
          hasAutobattle: !!features?.groups?.autobattle,
          runtime,
          durable
        };
      });
      const sharedSpatialHooks = state.runtime?.contract?.sharedSpatialHooks || [];
      return {
        pass:
          state.initialized &&
          state.source === 'ml' &&
          typeof state.action === 'string' &&
          typeof state.target === 'string' &&
          typeof state.confidence === 'number' &&
          state.vectorLength > 20 &&
          state.hasIdentity &&
          state.hasGenetics &&
          state.hasPlayer &&
          state.hasObjects &&
          state.hasSpace &&
          state.hasProgression &&
          state.hasAutobattle &&
          state.runtime?.runtime === 'local-static-policy' &&
          state.runtime?.backend === 'linear-policy-json' &&
          state.runtime?.modelVersionId === 'm4-garden-policy-v1' &&
          state.runtime?.policyArtifactFormat === 'linear-policy-json' &&
          state.runtime?.gardenCadenceFrames === 20 &&
          state.runtime?.battleCadenceFrames === 1 &&
          state.runtime?.contract?.version === 'c1-runtime-contract-v1' &&
          state.runtime?.contract?.lockedFutureRuntime === 'onnx-runtime-web' &&
          state.runtime?.contract?.lockedFutureArtifactFormat === 'onnx-bundle' &&
          state.runtime?.contract?.trainingPath === 'offline-supervised-imitation' &&
          state.runtime?.contract?.corpusSource === 'heuristic-traces-plus-curated-audit-scenarios' &&
          state.runtime?.contract?.fallbackMode === 'heuristic-fallback-required' &&
          state.runtime?.contract?.offlineOnly === true &&
          state.runtime?.contract?.allowServerInference === false &&
          state.runtime?.contract?.allowOnlineTraining === false &&
          state.runtime?.contract?.spatialHookOwner === 'structureSystem' &&
          state.runtime?.contract?.hookSchemaVersion === 'c1-shared-spatial-hooks-v1' &&
          sharedSpatialHooks.length === 4 &&
          sharedSpatialHooks.includes('verticality') &&
          sharedSpatialHooks.includes('structureRole') &&
          sharedSpatialHooks.includes('pathState') &&
          sharedSpatialHooks.includes('bodyFit') &&
          state.durable?.modelConfig?.modelVersionId === 'm4-garden-policy-v1' &&
          state.durable?.modelConfig?.policyArtifactFormat === 'linear-policy-json' &&
          state.durable?.modelConfig?.contract?.version === 'c1-runtime-contract-v1',
        details: state
      };
    });

    await phase(page, report, outputDir, '02-inspect-trace', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];
        gameUI.inspectPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = butterfly.id;
        const summary = mlInferenceSystem.getEntitySummary?.(butterfly.id, gameState);
        return {
          inspectVisible: gameUI.inspectPanel.visible,
          lockedTargetId: gameUI.inspectPanel.lockedTargetId,
          summary
        };
      });
      await page.waitForTimeout(150);
      return {
        pass:
          state.inspectVisible &&
          !!state.lockedTargetId &&
          !!state.summary &&
          typeof state.summary.sourceLabel === 'string' &&
          typeof state.summary.actionLabel === 'string' &&
          typeof state.summary.confidenceBand === 'string' &&
          state.summary.runtime?.contract?.version === 'c1-runtime-contract-v1' &&
          state.summary.runtime?.policyArtifactFormat === 'linear-policy-json' &&
          state.summary.runtime?.gardenCadenceFrames === 20 &&
          state.summary.runtime?.battleCadenceFrames === 1,
        details: state
      };
    });

    await phase(page, report, outputDir, '03-save-load-and-battle-seam', async () => {
      const state = await page.evaluate(async () => {
        const wait = (predicate, timeoutMs = 4000) => new Promise((resolve, reject) => {
          const started = performance.now();
          const tick = () => {
            if (predicate()) return resolve(true);
            if ((performance.now() - started) > timeoutMs) return reject(new Error('timeout'));
            setTimeout(tick, 50);
          };
          tick();
        });

        const before = gameCore.serializeGameState();
        const saveModelVersion = before?.foundations?.mlInference?.modelConfig?.modelVersionId || null;
        const firstId = gameCore.gameState.butterflies?.[0]?.id || null;
        gameCore.saveGameToStorage();
        await gameCore.loadGameFromStorage();
        await wait(() => mlInferenceSystem.modelRuntime?.modelLoaded || mlInferenceSystem.modelRuntime?.lastLoadError);
        mlInferenceSystem.update(gameCore.gameState, 0);
        const afterState = gameCore.getGameState();
        const restoredId = afterState.butterflies?.[0]?.id || null;
        const restoredSummary = restoredId ? mlInferenceSystem.getEntitySummary?.(restoredId, afterState) : null;
        const runtime = mlInferenceSystem.getRuntimeSummary?.();
        const preview = gameCore.buildSinglePlayerAutoBattlePreview?.();
        const snapshot = gameCore.startSinglePlayerAutoBattleSession?.();
        const participant = snapshot?.participantOrder?.length
          ? battleSystem.getParticipantSnapshot?.(snapshot.battleId, snapshot.participantOrder[0])
          : null;
        if (snapshot?.battleId) {
          gameCore.commitBattleSession?.(snapshot.battleId);
        }
        return {
          saveModelVersion,
          firstId,
          restoredId,
          restoredSummary,
          runtime,
          previewCanStart: !!preview?.canStart,
          participantInference: participant?.inference || null
        };
      });
      return {
        pass:
          state.saveModelVersion === 'm4-garden-policy-v1' &&
          !!state.restoredId &&
          !!state.restoredSummary &&
          state.restoredSummary.source === 'ml' &&
          state.runtime?.modelLoaded === true &&
          state.runtime?.policyArtifactFormat === 'linear-policy-json' &&
          state.runtime?.contract?.version === 'c1-runtime-contract-v1' &&
          !!state.participantInference &&
          typeof state.participantInference.actionLabel === 'string' &&
          state.participantInference.runtime?.contract?.version === 'c1-runtime-contract-v1',
        details: state
      };
    });

    await phase(page, report, outputDir, '04-corpus-manifest', async () => {
      const corpus = await buildC2TraceCorpus({
        outputRoot: path.join(outputDir, 'c2_trace_corpus'),
        sourceAudit: 'run-ml-phase-m1-audit'
      });
      report.corpus = {
        manifestPath: corpus.manifestPath,
        recordsPath: corpus.recordsPath
      };
      const manifest = corpus.manifest;
      const families = new Set(manifest.scenarioFamilies || []);
      return {
        pass:
          manifest.schemaVersion === 'c2-trace-corpus-manifest-v1' &&
          manifest.recordCount >= 4 &&
          manifest.scenarioCount >= 4 &&
          manifest.reviewedRecordCount >= 3 &&
          families.has('garden') &&
          families.has('communication') &&
          families.has('ecology') &&
          families.has('autobattle') &&
          !!manifest.recordsDigest &&
          manifest.rebuildCheck?.matches === true,
        details: {
          manifestPath: corpus.manifestPath,
          recordsPath: corpus.recordsPath,
          recordCount: manifest.recordCount,
          scenarioCount: manifest.scenarioCount,
          scenarioFamilies: manifest.scenarioFamilies,
          reviewedRecordCount: manifest.reviewedRecordCount,
          correctedRecordCount: manifest.correctedRecordCount,
          correctedPolicyCount: manifest.correctedPolicyCount,
          recordsDigest: manifest.recordsDigest,
          rebuildCheck: manifest.rebuildCheck
        }
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
    if (report.overall === 'error') {
      process.exitCode = 1;
    }
  }
}

run();
