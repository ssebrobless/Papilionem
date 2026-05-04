const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r2_zone_transition_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];

function getWorldRenderModeOverride() {
  const mode = process.env.PAPILIONEM_WORLD_RENDER_MODE;
  return ['section-scenes', 'sim-board'].includes(mode) ? mode : null;
}

async function applyRuntimeOverrides(context, worldRenderMode) {
  if (!worldRenderMode) return;
  await context.addInitScript((renderMode) => {
    window.__PAPILIONEM_WORLD_RENDERMODE__ = renderMode;
    window.localStorage.setItem('papilionem-world-rendermode', renderMode);
  }, worldRenderMode);
}

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

async function resetBaseline(page, worldRenderMode = null) {
  await page.evaluate(({ keys, renderMode }) => {
    keys.forEach(key => window.localStorage.removeItem(key));
    if (renderMode) {
      window.__PAPILIONEM_WORLD_RENDERMODE__ = renderMode;
      window.localStorage.setItem('papilionem-world-rendermode', renderMode);
    }
  }, { keys: STORAGE_KEYS, renderMode: worldRenderMode });
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
    worldRenderModeOverride: getWorldRenderModeOverride(),
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
    await applyRuntimeOverrides(context, report.worldRenderModeOverride);
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
    await resetBaseline(page, report.worldRenderModeOverride);

    await page.evaluate(() => {
      const zones = gameCore.getZoneIds?.() || [];
      if (!zones.length) return;
      const butterflies = gameCore.gameState.butterflies || [];
      const flowers = gameCore.gameState.flowers || [];
      const blocks = gameCore.gameState.blocks || [];

      butterflies.forEach((butterfly, index) => {
        const zoneId = zones[index % zones.length];
        const point = gameCore.getRandomZonePoint(zoneId, 42) || gameCore.getZoneCenter(zoneId);
        if (!point) return;
        gameCore.assignEntityToZone(butterfly, zoneId);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.zoneTravel = null;
        butterfly.x = point.x;
        butterfly.y = point.y - (butterfly.shadowOffset || 0);
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
        butterfly.updateZIndex?.();
      });

      flowers.forEach((flower, index) => {
        const zoneId = zones[index % zones.length];
        gameCore.assignEntityToZone(flower, zoneId);
      });

      blocks.forEach((block, index) => {
        const zoneId = zones[index % zones.length];
        gameCore.assignEntityToZone(block, zoneId);
      });
    });

    await phase(page, report, outputDir, '01-repeated-zone-focus-commit', async () => {
      const details = await page.evaluate(async () => {
        const zones = gameCore.getZoneIds?.() || [];
        const snapshots = [];
        if (zones.length < 2) {
          return { ok: false, reason: 'not-enough-zones' };
        }

        const waitFrames = async (count = 3) => {
          for (let index = 0; index < count; index += 1) {
            await new Promise(resolve => requestAnimationFrame(() => resolve()));
          }
        };

        for (let passIndex = 0; passIndex < 2; passIndex += 1) {
          for (const zoneId of zones) {
            gameCore.focusZone(zoneId);
            await waitFrames(4);

            const state = gameCore.getGameState();
            const visible = gameCore.getFocusedSceneEntities();
            const sortedIds = (renderManager.sortedEntities || []).map(entity => entity?.id || 'unknown');
            const visibleIds = [
              ...(visible.blocks || []).map(entity => entity.id),
              ...(visible.flowers || []).map(entity => entity.id),
              ...(visible.caterpillars || []).map(entity => entity.id),
              ...(visible.butterflies || []).map(entity => entity.id)
            ];
            const invalidSortedIds = sortedIds.filter(id => !visibleIds.includes(id));

            snapshots.push({
              renderMode: gameConfig.world.renderMode,
              zoneId,
              gameCoreFocusedZoneId: state.focusedZoneId || null,
              zoneSystemFocusedZoneId: zoneSystem.focusedZoneId || null,
              renderFocusedZoneId: renderManager.viewState?.focusedZoneId || null,
              renderViewMode: renderManager.viewState?.mode || null,
              activeWorldSectionId: renderManager.activeWorldSectionId || null,
              visibleCount: visibleIds.length,
              sortedCount: sortedIds.length,
              invalidSortedIds,
              visibleSignature: renderManager.lastVisibleEntitySignature || null
            });
          }
        }

        return {
          ok: true,
          zones,
          snapshots
        };
      });

      const snapshots = details.snapshots || [];
      const allPass = details.ok && snapshots.every(entry =>
        entry.zoneId === entry.gameCoreFocusedZoneId
        && entry.zoneId === entry.zoneSystemFocusedZoneId
        && entry.zoneId === entry.renderFocusedZoneId
        && entry.renderViewMode === 'focused-garden'
        && (entry.renderMode === 'sim-board' || entry.activeWorldSectionId === entry.zoneId)
        && Array.isArray(entry.invalidSortedIds)
        && entry.invalidSortedIds.length === 0
      );

      return {
        pass: allPass,
        details
      };
    });

    await phase(page, report, outputDir, '02-local-structure-traversal-stays-in-zone', async () => {
      const details = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const zoneId = gameCore.getFocusedZoneId();
        const center = gameCore.getZoneCenter(zoneId);
        const butterfly = (gameState.butterflies || []).find(entry =>
          (entry.currentZoneId || entry.lifeSim?.lifecycle?.currentZoneId) === zoneId
          && !entry.zoneTravel
          && !entry.isSpawning
        ) || gameState.butterflies?.[0] || null;
        const blocks = (gameState.blocks || []).slice(0, 8);
        if (!zoneId || !center || !butterfly || blocks.length < 8) {
          return { ok: false, reason: 'missing-structure-fixture' };
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
          gameCore.assignEntityToZone(base, zoneId);
          gameCore.assignEntityToZone(top, zoneId);
          base.currentZoneId = zoneId;
          base.carriedById = null;
          base.supportBlockId = null;
          base.stackIndex = 0;
          base.x = point.x;
          base.y = point.y;
          base.gridPos = gridManager.screenToIso(point.x, point.y);
          top.currentZoneId = zoneId;
          top.carriedById = null;
          top.supportBlockId = base.id;
          top.stackIndex = 1;
          top.x = point.x;
          top.y = point.y;
          top.gridPos = gridManager.screenToIso(point.x, point.y);
        }

        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        structureSystem.update(gameState);
        physicsSystem.syncTrackedEntities?.(gameState, { resetContacts: true });

        const profile = structureSystem.getZoneProfile(zoneId);
        const shelter = profile?.shelters?.[0] || null;
        const wallStack = (shelter?.stacks || []).find(stack =>
          stack.height >= 2
          && Math.abs((stack.y || 0) - (shelter?.center?.y || 0)) > 14
        ) || (shelter?.stacks || []).find(stack => stack.height >= 2) || null;
        if (!shelter?.openingProfile?.outerPoint || !shelter?.interiorPoint || !wallStack) {
          return { ok: false, reason: 'fixture-did-not-form-shelter' };
        }

        const openingPoint = shelter.openingProfile.outerPoint;
        const interiorPoint = shelter.interiorPoint;
        const openingTransitionTargets = [
          shelter.openingProfile.innerPoint,
          shelter.entryPoint,
          interiorPoint
        ].filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y));
        const wallPoint = { x: wallStack.x, y: wallStack.y };

        butterfly.x = openingPoint.x;
        butterfly.y = openingPoint.y;
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
        const openingContext = structureSystem.getSpatialContextForEntity(butterfly, gameState);
        let openingAllowed = true;
        let openingTransitionTarget = null;
        for (const target of openingTransitionTargets) {
          const blocked = gameCore.isScreenPointBlockedForButterfly(
            target.x,
            target.y,
            butterfly,
            {
              zoneId,
              fromX: openingPoint.x,
              fromY: openingPoint.y
            }
          );
          if (blocked === false) {
            openingAllowed = false;
            openingTransitionTarget = target;
            break;
          }
        }

        butterfly.x = interiorPoint.x;
        butterfly.y = interiorPoint.y;
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
        const interiorContext = structureSystem.getSpatialContextForEntity(butterfly, gameState);
        const wallBlocked = gameCore.isScreenPointBlockedForButterfly(
          wallPoint.x,
          wallPoint.y,
          butterfly,
          {
            zoneId,
            fromX: interiorPoint.x,
            fromY: interiorPoint.y
          }
        );

        return {
          ok: true,
          zoneId,
          zoneTruth: {
            renderMode: gameConfig.world.renderMode,
            gameCoreFocusedZoneId: gameCore.getGameState().focusedZoneId || null,
            zoneSystemFocusedZoneId: zoneSystem.focusedZoneId || null,
            renderFocusedZoneId: renderManager.viewState?.focusedZoneId || null,
            activeWorldSectionId: renderManager.activeWorldSectionId || null
          },
          openingContext,
          interiorContext,
          openingAllowed,
          openingTransitionTarget,
          wallBlocked
        };
      });

      return {
        pass:
          details.ok === true &&
          details.zoneTruth?.gameCoreFocusedZoneId === details.zoneId &&
          details.zoneTruth?.zoneSystemFocusedZoneId === details.zoneId &&
          details.zoneTruth?.renderFocusedZoneId === details.zoneId &&
          (details.zoneTruth?.renderMode === 'sim-board' || details.zoneTruth?.activeWorldSectionId === details.zoneId) &&
          details.openingContext?.structureRole === 'opening' &&
          details.openingContext?.bodyFit === 'canShelterInside' &&
          details.openingAllowed === false &&
          details.interiorContext?.structureRole === 'shelter' &&
          details.interiorContext?.canUseInterior === true &&
          details.wallBlocked === true,
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
