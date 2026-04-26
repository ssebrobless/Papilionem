const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'f7_material_visibility_audit');
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
    eventBus.clearHistory?.();
    gameUI.activityLogPanel.visible = true;
    gameUI.activityLogPanel.followLatest = true;
    gameUI.activityLogPanel.scrollOffset = 0;
    gameUI.activityLogPanel.filters = {
      talk: true,
      actions: true,
      learn: true
    };
    gameUI.activityLogCache = { key: null, entries: [] };
    gameUI.inspectPanel.visible = false;
    gameUI.clearInspectSelection?.(gameCore.getGameState());
  });
  await page.waitForTimeout(600);
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

async function configureBlockRichLane(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const zoneId = state.focusedZoneId;
    const butterflies = gameCore.getButterfliesInZone(zoneId).slice(0, 6);
    const blocks = gameCore.getBlocksInZone(zoneId).slice(0, 6);
    if (!zoneId || butterflies.length < 3 || blocks.length < 3) {
      return { ok: false, reason: 'missing-zone-fixture' };
    }

    for (const block of gameCore.getGameState().blocks || []) {
      block.carriedById = null;
      block.supportBlockId = null;
      if (objectSystem?.objectState?.has(block.id)) {
        const objectState = objectSystem.objectState.get(block.id);
        objectState.carriedById = null;
      }
    }

    butterflies.forEach((butterfly, index) => {
      const block = blocks[index % blocks.length];
      butterfly.state = 'normal';
      butterfly.zoneTravel = null;
      butterfly.isSpawning = false;
      butterfly.blockInteraction.targetBlockId = null;
      butterfly.blockInteraction.carryingBlockId = null;
      butterfly.blockInteraction.placementTarget = null;
      butterfly.blockInteraction.cooldownFrames = 0;
      butterfly.blockInteraction.carryFrames = 0;
      if (block) {
        butterfly.x = block.x + (index % 2 === 0 ? -10 : 10);
        butterfly.y = block.y + 6 + (Math.floor(index / 2) * 2);
        butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
        butterfly.updateZIndex?.();
      }
    });

    eventBus.clearHistory?.();
    gameUI.activityLogCache = { key: null, entries: [] };

    return {
      ok: true,
      zoneId,
      butterflyIds: butterflies.map(butterfly => butterfly.id),
      blockIds: blocks.map(block => block.id)
    };
  });
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

    await phase(page, report, outputDir, '01-ordinary-material-window', async () => {
      await resetBaseline(page);
      const setup = await configureBlockRichLane(page);
      if (!setup.ok) {
        return { pass: false, details: setup };
      }

      await page.waitForTimeout(14000);

      const details = await page.evaluate(() => {
        const zoneId = gameCore.getGameState().focusedZoneId;
        const history = (eventBus.history || []).filter(entry => !entry.data?.zoneId || entry.data.zoneId === zoneId);
        const pickupEvents = history.filter(entry => entry.event === (GameEvents.OBJECT_PICKED_UP || 'object:pickedUp'));
        const placeEvents = history.filter(entry => entry.event === 'object:placed');
        const carryingCount = (gameCore.getButterfliesInZone(zoneId) || []).filter(butterfly => !!butterfly.blockInteraction?.carryingBlockId).length;
        const feedEntries = gameUI.getRecentActivityEntries()
          .filter(entry => entry.category === 'actions' && /block/i.test(`${entry.line || ''} ${entry.detail || ''}`))
          .slice(-8);
        const latestActorId = (placeEvents[placeEvents.length - 1]?.data?.sourceId)
          || (pickupEvents[pickupEvents.length - 1]?.data?.sourceId)
          || null;
        return {
          zoneId,
          pickupCount: pickupEvents.length,
          placeCount: placeEvents.length,
          carryingCount,
          latestActorId,
          feedEntries
        };
      });

      return {
        pass:
          (details.pickupCount + details.placeCount) >= 1
          && !!details.feedEntries.length
          && (details.carryingCount >= 1 || details.placeCount >= 1),
        details
      };
    });

    await phase(page, report, outputDir, '02-inspect-material-surfacing', async () => {
      await resetBaseline(page);
      const setup = await configureBlockRichLane(page);
      if (!setup.ok) {
        return { pass: false, details: setup };
      }

      await page.waitForTimeout(14000);

      const details = await page.evaluate(() => {
        const zoneId = gameCore.getGameState().focusedZoneId;
        const history = (eventBus.history || []).filter(entry => !entry.data?.zoneId || entry.data.zoneId === zoneId);
        const latestActorId = [...history].reverse().find(entry =>
          entry.event === 'object:placed'
          || entry.event === (GameEvents.OBJECT_PICKED_UP || 'object:pickedUp')
          || entry.event === (GameEvents.OBJECT_DROPPED || 'object:dropped')
        )?.data?.sourceId || null;
        if (!latestActorId) {
          return { ok: false, reason: 'no-material-actor' };
        }

        const state = gameCore.getGameState();
        const target = (state.butterflies || []).find(entry => entry.id === latestActorId) || null;
        if (!target) {
          return { ok: false, reason: 'missing-actor' };
        }

        gameUI.inspectPanel.visible = true;
        gameUI.beginGuidingButterfly(target, state);
        gameUI.syncPanelLayouts(state);

        const lifeSimSummary = lifeSimSystem.getEntitySummary?.(target.id, state) || null;
        const objectSummary = objectSystem.getEntityInteractionSummary?.(target.id, state) || null;
        return {
          ok: true,
          actorId: target.id,
          actorLabel: target.displayName || target.name || target.id,
          inspectLockedTargetId: gameUI.inspectPanel.lockedTargetId,
          objectSummary,
          objects: lifeSimSummary?.objects || null,
          space: lifeSimSummary?.space || null
        };
      });

      return {
        pass:
          details.ok === true
          && details.inspectLockedTargetId === details.actorId
          && !!details.objectSummary
          && !/No recent interaction/i.test(details.objectSummary.latestLabel || '')
          && (
            details.objects?.focusType === 'block'
            || details.objects?.affordance === 'carry'
            || details.objects?.affordance === 'stack'
            || (details.objects?.blockFamiliarity || 0) > 0
          ),
        details
      };
    });

    report.overall = report.phases.every(phaseResult => phaseResult.pass) && !report.pageErrors.length && !report.consoleErrors.length
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error && error.stack ? error.stack : error);
  } finally {
    report.finishedAt = new Date().toISOString();
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(reportPath);
    console.log(JSON.stringify(report, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
