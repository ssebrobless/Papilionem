const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ml_closure_audit');
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
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && state.butterflies?.length >= 3;
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

async function pickTarget(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const target = (state.butterflies || []).find(entry =>
      entry.currentZoneId === gameCore.getFocusedZoneId()
      && !entry.zoneTravel
      && !entry.isSpawning
    ) || state.butterflies?.[0] || null;
    if (!target) return null;
    return {
      id: target.id,
      zoneId: target.currentZoneId || null
    };
  });
}

async function startBattle(page) {
  await page.evaluate(() => {
    const snapshot = gameCore.startSinglePlayerAutoBattleSession?.();
    if (!snapshot?.battleId) {
      throw new Error('Unable to start autobattle session for ML closure audit');
    }
    battleSystem.cycleAutoBattleSpeed?.(snapshot.battleId);
    battleSystem.cycleAutoBattleSpeed?.(snapshot.battleId);
  });
  await page.waitForFunction(() => {
    const state = gameCore.getGameState();
    return state.viewMode === 'battle' && !!state.activeBattleId;
  }, null, { timeout: 10000 });
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

    await phase(page, report, outputDir, '01-ml-summary-shape', async () => {
      const target = await pickTarget(page);
      const state = await page.evaluate((targetId) => {
        const gameState = gameCore.getGameState();
        const summary = mlInferenceSystem.getEntitySummary(targetId, gameState);
        return {
          summary
        };
      }, target?.id);
      return {
        pass:
          !!target?.id &&
          !!state?.summary &&
          !!state.summary.policies?.action &&
          !!state.summary.policies?.target &&
          !!state.summary.policies?.signal &&
          !!state.summary.policies?.risk &&
          !!state.summary.policies?.battle &&
          Array.isArray(state.summary.history),
        details: state
      };
    });

    await phase(page, report, outputDir, '02-runtime-budget-proof', async () => {
      await page.waitForTimeout(1400);
      const state = await page.evaluate(() => {
        const runtime = mlInferenceSystem.getRuntimeSummary?.() || null;
        const telemetry = telemetrySystem.getSnapshot?.() || null;
        return {
          runtime,
          telemetry,
          pressure: telemetry?.pressure || null,
          mlRuntime: telemetry?.mlRuntime || null
        };
      });
      return {
        pass:
          state?.runtime?.useModelInference === true &&
          state?.runtime?.modelLoaded === true &&
          (state?.runtime?.loadedPolicies?.length || 0) === 5 &&
          (state?.mlRuntime?.gardenSampleCount || 0) >= 6 &&
          (state?.mlRuntime?.avgGardenUpdateMs || 0) > 0 &&
          state?.mlRuntime?.withinBudget?.gardenInference === true &&
          (state?.pressure?.avgUpdateMs || 0) <= (state?.runtime?.performanceBudget?.focusedGardenTotalUpdateMs || 0) &&
          (state?.pressure?.avgPhysicsMs || 0) <= (state?.runtime?.performanceBudget?.focusedGardenPhysicsMs || 0) &&
          (state?.mlRuntime?.mlPolicyShare || 0) >= 0.75 &&
          state?.runtime?.lastDecisionSource === 'ml',
        details: state
      };
    });

    await phase(page, report, outputDir, '03-inspect-ml-rows', async () => {
      const target = await pickTarget(page);
      const state = await page.evaluate((targetId) => {
        const gameState = gameCore.getGameState();
        const summary = mlInferenceSystem.getEntitySummary(targetId, gameState);
        gameUI.inspectPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = targetId;
        const rows = gameUI.buildMlInspectRows(summary);
        return {
          labels: rows.map(row => row.label),
          rows,
          inspectPanel: {
            x: gameUI.inspectPanel.x,
            y: gameUI.inspectPanel.y,
            width: gameUI.inspectPanel.width,
            height: gameUI.inspectPanel.height
          }
        };
      }, target?.id);
      const requiredLabels = ['ML', 'Path', 'Act', 'Target', 'Signal', 'Risk', 'BPost', 'Why', 'Ctx', 'History'];
      return {
        pass:
          !!target?.id &&
          requiredLabels.every(label => state?.labels?.includes(label)) &&
          state?.rows?.some(row => row.label === 'Path' && /assets\/ml\//i.test(row.value || '')) &&
          state?.rows?.some(row => row.label === 'Act' && /\bML\b|\bFB\b/.test(row.value)) &&
          state?.rows?.some(row => row.label === 'Why' && row.value.length > 8) &&
          state?.rows?.some(row => row.label === 'Ctx' && /trust \d+ fear \d+/i.test(row.value || '')) &&
          state?.rows?.some(row => row.label === 'History' && row.value.length > 0),
        details: state
      };
    });

    await phase(page, report, outputDir, '04-history-buffer', async () => {
      const target = await pickTarget(page);
      const state = await page.evaluate((targetId) => {
        const gameState = gameCore.getGameState();
        const target = (gameState.butterflies || []).find(entry => entry.id === targetId);
        if (!target) return null;

        target.lifeSim.playerInteraction.cursorFear = 0.02;
        target.lifeSim.playerInteraction.cursorTrust = 0.76;
        target.lifeSim.emotions.threat = 0.04;
        target.lifeSim.emotions.curiosity = 0.62;
        target.lifeSim.objectAwareness.focusType = 'flower';
        target.lifeSim.objectAwareness.currentAffordance = 'feedFrom';
        mlInferenceSystem.update(gameState, 1 / 60);
        const first = mlInferenceSystem.getEntitySummary(targetId, gameState);

        target.lifeSim.playerInteraction.cursorFear = 0.82;
        target.lifeSim.playerInteraction.cursorTrust = 0.08;
        target.lifeSim.emotions.threat = 0.91;
        target.lifeSim.emotions.curiosity = 0.12;
        target.lifeSim.objectAwareness.focusType = 'none';
        target.lifeSim.objectAwareness.currentAffordance = 'observe';
        mlInferenceSystem.update(gameState, 1 / 60);
        const second = mlInferenceSystem.getEntitySummary(targetId, gameState);

        return {
          firstAction: first?.actionLabel || null,
          secondAction: second?.actionLabel || null,
          firstRisk: first?.riskLabel || null,
          secondRisk: second?.riskLabel || null,
          historyLength: second?.history?.length || 0,
          history: second?.history || []
        };
      }, target?.id);
      return {
        pass:
          !!target?.id &&
          !!state &&
          state.historyLength >= 2 &&
          state.history[0]?.compact !== state.history[1]?.compact &&
          !!state.firstRisk &&
          !!state.secondRisk,
        details: state
      };
    });

    await phase(page, report, outputDir, '05-live-inspect-visual', async () => {
      const target = await pickTarget(page);
      const state = await page.evaluate((targetId) => {
        const gameState = gameCore.getGameState();
        gameUI.inspectPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = targetId;
        const targetEntity = (gameState.butterflies || []).find(entry => entry.id === targetId) || null;
        if (targetEntity) {
          gameUI.inspectControl.guidedTargetId = targetId;
          targetEntity.x = Math.max(120, Math.min(gameConfig.canvas.baseWidth - 120, targetEntity.x || 0));
          targetEntity.y = Math.max(120, Math.min(gameConfig.canvas.baseHeight - 120, targetEntity.y || 0));
        }
        const summary = mlInferenceSystem.getEntitySummary(targetId, gameState);
        return {
          inspectVisible: gameUI.inspectPanel.visible,
          lockedTargetId: gameUI.inspectPanel.lockedTargetId,
          panelWidth: gameUI.inspectPanel.width,
          panelHeight: gameUI.inspectPanel.height,
          summary
        };
      }, target?.id);
      return {
        pass:
          !!target?.id &&
          state?.inspectVisible === true &&
          state?.lockedTargetId === target.id &&
          state?.panelWidth >= 150 &&
          state?.summary?.policies?.action?.label != null,
        details: state
      };
    });

    await phase(page, report, outputDir, '06-debug-explainability-shell', async () => {
      const target = await pickTarget(page);
      const state = await page.evaluate((targetId) => {
        const gameState = gameCore.getGameState();
        debugUI.enabled = true;
        gameUI.inspectPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = targetId;
        const snapshot = debugUI.buildMlExplainabilitySnapshot?.(gameState) || debugUI.lastMlExplainabilitySummary || null;
        return {
          targetId,
          snapshot
        };
      }, target?.id);

      return {
        pass:
          !!state?.targetId &&
          state?.snapshot?.focusId === state.targetId &&
          (state?.snapshot?.lines?.length || 0) >= 4 &&
          /assets\/ml\//i.test(state?.snapshot?.path || '') &&
          (state?.snapshot?.whyText?.length || 0) > 8,
        details: state
      };
    });

    await phase(page, report, outputDir, '07-battle-rollout-budget', async () => {
      await startBattle(page);
      await page.waitForTimeout(1500);

      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const snapshot = battleSystem.getSnapshot?.(gameState.activeBattleId) || null;
        const participants = Object.values(snapshot?.participantsById || {}).filter(Boolean).map(participant => ({
          id: participant.id,
          teamId: participant.teamId,
          defeated: !!participant.defeated,
          retreated: !!participant.retreated,
          battleLabel: participant.inference?.battleLabel || null,
          battleSource: participant.inference?.battleSource || null,
          battleSourceLabel: participant.inference?.battleSourceLabel || null
        }));
        const activeParticipants = participants.filter(participant => !participant.defeated && !participant.retreated);
        const runtime = mlInferenceSystem.getRuntimeSummary?.() || null;
        const telemetry = telemetrySystem.getSnapshot?.() || null;
        return {
          viewMode: gameState.viewMode,
          activeBattleId: gameState.activeBattleId,
          roundNumber: snapshot?.metadata?.roundNumber || 0,
          participants,
          activeParticipants,
          runtime,
          telemetry,
          pressure: telemetry?.pressure || null,
          mlRuntime: telemetry?.mlRuntime || null
        };
      });

      return {
        pass:
          state?.viewMode === 'battle' &&
          !!state?.activeBattleId &&
          (state?.roundNumber || 0) >= 1 &&
          (state?.activeParticipants?.length || 0) >= 4 &&
          state.activeParticipants.every(participant => participant.battleSource === 'ml' && !!participant.battleLabel) &&
          (state?.mlRuntime?.battleSampleCount || 0) >= 4 &&
          (state?.mlRuntime?.avgBattleDecisionMs || 0) > 0 &&
          state?.mlRuntime?.withinBudget?.battleDecision === true &&
          (state?.pressure?.avgUpdateMs || 0) <= (state?.runtime?.performanceBudget?.focusedGardenTotalUpdateMs || 0),
        details: state
      };
    });

    await phase(page, report, outputDir, '08-fallback-trace-contract', async () => {
      await resetBaseline(page);
      const target = await pickTarget(page);
      const state = await page.evaluate((targetId) => {
        const gameState = gameCore.getGameState();
        const effectiveTargetId = targetId
          || ((gameState.butterflies || []).find(entry =>
            entry.currentZoneId === gameCore.getFocusedZoneId()
            && !entry.zoneTravel
            && !entry.isSpawning
          ) || gameState.butterflies?.[0] || null)?.id
          || null;
        gameUI.inspectPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = effectiveTargetId;

        const savedConfig = JSON.parse(JSON.stringify(mlInferenceSystem.modelConfig));
        const savedRuntime = JSON.parse(JSON.stringify(mlInferenceSystem.modelRuntime));

        mlInferenceSystem.modelConfig.useModelInference = true;
        mlInferenceSystem.modelRuntime = {
          ...mlInferenceSystem.createDefaultModelRuntime(),
          artifactPath: savedConfig.policyArtifactPath,
          loadAttempted: true,
          lastLoadError: 'audit fallback contract'
        };
        mlInferenceSystem.markAllRuntimeStale();
        mlInferenceSystem.update(gameState, 1 / 60);

        const summary = mlInferenceSystem.getEntitySummary(effectiveTargetId, gameState);
        const runtime = mlInferenceSystem.getRuntimeSummary?.() || null;
        const rows = gameUI.buildMlInspectRows(summary);

        mlInferenceSystem.modelConfig = savedConfig;
        mlInferenceSystem.modelRuntime = {
          ...mlInferenceSystem.createDefaultModelRuntime(),
          ...savedRuntime
        };
        mlInferenceSystem.markAllRuntimeStale();

        return {
          targetId: effectiveTargetId,
          summary,
          runtime,
          labels: rows.map(row => row.label),
          actRow: rows.find(row => row.label === 'Act')?.value || '',
          contextRow: rows.find(row => row.label === 'Ctx')?.value || ''
        };
      }, target?.id);

      return {
        pass:
          !!state?.targetId &&
          state?.summary?.source === 'heuristic-fallback' &&
          state?.runtime?.lastDecisionSource === 'heuristic-fallback' &&
          (state?.runtime?.fallbackCount || 0) >= 1 &&
          state?.labels?.includes('Ctx') &&
          /\bFB\b/.test(state?.actRow || '') &&
          /trust \d+ fear \d+/i.test(state?.contextRow || ''),
        details: state
      };
    });

    report.overall = report.phases.every(entry => entry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
