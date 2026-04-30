const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'a4_spatial_truth_audit');
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

function getWorldRenderModeOverride() {
  const mode = process.env.PAPILIONEM_WORLD_RENDER_MODE;
  return ['section-scenes', 'sim-board'].includes(mode) ? mode : null;
}

async function applyRuntimeOverrides(context, flagOverrides, worldRenderMode) {
  if (!flagOverrides && !worldRenderMode) return;
  await context.addInitScript(({ overrides, renderMode }) => {
    if (overrides && typeof overrides === 'object') {
      window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = overrides;
    }
    if (renderMode) {
      window.__PAPILIONEM_WORLD_RENDERMODE__ = renderMode;
      window.localStorage.setItem('papilionem-world-rendermode', renderMode);
    }
  }, { overrides: flagOverrides, renderMode: worldRenderMode });
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
      return { ok: false, reason: 'missing-a4-save-load-fixture' };
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

      base.placeAt?.(point.x, point.y, {
        movedById: 'audit',
        stackIndex: 0,
        supportBlockId: null,
        placementMode: 'connected',
        zoneId
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
    carryBlock.placeAt?.(center.x - 82, center.y + 58, {
      movedById: 'audit',
      stackIndex: 0,
      supportBlockId: null,
      placementMode: 'ground',
      zoneId
    });

    const carryTarget = gameCore.clampScreenPointToRoamArea?.(
      center.x + 96,
      center.y - 18,
      8,
      { zoneId }
    ) || { x: center.x + 96, y: center.y - 18 };

    butterfly.x = center.x - 62;
    butterfly.y = center.y + 44;
    butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
    butterfly.currentZoneId = zoneId;
    butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
    butterfly.state = 'normal';
    butterfly.stateTimer = 0;
    if (butterfly.lifeSim?.emotions) {
      butterfly.lifeSim.emotions.exhaustion = 0.08;
    }
    if (butterfly.lifeSim?.drives) {
      butterfly.lifeSim.drives.rest = 0.02;
    }
    sleepSystem.wakeEntity?.(butterfly.id, 'audit-a4-fixture');
    sleepSystem.setExhaustion?.(butterfly.id, 0.08);
    butterfly.blockInteraction.carryingBlockId = null;
    butterfly.blockInteraction.targetBlockId = null;
    butterfly.blockInteraction.placementTarget = null;
    butterfly.blockInteraction.carryFrames = 0;

    objectSystem.update(state);
    structureSystem.update(state, 0);
    physicsSystem.update(state, 0);

    window.__a4SpatialFixture = {
      zoneId,
      butterflyId: butterfly.id,
      carryBlockId: carryBlock.id,
      baseBlockId: fixtureBlocks[0]?.id || null,
      topBlockId: fixtureBlocks[1]?.id || null,
      carryTarget
    };

    return {
      ok: true,
      zoneId,
      butterflyId: butterfly.id,
      carryBlockId: carryBlock.id,
      baseBlockId: fixtureBlocks[0]?.id || null,
      topBlockId: fixtureBlocks[1]?.id || null,
      carryTarget
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
  const flagOverrides = getFlagOverrides();
  const worldRenderMode = getWorldRenderModeOverride();
  report.worldRenderModeOverride = worldRenderMode;

  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    await applyRuntimeOverrides(context, flagOverrides, worldRenderMode);
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

    await phase(page, report, outputDir, '01-shared-focused-garden-region', async () => {
      const details = await page.evaluate(() => {
        const zoneIds = gameCore.getZoneIds();
        const placementRegions = Object.fromEntries(zoneIds.map(zoneId => [zoneId, gridManager.getZonePlacementRegion(zoneId)]));
        const screenRegions = Object.fromEntries(zoneIds.map(zoneId => [zoneId, gridManager.getZoneScreenRegion(zoneId)]));
        const placementSignatures = Array.from(new Set(Object.values(placementRegions).map(region => JSON.stringify(region))));
        const screenSignatures = Array.from(new Set(Object.values(screenRegions).map(region => JSON.stringify(region))));
        return {
          renderMode: gameConfig?.world?.renderMode || null,
          usesSharedSectionPlacementRegion: gridManager.isUsingSharedSectionPlacementRegion?.() || false,
          zoneIds,
          placementRegions,
          screenRegions,
          placementSignatures,
          screenSignatures
        };
      });

      const expectedRenderMode = worldRenderMode || 'sim-board';
      return {
        pass:
          details.renderMode === expectedRenderMode &&
          details.usesSharedSectionPlacementRegion === true &&
          Array.isArray(details.placementSignatures) &&
          details.placementSignatures.length === 1 &&
          Array.isArray(details.screenSignatures) &&
          details.screenSignatures.length >= 2,
        details
      };
    });

    await phase(page, report, outputDir, '02-random-zone-points-stay-in-roam', async () => {
      const details = await page.evaluate(() => {
        const zoneIds = gameCore.getZoneIds();
        const samples = [];
        const failures = [];
        const edgeInset = gameCore.getPlacementEdgeInset?.() || 22;
        for (const zoneId of zoneIds) {
          for (let index = 0; index < 16; index += 1) {
            const point = gridManager.getRandomPointInZone(zoneId, 28, 40, { edgeInset });
            const inside = point ? gridManager.isPointInFreeRoamArea(point) : false;
            samples.push({ zoneId, point, inside });
            if (!inside) {
              failures.push({ zoneId, point });
            }
          }
        }
        return {
          sampleCount: samples.length,
          failures,
          samplePreview: samples.slice(0, 8)
        };
      });

      return {
        pass:
          details.sampleCount >= 32 &&
          Array.isArray(details.failures) &&
          details.failures.length === 0,
        details
      };
    });

    await phase(page, report, outputDir, '03-physics-and-structure-owners-live', async () => {
      const details = await page.evaluate(() => {
        structureSystem.update(gameCore.gameState);
        const focusedZoneId = gameCore.getFocusedZoneId();
        const butterfly = (gameCore.gameState.butterflies || [])[0] || null;
        const physics = butterfly ? (physicsSystem.getEntityState?.(butterfly.id) || butterfly.physics || null) : null;
        const spatialContext = butterfly
          ? structureSystem.getSpatialContextForEntity?.(butterfly, gameCore.gameState) || null
          : null;
        const zoneProfile = focusedZoneId ? structureSystem.getZoneProfileRef?.(focusedZoneId) || null : null;
        const zoneGeometry = focusedZoneId ? structureSystem.getZoneCollisionGeometryRef?.(focusedZoneId) || null : null;
        const spatialSemantics = structureSystem.getSpatialSemanticsRef?.() || null;
        const structureQuery = butterfly
          ? physicsSystem.getStructureQueryForEntity?.(butterfly) || null
          : null;
        return {
          physicsInitialized: !!physicsSystem?.initialized,
          structureInitialized: !!structureSystem?.initialized,
          budgetTargets: physicsSystem?.getBudgetTargets?.() || null,
          butterflyId: butterfly?.id || null,
          physicsShape: physics ? {
            entityType: physics.entityType || null,
            hasPosition: !!physics.position,
            hasBody: !!physics.body,
            hasContact: !!physics.contact,
            hasImpulse: !!physics.impulse,
            hasCarry: !!physics.carry,
            motionOwner: physics.diagnostics?.motionOwner || null,
            liftBand: physics.body?.liftBand || null,
            occupancyBand: physics.diagnostics?.occupancyBand || null
          } : null,
          spatialContext,
          zoneProfile: zoneProfile ? {
            zoneId: zoneProfile.zoneId,
            blockCount: zoneProfile.blockCount,
            componentCount: zoneProfile.componentCount,
            shelterCount: zoneProfile.shelterCount
          } : null,
          zoneGeometry: zoneGeometry ? {
            version: zoneGeometry.version || null,
            zoneId: zoneGeometry.zoneId || null,
            componentCount: zoneGeometry.componentCount || 0,
            openingCount: zoneGeometry.openingCount || 0,
            roofCount: zoneGeometry.roofCount || 0,
            wallNormalCount: zoneGeometry.wallNormalCount || 0,
            occupancyColumnCount: zoneGeometry.occupancyColumnCount || 0
          } : null,
          spatialSemantics: spatialSemantics ? {
            version: spatialSemantics.version || null,
            sharedHooks: spatialSemantics.sharedHooks || [],
            occupancyBands: spatialSemantics.occupancyBands || [],
            verticality: spatialSemantics.verticality || [],
            structureRole: spatialSemantics.structureRole || [],
            pathState: spatialSemantics.pathState || [],
            bodyFit: spatialSemantics.bodyFit || [],
            defaultOccupancyBand: spatialSemantics.defaultOccupancyBand || null
          } : null,
          structureQuery: structureQuery ? {
            version: structureQuery.version || null,
            nearestComponentId: structureQuery.nearestComponentId || null,
            relevantShelterId: structureQuery.relevantShelterId || null,
            wallSide: structureQuery.wallNormal?.side || null,
            nearbyOccupancyCount: structureQuery.nearbyOccupancyColumns?.length || 0
          } : null
        };
      });

      return {
        pass:
          details.physicsInitialized === true &&
          details.structureInitialized === true &&
          !!details.butterflyId &&
          details.physicsShape?.entityType === 'butterfly' &&
          details.physicsShape?.hasPosition === true &&
          details.physicsShape?.hasBody === true &&
          details.physicsShape?.hasContact === true &&
          details.physicsShape?.hasImpulse === true &&
          details.physicsShape?.hasCarry === true &&
          details.physicsShape?.motionOwner === 'physicsSystem' &&
          !!details.physicsShape?.liftBand &&
          details.physicsShape?.liftBand === details.physicsShape?.occupancyBand &&
          !!details.spatialContext?.pathState &&
          !!details.spatialContext?.verticality &&
          !!details.spatialContext?.structureRole &&
          !!details.zoneProfile?.zoneId &&
          !!details.zoneGeometry?.zoneId &&
          details.zoneGeometry?.version === 'b2' &&
          details.zoneGeometry?.componentCount === details.zoneProfile?.componentCount &&
          details.zoneGeometry?.roofCount >= details.zoneGeometry?.componentCount &&
          details.zoneGeometry?.wallNormalCount >= details.zoneGeometry?.componentCount * 2 &&
          details.zoneGeometry?.occupancyColumnCount > 0 &&
          details.spatialSemantics?.version === 'b3-occupancy-semantics-v1' &&
          Array.isArray(details.spatialSemantics?.sharedHooks) &&
          details.spatialSemantics?.sharedHooks.includes('verticality') &&
          details.spatialSemantics?.sharedHooks.includes('structureRole') &&
          details.spatialSemantics?.sharedHooks.includes('pathState') &&
          details.spatialSemantics?.sharedHooks.includes('bodyFit') &&
          Array.isArray(details.spatialSemantics?.occupancyBands) &&
          details.spatialSemantics?.occupancyBands.includes(details.physicsShape?.liftBand) &&
          details.spatialSemantics?.verticality.includes(details.spatialContext?.verticality) &&
          details.spatialSemantics?.structureRole.includes(details.spatialContext?.structureRole) &&
          details.spatialSemantics?.pathState.includes(details.spatialContext?.pathState) &&
          details.spatialSemantics?.bodyFit.includes(details.spatialContext?.bodyFit) &&
          details.structureQuery?.version === 'b2' &&
          !!details.structureQuery?.nearestComponentId &&
          details.structureQuery?.nearbyOccupancyCount >= 0 &&
          !!details.budgetTargets?.focusedGardenPhysicsMs,
        details
      };
    });

    await phase(page, report, outputDir, '04-physics-budget-seam-live', async () => {
      await page.waitForTimeout(2200);

      const details = await page.evaluate(() => {
        const telemetry = telemetrySystem?.getSnapshot?.() || null;
        const physics = physicsSystem?.getSnapshot?.() || null;
        const budget = physicsSystem?.getBudgetTargets?.() || null;
        return {
          budget,
          telemetryAverages: telemetry?.averages || null,
          physicsSummary: physics?.lastUpdateSummary || null
        };
      });

      const avgUpdateMs = details.telemetryAverages?.updateMs || 0;
      const avgPhysicsMs = details.telemetryAverages?.physicsMs || 0;
      const updateBudget = details.budget?.focusedGardenTotalUpdateMs || 0;
      const physicsBudget = details.budget?.focusedGardenPhysicsMs || 0;

      return {
        pass:
          !!details.budget &&
          !!details.telemetryAverages &&
          Number.isFinite(avgUpdateMs) &&
          Number.isFinite(avgPhysicsMs) &&
          avgUpdateMs <= updateBudget &&
          avgPhysicsMs <= physicsBudget,
        details: {
          ...details,
          avgUpdateMs,
          avgPhysicsMs,
          updateBudget,
          physicsBudget
        }
      };
    });

    await phase(page, report, outputDir, '05-save-load-rebuilds-spatial-truth', async () => {
      await resetBaseline(page);
      const fixture = await setupCarryStackScenario(page);
      if (!fixture?.ok) {
        return { pass: false, details: fixture };
      }

      const details = await page.evaluate(() => {
        const fixtureState = window.__a4SpatialFixture || {};
        const sanitizeSummary = summary => summary ? {
          id: summary.id || null,
          entityType: summary.entityType || null,
          zoneId: summary.zoneId || null,
          occupancyBand: summary.occupancyBand || null,
          structureRole: summary.structureRole || null,
          pathState: summary.pathState || null,
          bodyFit: summary.bodyFit || null,
          supportState: summary.supportState || null,
          stackHeight: summary.stackHeight || 0,
          supportBlockId: summary.supportBlockId || null,
          contactStateLabel: summary.contact?.contactStateLabel || null,
          blocked: !!summary.contact?.blocked,
          carryAttachedObjectId: summary.carry?.attachedObjectId || null,
          hasCarryAnchor: !!summary.carry?.anchor,
          headline: summary.headline || null,
          detail: summary.detail || null
        } : null;

        const state = gameCore.getGameState();
        const butterfly = (state.butterflies || []).find(entry => entry.id === fixtureState.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === fixtureState.carryBlockId) || null;
        const topBlock = (state.blocks || []).find(entry => entry.id === fixtureState.topBlockId) || null;
        if (!butterfly || !carryBlock || !topBlock) {
          return { ok: false, reason: 'missing-a4-save-load-entities' };
        }

        objectSystem.pickupObject?.(carryBlock.id, butterfly.id);
        carryBlock.pickupBy?.(butterfly);
        butterfly.blockInteraction.carryingBlockId = carryBlock.id;
        butterfly.blockInteraction.placementTarget = fixtureState.carryTarget
          ? {
            x: fixtureState.carryTarget.x,
            y: fixtureState.carryTarget.y,
            zoneId: fixtureState.zoneId || butterfly.currentZoneId || null,
            placementMode: 'ground',
            stackIndex: 0,
            supportBlockId: null
          }
          : null;
        butterfly.blockInteraction.lastPlacementMode = 'ground';
        butterfly.blockInteraction.carryFrames = 24;
        butterfly.updateCarriedBlockPose?.(carryBlock);
        objectSystem.update(state);
        structureSystem.update(state, 0);
        physicsSystem.update(state, 0);

        const serialized = gameCore.serializeGameState();
        const savedCarryBlock = (serialized.blocks || []).find(entry => entry.id === carryBlock.id) || null;
        const savedTopBlock = (serialized.blocks || []).find(entry => entry.id === topBlock.id) || null;
        const savedButterfly = (serialized.butterflies || []).find(entry => entry.id === butterfly.id) || null;
        const restored = gameCore.applySerializedState?.(JSON.parse(JSON.stringify(serialized)));
        const restoredState = gameCore.getGameState();
        const restoredButterfly = (restoredState.butterflies || []).find(entry => entry.id === fixtureState.butterflyId) || null;
        const restoredCarryBlock = (restoredState.blocks || []).find(entry => entry.id === fixtureState.carryBlockId) || null;
        const restoredTopBlock = (restoredState.blocks || []).find(entry => entry.id === fixtureState.topBlockId) || null;
        const carrierIds = restoredButterfly ? (objectSystem.getObjectsByCarrier?.(restoredButterfly.id) || []) : [];
        const structureContext = restoredButterfly
          ? structureSystem.getSpatialContextForEntity?.(restoredButterfly, restoredState) || null
          : null;
        const focusSnapshot = debugUI?.buildSpatialFocusSnapshot?.(restoredState) || null;

        return {
          ok: !!restored && !!restoredButterfly && !!restoredCarryBlock && !!restoredTopBlock,
          savedPhysicsFoundation: Object.prototype.hasOwnProperty.call(serialized.foundations || {}, 'physics'),
          savedButterflyHasPhysics: !!savedButterfly?.physics,
          savedCarryBlock: savedCarryBlock ? {
            carriedById: savedCarryBlock.carriedById || null,
            stackIndex: savedCarryBlock.stackIndex ?? null,
            supportBlockId: savedCarryBlock.supportBlockId || null
          } : null,
          savedTopBlock: savedTopBlock ? {
            carriedById: savedTopBlock.carriedById || null,
            stackIndex: savedTopBlock.stackIndex ?? null,
            supportBlockId: savedTopBlock.supportBlockId || null
          } : null,
          carrierIds,
          butterflySummary: sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(restoredButterfly, restoredState) || null),
          carryBlockSummary: sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(restoredCarryBlock, restoredState) || null),
          topBlockSummary: sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(restoredTopBlock, restoredState) || null),
          structureContext: structureContext ? {
            zoneId: structureContext.zoneId || null,
            occupancyBand: structureContext.occupancyBand || null,
            verticality: structureContext.verticality || null,
            structureRole: structureContext.structureRole || null,
            pathState: structureContext.pathState || null,
            bodyFit: structureContext.bodyFit || null,
            insideShelter: !!structureContext.insideShelter
          } : null,
          focusSnapshot
        };
      });

      return {
        pass:
          !!details.ok &&
          details.savedPhysicsFoundation === false &&
          details.savedButterflyHasPhysics === false &&
          details.savedCarryBlock?.carriedById === fixture.butterflyId &&
          details.savedTopBlock?.stackIndex === 1 &&
          details.savedTopBlock?.supportBlockId === fixture.baseBlockId &&
          Array.isArray(details.carrierIds) &&
          details.carrierIds.includes(fixture.carryBlockId) &&
          details.butterflySummary?.carryAttachedObjectId === fixture.carryBlockId &&
          details.carryBlockSummary?.supportState === 'carried' &&
          details.carryBlockSummary?.carryAttachedObjectId === fixture.butterflyId &&
          details.carryBlockSummary?.hasCarryAnchor === true &&
          details.topBlockSummary?.supportState === 'supported' &&
          details.topBlockSummary?.supportBlockId === fixture.baseBlockId &&
          !!details.structureContext?.pathState &&
          !!details.structureContext?.bodyFit &&
          Array.isArray(details.focusSnapshot?.lines) &&
          details.focusSnapshot.lines.length >= 3,
        details
      };
    });

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
