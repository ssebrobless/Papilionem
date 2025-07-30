// Centralized rendering system
class RenderManager {
    constructor() {
        this.layers = {
            background: null,
            entities: null,
            particles: null,
            ui: null,
            debug: null
        };
        
        this.initialized = false;
        this.backgroundImage = null;
        
        // Entity sorting cache with pre-allocated arrays
        this.sortedEntities = [];
        this.entitiesDirty = true;
        this.lastEntityCount = 0;
        this.entitySortingCache = []; // Pre-allocated array for sorting to avoid slice() allocation
    }
    
    // Initialize all render layers
    initialize() {
        const { baseWidth, baseHeight } = gameConfig.canvas;
        
        for (let layerName in this.layers) {
            this.layers[layerName] = createGraphics(baseWidth, baseHeight);
            this.layers[layerName].pixelDensity(displayDensity());
        }
        
        // Keep pixel art aesthetic for entity and particle layers
        this.layers.entities.noSmooth();
        this.layers.particles.noSmooth();
        
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
        
        // Draw sorted entities
        for (let entity of this.sortedEntities) {
            entity.draw(layer);
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
    
    // Composite all layers to main canvas
    compositeLayers() {
        const { targetWidth, targetHeight } = gameConfig.canvas;
        
        // Draw each layer
        image(this.layers.background, 0, 0, targetWidth, targetHeight);
        image(this.layers.entities, 0, 0, targetWidth, targetHeight);
        image(this.layers.particles, 0, 0, targetWidth, targetHeight);
        image(this.layers.ui, 0, 0, targetWidth, targetHeight);
        
        // Get debug mode state from gameCore or fallback
        const debugEnabled = (typeof gameCore !== 'undefined' && gameCore.getDebugMode().enabled) || 
                           (typeof debugMode !== 'undefined' && debugMode.enabled);
                           
        if (debugEnabled) {
            image(this.layers.debug, 0, 0, targetWidth, targetHeight);
        }
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