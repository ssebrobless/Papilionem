const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_expression_naturalness_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function timestampLabel() {
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
  await page.waitForTimeout(1000);
}

async function resetGame(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
  });
  await page.waitForFunction(() => (gameCore.getGameState?.().butterflies || []).length >= 8, null, {
    timeout: 30000
  });
}

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = timestampLabel();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    assertions: [],
    screenshots: [],
    overall: 'pending'
  };

  let browser;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await resetGame(page);

    const details = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const zoneId = state.focusedZoneId || 'moss-hollow';
      const butterflies = (state.butterflies || []).slice(0, 8);
      if (butterflies.length < 8) {
        throw new Error('Expression audit needs at least 8 butterflies');
      }
      gameConfig.expression.namedMemoryDialogue.enabled = true;
      gameConfig.expression.whyThisMoment.enabled = true;
      gameConfig.expression.causeLabel = gameConfig.expression.causeLabel || {};
      gameConfig.expression.causeLabel.enabled = true;
      gameUI.activityLogPanel.visible = true;
      gameUI.inspectPanel.visible = true;

      const labels = ['Aster', 'Briar', 'Clover', 'Iris', 'Juniper', 'Kite', 'Lumen', 'Mira'];
      butterflies.forEach((butterfly, index) => {
        butterfly.displayName = labels[index] || `Audit-${index}`;
        gameCore.assignEntityToZone?.(butterfly, zoneId);
        butterfly.currentZoneId = zoneId;
        butterfly.x = 250 + (index * 34);
        butterfly.y = 260 + ((index % 3) * 22);
        lifeSimSystem.ensureLifeSimState?.(butterfly);
      });

      const currentFrame = gameCore.getCurrentFrame?.() || 0;
      const memories = [
        { owner: 0, partner: 1, kind: 'bereavement', subtype: 'long-absence', intensity: 0.72, tags: ['long-absence'] },
        { owner: 1, partner: 2, kind: 'witnessedAffection', intensity: 0.7, tags: ['shared_attention'] },
        { owner: 2, partner: 3, kind: 'loyaltyChoice', chosenPartnerId: butterflies[3].id, rejectedPartnerId: butterflies[4].id, intensity: 0.68, tags: ['loyalty'] },
        { owner: 3, partner: 4, anchor: 'pride', reason: 'caregiving success', strength: 0.76, tags: ['admiration'] },
        { owner: 4, partner: 5, anchor: 'shame', reason: 'ignored warning', strength: 0.64, tags: ['repair'] },
        { owner: 5, partner: 6, kind: 'bereavement', intensity: 0.58, tags: ['soft-repair'] },
        { owner: 6, partner: 7, kind: 'witnessedAffection', intensity: 0.62, tags: ['warmth'] },
        { owner: 7, partner: 0, kind: 'loyaltyChoice', chosenPartnerId: butterflies[0].id, rejectedPartnerId: butterflies[2].id, intensity: 0.66, tags: ['choice'] }
      ];
      memories.forEach((memory, index) => {
        const owner = butterflies[memory.owner];
        const partner = butterflies[memory.partner];
        const edge = ensureLifeSocialEdge?.(owner, partner.id) || (owner.lifeSim.socialEdges[partner.id] = owner.lifeSim.socialEdges[partner.id] || {});
        Object.assign(edge, {
          trust: 0.55,
          comfort: 0.55,
          attachment: 0.5,
          admiration: 0.45,
          familiarity: 0.6,
          bondTier: 'companion'
        });
        const family = memory.anchor ? 'outcome' : 'social';
        owner.lifeSim.memories[family] = Array.isArray(owner.lifeSim.memories[family]) ? owner.lifeSim.memories[family] : [];
        owner.lifeSim.memories[family].unshift({
          id: `aa6_memory_${index}`,
          partnerId: partner.id,
          createdAtFrame: currentFrame - (index * 45),
          createdAtSeconds: communicationSystem.simulationClockSeconds || 0,
          decayFrames: 10800,
          ...memory
        });
      });

      const signalTypes = [
        'calming_signal',
        'acknowledgement_signal',
        'guidance_signal',
        'teaching_signal',
        'courtship_signal',
        'warning_signal',
        'calming_signal',
        'guidance_signal',
        'acknowledgement_signal',
        'teaching_signal'
      ];
      const basePhrases = [
        'stay close while the air settles.',
        'I heard you, and I am staying near.',
        'follow my turn toward the open side.',
        'watch how this path changes.',
        'keep close a little longer.',
        'do not take that sharp edge yet.',
        'breathe with me for a moment.',
        'the quieter route is this way.',
        'I will hold this line with you.',
        'remember the safe rhythm here.'
      ];
      for (let index = 0; index < basePhrases.length; index += 1) {
        const source = butterflies[index % butterflies.length];
        const target = butterflies[(index + 1) % butterflies.length];
        const dialogue = communicationSystem.createDialogueRecord({
          id: `aa6_signal_${index}`,
          signalType: signalTypes[index],
          sourceZoneId: zoneId,
          createdAtSeconds: communicationSystem.simulationClockSeconds + index,
          createdAtFrame: currentFrame + index
        }, source, [target], {
          phrase: basePhrases[index],
          targetIds: [target.id],
          targetLabels: [target.displayName],
          talkMode: 'single_target',
          phraseTemplateId: `aa6-template-${index}`,
          responseExpected: false
        });
        communicationSystem.emitDialogue(dialogue, [target]);
      }

      for (let tick = 0; tick < 1200; tick += 1) {
        sleepSystem?.update?.(state, 0.25);
        lifeSimSystem?.update?.(state, 0.25);
        mlInferenceSystem?.update?.(state, 0.25);
        communicationSystem?.update?.(state, 0.25);
        behaviorSystem?.update?.(state, 0.25);
      }

      const feedEntries = communicationSystem.getFeedEntries({ zoneId, limit: 60 });
      const packetFeedEntries = feedEntries.filter(entry => !!entry.referencedMemoryPacketId);
      const lastPacketFeedEntries = packetFeedEntries.slice(-10);
      const causeLabeledLastPacketEntries = lastPacketFeedEntries.filter(entry => !!entry.causeLabel);
      const phrases = feedEntries.flatMap(entry => entry.threadLines || []).map(line => line.phrase).filter(Boolean);
      const namedMemoryEvents = communicationSystem.dialogueHistory.filter(entry =>
        !!(entry.dialogueMetadata?.referencedMemoryPacketId || entry.metadata?.referencedMemoryPacketId)
      );
      const templateRepeats = [];
      const lastByKey = new Map();
      for (const entry of feedEntries) {
        const key = [
          entry.threadLines?.[0]?.speakerLabel || entry.headline || 'unknown',
          entry.phraseTemplateId || entry.threadLines?.[0]?.phrase || entry.detail || 'speech',
          entry.targetText || entry.conversationId || 'group'
        ].join('::');
        const frame = Math.round(((entry.timestamp || 0) - (feedEntries[0]?.timestamp || 0)) / (1000 / 60));
        const previous = lastByKey.get(key);
        if (Number.isFinite(previous) && Math.abs(frame - previous) <= 30) {
          templateRepeats.push({ key, frame, previous });
        }
        lastByKey.set(key, frame);
      }
      const inspected = butterflies.slice(0, 5).map(target => {
        gameUI.setInspectLockedTargetId?.(target.id, { gameState: state });
        const domState = gameUI.buildInspectDomState(state);
        const section = domState.detailState?.sections?.find(item => item.id === 'whyThisMoment');
        const socialPackets = Array.isArray(target.lifeSim?.memories?.social) ? target.lifeSim.memories.social : [];
        const activeSocialPackets = socialPackets.filter(packet => packet && (packet.id || packet.kind));
        const lineText = (section?.lines || []).join(' | ');
        const referencedPacketIds = activeSocialPackets.map(packet => packet.id).filter(Boolean);
        return {
          id: target.id,
          label: target.displayName,
          whyLines: section?.lines || [],
          hasWhy: !!section?.lines?.length,
          activeSocialPacketCount: activeSocialPackets.length,
          referencedPacketIds,
          strongestFeelingWithPacket: activeSocialPackets.length === 0
            || (/Feeling/i.test(lineText) && /\bpacket\s+\S+/i.test(lineText))
        };
      });
      gameUI.setInspectLockedTargetId?.(butterflies[0].id, { gameState: state });
      gameUI.buildInspectDomState(state);

      return {
        dialogueCount: communicationSystem.dialogueHistory.length,
        feedEntryCount: feedEntries.length,
        distinctDialogueTemplates: new Set(phrases).size,
        namedMemoryDialogueCount: namedMemoryEvents.length,
        namedMemorySamples: namedMemoryEvents.slice(0, 5).map(entry => ({
          sourceId: entry.sourceId,
          phrase: entry.phrase,
          referencedMemoryPacketId: entry.dialogueMetadata?.referencedMemoryPacketId || entry.metadata?.referencedMemoryPacketId || null,
          causeLabel: entry.dialogueMetadata?.causeLabel || entry.metadata?.causeLabel || null
        })),
        causeLabelFeedCoverage: {
          packetFeedCount: packetFeedEntries.length,
          lastPacketFeedCount: lastPacketFeedEntries.length,
          labeledLastPacketFeedCount: causeLabeledLastPacketEntries.length,
          samples: lastPacketFeedEntries.map(entry => ({
            headline: entry.headline,
            referencedMemoryPacketId: entry.referencedMemoryPacketId,
            causeLabel: entry.causeLabel || null
          }))
        },
        repetitionRate: feedEntries.length
          ? templateRepeats.length / feedEntries.length
          : 0,
        templateRepeats,
        inspected,
        inspectWhyCoverage: inspected.filter(entry => entry.hasWhy).length / Math.max(1, inspected.length),
        inspectFeelingPacketCoverage: inspected.filter(entry => entry.activeSocialPacketCount > 0 && entry.strongestFeelingWithPacket).length
          / Math.max(1, inspected.filter(entry => entry.activeSocialPacketCount > 0).length),
        lastFeedPresentation: gameUI.buildFeedDomState(state),
        lastInspectPresentation: gameUI.buildInspectDomState(state)
      };
    });

    report.screenshots.push(await saveShot(page, outputDir, 'aa6-expression-feed-inspect'));
    report.details = details;
    report.assertions = [
      {
        id: 'distinct-dialogue-templates',
        pass: details.distinctDialogueTemplates >= 8,
        observed: details.distinctDialogueTemplates,
        expected: '>= 8'
      },
      {
        id: 'named-memory-dialogue',
        pass: details.namedMemoryDialogueCount >= 3,
        observed: details.namedMemoryDialogueCount,
        expected: '>= 3'
      },
      {
        id: 'dialogue-repetition-rate',
        pass: details.repetitionRate <= 0.05,
        observed: details.repetitionRate,
        expected: '<= 0.05'
      },
      {
        id: 'inspect-why-this-moment',
        pass: details.inspectWhyCoverage >= 0.8,
        observed: details.inspectWhyCoverage,
        expected: '>= 0.8'
      },
      {
        id: 'inspect-strongest-feeling-packet',
        pass: details.inspectFeelingPacketCoverage >= 0.8,
        observed: details.inspectFeelingPacketCoverage,
        expected: '>= 0.8 for inspected butterflies with active social packets'
      },
      {
        id: 'feed-memory-cause-labels',
        pass: details.causeLabelFeedCoverage.labeledLastPacketFeedCount >= 5,
        observed: details.causeLabelFeedCoverage,
        expected: '>= 5 of the last 10 packet-backed feed entries'
      },
      {
        id: 'no-page-console-errors',
        pass: report.pageErrors.length === 0 && report.consoleErrors.length === 0,
        observed: { pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length },
        expected: '0/0'
      }
    ];
    report.overall = report.assertions.every(assertion => assertion.pass) ? 'pass' : 'fail';
    report.completedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath,
      assertions: report.assertions
    }, null, 2));
    if (report.overall !== 'pass') process.exitCode = 1;
  } catch (error) {
    report.overall = 'error';
    report.error = error?.stack || String(error);
    report.completedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.error(report.error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
}

run();
