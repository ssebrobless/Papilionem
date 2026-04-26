const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BASELINE_ROOT = path.join(ROOT, 'qa_logs', 'session_captures', 'v0-baseline');
const ISOLATION_ROOT = path.join(ROOT, 'qa_logs', 'session_captures', 'v0.5-flag-isolation');
const SCREENSHOT_ROOT = path.join(ROOT, 'qa_screenshots', 'v0_5_flag_isolation');
const SAVE_EXPORT_ROOT = path.join(ROOT, 'qa_logs', 'save_exports');

const FLAG_CANDIDATES = [
  'pauseWhenHidden',
  'asyncImageDecode',
  'telemetryRingCap',
  'textMeasureCache'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    baselineDir: null,
    savePath: null,
    flags: [...FLAG_CANDIDATES]
  };
  for (const arg of argv) {
    if (arg.startsWith('--baseline=')) {
      const value = arg.slice('--baseline='.length).trim();
      if (value) {
        args.baselineDir = path.resolve(ROOT, value);
      }
    } else if (arg.startsWith('--flags=')) {
      const value = arg.slice('--flags='.length).trim();
      if (value) {
        args.flags = value.split(',').map(entry => entry.trim()).filter(Boolean);
      }
    } else if (!arg.startsWith('--') && !args.savePath) {
      args.savePath = path.resolve(ROOT, arg);
    }
  }
  return args;
}

function resolveLatestDirectory(rootDir) {
  if (!fs.existsSync(rootDir)) return null;
  const dirs = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(rootDir, entry.name))
    .sort((left, right) => right.localeCompare(left));
  return dirs[0] || null;
}

function resolveSavePath(candidate = null) {
  if (candidate) {
    if (!fs.existsSync(candidate)) {
      throw new Error(`Provided save export path does not exist: ${candidate}`);
    }
    if (fs.statSync(candidate).isDirectory()) {
      const savePath = path.join(candidate, 'save.json');
      if (!fs.existsSync(savePath)) {
        throw new Error(`Provided save export directory is missing save.json: ${candidate}`);
      }
      return savePath;
    }
    return candidate;
  }

  if (!fs.existsSync(SAVE_EXPORT_ROOT)) {
    throw new Error('No save export directory exists yet under qa_logs/save_exports');
  }
  const candidates = fs.readdirSync(SAVE_EXPORT_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(SAVE_EXPORT_ROOT, entry.name))
    .map(dir => ({
      dir,
      savePath: path.join(dir, 'save.json'),
      isFixture: /h5-fixture-/.test(dir)
    }))
    .filter(entry => fs.existsSync(entry.savePath) && !entry.isFixture)
    .sort((left, right) => right.dir.localeCompare(left.dir));

  const latest = candidates[0];
  if (!latest) {
    throw new Error('No real save export was found under qa_logs/save_exports');
  }
  return latest.savePath;
}

function runNodeScript(scriptPath, args = [], envExtras = {}) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT,
    env: {
      ...process.env,
      ...envExtras
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8
  });
  if (result.status !== 0) {
    throw new Error([
      `Command failed: node ${scriptPath} ${args.join(' ')}`,
      result.stdout || '',
      result.stderr || ''
    ].join('\n'));
  }
  return result.stdout || '';
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function summarizeDiff(diffMarkdown) {
  const lines = diffMarkdown.split(/\r?\n/);
  const laneSummaries = {};
  let currentLane = null;
  for (const line of lines) {
    const laneMatch = /^##\s+(.+)$/.exec(line.trim());
    if (laneMatch) {
      currentLane = laneMatch[1];
      laneSummaries[currentLane] = [];
      continue;
    }
    if (!currentLane || !line.startsWith('|')) continue;
    if (line.includes('metric') || line.includes('---')) continue;
    const parts = line.split('|').map(part => part.trim()).filter(Boolean);
    if (parts.length < 4) continue;
    const [metric, baseline, candidate, delta] = parts;
    laneSummaries[currentLane].push({ metric, baseline, candidate, delta });
  }
  return laneSummaries;
}

function pickKeyRows(laneRows = []) {
  const wanted = ['avgUpdateMs', 'avgRenderMs', 'p95FrameMs', 'p99FrameMs'];
  return wanted
    .map(metric => laneRows.find(row => row.metric === metric) || null)
    .filter(Boolean);
}

function buildSummaryMarkdown(report) {
  const lines = [
    '# V0.5 Flag Isolation Summary',
    '',
    `- baseline: \`${report.baselineDir}\``,
    `- save: \`${report.savePath}\``,
    ''
  ];

  for (const run of report.runs) {
    lines.push(`## ${run.flag}`);
    lines.push('');
    lines.push(`- output: \`${run.outputDir}\``);
    lines.push(`- diff: \`${run.diffPath}\``);
    lines.push('');
    lines.push('| lane | metric | baseline | candidate | delta |');
    lines.push('| --- | --- | ---: | ---: | --- |');
    for (const lane of ['calm', 'shell', 'travel', 'battle', 'soak40']) {
      const rows = pickKeyRows(run.diffSummary[lane] || []);
      for (const row of rows) {
        lines.push(`| ${lane} | ${row.metric} | ${row.baseline} | ${row.candidate} | ${row.delta} |`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

function run() {
  ensureDir(ISOLATION_ROOT);
  ensureDir(SCREENSHOT_ROOT);

  const args = parseArgs();
  const auditId = stamp();
  const outputDir = path.join(ISOLATION_ROOT, auditId);
  ensureDir(outputDir);

  const baselineDir = args.baselineDir || resolveLatestDirectory(BASELINE_ROOT);
  if (!baselineDir || !fs.existsSync(baselineDir)) {
    throw new Error('Could not resolve a baseline directory for v0.5 isolation');
  }
  const savePath = resolveSavePath(args.savePath);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    baselineDir,
    savePath,
    runs: []
  };

  const baselineRunner = path.join(ROOT, 'scripts', 'run-v0-baseline.js');
  const compareRunner = path.join(ROOT, 'scripts', 'compare-captures.js');

  for (const flagName of args.flags) {
    const flagOverrides = {
      pauseWhenHidden: false,
      asyncImageDecode: false,
      telemetryRingCap: false,
      textMeasureCache: false,
      saveStoreIndexedDbOnly: false,
      [flagName]: true
    };

    const captureRoot = path.join(outputDir, flagName);
    const screenshotRoot = path.join(SCREENSHOT_ROOT, auditId, flagName);
    ensureDir(captureRoot);
    ensureDir(screenshotRoot);

    runNodeScript(
      baselineRunner,
      [
        '--quick',
        `--capture-root=${captureRoot}`,
        `--screenshot-root=${screenshotRoot}`,
        savePath
      ],
      {
        PAPILIONEM_FLAG_OVERRIDES: JSON.stringify(flagOverrides)
      }
    );

    const candidateDir = resolveLatestDirectory(captureRoot);
    if (!candidateDir) {
      throw new Error(`No candidate capture directory was produced for ${flagName}`);
    }

    const diffPath = path.join(candidateDir, 'diff-vs-baseline.md');
    runNodeScript(compareRunner, [baselineDir, candidateDir, diffPath]);

    const summaryJson = readJson(path.join(candidateDir, 'summary.json'));
    const reportJson = readJson(path.join(candidateDir, 'report.json'));
    const diffMarkdown = fs.readFileSync(diffPath, 'utf8');

    report.runs.push({
      flag: flagName,
      outputDir: candidateDir,
      diffPath,
      summary: summaryJson,
      report: reportJson,
      diffSummary: summarizeDiff(diffMarkdown)
    });
  }

  report.finishedAt = new Date().toISOString();

  const summaryMarkdown = buildSummaryMarkdown(report);
  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'SUMMARY.md'), summaryMarkdown, 'utf8');

  console.log(JSON.stringify({
    outputDir,
    baselineDir,
    runs: report.runs.map(run => ({
      flag: run.flag,
      outputDir: run.outputDir,
      diffPath: run.diffPath
    }))
  }, null, 2));
}

try {
  run();
} catch (error) {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
}
