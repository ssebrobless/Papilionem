const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r5_sprite_fidelity_audit');
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

function parseSpriteCacheLine(line = '') {
  const match = String(line).match(/^spriteCache:\s*(\d+)\/(\d+).*hits\s+(\d+)\/(\d+)/);
  if (!match) {
    return {
      parsed: false,
      entries: 0,
      maxEntries: 0,
      hits: 0,
      misses: 0
    };
  }
  return {
    parsed: true,
    entries: Number(match[1] || 0),
    maxEntries: Number(match[2] || 0),
    hits: Number(match[3] || 0),
    misses: Number(match[4] || 0)
  };
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
  await page.waitForTimeout(1200);
}

async function screenshotBaseClip(page, outputPath, baseClip) {
  const clip = await page.evaluate((clipInput) => {
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    const baseWidth = gameConfig?.canvas?.baseWidth || 800;
    const baseHeight = gameConfig?.canvas?.baseHeight || 450;
    const scaleX = rect.width / baseWidth;
    const scaleY = rect.height / baseHeight;
    return {
      x: Math.max(0, rect.x + (clipInput.x * scaleX)),
      y: Math.max(0, rect.y + (clipInput.y * scaleY)),
      width: Math.min(rect.width, clipInput.width * scaleX),
      height: Math.min(rect.height, clipInput.height * scaleY)
    };
  }, baseClip);
  await page.screenshot({ path: outputPath, clip });
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
    screenshots: {},
    capture: null,
    telemetry: null,
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
    await context.addInitScript(() => {
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
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

    const setup = await page.evaluate(() => {
      const targetByZone = {};
      const allZoneIds = gameCore.getZoneIds?.() || [];
      const sunZoneId = allZoneIds.includes('sun-court') ? 'sun-court' : allZoneIds[0];
      const secondZoneId = allZoneIds.find(zoneId => zoneId !== sunZoneId) || sunZoneId;
      const zoneIds = [sunZoneId, secondZoneId].filter(Boolean);
      for (const zoneId of zoneIds) {
        gameCore.focusZone(zoneId);
        const boardPos = { zoneId, u: 18, v: 11, h: 0 };
        const screen = renderManager.boardToScreen(boardPos);
        const beforeIds = new Set((gameCore.gameState.butterflies || []).map(entry => entry.id));
        let butterfly = (gameCore.gameState.butterflies || [])
          .find(entry => gameCore.getEntityZoneId?.(entry, null) === zoneId)
          || null;
        if (!butterfly) {
          gameCore.godSpawnButterfly(screen.x, screen.y, null);
          butterfly = (gameCore.gameState.butterflies || [])
            .find(entry => !beforeIds.has(entry.id))
            || null;
        }
        if (!butterfly) {
          butterfly = (gameCore.gameState.butterflies || [])[0] || null;
        }
        if (!butterfly) continue;
        butterfly.isSpawning = false;
        butterfly.zoneTravel = null;
        butterfly.currentZoneId = zoneId;
        if (butterfly.lifeSim?.lifecycle) {
          butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        }
        butterfly.boardPos = boardPos;
        butterfly.applyScreenFromBoardPos?.(boardPos);
        butterfly.flightHProbeOverride = 1.5;
        butterfly.flightH = 1.5;
        butterfly.movement?.clearTarget?.();
        butterfly.updateZIndex?.();
        gameCore.butterflyStore?.afterPositionMutation?.(butterfly, zoneId, {
          zoneId,
          source: 'r5-sprite-fidelity-audit'
        });
        targetByZone[zoneId] = {
          id: butterfly.id,
          screen,
          boardPos
        };
      }
      gameCore.focusZone(sunZoneId);
      gameCore.telemetrySystem?.startSessionCapture?.(gameCore.getGameState(), {
        label: 'r5-sprite-fidelity'
      });
      targetByZone.sunZoneId = sunZoneId;
      targetByZone.secondZoneId = secondZoneId;
      return targetByZone;
    });

    await page.waitForTimeout(4500);

    const primaryTarget = setup[setup.sunZoneId] || Object.values(setup).find(entry => entry?.screen);
    if (!primaryTarget?.screen) {
      throw new Error(`R5 setup failed to place a butterfly target: ${JSON.stringify(setup)}`);
    }
    report.screenshots.sunCourtCloseup = path.join(outputDir, '01-sun-court-wing-closeup.png');
    await screenshotBaseClip(page, report.screenshots.sunCourtCloseup, {
      x: primaryTarget.screen.x - 70,
      y: primaryTarget.screen.y - 86,
      width: 140,
      height: 128
    });
    report.screenshots.sunCourtTightCloseup = path.join(outputDir, '02-sun-court-wing-tight-closeup.png');
    await screenshotBaseClip(page, report.screenshots.sunCourtTightCloseup, {
      x: primaryTarget.screen.x - 45,
      y: primaryTarget.screen.y - 66,
      width: 90,
      height: 92
    });

    const resolvedSecondZoneId = setup[setup.secondZoneId] ? setup.secondZoneId : (setup[setup.sunZoneId] ? setup.sunZoneId : null);
    const secondTarget = (resolvedSecondZoneId && setup[resolvedSecondZoneId]) || primaryTarget;
    await page.evaluate((zoneId) => {
      if (zoneId) gameCore.focusZone(zoneId);
      gameUI.firstSessionGuide.visible = false;
    }, resolvedSecondZoneId);
    await page.waitForTimeout(1200);
    report.screenshots.secondZoneCloseup = path.join(outputDir, `03-${resolvedSecondZoneId || 'fallback'}-wing-closeup.png`);
    await screenshotBaseClip(page, report.screenshots.secondZoneCloseup, {
      x: secondTarget.screen.x - 70,
      y: secondTarget.screen.y - 86,
      width: 140,
      height: 128
    });
    report.screenshots.secondZoneTightCloseup = path.join(outputDir, `04-${resolvedSecondZoneId || 'fallback'}-wing-tight-closeup.png`);
    await screenshotBaseClip(page, report.screenshots.secondZoneTightCloseup, {
      x: secondTarget.screen.x - 45,
      y: secondTarget.screen.y - 66,
      width: 90,
      height: 92
    });

    await page.evaluate((targetId) => {
      gameUI.inspectPanel.visible = true;
      gameUI.inspectPanel.lockedTargetId = targetId;
      gameUI.inspectPanel.scrollOffset = 0;
      gameCore.setDebugEnabled?.(false);
    }, secondTarget.id);
    await page.waitForTimeout(800);
    report.screenshots.inspect = path.join(outputDir, '05-inspect-sprite-fidelity.png');
    await page.screenshot({ path: report.screenshots.inspect, fullPage: true });

    await page.evaluate(() => {
      gameUI.inspectPanel.visible = false;
      gameCore.setDebugEnabled?.(true);
    });
    await page.waitForTimeout(800);
    report.screenshots.debugOverlay = path.join(outputDir, '06-debug-cache-overlay.png');
    await page.screenshot({ path: report.screenshots.debugOverlay, fullPage: true });

    const exportResult = await page.evaluate(async () => {
      return await gameCore.telemetrySystem.exportSessionCapture(gameCore.getGameState(), {
        source: 'r5-sprite-fidelity-audit'
      });
    });

    const summaryText = exportResult?.summaryPath && fs.existsSync(exportResult.summaryPath)
      ? fs.readFileSync(exportResult.summaryPath, 'utf8')
      : '';
    const spriteLine = summaryText.split(/\r?\n/).find(line => line.startsWith('spriteCache:')) || '';
    report.capture = {
      outputDir: exportResult?.outputDir || null,
      capturePath: exportResult?.capturePath || null,
      summaryPath: exportResult?.summaryPath || null,
      spriteLine,
      spriteLineParsed: parseSpriteCacheLine(spriteLine)
    };
    report.telemetry = await page.evaluate(() => spriteManager.getBakedSpriteCacheTelemetry?.() || null);

    const hits = Number(report.telemetry?.cacheHits || 0);
    const misses = Number(report.telemetry?.cacheMisses || 0);
    report.overall = (
      hits > 0
      && misses > 0
      && report.telemetry?.entryCount > 0
      && report.capture.spriteLineParsed.parsed
      && report.capture.spriteLineParsed.hits > 0
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
    ) ? 'pass' : 'fail';
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
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
