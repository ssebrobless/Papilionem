const { chromium } = require('playwright');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';

async function ensureServer() {
  const reachable = await fetch(URL).then(() => true).catch(() => false);
  if (reachable) return { reused: true, pid: null };

  const { spawn } = require('child_process');
  const serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore'
  });
  serverProcess.unref();

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ok = await fetch(URL).then(() => true).catch(() => false);
    if (ok) return { reused: false, pid: serverProcess.pid };
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error('Server did not become reachable in time');
}

async function run() {
  const server = await ensureServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, {
      timeout: 30000
    });
    await page.keyboard.press('Space');
    await page.waitForTimeout(1200);
    await page.waitForFunction(() => {
      const state = gameCore?.getGameState?.();
      return !!state?.initialized && Array.isArray(state.flowers) && Array.isArray(state.blocks);
    }, null, { timeout: 20000 });

    const result = await page.evaluate(async () => {
      const state = gameCore.getGameState();
      const zoneIds = gameCore.getZoneIds?.() || [];
      const zones = zoneIds.map(zoneId => gameCore.getZoneConfig?.(zoneId)).filter(Boolean);
      const trainingZoneIds = new Set(zones.filter(zone => zone?.kind === 'training').map(zone => zone.id));
      const countByZone = (items = []) => Object.fromEntries(zoneIds.map(zoneId => [
        zoneId,
        items.filter(item => (item?.currentZoneId || item?.lifeSim?.lifecycle?.currentZoneId || null) === zoneId).length
      ]));

      const before = {
        flowers: state.flowers.length,
        blocks: state.blocks.length,
        flowersByZone: countByZone(state.flowers),
        blocksByZone: countByZone(state.blocks)
      };

      const removedBlockIds = new Set();
      for (const block of [...state.blocks]) {
        const zoneId = block?.currentZoneId || null;
        if (!trainingZoneIds.has(zoneId)) continue;
        if (block?.carriedById) continue;
        removedBlockIds.add(block.id);
        gameCore.entityManager?.removeEntity?.('blocks', block);
        gameCore.unregisterEntityFromFoundationSystems?.(block);
        const index = state.blocks.indexOf(block);
        if (index >= 0) state.blocks.splice(index, 1);
      }

      if (removedBlockIds.size) {
        for (const butterfly of state.butterflies || []) {
          if (!butterfly?.blockInteraction) continue;
          if (removedBlockIds.has(butterfly.blockInteraction.targetBlockId)) {
            butterfly.blockInteraction.targetBlockId = null;
          }
          if (removedBlockIds.has(butterfly.blockInteraction.carryingBlockId)) {
            butterfly.blockInteraction.carryingBlockId = null;
            butterfly.blockInteraction.carryFrames = 0;
          }
        }
      }

      const flowerCleanup = gameCore.pruneAndReflowFlowersForReadability?.({
        maxPerZone: 9,
        minDistance: gameConfig?.entities?.flower?.spawnMinDistance || 52,
        maxAttempts: 48
      }) || null;

      gameCore.structureSystem?.update?.(state, 1 / 60);
      await gameCore.saveSystem?.saveToStorage?.(state, { source: 'g0-garden-cleanup' });

      const after = {
        flowers: state.flowers.length,
        blocks: state.blocks.length,
        flowersByZone: countByZone(state.flowers),
        blocksByZone: countByZone(state.blocks)
      };

      return {
        trainingZoneIds: [...trainingZoneIds],
        removedTrainingBlocks: removedBlockIds.size,
        flowerCleanup,
        before,
        after
      };
    });

    console.log(JSON.stringify({
      overall: pageErrors.length || consoleErrors.length ? 'warn' : 'pass',
      server,
      pageErrors,
      consoleErrors,
      result
    }, null, 2));
    if (pageErrors.length || consoleErrors.length) process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch(error => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
