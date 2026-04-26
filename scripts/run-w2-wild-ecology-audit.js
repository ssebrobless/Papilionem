const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'w2_wild_ecology_audit');
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

    await phase(page, report, outputDir, '01-fresh-starting-zone-seed', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const zoneIds = gameCore.getZoneIds();
        const startZoneId = progressionManager.getFreshSeedZoneId(gameCore.gameState, zoneIds);
        const baseTypes = progressionManager.getFreshSeedTypes();
        const butterflies = gameCore.gameState.butterflies || [];
        const perZone = Object.fromEntries(zoneIds.map(zoneId => [zoneId, {
          total: butterflies.filter(entry => gameCore.getEntityZoneId(entry, null) === zoneId).length,
          byType: {}
        }]));
        for (const type of baseTypes) {
          for (const zoneId of zoneIds) {
            const zoneButterflies = butterflies.filter(entry =>
              gameCore.getEntityZoneId(entry, null) === zoneId &&
              entry.personalityType === type
            );
            perZone[zoneId].byType[type] = {
              female: zoneButterflies.filter(entry => entry.sex === 'F').length,
              male: zoneButterflies.filter(entry => entry.sex === 'M').length
            };
          }
        }
        return {
          zoneIds,
          startZoneId,
          baseTypes,
          wildTargetCount: gameConfig.entities?.wildTargetCount,
          butterflies: butterflies.length,
          perZone
        };
      });

      const nonStartZones = details.zoneIds.filter(zoneId => zoneId !== details.startZoneId);
      return {
        pass:
          !!details.startZoneId &&
          Array.isArray(details.baseTypes) &&
          details.baseTypes.length === 6 &&
          details.wildTargetCount === 12 &&
          details.perZone?.[details.startZoneId]?.total === 12 &&
          details.baseTypes.every(type =>
            details.perZone?.[details.startZoneId]?.byType?.[type]?.female === 1 &&
            details.perZone?.[details.startZoneId]?.byType?.[type]?.male === 1
          ) &&
          nonStartZones.every(zoneId => (details.perZone?.[zoneId]?.total || 0) === 0),
        details
      };
    });

    await phase(page, report, outputDir, '02-wild-unique-partner-rule', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const zoneIds = gameCore.getZoneIds();
        const startZoneId = progressionManager.getFreshSeedZoneId(gameCore.gameState, zoneIds);
        const butterflies = (gameCore.gameState.butterflies || []).filter(entry => gameCore.getEntityZoneId(entry, null) === startZoneId);
        const female = butterflies.find(entry => entry.sex === 'F');
        const males = butterflies.filter(entry => entry.sex === 'M');
        const firstMale = males[0];
        const secondMale = males[1];
        if (!female || !firstMale || !secondMale) {
          return { ok: false, reason: 'missing-starting-partners' };
        }

        const initialAllowed = progressionManager.isPairAllowedForProgression(gameCore.gameState, female, firstMale);
        progressionManager.recordSuccessfulOffspring(gameCore.gameState, female, firstMale, {});
        const repeatAllowed = progressionManager.isPairAllowedForProgression(gameCore.gameState, female, firstMale);
        const secondAllowed = progressionManager.isPairAllowedForProgression(gameCore.gameState, female, secondMale);
        const progress = progressionManager.getWildProgress(gameCore.gameState, female);
        return {
          ok: true,
          femaleId: female.id,
          firstMaleId: firstMale.id,
          secondMaleId: secondMale.id,
          initialAllowed,
          repeatAllowed,
          secondAllowed,
          progress
        };
      });

      return {
        pass:
          !!details.ok &&
          details.initialAllowed === true &&
          details.repeatAllowed === false &&
          details.secondAllowed === true &&
          details.progress?.mateCount === 1 &&
          Array.isArray(details.progress?.partnerHistoryIds) &&
          details.progress.partnerHistoryIds.length === 1,
        details
      };
    });

    await phase(page, report, outputDir, '03-third-wild-mating-removes-in-place', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const zoneIds = gameCore.getZoneIds();
        const startZoneId = progressionManager.getFreshSeedZoneId(gameCore.gameState, zoneIds);
        const butterflies = (gameCore.gameState.butterflies || []).filter(entry => gameCore.getEntityZoneId(entry, null) === startZoneId);
        const female = butterflies.find(entry => entry.sex === 'F');
        const males = butterflies.filter(entry => entry.sex === 'M').slice(0, 3);
        if (!female || males.length < 3) {
          return { ok: false, reason: 'missing-third-mating-setup' };
        }

        const beforeCount = gameCore.gameState.butterflies.length;
        const results = [];
        for (const male of males) {
          const result = progressionManager.recordSuccessfulOffspring(gameCore.gameState, female, male, {});
          results.push({
            maleId: male.id,
            departures: result.departures || []
          });
          for (const butterflyId of result.departures || []) {
            const departing = (gameCore.gameState.butterflies || []).find(entry => entry.id === butterflyId) || null;
            if (departing) {
              gameCore.removeButterflyFromGame(departing);
            }
          }
        }

        const femaleStillAlive = (gameCore.gameState.butterflies || []).some(entry => entry.id === female.id);
        const femaleProgress = progressionManager.getWildProgress(gameCore.gameState, female.id);
        return {
          ok: true,
          beforeCount,
          afterCount: gameCore.gameState.butterflies.length,
          results,
          femaleStillAlive,
          femaleProgress
        };
      });

      return {
        pass:
          !!details.ok &&
          details.results.length === 3 &&
          Array.isArray(details.results[2]?.departures) &&
          details.results[2].departures.includes(details.femaleProgress?.butterflyId) &&
          details.femaleStillAlive === false &&
          details.femaleProgress?.departed === true &&
          details.afterCount === details.beforeCount - 1,
        details
      };
    });

    await phase(page, report, outputDir, '04-hybrid-cap-blocks-hatch', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const startZoneId = progressionManager.getFreshSeedZoneId(gameCore.gameState, gameCore.getZoneIds());
        const baseTraits = progressionManager.getWildSpawnTraits(gameCore.gameState, 'friendly');
        const hybridCap = progressionManager.getHybridAdultCap();
        for (let index = 0; index < hybridCap; index += 1) {
          const hybrid = new Butterfly(180 + (index % 10) * 12, 160 + Math.floor(index / 10) * 10, null, false, 'hybrid', {
            currentZoneId: startZoneId,
            birthSource: 'bred',
            sex: index % 2 === 0 ? 'F' : 'M',
            hybridGenome: { test: true, index },
            customTraits: {
              ...baseTraits,
              speed: baseTraits.speed + 0.3,
              jitteriness: baseTraits.jitteriness + 0.2
            },
            isHybrid: true
          });
          gameCore.assignEntityToZone(hybrid, startZoneId);
          gameCore.gameState.butterflies.push(hybrid);
        }

        const flower = new Flower(260, 220, false, { currentZoneId: startZoneId });
        flower.ensureLifecycleData();
        flower.occupancyState = 'chrysalis';
        flower.chrysalisData = {
          hatchFrame: frameCount,
          hasHatched: false,
          lifecycleData: {
            currentZoneId: startZoneId,
            childSex: 'F',
            parentA: { personalityType: 'friendly' },
            parentB: { personalityType: 'cautious' },
            hybridGenome: { test: 'cap-block' },
            inheritedTraits: baseTraits,
            inheritedColors: [[255, 100, 100], [255, 180, 180]],
            inheritedAbility: 'welcome',
            mutationProfile: null,
            reservationActive: true
          }
        };
        gameCore.gameState.flowers.push(flower);
        gameCore.gameState.pendingOffspringReservations = 1;

        const beforeHybrids = progressionManager.getLivingHybridCount(gameCore.gameState);
        breedingSystem.hatchChrysalisFlower(flower, gameCore.gameState, gameCore.particleSystem || null);
        const afterHybrids = progressionManager.getLivingHybridCount(gameCore.gameState);

        return {
          hybridCap,
          beforeHybrids,
          afterHybrids,
          hatchOutcome: flower.chrysalisData?.hatchOutcome || null,
          hasHatched: !!flower.chrysalisData?.hasHatched,
          pendingReservations: gameCore.gameState.pendingOffspringReservations
        };
      });

      return {
        pass:
          details.beforeHybrids === details.hybridCap &&
          details.afterHybrids === details.hybridCap &&
          details.hatchOutcome === 'hybrid-cap-death' &&
          details.hasHatched === true &&
          details.pendingReservations === 0,
        details
      };
    });

    await phase(page, report, outputDir, '05-release-frees-slot-before-hatch', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const startZoneId = progressionManager.getFreshSeedZoneId(gameCore.gameState, gameCore.getZoneIds());
        const baseTraits = progressionManager.getWildSpawnTraits(gameCore.gameState, 'friendly');
        const hybridIds = [];
        const hybridCap = progressionManager.getHybridAdultCap();
        for (let index = 0; index < hybridCap; index += 1) {
          const hybrid = new Butterfly(180 + (index % 10) * 12, 160 + Math.floor(index / 10) * 10, null, false, 'hybrid', {
            currentZoneId: startZoneId,
            birthSource: 'bred',
            sex: index % 2 === 0 ? 'F' : 'M',
            hybridGenome: { test: true, index },
            customTraits: {
              ...baseTraits,
              speed: baseTraits.speed + 0.25
            },
            isHybrid: true
          });
          gameCore.assignEntityToZone(hybrid, startZoneId);
          gameCore.gameState.butterflies.push(hybrid);
          hybridIds.push(hybrid.id);
        }

        const releaseResult = gameCore.releaseButterflies([hybridIds[0]], { zoneId: startZoneId });
        const flower = new Flower(260, 220, false, { currentZoneId: startZoneId });
        flower.ensureLifecycleData();
        flower.occupancyState = 'chrysalis';
        flower.chrysalisData = {
          hatchFrame: frameCount,
          hasHatched: false,
          lifecycleData: {
            currentZoneId: startZoneId,
            childSex: 'F',
            parentA: { personalityType: 'friendly' },
            parentB: { personalityType: 'cautious' },
            hybridGenome: { test: 'release-save' },
            inheritedTraits: baseTraits,
            inheritedColors: [[255, 100, 100], [255, 180, 180]],
            inheritedAbility: 'welcome',
            mutationProfile: null,
            reservationActive: true
          }
        };
        gameCore.gameState.flowers.push(flower);
        gameCore.gameState.pendingOffspringReservations = 1;

        breedingSystem.hatchChrysalisFlower(flower, gameCore.gameState, gameCore.particleSystem || null);
        return {
          hybridCap,
          releaseResult,
          livingHybrids: progressionManager.getLivingHybridCount(gameCore.gameState),
          hatchOutcome: flower.chrysalisData?.hatchOutcome || null,
          pendingReservations: gameCore.gameState.pendingOffspringReservations
        };
      });

      return {
        pass:
          Array.isArray(details.releaseResult?.releasedIds) &&
          details.releaseResult.releasedIds.length === 1 &&
          details.livingHybrids === details.hybridCap &&
          details.hatchOutcome === 'born' &&
          details.pendingReservations === 0,
        details
      };
    });

    await phase(page, report, outputDir, '06-release-wave-after-10', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const startZoneId = progressionManager.getFreshSeedZoneId(gameCore.gameState, gameCore.getZoneIds());
        const beforeWildCounts = Object.fromEntries(
          progressionManager.getFreshSeedTypes().map(type => [
            type,
            (gameCore.gameState.butterflies || []).filter(entry => entry.birthSource === 'wild' && entry.personalityType === type).length
          ])
        );

        const releaseIds = [];
        for (let index = 0; index < 10; index += 1) {
          const hybrid = new Butterfly(180 + (index % 5) * 16, 160 + Math.floor(index / 5) * 16, null, false, 'hybrid', {
            currentZoneId: startZoneId,
            birthSource: 'bred',
            sex: index % 2 === 0 ? 'F' : 'M',
            hybridGenome: {
              test: 'release-wave',
              index,
              heritage: {
                lineageTypes: index % 2 === 0 ? ['friendly', 'wise'] : ['friendly', 'cautious']
              }
            },
            customTraits: {
              speed: 1.45,
              jitteriness: 1.15,
              trustPropensity: 1.25,
              trustSpeed: 1.22,
              scareThreshold: 4.9,
              happinessBonus: 1.4
            },
            isHybrid: true
          });
          gameCore.assignEntityToZone(hybrid, startZoneId);
          gameCore.gameState.butterflies.push(hybrid);
          releaseIds.push(hybrid.id);
        }

        const result = gameCore.releaseButterflies(releaseIds, { zoneId: startZoneId });
        const afterWildCounts = Object.fromEntries(
          progressionManager.getFreshSeedTypes().map(type => [
            type,
            (gameCore.gameState.butterflies || []).filter(entry => entry.birthSource === 'wild' && entry.personalityType === type).length
          ])
        );
        const cohortSummary = progressionManager.getReleaseCohortSummary(gameCore.gameState);
        const waveButterflies = (gameCore.gameState.butterflies || [])
          .filter(entry => entry.birthSource === 'wild')
          .map(entry => {
            const progress = progressionManager.getWildProgress(gameCore.gameState, entry);
            const profile = statProfileSystem.getEntityProfile?.(entry, gameCore.gameState);
            return {
              id: entry.id,
              zoneId: gameCore.getEntityZoneId(entry, null),
              seededBy: progress?.seededBy || null,
              releaseCohortId: progress?.releaseCohortId || null,
              ecologyLines: profile?.display?.ecologyLines || []
            };
          })
          .filter(entry => entry.releaseCohortId === cohortSummary?.cohortId);

        return {
          result,
          beforeWildCounts,
          afterWildCounts,
          totalReleases: gameCore.gameState.totalReleases,
          releasesSinceRespawn: gameCore.gameState.releasesSinceRespawn,
          wildBaselineModifiers: gameCore.gameState.wildBaselineModifiers,
          cohortSummary,
          waveButterflies
        };
      });

      const modifiers = details.wildBaselineModifiers || {};
      const modifierChanged = Object.values(modifiers).some(value => Math.abs(value || 0) > 0.001);
      const preferredZoneMatched = (details.waveButterflies || []).some(entry => entry.zoneId === details.cohortSummary?.preferredZoneId);
      return {
        pass:
          details.result?.waveCount === 1 &&
          details.totalReleases === 10 &&
          details.releasesSinceRespawn === 0 &&
          modifierChanged &&
          (details.cohortSummary?.topLineages || []).length >= 1 &&
          (details.cohortSummary?.topZones || []).length >= 1 &&
          details.cohortSummary?.preferredZoneId === details.cohortSummary?.topZones?.[0]?.id &&
          preferredZoneMatched &&
          (details.waveButterflies || []).length >= 2 &&
          details.waveButterflies.every(entry => entry.seededBy === 'release-wave' && entry.releaseCohortId === details.cohortSummary?.cohortId) &&
          details.waveButterflies.some(entry => (entry.ecologyLines || []).length >= 1) &&
          Object.keys(details.beforeWildCounts || {}).every(type => (details.afterWildCounts?.[type] || 0) >= (details.beforeWildCounts?.[type] || 0) + 2),
        details
      };
    });

    await phase(page, report, outputDir, '07-inspect-release-flow', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const startZoneId = progressionManager.getFreshSeedZoneId(gameCore.gameState, gameCore.getZoneIds());
        gameCore.focusZone(startZoneId);
        const releaseIds = [];
        for (let index = 0; index < 2; index += 1) {
          const hybrid = new Butterfly(220 + index * 20, 220, null, false, 'hybrid', {
            currentZoneId: startZoneId,
            birthSource: 'bred',
            sex: index === 0 ? 'F' : 'M',
            hybridGenome: {
              test: 'inspect-release',
              index,
              heritage: {
                lineageTypes: index === 0 ? ['friendly', 'wise'] : ['cautious', 'skittish']
              }
            },
            customTraits: {
              speed: 1.2,
              jitteriness: 0.9,
              trustPropensity: 1.1,
              trustSpeed: 1.05,
              scareThreshold: 4.2,
              happinessBonus: 1.1
            },
            isHybrid: true
          });
          gameCore.assignEntityToZone(hybrid, startZoneId);
          gameCore.gameState.butterflies.push(hybrid);
          releaseIds.push(hybrid.id);
        }

        gameUI.inspectPanel.visible = true;
        gameUI.enterInspectReleaseMode(gameCore.gameState);
        const entries = gameUI.getActiveInspectEntries(gameCore.gameState);
        gameUI.toggleInspectReleaseSelection(releaseIds[0]);
        gameUI.toggleInspectReleaseSelection(releaseIds[1]);
        const beforeConfirmSelectionCount = gameUI.inspectControl.releaseSelectionIds.size;
        const confirmResult = gameUI.confirmInspectReleaseSelection(gameCore.gameState);
        const remaining = (gameCore.gameState.butterflies || []).filter(entry => releaseIds.includes(entry.id)).length;

        return {
          entries: entries.map(entry => ({ id: entry.id, checked: entry.checked, subtitle: entry.subtitle })),
          beforeConfirmSelectionCount,
          confirmResult,
          releaseModeAfter: gameUI.inspectControl.releaseMode,
          remaining
        };
      });

      return {
        pass:
          Array.isArray(details.entries) &&
          details.entries.length === 2 &&
          details.entries.every(entry => entry.subtitle.includes('releasable hybrid') && entry.subtitle.includes('batch 0/10')) &&
          details.beforeConfirmSelectionCount === 2 &&
          details.confirmResult === true &&
          details.releaseModeAfter === false &&
          details.remaining === 0,
        details
      };
    });

    await phase(page, report, outputDir, '08-auto-habitat-travel-changes-zones', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const before = (gameCore.gameState.butterflies || []).map(entry => ({
          id: entry.id,
          zoneId: gameCore.getEntityZoneId(entry, null)
        }));
        const decisionIntervalFrames = gameConfig?.balance?.migration?.decisionIntervalFrames || 360;
        frameCount = decisionIntervalFrames;
        gameCore.updateZoneEcology(gameConfig?.simulation?.fixedDeltaSeconds || (1 / 60));

        const startedTravelers = (gameCore.gameState.butterflies || []).filter(entry => entry.zoneTravel).map(entry => ({
          id: entry.id,
          from: entry.zoneTravel?.sourceZoneId || null,
          to: entry.zoneTravel?.targetZoneId || null
        }));

        for (let index = 0; index < 140; index += 1) {
          gameCore.updateZoneTravelers(gameConfig?.simulation?.fixedDeltaSeconds || (1 / 60));
        }

        const after = (gameCore.gameState.butterflies || []).map(entry => ({
          id: entry.id,
          zoneId: gameCore.getEntityZoneId(entry, null)
        }));
        const changedZoneIds = [];
        for (const beforeEntry of before) {
          const afterEntry = after.find(entry => entry.id === beforeEntry.id);
          if (afterEntry && afterEntry.zoneId !== beforeEntry.zoneId) {
            changedZoneIds.push({
              id: beforeEntry.id,
              beforeZoneId: beforeEntry.zoneId,
              afterZoneId: afterEntry.zoneId
            });
          }
        }

        const occupancy = after.reduce((acc, entry) => {
          acc[entry.zoneId] = (acc[entry.zoneId] || 0) + 1;
          return acc;
        }, {});

        return {
          startedTravelers,
          changedZoneIds,
          occupancy
        };
      });

      return {
        pass:
          Array.isArray(details.startedTravelers) &&
          details.startedTravelers.length >= 1 &&
          Array.isArray(details.changedZoneIds) &&
          details.changedZoneIds.length >= 1 &&
          Object.keys(details.occupancy || {}).length >= 2,
        details
      };
    });

    await phase(page, report, outputDir, '09-release-blend-avoids-dominant-line', async () => {
      const runScenario = async (lineageFactory) => page.evaluate((factoryKey) => {
        const startZoneId = progressionManager.getFreshSeedZoneId(gameCore.gameState, gameCore.getZoneIds());
        const releaseIds = [];
        for (let index = 0; index < 10; index += 1) {
          const lineageTypes = factoryKey === 'focused'
            ? ['friendly', 'friendly']
            : (index % 2 === 0 ? ['friendly', 'wise'] : ['cautious', 'skittish']);
          const hybrid = new Butterfly(180 + (index % 5) * 18, 160 + Math.floor(index / 5) * 18, null, false, 'hybrid', {
            currentZoneId: startZoneId,
            birthSource: 'bred',
            sex: index % 2 === 0 ? 'F' : 'M',
            hybridGenome: {
              test: `release-${factoryKey}`,
              index,
              heritage: { lineageTypes }
            },
            customTraits: {
              speed: 1.34,
              jitteriness: 1.08,
              trustPropensity: 1.18,
              trustSpeed: 1.12,
              scareThreshold: 4.55,
              happinessBonus: 1.18
            },
            isHybrid: true
          });
          gameCore.assignEntityToZone(hybrid, startZoneId);
          gameCore.gameState.butterflies.push(hybrid);
          releaseIds.push(hybrid.id);
        }

        gameCore.releaseButterflies(releaseIds, { zoneId: startZoneId });
        const modifiers = gameCore.gameState.wildBaselineModifiers || {};
        const quality = Object.values(modifiers).reduce((sum, value) => sum + Math.abs(value || 0), 0);
        const cohortSummary = progressionManager.getReleaseCohortSummary(gameCore.gameState);
        return {
          quality,
          modifiers,
          cohortSummary
        };
      }, lineageFactory);

      await resetBaseline(page);
      const focused = await runScenario('focused');
      await resetBaseline(page);
      const varied = await runScenario('varied');

      return {
        pass:
          !!focused?.cohortSummary &&
          !!varied?.cohortSummary &&
          (focused.cohortSummary?.topLineages || []).length >= 1 &&
          (varied.cohortSummary?.topLineages || []).length >= 2 &&
          focused.quality <= (varied.quality + 0.05),
        details: { focused, varied }
      };
    });

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
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
