const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_flower_lifecycle_audit');
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
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore'
  });
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
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, {
    timeout: 30000
  });
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
    gameUI.inspectPanel.visible = false;
    gameUI.activityLogPanel.visible = false;
    gameUI.butterflyCollection.visible = false;
  });
  await page.waitForTimeout(900);
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    assertions: {},
    screenshot: null,
    overall: 'pending'
  };

  let browser;
  let context;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await context.addInitScript(() => {
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await resetBaseline(page);

    report.assertions = await page.evaluate(() => {
      const zoneIds = gameCore.getZoneIds?.() || [];
      const zoneId = zoneIds.includes('ivy-cloister') ? 'ivy-cloister' : (zoneIds[0] || gameCore.getFocusedZoneId());
      gameCore.focusZone(zoneId);
      for (const flower of [...(gameCore.gameState.flowers || [])]) {
        gameCore.removeFlowerFromGame(flower, 'r6-audit-reset');
      }
      const decayFrames = gameConfig.entities.flower.decayFrames;
      const currentFrame = gameCore.getCurrentFrame();
      const spawned = [];
      const points = [
        { u: 8, v: 8 },
        { u: 14, v: 8 },
        { u: 20, v: 8 },
        { u: 26, v: 8 }
      ];
      for (const point of points) {
        const screen = renderManager.boardToScreen({ zoneId, u: point.u, v: point.v, h: 0 });
        const flower = gameCore.spawnFlowerAt(zoneId, screen.x, screen.y, {
          exactPoint: true,
          ignoreZoneFlowerCap: true,
          minDistance: 42,
          maxAttempts: 12,
          persistentUntilConsumed: true,
          resourceOrigin: 'r6-audit-decay'
        });
        if (flower) {
          flower.isImmortal = false;
          flower.spawnedAtFrame = currentFrame - decayFrames - 1;
          spawned.push(flower);
        }
      }
      gameCore.flowerManager.update(gameCore.gameState.flowers, [], gameCore.particleSystem);
      const batchIds = new Set(spawned.map(flower => flower.id));
      const dirtPiles = gameCore.gameState.flowers.filter(flower => batchIds.has(flower.id) && flower.lifecycleKind === 'dirt-pile');
      const freshBatchFlowers = gameCore.gameState.flowers.filter(flower => batchIds.has(flower.id) && (flower.lifecycleKind || 'flower') === 'flower');

      const reserveScreen = renderManager.boardToScreen({ zoneId, u: 18, v: 13, h: 0 });
      const reserveSource = gameCore.spawnFlowerAt(zoneId, reserveScreen.x, reserveScreen.y, {
        exactPoint: true,
        ignoreZoneFlowerCap: true,
        allowFlowerOverlap: true,
        persistentUntilConsumed: true,
        resourceOrigin: 'r6-audit-reserve'
      });
      let carrier = gameCore.getButterfliesInZone(zoneId)[0] || gameCore.gameState.butterflies[0] || null;
      if (!carrier) {
        gameCore.godSpawnButterfly(reserveScreen.x + 20, reserveScreen.y, null);
        carrier = gameCore.gameState.butterflies[gameCore.gameState.butterflies.length - 1] || null;
      }
      if (carrier) {
        carrier.currentZoneId = zoneId;
        carrier.x = reserveScreen.x + 10;
        carrier.y = reserveScreen.y;
        carrier.lifeSim = carrier.lifeSim || {};
        carrier.lifeSim.drives = carrier.lifeSim.drives || {};
        carrier.lifeSim.drives.selfMaintenance = 1;
      }
      const reserveFood = gameCore.convertFlowerToReserveFood(reserveSource, carrier, {
        source: 'r6-audit-pickup'
      });
      const reserveId = reserveFood?.id || null;
      gameCore.gameState.currentFrame += decayFrames + (90 * 60);
      gameCore.flowerManager.update(gameCore.gameState.flowers, [carrier].filter(Boolean), gameCore.particleSystem);
      const reserveStillExists = !!gameCore.gameState.flowers.find(flower =>
        flower.id === reserveId && flower.lifecycleKind === 'reserve-food-ball'
      );

      const cleanupScreen = renderManager.boardToScreen({ zoneId, u: 10, v: 15, h: 0 });
      const cleanupSource = gameCore.spawnFlowerAt(zoneId, cleanupScreen.x, cleanupScreen.y, {
        exactPoint: true,
        ignoreZoneFlowerCap: true,
        allowFlowerOverlap: true,
        persistentUntilConsumed: true,
        resourceOrigin: 'r6-audit-cleanup'
      });
      const pile = gameCore.transformFlowerToDirtPile(cleanupSource, { source: 'r6-audit-cleanup-pile' });
      if (carrier && pile) {
        carrier.x = pile.x;
        carrier.y = pile.y;
        carrier.currentZoneId = zoneId;
        carrier.lifeSim.drives.selfMaintenance = 1;
      }
      const pileId = pile?.id || null;
      gameCore.flowerManager.update(gameCore.gameState.flowers, [carrier].filter(Boolean), gameCore.particleSystem);
      const pileCleaned = !gameCore.gameState.flowers.some(flower => flower.id === pileId);

      const cleanupZoneId = zoneIds.includes('moss-hollow') ? 'moss-hollow' : zoneId;
      gameCore.focusZone(cleanupZoneId);
      for (const flower of [...(gameCore.gameState.flowers || [])]) {
        if (flower.lifecycleKind === 'dirt-pile' || flower.resourceOrigin === 'r10-cleanup-floor') {
          gameCore.removeFlowerFromGame(flower, 'r10-cleanup-floor-reset');
        }
      }
      while ((gameCore.gameState.butterflies || []).length < 12) {
        const screen = renderManager.boardToScreen({
          zoneId: cleanupZoneId,
          u: 8 + ((gameCore.gameState.butterflies.length % 6) * 3),
          v: 9 + (Math.floor(gameCore.gameState.butterflies.length / 6) * 4),
          h: 0
        });
        gameCore.godSpawnButterfly(screen.x, screen.y, null);
      }
      const cleanupButterflies = gameCore.gameState.butterflies.slice(0, 12);
      const cleanupPileIds = [];
      const cleanupPoints = [
        { u: 8, v: 8 },
        { u: 12, v: 8 },
        { u: 16, v: 8 },
        { u: 20, v: 8 },
        { u: 8, v: 13 },
        { u: 12, v: 13 },
        { u: 16, v: 13 },
        { u: 20, v: 13 }
      ];
      cleanupPoints.forEach((point, index) => {
        const screen = renderManager.boardToScreen({ zoneId: cleanupZoneId, u: point.u, v: point.v, h: 0 });
        const flower = gameCore.spawnFlowerAt(cleanupZoneId, screen.x, screen.y, {
          exactPoint: true,
          ignoreZoneFlowerCap: true,
          allowFlowerOverlap: true,
          persistentUntilConsumed: true,
          resourceOrigin: 'r10-cleanup-floor'
        });
        const dirt = gameCore.transformFlowerToDirtPile(flower, { source: 'r10-cleanup-floor-seed' });
        if (dirt) cleanupPileIds.push(dirt.id);
        const butterfly = cleanupButterflies[index % cleanupButterflies.length];
        if (butterfly && dirt) {
          butterfly.currentZoneId = cleanupZoneId;
          butterfly.lifeSim.lifecycle.currentZoneId = cleanupZoneId;
          butterfly.lifeSim.drives.selfMaintenance = index % 2 === 0 ? 0.92 : 0.64;
          butterfly.lifeSim.drives.caregiving = index % 2 === 1 ? 0.88 : 0.5;
          butterfly.x = dirt.x;
          butterfly.y = dirt.y;
          butterfly.boardPos = { ...dirt.boardPos };
          butterfly.syncDebugGridPos?.();
        }
      });
      const affordanceBefore = cleanupButterflies
        .map(butterfly => butterfly?.lifeSim?.objectAwareness?.currentAffordance || null)
        .filter(Boolean);
      for (let frame = 0; frame < 3600; frame += 1) {
        if (frame % 30 === 0) {
          const remaining = gameCore.gameState.flowers.filter(flower => cleanupPileIds.includes(flower.id));
          remaining.forEach((pile, index) => {
            const butterfly = cleanupButterflies[index % cleanupButterflies.length];
            if (!butterfly) return;
            butterfly.currentZoneId = cleanupZoneId;
            butterfly.x = pile.x;
            butterfly.y = pile.y;
            butterfly.boardPos = { ...pile.boardPos };
            butterfly.syncDebugGridPos?.();
          });
        }
        gameCore.update();
        if (!gameCore.gameState.flowers.some(flower => cleanupPileIds.includes(flower.id))) break;
      }
      const remainingCleanupPiles = gameCore.gameState.flowers.filter(flower => cleanupPileIds.includes(flower.id));
      const affordanceAfter = cleanupButterflies
        .map(butterfly => butterfly?.lifeSim?.objectAwareness?.currentAffordance || null)
        .filter(Boolean);
      const cleanupFloor = {
        seed: 9090,
        zoneId: cleanupZoneId,
        seeded: cleanupPileIds.length,
        cleaned: cleanupPileIds.length - remainingCleanupPiles.length,
        remaining: remainingCleanupPiles.length,
        affordanceTrace: [...new Set([...affordanceBefore, ...affordanceAfter])],
        pass: cleanupPileIds.length === 8 && (cleanupPileIds.length - remainingCleanupPiles.length) >= 6
      };

      for (const flower of [...(gameCore.gameState.flowers || [])]) {
        if (flower.lifecycleKind === 'dirt-pile' || flower.resourceOrigin === 'w3-cleanup-organic') {
          gameCore.removeFlowerFromGame(flower, 'w3-cleanup-organic-reset');
        }
      }
      const organicPileIds = [];
      const organicPoints = [
        { u: 9, v: 9 },
        { u: 12, v: 9 },
        { u: 15, v: 9 },
        { u: 18, v: 9 },
        { u: 9, v: 13 },
        { u: 12, v: 13 },
        { u: 15, v: 13 },
        { u: 18, v: 13 }
      ];
      organicPoints.forEach(point => {
        const screen = renderManager.boardToScreen({ zoneId: cleanupZoneId, u: point.u, v: point.v, h: 0 });
        const flower = gameCore.spawnFlowerAt(cleanupZoneId, screen.x, screen.y, {
          exactPoint: true,
          ignoreZoneFlowerCap: true,
          allowFlowerOverlap: true,
          persistentUntilConsumed: true,
          resourceOrigin: 'w3-cleanup-organic'
        });
        const dirt = gameCore.transformFlowerToDirtPile(flower, { source: 'w3-cleanup-organic-seed' });
        if (dirt) organicPileIds.push(dirt.id);
      });
      while ((gameCore.gameState.butterflies || []).length < 12) {
        const index = gameCore.gameState.butterflies.length;
        const board = { zoneId: cleanupZoneId, u: 4 + ((index % 6) * 4), v: 5 + (Math.floor(index / 6) * 12), h: 0 };
        const screen = renderManager.boardToScreen(board);
        gameCore.godSpawnButterfly(screen.x, screen.y, null);
      }
      const organicButterflies = gameCore.gameState.butterflies.slice(0, 12);
      const butterflyRing = [
        { u: 6, v: 9 },
        { u: 9, v: 6 },
        { u: 12, v: 6 },
        { u: 15, v: 6 },
        { u: 18, v: 6 },
        { u: 21, v: 9 },
        { u: 6, v: 13 },
        { u: 9, v: 16 },
        { u: 12, v: 16 },
        { u: 15, v: 16 },
        { u: 18, v: 16 },
        { u: 21, v: 13 }
      ];
      organicButterflies.forEach((butterfly, index) => {
        const boardPos = { zoneId: cleanupZoneId, ...(butterflyRing[index % butterflyRing.length]), h: 0 };
        const screen = renderManager.boardToScreen(boardPos);
        butterfly.currentZoneId = cleanupZoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = cleanupZoneId;
        butterfly.lifeSim.drives.selfMaintenance = index % 2 === 0 ? 1 : 0.86;
        butterfly.lifeSim.drives.caregiving = index % 2 === 1 ? 0.96 : 0.72;
        butterfly.boardPos = boardPos;
        butterfly.x = screen.x;
        butterfly.y = screen.y - (butterfly.shadowOffset || 0);
        butterfly.syncDebugGridPos?.();
      });
      for (let frame = 0; frame < 3600; frame += 1) {
        gameCore.update();
      }
      const remainingOrganicPiles = gameCore.gameState.flowers.filter(flower => organicPileIds.includes(flower.id));
      const cleanupOrganic = {
        seed: 9090,
        zoneId: cleanupZoneId,
        seeded: organicPileIds.length,
        cleaned: organicPileIds.length - remainingOrganicPiles.length,
        remaining: remainingOrganicPiles.length,
        minInitialDistanceUnits: 3,
        teleported: false,
        pass: organicPileIds.length === 8 && (organicPileIds.length - remainingOrganicPiles.length) >= 4
      };

      for (const flower of [...(gameCore.gameState.flowers || [])]) {
        gameCore.removeFlowerFromGame(flower, 'z2-cleanup-lived-reset');
      }
      gameCore.gameState.pendingPollenPlantings = [];
      for (const butterfly of gameCore.gameState.butterflies || []) {
        butterfly.pendingPollenDropTarget = null;
      }
      const livedZoneIds = ['ivy-cloister', 'moss-hollow', 'pool-heart', 'sun-court']
        .filter(id => zoneIds.includes(id));
      const livedPileIds = [];
      const perZonePoints = [
        { u: 9, v: 8 },
        { u: 15, v: 11 },
        { u: 21, v: 14 }
      ];
      const findOpenFlowerSeedPoint = (zone, origin) => {
        for (let radius = 0; radius <= 6; radius += 1) {
          for (let du = -radius; du <= radius; du += 1) {
            for (let dv = -radius; dv <= radius; dv += 1) {
              if (radius > 0 && Math.max(Math.abs(du), Math.abs(dv)) !== radius) continue;
              const u = origin.u + du;
              const v = origin.v + dv;
              const occupancy = structureSystem.canOccupyBoardCell?.({
                zoneId: zone,
                u,
                v,
                h: 0,
                occupantType: 'flower'
              });
              if (!occupancy?.accepted) continue;
              const screen = renderManager.boardToScreen({ zoneId: zone, u, v, h: 0 });
              if (screen) return { screen, u, v };
            }
          }
        }
        return null;
      };
      livedZoneIds.forEach(zone => {
        perZonePoints.forEach(point => {
          const seedPoint = findOpenFlowerSeedPoint(zone, point);
          if (!seedPoint) return;
          const flower = gameCore.spawnFlowerAt(zone, seedPoint.screen.x, seedPoint.screen.y, {
            exactPoint: true,
            ignoreZoneFlowerCap: true,
            allowFlowerOverlap: true,
            persistentUntilConsumed: true,
            resourceOrigin: 'z2-cleanup-lived'
          });
          const dirt = gameCore.transformFlowerToDirtPile(flower, { source: 'z2-cleanup-lived-seed' });
          if (dirt) livedPileIds.push(dirt.id);
        });
      });
      while ((gameCore.gameState.butterflies || []).length < 12) {
        const index = gameCore.gameState.butterflies.length;
        const zone = livedZoneIds[index % Math.max(1, livedZoneIds.length)] || cleanupZoneId;
        const board = { zoneId: zone, u: 5 + ((index % 3) * 8), v: 5 + (Math.floor(index / 3) % 2) * 12, h: 0 };
        const screen = renderManager.boardToScreen(board);
        gameCore.godSpawnButterfly(screen.x, screen.y, null);
      }
      const livedButterflies = gameCore.gameState.butterflies.slice(0, 12);
      livedButterflies.forEach((butterfly, index) => {
        const zone = livedZoneIds[index % Math.max(1, livedZoneIds.length)] || cleanupZoneId;
        const localIndex = Math.floor(index / Math.max(1, livedZoneIds.length));
        const boardPos = {
          zoneId: zone,
          u: 6 + ((localIndex % 3) * 8),
          v: 6 + ((localIndex % 2) * 11),
          h: 0
        };
        const screen = renderManager.boardToScreen(boardPos);
        butterfly.currentZoneId = zone;
        butterfly.lifeSim.lifecycle.currentZoneId = zone;
        butterfly.lifeSim.drives.selfMaintenance = index < 4 ? 0.92 : (index % 2 === 0 ? 0.78 : 0.72);
        butterfly.lifeSim.drives.caregiving = index % 2 === 1 ? 0.78 : 0.44;
        butterfly.boardPos = boardPos;
        butterfly.x = screen.x;
        butterfly.y = screen.y - (butterfly.shadowOffset || 0);
        butterfly.targetCleanupPile = null;
        butterfly.movement?.clearTarget?.();
        butterfly.syncDebugGridPos?.();
      });
      const livedInitialTotalPiles = gameCore.gameState.flowers.filter(flower => flower.lifecycleKind === 'dirt-pile').length;
      const activityDirtConfig = gameConfig?.cognition?.affordances?.cleanupActivityDirt || null;
      const previousActivityDirtEnabled = activityDirtConfig ? activityDirtConfig.enabled : null;
      if (activityDirtConfig) {
        activityDirtConfig.enabled = false;
      }
      for (let frame = 0; frame < 18000; frame += 1) {
        if (frame % 450 === 0 && livedZoneIds.length) {
          gameCore.focusZone?.(livedZoneIds[Math.floor(frame / 450) % livedZoneIds.length]);
        }
        gameCore.update();
      }
      if (activityDirtConfig && previousActivityDirtEnabled !== null) {
        activityDirtConfig.enabled = previousActivityDirtEnabled;
      }
      const remainingLivedPiles = gameCore.gameState.flowers.filter(flower => livedPileIds.includes(flower.id));
      const livedFinalTotalPiles = gameCore.gameState.flowers.filter(flower => flower.lifecycleKind === 'dirt-pile').length;
      const cleanupOrganicFloorLived = {
        id: 'cleanup-organic-floor-lived',
        seed: 9090,
        zoneIds: livedZoneIds,
        seeded: livedPileIds.length,
        cleaned: livedPileIds.length - remainingLivedPiles.length,
        remaining: remainingLivedPiles.length,
        initialTotalPiles: livedInitialTotalPiles,
        finalTotalPiles: livedFinalTotalPiles,
        newPilesSpawned: Math.max(0, livedFinalTotalPiles - remainingLivedPiles.length),
        teleported: false,
        injectedCleanup: false,
        pass:
          livedPileIds.length === 12 &&
          (livedPileIds.length - remainingLivedPiles.length) >= 6 &&
          Math.max(0, livedFinalTotalPiles - remainingLivedPiles.length) <= 18
      };

      objectSystem?.syncEntityProfile?.(reserveFood);
      for (const flower of gameCore.gameState.flowers) {
        objectSystem?.syncEntityProfile?.(flower);
      }
      return {
        zoneId,
        decay: {
          spawned: spawned.length,
          dirtPiles: dirtPiles.length,
          freshBatchFlowers: freshBatchFlowers.length,
          decayFrames
        },
        reserve: {
          reserveId,
          reserveStillExists,
          subtype: reserveFood?.objectProfile?.subtype || null,
          resourceTags: reserveFood?.objectProfile?.resourceTags || []
        },
        cleanup: {
          pileId,
          pileCleaned,
          carrierId: carrier?.id || null,
          carrierAffordance: carrier?.lifeSim?.objectAwareness?.currentAffordance || null
        },
        cleanupFloor,
        cleanupOrganic,
        cleanupOrganicFloorLived,
        totals: {
          flowers: gameCore.gameState.flowers.length,
          dirtPiles: gameCore.gameState.flowers.filter(flower => flower.lifecycleKind === 'dirt-pile').length,
          reserveFoodBalls: gameCore.gameState.flowers.filter(flower => flower.lifecycleKind === 'reserve-food-ball').length
        }
      };
    });

    report.screenshot = path.join(outputDir, '01-flower-lifecycle-proof.png');
    await page.screenshot({ path: report.screenshot, fullPage: true });

    const assertions = report.assertions || {};
    report.overall = (
      assertions.decay?.spawned === 4
      && assertions.decay?.dirtPiles === 4
      && assertions.decay?.freshBatchFlowers === 0
      && assertions.reserve?.reserveStillExists === true
      && assertions.reserve?.subtype === 'reserve-food-ball'
      && assertions.cleanup?.pileCleaned === true
      && assertions.cleanupFloor?.pass === true
      && assertions.cleanupOrganic?.pass === true
      && assertions.cleanupOrganicFloorLived?.pass === true
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
    ) ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall, assertions: report.assertions, screenshot: report.screenshot }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
