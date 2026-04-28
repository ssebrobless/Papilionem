const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r7_block_visual_audit');
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

async function setupLiveCarryAndSupportedStack(page, options = {}) {
  const { enableDebug = false } = options;
  return page.evaluate(({ enableDebug: shouldEnableDebug }) => {
    const state = gameCore.getGameState();
    const zoneId = gameCore.getFocusedZoneId();
    const center = gameCore.getZoneCenter(zoneId);
    const butterfly = (state.butterflies || []).find(entry =>
      entry.currentZoneId === zoneId
      && !entry.zoneTravel
      && !entry.isSpawning
    ) || null;
    const blocks = (state.blocks || []).filter(entry => entry.currentZoneId === zoneId).slice(0, 3);
    if (!center || !butterfly || blocks.length < 3) return null;

    const [baseBlock, stackedBlock, carryBlock] = blocks;
    baseBlock.placeAt?.(center.x + 18, center.y + 24, {
      movedById: 'audit',
      stackIndex: 0,
      supportBlockId: null,
      placementMode: 'connected',
      zoneId
    });
    stackedBlock.placeAt?.(center.x + 18, center.y + 24, {
      movedById: 'audit',
      stackIndex: 1,
      supportBlockId: baseBlock.id,
      placementMode: 'stacked',
      zoneId
    });
    carryBlock.placeAt?.(center.x - 20, center.y + 54, {
      movedById: 'audit',
      stackIndex: 0,
      supportBlockId: null,
      placementMode: 'ground',
      zoneId
    });

    butterfly.x = center.x - 42;
    butterfly.y = center.y + 12;
    butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
    butterfly.currentZoneId = zoneId;
    butterfly.lifeSim.lifecycle.currentZoneId = zoneId;

    structureSystem.update(state, 0);
    physicsSystem.update(state, 0);
    objectSystem.update(state);

    objectSystem.pickupObject?.(carryBlock.id, butterfly.id);
    carryBlock.pickupBy?.(butterfly);
    butterfly.blockInteraction.carryingBlockId = carryBlock.id;
    butterfly.blockInteraction.cooldownFrames = 999;
    butterfly.updateCarriedBlockPose?.(carryBlock);
    physicsSystem.applyCarriedBlockAnchor?.(butterfly, carryBlock);
    objectSystem.update(state);

    if (shouldEnableDebug) {
      gameUI.inspectPanel.visible = true;
      gameUI.beginGuidingButterfly(butterfly, state);
      gameCore.setDebugEnabled?.(true);
    }

    return {
      butterflyId: butterfly.id,
      baseBlockId: baseBlock.id,
      stackedBlockId: stackedBlock.id,
      carryBlockId: carryBlock.id
    };
  }, { enableDebug });
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

    await phase(page, report, outputDir, '01-offscreen-ground-cube', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const zoneId = gameCore.getGameState().focusedZoneId;
        const gfx = createGraphics(96, 96);
        gfx.pixelDensity?.(1);
        gfx.clear();
        const block = new Block(44, 76, { currentZoneId: zoneId });
        block.drawEntity(gfx, 255);

        const { data, width, height } = gfx.drawingContext.getImageData(0, 0, 96, 96);
        let nonTransparent = 0;
        let outlinePixels = 0;
        let fillPixels = 0;
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;

        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3];
          if (alpha === 0) continue;
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const pixelIndex = index / 4;
          const x = pixelIndex % width;
          const y = Math.floor(pixelIndex / width);
          nonTransparent += 1;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);

          if (red < 32 && green < 40 && blue < 48) {
            outlinePixels += 1;
          } else if (green > 150 && blue > 150) {
            fillPixels += 1;
          }
        }

        return {
          nonTransparent,
          outlinePixels,
          fillPixels,
          bbox: {
            width: maxX >= minX ? (maxX - minX + 1) : 0,
            height: maxY >= minY ? (maxY - minY + 1) : 0
          }
        };
      });

      return {
        pass:
          details.nonTransparent >= 180 &&
          details.outlinePixels >= 18 &&
          details.fillPixels >= 120 &&
          details.bbox.width >= 18 &&
          details.bbox.height >= 18,
        details
      };
    });

    await phase(page, report, outputDir, '02-offscreen-stacked-lift', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const zoneId = gameCore.getGameState().focusedZoneId;
        const measureBounds = (block) => {
          const gfx = createGraphics(96, 96);
          gfx.pixelDensity?.(1);
          gfx.clear();
          block.drawEntity(gfx, 255);
          const { data, width, height } = gfx.drawingContext.getImageData(0, 0, 96, 96);
          let minY = height;
          let maxY = 0;
          let outlinePixels = 0;
          for (let index = 0; index < data.length; index += 4) {
            const alpha = data[index + 3];
            if (alpha === 0) continue;
            const red = data[index];
            const green = data[index + 1];
            const blue = data[index + 2];
            const y = Math.floor((index / 4) / width);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            if (red < 32 && green < 40 && blue < 48) {
              outlinePixels += 1;
            }
          }
          return {
            minY,
            maxY,
            outlinePixels
          };
        };

        const ground = new Block(44, 76, { currentZoneId: zoneId });
        const stacked = new Block(44, 76, { currentZoneId: zoneId, stackIndex: 2 });
        return {
          ground: measureBounds(ground),
          stacked: measureBounds(stacked)
        };
      });

      return {
        pass:
          details.stacked.minY < details.ground.minY &&
          details.stacked.outlinePixels >= 18,
        details
      };
    });

    await phase(page, report, outputDir, '03-live-procedural-blocks', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        if (!window.__r7BlockAuditWrapped) {
          const original = Block.prototype.drawProceduralCube;
          Block.prototype.drawProceduralCube = function wrappedDrawProceduralCube(...args) {
            window.__r7BlockAuditDrawCalls = (window.__r7BlockAuditDrawCalls || 0) + 1;
            return original.apply(this, args);
          };
          window.__r7BlockAuditWrapped = true;
        }
        window.__r7BlockAuditDrawCalls = 0;

        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const anchorX = 402;
        const anchorY = 286;
        const blockA = new Block(anchorX - 18, anchorY + 22, { currentZoneId: zoneId });
        const blockB = new Block(anchorX + 10, anchorY + 22, { currentZoneId: zoneId });
        const blockC = new Block(anchorX - 18, anchorY + 22, {
          currentZoneId: zoneId,
          stackIndex: 1,
          supportBlockId: blockA.id,
          lastPlacedMode: 'stacked'
        });
        state.blocks.push(blockA, blockB, blockC);
        return {
          zoneId,
          blockIds: [blockA.id, blockB.id, blockC.id]
        };
      });

      await page.waitForTimeout(600);

      const after = await page.evaluate(({ blockIds }) => {
        const activeBlocks = (gameCore.getGameState().blocks || []).filter(block => blockIds.includes(block.id));
        return {
          drawCalls: window.__r7BlockAuditDrawCalls || 0,
          activeBlockCount: activeBlocks.length,
          stackModes: activeBlocks.map(block => ({
            id: block.id,
            stackIndex: block.stackIndex,
            lastPlacedMode: block.lastPlacedMode
          }))
        };
      }, details);

      return {
        pass:
          after.drawCalls >= 3 &&
          after.activeBlockCount === 3 &&
          after.stackModes.some(entry => entry.stackIndex === 1 && entry.lastPlacedMode === 'stacked'),
        details: {
          ...details,
          ...after
        }
      };
    });

    await phase(page, report, outputDir, '04-live-carry-and-supported-stack', async () => {
      await resetBaseline(page);
      const setup = await setupLiveCarryAndSupportedStack(page);
      const details = await page.evaluate((setupState) => {
        const state = gameCore.getGameState();
        const stackedBlock = (state.blocks || []).find(entry => entry.id === setupState?.stackedBlockId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === setupState?.carryBlockId) || null;
        if (!stackedBlock || !carryBlock) return null;

        const stackedPhysics = physicsSystem.getEntityState?.(stackedBlock.id) || null;
        const carryPhysics = physicsSystem.getEntityState?.(carryBlock.id) || null;
        const supportContext = physicsSystem.getBlockSupportContext?.(stackedBlock, state) || null;

        return {
          states: [
            {
              id: stackedBlock.id,
              stackIndex: stackedBlock.stackIndex,
              lastPlacedMode: stackedBlock.lastPlacedMode,
              occupancyState: stackedBlock.objectProfile?.occupancyState || null,
              supportState: stackedPhysics?.diagnostics?.supportState || null
            },
            {
              id: carryBlock.id,
              stackIndex: carryBlock.stackIndex,
              lastPlacedMode: carryBlock.lastPlacedMode,
              occupancyState: carryBlock.objectProfile?.occupancyState || null,
              supportState: carryPhysics?.diagnostics?.supportState || null
            }
          ],
          supportContext
        };
      }, setup);

      return {
        pass:
          !!setup &&
          !!details &&
          details.states.some(entry =>
            entry.stackIndex === 1
            && entry.lastPlacedMode === 'stacked'
            && entry.occupancyState === 'stacked'
            && entry.supportState === 'supported'
          ) &&
          details.states.some(entry =>
            entry.occupancyState === 'carried'
            && entry.supportState === 'carried'
          ) &&
          details.supportContext?.supportState === 'supported',
        details: { setup, ...details }
      };
    });

    await phase(page, report, outputDir, '05-spatial-shell-badges', async () => {
      await resetBaseline(page);
      const setup = await setupLiveCarryAndSupportedStack(page, { enableDebug: true });
      const details = await page.evaluate((setupState) => {
        const state = gameCore.getGameState();
        const butterfly = (state.butterflies || []).find(entry => entry.id === setupState?.butterflyId) || null;
        const carryBlock = (state.blocks || []).find(entry => entry.id === setupState?.carryBlockId) || null;
        if (butterfly && carryBlock) {
          objectSystem.pickupObject?.(carryBlock.id, butterfly.id);
          carryBlock.pickupBy?.(butterfly);
          butterfly.blockInteraction.carryingBlockId = carryBlock.id;
          butterfly.blockInteraction.cooldownFrames = 999;
          butterfly.updateCarriedBlockPose?.(carryBlock);
          physicsSystem.applyCarriedBlockAnchor?.(butterfly, carryBlock);
          objectSystem.update(state);
        }
        gameCore.setDebugEnabled?.(true);
        renderManager.drawSpatialShellOverlay?.(renderManager.layers?.ui, state, { debugEnabled: true });
        return {
          renderOverlay: renderManager.spatialShellOverlayState || null,
          debugSpatial: debugUI?.buildSpatialFocusSnapshot?.(state) || debugUI?.lastSpatialFocusSummary || null
        };
      }, setup);
      const badgeEntries = details.renderOverlay?.blockBadges || [];
      return {
        pass:
          !!setup &&
          details.renderOverlay?.focusId === setup.butterflyId &&
          badgeEntries.some(entry => entry.entityId === setup.stackedBlockId && entry.label.includes('STACK')) &&
          badgeEntries.some(entry => entry.entityId === setup.carryBlockId && entry.label === 'CARRY') &&
          details.debugSpatial?.focusId === setup.butterflyId &&
          details.debugSpatial?.linkedId === setup.carryBlockId,
        details: { setup, details }
      };
    });

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      reportPath: path.join(outputDir, 'report.json'),
      overall: report.overall
    }, null, 2));
    if (report.overall === 'fail') process.exitCode = 2;
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
