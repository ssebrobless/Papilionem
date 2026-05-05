const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'environment_pollen_propagation_audit');
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
      const zoneId = 'moss-hollow';
      const events = [];
      const eventNames = ['pollen:charged', 'pollen:charge-consumed', 'pollen:planted', 'pollen:handoff', 'pollen:expired'];
      for (const eventName of eventNames) {
        eventBus.on(eventName, payload => events.push({ eventName, payload }));
      }
      const cell = (u, v, h = 0) => ({ zoneId, u, v, h });
      const screen = (u, v) => renderManager.boardToScreen(cell(u, v, 0));
      const countEvents = eventName => events.filter(event => event.eventName === eventName).length;
      const findOpenCell = (startU, startV) => {
        for (let radius = 0; radius <= 8; radius += 1) {
          for (let du = -radius; du <= radius; du += 1) {
            for (let dv = -radius; dv <= radius; dv += 1) {
              if (radius > 0 && Math.max(Math.abs(du), Math.abs(dv)) !== radius) continue;
              const u = startU + du;
              const v = startV + dv;
              const point = screen(u, v);
              if (!point) continue;
              const occupancy = structureSystem.canOccupyBoardCell?.({ zoneId, u, v, h: 0, occupantType: 'flower' });
              if (occupancy?.accepted) return { u, v, point };
            }
          }
        }
        return null;
      };
      const removeZoneFlowers = () => {
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          if (gameCore.getEntityZoneId(flower, null) === zoneId) {
            gameCore.removeFlowerFromGame?.(flower, 'pollen-propagation-audit-reset');
          }
        }
      };
      const clearCell = (u, v) => {
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          const objectCell = structureSystem.getEntityObjectCell?.(flower, { zoneId, h: 0 });
          if (objectCell?.zoneId === zoneId && objectCell.u === u && objectCell.v === v) {
            gameCore.removeFlowerFromGame?.(flower, 'pollen-propagation-audit-cell-reset');
          }
        }
        gameCore.gameState.pendingPollenPlantings = (gameCore.gameState.pendingPollenPlantings || []).filter(planting => {
          const pollenCell = structureSystem.getPollenPlantingCell?.(planting, { zoneId });
          return !(pollenCell?.zoneId === zoneId && pollenCell.u === u && pollenCell.v === v);
        });
      };
      const spawnFlowerAtCell = (u, v, options = {}) => {
        clearCell(u, v);
        const point = screen(u, v);
        return gameCore.spawnFlowerAt(zoneId, point.x, point.y, {
          exactPoint: true,
          ignoreZoneFlowerCap: true,
          minDistance: 0,
          ...options
        });
      };
      const butterflies = gameCore.gameState.butterflies || [];
      const donor = butterflies[0];
      const recipient = butterflies[1];
      if (!donor || !recipient) {
        add('audit-has-two-butterflies', false, { butterflyCount: butterflies.length });
        return assertions;
      }
      gameCore.gameState.butterflies = [donor, recipient];
      removeZoneFlowers();
      donor.currentZoneId = zoneId;
      recipient.currentZoneId = zoneId;
      Object.assign(donor, screen(18, 14));
      Object.assign(recipient, screen(19, 14));
      donor.boardPos = cell(18, 14, 0);
      recipient.boardPos = cell(19, 14, 0);
      donor.state = 'normal';
      recipient.state = 'normal';
      donor.zoneTravel = null;
      recipient.zoneTravel = null;
      donor.movement?.clearTarget?.();
      recipient.movement?.clearTarget?.();
      donor.pollenInventory = null;
      recipient.pollenInventory = null;

      const feedingFlower = spawnFlowerAtCell(18, 15, { flowerType: 'daisy' });
      donor.feeding.targetFlower = feedingFlower;
      donor.endFeeding?.(gameCore.particleSystem);
      const donorAfterFeed = gameCore.ensureButterflyPollenInventory?.(donor);
      add('feeding-grants-pollen-charge', donorAfterFeed?.charges >= 1 && countEvents('pollen:charged') >= 1, {
        charges: donorAfterFeed?.charges || 0,
        chargedEvents: countEvents('pollen:charged')
      });

      gameCore.grantPollenCharges?.(donor, feedingFlower, { charges: 2, reason: 'audit-top-up' });
      donor.pendingPollenDropTarget = null;
      donor.movement?.clearTarget?.();
      const maxed = gameCore.ensureButterflyPollenInventory?.(donor);
      add('pollen-charges-cap-at-two', maxed?.charges === 2, { charges: maxed?.charges || 0, maxCharges: maxed?.maxCharges || 0 });

      const handoffBefore = countEvents('pollen:handoff');
      const handed = gameCore.transferPollenCharge?.(donor, recipient, { reason: 'audit-handoff' });
      const donorAfterHandoff = gameCore.ensureButterflyPollenInventory?.(donor);
      const recipientAfterHandoff = gameCore.ensureButterflyPollenInventory?.(recipient);
      add('pollen-handoff-transfers-one-charge', handed === true
        && donorAfterHandoff?.charges === 1
        && recipientAfterHandoff?.charges === 1
        && !!recipient.pendingPollenDropTarget
        && countEvents('pollen:handoff') === handoffBefore + 1, {
        donorCharges: donorAfterHandoff?.charges || 0,
        recipientCharges: recipientAfterHandoff?.charges || 0,
        recipientDropTarget: recipient.pendingPollenDropTarget || null,
        handoffEvents: countEvents('pollen:handoff')
      });

      const pendingBefore = (gameCore.gameState.pendingPollenPlantings || []).length;
      const plantedBefore = countEvents('pollen:planted');
      let recipientPlanting = null;
      for (let frame = 0; frame < 6000 && !recipientPlanting; frame += 1) {
        gameCore.update();
        recipientPlanting = (gameCore.gameState.pendingPollenPlantings || []).find(entry =>
          entry?.butterflyId === recipient.id
        ) || null;
      }
      const pendingAfter = (gameCore.gameState.pendingPollenPlantings || []).length;
      const recipientAfterPlant = gameCore.ensureButterflyPollenInventory?.(recipient);
      const planting = recipientPlanting;
      const recipientTargetBoard = recipient.getMovementTargetBoardPos?.() || null;
      const recipientBoard = recipient.ensureBoardPos?.() || recipient.boardPos || null;
      add('handoff-recipient-travels-and-plants-pollen', countEvents('pollen:planted') === plantedBefore + 1
        && pendingAfter >= pendingBefore + 1
        && recipientAfterPlant?.charges === 0
        && planting?.butterflyId === recipient.id, {
        pendingBefore,
        pendingAfter,
        recipientCharges: recipientAfterPlant?.charges || 0,
        recipientId: recipient.id,
        recipientBoard,
        recipientTargetBoard,
        recipientPendingTarget: recipient.pendingPollenDropTarget || null,
        recipientTargetType: recipient.movement?.targetType || null,
        distanceToTarget: recipient.getDistanceToMovementTarget?.() ?? null,
        planting: planting ? { id: planting.id, boardPos: planting.boardPos, framesRemaining: planting.framesRemaining } : null
      });

      if (planting) {
        planting.framesRemaining = 1;
        gameCore.updatePollenPlantings?.();
      }
      const bloomedFlower = (gameCore.gameState.flowers || []).find(flower => {
        const objectCell = structureSystem.getEntityObjectCell?.(flower, { zoneId, h: 0 });
        return objectCell?.zoneId === planting?.zoneId && objectCell.u === planting?.boardPos?.u && objectCell.v === planting?.boardPos?.v
          && (flower.lifecycleKind || 'flower') === 'flower';
      });
      add('pollen-patch-blooms-into-flower-at-reserved-cell', !!bloomedFlower, {
        flowerId: bloomedFlower?.id || null
      });

      const reserveCell = findOpenCell(22, 15);
      const reserveFlower = reserveCell ? spawnFlowerAtCell(reserveCell.u, reserveCell.v, {
        flowerType: 'tulip',
        allowFlowerOverlap: true
      }) : null;
      recipient.pollenInventory = null;
      const reserve = gameCore.convertFlowerToReserveFood?.(reserveFlower, recipient, { source: 'audit-reserve' });
      const recipientAfterReserve = gameCore.ensureButterflyPollenInventory?.(recipient);
      add('reserve-food-conversion-grants-pollen', reserve?.lifecycleKind === 'reserve-food-ball'
        && recipientAfterReserve?.charges >= 1, {
        reserveCell,
        reserveId: reserve?.id || null,
        recipientCharges: recipientAfterReserve?.charges || 0
      });

      recipient.pollenInventory.expiresAtFrame = Math.max(0, (gameCore.getCurrentFrame?.() || 0) - 1);
      const expiredBefore = countEvents('pollen:expired');
      gameCore.updateButterflyPollenInventories?.();
      const recipientAfterExpiry = gameCore.ensureButterflyPollenInventory?.(recipient);
      add('pollen-charges-expire-after-ttl', recipientAfterExpiry?.charges === 0
        && countEvents('pollen:expired') === expiredBefore + 1, {
        recipientCharges: recipientAfterExpiry?.charges || 0,
        expiredEvents: countEvents('pollen:expired')
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
