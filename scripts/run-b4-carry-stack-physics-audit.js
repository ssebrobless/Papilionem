const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'b4_carry_stack_physics_audit');
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
    eventBus.clearHistory?.();
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

async function setupCarryStackScenario(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const zoneId = gameCore.getFocusedZoneId();
    const center = gameCore.getZoneCenter(zoneId);
    const zoneBlocks = (state.blocks || []).filter(block => block.currentZoneId === zoneId);
    const fixtureBlocks = zoneBlocks.slice(0, 9);
    const butterfly = (state.butterflies || []).find(entry =>
      entry.currentZoneId === zoneId
      && entry.personalityType !== 'golden'
      && !entry.zoneTravel
      && !entry.isSpawning
    ) || state.butterflies?.[0] || null;

    if (!center || !butterfly || fixtureBlocks.length < 9) {
      return { ok: false, reason: 'missing-b4-fixture' };
    }

    const stackCenters = [
      { x: center.x - 28, y: center.y - 26 },
      { x: center.x + 28, y: center.y - 26 },
      { x: center.x - 28, y: center.y + 26 },
      { x: center.x + 28, y: center.y + 26 }
    ];

    for (let stackIndex = 0; stackIndex < stackCenters.length; stackIndex += 1) {
      const base = fixtureBlocks[stackIndex * 2];
      const top = fixtureBlocks[(stackIndex * 2) + 1];
      const point = stackCenters[stackIndex];

      gameCore.relocateFlowersForBlockPlacement?.(null, zoneId, point, base, {
        preferredDistance: 42
      });

      base.placeAt?.(point.x, point.y, {
        movedById: 'audit',
        stackIndex: 0,
        supportBlockId: null,
        placementMode: 'connected',
        zoneId
      });

      gameCore.relocateFlowersForBlockPlacement?.(null, zoneId, point, top, {
        preferredDistance: 42
      });

      top.placeAt?.(point.x, point.y, {
        movedById: 'audit',
        stackIndex: 1,
        supportBlockId: base.id,
        placementMode: 'stacked',
        zoneId
      });
    }

    const carryBlock = fixtureBlocks[8];
    gameCore.relocateFlowersForBlockPlacement?.(null, zoneId, {
      x: center.x - 82,
      y: center.y + 58
    }, carryBlock, {
      preferredDistance: 42
    });
    carryBlock.placeAt?.(center.x - 82, center.y + 58, {
      movedById: 'audit',
      stackIndex: 0,
      supportBlockId: null,
      placementMode: 'ground',
      zoneId
    });

    butterfly.x = center.x - 62;
    butterfly.y = center.y + 44;
    butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
    butterfly.currentZoneId = zoneId;
    butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
    butterfly.blockInteraction.carryingBlockId = null;
    butterfly.blockInteraction.targetBlockId = null;
    butterfly.blockInteraction.placementTarget = null;
    butterfly.blockInteraction.carryFrames = 0;

    objectSystem.update(state);
    structureSystem.update(state, 0);
    physicsSystem.update(state, 0);

    const supportedTop = fixtureBlocks
      .filter(entry => entry?.id && (entry.stackIndex || 0) >= 1 && !!entry.supportBlockId)
      .sort((left, right) => (right.stackIndex || 0) - (left.stackIndex || 0))[0] || null;
    const supportBase = supportedTop
      ? fixtureBlocks.find(entry => entry?.id === supportedTop.supportBlockId) || null
      : null;

    window.__b4Fixture = {
      zoneId,
      butterflyId: butterfly.id,
      carryBlockId: carryBlock.id,
      baseBlockId: supportBase?.id || fixtureBlocks[0]?.id || null,
      topBlockId: supportedTop?.id || fixtureBlocks[1]?.id || null
    };

    return {
      ok: true,
      zoneId,
      butterflyId: butterfly.id,
      carryBlockId: carryBlock.id,
      baseBlockId: supportBase?.id || fixtureBlocks[0]?.id || null,
      topBlockId: supportedTop?.id || fixtureBlocks[1]?.id || null
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
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    await phase(page, report, outputDir, '01-carry-anchor-owned-by-physics', async () => {
      await resetBaseline(page);
      const fixture = await setupCarryStackScenario(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const butterfly = (state.butterflies || []).find(entry => entry.id === window.__b4Fixture?.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === window.__b4Fixture?.carryBlockId) || null;
        if (!butterfly || !carryBlock) return null;

        objectSystem.pickupObject?.(carryBlock.id, butterfly.id);
        carryBlock.pickupBy?.(butterfly);
        butterfly.blockInteraction.carryingBlockId = carryBlock.id;
        butterfly.updateCarriedBlockPose?.(carryBlock);
        objectSystem.update(state);
        physicsSystem.refreshPhysicsState?.(carryBlock, 'block', state, { resetContacts: false });
        physicsSystem.refreshPhysicsState?.(butterfly, 'butterfly', state, { resetContacts: false });

        const blockPhysics = physicsSystem.getEntityState?.(carryBlock.id) || null;
        const butterflyPhysics = physicsSystem.getEntityState?.(butterfly.id) || null;
        const objectState = objectSystem.getObjectState?.(carryBlock.id) || null;

        return {
          carriedById: carryBlock.carriedById || null,
          objectOccupancyState: carryBlock.objectProfile?.occupancyState || null,
          objectState,
          blockPhysics: blockPhysics ? {
            attachedObjectId: blockPhysics.carry?.attachedObjectId || null,
            hasAnchor: !!blockPhysics.carry?.anchor,
            supportState: blockPhysics.diagnostics?.supportState || null,
            occupancyBand: blockPhysics.diagnostics?.occupancyBand || null
          } : null,
          butterflyPhysics: butterflyPhysics ? {
            attachedObjectId: butterflyPhysics.carry?.attachedObjectId || null,
            hasAnchor: !!butterflyPhysics.carry?.anchor
          } : null
        };
      });

      return {
        pass:
          !!details &&
          details.carriedById === fixture.butterflyId &&
          details.objectOccupancyState === 'carried' &&
          details.objectState?.carriedById === fixture.butterflyId &&
          details.objectState?.metadata?.supportState === 'carried' &&
          details.blockPhysics?.attachedObjectId === fixture.butterflyId &&
          details.blockPhysics?.hasAnchor === true &&
          details.blockPhysics?.supportState === 'carried' &&
          details.blockPhysics?.occupancyBand === 'overhead' &&
          details.butterflyPhysics?.attachedObjectId === fixture.carryBlockId &&
          details.butterflyPhysics?.hasAnchor === true,
        details
      };
    });

    await phase(page, report, outputDir, '02-stacked-placement-routes-through-physics', async () => {
      await resetBaseline(page);
      await setupCarryStackScenario(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const butterfly = (state.butterflies || []).find(entry => entry.id === window.__b4Fixture?.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === window.__b4Fixture?.carryBlockId) || null;
        const topBlock = (state.blocks || []).find(entry => entry.id === window.__b4Fixture?.topBlockId) || null;
        if (!butterfly || !carryBlock) return null;

        objectSystem.pickupObject?.(carryBlock.id, butterfly.id);
        carryBlock.pickupBy?.(butterfly);
        butterfly.blockInteraction.carryingBlockId = carryBlock.id;
        butterfly.updateCarriedBlockPose?.(carryBlock);

        const zoneBlocks = (state.blocks || []).filter(entry => entry.currentZoneId === window.__b4Fixture?.zoneId);
        const topSupportContext = topBlock
          ? physicsSystem.getBlockSupportContext?.(topBlock, state) || null
          : null;
        const requestedPlacement = topBlock ? {
          x: topBlock.x,
          y: topBlock.y,
          stackIndex: Math.max(1, topSupportContext?.stackHeight || ((topBlock.stackIndex || 0) + 1)),
          supportBlockId: topBlock.id,
          placementMode: 'stacked',
          zoneId: window.__b4Fixture?.zoneId || topBlock.currentZoneId || butterfly.currentZoneId,
          componentId: topSupportContext?.componentId || null,
          supportComponentId: topSupportContext?.componentId || null
        } : null;
        const resolvedPlacement = physicsSystem.resolveBlockPlacementRequest?.(
          butterfly,
          carryBlock,
          requestedPlacement,
          zoneBlocks,
          {
            sceneState: state,
            safeDrop: false
          }
        ) || null;
        const placed = resolvedPlacement
          ? physicsSystem.applyResolvedBlockPlacement?.(carryBlock, resolvedPlacement, butterfly.id, state)
          : false;

        structureSystem.update(state, 0);
        physicsSystem.refreshPhysicsState?.(carryBlock, 'block', state, { resetContacts: false });
        objectSystem.update(state);

        const blockPhysics = physicsSystem.getEntityState?.(carryBlock.id) || null;
        const objectState = objectSystem.getObjectState?.(carryBlock.id) || null;

        return {
          requestedPlacement,
          resolvedPlacement,
          placed,
          finalBlock: {
            x: carryBlock.x,
            y: carryBlock.y,
            stackIndex: carryBlock.stackIndex,
            supportBlockId: carryBlock.supportBlockId || null,
            lastPlacedMode: carryBlock.lastPlacedMode || null,
            occupancyState: carryBlock.objectProfile?.occupancyState || null
          },
          blockPhysics: blockPhysics ? {
            supportState: blockPhysics.diagnostics?.supportState || null,
            occupancyBand: blockPhysics.diagnostics?.occupancyBand || null,
            stackHeight: blockPhysics.diagnostics?.stackHeight || 0
          } : null,
          objectState
        };
      });

      return {
        pass:
          !!details?.resolvedPlacement &&
          details.resolvedPlacement?.placementMode === 'stacked' &&
          details.resolvedPlacement?.supportContext?.supportState === 'supported' &&
          details.placed === true &&
          (details.finalBlock?.stackIndex || 0) >= 1 &&
          !!details.finalBlock?.supportBlockId &&
          details.finalBlock?.lastPlacedMode === 'stacked' &&
          details.finalBlock?.occupancyState === 'stacked' &&
          details.blockPhysics?.supportState === 'supported' &&
          details.blockPhysics?.occupancyBand === 'stacked' &&
          details.blockPhysics?.stackHeight === ((details.finalBlock?.stackIndex || 0) + 1) &&
          details.resolvedPlacement?.supportContext?.stackHeight === details.blockPhysics?.stackHeight &&
          details.objectState?.metadata?.supportState === 'supported' &&
          details.objectState?.metadata?.stablePlacement === true,
        details
      };
    });

    await phase(page, report, outputDir, '03-invalid-placement-normalizes-to-safe-target', async () => {
      await resetBaseline(page);
      await setupCarryStackScenario(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = window.__b4Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (state.butterflies || []).find(entry => entry.id === window.__b4Fixture?.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === window.__b4Fixture?.carryBlockId) || null;
        const profile = structureSystem.getZoneProfile?.(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        if (!butterfly || !carryBlock || !shelter?.openingProfile?.outerPoint) return null;

        objectSystem.pickupObject?.(carryBlock.id, butterfly.id);
        carryBlock.pickupBy?.(butterfly);
        butterfly.blockInteraction.carryingBlockId = carryBlock.id;
        butterfly.updateCarriedBlockPose?.(carryBlock);

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
        const zoneBlocks = (state.blocks || []).filter(entry => entry.currentZoneId === zoneId);
        const requestedValid = structureSystem.validatePlacementTargetForBlock?.(butterfly, carryBlock, invalidPlacement, zoneBlocks) || false;
        const resolvedPlacement = physicsSystem.resolveBlockPlacementRequest?.(
          butterfly,
          carryBlock,
          invalidPlacement,
          zoneBlocks,
          {
            sceneState: state,
            safeDrop: false
          }
        ) || null;
        const placed = resolvedPlacement
          ? physicsSystem.applyResolvedBlockPlacement?.(carryBlock, resolvedPlacement, butterfly.id, state)
          : false;
        structureSystem.update(state, 0);

        const finalPoint = { x: carryBlock.x, y: carryBlock.y };
        const stillConflicts = structureSystem.pointConflictsWithOpening?.(
          shelter,
          finalPoint,
          Math.max(carryBlock.renderWidth || 18, 18) * 0.92
        );

        return {
          requestedValid,
          resolvedPlacement,
          placed,
          finalPoint,
          stillConflicts
        };
      });

      return {
        pass:
          !!details?.resolvedPlacement &&
          details.requestedValid === false &&
          details.placed === true &&
          details.stillConflicts === false &&
          Math.hypot(
            (details.finalPoint?.x || 0) - (details.resolvedPlacement?.x || 0),
            (details.finalPoint?.y || 0) - (details.resolvedPlacement?.y || 0)
          ) < 0.001,
        details
      };
    });

    await phase(page, report, outputDir, '04-flower-conflict-relocates-before-placement', async () => {
      await resetBaseline(page);
      await setupCarryStackScenario(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = window.__b4Fixture?.zoneId || gameCore.getFocusedZoneId();
        const butterfly = (state.butterflies || []).find(entry => entry.id === window.__b4Fixture?.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === window.__b4Fixture?.carryBlockId) || null;
        if (!butterfly || !carryBlock) return null;

        objectSystem.pickupObject?.(carryBlock.id, butterfly.id);
        carryBlock.pickupBy?.(butterfly);
        butterfly.blockInteraction.carryingBlockId = carryBlock.id;
        butterfly.updateCarriedBlockPose?.(carryBlock);

        const zoneBlocks = (state.blocks || []).filter(entry => entry.currentZoneId === zoneId);
        const initialPlacement = physicsSystem.resolveBlockPlacementRequest?.(
          butterfly,
          carryBlock,
          null,
          zoneBlocks,
          {
            sceneState: state,
            safeDrop: false
          }
        ) || null;
        if (!initialPlacement) return null;

        const blockerFlower = gameCore.spawnFlowerAt(zoneId, initialPlacement.x, initialPlacement.y, {
          exactPoint: true,
          preferredPoint: { x: initialPlacement.x, y: initialPlacement.y },
          persistentUntilConsumed: true,
          resourceOrigin: 'audit'
        });
        if (!blockerFlower) return null;
        blockerFlower.stage = 'mature';
        blockerFlower.objectProfile.lifecycleStage = 'mature';

        objectSystem.update(state);
        structureSystem.update(state, 0);

        const before = {
          flowerId: blockerFlower.id,
          flowerX: blockerFlower.x,
          flowerY: blockerFlower.y,
          blockingFlowerIds: gameCore.getFlowersBlockingBlockPlacement(zoneId, initialPlacement, carryBlock).map(entry => entry.id)
        };

        const resolvedPlacement = physicsSystem.resolveBlockPlacementRequest?.(
          butterfly,
          carryBlock,
          initialPlacement,
          zoneBlocks,
          {
            sceneState: state,
            safeDrop: false
          }
        ) || null;
        const placed = resolvedPlacement
          ? physicsSystem.applyResolvedBlockPlacement?.(carryBlock, resolvedPlacement, butterfly.id, state)
          : false;

        structureSystem.update(state, 0);
        objectSystem.update(state);

        return {
          before,
          resolvedPlacement,
          placed,
          after: {
            flowerX: blockerFlower.x,
            flowerY: blockerFlower.y,
            blockX: carryBlock.x,
            blockY: carryBlock.y,
            flowerDistanceToBlock: Math.hypot((blockerFlower.x || 0) - (carryBlock.x || 0), (blockerFlower.y || 0) - (carryBlock.y || 0)),
            remainingBlockingFlowerIds: gameCore.getFlowersBlockingBlockPlacement(zoneId, { x: carryBlock.x, y: carryBlock.y }, carryBlock).map(entry => entry.id)
          }
        };
      });

      return {
        pass:
          !!details?.resolvedPlacement &&
          details.placed === true &&
          details.before?.blockingFlowerIds?.includes(details.before?.flowerId) &&
          Math.hypot(
            (details.after?.flowerX || 0) - (details.before?.flowerX || 0),
            (details.after?.flowerY || 0) - (details.before?.flowerY || 0)
          ) > 8 &&
          details.after?.flowerDistanceToBlock >= 20 &&
          !details.after?.remainingBlockingFlowerIds?.includes(details.before?.flowerId),
        details
      };
    });

    await phase(page, report, outputDir, '05-unsupported-stack-settles-to-ground', async () => {
      await resetBaseline(page);
      await setupCarryStackScenario(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = window.__b4Fixture?.zoneId || gameCore.getFocusedZoneId();
        const baseBlock = (state.blocks || []).find(entry => entry.id === window.__b4Fixture?.baseBlockId) || null;
        const topBlock = (state.blocks || []).find(entry => entry.id === window.__b4Fixture?.topBlockId) || null;
        if (!baseBlock || !topBlock) return null;

        const before = {
          x: topBlock.x,
          y: topBlock.y,
          stackIndex: topBlock.stackIndex,
          supportBlockId: topBlock.supportBlockId || null
        };

        baseBlock.placeAt?.(baseBlock.x + 94, baseBlock.y + 18, {
          movedById: 'audit',
          stackIndex: 0,
          supportBlockId: null,
          placementMode: 'ground',
          zoneId
        });

        structureSystem.update(state, 0);
        physicsSystem.update(state, 0);
        objectSystem.update(state);

        const blockPhysics = physicsSystem.getEntityState?.(topBlock.id) || null;
        const supportContext = physicsSystem.getBlockSupportContext?.(topBlock, state) || null;

        return {
          before,
          after: {
            x: topBlock.x,
            y: topBlock.y,
            stackIndex: topBlock.stackIndex,
            supportBlockId: topBlock.supportBlockId || null,
            lastPlacedMode: topBlock.lastPlacedMode || null,
            occupancyState: topBlock.objectProfile?.occupancyState || null
          },
          movedDistance: Math.hypot((topBlock.x || 0) - before.x, (topBlock.y || 0) - before.y),
          blockPhysics: blockPhysics ? {
            supportState: blockPhysics.diagnostics?.supportState || null,
            occupancyBand: blockPhysics.diagnostics?.occupancyBand || null
          } : null,
          supportContext
        };
      });

      return {
        pass:
          !!details &&
          details.before?.stackIndex === 1 &&
          details.after?.stackIndex === 0 &&
          details.after?.supportBlockId === null &&
          details.after?.occupancyState === 'grounded' &&
          details.movedDistance > 0.5 &&
          details.blockPhysics?.supportState === 'grounded' &&
          details.blockPhysics?.occupancyBand === 'ground' &&
          details.supportContext?.supportState === 'grounded',
        details
      };
    });

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
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
    if (report.overall === 'fail') process.exitCode = 2;
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
