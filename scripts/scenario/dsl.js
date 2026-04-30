function sanitizeScenarioName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.json$/i, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createAssertion(name, pass, details = {}) {
  return {
    name,
    pass: !!pass,
    details
  };
}

function summarizeAssertions(assertions = []) {
  const total = assertions.length;
  const passed = assertions.filter(assertion => assertion.pass).length;
  return {
    total,
    passed,
    failed: total - passed,
    pass: total > 0 && passed === total
  };
}

function signatureForAssertions(assertions = []) {
  return assertions
    .map(assertion => `${assertion.name}:${assertion.pass ? 'pass' : 'fail'}`)
    .sort()
    .join('|');
}

module.exports = {
  createAssertion,
  sanitizeScenarioName,
  signatureForAssertions,
  summarizeAssertions
};
