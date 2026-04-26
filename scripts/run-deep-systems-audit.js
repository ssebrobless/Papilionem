const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { buildC2TraceCorpus } = require('./build-c2-trace-corpus');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'deep_systems_audit');
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

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
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

async function ensureServer(report) {
  const reachable = await fetch(URL).then(() => true).catch(() => false);
  if (reachable) {
    report.server = { reused: true, pid: null };
    return null;
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
    if (ok) return serverProcess;
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error('Server did not become reachable in time');
}

async function clearStorageAndReset(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
  });
  await page.waitForFunction(() => {
    const state = gameCore?.getGameState?.();
    return state && state.butterflies?.length >= 4 && state.flowers?.length >= 4;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(800);
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
    await clearStorageAndReset(page);

    await phase(page, report, outputDir, '01-baseline', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.getGameState();
        return {
          butterflies: gameState.butterflies.length,
          flowers: gameState.flowers.length,
          blocks: gameState.blocks.length,
          zones: zoneSystem.getZones().length
        };
      });
      return { pass: state.butterflies >= 4 && state.flowers >= 4 && state.blocks >= 20, details: state };
    });

    await phase(page, report, outputDir, '02-neural-summary', async () => {
      const state = await page.evaluate(() => {
        const butterfly = gameCore.getGameState().butterflies[0];
        const summary = lifeSimSystem.getEntitySummary?.(butterfly.id);
        const communication = communicationSystem.getCommunicationSummary?.(butterfly.id);
        return {
          butterflyId: butterfly.id,
          drives: summary?.dominantDrives || [],
          emotions: summary?.dominantEmotions || [],
          social: summary?.social || null,
          activeSignalLabel: communication?.activeSignalLabel || null,
          clarityPercent: communication?.clarityPercent || 0
        };
      });
      return {
        pass: state.drives.length > 0 && state.emotions.length > 0 && typeof state.clarityPercent === 'number',
        details: state
      };
    });

    await phase(page, report, outputDir, '03-genetics-stats', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.gameState;
        const butterfly = gameState.butterflies[0];
        const profile = statProfileSystem.getEntityProfile?.(butterfly, gameState);
        return {
          baselineLines: profile?.display?.baselineLines || [],
          effectiveLines: profile?.display?.effectiveLines || [],
          battleLines: profile?.display?.battleLines || [],
          battleProfile: profile?.battleProfile || null
        };
      });
      return {
        pass: state.baselineLines.length > 0 && state.effectiveLines.length > 0 && state.battleLines.length > 0,
        details: state
      };
    });

    await phase(page, report, outputDir, '04-social-communication', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.gameState;
        const teacher = gameState.butterflies[0];
        const listener = gameState.butterflies[1];
        eventBus.emit(GameEvents.COMMUNICATION_SIGNAL, {
          sourceId: teacher.id,
          signalType: 'teaching_signal',
          targetId: listener.id,
          phrase: 'remember this pattern',
          zoneId: teacher.currentZoneId
        });
        communicationSystem.update(gameState, 1);
        const teacherSummary = communicationSystem.getCommunicationSummary?.(teacher.id);
        const listenerSummary = communicationSystem.getCommunicationSummary?.(listener.id);
        return {
          teacher: teacherSummary,
          listener: listenerSummary,
          feedEntries: communicationSystem.getFeedEntries({ targetId: listener.id, limit: 5 })
        };
      });
      return {
        pass: state.teacher?.emittedCount > 0 && state.listener?.receivedCount > 0 && state.feedEntries.length > 0,
        details: state
      };
    });

    await phase(page, report, outputDir, '05-environment-objects', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.gameState;
        const butterfly = gameState.butterflies[0];
        const block = gameState.blocks.find(entry => entry.currentZoneId === butterfly.currentZoneId) || gameState.blocks[0];
        const flower = gameState.flowers.find(entry => entry.currentZoneId === butterfly.currentZoneId) || gameState.flowers[0];
        if (block) {
          butterfly.x = block.x + 6;
          butterfly.y = block.y + 4;
          butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
          butterfly.currentZoneId = block.currentZoneId;
          butterfly.pendingPollenDropTarget = null;
          butterfly.zoneTravel = null;
          butterfly.state = 'normal';
          butterfly.movement.targetType = 'meander';
          butterfly.blockInteraction.cooldownFrames = 0;
          butterfly.blockInteraction.targetBlockId = block.id;
          butterfly.checkBlockExperimentation(gameState.blocks);
          if (!butterfly.blockInteraction.carryingBlockId) {
            objectSystem.pickupObject(block.id, butterfly.id);
            block.pickupBy(butterfly);
            butterfly.blockInteraction.carryingBlockId = block.id;
            butterfly.chooseBlockPlacementTarget(block, gameState.blocks);
          }
          for (let step = 0; step < 90; step += 1) {
            butterfly.blockInteraction.cooldownFrames = 0;
            butterfly.checkBlockExperimentation(gameState.blocks);
            const carried = gameState.blocks.find(entry => entry.id === butterfly.blockInteraction.carryingBlockId);
            if (carried && butterfly.blockInteraction.placementTarget) {
              butterfly.x = butterfly.blockInteraction.placementTarget.x;
              butterfly.y = butterfly.blockInteraction.placementTarget.y;
              butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y);
            }
          }
          const carried = gameState.blocks.find(entry => entry.id === butterfly.blockInteraction.carryingBlockId);
          if (carried) {
            butterfly.placeCarriedBlock(carried, butterfly.currentZoneId);
          }
        }
        if (flower?.id) {
          objectSystem.recordInteraction(flower.id, 'fed from', butterfly.id, { zoneId: flower.currentZoneId || null });
        }
        const refreshedBlock = gameState.blocks.find(entry => entry.id === block?.id) || null;
        return {
          blockSummary: objectSystem.getObjectState(refreshedBlock?.id),
          actorSummary: objectSystem.getEntityInteractionSummary(butterfly.id, gameState),
          carryingBlockId: butterfly.blockInteraction.carryingBlockId || null,
          placementMode: refreshedBlock?.lastPlacedMode || null,
          stackIndex: refreshedBlock?.stackIndex ?? null
        };
      });
      return {
        pass:
          state.actorSummary?.counts?.touched > 0 &&
          !!state.blockSummary?.lastInteractionType &&
          state.carryingBlockId === null &&
          ['connected', 'stacked', 'ground'].includes(state.placementMode),
        details: state
      };
    });

    await phase(page, report, outputDir, '06-breeding-lifecycle', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.gameState;
        breedingSystem.refreshMaleCooldowns(gameState);
        const female = gameState.butterflies.find(entry => entry.sex === 'F' && breedingSystem.isEligibleFemale(entry, gameState));
        const male = gameState.butterflies.find(entry => entry.sex === 'M' && breedingSystem.isEligibleMale(entry, gameState));
        if (!female || !male) {
          return { ok: false, reason: 'eligible-pair-missing' };
        }
        breedingSystem.startMating(female, male);
        breedingSystem.completeMating(female, male, gameState, gameCore.particleSystem);
        const targetFlower = female.pregnancy?.targetFlower || breedingSystem.findNearestFlowerForEgg(female, gameState.flowers);
        if (targetFlower) {
          female.pregnancy = female.pregnancy || {
            active: true,
            lifecycleData: breedingSystem.createLifecycleData(female, male),
            targetFlower
          };
          breedingSystem.layEggAndFeed(female, targetFlower);
        }
        breedingSystem.hatchAllEggs(gameState);
        breedingSystem.spawnFlowersAtCaterpillars(gameState);
        breedingSystem.hatchAllCocoons(gameState);
        return {
          ok: true,
          eggFlowers: gameState.flowers.filter(entry => entry.occupancyState === 'egg').length,
          caterpillars: gameState.caterpillars.length,
          chrysalisFlowers: gameState.flowers.filter(entry => entry.occupancyState === 'chrysalis').length,
          hybrids: gameState.butterflies.filter(entry => entry.birthSource === 'bred').length,
          journal: gameState.hybridJournal.length
        };
      });
      return {
        pass: state.ok && (state.caterpillars > 0 || state.chrysalisFlowers > 0 || state.hybrids > 0 || state.journal > 0),
        details: state
      };
    });

    await phase(page, report, outputDir, '07-roster-battle-stats', async () => {
      const state = await page.evaluate(() => {
        const gameState = gameCore.gameState;
        const butterflies = gameState.butterflies.slice(0, 4);
        if (butterflies.length < 2) {
          return { ok: false, reason: 'not-enough-butterflies' };
        }
        rosterSystem.reset(gameState);
        butterflies.slice(0, 2).forEach(entry => rosterSystem.assignToSquad(entry.id, 'alpha', gameState));
        butterflies.slice(2, 4).forEach(entry => rosterSystem.assignToSquad(entry.id, 'beta', gameState));
        const snapshot = gameCore.startRosterBattleSession('alpha', 'beta');
        if (!snapshot?.battleId) {
          return { ok: false, reason: 'battle-start-failed' };
        }
        const participantIds = snapshot.participantOrder;
        if (participantIds[0]) {
          battleSystem.setParticipantAction(snapshot.battleId, participantIds[0], 'attack', 'rush', participantIds[1] || null);
          battleSystem.modifyParticipantHp(snapshot.battleId, participantIds[0], -8);
          battleSystem.applyPressure(snapshot.battleId, participantIds[0], 5);
        }
        if (participantIds[1]) {
          battleSystem.setParticipantAction(snapshot.battleId, participantIds[1], 'support', 'steady', participantIds[0] || null);
        }
        battleSystem.resolveSnapshot(snapshot.battleId, { winnerTeamId: 'alpha', summary: 'Audit skirmish complete' });
        const committed = gameCore.commitBattleSession(snapshot.battleId);
        const post = participantIds.map(id => battleSystem.getParticipantSource(id)?.battleState || null);
        return {
          ok: true,
          battleId: snapshot.battleId,
          participantCount: participantIds.length,
          teams: snapshot.teams,
          committed: !!committed,
          post,
          roster: gameState.roster
        };
      });
      return {
        pass: state.ok && state.committed && state.participantCount >= 2 && Array.isArray(state.post) && state.post.some(Boolean),
        details: state
      };
    });

    await phase(page, report, outputDir, '08-corpus-manifest', async () => {
      const corpus = await buildC2TraceCorpus({
        outputRoot: path.join(outputDir, 'c2_trace_corpus'),
        sourceAudit: 'run-deep-systems-audit'
      });
      report.corpus = {
        manifestPath: corpus.manifestPath,
        recordsPath: corpus.recordsPath
      };
      const manifest = corpus.manifest;
      const families = new Set(manifest.scenarioFamilies || []);
      return {
        pass:
          manifest.schemaVersion === 'c2-trace-corpus-manifest-v1' &&
          manifest.recordCount >= 4 &&
          manifest.scenarioCount >= 4 &&
          manifest.reviewedRecordCount >= 3 &&
          families.has('garden') &&
          families.has('communication') &&
          families.has('ecology') &&
          families.has('autobattle') &&
          !!manifest.recordsDigest &&
          manifest.rebuildCheck?.matches === true,
        details: {
          manifestPath: corpus.manifestPath,
          recordsPath: corpus.recordsPath,
          recordCount: manifest.recordCount,
          scenarioCount: manifest.scenarioCount,
          scenarioFamilies: manifest.scenarioFamilies,
          reviewedRecordCount: manifest.reviewedRecordCount,
          correctedRecordCount: manifest.correctedRecordCount,
          correctedPolicyCount: manifest.correctedPolicyCount,
          recordsDigest: manifest.recordsDigest,
          rebuildCheck: manifest.rebuildCheck
        }
      };
    });

    report.overall = report.phases.every(entry => entry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'warn';
  } catch (error) {
    report.overall = 'error';
    report.fatalError = String(error?.stack || error);
  } finally {
    if (page && page.video()) {
      report.video = await page.video().path();
    }
    if (context) await context.close();
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      reportPath: path.join(outputDir, 'report.json'),
      overall: report.overall
    }, null, 2));
  }
}

run();
