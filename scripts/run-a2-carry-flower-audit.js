const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'a2_carry_flower_audit');
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

    page.on('pageerror', error => {
      report.pageErrors.push(String(error));
    });
    page.on('console', message => {
      if (message.type() === 'error') {
        report.consoleErrors.push(message.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    await phase(page, report, outputDir, '01-carried-block-owner-recovery', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];
        const zoneId = butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || gameState.focusedZoneId;
        const block = gameState.blocks.find(entry => entry?.currentZoneId === zoneId && !entry?.carriedById) || gameState.blocks[0];
        if (!butterfly || !block) {
          return { ok: false, reason: 'missing-butterfly-or-block' };
        }

        butterfly.x = block.x - 6;
        butterfly.y = block.y + 4;
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.state = 'normal';
        butterfly.zoneTravel = null;
        butterfly.pendingPollenDropTarget = null;
        butterfly.blockInteraction.cooldownFrames = 0;

        objectSystem.pickupObject(block.id, butterfly.id);
        block.pickupBy(butterfly);
        butterfly.blockInteraction.carryingBlockId = block.id;
        butterfly.updateCarriedBlockPose(block);

        butterfly.blockInteraction.carryingBlockId = null;

        const recoveredBlock = butterfly.getCarriedBlock(gameState.blocks);
        butterfly.updateCarriedBlockPose(recoveredBlock);

        const anchor = butterfly.physics?.carry?.anchor || null;
        const blockState = objectSystem.getObjectState(block.id);
        const anchorDelta = anchor
          ? Math.hypot((block.x || 0) - anchor.x, (block.y || 0) - anchor.y)
          : null;

        return {
          ok: !!recoveredBlock,
          recoveredBlockId: recoveredBlock?.id || null,
          restoredCarryId: butterfly.blockInteraction.carryingBlockId || null,
          blockCarriedById: block.carriedById || null,
          objectCarrierId: blockState?.carriedById || null,
          anchorDelta,
          zoneId: block.currentZoneId || null
        };
      });

      return {
        pass:
          details.ok === true &&
          !!details.recoveredBlockId &&
          details.recoveredBlockId === details.restoredCarryId &&
          !!details.blockCarriedById &&
          details.blockCarriedById === details.objectCarrierId &&
          (details.anchorDelta === null || details.anchorDelta <= 1.5),
        details
      };
    });

    await phase(page, report, outputDir, '02-sleep-drops-carried-block', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        const butterfly = gameState.butterflies[0];
        const zoneId = butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || gameState.focusedZoneId;
        const block = gameState.blocks.find(entry => entry?.currentZoneId === zoneId && !entry?.carriedById) || gameState.blocks[0];
        if (!butterfly || !block) {
          return { ok: false, reason: 'missing-butterfly-or-block' };
        }

        butterfly.x = block.x - 6;
        butterfly.y = block.y + 4;
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.state = 'normal';
        butterfly.zoneTravel = null;
        butterfly.pendingPollenDropTarget = null;
        butterfly.blockInteraction.cooldownFrames = 0;

        objectSystem.pickupObject(block.id, butterfly.id);
        block.pickupBy(butterfly);
        butterfly.blockInteraction.carryingBlockId = null;

        sleepSystem.setSleepSubtype(butterfly.id, 'settling_sleep', 'audit-force-sleep');
        butterfly.updateSleepingState({
          blocks: gameState.blocks,
          particleSystem: gameCore.particleSystem
        }, sleepSystem.getSleepState(butterfly.id));

        const carriedAfter = butterfly.getCarriedBlock(gameState.blocks);
        const blockState = objectSystem.getObjectState(block.id);
        const sleepState = sleepSystem.getSleepState(butterfly.id);

        return {
          ok: true,
          carriedAfterId: carriedAfter?.id || null,
          localCarryId: butterfly.blockInteraction.carryingBlockId || null,
          blockCarriedById: block.carriedById || null,
          objectCarrierId: blockState?.carriedById || null,
          sleepSubtype: sleepState?.subtype || null,
          placementMode: block.lastPlacedMode || null
        };
      });

      return {
        pass:
          details.ok === true &&
          details.carriedAfterId === null &&
          details.localCarryId === null &&
          details.blockCarriedById === null &&
          details.objectCarrierId === null &&
          ['ground', 'connected', 'stacked'].includes(details.placementMode),
        details
      };
    });

    await phase(page, report, outputDir, '03-flower-type-normalization', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const canonicalTypes = gameConfig?.entities?.flower?.types || [];
        const samples = ['rose', 'lily', 'sunflower', 'daisy', 'lavender'].map((requestedType, index) => {
          const flower = new Flower(220 + (index * 18), 220, false, {
            currentZoneId: gameCore.getFocusedZoneId?.() || gameCore.getGameState().focusedZoneId || null,
            flowerType: requestedType
          });
          return {
            requestedType,
            normalizedType: flower.flowerType,
            visualStyle: flower.visualStyle,
            petalStyle: flower.petalStyle
          };
        });

        return {
          canonicalTypes,
          samples
        };
      });

      const requestedToNormalized = Object.fromEntries(details.samples.map(sample => [sample.requestedType, sample.normalizedType]));
      const allCanonical = details.samples.every(sample => details.canonicalTypes.includes(sample.normalizedType));
      const unifiedVisuals = details.samples.every(sample => sample.visualStyle === 'garden-bloom' && sample.petalStyle === 'garden-bloom');

      return {
        pass:
          allCanonical &&
          unifiedVisuals &&
          requestedToNormalized.rose === 'daisy' &&
          requestedToNormalized.lily === 'tulip' &&
          requestedToNormalized.sunflower === 'bush',
        details: {
          ...details,
          requestedToNormalized,
          allCanonical,
          unifiedVisuals
        }
      };
    });

    report.overall = report.phases.every(phaseResult => phaseResult.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }

  report.finishedAt = new Date().toISOString();
  report.summary = {
    passingPhases: report.phases.filter(phaseResult => phaseResult.pass).length,
    totalPhases: report.phases.length,
    pageErrors: report.pageErrors.length,
    consoleErrors: report.consoleErrors.length
  };

  const reportPath = path.join(outputDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ reportPath, overall: report.overall }, null, 2));
}

run();
