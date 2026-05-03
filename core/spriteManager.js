// Sprite Manager - loads, slices, and caches butterfly sprite assets
// Handles wing composite splitting (4 pieces per type) and background transparency
// Wing images: 1920x1080, Body: 1080x1080, Antenna: 1080x1080

const WING_FILE_MAP = {
    friendly: {
        M: 'male/warm-welcome-wing-full-M.png',
        F: 'female/warm-welcome-wing-full-F.png'
    },
    cautious: {
        M: 'male/delicate-pink-wing-full-M.png',
        F: 'female/delicate-pink-wing-full-F.png'
    },
    energetic: {
        M: 'male/electric-violet-wing-full-M.png',
        F: 'female/electric-violet-wing-full-F.png'
    },
    skittish: {
        M: 'male/nervous-jewel-wing-full-M.png',
        F: 'female/nervous-jewel-wing-full-F.png'
    },
    wise: {
        M: 'male/ancient-scholar-wing-full-M.png',
        F: 'female/ancient-scholar-wing-full-F.png'
    },
    mystic: {
        M: 'male/twilight-dancer-wing-full-M.png',
        F: 'female/twilight-dancer-wing-full-F.png'
    },
    golden: {
        M: 'male/legendary-one-wing-full-M.png',
        F: 'female/legendary-one-wing-full-F.png'
    }
};

const SPRITE_BASE_PATH = 'assets/butterflies/';

// Wing split point — chosen so all 4 anchor points fall in their correct quadrant
const WING_SPLIT_X = 900;
const WING_SPLIT_Y = 600;

class SpriteManager {
    constructor() {
        this.loaded = false;
        this.body = null;           // p5.Image - butterfly body (1080x1080)
        this.antenna = null;        // p5.Image - antennae (1080x1080)
        this.rawWings = { M: {}, F: {} };
        this.wings = { M: {}, F: {} };
        this.wingAtlas = { M: {}, F: {} };
        this.cocoonSprites = {
            unhatched: null,
            hatched: null
        };
        this.caterpillarFrames = [];
        this.bakedSpriteCache = new Map();
        this.bakedSpriteCacheStats = {
            hits: 0,
            misses: 0,
            insertions: 0,
            evictions: 0,
            evictedEstimatedSurfaceMB: 0
        };
        this.pendingCreatureCloseupBakeKeys = new Set();
        this.unsubscribeBattleState = null;
        this.sourceAlphaBounds = new WeakMap();
        this.assetDecodeMode = 'preload-image';
        this.SPRITE_SCALE = 1.0;    // Global scale multiplier for tuning

        // Anchor point system — pixel coordinates from source PNGs
        // Each anchor defines where a sprite piece connects to the body
        this.anchors = {
            body: { centerX: 540, centerY: 540 }, // body image center (1080/2)

            // Wing anchors: onWing = pixel in full wing composite, onBody = pixel in body image
            wings: {
                foreLeft:  { onWing: { x: 841, y: 500 }, onBody: { x: 375, y: 549 } },
                foreRight: { onWing: { x: 968, y: 500 }, onBody: { x: 700, y: 549 } },
                hindLeft:  { onWing: { x: 852, y: 582 }, onBody: { x: 375, y: 682 } },
                hindRight: { onWing: { x: 951, y: 582 }, onBody: { x: 700, y: 682 } },
            },

            // Relative anchors — adjusted for quadrant extraction offset
            wingsRelative: {
                foreLeft:  { x: 841,                y: 500 },                   // quadrant starts at (0,0)
                foreRight: { x: 968 - WING_SPLIT_X, y: 500 },                  // = (68, 500)
                hindLeft:  { x: 852,                y: 582 - WING_SPLIT_Y },    // = (852, -18)
                hindRight: { x: 951 - WING_SPLIT_X, y: 582 - WING_SPLIT_Y },   // = (51, -18)
            },

            // Antenna anchors: onAntenna = pixel in antenna image, onBody = pixel in body image
            antenna: {
                left:  { onAntenna: { x: 494, y: 425 }, onBody: { x: 488, y: 290 } },
                right: { onAntenna: { x: 555, y: 425 }, onBody: { x: 559, y: 290 } },
            }
        };
    }

    shouldUseAsyncImageDecode() {
        return !!(
            gameConfig?.performance?.flags?.asyncImageDecode
            && typeof fetch === 'function'
            && typeof createImageBitmap === 'function'
            && typeof createGraphics === 'function'
        );
    }

    loadImageAsPromise(assetPath) {
        return new Promise((resolve, reject) => {
            loadImage(assetPath, resolve, reject);
        });
    }

    async decodeBitmapToP5Image(assetPath) {
        const response = await fetch(assetPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch sprite asset: ${assetPath}`);
        }
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        const graphics = createGraphics(bitmap.width, bitmap.height);
        graphics.pixelDensity(1);
        graphics.clear();
        graphics.drawingContext.drawImage(bitmap, 0, 0);
        const image = graphics.get();
        if (typeof bitmap.close === 'function') {
            bitmap.close();
        }
        if (typeof graphics.remove === 'function') {
            graphics.remove();
        }
        return image;
    }

    async loadSpriteImage(assetPath) {
        if (this.shouldUseAsyncImageDecode()) {
            try {
                this.assetDecodeMode = 'async-image-decode';
                return await this.decodeBitmapToP5Image(assetPath);
            } catch (error) {
                console.warn('SpriteManager: async image decode fell back to loadImage', {
                    assetPath,
                    message: error?.message || String(error)
                });
            }
        }
        this.assetDecodeMode = 'preload-image';
        return await this.loadImageAsPromise(assetPath);
    }

    async ensureAssetsLoaded() {
        if (this.body && this.antenna && this.caterpillarFrames.length) return;

        this.body = await this.loadSpriteImage(SPRITE_BASE_PATH + 'papilionem-butterfly-body.png');
        this.antenna = await this.loadSpriteImage(SPRITE_BASE_PATH + 'papilionem-butterfly-antenna.png');

        for (const [personality, variants] of Object.entries(WING_FILE_MAP)) {
            this.rawWings.M[personality] = await this.loadSpriteImage(SPRITE_BASE_PATH + variants.M);
            this.rawWings.F[personality] = await this.loadSpriteImage(SPRITE_BASE_PATH + variants.F);
        }

        this.cocoonSprites.unhatched = await this.loadSpriteImage('assets/cocoons/cocoon-unhatched.png');
        this.cocoonSprites.hatched = await this.loadSpriteImage('assets/cocoons/cocoon-hatched.png');
        this.caterpillarFrames = [
            await this.loadSpriteImage('assets/caterpillars/caterpillar-crawl1.png'),
            await this.loadSpriteImage('assets/caterpillars/caterpillar-crawl2.png'),
            await this.loadSpriteImage('assets/caterpillars/caterpillar-crawl3.png')
        ];
    }

    // Called from p5 preload() - loads all raw images
    preloadAssets() {
        if (this.shouldUseAsyncImageDecode()) {
            return;
        }
        this.body = loadImage(SPRITE_BASE_PATH + 'papilionem-butterfly-body.png');
        this.antenna = loadImage(SPRITE_BASE_PATH + 'papilionem-butterfly-antenna.png');

        for (const [personality, variants] of Object.entries(WING_FILE_MAP)) {
            this.rawWings.M[personality] = loadImage(SPRITE_BASE_PATH + variants.M);
            this.rawWings.F[personality] = loadImage(SPRITE_BASE_PATH + variants.F);
        }

        this.cocoonSprites.unhatched = loadImage('assets/cocoons/cocoon-unhatched.png');
        this.cocoonSprites.hatched = loadImage('assets/cocoons/cocoon-hatched.png');
        this.caterpillarFrames = [
            loadImage('assets/caterpillars/caterpillar-crawl1.png'),
            loadImage('assets/caterpillars/caterpillar-crawl2.png'),
            loadImage('assets/caterpillars/caterpillar-crawl3.png')
        ];
    }

    // Called from setup() after preload completes - slices wings and processes transparency
    async initialize() {
        await this.ensureAssetsLoaded();
        this.clearBakedSpriteCache();
        this.sourceAlphaBounds = new WeakMap();
        this.wingAtlas = { M: {}, F: {} };
        this.getSourceAlphaBounds(this.body);
        this.getSourceAlphaBounds(this.antenna);
        this.getSourceAlphaBounds(this.cocoonSprites.unhatched);
        this.getSourceAlphaBounds(this.cocoonSprites.hatched);
        for (const frame of this.caterpillarFrames) {
            this.getSourceAlphaBounds(frame);
        }
        for (const sex of ['M', 'F']) {
            for (const [personality, rawImg] of Object.entries(this.rawWings[sex])) {
                const w = rawImg.width;
                const h = rawImg.height;

                const foreLeft  = rawImg.get(0, 0, WING_SPLIT_X, WING_SPLIT_Y);
                const foreRight = rawImg.get(WING_SPLIT_X, 0, w - WING_SPLIT_X, WING_SPLIT_Y);
                const hindLeft  = rawImg.get(0, WING_SPLIT_Y, WING_SPLIT_X, h - WING_SPLIT_Y);
                const hindRight = rawImg.get(WING_SPLIT_X, WING_SPLIT_Y, w - WING_SPLIT_X, h - WING_SPLIT_Y);

                this._removeBlackBackground(foreLeft);
                this._removeBlackBackground(foreRight);
                this._removeBlackBackground(hindLeft);
                this._removeBlackBackground(hindRight);
                const wingPieces = { foreLeft, foreRight, hindLeft, hindRight };
                this.wings[sex][personality] = wingPieces;
                this.wingAtlas[sex][personality] = {};
                for (const [wingKey, piece] of Object.entries(wingPieces)) {
                    const bounds = this.getSourceAlphaBounds(piece);
                    this.wingAtlas[sex][personality][wingKey] = {
                        image: piece.get(bounds.x, bounds.y, bounds.width, bounds.height),
                        bounds
                    };
                }
            }
        }

        this.rawWings = { M: {}, F: {} };
        this.loaded = true;
        this.installBattleStateListener();

        console.log('SpriteManager: Initialized -', Object.keys(this.wings.M).length * 2, 'sexed wing sets loaded');
    }

    isBakedCreatureSpritesEnabled() {
        return !!(
            gameConfig?.performance?.flags?.bakedCreatureSprites
            && typeof createGraphics === 'function'
        );
    }

    isBakedFlowerHeadsEnabled() {
        return !!(
            gameConfig?.performance?.flags?.bakedFlowerHeads
            && typeof createGraphics === 'function'
        );
    }

    getMaxBakedSpriteCount() {
        return Math.max(1, gameConfig?.performance?.cache?.maxBakedSprites || 256);
    }

    getMaxBakedSpriteSurfaceMB() {
        return Math.max(1, Number(gameConfig?.performance?.cache?.maxBakedSpriteSurfaceMB || 32));
    }

    getCurrentBakedSpriteSurfaceMB() {
        let total = 0;
        for (const entry of this.bakedSpriteCache.values()) {
            total += Number(entry?.estimatedSurfaceMB || this.estimateBakedSurfaceMB(entry?.surface) || 0);
        }
        return total;
    }

    evictOldestBakedSpriteEntry() {
        const oldestKey = this.bakedSpriteCache.keys().next().value;
        if (oldestKey == null) return false;
        const oldest = this.bakedSpriteCache.get(oldestKey);
        this.bakedSpriteCacheStats.evictions = Number(this.bakedSpriteCacheStats.evictions || 0) + 1;
        this.bakedSpriteCacheStats.evictedEstimatedSurfaceMB = Number(this.bakedSpriteCacheStats.evictedEstimatedSurfaceMB || 0)
            + Number(oldest?.estimatedSurfaceMB || this.estimateBakedSurfaceMB(oldest?.surface) || 0);
        oldest?.surface?.remove?.();
        this.bakedSpriteCache.delete(oldestKey);
        return true;
    }

    evictBakedSpriteEntryByKey(key) {
        if (key == null || !this.bakedSpriteCache.has(key)) return false;
        const entry = this.bakedSpriteCache.get(key);
        this.bakedSpriteCacheStats.evictions = Number(this.bakedSpriteCacheStats.evictions || 0) + 1;
        this.bakedSpriteCacheStats.evictedEstimatedSurfaceMB = Number(this.bakedSpriteCacheStats.evictedEstimatedSurfaceMB || 0)
            + Number(entry?.estimatedSurfaceMB || this.estimateBakedSurfaceMB(entry?.surface) || 0);
        entry?.surface?.remove?.();
        this.bakedSpriteCache.delete(key);
        return true;
    }

    installBattleStateListener() {
        if (this.unsubscribeBattleState) {
            this.unsubscribeBattleState();
            this.unsubscribeBattleState = null;
        }
        if (typeof eventBus === 'undefined' || typeof eventBus.on !== 'function') return;
        this.unsubscribeBattleState = eventBus.on('battle:state', (payload = {}) => {
            if (payload?.state !== 'exit') return;
            if (gameConfig?.battle?.closeupBakeEvictOnExit === false) return;
            this.evictCreatureCloseupBakes({
                source: 'battle-exit',
                battleId: payload.battleId || null
            });
        });
    }

    evictCreatureCloseupBakes(options = {}) {
        const source = options?.source || 'inspect-close';
        const enabled = source === 'battle-exit'
            ? gameConfig?.battle?.closeupBakeEvictOnExit !== false
            : gameConfig?.rendering?.creatureBakeEvictOnInspectClose !== false;
        if (!enabled) {
            return {
                enabled: false,
                evicted: 0,
                estimatedSurfaceMB: 0,
                source
            };
        }
        const closeupKeys = [];
        let estimatedSurfaceMB = 0;
        for (const [key, entry] of this.bakedSpriteCache.entries()) {
            const keyText = String(key || '');
            const family = String(entry?.cacheFamily || this.getBakedCacheFamily(keyText) || '');
            const creatureFamily = family.startsWith('body')
                || family.startsWith('wing')
                || family.startsWith('antenna')
                || family.startsWith('caterpillar')
                || family.startsWith('cocoon');
            const isTransientProfile = keyText.includes('profile=closeup')
                || (source === 'battle-exit' && keyText.includes('profile=battle'));
            if (!creatureFamily || !isTransientProfile) continue;
            closeupKeys.push(key);
            estimatedSurfaceMB += Number(entry?.estimatedSurfaceMB || this.estimateBakedSurfaceMB(entry?.surface) || 0);
        }
        let evicted = 0;
        for (const key of closeupKeys) {
            if (this.evictBakedSpriteEntryByKey(key)) evicted += 1;
        }
        return {
            enabled: true,
            evicted,
            estimatedSurfaceMB: Number(estimatedSurfaceMB.toFixed(4)),
            source,
            battleId: options?.battleId || null
        };
    }

    scheduleAsyncCreatureCloseupBake(entity, options = {}) {
        if (gameConfig?.rendering?.creatureBakeAsyncOnInspect === false) {
            return { enabled: false, scheduled: false };
        }
        if (!entity?.id || !this.isBakedCreatureSpritesEnabled?.()) {
            return { enabled: true, scheduled: false, reason: 'unavailable' };
        }
        const spec = entity.getRenderSpec?.();
        if (!spec || !this.hasRenderableSpec?.(spec)) {
            return { enabled: true, scheduled: false, reason: 'missing-spec' };
        }
        const size = Number(entity.size || 14);
        const bodyScale = ((size * this.SPRITE_SCALE) / 1080) * Number(entity.getBodySpriteScale?.() || 1);
        const wingScale = ((size * this.SPRITE_SCALE) / 1080) * Number(entity.getWingSpriteScale?.() || 1) * 1.45;
        const appearanceKey = this.getAppearanceKey(spec);
        const pendingKey = [
            entity.id,
            appearanceKey,
            bodyScale.toFixed(6),
            wingScale.toFixed(6)
        ].join('|');
        if (this.pendingCreatureCloseupBakeKeys.has(pendingKey)) {
            return { enabled: true, scheduled: false, pending: true, key: pendingKey };
        }

        this.pendingCreatureCloseupBakeKeys.add(pendingKey);
        const runBake = () => {
            try {
                if (gameConfig?.rendering?.creatureBakeAsyncOnInspect === false) return;
                const bakeOptions = {
                    lod: 'closeup',
                    closeup: true,
                    async: true,
                    asyncPrewarm: true,
                    entityId: entity.id,
                    openedAtFrame: options.currentFrame ?? options.frame ?? null
                };
                this.getBakedBodySpriteData?.(spec, bodyScale, bakeOptions);
                this.getBakedAntennaSpriteData?.(spec, bodyScale, bakeOptions);
                for (const wingKey of ['foreLeft', 'foreRight', 'hindLeft', 'hindRight']) {
                    this.getBakedWingPieceData?.(spec, wingKey, wingScale, bakeOptions);
                }
            } finally {
                this.pendingCreatureCloseupBakeKeys.delete(pendingKey);
            }
        };

        if (typeof queueMicrotask === 'function') {
            queueMicrotask(runBake);
        } else if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(runBake);
        } else if (typeof setTimeout === 'function') {
            setTimeout(runBake, 0);
        } else {
            runBake();
        }
        return { enabled: true, scheduled: true, key: pendingKey };
    }

    normalizeBakedSpriteDimension(value) {
        return Math.max(1, Math.round(value || 0));
    }

    quantizeBakedSpriteDimension(value, step = 2) {
        const normalized = this.normalizeBakedSpriteDimension(value);
        return Math.max(step, Math.round(normalized / step) * step);
    }

    getWingDimensionStep() {
        return Math.max(1, gameConfig?.performance?.cache?.wingDimensionStep || 4);
    }

    getWingSpreadBucketCount() {
        return Math.max(
            4,
            gameConfig?.performance?.cache?.wingPoseSpreadBuckets
            || gameConfig?.performance?.cache?.wingSpreadBuckets
            || 12
        );
    }

    getWingPoseSpreadDelta() {
        return Math.max(0, gameConfig?.performance?.cache?.wingPoseSpreadDelta || 0.16);
    }

    getFlowerWaveBucketCount() {
        return Math.max(4, gameConfig?.performance?.cache?.flowerWaveBuckets || 12);
    }

    normalizeColorSignature(color, fallback = '0-0-0') {
        if (!Array.isArray(color) || color.length < 3) return fallback;
        return color
            .slice(0, 3)
            .map(channel => this.normalizeBakedSpriteDimension(channel))
            .join('-');
    }

    quantizeFlowerWavePhase(phase) {
        const bucketCount = this.getFlowerWaveBucketCount();
        const twoPi = typeof TWO_PI === 'number' ? TWO_PI : (Math.PI * 2);
        const normalized = ((Number(phase) || 0) % twoPi + twoPi) % twoPi;
        const bucketIndex = Math.max(
            0,
            Math.min(bucketCount - 1, Math.round((normalized / twoPi) * (bucketCount - 1)))
        );
        const quantized = (bucketIndex / Math.max(1, bucketCount - 1)) * twoPi;
        return {
            bucketIndex,
            phase: Number(quantized.toFixed(4))
        };
    }

    shouldUseBakedWingPose(wingKey, spread, battleActiveOverride = null) {
        if (!this.isBakedCreatureSpritesEnabled()) return false;
        if (!Number.isFinite(spread)) return false;
        const battleOnly = gameConfig?.performance?.cache?.wingPoseBattleOnly !== false;
        if (battleOnly) {
            const battleActive = battleActiveOverride === null
                ? !!renderManager?.getRenderContext?.().battleActive
                : !!battleActiveOverride;
            if (!battleActive) {
                return false;
            }
        }
        const foreOnly = gameConfig?.performance?.cache?.wingPoseForeOnly !== false;
        if (foreOnly && !String(wingKey || '').startsWith('fore')) {
            return false;
        }
        return Math.abs(spread - 1) >= this.getWingPoseSpreadDelta();
    }

    quantizeWingSpread(spread) {
        const clamped = Math.max(0.3, Math.min(1, Number(spread) || 1));
        const bucketCount = this.getWingSpreadBucketCount();
        const normalized = (clamped - 0.3) / 0.7;
        const bucketIndex = Math.max(0, Math.min(bucketCount - 1, Math.round(normalized * (bucketCount - 1))));
        const quantized = 0.3 + ((bucketIndex / Math.max(1, bucketCount - 1)) * 0.7);
        return Number(quantized.toFixed(4));
    }

    getWingSourceSignature(spec, wingKey) {
        const donor = spec?.hybridGenome?.wingDonors?.[wingKey];
        if (donor?.personalityType) {
            return `${wingKey}:${donor.personalityType}:${donor.sex || spec?.sex || 'F'}`;
        }

        const sex = spec?.sex || 'F';
        const personalityType = spec?.personalityType === 'hybrid'
            ? (spec?.baseType || 'friendly')
            : (spec?.personalityType || 'friendly');
        return `${wingKey}:${personalityType}:${sex}`;
    }

    getAppearanceKey(spec) {
        const sex = spec?.sex || 'F';
        const personalityType = spec?.personalityType || 'friendly';
        const baseType = personalityType === 'hybrid'
            ? (spec?.baseType || 'friendly')
            : (spec?.baseType || personalityType);
        const wingSignature = ['foreLeft', 'foreRight', 'hindLeft', 'hindRight']
            .map(wingKey => this.getWingSourceSignature(spec, wingKey))
            .join('|');
        return [
            `sex=${sex}`,
            `personality=${personalityType}`,
            `base=${baseType}`,
            `wings=${wingSignature}`
        ].join('|');
    }

    clearBakedSpriteCache() {
        for (const entry of this.bakedSpriteCache.values()) {
            entry?.surface?.remove?.();
        }
        this.bakedSpriteCache.clear();
        this.bakedSpriteCacheStats = {
            hits: 0,
            misses: 0,
            insertions: 0,
            evictions: 0,
            evictedEstimatedSurfaceMB: 0
        };
    }

    getBakedCacheFamily(key) {
        const family = String(key || '').split('|')[0] || 'unknown';
        return family || 'unknown';
    }

    getBakedCacheDimensions(key, entry = null) {
        const surfaceWidth = Number(entry?.surface?.width || entry?.surfaceWidth || entry?.drawWidth || 0);
        const surfaceHeight = Number(entry?.surface?.height || entry?.surfaceHeight || entry?.drawHeight || 0);
        if (surfaceWidth > 0 && surfaceHeight > 0) {
            return {
                width: surfaceWidth,
                height: surfaceHeight
            };
        }
        const match = String(key || '').match(/(\d+)x(\d+)$/);
        if (!match) {
            return { width: 0, height: 0 };
        }
        return {
            width: Number(match[1] || 0),
            height: Number(match[2] || 0)
        };
    }

    estimateBakedSurfaceMB(surface) {
        const width = Number(surface?.width || 0);
        const height = Number(surface?.height || 0);
        if (width <= 0 || height <= 0) return 0;
        return (width * height * 4) / (1024 * 1024);
    }

    getBakedSpriteCacheTelemetry() {
        const stats = this.bakedSpriteCacheStats || {};
        const familyTotals = {};
        let estimatedSurfaceMB = 0;
        for (const [key, entry] of this.bakedSpriteCache.entries()) {
            const family = entry?.cacheFamily || this.getBakedCacheFamily(key);
            const dimensions = this.getBakedCacheDimensions(key, entry);
            const familyBucket = familyTotals[family] || {
                family,
                entryCount: 0,
                estimatedSurfaceMB: 0,
                uniqueSizes: new Set(),
                maxWidth: 0,
                maxHeight: 0
            };
            familyBucket.entryCount += 1;
            const surfaceMB = Number(entry?.estimatedSurfaceMB || this.estimateBakedSurfaceMB(entry?.surface) || 0);
            familyBucket.estimatedSurfaceMB += surfaceMB;
            estimatedSurfaceMB += surfaceMB;
            if (dimensions.width > 0 && dimensions.height > 0) {
                familyBucket.uniqueSizes.add(`${dimensions.width}x${dimensions.height}`);
                familyBucket.maxWidth = Math.max(familyBucket.maxWidth, dimensions.width);
                familyBucket.maxHeight = Math.max(familyBucket.maxHeight, dimensions.height);
            }
            familyTotals[family] = familyBucket;
        }

        const families = Object.values(familyTotals)
            .map(family => ({
                family: family.family,
                entryCount: family.entryCount,
                estimatedSurfaceMB: Number(family.estimatedSurfaceMB.toFixed(4)),
                uniqueSizeCount: family.uniqueSizes.size,
                maxWidth: family.maxWidth,
                maxHeight: family.maxHeight
            }))
            .sort((left, right) => {
                if (right.estimatedSurfaceMB !== left.estimatedSurfaceMB) {
                    return right.estimatedSurfaceMB - left.estimatedSurfaceMB;
                }
                return right.entryCount - left.entryCount;
            });

        return {
            enabled: this.isBakedCreatureSpritesEnabled(),
            entryCount: this.bakedSpriteCache.size,
            familyCount: families.length,
            maxEntries: this.getMaxBakedSpriteCount(),
            estimatedSurfaceMB: Number(estimatedSurfaceMB.toFixed(4)),
            cacheHits: Number(stats.hits || 0),
            cacheMisses: Number(stats.misses || 0),
            insertions: Number(stats.insertions || 0),
            evictions: Number(stats.evictions || 0),
            evictedEstimatedSurfaceMB: Number((stats.evictedEstimatedSurfaceMB || 0).toFixed(4)),
            families,
            topFamilies: families.slice(0, 4).map(entry => ({ ...entry })),
            debugLine: `baked sprites: ${Number(stats.hits || 0)}/${Number(stats.misses || 0)} | ${families.length} families | ${this.bakedSpriteCache.size} entries | ${Number(estimatedSurfaceMB.toFixed(4)).toFixed(2)}MB`
        };
    }

    getSourceAlphaBounds(image) {
        if (!image) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        const cached = this.sourceAlphaBounds.get(image);
        if (cached) return cached;

        const imageData = this.getImageReadbackData(image);
        const data = imageData?.data || [];
        let minX = image.width;
        let minY = image.height;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < image.height; y += 1) {
            for (let x = 0; x < image.width; x += 1) {
                const alpha = data[((y * image.width) + x) * 4 + 3];
                if (alpha > 0) {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }

        const bounds = maxX >= minX && maxY >= minY
            ? {
                x: minX,
                y: minY,
                width: (maxX - minX) + 1,
                height: (maxY - minY) + 1
            }
            : {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height
            };
        this.sourceAlphaBounds.set(image, bounds);
        return bounds;
    }

    getImageReadbackData(image) {
        if (!image) return null;
        if (typeof document === 'undefined' || !image.canvas) {
            image.loadPixels?.();
            return {
                data: image.pixels || [],
                width: image.width || 0,
                height: image.height || 0
            };
        }

        const canvas = document.createElement('canvas');
        canvas.width = image.width || image.canvas.width || 1;
        canvas.height = image.height || image.canvas.height || 1;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;
        ctx.drawImage(image.canvas, 0, 0, canvas.width, canvas.height);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    expandBounds(bounds, image, padding = 1) {
        if (!bounds || !image) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        const x = Math.max(0, bounds.x - padding);
        const y = Math.max(0, bounds.y - padding);
        const maxX = Math.min(image.width, bounds.x + bounds.width + padding);
        const maxY = Math.min(image.height, bounds.y + bounds.height + padding);
        return {
            x,
            y,
            width: Math.max(1, maxX - x),
            height: Math.max(1, maxY - y)
        };
    }

    createBakedSurface(width, height, drawFn, options = {}) {
        const { smooth = true, surfaceScale = 1 } = options;
        const bakeScale = Math.max(1, Number(surfaceScale) || 1);
        const bakedWidth = this.normalizeBakedSpriteDimension(width * bakeScale);
        const bakedHeight = this.normalizeBakedSpriteDimension(height * bakeScale);
        const surface = createGraphics(bakedWidth, bakedHeight);
        surface.pixelDensity(1);
        surface.clear();
        if (smooth) {
            surface.smooth();
            if (surface.drawingContext) {
                surface.drawingContext.imageSmoothingEnabled = true;
            }
        } else {
            surface.noSmooth();
            if (surface.drawingContext) {
                surface.drawingContext.imageSmoothingEnabled = false;
            }
        }
        drawFn(surface, bakedWidth, bakedHeight);
        return surface;
    }

    getCreatureBakeMode() {
        return gameConfig?.rendering?.creatureBakeMode || 'fixed-high-res';
    }

    getCreatureBakeProfile(options = {}) {
        const battleActive = options?.battleActive === true
            || (
                options?.closeup === true
                && typeof renderManager !== 'undefined'
                && !!renderManager.getRenderContext?.().battleActive
            );
        if (battleActive && gameConfig?.rendering?.creatureLodBattleSize) return 'battle';
        return options?.closeup || options?.lod === 'closeup' ? 'closeup' : 'garden';
    }

    isFixedHighResCreatureBakeEnabled(options = {}) {
        if (gameConfig?.rendering?.creatureBakeSize?.enabled === false) return false;
        return this.getCreatureBakeMode(options) !== 'display-size';
    }

    getCreatureBakeConfigForKind(kind, options = {}) {
        const rendering = gameConfig?.rendering || {};
        const profile = this.getCreatureBakeProfile(options);
        const source = profile === 'battle'
            ? rendering.creatureLodBattleSize || rendering.creatureLodCloseupSize || rendering.creatureBakeSize || {}
            : (profile === 'closeup'
                ? rendering.creatureLodCloseupSize || rendering.creatureBakeSize || {}
                : rendering.creatureBakeSize || {});
        const fallback = {
            body: 96,
            wing: { width: 128, height: 96 },
            antenna: 48
        };
        const value = source?.[kind] ?? fallback[kind];
        if (kind === 'wing') {
            return {
                width: this.normalizeBakedSpriteDimension(value?.width || fallback.wing.width),
                height: this.normalizeBakedSpriteDimension(value?.height || fallback.wing.height)
            };
        }
        return this.normalizeBakedSpriteDimension(value || fallback[kind] || 96);
    }

    resolveCreatureBakeDimensions(kind, displayWidth, displayHeight, options = {}) {
        const mode = this.getCreatureBakeMode(options);
        const profile = this.getCreatureBakeProfile(options);
        if (!this.isFixedHighResCreatureBakeEnabled(options)) {
            const surfaceScale = kind === 'wing' ? 2 : 1;
            return {
                mode: 'display-size',
                profile,
                width: this.normalizeBakedSpriteDimension(displayWidth),
                height: this.normalizeBakedSpriteDimension(displayHeight),
                surfaceScale
            };
        }
        const configured = this.getCreatureBakeConfigForKind(kind, options);
        if (kind === 'wing') {
            return {
                mode,
                profile,
                width: Math.max(96, configured.width),
                height: Math.max(96, configured.height),
                surfaceScale: 1
            };
        }
        const min = kind === 'body' ? 96 : 48;
        const size = Math.max(min, configured);
        return {
            mode,
            profile,
            width: size,
            height: size,
            surfaceScale: 1
        };
    }

    buildTrimmedCreatureEntry(cacheFamily, drawWidth, drawHeight, bounds, drawSource, options = {}) {
        const bake = this.resolveCreatureBakeDimensions(cacheFamily, drawWidth, drawHeight, options);
        return {
            cacheFamily: `${cacheFamily}-trimmed`,
            surface: this.createBakedSurface(
                bake.width,
                bake.height,
                (renderSurface, bakedWidth, bakedHeight) => drawSource(renderSurface, bakedWidth, bakedHeight),
                { smooth: true, surfaceScale: bake.surfaceScale }
            ),
            surfaceWidth: this.normalizeBakedSpriteDimension(bake.width * bake.surfaceScale),
            surfaceHeight: this.normalizeBakedSpriteDimension(bake.height * bake.surfaceScale),
            drawWidth,
            drawHeight,
            bounds,
            bakeMode: bake.mode,
            bakeProfile: bake.profile,
            bakeWidth: bake.width,
            bakeHeight: bake.height
        };
    }

    getCachedBakedEntry(key, buildFn) {
        return this.getCachedBakedEntryIfEnabled(this.isBakedCreatureSpritesEnabled(), key, buildFn);
    }

    getCachedBakedEntryIfEnabled(enabled, key, buildFn) {
        if (!enabled) return null;

        const existing = this.bakedSpriteCache.get(key);
        if (existing) {
            this.bakedSpriteCacheStats.hits = Number(this.bakedSpriteCacheStats.hits || 0) + 1;
            this.bakedSpriteCache.delete(key);
            this.bakedSpriteCache.set(key, existing);
            return existing;
        }
        this.bakedSpriteCacheStats.misses = Number(this.bakedSpriteCacheStats.misses || 0) + 1;

        const entry = buildFn();
        if (!entry?.surface) return null;
        entry.cacheKey = key;
        entry.cacheFamily = entry.cacheFamily || this.getBakedCacheFamily(key);
        entry.estimatedSurfaceMB = Number(
            (entry.estimatedSurfaceMB || this.estimateBakedSurfaceMB(entry.surface) || 0).toFixed(4)
        );

        this.bakedSpriteCache.set(key, entry);
        this.bakedSpriteCacheStats.insertions = Number(this.bakedSpriteCacheStats.insertions || 0) + 1;
        while (
            this.bakedSpriteCache.size > this.getMaxBakedSpriteCount()
            || this.getCurrentBakedSpriteSurfaceMB() > this.getMaxBakedSpriteSurfaceMB()
        ) {
            if (!this.evictOldestBakedSpriteEntry()) break;
        }
        return entry;
    }

    getCachedBakedSurface(key, buildFn) {
        return this.getCachedBakedSurfaceIfEnabled(this.isBakedCreatureSpritesEnabled(), key, buildFn);
    }

    getCachedBakedSurfaceIfEnabled(enabled, key, buildFn) {
        const entry = this.getCachedBakedEntryIfEnabled(enabled, key, () => {
            const surface = buildFn();
            return surface ? { surface } : null;
        });
        return entry?.surface || null;
    }

    getBakedFlowerHeadData(flower, options = {}) {
        if (!this.isBakedFlowerHeadsEnabled() || !flower) return null;

        const petalCount = Math.max(3, Math.round(flower.petalCount || 7));
        const baseSize = this.normalizeBakedSpriteDimension(options.baseSize || flower.size || 13);
        const centerSize = this.normalizeBakedSpriteDimension(options.centerSize || 8);
        const waveSpeed = Number(options.waveSpeed || flower?.animation?.petalWaveSpeed || 0.02);
        const waveInfo = this.quantizeFlowerWavePhase(
            options.wavePhase ?? (((options.frameCount ?? frameCount ?? 0) * waveSpeed) || 0)
        );
        const petalColorKey = this.normalizeColorSignature(options.petalColor || flower.petalColor);
        const accentColorKey = this.normalizeColorSignature(options.accentColor || flower.accentColor);
        const centerColorKey = this.normalizeColorSignature(options.centerColor || flower.centerColor);
        const padding = Math.max(8, Math.ceil(baseSize * 0.92));
        const drawWidth = this.normalizeBakedSpriteDimension((baseSize * 2.4) + (padding * 2));
        const drawHeight = this.normalizeBakedSpriteDimension((baseSize * 2.1) + (padding * 2));
        const cacheKey = `flower-head|type=${flower.flowerType || 'garden-bloom'}|petals=${petalCount}|size=${baseSize}|center=${centerSize}|petal=${petalColorKey}|accent=${accentColorKey}|centerColor=${centerColorKey}|wave=${waveInfo.bucketIndex}|${drawWidth}x${drawHeight}`;
        return this.getCachedBakedEntryIfEnabled(true, cacheKey, () => ({
            cacheFamily: 'flower-head',
            drawWidth,
            drawHeight,
            anchorX: drawWidth / 2,
            anchorY: drawHeight / 2,
            surface: this.createBakedSurface(
                drawWidth,
                drawHeight,
                (surface, bakedWidth, bakedHeight) => {
                    const centerX = bakedWidth / 2;
                    const centerY = bakedHeight / 2;
                    const petalColor = options.petalColor || flower.petalColor || [255, 180, 120];
                    const accentColor = options.accentColor || flower.accentColor || [210, 140, 100];
                    const centerColor = options.centerColor || flower.centerColor || [255, 240, 180];

                    surface.push();
                    surface.translate(centerX, centerY);
                    surface.strokeWeight(2);
                    surface.stroke(0, 0, 0, 255 * 0.28);

                    for (let i = 0; i < petalCount; i += 1) {
                        const angle = (TWO_PI / petalCount) * i;
                        const petalWave = sin(waveInfo.phase + i) * 0.08 + 1;

                        surface.push();
                        surface.rotate(angle);
                        surface.fill(petalColor[0], petalColor[1], petalColor[2], 255);
                        surface.ellipse(baseSize * 0.56, 0, baseSize * 0.92 * petalWave, baseSize * 0.42);
                        surface.fill(accentColor[0], accentColor[1], accentColor[2], 255 * 0.42);
                        surface.ellipse(baseSize * 0.66, 0, baseSize * 0.42, baseSize * 0.18);
                        surface.fill(255, 255, 255, 255 * 0.16);
                        surface.ellipse(baseSize * 0.72, -0.2, baseSize * 0.18, baseSize * 0.12);
                        surface.pop();
                    }

                    surface.noStroke();
                    surface.fill(centerColor[0], centerColor[1], centerColor[2], 255);
                    surface.ellipse(0, 0, centerSize, centerSize);
                    surface.fill(0, 0, 0, 255 * 0.2);
                    const dotCount = Math.min(5, Math.floor(centerSize / 2));
                    for (let i = 0; i < dotCount; i += 1) {
                        const angle = (TWO_PI / dotCount) * i;
                        const radius = centerSize * 0.25;
                        surface.ellipse(cos(angle) * radius, sin(angle) * radius, 2, 2);
                    }
                    surface.pop();
                },
                { smooth: true }
            )
        }));
    }

    getBakedBodySprite(spec, targetWidth, targetHeight) {
        if (!this.body) return null;
        const bakedWidth = this.normalizeBakedSpriteDimension(targetWidth);
        const bakedHeight = this.normalizeBakedSpriteDimension(targetHeight);
        const cacheKey = `body|${spec?.sex || 'F'}|${bakedWidth}x${bakedHeight}`;
        return this.getCachedBakedSurface(cacheKey, () => this.createBakedSurface(
            bakedWidth,
            bakedHeight,
            surface => surface.image(this.body, 0, 0, bakedWidth, bakedHeight),
            { smooth: true }
        ));
    }

    getBakedBodySpriteData(spec, targetScale, options = {}) {
        if (!this.body) return null;
        const bounds = this.expandBounds(this.getSourceAlphaBounds(this.body), this.body, 2);
        const drawWidth = this.normalizeBakedSpriteDimension(bounds.width * targetScale);
        const drawHeight = this.normalizeBakedSpriteDimension(bounds.height * targetScale);
        const xScale = drawWidth / Math.max(1, bounds.width);
        const yScale = drawHeight / Math.max(1, bounds.height);
        const bake = this.resolveCreatureBakeDimensions('body', drawWidth, drawHeight, options);
        const cacheKey = `body-trimmed|mode=${bake.mode}|profile=${bake.profile}|${bake.width}x${bake.height}`;
        const entry = this.getCachedBakedEntry(cacheKey, () => this.buildTrimmedCreatureEntry(
            'body',
            drawWidth,
            drawHeight,
            bounds,
            (renderSurface, bakedWidth, bakedHeight) => renderSurface.image(
                this.body,
                0,
                0,
                bakedWidth,
                bakedHeight,
                bounds.x,
                bounds.y,
                bounds.width,
                bounds.height
            ),
            options
        ));
        if (!entry) return null;
        return {
            ...entry,
            drawWidth,
            drawHeight,
            offsetX: (-this.body.width * xScale / 2) + (bounds.x * xScale),
            offsetY: (-this.body.height * yScale / 2) + (bounds.y * yScale)
        };
    }

    getBakedAntennaSprite(spec, targetWidth, targetHeight) {
        if (!this.antenna) return null;
        const bakedWidth = this.normalizeBakedSpriteDimension(targetWidth);
        const bakedHeight = this.normalizeBakedSpriteDimension(targetHeight);
        const cacheKey = `antenna|${spec?.sex || 'F'}|${bakedWidth}x${bakedHeight}`;
        return this.getCachedBakedSurface(cacheKey, () => this.createBakedSurface(
            bakedWidth,
            bakedHeight,
            surface => surface.image(this.antenna, 0, 0, bakedWidth, bakedHeight),
            { smooth: true }
        ));
    }

    getBakedAntennaSpriteData(spec, targetScale, options = {}) {
        if (!this.antenna) return null;
        const bounds = this.expandBounds(this.getSourceAlphaBounds(this.antenna), this.antenna, 2);
        const drawWidth = this.normalizeBakedSpriteDimension(bounds.width * targetScale);
        const drawHeight = this.normalizeBakedSpriteDimension(bounds.height * targetScale);
        const xScale = drawWidth / Math.max(1, bounds.width);
        const yScale = drawHeight / Math.max(1, bounds.height);
        const antennaAnchors = this.anchors?.antenna || {};
        const bake = this.resolveCreatureBakeDimensions('antenna', drawWidth, drawHeight, options);
        const cacheKey = `antenna-trimmed|mode=${bake.mode}|profile=${bake.profile}|${bake.width}x${bake.height}`;
        const entry = this.getCachedBakedEntry(cacheKey, () => this.buildTrimmedCreatureEntry(
            'antenna',
            drawWidth,
            drawHeight,
            bounds,
            (renderSurface, bakedWidth, bakedHeight) => renderSurface.image(
                this.antenna,
                0,
                0,
                bakedWidth,
                bakedHeight,
                bounds.x,
                bounds.y,
                bounds.width,
                bounds.height
            ),
            options
        ));
        if (!entry) return null;
        return {
            ...entry,
            drawWidth,
            drawHeight,
            anchors: {
                left: antennaAnchors.left
                    ? {
                        x: (antennaAnchors.left.onAntenna.x - bounds.x) * xScale,
                        y: (antennaAnchors.left.onAntenna.y - bounds.y) * yScale
                    }
                    : { x: 0, y: 0 },
                right: antennaAnchors.right
                    ? {
                        x: (antennaAnchors.right.onAntenna.x - bounds.x) * xScale,
                        y: (antennaAnchors.right.onAntenna.y - bounds.y) * yScale
                    }
                    : { x: 0, y: 0 }
            }
        };
    }

    getBakedWingPiece(spec, wingKey, targetWidth, targetHeight) {
        const piece = this.getWingPieceForSpec(spec, wingKey);
        if (!piece) return null;
        const bakedWidth = this.normalizeBakedSpriteDimension(targetWidth);
        const bakedHeight = this.normalizeBakedSpriteDimension(targetHeight);
        const cacheKey = `wing|${this.getAppearanceKey(spec)}|${this.getWingSourceSignature(spec, wingKey)}|${bakedWidth}x${bakedHeight}`;
        return this.getCachedBakedSurfaceIfEnabled(this.isBakedCreatureSpritesEnabled(), cacheKey, () => this.createBakedSurface(
            bakedWidth,
            bakedHeight,
            surface => surface.image(piece, 0, 0, bakedWidth, bakedHeight),
            { smooth: true }
        ));
    }

    getBakedWingPieceData(spec, wingKey, targetScale, options = {}) {
        const atlasEntry = this.isSpriteAtlasEnabled() ? this.getWingAtlasPieceForSpec(spec, wingKey) : null;
        const piece = atlasEntry?.image || this.getWingPieceForSpec(spec, wingKey);
        if (!piece) return null;

        const bounds = atlasEntry?.bounds || this.getSourceAlphaBounds(piece);
        const relAnchor = this.anchors?.wingsRelative?.[wingKey];
        const dimensionStep = this.getWingDimensionStep();
        const drawWidth = this.quantizeBakedSpriteDimension(bounds.width * targetScale, dimensionStep);
        const drawHeight = this.quantizeBakedSpriteDimension(bounds.height * targetScale, dimensionStep);
        const xScale = drawWidth / Math.max(1, bounds.width);
        const yScale = drawHeight / Math.max(1, bounds.height);
        const bake = this.resolveCreatureBakeDimensions('wing', drawWidth, drawHeight, options);
        const cacheKey = `wing-trimmed|${atlasEntry ? 'atlas' : 'raw'}|mode=${bake.mode}|profile=${bake.profile}|${this.getAppearanceKey(spec)}|${this.getWingSourceSignature(spec, wingKey)}|${bake.width}x${bake.height}`;
        const entry = this.getCachedBakedEntryIfEnabled(this.isBakedCreatureSpritesEnabled(), cacheKey, () => this.buildTrimmedCreatureEntry(
            'wing',
            drawWidth,
            drawHeight,
            bounds,
            (renderSurface, bakedWidth, bakedHeight) => atlasEntry
                ? renderSurface.image(piece, 0, 0, bakedWidth, bakedHeight)
                : renderSurface.image(
                    piece,
                    0,
                    0,
                    bakedWidth,
                    bakedHeight,
                    bounds.x,
                    bounds.y,
                    bounds.width,
                    bounds.height
                ),
            options
        ));
        if (!entry) return null;
        return {
            ...entry,
            drawWidth,
            drawHeight,
            anchorX: relAnchor ? (relAnchor.x - bounds.x) * xScale : 0,
            anchorY: relAnchor ? (relAnchor.y - bounds.y) * yScale : 0
        };
    }

    getBakedWingPoseData(spec, wingKey, targetScale, spread = 1, options = {}) {
        const atlasEntry = this.isSpriteAtlasEnabled() ? this.getWingAtlasPieceForSpec(spec, wingKey) : null;
        const piece = atlasEntry?.image || this.getWingPieceForSpec(spec, wingKey);
        if (!piece) return null;

        const bounds = atlasEntry?.bounds || this.getSourceAlphaBounds(piece);
        const relAnchor = this.anchors?.wingsRelative?.[wingKey];
        const spreadBucket = this.quantizeWingSpread(spread);
        const dimensionStep = this.getWingDimensionStep();
        const drawWidth = this.quantizeBakedSpriteDimension(bounds.width * targetScale * spreadBucket, dimensionStep);
        const drawHeight = this.quantizeBakedSpriteDimension(bounds.height * targetScale, dimensionStep);
        const xScale = drawWidth / Math.max(1, bounds.width);
        const yScale = drawHeight / Math.max(1, bounds.height);
        const bake = this.resolveCreatureBakeDimensions('wing', drawWidth, drawHeight, options);
        const cacheKey = `wing-pose|${atlasEntry ? 'atlas' : 'raw'}|mode=${bake.mode}|profile=${bake.profile}|${this.getAppearanceKey(spec)}|${this.getWingSourceSignature(spec, wingKey)}|spread=${spreadBucket}|${bake.width}x${bake.height}`;
        const entry = this.getCachedBakedEntryIfEnabled(this.isBakedCreatureSpritesEnabled(), cacheKey, () => this.buildTrimmedCreatureEntry(
            'wing',
            drawWidth,
            drawHeight,
            bounds,
            (renderSurface, bakedWidth, bakedHeight) => atlasEntry
                ? renderSurface.image(piece, 0, 0, bakedWidth, bakedHeight)
                : renderSurface.image(
                    piece,
                    0,
                    0,
                    bakedWidth,
                    bakedHeight,
                    bounds.x,
                    bounds.y,
                    bounds.width,
                    bounds.height
                ),
            options
        ));
        if (!entry) return null;
        return {
            ...entry,
            drawWidth,
            drawHeight,
            spreadBucket,
            anchorX: relAnchor ? (relAnchor.x - bounds.x) * xScale : 0,
            anchorY: relAnchor ? (relAnchor.y - bounds.y) * yScale : 0
        };
    }


    getBakedCaterpillarFrame(frameIndex, targetWidth, targetHeight) {
        const frame = this.caterpillarFrames?.[frameIndex];
        if (!frame) return null;
        const bakedWidth = this.normalizeBakedSpriteDimension(targetWidth);
        const bakedHeight = this.normalizeBakedSpriteDimension(targetHeight);
        const cacheKey = `caterpillar|frame=${frameIndex}|${bakedWidth}x${bakedHeight}`;
        return this.getCachedBakedSurface(cacheKey, () => this.createBakedSurface(
            bakedWidth,
            bakedHeight,
            surface => surface.image(frame, 0, 0, bakedWidth, bakedHeight),
            { smooth: true }
        ));
    }

    getBakedCaterpillarFrameData(frameIndex, targetScale) {
        const frame = this.caterpillarFrames?.[frameIndex];
        if (!frame) return null;

        const bounds = this.expandBounds(this.getSourceAlphaBounds(frame), frame, 1);
        const drawWidth = this.normalizeBakedSpriteDimension(bounds.width * targetScale);
        const drawHeight = this.normalizeBakedSpriteDimension(bounds.height * targetScale);
        const cacheKey = `caterpillar-trimmed|frame=${frameIndex}|${drawWidth}x${drawHeight}`;
        return this.getCachedBakedEntry(cacheKey, () => ({
            surface: this.createBakedSurface(
                drawWidth,
                drawHeight,
                renderSurface => renderSurface.image(
                    frame,
                    0,
                    0,
                    drawWidth,
                    drawHeight,
                    bounds.x,
                    bounds.y,
                    bounds.width,
                    bounds.height
                ),
                { smooth: true }
            ),
            drawWidth,
            drawHeight,
            bounds,
            offsetX: (-frame.width * targetScale / 2) + (bounds.x * targetScale),
            offsetY: (-frame.height * targetScale / 2) + (bounds.y * targetScale)
        }));
    }

    getBakedCocoonSprite(state, targetWidth, targetHeight) {
        const sprite = state === 'hatched' ? this.cocoonSprites.hatched : this.cocoonSprites.unhatched;
        if (!sprite) return null;
        const bakedWidth = this.normalizeBakedSpriteDimension(targetWidth);
        const bakedHeight = this.normalizeBakedSpriteDimension(targetHeight);
        const cacheKey = `cocoon|${state}|${bakedWidth}x${bakedHeight}`;
        return this.getCachedBakedSurface(cacheKey, () => this.createBakedSurface(
            bakedWidth,
            bakedHeight,
            surface => surface.image(sprite, 0, 0, bakedWidth, bakedHeight),
            { smooth: true }
        ));
    }

    // Convert near-black pixels to transparent
    // Conservative threshold preserves dark wing details (e.g. electric-violet's dark blues)
    _removeBlackBackground(img) {
        const imageData = this.getImageReadbackData(img);
        const d = imageData?.data || [];
        for (let i = 0; i < d.length; i += 4) {
            if (d[i] + d[i + 1] + d[i + 2] < 30) {
                d[i + 3] = 0;
            }
        }
        if (img?.drawingContext && imageData) {
            img.drawingContext.putImageData(imageData, 0, 0);
            img._modified = true;
        } else {
            img.updatePixels?.();
        }
    }

    hasWings(personalityType, sex = 'F') {
        return this.loaded && this.wings[sex] && this.wings[sex][personalityType] != null;
    }

    hasBody() {
        return this.loaded && this.body != null;
    }

    hasAntenna() {
        return this.loaded && this.antenna != null;
    }

    getWingPieceForSpec(spec, wingKey) {
        if (!spec) return null;

        if (spec.hybridGenome?.wingDonors?.[wingKey]) {
            const donor = spec.hybridGenome.wingDonors[wingKey];
            const donorSet = this.wings[donor.sex] && this.wings[donor.sex][donor.personalityType];
            return donorSet ? donorSet[wingKey] : null;
        }

        const sex = spec.sex || 'F';
        const personalityType = spec.personalityType === 'hybrid'
            ? (spec.baseType || 'friendly')
            : spec.personalityType;

        const wingSet = this.wings[sex] && this.wings[sex][personalityType];
        return wingSet ? wingSet[wingKey] : null;
    }

    hasRenderableSpec(spec) {
        const wingKeys = ['foreLeft', 'foreRight', 'hindLeft', 'hindRight'];
        return wingKeys.every(wingKey => !!this.getWingPieceForSpec(spec, wingKey));
    }

    isSpriteAtlasEnabled() {
        return !!gameConfig?.performance?.flags?.spriteAtlas;
    }

    getWingAtlasPieceForSpec(spec, wingKey) {
        if (!spec) return null;

        if (spec.hybridGenome?.wingDonors?.[wingKey]) {
            const donor = spec.hybridGenome.wingDonors[wingKey];
            return this.wingAtlas?.[donor.sex]?.[donor.personalityType]?.[wingKey] || null;
        }

        const sex = spec.sex || 'F';
        const personalityType = spec.personalityType === 'hybrid'
            ? (spec.baseType || 'friendly')
            : spec.personalityType;
        return this.wingAtlas?.[sex]?.[personalityType]?.[wingKey] || null;
    }
}

const spriteManager = new SpriteManager();
