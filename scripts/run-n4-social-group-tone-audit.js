const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'n4_social_group_tone_audit');
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
      gameUI.activityLogCache = { key: null, entries: [] };
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

    await phase(page, report, outputDir, '01-witnessed-praise-shapes-observer-and-reputation', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 4);
        if (butterflies.length < 4) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }

        const [speaker, recipient, witness, outsider] = butterflies;
        const place = (entity, x, y) => {
          entity.x = x;
          entity.y = y;
          entity.gridPos = gridManager.screenToIso(x, y + (entity.shadowOffset || 0));
          entity.updateZIndex?.();
          entity.zoneTravel = null;
          entity.isSpawning = false;
          entity.signalDecisionCooldownFrames = 0;
        };

        place(speaker, 470, 402);
        place(recipient, 496, 414);
        place(witness, 530, 408);
        place(outsider, 742, 520);

        [speaker, recipient, witness, outsider].forEach(entity => {
          entity.lifeSim.social.activeContext = 'wandering';
          entity.lifeSim.communication.activeSignal = null;
          entity.lifeSim.communication.recentDialogues = [];
          entity.lifeSim.communication.recentResidues = [];
          entity.lifeSim.communication.recentConversations = [];
          entity.lifeSim.interpretation.clarity = 0.94;
        });

        ensureLifeSocialEdge(witness, recipient.id);
        ensureLifeSocialEdge(witness, speaker.id);
        Object.assign(witness.lifeSim.socialEdges[recipient.id], {
          trust: 0.58,
          comfort: 0.62,
          attachment: 0.34,
          protectiveness: 0.24,
          recentWarmth: 0.2,
          recentEase: 0.16,
          recentMutualAttention: 0.18,
          resentment: 0,
          rivalry: 0,
          rejectionWeight: 0
        });
        Object.assign(witness.lifeSim.socialEdges[speaker.id], {
          trust: 0.08,
          comfort: 0.06,
          attachment: 0.02,
          protectiveness: 0.02,
          admiration: 0.03,
          recentWarmth: 0,
          recentEase: 0,
          recentMutualAttention: 0,
          resentment: 0,
          rivalry: 0,
          rejectionWeight: 0
        });

        const beforeSpeakerAdmiration = witness.lifeSim.socialEdges[speaker.id].admiration || 0;
        const beforeRecipientAdmiration = witness.lifeSim.socialEdges[recipient.id].admiration || 0;

        const dialogue = {
          id: 'n4-witnessed-praise',
          sourceId: speaker.id,
          sourceLabel: communicationSystem.getEntityLabel(speaker),
          targetIds: [recipient.id],
          targetLabels: [communicationSystem.getEntityLabel(recipient)],
          targetLabel: communicationSystem.getEntityLabel(recipient),
          sourceZoneId: zoneId,
          createdAtSeconds: communicationSystem.simulationClockSeconds + 1,
          talkMode: 'single_target',
          targetCount: 1,
          phrase: 'stay close; the way you move through this edge is beautiful',
          intentTags: ['reply', 'admiration', 'warmth'],
          tone: 'warm',
          register: 'personal',
          languageBand: 'above_average',
          sourceSignalType: 'acknowledgement_signal'
        };

        communicationSystem.emitDialogue(dialogue, [recipient]);
        lifeSimSystem.updateButterfly(speaker, state);

        const afterSpeakerEdge = witness.lifeSim.socialEdges[speaker.id];
        const afterRecipientEdge = witness.lifeSim.socialEdges[recipient.id];
        const speakerSummary = lifeSimSystem.getEntitySummary(speaker.id);

        return {
          ok: true,
          speakerAdmirationDelta: Number(((afterSpeakerEdge.admiration || 0) - beforeSpeakerAdmiration).toFixed(4)),
          recipientAdmirationDelta: Number(((afterRecipientEdge.admiration || 0) - beforeRecipientAdmiration).toFixed(4)),
          speakerSocietyTone: speakerSummary?.socialEcology?.societyTone || null,
          speakerSocietyLabel: speakerSummary?.socialEcology?.societyLabel || null,
          speakerReputationScore: speakerSummary?.socialEcology?.reputation?.score || 0
        };
      });

      const pass = details.ok === true
        && details.speakerAdmirationDelta > 0
        && details.recipientAdmirationDelta > 0
        && details.speakerReputationScore > 0;

      return { pass, details };
    });

    await phase(page, report, outputDir, '02-clique-comfort-resolves-from-local-group', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 4);
        if (butterflies.length < 4) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }

        const [focus, a, b, c] = butterflies;
        const place = (entity, x, y) => {
          entity.x = x;
          entity.y = y;
          entity.gridPos = gridManager.screenToIso(x, y + (entity.shadowOffset || 0));
          entity.updateZIndex?.();
          entity.zoneTravel = null;
        };
        place(focus, 470, 410);
        place(a, 496, 420);
        place(b, 450, 430);
        place(c, 524, 438);

        const warmPair = (left, right) => {
          ensureLifeSocialEdge(left, right.id);
          ensureLifeSocialEdge(right, left.id);
          Object.assign(left.lifeSim.socialEdges[right.id], {
            trust: 0.82,
            comfort: 0.84,
            attachment: 0.44,
            admiration: 0.22,
            recentWarmth: 0.28,
            recentEase: 0.24,
            recentMutualAttention: 0.26,
            recentFriction: 0.02,
            resentment: 0,
            rivalry: 0,
            rejectionWeight: 0
          });
          Object.assign(right.lifeSim.socialEdges[left.id], {
            trust: 0.8,
            comfort: 0.82,
            attachment: 0.4,
            admiration: 0.2,
            recentWarmth: 0.26,
            recentEase: 0.22,
            recentMutualAttention: 0.24,
            recentFriction: 0.02,
            resentment: 0,
            rivalry: 0,
            rejectionWeight: 0
          });
        };

        warmPair(focus, a);
        warmPair(focus, b);
        warmPair(focus, c);
        focus.lifeSim.social.belonging = 0.66;
        focus.lifeSim.social.confidence = 0.54;
        focus.lifeSim.emotions.threat = 0.04;
        focus.lifeSim.emotions.exhaustion = 0.08;

        lifeSimSystem.updateButterfly(focus, state);
        const summary = lifeSimSystem.getEntitySummary(focus.id);
        return {
          ok: true,
          activeContext: focus.lifeSim.social.activeContext,
          primaryRhythm: summary?.socialEcology?.primaryRhythm || null,
          societyTone: summary?.socialEcology?.societyTone || null,
          societyLabel: summary?.socialEcology?.societyLabel || null,
          cliqueScore: summary?.socialEcology?.clique?.score || 0,
          exclusionScore: summary?.socialEcology?.exclusion?.score || 0
        };
      });

      const pass = details.ok === true
        && details.primaryRhythm === 'clique-comfort'
        && details.activeContext === 'clique-comfort'
        && details.cliqueScore > details.exclusionScore;

      return { pass, details };
    });

    await phase(page, report, outputDir, '03-clique-exclusion-resolves-from-tense-cluster-edge', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 4);
        if (butterflies.length < 4) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }

        const [focus, a, b, c] = butterflies;
        const place = (entity, x, y) => {
          entity.x = x;
          entity.y = y;
          entity.gridPos = gridManager.screenToIso(x, y + (entity.shadowOffset || 0));
          entity.updateZIndex?.();
          entity.zoneTravel = null;
        };
        place(focus, 472, 412);
        place(a, 500, 418);
        place(b, 448, 428);
        place(c, 526, 434);

        const tensePair = (left, right) => {
          ensureLifeSocialEdge(left, right.id);
          ensureLifeSocialEdge(right, left.id);
          Object.assign(left.lifeSim.socialEdges[right.id], {
            trust: 0.08,
            comfort: 0.06,
            attachment: 0.02,
            admiration: 0.02,
            rivalry: 0.34,
            resentment: 0.42,
            rejectionWeight: 0.26,
            recentWarmth: 0.02,
            recentEase: 0.02,
            recentMutualAttention: 0.06,
            recentFriction: 0.38
          });
          Object.assign(right.lifeSim.socialEdges[left.id], {
            trust: 0.1,
            comfort: 0.08,
            attachment: 0.02,
            admiration: 0.02,
            rivalry: 0.32,
            resentment: 0.38,
            rejectionWeight: 0.24,
            recentWarmth: 0.02,
            recentEase: 0.02,
            recentMutualAttention: 0.06,
            recentFriction: 0.34
          });
        };

        tensePair(focus, a);
        tensePair(focus, b);
        tensePair(focus, c);
        focus.lifeSim.social.belonging = 0.08;
        focus.lifeSim.social.confidence = 0.18;
        focus.lifeSim.emotions.threat = 0.12;
        focus.lifeSim.emotions.exhaustion = 0.14;

        lifeSimSystem.updateButterfly(focus, state);
        const summary = lifeSimSystem.getEntitySummary(focus.id);
        return {
          ok: true,
          activeContext: focus.lifeSim.social.activeContext,
          primaryRhythm: summary?.socialEcology?.primaryRhythm || null,
          societyTone: summary?.socialEcology?.societyTone || null,
          societyLabel: summary?.socialEcology?.societyLabel || null,
          cliqueScore: summary?.socialEcology?.clique?.score || 0,
          exclusionScore: summary?.socialEcology?.exclusion?.score || 0
        };
      });

      const pass = details.ok === true
        && details.primaryRhythm === 'clique-exclusion'
        && details.activeContext === 'clique-exclusion'
        && details.exclusionScore > details.cliqueScore;

      return { pass, details };
    });

    await phase(page, report, outputDir, '04-protective-ring-resolves-around-vulnerable-butterfly', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 4);
        if (butterflies.length < 4) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }

        const [focus, a, b, c] = butterflies;
        const place = (entity, x, y) => {
          entity.x = x;
          entity.y = y;
          entity.gridPos = gridManager.screenToIso(x, y + (entity.shadowOffset || 0));
          entity.updateZIndex?.();
          entity.zoneTravel = null;
        };
        place(focus, 476, 412);
        place(a, 498, 422);
        place(b, 454, 426);
        place(c, 528, 432);

        [a, b, c].forEach(guardian => {
          ensureLifeSocialEdge(guardian, focus.id);
          ensureLifeSocialEdge(focus, guardian.id);
        });

        Object.assign(a.lifeSim.socialEdges[focus.id], {
          trust: 0.58,
          comfort: 0.42,
          protectiveness: 0.66,
          attachment: 0.26,
          recentWarmth: 0.12,
          recentEase: 0.08
        });
        Object.assign(b.lifeSim.socialEdges[focus.id], {
          trust: 0.54,
          comfort: 0.4,
          protectiveness: 0.62,
          attachment: 0.22,
          recentWarmth: 0.1,
          recentEase: 0.08
        });
        Object.assign(c.lifeSim.socialEdges[focus.id], {
          trust: 0.42,
          comfort: 0.32,
          protectiveness: 0.36,
          attachment: 0.12,
          recentWarmth: 0.06,
          recentEase: 0.04
        });

        focus.state = 'scared';
        focus.lifeSim.social.confidence = 0.12;
        focus.lifeSim.social.belonging = 0.18;
        focus.lifeSim.emotions.threat = 0.78;
        focus.lifeSim.emotions.exhaustion = 0.18;
        focus.lifeSim.communication.activeSignal = null;

        lifeSimSystem.updateButterfly(focus, state);
        const summary = lifeSimSystem.getEntitySummary(focus.id);
        return {
          ok: true,
          activeContext: focus.lifeSim.social.activeContext,
          primaryRhythm: summary?.socialEcology?.primaryRhythm || null,
          societyTone: summary?.socialEcology?.societyTone || null,
          societyLabel: summary?.socialEcology?.societyLabel || null,
          protectionScore: summary?.socialEcology?.protection?.score || 0,
          warningScore: summary?.socialEcology?.warning?.score || 0
        };
      });

      const pass = details.ok === true
        && details.primaryRhythm === 'protective-ring'
        && details.protectionScore > details.warningScore;

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
