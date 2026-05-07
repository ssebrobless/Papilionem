const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'final_grand_plan_audit');
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

function safeStringify(value) {
  const seen = new WeakSet();
  return JSON.stringify(value, (key, current) => {
    if (!current || typeof current !== 'object') {
      return current;
    }
    if (seen.has(current)) {
      return '[Circular]';
    }
    seen.add(current);

    if (Array.isArray(current)) {
      return current;
    }

    if (current.id && (
      current.currentFeeder ||
      current.currentZoneId ||
      current.personalityType ||
      current.objectProfile ||
      current.lifeSim ||
      current.lifecycleData
    )) {
      return {
        id: current.id,
        label: current.displayName || current.label || current.personalityType || current.flowerType || current.constructor?.name || 'entity'
      };
    }

    return current;
  }, 2);
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

async function getSummary(page) {
  return page.evaluate(() => {
    const state = gameCore?.getGameState?.() || {};
    const telemetry = gameCore?.getTelemetrySnapshot?.() || null;
    const history = eventBus?.getHistory?.() || [];
    const activeEffects = typeof specialEffects !== 'undefined' ? specialEffects.activeEffects?.length || 0 : 0;
    const activeSignals = typeof communicationSystem !== 'undefined'
      ? communicationSystem.activeSignals?.size || 0
      : 0;
    return {
      focusedZoneId: state.focusedZoneId || null,
      viewMode: state.viewMode || null,
      butterflies: state.butterflies?.length || 0,
      wildButterflies: (state.butterflies || []).filter(entry => entry.birthSource !== 'bred').length,
      bredButterflies: (state.butterflies || []).filter(entry => entry.birthSource === 'bred').length,
      flowers: state.flowers?.length || 0,
      eggFlowers: (state.flowers || []).filter(entry => entry.occupancyState === 'egg').length,
      chrysalisFlowers: (state.flowers || []).filter(entry => entry.occupancyState === 'chrysalis').length,
      caterpillars: state.caterpillars?.length || 0,
      hybridJournal: state.hybridJournal?.length || 0,
      pendingOffspringReservations: state.pendingOffspringReservations || 0,
      activeEffects,
      activeSignals,
      telemetry,
      recentEvents: history.slice(-20).map(entry => ({
        event: entry.event,
        data: entry.data,
        timestamp: entry.timestamp,
        frame: entry.frame
      }))
    };
  });
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
    return state && state.butterflies && state.butterflies.length >= 4 && state.flowers && state.flowers.length >= 2;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1000);
}

async function applyPreset(page, presetId) {
  const applied = await page.evaluate((nextPresetId) => {
    const serialized = debugUI?.buildAuditPresetState?.(nextPresetId);
    if (!serialized) return false;
    gameCore.applySerializedState(serialized);
    return true;
  }, presetId);
  if (!applied) {
    throw new Error(`Failed to apply preset: ${presetId}`);
  }
  await page.waitForTimeout(900);
}

async function openInspectAndFeed(page, targetId) {
  await page.evaluate((nextTargetId) => {
    gameUI.inspectPanel.visible = true;
    gameUI.activityLogPanel.visible = true;
    gameUI.inspectPanel.lockedTargetId = nextTargetId;
  }, targetId);
  await page.waitForTimeout(300);
}

async function installAuditEventCapture(page, captureName, eventNames = []) {
  await page.evaluate(({ name, events }) => {
    window.__finalGrandPlanEventCaptures = window.__finalGrandPlanEventCaptures || {};
    const previous = window.__finalGrandPlanEventCaptures[name];
    if (previous?.unsubscribers) {
      previous.unsubscribers.forEach(unsubscribe => {
        try { unsubscribe?.(); } catch (error) {}
      });
    }
    const bucket = {
      events: [],
      unsubscribers: []
    };
    for (const eventName of events || []) {
      const unsubscribe = eventBus?.on?.(eventName, data => {
        bucket.events.push({
          event: eventName,
          data,
          timestamp: Date.now(),
          frame: gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : null)
        });
      });
      if (typeof unsubscribe === 'function') {
        bucket.unsubscribers.push(unsubscribe);
      }
    }
    window.__finalGrandPlanEventCaptures[name] = bucket;
  }, { name: captureName, events: eventNames });
}

async function readAuditEventCapture(page, captureName, clear = true) {
  return await page.evaluate(({ name, shouldClear }) => {
    const capture = window.__finalGrandPlanEventCaptures?.[name];
    const events = (capture?.events || []).map(entry => ({
      event: entry.event,
      data: entry.data,
      timestamp: entry.timestamp,
      frame: entry.frame
    }));
    if (shouldClear && capture?.unsubscribers) {
      capture.unsubscribers.forEach(unsubscribe => {
        try { unsubscribe?.(); } catch (error) {}
      });
      delete window.__finalGrandPlanEventCaptures[name];
    }
    return events;
  }, { name: captureName, shouldClear: clear });
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
    phases: [],
    screenshots: [],
    pageErrors: [],
    consoleErrors: [],
    server: null,
    video: null,
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

    page.on('pageerror', error => {
      report.pageErrors.push(String(error));
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    report.screenshots.push(await saveShot(page, outputDir, '01-title'));
    await clearStorageAndReset(page);
    report.screenshots.push(await saveShot(page, outputDir, '02-baseline-reset'));
    report.phases.push({
      name: 'baseline-reset',
      pass: true,
      summary: await getSummary(page)
    });

    const zoneIds = ['ivy-cloister', 'pool-heart', 'moss-hollow', 'sun-court'];
    const zoneShots = [];
    for (let index = 0; index < zoneIds.length; index += 1) {
      const zoneId = zoneIds[index];
      await page.evaluate((nextZoneId) => {
        gameCore.focusZone(nextZoneId);
      }, zoneId);
      await page.waitForTimeout(450);
      zoneShots.push(await saveShot(page, outputDir, `03-zone-${String(index + 1).padStart(2, '0')}-${zoneId}`));
    }
    report.screenshots.push(...zoneShots);
    const zoneSummary = await getSummary(page);
    report.phases.push({
      name: 'zone-shell',
      pass: zoneSummary.focusedZoneId === 'sun-court',
      summary: zoneSummary
    });

    await page.evaluate(() => {
      gameCore.setViewMode('overview');
    });
    await page.waitForTimeout(350);
    report.screenshots.push(await saveShot(page, outputDir, '04-overview'));
    await page.evaluate(() => {
      gameCore.focusZone('ivy-cloister');
    });
    await page.waitForTimeout(350);

    await page.evaluate(() => {
      gameUI.accessibilityPanel.visible = true;
      gameUI.setAccessibilitySettings({
        highContrastUI: true,
        reducedMotion: true,
        trailVisibility: 'reduced',
        backgroundAtmosphere: 'minimal'
      });
    });
    await page.waitForTimeout(300);
    report.screenshots.push(await saveShot(page, outputDir, '05-accessibility-high-contrast'));
    await page.evaluate(() => {
      gameUI.accessibilityPanel.visible = false;
      gameUI.setAccessibilitySettings({
        highContrastUI: false,
        reducedMotion: false,
        trailVisibility: 'full',
        backgroundAtmosphere: 'full'
      });
    });

    await applyPreset(page, 'hybrid-lineage');
    await page.evaluate(() => {
      gameCore.focusZone('pool-heart');
      const target = (gameCore.getGameState().butterflies || []).find(b => b.isHybrid) || gameCore.getGameState().butterflies?.[0];
      if (target?.id) {
        gameUI.inspectPanel.visible = true;
        gameUI.activityLogPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = target.id;
      }
      gameUI.butterflyCollection.visible = true;
      const pages = gameUI.butterflyCollection.getPages();
      const hybridIndex = pages.findIndex(page => page.kind === 'hybrid');
      if (hybridIndex >= 0) {
        gameUI.butterflyCollection.currentIndex = hybridIndex;
      }
    });
    await page.waitForTimeout(500);
    report.screenshots.push(await saveShot(page, outputDir, '06-hybrid-inspect-and-journal'));
    const hybridSummary = await getSummary(page);
    report.phases.push({
      name: 'hybrid-stats-and-journal',
      pass: hybridSummary.hybridJournal > 0,
      summary: hybridSummary
    });

    await applyPreset(page, 'teaching-pair');
    await installAuditEventCapture(page, 'training', [
      'training:drillStarted',
      'training:drillCompleted',
      'teaching:completed'
    ]);
    await page.evaluate(() => {
      gameCore.focusZone('sun-court');
      const trainingZoneId = 'sun-court';
      const state = gameCore.gameState;
      const stations = gameCore.getZoneConfig(trainingZoneId)?.renderProfile?.trainingStations || [];
      state.butterflies.forEach((butterfly, index) => {
        gameCore.assignEntityToZone(butterfly, trainingZoneId);
        const station = stations[index % Math.max(1, stations.length)] || { x: 400, y: 260 };
        butterfly.x = station.x + ((index - 1) * 18);
        butterfly.y = station.y + ((index % 2) * 16);
      });
      state.flowers.forEach(flower => {
        gameCore.assignEntityToZone(flower, trainingZoneId);
      });
      teachingSystem.trainingCooldownsByTeacher.clear();
      teachingSystem.simulationClockSeconds = 999;
      teachingSystem.updateTrainingGrounds(state);
      teachingSystem.simulationClockSeconds += 2;
      teachingSystem.updateActiveLessons();
      communicationSystem.update(state, 0.8);
      communicationSystem.simulationClockSeconds += 1.2;
      communicationSystem.update(state, 0.8);
      gameUI.activityLogPanel.visible = true;
      gameUI.inspectPanel.visible = false;
      gameUI.butterflyCollection.visible = false;
    });
    await page.waitForTimeout(1200);
    const trainingSummary = await getSummary(page);
    const capturedTrainingEvents = await readAuditEventCapture(page, 'training');
    const trainingAudit = await page.evaluate(() => {
      const history = eventBus?.getHistory?.() || [];
      return {
        drillStarted: history.some(entry => entry.event === 'training:drillStarted'),
        drillCompleted: history.some(entry => entry.event === 'training:drillCompleted'),
        teachingCompleted: history.some(entry => entry.event === 'teaching:completed')
      };
    });
    trainingAudit.capturedEvents = capturedTrainingEvents.map(entry => ({
      event: entry.event,
      frame: entry.frame,
      teacherId: entry.data?.teacherId || null,
      listenerId: entry.data?.listenerId || null,
      listenerIds: entry.data?.listenerIds || null,
      zoneId: entry.data?.zoneId || null
    }));
    trainingAudit.capturedDrillStarted = capturedTrainingEvents.some(entry => entry.event === 'training:drillStarted');
    trainingAudit.capturedDrillCompleted = capturedTrainingEvents.some(entry => entry.event === 'training:drillCompleted');
    trainingAudit.capturedTeachingCompleted = capturedTrainingEvents.some(entry => entry.event === 'teaching:completed');
    const trainingStarted =
      trainingAudit.drillStarted ||
      trainingAudit.drillCompleted ||
      trainingAudit.teachingCompleted ||
      trainingAudit.capturedDrillStarted ||
      trainingAudit.capturedDrillCompleted ||
      trainingAudit.capturedTeachingCompleted;
    report.screenshots.push(await saveShot(page, outputDir, '07-training-grounds-feed'));
    report.phases.push({
      name: 'training-grounds',
      pass: trainingStarted,
      summary: {
        ...trainingSummary,
        trainingAudit
      }
    });

    await applyPreset(page, 'teaching-pair');
    await page.evaluate(() => {
      const trainingZoneId = 'sun-court';
      gameCore.focusZone(trainingZoneId);
      const state = gameCore.gameState;
      const stations = gameCore.getZoneConfig(trainingZoneId)?.renderProfile?.trainingStations || [];
      state.butterflies.forEach((butterfly, index) => {
        gameCore.assignEntityToZone(butterfly, trainingZoneId);
        const station = stations[index % Math.max(1, stations.length)] || { x: 400, y: 260 };
        butterfly.x = station.x + ((index - 1) * 14);
        butterfly.y = station.y + ((index % 2) * 12);
      });
      teachingSystem.trainingCooldownsByTeacher.clear();
      teachingSystem.simulationClockSeconds = 999;
      teachingSystem.updateTrainingGrounds(state);
      teachingSystem.simulationClockSeconds += 2;
      teachingSystem.updateActiveLessons();
      const source = state.butterflies?.[0];
      const listener = state.butterflies?.[1];
      if (source?.id && listener?.id) {
        eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
          sourceId: source.id,
          sourceButterfly: source,
          signalType: 'guidance_signal',
          phrase: 'take the shining path',
          intent: 'guide partner',
          targetIds: [listener.id],
          zoneId: trainingZoneId
        });
      }
      communicationSystem.update(state, 0.8);
      communicationSystem.simulationClockSeconds += 1.2;
      communicationSystem.update(state, 0.8);
    });
    await page.waitForTimeout(800);
    const commState = await page.evaluate(() => {
      const state = gameCore.gameState;
      const source = state.butterflies?.[0];
      const listener = state.butterflies?.[1];
      if (source?.id) {
        gameUI.inspectPanel.visible = true;
        gameUI.activityLogPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = source.id;
      }
      return {
        sourceId: source?.id || null,
        listenerId: listener?.id || null
      };
    });
    await page.waitForTimeout(300);
    report.screenshots.push(await saveShot(page, outputDir, '08-communication-speaker'));
    if (commState.listenerId) {
      await openInspectAndFeed(page, commState.listenerId);
      report.screenshots.push(await saveShot(page, outputDir, '09-communication-listener'));
    }
    const commSummary = await getSummary(page);
    const communicationAudit = await page.evaluate((listenerId) => {
      const entries = communicationSystem.getFeedEntries({ limit: 10 });
      const listenerSummary = listenerId ? communicationSystem.getCommunicationSummary(listenerId) : null;
      return {
        feedCount: entries.length,
        listenerSummary
      };
    }, commState.listenerId);
    const sawCommunication = communicationAudit.feedCount > 0 &&
      !!(communicationAudit.listenerSummary?.recentHeardPhrase || communicationAudit.listenerSummary?.recentHeardLabel);
    report.phases.push({
      name: 'communication',
      pass: sawCommunication && commSummary.activeSignals >= 0,
      summary: {
        ...commSummary,
        communicationAudit
      }
    });

    await page.evaluate(() => {
      gameCore.resetGame(true);
    });
    await page.waitForFunction(() => {
      const state = gameCore?.getGameState?.();
      return state && state.butterflies && state.butterflies.length >= 4;
    }, null, { timeout: 20000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const state = gameCore.gameState;
      const focusedZoneId = gameCore.getFocusedZoneId();
      const female = (state.butterflies || []).find(b => b.sex === 'F');
      const male = (state.butterflies || []).find(b => b.sex === 'M');
      if (!female || !male) return;
      const targetFlower = breedingSystem.findNearestFlowerForEgg(female, state.flowers);
      if (!targetFlower) return;
      gameCore.assignEntityToZone(female, focusedZoneId);
      gameCore.assignEntityToZone(male, focusedZoneId);
      gameCore.assignEntityToZone(targetFlower, focusedZoneId);
      female.x = 390;
      female.y = 265;
      male.x = 402;
      male.y = 268;
      female.pregnancy = {
        active: true,
        lifecycleData: breedingSystem.createLifecycleData(female, male),
        targetFlower
      };
      breedingSystem.layEggAndFeed(female, targetFlower);
    });
    await page.waitForFunction(() => {
      const state = gameCore.getGameState();
      return (state.flowers || []).some(f => f.occupancyState === 'egg');
    }, null, { timeout: 10000 });
    report.screenshots.push(await saveShot(page, outputDir, '10-lifecycle-egg'));
    await page.evaluate(() => {
      breedingSystem.hatchAllEggs(gameCore.getGameState());
    });
    await page.waitForFunction(() => {
      const state = gameCore.getGameState();
      return (state.caterpillars || []).length > 0;
    }, null, { timeout: 10000 });
    report.screenshots.push(await saveShot(page, outputDir, '11-lifecycle-caterpillar'));
    await page.evaluate(() => {
      const state = gameCore.gameState;
      breedingSystem.spawnFlowersAtCaterpillars(state);
      for (const caterpillar of state.caterpillars || []) {
        caterpillar.phase = 'seekingChrysalis';
        caterpillar.phaseStartedAt = frameCount - caterpillar.minimumLarvalFrames - 10;
        caterpillar.acquireTarget(state.flowers || []);
        if (caterpillar.targetFlower) {
          caterpillar.x = caterpillar.targetFlower.x;
          caterpillar.y = caterpillar.targetFlower.y;
          caterpillar.onReachFlower(state);
        }
      }
    });
    await page.waitForFunction(() => {
      const state = gameCore.getGameState();
      return (state.flowers || []).some(f => f.occupancyState === 'chrysalis');
    }, null, { timeout: 10000 });
    report.screenshots.push(await saveShot(page, outputDir, '12-lifecycle-chrysalis'));
    await page.evaluate(() => {
      breedingSystem.hatchAllCocoons(gameCore.getGameState());
    });
    await page.waitForFunction(() => {
      const state = gameCore.getGameState();
      return (state.hybridJournal || []).length > 0;
    }, null, { timeout: 10000 });
    report.screenshots.push(await saveShot(page, outputDir, '13-lifecycle-adult-emerged'));
    const lifecycleSummary = await getSummary(page);
    report.phases.push({
      name: 'lifecycle',
      pass: lifecycleSummary.hybridJournal > 0 && lifecycleSummary.bredButterflies > 0,
      summary: lifecycleSummary
    });

    await page.evaluate(() => {
      gameCore.resetGame(true);
    });
    await page.waitForFunction(() => gameCore.getGameState().butterflies.length >= 4, null, { timeout: 20000 });
    await page.waitForTimeout(1000);
    const wildExitAudit = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const zoneIds = gameCore.getZoneIds();
      const startZoneId = progressionManager.getFreshSeedZoneId(state, zoneIds);
      const butterflies = (state.butterflies || []).filter(entry =>
        gameCore.getEntityZoneId(entry, null) === startZoneId &&
        entry.birthSource !== 'bred'
      );
      const female = butterflies.find(entry => entry.sex === 'F');
      const males = butterflies.filter(entry => entry.sex === 'M').slice(0, 3);
      if (!female || males.length < 3) {
        return { ok: false, reason: 'missing-third-mating-setup' };
      }

      const beforeCount = state.butterflies.length;
      const results = [];
      for (const male of males) {
        const result = progressionManager.recordSuccessfulOffspring(state, female, male, {});
        results.push({
          maleId: male.id,
          departures: result.departures || []
        });
        for (const butterflyId of result.departures || []) {
          const departing = (state.butterflies || []).find(entry => entry.id === butterflyId) || null;
          if (departing) {
            gameCore.removeButterflyFromGame(departing);
          }
        }
      }

      gameCore.focusZone(startZoneId);
      return {
        ok: true,
        startZoneId,
        beforeCount,
        afterCount: state.butterflies.length,
        femaleStillAlive: (state.butterflies || []).some(entry => entry.id === female.id),
        femaleProgress: progressionManager.getWildProgress(state, female.id),
        results
      };
    });
    await page.waitForTimeout(300);
    report.screenshots.push(await saveShot(page, outputDir, '14-wild-exit'));
    report.phases.push({
      name: 'wild-exit',
      pass:
        !!wildExitAudit.ok &&
        wildExitAudit.results?.length === 3 &&
        Array.isArray(wildExitAudit.results?.[2]?.departures) &&
        wildExitAudit.results[2].departures.includes(wildExitAudit.femaleProgress?.butterflyId) &&
        wildExitAudit.femaleStillAlive === false &&
        wildExitAudit.femaleProgress?.departed === true &&
        wildExitAudit.afterCount === wildExitAudit.beforeCount - 1,
      summary: {
        ...(await getSummary(page)),
        wildExitAudit
      }
    });

    await page.evaluate(() => {
      gameCore.resetGame(true);
    });
    await page.waitForFunction(() => gameCore.getGameState().butterflies.length >= 4, null, { timeout: 20000 });
    await page.waitForTimeout(1000);
    await installAuditEventCapture(page, 'migration', [
      'zone:travelStarted',
      'zone:travelCompleted'
    ]);
    const migrationSetup = await page.evaluate(() => {
      const before = (gameCore.gameState.butterflies || []).map(entry => ({
        id: entry.id,
        zoneId: gameCore.getEntityZoneId(entry, null)
      }));
      const decisionIntervalFrames = gameConfig?.balance?.migration?.decisionIntervalFrames || 360;
      frameCount = decisionIntervalFrames;
      gameCore.updateZoneEcology(gameConfig?.simulation?.fixedDeltaSeconds || (1 / 60));

      const startedTravelers = (gameCore.gameState.butterflies || []).filter(entry => entry.zoneTravel).map(entry => ({
        id: entry.id,
        from: entry.zoneTravel?.sourceZoneId || null,
        to: entry.zoneTravel?.targetZoneId || null
      }));
      const departureZoneId = startedTravelers[0]?.from || gameCore.getFocusedZoneId();
      gameCore.focusZone(departureZoneId);
      gameUI.activityLogPanel.visible = true;
      return {
        before,
        startedTravelers,
        departureZoneId
      };
    });
    await page.waitForTimeout(600);
    report.screenshots.push(await saveShot(page, outputDir, '15-migration-departing'));
    const migrationAudit = await page.evaluate((before) => {
      for (let index = 0; index < 140; index += 1) {
        gameCore.updateZoneTravelers(gameConfig?.simulation?.fixedDeltaSeconds || (1 / 60));
      }

      const after = (gameCore.gameState.butterflies || []).map(entry => ({
        id: entry.id,
        zoneId: gameCore.getEntityZoneId(entry, null)
      }));
      const changedZoneIds = [];
      for (const beforeEntry of before) {
        const afterEntry = after.find(entry => entry.id === beforeEntry.id);
        if (afterEntry && afterEntry.zoneId !== beforeEntry.zoneId) {
          changedZoneIds.push({
            id: beforeEntry.id,
            beforeZoneId: beforeEntry.zoneId,
            afterZoneId: afterEntry.zoneId
          });
        }
      }

      const occupancy = after.reduce((acc, entry) => {
        acc[entry.zoneId] = (acc[entry.zoneId] || 0) + 1;
        return acc;
      }, {});

      const arrivalZoneId = changedZoneIds[0]?.afterZoneId || null;
      if (arrivalZoneId) {
        gameCore.focusZone(arrivalZoneId);
      }

      return {
        changedZoneIds,
        occupancy,
        arrivalZoneId
      };
    }, migrationSetup.before);
    const capturedMigrationEvents = await readAuditEventCapture(page, 'migration');
    migrationAudit.capturedTravelEvents = capturedMigrationEvents.map(entry => ({
      event: entry.event,
      frame: entry.frame,
      entityId: entry.data?.entityId || entry.data?.butterflyId || null,
      sourceZoneId: entry.data?.sourceZoneId || entry.data?.fromZoneId || null,
      targetZoneId: entry.data?.targetZoneId || entry.data?.toZoneId || null
    }));
    await page.waitForTimeout(300);
    report.screenshots.push(await saveShot(page, outputDir, '16-migration-arrival'));
    const migrationSummary = await getSummary(page);
    report.phases.push({
      name: 'migration',
      pass:
        Array.isArray(migrationSetup.startedTravelers) &&
        (migrationSetup.startedTravelers.length >= 1 || capturedMigrationEvents.length >= 1) &&
        Array.isArray(migrationAudit.changedZoneIds) &&
        migrationAudit.changedZoneIds.length >= 1 &&
        Object.keys(migrationAudit.occupancy || {}).length >= 2,
      summary: {
        ...migrationSummary,
        migrationSetup: {
          departureZoneId: migrationSetup.departureZoneId,
          startedTravelers: migrationSetup.startedTravelers
        },
        migrationAudit
      }
    });

    await page.evaluate(() => {
      gameCore.resetGame(true);
      gameCore.gameState.timeScale = 4;
      gameUI.activityLogPanel.visible = false;
      gameUI.inspectPanel.visible = false;
      gameUI.butterflyCollection.visible = false;
      gameUI.accessibilityPanel.visible = false;
    });
    await page.waitForFunction(() => gameCore.getGameState().butterflies.length >= 4, null, { timeout: 20000 });
    const soakSetup = await page.evaluate(() => {
      const state = gameCore.getGameState();
      gameCore.gameState.timeScale = 4;
      gameUI.activityLogPanel.visible = false;
      gameUI.inspectPanel.visible = false;
      gameUI.butterflyCollection.visible = false;
      gameUI.accessibilityPanel.visible = false;
      const focusedZoneId = gameCore.getFocusedZoneId();
      const female = (state.butterflies || []).find(entry => entry.sex === 'F');
      const male = (state.butterflies || []).find(entry => entry.sex === 'M');
      const targetFlower = female ? breedingSystem.findNearestFlowerForEgg(female, state.flowers) : null;
      if (!female || !male || !targetFlower) {
        return { ok: false, reason: 'missing-soak-lifecycle-setup' };
      }

      gameCore.focusZone(focusedZoneId);
      gameCore.assignEntityToZone(female, focusedZoneId);
      gameCore.assignEntityToZone(male, focusedZoneId);
      gameCore.assignEntityToZone(targetFlower, focusedZoneId);
      female.x = targetFlower.x - 12;
      female.y = targetFlower.y - 6;
      male.x = targetFlower.x + 12;
      male.y = targetFlower.y - 4;
      female.pregnancy = {
        active: true,
        lifecycleData: breedingSystem.createLifecycleData(female, male),
        targetFlower
      };
      breedingSystem.layEggAndFeed(female, targetFlower);
      breedingSystem.refreshMaleCooldowns(state);
      return {
        ok: true,
        focusedZoneId,
        initialWildButterflies: (state.butterflies || []).filter(entry => entry.birthSource !== 'bred').length
      };
    });
    if (!soakSetup?.ok) {
      report.phases.push({
        name: 'short-soak',
        pass: false,
        summary: {
          ...(await getSummary(page)),
          soakSetup,
          reason: 'missing-soak-lifecycle-setup'
        }
      });
    } else {
      await page.waitForFunction(() => {
        const state = gameCore.getGameState();
        return (
          (state.flowers || []).some(entry => entry.occupancyState === 'egg') ||
          (state.caterpillars || []).length > 0
        );
      }, null, { timeout: 10000 });
      const preSoakLifecycle = await page.evaluate(() => {
        const state = gameCore.getGameState();
        return {
          bredButterflies: (state.butterflies || []).filter(entry => entry.birthSource === 'bred').length,
          wildButterflies: (state.butterflies || []).filter(entry => entry.birthSource !== 'bred').length,
          eggFlowers: (state.flowers || []).filter(entry => entry.occupancyState === 'egg').length,
          chrysalisFlowers: (state.flowers || []).filter(entry => entry.occupancyState === 'chrysalis').length,
          caterpillars: (state.caterpillars || []).length,
          pendingOffspringReservations: state.pendingOffspringReservations || 0
        };
      });
      await page.waitForTimeout(15000);
      const soakSummary = await getSummary(page);
      report.screenshots.push(await saveShot(page, outputDir, '17-soak-final'));
      const renderAverage = soakSummary.telemetry?.averages?.renderMs ?? Infinity;
      const updateAverage = soakSummary.telemetry?.averages?.updateMs ?? Infinity;
      const updateBudget =
        soakSummary.telemetry?.lastUpdateSample?.physicsBudget?.focusedGardenTotalUpdateMs ??
        soakSummary.telemetry?.mlRuntime?.budgetTargets?.focusedGardenTotalUpdateMs ??
        16;
      const maxWildButterflies = Math.max(12, soakSetup?.initialWildButterflies || 0);
      const hadLifecycleBefore =
        preSoakLifecycle.eggFlowers > 0 ||
        preSoakLifecycle.caterpillars > 0 ||
        preSoakLifecycle.chrysalisFlowers > 0 ||
        preSoakLifecycle.pendingOffspringReservations > 0;
      const hasLifecycleAfter =
        soakSummary.eggFlowers > 0 ||
        soakSummary.caterpillars > 0 ||
        soakSummary.chrysalisFlowers > 0 ||
        soakSummary.pendingOffspringReservations > 0 ||
        soakSummary.hybridJournal > 0 ||
        soakSummary.bredButterflies > 0;
      const soakPass =
        hadLifecycleBefore &&
        soakSummary.wildButterflies <= maxWildButterflies &&
        soakSummary.activeEffects <= 16 &&
        renderAverage <= 320 &&
        updateAverage <= updateBudget &&
        hasLifecycleAfter;
      report.phases.push({
        name: 'short-soak',
        pass: soakPass,
        summary: {
          ...soakSummary,
          soakSetup,
          preSoakLifecycle,
          thresholds: {
            maxWildButterflies,
            maxActiveEffects: 16,
            maxRenderAverageMs: 320,
            maxUpdateAverageMs: updateBudget
          }
        }
      });
    }

    report.overall = report.phases.every(phase => phase.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'warn';

    if (context) {
      await context.close();
      const recorded = fs.readdirSync(videoDir).find(file => file.endsWith('.webm'));
      if (recorded) {
        report.video = path.join(videoDir, recorded);
      }
    }
    if (browser) {
      await browser.close();
      browser = null;
    }
  } catch (error) {
    report.overall = 'error';
    report.error = error?.stack || String(error);
    if (context) {
      try {
        await context.close();
      } catch (_error) {}
    }
    if (browser) {
      try {
        await browser.close();
      } catch (_error) {}
    }
  } finally {
    if (!report.video && fs.existsSync(videoDir)) {
      const recorded = fs.readdirSync(videoDir).find(file => file.endsWith('.webm'));
      if (recorded) {
        report.video = path.join(videoDir, recorded);
      }
    }
    fs.writeFileSync(path.join(outputDir, 'report.json'), safeStringify(report));
  }
}

run();
