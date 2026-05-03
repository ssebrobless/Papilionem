const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'environment_flower_spawn_rebalance_audit');
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
    gameCore.focusZone?.('moss-hollow');
  });
  await page.waitForTimeout(700);
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
    url: URL,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    assertions: [],
    overall: 'pending'
  };

  let browser;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
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

    report.assertions = await page.evaluate(async () => {
      const assertions = [];
      const add = (id, pass, details = {}) => assertions.push({ id, pass: !!pass, details });
      const openZoneId = 'moss-hollow';
      const trainingZoneId = 'sun-court';
      const countNormalFlowers = zoneId => (gameCore.gameState.flowers || []).filter(flower =>
        gameCore.getEntityZoneId(flower, null) === zoneId
        && (flower.lifecycleKind || 'flower') === 'flower'
        && flower.stage !== 'dissolve'
        && (flower.occupancyState || 'normal') === 'normal'
      ).length;
      const removeZoneFlowers = zoneId => {
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          if (gameCore.getEntityZoneId(flower, null) === zoneId) {
            gameCore.removeFlowerFromGame?.(flower, 'flower-spawn-rebalance-audit-reset');
          }
        }
      };
      const makeDirtPileAtOpenCell = zoneId => {
        for (let u = 2; u <= 7; u += 1) {
          for (let v = 11; v <= 16; v += 1) {
            const boardPos = { zoneId, u, v, h: 0 };
            const occupancy = structureSystem.canOccupyBoardCell?.({ ...boardPos, occupantType: 'flower' });
            if (!occupancy?.accepted) continue;
            const point = renderManager.boardToScreen?.(boardPos);
            if (!point) continue;
            const flower = gameCore.spawnFlowerAt(zoneId, point.x, point.y, {
              exactPoint: true,
              ignoreZoneFlowerCap: true,
              minDistance: 0
            });
            if (!flower) continue;
            gameCore.transformFlowerToDirtPile?.(flower, { reason: 'flower-spawn-rebalance-audit' });
            return flower;
          }
        }
        return null;
      };

      removeZoneFlowers(openZoneId);
      removeZoneFlowers(trainingZoneId);

      const openPolicy = gameCore.getZoneFlowerSpawnPolicy?.(openZoneId);
      const trainingPolicy = gameCore.getZoneFlowerSpawnPolicy?.(trainingZoneId);
      add('open-land-policy-caps-at-five', openPolicy?.maxNormalFlowers === 5, { openPolicy });
      add('training-policy-caps-at-zero', trainingPolicy?.maxNormalFlowers === 0, { trainingPolicy });

      const openTargets = gameCore.getZoneFlowerSpawnTargets(openZoneId, {
        butterflies: new Array(8).fill(null),
        flowers: []
      });
      const trainingTargets = gameCore.getZoneFlowerSpawnTargets(trainingZoneId, {
        butterflies: new Array(8).fill(null),
        flowers: []
      });
      add('open-land-targets-never-exceed-cap', openTargets.maxNormalFlowers <= 5, { openTargets });
      add('training-targets-disable-natural-spawns', trainingTargets.maxNormalFlowers === 0
        && trainingTargets.minNormalFlowers === 0
        && trainingTargets.floorTarget === 0
        && trainingTargets.recoveryChance === 0, { trainingTargets });

      for (let attempt = 0; attempt < 12; attempt += 1) {
        gameCore.spawnFlowerAt(openZoneId, null, null, {
          candidateFlowers: gameCore.getFlowersInZone(openZoneId),
          resourceOrigin: 'flower-spawn-rebalance-audit'
        });
      }
      const openNormalCount = countNormalFlowers(openZoneId);
      add('open-land-natural-spawns-stop-at-cap', openNormalCount <= 5, { openNormalCount });

      for (let attempt = 0; attempt < 5; attempt += 1) {
        gameCore.spawnEphemeralFlower?.(trainingZoneId, { resourceOrigin: 'flower-spawn-rebalance-audit' });
      }
      const trainingNormalCount = countNormalFlowers(trainingZoneId);
      add('training-ephemeral-spawns-blocked-by-cap', trainingNormalCount === 0, { trainingNormalCount });

      removeZoneFlowers(openZoneId);
      const cleanTargets = gameCore.getZoneFlowerSpawnTargets(openZoneId, {
        butterflies: new Array(8).fill(null),
        flowers: []
      });
      const dirtPile = makeDirtPileAtOpenCell(openZoneId);
      const dirtyTargets = gameCore.getZoneFlowerSpawnTargets(openZoneId, {
        butterflies: new Array(8).fill(null),
        flowers: gameCore.getFlowersInZone(openZoneId)
      });
      add('dirt-piles-reduce-natural-spawn-pressure', !!dirtPile && dirtyTargets.maxNormalFlowers < cleanTargets.maxNormalFlowers, {
        dirtPileId: dirtPile?.id || null,
        cleanTargets,
        dirtyTargets
      });

      const allTrainingFlowers = (gameCore.gameState.flowers || []).filter(flower =>
        gameCore.getEntityZoneId(flower, null) === trainingZoneId
      );
      add('training-zone-has-no-ambient-flower-residue', allTrainingFlowers.length === 0, {
        trainingFlowerCount: allTrainingFlowers.length
      });

      return assertions;
    });

    report.overall = report.assertions.every(assertion => assertion.pass)
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = {
      message: error?.message || String(error),
      stack: error?.stack || null
    };
  } finally {
    report.completedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    if (browser) await browser.close();
  }

  console.log(JSON.stringify({
    overall: report.overall,
    outputDir,
    assertions: report.assertions.map(({ id, pass }) => ({ id, pass })),
    pageErrors: report.pageErrors.length,
    consoleErrors: report.consoleErrors.length
  }, null, 2));

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
