const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r3_progression_audit');
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
    await resetBaseline(page);

    await phase(page, report, outputDir, '01-fresh-starter-pairs', async () => {
      const details = await page.evaluate(() => {
        const zoneIds = gameCore.getZoneIds();
        const butterflies = gameCore.gameState.butterflies || [];
        const perZone = {};
        for (const zoneId of zoneIds) {
          const zoneButterflies = butterflies.filter(entry => gameCore.getEntityZoneId(entry, null) === zoneId);
          const friendlyFemales = zoneButterflies.filter(entry => entry.personalityType === 'friendly' && entry.sex === 'F');
          const friendlyMales = zoneButterflies.filter(entry => entry.personalityType === 'friendly' && entry.sex === 'M');
          perZone[zoneId] = {
            total: zoneButterflies.length,
            friendlyFemales: friendlyFemales.length,
            friendlyMales: friendlyMales.length,
            warmStarterTrust: zoneButterflies.map(entry => ({
              id: entry.id,
              trustLevel: entry.cursor?.trustLevel ?? null,
              clapFear: entry.cursor?.clapFear ?? null,
              cursorTrust: entry.lifeSim?.playerInteraction?.cursorTrust ?? null,
              birthSource: entry.birthSource || 'wild'
            }))
          };
        }

        return {
          zoneIds,
          unlockedTypes: Array.from(gameCore.gameState.unlockedButterflyTypes || []),
          progressionOrderIndex: gameCore.gameState.progressionOrderIndex,
          starterPairsSeeded: gameCore.gameState.starterPairsSeeded || {},
          butterflies: butterflies.length,
          perZone
        };
      });

      const perZoneValues = Object.values(details.perZone || {});
      return {
        pass:
          Array.isArray(details.zoneIds) &&
          details.zoneIds.length > 0 &&
          Array.isArray(details.unlockedTypes) &&
          details.unlockedTypes.length === 1 &&
          details.unlockedTypes[0] === 'friendly' &&
          perZoneValues.every(zone =>
            zone.total === 2 &&
            zone.friendlyFemales === 1 &&
            zone.friendlyMales === 1 &&
            zone.warmStarterTrust.every(entry =>
              entry.birthSource === 'wild' &&
              (entry.trustLevel ?? 0) >= 18 &&
              (entry.clapFear ?? 999) === 0 &&
              (entry.cursorTrust ?? 0) >= 0.2
            )
          ),
        details
      };
    });

    await phase(page, report, outputDir, '02-same-type-child-unlock', async () => {
      const details = await page.evaluate(() => {
        const zoneIds = gameCore.getZoneIds();
        const butterflies = gameCore.gameState.butterflies || [];
        const firstZoneId = zoneIds[0];
        const friendlyFemale = butterflies.find(entry =>
          entry.personalityType === 'friendly' &&
          entry.sex === 'F' &&
          gameCore.getEntityZoneId(entry, null) === firstZoneId
        );
        const friendlyMale = butterflies.find(entry =>
          entry.personalityType === 'friendly' &&
          entry.sex === 'M' &&
          gameCore.getEntityZoneId(entry, null) === firstZoneId
        );

        if (!friendlyFemale || !friendlyMale) {
          return { ok: false, reason: 'missing-friendly-pair' };
        }

        const lifecycleData = breedingSystem.createLifecycleData(friendlyFemale, friendlyMale);
        const progressionResult = progressionManager.recordSuccessfulOffspring(
          gameCore.gameState,
          friendlyFemale,
          friendlyMale,
          lifecycleData
        );
        for (const unlockedType of progressionResult.unlocks || []) {
          gameCore.spawnUnlockedZonePairs(unlockedType);
        }

        const cautiousPerZone = {};
        for (const zoneId of zoneIds) {
          const zoneButterflies = (gameCore.gameState.butterflies || []).filter(entry => gameCore.getEntityZoneId(entry, null) === zoneId);
          cautiousPerZone[zoneId] = {
            cautiousFemales: zoneButterflies.filter(entry => entry.personalityType === 'cautious' && entry.sex === 'F').length,
            cautiousMales: zoneButterflies.filter(entry => entry.personalityType === 'cautious' && entry.sex === 'M').length
          };
        }

        return {
          ok: true,
          zoneIds,
          progressionResult,
          unlockedTypes: Array.from(gameCore.gameState.unlockedButterflyTypes || []),
          friendlyPairAllowedAfter: progressionManager.isPairAllowedForProgression(
            gameCore.gameState,
            friendlyFemale,
            friendlyMale
          ),
          perTypeStatus: JSON.parse(JSON.stringify(gameCore.gameState.perTypeUnlockStatus || {})),
          femaleWildProgress: progressionManager.getWildProgress(gameCore.gameState, friendlyFemale),
          maleWildProgress: progressionManager.getWildProgress(gameCore.gameState, friendlyMale),
          cautiousPerZone
        };
      });

      const cautiousZones = Object.values(details.cautiousPerZone || {});
      return {
        pass:
          !!details.ok &&
          Array.isArray(details.progressionResult?.unlocks) &&
          details.progressionResult.unlocks.length === 1 &&
          details.progressionResult.unlocks[0] === 'cautious' &&
          Array.isArray(details.unlockedTypes) &&
          details.unlockedTypes.includes('friendly') &&
          details.unlockedTypes.includes('cautious') &&
          details.friendlyPairAllowedAfter === false &&
          details.perTypeStatus?.friendly?.sameTypeChildCompleted === true &&
          details.perTypeStatus?.cautious?.unlocked === true &&
          details.femaleWildProgress?.sameTypeChildCompleted === true &&
          details.maleWildProgress?.sameTypeChildCompleted === true &&
          cautiousZones.length === details.zoneIds.length &&
          cautiousZones.every(zone => zone.cautiousFemales === 1 && zone.cautiousMales === 1),
        details
      };
    });

    await phase(page, report, outputDir, '03-hybrid-progress-and-departure', async () => {
      const details = await page.evaluate(() => {
        const zoneId = gameCore.getZoneIds()[0];
        const butterflies = gameCore.gameState.butterflies || [];
        const friendlyFemale = butterflies.find(entry =>
          entry.personalityType === 'friendly' &&
          entry.sex === 'F' &&
          gameCore.getEntityZoneId(entry, null) === zoneId
        );
        const friendlyMale = butterflies.find(entry =>
          entry.personalityType === 'friendly' &&
          entry.sex === 'M' &&
          gameCore.getEntityZoneId(entry, null) === zoneId
        );
        if (!friendlyFemale || !friendlyMale) {
          return { ok: false, reason: 'missing-friendly-pair' };
        }

        const lifecycleData = breedingSystem.createLifecycleData(friendlyFemale, friendlyMale, {
          childSex: 'M'
        });
        lifecycleData.childSex = 'M';
        lifecycleData.currentZoneId = zoneId;
        const hybridMale = breedingSystem.spawnHybridButterfly(
          friendlyFemale.x + 24,
          friendlyFemale.y,
          lifecycleData,
          gameCore.gameState,
          (typeof particleSystem !== 'undefined' ? particleSystem : null)
        );
        if (!hybridMale) {
          return { ok: false, reason: 'failed-to-spawn-hybrid' };
        }

        gameCore.entityManager?.addEntity?.('butterflies', hybridMale);
        gameCore.registerEntityWithFoundationSystems?.(hybridMale, 'butterfly');
        gameCore.assignEntityToZone?.(hybridMale, zoneId);

        const pairAllowedBefore = progressionManager.isPairAllowedForProgression(
          gameCore.gameState,
          friendlyFemale,
          hybridMale
        );

        const hybridResults = [];
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const result = progressionManager.recordSuccessfulOffspring(
            gameCore.gameState,
            friendlyFemale,
            hybridMale,
            null
          );
          hybridResults.push(result);
        }

        const femaleProgress = progressionManager.getWildProgress(gameCore.gameState, friendlyFemale);
        return {
          ok: true,
          pairAllowedBefore,
          hybridMaleId: hybridMale.id,
          hybridResults,
          femaleProgress,
          exitQueued: !!friendlyFemale.wildLifecycle?.exitQueued,
          exitReason: friendlyFemale.wildLifecycle?.exitReason || null
        };
      });

      const thirdResult = Array.isArray(details.hybridResults) ? details.hybridResults[2] : null;
      return {
        pass:
          !!details.ok &&
          details.pairAllowedBefore === true &&
          details.femaleProgress?.sameTypeChildCompleted === true &&
          details.femaleProgress?.hybridBreedCount === 3 &&
          details.femaleProgress?.permanentDepartureQueued === true &&
          details.exitQueued === true &&
          details.exitReason === 'hybrid-lineage-complete' &&
          Array.isArray(thirdResult?.departures) &&
          thirdResult.departures.includes(details.femaleProgress.butterflyId),
        details
      };
    });

    await phase(page, report, outputDir, '04-progression-roundtrip', async () => {
      const details = await page.evaluate(() => {
        const before = progressionManager.serializeDurableState(gameCore.gameState);
        const restored = {};
        progressionManager.applyDurableState(restored, before);
        const after = progressionManager.serializeDurableState(restored);
        const mismatches = gameCore.saveSystem.compareSerializedDurableState(before, after, 'progression');
        return {
          before,
          after,
          mismatchCount: mismatches.length,
          mismatches
        };
      });

      return {
        pass: details.mismatchCount === 0,
        details
      };
    });

    report.overall = report.phases.every(entry => entry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
