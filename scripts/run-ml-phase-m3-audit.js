const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ml_phase_m3_audit');
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

    await phase(page, report, outputDir, '01-feature-contract-frozen', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];
        const summary = mlInferenceSystem.getEntitySummary?.(butterfly.id, gameState);
        const features = mlInferenceSystem.getEntityFeatures?.(butterfly.id);
        const runtime = mlInferenceSystem.getRuntimeSummary?.();
        const contract = mlInferenceSystem.getFeatureContractSnapshot?.();
        return {
          modelLoaded: !!mlInferenceSystem.modelRuntime?.modelLoaded,
          modelAvailable: !!mlInferenceSystem.modelRuntime?.modelAvailable,
          backend: mlInferenceSystem.modelRuntime?.backend || null,
          runtime,
          contract,
          summary,
          featureStats: {
            groupCount: summary?.featureTrace?.groupCount || 0,
            flatFeatureCount: features?.flatFeatureCount || 0,
            vectorLength: features?.vectorLength || 0,
            hasNaN: (features?.numericVector || []).some(value => Number.isNaN(value))
          }
        };
      });

      const sharedHooks = state.contract?.sharedSpatialHooks || [];
      const b3Stable = state.contract?.spatialFieldTiers?.b3Stable || [];
      const b7Stable = state.contract?.spatialFieldTiers?.b7Stable || [];

      return {
        pass:
          state.modelLoaded &&
          state.modelAvailable &&
          state.backend === 'linear-policy-json' &&
          state.runtime?.runtime === 'local-static-policy' &&
          state.runtime?.modelVersionId === 'm4-garden-policy-v1' &&
          state.runtime?.featureSchemaVersion === 'm4-feature-schema-v1' &&
          state.runtime?.traceSchemaVersion === 'm4-trace-schema-v1' &&
          state.contract?.groupCount === 14 &&
          state.contract?.flatFeatureCount === 98 &&
          state.contract?.vectorLength === 124 &&
          JSON.stringify(sharedHooks) === JSON.stringify(['verticality', 'structureRole', 'pathState', 'bodyFit']) &&
          JSON.stringify(b3Stable) === JSON.stringify(['verticality', 'structureRole', 'pathState', 'bodyFit']) &&
          JSON.stringify(b7Stable) === JSON.stringify(['occupancyBand', 'obstacleDensity', 'shelterCandidate', 'insideShelter', 'canUseInterior']) &&
          state.featureStats.groupCount === 14 &&
          state.featureStats.flatFeatureCount === 98 &&
          state.featureStats.vectorLength === 124 &&
          state.featureStats.hasNaN === false,
        details: state
      };
    });

    await phase(page, report, outputDir, '02-readable-trace-view', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];
        const summary = mlInferenceSystem.getEntitySummary?.(butterfly.id, gameState);
        const rows = gameUI.buildMlInspectRows?.(summary) || [];
        return {
          summary,
          rowLabels: rows.map(row => row.label),
          rows,
          debugLine: typeof debugUI !== 'undefined' ? debugUI.getMlAuditLine?.() : null
        };
      });

      const schemaRow = state.rows.find(row => row.label === 'Schema') || null;
      const featureRow = state.rows.find(row => row.label === 'Feat') || null;
      const spaceRow = state.rows.find(row => row.label === 'Space') || null;

      return {
        pass:
          state.rowLabels.includes('Schema') &&
          state.rowLabels.includes('Feat') &&
          state.rowLabels.includes('Space') &&
          schemaRow?.value?.includes('m4-feature-schema-v1') &&
          schemaRow?.value?.includes('m4-trace-schema-v1') &&
          featureRow?.value === '14 groups | 98 flat | 124 vec' &&
          spaceRow?.value?.includes('b3 verticality/structureRole/pathState/bodyFit') &&
          spaceRow?.value?.includes('b7 occupancyBand/obstacleDensity/shelterCandidate/insideShelter/canUseInterior') &&
          typeof state.summary?.featureTrace?.currentSpatial?.occupancyBand === 'string' &&
          typeof state.debugLine === 'string' &&
          state.debugLine.includes('ML') &&
          state.debugLine.includes('fb'),
        details: state
      };
    });

    await phase(page, report, outputDir, '03-deterministic-rebuild-and-battle-bundle', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];
        const behaviorRuntime = behaviorSystem?.getRuntime?.(butterfly.id) || null;
        const first = mlInferenceSystem.buildFeatureGroups?.(butterfly, gameState, behaviorRuntime);
        const second = mlInferenceSystem.buildFeatureGroups?.(butterfly, gameState, behaviorRuntime);
        const traceFirst = mlInferenceSystem.buildFeatureTraceSummary?.(first, mlInferenceSystem.getEntityTrace?.(butterfly.id));
        const traceSecond = mlInferenceSystem.buildFeatureTraceSummary?.(second, mlInferenceSystem.getEntityTrace?.(butterfly.id));

        const preview = gameCore.buildSinglePlayerAutoBattlePreview?.();
        const snapshot = preview?.canStart ? gameCore.startSinglePlayerAutoBattleSession?.() : null;
        const participant = snapshot?.participantOrder?.length
          ? battleSystem.getParticipantSnapshot?.(snapshot.battleId, snapshot.participantOrder[0])
          : null;
        const battleFeatures = participant
          ? mlInferenceSystem.buildBattleParticipantFeatureBundle?.(participant, snapshot, gameCore.gameState)
          : null;
        if (snapshot?.battleId) {
          gameCore.commitBattleSession?.(snapshot.battleId);
        }

        return {
          sameFlat: JSON.stringify(first?.flatFeatures || {}) === JSON.stringify(second?.flatFeatures || {}),
          sameVector: JSON.stringify(first?.numericVector || []) === JSON.stringify(second?.numericVector || []),
          sameTraceSummary: JSON.stringify(traceFirst || {}) === JSON.stringify(traceSecond || {}),
          battlePreview: preview || null,
          battleFeatures: battleFeatures
            ? {
                schemaVersion: battleFeatures.schemaVersion,
                flatFeatureCount: battleFeatures.flatFeatureCount || 0,
                vectorLength: battleFeatures.vectorLength || 0,
                groupCount: Object.keys(battleFeatures.groups || {}).length,
                currentMode: battleFeatures.groups?.world?.battleMode || null
              }
            : null
        };
      });

      return {
        pass:
          state.sameFlat &&
          state.sameVector &&
          state.sameTraceSummary &&
          !!state.battlePreview?.canStart &&
          state.battleFeatures?.schemaVersion === 'm4-feature-schema-v1' &&
          state.battleFeatures?.flatFeatureCount === 98 &&
          state.battleFeatures?.vectorLength === 124 &&
          state.battleFeatures?.groupCount === 14 &&
          state.battleFeatures?.currentMode === 'battle',
        details: state
      };
    });

    await phase(page, report, outputDir, '04-save-load-roundtrip-and-fallback-contract', async () => {
      const state = await page.evaluate(async () => {
        const wait = (predicate, timeoutMs = 5000) => new Promise((resolve, reject) => {
          const started = performance.now();
          const tick = () => {
            if (predicate()) return resolve(true);
            if ((performance.now() - started) > timeoutMs) return reject(new Error('timeout'));
            setTimeout(tick, 50);
          };
          tick();
        });

        const beforeSerialized = gameCore.serializeGameState();
        const beforeFoundation = beforeSerialized?.foundations?.mlInference || null;
        const beforeGameState = gameCore.getGameState();
        const beforeId = beforeGameState.butterflies?.[0]?.id || null;
        const beforeSummary = beforeId ? mlInferenceSystem.getEntitySummary?.(beforeId, beforeGameState) : null;

        gameCore.saveGameToStorage();
        gameCore.loadGameFromStorage();
        await wait(() => mlInferenceSystem.modelRuntime?.modelLoaded || mlInferenceSystem.modelRuntime?.lastLoadError);
        mlInferenceSystem.update(gameCore.gameState, 0);

        const afterGameState = gameCore.getGameState();
        const restoredId = afterGameState.butterflies?.[0]?.id || null;
        const restoredSummary = restoredId ? mlInferenceSystem.getEntitySummary?.(restoredId, afterGameState) : null;
        const restoredRows = restoredSummary ? gameUI.buildMlInspectRows?.(restoredSummary) || [] : [];

        const configBackup = JSON.parse(JSON.stringify(mlInferenceSystem.modelConfig || {}));
        mlInferenceSystem.modelConfig.useModelInference = true;
        mlInferenceSystem.modelConfig.policyArtifactPath = 'assets/ml/missing-c3-policy.json';
        await mlInferenceSystem.loadModelArtifact(true);
        mlInferenceSystem.update(gameCore.gameState, 0);
        const fallbackSummary = restoredId ? mlInferenceSystem.getEntitySummary?.(restoredId, gameCore.gameState) : null;
        const fallbackRuntime = mlInferenceSystem.getRuntimeSummary?.();

        mlInferenceSystem.modelConfig = configBackup;
        await mlInferenceSystem.loadModelArtifact(true);
        mlInferenceSystem.update(gameCore.gameState, 0);

        return {
          beforeFoundation,
          beforeSummary,
          restoredSummary,
          restoredRows,
          fallbackSummary,
          fallbackRuntime
        };
      });

      const restoredFeatureRow = state.restoredRows.find(row => row.label === 'Feat') || null;

      return {
        pass:
          state.beforeFoundation?.modelConfig?.modelVersionId === 'm4-garden-policy-v1' &&
          state.beforeFoundation?.modelConfig?.featureSchemaVersion === 'm4-feature-schema-v1' &&
          state.beforeFoundation?.modelConfig?.traceSchemaVersion === 'm4-trace-schema-v1' &&
          state.beforeSummary?.featureTrace?.flatFeatureCount === 98 &&
          state.beforeSummary?.featureTrace?.vectorLength === 124 &&
          state.restoredSummary?.featureTrace?.flatFeatureCount === 98 &&
          state.restoredSummary?.featureTrace?.vectorLength === 124 &&
          restoredFeatureRow?.value === '14 groups | 98 flat | 124 vec' &&
          state.fallbackSummary?.source === 'heuristic-fallback' &&
          state.fallbackSummary?.featureTrace?.flatFeatureCount === 98 &&
          state.fallbackSummary?.featureTrace?.vectorLength === 124 &&
          typeof state.fallbackRuntime?.lastLoadError === 'string' &&
          state.fallbackRuntime.lastLoadError.length > 0,
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
