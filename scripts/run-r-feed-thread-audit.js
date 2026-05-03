const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_feed_thread_audit');
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
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  report.server = { reused: false, pid: child.pid };

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

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
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
    gameUI.firstSessionGuide.visible = false;
    gameUI.activityLogPanel.visible = true;
    gameUI.activityLogPanel.followLatest = true;
    gameUI.activityLogPanel.scrollOffset = 0;
    gameUI.activityLogPanel.filters = {
      talk: true,
      action: true,
      learn: true,
      warning: true,
      system: true
    };
    gameUI.normalizeActivityLogFilters?.();
    gameUI.activityLogCache = { key: null, entries: [] };
    gameUI.inspectPanel.visible = false;
    gameUI.clearInspectSelection?.(gameCore.getGameState());
    eventBus.clearHistory?.();
    if (typeof communicationSystem !== 'undefined') {
      communicationSystem.history = [];
      communicationSystem.dialogueHistory = [];
      communicationSystem.responseQueue = [];
      communicationSystem.simulationClockSeconds = 0;
    }
  });
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

async function seedFeedScenario(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const zoneId = state.focusedZoneId;
    const pair = (gameCore.getButterfliesInZone?.(zoneId) || state.butterflies || []).slice(0, 2);
    if (pair.length < 2) {
      return { ok: false, reason: 'not-enough-butterflies' };
    }

    const [left, right] = pair;
    lifeSimSystem?.ensureLifeSimState?.(left);
    lifeSimSystem?.ensureLifeSimState?.(right);
    left.x = 520;
    left.y = 420;
    right.x = 540;
    right.y = 428;
    left.currentZoneId = zoneId;
    right.currentZoneId = zoneId;
    ensureLifeSocialEdge(left, right.id);
    ensureLifeSocialEdge(right, left.id);
    Object.assign(left.lifeSim.socialEdges[right.id], {
      trust: 0.52,
      comfort: 0.58,
      admiration: 0.2,
      resentment: 0.01
    });
    Object.assign(right.lifeSim.socialEdges[left.id], {
      trust: 0.5,
      comfort: 0.56,
      admiration: 0.18,
      resentment: 0.02
    });
    left.lifeSim.communication.expressiveness = 0.98;
    left.lifeSim.communication.receptivity = 0.98;
    left.lifeSim.interpretation.clarity = 0.96;
    right.lifeSim.communication.expressiveness = 0.98;
    right.lifeSim.communication.receptivity = 0.98;
    right.lifeSim.interpretation.clarity = 0.96;
    left.lifeSim.memories.social = Array.isArray(left.lifeSim.memories.social) ? left.lifeSim.memories.social : [];
    right.lifeSim.memories.social = Array.isArray(right.lifeSim.memories.social) ? right.lifeSim.memories.social : [];
    left.lifeSim.memories.social.unshift({
      id: 'r7_thread_memory_left',
      kind: 'loyaltyChoice',
      partnerId: right.id,
      chosenPartnerId: right.id,
      rejectedPartnerId: null,
      intensity: 0.72,
      createdAtFrame: gameCore.getCurrentFrame?.() || 0,
      createdAtSeconds: 120,
      decayFrames: 10800
    });
    right.lifeSim.memories.social.unshift({
      id: 'r7_thread_memory_right',
      kind: 'witnessedAffection',
      partnerId: left.id,
      thirdPartyId: left.id,
      intensity: 0.68,
      createdAtFrame: gameCore.getCurrentFrame?.() || 0,
      createdAtSeconds: 120,
      decayFrames: 10800
    });

    eventBus.clearHistory?.();
    communicationSystem.history = [];
    communicationSystem.dialogueHistory = [];
    communicationSystem.responseQueue = [];

    const base = Date.now();
    const baseSeconds = 120;
    const emit = (source, target, offsetMs, signalType, intentFamily, intentTags, phrase) => {
      communicationSystem.simulationClockSeconds = baseSeconds + (offsetMs / 1000);
      const dialogue = communicationSystem.createDialogueRecord({
        signalType,
        sourceZoneId: zoneId,
        createdAtSeconds: communicationSystem.simulationClockSeconds
      }, source, [target], {
        id: `r7_${source.id}_${target.id}_${offsetMs}`,
        timestamp: base + offsetMs,
        createdAtSeconds: communicationSystem.simulationClockSeconds,
        phrase,
        talkMode: 'single_target',
        targetIds: [target.id],
        targetLabels: [communicationSystem.getEntityLabel(target)],
        intentFamily,
        intentTags,
        responseExpected: false
      });
      return communicationSystem.emitDialogue(dialogue, [target]);
    };

    emit(left, right, 0, 'acknowledgement_signal', 'social', ['companionship', 'warmth'], 'Stay with me near the grid.');
    emit(right, left, 800, 'acknowledgement_signal', 'social', ['companionship', 'warmth'], 'I am staying close.');
    emit(left, right, 1600, 'acknowledgement_signal', 'social', ['companionship', 'shared_attention'], 'Watch the edge with me.');
    emit(right, left, 2400, 'acknowledgement_signal', 'social', ['companionship', 'agreement'], 'I see it too.');
    emit(left, right, 2600, 'teaching_signal', 'teaching', ['teaching'], 'Line up one cell at a time.');
    emit(right, left, 7000, 'calming_signal', 'care', ['comfort'], 'Take a breath here.');
    emit(left, right, 7800, 'guidance_signal', 'guidance', ['warning', 'guidance'], 'Back away from that hard edge.');
    emit(right, left, 8600, 'guidance_signal', 'guidance', ['warning', 'agreement'], 'I will move back.');

    eventBus.emit(GameEvents.BUTTERFLY_STATE_CHANGED, {
      butterfly: left,
      entityId: left.id,
      to: 'scared',
      zoneId,
      safetyAvoidanceTrigger: 'covered-edge'
    });
    eventBus.emit(GameEvents.BUTTERFLY_STATE_CHANGED, {
      butterfly: right,
      entityId: right.id,
      to: 'scared',
      zoneId
    });
    eventBus.emit(GameEvents.OBJECT_PICKED_UP, {
      sourceId: left.id,
      entityId: left.id,
      zoneId,
      objectType: 'block'
    });
    eventBus.emit(GameEvents.TEACHING_COMPLETED, {
      teacherId: left.id,
      listenerId: right.id,
      zoneId,
      stationLabel: 'grid'
    });

    gameUI.activityLogCache = { key: null, entries: [] };
    return {
      ok: true,
      zoneId,
      leftId: left.id,
      rightId: right.id,
      dialogueCount: communicationSystem.dialogueHistory.length
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
    outputDir,
    url: URL,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    phases: [],
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
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    await phase(page, report, outputDir, '01-thread-category-contract', async () => {
      await resetBaseline(page);
      const seed = await seedFeedScenario(page);
      if (!seed.ok) return { pass: false, details: seed };

      const details = await page.evaluate(() => {
        const buttons = gameUI.getFeedFilterButtons().map(button => ({ id: button.id, label: button.label }));
        const entries = gameUI.getRecentActivityEntries();
        const categories = [...new Set(entries.map(entry => entry.category))].sort();
        const talkThreads = entries.filter(entry => entry.category === 'talk' && Array.isArray(entry.threadLines));
        const causeLabelEntries = entries.filter(entry => entry.category === 'talk' && entry.referencedMemoryPacketId && entry.causeLabel);
        const socialThread = talkThreads.find(entry =>
          entry.motiveFamily === 'social'
          || (entry.contextTags || []).some(tag => /social motive/i.test(tag))
          || (entry.grounding || '').includes('social motive')
        ) || null;
        const warningEntries = entries.filter(entry => entry.category === 'warning');
        const warningTriggerEvents = eventBus.getHistory(GameEvents.BUTTERFLY_STATE_CHANGED)
          .filter(entry => entry?.data?.threatSignalId || entry?.data?.dangerMemoryId || entry?.data?.safetyAvoidanceTrigger);
        return {
          buttons,
          categories,
          dialogueCount: communicationSystem.dialogueHistory.length,
          talkThreadCount: talkThreads.length,
          socialThread: socialThread ? {
            headline: socialThread.headline,
            detail: socialThread.detail,
            grounding: socialThread.grounding,
            contextTags: socialThread.contextTags,
            threadLines: socialThread.threadLines,
            consequenceTail: socialThread.consequenceTail,
            referencedMemoryPacketId: socialThread.referencedMemoryPacketId || null,
            causeLabel: socialThread.causeLabel || null
          } : null,
          causeLabelCount: causeLabelEntries.length,
          causeLabelSamples: causeLabelEntries.slice(0, 5).map(entry => ({
            headline: entry.headline,
            referencedMemoryPacketId: entry.referencedMemoryPacketId,
            causeLabel: entry.causeLabel
          })),
          warningCount: warningEntries.length,
          warningTriggerCount: warningTriggerEvents.length,
          warningEntries
        };
      });

      const buttonIds = details.buttons.map(button => button.id);
      const canonicalButtons = JSON.stringify(buttonIds) === JSON.stringify(['talk', 'action', 'learn', 'warning', 'system']);
      const canonicalCategories = details.categories.every(category => ['talk', 'action', 'learn', 'warning', 'system'].includes(category));
      return {
        pass:
          canonicalButtons
          && canonicalCategories
          && details.dialogueCount >= 8
          && !!details.socialThread
          && (details.socialThread.threadLines?.length || 0) >= 2
          && (details.socialThread.threadLines?.length || 0) <= 4
          && /social motive/i.test(`${details.socialThread.grounding || ''} ${(details.socialThread.contextTags || []).join(' ')}`)
          && /trust|comfort|admiration|follow-through|warmth|attention/i.test(details.socialThread.consequenceTail || details.socialThread.detail || '')
          && details.causeLabelCount >= 1
          && details.warningCount === details.warningTriggerCount
          && details.warningCount === 1,
        details
      };
    });

    await phase(page, report, outputDir, '02-filter-chip-isolation', async () => {
      await resetBaseline(page);
      const seed = await seedFeedScenario(page);
      if (!seed.ok) return { pass: false, details: seed };
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const ids = ['talk', 'action', 'learn', 'warning', 'system'];
        const byFilter = {};
        for (const id of ids) {
          gameUI.activityLogPanel.filters = {
            talk: false,
            action: false,
            learn: false,
            warning: false,
            system: false,
            [id]: true
          };
          gameUI.activityLogCache = { key: null, entries: [] };
          const domState = gameUI.buildFeedDomState(state);
          byFilter[id] = domState.entries.map(entry => ({
            category: entry.category,
            headline: entry.headline,
            detail: entry.detail
          }));
        }
        gameUI.activityLogPanel.filters = {
          talk: true,
          action: true,
          learn: true,
          warning: true,
          system: true
        };
        gameUI.activityLogCache = { key: null, entries: [] };
        return { byFilter };
      });

      const filterPass = Object.entries(details.byFilter).every(([id, entries]) => {
        if (!entries.length) return false;
        return entries.every(entry => entry.category === id || (id === 'system' && entry.category === 'system'));
      });
      return { pass: filterPass, details };
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
