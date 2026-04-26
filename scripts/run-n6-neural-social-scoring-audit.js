const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'n6_neural_social_scoring_audit');
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
      communicationSystem.activeSignals = new Map();
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

    await phase(page, report, outputDir, '00-feature-contract-expanded', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => mlInferenceSystem.getFeatureContractSnapshot());
      const pass = details.groupCount === 14
        && details.flatFeatureCount === 98
        && details.vectorLength === 124;
      return { pass, details };
    });

    const runScenario = async (scenarioName) => {
      await resetBaseline(page);
      const details = await page.evaluate((name) => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 6);
        if (butterflies.length < 6) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }

        const place = (entity, screenX, groundY) => {
          const clamped = gameCore.clampPlacementPointInZone(zoneId, screenX, groundY, 8);
          const grid = gridManager.screenToIso(clamped.x, clamped.y);
          entity.x = clamped.x;
          entity.y = clamped.y - (entity.shadowOffset || 0);
          entity.gridPos = { x: grid.x, y: grid.y };
          entity.updateZIndex?.();
          entity.zoneTravel = null;
          entity.isSpawning = false;
          entity.signalDecisionCooldownFrames = 0;
          entity.targetFlower = null;
          entity.feeding.targetFlower = null;
          entity.pendingPollenDropTarget = null;
          entity.blockInteraction.targetBlockId = null;
          entity.blockInteraction.placementTarget = null;
          entity.movement.clearTarget?.();
          entity.state = 'normal';
        };

        const resetEntity = (entity) => {
          entity.lifeSim.social.activeContext = 'wandering';
          entity.lifeSim.communication.activeSignal = null;
          entity.lifeSim.communication.activeConversation = null;
          entity.lifeSim.communication.recentDialogues = [];
          entity.lifeSim.communication.recentResidues = [];
          entity.lifeSim.communication.recentConversations = [];
          entity.lifeSim.communication.pendingUtterances = [];
          entity.lifeSim.interpretation.clarity = 0.95;
          entity.lifeSim.emotions.threat = 0.04;
          entity.lifeSim.emotions.agitation = 0.06;
          entity.lifeSim.emotions.rejection = 0.04;
          entity.lifeSim.emotions.attachment = 0.18;
          entity.lifeSim.emotions.relief = 0.18;
          entity.lifeSim.social.confidence = 0.5;
          entity.lifeSim.social.belonging = 0.5;
          entity.lifeSim.social.reputation = 0.22;
          entity.state = 'normal';
        };

        const configurePair = (left, right, leftEdge, rightEdge) => {
          ensureLifeSocialEdge(left, right.id);
          ensureLifeSocialEdge(right, left.id);
          left.lifeSim.socialEdges[right.id] = {
            ...(left.lifeSim.socialEdges[right.id] || {}),
            ...leftEdge
          };
          right.lifeSim.socialEdges[left.id] = {
            ...(right.lifeSim.socialEdges[left.id] || {}),
            ...rightEdge
          };
        };

        butterflies.forEach((entity, index) => {
          place(entity, 396 + (index * 32), 328 + ((index % 2) * 16));
          resetEntity(entity);
        });
        communicationSystem.history = [];
        communicationSystem.dialogueHistory = [];
        communicationSystem.responseQueue = [];
        communicationSystem.activeSignals = new Map();

        const [focus, a, b, c, d, e] = butterflies;

        if (name === 'clique-comfort') {
          place(focus, 452, 350);
          place(a, 428, 338);
          place(b, 476, 338);
          place(c, 454, 318);
          place(d, 604, 432);
          place(e, 652, 460);

          [a, b, c].forEach((partner, index) => {
            configurePair(
              focus,
              partner,
              {
                trust: 0.72 + (index * 0.02),
                comfort: 0.76 + (index * 0.02),
                attachment: 0.42 + (index * 0.04),
                admiration: 0.18 + (index * 0.04),
                protectiveness: 0.14,
                followThroughScore: 0.38,
                reciprocityScore: 0.28,
                recentWarmth: 0.24,
                recentEase: 0.22,
                recentMutualAttention: 0.24,
                recentFriction: 0.02,
                resentment: 0.02,
                rejectionWeight: 0.01,
                forgivenessWeight: 0.08,
                repairState: 'steady',
                recentResidues: [{ type: 'shared-calm' }, { type: 'small-praise' }]
              },
              {
                trust: 0.68,
                comfort: 0.7,
                attachment: 0.32,
                admiration: 0.18,
                protectiveness: 0.08,
                followThroughScore: 0.28,
                reciprocityScore: 0.24,
                recentWarmth: 0.18,
                recentEase: 0.16,
                recentMutualAttention: 0.18,
                recentFriction: 0.02,
                resentment: 0.02,
                rejectionWeight: 0.01,
                forgivenessWeight: 0.06,
                repairState: 'steady',
                recentResidues: [{ type: 'shared-calm' }]
              }
            );
          });
          focus.lifeSim.social.belonging = 0.76;
          focus.lifeSim.social.confidence = 0.66;
        } else if (name === 'devoted-seek') {
          place(focus, 436, 344);
          place(a, 464, 338);
          configurePair(
            focus,
            a,
            {
              trust: 0.88,
              comfort: 0.9,
              attachment: 0.84,
              admiration: 0.34,
              protectiveness: 0.18,
              followThroughScore: 0.68,
              reciprocityScore: 0.42,
              recentWarmth: 0.34,
              recentEase: 0.3,
              recentMutualAttention: 0.28,
              recentFriction: 0.02,
              resentment: 0.02,
              rejectionWeight: 0.01,
              forgivenessWeight: 0.1,
              repairState: 'steady',
              recentResidues: [{ type: 'shared-calm' }, { type: 'mutual-courtship' }]
            },
            {
              trust: 0.8,
              comfort: 0.82,
              attachment: 0.72,
              admiration: 0.22,
              protectiveness: 0.12,
              followThroughScore: 0.52,
              reciprocityScore: 0.32,
              recentWarmth: 0.26,
              recentEase: 0.24,
              recentMutualAttention: 0.24,
              recentFriction: 0.02,
              resentment: 0.02,
              rejectionWeight: 0.01,
              forgivenessWeight: 0.08,
              repairState: 'steady',
              recentResidues: [{ type: 'shared-calm' }]
            }
          );
          focus.lifeSim.social.belonging = 0.68;
          focus.lifeSim.social.confidence = 0.62;
          focus.lifeSim.emotions.attachment = 0.54;
          focus.lifeSim.emotions.relief = 0.24;
        } else if (name === 'strained-avoid') {
          place(focus, 434, 346);
          place(b, 466, 344);
          configurePair(
            focus,
            b,
            {
              trust: 0.08,
              comfort: 0.08,
              attachment: 0.02,
              admiration: 0.02,
              protectiveness: 0.02,
              followThroughScore: 0.04,
              reciprocityScore: 0.02,
              recentWarmth: 0.02,
              recentEase: 0.02,
              recentMutualAttention: 0.06,
              recentFriction: 0.58,
              resentment: 0.62,
              rejectionWeight: 0.34,
              forgivenessWeight: 0.02,
              repairState: 'hurt',
              recentResidues: [{ type: 'gentle-rejection' }]
            },
            {
              trust: 0.12,
              comfort: 0.12,
              attachment: 0.02,
              admiration: 0.02,
              protectiveness: 0.02,
              followThroughScore: 0.04,
              reciprocityScore: 0.02,
              recentWarmth: 0.02,
              recentEase: 0.02,
              recentMutualAttention: 0.04,
              recentFriction: 0.48,
              resentment: 0.54,
              rejectionWeight: 0.28,
              forgivenessWeight: 0.02,
              repairState: 'hurt',
              recentResidues: [{ type: 'gentle-rejection' }]
            }
          );
          focus.lifeSim.social.belonging = 0.18;
          focus.lifeSim.social.confidence = 0.2;
          focus.lifeSim.emotions.rejection = 0.42;
          focus.lifeSim.emotions.agitation = 0.36;
        } else if (name === 'protective-warning') {
          place(focus, 442, 346);
          place(c, 470, 334);
          place(d, 420, 324);
          configurePair(
            focus,
            c,
            {
              trust: 0.72,
              comfort: 0.66,
              attachment: 0.4,
              admiration: 0.12,
              protectiveness: 0.84,
              followThroughScore: 0.54,
              reciprocityScore: 0.26,
              recentWarmth: 0.18,
              recentEase: 0.16,
              recentMutualAttention: 0.22,
              recentFriction: 0.04,
              resentment: 0.02,
              rejectionWeight: 0.01,
              forgivenessWeight: 0.08,
              repairState: 'steady',
              recentResidues: [{ type: 'shared-calm' }]
            },
            {
              trust: 0.54,
              comfort: 0.5,
              attachment: 0.26,
              admiration: 0.08,
              protectiveness: 0.1,
              followThroughScore: 0.2,
              reciprocityScore: 0.18,
              recentWarmth: 0.12,
              recentEase: 0.1,
              recentMutualAttention: 0.18,
              recentFriction: 0.04,
              resentment: 0.02,
              rejectionWeight: 0.01,
              forgivenessWeight: 0.04,
              repairState: 'steady',
              recentResidues: [{ type: 'shared-calm' }]
            }
          );
          c.state = 'scared';
          c.lifeSim.emotions.threat = 0.72;
          c.lifeSim.social.confidence = 0.14;
          focus.lifeSim.emotions.relief = 0.12;
          focus.lifeSim.emotions.attachment = 0.34;
          communicationSystem.handleSignal({
            sourceButterfly: d,
            signalType: 'warning_signal',
            targetIds: [focus.id, c.id],
            intensity: 0.92,
            createdAtSeconds: communicationSystem.simulationClockSeconds + 1,
            durationSeconds: 8
          });
        } else {
          return { ok: false, reason: 'unknown-scenario' };
        }

        lifeSimSystem.updateButterfly(focus, state);
        const runtime = behaviorSystem.getRuntime?.(focus.id) || null;
        const features = mlInferenceSystem.buildFeatureGroups(focus, state, runtime);
        const heuristic = mlInferenceSystem.buildHeuristicPolicies(focus, features);

        return {
          ok: true,
          scenario: name,
          groups: {
            social: {
              societyTone: features.groups.social.societyTone,
              relationshipTexture: features.groups.social.relationshipTexture,
              followThroughMode: features.groups.social.followThroughMode,
              followThroughStrength: Number((features.groups.social.followThroughStrength || 0).toFixed(4)),
              localFieldTone: features.groups.social.localFieldTone,
              localFieldPressure: Number((features.groups.social.localFieldPressure || 0).toFixed(4))
            },
            behavior: {
              followThroughDrive: Number((features.groups.behavior.followThroughDrive || 0).toFixed(4)),
              socialAvoidance: Number((features.groups.behavior.socialAvoidance || 0).toFixed(4))
            }
          },
          policies: {
            actionFamily: heuristic.actionFamily,
            targetPreference: heuristic.targetPreference,
            signalChoice: heuristic.signalChoice,
            riskPosture: heuristic.riskPosture
          }
        };
      }, scenarioName);

      if (!details.ok) {
        return { pass: false, details };
      }

      let pass = false;
      if (scenarioName === 'clique-comfort') {
        pass = details.groups.social.societyTone === 'clique-comfort'
          && details.policies.actionFamily.socialize > details.policies.actionFamily.signal
          && details.policies.targetPreference.butterfly > details.policies.targetPreference.emptySpace
          && details.policies.signalChoice.invitation > details.policies.signalChoice.warning;
      } else if (scenarioName === 'devoted-seek') {
        pass = details.groups.social.relationshipTexture === 'devoted'
          && details.groups.social.followThroughMode === 'seek'
          && details.groups.behavior.followThroughDrive > 0.3
          && details.policies.targetPreference.butterfly > 0.55
          && details.policies.riskPosture.approach > details.policies.riskPosture.avoid
          && details.policies.actionFamily.socialize > details.policies.actionFamily.avoid;
      } else if (scenarioName === 'strained-avoid') {
        pass = details.groups.social.relationshipTexture === 'strained'
          && details.groups.social.followThroughMode === 'avoid'
          && details.groups.behavior.socialAvoidance > 0.2
          && details.policies.actionFamily.avoid > details.policies.actionFamily.socialize
          && details.policies.riskPosture.avoid > details.policies.riskPosture.approach
          && details.policies.signalChoice.quiet > details.policies.signalChoice.invitation;
      } else if (scenarioName === 'protective-warning') {
        pass = details.groups.social.localFieldTone === 'warning'
          && details.groups.social.followThroughMode === 'protect'
          && details.policies.signalChoice.calming > details.policies.signalChoice.invitation
          && details.policies.signalChoice.warning > details.policies.signalChoice.quiet
          && details.policies.targetPreference.butterfly > details.policies.targetPreference.block;
      }

      return { pass, details };
    };

    await phase(page, report, outputDir, '01-clique-comfort-raises-social-targeting', async () => runScenario('clique-comfort'));
    await phase(page, report, outputDir, '02-devoted-seek-lifts-approach-and-butterfly-targeting', async () => runScenario('devoted-seek'));
    await phase(page, report, outputDir, '03-strained-avoid-lifts-avoidance', async () => runScenario('strained-avoid'));
    await phase(page, report, outputDir, '04-protective-warning-weights-signal-choice', async () => runScenario('protective-warning'));

    report.finishedAt = new Date().toISOString();
    report.overall = report.phases.every(phaseResult => phaseResult.pass) && !report.pageErrors.length && !report.consoleErrors.length
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.finishedAt = new Date().toISOString();
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    auditId: report.auditId,
    overall: report.overall,
    outputDir,
    error: report.error || null
  }, null, 2));

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
