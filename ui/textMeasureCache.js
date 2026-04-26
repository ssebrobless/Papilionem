class TextMeasureCache {
    constructor() {
        this.cache = new Map();
    }

    isEnabled() {
        return !!gameConfig?.performance?.flags?.textMeasureCache;
    }

    getMaxEntries() {
        const configuredMax = Number(gameConfig?.performance?.telemetry?.textMeasureCacheMaxEntries || 4096);
        return Math.max(256, configuredMax || 4096);
    }

    buildKey(graphics, text) {
        const contextFont = graphics?.drawingContext?.font || 'unknown-font';
        return `${contextFont}|${String(text ?? '')}`;
    }

    trim() {
        const maxEntries = this.getMaxEntries();
        while (this.cache.size > maxEntries) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    clear() {
        this.cache.clear();
    }

    measure(graphics, text) {
        const safeText = String(text ?? '');
        if (!graphics?.textWidth || !this.isEnabled()) {
            return graphics?.textWidth ? graphics.textWidth(safeText) : 0;
        }

        const key = this.buildKey(graphics, safeText);
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            this.cache.delete(key);
            this.cache.set(key, cached);
            return cached;
        }

        const width = graphics.textWidth(safeText);
        this.cache.set(key, width);
        this.trim();
        return width;
    }
}

const textMeasureCache = new TextMeasureCache();
