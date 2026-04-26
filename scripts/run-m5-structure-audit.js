const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'm5_structure_audit');
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

async function setupShelterScenario(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const zoneId = gameCore.getFocusedZoneId();
    const center = gameCore.getZoneCenter(zoneId);
    const zoneBlocks = (state.blocks || []).filter(block => block.currentZoneId === zoneId);
    const blocks = zoneBlocks.slice(0, 8);
    const extraBlocks = zoneBlocks.slice(8);
    const otherZoneId = (gameCore.getZoneIds?.() || []).find(id => id !== zoneId) || null;
    const butterfly = (state.butterflies || []).find(entry =>
      entry.currentZoneId === zoneId
      && entry.personalityType !== 'golden'
      && !entry.zoneTravel
      && !entry.isSpawning
    ) || state.butterflies?.[0] || null;
    const region = gameCore.getZoneConfig(zoneId)?.renderProfile?.screenRegion || null;
    if (!center || !region || blocks.length < 8 || !butterfly) {
      return { ok: false, reason: 'missing-shelter-fixture' };
    }

    const stackCenters = [
      { x: center.x - 26, y: center.y - 26 },
      { x: center.x + 26, y: center.y - 26 },
      { x: center.x - 26, y: center.y + 26 },
      { x: center.x + 26, y: center.y + 26 }
    ];

    for (let stackIndex = 0; stackIndex < stackCenters.length; stackIndex += 1) {
      const base = blocks[stackIndex * 2];
      const top = blocks[(stackIndex * 2) + 1];
      const point = stackCenters[stackIndex];
      base.currentZoneId = zoneId;
      base.carriedById = null;
      base.supportBlockId = null;
      base.stackIndex = 0;
      base.lastPlacedMode = 'connected';
      base.x = point.x;
      base.y = point.y;
      base.gridPos = gridManager.screenToIso(point.x, point.y);
      base.updateZIndex?.();
      top.currentZoneId = zoneId;
      top.carriedById = null;
      top.supportBlockId = base.id;
      top.stackIndex = 1;
      top.lastPlacedMode = 'stacked';
      top.x = point.x;
      top.y = point.y;
      top.gridPos = gridManager.screenToIso(point.x, point.y);
      top.updateZIndex?.();
    }

    // Keep ambient zone blocks far from the audit shelter so they cannot merge
    // into the same structure component under the M5 connectivity rules.
    for (let index = 0; index < extraBlocks.length; index += 1) {
      const extra = extraBlocks[index];
      const column = index % 4;
      const row = Math.floor(index / 4);
      const targetZoneId = otherZoneId || zoneId;
      const targetCenter = gameCore.getZoneCenter(targetZoneId) || center;
      if (otherZoneId) {
        gameCore.assignEntityToZone(extra, targetZoneId);
      }
      const desired = {
        x: targetCenter.x + ((column - 1.5) * 18),
        y: targetCenter.y + (42 + (row * 18))
      };
      const point = targetZoneId === zoneId
        ? gameCore.clampPlacementPoint(desired.x, desired.y, 10)
        : desired;
      extra.placeAt(point.x, point.y, {
        movedById: 'audit',
        stackIndex: 0,
        supportBlockId: null,
        placementMode: 'ground',
        zoneId: targetZoneId
      });
    }

    butterfly.x = center.x;
    butterfly.y = center.y;
    butterfly.gridPos = gridManager.screenToIso(center.x, center.y);
    butterfly.currentZoneId = zoneId;
    butterfly.lifeSim.lifecycle.currentZoneId = zoneId;

    objectSystem.update(state, 0);
    structureSystem.update(state, 0);
    lifeSimSystem.update(state, 0);

    window.__m5Fixture = {
      zoneId,
      butterflyId: butterfly.id,
      carryBlockId: extraBlocks[0]?.id || blocks[0]?.id || null
    };

    return {
      ok: true,
      zoneId,
      butterflyId: butterfly.id,
      carryBlockId: extraBlocks[0]?.id || blocks[0]?.id || null,
      center
    };
  });
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

    await phase(page, report, outputDir, '01-structure-owner-live', async () => {
      const state = await page.evaluate(() => {
        const zoneId = gameCore.getFocusedZoneId();
        const profile = structureSystem.getZoneProfile(zoneId);
        return {
          zoneId,
          initialized: !!structureSystem.initialized,
          componentCount: profile?.componentCount || 0,
          blockCount: profile?.blockCount || 0
        };
      });
      return {
        pass:
          state.initialized &&
          !!state.zoneId &&
          state.blockCount > 0 &&
          state.componentCount > 0,
        details: state
      };
    });

    await setupShelterScenario(page);
    await page.waitForTimeout(300);

    await phase(page, report, outputDir, '02-shelter-classification', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        if (butterfly && shelter?.interiorPoint) {
          butterfly.x = shelter.interiorPoint.x;
          butterfly.y = shelter.interiorPoint.y;
          butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
          butterfly.currentZoneId = zoneId;
          butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        }
        const context = butterfly ? structureSystem.getSpatialContextForEntity(butterfly, gameState) : null;
        return {
          zoneId,
          shelterCount: profile?.shelterCount || 0,
          shelter,
          context
        };
      });
      return {
        pass:
          state.shelterCount >= 1 &&
          !!state.shelter?.interiorBounds &&
          state.context?.structureRole === 'shelter' &&
          state.context?.insideShelter === true &&
          state.context?.canUseInterior === true,
        details: state
      };
    });

    await phase(page, report, outputDir, '02b-collision-geometry-query', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        const zoneGeometry = structureSystem.getZoneCollisionGeometry(zoneId);
        const shelter = (zoneGeometry?.components || []).find(component => component.shelterEligible) || null;
        const queryPoint = shelter?.opening?.outerPoint || shelter?.interiorPoint || shelter?.center || null;
        const structureQuery = butterfly && queryPoint
          ? physicsSystem.getStructureQueryForEntity?.(butterfly, queryPoint, {
              zoneId,
              fromX: butterfly.x,
              fromY: butterfly.y
            }) || null
          : null;
        return {
          zoneGeometry: zoneGeometry ? {
            version: zoneGeometry.version || null,
            componentCount: zoneGeometry.componentCount || 0,
            shelterCount: zoneGeometry.shelterCount || 0,
            openingCount: zoneGeometry.openingCount || 0,
            roofCount: zoneGeometry.roofCount || 0,
            wallNormalCount: zoneGeometry.wallNormalCount || 0,
            occupancyColumnCount: zoneGeometry.occupancyColumnCount || 0
          } : null,
          shelter: shelter ? {
            componentId: shelter.componentId,
            openingWidth: shelter.openingWidth || 0,
            hasInteriorVolume: !!shelter.interiorVolume,
            hasRoofFootprint: !!shelter.roofFootprint,
            wallNormalCount: shelter.wallNormals?.length || 0,
            occupancyColumnCount: shelter.occupancyColumns?.length || 0
          } : null,
          structureQuery: structureQuery ? {
            version: structureQuery.version || null,
            nearestComponentId: structureQuery.nearestComponentId || null,
            relevantShelterId: structureQuery.relevantShelterId || null,
            openingWidth: structureQuery.openingWidth || 0,
            wallSide: structureQuery.wallNormal?.side || null,
            nearbyOccupancyCount: structureQuery.nearbyOccupancyColumns?.length || 0
          } : null
        };
      });
      return {
        pass:
          !!state?.zoneGeometry &&
          state.zoneGeometry.version === 'b2' &&
          state.zoneGeometry.shelterCount >= 1 &&
          state.zoneGeometry.openingCount >= 1 &&
          state.zoneGeometry.roofCount >= 1 &&
          state.zoneGeometry.wallNormalCount >= 4 &&
          state.zoneGeometry.occupancyColumnCount >= 4 &&
          !!state.shelter &&
          state.shelter.hasInteriorVolume === true &&
          state.shelter.hasRoofFootprint === true &&
          state.shelter.wallNormalCount >= 4 &&
          state.shelter.occupancyColumnCount >= 4 &&
          !!state.structureQuery &&
          state.structureQuery.version === 'b2' &&
          state.structureQuery.relevantShelterId === state.shelter.componentId &&
          state.structureQuery.openingWidth > 0 &&
          !!state.structureQuery.wallSide,
        details: state
      };
    });

    await phase(page, report, outputDir, '03-path-blocking', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        if (!butterfly || !shelter) return null;

        butterfly.x = shelter.interiorPoint.x;
        butterfly.y = shelter.interiorPoint.y;
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;

        const wallStack = (shelter.stacks || []).find(stack => stack.height >= 2) || null;
        const wallPoint = wallStack ? { x: wallStack.x, y: wallStack.y } : { x: shelter.bounds.minX, y: shelter.center.y };
        const interiorPoint = { x: shelter.interiorPoint.x, y: shelter.interiorPoint.y };
        return {
          wallBlocked: gameCore.isScreenPointBlockedForButterfly(wallPoint.x, wallPoint.y, butterfly, { zoneId }),
          interiorBlocked: gameCore.isScreenPointBlockedForButterfly(interiorPoint.x, interiorPoint.y, butterfly, { zoneId }),
          openingWidth: shelter.openingWidth
        };
      });
      return {
        pass:
          !!state &&
          state.wallBlocked === true &&
          state.interiorBlocked === false &&
          state.openingWidth > 0,
        details: state
      };
    });

    await phase(page, report, outputDir, '03b-moving-pass-slide', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        const wallStack = (shelter?.stacks || []).find(stack =>
          stack.height >= 2
          && Math.abs((stack.y || 0) - (shelter?.center?.y || 0)) > 14
        ) || (shelter?.stacks || []).find(stack => stack.height >= 2) || null;
        if (!butterfly || !shelter || !wallStack) return null;

        const fromPoint = {
          x: wallStack.x - 34,
          y: wallStack.y + 6
        };
        const blockedDesired = {
          x: wallStack.x,
          y: wallStack.y
        };

        butterfly.x = blockedDesired.x;
        butterfly.y = blockedDesired.y - (butterfly.shadowOffset || 0);
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.physics = butterfly.physics || {};
        butterfly.physics.motion = butterfly.physics.motion || {
          previous: { x: fromPoint.x, y: fromPoint.y },
          desired: { x: blockedDesired.x, y: blockedDesired.y },
          movedFrame: frameCount,
          source: 'audit-slide'
        };
        butterfly.physics.motion.previous.x = fromPoint.x;
        butterfly.physics.motion.previous.y = fromPoint.y;
        butterfly.physics.motion.desired.x = blockedDesired.x;
        butterfly.physics.motion.desired.y = blockedDesired.y;
        butterfly.physics.motion.movedFrame = frameCount;
        butterfly.physics.motion.source = 'audit-slide';

        physicsSystem.update(gameState, 0, { resetContacts: false });

        const finalGround = {
          x: butterfly.x,
          y: butterfly.y + (butterfly.shadowOffset || 0)
        };
        const finalBlocked = gameCore.isScreenPointBlockedForButterfly(finalGround.x, finalGround.y, butterfly, {
          zoneId,
          fromX: fromPoint.x,
          fromY: fromPoint.y
        });

        return {
          fromPoint,
          blockedDesired,
          finalGround,
          movedFromOrigin: Math.hypot(finalGround.x - fromPoint.x, finalGround.y - fromPoint.y),
          movedOffBlockedPoint: Math.hypot(finalGround.x - blockedDesired.x, finalGround.y - blockedDesired.y),
          finalBlocked,
          blockedByIds: butterfly.physics?.contact?.blockedByIds || [],
          pathState: butterfly.physics?.diagnostics?.pathState || null
        };
      });
      return {
        pass:
          !!state &&
          state.finalBlocked === false &&
          typeof state.movedFromOrigin === 'number' &&
          state.movedFromOrigin > 3 &&
          typeof state.movedOffBlockedPoint === 'number' &&
          state.movedOffBlockedPoint > 3 &&
          Array.isArray(state.blockedByIds) &&
          state.blockedByIds.some(entry => String(entry).startsWith('structure:')),
        details: state
      };
    });

    await phase(page, report, outputDir, '04-opening-transition-truth', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        if (!butterfly || !shelter?.openingProfile?.outerPoint || !shelter?.interiorPoint) return null;

        const awayPoint = {
          x: shelter.center.x + ((shelter.openingDirection === 'left') ? 72 : shelter.openingDirection === 'right' ? -72 : 54),
          y: shelter.center.y + ((shelter.openingDirection === 'top') ? 72 : shelter.openingDirection === 'bottom' ? -72 : 0)
        };
        butterfly.x = awayPoint.x;
        butterfly.y = awayPoint.y;
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        const blockedAway = gameCore.isScreenPointBlockedForButterfly(
          shelter.interiorPoint.x,
          shelter.interiorPoint.y,
          butterfly,
          {
            zoneId,
            fromX: butterfly.x,
            fromY: butterfly.y
          }
        );

        butterfly.x = shelter.openingProfile.outerPoint.x;
        butterfly.y = shelter.openingProfile.outerPoint.y;
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
        const allowedViaOpening = gameCore.isScreenPointBlockedForButterfly(
          shelter.interiorPoint.x,
          shelter.interiorPoint.y,
          butterfly,
          {
            zoneId,
            fromX: butterfly.x,
            fromY: butterfly.y
          }
        );

        return {
          blockedAway,
          allowedViaOpening,
          openingDirection: shelter.openingDirection
        };
      });
      return {
        pass:
          !!state &&
          state.blockedAway === true &&
          state.allowedViaOpening === false,
        details: state
      };
    });

    await phase(page, report, outputDir, '05-shelter-targeting', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        if (!butterfly) return null;

        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        if (!shelter?.entryPoint) return null;

        butterfly.x = shelter.entryPoint.x - 72;
        butterfly.y = shelter.entryPoint.y;
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.state = 'normal';
        butterfly.stateData = {};
        butterfly.movement.clearTarget();
        const shelterPoint = structureSystem.getPreferredShelterPointForEntity(butterfly, zoneId);
        const expectedGrid = shelterPoint ? gridManager.screenToIso(shelterPoint.x, shelterPoint.y) : null;
        butterfly.lifeSim.derived.behaviorBiases.shelterSeeking = 0.92;
        butterfly.pickNewWanderTarget();
        return {
          shelterPoint,
          expectedGrid,
          movementTarget: butterfly.movement?.target || null
        };
      });
      return {
        pass:
          !!state?.shelterPoint &&
          !!state?.expectedGrid &&
          !!state?.movementTarget &&
          Math.abs(state.movementTarget.x - state.expectedGrid.x) < 0.8 &&
          Math.abs(state.movementTarget.y - state.expectedGrid.y) < 0.8,
        details: state
      };
    });

    await phase(page, report, outputDir, '06-body-fit-and-carry-owner', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        const carryBlock = (gameState.blocks || []).find(entry => entry.id === window.__m5Fixture?.carryBlockId) || null;
        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        if (!butterfly || !carryBlock || !shelter?.openingProfile?.outerPoint) return null;

        butterfly.x = shelter.openingProfile.outerPoint.x;
        butterfly.y = shelter.openingProfile.outerPoint.y;
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;

        const originalSize = butterfly.size;
        butterfly.size = Math.max(originalSize, Math.ceil((shelter.openingWidth || 0) * 1.45));
        const oversizedContext = structureSystem.getSpatialContextForEntity(butterfly, gameState);
        butterfly.size = originalSize;

        carryBlock.pickupBy?.(butterfly);
        butterfly.blockInteraction.carryingBlockId = carryBlock.id;
        const expectedAnchor = structureSystem.getCarryAnchorForEntity(butterfly, carryBlock);
        butterfly.updateCarriedBlockPose(carryBlock);
        return {
          bodyFit: oversizedContext?.bodyFit || null,
          canUseInterior: oversizedContext?.canUseInterior || false,
          carriedById: carryBlock.carriedById || null,
          currentZoneId: carryBlock.currentZoneId || null,
          expectedAnchor,
          actualAnchor: butterfly.physics?.carry?.anchor || null,
          anchorDeferredToPhysics: !!gameCore?.physicsSystem?.initialized
        };
      });
      return {
        pass:
          !!state &&
          state.bodyFit === 'tooNarrow' &&
          state.canUseInterior === false &&
          !!state.expectedAnchor &&
          !!state.carriedById &&
          state.anchorDeferredToPhysics === true,
        details: state
      };
    });

    await phase(page, report, outputDir, '06b-carry-anchor-after-physics', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        const carryBlock = (gameState.blocks || []).find(entry => entry.id === window.__m5Fixture?.carryBlockId) || null;
        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        const wallStack = (shelter?.stacks || []).find(stack =>
          stack.height >= 2
          && Math.abs((stack.y || 0) - (shelter?.center?.y || 0)) > 14
        ) || (shelter?.stacks || []).find(stack => stack.height >= 2) || null;
        if (!butterfly || !carryBlock || !shelter || !wallStack) return null;

        carryBlock.pickupBy?.(butterfly);
        butterfly.blockInteraction.carryingBlockId = carryBlock.id;

        const fromPoint = {
          x: wallStack.x - 34,
          y: wallStack.y + 6
        };
        const blockedDesired = {
          x: wallStack.x,
          y: wallStack.y
        };

        butterfly.x = blockedDesired.x;
        butterfly.y = blockedDesired.y - (butterfly.shadowOffset || 0);
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.physics = butterfly.physics || {};
        butterfly.physics.motion = butterfly.physics.motion || {
          previous: { x: fromPoint.x, y: fromPoint.y },
          desired: { x: blockedDesired.x, y: blockedDesired.y },
          movedFrame: frameCount,
          source: 'audit-carry'
        };
        butterfly.physics.motion.previous.x = fromPoint.x;
        butterfly.physics.motion.previous.y = fromPoint.y;
        butterfly.physics.motion.desired.x = blockedDesired.x;
        butterfly.physics.motion.desired.y = blockedDesired.y;
        butterfly.physics.motion.movedFrame = frameCount;
        butterfly.physics.motion.source = 'audit-carry';

        physicsSystem.update(gameState, 0, { resetContacts: false });

        const finalGround = {
          x: butterfly.x,
          y: butterfly.y + (butterfly.shadowOffset || 0)
        };
        const anchor = butterfly.physics?.carry?.anchor || null;
        const carryCheck = structureSystem.isCarryAnchorBlockedForEntity(butterfly, carryBlock, finalGround, { zoneId });
        return {
          finalGround,
          blockPoint: { x: carryBlock.x, y: carryBlock.y },
          anchor,
          anchorDelta: anchor ? Math.hypot((carryBlock.x || 0) - anchor.x, (carryBlock.y || 0) - anchor.y) : null,
          carryBlocked: carryCheck?.blocked ?? null,
          blockedByIds: butterfly.physics?.contact?.blockedByIds || []
        };
      });
      return {
        pass:
          !!state &&
          !!state.anchor &&
          typeof state.anchorDelta === 'number' &&
          state.anchorDelta < 1.25 &&
          state.carryBlocked === false &&
          Array.isArray(state.blockedByIds) &&
          state.blockedByIds.some(entry => String(entry).startsWith('structure:')),
        details: state
      };
    });

    await phase(page, report, outputDir, '06c-placement-rejects-opening-conflict', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        const carryBlock = (gameState.blocks || []).find(entry => entry.id === window.__m5Fixture?.carryBlockId) || null;
        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        if (!butterfly || !carryBlock || !shelter?.openingProfile?.outerPoint) return null;

        carryBlock.pickupBy?.(butterfly);
        butterfly.blockInteraction.carryingBlockId = carryBlock.id;
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;

        const invalidPlacement = {
          x: shelter.openingProfile.outerPoint.x,
          y: shelter.openingProfile.outerPoint.y,
          stackIndex: 0,
          supportBlockId: null,
          placementMode: 'connected',
          zoneId,
          componentId: shelter.id,
          supportComponentId: shelter.id
        };
        butterfly.blockInteraction.placementTarget = invalidPlacement;
        const zoneBlocks = (gameState.blocks || []).filter(entry => entry.currentZoneId === zoneId);
        const requestedValid = structureSystem.validatePlacementTargetForBlock(butterfly, carryBlock, invalidPlacement, zoneBlocks);
        const placed = butterfly.placeCarriedBlock(carryBlock, zoneId);
        const finalPoint = { x: carryBlock.x, y: carryBlock.y };
        const stillConflicts = structureSystem.pointConflictsWithOpening(shelter, finalPoint, Math.max(carryBlock.renderWidth || 18, 18) * 0.92);
        return {
          requestedValid,
          placed,
          finalPoint,
          movedOffRequested: Math.hypot(finalPoint.x - invalidPlacement.x, finalPoint.y - invalidPlacement.y),
          stillConflicts,
          placementMode: carryBlock.lastPlacedMode || null
        };
      });
      return {
        pass:
          !!state &&
          state.requestedValid === false &&
          state.placed === true &&
          state.stillConflicts === false &&
          typeof state.movedOffRequested === 'number' &&
          state.movedOffRequested > 4,
        details: state
      };
    });

    await phase(page, report, outputDir, '07-rebuild-derived-structure', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = window.__m5Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (gameState.butterflies || []).find(entry => entry.id === window.__m5Fixture?.butterflyId) || null;
        const carryBlock = (gameState.blocks || []).find(entry => entry.id === window.__m5Fixture?.carryBlockId) || null;
        if (!butterfly) return null;
        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        if (shelter?.interiorPoint) {
          butterfly.x = shelter.interiorPoint.x;
          butterfly.y = shelter.interiorPoint.y;
          butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
          butterfly.currentZoneId = zoneId;
          butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        }

        if (carryBlock?.id) {
          objectSystem?.dropObject?.(carryBlock.id);
          carryBlock.carriedById = null;
        }
        butterfly.blockInteraction.carryingBlockId = null;
        if (butterfly.physics?.carry) {
          butterfly.physics.carry.attachedObjectId = null;
          butterfly.physics.carry.anchor = null;
        }

        butterfly.lifeSim.spatialAwareness = createSpatialAwarenessProfile({
          verticality: 'ground',
          structureRole: 'loose',
          pathState: 'open',
          bodyFit: 'canPass',
          obstacleDensity: 0,
          shelterCandidate: false,
          canUseInterior: false
        });

        saveSystem.rebuildDerivedState(gameState);

        return {
          space: butterfly.lifeSim.spatialAwareness,
          objectShelterConfidence: butterfly.lifeSim.objectAwareness?.shelterConfidence || 0
        };
      });
      return {
        pass:
          !!state &&
          state.space?.structureRole === 'shelter' &&
          state.space?.canUseInterior === true &&
          state.objectShelterConfidence > 0.3,
        details: state
      };
    });

    const failed = report.phases.filter(phase => !phase.pass);
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
