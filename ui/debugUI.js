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
        this.showGridOverlay = false;
        this.showPathOverlay = false;
        this.auditState = {
            lastAction: 'None',
            lastStatus: 'idle',
            lastMismatchCount: 0,
            lastRunAt: null,
            lastError: null,
            lastDetail: 'No debug action has run yet',
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
            { id: 'spawnBlock', text: 'Spawn Block', x: 250, y: 0, width: 100, height: 25 },
            { id: 'refreshPheromones', text: 'Refresh Male Pheromone', x: 10, y: 32, width: 160, height: 25 },
            { id: 'hatchEggs', text: 'Hatch Eggs', x: 180, y: 32, width: 90, height: 25 },
            { id: 'hatchCocoons', text: 'Hatch Cocoons', x: 280, y: 32, width: 110, height: 25 },
            { id: 'flowersForCaterpillars', text: 'Feed Caterpillars', x: 10, y: 64, width: 160, height: 25 },
            { id: 'toggleSexLabels', text: 'Sex Labels: Off', x: 180, y: 64, width: 120, height: 25 },
            { id: 'resetProgression', text: 'Reset Progression', x: 310, y: 64, width: 130, height: 25 },
            { id: 'loadGameState', text: 'Restore Save', x: 130, y: 96, width: 110, height: 25 },
            { id: 'exportCurrentSave', text: 'Export Save', x: 250, y: 96, width: 110, height: 25 },
            { id: 'startSessionCapture', text: 'Start Capture', x: 10, y: 128, width: 110, height: 25 },
            { id: 'exportSessionCapture', text: 'Export Capture', x: 130, y: 128, width: 110, height: 25 },
            { id: 'checkInvariants', text: 'Check World', x: 160, y: 128, width: 140, height: 25 },
            { id: 'runGameplayAudit', text: 'Audit World', x: 10, y: 192, width: 180, height: 25 },
            { id: 'reseedReplay', text: 'New Replay Seed', x: 200, y: 192, width: 130, height: 25 }
        ];
        this.lastDebugPanelBounds = null;
        this.godModeButtonRects = [];
        this.lastSpatialFocusSummary = null;
        this.lastMlExplainabilitySummary = null;
        this.textLayoutCache = new Map();
    }

    getAuditSetupStorage() {
        if (typeof sessionStorage !== 'undefined') return sessionStorage;
        if (typeof localStorage !== 'undefined') return localStorage;
        return null;
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
            this.lastSpatialFocusSummary = null;
            this.lastMlExplainabilitySummary = null;
            const sexButton = this.godModeButtons.find(button => button.id === 'toggleSexLabels');
            if (sexButton) sexButton.text = 'Sex Labels: Off';
        }
    }

    isDomPanelEnabled() {
        return this.enabled && !!gameConfig?.performance?.flags?.shellUiDom;
    }

    getCompactDockLayout(width = null, height = null) {
        const canvasWidth = width || gameConfig?.canvas?.targetWidth || window?.width || 960;
        const canvasHeight = height || gameConfig?.canvas?.targetHeight || window?.height || 540;
        const reserveTop = Math.max(
            300,
            Math.min(canvasHeight - 92, gameConfig?.world?.mapGeometry?.uiReserveTop || (canvasHeight - 110))
        );
        const dockMargin = 8;
        const dockWidth = Math.min(448, canvasWidth - (dockMargin * 2));
        const dockHeight = Math.max(98, canvasHeight - reserveTop - dockMargin);
        const dockX = canvasWidth - dockWidth - dockMargin;
        const dockY = canvasHeight - dockHeight - dockMargin;
        const innerX = dockX + 6;
        const innerY = dockY + 20;
        const innerWidth = dockWidth - 12;
        const innerHeight = dockHeight - 26;
        const buttonGap = 4;
        const buttonPadding = 4;
        const buttonColumns = innerWidth >= 360 ? 4 : 3;
        const buttonHeight = 15;
        const controlsHeaderHeight = 26;
        const buttonWidth = Math.floor((innerWidth - (buttonPadding * 2) - (buttonGap * (buttonColumns - 1))) / buttonColumns);
        return {
            dockX,
            dockY,
            dockWidth,
            dockHeight,
            innerX,
            innerY,
            innerWidth,
            innerHeight,
            buttonGap,
            buttonPadding,
            buttonColumns,
            buttonHeight,
            controlsHeaderHeight,
            buttonWidth
        };
    }

    buildDomPanelState() {
        if (!this.isDomPanelEnabled()) {
            return { visible: false };
        }
        const replay = this.syncReplayAuditState();
        const latestReport = this.getLatestAuditReport();
        const layout = this.getCompactDockLayout();
        const telemetry = gameCore?.getTelemetrySnapshot?.() || null;
        const gameState = typeof gameCore !== 'undefined' && gameCore.isInitialized?.()
            ? gameCore.getGameState()
            : null;
        const spatialFocus = this.buildSpatialFocusSnapshot(gameState);
        const auditLabel = this.auditState.lastRunAt
            ? new Date(this.auditState.lastRunAt).toLocaleTimeString()
            : 'No audits yet';
        return {
            visible: true,
            rect: {
                x: layout.dockX,
                y: layout.dockY,
                width: layout.dockWidth,
                height: layout.dockHeight
            },
            highContrast: !!gameUI?.accessibilitySettings?.highContrastUI,
            title: 'God Mode',
            subtitle: gameCore?.isResettingGame ? 'Resetting...' : 'Local-only test actions',
            detailLine: 'Restore Save reloads the autosave · Check World validates live state',
            statusTone: this.auditState.lastStatus || 'idle',
            statusLines: [
                `${(this.auditState.lastStatus || 'idle').toUpperCase()} · ${this.lastActionLabel(this.auditState.lastAction || 'None')}`,
                this.auditState.lastDetail || this.auditState.lastError || `Last update ${auditLabel}`,
                `Preset ${this.auditState.scenarioLabel} · Audit ${this.auditState.gameplayAuditStatus}`,
                `Snapshot ${this.auditState.snapshotLabel} · Diff ${this.truncateDebugText(this.auditState.comparedSnapshots, 18)}`,
                `Session ${this.truncateDebugText(this.auditState.replaySessionLabel || replay?.sessionId || 'none', 14)} | Seed ${this.truncateDebugText(this.auditState.replaySeedLabel || replay?.seed || 'n/a', 12)}`,
                `Mismatch ${this.auditState.lastMismatchCount} | Invariants ${this.auditState.invariantFailures} | Reports ${this.auditState.savedAuditReports}`,
                `Latest ${this.truncateDebugText(this.summarizeAuditReport(latestReport), 22)}`,
                ...this.getMemoryAuditLines(telemetry)
            ],
            buttons: this.godModeButtons.map(button => ({
                id: button.id,
                text: button.text,
                disabled: !!gameCore?.isResettingGame && button.id !== 'loadGameState'
            })),
            spatialFocus: spatialFocus
                ? {
                    title: spatialFocus.title || 'Spatial Focus',
                    lines: spatialFocus.lines || []
                }
                : null
        };
    }

    lastActionLabel(label = '') {
        return this.truncateDebugText(label, 24);
    }
    
    // Handle debug mode keyboard input
    handleKeyPress(key, keyCode) {
        if (!this.enabled) return false;
        return false;
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

        const baseWidth = gameConfig?.canvas?.baseWidth || gameConfig?.canvas?.targetWidth || width || 1;
        const baseHeight = gameConfig?.canvas?.baseHeight || gameConfig?.canvas?.targetHeight || height || 1;
        const targetWidth = gameConfig?.canvas?.targetWidth || baseWidth;
        const targetHeight = gameConfig?.canvas?.targetHeight || baseHeight;
        const adjustedX = mouseX * (baseWidth / Math.max(1, targetWidth));
        const adjustedY = mouseY * (baseHeight / Math.max(1, targetHeight));

        for (const buttonRect of this.godModeButtonRects) {
            if (adjustedX >= buttonRect.x && adjustedX <= buttonRect.x + buttonRect.width &&
                adjustedY >= buttonRect.y && adjustedY <= buttonRect.y + buttonRect.height) {
                this.handleGodModeAction(buttonRect.id);
                return true; // Consumed the click
            }
        }
        
        return false;
    }
    
    // Execute god mode actions
    handleGodModeAction(actionId) {
        const bounds = gridManager.bounds;

        if (gameCore?.isResettingGame && actionId !== 'loadGameState') {
            return;
        }
        
        switch (actionId) {
            case 'spawnButterfly':
                this.godSpawnButterfly(bounds);
                this.setActionFeedback('Spawn Butterfly', 'pass', 'Spawned one debug butterfly in the current zone');
                break;
            case 'spawnFlower':
                this.godSpawnFlower(bounds);
                this.setActionFeedback('Spawn Flower', 'pass', 'Spawned one flower in the current zone');
                break;
            case 'spawnBlock':
                this.godSpawnBlock(bounds);
                this.setActionFeedback('Spawn Block', 'pass', 'Spawned one block in a free spot in the current zone');
                break;
            case 'spawnPixels':
                this.godSpawnPixels(bounds);
                this.setActionFeedback('Spawn Pixels', 'pass', 'Spawned a local test particle burst');
                break;
            case 'refreshPheromones':
                eventBus.emit('debug:refreshPheromones');
                this.setActionFeedback('Refresh Male Pheromone', 'pass', 'Refreshed pheromone state for eligible males');
                break;
            case 'hatchEggs':
                eventBus.emit('debug:hatchEggs');
                this.setActionFeedback('Hatch Eggs', 'pass', 'Forced all eligible eggs to hatch immediately');
                break;
            case 'hatchCocoons':
                eventBus.emit('debug:hatchCocoons');
                this.setActionFeedback('Hatch Cocoons', 'pass', 'Forced all eligible cocoons to hatch immediately');
                break;
            case 'flowersForCaterpillars':
                eventBus.emit('debug:flowersForCaterpillars');
                this.setActionFeedback('Feed Caterpillars', 'pass', 'Spawned cocoon flowers directly under active caterpillars');
                break;
            case 'toggleSexLabels':
                this.showSexLabels = !this.showSexLabels;
                {
                    const sexButton = this.godModeButtons.find(button => button.id === 'toggleSexLabels');
                    if (sexButton) {
                        sexButton.text = `Sex Labels: ${this.showSexLabels ? 'On' : 'Off'}`;
                    }
                }
                this.setActionFeedback('Sex Labels', 'pass', `Sex labels ${this.showSexLabels ? 'enabled' : 'disabled'} for visible butterflies`);
                break;
            case 'resetProgression':
                this.setActionFeedback('Reset Progression', 'running', 'Resetting the world and progression to a fresh state');
                if (typeof gameCore !== 'undefined' && gameCore.resetGame) {
                    gameCore.resetGame(true).then(success => {
                        this.setActionFeedback(
                            'Reset Progression',
                            success ? 'pass' : 'fail',
                            success ? 'Fresh progression state applied' : 'Reset returned false'
                        );
                    }).catch(error => {
                        this.setActionFeedback('Reset Progression', 'fail', error?.message || String(error));
                    });
                } else {
                    eventBus.emit('debug:resetProgression');
                }
                break;
            case 'saveGameState':
                this.saveGameState();
                break;
            case 'loadGameState':
                this.loadGameState();
                break;
            case 'exportCurrentSave':
                this.exportCurrentSave();
                break;
            case 'startSessionCapture':
                this.startSessionCapture();
                break;
            case 'exportSessionCapture':
                this.exportSessionCapture();
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

    getAuditStatusPalette(status = 'idle') {
        switch (status) {
            case 'pass':
                return {
                    fill: [48, 88, 56, 224],
                    stroke: [126, 214, 148, 220],
                    text: [230, 255, 236, 255]
                };
            case 'warn':
                return {
                    fill: [92, 74, 34, 228],
                    stroke: [236, 196, 104, 220],
                    text: [255, 244, 214, 255]
                };
            case 'error':
            case 'fail':
                return {
                    fill: [96, 40, 40, 228],
                    stroke: [236, 126, 126, 220],
                    text: [255, 234, 234, 255]
                };
            case 'running':
                return {
                    fill: [48, 56, 88, 224],
                    stroke: [136, 168, 236, 220],
                    text: [235, 242, 255, 255]
                };
            default:
                return {
                    fill: [42, 46, 56, 220],
                    stroke: [156, 166, 186, 180],
                    text: [236, 240, 248, 255]
                };
        }
    }

    setActionFeedback(action, status, detail, extra = {}) {
        this.setAuditState({
            lastAction: action,
            lastStatus: status,
            lastDetail: detail || null,
            lastError: status === 'error' || status === 'fail' ? (detail || null) : null,
            ...extra
        });
    }

    async saveGameState() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        try {
            await gameCore.saveGameToStorage?.();
            this.recordReplayAuditMarker('save-game', {
                scenarioLabel: this.auditState.scenarioLabel || 'none'
            });
            this.syncReplayAuditState();
            this.setActionFeedback('Save Game', 'pass', 'Saved the current world into the single browser save slot', {
                lastMismatchCount: 0
            });
        } catch (error) {
            this.setActionFeedback('Save Game', 'error', error?.message || String(error));
        }
    }

    async loadGameState() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        try {
            const restored = await gameCore.loadGameFromStorage?.();
            if (restored) {
                this.recordReplayAuditMarker('load-game', {
                    scenarioLabel: this.auditState.scenarioLabel || 'none'
                });
            }
            this.syncReplayAuditState();
            this.setActionFeedback(
                'Restore Save',
                restored ? 'pass' : 'warn',
                restored
                    ? 'Reloaded the current browser save slot into the live world'
                    : 'No saved world was found in browser storage',
                { lastMismatchCount: 0 }
            );
        } catch (error) {
            this.setActionFeedback('Restore Save', 'error', error?.message || String(error));
        }
    }

    exportCurrentSave() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        try {
            const serialized = gameCore.serializeGameState?.();
            if (!serialized) {
                this.setActionFeedback('Export Save', 'warn', 'Could not serialize the current world');
                return;
            }

            const scenarioLabel = this.auditState.scenarioLabel && this.auditState.scenarioLabel !== 'none'
                ? this.auditState.scenarioLabel
                : 'manual';

            this.setActionFeedback('Export Save', 'running', 'Writing the current browser save to qa_logs/save_exports');
            fetch('/api/save-exports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    label: `playtest-${scenarioLabel}`,
                    serializedState: serialized
                })
            }).then(async response => {
                const result = await response.json().catch(() => ({}));
                if (!response.ok || !result?.ok) {
                    const message = response.status === 404
                        ? 'Save export endpoint is unavailable; restart the playtest server and try again'
                        : result?.error || `Save export failed with status ${response.status}`;
                    throw new Error(message);
                }
                this.recordReplayAuditMarker('save-exported', {
                    outputDir: result?.outputDir || null,
                    savePath: result?.savePath || null
                });
                this.syncReplayAuditState();
                this.setActionFeedback(
                    'Export Save',
                    'pass',
                    result?.outputDir
                        ? `Saved exported world | ${result.outputDir}`
                        : (result?.summaryPath
                            ? `Saved exported world | ${result.summaryPath}`
                            : 'Saved exported world'),
                    { lastMismatchCount: 0 }
                );
            }).catch(error => {
                this.setActionFeedback('Export Save', 'error', error?.message || String(error));
            });
        } catch (error) {
            this.setActionFeedback('Export Save', 'error', error?.message || String(error));
        }
    }

    startSessionCapture() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        try {
            const scenarioLabel = this.auditState.scenarioLabel && this.auditState.scenarioLabel !== 'none'
                ? this.auditState.scenarioLabel
                : 'manual';
            const summary = gameCore.telemetrySystem?.startSessionCapture?.(gameCore.getGameState(), {
                label: `playtest-${scenarioLabel}`
            }) || null;
            this.recordReplayAuditMarker('session-capture-started', {
                sessionId: summary?.sessionId || null,
                label: summary?.label || `playtest-${scenarioLabel}`
            });
            this.syncReplayAuditState();
            this.setActionFeedback(
                'Start Capture',
                'running',
                `Recording this play session${summary?.sessionId ? ` | ${summary.sessionId}` : ''}`,
                { lastMismatchCount: 0 }
            );
        } catch (error) {
            this.setActionFeedback('Start Capture', 'error', error?.message || String(error));
        }
    }

    exportSessionCapture() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

        const captureSummary = gameCore.telemetrySystem?.getSessionCaptureSummary?.() || null;
        if (!captureSummary?.active) {
            this.setActionFeedback('Export Capture', 'warn', 'No active session capture is running');
            return;
        }

        this.setActionFeedback('Export Capture', 'running', 'Writing session capture to qa_logs/session_captures');
        gameCore.telemetrySystem?.exportSessionCapture?.(gameCore.getGameState(), {
            source: 'debug-ui-export'
        }).then(result => {
            this.recordReplayAuditMarker('session-capture-exported', {
                sessionId: result?.summary?.sessionId || captureSummary.sessionId || null,
                outputDir: result?.outputDir || null
            });
            this.syncReplayAuditState();
            this.setActionFeedback(
                'Export Capture',
                'pass',
                result?.outputDir
                    ? `Saved capture export | ${result.outputDir}`
                    : (result?.summaryPath
                        ? `Saved capture export | ${result.summaryPath}`
                        : 'Saved capture export'),
                {
                    lastMismatchCount: 0
                }
            );
        }).catch(error => {
            this.setActionFeedback('Export Capture', 'error', error?.message || String(error));
        });
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

            this.setActionFeedback(
                'Verify Roundtrip',
                mismatches.length === 0 ? 'pass' : 'warn',
                mismatches.length === 0
                    ? 'Serialize → restore → serialize matched durable state'
                    : `Round-trip mismatch at ${mismatches[0]?.path || 'unknown path'}`,
                { lastMismatchCount: mismatches.length }
            );
        } catch (error) {
            this.setActionFeedback('Verify Roundtrip', 'error', error?.message || String(error));
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

            this.setActionFeedback('Capture Snapshot', 'pass', `Captured ${label}`, {
                lastMismatchCount: 0,
                snapshotLabel: label,
                comparedSnapshots: 'none'
            });
            this.syncReplayAuditState();
        } catch (error) {
            this.setActionFeedback('Capture Snapshot', 'error', error?.message || String(error));
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
            focusedZoneId: 'ivy-cloister',
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
            nextHybridId: 1,
            progressionOrderIndex: 0,
            unlockedButterflyTypes: ['friendly'],
            unlockHistory: [
                {
                    type: 'friendly',
                    unlockedAt: 0,
                    unlockedBy: 'starter',
                    unlockedFromType: null
                }
            ],
            starterPairsSeeded: {},
            perTypeUnlockStatus: {},
            perWildButterflyProgress: {}
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
                    { id: 'audit_flower_sleep', x: 352, y: 218, stage: 'mature', stageTimer: 600, isImmortal: true, flowerType: 'tulip' }
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
                    { id: 'audit_flower_teach', x: 350, y: 224, stage: 'mature', stageTimer: 720, isImmortal: true, flowerType: 'daisy' }
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
                    { id: 'audit_flower_social_a', x: 338, y: 232, stage: 'mature', stageTimer: 720, isImmortal: true, flowerType: 'daisy' },
                    { id: 'audit_flower_social_b', x: 390, y: 236, stage: 'mature', stageTimer: 560, isImmortal: true, flowerType: 'tulip' }
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
                    { id: 'audit_flower_lineage', x: 398, y: 238, stage: 'mature', stageTimer: 900, isImmortal: true, flowerType: 'bush' }
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
                    { id: 'audit_flower_nursery', x: 380, y: 234, stage: 'mature', stageTimer: 860, isImmortal: true, flowerType: 'bush' }
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
        const storage = this.getAuditSetupStorage();
        if (!gameCore.serializeGameState || !storage) return;

        try {
            const serialized = gameCore.serializeGameState();
            storage.setItem(this.auditSetupStorageKey, JSON.stringify(serialized));
            if (typeof localStorage !== 'undefined' && storage !== localStorage) {
                localStorage.removeItem(this.auditSetupStorageKey);
            }
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
        const storage = this.getAuditSetupStorage();
        if (!gameCore.applySerializedState || !storage) return;

        try {
            const raw = storage.getItem(this.auditSetupStorageKey)
                || (typeof localStorage !== 'undefined' ? localStorage.getItem(this.auditSetupStorageKey) : null);
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

            this.setActionFeedback(
                'Audit World',
                overallStatus,
                `rt ${roundTripState.status} | inv ${invariantState.status} | diff ${diffState.status} | battle events ${battleLogCount}`,
                {
                    lastMismatchCount: totalMismatches,
                    comparedSnapshots: `${firstSnapshot} -> ${secondSnapshot}`,
                    gameplayAuditStatus: `${overallStatus} | rt ${roundTripState.status} / inv ${invariantState.status} / diff ${diffState.status} / battle ${battleLogCount}`,
                    savedAuditReports
                }
            );
        } catch (error) {
            this.setActionFeedback('Audit World', 'error', error?.message || String(error), {
                gameplayAuditStatus: 'error'
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
            this.setActionFeedback(
                'New Replay Seed',
                'pass',
                `Started replay session ${replay?.sessionId || this.auditState.replaySessionLabel} with seed ${replay?.seed ?? this.auditState.replaySeedLabel}`,
                {
                    lastMismatchCount: 0,
                    replaySessionLabel: replay?.sessionId || this.auditState.replaySessionLabel,
                    replaySeedLabel: String(replay?.seed ?? this.auditState.replaySeedLabel)
                }
            );
        } catch (error) {
            this.setActionFeedback('New Replay Seed', 'error', error?.message || String(error));
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

            this.setActionFeedback(
                'Check World',
                failures.length === 0 ? 'pass' : 'warn',
                failures.length === 0 ? 'No invariant failures found' : failures[0] || 'Invariant failure detected',
                {
                    lastMismatchCount: failures.length,
                    invariantFailures: failures.length
                }
            );
        } catch (error) {
            this.setActionFeedback('Check World', 'error', error?.message || String(error));
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

    readTextLayoutCache(key, buildValue, maxEntries = 400) {
        if (!gameConfig?.performance?.flags?.textMeasureCache) {
            return buildValue();
        }
        if (this.textLayoutCache.has(key)) {
            const cached = this.textLayoutCache.get(key);
            this.textLayoutCache.delete(key);
            this.textLayoutCache.set(key, cached);
            return cached;
        }

        const value = buildValue();
        this.textLayoutCache.set(key, value);
        while (this.textLayoutCache.size > maxEntries) {
            const oldestKey = this.textLayoutCache.keys().next().value;
            this.textLayoutCache.delete(oldestKey);
        }
        return value;
    }

    truncateDebugText(text, maxLength = 56) {
        const value = String(text ?? '');
        return this.readTextLayoutCache(
            `truncate|${maxLength}|${value}`,
            () => (value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 3))}...`)
        );
    }

    getMlAuditLine() {
        const summary = typeof mlInferenceSystem !== 'undefined'
            ? mlInferenceSystem.getRuntimeSummary?.()
            : null;
        if (!summary) return 'ML unavailable';
        const source = summary.lastDecisionSource === 'ml'
            ? 'ML'
            : summary.lastDecisionSource === 'heuristic-fallback'
                ? 'FB'
                : 'HE';
        const backend = this.truncateDebugText(summary.backend || summary.runtime || 'heuristic-fallback', 16);
        const version = this.truncateDebugText(summary.modelVersionId || 'n/a', 16);
        return `ML ${source} | ${backend} | ${version} | fb ${summary.fallbackCount || 0}`;
    }

    getCaptureAuditLine(capture) {
        if (!capture) return 'Capture off';
        if (capture.active) {
            return `Capture ACTIVE | ${capture.timelineCount || 0} events | ${capture.runtimeIssueCount || 0} issues`;
        }
        if (capture.output?.outputDir) {
            const parts = String(capture.output.outputDir).split(/[\\/]/).filter(Boolean);
            const folderName = this.truncateDebugText(parts[parts.length - 1] || 'session-captures', 28);
            return `Capture saved | ${folderName}`;
        }
        return `Capture off | ${capture.timelineCount || 0} events | ${capture.runtimeIssueCount || 0} issues`;
    }

    getMemoryAuditLines(telemetry = null) {
        const memoryAttribution = telemetry?.memoryAttribution || telemetry?.memory?.attribution || null;
        if (!memoryAttribution?.enabled || !Array.isArray(memoryAttribution.summaryLines)) {
            return [];
        }
        return memoryAttribution.summaryLines.slice(0, 4);
    }

    buildMlExplainabilitySnapshot(gameState = gameCore?.getGameState?.()) {
        if (typeof mlInferenceSystem === 'undefined' || !gameState) {
            this.lastMlExplainabilitySummary = null;
            return null;
        }

        const focusEntity = gameUI?.getLockedInspectTarget?.(gameState)
            || this.resolveSpatialFocusEntity(gameState);
        if (!focusEntity?.id) {
            this.lastMlExplainabilitySummary = null;
            return null;
        }

        const summary = mlInferenceSystem.getEntitySummary?.(focusEntity.id, gameState) || null;
        const runtime = mlInferenceSystem.getRuntimeSummary?.() || null;
        if (!summary || !runtime) {
            this.lastMlExplainabilitySummary = null;
            return null;
        }

        const cleanText = (value = '') => String(value ?? '')
            .replaceAll('â€¢', '•')
            .replaceAll('Ã¢â‚¬Â¢', '|')
            .replaceAll('Â·', '·')
            .trim();
        const toPresentationPercent = (value = 0) => {
            const numeric = Number(value || 0);
            if (!Number.isFinite(numeric)) return 0;
            return numeric <= 1 ? Math.round(numeric * 100) : Math.round(numeric);
        };
        const lifeSimSummary = typeof lifeSimSystem !== 'undefined'
            ? lifeSimSystem.getEntitySummary?.(focusEntity.id) || null
            : null;
        const communicationSummary = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getCommunicationSummary?.(focusEntity.id) || null
            : null;
        const relationshipSummary = communicationSummary?.relationship || null;

        const avgGardenMs = Number(runtime?.performanceProfile?.avgGardenUpdateMs || 0).toFixed(2);
        const avgBattleMs = Number(runtime?.performanceProfile?.avgBattleDecisionMs || 0).toFixed(2);
        const gardenBudgetMs = Number(runtime?.performanceBudget?.focusedGardenInferenceMs || 0).toFixed(2);
        const battleBudgetMs = Number(runtime?.performanceBudget?.battleDecisionMs || 0).toFixed(2);
        const actionAltText = (summary?.policies?.action?.alternativeLabels || []).slice(0, 2).join(', ') || 'none';
        const socialLine = `Social ${cleanText(lifeSimSummary?.socialEcology?.societyLabel || 'mixed')} | ${cleanText(lifeSimSummary?.socialEcology?.headline || 'quiet')}`;
        const pairLine = `Pair ${cleanText(relationshipSummary?.pairTextureLabel || 'steady')} | follow ${toPresentationPercent(relationshipSummary?.followThrough || 0)} ${cleanText(relationshipSummary?.followThroughLabel || 'no strong carry-over')}`;
        const fieldLine = `Field ${cleanText(communicationSummary?.localSignalFieldLabel || 'quiet | no active field')}`;
        const lines = [
            `Path ${runtime.policyArtifactPath || 'n/a'} | ${summary.sourceLabel || 'FB'} ${summary.backend || runtime.backend || 'heuristic'}`,
            `Act ${summary.actionLabel || 'none'} | ${summary.policies?.action?.confidenceLabel || '0 low'} | next ${actionAltText}`,
            socialLine,
            pairLine,
            fieldLine,
            `Why ${summary.explainability?.action?.debugText || summary.explainability?.action?.shortText || 'no driver highlights'}`,
            `Budget G ${avgGardenMs}/${gardenBudgetMs}ms | B ${avgBattleMs}/${battleBudgetMs}ms`
        ];

        const snapshot = {
            focusId: focusEntity.id,
            title: 'ML Explain',
            lines,
            path: runtime.policyArtifactPath || null,
            whyText: summary.explainability?.action?.debugText || summary.explainability?.action?.shortText || null
        };
        this.lastMlExplainabilitySummary = snapshot;
        return snapshot;
    }

    wrapDebugText(text, maxLength = 32) {
        const value = String(text ?? '');
        return this.readTextLayoutCache(`wrap|${maxLength}|${value}`, () => {
            if (!value) return [''];
            if (value.length <= maxLength) return [value];

            const words = value.split(/\s+/);
            const lines = [];
            let current = '';

            for (const word of words) {
                if (!current) {
                    if (word.length <= maxLength) {
                        current = word;
                    } else {
                        lines.push(this.truncateDebugText(word, maxLength));
                    }
                    continue;
                }

                const candidate = `${current} ${word}`;
                if (candidate.length <= maxLength) {
                    current = candidate;
                    continue;
                }

                lines.push(current);
                current = word.length <= maxLength ? word : this.truncateDebugText(word, maxLength);
            }

            if (current) {
                lines.push(current);
            }

            return lines;
        });
    }

    resolveSpatialFocusEntity(gameState = gameCore?.getGameState?.()) {
        if (!gameState) return null;

        const inspectTarget = gameUI?.getLockedInspectTarget?.(gameState) || null;
        if (inspectTarget?.id) return inspectTarget;

        const focusedZoneId = gameCore?.getFocusedZoneId?.() || gameState?.focusedZoneId || null;
        const zoneButterflies = (gameState?.butterflies || []).filter(entity => {
            const zoneId = gameCore?.getEntityZoneId?.(entity, null)
                || entity?.currentZoneId
                || entity?.lifeSim?.lifecycle?.currentZoneId
                || null;
            return !focusedZoneId || zoneId === focusedZoneId;
        });

        const carryingButterfly = zoneButterflies.find(entity => {
            const summary = physicsSystem?.getEntitySpatialSummary?.(entity, gameState) || null;
            return !!summary?.carry?.attachedObjectId;
        });
        if (carryingButterfly) return carryingButterfly;
        if (zoneButterflies.length) return zoneButterflies[0];

        const visibleBlocks = (gameState?.blocks || []).filter(entity => {
            const zoneId = gameCore?.getEntityZoneId?.(entity, null)
                || entity?.currentZoneId
                || null;
            return !focusedZoneId || zoneId === focusedZoneId;
        });
        return visibleBlocks.find(entity => {
            const summary = physicsSystem?.getEntitySpatialSummary?.(entity, gameState) || null;
            return (summary?.stackHeight || 0) > 1 || summary?.supportState === 'carried';
        }) || visibleBlocks[0] || null;
    }

    buildSpatialFocusSnapshot(gameState = gameCore?.getGameState?.()) {
        if (typeof physicsSystem === 'undefined') {
            this.lastSpatialFocusSummary = null;
            return null;
        }

        const focusEntity = this.resolveSpatialFocusEntity(gameState);
        const focusSummary = physicsSystem.getEntitySpatialSummary?.(focusEntity, gameState) || null;
        if (!focusSummary) {
            this.lastSpatialFocusSummary = null;
            return null;
        }

        const linkedSummary = focusSummary.carry?.attachedObjectId
            ? physicsSystem.getEntitySpatialSummary?.(focusSummary.carry.attachedObjectId, gameState)
            : null;
        const lifeSimSummary = focusSummary.entityType === 'butterfly' && typeof lifeSimSystem !== 'undefined'
            ? lifeSimSystem.getEntitySummary?.(focusSummary.id) || null
            : null;
        const focusName = focusSummary.displayName || 'Focus';
        const lines = [
            `${focusName} | ${focusSummary.headline}`,
            `Contact ${focusSummary.contact?.contactStateLabel || 'open air'} | ${focusSummary.contact?.blocked ? `blocked ${focusSummary.contact?.blockedByCount || 1}` : `touch ${focusSummary.contact?.touchCount || 0}`}`,
            focusSummary.entityType === 'block'
                ? `Support ${focusSummary.supportState || 'grounded'} | stack ${focusSummary.stackHeight || 1}/${focusSummary.maxStackHeight || 3}`
                : focusSummary.carry?.attachedObjectId
                    ? `Carry ${linkedSummary?.displayName || focusSummary.carry.attachedObjectId} | material in tow`
                    : `Carry hands free | zone ${focusSummary.zoneLabel || 'unknown'}`
        ];

        if (lifeSimSummary?.socialEcology?.headline) {
            lines.push(`Rhythm ${lifeSimSummary.socialEcology.headline}`);
        }
        if (linkedSummary) {
            lines.push(`${linkedSummary.displayName || 'Block'} | ${linkedSummary.supportState || 'grounded'} | stack ${linkedSummary.stackHeight || 1}/${linkedSummary.maxStackHeight || 3}`);
        }

        const snapshot = {
            focusId: focusSummary.id,
            linkedId: linkedSummary?.id || null,
            title: 'Spatial Focus',
            lines
        };
        this.lastSpatialFocusSummary = snapshot;
        return snapshot;
    }

    drawSpatialFocusMiniPanel(graphics, bounds, snapshot) {
        if (!graphics || !bounds || !snapshot?.lines?.length) return;

        const lineHeight = 9;
        const panelWidth = Math.min(332, Math.max(224, bounds.width));
        const panelHeight = 22 + (snapshot.lines.length * lineHeight);
        const panelX = Math.max(8, bounds.x + bounds.width - panelWidth);
        const panelY = Math.max(8, bounds.y - panelHeight - 6);
        const wrappedLines = snapshot.lines.flatMap(line => this.wrapDebugText(line, Math.max(24, Math.floor((panelWidth - 16) / 6.2))));

        graphics.fill(0, 0, 0, 198);
        graphics.stroke(240, 212, 152, 108);
        graphics.strokeWeight(1);
        graphics.rect(panelX, panelY, panelWidth, 22 + (wrappedLines.length * lineHeight), 7);
        graphics.noStroke();
        graphics.fill(255, 242, 208, 255);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(10);
        graphics.text(snapshot.title || 'Spatial Focus', panelX + 8, panelY + 6);
        graphics.fill(240, 244, 250, 255);
        graphics.textSize(8);
        let lineY = panelY + 17;
        for (const line of wrappedLines) {
            graphics.text(line, panelX + 8, lineY);
            lineY += lineHeight;
        }
    }
    
    godSpawnButterfly(bounds) {
        const zoneId = gameCore?.getFocusedZoneId?.() || null;
        const screenPos = gameCore?.findValidButterflySpawnPoint?.(zoneId, {
            minDistance: 28,
            maxAttempts: 24
        }) || gameCore?.getRandomPlacementPoint?.(zoneId, 40);
        if (!screenPos) return;
        const gridX = Math.round(screenPos.x);
        const gridY = Math.round(screenPos.y);
        
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
        const zoneId = gameCore?.getFocusedZoneId?.() || null;
        const screenPos = gameCore?.getRandomPlacementPoint?.(zoneId, 34);
        if (!screenPos) return;
        const gridX = Math.round(screenPos.x);
        const gridY = Math.round(screenPos.y);
        
        eventBus.emit('debug:spawnFlower', { 
            x: screenPos.x, 
            y: screenPos.y 
        });
        
        console.log('🌸 God Mode: Spawned flower at', gridX, gridY);
    }
    
    godSpawnBlock(bounds) {
        const zoneId = gameCore?.getFocusedZoneId?.() || null;
        const zoneBlocks = gameCore?.getBlocksInZone?.(zoneId) || [];
        const screenPos = gameCore?.findValidBlockSpawnPoint?.(zoneId, zoneBlocks, {
            maxAttempts: 40,
            minDistance: 28
        }) || gameCore?.getRandomPlacementPoint?.(zoneId, 34);
        if (!screenPos) return;
        const gridX = Math.round(screenPos.x);
        const gridY = Math.round(screenPos.y);

        eventBus.emit('debug:spawnBlock', {
            zoneId,
            x: screenPos.x,
            y: screenPos.y
        });

        console.log('Block God Mode: Spawned block at', gridX, gridY);
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
        this.drawSexLabels(graphics);
        if (this.isDomPanelEnabled()) {
            return;
        }
        if (typeof this.drawDebugDockUICompact === 'function') {
            this.drawDebugDockUICompact(graphics);
            return;
        }
        if (typeof this.drawDebugDockUI === 'function') {
            this.drawDebugDockUI(graphics);
        }
    }

    drawDebugDockUICompact(graphics) {
        const layout = this.getCompactDockLayout(
            graphics?.width || null,
            graphics?.height || null
        );
        const {
            dockX,
            dockY,
            dockWidth,
            dockHeight,
            innerX,
            innerY,
            innerWidth,
            innerHeight,
            buttonGap,
            buttonPadding,
            buttonColumns,
            buttonHeight,
            controlsHeaderHeight,
            buttonWidth
        } = layout;

        const drawWrappedButtonLabel = (text, centerX, centerY, buttonRenderWidth) => {
            const maxChars = Math.max(10, Math.floor((buttonRenderWidth - 14) / 7));
            const wrapped = this.wrapDebugText(text, maxChars).slice(0, 2);
            if (wrapped.length <= 1) {
                graphics.text(wrapped[0] || text, centerX, centerY + 1);
                return;
            }
            graphics.text(wrapped[0], centerX, centerY - 5);
            graphics.text(wrapped[1], centerX, centerY + 5);
        };

        graphics.fill(0, 0, 0, 202);
        graphics.stroke(230, 236, 246, 100);
        graphics.strokeWeight(1);
        graphics.rect(dockX, dockY, dockWidth, dockHeight, 9);

        graphics.noStroke();
        graphics.fill(255);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(10);
        graphics.text('GOD MODE', dockX + 12, dockY + 7);

        graphics.fill(0, 0, 0, 188);
        graphics.stroke(230, 236, 246, 90);
        graphics.strokeWeight(1);
        graphics.rect(innerX, innerY, innerWidth, innerHeight, 8);

        graphics.noStroke();
        graphics.fill(255);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(8);
        graphics.text(
            gameCore?.isResettingGame ? 'Resetting...' : 'Local-only test actions',
            innerX + buttonPadding,
            innerY + 6
        );
        graphics.text(
            'Restore Save reloads the autosave · Check World validates live state',
            innerX + buttonPadding,
            innerY + 14
        );

        this.godModeButtonRects = [];
        for (let index = 0; index < this.godModeButtons.length; index++) {
            const button = this.godModeButtons[index];
            const column = index % buttonColumns;
            const row = Math.floor(index / buttonColumns);
            const buttonX = innerX + buttonPadding + (column * (buttonWidth + buttonGap));
            const buttonY = innerY + controlsHeaderHeight + buttonPadding + (row * (buttonHeight + buttonGap));
            const busy = !!gameCore?.isResettingGame && button.id !== 'loadGameState';

            graphics.fill(...(busy ? [82, 82, 82] : [60, 60, 60]));
            graphics.stroke(120);
            graphics.strokeWeight(1);
            graphics.rect(buttonX, buttonY, buttonWidth, buttonHeight, 4);

            graphics.fill(255);
            graphics.noStroke();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(7);
            drawWrappedButtonLabel(button.text, buttonX + (buttonWidth / 2), buttonY + (buttonHeight / 2), buttonWidth);

            this.godModeButtonRects.push({
                id: button.id,
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            });
        }

        this.lastDebugPanelBounds = {
            x: dockX,
            y: dockY,
            width: dockWidth,
            height: dockHeight,
            controlsPaneX: innerX,
            controlsPaneY: innerY,
            controlsPaneWidth: innerWidth,
            controlsPaneHeight: innerHeight
        };

        const gameState = typeof gameCore !== 'undefined' && gameCore.isInitialized()
            ? gameCore.getGameState()
            : null;
        const spatialFocus = this.buildSpatialFocusSnapshot(gameState);
        if (spatialFocus) {
            this.drawSpatialFocusMiniPanel(graphics, this.lastDebugPanelBounds, spatialFocus);
        }
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
        const canvasWidth = graphics?.width || gameConfig.canvas.targetWidth;
        const canvasHeight = graphics?.height || gameConfig.canvas.targetHeight;
        const panelX = 10;
        const panelY = 10;
        const panelWidth = Math.min(Math.max(460, Math.floor(canvasWidth * 0.54)), Math.max(460, canvasWidth - 180));
        const columnGap = 10;
        const innerPadding = 12;
        const leftColumnX = panelX + innerPadding;
        const rightColumnX = panelX + innerPadding + Math.floor((panelWidth - (innerPadding * 2) - columnGap) / 2) + columnGap;
        const columnWidth = Math.floor((panelWidth - (innerPadding * 2) - columnGap) / 2);
        const sectionGap = 10;
        const headerHeight = 40;

        const measureSection = (lines, width, lineHeight = 13) => {
            const maxChars = Math.max(18, Math.floor((width - 16) / 6.1));
            const wrapped = lines.flatMap(line => this.wrapDebugText(line, maxChars));
            const height = 30 + (wrapped.length * lineHeight);
            return { wrapped, height };
        };

        const drawSection = (title, x, y, width, wrappedLines, lineHeight = 13) => {
            const height = 30 + (wrappedLines.length * lineHeight);
            graphics.fill(0, 0, 0, 186);
            graphics.stroke(230, 236, 246, 90);
            graphics.strokeWeight(1);
            graphics.rect(x, y, width, height, 7);
            graphics.noStroke();
            graphics.fill(255, 245, 220, 255);
            graphics.textAlign(LEFT, TOP);
            graphics.textSize(11);
            graphics.text(title, x + 8, y + 7);
            graphics.fill(240, 244, 250, 255);
            graphics.textSize(10);
            let lineY = y + 22;
            for (const line of wrappedLines) {
                graphics.text(line, x + 8, lineY);
                lineY += lineHeight;
            }
            return height;
        };

        const drawWrappedButtonLabel = (text, centerX, centerY, width) => {
            const maxChars = Math.max(10, Math.floor((width - 14) / 7));
            const wrapped = this.wrapDebugText(text, maxChars).slice(0, 2);
            if (wrapped.length === 1) {
                graphics.text(wrapped[0], centerX, centerY + 1);
                return;
            }

            const baseY = centerY - 5;
            graphics.text(wrapped[0], centerX, baseY);
            graphics.text(wrapped[1], centerX, baseY + 10);
        };

        let telemetry = null;
        let capture = null;
        let spatialFocus = null;
        let mlExplainability = null;
        let worldLines = [
            `Cursor ${this.cursorX}, ${this.cursorY}`,
            `Tool ${this.selectedTool}`,
            `Bounds 0,0 to ${gridManager.bounds.maxX},${gridManager.bounds.maxY}`,
            `Grid ${gridLabel}`
        ];
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const state = gameCore.getGameState();
            telemetry = gameCore.getTelemetrySnapshot?.() || null;
            capture = telemetry?.sessionCapture || null;
            worldLines = worldLines.concat([
                `Adults ${state.butterflies.length} · Caterpillars ${(state.caterpillars || []).length}`,
                `Hybrids ${(state.hybridJournal || []).length} · Pending births ${state.pendingOffspringReservations || 0}`,
                `View ${state.viewMode || 'focused-garden'} · Zone ${state.focusedZoneId || 'none'}`
            ]);
            spatialFocus = this.buildSpatialFocusSnapshot(state);
            if (spatialFocus?.lines?.length) {
                worldLines = worldLines.concat(spatialFocus.lines.slice(0, 3));
            }
            mlExplainability = this.buildMlExplainabilitySnapshot(state);
        }
        const auditLabel = this.auditState.lastRunAt
            ? new Date(this.auditState.lastRunAt).toLocaleTimeString()
            : 'not run';

        const controlLines = [
            'Use the button dock for spawn and hatch actions',
            'Save / restore / verify / audit are button-driven',
            'Start Capture records a live session log',
            'Reset Progression resets the fresh ecology state',
            'No live debug placement hotkeys are bound',
            'Journal and rename stay in the main UI'
        ];

        const auditActionLines = [
            'Start Capture | Export Capture',
            'Save Game · Restore Save · Verify Roundtrip',
            'Capture Snapshot · Compare Snapshots',
            'Load Audit Preset · Export Audit Setup',
            'Import Audit Setup · Audit World',
            'New Replay Seed'
        ];

        const performanceLines = telemetry
            ? [
                `Update ${telemetry.averages.updateMs.toFixed(2)}ms · Render ${telemetry.averages.renderMs.toFixed(2)}ms`,
                `Particles ${telemetry.lastRenderSample?.particleCount || 0} · Particle render ${telemetry.averages.particleRenderMs.toFixed(2)}ms`
            ]
            : [
                'Telemetry unavailable',
                'No performance sample yet'
            ];

        if (capture) {
            performanceLines.push(`Capture ${capture.active ? 'ON' : 'off'} · events ${capture.timelineCount || 0} · issues ${capture.runtimeIssueCount || 0}`);
        }

        if (capture && performanceLines.length) {
            performanceLines[performanceLines.length - 1] = this.getCaptureAuditLine(capture);
        }

        const memoryAuditLines = this.getMemoryAuditLines(telemetry);
        if (memoryAuditLines.length) {
            performanceLines.push(...memoryAuditLines);
        }

        if (mlExplainability?.lines?.length) {
            performanceLines.push(...mlExplainability.lines);
        }

        const auditLines = [
            `Status ${this.auditState.lastStatus} · ${this.auditState.lastAction}`,
            `Mismatches ${this.auditState.lastMismatchCount} · Invariants ${this.auditState.invariantFailures}`,
            `Snapshot ${this.auditState.snapshotLabel}`,
            `Diff ${this.auditState.comparedSnapshots}`,
            `Preset ${this.auditState.scenarioLabel}`,
            `Gameplay audit ${this.auditState.gameplayAuditStatus}`,
            `Detail ${this.auditState.lastDetail || this.auditState.lastError || auditLabel}`,
            `Saved reports ${this.auditState.savedAuditReports}`,
            `Latest report ${this.summarizeAuditReport(latestReport)}`
        ];

        const replayLines = [
            `Session ${replay?.sessionId || 'none'}`,
            `Seed ${replay?.seed ?? 'n/a'} · Markers ${replay?.markers?.length || 0}`,
            `Last marker ${this.summarizeReplayMarker(latestReplayMarker)}`
        ];

        const eventHistorySize = typeof eventBus !== 'undefined' ? eventBus.getHistory?.().length || 0 : 0;
        const recentEvents = typeof eventBus !== 'undefined'
            ? (eventBus.getHistory?.() || []).slice(-2).reverse()
            : [];
        const battleEvents = typeof battleSystem !== 'undefined'
            ? (battleSystem.getRecentBattleEvents?.(gameCore?.getGameState?.().activeBattleId || null, 1) || [])
            : [];
        const eventLines = [`Timeline entries ${eventHistorySize}`]
            .concat(recentEvents.map(entry => this.summarizeEventEntry(entry)))
            .concat(battleEvents.map(entry => `Battle ${this.summarizeBattleEventEntry(entry)}`));

        const godModeMinWidth = Math.min(Math.max(220, Math.floor(canvasWidth * 0.22)), 300);
        const availableSideWidth = canvasWidth - panelX - panelWidth - 20;
        let canUseSideToolsDeck = availableSideWidth >= godModeMinWidth;
        let godModePanelWidth = canUseSideToolsDeck
            ? Math.min(Math.max(godModeMinWidth, availableSideWidth), 300)
            : panelWidth;

        const sections = {
            control: measureSection(controlLines, columnWidth),
            auditActions: measureSection(auditActionLines, columnWidth),
            replay: measureSection(replayLines.concat(eventLines).slice(0, 6), columnWidth, 12),
            world: measureSection(worldLines, columnWidth),
            performance: measureSection(performanceLines, columnWidth),
            audit: measureSection(auditLines, columnWidth, 12)
        };

        let leftY = panelY + headerHeight + innerPadding;
        let rightY = panelY + headerHeight + innerPadding;

        const leftHeights = [
            sections.control.height,
            sections.auditActions.height,
            sections.replay.height
        ];
        const rightHeights = [
            sections.world.height,
            sections.performance.height,
            sections.audit.height
        ];
        const contentHeight = Math.max(
            leftHeights.reduce((sum, value) => sum + value, 0) + (sectionGap * (leftHeights.length - 1)),
            rightHeights.reduce((sum, value) => sum + value, 0) + (sectionGap * (rightHeights.length - 1))
        );
        let panelHeight = headerHeight + innerPadding + contentHeight + innerPadding;

        const buttonGap = 8;
        const buttonInnerPadding = 10;
        const buttonTitleHeight = 24;
        const buttonHeight = 34;
        const buttonColumns = godModePanelWidth >= 250 ? 2 : 1;
        const buttonWidth = Math.floor((godModePanelWidth - (buttonInnerPadding * 2) - (buttonGap * (buttonColumns - 1))) / buttonColumns);
        const buttonRows = Math.ceil(this.godModeButtons.length / buttonColumns);
        const godModePanelHeight = buttonTitleHeight + buttonInnerPadding + (buttonRows * buttonHeight) + ((buttonRows - 1) * buttonGap) + buttonInnerPadding;

        if (canUseSideToolsDeck && (panelX + panelWidth + 10 + godModePanelWidth) > (canvasWidth - 10)) {
            canUseSideToolsDeck = false;
            godModePanelWidth = panelWidth;
        }

        if (!canUseSideToolsDeck) {
            panelHeight += 12 + godModePanelHeight;
        }

        const maxPanelHeight = canvasHeight - 20;
        if (panelHeight > maxPanelHeight) {
            panelHeight = maxPanelHeight;
        }

        graphics.fill(0, 0, 0, 196);
        graphics.stroke(230, 236, 246, 110);
        graphics.strokeWeight(1);
        graphics.rect(panelX, panelY, panelWidth, panelHeight, 8);

        graphics.noStroke();
        graphics.fill(255);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(14);
        graphics.text('DEBUG MODE', panelX + 12, panelY + 10);
        graphics.textSize(10);
        graphics.fill(220);
        graphics.text('D toggles debug overlay', panelX + 12, panelY + 28);

        drawSection('Mode / Buttons', leftColumnX, leftY, columnWidth, sections.control.wrapped);
        leftY += sections.control.height + sectionGap;
        drawSection('Audit Actions', leftColumnX, leftY, columnWidth, sections.auditActions.wrapped);
        leftY += sections.auditActions.height + sectionGap;
        drawSection('Replay / Timeline', leftColumnX, leftY, columnWidth, sections.replay.wrapped, 12);

        drawSection('World State', rightColumnX, rightY, columnWidth, sections.world.wrapped);
        rightY += sections.world.height + sectionGap;
        drawSection('Performance', rightColumnX, rightY, columnWidth, sections.performance.wrapped);
        rightY += sections.performance.height + sectionGap;
        drawSection('Audit Status', rightColumnX, rightY, columnWidth, sections.audit.wrapped, 12);

        const godModeX = canUseSideToolsDeck ? panelX + panelWidth + 10 : panelX;
        const godModeY = canUseSideToolsDeck ? panelY : panelY + panelHeight - godModePanelHeight;
        const godModeWidth = godModePanelWidth;

        this.godModeButtonRects = [];

        graphics.fill(0, 0, 0, 188);
        graphics.stroke(230, 236, 246, 90);
        graphics.strokeWeight(1);
        graphics.rect(godModeX, godModeY, godModeWidth, godModePanelHeight, 8);

        graphics.fill(255);
        graphics.noStroke();
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(11);
        graphics.text('GOD MODE', godModeX + buttonInnerPadding, godModeY + 8);

        for (let index = 0; index < this.godModeButtons.length; index++) {
            const button = this.godModeButtons[index];
            const column = index % buttonColumns;
            const row = Math.floor(index / buttonColumns);
            const buttonX = godModeX + buttonInnerPadding + (column * (buttonWidth + buttonGap));
            const buttonY = godModeY + buttonTitleHeight + buttonInnerPadding + (row * (buttonHeight + buttonGap));

            graphics.fill(60, 60, 60);
            graphics.stroke(120);
            graphics.strokeWeight(1);
            graphics.rect(buttonX, buttonY, buttonWidth, buttonHeight, 4);

            graphics.fill(255);
            graphics.noStroke();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(10);
            drawWrappedButtonLabel(button.text, buttonX + (buttonWidth / 2), buttonY + (buttonHeight / 2), buttonWidth);

            this.godModeButtonRects.push({
                id: button.id,
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            });
        }

        this.lastDebugPanelBounds = {
            x: panelX,
            y: panelY,
            width: panelWidth,
            height: panelHeight,
            godModeX,
            godModeY,
            godModeWidth,
            godModeHeight: godModePanelHeight
        };

        graphics.textSize(12);
    }

    drawDebugDockUI(graphics) {
        const replay = this.syncReplayAuditState();
        const latestReport = this.getLatestAuditReport();
        const latestReplayMarker = Array.isArray(replay?.markers) && replay.markers.length > 0
            ? replay.markers[replay.markers.length - 1]
            : null;
        const gridLabel = gridManager?.tileWidth && gridManager?.tileHeight
            ? `${gridManager.tileWidth}x${gridManager.tileHeight}px iso`
            : 'grid unavailable';
        const canvasWidth = graphics?.width || gameConfig.canvas.targetWidth;
        const canvasHeight = graphics?.height || gameConfig.canvas.targetHeight;
        const state = (typeof gameCore !== 'undefined' && gameCore.isInitialized())
            ? gameCore.getGameState()
            : null;
        const telemetry = state ? (gameCore.getTelemetrySnapshot?.() || null) : null;
        const eventHistorySize = typeof eventBus !== 'undefined' ? eventBus.getHistory?.().length || 0 : 0;
        const auditLabel = this.auditState.lastRunAt
            ? new Date(this.auditState.lastRunAt).toLocaleTimeString()
            : 'not run';

        const dockMargin = 8;
        const dockHeight = Math.min(Math.max(210, Math.floor(canvasHeight * 0.48)), 228);
        const dockX = dockMargin;
        const dockY = Math.max(dockMargin, canvasHeight - dockHeight - dockMargin);
        const dockWidth = canvasWidth - (dockMargin * 2);
        const headerHeight = 28;
        const innerPadding = 10;
        const sectionGap = 8;
        const panelGap = 10;
        const paneY = dockY + headerHeight + 4;
        const paneHeight = dockHeight - headerHeight - 4;
        const leftPaneWidth = Math.min(Math.max(300, Math.floor(dockWidth * 0.40)), 336);
        const rightPaneWidth = dockWidth - leftPaneWidth - panelGap;
        const leftPaneX = dockX;
        const rightPaneX = leftPaneX + leftPaneWidth + panelGap;
        const cardWidth = Math.floor((leftPaneWidth - innerPadding - sectionGap) / 2);

        const measureSection = (lines, width, lineHeight = 11) => {
            const maxChars = Math.max(18, Math.floor((width - 16) / 6.4));
            const wrapped = lines.flatMap(line => this.wrapDebugText(line, maxChars));
            const height = 24 + (wrapped.length * lineHeight) + 8;
            return { wrapped, height };
        };

        const drawSection = (title, x, y, width, wrappedLines, lineHeight = 11) => {
            const height = 24 + (wrappedLines.length * lineHeight) + 8;
            graphics.fill(0, 0, 0, 186);
            graphics.stroke(230, 236, 246, 90);
            graphics.strokeWeight(1);
            graphics.rect(x, y, width, height, 7);
            graphics.noStroke();
            graphics.fill(255, 245, 220, 255);
            graphics.textAlign(LEFT, TOP);
            graphics.textSize(10);
            graphics.text(title, x + 8, y + 7);
            graphics.fill(240, 244, 250, 255);
            graphics.textSize(9);
            let lineY = y + 18;
            for (const line of wrappedLines) {
                graphics.text(line, x + 8, lineY);
                lineY += lineHeight;
            }
            return height;
        };

        const drawWrappedButtonLabel = (text, centerX, centerY, width) => {
            const maxChars = Math.max(10, Math.floor((width - 14) / 7));
            const wrapped = this.wrapDebugText(text, maxChars).slice(0, 2);
            if (wrapped.length === 1) {
                graphics.text(wrapped[0], centerX, centerY + 1);
                return;
            }
            const baseY = centerY - 5;
            graphics.text(wrapped[0], centerX, baseY);
            graphics.text(wrapped[1], centerX, baseY + 10);
        };

        const actionIdIsBusy = (actionId, resetting) => resetting && actionId !== 'loadGameState';
        /* Legacy info pane removed in favor of button-only dock.

        const controlLines = [
            `Cursor ${this.cursorX},${this.cursorY} · Tool ${this.selectedTool}`,
            `Bounds 0,0 to ${gridManager.bounds.maxX},${gridManager.bounds.maxY}`,
            `Arrows move · Q/E switch · ${this.selectedTool === 'walkable' || this.selectedTool === 'blocked' ? 'Space toggle tile' : 'Space place entity'}`,
            `Grid ${this.showGridOverlay ? 'on' : 'auto'} · Paths ${this.showPathOverlay ? 'on' : 'off'} · Sex ${this.showSexLabels ? 'on' : 'off'}`,
            `Grid ${gridLabel}`,
            'X exports data',
            'Audit K/L/V/N/P/O/U/Y/J'
        ];

        const worldLines = [
            `Adults ${state?.butterflies?.length || 0} · Flowers ${state?.flowers?.length || 0}`,
            `Cats ${(state?.caterpillars || []).length} · Hybrids ${(state?.hybridJournal || []).length}`,
            `Zone ${state?.focusedZoneId || 'none'} · View ${state?.viewMode || 'focused-garden'}`,
            `Reset ${gameCore?.isResettingGame ? 'running' : 'idle'}`
        ];

        const auditActionLines = [
            'K save · L load · V verify',
            'N snapshot diff · P preset',
            'O export · U import',
            'Y gameplay audit · J reseed'
        ];

        const auditLines = [
            `Action ${this.truncateDebugText(this.auditState.lastAction, 18)}`,
            `Status ${this.auditState.lastStatus} · Mismatch ${this.auditState.lastMismatchCount}`,
            `Preset ${this.auditState.scenarioLabel} · Audit ${this.auditState.gameplayAuditStatus}`,
            `Snapshot ${this.auditState.snapshotLabel}`,
            `Diff ${this.truncateDebugText(this.auditState.comparedSnapshots, 18)}`,
            this.auditState.lastError ? `Detail ${this.truncateDebugText(this.auditState.lastError, 18)}` : `Detail ${auditLabel}`,
            `Latest ${this.truncateDebugText(this.summarizeAuditReport(latestReport), 18)}`
        ];

        worldLines.push(`Session ${replay?.sessionId || 'none'} · Events ${eventHistorySize}`);

        if (telemetry) {
            auditLines.push(
                `Perf ${telemetry.averages.updateMs.toFixed(2)} / ${telemetry.averages.renderMs.toFixed(2)} / ${telemetry.averages.particleRenderMs.toFixed(2)}ms`,
                `Particles ${telemetry.lastRenderSample?.particleCount || 0} · Reports ${this.auditState.savedAuditReports}`
            );
        } else {
            auditLines.push(
                `Reports ${this.auditState.savedAuditReports}`,
                'Perf sample pending'
            );
        }
        auditLines.push(`Marker ${this.summarizeReplayMarker(latestReplayMarker)}`);

        const leftInfoLines = controlLines;
        const rightInfoLines = worldLines.concat(auditLines);
        const sections = {
            leftInfo: measureSection(leftInfoLines, cardWidth),
            rightInfo: measureSection(rightInfoLines, cardWidth)
        };

        const rowOneHeight = Math.max(sections.leftInfo.height, sections.rightInfo.height);
        const buttonGap = 6;
        const buttonInnerPadding = 8;
        const buttonTitleHeight = 18;
        const buttonHeight = 24;
        const buttonColumns = rightPaneWidth >= 400 ? 4 : 3;
        const buttonWidth = Math.floor((rightPaneWidth - (buttonInnerPadding * 2) - (buttonGap * (buttonColumns - 1))) / buttonColumns);

        graphics.fill(0, 0, 0, 202);
        graphics.stroke(230, 236, 246, 100);
        graphics.strokeWeight(1);
        graphics.rect(dockX, dockY, dockWidth, dockHeight, 9);

        graphics.noStroke();
        graphics.fill(255);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(13);
        graphics.text('GOD MODE', dockX + 12, dockY + 8);
        graphics.textSize(9);
        graphics.fill(225);
        graphics.text(
            gameCore?.isResettingGame
                ? 'Reset in progress · simulation paused'
                : 'Compact lower-area layout · heavy scene overlays disabled by default',
            dockX + 108,
            dockY + 11
        );

        const rowOneY = paneY + innerPadding;
        drawSection('Controls / Audit Actions', leftPaneX + innerPadding, rowOneY, cardWidth, sections.leftInfo.wrapped);
        drawSection('World / Audit Status', leftPaneX + innerPadding + cardWidth + sectionGap, rowOneY, cardWidth, sections.rightInfo.wrapped);

        this.godModeButtonRects = [];
        graphics.fill(0, 0, 0, 188);
        graphics.stroke(230, 236, 246, 90);
        graphics.strokeWeight(1);
        graphics.rect(paneX, paneY, paneWidth, paneHeight, 8);

        graphics.fill(255);
        graphics.noStroke();
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(11);
        graphics.text('GOD MODE', rightPaneX + buttonInnerPadding, paneY + 8);

        for (let index = 0; index < this.godModeButtons.length; index++) {
            const button = this.godModeButtons[index];
            const column = index % buttonColumns;
            const row = Math.floor(index / buttonColumns);
            const buttonX = rightPaneX + buttonInnerPadding + (column * (buttonWidth + buttonGap));
            const buttonY = paneY + buttonTitleHeight + buttonInnerPadding + (row * (buttonHeight + buttonGap));

            graphics.fill(actionIdIsBusy(button.id, gameCore?.isResettingGame) ? color(82, 82, 82) : color(60, 60, 60));
            graphics.stroke(120);
            graphics.strokeWeight(1);
            graphics.rect(buttonX, buttonY, buttonWidth, buttonHeight, 4);

            graphics.fill(255);
            graphics.noStroke();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(9);
            drawWrappedButtonLabel(button.text, buttonX + (buttonWidth / 2), buttonY + (buttonHeight / 2), buttonWidth);

            this.godModeButtonRects.push({
                id: button.id,
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            });
        }

        this.lastDebugPanelBounds = {
            x: dockX,
            y: dockY,
            width: dockWidth,
            height: dockHeight,
            controlsPaneX: paneX,
            controlsPaneY: paneY,
            controlsPaneWidth: paneWidth,
            controlsPaneHeight: paneHeight
        };

        graphics.textSize(12);
    }

    drawDebugDockUICompact(graphics) {
        const canvasWidth = graphics?.width || gameConfig.canvas.targetWidth;
        const canvasHeight = graphics?.height || gameConfig.canvas.targetHeight;
        const reserveTop = Math.max(
            300,
            Math.min(canvasHeight - 88, gameConfig?.world?.mapGeometry?.uiReserveTop || (canvasHeight - 108))
        );

        const dockMargin = 8;
        const dockHeight = Math.max(124, canvasHeight - reserveTop - dockMargin);
        const dockWidth = Math.min(448, canvasWidth - (dockMargin * 2));
        const dockX = canvasWidth - dockWidth - dockMargin;
        const dockY = Math.max(reserveTop, canvasHeight - dockHeight - dockMargin);
        const headerHeight = 18;
        const innerPadding = 5;
        const paneY = dockY + headerHeight + 2;
        const paneHeight = dockHeight - headerHeight - 2;
        const paneX = dockX + innerPadding;
        const paneWidth = dockWidth - (innerPadding * 2);
        const replay = null;
        const leftPaneX = paneX;
        const leftPaneWidth = 0;
        const rightPaneX = paneX;
        const rightPaneWidth = paneWidth;
        const cardWidth = paneWidth;

        const drawWrappedButtonLabel = (text, centerX, centerY, width) => {
            const maxChars = Math.max(10, Math.floor((width - 14) / 7));
            const wrapped = this.wrapDebugText(text, maxChars).slice(0, 2);
            if (wrapped.length === 1) {
                graphics.text(wrapped[0], centerX, centerY + 1);
                return;
            }
            const baseY = centerY - 5;
            graphics.text(wrapped[0], centerX, baseY);
            graphics.text(wrapped[1], centerX, baseY + 10);
        };

        const actionIdIsBusy = (actionId, resetting) => resetting && actionId !== 'loadGameState';

        /* Legacy info pane removed in favor of button-only dock.
        const leftLines = wrapLines([
            `Cursor ${this.cursorX},${this.cursorY} · Tool ${this.selectedTool}`,
            `${this.selectedTool === 'walkable' || this.selectedTool === 'blocked' ? 'Space toggles tile state' : 'Space places entity'}`,
            `Grid ${this.showGridOverlay ? 'on' : 'auto'} · Paths ${this.showPathOverlay ? 'on' : 'off'}`,
            `Sex labels ${this.showSexLabels ? 'on' : 'off'} · X export`,
            'Audit K/L/V/N/P/O/U/Y/J'
        ], cardWidth);

        const rightLines = wrapLines([
            `Adults ${state?.butterflies?.length || 0} · Flowers ${state?.flowers?.length || 0}`,
            `Cats ${(state?.caterpillars || []).length} · Hybrids ${(state?.hybridJournal || []).length}`,
            `Zone ${state?.focusedZoneId || 'none'} · View ${state?.viewMode || 'focused-garden'}`,
            `Reset ${gameCore?.isResettingGame ? 'running' : 'idle'} · Events ${eventHistorySize}`,
            `Action ${this.truncateDebugText(this.auditState.lastAction, 16)} · ${this.auditState.lastStatus}`,
            `Preset ${this.auditState.scenarioLabel} · Audit ${this.auditState.gameplayAuditStatus}`,
            `Snapshot ${this.auditState.snapshotLabel} · Diff ${this.truncateDebugText(this.auditState.comparedSnapshots, 12)}`,
            this.auditState.lastError ? `Detail ${this.truncateDebugText(this.auditState.lastError, 18)}` : `Detail ${auditLabel}`,
            telemetry
                ? `Perf U${telemetry.averages.updateMs.toFixed(1)} R${telemetry.averages.renderMs.toFixed(1)} P${telemetry.averages.particleRenderMs.toFixed(1)}`
                : 'Perf sample pending'
        ], cardWidth);

        */
        const buttonGap = 4;
        const buttonInnerPadding = 4;
        const buttonTitleHeight = 10;
        const buttonHeight = 15;
        const buttonColumns = paneWidth >= 360 ? 4 : 3;
        const buttonWidth = Math.floor((paneWidth - (buttonInnerPadding * 2) - (buttonGap * (buttonColumns - 1))) / buttonColumns);
        const buttonRows = Math.ceil(this.godModeButtons.length / Math.max(1, buttonColumns));
        const buttonsBottomY = paneY + buttonTitleHeight + buttonInnerPadding + ((buttonRows - 1) * (buttonHeight + buttonGap)) + buttonHeight;
        const footerY = buttonsBottomY + 6;
        const footerHeight = Math.max(44, (paneY + paneHeight) - footerY - 6);
        const statusPalette = this.getAuditStatusPalette(this.auditState.lastStatus);
        const statusLabel = (this.auditState.lastStatus || 'idle').toUpperCase();
        const detailLine = this.truncateDebugText(
            this.auditState.lastDetail || this.auditState.lastError || `Last update ${auditLabel}`,
            72
        );
        const replayLine = `Session ${this.truncateDebugText(this.auditState.replaySessionLabel || 'none', 14)} | Seed ${this.truncateDebugText(this.auditState.replaySeedLabel || 'n/a', 12)}`;
        const mismatchLine = `Mismatch ${this.auditState.lastMismatchCount} | Invariants ${this.auditState.invariantFailures} | Reports ${this.auditState.savedAuditReports}`;
        const mlLine = this.getMlAuditLine();

        graphics.fill(0, 0, 0, 202);
        graphics.stroke(230, 236, 246, 100);
        graphics.strokeWeight(1);
        graphics.rect(dockX, dockY, dockWidth, dockHeight, 9);

        graphics.noStroke();
        graphics.fill(255);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(10);
        graphics.text('GOD MODE', dockX + 12, dockY + 8);
        /* graphics.textSize(8);
        graphics.fill(225);
        graphics.text(
            gameCore?.isResettingGame
                ? 'Reset in progress · simulation paused'
                : `Compact lower-area layout · session ${this.truncateDebugText(replay?.sessionId || 'none', 12)}`,
            dockX + 90,
            dockY + 9
        );

        const cardY = paneY + innerPadding;
        const leftCardX = leftPaneX + innerPadding;
        drawCard('Controls / Audit', leftCardX, cardY, cardWidth, leftLines, 8, paneHeight - (innerPadding * 2)); */

        this.godModeButtonRects = [];
        graphics.fill(0, 0, 0, 188);
        graphics.stroke(230, 236, 246, 90);
        graphics.strokeWeight(1);
        graphics.rect(rightPaneX, paneY, rightPaneWidth, paneHeight, 8);

        graphics.fill(255);
        graphics.noStroke();
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(8);
        graphics.text(
            gameCore?.isResettingGame ? 'Resetting...' : 'Clickable debug actions',
            paneX + buttonInnerPadding,
            paneY + 6
        );

        for (let index = 0; index < this.godModeButtons.length; index++) {
            const button = this.godModeButtons[index];
            const column = index % buttonColumns;
            const row = Math.floor(index / buttonColumns);
            const buttonX = paneX + buttonInnerPadding + (column * (buttonWidth + buttonGap));
            const buttonY = paneY + buttonTitleHeight + buttonInnerPadding + (row * (buttonHeight + buttonGap));

            graphics.fill(actionIdIsBusy(button.id, gameCore?.isResettingGame) ? color(82, 82, 82) : color(60, 60, 60));
            graphics.stroke(120);
            graphics.strokeWeight(1);
            graphics.rect(buttonX, buttonY, buttonWidth, buttonHeight, 4);

            graphics.fill(255);
            graphics.noStroke();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(7);
            drawWrappedButtonLabel(button.text, buttonX + (buttonWidth / 2), buttonY + (buttonHeight / 2), buttonWidth);

            this.godModeButtonRects.push({
                id: button.id,
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            });
        }

        graphics.fill(...statusPalette.fill);
        graphics.stroke(...statusPalette.stroke);
        graphics.strokeWeight(1);
        graphics.rect(paneX + 4, footerY, paneWidth - 8, footerHeight, 6);
        graphics.noStroke();
        graphics.fill(...statusPalette.text);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(7);
        graphics.text(
            `${statusLabel} · ${this.truncateDebugText(this.auditState.lastAction || 'None', 26)}`,
            paneX + 10,
            footerY + 6
        );
        graphics.text(detailLine, paneX + 10, footerY + 16);
        graphics.text(mlLine, paneX + 10, footerY + 36);
        graphics.text(`${replayLine} · ${mismatchLine}`, paneX + 10, footerY + 26);

        this.lastDebugPanelBounds = {
            x: dockX,
            y: dockY,
            width: dockWidth,
            height: dockHeight,
            controlsPaneX: rightPaneX,
            controlsPaneY: paneY,
            controlsPaneWidth: rightPaneWidth,
            controlsPaneHeight: paneHeight
        };

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
    
    drawGodModeButtons(graphics) {
        // Drawn inside drawDebugUI so it can participate in the responsive layout.
    }

    drawSexLabels(graphics) {
        if (!this.enabled || !this.showSexLabels) return;
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized()) return;

        const gameState = gameCore.getGameState();
        const focusedZoneId = gameCore.getFocusedZoneId?.() || gameState?.focusedZoneId || null;
        const region = focusedZoneId
            ? gameCore.getZoneConfig?.(focusedZoneId)?.renderProfile?.screenRegion || null
            : null;
        const butterflies = (gameState?.butterflies || []).filter(butterfly => {
            if (!butterfly?.id || butterfly.isSpawning || butterfly.zoneTravel?.active) return false;
            if (focusedZoneId && (butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId) !== focusedZoneId) return false;
            if (!region) return true;
            const labelX = butterfly.x || 0;
            const labelY = (butterfly.y || 0) - 21;
            return labelX >= (region.minX - 16) &&
                labelX <= (region.maxX + 16) &&
                labelY >= (region.minY - 32) &&
                labelY <= (region.maxY + 16);
        });
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
