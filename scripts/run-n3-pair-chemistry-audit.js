const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'n3_pair_chemistry_audit');
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
  await page.evaluate(async (keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
    await gameCore.resetGame(true);
    eventBus.clearHistory?.();
    if (typeof communicationSystem !== 'undefined') {
      communicationSystem.history = [];
      communicationSystem.dialogueHistory = [];
      communicationSystem.responseQueue = [];
      communicationSystem.simulationClockSeconds = 0;
    }
    if (typeof gameUI !== 'undefined') {
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
    }
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.waitForTimeout(700);
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

async function configureTexturePairs(page) {
  return page.evaluate(() => {
    const zoneId = gameCore.getGameState()?.focusedZoneId;
    const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 6);
    if (butterflies.length < 6) {
      return { ok: false, reason: 'not-enough-butterflies' };
    }

    const pairConfigs = [
      {
        key: 'devoted',
        left: butterflies[0],
        right: butterflies[1],
        leftEdge: { trust: 0.88, comfort: 0.9, attachment: 0.82, admiration: 0.34, reciprocityScore: 0.42, followThroughScore: 0.28, recentWarmth: 0.32, recentEase: 0.3, recentMutualAttention: 0.26, recentFriction: 0.02, resentment: 0.02, rejectionWeight: 0.01, forgivenessWeight: 0.12, repairState: 'steady', recentResidues: [], lastDialogueResidue: null },
        rightEdge: { trust: 0.86, comfort: 0.88, attachment: 0.8, admiration: 0.3, reciprocityScore: 0.4, followThroughScore: 0.26, recentWarmth: 0.31, recentEase: 0.28, recentMutualAttention: 0.24, recentFriction: 0.02, resentment: 0.03, rejectionWeight: 0.01, forgivenessWeight: 0.1, repairState: 'steady', recentResidues: [], lastDialogueResidue: null }
      },
      {
        key: 'repairing',
        left: butterflies[2],
        right: butterflies[3],
        leftEdge: { trust: 0.44, comfort: 0.42, attachment: 0.18, admiration: 0.14, reciprocityScore: 0.18, followThroughScore: 0.16, recentWarmth: 0.18, recentEase: 0.14, recentMutualAttention: 0.16, recentFriction: 0.18, resentment: 0.16, rejectionWeight: 0.08, forgivenessWeight: 0.34, repairState: 'repair-open', recentResidues: [{ type: 'accepted-repair' }] },
        rightEdge: { trust: 0.46, comfort: 0.4, attachment: 0.16, admiration: 0.12, reciprocityScore: 0.16, followThroughScore: 0.15, recentWarmth: 0.17, recentEase: 0.13, recentMutualAttention: 0.14, recentFriction: 0.16, resentment: 0.18, rejectionWeight: 0.09, forgivenessWeight: 0.3, repairState: 'offered', recentResidues: [{ type: 'repair-offer' }] }
      },
      {
        key: 'strained',
        left: butterflies[4],
        right: butterflies[5],
        leftEdge: { trust: 0.18, comfort: 0.16, attachment: 0.04, admiration: 0.04, reciprocityScore: 0.02, followThroughScore: 0.02, recentWarmth: 0.04, recentEase: 0.03, recentMutualAttention: 0.06, recentFriction: 0.42, resentment: 0.48, rejectionWeight: 0.26, forgivenessWeight: 0.04, repairState: 'hurt', recentResidues: [], lastDialogueResidue: null },
        rightEdge: { trust: 0.2, comfort: 0.18, attachment: 0.04, admiration: 0.04, reciprocityScore: 0.02, followThroughScore: 0.02, recentWarmth: 0.04, recentEase: 0.03, recentMutualAttention: 0.06, recentFriction: 0.4, resentment: 0.44, rejectionWeight: 0.24, forgivenessWeight: 0.04, repairState: 'hurt', recentResidues: [], lastDialogueResidue: null }
      }
    ];

    const baseX = 448;
    const baseY = 400;
    pairConfigs.forEach((config, index) => {
      const left = config.left;
      const right = config.right;
      left.x = baseX + (index * 110);
      left.y = baseY + (index * 18);
      right.x = left.x + 22;
      right.y = left.y + 8;
      left.gridPos = gridManager.screenToIso(left.x, left.y + (left.shadowOffset || 0));
      right.gridPos = gridManager.screenToIso(right.x, right.y + (right.shadowOffset || 0));
      left.updateZIndex?.();
      right.updateZIndex?.();

      ensureLifeSocialEdge(left, right.id);
      ensureLifeSocialEdge(right, left.id);
      left.lifeSim.socialEdges[right.id] = {
        ...(left.lifeSim.socialEdges[right.id] || {}),
        ...config.leftEdge
      };
      right.lifeSim.socialEdges[left.id] = {
        ...(right.lifeSim.socialEdges[left.id] || {}),
        ...config.rightEdge
      };

      left.lifeSim.communication.activeConversation = {
        partnerId: right.id,
        partnerLabel: right.displayName || right.name || right.id,
        turnCount: 2
      };
      right.lifeSim.communication.activeConversation = {
        partnerId: left.id,
        partnerLabel: left.displayName || left.name || left.id,
        turnCount: 2
      };
      left.lifeSim.communication.expressiveness = 0.95;
      left.lifeSim.communication.receptivity = 0.95;
      left.lifeSim.interpretation.clarity = 0.95;
      right.lifeSim.communication.expressiveness = 0.95;
      right.lifeSim.communication.receptivity = 0.95;
      right.lifeSim.interpretation.clarity = 0.95;
    });

    return {
      ok: true,
      zoneId,
      pairs: pairConfigs.map(config => ({
        key: config.key,
        leftId: config.left.id,
        rightId: config.right.id
      }))
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

    await phase(page, report, outputDir, '01-textures-resolve-distinct-pairs', async () => {
      await resetBaseline(page);
      const configured = await configureTexturePairs(page);
      if (!configured.ok) {
        return { pass: false, details: configured };
      }

      const details = await page.evaluate(({ pairs }) => {
        const results = {};
        for (const pair of pairs) {
          const summary = communicationSystem.getPrimaryRelationshipSummary(pair.leftId);
          results[pair.key] = {
            partnerId: summary?.partnerId || null,
            pairTexture: summary?.pairTexture || null,
            pairTextureLabel: summary?.pairTextureLabel || null,
            pairModeLabel: summary?.pairModeLabel || null
          };
        }
        return results;
      }, configured);

      const pass = details.devoted?.pairTexture === 'devoted'
        && details.repairing?.pairTexture === 'repairing'
        && details.strained?.pairTexture === 'strained';

      return { pass, details };
    });

    await phase(page, report, outputDir, '02-textures-shape-casual-distinctness', async () => {
      await resetBaseline(page);
      const configured = await configureTexturePairs(page);
      if (!configured.ok) {
        return { pass: false, details: configured };
      }

      const details = await page.evaluate(({ pairs }) => {
        const outputs = {};
        for (const pair of pairs) {
          const source = communicationSystem.getEntityById(pair.leftId);
          const target = communicationSystem.getEntityById(pair.rightId);
          const profile = communicationSystem.getDialogueIntentProfile('acknowledgement_signal', source, {
            talkMode: 'single_target',
            targetCount: 1,
            recipients: [target]
          });
          const phrase = communicationSystem.composeDialoguePhrase(
            source,
            'acknowledgement_signal',
            source.currentZoneId || source.lifeSim?.lifecycle?.currentZoneId || null,
            {
              recipients: [target],
              targetCount: 1,
              targetLabel: communicationSystem.getEntityLabel(target),
              talkMode: 'single_target',
              intentProfile: profile
            }
          );
          outputs[pair.key] = {
            subtype: profile?.subtype || null,
            pairTexture: profile?.pairTexture || null,
            pairTextureLabel: profile?.pairTextureLabel || null,
            phrase
          };
        }
        const distinctPhrases = [...new Set(Object.values(outputs).map(value => value.phrase).filter(Boolean))];
        return {
          outputs,
          distinctPhraseCount: distinctPhrases.length
        };
      }, configured);

      const pass = details.outputs?.devoted?.pairTexture === 'devoted'
        && details.outputs?.repairing?.pairTexture === 'repairing'
        && details.outputs?.strained?.pairTexture === 'strained'
        && details.distinctPhraseCount >= 2;

      return { pass, details };
    });

    await phase(page, report, outputDir, '03-textures-surface-in-feed-and-summary', async () => {
      await resetBaseline(page);
      const configured = await configureTexturePairs(page);
      if (!configured.ok) {
        return { pass: false, details: configured };
      }

      const details = await page.evaluate(({ pairs, zoneId }) => {
        const devoted = pairs.find(pair => pair.key === 'devoted');
        if (!devoted) {
          return { ok: false, reason: 'missing-devoted-pair' };
        }

        const source = communicationSystem.getEntityById(devoted.leftId);
        const target = communicationSystem.getEntityById(devoted.rightId);
        eventBus.clearHistory?.();
        communicationSystem.history = [];
        communicationSystem.dialogueHistory = [];
        communicationSystem.responseQueue = [];

        eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
          sourceId: source.id,
          targetId: target.id,
          zoneId,
          signalType: 'acknowledgement_signal'
        });
        communicationSystem.update(gameCore.getGameState(), 0.25);

        eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
          sourceId: target.id,
          targetId: source.id,
          zoneId,
          signalType: 'acknowledgement_signal'
        });
        communicationSystem.update(gameCore.getGameState(), 0.25);
        gameUI.activityLogCache = { key: null, entries: [] };

        const summary = communicationSystem.getCommunicationSummary(source.id);
        const feedEntries = communicationSystem.getFeedEntries({
          targetId: source.id,
          zoneId,
          limit: 10
        });
        const talkEntry = feedEntries.find(entry => entry.category === 'talk' && entry.conversationId);

        return {
          ok: true,
          summaryTexture: summary?.relationship?.pairTextureLabel || null,
          summarySignature: summary?.relationship?.pairTextureSignature || null,
          feedTexture: talkEntry?.pairTextureLabel || null,
          feedPairMode: talkEntry?.pairModeLabel || null,
          threadCount: talkEntry?.threadLines?.length || 0,
          threadDetail: talkEntry?.detail || null
        };
      }, configured);

      const pass = details.ok === true
        && details.summaryTexture === 'devoted'
        && details.feedTexture === 'devoted'
        && details.threadCount >= 2;

      return { pass, details };
    });

    report.overall = report.phases.every(phaseResult => phaseResult.pass)
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
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
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      outputDir,
      overall: report.overall,
      error: report.error || null
    }, null, 2));
  }
}

run();
