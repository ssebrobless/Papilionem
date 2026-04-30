const path = require('path');
const fs = require('fs');
const { ScenarioRunner, SCENARIO_DIR } = require('./runner');
const { sanitizeScenarioName } = require('./dsl');

function listScenarioNames() {
  return fs.readdirSync(SCENARIO_DIR)
    .filter(name => name.endsWith('.json'))
    .map(name => sanitizeScenarioName(path.basename(name, '.json')))
    .sort();
}

module.exports = {
  ScenarioRunner,
  SCENARIO_DIR,
  listScenarioNames
};
