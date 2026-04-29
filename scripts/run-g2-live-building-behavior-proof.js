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
      butterfly.lifeSim.lifecycle.sleeping = false;
      butterfly.lifeSim.lifecycle.sleepSubtype = null;
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
      butterfly.lifeSim.emotions.exhaustion = 0.06;
      butterfly.lifeSim.drives.exploration = 1;
      butterfly.lifeSim.drives.rest = 0.06;
      butterfly.lifeSim.objectAwareness.shelterConfidence = 0.92;
      butterfly.lifeSim.derived.behaviorBiases.objectInterest = 1;
      butterfly.lifeSim.derived.behaviorBiases.shelterSeeking = 0.9;
      butterfly.lifeSim.derived.behaviorBiases.feedUrgency = 0;
      butterfly.rememberDispersalAnchor?.(`sector:${zoneId}:g2-pocket`);
      sleepSystem?.wakeEntity?.(butterfly.id, 'g2-guided-fixture');
      sleepSystem?.setExhaustion?.(butterfly.id, 0.06);
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
    placeBlock(carryBlockA, pocketCenter.x - 112, pocketCenter.y + 58, 0, null, 'ground');
    placeBlock(carryBlockB, pocketCenter.x - 132, pocketCenter.y + 82, 0, null, 'ground');
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
        trace.seenTarget = true;
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
    const zoneBlocks = (gameCore.getBlocksInZone?.(fixture.zoneId) || []);
    let block = state.blocks.find(entry => entry.id === fixture.carryBlockBId) || null;
    const supportsAnotherBlock = (candidate) => zoneBlocks.some(entry => entry?.supportBlockId === candidate?.id);
    if (
      !block ||
      block.carriedById ||
      supportsAnotherBlock(block) ||
      (typeof block.canBeMovedBy === 'function' && !block.canBeMovedBy(builder))
    ) {
      block = zoneBlocks.find(entry =>
        entry?.id &&
        !entry.carriedById &&
        ![fixture.baseBlockId, fixture.topBlockId, fixture.carryBlockAId].includes(entry.id) &&
        !supportsAnotherBlock(entry) &&
        (typeof entry.canBeMovedBy !== 'function' || entry.canBeMovedBy(builder))
      ) || null;
    }
    if (!builder || !block) {
      return { ok: false, reason: 'missing-second-cycle-entities' };
    }
    fixture.carryBlockBId = block.id;
    fixture.carryBStart = { x: block.x, y: block.y };
    if (window.__g2Trace?.second) {
      window.__g2Trace.second.blockId = block.id;
      window.__g2Trace.second.seenTarget = false;
      window.__g2Trace.second.seenCarry = false;
      window.__g2Trace.second.seenPlacementTarget = false;
      window.__g2Trace.second.placed = false;
      window.__g2Trace.second.maxCarryFrames = 0;
      window.__g2Trace.second.sampleCount = 0;
    }
    const candidateBlocks = zoneBlocks.filter(entry => !entry.carriedById || entry.id === block.id);

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

    const predictedPlacement = builder.chooseBlockPlacementTarget?.(block, candidateBlocks) || null;
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

async function collectFirstCycleDetails(page, blockerFlowerId) {
  return await page.evaluate((expectedFlowerId) => {
    const fixture = window.__g2Fixture;
    const trace = window.__g2Trace?.first || null;
    const state = gameCore.getGameState();
    const block = state.blocks.find(entry => entry.id === fixture.carryBlockAId) || null;
    const flower = state.flowers.find(entry => entry.id === fixture.blockerFlowerId) || null;
    const builder = state.butterflies.find(entry => entry.id === fixture.builderAId) || null;
    const remainingBlockingFlowerIds = block
      ? (gameCore.getFlowersBlockingBlockPlacement?.(
        fixture.zoneId,
        { x: block?.x, y: block?.y },
        block
      )?.map(entry => entry.id) || [])
      : [];
    return {
      trace,
      builder: builder ? {
        id: builder.id,
        x: builder.x,
        y: builder.y,
        state: builder.state,
        targetBlockId: builder.blockInteraction.targetBlockId || null,
        carryingBlockId: builder.blockInteraction.carryingBlockId || null,
        cooldownFrames: builder.blockInteraction.cooldownFrames || 0,
        carryFrames: builder.blockInteraction.carryFrames || 0,
        hasPlacementTarget: !!builder.blockInteraction.placementTarget
      } : null,
      before: {
        carryStart: fixture.carryAStart,
        predictedPlacement: fixture.predictedPlacementA,
        blockerFlowerStart: fixture.blockerFlowerStart
      },
      after: {
        blockX: block?.x || null,
        blockY: block?.y || null,
        blockCarriedById: block?.carriedById || null,
        lastMovedById: block?.lastMovedById || null,
        lastPlacedMode: block?.lastPlacedMode || null,
        supportBlockId: block?.supportBlockId || null,
        stackIndex: block?.stackIndex ?? null,
        flowerX: flower?.x || null,
        flowerY: flower?.y || null,
        movedDistance: block ? Math.hypot((block.x || 0) - fixture.carryAStart.x, (block.y || 0) - fixture.carryAStart.y) : null,
        flowerMovedDistance: flower ? Math.hypot((flower.x || 0) - fixture.blockerFlowerStart.x, (flower.y || 0) - fixture.blockerFlowerStart.y) : null,
        structureDistance: block ? Math.hypot((block.x || 0) - fixture.pocketCenter.x, (block.y || 0) - fixture.pocketCenter.y) : null,
        remainingBlockingFlowerIds,
        blockerFlowerStillBlocking: remainingBlockingFlowerIds.includes(expectedFlowerId),
        conflictResolutionMode: flower
          ? (Math.hypot((flower.x || 0) - fixture.blockerFlowerStart.x, (flower.y || 0) - fixture.blockerFlowerStart.y) > 8
            ? 'flower-relocated'
            : 'placement-retargeted')
          : 'unknown'
      }
    };
  }, blockerFlowerId);
}

async function collectSecondCycleDetails(page, predictedPlacement) {
  return await page.evaluate((predictedPlacementInner) => {
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
      structurePocketDistance <= 132
      || block.supportBlockId === fixture.baseBlockId
      || block.supportBlockId === fixture.topBlockId
      || block.supportBlockId === fixture.carryBlockAId
    );
    return {
      trace,
      firstTrace,
      predictedPlacement: predictedPlacementInner,
      builder: builder ? {
        id: builder.id,
        x: builder.x,
        y: builder.y,
        state: builder.state,
        targetBlockId: builder.blockInteraction.targetBlockId || null,
        carryingBlockId: builder.blockInteraction.carryingBlockId || null,
        cooldownFrames: builder.blockInteraction.cooldownFrames || 0,
        carryFrames: builder.blockInteraction.carryFrames || 0,
        hasPlacementTarget: !!builder.blockInteraction.placementTarget
      } : null,
      after: {
        blockX: block?.x || null,
        blockY: block?.y || null,
        blockCarriedById: block?.carriedById || null,
        lastMovedById: block?.lastMovedById || null,
        lastPlacedMode: block?.lastPlacedMode || null,
        supportBlockId: block?.supportBlockId || null,
        stackIndex: block?.stackIndex ?? null,
        movedDistance: block ? Math.hypot((block.x || 0) - fixture.carryBStart.x, (block.y || 0) - fixture.carryBStart.y) : null,
        structurePocketDistance,
        samePocket
      }
    };
  }, predictedPlacement);
}

async function prepareUncontrolledFreePlayPocket(page) {
  return await page.evaluate(() => {
    const state = gameCore.getGameState();
    const zoneId = gameCore.getFocusedZoneId?.() || state?.focusedZoneId || null;
    const center = zoneId ? gameCore.getZoneCenter?.(zoneId) : null;
    const availableButterflies = (state.butterflies || [])
      .filter(entry => !entry.isSpawning && entry.state !== 'dead');
    const zoneBlocks = (gameCore.getBlocksInZone?.(zoneId) || [])
      .filter(entry => !entry.carriedById);

    if (!zoneId || !center || availableButterflies.length < 4 || zoneBlocks.length < 10) {
      return {
        ok: false,
        reason: 'missing-uncontrolled-free-play-fixture',
        zoneId,
        butterflies: availableButterflies.length,
        blocks: zoneBlocks.length
      };
    }

    const pocketCenter = gameCore.clampPlacementPointInZone?.(zoneId, center.x + 94, center.y - 48, 8) || {
      x: center.x + 94,
      y: center.y - 48
    };
    const builders = availableButterflies.slice(0, 4);
    const watchedBlocks = zoneBlocks.slice(0, 10);

    const placeBlock = (block, x, y, stackIndex = 0, supportBlockId = null, placementMode = 'ground') => {
      gameCore.relocateFlowersForBlockPlacement?.(null, zoneId, { x, y }, block, {
        preferredDistance: 46
      });
      block.placeAt?.(x, y, {
        movedById: 'g2-freeplay-setup',
        stackIndex,
        supportBlockId,
        placementMode,
        zoneId
      });
    };

    const placeButterfly = (butterfly, x, y) => {
      const point = gameCore.clampPlacementPointInZone?.(zoneId, x, y, 8) || { x, y };
      butterfly.x = point.x;
      butterfly.y = point.y;
      butterfly.gridPos = gridManager.screenToIso(point.x, point.y);
      butterfly.currentZoneId = zoneId;
      butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
      butterfly.lifeSim.lifecycle.sleeping = false;
      butterfly.lifeSim.lifecycle.sleepSubtype = null;
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
      butterfly.lifeSim.emotions.curiosity = Math.max(butterfly.lifeSim.emotions.curiosity || 0, 0.92);
      butterfly.lifeSim.emotions.threat = Math.min(butterfly.lifeSim.emotions.threat || 0, 0.08);
      butterfly.lifeSim.emotions.agitation = Math.min(butterfly.lifeSim.emotions.agitation || 0, 0.1);
      butterfly.lifeSim.emotions.exhaustion = Math.min(butterfly.lifeSim.emotions.exhaustion || 0, 0.08);
      butterfly.lifeSim.drives.exploration = Math.max(butterfly.lifeSim.drives.exploration || 0, 0.9);
      butterfly.lifeSim.drives.rest = Math.min(butterfly.lifeSim.drives.rest || 0, 0.08);
      butterfly.lifeSim.objectAwareness.shelterConfidence = Math.max(butterfly.lifeSim.objectAwareness?.shelterConfidence || 0, 0.88);
      butterfly.lifeSim.derived.behaviorBiases.objectInterest = Math.max(butterfly.lifeSim.derived.behaviorBiases.objectInterest || 0, 0.92);
      butterfly.lifeSim.derived.behaviorBiases.shelterSeeking = Math.max(butterfly.lifeSim.derived.behaviorBiases.shelterSeeking || 0, 0.84);
      butterfly.lifeSim.derived.behaviorBiases.feedUrgency = 0;
      butterfly.rememberDispersalAnchor?.(`sector:${zoneId}:g2-freeplay-pocket`);
      sleepSystem?.wakeEntity?.(butterfly.id, 'g2-freeplay-fixture');
      sleepSystem?.setExhaustion?.(butterfly.id, 0.08);
      butterfly.updateZIndex?.();
    };

    const offsets = [
      { x: -34, y: 12 },
      { x: -52, y: 36 },
      { x: -18, y: 48 },
      { x: 28, y: 34 },
      { x: 46, y: 12 },
      { x: 58, y: 48 },
      { x: 8, y: -28 },
      { x: 34, y: -42 },
      { x: -64, y: -18 },
      { x: -84, y: 14 }
    ];

    placeBlock(watchedBlocks[0], pocketCenter.x + 10, pocketCenter.y + 14, 0, null, 'connected');
    placeBlock(watchedBlocks[1], pocketCenter.x + 10, pocketCenter.y + 14, 1, watchedBlocks[0].id, 'stacked');
    watchedBlocks.slice(2).forEach((block, index) => {
      const offset = offsets[index] || { x: index * 12, y: index * 8 };
      placeBlock(block, pocketCenter.x + offset.x, pocketCenter.y + offset.y, 0, null, 'ground');
    });

    builders.forEach((butterfly, index) => {
      const block = watchedBlocks[index + 2] || watchedBlocks[2];
      placeButterfly(butterfly, block.x - 9, block.y + 5);
    });

    (gameCore.getButterfliesInZone?.(zoneId) || [])
      .filter(entry => !builders.some(builder => builder.id === entry.id))
      .forEach(entry => {
        if (Math.hypot((entry.x || 0) - pocketCenter.x, (entry.y || 0) - pocketCenter.y) < 90) {
          const point = gameCore.clampPlacementPointInZone?.(zoneId, pocketCenter.x + 152, pocketCenter.y - 86, 8) || {
            x: pocketCenter.x + 152,
            y: pocketCenter.y - 86
          };
          entry.x = point.x;
          entry.y = point.y;
          entry.gridPos = gridManager.screenToIso(point.x, point.y);
          entry.currentZoneId = zoneId;
          entry.lifeSim.lifecycle.currentZoneId = zoneId;
          entry.blockInteraction.cooldownFrames = 240;
          entry.movement.clearTarget?.();
          entry.updateZIndex?.();
        }
      });

    objectSystem.update(state);
    structureSystem.update(state, 0);
    physicsSystem.update(state, 0);

    if (window.__g2FreePlaySampler) {
      clearInterval(window.__g2FreePlaySampler);
    }

    const trace = {
      zoneId,
      pocketCenter,
      builderIds: builders.map(entry => entry.id),
      blockIds: watchedBlocks.map(entry => entry.id),
      blockStarts: Object.fromEntries(watchedBlocks.map(block => [block.id, {
        x: block.x,
        y: block.y,
        lastMovedById: block.lastMovedById || null,
        lastPlacedMode: block.lastPlacedMode || null
      }])),
      events: [],
      seenTargets: {},
      seenCarries: {},
      seenPlacements: {},
      summary: {
        targets: 0,
        carries: 0,
        placements: 0,
        samePocketPlacements: 0,
        uniqueBuilders: 0,
        uniqueBlocksPlaced: 0,
        elapsedSamples: 0
      }
    };

    const recordEvent = (type, payload) => {
      trace.events.push({
        type,
        frame: gameCore.getCurrentFrame?.() || frameCount || 0,
        ...payload
      });
      if (trace.events.length > 80) {
        trace.events.shift();
      }
    };

    window.__g2FreePlay = trace;
    window.__g2FreePlaySampler = setInterval(() => {
      const latestState = gameCore.getGameState();
      const placedBuilderIds = new Set();
      const placedBlockIds = new Set();
      trace.summary.elapsedSamples += 1;

      for (const builderId of trace.builderIds) {
        const builder = latestState.butterflies.find(entry => entry.id === builderId) || null;
        if (!builder) continue;
        const targetId = builder.blockInteraction?.targetBlockId || null;
        const carryId = builder.blockInteraction?.carryingBlockId || null;
        if (targetId && !trace.seenTargets[builderId]) {
          trace.seenTargets[builderId] = targetId;
          recordEvent('target', { builderId, blockId: targetId });
        }
        if (carryId && !trace.seenCarries[`${builderId}:${carryId}`]) {
          trace.seenCarries[`${builderId}:${carryId}`] = true;
          recordEvent('carry', { builderId, blockId: carryId });
        }
      }

      for (const blockId of trace.blockIds) {
        const block = latestState.blocks.find(entry => entry.id === blockId) || null;
        const start = trace.blockStarts[blockId];
        if (!block || !start || block.carriedById) continue;
        const movedDistance = Math.hypot((block.x || 0) - start.x, (block.y || 0) - start.y);
        const builderId = block.lastMovedById || null;
        const placementKey = `${blockId}:${builderId}:${Math.round(block.x || 0)}:${Math.round(block.y || 0)}:${block.lastPlacedMode || 'unknown'}`;
        if (
          trace.builderIds.includes(builderId) &&
          block.lastPlacedMode !== 'carried' &&
          movedDistance > 8 &&
          !trace.seenPlacements[placementKey]
        ) {
          const pocketDistance = Math.hypot((block.x || 0) - pocketCenter.x, (block.y || 0) - pocketCenter.y);
          const samePocket = pocketDistance <= 132 || trace.blockIds.includes(block.supportBlockId || '');
          trace.seenPlacements[placementKey] = true;
          recordEvent('placement', {
            builderId,
            blockId,
            placementMode: block.lastPlacedMode || null,
            supportBlockId: block.supportBlockId || null,
            stackIndex: block.stackIndex ?? 0,
            movedDistance,
            pocketDistance,
            samePocket
          });
        }
      }

      for (const event of trace.events) {
        if (event.type === 'placement') {
          placedBuilderIds.add(event.builderId);
          placedBlockIds.add(event.blockId);
        }
      }
      trace.summary.targets = Object.keys(trace.seenTargets).length;
      trace.summary.carries = Object.keys(trace.seenCarries).length;
      trace.summary.placements = trace.events.filter(entry => entry.type === 'placement').length;
      trace.summary.samePocketPlacements = trace.events.filter(entry => entry.type === 'placement' && entry.samePocket).length;
      trace.summary.uniqueBuilders = placedBuilderIds.size;
      trace.summary.uniqueBlocksPlaced = placedBlockIds.size;
    }, 100);

    return {
      ok: true,
      zoneId,
      pocketCenter,
      builderIds: trace.builderIds,
      blockIds: trace.blockIds
    };
  });
}

async function collectUncontrolledFreePlayDetails(page) {
  return await page.evaluate(() => {
    const trace = window.__g2FreePlay || null;
    return {
      trace,
      latestSummary: trace?.summary || null,
      placementEvents: trace?.events?.filter(entry => entry.type === 'placement') || [],
      carryEvents: trace?.events?.filter(entry => entry.type === 'carry') || [],
      targetEvents: trace?.events?.filter(entry => entry.type === 'target') || []
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
      let timedOut = false;
      try {
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
      } catch (_error) {
        timedOut = true;
      }

      const blockerFlowerId = report.phases[0]?.details?.fixture?.blockerFlowerId;
      const details = await collectFirstCycleDetails(page, blockerFlowerId);
      details.timedOut = timedOut;

      return {
        pass:
          (details.trace?.seenCarry === true || details.trace?.placed === true || details.after?.lastMovedById === details.builder?.id) &&
          details.trace?.seenPlacementTarget === true &&
          (details.trace?.placed === true || details.after?.lastMovedById === details.builder?.id) &&
          (details.after?.movedDistance > 8 || details.after?.flowerMovedDistance > 8 || !!details.after?.supportBlockId) &&
          details.after?.blockerFlowerStillBlocking === false &&
          ['ground', 'connected', 'stacked'].includes(details.after?.lastPlacedMode),
        details
      };
    });

    await phase(page, report, outputDir, '03-second-guided-cycle-revisits-the-same-structure-pocket', async () => {
      const armed = await armSecondCycle(page);
      if (!armed.ok) {
        return { pass: false, details: armed };
      }

      let timedOut = false;
      try {
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
      } catch (_error) {
        timedOut = true;
      }

      const details = await collectSecondCycleDetails(page, armed.predictedPlacement);
      details.timedOut = timedOut;

      return {
        pass:
          details.trace?.seenCarry === true &&
          details.trace?.seenPlacementTarget === true &&
          (details.trace?.placed === true || details.after?.lastMovedById === details.builder?.id) &&
          details.after?.movedDistance > 8 &&
          details.after?.samePocket === true &&
          ['ground', 'connected', 'stacked'].includes(details.after?.lastPlacedMode),
        details
      };
    });

    await phase(page, report, outputDir, '04-uncontrolled-free-play-pocket-setup', async () => {
      await page.evaluate(() => {
        if (window.__g2Sampler) {
          clearInterval(window.__g2Sampler);
          window.__g2Sampler = null;
        }
        if (window.__g2PilotLoop) {
          clearInterval(window.__g2PilotLoop);
          window.__g2PilotLoop = null;
        }
      });
      const imported = await importSaveIntoPage(page, saveData.raw);
      await page.waitForTimeout(1200);
      const fixture = await prepareUncontrolledFreePlayPocket(page);
      return {
        pass:
          imported.restored === true &&
          fixture.ok === true &&
          fixture.builderIds?.length >= 4 &&
          fixture.blockIds?.length >= 10,
        details: {
          imported,
          fixture
        }
      };
    });

    await phase(page, report, outputDir, '05-uncontrolled-free-play-building-signal-observation', async () => {
      let timedOut = false;
      try {
        await page.waitForFunction(() => {
          const summary = window.__g2FreePlay?.summary;
          return !!summary
            && summary.carries >= 2
            && summary.placements >= 2
            && summary.samePocketPlacements >= 2
            && summary.uniqueBlocksPlaced >= 2;
        }, null, { timeout: 60000 });
      } catch (_error) {
        timedOut = true;
      }

      const details = await collectUncontrolledFreePlayDetails(page);
      details.timedOut = timedOut;
      details.closureReady =
        details.latestSummary?.carries >= 2 &&
        details.latestSummary?.placements >= 2 &&
        details.latestSummary?.samePocketPlacements >= 2 &&
        details.latestSummary?.uniqueBlocksPlaced >= 2;

      return {
        pass:
          details.latestSummary?.placements >= 1 &&
          details.latestSummary?.uniqueBlocksPlaced >= 1,
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
        if (window.__g2FreePlaySampler) {
          clearInterval(window.__g2FreePlaySampler);
          window.__g2FreePlaySampler = null;
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
