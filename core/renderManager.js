// Centralized rendering system
class RenderManager {
    constructor() {
        this.layers = {
            background: null,
            entitiesBehind: null,  // For spawning butterflies (below archways)
            entities: null,
            particles: null,
            ui: null,
            debug: null
        };

        this.initialized = false;
        this.backgroundImage = null;
        this.spawnCoverImage = null;
        
        // Entity sorting cache with pre-allocated arrays
        this.sortedEntities = [];
        this.entitiesDirty = true;
        this.lastEntityCount = 0;
        this.entitySortingCache = []; // Pre-allocated array for sorting to avoid slice() allocation

        // Foliage overlay (leaf rustling effect)
        this.foliageQuadrants = null; // Array of 4 p5.Image quadrants

        // Ground wave overlay (grass/ground waving effect)
        this.groundWaveQuadrants = null; // Array of 4 p5.Image quadrants
    }
    
    // Initialize all render layers
    initialize() {
        const { baseWidth, baseHeight } = gameConfig.canvas;
        
        for (let layerName in this.layers) {
            this.layers[layerName] = createGraphics(baseWidth, baseHeight);
            this.layers[layerName].pixelDensity(2);
        }
        
        // Keep pixel art aesthetic for entity and particle layers only
        this.layers.entitiesBehind.noSmooth();
        this.layers.entities.noSmooth();
        this.layers.particles.noSmooth();
        
        // Enable smooth rendering for UI layer to improve text quality
        // this.layers.ui.smooth(); // This is the default, no need to call explicitly
        
        this.initialized = true;
    }
    
    // Set background image
    setBackgroundImage(img) {
        this.backgroundImage = img;
        this.drawBackground();
    }
    
    // Draw the static background
    drawBackground() {
        if (!this.initialized) return;
        
        const bg = this.layers.background;
        bg.push();
        
        if (this.backgroundImage) {
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
    
    // Clear dynamic layers
    clearDynamicLayers() {
        this.layers.entitiesBehind.clear();
        this.layers.entities.clear();
        this.layers.particles.clear();
        this.layers.ui.clear();
        // Get debug mode state from gameCore or fallback
        const debugEnabled = (typeof gameCore !== 'undefined' && gameCore.getDebugMode().enabled) || 
                           (typeof debugMode !== 'undefined' && debugMode.enabled);
        
        if (debugEnabled) {
            this.layers.debug.clear();
        }
    }
    
    // Main render method
    render() {
        if (!this.initialized) return;
        
        // Clear the main canvas
        background(0);
        
        // Clear dynamic layers
        this.clearDynamicLayers();
        
        // Draw to each layer
        this.drawEntitiesLayer();
        this.drawParticlesLayer();
        this.drawUILayer();
        
        // Get debug mode state from gameCore or fallback
        const debugEnabled = (typeof gameCore !== 'undefined' && gameCore.getDebugMode().enabled) || 
                           (typeof debugMode !== 'undefined' && debugMode.enabled);
        
        if (debugEnabled) {
            this.drawDebugLayer();
        }
        
        // Composite all layers onto main canvas
        this.compositeLayers();
    }
    
    // Mark entities as needing resort (call when entities move or spawn)
    markEntitiesDirty() {
        this.entitiesDirty = true;
    }
    
    // Draw entities layer
    drawEntitiesLayer() {
        const layer = this.layers.entities;
        layer.push();
        
        // Collect all entities from either EntityManager or direct gameCore access
        const allEntities = [];
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const state = gameCore.getGameState();
            allEntities.push(...state.flowers);
            allEntities.push(...state.butterflies);
        } else if (entityManager) {
            allEntities.push(...entityManager.getEntities('flowers'));
            allEntities.push(...entityManager.getEntities('butterflies'));
        } else if (typeof gameState !== 'undefined') {
            // Fallback to legacy gameState
            if (gameState.flowers) allEntities.push(...gameState.flowers);
            if (gameState.butterflies) allEntities.push(...gameState.butterflies);
        }
        
        // Check if we need to resort entities
        if (this.entitiesDirty || this.lastEntityCount !== allEntities.length) {
            // Reuse cached array instead of slice() to avoid allocation
            this.entitySortingCache.length = 0; // Clear without allocation
            for (let i = 0; i < allEntities.length; i++) {
                this.entitySortingCache[i] = allEntities[i];
            }
            
            // Sort by depth (isometric y position)
            this.entitySortingCache.sort((a, b) => {
                const aY = a.gridPos ? a.gridPos.y : a.y;
                const bY = b.gridPos ? b.gridPos.y : b.y;
                return aY - bY;
            });
            
            // Swap the sorted cache with sortedEntities
            const temp = this.sortedEntities;
            this.sortedEntities = this.entitySortingCache;
            this.entitySortingCache = temp;
            
            this.entitiesDirty = false;
            this.lastEntityCount = allEntities.length;
        }
        
        // Draw sorted entities — route spawning butterflies to behind layer
        const behindLayer = this.layers.entitiesBehind;
        for (let entity of this.sortedEntities) {
            if (entity.isSpawning) {
                entity.draw(behindLayer);
            } else {
                entity.draw(layer);
            }
        }
        
        layer.pop();
    }
    
    // Draw particles layer
    drawParticlesLayer() {
        const layer = this.layers.particles;
        layer.push();
        
        // Draw color pools and particles from gameCore or fallback sources
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            if (gameCore.poolManager) {
                gameCore.poolManager.draw(layer);
            }
            if (gameCore.mainColorPool) {
                gameCore.mainColorPool.draw(layer);
            }
            if (gameCore.particleSystem) {
                gameCore.particleSystem.draw(layer);
            }
        } else if (window.gameState) {
            // Fallback to legacy gameState
            if (window.gameState.poolManager) {
                window.gameState.poolManager.draw(layer);
            }
            if (window.gameState.mainColorPool) {
                window.gameState.mainColorPool.draw(layer);
            }
            if (window.gameState.particleSystem) {
                window.gameState.particleSystem.draw(layer);
            }
        }
        
        layer.pop();
    }
    
    // Draw UI layer
    drawUILayer() {
        const layer = this.layers.ui;
        layer.push();
        
        // Get debug mode state from gameCore or fallback
        const debugEnabled = (typeof gameCore !== 'undefined' && gameCore.getDebugMode().enabled) || 
                           (typeof debugMode !== 'undefined' && debugMode.enabled);
        
        // Always draw FPS counter in top left (unless in debug mode)
        if (!debugEnabled) {
            this.drawFPSCounter(layer);
        }
        
        // Use gameUI system if available
        if (typeof gameUI !== 'undefined' && gameUI.initialized) {
            // Get game state
            let gameState = {};
            if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
                gameState = gameCore.getGameState();
            } else if (typeof window.gameState !== 'undefined') {
                gameState = window.gameState;
            }
            
            // Draw using gameUI system
            gameUI.draw(layer, gameState, { enabled: debugEnabled });
        } else {
            // Fallback to original inline drawing
            if (!debugEnabled) {
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
                    framesSinceMovement = gameState.framesSinceMovement || 0;
                    flowerManager = gameState.flowerManager;
                    flowers = gameState.flowers;
                }
                
                // Draw cursor interaction zone
                if (framesSinceMovement > gameConfig.interaction.stillFramesRequired) {
                    const adjustedMouseX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
                    const adjustedMouseY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
                    
                    layer.noFill();
                    layer.stroke(255, 255, 255, 50);
                    layer.strokeWeight(1);
                    const radius = gameConfig.interaction.cursorZoneRadius + sinFrame(frameCount, 0.05) * 5;
                    layer.ellipse(adjustedMouseX, adjustedMouseY, radius * 2);
                }
                
                // Draw planting hint
                if (flowerManager && flowerManager.drawPlantingHint) {
                    const adjustedMouseX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
                    const adjustedMouseY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
                    flowerManager.drawPlantingHint(layer, adjustedMouseX, adjustedMouseY, flowers, particleSystem);
                }
            }
        }
        
        // Draw special effects
        if (typeof specialEffects !== 'undefined') {
            specialEffects.draw(layer);
        }
        
        layer.pop();
    }
    
    // Draw debug layer
    drawDebugLayer() {
        const layer = this.layers.debug;
        layer.push();
        
        // Draw grid
        if (gridManager) {
            gridManager.drawGrid(layer);
            gridManager.drawZones(layer);
        }
        
        // Draw debug cursor
        this.drawDebugCursor(layer);
        
        // Draw debug UI panel
        this.drawDebugUI(layer);
        
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
    drawGroundWaveOverlay() {
        if (!this.groundWaveQuadrants) return;

        const { targetWidth, targetHeight } = gameConfig.canvas;
        const halfW = targetWidth / 2;
        const halfH = targetHeight / 2;
        const t = frameCount;

        // Layer 1
        const offsets = [
            { x: sin(t * 0.02) * 6.5,          y: cos(t * 0.015) * 6.0 },
            { x: sin(t * 0.018 + 1.0) * 6.5,   y: cos(t * 0.022 + 0.5) * 6.0 },
            { x: sin(t * 0.025 + 2.0) * 6.0,   y: cos(t * 0.017 + 1.5) * 5.5 },
            { x: sin(t * 0.015 + 0.7) * 6.0,   y: cos(t * 0.02 + 2.0) * 5.5 },
        ];

        for (let i = 0; i < 4; i++) {
            const qx = (i % 2) * halfW;
            const qy = Math.floor(i / 2) * halfH;
            image(this.groundWaveQuadrants[i],
                  qx + offsets[i].x, qy + offsets[i].y,
                  halfW, halfH);
        }

        // Layer 2: reversed direction + different phase offsets
        const offsets2 = [
            { x: sin(-t * 0.02 + 3.5) * 6.5,   y: cos(-t * 0.015 + 2.8) * 6.0 },
            { x: sin(-t * 0.018 + 4.2) * 6.5,   y: cos(-t * 0.022 + 3.3) * 6.0 },
            { x: sin(-t * 0.025 + 5.0) * 6.0,   y: cos(-t * 0.017 + 4.5) * 5.5 },
            { x: sin(-t * 0.015 + 3.9) * 6.0,   y: cos(-t * 0.02 + 5.2) * 5.5 },
        ];

        for (let i = 0; i < 4; i++) {
            const qx = (i % 2) * halfW;
            const qy = Math.floor(i / 2) * halfH;
            image(this.groundWaveQuadrants[i],
                  qx + offsets2[i].x, qy + offsets2[i].y,
                  halfW, halfH);
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
    drawFoliageOverlay() {
        if (!this.foliageQuadrants) return;

        const { targetWidth, targetHeight } = gameConfig.canvas;
        const halfW = targetWidth / 2;
        const halfH = targetHeight / 2;
        const t = frameCount;

        // Layer 1: each quadrant drifts independently
        const offsets = [
            { x: sin(t * 0.02) * 6.5,          y: cos(t * 0.015) * 6.0 },
            { x: sin(t * 0.018 + 1.0) * 6.5,   y: cos(t * 0.022 + 0.5) * 6.0 },
            { x: sin(t * 0.025 + 2.0) * 6.0,   y: cos(t * 0.017 + 1.5) * 5.5 },
            { x: sin(t * 0.015 + 0.7) * 6.0,   y: cos(t * 0.02 + 2.0) * 5.5 },
        ];

        for (let i = 0; i < 4; i++) {
            const qx = (i % 2) * halfW;
            const qy = Math.floor(i / 2) * halfH;
            image(this.foliageQuadrants[i],
                  qx + offsets[i].x, qy + offsets[i].y,
                  halfW, halfH);
        }

        // Layer 2: same quadrants, reversed drift direction + different phase so layers never align
        const offsets2 = [
            { x: sin(-t * 0.02 + 3.5) * 6.5,          y: cos(-t * 0.015 + 2.8) * 6.0 },
            { x: sin(-t * 0.018 + 4.2) * 6.5,          y: cos(-t * 0.022 + 3.3) * 6.0 },
            { x: sin(-t * 0.025 + 5.0) * 6.0,          y: cos(-t * 0.017 + 4.5) * 5.5 },
            { x: sin(-t * 0.015 + 3.9) * 6.0,          y: cos(-t * 0.02 + 5.2) * 5.5 },
        ];

        for (let i = 0; i < 4; i++) {
            const qx = (i % 2) * halfW;
            const qy = Math.floor(i / 2) * halfH;
            image(this.foliageQuadrants[i],
                  qx + offsets2[i].x, qy + offsets2[i].y,
                  halfW, halfH);
        }
    }

    // Draw pool base (ring, spiral, glow) directly to main canvas
    drawPoolBase() {
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized() && gameCore.mainColorPool) {
            gameCore.mainColorPool.drawBase();
        }
    }

    // Composite all layers to main canvas
    compositeLayers() {
        const { targetWidth, targetHeight } = gameConfig.canvas;
        
        // Draw each layer — ground wave below everything, spawning butterflies behind archways
        image(this.layers.background, 0, 0, targetWidth, targetHeight);
        this.drawGroundWaveOverlay();
        this.drawPoolBase();
        image(this.layers.entitiesBehind, 0, 0, targetWidth, targetHeight);
        this.drawSpawnCover();
        image(this.layers.entities, 0, 0, targetWidth, targetHeight);
        image(this.layers.particles, 0, 0, targetWidth, targetHeight);
        this.drawFoliageOverlay();
        image(this.layers.ui, 0, 0, targetWidth, targetHeight);
        
        // Get debug mode state from gameCore or fallback
        const debugEnabled = (typeof gameCore !== 'undefined' && gameCore.getDebugMode().enabled) || 
                           (typeof debugMode !== 'undefined' && debugMode.enabled);
                           
        if (debugEnabled) {
            image(this.layers.debug, 0, 0, targetWidth, targetHeight);
        }
    }
    
    // Draw collection progress in top left corner
    drawFPSCounter(layer) {
        layer.push();
        layer.noStroke();
        
        // Enable smooth text rendering for better quality
        layer.smooth();
        
        // Get collection stats
        let collectedCount = 0;
        const totalButterflies = 7;
        
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const state = gameCore.getGameState();
            collectedCount = state.collectedButterflies?.size || 0;
        }
        
        // Draw semi-transparent background for better readability
        layer.fill(0, 0, 0, 120);
        layer.rect(10, 10, 140, 50, 8); // Rounded rectangle
        
        // Draw collection progress with high contrast
        layer.fill(255, 255, 200, 255); // Warm white/yellow for collection
        layer.textAlign(LEFT, TOP);
        layer.textSize(16); // Larger for better visibility
        layer.textStyle(BOLD);
        layer.text(`${collectedCount}/${totalButterflies} Collected`, 18, 18);
        layer.textStyle(NORMAL);
        
        // Draw helpful tooltip
        layer.fill(220, 220, 220, 230); // Slightly gray for secondary text
        layer.textSize(12);
        layer.text('Press C to view journal', 18, 38);
        
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