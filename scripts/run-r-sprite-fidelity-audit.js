const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_sprite_fidelity_audit');
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
  await page.waitForTimeout(1600);
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
    gameConfig.rendering.creatureBakeMode = 'fixed-high-res';
    gameConfig.rendering.creatureBakeSize.enabled = true;
    gameConfig.performance.flags.bakedCreatureSprites = true;
    gameConfig.performance.flags.smoothCreatureSprites = true;
    gameUI.setAccessibilitySettings?.({
      highContrastUI: false,
      colorblindMode: 'off',
      colorblindSafeIndicators: true,
      trailVisibility: 'off',
      uiScale: 1
    });
    gameUI.activityLogPanel.visible = false;
    gameUI.accessibilityPanel.visible = false;
    gameUI.inspectPanel.visible = true;
    gameUI.butterflyCollection.visible = false;
    gameUI.battleSetupPanel.visible = false;
    spriteManager.clearBakedSpriteCache?.();
  });
  await page.waitForTimeout(900);
}

function hamming(a, b) {
  let distance = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    if (a[i] !== b[i]) distance += 1;
  }
  return distance + Math.abs(a.length - b.length);
}

async function saveCloseup(page, outputDir, index, butterflyId) {
  await page.evaluate((id) => {
    const butterfly = gameCore.gameState.butterflies.find(candidate => candidate.id === id);
    if (!butterfly) return;
    const zoneId = butterfly.currentZoneId || butterfly.boardPos?.zoneId || gameCore.getFocusedZoneId?.();
    if (zoneId) gameCore.focusZone?.(zoneId);
    butterfly.x = 420;
    butterfly.y = 245;
    butterfly.visual.wingAngle = Math.PI * 0.35;
    gameUI.inspectPanel.visible = true;
    gameUI.inspectPanel.lockedTargetId = id;
    gameUI.setUiScaleValue?.(1);
    gameCore.draw?.();
  }, butterflyId);
  await page.waitForTimeout(120);
  const file = path.join(outputDir, `${String(index).padStart(2, '0')}-closeup-${butterflyId}.png`);
  await page.screenshot({
    path: file,
    clip: { x: 300, y: 120, width: 520, height: 420 }
  });
  return file;
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
    outputDir,
    assertions: [],
    screenshots: [],
    pageErrors: [],
    consoleErrors: [],
    server: null,
    overall: 'pending'
  };

  let browser;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await resetBaseline(page);

    const details = await page.evaluate(() => {
      const assertion = (id, pass, detail = {}) => ({ id, pass: !!pass, detail });
      const hashCanvasDraw = (draw) => {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, 16, 16);
        draw(ctx);
        const data = ctx.getImageData(0, 0, 16, 16).data;
        const gray = [];
        for (let i = 0; i < data.length; i += 4) {
          gray.push((data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114));
        }
        const average = gray.reduce((sum, value) => sum + value, 0) / Math.max(1, gray.length);
        return gray.map(value => value >= average ? 1 : 0);
      };

      const butterflies = (gameCore.gameState.butterflies || []).filter(b => b.hasRenderableWings?.());
      const butterfly = butterflies[0];
      if (!butterfly) {
        return {
          assertions: [assertion('renderable-butterfly', false, { count: butterflies.length })],
          closeupIds: []
        };
      }
      const spec = butterfly.getRenderSpec();
      const bodyScale = ((butterfly.size * spriteManager.SPRITE_SCALE) / 1080) * butterfly.getBodySpriteScale();
      const wingScale = ((butterfly.size * spriteManager.SPRITE_SCALE) / 1080) * butterfly.getWingSpriteScale() * 1.45;
      const gardenOptions = { lod: 'garden', closeup: false, entityId: butterfly.id };
      const closeupOptions = { lod: 'closeup', closeup: true, entityId: butterfly.id };
      const body = spriteManager.getBakedBodySpriteData(spec, bodyScale, gardenOptions);
      const antenna = spriteManager.getBakedAntennaSpriteData(spec, bodyScale, gardenOptions);
      const wing = spriteManager.getBakedWingPieceData(spec, 'foreLeft', wingScale, gardenOptions);
      const closeupBody = spriteManager.getBakedBodySpriteData(spec, bodyScale, closeupOptions);
      const closeupWing = spriteManager.getBakedWingPieceData(spec, 'foreLeft', wingScale, closeupOptions);
      const telemetry = spriteManager.getBakedSpriteCacheTelemetry?.() || {};

      const sourcePiece = spriteManager.getWingPieceForSpec(spec, 'foreLeft');
      const sourceBounds = spriteManager.expandBounds(
        spriteManager.getSourceAlphaBounds(sourcePiece),
        sourcePiece,
        1
      );
      const sourceHash = hashCanvasDraw(ctx => ctx.drawImage(
        sourcePiece.canvas,
        sourceBounds.x,
        sourceBounds.y,
        sourceBounds.width,
        sourceBounds.height,
        0,
        0,
        16,
        16
      ));
      const bakedHash = hashCanvasDraw(ctx => ctx.drawImage(wing.surface.canvas, 0, 0, 16, 16));
      const hashDistance = sourceHash.reduce((distance, bit, index) => distance + (bit === bakedHash[index] ? 0 : 1), 0);

      const blockLayerSmooth = !!renderManager.layers.blocks.drawingContext.imageSmoothingEnabled;
      const entityLayerSmooth = !!renderManager.layers.entities.drawingContext.imageSmoothingEnabled;
      const behindLayerSmooth = !!renderManager.layers.entitiesBehind.drawingContext.imageSmoothingEnabled;
      const assertions = [
        assertion('body-bake-min-size', body?.surface?.width >= 96 && body?.surface?.height >= 96, {
          width: body?.surface?.width || 0,
          height: body?.surface?.height || 0
        }),
        assertion('wing-bake-min-size', wing?.surface?.width >= 96 || wing?.surface?.height >= 96, {
          width: wing?.surface?.width || 0,
          height: wing?.surface?.height || 0
        }),
        assertion('antenna-bake-present', antenna?.surface?.width >= 48 && antenna?.surface?.height >= 48, {
          width: antenna?.surface?.width || 0,
          height: antenna?.surface?.height || 0
        }),
        assertion('closeup-lod-larger-than-garden', closeupBody?.surface?.width > body?.surface?.width && closeupWing?.surface?.width > wing?.surface?.width, {
          gardenBody: body?.surface?.width || 0,
          closeupBody: closeupBody?.surface?.width || 0,
          gardenWing: wing?.surface?.width || 0,
          closeupWing: closeupWing?.surface?.width || 0
        }),
        assertion('sprite-cache-memory-under-32mb', Number(telemetry.estimatedSurfaceMB || 0) < 32, {
          estimatedSurfaceMB: telemetry.estimatedSurfaceMB || 0,
          cacheEntryCount: telemetry.entryCount || 0
        }),
        assertion('blocks-remain-crisp', blockLayerSmooth === false, { imageSmoothingEnabled: blockLayerSmooth }),
        assertion('entity-layers-smooth', entityLayerSmooth === true && behindLayerSmooth === true, {
          entities: entityLayerSmooth,
          entitiesBehind: behindLayerSmooth
        }),
        assertion('wing-source-hash-close', hashDistance <= 72, {
          hashDistance,
          threshold: 72
        })
      ];

      const unique = [];
      const seen = new Set();
      for (const candidate of butterflies) {
        const key = candidate.personalityType || candidate.id;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(candidate.id);
        if (unique.length >= 4) break;
      }
      for (const candidate of butterflies) {
        if (unique.length >= 4) break;
        if (!unique.includes(candidate.id)) unique.push(candidate.id);
      }

      return {
        assertions,
        closeupIds: unique.slice(0, 4),
        telemetry,
        bakeMode: gameConfig.rendering.creatureBakeMode,
        sample: {
          butterflyId: butterfly.id,
          body: { surfaceWidth: body?.surface?.width || 0, surfaceHeight: body?.surface?.height || 0, drawWidth: body?.drawWidth || 0, drawHeight: body?.drawHeight || 0 },
          wing: { surfaceWidth: wing?.surface?.width || 0, surfaceHeight: wing?.surface?.height || 0, drawWidth: wing?.drawWidth || 0, drawHeight: wing?.drawHeight || 0 },
          closeupWing: { surfaceWidth: closeupWing?.surface?.width || 0, surfaceHeight: closeupWing?.surface?.height || 0 }
        }
      };
    });

    report.assertions.push(...(details.assertions || []));
    report.telemetry = details.telemetry || null;
    report.bakeMode = details.bakeMode || null;
    report.sample = details.sample || null;

    for (let i = 0; i < Math.min(4, details.closeupIds?.length || 0); i += 1) {
      report.screenshots.push(await saveCloseup(page, outputDir, i + 1, details.closeupIds[i]));
    }
    report.assertions.push({
      id: 'four-closeup-screenshots-produced',
      pass: report.screenshots.length === 4,
      detail: { count: report.screenshots.length, screenshots: report.screenshots }
    });

    await context.close();
    report.overall = report.assertions.every(item => item.pass)
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = error?.stack || String(error);
  } finally {
    if (browser) await browser.close();
    report.completedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath,
      outputDir,
      failed: report.assertions.filter(item => !item.pass).map(item => item.id)
    }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
