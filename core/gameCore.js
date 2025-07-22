// Unified game initialization and core system orchestrator
// Centralizes all managers and systems, providing clean separation from p5.js
class GameCore {
    constructor() {
        // Core systems
        this.gridManager = null;
        this.renderManager = null;
        this.interactionSystem = null;
        this.particleSystem = null;
        this.poolManager = null;
        this.flowerManager = null;
        this.entityManager = null;
        
        // Game state
        this.gameState = {
            butterflies: [],
            flowers: [],
            initialized: false,
            paused: false
        };
        
        // Debug mode state
        this.debugMode = {
            enabled: false,
            cursorX: 0,
            cursorY: 0,
            selectedTool: 'butterfly',
            tools: ['butterfly', 'flower', 'walkable', 'blocked'],
            walkableTiles: new Set(),
            blockedTiles: new Set()
        };
        
        // Initialization tracking
        this.initializationSteps = [
            'config',
            'eventBus', 
            'gridManager',
            'renderManager',
            'entityManager',
            'particleSystem',
            'poolManager', 
            'flowerManager',
            'interactionSystem',
            'ecosystemEvents',
            'initialEntities'
        ];
        this.completedSteps = new Set();
        
        // Bind methods to maintain context
        this.update = this.update.bind(this);
        this.draw = this.draw.bind(this);
        this.handleMousePressed = this.handleMousePressed.bind(this);
        this.handleKeyPressed = this.handleKeyPressed.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
    }
    
    // Initialize all game systems in proper order
    async initialize(backgroundImage = null) {
        console.log('GameCore: Starting initialization...');
        
        try {
            // Step 1: Verify config is loaded
            await this.initializeConfig();
            
            // Step 2: Initialize event bus
            await this.initializeEventBus();
            
            // Step 3: Initialize grid manager
            await this.initializeGridManager();
            
            // Step 4: Initialize render manager
            await this.initializeRenderManager(backgroundImage);
            
            // Step 5: Initialize entity manager (population manager)
            await this.initializeEntityManager();
            
            // Step 6: Initialize particle system
            await this.initializeParticleSystem();
            
            // Step 7: Initialize pool manager
            await this.initializePoolManager();
            
            // Step 8: Initialize flower manager
            await this.initializeFlowerManager();
            
            // Step 9: Initialize interaction system
            await this.initializeInteractionSystem();
            
            // Step 10: Set up ecosystem event chains
            await this.setupEcosystemEvents();
            
            // Step 11: Create initial entities
            await this.initializeStartingEntities();
            
            this.gameState.initialized = true;
            console.log('GameCore: Initialization complete!');
            
        } catch (error) {
            console.error('GameCore: Initialization failed:', error);
            throw error;
        }
    }
    
    async initializeConfig() {
        if (typeof gameConfig === 'undefined') {
            throw new Error('gameConfig not found - ensure core/config.js is loaded');
        }
        this.completedSteps.add('config');
        console.log('✓ Config initialized');
    }
    
    async initializeEventBus() {
        if (typeof eventBus === 'undefined' || typeof GameEvents === 'undefined') {
            throw new Error('EventBus or GameEvents not found - ensure systems/eventBus.js is loaded');
        }
        this.completedSteps.add('eventBus');
        console.log('✓ Event bus initialized');
    }
    
    async initializeGridManager() {
        if (typeof GridManager === 'undefined' || typeof gridManager === 'undefined') {
            throw new Error('GridManager not found - ensure core/gridManager.js is loaded');
        }
        // Use the global instance already created in gridManager.js
        this.gridManager = gridManager;
        this.completedSteps.add('gridManager');
        console.log('✓ Grid manager initialized');
    }
    
    async initializeRenderManager(backgroundImage) {
        if (typeof RenderManager === 'undefined' || typeof renderManager === 'undefined') {
            throw new Error('RenderManager not found - ensure core/renderManager.js is loaded');
        }
        // Use the global instance already created in renderManager.js
        this.renderManager = renderManager;
        this.renderManager.initialize();
        
        if (backgroundImage) {
            this.renderManager.setBackgroundImage(backgroundImage);
        }
        
        this.completedSteps.add('renderManager');
        console.log('✓ Render manager initialized');
    }
    
    async initializeEntityManager() {
        if (typeof EntityManager === 'undefined' || typeof entityManager === 'undefined') {
            throw new Error('EntityManager not found - ensure systems/populationManager.js is loaded');
        }
        // Use the global instance already created in populationManager.js
        this.entityManager = entityManager;
        
        // Set up event listeners for entity lifecycle
        this.entityManager.on('entityDied', (data) => {
            eventBus.emit(GameEvents.BUTTERFLY_DIED, data);
        });
        
        this.completedSteps.add('entityManager');
        console.log('✓ Entity manager initialized');
    }
    
    async initializeParticleSystem() {
        if (typeof ParticleSystem === 'undefined') {
            throw new Error('ParticleSystem not found - ensure systems/particleSystem.js is loaded');
        }
        this.particleSystem = new ParticleSystem();
        this.gameState.particleSystem = this.particleSystem;
        this.completedSteps.add('particleSystem');
        console.log('✓ Particle system initialized');
    }
    
    async initializePoolManager() {
        if (typeof PoolManager === 'undefined') {
            throw new Error('PoolManager not found - ensure systems/particleSystem.js is loaded');
        }
        this.poolManager = new PoolManager();
        this.gameState.poolManager = this.poolManager;
        this.completedSteps.add('poolManager');
        console.log('✓ Pool manager initialized');
    }
    
    async initializeFlowerManager() {
        if (typeof FlowerManager === 'undefined') {
            throw new Error('FlowerManager not found - ensure entities/flower.js is loaded');
        }
        this.flowerManager = new FlowerManager();
        this.gameState.flowerManager = this.flowerManager;
        this.completedSteps.add('flowerManager');
        console.log('✓ Flower manager initialized');
    }
    
    async initializeInteractionSystem() {
        if (typeof InteractionSystem === 'undefined' || typeof interactionSystem === 'undefined') {
            throw new Error('InteractionSystem not found - ensure systems/interactionSystem.js is loaded');
        }
        // Use the global instance already created in interactionSystem.js
        this.interactionSystem = interactionSystem;
        this.completedSteps.add('interactionSystem');
        console.log('✓ Interaction system initialized');
    }
    
    async setupEcosystemEvents() {
        if (typeof setupEcosystemEvents !== 'function') {
            console.warn('setupEcosystemEvents function not found - ecosystem chains may not work');
        } else {
            setupEcosystemEvents();
        }
        
        // Set up additional GameCore-specific events
        eventBus.on(GameEvents.BUTTERFLY_DIED, (data) => {
            this.handleButterflyDeath(data.entity);
        });
        
        eventBus.on(GameEvents.FLOWER_DIED, (data) => {
            this.handleFlowerDeath(data.entity);
        });
        
        eventBus.on(GameEvents.POOL_READY, (data) => {
            this.handlePoolReady(data.pool);
        });
        
        this.completedSteps.add('ecosystemEvents');
        console.log('✓ Ecosystem events configured');
    }
    
    async initializeStartingEntities() {
        if (typeof Butterfly === 'undefined' || typeof Flower === 'undefined') {
            throw new Error('Entity classes not found - ensure entities/*.js are loaded');
        }
        
        // Create initial butterflies with rich colors
        const butterflyColors = gameConfig.entities.butterfly.colors;
        const startingButterflyCount = 2;
        
        for (let i = 0; i < startingButterflyCount; i++) {
            const gridX = random(6, 12);
            const gridY = random(6, 12);
            const screenPos = this.gridManager.isoToScreen(gridX, gridY);
            const colors = random(butterflyColors);
            
            const butterfly = new Butterfly(
                screenPos.x, 
                screenPos.y - gameConfig.entities.heightOffset.butterfly, 
                colors
            );
            
            this.gameState.butterflies.push(butterfly);
            this.entityManager.addEntity('butterflies', butterfly);
        }
        
        // Create initial color pool
        const poolGridX = 9 + random(-2, 2);
        const poolGridY = 14;
        const poolScreenPos = this.gridManager.isoToScreen(poolGridX, poolGridY);
        const pool = this.poolManager.findOrCreatePool(poolScreenPos.x, poolScreenPos.y);
        
        if (pool) {
            const poolColor = random(butterflyColors)[0];
            for (let i = 0; i < 45; i++) {
                pool.addPixel({
                    x: poolScreenPos.x + random(-15, 15),
                    y: poolScreenPos.y + random(-15, 15),
                    color: poolColor
                });
            }
        }
        
        // Create initial flowers
        const flowerPositions = [
            {x: 6, y: 8},
            {x: 10, y: 12},
            {x: 14, y: 6}
        ];
        
        for (let pos of flowerPositions) {
            const flowerScreenPos = this.gridManager.isoToScreen(pos.x, pos.y);
            const flower = new Flower(flowerScreenPos.x, flowerScreenPos.y);
            
            this.gameState.flowers.push(flower);
            this.entityManager.addEntity('flowers', flower);
        }
        
        this.completedSteps.add('initialEntities');
        console.log('✓ Starting entities created');
    }
    
    // Main game update loop
    update() {
        if (!this.gameState.initialized || this.gameState.paused) return;
        
        // Update interaction system first (cursor tracking)
        this.interactionSystem.update();
        
        // Update cursor data for backward compatibility
        const cursorPos = this.interactionSystem.getCursorPosition();
        this.gameState.adjustedMouseX = cursorPos.x;
        this.gameState.adjustedMouseY = cursorPos.y;
        this.gameState.cursorVelocity = this.interactionSystem.cursorVelocity;
        this.gameState.framesSinceMovement = this.interactionSystem.framesSinceMovement;
        this.gameState.lastCursorX = this.interactionSystem.lastCursorX;
        this.gameState.lastCursorY = this.interactionSystem.lastCursorY;
        
        // Update all game systems
        this.updateEntities();
        this.particleSystem.update();
        this.poolManager.update(this.particleSystem, this.gameState.butterflies);
        this.flowerManager.update(this.gameState.flowers, this.gameState.butterflies, this.particleSystem);
        
        // Update entity manager (handles interactions and lifecycle)
        this.entityManager.update(this.gameState);
        
        // Check for interaction system events
        if (this.interactionSystem.isGentle()) {
            this.interactionSystem.checkButterflyInteractions(this.gameState.butterflies);
        }
        
        // Emit periodic events
        this.emitPeriodicEvents();
    }
    
    updateEntities() {
        // Update butterflies
        for (let i = this.gameState.butterflies.length - 1; i >= 0; i--) {
            const butterfly = this.gameState.butterflies[i];
            butterfly.update(this.gameState);
            
            if (butterfly.isDead()) {
                this.handleButterflyDeath(butterfly);
                this.gameState.butterflies.splice(i, 1);
            }
        }
    }
    
    // Main draw method
    draw() {
        if (!this.gameState.initialized) {
            this.drawLoadingScreen();
            return;
        }
        
        // Use render manager for all drawing
        this.renderManager.render();
        
        // Draw info panel (outside of render manager for now)
        this.drawInfoPanel();
    }
    
    drawLoadingScreen() {
        background(gameConfig.canvas.backgroundColor);
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(24);
        text('Loading Ephemera...', width/2, height/2);
        
        // Show initialization progress
        const progress = this.completedSteps.size / this.initializationSteps.length;
        const barWidth = 200;
        const barHeight = 10;
        const barX = width/2 - barWidth/2;
        const barY = height/2 + 40;
        
        stroke(0);
        fill(255);
        rect(barX, barY, barWidth, barHeight);
        
        fill(100, 200, 100);
        rect(barX, barY, barWidth * progress, barHeight);
        
        textSize(12);
        fill(100);
        text(`${this.completedSteps.size}/${this.initializationSteps.length} systems loaded`, width/2, barY + 25);
    }
    
    drawInfoPanel() {
        if (this.debugMode.enabled) return;
        
        push();
        noStroke();
        fill(150);
        textAlign(LEFT);
        
        const info = [
            `Cursor velocity: ${this.gameState.cursorVelocity.toFixed(2)}`,
            `Still frames: ${this.gameState.framesSinceMovement}`,
            `Pollen: ${this.flowerManager ? this.flowerManager.pollenCount : 0}/5`,
            `Butterflies: ${this.gameState.butterflies.length}`,
            `Flowers: ${this.gameState.flowers.length}`,
            `FPS: ${frameRate().toFixed(0)}`,
            'Press D for Debug Mode'
        ];
        
        for (let i = 0; i < info.length; i++) {
            text(info[i], 10, 20 + i * 15);
        }
        
        pop();
    }
    
    // Event handlers
    handleMousePressed() {
        if (this.debugMode.enabled) return false;
        
        const cursorPos = this.interactionSystem.getCursorPosition();
        
        if (cursorPos.x >= 0 && cursorPos.x <= gameConfig.canvas.baseWidth &&
            cursorPos.y >= 0 && cursorPos.y <= gameConfig.canvas.baseHeight) {
            
            this.interactionSystem.handlePlantAttempt(
                this.flowerManager,
                this.gameState.flowers,
                this.particleSystem
            );
            return true;
        }
        return false;
    }
    
    handleKeyPressed(key, keyCode) {
        // Toggle debug mode
        if (key === 'D' || key === 'd') {
            this.debugMode.enabled = !this.debugMode.enabled;
            if (this.debugMode.enabled) {
                const bounds = gameConfig.isometric.bounds;
                this.debugMode.cursorX = Math.floor(bounds.maxX / 2);
                this.debugMode.cursorY = Math.floor(bounds.maxY / 2);
            }
            return true;
        }
        
        if (!this.debugMode.enabled) return false;
        
        // Debug mode controls
        return this.handleDebugKeyPressed(key, keyCode);
    }
    
    handleDebugKeyPressed(key, keyCode) {
        const bounds = gameConfig.isometric.bounds;
        
        // Movement controls
        if (keyCode === LEFT_ARROW && this.debugMode.cursorY > 0) {
            this.debugMode.cursorY--;
            return true;
        } else if (keyCode === RIGHT_ARROW && this.debugMode.cursorY < bounds.maxY) {
            this.debugMode.cursorY++;
            return true;
        } else if (keyCode === UP_ARROW && this.debugMode.cursorX > 0) {
            this.debugMode.cursorX--;
            return true;
        } else if (keyCode === DOWN_ARROW && this.debugMode.cursorX < bounds.maxX) {
            this.debugMode.cursorX++;
            return true;
        }
        
        // Tool switching
        if (key === 'Q' || key === 'q') {
            let currentIndex = this.debugMode.tools.indexOf(this.debugMode.selectedTool);
            currentIndex = (currentIndex - 1 + this.debugMode.tools.length) % this.debugMode.tools.length;
            this.debugMode.selectedTool = this.debugMode.tools[currentIndex];
            return true;
        } else if (key === 'E' || key === 'e') {
            let currentIndex = this.debugMode.tools.indexOf(this.debugMode.selectedTool);
            currentIndex = (currentIndex + 1) % this.debugMode.tools.length;
            this.debugMode.selectedTool = this.debugMode.tools[currentIndex];
            return true;
        }
        
        // Placement
        if (key === ' ') {
            this.handleDebugPlacement();
            return true;
        }
        
        // Export zones
        if (key === 'X' || key === 'x') {
            this.exportZoneData();
            return true;
        }
        
        return false;
    }
    
    handleDebugPlacement() {
        const gridX = this.debugMode.cursorX;
        const gridY = this.debugMode.cursorY;
        const screenPos = this.gridManager.isoToScreen(gridX, gridY);
        
        if (this.debugMode.selectedTool === 'butterfly') {
            const colors = random(gameConfig.entities.butterfly.colors);
            const butterfly = new Butterfly(
                screenPos.x, 
                screenPos.y - gameConfig.entities.heightOffset.butterfly, 
                colors
            );
            this.gameState.butterflies.push(butterfly);
            this.entityManager.addEntity('butterflies', butterfly);
            
        } else if (this.debugMode.selectedTool === 'flower') {
            const flower = new Flower(screenPos.x, screenPos.y);
            this.gameState.flowers.push(flower);
            this.entityManager.addEntity('flowers', flower);
            
        } else if (this.debugMode.selectedTool === 'walkable' || this.debugMode.selectedTool === 'blocked') {
            const tileKey = `${gridX},${gridY}`;
            
            if (this.debugMode.selectedTool === 'walkable') {
                if (this.debugMode.walkableTiles.has(tileKey)) {
                    this.debugMode.walkableTiles.delete(tileKey);
                } else {
                    this.debugMode.walkableTiles.add(tileKey);
                    this.debugMode.blockedTiles.delete(tileKey);
                }
            } else {
                if (this.debugMode.blockedTiles.has(tileKey)) {
                    this.debugMode.blockedTiles.delete(tileKey);
                } else {
                    this.debugMode.blockedTiles.add(tileKey);
                    this.debugMode.walkableTiles.delete(tileKey);
                }
            }
        }
    }
    
    handleWindowResize() {
        const availableWidth = windowWidth * 0.95;
        const availableHeight = windowHeight * 0.95;
        const baseAspect = gameConfig.canvas.baseWidth / gameConfig.canvas.baseHeight;
        const availableAspect = availableWidth / availableHeight;
        
        // Calculate new canvas size maintaining aspect ratio
        let targetWidth, targetHeight;
        if (availableAspect > baseAspect) {
            targetHeight = availableHeight;
            targetWidth = availableHeight * baseAspect;
        } else {
            targetWidth = availableWidth;
            targetHeight = availableWidth / baseAspect;
        }
        
        // Update render manager
        this.renderManager.updateCanvasSize(targetWidth, targetHeight);
        
        // Resize the actual canvas
        resizeCanvas(targetWidth, targetHeight);
        
        // Reinitialize render layers
        this.renderManager.initialize();
        this.renderManager.drawBackground();
    }
    
    // Entity death handlers
    handleButterflyDeath(butterfly) {
        if (butterfly.colors) {
            const fadeColors = butterfly.colors.map(c => 
                [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8]
            );
            this.particleSystem.emitBurst(
                butterfly.x, 
                butterfly.y, 
                random(fadeColors), 
                10
            );
        }
        eventBus.emit(GameEvents.BUTTERFLY_DIED, { butterfly });
    }
    
    handleFlowerDeath(flower) {
        // Already handled by FlowerManager, but we can add additional effects here
        eventBus.emit(GameEvents.FLOWER_DIED, { flower });
    }
    
    handlePoolReady(pool) {
        // Handle pool ready state - maybe spawn new butterfly
        if (this.gameState.butterflies.length < gameConfig.entities.maxButterflies) {
            // Consider spawning a new butterfly
            eventBus.emit(GameEvents.POOL_SPAWNING, { pool });
        }
    }
    
    // Utility methods
    emitPeriodicEvents() {
        // Emit cursor events
        if (this.interactionSystem.isGentle()) {
            eventBus.emit(GameEvents.CURSOR_STILL, {
                x: this.gameState.adjustedMouseX,
                y: this.gameState.adjustedMouseY,
                frames: this.gameState.framesSinceMovement
            });
        } else if (this.gameState.cursorVelocity > 2) {
            eventBus.emit(GameEvents.CURSOR_MOVING, {
                x: this.gameState.adjustedMouseX,
                y: this.gameState.adjustedMouseY,
                velocity: this.gameState.cursorVelocity
            });
        }
        
        // Check ecosystem balance
        if (frameCount % 300 === 0) { // Every 5 seconds
            const butterflyCount = this.gameState.butterflies.length;
            const flowerCount = this.gameState.flowers.length;
            
            if (butterflyCount >= 8 && butterflyCount <= 12 && 
                flowerCount >= 5 && flowerCount <= 6) {
                eventBus.emit(GameEvents.ECOSYSTEM_BALANCED, {
                    butterflies: butterflyCount,
                    flowers: flowerCount
                });
            }
        }
    }
    
    exportZoneData() {
        console.log('=== TILE DATA EXPORT ===');
        
        if (this.debugMode.walkableTiles.size > 0) {
            console.log('const walkableTiles = [');
            for (let tileKey of this.debugMode.walkableTiles) {
                const [x, y] = tileKey.split(',');
                console.log(`  { x: ${x}, y: ${y} },`);
            }
            console.log('];');
            console.log('');
        }
        
        if (this.debugMode.blockedTiles.size > 0) {
            console.log('const blockedTiles = [');
            for (let tileKey of this.debugMode.blockedTiles) {
                const [x, y] = tileKey.split(',');
                console.log(`  { x: ${x}, y: ${y} },`);
            }
            console.log('];');
        }
        
        console.log('========================');
    }
    
    // Public API for external access
    getGameState() {
        return { ...this.gameState };
    }
    
    getDebugMode() {
        return { ...this.debugMode };
    }
    
    pause() {
        this.gameState.paused = true;
    }
    
    resume() {
        this.gameState.paused = false;
    }
    
    isInitialized() {
        return this.gameState.initialized;
    }
    
    getInitializationProgress() {
        return {
            completed: this.completedSteps.size,
            total: this.initializationSteps.length,
            percentage: (this.completedSteps.size / this.initializationSteps.length) * 100
        };
    }
}

// Create global instance
const gameCore = new GameCore();