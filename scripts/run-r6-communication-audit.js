const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r6_communication_audit');
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

function learnEntriesContain(entries = [], pattern = '') {
  return (entries || []).some(entry => {
    const haystack = [entry?.headline, entry?.detail, entry?.line].filter(Boolean).join(' ');
    return haystack.includes(pattern);
  });
}

const SLANG_PATTERN = /\b(?:bet|no cap|sus|low-key|rizz|slay|drip|bussin'|say less|ghosted|lit|hits different)\b/i;

async function resetBaseline(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
    await page.evaluate(async () => {
      await gameCore.resetGame(true);
      gameUI.setAccessibilitySettings?.({
        highContrastUI: false,
        uiScale: 1,
      reducedMotion: false,
      battleMotionSimplify: false
    });
      gameUI.inspectPanel.visible = false;
      gameUI.activityLogPanel.visible = false;
      gameUI.clearInspectSelection?.(gameCore.getGameState());
      eventBus.clearHistory?.();
      if (typeof communicationSystem !== 'undefined') {
        communicationSystem.history = [];
        communicationSystem.dialogueHistory = [];
      }
    });
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && (state.butterflies?.length || 0) >= 6;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1000);
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

async function startBattle(page) {
  await page.evaluate(() => {
    eventBus.clearHistory?.();
    const snapshot = gameCore.startSinglePlayerAutoBattleSession?.();
    if (!snapshot?.battleId) {
      throw new Error('Unable to start autobattle session');
    }
    battleSystem.cycleAutoBattleSpeed?.(snapshot.battleId);
    battleSystem.cycleAutoBattleSpeed?.(snapshot.battleId);
  });
  await page.waitForFunction(() => {
    const state = gameCore.getGameState();
    return state.viewMode === 'battle' && !!state.activeBattleId;
  }, null, { timeout: 10000 });
}

async function seedDialoguePair(page, signalType = 'courtship_signal') {
  return page.evaluate((requestedSignalType) => {
    eventBus.clearHistory?.();
    if (typeof communicationSystem !== 'undefined') {
      communicationSystem.history = [];
      communicationSystem.dialogueHistory = [];
    }
    const state = gameCore.getGameState();
    const zoneId = state.focusedZoneId;
    const pair = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 2);
    if (pair.length < 2) {
      throw new Error('Not enough butterflies in focused zone for dialogue audit');
    }
    const [source, target] = pair;
    source.lifeSim.communication.receptivity = 0.95;
    source.lifeSim.communication.expressiveness = 0.95;
    source.lifeSim.interpretation.clarity = 0.95;
    target.lifeSim.communication.receptivity = 0.95;
    target.lifeSim.communication.expressiveness = 0.95;
    target.lifeSim.interpretation.clarity = 0.95;
    target.x = source.x + 16;
    target.y = source.y + 8;

    eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
      sourceId: source.id,
      targetId: target.id,
      zoneId,
      signalType: requestedSignalType
    });

    return {
      sourceId: source.id,
      targetId: target.id,
      zoneId,
      dialogueEventsNow: eventBus.getHistory(GameEvents.DIALOGUE_SPOKEN).length,
      signalEventsNow: eventBus.getHistory(GameEvents.COMMUNICATION_SIGNAL).length,
      dialogueHistoryNow: communicationSystem.dialogueHistory.length
    };
  }, signalType);
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

    await phase(page, report, outputDir, '01-feed-filter-contract', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        gameUI.activityLogPanel.visible = true;
        const filters = gameUI.getFeedFilterButtons().map(button => ({
          id: button.id,
          label: button.label
        }));
        return {
          filters,
          filterKeys: Object.keys(gameUI.activityLogPanel.filters || {})
        };
      });

      const labels = details.filters.map(button => button.label);
      return {
        pass:
          JSON.stringify(labels) === JSON.stringify(['Talk', 'Action', 'Learn', 'Warning', 'System']) &&
          !labels.includes('Signals') &&
          !labels.includes('Save') &&
          JSON.stringify(details.filterKeys) === JSON.stringify(['talk', 'action', 'learn', 'warning', 'system']),
        details
      };
    });

    await phase(page, report, outputDir, '02-spoken-dialogue-feed', async () => {
      await resetBaseline(page);
      const pair = await seedDialoguePair(page, 'guidance_signal');
      const details = await page.evaluate(({ sourceId, targetId }) => {
        gameUI.activityLogPanel.visible = true;
        const feedEntries = gameUI.getRecentActivityEntries();
        const dialogueEvents = eventBus.getHistory(GameEvents.DIALOGUE_SPOKEN);
        const signalEvents = eventBus.getHistory(GameEvents.COMMUNICATION_SIGNAL);
        const talkEntries = feedEntries.filter(entry => entry.category === 'talk');
        const latestDialogue = communicationSystem.dialogueHistory[communicationSystem.dialogueHistory.length - 1] || null;
        return {
          sourceId,
          targetId,
          dialogueEventCount: dialogueEvents.length,
          signalEventCount: signalEvents.length,
          dialogueHistoryCount: communicationSystem.dialogueHistory.length,
          talkEntries,
          hasSignalFeedEntry: feedEntries.some(entry => /\[Signal\]|signal/i.test(entry.line || '')),
          latestDialogue: latestDialogue ? {
            intentFamily: latestDialogue.intentFamily,
            intentSubtype: latestDialogue.intentSubtype,
            talkMode: latestDialogue.talkMode
          } : null
        };
      }, pair);

      const firstTalk = details.talkEntries[0]?.line || '';
      const firstTalkHeadline = details.talkEntries[0]?.headline || '';
      const headlineSides = firstTalkHeadline.split('->').map(part => part.trim()).filter(Boolean);
      const headlineDisambiguated = headlineSides.length !== 2
        ? true
        : headlineSides[0] !== headlineSides[1] || /\([MF?]\)/.test(firstTalkHeadline);
      return {
        pass:
          pair.dialogueEventsNow >= 1 &&
          pair.signalEventsNow >= 1 &&
          pair.dialogueHistoryNow >= 1 &&
          details.dialogueHistoryCount >= 1 &&
          details.talkEntries.length >= 1 &&
          /\([MF?]\):/.test(firstTalk) &&
          !firstTalk.includes('"') &&
          firstTalk.includes('-') &&
          !details.hasSignalFeedEntry &&
          !!details.talkEntries[0]?.grounding &&
          (details.talkEntries[0]?.contextTags?.length || 0) >= 2 &&
          headlineDisambiguated &&
          !!details.latestDialogue?.intentFamily &&
          !!details.latestDialogue?.intentSubtype &&
          !!details.latestDialogue?.talkMode,
        details
      };
    });

    await phase(page, report, outputDir, '03-voice-band-and-register-contract', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const anchorTarget = (state.butterflies || [])[0] || null;
        if (!anchorTarget) {
          throw new Error('Not enough butterflies for voice contract audit');
        }

        const createVoiceStub = (id, overrides = {}) => ({
          id,
          personalityType: overrides.personalityType || 'friendly',
          specialAbility: overrides.specialAbility || null,
          displayName: overrides.displayName || id,
          currentZoneId: zoneId,
          traits: {
            trustSpeed: 1,
            jitteriness: 1,
            ...(overrides.traits || {})
          },
          lifeSim: {
            identity: {
              archetype: overrides.personalityType || 'friendly'
            },
            communication: {
              expressiveness: 0.5,
              receptivity: 0.5,
              knownNames: {},
              ...(overrides.communication || {})
            },
            interpretation: {
              clarity: 0.5,
              ...(overrides.interpretation || {})
            },
            social: {
              confidence: 0.5,
              ...(overrides.social || {})
            },
            emotions: {
              significance: 0,
              agitation: 0,
              threat: 0,
              ...(overrides.emotions || {})
            }
          },
          getCanonicalLabel(options = {}) {
            return options?.includeSex ? `${this.displayName} (F)` : this.displayName;
          }
        });

        const targetStub = {
          id: anchorTarget.id,
          displayName: anchorTarget.displayName || anchorTarget.personalityType || anchorTarget.id,
          lifeSim: {
            communication: {
              knownNames: {}
            },
            identity: {
              archetype: anchorTarget.personalityType || 'friendly'
            }
          },
          getCanonicalLabel(options = {}) {
            return options?.includeSex ? `${this.displayName} (M)` : this.displayName;
          }
        };

        const casualSpeaker = createVoiceStub('voice_low_audit', {
          personalityType: 'energetic',
          communication: { expressiveness: 0.06, receptivity: 0.08 },
          interpretation: { clarity: 0.14 },
          social: { confidence: 0.1 },
          traits: { trustSpeed: 0.94, jitteriness: 2.3 }
        });
        const formalSpeaker = createVoiceStub('voice_scholar_audit', {
          personalityType: 'wise',
          specialAbility: 'ancient_scholar',
          communication: { expressiveness: 0.98, receptivity: 0.96 },
          interpretation: { clarity: 0.99 },
          social: { confidence: 0.92 },
          traits: { trustSpeed: 1.28, jitteriness: 0.72 }
        });
        const warningSpeaker = createVoiceStub('voice_warning_audit', {
          personalityType: 'cautious',
          communication: { expressiveness: 0.54, receptivity: 0.52 },
          interpretation: { clarity: 0.62 },
          social: { confidence: 0.48 },
          emotions: { agitation: 0.78, threat: 0.81 }
        });

        const casual = communicationSystem.createDialogueRecord(
          { signalType: 'courtship_signal', sourceZoneId: zoneId },
          casualSpeaker,
          [targetStub],
          {
            targetIds: [targetStub.id],
            targetLabels: [targetStub.getCanonicalLabel({ includeSex: true })],
            targetLabel: targetStub.displayName,
            responseExpected: false
          }
        );
        const formal = communicationSystem.createDialogueRecord(
          { signalType: 'teaching_signal', sourceZoneId: zoneId },
          formalSpeaker,
          [targetStub],
          {
            targetIds: [targetStub.id],
            targetLabels: [targetStub.getCanonicalLabel({ includeSex: true })],
            targetLabel: targetStub.displayName,
            responseExpected: false
          }
        );
        const warning = communicationSystem.createDialogueRecord(
          { signalType: 'warning_signal', sourceZoneId: zoneId },
          warningSpeaker,
          [targetStub],
          {
            targetIds: [targetStub.id],
            targetLabels: [targetStub.getCanonicalLabel({ includeSex: true })],
            targetLabel: targetStub.displayName,
            responseExpected: false
          }
        );

        const countWords = (text = '') => String(text || '').trim().split(/\s+/).filter(Boolean).length;
        return {
          casual,
          formal,
          warning,
          casualWords: countWords(casual?.phrase),
          formalWords: countWords(formal?.phrase),
          warningWords: countWords(warning?.phrase)
        };
      });

      return {
        pass:
          details.casual?.languageBand === 'below_average' &&
          details.casual?.register === 'casual' &&
          details.casual?.tone === 'playful' &&
          details.casualWords <= 12 &&
          details.formal?.languageBand === 'exceptional' &&
          details.formal?.register === 'formal' &&
          details.formal?.tone === 'formal' &&
          !SLANG_PATTERN.test(details.formal?.phrase || '') &&
          details.formalWords >= details.casualWords &&
          details.warning?.tone === 'aggressive' &&
          /!$/.test(details.warning?.phrase || ''),
        details
      };
    });

    await phase(page, report, outputDir, '04-internal-signal-support-boundary', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        eventBus.clearHistory?.();
        if (typeof communicationSystem !== 'undefined') {
          communicationSystem.history = [];
          communicationSystem.dialogueHistory = [];
        }
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const pair = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 2);
        if (pair.length < 2) {
          throw new Error('Not enough butterflies in focused zone for signal support audit');
        }

        const [source, target] = pair;
        source.x = Math.max(120, source.x || 0);
        source.y = Math.max(120, source.y || 0);
        target.x = source.x + 16;
        target.y = source.y + 8;

        const signal = communicationSystem.handleSignal({
          id: 'audit_signal_boundary',
          sourceId: source.id,
          targetId: target.id,
          zoneId,
          signalType: 'guidance_signal',
          intent: 'move through the arch',
          intensity: 0.84,
          createdAtSeconds: (communicationSystem.simulationClockSeconds || 0) + 0.01,
          durationSeconds: 0.2
        });

        const immediateSummary = communicationSystem.getCommunicationSummary(source.id);
        const feedEntries = gameUI.getRecentActivityEntries();
        const lastSignal = (target.lifeSim?.interpretation?.lastSignals || [])[0] || null;
        const expiresAtSeconds = source.lifeSim?.communication?.activeSignal?.expiresAtSeconds || communicationSystem.simulationClockSeconds;

        communicationSystem.simulationClockSeconds = expiresAtSeconds + 0.05;
        communicationSystem.update(state, 0);
        const expiredSummary = communicationSystem.getCommunicationSummary(source.id);

        return {
          signalId: signal?.id || null,
          activeSignalLabel: immediateSummary?.activeSignalLabel || null,
          signalSupportLabel: immediateSummary?.signalSupportLabel || null,
          signalSupportDetail: immediateSummary?.signalSupportDetail || null,
          hasSignalFeedEntry: feedEntries.some(entry => /\[Signal\]|signal/i.test(entry.line || '')),
          lastSignal,
          expiredSignalLabel: expiredSummary?.activeSignalLabel || null
        };
      });

      return {
        pass:
          !!details.signalId &&
          details.activeSignalLabel === 'Direction' &&
          /Direction \| 1 target \| high/i.test(details.signalSupportLabel || '') &&
          /move through the arch/i.test(details.signalSupportDetail || '') &&
          !details.hasSignalFeedEntry &&
          details.lastSignal?.signalType === 'guidance_signal' &&
          details.expiredSignalLabel === 'quiet',
        details
      };
    });

    await phase(page, report, outputDir, '04b-local-signal-field-grounding', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const trio = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 3);
        if (trio.length < 3) {
          throw new Error('Not enough butterflies in focused zone for local signal field audit');
        }

        const [source, target, witness] = trio;
        source.x = 320;
        source.y = 240;
        target.x = source.x + 18;
        target.y = source.y + 8;
        witness.x = source.x + 34;
        witness.y = source.y + 12;

        eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
          sourceId: source.id,
          targetIds: [target.id, witness.id],
          zoneId,
          signalType: 'warning_signal',
          intensity: 0.9
        });

        for (let index = 0; index < 5; index += 1) {
          sleepSystem?.update?.(state, 0.25);
          lifeSimSystem?.update?.(state, 0.25);
          communicationSystem?.update?.(state, 0.25);
          behaviorSystem?.update?.(state, 0.25);
        }

        const communicationSummary = communicationSystem.getCommunicationSummary(target.id);
        const lifeSimSummary = lifeSimSystem.getEntitySummary(target.id);
        return {
          communicationSummary,
          lifeSimSummary
        };
      });

      return {
        pass:
          details.communicationSummary?.localSignalFieldFamily === 'warning' &&
          /warning field/i.test(details.communicationSummary?.localSignalFieldLabel || '') &&
          !!details.communicationSummary?.localSignalFieldDetail &&
          (
            details.lifeSimSummary?.socialEcology?.primaryRhythm === 'warning-cascade'
            || (details.lifeSimSummary?.socialEcology?.warning?.score || 0) >= 40
          ),
        details
      };
    });

    await phase(page, report, outputDir, '05-hybrid-personal-name-identity', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const parents = (state.butterflies || []).slice(0, 2);
        if (parents.length < 2) {
          throw new Error('Not enough butterflies to synthesize hybrid identity audit');
        }

        const createHybrid = (sex = 'M') => {
          const hybrid = new Butterfly(
            parents[0].x,
            parents[0].y - gameConfig.entities.heightOffset.butterfly,
            [[220, 120, 255], [120, 220, 255]],
            false,
            'hybrid',
            {
              sex,
              birthSource: 'bred',
              fertilityUsesRemaining: 1,
              hybridGenome: {
                baseType: 'hybrid',
                parentA: parents[0].personalityType,
                parentB: parents[1].personalityType
              },
              customTraits: { ...(parents[0].traits || {}) },
              isHybrid: true,
              currentZoneId: zoneId
            }
          );
          state.butterflies.push(hybrid);
          const entry = progressionManager.makeHybridEntry(state, hybrid, { baseType: parents[0].personalityType }, { baseType: parents[1].personalityType });
          hybrid.hybridEntryId = entry.id;
          return { hybrid, entry };
        };

        const first = createHybrid('M');
        const second = createHybrid('M');
        progressionManager.renameHybrid(state, second.entry.id, first.entry.personalName || first.entry.name);
        progressionManager.refreshLivingHybridDisplayNames(state);

        const updatedFirst = state.hybridJournal.find(entry => entry.id === first.entry.id) || first.entry;
        const updatedSecond = state.hybridJournal.find(entry => entry.id === second.entry.id) || second.entry;

        return {
          first: {
            name: updatedFirst.name,
            personalName: updatedFirst.personalName
          },
          second: {
            name: updatedSecond.name,
            personalName: updatedSecond.personalName
          },
          butterflies: state.butterflies
            .filter(entry => entry.hybridEntryId === first.entry.id || entry.hybridEntryId === second.entry.id)
            .map(entry => ({
              displayName: entry.displayName,
              personalName: entry.personalName,
              canonicalLabel: entry.getCanonicalLabel?.({ includeSex: true }) || null
            }))
        };
      });

      return {
        pass:
          !/^Hybrid\s+#/i.test(details.first.name || '') &&
          !/^Hybrid\s+#/i.test(details.second.name || '') &&
          !!details.first.personalName &&
          !!details.second.personalName &&
          details.first.name === details.first.personalName &&
          details.second.personalName === details.first.personalName &&
          details.second.name !== details.first.name &&
          /\s[A-Z]\.$/.test(details.second.name) &&
          details.butterflies.every(entry => !!entry.displayName && !!entry.personalName && /\([MF?]\)$/.test(entry.canonicalLabel || '')),
        details
      };
    });

    await phase(page, report, outputDir, '06-reply-delay-two-seconds', async () => {
      await resetBaseline(page);
      const pair = await seedDialoguePair(page, 'courtship_signal');

      const early = await page.evaluate(({ sourceId, targetId }) => {
        const dialogueEvents = communicationSystem.dialogueHistory.filter(entry =>
          (entry.sourceId === sourceId && entry.targetIds?.includes(targetId))
          || (entry.sourceId === targetId && entry.targetIds?.includes(sourceId))
        );
        return {
          count: dialogueEvents.length,
          timestamps: dialogueEvents.map(entry => entry.timestamp)
        };
      }, pair);

      await page.waitForTimeout(1500);
      const mid = await page.evaluate(({ sourceId, targetId }) => {
        const dialogueEvents = communicationSystem.dialogueHistory.filter(entry =>
          (entry.sourceId === sourceId && entry.targetIds?.includes(targetId))
          || (entry.sourceId === targetId && entry.targetIds?.includes(sourceId))
        );
        return {
          count: dialogueEvents.length,
          timestamps: dialogueEvents.map(entry => entry.timestamp)
        };
      }, pair);

      await page.waitForTimeout(900);
      const late = await page.evaluate(({ sourceId, targetId }) => {
        const dialogueEvents = communicationSystem.dialogueHistory.filter(entry =>
          (entry.sourceId === sourceId && entry.targetIds?.includes(targetId))
          || (entry.sourceId === targetId && entry.targetIds?.includes(sourceId))
        );
        const timestamps = dialogueEvents.map(entry => entry.timestamp);
        return {
          count: dialogueEvents.length,
          timestamps
        };
      }, pair);

      const elapsedMs = late.timestamps.length >= 2
        ? late.timestamps[1] - late.timestamps[0]
        : null;

      return {
        pass:
          early.count === 1 &&
          mid.count === 1 &&
          late.count >= 2 &&
          elapsedMs !== null &&
          elapsedMs >= 1900,
        details: {
          earlyCount: early.count,
          midCount: mid.count,
          lateCount: late.count,
          elapsedMs
        }
      };
    });

    await phase(page, report, outputDir, '07-battle-actions-feed', async () => {
      await resetBaseline(page);
      await startBattle(page);
      await page.waitForFunction(() => {
        return eventBus.getHistory(GameEvents.BATTLE_ACTION_OCCURRED).length >= 1;
      }, null, { timeout: 15000 });

      const details = await page.evaluate(() => {
        gameUI.activityLogPanel.visible = true;
        const feedEntries = gameUI.getRecentActivityEntries();
        const battleEvents = eventBus.getHistory(GameEvents.BATTLE_ACTION_OCCURRED);
        const actionFeedEntries = feedEntries.filter(entry => entry.category === 'action');
        const battleActionFeed = actionFeedEntries.find(entry =>
          /Struck for|Rallied for|Guarded and recovered|Retreated from battle/i.test(entry.line || '')
        ) || null;
        return {
          battleEventCount: battleEvents.length,
          actionFeedCount: actionFeedEntries.length,
          battleActionFeed
        };
      });

      return {
        pass:
          details.battleEventCount >= 1 &&
          details.actionFeedCount >= 1 &&
          !!details.battleActionFeed &&
          !!details.battleActionFeed?.grounding,
        details
      };
    });

    await phase(page, report, outputDir, '08-inspect-social-bond-summary', async () => {
      await resetBaseline(page);
      const pair = await seedDialoguePair(page, 'courtship_signal');
      await page.waitForTimeout(2400);

      const details = await page.evaluate(({ sourceId }) => {
        const state = gameCore.getGameState();
        const target = (gameCore.gameState.butterflies || []).find(entry => entry.id === sourceId) || null;
        if (!target) {
          return { ok: false };
        }

        gameUI.inspectPanel.visible = true;
        gameUI.beginGuidingButterfly(target, state);
        gameUI.syncPanelLayouts(state);

        const communicationSummary = communicationSystem.getCommunicationSummary(target.id);
        const mlSummary = mlInferenceSystem?.getEntitySummary?.(target.id, state) || null;
        const mlRows = mlSummary ? gameUI.buildMlInspectRows?.(mlSummary) || [] : [];
        return {
          ok: true,
          lockedTargetId: gameUI.inspectPanel.lockedTargetId,
          visible: gameUI.inspectPanel.visible,
          relationship: communicationSummary?.relationship || null,
          recentSpokenPhrase: communicationSummary?.recentSpokenPhrase || null,
          recentHeardPhrase: communicationSummary?.recentHeardPhrase || null,
          recentResidueLabel: communicationSummary?.recentResidueLabel || null,
          retainedLessonLabel: communicationSummary?.retainedLessonLabel || null,
          mlSummary: mlSummary ? {
            source: mlSummary.source,
            actionSource: mlSummary.actionSource,
            signalSource: mlSummary.signalSource,
            riskSource: mlSummary.riskSource,
            actionLabel: mlSummary.actionLabel,
            signalLabel: mlSummary.signalLabel,
            riskLabel: mlSummary.riskLabel
          } : null,
          mlRowLabels: mlRows.map(row => row.label),
          panel: {
            width: gameUI.inspectPanel.width,
            height: gameUI.inspectPanel.height,
            scrollOffset: gameUI.inspectPanel.scrollOffset
          }
        };
      }, pair);

      return {
        pass:
          details.ok === true &&
          details.visible === true &&
          !!details.lockedTargetId &&
          !!details.relationship &&
          typeof details.relationship.chemistry === 'number' &&
          typeof details.relationship.reciprocity === 'number' &&
          typeof details.relationship.rejection === 'number' &&
          !!details.recentResidueLabel &&
          !!details.recentSpokenPhrase &&
          !!details.recentHeardPhrase &&
          details.mlSummary?.source === 'ml' &&
          details.mlSummary?.actionSource === 'ml' &&
          details.mlSummary?.signalSource === 'ml' &&
          details.mlSummary?.riskSource === 'ml' &&
          details.mlRowLabels?.includes('Act') &&
          details.mlRowLabels?.includes('Signal') &&
          details.mlRowLabels?.includes('Risk') &&
          details.mlRowLabels?.includes('History') &&
          details.panel.width > 0 &&
          details.panel.height > 0 &&
          Number.isFinite(details.panel.scrollOffset),
        details
      };
    });

    await phase(page, report, outputDir, '09-courtship-residue-follow-through', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        eventBus.clearHistory?.();
        if (typeof communicationSystem !== 'undefined') {
          communicationSystem.history = [];
          communicationSystem.dialogueHistory = [];
        }
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 4);
        if (butterflies.length < 4) {
          throw new Error('Not enough butterflies in focused zone for courtship residue audit');
        }

        const [warmSource, warmTarget, guardedSource, guardedTarget] = butterflies;
        const tunePair = (source, target) => {
          source.lifeSim.communication.receptivity = 0.95;
          source.lifeSim.communication.expressiveness = 0.95;
          source.lifeSim.interpretation.clarity = 0.95;
          target.lifeSim.communication.receptivity = 0.95;
          target.lifeSim.communication.expressiveness = 0.95;
          target.lifeSim.interpretation.clarity = 0.95;
          target.x = source.x + 16;
          target.y = source.y + 8;
        };
        tunePair(warmSource, warmTarget);
        tunePair(guardedSource, guardedTarget);

        warmTarget.lifeSim.socialEdges[warmSource.id] = {
          ...(warmTarget.lifeSim.socialEdges[warmSource.id] || {}),
          trust: 0.56,
          comfort: 0.62,
          attachment: 0.42,
          admiration: 0.24,
          resentment: 0,
          rejectionWeight: 0,
          reciprocityScore: 0.24
        };
        warmTarget.lifeSim.emotions.threat = 0.02;

        guardedTarget.lifeSim.socialEdges[guardedSource.id] = {
          ...(guardedTarget.lifeSim.socialEdges[guardedSource.id] || {}),
          trust: 0.08,
          comfort: 0.06,
          attachment: 0.02,
          admiration: 0.04,
          resentment: 0.34,
          rejectionWeight: 0.22,
          reciprocityScore: 0
        };
        guardedTarget.lifeSim.emotions.threat = 0.72;
        const emitDialoguePair = (source, target, createdAtSeconds) => {
          const opener = communicationSystem.createDialogueRecord({
            signalType: 'courtship_signal',
            sourceZoneId: zoneId,
            createdAtSeconds
          }, source, [target], {
            targetIds: [target.id],
            targetLabels: [target.getCanonicalLabel?.({ includeSex: true }) || target.displayName || target.id],
            createdAtSeconds,
            responseExpected: false
          });
          if (!opener) {
            throw new Error('Unable to build courtship opener');
          }
          communicationSystem.emitDialogue(opener, [target]);
          const responseType = target === warmTarget ? 'courtship_signal' : 'acknowledgement_signal';
          const targetLabel = source.getCanonicalLabel?.({ includeSex: true }) || source.displayName || source.id;
          const intentProfile = communicationSystem.getDialogueIntentProfile(responseType, target, {
            talkMode: 'single_target',
            targetCount: 1,
            recipients: [source]
          });
          const response = communicationSystem.createDialogueRecord({
            signalType: responseType,
            sourceZoneId: zoneId,
            createdAtSeconds: createdAtSeconds + 0.01
          }, target, [source], {
            targetIds: [source.id],
            targetLabels: [targetLabel],
            phrase: communicationSystem.composeDialoguePhrase(target, responseType, zoneId, {
              recipients: [source],
              targetCount: 1,
              targetLabel,
              talkMode: 'single_target',
              responseTo: opener,
              stance: target === warmTarget ? 'warm_reply' : 'hesitate',
              intentProfile
            }),
            createdAtSeconds: createdAtSeconds + 0.01,
            stance: target === warmTarget ? 'warm_reply' : 'hesitate',
            responseExpected: false,
            intentProfile,
            intentSubtype: target === warmTarget ? 'warming_reply' : 'gentle_rejection',
            intentTags: target === warmTarget ? ['courtship', 'reciprocal'] : ['reply', 'rejection'],
            responseToId: opener.id,
            responseToSignalType: opener.sourceSignalType || null,
            responseToIntentTags: [...(opener.intentTags || [])],
            responseToSourceId: opener.sourceId
          });
          if (!response) {
            throw new Error('Unable to build courtship response');
          }
          communicationSystem.emitDialogue({
            ...response,
            timestamp: Date.now(),
            createdAtSeconds: createdAtSeconds + 0.01
          }, [source]);
        };

        emitDialoguePair(warmSource, warmTarget, (communicationSystem.simulationClockSeconds || 0) + 0.01);
        emitDialoguePair(guardedSource, guardedTarget, (communicationSystem.simulationClockSeconds || 0) + 0.03);

        return {
          mutual: communicationSystem.getCommunicationSummary(warmSource.id),
          guarded: communicationSystem.getCommunicationSummary(guardedSource.id)
        };
      });

      return {
        pass:
          !!details.mutual?.relationship &&
          !!details.guarded?.relationship &&
          details.mutual.relationship.reciprocity > details.guarded.relationship.reciprocity &&
          details.mutual.relationship.recentMutualAttention >= details.guarded.relationship.recentMutualAttention / 2 &&
          /warming|mutual/i.test(details.mutual.recentResidueLabel || '') &&
          /not ready|more room|do not press|not that way|gentle rejection|rejection/i.test(`${details.guarded.recentHeardPhrase || ''} ${details.guarded.recentResidueLabel || ''}`),
        details
      };
    });

    await phase(page, report, outputDir, '10-dialogue-learn-follow-through', async () => {
      await resetBaseline(page);
      const setup = await page.evaluate(() => {
        eventBus.clearHistory?.();
        if (typeof communicationSystem !== 'undefined') {
          communicationSystem.history = [];
          communicationSystem.dialogueHistory = [];
        }
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const pair = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 2);
        if (pair.length < 2) {
          throw new Error('Not enough butterflies in focused zone for dialogue learn audit');
        }

        const [teacher, learner] = pair;
        teacher.lifeSim.communication.receptivity = 0.95;
        teacher.lifeSim.communication.expressiveness = 0.95;
        teacher.lifeSim.interpretation.clarity = 0.95;
        learner.lifeSim.communication.receptivity = 0.95;
        learner.lifeSim.communication.expressiveness = 0.95;
        learner.lifeSim.interpretation.clarity = 0.98;
        learner.x = teacher.x + 16;
        learner.y = teacher.y + 8;

        const emitTeachingDialogue = (id, atSeconds) => {
          communicationSystem.simulationClockSeconds = atSeconds;
          const dialogue = communicationSystem.createDialogueRecord({
            id,
            sourceId: teacher.id,
            targetId: learner.id,
            targetIds: [learner.id],
            sourceZoneId: zoneId,
            zoneId,
            signalType: 'teaching_signal',
            intent: id === 'audit_teaching_one' ? 'first lesson cue' : 'follow-up lesson cue',
            createdAtSeconds: atSeconds
          }, teacher, [learner], {
            id,
            createdAtSeconds: atSeconds,
            targetIds: [learner.id],
            targetLabels: [communicationSystem.getEntityLabel(learner)],
            talkMode: 'single_target',
            responseExpected: false
          });
          if (!dialogue) {
            throw new Error(`Unable to create ${id}`);
          }
          communicationSystem.emitDialogue(dialogue, [learner]);
        };

        const baseSeconds = communicationSystem.simulationClockSeconds || 0;
        emitTeachingDialogue('audit_teaching_one', baseSeconds + 0.01);
        emitTeachingDialogue('audit_teaching_two', baseSeconds + 24);

        return {
          teacherId: teacher.id,
          learnerId: learner.id
        };
      });

      await page.waitForTimeout(2600);

      const details = await page.evaluate(({ teacherId, learnerId }) => {
        const learner = (gameCore.getGameState().butterflies || []).find(entry => entry.id === learnerId) || null;
        const learnerSummary = communicationSystem.getCommunicationSummary(learnerId);
        const teacherSummary = communicationSystem.getCommunicationSummary(teacherId);
        const learnerTeacherEdge = learner?.lifeSim?.socialEdges?.[teacherId] || null;
        const feedEntries = gameUI.getRecentActivityEntries();
        const learnEntries = feedEntries.filter(entry => entry.category === 'learn');
        return {
          learnerLessonCount: learner?.lifeSim?.upbringing?.lessons?.length || 0,
          retainedLessonLabel: learnerSummary?.retainedLessonLabel || null,
          learnerResidueLabel: learnerSummary?.recentResidueLabel || null,
          learnerRelationship: learnerSummary?.relationship || null,
          teacherRelationship: teacherSummary?.relationship || null,
          learnerTeacherEdge: learnerTeacherEdge ? {
            anchoringDialogueCount: learnerTeacherEdge.anchoringDialogueCount || 0,
            learnedDialogueCount: learnerTeacherEdge.learnedDialogueCount || 0,
            followThroughScore: learnerTeacherEdge.followThroughScore || 0,
            recentResidues: learnerTeacherEdge.recentResidues || []
          } : null,
          learnEntries
        };
      }, setup);

      return {
        pass:
          details.learnerLessonCount >= 1 &&
          !!details.retainedLessonLabel &&
          !/No retained dialogue lesson/i.test(details.retainedLessonLabel) &&
          !!details.learnerTeacherEdge &&
          details.learnerTeacherEdge.learnedDialogueCount >= 1 &&
          (
            learnEntriesContain(details.learnEntries, 'Held onto')
            || /Held onto/i.test(details.retainedLessonLabel || '')
            || (details.learnerTeacherEdge.recentResidues || []).some(residue => residue?.followThroughState === 'learned')
          ),
        details
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
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      reportPath: path.join(outputDir, 'report.json'),
      overall: report.overall
    }, null, 2));
    if (report.overall === 'fail') process.exitCode = 2;
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
