const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'b7_spatial_soak_audit');
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
      return { ok: false, reason: 'missing-b7-fixture' };
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
    sleepSystem.wakeEntity?.(butterfly.id, 'audit-b7-fixture');
    sleepSystem.setExhaustion?.(butterfly.id, 0.08);
    butterfly.blockInteraction.carryingBlockId = null;
    butterfly.blockInteraction.targetBlockId = null;
    butterfly.blockInteraction.placementTarget = null;
    butterfly.blockInteraction.carryFrames = 0;

    objectSystem.update(state);
    structureSystem.update(state, 0);
    physicsSystem.update(state, 0);

    window.__b7SpatialFixture = {
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
    await resetBaseline(page);

    await phase(page, report, outputDir, '01-save-payload-stays-durable-only', async () => {
      const fixture = await setupCarryStackScenario(page);
      if (!fixture?.ok) {
        return { pass: false, details: fixture };
      }

      const details = await page.evaluate(() => {
        const fixtureState = window.__b7SpatialFixture || {};
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
          blocked: !!summary.contact?.blocked,
          contactStateLabel: summary.contact?.contactStateLabel || null,
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
          return { ok: false, reason: 'missing-b7-payload-entities' };
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
        const objectState = objectSystem.getObjectState?.(carryBlock.id) || null;
        const focusSnapshot = debugUI?.buildSpatialFocusSnapshot?.(state) || null;

        return {
          ok: true,
          savedPhysicsFoundation: Object.prototype.hasOwnProperty.call(serialized.foundations || {}, 'physics'),
          physicsDurableState: physicsSystem.serializeDurableState?.() ?? null,
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
          objectState: objectState ? {
            carriedById: objectState.carriedById || null,
            delivered: !!objectState.delivered
          } : null,
          butterflySummary: sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(butterfly, state) || null),
          carryBlockSummary: sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(carryBlock, state) || null),
          topBlockSummary: sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(topBlock, state) || null),
          focusSnapshot
        };
      });

      return {
        pass:
          !!details.ok &&
          details.savedPhysicsFoundation === false &&
          details.physicsDurableState === null &&
          details.savedButterflyHasPhysics === false &&
          details.savedCarryBlock?.carriedById === fixture.butterflyId &&
          details.savedTopBlock?.stackIndex === 1 &&
          details.savedTopBlock?.supportBlockId === fixture.baseBlockId &&
          details.objectState?.carriedById === fixture.butterflyId &&
          details.carryBlockSummary?.supportState === 'carried' &&
          details.carryBlockSummary?.carryAttachedObjectId === fixture.butterflyId &&
          details.carryBlockSummary?.hasCarryAnchor === true &&
          details.topBlockSummary?.supportState === 'supported' &&
          Array.isArray(details.focusSnapshot?.lines) &&
          details.focusSnapshot.lines.length >= 3,
        details
      };
    });

    await phase(page, report, outputDir, '02-save-load-rebuild-restores-spatial-truth', async () => {
      const details = await page.evaluate(() => {
        const fixtureState = window.__b7SpatialFixture || {};
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
          blocked: !!summary.contact?.blocked,
          contactStateLabel: summary.contact?.contactStateLabel || null,
          carryAttachedObjectId: summary.carry?.attachedObjectId || null,
          hasCarryAnchor: !!summary.carry?.anchor,
          headline: summary.headline || null,
          detail: summary.detail || null
        } : null;

        const preSaveState = gameCore.getGameState();
        const preSaveButterfly = (preSaveState.butterflies || []).find(entry => entry.id === fixtureState.butterflyId) || null;
        const preSaveCarryBlock = (preSaveState.blocks || []).find(entry => entry.id === fixtureState.carryBlockId) || null;
        if (preSaveButterfly && preSaveCarryBlock) {
          objectSystem.pickupObject?.(preSaveCarryBlock.id, preSaveButterfly.id);
          preSaveCarryBlock.pickupBy?.(preSaveButterfly);
          preSaveButterfly.blockInteraction.carryingBlockId = preSaveCarryBlock.id;
          preSaveButterfly.blockInteraction.placementTarget = fixtureState.carryTarget
            ? {
              x: fixtureState.carryTarget.x,
              y: fixtureState.carryTarget.y,
              zoneId: fixtureState.zoneId || preSaveButterfly.currentZoneId || null,
              placementMode: 'ground',
              stackIndex: 0,
              supportBlockId: null
            }
            : null;
          preSaveButterfly.blockInteraction.lastPlacementMode = 'ground';
          preSaveButterfly.blockInteraction.carryFrames = 24;
          preSaveButterfly.updateCarriedBlockPose?.(preSaveCarryBlock);
          objectSystem.update(preSaveState);
          structureSystem.update(preSaveState, 0);
          physicsSystem.update(preSaveState, 0);
        }

        const saved = gameCore.saveGameToStorage?.({ source: 'audit' }) || null;
        const restored = gameCore.loadGameFromStorage?.();
        const state = gameCore.getGameState();
        const butterfly = (state.butterflies || []).find(entry => entry.id === fixtureState.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === fixtureState.carryBlockId) || null;
        const topBlock = (state.blocks || []).find(entry => entry.id === fixtureState.topBlockId) || null;
        const carrierIds = butterfly ? (objectSystem.getObjectsByCarrier?.(butterfly.id) || []) : [];
        const structureContext = butterfly
          ? structureSystem.getSpatialContextForEntity?.(butterfly, state) || null
          : null;
        const zoneGeometry = fixtureState.zoneId
          ? structureSystem.getZoneCollisionGeometryRef?.(fixtureState.zoneId) || null
          : null;
        const spatialSemantics = structureSystem.getSpatialSemanticsRef?.() || null;
        const focusSnapshot = debugUI?.buildSpatialFocusSnapshot?.(state) || null;

        return {
          ok: !!saved && !!restored && !!butterfly && !!carryBlock && !!topBlock,
          savedPhysicsFoundation: Object.prototype.hasOwnProperty.call(saved?.foundations || {}, 'physics'),
          carrierIds,
          butterflySummary: sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(butterfly, state) || null),
          carryBlockSummary: sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(carryBlock, state) || null),
          topBlockSummary: sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(topBlock, state) || null),
          structureContext: structureContext ? {
            zoneId: structureContext.zoneId || null,
            occupancyBand: structureContext.occupancyBand || null,
            verticality: structureContext.verticality || null,
            structureRole: structureContext.structureRole || null,
            pathState: structureContext.pathState || null,
            bodyFit: structureContext.bodyFit || null,
            insideShelter: !!structureContext.insideShelter
          } : null,
          zoneGeometry: zoneGeometry ? {
            version: zoneGeometry.version || null,
            componentCount: zoneGeometry.componentCount || 0,
            occupancyColumnCount: zoneGeometry.occupancyColumnCount || 0
          } : null,
          spatialSemantics: spatialSemantics ? {
            version: spatialSemantics.version || null,
            occupancyBands: spatialSemantics.occupancyBands || []
          } : null,
          focusSnapshot
        };
      });

      return {
        pass:
          !!details.ok &&
          details.savedPhysicsFoundation === false &&
          Array.isArray(details.carrierIds) &&
          details.carrierIds.includes(details.carryBlockSummary?.id) &&
          details.butterflySummary?.carryAttachedObjectId === details.carryBlockSummary?.id &&
          details.carryBlockSummary?.supportState === 'carried' &&
          details.carryBlockSummary?.carryAttachedObjectId === details.butterflySummary?.id &&
          details.carryBlockSummary?.hasCarryAnchor === true &&
          details.topBlockSummary?.supportState === 'supported' &&
          !!details.structureContext?.pathState &&
          !!details.structureContext?.bodyFit &&
          details.zoneGeometry?.version === 'b2' &&
          details.zoneGeometry?.occupancyColumnCount > 0 &&
          details.spatialSemantics?.version === 'b3-occupancy-semantics-v1' &&
          details.spatialSemantics?.occupancyBands?.includes(details.butterflySummary?.occupancyBand) &&
          Array.isArray(details.focusSnapshot?.lines) &&
          details.focusSnapshot.lines.length >= 3,
        details
      };
    });

    await phase(page, report, outputDir, '03-post-load-motion-keeps-carry-and-stack-coherent', async () => {
      const setup = await page.evaluate(() => {
        const fixtureState = window.__b7SpatialFixture || {};
        const state = gameCore.getGameState();
        const butterfly = (state.butterflies || []).find(entry => entry.id === fixtureState.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === fixtureState.carryBlockId) || null;
        if (!butterfly || !carryBlock) {
          return { ok: false, reason: 'missing-b7-motion-fixture' };
        }

        const summary = physicsSystem.getEntitySpatialSummary?.(butterfly, state) || null;
        physicsSystem.applyImpulse?.(butterfly, {
          x: 22,
          y: -6,
          frames: 5,
          source: 'b7-audit'
        });

        return {
          ok: true,
          butterflyId: butterfly.id,
          carryBlockId: carryBlock.id,
          beforeGroundPoint: summary?.groundPoint || { x: butterfly.x || 0, y: butterfly.y || 0 }
        };
      });

      if (!setup?.ok) {
        return { pass: false, details: setup };
      }

      await page.waitForTimeout(1600);

      const details = await page.evaluate((setupState) => {
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
          blocked: !!summary.contact?.blocked,
          contactStateLabel: summary.contact?.contactStateLabel || null,
          carryAttachedObjectId: summary.carry?.attachedObjectId || null,
          hasCarryAnchor: !!summary.carry?.anchor,
          groundPoint: summary.groundPoint || null,
          headline: summary.headline || null,
          detail: summary.detail || null
        } : null;

        const state = gameCore.getGameState();
        const butterfly = (state.butterflies || []).find(entry => entry.id === setupState.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === setupState.carryBlockId) || null;
        const butterflySummary = sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(butterfly, state) || null);
        const carryBlockSummary = sanitizeSummary(physicsSystem.getEntitySpatialSummary?.(carryBlock, state) || null);
        const objectState = objectSystem.getObjectState?.(setupState.carryBlockId) || null;
        const unsupportedBlocks = (state.blocks || [])
          .map(block => physicsSystem.getEntitySpatialSummary?.(block, state) || null)
          .filter(summary => summary?.entityType === 'block' && summary?.supportState === 'unsupported')
          .map(summary => summary.id);
        const telemetry = telemetrySystem?.getSnapshot?.() || null;
        const physics = physicsSystem?.getSnapshot?.() || null;
        const movedDistance = butterflySummary?.groundPoint
          ? Math.hypot(
            (butterflySummary.groundPoint.x || 0) - (setupState.beforeGroundPoint?.x || 0),
            (butterflySummary.groundPoint.y || 0) - (setupState.beforeGroundPoint?.y || 0)
          )
          : 0;
        const focusSnapshot = debugUI?.buildSpatialFocusSnapshot?.(state) || null;

        return {
          movedDistance,
          butterflySummary,
          carryBlockSummary,
          objectState: objectState ? {
            carriedById: objectState.carriedById || null,
            delivered: !!objectState.delivered
          } : null,
          unsupportedBlocks,
          telemetryAverages: telemetry?.averages || null,
          physicsSummary: physics?.lastUpdateSummary || null,
          focusSnapshot
        };
      }, setup);

      const avgUpdateMs = details.telemetryAverages?.updateMs || 0;
      const avgPhysicsMs = details.telemetryAverages?.physicsMs || 0;
      const physicsBudget = details.physicsSummary?.frameBudgetMs || 2.5;
      const updateBudget = 16;

      return {
        pass:
          details.movedDistance >= 4 &&
          details.butterflySummary?.carryAttachedObjectId === setup.carryBlockId &&
          details.carryBlockSummary?.supportState === 'carried' &&
          details.carryBlockSummary?.carryAttachedObjectId === setup.butterflyId &&
          details.carryBlockSummary?.hasCarryAnchor === true &&
          details.objectState?.carriedById === setup.butterflyId &&
          Array.isArray(details.unsupportedBlocks) &&
          details.unsupportedBlocks.length === 0 &&
          Array.isArray(details.focusSnapshot?.lines) &&
          details.focusSnapshot.lines.length >= 3,
        details: {
          ...details,
          avgPhysicsMs,
          avgUpdateMs,
          physicsBudget,
          updateBudget
        }
      };
    });

    await phase(page, report, outputDir, '04-short-spatial-soak-remains-stable', async () => {
      await page.waitForTimeout(5200);

      const details = await page.evaluate(() => {
        const fixtureState = window.__b7SpatialFixture || {};
        const state = gameCore.getGameState();
        const butterfliesById = new Map((state.butterflies || []).map(entry => [entry.id, entry]));
        const carriedBlocks = (state.blocks || []).filter(block => !!block?.carriedById);
        const orphanCarriedBlocks = carriedBlocks
          .filter(block => !butterfliesById.has(block.carriedById))
          .map(block => block.id);
        const malformedStacks = (state.blocks || [])
          .filter(block => (block.stackIndex || 0) > 0 && !block.supportBlockId)
          .map(block => block.id);
        const unsupportedBlocks = (state.blocks || [])
          .map(block => physicsSystem.getEntitySpatialSummary?.(block, state) || null)
          .filter(summary => summary?.entityType === 'block' && summary?.supportState === 'unsupported')
          .map(summary => summary.id);
        const butterfly = butterfliesById.get(fixtureState.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === fixtureState.carryBlockId) || null;
        const butterflySummary = butterfly ? physicsSystem.getEntitySpatialSummary?.(butterfly, state) || null : null;
        const carryBlockSummary = carryBlock ? physicsSystem.getEntitySpatialSummary?.(carryBlock, state) || null : null;
        const telemetry = telemetrySystem?.getSnapshot?.() || null;
        const physics = physicsSystem?.getSnapshot?.() || null;
        const focusSnapshot = debugUI?.buildSpatialFocusSnapshot?.(state) || null;

        return {
          orphanCarriedBlocks,
          malformedStacks,
          unsupportedBlocks,
          butterflySummary: butterflySummary ? {
            id: butterflySummary.id || null,
            carryAttachedObjectId: butterflySummary.carry?.attachedObjectId || null,
            occupancyBand: butterflySummary.occupancyBand || null,
            headline: butterflySummary.headline || null
          } : null,
          carryBlockSummary: carryBlockSummary ? {
            id: carryBlockSummary.id || null,
            supportState: carryBlockSummary.supportState || null,
            carryAttachedObjectId: carryBlockSummary.carry?.attachedObjectId || null,
            hasCarryAnchor: !!carryBlockSummary.carry?.anchor,
            occupancyBand: carryBlockSummary.occupancyBand || null,
            detail: carryBlockSummary.detail || null
          } : null,
          telemetryAverages: telemetry?.averages || null,
          physicsSummary: physics?.lastUpdateSummary || null,
          focusSnapshot
        };
      });

      const avgUpdateMs = details.telemetryAverages?.updateMs || 0;
      const avgPhysicsMs = details.telemetryAverages?.physicsMs || 0;
      const physicsBudget = details.physicsSummary?.frameBudgetMs || 2.5;
      const updateBudget = 16;

      return {
        pass:
          Array.isArray(details.orphanCarriedBlocks) &&
          details.orphanCarriedBlocks.length === 0 &&
          Array.isArray(details.malformedStacks) &&
          details.malformedStacks.length === 0 &&
          Array.isArray(details.unsupportedBlocks) &&
          details.unsupportedBlocks.length === 0 &&
          !!details.butterflySummary?.carryAttachedObjectId &&
          details.carryBlockSummary?.supportState === 'carried' &&
          details.carryBlockSummary?.hasCarryAnchor === true &&
          Array.isArray(details.focusSnapshot?.lines) &&
          details.focusSnapshot.lines.length >= 3,
        details: {
          ...details,
          avgPhysicsMs,
          avgUpdateMs,
          physicsBudget,
          updateBudget
        }
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
