const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'p5_training_physics_audit');
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
  await page.waitForTimeout(1000);
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

async function setupTrainingPair(page, options = {}) {
  return page.evaluate((opts) => {
    const gameState = gameCore.getGameState();
    const trainingZone = teachingSystem.getTrainingZone?.() || null;
    if (!trainingZone?.id) {
      return { ok: false, reason: 'missing-training-zone' };
    }

    gameCore.focusZone(trainingZone.id);

    const region = gameCore.getZoneConfig(trainingZone.id)?.renderProfile?.screenRegion || null;
    const center = gameCore.getZoneCenter(trainingZone.id);
    const butterflies = (gameState.butterflies || []).filter(entry => !!entry?.id).slice(0, 2);
    if (!center || !region || butterflies.length < 2) {
      return { ok: false, reason: 'missing-butterflies-or-region' };
    }

    const y = center.y + (opts.yOffset || 0);
    const desiredLeft = opts.nearRightEdge
      ? { x: region.x + region.width - 38, y }
      : { x: center.x - 10, y };
    const desiredRight = opts.nearRightEdge
      ? { x: region.x + region.width - 22, y }
      : { x: center.x + 10, y };

    const leftPoint = gameCore.clampScreenPointToRoamArea(desiredLeft.x, desiredLeft.y, 10, { zoneId: trainingZone.id });
    const rightPoint = gameCore.clampScreenPointToRoamArea(desiredRight.x, desiredRight.y, 10, { zoneId: trainingZone.id });

    for (const butterfly of butterflies) {
      gameCore.assignEntityToZone(butterfly, trainingZone.id);
      butterfly.currentZoneId = trainingZone.id;
      butterfly.lifeSim.lifecycle.currentZoneId = trainingZone.id;
      butterfly.zoneTravel = null;
      butterfly.isSpawning = false;
      butterfly.blockInteraction = butterfly.blockInteraction || {};
      butterfly.blockInteraction.carryingBlockId = null;
      butterfly.state = 'normal';
      butterfly.sleepState = null;
      butterfly.sleepPose = null;
      butterfly.happiness = 6;
      butterfly.battleState = {
        ...(butterfly.battleState || {}),
        hp: 100,
        pressure: 0,
        lastImpactAtFrame: 0,
        lastImpactStrength: 0,
        lastImpactSource: null
      };
      butterfly.physics = butterfly.physics || {};
    }

    const [left, right] = butterflies;
    left.x = leftPoint.x;
    left.y = leftPoint.y;
    right.x = rightPoint.x;
    right.y = rightPoint.y;
    left.gridPos = gridManager.screenToIso(left.x, left.y);
    right.gridPos = gridManager.screenToIso(right.x, right.y);

    left.changeState?.('normal');
    right.changeState?.('normal');

    physicsSystem.syncTrackedEntities(gameState);
    const leftPhysics = physicsSystem.getEntityState(left.id);
    const rightPhysics = physicsSystem.getEntityState(right.id);
    if (leftPhysics?.impulse) {
      leftPhysics.impulse.x = 0;
      leftPhysics.impulse.y = 0;
      leftPhysics.impulse.frames = 0;
      leftPhysics.impulse.source = null;
    }
    if (rightPhysics?.impulse) {
      rightPhysics.impulse.x = 0;
      rightPhysics.impulse.y = 0;
      rightPhysics.impulse.frames = 0;
      rightPhysics.impulse.source = null;
    }

    return {
      ok: true,
      zoneId: trainingZone.id,
      leftId: left.id,
      rightId: right.id,
      region,
      leftPoint,
      rightPoint
    };
  }, options);
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

    await phase(page, report, outputDir, '01-impact-owner-split', async () => {
      const fixture = await setupTrainingPair(page, { nearRightEdge: false });
      if (!fixture.ok) {
        return { pass: false, details: fixture };
      }

      const state = await page.evaluate(({ leftId, rightId }) => {
        const gameState = gameCore.getGameState();
        const left = (gameState.butterflies || []).find(entry => entry.id === leftId);
        const right = (gameState.butterflies || []).find(entry => entry.id === rightId);
        const before = {
          left: { x: left.x, y: left.y, hp: left.battleState?.hp || 0, pressure: left.battleState?.pressure || 0 },
          right: { x: right.x, y: right.y, hp: right.battleState?.hp || 0, pressure: right.battleState?.pressure || 0 }
        };

        const applied = teachingSystem.applyTrainingImpact(left, right, { push: 4, frames: 4 });
        const leftPhysics = physicsSystem.getEntityState(left.id);
        const rightPhysics = physicsSystem.getEntityState(right.id);

        const after = {
          left: { x: left.x, y: left.y, hp: left.battleState?.hp || 0, pressure: left.battleState?.pressure || 0 },
          right: { x: right.x, y: right.y, hp: right.battleState?.hp || 0, pressure: right.battleState?.pressure || 0 }
        };

        return {
          applied,
          leftImmediateMove: Math.hypot(after.left.x - before.left.x, after.left.y - before.left.y),
          rightImmediateMove: Math.hypot(after.right.x - before.right.x, after.right.y - before.right.y),
          leftHpDelta: before.left.hp - after.left.hp,
          rightHpDelta: before.right.hp - after.right.hp,
          leftPressureDelta: after.left.pressure - before.left.pressure,
          rightPressureDelta: after.right.pressure - before.right.pressure,
          leftImpulseFrames: leftPhysics?.impulse?.frames || 0,
          rightImpulseFrames: rightPhysics?.impulse?.frames || 0,
          leftImpulseSource: leftPhysics?.impulse?.source || null,
          rightImpulseSource: rightPhysics?.impulse?.source || null
        };
      }, fixture);

      return {
        pass:
          state.applied === true &&
          state.leftImmediateMove < 0.01 &&
          state.rightImmediateMove < 0.01 &&
          state.leftHpDelta === 1 &&
          state.rightHpDelta === 1 &&
          state.leftPressureDelta === 1 &&
          state.rightPressureDelta === 1 &&
          state.leftImpulseFrames >= 1 &&
          state.rightImpulseFrames >= 1 &&
          state.leftImpulseSource === 'training-impact' &&
          state.rightImpulseSource === 'training-impact',
        details: { ...fixture, ...state }
      };
    });

    await phase(page, report, outputDir, '02-physics-recoil-step', async () => {
      const fixture = await setupTrainingPair(page, { nearRightEdge: false });
      if (!fixture.ok) {
        return { pass: false, details: fixture };
      }

      const state = await page.evaluate(({ leftId, rightId }) => {
        const gameState = gameCore.getGameState();
        const left = (gameState.butterflies || []).find(entry => entry.id === leftId);
        const right = (gameState.butterflies || []).find(entry => entry.id === rightId);
        const before = {
          left: { x: left.x, y: left.y },
          right: { x: right.x, y: right.y }
        };

        teachingSystem.applyTrainingImpact(left, right, { push: 4, frames: 4 });
        physicsSystem.update(gameState, 0, { resetContacts: false });

        const leftPhysics = physicsSystem.getEntityState(left.id);
        const rightPhysics = physicsSystem.getEntityState(right.id);

        return {
          leftMove: Math.hypot(left.x - before.left.x, left.y - before.left.y),
          rightMove: Math.hypot(right.x - before.right.x, right.y - before.right.y),
          leftDx: left.x - before.left.x,
          rightDx: right.x - before.right.x,
          leftRemainingFrames: leftPhysics?.impulse?.frames || 0,
          rightRemainingFrames: rightPhysics?.impulse?.frames || 0,
          leftMotionSource: leftPhysics?.motion?.source || null,
          rightMotionSource: rightPhysics?.motion?.source || null
        };
      }, fixture);

      return {
        pass:
          state.leftMove > 0.2 &&
          state.rightMove > 0.2 &&
          state.leftMove < 6 &&
          state.rightMove < 6 &&
          state.leftDx < -0.1 &&
          state.rightDx > 0.1 &&
          state.leftRemainingFrames < 4 &&
          state.rightRemainingFrames < 4 &&
          state.leftMotionSource === 'training-impact' &&
          state.rightMotionSource === 'training-impact',
        details: { ...fixture, ...state }
      };
    });

    await phase(page, report, outputDir, '03-border-safe-recoil', async () => {
      const fixture = await setupTrainingPair(page, { nearRightEdge: true });
      if (!fixture.ok) {
        return { pass: false, details: fixture };
      }

      const state = await page.evaluate(({ leftId, rightId, zoneId, region }) => {
        const gameState = gameCore.getGameState();
        const left = (gameState.butterflies || []).find(entry => entry.id === leftId);
        const right = (gameState.butterflies || []).find(entry => entry.id === rightId);
        const before = {
          left: { x: left.x, y: left.y },
          right: { x: right.x, y: right.y }
        };

        teachingSystem.applyTrainingImpact(left, right, { push: 4.5, frames: 4 });
        for (let index = 0; index < 4; index += 1) {
          physicsSystem.update(gameState, 0, { resetContacts: false });
        }

        const rightGround = {
          x: right.x,
          y: right.y + (right.shadowOffset || 0)
        };
        const leftGround = {
          x: left.x,
          y: left.y + (left.shadowOffset || 0)
        };
        const rightClamp = gameCore.clampScreenPointToRoamArea(rightGround.x, rightGround.y, 8, { zoneId });
        const leftClamp = gameCore.clampScreenPointToRoamArea(leftGround.x, leftGround.y, 8, { zoneId });
        const rightPhysics = physicsSystem.getEntityState(right.id);

        return {
          leftMove: Math.hypot(left.x - before.left.x, left.y - before.left.y),
          rightMove: Math.hypot(right.x - before.right.x, right.y - before.right.y),
          rightClampDelta: Math.hypot(rightGround.x - rightClamp.x, rightGround.y - rightClamp.y),
          leftClampDelta: Math.hypot(leftGround.x - leftClamp.x, leftGround.y - leftClamp.y),
          finalRight: rightGround,
          finalLeft: leftGround,
          region,
          rightBlocked: !!rightPhysics?.contact?.blocked,
          rightBlockedBy: [...(rightPhysics?.contact?.blockedByIds || [])]
        };
      }, fixture);

      return {
        pass:
          state.leftMove > 0.1 &&
          state.rightMove > 0.1 &&
          state.rightClampDelta < 1.25 &&
          state.leftClampDelta < 1.25,
        details: { ...fixture, ...state }
      };
    });

    await phase(page, report, outputDir, '04-inspect-recoil-readout', async () => {
      const fixture = await setupTrainingPair(page, { nearRightEdge: false, yOffset: 18 });
      if (!fixture.ok) {
        return { pass: false, details: fixture };
      }

      const state = await page.evaluate(({ rightId, leftId }) => {
        const gameState = gameCore.getGameState();
        const left = (gameState.butterflies || []).find(entry => entry.id === leftId);
        const right = (gameState.butterflies || []).find(entry => entry.id === rightId);

        teachingSystem.applyTrainingImpact(left, right, { push: 4, frames: 4 });
        physicsSystem.update(gameState, 0, { resetContacts: false });

        gameUI.inspectPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = right.id;
        gameUI.inspectControl.guidedTargetId = null;

        return {
          rightId: right.id,
          recentImpactStrength: right.battleState?.lastImpactStrength || 0,
          recentImpactSource: right.battleState?.lastImpactSource || null,
          recentImpactFrameAge: typeof frameCount === 'number' && right.battleState?.lastImpactAtFrame
            ? frameCount - right.battleState.lastImpactAtFrame
            : null,
          inspectVisible: !!gameUI.inspectPanel.visible,
          inspectLockedTargetId: gameUI.inspectPanel.lockedTargetId || null
        };
      }, fixture);

      await page.waitForTimeout(250);

      return {
        pass:
          state.inspectVisible === true &&
          state.inspectLockedTargetId === state.rightId &&
          state.recentImpactStrength > 0 &&
          state.recentImpactSource === 'training' &&
          typeof state.recentImpactFrameAge === 'number' &&
          state.recentImpactFrameAge <= 60,
        details: { ...fixture, ...state }
      };
    });

    const failed = report.phases.filter(phaseEntry => !phaseEntry.pass);
    report.overall = failed.length === 0 && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error);
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    if (page) {
      try {
        await page.close();
      } catch {}
    }
    if (context) {
      try {
        await context.close();
      } catch {}
    }
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }

  return report;
}

run().then(report => {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.overall === 'pass' ? 0 : 1);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
