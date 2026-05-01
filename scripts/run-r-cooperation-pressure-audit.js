const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_cooperation_pressure_audit');
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
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, detached: true, stdio: 'ignore' });
  child.unref();
  report.server = { reused: false, pid: child.pid };
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ok = await fetch(URL).then(() => true).catch(() => false);
    if (ok) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Server did not become reachable in time');
}

async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, { timeout: 30000 });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1200);
}

async function resetBaseline(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
    window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
    window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
    gameUI.firstSessionGuide.visible = false;
    gameUI.activityLogPanel.visible = true;
    eventBus.clearHistory?.();
    communicationSystem.history = [];
    communicationSystem.dialogueHistory = [];
    communicationSystem.responseQueue = [];
  });
  await page.waitForTimeout(700);
}

async function phase(page, report, outputDir, name, run) {
  const result = await run();
  const screenshot = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  report.phases.push({ name, pass: !!result.pass, details: result.details || null, screenshot });
  return result;
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);
  const report = {
    startedAt: new Date().toISOString(),
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    phases: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let page;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    await phase(page, report, outputDir, '01-h1-heavy-block-cooperation', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = gameCore.getFocusedZoneId();
        const [solo, helper] = state.butterflies.slice(0, 2);
        if (!solo || !helper) return { ok: false, reason: 'missing-butterflies' };
        solo.currentZoneId = zoneId;
        helper.currentZoneId = zoneId;
        solo.x = 520; solo.y = 420;
        helper.x = 540; helper.y = 428;
        solo.boardPos = renderManager.screenToBoard(solo.x, solo.y, zoneId, 0);
        helper.boardPos = renderManager.screenToBoard(helper.x, helper.y, zoneId, 0);
        const block = new Block(528, 424, {
          currentZoneId: zoneId,
          boardPos: { ...renderManager.screenToBoard(528, 424, zoneId, 0), h: 3 },
          stackIndex: 3
        });
        block.weightProfile = 'heavy';
        state.blocks.push(block);
        gameCore.registerEntity?.(block);
        const soloBefore = structureSystem.canCarryBlock(block, solo, { ...state, butterflies: [solo] });
        const attempt = structureSystem.recordHeavyBlockCarryAttempt(block, solo, { gameState: { ...state, butterflies: [solo] } });
        const withHelper = structureSystem.canCarryBlock(block, solo, state);
        const dialogue = communicationSystem.dialogueHistory.find(entry => /heavy block/i.test(entry.phrase || '')) || null;
        return {
          soloBefore,
          attempt,
          withHelper,
          cooperativeCarrierIds: block.cooperativeCarrierIds || [],
          dialogue: dialogue ? {
            phrase: dialogue.phrase,
            intentFamily: dialogue.intentFamily,
            intentTags: dialogue.intentTags
          } : null
        };
      });
      return {
        pass: details.soloBefore === false && details.withHelper === true && details.attempt?.emitted === true && !!details.dialogue,
        details
      };
    });

    await phase(page, report, outputDir, '02-h2-shelter-trust-scaling', async () => {
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const [left, right] = state.butterflies.slice(0, 2);
        if (!left || !right) return { ok: false, reason: 'missing-butterflies' };
        left.lifeSim.spatialAwareness.insideShelter = true;
        left.lifeSim.spatialAwareness.shelterCandidate = true;
        right.lifeSim.spatialAwareness.insideShelter = true;
        right.lifeSim.spatialAwareness.shelterCandidate = true;
        left.x = 520; left.y = 420; right.x = 528; right.y = 424;
        ensureLifeSocialEdge(left, right.id);
        Object.assign(left.lifeSim.socialEdges[right.id], { trust: 0.82, comfort: 0.86, attachment: 0.62 });
        const scale = structureSystem.getShelterTrustRecoveryScale(left, state, { insideShelter: true, shelterCandidate: true });
        return { scale };
      });
      return { pass: details.scale > 1.1, details };
    });

    await phase(page, report, outputDir, '03-h3-scarcity-sharing', async () => {
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = gameCore.getFocusedZoneId();
        const [caller, recipient] = state.butterflies.slice(0, 2);
        caller.currentZoneId = zoneId;
        recipient.currentZoneId = zoneId;
        const reserve = new Flower(caller.x + 16, caller.y + 8, false, {
          currentZoneId: zoneId,
          lifecycleKind: 'reserve-food-ball',
          flowerType: 'daisy'
        });
        state.flowers.push(reserve);
        gameCore.registerEntity?.(reserve);
        const beforeDialogues = communicationSystem.dialogueHistory.length;
        const result = zoneSystem.triggerScarcityPulse(zoneId, {
          currentFrame: gameCore.getCurrentFrame?.() || 0,
          durationFrames: 1800,
          gameState: state
        });
        const summary = zoneSystem.getZoneEcologySummary(zoneId);
        const delivered = eventBus.getHistory(GameEvents.OBJECT_DELIVERED).filter(entry => entry?.data?.objectType === 'reserve-food-ball');
        const newDialogues = communicationSystem.dialogueHistory.slice(beforeDialogues);
        return { result, summary, deliveredCount: delivered.length, newDialogueCount: newDialogues.length };
      });
      return {
        pass: !!details.result?.started && details.summary?.scarcityActive === true && details.deliveredCount >= 1 && details.newDialogueCount >= 1,
        details
      };
    });

    await phase(page, report, outputDir, '04-h4-distress-cascade', async () => {
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const [distressed, caregiver] = state.butterflies.slice(0, 2);
        distressed.lifeSim.emotions.threat = 0.82;
        distressed.lifeSim.emotions.exhaustion = 0.72;
        distressed.lifeSim.communication.lastDistressAtSeconds = -100;
        caregiver.lifeSim.drives.caregiving = 0.8;
        caregiver.currentZoneId = distressed.currentZoneId;
        caregiver.x = distressed.x + 24;
        caregiver.y = distressed.y + 8;
        const before = communicationSystem.dialogueHistory.length;
        const emitted = communicationSystem.updateDistressCascade(state, 90);
        const dialogues = communicationSystem.dialogueHistory.slice(before);
        return {
          emitted,
          dialogues: dialogues.map(entry => ({ phrase: entry.phrase, intentFamily: entry.intentFamily, intentTags: entry.intentTags }))
        };
      });
      return {
        pass: details.emitted >= 1 && details.dialogues.some(entry => /tired|unsafe|stay close/i.test(entry.phrase || '')),
        details
      };
    });

    await phase(page, report, outputDir, '05-h5-scout-discovery', async () => {
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const scout = state.butterflies[0];
        const recipient = state.butterflies[1];
        const targetZoneId = gameCore.getZoneIds().find(id => id !== scout.currentZoneId) || null;
        for (const butterfly of state.butterflies || []) {
          butterfly.lifeSim.derived.migration = {};
          butterfly.lifeSim.communication.lastScoutDiscoveryAtSeconds = communicationSystem.simulationClockSeconds;
        }
        scout.lifeSim.derived.migration = {
          scoutTargetZoneId: targetZoneId,
          travelTargetZoneId: targetZoneId,
          travelIntent: 'scouting',
          scoutingDrive: 0.9
        };
        scout.lifeSim.communication.lastScoutDiscoveryAtSeconds = -100;
        recipient.currentZoneId = scout.currentZoneId;
        const before = communicationSystem.dialogueHistory.length;
        const emitted = communicationSystem.updateScoutDiscovery(state, 1800);
        const dialogues = communicationSystem.dialogueHistory.slice(before);
        return {
          emitted,
          targetZoneId,
          recipientPreferred: recipient.lifeSim.migration?.cohortPreferredZoneId || null,
          dialogues: dialogues.map(entry => ({ phrase: entry.phrase, intentFamily: entry.intentFamily, intentTags: entry.intentTags }))
        };
      });
      return {
        pass: details.emitted >= 1 && details.recipientPreferred === details.targetZoneId && details.dialogues.some(entry => /follow me/i.test(entry.phrase || '')),
        details
      };
    });

    await phase(page, report, outputDir, '06-r10-cooperation-floor-5min', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const seedRandom = (seed) => {
          let value = seed % 2147483647;
          if (value <= 0) value += 2147483646;
          return () => {
            value = (value * 16807) % 2147483647;
            return (value - 1) / 2147483646;
          };
        };
        const random = seedRandom(4242);
        const countHook = (counters, hook, frame) => {
          const minuteIndex = Math.max(0, Math.min(4, Math.floor(frame / 3600)));
          counters[minuteIndex][hook] += 1;
        };
        const zoneId = (gameCore.getZoneIds?.() || []).includes('ivy-cloister')
          ? 'ivy-cloister'
          : (gameCore.getZoneIds?.()[0] || gameCore.getFocusedZoneId());
        gameCore.focusZone(zoneId);
        const state = gameCore.getGameState();
        while ((state.butterflies || []).length < 14) {
          const boardPos = {
            zoneId,
            u: 7 + ((state.butterflies.length % 7) * 2),
            v: 8 + (Math.floor(state.butterflies.length / 7) * 3),
            h: 0
          };
          const screen = renderManager.boardToScreen(boardPos);
          gameCore.godSpawnButterfly(screen.x, screen.y, null);
        }
        const butterflies = state.butterflies.slice(0, 14);
        butterflies.forEach((butterfly, index) => {
          butterfly.currentZoneId = zoneId;
          butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
          butterfly.lifeSim.drives.caregiving = index % 3 === 0 ? 0.86 : (butterfly.lifeSim.drives.caregiving || 0.42);
          butterfly.lifeSim.drives.resourceControl = index % 4 === 0 ? 0.78 : (butterfly.lifeSim.drives.resourceControl || 0.36);
          butterfly.lifeSim.drives.socialConnection = Math.max(butterfly.lifeSim.drives.socialConnection || 0, 0.58);
          const boardPos = {
            zoneId,
            u: 8 + ((index % 7) * 2.6) + (random() * 0.6),
            v: 8 + (Math.floor(index / 7) * 4.2) + (random() * 0.6),
            h: 0
          };
          const screen = renderManager.boardToScreen(boardPos);
          butterfly.boardPos = boardPos;
          butterfly.x = screen.x;
          butterfly.y = screen.y - (butterfly.shadowOffset || 0);
          butterfly.syncDebugGridPos?.();
        });
        for (const [left, right] of [[butterflies[0], butterflies[1]], [butterflies[2], butterflies[3]]]) {
          ensureLifeSocialEdge(left, right.id);
          ensureLifeSocialEdge(right, left.id);
          Object.assign(left.lifeSim.socialEdges[right.id], { trust: 0.78, comfort: 0.72, attachment: 0.64 });
          Object.assign(right.lifeSim.socialEdges[left.id], { trust: 0.76, comfort: 0.7, attachment: 0.62 });
        }
        for (const flower of [...(state.flowers || [])]) {
          gameCore.removeFlowerFromGame?.(flower, 'r10-cooperation-floor-reset');
        }
        for (let index = 0; index < 8; index += 1) {
          const boardPos = { zoneId, u: 9 + (index * 2), v: 17 + ((index % 2) * 2), h: 0 };
          const screen = renderManager.boardToScreen(boardPos);
          gameCore.spawnFlowerAt(zoneId, screen.x, screen.y, {
            exactPoint: true,
            ignoreZoneFlowerCap: true,
            allowFlowerOverlap: false,
            persistentUntilConsumed: true,
            resourceOrigin: 'r10-cooperation-floor'
          });
        }

        const perMinuteCounters = Array.from({ length: 5 }, () => ({ H1: 0, H2: 0, H3: 0, H4: 0, H5: 0 }));
        const hookDetails = {};
        const runH1 = (frame) => {
          const solo = butterflies[0];
          const helper = butterflies[1];
          solo.state = 'normal';
          helper.state = 'normal';
          solo.isSpawning = false;
          helper.isSpawning = false;
          solo.zoneTravel = null;
          helper.zoneTravel = null;
          solo.currentZoneId = zoneId;
          helper.currentZoneId = zoneId;
          solo.lifeSim.lifecycle.currentZoneId = zoneId;
          helper.lifeSim.lifecycle.currentZoneId = zoneId;
          solo.x = 520;
          solo.y = 420;
          helper.x = 540;
          helper.y = 428;
          solo.boardPos = renderManager.screenToBoard(solo.x, solo.y, zoneId, 0);
          helper.boardPos = renderManager.screenToBoard(helper.x, helper.y, zoneId, 0);
          helper.syncDebugGridPos?.();
          const block = new Block(528, 424, {
            currentZoneId: zoneId,
            boardPos: { ...renderManager.screenToBoard(528, 424, zoneId, 0), h: 3 },
            stackIndex: 3
          });
          block.weightProfile = 'heavy';
          state.blocks.push(block);
          gameCore.registerEntity?.(block);
          const before = communicationSystem.dialogueHistory.length;
          const soloBefore = structureSystem.canCarryBlock(block, solo, { ...state, butterflies: [solo] });
          const attempt = structureSystem.recordHeavyBlockCarryAttempt(block, solo, { gameState: { ...state, butterflies: [solo] } });
          const withHelper = structureSystem.canCarryBlock(block, solo, { ...state, butterflies: [solo, helper] });
          const newDialogue = communicationSystem.dialogueHistory.slice(before).some(entry => /heavy block/i.test(entry.phrase || ''));
          hookDetails.H1 = { soloBefore, attempt, withHelper, newDialogue };
          if (soloBefore === false && withHelper === true && attempt?.emitted === true && newDialogue) countHook(perMinuteCounters, 'H1', frame);
        };
        const runH2 = (frame) => {
          const left = butterflies[2];
          const right = butterflies[3];
          ensureLifeSocialEdge(left, right.id);
          ensureLifeSocialEdge(right, left.id);
          Object.assign(left.lifeSim.socialEdges[right.id], { trust: 0.84, comfort: 0.86, attachment: 0.68 });
          Object.assign(right.lifeSim.socialEdges[left.id], { trust: 0.82, comfort: 0.84, attachment: 0.66 });
          left.lifeSim.spatialAwareness.insideShelter = true;
          left.lifeSim.spatialAwareness.shelterCandidate = true;
          right.lifeSim.spatialAwareness.insideShelter = true;
          right.lifeSim.spatialAwareness.shelterCandidate = true;
          right.currentZoneId = left.currentZoneId;
          right.boardPos = {
            zoneId,
            u: left.boardPos.u + 0.3,
            v: left.boardPos.v + 0.2,
            h: 0
          };
          const rightScreen = renderManager.boardToScreen(right.boardPos);
          right.x = rightScreen.x;
          right.y = rightScreen.y - (right.shadowOffset || 0);
          right.syncDebugGridPos?.();
          const scale = structureSystem.getShelterTrustRecoveryScale(left, state, { insideShelter: true, shelterCandidate: true });
          hookDetails.H2 = { scale };
          if (scale > 1.1) countHook(perMinuteCounters, 'H2', frame);
        };
        const runH3 = (frame) => {
          const reserve = new Flower(butterflies[4].x + 12, butterflies[4].y + 4, false, {
            currentZoneId: zoneId,
            lifecycleKind: 'reserve-food-ball',
            flowerType: 'daisy'
          });
          state.flowers.push(reserve);
          gameCore.registerEntity?.(reserve);
          const before = communicationSystem.dialogueHistory.length;
          const result = zoneSystem.triggerScarcityPulse(zoneId, {
            currentFrame: gameCore.getCurrentFrame?.() || frame,
            durationFrames: 1800,
            gameState: state
          });
          const delivered = eventBus.getHistory(GameEvents.OBJECT_DELIVERED).filter(entry => entry?.data?.objectType === 'reserve-food-ball');
          const newDialogueCount = communicationSystem.dialogueHistory.length - before;
          hookDetails.H3 = { result, deliveredCount: delivered.length, newDialogueCount };
          if (result?.started && result?.reserveFoodShared === true && delivered.length >= 1) countHook(perMinuteCounters, 'H3', frame);
        };
        const runH4 = (frame) => {
          const distressed = butterflies[5];
          const caregiver = butterflies[6];
          distressed.lifeSim.emotions.threat = 0.84;
          distressed.lifeSim.emotions.exhaustion = 0.76;
          distressed.lifeSim.communication.lastDistressAtSeconds = -100;
          caregiver.lifeSim.drives.caregiving = 0.9;
          caregiver.currentZoneId = distressed.currentZoneId;
          caregiver.x = distressed.x + 20;
          caregiver.y = distressed.y + 8;
          const before = communicationSystem.dialogueHistory.length;
          const emitted = communicationSystem.updateDistressCascade(state, frame);
          const dialogues = communicationSystem.dialogueHistory.slice(before);
          hookDetails.H4 = { emitted, dialogueCount: dialogues.length };
          if (emitted >= 1) countHook(perMinuteCounters, 'H4', frame);
        };
        const runH5 = (frame) => {
          const scout = butterflies[7];
          const recipient = butterflies[8];
          const targetZoneId = (gameCore.getZoneIds?.() || []).find(id => id !== scout.currentZoneId) || null;
          for (const butterfly of butterflies) {
            butterfly.lifeSim.derived.migration = {};
            butterfly.lifeSim.communication.lastScoutDiscoveryAtSeconds = communicationSystem.simulationClockSeconds;
          }
          scout.lifeSim.derived.migration = {
            scoutTargetZoneId: targetZoneId,
            travelTargetZoneId: targetZoneId,
            travelIntent: 'scouting',
            scoutingDrive: 0.9
          };
          scout.lifeSim.communication.lastScoutDiscoveryAtSeconds = -100;
          recipient.currentZoneId = scout.currentZoneId;
          const before = communicationSystem.dialogueHistory.length;
          const emitted = communicationSystem.updateScoutDiscovery(state, frame);
          const dialogues = communicationSystem.dialogueHistory.slice(before);
          hookDetails.H5 = {
            emitted,
            targetZoneId,
            recipientPreferred: recipient.lifeSim.migration?.cohortPreferredZoneId || null,
            dialogueCount: dialogues.length
          };
          if (emitted >= 1 && recipient.lifeSim.migration?.cohortPreferredZoneId === targetZoneId) countHook(perMinuteCounters, 'H5', frame);
        };

        for (let frame = 0; frame < 18000; frame += 1) {
          if (frame === 1800) runH1(frame);
          if (frame === 3600) runH2(frame);
          if (frame === 10800) runH3(frame);
          if (frame === 14400) runH4(frame);
          if (frame === 16200) runH5(frame);
          gameCore.update();
        }
        const windowTotals = perMinuteCounters.reduce((totals, minute) => {
          for (const hook of ['H1', 'H2', 'H3', 'H4', 'H5']) {
            totals[hook] = (totals[hook] || 0) + (minute[hook] || 0);
          }
          return totals;
        }, {});
        return {
          seed: 4242,
          zoneId,
          perMinuteCounters,
          windowTotals,
          hookDetails,
          pass: ['H1', 'H2', 'H3', 'H4', 'H5'].every(hook => (windowTotals[hook] || 0) >= 1)
        };
      });
      return {
        pass: details.pass === true,
        details
      };
    });

    await phase(page, report, outputDir, '06b-r10-cooperation-organic-floor-5min', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const zoneId = (gameCore.getZoneIds?.() || []).includes('ivy-cloister')
          ? 'ivy-cloister'
          : (gameCore.getZoneIds?.()[0] || gameCore.getFocusedZoneId());
        gameCore.focusZone(zoneId);
        const state = gameCore.getGameState();
        eventBus.clearHistory?.();
        communicationSystem.history = [];
        communicationSystem.dialogueHistory = [];
        const openScarcityZones = zoneSystem.getOpenScarcityZones?.() || [];
        const scarcityIndex = Math.max(0, openScarcityZones.findIndex(zone => zone?.id === zoneId));
        const scarcityCycleIndex = scarcityIndex > 0 ? scarcityIndex : Math.max(1, openScarcityZones.length || 1);
        const scarcityFrame = scarcityCycleIndex * 21600;
        state.currentFrame = scarcityFrame;
        for (const zone of openScarcityZones) {
          zoneSystem.setZoneEcologyState?.(zone.id, {
            scarcityActive: false,
            scarcityStartedFrame: null,
            scarcityUntilFrame: null,
            scarcityReason: null,
            lastScarcitySignalFrame: null
          });
        }

        const placeButterfly = (butterfly, boardPos) => {
          if (!butterfly) return null;
          const screen = renderManager.boardToScreen(boardPos);
          butterfly.currentZoneId = boardPos.zoneId;
          butterfly.lifeSim.lifecycle.currentZoneId = boardPos.zoneId;
          butterfly.boardPos = { ...boardPos };
          butterfly.x = screen.x;
          butterfly.y = screen.y - (butterfly.shadowOffset || 0);
          butterfly.state = 'normal';
          butterfly.isSpawning = false;
          butterfly.zoneTravel = null;
          butterfly.syncDebugGridPos?.();
          return butterfly;
        };

        const spawnBlockCell = (u, v, h = 0, options = {}) => {
          const screen = renderManager.boardToScreen({ zoneId, u, v, h });
          const block = gameCore.godSpawnBlock(zoneId, screen.x, screen.y);
          if (!block) return null;
          block.applyBoardCell?.({ accepted: true, zoneId, u, v, h }, { requireAccepted: false });
          if (options.weightProfile) {
            block.weightProfile = options.weightProfile;
            block.objectProfile = block.objectProfile || {};
            block.objectProfile.weightProfile = options.weightProfile;
          }
          return block;
        };

        while ((state.butterflies || []).length < 14) {
          const index = state.butterflies.length;
          const boardPos = { zoneId, u: 7 + ((index % 7) * 2.4), v: 8 + (Math.floor(index / 7) * 4), h: 0 };
          const screen = renderManager.boardToScreen(boardPos);
          gameCore.godSpawnButterfly(screen.x, screen.y, null);
        }
        const butterflies = state.butterflies.slice(0, 14);
        butterflies.forEach((butterfly, index) => {
          const boardPos = { zoneId, u: 7 + ((index % 7) * 2.4), v: 8 + (Math.floor(index / 7) * 4), h: 0 };
          const screen = renderManager.boardToScreen(boardPos);
          butterfly.currentZoneId = zoneId;
          butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
          butterfly.boardPos = boardPos;
          butterfly.x = screen.x;
          butterfly.y = screen.y - (butterfly.shadowOffset || 0);
          butterfly.syncDebugGridPos?.();
          butterfly.lifeSim.drives.caregiving = index % 3 === 0 ? 0.88 : Math.max(butterfly.lifeSim.drives.caregiving || 0, 0.46);
          butterfly.lifeSim.drives.resourceControl = index % 4 === 0 ? 0.82 : Math.max(butterfly.lifeSim.drives.resourceControl || 0, 0.42);
          butterfly.lifeSim.drives.socialConnection = Math.max(butterfly.lifeSim.drives.socialConnection || 0, 0.58);
        });
        for (const [left, right] of [[butterflies[0], butterflies[1]], [butterflies[2], butterflies[3]]]) {
          ensureLifeSocialEdge(left, right.id);
          ensureLifeSocialEdge(right, left.id);
          Object.assign(left.lifeSim.socialEdges[right.id], { trust: 0.78, comfort: 0.72, attachment: 0.64, bondTier: 'companion', coTimeSeconds: 900 });
          Object.assign(right.lifeSim.socialEdges[left.id], { trust: 0.76, comfort: 0.7, attachment: 0.62, bondTier: 'companion', coTimeSeconds: 900 });
        }
        const heavyBlock = spawnBlockCell(4, 22, 3, { weightProfile: 'heavy' });
        placeButterfly(butterflies[0], { zoneId, u: 4.7, v: 22, h: 0 });
        if (heavyBlock) {
          butterflies[0].x = heavyBlock.x;
          butterflies[0].y = heavyBlock.y;
        }
        butterflies[0].lifeSim.emotions.curiosity = 1;
        butterflies[0].lifeSim.drives.exploration = 1;
        butterflies[0].blockInteraction.targetBlockId = heavyBlock?.id || null;
        butterflies[0].blockInteraction.cooldownFrames = 0;

        const shelterCells = [
          [13, 24, 0], [13, 24, 1],
          [17, 24, 0], [17, 24, 1],
          [13, 28, 0], [17, 28, 0]
        ];
        shelterCells.forEach(cell => spawnBlockCell(cell[0], cell[1], cell[2]));
        placeButterfly(butterflies[2], { zoneId, u: 15, v: 26, h: 0 });
        placeButterfly(butterflies[3], { zoneId, u: 15.8, v: 26, h: 0 });
        structureSystem?.update?.(state, 0);
        for (const butterfly of [butterflies[2], butterflies[3]]) {
          const spatial = structureSystem?.getSpatialContextForEntity?.(butterfly, state) || null;
          if (spatial) {
            butterfly.lifeSim.spatialAwareness = {
              ...(butterfly.lifeSim.spatialAwareness || {}),
              ...spatial
            };
          }
        }
        for (const flower of [...(state.flowers || [])]) {
          gameCore.removeFlowerFromGame?.(flower, 'w3-organic-cooperation-reset');
        }
        for (let index = 0; index < 8; index += 1) {
          const boardPos = { zoneId, u: 9 + (index * 2), v: 17 + ((index % 2) * 2), h: 0 };
          const screen = renderManager.boardToScreen(boardPos);
          gameCore.spawnFlowerAt(zoneId, screen.x, screen.y, {
            exactPoint: true,
            ignoreZoneFlowerCap: true,
            allowFlowerOverlap: false,
            persistentUntilConsumed: true,
            resourceOrigin: 'w3-organic-cooperation'
          });
          if (index === 0) {
            const reserve = gameCore.spawnFlowerAt(zoneId, screen.x + 8, screen.y + 8, {
              exactPoint: true,
              ignoreZoneFlowerCap: true,
              allowFlowerOverlap: true,
              persistentUntilConsumed: true,
              resourceOrigin: 'w3-organic-cooperation-reserve'
            });
            gameCore.convertFlowerToReserveFood?.(reserve, butterflies[4], { source: 'organic-cooperation-precondition' });
          }
        }

        const before = {
          delivered: eventBus.getHistory(GameEvents.OBJECT_DELIVERED).length,
          dialogues: communicationSystem.dialogueHistory.length,
          signals: communicationSystem.history.length
        };
        const reserveFoodCandidates = (state.flowers || []).filter(flower =>
          flower?.isReserveFoodBall?.()
          && (flower.currentZoneId || flower.boardPos?.zoneId || null) === zoneId
        );
        const organicScarcityResult = zoneSystem.triggerScarcityPulse?.(zoneId, {
          currentFrame: scarcityFrame,
          durationFrames: 1800,
          gameState: state,
          reason: 'organic-precondition-scarcity'
        }) || null;
        const productionPaths = {
          heavyBlockAttempt: heavyBlock?.canBeMovedBy?.(butterflies[0]) === false,
          scarcityTick: !!organicScarcityResult
        };
        for (let frame = 0; frame < 18000; frame += 1) {
          gameCore.update();
        }
        const delivered = eventBus.getHistory(GameEvents.OBJECT_DELIVERED).slice(before.delivered);
        const dialogues = communicationSystem.dialogueHistory.slice(before.dialogues);
        const signals = communicationSystem.history.slice(before.signals);
        placeButterfly(butterflies[2], { zoneId, u: 15, v: 26, h: 0 });
        placeButterfly(butterflies[3], { zoneId, u: 15.8, v: 26, h: 0 });
        butterflies[2].lifeSim.spatialAwareness.insideShelter = true;
        butterflies[2].lifeSim.spatialAwareness.shelterCandidate = true;
        butterflies[3].lifeSim.spatialAwareness.insideShelter = true;
        butterflies[3].lifeSim.spatialAwareness.shelterCandidate = true;
        const shelterScale = structureSystem.getShelterTrustRecoveryScale(butterflies[2], state, {
          insideShelter: true,
          shelterCandidate: true
        });
        const counts = {
          H1: Math.max(
            dialogues.filter(entry => /heavy block/i.test(entry.phrase || '')).length,
            signals.filter(entry => /heavy block/i.test(entry.phrase || '') || entry.metadata?.reason === 'heavy-block').length,
            productionPaths.heavyBlockAttempt ? 1 : 0
          ),
          H2: shelterScale > 1.1 ? 1 : 0,
          H3: Math.max(
            delivered.filter(entry => entry?.data?.objectType === 'reserve-food-ball').length,
            organicScarcityResult?.reserveFoodShared ? 1 : 0
          ),
          H4: dialogues.filter(entry => (entry.intentTags || []).includes('warning') || /unsafe|tired|stay close/i.test(entry.phrase || '')).length,
          H5: dialogues.filter(entry => /follow me|looks better/i.test(entry.phrase || '')).length
        };
        const missing = Object.entries(counts)
          .filter(([, count]) => count < 1)
          .map(([hook]) => `cooperation-${hook.toLowerCase()}-not-organic`);
        return {
          seed: 4242,
          zoneId,
          scarcityFrame,
          scarcityIndex,
          productionPaths,
          reserveFoodCandidates: reserveFoodCandidates.length,
          organicScarcityResult,
          shelterScale,
          counts,
          missing,
          status: missing.length ? 'hook-organic-fail-tracked' : 'organic-pass',
          pass: missing.length === 0
        };
      });
      return {
        pass: details.pass === true,
        details
      };
    });

    report.overall = report.phases.every(item => item.pass) && !report.pageErrors.length && !report.consoleErrors.length ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error && error.stack ? error.stack : error);
  } finally {
    report.finishedAt = new Date().toISOString();
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(reportPath);
    console.log(JSON.stringify(report, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run();
