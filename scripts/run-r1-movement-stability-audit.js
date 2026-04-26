const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r1_movement_stability_audit');
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

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
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
  });
  await page.waitForTimeout(1000);
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

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    url: URL,
    phases: [],
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

    await phase(page, report, outputDir, '01-debug-spawns-stay-local', async () => {
      const details = await page.evaluate(() => {
        const trainingZone = teachingSystem.getTrainingZone?.() || null;
        if (!trainingZone?.id) {
          return { ok: false, reason: 'missing-training-zone' };
        }

        gameCore.focusZone(trainingZone.id);
        const zoneCenter = gameCore.getZoneCenter(trainingZone.id);
        if (!zoneCenter) {
          return { ok: false, reason: 'missing-zone-center' };
        }

        const beforeIds = new Set((gameCore.gameState.butterflies || []).map(entry => entry.id));
        const spawnOffsets = [-28, 0, 28];
        for (const offset of spawnOffsets) {
          gameCore.godSpawnButterfly(zoneCenter.x + offset, zoneCenter.y, null);
        }

        const spawned = (gameCore.gameState.butterflies || []).filter(entry => !beforeIds.has(entry.id));
        const spawnedIds = spawned.map(entry => entry.id);
        return {
          ok: true,
          zoneId: trainingZone.id,
          spawnedIds,
          spawnedBirthSources: spawned.map(entry => entry.birthSource || 'wild'),
          spawnedZoneIds: spawned.map(entry => gameCore.getEntityZoneId(entry, null)),
          initialZoneTravelCount: spawned.filter(entry => !!entry.zoneTravel).length
        };
      });

      await page.waitForTimeout(5000);

      const after = await page.evaluate((spawnedIds) => {
        const active = (gameCore.gameState.butterflies || []).filter(entry => spawnedIds.includes(entry.id));
        return {
          remainingIds: active.map(entry => entry.id),
          zoneIds: active.map(entry => gameCore.getEntityZoneId(entry, null)),
          zoneTravelCount: active.filter(entry => !!entry.zoneTravel).length,
          movedOutCount: active.filter(entry => gameCore.getEntityZoneId(entry, null) !== (teachingSystem.getTrainingZone?.()?.id || null)).length
        };
      }, details.spawnedIds || []);

      return {
        pass:
          !!details.ok &&
          Array.isArray(details.spawnedIds) &&
          details.spawnedIds.length === 3 &&
          details.initialZoneTravelCount === 0 &&
          Array.isArray(details.spawnedBirthSources) &&
          details.spawnedBirthSources.every(entry => entry === 'debug') &&
          Array.isArray(after.remainingIds) &&
          after.remainingIds.length === 3 &&
          after.zoneTravelCount === 0 &&
          after.movedOutCount === 0,
        details: {
          ...details,
          after
        }
      };
    });

    await phase(page, report, outputDir, '02-physics-owns-final-motion', async () => {
      const setup = await page.evaluate(() => {
        const focusedZoneId = gameCore.getFocusedZoneId();
        const butterfly = (gameCore.gameState.butterflies || []).find(entry =>
          entry?.id &&
          !entry.zoneTravel &&
          !entry.isSpawning &&
          (entry.birthSource === 'debug' || gameCore.getEntityZoneId(entry, null) === focusedZoneId)
        ) || null;
        if (!butterfly) {
          return { ok: false, reason: 'missing-butterfly' };
        }

        const originGround = {
          x: butterfly.x || 0,
          y: (butterfly.y || 0) + (butterfly.shadowOffset || 0)
        };
        const targetScreen = {
          x: originGround.x + 32,
          y: originGround.y + 6
        };
        const targetGrid = gridManager.screenToIso(targetScreen.x, targetScreen.y);
        butterfly.movement.setTarget(targetGrid.x, targetGrid.y, 'immediate', 12, 0);

        return {
          ok: true,
          butterflyId: butterfly.id,
          originGround,
          setupFrame: typeof frameCount === 'number' ? frameCount : 0
        };
      });

      await page.waitForTimeout(1200);

      const details = await page.evaluate((setupState) => {
        const butterfly = (gameCore.gameState.butterflies || []).find(entry => entry?.id === setupState.butterflyId) || null;
        const physics = butterfly ? (physicsSystem.getEntityState?.(butterfly.id) || butterfly.physics || null) : null;
        const telemetry = telemetrySystem?.getSnapshot?.() || null;
        const currentGround = butterfly ? {
          x: butterfly.x || 0,
          y: (butterfly.y || 0) + (butterfly.shadowOffset || 0)
        } : null;

        return {
          ...setupState,
          butterflyFound: !!butterfly,
          physicsFound: !!physics,
          movementOwner: physics?.diagnostics?.motionOwner || null,
          lastMotionSource: physics?.diagnostics?.lastMotionSource || null,
          motionSource: physics?.motion?.source || null,
          movedFrame: physics?.motion?.movedFrame ?? null,
          physicsPosition: physics?.position || null,
          currentGround,
          movedDistance: currentGround
            ? Math.hypot(currentGround.x - setupState.originGround.x, currentGround.y - setupState.originGround.y)
            : 0,
          positionDelta: (physics?.position && butterfly)
            ? Math.hypot((physics.position.x || 0) - (butterfly.x || 0), (physics.position.y || 0) - (butterfly.y || 0))
            : null,
          avgPhysicsMs: telemetry?.averages?.physicsMs || 0
        };
      }, setup);

      return {
        pass:
          !!details.ok &&
          details.butterflyFound === true &&
          details.physicsFound === true &&
          details.movementOwner === 'physicsSystem' &&
          details.lastMotionSource === 'immediate' &&
          details.motionSource === 'immediate' &&
          Number.isFinite(details.movedFrame) &&
          details.movedFrame >= details.setupFrame &&
          details.movedDistance >= 1.5 &&
          Number.isFinite(details.positionDelta) &&
          details.positionDelta <= 0.25,
        details
      };
    });

    await phase(page, report, outputDir, '03-frame-budget-seam-live', async () => {
      await page.waitForTimeout(2200);

      const details = await page.evaluate(() => {
        const telemetry = telemetrySystem?.getSnapshot?.() || null;
        const physics = physicsSystem?.getSnapshot?.() || null;
        const budget = physicsSystem?.getBudgetTargets?.() || null;
        return {
          budget,
          telemetryAverages: telemetry?.averages || null,
          physicsSummary: physics?.lastUpdateSummary || null
        };
      });

      const avgUpdateMs = details.telemetryAverages?.updateMs || 0;
      const avgPhysicsMs = details.telemetryAverages?.physicsMs || 0;
      const updateBudget = details.budget?.focusedGardenTotalUpdateMs || 0;
      const physicsBudget = details.budget?.focusedGardenPhysicsMs || 0;

      return {
        pass:
          !!details.budget &&
          !!details.telemetryAverages &&
          Number.isFinite(avgUpdateMs) &&
          Number.isFinite(avgPhysicsMs) &&
          avgUpdateMs <= updateBudget &&
          avgPhysicsMs <= physicsBudget,
        details: {
          ...details,
          avgUpdateMs,
          avgPhysicsMs,
          updateBudget,
          physicsBudget
        }
      };
    });

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
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
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
