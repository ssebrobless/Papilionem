const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_CAPTURE_ROOT = path.join(__dirname, 'qa_logs', 'session_captures');
const SAVE_EXPORT_ROOT = path.join(__dirname, 'qa_logs', 'save_exports');

app.use(express.json({ limit: '16mb' }));

function getBaseUrl() {
    if (process.env.RAILWAY_STATIC_URL) {
        return process.env.RAILWAY_STATIC_URL;
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    return `http://127.0.0.1:${PORT}`;
}

function getLanUrls(port) {
    const interfaces = os.networkInterfaces();
    const urls = [];

    for (const entries of Object.values(interfaces)) {
        for (const entry of entries || []) {
            if (!entry || entry.internal || entry.family !== 'IPv4') {
                continue;
            }
            urls.push(`http://${entry.address}:${port}`);
        }
    }

    return [...new Set(urls)];
}

const BASE_URL = getBaseUrl();

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function stampForPath(date = new Date()) {
    return date.toISOString().replace(/[:.]/g, '-');
}

function safeSegment(value, fallback = 'capture') {
    const safe = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64);
    return safe || fallback;
}

function buildCaptureSummary(payload = {}) {
    const session = payload.session || {};
    const summary = payload.summary || {};
    const telemetry = payload.telemetry || {};
    const attribution = telemetry.attribution || {};
    const memoryAttribution = telemetry.memoryAttribution || {};
    const summarySpriteCache = {
        entryCount: summary.spriteCacheEntryCount,
        maxEntries: summary.spriteCacheMaxEntries,
        estimatedSurfaceMB: summary.spriteCacheEstimatedSurfaceMB,
        cacheHits: summary.spriteCacheCacheHits,
        cacheMisses: summary.spriteCacheCacheMisses,
        topFamilies: summary.spriteCacheTopFamilies
    };
    const spriteCache = memoryAttribution.spriteCache || summarySpriteCache;
    const startState = payload.startState || {};
    const endState = payload.endState || {};
    const eventCounts = summary.eventCounts || {};
    const issues = Array.isArray(payload.runtimeIssues) ? payload.runtimeIssues : [];
    const timeline = Array.isArray(payload.timeline) ? payload.timeline : [];
    const eventHistory = Array.isArray(payload.eventHistory) ? payload.eventHistory : [];
    const replayMarkers = Array.isArray(payload.replayMarkers) ? payload.replayMarkers : [];

    return {
        sessionId: session.sessionId || null,
        label: session.label || 'session-capture',
        startedAt: session.startedAt || null,
        stoppedAt: session.stoppedAt || null,
        durationMs: Number.isFinite(summary.durationMs) ? summary.durationMs : 0,
        totalTimelineEntries: timeline.length,
        totalEventHistoryEntries: eventHistory.length,
        replayMarkerCount: replayMarkers.length,
        runtimeIssueCount: issues.length,
        errorRuntimeIssueCount: Number(summary.errorRuntimeIssueCount || 0),
        warningRuntimeIssueCount: Number(summary.warningRuntimeIssueCount || 0),
        runtimeIssueKinds: summary.runtimeIssueKinds || {},
        errorCount: eventCounts.error || 0,
        warningCount: eventCounts.warning || 0,
        telemetryWarningCount: eventCounts.telemetry_warning || 0,
        freezeSuspectCount: eventCounts.freeze_suspect || 0,
        spikeCount: eventCounts.spike || 0,
        snapshotCount: eventCounts.snapshot || 0,
        maxUpdateMs: summary.maxUpdateMs || 0,
        maxRenderMs: summary.maxRenderMs || 0,
        maxParticleCount: summary.maxParticleCount || 0,
        p50FrameMs: summary.p50FrameMs || 0,
        p95FrameMs: summary.p95FrameMs || 0,
        p99FrameMs: summary.p99FrameMs || 0,
        compositeCallsPerFrame: summary.compositeCallsPerFrame || 0,
        uiRedrawCount: summary.uiRedrawCount || 0,
        debugRedrawCount: summary.debugRedrawCount || 0,
        timelineDroppedCount: summary.timelineDroppedCount || 0,
        frameTimesDroppedCount: summary.frameTimesDroppedCount || 0,
        runtimeIssuesDroppedCount: summary.runtimeIssuesDroppedCount || 0,
        eventHistoryDroppedCount: payload.eventHistoryDroppedCount || 0,
        heapSampleCount: summary.heapSampleCount || 0,
        peakHeapUsedMB: summary.peakHeapUsedMB || 0,
        heapMilestones: summary.heapMilestones || {},
        avgUpdateMs: telemetry.averages?.updateMs || 0,
        avgRenderMs: telemetry.averages?.renderMs || 0,
        avgParticleRenderMs: telemetry.averages?.particleRenderMs || 0,
        pressureTier: telemetry.pressure?.tier || 'unknown',
        lagCategory: attribution.category || 'unknown',
        lagSummary: attribution.summaryLine || null,
        shellSummary: attribution.shellSummary || null,
        spriteCacheEntryCount: Number(spriteCache.entryCount || 0),
        spriteCacheMaxEntries: Number(spriteCache.maxEntries || 0),
        spriteCacheEstimatedSurfaceMB: Number(spriteCache.estimatedSurfaceMB || 0),
        spriteCacheCacheHits: Number(spriteCache.cacheHits || 0),
        spriteCacheCacheMisses: Number(spriteCache.cacheMisses || 0),
        spriteCacheTopFamilies: Array.isArray(spriteCache.topFamilies)
            ? spriteCache.topFamilies.slice(0, 4)
            : [],
        topUpdateContributors: Array.isArray(attribution.topUpdateContributors)
            ? attribution.topUpdateContributors.slice(0, 4)
            : [],
        topRenderContributors: Array.isArray(attribution.topRenderContributors)
            ? attribution.topRenderContributors.slice(0, 4)
            : [],
        startViewMode: startState.viewMode || null,
        endViewMode: endState.viewMode || null,
        startZoneId: startState.focusedZoneId || null,
        endZoneId: endState.focusedZoneId || null,
        startButterflies: startState.butterflyCount || 0,
        endButterflies: endState.butterflyCount || 0,
        startBlocks: startState.blockCount || 0,
        endBlocks: endState.blockCount || 0
    };
}

function buildCaptureSummaryText(summary = {}, paths = {}) {
    const formatContributors = entries => {
        if (!Array.isArray(entries) || !entries.length) return 'none';
        return entries
            .map(entry => `${entry.label} ${Number(entry.ms || 0).toFixed(2)}ms`)
            .join(' | ');
    };
    const formatSpriteFamilies = entries => {
        if (!Array.isArray(entries) || !entries.length) return 'none';
        return entries
            .map(entry => `${entry.family} ${Number(entry.entryCount || 0)}/${Number(entry.estimatedSurfaceMB || 0).toFixed(1)}MB`)
            .join(' | ');
    };

    return [
        'Papilionem Session Capture',
        `session: ${summary.sessionId || 'unknown'}`,
        `label: ${summary.label || 'session-capture'}`,
        `started: ${summary.startedAt || 'unknown'}`,
        `stopped: ${summary.stoppedAt || 'unknown'}`,
        `durationMs: ${summary.durationMs || 0}`,
        '',
        'Runtime',
        `pressureTier: ${summary.pressureTier || 'unknown'}`,
        `lagCategory: ${summary.lagCategory || 'unknown'}`,
        `avgUpdateMs: ${Number(summary.avgUpdateMs || 0).toFixed(2)}`,
        `avgRenderMs: ${Number(summary.avgRenderMs || 0).toFixed(2)}`,
        `avgParticleRenderMs: ${Number(summary.avgParticleRenderMs || 0).toFixed(2)}`,
        `p50FrameMs: ${Number(summary.p50FrameMs || 0).toFixed(2)}`,
        `p95FrameMs: ${Number(summary.p95FrameMs || 0).toFixed(2)}`,
        `p99FrameMs: ${Number(summary.p99FrameMs || 0).toFixed(2)}`,
        `maxUpdateMs: ${Number(summary.maxUpdateMs || 0).toFixed(2)}`,
        `maxRenderMs: ${Number(summary.maxRenderMs || 0).toFixed(2)}`,
        `maxParticleCount: ${summary.maxParticleCount || 0}`,
        `compositeCallsPerFrame: ${Number(summary.compositeCallsPerFrame || 0).toFixed(2)}`,
        `uiRedrawCount: ${summary.uiRedrawCount || 0}`,
        `debugRedrawCount: ${summary.debugRedrawCount || 0}`,
        `timelineDroppedCount: ${summary.timelineDroppedCount || 0}`,
        `frameTimesDroppedCount: ${summary.frameTimesDroppedCount || 0}`,
        `runtimeIssuesDroppedCount: ${summary.runtimeIssuesDroppedCount || 0}`,
        `eventHistoryDroppedCount: ${summary.eventHistoryDroppedCount || 0}`,
        `heapSampleCount: ${summary.heapSampleCount || 0}`,
        `peakHeapUsedMB: ${Number(summary.peakHeapUsedMB || 0).toFixed(2)}`,
        `heap@10sMB: ${Number(summary.heapMilestones?.tenSeconds?.usedMB || 0).toFixed(2)}`,
        `heap@60sMB: ${Number(summary.heapMilestones?.sixtySeconds?.usedMB || 0).toFixed(2)}`,
        `heap@10mMB: ${Number(summary.heapMilestones?.tenMinutes?.usedMB || 0).toFixed(2)}`,
        `heap@20mMB: ${Number(summary.heapMilestones?.twentyMinutes?.usedMB || 0).toFixed(2)}`,
        `heap@40mMB: ${Number(summary.heapMilestones?.fortyMinutes?.usedMB || 0).toFixed(2)}`,
        `spriteCache: ${summary.spriteCacheEntryCount || 0}/${summary.spriteCacheMaxEntries || 0} | est ${Number(summary.spriteCacheEstimatedSurfaceMB || 0).toFixed(2)}MB | hits ${summary.spriteCacheCacheHits || 0}/${summary.spriteCacheCacheMisses || 0}`,
        `spriteTop: ${formatSpriteFamilies(summary.spriteCacheTopFamilies)}`,
        `shell: ${summary.shellSummary || 'unknown'}`,
        `lagSummary: ${summary.lagSummary || 'n/a'}`,
        `topUpdate: ${formatContributors(summary.topUpdateContributors)}`,
        `topRender: ${formatContributors(summary.topRenderContributors)}`,
        '',
        'Counts',
        `timelineEntries: ${summary.totalTimelineEntries || 0}`,
        `eventHistoryEntries: ${summary.totalEventHistoryEntries || 0}`,
        `replayMarkers: ${summary.replayMarkerCount || 0}`,
        `runtimeIssues: ${summary.runtimeIssueCount || 0}`,
        `runtimeIssueErrors: ${summary.errorRuntimeIssueCount || 0}`,
        `runtimeIssueWarnings: ${summary.warningRuntimeIssueCount || 0}`,
        `errors: ${summary.errorCount || 0}`,
        `warnings: ${summary.warningCount || 0}`,
        `telemetryWarnings: ${summary.telemetryWarningCount || 0}`,
        `freezeSuspects: ${summary.freezeSuspectCount || 0}`,
        `spikes: ${summary.spikeCount || 0}`,
        `snapshots: ${summary.snapshotCount || 0}`,
        '',
        'State',
        `start: ${summary.startViewMode || 'unknown'} | ${summary.startZoneId || 'none'} | butterflies ${summary.startButterflies || 0} | blocks ${summary.startBlocks || 0}`,
        `end: ${summary.endViewMode || 'unknown'} | ${summary.endZoneId || 'none'} | butterflies ${summary.endButterflies || 0} | blocks ${summary.endBlocks || 0}`,
        '',
        'Files',
        `capture: ${paths.capturePath || 'n/a'}`,
        `summary: ${paths.summaryPath || 'n/a'}`
    ].join('\n');
}

function buildSaveExportSummary(payload = {}) {
    const serialized = payload.serializedState || {};
    const meta = serialized.meta || {};
    const progression = serialized.progression || {};
    const foundations = serialized.foundations || {};
    const zonesById = foundations?.zones?.zonesById || {};
    const unlockedButterflyTypes = progression.unlockedButterflyTypes;
    const saveJson = JSON.stringify(serialized);

    return {
        label: payload.label || 'save-export',
        version: serialized.version || null,
        serializedAtMs: meta.serializedAtMs || null,
        focusedZoneId: meta.focusedZoneId || null,
        viewMode: meta.viewMode || 'focused-garden',
        butterflyCount: Array.isArray(serialized.butterflies) ? serialized.butterflies.length : 0,
        flowerCount: Array.isArray(serialized.flowers) ? serialized.flowers.length : 0,
        caterpillarCount: Array.isArray(serialized.caterpillars) ? serialized.caterpillars.length : 0,
        blockCount: Array.isArray(serialized.blocks) ? serialized.blocks.length : 0,
        hybridJournalCount: Array.isArray(progression.hybridJournal) ? progression.hybridJournal.length : 0,
        unlockedButterflyTypeCount: Array.isArray(unlockedButterflyTypes)
            ? unlockedButterflyTypes.length
            : Object.keys(unlockedButterflyTypes || {}).length,
        zoneCount: Object.keys(zonesById || {}).length,
        sizeBytes: Buffer.byteLength(saveJson, 'utf8')
    };
}

function buildSaveExportSummaryText(summary = {}, paths = {}) {
    return [
        'Papilionem Save Export',
        `label: ${summary.label || 'save-export'}`,
        `version: ${summary.version || 'unknown'}`,
        `serializedAtMs: ${summary.serializedAtMs || 'unknown'}`,
        '',
        'State',
        `focusedZoneId: ${summary.focusedZoneId || 'none'}`,
        `viewMode: ${summary.viewMode || 'focused-garden'}`,
        `butterflies: ${summary.butterflyCount || 0}`,
        `flowers: ${summary.flowerCount || 0}`,
        `caterpillars: ${summary.caterpillarCount || 0}`,
        `blocks: ${summary.blockCount || 0}`,
        `hybridJournal: ${summary.hybridJournalCount || 0}`,
        `unlockedButterflyTypes: ${summary.unlockedButterflyTypeCount || 0}`,
        `zones: ${summary.zoneCount || 0}`,
        `sizeBytes: ${summary.sizeBytes || 0}`,
        '',
        'Files',
        `save: ${paths.savePath || 'n/a'}`,
        `summary: ${paths.summaryPath || 'n/a'}`
    ].join('\n');
}

app.use(express.static('.', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    },
    index: false
}));

app.get('/', (_req, res) => {
    serveDynamicHtml(res);
});

app.get('/api/runtime-capabilities', (_req, res) => {
    res.json({
        ok: true,
        sessionCaptureExport: true,
        saveExport: true
    });
});

app.post('/api/session-captures', (req, res) => {
    try {
        const payload = req.body && typeof req.body === 'object' ? req.body : null;
        if (!payload) {
            return res.status(400).json({ ok: false, error: 'Missing capture payload' });
        }

        const sessionId = safeSegment(payload?.session?.sessionId, `capture-${stampForPath()}`);
        const label = safeSegment(payload?.session?.label, 'session');
        const directoryName = `${stampForPath()}-${label}-${sessionId}`;
        const outputDir = path.join(SESSION_CAPTURE_ROOT, directoryName);
        ensureDir(outputDir);

        const capturePath = path.join(outputDir, 'capture.json');
        const summaryPath = path.join(outputDir, 'summary.txt');
        const summary = buildCaptureSummary(payload);

        fs.writeFileSync(capturePath, JSON.stringify(payload, null, 2), 'utf8');
        fs.writeFileSync(
            summaryPath,
            buildCaptureSummaryText(summary, { capturePath, summaryPath }),
            'utf8'
        );

        return res.json({
            ok: true,
            outputDir,
            capturePath,
            summaryPath,
            summary
        });
    } catch (error) {
        console.error('Failed to persist session capture:', error);
        return res.status(500).json({
            ok: false,
            error: error?.message || String(error)
        });
    }
});

app.post('/api/save-exports', (req, res) => {
    try {
        const payload = req.body && typeof req.body === 'object' ? req.body : null;
        const serializedState = payload?.serializedState && typeof payload.serializedState === 'object'
            ? payload.serializedState
            : null;
        if (!serializedState) {
            return res.status(400).json({ ok: false, error: 'Missing serializedState payload' });
        }

        const label = safeSegment(payload?.label, 'save');
        const directoryName = `${stampForPath()}-${label}`;
        const outputDir = path.join(SAVE_EXPORT_ROOT, directoryName);
        ensureDir(outputDir);

        const savePath = path.join(outputDir, 'save.json');
        const summaryPath = path.join(outputDir, 'summary.txt');
        const summary = buildSaveExportSummary({
            ...payload,
            label,
            serializedState
        });

        fs.writeFileSync(savePath, JSON.stringify(serializedState, null, 2), 'utf8');
        fs.writeFileSync(
            summaryPath,
            buildSaveExportSummaryText(summary, { savePath, summaryPath }),
            'utf8'
        );

        return res.json({
            ok: true,
            outputDir,
            savePath,
            summaryPath,
            summary
        });
    } catch (error) {
        console.error('Failed to persist save export:', error);
        return res.status(500).json({
            ok: false,
            error: error?.message || String(error)
        });
    }
});

app.get('*', (req, res) => {
    const filePath = path.join(__dirname, req.path);
    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        return res.status(404).send('File not found');
    }
    serveDynamicHtml(res);
});

function serveDynamicHtml(res) {
    try {
        const htmlPath = path.join(__dirname, 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        html = html
            .replace(/content="preview\.png"/g, `content="${BASE_URL}/preview.png"`)
            .replace(/href="preview\.png"/g, 'href="preview.png"');

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).send('Error loading page');
    }
}

app.listen(PORT, () => {
    const lanUrls = getLanUrls(PORT);
    console.log(`Papilionem server listening on port ${PORT}`);
    console.log(`Host URL: http://127.0.0.1:${PORT}`);
    if (lanUrls.length > 0) {
        console.log('LAN URLs:');
        lanUrls.forEach(url => console.log(`- ${url}`));
    }
    console.log(`Preview image URL: ${BASE_URL}/preview.png`);
});

process.on('SIGTERM', () => {
    console.log('Papilionem server shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Papilionem server shutting down...');
    process.exit(0);
});
