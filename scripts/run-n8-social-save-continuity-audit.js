const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'n8_social_save_continuity_audit');
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
      communicationSystem.activeSignals.clear?.();
      communicationSystem.simulationClockSeconds = 0;
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

async function seedProtectedSocialState(page) {
  return page.evaluate(() => {
    const zoneId = gameCore.getGameState()?.focusedZoneId;
    const gameState = gameCore.getGameState();
    const butterflies = (gameCore.getButterfliesInZone?.(zoneId) || []).slice(0, 2);
    if (butterflies.length < 2) {
      return { ok: false, reason: 'not-enough-butterflies' };
    }

    const [anchor, partner] = butterflies;
    const setPosition = (entity, x, y) => {
      entity.x = x;
      entity.y = y;
      entity.gridPos = gridManager.screenToIso(x, y + (entity.shadowOffset || 0));
      entity.updateZIndex?.();
    };
    setPosition(anchor, 468, 332);
    setPosition(partner, 494, 344);

    anchor.displayName = 'SacredHybrid';
    anchor.birthSource = 'bred';
    anchor.isHybrid = true;
    anchor.hybridGenome = {
      name: 'SacredHybrid',
      lineage: ['friendly', 'wise'],
      wingPattern: 'split',
      colors: [[255, 190, 90], [122, 208, 255]]
    };
    anchor.mutationProfile = {
      mutationClass: 'gentle-shift',
      visibleAccent: 'azure-fringe'
    };
    anchor.lifeSim.identity.displayName = 'SacredHybrid';
    anchor.lifeSim.identity.source = 'bred';
    anchor.lifeSim.genetics = {
      ...(anchor.lifeSim.genetics || {}),
      mutationProfile: JSON.parse(JSON.stringify(anchor.mutationProfile)),
      lineageTypes: ['friendly', 'wise'],
      heritageTags: ['calm', 'observant']
    };
    anchor.lifeSim.memories = anchor.lifeSim.memories || {};
    anchor.lifeSim.memories.social = [{
      id: 'mem-social-anchor',
      family: 'social',
      label: 'shared calm at ivy edge',
      partnerId: partner.id,
      valence: 0.84,
      reinforcementCount: 3
    }];
    anchor.lifeSim.memories.interaction = [{
      id: 'mem-interaction-anchor',
      family: 'interaction',
      label: 'listened and stayed close',
      partnerId: partner.id,
      valence: 0.78,
      reinforcementCount: 2
    }];
    anchor.lifeSim.socialEdges = anchor.lifeSim.socialEdges || {};
    partner.lifeSim.socialEdges = partner.lifeSim.socialEdges || {};
    anchor.lifeSim.socialEdges[partner.id] = {
      trust: 0.91,
      comfort: 0.88,
      attachment: 0.82,
      admiration: 0.44,
      resentment: 0.05,
      reciprocityScore: 0.46,
      rejectionWeight: 0.03,
      forgivenessWeight: 0.12,
      followThroughScore: 0.64,
      anchoringDialogueCount: 2,
      learnedDialogueCount: 1,
      repairState: 'steady'
    };
    partner.lifeSim.socialEdges[anchor.id] = {
      trust: 0.87,
      comfort: 0.84,
      attachment: 0.78,
      admiration: 0.36,
      resentment: 0.04,
      reciprocityScore: 0.4,
      rejectionWeight: 0.02,
      forgivenessWeight: 0.11,
      followThroughScore: 0.58,
      anchoringDialogueCount: 1,
      learnedDialogueCount: 1,
      repairState: 'steady'
    };
    anchor.lifeSim.communication = {
      ...(anchor.lifeSim.communication || {}),
      retainedLessons: [{
        label: 'gentle warning held',
        category: 'dialogue',
        partnerId: partner.id
      }],
      recentResidues: [{
        label: 'companionship anchored',
        rememberability: 'steady',
        partnerId: partner.id,
        recipientId: anchor.id,
        recipientLabel: 'SacredHybrid'
      }],
      knownNames: {
        [anchor.id]: {
          entityId: anchor.id,
          displayLabel: 'SacredHybrid',
          baseName: 'SacredHybrid',
          learnedAtSeconds: 0,
          certainty: 1,
          self: true
        },
        [partner.id]: {
          entityId: partner.id,
          displayLabel: partner.displayName || partner.name || partner.id,
          baseName: partner.displayName || partner.name || partner.id,
          learnedAtSeconds: 0,
          certainty: 0.9
        }
      }
    };

    const parentA = {
      id: `lineage-parent-a-${anchor.id}`,
      baseType: anchor.parentA?.baseType || anchor.personalityType || anchor.baseType || 'friendly',
      personalityType: anchor.parentA?.personalityType || anchor.personalityType || anchor.baseType || 'friendly',
      sex: anchor.parentA?.sex || 'F'
    };
    const parentB = {
      id: `lineage-parent-b-${partner.id}`,
      baseType: anchor.parentB?.baseType || partner.personalityType || partner.baseType || 'wise',
      personalityType: anchor.parentB?.personalityType || partner.personalityType || partner.baseType || 'wise',
      sex: anchor.parentB?.sex || 'M'
    };
    const hybridEntry = progressionManager.makeHybridEntry(gameState, anchor, parentA, parentB);
    progressionManager.renameHybrid(gameState, hybridEntry.id, 'SacredHybrid');
    anchor.hybridEntryId = hybridEntry.id;
    anchor.displayName = 'SacredHybrid';
    anchor.name = 'SacredHybrid';
    anchor.personalName = 'SacredHybrid';
    anchor.lifeSim.identity.displayName = 'SacredHybrid';
    anchor.lifeSim.identity.source = 'bred';

    const conversationId = communicationSystem.getConversationId(anchor.id, partner.id, zoneId);
    const now = Date.now();
    communicationSystem.dialogueHistory = [
      {
        id: 'n8-dialogue-1',
        timestamp: now - 1200,
        sourceId: anchor.id,
        sourceLabel: 'SacredHybrid',
        targetIds: [partner.id],
        targetLabels: [partner.displayName || partner.name || partner.id],
        sourceZoneId: zoneId,
        phrase: 'stay near me here; this still feels like ours',
        talkMode: 'single_target',
        targetCount: 1,
        conversationId,
        residues: [{
          recipientId: partner.id,
          partnerId: anchor.id,
          recipientLabel: partner.displayName || partner.name || partner.id,
          label: 'companionship anchored',
          rememberability: 'steady'
        }]
      },
      {
        id: 'n8-dialogue-2',
        timestamp: now - 700,
        sourceId: partner.id,
        sourceLabel: partner.displayName || partner.name || partner.id,
        targetIds: [anchor.id],
        targetLabels: ['SacredHybrid'],
        sourceZoneId: zoneId,
        phrase: 'i remember this place with you',
        talkMode: 'single_target',
        targetCount: 1,
        conversationId,
        residues: [{
          recipientId: anchor.id,
          partnerId: partner.id,
          recipientLabel: 'SacredHybrid',
          label: 'shared calm reinforced',
          rememberability: 'steady'
        }]
      }
    ];

    window.__n8AnchorId = anchor.id;
    window.__n8PartnerId = partner.id;
    window.__n8HybridEntryId = hybridEntry.id;
    return {
      ok: true,
      anchorId: anchor.id,
      partnerId: partner.id,
      hybridEntryId: hybridEntry.id,
      zoneId
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

    const seed = await seedProtectedSocialState(page);
    if (!seed?.ok) {
      throw new Error(`Unable to seed n8 state: ${seed?.reason || 'unknown'}`);
    }

    await phase(page, report, outputDir, '01-serialize-protected-social-truth', async () => {
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const serialized = saveSystem.serializeState(state);
        window.__n8Serialized = JSON.parse(JSON.stringify(serialized));
        const anchor = serialized.butterflies.find(entry => entry.id === window.__n8AnchorId) || null;
        const edge = anchor?.lifeSim?.socialEdges?.[window.__n8PartnerId] || null;
        return {
          version: serialized.version,
          anchorId: anchor?.id || null,
          displayName: anchor?.displayName || null,
          birthSource: anchor?.birthSource || null,
          isHybrid: !!anchor?.isHybrid,
          hybridEntryId: anchor?.hybridEntryId || null,
          memorySocialCount: anchor?.lifeSim?.memories?.social?.length || 0,
          memoryInteractionCount: anchor?.lifeSim?.memories?.interaction?.length || 0,
          retainedLessonCount: anchor?.lifeSim?.communication?.retainedLessons?.length || 0,
          recentResidueCount: anchor?.lifeSim?.communication?.recentResidues?.length || 0,
          trust: edge?.trust ?? null,
          attachment: edge?.attachment ?? null,
          followThrough: edge?.followThroughScore ?? null,
          dialogueHistoryCount: serialized?.foundations?.communication?.dialogueHistory?.length || 0,
          hybridJournalCount: serialized?.progression?.hybridJournal?.length || 0
        };
      });
      return {
        pass:
          details.version === 5 &&
          details.anchorId === seed.anchorId &&
          details.displayName === 'SacredHybrid' &&
          details.birthSource === 'bred' &&
          details.isHybrid === true &&
          details.hybridEntryId === seed.hybridEntryId &&
          details.memorySocialCount >= 1 &&
          details.memoryInteractionCount >= 1 &&
          details.retainedLessonCount >= 1 &&
          details.recentResidueCount >= 1 &&
          details.trust === 0.91 &&
          details.attachment === 0.82 &&
          details.followThrough === 0.64 &&
          details.dialogueHistoryCount >= 2 &&
          details.hybridJournalCount >= 1,
        details
      };
    });

    await phase(page, report, outputDir, '02-roundtrip-protected-social-truth', async () => {
      const details = await page.evaluate(() => {
        const serialized = JSON.parse(JSON.stringify(window.__n8Serialized));
        gameCore.applySerializedState?.(serialized);
        const state = gameCore.getGameState();
        const anchor = (state.butterflies || []).find(entry => entry.id === window.__n8AnchorId) || null;
        const edge = anchor?.lifeSim?.socialEdges?.[window.__n8PartnerId] || null;
        const communicationFoundation = communicationSystem.serializeDurableState?.() || {};
        return {
          anchorId: anchor?.id || null,
          displayName: anchor?.displayName || null,
          birthSource: anchor?.birthSource || null,
          isHybrid: !!anchor?.isHybrid,
          hybridEntryId: anchor?.hybridEntryId || null,
          memorySocialCount: anchor?.lifeSim?.memories?.social?.length || 0,
          memoryInteractionCount: anchor?.lifeSim?.memories?.interaction?.length || 0,
          retainedLessonCount: anchor?.lifeSim?.communication?.retainedLessons?.length || 0,
          recentResidueCount: anchor?.lifeSim?.communication?.recentResidues?.length || 0,
          trust: edge?.trust ?? null,
          attachment: edge?.attachment ?? null,
          followThrough: edge?.followThroughScore ?? null,
          hybridJournalCount: state?.hybridJournal?.length || 0,
          dialogueHistoryCount: communicationFoundation?.dialogueHistory?.length || 0
        };
      });
      return {
        pass:
          details.anchorId === seed.anchorId &&
          details.displayName === 'SacredHybrid' &&
          details.birthSource === 'bred' &&
          details.isHybrid === true &&
          details.hybridEntryId === seed.hybridEntryId &&
          details.memorySocialCount >= 1 &&
          details.memoryInteractionCount >= 1 &&
          details.retainedLessonCount >= 1 &&
          details.recentResidueCount >= 1 &&
          details.trust === 0.91 &&
          details.attachment === 0.82 &&
          details.followThrough === 0.64 &&
          details.hybridJournalCount >= 1 &&
          details.dialogueHistoryCount >= 2,
        details
      };
    });

    await phase(page, report, outputDir, '03-overload-recovery-preserves-sacred-hybrid', async () => {
      const details = await page.evaluate(() => {
        const base = JSON.parse(JSON.stringify(window.__n8Serialized));
        const limits = saveSystem.getRestoreSafetyLimits();
        const anchor = base.butterflies.find(entry => entry.id === window.__n8AnchorId);
        const clones = [];
        const sacred = JSON.parse(JSON.stringify(anchor));
        sacred.id = 'sacred-hybrid-overload';
        sacred.displayName = 'SacredHybrid';
        sacred.hybridEntryId = window.__n8HybridEntryId;
        sacred.isHybrid = true;
        sacred.birthSource = 'bred';
        sacred.happiness = 100;
        clones.push(sacred);
        for (let index = 0; index < (limits.butterflies * 2) + 8; index += 1) {
          const clone = JSON.parse(JSON.stringify(anchor));
          clone.id = `filler-${index}`;
          clone.displayName = `Filler${index}`;
          clone.hybridEntryId = null;
          clone.isHybrid = false;
          clone.birthSource = 'wild';
          clone.happiness = 0;
          clones.push(clone);
        }
        const synthetic = {
          ...base,
          butterflies: clones,
          flowers: [],
          caterpillars: [],
          blocks: [],
          progression: {
            ...(base.progression || {}),
            hybridJournal: [{
              ...((base.progression?.hybridJournal || []).find(entry => entry.id === window.__n8HybridEntryId) || {}),
              id: window.__n8HybridEntryId,
              butterflyId: 'sacred-hybrid-overload',
              displayName: 'SacredHybrid',
              lineage: ['friendly', 'wise']
            }]
          }
        };
        const sanitized = saveSystem.sanitizeRestoredState(JSON.parse(JSON.stringify(synthetic)));
        return {
          originalButterflies: synthetic.butterflies.length,
          sanitizedButterflies: sanitized.butterflies.length,
          forceFreshWorld: !!sanitized.meta?.forceFreshWorld,
          hasSacredHybrid: sanitized.butterflies.some(entry => entry.id === 'sacred-hybrid-overload' && entry.displayName === 'SacredHybrid'),
          hybridJournalCount: sanitized.progression?.hybridJournal?.length || 0,
          restoreRecoveryNote: sanitized.meta?.restoreRecoveryNote || null
        };
      });
      return {
        pass:
          details.originalButterflies > 0 &&
          details.sanitizedButterflies > 0 &&
          details.forceFreshWorld === false &&
          details.hasSacredHybrid === true &&
          details.hybridJournalCount >= 1 &&
          /Recovered overloaded save by preserving/.test(details.restoreRecoveryNote || ''),
        details
      };
    });

    report.overall = report.phases.every(entry => entry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
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
