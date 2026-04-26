const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'foundation_contract_audit');
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
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
  });
  await page.waitForTimeout(900);
}

async function applyHybridLineagePreset(page) {
  const applied = await page.evaluate(() => {
    const serialized = debugUI?.buildAuditPresetState?.('hybrid-lineage');
    if (!serialized) return false;
    gameCore.applySerializedState(serialized);
    return true;
  });
  if (!applied) {
    throw new Error('Unable to apply hybrid-lineage preset');
  }
  await page.waitForTimeout(900);
}

async function enrichHybridForAudit(page) {
  await page.evaluate(() => {
    const state = gameCore.getGameState();
    const hybrid = (state.butterflies || []).find(entry => entry.hybridEntryId === 1) || state.butterflies?.[0];
    if (!hybrid) return false;

    hybrid.lifeSim.upbringing.lessons = [
      {
        category: 'training_drill',
        teacherId: 'audit_lineage_parent',
        strength: 0.42,
        warped: false,
        content: { source: 'training-ground', stationLabel: 'Open Training Ground' }
      },
      {
        category: 'social_connection',
        teacherId: 'audit_lineage_parent',
        strength: 0.28,
        warped: false,
        content: { source: 'wise-aura' }
      }
    ];
    hybrid.lifeSim.upbringing.routineReinforcement = {
      teaching: 0.35,
      social: 0.22,
      movement: 0.14,
      rest: 0.1
    };
    hybrid.lifeSim.emotions.significance = 0.44;
    hybrid.lifeSim.emotions.agitation = 0.18;
    hybrid.lifeSim.emotions.relief = 0.31;
    hybrid.lifeSim.social.confidence = 0.46;
    hybrid.lifeSim.social.belonging = 0.37;
    hybrid.lifeSim.interpretation.clarity = 0.81;
    gameUI.inspectPanel.visible = true;
    gameUI.inspectPanel.lockedTargetId = hybrid.id;
    gameUI.activityLogPanel.visible = true;
    return true;
  });
  await page.waitForTimeout(250);
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
  const videoDir = path.join(outputDir, 'video');
  ensureDir(outputDir);
  ensureDir(videoDir);

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
      viewport: { width: 1600, height: 900 },
      recordVideo: {
        dir: videoDir,
        size: { width: 1600, height: 900 }
      }
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
    await resetBaseline(page);
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(200);
    await applyHybridLineagePreset(page);
    await enrichHybridForAudit(page);

    await phase(page, report, outputDir, '01-genetics-stat-contract', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.gameState;
        const hybrid = (gameState.butterflies || []).find(entry => entry.hybridEntryId === 1) || null;
        const journalEntry = (gameState.hybridJournal || [])[0] || null;
        const profile = hybrid ? statProfileSystem.getEntityProfile?.(hybrid, gameState) : null;
        const journalProfile = journalEntry ? statProfileSystem.getJournalProfile?.(journalEntry, gameState) : null;
          return {
            inspectVisible: gameUI.inspectPanel.visible,
            baselineLines: profile?.display?.baselineLines || [],
            expressionLines: profile?.display?.expressionLines || [],
            effectiveLines: profile?.display?.effectiveLines || [],
            battleLines: profile?.display?.battleLines || [],
            readinessLines: profile?.display?.readinessLines || [],
            parentLines: profile?.display?.parentLines || [],
            heritageLines: profile?.display?.heritageLines || [],
            rarityLines: profile?.display?.rarityLines || [],
            lockLines: profile?.display?.lockLines || [],
            journalBaselineLines: journalProfile?.display?.baselineLines || [],
            journalBattleLines: journalProfile?.display?.battleLines || [],
            journalHeritageLines: journalProfile?.display?.heritageLines || [],
            journalRarityLines: journalProfile?.display?.rarityLines || [],
            journalLockLines: journalProfile?.display?.lockLines || []
          };
        });
      return {
        pass:
          state.inspectVisible &&
          state.baselineLines.length >= 3 &&
          state.expressionLines.length >= 1 &&
          state.effectiveLines.length >= 3 &&
          state.battleLines.length >= 2 &&
          state.readinessLines.length >= 1 &&
          state.parentLines.length >= 1 &&
          state.heritageLines.length >= 1 &&
          state.rarityLines.length >= 1 &&
          state.lockLines.length >= 1 &&
          state.journalBaselineLines.length >= 3 &&
          state.journalBattleLines.length >= 2 &&
          state.journalHeritageLines.length >= 1 &&
          state.journalRarityLines.length >= 1 &&
          state.journalLockLines.length >= 1,
        details: state
      };
    });

    await phase(page, report, outputDir, '02-cognition-addendum-contract', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.gameState;
        const butterfly = gameState.butterflies[0];
        const summary = lifeSimSystem.getEntitySummary?.(butterfly.id);
        const biases = butterfly?.lifeSim?.derived?.behaviorBiases || null;
        return {
          butterflyId: butterfly?.id || null,
          player: summary?.player || null,
          objects: summary?.objects || null,
          space: summary?.space || null,
          progression: summary?.progression || null,
          battle: summary?.battle || null,
          useBias: biases?.objectInterest ?? null,
          cursorBias: biases?.cursorAffinity ?? null,
          shelterBias: biases?.shelterSeeking ?? null,
          aggressionBias: biases?.battleAggression ?? null
        };
      });
      return {
        pass:
          !!state.player &&
          !!state.objects &&
          !!state.space &&
          !!state.progression &&
          !!state.battle &&
          typeof state.useBias === 'number' &&
          typeof state.cursorBias === 'number' &&
          typeof state.shelterBias === 'number' &&
          typeof state.aggressionBias === 'number' &&
          typeof state.objects.blockFamiliarity === 'number' &&
          typeof state.space.verticality === 'string' &&
          typeof state.progression.variantFamiliarity === 'number' &&
          typeof state.battle.targetPriority === 'number',
        details: state
      };
    });

    await phase(page, report, outputDir, '03-post-pool-progression-contract', async () => {
      const state = await page.evaluate(async () => {
        await gameCore.resetGame(true);

        const gameState = gameCore.gameState;
        const zoneIds = gameCore.getZoneIds();
        const firstZoneId = zoneIds[0];
        const friendlyFemale = gameState.butterflies.find(entry =>
          entry.personalityType === 'friendly' &&
          entry.sex === 'F' &&
          gameCore.getEntityZoneId(entry, null) === firstZoneId
        );
        const friendlyMale = gameState.butterflies.find(entry =>
          entry.personalityType === 'friendly' &&
          entry.sex === 'M' &&
          gameCore.getEntityZoneId(entry, null) === firstZoneId
        );
        if (!friendlyFemale || !friendlyMale) {
          return { ok: false, reason: 'missing-friendly-starter-pair' };
        }

        const unlockResult = progressionManager.recordSuccessfulOffspring(
          gameState,
          friendlyFemale,
          friendlyMale,
          breedingSystem.createLifecycleData(friendlyFemale, friendlyMale)
        );
        for (const unlockedType of unlockResult.unlocks || []) {
          gameCore.spawnUnlockedZonePairs(unlockedType);
        }

        const cautiousPerZone = Object.fromEntries(zoneIds.map(zoneId => {
          const zoneButterflies = (gameState.butterflies || []).filter(entry => gameCore.getEntityZoneId(entry, null) === zoneId);
          return [zoneId, {
            cautiousFemales: zoneButterflies.filter(entry => entry.personalityType === 'cautious' && entry.sex === 'F').length,
            cautiousMales: zoneButterflies.filter(entry => entry.personalityType === 'cautious' && entry.sex === 'M').length
          }];
        }));

        const goldenUnlocked = progressionManager.isGoldenUnlocked(gameState);
        const goldenWeight = progressionManager.getWildDiscoveryWeight(gameState, 'golden');
        progressionManager.save(gameState);

        const savedKey = window.localStorage.getItem('papilionem-progression-v1');
        const rehydrated = {
          hybridJournal: [],
          nextHybridId: 1,
          goldenButterflySpawned: false,
          unlockedButterflyTypes: new Set(),
          progressionOrderIndex: 0,
          unlockHistory: [],
          starterPairsSeeded: {},
          perTypeUnlockStatus: {},
          perWildButterflyProgress: {}
        };
        progressionManager.applyToGameState(rehydrated);

        return {
          ok: true,
          unlockedBefore: ['friendly'],
          unlockResult,
          unlockedTypes: Array.from(gameState.unlockedButterflyTypes || []),
          unlockHistoryLength: (gameState.unlockHistory || []).length,
          friendlyStatus: JSON.parse(JSON.stringify(gameState.perTypeUnlockStatus?.friendly || null)),
          cautiousStatus: JSON.parse(JSON.stringify(gameState.perTypeUnlockStatus?.cautious || null)),
          cautiousPerZone,
          goldenUnlocked,
          goldenWeight,
          saveExists: !!savedKey,
          rehydratedUnlockedTypes: Array.from(rehydrated.unlockedButterflyTypes || []),
          rehydratedGoldenUnlocked: progressionManager.isGoldenUnlocked(rehydrated),
          rehydratedUnlockHistoryLength: (rehydrated.unlockHistory || []).length,
          rehydratedFriendlyStatus: JSON.parse(JSON.stringify(rehydrated.perTypeUnlockStatus?.friendly || null)),
          rehydratedCautiousStatus: JSON.parse(JSON.stringify(rehydrated.perTypeUnlockStatus?.cautious || null))
        };
      });

      return {
        pass:
          state.ok &&
          Array.isArray(state.unlockResult?.unlocks) &&
          state.unlockResult.unlocks.length === 0 &&
          Array.isArray(state.unlockedTypes) &&
          ['friendly', 'cautious', 'energetic', 'skittish', 'wise', 'mystic']
            .every(type => state.unlockedTypes.includes(type)) &&
          (state.unlockHistoryLength || 0) === 0 &&
          Object.values(state.cautiousPerZone || {}).some(zone => zone.cautiousFemales === 1 && zone.cautiousMales === 1) &&
          state.goldenUnlocked === false &&
          state.goldenWeight === 0 &&
          state.saveExists === true &&
          Array.isArray(state.rehydratedUnlockedTypes) &&
          ['friendly', 'cautious', 'energetic', 'skittish', 'wise', 'mystic']
            .every(type => state.rehydratedUnlockedTypes.includes(type)) &&
          state.rehydratedGoldenUnlocked === false &&
          (state.rehydratedUnlockHistoryLength || 0) === 0,
        details: state
      };
    });

    const hasFailures = report.phases.some(phase => !phase.pass);
    report.overall = (!hasFailures && report.pageErrors.length === 0 && report.consoleErrors.length === 0)
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error?.stack || error);
  } finally {
    if (page) {
      const video = page.video();
      if (video) {
        try {
          report.video = await video.path();
        } catch (error) {
          report.videoError = String(error);
        }
      }
    }
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }

    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
