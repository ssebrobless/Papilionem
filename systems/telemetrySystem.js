class TelemetrySystem {
    constructor() {
        this.initialized = false;
        this.reset();
    }

    initialize() {
        this.initialized = true;
    }

    reset() {
        this.lastUpdateSample = null;
        this.lastRenderSample = null;
        this.recentUpdateSamples = [];
        this.recentRenderSamples = [];
        this.maxSamples = 120;
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

    recordUpdateSample(gameState, sample = {}) {
        const normalized = {
            recordedAtMs: Date.now(),
            totalUpdateMs: sample.totalUpdateMs || 0,
            foundationMs: sample.foundationMs || 0,
            entityMs: sample.entityMs || 0,
            particleUpdateMs: sample.particleUpdateMs || 0,
            worldMs: sample.worldMs || 0,
            butterflyCount: gameState?.butterflies?.length || 0,
            flowerCount: gameState?.flowers?.length || 0,
            caterpillarCount: gameState?.caterpillars?.length || 0,
            timeScale: gameState?.timeScale ?? 1,
            viewMode: gameState?.viewMode || 'focused-garden'
        };
        this.lastUpdateSample = normalized;
        this.pushSample(this.recentUpdateSamples, normalized);
        return normalized;
    }

    recordRenderSample(sample = {}) {
        const normalized = {
            recordedAtMs: Date.now(),
            totalRenderMs: sample.totalRenderMs || 0,
            particleRenderMs: sample.particleRenderMs || 0,
            particleCount: sample.particleCount || 0,
            batchCount: sample.batchCount || 0
        };
        this.lastRenderSample = normalized;
        this.pushSample(this.recentRenderSamples, normalized);
        return normalized;
    }

    getSnapshot() {
        return {
            lastUpdateSample: this.lastUpdateSample ? { ...this.lastUpdateSample } : null,
            lastRenderSample: this.lastRenderSample ? { ...this.lastRenderSample } : null,
            averages: {
                updateMs: this.getAverage(this.recentUpdateSamples, 'totalUpdateMs'),
                renderMs: this.getAverage(this.recentRenderSamples, 'totalRenderMs'),
                particleRenderMs: this.getAverage(this.recentRenderSamples, 'particleRenderMs')
            },
            sampleCounts: {
                updates: this.recentUpdateSamples.length,
                renders: this.recentRenderSamples.length
            }
        };
    }
}

const telemetrySystem = new TelemetrySystem();
