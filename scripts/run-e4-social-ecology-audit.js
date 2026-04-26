const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'e4_social_ecology_audit');
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
    lifeSimSystem?.reset?.();
    communicationSystem?.reset?.();
    behaviorSystem?.reset?.();
    sleepSystem?.reset?.();
    teachingSystem?.reset?.();
    gameUI.inspectPanel.visible = false;
    gameUI.activityLogPanel.visible = false;
    gameUI.clearInspectSelection?.(gameCore.getGameState());
    if (typeof debugUI !== 'undefined') {
      debugUI.enabled = true;
    }
    window.__e4Audit = {
      clearGlobalState() {
        communicationSystem?.reset?.();
        behaviorSystem?.reset?.();
        sleepSystem?.reset?.();
      },
      resetButterfly(butterfly, options = {}) {
        if (!butterfly?.lifeSim) return;

        butterfly.changeState?.('normal');
        butterfly.state = 'normal';
        butterfly.stateData = {};
        butterfly.targetFlower = null;
        butterfly.currentFeeder = null;
        butterfly.pendingPollenDropTarget = null;
        butterfly.targetMate = null;
        butterfly.partnerId = null;
        butterfly.zoneTravel = {
          active: false,
          targetZoneId: null,
          reason: null,
          progress: 0
        };
        butterfly.movement?.clearTarget?.();

        butterfly.timers = butterfly.timers || {};
        [
          'mating',
          'following',
          'display',
          'state',
          'transition',
          'settle',
          'linger',
          'panic',
          'trusting',
          'fleeing'
        ].forEach(key => {
          if (typeof butterfly.timers[key] === 'number') {
            butterfly.timers[key] = 0;
          }
        });

        if (butterfly.breeding) {
          butterfly.breeding.partnerId = null;
          butterfly.breeding.matingTimer = 0;
          butterfly.breeding.offspringPlanned = false;
        }

        const communication = butterfly.lifeSim.communication;
        if (communication) {
          communication.activeSignal = null;
          communication.recentEmitted = [];
          communication.recentReceived = [];
          communication.recentConversations = [];
          communication.recentDialogues = [];
          communication.recentResidues = [];
          communication.retainedLessons = options.keepLessons ? (communication.retainedLessons || []) : [];
          communication.pendingUtterances = [];
          communication.activeConversation = null;
          communication.lastSpokenAtSeconds = null;
          communication.lastHeardAtSeconds = null;
        }

        if (!options.keepEdges) {
          butterfly.lifeSim.socialEdges = {};
        }
        if (!options.keepLessons && butterfly.lifeSim.upbringing) {
          butterfly.lifeSim.upbringing.lessons = [];
        }

        butterfly.lifeSim.social.activeContext = 'wandering';
        butterfly.lifeSim.derived.socialEcology = null;
        butterfly.lifeSim.derived.migration = butterfly.lifeSim.derived.migration || {};
        butterfly.lifeSim.drives.rest = options.rest ?? butterfly.lifeSim.drives.rest;
        butterfly.lifeSim.drives.socialConnection = options.socialConnection ?? butterfly.lifeSim.drives.socialConnection;
        butterfly.lifeSim.drives.statusExpression = options.statusExpression ?? butterfly.lifeSim.drives.statusExpression;
        butterfly.lifeSim.drives.safetyAvoidance = options.safetyAvoidance ?? butterfly.lifeSim.drives.safetyAvoidance;
        butterfly.lifeSim.emotions.relief = options.relief ?? butterfly.lifeSim.emotions.relief;
        butterfly.lifeSim.emotions.threat = options.threat ?? butterfly.lifeSim.emotions.threat;
        butterfly.lifeSim.emotions.curiosity = options.curiosity ?? butterfly.lifeSim.emotions.curiosity;
        butterfly.lifeSim.social.confidence = options.socialConfidence ?? butterfly.lifeSim.social.confidence;

        sleepSystem?.wakeEntity?.(butterfly.id, 'audit-reset');
        sleepSystem?.setExhaustion?.(butterfly.id, options.exhaustion ?? 0.2);
      },
      isolateButterflies(allButterflies, activeButterflies, zoneId, offZoneId) {
        const activeIds = new Set(activeButterflies.map(entry => entry.id));
        allButterflies
          .filter(entry => !activeIds.has(entry.id))
          .forEach((butterfly, index) => {
            this.resetButterfly(butterfly, {
              rest: 0.32,
              socialConnection: 0.18,
              statusExpression: 0.16,
              safetyAvoidance: 0.18,
              relief: 0.08,
              threat: 0.04,
              socialConfidence: 0.18,
              exhaustion: 0.14
            });
            gameCore.assignEntityToZone(butterfly, offZoneId);
            butterfly.x = 180 + (index * 16);
            butterfly.y = 180 + (index * 12);
          });
      }
    };
  });
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && (state.butterflies?.length || 0) >= 6;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(800);
}

async function advanceSocialEcology(page, steps = 8, deltaSeconds = 0.35) {
  await page.evaluate(({ steps: frameSteps, deltaSeconds: dt }) => {
    for (let index = 0; index < frameSteps; index += 1) {
      const state = gameCore.getGameState();
      zoneSystem?.update?.(state, 0);
      statusSystem?.reconcileAuras?.(state);
      objectSystem?.update?.(state, 0);
      structureSystem?.update?.(state, 0);
      physicsSystem?.update?.(state, 0);
      sleepSystem?.update?.(state, dt);
      lifeSimSystem?.update?.(state, dt);
      communicationSystem?.update?.(state, dt);
      behaviorSystem?.update?.(state, dt);
    }
    const state = gameCore.getGameState();
    lifeSimSystem?.update?.(state, 0);
    behaviorSystem?.update?.(state, 0);
  }, { steps, deltaSeconds });
  await page.waitForTimeout(180);
}

async function configureInspect(page, targetId) {
  await page.evaluate((nextTargetId) => {
    const state = gameCore.getGameState();
    debugUI.enabled = true;
    gameUI.inspectPanel.visible = true;
    gameUI.activityLogPanel.visible = true;
    gameUI.inspectPanel.lockedTargetId = nextTargetId;
    gameUI.syncPanelLayouts?.(state);
  }, targetId);
  await page.waitForTimeout(180);
}

async function collectSnapshot(page, targetId) {
  return page.evaluate((nextTargetId) => {
    const state = gameCore.getGameState();
    gameUI.inspectPanel.visible = true;
    gameUI.inspectPanel.lockedTargetId = nextTargetId;
    gameUI.syncPanelLayouts?.(state);
    const summary = lifeSimSystem.getEntitySummary?.(nextTargetId) || null;
    const communication = communicationSystem.getCommunicationSummary?.(nextTargetId) || null;
    const behavior = behaviorSystem.getRuntime?.(nextTargetId) || null;
    const spatial = debugUI.buildSpatialFocusSnapshot?.(state) || null;
    const butterfly = (state.butterflies || []).find(entry => entry.id === nextTargetId) || null;
    return {
      butterfly: butterfly ? {
        id: butterfly.id,
        label: butterfly.displayName || butterfly.personalityType || butterfly.id,
        state: butterfly.state,
        zoneId: butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || null
      } : null,
      summary,
      communication,
      behavior,
      spatial
    };
  }, targetId);
}

async function phase(page, report, outputDir, name, setup, predicate) {
  await resetBaseline(page);
  const targetId = await setup();
  await configureInspect(page, targetId);
  const details = await collectSnapshot(page, targetId);
  const screenshot = await saveShot(page, outputDir, name);
  report.phases.push({
    name,
    pass: !!predicate(details),
    details,
    screenshot
  });
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

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
      viewport: { width: 1600, height: 900 }
    });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    await phase(
      page,
      report,
      outputDir,
      '01-roost-pocket',
      async () => {
        const targetId = await page.evaluate(() => {
          const state = gameCore.getGameState();
          const audit = window.__e4Audit;
          const zoneId = gameCore.getZoneIds().find(id => id !== 'sun-court') || state.focusedZoneId;
          const offZoneId = gameCore.getZoneIds().find(id => id !== zoneId && id !== 'sun-court') || zoneId;
          const isTeacher = butterfly => (butterfly.getSpecialAbility?.() || butterfly.specialAbility) === 'teacher';
          gameCore.focusZone(zoneId);
          const allButterflies = state.butterflies || [];
          audit.clearGlobalState();
          const anchor = allButterflies.find(butterfly => !isTeacher(butterfly)) || allButterflies[0];
          const butterflies = (
            allButterflies.filter(butterfly => butterfly.sex === anchor.sex && !isTeacher(butterfly)).slice(0, 3).length >= 3
              ? allButterflies.filter(butterfly => butterfly.sex === anchor.sex && !isTeacher(butterfly)).slice(0, 3)
              : allButterflies.filter(butterfly => !isTeacher(butterfly)).slice(0, 3)
          );
          const target = butterflies[0];
          const basePoint = structureSystem?.getPreferredShelterPointForEntity?.(target, zoneId)
            || gameCore.getRandomZonePoint?.(zoneId, 26)
            || { x: target.x, y: target.y };
          butterflies.forEach((butterfly, index) => {
            audit.resetButterfly(butterfly, {
              rest: 0.88 - (index * 0.05),
              socialConnection: 0.12,
              statusExpression: 0.08,
              safetyAvoidance: 0.18,
              relief: 0.42,
              threat: 0.04,
              socialConfidence: 0.12,
              exhaustion: 0.76 - (index * 0.06)
            });
            gameCore.assignEntityToZone(butterfly, zoneId);
            butterfly.x = basePoint.x + ((index - 1) * 10);
            butterfly.y = basePoint.y + (index * 4);
          });
          audit.isolateButterflies(allButterflies, butterflies, zoneId, offZoneId);
          sleepSystem.setSleepSubtype?.(butterflies[1].id, 'settling_sleep', 'audit-roost');
          sleepSystem.setSleepSubtype?.(butterflies[2].id, 'normal_sleep', 'audit-roost');
          eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
            sourceId: butterflies[0].id,
            targetIds: [butterflies[1].id, butterflies[2].id],
            zoneId,
            signalType: 'calming_signal',
            intensity: 0.82
          });
          return butterflies[0].id;
        });
        await advanceSocialEcology(page, 5, 0.35);
        return targetId;
      },
      details => {
        const ecology = details.summary?.socialEcology || {};
        const subtype = details.behavior?.currentActionSubtype || null;
        return (
          (ecology.primaryRhythm === 'roosting-pocket' || (ecology.roosting?.score || 0) >= 38) &&
          (
            ['roosting', 'shelter-seeking', 'settling_sleep', 'normal_sleep', 'oversleeping'].includes(subtype)
            || details.behavior?.currentActionFamily === 'sleep'
          ) &&
          details.communication?.localSignalFieldFamily === 'calming' &&
          (details.spatial?.lines || []).some(line => /Rhythm /.test(line))
        );
      }
    );

    await phase(
      page,
      report,
      outputDir,
      '02-warning-cascade',
      async () => {
        const targetId = await page.evaluate(() => {
          const state = gameCore.getGameState();
          const audit = window.__e4Audit;
          const zoneId = gameCore.getZoneIds().find(id => id !== 'sun-court') || state.focusedZoneId;
          const offZoneId = gameCore.getZoneIds().find(id => id !== zoneId && id !== 'sun-court') || zoneId;
          const isTeacher = butterfly => (butterfly.getSpecialAbility?.() || butterfly.specialAbility) === 'teacher';
          gameCore.focusZone(zoneId);
          const allButterflies = state.butterflies || [];
          audit.clearGlobalState();
          const anchor = allButterflies.find(butterfly => !isTeacher(butterfly)) || allButterflies[0];
          const butterflies = (
            allButterflies.filter(butterfly => butterfly.sex === anchor.sex && !isTeacher(butterfly)).slice(0, 3).length >= 3
              ? allButterflies.filter(butterfly => butterfly.sex === anchor.sex && !isTeacher(butterfly)).slice(0, 3)
              : allButterflies.filter(butterfly => !isTeacher(butterfly)).slice(0, 3)
          );
          butterflies.forEach((butterfly, index) => {
            audit.resetButterfly(butterfly, {
              rest: 0.22,
              socialConnection: 0.16,
              statusExpression: 0.12,
              safetyAvoidance: 0.84 - (index * 0.08),
              relief: 0.04,
              threat: 0.32 + (index * 0.08),
              socialConfidence: 0.14,
              exhaustion: 0.22
            });
            gameCore.assignEntityToZone(butterfly, zoneId);
            butterfly.x = 320 + (index * 18);
            butterfly.y = 250 + (index * 8);
          });
          audit.isolateButterflies(allButterflies, butterflies, zoneId, offZoneId);
          butterflies[0].changeState?.('scared', {
            cursorX: butterflies[0].x - 20,
            cursorY: butterflies[0].y - 12
          });
          eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
            sourceId: butterflies[0].id,
            targetIds: [butterflies[1].id, butterflies[2].id],
            zoneId,
            signalType: 'warning_signal',
            intensity: 0.9
          });
          return butterflies[1].id;
        });
        await advanceSocialEcology(page, 5, 0.35);
        return targetId;
      },
      details => {
        const ecology = details.summary?.socialEcology || {};
        return (
          (ecology.primaryRhythm === 'warning-cascade' || (ecology.warning?.score || 0) >= 24) &&
          details.communication?.localSignalFieldFamily === 'warning' &&
          ['warning-cascade', 'shelter-seeking'].includes(details.behavior?.currentActionSubtype) &&
          (details.spatial?.lines || []).some(line => /Rhythm /.test(line))
        );
      }
    );

    await phase(
      page,
      report,
      outputDir,
      '03-teaching-pocket',
      async () => {
        const targetId = await page.evaluate(() => {
          const state = gameCore.getGameState();
          const audit = window.__e4Audit;
          const zoneId = 'sun-court';
          const offZoneId = gameCore.getZoneIds().find(id => id !== zoneId) || zoneId;
          const allButterflies = state.butterflies || [];
          audit.clearGlobalState();
          const butterflies = allButterflies.slice(0, 3);
          const teacher = butterflies.find(entry => (entry.getSpecialAbility?.() || entry.specialAbility) === 'teacher') || butterflies[0];
          const learners = butterflies.filter(entry => entry.id !== teacher.id).slice(0, 2);
          const station = gameCore.getZoneConfig(zoneId)?.renderProfile?.trainingStations?.[0] || { x: 500, y: 270 };

          gameCore.focusZone(zoneId);
          [teacher, ...learners].forEach((butterfly, index) => {
            audit.resetButterfly(butterfly, {
              keepLessons: butterfly.id !== teacher.id,
              rest: 0.24,
              socialConnection: 0.42,
              statusExpression: 0.38,
              safetyAvoidance: 0.18,
              relief: 0.12,
              threat: 0.06,
              socialConfidence: butterfly.id === teacher.id ? 0.62 : 0.28,
              exhaustion: 0.16
            });
            gameCore.assignEntityToZone(butterfly, zoneId);
            butterfly.x = station.x + ((index - 1) * 16);
            butterfly.y = station.y + (index * 8);
          });
          audit.isolateButterflies(allButterflies, [teacher, ...learners], zoneId, offZoneId);

          learners.forEach((learner, index) => {
            const lessonContent = {
              source: 'training-ground',
              zoneId,
              stationLabel: 'training grounds',
              teacherArchetype: teacher.personalityType
            };
            teachingSystem.beginTeach?.(teacher.id, learner.id, 'training_drill', lessonContent);
            const resolved = teachingSystem.resolveLesson?.(learner.id, {
              teacherId: teacher.id,
              lessonCategory: 'training_drill',
              completedAtSeconds: (teachingSystem.simulationClockSeconds || 0) + 1 + index,
              content: lessonContent
            });
            if (resolved) {
              teachingSystem.applyResolvedLesson?.(learner, teacher, resolved);
            }
          });

          eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
            sourceId: teacher.id,
            targetIds: learners.map(entry => entry.id),
            zoneId,
            signalType: 'teaching_signal',
            intensity: 0.86
          });

          return learners[0].id;
        });
        await advanceSocialEcology(page, 8, 0.4);
        return targetId;
      },
      details => {
        const ecology = details.summary?.socialEcology || {};
        return (
          (ecology.primaryRhythm === 'teaching-pocket' || (ecology.teaching?.score || 0) >= 50) &&
          details.communication?.localSignalFieldFamily === 'teaching' &&
          details.behavior?.currentActionSubtype === 'teaching-pocket' &&
          (details.spatial?.lines || []).some(line => /Rhythm /.test(line))
        );
      }
    );

    await phase(
      page,
      report,
      outputDir,
      '04-courtship-territory',
      async () => {
        const targetId = await page.evaluate(() => {
          const state = gameCore.getGameState();
          const audit = window.__e4Audit;
          const zoneId = gameCore.getZoneIds().find(id => id !== 'sun-court') || state.focusedZoneId;
          const offZoneId = gameCore.getZoneIds().find(id => id !== zoneId && id !== 'sun-court') || zoneId;
          const allButterflies = state.butterflies || [];
          const candidates = allButterflies.filter(entry => (entry.getSpecialAbility?.() || entry.specialAbility) !== 'teacher');
          const source = candidates[0] || allButterflies[0];
          const target = candidates.find(entry => entry.id !== source.id && entry.sex !== source.sex) || candidates[1] || allButterflies[1];
          const others = allButterflies.filter(entry => entry.id !== source.id && entry.id !== target.id);
          audit.clearGlobalState();
          gameCore.focusZone(zoneId);
          audit.resetButterfly(source, {
            keepEdges: true,
            rest: 0.2,
            socialConnection: 0.88,
            statusExpression: 0.74,
            safetyAvoidance: 0.14,
            relief: 0.24,
            threat: 0.04,
            socialConfidence: 0.82,
            exhaustion: 0.14
          });
          audit.resetButterfly(target, {
            keepEdges: true,
            rest: 0.22,
            socialConnection: 0.8,
            statusExpression: 0.52,
            safetyAvoidance: 0.16,
            relief: 0.22,
            threat: 0.04,
            socialConfidence: 0.58,
            exhaustion: 0.16
          });
          gameCore.assignEntityToZone(source, zoneId);
          gameCore.assignEntityToZone(target, zoneId);
          source.x = 420;
          source.y = 248;
          target.x = 438;
          target.y = 256;
          adjustLifeSocialEdge?.(source, target.id, {
            trust: 0.28,
            comfort: 0.34,
            admiration: 0.18,
            attachment: 0.36
          }, { tag: 'audit-courtship' });
          adjustLifeSocialEdge?.(target, source.id, {
            trust: 0.24,
            comfort: 0.32,
            admiration: 0.16,
            attachment: 0.28
          }, { tag: 'audit-courtship' });
          audit.isolateButterflies(allButterflies, [source, target], zoneId, offZoneId);
          eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
            sourceId: source.id,
            targetId: target.id,
            zoneId,
            signalType: 'courtship_signal',
            intensity: 0.88
          });
          return source.id;
        });
        await advanceSocialEcology(page, 3, 0.35);
        return targetId;
      },
      details => {
        const ecology = details.summary?.socialEcology || {};
        return (
          (ecology.primaryRhythm === 'courtship-territory' || (ecology.courtship?.score || 0) >= 28) &&
          details.communication?.localSignalFieldFamily === 'courtship' &&
          details.behavior?.currentActionSubtype === 'courtship-territory' &&
          (details.spatial?.lines || []).some(line => /Rhythm /.test(line))
        );
      }
    );

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'warn';
  } catch (error) {
    report.overall = 'fail';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (report.overall === 'fail') process.exitCode = 1;
  }
}

run();
