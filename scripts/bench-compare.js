#!/usr/bin/env node
// Diff two bench digests and report regressions.
//
// Usage:
//   node scripts/bench-compare.js <baseline.json> <candidate.json> [--threshold 0.05]
//
// Exits 0 when no metric regresses beyond the threshold (default 5% on lower-is-better
// metrics: p50/p95/p99 frame ms, max frame ms, avg update/render ms, peak heap MB,
// wall ms per frame). Exits 1 otherwise.

const fs = require('fs');
const path = require('path');

const REGRESSION_FIELDS = [
    { key: 'p50FrameMs', better: 'lower' },
    { key: 'p95FrameMs', better: 'lower' },
    { key: 'p99FrameMs', better: 'lower' },
    { key: 'maxFrameMs', better: 'lower' },
    { key: 'avgUpdateMs', better: 'lower' },
    { key: 'avgRenderMs', better: 'lower' },
    { key: 'tickWallMsPerFrame', better: 'lower' },
    { key: 'peakHeapMB', better: 'lower' }
];

const COUNTER_FIELDS = ['butterflyCount', 'spawnActual', 'spriteCacheHits', 'spriteCacheMisses', 'spriteCacheEvictions', 'tickFrames'];

function parseArgs(argv) {
    const args = { positional: [], threshold: 0.05 };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--threshold') {
            args.threshold = Number(argv[i + 1]);
            i += 1;
        } else if (arg.startsWith('--')) {
            throw new Error(`Unknown flag: ${arg}`);
        } else {
            args.positional.push(arg);
        }
    }
    return args;
}

function loadDigest(p) {
    if (!fs.existsSync(p)) throw new Error(`Missing digest: ${p}`);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { path: p, data };
}

function fmt(value) {
    if (value === null || value === undefined) return 'n/a';
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return String(value);
        if (Math.abs(value) >= 100) return value.toFixed(1);
        if (Math.abs(value) >= 10) return value.toFixed(2);
        return value.toFixed(3);
    }
    return String(value);
}

function pad(s, width, left = false) {
    const str = String(s);
    if (str.length >= width) return str;
    return left ? str.padStart(width, ' ') : str.padEnd(width, ' ');
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.positional.length < 2) {
        console.error('Usage: bench-compare <baseline> <candidate> [--threshold 0.05]');
        process.exit(2);
    }
    const baseline = loadDigest(path.resolve(args.positional[0]));
    const candidate = loadDigest(path.resolve(args.positional[1]));

    const baselineSummary = baseline.data.summary || {};
    const candidateSummary = candidate.data.summary || {};

    console.log(`baseline  : ${baseline.path}`);
    console.log(`candidate : ${candidate.path}`);
    console.log(`scenario  : ${baseline.data.scenario?.label || 'unknown'} -> ${candidate.data.scenario?.label || 'unknown'}`);
    console.log(`threshold : ${(args.threshold * 100).toFixed(1)}% on lower-is-better metrics`);
    console.log('');

    const header = `${pad('metric', 24)} ${pad('baseline', 12, true)} ${pad('candidate', 12, true)} ${pad('delta', 12, true)} ${pad('pct', 10, true)} status`;
    console.log(header);
    console.log('-'.repeat(header.length));

    const regressions = [];
    for (const { key, better } of REGRESSION_FIELDS) {
        const a = Number(baselineSummary[key]);
        const b = Number(candidateSummary[key]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) {
            console.log(`${pad(key, 24)} ${pad(fmt(baselineSummary[key]), 12, true)} ${pad(fmt(candidateSummary[key]), 12, true)} ${pad('-', 12, true)} ${pad('-', 10, true)} skip`);
            continue;
        }
        const delta = b - a;
        const pct = a !== 0 ? (delta / a) : null;
        let status = 'ok';
        if (better === 'lower') {
            if (pct !== null && pct > args.threshold) {
                status = 'REGRESSION';
                regressions.push({ key, baseline: a, candidate: b, pct });
            } else if (pct !== null && pct < -args.threshold) {
                status = 'improved';
            }
        }
        console.log(`${pad(key, 24)} ${pad(fmt(a), 12, true)} ${pad(fmt(b), 12, true)} ${pad(fmt(delta), 12, true)} ${pad(pct !== null ? (pct * 100).toFixed(1) + '%' : '-', 10, true)} ${status}`);
    }

    console.log('');
    console.log('Counters (informational):');
    for (const key of COUNTER_FIELDS) {
        const a = baselineSummary[key];
        const b = candidateSummary[key];
        console.log(`  ${pad(key, 24)} ${pad(fmt(a), 12, true)} -> ${pad(fmt(b), 12, true)}`);
    }

    if (regressions.length) {
        console.log('');
        console.log(`FAIL: ${regressions.length} regression(s) past ${(args.threshold * 100).toFixed(1)}% threshold`);
        process.exit(1);
    }
    console.log('');
    console.log('PASS: no regressions past threshold');
}

main();
