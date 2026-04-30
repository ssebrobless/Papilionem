// Shared harness helpers for deterministic Papilionem benchmarks.
//
// Boot pattern:
//   const { ensureServer, launchHarness, closeHarness, runScenario } = require('./harness-core');
//   const ctx = await ensureServer();
//   const session = await launchHarness({ baseUrl: ctx.baseUrl });
//   const result = await runScenario({ page: session.page, ... });
//   await closeHarness(session, ctx);
//
// The harness expects sketch.js to expose window.papilionemHarness (installed when
// window.__PAPILIONEM_HARNESS_MODE__ is true at boot time). It tears down the natural p5
// draw loop so we can step ticks deterministically.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let chromiumModule = null;
function loadChromium() {
    if (chromiumModule) return chromiumModule;
    chromiumModule = require('playwright').chromium;
    return chromiumModule;
}

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PORT = 3000;
const FALLBACK_PORT = 3030;

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

async function isReachable(url) {
    try {
        const res = await fetch(url);
        return res.ok || res.status >= 200;
    } catch (_error) {
        return false;
    }
}

async function waitUntilReachable(url, attempts = 80, delayMs = 250) {
    for (let i = 0; i < attempts; i += 1) {
        if (await isReachable(url)) return true;
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return false;
}

async function ensureServer({ port = DEFAULT_PORT, startIfMissing = true } = {}) {
    const primaryUrl = `http://127.0.0.1:${port}/`;
    if (await isReachable(primaryUrl)) {
        return { baseUrl: primaryUrl, port, spawned: null };
    }
    if (!startIfMissing) {
        throw new Error(`Server not reachable at ${primaryUrl}`);
    }
    const useFallback = port === DEFAULT_PORT && (await isReachable(`http://127.0.0.1:${FALLBACK_PORT}/`));
    const targetPort = useFallback ? FALLBACK_PORT : port;
    const targetUrl = `http://127.0.0.1:${targetPort}/`;
    const child = spawn(process.execPath, ['server.js'], {
        cwd: ROOT,
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, PORT: String(targetPort) }
    });
    child.unref();
    const ready = await waitUntilReachable(targetUrl);
    if (!ready) {
        throw new Error(`Spawned server did not become reachable on port ${targetPort}`);
    }
    return { baseUrl: targetUrl, port: targetPort, spawned: { pid: child.pid } };
}

async function launchHarness({
    baseUrl,
    viewport = { width: 1280, height: 720 },
    deviceScaleFactor = 1,
    headless = true,
    flagOverrides = { memoryAttributionEnabled: true },
    worldRenderMode = null
} = {}) {
    if (!baseUrl) throw new Error('launchHarness requires baseUrl');
    const chromium = loadChromium();
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport, deviceScaleFactor });
    await context.addInitScript(({ overrides, renderMode }) => {
        window.__PAPILIONEM_HARNESS_MODE__ = true;
        if (overrides && typeof overrides === 'object') {
            window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = overrides;
        }
        if (renderMode) {
            window.__PAPILIONEM_WORLD_RENDERMODE__ = renderMode;
            window.localStorage.setItem('papilionem-world-rendermode', renderMode);
        }
    }, { overrides: flagOverrides, renderMode: worldRenderMode });
    const page = await context.newPage();
    const errors = [];
    const consoleErrors = [];
    page.on('pageerror', err => errors.push(String(err)));
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
        () => !!window.papilionemHarness && window.papilionemHarness.ready === true,
        null,
        { timeout: 45000 }
    );
    return { browser, context, page, errors, consoleErrors };
}

async function closeHarness(session, ctx) {
    if (session?.page) {
        try { await session.page.close(); } catch (_) {}
    }
    if (session?.context) {
        try { await session.context.close(); } catch (_) {}
    }
    if (session?.browser) {
        try { await session.browser.close(); } catch (_) {}
    }
    // We intentionally do not kill spawned servers here so that subsequent runs reuse them.
    // Callers can shut them down via process.kill(ctx.spawned.pid) if needed.
}

async function applySeed(page, seed) {
    return page.evaluate(s => window.papilionemHarness.applySeed(s), seed);
}

async function spawnTo(page, count, options = {}) {
    return page.evaluate(({ n, opts }) => window.papilionemHarness.spawnTo(n, opts), { n: count, opts: options });
}

async function spawnFlowersTo(page, count, options = {}) {
    return page.evaluate(({ n, opts }) => window.papilionemHarness.spawnFlowersTo(n, opts), { n: count, opts: options });
}

async function spawnBlocksTo(page, count, options = {}) {
    return page.evaluate(({ n, opts }) => window.papilionemHarness.spawnBlocksTo(n, opts), { n: count, opts: options });
}

async function forceZoneFocus(page, zoneId, options = {}) {
    return page.evaluate(({ id, opts }) => window.papilionemHarness.forceZoneFocus(id, opts), { id: zoneId, opts: options });
}

async function scatterButterflies(page, options = {}) {
    return page.evaluate(opts => window.papilionemHarness.scatterButterflies(opts), options);
}

async function tick(page, frames) {
    return page.evaluate(n => window.papilionemHarness.tick(n), frames);
}

async function snapshot(page) {
    return page.evaluate(() => window.papilionemHarness.snapshot());
}

async function startCapture(page, label) {
    return page.evaluate(l => window.papilionemHarness.startCapture(l), label);
}

async function buildCaptureExport(page) {
    return page.evaluate(() => window.papilionemHarness.buildCaptureExport({ source: 'harness-bench' }));
}

async function finishCapture(page) {
    return page.evaluate(() => window.papilionemHarness.finishCapture());
}

async function getButterflyCount(page) {
    return page.evaluate(() => window.papilionemHarness.getButterflyCount());
}

async function getEntityCounts(page) {
    return page.evaluate(() => {
        const core = (typeof gameCore !== 'undefined') ? gameCore : null;
        return {
            butterflies: core?.gameState?.butterflies?.length || 0,
            flowers: core?.gameState?.flowers?.length || 0,
            blocks: core?.gameState?.blocks?.length || 0,
            focusedZoneId: core?.getFocusedZoneId?.() || null,
            viewMode: core?.gameState?.viewMode || null
        };
    });
}

async function runScenario({
    page,
    seed = 1,
    butterflyCount = 50,
    flowerCount = null,
    blockCount = null,
    focusZoneId = null,
    viewMode = 'focused-garden',
    scatterButterfliesAcrossZone = false,
    disableAutoHabitatTravel = false,
    warmupFrames = 30,
    captureFrames = 600,
    label = 'bench-scenario',
    onCaptureStart = null,
    onCaptureEnd = null
}) {
    await applySeed(page, seed);
    if (disableAutoHabitatTravel) {
        await page.evaluate(() => {
            if (typeof gameConfig !== 'undefined') {
                gameConfig.balance = gameConfig.balance || {};
                gameConfig.balance.migration = gameConfig.balance.migration || {};
                gameConfig.balance.migration.autoHabitatTravel = false;
            }
        });
    }
    let focusResult = null;
    if (focusZoneId) {
        focusResult = await forceZoneFocus(page, focusZoneId, { mode: viewMode });
    }
    const spawnZoneId = focusZoneId || null;
    const spawnResult = await spawnTo(page, butterflyCount, spawnZoneId ? { zoneId: spawnZoneId } : {});
    let flowerSpawn = null;
    if (Number.isFinite(flowerCount) && flowerCount > 0) {
        flowerSpawn = await spawnFlowersTo(page, flowerCount, spawnZoneId ? { zoneId: spawnZoneId } : {});
    }
    let blockSpawn = null;
    if (Number.isFinite(blockCount) && blockCount > 0) {
        blockSpawn = await spawnBlocksTo(page, blockCount, spawnZoneId ? { zoneId: spawnZoneId } : {});
    }
    let scatterResult = null;
    if (spawnZoneId && scatterButterfliesAcrossZone) {
        scatterResult = await scatterButterflies(page, { zoneId: spawnZoneId });
    }
    if (warmupFrames > 0) {
        await tick(page, warmupFrames);
    }
    if (onCaptureStart) await onCaptureStart();
    await startCapture(page, label);
    const tickStart = Date.now();
    const tickResult = await tick(page, captureFrames);
    const wallElapsedMs = Date.now() - tickStart;
    if (onCaptureEnd) await onCaptureEnd();
    const capture = await buildCaptureExport(page);
    await finishCapture(page);
    const finalCount = await getButterflyCount(page);
    const finalCounts = await getEntityCounts(page);
    return {
        scenario: { seed, butterflyCount, flowerCount, blockCount, focusZoneId, viewMode, scatterButterfliesAcrossZone, disableAutoHabitatTravel, warmupFrames, captureFrames, label },
        focus: focusResult,
        spawn: spawnResult,
        flowerSpawn,
        blockSpawn,
        scatter: scatterResult,
        butterflies: { final: finalCount },
        entities: finalCounts,
        tick: { ...tickResult, wallElapsedMs },
        capture
    };
}

// Flatten nested numeric fields with dotted keys. Skips non-numeric values and arrays.
function flattenNumbers(obj, prefix = '', out = {}) {
    if (!obj || typeof obj !== 'object') return out;
    for (const k of Object.keys(obj)) {
        const v = obj[k];
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'number' && Number.isFinite(v)) {
            out[key] = v;
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
            flattenNumbers(v, key, out);
        }
    }
    return out;
}

function summarizeCapture(capture) {
    if (!capture) return null;
    const summary = capture.summary || {};
    const telemetry = capture.telemetry || {};
    const averages = telemetry.averages || {};
    const memory = telemetry.memoryAttribution || telemetry.memory?.attribution || null;
    const heap = capture.heapSamples || [];
    const peakHeap = heap.reduce((max, s) => Math.max(max, Number(s?.usedMB || 0)), 0);
    const frameTimes = Array.isArray(capture.frameTimes) ? capture.frameTimes : [];
    const sortedFrames = frameTimes.slice().sort((a, b) => a - b);
    const meanFrameMs = sortedFrames.length
        ? sortedFrames.reduce((s, v) => s + v, 0) / sortedFrames.length
        : null;
    const maxFrameMsComputed = sortedFrames.length ? sortedFrames[sortedFrames.length - 1] : null;
    const minFrameMsComputed = sortedFrames.length ? sortedFrames[0] : null;
    const breakdown = flattenNumbers(telemetry.breakdowns || {});
    return {
        version: capture.version,
        durationMs: summary.durationMs,
        frameCount: summary.frameCount ?? frameTimes.length,
        butterflyCount: summary.butterflyCount,
        p50FrameMs: summary.p50FrameMs,
        p95FrameMs: summary.p95FrameMs,
        p99FrameMs: summary.p99FrameMs,
        maxFrameMs: summary.maxFrameMs ?? maxFrameMsComputed,
        minFrameMs: minFrameMsComputed,
        meanFrameMs,
        avgUpdateMs: averages.updateMs,
        avgRenderMs: averages.renderMs,
        avgParticleRenderMs: averages.particleRenderMs,
        peakHeapMB: Number(peakHeap.toFixed(2)),
        currentHeapMB: memory?.currentHeapUsedMB ?? null,
        renderEstMB: memory?.render?.totalEstimatedMB ?? null,
        spriteCacheEntries: memory?.spriteCache?.entryCount ?? null,
        spriteCacheEvictions: memory?.spriteCache?.evictions ?? null,
        spriteCacheHits: memory?.spriteCache?.cacheHits ?? null,
        spriteCacheMisses: memory?.spriteCache?.cacheMisses ?? null,
        frameTimesCount: frameTimes.length,
        frameTimesDroppedCount: capture.frameTimesDroppedCount || 0,
        breakdown
    };
}

function persistDigest({ outputDir, label, scenario, summary, frameTimes, raw }) {
    ensureDir(outputDir);
    const digestPath = path.join(outputDir, `${label}.json`);
    const digest = {
        label,
        capturedAt: new Date().toISOString(),
        scenario,
        summary,
        frameTimes
    };
    fs.writeFileSync(digestPath, JSON.stringify(digest, null, 2), 'utf8');
    let rawPath = null;
    if (raw) {
        rawPath = path.join(outputDir, `${label}.raw.json`);
        fs.writeFileSync(rawPath, JSON.stringify(raw, null, 2), 'utf8');
    }
    return { digestPath, rawPath };
}

// Open a CDP session, start the V8 sampling profiler, and return start/stop hooks
// suitable for runScenario's onCaptureStart/onCaptureEnd. The profile is written
// as a Chrome DevTools .cpuprofile file when stop() runs.
async function attachCpuProfiler({ page, profilePath, samplingIntervalMicros = 500 }) {
    const client = await page.context().newCDPSession(page);
    let started = false;
    const start = async () => {
        await client.send('Profiler.enable');
        await client.send('Profiler.setSamplingInterval', { interval: samplingIntervalMicros });
        await client.send('Profiler.start');
        started = true;
    };
    const stop = async () => {
        if (!started) return null;
        const { profile } = await client.send('Profiler.stop');
        await client.send('Profiler.disable');
        ensureDir(path.dirname(profilePath));
        fs.writeFileSync(profilePath, JSON.stringify(profile), 'utf8');
        return profilePath;
    };
    return { start, stop, samplingIntervalMicros };
}

module.exports = {
    ROOT,
    ensureDir,
    stamp,
    ensureServer,
    launchHarness,
    closeHarness,
    applySeed,
    spawnTo,
    spawnFlowersTo,
    spawnBlocksTo,
    forceZoneFocus,
    scatterButterflies,
    tick,
    snapshot,
    startCapture,
    buildCaptureExport,
    finishCapture,
    getButterflyCount,
    getEntityCounts,
    runScenario,
    summarizeCapture,
    persistDigest,
    attachCpuProfiler,
    flattenNumbers
};
