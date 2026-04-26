const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'a6_live_dispersal_audit');
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

async function evalDispersalState(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const zoneIds = gameCore.getZoneIds();
    const focusedZoneId = gameCore.getFocusedZoneId();
    const seedZoneId = progressionManager?.getFreshSeedZoneId?.(state, zoneIds) || state.freshSeedZoneId || focusedZoneId || zoneIds[0] || null;
    const zoneId = focusedZoneId || seedZoneId;
    const sectorLayout = gameCore.getFlowerSectorLayout?.() || { cols: 4, rows: 3 };
    const butterflies = gameCore.getButterfliesInZone(zoneId).filter(butterfly => butterfly?.id && !butterfly.zoneTravel && !butterfly.isSpawning);
    const allButterflies = (state.butterflies || []).filter(butterfly => butterfly?.id && !butterfly.isSpawning);
    const flowers = gameCore.getFlowersInZone(zoneId);

    const sectorHistogram = {};
    const goalSectorHistogram = {};
    const recentSectorSpread = new Set();
    const migrationHomeHistogram = {};
    const travelIntentHistogram = {};
    let anchoredButterflies = 0;
    let awayFromHomeCount = 0;
    let scoutTargetCount = 0;
    let activeTravelerCount = 0;

    for (const butterfly of butterflies) {
      const sectorKey = gameCore.getZoneSectorKey?.(zoneId, { x: butterfly.x, y: butterfly.y }, sectorLayout);
      if (sectorKey) {
        sectorHistogram[sectorKey] = (sectorHistogram[sectorKey] || 0) + 1;
      }

      const goalTarget = butterfly?.movement?.targetType === 'goal' || butterfly?.movement?.targetType === 'meander'
        ? gridManager.isoToScreen(butterfly.movement.target.x, butterfly.movement.target.y)
        : null;
      const goalSectorKey = goalTarget
        ? gameCore.getZoneSectorKey?.(zoneId, goalTarget, sectorLayout)
        : null;
      if (goalSectorKey) {
        goalSectorHistogram[goalSectorKey] = (goalSectorHistogram[goalSectorKey] || 0) + 1;
      }

      for (const recentKey of butterfly?.dispersal?.recentSectorKeys || []) {
        recentSectorSpread.add(recentKey);
      }
    }

    for (const butterfly of allButterflies) {
      const migration = butterfly?.lifeSim?.migration || {};
      const derived = butterfly?.lifeSim?.derived?.migration || {};
      const homeZoneId = derived.homeZoneId || migration.homeZoneId || null;
      if (homeZoneId) {
        migrationHomeHistogram[homeZoneId] = (migrationHomeHistogram[homeZoneId] || 0) + 1;
        anchoredButterflies += 1;
      }
      if (derived.awayFromHome) {
        awayFromHomeCount += 1;
      }
      if ((derived.travelTargetZoneId || derived.scoutTargetZoneId) && (derived.travelTargetZoneId || derived.scoutTargetZoneId) !== homeZoneId) {
        scoutTargetCount += 1;
      }
      if (butterfly.zoneTravel) {
        activeTravelerCount += 1;
      }
      const intent = String(butterfly.zoneTravel?.reason || derived.travelIntent || migration.lastTravelReason || 'settling');
      travelIntentHistogram[intent] = (travelIntentHistogram[intent] || 0) + 1;
    }

    const flowerSectorSpread = new Set(
      flowers
        .map(flower => gameCore.getZoneSectorKey?.(zoneId, { x: flower.x, y: flower.y }, sectorLayout))
        .filter(Boolean)
    );

    const sectorLoads = Object.values(sectorHistogram);
    const maxSectorLoad = sectorLoads.length ? Math.max(...sectorLoads) : 0;
    const averageSectorLoad = butterflies.length / Math.max(1, sectorLayout.cols * sectorLayout.rows);
    const activeGoalLoads = Object.values(goalSectorHistogram);
    const maxGoalSectorLoad = activeGoalLoads.length ? Math.max(...activeGoalLoads) : 0;

    return {
      zoneId,
      butterflyCount: butterflies.length,
      butterflySectors: Object.keys(sectorHistogram).length,
      sectorHistogram,
      averageSectorLoad,
      maxSectorLoad,
      goalSectors: Object.keys(goalSectorHistogram).length,
      maxGoalSectorLoad,
      goalSectorHistogram,
      flowerSectors: flowerSectorSpread.size,
      recentSectorSpread: recentSectorSpread.size,
      migrationHomes: migrationHomeHistogram,
      distinctHomeZones: Object.keys(migrationHomeHistogram).length,
      anchoredButterflies,
      awayFromHomeCount,
      scoutTargetCount,
      activeTravelerCount,
      travelIntentHistogram
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
    deferredOptimizationWarnings: [],
    server: { reused: false, pid: null }
  };

  let browser;
  let page;
  let serverProcess = null;

  try {
    const reachable = await fetch(URL).then(() => true).catch(() => false);
    if (!reachable) {
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
        const text = msg.text();
        if (text.includes('ParticlePool exhausted!')) {
          report.deferredOptimizationWarnings.push({ type: msg.type(), text });
          return;
        }
        report.consoleErrors.push({ type: msg.type(), text });
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await waitForGame(page);
    await page.evaluate(async () => {
      await gameCore.resetGame(true);
    });
    await page.waitForTimeout(1200);

    const initialState = await evalDispersalState(page);
    report.steps.push({
      label: 'initial-spread-baseline',
      pass: initialState.butterflySectors >= 5 && initialState.flowerSectors >= 4,
      details: initialState,
      screenshot: await saveShot(page, outputDir, '01-initial-spread.png')
    });

    await page.waitForTimeout(18000);

    const settledState = await evalDispersalState(page);
    const settledPass = settledState.butterflySectors >= Math.max(4, Math.ceil(settledState.butterflyCount * 0.4))
      && settledState.recentSectorSpread >= Math.max(6, settledState.butterflySectors)
      && settledState.maxSectorLoad <= Math.max(4, Math.ceil(settledState.butterflyCount * 0.5));
    report.steps.push({
      label: 'settled-live-dispersal',
      pass: settledPass,
      details: settledState,
      screenshot: await saveShot(page, outputDir, '02-settled-live-dispersal.png')
    });

    await page.waitForTimeout(14000);

    const homeRangeState = await evalDispersalState(page);
    const migrationPass = homeRangeState.distinctHomeZones >= 2
      && homeRangeState.anchoredButterflies >= Math.max(4, Math.ceil(homeRangeState.butterflyCount * 0.5))
      && (homeRangeState.scoutTargetCount >= 1 || homeRangeState.activeTravelerCount >= 1)
      && Object.keys(homeRangeState.travelIntentHistogram || {}).some(intent => ['scouting', 'overcrowding', 'return-home', 'mate-seeking', 'migration'].includes(intent));
    report.steps.push({
      label: 'home-range-personality',
      pass: migrationPass,
      details: {
        migrationHomes: homeRangeState.migrationHomes,
        distinctHomeZones: homeRangeState.distinctHomeZones,
        anchoredButterflies: homeRangeState.anchoredButterflies,
        awayFromHomeCount: homeRangeState.awayFromHomeCount,
        scoutTargetCount: homeRangeState.scoutTargetCount,
        activeTravelerCount: homeRangeState.activeTravelerCount,
        travelIntentHistogram: homeRangeState.travelIntentHistogram
      },
      screenshot: await saveShot(page, outputDir, '03-home-range-personality.png')
    });

    const passingSteps = report.steps.filter(step => step.pass).length;
    report.summary = {
      passingSteps,
      totalSteps: report.steps.length,
      pageErrors: report.pageErrors.length,
      consoleErrors: report.consoleErrors.length,
      deferredOptimizationWarnings: report.deferredOptimizationWarnings.length
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
