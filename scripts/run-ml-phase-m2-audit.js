const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ml_phase_m2_audit');
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

    await phase(page, report, outputDir, '01-model-backed-garden-policies', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];
        const summary = mlInferenceSystem.getEntitySummary?.(butterfly.id, gameState);
        const trace = mlInferenceSystem.getEntityTrace?.(butterfly.id);
        const runtime = mlInferenceSystem.getRuntimeSummary?.();
        return {
          modelLoaded: !!mlInferenceSystem.modelRuntime?.modelLoaded,
          modelAvailable: !!mlInferenceSystem.modelRuntime?.modelAvailable,
          backend: mlInferenceSystem.modelRuntime?.backend || null,
          modelVersionId: mlInferenceSystem.modelConfig?.modelVersionId || null,
          runtime,
          summary,
          trace
        };
      });
      const sharedSpatialHooks = state.runtime?.contract?.sharedSpatialHooks || [];
      return {
        pass:
          state.modelLoaded &&
          state.modelAvailable &&
          state.backend === 'linear-policy-json' &&
          state.modelVersionId === 'm4-garden-policy-v1' &&
          state.summary?.source === 'ml' &&
          state.summary?.actionSource === 'ml' &&
          state.summary?.targetSource === 'ml' &&
          state.summary?.signalSource === 'ml' &&
          state.summary?.riskSource === 'ml' &&
          state.trace?.traces?.signalChoice?.source === 'ml' &&
          state.trace?.traces?.riskPosture?.source === 'ml' &&
          state.runtime?.contract?.version === 'c1-runtime-contract-v1' &&
          state.runtime?.policyArtifactFormat === 'linear-policy-json' &&
          state.runtime?.contract?.lockedFutureRuntime === 'onnx-runtime-web' &&
          state.runtime?.contract?.fallbackMode === 'heuristic-fallback-required' &&
          state.runtime?.contract?.spatialHookOwner === 'structureSystem' &&
          sharedSpatialHooks.length === 4 &&
          sharedSpatialHooks.includes('verticality') &&
          sharedSpatialHooks.includes('structureRole') &&
          sharedSpatialHooks.includes('pathState') &&
          sharedSpatialHooks.includes('bodyFit'),
        details: state
      };
    });

    await phase(page, report, outputDir, '02-context-sensitive-ml-choices', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];

        butterfly.lifeSim.playerInteraction.cursorFear = 1;
        butterfly.lifeSim.emotions.threat = 1;
        butterfly.lifeSim.derived.behaviorBiases.feedUrgency = 0;
        butterfly.lifeSim.derived.behaviorBiases.caution = 1;
        butterfly.lifeSim.derived.behaviorBiases.objectInterest = 0;
        mlInferenceSystem.update(gameState, 0);
        const avoidSummary = mlInferenceSystem.getEntitySummary?.(butterfly.id, gameState);

        butterfly.lifeSim.playerInteraction.cursorFear = 0;
        butterfly.lifeSim.emotions.threat = 0;
        butterfly.lifeSim.derived.behaviorBiases.caution = 0.08;
        butterfly.lifeSim.derived.behaviorBiases.feedUrgency = 1;
        butterfly.happiness = 8;
        butterfly.baselineHappiness = Math.max(24, butterfly.baselineHappiness || 0);
        mlInferenceSystem.update(gameState, 0);
        const feedSummary = mlInferenceSystem.getEntitySummary?.(butterfly.id, gameState);

        return {
          avoidSummary,
          feedSummary
        };
      });
      return {
        pass:
          state.avoidSummary?.signalLabel === 'warning' &&
          ['flee', 'avoid'].includes(state.avoidSummary?.riskLabel) &&
          state.avoidSummary?.policies?.action?.alternativeLabels?.includes('avoid') &&
          state.feedSummary?.actionLabel === 'feed' &&
          state.feedSummary?.targetLabel === 'flower' &&
          state.feedSummary?.signalLabel === 'quiet' &&
          state.feedSummary?.riskLabel === 'observe' &&
          state.avoidSummary?.riskLabel !== state.feedSummary?.riskLabel,
        details: state
      };
    });

    await phase(page, report, outputDir, '03-live-behavior-hooks', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];
        const zoneId = butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId;
        const flowers = gameCore.getFlowersInZone?.(zoneId) || [];
        const blocks = gameCore.getBlocksInZone?.(zoneId) || [];
        const nearestFlower = flowers[0] || null;
        const nearestBlock = blocks[0] || null;

        let feedTargetType = null;
        let feedFlowerId = null;
        let blockTargetId = null;

        if (nearestFlower) {
          butterfly.x = nearestFlower.x - 8;
          butterfly.y = nearestFlower.y - 8;
          butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
          butterfly.timers.postFeedingCooldown = 0;
          butterfly.movement.clearTarget?.();
          butterfly.lifeSim.playerInteraction.cursorFear = 0;
          butterfly.lifeSim.emotions.threat = 0;
          butterfly.lifeSim.derived.behaviorBiases.feedUrgency = 1;
          butterfly.happiness = 6;
          mlInferenceSystem.update(gameState, 0);
          butterfly.checkFlowerSeeking(gameState.flowers || []);
          feedTargetType = butterfly.movement.targetType || null;
          feedFlowerId = butterfly.findFlowerAtTarget?.(gameState.flowers || [])?.id || null;
        }

        if (nearestBlock) {
          butterfly.x = nearestBlock.x - 12;
          butterfly.y = nearestBlock.y - 8;
          butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
          butterfly.blockInteraction.cooldownFrames = 0;
          butterfly.blockInteraction.targetBlockId = null;
          butterfly.blockInteraction.carryingBlockId = null;
          butterfly.blockInteraction.placementTarget = null;
          butterfly.lifeSim.derived.behaviorBiases.objectInterest = 1;
          butterfly.lifeSim.derived.behaviorBiases.shelterSeeking = 0.9;
          butterfly.lifeSim.emotions.curiosity = 1;
          butterfly.lifeSim.drives.exploration = 1;
          butterfly.movement.clearTarget?.();
          mlInferenceSystem.update(gameState, 0);
          butterfly.checkBlockExperimentation(gameState.blocks || []);
          blockTargetId = butterfly.blockInteraction.targetBlockId || butterfly.blockInteraction.carryingBlockId || null;
        }

        return {
          feedTargetType,
          feedFlowerId,
          blockTargetId,
          nearestFlowerId: nearestFlower?.id || null,
          nearestBlockId: nearestBlock?.id || null
        };
      });
      return {
        pass:
          state.feedTargetType === 'goal' &&
          !!state.feedFlowerId &&
          !!state.blockTargetId,
        details: state
      };
    });

    await phase(page, report, outputDir, '04-save-load-and-fallback-seam', async () => {
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
        gameCore.loadGameFromStorage();
        await wait(() => mlInferenceSystem.modelRuntime?.modelLoaded || mlInferenceSystem.modelRuntime?.lastLoadError);
        mlInferenceSystem.update(gameCore.gameState, 0);

        const afterState = gameCore.getGameState();
        const restoredId = afterState.butterflies?.[0]?.id || null;
        const restoredSummary = restoredId ? mlInferenceSystem.getEntitySummary?.(restoredId, afterState) : null;

        const preview = gameCore.buildSinglePlayerAutoBattlePreview?.();
        const snapshot = gameCore.startSinglePlayerAutoBattleSession?.();
        const participant = snapshot?.participantOrder?.length
          ? battleSystem.getParticipantSnapshot?.(snapshot.battleId, snapshot.participantOrder[0])
          : null;
        if (snapshot?.battleId) {
          gameCore.commitBattleSession?.(snapshot.battleId);
        }

        const configBackup = { ...mlInferenceSystem.modelConfig };
        mlInferenceSystem.modelConfig.useModelInference = true;
        mlInferenceSystem.modelConfig.policyArtifactPath = 'assets/ml/missing-m4-policy.json';
        await mlInferenceSystem.loadModelArtifact(true);
        mlInferenceSystem.update(gameCore.gameState, 0);
        const fallbackSummary = firstId ? mlInferenceSystem.getEntitySummary?.(firstId, gameCore.gameState) : null;
        const fallbackLoadError = mlInferenceSystem.modelRuntime?.lastLoadError || null;

        mlInferenceSystem.modelConfig = configBackup;
        await mlInferenceSystem.loadModelArtifact(true);
        mlInferenceSystem.update(gameCore.gameState, 0);

        return {
          saveModelVersion,
          restoredId,
          restoredSummary,
          previewCanStart: !!preview?.canStart,
          participantInference: participant?.inference || null,
          fallbackSummary,
          fallbackLoadError
        };
      });
      return {
        pass:
          state.saveModelVersion === 'm4-garden-policy-v1' &&
          !!state.restoredId &&
          state.restoredSummary?.source === 'ml' &&
          state.restoredSummary?.runtime?.contract?.version === 'c1-runtime-contract-v1' &&
          !!state.participantInference &&
          typeof state.participantInference.actionLabel === 'string' &&
          state.fallbackSummary?.source === 'heuristic-fallback' &&
          state.fallbackSummary?.runtime?.contract?.version === 'c1-runtime-contract-v1' &&
          typeof state.fallbackLoadError === 'string' &&
          state.fallbackLoadError.length > 0,
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
    if (report.overall === 'error') {
      process.exitCode = 1;
    }
  }
}

run();
