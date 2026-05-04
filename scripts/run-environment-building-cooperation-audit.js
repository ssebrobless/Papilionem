const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'environment_building_cooperation_audit');
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
      const cell = (u, v, h = 0) => ({ zoneId, u, v, h });
      const screen = (u, v, h = 0) => renderManager.boardToScreen(cell(u, v, h));

      const clearZone = () => {
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          if (gameCore.getEntityZoneId(flower, null) === zoneId) {
            gameCore.removeFlowerFromGame?.(flower, 'building-cooperation-audit-reset');
          }
        }
        for (const block of [...(gameCore.gameState.blocks || [])]) {
          const blockCell = structureSystem.getBlockCell?.(block, { zoneId });
          if (blockCell?.zoneId === zoneId) {
            gameCore.entityManager?.removeEntity?.('blocks', block);
            gameCore.unregisterEntityFromFoundationSystems?.(block);
            gameCore.gameState.blocks = (gameCore.gameState.blocks || []).filter(entry => entry?.id !== block.id);
          }
        }
      };

      const spawnBlockAt = (u, v, h = 0, supportBlock = null) => {
        const point = screen(u, v, h);
        const block = gameCore.godSpawnBlock?.(zoneId, point.x, point.y);
        block.supportBlockId = supportBlock?.id || null;
        block.applyBoardCell?.({ accepted: true, zoneId, u, v, h }, { requireAccepted: false });
        return block;
      };

      const moveButterflyToCell = (butterfly, u, v) => {
        const point = screen(u, v, 0);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.x = point.x;
        butterfly.y = point.y;
        butterfly.boardPos = cell(u, v, 0);
        butterfly.gridPos = { x: u, y: v };
        butterfly.syncBoardPosFromScreen?.({ zoneId });
      };

      const ensureEdgePair = (left, right, values = {}) => {
        const leftEdge = ensureLifeSocialEdge?.(left, right.id);
        const rightEdge = ensureLifeSocialEdge?.(right, left.id);
        Object.assign(leftEdge, values);
        Object.assign(rightEdge, values);
        return { leftEdge, rightEdge };
      };

      clearZone();
      const [requester, helper] = gameCore.gameState.butterflies || [];
      if (!requester || !helper) {
        add('audit-has-two-butterflies', false, { butterflyCount: (gameCore.gameState.butterflies || []).length });
        return assertions;
      }

      moveButterflyToCell(requester, 20, 16);
      moveButterflyToCell(helper, 22, 16);
      requester.lifeSim.drives.rest = 0.88;
      requester.lifeSim.emotions.exhaustion = 0.74;
      requester.lifeSim.derived = requester.lifeSim.derived || {};
      requester.lifeSim.derived.behaviorBiases = requester.lifeSim.derived.behaviorBiases || {};
      requester.lifeSim.derived.behaviorBiases.shelterSeeking = 0.94;
      requester.lifeSim.derived.behaviorBiases.objectInterest = 0.72;
      helper.lifeSim.emotions.curiosity = 0.5;
      helper.lifeSim.drives.exploration = 0.42;
      helper.lifeSim.derived = helper.lifeSim.derived || {};
      helper.lifeSim.derived.behaviorBiases = helper.lifeSim.derived.behaviorBiases || {};
      helper.lifeSim.derived.behaviorBiases.objectInterest = 0.7;
      helper.blockInteraction.cooldownFrames = 0;
      requester.blockInteraction.cooldownFrames = 0;
      ensureEdgePair(requester, helper, {
        trust: 0.72,
        comfort: 0.7,
        attachment: 0.5,
        admiration: 0.22,
        bondTier: 'companion',
        followThroughScore: 0.12,
        recentWarmth: 0.12
      });

      const baseBlock = spawnBlockAt(20, 15, 0);
      const requesterBlock = spawnBlockAt(21, 16, 0);
      const helperBlock = spawnBlockAt(22, 16, 0);
      requesterBlock.pickupBy?.(requester);
      requester.blockInteraction.carryingBlockId = requesterBlock.id;
      requester.blockInteraction.carryFrames = 12;
      structureSystem.rebuild?.(gameCore.gameState);
      structureSystem.lastRebuildSignature = structureSystem.buildRebuildSignature?.(gameCore.gameState);

      const requesterPlacement = requester.chooseBlockPlacementTarget?.(requesterBlock, gameCore.gameState.blocks || []);
      add('requester-has-shade-building-target', requesterPlacement?.shadeIntent?.createsShade === true, {
        requesterPlacement
      });

      const emitted = communicationSystem.updateShadeBuildingCooperation?.(gameCore.gameState, gameCore.getCurrentFrame?.() || 0, { force: true });
      const requestEvent = (eventBus.getHistory?.('building:cooperation-requested') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.requesterId === requester.id)
        .slice(-1)[0] || null;
      const received = (helper.lifeSim.communication?.recentReceived || []).find(entry =>
        entry?.metadata?.reason === 'shade-building-help'
        && entry?.sourceId === requester.id
      ) || null;
      add('cooperation-request-emitted', emitted >= 1 && !!requestEvent && requestEvent.helperIds?.includes?.(helper.id), {
        emitted,
        requestEvent
      });
      add('helper-receives-human-readable-building-request', !!received
        && /block/i.test(received.phrase || '')
        && /shade/i.test(received.phrase || '')
        && !/air shifted|covered edge/i.test(received.phrase || ''), {
        received
      });

      helper.checkBlockExperimentation?.(gameCore.gameState.blocks || []);
      const acceptedEvent = (eventBus.getHistory?.('building:helper-accepted') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.helperId === helper.id && event?.requesterId === requester.id)
        .slice(-1)[0] || null;
      add('helper-accepts-building-help', helper.blockInteraction?.buildingAssist?.requesterId === requester.id
        && helper.blockInteraction?.carryingBlockId === helperBlock.id
        && !!acceptedEvent, {
        buildingAssist: helper.blockInteraction?.buildingAssist || null,
        carryingBlockId: helper.blockInteraction?.carryingBlockId || null,
        helperBlockId: helperBlock.id,
        acceptedEvent
      });

      const helperPlacement = helper.blockInteraction?.placementTarget || helper.chooseBlockPlacementTarget?.(helperBlock, gameCore.gameState.blocks || []);
      if (helperPlacement) {
        helper.x = helperPlacement.x;
        helper.y = helperPlacement.y;
        helper.syncBoardPosFromScreen?.({ zoneId });
      }
      const placed = helper.placeCarriedBlock?.(helperBlock, zoneId);
      structureSystem.rebuild?.(gameCore.gameState);
      structureSystem.lastRebuildSignature = structureSystem.buildRebuildSignature?.(gameCore.gameState);

      const followEvent = (eventBus.getHistory?.('building:cooperation-followthrough') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.helperId === helper.id && event?.requesterId === requester.id)
        .slice(-1)[0] || null;
      const helperEdge = helper.lifeSim.socialEdges?.[requester.id] || {};
      const requesterEdge = requester.lifeSim.socialEdges?.[helper.id] || {};
      const shadeColumn = (structureSystem.getShadeColumnsForZoneProfile?.(structureSystem.getZoneProfileRef?.(zoneId)) || [])
        .find(column => column.sourceBlockId === helperBlock.id) || null;
      const helperMemory = (helper.lifeSim.memories?.object || [])
        .find(memory => memory?.subjectId === helperBlock.id && memory?.metadata?.assistedRequesterId === requester.id) || null;

      add('helper-production-placement-creates-shade', placed === true && !!shadeColumn, {
        placed,
        shadeColumn,
        helperPlacement
      });
      add('cooperation-followthrough-updates-social-edges', !!followEvent
        && (helperEdge.historyTags || []).includes('shade-building-cooperation')
        && (requesterEdge.historyTags || []).includes('shade-building-cooperation')
        && (helperEdge.followThroughScore || 0) > 0.12
        && (requesterEdge.followThroughScore || 0) > 0.12, {
        followEvent,
        helperEdge,
        requesterEdge
      });
      add('helper-remembers-assisted-shade-building', !!helperMemory, {
        helperMemory
      });

      return assertions;
    });

    report.overall = report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      && report.assertions.every(assertion => assertion.pass)
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
  } finally {
    if (browser) await browser.close();
    report.completedAt = new Date().toISOString();
    report.reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath: report.reportPath,
      assertions: report.assertions.map(assertion => ({ id: assertion.id, pass: assertion.pass })),
      pageErrors: report.pageErrors.length,
      consoleErrors: report.consoleErrors.length
    }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
