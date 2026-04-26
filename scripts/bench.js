#!/usr/bin/env node
// Run a deterministic Papilionem performance scenario and write a digest JSON.
//
// Usage:
//   node scripts/bench.js <scenario-name> [--out qa_logs/bench/baseline] [--raw] [--no-raw]
//
// scenario-name resolves to bench/scenarios/<name>.json (the .json suffix is optional).
// The digest lands at <out>/<label>-<stamp>.json with the per-frame frameTimes array
// inlined for distribution analysis. With --raw we also write the full capture payload
// alongside as <label>-<stamp>.raw.json.

const fs = require('fs');
const path = require('path');
const {
    ROOT,
    ensureServer,
    launchHarness,
    closeHarness,
    runScenario,
    summarizeCapture,
    persistDigest,
    stamp
} = require('./harness-core');

function parseArgs(argv) {
    const args = { positional: [], out: null, raw: true, headless: true };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--out') {
            args.out = argv[i + 1];
            i += 1;
        } else if (arg === '--raw') {
            args.raw = true;
        } else if (arg === '--no-raw') {
            args.raw = false;
        } else if (arg === '--headed') {
            args.headless = false;
        } else if (arg.startsWith('--')) {
            throw new Error(`Unknown flag: ${arg}`);
        } else {
            args.positional.push(arg);
        }
    }
    return args;
}

function resolveScenarioPath(name) {
    if (!name) throw new Error('Scenario name is required (e.g. butterflies-100)');
    const candidates = [
        name,
        `${name}.json`,
        path.join(ROOT, 'bench', 'scenarios', name),
        path.join(ROOT, 'bench', 'scenarios', `${name}.json`)
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }
    }
    throw new Error(`Could not locate scenario "${name}" (looked in bench/scenarios/)`);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const scenarioName = args.positional[0];
    const scenarioPath = resolveScenarioPath(scenarioName);
    const scenarioRaw = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
    const outputDir = args.out
        ? path.resolve(ROOT, args.out)
        : path.join(ROOT, 'qa_logs', 'bench', 'adhoc');

    console.log(`[bench] scenario=${scenarioPath}`);
    console.log(`[bench] outputDir=${outputDir}`);

    const ctx = await ensureServer();
    console.log(`[bench] server=${ctx.baseUrl}${ctx.spawned ? ' (spawned)' : ' (reused)'}`);

    let session = null;
    try {
        session = await launchHarness({ baseUrl: ctx.baseUrl, headless: args.headless });
        const result = await runScenario({
            page: session.page,
            seed: scenarioRaw.seed,
            butterflyCount: scenarioRaw.butterflyCount,
            warmupFrames: scenarioRaw.warmupFrames,
            captureFrames: scenarioRaw.captureFrames,
            label: scenarioRaw.label
        });

        const summary = summarizeCapture(result.capture);
        const frameTimes = Array.isArray(result.capture?.frameTimes) ? result.capture.frameTimes : [];

        const digestLabel = `${scenarioRaw.label}-${stamp()}`;
        const persisted = persistDigest({
            outputDir,
            label: digestLabel,
            scenario: {
                ...scenarioRaw,
                source: scenarioPath
            },
            summary: {
                ...summary,
                tickWallElapsedMs: result.tick.wallElapsedMs,
                tickFrames: result.tick.frames,
                tickWallMsPerFrame: result.tick.wallElapsedMs / Math.max(1, result.tick.frames),
                spawnAttempts: result.spawn.attempts,
                spawnRequested: result.spawn.requested,
                spawnActual: result.butterflies.final
            },
            frameTimes,
            raw: args.raw ? result.capture : null
        });

        console.log('\n[bench] === summary ===');
        console.log(JSON.stringify({
            scenario: scenarioRaw.label,
            butterflyCount: result.butterflies.final,
            wallMsPerFrame: (result.tick.wallElapsedMs / Math.max(1, result.tick.frames)).toFixed(2),
            p50FrameMs: summary.p50FrameMs,
            p95FrameMs: summary.p95FrameMs,
            p99FrameMs: summary.p99FrameMs,
            maxFrameMs: summary.maxFrameMs,
            avgUpdateMs: summary.avgUpdateMs?.toFixed?.(2) ?? summary.avgUpdateMs,
            avgRenderMs: summary.avgRenderMs?.toFixed?.(2) ?? summary.avgRenderMs,
            peakHeapMB: summary.peakHeapMB,
            spriteCacheHits: summary.spriteCacheHits,
            spriteCacheMisses: summary.spriteCacheMisses,
            spriteCacheEvictions: summary.spriteCacheEvictions
        }, null, 2));
        console.log(`[bench] digest -> ${persisted.digestPath}`);
        if (persisted.rawPath) console.log(`[bench] raw    -> ${persisted.rawPath}`);
        if (session.errors.length) {
            console.warn(`[bench] page errors: ${session.errors.length}`);
            for (const err of session.errors.slice(0, 5)) console.warn(`  - ${err}`);
        }
        if (session.consoleErrors.length) {
            console.warn(`[bench] console errors: ${session.consoleErrors.length}`);
            for (const err of session.consoleErrors.slice(0, 5)) console.warn(`  - ${err}`);
        }
    } finally {
        if (session) await closeHarness(session, ctx);
    }
}

main().catch(err => {
    console.error('[bench] FAILED:', err);
    process.exit(1);
});
