const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'sim_board_edge_travel_audit');
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
    return null;
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
    if (ok) return serverProcess;
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

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
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

async function main() {
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);
  const report = {
    startedAt: new Date().toISOString(),
    outputDir,
    url: URL,
    server: null,
    phases: [],
    pageErrors: [],
    consoleErrors: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let serverProcess = null;

  try {
    serverProcess = await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    await context.addInitScript(({ storageKeys }) => {
      for (const key of storageKeys) {
        window.localStorage.removeItem(key);
      }
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    }, { storageKeys: STORAGE_KEYS });

    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await page.evaluate(async () => {
      await gameCore.resetGame(true);
      window.__simBoardSpawnCoverCalls = 0;
      const original = renderManager.drawSpawnCover.bind(renderManager);
      renderManager.drawSpawnCover = function auditedDrawSpawnCover(...args) {
        window.__simBoardSpawnCoverCalls += 1;
        return original(...args);
      };
    });
    await page.waitForTimeout(800);

    await phase(page, report, outputDir, '01-zone-exits-declared', async () => {
      const details = await page.evaluate(() => {
        const zoneIds = gameCore.getZoneIds?.() || [];
        const exitsByZone = Object.fromEntries(zoneIds.map(zoneId => [zoneId, zoneSystem.getExits?.(zoneId) || []]));
        const reciprocalFailures = [];
        for (const [zoneId, exits] of Object.entries(exitsByZone)) {
          for (const exit of exits) {
            if (!zoneSystem.getExitForTarget?.(exit.targetZoneId, zoneId)) {
              reciprocalFailures.push(`${zoneId}->${exit.targetZoneId}`);
            }
          }
        }
        return {
          renderMode: gameConfig.world.renderMode,
          zoneIds,
          exitsByZone,
          reciprocalFailures
        };
      });
      return {
        pass: details.renderMode === 'sim-board'
          && details.zoneIds.length === 4
          && Object.values(details.exitsByZone).every(exits => exits.length >= 2)
          && details.reciprocalFailures.length === 0,
        details
      };
    });

    await phase(page, report, outputDir, '02-four-edge-migrations', async () => {
      const details = await page.evaluate(async () => {
        const zoneIds = gameCore.getZoneIds?.() || [];
        const pairs = zoneIds.map(zoneId => {
          const exit = zoneSystem.getExits?.(zoneId)?.[0] || null;
          return exit ? { sourceZoneId: zoneId, targetZoneId: exit.targetZoneId, exitId: exit.id } : null;
        }).filter(Boolean);

        const waitFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
        const runs = [];
        for (const pair of pairs) {
          gameCore.focusZone?.(pair.sourceZoneId);
          await waitFrame();
          const state = gameCore.getGameState();
          const butterfly = (state.butterflies || []).find(entry => entry?.id && !entry.isSpawning)
            || state.butterflies?.[0]
            || null;
          if (!butterfly) {
            runs.push({ ...pair, ok: false, reason: 'missing-butterfly' });
            continue;
          }
          const startPoint = renderManager.boardToScreen({ zoneId: pair.sourceZoneId, u: 18, v: 11, h: 0 });
          gameCore.assignEntityToZone(butterfly, pair.sourceZoneId);
          butterfly.zoneTravel = null;
          butterfly.stateData = butterfly.stateData || {};
          delete butterfly.stateData.zoneTravel;
          butterfly.x = startPoint.x;
          butterfly.y = startPoint.y - (butterfly.shadowOffset || 0);
          butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
          butterfly.updateZIndex?.();

          const started = gameCore.startZoneTravel(butterfly, pair.targetZoneId, 'audit-edge-travel');
          const seen = {
            departing: false,
            inTransit: false,
            arriving: false,
            invisible: false,
            crossedExit: false,
            swappedZone: false
          };
          const trailStart = butterfly.afterimages?.length || 0;
          let final = null;

          for (let frame = 0; frame < 220; frame += 1) {
            await waitFrame();
            const travel = butterfly.zoneTravel || null;
            if (travel) {
              seen.departing = seen.departing || travel.phase === 'departing';
              seen.inTransit = seen.inTransit || travel.phase === 'in-transit';
              seen.arriving = seen.arriving || travel.phase === 'arriving';
              seen.invisible = seen.invisible || !!travel.invisible;
              seen.crossedExit = seen.crossedExit || !!travel.hasCrossedExit;
              seen.swappedZone = seen.swappedZone || !!travel.hasSwappedZone;
            } else {
              final = {
                frame,
                currentZoneId: gameCore.getEntityZoneId?.(butterfly, null),
                focusedZoneId: gameCore.getFocusedZoneId?.(),
                x: butterfly.x,
                y: butterfly.y,
                afterimages: butterfly.afterimages?.length || 0
              };
              break;
            }
          }

          runs.push({
            ...pair,
            started,
            seen,
            final,
            trailStart,
            trailEnd: butterfly.afterimages?.length || 0,
            ok: !!started
              && seen.departing
              && seen.inTransit
              && seen.arriving
              && seen.invisible
              && seen.crossedExit
              && seen.swappedZone
              && final?.currentZoneId === pair.targetZoneId
              && final?.focusedZoneId === pair.targetZoneId
          });
        }

        return {
          pairs,
          runs,
          spawnCoverCalls: window.__simBoardSpawnCoverCalls || 0
        };
      });
      return {
        pass: details.runs.length === 4
          && details.runs.every(run => run.ok)
          && details.spawnCoverCalls === 0,
        details
      };
    });

    await phase(page, report, outputDir, '03-mid-transit-save-restore', async () => {
      const details = await page.evaluate(async () => {
        const waitFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
        const sourceZoneId = 'ivy-cloister';
        const targetZoneId = zoneSystem.getExits?.(sourceZoneId)?.[0]?.targetZoneId || 'sun-court';
        gameCore.focusZone?.(sourceZoneId);
        await waitFrame();
        const butterfly = (gameCore.getGameState().butterflies || []).find(entry => entry?.id && !entry.isSpawning) || null;
        if (!butterfly) return { ok: false, reason: 'missing-butterfly' };
        const startPoint = renderManager.boardToScreen({ zoneId: sourceZoneId, u: 18, v: 11, h: 0 });
        gameCore.assignEntityToZone(butterfly, sourceZoneId);
        butterfly.zoneTravel = null;
        butterfly.x = startPoint.x;
        butterfly.y = startPoint.y - (butterfly.shadowOffset || 0);
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
        butterfly.updateZIndex?.();
        gameCore.startZoneTravel(butterfly, targetZoneId, 'audit-save-mid-transit');

        let savedPhase = null;
        for (let frame = 0; frame < 160; frame += 1) {
          await waitFrame();
          if (butterfly.zoneTravel?.phase === 'in-transit') {
            savedPhase = butterfly.zoneTravel.phase;
            break;
          }
        }
        if (savedPhase !== 'in-transit') {
          return { ok: false, reason: 'never-entered-in-transit', phase: butterfly.zoneTravel?.phase || null };
        }
        const savedId = butterfly.id;
        await saveSystem.saveToStorage?.(gameCore.getGameState(), { source: 'sim-board-edge-audit' });
        await gameCore.resetGame(false);
        await saveSystem.loadFromStorage?.(gameCore);
        const restored = (gameCore.getGameState().butterflies || []).find(entry => entry.id === savedId) || null;
        for (let frame = 0; frame < 120 && restored?.zoneTravel; frame += 1) {
          await waitFrame();
        }
        return {
          ok: !!restored,
          savedId,
          savedPhase,
          restoredExists: !!restored,
          restoredZoneId: restored ? gameCore.getEntityZoneId?.(restored, null) : null,
          restoredPhase: restored?.zoneTravel?.phase || null,
          stillTraveling: !!restored?.zoneTravel,
          targetZoneId,
          butterflyCount: gameCore.getGameState().butterflies?.length || 0
        };
      });
      return {
        pass: details.ok
          && details.restoredExists
          && details.restoredZoneId === details.targetZoneId
          && details.stillTraveling === false
          && details.butterflyCount > 0,
        details
      };
    });

    report.overall = report.phases.every(entry => entry.pass)
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    if (serverProcess && !report.server?.reused) {
      try {
        process.kill(-serverProcess.pid);
      } catch (_error) {}
    }
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Sim-board edge travel audit report: ${reportPath}`);
    console.log(`Overall: ${report.overall}`);
  }

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

main();
