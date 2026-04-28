#!/usr/bin/env node
// Probe P0.d: bench.js refuses page/console-error captures unless --allow-errors is explicit.

const {
    parseArgs,
    collectBenchRuntimeErrors,
    hasBenchRuntimeErrors,
    assertBenchRuntimeClean
} = require('../../../scripts/bench');

function expectThrow(label, fn) {
    try {
        fn();
    } catch (error) {
        return String(error?.message || error);
    }
    throw new Error(`${label} should have thrown`);
}

function main() {
    const strictArgs = parseArgs(['single-zone-122', '--no-raw']);
    const allowArgs = parseArgs(['single-zone-122', '--allow-errors', '--no-raw']);
    if (strictArgs.allowErrors !== false) throw new Error('strict bench unexpectedly allows errors');
    if (allowArgs.allowErrors !== true) throw new Error('--allow-errors did not parse');

    const clean = collectBenchRuntimeErrors({ errors: [], consoleErrors: [] });
    const dirty = collectBenchRuntimeErrors({
        errors: ['ReferenceError: test page error'],
        consoleErrors: ['console.error: test console error']
    });

    if (hasBenchRuntimeErrors(clean)) throw new Error('clean session reported runtime errors');
    if (!hasBenchRuntimeErrors(dirty)) throw new Error('dirty session did not report runtime errors');
    assertBenchRuntimeClean(clean, strictArgs);

    const strictMessage = expectThrow('strict runtime policy', () => {
        assertBenchRuntimeClean(dirty, strictArgs);
    });
    if (!strictMessage.includes('refusing to treat this digest as evidence')) {
        throw new Error(`strict policy error message lost benchmark-evidence context: ${strictMessage}`);
    }

    assertBenchRuntimeClean(dirty, allowArgs);

    console.log(JSON.stringify({
        ok: true,
        probe: 'p0d-bench-error-policy',
        strictArgs,
        allowArgs,
        dirtyCounts: {
            pageErrors: dirty.pageErrors.length,
            consoleErrors: dirty.consoleErrors.length
        }
    }, null, 2));
}

try {
    main();
} catch (error) {
    console.error('[probe-bench-error-policy] FAILED:', error);
    process.exit(1);
}
