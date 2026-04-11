// Debug/Builder Mode - Development tools for testing and content creation
class DebugUI {
    constructor() {
        this.enabled = false;
        this.cursorX = 0;
        this.cursorY = 0;
        this.selectedTool = 'butterfly';
        this.tools = ['butterfly', 'flower', 'walkable', 'blocked'];
        this.walkableTiles = new Set(); // Set of "x,y" strings for walkable tiles
        this.blockedTiles = new Set();  // Set of "x,y" strings for blocked tiles
        this.showSexLabels = false;
        this.auditState = {
            lastAction: 'None',
            lastStatus: 'idle',
            lastMismatchCount: 0,
            lastRunAt: null,
            lastError: null,
            scenarioLabel: 'none',
            snapshotLabel: 'none',
            comparedSnapshots: 'none',
            gameplayAuditStatus: 'idle',
            savedAuditReports: 0,
            invariantFailures: 0,
            replaySessionLabel: 'none',
            replaySeedLabel: 'n/a'
        };
        this.auditSnapshots = new Map();
        this.snapshotCounter = 0;
        this.auditSetupStorageKey = 'papilionem-audit-setup-v1';
        this.auditReportStorageKey = 'papilionem-audit-reports-v1';
        this.auditScenarioPresets = [
            { id: 'sleep-assist-cluster', label: 'Sleep Assist' },
            { id: 'teaching-pair', label: 'Teaching Pair' },
            { id: 'trust-cascade-cluster', label: 'Trust Cascade' },
            { id: 'social-routine-web', label: 'Social Web' },
            { id: 'hybrid-lineage', label: 'Hybrid Lineage' },
            { id: 'nursery-lineage', label: 'Nursery Lineage' }
        ];
        this.currentAuditScenarioIndex = -1;
        
        // God mode testing buttons
        this.godModeButtons = [
            { id: 'spawnButterfly', text: 'Spawn Butterfly', x: 10, y: 0, width: 120, height: 25 },
            { id: 'spawnFlower', text: 'Spawn Flower', x: 140, y: 0, width: 100, height: 25 },
            { id: 'spawnPixels', text: 'Spawn Pixels', x: 250, y: 0, width: 100, height: 25 },
            { id: 'refreshPheromones', text: 'Refresh M Pheromone', x: 10, y: 32, width: 160, height: 25 },
            { id: 'hatchEggs', text: 'Hatch Eggs', x: 180, y: 32, width: 90, height: 25 },
            { id: 'hatchCocoons', text: 'Hatch Cocoons', x: 280, y: 32, width: 110, height: 25 },
            { id: 'flowersForCaterpillars', text: 'Flower Caterpillars', x: 10, y: 64, width: 160, height: 25 },
            { id: 'toggleSexLabels', text: 'Sex Labels: Off', x: 180, y: 64, width: 120, height: 25 },
            { id: 'resetProgression', text: 'Reset Progression', x: 310, y: 64, width: 130, height: 25 },
            { id: 'saveGameState', text: 'Save Game', x: 10, y: 96, width: 110, height: 25 },
            { id: 'loadGameState', text: 'Load Game', x: 130, y: 96, width: 110, height: 25 },
            { id: 'verifyRoundTrip', text: 'Verify Roundtrip', x: 250, y: 96, width: 140, height: 25 },
            { id: 'captureSnapshot', text: 'Capture Snapshot', x: 10, y: 128, width: 140, height: 25 },
            { id: 'checkInvariants', text: 'Check Invariants', x: 160, y: 128, width: 140, height: 25 },
            { id: 'compareSnapshots', text: 'Compare Snapshots', x: 310, y: 128, width: 150, height: 25 },
            { id: 'loadAuditPreset', text: 'Load Audit Preset', x: 10, y: 160, width: 140, height: 25 },
            { id: 'exportAuditSetup', text: 'Export Audit Setup', x: 160, y: 160, width: 140, height: 25 },
            { id: 'importAuditSetup', text: 'Import Audit Setup', x: 310, y: 160, width: 150, height: 25 },
            { id: 'runGameplayAudit', text: 'Run Gameplay Audit', x: 10, y: 192, width: 180, height: 25 },
            { id: 'reseedReplay', text: 'Reseed Session', x: 200, y: 192, width: 130, height: 25 }
        ];
    }

    getGodModeButtonBaseY() {
        return gameConfig.canvas.targetHeight - 202;
    }

    getStoredAuditReports() {
        if (typeof localStorage === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(this.auditReportStorageKey) || '[]');
        } catch (_error) {
            return [];
        }
    }

    persistAuditReport(report) {
        if (typeof localStorage === 'undefined') return 0;
        const reports = this.getStoredAuditReports();
        reports.push(report);
        while (reports.length > 20) {
            reports.shift();
        }
        localStorage.setItem(this.auditReportStorageKey, JSON.stringify(reports));
        return reports.length;
    }

    getLatestAuditReport() {
        const reports = this.getStoredAuditReports();
        return reports.length > 0 ? reports[reports.length - 1] : null;
    }

    getReplayMetadata() {
        return gameCore?.getReplayMetadata?.() || null;
    }

    syncReplayAuditState() {
        const replay = this.getReplayMetadata();
        if (!replay) {
            this.auditState.replaySessionLabel = 'none';
            this.auditState.replaySeedLabel = 'n/a';
            return null;
        }

        this.auditState.replaySessionLabel = replay.sessionId || 'none';
        this.auditState.replaySeedLabel = String(replay.seed ?? 'n/a');
        return replay;
    }

    recordReplayAuditMarker(label, payload = {}) {
        return gameCore?.recordReplayMarker?.(label, payload) || null;
    }
    
    // Toggle debug mode on/off
    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            // Start cursor in center of isometric bounds
            const bounds = gridManager.bounds;
            this.cursorX = Math.floor(bounds.maxX / 2);
            this.cursorY = Math.floor(bounds.maxY / 2);
        } else {
            this.showSexLabels = false;
            const sexButton = this.godModeButtons.find(button => button.id === 'toggleSexLabels');
            if (sexButton) sexButton.text = 'Sex Labels: Off';
        }
    }
    
    // Handle debug mode keyboard input
    handleKeyPress(key, keyCode) {
        if (!this.enabled) return false;
        
        // Always use isometric movement in debug mode
        if (keyCode === LEFT_ARROW) {
            // Isometric movement: left = move northwest
            if (this.cursorY > 0) {
                this.cursorY--;
            }
        } else if (keyCode === RIGHT_ARROW) {
            // Isometric movement: right = move southeast
            if (this.cursorY < gridManager.bounds.maxY) {
                this.cursorY++;
            }
        } else if (keyCode === UP_ARROW) {
            // Isometric movement: up = move northeast
            if (this.cursorX > 0) {
                this.cursorX--;
            }
        } else if (keyCode === DOWN_ARROW) {
            // Isometric movement: down = move southwest
            if (this.cursorX < gridManager.bounds.maxX) {
                this.cursorX++;
            }
        }
        
        // Tool selection
        if (key === 'Q' || key === 'q') {
            let currentIndex = this.tools.indexOf(this.selectedTool);
            currentIndex = (currentIndex - 1 + this.tools.length) % this.tools.length;
            this.selectedTool = this.tools[currentIndex];
        } else if (key === 'E' || key === 'e') {
            let currentIndex = this.tools.indexOf(this.selectedTool);
            currentIndex = (currentIndex + 1) % this.tools.length;
            this.selectedTool = this.tools[currentIndex];
        }
        
        // Placement/action
        if (key === ' ') {
            this.handlePlacement();
        }
        
        // Export data
        if (key === 'X' || key === 'x') {
            this.exportZoneData();
        }
        
        return true; // Consumed the input
    }
    
    // Handle entity/tile placement
    handlePlacement() {
        const gridX = this.cursorX;
        const gridY = this.cursorY;
        
        // Convert isometric grid coordinates to screen coordinates
        const screenPos = gridManager.isoToScreen(gridX, gridY);
        const pixelX = screenPos.x;
        const pixelY = screenPos.y; // Ground level already included in isoToScreen
        
        if (this.selectedTool === 'butterfly') {
            // Spawn butterfly (this would need access to game state)
            this.spawnButterfly(pixelX, pixelY);
            
        } else if (this.selectedTool === 'flower') {
            // Spawn flower (this would need access to game state)
            this.spawnFlower(pixelX, pixelY);
            
        } else if (this.selectedTool === 'walkable' || this.selectedTool === 'blocked') {
            this.toggleTileState(gridX, gridY);
        }
    }
    
    // Toggle walkable/blocked tile state
    toggleTileState(gridX, gridY) {
        const tileKey = `${gridX},${gridY}`;
        
        if (this.selectedTool === 'walkable') {
            // Toggle walkable state
            if (this.walkableTiles.has(tileKey)) {
                this.walkableTiles.delete(tileKey);
            } else {
                this.walkableTiles.add(tileKey);
                // Remove from blocked if it was there
                this.blockedTiles.delete(tileKey);
            }
        } else if (this.selectedTool === 'blocked') {
            // Toggle blocked state
            if (this.blockedTiles.has(tileKey)) {
                this.blockedTiles.delete(tileKey);
            } else {
                this.blockedTiles.add(tileKey);
                // Remove from walkable if it was there
                this.walkableTiles.delete(tileKey);
            }
        }
    }
    
    // Spawn butterfly (needs access to game systems)
    spawnButterfly(x, y) {
        const butterflyColors = gameConfig.entities.butterfly.colors;
        const colors = random(butterflyColors);
        // Butterflies float above the grid
        const floatY = y - gameConfig.entities.heightOffset.butterfly;
        
        // This would need to be called via a callback or event
        eventBus.emit('debug:spawnButterfly', { x, y: floatY, colors });
    }
    
    // Spawn flower (needs access to game systems)
    spawnFlower(x, y) {
        eventBus.emit('debug:spawnFlower', { x, y });
    }
    
    // Handle mouse clicks for god mode buttons
    handleMouseClick(mouseX, mouseY) {
        if (!this.enabled) return false;
        
        // Check god mode buttons (positioned at bottom of screen)
        const buttonY = this.getGodModeButtonBaseY();
        
        for (let button of this.godModeButtons) {
            if (mouseX >= button.x && mouseX <= button.x + button.width &&
                mouseY >= buttonY + button.y && mouseY <= buttonY + button.y + button.height) {
                
                this.handleGodModeAction(button.id);
                return true; // Consumed the click
            }
        }
        
        return false;
    }
    
    // Execute god mode actions
    handleGodModeAction(actionId) {
        const bounds = gridManager.bounds;
        
        switch (actionId) {
            case 'spawnButterfly':
                this.godSpawnButterfly(bounds);
                break;
            case 'spawnFlower':
                this.godSpawnFlower(bounds);
                break;
            case 'spawnPixels':
                this.godSpawnPixels(bounds);
                break;
            case 'refreshPheromones':
                eventBus.emit('debug:refreshPheromones');
                break;
            case 'hatchEggs':
                eventBus.emit('debug:hatchEggs');
                break;
            case 'hatchCocoons':
                eventBus.emit('debug:hatchCocoons');
                break;
            case 'flowersForCaterpillars':
                eventBus.emit('debug:flowersForCaterpillars');
                break;
            case 'toggleSexLabels':
                this.showSexLabels = !this.showSexLabels;
                {
                    const sexButton = this.godModeButtons.find(button => button.id === 'toggleSexLabels');
                    if (sexButton) {
                        sexButton.text = `Sex Labels: ${this.showSexLabels ? 'On' : 'Off'}`;
                    }
                }
                break;
            case 'resetProgression':
                eventBus.emit('debug:resetProgression');
                break;
            case 'saveGameState':
                this.saveGameState();
                break;
            case 'loadGameState':
                this.loadGameState();
                break;
            case 'verifyRoundTrip':
                this.runRoundTripAudit();
                break;
            case 'captureSnapshot':
                this.captureSnapshot();
                break;
            case 'checkInvariants':
                this.runInvariantCheck();
                break;
            case 'compareSnapshots':
                this.runSnapshotDiffAudit();
                break;
            case 'loadAuditPreset':
                this.loadNextAuditPreset();
                break;
            case 'exportAuditSetup':
                this.exportAuditSetup();
                break;
            case 'importAuditSetup':
                this.importAuditSetup();
                break;
            case 'runGameplayAudit':
                this.runGameplayAudit();
                break;
            case 'reseedReplay':
                this.reseedReplaySession();
                break;
        }
    }

    setAuditState(partial = {}) {
        this.auditState = {
            ...this.auditState,
            ...partial,
            lastRunAt: Date.now()
        };
    }

    saveGameState() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        try {
            gameCore.saveGameToStorage?.();
            this.recordReplayAuditMarker('save-game', {
                scenarioLabel: this.auditState.scenarioLabel || 'none'
            });
            this.syncReplayAuditState();
            this.setAuditState({
                lastAction: 'Save Game',
                lastStatus: 'pass',
                lastMismatchCount: 0,
                lastError: null
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Save Game',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    loadGameState() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        try {
            const restored = gameCore.loadGameFromStorage?.();
            if (restored) {
                this.recordReplayAuditMarker('load-game', {
                    scenarioLabel: this.auditState.scenarioLabel || 'none'
                });
            }
            this.syncReplayAuditState();
            this.setAuditState({
                lastAction: 'Load Game',
                lastStatus: restored ? 'pass' : 'idle',
                lastMismatchCount: 0,
                lastError: restored ? null : 'No saved game found'
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Load Game',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    runRoundTripAudit() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;
        if (!gameCore.serializeGameState || !gameCore.applySerializedState || !gameCore.saveSystem?.compareSerializedDurableState) return;

        try {
            const before = gameCore.serializeGameState();
            const clone = JSON.parse(JSON.stringify(before));
            gameCore.applySerializedState(clone);
            this.syncReplayAuditState();
            const after = gameCore.serializeGameState();
            const mismatches = gameCore.saveSystem.compareSerializedDurableState(before, after)
                .filter(entry => entry.path !== 'meta.serializedAtMs');

            this.setAuditState({
                lastAction: 'Verify Roundtrip',
                lastStatus: mismatches.length === 0 ? 'pass' : 'warn',
                lastMismatchCount: mismatches.length,
                lastError: mismatches.length === 0 ? null : mismatches[0]?.path || 'Mismatch detected'
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Verify Roundtrip',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    captureSnapshot() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;
        if (!gameCore.serializeGameState) return;

        try {
            const snapshot = gameCore.serializeGameState();
            this.snapshotCounter += 1;
            const label = `snapshot_${this.snapshotCounter}_${Date.now()}`;
            this.auditSnapshots.set(label, snapshot);
            if (this.auditSnapshots.size > 6) {
                const oldestKey = this.auditSnapshots.keys().next().value;
                this.auditSnapshots.delete(oldestKey);
            }

            this.setAuditState({
                lastAction: 'Capture Snapshot',
                lastStatus: 'pass',
                lastMismatchCount: 0,
                lastError: null,
                snapshotLabel: label,
                comparedSnapshots: 'none'
            });
            this.syncReplayAuditState();
        } catch (error) {
            this.setAuditState({
                lastAction: 'Capture Snapshot',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    getRecentSnapshotLabels(limit = 2) {
        return Array.from(this.auditSnapshots.keys()).slice(-limit);
    }

    createAuditPresetBaseline() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return null;
        if (!gameCore.serializeGameState) return null;

        const baseline = JSON.parse(JSON.stringify(gameCore.serializeGameState()));
        const baselineSeed = gameCore.normalizeReplaySeed?.('audit-baseline') || 1;
        baseline.meta = {
            ...(baseline.meta || {}),
            serializedAtMs: 0,
            timeScale: 1,
            focusedZoneId: 'garden-core',
            viewMode: 'focused-garden',
            activeBattleId: null,
            replay: {
                sessionId: 'audit-baseline',
                seed: baselineSeed,
                startedAtMs: 0,
                lastSeededAtMs: 0,
                markerCounter: 0,
                deterministicCoverage: 'metadata-only',
                markers: []
            }
        };
        baseline.butterflies = [];
        baseline.flowers = [];
        baseline.caterpillars = [];
        baseline.progression = {
            encounteredButterflies: [],
            collectedButterflies: [],
            butterflyCollectionStats: {},
            hybridJournal: [],
            nextHybridId: 1
        };
        baseline.runtime = {
            butterflySpawnCounts: {},
            goldenButterflySpawned: false,
            feedingCombo: 0,
            lastFeedingTime: 0,
            maxCombo: 0,
            showButterflyCollection: false,
            pendingOffspringReservations: 0
        };
        baseline.foundations = {
            zones: baseline.foundations?.zones || {},
            statuses: {},
            objects: {},
            sleep: {},
            teaching: {
                packetsByEntityId: {},
                activeLessons: {}
            }
        };
        return baseline;
    }

    buildAuditPresetState(presetId) {
        const baseline = this.createAuditPresetBaseline();
        if (!baseline) return null;
        const replaySeed = gameCore.normalizeReplaySeed?.(`audit:${presetId}`) || 1;
        baseline.meta.replay = {
            sessionId: `audit_${presetId}`,
            seed: replaySeed,
            startedAtMs: 0,
            lastSeededAtMs: 0,
            markerCounter: 1,
            deterministicCoverage: 'metadata-only',
            markers: [
                {
                    index: 1,
                    label: 'audit-preset',
                    createdAtMs: 0,
                    frame: 0,
                    payload: { presetId }
                }
            ]
        };

        switch (presetId) {
            case 'sleep-assist-cluster':
                baseline.butterflies = [
                    { id: 'audit_sleep_target', personalityType: 'friendly', sex: 'F', x: 364, y: 196, state: 'normal', happiness: 58, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_sleep_helper', personalityType: 'mystic', sex: 'F', x: 332, y: 174, state: 'normal', happiness: 86, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_sleep_observer', personalityType: 'cautious', sex: 'M', x: 404, y: 176, state: 'normal', happiness: 67, baselineHappiness: 60, maxHappiness: 100 }
                ];
                baseline.flowers = [
                    { id: 'audit_flower_sleep', x: 352, y: 218, stage: 'mature', stageTimer: 600, isImmortal: true, flowerType: 'lily' }
                ];
                baseline.foundations.sleep = {
                    audit_sleep_target: { subtype: null, exhaustion: 0.88, sleepPressure: 0.74, oversleepPressure: 0.18, oversleepHabit: 0.05, settlingSeconds: 0, asleepSeconds: 0, lastSleepStartSeconds: 0, lastWakeSeconds: 0, lastWakeReason: null },
                    audit_sleep_helper: { subtype: null, exhaustion: 0.24, sleepPressure: 0.22, oversleepPressure: 0.04, oversleepHabit: 0.02, settlingSeconds: 0, asleepSeconds: 0, lastSleepStartSeconds: 0, lastWakeSeconds: 0, lastWakeReason: null },
                    audit_sleep_observer: { subtype: null, exhaustion: 0.36, sleepPressure: 0.3, oversleepPressure: 0.06, oversleepHabit: 0.03, settlingSeconds: 0, asleepSeconds: 0, lastSleepStartSeconds: 0, lastWakeSeconds: 0, lastWakeReason: null }
                };
                baseline.progression.encounteredButterflies = ['friendly', 'mystic', 'cautious'];
                break;
            case 'teaching-pair':
                baseline.butterflies = [
                    { id: 'audit_teacher', personalityType: 'wise', sex: 'F', x: 328, y: 176, state: 'normal', happiness: 82, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_listener', personalityType: 'friendly', sex: 'M', x: 370, y: 186, state: 'normal', happiness: 66, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_witness', personalityType: 'skittish', sex: 'F', x: 410, y: 198, state: 'normal', happiness: 71, baselineHappiness: 60, maxHappiness: 100 }
                ];
                baseline.flowers = [
                    { id: 'audit_flower_teach', x: 350, y: 224, stage: 'mature', stageTimer: 720, isImmortal: true, flowerType: 'rose' }
                ];
                baseline.foundations.teaching = {
                    packetsByEntityId: {
                        audit_teacher: [
                            { id: 'lesson_packet_audit_teacher_1', category: 'sleep', content: { source: 'audit-preset', note: 'rest near calm allies' }, warped: false, createdAtSeconds: 0 }
                        ]
                    },
                    activeLessons: {
                        audit_listener: { teacherId: 'audit_teacher', listenerId: 'audit_listener', lessonCategory: 'sleep', content: { source: 'audit-preset', note: 'comfort field demo' }, startedAtSeconds: 0 }
                    }
                };
                baseline.progression.encounteredButterflies = ['wise', 'friendly', 'skittish'];
                break;
            case 'trust-cascade-cluster':
                baseline.butterflies = [
                    { id: 'audit_cascade_source', personalityType: 'skittish', sex: 'F', x: 356, y: 182, state: 'normal', happiness: 78, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_cascade_friend', personalityType: 'friendly', sex: 'M', x: 324, y: 170, state: 'normal', happiness: 62, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_cascade_cautious', personalityType: 'cautious', sex: 'F', x: 394, y: 174, state: 'normal', happiness: 58, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_cascade_runner', personalityType: 'energetic', sex: 'M', x: 380, y: 210, state: 'normal', happiness: 68, baselineHappiness: 60, maxHappiness: 100 }
                ];
                baseline.flowers = [
                    { id: 'audit_flower_cascade', x: 360, y: 226, stage: 'mature', stageTimer: 680, isImmortal: true, flowerType: 'daisy' }
                ];
                baseline.progression.encounteredButterflies = ['skittish', 'friendly', 'cautious', 'energetic'];
                break;
            case 'social-routine-web':
                baseline.butterflies = [
                    { id: 'audit_social_teacher', personalityType: 'wise', sex: 'F', x: 324, y: 172, state: 'normal', happiness: 84, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_social_listener_a', personalityType: 'friendly', sex: 'M', x: 360, y: 182, state: 'normal', happiness: 63, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_social_listener_b', personalityType: 'cautious', sex: 'F', x: 392, y: 192, state: 'normal', happiness: 61, baselineHappiness: 60, maxHappiness: 100 },
                    { id: 'audit_social_witness', personalityType: 'mystic', sex: 'F', x: 346, y: 214, state: 'normal', happiness: 76, baselineHappiness: 60, maxHappiness: 100 }
                ];
                baseline.flowers = [
                    { id: 'audit_flower_social_a', x: 338, y: 232, stage: 'mature', stageTimer: 720, isImmortal: true, flowerType: 'rose' },
                    { id: 'audit_flower_social_b', x: 390, y: 236, stage: 'mature', stageTimer: 560, isImmortal: true, flowerType: 'lily' }
                ];
                baseline.foundations.teaching = {
                    packetsByEntityId: {
                        audit_social_teacher: [
                            { id: 'lesson_packet_audit_social_1', category: 'resource', content: { source: 'audit-preset', note: 'circle near the bloom edge' }, warped: false, createdAtSeconds: 0 },
                            { id: 'lesson_packet_audit_social_2', category: 'sleep', content: { source: 'audit-preset', note: 'rest after feeding' }, warped: false, createdAtSeconds: 0.4 }
                        ]
                    },
                    activeLessons: {
                        audit_social_listener_a: { teacherId: 'audit_social_teacher', listenerId: 'audit_social_listener_a', lessonCategory: 'resource', content: { source: 'audit-preset', note: 'flower path' }, startedAtSeconds: 0.1 },
                        audit_social_listener_b: { teacherId: 'audit_social_teacher', listenerId: 'audit_social_listener_b', lessonCategory: 'sleep', content: { source: 'audit-preset', note: 'calm cluster' }, startedAtSeconds: 0.25 }
                    }
                };
                baseline.progression.encounteredButterflies = ['wise', 'friendly', 'cautious', 'mystic'];
                break;
            case 'hybrid-lineage':
                baseline.butterflies = [
                    { id: 'audit_hybrid_guardian', personalityType: 'friendly', sex: 'F', x: 360, y: 182, state: 'normal', happiness: 74, baselineHappiness: 60, maxHappiness: 100, birthSource: 'bred', displayName: 'Aurel', isHybrid: true, hybridEntryId: 1, hybridGenome: { primary: { personalityType: 'friendly', sex: 'F' }, secondary: { personalityType: 'wise', sex: 'M' } } },
                    { id: 'audit_lineage_parent', personalityType: 'wise', sex: 'M', x: 320, y: 172, state: 'normal', happiness: 79, baselineHappiness: 60, maxHappiness: 100, birthSource: 'wild' }
                ];
                baseline.caterpillars = [
                    { id: 'audit_lineage_caterpillar', x: 392, y: 228, phase: 'seeking-flower', phaseStartedAt: 0, phaseTimeout: 240, targetFlowerId: 'audit_flower_lineage', dead: false, failReason: null, lifecycleData: { inheritedTraits: ['friendly', 'wise'] } }
                ];
                baseline.flowers = [
                    { id: 'audit_flower_lineage', x: 398, y: 238, stage: 'mature', stageTimer: 900, isImmortal: true, flowerType: 'sunflower' }
                ];
                baseline.progression.hybridJournal = [
                    { id: 1, displayName: 'Aurel', parentA: { personalityType: 'friendly', sex: 'F' }, parentB: { personalityType: 'wise', sex: 'M' }, createdAtMs: 0 }
                ];
                baseline.progression.nextHybridId = 2;
                baseline.progression.encounteredButterflies = ['friendly', 'wise'];
                break;
            case 'nursery-lineage':
                baseline.butterflies = [
                    {
                        id: 'audit_nursery_mother',
                        personalityType: 'friendly',
                        sex: 'F',
                        x: 344,
                        y: 182,
                        state: 'pregnant-travel',
                        happiness: 72,
                        baselineHappiness: 60,
                        maxHappiness: 100,
                        birthSource: 'bred',
                        displayName: 'Ilya',
                        isHybrid: true,
                        hybridEntryId: 2,
                        hybridGenome: { primary: { personalityType: 'friendly', sex: 'F' }, secondary: { personalityType: 'energetic', sex: 'M' } },
                        pregnancy: {
                            active: true,
                            lifecycleData: {
                                childSex: 'F',
                                parentA: { personalityType: 'friendly', sex: 'F' },
                                parentB: { personalityType: 'energetic', sex: 'M' },
                                hybridGenome: { wingDonors: {}, bodySex: 'F' },
                                inheritedTraits: { speed: 1.1, jitteriness: 1.05, trustPropensity: 1.2, trustSpeed: 1.1, scareThreshold: 3.9, happinessBonus: 1.0, special: 'welcome' },
                                inheritedColors: [[255, 160, 120], [180, 140, 255]],
                                inheritedAbility: 'welcome',
                                reservationActive: true
                            },
                            targetFlower: { id: 'audit_flower_nursery' }
                        }
                    },
                    { id: 'audit_nursery_partner', personalityType: 'energetic', sex: 'M', x: 312, y: 170, state: 'normal', happiness: 80, baselineHappiness: 60, maxHappiness: 100, birthSource: 'wild' },
                    { id: 'audit_nursery_guardian', personalityType: 'wise', sex: 'F', x: 386, y: 188, state: 'normal', happiness: 82, baselineHappiness: 60, maxHappiness: 100, birthSource: 'wild' }
                ];
                baseline.flowers = [
                    { id: 'audit_flower_nursery', x: 380, y: 234, stage: 'mature', stageTimer: 860, isImmortal: true, flowerType: 'sunflower' }
                ];
                baseline.progression.hybridJournal = [
                    { id: 2, displayName: 'Ilya', parentA: { personalityType: 'friendly', sex: 'F' }, parentB: { personalityType: 'energetic', sex: 'M' }, createdAtMs: 0 }
                ];
                baseline.progression.nextHybridId = 3;
                baseline.progression.encounteredButterflies = ['friendly', 'energetic', 'wise'];
                baseline.runtime.pendingOffspringReservations = 1;
                break;
            default:
                return null;
        }

        return baseline;
    }

    runSnapshotDiffAudit() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;
        if (!gameCore.saveSystem?.compareSerializedDurableState) return;

        const labels = this.getRecentSnapshotLabels(2);
        if (labels.length < 2) {
            this.setAuditState({
                lastAction: 'Compare Snapshots',
                lastStatus: 'idle',
                lastMismatchCount: 0,
                lastError: 'Capture at least two snapshots first',
                comparedSnapshots: 'insufficient snapshots'
            });
            return;
        }

        try {
            const [beforeLabel, afterLabel] = labels;
            const before = this.auditSnapshots.get(beforeLabel);
            const after = this.auditSnapshots.get(afterLabel);
            const mismatches = gameCore.saveSystem.compareSerializedDurableState(before, after)
                .filter(entry => entry.path !== 'meta.serializedAtMs');

            this.setAuditState({
                lastAction: 'Compare Snapshots',
                lastStatus: mismatches.length === 0 ? 'pass' : 'warn',
                lastMismatchCount: mismatches.length,
                lastError: mismatches.length === 0 ? null : mismatches[0]?.path || 'Snapshot mismatch detected',
                comparedSnapshots: `${beforeLabel} -> ${afterLabel}`
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Compare Snapshots',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    loadNextAuditPreset() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;
        if (!gameCore.applySerializedState) return;

        this.currentAuditScenarioIndex = (this.currentAuditScenarioIndex + 1) % this.auditScenarioPresets.length;
        const preset = this.auditScenarioPresets[this.currentAuditScenarioIndex];
        const serialized = this.buildAuditPresetState(preset.id);
        if (!serialized) {
            this.setAuditState({
                lastAction: 'Load Audit Preset',
                lastStatus: 'error',
                lastError: `Unable to build preset ${preset.id}`
            });
            return;
        }

        try {
            gameCore.applySerializedState(serialized);
            this.recordReplayAuditMarker('audit-preset-loaded', {
                presetId: preset.id,
                label: preset.label
            });
            this.syncReplayAuditState();
            eventBus?.emit?.(GameEvents?.DEBUG_AUDIT_SCENARIO_LOADED || 'debug:auditScenarioLoaded', {
                presetId: preset.id,
                label: preset.label
            });
            this.setAuditState({
                lastAction: 'Load Audit Preset',
                lastStatus: 'pass',
                lastMismatchCount: 0,
                lastError: null,
                scenarioLabel: preset.label
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Load Audit Preset',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    exportAuditSetup() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;
        if (!gameCore.serializeGameState || typeof localStorage === 'undefined') return;

        try {
            const serialized = gameCore.serializeGameState();
            localStorage.setItem(this.auditSetupStorageKey, JSON.stringify(serialized));
            this.recordReplayAuditMarker('audit-setup-exported', {
                scenarioLabel: this.auditState.scenarioLabel || 'none'
            });
            this.setAuditState({
                lastAction: 'Export Audit Setup',
                lastStatus: 'pass',
                lastMismatchCount: 0,
                lastError: null
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Export Audit Setup',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    importAuditSetup() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;
        if (!gameCore.applySerializedState || typeof localStorage === 'undefined') return;

        try {
            const raw = localStorage.getItem(this.auditSetupStorageKey);
            if (!raw) {
                this.setAuditState({
                    lastAction: 'Import Audit Setup',
                    lastStatus: 'idle',
                    lastMismatchCount: 0,
                    lastError: 'No exported audit setup found'
                });
                return;
            }

            gameCore.applySerializedState(JSON.parse(raw));
            this.recordReplayAuditMarker('audit-setup-imported', {
                scenarioLabel: this.auditState.scenarioLabel || 'none'
            });
            this.syncReplayAuditState();
            this.setAuditState({
                lastAction: 'Import Audit Setup',
                lastStatus: 'pass',
                lastMismatchCount: 0,
                lastError: null
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Import Audit Setup',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    runGameplayAudit() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        try {
            this.recordReplayAuditMarker('gameplay-audit-started', {
                scenarioLabel: this.auditState.scenarioLabel || 'none'
            });
            this.captureSnapshot();
            const firstSnapshot = this.auditState.snapshotLabel;
            this.runRoundTripAudit();
            const roundTripState = {
                status: this.auditState.lastStatus,
                mismatches: this.auditState.lastMismatchCount,
                detail: this.auditState.lastError
            };

            this.runInvariantCheck();
            const invariantState = {
                status: this.auditState.lastStatus,
                mismatches: this.auditState.lastMismatchCount,
                detail: this.auditState.lastError
            };

            this.captureSnapshot();
            const secondSnapshot = this.auditState.snapshotLabel;
            this.runSnapshotDiffAudit();
            const diffState = {
                status: this.auditState.lastStatus,
                mismatches: this.auditState.lastMismatchCount,
                detail: this.auditState.lastError
            };

            const statuses = [roundTripState.status, invariantState.status, diffState.status];
            const overallStatus = statuses.includes('error')
                ? 'error'
                : (statuses.includes('warn') ? 'warn' : 'pass');
            const totalMismatches =
                (roundTripState.mismatches || 0) +
                (invariantState.mismatches || 0) +
                (diffState.mismatches || 0);
            const battleLogCount = typeof battleSystem !== 'undefined'
                ? (battleSystem.getBattleEvents?.(gameCore?.getGameState?.().activeBattleId || null)?.length || 0)
                : 0;
            const report = {
                createdAtMs: Date.now(),
                overallStatus,
                roundTrip: roundTripState,
                invariants: invariantState,
                snapshotDiff: diffState,
                battleLogCount,
                comparedSnapshots: `${firstSnapshot} -> ${secondSnapshot}`,
                scenarioLabel: this.auditState.scenarioLabel || 'none',
                replay: this.getReplayMetadata(),
                telemetry: gameCore.getTelemetrySnapshot?.() || null
            };
            const savedAuditReports = this.persistAuditReport(report);
            this.recordReplayAuditMarker('gameplay-audit-finished', {
                overallStatus,
                mismatches: totalMismatches,
                reportCount: savedAuditReports
            });
            this.syncReplayAuditState();

            this.setAuditState({
                lastAction: 'Run Gameplay Audit',
                lastStatus: overallStatus,
                lastMismatchCount: totalMismatches,
                lastError: roundTripState.detail || invariantState.detail || diffState.detail || null,
                comparedSnapshots: `${firstSnapshot} -> ${secondSnapshot}`,
                gameplayAuditStatus: `${overallStatus} | rt ${roundTripState.status} / inv ${invariantState.status} / diff ${diffState.status} / battle ${battleLogCount}`,
                savedAuditReports
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Run Gameplay Audit',
                lastStatus: 'error',
                gameplayAuditStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    reseedReplaySession() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        try {
            const nextSeed = gameCore.normalizeReplaySeed?.(`${Date.now()}_${this.auditState.scenarioLabel || 'manual'}`) || Date.now();
            const replay = gameCore.reseedReplaySession?.(nextSeed, {
                newSession: true,
                markerLabel: 'debug-reseed'
            });
            this.syncReplayAuditState();
            this.setAuditState({
                lastAction: 'Reseed Session',
                lastStatus: 'pass',
                lastMismatchCount: 0,
                lastError: null,
                replaySessionLabel: replay?.sessionId || this.auditState.replaySessionLabel,
                replaySeedLabel: String(replay?.seed ?? this.auditState.replaySeedLabel)
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Reseed Session',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    runInvariantCheck() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        try {
            const state = gameCore.getGameState();
            const failures = [];
            const knownSleepSubtypes = new Set(gameConfig?.registries?.sleepSubtypes || []);

            for (const butterfly of state.butterflies || []) {
                const sleepState = typeof sleepSystem !== 'undefined'
                    ? sleepSystem.getSleepState?.(butterfly.id)
                    : null;
                if (sleepState?.subtype && !knownSleepSubtypes.has(sleepState.subtype)) {
                    failures.push(`invalid sleep subtype:${butterfly.id}`);
                }
                if (sleepState && butterfly.lifeSim?.emotions && Math.abs((butterfly.lifeSim.emotions.exhaustion || 0) - sleepState.exhaustion) > 0.001) {
                    failures.push(`sleep mismatch:${butterfly.id}`);
                }
                if (!butterfly.id) {
                    failures.push('butterfly missing id');
                }
            }

            for (const caterpillar of state.caterpillars || []) {
                if (!caterpillar.id) {
                    failures.push('caterpillar missing id');
                }
            }

            if (state.viewMode !== 'battle' && state.activeBattleId) {
                failures.push('active battle id leaked outside battle view');
            }

            this.setAuditState({
                lastAction: 'Check Invariants',
                lastStatus: failures.length === 0 ? 'pass' : 'warn',
                lastMismatchCount: failures.length,
                invariantFailures: failures.length,
                lastError: failures[0] || null
            });
        } catch (error) {
            this.setAuditState({
                lastAction: 'Check Invariants',
                lastStatus: 'error',
                lastError: error?.message || String(error)
            });
        }
    }

    summarizeEventEntry(entry) {
        if (!entry?.event) return 'unknown event';

        const frameLabel = typeof entry.frame === 'number' ? `f${entry.frame}` : 'f?';
        const data = entry.data || {};
        const actorId = data.actorId || data.sourceId || data.butterflyId || data.id || null;
        const targetId = data.targetId || data.zoneId || data.effectId || null;
        const detailParts = [];

        if (actorId) detailParts.push(String(actorId));
        if (targetId && targetId !== actorId) detailParts.push(`to ${targetId}`);

        return `${frameLabel} ${entry.event}${detailParts.length ? ` (${detailParts.join(' ')})` : ''}`;
    }

    summarizeBattleEventEntry(entry) {
        if (!entry?.eventType) return 'unknown battle event';

        const data = entry.payload || {};
        const actorId = data.actorId || null;
        const targetId = data.targetId || null;
        const valueParts = [];

        if (typeof data.delta === 'number') valueParts.push(`d${data.delta}`);
        if (typeof data.hp === 'number') valueParts.push(`hp${data.hp}`);
        if (typeof data.pressure === 'number') valueParts.push(`pr${data.pressure}`);
        if (data.channel) valueParts.push(data.channel);
        if (actorId) valueParts.push(actorId);
        if (targetId) valueParts.push(`to ${targetId}`);

        return `${entry.eventType}${valueParts.length ? ` (${valueParts.join(' ')})` : ''}`;
    }

    summarizeAuditReport(report) {
        if (!report) return 'none saved';
        const createdAt = typeof report.createdAtMs === 'number'
            ? new Date(report.createdAtMs).toLocaleTimeString()
            : 'unknown';
        return `${report.overallStatus || 'unknown'} @ ${createdAt} (${report.scenarioLabel || 'none'})`;
    }

    summarizeReplayMarker(marker) {
        if (!marker?.label) return 'none';
        const frameLabel = typeof marker.frame === 'number' ? `f${marker.frame}` : 'f?';
        return `${frameLabel} ${marker.label}`;
    }

    truncateDebugText(text, maxLength = 56) {
        const value = String(text ?? '');
        if (value.length <= maxLength) return value;
        return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
    }
    
    godSpawnButterfly(bounds) {
        // Pick random location within grid bounds
        const gridX = random(1, bounds.maxX - 1);
        const gridY = random(1, bounds.maxY - 1);
        const screenPos = gridManager.isoToScreen(gridX, gridY);
        
        // Random butterfly colors from config
        const butterflyColors = gameConfig.entities.butterfly.colors;
        const colors = random(butterflyColors);
        
        // Spawn at proper height offset
        const spawnY = screenPos.y - gameConfig.entities.heightOffset.butterfly;
        
        eventBus.emit('debug:spawnButterfly', { 
            x: screenPos.x, 
            y: spawnY, 
            colors: colors 
        });
        
        console.log('🦋 God Mode: Spawned butterfly at', gridX, gridY);
    }
    
    godSpawnFlower(bounds) {
        // Pick random location within grid bounds
        const gridX = random(2, bounds.maxX - 2);
        const gridY = random(2, bounds.maxY - 2);
        const screenPos = gridManager.isoToScreen(gridX, gridY);
        
        eventBus.emit('debug:spawnFlower', { 
            x: screenPos.x, 
            y: screenPos.y 
        });
        
        console.log('🌸 God Mode: Spawned flower at', gridX, gridY);
    }
    
    godSpawnPixels(bounds) {
        // Pick random location within grid bounds
        const gridX = random(1, bounds.maxX - 1);
        const gridY = random(1, bounds.maxY - 1);
        const screenPos = gridManager.isoToScreen(gridX, gridY);
        
        // Spawn above ground like butterfly would
        const spawnY = screenPos.y - gameConfig.entities.heightOffset.butterfly;
        
        // Get game state to access particle system
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const particleSystem = gameCore.particleSystem;
            
            // Spawn same amount as butterfly would drop (3-6 pixels)
            const numPixels = floor(random(3, 6));
            const butterflyColors = gameConfig.entities.butterfly.colors;
            const colors = random(butterflyColors);
            
            for (let i = 0; i < numPixels; i++) {
                const color = random(colors);
                const offsetX = random(-5, 5);
                const offsetY = random(-5, 5);
                
                particleSystem.emit(
                    screenPos.x + offsetX,
                    spawnY + offsetY,
                    color,
                    1,
                    'scale'
                );
            }
            
            console.log('✨ God Mode: Spawned', numPixels, 'pixels at', gridX, gridY);
        }
    }
    
    // Export zone data to console
    exportZoneData() {
        console.log('=== TILE DATA EXPORT ===');
        
        if (this.walkableTiles.size > 0) {
            console.log('const walkableTiles = [');
            for (let tileKey of this.walkableTiles) {
                const [x, y] = tileKey.split(',');
                console.log(`  { x: ${x}, y: ${y} },`);
            }
            console.log('];');
            console.log('');
        }
        
        if (this.blockedTiles.size > 0) {
            console.log('const blockedTiles = [');
            for (let tileKey of this.blockedTiles) {
                const [x, y] = tileKey.split(',');
                console.log(`  { x: ${x}, y: ${y} },`);
            }
            console.log('];');
        }
        
        console.log('========================');
    }
    
    // Draw debug overlays
    draw(graphics) {
        if (!this.enabled) return;
        
        this.drawGrid(graphics);
        this.drawTileStates(graphics);
        this.drawDebugCursor(graphics);
        this.drawButterflyPaths(graphics);
        this.drawSexLabels(graphics);
        this.drawDebugUI(graphics);
        this.drawGodModeButtons(graphics);
    }
    
    // Draw isometric grid using unified system
    drawGrid(graphics) {
        // Use gridManager's unified grid drawing
        gridManager.drawGrid(graphics);
        
        // Add boundary outline
        gridManager.drawBoundary(graphics);
    }
    
    // Draw tile states (walkable/blocked)
    drawTileStates(graphics) {
        // Draw walkable tiles
        for (let tileKey of this.walkableTiles) {
            const [x, y] = tileKey.split(',').map(Number);
            gridManager.drawTile(graphics, x, y, [100, 255, 100, 50]);
        }
        
        // Draw blocked tiles
        for (let tileKey of this.blockedTiles) {
            const [x, y] = tileKey.split(',').map(Number);
            gridManager.drawTile(graphics, x, y, [255, 100, 100, 50]);
        }
    }
    
    // Draw debug cursor
    drawDebugCursor(graphics) {
        // Draw cursor outline using unified tile function
        gridManager.drawTile(graphics, this.cursorX, this.cursorY, null, [255, 255, 255, 200], 2);
        
        // Show tool-specific visual feedback
        const toolColors = {
            butterfly: [255, 150, 100, 50],
            flower: [150, 255, 150, 50],
            walkable: [100, 255, 100, 50],
            blocked: [255, 100, 100, 50]
        };
        
        if (toolColors[this.selectedTool]) {
            // Draw tool preview using unified tile function
            gridManager.drawTile(graphics, this.cursorX, this.cursorY, toolColors[this.selectedTool]);
        }
    }
    
    // Draw debug UI panel
    drawDebugUI(graphics) {
        const replay = this.syncReplayAuditState();
        const latestReport = this.getLatestAuditReport();
        const latestReplayMarker = Array.isArray(replay?.markers) && replay.markers.length > 0
            ? replay.markers[replay.markers.length - 1]
            : null;
        const gridLabel = gridManager?.tileWidth && gridManager?.tileHeight
            ? `${gridManager.tileWidth}x${gridManager.tileHeight}px iso`
            : 'grid metrics unavailable';
        graphics.fill(0, 0, 0, 150);
        graphics.noStroke();
        graphics.rect(10, 10, 395, 496);
        
        graphics.fill(255);
        graphics.textAlign(LEFT);
        graphics.text('DEBUG MODE (D to toggle)', 15, 25);
        graphics.text(`Cursor: ${this.cursorX}, ${this.cursorY}`, 15, 45);
        graphics.text(`Tool: ${this.selectedTool}`, 15, 65);
        graphics.text('Arrow keys: Move cursor', 15, 85);
        graphics.text('Q/E: Change tool', 15, 105);
        
        if (this.selectedTool === 'walkable' || this.selectedTool === 'blocked') {
            graphics.text('Space: Toggle tile state', 15, 125);
        } else {
            graphics.text('Space: Place entity', 15, 125);
        }
        
        graphics.text('X: Export data', 15, 145);
        graphics.text('C: Collection   R: Rename hybrid', 15, 165);
        graphics.text('K: Save   L: Load   V: Verify   N: Snapshot diff', 15, 185);
        graphics.text('P: Preset   O: Export setup   U: Import setup', 15, 200);
        graphics.text('Y: Gameplay audit   J: Reseed session', 15, 215);
        
        // Show bounds configuration info
        graphics.textSize(10);
        graphics.fill(200);
        graphics.text(`Bounds: (0,0) to (${gridManager.bounds.maxX},${gridManager.bounds.maxY})`, 15, 220);
        graphics.text(`Grid: ${gridLabel}`, 15, 235);
        let telemetry = null;
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const state = gameCore.getGameState();
            telemetry = gameCore.getTelemetrySnapshot?.() || null;
            graphics.text(`Adults: ${state.butterflies.length}  Caterpillars: ${(state.caterpillars || []).length}`, 15, 250);
            graphics.text(`Hybrids saved: ${(state.hybridJournal || []).length}  Pending births: ${state.pendingOffspringReservations || 0}`, 15, 262);
            graphics.text(`View: ${state.viewMode || 'focused-garden'}  Zone: ${state.focusedZoneId || 'none'}`, 15, 274);
        }
        const auditLabel = this.auditState.lastRunAt
            ? new Date(this.auditState.lastRunAt).toLocaleTimeString()
            : 'not run';
        if (telemetry) {
            graphics.text(`Perf avg: upd ${telemetry.averages.updateMs.toFixed(2)}ms  rnd ${telemetry.averages.renderMs.toFixed(2)}ms`, 15, 286);
            graphics.text(`Particles: ${telemetry.lastRenderSample?.particleCount || 0}  p-rnd ${telemetry.averages.particleRenderMs.toFixed(2)}ms`, 15, 298);
        } else {
            graphics.text('Perf avg: telemetry unavailable', 15, 286);
            graphics.text('Particles: telemetry unavailable', 15, 298);
        }
        graphics.text(this.truncateDebugText(`Replay: ${replay?.sessionId || 'none'} | seed ${replay?.seed ?? 'n/a'} | markers ${replay?.markers?.length || 0}`), 15, 310);
        graphics.text(this.truncateDebugText(`Audit: ${this.auditState.lastAction} | ${this.auditState.lastStatus} | mismatches ${this.auditState.lastMismatchCount}`), 15, 322);
        if (this.auditState.lastError) {
            graphics.text(this.truncateDebugText(`Last detail: ${this.auditState.lastError}`), 15, 334);
        } else {
            graphics.text(`Last detail: ${auditLabel}`, 15, 334);
        }
        graphics.text(this.truncateDebugText(`Snapshot: ${this.auditState.snapshotLabel}  Invariants: ${this.auditState.invariantFailures}`), 15, 348);
        graphics.text(this.truncateDebugText(`Diff: ${this.auditState.comparedSnapshots}`), 15, 360);
        graphics.text(this.truncateDebugText(`Preset: ${this.auditState.scenarioLabel}`), 15, 372);
        graphics.text(this.truncateDebugText(`Gameplay audit: ${this.auditState.gameplayAuditStatus}`), 15, 384);
        graphics.text(`Saved audit reports: ${this.auditState.savedAuditReports}`, 15, 396);
        graphics.text(this.truncateDebugText(`Latest report: ${this.summarizeAuditReport(latestReport)}`), 15, 408);
        const eventHistorySize = typeof eventBus !== 'undefined' ? eventBus.getHistory?.().length || 0 : 0;
        graphics.text(this.truncateDebugText(`Last replay marker: ${this.summarizeReplayMarker(latestReplayMarker)}`), 15, 420);
        graphics.text(`Event timeline entries: ${eventHistorySize}`, 15, 432);

        const recentEvents = typeof eventBus !== 'undefined'
            ? (eventBus.getHistory?.() || []).slice(-3).reverse()
            : [];
        let eventY = 446;
        for (const entry of recentEvents) {
            graphics.text(this.truncateDebugText(`- ${this.summarizeEventEntry(entry)}`), 15, eventY);
            eventY += 12;
        }

        const battleEvents = typeof battleSystem !== 'undefined'
            ? (battleSystem.getRecentBattleEvents?.(gameCore?.getGameState?.().activeBattleId || null, 3) || [])
            : [];
        if (battleEvents.length > 0) {
            graphics.text(`Battle log entries: ${battleEvents.length}`, 15, eventY + 2);
            eventY += 14;
            for (const entry of battleEvents) {
                graphics.text(this.truncateDebugText(`= ${this.summarizeBattleEventEntry(entry)}`), 15, eventY);
                eventY += 12;
            }
        }
        graphics.textSize(12);
    }
    
    // Draw butterfly targeting paths
    drawButterflyPaths(graphics) {
        // Get butterflies from gameCore if available
        let butterflies = [];
        let flowers = [];
        
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const gameState = gameCore.getGameState();
            butterflies = gameState.butterflies || [];
            flowers = gameState.flowers || [];
        }
        
        graphics.push();
        graphics.stroke(255, 100, 100, 150); // Red lines for paths
        graphics.strokeWeight(1);
        
        for (let butterfly of butterflies) {
            // Show path to goal position if butterfly has a goal (regardless of happiness for debug visibility)
            if (butterfly.goalGridPos) {
                const butterflyScreen = { x: butterfly.x, y: butterfly.y };
                const goalScreen = gridManager.isoToScreen(butterfly.goalGridPos.x, butterfly.goalGridPos.y);
                
                // Draw dashed line to goal
                this.drawDashedLine(graphics, butterflyScreen.x, butterflyScreen.y, goalScreen.x, goalScreen.y);
                
                // Draw small circle at goal
                graphics.noFill();
                graphics.ellipse(goalScreen.x, goalScreen.y, 8, 8);
                
                // Find which flower this goal corresponds to
                for (let flower of flowers) {
                    const flowerGrid = gridManager.screenToIso(flower.x, flower.y);
                    const distToGoal = Math.hypot(flowerGrid.x - butterfly.goalGridPos.x, flowerGrid.y - butterfly.goalGridPos.y);
                    
                    if (distToGoal < 1) { // Close enough to be the target flower
                        // Highlight the target flower
                        graphics.stroke(255, 200, 100, 200); // Orange highlight
                        graphics.strokeWeight(2);
                        graphics.ellipse(flower.x, flower.y, 25, 25);
                        graphics.strokeWeight(1);
                        graphics.stroke(255, 100, 100, 150); // Back to red for paths
                        break;
                    }
                }
            }
            
            // Show path to feeding flower if currently feeding
            if (butterfly.state === 'feeding' && butterfly.targetFlower) {
                graphics.stroke(100, 255, 100, 200); // Green line for feeding
                graphics.strokeWeight(2);
                graphics.line(butterfly.x, butterfly.y, butterfly.targetFlower.x, butterfly.targetFlower.y);
                
                // Highlight feeding flower
                graphics.noFill();
                graphics.ellipse(butterfly.targetFlower.x, butterfly.targetFlower.y, 30, 30);
                graphics.strokeWeight(1);
            }
            
            // Show connection to cursor if following
            if (butterfly.state === 'following') {
                // Get cursor position from interaction system if available
                let cursorX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
                let cursorY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
                
                graphics.stroke(100, 200, 255, 150); // Light blue line for following
                graphics.strokeWeight(1);
                this.drawDashedLine(graphics, butterfly.x, butterfly.y, cursorX, cursorY, 8);
                
                // Show cursor target position
                graphics.noFill();
                graphics.stroke(100, 200, 255, 200);
                graphics.ellipse(cursorX, cursorY, 20, 20);
            }
            
            // Show butterfly happiness as a text label
            graphics.fill(255, 255, 255, 200);
            graphics.noStroke();
            graphics.textAlign(CENTER);
            graphics.textSize(8);
            graphics.text(`${Math.round(butterfly.happiness)}%`, butterfly.x, butterfly.y - 15);
            
            // Show butterfly state
            const stateColors = {
                'normal': [255, 255, 255],
                'feeding': [100, 255, 100],
                'scared': [255, 100, 100],
                'display': [255, 255, 100],
                'following': [100, 200, 255],
                'mating': [255, 180, 255],
                'pregnant-travel': [255, 210, 120]
            };
            const stateColor = stateColors[butterfly.state] || [255, 255, 255];
            graphics.fill(stateColor[0], stateColor[1], stateColor[2], 150);
            graphics.text(`${butterfly.state} ${butterfly.sex || '?'}`, butterfly.x, butterfly.y - 25);
            
            // Show goal info for debugging
            graphics.textSize(6);
            graphics.fill(200, 200, 200, 150);
            const hasGoal = butterfly.goalGridPos ? 'GOAL' : 'NO GOAL';
            const seekingFlowers = butterfly.seekingFlower ? 'SEEKING FLOWER' : 'NOT SEEKING';
            const happinessStatus = `H:${Math.round(butterfly.happiness)}%`;
            const pheromoneStatus = butterfly.sex === 'M'
                ? `CD:${Math.max(0, Math.ceil(((butterfly.pheromoneCooldownUntil || 0) - frameCount) / 60))}s`
                : (butterfly.pregnancy?.active ? 'PREG' : 'OPEN');
            graphics.text(`${hasGoal} | ${seekingFlowers} | ${happinessStatus} | ${pheromoneStatus}`, butterfly.x, butterfly.y - 35);
        }

        graphics.textSize(8);
        for (let flower of flowers) {
            if (flower.occupancyState && flower.occupancyState !== 'normal') {
                graphics.fill(255, 230, 180, 180);
                graphics.noStroke();
                graphics.text(flower.occupancyState.toUpperCase(), flower.x, flower.y - flower.stemHeight - 18);
            }
        }

        const caterpillars = (typeof gameCore !== 'undefined' && gameCore.isInitialized())
            ? (gameCore.getGameState().caterpillars || [])
            : [];
        for (const caterpillar of caterpillars) {
            graphics.fill(210, 255, 180, 180);
            graphics.noStroke();
            graphics.text(caterpillar.phase || 'caterpillar', caterpillar.x, caterpillar.y - 14);
        }
        
        graphics.pop();
    }
    
    // Helper function to draw dashed lines
    drawDashedLine(graphics, x1, y1, x2, y2, dashLength = 5) {
        const distance = Math.hypot(x2 - x1, y2 - y1);
        const dashCount = Math.floor(distance / dashLength);
        const dx = (x2 - x1) / dashCount;
        const dy = (y2 - y1) / dashCount;
        
        for (let i = 0; i < dashCount; i += 2) {
            const startX = x1 + dx * i;
            const startY = y1 + dy * i;
            const endX = x1 + dx * (i + 1);
            const endY = y1 + dy * (i + 1);
            graphics.line(startX, startY, endX, endY);
        }
    }
    
    // Draw boundary zones (when B key is held) using unified system
    drawBoundaryZones(graphics) {
        // Define zone configuration
        const zones = [
            { dist: 0, color: [100, 255, 100, 50], label: "Safe" },
            { dist: 50, color: [255, 255, 100, 40], label: "Soft" },
            { dist: 100, color: [255, 150, 100, 30], label: "Hard" },
            { dist: 150, color: [255, 100, 100, 20], label: "Max" }
        ];
        
        // Use unified boundary zone drawing
        gridManager.drawBoundaryZones(graphics, zones);
    }
    
    // Draw god mode testing buttons
    drawGodModeButtons(graphics) {
        const buttonY = this.getGodModeButtonBaseY();
        
        graphics.push();
        
        // Draw button panel background
        graphics.fill(0, 0, 0, 150);
        graphics.noStroke();
        graphics.rect(5, buttonY - 18, 470, 228);
        
        // Draw title
        graphics.fill(255);
        graphics.textAlign(LEFT);
        graphics.textSize(10);
        graphics.text('GOD MODE:', 10, buttonY - 10);
        
        // Draw buttons
        for (let button of this.godModeButtons) {
            // Button background
            graphics.fill(60, 60, 60);
            graphics.stroke(120);
            graphics.strokeWeight(1);
            graphics.rect(button.x, buttonY + button.y, button.width, button.height);
            
            // Button text
            graphics.fill(255);
            graphics.noStroke();
            graphics.textAlign(CENTER);
            graphics.textSize(11);
            graphics.text(button.text, button.x + button.width/2, buttonY + button.y + 16);
        }
        
        graphics.pop();
    }

    drawSexLabels(graphics) {
        if (!this.enabled || !this.showSexLabels) return;
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized()) return;

        const butterflies = gameCore.getGameState().butterflies || [];
        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(12);
        graphics.textStyle(BOLD);
        graphics.noStroke();

        for (const butterfly of butterflies) {
            graphics.fill(0, 0, 0, 160);
            graphics.rect(butterfly.x - 8, butterfly.y - 28, 16, 14, 4);
            graphics.fill(butterfly.sex === 'M' ? 120 : 255, butterfly.sex === 'M' ? 200 : 130, 255, 255);
            graphics.text(butterfly.sex || '?', butterfly.x, butterfly.y - 21);
        }

        graphics.textStyle(NORMAL);
        graphics.pop();
    }
}

// Create global instance
const debugUI = new DebugUI();
