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
        this.mainColorPool = null;
        this.zoneSystem = null;
        this.statusSystem = null;
        this.behaviorSystem = null;
        this.objectSystem = null;
        this.sleepSystem = null;
        this.teachingSystem = null;
        this.battleSystem = null;
        this.saveSystem = null;
        this.telemetrySystem = null;
        this.systems = {};
        this.replaySessionCounter = 0;
        
        // Game state
        this.gameState = {
            butterflies: [],
            caterpillars: [],
            flowers: [],
            initialized: false,
            paused: false,
            encounteredButterflies: new Set(),
            collectedButterflies: new Set(), // Butterflies successfully led (passed trust test)
            butterflySpawnCounts: {}, // Track spawn count per personality type
            butterflyCollectionStats: {}, // Detailed stats per butterfly type
            goldenButterflySpawned: false,
            feedingCombo: 0, // Sequential feeding combo
            lastFeedingTime: 0, // For combo tracking
            maxCombo: 0, // Track best combo
            showButterflyCollection: false, // Toggle for collection UI
            hybridJournal: [],
            nextHybridId: 1,
            pendingOffspringReservations: 0,
            timeScale: gameConfig?.simulation?.defaultTimeScale || 1,
            focusedZoneId: null,
            viewMode: 'focused-garden',
            activeBattleId: null,
            replay: null
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
            'trigCache',
            'eventBus', 
            'gridManager',
            'zoneSystem',
            'statusSystem',
            'behaviorSystem',
            'objectSystem',
            'sleepSystem',
            'teachingSystem',
            'battleSystem',
            'saveSystem',
            'telemetrySystem',
            'replayMetadata',
            'renderManager',
            'entityManager',
            'particleSystem',
            'poolManager', 
            'mainColorPool',
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
            
            // Step 2: Initialize trigonometric cache
            await this.initializeTrigCache();
            
            // Step 3: Initialize event bus
            await this.initializeEventBus();
            
            // Step 4: Initialize grid manager
            await this.initializeGridManager();
            
            // Step 5: Initialize foundation systems
            await this.initializeZoneSystem();
            await this.initializeStatusSystem();
            await this.initializeBehaviorSystem();
            await this.initializeObjectSystem();
            await this.initializeSleepSystem();
            await this.initializeTeachingSystem();
            await this.initializeBattleSystem();
            await this.initializeSaveSystem();
            await this.initializeTelemetrySystem();
            
            // Step 6: Initialize render manager
            await this.initializeRenderManager(backgroundImage);
            
            // Step 7: Initialize entity manager (population manager)
            await this.initializeEntityManager();
            
            // Step 8: Initialize particle system
            await this.initializeParticleSystem();
            
            // Step 9: Initialize pool manager
            await this.initializePoolManager();
            
            // Step 10: Initialize main color pool
            await this.initializeMainColorPool();
            
            // Step 11: Initialize flower manager
            await this.initializeFlowerManager();
            
            // Step 12: Initialize interaction system
            await this.initializeInteractionSystem();
            
            // Step 13: Set up ecosystem event chains
            await this.setupEcosystemEvents();

            // Step 13.5: Initialize replay metadata before random-heavy entity creation
            await this.initializeReplayMetadata();
            
            // Step 14: Create initial entities
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
        if (typeof progressionManager !== 'undefined') {
            progressionManager.applyToGameState(this.gameState);
        }
        this.completedSteps.add('config');
        console.log('✓ Config initialized');
    }
    
    async initializeTrigCache() {
        if (typeof initializeTrigCache === 'undefined') {
            throw new Error('TrigCache not found - ensure core/trigCache.js is loaded');
        }
        initializeTrigCache();
        this.completedSteps.add('trigCache');
        console.log('✓ Trigonometric cache initialized');
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
    
    async initializeZoneSystem() {
        if (typeof ZoneSystem === 'undefined' || typeof zoneSystem === 'undefined') {
            throw new Error('ZoneSystem not found - ensure systems/zoneSystem.js is loaded');
        }
        this.zoneSystem = zoneSystem;
        this.zoneSystem.initialize(this.gridManager);
        this.gameState.focusedZoneId = this.zoneSystem.focusedZoneId;
        this.gameState.viewMode = this.zoneSystem.viewMode;
        this.systems.zoneSystem = this.zoneSystem;
        this.completedSteps.add('zoneSystem');
        console.log('✓ Zone system initialized');
    }
    
    async initializeStatusSystem() {
        if (typeof StatusSystem === 'undefined' || typeof statusSystem === 'undefined') {
            throw new Error('StatusSystem not found - ensure systems/statusSystem.js is loaded');
        }
        this.statusSystem = statusSystem;
        this.statusSystem.initialize();
        this.systems.statusSystem = this.statusSystem;
        this.completedSteps.add('statusSystem');
        console.log('✓ Status system initialized');
    }
    
    async initializeBehaviorSystem() {
        if (typeof BehaviorSystem === 'undefined' || typeof behaviorSystem === 'undefined') {
            throw new Error('BehaviorSystem not found - ensure systems/behaviorSystem.js is loaded');
        }
        this.behaviorSystem = behaviorSystem;
        this.behaviorSystem.initialize();
        this.systems.behaviorSystem = this.behaviorSystem;
        this.completedSteps.add('behaviorSystem');
        console.log('✓ Behavior system initialized');
    }
    
    async initializeObjectSystem() {
        if (typeof ObjectSystem === 'undefined' || typeof objectSystem === 'undefined') {
            throw new Error('ObjectSystem not found - ensure systems/objectSystem.js is loaded');
        }
        this.objectSystem = objectSystem;
        this.objectSystem.initialize();
        this.systems.objectSystem = this.objectSystem;
        this.completedSteps.add('objectSystem');
        console.log('✓ Object system initialized');
    }
    
    async initializeSleepSystem() {
        if (typeof SleepSystem === 'undefined' || typeof sleepSystem === 'undefined') {
            throw new Error('SleepSystem not found - ensure systems/sleepSystem.js is loaded');
        }
        this.sleepSystem = sleepSystem;
        this.sleepSystem.initialize();
        this.systems.sleepSystem = this.sleepSystem;
        this.completedSteps.add('sleepSystem');
        console.log('✓ Sleep system initialized');
    }
    
    async initializeTeachingSystem() {
        if (typeof TeachingSystem === 'undefined' || typeof teachingSystem === 'undefined') {
            throw new Error('TeachingSystem not found - ensure systems/teachingSystem.js is loaded');
        }
        this.teachingSystem = teachingSystem;
        this.teachingSystem.initialize();
        this.systems.teachingSystem = this.teachingSystem;
        this.completedSteps.add('teachingSystem');
        console.log('✓ Teaching system initialized');
    }
    
    async initializeBattleSystem() {
        if (typeof BattleSystem === 'undefined' || typeof battleSystem === 'undefined') {
            throw new Error('BattleSystem not found - ensure systems/battleSystem.js is loaded');
        }
        this.battleSystem = battleSystem;
        this.battleSystem.initialize();
        this.systems.battleSystem = this.battleSystem;
        this.completedSteps.add('battleSystem');
        console.log('✓ Battle system initialized');
    }
    
    async initializeSaveSystem() {
        if (typeof SaveSystem === 'undefined' || typeof saveSystem === 'undefined') {
            throw new Error('SaveSystem not found - ensure systems/saveSystem.js is loaded');
        }
        this.saveSystem = saveSystem;
        this.saveSystem.initialize();
        this.systems.saveSystem = this.saveSystem;
        this.completedSteps.add('saveSystem');
        console.log('✓ Save system initialized');
    }

    async initializeTelemetrySystem() {
        if (typeof TelemetrySystem === 'undefined' || typeof telemetrySystem === 'undefined') {
            throw new Error('TelemetrySystem not found - ensure systems/telemetrySystem.js is loaded');
        }
        this.telemetrySystem = telemetrySystem;
        this.telemetrySystem.initialize();
        this.systems.telemetrySystem = this.telemetrySystem;
        this.completedSteps.add('telemetrySystem');
        console.log('✓ Telemetry system initialized');
    }

    async initializeReplayMetadata() {
        this.resetReplayMetadata({ forceNewSession: true, preserveMarkers: false });
        this.completedSteps.add('replayMetadata');
        console.log('✓ Replay metadata initialized');
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
        if (this.gameState.focusedZoneId) {
            this.renderManager.setFocusedZone(this.gameState.focusedZoneId);
        }
        this.renderManager.setViewMode(this.gameState.viewMode || 'focused-garden');
        
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
            if (data.type === 'butterflies') {
                eventBus.emit(GameEvents.BUTTERFLY_DIED, data);
            } else if (data.type === 'flowers') {
                eventBus.emit(GameEvents.FLOWER_DIED, data);
            }
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
    
    async initializeMainColorPool() {
        if (typeof mainColorPool === 'undefined') {
            throw new Error('MainColorPool not found - ensure systems/colorPool.js is loaded');
        }
        // Use the global instance already created in colorPool.js
        this.mainColorPool = mainColorPool;
        this.gameState.mainColorPool = this.mainColorPool;
        this.completedSteps.add('mainColorPool');
        console.log('✓ Main color pool initialized');
    }
    
    async initializeFlowerManager() {
        if (typeof FlowerManager === 'undefined') {
            throw new Error('FlowerManager not found - ensure entities/flower.js is loaded');
        }
        this.flowerManager = new FlowerManager();
        this.gameState.flowerManager = this.flowerManager;
        this.completedSteps.add('flowerManager');
        console.log('✓ Flower manager initialized');
        
        // Initialize gameUI with flowerManager reference
        if (typeof gameUI !== 'undefined') {
            gameUI.initialize(this.flowerManager, gameConfig.interaction);
            console.log('✓ Game UI initialized');
        }
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
        
        // God mode event listeners
        eventBus.on('debug:spawnButterfly', (data) => {
            this.godSpawnButterfly(data.x, data.y, data.colors);
        });
        
        eventBus.on('debug:spawnFlower', (data) => {
            this.godSpawnFlower(data.x, data.y);
        });

        eventBus.on('debug:refreshPheromones', () => {
            breedingSystem.refreshMaleCooldowns(this.gameState);
        });

        eventBus.on('debug:hatchEggs', () => {
            breedingSystem.hatchAllEggs(this.gameState);
        });

        eventBus.on('debug:hatchCocoons', () => {
            breedingSystem.hatchAllCocoons(this.gameState);
        });

        eventBus.on('debug:flowersForCaterpillars', () => {
            breedingSystem.spawnFlowersAtCaterpillars(this.gameState);
        });

        eventBus.on('debug:resetProgression', () => {
            if (confirm('Reset all saved Papilionem progression?')) {
                progressionManager.resetAll(this.gameState);
                this.resetGame(true);
            }
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
        
        // Create initial butterflies - let personalities determine colors (first one is immortal)
        const startingButterflyCount = 2;
        
        for (let i = 0; i < startingButterflyCount; i++) {
            // Spawn butterflies across a broader range within grid bounds
            const gridX = random(3, this.gridManager.bounds.maxX - 3);
            const gridY = random(3, this.gridManager.bounds.maxY - 3);
            const screenPos = this.gridManager.isoToScreen(gridX, gridY);
            
            // First butterfly is immortal to prevent ecosystem collapse
            const isImmortal = (i === 0);
            const butterfly = new Butterfly(
                screenPos.x, 
                screenPos.y - gameConfig.entities.heightOffset.butterfly, 
                null, // Let personality determine colors
                isImmortal
            );
            
            this.gameState.butterflies.push(butterfly);
            this.entityManager.addEntity('butterflies', butterfly);
            this.registerEntityWithFoundationSystems(butterfly, 'butterfly');
            
            // Mark as encountered
            this.gameState.encounteredButterflies.add(butterfly.personalityType);
            
            if (isImmortal) {
                console.log('🦋 Created immortal butterfly to prevent ecosystem collapse');
            }
        }
        
        // Create initial color pool
        const poolGridX = 9 + random(-2, 2);
        const poolGridY = 14;
        const poolScreenPos = this.gridManager.isoToScreen(poolGridX, poolGridY);
        const pool = this.poolManager.findOrCreatePool(poolScreenPos.x, poolScreenPos.y);
        
        if (pool) {
            const poolColor = random(gameConfig.entities.butterfly.colors)[0];
            for (let i = 0; i < 45; i++) {
                pool.addPixel({
                    x: poolScreenPos.x + random(-15, 15),
                    y: poolScreenPos.y + random(-15, 15),
                    color: poolColor
                });
            }
        }
        
        // Create initial flowers (2 immortal flowers in opposite corners)
        const flowerPositions = [
            {x: 3, y: 3},    // Top-left corner area
            {x: 14, y: 14}   // Bottom-right corner area
        ];
        
        for (let i = 0; i < flowerPositions.length; i++) {
            const pos = flowerPositions[i];
            const flowerScreenPos = this.gridManager.isoToScreen(pos.x, pos.y);
            const flower = new Flower(flowerScreenPos.x, flowerScreenPos.y, true); // All starting flowers are immortal
            
            this.gameState.flowers.push(flower);
            this.entityManager.addEntity('flowers', flower);
            this.registerEntityWithFoundationSystems(flower, 'flower');
        }
        
        if (typeof progressionManager !== 'undefined') {
            progressionManager.save(this.gameState);
        }

        this.completedSteps.add('initialEntities');
        console.log('✓ Starting entities created');
    }
    
    // Main game update loop
    update() {
        if (!this.gameState.initialized || this.gameState.paused) return;

        const updateStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        
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
        const foundationStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.updateFoundationSystems();
        const foundationMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - foundationStart;

        const entityStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.updateEntities();
        this.updateCaterpillars();
        const entityMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - entityStart;

        const particleStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.particleSystem.update();
        const particleUpdateMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - particleStart;
        
        // Update special effects
        const worldStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (typeof specialEffects !== 'undefined') {
            specialEffects.update();
        }
        
        // Occasionally spawn new flowers if conditions are met
        this.updateFlowerSpawning();
        this.poolManager.update(this.particleSystem, this.gameState.butterflies);
        this.mainColorPool.update(this.gameState.butterflies, this.particleSystem);
        this.flowerManager.update(this.gameState.flowers, this.gameState.butterflies, this.particleSystem);
        breedingSystem.update(this.gameState, this.particleSystem);
        
        // Check for butterfly interactions
        this.interactionSystem.checkButterflyInteractions(this.gameState.butterflies);
        
        // Emit periodic events
        this.emitPeriodicEvents();

        const totalUpdateMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - updateStart;
        const worldMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - worldStart;
        this.telemetrySystem?.recordUpdateSample?.(this.gameState, {
            totalUpdateMs,
            foundationMs,
            entityMs,
            particleUpdateMs,
            worldMs
        });
    }
    
    updateFoundationSystems() {
        const deltaSeconds = gameConfig.simulation.fixedDeltaSeconds * this.gameState.timeScale;

        this.zoneSystem?.update(this.gameState, deltaSeconds);
        this.statusSystem?.update(this.gameState, deltaSeconds);
        this.objectSystem?.update(this.gameState, deltaSeconds);
        this.sleepSystem?.update(this.gameState, deltaSeconds);
        this.teachingSystem?.update(this.gameState, deltaSeconds);
        this.behaviorSystem?.update(this.gameState, deltaSeconds);
        this.battleSystem?.update(this.gameState, deltaSeconds);
        this.saveSystem?.update(this.gameState, deltaSeconds);
    }
    
    registerEntityWithFoundationSystems(entity, entityType) {
        if (!entity?.id) return;

        if (entityType === 'butterfly' || entityType === 'caterpillar') {
            this.behaviorSystem?.registerEntity(entity);
            this.sleepSystem?.registerEntity(entity);
            this.statusSystem?.registerEntity(entity);
            this.teachingSystem?.registerEntity(entity);
        }

        if (entityType === 'flower') {
            this.objectSystem?.registerObject(entity, { type: 'flower', consumable: true });
        }
    }
    
    unregisterEntityFromFoundationSystems(entity) {
        if (!entity?.id) return;

        this.behaviorSystem?.unregisterEntity?.(entity.id);
        this.sleepSystem?.unregisterEntity?.(entity.id);
        this.statusSystem?.unregisterEntity?.(entity.id);
        this.objectSystem?.unregisterObject?.(entity.id);
        this.teachingSystem?.unregisterEntity?.(entity.id);
    }
    
    resetFoundationSystems() {
        this.behaviorSystem?.reset?.();
        this.sleepSystem?.reset?.();
        this.statusSystem?.reset?.();
        this.objectSystem?.reset?.();
        this.teachingSystem?.reset?.();
        this.battleSystem?.reset?.();
        this.telemetrySystem?.reset?.();
    }
    
    updateEntities() {
        // Update butterflies
        for (let i = this.gameState.butterflies.length - 1; i >= 0; i--) {
            const butterfly = this.gameState.butterflies[i];
            butterfly.update(this.gameState);
            
            if (butterfly.isDead()) {
                this.handleButterflyDeath(butterfly);
                this.entityManager.removeEntity('butterflies', butterfly);
                this.unregisterEntityFromFoundationSystems(butterfly);
                this.gameState.butterflies.splice(i, 1);
            }
        }
    }

    updateCaterpillars() {
        for (let i = this.gameState.caterpillars.length - 1; i >= 0; i--) {
            const caterpillar = this.gameState.caterpillars[i];
            caterpillar.update(this.gameState);
            if (caterpillar.isDead()) {
                if (caterpillar.failReason === 'starved' && caterpillar.lifecycleData?.reservationActive) {
                    this.gameState.pendingOffspringReservations = Math.max(0, this.gameState.pendingOffspringReservations - 1);
                }
                this.unregisterEntityFromFoundationSystems(caterpillar);
                this.gameState.caterpillars.splice(i, 1);
            }
        }
    }
    
    // Dynamic flower spawning based on butterfly population
    updateFlowerSpawning() {
        const totalFlowers = this.gameState.flowers.length;
        const immortalFlowers = this.gameState.flowers.filter(f => f.isImmortal).length;
        const ephemeralFlowers = totalFlowers - immortalFlowers;
        const butterflyCount = this.gameState.butterflies.length;
        
        // Dynamic minimum based on butterfly population
        // Base: 3 total flowers (2 immortal + 1 ephemeral)
        // 5+ butterflies: 4 total flowers (2 immortal + 2 ephemeral)
        const minTotal = butterflyCount >= 5 ? 4 : 3;
        const maxTotal = 5;
        const minEphemeral = minTotal - immortalFlowers;
        const maxEphemeral = maxTotal - immortalFlowers;
        
        // Check every 10-15 seconds for spawning (varies to feel more organic)
        const checkInterval = 600 + Math.floor(sin(frameCount * 0.001) * 300); // 10-15 seconds
        if (frameCount % checkInterval !== 0) return;
        
        console.log(`🌸 Flower spawning check at frame ${frameCount}:`);
        console.log(`   - Total flowers: ${totalFlowers} (${immortalFlowers} immortal, ${ephemeralFlowers} ephemeral)`);
        console.log(`   - Butterflies: ${butterflyCount} (${butterflyCount >= 5 ? 'High population - more flowers needed' : 'Normal population'})`);
        console.log(`   - Target range: ${minTotal}-${maxTotal} total (${minEphemeral}-${maxEphemeral} ephemeral)`);
        
        // Simple spawning logic
        if (ephemeralFlowers < minEphemeral) {
            // Always spawn if below minimum
            this.spawnEphemeralFlower();
        } else if (ephemeralFlowers < maxEphemeral) {
            // 30% chance to spawn when in range
            if (random() < 0.3) {
                this.spawnEphemeralFlower();
            } else {
                console.log(`   ❌ No spawn: Random chance failed (30%)`);
            }
        } else {
            console.log(`   ❌ No spawn: At maximum ephemeral flowers (${ephemeralFlowers}/${maxEphemeral})`);
        }
    }
    
    // Helper method to spawn an ephemeral flower
    spawnEphemeralFlower() {
        const validPosition = this.findValidFlowerPosition();
        
        if (validPosition) {
            console.log(`   ✅ Spawning flower at (${validPosition.x.toFixed(0)}, ${validPosition.y.toFixed(0)})`);
            
            // Create ephemeral flower with full lifecycle
            const newFlower = new Flower(validPosition.x, validPosition.y, false);
            this.gameState.flowers.push(newFlower);
            this.entityManager.addEntity('flowers', newFlower);
            this.registerEntityWithFoundationSystems(newFlower, 'flower');
            
            // Magical appearance effect
            this.particleSystem.emitBurst(validPosition.x, validPosition.y, [255, 255, 200], 12);
            
            const totalFlowers = this.gameState.flowers.length;
            const ephemeralFlowers = this.gameState.flowers.filter(f => !f.isImmortal).length;
            console.log(`🌺 Ephemeral flower spawned! Total: ${totalFlowers} (${ephemeralFlowers} ephemeral)`);
        } else {
            console.log(`   ❌ Could not find valid position for flower`);
        }
    }
    
    // Find a valid position for flower spawning with advanced constraints
    findValidFlowerPosition() {
        const maxAttempts = 30;
        let bestPosition = null;
        let bestScore = -1;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const gridX = random(2, this.gridManager.bounds.maxX - 2);
            const gridY = random(2, this.gridManager.bounds.maxY - 2);
            const screenPos = this.gridManager.isoToScreen(gridX, gridY);
            
            // Check magic pool exclusion (2.5 grid radius)
            const poolCenter = { x: 8.5, y: 7 }; // Magic pool center - matches background
            const distToPool = Math.hypot(gridX - poolCenter.x, gridY - poolCenter.y);
            if (distToPool < 2.5) {
                continue;
            }
            
            // Check minimum distance from existing flowers (40 pixels spacing)
            let minDistToFlower = Infinity;
            let tooClose = false;
            for (let flower of this.gameState.flowers) {
                const dist = Math.hypot(screenPos.x - flower.x, screenPos.y - flower.y);
                if (dist < 40) {
                    tooClose = true;
                    break;
                }
                minDistToFlower = Math.min(minDistToFlower, dist);
            }
            
            if (tooClose) continue;
            
            // Score: prefer positions with good spacing (not too close, not too far)
            let score = 0;
            if (minDistToFlower > 100) {
                score = 1.0; // Good spacing
            } else if (minDistToFlower > 70) {
                score = 0.7; // Acceptable spacing
            } else if (minDistToFlower > 50) {
                score = 0.3; // Close but usable
            } else {
                score = 0.1; // Minimum acceptable
            }
            
            // Add some randomness to prevent clustering
            score += random(-0.1, 0.1);
            
            if (score > bestScore) {
                bestScore = score;
                bestPosition = screenPos;
            }
        }
        
        return bestScore > 0.2 ? bestPosition : null; // Only accept decent positions
    }
    
    // Main draw method
    draw() {
        if (!this.gameState.initialized) {
            this.drawLoadingScreen();
            return;
        }

        const renderStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        // Use render manager for all drawing
        this.renderManager.render();
        const totalRenderMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - renderStart;
        const particleStats = this.particleSystem?.getRenderStats?.() || {};
        this.telemetrySystem?.recordRenderSample?.({
            totalRenderMs,
            particleRenderMs: particleStats.renderTime || 0,
            particleCount: particleStats.particleCount || 0,
            batchCount: particleStats.lastBatchCount || 0
        });
    }
    
    drawLoadingScreen() {
        background(gameConfig.canvas.backgroundColor);
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(24);
        text('Loading Papilionem...', width/2, height/2);
        
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
    }
    
    // Event handlers
    handleMousePressed() {
        // Always allow butterfly collection interaction, even in debug mode
        if (typeof gameUI !== 'undefined' && gameUI.initialized && gameUI.butterflyCollection) {
            if (gameUI.butterflyCollection.visible) {
                if (gameUI.butterflyCollection.isClickInside(mouseX, mouseY)) {
                    return gameUI.butterflyCollection.handleMousePressed(mouseX, mouseY);
                } else {
                    gameUI.butterflyCollection.toggle();
                    return true;
                }
            }
        }

        if (this.debugMode.enabled) {
            if (typeof debugUI !== 'undefined' && debugUI.handleMouseClick?.(mouseX, mouseY)) {
                return true;
            }
            return false;
        }

        return false;
    }
    
    handleKeyPressed(key, keyCode) {
        // Let gameUI handle keys first (for non-debug UI controls)
        if (typeof gameUI !== 'undefined' && gameUI.initialized) {
            if (gameUI.handleKeyPress(key, keyCode)) {
                return true;
            }
        }
        
        // Toggle debug mode
        if (key === 'D' || key === 'd') {
            this.debugMode.enabled = !this.debugMode.enabled;
            if (typeof debugUI !== 'undefined') {
                debugUI.enabled = this.debugMode.enabled;
                if (!this.debugMode.enabled) {
                    debugUI.showSexLabels = false;
                    const sexButton = debugUI.godModeButtons?.find(button => button.id === 'toggleSexLabels');
                    if (sexButton) sexButton.text = 'Sex Labels: Off';
                }
            }
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

        if (key === 'K' || key === 'k') {
            debugUI?.saveGameState?.();
            return true;
        }

        if (key === 'L' || key === 'l') {
            debugUI?.loadGameState?.();
            return true;
        }

        if (key === 'V' || key === 'v') {
            debugUI?.runRoundTripAudit?.();
            return true;
        }

        if (key === 'N' || key === 'n') {
            debugUI?.runSnapshotDiffAudit?.();
            return true;
        }

        if (key === 'P' || key === 'p') {
            debugUI?.loadNextAuditPreset?.();
            return true;
        }

        if (key === 'O' || key === 'o') {
            debugUI?.exportAuditSetup?.();
            return true;
        }

        if (key === 'U' || key === 'u') {
            debugUI?.importAuditSetup?.();
            return true;
        }

        if (key === 'Y' || key === 'y') {
            debugUI?.runGameplayAudit?.();
            return true;
        }

        if (key === 'J' || key === 'j') {
            debugUI?.reseedReplaySession?.();
            return true;
        }
        
        return false;
    }
    
    handleDebugPlacement() {
        const gridX = this.debugMode.cursorX;
        const gridY = this.debugMode.cursorY;
        const screenPos = this.gridManager.isoToScreen(gridX, gridY);
        
        if (this.debugMode.selectedTool === 'butterfly') {
            if (this.gameState.butterflies.length >= (typeof breedingSystem !== 'undefined' ? breedingSystem.adultHardCap : Infinity)) {
                return;
            }

            const butterfly = new Butterfly(
                screenPos.x, 
                screenPos.y - gameConfig.entities.heightOffset.butterfly, 
                null // Let personality determine colors
            );
            this.gameState.butterflies.push(butterfly);
            this.entityManager.addEntity('butterflies', butterfly);
            this.registerEntityWithFoundationSystems(butterfly, 'butterfly');
            
            // Mark as encountered
            this.gameState.encounteredButterflies.add(butterfly.personalityType);
            if (typeof progressionManager !== 'undefined') {
                progressionManager.save(this.gameState);
            }
            
        } else if (this.debugMode.selectedTool === 'flower') {
            const flower = new Flower(screenPos.x, screenPos.y);
            this.gameState.flowers.push(flower);
            this.entityManager.addEntity('flowers', flower);
            this.registerEntityWithFoundationSystems(flower, 'flower');
            
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
        // Skip resize if not initialized yet
        if (!this.gameState.initialized || !this.renderManager) {
            console.log('GameCore: Skipping window resize - system not initialized yet');
            return;
        }
        
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
        
        // Update render manager - additional safety check
        if (this.renderManager && typeof this.renderManager.updateCanvasSize === 'function') {
            this.renderManager.updateCanvasSize(targetWidth, targetHeight);
            
            // Resize the actual canvas
            resizeCanvas(targetWidth, targetHeight);
            
            // Reinitialize render layers
            this.renderManager.initialize();
            this.renderManager.drawBackground();
        } else {
            console.warn('GameCore: RenderManager not ready for resize operation');
        }
    }
    
    // God mode spawn methods
    godSpawnButterfly(x, y, colors) {
        if (this.getWildButterflyCount() < gameConfig.entities.maxButterflies &&
            this.gameState.butterflies.length < (typeof breedingSystem !== 'undefined' ? breedingSystem.adultHardCap : Infinity)) {
            // If this is the first butterfly and none exist, make it immortal
            const isFirstButterfly = this.getWildButterflyCount() === 0;
            const butterfly = new Butterfly(x, y, colors || null, isFirstButterfly); // Allow custom colors or use personality
            this.gameState.butterflies.push(butterfly);
            this.entityManager?.addEntity('butterflies', butterfly);
            this.registerEntityWithFoundationSystems(butterfly, 'butterfly');
            
            // Mark as encountered
            this.gameState.encounteredButterflies.add(butterfly.personalityType);
            if (typeof progressionManager !== 'undefined') {
                progressionManager.save(this.gameState);
            }
            
            // Spawn burst effect
            this.particleSystem.emitBurst(x, y, [255, 255, 255], 8);
            
            console.log(`🦋 Spawned butterfly via god mode${isFirstButterfly ? ' (immortal)' : ''}`);
        } else {
            console.log('🦋 Cannot spawn butterfly - max population reached');
        }
    }
    
    godSpawnFlower(x, y) {
        if (this.gameState.flowers.length < gameConfig.entities.maxFlowers) {
            const flower = new Flower(x, y);
            this.gameState.flowers.push(flower);
            this.entityManager?.addEntity('flowers', flower);
            this.registerEntityWithFoundationSystems(flower, 'flower');
            
            // Spawn burst effect
            this.particleSystem.emitBurst(x, y, [255, 255, 255], 8);
            
            console.log('🌸 Spawned flower via god mode');
        } else {
            console.log('🌸 Cannot spawn flower - max population reached');
        }
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
        // Event already emitted by caller - don't re-emit to avoid infinite recursion
    }
    
    handleFlowerDeath(flower) {
        // Already handled by FlowerManager, but we can add additional effects here
        this.entityManager?.removeEntity('flowers', flower);
        this.unregisterEntityFromFoundationSystems(flower);
    }
    
    handlePoolReady(pool) {
        // Handle pool ready state - maybe spawn new butterfly
        if (this.getWildButterflyCount() < gameConfig.entities.maxButterflies) {
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

    createReplaySessionId() {
        this.replaySessionCounter += 1;
        return `replay_${Date.now()}_${this.replaySessionCounter}`;
    }

    normalizeReplaySeed(seedInput = Date.now()) {
        if (typeof seedInput === 'string') {
            const trimmed = seedInput.trim();
            if (/^-?\d+$/.test(trimmed)) {
                seedInput = Number(trimmed);
            } else {
                let hash = 0;
                for (let i = 0; i < trimmed.length; i++) {
                    hash = ((hash * 31) + trimmed.charCodeAt(i)) >>> 0;
                }
                seedInput = hash;
            }
        }

        let numericSeed = Number(seedInput);
        if (!Number.isFinite(numericSeed)) {
            numericSeed = Date.now();
        }

        numericSeed = Math.floor(Math.abs(numericSeed)) % 2147483646;
        return numericSeed === 0 ? 1 : numericSeed;
    }

    buildReplayMetadata(overrides = {}) {
        const normalizedSeed = this.normalizeReplaySeed(overrides.seed ?? Date.now());
        const markers = Array.isArray(overrides.markers)
            ? overrides.markers.slice(-24).map(marker => JSON.parse(JSON.stringify(marker)))
            : [];

        return {
            sessionId: overrides.sessionId || this.createReplaySessionId(),
            seed: normalizedSeed,
            startedAtMs: overrides.startedAtMs ?? Date.now(),
            lastSeededAtMs: overrides.lastSeededAtMs ?? Date.now(),
            markerCounter: overrides.markerCounter ?? markers.length,
            deterministicCoverage: overrides.deterministicCoverage || 'metadata-only',
            markers
        };
    }

    applyReplaySeed(seedInput) {
        const normalizedSeed = this.normalizeReplaySeed(seedInput);
        if (typeof randomSeed === 'function') {
            randomSeed(normalizedSeed);
        }
        if (typeof noiseSeed === 'function') {
            noiseSeed(normalizedSeed);
        }
        return normalizedSeed;
    }

    resetReplayMetadata(options = {}) {
        const { forceNewSession = false, preserveMarkers = false, seed = null } = options;
        const existing = this.gameState.replay;
        const replay = this.buildReplayMetadata({
            sessionId: forceNewSession || !existing ? null : existing.sessionId,
            seed: seed ?? existing?.seed ?? Date.now(),
            startedAtMs: forceNewSession || !existing ? Date.now() : existing.startedAtMs,
            lastSeededAtMs: Date.now(),
            markerCounter: preserveMarkers ? (existing?.markerCounter ?? 0) : 0,
            markers: preserveMarkers ? (existing?.markers || []) : [],
            deterministicCoverage: existing?.deterministicCoverage || 'metadata-only'
        });

        replay.seed = this.applyReplaySeed(replay.seed);
        this.gameState.replay = replay;
        eventBus?.emit?.(GameEvents?.REPLAY_SESSION_STARTED || 'replay:sessionStarted', {
            sessionId: replay.sessionId,
            seed: replay.seed,
            startedAtMs: replay.startedAtMs,
            deterministicCoverage: replay.deterministicCoverage
        });
        return this.getReplayMetadata();
    }

    restoreReplayMetadata(replayMetadata, options = {}) {
        if (!replayMetadata || typeof replayMetadata !== 'object') {
            return this.resetReplayMetadata({
                forceNewSession: options.forceNewSession !== false,
                preserveMarkers: !!options.preserveMarkers
            });
        }

        const replay = this.buildReplayMetadata({
            sessionId: replayMetadata.sessionId || (options.forceNewSession ? null : this.gameState.replay?.sessionId),
            seed: replayMetadata.seed ?? this.gameState.replay?.seed ?? Date.now(),
            startedAtMs: replayMetadata.startedAtMs ?? Date.now(),
            lastSeededAtMs: replayMetadata.lastSeededAtMs ?? Date.now(),
            markerCounter: replayMetadata.markerCounter ?? (Array.isArray(replayMetadata.markers) ? replayMetadata.markers.length : 0),
            deterministicCoverage: replayMetadata.deterministicCoverage || 'metadata-only',
            markers: Array.isArray(replayMetadata.markers) ? replayMetadata.markers : []
        });

        replay.seed = this.applyReplaySeed(replay.seed);
        this.gameState.replay = replay;
        return this.getReplayMetadata();
    }

    setReplaySeed(seedInput, options = {}) {
        const current = this.gameState.replay || this.buildReplayMetadata();
        const startNewSession = !!options.newSession;
        const nextReplay = this.buildReplayMetadata({
            sessionId: startNewSession ? null : current.sessionId,
            seed: seedInput ?? current.seed,
            startedAtMs: startNewSession ? Date.now() : current.startedAtMs,
            lastSeededAtMs: Date.now(),
            markerCounter: startNewSession ? 0 : (current.markerCounter ?? 0),
            markers: startNewSession ? [] : (current.markers || []),
            deterministicCoverage: current.deterministicCoverage || 'metadata-only'
        });

        nextReplay.seed = this.applyReplaySeed(nextReplay.seed);
        this.gameState.replay = nextReplay;

        eventBus?.emit?.(GameEvents?.REPLAY_SEED_CHANGED || 'replay:seedChanged', {
            sessionId: nextReplay.sessionId,
            seed: nextReplay.seed,
            previousSeed: current.seed ?? null,
            newSession: startNewSession
        });

        if (!options.suppressMarker) {
            this.recordReplayMarker(options.markerLabel || 'reseed-session', {
                newSession: startNewSession,
                seed: nextReplay.seed,
                previousSeed: current.seed ?? null
            });
        }

        return this.getReplayMetadata();
    }

    recordReplayMarker(label, payload = {}) {
        if (!label) return null;
        if (!this.gameState.replay) {
            this.resetReplayMetadata({ forceNewSession: true, preserveMarkers: false });
        }

        const replay = this.gameState.replay;
        const nextIndex = (replay.markerCounter ?? 0) + 1;
        const marker = {
            index: nextIndex,
            label,
            createdAtMs: Date.now(),
            frame: typeof frameCount === 'number' ? frameCount : null,
            payload: JSON.parse(JSON.stringify(payload || {}))
        };

        replay.markerCounter = nextIndex;
        replay.markers = Array.isArray(replay.markers) ? replay.markers : [];
        replay.markers.push(marker);
        while (replay.markers.length > 24) {
            replay.markers.shift();
        }

        eventBus?.emit?.(GameEvents?.REPLAY_MARKER_RECORDED || 'replay:markerRecorded', {
            sessionId: replay.sessionId,
            marker
        });

        return JSON.parse(JSON.stringify(marker));
    }

    getReplayMetadata() {
        return this.gameState.replay
            ? JSON.parse(JSON.stringify(this.gameState.replay))
            : null;
    }
    
    setViewMode(mode) {
        this.gameState.viewMode = mode;
        this.zoneSystem?.setViewMode(mode);
        this.renderManager?.setViewMode(mode);
    }
    
    focusZone(zoneId) {
        if (!this.zoneSystem?.setFocusedZone(zoneId)) return false;
        this.gameState.focusedZoneId = zoneId;
        this.gameState.viewMode = 'focused-garden';
        this.renderManager?.setFocusedZone(zoneId);
        this.renderManager?.setViewMode('focused-garden');
        return true;
    }
    
    getSystems() {
        return { ...this.systems };
    }

    getTelemetrySnapshot() {
        return this.telemetrySystem?.getSnapshot?.() || null;
    }

    reseedReplaySession(seedInput = Date.now(), options = {}) {
        return this.setReplaySeed(seedInput, {
            newSession: options.newSession !== false,
            markerLabel: options.markerLabel || 'manual-reseed'
        });
    }

    startBattleSession(participants, options = {}) {
        const snapshot = this.battleSystem?.startBattle(participants, options);
        if (!snapshot) return null;
        this.gameState.activeBattleId = snapshot.battleId;
        this.setViewMode('battle');
        return snapshot;
    }

    resolveBattleSession(battleId, result = {}) {
        return this.battleSystem?.resolveSnapshot(battleId, result) || null;
    }

    commitBattleSession(battleId) {
        const snapshot = this.battleSystem?.commitResults(battleId) || null;
        if (!snapshot) return null;
        if (this.gameState.activeBattleId === battleId) {
            this.gameState.activeBattleId = null;
            this.setViewMode('focused-garden');
        }
        return snapshot;
    }

    serializeGameState() {
        return this.saveSystem?.serializeState?.(this.gameState) || null;
    }

    applySerializedState(serialized) {
        return this.saveSystem?.applyDeserializedState?.(this, serialized) || null;
    }

    saveGameToStorage() {
        return this.saveSystem?.saveToStorage?.(this.gameState) || null;
    }

    loadGameFromStorage() {
        return this.saveSystem?.loadFromStorage?.(this) || null;
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
    
    // Reset game to initial state for replay
    resetGame(resetProgression = false) {
        console.log('🔄 GameCore: Resetting game state...');
        
        // Clear all entities
        this.gameState.butterflies = [];
        this.gameState.caterpillars = [];
        this.gameState.flowers = [];
        
        if (resetProgression) {
            this.gameState.encounteredButterflies.clear();
            this.gameState.collectedButterflies.clear();
            this.gameState.butterflyCollectionStats = {};
            this.gameState.hybridJournal = [];
            this.gameState.nextHybridId = 1;
        }

        // Reset runtime tracking
        this.gameState.butterflySpawnCounts = {};
        this.gameState.goldenButterflySpawned = false;
        
        // Reset gameplay stats
        this.gameState.feedingCombo = 0;
        this.gameState.lastFeedingTime = 0;
        this.gameState.maxCombo = 0;
        this.gameState.showButterflyCollection = false;
        this.gameState.pendingOffspringReservations = 0;
        this.gameState.activeBattleId = null;
        
        // Clear entity manager
        if (this.entityManager) {
            this.entityManager.clear();
        }
        this.resetFoundationSystems();
        
        // Reset particle system
        if (this.particleSystem) {
            this.particleSystem.particles = [];
        }
        
        // Reset color pool
        if (this.mainColorPool) {
            this.mainColorPool.absorbedPixels = [];
            this.mainColorPool.glowIntensity = 0;
            this.mainColorPool.spawnCooldown = 0;
        }
        
        // Reset pool manager pools
        if (this.poolManager) {
            this.poolManager.pools = [];
        }

        this.resetReplayMetadata({ forceNewSession: true, preserveMarkers: false });
        
        // Reinitialize starting entities
        this.initializeStartingEntities().then(() => {
            progressionManager.save(this.gameState);
            console.log('✨ GameCore: Game reset complete');
        }).catch(error => {
            console.error('❌ GameCore: Error resetting game:', error);
        });
    }

    getWildButterflyCount() {
        return this.gameState.butterflies.filter(butterfly => butterfly.birthSource !== 'bred').length;
    }
}

// Create global instance
const gameCore = new GameCore();

