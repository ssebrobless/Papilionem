// Centralized rendering system
class RenderManager {
    constructor() {
        this.layers = {
            background: null,
            entitiesBehind: null,  // For spawning butterflies (below archways)
            blocks: null,
            entities: null,
            particles: null,
            ui: null,
            debug: null
        };

        this.initialized = false;
        this.backgroundImage = null;
        this.battleBackgroundImage = null;
        this.spawnCoverImage = null;
        this.worldSectionLibrary = {};
        this.worldSectionAssets = new Map();
        this.activeWorldSectionId = null;
        
        // Entity sorting cache with pre-allocated arrays
        this.sortedEntities = [];
        this.entitiesDirty = true;
        this.lastEntityCount = 0;
        this.lastVisibleEntitySignature = null;
        this.currentVisibleEntitySignature = null;
        this.entitySortingCache = []; // Pre-allocated array for sorting to avoid slice() allocation

        // Foliage overlay (leaf rustling effect)
        this.foliageQuadrants = null; // Array of 4 p5.Image quadrants

        // Ground wave overlay (grass/ground waving effect)
        this.groundWaveQuadrants = null; // Array of 4 p5.Image quadrants

        this.atmosphereCacheLayers = {
            ground: null,
            foliage: null
        };
        this.atmosphereCacheFrames = {
            ground: -1,
            foliage: -1
        };
        this.atmosphereCacheKeys = {
            ground: null,
            foliage: null
        };

        this.viewState = {
            mode: 'focused-garden',
            focusedZoneId: 'ivy-cloister',
            battleActive: false
        };
        this.regionLayers = {
            entities: null,
            entitiesBehind: null
        };
        this.regionLayerSizes = {
            entities: { width: 0, height: 0 },
            entitiesBehind: { width: 0, height: 0 }
        };
        this.entityDrawBuckets = {
            entities: [],
            entitiesBehind: []
        };
        this.spatialShellOverlayState = null;
        this.lastRenderFailure = null;
        this.lastRenderFailureLogAtMs = 0;
        this.lastRenderMetrics = null;
        this.mainCanvasGraphicsProxy = null;
        this.directFlowerEntities = [];
        this.lastLayerUsage = {
            blocksActive: false,
            flowersDirectActive: false,
            entitiesBehindActive: false,
            particlesActive: false,
            uiActive: true,
            debugActive: false,
            blocksBounds: null,
            flowersDirectBounds: null,
            entitiesBounds: null,
            entitiesBehindBounds: null,
            entityFamilyBounds: null,
            entitiesBehindFamilyBounds: null,
            blocksRegionSource: null,
            entitiesRegionSource: null,
            entitiesBehindRegionSource: null
        };
        this.uiRedrawState = {
            lastKey: null,
            lastFrame: -1,
            lastShellState: null
        };
        this.currentShellPerformanceState = null;
        this.debugRedrawState = {
            lastKey: null,
            lastFrame: -1
        };
        this.currentEntityComponentCosts = null;
        this.blocksLayerReuseState = {
            lastSignature: null
        };
    }
    
    // Initialize all render layers
    initialize() {
        const { baseWidth, baseHeight } = gameConfig.canvas;
        const uiLayerPixelDensity = gameConfig?.performance?.canvas?.uiLayerPixelDensity || 2;
        
        for (let layerName in this.layers) {
            this.layers[layerName] = createGraphics(baseWidth, baseHeight);
            const layerDensity = layerName === 'ui' ? uiLayerPixelDensity : 1;
            this.layers[layerName].pixelDensity(layerDensity);
        }
        
        // Keep pixel art aesthetic for entity and particle layers only
        this.layers.entitiesBehind.noSmooth();
        this.layers.blocks.noSmooth();
        this.layers.entities.noSmooth();
        this.layers.particles.noSmooth();
        
        // Enable smooth rendering for UI layer to improve text quality
        // this.layers.ui.smooth(); // This is the default, no need to call explicitly
        
        this.initialized = true;
        this.prepareWorldSectionAssets();
    }

    setWorldSectionLibrary(sectionLibrary = {}) {
        this.worldSectionLibrary = sectionLibrary || {};
        this.prepareWorldSectionAssets();
    }

    isSectionSceneWorld() {
        return gameConfig?.world?.renderMode === 'section-scenes';
    }

    rotateAsset(img, rotationDegrees = 0) {
        if (!img || !rotationDegrees) return img;
        const rotated = createGraphics(img.width, img.height);
        const normalizedRotation = ((rotationDegrees % 360) + 360) % 360;
        const drawWidth = normalizedRotation === 90 || normalizedRotation === 270 ? img.height : img.width;
        const drawHeight = normalizedRotation === 90 || normalizedRotation === 270 ? img.width : img.height;
        rotated.clear();
        rotated.push();
        rotated.imageMode(CENTER);
        rotated.translate(img.width / 2, img.height / 2);
        rotated.rotate(radians(rotationDegrees));
        rotated.image(img, 0, 0, drawWidth, drawHeight);
        rotated.pop();
        return rotated;
    }

    prepareWorldSectionAssets() {
        if (!this.initialized || !this.isSectionSceneWorld()) return;

        this.worldSectionAssets.clear();
        for (const zone of gameConfig?.world?.zones || []) {
            const renderProfile = zone.renderProfile || {};
            const assetSet = this.worldSectionLibrary?.[renderProfile.assetSet];
            if (!assetSet?.background) continue;

            this.worldSectionAssets.set(zone.id, {
                background: assetSet.background,
                foliage: assetSet.foliage || null,
                groundWave: assetSet.groundWave || null,
                spawnCover: assetSet.spawnCover || null
            });
        }

        const preferredZoneId = this.viewState.focusedZoneId || gameConfig?.world?.zones?.[0]?.id || null;
        if (preferredZoneId) {
            this.applyWorldSection(preferredZoneId);
        }
    }

    applyWorldSection(zoneId) {
        if (!this.isSectionSceneWorld()) return;
        if (this.activeWorldSectionId === zoneId && this.backgroundImage) return;
        const zoneAssets = this.worldSectionAssets.get(zoneId);
        if (!zoneAssets) return;

        this.activeWorldSectionId = zoneId;
        this.backgroundImage = zoneAssets.background || null;
        this.spawnCoverImage = zoneAssets.spawnCover || null;
        this.foliageQuadrants = null;
        this.groundWaveQuadrants = null;

        if (zoneAssets.foliage) {
            this.setFoliageImage(zoneAssets.foliage);
        }
        if (zoneAssets.groundWave) {
            this.setGroundWaveImage(zoneAssets.groundWave);
        }
        this.drawBackground();
    }
    
    // Set background image
    setBackgroundImage(img) {
        if (
            this.isSectionSceneWorld()
            && this.activeWorldSectionId
            && this.worldSectionAssets.has(this.activeWorldSectionId)
        ) {
            return;
        }
        this.backgroundImage = img;
        this.drawBackground();
    }

    setBattleBackgroundImage(img) {
        this.battleBackgroundImage = img;
        if (this.viewState.battleActive) {
            this.drawBackground();
        }
    }

    setViewMode(mode) {
        if (this.viewState.mode === mode && this.viewState.battleActive === (mode === 'battle')) {
            return;
        }
        this.viewState.mode = mode;
        this.viewState.battleActive = mode === 'battle';
        this.drawBackground();
        this.invalidateScene('view-mode');
    }

    setFocusedZone(zoneId) {
        if (this.viewState.focusedZoneId === zoneId) return;
        this.viewState.focusedZoneId = zoneId;
        this.applyWorldSection(zoneId);
        this.invalidateScene('focused-zone');
    }

    invalidateScene(_reason = 'state-change') {
        this.entitiesDirty = true;
        this.lastEntityCount = -1;
        this.lastVisibleEntitySignature = null;
        this.invalidateAtmosphereCaches();
        if (this.initialized) {
            this.clearDynamicLayers();
        }
    }

    getAccessibilitySettings() {
        return (typeof gameUI !== 'undefined' && gameUI.getAccessibilitySettings)
            ? gameUI.getAccessibilitySettings()
            : (gameConfig?.accessibility || {});
    }

    getPerformancePressureProfile() {
        return gameCore?.telemetrySystem?.getPressureProfile?.()
            || telemetrySystem?.getPressureProfile?.()
            || {
                tier: 'normal',
                visibleButterflies: 0,
                visibleEffects: 0,
                isHot: false,
                isCritical: false
            };
    }

    getBackgroundAtmosphereMode() {
        return this.getAccessibilitySettings().backgroundAtmosphere || 'full';
    }

    getTrailVisibilityMode() {
        const settings = this.getAccessibilitySettings();
        const configured = settings.trailVisibility || 'off';
        const flags = gameConfig?.performance?.flags || {};
        if (this.viewState.battleActive || settings.reducedMotion || configured === 'off') {
            return 'off';
        }

        const reducedAllowed = !!flags.trailsQualityReduced;
        const fullAllowed = !!flags.trailsQualityFull;
        if (configured === 'full' && !fullAllowed) {
            if (!reducedAllowed) return 'off';
            return 'reduced';
        }
        if (configured === 'reduced' && !reducedAllowed) {
            return 'off';
        }

        const pressure = this.getPerformancePressureProfile();
        const visibleButterflies = pressure.visibleButterflies || 0;

        if (pressure.isCritical || visibleButterflies >= 8) {
            return 'off';
        }
        if (configured === 'reduced' || pressure.isHot || visibleButterflies >= 5) {
            return 'reduced';
        }
        return configured;
    }

    invalidateAtmosphereCaches() {
        for (const key of Object.keys(this.atmosphereCacheLayers)) {
            this.atmosphereCacheFrames[key] = -1;
            this.atmosphereCacheKeys[key] = null;
            this.atmosphereCacheLayers[key]?.clear?.();
        }
    }

    getAtmosphereCacheLayer(name) {
        if (!this.atmosphereCacheLayers[name]) {
            const { baseWidth, baseHeight } = gameConfig.canvas;
            const layer = createGraphics(baseWidth, baseHeight);
            layer.pixelDensity(1);
            this.atmosphereCacheLayers[name] = layer;
        }
        return this.atmosphereCacheLayers[name];
    }

    getVisibleSceneEntityCount() {
        if (this.viewState.battleActive) return 0;
        const sceneEntities = typeof gameCore !== 'undefined' && gameCore.getFocusedSceneEntities
            ? gameCore.getFocusedSceneEntities()
            : null;
        if (!sceneEntities) return this.sortedEntities?.length || 0;
        return (sceneEntities.butterflies?.length || 0)
            + (sceneEntities.flowers?.length || 0)
            + (sceneEntities.caterpillars?.length || 0)
            + (sceneEntities.blocks?.length || 0);
    }

    getVisibleSceneFlowerCount() {
        if (this.viewState.battleActive) return 0;
        const sceneEntities = typeof gameCore !== 'undefined' && gameCore.getFocusedSceneEntities
            ? gameCore.getFocusedSceneEntities()
            : null;
        if (!sceneEntities) return 0;
        return sceneEntities.flowers?.length || 0;
    }

    getVisibleSceneButterflyCount() {
        if (this.viewState.battleActive) return 0;
        const sceneEntities = typeof gameCore !== 'undefined' && gameCore.getFocusedSceneEntities
            ? gameCore.getFocusedSceneEntities()
            : null;
        if (!sceneEntities) return 0;
        return sceneEntities.butterflies?.length || 0;
    }

    getVisibleEffectCount() {
        if (typeof specialEffects === 'undefined' || !Array.isArray(specialEffects.activeEffects)) return 0;
        let count = 0;
        for (const effect of specialEffects.activeEffects) {
            if (specialEffects.shouldDrawEffect?.(effect)) count++;
        }
        return count;
    }

    getAtmosphereRenderProfile() {
        const settings = this.getAccessibilitySettings();
        const backgroundAtmosphereMode = this.getBackgroundAtmosphereMode();
        if (this.viewState.battleActive || settings.reducedMotion || backgroundAtmosphereMode === 'minimal' || this.viewState.mode === 'overview') {
            return {
                renderGround: false,
                renderFoliage: false,
                profileKey: `${this.viewState.mode}|${this.viewState.focusedZoneId}|disabled`
            };
        }

        const pressure = this.getPerformancePressureProfile();
        const visibleEffects = this.getVisibleEffectCount();
        const visibleEntityCount = this.getVisibleSceneEntityCount();

        let tier = 'full';
        if (pressure.isCritical || visibleEffects >= 10 || visibleEntityCount >= 34) {
            tier = 'severe';
        } else if (pressure.isHot || visibleEffects >= 6 || visibleEntityCount >= 24) {
            tier = 'throttled';
        }

        return {
            tier,
            renderGround: tier === 'full',
            renderFoliage: backgroundAtmosphereMode === 'full' && tier === 'full',
            groundStride: tier === 'full' ? 2 : tier === 'throttled' ? 4 : 6,
            foliageStride: tier === 'full' ? 3 : 6,
            overlayPasses: tier === 'full' ? 2 : 1,
            amplitudeScale: tier === 'full' ? 1 : tier === 'throttled' ? 0.8 : 0.6,
            profileKey: [
                this.viewState.mode,
                this.viewState.focusedZoneId,
                backgroundAtmosphereMode,
                tier
            ].join('|')
        };
    }

    refreshCachedAtmosphereLayer(name, stride, profileKey, painter) {
        const layer = this.getAtmosphereCacheLayer(name);
        const frameBucket = Math.floor((gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0)) / Math.max(1, stride));
        if (this.atmosphereCacheFrames[name] === frameBucket && this.atmosphereCacheKeys[name] === profileKey) {
            return layer;
        }

        layer.clear();
        painter(layer);
        this.atmosphereCacheFrames[name] = frameBucket;
        this.atmosphereCacheKeys[name] = profileKey;
        return layer;
    }

    shouldRenderMovingBackgroundEffects() {
        return this.getAtmosphereRenderProfile().renderGround;
    }

    shouldRenderAfterimageTrails() {
        return this.getTrailVisibilityMode() !== 'off';
    }

    shouldUseSmoothedButterflySprites() {
        const pressure = this.getPerformancePressureProfile();
        const visibleButterflies = pressure.visibleButterflies || 0;
        const maxVisible = gameConfig?.performance?.smoothedButterflySpriteMaxVisible || 6;
        if (this.viewState.battleActive) return false;
        if (pressure.isCritical) return false;
        if (pressure.isHot) return false;
        return visibleButterflies <= maxVisible;
    }

    getRenderContext() {
        return {
            ...this.viewState,
            trackButterflyComponentCosts: this.shouldTrackEntityFamilyRenderCosts()
        };
    }

    getGroundPlaneProfile() {
        if (this.viewState.battleActive) {
            return {
                ellipseScaleY: 1,
                haloScaleY: 1,
                centerYOffset: 0
            };
        }

        const configured = gameConfig?.world?.mapGeometry?.groundPlane || {};
        return {
            ellipseScaleY: configured.ellipseScaleY || 0.56,
            haloScaleY: configured.haloScaleY || configured.ellipseScaleY || 0.56,
            centerYOffset: configured.centerYOffset || 0
        };
    }
    
    // Draw the static background
    drawBackground() {
        if (!this.initialized) return;
        this.invalidateAtmosphereCaches();
        
        const bg = this.layers.background;
        bg.push();
        bg.clear();
        
        if (this.viewState.battleActive && this.battleBackgroundImage) {
            bg.image(this.battleBackgroundImage, 0, 0, gameConfig.canvas.baseWidth, gameConfig.canvas.baseHeight);
        } else if (this.backgroundImage) {
            bg.image(this.backgroundImage, 0, 0, gameConfig.canvas.baseWidth, gameConfig.canvas.baseHeight);
        } else {
            // Fallback painted background
            bg.fill(gameConfig.canvas.backgroundColor);
            bg.rect(0, 0, gameConfig.canvas.baseWidth, gameConfig.canvas.baseHeight);
            
            // Add some atmospheric effects
            for (let i = 0; i < 5; i++) {
                bg.noStroke();
                bg.fill(
                    244 + random(-10, 10), 
                    232 + random(-10, 10), 
                    220 + random(-10, 10), 
                    30
                );
                let x = random(gameConfig.canvas.baseWidth);
                let y = random(gameConfig.canvas.baseHeight);
                let size = random(100, 300);
                bg.ellipse(x, y, size, size);
            }
        }
        
        bg.pop();
    }

    drawBattleArenaOverlay(layer) {
        const geometry = gameConfig?.battle?.arena?.geometry;
        if (!geometry) return;
        const counts = geometry.slotCounts || {};

        const drawRectOutline = (rect, strokeColor, strokeWeight = 1) => {
            if (!rect) return;
            layer.noFill();
            layer.stroke(...strokeColor);
            layer.strokeWeight(strokeWeight);
            layer.rect(
                rect.minX,
                rect.minY,
                rect.maxX - rect.minX,
                rect.maxY - rect.minY
            );
        };

        const drawGrid = (rect, cols, rows, strokeColor, strokeWeight = 1) => {
            if (!rect || cols <= 0 || rows <= 0) return;
            const width = rect.maxX - rect.minX;
            const height = rect.maxY - rect.minY;
            layer.stroke(...strokeColor);
            layer.strokeWeight(strokeWeight);
            for (let col = 1; col < cols; col++) {
                const x = rect.minX + ((width / cols) * col);
                layer.line(x, rect.minY, x, rect.maxY);
            }
            for (let row = 1; row < rows; row++) {
                const y = rect.minY + ((height / rows) * row);
                layer.line(rect.minX, y, rect.maxX, y);
            }
        };

        const lineColor = gameConfig?.battle?.arena?.lineColor || [8, 18, 12, 90];
        const dividerColor = gameConfig?.battle?.arena?.dividerColor || [16, 22, 18, 110];
        drawRectOutline(geometry.rects?.leftSupport, lineColor, 1);
        drawRectOutline(geometry.rects?.leftField, lineColor, 1);
        drawRectOutline(geometry.rects?.rightField, lineColor, 1);
        drawRectOutline(geometry.rects?.rightSupport, lineColor, 1);
        drawGrid(geometry.rects?.leftSupport, 1, counts.supportRows || 2, lineColor, 1);
        drawGrid(geometry.rects?.leftField, counts.fieldCols || 4, counts.fieldRows || 4, lineColor, 1);
        drawGrid(geometry.rects?.rightField, counts.fieldCols || 4, counts.fieldRows || 4, lineColor, 1);
        drawGrid(geometry.rects?.rightSupport, 1, counts.supportRows || 2, lineColor, 1);
        if (typeof geometry.laneDividerX === 'number') {
            layer.stroke(...dividerColor);
            layer.strokeWeight(1);
            layer.line(geometry.laneDividerX, geometry.rects.leftField.minY, geometry.laneDividerX, geometry.rects.leftField.maxY);
        }
    }
    
    // Clear dynamic layers
    clearDynamicLayers({ clearUi = true, clearDebug = true } = {}) {
        this.layers.entitiesBehind.clear();
        this.layers.entities.clear();
        this.layers.particles.clear();
        this.regionLayers.entitiesBehind?.clear?.();
        this.regionLayers.entities?.clear?.();
        if (clearUi) {
            this.layers.ui.clear();
        }
        this.lastLayerUsage.blocksActive = false;
        this.lastLayerUsage.entitiesBehindActive = false;
        this.lastLayerUsage.particlesActive = false;
        this.lastLayerUsage.uiActive = true;
        this.lastLayerUsage.debugActive = false;
        this.lastLayerUsage.blocksBounds = null;
        this.lastLayerUsage.entitiesBounds = null;
        this.lastLayerUsage.entitiesBehindBounds = null;
        this.lastLayerUsage.entityFamilyBounds = null;
        this.lastLayerUsage.entitiesBehindFamilyBounds = null;
        this.lastLayerUsage.blocksRegionSource = null;
        this.lastLayerUsage.entitiesRegionSource = null;
        this.lastLayerUsage.entitiesBehindRegionSource = null;

        if (clearDebug) {
            this.layers.debug.clear();
        }
    }

    summarizeRenderError(error, stage = 'render') {
        return {
            stage,
            message: error?.message || String(error || 'render failure'),
            stack: error?.stack || null,
            atMs: Date.now(),
            frame: gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : null),
            mode: this.viewState.mode,
            focusedZoneId: this.viewState.focusedZoneId,
            battleActive: !!this.viewState.battleActive
        };
    }

    recordRenderFailure(error, stage = 'render') {
        const summary = this.summarizeRenderError(error, stage);
        this.lastRenderFailure = summary;
        const now = summary.atMs || Date.now();
        if ((now - (this.lastRenderFailureLogAtMs || 0)) >= 1200) {
            this.lastRenderFailureLogAtMs = now;
            console.error('RenderManager frame failure:', summary.message, error);
            gameCore?.telemetrySystem?.recordRuntimeIssue?.('render-frame-error', summary);
        }
        return summary;
    }

    clearRenderFailure() {
        this.lastRenderFailure = null;
    }

    drawRenderFailureOverlay(summary = null) {
        const issue = summary || this.lastRenderFailure;
        if (!issue) return;
        push();
        noStroke();
        fill(8, 12, 18, 208);
        rect(18, 18, Math.min(width - 36, 360), 76, 12);
        fill(252, 228, 188);
        textAlign(LEFT, TOP);
        textSize(14);
        text('Render hiccup recovered', 34, 32);
        fill(236);
        textSize(11);
        const detail = (issue.message || 'frame error').slice(0, 84);
        text(`The previous frame was kept visible.\n${detail}`, 34, 52);
        pop();
    }

    getNowMs() {
        return typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    getLastRenderMetrics() {
        return this.lastRenderMetrics ? JSON.parse(JSON.stringify(this.lastRenderMetrics)) : null;
    }

    isCompositeDirtyRegionsEnabled() {
        return !!gameConfig?.performance?.flags?.compositeDirtyRegions;
    }

    shouldUseCompositeDirtyRegions(shellState = null) {
        if (!this.isCompositeDirtyRegionsEnabled() || this.viewState.battleActive) {
            return false;
        }
        const resolvedShellState = shellState || this.currentShellPerformanceState || this.uiRedrawState.lastShellState || null;
        const canvasShellHeavy = !!(
            resolvedShellState?.canvasFeedVisible
            || resolvedShellState?.canvasInspectVisible
            || resolvedShellState?.canvasAccessVisible
            || resolvedShellState?.canvasJournalVisible
            || resolvedShellState?.debugCanvasVisible
            || resolvedShellState?.battleSetupVisible
        );
        return !canvasShellHeavy;
    }

    shouldUseNativeCompositePresent() {
        return !!gameConfig?.performance?.flags?.compositeNativeDraw;
    }

    shouldUseBlocksCompositeLayer() {
        return !!(
            gameConfig?.performance?.flags?.compositeBlocksLayer
            && !this.viewState.battleActive
            && this.shouldUseCompositeDirtyRegions()
        );
    }

    shouldReuseBlocksCompositeLayer() {
        return !!(
            this.shouldUseBlocksCompositeLayer()
            && gameConfig?.performance?.flags?.compositeBlocksLayerReuse
        );
    }

    shouldUseDirectFlowerPresent(visibleFlowerCount = null) {
        const stackedBlocksComposite = this.shouldUseBlocksCompositeLayer();
        const directPresentAllowed = !!(
            (gameConfig?.performance?.flags?.directPresentFlowers || stackedBlocksComposite)
            && !this.viewState.battleActive
            && this.shouldUseCompositeDirtyRegions()
        );
        if (!directPresentAllowed) return false;
        const resolvedVisibleFlowerCount = Number.isFinite(visibleFlowerCount)
            ? visibleFlowerCount
            : this.getVisibleSceneFlowerCount();
        const maxVisibleFlowers = Math.max(
            1,
            Number(gameConfig?.performance?.directPresentFlowerMaxVisible || 48)
        );
        if (resolvedVisibleFlowerCount <= maxVisibleFlowers) {
            return true;
        }
        const denseVisibleFlowerMin = Math.max(
            maxVisibleFlowers + 1,
            Number(gameConfig?.performance?.denseDirectPresentFlowerMinVisible || (maxVisibleFlowers + 1))
        );
        if (resolvedVisibleFlowerCount < denseVisibleFlowerMin) {
            return false;
        }
        const visibleButterflyCount = this.getVisibleSceneButterflyCount();
        const denseButterflyMax = Math.max(
            0,
            Number(gameConfig?.performance?.denseDirectPresentFlowerMaxButterflies || 0)
        );
        return visibleButterflyCount > 0
            && visibleButterflyCount <= denseButterflyMax;
    }

    expandCompositeBounds(bounds, nextBounds) {
        if (!nextBounds) return bounds;
        if (!bounds) {
            return { ...nextBounds };
        }
        bounds.minX = Math.min(bounds.minX, nextBounds.minX);
        bounds.minY = Math.min(bounds.minY, nextBounds.minY);
        bounds.maxX = Math.max(bounds.maxX, nextBounds.maxX);
        bounds.maxY = Math.max(bounds.maxY, nextBounds.maxY);
        return bounds;
    }

    normalizeCompositeBounds(bounds, sourceWidth, sourceHeight, targetWidth, targetHeight) {
        if (!bounds) return null;

        const safeSourceWidth = Math.max(1, Number(sourceWidth) || 1);
        const safeSourceHeight = Math.max(1, Number(sourceHeight) || 1);
        const minX = Math.max(0, Math.floor(bounds.minX));
        const minY = Math.max(0, Math.floor(bounds.minY));
        const maxX = Math.min(safeSourceWidth, Math.ceil(bounds.maxX));
        const maxY = Math.min(safeSourceHeight, Math.ceil(bounds.maxY));
        const width = Math.max(0, maxX - minX);
        const height = Math.max(0, maxY - minY);

        if (width <= 0 || height <= 0) {
            return null;
        }

        const areaRatio = (width * height) / (safeSourceWidth * safeSourceHeight);
        const scaleX = targetWidth / safeSourceWidth;
        const scaleY = targetHeight / safeSourceHeight;

        return {
            source: {
                x: minX,
                y: minY,
                width,
                height
            },
            dest: {
                x: minX * scaleX,
                y: minY * scaleY,
                width: width * scaleX,
                height: height * scaleY
            },
            areaRatio
        };
    }

    normalizeRegionSource(bounds, sourceWidth, sourceHeight) {
        if (!bounds) return null;

        const safeSourceWidth = Math.max(1, Number(sourceWidth) || 1);
        const safeSourceHeight = Math.max(1, Number(sourceHeight) || 1);
        const minX = Math.max(0, Math.floor(bounds.minX));
        const minY = Math.max(0, Math.floor(bounds.minY));
        const maxX = Math.min(safeSourceWidth, Math.ceil(bounds.maxX));
        const maxY = Math.min(safeSourceHeight, Math.ceil(bounds.maxY));
        const width = Math.max(0, maxX - minX);
        const height = Math.max(0, maxY - minY);

        if (width <= 0 || height <= 0) {
            return null;
        }

        return {
            x: minX,
            y: minY,
            width,
            height,
            areaRatio: (width * height) / (safeSourceWidth * safeSourceHeight)
        };
    }

    scaleCompositeRegion(region, sourceWidth, sourceHeight, targetWidth, targetHeight) {
        if (!region) return null;
        const safeSourceWidth = Math.max(1, Number(sourceWidth) || 1);
        const safeSourceHeight = Math.max(1, Number(sourceHeight) || 1);
        const scaleX = targetWidth / safeSourceWidth;
        const scaleY = targetHeight / safeSourceHeight;
        return {
            x: region.x * scaleX,
            y: region.y * scaleY,
            width: region.width * scaleX,
            height: region.height * scaleY
        };
    }

    getReusableRegionLayer(name, width, height) {
        const safeWidth = Math.max(1, Math.ceil(width));
        const safeHeight = Math.max(1, Math.ceil(height));
        let layer = this.regionLayers[name];
        const trackedSize = this.regionLayerSizes[name] || { width: 0, height: 0 };
        const shouldResize = !layer
            || trackedSize.width < safeWidth
            || trackedSize.height < safeHeight
            || trackedSize.width > Math.ceil(safeWidth * 1.65)
            || trackedSize.height > Math.ceil(safeHeight * 1.65);

        if (!layer) {
            layer = createGraphics(safeWidth, safeHeight);
            layer.pixelDensity(1);
            layer.noSmooth();
            this.regionLayers[name] = layer;
        } else if (shouldResize) {
            layer.resizeCanvas(safeWidth, safeHeight);
            layer.pixelDensity(1);
            layer.noSmooth();
        }

        this.regionLayerSizes[name] = {
            width: layer.width || safeWidth,
            height: layer.height || safeHeight
        };
        layer.clear();
        return layer;
    }

    getMainCanvasGraphicsProxy() {
        if (this.mainCanvasGraphicsProxy) {
            return this.mainCanvasGraphicsProxy;
        }

        const bindGlobal = (name) => (...args) => {
            const fn = globalThis?.[name];
            if (typeof fn === 'function') {
                return fn(...args);
            }
            return undefined;
        };

        this.mainCanvasGraphicsProxy = {
            push: bindGlobal('push'),
            pop: bindGlobal('pop'),
            translate: bindGlobal('translate'),
            rotate: bindGlobal('rotate'),
            scale: bindGlobal('scale'),
            shearX: bindGlobal('shearX'),
            noStroke: bindGlobal('noStroke'),
            stroke: bindGlobal('stroke'),
            strokeWeight: bindGlobal('strokeWeight'),
            noFill: bindGlobal('noFill'),
            fill: bindGlobal('fill'),
            rect: bindGlobal('rect'),
            ellipse: bindGlobal('ellipse'),
            line: bindGlobal('line'),
            image: bindGlobal('image'),
            imageMode: bindGlobal('imageMode'),
            tint: bindGlobal('tint'),
            noTint: bindGlobal('noTint'),
            beginShape: bindGlobal('beginShape'),
            vertex: bindGlobal('vertex'),
            bezierVertex: bindGlobal('bezierVertex'),
            endShape: bindGlobal('endShape'),
            smooth: () => {
                if (typeof drawingContext !== 'undefined') {
                    drawingContext.imageSmoothingEnabled = true;
                }
            },
            noSmooth: () => {
                if (typeof drawingContext !== 'undefined') {
                    drawingContext.imageSmoothingEnabled = false;
                }
            }
        };

        return this.mainCanvasGraphicsProxy;
    }

    drawDirectFlowerEntities() {
        if (!Array.isArray(this.directFlowerEntities) || this.directFlowerEntities.length === 0) {
            return 0;
        }
        const graphics = this.getMainCanvasGraphicsProxy();
        let count = 0;
        for (const flower of this.directFlowerEntities) {
            flower?.draw?.(graphics);
            count += 1;
        }
        return count;
    }

    shouldUseRegionEntityLayer(regionSource = null) {
        void regionSource;
        // Parked after proof loss: the retained v5 path keeps full-size off-screen
        // entity layers and uses cropped composite copies instead.
        return false;
    }

    drawEntityBucket(targetLayer, entities, offsetX = 0, offsetY = 0) {
        targetLayer.push();
        if (offsetX || offsetY) {
            targetLayer.translate(offsetX, offsetY);
        }
        for (const entity of entities) {
            entity.draw(targetLayer);
        }
        targetLayer.pop();
    }

    compositeRegionLayer(sourceLayer, sourceRegion, metrics, metricKey, targetWidth, targetHeight, options = {}) {
        if (!sourceLayer || !sourceRegion) return;
        const regionKey = options.regionKey || `${metricKey}Region`;
        const modeKey = options.modeKey || `${metricKey}Mode`;
        const dest = this.scaleCompositeRegion(
            sourceRegion,
            gameConfig?.canvas?.baseWidth || targetWidth,
            gameConfig?.canvas?.baseHeight || targetHeight,
            targetWidth,
            targetHeight
        );
        const stageStart = this.getNowMs();
        this.drawCompositeImage(
            sourceLayer,
            dest,
            {
                x: 0,
                y: 0,
                width: sourceRegion.width,
                height: sourceRegion.height
            },
            options
        );
        metrics[metricKey] = this.getNowMs() - stageStart;
        metrics[modeKey] = 'region-layer';
        metrics[regionKey] = {
            x: sourceRegion.x,
            y: sourceRegion.y,
            width: sourceRegion.width,
            height: sourceRegion.height
        };
        metrics.compositeCallCount += 1;
    }


    estimateEntityCompositeBounds(entity) {
        if (!entity) return null;

        const entityType = entity?.lifeSim?.identity?.entityType
            || entity?.objectProfile?.entityType
            || entity?.entityType
            || 'entity';
        const size = Math.max(8, Number(entity?.size || 12));
        const renderWidth = Math.max(0, Number(entity?.renderWidth || 0));
        const renderHeight = Math.max(0, Number(entity?.renderHeight || 0));
        const stemHeight = Math.max(0, Number(entity?.stemHeight || 0));

        let width = renderWidth;
        let height = renderHeight;
        if (entityType === 'butterfly') {
            width = Math.max(width, size * 4.2);
            height = Math.max(height, size * 3.5);
        } else if (entityType === 'flower') {
            width = Math.max(width, size * 2.8);
            height = Math.max(height, stemHeight + (size * 2.2));
        } else if (entityType === 'caterpillar') {
            width = Math.max(width, size * 2.8);
            height = Math.max(height, size * 1.9);
        } else if (entityType === 'block') {
            width = Math.max(width, size * 2.0, 18);
            height = Math.max(height, size * 2.0, 18);
        } else {
            width = Math.max(width, size * 2.6);
            height = Math.max(height, size * 2.4);
        }

        const visualLift = typeof entity?.getVisualLift === 'function'
            ? Math.max(0, Number(entity.getVisualLift()) || 0)
            : 0;
        const shadowOffset = Math.max(0, Number(entity?.shadowOffset || 0));
        const x = Number(entity?.x || 0);
        const y = Number(entity?.y || 0);
        const horizontalPad = Math.max(10, width * 0.16);
        const topPad = Math.max(12, height * 0.62) + visualLift;
        const bottomPad = Math.max(10, height * 0.34) + shadowOffset;
        const halfWidth = (width / 2) + horizontalPad;

        return {
            minX: x - halfWidth,
            maxX: x + halfWidth,
            minY: y - topPad,
            maxY: y + bottomPad
        };
    }

    drawCompositeImage(sourceLayer, dest, sourceRegion = null, options = {}) {
        const sourceElement = sourceLayer?.elt || sourceLayer?.canvas || sourceLayer;
        const context = typeof drawingContext !== 'undefined' ? drawingContext : null;
        const preferNativeDraw = !!options.preferNativeDraw;
        const disableSmoothing = !!options.disableSmoothing;

        if (context && sourceElement && preferNativeDraw) {
            const previousSmoothing = context.imageSmoothingEnabled;
            if (disableSmoothing) {
                context.imageSmoothingEnabled = false;
            }
            if (sourceRegion) {
                context.drawImage(
                    sourceElement,
                    sourceRegion.x,
                    sourceRegion.y,
                    sourceRegion.width,
                    sourceRegion.height,
                    dest.x,
                    dest.y,
                    dest.width,
                    dest.height
                );
            } else {
                context.drawImage(
                    sourceElement,
                    dest.x,
                    dest.y,
                    dest.width,
                    dest.height
                );
            }
            if (disableSmoothing) {
                context.imageSmoothingEnabled = previousSmoothing;
            }
            return;
        }

        if (sourceRegion) {
            image(
                sourceLayer,
                dest.x,
                dest.y,
                dest.width,
                dest.height,
                sourceRegion.x,
                sourceRegion.y,
                sourceRegion.width,
                sourceRegion.height
            );
            return;
        }

        image(sourceLayer, dest.x, dest.y, dest.width, dest.height);
    }

    drawCompositeLayer(sourceLayer, metrics, metricKey, targetWidth, targetHeight, options = {}) {
        if (!sourceLayer) return;

        const normalizedBounds = options.useDirtyBounds
            ? this.normalizeCompositeBounds(
                options.bounds || null,
                sourceLayer.width || gameConfig?.canvas?.baseWidth || targetWidth,
                sourceLayer.height || gameConfig?.canvas?.baseHeight || targetHeight,
                targetWidth,
                targetHeight
            )
            : null;
        const shouldCrop = !!(
            normalizedBounds
            && normalizedBounds.areaRatio > 0
            && normalizedBounds.areaRatio < 0.88
        );
        const modeKey = options.modeKey || `${metricKey}Mode`;
        const regionKey = options.regionKey || `${metricKey}Region`;

        const stageStart = this.getNowMs();
        if (shouldCrop) {
            this.drawCompositeImage(
                sourceLayer,
                normalizedBounds.dest,
                normalizedBounds.source,
                options
            );
            metrics[modeKey] = 'cropped';
            metrics[regionKey] = normalizedBounds.source;
        } else {
            this.drawCompositeImage(
                sourceLayer,
                {
                    x: 0,
                    y: 0,
                    width: targetWidth,
                    height: targetHeight
                },
                null,
                options
            );
            metrics[modeKey] = 'full';
            metrics[regionKey] = null;
        }
        metrics[metricKey] = this.getNowMs() - stageStart;
        metrics.compositeCallCount += 1;
    }

    buildUiRedrawState(gameState = null, debugEnabled = false) {
        const shellState = gameUI?.getShellPerformanceState?.(gameState || null) || null;
        const saveStatus = gameUI?.saveStatus || {};
        const buttonState = Array.isArray(gameUI?.playerButtons)
            ? gameUI.playerButtons.map(button => button.id).join(',')
            : '';
        const key = JSON.stringify({
            viewMode: gameState?.viewMode || this.viewState.mode,
            focusedZoneId: gameState?.focusedZoneId || this.viewState.focusedZoneId,
            battleActive: !!this.viewState.battleActive,
            timeScale: gameState?.timeScale || 1,
            saveState: saveStatus.state || 'idle',
            saveLabel: saveStatus.label || '',
            debugEnabled: !!debugEnabled,
            shellState,
            buttonState
        });

        let redrawEveryFrames = 1;
        const openPanelCount = shellState?.openPanelCount || 0;
        const domOnlyShellOpen = !!(
            shellState?.domShellEnabled
            && !shellState?.canvasFeedVisible
            && !shellState?.canvasInspectVisible
            && !shellState?.canvasAccessVisible
            && !shellState?.canvasJournalVisible
            && !shellState?.canvasGuideVisible
            && !shellState?.debugCanvasVisible
            && (
                shellState?.feedVisible
                || shellState?.inspectVisible
                || shellState?.accessVisible
                || shellState?.journalVisible
                || shellState?.guideVisible
                || shellState?.debugEnabled
            )
        );
        const calmFocusedGardenShell = (gameState?.viewMode || this.viewState.mode) === 'focused-garden'
            && openPanelCount === 0
            && !shellState?.canvasGuideVisible
            && !shellState?.debugEnabled;
        const calmUiInteractive = calmFocusedGardenShell && this.isCleanShellUiInteractive(gameState);
        if (domOnlyShellOpen) {
            if (shellState?.inspectVisible || shellState?.debugEnabled) {
                redrawEveryFrames = 4;
            } else if (shellState?.journalVisible) {
                redrawEveryFrames = 6;
            } else {
                redrawEveryFrames = 8;
            }
        } else if (openPanelCount >= 3) {
            redrawEveryFrames = 3;
        } else if (openPanelCount >= 2) {
            redrawEveryFrames = 2;
        } else if (shellState?.journalVisible && openPanelCount === 1) {
            redrawEveryFrames = 2;
        } else if (calmFocusedGardenShell) {
            redrawEveryFrames = calmUiInteractive ? 2 : 6;
        }

        if (gameState?.viewMode === 'battle') {
            redrawEveryFrames = 1;
        }

        return {
            key,
            shellState,
            redrawEveryFrames
        };
    }

    shouldRedrawUILayer(gameState = null, debugEnabled = false) {
        const redrawState = this.buildUiRedrawState(gameState, debugEnabled);
        const frame = gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0);
        const frameDelta = frame - (this.uiRedrawState.lastFrame || 0);
        const shouldRedraw = this.uiRedrawState.lastKey !== redrawState.key
            || frameDelta >= redrawState.redrawEveryFrames
            || this.uiRedrawState.lastFrame < 0;

        if (shouldRedraw) {
            this.uiRedrawState.lastKey = redrawState.key;
            this.uiRedrawState.lastFrame = frame;
            this.uiRedrawState.lastShellState = redrawState.shellState || null;
        }

        return {
            shouldRedraw,
            shellState: redrawState.shellState || null
        };
    }

    isCleanShellUiInteractive(gameState = null) {
        if (typeof gameUI === 'undefined') return false;
        const rawMouseX = typeof mouseX === 'number' ? mouseX : null;
        const rawMouseY = typeof mouseY === 'number' ? mouseY : null;
        if (!Number.isFinite(rawMouseX) || !Number.isFinite(rawMouseY)) return false;

        const point = gameUI.resolveScreenToCanvas?.(rawMouseX, rawMouseY) || {
            x: rawMouseX,
            y: rawMouseY
        };
        const isInsideRect = gameUI.isInsideRect?.bind(gameUI);
        if (!isInsideRect) return false;

        const visibleButtons = gameUI.getVisiblePlayerButtons?.() || [];
        if (visibleButtons.some(button => isInsideRect(point, button))) {
            return true;
        }

        const doorwayButtons = gameUI.getFocusedDoorwayButtons?.(gameState || null) || [];
        if (doorwayButtons.some(button => isInsideRect(point, button.rect || button))) {
            return true;
        }

        return false;
    }

    shouldRedrawDebugLayer(debugEnabled = false, gameState = null) {
        if (!debugEnabled) {
            this.debugRedrawState.lastKey = null;
            this.debugRedrawState.lastFrame = -1;
            return false;
        }

        const frame = gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0);
        const shellState = gameUI?.getShellPerformanceState?.(gameState || null) || null;
        const key = JSON.stringify({
            focusedZoneId: gameState?.focusedZoneId || this.viewState.focusedZoneId,
            viewMode: gameState?.viewMode || this.viewState.mode,
            shellState,
            debugCursorX: debugUI?.cursorX ?? null,
            debugCursorY: debugUI?.cursorY ?? null,
            debugTool: debugUI?.selectedTool ?? null,
            auditStatus: debugUI?.auditState?.lastStatus ?? 'idle'
        });

        const shouldRedraw = this.debugRedrawState.lastKey !== key
            || this.debugRedrawState.lastFrame < 0
            || (frame - this.debugRedrawState.lastFrame) >= 2;

        if (shouldRedraw) {
            this.debugRedrawState.lastKey = key;
            this.debugRedrawState.lastFrame = frame;
        }

        return shouldRedraw;
    }
    
    // Main render method
    render() {
        if (!this.initialized) return null;

        const metrics = {
            recordedAtMs: Date.now(),
            clearDynamicMs: 0,
            entityLayerMs: 0,
            particleLayerMs: 0,
            uiLayerMs: 0,
            debugLayerMs: 0,
            canvasClearMs: 0,
            compositeMs: 0,
            atmosphereCompositeMs: 0,
            compositeCallCount: 0,
            uiRedrawCount: 0,
            debugRedrawCount: 0,
            shellState: null,
            failure: null
        };

        try {
            const debugEnabled = (typeof gameCore !== 'undefined' && gameCore.getDebugMode().enabled) ||
                               (typeof debugMode !== 'undefined' && debugMode.enabled);
            const gameState = (typeof gameCore !== 'undefined' && gameCore.isInitialized())
                ? gameCore.getGameState()
                : (typeof window !== 'undefined' && typeof window.gameState !== 'undefined' ? window.gameState : {});
            gameUI?.syncDomPanels?.(gameState);
            const uiRedraw = this.shouldRedrawUILayer(gameState, debugEnabled);
            const redrawDebugLayer = this.shouldRedrawDebugLayer(debugEnabled, gameState);
            this.currentShellPerformanceState = uiRedraw.shellState || null;

            // Keep the current composed frame visible until the next frame is ready.
            let stageStart = this.getNowMs();
            this.clearDynamicLayers({
                clearUi: uiRedraw.shouldRedraw,
                clearDebug: redrawDebugLayer
            });
            metrics.clearDynamicMs = this.getNowMs() - stageStart;

            // Draw to each layer
            stageStart = this.getNowMs();
            const entityLayerResult = this.drawEntitiesLayer();
            metrics.entityLayerMs = this.getNowMs() - stageStart;
            if (entityLayerResult?.familyDrawMs) {
                Object.assign(metrics, entityLayerResult.familyDrawMs);
            }
            if (entityLayerResult?.entityFamilyCompositeBounds) {
                Object.assign(metrics, entityLayerResult.entityFamilyCompositeBounds);
            }
            if (entityLayerResult?.entitiesBehindFamilyCompositeBounds) {
                Object.assign(metrics, entityLayerResult.entitiesBehindFamilyCompositeBounds);
            }
            if (entityLayerResult?.entityCompositeEdgeOwners) {
                Object.assign(metrics, entityLayerResult.entityCompositeEdgeOwners);
            }
            if (entityLayerResult?.entitiesBehindCompositeEdgeOwners) {
                Object.assign(metrics, entityLayerResult.entitiesBehindCompositeEdgeOwners);
            }
            if (entityLayerResult?.butterflyComponentDrawMs) {
                Object.assign(metrics, entityLayerResult.butterflyComponentDrawMs);
            }

            stageStart = this.getNowMs();
            this.drawParticlesLayer();
            metrics.particleLayerMs = this.getNowMs() - stageStart;

            if (uiRedraw.shouldRedraw) {
                stageStart = this.getNowMs();
                this.drawUILayer(gameState, debugEnabled);
                metrics.uiLayerMs = this.getNowMs() - stageStart;
                metrics.uiRedrawCount = 1;
            }

            if (debugEnabled) {
                if (redrawDebugLayer) {
                    stageStart = this.getNowMs();
                    this.drawDebugLayer(gameState);
                    metrics.debugLayerMs = this.getNowMs() - stageStart;
                    metrics.debugRedrawCount = 1;
                }
                this.lastLayerUsage.debugActive = true;
            }

            metrics.shellState = uiRedraw.shellState || null;

            // Only clear/composite the main canvas after the off-screen layers are ready.
            stageStart = this.getNowMs();
            background(0);
            metrics.canvasClearMs = this.getNowMs() - stageStart;

            stageStart = this.getNowMs();
            const compositeMetrics = this.compositeLayers();
            metrics.compositeMs = this.getNowMs() - stageStart;
            metrics.compositeBreakdown = compositeMetrics || null;
            metrics.atmosphereCompositeMs = Number(compositeMetrics?.groundAtmosphereCompositeMs || 0)
                + Number(compositeMetrics?.foliageAtmosphereCompositeMs || 0);
            metrics.compositeCallCount = Number(compositeMetrics?.compositeCallCount || 0);
            metrics.totalMeasuredMs = metrics.clearDynamicMs
                + metrics.entityLayerMs
                + metrics.particleLayerMs
                + metrics.uiLayerMs
                + metrics.debugLayerMs
                + metrics.canvasClearMs
                + metrics.compositeMs;
            this.lastRenderMetrics = metrics;
            this.clearRenderFailure();
            return metrics;
        } catch (error) {
            const summary = this.recordRenderFailure(error, 'render');
            metrics.failure = summary;
            this.lastRenderMetrics = metrics;
            this.drawRenderFailureOverlay(summary);
            return metrics;
        }
    }
    
    // Mark entities as needing resort (call when entities move or spawn)
    markEntitiesDirty() {
        this.entitiesDirty = true;
    }
    
    // Draw entities layer
    drawEntitiesLayer() {
        const layer = this.layers.entities;
        const blocksLayer = this.layers.blocks;
        this.beginEntityComponentCostFrame();
        let blocksUsageCount = 0;
        let flowersDirectCount = 0;
        let behindUsageCount = 0;
        let entityUsageCount = 0;
        let blocksBounds = null;
        let flowersDirectBounds = null;
        let behindBounds = null;
        let entityBounds = null;
        const useCompositeDirtyRegions = this.shouldUseCompositeDirtyRegions();
        const useBlocksCompositeLayer = this.shouldUseBlocksCompositeLayer();
        const reuseBlocksCompositeLayer = this.shouldReuseBlocksCompositeLayer();
        const useDirectFlowerPresent = this.shouldUseDirectFlowerPresent(this.getVisibleSceneFlowerCount());
        const trackFamilyDrawCosts = this.shouldTrackEntityFamilyRenderCosts();
        const blockLayerEntities = [];
        const directFlowerEntities = [];
        const familyDrawMs = trackFamilyDrawCosts
            ? {
                entityFamilyButterflyMs: 0,
                entityFamilyFlowerMs: 0,
                entityFamilyCaterpillarMs: 0,
                entityFamilyBlockMs: 0,
                entityFamilyOtherMs: 0
            }
            : null;
        const familyCompositeBounds = (trackFamilyDrawCosts && useCompositeDirtyRegions)
            ? this.createEmptyFamilyBoundsMap()
            : null;
        const behindFamilyCompositeBounds = (trackFamilyDrawCosts && useCompositeDirtyRegions)
            ? this.createEmptyFamilyBoundsMap()
            : null;
        const entityEdgeOwners = (trackFamilyDrawCosts && useCompositeDirtyRegions)
            ? this.createEmptyCompositeEdgeOwners()
            : null;
        const behindEdgeOwners = (trackFamilyDrawCosts && useCompositeDirtyRegions)
            ? this.createEmptyCompositeEdgeOwners()
            : null;

        if (this.viewState.battleActive) {
            layer.push();
            this.drawBattleEntities(layer);
            this.lastLayerUsage.blocksActive = false;
            this.lastLayerUsage.blocksBounds = null;
            this.lastLayerUsage.blocksRegionSource = null;
            this.lastLayerUsage.flowersDirectActive = false;
            this.lastLayerUsage.flowersDirectBounds = null;
            this.lastLayerUsage.entitiesBehindActive = false;
            this.lastLayerUsage.entitiesBounds = null;
            this.lastLayerUsage.entitiesBehindBounds = null;
            this.lastLayerUsage.entityFamilyBounds = null;
            this.lastLayerUsage.entitiesBehindFamilyBounds = null;
            this.lastLayerUsage.entitiesRegionSource = null;
            this.lastLayerUsage.entitiesBehindRegionSource = null;
            this.directFlowerEntities = [];
            layer.pop();
            return {
                familyDrawMs,
                butterflyComponentDrawMs: this.consumeEntityComponentCostFrame()
            };
        }
        
        // Collect all entities from either EntityManager or direct gameCore access
        const allEntities = [];
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const state = gameCore.getGameState();
            if (this.isSectionSceneWorld() && state.viewMode === 'overview') {
                this.lastVisibleEntitySignature = 'overview';
                this.lastLayerUsage.blocksActive = false;
                this.lastLayerUsage.blocksBounds = null;
                this.lastLayerUsage.blocksRegionSource = null;
                this.lastLayerUsage.flowersDirectActive = false;
                this.lastLayerUsage.flowersDirectBounds = null;
                this.lastLayerUsage.entitiesBehindActive = false;
                this.lastLayerUsage.entitiesBounds = null;
                this.lastLayerUsage.entitiesBehindBounds = null;
                this.lastLayerUsage.entityFamilyBounds = null;
                this.lastLayerUsage.entitiesBehindFamilyBounds = null;
                this.lastLayerUsage.entitiesRegionSource = null;
                this.lastLayerUsage.entitiesBehindRegionSource = null;
                this.directFlowerEntities = [];
                return {
                    familyDrawMs,
                    butterflyComponentDrawMs: this.consumeEntityComponentCostFrame()
                };
            }
            const visibleEntities = this.isSectionSceneWorld() && typeof gameCore.getFocusedSceneEntities === 'function'
                ? gameCore.getFocusedSceneEntities()
                : {
                    flowers: state.flowers || [],
                    caterpillars: state.caterpillars || [],
                    butterflies: state.butterflies || [],
                    blocks: state.blocks || []
                };
            allEntities.push(...(visibleEntities.blocks || []));
            allEntities.push(...(visibleEntities.flowers || []));
            allEntities.push(...(visibleEntities.caterpillars || []));
            allEntities.push(...(visibleEntities.butterflies || []));
        } else if (entityManager) {
            allEntities.push(...entityManager.getEntities('flowers'));
            allEntities.push(...entityManager.getEntities('butterflies'));
        } else if (typeof gameState !== 'undefined') {
            // Fallback to legacy gameState
            if (gameState.flowers) allEntities.push(...gameState.flowers);
            if (gameState.caterpillars) allEntities.push(...gameState.caterpillars);
            if (gameState.butterflies) allEntities.push(...gameState.butterflies);
        }

        if (!useBlocksCompositeLayer) {
            blocksLayer.clear();
            this.blocksLayerReuseState.lastSignature = null;
        }

        const dynamicVisibleIds = allEntities.map(entity => entity?.id || 'unknown');
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const state = gameCore.getGameState();
            this.currentVisibleEntitySignature = `${state.viewMode || 'focused-garden'}|${state.focusedZoneId || 'none'}|${dynamicVisibleIds.join(',')}`;
        } else if (entityManager) {
            this.currentVisibleEntitySignature = `entityManager|${dynamicVisibleIds.join(',')}`;
        } else {
            this.currentVisibleEntitySignature = `legacy|${dynamicVisibleIds.join(',')}`;
        }

        // Check if we need to resort entities
        if (
            this.entitiesDirty
            || this.lastEntityCount !== allEntities.length
            || this.lastVisibleEntitySignature !== this.currentVisibleEntitySignature
        ) {
            // Reuse cached array instead of slice() to avoid allocation
            this.entitySortingCache.length = 0; // Clear without allocation
            for (let i = 0; i < allEntities.length; i++) {
                this.entitySortingCache[i] = allEntities[i];
            }
            
            // Sort by resolved depth so nearer entities and butterflies render on top.
            this.entitySortingCache.sort((a, b) => {
                const aDepth = typeof a.zIndex === 'number'
                    ? a.zIndex
                    : ((a.gridPos ? a.gridPos.y : a.y) * 1000) + (a.gridPos ? a.gridPos.x : a.x);
                const bDepth = typeof b.zIndex === 'number'
                    ? b.zIndex
                    : ((b.gridPos ? b.gridPos.y : b.y) * 1000) + (b.gridPos ? b.gridPos.x : b.x);
                return aDepth - bDepth;
            });
            
            // Swap the sorted cache with sortedEntities
            const temp = this.sortedEntities;
            this.sortedEntities = this.entitySortingCache;
            this.entitySortingCache = temp;
            
            this.entitiesDirty = false;
            this.lastEntityCount = allEntities.length;
            this.lastVisibleEntitySignature = this.currentVisibleEntitySignature;
        }

        // Draw sorted entities — route spawning butterflies to behind layer
        // Draw sorted entities â€” route spawning butterflies to behind layer
        const behindLayer = this.layers.entitiesBehind;
        for (let entity of this.sortedEntities) {
            const compositeBounds = useCompositeDirtyRegions
                ? this.estimateEntityCompositeBounds(entity)
                : null;
            const familyMetricKey = trackFamilyDrawCosts
                ? this.getEntityFamilyRenderMetricKey(entity)
                : null;
            const familyCompositeKey = (trackFamilyDrawCosts && useCompositeDirtyRegions)
                ? this.getEntityFamilyCompositeKey(entity)
                : null;
            const routeToBlocksLayer = !!(
                useBlocksCompositeLayer
                && familyCompositeKey === 'block'
                && !entity?.isSpawning
                && !entity?.zoneTravel?.renderBehindCover
                && !entity?.carriedById
            );
            const routeToDirectFlowers = !!(
                useDirectFlowerPresent
                && familyCompositeKey === 'flower'
                && !entity?.isSpawning
                && !entity?.zoneTravel?.renderBehindCover
            );
            const drawStart = trackFamilyDrawCosts ? this.getNowMs() : 0;
            if (entity.isSpawning || !!entity?.zoneTravel?.renderBehindCover) {
                entity.draw(behindLayer);
                behindUsageCount += 1;
                behindBounds = this.expandCompositeBounds(behindBounds, compositeBounds);
                if (behindEdgeOwners && compositeBounds) {
                    this.updateCompositeEdgeOwners(behindEdgeOwners, entity, compositeBounds);
                }
                if (behindFamilyCompositeBounds && familyCompositeKey && compositeBounds) {
                    behindFamilyCompositeBounds[familyCompositeKey] = this.expandCompositeBounds(
                    behindFamilyCompositeBounds[familyCompositeKey],
                        compositeBounds
                    );
                }
            } else if (routeToDirectFlowers) {
                directFlowerEntities.push(entity);
                flowersDirectCount += 1;
                flowersDirectBounds = this.expandCompositeBounds(flowersDirectBounds, compositeBounds);
            } else if (routeToBlocksLayer) {
                blockLayerEntities.push(entity);
                blocksUsageCount += 1;
                blocksBounds = this.expandCompositeBounds(blocksBounds, compositeBounds);
            } else {
                entity.draw(layer);
                entityUsageCount += 1;
                entityBounds = this.expandCompositeBounds(entityBounds, compositeBounds);
                if (entityEdgeOwners && compositeBounds) {
                    this.updateCompositeEdgeOwners(entityEdgeOwners, entity, compositeBounds);
                }
                if (familyCompositeBounds && familyCompositeKey && compositeBounds) {
                    familyCompositeBounds[familyCompositeKey] = this.expandCompositeBounds(
                        familyCompositeBounds[familyCompositeKey],
                        compositeBounds
                    );
                }
            }
            if (trackFamilyDrawCosts && familyMetricKey) {
                familyDrawMs[familyMetricKey] += this.getNowMs() - drawStart;
            }
        }

        if (useBlocksCompositeLayer) {
            const blockLayerSignature = this.buildBlocksLayerSignature(blockLayerEntities);
            const shouldRedrawBlocksLayer = !(
                reuseBlocksCompositeLayer
                && this.blocksLayerReuseState.lastSignature === blockLayerSignature
            );
            if (shouldRedrawBlocksLayer) {
                blocksLayer.clear();
                for (const blockEntity of blockLayerEntities) {
                    blockEntity.draw(blocksLayer);
                }
            }
            this.blocksLayerReuseState.lastSignature = blockLayerSignature;
        }

        this.lastLayerUsage.blocksActive = blocksUsageCount > 0;
        this.lastLayerUsage.blocksBounds = blocksBounds;
        this.lastLayerUsage.blocksRegionSource = null;
        this.lastLayerUsage.flowersDirectActive = flowersDirectCount > 0;
        this.lastLayerUsage.flowersDirectBounds = flowersDirectBounds;
        this.lastLayerUsage.entitiesBehindActive = behindUsageCount > 0;
        this.lastLayerUsage.entityUsageCount = entityUsageCount;
        this.lastLayerUsage.entitiesBounds = entityBounds;
        this.lastLayerUsage.entitiesBehindBounds = behindBounds;
        this.lastLayerUsage.entityFamilyBounds = familyCompositeBounds;
        this.lastLayerUsage.entitiesBehindFamilyBounds = behindFamilyCompositeBounds;
        this.lastLayerUsage.entitiesRegionSource = null;
        this.lastLayerUsage.entitiesBehindRegionSource = null;
        this.directFlowerEntities = directFlowerEntities;
        return {
            familyDrawMs,
            entityFamilyCompositeBounds: this.buildFamilyCompositeBoundsMetrics(familyCompositeBounds, 'entityFamily', entityBounds),
            entitiesBehindFamilyCompositeBounds: this.buildFamilyCompositeBoundsMetrics(behindFamilyCompositeBounds, 'behindEntityFamily', behindBounds),
            entityCompositeEdgeOwners: this.buildCompositeEdgeOwnerMetrics(entityEdgeOwners, 'entityComposite'),
            entitiesBehindCompositeEdgeOwners: this.buildCompositeEdgeOwnerMetrics(behindEdgeOwners, 'behindEntityComposite'),
            butterflyComponentDrawMs: this.consumeEntityComponentCostFrame()
        };
    }

    shouldTrackEntityFamilyRenderCosts() {
        return !!(
            (typeof telemetrySystem !== 'undefined' && telemetrySystem?.isSessionCaptureActive?.())
            || (typeof gameCore !== 'undefined' && gameCore?.getDebugMode?.().enabled)
            || (typeof debugMode !== 'undefined' && debugMode?.enabled)
        );
    }

    beginEntityComponentCostFrame() {
        this.currentEntityComponentCosts = this.shouldTrackEntityFamilyRenderCosts()
            ? {
                entityFamilyButterflyAfterimageMs: 0,
                entityFamilyButterflyWingMs: 0,
                entityFamilyButterflyBodyMs: 0,
                entityFamilyButterflyAntennaMs: 0,
                entityFamilyButterflyOverlayMs: 0
            }
            : null;
    }

    accumulateEntityComponentRenderCost(metricKey, deltaMs = 0) {
        if (!this.currentEntityComponentCosts || !metricKey) return;
        this.currentEntityComponentCosts[metricKey] = Number(this.currentEntityComponentCosts[metricKey] || 0)
            + Number(deltaMs || 0);
    }

    consumeEntityComponentCostFrame() {
        const costs = this.currentEntityComponentCosts;
        this.currentEntityComponentCosts = null;
        return costs ? { ...costs } : null;
    }

    getEntityFamilyRenderMetricKey(entity) {
        const entityType = entity?.lifeSim?.identity?.entityType
            || entity?.objectProfile?.entityType
            || entity?.entityType
            || 'other';
        if (entityType === 'butterfly') return 'entityFamilyButterflyMs';
        if (entityType === 'flower') return 'entityFamilyFlowerMs';
        if (entityType === 'caterpillar') return 'entityFamilyCaterpillarMs';
        if (entityType === 'block') return 'entityFamilyBlockMs';
        return 'entityFamilyOtherMs';
    }

    getEntityFamilyCompositeKey(entity) {
        const entityType = entity?.lifeSim?.identity?.entityType
            || entity?.objectProfile?.entityType
            || entity?.entityType
            || 'other';
        if (entityType === 'butterfly') return 'butterfly';
        if (entityType === 'flower') return 'flower';
        if (entityType === 'caterpillar') return 'caterpillar';
        if (entityType === 'block') return 'block';
        return 'other';
    }

    createEmptyFamilyBoundsMap() {
        return {
            butterfly: null,
            flower: null,
            caterpillar: null,
            block: null,
            other: null
        };
    }

    createEmptyCompositeEdgeOwners() {
        return {
            left: null,
            right: null,
            top: null,
            bottom: null
        };
    }

    getCompositeOwnerInfo(entity = null) {
        const entityType = entity?.lifeSim?.identity?.entityType
            || entity?.objectProfile?.entityType
            || entity?.entityType
            || 'other';
        return {
            id: entity?.id || null,
            type: entityType
        };
    }

    updateCompositeEdgeOwners(edgeOwners, entity, bounds) {
        if (!edgeOwners || !bounds) return;
        const ownerInfo = this.getCompositeOwnerInfo(entity);
        if (!edgeOwners.left || bounds.minX < edgeOwners.left.value) {
            edgeOwners.left = { ...ownerInfo, value: bounds.minX };
        }
        if (!edgeOwners.right || bounds.maxX > edgeOwners.right.value) {
            edgeOwners.right = { ...ownerInfo, value: bounds.maxX };
        }
        if (!edgeOwners.top || bounds.minY < edgeOwners.top.value) {
            edgeOwners.top = { ...ownerInfo, value: bounds.minY };
        }
        if (!edgeOwners.bottom || bounds.maxY > edgeOwners.bottom.value) {
            edgeOwners.bottom = { ...ownerInfo, value: bounds.maxY };
        }
    }

    buildCompositeEdgeOwnerMetrics(edgeOwners, prefix = 'entityComposite') {
        if (!edgeOwners || typeof edgeOwners !== 'object') return null;
        return {
            [`${prefix}LeftOwnerType`]: edgeOwners.left?.type || null,
            [`${prefix}LeftOwnerId`]: edgeOwners.left?.id || null,
            [`${prefix}RightOwnerType`]: edgeOwners.right?.type || null,
            [`${prefix}RightOwnerId`]: edgeOwners.right?.id || null,
            [`${prefix}TopOwnerType`]: edgeOwners.top?.type || null,
            [`${prefix}TopOwnerId`]: edgeOwners.top?.id || null,
            [`${prefix}BottomOwnerType`]: edgeOwners.bottom?.type || null,
            [`${prefix}BottomOwnerId`]: edgeOwners.bottom?.id || null
        };
    }

    buildFamilyCompositeBoundsMetrics(boundsMap, prefix = 'entityFamily', overallBounds = null) {
        if (!boundsMap || typeof boundsMap !== 'object') return null;
        const sourceWidth = gameConfig?.canvas?.baseWidth || gameConfig?.canvas?.targetWidth || 1;
        const sourceHeight = gameConfig?.canvas?.baseHeight || gameConfig?.canvas?.targetHeight || 1;
        const metrics = {};
        let leftOwner = null;
        let rightOwner = null;
        let topOwner = null;
        let bottomOwner = null;

        for (const [family, bounds] of Object.entries(boundsMap)) {
            const normalized = this.normalizeRegionSource(bounds, sourceWidth, sourceHeight);
            const familyLabel = family.charAt(0).toUpperCase() + family.slice(1);
            metrics[`${prefix}${familyLabel}CompositeWidth`] = Number(normalized?.width || 0);
            metrics[`${prefix}${familyLabel}CompositeHeight`] = Number(normalized?.height || 0);
            metrics[`${prefix}${familyLabel}CompositeAreaRatio`] = Number(normalized?.areaRatio || 0);

            if (!bounds) continue;
            if (!leftOwner || bounds.minX < leftOwner.value) {
                leftOwner = { family, value: bounds.minX };
            }
            if (!rightOwner || bounds.maxX > rightOwner.value) {
                rightOwner = { family, value: bounds.maxX };
            }
            if (!topOwner || bounds.minY < topOwner.value) {
                topOwner = { family, value: bounds.minY };
            }
            if (!bottomOwner || bounds.maxY > bottomOwner.value) {
                bottomOwner = { family, value: bounds.maxY };
            }
        }

        if (overallBounds) {
            metrics[`${prefix}CompositeLeftOwner`] = leftOwner?.family || null;
            metrics[`${prefix}CompositeRightOwner`] = rightOwner?.family || null;
            metrics[`${prefix}CompositeTopOwner`] = topOwner?.family || null;
            metrics[`${prefix}CompositeBottomOwner`] = bottomOwner?.family || null;
        }
        return metrics;
    }

    buildBlocksLayerSignature(blockEntities = []) {
        if (!Array.isArray(blockEntities) || blockEntities.length === 0) {
            return 'empty';
        }
        return blockEntities.map(block => [
            block?.id || 'block',
            Math.round(Number(block?.x || 0)),
            Math.round(Number(block?.y || 0)),
            Number(block?.stackIndex || 0),
            block?.supportBlockId || 'ground',
            block?.currentZoneId || 'zone'
        ].join(':')).join('|');
    }

    // Draw particles layer
    drawParticlesLayer() {
        const layer = this.layers.particles;
        layer.push();

        if (this.isSectionSceneWorld() && gameCore?.getGameState?.().viewMode === 'overview') {
            layer.pop();
            return;
        }
        
        // Draw particles from gameCore or fallback sources
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            if (gameCore.particleSystem) {
                gameCore.particleSystem.draw(layer);
                this.lastLayerUsage.particlesActive = (gameCore.particleSystem?.getRenderStats?.()?.particleCount || 0) > 0;
            }
        } else if (window.gameState) {
            if (window.gameState.particleSystem) {
                window.gameState.particleSystem.draw(layer);
                this.lastLayerUsage.particlesActive = (window.gameState.particleSystem?.getRenderStats?.()?.particleCount || 0) > 0;
            }
        }
        
        layer.pop();
    }

    getVisibleSpatialBlocks(gameState = {}) {
        if (this.isSectionSceneWorld() && typeof gameCore?.getFocusedSceneEntities === 'function') {
            return gameCore.getFocusedSceneEntities()?.blocks || [];
        }

        const focusedZoneId = gameState?.focusedZoneId || gameCore?.getFocusedZoneId?.() || null;
        return (gameState?.blocks || []).filter(block => {
            const zoneId = gameCore?.getEntityZoneId?.(block, null)
                || block?.currentZoneId
                || null;
            return !focusedZoneId || zoneId === focusedZoneId;
        });
    }

    getSpatialShellPalette(summary = {}) {
        if (summary?.entityType === 'block') {
            if (summary?.supportState === 'carried') {
                return {
                    accent: [240, 212, 152],
                    fill: [62, 48, 28, 214],
                    text: [252, 244, 226]
                };
            }
            if (summary?.supportState === 'unsupported') {
                return {
                    accent: [255, 166, 166],
                    fill: [68, 30, 30, 214],
                    text: [255, 236, 236]
                };
            }
            if ((summary?.stackHeight || 0) > 1) {
                return {
                    accent: [164, 212, 255],
                    fill: [28, 44, 58, 214],
                    text: [238, 246, 255]
                };
            }
        }

        if (summary?.contact?.insideShelter) {
            return {
                accent: [164, 226, 184],
                fill: [24, 46, 36, 210],
                text: [236, 248, 240]
            };
        }
        if (summary?.contact?.blocked) {
            return {
                accent: [246, 186, 132],
                fill: [58, 36, 24, 212],
                text: [252, 242, 232]
            };
        }
        return {
            accent: [162, 206, 255],
            fill: [24, 38, 54, 210],
            text: [236, 244, 252]
        };
    }

    drawSpatialShellCard(layer, anchorX, anchorY, title, lines = [], palette = {}) {
        const safeLines = (lines || []).filter(Boolean).slice(0, 3);
        if (!safeLines.length) return null;

        layer.push();
        layer.textAlign(LEFT, TOP);
        layer.textSize(7);
        let cardWidth = Math.max(102, (typeof textMeasureCache !== 'undefined' ? textMeasureCache.measure(layer, title || 'Spatial') : layer.textWidth(title || 'Spatial')) + 12);
        for (const line of safeLines) {
            cardWidth = Math.max(cardWidth, (typeof textMeasureCache !== 'undefined' ? textMeasureCache.measure(layer, line) : layer.textWidth(line)) + 12);
        }
        const cardHeight = 14 + (safeLines.length * 8);
        const maxX = Math.max(8, (layer.width || gameConfig?.canvas?.baseWidth || 960) - cardWidth - 8);
        const cardX = Math.max(8, Math.min(anchorX - (cardWidth / 2), maxX));
        const cardY = Math.max(8, anchorY - cardHeight);

        layer.stroke(palette.accent?.[0] || 162, palette.accent?.[1] || 206, palette.accent?.[2] || 255, 220);
        layer.strokeWeight(1.2);
        layer.fill(palette.fill?.[0] || 24, palette.fill?.[1] || 38, palette.fill?.[2] || 54, 214);
        layer.rect(cardX, cardY, cardWidth, cardHeight, 7);
        layer.noStroke();
        layer.fill(palette.accent?.[0] || 162, palette.accent?.[1] || 206, palette.accent?.[2] || 255, 255);
        layer.text(title || 'Spatial', cardX + 6, cardY + 4);
        layer.fill(palette.text?.[0] || 236, palette.text?.[1] || 244, palette.text?.[2] || 252, 255);
        let lineY = cardY + 12;
        for (const line of safeLines) {
            layer.text(line, cardX + 6, lineY);
            lineY += 8;
        }
        layer.pop();

        return {
            x: cardX,
            y: cardY,
            width: cardWidth,
            height: cardHeight
        };
    }

    drawSpatialShellOverlay(layer, gameState, options = {}) {
        this.spatialShellOverlayState = null;
        if (!layer || !gameState || this.viewState.battleActive || typeof physicsSystem === 'undefined') {
            return;
        }

        const focusEntity = gameUI?.inspectPanel?.visible
            ? gameUI?.getLockedInspectTarget?.(gameState) || null
            : null;
        const focusSummary = focusEntity
            ? physicsSystem.getEntitySpatialSummary?.(focusEntity, gameState)
            : null;
        const linkedEntity = focusSummary?.carry?.attachedObjectId
            ? physicsSystem.getEntityById?.(focusSummary.carry.attachedObjectId, gameState)
            : null;
        const linkedSummary = linkedEntity
            ? physicsSystem.getEntitySpatialSummary?.(linkedEntity, gameState)
            : null;
        const blockBadges = [];
        if (options.debugEnabled) {
            const visibleBlocks = this.getVisibleSpatialBlocks(gameState);

            for (const block of visibleBlocks) {
                const summary = physicsSystem.getEntitySpatialSummary?.(block, gameState);
                if (!summary) continue;
                const label = summary.supportState === 'carried'
                    ? 'CARRY'
                    : summary.supportState === 'unsupported'
                        ? 'UNSTABLE'
                        : summary.stackHeight > 1
                            ? `STACK ${summary.stackHeight}`
                            : null;
                if (!label) continue;

                const palette = this.getSpatialShellPalette(summary);
                const lift = typeof block?.getVisualLift === 'function' ? block.getVisualLift() : 0;
                const badgeY = (block.y || 0) - lift - 18;
                this.drawSpatialShellCard(layer, block.x || 0, badgeY, label, [
                    summary.supportState === 'carried'
                        ? 'anchor live'
                        : `support ${summary.supportState || 'grounded'}`
                ], palette);
                blockBadges.push({
                    entityId: summary.id,
                    label,
                    supportState: summary.supportState,
                    stackHeight: summary.stackHeight
                });
            }
        }

        if (!focusSummary && !blockBadges.length) {
            return;
        }

        if (focusSummary && focusEntity) {
            const palette = this.getSpatialShellPalette(focusSummary);
            const focusX = focusEntity.x || 0;
            const focusY = focusEntity.y || 0;

            layer.push();
            layer.noFill();
            layer.stroke(palette.accent[0], palette.accent[1], palette.accent[2], 230);
            layer.strokeWeight(1.5);
            layer.ellipse(focusX, focusY + 4, 28, 12);
            layer.stroke(palette.accent[0], palette.accent[1], palette.accent[2], 162);
            layer.line(focusX, focusY - 4, focusX, focusY - 10);
            layer.pop();

            if (linkedSummary && linkedEntity) {
                const anchor = linkedSummary.carry?.anchor || null;
                const targetX = anchor?.x ?? linkedEntity.x ?? focusX;
                const targetY = (anchor?.y ?? linkedEntity.y ?? focusY) - 4;
                layer.push();
                layer.stroke(240, 212, 152, 188);
                layer.strokeWeight(1.2);
                layer.line(focusX, focusY - 6, targetX, targetY);
                layer.noStroke();
                layer.fill(240, 212, 152, 236);
                layer.circle(targetX, targetY, 5);
                layer.pop();
            }

            this.drawSpatialShellCard(
                layer,
                focusX,
                focusY - 12,
                gameUI?.getEntityDisplayName?.(focusEntity, 'Focus') || focusSummary.displayName || 'Focus',
                [focusSummary.headline, focusSummary.detail],
                palette
            );
        }

        this.spatialShellOverlayState = {
            focusId: focusSummary?.id || null,
            focusLines: focusSummary ? [focusSummary.headline, focusSummary.detail] : [],
            linkedId: linkedSummary?.id || null,
            linkedLines: linkedSummary
                ? [linkedSummary.headline, linkedSummary.detail]
                : [],
            blockBadges,
            debugEnabled: !!options.debugEnabled
        };
    }
    
    // Draw UI layer
    drawUILayer(gameState = null, debugEnabled = null) {
        const layer = this.layers.ui;
        layer.push();
        this.lastLayerUsage.uiActive = true;
        
        const resolvedDebugEnabled = debugEnabled === null
            ? ((typeof gameCore !== 'undefined' && gameCore.getDebugMode().enabled) ||
               (typeof debugMode !== 'undefined' && debugMode.enabled))
            : debugEnabled;
        const resolvedGameState = gameState || (
            (typeof gameCore !== 'undefined' && gameCore.isInitialized())
                ? gameCore.getGameState()
                : (typeof window !== 'undefined' && typeof window.gameState !== 'undefined' ? window.gameState : {})
        );
        
        // World counters stay visible during normal play here; debug mode draws
        // them again on the debug layer so they remain readable above the debug
        // panel.
        if (!resolvedDebugEnabled && !this.viewState.battleActive) {
            this.drawZoneWorldOverlay(layer);
            this.drawTrainingGroundOverlay(layer);
            this.drawFPSCounter(layer);
        }

        if (!this.viewState.battleActive) {
            this.drawSpatialShellOverlay(layer, resolvedGameState, { debugEnabled: resolvedDebugEnabled });
        }

        // Use gameUI system if available
        if (typeof gameUI !== 'undefined' && gameUI.initialized) {
            // Draw using gameUI system
            gameUI.draw(layer, resolvedGameState, { enabled: resolvedDebugEnabled });
        } else {
            // Fallback to original inline drawing
            if (!resolvedDebugEnabled) {
                // Get state from gameCore or fallback
                let framesSinceMovement = 0;
                let flowerManager = null;
                let flowers = [];
                
                if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
                    const state = gameCore.getGameState();
                    framesSinceMovement = state.framesSinceMovement || 0;
                    flowerManager = gameCore.flowerManager;
                    flowers = state.flowers;
                } else if (typeof gameState !== 'undefined') {
                    framesSinceMovement = resolvedGameState.framesSinceMovement || 0;
                    flowerManager = resolvedGameState.flowerManager;
                    flowers = resolvedGameState.flowers;
                }
                
                // Legacy prototype hover rings and planting hints were retired
                // when the grand-plan player shell took over UI responsibility.
            }
        }
        
        // Draw special effects
        const accessibility = this.getAccessibilitySettings();
        const allowSpecialEffects = !accessibility.reducedMotion &&
            !(this.viewState.battleActive && accessibility.battleMotionSimplify);
        if (typeof specialEffects !== 'undefined' && allowSpecialEffects) {
            specialEffects.draw(layer);
        }
        
        layer.pop();
    }
    
    // Draw debug layer
    drawDebugLayer(gameState = null) {
        const layer = this.layers.debug;
        layer.push();
        this.lastLayerUsage.debugActive = true;

        if (typeof debugUI !== 'undefined' && debugUI.enabled) {
            debugUI.draw(layer);
        } else {
            if (gridManager) {
                gridManager.drawGrid(layer);
                gridManager.drawZones(layer);
            }
            this.drawDebugCursor(layer);
            this.drawDebugUI(layer);
        }

        if (!this.viewState.battleActive) {
            const accessibility = this.getAccessibilitySettings();
            const uiScale = typeof gameUI !== 'undefined' && gameUI.getEffectiveUiScale
                ? gameUI.getEffectiveUiScale()
                : (accessibility.uiScale || 1);
            const chipHeight = Math.max(12, Math.round(14 * uiScale));
            const bottomInset = Math.max(8, Math.round(10 * uiScale));
            this.drawFPSCounter(layer, {
                panelX: 8,
                panelY: gameConfig.canvas.baseHeight - chipHeight - bottomInset
            });
        }
        
        layer.pop();
    }

    getBattleMotionConfig() {
        const configured = gameConfig?.battle?.motion || {};
        return {
            attackAdvancePx: configured.attackAdvancePx || 32,
            attackDurationMs: configured.attackDurationMs || 560,
            hitRecoilPx: configured.hitRecoilPx || 16,
            hitReactionDurationMs: configured.hitReactionDurationMs || 340,
            rallyAdvancePx: configured.rallyAdvancePx || 12,
            rallyDurationMs: configured.rallyDurationMs || 520,
            rallyLiftPx: configured.rallyLiftPx || 6,
            guardBobPx: configured.guardBobPx || 3,
            guardDurationMs: configured.guardDurationMs || 420,
            retreatAdvancePx: configured.retreatAdvancePx || 34,
            retreatDurationMs: configured.retreatDurationMs || 520,
            projectileDurationMs: configured.projectileDurationMs || 460,
            idleBobPx: configured.idleBobPx || 2.2,
            releaseDurationMs: configured.releaseDurationMs || 980,
            roamRadiusX: configured.roamRadiusX || 20,
            roamRadiusY: configured.roamRadiusY || 12,
            engagementDriftPx: configured.engagementDriftPx || 14
        };
    }

    getBattleTimedProgress(timedState, nowMs = Date.now()) {
        if (!timedState?.startedAtMs || !timedState?.durationMs) return null;
        const progress = Math.max(0, Math.min(1, (nowMs - timedState.startedAtMs) / Math.max(1, timedState.durationMs)));
        return progress >= 1 ? null : progress;
    }

    getBattleDirection(fromPoint, toPoint, fallbackX = 0, fallbackY = 0) {
        const dx = (toPoint?.x ?? 0) - (fromPoint?.x ?? 0);
        const dy = (toPoint?.y ?? 0) - (fromPoint?.y ?? 0);
        const magnitude = Math.hypot(dx, dy);
        if (magnitude <= 0.0001) {
            return { x: fallbackX, y: fallbackY };
        }
        return {
            x: dx / magnitude,
            y: dy / magnitude
        };
    }

    getBattleParticipantPose(snapshot, participant, assignment, nowMs = Date.now()) {
        const motion = this.getBattleMotionConfig();
        const simplifyMotion = !!this.getAccessibilitySettings().battleMotionSimplify;
        const visual = participant?.battleVisual || {};
        const home = visual.homePosition || assignment?.position || { x: 400, y: 225 };
        const spawn = visual.spawnPosition || assignment?.spawnPosition || home;
        const posesById = snapshot?.metadata?.arena?.assignments || {};
        const releaseDurationMs = Math.max(1, motion.releaseDurationMs || 1);
        const createdAtMs = snapshot?.createdAtMs || nowMs;
        const releaseProgress = Math.max(0, Math.min(1, (nowMs - createdAtMs) / releaseDurationMs));
        const releaseEase = simplifyMotion
            ? Math.min(1, releaseProgress * 1.08)
            : 1 - Math.pow(1 - releaseProgress, 2);
        let x = lerp(spawn.x, home.x, releaseEase);
        let y = lerp(spawn.y, home.y, releaseEase);

        const roamWeight = 0.35 + (releaseEase * 0.65);
        const roamRadiusX = (assignment?.wanderRadiusX || motion.roamRadiusX || 0) * (simplifyMotion ? 0.55 : 1) * roamWeight;
        const roamRadiusY = (assignment?.wanderRadiusY || motion.roamRadiusY || 0) * (simplifyMotion ? 0.55 : 1) * roamWeight;
        const phase = ((typeof frameCount === 'number' ? frameCount : 0) + (visual.motionPhase || 0)) * 0.08;
        x += Math.sin((phase * 0.92) + ((assignment?.row || 0) * 0.8)) * roamRadiusX;
        x += Math.cos((phase * 0.38) + ((assignment?.col || 0) * 0.9)) * roamRadiusX * 0.32;
        y += Math.cos((phase * 1.12) + ((assignment?.col || 0) * 0.65)) * roamRadiusY;

        const roundProgress = Math.max(0, Math.min(1, (snapshot?.metadata?.roundNumber || 0) / 6));
        const engagementSign = assignment?.side === 'left' ? 1 : -1;
        x += engagementSign * (motion.engagementDriftPx || 0) * (0.18 + (roundProgress * 0.48)) * roamWeight;

        const actionProgress = this.getBattleTimedProgress(visual.action, nowMs);
        if (actionProgress != null) {
            if (visual.action?.type === 'attack') {
                const target = posesById?.[visual.action.targetId]?.position || visual.action.targetPosition || null;
                const direction = this.getBattleDirection(home, target, assignment?.side === 'left' ? 1 : -1, 0);
                const envelope = Math.sin(actionProgress * Math.PI);
                const advance = motion.attackAdvancePx * (simplifyMotion ? 0.62 : 1) * envelope;
                x += direction.x * advance;
                y += direction.y * advance;
            } else if (visual.action?.type === 'rally') {
                const target = posesById?.[visual.action.targetId]?.position || visual.action.targetPosition || null;
                const direction = this.getBattleDirection(home, target, assignment?.side === 'left' ? 1 : -1, 0);
                const envelope = Math.sin(actionProgress * Math.PI);
                const advance = motion.rallyAdvancePx * (simplifyMotion ? 0.72 : 1) * envelope;
                x += direction.x * advance;
                y += (direction.y * advance) - (motion.rallyLiftPx * envelope);
            } else if (visual.action?.type === 'guard') {
                y -= motion.guardBobPx * Math.sin(actionProgress * Math.PI);
            } else if (visual.action?.type === 'retreat') {
                const direction = assignment?.side === 'left'
                    ? { x: -1, y: 0 }
                    : { x: 1, y: 0 };
                const advance = motion.retreatAdvancePx * (simplifyMotion ? 0.65 : 1) * actionProgress;
                x += direction.x * advance;
            }
        }

        const reactionProgress = this.getBattleTimedProgress(visual.reaction, nowMs);
        if (reactionProgress != null) {
            if (visual.reaction?.type === 'hit') {
                const source = posesById?.[visual.reaction.sourceId]?.position || home;
                const direction = this.getBattleDirection(source, home, assignment?.side === 'left' ? -1 : 1, 0);
                const envelope = Math.sin(reactionProgress * Math.PI);
                const recoil = motion.hitRecoilPx * (simplifyMotion ? 0.66 : 1) * envelope;
                x += direction.x * recoil;
                y += direction.y * recoil;
            } else if (visual.reaction?.type === 'heal') {
                y -= Math.sin(reactionProgress * Math.PI) * motion.rallyLiftPx;
            }
        }

        const idleBob = motion.idleBobPx * (simplifyMotion ? 0.45 : 1);
        y += Math.sin(phase) * idleBob;

        return { x, y };
    }

    drawBattleHealthBar(layer, participant, pose, assignment) {
        if (!participant || !pose) return;
        const presentation = gameConfig?.battle?.presentation || {};
        const width = Math.max(10, presentation.healthBarWidth || 16);
        const height = Math.max(2, presentation.healthBarHeight || 3);
        const x = pose.x - (width / 2);
        const y = pose.y - 15;
        const hpRatio = Math.max(0, Math.min(1, (participant.hp || 0) / Math.max(1, participant.maxHp || 100)));
        const teamFrame = assignment?.side === 'right'
            ? [244, 192, 148]
            : [142, 198, 255];
        const fillColor = hpRatio > 0.55
            ? [112, 224, 154]
            : hpRatio > 0.28
                ? [236, 204, 112]
                : [226, 112, 98];
        const alpha = participant.defeated || participant.retreated ? 110 : 210;

        layer.push();
        layer.noStroke();
        layer.fill(0, 0, 0, alpha * 0.7);
        layer.rect(x - 1, y - 1, width + 2, height + 2, 2);
        layer.fill(18, 22, 28, alpha);
        layer.rect(x, y, width, height, 2);
        layer.fill(fillColor[0], fillColor[1], fillColor[2], alpha);
        layer.rect(x, y, width * hpRatio, height, 2);
        layer.noFill();
        layer.stroke(teamFrame[0], teamFrame[1], teamFrame[2], alpha);
        layer.strokeWeight(0.8);
        layer.rect(x, y, width, height, 2);
        layer.pop();
    }

    drawBattleTrailEffect(layer, fromPoint, toPoint, visual, alpha = 180) {
        if (!fromPoint || !toPoint || !visual) return;
        layer.push();
        layer.noStroke();
        for (let step = 0; step < 5; step++) {
            const t = step / 4;
            const x = lerp(fromPoint.x, toPoint.x, t);
            const y = lerp(fromPoint.y, toPoint.y, t);
            const pulse = 1 - (t * 0.5);
            layer.fill(visual.primaryColor[0], visual.primaryColor[1], visual.primaryColor[2], alpha * pulse * 0.55);
            layer.circle(x, y, 3.2 * pulse);
            layer.fill(visual.secondaryColor[0], visual.secondaryColor[1], visual.secondaryColor[2], alpha * pulse * 0.8);
            layer.circle(x, y, 1.6 * pulse);
        }
        layer.pop();
    }

    drawBattlePetalBloom(layer, x, y, visual, alpha = 180, scale = 1) {
        layer.push();
        layer.noStroke();
        for (let index = 0; index < 5; index++) {
            const angle = ((Math.PI * 2) / 5) * index;
            const px = x + (Math.cos(angle) * 8 * scale);
            const py = y + (Math.sin(angle) * 8 * scale);
            layer.fill(visual.secondaryColor[0], visual.secondaryColor[1], visual.secondaryColor[2], alpha * 0.78);
            layer.ellipse(px, py, 6 * scale, 10 * scale);
        }
        layer.fill(visual.primaryColor[0], visual.primaryColor[1], visual.primaryColor[2], alpha * 0.95);
        layer.circle(x, y, 5.2 * scale);
        layer.pop();
    }

    drawBattleStarBurst(layer, x, y, primaryColor, secondaryColor, alpha = 180, size = 9) {
        layer.push();
        layer.stroke(primaryColor[0], primaryColor[1], primaryColor[2], alpha * 0.9);
        layer.strokeWeight(1.8);
        for (let index = 0; index < 4; index++) {
            const angle = (Math.PI / 4) * index;
            const dx = Math.cos(angle) * size;
            const dy = Math.sin(angle) * size;
            layer.line(x - dx, y - dy, x + dx, y + dy);
        }
        layer.noStroke();
        layer.fill(secondaryColor[0], secondaryColor[1], secondaryColor[2], alpha);
        layer.circle(x, y, Math.max(3.2, size * 0.45));
        layer.pop();
    }

    drawBattleBraceCue(layer, pose, assignment, alpha = 180) {
        const forward = assignment?.side === 'left' ? 1 : -1;
        layer.push();
        layer.noFill();
        layer.stroke(210, 232, 255, alpha * 0.72);
        layer.strokeWeight(1.4);
        layer.arc(pose.x + (forward * 4), pose.y, 14, 14, -0.9, 0.9);
        layer.line(pose.x + (forward * 2), pose.y - 6, pose.x + (forward * 2), pose.y + 6);
        layer.pop();
    }

    drawBattleRetreatCue(layer, pose, assignment, alpha = 180) {
        const retreatDir = assignment?.side === 'left' ? -1 : 1;
        layer.push();
        layer.stroke(228, 236, 246, alpha * 0.72);
        layer.strokeWeight(1.2);
        layer.line(pose.x, pose.y, pose.x + (retreatDir * 10), pose.y);
        layer.line(pose.x + (retreatDir * 10), pose.y, pose.x + (retreatDir * 6), pose.y - 3);
        layer.line(pose.x + (retreatDir * 10), pose.y, pose.x + (retreatDir * 6), pose.y + 3);
        layer.pop();
    }

    drawBattleAbilityActivation(layer, participant, pose, assignment, nowMs = Date.now()) {
        const visual = participant?.battleVisual;
        const action = visual?.action;
        if (!visual || !action) return;
        const progress = this.getBattleTimedProgress(action, nowMs);
        if (progress == null) return;
        const alpha = 190 * (1 - (progress * 0.45));
        const effectStyle = action.effectStyle || action.visualSubtype || action.type;
        const specialScale = action.isSpecial ? 1.14 : 1;

        if (action.type === 'guard') {
            if (effectStyle === 'shimmer-veil') {
                layer.push();
                layer.noFill();
                layer.stroke(visual.secondaryColor[0], visual.secondaryColor[1], visual.secondaryColor[2], alpha * 0.58);
                layer.strokeWeight(1.2);
                layer.arc(pose.x, pose.y + 1, 24, 18, 0.3, Math.PI - 0.3);
                layer.pop();
            } else if (effectStyle === 'golden-guard') {
                this.drawBattleStarBurst(layer, pose.x, pose.y - 1, visual.primaryColor, visual.secondaryColor, alpha, 7);
            } else {
                this.drawBattleBraceCue(layer, pose, assignment, alpha);
            }
            return;
        }

        if (action.type === 'retreat') {
            this.drawBattleRetreatCue(layer, pose, assignment, alpha);
            return;
        }

        if (visual.visualStyle === 'trail') {
            this.drawBattleTrailEffect(layer, visual.homePosition || assignment?.position || pose, pose, visual, alpha);
            if (effectStyle === 'petal-bloom' || effectStyle === 'bloom-ring') {
                this.drawBattlePetalBloom(layer, pose.x, pose.y, visual, alpha * 0.8, 0.8);
            }
            return;
        }

        if (typeof specialEffects === 'undefined') return;
        const effect = {
            x: pose.x,
            y: pose.y,
            abilityRadius: Math.max(20, visual.abilityRadius || 28) * specialScale,
            symbol: visual.symbol || null,
            fallbackSymbol: visual.fallbackSymbol || '*',
            primaryColor: visual.primaryColor || [255, 255, 255],
            secondaryColor: visual.secondaryColor || visual.primaryColor || [255, 255, 255],
            phaseOffset: visual.motionPhase || 0,
            lifetime: 10,
            maxLifetime: 10
        };

        if (effectStyle === 'petal-bloom' || effectStyle === 'bloom-ring') {
            specialEffects.drawAbilityRing(layer, effect, alpha * 0.7);
            this.drawBattlePetalBloom(layer, pose.x, pose.y, visual, alpha, 0.92);
            return;
        }

        if (effectStyle === 'surge-ring') {
            specialEffects.drawAbilityRing(layer, effect, alpha * 0.8);
            layer.push();
            layer.stroke(visual.secondaryColor[0], visual.secondaryColor[1], visual.secondaryColor[2], alpha * 0.7);
            layer.strokeWeight(1.1);
            layer.line(pose.x - 8, pose.y + 2, pose.x - 2, pose.y - 5);
            layer.line(pose.x - 2, pose.y - 5, pose.x + 2, pose.y + 1);
            layer.line(pose.x + 2, pose.y + 1, pose.x + 8, pose.y - 4);
            layer.pop();
            return;
        }

        if (effectStyle === 'cascade-wave') {
            specialEffects.drawAbilitySymbol(layer, { ...effect, symbol: visual.symbol || null, fallbackSymbol: visual.fallbackSymbol || 'S' }, alpha * 0.7);
            layer.push();
            layer.noFill();
            layer.stroke(visual.primaryColor[0], visual.primaryColor[1], visual.primaryColor[2], alpha * 0.62);
            layer.strokeWeight(1.1);
            layer.circle(pose.x, pose.y, 18);
            layer.circle(pose.x, pose.y, 24);
            layer.pop();
            return;
        }

        if (effectStyle === 'lesson-glyph') {
            specialEffects.drawAbilitySymbol(layer, { ...effect, symbol: visual.symbol || null, fallbackSymbol: visual.fallbackSymbol || 'T' }, alpha);
            layer.push();
            layer.noFill();
            layer.stroke(visual.secondaryColor[0], visual.secondaryColor[1], visual.secondaryColor[2], alpha * 0.72);
            layer.strokeWeight(1.1);
            layer.quad(pose.x, pose.y - 9, pose.x + 8, pose.y, pose.x, pose.y + 9, pose.x - 8, pose.y);
            layer.pop();
            return;
        }

        if (effectStyle === 'welcome-pulse' || effectStyle === 'support-pulse') {
            specialEffects.drawAbilityRing(layer, effect, alpha);
            return;
        }

        if (effectStyle === 'shimmer-veil') {
            specialEffects.drawAbilityRing(layer, effect, alpha * 0.72);
            layer.push();
            layer.noFill();
            layer.stroke(visual.secondaryColor[0], visual.secondaryColor[1], visual.secondaryColor[2], alpha * 0.72);
            layer.strokeWeight(1.1);
            layer.arc(pose.x, pose.y, 16, 12, -0.2, Math.PI + 0.4);
            layer.pop();
            return;
        }

        if (effectStyle === 'golden-flare') {
            this.drawBattleStarBurst(layer, pose.x, pose.y, visual.primaryColor, visual.secondaryColor, alpha, 10);
            return;
        }

        if (visual.visualStyle === 'ring') {
            specialEffects.drawAbilityRing(layer, effect, alpha);
        } else {
            specialEffects.drawAbilitySymbol(layer, effect, alpha);
        }
    }

    drawBattleReactionEffect(layer, participant, pose, nowMs = Date.now()) {
        const reaction = participant?.battleVisual?.reaction;
        const visual = participant?.battleVisual;
        if (!reaction || !visual) return;
        const progress = this.getBattleTimedProgress(reaction, nowMs);
        if (progress == null || typeof specialEffects === 'undefined') return;
        const alpha = 185 * (1 - (progress * 0.45));

        if (reaction.type === 'hit') {
            if (reaction.reactionStyle === 'petal-bloom' || reaction.flowerRelated) {
                this.drawBattlePetalBloom(layer, pose.x, pose.y, visual, alpha * 0.9, 0.88);
            }
            if (reaction.reactionStyle === 'golden-flare') {
                this.drawBattleStarBurst(layer, pose.x, pose.y, visual.primaryColor || [255, 215, 0], visual.secondaryColor || [255, 255, 180], alpha, 7);
            }
            specialEffects.drawTrainingImpact(layer, {
                x: pose.x,
                y: pose.y,
                radius: 8 + Math.max(0, reaction.damage || 0) * 0.2
            }, alpha);
            return;
        }

        if (reaction.type === 'heal') {
            if (reaction.reactionStyle === 'bloom-ring' || reaction.flowerRelated) {
                this.drawBattlePetalBloom(layer, pose.x, pose.y, visual, alpha * 0.78, 0.82);
            }
            specialEffects.drawAbilitySymbol(layer, {
                x: pose.x,
                y: pose.y,
                symbol: '+',
                fallbackSymbol: '+',
                primaryColor: visual.primaryColor || [255, 255, 255],
                secondaryColor: visual.secondaryColor || [255, 255, 255],
                lifetime: 10,
                maxLifetime: 10
            }, alpha);
        }
    }

    drawBattleProjectiles(layer, snapshot, posesById, nowMs = Date.now()) {
        const projectiles = snapshot?.metadata?.visuals?.projectiles || [];
        if (!projectiles.length) return;
        const simplifyMotion = !!this.getAccessibilitySettings().battleMotionSimplify;

        for (const projectile of projectiles) {
            const progress = this.getBattleTimedProgress(projectile, nowMs);
            if (progress == null) continue;

            const start = posesById.get(projectile.actorId) || snapshot?.metadata?.arena?.assignments?.[projectile.actorId]?.position;
            const end = posesById.get(projectile.targetId) || snapshot?.metadata?.arena?.assignments?.[projectile.targetId]?.position;
            if (!start || !end) continue;

            const x = lerp(start.x, end.x, progress);
            const y = lerp(start.y, end.y, progress);
            const alpha = 210 * (1 - (progress * 0.3));
            const style = projectile.projectileStyle || (projectile.actionType === 'rally' ? 'support-pulse' : 'strike-bolt');

            layer.push();
            layer.stroke(projectile.primaryColor[0], projectile.primaryColor[1], projectile.primaryColor[2], alpha * 0.4);
            layer.strokeWeight(projectile.actionType === 'rally' ? 1.6 : 1.2);
            if (!simplifyMotion) {
                layer.line(start.x, start.y, x, y);
            }

            if (style === 'petal-burst' || style === 'petal-ribbon') {
                this.drawBattlePetalBloom(layer, x, y, {
                    primaryColor: projectile.primaryColor,
                    secondaryColor: projectile.secondaryColor
                }, alpha * 0.92, 0.62);
            } else if (style === 'violet-surge') {
                layer.stroke(projectile.secondaryColor[0], projectile.secondaryColor[1], projectile.secondaryColor[2], alpha * 0.82);
                layer.strokeWeight(1.4);
                layer.line(x - 7, y + 1, x - 1, y - 4);
                layer.line(x - 1, y - 4, x + 2, y + 1);
                layer.line(x + 2, y + 1, x + 8, y - 3);
            } else if (style === 'cascade-shard') {
                layer.noStroke();
                layer.fill(projectile.secondaryColor[0], projectile.secondaryColor[1], projectile.secondaryColor[2], alpha * 0.95);
                layer.quad(x, y - 5, x + 4, y, x, y + 5, x - 2, y);
                layer.quad(x + 4, y - 3, x + 8, y, x + 4, y + 3, x + 2, y);
            } else if (style === 'lesson-glyph') {
                layer.noFill();
                layer.stroke(projectile.secondaryColor[0], projectile.secondaryColor[1], projectile.secondaryColor[2], alpha * 0.85);
                layer.strokeWeight(1.2);
                layer.quad(x, y - 6, x + 6, y, x, y + 6, x - 6, y);
            } else if (style === 'warm-orb' || style === 'support-pulse' || style === 'shimmer-orb') {
                layer.noStroke();
                layer.fill(projectile.secondaryColor[0], projectile.secondaryColor[1], projectile.secondaryColor[2], alpha);
                layer.circle(x, y, style === 'support-pulse' ? 7 : 8);
                layer.fill(projectile.primaryColor[0], projectile.primaryColor[1], projectile.primaryColor[2], alpha * 0.72);
                layer.circle(x, y, style === 'support-pulse' ? 3.8 : 4.6);
            } else if (style === 'golden-star') {
                this.drawBattleStarBurst(layer, x, y, projectile.primaryColor, projectile.secondaryColor, alpha, 5.5);
            } else {
                layer.noStroke();
                layer.fill(projectile.secondaryColor[0], projectile.secondaryColor[1], projectile.secondaryColor[2], alpha);
                layer.circle(x, y, projectile.actionType === 'rally' ? 7 : 5);
                layer.fill(projectile.primaryColor[0], projectile.primaryColor[1], projectile.primaryColor[2], alpha * 0.7);
                layer.circle(x, y, projectile.actionType === 'rally' ? 3.8 : 2.8);
            }
            layer.pop();
        }
    }

    drawBattleFocusMarker(layer, pose, assignment, label = 'FOCUS') {
        if (!pose) return;
        const isLeft = assignment?.side !== 'right';
        const accent = isLeft ? [122, 182, 255] : [255, 202, 138];
        layer.push();
        layer.noFill();
        layer.stroke(accent[0], accent[1], accent[2], 220);
        layer.strokeWeight(1.5);
        layer.ellipse(pose.x, pose.y + 4, 24, 10);
        layer.stroke(accent[0], accent[1], accent[2], 168);
        layer.line(pose.x, pose.y - 11, pose.x, pose.y - 5);
        layer.noStroke();
        layer.fill(accent[0], accent[1], accent[2], 236);
        layer.textAlign(CENTER, BOTTOM);
        layer.textSize(6);
        layer.text(label, pose.x, pose.y - 9);
        layer.pop();
    }

    drawBattleEntities(layer) {
        const battleId = gameCore?.getGameState?.().activeBattleId;
        const snapshot = typeof battleSystem !== 'undefined'
            ? battleSystem.getSnapshot?.(battleId)
            : null;
        const assignments = snapshot?.metadata?.arena?.assignments || {};
        const nowMs = Date.now();
        const byId = new Map((gameCore?.getGameState?.().butterflies || []).map(entity => [entity.id, entity]));
        const renderEntries = Object.entries(assignments)
            .map(([entityId, assignment]) => {
                const entity = byId.get(entityId) || battleSystem?.getParticipantSource?.(entityId);
                const participant = snapshot?.participantsById?.[entityId] || null;
                if (!entity || !assignment?.position || !participant) return null;
                const pose = this.getBattleParticipantPose(snapshot, participant, assignment, nowMs);
                return { entity, participant, assignment, pose };
            })
            .filter(Boolean)
            .sort((a, b) => a.pose.y - b.pose.y);

        const posesById = new Map(renderEntries.map(entry => [entry.entity.id, entry.pose]));

        for (const entry of renderEntries) {
            const { entity, participant, assignment, pose } = entry;
            const original = {
                x: entity.x,
                y: entity.y,
                zIndex: entity.zIndex,
                isSpawning: entity.isSpawning,
                gridPos: entity.gridPos ? { ...entity.gridPos } : null
            };
            entity.x = pose.x;
            entity.y = pose.y;
            entity.isSpawning = false;
            entity.gridPos = null;
            entity.zIndex = (pose.y * 1000) + pose.x + (assignment.role === 'support' ? -50 : 0);
            entity.draw(layer);
            this.drawBattleAbilityActivation(layer, participant, pose, assignment, nowMs);
            this.drawBattleReactionEffect(layer, participant, pose, nowMs);
            entity.x = original.x;
            entity.y = original.y;
            entity.zIndex = original.zIndex;
            entity.isSpawning = original.isSpawning;
            entity.gridPos = original.gridPos;
        }

        this.drawBattleProjectiles(layer, snapshot, posesById, nowMs);
        for (const entry of renderEntries) {
            this.drawBattleHealthBar(layer, entry.participant, entry.pose, entry.assignment);
        }

        const focusId = gameUI?.battleUi?.selectedParticipantId || null;
        if (focusId && posesById.has(focusId)) {
            const focusPose = posesById.get(focusId);
            const focusAssignment = assignments?.[focusId] || null;
            this.drawBattleFocusMarker(layer, focusPose, focusAssignment, 'WATCH');
        }
    }

    getZoneOverlayPalette(zone, isFocused = false) {
        const fallbackTint = isFocused ? [130, 170, 220, 72] : [120, 132, 148, 34];
        const tint = zone?.renderProfile?.overlayTint || fallbackTint;
        return {
            fill: isFocused ? [tint[0], tint[1], tint[2], Math.max(tint[3] || 52, 72)] : tint,
            stroke: isFocused ? [255, 248, 214, 235] : [232, 238, 246, 108],
            label: isFocused ? [255, 252, 232, 255] : [236, 242, 250, 220]
        };
    }

    drawZonePolygon(layer, bounds, fillColor = null, strokeColor = null, strokeWeight = 1) {
        if (!bounds) return;
        const top = gridManager.isoToScreen(bounds.minX, bounds.minY);
        const right = gridManager.isoToScreen(bounds.maxX + 1, bounds.minY);
        const bottom = gridManager.isoToScreen(bounds.maxX + 1, bounds.maxY + 1);
        const left = gridManager.isoToScreen(bounds.minX, bounds.maxY + 1);

        if (fillColor) {
            layer.fill(...fillColor);
        } else {
            layer.noFill();
        }

        if (strokeColor) {
            layer.stroke(...strokeColor);
            layer.strokeWeight(strokeWeight);
        } else {
            layer.noStroke();
        }

        layer.beginShape();
        layer.vertex(top.x, top.y);
        layer.vertex(right.x, right.y);
        layer.vertex(bottom.x, bottom.y);
        layer.vertex(left.x, left.y);
        layer.endShape(CLOSE);
    }

    getOverviewLayout() {
        return {
            panelX: 74,
            panelY: 92,
            panelWidth: 636,
            panelHeight: 292,
            headerX: 94,
            headerY: 106,
            cardWidth: 208,
            cardHeight: 116,
            startX: 124,
            startY: 148,
            gapX: 184,
            gapY: 106,
            closeButton: {
                x: 646,
                y: 106,
                width: 44,
                height: 24
            }
        };
    }

    getOverviewCards() {
        const zones = zoneSystem?.getZones?.() || [];
        if (!zones.length) return [];

        const layout = this.getOverviewLayout();
        const cardWidth = layout.cardWidth;
        const cardHeight = layout.cardHeight;
        const startX = layout.startX;
        const startY = layout.startY;
        const gapX = layout.gapX;
        const gapY = layout.gapY;

        return zones.map(zone => {
            const slot = zone.renderProfile?.overviewSlot || { col: 0, row: 0 };
            return {
                zone,
                x: startX + (slot.col * gapX),
                y: startY + (slot.row * gapY),
                width: cardWidth,
                height: cardHeight
            };
        });
    }

    getOverviewCloseButtonRect() {
        if (!this.isSectionSceneWorld()) return null;
        const layout = this.getOverviewLayout();
        return {
            x: layout.closeButton.x,
            y: layout.closeButton.y,
            width: layout.closeButton.width,
            height: layout.closeButton.height
        };
    }

    getOverviewZoneAtPoint(point) {
        if (!point || !this.isSectionSceneWorld()) return null;
        for (const card of this.getOverviewCards()) {
            const insideX = point.x >= card.x && point.x <= card.x + card.width;
            const insideY = point.y >= card.y && point.y <= card.y + card.height;
            if (insideX && insideY) {
                return card.zone;
            }
        }
        return null;
    }

    drawSectionSceneOverview(layer, zones, focusedZoneId) {
        const layout = this.getOverviewLayout();
        const cards = this.getOverviewCards();
        const cardByZoneId = new Map(cards.map(card => [card.zone.id, card]));

        layer.push();
        layer.noStroke();
        layer.fill(10, 12, 18, 162);
        layer.rect(layout.panelX, layout.panelY, layout.panelWidth, layout.panelHeight, 18);

        layer.textAlign(LEFT, TOP);
        layer.fill(255, 248, 232, 255);
        layer.textSize(19);
        layer.textStyle(BOLD);
        layer.text('Papilionem World Overview', layout.headerX, layout.headerY);
        layer.textStyle(NORMAL);
        layer.textSize(11);
        layer.fill(214, 220, 230, 235);
        layer.text('Click a section card to travel there. Use Close to return without moving.', layout.headerX, layout.headerY + 24);

        layer.fill(18, 22, 28, 220);
        layer.stroke(244, 236, 206, 190);
        layer.strokeWeight(1.5);
        layer.rect(layout.closeButton.x, layout.closeButton.y, layout.closeButton.width, layout.closeButton.height, 7);
        layer.noStroke();
        layer.fill(255, 248, 232, 255);
        layer.textAlign(CENTER, CENTER);
        layer.textSize(11);
        layer.text('Close', layout.closeButton.x + layout.closeButton.width / 2, layout.closeButton.y + layout.closeButton.height / 2 + 1);
        layer.textAlign(LEFT, TOP);

        for (const doorway of zoneSystem.getDoorways?.() || []) {
            const fromCard = cardByZoneId.get(doorway.fromZoneId);
            const toCard = cardByZoneId.get(doorway.toZoneId);
            if (!fromCard || !toCard) continue;
            const fromX = fromCard.x + fromCard.width / 2;
            const fromY = fromCard.y + fromCard.height / 2;
            const toX = toCard.x + toCard.width / 2;
            const toY = toCard.y + toCard.height / 2;
            layer.stroke(255, 244, 196, 184);
            layer.strokeWeight(3);
            layer.line(fromX, fromY, toX, toY);
        }

        for (const card of cards) {
            const isFocused = card.zone.id === focusedZoneId;
            const palette = this.getZoneOverlayPalette(card.zone, isFocused);
            const zoneAssets = this.worldSectionAssets.get(card.zone.id);

            if (zoneAssets?.background) {
                layer.image(zoneAssets.background, card.x, card.y, card.width, card.height);
            } else {
                layer.noStroke();
                layer.fill(28, 34, 44, 255);
                layer.rect(card.x, card.y, card.width, card.height, 14);
            }

            layer.noStroke();
            layer.fill(palette.fill[0], palette.fill[1], palette.fill[2], isFocused ? 54 : 32);
            layer.rect(card.x, card.y, card.width, card.height, 14);

            layer.noFill();
            layer.stroke(...palette.stroke);
            layer.strokeWeight(isFocused ? 3 : 2);
            layer.rect(card.x, card.y, card.width, card.height, 14);

            layer.noStroke();
            layer.fill(12, 16, 22, 190);
            layer.rect(card.x + 10, card.y + 10, card.width - 20, 26, 8);
            layer.fill(...palette.label);
            layer.textAlign(LEFT, TOP);
            layer.textStyle(BOLD);
            layer.textSize(12);
            layer.text(card.zone.label, card.x + 18, card.y + 17);

            layer.textStyle(NORMAL);
            layer.textSize(10);
            layer.fill(252, 248, 230, 232);
            layer.text(card.zone.kind === 'training' ? 'Training area' : 'Open land section', card.x + 18, card.y + card.height - 28);
        }

        layer.pop();
    }

    drawZoneWorldOverlay(layer) {
        if (typeof zoneSystem === 'undefined' || typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        const zones = zoneSystem.getZones?.() || [];
        if (zones.length <= 1) return;

        const state = gameCore.getGameState?.() || {};
        const isOverview = state.viewMode === 'overview';
        const focusedZoneId = state.focusedZoneId || zoneSystem.focusedZoneId;

        if (this.isSectionSceneWorld()) {
            if (isOverview) {
                this.drawSectionSceneOverview(layer, zones, focusedZoneId);
            }
            return;
        }

        layer.push();
        layer.textAlign(CENTER, CENTER);

        for (const zone of zones) {
            const isFocused = zone.id === focusedZoneId;
            const palette = this.getZoneOverlayPalette(zone, isFocused);
            const fillColor = isOverview ? palette.fill : isFocused ? [palette.fill[0], palette.fill[1], palette.fill[2], 30] : null;
            const strokeColor = isOverview || isFocused ? palette.stroke : null;
            const strokeWeight = isFocused ? 2 : 1;

            if (fillColor || strokeColor) {
                this.drawZonePolygon(layer, zone.bounds, fillColor, strokeColor, strokeWeight);
            }

            const center = zoneSystem.getZoneCenter?.(zone.id);
            if (!center) continue;
            const screenCenter = gridManager.isoToScreen(center.x, center.y);
            const labelY = screenCenter.y + (isOverview ? -4 : -10);
            const labelWidth = Math.max(78, (typeof textMeasureCache !== 'undefined' ? textMeasureCache.measure(layer, zone.label) : layer.textWidth(zone.label)) + 22);

            if (isOverview || isFocused) {
                layer.noStroke();
                layer.fill(12, 16, 22, isOverview ? 198 : 176);
                layer.rect(screenCenter.x - labelWidth / 2, labelY - 10, labelWidth, 20, 6);
                layer.fill(...palette.label);
                layer.textSize(isFocused ? 11 : 10);
                layer.text(zone.label, screenCenter.x, labelY);
            }
        }

        if (isOverview) {
            for (const doorway of zoneSystem.getDoorways?.() || []) {
                const point = doorway?.grid;
                if (!point) continue;
                const screen = gridManager.isoToScreen(point.x, point.y);
                layer.noStroke();
                layer.fill(255, 248, 214, 228);
                layer.circle(screen.x, screen.y, 8);
                layer.fill(18, 22, 28, 255);
                layer.circle(screen.x, screen.y, 4);
            }
        }

        layer.pop();
    }
    
    // Draw debug cursor
    drawDebugCursor(layer) {
        // Get debug mode state from gameCore or fallback
        const debugModeState = (typeof gameCore !== 'undefined' && gameCore.getDebugMode()) || 
                              (typeof debugMode !== 'undefined' ? debugMode : null);
        
        if (!debugModeState) return;
        
        const gridX = debugModeState.cursorX;
        const gridY = debugModeState.cursorY;
        
        // Draw cursor outline using unified tile function
        gridManager.drawTile(layer, gridX, gridY, null, [255, 255, 255, 200], 2);
        
        // Tool preview fill
        const toolColors = {
            butterfly: [255, 150, 100, 100],
            flower: [150, 255, 150, 100],
            grass: [0, 255, 0, 100],
            blocked: [255, 0, 0, 100],
            path: [255, 255, 0, 100]
        };
        
        if (toolColors[debugModeState.selectedTool]) {
            // Draw tool preview using unified tile function
            gridManager.drawTile(layer, gridX, gridY, toolColors[debugModeState.selectedTool]);
        }
    }

    drawTrainingGroundOverlay(layer) {
        return;
    }
    
    // Draw debug UI panel
    drawDebugUI(layer) {
        // Get debug mode state from gameCore or fallback
        const debugModeState = (typeof gameCore !== 'undefined' && gameCore.getDebugMode()) || 
                              (typeof debugMode !== 'undefined' ? debugMode : null);
        
        if (!debugModeState) return;
        
        layer.fill(0, 0, 0, 150);
        layer.noStroke();
        layer.rect(10, 10, 200, 150);
        
        layer.fill(255);
        layer.textAlign(LEFT);
        layer.text('DEBUG MODE (D to toggle)', 15, 25);
        layer.text(`Cursor: ${debugModeState.cursorX}, ${debugModeState.cursorY}`, 15, 45);
        layer.text(`Tool: ${debugModeState.selectedTool}`, 15, 65);
        layer.text('Arrow keys: Move cursor', 15, 85);
        layer.text('Q/E: Change tool', 15, 105);
        layer.text('Space: Place/Toggle', 15, 125);
        layer.text('X: Export zones', 15, 145);
    }
    
    // Set spawn cover image (stone archways)
    setSpawnCoverImage(img) {
        this.spawnCoverImage = img;
    }

    // Draw spawn cover overlay (archways)
    drawSpawnCover() {
        if (!this.spawnCoverImage) return;
        const { targetWidth, targetHeight } = gameConfig.canvas;
        image(this.spawnCoverImage, 0, 0, targetWidth, targetHeight);
    }

    // Initialize ground wave overlay — slice into 4 quadrants for waving effect
    setGroundWaveImage(img) {
        if (!img) return;
        const halfW = Math.floor(img.width / 2);
        const halfH = Math.floor(img.height / 2);

        this.groundWaveQuadrants = [
            img.get(0, 0, halfW, halfH),
            img.get(halfW, 0, img.width - halfW, halfH),
            img.get(0, halfH, halfW, img.height - halfH),
            img.get(halfW, halfH, img.width - halfW, img.height - halfH)
        ];
        console.log('RenderManager: Ground wave overlay loaded — 4 quadrants');
    }

    // Draw ground wave overlay with two opposite-direction layers
    drawGroundWaveOverlay(surface = null, options = {}) {
        if (!this.groundWaveQuadrants) return;

        const drawImage = surface?.image ? surface.image.bind(surface) : image;
        const drawWidth = surface?.width || gameConfig.canvas.targetWidth;
        const drawHeight = surface?.height || gameConfig.canvas.targetHeight;
        const halfW = drawWidth / 2;
        const halfH = drawHeight / 2;
        const t = frameCount;
        const amplitudeScale = options.amplitudeScale || 1;
        const overlayPasses = Math.max(1, options.overlayPasses || 2);

        // Layer 1
        const offsets = [
            { x: sin(t * 0.02) * 6.5 * amplitudeScale,          y: cos(t * 0.015) * 6.0 * amplitudeScale },
            { x: sin(t * 0.018 + 1.0) * 6.5 * amplitudeScale,   y: cos(t * 0.022 + 0.5) * 6.0 * amplitudeScale },
            { x: sin(t * 0.025 + 2.0) * 6.0 * amplitudeScale,   y: cos(t * 0.017 + 1.5) * 5.5 * amplitudeScale },
            { x: sin(t * 0.015 + 0.7) * 6.0 * amplitudeScale,   y: cos(t * 0.02 + 2.0) * 5.5 * amplitudeScale },
        ];

        for (let i = 0; i < 4; i++) {
            const qx = (i % 2) * halfW;
            const qy = Math.floor(i / 2) * halfH;
            drawImage(
                this.groundWaveQuadrants[i],
                qx + offsets[i].x, qy + offsets[i].y,
                halfW, halfH
            );
        }

        if (overlayPasses <= 1) return;

        // Layer 2: reversed direction + different phase offsets
        const offsets2 = [
            { x: sin(-t * 0.02 + 3.5) * 6.5 * amplitudeScale,   y: cos(-t * 0.015 + 2.8) * 6.0 * amplitudeScale },
            { x: sin(-t * 0.018 + 4.2) * 6.5 * amplitudeScale,   y: cos(-t * 0.022 + 3.3) * 6.0 * amplitudeScale },
            { x: sin(-t * 0.025 + 5.0) * 6.0 * amplitudeScale,   y: cos(-t * 0.017 + 4.5) * 5.5 * amplitudeScale },
            { x: sin(-t * 0.015 + 3.9) * 6.0 * amplitudeScale,   y: cos(-t * 0.02 + 5.2) * 5.5 * amplitudeScale },
        ];

        for (let i = 0; i < 4; i++) {
            const qx = (i % 2) * halfW;
            const qy = Math.floor(i / 2) * halfH;
            drawImage(
                this.groundWaveQuadrants[i],
                qx + offsets2[i].x, qy + offsets2[i].y,
                halfW, halfH
            );
        }
    }

    // Initialize foliage overlay — slice into 4 quadrants for rustling effect
    setFoliageImage(img) {
        if (!img) return;
        const halfW = Math.floor(img.width / 2);
        const halfH = Math.floor(img.height / 2);

        this.foliageQuadrants = [
            img.get(0, 0, halfW, halfH),           // top-left
            img.get(halfW, 0, img.width - halfW, halfH),  // top-right
            img.get(0, halfH, halfW, img.height - halfH), // bottom-left
            img.get(halfW, halfH, img.width - halfW, img.height - halfH) // bottom-right
        ];
        console.log('RenderManager: Foliage overlay loaded — 4 quadrants');
    }

    // Draw foliage overlay with per-quadrant rustling animation
    drawFoliageOverlay(surface = null, options = {}) {
        if (!this.foliageQuadrants) return;

        const drawImage = surface?.image ? surface.image.bind(surface) : image;
        const drawWidth = surface?.width || gameConfig.canvas.targetWidth;
        const drawHeight = surface?.height || gameConfig.canvas.targetHeight;
        const halfW = drawWidth / 2;
        const halfH = drawHeight / 2;
        const t = frameCount;
        const amplitudeScale = options.amplitudeScale || 1;
        const overlayPasses = Math.max(1, options.overlayPasses || 2);

        // Layer 1: each quadrant drifts independently
        const offsets = [
            { x: sin(t * 0.02) * 6.5 * amplitudeScale,          y: cos(t * 0.015) * 6.0 * amplitudeScale },
            { x: sin(t * 0.018 + 1.0) * 6.5 * amplitudeScale,   y: cos(t * 0.022 + 0.5) * 6.0 * amplitudeScale },
            { x: sin(t * 0.025 + 2.0) * 6.0 * amplitudeScale,   y: cos(t * 0.017 + 1.5) * 5.5 * amplitudeScale },
            { x: sin(t * 0.015 + 0.7) * 6.0 * amplitudeScale,   y: cos(t * 0.02 + 2.0) * 5.5 * amplitudeScale },
        ];

        for (let i = 0; i < 4; i++) {
            const qx = (i % 2) * halfW;
            const qy = Math.floor(i / 2) * halfH;
            drawImage(
                this.foliageQuadrants[i],
                qx + offsets[i].x, qy + offsets[i].y,
                halfW, halfH
            );
        }

        if (overlayPasses <= 1) return;

        // Layer 2: same quadrants, reversed drift direction + different phase so layers never align
        const offsets2 = [
            { x: sin(-t * 0.02 + 3.5) * 6.5 * amplitudeScale,          y: cos(-t * 0.015 + 2.8) * 6.0 * amplitudeScale },
            { x: sin(-t * 0.018 + 4.2) * 6.5 * amplitudeScale,          y: cos(-t * 0.022 + 3.3) * 6.0 * amplitudeScale },
            { x: sin(-t * 0.025 + 5.0) * 6.0 * amplitudeScale,          y: cos(-t * 0.017 + 4.5) * 5.5 * amplitudeScale },
            { x: sin(-t * 0.015 + 3.9) * 6.0 * amplitudeScale,          y: cos(-t * 0.02 + 5.2) * 5.5 * amplitudeScale },
        ];

        for (let i = 0; i < 4; i++) {
            const qx = (i % 2) * halfW;
            const qy = Math.floor(i / 2) * halfH;
            drawImage(
                this.foliageQuadrants[i],
                qx + offsets2[i].x, qy + offsets2[i].y,
                halfW, halfH
            );
        }
    }

    // Composite all layers to main canvas
    compositeLayers() {
        const { targetWidth, targetHeight } = gameConfig.canvas;
        const atmosphereProfile = this.getAtmosphereRenderProfile();
        const useCompositeDirtyRegions = this.shouldUseCompositeDirtyRegions();
        const metrics = {
            backgroundCompositeMs: 0,
            groundAtmosphereCompositeMs: 0,
            behindEntitiesCompositeMs: 0,
            blocksCompositeMs: 0,
            flowersDirectPresentMs: 0,
            flowersDirectCount: 0,
            spawnCoverCompositeMs: 0,
            entitiesCompositeMs: 0,
            particlesCompositeMs: 0,
            foliageAtmosphereCompositeMs: 0,
            uiCompositeMs: 0,
            debugCompositeMs: 0,
            compositeCallCount: 0,
            dirtyRegionsEnabled: useCompositeDirtyRegions,
            behindEntitiesCompositeMode: 'full',
            behindEntitiesCompositeRegion: null,
            blocksCompositeMode: 'full',
            blocksCompositeRegion: null,
            flowersDirectMode: 'off',
            flowersDirectRegion: null,
            entitiesCompositeMode: 'full',
            entitiesCompositeRegion: null
        };
        let stageStart = this.getNowMs();
        
        // Draw each layer — ground wave below everything, spawning butterflies behind archways
        image(this.layers.background, 0, 0, targetWidth, targetHeight);
        metrics.backgroundCompositeMs = this.getNowMs() - stageStart;
        metrics.compositeCallCount += 1;
        if (atmosphereProfile.renderGround) {
            stageStart = this.getNowMs();
            const groundLayer = this.refreshCachedAtmosphereLayer(
                'ground',
                atmosphereProfile.groundStride,
                `${atmosphereProfile.profileKey}|ground`,
                cache => this.drawGroundWaveOverlay(cache, atmosphereProfile)
            );
            image(groundLayer, 0, 0, targetWidth, targetHeight);
            metrics.groundAtmosphereCompositeMs = this.getNowMs() - stageStart;
            metrics.compositeCallCount += 1;
        }
        if (this.lastLayerUsage.entitiesBehindActive) {
            if (this.lastLayerUsage.entitiesBehindRegionSource) {
                this.compositeRegionLayer(
                    this.regionLayers.entitiesBehind,
                    this.lastLayerUsage.entitiesBehindRegionSource,
                    metrics,
                    'behindEntitiesCompositeMs',
                    targetWidth,
                    targetHeight,
                    {
                        preferNativeDraw: this.shouldUseNativeCompositePresent(),
                        modeKey: 'behindEntitiesCompositeMode',
                        regionKey: 'behindEntitiesCompositeRegion'
                    }
                );
            } else {
                this.drawCompositeLayer(
                    this.layers.entitiesBehind,
                    metrics,
                    'behindEntitiesCompositeMs',
                    targetWidth,
                    targetHeight,
                    {
                        useDirtyBounds: useCompositeDirtyRegions,
                        bounds: this.lastLayerUsage.entitiesBehindBounds,
                        preferNativeDraw: this.shouldUseNativeCompositePresent(),
                        modeKey: 'behindEntitiesCompositeMode',
                        regionKey: 'behindEntitiesCompositeRegion'
                    }
                );
            }
        }
        if (!this.viewState.battleActive) {
            stageStart = this.getNowMs();
            this.drawSpawnCover();
            metrics.spawnCoverCompositeMs = this.getNowMs() - stageStart;
            metrics.compositeCallCount += 1;
        }
        if (this.lastLayerUsage.flowersDirectActive) {
            stageStart = this.getNowMs();
            metrics.flowersDirectCount = this.drawDirectFlowerEntities();
            metrics.flowersDirectPresentMs = this.getNowMs() - stageStart;
            metrics.flowersDirectMode = 'direct';
            metrics.flowersDirectRegion = this.normalizeRegionSource(
                this.lastLayerUsage.flowersDirectBounds,
                gameConfig?.canvas?.baseWidth || targetWidth,
                gameConfig?.canvas?.baseHeight || targetHeight
            );
        }
        if (this.lastLayerUsage.blocksActive) {
            this.drawCompositeLayer(
                this.layers.blocks,
                metrics,
                'blocksCompositeMs',
                targetWidth,
                targetHeight,
                {
                    useDirtyBounds: useCompositeDirtyRegions,
                    bounds: this.lastLayerUsage.blocksBounds,
                    preferNativeDraw: this.shouldUseNativeCompositePresent(),
                    modeKey: 'blocksCompositeMode',
                    regionKey: 'blocksCompositeRegion'
                }
            );
        }
        if (this.lastLayerUsage.entitiesRegionSource) {
            this.compositeRegionLayer(
                this.regionLayers.entities,
                this.lastLayerUsage.entitiesRegionSource,
                metrics,
                'entitiesCompositeMs',
                targetWidth,
                targetHeight,
                {
                    preferNativeDraw: this.shouldUseNativeCompositePresent(),
                    modeKey: 'entitiesCompositeMode',
                    regionKey: 'entitiesCompositeRegion'
                }
            );
        } else {
            this.drawCompositeLayer(
                this.layers.entities,
                metrics,
                'entitiesCompositeMs',
                targetWidth,
                targetHeight,
                {
                    useDirtyBounds: useCompositeDirtyRegions,
                    bounds: this.lastLayerUsage.entitiesBounds,
                    preferNativeDraw: this.shouldUseNativeCompositePresent(),
                    modeKey: 'entitiesCompositeMode',
                    regionKey: 'entitiesCompositeRegion'
                }
            );
        }
        if (this.lastLayerUsage.particlesActive) {
            stageStart = this.getNowMs();
            this.drawCompositeImage(
                this.layers.particles,
                {
                    x: 0,
                    y: 0,
                    width: targetWidth,
                    height: targetHeight
                },
                null
            );
            metrics.particlesCompositeMs = this.getNowMs() - stageStart;
            metrics.compositeCallCount += 1;
        }
        if (atmosphereProfile.renderFoliage) {
            stageStart = this.getNowMs();
            const foliageLayer = this.refreshCachedAtmosphereLayer(
                'foliage',
                atmosphereProfile.foliageStride,
                `${atmosphereProfile.profileKey}|foliage`,
                cache => this.drawFoliageOverlay(cache, atmosphereProfile)
            );
            image(foliageLayer, 0, 0, targetWidth, targetHeight);
            metrics.foliageAtmosphereCompositeMs = this.getNowMs() - stageStart;
            metrics.compositeCallCount += 1;
        }
        stageStart = this.getNowMs();
        image(this.layers.ui, 0, 0, targetWidth, targetHeight);
        metrics.uiCompositeMs = this.getNowMs() - stageStart;
        metrics.compositeCallCount += 1;
        
        // Get debug mode state from gameCore or fallback
        const debugEnabled = (typeof gameCore !== 'undefined' && gameCore.getDebugMode().enabled) || 
                           (typeof debugMode !== 'undefined' && debugMode.enabled);
                           
        if (debugEnabled && this.lastLayerUsage.debugActive) {
            stageStart = this.getNowMs();
            image(this.layers.debug, 0, 0, targetWidth, targetHeight);
            metrics.debugCompositeMs = this.getNowMs() - stageStart;
            metrics.compositeCallCount += 1;
        }
        metrics.totalCompositeMs = metrics.backgroundCompositeMs
            + metrics.groundAtmosphereCompositeMs
            + metrics.behindEntitiesCompositeMs
            + metrics.blocksCompositeMs
            + metrics.flowersDirectPresentMs
            + metrics.spawnCoverCompositeMs
            + metrics.entitiesCompositeMs
            + metrics.particlesCompositeMs
            + metrics.foliageAtmosphereCompositeMs
            + metrics.uiCompositeMs
            + metrics.debugCompositeMs;
        return metrics;
    }
    
    // Draw player-facing world counters and focused-zone label.
    drawFPSCounter(layer, options = {}) {
        if (gameCore?.getGameState?.().viewMode === 'battle') {
            return;
        }
        const accessibility = this.getAccessibilitySettings();
        const uiScale = typeof gameUI !== 'undefined' && gameUI.getEffectiveUiScale
            ? gameUI.getEffectiveUiScale()
            : (accessibility.uiScale || 1);
        layer.push();
        layer.noStroke();

        let butterflyCount = 0;
        let flowerCount = 0;
        let caterpillarCount = 0;
        let eggCount = 0;
        let chrysalisCount = 0;
        let focusedZoneLabel = 'Garden Core';
        let focusedZoneId = null;
        let viewMode = 'focused-garden';
        let zoneCount = 1;

        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const state = gameCore.getGameState();
            const sceneEntities = this.isSectionSceneWorld() && typeof gameCore.getFocusedSceneEntities === 'function'
                ? gameCore.getFocusedSceneEntities()
                : {
                    butterflies: state.butterflies || [],
                    flowers: state.flowers || [],
                    caterpillars: state.caterpillars || []
                };
            butterflyCount = sceneEntities.butterflies?.length || 0;
            const flowers = sceneEntities.flowers || [];
            flowerCount = flowers.length;
            caterpillarCount = sceneEntities.caterpillars?.length || 0;
            eggCount = flowers.filter(flower => flower?.occupancyState === 'egg').length;
            chrysalisCount = flowers.filter(flower => flower?.occupancyState === 'chrysalis').length;
            focusedZoneId = state.focusedZoneId || zoneSystem?.getFocusedZone?.()?.id || focusedZoneId;
            focusedZoneLabel = zoneSystem?.getFocusedZone?.()?.label || state.focusedZoneId || focusedZoneLabel;
            viewMode = state.viewMode || viewMode;
            zoneCount = zoneSystem?.getZones?.().length || zoneCount;
        }

        const panelX = Number.isFinite(options.panelX) ? options.panelX : 8;
        const panelY = Number.isFinite(options.panelY) ? options.panelY : 10;
        const chipSize = Math.max(6, 7.5 * uiScale);

        const drawChip = (x, y, label) => {
            layer.textSize(chipSize);
            const chipHeight = Math.max(12, Math.round(14 * uiScale));
            const chipWidth = Math.max(Math.round(34 * uiScale), (typeof textMeasureCache !== 'undefined' ? textMeasureCache.measure(layer, label) : layer.textWidth(label)) + Math.round(12 * uiScale));
            if (accessibility.highContrastUI) {
                layer.fill(14, 14, 14, 255);
                layer.stroke(255, 255, 255, 255);
                layer.strokeWeight(1.25);
                layer.rect(x, y, chipWidth, chipHeight, 5);
                layer.noStroke();
                layer.fill(255, 255, 255, 255);
            } else {
                layer.fill(28, 34, 44, 212);
                layer.rect(x, y, chipWidth, chipHeight, 5);
                layer.fill(240, 244, 250, 255);
            }
            layer.textAlign(CENTER, CENTER);
            layer.text(label, Math.round(x + chipWidth / 2), Math.round(y + chipHeight / 2));
            layer.textAlign(LEFT, TOP);
            return chipWidth;
        };

        let chipX = panelX;
        const chipY = panelY;
        chipX += drawChip(chipX, chipY, `Adults ${butterflyCount}`) + 5;
        chipX += drawChip(chipX, chipY, `Flowers ${flowerCount}`) + 5;
        chipX += drawChip(chipX, chipY, `Eggs ${eggCount}`) + 5;
        chipX += drawChip(chipX, chipY, `Chrys ${chrysalisCount}`) + 5;
        chipX += drawChip(chipX, chipY, `Cater ${caterpillarCount}`) + 8;

        layer.noStroke();
        layer.textAlign(LEFT, TOP);
        layer.textStyle(BOLD);
        layer.textSize(Math.max(8, 9 * uiScale));
        layer.fill(accessibility.highContrastUI ? 255 : 246, accessibility.highContrastUI ? 255 : 248, accessibility.highContrastUI ? 255 : 226, 255);
        layer.text(focusedZoneLabel, chipX, chipY + 2);
        layer.textStyle(NORMAL);

        layer.pop();
    }
    
    // Draw info panel (non-debug)
    drawInfoPanel() {
        // Get debug mode state from gameCore or fallback
        const debugEnabled = (typeof gameCore !== 'undefined' && gameCore.getDebugMode().enabled) || 
                           (typeof debugMode !== 'undefined' && debugMode.enabled);
        
        if (debugEnabled) return;
        
        push();
        noStroke();
        fill(150);
        textAlign(LEFT);
        
        const info = [
            `Cursor velocity: ${gameState.cursorVelocity.toFixed(2)}`,
            `Still frames: ${gameState.framesSinceMovement}`,
            `FPS: ${frameRate().toFixed(0)}`
        ];
        
        if (!debugMode.enabled) {
            info.push('Press D for Debug Mode');
        }
        
        for (let i = 0; i < info.length; i++) {
            text(info[i], 10, 20 + i * 15);
        }
        
        pop();
    }
    
    // Update canvas size
    updateCanvasSize(width, height) {
        gameConfig.canvas.targetWidth = width;
        gameConfig.canvas.targetHeight = height;
    }
}

// Create global instance
const renderManager = new RenderManager();
