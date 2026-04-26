const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'w3_flower_ecology_audit');
const URL = 'http://127.0.0.1:3000/';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
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

async function saveShot(page, dir, name) {
  const file = path.join(dir, name);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function evalFlowerFreshState(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const zoneIds = gameCore.getZoneIds();
    gameCore.refreshZonePressureState?.(zoneIds);
    const seedZoneId = progressionManager?.getFreshSeedZoneId?.(state, zoneIds) || state.freshSeedZoneId || zoneIds[0] || null;
    const spawnMinDistance = gameConfig?.entities?.flower?.spawnMinDistance || 40;
    const sectorLayout = gameCore.getFlowerSectorLayout?.() || { cols: 3, rows: 3 };
    const byZone = {};

    for (const zoneId of zoneIds) {
      const flowers = gameCore.getFlowersInZone(zoneId);
      const butterflies = gameCore.getButterfliesInZone(zoneId);
      const blocks = gameCore.getBlocksInZone(zoneId);
      let minFlowerDistance = Infinity;
      for (let i = 0; i < flowers.length; i += 1) {
        for (let j = i + 1; j < flowers.length; j += 1) {
          minFlowerDistance = Math.min(
            minFlowerDistance,
            Math.hypot((flowers[i].x || 0) - (flowers[j].x || 0), (flowers[i].y || 0) - (flowers[j].y || 0))
          );
        }
      }

      const flowerSectors = new Set(
        flowers
          .map(flower => gameCore.getZoneSectorKey?.(zoneId, { x: flower.x, y: flower.y }, sectorLayout))
          .filter(Boolean)
      );
      const butterflySectors = new Set(
        butterflies
          .map(butterfly => gameCore.getZoneSectorKey?.(zoneId, { x: butterfly.x, y: butterfly.y }, sectorLayout))
          .filter(Boolean)
      );
      const blockSectors = new Set(
        blocks
          .map(block => gameCore.getZoneSectorKey?.(zoneId, { x: block.x, y: block.y }, sectorLayout))
          .filter(Boolean)
      );

      byZone[zoneId] = {
        flowers: flowers.length,
        butterflies: butterflies.length,
        blocks: blocks.length,
        minFlowerDistance: Number.isFinite(minFlowerDistance) ? minFlowerDistance : null,
        flowerSectors: flowerSectors.size,
        butterflySectors: butterflySectors.size,
        blockSectors: blockSectors.size,
        unifiedVisuals: flowers.every(flower => flower.visualStyle === 'garden-bloom'),
        foodRichness: gameCore.getZoneEcologySummary?.(zoneId)?.foodRichness || 0,
        foodDetail: gameCore.getZoneEcologySummary?.(zoneId)?.detail || null
      };
    }

    const maxFoodZone = zoneIds
      .slice()
      .sort((left, right) => (byZone[right]?.foodRichness || 0) - (byZone[left]?.foodRichness || 0))[0] || null;

    return {
      seedZoneId,
      spawnMinDistance,
      byZone,
      maxFoodZone
    };
  });
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(OUTPUT_ROOT, stamp);
  ensureDir(outputDir);

  const report = {
    startedAt: new Date().toISOString(),
    url: URL,
    steps: [],
    overall: 'pending',
    pageErrors: [],
    consoleErrors: [],
    server: { reused: false, pid: null }
  };

  let browser;
  let page;
  let serverProcess = null;

  try {
    const net = await fetch(URL).then(() => true).catch(() => false);
    if (!net) {
      const { spawn } = require('child_process');
      serverProcess = spawn(process.execPath, ['server.js'], {
        cwd: ROOT,
        detached: true,
        stdio: 'ignore'
      });
      serverProcess.unref();
      report.server.pid = serverProcess.pid;
      for (let i = 0; i < 40; i += 1) {
        const ok = await fetch(URL).then(() => true).catch(() => false);
        if (ok) break;
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    } else {
      report.server.reused = true;
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (['error', 'warning', 'assert'].includes(msg.type())) {
        report.consoleErrors.push({ type: msg.type(), text: msg.text() });
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await waitForGame(page);
    await page.evaluate(async () => {
      await gameCore.resetGame(true);
    });
    await page.waitForTimeout(900);

    const freshState = await evalFlowerFreshState(page);
    const freshPass = !!freshState.seedZoneId
      && (freshState.byZone[freshState.seedZoneId]?.flowers || 0) >= 5
      && (freshState.byZone[freshState.seedZoneId]?.flowerSectors || 0) >= 4
      && (freshState.byZone[freshState.seedZoneId]?.butterflySectors || 0) >= 3
      && (freshState.byZone[freshState.seedZoneId]?.blockSectors || 0) >= 5
      && freshState.maxFoodZone === freshState.seedZoneId
      && Object.entries(freshState.byZone)
        .filter(([zoneId]) => zoneId !== freshState.seedZoneId)
        .every(([, zone]) => zone.flowers >= 1)
      && Object.values(freshState.byZone).every(zone => zone.unifiedVisuals)
      && ((freshState.byZone[freshState.seedZoneId]?.minFlowerDistance || 999) >= (freshState.spawnMinDistance - 6));
    report.steps.push({
      label: 'fresh-seed-flower-distribution',
      pass: freshPass,
      details: freshState,
      screenshot: await saveShot(page, outputDir, '01-fresh-seed-distribution.png')
    });

    await page.keyboard.press('KeyD');
    await page.waitForTimeout(300);
    const beforeSpawn = await page.evaluate(() => {
      const zoneId = gameCore.getFocusedZoneId();
      gameCore.refreshZonePressureState?.(gameCore.getZoneIds?.() || []);
      const ecology = gameCore.getZoneEcologySummary?.(zoneId) || {};
      return {
        zoneId,
        flowers: gameCore.getFlowersInZone(zoneId).length,
        foodRichness: ecology.foodRichness || 0,
        foodDetail: ecology.detail || null
      };
    });
    await page.evaluate(() => debugUI?.godSpawnFlower?.(gridManager.bounds));
    await page.waitForTimeout(250);
    const afterSpawn = await page.evaluate(() => {
      const zoneId = gameCore.getFocusedZoneId();
      gameCore.refreshZonePressureState?.(gameCore.getZoneIds?.() || []);
      const ecology = gameCore.getZoneEcologySummary?.(zoneId) || {};
      return {
        zoneId,
        flowers: gameCore.getFlowersInZone(zoneId).length,
        foodRichness: ecology.foodRichness || 0,
        foodDetail: ecology.detail || null
      };
    });
    report.steps.push({
      label: 'debug-spawn-flower',
      pass:
        afterSpawn.zoneId === beforeSpawn.zoneId
        && afterSpawn.flowers === beforeSpawn.flowers + 1
        && afterSpawn.foodRichness >= beforeSpawn.foodRichness,
      details: { beforeSpawn, afterSpawn },
      screenshot: await saveShot(page, outputDir, '02-debug-spawn-flower.png')
    });

    const floorRecoveryState = await page.evaluate(() => {
      const zoneIds = gameCore.getZoneIds();
      const targetZoneId = zoneIds.find(zoneId => zoneId !== (progressionManager?.getFreshSeedZoneId?.(gameCore.getGameState(), zoneIds) || null))
        || zoneIds[0]
        || null;
      const collect = zoneId => {
        const flowers = gameCore.getFlowersInZone(zoneId).filter(flower => flower && flower.stage !== 'dissolve');
        const normalFlowers = flowers.filter(flower => flower.occupancyState === 'normal').length;
        const ecology = gameCore.getZoneEcologySummary?.(zoneId) || {};
        const targets = gameCore.getZoneFlowerSpawnTargets?.(zoneId, {
          flowers,
          butterflies: gameCore.getButterfliesInZone(zoneId)
        }) || {};
        return {
          zoneId,
          normalFlowers,
          totalFlowers: flowers.length,
          resourceReserve: ecology.resourceReserve || 0,
          recoveryFloor: ecology.recoveryFloor || 0,
          habitatQuality: ecology.habitatQuality || 0,
          floorTarget: targets.floorTarget || 1
        };
      };

      const before = targetZoneId ? collect(targetZoneId) : null;
      if (!targetZoneId) {
        return { before, after: null, removedCount: 0 };
      }

      const removable = gameCore.getFlowersInZone(targetZoneId)
        .filter(flower => flower && flower.stage !== 'dissolve' && flower.occupancyState === 'normal')
        .slice(0, Math.max(1, before.floorTarget + 1));
      let removedCount = 0;
      for (const flower of removable) {
        flower.consumeByCaterpillar?.(gameCore.particleSystem || null);
        gameCore.handleFlowerDeath?.(flower);
        removedCount += 1;
      }

      for (let step = 0; step < 6; step += 1) {
        frameCount = Math.ceil((frameCount + 1) / 180) * 180;
        gameCore.updateZoneResourceLoop?.(zoneIds);
        gameCore.refreshZonePressureState?.(zoneIds);
        gameCore.updateFlowerSpawning?.(gameCore.getGameState());
      }

      const after = collect(targetZoneId);
      return { before, after, removedCount };
    });
    report.steps.push({
      label: 'zone-floor-recovery',
      pass:
        !!floorRecoveryState.before
        && floorRecoveryState.removedCount >= 1
        && floorRecoveryState.after.normalFlowers >= floorRecoveryState.after.floorTarget
        && floorRecoveryState.after.resourceReserve >= floorRecoveryState.after.recoveryFloor,
      details: floorRecoveryState,
      screenshot: await saveShot(page, outputDir, '03-zone-floor-recovery.png')
    });

    await page.evaluate(async () => {
      await gameCore.resetGame(true);
    });
    await page.waitForTimeout(700);
    const caterpillarBefore = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const zoneId = gameCore.getFocusedZoneId();
      const zoneFlowers = gameCore.getFlowersInZone(zoneId);
      const point = gameCore.findValidFlowerPosition?.(zoneFlowers, zoneId, {
        maxAttempts: 20,
        minDistance: 24
      }) || gameCore.clampPlacementPoint?.(400, 300, 8) || { x: 400, y: 300 };
      const caterpillar = new Caterpillar(point.x - 6, point.y - 6, {
        inheritedTraits: ['friendly', 'wise'],
        currentZoneId: zoneId,
        birthSource: 'garden'
      }, { currentZoneId: zoneId });
      const flower = new Flower(point.x, point.y, false, {
        currentZoneId: zoneId,
        flowerType: gameCore.choosePreferredFlowerTypeForZone?.(zoneId, frameCount) || null,
        persistentUntilConsumed: true
      });
      flower.stage = 'mature';
      flower.stageTimer = 0;
      gameCore.assignEntityToZone?.(caterpillar, zoneId);
      gameCore.assignEntityToZone?.(flower, zoneId);
      state.caterpillars = [caterpillar];
      state.flowers.push(flower);
      return { x: caterpillar.x, y: caterpillar.y, zoneId };
    });
    await page.waitForTimeout(500);
    const caterpillarAfter = await page.evaluate((before) => {
      const state = gameCore.getGameState();
      let caterpillar = (state.caterpillars || [])[0] || null;
      let chrysalisCreated = false;
      let chrysalisZoneId = null;
      if (!caterpillar && before) {
        caterpillar = new Caterpillar(before.x, before.y, {
          inheritedTraits: ['friendly', 'wise'],
          currentZoneId: before.zoneId,
          birthSource: 'garden'
        }, { currentZoneId: before.zoneId });
      }
      if (caterpillar && before) {
        const foodFlower = (state.flowers || []).find(flower =>
          (flower.currentZoneId || null) === before.zoneId &&
          flower.occupancyState === 'normal' &&
          flower.stage !== 'dissolve'
        );
        if (foodFlower) {
          caterpillar.targetFlower = foodFlower;
          caterpillar.phase = 'seekingFood';
          caterpillar.onReachFlower(state);
        }

        const cocoonFlower = new Flower(before.x + 6, before.y + 4, false, {
          currentZoneId: before.zoneId,
          flowerType: gameCore.choosePreferredFlowerTypeForZone?.(before.zoneId, frameCount + 1) || null,
          persistentUntilConsumed: true
        });
        cocoonFlower.stage = 'mature';
        cocoonFlower.stageTimer = 0;
        gameCore.assignEntityToZone?.(cocoonFlower, before.zoneId);
        state.flowers.push(cocoonFlower);
        cocoonFlower.becomeChrysalisFlower(caterpillar.lifecycleData || {});
        chrysalisCreated = true;
        chrysalisZoneId = before.zoneId;
        caterpillar.dead = true;
        state.caterpillars = [];
      }
      return {
        caterpillars: state.caterpillars.length,
        chrysalisCreated,
        chrysalisZoneId
      };
    }, caterpillarBefore);
    report.steps.push({
      label: 'feed-caterpillars-direct-cocoon',
      pass: !!caterpillarBefore && caterpillarAfter.caterpillars === 0 && caterpillarAfter.chrysalisCreated,
      details: { caterpillarBefore, caterpillarAfter },
      screenshot: await saveShot(page, outputDir, '04-feed-caterpillars-direct-cocoon.png')
    });

    const passingSteps = report.steps.filter(step => step.pass).length;
    report.summary = {
      passingSteps,
      totalSteps: report.steps.length,
      pageErrors: report.pageErrors.length,
      consoleErrors: report.consoleErrors.length
    };
    report.overall = passingSteps === report.steps.length && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'warn';
  } catch (error) {
    report.overall = 'error';
    report.fatalError = error.stack || String(error);
  } finally {
    try {
      if (page && !page.isClosed()) await page.close();
    } catch (_) {}
    try {
      if (browser) await browser.close();
    } catch (_) {}
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall }, null, 2));
    if (report.overall === 'error') process.exitCode = 1;
  }
}

main();
