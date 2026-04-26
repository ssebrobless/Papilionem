const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'n2_social_motive_rebalance_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];

const GENERIC_ACK_PATTERN = /\b(i heard you|got it|i understand|i will follow that|i will keep it in mind)\b/i;
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
    eventBus.clearHistory?.();
    if (typeof communicationSystem !== 'undefined') {
      communicationSystem.history = [];
      communicationSystem.dialogueHistory = [];
      communicationSystem.simulationClockSeconds = 0;
    }
  });
  await page.waitForTimeout(800);
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

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    await phase(page, report, outputDir, '01-low-risk-warning-suppressed', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 2);
        if (butterflies.length < 2) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }

        const [source, target] = butterflies;
        source.x = 460;
        source.y = 420;
        target.x = 486;
        target.y = 428;
        source.state = 'normal';
        source.isSpawning = false;
        source.zoneTravel = null;
        source.signalDecisionCooldownFrames = 0;
        source.lifeSim.communication.activeSignal = null;
        source.lifeSim.communication.recentReceived = [];
        source.lifeSim.social.activeContext = 'wandering';
        source.lifeSim.social.confidence = 0.34;
        source.lifeSim.social.belonging = 0.32;
        source.lifeSim.emotions.threat = 0.04;
        source.lifeSim.emotions.agitation = 0.05;
        source.lifeSim.derived = source.lifeSim.derived || {};
        source.lifeSim.derived.behaviorBiases = {
          ...(source.lifeSim.derived.behaviorBiases || {}),
          caution: 0.08,
          socialConnection: 0.36
        };
        source.lifeSim.communication.recentEmitted = [];
        target.lifeSim.socialEdges[source.id] = {
          ...(target.lifeSim.socialEdges[source.id] || {}),
          trust: 0.42,
          comfort: 0.38
        };

        eventBus.clearHistory?.();
        communicationSystem.activeSignals?.clear?.();
        const originalChooser = source.getDecisionPolicyChoice.bind(source);
        source.getDecisionPolicyChoice = function(decisionType, fallback) {
          if (decisionType === 'signalChoice') {
            return { label: 'warning', confidenceScore: 81, chosenScore: 81 };
          }
          if (decisionType === 'actionFamily') {
            return { label: 'signal', confidenceScore: 76, chosenScore: 76 };
          }
          if (decisionType === 'targetPreference') {
            return { label: 'butterfly', confidenceScore: 68, chosenScore: 68 };
          }
          if (decisionType === 'riskPosture') {
            return { label: 'observe', confidenceScore: 65, chosenScore: 65 };
          }
          return originalChooser(decisionType, fallback);
        };

        const emitted = source.maybeEmitDecisionSignal(state);
        const signals = eventBus.getHistory(GameEvents.COMMUNICATION_SIGNAL);
        const warningDialogues = (communicationSystem.dialogueHistory || []).filter(entry =>
          entry?.sourceId === source.id && entry?.intentFamily === 'warning'
        );
        source.getDecisionPolicyChoice = originalChooser;

        return {
          ok: true,
          emitted,
          signalCount: signals.length,
          latestSignalType: signals[signals.length - 1]?.signalType || null,
          warningDialogueCount: warningDialogues.length
        };
      });

      return {
        pass: details.ok === true && details.warningDialogueCount === 0,
        details
      };
    });

    await phase(page, report, outputDir, '02-invitation-targets-nearby-partner', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 3);
        if (butterflies.length < 2) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }

        const [source, target, bystander] = butterflies;
        source.x = 500;
        source.y = 410;
        target.x = 526;
        target.y = 420;
        if (bystander) {
          bystander.x = 650;
          bystander.y = 510;
        }

        ensureLifeSocialEdge(source, target.id);
        ensureLifeSocialEdge(target, source.id);
        Object.assign(source.lifeSim.socialEdges[target.id], {
          trust: 0.76,
          comfort: 0.82,
          attachment: 0.52,
          admiration: 0.28,
          recentWarmth: 0.34,
          recentEase: 0.28,
          recentMutualAttention: 0.24,
          resentment: 0,
          rejectionWeight: 0
        });

        source.signalDecisionCooldownFrames = 0;
        source.lifeSim.communication.activeSignal = null;
        source.state = 'normal';
        source.isSpawning = false;
        source.zoneTravel = null;
        source.lifeSim.social.activeContext = 'wandering';
        source.lifeSim.social.confidence = 0.62;
        source.lifeSim.social.belonging = 0.58;
        source.lifeSim.emotions.threat = 0.04;
        source.lifeSim.emotions.agitation = 0.08;
        source.lifeSim.derived = source.lifeSim.derived || {};
        source.lifeSim.derived.behaviorBiases = {
          ...(source.lifeSim.derived.behaviorBiases || {}),
          caution: 0.08,
          socialConnection: 0.66
        };
        source.lifeSim.communication.recentEmitted = [];

        eventBus.clearHistory?.();
        communicationSystem.dialogueHistory = [];
        communicationSystem.activeSignals?.clear?.();
        const originalChooser = source.getDecisionPolicyChoice.bind(source);
        source.getDecisionPolicyChoice = function(decisionType, fallback) {
          if (decisionType === 'signalChoice') {
            return { label: 'invitation', confidenceScore: 84, chosenScore: 84 };
          }
          if (decisionType === 'actionFamily') {
            return { label: 'socialize', confidenceScore: 81, chosenScore: 81 };
          }
          if (decisionType === 'targetPreference') {
            return { label: 'emptySpace', confidenceScore: 52, chosenScore: 52 };
          }
          if (decisionType === 'riskPosture') {
            return { label: 'approach', confidenceScore: 75, chosenScore: 75 };
          }
          return originalChooser(decisionType, fallback);
        };

        const emitted = source.maybeEmitDecisionSignal(state, { force: true });
        const signals = eventBus.getHistory(GameEvents.COMMUNICATION_SIGNAL);
        const latestSignal = signals[signals.length - 1] || null;
        const latestDialogue = communicationSystem.dialogueHistory[communicationSystem.dialogueHistory.length - 1] || null;
        source.getDecisionPolicyChoice = originalChooser;

        return {
          ok: true,
          emitted,
          latestSignal: latestSignal ? {
            signalType: latestSignal.signalType,
            targetIds: latestSignal.targetIds || []
          } : null,
          latestDialogue: latestDialogue ? {
            intentSubtype: latestDialogue.intentSubtype,
            intentTags: latestDialogue.intentTags || [],
            talkMode: latestDialogue.talkMode,
            targetIds: latestDialogue.targetIds || []
          } : null,
          targetId: target.id
        };
      });

      return {
        pass:
          details.ok === true
          && details.emitted === true
          && CASUAL_SUBTYPES.has(details.latestDialogue?.intentSubtype)
          && details.latestDialogue?.talkMode === 'single_target'
          && details.latestDialogue?.targetIds?.length === 1
          && details.latestDialogue?.targetIds?.[0] === details.targetId,
        details
      };
    });

    await phase(page, report, outputDir, '03-warning-open-talk-no-auto-reply', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const trio = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 3);
        if (trio.length < 3) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }

        const [source, targetA, targetB] = trio;
        source.x = 480;
        source.y = 410;
        targetA.x = 500;
        targetA.y = 420;
        targetB.x = 518;
        targetB.y = 430;
        for (const butterfly of (gameCore.getGameState().butterflies || [])) {
          butterfly.state = 'normal';
          butterfly.isSpawning = false;
          butterfly.zoneTravel = null;
          butterfly.signalDecisionCooldownFrames = 6000;
          if (butterfly.lifeSim?.communication) {
            butterfly.lifeSim.communication.pendingUtterances = [];
            butterfly.lifeSim.communication.recentEmitted = [];
          }
        }
        communicationSystem.dialogueHistory = [];
        eventBus.clearHistory?.();

        eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
          sourceId: source.id,
          targetIds: [targetA.id, targetB.id],
          zoneId,
          signalType: 'warning_signal'
        });

        return {
          ok: true,
          immediateDialogueCount: communicationSystem.dialogueHistory.length
        };
      });

      await page.waitForTimeout(2400);

      const after = await page.evaluate(() => ({
        dialogueCount: communicationSystem.dialogueHistory.length,
        pendingCount: (gameCore.getGameState().butterflies || []).reduce((sum, butterfly) =>
          sum + ((butterfly?.lifeSim?.communication?.pendingUtterances || []).length), 0)
      }));

      return {
        pass:
          details.ok === true
          && details.immediateDialogueCount === 1
          && after.dialogueCount === 1
          && after.pendingCount === 0,
        details: {
          ...details,
          ...after
        }
      };
    });

    await phase(page, report, outputDir, '04-casual-response-varies-by-motive', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 2);
        if (butterflies.length < 2) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }

        const [source, target] = butterflies;
        source.x = 520;
        source.y = 420;
        target.x = 538;
        target.y = 428;
        ensureLifeSocialEdge(source, target.id);
        ensureLifeSocialEdge(target, source.id);
        Object.assign(source.lifeSim.socialEdges[target.id], {
          trust: 0.78,
          comfort: 0.84,
          attachment: 0.58,
          admiration: 0.34,
          recentWarmth: 0.38,
          recentEase: 0.32,
          recentMutualAttention: 0.24
        });
        Object.assign(target.lifeSim.socialEdges[source.id], {
          trust: 0.8,
          comfort: 0.86,
          attachment: 0.56,
          admiration: 0.3,
          recentWarmth: 0.34,
          recentEase: 0.3,
          recentMutualAttention: 0.22
        });
        source.lifeSim.communication.expressiveness = 0.95;
        source.lifeSim.communication.receptivity = 0.95;
        target.lifeSim.communication.expressiveness = 0.95;
        target.lifeSim.communication.receptivity = 0.95;
        source.lifeSim.interpretation.clarity = 0.95;
        target.lifeSim.interpretation.clarity = 0.95;

        communicationSystem.dialogueHistory = [];
        eventBus.clearHistory?.();

        eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
          sourceId: source.id,
          targetId: target.id,
          zoneId,
          signalType: 'acknowledgement_signal'
        });

        return {
          ok: true,
          openerCount: communicationSystem.dialogueHistory.length
        };
      });

      await page.waitForTimeout(2400);

      const after = await page.evaluate(() => {
        const history = communicationSystem.dialogueHistory || [];
        const opener = history.find(entry =>
          entry?.sourceId
          && Array.isArray(entry.targetIds)
          && entry.targetIds.length === 1
          && !(entry.responseToIntentTags || []).length
        ) || null;
        const response = history.find(entry =>
          !!entry
          && Array.isArray(entry.responseToIntentTags)
          && entry.responseToIntentTags.includes('casual')
        ) || null;
        return {
          dialogueCount: history.length,
          opener: opener ? {
            intentSubtype: opener.intentSubtype,
            phrase: opener.phrase
          } : null,
          response: response ? {
            intentSubtype: response.intentSubtype,
            phrase: response.phrase,
            responseToIntentTags: response.responseToIntentTags || []
          } : null
        };
      });

      return {
        pass:
          details.ok === true
          && details.openerCount === 1
          && after.dialogueCount >= 2
          && CASUAL_SUBTYPES.has(after.opener?.intentSubtype)
          && !!after.response?.phrase
          && !GENERIC_ACK_PATTERN.test(after.response.phrase)
          && (after.response.responseToIntentTags || []).includes('casual'),
        details: {
          ...details,
          ...after
        }
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
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
