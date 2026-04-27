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
    attachCpuProfiler,
    stamp
} = require('./harness-core');

function parseArgs(argv) {
    const args = { positional: [], out: null, raw: true, headless: true, profile: false, profileIntervalMicros: 500 };
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
        } else if (arg === '--profile') {
            args.profile = true;
        } else if (arg === '--profile-interval') {
            args.profileIntervalMicros = Number(argv[i + 1]);
            args.profile = true;
            i += 1;
        } else if (arg.startsWith('--')) {
            throw new Error(`Unknown flag: ${arg}`);
        } else {
            args.positional.push(arg);
        }
    }
    return args;
}

const TOP_BREAKDOWN_KEYS = [
    'update.physicsMs',
    'update.entity.butterflyUpdateMs',
    'update.entity.caterpillarUpdateMs',
    'update.entity.blockUpdateMs',
    'update.foundation.lifeSimSystemMs',
    'update.foundation.mlInferenceSystemMs',
    'update.foundation.behaviorSystemMs',
    'update.foundation.communicationSystemMs',
    'update.foundation.teachingSystemMs',
    'update.foundation.sleepSystemMs',
    'update.foundation.statusSystemMs',
    'update.foundation.structureSystemMs',
    'update.foundation.objectSystemMs',
    'update.foundation.battleSystemMs',
    'update.world.breedingMs',
    'update.world.flowerManagerMs',
    'update.world.specialEffectsMs',
    'render.entityLayerMs',
    'render.compositeMs',
    'render.entityFamilyButterflyMs',
    'render.entityFamilyFlowerMs',
    'render.entityFamilyBlockMs',
    'render.composite.totalCompositeMs'
];

function formatBreakdownLine(key, value) {
    const num = typeof value === 'number' ? value.toFixed(2) : String(value ?? '-');
    return `    ${key.padEnd(46)} ${num.padStart(8)}`;
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
        const digestLabel = `${scenarioRaw.label}-${stamp()}`;
        const profilePath = args.profile
            ? path.join(outputDir, `${digestLabel}.cpuprofile`)
            : null;
        let profiler = null;
        if (args.profile) {
            profiler = await attachCpuProfiler({
                page: session.page,
                profilePath,
                samplingIntervalMicros: args.profileIntervalMicros
            });
        }

        const result = await runScenario({
            page: session.page,
            seed: scenarioRaw.seed,
            butterflyCount: scenarioRaw.butterflyCount,
            flowerCount: scenarioRaw.flowerCount,
            blockCount: scenarioRaw.blockCount,
            focusZoneId: scenarioRaw.focusZoneId,
            viewMode: scenarioRaw.viewMode,
            warmupFrames: scenarioRaw.warmupFrames,
            captureFrames: scenarioRaw.captureFrames,
            label: scenarioRaw.label,
            onCaptureStart: profiler ? () => profiler.start() : null,
            onCaptureEnd: profiler ? () => profiler.stop() : null
        });

        const summary = summarizeCapture(result.capture);
        const frameTimes = Array.isArray(result.capture?.frameTimes) ? result.capture.frameTimes : [];

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
                spawnActual: result.butterflies.final,
                flowerSpawnRequested: result.flowerSpawn?.requested ?? null,
                flowerSpawnActual: result.entities?.flowers ?? null,
                blockSpawnRequested: result.blockSpawn?.requested ?? null,
                blockSpawnActual: result.entities?.blocks ?? null,
                focusZoneId: result.entities?.focusedZoneId ?? null,
                viewMode: result.entities?.viewMode ?? null
            },
            frameTimes,
            raw: args.raw ? result.capture : null
        });

        console.log('\n[bench] === summary ===');
        console.log(JSON.stringify({
            scenario: scenarioRaw.label,
            butterflyCount: result.butterflies.final,
            flowerCount: result.entities?.flowers ?? null,
            blockCount: result.entities?.blocks ?? null,
            focusZoneId: result.entities?.focusedZoneId ?? null,
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

        const breakdown = summary?.breakdown || {};
        const topRows = TOP_BREAKDOWN_KEYS.filter(k => Number.isFinite(breakdown[k]));
        if (topRows.length) {
            console.log('\n[bench] === avg ms per frame (top breakdown) ===');
            for (const key of topRows) {
                console.log(formatBreakdownLine(key, breakdown[key]));
            }
        }

        console.log(`\n[bench] digest -> ${persisted.digestPath}`);
        if (persisted.rawPath) console.log(`[bench] raw    -> ${persisted.rawPath}`);
        if (profilePath) console.log(`[bench] profile-> ${profilePath}  (open in Chrome DevTools > Performance > Load profile)`);
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
