const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ensureServer, ensureDir, stamp } = require('./harness-core');
const { buildG0HFixtureSave } = require('./build-g0h-fixture-save');
const { getFixtureSpec } = require('./g0h/fixtureSpec');
const {
  G0HPlaythroughDriver,
  waitForGame,
  dismissTitle,
  captureStorage,
  restoreStorage
} = require('./g0h/playthroughDriver');
const { buildEvidenceLanes, summarizeLanes } = require('./g0h/evidenceAssertions');

function copyFileIfExists(source, target) {
  if (!source || !fs.existsSync(source)) return null;
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
  return target;
}

function writeHumanReview(outputDir, report, spec) {
  const fidelityLane = (report.evidenceLanes || []).find(lane => lane.id === 'evidence-fidelity') || null;
  const fidelityGaps = fidelityLane && !fidelityLane.pass
    ? (fidelityLane.details?.gaps || ['Evidence fidelity lane failed without a named gap.'])
    : [];
  const lines = [
    '# G0H Scripted Playthrough Human Review',
    '',
    `Packet: ${outputDir}`,
    `Generated: ${new Date().toISOString()}`,
    `Overall: ${report.overall}`,
    '',
    '## Evidence Summary',
    '',
    ...report.evidenceLanes.map(lane => `- [${lane.pass ? 'x' : ' '}] ${lane.id}${lane.residual ? ' (residual)' : ''}`),
    '',
    '## Screenshots',
    '',
    ...spec.screenshots.map(file => `- screenshots/${file}`),
    '',
    '## Human Questions',
    '',
    ...spec.humanReviewQuestions.map(question => `- [ ] ${question}`),
    '',
    ...(fidelityGaps.length ? [
      '## Evidence Fidelity',
      '',
      ...fidelityGaps.map(gap => `- ${gap}`),
      ''
    ] : []),
    '## Residuals / Follow-Up',
    ''
  ];
  const residuals = report.laneSummary?.residual || [];
  const failures = report.laneSummary?.failed || [];
  if (!residuals.length && !failures.length) {
    lines.push('- No automated residuals recorded. Human review can focus on feel, readability, and believability.');
  } else {
    for (const failure of failures) lines.push(`- Blocking failure: ${failure}`);
    for (const residual of residuals) lines.push(`- Residual: ${residual}`);
  }
  const file = path.join(outputDir, 'human-review.md');
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return file;
}

async function run() {
  const spec = getFixtureSpec();
  const fast = process.argv.includes('--fast') || process.env.PAPILIONEM_G0H_FAST === '1';
  const auditId = stamp();
  const outputDir = path.join(spec.packetRoot, auditId);
  const fixtureDir = path.join(outputDir, 'fixture-save');
  const captureDir = path.join(outputDir, 'capture');
  const screenshotsDir = path.join(outputDir, 'screenshots');
  ensureDir(outputDir);
  ensureDir(fixtureDir);
  ensureDir(captureDir);
  ensureDir(screenshotsDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    outputDir,
    accelerated: fast,
    minimumDurationMs: fast ? 1 : spec.minimumDurationMs,
    fixture: null,
    importResult: null,
    runtime: {
      pageErrors: [],
      consoleErrors: []
    },
    capture: null,
    screenshots: {},
    scriptedEvidence: null,
    evidenceLanes: [],
    laneSummary: null,
    overall: 'pending'
  };

  let browser;
  let context;
  let page;
  let initialStorage = null;

  try {
    const fixtureReport = await buildG0HFixtureSave({ throwOnFailure: true });
    report.fixture = {
      pass: fixtureReport.pass,
      savePath: fixtureReport.savePath,
      manifestPath: fixtureReport.manifestPath,
      reportPath: fixtureReport.reportPath,
      counts: fixtureReport.manifest?.counts || null
    };
    copyFileIfExists(fixtureReport.savePath, path.join(fixtureDir, 'save.json'));
    copyFileIfExists(fixtureReport.manifestPath, path.join(fixtureDir, 'manifest.json'));
    copyFileIfExists(fixtureReport.reportPath, path.join(fixtureDir, 'builder-report.json'));

    const server = await ensureServer();
    report.url = server.baseUrl;
    report.server = { baseUrl: server.baseUrl, port: server.port, spawned: !!server.spawned };

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    await context.addInitScript(() => {
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
      window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = {
        memoryAttributionEnabled: true
      };
    });
    page = await context.newPage();
    page.on('pageerror', error => report.runtime.pageErrors.push(String(error?.stack || error)));
    page.on('console', message => {
      if (message.type() === 'error') report.runtime.consoleErrors.push(message.text());
    });

    await page.goto(server.baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    initialStorage = await captureStorage(page);
    await dismissTitle(page);

    const driver = new G0HPlaythroughDriver({
      page,
      outputDir,
      fixtureSpec: spec,
      fixtureReport,
      fast
    });

    report.importResult = await driver.importFixtureSave(fixtureReport.savePath);
    if (!report.importResult.restored) {
      throw new Error('Fixture save did not load cleanly');
    }

    await driver.focusZone(spec.zones.ivy);
    await driver.startCapture(fast ? 'g0h-scripted-playthrough-fast' : 'g0h-scripted-playthrough');
    report.screenshots['00-ivy-focused.png'] = await driver.screenshot('00-ivy-focused.png');
    await driver.snapshot('00-ivy-focused');

    await driver.waitUntil(20000);
    await driver.inspect('Lumen');
    await driver.inspect('Mira');
    await driver.inspect('Iris');
    report.screenshots['01-inspect-lumen.png'] = await driver.screenshot('01-inspect-lumen.png');

    await driver.waitUntil(45000);
    await driver.triggerScoutSignal();
    await driver.refreshProductionEventCounts();
    await driver.collectAbilityEvidence();

    await driver.waitUntil(80000);
    await driver.showOverview();
    report.screenshots['02-overview.png'] = await driver.screenshot('02-overview.png');

    await driver.waitUntil(105000);
    await driver.focusZone(spec.zones.moss);
    await driver.inspect('Aster');
    await driver.inspect('Briar');
    await driver.inspect('Clover');

    await driver.waitUntil(120000);
    await driver.triggerDistressChoice();
    await driver.refreshProductionEventCounts();
    report.screenshots['03-moss-distress.png'] = await driver.screenshot('03-moss-distress.png');
    await driver.snapshot('03-moss-distress');

    await driver.waitUntil(165000);
    await driver.nudgeFlowerCleanup();
    report.screenshots['04-flower-cleanup.png'] = await driver.screenshot('04-flower-cleanup.png');

    await driver.waitUntil(200000);
    await driver.focusZone(spec.zones.moss);
    report.screenshots['05-block-stack.png'] = await driver.screenshot('05-block-stack.png');

    await driver.waitUntil(210000);
    await driver.killBondedPartner('Pollen');
    await driver.refreshProductionEventCounts();
    await driver.snapshot('05b-bonded-partner-death');

    await driver.waitUntil(240000);
    await driver.focusZone(spec.zones.pool);
    await page.evaluate(() => {
      for (let index = 0; index < 300; index += 1) {
        gameCore.update?.();
      }
    });
    await driver.inspect('Orchid');
    await driver.inspect('Vale');
    report.screenshots['06-pool-grief-lonely.png'] = await driver.screenshot('06-pool-grief-lonely.png');
    await driver.snapshot('06-pool-grief-lonely');

    await driver.waitUntil(270000);
    await driver.focusZone(spec.zones.ivy);
    await driver.nudgeWitnessedAffection();
    await driver.refreshProductionEventCounts();
    await driver.inspect('Iris');
    await driver.snapshot('06b-witnessed-affection');

    await driver.waitUntil(285000);
    await driver.saveReloadAndReinspect('Orchid');
    report.screenshots['07-after-reload-inspect.png'] = await driver.screenshot('07-after-reload-inspect.png');

    await driver.waitUntil(325000);
    await driver.focusZone(spec.zones.sun);
    await driver.startBattleEvidence();
    report.screenshots['08-sun-battle.png'] = await driver.screenshot('08-sun-battle.png');

    await driver.waitUntil(375000);
    await driver.commitBattleEvidence();
    await driver.refreshProductionEventCounts();

    await driver.waitUntil(405000);
    await driver.focusZone(spec.zones.ivy);
    await driver.collectFeedShape();
    if (typeof page !== 'undefined') {
      await page.evaluate(() => {
        if (gameUI?.activityLogPanel) gameUI.activityLogPanel.visible = true;
        if (gameUI?.inspectPanel) gameUI.inspectPanel.visible = false;
      });
    }
    report.screenshots['09-final-feed.png'] = await driver.screenshot('09-final-feed.png');
    await driver.snapshot('09-final-feed');

    await driver.waitUntil(420000);
    report.runtime = await driver.runtimeSummary(report.runtime.pageErrors, report.runtime.consoleErrors);
    report.capture = await driver.exportCapture(captureDir);
    report.scriptedEvidence = driver.evidence;
    report.evidenceLanes = buildEvidenceLanes(report);
    report.laneSummary = summarizeLanes(report.evidenceLanes);
    report.overall = report.laneSummary.failed.length
      ? 'fail'
      : report.laneSummary.residual.length
        ? 'pass-with-residual'
        : 'pass';
    report.humanReviewPath = writeHumanReview(outputDir, report, spec);
  } catch (error) {
    report.overall = 'fail';
    report.error = error?.stack || String(error);
  } finally {
    if (initialStorage && page) {
      await restoreStorage(page, initialStorage).catch(error => {
        report.restoreError = String(error?.stack || error);
      });
    }
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    report.reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2), 'utf8');
    if (!report.humanReviewPath) {
      report.humanReviewPath = writeHumanReview(outputDir, report, spec);
      fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2), 'utf8');
    }
    console.log(JSON.stringify({
      overall: report.overall,
      outputDir,
      reportPath: report.reportPath,
      capturePath: report.capture?.capturePath || null,
      summaryPath: report.capture?.summaryPath || null,
      laneSummary: report.laneSummary,
      accelerated: fast
    }, null, 2));
  }

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
