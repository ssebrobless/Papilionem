const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'lifesim_expression_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function timestampLabel() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, {
    timeout: 30000
  });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
}

async function ensureServer(report) {
  const reachable = await fetch(URL).then(() => true).catch(() => false);
  if (reachable) {
    report.server = { reused: true, pid: null };
    return null;
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
    if (ok) return serverProcess;
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error('Server did not become reachable in time');
}

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function clearStorageAndReset(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(() => {
    gameCore.resetGame(true);
  });
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && state.butterflies?.length >= 4 && state.flowers?.length >= 2;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

async function getEntitySummary(page, targetId) {
  return page.evaluate((nextTargetId) => {
    const butterfly = (gameCore?.getGameState?.().butterflies || []).find(item => item.id === nextTargetId);
    return {
      butterfly: butterfly ? {
        id: butterfly.id,
        label: butterfly.displayName || butterfly.personalityType || butterfly.id,
        state: butterfly.state,
        zoneId: butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || null
      } : null,
      summary: typeof lifeSimSystem !== 'undefined' ? lifeSimSystem.getEntitySummary?.(nextTargetId) || null : null,
      communication: typeof communicationSystem !== 'undefined' ? communicationSystem.getCommunicationSummary?.(nextTargetId) || null : null,
      lifeSim: butterfly?.lifeSim ? {
        drives: butterfly.lifeSim.drives,
        emotions: butterfly.lifeSim.emotions,
        memories: butterfly.lifeSim.memories,
        routines: butterfly.lifeSim.routines,
        social: butterfly.lifeSim.social,
        upbringing: butterfly.lifeSim.upbringing,
        derived: butterfly.lifeSim.derived,
        interpretation: butterfly.lifeSim.interpretation,
        distortion: butterfly.lifeSim.distortion
      } : null
    };
  }, targetId);
}

function hasSurface(summary, key) {
  return !!(
    summary?.[key]
    && typeof summary[key].headline === 'string'
    && summary[key].headline.length > 0
    && typeof summary[key].detail === 'string'
    && summary[key].detail.length > 0
  );
}

async function configureInspect(page, targetId) {
  await page.evaluate((nextTargetId) => {
    gameUI.inspectPanel.visible = true;
    gameUI.activityLogPanel.visible = true;
    gameUI.inspectPanel.lockedTargetId = nextTargetId;
  }, targetId);
  await page.waitForTimeout(250);
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = timestampLabel();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  const videoDir = path.join(outputDir, 'video');
  ensureDir(outputDir);
  ensureDir(videoDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    url: URL,
    server: null,
    steps: [],
    screenshots: [],
    pageErrors: [],
    consoleErrors: [],
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
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await clearStorageAndReset(page);

    const targetId = await page.evaluate(() => gameCore?.getGameState?.().butterflies?.[0]?.id || null);
    if (!targetId) throw new Error('No butterfly available for life-sim audit');

    await configureInspect(page, targetId);
    report.screenshots.push(await saveShot(page, outputDir, '01-baseline-inspect'));
    const baseline = await getEntitySummary(page, targetId);
    report.steps.push({
      name: 'baseline-summary',
      pass: !!(
        baseline.summary?.dominantDrives?.length
        && baseline.summary?.dominantEmotions?.length
        && baseline.lifeSim?.social
        && hasSurface(baseline.summary, 'memories')
        && hasSurface(baseline.summary, 'routines')
        && hasSurface(baseline.summary, 'upbringing')
        && hasSurface(baseline.summary, 'distortion')
        && hasSurface(baseline.summary, 'socialEcology')
      ),
      detail: baseline
    });

    await page.evaluate((nextTargetId) => {
      const state = gameCore.getGameState();
      const target = (state.butterflies || []).find(item => item.id === nextTargetId);
      const teacher = (state.butterflies || []).find(item => item.id !== nextTargetId);
      const station = gameCore.getZoneConfig('sun-court')?.renderProfile?.trainingStations?.[0] || { x: 500, y: 270 };
      if (!target || !teacher) return;
      gameCore.focusZone('sun-court');
      gameCore.assignEntityToZone(target, 'sun-court');
      gameCore.assignEntityToZone(teacher, 'sun-court');
      teacher.x = station.x - 18;
      teacher.y = station.y - 8;
      target.x = station.x + 18;
      target.y = station.y + 8;
      if (target.lifeSim?.routines) {
        target.lifeSim.routines.activeContext = 'training-ground';
      }
      teachingSystem.simulationClockSeconds = 120;
      const lessonContent = {
        source: 'training-ground',
        zoneId: 'sun-court',
        stationId: null,
        stationLabel: 'training grounds',
        teacherArchetype: teacher.personalityType
      };
      teachingSystem.beginTeach(teacher.id, target.id, 'training_drill', lessonContent);
      const resolved = teachingSystem.resolveLesson(target.id, {
        teacherId: teacher.id,
        lessonCategory: 'training_drill',
        completedAtSeconds: teachingSystem.simulationClockSeconds + 1.3,
        content: lessonContent
      });
      if (resolved) {
        teachingSystem.applyResolvedLesson(target, teacher, resolved);
      }
      communicationSystem.update(state, 1.2);
      lifeSimSystem.update(state, gameConfig.simulation.fixedDeltaSeconds);
    }, targetId);
    await page.waitForTimeout(400);
    await configureInspect(page, targetId);
    report.screenshots.push(await saveShot(page, outputDir, '02-training-context'));
    const training = await getEntitySummary(page, targetId);
    report.steps.push({
      name: 'training-context',
      pass: (
        training.summary?.routines?.activeContext === 'training-ground'
        || training.summary?.social?.context === 'training-ground'
        || training.summary?.social?.context === 'signaling'
      ) && (training.summary?.upbringing?.lessonCount || 0) >= 1
        && (training.summary?.memories?.totalCount || 0) >= 1
        && ((training.summary?.upbringing?.strongestReinforcement?.value || 0) > 0
          || (training.summary?.upbringing?.detail || '').includes('reinforce'))
        && (
          (training.summary?.routines?.topFamilies || []).some(entry => entry.label === 'teaching')
          || (training.summary?.routines?.headline || '').includes('teaching')
        )
        && (
          training.summary?.socialEcology?.primaryRhythm === 'teaching-pocket'
          || (training.summary?.socialEcology?.teaching?.score || 0) > 0
        ),
      detail: training
    });

    await page.evaluate((nextTargetId) => {
      const state = gameCore.getGameState();
      const target = (state.butterflies || []).find(item => item.id === nextTargetId);
      if (!target) return;
      target.happiness = Math.max(4, (target.baselineHappiness || 30) - 18);
      target.receiveClapInteraction({ adjustedMouseX: target.x - 16, adjustedMouseY: target.y - 10 });
      communicationSystem.update(state, 0.8);
      for (let index = 0; index < 8; index += 1) {
        lifeSimSystem.update(state, gameConfig.simulation.fixedDeltaSeconds);
      }
    }, targetId);
    await page.waitForTimeout(300);
    await configureInspect(page, targetId);
    report.screenshots.push(await saveShot(page, outputDir, '03-threat-context'));
    const threat = await getEntitySummary(page, targetId);
    const topEmotionLabels = threat.summary?.dominantEmotions?.join(' | ') || '';
    report.steps.push({
      name: 'threat-expression',
      pass: (topEmotionLabels.includes('threat') || topEmotionLabels.includes('agitation'))
        && (
          (threat.summary?.distortion?.activeBiases || []).some(entry => entry.label === 'anxietyBias' || entry.label === 'traumaBias')
          || ['anxietyBias', 'traumaBias'].includes(threat.summary?.distortion?.dominantBias?.label)
        )
        && (
          (threat.summary?.memories?.topFamilies || []).some(entry => entry.label === 'danger')
          || (threat.summary?.memories?.headline || '').includes('danger')
        )
        && (
          threat.summary?.socialEcology?.primaryRhythm === 'warning-cascade'
          || (threat.summary?.socialEcology?.warning?.score || 0) > 0
        ),
      detail: threat
    });

    await page.evaluate((nextTargetId) => {
      const state = gameCore.getGameState();
      const target = (state.butterflies || []).find(item => item.id === nextTargetId);
      const flower = (state.flowers || []).find(item => item.currentZoneId === (target.currentZoneId || target.lifeSim?.lifecycle?.currentZoneId));
      if (!target || !flower) return;
      target.changeState('normal');
      target.happiness = 12;
      target.movement.clearTarget();
      target.timers.postFeedingCooldown = 0;
      target.stateData = {};
      target.changeState('feeding', { flower });
      lifeSimSystem.update(state, gameConfig.simulation.fixedDeltaSeconds);
    }, targetId);
    await page.waitForTimeout(300);
    await configureInspect(page, targetId);
    report.screenshots.push(await saveShot(page, outputDir, '04-resource-context'));
    const feeding = await getEntitySummary(page, targetId);
    const topDriveLabels = feeding.summary?.dominantDrives?.join(' | ') || '';
    report.steps.push({
      name: 'resource-expression',
      pass: topDriveLabels.includes('resourceControl') || topDriveLabels.includes('selfMaintenance'),
      detail: feeding
    });

    report.video = (await page.video()?.path()) || null;
    report.overall = report.steps.every(step => step.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'warn';
  } catch (error) {
    report.overall = 'fail';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    if (page?.video) {
      try {
        report.video = report.video || (await page.video().path());
      } catch (error) {
        report.videoError = String(error);
      }
    }
    if (context) await context.close();
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (report.overall === 'fail') process.exitCode = 1;
  }
}

run();
