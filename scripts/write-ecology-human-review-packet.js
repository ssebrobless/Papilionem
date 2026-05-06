const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_logs', 'ecology_human_review');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function latestReportUnder(dir) {
  if (!fs.existsSync(dir)) return null;
  const candidates = fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(dir, entry.name, 'report.json'))
    .filter(file => fs.existsSync(file))
    .map(file => ({
      file,
      mtimeMs: fs.statSync(file).mtimeMs
    }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  return candidates[0]?.file || null;
}

function bulletList(items = []) {
  return items.length
    ? items.map(item => `- ${item}`).join('\n')
    : '- none captured';
}

function sampleLines(samples = [], limit = 5) {
  return samples.slice(0, limit).map(sample => {
    if (typeof sample === 'string') return sample;
    return sample?.phrase || JSON.stringify(sample);
  });
}

function copyIfExists(sourcePath, outputDir) {
  if (!sourcePath || !fs.existsSync(sourcePath)) return null;
  const target = path.join(outputDir, path.basename(sourcePath));
  fs.copyFileSync(sourcePath, target);
  return target;
}

function run() {
  ensureDir(OUTPUT_ROOT);
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);

  const uiReportPath = latestReportUnder(path.join(ROOT, 'qa_screenshots', 'ecology_ui_causality_audit'));
  const livedReportPath = latestReportUnder(path.join(ROOT, 'qa_screenshots', 'ecology_dialogue_causality_audit'));
  if (!uiReportPath) throw new Error('No ecology UI causality report found.');
  if (!livedReportPath) throw new Error('No ecology dialogue causality report found.');

  const uiReport = readJson(uiReportPath);
  const livedReport = readJson(livedReportPath);
  const uiScreenshot = copyIfExists(uiReport.screenshot, outputDir);
  const livedScreenshot = copyIfExists(livedReport.screenshot, outputDir);
  const lanes = uiReport.browserResult?.lanes || {};
  const ecologyDialogue = livedReport.ecologyDialogue || {};
  const followThrough = livedReport.followThrough || {};

  const reviewPath = path.join(outputDir, 'human-review.md');
  const packet = [
    '# Ecology Human Review Packet',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Source Evidence',
    '',
    `- UI causality report: \`${path.relative(ROOT, uiReportPath)}\``,
    `- Lived ecology report: \`${path.relative(ROOT, livedReportPath)}\``,
    uiScreenshot ? `- UI screenshot copy: \`${path.relative(ROOT, uiScreenshot)}\`` : '- UI screenshot copy: missing',
    livedScreenshot ? `- Lived screenshot copy: \`${path.relative(ROOT, livedScreenshot)}\`` : '- Lived screenshot copy: missing',
    '',
    '## What To Judge',
    '',
    '```',
    '+----------------+-----------------------+-----------------------------+',
    '| lane           | mechanical proof      | human question              |',
    '+----------------+-----------------------+-----------------------------+',
    '| pollen         | feed + inspect cause  | does planting read useful?  |',
    '| cleanup        | feed + inspect cause  | does cleaning read useful?  |',
    '| shade/rest     | feed + inspect cause  | does block use read as rest?|',
    '| lived ecology  | unforced followthrough| does society feel active?   |',
    '+----------------+-----------------------+-----------------------------+',
    '```',
    '',
    '## UI Causality Lanes',
    '',
    `Pollen: ${lanes.pollen?.completed ? 'completed' : 'missing'}`,
    '',
    bulletList([
      ...(lanes.pollen?.inspectBeforeLines || []),
      ...(lanes.pollen?.inspectAfterLines || []),
      lanes.pollen?.feedEntry?.consequenceTail
    ].filter(Boolean)),
    '',
    `Cleanup: ${lanes.cleanup?.completed ? 'completed' : 'missing'}`,
    '',
    bulletList([
      ...(lanes.cleanup?.inspectBeforeLines || []),
      ...(lanes.cleanup?.inspectAfterLines || []),
      lanes.cleanup?.feedEntry?.consequenceTail
    ].filter(Boolean)),
    '',
    `Shade/rest: ${lanes.shade?.completed ? 'completed' : 'missing'}`,
    '',
    bulletList([
      ...(lanes.shade?.inspectBeforeLines || []),
      ...(lanes.shade?.inspectAfterLines || []),
      lanes.shade?.feedEntry?.consequenceTail
    ].filter(Boolean)),
    '',
    '## Lived Ecology Summary',
    '',
    `- Overall: \`${livedReport.overall}\``,
    `- Mode: \`${livedReport.mode || 'unknown'}\``,
    `- Unforced verdict: \`${livedReport.unforcedSoakVerdict || 'n/a'}\``,
    `- Ecology dialogue ratio: ${ecologyDialogue.ecologyDialogueRatio ?? 'n/a'}`,
    `- Cleanup events: ${followThrough.cleanupObjectCleanedEventCount ?? 0}`,
    `- Pollen follow-through events: ${followThrough.pollenFollowThroughEventCount ?? 0}`,
    `- Reserve-food uses: ${followThrough.reserveFoodUseCount ?? 0} / ${followThrough.reserveFoodMaxUses ?? 0}`,
    `- Shade-rest arrivals: ${followThrough.shadeRestArrivedCount ?? 0}`,
    `- Shade-rest settling sleep: ${followThrough.shadeRestSettlingSleepCount ?? 0}`,
    '',
    '## Dialogue Samples',
    '',
    'Cleanup:',
    '',
    bulletList(sampleLines(ecologyDialogue.cleanupSamples || [])),
    '',
    'Planting:',
    '',
    bulletList(sampleLines(ecologyDialogue.plantingSamples || [])),
    '',
    'Reserve food:',
    '',
    bulletList(sampleLines(ecologyDialogue.reserveSamples || [])),
    '',
    'Shade/rest:',
    '',
    bulletList(sampleLines(ecologyDialogue.shelterSamples || [])),
    '',
    '## Human Review Questions',
    '',
    '- When you read the feed/inspect lines, do the butterflies seem to be acting for understandable reasons?',
    '- Does cleanup feel like useful environmental labor, or does it still feel like invisible bookkeeping?',
    '- Does shade/rest make block building feel valuable enough to notice?',
    '- Do the dialogue samples sound like social language, or are any lines still too abstract?',
    '- Which lane most needs visual affordance work before we add more AI complexity?',
    '',
    '## Honest Boundary',
    '',
    'This packet is evidence of causal, remembered, socially influenced behavior. It is not evidence of literal sentience or subjective feeling. The product target remains believable butterfly society.'
  ].join('\n');

  fs.writeFileSync(reviewPath, packet);
  const report = {
    outputDir,
    reviewPath,
    uiReportPath,
    livedReportPath,
    uiScreenshot,
    livedScreenshot,
    overall: uiReport.overall === 'pass' && livedReport.overall === 'pass' ? 'pass' : 'review-needed'
  };
  const reportPath = path.join(outputDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.overall !== 'pass') process.exitCode = 1;
}

run();
