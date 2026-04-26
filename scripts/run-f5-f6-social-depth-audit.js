const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'f5_f6_social_depth_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];

const CASUAL_SUBTYPES = new Set([
  'check_in',
  'shared_observation',
  'playful_banter',
  'gentle_tease',
  'quiet_companionship',
  'small_praise',
  'light_irritation',
  'soft_repair'
]);

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
    gameUI.activityLogPanel.visible = true;
    gameUI.activityLogPanel.followLatest = true;
    gameUI.activityLogPanel.scrollOffset = 0;
    gameUI.activityLogPanel.filters = {
      talk: true,
      actions: true,
      learn: true
    };
    gameUI.activityLogCache = { key: null, entries: [] };
    gameUI.resumeLatestFeedView?.();
    gameUI.inspectPanel.visible = false;
    gameUI.clearInspectSelection?.(gameCore.getGameState());
    eventBus.clearHistory?.();
    if (typeof communicationSystem !== 'undefined') {
      communicationSystem.history = [];
      communicationSystem.dialogueHistory = [];
      communicationSystem.simulationClockSeconds = 0;
      communicationSystem.responseQueue = [];
    }
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

async function configurePair(page, mode = 'warm') {
  return page.evaluate((requestedMode) => {
    const state = gameCore.getGameState();
    const zoneId = state.focusedZoneId;
    const pair = (gameCore.getButterfliesInZone(zoneId) || []).slice(0, 2);
    if (pair.length < 2) {
      return { ok: false, reason: 'not-enough-butterflies' };
    }

    const [left, right] = pair;
    left.x = 520;
    left.y = 420;
    right.x = 538;
    right.y = 426;
    left.gridPos = gridManager.screenToIso(left.x, left.y + (left.shadowOffset || 0));
    right.gridPos = gridManager.screenToIso(right.x, right.y + (right.shadowOffset || 0));
    left.updateZIndex?.();
    right.updateZIndex?.();

    ensureLifeSocialEdge(left, right.id);
    ensureLifeSocialEdge(right, left.id);

    const presets = requestedMode === 'strained'
      ? {
          left: { trust: 0.28, comfort: 0.22, attachment: 0.08, admiration: 0.05, resentment: 0.66, rejectionWeight: 0.42 },
          right: { trust: 0.32, comfort: 0.26, attachment: 0.06, admiration: 0.04, resentment: 0.62, rejectionWeight: 0.36 }
        }
      : {
          left: { trust: 0.82, comfort: 0.86, attachment: 0.76, admiration: 0.44, resentment: 0.04, rejectionWeight: 0.02 },
          right: { trust: 0.84, comfort: 0.88, attachment: 0.74, admiration: 0.47, resentment: 0.03, rejectionWeight: 0.01 }
        };

    Object.assign(left.lifeSim.socialEdges[right.id], presets.left);
    Object.assign(right.lifeSim.socialEdges[left.id], presets.right);

    left.lifeSim.communication.expressiveness = 0.95;
    left.lifeSim.communication.receptivity = 0.95;
    left.lifeSim.interpretation.clarity = 0.95;
    right.lifeSim.communication.expressiveness = 0.95;
    right.lifeSim.communication.receptivity = 0.95;
    right.lifeSim.interpretation.clarity = 0.95;

    left.lifeSim.social.belonging = requestedMode === 'strained' ? 0.16 : 0.2;
    left.lifeSim.social.confidence = requestedMode === 'strained' ? 0.14 : 0.2;
    left.lifeSim.emotions.agitation = requestedMode === 'strained' ? 0.34 : 0.18;
    left.lifeSim.emotions.attachment = 0;
    left.lifeSim.emotions.relief = 0;
    left.lifeSim.emotions.rejection = 0;

    eventBus.clearHistory?.();
    communicationSystem.history = [];
    communicationSystem.dialogueHistory = [];
    communicationSystem.responseQueue = [];
    gameUI.activityLogCache = { key: null, entries: [] };

    return {
      ok: true,
      zoneId,
      leftId: left.id,
      rightId: right.id,
      leftLabel: left.displayName || left.name || left.id,
      rightLabel: right.displayName || right.name || right.id
    };
  }, mode);
}

async function emitDialogue(page, sourceId, targetId, zoneId, signalType = 'acknowledgement_signal') {
  return page.evaluate(({ sourceId: source, targetId: target, zoneId: zone, signalType: signal }) => {
    eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
      sourceId: source,
      targetId: target,
      zoneId: zone,
      signalType: signal
    });
    communicationSystem.update(gameCore.getGameState(), 0.25);
    gameUI.activityLogCache = { key: null, entries: [] };
    const latestDialogue = communicationSystem.dialogueHistory[communicationSystem.dialogueHistory.length - 1] || null;
    return latestDialogue ? {
      id: latestDialogue.id,
      intentSubtype: latestDialogue.intentSubtype,
      pairMode: latestDialogue.pairMode,
      phrase: latestDialogue.phrase
    } : null;
  }, { sourceId, targetId, zoneId, signalType });
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

    await phase(page, report, outputDir, '01-threaded-exchange-feed', async () => {
      await resetBaseline(page);
      const pair = await configurePair(page, 'warm');
      if (!pair.ok) {
        return { pass: false, details: pair };
      }

      await emitDialogue(page, pair.leftId, pair.rightId, pair.zoneId);
      await emitDialogue(page, pair.rightId, pair.leftId, pair.zoneId);

      const details = await page.evaluate(() => {
        const feedEntries = gameUI.getRecentActivityEntries();
        const talkEntries = feedEntries.filter(entry => entry.category === 'talk');
        const thread = [...talkEntries].reverse().find(entry => Array.isArray(entry.threadLines) && entry.threadLines.length >= 2) || null;
        return {
          dialogueCount: communicationSystem.dialogueHistory.length,
          talkEntryCount: talkEntries.length,
          thread: thread ? {
            headline: thread.headline,
            detail: thread.detail,
            pairModeLabel: thread.pairModeLabel,
            threadLines: thread.threadLines
          } : null
        };
      });

      return {
        pass:
          details.dialogueCount >= 2
          && !!details.thread
          && (details.thread.headline || '').includes('<->')
          && (details.thread.threadLines?.length || 0) >= 2,
        details
      };
    });

    await phase(page, report, outputDir, '02-casual-subtype-selection', async () => {
      await resetBaseline(page);
      const pair = await configurePair(page, 'warm');
      if (!pair.ok) {
        return { pass: false, details: pair };
      }

      const dialogue = await emitDialogue(page, pair.leftId, pair.rightId, pair.zoneId);
      const details = await page.evaluate(() => {
        const latest = communicationSystem.dialogueHistory[communicationSystem.dialogueHistory.length - 1] || null;
        return latest ? {
          intentSubtype: latest.intentSubtype,
          pairMode: latest.pairMode,
          intentTags: latest.intentTags || [],
          phrase: latest.phrase
        } : null;
      });

      return {
        pass: !!dialogue && !!details && CASUAL_SUBTYPES.has(details.intentSubtype),
        details
      };
    });

    await phase(page, report, outputDir, '03-pair-texture-accumulation', async () => {
      await resetBaseline(page);
      const pair = await configurePair(page, 'warm');
      if (!pair.ok) {
        return { pass: false, details: pair };
      }

      const before = await page.evaluate(({ leftId, rightId }) => {
        const entity = gameCore.getGameState().butterflies.find(item => item.id === leftId);
        const edge = entity?.lifeSim?.socialEdges?.[rightId] || null;
        return edge ? {
          trust: edge.trust || 0,
          comfort: edge.comfort || 0,
          recentWarmth: edge.recentWarmth || 0,
          recentEase: edge.recentEase || 0,
          recentFriction: edge.recentFriction || 0,
          recentMutualAttention: edge.recentMutualAttention || 0
        } : null;
      }, { leftId: pair.leftId, rightId: pair.rightId });

      await emitDialogue(page, pair.rightId, pair.leftId, pair.zoneId);

      const details = await page.evaluate(({ leftId, rightId }) => {
        const entity = gameCore.getGameState().butterflies.find(item => item.id === leftId);
        const edge = entity?.lifeSim?.socialEdges?.[rightId] || null;
        const summary = communicationSystem.getPrimaryRelationshipSummary(leftId);
        return {
          edge: edge ? {
            trust: edge.trust || 0,
            comfort: edge.comfort || 0,
            recentWarmth: edge.recentWarmth || 0,
            recentEase: edge.recentEase || 0,
            recentFriction: edge.recentFriction || 0,
            recentMutualAttention: edge.recentMutualAttention || 0,
            lastConversationMode: edge.lastConversationMode || null
          } : null,
          summary
        };
      }, { leftId: pair.leftId, rightId: pair.rightId });

      return {
        pass:
          !!before
          && !!details.edge
          && details.edge.recentWarmth > before.recentWarmth
          && details.edge.recentEase > before.recentEase
          && details.edge.recentMutualAttention > before.recentMutualAttention
          && details.edge.lastConversationMode === 'tender',
        details: { before, after: details }
      };
    });

    await phase(page, report, outputDir, '04-life-sim-follow-through', async () => {
      await resetBaseline(page);
      const pair = await configurePair(page, 'warm');
      if (!pair.ok) {
        return { pass: false, details: pair };
      }

      const before = await page.evaluate(({ leftId }) => {
        const entity = gameCore.getGameState().butterflies.find(item => item.id === leftId);
        return entity ? {
          belonging: entity.lifeSim?.social?.belonging || 0,
          confidence: entity.lifeSim?.social?.confidence || 0,
          relief: entity.lifeSim?.emotions?.relief || 0,
          attachment: entity.lifeSim?.emotions?.attachment || 0,
          wanderScale: entity.lifeSim?.derived?.behaviorBiases?.wanderScale ?? 1
        } : null;
      }, { leftId: pair.leftId });

      await emitDialogue(page, pair.rightId, pair.leftId, pair.zoneId);

      const details = await page.evaluate(({ leftId }) => {
        const state = gameCore.getGameState();
        lifeSimSystem.update(state, 1 / 60);
        const entity = state.butterflies.find(item => item.id === leftId);
        const relationship = communicationSystem.getPrimaryRelationshipSummary(leftId);
        return entity ? {
          belonging: entity.lifeSim?.social?.belonging || 0,
          confidence: entity.lifeSim?.social?.confidence || 0,
          relief: entity.lifeSim?.emotions?.relief || 0,
          attachment: entity.lifeSim?.emotions?.attachment || 0,
          wanderScale: entity.lifeSim?.derived?.behaviorBiases?.wanderScale ?? 1,
          relationship
        } : null;
      }, { leftId: pair.leftId });

      return {
        pass:
          !!before
          && !!details
          && details.belonging > before.belonging
          && details.confidence >= (before.confidence - 0.01)
          && details.attachment >= before.attachment
          && details.relief > before.relief,
        details: { before, after: details }
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
