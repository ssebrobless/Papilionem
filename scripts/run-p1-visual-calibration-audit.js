const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'p1_visual_calibration_audit');
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

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function collectCalibrationState(page) {
  return page.evaluate(() => {
    const clone = value => JSON.parse(JSON.stringify(value || null));
    const boundsForPolygon = points => (points || []).reduce((acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    const distance = (left, right) => Math.hypot((left?.x || 0) - (right?.x || 0), (left?.y || 0) - (right?.y || 0));

    const state = gameCore.getGameState();
    const zoneId = gameCore.getFocusedZoneId();
    const center = gameCore.getZoneCenter(zoneId);
    const region = gameCore.getZonePlacementRegion(zoneId);
    const geometry = gameConfig.world.mapGeometry || {};
    const roamPolygon = geometry.roamPolygon || [];
    const roamBounds = boundsForPolygon(roamPolygon);
    const blocks = gameCore.getBlocksInZone(zoneId).slice(0, 2);
    const butterfly = gameCore.getButterfliesInZone(zoneId).find(entry => !entry.zoneTravel && !entry.isSpawning) || null;
    const flower = gameCore.getFlowersInZone(zoneId).find(entry => entry.stage !== 'dissolve') || null;

    if (!center || !region || blocks.length < 2 || !butterfly || !flower) {
      return {
        pass: false,
        reason: 'missing fixture entities',
        zoneId,
        counts: {
          blocks: blocks.length,
          butterflies: gameCore.getButterfliesInZone(zoneId).length,
          flowers: gameCore.getFlowersInZone(zoneId).length
        }
      };
    }

    const fixture = {
      baseBlock: { x: center.x - 24, y: center.y + 42 },
      stackBlock: { x: center.x - 24, y: center.y + 42 },
      butterfly: { x: center.x - 92, y: center.y + 28 },
      flower: { x: center.x + 86, y: center.y + 30 }
    };
    const [baseBlock, stackBlock] = blocks;

    baseBlock.placeAt?.(fixture.baseBlock.x, fixture.baseBlock.y, {
      movedById: 'p1-visual-calibration',
      stackIndex: 0,
      supportBlockId: null,
      placementMode: 'ground',
      zoneId
    });
    stackBlock.placeAt?.(fixture.stackBlock.x, fixture.stackBlock.y, {
      movedById: 'p1-visual-calibration',
      stackIndex: 1,
      supportBlockId: baseBlock.id,
      placementMode: 'stacked',
      zoneId
    });

    butterfly.x = fixture.butterfly.x;
    butterfly.y = fixture.butterfly.y;
    butterfly.currentZoneId = zoneId;
    if (butterfly.lifeSim?.lifecycle) butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
    if (!gameCore.butterflyStore?.afterPositionMutation?.(butterfly, null, { source: 'p1-visual-calibration' })) {
      butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
      butterfly.updateZIndex?.();
    }

    flower.x = fixture.flower.x;
    flower.y = fixture.flower.y;
    flower.currentZoneId = zoneId;
    flower.gridPos = gridManager.screenToIso(flower.x, flower.y);
    flower.updateZIndex?.();

    structureSystem.update(state, 0);
    physicsSystem.update(state, 0);
    objectSystem.update(state);
    gameCore.draw();

    const samplePoints = [
      { label: 'center', ...center },
      { label: 'baseBlock', x: baseBlock.x, y: baseBlock.y },
      { label: 'stackBlock', x: stackBlock.x, y: stackBlock.y },
      { label: 'butterflyGround', x: butterfly.x, y: butterfly.y + (butterfly.shadowOffset || 0) },
      { label: 'flower', x: flower.x, y: flower.y },
      { label: 'placementMidTop', x: (region.minX + region.maxX) / 2, y: region.minY + 16 },
      { label: 'placementMidBottom', x: (region.minX + region.maxX) / 2, y: region.maxY - 16 },
      { label: 'placementMidLeft', x: region.minX + 16, y: (region.minY + region.maxY) / 2 },
      { label: 'placementMidRight', x: region.maxX - 16, y: (region.minY + region.maxY) / 2 }
    ].map(point => ({
      ...point,
      inFreeRoam: gridManager.isPointInFreeRoamArea(point),
      distanceToRoamBorder: gridManager.getDistanceToRoamBorder(point)
    }));

    const supportContext = structureSystem.getBlockSupportContext(stackBlock, gameCore.getBlocksInZone(zoneId));
    const butterflyIso = gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
    const flowerIso = gridManager.screenToIso(flower.x, flower.y);
    const butterflyGridError = distance(butterfly.gridPos, butterflyIso);
    const flowerGridError = distance(flower.gridPos, flowerIso);

    const requiredAnchorLabels = new Set(['center', 'baseBlock', 'stackBlock', 'butterflyGround', 'flower']);
    const requiredAnchorPoints = samplePoints.filter(point => requiredAnchorLabels.has(point.label));
    const nonFreePlacementProbeLabels = samplePoints
      .filter(point => !point.inFreeRoam && !requiredAnchorLabels.has(point.label))
      .map(point => point.label);

    return {
      pass:
        requiredAnchorPoints.every(point => point.inFreeRoam)
        && supportContext?.supportState === 'supported'
        && butterflyGridError < 0.01
        && flowerGridError < 0.01,
      zoneId,
      canvas: clone(gameConfig.canvas),
      renderMode: gameConfig.world.renderMode || null,
      geometry: {
        roamPolygon: clone(roamPolygon),
        roamBounds,
        placementRegion: clone(region),
        mapPlacementRegion: clone(geometry.placementRegion),
        doorwayPassages: clone(geometry.doorwayPassages),
        doorwayAvoidPolygons: clone(geometry.doorwayAvoidPolygons),
        visualReadabilityAvoidPolygons: clone(geometry.visualReadabilityAvoidPolygons),
        zoneScreenRegions: (gameConfig.world.zones || []).map(zone => ({
          id: zone.id,
          label: zone.label,
          screenRegion: clone(zone.renderProfile?.screenRegion)
        }))
      },
      fixtures: {
        baseBlock: {
          id: baseBlock.id,
          x: baseBlock.x,
          y: baseBlock.y,
          stackIndex: baseBlock.stackIndex,
          gridPos: clone(baseBlock.gridPos),
          zIndex: baseBlock.zIndex
        },
        stackBlock: {
          id: stackBlock.id,
          x: stackBlock.x,
          y: stackBlock.y,
          stackIndex: stackBlock.stackIndex,
          supportBlockId: stackBlock.supportBlockId,
          supportContext,
          gridPos: clone(stackBlock.gridPos),
          zIndex: stackBlock.zIndex
        },
        butterfly: {
          id: butterfly.id,
          x: butterfly.x,
          y: butterfly.y,
          shadowOffset: butterfly.shadowOffset || 0,
          gridPos: clone(butterfly.gridPos),
          recalculatedGridPos: butterflyIso,
          gridError: butterflyGridError,
          zIndex: butterfly.zIndex
        },
        flower: {
          id: flower.id,
          x: flower.x,
          y: flower.y,
          gridPos: clone(flower.gridPos),
          recalculatedGridPos: flowerIso,
          gridError: flowerGridError,
          zIndex: flower.zIndex
        }
      },
      samplePoints,
      warnings: {
        nonFreePlacementProbeLabels,
        visualReadabilityMaskCount: (geometry.visualReadabilityAvoidPolygons || []).length
      }
    };
  });
}

async function drawCalibrationOverlay(page, calibration) {
  await page.evaluate((calibrationState) => {
    const layer = renderManager.layers?.ui;
    if (!layer) return;
    const drawPolygon = (points, color, label) => {
      if (!Array.isArray(points) || points.length < 3) return;
      layer.push();
      layer.noFill();
      layer.stroke(...color);
      layer.strokeWeight(3);
      layer.beginShape();
      points.forEach(point => layer.vertex(point.x, point.y));
      layer.endShape(CLOSE);
      if (label) {
        layer.fill(...color);
        layer.noStroke();
        layer.textSize(12);
        layer.text(label, points[0].x + 6, points[0].y - 6);
      }
      layer.pop();
    };
    const drawRect = (bounds, color, label) => {
      if (!bounds) return;
      layer.push();
      layer.noFill();
      layer.stroke(...color);
      layer.strokeWeight(2);
      layer.rect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
      layer.fill(...color);
      layer.noStroke();
      layer.textSize(12);
      layer.text(label, bounds.minX + 6, bounds.minY + 14);
      layer.pop();
    };
    const drawCross = (point, color, label) => {
      if (!point) return;
      layer.push();
      layer.stroke(...color);
      layer.strokeWeight(2);
      layer.line(point.x - 9, point.y, point.x + 9, point.y);
      layer.line(point.x, point.y - 9, point.x, point.y + 9);
      layer.noFill();
      layer.circle(point.x, point.y, 18);
      layer.fill(...color);
      layer.noStroke();
      layer.textSize(11);
      layer.text(label, point.x + 10, point.y - 8);
      layer.pop();
    };

    if (typeof noLoop === 'function') noLoop();
    gameCore.draw();
    layer.clear();
    drawPolygon(calibrationState.geometry.roamPolygon, [255, 222, 80, 235], 'roam polygon');
    drawRect(calibrationState.geometry.placementRegion, [90, 220, 255, 235], 'placement region');
    for (const polygon of calibrationState.geometry.doorwayAvoidPolygons || []) {
      drawPolygon(polygon, [255, 90, 140, 210], null);
    }
    for (const polygon of calibrationState.geometry.visualReadabilityAvoidPolygons || []) {
      drawPolygon(polygon, [255, 170, 60, 185], 'readability mask');
    }
    for (const doorway of Object.values(calibrationState.geometry.doorwayPassages || {})) {
      drawCross(doorway.path, [255, 90, 140, 235], 'doorway');
      drawCross(doorway.spawn, [255, 150, 90, 235], 'spawn');
    }
    for (const entry of calibrationState.geometry.zoneScreenRegions || []) {
      drawRect(entry.screenRegion, [150, 130, 255, 115], entry.id);
    }

    drawCross(calibrationState.fixtures.baseBlock, [0, 255, 170, 240], 'block ground');
    drawCross(calibrationState.fixtures.stackBlock, [0, 210, 255, 240], 'stack anchor');
    drawCross({
      x: calibrationState.fixtures.butterfly.x,
      y: calibrationState.fixtures.butterfly.y + (calibrationState.fixtures.butterfly.shadowOffset || 0)
    }, [255, 255, 255, 245], 'butterfly ground');
    drawCross(calibrationState.fixtures.flower, [255, 120, 240, 240], 'flower anchor');
    renderManager.compositeLayers();
  }, calibration);
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
    screenshots: {},
    pageErrors: [],
    consoleErrors: [],
    server: null,
    calibration: null,
    guardrails: {},
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

    report.screenshots.playerView = await saveShot(page, outputDir, '01-player-view');
    report.calibration = await collectCalibrationState(page);
    await drawCalibrationOverlay(page, report.calibration);
    report.screenshots.calibrationOverlay = await saveShot(page, outputDir, '02-calibration-overlay');

    report.overall = report.calibration?.pass && report.pageErrors.length === 0 && report.consoleErrors.length === 0
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
