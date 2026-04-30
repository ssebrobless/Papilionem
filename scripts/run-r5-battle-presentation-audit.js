const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r5_battle_presentation_audit');
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

function getFlagOverrides() {
  const raw = process.env.PAPILIONEM_FLAG_OVERRIDES;
  if (!raw) return null;
  return JSON.parse(raw);
}

function getAccessibilityOverrides() {
  const raw = process.env.PAPILIONEM_ACCESSIBILITY_OVERRIDES;
  if (!raw) return null;
  return JSON.parse(raw);
}

async function applyFlagOverrides(context, flagOverrides) {
  if (!flagOverrides || typeof flagOverrides !== 'object') return;
  await context.addInitScript((overrides) => {
    window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = overrides;
  }, flagOverrides);
}

async function applyAccessibilityOverrides(context, accessibilityOverrides) {
  if (!accessibilityOverrides || typeof accessibilityOverrides !== 'object') return;
  await context.addInitScript((overrides) => {
    window.__PAPILIONEM_ACCESSIBILITY_OVERRIDES__ = overrides;
  }, accessibilityOverrides);
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
    gameUI.setAccessibilitySettings({
      battleMotionSimplify: false,
      reducedMotion: false
    });
  });
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && state.butterflies?.length >= 6;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const butterflies = gameCore.getGameState().butterflies || [];
    const forcedAbilities = ['sparkle', 'cascade', 'sparkle', 'speedzone', 'sparkle', 'cascade', 'shimmer', 'golden'];
    butterflies.slice(0, forcedAbilities.length).forEach((butterfly, index) => {
      const seededMaxHp = butterfly.battleState?.maxHp ?? butterfly.maxHp ?? 100;
      const seededHpLoss = index < 6 ? (4 + ((index % 2) * 2)) : 0;
      butterfly.setSpecialAbility?.(forcedAbilities[index]);
      butterfly.battleState = {
        ...(butterfly.battleState || {}),
        hp: Math.max(72, seededMaxHp - seededHpLoss),
        maxHp: seededMaxHp,
        pressure: 0
      };
    });
  });
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

async function startBattle(page) {
  await page.evaluate(() => {
    const butterflies = gameCore.getGameState()?.butterflies || [];
    const leftIds = butterflies.slice(0, 3).map(entity => entity.id);
    const rightIds = butterflies.slice(3, 6).map(entity => entity.id);
    const options = {
      mode: 'r5-presentation-audit',
      autoBattle: true,
      autoBattlePaused: false,
      autoBattleSpeed: 2,
      autoBattleIntervalFrames: 12,
      maxRounds: 12
    };
    const snapshot = (leftIds.length >= 1 && rightIds.length >= 1)
      ? gameCore.startBattleFromSides?.(leftIds, rightIds, options)
      : gameCore.startSinglePlayerAutoBattleSession?.(options);
    return {
      battleId: snapshot?.battleId || null
    };
  });
  await page.waitForFunction(() => gameCore.getGameState().viewMode === 'battle' && !!gameCore.getGameState().activeBattleId, null, {
    timeout: 10000
  });
}

async function seedPresentationRound(page) {
  await page.evaluate(() => {
    const battleId = gameCore.getGameState().activeBattleId;
    const snapshot = battleSystem.getSnapshot(battleId);
    if (!snapshot || snapshot.result) return null;
    const participants = snapshot.participantOrder
      .map(id => snapshot.participantsById?.[id])
      .filter(Boolean);
    const actor = participants.find(participant =>
      participant.teamId === 'left' &&
      participant.abilities?.specialAbility === 'sparkle' &&
      !participant.defeated &&
      !participant.retreated
    ) || participants.find(participant => participant.teamId === 'left');
    const target = participants.find(participant =>
      participant.teamId !== actor?.teamId &&
      !participant.defeated &&
      !participant.retreated
    );
    if (!actor || !target) return null;
    const result = battleSystem.resolveRound(battleId, {
      [actor.id]: {
        type: 'attack',
        targetId: target.id
      }
    });
    battleSystem.modifyParticipantHp?.(battleId, target.id, -22);
    battleSystem.applyPressure?.(battleId, target.id, 3);
    return result;
  });
  await page.waitForTimeout(120);
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
  const flagOverrides = getFlagOverrides();
  const accessibilityOverrides = getAccessibilityOverrides();

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
    await applyFlagOverrides(context, flagOverrides);
    await applyAccessibilityOverrides(context, accessibilityOverrides);
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

    await page.evaluate(() => {
      window.__battleAudit = {
        spawnCoverCallsInBattle: 0
      };
      if (!renderManager.__battleAuditWrappedDrawSpawnCover) {
        const original = renderManager.drawSpawnCover.bind(renderManager);
        renderManager.drawSpawnCover = function patchedDrawSpawnCover(...args) {
          if (this.viewState?.battleActive) {
            window.__battleAudit.spawnCoverCallsInBattle += 1;
          }
          return original(...args);
        };
        renderManager.__battleAuditWrappedDrawSpawnCover = true;
      }
    });

    await startBattle(page);

    await phase(page, report, outputDir, '01-battle-top-down-launch', async () => {
      await page.waitForTimeout(1500);
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const snapshot = battleSystem.getSnapshot(gameState.activeBattleId);
        return {
          viewMode: gameState.viewMode,
          battleId: gameState.activeBattleId,
          battleBackgroundLoaded: !!renderManager.battleBackgroundImage,
          spawnCoverCallsInBattle: window.__battleAudit?.spawnCoverCallsInBattle || 0,
          groundPlane: renderManager.getGroundPlaneProfile?.() || null,
          roundNumber: snapshot?.metadata?.roundNumber || 0
        };
      });

      return {
        pass:
          state.viewMode === 'battle' &&
          !!state.battleId &&
          state.battleBackgroundLoaded &&
          state.spawnCoverCallsInBattle === 0 &&
          state.groundPlane?.ellipseScaleY === 1 &&
          state.groundPlane?.centerYOffset === 0 &&
          state.roundNumber >= 0,
        details: state
      };
    });

    await phase(page, report, outputDir, '02-battle-visible-combat', async () => {
      await seedPresentationRound(page);
      await page.waitForFunction(() => {
        const battleId = gameCore.getGameState().activeBattleId;
        if (!battleId) return false;
        const snapshot = battleSystem.getSnapshot(battleId);
        if (!snapshot) return false;
        if (snapshot.result) return true;
        return (snapshot.metadata?.roundNumber || 0) >= 1
          || Object.values(snapshot.participantsById || {}).some(participant =>
            !!participant.battleVisual?.action?.type);
      }, null, { timeout: 12000 });

      const aggregate = {
        roundNumber: 0,
        projectileCount: 0,
        projectileStyles: new Set(),
        actionTypes: new Set(),
        specialLabels: new Set(),
        flowerRelatedActions: 0,
        movedCount: 0,
        recentEvents: [],
        recentEventIds: new Set(),
        hudSummary: null,
        samples: []
      };

      const collectState = async () => page.evaluate(async () => {
        const battleId = gameCore.getGameState().activeBattleId;
        const samplePoses = () => {
          const snapshot = battleSystem.getSnapshot(battleId);
          const assignments = snapshot?.metadata?.arena?.assignments || {};
          return (snapshot?.participantOrder || []).map(id => {
            const participant = snapshot.participantsById?.[id];
            const assignment = assignments[id];
            const pose = renderManager.getBattleParticipantPose?.(snapshot, participant, assignment, Date.now()) || null;
            return {
              id,
              x: pose?.x ?? null,
              y: pose?.y ?? null,
              action: participant?.battleVisual?.action?.type || null
            };
          });
        };

        const first = samplePoses();
        await new Promise(resolve => setTimeout(resolve, 180));
        const second = samplePoses();
        const snapshot = battleSystem.getSnapshot(battleId);
        const moved = second.filter((entry, index) => {
          const previous = first[index];
          if (!previous) return false;
          return Math.hypot((entry.x || 0) - (previous.x || 0), (entry.y || 0) - (previous.y || 0)) > 1.5;
        });

        return {
          roundNumber: snapshot?.metadata?.roundNumber || 0,
          projectileCount: snapshot?.metadata?.visuals?.projectiles?.length || 0,
          projectileStyles: Array.from(new Set((snapshot?.metadata?.visuals?.projectiles || []).map(projectile => projectile.projectileStyle).filter(Boolean))),
          actionTypes: Array.from(new Set(Object.values(snapshot?.participantsById || {}).map(participant => participant.battleVisual?.action?.type).filter(Boolean))),
          specialLabels: Array.from(new Set(Object.values(snapshot?.participantsById || {}).map(participant => participant.battleVisual?.action?.specialLabel).filter(Boolean))),
          flowerRelatedActions: Object.values(snapshot?.participantsById || {}).filter(participant => participant.battleVisual?.action?.flowerRelated).length,
          movedCount: moved.length,
          recentEvents: battleSystem.getRecentBattleEvents?.(battleId, 6) || [],
          battleResolved: !!snapshot?.result,
          hudSummary: gameUI.battleUi.renderSummary || null
        };
      });

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const sample = await collectState();
        aggregate.roundNumber = Math.max(aggregate.roundNumber, sample.roundNumber || 0);
        aggregate.projectileCount = Math.max(aggregate.projectileCount, sample.projectileCount || 0);
        aggregate.flowerRelatedActions = Math.max(aggregate.flowerRelatedActions, sample.flowerRelatedActions || 0);
        aggregate.movedCount = Math.max(aggregate.movedCount, sample.movedCount || 0);
        if (sample.hudSummary?.overlayMode === 'minimal-field' || (sample.hudSummary?.eventItems?.length || 0) > 0) {
          aggregate.hudSummary = sample.hudSummary;
        }
        sample.projectileStyles.forEach(style => aggregate.projectileStyles.add(style));
        sample.actionTypes.forEach(type => aggregate.actionTypes.add(type));
        sample.specialLabels.forEach(label => aggregate.specialLabels.add(label));
        sample.recentEvents.forEach(event => {
          if (!event?.id || aggregate.recentEventIds.has(event.id)) return;
          aggregate.recentEventIds.add(event.id);
          aggregate.recentEvents.push(event);
          if (event?.payload?.projectileStyle) {
            aggregate.projectileStyles.add(event.payload.projectileStyle);
          }
          if (event?.payload?.type) {
            aggregate.actionTypes.add(event.payload.type);
          }
          if (event?.payload?.specialLabel) {
            aggregate.specialLabels.add(event.payload.specialLabel);
          }
          if (event?.payload?.flowerRelated) {
            aggregate.flowerRelatedActions = Math.max(aggregate.flowerRelatedActions, 1);
          }
        });
        aggregate.samples.push({
          roundNumber: sample.roundNumber || 0,
          projectileCount: sample.projectileCount || 0,
          flowerRelatedActions: sample.flowerRelatedActions || 0,
          movedCount: sample.movedCount || 0,
          battleResolved: !!sample.battleResolved
        });

        const hasAttackEvent = aggregate.recentEvents.some(event => event?.eventType === 'round-action' && event?.payload?.type === 'attack');
        const labelsReadable = aggregate.recentEvents
          .filter(event => event?.eventType === 'round-action')
          .some(event => typeof event?.payload?.actorLabel === 'string' && event.payload.actorLabel.includes('('));
        const hasPassState =
          aggregate.roundNumber >= 1 &&
          aggregate.movedCount >= 1 &&
          aggregate.projectileStyles.size >= 1 &&
          aggregate.specialLabels.size >= 1 &&
          aggregate.flowerRelatedActions >= 1 &&
          Array.from(aggregate.actionTypes).some(type => type === 'attack' || type === 'rally') &&
          hasAttackEvent &&
          labelsReadable &&
          aggregate.hudSummary?.overlayMode === 'minimal-field' &&
          aggregate.hudSummary?.sidePanelsVisible === false &&
          aggregate.hudSummary?.feedPanelVisible === false &&
          aggregate.hudSummary?.fieldHealthBars === true &&
          aggregate.hudSummary?.controlCount >= 1 &&
          (aggregate.hudSummary?.eventItems?.length || 0) >= 2;

        if (hasPassState) {
          return {
            pass: true,
            details: {
              roundNumber: aggregate.roundNumber,
              projectileCount: aggregate.projectileCount,
              projectileStyles: Array.from(aggregate.projectileStyles),
              actionTypes: Array.from(aggregate.actionTypes),
              specialLabels: Array.from(aggregate.specialLabels),
              flowerRelatedActions: aggregate.flowerRelatedActions,
              movedCount: aggregate.movedCount,
              recentEvents: aggregate.recentEvents.slice(0, 8),
              hudSummary: aggregate.hudSummary,
              samples: aggregate.samples
            }
          };
        }

        if (sample.battleResolved) break;
      }

      const hasAttackEvent = aggregate.recentEvents.some(event => event?.eventType === 'round-action' && event?.payload?.type === 'attack');
      const labelsReadable = aggregate.recentEvents
        .filter(event => event?.eventType === 'round-action')
        .some(event => typeof event?.payload?.actorLabel === 'string' && event.payload.actorLabel.includes('('));
      return {
        pass:
          aggregate.roundNumber >= 1 &&
          aggregate.movedCount >= 1 &&
          aggregate.projectileStyles.size >= 1 &&
          aggregate.specialLabels.size >= 1 &&
          aggregate.flowerRelatedActions >= 1 &&
          Array.from(aggregate.actionTypes).some(type => type === 'attack' || type === 'rally') &&
          hasAttackEvent &&
          labelsReadable &&
          aggregate.hudSummary?.overlayMode === 'minimal-field' &&
          aggregate.hudSummary?.sidePanelsVisible === false &&
          aggregate.hudSummary?.feedPanelVisible === false &&
          aggregate.hudSummary?.fieldHealthBars === true &&
          aggregate.hudSummary?.controlCount >= 1 &&
          (aggregate.hudSummary?.eventItems?.length || 0) >= 2,
        details: {
          roundNumber: aggregate.roundNumber,
          projectileCount: aggregate.projectileCount,
          projectileStyles: Array.from(aggregate.projectileStyles),
          actionTypes: Array.from(aggregate.actionTypes),
          specialLabels: Array.from(aggregate.specialLabels),
          flowerRelatedActions: aggregate.flowerRelatedActions,
          movedCount: aggregate.movedCount,
          recentEvents: aggregate.recentEvents.slice(0, 8),
          hudSummary: aggregate.hudSummary,
          samples: aggregate.samples
        }
      };
    });

    await phase(page, report, outputDir, '03-battle-resolve-return', async () => {
      await page.waitForFunction(() => {
        const state = gameCore.getGameState();
        if (!state.activeBattleId) return false;
        const snapshot = battleSystem.getSnapshot(state.activeBattleId);
        return !!snapshot?.result;
      }, null, { timeout: 35000 });

      const beforeCommit = await page.evaluate(() => {
        const snapshot = battleSystem.getSnapshot(gameCore.getGameState().activeBattleId);
        return {
          resultSummary: snapshot?.result?.summary || null,
          commitLabel: (gameUI.battleUi.controlRects || []).find(entry => entry.id === 'commitBattle')?.label || null,
          renderSummary: gameUI.battleUi.renderSummary || null
        };
      });

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
      await page.waitForTimeout(800);

      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const lastBattle = gameState.roster?.lastBattleStates || {};
        return {
          viewMode: gameState.viewMode,
          activeBattleId: gameState.activeBattleId,
          resolvedParticipants: Object.values(lastBattle).filter(entry => entry?.lastOutcome).length,
          anyPressureOrDamage: Object.values(lastBattle).some(entry => (entry?.pressure || 0) > 0 || (entry?.hp || 100) < 100)
        };
      });

      return {
        pass:
          beforeCommit.commitLabel === 'Return to Garden' &&
          !!beforeCommit.resultSummary &&
          !!beforeCommit.renderSummary?.resultReady &&
          state.viewMode === 'focused-garden' &&
          !state.activeBattleId &&
          state.resolvedParticipants >= 2 &&
          state.anyPressureOrDamage,
        details: {
          beforeCommit,
          afterCommit: state
        }
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
      await page.close().catch(() => {});
    }
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
}

run();
