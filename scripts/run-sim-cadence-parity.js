const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'v4_sim_cadence_parity_audit');
const SAVE_EXPORT_ROOT = path.join(ROOT, 'qa_logs', 'save_exports');
const DEFAULT_PORT = 3000;
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];
const THRESHOLDS = {
  maxStaleFrames: 23,
  maxMlStaleFrames: 47,
  maxZoneEcologyStaleFrames: 29,
  maxAveragePositionBucketDrift: 8.5,
  maxPositionBucketDrift: 18,
  maxTravelDelta: 3,
  maxSocialAggregateDrift: 0.16,
  maxDriveDistributionDrift: 0.45,
  maxZoneMismatchSamples: 2
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function buildUrl(port) {
  return `http://127.0.0.1:${port}/`;
}

async function waitForServer(baseUrl) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ok = await fetch(baseUrl).then(() => true).catch(() => false);
    if (ok) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

async function ensureServer(report) {
  const url = buildUrl(DEFAULT_PORT);
  const reachable = await fetch(url).then(() => true).catch(() => false);
  if (reachable) {
    report.server = { reused: true, pid: null, port: DEFAULT_PORT };
    return url;
  }

  const { spawn } = require('child_process');
  const serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: String(DEFAULT_PORT)
    }
  });
  serverProcess.unref();
  report.server = { reused: false, pid: serverProcess.pid, port: DEFAULT_PORT };

  const ready = await waitForServer(url);
  if (!ready) {
    throw new Error('Server did not become reachable in time');
  }
  return url;
}

function resolveSavePath(candidate = null, { allowFixture = false } = {}) {
  if (candidate) {
    const resolved = path.resolve(ROOT, candidate);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      const savePath = path.join(resolved, 'save.json');
      if (fs.existsSync(savePath)) return savePath;
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return resolved;
    }
    throw new Error(`Provided save export path does not exist: ${resolved}`);
  }

  if (!fs.existsSync(SAVE_EXPORT_ROOT)) return null;
  const candidates = fs.readdirSync(SAVE_EXPORT_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(SAVE_EXPORT_ROOT, entry.name))
    .map(dir => ({
      dir,
      savePath: path.join(dir, 'save.json'),
      isFixture: /fixture/i.test(dir)
    }))
    .filter(entry => fs.existsSync(entry.savePath))
    .sort((left, right) => right.dir.localeCompare(left.dir));

  const realCandidate = candidates.find(entry => !entry.isFixture) || null;
  if (realCandidate) return realCandidate.savePath;
  return allowFixture ? (candidates[0]?.savePath || null) : null;
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

async function importSaveIntoPage(page, rawSave) {
  return await page.evaluate(async ({ rawSave, storageKeys }) => {
    storageKeys.forEach(key => window.localStorage.removeItem(key));
    if (typeof saveSystem !== 'undefined' && typeof saveSystem.writePayloadToIndexedDb === 'function') {
      await saveSystem.writePayloadToIndexedDb('papilionem-save-v2', rawSave);
    } else {
      window.localStorage.setItem('papilionem-save-v2', rawSave);
    }
    const restored = await gameCore.loadGameFromStorage?.();
    const state = gameCore.getGameState();
    return {
      restored: !!restored,
      focusedZoneId: state?.focusedZoneId || null,
      butterflyCount: state?.butterflies?.length || 0
    };
  }, {
    rawSave,
    storageKeys: STORAGE_KEYS
  });
}

async function runCapture(browser, baseUrl, rawSave, flagEnabled) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 }
  });
  await context.addInitScript((enabled) => {
    window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = {
      simCadenceSplit: !!enabled
    };
  }, flagEnabled);
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await importSaveIntoPage(page, rawSave);
    await page.waitForTimeout(600);

    const capture = await page.evaluate(async () => {
      const quantize = value => Math.round((Number(value) || 0) / 8);
      const getTracked = (state) => {
        const butterflies = [...(gameCore.getGameState()?.butterflies || [])]
          .filter(entity => entity?.id)
          .sort((left, right) => String(left.id).localeCompare(String(right.id)))
          .slice(0, 12);
        return butterflies.map(entity => {
          const mlFreshness = typeof mlInferenceSystem !== 'undefined'
            ? (mlInferenceSystem.getEntitySummary?.(entity.id, state)?.freshness || null)
            : null;
          return {
          id: entity.id,
          zoneId: entity.currentZoneId || null,
          x: quantize(entity.x),
          y: quantize(entity.y),
          state: entity.state || 'normal',
          dominantDrive: entity.lifeSim?.derived?.dominantDrive || null,
          dominantEmotion: entity.lifeSim?.derived?.dominantEmotion || null,
          staleFrames: Math.max(
            0,
            (typeof frameCount === 'number' ? frameCount : 0) - (entity.lifeSim?.derived?.lastUpdatedFrame || 0)
          ),
          lastValidFrame: entity.lifeSim?.derived?.lastUpdatedFrame || 0,
          mlStaleFrames: Number(mlFreshness?.staleFrames || 0),
          mlLastValidFrame: Number(mlFreshness?.lastValidFrame || 0)
        };
        });
      };
      const getZoneCounts = () => (gameCore.getZoneIds?.() || []).map(zoneId => ({
        zoneId,
        count: (gameCore.getButterfliesInZone?.(zoneId) || []).length
      }));
      const getZoneEcologyFreshness = () => (gameCore.getZoneIds?.() || []).map(zoneId => ({
        zoneId,
        staleFrames: Number(gameCore.getZoneEcologySummary?.(zoneId)?.freshness?.staleFrames || 0),
        lastValidFrame: Number(gameCore.getZoneEcologySummary?.(zoneId)?.freshness?.lastValidFrame || 0)
      }));
      const getDriveDistribution = (tracked) => {
        const counts = {};
        for (const item of tracked) {
          const key = item.dominantDrive || 'unknown';
          counts[key] = (counts[key] || 0) + 1;
        }
        return counts;
      };
      const getAggregate = () => {
        const butterflies = gameCore.getGameState()?.butterflies || [];
        const totals = butterflies.reduce((acc, entity) => {
          acc.trust += Number(entity?.lifeSim?.playerInteraction?.cursorTrust || 0);
          acc.confidence += Number(entity?.lifeSim?.social?.confidence || 0);
          acc.threat += Number(entity?.lifeSim?.emotions?.threat || 0);
          acc.exhaustion += Number(entity?.lifeSim?.emotions?.exhaustion || 0);
          return acc;
        }, {
          trust: 0,
          confidence: 0,
          threat: 0,
          exhaustion: 0
        });
        const count = Math.max(1, butterflies.length || 1);
        return {
          trust: totals.trust / count,
          confidence: totals.confidence / count,
          threat: totals.threat / count,
          exhaustion: totals.exhaustion / count
        };
      };
      const snapshot = (elapsedFrames) => {
        const state = gameCore.getGameState();
        const tracked = getTracked(state);
        return {
          elapsedFrames,
          tracked,
          zoneCounts: getZoneCounts(),
          zoneEcologyFreshness: getZoneEcologyFreshness(),
          activeZoneTravelCount: (state?.butterflies || []).filter(entity => !!entity?.zoneTravel).length,
          driveDistribution: getDriveDistribution(tracked),
          socialAggregate: getAggregate()
        };
      };

      const samples = [];
      const startFrame = typeof frameCount === 'number' ? frameCount : 0;
      const totalFrames = 240;
      const sampleEvery = 12;
      let nextSampleAt = sampleEvery;

      while (((typeof frameCount === 'number' ? frameCount : 0) - startFrame) < totalFrames) {
        await new Promise(resolve => requestAnimationFrame(() => resolve()));
        const currentFrame = typeof frameCount === 'number' ? frameCount : startFrame;
        const elapsedFrames = currentFrame - startFrame;
        if (elapsedFrames >= nextSampleAt) {
          samples.push(snapshot(elapsedFrames));
          nextSampleAt += sampleEvery;
        }
      }

      return {
        samples,
        latestUpdateSample: gameCore.telemetrySystem?.lastUpdateSample
          ? JSON.parse(JSON.stringify(gameCore.telemetrySystem.lastUpdateSample))
          : null
      };
    });

    return {
      capture,
      pageErrors,
      consoleErrors
    };
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

function toCountMap(entries = []) {
  return new Map((entries || []).map(entry => [entry.zoneId, entry.count]));
}

function computeDriveDistributionDrift(control = {}, candidate = {}) {
  const labels = new Set([...Object.keys(control || {}), ...Object.keys(candidate || {})]);
  const controlTotal = Math.max(1, Object.values(control || {}).reduce((sum, value) => sum + value, 0));
  const candidateTotal = Math.max(1, Object.values(candidate || {}).reduce((sum, value) => sum + value, 0));
  let drift = 0;
  for (const label of labels) {
    const left = Number(control?.[label] || 0) / controlTotal;
    const right = Number(candidate?.[label] || 0) / candidateTotal;
    drift += Math.abs(left - right);
  }
  return drift / 2;
}

function compareCaptures(controlRun, candidateRun) {
  const controlSamples = controlRun.capture.samples || [];
  const candidateSamples = candidateRun.capture.samples || [];
  const sampleCount = Math.min(controlSamples.length, candidateSamples.length);
  let zoneMismatchSamples = 0;
  let maxTravelDelta = 0;
  let totalPositionDrift = 0;
  let positionDriftCount = 0;
  let maxPositionBucketDrift = 0;
  let maxSocialAggregateDrift = 0;
  let maxDriveDistributionDrift = 0;
  let maxStaleFrames = 0;
  let maxMlStaleFrames = 0;
  let maxZoneEcologyStaleFrames = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const control = controlSamples[index];
    const candidate = candidateSamples[index];
    const controlZoneCounts = toCountMap(control.zoneCounts);
    const candidateZoneCounts = toCountMap(candidate.zoneCounts);
    let zoneMismatch = false;
    for (const [zoneId, count] of controlZoneCounts.entries()) {
      if ((candidateZoneCounts.get(zoneId) || 0) !== count) {
        zoneMismatch = true;
        break;
      }
    }
    if (zoneMismatch) zoneMismatchSamples += 1;

    maxTravelDelta = Math.max(
      maxTravelDelta,
      Math.abs(Number(control.activeZoneTravelCount || 0) - Number(candidate.activeZoneTravelCount || 0))
    );

    for (const freshnessEntry of candidate.zoneEcologyFreshness || []) {
      maxZoneEcologyStaleFrames = Math.max(
        maxZoneEcologyStaleFrames,
        Number(freshnessEntry?.staleFrames || 0)
      );
    }

    const candidateTrackedMap = new Map((candidate.tracked || []).map(entry => [entry.id, entry]));
    for (const controlEntry of control.tracked || []) {
      const candidateEntry = candidateTrackedMap.get(controlEntry.id);
      if (!candidateEntry) continue;
      const drift = Math.abs((controlEntry.x || 0) - (candidateEntry.x || 0))
        + Math.abs((controlEntry.y || 0) - (candidateEntry.y || 0));
      totalPositionDrift += drift;
      positionDriftCount += 1;
      maxPositionBucketDrift = Math.max(maxPositionBucketDrift, drift);
      maxStaleFrames = Math.max(maxStaleFrames, Number(candidateEntry.staleFrames || 0));
      maxMlStaleFrames = Math.max(maxMlStaleFrames, Number(candidateEntry.mlStaleFrames || 0));
    }

    const socialAggregate = candidate.socialAggregate || {};
    const controlAggregate = control.socialAggregate || {};
    maxSocialAggregateDrift = Math.max(
      maxSocialAggregateDrift,
      Math.abs(Number(controlAggregate.trust || 0) - Number(socialAggregate.trust || 0)),
      Math.abs(Number(controlAggregate.confidence || 0) - Number(socialAggregate.confidence || 0)),
      Math.abs(Number(controlAggregate.threat || 0) - Number(socialAggregate.threat || 0)),
      Math.abs(Number(controlAggregate.exhaustion || 0) - Number(socialAggregate.exhaustion || 0))
    );

    maxDriveDistributionDrift = Math.max(
      maxDriveDistributionDrift,
      computeDriveDistributionDrift(control.driveDistribution, candidate.driveDistribution)
    );
  }

  return {
    sampleCount,
    zoneMismatchSamples,
    maxTravelDelta,
    averagePositionBucketDrift: positionDriftCount ? (totalPositionDrift / positionDriftCount) : 0,
    maxPositionBucketDrift,
    maxSocialAggregateDrift,
    maxDriveDistributionDrift,
    maxStaleFrames,
    maxMlStaleFrames,
    maxZoneEcologyStaleFrames
  };
}

function buildMarkdownReport(report) {
  const lines = [
    '# V4 Sim Cadence Parity Audit',
    '',
    '```text',
    'overall',
    `pass                 ${report.overall === 'pass' ? 'yes' : 'no'}`,
    `sampleCount          ${report.comparison.sampleCount}`,
    `maxStaleFrames       ${report.comparison.maxStaleFrames}`,
    `maxMlStaleFrames     ${report.comparison.maxMlStaleFrames}`,
    `maxZoneEcologyStale ${report.comparison.maxZoneEcologyStaleFrames}`,
    `avgPositionDrift     ${report.comparison.averagePositionBucketDrift.toFixed(2)}`,
    `maxPositionDrift     ${report.comparison.maxPositionBucketDrift.toFixed(2)}`,
    `maxTravelDelta       ${report.comparison.maxTravelDelta}`,
    `zoneMismatchSamples  ${report.comparison.zoneMismatchSamples}`,
    `maxSocialDrift       ${report.comparison.maxSocialAggregateDrift.toFixed(4)}`,
    `maxDriveDistDrift    ${report.comparison.maxDriveDistributionDrift.toFixed(4)}`,
    '```',
    '',
    '## Thresholds',
    '',
    '```text',
    `maxStaleFrames <= ${THRESHOLDS.maxStaleFrames}`,
    `maxMlStaleFrames <= ${THRESHOLDS.maxMlStaleFrames}`,
    `maxZoneEcologyStaleFrames <= ${THRESHOLDS.maxZoneEcologyStaleFrames}`,
    `avgPositionBucketDrift <= ${THRESHOLDS.maxAveragePositionBucketDrift}`,
    `maxPositionBucketDrift <= ${THRESHOLDS.maxPositionBucketDrift}`,
    `maxTravelDelta <= ${THRESHOLDS.maxTravelDelta}`,
    `maxSocialAggregateDrift <= ${THRESHOLDS.maxSocialAggregateDrift}`,
    `maxDriveDistributionDrift <= ${THRESHOLDS.maxDriveDistributionDrift}`,
    `zoneMismatchSamples <= ${THRESHOLDS.maxZoneMismatchSamples}`,
    '```',
    '',
    '## Update Breakdown',
    '',
    '```text',
    `control foundation breakdown   ${JSON.stringify(report.control.capture.latestUpdateSample?.foundationBreakdown || {})}`,
    `candidate foundation breakdown ${JSON.stringify(report.candidate.capture.latestUpdateSample?.foundationBreakdown || {})}`,
    '```',
    '',
    '## Errors',
    '',
    `- control page errors: ${report.control.pageErrors.length}`,
    `- control console errors: ${report.control.consoleErrors.length}`,
    `- candidate page errors: ${report.candidate.pageErrors.length}`,
    `- candidate console errors: ${report.candidate.consoleErrors.length}`
  ];
  return lines.join('\n');
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    savePath: resolveSavePath(process.argv[2], { allowFixture: true }),
    server: null,
    thresholds: THRESHOLDS,
    control: null,
    candidate: null,
    comparison: null,
    overall: 'pending'
  };

  if (!report.savePath) {
    throw new Error('No save export was available for cadence parity audit');
  }

  const rawSave = fs.readFileSync(report.savePath, 'utf8');
  let browser;
  try {
    const baseUrl = await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    report.control = await runCapture(browser, baseUrl, rawSave, false);
    report.candidate = await runCapture(browser, baseUrl, rawSave, true);
    report.comparison = compareCaptures(report.control, report.candidate);

    const pass = report.comparison.maxStaleFrames <= THRESHOLDS.maxStaleFrames
      && report.comparison.maxMlStaleFrames <= THRESHOLDS.maxMlStaleFrames
      && report.comparison.maxZoneEcologyStaleFrames <= THRESHOLDS.maxZoneEcologyStaleFrames
      && report.comparison.averagePositionBucketDrift <= THRESHOLDS.maxAveragePositionBucketDrift
      && report.comparison.maxPositionBucketDrift <= THRESHOLDS.maxPositionBucketDrift
      && report.comparison.maxTravelDelta <= THRESHOLDS.maxTravelDelta
      && report.comparison.maxSocialAggregateDrift <= THRESHOLDS.maxSocialAggregateDrift
      && report.comparison.maxDriveDistributionDrift <= THRESHOLDS.maxDriveDistributionDrift
      && report.comparison.zoneMismatchSamples <= THRESHOLDS.maxZoneMismatchSamples
      && !report.control.pageErrors.length
      && !report.control.consoleErrors.length
      && !report.candidate.pageErrors.length
      && !report.candidate.consoleErrors.length;

    report.overall = pass ? 'pass' : 'fail';
    report.finishedAt = new Date().toISOString();

    fs.writeFileSync(
      path.join(outputDir, 'report.json'),
      JSON.stringify(report, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'REPORT.md'),
      buildMarkdownReport(report)
    );

    if (!pass) {
      process.exitCode = 1;
    }
  } finally {
    await browser?.close().catch(() => {});
  }
}

run().catch(error => {
  console.error('[run-sim-cadence-parity] failed');
  console.error(error);
  process.exitCode = 1;
});
