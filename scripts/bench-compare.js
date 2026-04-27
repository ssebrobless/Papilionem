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

const BREAKDOWN_MIN_ABS_MS = 0.5; // skip fields where both sides round to noise
const BREAKDOWN_MIN_DELTA_PCT = 0.10; // wider gate than top-line to filter wall noise

function parseArgs(argv) {
    const args = {
        positional: [],
        threshold: 0.05,
        breakdownThreshold: null,
        breakdownLimit: 30,
        showAllBreakdown: false
    };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--threshold') {
            args.threshold = Number(argv[i + 1]);
            i += 1;
        } else if (arg === '--breakdown-threshold') {
            args.breakdownThreshold = Number(argv[i + 1]);
            i += 1;
        } else if (arg === '--breakdown-limit') {
            args.breakdownLimit = Number(argv[i + 1]);
            i += 1;
        } else if (arg === '--all-breakdown') {
            args.showAllBreakdown = true;
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

    const baselineBreakdown = baselineSummary.breakdown || {};
    const candidateBreakdown = candidateSummary.breakdown || {};
    const allKeys = new Set([...Object.keys(baselineBreakdown), ...Object.keys(candidateBreakdown)]);
    const breakdownThreshold = args.breakdownThreshold ?? Math.max(args.threshold, BREAKDOWN_MIN_DELTA_PCT);
    const breakdownRows = [];
    for (const key of allKeys) {
        if (!key.endsWith('Ms')) continue;
        const a = Number(baselineBreakdown[key]);
        const b = Number(candidateBreakdown[key]);
        if (!Number.isFinite(a) && !Number.isFinite(b)) continue;
        const aSafe = Number.isFinite(a) ? a : 0;
        const bSafe = Number.isFinite(b) ? b : 0;
        const delta = bSafe - aSafe;
        const pct = aSafe !== 0 ? delta / aSafe : null;
        breakdownRows.push({ key, baseline: aSafe, candidate: bSafe, delta, pct });
    }
    breakdownRows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    if (breakdownRows.length) {
        console.log('');
        console.log('Per-system breakdown (avg ms per frame, sorted by |delta|):');
        const headerRow = `  ${pad('field', 50)} ${pad('baseline', 10, true)} ${pad('candidate', 10, true)} ${pad('delta', 10, true)} ${pad('pct', 8, true)} status`;
        console.log(headerRow);
        console.log('  ' + '-'.repeat(headerRow.length - 2));
        const rows = args.showAllBreakdown ? breakdownRows : breakdownRows.slice(0, args.breakdownLimit);
        for (const row of rows) {
            const isMaterial = Math.max(Math.abs(row.baseline), Math.abs(row.candidate)) >= BREAKDOWN_MIN_ABS_MS;
            let status = 'ok';
            if (isMaterial && row.pct !== null) {
                if (row.pct > breakdownThreshold) {
                    status = 'REGRESSION';
                    regressions.push({ key: `breakdown.${row.key}`, baseline: row.baseline, candidate: row.candidate, pct: row.pct });
                } else if (row.pct < -breakdownThreshold) {
                    status = 'improved';
                }
            }
            const pctStr = row.pct !== null ? (row.pct * 100).toFixed(1) + '%' : '-';
            console.log(`  ${pad(row.key, 50)} ${pad(fmt(row.baseline), 10, true)} ${pad(fmt(row.candidate), 10, true)} ${pad(fmt(row.delta), 10, true)} ${pad(pctStr, 8, true)} ${status}`);
        }
        if (!args.showAllBreakdown && breakdownRows.length > args.breakdownLimit) {
            console.log(`  ... ${breakdownRows.length - args.breakdownLimit} more (use --all-breakdown to see)`);
        }
    }

    if (regressions.length) {
        console.log('');
        console.log(`FAIL: ${regressions.length} regression(s) past threshold (top: ${(args.threshold * 100).toFixed(1)}%, breakdown: ${(breakdownThreshold * 100).toFixed(1)}%)`);
        process.exit(1);
    }
    console.log('');
    console.log('PASS: no regressions past threshold');
}

main();
