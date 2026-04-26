const fs = require('fs');
const path = require('path');
const { run: runLongSoak } = require('./run-long-soak-generational-audit');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'e6_ecology_depth_audit');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function maxAcross(entries, selector) {
  return entries.reduce((max, entry) => Math.max(max, selector(entry)), 0);
}

function minAcross(entries, selector, fallback = 0) {
  if (!entries.length) return fallback;
  return entries.reduce((min, entry) => Math.min(min, selector(entry)), Number.POSITIVE_INFINITY);
}

async function run() {
  const mode = process.argv.includes('--full') ? 'full' : 'smoke';
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  const longSoakRoot = path.join(outputDir, 'long_soak');
  ensureDir(outputDir);
  ensureDir(longSoakRoot);

  const report = {
    auditId,
    mode,
    startedAt: new Date().toISOString(),
    longSoakReportPath: null,
    longSoakOverall: 'pending',
    assertions: {},
    seeds: [],
    overall: 'pending'
  };

  try {
    const longSoakReport = await runLongSoak({
      mode,
      outputRoot: longSoakRoot
    });
    report.longSoakReportPath = longSoakReport.reportPath;
    report.longSoakOverall = longSoakReport.overall;

    const seedSummaries = (longSoakReport.seeds || []).map(seedReport => {
      const checkpoints = seedReport.checkpoints || [];
      const summaries = checkpoints.map(entry => entry.summary || {});
      const firstCohortCheckpoint = checkpoints.find(entry => (entry.summary?.ecology?.releaseFeedback?.latestCohortId ?? null) != null)?.label || null;
      return {
        seedInput: seedReport.seedInput,
        overall: seedReport.overall,
        assertions: { ...(seedReport.assertions || {}) },
        checkpointCount: checkpoints.length,
        firstCohortCheckpoint,
        maxReleaseHistoryCount: maxAcross(summaries, summary => summary?.ecology?.releaseFeedback?.releaseHistoryCount || 0),
        maxReadableWaveWildCount: maxAcross(summaries, summary => summary?.ecology?.releaseFeedback?.readableWaveWildCount || 0),
        maxWaveWildCount: maxAcross(summaries, summary => summary?.ecology?.releaseFeedback?.latestWaveWildCount || 0),
        minResourceReserve: minAcross(
          summaries.flatMap(summary => summary?.ecology?.zoneEcology || []),
          entry => entry?.resourceReserve || 0,
          0
        ),
        minHabitatQuality: minAcross(
          summaries.flatMap(summary => summary?.ecology?.zoneEcology || []),
          entry => entry?.habitatQuality || 0,
          0
        ),
        maxZonesBelowFloorCount: maxAcross(summaries, summary => (summary?.anomalies?.zoneFloorViolations || []).length),
        maxHomeAnchoredCount: maxAcross(summaries, summary => summary?.ecology?.migration?.homeAnchoredCount || 0),
        maxCompletedTravelCount: maxAcross(summaries, summary => summary?.ecology?.migration?.completedTravelCount || 0),
        maxHomeReturnCount: maxAcross(summaries, summary => summary?.ecology?.migration?.homeReturnCount || 0),
        maxMultiZoneCount: maxAcross(summaries, summary => summary?.ecology?.migration?.multiZoneCount || 0),
        distinctIdentityCount: minAcross(summaries, summary => summary?.ecology?.identity?.distinctIdentityCount || 0, 0),
        distinctSignatureCount: minAcross(summaries, summary => summary?.ecology?.identity?.distinctSignatureCount || 0, 0)
      };
    });
    report.seeds = seedSummaries;

    report.assertions = {
      longSoakPasses: longSoakReport.overall === 'pass',
      allSeedsPass: seedSummaries.every(entry => entry.overall === 'pass'),
      zoneIdentityReadable: seedSummaries.every(entry => entry.distinctIdentityCount >= 4 && entry.distinctSignatureCount >= 4),
      migrationHealthStable: seedSummaries.every(entry =>
        entry.maxHomeAnchoredCount >= 2 &&
        entry.maxCompletedTravelCount >= 1 &&
        entry.maxHomeReturnCount >= 1 &&
        entry.maxMultiZoneCount >= 1
      ),
      resourceRecoveryStable: seedSummaries.every(entry =>
        entry.maxZonesBelowFloorCount === 0 &&
        entry.minResourceReserve >= 0.16 &&
        entry.minHabitatQuality >= 0.18
      ),
      releaseFeedbackStable: seedSummaries.every(entry =>
        !!entry.firstCohortCheckpoint &&
        entry.maxReleaseHistoryCount >= 1 &&
        entry.maxWaveWildCount >= 2 &&
        entry.maxReadableWaveWildCount >= 2
      )
    };
    report.overall = Object.values(report.assertions).every(Boolean) ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    report.finishedAt = new Date().toISOString();
    report.reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
  }

  return report;
}

run().then(report => {
  console.log(JSON.stringify({
    reportPath: report.reportPath,
    longSoakReportPath: report.longSoakReportPath,
    overall: report.overall
  }, null, 2));
  process.exit(report.overall === 'pass' ? 0 : 1);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
