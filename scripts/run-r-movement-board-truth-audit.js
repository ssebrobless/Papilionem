const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_movement_board_truth_audit');
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
    checks: null,
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
      const zoneIds = gameCore.getZoneIds?.() || [];
      const zoneId = zoneIds.find(id => id !== teachingSystem?.getTrainingZone?.()?.id) || zoneIds[0] || gameCore.getFocusedZoneId();
      if (!zoneId || !gameCore.focusZone(zoneId)) {
        return { ok: false, reason: 'missing-zone', zoneIds };
      }

      const projection = renderManager?.getProjectionForZone?.(zoneId);
      const dims = projection?.dimensions || { widthUnits: 40, depthUnits: 24 };
      const butterflies = gameCore.gameState.butterflies || [];
      const center = gameCore.getZoneCenter(zoneId);
      while (butterflies.length < 20 && center && gameCore.godSpawnButterfly) {
        gameCore.godSpawnButterfly(center.x + Math.random() * 40 - 20, center.y + Math.random() * 40 - 20, null);
      }

      const active = (gameCore.gameState.butterflies || []).slice(0, 20);
      active.forEach((butterfly, index) => {
        const u = 2 + ((index % 5) / 4) * Math.max(2, dims.widthUnits - 4);
        const v = dims.depthUnits * (0.32 + ((Math.floor(index / 5) % 4) * 0.13));
        const boardPos = { zoneId, u, v, h: 0 };
        gameCore.assignEntityToZone(butterfly, zoneId);
        butterfly.currentZoneId = zoneId;
        if (butterfly.lifeSim?.lifecycle) {
          butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        }
        butterfly.zoneTravel = null;
        butterfly.state = 'normal';
        butterfly.stateData = {};
        butterfly.boardPos = boardPos;
        butterfly.applyScreenFromBoardPos?.(boardPos);
        butterfly.movement?.clearTarget?.();
        butterfly.timers.wander.current = 0;
        butterfly.pickNewWanderTarget?.();
      });

      return {
        ok: true,
        zoneId,
        dims,
        count: active.length,
        targetSpaces: active.map(butterfly => ({
          id: butterfly.id,
          target: butterfly.movement?.target || null
        }))
      };
    });

    const screenshotBefore = path.join(outputDir, '01-board-truth-setup.png');
    await page.screenshot({ path: screenshotBefore, fullPage: true });

    const trace = await page.evaluate(async () => {
      const frameLimit = 600;
      const zoneId = gameCore.getFocusedZoneId();
      const projection = renderManager?.getProjectionForZone?.(zoneId);
      const dims = projection?.dimensions || { widthUnits: 40, depthUnits: 24 };
      const records = new Map();
      const ids = (gameCore.gameState.butterflies || [])
        .filter(butterfly => gameCore.getEntityZoneId(butterfly, null) === zoneId)
        .slice(0, 20)
        .map(butterfly => butterfly.id);

      function sample() {
        const butterflies = gameCore.gameState.butterflies || [];
        for (const butterfly of butterflies) {
          if (!ids.includes(butterfly.id)) continue;
          const boardPos = butterfly.boardPos || null;
          const target = butterfly.movement?.target || null;
          if (!records.has(butterfly.id)) {
            records.set(butterfly.id, {
              id: butterfly.id,
              samples: 0,
              topSamples: 0,
              outOfBoundsSamples: 0,
              legacyTargetSamples: 0,
              targetSamples: 0,
              nearTargetReversals: 0,
              previousDelta: null,
              previousNearDelta: null,
              final: null
            });
          }
          const entry = records.get(butterfly.id);
          entry.samples += 1;
          if (!boardPos || !Number.isFinite(boardPos.u) || !Number.isFinite(boardPos.v)) {
            entry.outOfBoundsSamples += 1;
            continue;
          }

          if (boardPos.v <= dims.depthUnits * 0.15) entry.topSamples += 1;
          if (
            boardPos.u < 0.45 ||
            boardPos.v < 0.45 ||
            boardPos.u > dims.widthUnits - 0.45 ||
            boardPos.v > dims.depthUnits - 0.45
          ) {
            entry.outOfBoundsSamples += 1;
          }

          if (target) {
            entry.targetSamples += 1;
            if (!Number.isFinite(target.u) || !Number.isFinite(target.v)) {
              entry.legacyTargetSamples += 1;
            } else {
              const delta = { u: target.u - boardPos.u, v: target.v - boardPos.v };
              const dist = Math.hypot(delta.u, delta.v);
              if (dist <= 0.5) {
                const moveDelta = entry.previousDelta;
                if (entry.previousNearDelta && moveDelta) {
                  const dot = (entry.previousNearDelta.u * moveDelta.u) + (entry.previousNearDelta.v * moveDelta.v);
                  const mag = Math.hypot(moveDelta.u, moveDelta.v) * Math.hypot(entry.previousNearDelta.u, entry.previousNearDelta.v);
                  if (mag > 0.0009 && dot / mag < -0.72) {
                    entry.nearTargetReversals += 1;
                  }
                }
                entry.previousNearDelta = moveDelta;
              }
            }
          }

          if (entry.final) {
            entry.previousDelta = {
              u: boardPos.u - entry.final.u,
              v: boardPos.v - entry.final.v
            };
          }
          entry.final = {
            u: boardPos.u,
            v: boardPos.v,
            x: butterfly.x,
            y: butterfly.y,
            target: target ? { u: target.u, v: target.v, x: target.x, y: target.y } : null
          };
        }
      }

      for (let frame = 0; frame < frameLimit; frame += 1) {
        sample();
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      sample();

      const summaries = Array.from(records.values());
      const totalSamples = summaries.reduce((sum, entry) => sum + entry.samples, 0);
      const topSamples = summaries.reduce((sum, entry) => sum + entry.topSamples, 0);
      const outOfBoundsSamples = summaries.reduce((sum, entry) => sum + entry.outOfBoundsSamples, 0);
      const legacyTargetSamples = summaries.reduce((sum, entry) => sum + entry.legacyTargetSamples, 0);
      const nearTargetReversalMax = summaries.reduce((max, entry) => Math.max(max, entry.nearTargetReversals), 0);

      return {
        zoneId,
        dims,
        count: summaries.length,
        totalSamples,
        topBiasRatio: totalSamples ? topSamples / totalSamples : 1,
        outOfBoundsSamples,
        legacyTargetSamples,
        nearTargetReversalMax,
        summaries
      };
    });

    const screenshotAfter = path.join(outputDir, '02-board-truth-after-10s.png');
    await page.screenshot({ path: screenshotAfter, fullPage: true });

    const checks = {
      setup,
      trace,
      screenshots: [screenshotBefore, screenshotAfter],
      pass:
        !!setup.ok &&
        setup.count >= 12 &&
        trace.count >= 12 &&
        trace.topBiasRatio <= 0.18 &&
        trace.outOfBoundsSamples === 0 &&
        trace.legacyTargetSamples === 0 &&
        trace.nearTargetReversalMax <= 3 &&
        report.pageErrors.length === 0 &&
        report.consoleErrors.length === 0
    };
    report.checks = checks;
    report.overall = checks.pass ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    ensureDir(outputDir);
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
