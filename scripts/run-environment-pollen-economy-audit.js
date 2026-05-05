const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'environment_pollen_economy_audit');
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
    gameUI.firstSessionGuide.visible = false;
    gameUI.activityLogPanel.visible = true;
    gameUI.activityLogPanel.maxEntries = Math.max(gameUI.activityLogPanel.maxEntries || 0, 80);
    gameUI.activityLogPanel.filters = {
      talk: true,
      action: true,
      learn: true,
      warning: true,
      system: true
    };
    gameUI.normalizeActivityLogFilters?.();
    gameUI.activityLogCache = { key: null, entries: [] };
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
    details: null,
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

    const result = await page.evaluate(async () => {
      const assertions = [];
      const add = (id, pass, details = {}) => assertions.push({ id, pass: !!pass, details });
      const zoneId = 'moss-hollow';
      const events = [];
      const eventNames = ['pollen:charged', 'pollen:handoff', 'pollen:planted', 'pollen:bloomed', 'pollen:expired'];
      for (const eventName of eventNames) {
        eventBus.on(eventName, payload => events.push({
          eventName,
          frame: gameCore.getCurrentFrame?.() || 0,
          payload: JSON.parse(JSON.stringify(payload || {}))
        }));
      }
      const countEvents = eventName => events.filter(event => event.eventName === eventName).length;
      const uniquePayloadIds = (eventName, key) => new Set(events
        .filter(event => event.eventName === eventName)
        .map(event => event.payload?.[key])
        .filter(Boolean)
      ).size;
      const cell = (u, v, h = 0) => ({ zoneId, u, v, h });
      const screen = (u, v) => renderManager.boardToScreen(cell(u, v, 0));
      const removeZoneFlowers = () => {
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          if (gameCore.getEntityZoneId(flower, null) === zoneId) {
            gameCore.removeFlowerFromGame?.(flower, 'pollen-economy-audit-reset');
          }
        }
      };
      const clearCell = (u, v) => {
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          const objectCell = structureSystem.getEntityObjectCell?.(flower, { zoneId, h: 0 });
          if (objectCell?.zoneId === zoneId && objectCell.u === u && objectCell.v === v) {
            gameCore.removeFlowerFromGame?.(flower, 'pollen-economy-audit-cell-reset');
          }
        }
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

      const butterflies = (gameCore.gameState.butterflies || []).slice(0, 6);
      gameCore.gameState.butterflies = butterflies;
      removeZoneFlowers();
      gameCore.gameState.pendingPollenPlantings = [];
      const placements = [
        [18, 14], [19, 14], [18, 15],
        [20, 14], [20, 15], [19, 16]
      ];
      butterflies.forEach((butterfly, index) => {
        const [u, v] = placements[index] || [18 + index, 14];
        Object.assign(butterfly, screen(u, v));
        butterfly.boardPos = cell(u, v, 0);
        butterfly.currentZoneId = zoneId;
        butterfly.state = 'normal';
        butterfly.zoneTravel = null;
        butterfly.pendingPollenDropTarget = null;
        butterfly.pollenInventory = null;
        butterfly.movement?.clearTarget?.();
      });

      const seededFlowers = [
        spawnFlowerAtCell(17, 14, { flowerType: 'daisy' }),
        spawnFlowerAtCell(21, 15, { flowerType: 'tulip' }),
        spawnFlowerAtCell(19, 17, { flowerType: 'clover' })
      ].filter(Boolean);
      gameCore.grantPollenCharges?.(butterflies[0], seededFlowers[0], { charges: 2, reason: 'economy-audit-fed' });
      gameCore.grantPollenCharges?.(butterflies[3], seededFlowers[1], { charges: 2, reason: 'economy-audit-fed' });

      let feedLinesAfterHandoff = [];
      let feedLinesAfterPlanting = [];
      let feedLinesAfterBloom = [];
      const sampleFeedLines = () => {
        gameUI.activityLogPanel.maxEntries = Math.max(gameUI.activityLogPanel.maxEntries || 0, 80);
        gameUI.activityLogCache = { key: null, entries: [] };
        return (gameUI.getRecentActivityEntries?.() || [])
          .map(entry => entry?.line || '')
          .filter(Boolean);
      };
      for (let frame = 0; frame < 3600; frame += 1) {
        gameCore.update();
        if (!feedLinesAfterHandoff.length && countEvents('pollen:handoff') >= 2) {
          feedLinesAfterHandoff = sampleFeedLines();
        }
        if (!feedLinesAfterPlanting.length && countEvents('pollen:planted') >= 2) {
          feedLinesAfterPlanting = sampleFeedLines();
        }
        if (!feedLinesAfterBloom.length && countEvents('pollen:bloomed') >= 2) {
          feedLinesAfterBloom = sampleFeedLines();
        }
      }

      const feedLines = sampleFeedLines();
      const feedLinesAtPollen = [
        ...feedLinesAfterHandoff,
        ...feedLinesAfterPlanting,
        ...feedLinesAfterBloom
      ];
      const plantedCells = events
        .filter(event => event.eventName === 'pollen:planted')
        .map(event => event.payload?.boardPos)
        .filter(Boolean);
      const bloomedCells = events
        .filter(event => event.eventName === 'pollen:bloomed')
        .map(event => event.payload?.boardPos)
        .filter(Boolean);

      add('economy-produces-multiple-handoffs', countEvents('pollen:handoff') >= 2, {
        handoffCount: countEvents('pollen:handoff'),
        donorCount: uniquePayloadIds('pollen:handoff', 'sourceId'),
        recipientCount: uniquePayloadIds('pollen:handoff', 'recipientId')
      });
      add('economy-produces-multiple-lived-plantings', countEvents('pollen:planted') >= 2
        && uniquePayloadIds('pollen:planted', 'butterflyId') >= 2, {
        plantedCount: countEvents('pollen:planted'),
        planterCount: uniquePayloadIds('pollen:planted', 'butterflyId'),
        plantedCells
      });
      add('economy-produces-multiple-blooms', countEvents('pollen:bloomed') >= 2, {
        bloomedCount: countEvents('pollen:bloomed'),
        bloomedCells
      });
      add('economy-feed-remains-human-readable', feedLinesAtPollen.some(line => /passed pollen to/i.test(line))
        && feedLinesAtPollen.some(line => /planted pollen for a new flower/i.test(line))
        && feedLinesAtPollen.some(line => /planted flower bloomed/i.test(line))
        && feedLinesAtPollen.every(line => !/\b(?:grid|cell|runtime|telemetry|packet)\b/i.test(line)), {
        feedLinesAfterHandoff: feedLinesAfterHandoff.slice(-12),
        feedLinesAfterPlanting: feedLinesAfterPlanting.slice(-12),
        feedLinesAfterBloom: feedLinesAfterBloom.slice(-12),
        finalFeedLines: feedLines.slice(-16)
      });

      return {
        assertions,
        details: {
          eventCounts: Object.fromEntries(eventNames.map(eventName => [eventName, countEvents(eventName)])),
          eventSample: events.slice(0, 20),
          feedLinesAfterHandoff: feedLinesAfterHandoff.slice(-12),
          feedLinesAfterPlanting: feedLinesAfterPlanting.slice(-12),
          feedLinesAfterBloom: feedLinesAfterBloom.slice(-12),
          feedLines: feedLines.slice(-16),
          finalPendingPlantings: gameCore.gameState.pendingPollenPlantings.length
        }
      };
    });

    report.assertions = result.assertions;
    report.details = result.details;
    report.screenshot = path.join(outputDir, 'final.png');
    await page.screenshot({ path: report.screenshot, fullPage: true });
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
    eventCounts: report.details?.eventCounts || null,
    pageErrors: report.pageErrors.length,
    consoleErrors: report.consoleErrors.length
  }, null, 2));

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
