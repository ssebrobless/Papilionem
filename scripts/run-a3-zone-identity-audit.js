const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'a3_zone_identity_audit');
const URL = 'http://127.0.0.1:3000/';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
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

async function saveShot(page, dir, name) {
  const file = path.join(dir, name);
  await page.screenshot({ path: file, fullPage: true });
  return file;
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

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(OUTPUT_ROOT, stamp);
  ensureDir(outputDir);

  const report = {
    startedAt: new Date().toISOString(),
    url: URL,
    steps: [],
    overall: 'pending',
    pageErrors: [],
    consoleErrors: [],
    server: { reused: false, pid: null }
  };

  let browser;
  let page;

  try {
    await ensureServer(report);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (['error', 'warning', 'assert'].includes(msg.type())) {
        report.consoleErrors.push({ type: msg.type(), text: msg.text() });
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await page.evaluate(async () => {
      await gameCore.resetGame(true);
    });
    await page.waitForTimeout(1600);

    const recommendationState = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const zoneIds = gameCore.getZoneIds();
      const scoringContext = gameCore.buildZoneTravelScoringContext(zoneIds);
      const butterflies = (state.butterflies || [])
        .filter(butterfly => gameCore.isZoneEcologyManagedButterfly?.(butterfly))
        .slice(0, 24);

      const recommendations = butterflies.map(butterfly => {
        const currentZoneId = gameCore.getEntityZoneId(butterfly, null);
        let bestZoneId = currentZoneId;
        let bestScore = -Infinity;
        const scoredZones = {};
        for (const zoneId of zoneIds) {
          const score = gameCore.scoreButterflyForZone(butterfly, zoneId, {
            ...scoringContext,
            currentZoneId
          });
          scoredZones[zoneId] = Math.round(score * 100) / 100;
          if (score > bestScore) {
            bestScore = score;
            bestZoneId = zoneId;
          }
        }
        return {
          id: butterfly.id,
          label: butterfly.getDisplayName?.() || butterfly.personalityType || butterfly.id,
          currentZoneId,
          bestZoneId,
          bestScore: Math.round(bestScore * 100) / 100,
          trainingAffinity: Math.round((butterfly.lifeSim?.derived?.behaviorBiases?.trainingAffinity || 0) * 100) / 100,
          caution: Math.round((butterfly.lifeSim?.derived?.behaviorBiases?.caution || 0) * 100) / 100,
          wanderScale: Math.round((butterfly.lifeSim?.derived?.behaviorBiases?.wanderScale || 0) * 100) / 100,
          socialConfidence: Math.round((butterfly.lifeSim?.derived?.behaviorBiases?.socialConfidence || 0) * 100) / 100,
          scoredZones
        };
      });

      const distinctBestZones = new Set(recommendations.map(entry => entry.bestZoneId)).size;
      const trainingAttracted = recommendations.some(entry =>
        entry.bestZoneId === 'sun-court' && (entry.trainingAffinity >= 0.45 || entry.label.toLowerCase().includes('scholar'))
      );
      const watchfulAttracted = recommendations.some(entry =>
        entry.bestZoneId === 'moss-hollow' && entry.caution >= 0.12
      );
      const exploratoryAttracted = recommendations.some(entry =>
        entry.bestZoneId === 'pool-heart' && entry.wanderScale >= 0.55
      );
      const zoneSummaries = zoneIds.map(zoneId => {
        const ecology = gameCore.getZoneEcologySummary?.(zoneId) || {};
        return {
          zoneId,
          label: gameCore.getZoneConfig(zoneId)?.label || zoneId,
          identityLabel: gameCore.getZoneEcologyProfile(zoneId)?.identityLabel || zoneId,
          tags: gameCore.getZoneEcologyProfile(zoneId)?.identityTags || [],
          signatureLabel: ecology.signatureLabel || null,
          foodRichness: ecology.foodRichness || 0,
          shelterCapacity: ecology.shelterCapacity || 0,
          socialValence: ecology.socialValence || 0,
          trainingValence: ecology.trainingValence || 0,
          migrationPull: ecology.migrationPull || 0
        };
      });
      const pressureIdentity = {
        maxSocialZone: zoneSummaries.slice().sort((left, right) => right.socialValence - left.socialValence)[0]?.zoneId || null,
        maxTrainingZone: zoneSummaries.slice().sort((left, right) => right.trainingValence - left.trainingValence)[0]?.zoneId || null,
        maxShelterZone: zoneSummaries.slice().sort((left, right) => right.shelterCapacity - left.shelterCapacity)[0]?.zoneId || null,
        maxMigrationZone: zoneSummaries.slice().sort((left, right) => right.migrationPull - left.migrationPull)[0]?.zoneId || null
      };

      return {
        zoneSummaries,
        pressureIdentity,
        recommendations,
        distinctBestZones,
        trainingAttracted,
        watchfulAttracted,
        exploratoryAttracted
      };
    });

    report.steps.push({
      label: 'zone-recommendation-diversity',
      pass:
        recommendationState.distinctBestZones >= 3 &&
        recommendationState.trainingAttracted &&
        recommendationState.watchfulAttracted &&
        recommendationState.exploratoryAttracted,
      details: recommendationState,
      screenshot: await saveShot(page, outputDir, '01-zone-recommendation-diversity.png')
    });

    report.steps.push({
      label: 'zone-pressure-signatures',
      pass:
        recommendationState.pressureIdentity.maxSocialZone === 'ivy-cloister'
        && recommendationState.pressureIdentity.maxTrainingZone === 'sun-court'
        && recommendationState.pressureIdentity.maxShelterZone === 'moss-hollow'
        && recommendationState.pressureIdentity.maxMigrationZone === 'pool-heart',
      details: {
        pressureIdentity: recommendationState.pressureIdentity,
        zoneSummaries: recommendationState.zoneSummaries
      },
      screenshot: await saveShot(page, outputDir, '02-zone-pressure-signatures.png')
    });

    const travelState = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const beforeZones = Object.fromEntries((state.butterflies || []).map(butterfly => [butterfly.id, gameCore.getEntityZoneId(butterfly, null)]));
      const started = [];
      const completed = [];
      const startEvent = GameEvents?.ZONE_TRAVEL_STARTED || 'zone:travelStarted';
      const completeEvent = GameEvents?.ZONE_TRAVEL_COMPLETED || 'zone:travelCompleted';
      if (typeof eventBus !== 'undefined') {
        eventBus.on(startEvent, payload => started.push(payload));
        eventBus.on(completeEvent, payload => completed.push(payload));
      }

      const decisionIntervalFrames = gameConfig?.balance?.migration?.decisionIntervalFrames || 360;
      const routeDurationFrames = gameConfig?.balance?.migration?.routeDurationFrames || 60;
      const arrivalSettleFrames = gameConfig?.balance?.migration?.arrivalSettleFrames || 42;
      const delta = gameConfig?.simulation?.fixedDeltaSeconds || (1 / 60);

      for (let cycle = 0; cycle < 4; cycle += 1) {
        frameCount = Math.ceil((frameCount + 1) / decisionIntervalFrames) * decisionIntervalFrames;
        gameCore.updateZoneEcology(delta);
        for (let step = 0; step < routeDurationFrames + arrivalSettleFrames + 12; step += 1) {
          gameCore.updateZoneTravelers(delta);
          lifeSimSystem?.update?.(gameCore.getGameState(), delta);
        }
      }

        const afterZones = Object.fromEntries((gameCore.getGameState().butterflies || []).map(butterfly => [butterfly.id, gameCore.getEntityZoneId(butterfly, null)]));
        const movedCount = Object.keys(beforeZones).filter(id => beforeZones[id] !== afterZones[id]).length;
        const perZoneCounts = Object.fromEntries(gameCore.getZoneIds().map(zoneId => [zoneId, gameCore.getButterfliesInZone(zoneId).length]));
        const settledZones = Object.values(perZoneCounts).filter(count => count >= 2).length;
        const butterflies = gameCore.getGameState().butterflies || [];
        const startedReasons = Array.from(new Set(started.map(entry => entry?.reason).filter(Boolean)));
        const completedReasons = Array.from(new Set(completed.map(entry => entry?.reason).filter(Boolean)));
        const homeZoneHistogram = butterflies.reduce((acc, butterfly) => {
          const homeZoneId = butterfly?.lifeSim?.derived?.migration?.homeZoneId || butterfly?.lifeSim?.migration?.homeZoneId || null;
          if (!homeZoneId) return acc;
          acc[homeZoneId] = (acc[homeZoneId] || 0) + 1;
          return acc;
        }, {});

        return {
          beforeZones,
          afterZones,
          movedCount,
          startedCount: started.length,
          completedCount: completed.length,
          startedReasons,
          completedReasons,
          perZoneCounts,
          settledZones,
          homeZoneHistogram,
          distinctHomeZones: Object.keys(homeZoneHistogram).length
        };
      });

      report.steps.push({
        label: 'forced-cross-zone-travel',
      pass:
          travelState.movedCount >= 2 &&
          travelState.startedCount >= 2 &&
          travelState.completedCount >= 2 &&
          travelState.settledZones >= 3 &&
          travelState.distinctHomeZones >= 2 &&
          travelState.startedReasons.some(reason => ['scouting', 'overcrowding', 'return-home', 'mate-seeking', 'migration'].includes(reason)),
        details: travelState,
        screenshot: await saveShot(page, outputDir, '03-forced-cross-zone-travel.png')
      });

    const residencyState = await page.evaluate(() => {
      const zoneIds = gameCore.getZoneIds();
      const byZone = {};
      for (const zoneId of zoneIds) {
        const butterflies = gameCore.getButterfliesInZone(zoneId);
        const count = butterflies.length || 1;
        const totals = butterflies.reduce((sum, butterfly) => {
          const biases = butterfly.lifeSim?.derived?.behaviorBiases || {};
          sum.training += biases.trainingAffinity || 0;
          sum.caution += biases.caution || 0;
          sum.wander += biases.wanderScale || 0;
          sum.social += biases.socialConfidence || 0;
          return sum;
        }, { training: 0, caution: 0, wander: 0, social: 0 });

        byZone[zoneId] = {
          count: butterflies.length,
          avgTrainingAffinity: Math.round((totals.training / count) * 100) / 100,
          avgCaution: Math.round((totals.caution / count) * 100) / 100,
          avgWanderScale: Math.round((totals.wander / count) * 100) / 100,
          avgSocialConfidence: Math.round((totals.social / count) * 100) / 100
        };
      }

      const maxTrainingZone = zoneIds.slice().sort((left, right) => byZone[right].avgTrainingAffinity - byZone[left].avgTrainingAffinity)[0] || null;
      const maxCautionZone = zoneIds.slice().sort((left, right) => byZone[right].avgCaution - byZone[left].avgCaution)[0] || null;
      const maxWanderZone = zoneIds.slice().sort((left, right) => byZone[right].avgWanderScale - byZone[left].avgWanderScale)[0] || null;

      return {
        byZone,
        maxTrainingZone,
        maxCautionZone,
        maxWanderZone
      };
    });

    report.steps.push({
      label: 'zone-local-behavior-identity',
      pass:
        residencyState.maxTrainingZone === 'sun-court' &&
        residencyState.maxCautionZone === 'moss-hollow' &&
        residencyState.maxWanderZone === 'pool-heart',
      details: residencyState,
      screenshot: await saveShot(page, outputDir, '04-zone-local-behavior-identity.png')
    });

    const passingSteps = report.steps.filter(step => step.pass).length;
    report.summary = {
      passingSteps,
      totalSteps: report.steps.length,
      pageErrors: report.pageErrors.length,
      consoleErrors: report.consoleErrors.length
    };
    report.overall = passingSteps === report.steps.length && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'warn';
  } catch (error) {
    report.overall = 'error';
    report.fatalError = error.stack || String(error);
  } finally {
    try {
      if (page && !page.isClosed()) await page.close();
    } catch (_) {}
    try {
      if (browser) await browser.close();
    } catch (_) {}
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      outputDir,
      overall: report.overall,
      reportPath: path.join(outputDir, 'report.json')
    }, null, 2));
  }
}

main();
