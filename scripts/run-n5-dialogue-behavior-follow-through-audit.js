const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'n5_dialogue_behavior_follow_through_audit');
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

    const runScenario = async (scenario) => {
      await resetBaseline(page);
      const details = await page.evaluate((scenarioName) => {
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
          entity.timers.postFeedingCooldown = 0;
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
          place(entity, 384 + (index * 26), 318 + ((index % 2) * 18));
          entity.lifeSim.social.activeContext = 'wandering';
          entity.lifeSim.communication.activeSignal = null;
          entity.lifeSim.communication.activeConversation = null;
          entity.lifeSim.communication.recentDialogues = [];
          entity.lifeSim.communication.recentResidues = [];
          entity.lifeSim.communication.retainedLessons = [];
          entity.lifeSim.interpretation.clarity = 0.95;
          entity.lifeSim.emotions.threat = 0.04;
          entity.lifeSim.emotions.agitation = 0.06;
          entity.lifeSim.emotions.rejection = 0.04;
          entity.lifeSim.social.confidence = 0.5;
          entity.lifeSim.social.belonging = 0.5;
        });

        const [focus, a, b, c, d, e] = butterflies;
        let partner = null;
        let runtime = null;
        let summary = null;
        let targetDistance = null;
        let currentDistance = null;

        if (scenarioName === 'partner-return') {
          partner = a;
          place(focus, 410, 340);
          place(partner, 438, 334);
          configurePair(
            focus,
            partner,
            {
              trust: 0.86,
              comfort: 0.88,
              attachment: 0.82,
              admiration: 0.26,
              protectiveness: 0.16,
              reciprocityScore: 0.36,
              followThroughScore: 0.62,
              recentWarmth: 0.3,
              recentEase: 0.28,
              recentMutualAttention: 0.24,
              recentFriction: 0.02,
              resentment: 0.02,
              rejectionWeight: 0.01,
              forgivenessWeight: 0.1,
              repairState: 'steady',
              recentResidues: [{ type: 'shared-calm' }]
            },
            {
              trust: 0.78,
              comfort: 0.8,
              attachment: 0.7,
              admiration: 0.22,
              protectiveness: 0.1,
              reciprocityScore: 0.32,
              followThroughScore: 0.48,
              recentWarmth: 0.26,
              recentEase: 0.24,
              recentMutualAttention: 0.22,
              recentFriction: 0.02,
              resentment: 0.02,
              rejectionWeight: 0.01,
              forgivenessWeight: 0.08,
              repairState: 'steady',
              recentResidues: [{ type: 'shared-calm' }]
            }
          );
        } else if (scenarioName === 'strained-avoidance') {
          partner = b;
          place(focus, 412, 338);
          place(partner, 440, 338);
          place(a, 494, 344);
          configurePair(
            focus,
            partner,
            {
              trust: 0.08,
              comfort: 0.1,
              attachment: 0.02,
              admiration: 0.02,
              protectiveness: 0.02,
              reciprocityScore: 0.02,
              followThroughScore: 0.04,
              recentWarmth: 0.02,
              recentEase: 0.02,
              recentMutualAttention: 0.06,
              recentFriction: 0.54,
              resentment: 0.58,
              rejectionWeight: 0.32,
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
              reciprocityScore: 0.02,
              followThroughScore: 0.04,
              recentWarmth: 0.02,
              recentEase: 0.02,
              recentMutualAttention: 0.04,
              recentFriction: 0.48,
              resentment: 0.52,
              rejectionWeight: 0.28,
              forgivenessWeight: 0.02,
              repairState: 'hurt',
              recentResidues: [{ type: 'gentle-rejection' }]
            }
          );
        } else if (scenarioName === 'admiring-shadow') {
          partner = c;
          place(focus, 406, 348);
          place(partner, 458, 324);
          configurePair(
            focus,
            partner,
            {
              trust: 0.32,
              comfort: 0.24,
              attachment: 0.12,
              admiration: 0.84,
              protectiveness: 0.04,
              reciprocityScore: 0.12,
              followThroughScore: 0.34,
              recentWarmth: 0.12,
              recentEase: 0.1,
              recentMutualAttention: 0.2,
              recentFriction: 0.02,
              resentment: 0.02,
              rejectionWeight: 0.02,
              forgivenessWeight: 0.04,
              repairState: 'steady',
              recentResidues: [{ type: 'small-praise' }]
            },
            {
              trust: 0.26,
              comfort: 0.2,
              attachment: 0.08,
              admiration: 0.12,
              protectiveness: 0.02,
              reciprocityScore: 0.08,
              followThroughScore: 0.12,
              recentWarmth: 0.08,
              recentEase: 0.06,
              recentMutualAttention: 0.14,
              recentFriction: 0.02,
              resentment: 0.02,
              rejectionWeight: 0.02,
              forgivenessWeight: 0.04,
              repairState: 'steady',
              recentResidues: [{ type: 'shared-observation' }]
            }
          );
        } else if (scenarioName === 'protective-follow-through') {
          partner = d;
          place(focus, 408, 344);
          place(partner, 446, 326);
          partner.state = 'scared';
          partner.lifeSim.emotions.threat = 0.82;
          partner.lifeSim.social.confidence = 0.12;
          configurePair(
            focus,
            partner,
            {
              trust: 0.62,
              comfort: 0.58,
              attachment: 0.42,
              admiration: 0.1,
              protectiveness: 0.82,
              reciprocityScore: 0.18,
              followThroughScore: 0.38,
              recentWarmth: 0.16,
              recentEase: 0.12,
              recentMutualAttention: 0.18,
              recentFriction: 0.04,
              resentment: 0.02,
              rejectionWeight: 0.02,
              forgivenessWeight: 0.06,
              repairState: 'steady',
              recentResidues: [{ type: 'protective-warning' }]
            },
            {
              trust: 0.4,
              comfort: 0.42,
              attachment: 0.26,
              admiration: 0.08,
              protectiveness: 0.12,
              reciprocityScore: 0.12,
              followThroughScore: 0.18,
              recentWarmth: 0.12,
              recentEase: 0.1,
              recentMutualAttention: 0.12,
              recentFriction: 0.04,
              resentment: 0.02,
              rejectionWeight: 0.02,
              forgivenessWeight: 0.04,
              repairState: 'steady',
              recentResidues: [{ type: 'comfort-heard' }]
            }
          );
        }

        butterflies.forEach(entity => lifeSimSystem.updateButterfly(entity, state));
        behaviorSystem.update(state, 1 / 60);
        focus.pickNewWanderTarget();
        behaviorSystem.update(state, 1 / 60);

        runtime = behaviorSystem.getRuntime(focus.id);
        summary = lifeSimSystem.getEntitySummary(focus.id)?.socialEcology?.followThrough || null;
        const target = focus.movement?.target || null;
        const targetScreen = target
          ? (target.space === 'board' || Number.isFinite(target.u) || Number.isFinite(target.v)
            ? renderManager.boardToScreen?.({
                zoneId: target.zoneId || zoneId,
                u: Number.isFinite(target.u) ? target.u : target.x,
                v: Number.isFinite(target.v) ? target.v : target.y,
                h: target.h || 0
              })
            : gridManager.isoToScreen(target.x, target.y))
          : null;
        const partnerGroundPoint = partner?.gridPos
          ? gridManager.isoToScreen(partner.gridPos.x, partner.gridPos.y)
          : (partner
            ? {
                x: partner.x || 0,
                y: (partner.y || 0) + (partner.shadowOffset || 0)
              }
            : null);
        currentDistance = partner ? Math.hypot((focus.x || 0) - (partner.x || 0), (focus.y || 0) - (partner.y || 0)) : null;
        targetDistance = partnerGroundPoint && targetScreen
          ? Math.hypot((targetScreen.x || 0) - (partnerGroundPoint.x || 0), (targetScreen.y || 0) - (partnerGroundPoint.y || 0))
          : null;

        return {
          ok: !!runtime && !!summary,
          scenario: scenarioName,
          runtime,
          summary,
          currentDistance: currentDistance ? Number(currentDistance.toFixed(2)) : null,
          targetDistance: targetDistance ? Number(targetDistance.toFixed(2)) : null
        };
      }, scenario);

      return details;
    };

    await phase(page, report, outputDir, '01-partner-return-keeps-close-to-familiar-partner', async () => {
      const details = await runScenario('partner-return');
      const pass = details.ok === true
        && details.runtime?.currentActionSubtype === 'partner-return'
        && details.summary?.dominantMode === 'seek'
        && details.targetDistance !== null
        && details.targetDistance < 82;
      return { pass, details };
    });

    await phase(page, report, outputDir, '02-strained-partner-avoidance-keeps-distance', async () => {
      const details = await runScenario('strained-avoidance');
      const pass = details.ok === true
        && details.runtime?.currentActionSubtype === 'strained-avoidance'
        && details.summary?.dominantMode === 'avoid'
        && details.targetDistance !== null
        && details.currentDistance !== null
        && details.targetDistance > details.currentDistance
        && details.targetDistance > 112;
      return { pass, details };
    });

    await phase(page, report, outputDir, '03-admiring-shadow-stays-near-admired-butterfly', async () => {
      const details = await runScenario('admiring-shadow');
      const pass = details.ok === true
        && details.runtime?.currentActionSubtype === 'admiring-shadow'
        && details.summary?.dominantMode === 'imitate'
        && details.targetDistance !== null
        && details.targetDistance < 92;
      return { pass, details };
    });

    await phase(page, report, outputDir, '04-protective-follow-through-holds-near-vulnerable-partner', async () => {
      const details = await runScenario('protective-follow-through');
      const pass = details.ok === true
        && details.runtime?.currentActionSubtype === 'protective-follow-through'
        && details.summary?.dominantMode === 'protect'
        && details.targetDistance !== null
        && details.targetDistance < 86;
      return { pass, details };
    });

    report.overall = report.phases.every(phase => phase.pass) ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error && error.stack ? error.stack : error);
  } finally {
    report.finishedAt = new Date().toISOString();
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
