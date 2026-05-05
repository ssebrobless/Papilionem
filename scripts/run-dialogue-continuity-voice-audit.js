const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'dialogue_continuity_voice_audit');
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-world-rendermode'
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
  for (let attempt = 0; attempt < 80; attempt += 1) {
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
  await page.waitForTimeout(900);
}

async function captureStorage(page) {
  return page.evaluate(keys => keys.reduce((snapshot, key) => {
    snapshot[key] = window.localStorage.getItem(key);
    return snapshot;
  }, {}), STORAGE_KEYS);
}

async function restoreStorage(page, snapshot) {
  await page.evaluate(({ keys, snapshot: stored }) => {
    for (const key of keys) {
      if (stored[key] == null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, stored[key]);
    }
  }, { keys: STORAGE_KEYS, snapshot });
}

async function resetBaseline(page) {
  await page.evaluate(keys => {
    keys.forEach(key => window.localStorage.removeItem(key));
    window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
    window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame?.(true);
    if (gameUI?.firstSessionGuide) gameUI.firstSessionGuide.visible = false;
    eventBus.clearHistory?.();
    communicationSystem.history = [];
    communicationSystem.dialogueHistory = [];
    communicationSystem.responseQueue = [];
    communicationSystem.simulationClockSeconds = 0;
    for (let attempt = 0; attempt < 180 && (gameCore.getGameState?.()?.butterflies?.length || 0) < 6; attempt += 1) {
      gameCore.update?.();
    }
  });
}

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
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
    checks: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let page;
  let initialStorage = null;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error?.message || error)));
    page.on('console', message => {
      if (message.type() === 'error') report.consoleErrors.push(message.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    initialStorage = await captureStorage(page);
    await resetBaseline(page);

    report.continuity = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const zoneId = state.focusedZoneId;
      const pair = (gameCore.getButterfliesInZone?.(zoneId) || state.butterflies || []).slice(0, 2);
      if (pair.length < 2) return { ok: false, reason: 'not-enough-butterflies' };
      const [speaker, listener] = pair;
      const tune = (entity, index) => {
        lifeSimSystem?.ensureLifeSimState?.(entity);
        entity.lifeSim.communication.expressiveness = 0.94;
        entity.lifeSim.communication.receptivity = 0.94;
        entity.lifeSim.interpretation.clarity = 0.96;
        entity.lifeSim.social.confidence = 0.72;
        entity.x = 430 + (index * 24);
        entity.y = 390 + (index * 8);
        entity.currentZoneId = zoneId;
        entity.lifeSim.lifecycle.currentZoneId = zoneId;
        ensureLifeSocialEdge?.(speaker, listener.id);
        ensureLifeSocialEdge?.(listener, speaker.id);
      };
      tune(speaker, 0);
      tune(listener, 1);
      Object.assign(speaker.lifeSim.socialEdges[listener.id], {
        trust: 0.72,
        comfort: 0.76,
        attachment: 0.42,
        recentWarmth: 0.2,
        recentEase: 0.18
      });
      Object.assign(listener.lifeSim.socialEdges[speaker.id], {
        trust: 0.7,
        comfort: 0.78,
        attachment: 0.4,
        recentWarmth: 0.18,
        recentEase: 0.18
      });

      communicationSystem.simulationClockSeconds = 20;
      const opener = communicationSystem.createDialogueRecord({
        signalType: 'acknowledgement_signal',
        sourceZoneId: zoneId,
        createdAtSeconds: 20
      }, speaker, [listener], {
        targetIds: [listener.id],
        targetLabels: [communicationSystem.getEntityLabel(listener)],
        targetLabel: communicationSystem.getEntityLabel(listener),
        talkMode: 'single_target',
        responseExpected: false,
        phrase: 'You can stay beside me. I do not need more than your company right now.'
      });
      communicationSystem.emitDialogue(opener, [listener]);
      communicationSystem.simulationClockSeconds = 82;
      const later = communicationSystem.createDialogueRecord({
        signalType: 'acknowledgement_signal',
        sourceZoneId: zoneId,
        createdAtSeconds: 82
      }, listener, [speaker], {
        targetIds: [speaker.id],
        targetLabels: [communicationSystem.getEntityLabel(speaker)],
        targetLabel: communicationSystem.getEntityLabel(speaker),
        talkMode: 'single_target',
        responseExpected: false
      });
      communicationSystem.emitDialogue(later, [speaker]);
      const sourceSummary = communicationSystem.getCommunicationSummary(listener.id);
      const feedTalk = gameUI.getRecentActivityEntries()
        .filter(entry => entry.category === 'talk')
        .slice(0, 6);
      return {
        ok: true,
        opener: {
          phrase: opener.phrase,
          intentSubtype: opener.intentSubtype
        },
        later: {
          phrase: later.phrase,
          basePhrase: later.basePhrase,
          metadata: later.metadata,
          phraseTemplateId: later.phraseTemplateId,
          intentSubtype: later.intentSubtype
        },
        sourceSummary: {
          recentResidueLabel: sourceSummary?.recentResidueLabel || null,
          voiceSummaryLabel: sourceSummary?.voiceSummaryLabel || null
        },
        feedTalk: feedTalk.map(entry => ({
          headline: entry.headline,
          detail: entry.detail,
          causeLabel: entry.causeLabel || null,
          referencedResidueType: entry.metadata?.referencedResidueType || null,
          conversationContinuity: entry.metadata?.conversationContinuity === true
        }))
      };
    });

    await resetBaseline(page);
    report.voice = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const zoneId = state.focusedZoneId;
      const entities = (gameCore.getButterfliesInZone?.(zoneId) || state.butterflies || []).slice(0, 5);
      if (entities.length < 5) return { ok: false, reason: 'not-enough-butterflies' };
      const target = entities[0];
      const specs = [
        {
          key: 'plain-skittish',
          entity: entities[1],
          signalType: 'acknowledgement_signal',
          personalityType: 'skittish',
          communication: { expressiveness: 0.12, receptivity: 0.16 },
          interpretation: { clarity: 0.18 },
          social: { confidence: 0.12 },
          emotions: { agitation: 0.12, threat: 0.08 },
          traits: { trustSpeed: 0.84, jitteriness: 2.2 }
        },
        {
          key: 'warm-friendly',
          entity: entities[2],
          signalType: 'acknowledgement_signal',
          personalityType: 'friendly',
          communication: { expressiveness: 0.72, receptivity: 0.76 },
          interpretation: { clarity: 0.74 },
          social: { confidence: 0.64 },
          emotions: { agitation: 0.04, threat: 0.02 },
          traits: { trustSpeed: 1.08, jitteriness: 0.9 }
        },
        {
          key: 'formal-scholar',
          entity: entities[3],
          signalType: 'teaching_signal',
          personalityType: 'wise',
          specialAbility: 'ancient_scholar',
          communication: { expressiveness: 0.98, receptivity: 0.98 },
          interpretation: { clarity: 0.99 },
          social: { confidence: 0.9 },
          emotions: { agitation: 0.02, threat: 0.02 },
          traits: { trustSpeed: 1.24, jitteriness: 0.64 }
        },
        {
          key: 'urgent-cautious',
          entity: entities[4],
          signalType: 'warning_signal',
          personalityType: 'cautious',
          communication: { expressiveness: 0.62, receptivity: 0.58 },
          interpretation: { clarity: 0.64 },
          social: { confidence: 0.48 },
          emotions: { agitation: 0.82, threat: 0.78 },
          traits: { trustSpeed: 0.96, jitteriness: 1.3 }
        }
      ];
      const records = specs.map((spec, index) => {
        const entity = spec.entity;
        lifeSimSystem?.ensureLifeSimState?.(entity);
        entity.personalityType = spec.personalityType;
        entity.specialAbility = spec.specialAbility || null;
        entity.traits = { ...(entity.traits || {}), ...spec.traits };
        Object.assign(entity.lifeSim.communication, spec.communication);
        Object.assign(entity.lifeSim.interpretation, spec.interpretation);
        Object.assign(entity.lifeSim.social, spec.social);
        Object.assign(entity.lifeSim.emotions, spec.emotions);
        entity.currentZoneId = zoneId;
        entity.lifeSim.lifecycle.currentZoneId = zoneId;
        communicationSystem.simulationClockSeconds = 200 + index;
        const record = communicationSystem.createDialogueRecord({
          signalType: spec.signalType,
          sourceZoneId: zoneId,
          createdAtSeconds: communicationSystem.simulationClockSeconds
        }, entity, [target], {
          targetIds: [target.id],
          targetLabels: [communicationSystem.getEntityLabel(target)],
          targetLabel: communicationSystem.getEntityLabel(target),
          talkMode: 'single_target',
          responseExpected: false
        });
        return {
          key: spec.key,
          signalType: spec.signalType,
          phrase: record?.phrase || '',
          basePhrase: record?.basePhrase || '',
          languageBand: record?.languageBand || null,
          tone: record?.tone || null,
          register: record?.register || null,
          wordCount: String(record?.phrase || '').split(/\s+/).filter(Boolean).length,
          signature: [record?.languageBand, record?.register, record?.tone].filter(Boolean).join('|')
        };
      });
      return {
        ok: true,
        records,
        uniqueSignatureCount: new Set(records.map(record => record.signature)).size,
        uniquePhraseCount: new Set(records.map(record => record.phrase.toLowerCase())).size
      };
    });

    report.screenshot = await saveShot(page, outputDir, 'dialogue-continuity-voice');
    await restoreStorage(page, initialStorage);

    const continuityPhrase = report.continuity?.later?.phrase || '';
    const continuityMetadata = report.continuity?.later?.metadata || {};
    report.checks.push({
      name: 'browser-clean',
      pass: report.pageErrors.length === 0 && report.consoleErrors.length === 0,
      details: { pageErrors: report.pageErrors, consoleErrors: report.consoleErrors }
    });
    report.checks.push({
      name: 'conversation-continuity-visible',
      pass: report.continuity?.ok === true
        && continuityMetadata.conversationContinuity === true
        && /kept thinking|earlier|quiet moment|last talk/i.test(continuityPhrase)
        && /earlier talk/i.test(continuityMetadata.causeLabel || '')
        && (report.continuity?.feedTalk || []).some(entry =>
          entry.conversationContinuity === true
          && /earlier talk/i.test(entry.causeLabel || '')
        ),
      details: {
        phrase: continuityPhrase,
        metadata: continuityMetadata,
        feedTalk: report.continuity?.feedTalk || []
      }
    });
    const voiceRecords = report.voice?.records || [];
    const byKey = Object.fromEntries(voiceRecords.map(record => [record.key, record]));
    report.checks.push({
      name: 'voice-differentiation-visible',
      pass: report.voice?.ok === true
        && report.voice.uniqueSignatureCount >= 4
        && report.voice.uniquePhraseCount >= 4
        && byKey['plain-skittish']?.languageBand === 'below_average'
        && byKey['formal-scholar']?.languageBand === 'exceptional'
        && byKey['formal-scholar']?.register === 'formal'
        && byKey['urgent-cautious']?.tone === 'aggressive'
        && byKey['urgent-cautious']?.phrase?.endsWith('!')
        && byKey['formal-scholar']?.wordCount > byKey['plain-skittish']?.wordCount,
      details: report.voice
    });
    report.overall = report.checks.every(check => check.pass) ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
    if (page && initialStorage) await restoreStorage(page, initialStorage).catch(() => {});
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath,
      checks: report.checks.map(check => ({ name: check.name, pass: check.pass }))
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  }
}

run();
