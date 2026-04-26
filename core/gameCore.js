// Unified game initialization and core system orchestrator
// Centralizes all managers and systems, providing clean separation from p5.js
class GameCore {
    constructor() {
        // Core systems
        this.gridManager = null;
        this.renderManager = null;
        this.interactionSystem = null;
        this.particleSystem = null;
        this.flowerManager = null;
        this.entityManager = null;
        this.zoneSystem = null;
        this.statusSystem = null;
        this.behaviorSystem = null;
        this.objectSystem = null;
        this.structureSystem = null;
        this.sleepSystem = null;
        this.lifeSimSystem = null;
        this.statProfileSystem = null;
        this.mlInferenceSystem = null;
        this.rosterSystem = null;
        this.teachingSystem = null;
        this.communicationSystem = null;
        this.battleSystem = null;
        this.saveSystem = null;
        this.telemetrySystem = null;
        this.systems = {};
        this.replaySessionCounter = 0;
        this.isResettingGame = false;
        this.hiddenLoopPauseActive = false;
        this.boundVisibilityChangeHandler = this.handleDocumentVisibilityChange.bind(this);
        
        // Game state
        this.gameState = {
            butterflies: [],
            caterpillars: [],
            flowers: [],
            blocks: [],
            initialized: false,
            paused: false,
            butterflySpawnCounts: {}, // Track spawn count per personality type
            goldenButterflySpawned: false,
            unlockedButterflyTypes: new Set(),
            progressionOrderIndex: 0,
            unlockHistory: [],
            starterPairsSeeded: {},
            perTypeUnlockStatus: {},
            perWildButterflyProgress: {},
            freshSeedZoneId: null,
            releasesSinceRespawn: 0,
            totalReleases: 0,
            currentReleaseBatch: null,
            wildBaselineModifiers: null,
            releaseHistory: [],
            feedingCombo: 0, // Sequential feeding combo
            lastFeedingTime: 0, // For combo tracking
            maxCombo: 0, // Track best combo
            showButterflyCollection: false, // Toggle for collection UI
            hybridJournal: [],
            nextHybridId: 1,
            pendingOffspringReservations: 0,
            pendingPollenPlantings: [],
            timeScale: gameConfig?.simulation?.defaultTimeScale || 1,
            focusedZoneId: null,
            viewMode: 'focused-garden',
            activeBattleId: null,
            replay: null,
            roster: null
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
            'structureSystem',
            'physicsSystem',
            'sleepSystem',
            'lifeSimSystem',
            'statProfileSystem',
            'mlInferenceSystem',
            'rosterSystem',
            'teachingSystem',
            'communicationSystem',
            'battleSystem',
            'saveSystem',
            'telemetrySystem',
            'replayMetadata',
            'renderManager',
            'entityManager',
            'particleSystem',
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
            await this.initializeStructureSystem();
            await this.initializePhysicsSystem();
            await this.initializeSleepSystem();
            await this.initializeLifeSimSystem();
            await this.initializeStatProfileSystem();
            await this.initializeMlInferenceSystem();
            await this.initializeRosterSystem();
            await this.initializeTeachingSystem();
            await this.initializeCommunicationSystem();
            await this.initializeBattleSystem();
            await this.initializeSaveSystem();
            await this.initializeTelemetrySystem();
            
            // Step 6: Initialize render manager
            await this.initializeRenderManager(backgroundImage);
            
            // Step 7: Initialize entity manager (population manager)
            await this.initializeEntityManager();
            
            // Step 8: Initialize particle system
            await this.initializeParticleSystem();
            
            // Step 9: Initialize flower manager
            await this.initializeFlowerManager();
            
            // Step 10: Initialize interaction system
            await this.initializeInteractionSystem();
            
            // Step 11: Set up ecosystem event chains
            await this.setupEcosystemEvents();

            // Step 11.5: Initialize replay metadata before random-heavy entity creation
            await this.initializeReplayMetadata();
            
            // Step 12: Restore saved game when available, otherwise create initial entities
            const restoredFromSave = await this.tryRestoreSavedGame();
            if (!restoredFromSave) {
                await this.initializeStartingEntities();
            }
            this.ensureZoneOwnership();
            this.attachRuntimeVisibilityHandling();
            
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
    
    async initializeStructureSystem() {
        if (typeof StructureSystem === 'undefined' || typeof structureSystem === 'undefined') {
            throw new Error('StructureSystem not found - ensure systems/structureSystem.js is loaded');
        }
        this.structureSystem = structureSystem;
        this.structureSystem.initialize();
        this.systems.structureSystem = this.structureSystem;
        this.completedSteps.add('structureSystem');
        console.log('âœ“ Structure system initialized');
    }

    async initializePhysicsSystem() {
        if (typeof PhysicsSystem === 'undefined' || typeof physicsSystem === 'undefined') {
            throw new Error('PhysicsSystem not found - ensure systems/physicsSystem.js is loaded');
        }
        this.physicsSystem = physicsSystem;
        this.physicsSystem.initialize();
        this.systems.physicsSystem = this.physicsSystem;
        this.completedSteps.add('physicsSystem');
        console.log('Physics system initialized');
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
    
    async initializeLifeSimSystem() {
        if (typeof LifeSimSystem === 'undefined' || typeof lifeSimSystem === 'undefined') {
            throw new Error('LifeSimSystem not found - ensure systems/lifeSimSystem.js is loaded');
        }
        this.lifeSimSystem = lifeSimSystem;
        this.lifeSimSystem.initialize();
        this.systems.lifeSimSystem = this.lifeSimSystem;
        this.completedSteps.add('lifeSimSystem');
        console.log('✓ Life-sim system initialized');
    }

    async initializeStatProfileSystem() {
        if (typeof StatProfileSystem === 'undefined' || typeof statProfileSystem === 'undefined') {
            throw new Error('StatProfileSystem not found - ensure systems/statProfileSystem.js is loaded');
        }
        this.statProfileSystem = statProfileSystem;
        this.statProfileSystem.initialize();
        this.systems.statProfileSystem = this.statProfileSystem;
        this.completedSteps.add('statProfileSystem');
        console.log('✓ Stat profile system initialized');
    }

    async initializeMlInferenceSystem() {
        if (typeof MlInferenceSystem === 'undefined' || typeof mlInferenceSystem === 'undefined') {
            throw new Error('MlInferenceSystem not found - ensure systems/mlInferenceSystem.js is loaded');
        }
        this.mlInferenceSystem = mlInferenceSystem;
        await this.mlInferenceSystem.initialize();
        this.systems.mlInferenceSystem = this.mlInferenceSystem;
        this.completedSteps.add('mlInferenceSystem');
        console.log('✓ ML inference system initialized');
    }

    async initializeRosterSystem() {
        if (typeof RosterSystem === 'undefined' || typeof rosterSystem === 'undefined') {
            throw new Error('RosterSystem not found - ensure systems/rosterSystem.js is loaded');
        }
        this.rosterSystem = rosterSystem;
        this.rosterSystem.initialize();
        this.rosterSystem.reset(this.gameState);
        this.systems.rosterSystem = this.rosterSystem;
        this.completedSteps.add('rosterSystem');
        console.log('Roster system initialized');
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
    
    async initializeCommunicationSystem() {
        if (typeof CommunicationSystem === 'undefined' || typeof communicationSystem === 'undefined') {
            throw new Error('CommunicationSystem not found - ensure systems/communicationSystem.js is loaded');
        }
        this.communicationSystem = communicationSystem;
        this.communicationSystem.initialize();
        this.systems.communicationSystem = this.communicationSystem;
        this.completedSteps.add('communicationSystem');
        console.log('Communication system initialized');
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
        if (this.mainColorPool?.setSectionRotation) {
            const rotationDegrees = this.zoneSystem?.getFocusedZone?.()?.renderProfile?.rotationDegrees || 0;
            this.mainColorPool.setSectionRotation(rotationDegrees);
        }
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

        eventBus.on('debug:spawnBlock', (data) => {
            this.godSpawnBlock(data.zoneId, data.x, data.y);
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

        eventBus.on('debug:resetProgression', async () => {
            await this.resetGame(true);
        });
        
        this.completedSteps.add('ecosystemEvents');
        console.log('✓ Ecosystem events configured');
    }
    
    async initializeStartingEntities() {
        if (typeof Butterfly === 'undefined' || typeof Flower === 'undefined' || typeof Block === 'undefined') {
            throw new Error('Entity classes not found - ensure entities/*.js are loaded');
        }
        
        // Create initial butterflies
        const zoneIds = this.getZoneIds();
        if (!(this.gameState.unlockedButterflyTypes instanceof Set) || this.gameState.unlockedButterflyTypes.size === 0) {
            progressionManager?.initializeFreshWorldState?.(this.gameState, zoneIds);
        } else {
            progressionManager?.ensureProgressionContainers?.(this.gameState);
        }
        this.spawnStarterZonePairs(zoneIds);
        const startingButterflyCount = 0;
        
        for (let i = 0; i < startingButterflyCount; i++) {
            const targetZoneId = zoneIds.length
                ? zoneIds[Math.floor(i / 2) % zoneIds.length]
                : this.getFocusedZoneId();
            const zoneCenter = this.getRandomZonePoint(targetZoneId, 48) || this.getZoneCenter(targetZoneId) || this.gridManager.isoToScreen(
                random(3, this.gridManager.bounds.maxX - 3),
                random(3, this.gridManager.bounds.maxY - 3)
            );
            const screenPos = {
                x: zoneCenter.x + (i % 2 === 0 ? -18 : 18),
                y: zoneCenter.y + (i % 2 === 0 ? -8 : 8)
            };
            const isImmortal = false;
            const personalityType = this.chooseWildProgressionType({ allowGolden: false });
            
            const butterfly = new Butterfly(
                screenPos.x, 
                screenPos.y - gameConfig.entities.heightOffset.butterfly, 
                null, // Let personality determine colors
                false,
                personalityType,
                {
                    sex: i % 2 === 0 ? 'F' : 'M',
                    currentZoneId: targetZoneId
                }
            );
            this.assignEntityToZone(butterfly, targetZoneId || this.getFocusedZoneId());
            this.seedWildLifecycleMetadata(butterfly, i % 2 === 0 ? 'left' : 'right');
            
            this.gameState.butterflies.push(butterfly);
            this.entityManager.addEntity('butterflies', butterfly);
            this.registerEntityWithFoundationSystems(butterfly, 'butterfly');
            
            if (isImmortal) {
                console.log('🦋 Created immortal butterfly to prevent ecosystem collapse');
            }
        }
        
        // Create starting flowers based on actual local butterfly density so the seed zone does not collapse into one cramped patch.
        for (const targetZoneId of zoneIds || []) {
            const initialFlowerCount = this.getInitialImmortalFlowerTarget(targetZoneId);
            for (let i = 0; i < initialFlowerCount; i += 1) {
                this.spawnFlowerAt(targetZoneId, null, null, {
                    isImmortal: true,
                    minDistance: gameConfig?.entities?.flower?.spawnMinDistance || 40,
                    maxAttempts: 36
                });
            }
        }

        this.spawnInitialBlocks(zoneIds);

        for (const butterfly of this.gameState.butterflies) {
            butterfly.gridPos = this.gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
        }
        
        if (typeof progressionManager !== 'undefined') {
            progressionManager.save(this.gameState);
        }

        this.completedSteps.add('initialEntities');
        console.log('✓ Starting entities created');
    }

    applyStarterButterflyDisposition(butterfly) {
        if (!butterfly) return;
        butterfly.cursor = butterfly.cursor || {};
        butterfly.cursor.trustLevel = Math.max(18, butterfly.cursor.trustLevel || 0);
        butterfly.cursor.clapFear = 0;
        butterfly.cursor.currentPatience = Math.max(
            butterfly.cursor.currentPatience || 0,
            Math.min((butterfly.cursor.patienceRequired || 120) * 0.35, butterfly.cursor.patienceRequired || 120)
        );
        if (butterfly.lifeSim?.playerInteraction) {
            butterfly.lifeSim.playerInteraction.cursorTrust = Math.max(0.32, butterfly.lifeSim.playerInteraction.cursorTrust || 0);
            butterfly.lifeSim.playerInteraction.cursorFear = 0;
            butterfly.lifeSim.playerInteraction.calmedByCursor = false;
        }
        butterfly.happiness = Math.max(butterfly.happiness || 0, Math.min(butterfly.maxHappiness || 100, 72));
    }

    spawnProgressionButterflyInZone(type, sex, zoneId, options = {}) {
        const screenPos = this.findValidButterflySpawnPoint(zoneId, {
            minDistance: 32,
            maxAttempts: 36
        }) || this.getRandomZonePoint(zoneId, 48) || this.getZoneCenter(zoneId) || this.gridManager.isoToScreen(
            random(3, this.gridManager.bounds.maxX - 3),
            random(3, this.gridManager.bounds.maxY - 3)
        );
        const birthSource = options.birthSource || 'wild';
        const customTraits = birthSource === 'wild'
            ? progressionManager?.getWildSpawnTraits?.(this.gameState, type) || null
            : null;
        const butterfly = new Butterfly(
            screenPos.x,
            screenPos.y - gameConfig.entities.heightOffset.butterfly,
            null,
            false,
            type,
            {
                sex,
                currentZoneId: zoneId,
                birthSource,
                ...(customTraits ? { customTraits } : {})
            }
        );
        this.assignEntityToZone(butterfly, zoneId || this.getFocusedZoneId());
        if ((butterfly.birthSource || 'wild') === 'wild') {
            this.seedWildLifecycleMetadata(butterfly, sex === 'F' ? 'left' : 'right');
            progressionManager?.registerWildButterfly?.(this.gameState, butterfly, {
                seededBy: options.seededBy || 'ambient',
                zoneId,
                releaseCohortId: options.releaseCohortId
            });
        }
        this.gameState.butterflies.push(butterfly);
        this.entityManager?.addEntity?.('butterflies', butterfly);
        this.registerEntityWithFoundationSystems(butterfly, 'butterfly');
        if (options.warmStarter) {
            this.applyStarterButterflyDisposition(butterfly);
        }
        return butterfly;
    }

    spawnStarterZonePairs(zoneIds = this.getZoneIds()) {
        const seedZoneId = progressionManager?.getFreshSeedZoneId?.(this.gameState, zoneIds) || zoneIds?.[0] || this.getFocusedZoneId();
        if (!seedZoneId) return;

        for (const type of progressionManager?.getFreshSeedTypes?.() || ['friendly']) {
            this.spawnProgressionButterflyInZone(type, 'F', seedZoneId, {
                birthSource: 'wild',
                seededBy: 'starter',
                warmStarter: true
            });
            this.spawnProgressionButterflyInZone(type, 'M', seedZoneId, {
                birthSource: 'wild',
                seededBy: 'starter',
                warmStarter: true
            });
        }
        progressionManager?.markStarterPairSeeded?.(this.gameState, seedZoneId);
    }

    spawnUnlockedZonePairs(type, zoneIds = this.getZoneIds()) {
        if (!type) return [];
        const spawned = [];
        const zones = zoneIds?.length ? zoneIds : [this.getFocusedZoneId()];
        for (const zoneId of zones) {
            spawned.push(this.spawnProgressionButterflyInZone(type, 'F', zoneId, {
                birthSource: 'wild',
                seededBy: 'unlock'
            }));
            spawned.push(this.spawnProgressionButterflyInZone(type, 'M', zoneId, {
                birthSource: 'wild',
                seededBy: 'unlock'
            }));
        }
        progressionManager?.markUnlockPairsSeeded?.(this.gameState, type);
        progressionManager?.save?.(this.gameState);
        return spawned.filter(Boolean);
    }

    spawnEcologyWildWave(waveCount = 1) {
        const spawned = [];
        for (let waveIndex = 0; waveIndex < Math.max(1, waveCount || 1); waveIndex += 1) {
            const cohortSummary = progressionManager?.getReleaseCohortSummary?.(this.gameState) || null;
            for (const type of progressionManager?.getFreshSeedTypes?.() || []) {
                const femaleFallbackZoneId = this.pickWildArrivalZoneId();
                const maleFallbackZoneId = this.pickWildArrivalZoneId();
                const femaleZoneId = progressionManager?.getReleaseWavePreferredZoneId?.(this.gameState, {
                    fallbackZoneId: femaleFallbackZoneId,
                    type,
                    sex: 'F',
                    waveIndex
                }) || femaleFallbackZoneId;
                const maleZoneId = progressionManager?.getReleaseWavePreferredZoneId?.(this.gameState, {
                    fallbackZoneId: maleFallbackZoneId,
                    type,
                    sex: 'M',
                    waveIndex
                }) || maleFallbackZoneId;
                spawned.push(this.spawnProgressionButterflyInZone(type, 'F', femaleZoneId, {
                    birthSource: 'wild',
                    seededBy: 'release-wave',
                    releaseCohortId: cohortSummary?.cohortId || null
                }));
                spawned.push(this.spawnProgressionButterflyInZone(type, 'M', maleZoneId, {
                    birthSource: 'wild',
                    seededBy: 'release-wave',
                    releaseCohortId: cohortSummary?.cohortId || null
                }));
            }
        }
        progressionManager?.save?.(this.gameState);
        return spawned.filter(Boolean);
    }

    releaseButterflies(butterflyIds = [], options = {}) {
        const ids = Array.from(new Set((butterflyIds || []).filter(Boolean)));
        if (!ids.length) return { releasedIds: [], waveCount: 0 };

        const zoneId = options.zoneId || null;
        const releasedIds = [];
        let waveCount = 0;

        for (const butterflyId of ids) {
            const butterfly = (this.gameState.butterflies || []).find(entry => entry?.id === butterflyId) || null;
            if (!butterfly) continue;
            if (zoneId && this.getEntityZoneId(butterfly, null) !== zoneId) continue;
            if (!progressionManager?.isReleasableHybrid?.(butterfly)) continue;

            if (butterfly.pregnancy?.active && butterfly.pregnancy.lifecycleData?.reservationActive) {
                butterfly.pregnancy.lifecycleData.reservationActive = false;
                this.gameState.pendingOffspringReservations = Math.max(0, (this.gameState.pendingOffspringReservations || 0) - 1);
            }

            const partner = butterfly.breeding?.partnerId
                ? (this.gameState.butterflies || []).find(entry => entry.id === butterfly.breeding.partnerId) || null
                : null;
            if (partner?.breeding?.partnerId === butterfly.id) {
                partner.breeding.partnerId = null;
                partner.breeding.matingTimer = 0;
                partner.breeding.matingResolved = false;
                if (partner.state === 'mating') {
                    partner.changeState?.('normal');
                }
            }

            const releaseResult = progressionManager?.recordHybridRelease?.(this.gameState, butterfly) || { released: false, waveTriggered: false };
            if (!releaseResult.released) continue;

            rosterSystem?.removeMember?.(butterfly.id, this.gameState);
            this.particleSystem?.emitBurst?.(butterfly.x, butterfly.y, butterfly.colors?.[0] || [255, 255, 255], 10);
            this.removeButterflyFromGame(butterfly);
            releasedIds.push(butterfly.id);

            if (releaseResult.waveTriggered) {
                waveCount += 1;
            }
        }

        if (waveCount > 0) {
            this.spawnEcologyWildWave(waveCount);
        }

        if (releasedIds.length > 0) {
            progressionManager?.save?.(this.gameState);
        }

        return {
            releasedIds,
            waveCount
        };
    }

    async tryRestoreSavedGame() {
        if (!this.saveSystem?.loadFromStorage) return false;

        try {
            const restoredState = await this.saveSystem.loadFromStorage(this);
            if (!restoredState) {
                return false;
            }

            if (
                restoredState?.meta?.forceFreshWorld &&
                (!this.gameState.butterflies?.length && !this.gameState.flowers?.length)
            ) {
                await this.initializeStartingEntities();
                this.ensureZoneOwnership();
                await this.saveSystem?.saveToStorage?.(this.gameState, { source: 'recovery' });
            } else if (!(this.gameState.blocks?.length > 0)) {
                this.spawnInitialBlocks(this.getZoneIds());
                this.ensureZoneOwnership();
                await this.saveSystem?.saveToStorage?.(this.gameState, { source: 'block-backfill' });
            }

            this.completedSteps.add('initialEntities');
            console.log('✓ Saved game restored from storage');
            return true;
        } catch (error) {
            console.warn('GameCore: Failed to restore saved game, starting fresh instead:', error);
            return false;
        }
    }
    
    isSectionSceneWorld() {
        return gameConfig?.world?.renderMode === 'section-scenes';
    }

    getZoneIds() {
        return this.zoneSystem?.getZones?.().map(zone => zone.id) || [];
    }

    getZoneConfig(zoneId) {
        return this.zoneSystem?.getZone?.(zoneId) || (gameConfig?.world?.zones || []).find(zone => zone.id === zoneId) || null;
    }

    getZoneEcologyProfile(zoneId) {
        return this.getZoneConfig(zoneId)?.ecologyProfile || {};
    }

    getZoneScreenRegion(zoneId) {
        return this.getZoneConfig(zoneId)?.renderProfile?.screenRegion || null;
    }

    getZonePlacementRegion(zoneId) {
        return this.gridManager?.getZonePlacementRegion?.(zoneId)
            || this.getZoneScreenRegion(zoneId);
    }

    getMigrationBalance() {
        return gameConfig?.balance?.migration || {};
    }

    clampUnit(value) {
        return Math.max(0, Math.min(1, value ?? 0));
    }

    getZoneCenter(zoneId) {
        const zone = this.getZoneConfig(zoneId);
        const screenRegion = this.getZonePlacementRegion(zoneId);
        if (screenRegion) {
            return {
                x: (screenRegion.minX + screenRegion.maxX) / 2,
                y: (screenRegion.minY + screenRegion.maxY) / 2
            };
        }
        if (!zone?.bounds) return null;
        const centerX = (zone.bounds.minX + zone.bounds.maxX) / 2;
        const centerY = (zone.bounds.minY + zone.bounds.maxY) / 2;
        return this.gridManager?.isoToScreen?.(centerX, centerY) || null;
    }

    getPlacementEdgeInset() {
        return this.gridManager?.getPlacementEdgeInset?.() || gameConfig?.entities?.placementEdgeInset || 22;
    }

    getEntitySpatialMetrics(entityType = 'butterfly', options = {}) {
        const normalizedType = entityType || 'butterfly';
        const zoneId = options.zoneId || null;
        const baseSizeByType = {
            butterfly: gameConfig?.entities?.butterfly?.size || 12,
            caterpillar: 24,
            flower: 13,
            egg: 13,
            chrysalis: 13
        };

        if (this.structureSystem?.getEntityMetrics) {
            if (normalizedType === 'flower' || normalizedType === 'egg' || normalizedType === 'chrysalis') {
                const occupancyState = normalizedType === 'flower'
                    ? (options.occupancyState || 'normal')
                    : normalizedType;
                const probe = options.entity || {
                    size: options.size || baseSizeByType[normalizedType] || baseSizeByType.flower,
                    flowerType: options.flowerType || 'daisy',
                    occupancyState,
                    currentZoneId: zoneId,
                    objectProfile: {
                        entityType: 'flower',
                        occupancyState
                    }
                };
                const metrics = this.structureSystem.getEntityMetrics(probe, 'flower');
                if (metrics) return metrics;
            } else {
                const probe = options.entity || {
                    size: options.size || baseSizeByType[normalizedType] || 12,
                    currentZoneId: zoneId,
                    lifeSim: {
                        lifecycle: {
                            currentZoneId: zoneId
                        }
                    }
                };
                const metrics = this.structureSystem.getEntityMetrics(probe, normalizedType);
                if (metrics) return metrics;
            }
        }

        const fallbackWidth = baseSizeByType[normalizedType] || 12;
        const fallbackRadius = Math.max(6, Math.round(fallbackWidth * 0.5));
        const fallbackOccupancyRadius = Math.max(fallbackRadius + 4, Math.round(fallbackWidth * 1.6));
        return {
            family: normalizedType,
            width: fallbackWidth,
            radius: fallbackRadius,
            clearance: 1,
            occupancyRadius: fallbackOccupancyRadius,
            connectDistance: Math.max(32, fallbackWidth * 3),
            columnRadius: Math.max(10, Math.round(fallbackWidth * 0.44)),
            columnQueryRadius: fallbackOccupancyRadius,
            openingConflictRadius: fallbackOccupancyRadius,
            separationDistance: Math.max(12, Math.round(fallbackWidth * 0.92))
        };
    }

    getButterflyInteractionSpace(zoneId = this.getFocusedZoneId(), options = {}) {
        const metrics = this.getEntitySpatialMetrics('butterfly', {
            zoneId,
            entity: options.entity || null
        });
        const edgeInset = this.getPlacementEdgeInset();
        return {
            metrics,
            clampPadding: Math.max(8, Math.round(Math.max(edgeInset * 0.4, metrics.radius * 1.05))),
            randomPadding: Math.max(36, Math.round(Math.max(metrics.occupancyRadius * 2, metrics.separationDistance * 2.2))),
            localHopMin: Math.max(18, Math.round(metrics.separationDistance * 1.3)),
            localHopMax: Math.max(44, Math.round(metrics.separationDistance * 3.6)),
            preferredJitterX: Math.max(24, Math.round(metrics.occupancyRadius * 1.4)),
            preferredJitterY: Math.max(20, Math.round(metrics.occupancyRadius * 1.08)),
            nearbyRadius: Math.max(74, Math.round(metrics.occupancyRadius * 3.2)),
            minDistance: Math.max(34, Math.round(metrics.separationDistance * 2.8)),
            doorwayAvoidRadius: Math.max(48, Math.round(metrics.occupancyRadius * 2.1)),
            butterflyDistanceScoreMax: Math.max(140, Math.round(metrics.separationDistance * 9)),
            flowerDistanceScoreMax: Math.max(120, Math.round(metrics.occupancyRadius * 6))
        };
    }

    getFlowerInteractionSpace(zoneId = this.getFocusedZoneId(), options = {}) {
        const occupancyState = options.occupancyState || 'normal';
        const entityType = occupancyState === 'egg' || occupancyState === 'chrysalis'
            ? occupancyState
            : 'flower';
        const metrics = this.getEntitySpatialMetrics(entityType, {
            zoneId,
            entity: options.entity || null,
            occupancyState,
            flowerType: options.flowerType
        });
        const edgeInset = this.getPlacementEdgeInset();
        const blockUnit = this.structureSystem?.getCanonicalBlockUnit?.() || {};
        const butterflySpace = this.getButterflyInteractionSpace(zoneId);
        const configuredDoorwayRadius = gameConfig?.entities?.flower?.placementAvoidDoorwayRadius || 42;
        const configuredBlockRadius = gameConfig?.entities?.flower?.placementAvoidBlockRadius || 14;
        return {
            metrics,
            clampPadding: Math.max(8, Math.round(Math.max(edgeInset * 0.42, metrics.radius * 1.12))),
            randomPadding: Math.max(34, Math.round(Math.max(metrics.occupancyRadius * 2, (blockUnit.radius || 8) * 2.5))),
            preferredJitterX: Math.max(24, Math.round(metrics.occupancyRadius * 1.35)),
            preferredJitterY: Math.max(18, Math.round(metrics.occupancyRadius * 1.05)),
            preferredDistance: Math.max(gameConfig?.entities?.flower?.preferredSpacing || 96, Math.round(metrics.occupancyRadius * 4.8)),
            doorwayAvoidRadius: Math.max(configuredDoorwayRadius, Math.round(Math.max(metrics.occupancyRadius * 2.25, blockUnit.doorwayAvoidRadius || 0))),
            blockAvoidRadius: Math.max(configuredBlockRadius, Math.round(Math.max(metrics.occupancyRadius + (blockUnit.radius || 8), (blockUnit.radius || 8) * 1.6))),
            nearbyButterflyRadius: Math.max(84, butterflySpace.nearbyRadius),
            relocationStepDistance: Math.max(34, Math.round(metrics.occupancyRadius + Math.max(configuredBlockRadius, blockUnit.radius || 8))),
            preferredDistanceScoreMax: Math.max(gameConfig?.entities?.flower?.preferredSpacing || 96, Math.round(metrics.occupancyRadius * 4.8))
        };
    }

    getCaterpillarInteractionSpace(zoneId = this.getFocusedZoneId(), options = {}) {
        const metrics = this.getEntitySpatialMetrics('caterpillar', {
            zoneId,
            entity: options.entity || null
        });
        const edgeInset = this.getPlacementEdgeInset();
        const flowerSpace = this.getFlowerInteractionSpace(zoneId);
        return {
            metrics,
            clampPadding: Math.max(8, Math.round(Math.max(edgeInset * 0.45, metrics.radius * 1.18, flowerSpace.clampPadding))),
            reachRadius: Math.max(8, Math.round(metrics.radius * 0.88)),
            targetRetainRadius: Math.max(16, Math.round(metrics.occupancyRadius * 1.3))
        };
    }

    getRandomZonePoint(zoneId = this.getFocusedZoneId(), padding = 28, options = {}) {
        return this.gridManager?.getRandomPointInZone?.(zoneId, padding, 40, options) || this.getZoneCenter(zoneId);
    }

    getRandomPlacementPoint(zoneId = this.getFocusedZoneId(), padding = 28) {
        return this.getRandomZonePoint(zoneId, padding, {
            edgeInset: this.getPlacementEdgeInset()
        });
    }

    clampPlacementPointInZone(zoneId, x, y, padding = 0, options = {}) {
        return this.clampScreenPointToRoamArea(x, y, padding, {
            edgeInset: this.getPlacementEdgeInset(),
            ...(zoneId ? { zoneId } : {}),
            ...options
        });
    }

    getFlowerSectorLayout() {
        const layout = gameConfig?.entities?.flower?.sectorGrid || {};
        return {
            cols: Math.max(1, layout.cols || 3),
            rows: Math.max(1, layout.rows || 3)
        };
    }

    getZoneSectorKey(zoneId, point, layout = this.getFlowerSectorLayout()) {
        const region = this.getZonePlacementRegion(zoneId);
        if (!region || !point) return null;
        const width = Math.max(1, region.maxX - region.minX);
        const height = Math.max(1, region.maxY - region.minY);
        const col = constrain(Math.floor(((point.x - region.minX) / width) * layout.cols), 0, layout.cols - 1);
        const row = constrain(Math.floor(((point.y - region.minY) / height) * layout.rows), 0, layout.rows - 1);
        return `${col}:${row}`;
    }

    getZoneSectorSamplePoint(zoneId, attemptIndex, layout = this.getFlowerSectorLayout(), options = {}) {
        const region = this.getZonePlacementRegion(zoneId);
        if (!region) return null;
        const cellIndex = attemptIndex % (layout.cols * layout.rows);
        const col = cellIndex % layout.cols;
        const row = Math.floor(cellIndex / layout.cols);
        const cellWidth = (region.maxX - region.minX) / layout.cols;
        const cellHeight = (region.maxY - region.minY) / layout.rows;
        const sampleX = region.minX + (cellWidth * (col + 0.5)) + random(-cellWidth * 0.22, cellWidth * 0.22);
        const sampleY = region.minY + (cellHeight * (row + 0.5)) + random(-cellHeight * 0.2, cellHeight * 0.2);
        const padding = Number.isFinite(options.padding) ? options.padding : 8;
        return this.clampPlacementPointInZone(zoneId, sampleX, sampleY, padding);
    }

    buildZoneSectorOccupancy(zoneId, entities = [], layout = this.getFlowerSectorLayout()) {
        const occupancy = new Map();
        for (const entity of entities) {
            const key = this.getZoneSectorKey(zoneId, entity, layout);
            if (!key) continue;
            occupancy.set(key, (occupancy.get(key) || 0) + 1);
        }
        return occupancy;
    }

    countNearbyButterflies(zoneId, point, radius = 82, ignoreEntityId = null) {
        const butterflies = this.getButterfliesInZone(zoneId);
        let count = 0;
        for (const butterfly of butterflies) {
            if (!butterfly?.id || butterfly.zoneTravel || butterfly.isSpawning) continue;
            if (ignoreEntityId && butterfly.id === ignoreEntityId) continue;
            if (Math.hypot((butterfly.x || 0) - point.x, (butterfly.y || 0) - point.y) <= radius) {
                count += 1;
            }
        }
        return count;
    }

    getButterflyDispersalConfig() {
        const config = gameConfig?.entities?.butterfly?.dispersal || {};
        return {
            candidateCount: Math.max(8, config.candidateCount || 16),
            sectorMemoryLimit: Math.max(3, config.sectorMemoryLimit || 6),
            anchorMemoryLimit: Math.max(3, config.anchorMemoryLimit || 6),
            visitRecordIntervalFrames: Math.max(24, config.visitRecordIntervalFrames || 96),
            underusedSectorBonus: Math.max(0, config.underusedSectorBonus || 0.35),
            noveltyBonus: Math.max(0, config.noveltyBonus || 0.2),
            localCrowdPenalty: Math.max(0, config.localCrowdPenalty || 0.45),
            anchorSaturationPenalty: Math.max(0, config.anchorSaturationPenalty || 0.35),
            recentSelfReusePenalty: Math.max(0, config.recentSelfReusePenalty || 0.25),
            edgeDiscomfortPenalty: Math.max(0, config.edgeDiscomfortPenalty || 0.15)
        };
    }

    buildZoneLiveSectorSnapshot(zoneId, layout = this.getFlowerSectorLayout()) {
        const butterflies = this.getButterfliesInZone(zoneId)
            .filter(butterfly => butterfly?.id && !butterfly.zoneTravel && !butterfly.isSpawning);
        const flowers = this.getFlowersInZone(zoneId)
            .filter(flower => flower?.id);
        const blocks = this.getBlocksInZone(zoneId)
            .filter(block => block?.id && !block?.carriedById);
        const butterflyOccupancy = this.buildZoneSectorOccupancy(zoneId, butterflies, layout);
        const flowerOccupancy = this.buildZoneSectorOccupancy(zoneId, flowers, layout);
        const blockOccupancy = this.buildZoneSectorOccupancy(zoneId, blocks, layout);
        const visitPressure = new Map();
        let maxVisitPressure = 0;

        for (const butterfly of butterflies) {
            for (const sectorKey of butterfly?.dispersal?.recentSectorKeys || []) {
                const nextValue = (visitPressure.get(sectorKey) || 0) + 1;
                visitPressure.set(sectorKey, nextValue);
                if (nextValue > maxVisitPressure) {
                    maxVisitPressure = nextValue;
                }
            }
        }

        const sectorCount = Math.max(1, layout.cols * layout.rows);
        const totalButterflies = butterflies.length;
        let maxButterflyLoad = 0;
        for (const load of butterflyOccupancy.values()) {
            if (load > maxButterflyLoad) {
                maxButterflyLoad = load;
            }
        }

        return {
            zoneId,
            layout,
            butterflies,
            flowers,
            blocks,
            butterflyOccupancy,
            flowerOccupancy,
            blockOccupancy,
            visitPressure,
            sectorCount,
            totalButterflies,
            averageButterflyLoad: totalButterflies / sectorCount,
            maxButterflyLoad: Math.max(1, maxButterflyLoad),
            maxVisitPressure: Math.max(1, maxVisitPressure)
        };
    }

    getEntityRecentSectorPenalty(entity, sectorKey) {
        if (!sectorKey) return 0;
        const recent = entity?.dispersal?.recentSectorKeys || [];
        if (!recent.length) return 0;
        let penalty = 0;
        const length = Math.max(1, recent.length);
        for (let index = 0; index < recent.length; index += 1) {
            if (recent[index] !== sectorKey) continue;
            penalty += (length - index) / length;
        }
        return Math.min(1, penalty / 2.4);
    }

    getEntityRecentAnchorPenalty(entity, anchorId) {
        if (!anchorId) return 0;
        const recent = entity?.dispersal?.recentAnchorIds || [];
        if (!recent.length) return 0;
        let penalty = 0;
        const length = Math.max(1, recent.length);
        for (let index = 0; index < recent.length; index += 1) {
            if (recent[index] !== anchorId) continue;
            penalty += (length - index) / length;
        }
        return Math.min(1, penalty / 2.1);
    }

    getSectorUnderuseBonus(snapshot, sectorKey) {
        if (!snapshot || !sectorKey) return 0;
        const config = this.getButterflyDispersalConfig();
        const sectorLoad = snapshot.butterflyOccupancy.get(sectorKey) || 0;
        const normalizedLoad = snapshot.maxButterflyLoad > 0
            ? (sectorLoad / snapshot.maxButterflyLoad)
            : 0;
        return Math.max(0, (1 - normalizedLoad) * config.underusedSectorBonus);
    }

    getSectorNoveltyBonus(snapshot, sectorKey) {
        if (!snapshot || !sectorKey) return 0;
        const config = this.getButterflyDispersalConfig();
        const visitLoad = snapshot.visitPressure.get(sectorKey) || 0;
        const normalizedLoad = snapshot.maxVisitPressure > 0
            ? (visitLoad / snapshot.maxVisitPressure)
            : 0;
        return Math.max(0, (1 - normalizedLoad) * config.noveltyBonus);
    }

    scoreButterflyWanderPoint(butterfly, zoneId, point, snapshot, options = {}) {
        if (!butterfly || !zoneId || !point) return -Infinity;
        const config = this.getButterflyDispersalConfig();
        const sectorKey = this.getZoneSectorKey(zoneId, point, snapshot?.layout || this.getFlowerSectorLayout());
        const nearbyButterflies = this.countNearbyButterflies(zoneId, point, options.localCrowdRadius || 84, butterfly.id);
        const sectorLoad = sectorKey ? (snapshot?.butterflyOccupancy.get(sectorKey) || 0) : 0;
        const borderDistance = this.gridManager?.getDistanceToRoamBorder?.(point) ?? 48;
        const edgePressure = Math.max(
            this.isPointNearZoneDoorway(zoneId, point, 44) ? 1 : 0,
            borderDistance < 26 ? (1 - (borderDistance / 26)) : 0
        );
        const distanceFromCurrent = Math.hypot((point.x || 0) - (butterfly.x || 0), (point.y || 0) - (butterfly.y || 0));
        const recentSectorPenalty = this.getEntityRecentSectorPenalty(butterfly, sectorKey);
        const crowdFactor = Math.min(1, (nearbyButterflies / 6) * 0.7 + (sectorLoad / Math.max(1, snapshot?.maxButterflyLoad || 1)) * 0.3);
        const preferredPoint = options.preferredPoint || null;
        const preferredDistance = preferredPoint
            ? Math.hypot((point.x || 0) - preferredPoint.x, (point.y || 0) - preferredPoint.y)
            : 0;
        const preferredPointBonus = options.preferredPointBonus ?? 0.24;
        const preferredDistanceScale = options.preferredDistanceScale ?? 180;
        const avoidPoints = Array.isArray(options.avoidPoints)
            ? options.avoidPoints.filter(Boolean)
            : (options.avoidPoint ? [options.avoidPoint] : []);
        const avoidRadius = Math.max(24, options.avoidRadius || 78);
        const avoidWeight = options.avoidWeight ?? 0.28;

        let score = 0;
        score += this.getSectorUnderuseBonus(snapshot, sectorKey);
        score += this.getSectorNoveltyBonus(snapshot, sectorKey);
        score -= crowdFactor * config.localCrowdPenalty;
        score -= recentSectorPenalty * config.recentSelfReusePenalty;
        score -= edgePressure * config.edgeDiscomfortPenalty;
        score += Math.min(distanceFromCurrent, options.maxDistanceForBonus || 180) / Math.max(60, options.maxDistanceForBonus || 180) * 0.18;
        if (preferredPoint) {
            score += Math.max(0, preferredPointBonus - (preferredDistance / preferredDistanceScale));
        }
        if (avoidPoints.length) {
            for (const avoidPoint of avoidPoints) {
                const avoidDistance = Math.hypot((point.x || 0) - (avoidPoint.x || 0), (point.y || 0) - (avoidPoint.y || 0));
                if (avoidDistance < avoidRadius) {
                    score -= (1 - (avoidDistance / avoidRadius)) * avoidWeight;
                }
            }
        }
        if (options.preferOpenSpace) {
            const blockLoad = sectorKey ? (snapshot?.blockOccupancy.get(sectorKey) || 0) : 0;
            score += Math.max(0, 0.18 - (blockLoad * 0.08));
        }
        if (options.preferShelter && preferredPoint) {
            score += Math.max(0, 0.16 - (preferredDistance / 140));
        }
        score += random(-0.04, 0.04);
        return score;
    }

    findBestButterflyWanderPoint(butterfly, zoneId = this.getEntityZoneId(butterfly, this.getFocusedZoneId()), options = {}) {
        if (!butterfly || !zoneId) return null;
        const config = this.getButterflyDispersalConfig();
        const candidateCount = Math.max(8, options.candidateCount || config.candidateCount);
        const layout = this.getFlowerSectorLayout();
        const snapshot = this.buildZoneLiveSectorSnapshot(zoneId, layout);
        const currentPoint = { x: butterfly.x || 0, y: butterfly.y || 0 };
        const interactionSpace = options.interactionSpace || this.getButterflyInteractionSpace(zoneId, { entity: butterfly });
        let bestPoint = null;
        let bestScore = -Infinity;

        for (let attempt = 0; attempt < candidateCount; attempt += 1) {
            let sampledPoint = null;
            if (options.localHop && attempt < Math.ceil(candidateCount / 2)) {
                const angle = random(TWO_PI);
                const distance = random(
                    options.localHop.min || interactionSpace.localHopMin,
                    options.localHop.max || interactionSpace.localHopMax
                );
                sampledPoint = this.clampPlacementPointInZone(
                    zoneId,
                    currentPoint.x + Math.cos(angle) * distance,
                    currentPoint.y + Math.sin(angle) * distance,
                    interactionSpace.clampPadding
                );
            } else if (options.preferredPoint && attempt < Math.ceil(candidateCount / 3)) {
                sampledPoint = this.clampPlacementPointInZone(
                    zoneId,
                    options.preferredPoint.x + random(-interactionSpace.preferredJitterX, interactionSpace.preferredJitterX),
                    options.preferredPoint.y + random(-interactionSpace.preferredJitterY, interactionSpace.preferredJitterY),
                    interactionSpace.clampPadding
                );
            } else if (attempt < layout.cols * layout.rows) {
                sampledPoint = this.getZoneSectorSamplePoint(zoneId, attempt, layout, {
                    padding: interactionSpace.clampPadding
                });
            } else {
                sampledPoint = this.getRandomPlacementPoint(zoneId, options.padding || interactionSpace.randomPadding);
            }
            if (!sampledPoint) continue;

            const score = this.scoreButterflyWanderPoint(butterfly, zoneId, sampledPoint, snapshot, options);
            if (score > bestScore) {
                bestScore = score;
                bestPoint = sampledPoint;
            }
        }

        return bestPoint
            || this.getRandomPlacementPoint(zoneId, options.padding || interactionSpace.randomPadding)
            || this.getZoneCenter(zoneId);
    }

    countButterfliesTargetingFlower(zoneId, flowerId, ignoreEntityId = null) {
        if (!zoneId || !flowerId) return 0;
        const flower = this.getFlowersInZone(zoneId).find(candidate => candidate?.id === flowerId) || null;
        let count = 0;
        for (const butterfly of this.getButterfliesInZone(zoneId)) {
            if (!butterfly?.id || butterfly.id === ignoreEntityId) continue;
            const targetFlowerId = butterfly?.feeding?.targetFlower?.id
                || butterfly?.currentFeeder?.id
                || butterfly?.targetFlower?.id
                || null;
            const movementTargetsFlower = flower && butterfly?.movement?.targetType === 'goal'
                ? (() => {
                    const targetScreen = gridManager?.isoToScreen?.(butterfly.movement.target.x, butterfly.movement.target.y);
                    return targetScreen
                        ? Math.hypot((targetScreen.x || 0) - flower.x, (targetScreen.y || 0) - flower.y) <= 10
                        : false;
                })()
                : false;
            if (targetFlowerId === flowerId || movementTargetsFlower) {
                count += 1;
            }
        }
        return count;
    }

    chooseBestFlowerForButterfly(butterfly, candidateFlowers = [], options = {}) {
        const zoneId = this.getEntityZoneId(butterfly, this.getFocusedZoneId());
        if (!butterfly || !zoneId || !candidateFlowers.length) return null;
        const snapshot = this.buildZoneLiveSectorSnapshot(zoneId, this.getFlowerSectorLayout());
        const config = this.getButterflyDispersalConfig();
        const feedUrgency = butterfly?.lifeSim?.derived?.behaviorBiases?.feedUrgency || 0;
        let bestFlower = null;
        let bestScore = -Infinity;

        for (const flower of candidateFlowers) {
            if (!flower?.id) continue;
            const sectorKey = this.getZoneSectorKey(zoneId, { x: flower.x, y: flower.y }, snapshot.layout);
            const distance = Math.hypot((flower.x || 0) - (butterfly.x || 0), (flower.y || 0) - (butterfly.y || 0));
            const localCrowd = this.countNearbyButterflies(zoneId, flower, 60, butterfly.id);
            const targetedCount = this.countButterfliesTargetingFlower(zoneId, flower.id, butterfly.id);
            const recentPenalty = this.getEntityRecentAnchorPenalty(butterfly, `flower:${flower.id}`);
            const crowdPenalty = Math.min(1, (localCrowd / 5) * 0.6 + (targetedCount / 3) * 0.4);
            let score = 0;
            score += Math.max(0, 0.72 - (distance / Math.max(100, 160 - (feedUrgency * 40))));
            score += this.getSectorUnderuseBonus(snapshot, sectorKey) * 0.82;
            score += this.getSectorNoveltyBonus(snapshot, sectorKey) * 0.72;
            score -= crowdPenalty * config.localCrowdPenalty;
            score -= Math.min(1, targetedCount / 3) * config.anchorSaturationPenalty;
            score -= recentPenalty * config.recentSelfReusePenalty;
            if (flower.currentFeeder === butterfly) {
                score += 0.18;
            }
            score += random(-0.03, 0.03);
            if (score > bestScore) {
                bestScore = score;
                bestFlower = flower;
            }
        }

        return bestFlower;
    }

    chooseBestBlockForButterfly(butterfly, candidateBlocks = [], options = {}) {
        const zoneId = this.getEntityZoneId(butterfly, this.getFocusedZoneId());
        if (!butterfly || !zoneId || !candidateBlocks.length) return null;
        const snapshot = this.buildZoneLiveSectorSnapshot(zoneId, this.getFlowerSectorLayout());
        const config = this.getButterflyDispersalConfig();
        let bestBlock = null;
        let bestScore = -Infinity;

        for (const block of candidateBlocks) {
            if (!block?.id || block?.carriedById) continue;
            const sectorKey = this.getZoneSectorKey(zoneId, { x: block.x, y: block.y }, snapshot.layout);
            const distance = Math.hypot((block.x || 0) - (butterfly.x || 0), (block.y || 0) - (butterfly.y || 0));
            const localCrowd = this.countNearbyButterflies(zoneId, block, 58, butterfly.id);
            const recentPenalty = this.getEntityRecentAnchorPenalty(butterfly, `block:${block.id}`);
            let score = 0;
            score += Math.max(0, 0.62 - (distance / 150));
            score += this.getSectorUnderuseBonus(snapshot, sectorKey) * 0.8;
            score += this.getSectorNoveltyBonus(snapshot, sectorKey) * 0.68;
            score -= Math.min(1, localCrowd / 4) * config.localCrowdPenalty;
            score -= recentPenalty * config.recentSelfReusePenalty;
            if (options.preferShelter && this.structureSystem?.getPreferredShelterPointForEntity) {
                const shelterPoint = this.structureSystem.getPreferredShelterPointForEntity(butterfly, zoneId);
                if (shelterPoint) {
                    const shelterDistance = Math.hypot((block.x || 0) - shelterPoint.x, (block.y || 0) - shelterPoint.y);
                    score += Math.max(0, 0.18 - (shelterDistance / 160));
                }
            }
            score += random(-0.03, 0.03);
            if (score > bestScore) {
                bestScore = score;
                bestBlock = block;
            }
        }

        return bestBlock;
    }

    findValidButterflySpawnPoint(zoneId = this.getFocusedZoneId(), options = {}) {
        const maxAttempts = options.maxAttempts || 28;
        const interactionSpace = options.interactionSpace || this.getButterflyInteractionSpace(zoneId);
        const minDistance = options.minDistance || interactionSpace.minDistance;
        const butterflies = this.getButterfliesInZone(zoneId);
        const flowers = this.getFlowersInZone(zoneId);
        const layout = this.getFlowerSectorLayout();
        const sectorOccupancy = this.buildZoneSectorOccupancy(zoneId, butterflies, layout);
        let bestPoint = null;
        let bestScore = -Infinity;

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            const sampled = this.getRandomPlacementPoint(zoneId, interactionSpace.randomPadding);
            if (!sampled) continue;
            const point = this.clampPlacementPointInZone(zoneId, sampled.x, sampled.y, interactionSpace.clampPadding);
            let minButterflyDist = Infinity;
            let tooClose = false;

            for (const butterfly of butterflies) {
                const dist = Math.hypot((butterfly.x || 0) - point.x, (butterfly.y || 0) - point.y);
                if (dist < minDistance) {
                    tooClose = true;
                    break;
                }
                minButterflyDist = Math.min(minButterflyDist, dist);
            }
            if (tooClose) continue;

            let minFlowerDist = Infinity;
            for (const flower of flowers) {
                minFlowerDist = Math.min(minFlowerDist, Math.hypot((flower.x || 0) - point.x, (flower.y || 0) - point.y));
            }

            const sectorKey = this.getZoneSectorKey(zoneId, point, layout);
            const sectorLoad = sectorKey ? (sectorOccupancy.get(sectorKey) || 0) : 0;
            const nearbyButterflies = this.countNearbyButterflies(zoneId, point, interactionSpace.nearbyRadius);
            const doorwayPenalty = this.isPointNearZoneDoorway(zoneId, point, interactionSpace.doorwayAvoidRadius) ? 0.5 : 0;
            const score = (Math.min(minButterflyDist, interactionSpace.butterflyDistanceScoreMax) / interactionSpace.butterflyDistanceScoreMax)
                + (Math.min(minFlowerDist, interactionSpace.flowerDistanceScoreMax) / Math.max(1, interactionSpace.flowerDistanceScoreMax * 2))
                + Math.max(0, 0.42 - (sectorLoad * 0.16))
                - (nearbyButterflies * 0.08)
                - doorwayPenalty
                + random(-0.05, 0.05);

            if (score > bestScore) {
                bestScore = score;
                bestPoint = point;
            }
        }

        return bestPoint || this.getRandomPlacementPoint(zoneId, interactionSpace.randomPadding) || this.getZoneCenter(zoneId);
    }

    getInitialImmortalFlowerTarget(zoneId) {
        const butterflyCount = this.getButterfliesInZone(zoneId).length;
        if (butterflyCount >= 10) return 6;
        if (butterflyCount >= 6) return 5;
        if (butterflyCount >= 3) return 3;
        return 1;
    }

    spawnFlowerAt(zoneId, x, y, options = {}) {
        const resolvedZoneId = zoneId || this.getFocusedZoneId();
        if (!resolvedZoneId) return null;

        const zoneFlowers = options.candidateFlowers || this.getFlowersInZone(resolvedZoneId);
        const interactionSpace = options.interactionSpace || this.getFlowerInteractionSpace(resolvedZoneId, {
            flowerType: options.flowerType,
            occupancyState: options.occupancyState || 'normal'
        });
        const preferredPoint = options.preferredPoint
            || (Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null);
        const minDistance = options.minDistance || gameConfig?.entities?.flower?.spawnMinDistance || 40;
        const maxAttempts = options.maxAttempts || 30;
        const exactPoint = !!options.exactPoint;
        const resolvedPoint = exactPoint && preferredPoint
            ? this.clampPlacementPointInZone(resolvedZoneId, preferredPoint.x, preferredPoint.y, interactionSpace.clampPadding)
            : this.findValidFlowerPosition(zoneFlowers, resolvedZoneId, {
                preferredPoint,
                minDistance,
                maxAttempts,
                interactionSpace
            }) || (preferredPoint
                ? this.clampPlacementPointInZone(resolvedZoneId, preferredPoint.x, preferredPoint.y, interactionSpace.clampPadding)
                : null);
        if (!resolvedPoint) return null;

        const flower = new Flower(resolvedPoint.x, resolvedPoint.y, !!options.isImmortal, {
            currentZoneId: resolvedZoneId,
            flowerType: options.flowerType || this.choosePreferredFlowerTypeForZone(resolvedZoneId, zoneFlowers.length),
            persistentUntilConsumed: options.persistentUntilConsumed
        });
        flower.resourceOrigin = options.resourceOrigin || 'wild';
        this.assignEntityToZone(flower, resolvedZoneId);
        this.gameState.flowers.push(flower);
        this.entityManager?.addEntity?.('flowers', flower);
        this.registerEntityWithFoundationSystems(flower, 'flower');
        return flower;
    }

    spawnInitialBlocks(zoneIds = this.getZoneIds()) {
        const blockConfig = gameConfig?.entities?.block || {};
        const blocksPerZone = gameConfig?.entities?.blocksPerZone || 20;
        const blockUnit = this.structureSystem?.getCanonicalBlockUnit?.() || null;

        for (const zoneId of zoneIds || []) {
            const zoneBlocks = [];

            for (let index = 0; index < blocksPerZone; index++) {
                const point = this.findValidBlockSpawnPoint(zoneId, zoneBlocks, {
                    maxAttempts: 36
                }) || this.getRandomPlacementPoint(zoneId, blockUnit?.scatterRandomPadding || 40);
                if (!point) continue;
                const block = new Block(point.x, point.y, {
                    currentZoneId: zoneId,
                    renderWidth: blockConfig.renderWidth || 16,
                    renderHeight: blockConfig.renderHeight || 16
                });
                this.assignEntityToZone(block, zoneId);
                this.gameState.blocks.push(block);
                zoneBlocks.push(block);
                this.entityManager?.addEntity?.('blocks', block);
                this.registerEntityWithFoundationSystems(block, 'block');
            }
        }
    }

    findValidBlockSpawnPoint(zoneId = this.getFocusedZoneId(), existingBlocks = this.getBlocksInZone(zoneId), options = {}) {
        const region = this.getZonePlacementRegion(zoneId);
        if (!region) return null;

        const layout = {
            cols: Math.max(2, options.cols || gameConfig?.entities?.block?.scatterColumns || 4),
            rows: Math.max(2, options.rows || gameConfig?.entities?.block?.scatterRows || 3)
        };
        const maxAttempts = options.maxAttempts || 28;
        const blockFootprint = this.structureSystem?.getEntityMetrics?.({
            renderWidth: gameConfig?.entities?.block?.renderWidth || 20,
            renderHeight: gameConfig?.entities?.block?.renderHeight || 20,
            stackIndex: 0
        }, 'block') || null;
        const blockUnit = this.structureSystem?.getCanonicalBlockUnit?.() || {
            scatterRandomPadding: 34,
            doorwayAvoidRadius: 44,
            blockDistanceScoreMax: 96,
            flowerDistanceScoreMax: 72,
            butterflyDistanceScoreMax: 84,
            clampPadding: 8
        };
        const minDistance = options.minDistance || Math.max((blockFootprint?.width || 20) * 1.8, 28);
        const flowerAvoidRadius = options.minFlowerDistance
            || this.getFlowerBlockPlacementAvoidRadius({
                renderWidth: gameConfig?.entities?.block?.renderWidth || 20,
                renderHeight: gameConfig?.entities?.block?.renderHeight || 20,
                stackIndex: 0
            });
        const sectorOccupancy = this.buildZoneSectorOccupancy(zoneId, existingBlocks, layout);
        const flowers = this.getFlowersInZone(zoneId);
        const butterflies = this.getButterfliesInZone(zoneId);
        let bestPoint = null;
        let bestScore = -Infinity;

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            const sampledPoint = attempt < (layout.cols * layout.rows)
                ? this.getZoneSectorSamplePoint(zoneId, attempt, layout)
                : this.getRandomPlacementPoint(zoneId, blockUnit.scatterRandomPadding);
            if (!sampledPoint) continue;

            const point = this.clampPlacementPointInZone(zoneId, sampledPoint.x, sampledPoint.y, blockUnit.clampPadding);
            if (this.isPointNearZoneDoorway(zoneId, point, blockUnit.doorwayAvoidRadius)) continue;

            let minBlockDist = Infinity;
            let tooClose = false;
            for (const block of existingBlocks) {
                const dist = Math.hypot((block.x || 0) - point.x, (block.y || 0) - point.y);
                if (dist < minDistance) {
                    tooClose = true;
                    break;
                }
                minBlockDist = Math.min(minBlockDist, dist);
            }
            if (tooClose) continue;

            let minFlowerDist = Infinity;
            for (const flower of flowers) {
                minFlowerDist = Math.min(minFlowerDist, Math.hypot((flower.x || 0) - point.x, (flower.y || 0) - point.y));
            }
            if (minFlowerDist < flowerAvoidRadius) continue;

            let minButterflyDist = Infinity;
            for (const butterfly of butterflies) {
                minButterflyDist = Math.min(minButterflyDist, Math.hypot((butterfly.x || 0) - point.x, (butterfly.y || 0) - point.y));
            }

            const sectorKey = this.getZoneSectorKey(zoneId, point, layout);
            const sectorLoad = sectorKey ? (sectorOccupancy.get(sectorKey) || 0) : 0;
            const score = (Math.min(minBlockDist, blockUnit.blockDistanceScoreMax) / blockUnit.blockDistanceScoreMax)
                + Math.max(0, 0.5 - (sectorLoad * 0.2))
                + (Math.min(minFlowerDist, blockUnit.flowerDistanceScoreMax) / 220)
                + (Math.min(minButterflyDist, blockUnit.butterflyDistanceScoreMax) / 260)
                + random(-0.05, 0.05);

            if (score > bestScore) {
                bestScore = score;
                bestPoint = point;
            }
        }

        return bestPoint;
    }

    clampScreenPointToRoamArea(x, y, padding = 0, options = {}) {
        return this.gridManager?.clampScreenPointToRoamArea?.(x, y, padding, options) || { x, y };
    }

    clampPlacementPoint(x, y, padding = 0) {
        return this.clampScreenPointToRoamArea(x, y, padding, {
            edgeInset: this.getPlacementEdgeInset()
        });
    }

    normalizeDoorwayAnchor(anchor, zoneId = null) {
        if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) return null;
        const clamped = this.clampScreenPointToRoamArea(anchor.x, anchor.y, 0, {
            allowDoorways: true,
            edgeInset: 0,
            ...(zoneId ? { zoneId } : {})
        });
        return {
            ...anchor,
            x: clamped?.x ?? anchor.x,
            y: clamped?.y ?? anchor.y
        };
    }

    normalizeDoorwayLane(lane, zoneId = null) {
        if (!lane || !Number.isFinite(lane.y)) return null;
        const region = zoneId ? this.getZonePlacementRegion(zoneId) : null;
        if (!region) {
            return {
                ...lane
            };
        }
        const margin = 18;
        const rawMinX = Number.isFinite(lane.minX) ? lane.minX : region.minX + margin;
        const rawMaxX = Number.isFinite(lane.maxX) ? lane.maxX : region.maxX - margin;
        const minX = constrain(rawMinX, region.minX + margin, region.maxX - margin);
        const maxX = constrain(rawMaxX, minX, region.maxX - margin);
        return {
            ...lane,
            minX,
            maxX,
            y: constrain(lane.y, region.minY + 12, region.maxY - 12)
        };
    }

    getZoneDoorwayAnchor(zoneId, targetZoneId = null, fallbackDirection = 'right') {
        const doorways = gameConfig?.world?.doorways || [];
        if (!zoneId) return null;

        if (targetZoneId) {
            for (const doorway of doorways) {
                if (doorway.fromZoneId === zoneId && doorway.toZoneId === targetZoneId && doorway.fromAnchor) {
                    return this.normalizeDoorwayAnchor(doorway.fromAnchor, zoneId);
                }
                if (doorway.toZoneId === zoneId && doorway.fromZoneId === targetZoneId && doorway.toAnchor) {
                    return this.normalizeDoorwayAnchor(doorway.toAnchor, zoneId);
                }
            }
        }

        const matching = doorways.find(doorway => doorway.fromZoneId === zoneId && doorway.fromAnchor?.direction === fallbackDirection)
            || doorways.find(doorway => doorway.toZoneId === zoneId && doorway.toAnchor?.direction === fallbackDirection)
            || doorways.find(doorway => doorway.fromZoneId === zoneId && doorway.fromAnchor)
            || doorways.find(doorway => doorway.toZoneId === zoneId && doorway.toAnchor);

        if (!matching) return null;
        if (matching.fromZoneId === zoneId && matching.fromAnchor) {
            return this.normalizeDoorwayAnchor(matching.fromAnchor, zoneId);
        }
        if (matching.toZoneId === zoneId && matching.toAnchor) {
            return this.normalizeDoorwayAnchor(matching.toAnchor, zoneId);
        }
        return null;
    }

    getZoneDoorwayTravelProfile(zoneId, targetZoneId = null, fallbackDirection = 'right') {
        const doorways = gameConfig?.world?.doorways || [];
        if (!zoneId) return null;

        let matching = null;
        if (targetZoneId) {
            matching = doorways.find(doorway =>
                doorway.fromZoneId === zoneId
                && doorway.toZoneId === targetZoneId
                && doorway.fromAnchor
                && doorway.toAnchor
            ) || null;
        }

        if (!matching) {
            matching =
                doorways.find(doorway => doorway.fromZoneId === zoneId && doorway.fromAnchor?.direction === fallbackDirection && doorway.toAnchor)
                || doorways.find(doorway => doorway.fromZoneId === zoneId && doorway.fromAnchor && doorway.toAnchor)
                || null;
        }

        if (!matching) return null;
        const visibleAnchor = this.normalizeDoorwayAnchor(matching.fromAnchor, zoneId);
        const coverAnchor = this.normalizeDoorwayAnchor(matching.coverAnchor, zoneId)
            || this.normalizeDoorwayAnchor(matching.fromAnchor, zoneId);
        const warpAnchor = this.normalizeDoorwayAnchor(matching.toAnchor, zoneId);
        if (!visibleAnchor || !warpAnchor) return null;

        return {
            doorwayId: matching.id || null,
            direction: visibleAnchor.direction || warpAnchor.direction || fallbackDirection,
            visibleAnchor,
            coverAnchor,
            warpAnchor,
            approachLane: this.normalizeDoorwayLane(matching.approachLane, zoneId),
            lineupAnchor: this.normalizeDoorwayAnchor(matching.lineupAnchor, zoneId),
            settleAnchor: this.normalizeDoorwayAnchor(matching.settleAnchor, zoneId)
        };
    }

    getOppositeDoorwayDirection(direction = 'right') {
        return direction === 'left' ? 'right' : 'left';
    }

    buildZoneTravelRoute(sourceZoneId, targetZoneId = null, fallbackDirection = 'right') {
        if (!sourceZoneId) return null;

        const departureProfile = this.getZoneDoorwayTravelProfile(sourceZoneId, targetZoneId, fallbackDirection)
            || this.getZoneDoorwayTravelProfile(sourceZoneId, null, fallbackDirection)
            || this.getZoneDoorwayTravelProfile(sourceZoneId);
        if (!departureProfile?.visibleAnchor || !departureProfile?.warpAnchor) return null;

        let arrivalVisibleAnchor = departureProfile.visibleAnchor;
        let arrivalCoverAnchor = departureProfile.coverAnchor || departureProfile.visibleAnchor;
        let arrivalWarpAnchor = departureProfile.warpAnchor;
        let arrivalApproachLane = departureProfile.approachLane || null;
        let arrivalLineupAnchor = departureProfile.lineupAnchor || null;
        let arrivalSettleAnchor = departureProfile.settleAnchor || null;

        if (targetZoneId) {
            const arrivalFallbackDirection = this.getOppositeDoorwayDirection(departureProfile.direction || fallbackDirection);
            const arrivalProfile = this.getZoneDoorwayTravelProfile(targetZoneId, sourceZoneId, arrivalFallbackDirection)
                || this.getZoneDoorwayTravelProfile(targetZoneId, null, arrivalFallbackDirection)
                || this.getZoneDoorwayTravelProfile(targetZoneId);
            arrivalVisibleAnchor = arrivalProfile?.visibleAnchor
                || this.getZoneDoorwayAnchor(targetZoneId, sourceZoneId, arrivalFallbackDirection)
                || this.getZoneDoorwayAnchor(targetZoneId, null, arrivalFallbackDirection)
                || departureProfile.visibleAnchor;
            arrivalCoverAnchor = arrivalProfile?.coverAnchor
                || arrivalVisibleAnchor
                || departureProfile.coverAnchor
                || departureProfile.visibleAnchor;
            arrivalWarpAnchor = arrivalProfile?.warpAnchor
                || arrivalVisibleAnchor
                || departureProfile.warpAnchor;
            arrivalApproachLane = arrivalProfile?.approachLane || null;
            arrivalLineupAnchor = arrivalProfile?.lineupAnchor || null;
            arrivalSettleAnchor = arrivalProfile?.settleAnchor || null;
        }

        return {
            direction: departureProfile.direction || fallbackDirection,
            departureVisibleAnchor: departureProfile.visibleAnchor,
            departureCoverAnchor: departureProfile.coverAnchor || departureProfile.visibleAnchor,
            departureWarpAnchor: departureProfile.warpAnchor,
            departureApproachLane: departureProfile.approachLane || null,
            departureLineupAnchor: departureProfile.lineupAnchor || null,
            arrivalVisibleAnchor,
            arrivalCoverAnchor,
            arrivalWarpAnchor,
            arrivalApproachLane,
            arrivalLineupAnchor,
            arrivalSettleAnchor
        };
    }

    buildZoneTravelApproachAnchor(zoneId, originPoint, visibleAnchor, direction = 'right', travelProfile = null) {
        if (!zoneId || !visibleAnchor || !originPoint) return null;

        const region = this.getZonePlacementRegion(zoneId);
        if (!region) return null;

        const explicitLane = this.normalizeDoorwayLane(travelProfile?.approachLane, zoneId);
        if (explicitLane) {
            const preferredX = constrain(
                originPoint.x,
                explicitLane.minX ?? (region.minX + 24),
                explicitLane.maxX ?? (region.maxX - 24)
            );
            const clamped = this.clampPlacementPointInZone(zoneId, preferredX, explicitLane.y, 8, {
                allowDoorways: true
            });
            if (clamped) {
                return {
                    x: clamped.x,
                    y: clamped.y,
                    direction
                };
            }
        }

        const laneMarginX = 24;
        const laneDepthByDirection = {
            left: 28,
            right: 28,
            top: 28,
            bottom: -28
        };
        const laneDepth = laneDepthByDirection[direction] ?? 52;
        const preferredX = constrain(originPoint.x, region.minX + laneMarginX, region.maxX - laneMarginX);
        const preferredY = constrain(visibleAnchor.y + laneDepth, region.minY + 18, region.maxY - 18);
        const clamped = this.clampPlacementPointInZone(zoneId, preferredX, preferredY, 8, {
            allowDoorways: true
        });
        if (!clamped) return null;
        return {
            x: clamped.x,
            y: clamped.y,
            direction
        };
    }

    buildZoneTravelLineupAnchor(zoneId, approachAnchor, visibleAnchor, direction = 'right', travelProfile = null) {
        if (!zoneId || !visibleAnchor) return null;

        const region = this.getZonePlacementRegion(zoneId);
        if (!region) return null;

        const explicitAnchor = this.normalizeDoorwayAnchor(travelProfile?.lineupAnchor, zoneId);
        if (explicitAnchor) {
            return explicitAnchor;
        }

        const horizontalOffset = {
            left: 38,
            right: -38,
            top: 0,
            bottom: 0
        }[direction] ?? -38;
        const lineupX = constrain(visibleAnchor.x + horizontalOffset, region.minX + 24, region.maxX - 24);
        const lineupY = constrain(
            approachAnchor?.y ?? (visibleAnchor.y + 22),
            region.minY + 18,
            region.maxY - 18
        );
        const clamped = this.clampPlacementPointInZone(zoneId, lineupX, lineupY, 8, {
            allowDoorways: true
        });
        if (!clamped) return null;
        return {
            x: clamped.x,
            y: clamped.y,
            direction
        };
    }

    seedZoneTravelRecoveryMovement(butterfly, zoneTravel) {
        if (!butterfly?.movement?.setTarget || !zoneTravel?.targetZoneId || !this.gridManager?.screenToIso) {
            return false;
        }

        const origin = zoneTravel.arrivalTarget
            || zoneTravel.arrivalSettleAnchor
            || zoneTravel.arrivalVisibleAnchor
            || { x: butterfly.x, y: butterfly.y, direction: zoneTravel.direction || 'right' };
        const localOffset = {
            left: { x: 6, y: 22 },
            right: { x: -6, y: 22 },
            top: { x: 0, y: 18 },
            bottom: { x: 0, y: -18 }
        }[origin.direction || 'right'] || { x: -6, y: 22 };
        const localX = origin.x + localOffset.x + random(-18, 18);
        const localY = origin.y + localOffset.y + random(-14, 14);
        const clamped = this.clampPlacementPointInZone(zoneTravel.targetZoneId, localX, localY, 8, {
            allowDoorways: true
        }) || origin;
        const targetGrid = this.gridManager.screenToIso(clamped.x, clamped.y);
        butterfly.movement.setTarget(targetGrid.x, targetGrid.y, 'meander', 1, 0.06);
        if (butterfly.timers?.wander) {
            butterfly.timers.wander.current = 0;
            butterfly.timers.wander.duration = Math.max(butterfly.timers.wander.duration || 0, 180);
        }
        return true;
    }

    getZoneDoorwayAnchors(zoneId) {
        if (!zoneId) return [];
        const anchors = [];
        const seen = new Set();
        for (const doorway of gameConfig?.world?.doorways || []) {
            const maybePush = (anchor) => {
                if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) return;
                const normalized = this.normalizeDoorwayAnchor(anchor, zoneId) || anchor;
                const key = `${Math.round(normalized.x)}:${Math.round(normalized.y)}:${normalized.direction || 'none'}`;
                if (seen.has(key)) return;
                seen.add(key);
                anchors.push(normalized);
            };
            if (doorway.fromZoneId === zoneId) {
                maybePush(doorway.fromAnchor);
            }
            if (doorway.toZoneId === zoneId) {
                maybePush(doorway.toAnchor);
            }
        }
        return anchors;
    }

    isPointNearZoneDoorway(zoneId, point, radius = 40) {
        if (!zoneId || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
        for (const anchor of this.getZoneDoorwayAnchors(zoneId)) {
            if (Math.hypot((anchor.x || 0) - point.x, (anchor.y || 0) - point.y) <= radius) {
                return true;
            }
        }
        return false;
    }

    shouldAllowDoorwayTraversalForButterfly(butterfly, options = {}) {
        if (!butterfly?.id) return false;
        if (butterfly.zoneTravel) return true;

        const zoneId = options.zoneId || this.getEntityZoneId(butterfly, null);
        if (!zoneId) return false;

        const currentPoint = options.currentPoint || {
            x: butterfly.x || 0,
            y: (butterfly.y || 0) + (butterfly.shadowOffset || 0)
        };
        const points = [
            currentPoint,
            options.targetPoint || null,
            options.candidatePoint || null
        ].filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y));

        if (!points.length) return false;

        if (points.some(point => this.gridManager?.isPointInDoorwayAvoidanceZone?.(point))) {
            return true;
        }

        const doorwayRadius = Number.isFinite(options.doorwayRadius) ? options.doorwayRadius : 42;
        return points.some(point => this.isPointNearZoneDoorway(zoneId, point, doorwayRadius));
    }

    getZoneCounts(entityType = 'butterflies') {
        const snapshot = this.getZonePopulationSnapshot();
        return Object.fromEntries(
            Object.entries(snapshot).map(([zoneId, counts]) => [zoneId, counts?.[entityType] || 0])
        );
    }

    collectZoneEcologyInputs(zoneIds = this.getZoneIds()) {
        const snapshot = this.getZonePopulationSnapshot();
        const zoneFlowersByZone = {};
        const zoneBlocksByZone = {};

        for (const zoneId of zoneIds) {
            zoneFlowersByZone[zoneId] = this.getFlowersInZone(zoneId);
            zoneBlocksByZone[zoneId] = this.getBlocksInZone(zoneId);
        }

        return {
            snapshot,
            zoneFlowersByZone,
            zoneBlocksByZone
        };
    }

    getZoneEcologySummary(zoneId, options = {}) {
        if (!zoneId || !this.zoneSystem?.getZoneEcologySummary) return null;
        const snapshot = options.snapshot || this.getZonePopulationSnapshot();
        const stats = options.stats || snapshot[zoneId] || {};
        const zoneFlowers = options.zoneFlowers || options.zoneFlowersByZone?.[zoneId] || this.getFlowersInZone(zoneId);
        const zoneBlocks = options.zoneBlocks || options.zoneBlocksByZone?.[zoneId] || this.getBlocksInZone(zoneId);
        return this.zoneSystem.getZoneEcologySummary(zoneId, {
            stats,
            butterflyCount: stats.butterflies || 0,
            flowerCount: zoneFlowers.length,
            blockCount: zoneBlocks.length,
            residentButterflies: stats.residentButterflies || 0,
            wildButterflies: stats.wildButterflies || 0,
            currentFrame: Number.isFinite(options.currentFrame)
                ? Math.max(0, Math.round(options.currentFrame))
                : (typeof frameCount === 'number' ? frameCount : 0)
        });
    }

    updateZoneResourceLoop(zoneIds = this.getZoneIds(), options = {}) {
        if (!this.zoneSystem?.setZoneEcologyState || !zoneIds.length) return null;
        const context = options.context || this.collectZoneEcologyInputs(zoneIds);
        const smoothing = Number.isFinite(options.smoothing) ? options.smoothing : 0.08;
        const currentFrame = Number.isFinite(options.currentFrame)
            ? Math.max(0, Math.round(options.currentFrame))
            : (typeof frameCount === 'number' ? frameCount : 0);
        const cadenceIntervalFrames = Math.max(1, Math.round(options.cadenceIntervalFrames || 1));

        for (const zoneId of zoneIds) {
            const profile = this.getZoneEcologyProfile(zoneId) || {};
            const actionBiases = profile.actionBiases || {};
            const currentState = this.zoneSystem.getZoneEcologyState?.(zoneId) || {};
            const cadenceOffset = Math.max(0, Math.round(
                options.cadenceOffsetsByZone?.[zoneId]
                ?? currentState.cadenceOffset
                ?? 0
            ));
            const stats = context.snapshot?.[zoneId] || {};
            const zoneFlowers = context.zoneFlowersByZone?.[zoneId] || this.getFlowersInZone(zoneId);
            const normalFlowers = zoneFlowers.filter(flower => flower && flower.stage !== 'dissolve' && flower.occupancyState === 'normal');
            const occupiedFlowers = zoneFlowers.filter(flower => flower && flower.stage !== 'dissolve' && flower.occupancyState !== 'normal');
            const butterflyDemand = this.clampUnit((stats.butterflies || 0) / 5);
            const visibleSupply = this.clampUnit(normalFlowers.length / 6);
            const occupiedPressure = this.clampUnit(occupiedFlowers.length / 3);
            const rest = this.clampUnit(actionBiases.rest || 0);
            const social = this.clampUnit(actionBiases.social || 0);
            const caregiving = this.clampUnit(actionBiases.caregiving || 0);
            const exploration = this.clampUnit(actionBiases.exploration || 0);
            const baseFloor = this.clampUnit(0.18 + (rest * 0.1) + (social * 0.05) + (caregiving * 0.05) + (exploration * 0.03));
            const habitatQualityTarget = this.clampUnit(
                0.24
                + ((currentState.resourceReserve ?? 0.5) * 0.32)
                + (visibleSupply * 0.18)
                + ((currentState.shelterCapacity ?? 0.5) * 0.08)
                - ((currentState.crowdingPressure ?? 0.18) * 0.12)
                - ((currentState.depletionPressure ?? 0.08) * 0.16)
                + (occupiedPressure * 0.04)
            );
            const recoveryFloorTarget = this.clampUnit(Math.max(baseFloor, 0.16 + (habitatQualityTarget * 0.24)));
            const consumptionPressureTarget = this.clampUnit(
                ((currentState.consumptionPressure ?? 0) * 0.92)
                + (occupiedPressure * 0.04)
            );
            const depletionPressureTarget = this.clampUnit(
                ((currentState.depletionPressure ?? 0.08) * 0.88)
                + (((currentState.consumptionPressure ?? 0) + consumptionPressureTarget) * 0.12)
                + Math.max(0, butterflyDemand - visibleSupply) * 0.08
            );
            const resourceReserveTarget = this.clampUnit(Math.max(
                recoveryFloorTarget,
                ((currentState.resourceReserve ?? 0.5) * 0.82)
                + (recoveryFloorTarget * 0.18)
                + (habitatQualityTarget * 0.14)
                + (visibleSupply * 0.08)
                - (depletionPressureTarget * 0.12)
                - (consumptionPressureTarget * 0.08)
            ));
            const smoothValue = (key, target) => {
                const current = this.clampUnit(currentState?.[key] ?? target);
                return this.clampUnit(current + ((target - current) * smoothing));
            };

            this.zoneSystem.setZoneEcologyState(zoneId, {
                resourceReserve: smoothValue('resourceReserve', resourceReserveTarget),
                habitatQuality: smoothValue('habitatQuality', habitatQualityTarget),
                depletionPressure: smoothValue('depletionPressure', depletionPressureTarget),
                recoveryFloor: smoothValue('recoveryFloor', recoveryFloorTarget),
                consumptionPressure: smoothValue('consumptionPressure', consumptionPressureTarget),
                lastUpdatedFrame: currentFrame,
                cadenceIntervalFrames,
                cadenceOffset
            });
        }

        return context;
    }

    recordZoneFlowerConsumption(zoneId, flower = null) {
        if (!zoneId || !this.zoneSystem?.getZoneEcologyState || !this.zoneSystem?.setZoneEcologyState) return null;
        const currentState = this.zoneSystem.getZoneEcologyState(zoneId) || {};
        const recoveryFloor = currentState.recoveryFloor ?? 0.22;
        const consumptionWeight = flower?.isImmortal ? 0.12 : 0.16;
        return this.zoneSystem.setZoneEcologyState(zoneId, {
            resourceReserve: this.clampUnit(Math.max(recoveryFloor, (currentState.resourceReserve ?? 0.5) - consumptionWeight)),
            habitatQuality: this.clampUnit((currentState.habitatQuality ?? 0.5) - (consumptionWeight * 0.28)),
            depletionPressure: this.clampUnit((currentState.depletionPressure ?? 0.08) + (consumptionWeight * 0.72)),
            consumptionPressure: this.clampUnit((currentState.consumptionPressure ?? 0) + (consumptionWeight * 0.9)),
            lastFlowerConsumptionFrame: typeof frameCount === 'number' ? frameCount : 0
        });
    }

    recordZoneFlowerSpawn(zoneId, options = {}) {
        if (!zoneId || !this.zoneSystem?.getZoneEcologyState || !this.zoneSystem?.setZoneEcologyState) return null;
        const currentState = this.zoneSystem.getZoneEcologyState(zoneId) || {};
        const recoveryFloor = currentState.recoveryFloor ?? 0.22;
        const spawnCost = options.emergency ? 0.03 : 0.05;
        return this.zoneSystem.setZoneEcologyState(zoneId, {
            resourceReserve: this.clampUnit(Math.max(recoveryFloor, (currentState.resourceReserve ?? 0.5) - spawnCost)),
            depletionPressure: this.clampUnit(Math.max(0, (currentState.depletionPressure ?? 0.08) - (options.emergency ? 0.05 : 0.02))),
            consumptionPressure: this.clampUnit(Math.max(0, (currentState.consumptionPressure ?? 0) - 0.04)),
            lastUpdatedFrame: typeof frameCount === 'number' ? frameCount : 0
        });
    }

    getZoneFlowerSpawnTargets(zoneId, options = {}) {
        const state = this.zoneSystem?.getZoneEcologyState?.(zoneId) || {};
        const butterflies = options.butterflies
            || (options.snapshot?.[zoneId]?.butterflies != null
                ? new Array(options.snapshot[zoneId].butterflies).fill(null)
                : this.getButterfliesInZone(zoneId));
        const flowers = options.flowers || this.getFlowersInZone(zoneId);
        const normalFlowers = flowers.filter(flower => flower && flower.stage !== 'dissolve' && flower.occupancyState === 'normal');
        const butterflyCount = Array.isArray(butterflies) ? butterflies.length : (butterflies || 0);
        const floorTarget = Math.max(1, Math.min(3,
            1
            + (butterflyCount >= 2 ? 1 : 0)
            + (butterflyCount >= 6 && (state.habitatQuality ?? 0.5) >= 0.78 ? 1 : 0)
        ));
        const qualityBonus = (state.habitatQuality ?? 0.5) >= 0.72 ? 1 : 0;
        const reserveBonus = (state.resourceReserve ?? 0.5) >= 0.7 ? 1 : 0;
        const demandTarget = Math.ceil(Math.max(1, butterflyCount) * 0.35);
        const minNormalFlowers = Math.max(floorTarget, Math.min(7, demandTarget + 1 + qualityBonus + reserveBonus));
        const maxNormalFlowers = Math.max(minNormalFlowers, Math.min(9, minNormalFlowers + 2 + ((state.habitatQuality ?? 0.5) >= 0.8 ? 1 : 0)));
        const recoveryChance = this.clampUnit(0.12 + ((state.habitatQuality ?? 0.5) * 0.2) + ((state.resourceReserve ?? 0.5) * 0.16) - ((state.depletionPressure ?? 0.08) * 0.18));
        return {
            floorTarget,
            minNormalFlowers,
            maxNormalFlowers,
            recoveryChance,
            normalFlowerCount: normalFlowers.length
        };
    }

    calculateZoneEcologyState(zoneId, context = {}) {
        const zone = this.getZoneConfig(zoneId) || {};
        const profile = this.getZoneEcologyProfile(zoneId);
        const actionBiases = profile?.actionBiases || {};
        const stats = context.snapshot?.[zoneId] || {
            butterflies: 0,
            flowers: 0,
            blocks: 0,
            residentButterflies: 0,
            wildButterflies: 0
        };
        const zoneFlowers = context.zoneFlowersByZone?.[zoneId] || this.getFlowersInZone(zoneId);
        const zoneBlocks = context.zoneBlocksByZone?.[zoneId] || this.getBlocksInZone(zoneId);
        const currentState = this.zoneSystem?.getZoneEcologyState?.(zoneId) || {};
        const currentFrame = Number.isFinite(context.currentFrame)
            ? Math.max(0, Math.round(context.currentFrame))
            : (typeof frameCount === 'number' ? frameCount : 0);
        const cadenceIntervalFrames = Math.max(1, Math.round(context.cadenceIntervalFrames || currentState.cadenceIntervalFrames || 1));
        const cadenceOffset = Math.max(0, Math.round(
            context.cadenceOffsetsByZone?.[zoneId]
            ?? currentState.cadenceOffset
            ?? 0
        ));
        const communicationStyle = profile?.communicationStyle || '';
        const social = this.clampUnit(actionBiases.social || 0);
        const teaching = this.clampUnit(actionBiases.teaching || 0);
        const exploration = this.clampUnit(actionBiases.exploration || 0);
        const rest = this.clampUnit(actionBiases.rest || 0);
        const objectUse = this.clampUnit(actionBiases.objectUse || 0);
        const vigilance = this.clampUnit(actionBiases.vigilance || 0);
        const training = this.clampUnit(actionBiases.training || 0);
        const status = this.clampUnit(actionBiases.status || 0);
        const caregiving = this.clampUnit(actionBiases.caregiving || 0);
        const preferredFlowerTypes = profile?.preferredFlowerTypes || [];
        const accessibleFlowers = zoneFlowers.filter(flower =>
            flower &&
            flower.stage !== 'dissolve' &&
            flower.occupancyState === 'normal'
        );
        const matchingFlowers = accessibleFlowers.filter(flower => preferredFlowerTypes.includes(flower?.flowerType));
        const openBlocks = zoneBlocks.filter(block => block && !block.carriedById);
        const butterflyCount = stats.butterflies || 0;
        const resourceReserve = this.clampUnit(currentState.resourceReserve ?? 0.5);
        const habitatQuality = this.clampUnit(currentState.habitatQuality ?? 0.5);
        const depletionPressure = this.clampUnit(currentState.depletionPressure ?? 0.08);
        const flowerDensity = this.clampUnit(accessibleFlowers.length / 6);
        const matchingFlowerDensity = this.clampUnit(matchingFlowers.length / 3);
        const shelterDensity = this.clampUnit(openBlocks.length / 5);
        const residentRatio = butterflyCount > 0
            ? (stats.residentButterflies || 0) / butterflyCount
            : (currentState.residentRatio ?? 0.5);
        const wildRatio = butterflyCount > 0
            ? (stats.wildButterflies || 0) / butterflyCount
            : (currentState.wildRatio ?? 0.5);
        const crowdingBaseline = 2.6 + (social * 0.9) + (exploration * 0.75) + (training * 0.65) + (zone.kind === 'training' ? 0.45 : 0);
        const crowdingLoad = this.clampUnit((butterflyCount - crowdingBaseline) / Math.max(2.6, crowdingBaseline + 1.8));
        const foodRichnessTarget = this.clampUnit(0.12 + (flowerDensity * 0.26) + (matchingFlowerDensity * 0.2) + (resourceReserve * 0.22) + (habitatQuality * 0.12) + (rest * 0.08) + (caregiving * 0.05) - (depletionPressure * 0.2));
        const shelterCapacityTarget = this.clampUnit(0.16 + (shelterDensity * 0.42) + (objectUse * 0.14) + (vigilance * 0.12) + (rest * 0.08) + (habitatQuality * 0.06));
        const crowdingToleranceTarget = this.clampUnit(0.3 + (social * 0.14) + (exploration * 0.12) + (training * 0.08) + (shelterDensity * 0.08) - (vigilance * 0.04));
        const crowdingPressureTarget = this.clampUnit((crowdingLoad * 0.58) + Math.max(0, crowdingLoad - crowdingToleranceTarget) * 0.28);
        const socialStyleBias = communicationStyle === 'open-land-calm'
            ? 0.06
            : communicationStyle === 'open-land-echoing'
                ? 0.03
                : communicationStyle === 'loud-training'
                    ? -0.03
                    : -0.01;
        const socialValenceTarget = this.clampUnit(0.1 + socialStyleBias + (social * 0.44) + (teaching * 0.12) + (caregiving * 0.08) + ((1 - crowdingPressureTarget) * 0.08) + (residentRatio * 0.06) - (depletionPressure * 0.06));
        const trainingValenceTarget = this.clampUnit(0.08 + (training * 0.5) + (teaching * 0.18) + (status * 0.12) + (objectUse * 0.08) + (shelterDensity * 0.06));
        const recoveryStyleBias = communicationStyle === 'open-land-calm'
            ? 0.08
            : communicationStyle === 'loud-training'
                ? -0.04
                : communicationStyle === 'open-land-watchful'
                    ? 0.02
                    : 0;
        const recoveryPressureTarget = this.clampUnit(0.08 + recoveryStyleBias + (rest * 0.42) + (shelterCapacityTarget * 0.18) + (foodRichnessTarget * 0.16) + (habitatQuality * 0.1) + (resourceReserve * 0.08) - (training * 0.06) - (crowdingPressureTarget * 0.08) - (depletionPressure * 0.12));
        const migrationStyleBias = communicationStyle === 'open-land-echoing'
            ? 0.08
            : communicationStyle === 'open-land-calm'
                ? -0.06
                : communicationStyle === 'loud-training'
                    ? -0.02
                    : 0.02;
        const migrationPullTarget = this.clampUnit(0.08 + migrationStyleBias + (exploration * 0.46) + (crowdingPressureTarget * 0.12) + ((1 - foodRichnessTarget) * 0.06) + (wildRatio * 0.04) + (depletionPressure * 0.12) - (habitatQuality * 0.08));
        const smoothing = Number.isFinite(context.smoothing) ? context.smoothing : 0.2;
        const smoothValue = (key, target) => {
            const current = this.clampUnit(currentState?.[key] ?? target);
            return this.clampUnit(current + ((target - current) * smoothing));
        };

        return {
            foodRichness: smoothValue('foodRichness', foodRichnessTarget),
            shelterCapacity: smoothValue('shelterCapacity', shelterCapacityTarget),
            crowdingTolerance: smoothValue('crowdingTolerance', crowdingToleranceTarget),
            crowdingPressure: smoothValue('crowdingPressure', crowdingPressureTarget),
            migrationPull: smoothValue('migrationPull', migrationPullTarget),
            socialValence: smoothValue('socialValence', socialValenceTarget),
            trainingValence: smoothValue('trainingValence', trainingValenceTarget),
            recoveryPressure: smoothValue('recoveryPressure', recoveryPressureTarget),
            residentRatio,
            wildRatio,
            lastUpdatedFrame: currentFrame,
            cadenceIntervalFrames,
            cadenceOffset
        };
    }

    refreshZonePressureState(zoneIds = this.getZoneIds(), options = {}) {
        if (!this.zoneSystem?.setZoneEcologyState || !zoneIds.length) {
            return {
                snapshot: options.context?.snapshot || this.getZonePopulationSnapshot(),
                zoneFlowersByZone: options.context?.zoneFlowersByZone || {},
                zoneBlocksByZone: options.context?.zoneBlocksByZone || {},
                zoneEcologyByZone: {}
            };
        }

        const context = options.context || this.collectZoneEcologyInputs(zoneIds);
        const zoneEcologyByZone = {};

        for (const zoneId of zoneIds) {
            const nextState = this.calculateZoneEcologyState(zoneId, {
                ...context,
                smoothing: options.smoothing,
                currentFrame: options.currentFrame,
                cadenceIntervalFrames: options.cadenceIntervalFrames,
                cadenceOffsetsByZone: options.cadenceOffsetsByZone
            });
            this.zoneSystem.setZoneEcologyState(zoneId, nextState);
            zoneEcologyByZone[zoneId] = this.getZoneEcologySummary(zoneId, {
                snapshot: context.snapshot,
                zoneFlowersByZone: context.zoneFlowersByZone,
                zoneBlocksByZone: context.zoneBlocksByZone,
                currentFrame: options.currentFrame
            });
        }

        return {
            ...context,
            zoneEcologyByZone
        };
    }

    buildZoneTravelScoringContext(zoneIds = this.getZoneIds()) {
        const context = this.collectZoneEcologyInputs(zoneIds);
        this.updateZoneResourceLoop(zoneIds, { context });
        return this.refreshZonePressureState(zoneIds, { context });
    }

    scoreButterflyForZone(butterfly, zoneId, options = {}) {
        const profile = this.getZoneEcologyProfile(zoneId);
        if (!butterfly || !zoneId) return 0;
        const zone = this.getZoneConfig(zoneId) || {};
        const migrationBalance = this.getMigrationBalance();
        const snapshot = options.snapshot || this.getZonePopulationSnapshot();
        const currentZoneId = options.currentZoneId || this.getEntityZoneId(butterfly, null);
        const currentProfile = currentZoneId ? this.getZoneEcologyProfile(currentZoneId) : {};
        const currentStats = currentZoneId ? snapshot[currentZoneId] : null;
        const stats = snapshot[zoneId] || {
            butterflies: 0,
            flowers: 0,
            caterpillars: 0,
            blocks: 0,
            residentButterflies: 0,
            wildButterflies: 0
        };
        const zoneFlowers = options.zoneFlowersByZone?.[zoneId] || this.getFlowersInZone(zoneId);
        const zoneBlocks = options.zoneBlocksByZone?.[zoneId] || this.getBlocksInZone(zoneId);
        const zoneEcology = options.zoneEcologyByZone?.[zoneId] || this.getZoneEcologySummary(zoneId, {
            snapshot,
            zoneFlowers,
            zoneBlocks,
            stats
        });
        const currentZoneEcology = currentZoneId
            ? (options.zoneEcologyByZone?.[currentZoneId] || this.getZoneEcologySummary(currentZoneId, {
                snapshot,
                zoneFlowers: options.zoneFlowersByZone?.[currentZoneId] || this.getFlowersInZone(currentZoneId),
                zoneBlocks: options.zoneBlocksByZone?.[currentZoneId] || this.getBlocksInZone(currentZoneId),
                stats: currentStats || {}
            }))
            : null;
        const behaviorBiases = butterfly.lifeSim?.derived?.behaviorBiases || {};
        const migrationState = butterfly.lifeSim?.migration || {};
        const migrationDerived = butterfly.lifeSim?.derived?.migration || {};
        const emotions = butterfly.lifeSim?.emotions || {};
        const social = butterfly.lifeSim?.social || {};
        const wanderScale = behaviorBiases.wanderScale || 0;
        const feedUrgency = behaviorBiases.feedUrgency || 0;
        const socialConfidence = behaviorBiases.socialConfidence || social.confidence || 0;
        const caution = behaviorBiases.caution || 0;
        const trainingAffinity = behaviorBiases.trainingAffinity || 0;
        const objectInterest = behaviorBiases.objectInterest || 0;
        const battleAggression = behaviorBiases.battleAggression || 0;
        const displayConfidence = behaviorBiases.displayConfidence || 0;
        const travelUrgency = behaviorBiases.migrationUrgency || migrationDerived.travelUrgency || 0;
        const returnHomeBias = behaviorBiases.returnHomeBias || migrationDerived.returnHomeBias || 0;
        const noveltySeeking = behaviorBiases.noveltySeeking || migrationDerived.noveltySeeking || 0;
        const mateSeeking = behaviorBiases.mateSeeking || migrationDerived.mateSeeking || 0;
        const overcrowdingEscape = behaviorBiases.overcrowdingEscape || migrationDerived.overcrowdingEscape || 0;
        const homeAffinity = behaviorBiases.homeAffinity || migrationDerived.homeZoneStrength || migrationState.homeZoneStrength || 0;
        const exhaustion = emotions.exhaustion || 0;
        const threat = emotions.threat || 0;
        const curiosity = emotions.curiosity || 0;
        const homeZoneId = migrationDerived.homeZoneId || migrationState.homeZoneId || null;
        const scoutTargetZoneId = migrationDerived.scoutTargetZoneId || null;
        const preferredMateZoneId = migrationDerived.preferredMateZoneId || null;
        const travelTargetZoneId = migrationDerived.travelTargetZoneId || null;
        const targetZoneAffinity = this.clampUnit(migrationState.zoneAffinities?.[zoneId] || 0);
        const currentZoneAffinity = currentZoneId ? this.clampUnit(migrationState.zoneAffinities?.[currentZoneId] || 0) : 0;
        const zoneMateOpportunities = migrationDerived.zoneMateOpportunities || {};
        const mateOpportunity = Math.max(0, zoneMateOpportunities?.[zoneId] || 0);
        const currentMateOpportunity = currentZoneId ? Math.max(0, zoneMateOpportunities?.[currentZoneId] || 0) : 0;
        const preferredFlowerTypes = profile.preferredFlowerTypes || [];
        const accessibleFlowers = zoneFlowers.filter(flower =>
            flower &&
            flower.stage !== 'dissolve' &&
            (flower.canAcceptButterfly?.(butterfly) ?? true)
        ).length;
        const matchingFlowers = zoneFlowers.filter(flower => preferredFlowerTypes.includes(flower?.flowerType)).length;
        const openBlocks = zoneBlocks.filter(block => block && !block.carriedById).length;
        const crowdPenalty = Math.max(0, (stats.butterflies || 0) - 3) * 0.12;
        const crowdReliefBonus = currentZoneId && currentZoneId !== zoneId
            ? Math.max(0, ((currentStats?.butterflies || 0) - (stats.butterflies || 0)) * 0.14)
            : 0;
        const migrationAffinity = currentZoneId && currentZoneId !== zoneId
            ? (currentProfile?.migrationAffinity?.[zoneId] || 0)
            : 0;
        const settleBias = typeof profile?.settleBias === 'number' ? profile.settleBias : 0.18;
        const zoneActionFit = this.scoreButterflyZoneActionFit(butterfly, profile);
        const currentActionFit = currentZoneId ? this.scoreButterflyZoneActionFit(butterfly, currentProfile) : zoneActionFit;
        const recentZonePenalty = this.getButterflyRecentZonePenalty(butterfly, zoneId);
        const dwellFrames = currentZoneId ? this.getButterflyZoneDwellFrames(butterfly, currentZoneId) : 0;
        const dwellPressure = currentZoneId && currentZoneId !== zoneId
            ? this.clampUnit((dwellFrames - ((migrationBalance.decisionIntervalFrames || 360) * 1.15)) / Math.max(180, (migrationBalance.decisionIntervalFrames || 360) * 2.35))
            : 0;
        const noveltyBias = this.clampUnit((wanderScale * 0.58) + (curiosity * 0.42));
        const zoneNoveltyBonus = currentZoneId && currentZoneId !== zoneId
            ? Math.max(0, 0.32 - (recentZonePenalty * 0.62)) * noveltyBias
            : 0;
        const foodRichness = zoneEcology?.foodRichness || 0;
        const shelterCapacity = zoneEcology?.shelterCapacity || 0;
        const crowdingTolerance = zoneEcology?.crowdingTolerance || 0;
        const crowdingPressure = zoneEcology?.crowdingPressure || 0;
        const migrationPull = zoneEcology?.migrationPull || 0;
        const socialValence = zoneEcology?.socialValence || 0;
        const trainingValence = zoneEcology?.trainingValence || 0;
        const recoveryPressure = zoneEcology?.recoveryPressure || 0;
        const currentCrowdingPressure = currentZoneEcology?.crowdingPressure || 0;

        let score = 0.1;
        const personality = butterfly.personalityType || butterfly.lifeSim?.identity?.archetype || 'hybrid';
        if ((profile.preferredPersonalities || []).includes(personality)) score += 1.2;
        if ((profile.toleratedPersonalities || []).includes(personality)) score += 0.55;
        if (butterfly.isHybrid) score += 0.2;
        if (currentZoneId === zoneId) score += 0.08 + (settleBias * (0.58 + currentActionFit * 0.42)) + (socialValence * 0.12) + (recoveryPressure * 0.18) - (migrationPull * 0.08);

        score += crowdReliefBonus;
        score -= crowdPenalty;
        score += Math.min(0.78, accessibleFlowers * (0.04 + feedUrgency * 0.05));
        score += Math.min(0.64, matchingFlowers * 0.16);
        score += Math.min(0.42, openBlocks * (0.03 + objectInterest * 0.05));
        score += foodRichness * (0.24 + (feedUrgency * 0.18));
        score += shelterCapacity * (0.12 + (objectInterest * 0.08) + (caution * 0.06));
        score += socialValence * (0.08 + (socialConfidence * 0.14));
        score += trainingValence * (zone.kind === 'training' ? 0.42 : 0.06);
        score += recoveryPressure * (currentZoneId === zoneId ? 0.16 : 0.05);
        score += migrationPull * (currentZoneId && currentZoneId !== zoneId ? 0.24 + (noveltyBias * 0.1) : 0.03);
        score += targetZoneAffinity * (0.52 + noveltySeeking * 0.16 + socialConfidence * 0.08);
        score += Math.max(0, targetZoneAffinity - currentZoneAffinity) * (0.28 + travelUrgency * 0.12);
        score -= crowdingPressure * (0.54 - Math.min(0.18, crowdingTolerance * 0.16));
        score += Math.max(0, currentCrowdingPressure - crowdingPressure) * (0.34 + (wanderScale * 0.1));
        score += Math.max(0, currentCrowdingPressure - crowdingPressure) * (overcrowdingEscape * 0.72);
        score += migrationAffinity * (1.15 + wanderScale * 0.32 + socialConfidence * 0.18);
        score += zoneActionFit * 1.28;
        score += Math.max(0, zoneActionFit - currentActionFit) * 0.92;
        score += zoneNoveltyBonus;
        score += dwellPressure * (0.28 + noveltyBias * 0.24);
        score -= recentZonePenalty;
        score += Math.max(0, mateOpportunity - currentMateOpportunity) * mateSeeking * 0.22;

        if (homeZoneId && zoneId === homeZoneId) {
            score += currentZoneId === zoneId
                ? homeAffinity * 0.34
                : homeAffinity * 0.46 + returnHomeBias * 0.88;
        } else if (homeZoneId && currentZoneId === homeZoneId && zoneId !== currentZoneId) {
            score -= Math.max(0, homeAffinity - (noveltySeeking * 0.56) - (overcrowdingEscape * 0.52) - (mateSeeking * 0.36)) * 0.2;
        }

        if (travelTargetZoneId && zoneId === travelTargetZoneId && zoneId !== currentZoneId) {
            score += 0.18 + travelUrgency * 0.26;
        }
        if (scoutTargetZoneId && zoneId === scoutTargetZoneId && zoneId !== currentZoneId) {
            score += noveltySeeking * 0.62 + travelUrgency * 0.16;
        }
        if (preferredMateZoneId && zoneId === preferredMateZoneId && zoneId !== currentZoneId) {
            score += mateSeeking * 0.72 + Math.min(0.42, mateOpportunity * 0.14);
        }

        if (personality === 'wise' || personality === 'friendly') {
            score += profile.communicationStyle === 'open-land-calm' ? 0.5 : 0;
        }
        if (personality === 'mystic' || personality === 'curious') {
            score += profile.communicationStyle === 'open-land-echoing' ? 0.5 : 0;
        }
        if (personality === 'energetic' || personality === 'skittish') {
            score += profile.communicationStyle === 'loud-training' ? 0.6 : 0;
        }
        if (personality === 'brave' || personality === 'cautious') {
            score += profile.communicationStyle === 'open-land-watchful' ? 0.5 : 0;
        }

        if (zone.kind === 'training') {
            score += (trainingAffinity * 1.48) + (battleAggression * 0.34) + (objectInterest * 0.26) + (socialConfidence * 0.18) + (displayConfidence * 0.16) + (trainingValence * 0.28);
            score -= (exhaustion * 0.34) + (threat * 0.18) + (caution * 0.12);
            if (butterfly.state === 'scared') score -= 0.4;
        } else {
            score += (wanderScale * 0.42) + (socialConfidence * 0.12) + (zoneActionFit * 0.18) + (recoveryPressure * 0.08);
            if (profile.communicationStyle === 'open-land-watchful') {
                score += caution * (0.34 + (shelterCapacity * 0.18));
            }
            if (profile.communicationStyle === 'open-land-echoing') {
                score += curiosity * (0.24 + (migrationPull * 0.16));
            }
        }

        if (butterfly.pregnancy?.active) {
            score += (zoneId === (butterfly.pregnancy.lifecycleData?.currentZoneId || butterfly.currentZoneId)) ? 0.5 : -0.2;
        }

        return score;
    }

    determineButterflyTravelReason(butterfly, currentZoneId, targetZoneId, options = {}) {
        if (!butterfly?.id || !currentZoneId || !targetZoneId || currentZoneId === targetZoneId) {
            return 'migration';
        }

        const migration = butterfly.lifeSim?.derived?.migration || {};
        const currentZoneEcology = options.currentZoneEcology || this.getZoneEcologySummary(currentZoneId) || {};
        const targetZoneEcology = options.targetZoneEcology || this.getZoneEcologySummary(targetZoneId) || {};

        if (targetZoneId === migration.homeZoneId && (migration.returnHomeBias || 0) >= Math.max(migration.overcrowdingEscape || 0, migration.mateSeeking || 0, migration.scoutingDrive || 0)) {
            return 'return-home';
        }
        if (targetZoneId === migration.preferredMateZoneId && (migration.mateSeeking || 0) > 0.3) {
            return 'mate-seeking';
        }
        if (
            (migration.overcrowdingEscape || 0) >= Math.max(migration.scoutingDrive || 0, (migration.mateSeeking || 0) * 0.9)
            && (currentZoneEcology?.crowdingPressure || 0) > ((targetZoneEcology?.crowdingPressure || 0) + 0.06)
        ) {
            return 'overcrowding';
        }
        if (targetZoneId === migration.scoutTargetZoneId && (migration.scoutingDrive || 0) > 0.22) {
            return 'scouting';
        }
        return 'migration';
    }

    choosePreferredFlowerTypeForZone(zoneId, attemptIndex = 0) {
        const profile = this.getZoneEcologyProfile(zoneId);
        const preferred = profile.preferredFlowerTypes || [];
        if (!preferred.length) return null;
        return preferred[attemptIndex % preferred.length];
    }

    getFocusedZoneId() {
        return this.gameState.focusedZoneId || this.zoneSystem?.focusedZoneId || this.getZoneIds()[0] || null;
    }

    getEntityZoneId(entity, fallbackZoneId = this.getFocusedZoneId()) {
        return entity?.currentZoneId ||
            entity?.lifeSim?.lifecycle?.currentZoneId ||
            entity?.lifecycleData?.currentZoneId ||
            fallbackZoneId ||
            null;
    }

    assignEntityToZone(entity, zoneId = this.getFocusedZoneId()) {
        if (!entity || !zoneId) return entity;
        entity.currentZoneId = zoneId;
        if (entity.lifeSim?.lifecycle) {
            entity.lifeSim.lifecycle.currentZoneId = zoneId;
        }
        if (entity.lifecycleData && typeof entity.lifecycleData === 'object') {
            entity.lifecycleData.currentZoneId = zoneId;
        }
        if (entity?.id && (entity.entityType === 'butterfly' || entity.lifeSim || entity.personalityType)) {
            this.syncButterflyZoneEcologyState(entity, zoneId, {
                recordVisit: !entity.zoneTravel
            });
        }
        return entity;
    }

    ensureButterflyZoneEcologyState(butterfly) {
        if (!butterfly?.id) return null;
        const resolvedZoneId = this.getEntityZoneId(butterfly, null);
        const nowFrame = typeof frameCount === 'number' ? frameCount : 0;
        butterfly.zoneEcologyState = butterfly.zoneEcologyState || {
            currentZoneId: resolvedZoneId || null,
            currentZoneEntryFrame: nowFrame,
            recentZoneIds: resolvedZoneId ? [resolvedZoneId] : [],
            lastTravelStartedAtFrame: null,
            lastTravelCompletedAtFrame: null,
            lastTravelReason: null,
            pendingTargetZoneId: null
        };
        const state = butterfly.zoneEcologyState;
        state.recentZoneIds = Array.isArray(state.recentZoneIds)
            ? state.recentZoneIds.filter(Boolean).slice(0, 6)
            : [];
        if (!state.currentZoneId && resolvedZoneId) {
            state.currentZoneId = resolvedZoneId;
        }
        if (!Number.isFinite(state.currentZoneEntryFrame)) {
            state.currentZoneEntryFrame = nowFrame;
        }
        if (state.currentZoneId && !state.recentZoneIds.length) {
            state.recentZoneIds = [state.currentZoneId];
        }
        return state;
    }

    syncButterflyZoneEcologyState(butterfly, zoneId, options = {}) {
        const state = this.ensureButterflyZoneEcologyState(butterfly);
        if (!state) return null;
        const resolvedZoneId = zoneId || this.getEntityZoneId(butterfly, null);
        if (!resolvedZoneId) return state;
        const nowFrame = typeof frameCount === 'number' ? frameCount : 0;
        const zoneChanged = state.currentZoneId !== resolvedZoneId;
        if (zoneChanged || options.forceEntryReset || !Number.isFinite(state.currentZoneEntryFrame)) {
            state.currentZoneEntryFrame = nowFrame;
        }
        state.currentZoneId = resolvedZoneId;
        if (options.recordVisit !== false) {
            state.recentZoneIds = [
                resolvedZoneId,
                ...state.recentZoneIds.filter(id => id && id !== resolvedZoneId)
            ].slice(0, 6);
        }
        return state;
    }

    markButterflyZoneTravelStart(butterfly, sourceZoneId, targetZoneId, reason = null) {
        const state = this.ensureButterflyZoneEcologyState(butterfly);
        if (!state) return null;
        const nowFrame = typeof frameCount === 'number' ? frameCount : 0;
        state.lastTravelStartedAtFrame = nowFrame;
        state.lastTravelReason = reason || state.lastTravelReason || null;
        state.pendingTargetZoneId = targetZoneId || null;
        if (sourceZoneId && !state.recentZoneIds.includes(sourceZoneId)) {
            state.recentZoneIds = [sourceZoneId, ...state.recentZoneIds].slice(0, 6);
        }
        return state;
    }

    completeButterflyZoneTravel(butterfly, sourceZoneId, targetZoneId, reason = null) {
        const state = this.ensureButterflyZoneEcologyState(butterfly);
        if (!state) return null;
        const nowFrame = typeof frameCount === 'number' ? frameCount : 0;
        state.lastTravelCompletedAtFrame = nowFrame;
        state.lastTravelReason = reason || state.lastTravelReason || null;
        state.pendingTargetZoneId = null;
        state.currentZoneId = targetZoneId || state.currentZoneId;
        state.currentZoneEntryFrame = nowFrame;
        state.recentZoneIds = [
            targetZoneId,
            sourceZoneId,
            ...state.recentZoneIds
        ].filter((zoneId, index, values) => zoneId && values.indexOf(zoneId) === index).slice(0, 6);
        return state;
    }

    getButterflyZoneDwellFrames(butterfly, zoneId = this.getEntityZoneId(butterfly, null)) {
        const state = this.ensureButterflyZoneEcologyState(butterfly);
        if (!state || !zoneId || state.currentZoneId !== zoneId) return 0;
        const nowFrame = typeof frameCount === 'number' ? frameCount : 0;
        return Math.max(0, nowFrame - (state.currentZoneEntryFrame || 0));
    }

    getButterflyRecentZonePenalty(butterfly, zoneId) {
        const state = this.ensureButterflyZoneEcologyState(butterfly);
        if (!state || !zoneId) return 0;
        if (state.currentZoneId === zoneId) return 0;
        const recentIndex = (state.recentZoneIds || []).findIndex(candidate => candidate === zoneId);
        if (recentIndex < 0) return 0;
        const penalties = [0, 0.34, 0.22, 0.12, 0.06];
        return penalties[Math.min(recentIndex, penalties.length - 1)] || 0.04;
    }

    scoreButterflyZoneActionFit(butterfly, profile = {}) {
        const actionBiases = profile?.actionBiases || {};
        const weights = Object.entries(actionBiases).filter(([, value]) => typeof value === 'number' && value > 0);
        if (!butterfly || !weights.length) return 0;

        const lifeSim = butterfly.lifeSim || {};
        const behaviorBiases = lifeSim.derived?.behaviorBiases || {};
        const emotions = lifeSim.emotions || {};
        const drives = lifeSim.drives || {};
        const social = lifeSim.social || {};
        const affinities = {
            social: this.clampUnit((behaviorBiases.socialConfidence || social.confidence || 0) * 0.7 + (drives.socialConnection || 0) * 0.3),
            teaching: this.clampUnit((behaviorBiases.trainingAffinity || 0) * 0.68 + (behaviorBiases.socialConfidence || 0) * 0.18 + ((butterfly.getSpecialAbility?.() || butterfly.specialAbility) === 'teacher' ? 0.22 : 0)),
            exploration: this.clampUnit((behaviorBiases.wanderScale || 0) * 0.72 + (emotions.curiosity || 0) * 0.28),
            rest: this.clampUnit((emotions.exhaustion || 0) * 0.72 + (drives.rest || 0) * 0.28),
            objectUse: this.clampUnit((behaviorBiases.objectInterest || 0) * 0.8 + (drives.resourceControl || 0) * 0.2),
            vigilance: this.clampUnit((behaviorBiases.caution || 0) * 0.7 + (emotions.threat || 0) * 0.3),
            training: this.clampUnit((behaviorBiases.trainingAffinity || 0) * 0.72 + (behaviorBiases.battleAggression || 0) * 0.28),
            status: this.clampUnit((behaviorBiases.displayConfidence || 0) * 0.72 + (drives.statusExpression || 0) * 0.28),
            caregiving: this.clampUnit((drives.caregiving || 0) * 0.72 + (butterfly.pregnancy?.active ? 0.28 : 0))
        };

        const totalWeight = weights.reduce((sum, [, weight]) => sum + weight, 0) || 1;
        const matchedWeight = weights.reduce((sum, [key, weight]) => sum + ((affinities[key] || 0) * weight), 0);
        return matchedWeight / totalWeight;
    }

    getDoorwayDirectionsForZone(zoneId) {
        const directions = new Set();
        for (const doorway of gameConfig?.world?.doorways || []) {
            if (doorway.fromZoneId === zoneId && doorway.fromAnchor?.direction) {
                directions.add(doorway.fromAnchor.direction);
            }
            if (doorway.toZoneId === zoneId && doorway.toAnchor?.direction) {
                directions.add(doorway.toAnchor.direction);
            }
        }
        return Array.from(directions);
    }

    isAmbientWildButterfly(butterfly) {
        return !!butterfly && (butterfly.birthSource || 'wild') === 'wild';
    }

    isZoneEcologyManagedButterfly(butterfly) {
        return !!butterfly && (butterfly.birthSource || 'wild') !== 'debug';
    }

    seedWildLifecycleMetadata(butterfly, preferredDirection = null) {
        if (!this.isAmbientWildButterfly(butterfly)) return butterfly;
        const zoneId = this.getEntityZoneId(butterfly, this.getFocusedZoneId());
        const directions = this.getDoorwayDirectionsForZone(zoneId);
        const existing = butterfly.wildLifecycle || {};
        const fallbackDirection = directions.length
            ? directions[Math.floor(random(directions.length))]
            : 'right';
        butterfly.wildLifecycle = {
            entryDirection: preferredDirection || existing.entryDirection || fallbackDirection,
            exitQueued: !!existing.exitQueued,
            exitAfterEgg: !!existing.exitAfterEgg,
            hasBred: !!existing.hasBred,
            exitReason: existing.exitReason || null
        };
        return butterfly;
    }

    planPollenDropTarget(butterfly) {
        if (!butterfly?.id) return null;
        const zoneId = this.getEntityZoneId(butterfly, this.getFocusedZoneId());
        const point = this.findValidFlowerPosition(this.getFlowersInZone(zoneId), zoneId, {
            minDistance: 42,
            maxAttempts: 24
        });
        if (!point) return null;
        butterfly.pendingPollenDropTarget = {
            x: point.x,
            y: point.y,
            zoneId
        };
        return butterfly.pendingPollenDropTarget;
    }

    completePollenDrop(butterfly) {
        const target = butterfly?.pendingPollenDropTarget;
        if (!butterfly?.id || !target) return false;

        const zoneId = target.zoneId || this.getEntityZoneId(butterfly, this.getFocusedZoneId());
        this.queuePollenPlanting(butterfly.id, zoneId, target.x, target.y, {
            source: 'pollen-drop'
        });
        butterfly.pendingPollenDropTarget = null;
        return true;
    }

    queuePollenPlanting(butterflyId, zoneId, x, y, options = {}) {
        if (!zoneId || !Number.isFinite(x) || !Number.isFinite(y)) return false;
        const interactionSpace = this.getFlowerInteractionSpace(zoneId);
        const point = this.clampPlacementPointInZone(zoneId, x, y, interactionSpace.clampPadding);
        const planting = {
            id: `${butterflyId || 'unknown'}:pollen:${Date.now()}:${Math.floor(random(1000))}`,
            butterflyId: butterflyId || null,
            zoneId,
            x: point.x,
            y: point.y,
            framesRemaining: options.framesRemaining || ((20 * 60) + Math.floor(random(10 * 60))),
            source: options.source || 'pollen-drop'
        };
        this.gameState.pendingPollenPlantings.push(planting);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('pollen:sprinkle', {
                x: point.x,
                y: point.y,
                zoneId,
                sourceId: butterflyId || null,
                source: planting.source
            });
        }
        return planting;
    }

    updatePollenPlantings() {
        if (!Array.isArray(this.gameState.pendingPollenPlantings) || !this.gameState.pendingPollenPlantings.length) return;
        for (let i = this.gameState.pendingPollenPlantings.length - 1; i >= 0; i--) {
            const planting = this.gameState.pendingPollenPlantings[i];
            planting.framesRemaining--;
            if (planting.framesRemaining > 0) continue;

            const zoneFlowers = (this.gameState.flowers || []).filter(flower => this.getEntityZoneId(flower, null) === planting.zoneId);
            const flower = this.spawnFlowerAt(planting.zoneId, planting.x, planting.y, {
                candidateFlowers: zoneFlowers,
                preferredPoint: { x: planting.x, y: planting.y },
                maxAttempts: 16,
                minDistance: 38
            });
            if (flower) {
                this.particleSystem?.emitBurst?.(flower.x, flower.y, [255, 232, 170], 10);
            }
            this.gameState.pendingPollenPlantings.splice(i, 1);
        }
    }

    removeButterflyFromGame(butterfly) {
        if (!butterfly) return;
        progressionManager?.unregisterWildButterfly?.(this.gameState, butterfly);
        this.entityManager?.removeEntity?.('butterflies', butterfly);
        this.unregisterEntityFromFoundationSystems(butterfly);
        const globalIndex = this.gameState.butterflies.indexOf(butterfly);
        if (globalIndex >= 0) {
            this.gameState.butterflies.splice(globalIndex, 1);
        }
    }

    pickWildArrivalZoneId() {
        const zoneIds = this.getZoneIds();
        if (!zoneIds.length) return this.getFocusedZoneId();
        const snapshot = this.getZonePopulationSnapshot();
        return zoneIds.slice().sort((left, right) => {
            const leftCount = snapshot[left]?.butterflies || 0;
            const rightCount = snapshot[right]?.butterflies || 0;
            if (leftCount !== rightCount) return leftCount - rightCount;
            return (snapshot[left]?.flowers || 0) - (snapshot[right]?.flowers || 0);
        })[0];
    }

    chooseWildProgressionType(options = {}) {
        if (typeof progressionManager !== 'undefined' && this.gameState) {
            return progressionManager.chooseWildVariant?.(this.gameState, options) || null;
        }
        return null;
    }

    spawnAmbientWildButterfly(zoneId = this.pickWildArrivalZoneId(), preferredDirection = null) {
        if (this.getWildButterflyCount() >= (gameConfig.entities.maxButterflies || 8)) return null;
        if (!zoneId) return null;

        const directions = this.getDoorwayDirectionsForZone(zoneId);
        const direction = preferredDirection || directions[Math.floor(random(Math.max(1, directions.length)))] || 'right';
        const anchor = this.getZoneDoorwayAnchor(zoneId, null, direction) || this.getZoneDoorwayAnchor(zoneId);
        if (!anchor) return null;
        const personalityType = this.chooseWildProgressionType({ allowGolden: false });
        const customTraits = progressionManager?.getWildSpawnTraits?.(this.gameState, personalityType) || null;

        const butterfly = new Butterfly(
            anchor.x,
            anchor.y - gameConfig.entities.heightOffset.butterfly,
            null,
            false,
            personalityType,
            {
                currentZoneId: zoneId,
                birthSource: 'wild',
                ...(customTraits ? { customTraits } : {})
            }
        );

        this.assignEntityToZone(butterfly, zoneId);
        butterfly.x = anchor.x;
        butterfly.y = anchor.y - gameConfig.entities.heightOffset.butterfly;
        this.seedWildLifecycleMetadata(butterfly, anchor.direction || direction);
        progressionManager?.registerWildButterfly?.(this.gameState, butterfly, {
            seededBy: 'ambient',
            zoneId
        });

        this.gameState.butterflies.push(butterfly);
        this.entityManager?.addEntity?.('butterflies', butterfly);
        this.registerEntityWithFoundationSystems(butterfly, 'butterfly');
        this.seedZoneTravelRecoveryMovement(butterfly, {
            targetZoneId: zoneId,
            arrivalVisibleAnchor: anchor,
            arrivalTarget: anchor,
            direction: anchor.direction || direction
        });
        return butterfly;
    }

    queueWildButterflyExit(butterfly, reason = 'wild-departure') {
        if (!this.isAmbientWildButterfly(butterfly) || butterfly.zoneTravel) return false;
        const zoneId = this.getEntityZoneId(butterfly, null);
        if (!zoneId) return false;

        this.seedWildLifecycleMetadata(butterfly);
        const direction = butterfly.wildLifecycle?.entryDirection || 'right';
        const travelProfile = this.getZoneDoorwayTravelProfile(zoneId, null, direction)
            || this.getZoneDoorwayTravelProfile(zoneId);
        if (!travelProfile?.visibleAnchor || !travelProfile?.warpAnchor) return false;

        const departureApproachAnchor = this.buildZoneTravelApproachAnchor(
            zoneId,
            { x: butterfly.x, y: butterfly.y },
            travelProfile.visibleAnchor,
            travelProfile.direction || direction,
            { approachLane: travelProfile.approachLane }
        );
        butterfly.wildLifecycle.exitQueued = true;
        butterfly.wildLifecycle.exitReason = reason;
        butterfly.zoneTravel = {
            sourceZoneId: zoneId,
            targetZoneId: null,
            sourceAnchor: travelProfile.visibleAnchor,
            targetAnchor: null,
            departureApproachAnchor,
            departureLineupAnchor: this.buildZoneTravelLineupAnchor(
                zoneId,
                departureApproachAnchor,
                travelProfile.visibleAnchor,
                travelProfile.direction || direction,
                { lineupAnchor: travelProfile.lineupAnchor }
            ),
            departureVisibleAnchor: travelProfile.visibleAnchor,
            departureCoverAnchor: travelProfile.coverAnchor || travelProfile.visibleAnchor,
            departureWarpAnchor: travelProfile.warpAnchor,
            phase: 'approaching',
            progressFrames: 0,
            reason,
            renderBehindCover: false
        };
        butterfly.stateData = butterfly.stateData || {};
        butterfly.stateData.zoneTravel = butterfly.zoneTravel;
        if (typeof eventBus !== 'undefined' && GameEvents?.ZONE_TRAVEL_STARTED) {
            eventBus.emit(GameEvents.ZONE_TRAVEL_STARTED, {
                butterflyId: butterfly.id,
                butterflyLabel: butterfly.getDisplayName?.() || butterfly.personalityType || 'butterfly',
                fromZoneId: zoneId,
                toZoneId: null,
                reason
            });
        }
        return true;
    }

    updateWildButterflyDepartures() {
        for (const butterfly of this.gameState.butterflies || []) {
            if (!this.isAmbientWildButterfly(butterfly) || butterfly.zoneTravel) continue;
            if (!butterfly.wildLifecycle?.exitQueued) continue;
            if (butterfly.state === 'mating' || butterfly.state === 'pregnant-travel' || butterfly.isSpawning) continue;
            if ((butterfly.wildLifecycle?.exitReason || '') === 'wild-mating-limit') {
                this.removeButterflyFromGame(butterfly);
                continue;
            }
            this.queueWildButterflyExit(butterfly, butterfly.wildLifecycle.exitReason || 'wild-departure');
        }
    }

    updateWildButterflyArrivals() {
        const targetCount = gameConfig.entities.wildTargetCount ?? gameConfig.entities.maxButterflies ?? 8;
        const intervalFrames = this.getMigrationBalance().wildArrivalIntervalFrames || 720;
        if (frameCount % intervalFrames !== 0) return;
        if (this.getWildButterflyCount() >= targetCount) return;
        this.spawnAmbientWildButterfly();
    }

    suggestZoneForButterfly(butterfly, fallbackIndex = 0) {
        const zoneIds = this.getZoneIds();
        if (!zoneIds.length) return null;
        const scoringContext = this.buildZoneTravelScoringContext(zoneIds);
        const currentZoneId = this.getEntityZoneId(butterfly, null);
        let bestZoneId = zoneIds[fallbackIndex % zoneIds.length];
        let bestScore = -Infinity;

        for (const zoneId of zoneIds) {
            const score = this.scoreButterflyForZone(butterfly, zoneId, {
                ...scoringContext,
                currentZoneId
            });
            if (score > bestScore) {
                bestScore = score;
                bestZoneId = zoneId;
            }
        }

        return bestZoneId;
    }

    ensureZoneOwnership() {
        if (!this.isSectionSceneWorld()) return;
        const zoneIds = this.getZoneIds();
        if (!zoneIds.length) return;

        this.gameState.focusedZoneId = this.getFocusedZoneId() || zoneIds[0];

        let butterflyIndex = 0;
        for (const butterfly of this.gameState.butterflies || []) {
            const nextZoneId = this.getEntityZoneId(butterfly, null) || this.suggestZoneForButterfly(butterfly, butterflyIndex);
            this.assignEntityToZone(butterfly, nextZoneId);
            butterflyIndex++;
        }

        let flowerIndex = 0;
        for (const flower of this.gameState.flowers || []) {
            const nextZoneId = this.getEntityZoneId(flower, null) || zoneIds[flowerIndex % zoneIds.length];
            this.assignEntityToZone(flower, nextZoneId);
            flowerIndex++;
        }

        let caterpillarIndex = 0;
        for (const caterpillar of this.gameState.caterpillars || []) {
            const nextZoneId = this.getEntityZoneId(caterpillar, null) || zoneIds[caterpillarIndex % zoneIds.length];
            this.assignEntityToZone(caterpillar, nextZoneId);
            caterpillarIndex++;
        }

        let blockIndex = 0;
        for (const block of this.gameState.blocks || []) {
            const nextZoneId = this.getEntityZoneId(block, null) || zoneIds[blockIndex % zoneIds.length];
            this.assignEntityToZone(block, nextZoneId);
            blockIndex++;
        }

        this.rebalanceSectionEcology();
    }

    getZonePopulationSnapshot() {
        const zoneIds = this.getZoneIds();
        const snapshot = Object.fromEntries(zoneIds.map(zoneId => [zoneId, {
            butterflies: 0,
            flowers: 0,
            caterpillars: 0,
            blocks: 0,
            residentButterflies: 0,
            wildButterflies: 0
        }]));

        for (const butterfly of this.gameState.butterflies || []) {
            if (!this.isZoneEcologyManagedButterfly(butterfly)) continue;
            const zoneId = this.getEntityZoneId(butterfly, null);
            if (snapshot[zoneId]) {
                snapshot[zoneId].butterflies++;
                if ((butterfly.birthSource || 'wild') === 'bred' || butterfly.isHybrid) {
                    snapshot[zoneId].residentButterflies++;
                } else {
                    snapshot[zoneId].wildButterflies++;
                }
            }
        }
        for (const flower of this.gameState.flowers || []) {
            const zoneId = this.getEntityZoneId(flower, null);
            if (snapshot[zoneId]) snapshot[zoneId].flowers++;
        }
        for (const caterpillar of this.gameState.caterpillars || []) {
            const zoneId = this.getEntityZoneId(caterpillar, null);
            if (snapshot[zoneId]) snapshot[zoneId].caterpillars++;
        }
        for (const block of this.gameState.blocks || []) {
            const zoneId = this.getEntityZoneId(block, null);
            if (snapshot[zoneId]) snapshot[zoneId].blocks++;
        }

        return snapshot;
    }

    chooseBalancedZoneId(preferredZoneId, counts, softCap, zoneIds) {
        const sortedZoneIds = [...zoneIds].sort((left, right) => counts[left] - counts[right]);
        if (preferredZoneId && counts[preferredZoneId] < softCap) {
            return preferredZoneId;
        }
        return sortedZoneIds[0] || preferredZoneId || zoneIds[0] || null;
    }

    rebalanceSectionEcology(force = false) {
        if (!this.isSectionSceneWorld()) return false;
        if (!force && this.gameState?.ecologyMode === 'wild-release-loop') return false;
        const zoneIds = this.getZoneIds();
        if (zoneIds.length < 2) return false;

        const snapshot = this.getZonePopulationSnapshot();
        const butterflyCounts = zoneIds.map(zoneId => snapshot[zoneId]?.butterflies || 0);
        const totalButterflies = butterflyCounts.reduce((sum, count) => sum + count, 0);
        const emptyZones = butterflyCounts.filter(count => count === 0).length;
        const maxZoneCount = butterflyCounts.length ? Math.max(...butterflyCounts) : 0;
        const averageZoneCount = butterflyCounts.length ? totalButterflies / butterflyCounts.length : 0;
        const imbalanced = emptyZones > 0 || maxZoneCount > averageZoneCount + 3;

        if (!force && !imbalanced && this.gameState.zoneEcologyVersion === 4) {
            return false;
        }

        const zoneButterflyCounts = Object.fromEntries(zoneIds.map(zoneId => [zoneId, 0]));
        const butterflySoftCap = Math.max(3, Math.ceil(Math.max(totalButterflies, zoneIds.length * 2) / zoneIds.length));
        const butterflies = [...(this.gameState.butterflies || [])]
            .filter(butterfly => this.isZoneEcologyManagedButterfly(butterfly))
            .sort((left, right) => {
            const leftWeight = (left.isImmortal ? 3 : 0) + (left.isHybrid ? 2 : 0);
            const rightWeight = (right.isImmortal ? 3 : 0) + (right.isHybrid ? 2 : 0);
            return rightWeight - leftWeight;
        });
        const assignedIds = new Set();
        const females = butterflies.filter(butterfly => butterfly.sex === 'F');
        const males = butterflies.filter(butterfly => butterfly.sex === 'M');

        if (females.length >= zoneIds.length && males.length >= zoneIds.length) {
            zoneIds.forEach((zoneId, index) => {
                const female = females[index];
                const male = males[index];
                if (female) {
                    this.assignEntityToZone(female, zoneId);
                    zoneButterflyCounts[zoneId] = (zoneButterflyCounts[zoneId] || 0) + 1;
                    assignedIds.add(female.id);
                }
                if (male) {
                    this.assignEntityToZone(male, zoneId);
                    zoneButterflyCounts[zoneId] = (zoneButterflyCounts[zoneId] || 0) + 1;
                    assignedIds.add(male.id);
                }
            });
        }

        butterflies.forEach((butterfly, index) => {
            if (assignedIds.has(butterfly.id)) return;
            const preferredZoneId = this.suggestZoneForButterfly(butterfly, index) || this.getEntityZoneId(butterfly, null);
            const chosenZoneId = this.chooseBalancedZoneId(preferredZoneId, zoneButterflyCounts, butterflySoftCap, zoneIds);
            this.assignEntityToZone(butterfly, chosenZoneId);
            zoneButterflyCounts[chosenZoneId] = (zoneButterflyCounts[chosenZoneId] || 0) + 1;
        });

        const zoneFlowerCounts = Object.fromEntries(zoneIds.map(zoneId => [zoneId, 0]));
        const flowers = [...(this.gameState.flowers || [])];
        flowers.forEach((flower, index) => {
            let preferredZoneId = this.getEntityZoneId(flower, null);
            if (!preferredZoneId && flower?.flowerType) {
                preferredZoneId = zoneIds.find(zoneId => (this.getZoneEcologyProfile(zoneId).preferredFlowerTypes || []).includes(flower.flowerType)) || null;
            }
            preferredZoneId = preferredZoneId || zoneIds[index % zoneIds.length];
            const chosenZoneId = this.chooseBalancedZoneId(preferredZoneId, zoneFlowerCounts, Math.max(1, Math.ceil(Math.max(flowers.length, zoneIds.length) / zoneIds.length)), zoneIds);
            this.assignEntityToZone(flower, chosenZoneId);
            zoneFlowerCounts[chosenZoneId] = (zoneFlowerCounts[chosenZoneId] || 0) + 1;
        });

        const zoneCaterpillarCounts = Object.fromEntries(zoneIds.map(zoneId => [zoneId, 0]));
        for (const [index, caterpillar] of (this.gameState.caterpillars || []).entries()) {
            const preferredZoneId = this.getEntityZoneId(caterpillar, null) || zoneIds[index % zoneIds.length];
            const chosenZoneId = this.chooseBalancedZoneId(preferredZoneId, zoneCaterpillarCounts, Math.max(1, butterflySoftCap - 2), zoneIds);
            this.assignEntityToZone(caterpillar, chosenZoneId);
            zoneCaterpillarCounts[chosenZoneId] = (zoneCaterpillarCounts[chosenZoneId] || 0) + 1;
        }

        this.gameState.zoneEcologyVersion = 4;
        return true;
    }

    getFocusedSceneEntities() {
        const focusedZoneId = this.getFocusedZoneId();
        if (!this.isSectionSceneWorld() || !focusedZoneId) {
            return {
                butterflies: this.gameState.butterflies || [],
                flowers: this.gameState.flowers || [],
                caterpillars: this.gameState.caterpillars || [],
                blocks: this.gameState.blocks || []
            };
        }

        return {
            butterflies: (this.gameState.butterflies || []).filter(entity => this.getEntityZoneId(entity) === focusedZoneId),
            flowers: (this.gameState.flowers || []).filter(entity => this.getEntityZoneId(entity) === focusedZoneId),
            caterpillars: (this.gameState.caterpillars || []).filter(entity => this.getEntityZoneId(entity) === focusedZoneId),
            blocks: (this.gameState.blocks || []).filter(entity => this.getEntityZoneId(entity) === focusedZoneId)
        };
    }

    buildFocusedSceneState() {
        const sceneEntities = this.getFocusedSceneEntities();
        const focusedZoneId = this.getFocusedZoneId();
        return {
            ...this.gameState,
            focusedZoneId,
            butterflies: sceneEntities.butterflies,
            flowers: sceneEntities.flowers,
            caterpillars: sceneEntities.caterpillars,
            blocks: sceneEntities.blocks,
            zoneEcologySummary: focusedZoneId ? this.getZoneEcologySummary(focusedZoneId) : null,
            pressureProfile: this.telemetrySystem?.getPressureProfile?.() || null
        };
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
        const foundationBreakdown = this.updateFoundationSystems() || {};
        const foundationMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - foundationStart;

        const entityStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const focusedSceneState = this.buildFocusedSceneState();
        const entityBreakdown = {};
        let stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.updateEntities(focusedSceneState);
        entityBreakdown.butterflyUpdateMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;
        stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.updateCaterpillars(focusedSceneState);
        entityBreakdown.caterpillarUpdateMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;
        stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        for (const block of focusedSceneState.blocks || []) {
            block.update?.(focusedSceneState);
        }
        entityBreakdown.blockUpdateMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;
        // Butterflies emit movement intent during entity updates; physics owns
        // the final legalized step once all visible entities have advanced.
        const physicsStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.physicsSystem?.update?.(focusedSceneState, 0, { resetContacts: false });
        const physicsMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - physicsStart;
        const entityMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - entityStart;

        const particleStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.particleSystem.update();
        const particleUpdateMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - particleStart;
        
        // Update special effects
        const worldStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const worldBreakdown = {};
        stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (typeof specialEffects !== 'undefined') {
            specialEffects.update();
        }
        worldBreakdown.specialEffectsMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;
        
        // Occasionally spawn new flowers if conditions are met
        stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.updateFlowerSpawning(focusedSceneState);
        worldBreakdown.flowerSpawningMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;
        stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.updatePollenPlantings();
        worldBreakdown.pollenPlantingMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;
        stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.flowerManager.update(this.gameState.flowers, this.gameState.butterflies, this.particleSystem);
        worldBreakdown.flowerManagerMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;
        stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        breedingSystem.update(this.gameState, this.particleSystem);
        worldBreakdown.breedingMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;
        
        // Check for butterfly interactions
        stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.interactionSystem.checkButterflyInteractions(focusedSceneState.butterflies);
        worldBreakdown.interactionChecksMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;
        
        // Emit periodic events
        stageStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.emitPeriodicEvents();
        worldBreakdown.periodicEventsMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - stageStart;

        const totalUpdateMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - updateStart;
        const worldMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - worldStart;
        this.telemetrySystem?.recordUpdateSample?.(this.gameState, {
            totalUpdateMs,
            foundationMs,
            foundationBreakdown,
            entityMs,
            entityBreakdown,
            physicsMs,
            particleUpdateMs,
            worldMs,
            worldBreakdown,
            physicsBudget: this.physicsSystem?.getBudgetTargets?.() || null,
            visibleButterflyCount: focusedSceneState.butterflies?.length || 0,
            visibleFlowerCount: focusedSceneState.flowers?.length || 0,
            visibleCaterpillarCount: focusedSceneState.caterpillars?.length || 0,
            visibleBlockCount: focusedSceneState.blocks?.length || 0,
            visibleEntityCount: (focusedSceneState.butterflies?.length || 0)
                + (focusedSceneState.flowers?.length || 0)
                + (focusedSceneState.caterpillars?.length || 0)
                + (focusedSceneState.blocks?.length || 0)
        });
    }
    
    shouldRunCadencedSystem(systemId = 'system', intervalFrames = 1, phaseOffset = 0, currentFrame = (typeof frameCount === 'number' ? frameCount : 0)) {
        const normalizedInterval = Math.max(1, Math.round(intervalFrames || 1));
        if (normalizedInterval <= 1) return true;
        const normalizedPhase = ((Math.round(phaseOffset || 0) % normalizedInterval) + normalizedInterval) % normalizedInterval;
        return (Math.max(0, Math.round(currentFrame || 0)) % normalizedInterval) === normalizedPhase;
    }

    maybeRecordCadenceBudgetOverrun(systemId = 'system', totalMs = 0, budgetMs = 0, details = {}) {
        if (!Number.isFinite(totalMs) || !Number.isFinite(budgetMs) || totalMs <= budgetMs) {
            return false;
        }
        this.telemetrySystem?.recordRuntimeIssue?.('cadence-budget-overrun', {
            systemId,
            totalMs,
            budgetMs,
            ...details
        });
        return true;
    }

    getZoneEcologyCadencePlan(zoneIds = this.getZoneIds(), currentFrame = (typeof frameCount === 'number' ? frameCount : 0), options = {}) {
        const cadenceEnabled = !!options.cadenceEnabled;
        const pressureProfile = options.pressureProfile || null;
        const normalizedFrame = Math.max(0, Math.round(currentFrame || 0));
        if (!zoneIds.length) {
            return {
                enabled: cadenceEnabled ? 1 : 0,
                intervalFrames: 1,
                dueZoneIds: [],
                cadenceOffsetsByZone: {},
                telemetryTick: false,
                forcedRefreshCount: 0,
                maxStaleFrames: 0
            };
        }

        if (!cadenceEnabled) {
            const intervalFrames = pressureProfile?.isCritical
                ? 3
                : pressureProfile?.isHot
                    ? 2
                    : 1;
            const shouldRefresh = zoneIds.length && (normalizedFrame % intervalFrames === 0);
            return {
                enabled: 0,
                intervalFrames,
                dueZoneIds: shouldRefresh ? [...zoneIds] : [],
                cadenceOffsetsByZone: Object.fromEntries(zoneIds.map(zoneId => [zoneId, 0])),
                telemetryTick: shouldRefresh,
                forcedRefreshCount: 0,
                maxStaleFrames: shouldRefresh ? 0 : intervalFrames - 1
            };
        }

        const intervalFrames = Math.max(1, Math.round(gameConfig?.simulation?.cadence?.ecologyRefreshIntervalFrames || 30));
        const cadenceOffsetsByZone = {};
        const dueZoneIds = [];
        let forcedRefreshCount = 0;
        let maxStaleFrames = 0;

        zoneIds.forEach((zoneId, index) => {
            const cadenceOffset = index % intervalFrames;
            cadenceOffsetsByZone[zoneId] = cadenceOffset;
            const state = this.zoneSystem?.getZoneEcologyState?.(zoneId) || null;
            const lastValidFrame = Number.isFinite(state?.lastUpdatedFrame) ? Math.max(0, Math.round(state.lastUpdatedFrame)) : -1;
            const staleFrames = lastValidFrame >= 0 ? Math.max(0, normalizedFrame - lastValidFrame) : intervalFrames;
            maxStaleFrames = Math.max(maxStaleFrames, staleFrames);
            const forcedRefresh = lastValidFrame < 0 || staleFrames >= intervalFrames;
            const phaseHit = this.shouldRunCadencedSystem('zone-ecology-refresh', intervalFrames, cadenceOffset, normalizedFrame);
            if (forcedRefresh || phaseHit) {
                dueZoneIds.push(zoneId);
                if (forcedRefresh) forcedRefreshCount += 1;
            }
        });

        return {
            enabled: 1,
            intervalFrames,
            dueZoneIds,
            cadenceOffsetsByZone,
            telemetryTick: this.shouldRunCadencedSystem('zone-ecology-telemetry', intervalFrames, 0, normalizedFrame),
            forcedRefreshCount,
            maxStaleFrames
        };
    }

    updateFoundationSystems() {
        const deltaSeconds = gameConfig.simulation.fixedDeltaSeconds * this.gameState.timeScale;
        const zoneIds = this.getZoneIds();
        const pressureProfile = this.telemetrySystem?.getPressureProfile?.() || null;
        const currentFrame = typeof frameCount === 'number' ? frameCount : 0;
        const zoneEcologyCadencePlan = this.getZoneEcologyCadencePlan(zoneIds, currentFrame, {
            cadenceEnabled: !!gameConfig?.performance?.flags?.simCadenceSplit,
            pressureProfile
        });
        const zoneEcologyCadence = zoneEcologyCadencePlan.intervalFrames;
        const ecologyDueZoneIds = zoneEcologyCadencePlan.dueZoneIds || [];
        const shouldRefreshZoneEcology = ecologyDueZoneIds.length > 0;
        const foundationBreakdown = {
            zoneEcologyCadence,
            zoneEcologyRefreshApplied: shouldRefreshZoneEcology ? 1 : 0,
            zoneEcologyCadenceEnabled: zoneEcologyCadencePlan.enabled || 0,
            zoneEcologyRefreshedZoneCount: ecologyDueZoneIds.length,
            zoneEcologyForcedRefreshCount: zoneEcologyCadencePlan.forcedRefreshCount || 0,
            zoneEcologyMaxStaleFrames: zoneEcologyCadencePlan.maxStaleFrames || 0,
            zoneEcologyTelemetryTick: zoneEcologyCadencePlan.telemetryTick ? 1 : 0
        };
        let lifeSimUpdateSummary = null;
        let mlInferenceUpdateSummary = null;
        const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const timeStep = (key, callback) => {
            const start = nowMs();
            callback?.();
            foundationBreakdown[key] = nowMs() - start;
        };

        timeStep('zoneSystemMs', () => this.zoneSystem?.update(this.gameState, deltaSeconds));
        timeStep('statusSystemMs', () => this.statusSystem?.update(this.gameState, deltaSeconds));
        timeStep('objectSystemMs', () => this.objectSystem?.update(this.gameState, deltaSeconds));
        timeStep('structureSystemMs', () => this.structureSystem?.update(this.gameState, deltaSeconds));
        timeStep('sleepSystemMs', () => this.sleepSystem?.update(this.gameState, deltaSeconds));
        timeStep('lifeSimSystemMs', () => {
            lifeSimUpdateSummary = this.lifeSimSystem?.update(this.gameState, deltaSeconds, {
                currentFrame: typeof frameCount === 'number' ? frameCount : 0,
                cadenceEnabled: !!gameConfig?.performance?.flags?.simCadenceSplit
            }) || null;
        });
        timeStep('teachingSystemMs', () => this.teachingSystem?.update(this.gameState, deltaSeconds));
        timeStep('communicationSystemMs', () => this.communicationSystem?.update(this.gameState, deltaSeconds));
        timeStep('behaviorSystemMs', () => this.behaviorSystem?.update(this.gameState, deltaSeconds));
        timeStep('mlInferenceSystemMs', () => {
            mlInferenceUpdateSummary = this.mlInferenceSystem?.update(this.gameState, deltaSeconds, {
                currentFrame: typeof frameCount === 'number' ? frameCount : 0,
                cadenceEnabled: !!gameConfig?.performance?.flags?.simCadenceSplit
            }) || null;
        });
        timeStep('battleSystemMs', () => this.battleSystem?.update(this.gameState, deltaSeconds));
        timeStep('saveSystemMs', () => this.saveSystem?.update(this.gameState, deltaSeconds));
        timeStep('zoneEcologyStateMs', () => this.updateZoneEcology(deltaSeconds));
        if (lifeSimUpdateSummary) {
            foundationBreakdown.lifeSimCadenceEnabled = lifeSimUpdateSummary.cadenceEnabled || 0;
            foundationBreakdown.lifeSimCadenceIntervalFrames = lifeSimUpdateSummary.cadenceIntervalFrames || 1;
            foundationBreakdown.lifeSimDeepUpdatedCount = lifeSimUpdateSummary.butterfliesDeepUpdated || 0;
            foundationBreakdown.lifeSimCadenceSkippedCount = lifeSimUpdateSummary.butterfliesCadenceSkipped || 0;
            foundationBreakdown.lifeSimForcedDeepUpdatedCount = lifeSimUpdateSummary.butterfliesForcedDeepUpdated || 0;
            foundationBreakdown.lifeSimCaterpillarDeepUpdatedCount = lifeSimUpdateSummary.caterpillarsDeepUpdated || 0;
            const lifeSimCadenceBudgetMs = Number(gameConfig?.simulation?.cadence?.lifeSimDeepBudgetMs || 0);
            foundationBreakdown.lifeSimCadenceOverBudget = this.maybeRecordCadenceBudgetOverrun(
                'life-sim-deep-evaluation',
                Number(foundationBreakdown.lifeSimSystemMs || 0),
                lifeSimCadenceBudgetMs,
                {
                    intervalFrames: foundationBreakdown.lifeSimCadenceIntervalFrames || 1,
                    deepUpdatedCount: foundationBreakdown.lifeSimDeepUpdatedCount || 0,
                    skippedCount: foundationBreakdown.lifeSimCadenceSkippedCount || 0
                }
            ) ? 1 : 0;
        }
        if (mlInferenceUpdateSummary) {
            foundationBreakdown.mlCadenceEnabled = mlInferenceUpdateSummary.cadenceEnabled || 0;
            foundationBreakdown.mlCadenceIntervalFrames = mlInferenceUpdateSummary.cadenceIntervalFrames || 1;
            foundationBreakdown.mlRefreshedTraceCount = mlInferenceUpdateSummary.refreshedTraceCount || 0;
            foundationBreakdown.mlCadenceSkippedCount = mlInferenceUpdateSummary.cadenceSkippedCount || 0;
            foundationBreakdown.mlForcedRefreshCount = mlInferenceUpdateSummary.forcedRefreshCount || 0;
            foundationBreakdown.mlBattleBypassed = mlInferenceUpdateSummary.battleBypassed || 0;
            const mlCadenceBudgetMs = Number(
                gameConfig?.simulation?.cadence?.mlScoringBudgetMs
                || this.mlInferenceSystem?.getBudgetTargets?.()?.focusedGardenInferenceMs
                || 0
            );
            foundationBreakdown.mlCadenceOverBudget = this.maybeRecordCadenceBudgetOverrun(
                'ml-scoring',
                Number(foundationBreakdown.mlInferenceSystemMs || 0),
                mlCadenceBudgetMs,
                {
                    intervalFrames: foundationBreakdown.mlCadenceIntervalFrames || 1,
                    refreshedTraceCount: foundationBreakdown.mlRefreshedTraceCount || 0,
                    skippedCount: foundationBreakdown.mlCadenceSkippedCount || 0,
                    forcedRefreshCount: foundationBreakdown.mlForcedRefreshCount || 0,
                    battleBypassed: foundationBreakdown.mlBattleBypassed || 0
                }
            ) ? 1 : 0;
        }
        if (shouldRefreshZoneEcology) {
            // Refresh zone ecology once after system/entity changes so the next
            // frame sees the latest state without paying the same collection pass twice.
            const refreshStart = nowMs();
            const zoneContext = this.collectZoneEcologyInputs(ecologyDueZoneIds);
            foundationBreakdown.zoneEcologyCollectMs = nowMs() - refreshStart;

            const resourceStart = nowMs();
            this.updateZoneResourceLoop(ecologyDueZoneIds, {
                context: zoneContext,
                deltaSeconds,
                currentFrame,
                cadenceIntervalFrames: zoneEcologyCadencePlan.intervalFrames,
                cadenceOffsetsByZone: zoneEcologyCadencePlan.cadenceOffsetsByZone
            });
            foundationBreakdown.zoneEcologyResourceLoopMs = nowMs() - resourceStart;

            const pressureStart = nowMs();
            const latestZoneContext = this.refreshZonePressureState(ecologyDueZoneIds, {
                context: zoneContext,
                currentFrame,
                cadenceIntervalFrames: zoneEcologyCadencePlan.intervalFrames,
                cadenceOffsetsByZone: zoneEcologyCadencePlan.cadenceOffsetsByZone
            });
            foundationBreakdown.zoneEcologyPressureRefreshMs = nowMs() - pressureStart;

            if (zoneEcologyCadencePlan.telemetryTick) {
                const telemetryStart = nowMs();
                const telemetryContext = this.collectZoneEcologyInputs(zoneIds);
                this.telemetrySystem?.recordEcologySample?.(
                    this.gameState,
                    this.buildEcologyTelemetrySample(zoneIds, {
                        context: telemetryContext,
                        currentFrame
                    })
                );
                foundationBreakdown.zoneEcologyTelemetryMs = nowMs() - telemetryStart;
            } else {
                foundationBreakdown.zoneEcologyTelemetryMs = 0;
            }

            const zoneEcologyCadenceBudgetMs = Number(gameConfig?.simulation?.cadence?.ecologyRefreshBudgetMs || 0);
            foundationBreakdown.zoneEcologyCadenceOverBudget = this.maybeRecordCadenceBudgetOverrun(
                'zone-ecology-refresh',
                Number(foundationBreakdown.zoneEcologyCollectMs || 0)
                    + Number(foundationBreakdown.zoneEcologyResourceLoopMs || 0)
                    + Number(foundationBreakdown.zoneEcologyPressureRefreshMs || 0)
                    + Number(foundationBreakdown.zoneEcologyTelemetryMs || 0),
                zoneEcologyCadenceBudgetMs,
                {
                    intervalFrames: zoneEcologyCadencePlan.intervalFrames || 1,
                    refreshedZoneCount: ecologyDueZoneIds.length,
                    forcedRefreshCount: zoneEcologyCadencePlan.forcedRefreshCount || 0,
                    maxStaleFrames: zoneEcologyCadencePlan.maxStaleFrames || 0,
                    telemetryTick: zoneEcologyCadencePlan.telemetryTick ? 1 : 0
                }
            ) ? 1 : 0;
        } else {
            foundationBreakdown.zoneEcologyCollectMs = 0;
            foundationBreakdown.zoneEcologyResourceLoopMs = 0;
            foundationBreakdown.zoneEcologyPressureRefreshMs = 0;
            foundationBreakdown.zoneEcologyTelemetryMs = 0;
            foundationBreakdown.zoneEcologyCadenceOverBudget = 0;
        }
        return foundationBreakdown;
    }

    getButterfliesInZone(zoneId) {
        return (this.gameState.butterflies || []).filter(entity => this.getEntityZoneId(entity, null) === zoneId);
    }

    getFlowersInZone(zoneId) {
        return (this.gameState.flowers || []).filter(entity => this.getEntityZoneId(entity, null) === zoneId);
    }

    getBlocksInZone(zoneId) {
        return (this.gameState.blocks || []).filter(entity => this.getEntityZoneId(entity, null) === zoneId);
    }

    findBlockNudgeTarget(butterfly, block) {
        if (!butterfly || !block) return null;
        const zoneId = this.getEntityZoneId(block, this.getEntityZoneId(butterfly, this.getFocusedZoneId()));
        const region = this.getZonePlacementRegion(zoneId);
        if (!region) return null;
        const blockUnit = this.structureSystem?.getCanonicalBlockUnit?.((block?.stackIndex || 0) + 1) || {
            nudgeDistanceMin: 18,
            nudgeDistanceMax: 34,
            clampPadding: 10
        };
        const edgePadding = blockUnit.clampPadding + 4;

        const angle = random(TWO_PI);
        const distance = random(blockUnit.nudgeDistanceMin, blockUnit.nudgeDistanceMax);
        const proposed = {
            x: constrain(block.x + Math.cos(angle) * distance, region.minX + edgePadding, region.maxX - edgePadding),
            y: constrain(block.y + Math.sin(angle) * distance, region.minY + edgePadding, region.maxY - edgePadding)
        };
        return this.clampPlacementPoint(proposed.x, proposed.y, blockUnit.clampPadding);
    }

    findBlockPlacementTarget(butterfly, carriedBlock, candidateBlocks = this.getBlocksInZone(this.getEntityZoneId(carriedBlock, this.getEntityZoneId(butterfly, this.getFocusedZoneId())))) {
        if (!butterfly || !carriedBlock) return null;
        const physicsPlacement = this.physicsSystem?.resolveBlockPlacementRequest?.(
            butterfly,
            carriedBlock,
            null,
            candidateBlocks,
            {
                sceneState: this.gameState,
                safeDrop: false
            }
        ) || null;
        if (physicsPlacement) return physicsPlacement;
        const structuredPlacement = this.structureSystem?.findPlacementTargetForBlock?.(butterfly, carriedBlock, candidateBlocks);
        if (structuredPlacement) return structuredPlacement;
        const zoneId = this.getEntityZoneId(carriedBlock, this.getEntityZoneId(butterfly, this.getFocusedZoneId()));
        const region = this.getZonePlacementRegion(zoneId);
        if (!region) return null;

        const blockUnit = this.structureSystem?.getCanonicalBlockUnit?.((carriedBlock?.stackIndex || 0) + 1) || null;
        const carriedBlockMetrics = this.structureSystem?.getEntityMetrics?.(carriedBlock, 'block') || null;
        const spacing = blockUnit?.spacing || (Math.max(carriedBlockMetrics?.width || carriedBlock.renderWidth || 18, 18) * 0.9);
        const clampPadding = blockUnit?.clampPadding || 10;
        const edgePadding = clampPadding + 2;
        const outerEdgePadding = clampPadding + 4;
        const openBlocks = (candidateBlocks || [])
            .filter(block => block && block.id !== carriedBlock.id && !block.carriedById && this.getEntityZoneId(block, null) === zoneId);
        const snapshot = this.buildZoneLiveSectorSnapshot(zoneId, this.getFlowerSectorLayout());

        const isClear = (x, y, ignoreId = carriedBlock.id) => openBlocks.every(block => {
            if (block.id === ignoreId) return true;
            return Math.hypot(block.x - x, block.y - y) >= (spacing * 0.8);
        }) && this.canResolveFlowerConflictsForBlockPlacement(zoneId, { x, y }, carriedBlock);

        const chooseAnchor = () => {
            if (!openBlocks.length) return null;
            return openBlocks
                .slice()
                .sort((left, right) => {
                    const scoreBlock = (block) => {
                        const sectorKey = this.getZoneSectorKey(zoneId, block, snapshot.layout);
                        const distance = Math.hypot((block.x || 0) - butterfly.x, (block.y || 0) - butterfly.y);
                        const localCrowd = this.countNearbyButterflies(zoneId, block, 58, butterfly.id);
                        const recentPenalty = this.getEntityRecentAnchorPenalty(butterfly, `block:${block.id}`);
                        let score = 0;
                        score += Math.max(0, 0.6 - (distance / 160));
                        score += this.getSectorUnderuseBonus(snapshot, sectorKey) * 0.84;
                        score += this.getSectorNoveltyBonus(snapshot, sectorKey) * 0.68;
                        score -= Math.min(1, localCrowd / 4) * this.getButterflyDispersalConfig().localCrowdPenalty;
                        score -= recentPenalty * this.getButterflyDispersalConfig().recentSelfReusePenalty;
                        score += (block.stackIndex || 0) < 2 ? 0.05 : 0;
                        return score;
                    };
                    return scoreBlock(right) - scoreBlock(left);
                })[0] || null;
        };

        const anchor = chooseAnchor();
        if (anchor) {
            const canStack = (anchor.stackIndex || 0) < Math.max(1, (this.structureSystem?.getMaxStackHeight?.() || 3) - 1);
            if (canStack && random() < 0.44) {
                return {
                    x: anchor.x,
                    y: anchor.y,
                    stackIndex: (anchor.stackIndex || 0) + 1,
                    supportBlockId: anchor.id,
                    placementMode: 'stacked',
                    zoneId
                };
            }

            const offsets = [
                { x: spacing, y: 0 },
                { x: -spacing, y: 0 },
                { x: blockUnit?.diagonalOffsetX ?? (spacing * 0.62), y: blockUnit?.diagonalOffsetY ?? (spacing * 0.55) },
                { x: -(blockUnit?.diagonalOffsetX ?? (spacing * 0.62)), y: blockUnit?.diagonalOffsetY ?? (spacing * 0.55) },
                { x: 0, y: blockUnit?.forwardOffsetY ?? (spacing * 0.72) }
            ];

            for (const offset of offsets.sort(() => random() - 0.5)) {
                const proposed = this.clampPlacementPoint(
                    constrain(anchor.x + offset.x, region.minX + edgePadding, region.maxX - edgePadding),
                    constrain(anchor.y + offset.y, region.minY + edgePadding, region.maxY - edgePadding),
                    clampPadding
                );
                if (isClear(proposed.x, proposed.y)) {
                    return {
                        x: proposed.x,
                        y: proposed.y,
                        stackIndex: 0,
                        supportBlockId: anchor.id,
                        placementMode: 'connected',
                        zoneId
                    };
                }
            }
        }

        for (let attempt = 0; attempt < 8; attempt++) {
            const angle = random(TWO_PI);
            const distance = random(blockUnit?.groundFallbackMin || 20, blockUnit?.groundFallbackMax || 48);
            const proposed = this.clampPlacementPoint(
                constrain(butterfly.x + Math.cos(angle) * distance, region.minX + outerEdgePadding, region.maxX - outerEdgePadding),
                constrain(butterfly.y + Math.sin(angle) * distance, region.minY + outerEdgePadding, region.maxY - outerEdgePadding),
                clampPadding
            );
            if (isClear(proposed.x, proposed.y)) {
                return {
                    x: proposed.x,
                    y: proposed.y,
                    stackIndex: 0,
                    supportBlockId: null,
                    placementMode: 'ground',
                    zoneId
                };
            }
        }

        return null;
    }

    resolveZoneTravelArrivalTarget(zoneTravel) {
        if (!zoneTravel) return null;
        if (zoneTravel.arrivalTargetEntityId) {
            const arrivalTargetEntity = (this.gameState?.butterflies || []).find(
                butterfly => butterfly.id === zoneTravel.arrivalTargetEntityId
            );
            if (arrivalTargetEntity && this.getEntityZoneId(arrivalTargetEntity, null) === zoneTravel.targetZoneId) {
                return { x: arrivalTargetEntity.x, y: arrivalTargetEntity.y };
            }
        }
        return zoneTravel.arrivalTarget || null;
    }

    getZoneTravelSettleTarget(zoneTravel) {
        if (!zoneTravel) return null;
        const explicitTarget = this.resolveZoneTravelArrivalTarget(zoneTravel);
        if (explicitTarget) return explicitTarget;

        if (zoneTravel.arrivalSettleAnchor) {
            const clampedSettle = this.clampPlacementPointInZone(
                zoneTravel.targetZoneId,
                zoneTravel.arrivalSettleAnchor.x + random(-14, 14),
                zoneTravel.arrivalSettleAnchor.y + random(-12, 12),
                8,
                { allowDoorways: true }
            );
            if (clampedSettle) return clampedSettle;
            return zoneTravel.arrivalSettleAnchor;
        }

        const anchor = zoneTravel.arrivalVisibleAnchor
            || zoneTravel.targetAnchor
            || this.getZoneDoorwayAnchor(zoneTravel.targetZoneId, zoneTravel.sourceZoneId)
            || this.getZoneDoorwayAnchor(zoneTravel.targetZoneId);
        if (!anchor) {
            return this.getRandomPlacementPoint(zoneTravel.targetZoneId, 30)
                || this.getZoneCenter(zoneTravel.targetZoneId);
        }

        const inwardOffsets = {
            left: { x: 6, y: 22, driftX: 14, driftY: 4 },
            right: { x: -6, y: 22, driftX: 14, driftY: 4 },
            top: { x: 0, y: 18, driftX: 14, driftY: 4 },
            bottom: { x: 0, y: -18, driftX: 14, driftY: 4 },
            up: { x: 0, y: 18, driftX: 14, driftY: 4 },
            down: { x: 0, y: -18, driftX: 14, driftY: 4 }
        };
        const offset = inwardOffsets[anchor.direction || 'right'] || inwardOffsets.right;
        const targetX = anchor.x + offset.x + random(-offset.driftX, offset.driftX);
        const targetY = anchor.y + offset.y + random(-offset.driftY, offset.driftY);
        return this.clampPlacementPointInZone(zoneTravel.targetZoneId, targetX, targetY, 8, {
            allowDoorways: true
        }) || anchor;
    }

    startZoneTravel(butterfly, targetZoneId, reason = 'migration', options = {}) {
        if (!butterfly?.id || !targetZoneId) return false;
        const sourceZoneId = this.getEntityZoneId(butterfly, null);
        if (!sourceZoneId || sourceZoneId === targetZoneId) return false;

        const travelRoute = this.buildZoneTravelRoute(sourceZoneId, targetZoneId);
        if (!travelRoute?.departureVisibleAnchor || !travelRoute?.departureWarpAnchor) return false;

        const departureApproachAnchor = this.buildZoneTravelApproachAnchor(
            sourceZoneId,
            { x: butterfly.x, y: butterfly.y },
            travelRoute.departureVisibleAnchor,
            travelRoute.direction || 'right',
            { approachLane: travelRoute.departureApproachLane }
        );
        butterfly.zoneTravel = {
            sourceZoneId,
            targetZoneId,
            sourceAnchor: travelRoute.departureVisibleAnchor,
            targetAnchor: travelRoute.departureWarpAnchor,
            departureApproachAnchor,
            departureLineupAnchor: this.buildZoneTravelLineupAnchor(
                sourceZoneId,
                departureApproachAnchor,
                travelRoute.departureVisibleAnchor,
                travelRoute.direction || 'right',
                { lineupAnchor: travelRoute.departureLineupAnchor }
            ),
            departureVisibleAnchor: travelRoute.departureVisibleAnchor,
            departureCoverAnchor: travelRoute.departureCoverAnchor || travelRoute.departureVisibleAnchor,
            departureWarpAnchor: travelRoute.departureWarpAnchor,
            arrivalVisibleAnchor: travelRoute.arrivalVisibleAnchor || travelRoute.departureVisibleAnchor,
            arrivalCoverAnchor: travelRoute.arrivalCoverAnchor || travelRoute.arrivalVisibleAnchor || travelRoute.departureVisibleAnchor,
            arrivalWarpAnchor: travelRoute.arrivalWarpAnchor || travelRoute.departureWarpAnchor,
            arrivalSettleAnchor: travelRoute.arrivalSettleAnchor || null,
            phase: 'approaching',
            progressFrames: 0,
            reason,
            arrivalTargetEntityId: options.arrivalTargetEntityId || null,
            renderBehindCover: false
        };
        butterfly.stateData = butterfly.stateData || {};
        butterfly.stateData.zoneTravel = butterfly.zoneTravel;
        this.markButterflyZoneTravelStart(butterfly, sourceZoneId, targetZoneId, reason);
        if (typeof eventBus !== 'undefined' && GameEvents?.ZONE_TRAVEL_STARTED) {
            eventBus.emit(GameEvents.ZONE_TRAVEL_STARTED, {
                butterflyId: butterfly.id,
                butterflyLabel: butterfly.getDisplayName?.() || butterfly.personalityType || 'butterfly',
                fromZoneId: sourceZoneId,
                toZoneId: targetZoneId,
                reason
            });
        }
        return true;
    }

    updateZoneTravelers(deltaSeconds = gameConfig.simulation.fixedDeltaSeconds) {
        const migrationBalance = this.getMigrationBalance();
        const routeDurationFrames = migrationBalance.routeDurationFrames || 72;
        const arrivalSettleFrames = migrationBalance.arrivalSettleFrames || 54;
        const exitDurationFrames = migrationBalance.exitDurationFrames || routeDurationFrames;
        const travelStep = migrationBalance.travelStepPixels || 3.4;
        const gardenCruiseStep = Math.max(1.02, Math.min(1.28, travelStep * 0.34));
        const doorwayAlignStep = Math.max(gardenCruiseStep, Math.min(1.46, travelStep * 0.4));
        const arrivalCruiseStep = Math.max(0.98, Math.min(1.22, travelStep * 0.32));

        for (let i = (this.gameState.butterflies || []).length - 1; i >= 0; i--) {
            const butterfly = this.gameState.butterflies[i];
            const zoneTravel = butterfly?.zoneTravel;
            if (!zoneTravel) continue;

            if (zoneTravel.phase === 'approaching') {
                const approachAnchor = zoneTravel.departureApproachAnchor || zoneTravel.sourceAnchor;
                const approachDistance = Math.hypot(
                    (zoneTravel.sourceAnchor?.x ?? approachAnchor.x) - approachAnchor.x,
                    (zoneTravel.sourceAnchor?.y ?? approachAnchor.y) - approachAnchor.y
                );
                const requiresApproach = approachDistance >= 12
                    && Math.hypot((butterfly.x || 0) - approachAnchor.x, (butterfly.y || 0) - approachAnchor.y) >= 10;
                if (!requiresApproach) {
                    zoneTravel.phase = 'departing';
                    zoneTravel.progressFrames = 0;
                    zoneTravel.renderBehindCover = false;
                } else {
                    const dx = approachAnchor.x - butterfly.x;
                    const dy = approachAnchor.y - butterfly.y;
                    const distance = Math.hypot(dx, dy) || 1;
                    const dynamicApproachFrames = Math.max(
                        routeDurationFrames,
                        Math.ceil(approachDistance / Math.max(gardenCruiseStep, 0.1)) + 10
                    );
                    butterfly.x += (dx / distance) * Math.min(gardenCruiseStep, distance);
                    butterfly.y += (dy / distance) * Math.min(gardenCruiseStep, distance);
                    zoneTravel.progressFrames++;
                    zoneTravel.renderBehindCover = false;
                    if (zoneTravel.progressFrames >= dynamicApproachFrames || Math.hypot(butterfly.x - approachAnchor.x, butterfly.y - approachAnchor.y) < 6) {
                        const lineupAnchor = zoneTravel.departureLineupAnchor;
                        const needsLineup = lineupAnchor
                            && Math.hypot(lineupAnchor.x - approachAnchor.x, lineupAnchor.y - approachAnchor.y) >= 18
                            && Math.hypot((butterfly.x || 0) - lineupAnchor.x, (butterfly.y || 0) - lineupAnchor.y) >= 10;
                        zoneTravel.phase = needsLineup ? 'lining-up' : 'departing';
                        zoneTravel.progressFrames = 0;
                    }
                }
            } else if (zoneTravel.phase === 'lining-up') {
                const lineupAnchor = zoneTravel.departureLineupAnchor || zoneTravel.sourceAnchor;
                const dx = lineupAnchor.x - butterfly.x;
                const dy = lineupAnchor.y - butterfly.y;
                const distance = Math.hypot(dx, dy) || 1;
                const lineupSegmentDistance = Math.hypot(
                    (zoneTravel.departureApproachAnchor?.x ?? butterfly.x) - lineupAnchor.x,
                    (zoneTravel.departureApproachAnchor?.y ?? butterfly.y) - lineupAnchor.y
                );
                const dynamicLineupFrames = Math.max(
                    routeDurationFrames,
                    Math.ceil(lineupSegmentDistance / Math.max(gardenCruiseStep, 0.1)) + 10
                );
                butterfly.x += (dx / distance) * Math.min(gardenCruiseStep, distance);
                butterfly.y += (dy / distance) * Math.min(gardenCruiseStep, distance);
                zoneTravel.progressFrames++;
                zoneTravel.renderBehindCover = false;
                const lineupDistance = Math.hypot(butterfly.x - lineupAnchor.x, butterfly.y - lineupAnchor.y);
                if (zoneTravel.progressFrames >= dynamicLineupFrames || lineupDistance < 6) {
                    zoneTravel.phase = 'departing';
                    zoneTravel.progressFrames = 0;
                }
            } else if (zoneTravel.phase === 'exiting') {
                const warpAnchor = zoneTravel.departureWarpAnchor || zoneTravel.targetAnchor || zoneTravel.sourceAnchor;
                const dx = warpAnchor.x - butterfly.x;
                const dy = warpAnchor.y - butterfly.y;
                const distance = Math.hypot(dx, dy) || 1;
                butterfly.x += (dx / distance) * Math.min(travelStep * 0.72, distance);
                butterfly.y += (dy / distance) * Math.min(travelStep * 0.72, distance);
                zoneTravel.progressFrames++;
                zoneTravel.renderBehindCover = true;
                if (zoneTravel.progressFrames >= exitDurationFrames || Math.hypot(butterfly.x - warpAnchor.x, butterfly.y - warpAnchor.y) < 8) {
                    if (typeof eventBus !== 'undefined' && GameEvents?.ZONE_TRAVEL_COMPLETED) {
                        eventBus.emit(GameEvents.ZONE_TRAVEL_COMPLETED, {
                            butterflyId: butterfly.id,
                            butterflyLabel: butterfly.getDisplayName?.() || butterfly.personalityType || 'butterfly',
                            fromZoneId: zoneTravel.sourceZoneId,
                            toZoneId: null,
                            reason: zoneTravel.reason
                        });
                    }
                    this.removeButterflyFromGame(butterfly);
                    continue;
                }
            } else if (zoneTravel.phase === 'departing') {
                const dx = zoneTravel.sourceAnchor.x - butterfly.x;
                const dy = zoneTravel.sourceAnchor.y - butterfly.y;
                const distance = Math.hypot(dx, dy) || 1;
                const corridorCommitDistance = Math.hypot(
                    (zoneTravel.departureLineupAnchor?.x ?? butterfly.x) - zoneTravel.sourceAnchor.x,
                    (zoneTravel.departureLineupAnchor?.y ?? butterfly.y) - zoneTravel.sourceAnchor.y
                );
                const dynamicDoorwayFrames = Math.max(
                    routeDurationFrames,
                    Math.ceil(corridorCommitDistance / Math.max(doorwayAlignStep, 0.1)) + 10
                );
                butterfly.x += (dx / distance) * Math.min(doorwayAlignStep, distance);
                butterfly.y += (dy / distance) * Math.min(doorwayAlignStep, distance);
                zoneTravel.progressFrames++;
                zoneTravel.renderBehindCover = false;
                const doorwayDistance = Math.hypot(butterfly.x - zoneTravel.sourceAnchor.x, butterfly.y - zoneTravel.sourceAnchor.y);
                const reachedDoorway = doorwayDistance < 8;
                const timedOutNearDoorway = zoneTravel.progressFrames >= dynamicDoorwayFrames && doorwayDistance < 24;
                if (reachedDoorway || timedOutNearDoorway) {
                    const coverAnchor = zoneTravel.departureCoverAnchor;
                    const hasDistinctCover = coverAnchor
                        && Math.hypot(coverAnchor.x - zoneTravel.sourceAnchor.x, coverAnchor.y - zoneTravel.sourceAnchor.y) >= 6;
                    zoneTravel.phase = hasDistinctCover ? 'tucking' : (zoneTravel.targetZoneId ? 'warping' : 'exiting');
                    zoneTravel.progressFrames = 0;
                }
            } else if (zoneTravel.phase === 'tucking') {
                const coverAnchor = zoneTravel.departureCoverAnchor || zoneTravel.departureWarpAnchor || zoneTravel.sourceAnchor;
                const dx = coverAnchor.x - butterfly.x;
                const dy = coverAnchor.y - butterfly.y;
                const distance = Math.hypot(dx, dy) || 1;
                butterfly.x += (dx / distance) * Math.min(travelStep * 0.86, distance);
                butterfly.y += (dy / distance) * Math.min(travelStep * 0.86, distance);
                zoneTravel.progressFrames++;
                zoneTravel.renderBehindCover = true;
                if (zoneTravel.progressFrames >= exitDurationFrames || Math.hypot(butterfly.x - coverAnchor.x, butterfly.y - coverAnchor.y) < 8) {
                    zoneTravel.phase = zoneTravel.targetZoneId ? 'warping' : 'exiting';
                    zoneTravel.progressFrames = 0;
                }
            } else if (zoneTravel.phase === 'warping') {
                const warpAnchor = zoneTravel.departureWarpAnchor || zoneTravel.targetAnchor || zoneTravel.sourceAnchor;
                const dx = warpAnchor.x - butterfly.x;
                const dy = warpAnchor.y - butterfly.y;
                const distance = Math.hypot(dx, dy) || 1;
                butterfly.x += (dx / distance) * Math.min(travelStep * 0.72, distance);
                butterfly.y += (dy / distance) * Math.min(travelStep * 0.72, distance);
                zoneTravel.progressFrames++;
                zoneTravel.renderBehindCover = true;
                if (zoneTravel.progressFrames >= exitDurationFrames || Math.hypot(butterfly.x - warpAnchor.x, butterfly.y - warpAnchor.y) < 8) {
                    this.assignEntityToZone(butterfly, zoneTravel.targetZoneId);
                    butterfly.x = zoneTravel.arrivalWarpAnchor?.x ?? warpAnchor.x;
                    butterfly.y = zoneTravel.arrivalWarpAnchor?.y ?? warpAnchor.y;
                    zoneTravel.phase = 'entering';
                    zoneTravel.progressFrames = 0;
                    zoneTravel.arrivalTarget = this.getZoneTravelSettleTarget(zoneTravel)
                        || zoneTravel.arrivalVisibleAnchor
                        || zoneTravel.targetAnchor;
                }
            } else if (zoneTravel.phase === 'entering') {
                const coverAnchor = zoneTravel.arrivalCoverAnchor || zoneTravel.arrivalVisibleAnchor || zoneTravel.sourceAnchor;
                const dx = coverAnchor.x - butterfly.x;
                const dy = coverAnchor.y - butterfly.y;
                const distance = Math.hypot(dx, dy) || 1;
                butterfly.x += (dx / distance) * Math.min(travelStep * 0.72, distance);
                butterfly.y += (dy / distance) * Math.min(travelStep * 0.72, distance);
                zoneTravel.progressFrames++;
                zoneTravel.renderBehindCover = true;
                if (zoneTravel.progressFrames >= exitDurationFrames || Math.hypot(butterfly.x - coverAnchor.x, butterfly.y - coverAnchor.y) < 8) {
                    const visibleAnchor = zoneTravel.arrivalVisibleAnchor || coverAnchor;
                    const hasDistinctVisible = visibleAnchor
                        && Math.hypot(visibleAnchor.x - coverAnchor.x, visibleAnchor.y - coverAnchor.y) >= 6;
                    zoneTravel.phase = hasDistinctVisible ? 'emerging' : 'arriving';
                    zoneTravel.progressFrames = 0;
                    zoneTravel.renderBehindCover = hasDistinctVisible;
                }
            } else if (zoneTravel.phase === 'emerging') {
                const visibleAnchor = zoneTravel.arrivalVisibleAnchor || zoneTravel.arrivalCoverAnchor || zoneTravel.sourceAnchor;
                const dx = visibleAnchor.x - butterfly.x;
                const dy = visibleAnchor.y - butterfly.y;
                const distance = Math.hypot(dx, dy) || 1;
                butterfly.x += (dx / distance) * Math.min(doorwayAlignStep, distance);
                butterfly.y += (dy / distance) * Math.min(doorwayAlignStep, distance);
                zoneTravel.progressFrames++;
                zoneTravel.renderBehindCover = true;
                if (zoneTravel.progressFrames >= exitDurationFrames || Math.hypot(butterfly.x - visibleAnchor.x, butterfly.y - visibleAnchor.y) < 8) {
                    zoneTravel.phase = 'arriving';
                    zoneTravel.progressFrames = 0;
                    zoneTravel.renderBehindCover = false;
                }
            } else if (zoneTravel.phase === 'arriving') {
                const zoneCenter = this.getZoneTravelSettleTarget(zoneTravel)
                    || zoneTravel.arrivalVisibleAnchor
                    || zoneTravel.targetAnchor;
                const dx = zoneCenter.x - butterfly.x;
                const dy = zoneCenter.y - butterfly.y;
                const distance = Math.hypot(dx, dy) || 1;
                butterfly.x += (dx / distance) * Math.min(arrivalCruiseStep, distance);
                butterfly.y += (dy / distance) * Math.min(arrivalCruiseStep, distance);
                zoneTravel.progressFrames++;
                zoneTravel.renderBehindCover = false;
                if (zoneTravel.progressFrames >= arrivalSettleFrames || Math.hypot(butterfly.x - zoneCenter.x, butterfly.y - zoneCenter.y) < 10) {
                    if (typeof eventBus !== 'undefined' && GameEvents?.ZONE_TRAVEL_COMPLETED) {
                        eventBus.emit(GameEvents.ZONE_TRAVEL_COMPLETED, {
                            butterflyId: butterfly.id,
                            butterflyLabel: butterfly.getDisplayName?.() || butterfly.personalityType || 'butterfly',
                            fromZoneId: zoneTravel.sourceZoneId,
                            toZoneId: zoneTravel.targetZoneId,
                            reason: zoneTravel.reason
                        });
                    }
                    this.completeButterflyZoneTravel(
                        butterfly,
                        zoneTravel.sourceZoneId,
                        zoneTravel.targetZoneId,
                        zoneTravel.reason
                    );
                    butterfly.zoneTravel = null;
                    if (butterfly.stateData?.zoneTravel) {
                        delete butterfly.stateData.zoneTravel;
                    }
                    if (!this.seedZoneTravelRecoveryMovement(butterfly, zoneTravel)) {
                        butterfly.pickNewWanderTarget?.();
                    }
                }
            }
            butterfly.gridPos = this.gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
            butterfly.updateZIndex?.();
        }
    }

    resolveButterflySeparation(sceneState = this.gameState) {
        // When physicsSystem is live, contact resolution is deferred to its
        // ordered update pass so butterflies are not pushed, then re-corrected,
        // by multiple owners in the same frame.
        if (this.physicsSystem?.initialized) {
            return;
        }

        if (this.physicsSystem?.resolveButterflyContacts?.(sceneState)) {
            return;
        }

        const butterflies = sceneState?.butterflies || [];
        if (butterflies.length < 2) return;

        const groupedByZone = new Map();
        for (const butterfly of butterflies) {
            if (!butterfly?.id || butterfly.isSpawning || butterfly.zoneTravel) continue;
            const sleepState = butterfly.getSleepState?.();
            if (sleepState?.subtype) continue;
            const zoneId = this.getEntityZoneId(butterfly, null) || 'default';
            if (!groupedByZone.has(zoneId)) groupedByZone.set(zoneId, []);
            groupedByZone.get(zoneId).push(butterfly);
        }

        for (const zoneButterflies of groupedByZone.values()) {
            for (let i = 0; i < zoneButterflies.length; i++) {
                const left = zoneButterflies[i];
                for (let j = i + 1; j < zoneButterflies.length; j++) {
                    const right = zoneButterflies[j];
                    const dx = (right.x || 0) - (left.x || 0);
                    const dy = (right.y || 0) - (left.y || 0);
                    const distance = Math.hypot(dx, dy);
                    const leftMetrics = this.structureSystem?.getEntityMetrics?.(left, 'butterfly') || null;
                    const rightMetrics = this.structureSystem?.getEntityMetrics?.(right, 'butterfly') || null;
                    const minDistance = Math.max(
                        11,
                        (
                            (leftMetrics?.separationDistance || 11)
                            + (rightMetrics?.separationDistance || 11)
                        ) * 0.5
                    );
                    if (distance >= minDistance) continue;

                    const nx = distance > 0.001 ? dx / distance : (random() < 0.5 ? -1 : 1);
                    const ny = distance > 0.001 ? dy / distance : (random() < 0.5 ? -0.5 : 0.5);
                    const push = (minDistance - Math.max(distance, 0.001)) * 0.52;

                    left.x -= nx * push * 0.5;
                    left.y -= ny * push * 0.5;
                    right.x += nx * push * 0.5;
                    right.y += ny * push * 0.5;

                    const leftClamped = this.clampScreenPointToRoamArea(left.x, left.y + (left.shadowOffset || 0), 8);
                    left.x = leftClamped.x;
                    left.y = leftClamped.y - (left.shadowOffset || 0);
                    left.gridPos = this.gridManager.screenToIso(left.x, left.y + (left.shadowOffset || 0));
                    left.updateZIndex?.();

                    const rightClamped = this.clampScreenPointToRoamArea(right.x, right.y + (right.shadowOffset || 0), 8);
                    right.x = rightClamped.x;
                    right.y = rightClamped.y - (right.shadowOffset || 0);
                    right.gridPos = this.gridManager.screenToIso(right.x, right.y + (right.shadowOffset || 0));
                    right.updateZIndex?.();
                }
            }
        }
    }

    updateZoneEcology(deltaSeconds = gameConfig.simulation.fixedDeltaSeconds) {
        if (!this.isSectionSceneWorld()) return;
        this.rebalanceSectionEcology();
        this.updateWildButterflyDepartures();
        this.updateWildButterflyArrivals();
        this.updateZoneTravelers(deltaSeconds);

        const migrationBalance = this.getMigrationBalance();
        if (migrationBalance.autoHabitatTravel === false) return;
        const decisionIntervalFrames = migrationBalance.decisionIntervalFrames || 600;
        const maxConcurrentTravelers = migrationBalance.maxConcurrentTravelers || 4;
        const mismatchThreshold = migrationBalance.mismatchThreshold || 0.22;
        if (frameCount % decisionIntervalFrames !== 0) return;

        const activeTravelers = (this.gameState.butterflies || []).filter(butterfly => butterfly.zoneTravel).length;
        if (activeTravelers >= maxConcurrentTravelers) return;

        const zoneIds = this.getZoneIds();
        const scoringContext = this.buildZoneTravelScoringContext(zoneIds);
        const snapshot = scoringContext.snapshot;
        const overcrowdingBias = migrationBalance.overcrowdingBias || 0.35;
        const candidates = (this.gameState.butterflies || [])
            .filter(butterfly =>
                this.isZoneEcologyManagedButterfly(butterfly) &&
                !butterfly.zoneTravel &&
                !butterfly.wildLifecycle?.exitQueued &&
                butterfly.state !== 'mating' &&
                butterfly.state !== 'pregnant-travel'
            )
            .map(butterfly => {
                const currentZoneId = this.getEntityZoneId(butterfly, null);
                const currentScore = this.scoreButterflyForZone(butterfly, currentZoneId, {
                    ...scoringContext,
                    currentZoneId
                });
                let bestTargetZoneId = currentZoneId;
                let bestScore = currentScore;
                for (const zoneId of zoneIds) {
                    if (zoneId === currentZoneId) continue;
                    const zoneCrowdingPenalty = (snapshot[zoneId]?.butterflies || 0) * overcrowdingBias * 0.08;
                    const score = this.scoreButterflyForZone(butterfly, zoneId, {
                        ...scoringContext,
                        currentZoneId
                    }) - zoneCrowdingPenalty;
                    if (score > bestScore) {
                        bestScore = score;
                        bestTargetZoneId = zoneId;
                    }
                }
                return {
                    butterfly,
                    currentZoneId,
                    bestTargetZoneId,
                    scoreDelta: bestScore - currentScore,
                    travelReason: this.determineButterflyTravelReason(
                        butterfly,
                        currentZoneId,
                        bestTargetZoneId,
                        {
                            currentZoneEcology: scoringContext.zoneEcologyByZone?.[currentZoneId] || null,
                            targetZoneEcology: scoringContext.zoneEcologyByZone?.[bestTargetZoneId] || null
                        }
                    )
                };
            })
            .filter(entry => entry.bestTargetZoneId && entry.bestTargetZoneId !== entry.currentZoneId && entry.scoreDelta >= mismatchThreshold)
            .sort((left, right) => right.scoreDelta - left.scoreDelta);

        const openSlots = Math.max(0, maxConcurrentTravelers - activeTravelers);
        for (const entry of candidates.slice(0, openSlots)) {
            this.startZoneTravel(entry.butterfly, entry.bestTargetZoneId, entry.travelReason || 'migration');
        }
    }
    
    registerEntityWithFoundationSystems(entity, entityType) {
        if (!entity?.id) return;

        if (entityType === 'butterfly' || entityType === 'caterpillar') {
            this.physicsSystem?.registerEntity?.(entity, entityType);
            this.behaviorSystem?.registerEntity(entity);
            this.sleepSystem?.registerEntity(entity);
            this.statusSystem?.registerEntity(entity);
            this.teachingSystem?.registerEntity(entity);
            this.communicationSystem?.registerEntity(entity);
            this.mlInferenceSystem?.registerEntity(entity);
            if (entityType === 'butterfly') {
                this.rosterSystem?.registerButterfly?.(entity, this.gameState);
            }
        }

        if (entityType === 'flower') {
            this.objectSystem?.registerObject(entity, { type: 'flower', consumable: true });
        }

        if (entityType === 'block') {
            this.physicsSystem?.registerEntity?.(entity, 'block');
            this.objectSystem?.registerObject(entity, { type: 'block', carryable: true });
        }
    }
    
    unregisterEntityFromFoundationSystems(entity) {
        if (!entity?.id) return;

        this.physicsSystem?.unregisterEntity?.(entity.id);
        this.behaviorSystem?.unregisterEntity?.(entity.id);
        this.sleepSystem?.unregisterEntity?.(entity.id);
        this.statusSystem?.unregisterEntity?.(entity.id);
        this.objectSystem?.unregisterObject?.(entity.id);
        this.teachingSystem?.unregisterEntity?.(entity.id);
        this.communicationSystem?.unregisterEntity?.(entity.id);
        this.mlInferenceSystem?.unregisterEntity?.(entity.id);
        this.rosterSystem?.unregisterButterfly?.(entity.id, this.gameState);
    }
    
    resetFoundationSystems(options = {}) {
        if (this.zoneSystem?.setViewMode) {
            this.zoneSystem.setViewMode('focused-garden');
        }
        this.behaviorSystem?.reset?.();
        this.structureSystem?.reset?.();
        this.physicsSystem?.reset?.();
        this.sleepSystem?.reset?.();
        this.lifeSimSystem?.reset?.();
        this.statProfileSystem?.reset?.();
        this.mlInferenceSystem?.reset?.();
        this.rosterSystem?.reset?.(this.gameState);
        this.statusSystem?.reset?.();
        this.objectSystem?.reset?.();
        this.teachingSystem?.reset?.();
        this.communicationSystem?.reset?.();
        this.battleSystem?.reset?.();
        if (!options.preserveTelemetry) {
            this.telemetrySystem?.reset?.();
        }
    }
    
    updateEntities(sceneState = this.gameState) {
        const butterflies = sceneState?.butterflies || [];
        for (let i = butterflies.length - 1; i >= 0; i--) {
            const butterfly = butterflies[i];
            butterfly.update(sceneState);
            
            if (butterfly.isDead()) {
                this.handleButterflyDeath(butterfly);
                this.removeButterflyFromGame(butterfly);
            }
        }
        this.resolveButterflySeparation(sceneState);
    }

    updateCaterpillars(sceneState = this.gameState) {
        const caterpillars = sceneState?.caterpillars || [];
        for (let i = caterpillars.length - 1; i >= 0; i--) {
            const caterpillar = caterpillars[i];
            caterpillar.update(sceneState);
            if (caterpillar.isDead()) {
                if (caterpillar.failReason === 'starved' && caterpillar.lifecycleData?.reservationActive) {
                    this.gameState.pendingOffspringReservations = Math.max(0, this.gameState.pendingOffspringReservations - 1);
                }
                this.unregisterEntityFromFoundationSystems(caterpillar);
                const globalIndex = this.gameState.caterpillars.indexOf(caterpillar);
                if (globalIndex >= 0) {
                    this.gameState.caterpillars.splice(globalIndex, 1);
                }
            }
        }
    }
    
    // Dynamic flower spawning based on butterfly population
    updateFlowerSpawning(sceneState = this.gameState) {
        const zoneIds = this.getZoneIds();
        if (!zoneIds.length) return;

        const checkInterval = 180;
        if (frameCount % checkInterval !== 0) return;

        for (const zoneId of zoneIds) {
            const activeFlowers = (sceneState?.flowers || []).filter(flower =>
                this.getEntityZoneId(flower, null) === zoneId && flower?.stage !== 'dissolve'
            );
            const activeButterflies = (sceneState?.butterflies || []).filter(butterfly => this.getEntityZoneId(butterfly, null) === zoneId);
            const zoneState = this.zoneSystem?.getZoneEcologyState?.(zoneId) || {};
            const spawnTargets = this.getZoneFlowerSpawnTargets(zoneId, {
                flowers: activeFlowers,
                butterflies: activeButterflies
            });
            let normalFlowerCount = spawnTargets.normalFlowerCount;
            const canSpendReserve = (zoneState.resourceReserve ?? 0.5) > ((zoneState.recoveryFloor ?? 0.22) + 0.02);

            while (normalFlowerCount < spawnTargets.floorTarget) {
                const recovered = this.spawnEphemeralFlower(zoneId, {
                    emergency: true,
                    resourceOrigin: 'floor-recovery'
                });
                if (!recovered) break;
                normalFlowerCount += 1;
            }

            if (normalFlowerCount < spawnTargets.minNormalFlowers && canSpendReserve) {
                const recovered = this.spawnEphemeralFlower(zoneId, {
                    resourceOrigin: 'reserve-recovery'
                });
                if (recovered) continue;
            }

            if (normalFlowerCount < spawnTargets.maxNormalFlowers && canSpendReserve && random() < spawnTargets.recoveryChance) {
                this.spawnEphemeralFlower(zoneId, {
                    resourceOrigin: 'habitat-recovery'
                });
            }
        }
    }
    
    // Helper method to spawn an ephemeral flower
    spawnEphemeralFlower(zoneId = this.getFocusedZoneId(), options = {}) {
        const candidateFlowers = (this.gameState.flowers || []).filter(flower => this.getEntityZoneId(flower, null) === zoneId);
        const newFlower = this.spawnFlowerAt(zoneId, null, null, {
            candidateFlowers,
            maxAttempts: options.emergency ? 36 : 28,
            resourceOrigin: options.resourceOrigin || 'ephemeral'
        });
        
        if (newFlower) {
            this.recordZoneFlowerSpawn(zoneId, options);
            
            // Magical appearance effect
            this.particleSystem.emitBurst(newFlower.x, newFlower.y, [255, 255, 200], 12);
            
            const totalFlowers = this.gameState.flowers.length;
            const ephemeralFlowers = this.gameState.flowers.filter(f => !f.isImmortal).length;
            console.log(`🌺 Ephemeral flower spawned! Total: ${totalFlowers} (${ephemeralFlowers} ephemeral)`);
        } else {
            console.log(`   ❌ Could not find valid position for flower`);
        }
    }
    
    // Find a valid position for flower spawning with advanced constraints
    findValidFlowerPosition(candidateFlowers = this.gameState.flowers, zoneId = this.getFocusedZoneId(), options = {}) {
        const maxAttempts = options.maxAttempts || 30;
        const interactionSpace = options.interactionSpace || this.getFlowerInteractionSpace(zoneId, options);
        const minDistance = options.minDistance || gameConfig?.entities?.flower?.spawnMinDistance || 40;
        const preferredDistance = interactionSpace.preferredDistance || gameConfig?.entities?.flower?.preferredSpacing || Math.max(minDistance + 32, 80);
        const doorwayRadius = interactionSpace.doorwayAvoidRadius || gameConfig?.entities?.flower?.placementAvoidDoorwayRadius || 52;
        const blockRadius = interactionSpace.blockAvoidRadius || gameConfig?.entities?.flower?.placementAvoidBlockRadius || 24;
        const preferredPoint = options.preferredPoint || null;
        const avoidPoint = options.avoidPoint || null;
        const avoidRadius = options.avoidRadius || 0;
        const layout = this.getFlowerSectorLayout();
        const sectorOccupancy = this.buildZoneSectorOccupancy(zoneId, candidateFlowers, layout);
        const zoneBlocks = this.getBlocksInZone(zoneId).filter(block => !block?.carriedById);
        const zoneButterflies = this.getButterfliesInZone(zoneId);
        const butterflyOccupancy = this.buildZoneSectorOccupancy(zoneId, zoneButterflies, layout);
        let bestPosition = null;
        let bestScore = -Infinity;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const sampledPoint = preferredPoint && attempt < Math.floor(maxAttempts / 3)
                ? {
                    x: preferredPoint.x + random(-interactionSpace.preferredJitterX, interactionSpace.preferredJitterX),
                    y: preferredPoint.y + random(-interactionSpace.preferredJitterY, interactionSpace.preferredJitterY)
                }
                : attempt < (layout.cols * layout.rows)
                    ? this.getZoneSectorSamplePoint(zoneId, attempt, layout, {
                        padding: interactionSpace.clampPadding
                    })
                    : this.getRandomPlacementPoint(zoneId, interactionSpace.randomPadding);
            if (!sampledPoint) continue;
            const screenPos = this.clampPlacementPointInZone(zoneId, sampledPoint.x, sampledPoint.y, interactionSpace.clampPadding);
            
            let minDistToFlower = Infinity;
            let tooClose = false;
            for (let flower of candidateFlowers) {
                const dist = Math.hypot(screenPos.x - flower.x, screenPos.y - flower.y);
                if (dist < minDistance) {
                    tooClose = true;
                    break;
                }
                minDistToFlower = Math.min(minDistToFlower, dist);
            }
            
            if (tooClose) continue;
            if (
                avoidPoint
                && Number.isFinite(avoidPoint.x)
                && Number.isFinite(avoidPoint.y)
                && Math.hypot(screenPos.x - avoidPoint.x, screenPos.y - avoidPoint.y) < avoidRadius
            ) {
                continue;
            }

            let blockPenalty = 0;
            for (const block of zoneBlocks) {
                if (Math.hypot(screenPos.x - (block.x || 0), screenPos.y - (block.y || 0)) < blockRadius) {
                    blockPenalty += 0.8;
                }
            }
            if (blockPenalty >= 0.8) continue;

            if (this.isPointNearZoneDoorway(zoneId, screenPos, doorwayRadius)) {
                continue;
            }

            const distToPreferred = preferredPoint ? Math.hypot(screenPos.x - preferredPoint.x, screenPos.y - preferredPoint.y) : 0;
            const sectorKey = this.getZoneSectorKey(zoneId, screenPos, layout);
            const sectorLoad = sectorKey ? (sectorOccupancy.get(sectorKey) || 0) : 0;
            const butterflySectorLoad = sectorKey ? (butterflyOccupancy.get(sectorKey) || 0) : 0;
            const nearbyButterflies = this.countNearbyButterflies(zoneId, screenPos, interactionSpace.nearbyButterflyRadius);

            let score = 0;
            score += Math.min(minDistToFlower, preferredDistance) / Math.max(1, preferredDistance);
            score += Math.max(0, 0.62 - (sectorLoad * 0.2));
            score -= butterflySectorLoad * 0.22;
            score -= nearbyButterflies * 0.08;
            if (preferredPoint) {
                score += Math.max(0, 0.4 - (distToPreferred / 180));
            }
            score += random(-0.08, 0.08);
            
            if (score > bestScore) {
                bestScore = score;
                bestPosition = screenPos;
            }
        }
        
        return bestPosition;
    }

    getFlowerBlockPlacementAvoidRadius(block = null, options = {}) {
        const interactionSpace = options.interactionSpace
            || this.getFlowerInteractionSpace(options.zoneId || block?.currentZoneId || this.getFocusedZoneId(), options);
        const configuredRadius = options.radius
            || gameConfig?.entities?.block?.placementAvoidFlowerRadius
            || Math.max(gameConfig?.entities?.flower?.placementAvoidBlockRadius || 14, 20);
        const blockMetrics = block
            ? this.structureSystem?.getEntityMetrics?.(block, 'block')
            : null;
        return Math.max(configuredRadius, blockMetrics?.occupancyRadius || 0, interactionSpace?.blockAvoidRadius || 0);
    }

    getFlowersBlockingBlockPlacement(zoneId, point, block = null, options = {}) {
        if (!zoneId || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return [];
        const ignoreFlowerIds = new Set(options.ignoreFlowerIds || []);
        const radius = this.getFlowerBlockPlacementAvoidRadius(block, options);
        return this.getFlowersInZone(zoneId)
            .filter(flower =>
                flower
                && !ignoreFlowerIds.has(flower.id)
                && flower.stage !== 'dissolve'
                && (flower.occupancyState || 'normal') === 'normal'
                && Math.hypot((flower.x || 0) - point.x, (flower.y || 0) - point.y) < radius
            )
            .sort((left, right) =>
                Math.hypot((left.x || 0) - point.x, (left.y || 0) - point.y)
                - Math.hypot((right.x || 0) - point.x, (right.y || 0) - point.y)
            );
    }

    findFlowerRelocationTarget(flower, zoneId, options = {}) {
        if (!flower?.id || !zoneId) return null;
        const currentPoint = { x: flower.x || 0, y: flower.y || 0 };
        const avoidPoint = options.avoidPoint || null;
        const interactionSpace = options.interactionSpace || this.getFlowerInteractionSpace(zoneId, {
            entity: flower,
            occupancyState: flower.occupancyState || 'normal'
        });
        const preferredDistance = options.preferredDistance || interactionSpace.relocationStepDistance || 34;
        const candidateFlowers = this.getFlowersInZone(zoneId)
            .filter(entry => entry?.id && entry.id !== flower.id && entry.stage !== 'dissolve');

        let preferredPoint = null;
        if (avoidPoint && Number.isFinite(avoidPoint.x) && Number.isFinite(avoidPoint.y)) {
            const dx = currentPoint.x - avoidPoint.x;
            const dy = currentPoint.y - avoidPoint.y;
            const length = Math.hypot(dx, dy) || 1;
            preferredPoint = this.clampPlacementPointInZone(
                zoneId,
                currentPoint.x + ((dx / length) * preferredDistance),
                currentPoint.y + ((dy / length) * preferredDistance),
                interactionSpace.clampPadding
            );
        }

        return this.findValidFlowerPosition(candidateFlowers, zoneId, {
            preferredPoint,
            avoidPoint,
            avoidRadius: Math.max(
                this.getFlowerBlockPlacementAvoidRadius(options.block || null, {
                    ...options,
                    zoneId,
                    interactionSpace
                }),
                preferredDistance
            ),
            minDistance: options.minDistance || gameConfig?.entities?.flower?.spawnMinDistance || 40,
            maxAttempts: options.maxAttempts || 20,
            interactionSpace
        });
    }

    canResolveFlowerConflictsForBlockPlacement(zoneId, point, block = null, options = {}) {
        if (!zoneId || !point) return false;
        const interactionSpace = options.interactionSpace || this.getFlowerInteractionSpace(zoneId);
        const blockingFlowers = this.getFlowersBlockingBlockPlacement(zoneId, point, block, options);
        if (!blockingFlowers.length) return true;
        return blockingFlowers.every(flower =>
            !!this.findFlowerRelocationTarget(flower, zoneId, {
                avoidPoint: point,
                block,
                preferredDistance: options.preferredDistance || interactionSpace.relocationStepDistance || 34,
                minDistance: options.minDistance,
                maxAttempts: options.maxAttempts,
                interactionSpace
            })
        );
    }

    relocateFlowersForBlockPlacement(actor, zoneId, point, block = null, options = {}) {
        if (!zoneId || !point) {
            return { moved: false, movedFlowerIds: [], failedFlowerIds: [] };
        }
        const interactionSpace = options.interactionSpace || this.getFlowerInteractionSpace(zoneId);
        const blockingFlowers = this.getFlowersBlockingBlockPlacement(zoneId, point, block, options);
        if (!blockingFlowers.length) {
            return { moved: true, movedFlowerIds: [], failedFlowerIds: [] };
        }

        const movedFlowerIds = [];
        const failedFlowerIds = [];
        for (const flower of blockingFlowers) {
            const target = this.findFlowerRelocationTarget(flower, zoneId, {
                avoidPoint: point,
                block,
                preferredDistance: options.preferredDistance || interactionSpace.relocationStepDistance || 34,
                minDistance: options.minDistance,
                maxAttempts: options.maxAttempts,
                interactionSpace
            });
            if (!target) {
                failedFlowerIds.push(flower.id);
                continue;
            }

            const from = { x: flower.x || 0, y: flower.y || 0 };
            flower.x = target.x;
            flower.y = target.y;
            flower.gridPos = gridManager.screenToIso(flower.x, flower.y);
            flower.currentZoneId = zoneId;
            flower.updateZIndex?.();
            objectSystem?.recordInteraction?.(flower.id, 'relocated for block placement', actor?.id || null, {
                fromX: from.x,
                fromY: from.y,
                movedX: flower.x,
                movedY: flower.y,
                zoneId,
                blockId: block?.id || null
            });
            objectSystem?.syncEntityProfile?.(flower);
            this.particleSystem?.emitBurst?.(from.x, from.y - 2, [255, 222, 150], 3);
            this.particleSystem?.emitBurst?.(flower.x, flower.y - 2, [150, 255, 188], 3);
            movedFlowerIds.push(flower.id);
        }

        return {
            moved: failedFlowerIds.length === 0,
            movedFlowerIds,
            failedFlowerIds
        };
    }
    
    // Main draw method
    draw() {
        if (!this.gameState.initialized) {
            this.drawLoadingScreen();
            return;
        }

        const renderStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        // Use render manager for all drawing
        const renderBreakdown = this.renderManager.render() || {};
        const totalRenderMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - renderStart;
        const particleStats = this.particleSystem?.getRenderStats?.() || {};
        const pressureProfile = this.telemetrySystem?.getPressureProfile?.() || null;
        this.telemetrySystem?.recordRenderSample?.({
            totalRenderMs,
            particleRenderMs: particleStats.renderTime || 0,
            particleCount: particleStats.particleCount || 0,
            batchCount: particleStats.lastBatchCount || 0,
            visibleEffectCount: typeof specialEffects !== 'undefined'
                ? (specialEffects.getVisibleEffectCount?.() || 0)
                : 0,
            trailMode: this.renderManager?.getTrailVisibilityMode?.() || 'reduced',
            atmosphereTier: this.renderManager?.getAtmosphereRenderProfile?.()?.tier
                || (pressureProfile?.isHot ? 'throttled' : 'full'),
            compositeCallCount: Number(renderBreakdown?.compositeCallCount || 0),
            uiRedrawCount: Number(renderBreakdown?.uiRedrawCount || 0),
            debugRedrawCount: Number(renderBreakdown?.debugRedrawCount || 0),
            renderBreakdown,
            shellState: renderBreakdown?.shellState
                || gameUI?.getShellPerformanceState?.(this.gameState)
                || null
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
    getCanvasInputPoint() {
        if (this.interactionSystem?.getCursorPosition) {
            const cursor = this.interactionSystem.getCursorPosition();
            return { x: cursor.x, y: cursor.y };
        }
        return { x: mouseX, y: mouseY };
    }

    findButterflyAtCanvasPoint(point, maxDistance = 28) {
        if (!point) return null;
        const focusedZoneId = this.getFocusedZoneId();
        const butterflies = (this.gameState?.butterflies || []).filter(butterfly => {
            if (!butterfly?.id) return false;
            if (focusedZoneId && this.getEntityZoneId(butterfly, null) !== focusedZoneId) return false;
            if (butterfly.isSpawning || butterfly.zoneTravel) return false;
            return true;
        });

        let closest = null;
        let closestDistance = maxDistance;
        for (const butterfly of butterflies) {
            const distance = Math.hypot((butterfly.x || 0) - point.x, (butterfly.y || 0) - point.y);
            if (distance < closestDistance) {
                closest = butterfly;
                closestDistance = distance;
            }
        }

        return closest;
    }

    handlePetInteraction(butterfly) {
        if (!butterfly?.receivePetInteraction || !butterfly.canReceivePetInteraction?.()) return false;
        butterfly.receivePetInteraction(this.gameState);
        return true;
    }

    handleClapInteraction(butterfly) {
        if (!butterfly?.receiveClapInteraction) return false;
        butterfly.receiveClapInteraction(this.gameState);
        return true;
    }

    isSolidBlockObstacleForButterfly(block, butterfly) {
        const structured = this.structureSystem?.isBlockObstacleForEntity?.(block, butterfly);
        if (typeof structured === 'boolean') return structured;
        if (!block || block.carriedById) return false;
        if (!butterfly) return false;
        const stackHeight = (block.stackIndex || 0) + 1;
        const butterflyMetrics = this.structureSystem?.getEntityMetrics?.(butterfly, 'butterfly') || null;
        const butterflyClearance = Math.max(1, butterflyMetrics?.clearance || 1);
        return stackHeight > butterflyClearance;
    }

    isScreenPointBlockedForButterfly(x, y, butterfly, options = {}) {
        const structured = this.structureSystem?.isPointBlockedForEntity?.(x, y, butterfly, options);
        if (typeof structured === 'boolean') return structured;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !butterfly) return false;
        const zoneId = options.zoneId || this.getEntityZoneId(butterfly, null);
        if (!zoneId) return false;
        const ignoreIds = new Set(options.ignoreBlockIds || []);
        const blocks = this.getBlocksInZone(zoneId);
        for (const block of blocks) {
            if (!this.isSolidBlockObstacleForButterfly(block, butterfly)) continue;
            if (ignoreIds.has(block.id)) continue;
            const blockMetrics = this.structureSystem?.getEntityMetrics?.(block, 'block') || null;
            const radius = Math.max(8, blockMetrics?.radius || 8);
            if (Math.hypot((block.x || 0) - x, (block.y || 0) - y) < radius) {
                return true;
            }
        }
        return false;
    }

    canUseDirectButterflyInteractions() {
        if (this.debugMode.enabled) return false;
        if (this.gameState?.viewMode === 'overview') return false;
        if (typeof gameUI === 'undefined' || !gameUI?.initialized) return true;
        if (gameUI.inspectPanel?.visible) return false;
        if (gameUI.accessibilityPanel?.visible) return false;
        return true;
    }

    handleMousePressed(button = mouseButton) {
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

        if (typeof gameUI !== 'undefined' && gameUI.initialized) {
            if (gameUI.handleMousePressed?.(mouseX, mouseY, this.gameState)) {
                return true;
            }
        }

        if (this.debugMode.enabled) {
            if (typeof debugUI !== 'undefined' && debugUI.handleMouseClick?.(mouseX, mouseY)) {
                return true;
            }
        }

        if (this.canUseDirectButterflyInteractions()) {
            const point = this.getCanvasInputPoint();
            const target = this.findButterflyAtCanvasPoint(point, 30)
                || this.interactionSystem?.hoveredButterfly
                || null;
            if (target?.id) {
                if (button === RIGHT) {
                    return this.handleClapInteraction(target);
                }
                return this.handlePetInteraction(target);
            }
        }

        return false;
    }

    handleMouseWheel(event) {
        if (!showTitleScreen && !this.debugMode.enabled && typeof gameUI !== 'undefined' && gameUI.initialized) {
            if (gameUI.handleMouseWheel?.(mouseX, mouseY, event?.delta ?? 0, this.gameState)) {
                return false;
            }
        }

        return true;
    }

    setDebugEnabled(enabled) {
        const nextEnabled = !!enabled;
        this.debugMode.enabled = nextEnabled;

        const bounds = gameConfig?.isometric?.bounds || this.gridManager?.bounds || { maxX: 0, maxY: 0 };
        if (nextEnabled) {
            this.debugMode.cursorX = Math.floor((bounds.maxX || 0) / 2);
            this.debugMode.cursorY = Math.floor((bounds.maxY || 0) / 2);
        }

        if (typeof debugUI !== 'undefined') {
            debugUI.enabled = nextEnabled;
            if (nextEnabled) {
                debugUI.cursorX = this.debugMode.cursorX;
                debugUI.cursorY = this.debugMode.cursorY;
            } else {
                debugUI.showSexLabels = false;
                debugUI.godModeButtonRects = [];
                const sexButton = debugUI.godModeButtons?.find(button => button.id === 'toggleSexLabels');
                if (sexButton) sexButton.text = 'Sex Labels: Off';
            }
        }

        return nextEnabled;
    }

    toggleDebugEnabled() {
        return this.setDebugEnabled(!this.debugMode.enabled);
    }
    
    handleKeyPressed(key, keyCode) {
        // Toggle debug mode
        if (key === 'D' || key === 'd') {
            this.toggleDebugEnabled();
            return true;
        }

        if (this.debugMode.enabled) {
            return this.handleDebugKeyPressed(key, keyCode);
        }

        // Let gameUI handle keys only in normal mode
        if (typeof gameUI !== 'undefined' && gameUI.initialized) {
            if (gameUI.handleKeyPress(key, keyCode)) {
                return true;
            }
        }

        return false;
    }
    
    handleDebugKeyPressed(key, keyCode) {
        return false;
    }
    
    handleDebugPlacement() {
        const gridX = this.debugMode.cursorX;
        const gridY = this.debugMode.cursorY;
        const screenPos = this.gridManager.isoToScreen(gridX, gridY);
        
        if (this.debugMode.selectedTool === 'butterfly') {
            if (this.getWildButterflyCount() >= (gameConfig.entities.maxButterflies || 8)) {
                return;
            }

            const butterfly = new Butterfly(
                screenPos.x, 
                screenPos.y - gameConfig.entities.heightOffset.butterfly, 
                null, // Let personality determine colors
                false,
                this.chooseWildProgressionType({
                    allowGolden: progressionManager?.isGoldenUnlocked?.(this.gameState)
                }),
                {
                    currentZoneId: this.getFocusedZoneId(),
                    birthSource: 'debug'
                }
            );
            this.assignEntityToZone(butterfly, this.getFocusedZoneId());
            this.gameState.butterflies.push(butterfly);
            this.entityManager.addEntity('butterflies', butterfly);
            this.registerEntityWithFoundationSystems(butterfly, 'butterfly');
            
        } else if (this.debugMode.selectedTool === 'flower') {
            this.spawnFlowerAt(this.getFocusedZoneId(), screenPos.x, screenPos.y, {
                exactPoint: true,
                minDistance: gameConfig?.entities?.flower?.spawnMinDistance || 40
            });
            
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

        const canvasPerf = gameConfig.performance?.canvas || {};
        const widthCap = Number(canvasPerf.maxDisplayWidth || targetWidth);
        const heightCap = Number(canvasPerf.maxDisplayHeight || targetHeight);
        const capScale = Math.min(
            1,
            widthCap > 0 ? (widthCap / Math.max(1, targetWidth)) : 1,
            heightCap > 0 ? (heightCap / Math.max(1, targetHeight)) : 1
        );
        if (capScale < 1) {
            targetWidth *= capScale;
            targetHeight *= capScale;
        }
        
        // Update render manager - additional safety check
        if (this.renderManager && typeof this.renderManager.updateCanvasSize === 'function') {
            this.renderManager.updateCanvasSize(targetWidth, targetHeight);

            if (typeof window !== 'undefined' && typeof window.applyCanvasPerformanceProfile === 'function') {
                window.applyCanvasPerformanceProfile(targetWidth, targetHeight);
            }
            
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
        if ((this.gameState.butterflies?.length || 0) < (gameConfig.entities.maxButterflies || 8)) {
            const butterfly = new Butterfly(x, y, colors || null, false, this.chooseWildProgressionType({
                allowGolden: progressionManager?.isGoldenUnlocked?.(this.gameState)
            }), {
                currentZoneId: this.getFocusedZoneId(),
                birthSource: 'debug'
            }); // Allow custom colors or use personality
            this.assignEntityToZone(butterfly, this.getFocusedZoneId());
            this.gameState.butterflies.push(butterfly);
            this.entityManager?.addEntity('butterflies', butterfly);
            this.registerEntityWithFoundationSystems(butterfly, 'butterfly');

            // Spawn burst effect
            this.particleSystem.emitBurst(x, y, [255, 255, 255], 8);
            
            console.log('🦋 Spawned butterfly via god mode');
        } else {
            console.log('🦋 Cannot spawn butterfly - max population reached');
        }
    }
    
    godSpawnFlower(x, y) {
        if (this.gameState.flowers.length < gameConfig.entities.maxFlowers) {
            const zoneId = this.getFocusedZoneId();
            const flower = this.spawnFlowerAt(zoneId, x, y, {
                minDistance: gameConfig?.entities?.flower?.spawnMinDistance || 40,
                maxAttempts: 24
            });
            if (!flower) {
                console.log('🌸 Cannot spawn flower - no valid position found');
                return;
            }
            
            // Spawn burst effect
            this.particleSystem.emitBurst(flower.x, flower.y, [255, 255, 255], 8);
            
            console.log('🌸 Spawned flower via god mode');
        } else {
            console.log('🌸 Cannot spawn flower - max population reached');
        }
    }

    godSpawnBlock(zoneId = this.getFocusedZoneId(), x = null, y = null) {
        const resolvedZoneId = zoneId || this.getFocusedZoneId();
        const zoneBlocks = this.getBlocksInZone(resolvedZoneId);
        const point = (Number.isFinite(x) && Number.isFinite(y))
            ? this.clampPlacementPointInZone(resolvedZoneId, x, y, 8)
            : this.findValidBlockSpawnPoint(resolvedZoneId, zoneBlocks, {
                maxAttempts: 40,
                minDistance: 28
            });
        if (!resolvedZoneId || !point) {
            console.log('Block God Mode: Cannot spawn block - no valid position found');
            return null;
        }

        const blockConfig = gameConfig?.entities?.block || {};
        const block = new Block(point.x, point.y, {
            currentZoneId: resolvedZoneId,
            renderWidth: blockConfig.renderWidth || 16,
            renderHeight: blockConfig.renderHeight || 16
        });
        this.assignEntityToZone(block, resolvedZoneId);
        this.gameState.blocks.push(block);
        this.entityManager?.addEntity?.('blocks', block);
        this.registerEntityWithFoundationSystems(block, 'block');
        this.particleSystem?.emitBurst?.(block.x, block.y, [120, 220, 255], 6);
        console.log('Block God Mode: Spawned block via god mode');
        return block;
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
        const zoneId = this.getEntityZoneId(flower, flower?.currentZoneId || null);
        if (flower?.consumed && zoneId) {
            this.recordZoneFlowerConsumption(zoneId, flower);
        }
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

    recordSessionCaptureEvent(category, label, payload = {}) {
        return this.telemetrySystem?.recordSessionEvent?.(category, label, payload) || null;
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
        if (this.gameState.viewMode === mode) {
            return;
        }
        const previousMode = this.gameState.viewMode;
        this.gameState.viewMode = mode;
        this.zoneSystem?.setViewMode(mode);
        this.renderManager?.setViewMode(mode);
        this.recordSessionCaptureEvent('view', 'mode-changed', {
            previousMode,
            nextMode: mode,
            activeBattleId: this.gameState.activeBattleId || null
        });
    }
    
    focusZone(zoneId) {
        if (!zoneId) return false;
        const normalizedZoneId = String(zoneId);
        if (this.gameState.focusedZoneId === normalizedZoneId && this.gameState.viewMode === 'focused-garden') {
            return true;
        }
        const currentFocusedZoneId = this.gameState.focusedZoneId || this.zoneSystem?.focusedZoneId || null;
        const focusedChanged = this.zoneSystem?.setFocusedZone(normalizedZoneId);
        if (!focusedChanged && currentFocusedZoneId !== normalizedZoneId) return false;
        this.gameState.focusedZoneId = normalizedZoneId;
        this.gameState.viewMode = 'focused-garden';
        this.zoneSystem?.setViewMode?.('focused-garden');
        this.renderManager?.setFocusedZone(normalizedZoneId);
        this.renderManager?.setViewMode('focused-garden');
        this.renderManager?.invalidateScene?.('focus-zone');
        this.telemetrySystem?.recordZoneFocus?.({
            zoneId: normalizedZoneId,
            previousZoneId: currentFocusedZoneId,
            viewMode: 'focused-garden'
        });
        this.recordSessionCaptureEvent('navigation', 'focus-zone', {
            previousZoneId: currentFocusedZoneId,
            nextZoneId: normalizedZoneId,
            viewMode: 'focused-garden'
        });
        return true;
    }
    
    getSystems() {
        return { ...this.systems };
    }

    getTelemetrySnapshot() {
        return this.telemetrySystem?.getSnapshot?.() || null;
    }

    buildEcologyTelemetrySample(zoneIds = this.getZoneIds(), options = {}) {
        const context = options.context || this.collectZoneEcologyInputs(zoneIds);
        const state = this.gameState || {};
        const butterflies = (state.butterflies || []).filter(entry => entry && !(typeof entry.isDead === 'function' && entry.isDead()));
        const zoneSummaries = (zoneIds || []).map(zoneId => {
            const summary = context.zoneEcologyByZone?.[zoneId]
                || this.getZoneEcologySummary(zoneId, {
                    snapshot: context.snapshot,
                    zoneFlowersByZone: context.zoneFlowersByZone,
                    zoneBlocksByZone: context.zoneBlocksByZone,
                    currentFrame: options.currentFrame
                })
                || {};
            const zoneFlowers = context.zoneFlowersByZone?.[zoneId] || this.getFlowersInZone(zoneId);
            const zoneButterflies = butterflies.filter(entry => this.getEntityZoneId(entry, null) === zoneId);
            const normalFlowers = zoneFlowers.filter(entry => entry && entry.stage !== 'dissolve' && entry.occupancyState === 'normal').length;
            const targets = this.getZoneFlowerSpawnTargets(zoneId, {
                flowers: zoneFlowers,
                butterflies: zoneButterflies
            }) || {};
            return {
                zoneId,
                identityLabel: summary.identityLabel || summary.label || zoneId,
                signatureLabel: summary.signatureLabel || null,
                normalFlowers,
                floorTarget: Math.max(1, targets.floorTarget || 1),
                resourceReserve: this.clampUnit(summary.resourceReserve ?? 0),
                habitatQuality: this.clampUnit(summary.habitatQuality ?? 0),
                depletionPressure: this.clampUnit(summary.depletionPressure ?? 0),
                migrationPull: this.clampUnit(summary.migrationPull ?? 0),
                crowdingPressure: this.clampUnit(summary.crowdingPressure ?? 0),
                butterflyCount: zoneButterflies.length
            };
        });

        const distinctIdentityCount = new Set(zoneSummaries.map(entry => entry.identityLabel).filter(Boolean)).size;
        const distinctSignatureCount = new Set(zoneSummaries.map(entry => entry.signatureLabel).filter(Boolean)).size;
        const livingCount = butterflies.length;
        const migrationProfiles = butterflies
            .map(entry => ({
                entity: entry,
                currentZoneId: this.getEntityZoneId(entry, null),
                migration: entry?.lifeSim?.migration || null
            }))
            .filter(entry => !!entry.migration);
        const homeAnchoredCount = migrationProfiles.filter(entry => !!entry.migration?.homeZoneId).length;
        const settledHomeCount = migrationProfiles.filter(entry => {
            const homeZoneId = entry.migration?.homeZoneId || null;
            return !!homeZoneId && homeZoneId === entry.currentZoneId;
        }).length;
        const awayFromHomeCount = migrationProfiles.filter(entry => {
            const homeZoneId = entry.migration?.homeZoneId || null;
            return !!homeZoneId && homeZoneId !== entry.currentZoneId;
        }).length;
        const activeTravelerCount = butterflies.filter(entry => !!entry?.zoneTravel?.targetZoneId).length;
        const multiZoneCount = migrationProfiles.filter(entry =>
            Object.values(entry.migration?.zoneVisitCounts || {}).filter(value => (value || 0) > 0).length >= 2
        ).length;
        const completedTravelCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.completedTravelCount || 0), 0);
        const homeReturnCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.homeReturnCount || 0), 0);
        const scoutingTripCount = migrationProfiles.reduce((sum, entry) => sum + Math.max(0, entry.migration?.scoutingTripCount || 0), 0);

        const currentBatch = progressionManager?.getCurrentReleaseBatchSummary?.(state) || { count: 0 };
        const latestCohort = progressionManager?.getReleaseCohortSummary?.(state) || null;
        const latestWaveWildCount = latestCohort?.cohortId
            ? butterflies.filter(entry => {
                if ((entry.birthSource || '') !== 'wild') return false;
                const progress = progressionManager?.getWildProgress?.(state, entry);
                return progress?.releaseCohortId === latestCohort.cohortId;
            }).length
            : 0;

        return {
            zoneCount: zoneSummaries.length,
            zoneSummaries,
            zoneHealth: {
                distinctIdentityCount,
                distinctSignatureCount,
                zonesBelowFloorCount: zoneSummaries.filter(entry =>
                    entry.normalFlowers < entry.floorTarget || entry.resourceReserve + 0.001 < (this.zoneSystem?.getZoneEcologyState?.(entry.zoneId)?.recoveryFloor ?? 0)
                ).length,
                minResourceReserve: zoneSummaries.length ? Math.min(...zoneSummaries.map(entry => entry.resourceReserve || 0)) : 0,
                minHabitatQuality: zoneSummaries.length ? Math.min(...zoneSummaries.map(entry => entry.habitatQuality || 0)) : 0,
                maxDepletionPressure: zoneSummaries.length ? Math.max(...zoneSummaries.map(entry => entry.depletionPressure || 0)) : 0,
                avgCrowdingPressure: zoneSummaries.length
                    ? zoneSummaries.reduce((sum, entry) => sum + (entry.crowdingPressure || 0), 0) / zoneSummaries.length
                    : 0,
                avgMigrationPull: zoneSummaries.length
                    ? zoneSummaries.reduce((sum, entry) => sum + (entry.migrationPull || 0), 0) / zoneSummaries.length
                    : 0
            },
            migration: {
                livingCount,
                homeAnchoredCount,
                settledHomeCount,
                awayFromHomeCount,
                activeTravelerCount,
                multiZoneCount,
                completedTravelCount,
                homeReturnCount,
                scoutingTripCount
            },
            release: {
                totalReleases: Math.max(0, state.totalReleases || 0),
                currentBatchCount: Math.max(0, currentBatch.count || 0),
                releaseHistoryCount: Array.isArray(state.releaseHistory) ? state.releaseHistory.length : 0,
                latestCohortId: latestCohort?.cohortId ?? null,
                latestCohortBlendGuard: this.clampUnit(latestCohort?.blendGuard ?? 0),
                latestPreferredZoneId: latestCohort?.preferredZoneId || null,
                latestWaveWildCount,
                latestLineageCount: (latestCohort?.topLineages || []).length
            }
        };
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
        this.recordSessionCaptureEvent('battle', 'started', {
            battleId: snapshot.battleId,
            mode: snapshot.mode || options.mode || 'battle',
            participantCount: Array.isArray(snapshot.participants) ? snapshot.participants.length : (participants?.length || 0),
            teamIds: Array.isArray(snapshot.teams) ? snapshot.teams.map(team => team.id) : null
        });
        return snapshot;
    }

    startBattleFromSides(leftIds = [], rightIds = [], options = {}) {
        const byId = new Map((this.gameState.butterflies || []).map(butterfly => [butterfly.id, butterfly]));
        const participants = [
            ...(leftIds || []).map(id => byId.get(id)).filter(Boolean).map(entity => ({ entity, teamId: 'left' })),
            ...(rightIds || []).map(id => byId.get(id)).filter(Boolean).map(entity => ({ entity, teamId: 'right' }))
        ];
        if (participants.length < 2) return null;
        return this.startBattleSession(participants, {
            mode: 'autobattle',
            autoBattle: true,
            autoBattlePaused: false,
            metadata: {
                leftCount: leftIds.length,
                rightCount: rightIds.length,
                teamLabels: {
                    left: 'Your Team',
                    right: 'Garden AI'
                }
            },
            ...options
        });
    }

    buildSinglePlayerAutoBattlePreview(options = {}) {
        return this.rosterSystem?.getSinglePlayerAutoBattlePreview?.(this.gameState, options) || null;
    }

    startSinglePlayerAutoBattleSession(options = {}) {
        const preview = this.buildSinglePlayerAutoBattlePreview(options);
        if (!preview?.canStart) return null;

        const byId = new Map((this.gameState.butterflies || []).map(butterfly => [butterfly.id, butterfly]));
        const participants = [
            ...preview.playerTeamIds.map(id => byId.get(id)).filter(Boolean).map(entity => ({ entity, teamId: 'left', role: 'combatant' })),
            ...preview.opponentTeamIds.map(id => byId.get(id)).filter(Boolean).map(entity => ({ entity, teamId: 'right', role: 'combatant' }))
        ];
        if (participants.length < 2) return null;

        return this.startBattleSession(participants, {
            mode: 'single-player-autobattle',
            autoBattle: true,
            autoBattlePaused: false,
            metadata: {
                leftCount: preview.playerTeamIds.length,
                rightCount: preview.opponentTeamIds.length,
                autoSelection: {
                    teamSize: preview.teamSize,
                    maxTeamSize: preview.maxTeamSize,
                    playerTeamIds: [...preview.playerTeamIds],
                    opponentTeamIds: [...preview.opponentTeamIds]
                },
                teamLabels: {
                    left: 'Your Team',
                    right: 'Garden AI'
                }
            },
            ...options
        });
    }

    startRosterBattleSession(squadA = 'left', squadB = 'right', options = {}) {
        return this.startSinglePlayerAutoBattleSession(options);
    }

    resolveBattleRound(battleId = this.gameState.activeBattleId, queuedActions = {}) {
        return this.battleSystem?.resolveRound?.(battleId, queuedActions) || null;
    }

    resolveBattleSession(battleId, result = {}) {
        return this.battleSystem?.resolveSnapshot(battleId, result) || null;
    }

    commitBattleSession(battleId) {
        const snapshot = this.battleSystem?.commitResults(battleId) || null;
        if (!snapshot) return null;
        this.recordSessionCaptureEvent('battle', 'committed', {
            battleId,
            winnerTeamId: snapshot.result?.winnerTeamId || snapshot.winnerTeamId || null,
            roundsResolved: snapshot.roundNumber || snapshot.result?.roundsResolved || null
        });
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

    async saveGameToStorage(options = {}) {
        const result = await (this.saveSystem?.saveToStorage?.(this.gameState, options) || null);
        this.recordSessionCaptureEvent('save', 'saved', {
            source: options?.source || 'manual',
            focusedZoneId: this.gameState.focusedZoneId || null,
            viewMode: this.gameState.viewMode || 'focused-garden'
        });
        return result;
    }

    async loadGameFromStorage() {
        const result = await (this.saveSystem?.loadFromStorage?.(this) || null);
        this.recordSessionCaptureEvent('save', result ? 'loaded' : 'load-missed', {
            focusedZoneId: this.gameState.focusedZoneId || null,
            viewMode: this.gameState.viewMode || 'focused-garden'
        });
        return result;
    }
    
    getDebugMode() {
        return { ...this.debugMode };
    }

    isPauseWhenHiddenEnabled() {
        return !!gameConfig?.performance?.flags?.pauseWhenHidden;
    }

    attachRuntimeVisibilityHandling() {
        if (typeof document === 'undefined' || this.visibilityHandlerAttached) return;
        document.removeEventListener('visibilitychange', this.boundVisibilityChangeHandler);
        document.addEventListener('visibilitychange', this.boundVisibilityChangeHandler);
        this.visibilityHandlerAttached = true;
    }

    handleDocumentVisibilityChange() {
        if (!this.isPauseWhenHiddenEnabled()) return;
        if (typeof document === 'undefined') return;
        if (document.hidden) {
            this.pauseForHiddenTab();
            return;
        }
        this.resumeFromHiddenTab();
    }

    pauseForHiddenTab() {
        if (this.hiddenLoopPauseActive || !this.gameState.initialized) return;
        this.hiddenLoopPauseActive = true;
        this.telemetrySystem?.recordSessionEvent?.('runtime', 'pause-for-hidden', {
            focusedZoneId: this.gameState.focusedZoneId || null,
            viewMode: this.gameState.viewMode || 'focused-garden'
        });
        if (typeof noLoop === 'function') {
            noLoop();
        }
    }

    resumeFromHiddenTab() {
        if (!this.hiddenLoopPauseActive) return;
        this.hiddenLoopPauseActive = false;
        this.telemetrySystem?.resetRecentRuntimeWindow?.('resume-from-hidden');
        this.telemetrySystem?.recordSessionEvent?.('runtime', 'resume-from-hidden', {
            focusedZoneId: this.gameState.focusedZoneId || null,
            viewMode: this.gameState.viewMode || 'focused-garden'
        });
        if (typeof loop === 'function') {
            loop();
        }
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
    async resetGame(resetProgression = false) {
        if (this.isResettingGame) {
            return false;
        }

        this.isResettingGame = true;
        const preserveDebugMode = !!this.debugMode?.enabled;
        console.log('🔄 GameCore: Resetting game state...');

        this.pause();

        try {
            const defaultZoneId = this.getZoneIds?.()[0] || this.gameState.focusedZoneId || 'ivy-cloister';

            // Clear all entities
            this.gameState.butterflies = [];
            this.gameState.caterpillars = [];
            this.gameState.flowers = [];
            this.gameState.blocks = [];
            this.gameState.pendingPollenPlantings = [];

            if (resetProgression) {
                progressionManager?.resetAll?.(this.gameState);
            } else {
                progressionManager?.ensureProgressionContainers?.(this.gameState);
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
            this.gameState.focusedZoneId = defaultZoneId;
            this.gameState.viewMode = 'focused-garden';

            // Clear entity manager
            if (this.entityManager) {
                this.entityManager.clear();
            }
            this.resetFoundationSystems();

            // Reset particle system
            if (this.particleSystem) {
                this.particleSystem.particles = [];
            }

            eventBus?.clearHistory?.();
            this.resetReplayMetadata({ forceNewSession: true, preserveMarkers: false });
            this.zoneSystem?.setFocusedZone?.(defaultZoneId);
            this.zoneSystem?.setViewMode?.('focused-garden');
            this.renderManager?.setFocusedZone?.(defaultZoneId);
            this.renderManager?.setViewMode?.('focused-garden');

            await new Promise(resolve => setTimeout(resolve, 0));
            await this.initializeStartingEntities();
            this.ensureZoneOwnership();
            if (preserveDebugMode) {
                this.debugMode.enabled = true;
                if (typeof debugUI !== 'undefined') {
                    debugUI.enabled = true;
                }
            }
            progressionManager.save(this.gameState);
            console.log('✨ GameCore: Game reset complete');
            return true;
        } catch (error) {
            console.error('❌ GameCore: Error resetting game:', error);
            return false;
        } finally {
            this.resume();
            this.isResettingGame = false;
        }
    }

    getWildButterflyCount() {
        return this.gameState.butterflies.filter(butterfly => this.isAmbientWildButterfly(butterfly)).length;
    }
}

// Create global instance
const gameCore = new GameCore();

