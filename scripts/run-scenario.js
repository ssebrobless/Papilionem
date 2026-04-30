#!/usr/bin/env node
const { ScenarioRunner, listScenarioNames } = require('./scenario');

function parseArgs(argv) {
  const options = { all: false, repeat: 1, scenario: null };
  for (const arg of argv) {
    if (arg === '--all') {
      options.all = true;
    } else if (arg.startsWith('--repeat=')) {
      options.repeat = Math.max(1, Number(arg.split('=')[1] || 1));
    } else if (!arg.startsWith('--')) {
      options.scenario = arg;
    }
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const runner = new ScenarioRunner();
  let report;
  if (options.all) {
    report = await runner.runAll({ repeat: options.repeat });
    console.log(JSON.stringify({
      overall: report.pass ? 'pass' : 'fail',
      scenarioCount: report.scenarioCount,
      scenarios: report.runs.map(run => ({
        scenario: run.scenario,
        overall: run.overall,
        reportPath: run.reportPath
      }))
    }, null, 2));
    process.exit(report.pass ? 0 : 1);
  }
  const scenario = options.scenario || 'seed-spatial-truth';
  report = await runner.runByName(scenario, { repeat: options.repeat });
  console.log(JSON.stringify({
    scenario: report.scenario,
    overall: report.overall,
    deterministic: report.deterministic,
    reportPath: report.reportPath,
    runs: report.runs.map(run => ({
      overall: run.overall,
      reportPath: run.reportPath,
      screenshot: run.screenshot,
      assertionSummary: run.assertionSummary
    }))
  }, null, 2));
  process.exit(report.overall === 'pass' ? 0 : 1);
}

main().catch(error => {
  console.error(error);
  console.error(`Available scenarios: ${listScenarioNames().join(', ')}`);
  process.exit(1);
});
