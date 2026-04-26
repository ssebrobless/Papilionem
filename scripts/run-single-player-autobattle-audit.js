const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'single_player_autobattle_audit');
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
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && state.butterflies?.length >= 4;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

async function getCanvasClickPoint(page, getPoint) {
  return page.evaluate(getPoint).then(point => {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      throw new Error('Unable to compute canvas click point');
    }
    return point;
  });
}

async function clickCanvasPoint(page, point) {
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(300);
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

    await phase(page, report, outputDir, '01-roster-auto-selection', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.gameState;
        gameState.roster.memberIds = [];

        const sorted = rosterSystem.getRosterMembers(gameState).length
          ? rosterSystem.sortBattleEntities(rosterSystem.getRosterMembers(gameState), gameState)
          : rosterSystem.sortBattleEntities([...(gameState.butterflies || [])], gameState);
        const desiredRosterSize = Math.min(4, Math.max(2, Math.floor((gameState.butterflies?.length || 0) / 2)));
        const rosterIds = sorted.slice(0, desiredRosterSize).map(entry => entry.id);
        for (const id of rosterIds) {
          if (!gameState.roster.memberIds.includes(id)) {
            rosterSystem.toggleMember(id, gameState);
          }
        }

        const preview = gameCore.buildSinglePlayerAutoBattlePreview();
        const strongestRoster = rosterSystem.sortBattleEntities(
          (gameState.butterflies || []).filter(entry => gameState.roster.memberIds.includes(entry.id)),
          gameState
        ).slice(0, preview.teamSize).map(entry => entry.id);
        const strongestOpponents = rosterSystem.sortBattleEntities(
          (gameState.butterflies || []).filter(entry => !gameState.roster.memberIds.includes(entry.id)),
          gameState
        ).slice(0, preview.teamSize).map(entry => entry.id);

        return {
          rosterIds: [...gameState.roster.memberIds],
          previewCanStart: preview.canStart,
          teamSize: preview.teamSize,
          playerTeamIds: preview.playerTeamIds,
          opponentTeamIds: preview.opponentTeamIds,
          strongestRoster,
          strongestOpponents
        };
      });

      return {
        pass:
          state.previewCanStart &&
          state.teamSize >= 2 &&
          JSON.stringify(state.playerTeamIds) === JSON.stringify(state.strongestRoster) &&
          JSON.stringify(state.opponentTeamIds) === JSON.stringify(state.strongestOpponents),
        details: state
      };
    });

    const battleButtonPoint = await getCanvasClickPoint(page, () => {
      const button = gameUI.getVisiblePlayerButtons().find(entry => entry.id === 'toggleBattleMode');
      const canvas = document.querySelector('canvas');
      if (!button || !canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / gameConfig.canvas.baseWidth;
      const scaleY = rect.height / gameConfig.canvas.baseHeight;
      return {
        x: rect.left + ((button.x + (button.width / 2)) * scaleX),
        y: rect.top + ((button.y + (button.height / 2)) * scaleY)
      };
    });
    await clickCanvasPoint(page, battleButtonPoint);

    await phase(page, report, outputDir, '02-battle-setup-panel', async () => {
      const state = await page.evaluate(() => {
        const preview = gameCore.buildSinglePlayerAutoBattlePreview();
        return {
          visible: gameUI.battleSetupPanel.visible,
          canStart: preview.canStart,
          teamSize: preview.teamSize,
          maxTeamSize: preview.maxTeamSize,
          playerCount: preview.playerTeamIds.length,
          opponentCount: preview.opponentTeamIds.length,
          playerAverageReady: preview.playerAverageReady,
          opponentAverageReady: preview.opponentAverageReady,
          actionRects: gameUI.battleSetupPanel.actionRects || []
        };
      });

      return {
        pass:
          state.visible &&
          state.canStart &&
          state.teamSize >= 2 &&
          state.playerCount === state.teamSize &&
          state.opponentCount === state.teamSize &&
          state.actionRects.some(rect => rect.id === 'start-battle'),
        details: state
      };
    });

    const startButtonPoint = await getCanvasClickPoint(page, () => {
      const rect = (gameUI.battleSetupPanel.actionRects || []).find(entry => entry.id === 'start-battle');
      const canvas = document.querySelector('canvas');
      if (!rect || !canvas) return null;
      const bounds = canvas.getBoundingClientRect();
      const scaleX = bounds.width / gameConfig.canvas.baseWidth;
      const scaleY = bounds.height / gameConfig.canvas.baseHeight;
      return {
        x: bounds.left + ((rect.x + (rect.width / 2)) * scaleX),
        y: bounds.top + ((rect.y + (rect.height / 2)) * scaleY)
      };
    });
    await clickCanvasPoint(page, startButtonPoint);

    await phase(page, report, outputDir, '03-battle-live', async () => {
      await page.waitForFunction(() => gameCore.getGameState().viewMode === 'battle' && !!gameCore.getGameState().activeBattleId, null, {
        timeout: 10000
      });

      await page.waitForTimeout(1700);

      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const snapshot = battleSystem.getSnapshot(gameState.activeBattleId);
        const participants = Object.values(snapshot?.participantsById || {}).filter(Boolean).map(participant => ({
          id: participant.id,
          battleLabel: participant.inference?.battleLabel || null,
          battleSource: participant.inference?.battleSource || null,
          battleSourceLabel: participant.inference?.battleSourceLabel || null
        }));
        const mlRuntime = mlInferenceSystem?.getRuntimeSummary?.() || null;
        return {
          viewMode: gameState.viewMode,
          activeBattleId: gameState.activeBattleId,
          autoBattle: snapshot?.metadata?.autoBattle || false,
          teamLabels: snapshot?.metadata?.teamLabels || null,
          controlCount: (gameUI.battleUi.controlRects || []).length,
          leftCount: snapshot?.teams?.left?.participantIds?.length || 0,
          rightCount: snapshot?.teams?.right?.participantIds?.length || 0,
          roundNumber: snapshot?.metadata?.roundNumber || 0,
          renderSummary: gameUI.battleUi.renderSummary || null,
          participants,
          mlRuntime
        };
      });

      return {
        pass:
          state.viewMode === 'battle' &&
          !!state.activeBattleId &&
          state.autoBattle &&
          state.teamLabels?.left === 'Your Team' &&
          state.teamLabels?.right === 'Garden AI' &&
          state.controlCount >= 1 &&
          state.leftCount >= 2 &&
          state.rightCount >= 2 &&
          state.roundNumber >= 1 &&
          (state.participants?.length || 0) >= 4 &&
          state.participants.every(participant => participant.battleSource === 'ml' && !!participant.battleLabel) &&
          state.mlRuntime?.useModelInference === true &&
          state.mlRuntime?.modelLoaded === true &&
          state.renderSummary?.overlayMode === 'minimal-field' &&
          state.renderSummary?.sidePanelsVisible === false &&
          state.renderSummary?.feedPanelVisible === false &&
          state.renderSummary?.fieldHealthBars === true &&
          (state.renderSummary?.eventItems?.length || 0) >= 2 &&
          state.renderSummary?.commitLabel == null,
        details: state
      };
    });

    await phase(page, report, outputDir, '04-battle-resolve-and-commit', async () => {
      await page.waitForFunction(() => {
        const state = gameCore.getGameState();
        if (!state.activeBattleId) return false;
        const snapshot = battleSystem.getSnapshot(state.activeBattleId);
        return !!snapshot?.result;
      }, null, { timeout: 35000 });

      const commitButtonPoint = await getCanvasClickPoint(page, () => {
        const rect = (gameUI.battleUi.controlRects || []).find(entry => entry.id === 'commitBattle');
        const canvas = document.querySelector('canvas');
        if (!rect || !canvas) return null;
        const bounds = canvas.getBoundingClientRect();
        const scaleX = bounds.width / gameConfig.canvas.baseWidth;
        const scaleY = bounds.height / gameConfig.canvas.baseHeight;
        return {
          x: bounds.left + ((rect.x + (rect.width / 2)) * scaleX),
          y: bounds.top + ((rect.y + (rect.height / 2)) * scaleY)
        };
      });
      await clickCanvasPoint(page, commitButtonPoint);
      await page.waitForTimeout(600);

      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        return {
          viewMode: gameState.viewMode,
          activeBattleId: gameState.activeBattleId,
          rosterLastBattle: gameState.roster?.lastBattleStates || null,
          participantBattleStates: (gameState.butterflies || []).slice(0, 4).map(entry => ({
            id: entry.id,
            hp: entry.battleState?.hp ?? null,
            pressure: entry.battleState?.pressure ?? null,
            lastOutcome: entry.battleState?.lastOutcome || null
          })),
          preCommitRenderSummary: gameUI.battleUi.renderSummary || null
        };
      });

      return {
        pass:
          state.viewMode === 'focused-garden' &&
          !state.activeBattleId &&
          !!state.rosterLastBattle &&
          state.participantBattleStates.some(entry => entry.lastOutcome),
        details: state
      };
    });

    const passed = report.phases.every(phaseResult => phaseResult.pass);
    report.overall = passed && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        report.pageCloseError = String(error);
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (error) {
        report.contextCloseError = String(error);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        report.browserCloseError = String(error);
      }
    }
  }

  report.finishedAt = new Date().toISOString();
  ensureDir(outputDir);
  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
