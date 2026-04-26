const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'genetics_mutation_audit');
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

    await phase(page, report, outputDir, '01-forced-mutation-inspect', async () => {
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const female = (state.butterflies || []).find(entry => entry.sex === 'F');
        const male = (state.butterflies || []).find(entry => entry.sex === 'M');
        if (!female || !male) {
          return { ok: false, reason: 'missing-parents' };
        }

        const lifecycleData = breedingSystem.createLifecycleData(female, male, {
          forceMutation: true,
          forceMajor: true,
          mutatedTraitCount: 2
        });
        lifecycleData.currentZoneId = female.currentZoneId || state.focusedZoneId || null;

        const spawnX = Math.min((female.x || 200) + 28, (gameConfig?.canvas?.baseWidth || 960) - 80);
        const spawnY = Math.min((female.y || 180) + 18, (gameConfig?.canvas?.baseHeight || 540) - 80);
        const hybrid = breedingSystem.spawnHybridButterfly(spawnX, spawnY, lifecycleData, state, null);
        if (!hybrid) {
          return { ok: false, reason: 'spawn-failed' };
        }

        gameUI.inspectPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = hybrid.id;

        const entityProfile = statProfileSystem.getEntityProfile(hybrid, state);
        const journalEntry = (state.hybridJournal || []).find(entry => entry.id === hybrid.hybridEntryId) || null;
        const journalProfile = journalEntry ? statProfileSystem.getJournalProfile(journalEntry, state) : null;

        return {
          ok: true,
          hybridId: hybrid.id,
          hybridEntryId: hybrid.hybridEntryId,
          mutationProfile: lifecycleData.mutationProfile,
          entityMutation: hybrid.mutationProfile || hybrid.lifeSim?.genetics?.mutationProfile || null,
          inspectMutationLines: entityProfile?.display?.mutationLines || [],
          inspectHeritageLines: entityProfile?.display?.heritageLines || [],
          inspectRarityLines: entityProfile?.display?.rarityLines || [],
          inspectEcologyLines: entityProfile?.display?.ecologyLines || [],
          inspectLockLines: entityProfile?.display?.lockLines || [],
          journalMutationLines: journalProfile?.display?.mutationLines || [],
          journalHeritageLines: journalProfile?.display?.heritageLines || [],
          journalRarityLines: journalProfile?.display?.rarityLines || [],
          journalEcologyLines: journalProfile?.display?.ecologyLines || [],
          journalLockLines: journalProfile?.display?.lockLines || [],
          baselineLines: entityProfile?.display?.baselineLines || [],
          readinessLines: entityProfile?.display?.readinessLines || []
        };
      });

      return {
        pass:
          details.ok &&
          !!details.mutationProfile?.mutatedTraits?.length &&
          !!details.entityMutation?.mutatedTraits?.length &&
          (details.inspectMutationLines?.[0] || '').includes('post-average') &&
          (details.inspectMutationLines || []).length >= 2 &&
          (details.inspectHeritageLines || []).length >= 1 &&
          (details.inspectRarityLines || []).length >= 1 &&
          (details.inspectEcologyLines || []).length >= 1 &&
          (details.inspectLockLines || []).length >= 1 &&
          (details.journalMutationLines || []).length >= 2 &&
          (details.journalHeritageLines || []).length >= 1 &&
          (details.journalRarityLines || []).length >= 1 &&
          (details.journalEcologyLines || []).length >= 1 &&
          (details.journalLockLines || []).length >= 1 &&
          (details.baselineLines || []).length >= 3 &&
          (details.readinessLines || []).length >= 1,
        details
      };
    });

    await phase(page, report, outputDir, '02-mutation-save-load', async () => {
      const details = await page.evaluate(() => {
        const beforeState = gameCore.getGameState();
        const before = (beforeState.butterflies || []).find(entry => entry.mutationProfile?.mutatedTraits?.length);
        if (!before) {
          return { ok: false, reason: 'missing-mutated-hybrid-before-save' };
        }

        const beforeSignature = before.mutationProfile.signature;
        const beforeTraitLine = Object.entries(before.traits || {})
          .filter(([key]) => key !== 'special')
          .slice(0, 3)
          .map(([key, value]) => `${key}:${value}`)
          .join(', ');

        gameCore.saveGameToStorage?.({ source: 'audit' });
        const restored = gameCore.loadGameFromStorage?.();
        const afterState = gameCore.getGameState();
        const after = (afterState.butterflies || []).find(entry => entry.id === before.id)
          || (afterState.butterflies || []).find(entry => entry.hybridEntryId === before.hybridEntryId);

        if (!restored || !after) {
          return { ok: false, reason: 'restore-failed', restored: !!restored };
        }

        const afterSignature = after.mutationProfile?.signature || after.lifeSim?.genetics?.mutationProfile?.signature || null;
        const profile = statProfileSystem.getEntityProfile(after, afterState);

        gameUI.inspectPanel.visible = true;
        gameUI.inspectPanel.lockedTargetId = after.id;

        return {
          ok: true,
          restoredId: after.id,
          beforeSignature,
          afterSignature,
          beforeTraitLine,
          afterTraitLine: Object.entries(after.traits || {})
            .filter(([key]) => key !== 'special')
            .slice(0, 3)
            .map(([key, value]) => `${key}:${value}`)
            .join(', '),
          mutationLines: profile?.display?.mutationLines || [],
          heritageLines: profile?.display?.heritageLines || [],
          rarityLines: profile?.display?.rarityLines || [],
          ecologyLines: profile?.display?.ecologyLines || [],
          lockLines: profile?.display?.lockLines || [],
          baselineLines: profile?.display?.baselineLines || []
        };
      });

      return {
        pass:
          details.ok &&
          details.beforeSignature &&
          details.beforeSignature === details.afterSignature &&
          (details.mutationLines || []).length >= 2 &&
          (details.heritageLines || []).length >= 1 &&
          (details.rarityLines || []).length >= 1 &&
          (details.ecologyLines || []).length >= 1 &&
          (details.lockLines || []).length >= 1 &&
          (details.baselineLines || []).length >= 3,
        details
      };
    });

    const relevantConsole = report.consoleErrors.length;
    const passingPhases = report.phases.filter(phaseResult => phaseResult.pass).length;
    report.summary = {
      passingPhases,
      totalPhases: report.phases.length,
      pageErrors: report.pageErrors.length,
      consoleErrors: relevantConsole
    };
    report.overall = passingPhases === report.phases.length &&
      report.pageErrors.length === 0 &&
      relevantConsole === 0
      ? 'pass'
      : 'warn';
  } catch (error) {
    report.overall = 'error';
    report.fatalError = error.stack || String(error);
  } finally {
    try {
      if (page && !page.isClosed()) {
        await page.close();
      }
    } catch (_) {}
    try {
      if (context) {
        await context.close();
      }
    } catch (_) {}
    try {
      if (browser) {
        await browser.close();
      }
    } catch (_) {}
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall }, null, 2));
    if (report.overall === 'error') process.exitCode = 1;
  }
}

run();
