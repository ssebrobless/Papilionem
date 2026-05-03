const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { buildC2TraceCorpus, buildCorpusManifest } = require('./build-c2-trace-corpus');

const ROOT = path.resolve(__dirname, '..');
const POLICY_FAMILIES = ['actionFamily', 'targetPreference', 'signalChoice', 'riskPosture', 'autobattlePosture'];

function resolveInputPath() {
  const argIndex = process.argv.indexOf('--records');
  const arg = argIndex >= 0 ? process.argv[argIndex + 1] : null;
  if (!arg) return null;
  return path.isAbsolute(arg) ? arg : path.join(ROOT, arg);
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

function summarizeRecord(record, index, total) {
  return [
    '',
    `Record ${index + 1}/${total}: ${record.scenarioId || 'unknown'} (${record.scenarioFamily || 'unknown'})`,
    `tags: ${(record.tags || []).join(', ') || 'none'}`,
    `review: ${record.review?.status || 'unreviewed'} corrected=[${(record.review?.correctedPolicies || []).join(', ')}]`,
    ...POLICY_FAMILIES.map(policyName => {
      const heuristic = record.heuristicTrace?.chosenPath?.[policyName]
        || (policyName === 'autobattlePosture' ? record.heuristicTrace?.chosen : null)
        || record.heuristicTrace?.traces?.[policyName]?.chosen
        || 'n/a';
      const label = record.trainingLabels?.[policyName] || 'n/a';
      return `${policyName}: heuristic=${heuristic} label=${label}`;
    })
  ].join('\n');
}

function applyCorrection(record, policyName, nextLabel) {
  record.trainingLabels = record.trainingLabels || {};
  record.review = record.review || {};
  const previousLabel = record.trainingLabels[policyName] || null;
  record.trainingLabels[policyName] = nextLabel;
  record.review.corrections = record.review.corrections || {};
  if (previousLabel !== nextLabel) {
    record.review.corrections[policyName] = { from: previousLabel, to: nextLabel };
  } else {
    delete record.review.corrections[policyName];
  }
  record.review.correctedPolicies = Object.keys(record.review.corrections);
  record.review.status = record.review.correctedPolicies.length ? 'corrected' : 'reviewed-match';
  record.review.rationale = record.review.rationale || 'Reviewed with scripts/review-corpus-records.js';
}

async function loadRecords() {
  const inputPath = resolveInputPath();
  if (inputPath) {
    return {
      recordsPath: inputPath,
      records: JSON.parse(fs.readFileSync(inputPath, 'utf8'))
    };
  }
  const built = await buildC2TraceCorpus({
    sourceAudit: 'review-corpus-records'
  });
  return {
    recordsPath: built.recordsPath,
    records: built.records
  };
}

async function main() {
  const nonInteractive = process.argv.includes('--summary-only') || !process.stdin.isTTY;
  const { recordsPath, records } = await loadRecords();
  const outputPath = recordsPath.replace(/corpus-records\.json$/, 'corpus-records-reviewed.json');
  if (!nonInteractive) {
    const rl = createInterface();
    try {
      for (let index = 0; index < records.length; index += 1) {
        const record = records[index];
        console.log(summarizeRecord(record, index, records.length));
        const answer = await ask(rl, 'Override as policy=label, comma-separated, Enter to keep, q to stop: ');
        if (answer.toLowerCase() === 'q') break;
        for (const part of answer.split(',').map(item => item.trim()).filter(Boolean)) {
          const [policyName, nextLabel] = part.split('=').map(item => item.trim());
          if (POLICY_FAMILIES.includes(policyName) && nextLabel) {
            applyCorrection(record, policyName, nextLabel);
          }
        }
      }
    } finally {
      rl.close();
    }
  }
  fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
  const manifest = buildCorpusManifest(records, {
    sourceAudit: 'review-corpus-records',
    scenarioPresetVersion: 'aa4-reviewed-records'
  });
  const manifestPath = outputPath.replace(/corpus-records-reviewed\.json$/, 'corpus-manifest-reviewed.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({
    overall: 'pass',
    nonInteractive,
    recordsPath: outputPath,
    manifestPath,
    recordCount: manifest.recordCount,
    reviewedRecordCount: manifest.reviewedRecordCount,
    correctedRecordCount: manifest.correctedRecordCount,
    correctedPolicyCount: manifest.correctedPolicyCount
  }, null, 2));
}

main().catch(error => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
