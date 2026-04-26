class TelemetrySystem {
    constructor() {
        this.initialized = false;
        this.consoleHooksAttached = false;
        this.runtimeListenersAttached = false;
        this.originalConsoleWarn = null;
        this.originalConsoleError = null;
        this.reset();
    }

    initialize() {
        this.initialized = true;
        this.attachRuntimeCaptureHooks();
    }

    reset() {
        this.lastUpdateSample = null;
        this.lastRenderSample = null;
        this.lastEcologySample = null;
        this.lastPressureProfile = null;
        this.lastEcologyProfile = null;
        this.lastMlCorpusProfile = null;
        this.lastMlRuntimeProfile = null;
        this.recentUpdateSamples = [];
        this.recentRenderSamples = [];
        this.recentEcologySamples = [];
        this.recentMlCorpusSamples = [];
        this.recentMlRuntimeSamples = [];
        this.maxSamples = 120;
        this.ecologyMaxSamples = 90;
        this.mlCorpusMaxSamples = 240;
        this.mlRuntimeMaxSamples = 240;
        this.freezeSuspectMaxEntries = 16;
        this.sessionCapture = {
            active: false,
            sessionId: null,
            label: 'session-capture',
            startedAtMs: null,
            stoppedAtMs: null,
            output: null,
            archivedSummary: null,
            timeline: [],
            freezeSuspects: [],
            runtimeIssues: [],
            frameTimes: [],
            heapSamples: [],
            renderSampleCount: 0,
            compositeCallsTotal: 0,
            uiRedrawCount: 0,
            debugRedrawCount: 0,
            timelineDroppedCount: 0,
            frameTimesDroppedCount: 0,
            runtimeIssuesDroppedCount: 0,
            lastSnapshotAtMs: 0,
            lastUpdateSpikeAtMs: 0,
            lastRenderSpikeAtMs: 0,
            eventCounts: {},
            startState: null,
            endState: null
        };
    }

    attachRuntimeCaptureHooks() {
        if (typeof window !== 'undefined' && !this.runtimeListenersAttached) {
            window.addEventListener('error', event => {
                this.recordRuntimeIssue('window-error', {
                    message: event?.message || event?.error?.message || 'window error',
                    fileName: event?.filename || null,
                    lineNumber: event?.lineno || null,
                    columnNumber: event?.colno || null,
                    stack: event?.error?.stack || null
                });
            });

            window.addEventListener('unhandledrejection', event => {
                const reason = event?.reason;
                this.recordRuntimeIssue('unhandled-rejection', {
                    message: reason?.message || String(reason || 'unhandled rejection'),
                    stack: reason?.stack || null
                });
            });

            this.runtimeListenersAttached = true;
        }

        if (typeof console !== 'undefined' && !this.consoleHooksAttached) {
            this.originalConsoleWarn = typeof console.warn === 'function' ? console.warn.bind(console) : null;
            this.originalConsoleError = typeof console.error === 'function' ? console.error.bind(console) : null;

            if (this.originalConsoleWarn) {
                console.warn = (...args) => {
                    this.recordRuntimeConsole('warn', args);
                    this.originalConsoleWarn(...args);
                };
            }

            if (this.originalConsoleError) {
                console.error = (...args) => {
                    this.recordRuntimeConsole('error', args);
                    this.originalConsoleError(...args);
                };
            }

            this.consoleHooksAttached = true;
        }
    }

    pushSample(bucket, sample) {
        bucket.push(sample);
        if (bucket.length > this.maxSamples) {
            bucket.shift();
        }
    }

    getAverage(samples, key) {
        if (!samples.length) return 0;
        const total = samples.reduce((sum, sample) => sum + (sample?.[key] || 0), 0);
        return total / samples.length;
    }

    getPercentile(values = [], percentile = 0.5) {
        if (!Array.isArray(values) || !values.length) return 0;
        const numericValues = values
            .map(value => Number(value))
            .filter(value => Number.isFinite(value))
            .sort((left, right) => left - right);
        if (!numericValues.length) return 0;
        const normalizedPercentile = Math.max(0, Math.min(1, Number(percentile) || 0));
        const index = Math.min(
            numericValues.length - 1,
            Math.max(0, Math.round((numericValues.length - 1) * normalizedPercentile))
        );
        return numericValues[index];
    }

    buildRecentFrameValues() {
        const frameCount = Math.min(this.recentUpdateSamples.length, this.recentRenderSamples.length);
        const frameValues = [];
        for (let index = 0; index < frameCount; index += 1) {
            const updateMs = Number(this.recentUpdateSamples[index]?.totalUpdateMs || 0);
            const renderMs = Number(this.recentRenderSamples[index]?.totalRenderMs || 0);
            frameValues.push(updateMs + renderMs);
        }
        return frameValues;
    }

    getHeapUsageSample(atMs = Date.now()) {
        const memory = typeof performance !== 'undefined' ? performance.memory : null;
        const usedBytes = Number(memory?.usedJSHeapSize || 0);
        const totalBytes = Number(memory?.totalJSHeapSize || 0);
        if (!Number.isFinite(usedBytes) || usedBytes <= 0) {
            return null;
        }
        return {
            atMs,
            usedBytes,
            usedMB: usedBytes / (1024 * 1024),
            totalBytes: Number.isFinite(totalBytes) && totalBytes > 0 ? totalBytes : null,
            totalMB: Number.isFinite(totalBytes) && totalBytes > 0 ? (totalBytes / (1024 * 1024)) : null
        };
    }

    captureHeapSample(atMs = Date.now(), options = {}) {
        const capture = this.sessionCapture || {};
        if (!capture.active && !options.force) return null;
        const sample = this.getHeapUsageSample(atMs);
        if (!sample) return null;
        capture.heapSamples = Array.isArray(capture.heapSamples) ? capture.heapSamples : [];
        const lastSample = capture.heapSamples[capture.heapSamples.length - 1] || null;
        if (!options.force && lastSample && Math.abs(sample.atMs - lastSample.atMs) < 900) {
            return null;
        }
        capture.heapSamples.push(sample);
        while (capture.heapSamples.length > 720) {
            capture.heapSamples.shift();
        }
        return this.cloneJson(sample, null);
    }

    buildHeapMilestones(samples = [], startedAtMs = null) {
        const milestones = {
            tenSeconds: null,
            sixtySeconds: null,
            tenMinutes: null,
            twentyMinutes: null,
            fortyMinutes: null
        };
        if (!Array.isArray(samples) || !samples.length || !Number.isFinite(startedAtMs)) {
            return milestones;
        }

        const targets = [
            ['tenSeconds', 10 * 1000],
            ['sixtySeconds', 60 * 1000],
            ['tenMinutes', 10 * 60 * 1000],
            ['twentyMinutes', 20 * 60 * 1000],
            ['fortyMinutes', 40 * 60 * 1000]
        ];

        for (const [label, offsetMs] of targets) {
            const targetAtMs = startedAtMs + offsetMs;
            const sample = samples.find(entry => Number(entry?.atMs || 0) >= targetAtMs) || null;
            milestones[label] = sample
                ? {
                    atMs: sample.atMs,
                    usedMB: Number(sample.usedMB || 0),
                    totalMB: Number(sample.totalMB || 0) || null
                }
                : null;
        }

        return milestones;
    }

    cloneJson(value, fallback = null) {
        try {
            const seen = new WeakSet();
            return JSON.parse(JSON.stringify(value ?? fallback, (_key, current) => {
                if (typeof current === 'function') return undefined;
                if (current && typeof current === 'object') {
                    if (seen.has(current)) return '[circular]';
                    seen.add(current);
                }
                return current;
            }));
        } catch (_error) {
            return fallback;
        }
    }

    getCollectionCount(value) {
        if (Array.isArray(value)) return value.length;
        if (value instanceof Map || value instanceof Set) return value.size;
        if (value && typeof value.length === 'number') return Number(value.length) || 0;
        return 0;
    }

    estimateSurfaceMb(surface, options = {}) {
        const width = Number(surface?.width || 0);
        const height = Number(surface?.height || 0);
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            return 0;
        }

        let density = 1;
        if (options.includePixelDensity && typeof surface?.pixelDensity === 'function') {
            try {
                density = Number(surface.pixelDensity()) || 1;
            } catch (_error) {
                density = 1;
            }
        }

        const bytes = width * height * Math.max(1, density) * Math.max(1, density) * 4;
        return bytes / (1024 * 1024);
    }

    buildMemoryAttribution() {
        const enabled = this.getRuntimeFlag('memoryAttributionEnabled', false);
        if (!enabled) {
            return {
                enabled: false,
                summaryLines: []
            };
        }

        const runtimeRenderManager = typeof renderManager !== 'undefined' ? renderManager : null;
        const runtimeCommunicationSystem = typeof communicationSystem !== 'undefined' ? communicationSystem : null;
        const runtimeEventBus = typeof eventBus !== 'undefined' ? eventBus : null;
        const runtimeEffects = typeof specialEffects !== 'undefined' ? specialEffects : null;
        const runtimeGameUi = typeof gameUI !== 'undefined' ? gameUI : null;
        const runtimeDebugUi = typeof debugUI !== 'undefined' ? debugUI : null;
        const runtimeSpriteManager = typeof spriteManager !== 'undefined' ? spriteManager : null;
        const currentHeap = this.getHeapUsageSample();
        const capture = this.sessionCapture || {};
        const heapMilestones = this.buildHeapMilestones(capture.heapSamples || [], capture.startedAtMs || null);
        const tenMinuteHeapUsedMB = Number(heapMilestones.tenMinutes?.usedMB || 0) || null;
        const currentHeapUsedMB = Number(currentHeap?.usedMB || 0) || 0;
        const growthFactorFromTenMinutes = tenMinuteHeapUsedMB && currentHeapUsedMB
            ? currentHeapUsedMB / tenMinuteHeapUsedMB
            : null;

        const renderLayers = runtimeRenderManager?.layers || {};
        const atmosphereLayers = runtimeRenderManager?.atmosphereCacheLayers || {};
        const layerEntries = Object.values(renderLayers).filter(Boolean);
        const atmosphereEntries = Object.values(atmosphereLayers).filter(Boolean);
        const renderLayerBufferMB = layerEntries.reduce((sum, layer) => (
            sum + this.estimateSurfaceMb(layer, { includePixelDensity: true })
        ), 0);
        const atmosphereBufferMB = atmosphereEntries.reduce((sum, layer) => (
            sum + this.estimateSurfaceMb(layer, { includePixelDensity: true })
        ), 0);
        const uniqueWorldSectionAssets = new Set();
        for (const sectionAssets of runtimeRenderManager?.worldSectionAssets?.values?.() || []) {
            for (const asset of Object.values(sectionAssets || {})) {
                if (asset) uniqueWorldSectionAssets.add(asset);
            }
        }
        const worldSectionAssetMB = [...uniqueWorldSectionAssets].reduce((sum, asset) => (
            sum + this.estimateSurfaceMb(asset, { includePixelDensity: false })
        ), 0);

        const gameState = gameCore?.getGameState?.() || null;
        const liveCommunicationEntities = runtimeCommunicationSystem
            ? (runtimeCommunicationSystem.getLiveEntities?.(gameState) || [])
            : [];
        const communicationTotals = {
            registeredEntityCount: Number(runtimeCommunicationSystem?.entities?.size || 0),
            liveEntityCount: liveCommunicationEntities.length,
            historyCount: this.getCollectionCount(runtimeCommunicationSystem?.history),
            dialogueHistoryCount: this.getCollectionCount(runtimeCommunicationSystem?.dialogueHistory),
            recentEmittedCount: 0,
            recentReceivedCount: 0,
            recentConversationCount: 0,
            recentDialogueCount: 0,
            recentResidueCount: 0,
            retainedLessonCount: 0,
            pendingUtteranceCount: 0,
            edgeResidueCount: 0
        };
        for (const entity of liveCommunicationEntities) {
            const communication = entity?.lifeSim?.communication || {};
            communicationTotals.recentEmittedCount += this.getCollectionCount(communication.recentEmitted);
            communicationTotals.recentReceivedCount += this.getCollectionCount(communication.recentReceived);
            communicationTotals.recentConversationCount += this.getCollectionCount(communication.recentConversations);
            communicationTotals.recentDialogueCount += this.getCollectionCount(communication.recentDialogues);
            communicationTotals.recentResidueCount += this.getCollectionCount(communication.recentResidues);
            communicationTotals.retainedLessonCount += this.getCollectionCount(communication.retainedLessons);
            communicationTotals.pendingUtteranceCount += this.getCollectionCount(communication.pendingUtterances);
            const socialEdges = entity?.lifeSim?.socialEdges || {};
            for (const edge of Object.values(socialEdges)) {
                communicationTotals.edgeResidueCount += this.getCollectionCount(edge?.recentResidues);
            }
        }
        communicationTotals.totalRetainedEntries = communicationTotals.historyCount
            + communicationTotals.dialogueHistoryCount
            + communicationTotals.recentEmittedCount
            + communicationTotals.recentReceivedCount
            + communicationTotals.recentConversationCount
            + communicationTotals.recentDialogueCount
            + communicationTotals.recentResidueCount
            + communicationTotals.retainedLessonCount
            + communicationTotals.pendingUtteranceCount
            + communicationTotals.edgeResidueCount;

        const captureTimelineCount = this.getCollectionCount(capture.timeline);
        const captureFrameTimeCount = this.getCollectionCount(capture.frameTimes);
        const captureHeapSampleCount = this.getCollectionCount(capture.heapSamples);
        const captureRuntimeIssueCount = this.getCollectionCount(capture.runtimeIssues);
        const captureRetainedEntryCount = captureTimelineCount
            + captureFrameTimeCount
            + captureHeapSampleCount
            + captureRuntimeIssueCount;
        const captureRetentionState = capture.active
            ? 'active'
            : capture.archivedSummary
                ? 'archived'
                : captureRetainedEntryCount > 0
                    ? 'retained'
                    : 'idle';

        const eventHistoryCount = runtimeEventBus
            ? this.getCollectionCount(runtimeEventBus.getHistory?.())
            : 0;

        let heartCount = 0;
        let particleCount = 0;
        for (const effect of runtimeEffects?.activeEffects || []) {
            heartCount += this.getCollectionCount(effect?.hearts);
            particleCount += this.getCollectionCount(effect?.particles);
        }

        const uiCacheTotals = {
            gameUiLayoutCount: this.getCollectionCount(runtimeGameUi?.textLayoutCache),
            gameUiInspectMeasurementCount: this.getCollectionCount(runtimeGameUi?.inspectMeasurementCache),
            gameUiFeedMeasurementCount: this.getCollectionCount(runtimeGameUi?.feedMeasurementCache),
            debugUiLayoutCount: this.getCollectionCount(runtimeDebugUi?.textLayoutCache),
            butterflyCollectionLayoutCount: this.getCollectionCount(runtimeGameUi?.butterflyCollection?.textLayoutCache),
            butterflyCollectionMeasurementCount: this.getCollectionCount(runtimeGameUi?.butterflyCollection?.measurementCache)
        };
        uiCacheTotals.totalEntries = uiCacheTotals.gameUiLayoutCount
            + uiCacheTotals.gameUiInspectMeasurementCount
            + uiCacheTotals.gameUiFeedMeasurementCount
            + uiCacheTotals.debugUiLayoutCount
            + uiCacheTotals.butterflyCollectionLayoutCount
            + uiCacheTotals.butterflyCollectionMeasurementCount;
        const spriteCacheTotals = runtimeSpriteManager?.getBakedSpriteCacheTelemetry?.() || {
            enabled: false,
            entryCount: 0,
            maxEntries: 0,
            estimatedSurfaceMB: 0,
            cacheHits: 0,
            cacheMisses: 0,
            insertions: 0,
            evictions: 0,
            evictedEstimatedSurfaceMB: 0,
            families: [],
            topFamilies: []
        };
        const spriteCacheTopSummary = Array.isArray(spriteCacheTotals.topFamilies) && spriteCacheTotals.topFamilies.length
            ? spriteCacheTotals.topFamilies
                .slice(0, 3)
                .map(entry => `${entry.family} ${entry.entryCount}/${Number(entry.estimatedSurfaceMB || 0).toFixed(1)}MB`)
                .join(' | ')
            : 'none';

        const renderTotals = {
            layerCount: layerEntries.length,
            layerBufferMB: renderLayerBufferMB,
            atmosphereLayerCount: atmosphereEntries.length,
            atmosphereBufferMB,
            worldSectionAssetCount: uniqueWorldSectionAssets.size,
            worldSectionAssetMB,
            totalEstimatedMB: renderLayerBufferMB + atmosphereBufferMB + worldSectionAssetMB
        };

        const summaryLines = [
            `Heap ${currentHeapUsedMB.toFixed(1)}MB${growthFactorFromTenMinutes ? ` | 10m→now x${growthFactorFromTenMinutes.toFixed(2)}` : ''}`,
            `Render est ${renderTotals.totalEstimatedMB.toFixed(1)}MB | layers ${renderTotals.layerCount}+${renderTotals.atmosphereLayerCount} | assets ${renderTotals.worldSectionAssetCount}`,
            `Sprites ${spriteCacheTotals.entryCount}/${spriteCacheTotals.maxEntries} | est ${Number(spriteCacheTotals.estimatedSurfaceMB || 0).toFixed(1)}MB | hits ${spriteCacheTotals.cacheHits}/${spriteCacheTotals.cacheMisses} | top ${spriteCacheTopSummary}`,
            `Comm ${communicationTotals.totalRetainedEntries} retained | history ${communicationTotals.historyCount}/${communicationTotals.dialogueHistoryCount} | edge residues ${communicationTotals.edgeResidueCount}`,
            `Capture ${captureRetentionState} ${captureRetainedEntryCount} | events ${eventHistoryCount} | fx ${this.getCollectionCount(specialEffects?.activeEffects)}/${heartCount + particleCount} | ui cache ${uiCacheTotals.totalEntries}`
        ];

        return {
            enabled: true,
            currentHeapUsedMB,
            tenMinuteHeapUsedMB,
            growthFactorFromTenMinutes,
            render: renderTotals,
            communication: communicationTotals,
            telemetry: {
                recentUpdateSampleCount: this.recentUpdateSamples.length,
                recentRenderSampleCount: this.recentRenderSamples.length,
                recentEcologySampleCount: this.recentEcologySamples.length,
                recentMlCorpusSampleCount: this.recentMlCorpusSamples.length,
                recentMlRuntimeSampleCount: this.recentMlRuntimeSamples.length,
                eventHistoryCount
            },
            capture: {
                retentionState: captureRetentionState,
                hasOutput: !!capture.output?.capturePath,
                timelineCount: captureTimelineCount,
                frameTimeCount: captureFrameTimeCount,
                heapSampleCount: captureHeapSampleCount,
                runtimeIssueCount: captureRuntimeIssueCount,
                retainedEntryCount: captureRetainedEntryCount
            },
            effects: {
                activeEffectCount: this.getCollectionCount(runtimeEffects?.activeEffects),
                visibleEffectCount: Number(runtimeEffects?.getVisibleEffectCount?.() || 0),
                heartCount,
                particleCount,
                totalChildEffects: heartCount + particleCount
            },
            spriteCache: spriteCacheTotals,
            uiCaches: uiCacheTotals,
            summaryLines
        };
    }

    getRuntimeFlag(flagName, fallback = false) {
        const value = gameConfig?.performance?.flags?.[flagName];
        return typeof value === 'boolean' ? value : fallback;
    }

    getTelemetryLimit(key, fallback) {
        const configured = Number(gameConfig?.performance?.telemetry?.[key] || 0);
        return Math.max(1, configured || fallback);
    }

    resetRecentRuntimeWindow(reason = 'manual-reset') {
        this.lastUpdateSample = null;
        this.lastRenderSample = null;
        this.lastPressureProfile = null;
        this.recentUpdateSamples = [];
        this.recentRenderSamples = [];
        if (this.isSessionCaptureActive()) {
            this.recordSessionEvent('runtime', 'runtime-window-reset', { reason });
        }
    }

    normalizeBreakdownMap(map = {}) {
        const normalized = {};
        if (!map || typeof map !== 'object') return normalized;
        for (const [key, value] of Object.entries(map)) {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue)) continue;
            normalized[key] = numericValue;
        }
        return normalized;
    }

    mergeBreakdownMap(target = {}, map = {}, prefix = '') {
        const normalized = this.normalizeBreakdownMap(map);
        for (const [key, value] of Object.entries(normalized)) {
            target[prefix ? `${prefix}${key}` : key] = value;
        }
        return target;
    }

    computeAverageBreakdown(samples = [], key = '') {
        const totals = {};
        let count = 0;
        for (const sample of samples || []) {
            const breakdown = this.normalizeBreakdownMap(sample?.[key] || {});
            if (!Object.keys(breakdown).length) continue;
            count += 1;
            for (const [entryKey, value] of Object.entries(breakdown)) {
                totals[entryKey] = (totals[entryKey] || 0) + value;
            }
        }
        if (!count) return {};
        const averages = {};
        for (const [entryKey, value] of Object.entries(totals)) {
            averages[entryKey] = value / count;
        }
        return averages;
    }

    extractTopBreakdownEntries(map = {}, limit = 3) {
        return Object.entries(this.normalizeBreakdownMap(map))
            .filter(([, value]) => Number.isFinite(value) && value > 0.05)
            .sort((left, right) => right[1] - left[1])
            .slice(0, Math.max(0, limit))
            .map(([label, ms]) => ({
                label,
                ms
            }));
    }

    buildUpdateAttributionBreakdown(sample = {}) {
        const breakdown = {
            foundationMs: Number(sample.foundationMs || 0),
            entityMs: Number(sample.entityMs || 0),
            physicsMs: Number(sample.physicsMs || 0),
            particleUpdateMs: Number(sample.particleUpdateMs || 0),
            worldMs: Number(sample.worldMs || 0)
        };
        this.mergeBreakdownMap(breakdown, sample.foundationBreakdown || {}, 'foundation.');
        this.mergeBreakdownMap(breakdown, sample.entityBreakdown || {}, 'entity.');
        this.mergeBreakdownMap(breakdown, sample.worldBreakdown || {}, 'world.');
        return breakdown;
    }

    buildRenderAttributionBreakdown(sample = {}) {
        const renderBreakdown = sample.renderBreakdown || {};
        const compositeBreakdown = {
            ...(renderBreakdown.compositeBreakdown || {})
        };
        const extraRenderBreakdown = {
            ...renderBreakdown
        };
        delete compositeBreakdown.compositeCallCount;
        delete extraRenderBreakdown.compositeBreakdown;
        delete extraRenderBreakdown.recordedAtMs;
        delete extraRenderBreakdown.clearDynamicMs;
        delete extraRenderBreakdown.entityLayerMs;
        delete extraRenderBreakdown.particleLayerMs;
        delete extraRenderBreakdown.uiLayerMs;
        delete extraRenderBreakdown.debugLayerMs;
        delete extraRenderBreakdown.canvasClearMs;
        delete extraRenderBreakdown.compositeMs;
        delete extraRenderBreakdown.atmosphereCompositeMs;
        delete extraRenderBreakdown.compositeCallCount;
        delete extraRenderBreakdown.uiRedrawCount;
        delete extraRenderBreakdown.debugRedrawCount;
        delete extraRenderBreakdown.totalMeasuredMs;
        const breakdown = {
            clearDynamicMs: Number(renderBreakdown.clearDynamicMs || 0),
            entityLayerMs: Number(renderBreakdown.entityLayerMs || 0),
            particleLayerMs: Number(renderBreakdown.particleLayerMs || 0),
            uiLayerMs: Number(renderBreakdown.uiLayerMs || 0),
            debugLayerMs: Number(renderBreakdown.debugLayerMs || 0),
            canvasClearMs: Number(renderBreakdown.canvasClearMs || 0),
            compositeMs: Number(renderBreakdown.compositeMs || 0),
            atmosphereCompositeMs: Number(renderBreakdown.atmosphereCompositeMs || 0),
            particleRenderMs: Number(sample.particleRenderMs || 0)
        };
        this.mergeBreakdownMap(breakdown, extraRenderBreakdown);
        this.mergeBreakdownMap(breakdown, compositeBreakdown, 'composite.');
        return breakdown;
    }

    buildShellStateSummary(shellState = {}) {
        const panels = Array.isArray(shellState?.openPanels) ? shellState.openPanels : [];
        if (!panels.length) {
            return `${shellState?.viewMode || 'focused-garden'} | clean shell`;
        }
        return `${shellState?.viewMode || 'focused-garden'} | ${panels.join(', ')}`;
    }

    buildLagAttribution() {
        const avgUpdateMs = this.getAverage(this.recentUpdateSamples, 'totalUpdateMs');
        const avgRenderMs = this.getAverage(this.recentRenderSamples, 'totalRenderMs');
        const avgUpdateBreakdown = this.computeAverageBreakdown(this.recentUpdateSamples, 'updateBreakdown');
        const avgRenderBreakdown = this.computeAverageBreakdown(this.recentRenderSamples, 'renderBreakdownFlat');
        const topUpdateContributors = this.extractTopBreakdownEntries(avgUpdateBreakdown, 4);
        const topRenderContributors = this.extractTopBreakdownEntries(avgRenderBreakdown, 4);
        const shellState = this.lastRenderSample?.shellState
            ? this.cloneJson(this.lastRenderSample.shellState, null)
            : null;

        const uiHeavyMs = Number(avgRenderBreakdown.uiLayerMs || 0)
            + Number(avgRenderBreakdown.debugLayerMs || 0)
            + Number(avgRenderBreakdown['composite.uiCompositeMs'] || 0)
            + Number(avgRenderBreakdown['composite.debugCompositeMs'] || 0);
        const fieldRenderMs = Number(avgRenderBreakdown.entityLayerMs || 0)
            + Number(avgRenderBreakdown.particleLayerMs || 0)
            + Number(avgRenderBreakdown['composite.entitiesCompositeMs'] || 0)
            + Number(avgRenderBreakdown['composite.particlesCompositeMs'] || 0);

        let category = 'mixed';
        if (
            avgRenderMs >= Math.max(14, avgUpdateMs * 1.12)
            && uiHeavyMs >= Math.max(5, fieldRenderMs * 0.85)
            && (shellState?.openPanelCount || 0) >= 2
        ) {
            category = 'ui-heavy';
        } else if (avgRenderMs >= Math.max(14, avgUpdateMs * 1.12)) {
            category = 'render-dominant';
        } else if (avgUpdateMs >= Math.max(12, avgRenderMs * 1.12)) {
            category = 'simulation-dominant';
        }

        const dominantUpdate = topUpdateContributors[0] || null;
        const dominantRender = topRenderContributors[0] || null;
        const summaryLine = category === 'ui-heavy'
            ? `UI-heavy lag: render ${avgRenderMs.toFixed(2)}ms with shell load led by ${dominantRender?.label || 'uiLayerMs'}.`
            : category === 'render-dominant'
                ? `Render-dominant lag: render ${avgRenderMs.toFixed(2)}ms vs update ${avgUpdateMs.toFixed(2)}ms, led by ${dominantRender?.label || 'entityLayerMs'}.`
                : category === 'simulation-dominant'
                    ? `Simulation-dominant lag: update ${avgUpdateMs.toFixed(2)}ms vs render ${avgRenderMs.toFixed(2)}ms, led by ${dominantUpdate?.label || 'foundationMs'}.`
                    : `Mixed lag: update ${avgUpdateMs.toFixed(2)}ms and render ${avgRenderMs.toFixed(2)}ms are both materially loaded.`;

        return {
            category,
            summaryLine,
            avgUpdateMs,
            avgRenderMs,
            shellState,
            shellSummary: this.buildShellStateSummary(shellState),
            topUpdateContributors,
            topRenderContributors,
            averageUpdateBreakdown: avgUpdateBreakdown,
            averageRenderBreakdown: avgRenderBreakdown
        };
    }

    summarizeGameState(gameState = {}) {
        const state = gameState || {};
        return {
            recordedAtMs: Date.now(),
            butterflyCount: state?.butterflies?.length || 0,
            flowerCount: state?.flowers?.length || 0,
            caterpillarCount: state?.caterpillars?.length || 0,
            blockCount: state?.blocks?.length || 0,
            hybridCount: state?.hybridJournal?.length || 0,
            focusedZoneId: state?.focusedZoneId || null,
            viewMode: state?.viewMode || 'focused-garden',
            activeBattleId: state?.activeBattleId || null,
            timeScale: state?.timeScale ?? 1,
            shellState: gameUI?.getShellPerformanceState?.(state) || null
        };
    }

    isSessionCaptureActive() {
        return !!this.sessionCapture?.active;
    }

    startSessionCapture(gameState = {}, options = {}) {
        const now = Date.now();
        const sessionId = options.sessionId || `capture_${now}`;
        const label = options.label || 'session-capture';
        this.sessionCapture = {
            active: true,
            sessionId,
            label,
            startedAtMs: now,
            stoppedAtMs: null,
            output: null,
            archivedSummary: null,
            timeline: [],
            freezeSuspects: [],
            runtimeIssues: [],
            frameTimes: [],
            heapSamples: [],
            renderSampleCount: 0,
            compositeCallsTotal: 0,
            uiRedrawCount: 0,
            debugRedrawCount: 0,
            timelineDroppedCount: 0,
            frameTimesDroppedCount: 0,
            runtimeIssuesDroppedCount: 0,
            lastSnapshotAtMs: 0,
            lastUpdateSpikeAtMs: 0,
            lastRenderSpikeAtMs: 0,
            eventCounts: {},
            startState: this.summarizeGameState(gameState),
            endState: null
        };
        this.captureHeapSample(now, { force: true });
        this.recordSessionEvent('capture', 'started', {
            label,
            viewMode: gameState?.viewMode || 'focused-garden',
            focusedZoneId: gameState?.focusedZoneId || null
        }, { atMs: now });
        this.maybeRecordSessionSnapshot(gameState, 'start', { force: true, atMs: now });
        return this.getSessionCaptureSummary();
    }

    finishSessionCapture(gameState = {}, options = {}) {
        if (!this.isSessionCaptureActive()) {
            return this.getSessionCaptureSummary();
        }
        const now = options.atMs || Date.now();
        this.sessionCapture.endState = this.summarizeGameState(gameState);
        this.recordSessionEvent('capture', 'stopping', {
            reason: options.reason || 'export',
            viewMode: gameState?.viewMode || 'focused-garden',
            focusedZoneId: gameState?.focusedZoneId || null
        }, { atMs: now, force: true });
        this.maybeRecordSessionSnapshot(gameState, 'end', { force: true, atMs: now });
        this.sessionCapture.active = false;
        this.sessionCapture.stoppedAtMs = now;
        return this.getSessionCaptureSummary();
    }

    getRuntimeIssueSeverity(kind = 'runtime-issue', details = {}) {
        const explicitSeverity = typeof details?.severity === 'string'
            ? details.severity.toLowerCase()
            : null;
        if (explicitSeverity === 'warning' || explicitSeverity === 'error') {
            return explicitSeverity;
        }
        if (kind === 'cadence-budget-overrun') {
            return 'warning';
        }
        return 'error';
    }

    getRuntimeIssueEventCategory(kind = 'runtime-issue', details = {}) {
        if (kind === 'cadence-budget-overrun') {
            return 'telemetry_warning';
        }
        return this.getRuntimeIssueSeverity(kind, details) === 'warning'
            ? 'warning'
            : 'error';
    }

    summarizeRuntimeIssues(runtimeIssues = []) {
        const issues = Array.isArray(runtimeIssues) ? runtimeIssues : [];
        const severityCounts = {
            error: 0,
            warning: 0
        };
        const kindCounts = {};

        for (const issue of issues) {
            const severity = this.getRuntimeIssueSeverity(issue?.kind, issue?.details || {});
            severityCounts[severity] = (severityCounts[severity] || 0) + 1;
            const kindKey = issue?.kind || 'runtime-issue';
            kindCounts[kindKey] = (kindCounts[kindKey] || 0) + 1;
        }

        return {
            totalCount: issues.length,
            errorCount: Number(severityCounts.error || 0),
            warningCount: Number(severityCounts.warning || 0),
            kinds: kindCounts
        };
    }

    getSessionCaptureSummary() {
        const capture = this.sessionCapture || {};
        const timeline = Array.isArray(capture.timeline) ? capture.timeline : [];
        const eventCounts = capture.eventCounts || {};
        const runtimeIssues = Array.isArray(capture.runtimeIssues) ? capture.runtimeIssues : [];
        const frameTimes = Array.isArray(capture.frameTimes) ? capture.frameTimes : [];
        const heapSamples = Array.isArray(capture.heapSamples) ? capture.heapSamples : [];
        if (
            !capture.active
            && capture.archivedSummary
            && timeline.length === 0
            && runtimeIssues.length === 0
            && frameTimes.length === 0
            && heapSamples.length === 0
        ) {
            const archivedSummary = this.cloneJson(capture.archivedSummary, null) || {};
            archivedSummary.output = capture.output
                ? { ...capture.output }
                : (archivedSummary.output || null);
            return archivedSummary;
        }
        const updateValues = timeline
            .filter(entry => entry?.category === 'spike' && entry?.payload?.sampleType === 'update')
            .map(entry => Number(entry?.payload?.totalMs || 0));
        const renderValues = timeline
            .filter(entry => entry?.category === 'spike' && entry?.payload?.sampleType === 'render')
            .map(entry => Number(entry?.payload?.totalMs || 0));
        const particleCounts = timeline
            .filter(entry => entry?.category === 'spike' && entry?.payload?.sampleType === 'render')
            .map(entry => Number(entry?.payload?.particleCount || 0));
        const heapMilestones = this.buildHeapMilestones(heapSamples, capture.startedAtMs || null);
        const runtimeIssueSummary = this.summarizeRuntimeIssues(runtimeIssues);
        return {
            active: !!capture.active,
            sessionId: capture.sessionId || null,
            label: capture.label || 'session-capture',
            startedAtMs: capture.startedAtMs || null,
            stoppedAtMs: capture.stoppedAtMs || null,
            durationMs: capture.startedAtMs
                ? Math.max(0, (capture.stoppedAtMs || Date.now()) - capture.startedAtMs)
                : 0,
            timelineCount: timeline.length,
            runtimeIssueCount: runtimeIssueSummary.totalCount,
            errorRuntimeIssueCount: runtimeIssueSummary.errorCount,
            warningRuntimeIssueCount: runtimeIssueSummary.warningCount,
            runtimeIssueKinds: runtimeIssueSummary.kinds,
            telemetryWarningCount: Number(eventCounts.telemetry_warning || 0),
            eventCounts: { ...eventCounts },
            maxUpdateMs: updateValues.length ? Math.max(...updateValues) : 0,
            maxRenderMs: renderValues.length ? Math.max(...renderValues) : 0,
            maxParticleCount: particleCounts.length ? Math.max(...particleCounts) : 0,
            p50FrameMs: this.getPercentile(frameTimes, 0.5),
            p95FrameMs: this.getPercentile(frameTimes, 0.95),
            p99FrameMs: this.getPercentile(frameTimes, 0.99),
            compositeCallsPerFrame: (capture.renderSampleCount || 0) > 0
                ? Number(capture.compositeCallsTotal || 0) / Number(capture.renderSampleCount || 1)
                : 0,
            uiRedrawCount: Number(capture.uiRedrawCount || 0),
            debugRedrawCount: Number(capture.debugRedrawCount || 0),
            heapSampleCount: heapSamples.length,
            peakHeapUsedMB: heapSamples.length
                ? Math.max(...heapSamples.map(sample => Number(sample?.usedMB || 0)))
                : 0,
            heapMilestones,
            output: capture.output ? { ...capture.output } : null,
            timelineDroppedCount: Number(capture.timelineDroppedCount || 0),
            frameTimesDroppedCount: Number(capture.frameTimesDroppedCount || 0),
            runtimeIssuesDroppedCount: Number(capture.runtimeIssuesDroppedCount || 0),
            startState: capture.startState ? { ...capture.startState } : null,
            endState: capture.endState ? { ...capture.endState } : null,
            latestHeapSample: heapSamples.length
                ? this.cloneJson(heapSamples[heapSamples.length - 1], null)
                : null
        };
    }

    recordSessionEvent(category, label, payload = {}, options = {}) {
        const capture = this.sessionCapture;
        if (!capture?.active && !options.force) return null;
        const entry = {
            category: category || 'note',
            label: label || 'event',
            atMs: options.atMs || Date.now(),
            frame: typeof frameCount === 'number' ? frameCount : null,
            payload: this.cloneJson(payload, {})
        };
        capture.timeline = Array.isArray(capture.timeline) ? capture.timeline : [];
        capture.timeline.push(entry);
        const trackingRingCap = this.getRuntimeFlag('telemetryRingCap', false);
        const maxTimeline = trackingRingCap
            ? this.getTelemetryLimit('sessionTimelineMax', 480)
            : 480;
        while (capture.timeline.length > maxTimeline) {
            capture.timeline.shift();
            if (trackingRingCap) {
                capture.timelineDroppedCount = Number(capture.timelineDroppedCount || 0) + 1;
            }
        }
        if (entry.category === 'freeze_suspect') {
            capture.freezeSuspects = Array.isArray(capture.freezeSuspects)
                ? capture.freezeSuspects
                : [];
            capture.freezeSuspects.push(this.cloneJson(entry, null));
            while (capture.freezeSuspects.length > this.freezeSuspectMaxEntries) {
                capture.freezeSuspects.shift();
            }
        }
        capture.eventCounts = capture.eventCounts || {};
        capture.eventCounts[entry.category] = (capture.eventCounts[entry.category] || 0) + 1;
        return this.cloneJson(entry, null);
    }

    recordRuntimeConsole(level = 'warn', args = []) {
        if (!this.isSessionCaptureActive()) return;
        const text = (args || []).map(value => {
            if (typeof value === 'string') return value;
            try {
                return JSON.stringify(value);
            } catch (_error) {
                return String(value);
            }
        }).join(' | ');
        this.recordSessionEvent(level === 'error' ? 'error' : 'warning', `console-${level}`, {
            text: text.slice(0, 1200)
        });
    }

    recordRuntimeIssue(kind = 'runtime-issue', details = {}) {
        if (!this.isSessionCaptureActive()) return null;
        const severity = this.getRuntimeIssueSeverity(kind, details);
        const issue = {
            kind,
            severity,
            atMs: Date.now(),
            frame: typeof frameCount === 'number' ? frameCount : null,
            details: this.cloneJson(details, {})
        };
        this.sessionCapture.runtimeIssues = Array.isArray(this.sessionCapture.runtimeIssues)
            ? this.sessionCapture.runtimeIssues
            : [];
        this.sessionCapture.runtimeIssues.push(issue);
        const trackingRingCap = this.getRuntimeFlag('telemetryRingCap', false);
        const maxRuntimeIssues = trackingRingCap
            ? this.getTelemetryLimit('runtimeIssueMax', 96)
            : 96;
        while (this.sessionCapture.runtimeIssues.length > maxRuntimeIssues) {
            this.sessionCapture.runtimeIssues.shift();
            if (trackingRingCap) {
                this.sessionCapture.runtimeIssuesDroppedCount = Number(this.sessionCapture.runtimeIssuesDroppedCount || 0) + 1;
            }
        }
        this.recordSessionEvent(this.getRuntimeIssueEventCategory(kind, issue.details), kind, issue.details, { atMs: issue.atMs });
        return this.cloneJson(issue, null);
    }

    maybeRecordSessionSnapshot(gameState = {}, reason = 'interval', options = {}) {
        const force = !!options.force;
        if (!this.isSessionCaptureActive() && !force) return null;
        const now = options.atMs || Date.now();
        const intervalMs = 5000;
        if (!force && (now - (this.sessionCapture.lastSnapshotAtMs || 0)) < intervalMs) {
            return null;
        }
        this.sessionCapture.lastSnapshotAtMs = now;
        this.captureHeapSample(now);
        return this.recordSessionEvent('snapshot', reason, {
            state: this.summarizeGameState(gameState),
            telemetry: this.getSnapshot()
        }, { atMs: now });
    }

    maybeRecordUpdateSpike(gameState = {}, sample = {}) {
        if (!this.isSessionCaptureActive()) return null;
        const now = Date.now();
        const totalMs = Number(sample.totalUpdateMs || 0);
        const freezeSuspect = totalMs >= 80;
        const spike = totalMs >= 30 || Number(sample.physicsMs || 0) >= 12;
        if (!freezeSuspect && !spike) {
            this.maybeRecordSessionSnapshot(gameState, 'interval', { atMs: now });
            return null;
        }
        const cooldownMs = freezeSuspect ? 400 : 1200;
        if ((now - (this.sessionCapture.lastUpdateSpikeAtMs || 0)) < cooldownMs) {
            return null;
        }
        this.sessionCapture.lastUpdateSpikeAtMs = now;
        const category = freezeSuspect ? 'freeze_suspect' : 'spike';
        return this.recordSessionEvent(category, freezeSuspect ? 'slow-update-freeze-risk' : 'slow-update', {
            sampleType: 'update',
            totalMs,
            physicsMs: Number(sample.physicsMs || 0),
            entityMs: Number(sample.entityMs || 0),
            foundationMs: Number(sample.foundationMs || 0),
            particleUpdateMs: Number(sample.particleUpdateMs || 0),
            worldMs: Number(sample.worldMs || 0),
            topContributors: this.extractTopBreakdownEntries(sample.updateBreakdown || {}, 3),
            viewMode: gameState?.viewMode || 'focused-garden',
            focusedZoneId: gameState?.focusedZoneId || null
        }, { atMs: now });
    }

    maybeRecordRenderSpike(sample = {}) {
        if (!this.isSessionCaptureActive()) return null;
        const now = Date.now();
        const totalMs = Number(sample.totalRenderMs || 0);
        const freezeSuspect = totalMs >= 90;
        const spike = totalMs >= 35 || Number(sample.particleCount || 0) >= 160;
        if (!freezeSuspect && !spike) return null;
        const cooldownMs = freezeSuspect ? 400 : 1200;
        if ((now - (this.sessionCapture.lastRenderSpikeAtMs || 0)) < cooldownMs) {
            return null;
        }
        this.sessionCapture.lastRenderSpikeAtMs = now;
        const category = freezeSuspect ? 'freeze_suspect' : 'spike';
        return this.recordSessionEvent(category, freezeSuspect ? 'slow-render-freeze-risk' : 'slow-render', {
            sampleType: 'render',
            totalMs,
            particleRenderMs: Number(sample.particleRenderMs || 0),
            particleCount: Number(sample.particleCount || 0),
            visibleEffectCount: Number(sample.visibleEffectCount || 0),
            topContributors: this.extractTopBreakdownEntries(sample.renderBreakdownFlat || {}, 3),
            trailMode: sample.trailMode || 'off',
            atmosphereTier: sample.atmosphereTier || 'full',
            shellState: this.cloneJson(sample.shellState, null)
        }, { atMs: now });
    }

    recordUpdateSample(gameState, sample = {}) {
        const foundationBreakdown = this.normalizeBreakdownMap(sample.foundationBreakdown || {});
        const entityBreakdown = this.normalizeBreakdownMap(sample.entityBreakdown || {});
        const worldBreakdown = this.normalizeBreakdownMap(sample.worldBreakdown || {});
        const updateBreakdown = this.buildUpdateAttributionBreakdown({
            ...sample,
            foundationBreakdown,
            entityBreakdown,
            worldBreakdown
        });
        const normalized = {
            recordedAtMs: Date.now(),
            totalUpdateMs: sample.totalUpdateMs || 0,
            foundationMs: sample.foundationMs || 0,
            foundationBreakdown,
            entityMs: sample.entityMs || 0,
            entityBreakdown,
            physicsMs: sample.physicsMs || 0,
            particleUpdateMs: sample.particleUpdateMs || 0,
            worldMs: sample.worldMs || 0,
            worldBreakdown,
            updateBreakdown,
            physicsBudget: sample.physicsBudget || null,
            butterflyCount: gameState?.butterflies?.length || 0,
            flowerCount: gameState?.flowers?.length || 0,
            caterpillarCount: gameState?.caterpillars?.length || 0,
            blockCount: gameState?.blocks?.length || 0,
            visibleButterflyCount: sample.visibleButterflyCount ?? sample.butterflyCount ?? 0,
            visibleFlowerCount: sample.visibleFlowerCount ?? sample.flowerCount ?? 0,
            visibleCaterpillarCount: sample.visibleCaterpillarCount ?? sample.caterpillarCount ?? 0,
            visibleBlockCount: sample.visibleBlockCount ?? sample.blockCount ?? 0,
            visibleEntityCount: sample.visibleEntityCount ?? 0,
            timeScale: gameState?.timeScale ?? 1,
            viewMode: gameState?.viewMode || 'focused-garden'
        };
        this.lastUpdateSample = normalized;
        this.pushSample(this.recentUpdateSamples, normalized);
        this.lastPressureProfile = this.buildPressureProfile();
        this.maybeRecordUpdateSpike(gameState, normalized);
        return normalized;
    }

    recordRenderSample(sample = {}) {
        const renderBreakdown = this.cloneJson(sample.renderBreakdown, {}) || {};
        const renderBreakdownFlat = this.buildRenderAttributionBreakdown({
            ...sample,
            renderBreakdown
        });
        const normalized = {
            recordedAtMs: Date.now(),
            totalRenderMs: sample.totalRenderMs || 0,
            particleRenderMs: sample.particleRenderMs || 0,
            particleCount: sample.particleCount || 0,
            batchCount: sample.batchCount || 0,
            visibleEffectCount: sample.visibleEffectCount || 0,
            trailMode: sample.trailMode || 'reduced',
            atmosphereTier: sample.atmosphereTier || 'full',
            compositeCallCount: Number(sample.compositeCallCount || 0),
            uiRedrawCount: Number(sample.uiRedrawCount || 0),
            debugRedrawCount: Number(sample.debugRedrawCount || 0),
            renderBreakdown,
            renderBreakdownFlat,
            shellState: this.cloneJson(sample.shellState, null)
        };
        this.lastRenderSample = normalized;
        this.pushSample(this.recentRenderSamples, normalized);
        if (this.isSessionCaptureActive()) {
            const frameTime = Number(this.lastUpdateSample?.totalUpdateMs || 0) + Number(normalized.totalRenderMs || 0);
            this.sessionCapture.frameTimes = Array.isArray(this.sessionCapture.frameTimes)
                ? this.sessionCapture.frameTimes
                : [];
            this.sessionCapture.frameTimes.push(frameTime);
            const trackingRingCap = this.getRuntimeFlag('telemetryRingCap', false);
            const maxFrameTimes = trackingRingCap
                ? this.getTelemetryLimit('frameHistoryMax', 720)
                : 720;
            while (this.sessionCapture.frameTimes.length > maxFrameTimes) {
                this.sessionCapture.frameTimes.shift();
                if (trackingRingCap) {
                    this.sessionCapture.frameTimesDroppedCount = Number(this.sessionCapture.frameTimesDroppedCount || 0) + 1;
                }
            }
            this.sessionCapture.renderSampleCount = Number(this.sessionCapture.renderSampleCount || 0) + 1;
            this.sessionCapture.compositeCallsTotal = Number(this.sessionCapture.compositeCallsTotal || 0)
                + Number(normalized.compositeCallCount || 0);
            this.sessionCapture.uiRedrawCount = Number(this.sessionCapture.uiRedrawCount || 0)
                + Number(normalized.uiRedrawCount || 0);
            this.sessionCapture.debugRedrawCount = Number(this.sessionCapture.debugRedrawCount || 0)
                + Number(normalized.debugRedrawCount || 0);
        }
        this.lastPressureProfile = this.buildPressureProfile();
        this.maybeRecordRenderSpike(normalized);
        return normalized;
    }

    recordEcologySample(gameState, sample = {}) {
        const zoneHealth = sample.zoneHealth || {};
        const migration = sample.migration || {};
        const release = sample.release || {};
        const zoneSummaries = Array.isArray(sample.zoneSummaries) ? sample.zoneSummaries : [];
        const normalized = {
            recordedAtMs: Date.now(),
            butterflyCount: gameState?.butterflies?.length || 0,
            flowerCount: gameState?.flowers?.length || 0,
            timeScale: gameState?.timeScale ?? 1,
            viewMode: gameState?.viewMode || 'focused-garden',
            zoneCount: Math.max(0, sample.zoneCount ?? zoneSummaries.length),
            zoneHealth: {
                distinctIdentityCount: Math.max(0, zoneHealth.distinctIdentityCount || 0),
                distinctSignatureCount: Math.max(0, zoneHealth.distinctSignatureCount || 0),
                zonesBelowFloorCount: Math.max(0, zoneHealth.zonesBelowFloorCount || 0),
                minResourceReserve: zoneHealth.minResourceReserve || 0,
                minHabitatQuality: zoneHealth.minHabitatQuality || 0,
                maxDepletionPressure: zoneHealth.maxDepletionPressure || 0,
                avgCrowdingPressure: zoneHealth.avgCrowdingPressure || 0,
                avgMigrationPull: zoneHealth.avgMigrationPull || 0
            },
            migration: {
                livingCount: Math.max(0, migration.livingCount || 0),
                homeAnchoredCount: Math.max(0, migration.homeAnchoredCount || 0),
                settledHomeCount: Math.max(0, migration.settledHomeCount || 0),
                awayFromHomeCount: Math.max(0, migration.awayFromHomeCount || 0),
                activeTravelerCount: Math.max(0, migration.activeTravelerCount || 0),
                multiZoneCount: Math.max(0, migration.multiZoneCount || 0),
                completedTravelCount: Math.max(0, migration.completedTravelCount || 0),
                homeReturnCount: Math.max(0, migration.homeReturnCount || 0),
                scoutingTripCount: Math.max(0, migration.scoutingTripCount || 0)
            },
            release: {
                totalReleases: Math.max(0, release.totalReleases || 0),
                currentBatchCount: Math.max(0, release.currentBatchCount || 0),
                releaseHistoryCount: Math.max(0, release.releaseHistoryCount || 0),
                latestCohortId: Number.isFinite(release.latestCohortId) ? release.latestCohortId : null,
                latestCohortBlendGuard: release.latestCohortBlendGuard || 0,
                latestPreferredZoneId: release.latestPreferredZoneId || null,
                latestWaveWildCount: Math.max(0, release.latestWaveWildCount || 0),
                latestLineageCount: Math.max(0, release.latestLineageCount || 0)
            },
            zoneSummaries: zoneSummaries.map(summary => ({
                zoneId: summary.zoneId || null,
                identityLabel: summary.identityLabel || summary.label || summary.zoneId || null,
                signatureLabel: summary.signatureLabel || null,
                normalFlowers: Math.max(0, summary.normalFlowers || 0),
                floorTarget: Math.max(0, summary.floorTarget || 0),
                resourceReserve: summary.resourceReserve || 0,
                habitatQuality: summary.habitatQuality || 0,
                depletionPressure: summary.depletionPressure || 0,
                migrationPull: summary.migrationPull || 0,
                crowdingPressure: summary.crowdingPressure || 0
            }))
        };
        this.lastEcologySample = normalized;
        this.pushSample(this.recentEcologySamples, normalized);
        while (this.recentEcologySamples.length > this.ecologyMaxSamples) {
            this.recentEcologySamples.shift();
        }
        this.lastEcologyProfile = this.buildEcologyProfile();
        return normalized;
    }

    resetMlCorpusCapture() {
        this.recentMlCorpusSamples = [];
        this.lastMlCorpusProfile = null;
    }

    recordMlCorpusSample(sample = {}) {
        const corrections = sample.corrections || {};
        const correctedPolicies = Array.isArray(sample.correctedPolicies)
            ? sample.correctedPolicies.filter(Boolean)
            : Object.keys(corrections).filter(Boolean);
        const normalized = {
            recordedAtMs: Date.now(),
            scenarioId: sample.scenarioId || null,
            scenarioFamily: sample.scenarioFamily || 'unknown',
            auditPhase: sample.auditPhase || null,
            recordKind: sample.recordKind || 'garden',
            entityId: sample.entityId || null,
            entityType: sample.entityType || null,
            zoneId: sample.zoneId || null,
            battleMode: sample.battleMode || 'garden',
            activeSource: sample.activeSource || null,
            heuristicSource: sample.heuristicSource || 'heuristic',
            reviewStatus: sample.reviewStatus || 'unreviewed',
            correctedPolicies,
            correctedPolicyCount: correctedPolicies.length,
            featureSchemaVersion: sample.featureSchemaVersion || null,
            traceSchemaVersion: sample.traceSchemaVersion || null,
            tags: Array.isArray(sample.tags) ? sample.tags.filter(Boolean).slice(0, 8) : [],
            trainingLabels: sample.trainingLabels && typeof sample.trainingLabels === 'object'
                ? JSON.parse(JSON.stringify(sample.trainingLabels))
                : {}
        };
        this.pushSample(this.recentMlCorpusSamples, normalized);
        while (this.recentMlCorpusSamples.length > this.mlCorpusMaxSamples) {
            this.recentMlCorpusSamples.shift();
        }
        this.lastMlCorpusProfile = this.buildMlCorpusProfile();
        return JSON.parse(JSON.stringify(normalized));
    }

    recordMlRuntimeSample(gameState, sample = {}) {
        const budgetTargets = sample.budgetTargets && typeof sample.budgetTargets === 'object'
            ? JSON.parse(JSON.stringify(sample.budgetTargets))
            : {};
        const normalized = {
            recordedAtMs: Date.now(),
            mode: sample.mode || 'garden-update',
            totalMs: sample.totalMs || 0,
            refreshedTraceCount: Math.max(0, sample.refreshedTraceCount || 0),
            battleDecisionCount: Math.max(0, sample.battleDecisionCount || 0),
            mlPolicyCount: Math.max(0, sample.mlPolicyCount || 0),
            fallbackPolicyCount: Math.max(0, sample.fallbackPolicyCount || 0),
            modelAvailable: !!sample.modelAvailable,
            modelLoaded: !!sample.modelLoaded,
            useModelInference: !!sample.useModelInference,
            lastDecisionSource: sample.lastDecisionSource || 'heuristic-fallback',
            gardenCadenceFrames: Math.max(0, sample.gardenCadenceFrames || 0),
            battleCadenceFrames: Math.max(0, sample.battleCadenceFrames || 0),
            budgetTargets,
            butterflyCount: gameState?.butterflies?.length || 0,
            activeBattleId: gameState?.activeBattleId || null,
            viewMode: gameState?.viewMode || 'focused-garden'
        };
        this.recentMlRuntimeSamples.push(normalized);
        while (this.recentMlRuntimeSamples.length > this.mlRuntimeMaxSamples) {
            this.recentMlRuntimeSamples.shift();
        }
        this.lastMlRuntimeProfile = this.buildMlRuntimeProfile();
        return JSON.parse(JSON.stringify(normalized));
    }

    buildPressureProfile() {
        const avgUpdateMs = this.getAverage(this.recentUpdateSamples, 'totalUpdateMs');
        const avgPhysicsMs = this.getAverage(this.recentUpdateSamples, 'physicsMs');
        const avgRenderMs = this.getAverage(this.recentRenderSamples, 'totalRenderMs');
        const avgParticleRenderMs = this.getAverage(this.recentRenderSamples, 'particleRenderMs');
        const visibleEntities = this.lastUpdateSample?.visibleEntityCount || 0;
        const visibleButterflies = this.lastUpdateSample?.visibleButterflyCount || 0;
        const visibleEffects = this.lastRenderSample?.visibleEffectCount || 0;
        const particleCount = this.lastRenderSample?.particleCount || 0;

        let tier = 'normal';
        if (
            avgRenderMs >= 52 ||
            avgUpdateMs >= 20 ||
            visibleEntities >= 30 ||
            visibleEffects >= 10 ||
            particleCount >= 110
        ) {
            tier = 'critical';
        } else if (
            avgRenderMs >= 34 ||
            avgUpdateMs >= 12 ||
            visibleEntities >= 20 ||
            visibleEffects >= 7 ||
            particleCount >= 80
        ) {
            tier = 'hot';
        } else if (
            avgRenderMs >= 22 ||
            avgUpdateMs >= 8 ||
            visibleEntities >= 14 ||
            visibleEffects >= 4 ||
            particleCount >= 50
        ) {
            tier = 'warm';
        }

        const multiplierByTier = {
            normal: 1,
            warm: 0.82,
            hot: 0.58,
            critical: 0.38
        };
        const visualMultiplierByTier = {
            normal: 1,
            warm: 0.78,
            hot: 0.48,
            critical: 0.28
        };

        return {
            tier,
            avgUpdateMs,
            avgPhysicsMs,
            avgRenderMs,
            avgParticleRenderMs,
            visibleEntities,
            visibleButterflies,
            visibleEffects,
            particleCount,
            isWarm: tier === 'warm' || tier === 'hot' || tier === 'critical',
            isHot: tier === 'hot' || tier === 'critical',
            isCritical: tier === 'critical',
            simulationMultiplier: multiplierByTier[tier] || 1,
            visualMultiplier: visualMultiplierByTier[tier] || 1
        };
    }

    buildEcologyProfile() {
        if (!this.recentEcologySamples.length) {
            return {
                sampleCount: 0,
                avgMinResourceReserve: 0,
                avgMinHabitatQuality: 0,
                maxZonesBelowFloorCount: 0,
                avgHomeAnchorShare: 0,
                maxActiveTravelerCount: 0,
                latestCohortId: null,
                latestWaveWildCount: 0,
                distinctIdentityCount: 0,
                distinctSignatureCount: 0
            };
        }

        const sampleCount = this.recentEcologySamples.length;
        const getAverage = selector => this.recentEcologySamples.reduce((sum, sample) => sum + selector(sample), 0) / sampleCount;
        const maxZonesBelowFloorCount = this.recentEcologySamples.reduce((max, sample) =>
            Math.max(max, sample?.zoneHealth?.zonesBelowFloorCount || 0), 0);
        const maxActiveTravelerCount = this.recentEcologySamples.reduce((max, sample) =>
            Math.max(max, sample?.migration?.activeTravelerCount || 0), 0);
        const latest = this.lastEcologySample || this.recentEcologySamples[this.recentEcologySamples.length - 1];

        return {
            sampleCount,
            avgMinResourceReserve: getAverage(sample => sample?.zoneHealth?.minResourceReserve || 0),
            avgMinHabitatQuality: getAverage(sample => sample?.zoneHealth?.minHabitatQuality || 0),
            avgMaxDepletionPressure: getAverage(sample => sample?.zoneHealth?.maxDepletionPressure || 0),
            maxZonesBelowFloorCount,
            avgHomeAnchorShare: getAverage(sample => {
                const livingCount = sample?.migration?.livingCount || 0;
                return livingCount > 0 ? (sample?.migration?.homeAnchoredCount || 0) / livingCount : 0;
            }),
            avgMultiZoneShare: getAverage(sample => {
                const livingCount = sample?.migration?.livingCount || 0;
                return livingCount > 0 ? (sample?.migration?.multiZoneCount || 0) / livingCount : 0;
            }),
            maxActiveTravelerCount,
            latestCohortId: latest?.release?.latestCohortId ?? null,
            latestWaveWildCount: latest?.release?.latestWaveWildCount || 0,
            distinctIdentityCount: latest?.zoneHealth?.distinctIdentityCount || 0,
            distinctSignatureCount: latest?.zoneHealth?.distinctSignatureCount || 0
        };
    }

    buildMlCorpusProfile() {
        if (!this.recentMlCorpusSamples.length) {
            return {
                sampleCount: 0,
                scenarioCount: 0,
                scenarioFamilies: [],
                recordKinds: [],
                reviewedSampleCount: 0,
                correctedSampleCount: 0,
                correctedPolicyCount: 0,
                latestScenarioId: null
            };
        }

        const scenarioIds = new Set();
        const scenarioFamilies = new Set();
        const recordKinds = new Set();
        let reviewedSampleCount = 0;
        let correctedSampleCount = 0;
        let correctedPolicyCount = 0;

        for (const sample of this.recentMlCorpusSamples) {
            if (sample?.scenarioId) scenarioIds.add(sample.scenarioId);
            if (sample?.scenarioFamily) scenarioFamilies.add(sample.scenarioFamily);
            if (sample?.recordKind) recordKinds.add(sample.recordKind);
            if (sample?.reviewStatus && sample.reviewStatus !== 'unreviewed') {
                reviewedSampleCount += 1;
            }
            if ((sample?.correctedPolicyCount || 0) > 0) {
                correctedSampleCount += 1;
            }
            correctedPolicyCount += Math.max(0, sample?.correctedPolicyCount || 0);
        }

        const latest = this.recentMlCorpusSamples[this.recentMlCorpusSamples.length - 1] || null;
        return {
            sampleCount: this.recentMlCorpusSamples.length,
            scenarioCount: scenarioIds.size,
            scenarioFamilies: [...scenarioFamilies].sort(),
            recordKinds: [...recordKinds].sort(),
            reviewedSampleCount,
            correctedSampleCount,
            correctedPolicyCount,
            latestScenarioId: latest?.scenarioId || null
        };
    }

    buildMlRuntimeProfile() {
        if (!this.recentMlRuntimeSamples.length) {
            return {
                sampleCount: 0,
                gardenSampleCount: 0,
                battleSampleCount: 0,
                avgGardenUpdateMs: 0,
                maxGardenUpdateMs: 0,
                avgBattleDecisionMs: 0,
                maxBattleDecisionMs: 0,
                avgRefreshedTraceCount: 0,
                mlPolicyCount: 0,
                fallbackPolicyCount: 0,
                mlPolicyShare: 0,
                fallbackPolicyShare: 0,
                budgetTargets: null,
                withinBudget: {
                    gardenInference: false,
                    battleDecision: false
                },
                modelLoaded: false,
                useModelInference: false,
                lastMode: null,
                lastDecisionSource: null
            };
        }

        const gardenSamples = this.recentMlRuntimeSamples.filter(sample => sample.mode === 'garden-update');
        const battleSamples = this.recentMlRuntimeSamples.filter(sample => sample.mode === 'battle-policy');
        const averageFor = (samples, key) => {
            if (!samples.length) return 0;
            const total = samples.reduce((sum, sample) => sum + (sample?.[key] || 0), 0);
            return total / samples.length;
        };
        const maxFor = (samples, key) => samples.reduce((max, sample) => Math.max(max, sample?.[key] || 0), 0);
        const mlPolicyCount = this.recentMlRuntimeSamples.reduce((sum, sample) => sum + (sample?.mlPolicyCount || 0), 0);
        const fallbackPolicyCount = this.recentMlRuntimeSamples.reduce((sum, sample) => sum + (sample?.fallbackPolicyCount || 0), 0);
        const totalPolicyCount = mlPolicyCount + fallbackPolicyCount;
        const latest = this.recentMlRuntimeSamples[this.recentMlRuntimeSamples.length - 1] || null;
        const budgetTargets = latest?.budgetTargets || null;
        const avgGardenUpdateMs = averageFor(gardenSamples, 'totalMs');
        const avgBattleDecisionMs = averageFor(battleSamples, 'totalMs');

        return {
            sampleCount: this.recentMlRuntimeSamples.length,
            gardenSampleCount: gardenSamples.length,
            battleSampleCount: battleSamples.length,
            avgGardenUpdateMs,
            maxGardenUpdateMs: maxFor(gardenSamples, 'totalMs'),
            avgBattleDecisionMs,
            maxBattleDecisionMs: maxFor(battleSamples, 'totalMs'),
            avgRefreshedTraceCount: averageFor(gardenSamples, 'refreshedTraceCount'),
            mlPolicyCount,
            fallbackPolicyCount,
            mlPolicyShare: totalPolicyCount > 0 ? mlPolicyCount / totalPolicyCount : 0,
            fallbackPolicyShare: totalPolicyCount > 0 ? fallbackPolicyCount / totalPolicyCount : 0,
            budgetTargets,
            withinBudget: {
                gardenInference: !!budgetTargets && avgGardenUpdateMs <= (budgetTargets.focusedGardenInferenceMs || 0),
                battleDecision: !!budgetTargets && avgBattleDecisionMs <= (budgetTargets.battleDecisionMs || 0)
            },
            modelLoaded: !!latest?.modelLoaded,
            useModelInference: !!latest?.useModelInference,
            lastMode: latest?.mode || null,
            lastDecisionSource: latest?.lastDecisionSource || null
        };
    }

    getPressureProfile() {
        if (!this.lastPressureProfile) {
            this.lastPressureProfile = this.buildPressureProfile();
        }
        return { ...this.lastPressureProfile };
    }

    getEcologyProfile() {
        if (!this.lastEcologyProfile) {
            this.lastEcologyProfile = this.buildEcologyProfile();
        }
        return { ...this.lastEcologyProfile };
    }

    getMlCorpusProfile() {
        if (!this.lastMlCorpusProfile) {
            this.lastMlCorpusProfile = this.buildMlCorpusProfile();
        }
        return JSON.parse(JSON.stringify(this.lastMlCorpusProfile));
    }

    getMlRuntimeProfile() {
        if (!this.lastMlRuntimeProfile) {
            this.lastMlRuntimeProfile = this.buildMlRuntimeProfile();
        }
        return JSON.parse(JSON.stringify(this.lastMlRuntimeProfile));
    }

    getSnapshot() {
        const pressure = this.getPressureProfile();
        const ecology = this.getEcologyProfile();
        const mlCorpus = this.getMlCorpusProfile();
        const mlRuntime = this.getMlRuntimeProfile();
        const attribution = this.buildLagAttribution();
        const attributionSnapshot = this.cloneJson(attribution, {
            category: 'unknown',
            summaryLine: 'Lag attribution unavailable'
        }) || {
            category: 'unknown',
            summaryLine: 'Lag attribution unavailable'
        };
        const averageUpdateBreakdown = this.cloneJson(attribution.averageUpdateBreakdown, {}) || {};
        const averageRenderBreakdown = this.cloneJson(attribution.averageRenderBreakdown, {}) || {};
        const memoryAttribution = this.buildMemoryAttribution();
        const memoryAttributionSnapshot = this.cloneJson(memoryAttribution, {
            enabled: false,
            summaryLines: []
        }) || {
            enabled: false,
            summaryLines: []
        };
        const recentFrameValues = this.buildRecentFrameValues();
        return {
            lastUpdateSample: this.lastUpdateSample ? { ...this.lastUpdateSample } : null,
            lastRenderSample: this.lastRenderSample ? { ...this.lastRenderSample } : null,
            lastEcologySample: this.lastEcologySample ? JSON.parse(JSON.stringify(this.lastEcologySample)) : null,
            averages: {
                updateMs: this.getAverage(this.recentUpdateSamples, 'totalUpdateMs'),
                foundationMs: this.getAverage(this.recentUpdateSamples, 'foundationMs'),
                entityMs: this.getAverage(this.recentUpdateSamples, 'entityMs'),
                physicsMs: this.getAverage(this.recentUpdateSamples, 'physicsMs'),
                particleUpdateMs: this.getAverage(this.recentUpdateSamples, 'particleUpdateMs'),
                worldMs: this.getAverage(this.recentUpdateSamples, 'worldMs'),
                renderMs: this.getAverage(this.recentRenderSamples, 'totalRenderMs'),
                particleRenderMs: this.getAverage(this.recentRenderSamples, 'particleRenderMs'),
                uiLayerMs: Number(attribution.averageRenderBreakdown?.uiLayerMs || 0),
                compositeMs: Number(attribution.averageRenderBreakdown?.compositeMs || 0),
                compositeCallsPerFrame: this.getAverage(this.recentRenderSamples, 'compositeCallCount')
            },
            percentiles: {
                p50FrameMs: this.getPercentile(recentFrameValues, 0.5),
                p95FrameMs: this.getPercentile(recentFrameValues, 0.95),
                p99FrameMs: this.getPercentile(recentFrameValues, 0.99)
            },
            redraws: {
                uiPerFrame: this.getAverage(this.recentRenderSamples, 'uiRedrawCount'),
                debugPerFrame: this.getAverage(this.recentRenderSamples, 'debugRedrawCount')
            },
            memory: {
                current: this.getHeapUsageSample(),
                captureMilestones: this.buildHeapMilestones(
                    this.sessionCapture?.heapSamples || [],
                    this.sessionCapture?.startedAtMs || null
                ),
                attribution: this.cloneJson(memoryAttributionSnapshot, memoryAttributionSnapshot)
            },
            breakdowns: {
                update: averageUpdateBreakdown,
                render: averageRenderBreakdown
            },
            attribution: attributionSnapshot,
            memoryAttribution: memoryAttributionSnapshot,
            pressure,
            ecology,
            mlCorpus,
            mlRuntime,
            sessionCapture: this.getSessionCaptureSummary(),
            sampleCounts: {
                updates: this.recentUpdateSamples.length,
                renders: this.recentRenderSamples.length,
                ecology: this.recentEcologySamples.length,
                mlCorpus: this.recentMlCorpusSamples.length,
                mlRuntime: this.recentMlRuntimeSamples.length
            }
        };
    }

    buildSessionCaptureExport(gameState = {}, options = {}) {
        const capture = this.sessionCapture || {};
        const telemetry = this.getSnapshot();
        const startedAtMs = capture.startedAtMs || Date.now();
        const fullEventHistory = typeof eventBus !== 'undefined'
            ? (eventBus.getHistory?.() || []).filter(entry => (entry?.timestamp || 0) >= startedAtMs)
            : [];
        const trackingRingCap = this.getRuntimeFlag('telemetryRingCap', false);
        const eventHistoryMax = trackingRingCap
            ? this.getTelemetryLimit('eventHistoryMax', 2000)
            : fullEventHistory.length;
        const eventHistory = fullEventHistory.length > eventHistoryMax
            ? fullEventHistory.slice(-eventHistoryMax)
            : fullEventHistory;
        const eventHistoryDroppedCount = Math.max(0, fullEventHistory.length - eventHistory.length);
        const replayMarkers = typeof gameCore !== 'undefined'
            ? (gameCore.getReplayMetadata?.()?.markers || []).filter(entry => (entry?.createdAtMs || 0) >= startedAtMs)
            : [];
        const debugAuditState = typeof debugUI !== 'undefined' && debugUI.auditState
            ? this.cloneJson(debugUI.auditState, null)
            : null;
        return {
            version: 'v0-session-capture-v4',
            session: {
                sessionId: capture.sessionId || null,
                label: capture.label || 'session-capture',
                startedAt: capture.startedAtMs ? new Date(capture.startedAtMs).toISOString() : null,
                stoppedAt: capture.stoppedAtMs ? new Date(capture.stoppedAtMs).toISOString() : null
            },
            summary: this.getSessionCaptureSummary(),
            startState: capture.startState ? { ...capture.startState } : this.summarizeGameState(gameState),
            endState: capture.endState ? { ...capture.endState } : this.summarizeGameState(gameState),
            telemetry,
            timeline: this.cloneJson(capture.timeline, []),
            freezeSuspects: this.cloneJson(capture.freezeSuspects, []),
            runtimeIssues: this.cloneJson(capture.runtimeIssues, []),
            heapSamples: this.cloneJson(capture.heapSamples, []),
            frameTimes: this.cloneJson(capture.frameTimes, []),
            frameTimesDroppedCount: Number(capture.frameTimesDroppedCount || 0),
            eventHistory: this.cloneJson(eventHistory, []),
            eventHistoryDroppedCount,
            replayMarkers: this.cloneJson(replayMarkers, []),
            debugAuditState,
            notes: {
                source: options.source || 'debug-export',
                pressureTier: telemetry.pressure?.tier || 'unknown',
                lagCategory: telemetry.attribution?.category || 'unknown',
                localHostExpected: true
            }
        };
    }

    compactFinishedSessionCapture(summary = null) {
        const capture = this.sessionCapture || {};
        if (capture.active) return false;
        capture.archivedSummary = this.cloneJson(summary || this.getSessionCaptureSummary(), null) || null;
        capture.timeline = [];
        capture.freezeSuspects = [];
        capture.runtimeIssues = [];
        capture.frameTimes = [];
        capture.heapSamples = [];
        return true;
    }

    async exportSessionCapture(gameState = {}, options = {}) {
        if (
            !this.isSessionCaptureActive()
            && this.sessionCapture?.archivedSummary
            && this.sessionCapture?.output?.capturePath
        ) {
            return {
                ok: true,
                reusedExisting: true,
                outputDir: this.sessionCapture.output.outputDir || null,
                capturePath: this.sessionCapture.output.capturePath || null,
                summaryPath: this.sessionCapture.output.summaryPath || null,
                payloadSummary: this.getSessionCaptureSummary()
            };
        }
        this.finishSessionCapture(gameState, {
            reason: options.reason || 'export'
        });
        const payload = this.buildSessionCaptureExport(gameState, options);
        const response = await fetch('/api/session-captures', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.ok) {
            const message = response.status === 404
                ? 'Session capture export endpoint is unavailable; restart the playtest server and try again'
                : result?.error || `Session capture export failed with status ${response.status}`;
            this.recordRuntimeIssue('session-capture-export-failed', { message });
            throw new Error(message);
        }
        const output = {
            outputDir: result.outputDir || null,
            capturePath: result.capturePath || null,
            summaryPath: result.summaryPath || null
        };
        this.sessionCapture.output = output;
        this.compactFinishedSessionCapture({
            ...(payload.summary || this.getSessionCaptureSummary()),
            output
        });
        return {
            ...result,
            payloadSummary: this.getSessionCaptureSummary()
        };
    }
}

const telemetrySystem = new TelemetrySystem();
