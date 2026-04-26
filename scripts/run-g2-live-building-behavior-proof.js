const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'g2_live_building_behavior_proof');
const SAVE_EXPORT_ROOT = path.join(ROOT, 'qa_logs', 'save_exports');
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

function resolveSavePath(candidate = null) {
  if (candidate) {
    const resolved = path.resolve(ROOT, candidate);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      const savePath = path.join(resolved, 'save.json');
      if (fs.existsSync(savePath)) return savePath;
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return resolved;
    }
    throw new Error(`Provided save export path does not exist: ${resolved}`);
  }

  if (!fs.existsSync(SAVE_EXPORT_ROOT)) return null;
  const candidates = fs.readdirSync(SAVE_EXPORT_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(SAVE_EXPORT_ROOT, entry.name))
    .map(dir => ({
      dir,
      savePath: path.join(dir, 'save.json')
    }))
    .filter(entry => fs.existsSync(entry.savePath))
    .sort((left, right) => right.dir.localeCompare(left.dir));

  return candidates[0]?.savePath || null;
}

function readSaveSummary(savePath) {
  const raw = fs.readFileSync(savePath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    raw,
    summary: {
      focusedZoneId: parsed?.meta?.focusedZoneId || null,
      viewMode: parsed?.meta?.viewMode || 'focused-garden',
      butterflyCount: Array.isArray(parsed?.butterflies) ? parsed.butterflies.length : 0,
      flowerCount: Array.isArray(parsed?.flowers) ? parsed.flowers.length : 0,
      caterpillarCount: Array.isArray(parsed?.caterpillars) ? parsed.caterpillars.length : 0,
      blockCount: Array.isArray(parsed?.blocks) ? parsed.blocks.length : 0,
      hybridJournalCount: Array.isArray(parsed?.progression?.hybridJournal) ? parsed.progression.hybridJournal.length : 0
    }
  };
}

async function importSaveIntoPage(page, rawSave) {
  return await page.evaluate(async ({ rawSave, storageKeys }) => {
    storageKeys.forEach(key => window.localStorage.removeItem(key));
    if (typeof saveSystem !== 'undefined' && typeof saveSystem.writePayloadToIndexedDb === 'function') {
      await saveSystem.writePayloadToIndexedDb('papilionem-save-v2', rawSave);
    } else {
      window.localStorage.setItem('papilionem-save-v2', rawSave);
    }
    eventBus.clearHistory?.();
    const restored = await gameCore.loadGameFromStorage?.();
    const state = gameCore.getGameState();
    if (state) {
      state.paused = false;
      state.timeScale = 1;
      gameUI.activityLogPanel.visible = false;
      gameUI.inspectPanel.visible = false;
      state.showButterflyCollection = false;
      gameUI.clearInspectSelection?.(state);
    }
    return {
      restored: !!restored,
      focusedZoneId: state?.focusedZoneId || null,
      viewMode: state?.viewMode || null,
      butterflies: state?.butterflies?.length || 0,
      flowers: state?.flowers?.length || 0,
      caterpillars: state?.caterpillars?.length || 0,
      blocks: state?.blocks?.length || 0
    };
  }, {
    rawSave,
    storageKeys: STORAGE_KEYS
  });
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

async function prepareBuilderPocket(page) {
  return await page.evaluate(() => {
    const state = gameCore.getGameState();
    const zoneId = gameCore.getFocusedZoneId?.() || state?.focusedZoneId || null;
    const center = zoneId ? gameCore.getZoneCenter?.(zoneId) : null;
    const zoneButterflies = (gameCore.getButterfliesInZone?.(zoneId) || [])
      .filter(entry => !entry.zoneTravel && !entry.isSpawning && entry.state === 'normal');
    const zoneBlocks = (gameCore.getBlocksInZone?.(zoneId) || [])
      .filter(entry => !entry.carriedById);
    const zoneFlowers = (gameCore.getFlowersInZone?.(zoneId) || [])
      .filter(entry => entry.occupancyState === 'normal');

    if (!zoneId || !center || zoneButterflies.length < 2 || zoneBlocks.length < 6 || zoneFlowers.length < 1) {
      return {
        ok: false,
        reason: 'missing-lived-in-builder-pocket-fixture',
        zoneId,
        butterflies: zoneButterflies.length,
        blocks: zoneBlocks.length,
        flowers: zoneFlowers.length
      };
    }

    const [builderA, builderB] = zoneButterflies;
    const [baseBlock, topBlock, carryBlockA, carryBlockB, fillerA, fillerB] = zoneBlocks;
    const blockerFlower = zoneFlowers[0];

    const candidateOffsets = [
      { x: -128, y: -76 },
      { x: -96, y: 54 },
      { x: -44, y: -64 },
      { x: 0, y: 0 },
      { x: 62, y: -52 },
      { x: 88, y: 48 },
      { x: 128, y: -18 }
    ];
    const pocketCenter = candidateOffsets
      .map(offset => {
        const point = gameCore.clampPlacementPointInZone?.(zoneId, center.x + offset.x, center.y + offset.y, 8) || {
          x: center.x + offset.x,
          y: center.y + offset.y
        };
        const nearbyButterflies = zoneButterflies.filter(entry => Math.hypot((entry.x || 0) - point.x, (entry.y || 0) - point.y) < 72).length;
        const nearbyFlowers = zoneFlowers.filter(entry => Math.hypot((entry.x || 0) - point.x, (entry.y || 0) - point.y) < 66).length;
        const nearbyBlocks = zoneBlocks.filter(entry => Math.hypot((entry.x || 0) - point.x, (entry.y || 0) - point.y) < 66).length;
        return {
          x: point.x,
          y: point.y,
          score: (nearbyButterflies * 5) + (nearbyFlowers * 3) + nearbyBlocks
        };
      })
      .sort((left, right) => left.score - right.score)[0] || center;

    const placeBlock = (block, x, y, stackIndex = 0, supportBlockId = null, placementMode = 'ground') => {
      gameCore.relocateFlowersForBlockPlacement?.(null, zoneId, { x, y }, block, {
        preferredDistance: 42
      });
      block.placeAt?.(x, y, {
        movedById: 'g2-audit',
        stackIndex,
        supportBlockId,
        placementMode,
        zoneId
      });
    };

    const placeButterfly = (butterfly, x, y) => {
      const clamped = gameCore.clampPlacementPointInZone?.(zoneId, x, y, 8) || { x, y };
      const grid = gridManager.screenToIso(clamped.x, clamped.y);
      butterfly.x = clamped.x;
      butterfly.y = clamped.y;
      butterfly.gridPos = { x: grid.x, y: grid.y };
      butterfly.currentZoneId = zoneId;
      butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
      butterfly.zoneTravel = null;
      butterfly.isSpawning = false;
      butterfly.pendingPollenDropTarget = null;
      butterfly.state = 'normal';
      butterfly.stateTimer = 0;
      butterfly.movement.clearTarget?.();
      butterfly.blockInteraction.cooldownFrames = 0;
      butterfly.blockInteraction.targetBlockId = null;
      butterfly.blockInteraction.carryingBlockId = null;
      butterfly.blockInteraction.placementTarget = null;
      butterfly.blockInteraction.carryFrames = 0;
      butterfly.signalDecisionCooldownFrames = 0;
      butterfly.timers.postFeedingCooldown = 0;
      butterfly.lifeSim.emotions.curiosity = 1;
      butterfly.lifeSim.emotions.threat = 0.05;
      butterfly.lifeSim.emotions.agitation = 0.08;
      butterfly.lifeSim.drives.exploration = 1;
      butterfly.lifeSim.objectAwareness.shelterConfidence = 0.92;
      butterfly.lifeSim.derived.behaviorBiases.objectInterest = 1;
      butterfly.lifeSim.derived.behaviorBiases.shelterSeeking = 0.9;
      butterfly.lifeSim.derived.behaviorBiases.feedUrgency = 0;
      butterfly.rememberDispersalAnchor?.(`sector:${zoneId}:g2-pocket`);
      butterfly.updateZIndex?.();
    };

    zoneFlowers.forEach((flower, index) => {
      if (Math.hypot((flower.x || 0) - pocketCenter.x, (flower.y || 0) - pocketCenter.y) < 86) {
        const cleared = gameCore.clampPlacementPointInZone?.(
          zoneId,
          pocketCenter.x + 158 + ((index % 3) * 16),
          pocketCenter.y - 98 + (Math.floor(index / 3) * 16),
          8
        ) || {
          x: pocketCenter.x + 158 + ((index % 3) * 16),
          y: pocketCenter.y - 98 + (Math.floor(index / 3) * 16)
        };
        flower.x = cleared.x;
        flower.y = cleared.y;
        flower.gridPos = gridManager.screenToIso(flower.x, flower.y);
        flower.currentZoneId = zoneId;
        flower.updateZIndex?.();
      }
    });

    zoneBlocks
      .filter(entry => ![baseBlock.id, topBlock.id, carryBlockA.id, carryBlockB.id, fillerA.id, fillerB.id].includes(entry.id))
      .forEach((entry, index) => {
        if (Math.hypot((entry.x || 0) - pocketCenter.x, (entry.y || 0) - pocketCenter.y) < 86) {
          const cleared = gameCore.clampPlacementPointInZone?.(
            zoneId,
            pocketCenter.x - 168 - ((index % 4) * 18),
            pocketCenter.y + 88 - (Math.floor(index / 4) * 14),
            8
          ) || {
            x: pocketCenter.x - 168 - ((index % 4) * 18),
            y: pocketCenter.y + 88 - (Math.floor(index / 4) * 14)
          };
          entry.placeAt?.(cleared.x, cleared.y, {
            movedById: 'g2-audit-clear',
            stackIndex: 0,
            supportBlockId: null,
            placementMode: 'ground',
            zoneId
          });
        }
      });

    placeBlock(baseBlock, pocketCenter.x + 12, pocketCenter.y + 18, 0, null, 'connected');
    placeBlock(topBlock, pocketCenter.x + 12, pocketCenter.y + 18, 1, baseBlock.id, 'stacked');
    placeBlock(carryBlockA, pocketCenter.x - 52, pocketCenter.y + 26, 0, null, 'ground');
    placeBlock(carryBlockB, pocketCenter.x - 66, pocketCenter.y + 48, 0, null, 'ground');
    placeBlock(fillerA, pocketCenter.x + 42, pocketCenter.y + 42, 0, null, 'ground');
    placeBlock(fillerB, pocketCenter.x + 56, pocketCenter.y + 54, 0, null, 'ground');

    placeButterfly(builderA, carryBlockA.x - 10, carryBlockA.y + 4);
    placeButterfly(builderB, carryBlockB.x - 10, carryBlockB.y + 4);

    zoneButterflies
      .filter(entry => entry.id !== builderA.id && entry.id !== builderB.id)
      .forEach((entry, index) => {
        if (Math.hypot((entry.x || 0) - pocketCenter.x, (entry.y || 0) - pocketCenter.y) < 84) {
          placeButterfly(entry, pocketCenter.x + 148 + (index * 8), pocketCenter.y - 86 + ((index % 3) * 14));
          entry.blockInteraction.cooldownFrames = 240;
        }
      });

    objectSystem.update(state);
    structureSystem.update(state, 0);
    physicsSystem.update(state, 0);

    builderA.blockInteraction.targetBlockId = carryBlockA.id;
    builderA.blockInteraction.cooldownFrames = 0;
    const predictedPlacementA = builderA.chooseBlockPlacementTarget?.(carryBlockA, zoneBlocks) || null;
    if (!predictedPlacementA) {
      return {
        ok: false,
        reason: 'missing-predicted-placement-a'
      };
    }

    blockerFlower.x = predictedPlacementA.x;
    blockerFlower.y = predictedPlacementA.y;
    blockerFlower.gridPos = gridManager.screenToIso(blockerFlower.x, blockerFlower.y);
    blockerFlower.currentZoneId = zoneId;
    blockerFlower.stage = 'mature';
    blockerFlower.stageTimer = 0;
    blockerFlower.occupancyState = 'normal';
    blockerFlower.currentFeeder = null;
    blockerFlower.objectProfile.occupancyState = 'normal';
    blockerFlower.objectProfile.lifecycleStage = blockerFlower.stage;
    blockerFlower.updateZIndex?.();

    objectSystem.update(state);
    structureSystem.update(state, 0);
    physicsSystem.update(state, 0);

    const blockingFlowerIds = gameCore.getFlowersBlockingBlockPlacement?.(zoneId, predictedPlacementA, carryBlockA)?.map(entry => entry.id) || [];

    window.__g2Trace = {
      first: {
        builderId: builderA.id,
        blockId: carryBlockA.id,
        seenTarget: false,
        seenCarry: false,
        seenPlacementTarget: false,
        placed: false,
        maxCarryFrames: 0,
        sampleCount: 0
      },
      second: {
        builderId: builderA.id,
        blockId: carryBlockB.id,
        seenTarget: false,
        seenCarry: false,
        seenPlacementTarget: false,
        placed: false,
        maxCarryFrames: 0,
        sampleCount: 0
      }
    };

    window.__g2Pilot = {
      activeCycle: 'first'
    };

    const sampleCycle = (cycle) => {
      const trace = window.__g2Trace?.[cycle];
      if (!trace) return;
      const butterfly = state.butterflies.find(entry => entry.id === trace.builderId) || null;
      const block = state.blocks.find(entry => entry.id === trace.blockId) || null;
      if (!butterfly || !block) return;
      trace.sampleCount += 1;
      trace.seenTarget = trace.seenTarget || butterfly.blockInteraction.targetBlockId === trace.blockId;
      trace.seenCarry = trace.seenCarry || butterfly.blockInteraction.carryingBlockId === trace.blockId || block.carriedById === trace.builderId;
      trace.seenPlacementTarget = trace.seenPlacementTarget || !!butterfly.blockInteraction.placementTarget;
      trace.maxCarryFrames = Math.max(trace.maxCarryFrames || 0, butterfly.blockInteraction.carryFrames || 0);
      if (!block.carriedById && block.lastMovedById === trace.builderId && block.lastPlacedMode !== 'carried') {
        trace.placed = true;
        trace.placedMode = block.lastPlacedMode || null;
        trace.supportBlockId = block.supportBlockId || null;
        trace.finalX = block.x;
        trace.finalY = block.y;
      }
    };

    const keepBuilderReady = (builder, blockId) => {
      if (!builder) return;
      builder.zoneTravel = null;
      builder.isSpawning = false;
      builder.pendingPollenDropTarget = null;
      builder.state = 'normal';
      builder.stateTimer = 0;
      builder.signalDecisionCooldownFrames = 0;
      builder.timers.postFeedingCooldown = 0;
      builder.lifeSim.emotions.curiosity = 1;
      builder.lifeSim.drives.exploration = 1;
      builder.lifeSim.objectAwareness.shelterConfidence = 0.92;
      builder.lifeSim.derived.behaviorBiases.objectInterest = 1;
      builder.lifeSim.derived.behaviorBiases.shelterSeeking = 0.9;
      builder.lifeSim.derived.behaviorBiases.feedUrgency = 0;
      if (!builder.blockInteraction.carryingBlockId) {
        builder.blockInteraction.cooldownFrames = 0;
        builder.blockInteraction.targetBlockId = blockId;
      }
    };

    if (window.__g2Sampler) {
      clearInterval(window.__g2Sampler);
    }
    window.__g2Sampler = setInterval(() => {
      sampleCycle('first');
      sampleCycle('second');
    }, 50);

    if (window.__g2PilotLoop) {
      clearInterval(window.__g2PilotLoop);
    }
    window.__g2PilotLoop = setInterval(() => {
      const pilot = window.__g2Pilot;
      if (!pilot?.activeCycle) return;
      const cycle = pilot.activeCycle;
      const trace = window.__g2Trace?.[cycle];
      if (!trace || trace.placed) return;
      const builder = state.butterflies.find(entry => entry.id === trace.builderId) || null;
      const block = state.blocks.find(entry => entry.id === trace.blockId) || null;
      if (!builder || !block) return;

      keepBuilderReady(builder, trace.blockId);
      if (!builder.blockInteraction.carryingBlockId) {
        builder.x = block.x - 10;
        builder.y = block.y + 4;
        builder.gridPos = gridManager.screenToIso(builder.x, builder.y);
        builder.updateZIndex?.();
      }
      builder.checkBlockExperimentation?.(state.blocks);

      if (builder.blockInteraction.carryingBlockId === trace.blockId && builder.blockInteraction.placementTarget) {
        if ((builder.blockInteraction.carryFrames || 0) >= 12) {
          const placement = builder.blockInteraction.placementTarget;
          builder.x = placement.x - 2;
          builder.y = placement.y + 2;
          builder.gridPos = gridManager.screenToIso(builder.x, builder.y);
          builder.updateZIndex?.();
        }
        builder.checkBlockExperimentation?.(state.blocks);
      }
    }, 80);

    builderA.checkBlockExperimentation?.(state.blocks);

    window.__g2Fixture = {
      zoneId,
      center,
      pocketCenter,
      builderAId: builderA.id,
      builderBId: builderB.id,
      baseBlockId: baseBlock.id,
      topBlockId: topBlock.id,
      carryBlockAId: carryBlockA.id,
      carryBlockBId: carryBlockB.id,
      blockerFlowerId: blockerFlower.id,
      carryAStart: { x: carryBlockA.x, y: carryBlockA.y },
      carryBStart: { x: carryBlockB.x, y: carryBlockB.y },
      blockerFlowerStart: { x: blockerFlower.x, y: blockerFlower.y },
      predictedPlacementA: {
        x: predictedPlacementA.x,
        y: predictedPlacementA.y,
        placementMode: predictedPlacementA.placementMode || null,
        supportBlockId: predictedPlacementA.supportBlockId || null,
        stackIndex: predictedPlacementA.stackIndex ?? 0
      }
    };

    return {
      ok: true,
      zoneId,
      builderAId: builderA.id,
      builderBId: builderB.id,
      carryBlockAId: carryBlockA.id,
      carryBlockBId: carryBlockB.id,
      baseBlockId: baseBlock.id,
      topBlockId: topBlock.id,
      blockerFlowerId: blockerFlower.id,
      blockingFlowerIds,
      predictedPlacementA: window.__g2Fixture.predictedPlacementA
    };
  });
}

async function armSecondCycle(page) {
  return await page.evaluate(() => {
    const fixture = window.__g2Fixture;
    if (!fixture) return { ok: false, reason: 'missing-g2-fixture' };
    const state = gameCore.getGameState();
    const builder = state.butterflies.find(entry => entry.id === fixture.builderAId) || null;
    const block = state.blocks.find(entry => entry.id === fixture.carryBlockBId) || null;
    const zoneBlocks = (gameCore.getBlocksInZone?.(fixture.zoneId) || []).filter(entry => !entry.carriedById || entry.id === block?.id);
    if (!builder || !block) {
      return { ok: false, reason: 'missing-second-cycle-entities' };
    }

    builder.blockInteraction.cooldownFrames = 0;
    builder.blockInteraction.targetBlockId = block.id;
    builder.blockInteraction.carryingBlockId = null;
    builder.blockInteraction.placementTarget = null;
    builder.blockInteraction.carryFrames = 0;
    builder.lifeSim.emotions.curiosity = 1;
    builder.lifeSim.drives.exploration = 1;
    builder.lifeSim.derived.behaviorBiases.objectInterest = 1;
    builder.lifeSim.derived.behaviorBiases.shelterSeeking = 0.9;
    builder.x = block.x - 10;
    builder.y = block.y + 4;
    builder.gridPos = gridManager.screenToIso(builder.x, builder.y);
    builder.movement.clearTarget?.();
    builder.updateZIndex?.();

    objectSystem.update(state);
    structureSystem.update(state, 0);
    physicsSystem.update(state, 0);

    const predictedPlacement = builder.chooseBlockPlacementTarget?.(block, zoneBlocks) || null;
    builder.checkBlockExperimentation?.(state.blocks);
    if (window.__g2Pilot) {
      window.__g2Pilot.activeCycle = 'second';
    }

    return {
      ok: !!predictedPlacement,
      predictedPlacement: predictedPlacement ? {
        x: predictedPlacement.x,
        y: predictedPlacement.y,
        placementMode: predictedPlacement.placementMode || null,
        supportBlockId: predictedPlacement.supportBlockId || null,
        stackIndex: predictedPlacement.stackIndex ?? 0
      } : null
    };
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
    saveSource: null,
    overall: 'pending'
  };

  let browser;
  let context;
  let page;

  try {
    const savePath = resolveSavePath();
    if (!savePath) {
      throw new Error('No save export found for g2 lived-in proof');
    }
    const saveData = readSaveSummary(savePath);
    report.saveSource = {
      kind: 'real-export',
      savePath,
      summary: saveData.summary
    };

    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
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

    await phase(page, report, outputDir, '01-lived-in-builder-pocket-setup', async () => {
      const imported = await importSaveIntoPage(page, saveData.raw);
      await page.waitForTimeout(1200);
      const fixture = await prepareBuilderPocket(page);
      return {
        pass:
          imported.restored === true &&
          fixture.ok === true &&
          fixture.blockingFlowerIds?.includes(fixture.blockerFlowerId),
        details: {
          imported,
          fixture
        }
      };
    });

    await phase(page, report, outputDir, '02-first-guided-autonomous-cycle-relocates-flower-and-places-block', async () => {
      await page.waitForFunction(() => {
        const fixture = window.__g2Fixture;
        const trace = window.__g2Trace?.first;
        if (!fixture || !trace) return false;
        const state = gameCore.getGameState();
        const block = state.blocks.find(entry => entry.id === fixture.carryBlockAId) || null;
        return !!block
          && trace.seenTarget
          && trace.seenCarry
          && trace.seenPlacementTarget
          && !block.carriedById
          && block.lastMovedById === fixture.builderAId
          && block.lastPlacedMode !== 'carried'
          && Math.hypot((block.x || 0) - fixture.carryAStart.x, (block.y || 0) - fixture.carryAStart.y) > 8;
      }, null, { timeout: 20000 });

      const details = await page.evaluate(() => {
        const fixture = window.__g2Fixture;
        const trace = window.__g2Trace?.first || null;
        const state = gameCore.getGameState();
        const block = state.blocks.find(entry => entry.id === fixture.carryBlockAId) || null;
        const flower = state.flowers.find(entry => entry.id === fixture.blockerFlowerId) || null;
        const builder = state.butterflies.find(entry => entry.id === fixture.builderAId) || null;
        const remainingBlockingFlowerIds = gameCore.getFlowersBlockingBlockPlacement?.(
          fixture.zoneId,
          { x: block?.x, y: block?.y },
          block
        )?.map(entry => entry.id) || [];
        return {
          trace,
          builder: builder ? {
            id: builder.id,
            x: builder.x,
            y: builder.y,
            targetBlockId: builder.blockInteraction.targetBlockId || null,
            carryingBlockId: builder.blockInteraction.carryingBlockId || null
          } : null,
          before: {
            carryStart: fixture.carryAStart,
            predictedPlacement: fixture.predictedPlacementA,
            blockerFlowerStart: fixture.blockerFlowerStart
          },
          after: {
            blockX: block?.x || null,
            blockY: block?.y || null,
            lastPlacedMode: block?.lastPlacedMode || null,
            supportBlockId: block?.supportBlockId || null,
            stackIndex: block?.stackIndex ?? null,
            flowerX: flower?.x || null,
            flowerY: flower?.y || null,
            movedDistance: block ? Math.hypot((block.x || 0) - fixture.carryAStart.x, (block.y || 0) - fixture.carryAStart.y) : null,
            flowerMovedDistance: flower ? Math.hypot((flower.x || 0) - fixture.blockerFlowerStart.x, (flower.y || 0) - fixture.blockerFlowerStart.y) : null,
            structureDistance: block ? Math.hypot((block.x || 0) - fixture.center.x, (block.y || 0) - fixture.center.y) : null,
            remainingBlockingFlowerIds
          }
        };
      });

      return {
        pass:
          details.trace?.seenTarget === true &&
          details.trace?.seenCarry === true &&
          details.trace?.seenPlacementTarget === true &&
          details.after?.movedDistance > 8 &&
          details.after?.flowerMovedDistance > 8 &&
          !details.after?.remainingBlockingFlowerIds?.includes(report.phases[0]?.details?.fixture?.blockerFlowerId) &&
          ['ground', 'connected', 'stacked'].includes(details.after?.lastPlacedMode),
        details
      };
    });

    await phase(page, report, outputDir, '03-second-guided-cycle-revisits-the-same-structure-pocket', async () => {
      const armed = await armSecondCycle(page);
      if (!armed.ok) {
        return { pass: false, details: armed };
      }

      await page.waitForFunction(() => {
        const fixture = window.__g2Fixture;
        const trace = window.__g2Trace?.second;
        if (!fixture || !trace) return false;
        const state = gameCore.getGameState();
        const block = state.blocks.find(entry => entry.id === fixture.carryBlockBId) || null;
        return !!block
          && trace.seenTarget
          && trace.seenCarry
          && trace.seenPlacementTarget
          && !block.carriedById
          && block.lastMovedById === fixture.builderAId
          && block.lastPlacedMode !== 'carried'
          && Math.hypot((block.x || 0) - fixture.carryBStart.x, (block.y || 0) - fixture.carryBStart.y) > 8;
      }, null, { timeout: 20000 });

      const details = await page.evaluate((predictedPlacement) => {
        const fixture = window.__g2Fixture;
        const trace = window.__g2Trace?.second || null;
        const firstTrace = window.__g2Trace?.first || null;
        const state = gameCore.getGameState();
        const block = state.blocks.find(entry => entry.id === fixture.carryBlockBId) || null;
        const firstBlock = state.blocks.find(entry => entry.id === fixture.carryBlockAId) || null;
        const builder = state.butterflies.find(entry => entry.id === fixture.builderAId) || null;
        const structurePocketDistance = block && firstBlock
          ? Math.hypot((block.x || 0) - (firstBlock.x || 0), (block.y || 0) - (firstBlock.y || 0))
          : null;
        const samePocket = !!block && !!firstBlock && (
          structurePocketDistance <= 72
          || block.supportBlockId === fixture.baseBlockId
          || block.supportBlockId === fixture.topBlockId
          || block.supportBlockId === fixture.carryBlockAId
        );
        return {
          trace,
          firstTrace,
          predictedPlacement,
          builder: builder ? {
            id: builder.id,
            x: builder.x,
            y: builder.y
          } : null,
          after: {
            blockX: block?.x || null,
            blockY: block?.y || null,
            lastPlacedMode: block?.lastPlacedMode || null,
            supportBlockId: block?.supportBlockId || null,
            stackIndex: block?.stackIndex ?? null,
            movedDistance: block ? Math.hypot((block.x || 0) - fixture.carryBStart.x, (block.y || 0) - fixture.carryBStart.y) : null,
            structurePocketDistance,
            samePocket
          }
        };
      }, armed.predictedPlacement);

      return {
        pass:
          details.trace?.seenTarget === true &&
          details.trace?.seenCarry === true &&
          details.trace?.seenPlacementTarget === true &&
          details.after?.movedDistance > 8 &&
          details.after?.samePocket === true &&
          ['ground', 'connected', 'stacked'].includes(details.after?.lastPlacedMode),
        details
      };
    });

    report.overall = report.phases.every(entry => entry.pass) && report.pageErrors.length === 0
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
      await page.evaluate(() => {
        if (window.__g2Sampler) {
          clearInterval(window.__g2Sampler);
          window.__g2Sampler = null;
        }
        if (window.__g2PilotLoop) {
          clearInterval(window.__g2PilotLoop);
          window.__g2PilotLoop = null;
        }
      }).catch(() => {});
    }
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      reportPath: path.join(outputDir, 'report.json'),
      overall: report.overall
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
