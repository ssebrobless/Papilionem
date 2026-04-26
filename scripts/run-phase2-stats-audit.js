const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'phase2_stats_audit');
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
  await page.evaluate(() => gameCore.resetGame(true));
  await page.waitForTimeout(800);
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

async function enrichHybridForStatAudit(page) {
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
        content: { source: 'training-ground', stationLabel: 'Lesson Circle' }
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
    gameUI.activityLogPanel.visible = false;
    gameUI.inspectPanel.lockedTargetId = hybrid.id;
    return true;
  });
  await page.waitForTimeout(250);
}

async function openHybridJournal(page) {
  await page.evaluate(() => {
    gameUI.butterflyCollection.visible = true;
    gameUI.butterflyCollection.hybridOnly = true;
    gameUI.butterflyCollection.currentIndex = 0;
  });
  await page.waitForTimeout(250);
}

async function getAuditState(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const hybrid = (state.butterflies || []).find(entry => entry.hybridEntryId === 1) || null;
    const journalEntry = (state.hybridJournal || [])[0] || null;
    const inspectProfile = hybrid && typeof statProfileSystem !== 'undefined'
      ? statProfileSystem.getEntityProfile(hybrid, state)
      : null;
    const journalProfile = journalEntry && typeof statProfileSystem !== 'undefined'
      ? statProfileSystem.getJournalProfile(journalEntry, state)
      : null;

    let battleSnapshot = null;
    if (typeof battleSystem !== 'undefined' && hybrid) {
      const opponent = (state.butterflies || []).find(entry => entry.id !== hybrid.id) || hybrid;
      const snapshot = battleSystem.startBattle([
        { entity: hybrid, teamId: 'alpha', role: 'combatant' },
        { entity: opponent, teamId: 'beta', role: 'combatant' }
      ], {
        battleId: 'phase2_stats_audit',
        mode: 'audit-skirmish'
      });
      battleSnapshot = snapshot?.participantsById?.[hybrid.id] || null;
      if (snapshot?.battleId) {
        battleSystem.resolveSnapshot(snapshot.battleId, { winnerTeamId: 'alpha' });
        battleSystem.commitResults(snapshot.battleId);
      }
    }

    return {
      hybridId: hybrid?.id || null,
      inspectVisible: gameUI.inspectPanel.visible,
      journalVisible: gameUI.butterflyCollection?.visible || false,
      inspectProfile: inspectProfile ? {
        baselineLines: inspectProfile.display.baselineLines,
        abilityLines: inspectProfile.display.abilityLines,
        upbringingLines: inspectProfile.display.upbringingLines,
        stateLines: inspectProfile.display.stateLines,
        battleLines: inspectProfile.display.battleLines,
        comparisonLines: inspectProfile.display.comparisonLines,
        heritageLines: inspectProfile.display.heritageLines,
        rarityLines: inspectProfile.display.rarityLines,
        lockLines: inspectProfile.display.lockLines
      } : null,
      journalProfile: journalProfile ? {
        baselineLines: journalProfile.display.baselineLines,
        abilityLines: journalProfile.display.abilityLines,
        comparisonLines: journalProfile.display.comparisonLines,
        battleLines: journalProfile.display.battleLines,
        heritageLines: journalProfile.display.heritageLines,
        rarityLines: journalProfile.display.rarityLines,
        lockLines: journalProfile.display.lockLines
      } : null,
      battleParticipant: battleSnapshot ? {
        statProfile: battleSnapshot.statProfile || null
      } : null
    };
  });
}

async function getSecondGenerationAuditState(page) {
  return page.evaluate(() => {
    const state = gameCore.getGameState();
    const mother = (state.butterflies || []).find(entry => entry.hybridEntryId === 1) || null;
    if (!mother) {
      return { ok: false, reason: 'missing-hybrid-mother' };
    }

    const zoneId = mother.currentZoneId || state.focusedZoneId || null;
    const father = new Butterfly(
      Math.min((mother.x || 320) + 36, (gameConfig?.canvas?.baseWidth || 960) - 64),
      Math.max(80, (mother.y || 180) - gameConfig.entities.heightOffset.butterfly),
      null,
      false,
      'mystic',
      {
        sex: 'M',
        birthSource: 'wild',
        currentZoneId: zoneId
      }
    );
    state.butterflies.push(father);

    const lifecycleData = breedingSystem.createLifecycleData(mother, father, {
      forceMutation: true,
      mutatedTraitCount: 1
    });
    lifecycleData.currentZoneId = zoneId;

    const child = breedingSystem.spawnHybridButterfly(
      Math.min((mother.x || 320) + 24, (gameConfig?.canvas?.baseWidth || 960) - 64),
      Math.min((mother.y || 180) + 18, (gameConfig?.canvas?.baseHeight || 540) - 64),
      lifecycleData,
      state,
      null
    );
    if (!child) {
      return { ok: false, reason: 'second-gen-spawn-failed' };
    }

    const journalEntry = (state.hybridJournal || []).find(entry => entry.id === child.hybridEntryId) || null;
    const profile = statProfileSystem.getEntityProfile(child, state);
    const journalProfile = journalEntry ? statProfileSystem.getJournalProfile(journalEntry, state) : null;

    return {
      ok: true,
      childId: child.id,
      childEntryId: child.hybridEntryId,
      lineDepth: profile?.lineageContext?.lineageDepth || 0,
      lineTypes: profile?.lineageContext?.lineageTypes || [],
      parentRefs: profile?.lineageContext?.lineageIds?.parents || [],
      ancestorRefs: profile?.lineageContext?.lineageIds?.ancestors || [],
      heritageLines: profile?.display?.heritageLines || [],
      rarityLines: profile?.display?.rarityLines || [],
      lockLines: profile?.display?.lockLines || [],
      journalHeritageLines: journalProfile?.display?.heritageLines || [],
      journalRarityLines: journalProfile?.display?.rarityLines || []
    };
  });
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = timestampLabel();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  const videoDir = path.join(outputDir, 'video');
  ensureDir(outputDir);
  ensureDir(videoDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    server: null,
    pageErrors: [],
    consoleErrors: [],
    screenshots: [],
    checks: [],
    video: null,
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

    page.on('pageerror', error => {
      report.pageErrors.push(String(error));
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await resetBaseline(page);
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(200);
    await applyHybridLineagePreset(page);
    await enrichHybridForStatAudit(page);
    report.screenshots.push(await saveShot(page, outputDir, '01-inspect-stat-sheet'));

    await openHybridJournal(page);
    report.screenshots.push(await saveShot(page, outputDir, '02-hybrid-journal-stat-sheet'));

    const state = await getAuditState(page);
    const inspectOk = !!state.inspectProfile
      && state.inspectProfile.baselineLines?.length >= 3
      && state.inspectProfile.abilityLines?.length >= 1
      && state.inspectProfile.upbringingLines?.length >= 1
      && state.inspectProfile.stateLines?.length >= 1
      && state.inspectProfile.battleLines?.length >= 2
      && state.inspectProfile.comparisonLines?.length >= 1
      && state.inspectProfile.heritageLines?.length >= 1
      && state.inspectProfile.rarityLines?.length >= 1
      && state.inspectProfile.lockLines?.length >= 1;
    const journalOk = !!state.journalProfile
      && state.journalProfile.baselineLines?.length >= 3
      && state.journalProfile.abilityLines?.length >= 1
      && state.journalProfile.comparisonLines?.length >= 1
      && state.journalProfile.battleLines?.length >= 2
      && state.journalProfile.heritageLines?.length >= 1
      && state.journalProfile.rarityLines?.length >= 1
      && state.journalProfile.lockLines?.length >= 1;
    const battleOk = !!state.battleParticipant?.statProfile?.battleStats
      && !!state.battleParticipant?.statProfile?.baselineTraits
      && !!state.battleParticipant?.statProfile?.effectiveTraits;
    const secondGenerationState = await getSecondGenerationAuditState(page);
    const secondGenerationOk = !!secondGenerationState?.ok
      && (secondGenerationState.lineDepth || 0) >= 2
      && (secondGenerationState.lineTypes?.length || 0) >= 3
      && (secondGenerationState.parentRefs?.length || 0) >= 2
      && (secondGenerationState.ancestorRefs?.length || 0) >= 1
      && (secondGenerationState.heritageLines?.length || 0) >= 1
      && (secondGenerationState.rarityLines?.length || 0) >= 1
      && (secondGenerationState.lockLines?.length || 0) >= 1
      && (secondGenerationState.journalHeritageLines?.length || 0) >= 1
      && (secondGenerationState.journalRarityLines?.length || 0) >= 1;

    report.checks.push({
      name: 'inspect-stat-surface',
      pass: inspectOk,
      detail: state.inspectProfile
    });
    report.checks.push({
      name: 'journal-stat-surface',
      pass: journalOk,
      detail: state.journalProfile
    });
    report.checks.push({
      name: 'battle-stat-snapshot',
      pass: battleOk,
      detail: state.battleParticipant
    });
    report.checks.push({
      name: 'multi-generation-lineage-summary',
      pass: secondGenerationOk,
      detail: secondGenerationState
    });

    report.overall = report.checks.every(entry => entry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';

    const video = page.video();
    await context.close();
    report.video = video ? await video.path() : null;

    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.overall = 'error';
    report.error = error.message;
    try {
      fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    } catch (writeError) {
      console.error('Failed to write phase 2 audit report', writeError);
    }
    throw error;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
