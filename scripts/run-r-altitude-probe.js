const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_altitude_probe');
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
    window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
    window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
  });
  await page.waitForTimeout(1000);
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
    pageErrors: [],
    consoleErrors: [],
    server: null,
    probe: null,
    screenshot: null,
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

    report.probe = await page.evaluate(() => {
      const zoneId = teachingSystem?.getTrainingZone?.()?.id
        || gameCore.getFocusedZoneId?.()
        || 'sun-court';
      gameCore.focusZone(zoneId);

      const boardPos = { zoneId, u: 18, v: 11, h: 0 };
      const screen = renderManager.boardToScreen(boardPos);
      const beforeIds = new Set((gameCore.gameState.butterflies || []).map(entry => entry.id));
      while ((gameCore.gameState.butterflies || []).length < 3) {
        gameCore.godSpawnButterfly(screen.x, screen.y, null);
      }

      const butterflies = (gameCore.gameState.butterflies || []).slice(0, 3);
      const heights = [0, 1.5, 3];
      butterflies.forEach((butterfly, index) => {
        butterfly.isSpawning = false;
        butterfly.zoneTravel = null;
        butterfly.currentZoneId = zoneId;
        if (butterfly.lifeSim?.lifecycle) {
          butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        }
        butterfly.boardPos = { ...boardPos };
        butterfly.applyScreenFromBoardPos?.(butterfly.boardPos);
        butterfly.movement?.clearTarget?.();
        butterfly.state = 'normal';
        butterfly.flightHProbeOverride = heights[index];
        butterfly.flightH = heights[index];
        butterfly.updateZIndex?.();
        gameCore.butterflyStore?.afterPositionMutation?.(butterfly, zoneId, {
          zoneId,
          source: 'r-altitude-probe'
        });
      });

      renderManager.invalidateEntitySort?.();
      gameCore.draw?.();

      const probes = butterflies.map(butterfly => renderManager.getAltitudeProbeForEntity(butterfly));
      const shadowXSpread = Math.max(...probes.map(entry => entry.shadow.x)) - Math.min(...probes.map(entry => entry.shadow.x));
      const shadowYSpread = Math.max(...probes.map(entry => entry.shadow.y)) - Math.min(...probes.map(entry => entry.shadow.y));
      const maxDeltaError = Math.max(...probes.map(entry => Math.abs(entry.deltaY - entry.expectedDeltaY)));
      const ascendingLift = probes.every((entry, index) => index === 0 || entry.sprite.y < probes[index - 1].sprite.y);
      return {
        zoneId,
        boardPos,
        spawnedIds: (gameCore.gameState.butterflies || [])
          .filter(entry => !beforeIds.has(entry.id))
          .map(entry => entry.id),
        probes,
        shadowXSpread,
        shadowYSpread,
        maxDeltaError,
        ascendingLift,
        pass:
          probes.length === 3
          && shadowXSpread <= 0.25
          && shadowYSpread <= 0.25
          && maxDeltaError <= 0.75
          && ascendingLift
      };
    });

    report.screenshot = path.join(outputDir, '01-altitude-probe.png');
    await page.screenshot({ path: report.screenshot, fullPage: true });

    report.overall = report.probe?.pass && report.pageErrors.length === 0 && report.consoleErrors.length === 0
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
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
