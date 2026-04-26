const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node scripts/compare-captures.js <baseline-dir> <candidate-dir> [output-file]');
}

function resolveDir(input) {
  if (!input) return null;
  const resolved = path.resolve(process.cwd(), input);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`Capture directory does not exist: ${resolved}`);
  }
  return resolved;
}

function listCaptureFiles(dir) {
  return fs.readdirSync(dir)
    .filter(name => /^capture-.*\.json$/i.test(name))
    .sort();
}

function readCapture(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function extractMetrics(payload = {}) {
  const summary = payload.summary || {};
  const telemetry = payload.telemetry || {};
  return {
    avgUpdateMs: Number(telemetry.averages?.updateMs || 0),
    avgRenderMs: Number(telemetry.averages?.renderMs || 0),
    p50FrameMs: Number(summary.p50FrameMs || 0),
    p95FrameMs: Number(summary.p95FrameMs || 0),
    p99FrameMs: Number(summary.p99FrameMs || 0),
    compositeCallsPerFrame: Number(summary.compositeCallsPerFrame || 0),
    peakHeapUsedMB: Number(summary.peakHeapUsedMB || 0),
    uiRedrawCount: Number(summary.uiRedrawCount || 0),
    debugRedrawCount: Number(summary.debugRedrawCount || 0),
    pressureTier: summary.pressureTier || telemetry.pressure?.tier || 'unknown',
    lagCategory: summary.lagCategory || telemetry.attribution?.category || 'unknown'
  };
}

function formatDelta(before, after) {
  if (!Number.isFinite(before) || !Number.isFinite(after)) return 'n/a';
  if (before === 0) {
    return after === 0 ? '0.0%' : 'n/a';
  }
  const delta = ((after - before) / before) * 100;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function formatValue(value) {
  return Number.isFinite(value) ? value.toFixed(2) : 'n/a';
}

function formatStringDelta(before, after) {
  if (before === after) return 'same';
  return `${before} -> ${after}`;
}

function buildLaneTable(laneName, baselineMetrics, candidateMetrics) {
  const numericRows = [
    ['avgUpdateMs', baselineMetrics.avgUpdateMs, candidateMetrics.avgUpdateMs],
    ['avgRenderMs', baselineMetrics.avgRenderMs, candidateMetrics.avgRenderMs],
    ['p50FrameMs', baselineMetrics.p50FrameMs, candidateMetrics.p50FrameMs],
    ['p95FrameMs', baselineMetrics.p95FrameMs, candidateMetrics.p95FrameMs],
    ['p99FrameMs', baselineMetrics.p99FrameMs, candidateMetrics.p99FrameMs],
    ['compositeCallsPerFrame', baselineMetrics.compositeCallsPerFrame, candidateMetrics.compositeCallsPerFrame],
    ['peakHeapUsedMB', baselineMetrics.peakHeapUsedMB, candidateMetrics.peakHeapUsedMB],
    ['uiRedrawCount', baselineMetrics.uiRedrawCount, candidateMetrics.uiRedrawCount],
    ['debugRedrawCount', baselineMetrics.debugRedrawCount, candidateMetrics.debugRedrawCount]
  ];
  const stringRows = [
    ['pressureTier', baselineMetrics.pressureTier, candidateMetrics.pressureTier],
    ['lagCategory', baselineMetrics.lagCategory, candidateMetrics.lagCategory]
  ];

  const lines = [
    `## ${laneName}`,
    '',
    '| metric | baseline | candidate | delta |',
    '| --- | ---: | ---: | --- |'
  ];

  for (const [label, before, after] of numericRows) {
    lines.push(`| ${label} | ${formatValue(before)} | ${formatValue(after)} | ${formatDelta(before, after)} |`);
  }
  for (const [label, before, after] of stringRows) {
    lines.push(`| ${label} | ${before} | ${after} | ${formatStringDelta(before, after)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function run() {
  const baselineArg = process.argv[2];
  const candidateArg = process.argv[3];
  const outputArg = process.argv[4] || null;

  if (!baselineArg || !candidateArg) {
    usage();
    process.exitCode = 1;
    return;
  }

  const baselineDir = resolveDir(baselineArg);
  const candidateDir = resolveDir(candidateArg);
  const baselineFiles = new Map(listCaptureFiles(baselineDir).map(name => [name, path.join(baselineDir, name)]));
  const candidateFiles = new Map(listCaptureFiles(candidateDir).map(name => [name, path.join(candidateDir, name)]));
  const fileNames = [...new Set([...baselineFiles.keys(), ...candidateFiles.keys()])].sort();

  const sections = [
    '# Capture Comparison',
    '',
    `- baseline: \`${baselineDir}\``,
    `- candidate: \`${candidateDir}\``,
    ''
  ];

  for (const fileName of fileNames) {
    const baselinePath = baselineFiles.get(fileName);
    const candidatePath = candidateFiles.get(fileName);
    const laneName = fileName.replace(/^capture-/, '').replace(/\.json$/i, '');

    if (!baselinePath || !candidatePath) {
      sections.push(`## ${laneName}`);
      sections.push('');
      sections.push(`- missing baseline file: ${baselinePath ? 'no' : 'yes'}`);
      sections.push(`- missing candidate file: ${candidatePath ? 'no' : 'yes'}`);
      sections.push('');
      continue;
    }

    const baselineMetrics = extractMetrics(readCapture(baselinePath));
    const candidateMetrics = extractMetrics(readCapture(candidatePath));
    sections.push(buildLaneTable(laneName, baselineMetrics, candidateMetrics));
  }

  const output = sections.join('\n');
  if (outputArg) {
    const outputPath = path.resolve(process.cwd(), outputArg);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(JSON.stringify({ outputPath }, null, 2));
    return;
  }

  console.log(output);
}

run();
