const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'n7_social_surfacing_audit');
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
      gameUI.activityLogPanel.visible = false;
      gameUI.activityLogPanel.followLatest = true;
      gameUI.activityLogPanel.scrollOffset = 0;
      gameUI.activityLogPanel.filters = { talk: true, actions: true, learn: true };
      gameUI.activityLogCache = { key: null, entries: [] };
      gameUI.lastFeedPresentation = null;
      gameUI.lastInspectPresentation = null;
      gameUI.inspectPanel.visible = false;
      gameUI.inspectPanel.lockedTargetId = null;
      gameUI.clearInspectSelection?.(gameCore.getGameState());
    }
    if (typeof debugUI !== 'undefined') {
      debugUI.enabled = false;
      debugUI.lastMlExplainabilitySummary = null;
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

async function seedSurfacingScene(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const zoneId = state?.focusedZoneId;
    const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 4);
    if (butterflies.length < 4) {
      return { ok: false, reason: 'not-enough-butterflies' };
    }

    const [lead, partner, helper, observer] = butterflies;
    const place = (entity, x, y) => {
      entity.x = x;
      entity.y = y;
      entity.gridPos = gridManager.screenToIso(x, y + (entity.shadowOffset || 0));
      entity.updateZIndex?.();
    };
    place(lead, 462, 330);
    place(partner, 486, 338);
    place(helper, 506, 326);
    place(observer, 548, 350);

    const ensureEdge = (source, targetId) => {
      source.lifeSim.socialEdges = source.lifeSim.socialEdges || {};
      source.lifeSim.socialEdges[targetId] = source.lifeSim.socialEdges[targetId] || {};
      return source.lifeSim.socialEdges[targetId];
    };

    Object.assign(ensureEdge(lead, partner.id), {
      trust: 0.9,
      comfort: 0.92,
      attachment: 0.84,
      admiration: 0.42,
      chemistry: 0.76,
      resentment: 0.04,
      reciprocityScore: 0.48,
      followThroughScore: 0.68,
      recentWarmth: 0.38,
      recentEase: 0.34,
      recentMutualAttention: 0.31,
      recentFriction: 0.05,
      repairState: 'steady',
      pairTextureLabel: 'devoted'
    });
    Object.assign(ensureEdge(partner, lead.id), {
      trust: 0.88,
      comfort: 0.9,
      attachment: 0.82,
      admiration: 0.36,
      chemistry: 0.72,
      resentment: 0.04,
      reciprocityScore: 0.44,
      followThroughScore: 0.64,
      recentWarmth: 0.35,
      recentEase: 0.31,
      recentMutualAttention: 0.28,
      recentFriction: 0.04,
      repairState: 'steady',
      pairTextureLabel: 'devoted'
    });

    lead.lifeSim.social.activeContext = 'clique-comfort';
    partner.lifeSim.social.activeContext = 'clique-comfort';
    helper.lifeSim.social.activeContext = 'protective-ring';
    observer.lifeSim.social.activeContext = 'wandering';

    const socialEcology = {
      primaryRhythm: 'calming',
      primaryScore: 0.72,
      headline: 'calming | holding inside a familiar cluster',
      detail: 'roost 28 | warn 4 | teach 10 | court 18',
      societyTone: 'clique-comfort',
      societyLabel: 'clique-comfort | familiar cluster settled nearby',
      societyDetail: 'clique 62 | excl 8 | protect 24 | rep 16',
      habitatDetail: 'roost 28 | warn 4 | teach 10 | court 18',
      followThrough: {
        dominantMode: 'seek',
        label: 'seek carry-over',
        detail: 'seek 68 | avoid 6 | imitate 18 | protect 24'
      },
      localFieldLabel: 'calming | gentle nearby support field',
      localFieldDetail: 'calm 58 | guidance 22 | warning 6',
      relationshipTextureLabel: 'devoted'
    };
    lead.lifeSim.derived = lead.lifeSim.derived || {};
    partner.lifeSim.derived = partner.lifeSim.derived || {};
    lead.lifeSim.derived.socialEcology = { ...socialEcology };
    partner.lifeSim.derived.socialEcology = { ...socialEcology };

    const simSeconds = communicationSystem.simulationClockSeconds || 0;
    helper.lifeSim.communication.activeSignal = {
      signalType: 'calming',
      phrase: 'stay close together here',
      zoneId,
      targetIds: [lead.id, partner.id],
      targetCount: 2,
      expiresAtSeconds: simSeconds + 30,
      emittedAtSeconds: simSeconds
    };

    lead.lifeSim.communication.activeConversation = {
      partnerId: partner.id,
      partnerLabel: partner.displayName || partner.name || partner.id,
      phrase: 'stay close, i like this pocket',
      zoneId,
      turnCount: 2
    };
    partner.lifeSim.communication.activeConversation = {
      partnerId: lead.id,
      partnerLabel: lead.displayName || lead.name || lead.id,
      phrase: 'i am staying with you here',
      zoneId,
      turnCount: 2
    };

    const conversationId = communicationSystem.getConversationId(lead.id, partner.id, zoneId);
    const now = Date.now();
    communicationSystem.dialogueHistory = [
      {
        id: 'n7-dialogue-1',
        timestamp: now - 1200,
        sourceId: lead.id,
        sourceLabel: lead.displayName || lead.name || lead.id,
        targetIds: [partner.id],
        targetLabels: [partner.displayName || partner.name || partner.id],
        sourceZoneId: zoneId,
        phrase: 'stay close, i like this pocket',
        talkMode: 'single_target',
        targetCount: 1,
        conversationId,
        residues: [{
          recipientId: partner.id,
          partnerId: lead.id,
          recipientLabel: partner.displayName || partner.name || partner.id,
          label: 'comfort reinforced',
          rememberability: 'steady'
        }]
      },
      {
        id: 'n7-dialogue-2',
        timestamp: now - 600,
        sourceId: partner.id,
        sourceLabel: partner.displayName || partner.name || partner.id,
        targetIds: [lead.id],
        targetLabels: [lead.displayName || lead.name || lead.id],
        sourceZoneId: zoneId,
        phrase: 'i am staying with you here',
        talkMode: 'single_target',
        targetCount: 1,
        conversationId,
        residues: [{
          recipientId: lead.id,
          partnerId: partner.id,
          recipientLabel: lead.displayName || lead.name || lead.id,
          label: 'companionship anchored',
          rememberability: 'steady'
        }]
      }
    ];

    gameUI.activityLogPanel.visible = true;
    gameUI.activityLogPanel.followLatest = true;
    gameUI.activityLogPanel.filters = { talk: true, actions: true, learn: true };
    gameUI.activityLogCache = { key: null, entries: [] };
    gameUI.inspectPanel.visible = true;
    gameUI.inspectPanel.lockedTargetId = lead.id;
    gameUI.inspectControl.browseScope = 'zone';
    gameUI.lastFeedPresentation = null;
    gameUI.lastInspectPresentation = null;

    if (typeof debugUI !== 'undefined') {
      debugUI.enabled = true;
      debugUI.lastMlExplainabilitySummary = null;
    }

    return {
      ok: true,
      zoneId,
      leadId: lead.id,
      partnerId: partner.id,
      conversationId
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
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await resetBaseline(page);

    const seed = await seedSurfacingScene(page);
    if (!seed?.ok) {
      throw new Error(`Unable to seed surfacing scene: ${seed?.reason || 'unknown'}`);
    }
    await page.waitForTimeout(1200);

    await phase(page, report, outputDir, '01-inspect-social-lens', async () => {
      const details = await page.evaluate(() => {
        const domInspectState = gameUI.buildInspectDomState?.(gameCore.getGameState?.() || gameCore.gameState) || null;
        const snapshot = gameUI.lastInspectPresentation || domInspectState?.detailState || null;
        const socialLens = snapshot?.sections?.find(section => section.id === 'socialLens') || null;
        return {
          targetId: snapshot?.targetId || domInspectState?.targetId || null,
          sectionIds: (snapshot?.sections || []).map(section => section.id),
          socialLensLines: socialLens?.lines || []
        };
      });
      const socialLensText = (details.socialLensLines || []).join(' || ').toLowerCase();
      return {
        pass:
          !!details.targetId &&
          details.sectionIds.includes('socialLens') &&
          /texture/.test(socialLensText) &&
          /field /.test(socialLensText) &&
          /society /.test(socialLensText) &&
          /ml /.test(socialLensText) &&
          /why /.test(socialLensText),
        details
      };
    });

    await phase(page, report, outputDir, '02-feed-context-footer', async () => {
      const details = await page.evaluate(() => {
        const presentation = gameUI.lastFeedPresentation || null;
        const talkEntry = (presentation?.entries || []).find(entry => entry.category === 'talk' && entry.footer) || null;
        return {
          contextLabel: presentation?.contextLabel || null,
          talkEntry
        };
      });
      const footer = (details.talkEntry?.footer || '').toLowerCase();
      return {
        pass:
          !!details.contextLabel &&
          !!details.talkEntry &&
          /devoted/.test(footer) &&
          /(holding|familiar|cluster|turns)/.test(footer),
        details
      };
    });

    await phase(page, report, outputDir, '03-debug-social-bridge', async () => {
      const details = await page.evaluate(() => {
        const snapshot = debugUI?.buildMlExplainabilitySnapshot?.(gameCore.getGameState())
          || debugUI?.lastMlExplainabilitySummary
          || null;
        return {
          lines: snapshot?.lines || []
        };
      });
      const lineText = details.lines.join(' || ');
      return {
        pass:
          details.lines.some(line => line.startsWith('Social ')) &&
          details.lines.some(line => line.startsWith('Pair ')) &&
          details.lines.some(line => line.startsWith('Field ')) &&
          /Why /.test(lineText),
        details
      };
    });

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  }

  console.log(JSON.stringify(report, null, 2));
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
