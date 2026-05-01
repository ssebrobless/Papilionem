const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ensureServer, ensureDir, stamp } = require('./harness-core');
const { getFixtureSpec } = require('./g0h/fixtureSpec');

const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-world-rendermode'
];

async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, {
    timeout: 45000
  });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(900);
}

async function captureStorage(page) {
  return page.evaluate(async keys => {
    const snapshot = {};
    for (const key of keys) snapshot[key] = window.localStorage.getItem(key);
    snapshot.__indexedDbSavePayload = null;
    snapshot.__indexedDbSavePresent = false;
    if (typeof saveSystem !== 'undefined' && typeof saveSystem.readPayloadFromIndexedDb === 'function') {
      try {
        const payload = await saveSystem.readPayloadFromIndexedDb('papilionem-save-v2');
        snapshot.__indexedDbSavePayload = payload;
        snapshot.__indexedDbSavePresent = typeof payload === 'string' && payload.length > 0;
      } catch (_error) {
        snapshot.__indexedDbReadFailed = true;
      }
    }
    return snapshot;
  }, STORAGE_KEYS);
}

async function restoreStorage(page, snapshot) {
  await page.evaluate(async ({ keys, snapshot: stored }) => {
    for (const key of keys) {
      if (stored[key] == null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, stored[key]);
      }
    }
    if (typeof saveSystem !== 'undefined' && typeof saveSystem.writePayloadToIndexedDb === 'function') {
      if (stored.__indexedDbSavePresent && typeof stored.__indexedDbSavePayload === 'string') {
        await saveSystem.writePayloadToIndexedDb('papilionem-save-v2', stored.__indexedDbSavePayload);
      } else if (typeof indexedDB !== 'undefined') {
        await new Promise(resolve => {
          const request = indexedDB.open('papilionem-save-db-v1', 1);
          request.onerror = () => resolve(false);
          request.onsuccess = () => {
            const db = request.result;
            try {
              const transaction = db.transaction('saveSlots', 'readwrite');
              transaction.objectStore('saveSlots').delete('papilionem-save-v2');
              transaction.oncomplete = () => {
                db.close();
                resolve(true);
              };
              transaction.onerror = () => {
                db.close();
                resolve(false);
              };
            } catch (_error) {
              db.close();
              resolve(false);
            }
          };
        });
      }
    }
  }, { keys: STORAGE_KEYS, snapshot });
}

function buildOutputPaths(spec, runStamp = stamp()) {
  const outputDir = path.join(spec.saveExportRoot, `${spec.label}-${runStamp}`);
  return {
    outputDir,
    savePath: path.join(outputDir, 'save.json'),
    manifestPath: path.join(outputDir, 'manifest.json')
  };
}

async function buildG0HFixtureSave(options = {}) {
  const spec = getFixtureSpec();
  ensureDir(spec.saveExportRoot);
  const paths = buildOutputPaths(spec, options.stamp || stamp());
  ensureDir(paths.outputDir);

  const report = {
    label: spec.label,
    startedAt: new Date().toISOString(),
    outputDir: paths.outputDir,
    savePath: paths.savePath,
    manifestPath: paths.manifestPath,
    pageErrors: [],
    consoleErrors: [],
    server: null,
    pass: false
  };

  const server = await ensureServer();
  report.server = { baseUrl: server.baseUrl, port: server.port, spawned: !!server.spawned };

  const browser = options.browser || await chromium.launch({ headless: options.headless !== false });
  let ownsBrowser = !options.browser;
  let context;
  let page;
  let initialStorage = null;

  try {
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    await context.addInitScript(() => {
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
      window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = {
        memoryAttributionEnabled: true
      };
    });
    page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error?.stack || error)));
    page.on('console', message => {
      if (message.type() === 'error') report.consoleErrors.push(message.text());
    });

    await page.goto(server.baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    initialStorage = await captureStorage(page);
    await dismissTitle(page);

    const fixture = await page.evaluate(async ({ fixtureSpec, storageKeys }) => {
      function boardToScreen(boardPos) {
        return renderManager?.boardToScreen?.({
          zoneId: boardPos.zoneId,
          u: boardPos.u,
          v: boardPos.v,
          h: boardPos.h || 0
        }) || null;
      }

      function setEntityBoardPos(entity, boardPos) {
        const screen = boardToScreen(boardPos);
        if (!entity || !screen) return false;
        entity.currentZoneId = boardPos.zoneId;
        entity.boardPos = {
          zoneId: boardPos.zoneId,
          u: Math.round(boardPos.u),
          v: Math.round(boardPos.v),
          h: Math.round(boardPos.h || 0)
        };
        entity.x = screen.x;
        entity.y = screen.y;
        entity.gridPos = { x: entity.boardPos.u, y: entity.boardPos.v };
        entity.movement?.clearTarget?.();
        entity.syncDebugGridPos?.();
        if (entity.lifeSim) {
          entity.lifeSim.lifecycle = entity.lifeSim.lifecycle || {};
          entity.lifeSim.lifecycle.currentZoneId = boardPos.zoneId;
          entity.lifeSim.spatialAwareness = entity.lifeSim.spatialAwareness || {};
          entity.lifeSim.spatialAwareness.boardPos = { ...entity.boardPos };
        }
        gameCore.assignEntityToZone?.(entity, boardPos.zoneId);
        return true;
      }

      function ensureButterflyLife(entity, entry) {
        entity.displayName = entry.alias;
        entity.name = entry.alias;
        entity.personalName = entry.alias;
        entity.specialAbility = entry.ability || entity.specialAbility || 'welcome';
        entity.lifeSim = entity.lifeSim || {};
        entity.lifeSim.identity = {
          ...(entity.lifeSim.identity || {}),
          displayName: entry.alias,
          fixtureAlias: entry.alias,
          purpose: entry.purpose
        };
        entity.lifeSim.communication = {
          ...(entity.lifeSim.communication || {}),
          selfName: entry.alias
        };
        entity.lifeSim.drives = {
          ...(entity.lifeSim.drives || {}),
          ...(entry.drives || {})
        };
        entity.lifeSim.emotions = {
          ...(entity.lifeSim.emotions || {}),
          ...(entry.emotions || {})
        };
        entity.lifeSim.traits = {
          ...(entity.lifeSim.traits || {}),
          ...(entry.traits || {})
        };
        entity.lifeSim.memories = entity.lifeSim.memories || [];
        entity.lifeSim.memoryPackets = entity.lifeSim.memoryPackets || [];
        entity.lifeSim.socialEdges = entity.lifeSim.socialEdges || {};
      }

      function ensureEdge(source, target, values = {}) {
        if (!source?.id || !target?.id) return null;
        const edge = typeof ensureLifeSocialEdge === 'function'
          ? ensureLifeSocialEdge(source, target.id)
          : ((source.lifeSim.socialEdges = source.lifeSim.socialEdges || {})[target.id] = source.lifeSim.socialEdges[target.id] || {});
        const currentFrame = gameCore.getCurrentFrame?.() || gameCore.getGameState()?.currentFrame || 0;
        Object.assign(edge, values);
        if (Number.isFinite(values.lastSeenAtFrameOffset)) {
          edge.lastSeenAtFrame = currentFrame + values.lastSeenAtFrameOffset;
          delete edge.lastSeenAtFrameOffset;
        }
        edge.fixtureSeeded = true;
        return edge;
      }

      function registerFlower(flower, boardPos) {
        flower.boardPos = {
          zoneId: boardPos.zoneId,
          u: Math.round(boardPos.u),
          v: Math.round(boardPos.v),
          h: Math.round(boardPos.h || 0)
        };
        flower.gridPos = { x: flower.boardPos.u, y: flower.boardPos.v };
        flower.currentZoneId = boardPos.zoneId;
        flower.syncDebugGridPos?.();
        flower.refreshLifecycleObjectProfile?.();
        gameCore.assignEntityToZone?.(flower, boardPos.zoneId);
        gameCore.gameState.flowers.push(flower);
        gameCore.entityManager?.addEntity?.('flowers', flower);
        gameCore.registerEntityWithFoundationSystems?.(flower, 'flower');
        objectSystem?.syncEntityProfile?.(flower);
        return flower;
      }

      function registerExistingFlower(flower) {
        if (!flower?.id) return;
        gameCore.assignEntityToZone?.(flower, flower.currentZoneId || flower.boardPos?.zoneId || null);
        gameCore.entityManager?.addEntity?.('flowers', flower);
        gameCore.registerEntityWithFoundationSystems?.(flower, 'flower');
        objectSystem?.syncEntityProfile?.(flower);
      }

      function registerExistingBlock(block) {
        if (!block?.id) return;
        gameCore.assignEntityToZone?.(block, block.currentZoneId || block.boardPos?.zoneId || null);
        gameCore.entityManager?.addEntity?.('blocks', block);
        gameCore.registerEntityWithFoundationSystems?.(block, 'block');
        objectSystem?.syncEntityProfile?.(block);
      }

      storageKeys.forEach(key => window.localStorage.removeItem(key));
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
      if (typeof randomSeed === 'function') randomSeed(424242);
      if (typeof noiseSeed === 'function') noiseSeed(424242);

      await gameCore.resetGame(true);
      const state = gameCore.getGameState();
      gameConfig.entities.maxButterflies = Math.max(gameConfig.entities.maxButterflies || 0, fixtureSpec.cast.length);
      gameConfig.balance = gameConfig.balance || {};
      gameConfig.balance.migration = gameConfig.balance.migration || {};
      gameConfig.balance.migration.autoHabitatTravel = false;

      while ((state.butterflies || []).length < fixtureSpec.cast.length) {
        const index = state.butterflies.length;
        const entry = fixtureSpec.cast[index];
        const screen = boardToScreen(entry.boardPos) || { x: 420 + index * 8, y: 340 };
        gameCore.godSpawnButterfly?.(screen.x, screen.y);
      }

      state.flowers = [];
      state.blocks = [];
      state.caterpillars = [];
      gameCore.entityManager?.clear?.();
      gameCore.resetFoundationSystems?.({ preserveTelemetry: true });

      const aliasMap = {};
      fixtureSpec.cast.forEach((entry, index) => {
        const entity = state.butterflies[index];
        if (!entity) return;
        aliasMap[entry.alias] = entity.id;
        ensureButterflyLife(entity, entry);
        setEntityBoardPos(entity, entry.boardPos);
        gameCore.entityManager?.addEntity?.('butterflies', entity);
        gameCore.registerEntityWithFoundationSystems?.(entity, 'butterfly');
      });

      const byAlias = alias => state.butterflies.find(entity => entity.id === aliasMap[alias]) || null;
      for (const edgeSpec of fixtureSpec.edges) {
        const source = byAlias(edgeSpec.source);
        const target = byAlias(edgeSpec.target);
        ensureEdge(source, target, { ...(edgeSpec.values || {}) });
        const reverseSeed = {
          trust: edgeSpec.values?.trust,
          comfort: edgeSpec.values?.comfort,
          attachment: edgeSpec.values?.attachment,
          protectiveness: Math.max(0, (edgeSpec.values?.protectiveness || 0) - 0.06),
          bondTier: edgeSpec.values?.bondTier,
          coTimeSeconds: edgeSpec.values?.coTimeSeconds,
          lastSeenAtFrameOffset: edgeSpec.values?.lastSeenAtFrameOffset
        };
        ensureEdge(target, source, reverseSeed);
      }

      const seededFlowers = [];
      const seededBlocks = [];
      const nowFrame = gameCore.getCurrentFrame?.() || state.currentFrame || 0;
      for (const flowerSpec of fixtureSpec.flowers) {
        const boardPos = {
          zoneId: flowerSpec.zoneId,
          u: flowerSpec.u,
          v: flowerSpec.v,
          h: flowerSpec.h || 0
        };
        const screen = boardToScreen(boardPos);
        if (!screen) continue;
        const lifecycleKind = flowerSpec.kind === 'dirt-pile'
          ? 'dirt-pile'
          : flowerSpec.kind === 'reserve-food-ball'
            ? 'reserve-food-ball'
            : 'flower';
        const decayFrames = Math.max(1, gameConfig?.entities?.flower?.decayFrames || 3600);
        const spawnedAtFrame = flowerSpec.kind === 'aging-flower'
          ? nowFrame - Math.max(1, decayFrames - 900)
          : nowFrame;
        const flower = new Flower(screen.x, screen.y, false, {
          currentZoneId: boardPos.zoneId,
          flowerType: flowerSpec.flowerType || 'daisy',
          lifecycleKind,
          spawnedAtFrame,
          decayedAtFrame: lifecycleKind === 'dirt-pile' ? nowFrame : null,
          persistentUntilConsumed: lifecycleKind === 'flower'
        });
        flower.resourceOrigin = 'g0h-fixture';
        if (lifecycleKind === 'dirt-pile') {
          flower.stage = 'decayed';
        }
        if (lifecycleKind === 'reserve-food-ball') {
          flower.reserveFoodSource = {
            source: 'g0h-fixture',
            convertedAtFrame: nowFrame,
            colorName: flowerSpec.flowerType || 'reserve'
          };
        }
        registerFlower(flower, boardPos);
        seededFlowers.push(flower);
      }

      for (const blockSpec of fixtureSpec.blocks) {
        const boardPos = {
          zoneId: blockSpec.zoneId,
          u: blockSpec.u,
          v: blockSpec.v,
          h: blockSpec.h || 0
        };
        const screen = boardToScreen(boardPos);
        if (!screen) continue;
        const block = gameCore.godSpawnBlock?.(boardPos.zoneId, screen.x, screen.y);
        if (!block) continue;
        block.fixtureId = blockSpec.id;
        block.snapToBoardCell?.({ boardPos, h: boardPos.h, allowInvalidCell: false, reason: 'g0h-fixture' });
        block.applyBoardCell?.({ accepted: true, ...boardPos });
        seededBlocks.push(block);
      }

      state.flowers = seededFlowers;
      state.blocks = seededBlocks;
      state.caterpillars = [];
      gameCore.entityManager?.clear?.();
      gameCore.resetFoundationSystems?.({ preserveTelemetry: true });
      for (const butterfly of state.butterflies || []) {
        gameCore.entityManager?.addEntity?.('butterflies', butterfly);
        gameCore.registerEntityWithFoundationSystems?.(butterfly, 'butterfly');
      }
      for (const flower of seededFlowers) registerExistingFlower(flower);
      for (const block of seededBlocks) registerExistingBlock(block);

      gameCore.focusZone?.(fixtureSpec.zones.ivy);
      gameCore.setViewMode?.('focused-garden');
      if (gameUI?.firstSessionGuide) gameUI.firstSessionGuide.visible = false;
      if (gameUI?.activityLogPanel) gameUI.activityLogPanel.visible = true;
      if (gameUI?.inspectPanel) gameUI.inspectPanel.visible = false;
      structureSystem?.update?.(state, 0);
      objectSystem?.update?.(state);
      lifeSimSystem?.update?.(state, 1 / 60, { currentFrame: gameCore.getCurrentFrame?.() || 0 });

      const serialized = gameCore.serializeGameState();
      serialized.flowers = (state.flowers || []).map(flower => saveSystem.serializeFlower(flower));
      serialized.blocks = (state.blocks || []).map(block => saveSystem.serializeBlock(block));
      serialized.caterpillars = [];
      serialized.foundations = saveSystem.serializeFoundationState(state);
      const payload = JSON.stringify(serialized);
      const blockCells = (state.blocks || []).map(block => ({
        id: block.id,
        fixtureId: block.fixtureId || null,
        currentZoneId: block.currentZoneId || null,
        boardPos: block.boardPos || null
      }));
      return {
        serialized,
        payload,
        aliasMap,
        counts: {
          butterflies: state.butterflies.length,
          flowers: state.flowers.length,
          blocks: state.blocks.length,
          sunCourtBlocks: (state.blocks || []).filter(block => (block.currentZoneId || block.boardPos?.zoneId) === 'sun-court').length
        },
        blockCells,
        focusedZoneId: state.focusedZoneId,
        viewMode: state.viewMode
      };
    }, { fixtureSpec: spec, storageKeys: STORAGE_KEYS });

    fs.writeFileSync(paths.savePath, fixture.payload, 'utf8');
    const manifest = {
      label: spec.label,
      createdAt: new Date().toISOString(),
      savePath: paths.savePath,
      aliasMap: fixture.aliasMap,
      counts: fixture.counts,
      blockCells: fixture.blockCells,
      focusedZoneId: fixture.focusedZoneId,
      viewMode: fixture.viewMode,
      fixtureSpec: {
        cast: spec.cast.map(entry => ({
          alias: entry.alias,
          zoneId: entry.zoneId,
          boardPos: entry.boardPos,
          purpose: entry.purpose
        })),
        blocks: spec.blocks,
        flowers: spec.flowers
      }
    };
    fs.writeFileSync(paths.manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    report.pass =
      fixture.counts.butterflies >= spec.cast.length &&
      fixture.counts.blocks === spec.blocks.length &&
      fixture.counts.sunCourtBlocks === 0 &&
      report.pageErrors.length === 0 &&
      report.consoleErrors.length === 0;
    report.manifest = manifest;
  } finally {
    if (initialStorage && page) {
      await restoreStorage(page, initialStorage).catch(() => {});
    }
    if (context) await context.close().catch(() => {});
    if (ownsBrowser && browser) await browser.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    report.reportPath = path.join(paths.outputDir, 'builder-report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2), 'utf8');
  }

  if (!report.pass && options.throwOnFailure !== false) {
    throw new Error(`G0H fixture save builder failed: ${report.reportPath}`);
  }
  return report;
}

if (require.main === module) {
  buildG0HFixtureSave()
    .then(result => {
      console.log(JSON.stringify({
        pass: result.pass,
        savePath: result.savePath,
        manifestPath: result.manifestPath,
        reportPath: result.reportPath
      }, null, 2));
      if (!result.pass) process.exitCode = 1;
    })
    .catch(error => {
      console.error(error?.stack || String(error));
      process.exitCode = 1;
    });
}

module.exports = {
  STORAGE_KEYS,
  buildG0HFixtureSave,
  waitForGame,
  dismissTitle,
  captureStorage,
  restoreStorage
};
