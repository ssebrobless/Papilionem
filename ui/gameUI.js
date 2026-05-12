// Main game UI system - handles all non-debug UI elements
// Integrates with interactionSystem, renderManager, and debugUI
const PAPILIONEM_ACCESSIBILITY_KEY = 'papilionem-accessibility-v1';
const PAPILIONEM_ONBOARDING_KEY = 'papilionem-onboarding-v1';

class GameUI {
    constructor() {
        this.initialized = false;
        
        // UI state tracking
        this.showBoundaryZones = false;
        
        // Configuration references 
        this.stillFramesRequired = 60; // Will be updated from config
        
        // References to other systems
        this.interactionSystem = null;
        this.flowerManager = null;
        
        // Visual elements configuration  
        // (cursor hint removed - redundant with interaction system feedback)
        
        this.infoPanel = {
            x: 10,
            y: 20,
            lineHeight: 15,
            textColor: 150
        };

        this.inspectPanel = {
            visible: false,
            x: 508,
            y: 108,
            width: 208,
            height: 258,
            lineHeight: 9,
            lockedTargetId: null,
            scrollOffset: 0,
            selectionRects: [],
            mateOptionRects: [],
            releaseOptionRects: []
        };

        this.inspectControl = {
            guidedTargetId: null,
            mateSourceId: null,
            browseScope: 'zone',
            lockedBrowseScope: 'zone',
            releaseMode: false,
            releaseSelectionIds: new Set()
        };

        this.accessibilityPanel = {
            visible: false,
            x: 532,
            y: 188,
            width: 256,
            lineHeight: 14
        };

        this.battleSetupPanel = {
            visible: false,
            x: 600,
            y: 108,
            width: 188,
            height: 214,
            currentIndex: 0,
            leftIds: [],
            rightIds: [],
            navigationRects: [],
            actionRects: []
        };

        this.activityLogPanel = {
            visible: false,
            x: 508,
            y: 108,
            width: 286,
            height: 220,
            lineHeight: 12,
            maxEntries: 80,
            scrollOffset: 0,
            lastContextKey: 'all',
            followLatest: true,
            frozenEntries: null,
            filters: {
                talk: true,
                action: true,
                learn: true,
                warning: true,
                system: true
            }
        };
        this.activityLogCache = {
            key: null,
            entries: []
        };
        this.lastFeedPresentation = null;
        this.lastInspectPresentation = null;
        this.textLayoutCache = new Map();
        this.inspectMeasurementCache = new Map();
        this.feedMeasurementCache = new Map();
        this.creatureCloseupBakeEvictTimer = null;

        this.playerButtonTemplates = [
            { id: 'saveGame', label: 'Save', x: 466, y: 14, width: 76, height: 26 },
            { id: 'toggleJournal', label: 'Journal', x: 548, y: 14, width: 76, height: 26 },
            { id: 'toggleActivityLog', label: 'Feed', x: 630, y: 14, width: 68, height: 26 },
            { id: 'toggleInspect', label: 'Inspect', x: 704, y: 14, width: 84, height: 26 },
            { id: 'toggleAccessibility', label: 'Access', x: 466, y: 46, width: 76, height: 24 },
            { id: 'toggleBattleMode', label: 'Battle', x: 548, y: 46, width: 92, height: 24 },
            { id: 'cycleZone', label: 'Next Zone', x: 646, y: 46, width: 142, height: 24 }
        ];
        this.playerButtons = [];

        this.saveStatus = {
            state: 'idle',
            label: 'Not saved yet',
            atMs: null
        };
        this.firstSessionGuide = {
            visible: true,
            startedAtMs: null,
            dismissRect: null,
            autoHideMs: 22000
        };
        this.zoneSwitchCooldownUntilMs = 0;
        this.zoneSwitchCooldownMs = 220;
        this.debugPanelSnapshot = null;
        this.domActionUnsubscribe = null;
        this.layoutSyncState = {
            frame: -1,
            key: null
        };
        this.battleUi = {
            selectedParticipantId: null,
            participantRects: [],
            controlRects: [],
            teamSummaries: {},
            eventItems: [],
            focusSummary: null,
            statusSummary: null,
            renderSummary: null
        };

        this.accessibilitySettings = {
            reducedMotion: false,
            battleMotionSimplify: false,
            highContrastUI: false,
            colorblindSafeIndicators: true,
            colorblindMode: 'off',
            strongSelectionOutlines: true,
            trailVisibility: 'off',
            backgroundAtmosphere: 'full',
            statusIndicatorDensity: 'simplified',
            uiScale: 1
        };
        
        this.boundaryZones = [
            { dist: 0, color: [100, 255, 100, 50], label: "Safe" },
            { dist: 50, color: [255, 255, 100, 40], label: "Soft" },
            { dist: 100, color: [255, 150, 100, 30], label: "Hard" },
            { dist: 150, color: [255, 100, 100, 20], label: "Max" }
        ];
        
        // Butterfly collection UI
        this.butterflyCollection = null;
    }
    
    // Initialize the UI system with references to other systems
    initialize(flowerManager, config) {
        this.flowerManager = flowerManager;
        this.stillFramesRequired = config?.stillFramesRequired || 60;
        this.accessibilitySettings = {
            ...this.accessibilitySettings,
            ...(gameConfig?.accessibility || {})
        };
        this.accessibilitySettings = {
            ...this.accessibilitySettings,
            ...this.loadPersistedAccessibilitySettings()
        };
        this.accessibilitySettings = {
            ...this.accessibilitySettings,
            ...this.loadRuntimeAccessibilityOverrides()
        };
        this.firstSessionGuide.visible = !this.loadPersistedOnboardingDismissed();
        
        // Initialize butterfly collection UI
        this.butterflyCollection = new ButterflyCollectionUI();
        if (typeof shellDomOverlay !== 'undefined') {
            shellDomOverlay.initialize?.();
        }
        if (this.domActionUnsubscribe) {
            this.domActionUnsubscribe();
            this.domActionUnsubscribe = null;
        }
        if (typeof eventBus !== 'undefined' && typeof eventBus.on === 'function') {
            this.domActionUnsubscribe = eventBus.on('ui:domAction', this.handleDomAction, this);
        }
        
        this.initialized = true;
    }
    
    // Main draw method for game UI (non-debug mode)
    draw(graphics, gameState, debugMode) {
        if (!this.initialized) return;
        this.syncPanelLayouts(gameState);
        this.updateInspectGuidance(gameState);
        
        graphics.push();
        
        // Cursor hints handled by interaction system - no duplicate rendering needed
        
        this.updateFirstSessionGuide(gameState, debugMode);
        this.drawPlayerButtons(graphics, gameState);
        this.drawFirstSessionGuide(graphics, gameState, debugMode);
        this.drawMateHoverHighlight(graphics, gameState);
        
        // Draw boundary zones if requested
        if (this.showBoundaryZones && !debugMode.enabled) {
            this.drawBoundaryZones(graphics);
        }
        
        // The collection/journal shell is hidden during battle. Keep its
        // visibility state intact so it can resume after battle, but do not
        // spend canvas work on a hidden panel while the battle HUD owns the
        // player-facing shell.
        if (this.butterflyCollection && gameState.viewMode !== 'battle') {
            this.butterflyCollection.update();
            if (!(this.isShellUiDomEnabled() && this.butterflyCollection.visible)) {
                this.butterflyCollection.draw(graphics);
            }
        }

        if (this.inspectPanel.visible && gameState.viewMode !== 'battle' && !this.isShellUiDomEnabled()) {
            this.drawInspectPanel(graphics, gameState);
        }

        if (this.activityLogPanel.visible && gameState.viewMode !== 'battle' && !this.isShellUiDomEnabled()) {
            this.drawActivityLogPanel(graphics, gameState);
        }

        if (this.battleSetupPanel.visible && gameState.viewMode !== 'battle') {
            this.drawBattleSetupPanel(graphics, gameState);
        }

        if (this.accessibilityPanel.visible && gameState.viewMode !== 'battle' && !this.isShellUiDomEnabled()) {
            this.drawAccessibilityPanel(graphics, gameState);
        }

        if (gameState.viewMode === 'battle') {
            this.drawBattleHud(graphics, gameState);
        }
        
        graphics.pop();
    }

    setDebugPanelSuppression(enabled) {
        this.debugPanelSnapshot = enabled
            ? {
                inspectVisible: this.inspectPanel.visible,
                activityLogVisible: this.activityLogPanel.visible,
                accessibilityVisible: this.accessibilityPanel.visible
            }
            : null;
    }

    drawPlayerButtons(graphics, gameState) {
        if (gameState?.viewMode === 'battle') {
            return;
        }
        const accessibility = this.accessibilitySettings;
        const uiScale = this.getEffectiveUiScale();
        const buttonFill = accessibility.highContrastUI ? [0, 0, 0, 244] : [18, 22, 28, 196];
        const activeFill = accessibility.highContrastUI ? [255, 255, 255, 248] : [90, 116, 164, 148];
        const disabledFill = accessibility.highContrastUI ? [22, 22, 22, 236] : [40, 44, 52, 138];
        const strokeColor = accessibility.highContrastUI ? [255, 255, 255, 255] : [226, 234, 246, 92];
        const textColor = accessibility.highContrastUI ? [255, 255, 255, 255] : [244, 246, 250, 255];
        const hintColor = accessibility.highContrastUI ? [255, 255, 255, 255] : [190, 198, 210, 255];
        const activeTextColor = accessibility.highContrastUI ? [0, 0, 0, 255] : textColor;
        const disabledTextColor = accessibility.highContrastUI ? [180, 180, 180, 255] : hintColor;
        const buttonStates = this.buildPlayerButtonStates(gameState);

        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(Math.max(7, Math.round(9 * uiScale)));

        for (const button of buttonStates) {
            graphics.fill(...(button.disabled ? disabledFill : button.active ? activeFill : buttonFill));
            graphics.stroke(...strokeColor);
            graphics.strokeWeight(accessibility.highContrastUI ? 2 : 1);
            graphics.rect(button.x, button.y, button.width, button.height, 7);

            graphics.noStroke();
            graphics.fill(...(button.disabled ? disabledTextColor : button.active ? activeTextColor : textColor));
            graphics.text(button.label, button.x + button.width / 2, button.y + button.height / 2 + 0.5);
        }

        this.drawSaveStatus(graphics);
        graphics.pop();
    }

    buildPlayerButtonStates(gameState) {
        const state = gameState || gameCore?.getGameState?.() || gameCore?.gameState || {};
        const multipleZones = this.getZoneList().length > 1;
        return this.getVisiblePlayerButtons().map(button => {
            const disabled = button.id === 'cycleZone' && !multipleZones;
            const active =
                (button.id === 'saveGame' && this.saveStatus.state === 'saving') ||
                (button.id === 'toggleJournal' && !!this.butterflyCollection?.visible) ||
                (button.id === 'toggleActivityLog' && this.activityLogPanel.visible) ||
                (button.id === 'toggleInspect' && this.inspectPanel.visible) ||
                (button.id === 'toggleAccessibility' && this.accessibilityPanel.visible) ||
                (button.id === 'toggleBattleMode' && (this.battleSetupPanel.visible || state.viewMode === 'battle'));
            return {
                ...button,
                label: button.id === 'cycleZone' && !multipleZones ? 'One Zone' : button.label,
                active,
                disabled
            };
        });
    }

    getSaveStatusPills() {
        const accessibility = this.accessibilitySettings;
        const telemetry = gameCore?.getTelemetrySnapshot?.() || null;
        const capture = telemetry?.sessionCapture || null;
        const saveState = this.saveStatus.state;
        const saveLabel = this.saveStatus.label || 'Not saved yet';
        const pills = [{
            label: saveLabel,
            fillColor: saveState === 'error'
                ? [120, 30, 30, accessibility.highContrastUI ? 246 : 216]
                : saveState === 'saving'
                    ? [94, 82, 22, accessibility.highContrastUI ? 246 : 216]
                    : [22, 30, 38, accessibility.highContrastUI ? 246 : 196]
        }];

        if (capture?.active) {
            pills.push({
                label: 'Capture running',
                fillColor: [24, 78, 64, accessibility.highContrastUI ? 246 : 216]
            });
        } else if (capture?.output?.outputDir && capture?.stoppedAtMs && (Date.now() - capture.stoppedAtMs) <= 180000) {
            pills.push({
                label: 'Capture exported',
                fillColor: [32, 88, 48, accessibility.highContrastUI ? 246 : 216]
            });
        }

        return pills;
    }

    drawSaveStatus(graphics) {
        if (gameCore?.getGameState?.().viewMode === 'battle') {
            return;
        }
        const accessibility = this.accessibilitySettings;
        const uiScale = this.getEffectiveUiScale();
        const textColor = accessibility.highContrastUI ? [255, 255, 255, 255] : [236, 242, 250, 255];
        const pills = this.getSaveStatusPills();

        graphics.push();
        graphics.textAlign(RIGHT, TOP);
        graphics.textSize(Math.max(6, Math.round(8 * uiScale)));
        const topButtonBottom = this.playerButtons.length
            ? Math.max(...this.playerButtons.map(button => button.y + button.height))
            : 34;
        const pillHeight = Math.round(14 * uiScale);
        const gap = Math.max(3, Math.round(3 * uiScale));
        let y = topButtonBottom + 4;

        for (const pill of pills) {
            const width = Math.max(Math.round(94 * uiScale), this.measureTextWidth(graphics, pill.label) + Math.round(14 * uiScale));
            const x = gameConfig.canvas.baseWidth - width - 12;
            graphics.fill(...pill.fillColor);
            graphics.stroke(...(accessibility.highContrastUI ? [255, 255, 255, 255] : [220, 230, 246, 100]));
            graphics.strokeWeight(accessibility.highContrastUI ? 2 : 1);
            graphics.rect(x, y, width, pillHeight, 6);
            graphics.noStroke();
            graphics.fill(...textColor);
            graphics.text(pill.label, gameConfig.canvas.baseWidth - 18, y + 2);
            y += pillHeight + gap;
        }
        graphics.pop();
    }

    updateFirstSessionGuide(gameState, debugMode) {
        if (!this.firstSessionGuide.visible) {
            this.firstSessionGuide.dismissRect = null;
            return;
        }
        if (this.firstSessionGuide.startedAtMs == null) {
            this.firstSessionGuide.startedAtMs = Date.now();
        }
        if (this.isFirstSessionGuideComplete(gameState, debugMode)) {
            this.dismissFirstSessionGuide(true);
            return;
        }
        const elapsed = Date.now() - this.firstSessionGuide.startedAtMs;
        if (elapsed >= this.firstSessionGuide.autoHideMs) {
            this.dismissFirstSessionGuide(true);
        }
    }

    isFirstSessionGuideComplete(gameState, debugMode) {
        return !!(
            debugMode?.enabled ||
            gameState?.viewMode === 'battle' ||
            this.inspectPanel.visible ||
            this.activityLogPanel.visible ||
            this.accessibilityPanel.visible ||
            this.battleSetupPanel.visible ||
            this.butterflyCollection?.visible
        );
    }

    getShellPerformanceState(gameState = null) {
        const state = gameState || gameCore?.getGameState?.() || gameCore?.gameState || {};
        const domShellEnabled = this.isShellUiDomEnabled();
        const feedVisible = !!this.activityLogPanel.visible && state.viewMode !== 'battle';
        const inspectVisible = !!this.inspectPanel.visible && state.viewMode !== 'battle';
        const accessVisible = !!this.accessibilityPanel.visible && state.viewMode !== 'battle';
        const battleSetupVisible = !!this.battleSetupPanel.visible && state.viewMode !== 'battle';
        const journalVisible = !!this.butterflyCollection?.visible && state.viewMode !== 'battle';
        const battleHudVisible = state.viewMode === 'battle';
        const guideVisible = !!this.firstSessionGuide?.visible;
        const canvasFeedVisible = feedVisible && !domShellEnabled;
        const canvasInspectVisible = inspectVisible && !domShellEnabled;
        const canvasAccessVisible = accessVisible && !domShellEnabled;
        const canvasJournalVisible = journalVisible && !domShellEnabled;
        const debugEnabled = !!(
            (typeof debugUI !== 'undefined' && debugUI.enabled)
            || gameCore?.getDebugMode?.()?.enabled
        );
        const debugCanvasVisible = debugEnabled && !domShellEnabled;
        const canvasGuideVisible = guideVisible && !domShellEnabled;

        const openPanels = [];
        if (canvasFeedVisible) openPanels.push('feed');
        if (canvasInspectVisible) openPanels.push('inspect');
        if (canvasAccessVisible) openPanels.push('access');
        if (battleSetupVisible) openPanels.push('battle-setup');
        if (canvasJournalVisible) openPanels.push('journal');
        if (battleHudVisible) openPanels.push('battle-hud');
        if (canvasGuideVisible) openPanels.push('guide');
        if (debugCanvasVisible) openPanels.push('debug');

        return {
            viewMode: state.viewMode || 'focused-garden',
            focusedZoneId: state.focusedZoneId || null,
            openPanels,
            openPanelCount: openPanels.length,
            feedVisible,
            canvasFeedVisible,
            inspectVisible,
            canvasInspectVisible,
            accessVisible,
            canvasAccessVisible,
            battleSetupVisible,
            journalVisible,
            canvasJournalVisible,
            battleHudVisible,
            guideVisible,
            canvasGuideVisible,
            debugEnabled,
            debugCanvasVisible,
            domShellEnabled,
            feedEntryCount: feedVisible ? this.getRecentActivityEntries().length : 0,
            inspectTargetId: inspectVisible ? (this.getLockedInspectTarget(state)?.id || null) : null,
            journalSection: journalVisible ? (this.butterflyCollection?.mode || null) : null
        };
    }

    isShellUiDomEnabled() {
        return !!gameConfig?.performance?.flags?.shellUiDom;
    }

    getDomPanelRect(panel, heightOverride = null) {
        return {
            x: panel?.x || 0,
            y: panel?.y || 0,
            width: panel?.width || 0,
            height: heightOverride ?? panel?.height ?? 0
        };
    }

    getGuidePanelRect() {
        return {
            x: 10,
            y: 86,
            width: 214,
            height: 118
        };
    }

    getFirstSessionGuideLines() {
        return [
            '1. Watch butterflies, flowers, and the feed.',
            '2. Use Inspect, Feed, or Journal from the top-right.',
            '3. Access changes readability; D opens debug tools.',
            'This card closes once you use the shell.'
        ];
    }

    isFirstSessionGuideRenderable(gameState = null, debugMode = null) {
        const state = gameState || gameCore?.getGameState?.() || gameCore?.gameState || {};
        const debugEnabled = debugMode?.enabled ?? !!(
            (typeof debugUI !== 'undefined' && debugUI.enabled)
            || gameCore?.getDebugMode?.()?.enabled
        );
        return !!(
            this.firstSessionGuide.visible
            && !debugEnabled
            && state?.viewMode !== 'battle'
        );
    }

    buildFeedDomState(gameState) {
        this.syncPanelLayouts(gameState);
        const panel = this.activityLogPanel;
        this.normalizeActivityLogFilters();
        const selectedTarget = this.getLockedInspectTarget(gameState);
        const contextKey = `${selectedTarget?.id || 'all'}:${gameState?.focusedZoneId || 'garden'}`;
        const enabledFilters = Object.entries(panel.filters || {})
            .filter(([, enabled]) => enabled)
            .map(([key]) => key);
        const contextLabel = this.getFeedContextLabel(gameState, selectedTarget);
        const liveEntries = this.getRecentActivityEntries();
        const sourceEntries = panel.followLatest ? liveEntries : (panel.frozenEntries || liveEntries);
        const filteredEntries = sourceEntries.filter(entry => enabledFilters.includes(entry.category));
        const entries = filteredEntries.length > 0
            ? filteredEntries
            : [this.createFeedEntryShape({
                headline: enabledFilters.length ? 'No visible activity' : 'No filters enabled',
                detail: enabledFilters.length
                    ? 'Nothing in view matches the active feed filters.'
                    : 'Turn a feed filter back on to refill the feed.',
                line: enabledFilters.length ? 'No visible activity for current filters' : 'Select at least one feed filter',
                category: 'system'
            })];
        this.lastFeedPresentation = {
            contextLabel,
            entryCount: entries.length,
            entries: entries.slice(-16).map(entry => ({
                category: this.normalizeFeedCategory(entry.category || 'action'),
                headline: entry.headline || null,
                detail: entry.detail || entry.line || null,
                footer: this.buildFeedContextFooter(entry),
                grounding: entry.grounding || null,
                pairTextureLabel: entry.pairTextureLabel || null,
                referencedMemoryPacketId: entry.referencedMemoryPacketId || null,
                causeLabel: entry.causeLabel || null,
                phraseTemplateId: entry.phraseTemplateId || null,
                conversationId: entry.conversationId || null,
                threadCount: Array.isArray(entry.threadLines) ? entry.threadLines.length : 0,
                threadLines: Array.isArray(entry.threadLines) ? entry.threadLines.map(line => ({
                    speakerLabel: line?.speakerLabel || null,
                    phrase: line?.phrase || null,
                    heardMeaning: line?.heardMeaning || null
                })) : null,
                consequenceTail: entry.consequenceTail || null
            })),
            updatedAt: Date.now()
        };
        if (panel.lastContextKey !== contextKey) {
            this.resumeLatestFeedView();
            panel.lastContextKey = contextKey;
        }
        return {
            visible: !!panel.visible && gameState?.viewMode !== 'battle',
            rect: this.getDomPanelRect(panel),
            highContrast: !!this.accessibilitySettings.highContrastUI,
            contextLabel,
            followLatest: panel.followLatest !== false,
            filters: { ...(panel.filters || {}) },
            entries: this.lastFeedPresentation.entries
        };
    }

    buildAccessibilityDomState(gameState) {
        this.syncPanelLayouts(gameState);
        const controls = this.getAccessibilityControlButtons();
        const slider = this.getAccessibilitySliderRect();
        const panelHeight = (slider.y + slider.height + 14) - this.accessibilityPanel.y;
        return {
            visible: !!this.accessibilityPanel.visible && gameState?.viewMode !== 'battle',
            rect: this.getDomPanelRect(this.accessibilityPanel, panelHeight),
            highContrast: !!this.accessibilitySettings.highContrastUI,
            controls: controls.map(control => ({
                id: control.id,
                label: control.label,
                value: control.value
            })),
            uiScale: this.accessibilitySettings.uiScale || 1
        };
    }

    getInspectIsolationMarker(target, gameState) {
        if (!target?.lifeSim) return null;
        const edges = target.lifeSim.socialEdges || {};
        const memories = target.lifeSim.memories || {};
        const socialPackets = Array.isArray(memories.social) ? memories.social : [];
        const outcomePackets = Array.isArray(memories.outcome) ? memories.outcome : [];
        const placePackets = Array.isArray(memories.place) ? memories.place : [];
        const memoryPacketCount = socialPackets.length + outcomePackets.length + placePackets.length;
        const meaningfulEdgeCount = Object.values(edges).filter(edge => {
            if (!edge || typeof edge !== 'object') return false;
            const tier = `${edge.bondTier || edge.tier || ''}`.toLowerCase();
            if (['companion', 'bonded', 'family', 'mate'].includes(tier)) return true;
            const strongest = Math.max(
                edge.trust || 0,
                edge.comfort || 0,
                edge.attachment || 0,
                edge.admiration || 0,
                edge.protectiveness || 0,
                edge.familiarity || 0
            );
            return strongest >= 0.35 || (edge.coTimeSeconds || 0) >= 60;
        }).length;
        const currentFrame = gameCore?.getCurrentFrame?.() ?? gameState?.currentFrame ?? 0;
        const ageTicks = Number.isFinite(target.lifeSim.lifecycle?.ageTicks)
            ? target.lifeSim.lifecycle.ageTicks
            : 0;
        const spawnedAtFrame = Number.isFinite(target.spawnedAtFrame)
            ? target.spawnedAtFrame
            : (Number.isFinite(target.createdAtFrame) ? target.createdAtFrame : null);
        const frameAge = spawnedAtFrame !== null ? Math.max(0, currentFrame - spawnedAtFrame) : currentFrame;
        const ageFrames = Math.max(ageTicks || 0, frameAge || 0);
        if (meaningfulEdgeCount === 0 && memoryPacketCount < 3 && ageFrames >= 1800) {
            return 'alone in the garden so far';
        }
        return null;
    }

    getInspectMemoryPackets(target) {
        const memories = target?.lifeSim?.memories || {};
        return [
            ...(memories.social || []).map(packet => ({ ...packet, memoryFamily: 'social' })),
            ...(memories.outcome || []).map(packet => ({ ...packet, memoryFamily: 'outcome' })),
            ...(memories.place || []).map(packet => ({ ...packet, memoryFamily: 'place' }))
        ].filter(packet => packet?.id || packet?.kind || packet?.anchor);
    }

    getInspectMemoryPacketFrame(packet = {}) {
        const frame = packet.createdAtFrame ?? packet.lostAtFrame ?? packet.watchedAtFrame ?? packet.createdFrame;
        return Number.isFinite(frame) ? Math.max(0, Math.round(frame)) : null;
    }

    getInspectMemoryStrength(packet = {}) {
        const value = packet.intensity ?? packet.activeStrength ?? packet.strength ?? packet.score ?? 0;
        return Math.max(0, Math.min(1, Number(value) || 0));
    }

    getInspectEntityLabel(entityId, gameState = null) {
        if (!entityId) return null;
        const state = gameState || gameCore?.getGameState?.() || gameCore?.gameState || {};
        const entity = (state.butterflies || []).find(entry => entry.id === entityId);
        return this.normalizePresentationText(entity?.displayName || entity?.personalityType || entityId);
    }

    getMostRelevantInspectMemory(target, gameState = null) {
        const packets = this.getInspectMemoryPackets(target);
        if (!packets.length) return null;
        const currentFrame = gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0);
        return packets
            .map(packet => {
                const frame = this.getInspectMemoryPacketFrame(packet);
                const ageFrames = frame == null ? 600 : Math.max(0, currentFrame - frame);
                const recency = 1 / (1 + (ageFrames / 600));
                return {
                    packet,
                    ageFrames,
                    score: this.getInspectMemoryStrength(packet) * recency
                };
            })
            .sort((left, right) => right.score - left.score)[0] || null;
    }

    formatInspectMemoryReason(memoryRef, gameState = null) {
        const packet = memoryRef?.packet || null;
        if (!packet) return null;
        const causeLabel = this.getInspectMemoryCauseLabel(packet, gameState);
        const lead = causeLabel ? `[${causeLabel}] ` : '';
        const partnerLabel = this.getInspectEntityLabel(
            packet.partnerId || packet.bondPartnerId || packet.chosenPartnerId || packet.thirdPartyId,
            gameState
        );
        const rejectedLabel = this.getInspectEntityLabel(packet.rejectedPartnerId, gameState);
        if (packet.kind === 'bereavement') {
            return partnerLabel
                ? `${lead}Returning to traces of ${partnerLabel}; ${Math.round((packet.intensity || 0) * 100)} grief strength.`
                : `${lead}Carrying a bereavement packet; ${Math.round((packet.intensity || 0) * 100)} grief strength.`;
        }
        if (packet.kind === 'witnessedAffection') {
            return partnerLabel
                ? `${lead}Reacting to seeing ${partnerLabel} bond elsewhere; jealousy packet is still active.`
                : `${lead}Reacting to a witnessed affection packet that is still active.`;
        }
        if (packet.kind === 'loyaltyChoice') {
            return partnerLabel && rejectedLabel
                ? `${lead}Biasing toward ${partnerLabel} after choosing them over ${rejectedLabel}.`
                : `${lead}Biasing a choice from a recent loyalty packet.`;
        }
        if (packet.anchor === 'pride') {
            return `${lead}Acting with pride from ${this.normalizePresentationText(packet.reason || 'a successful outcome')}.`;
        }
        if (packet.anchor === 'shame') {
            return `${lead}Correcting course after ${this.normalizePresentationText(packet.reason || 'a costly outcome')}.`;
        }
        return partnerLabel
            ? `${lead}Recent memory of ${partnerLabel} is shaping this moment.`
            : `${lead}Recent ${packet.memoryFamily || 'memory'} packet is shaping this moment.`;
    }

    getInspectMemoryCauseLabel(packet = {}, gameState = null) {
        if (!packet || gameConfig?.expression?.causeLabel?.enabled === false) return null;
        if (typeof communicationSystem !== 'undefined' && communicationSystem.buildMemoryCauseLabel) {
            return communicationSystem.buildMemoryCauseLabel(packet, {
                partnerLabel: this.getInspectEntityLabel(
                    packet.partnerId || packet.bondPartnerId || packet.chosenPartnerId || packet.thirdPartyId,
                    gameState
                ),
                rejectedPartnerLabel: this.getInspectEntityLabel(packet.rejectedPartnerId, gameState)
            });
        }
        const label = packet.subtype === 'long-absence'
            ? 'grief: long absence'
            : packet.kind === 'bereavement'
                ? 'grief: loss'
                : packet.kind === 'witnessedAffection'
                    ? 'witnessed affection'
                    : packet.kind === 'loyaltyChoice'
                        ? 'loyalty: choice'
                        : packet.anchor === 'pride'
                            ? 'pride: outcome'
                            : packet.anchor === 'shame'
                                ? 'shame: repair'
                                : null;
        return label ? this.normalizePresentationText(label).slice(0, 24).trim() : null;
    }

    getInspectStrongestFeelingLabel(lifeSimSummary = null, memoryRef = null) {
        const packet = memoryRef?.packet || null;
        const packetId = packet?.id ? String(packet.id) : null;
        const packetKind = packet?.kind || packet?.anchor || null;
        const cognition = lifeSimSummary?.cognition || {};
        const strongest = cognition.strongestFeeling || null;
        let label = strongest?.label || strongest?.key || strongest?.id || null;
        let value = strongest?.value ?? strongest?.strength ?? strongest?.intensity ?? null;
        const feelings = cognition.feelings || lifeSimSummary?.feelings || {};
        if (!label && feelings && typeof feelings === 'object') {
            const ignored = new Set(['dominant', 'motiveBias', 'targetPartnerId', 'updatedAtFrame']);
            const ranked = Object.entries(feelings)
                .filter(([key, entry]) => !ignored.has(key) && entry && typeof entry === 'object')
                .map(([key, entry]) => ({
                    key,
                    value: Number(entry.value ?? entry.strength ?? entry.intensity ?? 0)
                }))
                .sort((left, right) => right.value - left.value);
            if (ranked[0]?.value > 0) {
                label = ranked[0].key;
                value = ranked[0].value;
            }
        }
        if (!label && packetKind) {
            label = packetKind === 'witnessedAffection'
                ? 'jealousy'
                : packetKind === 'loyaltyChoice'
                    ? 'loyalty'
                    : packetKind === 'bereavement'
                        ? 'grief'
                        : packetKind;
            value = packet?.intensity ?? packet?.strength ?? value;
        }
        if (!label) return null;
        const strengthText = Number.isFinite(value) ? ` ${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` : '';
        const packetText = packetId ? ` packet ${packetId}` : '';
        return `Feeling ${this.normalizePresentationText(label)}${strengthText}${packetText}`;
    }

    formatBehaviorReasonLabel(reason = '') {
        const text = String(reason ?? '').trim();
        if (!text || text === 'null' || text === 'undefined') return null;
        return text
            .replace(/[-_]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    formatActionSubtypeLabel(subtype = '') {
        const labels = {
            'partner-return': 'returning to a familiar partner',
            'protective-follow-through': 'checking on a vulnerable partner',
            'admiring-shadow': 'staying near someone they admire',
            'strained-avoidance': 'giving a strained partner space',
            'warning-cascade': 'following a local warning',
            'roosting': 'holding near a roost pocket',
            'teaching-pocket': 'staying near a teaching pocket',
            'courtship-territory': 'circling a courtship space',
            'shelter-seeking': 'seeking shelter'
        };
        return labels[subtype] || this.formatBehaviorReasonLabel(subtype);
    }

    buildCurrentActionCausalityLine(target, gameState = null, communicationSummary = null, lifeSimSummary = null) {
        if (gameConfig?.expression?.whyThisMoment?.enabled === false || !target?.id) return null;
        const runtime = typeof behaviorSystem !== 'undefined'
            ? behaviorSystem.getRuntime?.(target.id)
            : null;
        const subtype = runtime?.currentActionSubtype || null;
        const rawActionLabel = this.formatActionSubtypeLabel(subtype);
        const actionLabel = ['normal', 'wander', 'idle'].includes(String(subtype || '').toLowerCase())
            ? null
            : rawActionLabel;
        const targetLabel = runtime?.currentTargetId
            ? this.getEntityDisplayName(this.getButterflyById(runtime.currentTargetId), runtime.currentTargetId)
            : null;
        const residueLabel = communicationSummary?.recentResidueLabel
            && communicationSummary.recentResidueLabel !== 'No recent dialogue residue'
            ? communicationSummary.recentResidueLabel
            : null;
        const heardPhrase = communicationSummary?.recentHeardPhrase || null;
        const reasonLabel = this.formatBehaviorReasonLabel(runtime?.reason);

        let cause = null;
        if (['partner-return', 'protective-follow-through', 'admiring-shadow', 'strained-avoidance'].includes(subtype)) {
            cause = residueLabel
                ? `earlier talk left ${this.normalizePresentationText(residueLabel)}`
                : 'relationship carry-over';
        } else if (target?.ecologyRestTarget?.reason === 'shade-rest-help') {
            cause = 'shade rest need';
        } else if (target?.targetCleanupPile || target?.movement?.targetType === 'cleanup') {
            cause = 'dirty ground blocks planting';
        } else if (target?.pendingPollenDropTarget || Math.max(0, Math.round(Number(target?.pollenInventory?.charges || 0))) > 0) {
            cause = 'pollen can become future food';
        } else if (lifeSimSummary?.objects?.cleanupPressure > 0) {
            cause = 'local cleanup pressure';
        } else if (reasonLabel && reasonLabel !== 'derived from entity state') {
            cause = reasonLabel;
        }

        if (!cause && !actionLabel) return null;
        const targetText = targetLabel ? ` toward ${targetLabel}` : '';
        const actionText = actionLabel ? ` -> ${actionLabel}${targetText}` : '';
        const heardText = heardPhrase && cause?.includes('earlier talk')
            ? ` | heard "${this.formatFeedHeardMeaning(heardPhrase)}"`
            : '';
        return this.normalizePresentationText(`Acting because ${cause}${actionText}${heardText}`);
    }

    buildWhyThisMomentState(target, gameState = null, mlSummary = null, lifeSimSummary = null, communicationSummary = null) {
        if (gameConfig?.expression?.whyThisMoment?.enabled === false || !target?.id) return null;
        const decision = typeof mlInferenceSystem !== 'undefined'
            ? mlInferenceSystem.getDecisionExplanation?.(target.id, gameState)
            : null;
        const memoryRef = this.getMostRelevantInspectMemory(target, gameState);
        const memoryReason = this.formatInspectMemoryReason(memoryRef, gameState);
        const actionCause = this.buildCurrentActionCausalityLine(target, gameState, communicationSummary, lifeSimSummary);
        const drive = lifeSimSummary?.dominantDrives?.[0] || null;
        const emotion = lifeSimSummary?.dominantEmotions?.[0] || null;
        const feelingLine = this.getInspectStrongestFeelingLabel(lifeSimSummary, memoryRef);
        const mindLine = [
            drive || emotion ? `Mind ${[drive, emotion].filter(Boolean).join(' | ')}` : null,
            feelingLine
        ].filter(Boolean).join(' | ');
        const lines = [
            decision?.shortText || (mlSummary
                ? `${mlSummary.sourceLabel || 'Fallback'} chose ${mlSummary.actionLabel || 'none'} toward ${mlSummary.targetLabel || 'none'}`
                : 'No decision trace yet'),
            actionCause,
            memoryReason,
            mindLine || null,
            decision?.topAlternative ? `Alternative ${decision.topAlternative}` : null,
            decision?.highestFeatureLabel ? `Driver ${decision.highestFeatureLabel}` : null
        ].filter(Boolean).map(line => this.normalizePresentationText(line));
        return {
            title: 'Why This Moment',
            lines,
            memoryPacketId: memoryRef?.packet?.id || null,
            decision
        };
    }

    buildInspectDetailDomState(target, gameState) {
        const zoneId = target.currentZoneId || target.lifeSim?.lifecycle?.currentZoneId || null;
        const sleepState = typeof sleepSystem !== 'undefined'
            ? sleepSystem.getSleepState?.(target.id)
            : null;
        const rosterSummary = typeof rosterSystem !== 'undefined'
            ? rosterSystem.getEntitySummary?.(target.id, gameState)
            : null;
        const communicationSummary = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getCommunicationSummary?.(target.id)
            : null;
        const lifeSimSummary = typeof lifeSimSystem !== 'undefined'
            ? lifeSimSystem.getEntitySummary?.(target.id)
            : null;
        const statProfile = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getEntityProfile?.(target, gameState)
            : null;
        const mlSummary = typeof mlInferenceSystem !== 'undefined'
            ? mlInferenceSystem.getEntitySummary?.(target.id, gameState)
            : null;
        const workspaceSummary = typeof workspaceSystem !== 'undefined'
            ? workspaceSystem.getEntitySummary?.(target.id)
            : null;
        const spatialProof = this.getInspectSpatialProofSummary(target, gameState);
        const cleanJoin = (lines = [], fallback = '') => {
            const filtered = (lines || []).filter(Boolean).map(line => this.normalizePresentationText(line));
            return filtered.length ? filtered.slice(0, 2).join(' | ') : fallback;
        };
        const relationshipSummary = communicationSummary?.relationship || null;
        const cognition = lifeSimSummary?.cognition || {};
        const feelings = cognition?.feelings || {};
        const feelingCounters = {
            loneliness: Math.round((feelings.loneliness || 0) * 100),
            comfortSeeking: Math.round((feelings.comfortSeeking || 0) * 100),
            socialInsecurity: Math.round((feelings.socialInsecurity || 0) * 100),
            jealousy: Math.round((feelings.jealousy || 0) * 100),
            grief: Math.round((feelings.grief || 0) * 100),
            pride: Math.round((feelings.pride || 0) * 100),
            shame: Math.round((feelings.shame || 0) * 100),
            loyaltyBias: Math.round((feelings.loyaltyBias || 0) * 100)
        };
        const feelingLine = cognition?.strongestFeeling && cognition.strongestFeeling !== 'steady'
            ? `Feeling ${cognition.strongestFeeling} | lonely ${feelingCounters.loneliness} | grief ${feelingCounters.grief} | jealous ${feelingCounters.jealousy} | pride ${feelingCounters.pride} | shame ${feelingCounters.shame}`
            : `Feeling steady | lonely ${feelingCounters.loneliness} | grief ${feelingCounters.grief} | jealous ${feelingCounters.jealousy} | pride ${feelingCounters.pride} | shame ${feelingCounters.shame}`;
        const isolationMarker = this.getInspectIsolationMarker(target, gameState);
        const whyThisMoment = this.buildWhyThisMomentState(target, gameState, mlSummary, lifeSimSummary, communicationSummary);
        const socialLensLines = this.buildSocialLensInspectLines({
            lifeSimSummary,
            communicationSummary,
            relationshipSummary,
            mlSummary
        }).map(line => this.normalizePresentationText(line));
        const workAndBondLines = this.buildWorkAndBondInspectLines(target, gameState, communicationSummary)
            .map(line => this.normalizePresentationText(line));
        const foodReserveCount = (gameState?.flowers || []).filter(flower =>
            flower?.lifecycleKind === 'reserve-food-ball'
            && (!zoneId || !flower.currentZoneId || flower.currentZoneId === zoneId)
        ).length;
        const ecologyReserveText = this.normalizePresentationText(
            `Reserve food ${foodReserveCount} | dirt ${lifeSimSummary?.objects?.dirtPileCount || 0} | clean ${lifeSimSummary?.objects?.cleanupPressure || 0}`
        );
        return {
            targetId: target.id,
            targetLabel: this.getInspectButterflyTitle(target),
            cognition: {
                feelings: feelingCounters,
                strongestFeeling: cognition?.strongestFeeling || 'steady'
            },
            heroLines: [
                this.normalizePresentationText([target.birthSource || 'wild', target.isHybrid ? 'Hybrid' : (target.personalityType || 'wild'), sleepState?.subtype || 'awake'].filter(Boolean).join(' • ')),
                this.normalizePresentationText([this.getZoneDisplayName(zoneId), rosterSummary?.label || 'Not rostered'].filter(Boolean).join(' • ')),
                this.normalizePresentationText(cleanJoin(statProfile?.display?.readinessLines, 'Ready -- | Unknown'))
            ].filter(Boolean),
            sections: [
                whyThisMoment ? {
                    id: 'whyThisMoment',
                    title: whyThisMoment.title,
                    lines: whyThisMoment.lines
                } : null,
                {
                    id: 'workAndBonds',
                    title: 'Work + Bonds',
                    lines: workAndBondLines
                },
                {
                    id: 'current',
                    title: 'Current Read',
                    lines: [
                        this.normalizePresentationText(cleanJoin(statProfile?.display?.baselineLines, this.buildTraitSummary(target.traits || {}))),
                        this.normalizePresentationText(cleanJoin(statProfile?.display?.upbringingLines, 'No learned imprint yet')),
                        this.normalizePresentationText(cleanJoin(statProfile?.display?.effectiveLines, 'No effective stat summary'))
                    ].filter(Boolean)
                },
                {
                    id: 'talk',
                    title: 'Talk + Proof',
                    lines: [
                        communicationSummary?.recentSpokenPhrase ? this.normalizePresentationText(`Said ${communicationSummary.recentSpokenPhrase}`) : 'Said nothing recently',
                        communicationSummary?.recentHeardPhrase ? this.normalizePresentationText(`Heard ${communicationSummary.recentHeardPhrase}`) : 'Heard nothing recently',
                        this.normalizePresentationText(`Voice ${communicationSummary?.voiceSummaryLabel || 'average | neutral | direct'}`),
                        this.normalizePresentationText(`Residue ${communicationSummary?.recentResidueLabel || 'No recent dialogue residue'}`)
                    ].filter(Boolean)
                },
                {
                    id: 'socialLens',
                    title: 'Social Lens',
                    lines: socialLensLines
                },
                {
                    id: 'social',
                    title: 'Social + Mind',
                    lines: [
                        relationshipSummary
                            ? this.normalizePresentationText(`${relationshipSummary.partnerLabel} | trust ${relationshipSummary.trust} | comfort ${relationshipSummary.comfort} | admiration ${relationshipSummary.admiration}`)
                            : this.normalizePresentationText(`rep ${lifeSimSummary?.social?.reputation || 0} | belong ${lifeSimSummary?.social?.belonging || 0} | conf ${lifeSimSummary?.social?.confidence || 0}`),
                        isolationMarker ? this.normalizePresentationText(isolationMarker) : null,
                        relationshipSummary
                            ? this.normalizePresentationText(`${relationshipSummary.partnerLabel} | ${relationshipSummary.pairTextureLabel || 'steady'} | attachment ${relationshipSummary.attachment} | chemistry ${relationshipSummary.chemistry}`)
                            : 'No strong bond tracked yet',
                        this.normalizePresentationText(feelingLine),
                        this.normalizePresentationText(lifeSimSummary?.memories?.headline || 'No reinforced residue yet'),
                        this.normalizePresentationText(lifeSimSummary?.routines?.headline || 'No strong routine anchors yet')
                    ].filter(Boolean)
                },
                workspaceSummary && workspaceSummary.broadcastCount > 0 ? {
                    id: 'attention',
                    title: 'Attention',
                    lines: [
                        this.normalizePresentationText(`Workspace depth ${workspaceSummary.attentionDepth} | broadcasts ${workspaceSummary.broadcastCount} | totals ${workspaceSummary.totalBroadcasts}`),
                        ...workspaceSummary.broadcastQueue.slice(0, 4).map(item =>
                            this.normalizePresentationText(`${item.sourceModule} ${item.label} | salience ${item.salience}`)
                        )
                    ]
                } : null,
                {
                    id: 'ecology',
                    title: 'Ecology + Space',
                    lines: [
                        this.normalizePresentationText(lifeSimSummary?.zone?.headline || `Zone ${this.getZoneDisplayName(zoneId)} | steady habitat`),
                        ecologyReserveText,
                        this.normalizePresentationText(`Space ${spatialProof?.headline || 'ground | loose | open | canPass'}`),
                        this.normalizePresentationText(`Contact ${spatialProof?.detail || 'open air | touch 0 | hands free'}`),
                        this.normalizePresentationText(lifeSimSummary?.progression
                            ? `${lifeSimSummary.progression.origin || target.birthSource || 'wild'} | line ${lifeSimSummary.progression.lineageValue || 0} | rare ${lifeSimSummary.progression.rarityExposure || 0}`
                            : `${target.birthSource || 'wild'} | line 0 | rare 0`)
                    ].filter(Boolean)
                }
            ].filter(section => section && (section.lines || []).length > 0)
        };
    }

    buildInspectDomState(gameState) {
        this.syncPanelLayouts(gameState);
        const panel = this.inspectPanel;
        const target = this.resolveInspectTarget(gameState);
        const isReleaseMode = this.isInspectReleaseModeActive();
        const isMateArmed = !!(target?.id && this.inspectControl.mateSourceId === target.id);
        const browseAll = this.inspectControl.browseScope === 'all';

        const baseState = {
            visible: !!panel.visible && gameState?.viewMode !== 'battle',
            rect: this.getDomPanelRect(panel),
            highContrast: !!this.accessibilitySettings.highContrastUI,
            browseAll,
            isReleaseMode,
            isMateArmed
        };

        if (!baseState.visible) {
            return { visible: false };
        }

        if (isReleaseMode) {
            return {
                ...baseState,
                mode: 'release',
                title: 'Release',
                subtitle: this.getZoneDisplayName(gameState?.focusedZoneId || null),
                selectedCount: (this.inspectControl.releaseSelectionIds || new Set()).size,
                entries: this.getInspectReleaseEntries(gameState).map(entry => ({
                    butterflyId: entry.butterflyId,
                    title: entry.title,
                    detail: entry.detail,
                    selected: !!entry.selected
                }))
            };
        }

        if (!target) {
            return {
                ...baseState,
                mode: 'browse',
                title: 'Inspect',
                subtitle: browseAll ? 'All garden zones' : this.getZoneDisplayName(gameState?.focusedZoneId || null),
                entries: this.getInspectBrowseEntries(gameState).map(entry => ({
                    butterflyId: entry.butterflyId,
                    title: entry.title,
                    detail: entry.detail
                }))
            };
        }

        if (isMateArmed) {
            return {
                ...baseState,
                mode: 'mates',
                title: `${this.getInspectButterflyTitle(target)} mates`,
                subtitle: 'All zones',
                sourceId: target.id,
                entries: this.getInspectMateEntries(gameState, target).map(entry => ({
                    butterflyId: entry.butterflyId,
                    title: entry.title,
                    detail: entry.detail
                }))
            };
        }

        const detailState = this.buildInspectDetailDomState(target, gameState);
        return {
            ...baseState,
            mode: 'detail',
            title: 'Inspect',
            subtitle: detailState.targetLabel,
            targetId: target.id,
            rostered: !!rosterSystem?.getEntitySummary?.(target.id, gameState)?.member,
            detailState
        };
    }

    buildJournalDomState(gameState) {
        this.syncPanelLayouts(gameState);
        const journal = this.butterflyCollection;
        if (!journal) return { visible: false };
        journal.refreshLayout?.();

        const visible = !!journal.visible && gameState?.viewMode !== 'battle';
        if (!visible) return { visible: false };

        const baseState = {
            visible,
            rect: this.getDomPanelRect(journal),
            highContrast: !!this.accessibilitySettings.highContrastUI,
            title: journal.mode === 'roster' ? 'Battle Journal' : 'Butterfly Journal',
            mode: journal.mode || 'collection',
            hybridOnly: !!journal.hybridOnly,
            canNavigateLeft: !!journal.canNavigateLeft?.(),
            canNavigateRight: !!journal.canNavigateRight?.(),
            tabs: [
                { id: 'collection', label: 'Collection', active: journal.mode === 'collection' },
                { id: 'roster', label: 'Roster', active: journal.mode === 'roster' }
            ]
        };

        if (journal.mode === 'roster') {
            const entry = journal.getCurrentRosterEntry?.();
            const entries = journal.getRosterEntries?.() || [];
            const summary = entry ? rosterSystem?.getEntitySummary?.(entry.id, gameState) : null;
            const profile = entry ? statProfileSystem?.getEntityProfile?.(entry, gameState) : null;
            const readiness = profile?.readinessProfile || null;
            return {
                ...baseState,
                subtitle: `Roster ${entries.length} living`,
                page: entry ? {
                    kind: 'roster',
                    title: entry.displayName || entry.personalityType || entry.id,
                    eyebrow: `${entry.sex || '?'} | ${summary?.label || 'Not on battle roster'} | ${readiness?.tier || 'Watch'}`,
                    chips: [
                        summary?.member ? 'ROSTERED' : 'RESERVE',
                        readiness?.tier || 'Watch',
                        `R ${Math.round(readiness?.score || 0)}`
                    ],
                    sections: [
                        {
                            title: 'Battle Readiness',
                            lines: [
                                ...(profile?.display?.readinessLines?.slice(0, 2) || ['Ready -- | Unknown']),
                                ...(profile?.display?.battleLines?.slice(0, 1) || ['No battle profile'])
                            ]
                        },
                        {
                            title: 'Genes + Context',
                            lines: [
                                ...(profile?.display?.baselineLines?.slice(0, 2) || ['No genetic baseline']),
                                ...(profile?.display?.abilityLines?.slice(0, 1) || ['Ability none']),
                                ...(profile?.display?.ecologyLines?.slice(0, 2) || [])
                            ]
                        }
                    ]
                } : null,
                rosterAction: entry ? {
                    toggleLabel: summary?.member ? 'Leave Roster' : 'Join Roster',
                    battleLabel: (gameState?.roster?.memberIds?.length || 0) < 2 ? 'Need 2+' : 'Open Battle'
                } : null,
                indexLabel: `${Math.min((journal.currentRosterIndex || 0) + 1, Math.max(1, entries.length))} / ${Math.max(1, entries.length)}`
            };
        }

        const page = journal.getCurrentPage?.();
        if (!page) {
            return {
                ...baseState,
                subtitle: 'No visible journal entries',
                emptyLabel: 'No journal entries match the current filter.'
            };
        }

        if (page.kind === 'base') {
            const entry = journal.journalEntries?.[page.type] || null;
            const pages = journal.getPages?.() || [];
            return {
                ...baseState,
                subtitle: `${pages.length ? (journal.currentIndex || 0) + 1 : 0} / ${Math.max(1, pages.length)}`,
                filterLabel: journal.hybridOnly ? 'All Pages' : 'Hybrids',
                page: {
                    kind: 'base',
                    title: entry?.title || page.type,
                    eyebrow: `WILD TYPE | ${(page.type || '?').toUpperCase()}`,
                    chips: ['WILD TYPE', (page.type || '?').toUpperCase()],
                    sections: [
                        {
                            title: 'Field Notes',
                            lines: [
                                entry?.quote || 'No field note available',
                                entry?.description || 'No ecology summary available'
                            ]
                        }
                    ]
                }
            };
        }

        const profile = statProfileSystem?.getJournalProfile?.(page.entry, gameState) || null;
        const bornAt = new Date(page.entry.bornAt);
        const pages = journal.getPages?.() || [];
        return {
            ...baseState,
            subtitle: `${pages.length ? (journal.currentIndex || 0) + 1 : 0} / ${Math.max(1, pages.length)}`,
            filterLabel: journal.hybridOnly ? 'All Pages' : 'Hybrids',
            page: {
                kind: 'hybrid',
                title: page.entry.name,
                eyebrow: `HYBRID | ${page.entry.sex} | Born ${bornAt.toLocaleDateString()}`,
                chips: ['HYBRID', page.entry.sex || '?', `Born ${bornAt.toLocaleDateString()}`],
                sections: [
                    {
                        title: 'Genetic Baseline',
                        lines: [
                            ...(profile?.display?.baselineLines?.slice(0, 2) || ['No genetic baseline']),
                            ...(profile?.display?.abilityLines?.slice(0, 1) || ['Ability none']),
                            ...(profile?.display?.mutationLines?.slice(0, 1) || [])
                        ]
                    },
                    {
                        title: 'Parents + Ecology',
                        lines: [
                            ...(profile?.display?.parentLines?.slice(0, 2) || []),
                            ...(profile?.display?.ecologyLines?.slice(0, 2) || ['No active release pressure summary'])
                        ]
                    }
                ]
            },
            canRenameHybrid: true
        };
    }

    syncDomPanels(gameState = null) {
        if (typeof shellDomOverlay === 'undefined') return;
        const state = gameState || gameCore?.getGameState?.() || gameCore?.gameState || {};
        if (!this.isShellUiDomEnabled() || state.viewMode === 'battle') {
            shellDomOverlay.hideAll?.();
            return;
        }
        this.syncPanelLayouts(state);
        const feedVisible = !!this.activityLogPanel.visible;
        const accessVisible = !!this.accessibilityPanel.visible;
        const inspectVisible = !!this.inspectPanel.visible;
        const journalVisible = !!this.butterflyCollection?.visible;
        const debugVisible = !!debugUI?.buildDomPanelState?.()?.visible;
        const guideVisible = this.isFirstSessionGuideRenderable(state);
        if (!feedVisible && !accessVisible && !inspectVisible && !journalVisible && !debugVisible && !guideVisible) {
            shellDomOverlay.hideAll?.();
            return;
        }
        shellDomOverlay.update?.({
            feed: feedVisible ? this.buildFeedDomState(state) : { visible: false },
            access: accessVisible ? this.buildAccessibilityDomState(state) : { visible: false },
            inspect: inspectVisible ? this.buildInspectDomState(state) : { visible: false },
            journal: journalVisible ? this.buildJournalDomState(state) : { visible: false },
            debug: debugVisible ? (debugUI?.buildDomPanelState?.() || { visible: false }) : { visible: false },
            guide: guideVisible ? this.buildGuideDomState(state) : { visible: false }
        });
    }

    buildGuideDomState(gameState) {
        return {
            visible: this.isFirstSessionGuideRenderable(gameState),
            rect: this.getGuidePanelRect(),
            highContrast: !!this.accessibilitySettings.highContrastUI,
            title: 'Quick start',
            subtitle: 'First-session guide',
            lines: this.getFirstSessionGuideLines(),
            dismissLabel: 'Dismiss'
        };
    }

    handleDomAction(payload = {}) {
        const gameState = gameCore?.getGameState?.() || gameCore?.gameState || null;
        if (!gameState) return;
        if (payload.panel === 'feed') {
            if (payload.action === 'toggleFilter' && payload.filterId && this.activityLogPanel.filters?.hasOwnProperty(payload.filterId)) {
                this.activityLogPanel.filters[payload.filterId] = !this.activityLogPanel.filters[payload.filterId];
                this.activityLogPanel.scrollOffset = 0;
                if (this.activityLogPanel.followLatest) {
                    this.activityLogPanel.frozenEntries = null;
                }
                return;
            }
            if (payload.action === 'resumeLatest') {
                this.resumeLatestFeedView();
                return;
            }
        }
        if (payload.panel === 'access') {
            if (payload.action === 'control' && payload.controlId) {
                this.activateAccessibilityControl(payload.controlId);
                return;
            }
            if (payload.action === 'setUiScale') {
                this.setUiScaleValue(payload.value);
                return;
            }
        }
        if (payload.panel === 'inspect') {
            const target = this.getLockedInspectTarget(gameState);
            if (payload.action === 'toggleBrowseScope') {
                this.inspectControl.browseScope = this.inspectControl.browseScope === 'all' ? 'zone' : 'all';
                this.clearInspectSelection(gameState, { keepReleaseMode: false });
                return;
            }
            if (payload.action === 'enterReleaseMode') {
                this.enterInspectReleaseMode(gameState);
                return;
            }
            if (payload.action === 'cancelReleaseMode') {
                this.cancelInspectReleaseMode();
                return;
            }
            if (payload.action === 'confirmReleaseMode') {
                this.confirmInspectReleaseSelection(gameState);
                return;
            }
            if (payload.action === 'selectBrowse' && payload.butterflyId) {
                const butterfly = (gameState?.butterflies || []).find(entry => entry.id === payload.butterflyId) || null;
                if (butterfly) {
                    this.beginGuidingButterfly(butterfly, gameState);
                }
                return;
            }
            if (payload.action === 'clearSelection') {
                this.clearInspectSelection(gameState);
                return;
            }
            if (payload.action === 'toggleMateMode' && target?.id) {
                this.inspectControl.mateSourceId = this.isMateModeActiveFor(target.id) ? null : target.id;
                this.inspectPanel.scrollOffset = 0;
                return;
            }
            if (payload.action === 'selectMateCandidate' && target?.id && payload.butterflyId) {
                const candidate = (gameState?.butterflies || []).find(entry => entry.id === payload.butterflyId) || null;
                this.tryStartMateFromInspect(gameState, target, candidate);
                return;
            }
            if (payload.action === 'toggleRoster' && target?.id) {
                rosterSystem?.toggleMember?.(target.id, gameState);
                return;
            }
            if (payload.action === 'toggleReleaseSelection' && payload.butterflyId) {
                this.toggleInspectReleaseSelection(payload.butterflyId);
                return;
            }
        }
        if (payload.panel === 'journal' && this.butterflyCollection) {
            if (payload.action === 'setMode' && payload.mode) {
                this.butterflyCollection.setMode?.(payload.mode);
                return;
            }
            if (payload.action === 'toggleHybridOnly') {
                this.butterflyCollection.hybridOnly = !this.butterflyCollection.hybridOnly;
                this.butterflyCollection.currentIndex = 0;
                this.butterflyCollection.resetCurrentScrollOffset?.();
                return;
            }
            if (payload.action === 'navigateLeft') {
                this.butterflyCollection.navigateLeft?.();
                return;
            }
            if (payload.action === 'navigateRight') {
                this.butterflyCollection.navigateRight?.();
                return;
            }
            if (payload.action === 'toggleRosterMember') {
                const entry = this.butterflyCollection.getCurrentRosterEntry?.();
                if (entry?.id) {
                    rosterSystem?.toggleMember?.(entry.id, gameState);
                }
                return;
            }
            if (payload.action === 'openBattle') {
                this.openBattleSetupFromJournal();
                return;
            }
            if (payload.action === 'renameCurrentHybrid') {
                this.butterflyCollection.promptRenameCurrentHybrid?.();
                return;
            }
        }
        if (payload.panel === 'debug' && payload.action === 'invoke' && payload.actionId) {
            debugUI?.handleGodModeAction?.(payload.actionId);
            return;
        }
        if (payload.panel === 'guide' && payload.action === 'dismiss') {
            this.dismissFirstSessionGuide(true);
        }
    }

    dismissFirstSessionGuide(persist = false) {
        this.firstSessionGuide.visible = false;
        this.firstSessionGuide.dismissRect = null;
        if (persist) {
            this.persistOnboardingDismissed();
        }
    }

    loadPersistedOnboardingDismissed() {
        if (typeof localStorage === 'undefined') return false;
        try {
            return localStorage.getItem(PAPILIONEM_ONBOARDING_KEY) === 'done';
        } catch (_error) {
            return false;
        }
    }

    persistOnboardingDismissed() {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(PAPILIONEM_ONBOARDING_KEY, 'done');
        } catch (_error) {
            // Ignore persistence failures; the session hint can still function in-memory.
        }
    }

    drawFirstSessionGuide(graphics, gameState, debugMode) {
        if (!this.isFirstSessionGuideRenderable(gameState, debugMode) || this.isShellUiDomEnabled()) {
            this.firstSessionGuide.dismissRect = null;
            return;
        }

        const highContrast = this.accessibilitySettings.highContrastUI;
        const uiScale = this.getEffectiveUiScale();
        const compactScale = Math.max(0.42, uiScale * 0.52);
        const panelRect = this.getGuidePanelRect();
        const panelX = panelRect.x;
        const panelY = panelRect.y;
        const panelWidth = panelRect.width;
        const panelHeight = panelRect.height;
        const titleColor = highContrast ? [255, 255, 255, 255] : [245, 247, 250, 255];
        const bodyColor = highContrast ? [255, 255, 255, 255] : [216, 222, 230, 255];
        const hintColor = highContrast ? [255, 255, 255, 255] : [176, 184, 196, 255];
        const panelFill = highContrast ? [0, 0, 0, 244] : [18, 22, 28, 206];
        const strokeColor = highContrast ? [255, 255, 255, 255] : [224, 232, 244, 100];
        const dismissRect = {
            x: panelX + panelWidth - 24,
            y: panelY + 8,
            width: 16,
            height: 12
        };

        graphics.push();
        graphics.fill(...panelFill);
        graphics.stroke(...strokeColor);
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.rect(panelX, panelY, panelWidth, panelHeight, 10);

        graphics.noStroke();
        graphics.fill(...titleColor);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(Math.max(7, Math.round(8 * compactScale)));
        graphics.text('Quick start', panelX + 10, panelY + 8);

        graphics.fill(...hintColor);
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(Math.max(6, Math.round(7 * compactScale)));
        graphics.text('X', dismissRect.x + dismissRect.width / 2, dismissRect.y + dismissRect.height / 2 + 0.5);

        graphics.fill(...bodyColor);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(Math.max(6, Math.round(7 * compactScale)));
        const lines = this.getFirstSessionGuideLines();
        let textY = panelY + 24;
        const lineHeight = Math.max(11, Math.round(12 * compactScale));
        for (const line of lines) {
            graphics.text(line, panelX + 10, textY);
            textY += lineHeight;
        }
        graphics.pop();

        this.firstSessionGuide.dismissRect = dismissRect;
    }
    
    // Cursor hint removed - interaction system provides better contextual feedback
    
    // Draw boundary zones visualization using unified system
    drawBoundaryZones(graphics) {
        // Use unified boundary zone drawing with our configured zones
        gridManager.drawBoundaryZones(graphics, this.boundaryZones);
    }
    
    // Draw info panel on main canvas (not on UI layer)
    drawInfoPanel(gameState, debugMode) {
        push();
        noStroke();
        fill(this.infoPanel.textColor);
        textAlign(LEFT);
        
        let y = this.infoPanel.y;
        const x = this.infoPanel.x;
        const lineHeight = this.infoPanel.lineHeight;
        
        // Cursor velocity
        text(`Cursor velocity: ${gameState.cursorVelocity.toFixed(2)}`, x, y);
        y += lineHeight;
        text(`Still frames: ${gameState.framesSinceMovement}`, x, y);
        y += lineHeight;
        
        
        // FPS
        text(`FPS: ${frameRate().toFixed(0)}`, x, y);
        y += lineHeight;
        
        // Controls
        text(`Press D for Debug Mode`, x, y);
        y += lineHeight;
        text(`Hold B to see boundary zones`, x, y);
        y += lineHeight;
        text(`Use top-right buttons for Journal / Feed / Inspect`, x, y);
        
        pop();
    }
    
    // Handle key presses for UI controls
    handleKeyPress(key, keyCode) {
        if ((keyCode === ESCAPE || keyCode === 27) && this.inspectControl.releaseMode) {
            this.cancelInspectReleaseMode();
            return true;
        }

        // If butterfly collection is visible, let it handle arrow keys
        if (this.butterflyCollection && this.butterflyCollection.visible) {
            if (keyCode === LEFT_ARROW) {
                if (this.butterflyCollection.canNavigateLeft()) {
                    this.butterflyCollection.navigateLeft();
                    return true;
                }
            } else if (keyCode === RIGHT_ARROW) {
                if (this.butterflyCollection.canNavigateRight()) {
                    this.butterflyCollection.navigateRight();
                    return true;
                }
            }
        }
        
        // Handle boundary zones toggle (B key)
        if (key === 'B' || key === 'b') {
            // This is handled as keyIsDown in the main draw loop
            return false;
        }

        if (key === 'O' || key === 'o') {
            return this.toggleOverviewMode();
        }
        
        return false; // No key consumed
    }

    getZoneList() {
        return typeof zoneSystem !== 'undefined' ? zoneSystem.getZones?.() || [] : [];
    }

    getEffectiveUiScale() {
        const raw = this.accessibilitySettings?.uiScale || 1;
        return Math.max(0.75, Math.min(1.25, raw));
    }

    getUiMetrics() {
        const uiScale = this.getEffectiveUiScale();
        const compactScale = Math.max(0.42, uiScale * 0.52);
        return {
            uiScale,
            compactScale,
            leftMargin: 8,
            rightMargin: 8,
            topStripY: 10,
            gap: Math.max(4, Math.round(5 * compactScale)),
            chipHeight: Math.max(14, Math.round(16 * compactScale))
        };
    }

    syncPanelLayouts(_gameState) {
        const metrics = this.getUiMetrics();
        const uiScale = metrics.uiScale;
        const rightMargin = metrics.rightMargin;
        const leftMargin = metrics.leftMargin;
        const topStripY = metrics.topStripY;
        const topGap = metrics.gap;
        const frame = typeof frameCount === 'number' ? frameCount : -1;
        const key = [
            frame,
            uiScale,
            rightMargin,
            leftMargin,
            topStripY,
            topGap,
            gameConfig.canvas.baseWidth,
            gameConfig.canvas.baseHeight
        ].join('|');
        if (this.layoutSyncState.frame === frame && this.layoutSyncState.key === key) {
            return;
        }
        this.layoutSyncState.frame = frame;
        this.layoutSyncState.key = key;
        const buttonScale = 0.6 * uiScale;
        const rows = [
            this.playerButtonTemplates.slice(0, 4),
            this.playerButtonTemplates.slice(4)
        ];

        let buttonY = topStripY;
        const laidOut = [];
        for (const row of rows) {
            let rowWidth = 0;
            row.forEach((button, index) => {
                rowWidth += Math.round(button.width * buttonScale);
                if (index < row.length - 1) rowWidth += topGap;
            });
            let x = gameConfig.canvas.baseWidth - rightMargin - rowWidth;
            let rowHeight = 0;
            for (const button of row) {
                const width = Math.max(34, Math.round(button.width * buttonScale));
                const height = Math.max(14, Math.round(button.height * buttonScale));
                laidOut.push({
                    ...button,
                    x,
                    y: buttonY,
                    width,
                    height
                });
                x += width + topGap;
                rowHeight = Math.max(rowHeight, height);
            }
            buttonY += rowHeight + topGap;
        }
        this.playerButtons = laidOut;

        const topHudHeight = metrics.chipHeight;
        const panelTopY = topStripY + topHudHeight + 6;
        const inspectWidth = Math.round(344 * uiScale);
        const inspectHeight = Math.round(318 * uiScale);
        const inspectX = gameConfig.canvas.baseWidth - inspectWidth - rightMargin;
        const feedWidth = Math.round(286 * uiScale);
        const feedHeight = Math.round(182 * uiScale);
        const panelColumnTopY = Math.max(panelTopY, buttonY + 4);

        this.inspectPanel.x = inspectX;
        this.inspectPanel.y = panelColumnTopY;
        this.inspectPanel.width = inspectWidth;
        this.inspectPanel.height = inspectHeight;
        this.inspectPanel.lineHeight = Math.max(10, Math.round(10 * uiScale));

        this.activityLogPanel.width = feedWidth;
        this.activityLogPanel.height = feedHeight;
        this.activityLogPanel.y = panelTopY;
        this.activityLogPanel.x = leftMargin;
        this.activityLogPanel.lineHeight = Math.max(10, Math.round(10 * uiScale));

        this.accessibilityPanel.x = gameConfig.canvas.baseWidth - Math.round(166 * uiScale) - rightMargin;
        this.accessibilityPanel.y = panelColumnTopY;
        this.accessibilityPanel.width = Math.round(154 * uiScale);
        this.accessibilityPanel.lineHeight = Math.max(7, Math.round(8 * uiScale));

        this.battleSetupPanel.x = gameConfig.canvas.baseWidth - Math.round(178 * uiScale) - rightMargin;
        this.battleSetupPanel.y = panelColumnTopY;
        this.battleSetupPanel.width = Math.round(166 * uiScale);
        this.battleSetupPanel.height = Math.round(210 * uiScale);
    }

    getVisiblePlayerButtons() {
        const multipleZones = this.getZoneList().length > 1;
        if (multipleZones) return this.playerButtons;
        return this.playerButtons.filter(button => button.id !== 'cycleZone');
    }

    activatePlayerButton(buttonId, gameState) {
        switch (buttonId) {
            case 'saveGame':
                return this.requestManualSave();
            case 'toggleJournal':
                this.toggleButterflyCollection();
                return true;
            case 'toggleActivityLog':
                this.activityLogPanel.visible = !this.activityLogPanel.visible;
                return true;
            case 'toggleInspect':
                this.inspectPanel.visible = !this.inspectPanel.visible;
                if (!this.inspectPanel.visible) {
                    this.clearInspectSelection(gameState);
                }
                return true;
            case 'toggleAccessibility':
                this.accessibilityPanel.visible = !this.accessibilityPanel.visible;
                return true;
            case 'toggleBattleMode':
                return this.toggleBattleSetup();
            case 'cycleZone':
                return this.focusAdjacentZone(1);
            default:
                return false;
        }
    }

    formatMlPolicyInspectText(policy, fallbackLabel = 'none') {
        if (!policy) return `${fallbackLabel} FB | 0 low`;
        const altLabels = (policy.alternativeLabels || []).slice(0, 2);
        const confidenceLabel = policy.confidenceLabel || `${policy.confidence || 0} ${policy.confidenceBand || 'low'}`;
        return `${policy.label} ${policy.sourceLabel || 'FB'} | ${confidenceLabel}${altLabels.length ? ` | next ${altLabels.join(', ')}` : ''}`.trim();
    }

    normalizePresentationText(value = '') {
        return String(value ?? '')
            .replaceAll('â€¢', '•')
            .replaceAll('Ã¢â‚¬Â¢', '|')
            .replaceAll('Â·', '·')
            .trim();
    }

    isFeedThreadInterpretationItalicEnabled() {
        return gameConfig?.ui?.feedThreads?.interpretationItalic !== false;
    }

    formatFeedHeardMeaning(value = '') {
        const normalized = this.normalizePresentationText(value).replace(/\s+/g, ' ');
        if (!normalized) return null;
        return normalized.length > 60 ? `${normalized.slice(0, 57)}...` : normalized;
    }

    isFeedHeardMeaningLine(line = '') {
        return /^\(heard:\s/i.test(String(line || ''));
    }

    getPrimaryPresentationClause(value = '', fallback = 'none') {
        const normalized = this.normalizePresentationText(value || fallback);
        const clause = normalized.split('|')[0]?.trim();
        return clause || fallback;
    }

    toPresentationPercent(value = 0) {
        const numeric = Number(value || 0);
        if (!Number.isFinite(numeric)) return 0;
        return numeric <= 1 ? Math.round(numeric * 100) : Math.round(numeric);
    }

    buildFeedContextFooter(entry = {}) {
        if (entry?.category !== 'talk') {
            const grounding = this.normalizePresentationText(entry?.grounding || '');
            return grounding || null;
        }
        const contextTags = Array.isArray(entry?.contextTags)
            ? entry.contextTags.map(tag => this.normalizePresentationText(tag)).filter(Boolean)
            : [];
        const textureText = this.normalizePresentationText(entry?.pairTextureLabel || entry?.pairModeLabel || '');
        const visibleContext = contextTags.find(tag => /holding|moving|feeding|settling|reacting|keeping|circling|drawing|working|handling|signaling|skimming|staying/i.test(tag))
            || contextTags.find(tag => /texture|exchange/i.test(tag))
            || null;
        const turnText = Array.isArray(entry?.threadLines) && entry.threadLines.length > 1
            ? `${entry.threadLines.length} turns`
            : null;
        const footer = [textureText || null, visibleContext, turnText].filter(Boolean).join(' · ');
        return footer || null;
    }

    formatProjectRoleLabel(roleLabel = '') {
        const normalized = String(roleLabel || '').trim();
        const labels = {
            builder: 'builder',
            carrier: 'carrier',
            coordinator: 'coordinator'
        };
        return labels[normalized] || normalized || 'helper';
    }

    formatProjectRoleReason(roleLabel = '') {
        const normalized = String(roleLabel || '').trim();
        if (normalized === 'builder') return 'aiming for the shelter point';
        if (normalized === 'carrier') return 'bringing usable material';
        if (normalized === 'coordinator') return 'keeping the shared work aligned';
        return 'helping the shared work';
    }

    formatProjectRoleGrounding(contributorRoles = null) {
        if (!contributorRoles || typeof contributorRoles !== 'object') return '';
        const rolePairs = Object.entries(contributorRoles)
            .map(([id, entry]) => {
                if (!entry?.roleLabel) return null;
                const role = this.formatProjectRoleLabel(entry.roleLabel);
                if (!role) return null;
                const name = this.getEntityDisplayName(this.getButterflyById(id), id);
                return name ? `${name} ${role}` : role;
            })
            .filter(Boolean);
        if (rolePairs.length) {
            return ` • roles: ${rolePairs.slice(0, 4).join(', ')}`;
        }
        const roles = Object.values(contributorRoles)
            .map(entry => entry?.roleLabel)
            .filter(Boolean)
            .map(role => this.formatProjectRoleLabel(role));
        const uniqueRoles = [...new Set(roles)];
        return uniqueRoles.length ? ` • roles: ${uniqueRoles.join(', ')}` : '';
    }

    buildWorkAndBondInspectLines(target, gameState = null, communicationSummary = null) {
        if (!target?.id) return [];
        const lines = [];
        const blockState = target.blockInteraction || {};
        const assist = blockState.buildingAssist || null;
        const requester = assist?.requesterId ? this.getButterflyById(assist.requesterId) : null;
        const requesterLabel = requester ? this.getEntityDisplayName(requester, assist.requesterId) : null;
        if (assist) {
            const role = this.formatProjectRoleLabel(assist.roleLabel || 'helper');
            lines.push(this.normalizePresentationText(`Shared work ${role} for ${requesterLabel || 'another butterfly'} | ${this.formatProjectRoleReason(role)}`));
            lines.push(this.normalizePresentationText(`Project ${assist.projectId || 'active'} | ${assist.shadeProgress || 'shade help'} | block ${blockState.carryingBlockId || blockState.targetBlockId || 'seeking'}`));
        } else if (blockState.carryingBlockId || blockState.targetBlockId || blockState.placementTarget) {
            const placement = blockState.placementTarget || {};
            const mode = placement.createsShade ? 'building shade' : (placement.placementMode || 'moving material');
            lines.push(this.normalizePresentationText(`Object work ${mode} | block ${blockState.carryingBlockId || blockState.targetBlockId || 'targeted'}`));
        }

        const projects = typeof objectSystem !== 'undefined' && objectSystem?.environmentProjects
            ? Array.from(objectSystem.environmentProjects.values())
            : [];
        const activeProject = projects.find(project =>
            project?.status === 'active' && project?.contributors?.[target.id]
        ) || null;
        const contributor = activeProject?.contributors?.[target.id] || null;
        if (activeProject && contributor) {
            const roles = [...new Set([
                contributor.metadata?.roleLabel,
                ...(contributor.roles || [])
            ].filter(Boolean).map(role => this.formatProjectRoleLabel(role)))];
            lines.push(this.normalizePresentationText(`Active project ${activeProject.type || 'shared work'} | ${roles.join(', ') || 'helper'} | contributions ${contributor.contributions || 0}`));
        }

        const relationship = communicationSummary?.relationship || null;
        const partnerId = relationship?.partnerId || null;
        const edge = partnerId ? target.lifeSim?.socialEdges?.[partnerId] || null : null;
        if (relationship) {
            const tags = Array.isArray(edge?.historyTags) ? edge.historyTags.slice(0, 2) : [];
            const tagText = tags.length ? ` | reasons ${tags.map(tag => this.normalizePresentationText(tag)).join(', ')}` : '';
            lines.push(this.normalizePresentationText(`Bond ${relationship.partnerLabel || partnerId || 'partner'} | ${relationship.pairTextureLabel || 'steady'} | follow-through ${relationship.followThrough || 0}${tagText}`));
        }

        return lines.slice(0, 4);
    }

    buildSocialLensInspectLines({
        lifeSimSummary = null,
        communicationSummary = null,
        relationshipSummary = null,
        mlSummary = null
    } = {}) {
        const pairTexture = this.normalizePresentationText(relationshipSummary?.pairTextureLabel || 'steady');
        const followLabel = this.normalizePresentationText(relationshipSummary?.followThroughLabel || 'no strong carry-over');
        const followScore = this.toPresentationPercent(relationshipSummary?.followThrough || 0);
        const pairSignature = this.normalizePresentationText(
            relationshipSummary?.pairTextureSignature
            || relationshipSummary?.repairLabel
            || 'steady carry-over'
        );
        const societyTone = this.normalizePresentationText(lifeSimSummary?.socialEcology?.societyLabel || 'mixed | no dominant local society tone');
        const rhythmTone = this.normalizePresentationText(lifeSimSummary?.socialEcology?.headline || 'quiet | no strong local rhythm');
        const fieldLabel = this.normalizePresentationText(communicationSummary?.localSignalFieldLabel || 'quiet | no active field');
        const fieldDetail = this.normalizePresentationText(communicationSummary?.localSignalFieldDetail || 'No nearby active signals');
        const mlLead = mlSummary
            ? `${mlSummary.actionLabel || 'none'} / ${mlSummary.signalLabel || 'quiet'} / ${mlSummary.riskLabel || 'observe'} | ${mlSummary.sourceLabel || 'Fallback'}`
            : 'none / quiet / observe | Fallback';
        const whyText = this.normalizePresentationText(
            mlSummary?.explainability?.action?.shortText
            || mlSummary?.explainability?.signal?.shortText
            || mlSummary?.explainability?.risk?.shortText
            || 'No social driver snapshot'
        );
        return [
            `Texture ${pairTexture} | follow ${followScore} | ${followLabel}`,
            `Carry-over ${pairSignature}`,
            `Society ${societyTone}`,
            `Rhythm ${rhythmTone}`,
            `Field ${fieldLabel}`,
            `Field detail ${fieldDetail}`,
            `ML ${this.normalizePresentationText(mlLead)}`,
            `Why ${whyText}`
        ];
    }

    buildMlInspectRows(mlSummary, context = {}) {
        const featureTrace = mlSummary?.featureTrace || null;
        const runtime = mlSummary?.runtime || null;
        const relationshipSummary = context?.relationshipSummary
            || context?.communicationSummary?.relationship
            || null;
        const socialEcology = context?.lifeSimSummary?.socialEcology || null;
        const sharedHooksText = featureTrace?.sharedSpatialHooks?.length
            ? featureTrace.sharedSpatialHooks.join('/')
            : 'none';
        const schemaText = featureTrace
            ? `fs ${featureTrace.featureSchemaVersion || 'n/a'} | ts ${featureTrace.traceSchemaVersion || 'n/a'} | hooks ${sharedHooksText}`
            : 'fs n/a | ts n/a | hooks none';
        const featureText = featureTrace
            ? `${featureTrace.groupCount || 0} groups | ${featureTrace.flatFeatureCount || 0} flat | ${featureTrace.vectorLength || 0} vec`
            : '0 groups | 0 flat | 0 vec';
        const b3Text = featureTrace?.spatialFieldTiers?.b3Stable?.length
            ? `b3 ${featureTrace.spatialFieldTiers.b3Stable.join('/')}`
            : 'b3 none';
        const b7Text = featureTrace?.spatialFieldTiers?.b7Stable?.length
            ? `b7 ${featureTrace.spatialFieldTiers.b7Stable.join('/')}`
            : 'b7 none';
        const currentSpatial = featureTrace?.currentSpatial || {};
        const spatialText = featureTrace
            ? `${b3Text} | ${b7Text} | now ${currentSpatial.occupancyBand || 'ground'}/${currentSpatial.pathState || 'open'}/${currentSpatial.bodyFit || 'canPass'}${currentSpatial.insideShelter ? ' | in shelter' : currentSpatial.canUseInterior ? ' | shelter ready' : ''}`
            : 'b3 none | b7 none | now ground/open/canPass';
        const traceText = mlSummary
            ? `${mlSummary.sourceLabel} | ${mlSummary.backend || 'heuristic'} | ${mlSummary.modelVersionId || 'n/a'}${mlSummary.uncertainty ? ' | uncertain' : ''}`.trim()
            : 'Fallback | heuristic | n/a';
        const pathText = runtime?.policyArtifactPath || 'artifact path unavailable';
        const whyText = mlSummary?.explainability?.action?.shortText
            || mlSummary?.explainability?.risk?.shortText
            || 'No explainability snapshot';
        const socialStateText = `${this.getPrimaryPresentationClause(socialEcology?.societyLabel, 'mixed')} | ${this.normalizePresentationText(relationshipSummary?.pairTextureLabel || 'steady')} | follow ${this.toPresentationPercent(relationshipSummary?.followThrough || 0)} ${this.normalizePresentationText(relationshipSummary?.followThroughLabel || 'no strong carry-over')}`;
        const fieldText = `${this.normalizePresentationText(context?.communicationSummary?.localSignalFieldLabel || 'quiet | no active field')} | ${this.normalizePresentationText(context?.communicationSummary?.localSignalFieldDetail || 'No nearby active signals')}`;
        const leanText = mlSummary
            ? `${mlSummary.actionLabel || 'none'} / ${mlSummary.signalLabel || 'quiet'} / ${mlSummary.riskLabel || 'observe'} | ${mlSummary.sourceLabel || 'Fallback'}`
            : 'none / quiet / observe | Fallback';
        const contextText = mlSummary
            ? `${mlSummary.context?.dominantDrive || 'rest'}/${mlSummary.context?.dominantEmotion || 'curiosity'} | ${mlSummary.context?.focusType || 'none'} | trust ${Math.round((mlSummary.context?.playerTrust || 0) * 100)} fear ${Math.round((mlSummary.context?.playerFear || 0) * 100)} | ${mlSummary.context?.battleMode || 'garden'}`
            : 'rest/curiosity | none | trust 0 fear 0 | garden';
        const historyText = mlSummary?.history?.length
            ? mlSummary.history.slice(0, 2).map(entry => entry.compact).join(' || ')
            : 'No decision changes yet';
        return [
            { label: 'ML', value: traceText, maxLines: 2 },
            { label: 'Path', value: pathText, maxLines: 2 },
            { label: 'Schema', value: schemaText, maxLines: 2 },
            { label: 'Feat', value: featureText, maxLines: 2 },
            { label: 'Space', value: spatialText, maxLines: 3 },
            { label: 'Soc', value: socialStateText, maxLines: 2 },
            { label: 'Field', value: fieldText, maxLines: 2 },
            { label: 'Lean', value: this.normalizePresentationText(leanText), maxLines: 2 },
            { label: 'Act', value: this.formatMlPolicyInspectText(mlSummary?.policies?.action, 'none'), maxLines: 2 },
            { label: 'Target', value: this.formatMlPolicyInspectText(mlSummary?.policies?.target, 'none'), maxLines: 2 },
            { label: 'Signal', value: this.formatMlPolicyInspectText(mlSummary?.policies?.signal, 'quiet'), maxLines: 2 },
            { label: 'Risk', value: this.formatMlPolicyInspectText(mlSummary?.policies?.risk, 'observe'), maxLines: 2 },
            { label: 'BPost', value: this.formatMlPolicyInspectText(mlSummary?.policies?.battle, 'stabilize'), maxLines: 2 },
            { label: 'Why', value: whyText, maxLines: 2 },
            { label: 'Ctx', value: contextText, maxLines: 2 },
            { label: 'History', value: historyText, maxLines: 3 }
        ];
    }

    getFocusedDoorwayButtons(gameState) {
        return [];
    }

    getDoorwayGlyph(direction = 'right') {
        const glyphs = {
            left: '<',
            right: '>',
            up: '^',
            down: 'v'
        };
        return glyphs[direction] || '>';
    }

    drawDoorwayTravelButtons(graphics, gameState) {
        const buttons = this.getFocusedDoorwayButtons(gameState);
        if (!buttons.length) return;

        const highContrast = this.accessibilitySettings.highContrastUI;
        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(10);

        for (const button of buttons) {
            graphics.fill(...(highContrast ? [0, 0, 0, 246] : [20, 24, 30, 208]));
            graphics.stroke(...(highContrast ? [255, 255, 255, 255] : [244, 236, 206, 170]));
            graphics.strokeWeight(highContrast ? 2 : 1.5);
            graphics.rect(button.x - button.width / 2, button.y - button.height / 2, button.width, button.height, 8);

            graphics.noStroke();
            graphics.fill(255);
            graphics.text(this.getDoorwayGlyph(button.direction), button.x, button.y + 1);
        }

        graphics.pop();
    }

    drawDoorwayOccluders(graphics, gameState) {
        const buttons = this.getFocusedDoorwayButtons(gameState);
        if (!buttons.length || gameState?.viewMode === 'overview') return;

        const highContrast = this.accessibilitySettings.highContrastUI;
        graphics.push();
        graphics.noStroke();

        for (const button of buttons) {
            const stoneFill = highContrast ? [0, 0, 0, 232] : [38, 34, 28, 112];
            const glowFill = highContrast ? [255, 255, 255, 48] : [226, 212, 174, 34];
            graphics.fill(...glowFill);
            graphics.ellipse(button.x, button.y + 10, 54, 26);

            graphics.fill(...stoneFill);
            if (button.direction === 'left' || button.direction === 'right') {
                const side = button.direction === 'left' ? -1 : 1;
                graphics.rect(button.x - 14, button.y - 30, 12, 54, 6);
                graphics.arc(button.x - 8 + (side * 6), button.y - 4, 34, 48, PI + HALF_PI, TWO_PI + HALF_PI, CHORD);
            } else {
                graphics.rect(button.x - 18, button.y - 14, 36, 12, 6);
                graphics.arc(button.x, button.y - 8, 40, 34, PI, TWO_PI, CHORD);
            }
        }

        graphics.pop();
    }

    toggleOverviewMode() {
        const zones = this.getZoneList();
        if (zones.length <= 1) {
            const fallbackZoneId =
                (typeof gameCore !== 'undefined' && gameCore.getGameState?.().focusedZoneId) ||
                zones[0]?.id ||
                'ivy-cloister';
            return fallbackZoneId ? !!gameCore?.focusZone?.(fallbackZoneId) : false;
        }
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return false;
        if (Date.now() < this.zoneSwitchCooldownUntilMs) return false;
        const gameState = gameCore.getGameState?.() || {};
        if (gameState.viewMode === 'overview') {
            const fallbackZoneId = gameState.focusedZoneId || this.getZoneList()?.[0]?.id;
            this.zoneSwitchCooldownUntilMs = Date.now() + this.zoneSwitchCooldownMs;
            return fallbackZoneId ? !!gameCore.focusZone?.(fallbackZoneId) : false;
        }
        this.zoneSwitchCooldownUntilMs = Date.now() + this.zoneSwitchCooldownMs;
        gameCore.setViewMode?.('overview');
        return true;
    }

    openBattleSetupFromJournal() {
        const gameState = gameCore?.getGameState?.() || gameCore?.gameState || null;
        if (!gameState) return false;
        this.battleSetupPanel.visible = true;
        this.inspectPanel.visible = false;
        this.accessibilityPanel.visible = false;
        return true;
    }

    toggleBattleSetup() {
        const gameState = gameCore?.getGameState?.() || gameCore?.gameState || null;
        if (!gameState) return false;
        if (gameState.viewMode === 'battle') {
            return true;
        }
        this.battleSetupPanel.visible = !this.battleSetupPanel.visible;
        if (this.battleSetupPanel.visible) {
            this.inspectPanel.visible = false;
            this.accessibilityPanel.visible = false;
        }
        return true;
    }

    focusAdjacentZone(direction = 1) {
        const zones = this.getZoneList();
        if (!zones.length || typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return false;
        if (zones.length === 1) {
            return false;
        }
        if (Date.now() < this.zoneSwitchCooldownUntilMs) return false;

        const currentFocusedZoneId = gameCore.getGameState?.().focusedZoneId || zones[0].id;
        const currentIndex = Math.max(0, zones.findIndex(zone => zone.id === currentFocusedZoneId));
        const nextIndex = (currentIndex + direction + zones.length) % zones.length;
        this.zoneSwitchCooldownUntilMs = Date.now() + this.zoneSwitchCooldownMs;
        return !!gameCore.focusZone?.(zones[nextIndex].id);
    }

    focusZoneByIndex(index) {
        const zones = this.getZoneList();
        if (!zones.length || index < 0 || index >= zones.length) return false;
        return !!gameCore.focusZone?.(zones[index].id);
    }

    resolveScreenToCanvas(mouseX, mouseY) {
        return {
            x: mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth),
            y: mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight)
        };
    }

    isInsideRect(point, rect) {
        return point.x >= rect.x &&
            point.x <= rect.x + rect.width &&
            point.y >= rect.y &&
            point.y <= rect.y + rect.height;
    }

    findButterflyNearPoint(gameState, x, y, maxDistance = 28) {
        const butterflies = gameState?.butterflies || [];
        let closest = null;
        let closestDistance = maxDistance;

        for (const butterfly of butterflies) {
            const distance = butterfly.distanceTo(x, y);
            if (distance < closestDistance) {
                closest = butterfly;
                closestDistance = distance;
            }
        }

        return closest;
    }

    getLockedInspectTarget(gameState) {
        const lockedTargetId = this.inspectPanel.lockedTargetId;
        if (!lockedTargetId) return null;
        return (gameState?.butterflies || []).find(butterfly => butterfly.id === lockedTargetId) || null;
    }

    getInspectTargetById(targetId, gameState = null) {
        if (!targetId) return null;
        const state = gameState || gameCore?.gameState || null;
        return (state?.butterflies || []).find(butterfly => butterfly?.id === targetId) || null;
    }

    scheduleCreatureCloseupBakeEviction() {
        if (gameConfig?.rendering?.creatureBakeEvictOnInspectClose === false) return;
        const clearTimer = typeof clearTimeout === 'function' ? clearTimeout : null;
        const setTimer = typeof setTimeout === 'function' ? setTimeout : null;
        if (!setTimer) return;
        if (this.creatureCloseupBakeEvictTimer && clearTimer) {
            clearTimer(this.creatureCloseupBakeEvictTimer);
        }
        this.creatureCloseupBakeEvictTimer = setTimer(() => {
            this.creatureCloseupBakeEvictTimer = null;
            if (this.inspectPanel?.lockedTargetId) return;
            spriteManager?.evictCreatureCloseupBakes?.();
        }, 250);
    }

    setInspectLockedTargetId(targetId = null, { scheduleCloseupEvict = true, gameState = null } = {}) {
        const previousTargetId = this.inspectPanel.lockedTargetId || null;
        this.inspectPanel.lockedTargetId = targetId || null;
        if (previousTargetId && previousTargetId !== this.inspectPanel.lockedTargetId) {
            const previousTarget = this.getInspectTargetById(previousTargetId, gameState);
            if (previousTarget) {
                previousTarget.inspectOpenedAtFrame = null;
            }
        }
        if (previousTargetId && !this.inspectPanel.lockedTargetId && scheduleCloseupEvict) {
            this.scheduleCreatureCloseupBakeEviction();
        }
    }

    getMateHoverTarget(gameState) {
        return null;
    }

    isExplicitGuidanceActiveFor(entityId) {
        return false;
    }

    isMateModeActiveFor(entityId = null) {
        if (!this.inspectControl.mateSourceId) return false;
        return entityId ? this.inspectControl.mateSourceId === entityId : true;
    }

    isInspectReleaseModeActive() {
        return !!this.inspectControl.releaseMode;
    }

    getInspectMateButtonRect() {
        const panel = this.inspectPanel;
        const uiScale = this.getEffectiveUiScale();
        return {
            x: panel.x + panel.width - Math.round(34 * uiScale),
            y: panel.y + 8,
            width: Math.round(28 * uiScale),
            height: Math.round(14 * uiScale)
        };
    }

    getInspectRosterButtonRect() {
        const panel = this.inspectPanel;
        const uiScale = this.getEffectiveUiScale();
        return {
            x: panel.x + panel.width - Math.round(74 * uiScale),
            y: panel.y + 8,
            width: Math.round(36 * uiScale),
            height: Math.round(14 * uiScale)
        };
    }

    getInspectListButtonRect() {
        const panel = this.inspectPanel;
        const uiScale = this.getEffectiveUiScale();
        return {
            x: panel.x + panel.width - Math.round(146 * uiScale),
            y: panel.y + 8,
            width: Math.round(30 * uiScale),
            height: Math.round(14 * uiScale)
        };
    }

    getInspectAllButtonRect() {
        const panel = this.inspectPanel;
        const uiScale = this.getEffectiveUiScale();
        return {
            x: panel.x + panel.width - Math.round(178 * uiScale),
            y: panel.y + 8,
            width: Math.round(30 * uiScale),
            height: Math.round(14 * uiScale)
        };
    }

    getInspectReleaseButtonRect() {
        const panel = this.inspectPanel;
        const uiScale = this.getEffectiveUiScale();
        return {
            x: panel.x + panel.width - Math.round(114 * uiScale),
            y: panel.y + 8,
            width: Math.round(36 * uiScale),
            height: Math.round(14 * uiScale)
        };
    }

    getInspectPanelRect() {
        return {
            x: this.inspectPanel.x,
            y: this.inspectPanel.y,
            width: this.inspectPanel.width,
            height: this.inspectPanel.height
        };
    }

    getEntityZoneId(entity, fallback = null) {
        if (!entity) return fallback;
        if (typeof gameCore !== 'undefined' && typeof gameCore.getEntityZoneId === 'function') {
            return gameCore.getEntityZoneId(entity, fallback);
        }
        return entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || fallback;
    }

    getInspectButterflyTitle(butterfly) {
        if (!butterfly) return 'Butterfly';
        const label = butterfly.getDisplayName?.() || butterfly.displayName || butterfly.personalityType || `Butterfly ${butterfly.id}`;
        return `${label} (${butterfly.sex || '?'})`;
    }

    getInspectBrowseEntries(gameState) {
        const focusedZoneId = gameState?.focusedZoneId || null;
        const browseAll = this.inspectControl.browseScope === 'all';
        const butterflies = (gameState?.butterflies || [])
            .filter(butterfly => browseAll || this.getEntityZoneId(butterfly, null) === focusedZoneId)
            .sort((left, right) => {
                const leftZone = this.getZoneDisplayName(this.getEntityZoneId(left, null)).toLowerCase();
                const rightZone = this.getZoneDisplayName(this.getEntityZoneId(right, null)).toLowerCase();
                if (leftZone !== rightZone) return leftZone.localeCompare(rightZone);
                const leftSex = left.sex || 'Z';
                const rightSex = right.sex || 'Z';
                if (leftSex !== rightSex) return leftSex.localeCompare(rightSex);
                const leftLabel = (left.getDisplayName?.() || left.displayName || left.personalityType || `${left.id}`).toLowerCase();
                const rightLabel = (right.getDisplayName?.() || right.displayName || right.personalityType || `${right.id}`).toLowerCase();
                if (leftLabel !== rightLabel) return leftLabel.localeCompare(rightLabel);
                return (left.id || 0) - (right.id || 0);
            });

        return butterflies.map(butterfly => ({
            id: butterfly.id,
            butterfly,
            title: this.getInspectButterflyTitle(butterfly),
            subtitle: [
                browseAll ? this.getZoneDisplayName(this.getEntityZoneId(butterfly, focusedZoneId)) : null,
                butterfly.personalityType || butterfly.birthSource || 'wild',
                butterfly.state || 'normal',
                butterfly.birthSource || 'wild'
            ].filter(Boolean).join(' | ')
        }));
    }

    getInspectReleaseEntries(gameState) {
        const focusedZoneId = gameState?.focusedZoneId || null;
        const selectedIds = this.inspectControl.releaseSelectionIds || new Set();
        return (gameState?.butterflies || [])
            .filter(butterfly => this.getEntityZoneId(butterfly, null) === focusedZoneId)
            .filter(butterfly => progressionManager?.isReleasableHybrid?.(butterfly))
            .sort((left, right) => this.getInspectButterflyTitle(left).localeCompare(this.getInspectButterflyTitle(right)))
            .map(butterfly => {
                const releaseEcology = progressionManager?.getReleaseEcologyContext?.(gameState, butterfly) || null;
                const lineageText = (releaseEcology?.releaseLineages || []).slice(0, 2).join(' + ') || (butterfly.personalityType || 'hybrid');
                return {
                    id: butterfly.id,
                    butterfly,
                    checked: selectedIds.has(butterfly.id),
                    title: this.getInspectButterflyTitle(butterfly),
                    subtitle: `${this.getZoneDisplayName(focusedZoneId)} | ${lineageText} | batch ${releaseEcology?.batchCount || 0}/10 | releasable hybrid`
                };
            });
    }

    getInspectMatePair(source, candidate) {
        if (!source?.id || !candidate?.id || source.id === candidate.id) {
            return { female: null, male: null };
        }
        return {
            female: source.sex === 'F' ? source : candidate.sex === 'F' ? candidate : null,
            male: source.sex === 'M' ? source : candidate.sex === 'M' ? candidate : null
        };
    }

    canInspectMateWith(source, candidate, gameState) {
        if (!source?.id || !candidate?.id || source.id === candidate.id) return false;
        if (typeof breedingSystem === 'undefined') return false;

        const { female, male } = this.getInspectMatePair(source, candidate);
        if (!female || !male) return false;

        const targetZoneId = this.getEntityZoneId(candidate, this.getEntityZoneId(source, null));
        const canUseFemale = (butterfly) => {
            if (!butterfly || butterfly.sex !== 'F') return false;
            if (butterfly.state !== 'normal') return false;
            if (butterfly.isSpawning || butterfly.zoneTravel) return false;
            if (butterfly.pregnancy?.active) return false;
            if (butterfly.breeding?.partnerId) return false;
            if (!breedingSystem.canReproduce?.(butterfly)) return false;
            return true;
        };
        const canUseMale = (butterfly) => {
            if (!butterfly || butterfly.sex !== 'M') return false;
            if (butterfly.state !== 'normal') return false;
            if (butterfly.pheromoneCooldownUntil > frameCount) return false;
            if (butterfly.isSpawning || butterfly.zoneTravel) return false;
            if (butterfly.pregnancy?.active) return false;
            if (butterfly.breeding?.partnerId) return false;
            if (!breedingSystem.canReproduce?.(butterfly)) return false;
            return true;
        };

        if (!canUseFemale(female) || !canUseMale(male)) return false;
        if (!progressionManager?.isPairAllowedForProgression?.(gameState, female, male)) return false;
        if (typeof breedingSystem.canZoneSupportOffspring === 'function' && !breedingSystem.canZoneSupportOffspring(targetZoneId, gameState)) {
            return false;
        }
        return true;
    }

    getInspectMateEntries(gameState, source) {
        if (!source?.id) return [];
        const focusedZoneId = gameState?.focusedZoneId || null;
        const zoneOrder = new Map(this.getZoneList().map((zone, index) => [zone.id, index]));
        return (gameState?.butterflies || [])
            .filter(candidate => this.canInspectMateWith(source, candidate, gameState))
            .sort((left, right) => {
                const leftZoneId = this.getEntityZoneId(left, null);
                const rightZoneId = this.getEntityZoneId(right, null);
                const leftLocal = leftZoneId === focusedZoneId ? 0 : 1;
                const rightLocal = rightZoneId === focusedZoneId ? 0 : 1;
                if (leftLocal !== rightLocal) return leftLocal - rightLocal;
                const leftZoneOrder = zoneOrder.get(leftZoneId) ?? 999;
                const rightZoneOrder = zoneOrder.get(rightZoneId) ?? 999;
                if (leftZoneOrder !== rightZoneOrder) return leftZoneOrder - rightZoneOrder;
                return this.getInspectButterflyTitle(left).localeCompare(this.getInspectButterflyTitle(right));
            })
            .map(candidate => {
                const zoneId = this.getEntityZoneId(candidate, null);
                const zoneName = this.getZoneDisplayName(zoneId);
                return {
                    id: candidate.id,
                    butterfly: candidate,
                    title: this.getInspectButterflyTitle(candidate),
                    subtitle: `${zoneName} | ${candidate.personalityType || candidate.birthSource || 'wild'} | ${zoneId === this.getEntityZoneId(source, null) ? 'same zone' : 'doorway trip'}`
                };
            });
    }

    getActiveInspectEntries(gameState) {
        if (this.isInspectReleaseModeActive()) {
            return this.getInspectReleaseEntries(gameState);
        }
        const target = this.getLockedInspectTarget(gameState);
        if (target?.id && this.isMateModeActiveFor(target.id)) {
            return this.getInspectMateEntries(gameState, target);
        }
        if (!target) {
            return this.getInspectBrowseEntries(gameState);
        }
        return [];
    }

    releaseGuidedButterfly(gameState, butterflyId = this.inspectControl.guidedTargetId) {
        if (this.inspectControl.guidedTargetId === butterflyId) {
            this.inspectControl.guidedTargetId = null;
        }
    }

    clearInspectReleaseMode() {
        this.inspectControl.releaseMode = false;
        this.inspectControl.releaseSelectionIds = new Set();
        this.inspectPanel.releaseOptionRects = [];
    }

    cancelInspectReleaseMode() {
        this.clearInspectReleaseMode();
        this.inspectPanel.scrollOffset = 0;
    }

    enterInspectReleaseMode(gameState) {
        this.clearInspectSelection(gameState, { keepReleaseMode: true });
        this.inspectControl.releaseMode = true;
        this.inspectControl.releaseSelectionIds = new Set();
        this.inspectPanel.scrollOffset = 0;
        return true;
    }

    toggleInspectReleaseSelection(butterflyId) {
        if (!butterflyId) return false;
        if (!this.inspectControl.releaseSelectionIds) {
            this.inspectControl.releaseSelectionIds = new Set();
        }
        if (this.inspectControl.releaseSelectionIds.has(butterflyId)) {
            this.inspectControl.releaseSelectionIds.delete(butterflyId);
        } else {
            this.inspectControl.releaseSelectionIds.add(butterflyId);
        }
        return true;
    }

    confirmInspectReleaseSelection(gameState) {
        const selectedIds = Array.from(this.inspectControl.releaseSelectionIds || []);
        if (!selectedIds.length) {
            return true;
        }
        const zoneId = gameState?.focusedZoneId || null;
        const result = gameCore?.releaseButterflies?.(selectedIds, { zoneId }) || { releasedIds: [] };
        this.clearInspectReleaseMode();
        if ((result.releasedIds || []).includes(this.inspectPanel.lockedTargetId)) {
            this.setInspectLockedTargetId(null);
        }
        this.inspectPanel.scrollOffset = 0;
        return (result.releasedIds || []).length > 0;
    }

    clearInspectSelection(gameState, { keepGuidance = false, keepReleaseMode = false } = {}) {
        this.releaseGuidedButterfly(gameState);
        this.inspectControl.mateSourceId = null;
        this.inspectControl.lockedBrowseScope = this.inspectControl.browseScope || 'zone';
        this.setInspectLockedTargetId(null, { gameState });
        this.inspectPanel.scrollOffset = 0;
        this.inspectPanel.selectionRects = [];
        this.inspectPanel.mateOptionRects = [];
        this.inspectPanel.releaseOptionRects = [];
        if (!keepReleaseMode) {
            this.clearInspectReleaseMode();
        }
    }

    beginGuidingButterfly(target, gameState) {
        if (!target?.id) return false;
        this.setInspectLockedTargetId(target.id, { gameState });
        const openedFrame = Number(
            gameCore?.getCurrentFrame?.()
            ?? gameState?.currentFrame
            ?? (typeof frameCount !== 'undefined' ? frameCount : 0)
            ?? 0
        );
        target.inspectOpenedAtFrame = Number.isFinite(openedFrame) ? openedFrame : 0;
        spriteManager?.scheduleAsyncCreatureCloseupBake?.(target, {
            currentFrame: target.inspectOpenedAtFrame
        });
        this.inspectControl.lockedBrowseScope = this.inspectControl.browseScope || 'zone';
        this.inspectControl.guidedTargetId = null;
        this.inspectPanel.scrollOffset = 0;
        return true;
    }

    tryStartMateFromInspect(gameState, source, candidate) {
        if (!this.canInspectMateWith(source, candidate, gameState)) return false;
        const { female, male } = this.getInspectMatePair(source, candidate);
        if (!female || !male) return false;

        if (typeof breedingSystem.requestMatePair === 'function') {
            breedingSystem.requestMatePair(source, candidate, gameState);
        } else {
            source.breeding = source.breeding || {};
            candidate.breeding = candidate.breeding || {};
            source.breeding.requestedMateId = candidate.id;
            candidate.breeding.requestedMateId = source.id;
        }

        const sourceZoneId = this.getEntityZoneId(source, null);
        const targetZoneId = this.getEntityZoneId(candidate, sourceZoneId);
        this.inspectControl.mateSourceId = null;
        this.inspectControl.guidedTargetId = null;
        this.inspectPanel.scrollOffset = 0;

        if (sourceZoneId && targetZoneId && sourceZoneId !== targetZoneId) {
            const startedTravel = !!gameCore?.startZoneTravel?.(source, targetZoneId, 'inspect-mate', {
                arrivalTargetEntityId: candidate.id
            });
            if (!startedTravel && typeof breedingSystem.clearRequestedMate === 'function') {
                breedingSystem.clearRequestedMate(source, gameState);
            }
            return startedTravel;
        }

        const distance = Math.hypot((source.x || 0) - (candidate.x || 0), (source.y || 0) - (candidate.y || 0));
        if (distance <= (breedingSystem.matingDistance || 18)) {
            breedingSystem.startMating(female, male);
        }
        return true;
    }

    updateInspectGuidance(gameState) {
        if (!gameState || !this.inspectControl.guidedTargetId) return;
        this.releaseGuidedButterfly(gameState, this.inspectControl.guidedTargetId);
    }

    drawMateHoverHighlight(graphics, gameState) {
        return;
    }

    drawInspectChoiceList(graphics, {
        panel,
        title,
        statusLabel,
        entries,
        entryRectsKey,
        checklist = false,
        emptyLines = [],
        highContrast = false,
        compactScale = 1,
        panelFill = [14, 18, 22, 198],
        strokeColor = [210, 228, 255, 120]
    } = {}) {
        const titleColor = [255, 255, 255, 255];
        const hintColor = highContrast ? [255, 255, 255, 255] : [180, 188, 202, 255];
        const subtitleColor = highContrast ? [230, 230, 230, 255] : [194, 206, 220, 255];
        const rowFill = highContrast ? [0, 0, 0, 255] : [36, 44, 56, 214];
        const rowStroke = highContrast ? [255, 255, 255, 255] : [210, 228, 255, 64];
        const rowTop = panel.y + 26;
        const rowHeight = Math.max(17, Math.round(22 * compactScale));
        const footerPad = Math.max(8, Math.round(10 * compactScale));
        const availableHeight = Math.max(rowHeight, panel.height - (rowTop - panel.y) - footerPad);
        const visibleCount = Math.max(1, Math.floor(availableHeight / rowHeight));
        const maxScroll = Math.max(0, (entries?.length || 0) - visibleCount);
        panel.scrollOffset = Math.max(0, Math.min(panel.scrollOffset || 0, maxScroll));
        panel[entryRectsKey] = [];

        graphics.push();
        graphics.fill(...panelFill);
        graphics.stroke(...strokeColor);
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.rect(panel.x, panel.y, panel.width, panel.height, 8);

        graphics.noStroke();
        graphics.fill(...titleColor);
        graphics.textAlign(LEFT, TOP);
        graphics.textStyle(BOLD);
        graphics.textSize(Math.max(9, Math.round((highContrast ? 13 : 11) * compactScale)));
        graphics.text(title, Math.round(panel.x + 8), Math.round(panel.y + 8));
        graphics.textStyle(NORMAL);
        graphics.textAlign(RIGHT, TOP);
        graphics.fill(...hintColor);
        graphics.textSize(Math.max(6, Math.round(7 * compactScale)));
        graphics.text(statusLabel, panel.x + panel.width - 8, panel.y + 8);
        graphics.textAlign(LEFT, TOP);

        if (!(entries?.length)) {
            let y = rowTop + 2;
            graphics.fill(...subtitleColor);
            graphics.textSize(Math.max(7, Math.round(7.4 * compactScale)));
            for (const line of emptyLines) {
                graphics.text(line, panel.x + 8, y);
                y += Math.max(9, Math.round(10 * compactScale));
            }
            graphics.pop();
            return;
        }

        const startIndex = panel.scrollOffset || 0;
        const visibleEntries = entries.slice(startIndex, startIndex + visibleCount);
        const checkboxPad = checklist ? Math.max(12, Math.round(14 * compactScale)) : 0;
        const textWidth = panel.width - 20 - checkboxPad;
        for (let index = 0; index < visibleEntries.length; index += 1) {
            const entry = visibleEntries[index];
            const y = rowTop + (index * rowHeight);
            const rect = {
                x: panel.x + 6,
                y,
                width: panel.width - 12,
                height: rowHeight - 2,
                butterflyId: entry.id
            };
            panel[entryRectsKey].push(rect);

            graphics.fill(...rowFill);
            graphics.stroke(...rowStroke);
            graphics.strokeWeight(highContrast ? 2 : 1);
            graphics.rect(rect.x, rect.y, rect.width, rect.height, 6);
            graphics.noStroke();

            const textX = rect.x + 6 + checkboxPad;
            if (checklist) {
                const boxSize = Math.max(7, Math.round(8 * compactScale));
                const boxX = rect.x + 6;
                const boxY = rect.y + Math.max(3, Math.round((rect.height - boxSize) / 2));
                graphics.stroke(...(highContrast ? [255, 255, 255, 255] : [220, 235, 255, 180]));
                graphics.strokeWeight(highContrast ? 2 : 1);
                graphics.noFill();
                graphics.rect(boxX, boxY, boxSize, boxSize, 2);
                if (entry.checked) {
                    graphics.noStroke();
                    graphics.fill(...titleColor);
                    graphics.textAlign(CENTER, CENTER);
                    graphics.textSize(Math.max(6, Math.round(6.4 * compactScale)));
                    graphics.text('X', boxX + boxSize / 2, boxY + boxSize / 2 + 1);
                    graphics.textAlign(LEFT, TOP);
                }
                graphics.noStroke();
            }

            graphics.fill(...titleColor);
            graphics.textAlign(LEFT, TOP);
            graphics.textSize(Math.max(7, Math.round(7.6 * compactScale)));
            graphics.text(this.truncateText(graphics, entry.title, textWidth), textX, rect.y + 3);

            graphics.fill(...subtitleColor);
            graphics.textSize(Math.max(6, Math.round(6.5 * compactScale)));
            graphics.text(this.truncateText(graphics, entry.subtitle, textWidth), textX, rect.y + Math.max(9, Math.round(10 * compactScale)));
        }

        if (maxScroll > 0) {
            graphics.fill(...hintColor);
            graphics.textAlign(RIGHT, BOTTOM);
            graphics.textSize(Math.max(6, Math.round(6.2 * compactScale)));
            graphics.text(`Scroll ${panel.scrollOffset + 1}/${maxScroll + 1}`, panel.x + panel.width - 8, panel.y + panel.height - 6);
        }
        graphics.pop();
    }

    focusZoneAtCanvasPoint(point) {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.() || typeof zoneSystem === 'undefined') {
            return false;
        }

        if (typeof renderManager !== 'undefined' && renderManager.getOverviewZoneAtPoint) {
            const overviewZone = renderManager.getOverviewZoneAtPoint(point);
            if (overviewZone?.id) {
                return !!gameCore.focusZone?.(overviewZone.id);
            }
        }

        if (typeof gridManager === 'undefined') {
            return false;
        }

        const boardPos = typeof renderManager !== 'undefined' && renderManager.screenToBoard
            ? renderManager.screenToBoard(point.x, point.y, gameCore.getFocusedZoneId?.() || null, 0)
            : null;
        const zone = boardPos
            ? zoneSystem.getZoneAtBoard?.(boardPos)
            : null;
        if (!zone?.id) return false;
        return !!gameCore.focusZone?.(zone.id);
    }

    handleMousePressed(mouseX, mouseY, gameState) {
        if (!this.initialized) return false;
        this.syncPanelLayouts(gameState);
        const point = this.resolveScreenToCanvas(mouseX, mouseY);

        if (this.firstSessionGuide.visible && this.firstSessionGuide.dismissRect && this.isInsideRect(point, this.firstSessionGuide.dismissRect)) {
            this.dismissFirstSessionGuide(true);
            return true;
        }

        for (const button of this.getVisiblePlayerButtons()) {
            if (!this.isInsideRect(point, button)) continue;
            return this.activatePlayerButton(button.id, gameState);
        }

        if (this.inspectPanel.visible) {
            const panelRect = this.getInspectPanelRect();
            const allButton = this.getInspectAllButtonRect();
            const mateButton = this.getInspectMateButtonRect();
            const rosterButton = this.getInspectRosterButtonRect();
            const listButton = this.getInspectListButtonRect();
            const releaseButton = this.getInspectReleaseButtonRect();
            const lockedTarget = this.getLockedInspectTarget(gameState);
            if (!this.isInspectReleaseModeActive() && this.isInsideRect(point, allButton)) {
                this.inspectControl.browseScope = this.inspectControl.browseScope === 'all' ? 'zone' : 'all';
                this.clearInspectSelection(gameState, { keepReleaseMode: false });
                return true;
            }
            if (this.isInsideRect(point, releaseButton)) {
                return this.isInspectReleaseModeActive()
                    ? this.confirmInspectReleaseSelection(gameState)
                    : this.enterInspectReleaseMode(gameState);
            }
            if (this.isInspectReleaseModeActive() && this.isInsideRect(point, listButton)) {
                this.cancelInspectReleaseMode();
                return true;
            }
            if (!this.isInspectReleaseModeActive() && lockedTarget && this.isInsideRect(point, listButton)) {
                this.clearInspectSelection(gameState);
                return true;
            }
            if (!this.isInspectReleaseModeActive() && lockedTarget && this.isInsideRect(point, mateButton)) {
                this.inspectControl.mateSourceId = this.isMateModeActiveFor(lockedTarget.id) ? null : lockedTarget.id;
                this.inspectPanel.scrollOffset = 0;
                return true;
            }
            if (!this.isInspectReleaseModeActive() && lockedTarget && this.isInsideRect(point, rosterButton)) {
                return !!rosterSystem?.toggleMember?.(lockedTarget.id, gameState);
            }

            if (this.isInspectReleaseModeActive()) {
                for (const rect of this.inspectPanel.releaseOptionRects || []) {
                    if (!this.isInsideRect(point, rect)) continue;
                    return this.toggleInspectReleaseSelection(rect.butterflyId);
                }
            } else if (!lockedTarget) {
                for (const rect of this.inspectPanel.selectionRects || []) {
                    if (!this.isInsideRect(point, rect)) continue;
                    const butterfly = (gameState?.butterflies || []).find(entry => entry.id === rect.butterflyId) || null;
                    if (!butterfly) return true;
                    this.beginGuidingButterfly(butterfly, gameState);
                    return true;
                }
            }

            if (!this.isInspectReleaseModeActive() && lockedTarget && this.isMateModeActiveFor(lockedTarget.id)) {
                for (const rect of this.inspectPanel.mateOptionRects || []) {
                    if (!this.isInsideRect(point, rect)) continue;
                    const candidate = (gameState?.butterflies || []).find(entry => entry.id === rect.butterflyId) || null;
                    return this.tryStartMateFromInspect(gameState, lockedTarget, candidate);
                }
            }

            if (this.isInsideRect(point, panelRect)) {
                return true;
            }
        }

        if (gameState?.viewMode === 'overview' && typeof renderManager !== 'undefined' && renderManager.getOverviewCloseButtonRect) {
            const closeRect = renderManager.getOverviewCloseButtonRect();
            if (closeRect && this.isInsideRect(point, closeRect)) {
                return this.toggleOverviewMode();
            }
        }

        if (this.battleSetupPanel.visible && gameState?.viewMode !== 'battle') {
            if (this.handleBattleSetupMousePressed(point, gameState)) {
                return true;
            }
        }

        if (gameState?.viewMode === 'battle') {
            return this.handleBattleHudMousePressed(point, gameState);
        }

        for (const doorwayButton of this.getFocusedDoorwayButtons(gameState)) {
            const rect = {
                x: doorwayButton.x - doorwayButton.width / 2,
                y: doorwayButton.y - doorwayButton.height / 2,
                width: doorwayButton.width,
                height: doorwayButton.height
            };
            if (this.isInsideRect(point, rect)) {
                return !!gameCore?.focusZone?.(doorwayButton.targetZoneId);
            }
        }

        if (gameState?.viewMode === 'overview' && this.getZoneList().length > 1) {
            if (this.focusZoneAtCanvasPoint(point)) {
                return true;
            }
        }

        if (this.accessibilityPanel.visible) {
            for (const control of this.getAccessibilityControlButtons()) {
                if (!this.isInsideRect(point, control)) continue;
                return this.activateAccessibilityControl(control.id);
            }
            if (this.isInsideRect(point, this.getAccessibilitySliderRect())) {
                this.setUiScaleFromCanvasX(point.x);
                return true;
            }
        }

        if (this.activityLogPanel.visible) {
            for (const button of this.getFeedFilterButtons()) {
                if (!this.isInsideRect(point, button)) continue;
                this.activityLogPanel.filters[button.id] = !this.activityLogPanel.filters[button.id];
                this.activityLogPanel.scrollOffset = 0;
                if (this.activityLogPanel.followLatest) {
                    this.activityLogPanel.frozenEntries = null;
                }
                return true;
            }
            if (!this.activityLogPanel.followLatest && this.isInsideRect(point, this.getFeedResumeButtonRect())) {
                this.resumeLatestFeedView();
                return true;
            }
        }

        if (this.inspectPanel.visible) {
            return true;
        }

        return false;
    }

    handleMouseWheel(mouseX, mouseY, delta, gameState) {
        if (!this.initialized) return false;
        this.syncPanelLayouts(gameState);

        if (gameState?.viewMode === 'battle') {
            return false;
        }

        const point = this.resolveScreenToCanvas(mouseX, mouseY);
        if (this.isFirstSessionGuideRenderable(gameState)
            && this.isInsideRect(point, this.getGuidePanelRect())) {
            return true;
        }

        if (this.butterflyCollection?.handleMouseWheel?.(point.x, point.y, delta)) {
            return true;
        }

        if (this.activityLogPanel.visible) {
            const panelRect = {
                x: this.activityLogPanel.x,
                y: this.activityLogPanel.y,
                width: this.activityLogPanel.width,
                height: this.activityLogPanel.height
            };
            if (this.isInsideRect(point, panelRect)) {
                if (delta < 0) {
                    if (this.activityLogPanel.followLatest) {
                        this.activityLogPanel.followLatest = false;
                        this.activityLogPanel.frozenEntries = this.getRecentActivityEntries();
                    }
                    this.activityLogPanel.scrollOffset += 2;
                } else if (delta > 0) {
                    this.activityLogPanel.scrollOffset = Math.max(0, this.activityLogPanel.scrollOffset - 2);
                    if (this.activityLogPanel.scrollOffset === 0) {
                        this.resumeLatestFeedView();
                    }
                }
                return true;
            }
        }

        if (this.inspectPanel.visible && this.isInsideRect(point, this.getInspectPanelRect())) {
            const activeEntries = this.getActiveInspectEntries(gameState);
            if (activeEntries.length) {
                if (delta < 0) {
                    this.inspectPanel.scrollOffset += 1;
                } else if (delta > 0) {
                    this.inspectPanel.scrollOffset = Math.max(0, this.inspectPanel.scrollOffset - 1);
                }
                return true;
            }
            if (this.getLockedInspectTarget(gameState)) {
                if (delta < 0) {
                    this.inspectPanel.scrollOffset += 1;
                } else if (delta > 0) {
                    this.inspectPanel.scrollOffset = Math.max(0, this.inspectPanel.scrollOffset - 1);
                }
                return true;
            }
            return true;
        }

        if (this.accessibilityPanel.visible) {
            const slider = this.getAccessibilitySliderRect();
            const panelRect = this.getDomPanelRect(
                this.accessibilityPanel,
                (slider.y + slider.height + 14) - this.accessibilityPanel.y
            );
            if (this.isInsideRect(point, panelRect)) {
                return true;
            }
        }

        if (this.battleSetupPanel.visible
            && this.isInsideRect(point, this.getDomPanelRect(this.battleSetupPanel))) {
            return true;
        }

        return false;
    }

    resolveInspectTarget(gameState) {
        const lockedTargetId = this.inspectPanel.lockedTargetId;
        if (lockedTargetId) {
            const locked = (gameState.butterflies || []).find(butterfly => butterfly.id === lockedTargetId);
            if (locked?.id) {
                const lockScope = this.inspectControl.lockedBrowseScope || 'zone';
                const focusedZoneId = gameState?.focusedZoneId || null;
                const targetZoneId = this.getEntityZoneId(locked, null);
                if (lockScope !== 'all' && focusedZoneId && targetZoneId && targetZoneId !== focusedZoneId) {
                    this.clearInspectSelection(gameState);
                    return null;
                }
                return locked;
            }
            this.clearInspectSelection(gameState);
        }
        return null;
    }

    drawInspectActionButton(graphics, rect, label, {
        fill = [36, 44, 56, 214],
        textColor = [255, 255, 255, 255],
        highContrast = false,
        compactScale = 1
    } = {}) {
        graphics.stroke(...(highContrast ? [255, 255, 255, 255] : [210, 228, 255, 120]));
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.fill(...fill);
        graphics.rect(rect.x, rect.y, rect.width, rect.height, 6);
        graphics.noStroke();
        graphics.fill(...textColor);
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(Math.max(6, Math.round(6.2 * compactScale)));
        graphics.text(label, rect.x + rect.width / 2, rect.y + rect.height / 2 + 1);
        graphics.textAlign(LEFT, BASELINE);
    }

    getInspectSectionStyle(sectionId = 'default', highContrast = false) {
        if (highContrast) {
            return {
                fill: [0, 0, 0, 255],
                stroke: [255, 255, 255, 255],
                title: [255, 255, 255, 255],
                text: [255, 255, 255, 255]
            };
        }

        const palette = {
            current: {
                fill: [26, 42, 58, 228],
                stroke: [168, 208, 255, 112],
                title: [220, 238, 255, 255],
                text: [244, 248, 252, 255]
            },
            talk: {
                fill: [31, 50, 48, 228],
                stroke: [158, 220, 210, 112],
                title: [214, 244, 238, 255],
                text: [242, 248, 246, 255]
            },
            social: {
                fill: [37, 48, 35, 228],
                stroke: [188, 225, 176, 110],
                title: [226, 243, 216, 255],
                text: [245, 248, 240, 255]
            },
            battle: {
                fill: [57, 38, 32, 228],
                stroke: [238, 188, 156, 110],
                title: [255, 226, 200, 255],
                text: [250, 243, 236, 255]
            },
            lineage: {
                fill: [56, 48, 30, 228],
                stroke: [232, 212, 150, 104],
                title: [250, 238, 202, 255],
                text: [248, 244, 232, 255]
            },
            ecology: {
                fill: [39, 43, 53, 228],
                stroke: [190, 208, 235, 108],
                title: [226, 233, 248, 255],
                text: [241, 244, 250, 255]
            },
            debug: {
                fill: [44, 44, 44, 228],
                stroke: [214, 214, 214, 92],
                title: [240, 240, 240, 255],
                text: [242, 242, 242, 255]
            }
        };

        return palette[sectionId] || {
            fill: [34, 40, 50, 228],
            stroke: [206, 220, 242, 96],
            title: [232, 238, 246, 255],
            text: [244, 246, 250, 255]
        };
    }

    measureInspectSectionCard(graphics, section, width, compactScale = 1) {
        const titleSize = Math.max(6, Math.round(7 * compactScale));
        const textSize = Math.max(6, Math.round(6.3 * compactScale));
        const lineHeight = Math.max(9, Math.round(9 * compactScale));
        const textWidth = width - Math.round(16 * compactScale);
        const cacheKey = [
            'inspect',
            Math.round(width * 10) / 10,
            Math.round(compactScale * 100) / 100,
            section?.id || 'default',
            section?.title || '',
            section?.maxLinesPerItem || 2,
            Array.isArray(section?.lines) ? section.lines.map(line => `${line ?? ''}`.trim()).join('¦') : ''
        ].join('|');

        return this.readUiLayoutCache(this.inspectMeasurementCache, cacheKey, () => {
            const wrappedBlocks = [];

            graphics.textSize(textSize);
            for (const rawLine of section.lines || []) {
                const line = `${rawLine ?? ''}`.trim();
                if (!line) continue;
                wrappedBlocks.push(...this.wrapTextLines(graphics, line, textWidth, section.maxLinesPerItem || 2));
            }

            const height = Math.round(16 * compactScale)
                + Math.max(lineHeight, wrappedBlocks.length * lineHeight)
                + Math.round(8 * compactScale);

            return {
                titleSize,
                textSize,
                lineHeight,
                wrappedBlocks,
                height
            };
        }, 256);
    }

    drawInspectSectionCard(graphics, x, y, width, section, compactScale = 1, highContrast = false) {
        const style = this.getInspectSectionStyle(section.id, highContrast);
        const measurement = this.measureInspectSectionCard(graphics, section, width, compactScale);

        graphics.push();
        graphics.fill(...style.fill);
        graphics.stroke(...style.stroke);
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.rect(x, y, width, measurement.height, 7);
        graphics.noStroke();
        graphics.textAlign(LEFT, TOP);
        graphics.fill(...style.title);
        graphics.textSize(measurement.titleSize);
        graphics.textStyle(BOLD);
        graphics.text(section.title, x + Math.round(8 * compactScale), y + Math.round(5 * compactScale));
        graphics.textStyle(NORMAL);

        graphics.fill(...style.text);
        graphics.textSize(measurement.textSize);
        let lineY = y + Math.round(15 * compactScale);
        for (const line of measurement.wrappedBlocks) {
            graphics.text(line, x + Math.round(8 * compactScale), lineY);
            lineY += measurement.lineHeight;
        }
        graphics.pop();

        return measurement.height;
    }

    createFeedEntryShape({
        timeLabel = '',
        headline = '',
        detail = '',
        grounding = '',
        line = '',
        category = 'action',
        targetText = null,
        contextTags = [],
        threadLines = null,
        conversationId = null,
        pairModeLabel = null,
        pairTextureLabel = null,
        consequenceTail = null,
        threatSignalId = null,
        dangerMemoryId = null,
        safetyAvoidanceTrigger = null
    } = {}) {
        const normalizedCategory = this.normalizeFeedCategory(category);
        const groundedWarning = !!(threatSignalId || dangerMemoryId || safetyAvoidanceTrigger);
        return {
            timeLabel,
            headline,
            detail,
            grounding,
            line,
            category: normalizedCategory === 'warning' && !groundedWarning ? 'action' : normalizedCategory,
            targetText,
            contextTags,
            threadLines,
            conversationId,
            pairModeLabel,
            pairTextureLabel,
            consequenceTail,
            threatSignalId,
            dangerMemoryId,
            safetyAvoidanceTrigger
        };
    }

    normalizeFeedCategory(category = 'action') {
        const key = String(category || 'action').trim().toLowerCase();
        if (key === 'talk' || key === 'dialogue') return 'talk';
        if (['learn', 'teach', 'teaching', 'lesson', 'tutoring'].includes(key)) return 'learn';
        if (['warning', 'danger', 'threat'].includes(key)) return 'warning';
        if (['system', 'signal', 'signals', 'save'].includes(key)) return 'system';
        return 'action';
    }

    normalizeActivityLogFilters() {
        const previous = this.activityLogPanel.filters || {};
        this.activityLogPanel.filters = {
            talk: previous.talk !== false,
            action: (previous.action ?? previous.actions) !== false,
            learn: previous.learn !== false,
            warning: previous.warning !== false,
            system: previous.system !== false
        };
        return this.activityLogPanel.filters;
    }

    hasWarningGrounding(entry = {}) {
        return !!(entry?.threatSignalId || entry?.dangerMemoryId || entry?.safetyAvoidanceTrigger);
    }

    getFeedContextLabel(gameState, selectedTarget = null) {
        if (selectedTarget?.id) {
            const zoneId = selectedTarget.currentZoneId || selectedTarget.lifeSim?.lifecycle?.currentZoneId || gameState?.focusedZoneId || null;
            return `${this.getEntityDisplayName(selectedTarget, 'Butterfly')} • ${this.getZoneDisplayName(zoneId)}`;
        }
        if (gameState?.viewMode === 'battle') {
            return 'Battle feed';
        }
        return `${this.getZoneDisplayName(gameState?.focusedZoneId || null)} • live garden`;
    }

    getFeedCategoryStyle(category = 'action', highContrast = false) {
        const resolvedCategory = this.normalizeFeedCategory(category);
        if (highContrast) {
            return {
                cardFill: [0, 0, 0, 255],
                cardStroke: [255, 255, 255, 255],
                accent: [255, 255, 255, 255],
                filterFill: [255, 255, 255, 255],
                filterText: [0, 0, 0, 255],
                title: [255, 255, 255, 255],
                detail: [255, 255, 255, 255],
                meta: [255, 255, 255, 255]
            };
        }

        const byCategory = {
            talk: {
                cardFill: [20, 35, 28, 186],
                cardStroke: [118, 206, 150, 92],
                accent: [110, 224, 146, 255],
                filterFill: [86, 196, 124, 230],
                filterText: [10, 28, 16, 255],
                title: [236, 248, 241, 255],
                detail: [240, 247, 243, 255],
                meta: [170, 214, 186, 255]
            },
            learn: {
                cardFill: [43, 25, 40, 186],
                cardStroke: [238, 164, 214, 96],
                accent: [255, 156, 224, 255],
                filterFill: [244, 156, 220, 230],
                filterText: [38, 10, 30, 255],
                title: [253, 236, 248, 255],
                detail: [249, 240, 246, 255],
                meta: [228, 188, 214, 255]
            },
            action: {
                cardFill: [22, 31, 47, 188],
                cardStroke: [142, 182, 238, 92],
                accent: [120, 176, 255, 255],
                filterFill: [120, 176, 255, 230],
                filterText: [10, 18, 34, 255],
                title: [236, 244, 252, 255],
                detail: [242, 247, 252, 255],
                meta: [182, 204, 236, 255]
            },
            warning: {
                cardFill: [50, 36, 18, 190],
                cardStroke: [255, 190, 98, 110],
                accent: [255, 184, 78, 255],
                filterFill: [255, 184, 78, 230],
                filterText: [36, 22, 4, 255],
                title: [255, 246, 228, 255],
                detail: [255, 244, 222, 255],
                meta: [232, 197, 142, 255]
            },
            system: {
                cardFill: [32, 32, 38, 184],
                cardStroke: [176, 184, 196, 86],
                accent: [188, 198, 210, 255],
                filterFill: [188, 198, 210, 230],
                filterText: [18, 22, 28, 255],
                title: [244, 246, 248, 255],
                detail: [236, 240, 244, 255],
                meta: [196, 202, 212, 255]
            }
        };

        return byCategory[resolvedCategory] || byCategory.action;
    }

    getGraphicsTextStateKey(graphics) {
        const renderer = graphics?._renderer || null;
        const textSize = Number(renderer?._textSize || graphics?._textSize || 12);
        const textStyle = renderer?._textStyle || graphics?._textStyle || 'normal';
        return `${Math.round(textSize * 100) / 100}|${textStyle}`;
    }

    readUiLayoutCache(cache, key, buildValue, maxEntries = 800) {
        if (!gameConfig?.performance?.flags?.textMeasureCache) {
            return buildValue();
        }
        if (cache.has(key)) {
            const cached = cache.get(key);
            cache.delete(key);
            cache.set(key, cached);
            return cached;
        }

        const value = buildValue();
        cache.set(key, value);
        while (cache.size > maxEntries) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
        }
        return value;
    }

    measureTextWidth(graphics, value) {
        if (typeof textMeasureCache !== 'undefined' && textMeasureCache?.measure) {
            return textMeasureCache.measure(graphics, value);
        }
        return graphics?.textWidth ? graphics.textWidth(String(value ?? '')) : 0;
    }

    buildFeedEntryDetailLines(graphics, entry, width, maxLines = 3) {
        const availableWidth = Math.max(36, width);
        const detailText = entry.detail || entry.line || '';
        const causeLabel = entry?.causeLabel ? `[${entry.causeLabel}]` : null;
        const hasHeardMeaning = this.isFeedThreadInterpretationItalicEnabled()
            && Array.isArray(entry?.threadLines)
            && entry.threadLines.some(line => !!this.formatFeedHeardMeaning(line?.heardMeaning));
        if ((!Array.isArray(entry?.threadLines) || entry.threadLines.length <= 1) && !hasHeardMeaning) {
            const baseLines = causeLabel ? [causeLabel] : [];
            baseLines.push(...this.wrapTextLines(graphics, detailText, availableWidth, Math.max(1, maxLines - baseLines.length)));
            if (entry?.consequenceTail && baseLines.length < maxLines) {
                baseLines.push(...this.wrapTextLines(graphics, `=> ${entry.consequenceTail}`, availableWidth, maxLines - baseLines.length));
            }
            return baseLines;
        }

        const rendered = [];
        if (causeLabel) rendered.push(causeLabel);
        for (const item of entry.threadLines) {
            if (rendered.length >= maxLines) break;
            const speaker = item?.speakerLabel || 'Butterfly';
            const phrase = item?.phrase || '';
            const prefix = `${speaker}: `;
            const wrapped = this.wrapTextLines(graphics, `${prefix}${phrase}`, availableWidth, Math.max(1, maxLines - rendered.length));
            for (const line of wrapped) {
                if (rendered.length >= maxLines) break;
                rendered.push(line);
            }
            const heardMeaning = hasHeardMeaning ? this.formatFeedHeardMeaning(item?.heardMeaning) : null;
            if (heardMeaning && rendered.length < maxLines) {
                const heardLines = this.wrapTextLines(graphics, `(heard: ${heardMeaning})`, availableWidth, Math.max(1, maxLines - rendered.length));
                for (const line of heardLines) {
                    if (rendered.length >= maxLines) break;
                    rendered.push(line);
                }
            }
        }
        if (entry?.consequenceTail && rendered.length < maxLines) {
            const wrappedTail = this.wrapTextLines(graphics, `=> ${entry.consequenceTail}`, availableWidth, Math.max(1, maxLines - rendered.length));
            for (const line of wrappedTail) {
                if (rendered.length >= maxLines) break;
                rendered.push(line);
            }
        }
        return rendered.length ? rendered : this.wrapTextLines(graphics, detailText, availableWidth, maxLines);
    }

    measureFeedEntryCard(graphics, entry, width, compactScale = 1) {
        const headlineSize = Math.max(5, Math.round(5.6 * compactScale));
        const detailSize = Math.max(5, Math.round(5.5 * compactScale));
        const lineHeight = Math.max(8, Math.round(8 * compactScale));
        const titleWidth = width - Math.round(54 * compactScale);
        const hasHeardMeaning = this.isFeedThreadInterpretationItalicEnabled()
            && Array.isArray(entry?.threadLines)
            && entry.threadLines.some(line => !!this.formatFeedHeardMeaning(line?.heardMeaning));
        const detailMaxLines = entry?.threadLines?.length > 1 || hasHeardMeaning ? 5 : 3;
        const footerText = this.buildFeedContextFooter(entry);
        const cacheKey = [
            'feed',
            Math.round(width * 10) / 10,
            Math.round(compactScale * 100) / 100,
            headlineSize,
            detailSize,
            entry?.headline || '',
            entry?.detail || '',
            entry?.line || '',
            entry?.causeLabel || '',
            this.normalizeFeedCategory(entry?.category || 'action'),
            Array.isArray(entry?.threadLines)
                ? entry.threadLines.map(line => `${line?.speakerLabel || ''}:${line?.phrase || ''}:${line?.heardMeaning || ''}`).join('¦')
                : '',
            entry?.consequenceTail || '',
            footerText || ''
        ].join('|');

        return this.readUiLayoutCache(this.feedMeasurementCache, cacheKey, () => {
            graphics.textSize(headlineSize);
            const headline = entry.headline
                ? this.truncateText(graphics, entry.headline, Math.max(40, titleWidth))
                : '';

            graphics.textSize(detailSize);
            const detailLines = this.buildFeedEntryDetailLines(
                graphics,
                entry,
                width - Math.round(24 * compactScale),
                detailMaxLines
            );

            const height = Math.round(12 * compactScale)
                + lineHeight
                + Math.max(lineHeight, detailLines.length * lineHeight)
                + (footerText ? lineHeight : 0)
                + Math.round(10 * compactScale);

            return {
                headline,
                headlineSize,
                detailLines,
                detailSize,
                lineHeight,
                height,
                footerText
            };
        }, 320);
    }

    getInspectSpatialProofSummary(target, gameState) {
        if (!target?.id || typeof physicsSystem === 'undefined') return null;
        const spatial = physicsSystem.getEntitySpatialSummary?.(target, gameState) || null;
        if (!spatial) return null;

        const shelterLead = spatial.contact?.insideShelter
            ? 'inside shelter'
            : spatial.contact?.openingTransition
                ? 'opening edge'
                : 'open air';
        const contactLead = spatial.contact?.blocked
            ? `blocked ${spatial.contact?.blockedByCount || 1}`
            : `touch ${spatial.contact?.touchCount || 0}`;
        const carryLead = spatial.carry?.attachedObjectId
            ? 'carrying material'
            : 'hands free';

        return {
            headline: spatial.headline,
            detail: `${shelterLead} | ${contactLead} | ${carryLead}`,
            raw: spatial
        };
    }

    drawInspectPanel(graphics, gameState) {
        this.syncPanelLayouts(gameState);
        this.lastInspectPresentation = null;
        const target = this.resolveInspectTarget(gameState);
        const panel = this.inspectPanel;
        const compactScale = Math.max(0.86, this.getEffectiveUiScale() * 0.92);
        const isLocked = !!(target?.id && panel.lockedTargetId === target.id);
        const isMateArmed = !!(target?.id && this.inspectControl.mateSourceId === target.id);
        const isReleaseMode = this.isInspectReleaseModeActive();
        const highContrast = this.accessibilitySettings.highContrastUI;
        const panelFill = highContrast ? [0, 0, 0, 242] : [14, 18, 22, 198];
        const strokeColor = highContrast ? [255, 255, 255, 255] : [210, 228, 255, 120];
        const labelColor = highContrast ? [255, 255, 255, 255] : [188, 198, 212, 255];
        const valueColor = [255, 255, 255, 255];
        const rosterSummary = typeof rosterSystem !== 'undefined'
            ? rosterSystem.getEntitySummary?.(target?.id, gameState)
            : null;
        const objectSummary = typeof objectSystem !== 'undefined'
            ? objectSystem.getEntityInteractionSummary?.(target?.id, gameState)
            : null;
        const browseAll = this.inspectControl.browseScope === 'all';
        const allButton = this.getInspectAllButtonRect();
        const listButton = this.getInspectListButtonRect();
        const releaseButton = this.getInspectReleaseButtonRect();
        const mateButton = this.getInspectMateButtonRect();
        const rosterButton = this.getInspectRosterButtonRect();
        const allButtonFill = browseAll
            ? (highContrast ? [255, 255, 255, 255] : [112, 166, 220, 222])
            : (highContrast ? [0, 0, 0, 255] : [36, 44, 56, 214]);
        const allButtonText = browseAll && !highContrast ? [12, 20, 32, 255] : [255, 255, 255, 255];
        const mateButtonFill = isMateArmed
            ? (highContrast ? [255, 255, 255, 255] : [112, 155, 104, 220])
            : (highContrast ? [0, 0, 0, 255] : [36, 44, 56, 214]);
        const mateButtonText = isMateArmed && !highContrast ? [12, 20, 16, 255] : [255, 255, 255, 255];
        const releaseCount = (this.inspectControl.releaseSelectionIds || new Set()).size;
        const releaseButtonFill = isReleaseMode
            ? (highContrast ? [255, 255, 255, 255] : [175, 105, 86, 224])
            : (highContrast ? [0, 0, 0, 255] : [36, 44, 56, 214]);
        const releaseButtonText = isReleaseMode && !highContrast ? [28, 12, 10, 255] : [255, 255, 255, 255];
        const rostered = !!rosterSummary?.member;
        const rosterButtonFill = rostered
            ? (highContrast ? [255, 255, 255, 255] : [104, 126, 176, 218])
            : (highContrast ? [0, 0, 0, 255] : [36, 44, 56, 214]);
        const rosterButtonText = rostered && !highContrast ? [12, 18, 28, 255] : [255, 255, 255, 255];

        if (isReleaseMode) {
            const zoneName = this.getZoneDisplayName(gameState?.focusedZoneId || null);
            const entries = this.getInspectReleaseEntries(gameState);
            panel.height = Math.max(Math.round(146 * this.getEffectiveUiScale()), Math.round(192 * this.getEffectiveUiScale()));
            this.drawInspectChoiceList(graphics, {
                panel,
                title: 'Release',
                statusLabel: zoneName,
                entries,
                entryRectsKey: 'releaseOptionRects',
                checklist: true,
                emptyLines: [
                    `No releasable hybrids are listed in ${zoneName}.`,
                    'Only living hybrids can be selected for release.',
                    'Press Escape or Cancel to leave release mode.'
                ],
                highContrast,
                compactScale,
                panelFill,
                strokeColor
            });
            graphics.push();
            this.drawInspectActionButton(graphics, listButton, 'Cancel', {
                fill: highContrast ? [0, 0, 0, 255] : [36, 44, 56, 214],
                textColor: [255, 255, 255, 255],
                highContrast,
                compactScale
            });
            this.drawInspectActionButton(graphics, releaseButton, releaseCount > 0 ? `Confirm ${releaseCount}` : 'Release', {
                fill: releaseButtonFill,
                textColor: releaseButtonText,
                highContrast,
                compactScale
            });
            graphics.pop();
            return;
        }

        if (!target) {
            const zoneName = browseAll
                ? 'All garden zones'
                : this.getZoneDisplayName(gameState?.focusedZoneId || null);
            const entries = this.getInspectBrowseEntries(gameState);
            panel.height = Math.max(Math.round(142 * this.getEffectiveUiScale()), Math.round(182 * this.getEffectiveUiScale()));
            this.drawInspectChoiceList(graphics, {
                panel,
                title: 'Inspect',
                statusLabel: zoneName,
                entries,
                entryRectsKey: 'selectionRects',
                emptyLines: [
                    browseAll ? 'No butterflies are tracked across the garden yet.' : `No butterflies listed in ${zoneName}.`,
                    browseAll ? 'Use debug spawn or let the garden repopulate first.' : 'Use Next Zone or debug spawn to add one.',
                    'Choose from this list instead of the map.'
                ],
                highContrast,
                compactScale,
                panelFill,
                strokeColor
            });
            graphics.push();
            this.drawInspectActionButton(graphics, allButton, 'All', {
                fill: allButtonFill,
                textColor: allButtonText,
                highContrast,
                compactScale
            });
            this.drawInspectActionButton(graphics, releaseButton, 'Release', {
                fill: releaseButtonFill,
                textColor: releaseButtonText,
                highContrast,
                compactScale
            });
            graphics.pop();
            return;
        }

        if (isMateArmed) {
            const entries = this.getInspectMateEntries(gameState, target);
            panel.height = Math.max(Math.round(142 * this.getEffectiveUiScale()), Math.round(190 * this.getEffectiveUiScale()));
            this.drawInspectChoiceList(graphics, {
                panel,
                title: `${this.getInspectButterflyTitle(target)} mates`,
                statusLabel: 'All zones',
                entries,
                entryRectsKey: 'mateOptionRects',
                emptyLines: [
                    'No eligible mates are available right now.',
                    'Try again after they calm down or wake up.',
                    'Cross-zone picks will use the doorway route.'
                ],
                highContrast,
                compactScale,
                panelFill,
                strokeColor
            });
            return;
        }

        const sleepState = typeof sleepSystem !== 'undefined'
            ? sleepSystem.getSleepState?.(target.id)
            : null;
        const zoneId = target.currentZoneId || target.lifeSim?.lifecycle?.currentZoneId || (
            typeof zoneSystem !== 'undefined'
                ? zoneSystem.getEntityZone?.(target)?.id || null
                : null
        );
        const communicationSummary = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getCommunicationSummary?.(target.id)
            : null;
        const lifeSimSummary = typeof lifeSimSystem !== 'undefined'
            ? lifeSimSystem.getEntitySummary?.(target.id)
            : null;
        const mlSummary = typeof mlInferenceSystem !== 'undefined'
            ? mlInferenceSystem.getEntitySummary?.(target.id, gameState)
            : null;
        const statProfile = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getEntityProfile?.(target, gameState)
            : null;
        const lineageSummary = this.getHybridLineageSummary(target);
        const zoneIdentity = this.buildZoneIdentitySummary(zoneId, { compact: true });
        const compactJoin = (lines = [], fallback = 'none') => {
            const filtered = (lines || []).filter(Boolean);
            return filtered.length ? filtered.slice(0, 2).join(' | ') : fallback;
        };
        const cleanDisplayText = (value = '') => String(value ?? '')
            .replaceAll('â€¢', '•')
            .replaceAll('Ã¢â‚¬Â¢', '|')
            .replaceAll('Â·', '·');
        const baseText = cleanDisplayText(compactJoin(statProfile?.display?.baselineLines, this.buildTraitSummary(target.traits || {})));
        const abilityText = cleanDisplayText(compactJoin(statProfile?.display?.abilityLines, `Ability ${(target.getSpecialAbility?.() || target.specialAbility || 'none')}`));
        const trainingText = cleanDisplayText(compactJoin(statProfile?.display?.upbringingLines, 'No learned imprint yet'));
        const stateFxText = cleanDisplayText(compactJoin(statProfile?.display?.stateLines, 'Near baseline'));
        const effectiveText = cleanDisplayText(compactJoin(statProfile?.display?.effectiveLines, 'No stat sheet yet'));
        const readinessText = cleanDisplayText(compactJoin(statProfile?.display?.readinessLines, 'Ready -- | Unknown'));
        const readinessLead = cleanDisplayText(statProfile?.display?.readinessLines?.[0] || readinessText);
        const parentText = cleanDisplayText(compactJoin(statProfile?.display?.parentLines, lineageSummary?.parents || ''));
        const wingText = cleanDisplayText(compactJoin(statProfile?.display?.wingLines, ''));
        const mutationText = cleanDisplayText(compactJoin(statProfile?.display?.mutationLines, ''));
        const heritageText = cleanDisplayText(compactJoin(statProfile?.display?.heritageLines, ''));
        const rarityText = cleanDisplayText(compactJoin(statProfile?.display?.rarityLines, ''));
        const geneticsLockText = cleanDisplayText(compactJoin(statProfile?.display?.lockLines, ''));
        const ecologyLines = statProfile?.display?.ecologyLines || [];
        const battleHp = target?.battleState?.hp ?? target?.hp ?? 100;
        const battlePressure = target?.battleState?.pressure ?? 0;
        const recentImpactStrength = target?.battleState?.lastImpactAtFrame && typeof frameCount === 'number' && (frameCount - target.battleState.lastImpactAtFrame) <= 60
            ? target?.battleState?.lastImpactStrength || 0
            : 0;
        const impactText = recentImpactStrength > 0 ? ` | Recoil ${Math.round(recentImpactStrength * 10) / 10}` : '';
        const battleText = cleanDisplayText(compactJoin(
            [...(statProfile?.display?.battleLines || []), `HP ${Math.round(battleHp)} | Pressure ${Math.round(battlePressure)}${impactText}`],
            'No battle profile'
        ));
        const compareParts = [];
        if (statProfile?.display?.comparisonLines?.length) {
            compareParts.push(...statProfile.display.comparisonLines);
        }
        if (statProfile?.display?.wingLines?.length) {
            compareParts.push(...statProfile.display.wingLines);
        }
        if (statProfile?.display?.heritageLines?.length) {
            compareParts.push(...statProfile.display.heritageLines);
        }
        const compareText = cleanDisplayText(compactJoin(compareParts, ''));
        const dominantMindText = cleanDisplayText([
            lifeSimSummary?.dominantDrives?.[0] || 'rest 0',
            lifeSimSummary?.dominantEmotions?.[0] || 'calm 0'
        ].join(' | '));
        const socialText = cleanDisplayText(lifeSimSummary
            ? `rep ${lifeSimSummary.social.reputation} | belong ${lifeSimSummary.social.belonging} | conf ${lifeSimSummary.social.confidence} | ${lifeSimSummary.social.context}`
            : 'rep 0 | belong 0 | conf 0 | wandering');
        const playerText = cleanDisplayText(lifeSimSummary
            ? `trust ${lifeSimSummary.player?.trust || 0} | fear ${lifeSimSummary.player?.fear || 0} | ${lifeSimSummary.player?.calmed ? 'calmed' : 'uncalmed'}`
            : 'trust 0 | fear 0 | uncalmed');
        const memoryText = cleanDisplayText(lifeSimSummary?.memories?.headline || 'No reinforced residue yet');
        const memoryDetailText = cleanDisplayText(lifeSimSummary?.memories?.detail || 'No tagged memory families yet');
        const routineText = cleanDisplayText(lifeSimSummary?.routines?.headline || 'ctx wandering | no reinforced routines');
        const routineDetailText = cleanDisplayText(lifeSimSummary?.routines?.detail || 'No strong routine anchors yet');
        const upbringingText = cleanDisplayText(lifeSimSummary?.upbringing?.headline || 'lessons 0 | imprint 0');
        const upbringingDetailText = cleanDisplayText(lifeSimSummary?.upbringing?.detail || 'No routine reinforcement yet');
        const distortionText = cleanDisplayText(lifeSimSummary?.distortion
            ? `${lifeSimSummary.distortion.headline} | warped ${lifeSimSummary.distortion.warpedSignals || 0}`
            : 'stable | warped 0');
        const distortionDetailText = cleanDisplayText(lifeSimSummary?.distortion?.detail || 'warped 0 | stable');
        const objectMindText = cleanDisplayText(lifeSimSummary
            ? `${lifeSimSummary.objects?.focusType || 'none'} | ${lifeSimSummary.objects?.affordance || 'observe'} | block ${lifeSimSummary.objects?.blockFamiliarity || 0} | shelter ${lifeSimSummary.objects?.shelterConfidence || 0}`
            : 'none | observe | block 0 | shelter 0');
        const zonePressureHeadline = cleanDisplayText(lifeSimSummary?.zone?.headline || (zoneIdentity ? `Zone ${zoneIdentity}` : 'Zone garden | steady habitat'));
        const zonePressureDetail = cleanDisplayText(lifeSimSummary?.zone?.detail || 'food 0 | shelter 0 | crowd 0 | pull 0');
        const societyToneText = cleanDisplayText(lifeSimSummary?.socialEcology?.societyLabel || 'mixed | no dominant local society tone');
        const societyToneDetailText = cleanDisplayText(lifeSimSummary?.socialEcology?.societyDetail || 'clique 0 | excl 0 | protect 0 | rep 0');
        const socialEcologyText = cleanDisplayText(lifeSimSummary?.socialEcology?.headline || 'quiet | no strong local rhythm');
        const socialEcologyDetailText = cleanDisplayText(lifeSimSummary?.socialEcology?.detail || 'roost 0 | warn 0 | teach 0 | court 0');
        const spatialProof = this.getInspectSpatialProofSummary(target, gameState);
        const hybridCap = progressionManager?.getHybridAdultCap?.() || 50;
        const spaceText = cleanDisplayText(spatialProof?.headline || (lifeSimSummary
            ? `${lifeSimSummary.space?.verticality || 'ground'} | ${lifeSimSummary.space?.role || 'loose'} | ${lifeSimSummary.space?.pathState || 'open'} | ${lifeSimSummary.space?.bodyFit || 'canPass'}`
            : 'ground | loose | open | canPass'));
        const spaceDetailText = cleanDisplayText(spatialProof?.detail || 'open air | touch 0 | hands free');
        const progressionText = cleanDisplayText(lifeSimSummary
            ? `${target.birthSource || 'wild'} | mates ${progressionManager?.getWildProgress?.(gameState, target)?.mateCount || 0}/3 | hybrids ${progressionManager?.getLivingHybridCount?.(gameState) || 0}/${hybridCap} | rel ${gameState?.totalReleases || 0}`
            : `${target.birthSource || 'wild'} | mates ${progressionManager?.getWildProgress?.(gameState, target)?.mateCount || 0}/3 | hybrids ${progressionManager?.getLivingHybridCount?.(gameState) || 0}/${hybridCap}`);
        const ecologyLeadText = cleanDisplayText(
            ecologyLines[0]
            || `Release ${lifeSimSummary?.progression?.releaseBatchCount || 0}/10 | next ${lifeSimSummary?.progression?.nextWaveRemaining ?? 10} | total ${gameState?.totalReleases || 0}`
        );
        const ecologyDetailText = cleanDisplayText(
            ecologyLines[1]
            || (((lifeSimSummary?.progression?.releaseLineages || []).length || (lifeSimSummary?.progression?.cohortLineages || []).length)
                ? `Line ${[...(lifeSimSummary?.progression?.releaseLineages || []), ...(lifeSimSummary?.progression?.cohortLineages || [])].slice(0, 3).join(' | ')} | root ${lifeSimSummary?.progression?.cohortZoneLabel || zoneId || 'garden'}`
                : 'No release cohort shaping yet')
        );
        const ecologyWaveText = cleanDisplayText(
            ecologyLines[2]
            || (lifeSimSummary?.progression?.cohortId
                ? `Wave ${lifeSimSummary.progression.cohortId} | blend ${lifeSimSummary.progression.cohortBlendGuard || 0} | root ${lifeSimSummary.progression.cohortZoneLabel || zoneId || 'garden'}`
                : 'Wave idle | no recent release cohort')
        );
        const relationshipSummary = communicationSummary?.relationship || null;
        const relationshipText = cleanDisplayText(relationshipSummary
            ? `${relationshipSummary.partnerLabel} | trust ${relationshipSummary.trust} | comfort ${relationshipSummary.comfort} | admiration ${relationshipSummary.admiration} | resentment ${relationshipSummary.resentment}`
            : `rep ${lifeSimSummary?.social?.reputation || 0} | belong ${lifeSimSummary?.social?.belonging || 0} | conf ${lifeSimSummary?.social?.confidence || 0} | ${lifeSimSummary?.social?.context || 'wandering'}`);
        const isolationMarker = this.getInspectIsolationMarker(target, gameState);
        const isolationMarkerText = isolationMarker ? cleanDisplayText(isolationMarker) : null;
        const romanceText = cleanDisplayText(relationshipSummary
            ? `${relationshipSummary.partnerLabel} | ${relationshipSummary.pairTextureLabel || 'steady'} | attachment ${relationshipSummary.attachment} | chemistry ${relationshipSummary.chemistry}`
            : 'No strong bond tracked yet');
        const followThroughText = cleanDisplayText(relationshipSummary
            ? `follow ${relationshipSummary.followThrough} | ${relationshipSummary.followThroughLabel} | ${relationshipSummary.pairTextureSignature || relationshipSummary.repairLabel}`
            : 'follow 0 | no strong carry-over | steady');
        const recentSpokenText = cleanDisplayText(
            communicationSummary?.recentSpokenPhrase
                ? `Said ${communicationSummary.recentSpokenPhrase}`
                : 'Said nothing recently'
        );
        const recentHeardText = cleanDisplayText(
            communicationSummary?.recentHeardPhrase
                ? `Heard ${communicationSummary.recentHeardPhrase}`
                : 'Heard nothing recently'
        );
        const clarityText = `${communicationSummary?.clarityPercent ?? Math.round((target.lifeSim?.interpretation?.clarity || 0) * 100)}% clear`;
        const zoneVoiceText = this.getZoneCommunicationStyleLabel(communicationSummary?.zoneStyle);
        const voiceText = cleanDisplayText(`Voice ${communicationSummary?.voiceSummaryLabel || 'average | neutral | direct'}`);
        const residueText = cleanDisplayText(`Residue ${communicationSummary?.recentResidueLabel || 'No recent dialogue residue'}`);
        const residueDetailText = cleanDisplayText(`Track ${communicationSummary?.recentResidueDetail || 'No later-behavior residue tracked'}`);
        const retainedLessonText = cleanDisplayText(`Learn ${communicationSummary?.retainedLessonLabel || 'No retained dialogue lesson'}`);
        const signalProofText = cleanDisplayText(`Signal ${communicationSummary?.signalSupportLabel || 'quiet | no active support'}`);
        const signalProofDetailText = cleanDisplayText(`Signal detail ${communicationSummary?.signalSupportDetail || 'No active coordination signal'}`);
        const localSignalFieldText = cleanDisplayText(`Field ${communicationSummary?.localSignalFieldLabel || 'quiet | no active field'}`);
        const localSignalFieldDetailText = cleanDisplayText(`Field detail ${communicationSummary?.localSignalFieldDetail || 'No nearby active signals'}`);
        const genesText = cleanDisplayText([abilityText, mutationText].filter(Boolean).join(' | ') || abilityText);
        const autoText = cleanDisplayText(lifeSimSummary
            ? `threat ${lifeSimSummary.battle?.enemyThreat || 0} | ally ${lifeSimSummary.battle?.allyPressure || 0} | ${lifeSimSummary.battle?.spacingState || 'open'} | support ${lifeSimSummary.battle?.supportOpportunity || 0}`
            : 'threat 0 | ally 0 | open | support 0');
        const migrationText = cleanDisplayText(lifeSimSummary?.migration?.headline || 'home garden 0 | travel 0');
        const migrationDetailText = cleanDisplayText(lifeSimSummary?.migration?.detail || 'No home-range anchor yet');
        const migrationStateText = cleanDisplayText(
            lifeSimSummary?.migration
                ? `${lifeSimSummary.migration.awayFromHome ? 'away from home' : 'at home'} | visited ${lifeSimSummary.migration.visitedZoneCount || 0} | ${lifeSimSummary.migration.reasonLabel || 'settling'}`
                : 'at home | visited 0 | settling'
        );
        const migrationTargetText = cleanDisplayText(
            lifeSimSummary?.migration?.travelTargetLabel
                ? `Target ${lifeSimSummary.migration.travelTargetLabel} | return ${lifeSimSummary.migration.returnHomeBias || 0} | scout ${lifeSimSummary.migration.scoutingDrive || 0} | mate ${lifeSimSummary.migration.mateSeeking || 0}`
                : `Target none | return ${lifeSimSummary?.migration?.returnHomeBias || 0} | scout ${lifeSimSummary?.migration?.scoutingDrive || 0} | mate ${lifeSimSummary?.migration?.mateSeeking || 0}`
        );
        const verboseInspect = typeof debugUI !== 'undefined' && !!debugUI.enabled;
        const socialLensLines = this.buildSocialLensInspectLines({
            lifeSimSummary,
            communicationSummary,
            relationshipSummary,
            mlSummary
        }).map(line => cleanDisplayText(line));
        const mlRows = this.buildMlInspectRows(mlSummary, {
            lifeSimSummary,
            communicationSummary,
            relationshipSummary
        }).map(row => ({
            ...row,
            value: cleanDisplayText(row.value)
        }));
        const whyThisMoment = this.buildWhyThisMomentState(target, gameState, mlSummary, lifeSimSummary, communicationSummary);
        const rosterStatusText = rosterSummary?.label || 'Not rostered';
        const objectStatusText = cleanDisplayText(objectSummary
            ? `${objectSummary.latestLabel} | ${objectSummary.currentCarryLabel}`
            : 'No recent interaction');
        const modeText = isLocked
            ? 'Selected | List to browse | Mate to choose a partner'
            : 'Browse | choose a butterfly from the current-zone list';
        const heroLines = [
            [target.birthSource || 'wild', target.isHybrid ? 'Hybrid' : (target.personalityType || 'wild'), sleepState?.subtype || 'awake'].filter(Boolean).join(' • '),
            [this.getZoneDisplayName(zoneId), rostered ? rosterStatusText : 'Not rostered'].filter(Boolean).join(' • '),
            readinessLead
        ].filter(Boolean).map(line => cleanDisplayText(line));
        const sections = [
            ...(whyThisMoment ? [{
                id: 'whyThisMoment',
                title: whyThisMoment.title,
                lines: whyThisMoment.lines,
                maxLinesPerItem: 2
            }] : []),
            {
                id: 'current',
                title: 'Current Read',
                lines: [baseText, trainingText, readinessText, `Mode ${modeText}`],
                maxLinesPerItem: 2
            },
            {
                id: 'talk',
                title: 'Talk + Proof',
                lines: [
                    recentSpokenText,
                    recentHeardText,
                    `${clarityText} | ${zoneVoiceText}`,
                    voiceText,
                    communicationSummary?.activeConversationLabel ? cleanDisplayText(communicationSummary.activeConversationLabel) : null,
                    localSignalFieldText,
                    localSignalFieldDetailText,
                    residueText,
                    residueDetailText,
                    retainedLessonText
                ],
                maxLinesPerItem: 2
            },
            {
                id: 'socialLens',
                title: 'Social Lens',
                lines: socialLensLines,
                maxLinesPerItem: 2
            },
            {
                id: 'social',
                title: 'Social + Mind',
                lines: [relationshipText, isolationMarkerText, romanceText, followThroughText, `Society ${societyToneText}`, societyToneDetailText, `Rhythm ${socialEcologyText}`, socialEcologyDetailText, playerText, dominantMindText, socialText],
                maxLinesPerItem: 2
            },
            {
                id: 'continuity',
                title: 'Memory + Habits',
                lines: [`Memory ${memoryText}`, memoryDetailText, `Routine ${routineText}`, routineDetailText],
                maxLinesPerItem: 2
            },
            {
                id: 'adaptation',
                title: 'Lessons + Distortion',
                lines: [`Upbringing ${upbringingText}`, upbringingDetailText, `Distortion ${distortionText}`, distortionDetailText],
                maxLinesPerItem: 2
            },
            {
                id: 'battle',
                title: 'Battle',
                lines: [battleText, compareText ? `Compare ${compareText}` : null, verboseInspect ? `Auto ${autoText}` : null],
                maxLinesPerItem: 2
            },
            {
                id: 'lineage',
                title: 'Genes + Lineage',
                lines: [
                    genesText,
                    parentText ? `Parents ${parentText}` : null,
                    wingText ? `Wings ${wingText}` : null,
                    heritageText ? `Heritage ${heritageText}` : null,
                    rarityText ? `Rarity ${rarityText}` : null,
                    geneticsLockText ? `Lock ${geneticsLockText}` : null
                ],
                maxLinesPerItem: 2
            },
            {
                id: 'journey',
                title: 'Range + Travel',
                lines: [migrationText, migrationDetailText, migrationStateText, migrationTargetText],
                maxLinesPerItem: 2
            },
            {
                id: 'ecology',
                title: 'Ecology + Space',
                lines: [
                    zonePressureHeadline,
                    `Pressure ${zonePressureDetail}`,
                    `Rhythm ${socialEcologyText}`,
                    socialEcologyDetailText,
                    `Space ${spaceText}`,
                    `Contact ${spaceDetailText}`,
                    progressionText,
                    ecologyLeadText,
                    ecologyDetailText,
                    ecologyWaveText,
                    objectMindText
                ],
                maxLinesPerItem: 2
            },
            ...(verboseInspect ? [{
                id: 'debug',
                title: 'Debug',
                lines: [stateFxText, effectiveText, objectStatusText, signalProofText, signalProofDetailText, autoText, ...mlRows.map(row => `${row.label} ${row.value}`)],
                maxLinesPerItem: 2
            }] : [])
        ].filter(section => (section.lines || []).some(line => `${line ?? ''}`.trim().length > 0));
        this.lastInspectPresentation = {
            targetId: target.id,
            targetLabel: this.getInspectButterflyTitle(target),
            zoneId,
            heroLines: [...heroLines],
            sections: sections.map(section => ({
                id: section.id,
                title: section.title,
                lines: [...(section.lines || [])]
            })),
            updatedAt: Date.now()
        };

        graphics.push();
        panel.height = Math.round(318 * this.getEffectiveUiScale());

        const sectionGap = Math.max(4, Math.round(5 * compactScale));
        const cardX = panel.x + 6;
        const cardWidth = panel.width - 12;
        const heroPadding = Math.max(8, Math.round(8 * compactScale));
        const heroTitleSize = Math.max(7, Math.round(8.4 * compactScale));
        const heroMetaSize = Math.max(5, Math.round(5.8 * compactScale));
        const heroMetaLineHeight = Math.max(8, Math.round(8 * compactScale));
        graphics.textSize(heroMetaSize);
        const heroWrappedLines = [];
        for (const line of heroLines) {
            heroWrappedLines.push(...this.wrapTextLines(graphics, line, cardWidth - (heroPadding * 2), 2));
        }
        const heroHeight = Math.round(18 * compactScale)
            + Math.max(heroMetaLineHeight, heroWrappedLines.length * heroMetaLineHeight)
            + Math.round(10 * compactScale);
        const heroY = panel.y + 26;
        const contentTop = heroY + heroHeight + sectionGap;
        const contentBottom = panel.y + panel.height - 10;
        const visibleHeight = Math.max(panel.lineHeight * 4, contentBottom - contentTop);
        const measuredSections = sections.map(section => ({
            ...section,
            measurement: this.measureInspectSectionCard(graphics, section, cardWidth, compactScale)
        }));
        const contentHeight = measuredSections.reduce((sum, section, index) => {
            return sum + section.measurement.height + (index < measuredSections.length - 1 ? sectionGap : 0);
        }, 0);
        const maxScroll = Math.max(0, Math.ceil((contentHeight - visibleHeight) / panel.lineHeight));
        panel.scrollOffset = Math.max(0, Math.min(panel.scrollOffset || 0, maxScroll));

        graphics.fill(...panelFill);
        graphics.stroke(...strokeColor);
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.rect(panel.x, panel.y, panel.width, panel.height, 8);

        graphics.fill(...valueColor);
        graphics.textAlign(LEFT, TOP);
        graphics.textStyle(BOLD);
        graphics.textSize(Math.max(7, Math.round((highContrast ? 11 : 9) * compactScale)));
        graphics.text('Inspect', Math.round(panel.x + 6), Math.round(panel.y + 4));
        graphics.textStyle(NORMAL);
        this.drawInspectActionButton(graphics, allButton, 'All', {
            fill: allButtonFill,
            textColor: allButtonText,
            highContrast,
            compactScale
        });
        this.drawInspectActionButton(graphics, listButton, 'List', {
            fill: highContrast ? [0, 0, 0, 255] : [36, 44, 56, 214],
            textColor: [255, 255, 255, 255],
            highContrast,
            compactScale
        });
        this.drawInspectActionButton(graphics, releaseButton, 'Release', {
            fill: releaseButtonFill,
            textColor: releaseButtonText,
            highContrast,
            compactScale
        });
        this.drawInspectActionButton(graphics, rosterButton, rostered ? 'Leave' : 'Roster', {
            fill: rosterButtonFill,
            textColor: rosterButtonText,
            highContrast,
            compactScale
        });
        this.drawInspectActionButton(graphics, mateButton, isMateArmed ? 'Stop' : 'Mate', {
            fill: mateButtonFill,
            textColor: mateButtonText,
            highContrast,
            compactScale
        });

        const heroStyle = this.getInspectSectionStyle('current', highContrast);
        graphics.fill(...heroStyle.fill);
        graphics.stroke(...heroStyle.stroke);
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.rect(cardX, heroY, cardWidth, heroHeight, 7);
        graphics.noStroke();
        graphics.textAlign(LEFT, TOP);
        graphics.fill(...heroStyle.title);
        graphics.textStyle(BOLD);
        graphics.textSize(heroTitleSize);
        graphics.text(
            this.truncateText(graphics, this.getInspectButterflyTitle(target), cardWidth - Math.round(56 * compactScale)),
            cardX + heroPadding,
            heroY + Math.round(5 * compactScale)
        );
        graphics.textStyle(NORMAL);
        graphics.textAlign(RIGHT, TOP);
        graphics.fill(...labelColor);
        graphics.textSize(Math.max(5, Math.round(5.2 * compactScale)));
        graphics.text(isLocked ? 'Selected' : 'Browse', cardX + cardWidth - heroPadding, heroY + Math.round(6 * compactScale));
        graphics.textAlign(LEFT, TOP);
        graphics.fill(...heroStyle.text);
        graphics.textSize(heroMetaSize);
        let heroLineY = heroY + Math.round(16 * compactScale);
        for (const line of heroWrappedLines) {
            graphics.text(line, cardX + heroPadding, heroLineY);
            heroLineY += heroMetaLineHeight;
        }

        const drawContext = graphics.drawingContext;
        drawContext.save();
        drawContext.beginPath();
        drawContext.rect(panel.x + 4, contentTop - 2, panel.width - 8, visibleHeight + 4);
        drawContext.clip();

        let y = contentTop - ((panel.scrollOffset || 0) * panel.lineHeight);
        for (const section of measuredSections) {
            if ((y + section.measurement.height) < (contentTop - sectionGap)) {
                y += section.measurement.height + sectionGap;
                continue;
            }
            if (y > (contentTop + visibleHeight + sectionGap)) {
                break;
            }
            this.drawInspectSectionCard(graphics, cardX, y, cardWidth, section, compactScale, highContrast);
            y += section.measurement.height + sectionGap;
        }
        drawContext.restore();

        if (maxScroll > 0) {
            graphics.textAlign(RIGHT, BOTTOM);
            graphics.fill(...labelColor);
            graphics.textSize(Math.max(5, Math.round(5.6 * compactScale)));
            graphics.text(`Scroll ${panel.scrollOffset + 1}/${maxScroll + 1}`, panel.x + panel.width - 8, panel.y + panel.height - 6);
            graphics.textAlign(LEFT, BASELINE);
        }

        graphics.pop();
    }

    isInspectLockedToEntity(entityId) {
        return !!entityId && this.inspectPanel.visible && this.inspectPanel.lockedTargetId === entityId;
    }

    getRecentActivityEntries() {
        if (typeof eventBus === 'undefined' || !eventBus.getHistory) return [];
        this.normalizeActivityLogFilters();
        const currentState = gameCore?.getGameState ? gameCore.getGameState() : gameCore?.gameState;
        const targetId = currentState ? this.getLockedInspectTarget(currentState)?.id : null;
        const focusedZoneId = currentState?.focusedZoneId || null;
        const historyBucket = eventBus.history || [];
        const dialogueBucket = typeof communicationSystem !== 'undefined'
            ? (communicationSystem.dialogueHistory || [])
            : [];
        const cacheKey = JSON.stringify({
            targetId: targetId || null,
            focusedZoneId: focusedZoneId || null,
            filters: this.activityLogPanel.filters,
            maxEntries: this.activityLogPanel.maxEntries,
            historyLength: historyBucket.length,
            historyStamp: historyBucket.length ? (historyBucket[historyBucket.length - 1]?.timestamp || historyBucket.length) : 0,
            dialogueLength: dialogueBucket.length,
            dialogueStamp: dialogueBucket.length ? (dialogueBucket[dialogueBucket.length - 1]?.timestamp || dialogueBucket.length) : 0
        });

        if (this.activityLogCache.key === cacheKey) {
            return this.activityLogCache.entries;
        }

        const significantEvents = new Set([
            GameEvents?.TEACHING_COMPLETED || 'teaching:completed',
            GameEvents?.TRAINING_DRILL_COMPLETED || 'training:drillCompleted',
            GameEvents?.FLOWER_EGG_LAID || 'flower:eggLaid',
            GameEvents?.CATERPILLAR_HATCHED || 'lifecycle:caterpillarHatched',
            GameEvents?.CHRYSALIS_FORMED || 'lifecycle:chrysalisFormed',
            GameEvents?.HYBRID_BORN || 'lifecycle:hybridBorn',
            GameEvents?.BUTTERFLY_STATE_CHANGED || 'butterfly:stateChanged',
            GameEvents?.OBJECT_PICKED_UP || 'object:pickedUp',
            GameEvents?.OBJECT_DROPPED || 'object:dropped',
            GameEvents?.OBJECT_DELIVERED || 'object:delivered',
            'object:placed',
            'environment:project-completed',
            'ecology:cleanup-object-cleaned',
            'pollen:handoff',
            'pollen:planted',
            'pollen:bloomed',
            'pollen:expired',
            GameEvents?.BATTLE_ACTION_OCCURRED || 'battle:actionOccurred'
        ]);

        const history = historyBucket
            .filter(entry => significantEvents.has(entry.event))
            .filter(entry => !focusedZoneId || this.entryMatchesFocusedZone(entry, focusedZoneId))
            .filter(entry => !targetId || this.entryMatchesButterfly(entry, targetId))
            .map(entry => {
                const formatted = this.formatActivityEntry(entry);
                if (!formatted?.line) return null;
                return {
                    timestamp: entry.timestamp || Date.now(),
                    signature: formatted.signature,
                    line: formatted.line,
                    event: entry.event,
                    category: this.normalizeFeedCategory(formatted.category || 'action'),
                    headline: formatted.headline || null,
                    detail: formatted.detail || null,
                    grounding: formatted.grounding || null,
                    contextTags: formatted.contextTags || [],
                    timeLabel: formatted.timeLabel || null,
                    targetText: formatted.targetText || null,
                    consequenceTail: formatted.consequenceTail || null,
                    threatSignalId: formatted.threatSignalId || null,
                    dangerMemoryId: formatted.dangerMemoryId || null,
                    safetyAvoidanceTrigger: formatted.safetyAvoidanceTrigger || null
                };
            })
            .filter(Boolean);

        const dialogueHistory = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getFeedEntries({
                targetId,
                zoneId: focusedZoneId,
                limit: this.activityLogPanel.maxEntries
            }).map(entry => ({
                timestamp: entry.timestamp || Date.now(),
                signature: entry.signature,
                line: entry.line,
                event: GameEvents?.DIALOGUE_SPOKEN || 'communication:dialogueSpoken',
                category: this.normalizeFeedCategory(entry.category || 'talk'),
                headline: entry.headline || null,
                detail: entry.detail || null,
                grounding: entry.grounding || null,
                contextTags: entry.contextTags || [],
                timeLabel: entry.timeLabel || null,
                targetText: entry.targetText || null,
                threadLines: entry.threadLines || null,
                referencedMemoryPacketId: entry.referencedMemoryPacketId || null,
                causeLabel: entry.causeLabel || null,
                metadata: entry.metadata || null,
                dialogueMetadata: entry.dialogueMetadata || null,
                phraseTemplateId: entry.phraseTemplateId || null,
                conversationId: entry.conversationId || null,
                pairModeLabel: entry.pairModeLabel || null,
                pairTextureLabel: entry.pairTextureLabel || null,
                consequenceTail: entry.consequenceTail || null
            }))
            : [];

        const merged = [...history, ...dialogueHistory].sort((left, right) => {
            return (left.timestamp || 0) - (right.timestamp || 0);
        });

        const collapsed = [];
        for (const entry of merged) {
            if (!entry?.line) continue;
            const previous = collapsed[collapsed.length - 1];
            if (previous && previous.signature === entry.signature) {
                previous.count += 1;
                previous.line = entry.line;
                previous.headline = entry.headline || previous.headline;
                previous.detail = entry.detail || previous.detail;
                previous.grounding = entry.grounding || previous.grounding;
                previous.contextTags = entry.contextTags || previous.contextTags;
                previous.timeLabel = entry.timeLabel || previous.timeLabel;
                previous.threadLines = entry.threadLines || previous.threadLines;
                previous.referencedMemoryPacketId = entry.referencedMemoryPacketId || previous.referencedMemoryPacketId;
                previous.causeLabel = entry.causeLabel || previous.causeLabel;
                previous.metadata = entry.metadata || previous.metadata;
                previous.dialogueMetadata = entry.dialogueMetadata || previous.dialogueMetadata;
                previous.phraseTemplateId = entry.phraseTemplateId || previous.phraseTemplateId;
                previous.conversationId = entry.conversationId || previous.conversationId;
                previous.pairModeLabel = entry.pairModeLabel || previous.pairModeLabel;
                previous.pairTextureLabel = entry.pairTextureLabel || previous.pairTextureLabel;
                previous.consequenceTail = entry.consequenceTail || previous.consequenceTail;
                previous.threatSignalId = entry.threatSignalId || previous.threatSignalId;
                previous.dangerMemoryId = entry.dangerMemoryId || previous.dangerMemoryId;
                previous.safetyAvoidanceTrigger = entry.safetyAvoidanceTrigger || previous.safetyAvoidanceTrigger;
                previous.timestamp = entry.timestamp || previous.timestamp;
            } else {
                collapsed.push({
                    signature: entry.signature,
                    line: entry.line,
                    count: 1,
                    category: this.normalizeFeedCategory(entry.category || 'action'),
                    headline: entry.headline || null,
                    detail: entry.detail || null,
                    grounding: entry.grounding || null,
                    contextTags: entry.contextTags || [],
                    timeLabel: entry.timeLabel || null,
                    targetText: entry.targetText || null,
                    threadLines: entry.threadLines || null,
                    referencedMemoryPacketId: entry.referencedMemoryPacketId || null,
                    causeLabel: entry.causeLabel || null,
                    metadata: entry.metadata || null,
                    dialogueMetadata: entry.dialogueMetadata || null,
                    phraseTemplateId: entry.phraseTemplateId || null,
                    conversationId: entry.conversationId || null,
                    pairModeLabel: entry.pairModeLabel || null,
                    pairTextureLabel: entry.pairTextureLabel || null,
                    consequenceTail: entry.consequenceTail || null,
                    threatSignalId: entry.threatSignalId || null,
                    dangerMemoryId: entry.dangerMemoryId || null,
                    safetyAvoidanceTrigger: entry.safetyAvoidanceTrigger || null,
                    timestamp: entry.timestamp || Date.now()
                });
            }
        }

        const entries = collapsed
            .slice(-this.activityLogPanel.maxEntries)
            .map(entry => ({
                ...entry,
                line: entry.count > 1 ? `${entry.line}  x${entry.count}` : entry.line,
                badgeText: entry.count > 1 ? `x${entry.count}` : null
            }));

        this.activityLogCache = {
            key: cacheKey,
            entries
        };
        return entries;
    }

    entryMatchesFocusedZone(entry, focusedZoneId) {
        if (!focusedZoneId) return true;
        const event = entry?.event || '';
        const data = entry?.data || {};
        if (event === (GameEvents?.BATTLE_ACTION_OCCURRED || 'battle:actionOccurred')) {
            return true;
        }
        const zoneCandidates = [
            data?.zoneId,
            data?.sourceZoneId,
            data?.toZoneId,
            data?.focusedZoneId,
            data?.currentZoneId,
            data?.butterfly?.currentZoneId,
            data?.flower?.currentZoneId,
            data?.targetFlower?.currentZoneId,
            this.getButterflyById(data?.entityId)?.currentZoneId,
            this.getButterflyById(data?.butterflyId)?.currentZoneId,
            this.getButterflyById(data?.teacherId)?.currentZoneId,
            this.getButterflyById(data?.listenerId)?.currentZoneId,
            this.getButterflyById(data?.sourceId)?.currentZoneId,
            this.getButterflyById(data?.targetId)?.currentZoneId
        ].filter(Boolean);

        return zoneCandidates.includes(focusedZoneId);
    }

    resumeLatestFeedView() {
        this.activityLogPanel.followLatest = true;
        this.activityLogPanel.scrollOffset = 0;
        this.activityLogPanel.frozenEntries = null;
    }

    getFeedFilterButtons() {
        this.normalizeActivityLogFilters();
        const panel = this.activityLogPanel;
        const descriptors = [
            ['talk', 'Talk'],
            ['action', 'Action'],
            ['learn', 'Learn'],
            ['warning', 'Warning'],
            ['system', 'System']
        ];
        const gap = 2;
        const width = Math.floor((panel.width - 12 - (gap * (descriptors.length - 1))) / descriptors.length);
        const height = 10;
        const startX = panel.x + 6;
        const y = panel.y + 6;
        return descriptors.map(([id, label], index) => ({
            id,
            label,
            x: startX + (index * (width + gap)),
            y,
            width,
            height,
            style: this.getFeedCategoryStyle(id, this.accessibilitySettings.highContrastUI)
        }));
    }

    getFeedResumeButtonRect() {
        const panel = this.activityLogPanel;
        return {
            x: panel.x + 6,
            y: panel.y + panel.height - 15,
            width: 12,
            height: 12
        };
    }

    getEntityDisplayName(entity, fallback = 'Butterfly') {
        if (!entity) return fallback;
        return entity.getDisplayName?.() || entity.displayName || entity.personalityType || entity.id || fallback;
    }

    getButterflyById(entityId) {
        return gameCore?.gameState?.butterflies?.find?.(butterfly => butterfly.id === entityId) || null;
    }

    getZoneDisplayName(zoneId) {
        if (!zoneId) return 'zone';
        return zoneSystem?.getZone?.(zoneId)?.label || zoneId;
    }

    getZoneEcologyProfile(zoneId) {
        return gameCore?.getZoneEcologyProfile?.(zoneId) || {};
    }

    getZoneCommunicationStyleLabel(style) {
        const labels = {
            'open-land-calm': 'Calm social meadow',
            'open-land-watchful': 'Watchful shelter edge',
            'open-land-echoing': 'Echoing wander pool',
            'calm-teaching': 'Calm teaching',
            'echoing': 'Echoing sanctuary',
            'warning-scout': 'Scout vigilance',
            'loud-training': 'Active training'
        };
        return labels[style] || 'Garden rhythm';
    }

    buildZoneIdentitySummary(zoneId, options = {}) {
        const profile = this.getZoneEcologyProfile(zoneId);
        const flowerLabel = (profile.preferredFlowerTypes || []).slice(0, 2).join('/');
        const personalityLabel = (profile.preferredPersonalities || []).slice(0, 2).join('/');
        const styleLabel = this.getZoneCommunicationStyleLabel(profile.communicationStyle);
        const identityLabel = profile.identityLabel || styleLabel;
        const identityTags = Array.isArray(profile.identityTags)
            ? profile.identityTags.slice(0, 3).join('/')
            : '';
        if (options.compact) {
            const parts = [identityLabel];
            if (identityTags) parts.push(identityTags);
            if (flowerLabel) parts.push(flowerLabel);
            if (personalityLabel) parts.push(personalityLabel);
            return parts.join(' | ');
        }
        return [
            identityLabel,
            identityTags ? `Focus ${identityTags}` : styleLabel,
            flowerLabel ? `Blooms ${flowerLabel}` : null,
            personalityLabel ? `Favours ${personalityLabel}` : null
        ].filter(Boolean).join(' | ');
    }

    getTrackedTraitKeys() {
        return ['speed', 'jitteriness', 'trustPropensity', 'trustSpeed', 'scareThreshold', 'happinessBonus'];
    }

    getTraitLabel(key) {
        const labels = {
            speed: 'Speed',
            jitteriness: 'Jitter',
            trustPropensity: 'Trust lean',
            trustSpeed: 'Trust rate',
            scareThreshold: 'Calmness',
            happinessBonus: 'Joy gain'
        };
        return labels[key] || key;
    }

    formatTraitValue(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) return '--';
        return value.toFixed(2);
    }

    getTrackedTraits(traits = {}) {
        const tracked = {};
        for (const key of this.getTrackedTraitKeys()) {
            tracked[key] = typeof traits[key] === 'number' ? traits[key] : null;
        }
        if (traits.special) {
            tracked.special = traits.special;
        }
        return tracked;
    }

    buildTraitSummary(traits = {}, options = {}) {
        const includeSpecial = options.includeSpecial ?? false;
        const tracked = this.getTrackedTraits(traits);
        const lines = [];
        const entries = this.getTrackedTraitKeys().map(key => `${this.getTraitLabel(key)} ${this.formatTraitValue(tracked[key])}`);

        for (let index = 0; index < entries.length; index += 2) {
            lines.push(entries.slice(index, index + 2).join(' | '));
        }

        if (includeSpecial) {
            lines.push(`Ability ${tracked.special || 'none'}`);
        }

        return lines.join('\n');
    }

    getHybridLineageSummary(target) {
        if (!target?.isHybrid) return null;

        const journalEntry = target.hybridEntryId && Array.isArray(gameCore?.gameState?.hybridJournal)
            ? gameCore.gameState.hybridJournal.find(entry => entry.id === target.hybridEntryId)
            : null;
        const hybridGenome = target.hybridGenome || journalEntry?.hybridGenome || null;
        const parentA = journalEntry?.parentA || null;
        const parentB = journalEntry?.parentB || null;
        const parentALabel = parentA?.personalityType || parentA?.baseType || 'parent A';
        const parentBLabel = parentB?.personalityType || parentB?.baseType || 'parent B';
        const donorSegments = [
            ['foreLeft', 'FL'],
            ['foreRight', 'FR'],
            ['hindLeft', 'HL'],
            ['hindRight', 'HR']
        ].map(([wingKey, shortLabel]) => {
            const donor = hybridGenome?.wingDonors?.[wingKey];
            if (!donor?.personalityType) return null;
            return `${shortLabel} ${donor.personalityType}`;
        }).filter(Boolean);

        return {
            parents: `${parentALabel} + ${parentBLabel}`,
            wings: donorSegments.length ? donorSegments.join(' | ') : 'Wing donors not archived'
        };
    }

    entryMatchesButterfly(entry, targetId) {
        const data = entry?.data || {};
        const candidateIds = [
            data?.entityId,
            data?.butterflyId,
            data?.teacherId,
            data?.listenerId,
            data?.sourceId,
            data?.targetId,
            data?.targetLabel === 'player cursor' ? 'player_cursor' : null,
            data?.butterfly?.id,
            data?.teacher?.id,
            data?.listener?.id
        ].filter(Boolean);

        if (candidateIds.includes(targetId)) return true;
        if (Array.isArray(data?.butterflyIds) && data.butterflyIds.includes(targetId)) return true;
        if (Array.isArray(data?.targetIds) && data.targetIds.includes(targetId)) return true;
        if (Array.isArray(data?.contributorIds) && data.contributorIds.includes(targetId)) return true;
        return false;
    }

    wrapTextLines(graphics, text, maxWidth, maxLines = Infinity) {
        const raw = `${text ?? ''}`.trim();
        if (!raw) return [''];
        const cacheKey = [
            'wrap',
            this.getGraphicsTextStateKey(graphics),
            Math.round(maxWidth * 10) / 10,
            maxLines,
            raw
        ].join('|');

        return this.readUiLayoutCache(this.textLayoutCache, cacheKey, () => {
            const paragraphs = raw.split('\n');
            const wrapped = [];

            for (const paragraph of paragraphs) {
                const words = paragraph.split(/\s+/).filter(Boolean);
                if (!words.length) {
                    wrapped.push('');
                    continue;
                }

                let currentLine = words.shift();
                while (words.length) {
                    const nextWord = words[0];
                    const candidate = `${currentLine} ${nextWord}`;
                    if (this.measureTextWidth(graphics, candidate) <= maxWidth) {
                        currentLine = candidate;
                        words.shift();
                        continue;
                    }

                    wrapped.push(currentLine);
                    currentLine = words.shift();
                    if (wrapped.length >= maxLines) {
                        return wrapped.slice(0, maxLines);
                    }
                }

                wrapped.push(currentLine);
                if (wrapped.length >= maxLines) {
                    return wrapped.slice(0, maxLines);
                }
            }

            return wrapped.slice(0, maxLines);
        }, 1200);
    }

    truncateText(graphics, text, maxWidth) {
        const raw = `${text ?? ''}`;
        const cacheKey = [
            'truncate',
            this.getGraphicsTextStateKey(graphics),
            Math.round(maxWidth * 10) / 10,
            raw
        ].join('|');
        return this.readUiLayoutCache(this.textLayoutCache, cacheKey, () => {
            if (this.measureTextWidth(graphics, raw) <= maxWidth) return raw;

            let sliceLength = raw.length;
            while (sliceLength > 1 && this.measureTextWidth(graphics, raw.slice(0, sliceLength) + '...') > maxWidth) {
                sliceLength -= 1;
            }
            return raw.slice(0, sliceLength) + '...';
        }, 1200);
    }

    buildWrappedFeedLines(graphics, entries, maxWidth) {
        const lines = [];
        for (const entry of entries) {
            lines.push(...this.wrapTextLines(graphics, entry?.line || '', maxWidth));
        }
        return lines;
    }

    drawFeedEntryCard(graphics, entry, rect, compactScale = 1, highContrast = false) {
        const style = this.getFeedCategoryStyle(entry.category, highContrast);
        const measurement = this.measureFeedEntryCard(graphics, entry, rect.width, compactScale);
        const accentWidth = Math.max(3, Math.round(3 * compactScale));
        const textX = rect.x + Math.round(10 * compactScale);
        const detailStartY = rect.y + Math.round(14 * compactScale);

        graphics.push();
        graphics.fill(...style.cardFill);
        graphics.stroke(...style.cardStroke);
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.rect(rect.x, rect.y, rect.width, rect.height, 7);

        graphics.noStroke();
        graphics.fill(...style.accent);
        graphics.rect(rect.x + Math.round(3 * compactScale), rect.y + Math.round(3 * compactScale), accentWidth, rect.height - Math.round(6 * compactScale), 3);

        graphics.fill(...style.meta);
        graphics.textAlign(RIGHT, TOP);
        graphics.textSize(Math.max(5, Math.round(5.2 * compactScale)));
        const metaText = entry.badgeText
            ? `${entry.timeLabel || ''} ${entry.badgeText}`.trim()
            : (entry.timeLabel || '');
        graphics.text(metaText, rect.x + rect.width - Math.round(8 * compactScale), rect.y + Math.round(5 * compactScale));

        const headlineMaxWidth = Math.max(36, rect.width - (textX - rect.x) - Math.round(44 * compactScale));
        graphics.fill(...style.title);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(measurement.headlineSize);
        graphics.text(
            measurement.headline
                ? this.truncateText(graphics, measurement.headline, headlineMaxWidth)
                : this.truncateText(graphics, entry.line || '', rect.width - Math.round(24 * compactScale)),
            textX,
            rect.y + Math.round(5 * compactScale)
        );

        graphics.fill(...style.detail);
        graphics.textSize(measurement.detailSize);
        let detailY = detailStartY;
        for (const line of measurement.detailLines) {
            if (this.isFeedHeardMeaningLine(line) && this.isFeedThreadInterpretationItalicEnabled()) {
                graphics.textStyle(typeof ITALIC !== 'undefined' ? ITALIC : 'italic');
            } else {
                graphics.textStyle(typeof NORMAL !== 'undefined' ? NORMAL : 'normal');
            }
            graphics.text(line, textX, detailY);
            detailY += measurement.lineHeight;
        }
        graphics.textStyle(typeof NORMAL !== 'undefined' ? NORMAL : 'normal');

        if (measurement.footerText) {
            graphics.noStroke();
            graphics.fill(...style.meta);
            graphics.textAlign(LEFT, BOTTOM);
            graphics.textSize(Math.max(4, Math.round(4.4 * compactScale)));
            graphics.text(
                this.truncateText(graphics, measurement.footerText, rect.width - Math.round(24 * compactScale)),
                textX,
                rect.y + rect.height - Math.round(5 * compactScale)
            );
        }
        graphics.pop();

        return measurement.height;
    }

    describeSleepSubtype(subtype) {
        const labels = {
            settling_sleep: 'settling to sleep',
            normal_sleep: 'fell asleep',
            oversleeping: 'overslept',
            forced_battle_sleep: 'was forced to sleep',
            awake: 'woke up'
        };
        return labels[subtype] || subtype || 'state changed';
    }

    formatFeedTalkLine(time, speakerLabel, phrase, targetText = null) {
        const suffix = targetText ? ` (To: ${targetText})` : '';
        return this.createFeedEntryShape({
            timeLabel: time,
            headline: targetText ? `${speakerLabel} -> ${targetText}` : speakerLabel,
            detail: phrase,
            line: `${time}-${speakerLabel}: ${phrase}${suffix}`,
            category: 'talk',
            targetText
        });
    }

    formatFeedActionLine(time, actorLabel, action, targetLabel = null, options = {}) {
        return this.createFeedEntryShape({
            timeLabel: time,
            headline: targetLabel ? `${actorLabel} -> ${targetLabel}` : actorLabel,
            detail: action,
            grounding: options.grounding || '',
            line: targetLabel
                ? `${time}-${actorLabel}->${targetLabel}: ${action}`
                : `${time}-${actorLabel}: ${action}`,
            category: options.category || 'action',
            targetText: targetLabel || null,
            contextTags: options.contextTags || [],
            consequenceTail: options.consequenceTail || null,
            threatSignalId: options.threatSignalId || null,
            dangerMemoryId: options.dangerMemoryId || null,
            safetyAvoidanceTrigger: options.safetyAvoidanceTrigger || null
        });
    }

    buildStableFeedActionCausalityTail(cause, actionLabel = null) {
        const causeLabel = this.formatBehaviorReasonLabel(cause);
        const actionText = this.formatActionSubtypeLabel(actionLabel);
        if (!causeLabel && !actionText) return null;
        return `Because ${causeLabel || 'this work matters'}${actionText ? ` -> ${actionText}` : ''}`;
    }

    buildFeedActionCausalityTail(data = {}, options = {}) {
        const entityId = data?.sourceId || data?.butterflyId || data?.entityId || null;
        const entity = this.getButterflyById(entityId);
        const fallbackTail = options.fallbackCause
            ? this.buildStableFeedActionCausalityTail(options.fallbackCause, options.fallbackAction)
            : null;
        if (!entity?.id) return fallbackTail;
        const state = gameCore?.getGameState ? gameCore.getGameState() : gameCore?.gameState;
        const communicationSummary = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getCommunicationSummary?.(entity.id)
            : null;
        const lifeSimSummary = typeof lifeSimSystem !== 'undefined'
            ? lifeSimSystem.getEntitySummary?.(entity.id)
            : null;
        const line = this.buildCurrentActionCausalityLine(entity, state, communicationSummary, lifeSimSummary);
        if (!line) return fallbackTail;
        if (options.expectedActionPattern && !options.expectedActionPattern.test(line)) {
            return fallbackTail;
        }
        return line.replace(/^Acting because\s+/i, 'Because ');
    }

    formatFeedLearnLine(time, actorLabel, lessonText, options = {}) {
        return this.createFeedEntryShape({
            timeLabel: time,
            headline: actorLabel,
            detail: lessonText,
            grounding: options.grounding || '',
            line: `${time}-${actorLabel}: ${lessonText}`,
            category: 'learn',
            contextTags: options.contextTags || []
        });
    }

    getDialogueTargetText(data = {}) {
        if (data?.talkMode === 'open_talk') return null;
        const targetLabels = Array.isArray(data?.targetLabels) ? data.targetLabels.filter(Boolean) : [];
        const targetIds = Array.isArray(data?.targetIds) ? data.targetIds.filter(Boolean) : [];
        if (targetLabels.length > 1 || targetIds.length > 1) {
            return `${Math.max(targetLabels.length, targetIds.length)} butterflies`;
        }
        return targetLabels[0] || data?.targetLabel || targetIds[0] || null;
    }

    formatActivityEntry(entry) {
        const data = entry?.data || {};
        const event = entry?.event || 'event';
        const time = new Date(entry?.timestamp || Date.now()).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        });

        const butterflyLabel = this.getEntityDisplayName(data?.butterfly, data?.butterflyId || data?.entityId || 'Butterfly');
        const flowerLabel = data?.flower?.flowerType || data?.flowerId || 'flower';
        const teacherLabel = this.getEntityDisplayName(
            data?.teacher || this.getButterflyById(data?.teacherId),
            data?.teacherId || 'Teacher'
        );
        const listenerLabel = this.getEntityDisplayName(
            data?.listener || this.getButterflyById(data?.listenerId),
            data?.listenerId || 'Listener'
        );
        const sourceLabel = this.getEntityDisplayName(this.getButterflyById(data?.sourceId), data?.sourceId || 'Butterfly');
        const targetLabel = this.getEntityDisplayName(this.getButterflyById(data?.targetId), data?.targetId || 'Butterfly');
        const recipientLabel = this.getEntityDisplayName(this.getButterflyById(data?.recipientId), data?.recipientId || 'Butterfly');
        const contributorLabels = Array.isArray(data?.contributorIds)
            ? data.contributorIds
                .slice(0, 3)
                .map(id => this.getEntityDisplayName(this.getButterflyById(id), id))
                .filter(Boolean)
            : [];
        const countLabel = Array.isArray(data?.butterflyIds) ? data.butterflyIds.length : 0;
        const zoneLabel = this.getZoneDisplayName(data?.zoneId || data?.toZoneId || data?.focusedZoneId);
        const formattedButterflyState = this.formatButterflyStateFeedEntry(time, data);
        const formattedDialogue = event === (GameEvents?.DIALOGUE_SPOKEN || 'communication:dialogueSpoken')
            ? this.formatFeedTalkLine(time, sourceLabel, data?.phrase || '...', this.getDialogueTargetText(data))
            : null;

        const byEvent = {
            [GameEvents?.DIALOGUE_SPOKEN || 'communication:dialogueSpoken']: formattedDialogue,
            [GameEvents?.TEACHING_COMPLETED || 'teaching:completed']: this.formatFeedLearnLine(time, listenerLabel, `Learned from ${teacherLabel}.`, {
                grounding: `${zoneLabel} • lesson in view`
            }),
            [GameEvents?.TRAINING_DRILL_COMPLETED || 'training:drillCompleted']: this.formatFeedLearnLine(time, listenerLabel, `Completed the ${data?.stationLabel || zoneLabel} drill.`, {
                grounding: `${zoneLabel} • station run in view`
            }),
            [GameEvents?.FLOWER_EGG_LAID || 'flower:eggLaid']: this.formatFeedActionLine(time, this.getEntityDisplayName(this.getButterflyById(data?.motherId), 'Butterfly'), `Laid an egg on ${flowerLabel}.`, null, {
                grounding: `${zoneLabel} • flower edge`
            }),
            [GameEvents?.CATERPILLAR_HATCHED || 'lifecycle:caterpillarHatched']: this.formatFeedActionLine(time, 'Caterpillar', 'Hatched from an egg.'),
            [GameEvents?.CHRYSALIS_FORMED || 'lifecycle:chrysalisFormed']: this.formatFeedActionLine(time, 'Caterpillar', 'Formed a chrysalis.'),
            [GameEvents?.HYBRID_BORN || 'lifecycle:hybridBorn']: this.formatFeedActionLine(time, this.getEntityDisplayName(data?.butterfly, 'Hybrid'), 'Emerged from a chrysalis.'),
            [GameEvents?.BUTTERFLY_STATE_CHANGED || 'butterfly:stateChanged']: formattedButterflyState,
            [GameEvents?.OBJECT_PICKED_UP || 'object:pickedUp']: this.formatFeedActionLine(
                time,
                sourceLabel,
                `${data?.objectType === 'block' ? 'Picked up a shelter block.' : `Picked up ${data?.objectType || data?.subtype || 'an object'}.`}`,
                null,
                {
                    grounding: `${zoneLabel} • ${data?.objectType === 'block' ? 'material gather' : 'object in reach'}`,
                    consequenceTail: this.buildFeedActionCausalityTail(data)
                }
            ),
            [GameEvents?.OBJECT_DROPPED || 'object:dropped']: this.formatFeedActionLine(
                time,
                sourceLabel,
                `${data?.objectType === 'block' ? 'Set down a carried block.' : `Set down ${data?.objectType || data?.subtype || 'an object'}.`}`,
                null,
                {
                    grounding: `${zoneLabel} • ${data?.objectType === 'block' ? 'material release' : 'object in reach'}`,
                    consequenceTail: this.buildFeedActionCausalityTail(data)
                }
            ),
            [GameEvents?.OBJECT_DELIVERED || 'object:delivered']: this.formatFeedActionLine(
                time,
                sourceLabel,
                `${data?.objectType === 'block' ? 'Delivered a shelter block.' : `Delivered ${data?.objectType || data?.subtype || 'an object'}.`}`,
                null,
                {
                    grounding: `${zoneLabel} • ${data?.objectType === 'block' ? 'material handoff' : 'object handoff'}`,
                    consequenceTail: this.buildFeedActionCausalityTail(data)
                }
            ),
            ['object:placed']: this.formatFeedActionLine(
                time,
                sourceLabel,
                data?.objectType === 'block'
                    ? `${data?.placementMode === 'stacked' ? 'Stacked a shelter block.' : 'Placed a shelter block.'}`
                    : `${data?.placementMode === 'stacked' ? 'Stacked' : 'Placed'} ${data?.objectType || data?.subtype || 'an object'}.`,
                null,
                {
                    grounding: `${zoneLabel} • ${data?.objectType === 'block' ? 'material placement' : 'object placement'}`,
                    consequenceTail: this.buildFeedActionCausalityTail(data, {
                        expectedActionPattern: /shade|shelter|block/i,
                        fallbackCause: data?.objectType === 'block' ? 'shelter blocks change rest space' : 'object placement changes the shared space',
                        fallbackAction: data?.objectType === 'block' ? 'shade-rest' : 'object-placement'
                    })
                }
            ),
            ['environment:project-completed']: this.formatFeedActionLine(
                time,
                contributorLabels.length ? contributorLabels.join(' + ') : 'Butterflies',
                data?.type === 'shadeShelter'
                    ? 'Finished a shared shade shelter.'
                    : 'Finished a shared project.',
                null,
                {
                    category: 'action',
                    grounding: `${zoneLabel} • ${data?.memoryCount || 0} memories • ${data?.edgeUpdateCount || 0} bond updates${this.formatProjectRoleGrounding(data?.contributorRoles)}`,
                    contextTags: ['shared work', 'shelter', 'cooperation'],
                    consequenceTail: this.buildFeedActionCausalityTail({ ...data, sourceId: data?.contributorIds?.[0] || data?.sourceId })
                }
            ),
            ['ecology:cleanup-object-cleaned']: this.formatFeedActionLine(
                time,
                butterflyLabel,
                data?.cleanupKind === 'depleted-reserve-food'
                    ? 'Cleaned spent reserve food.'
                    : 'Cleaned a dirt pile.',
                null,
                {
                    category: 'action',
                    grounding: `${zoneLabel} • cleared occupied grid cell`,
                    contextTags: ['cleanup', 'ecology', 'garden work'],
                    consequenceTail: this.buildFeedActionCausalityTail({
                        ...data,
                        sourceId: data?.butterflyId || data?.sourceId
                    }, {
                        expectedActionPattern: /dirty|clean|cleanup|planting/i,
                        fallbackCause: 'dirty ground blocks planting',
                        fallbackAction: 'cleanup'
                    })
                }
            ),
            ['pollen:handoff']: this.formatFeedActionLine(
                time,
                sourceLabel,
                `Passed pollen to ${recipientLabel}.`,
                null,
                {
                    category: 'action',
                    grounding: `${zoneLabel} • shared planting`,
                    contextTags: ['pollen', 'handoff', 'cooperation'],
                    consequenceTail: this.buildFeedActionCausalityTail(data)
                }
            ),
            ['pollen:planted']: this.formatFeedActionLine(
                time,
                butterflyLabel,
                'Planted pollen for a new flower.',
                null,
                {
                    category: 'action',
                    grounding: `${zoneLabel} • reserved grid cell`,
                    contextTags: ['pollen', 'planting', 'garden work'],
                    consequenceTail: this.buildFeedActionCausalityTail(data, {
                        expectedActionPattern: /pollen|earlier talk/i,
                        fallbackCause: 'pollen can become future food',
                        fallbackAction: 'pollen-planting'
                    })
                }
            ),
            ['pollen:bloomed']: this.formatFeedActionLine(
                time,
                'Garden',
                'A planted flower bloomed.',
                null,
                {
                    category: 'action',
                    grounding: `${zoneLabel} • pollen patch matured`,
                    contextTags: ['pollen', 'flower', 'ecology']
                }
            ),
            ['pollen:expired']: this.formatFeedActionLine(
                time,
                butterflyLabel,
                'Lost unused pollen.',
                null,
                {
                    category: 'action',
                    grounding: `${zoneLabel} • pollen faded`,
                    contextTags: ['pollen', 'expiry']
                }
            ),
            [GameEvents?.BATTLE_ACTION_OCCURRED || 'battle:actionOccurred']: this.formatBattleFeedEntry(time, data)
        };

        const message = byEvent[event];
        if (!message) return null;

        const categoryByEvent = {
            [GameEvents?.DIALOGUE_SPOKEN || 'communication:dialogueSpoken']: 'talk',
            [GameEvents?.TEACHING_COMPLETED || 'teaching:completed']: 'learn',
            [GameEvents?.TRAINING_DRILL_COMPLETED || 'training:drillCompleted']: 'learn',
            [GameEvents?.FLOWER_EGG_LAID || 'flower:eggLaid']: 'action',
            [GameEvents?.CATERPILLAR_HATCHED || 'lifecycle:caterpillarHatched']: 'action',
            [GameEvents?.CHRYSALIS_FORMED || 'lifecycle:chrysalisFormed']: 'action',
            [GameEvents?.HYBRID_BORN || 'lifecycle:hybridBorn']: 'action',
            [GameEvents?.BUTTERFLY_STATE_CHANGED || 'butterfly:stateChanged']: 'action',
            [GameEvents?.OBJECT_PICKED_UP || 'object:pickedUp']: 'action',
            [GameEvents?.OBJECT_DROPPED || 'object:dropped']: 'action',
            [GameEvents?.OBJECT_DELIVERED || 'object:delivered']: 'action',
            ['object:placed']: 'action',
            ['environment:project-completed']: 'action',
            ['ecology:cleanup-object-cleaned']: 'action',
            ['pollen:handoff']: 'action',
            ['pollen:planted']: 'action',
            ['pollen:bloomed']: 'action',
            ['pollen:expired']: 'action',
            [GameEvents?.BATTLE_ACTION_OCCURRED || 'battle:actionOccurred']: 'action'
        };

        const signatureParts = [
            event,
            data?.entityId,
            data?.butterflyId,
            data?.teacherId,
            data?.listenerId,
            data?.sourceId,
            data?.targetId,
            ...(Array.isArray(data?.contributorIds) ? data.contributorIds : []),
            data?.subtype,
            data?.to,
            data?.label,
            data?.zoneId || data?.toZoneId || data?.focusedZoneId
        ].filter(value => value !== undefined && value !== null && value !== '');

        return {
            line: message.line,
            signature: signatureParts.join('|'),
            category: this.normalizeFeedCategory(message.category || categoryByEvent[event] || 'action'),
            headline: message.headline || null,
            detail: message.detail || null,
            grounding: message.grounding || null,
            contextTags: message.contextTags || [],
            timeLabel: message.timeLabel || null,
            targetText: message.targetText || null,
            consequenceTail: message.consequenceTail || null,
            threatSignalId: message.threatSignalId || data?.threatSignalId || null,
            dangerMemoryId: message.dangerMemoryId || data?.dangerMemoryId || null,
            safetyAvoidanceTrigger: message.safetyAvoidanceTrigger || data?.safetyAvoidanceTrigger || null
        };
    }

    formatButterflyStateFeedEntry(time, data = {}) {
        const butterflyLabel = this.getEntityDisplayName(data?.butterfly, 'Butterfly');
        const warningGrounding = data?.threatSignalId || data?.dangerMemoryId || data?.safetyAvoidanceTrigger;
        if (data?.to === 'scared' && warningGrounding) {
            return this.formatFeedActionLine(time, butterflyLabel, 'Reacted to danger.', null, {
                category: 'warning',
                grounding: data?.safetyAvoidanceTrigger
                    ? `Safety trigger: ${data.safetyAvoidanceTrigger}`
                    : 'Danger signal in view',
                threatSignalId: data?.threatSignalId || null,
                dangerMemoryId: data?.dangerMemoryId || null,
                safetyAvoidanceTrigger: data?.safetyAvoidanceTrigger || null
            });
        }
        if (data?.to !== 'mating') return null;
        const partnerId = data?.butterfly?.breeding?.partnerId || null;
        const partnerLabel = partnerId
            ? this.getEntityDisplayName(this.getButterflyById(partnerId), partnerId)
            : null;
        return this.formatFeedActionLine(time, butterflyLabel, 'Mating began.', partnerLabel);
    }

    formatBattleFeedEntry(time, data = {}) {
        const actorLabel = this.getEntityDisplayName(this.getButterflyById(data?.actorId), data?.actorId || 'Butterfly');
        const targetLabel = data?.targetId
            ? this.getEntityDisplayName(this.getButterflyById(data.targetId), data.targetId)
            : null;
        const grounding = data?.abilityLabel
            ? `Arena exchange • ${data.abilityLabel}`
            : 'Arena exchange • live battle';
        if (data?.type === 'attack') {
            return this.formatFeedActionLine(time, actorLabel, `Struck for ${data?.damage || 0} damage.`, targetLabel, {
                grounding
            });
        }
        if (data?.type === 'rally') {
            return this.formatFeedActionLine(time, actorLabel, `Rallied for ${data?.restoredHp || 0} recovery.`, targetLabel, {
                grounding
            });
        }
        if (data?.type === 'guard') {
            return this.formatFeedActionLine(time, actorLabel, `Guarded and recovered ${data?.restoredHp || 0} HP.`, null, {
                grounding
            });
        }
        if (data?.type === 'retreat') {
            return this.formatFeedActionLine(time, actorLabel, 'Retreated from battle.', null, {
                grounding
            });
        }
        return null;
    }

    drawActivityLogPanel(graphics, gameState) {
        this.syncPanelLayouts(gameState);
        const panel = this.activityLogPanel;
        this.normalizeActivityLogFilters();
        const highContrast = this.accessibilitySettings.highContrastUI;
        const compactScale = Math.max(0.42, this.getEffectiveUiScale() * 0.52);
        const liveEntries = this.getRecentActivityEntries();
        const panelFill = highContrast ? [0, 0, 0, 244] : [20, 24, 30, 196];
        const accent = highContrast ? [255, 255, 255] : [210, 228, 255];
        const footerText = highContrast ? [255, 255, 255] : [185, 190, 198];
        const selectedTarget = this.getLockedInspectTarget(gameState);
        const contextKey = `${selectedTarget?.id || 'all'}:${gameState?.focusedZoneId || 'garden'}`;
        const filterButtons = this.getFeedFilterButtons();
        const filterBottom = filterButtons.length
            ? Math.max(...filterButtons.map(button => button.y + button.height))
            : (panel.y + 10);
        const enabledFilters = Object.entries(panel.filters || {})
            .filter(([, enabled]) => enabled)
            .map(([key]) => key);
        const contextLabel = this.getFeedContextLabel(gameState, selectedTarget);

        graphics.push();
        graphics.fill(...panelFill);
        graphics.stroke(...accent, 220);
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.rect(panel.x, panel.y, panel.width, panel.height, 8);

        for (const button of filterButtons) {
            const enabled = panel.filters?.[button.id] !== false;
            const buttonStyle = button.style || this.getFeedCategoryStyle(button.id, highContrast);
            graphics.stroke(...accent, enabled ? 220 : 90);
            graphics.strokeWeight(highContrast ? 2 : 1);
            graphics.fill(...(enabled
                ? buttonStyle.filterFill
                : (highContrast ? [0, 0, 0, 255] : [32, 38, 48, 210])));
            graphics.rect(button.x, button.y, button.width, button.height, 5);
            graphics.noStroke();
            graphics.fill(...(enabled
                ? buttonStyle.filterText
                : [255, 255, 255, 255]));
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(Math.max(4, Math.round(4.5 * compactScale)));
            graphics.text(button.label, button.x + button.width / 2, button.y + button.height / 2 + 1);
        }

        const contextY = filterBottom + 4;
        graphics.textAlign(LEFT, TOP);
        graphics.fill(...footerText);
        graphics.textSize(Math.max(4, Math.round(4.8 * compactScale)));
        graphics.text(contextLabel, panel.x + 8, contextY);
        const contentY = contextY + Math.max(10, Math.round(10 * compactScale));
        const viewportHeight = panel.height - (contentY - panel.y) - Math.max(16, Math.round(18 * compactScale));
        const sourceEntries = panel.followLatest ? liveEntries : (panel.frozenEntries || liveEntries);
        const filteredEntries = sourceEntries.filter(entry => enabledFilters.includes(entry.category));
        const entries = filteredEntries.length > 0
            ? filteredEntries
            : [this.createFeedEntryShape({
                headline: enabledFilters.length ? 'No visible activity' : 'No filters enabled',
                detail: enabledFilters.length
                    ? 'Nothing in view matches the active feed filters.'
                    : 'Turn a feed filter back on to refill the feed.',
                line: enabledFilters.length ? 'No visible activity for current filters' : 'Select at least one feed filter',
                category: 'system'
            })];
        this.lastFeedPresentation = {
            contextLabel,
            entryCount: entries.length,
            entries: entries.slice(-16).map(entry => ({
                category: this.normalizeFeedCategory(entry.category || 'action'),
                headline: entry.headline || null,
                detail: entry.detail || entry.line || null,
                footer: this.buildFeedContextFooter(entry),
                grounding: entry.grounding || null,
                pairTextureLabel: entry.pairTextureLabel || null,
                referencedMemoryPacketId: entry.referencedMemoryPacketId || null,
                causeLabel: entry.causeLabel || null,
                phraseTemplateId: entry.phraseTemplateId || null,
                conversationId: entry.conversationId || null,
                threadCount: Array.isArray(entry.threadLines) ? entry.threadLines.length : 0,
                threadLines: Array.isArray(entry.threadLines) ? entry.threadLines.map(line => ({
                    speakerLabel: line?.speakerLabel || null,
                    phrase: line?.phrase || null,
                    heardMeaning: line?.heardMeaning || null
                })) : null,
                consequenceTail: entry.consequenceTail || null
            })),
            updatedAt: Date.now()
        };

        if (panel.lastContextKey !== contextKey) {
            this.resumeLatestFeedView();
            panel.lastContextKey = contextKey;
        }
        const cardGap = Math.max(4, Math.round(4 * compactScale));
        const cardX = panel.x + 8;
        const cardWidth = panel.width - 16;
        const measuredEntries = entries.map(entry => ({
            entry,
            measurement: this.measureFeedEntryCard(graphics, entry, cardWidth, compactScale)
        }));
        const contentHeight = measuredEntries.reduce((sum, item, index) => {
            return sum + item.measurement.height + (index < measuredEntries.length - 1 ? cardGap : 0);
        }, 0);
        const maxScroll = Math.max(0, Math.ceil((contentHeight - viewportHeight) / panel.lineHeight));
        panel.scrollOffset = Math.max(0, Math.min(panel.scrollOffset || 0, maxScroll));
        const scrollPixels = Math.min(
            Math.max(0, contentHeight - viewportHeight),
            (panel.scrollOffset || 0) * panel.lineHeight
        );

        const drawContext = graphics.drawingContext;
        drawContext.save();
        drawContext.beginPath();
        drawContext.rect(panel.x + 4, contentY - 2, panel.width - 8, viewportHeight + 4);
        drawContext.clip();

        let y = contentY + viewportHeight - contentHeight + scrollPixels;
        for (const item of measuredEntries) {
            if ((y + item.measurement.height) < (contentY - cardGap)) {
                y += item.measurement.height + cardGap;
                continue;
            }
            if (y > (contentY + viewportHeight + cardGap)) {
                break;
            }
            this.drawFeedEntryCard(graphics, item.entry, {
                x: cardX,
                y,
                width: cardWidth,
                height: item.measurement.height
            }, compactScale, highContrast);
            y += item.measurement.height + cardGap;
        }
        drawContext.restore();

        if (!panel.followLatest || maxScroll > 0) {
            const resumeRect = this.getFeedResumeButtonRect();
            graphics.stroke(...accent, 220);
            graphics.strokeWeight(highContrast ? 2 : 1);
            graphics.noFill();
            graphics.rect(resumeRect.x, resumeRect.y, resumeRect.width, resumeRect.height, 3);
            graphics.noStroke();
            graphics.fill(...footerText);
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(Math.max(5, Math.round(5.5 * compactScale)));
            graphics.text('<', resumeRect.x + resumeRect.width / 2, resumeRect.y + resumeRect.height / 2 + 1);
            graphics.fill(...footerText);
            graphics.textAlign(LEFT, BOTTOM);
            graphics.text(
                panel.followLatest ? 'Scroll for older entries' : 'Viewing older entries',
                resumeRect.x + resumeRect.width + 6,
                panel.y + panel.height - 8
            );
        }

        graphics.pop();
    }

    getAccessibilitySettings() {
        return { ...this.accessibilitySettings };
    }

    markSaveStatus(state = 'idle', label = 'Not saved yet') {
        this.saveStatus = {
            state,
            label,
            atMs: Date.now()
        };
    }

    requestManualSave() {
        if (typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return false;
        try {
            this.markSaveStatus('saving', 'Saving...');
            gameCore.saveGameToStorage?.({ source: 'manual' });
            return true;
        } catch (error) {
            this.markSaveStatus('error', `Save failed`);
            return false;
        }
    }

    loadPersistedAccessibilitySettings() {
        if (typeof localStorage === 'undefined') return {};
        try {
            return JSON.parse(localStorage.getItem(PAPILIONEM_ACCESSIBILITY_KEY) || '{}') || {};
        } catch (_error) {
            return {};
        }
    }

    loadRuntimeAccessibilityOverrides() {
        if (typeof window === 'undefined') return {};
        const overrides = window.__PAPILIONEM_ACCESSIBILITY_OVERRIDES__;
        if (!overrides || typeof overrides !== 'object') return {};
        return { ...overrides };
    }

    persistAccessibilitySettings() {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(PAPILIONEM_ACCESSIBILITY_KEY, JSON.stringify(this.accessibilitySettings));
        } catch (_error) {
            // Ignore local persistence failures - UI should still function.
        }
    }

    setAccessibilitySettings(nextSettings = {}) {
        if (!nextSettings || typeof nextSettings !== 'object') return this.getAccessibilitySettings();
        this.accessibilitySettings = {
            ...this.accessibilitySettings,
            ...nextSettings
        };
        this.accessibilitySettings.colorblindSafeIndicators = this.accessibilitySettings.colorblindMode !== 'off';
        this.persistAccessibilitySettings();
        return this.getAccessibilitySettings();
    }

    toggleAccessibilitySetting(key) {
        this.accessibilitySettings[key] = !this.accessibilitySettings[key];
        if (key === 'highContrastUI' && this.accessibilitySettings[key]) {
            this.accessibilitySettings.colorblindMode = this.accessibilitySettings.colorblindMode || 'off';
        }
        this.persistAccessibilitySettings();
        return this.accessibilitySettings[key];
    }

    cycleAccessibilitySetting(key, values) {
        const currentIndex = values.indexOf(this.accessibilitySettings[key]);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % values.length : 0;
        this.accessibilitySettings[key] = values[nextIndex];
        this.persistAccessibilitySettings();
        return this.accessibilitySettings[key];
    }

    cycleColorblindMode() {
        const modes = ['off', 'protanopia', 'deuteranopia', 'tritanopia', 'monochrome'];
        const currentIndex = modes.indexOf(this.accessibilitySettings.colorblindMode || 'off');
        const nextMode = modes[(currentIndex + 1) % modes.length];
        this.accessibilitySettings.colorblindMode = nextMode;
        this.accessibilitySettings.colorblindSafeIndicators = nextMode !== 'off';
        this.persistAccessibilitySettings();
        return nextMode;
    }

    disableColorblindMode() {
        this.accessibilitySettings.colorblindMode = 'off';
        this.accessibilitySettings.colorblindSafeIndicators = false;
        this.persistAccessibilitySettings();
        return 'off';
    }

    getAccessibilityControlButtons() {
        const panel = this.accessibilityPanel;
        const compactScale = Math.max(0.42, this.getEffectiveUiScale() * 0.52);
        const startX = panel.x + 10;
        const startY = panel.y + 36;
        const width = panel.width - 20;
        const height = Math.max(12, Math.round(16 * compactScale));
        const gap = Math.max(4, Math.round(4 * compactScale));

        return [
            {
                id: 'highContrastUI',
                x: startX,
                y: startY,
                width,
                height,
                label: 'High contrast',
                value: this.accessibilitySettings.highContrastUI ? 'On' : 'Off'
            },
            {
                id: 'trailVisibility',
                x: startX,
                y: startY + (height + gap) * 1,
                width,
                height,
                label: 'Trails',
                value: this.accessibilitySettings.trailVisibility
            },
            {
                id: 'cycleColorblindMode',
                x: startX,
                y: startY + (height + gap) * 2,
                width,
                height,
                label: 'Color mode',
                value: this.accessibilitySettings.colorblindMode || 'off'
            },
            {
                id: 'disableColorblindMode',
                x: startX,
                y: startY + (height + gap) * 3,
                width,
                height,
                label: 'Color off',
                value: this.accessibilitySettings.colorblindMode === 'off' ? 'Off' : 'Reset'
            }
        ];
    }

    activateAccessibilityControl(controlId) {
        switch (controlId) {
            case 'highContrastUI':
                this.toggleAccessibilitySetting('highContrastUI');
                return true;
            case 'trailVisibility':
                this.cycleAccessibilitySetting('trailVisibility', ['off', 'reduced', 'full']);
                return true;
            case 'cycleColorblindMode':
                this.cycleColorblindMode();
                return true;
            case 'disableColorblindMode':
                this.disableColorblindMode();
                return true;
            default:
                return false;
        }
    }

    getAccessibilitySliderRect() {
        const panel = this.accessibilityPanel;
        const controls = this.getAccessibilityControlButtons();
        const lastControl = controls[controls.length - 1];
        return {
            x: panel.x + 10,
            y: lastControl.y + lastControl.height + 8,
            width: panel.width - 20,
            height: 18
        };
    }

    setUiScaleFromCanvasX(canvasX) {
        const slider = this.getAccessibilitySliderRect();
        const knobX = Math.max(slider.x, Math.min(slider.x + slider.width, canvasX));
        const ratio = (knobX - slider.x) / Math.max(1, slider.width);
        const scaled = 0.75 + (ratio * 0.5);
        this.accessibilitySettings.uiScale = Math.round(scaled * 100) / 100;
        this.persistAccessibilitySettings();
        return this.accessibilitySettings.uiScale;
    }

    setUiScaleValue(value) {
        const numeric = Number(value || 1);
        this.accessibilitySettings.uiScale = Math.max(0.75, Math.min(1.25, Math.round(numeric * 100) / 100));
        this.persistAccessibilitySettings();
        return this.accessibilitySettings.uiScale;
    }

    drawAccessibilityPanel(graphics, gameState) {
        const panel = this.accessibilityPanel;
        const uiScaleLabel = `${Math.round((this.accessibilitySettings.uiScale || 1) * 100)}%`;
        const highContrast = this.accessibilitySettings.highContrastUI;
        const compactScale = Math.max(0.42, this.getEffectiveUiScale() * 0.52);
        const panelFill = highContrast ? [0, 0, 0, 244] : [20, 24, 30, 196];
        const accent = highContrast ? [255, 255, 255] : [210, 228, 255];
        const footerText = highContrast ? [255, 255, 255] : [185, 190, 198];
        const controls = this.getAccessibilityControlButtons();
        const buttonFill = highContrast ? [0, 0, 0, 252] : [16, 20, 28, 220];
        const buttonStroke = highContrast ? [255, 255, 255, 255] : [210, 228, 255, 110];
        const buttonText = highContrast ? [255, 255, 255, 255] : [245, 248, 252, 255];
        const valueFill = highContrast ? [255, 255, 255, 248] : [100, 126, 176, 172];
        const valueText = highContrast ? [0, 0, 0, 255] : [255, 255, 255, 255];
        const slider = this.getAccessibilitySliderRect();
        const panelHeight = (slider.y + slider.height + 14) - panel.y;

        graphics.push();
        graphics.fill(...panelFill);
        graphics.stroke(...accent, 220);
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.rect(panel.x, panel.y, panel.width, panelHeight, 8);

        graphics.noStroke();
        graphics.fill(255);
        graphics.textAlign(LEFT);
        graphics.textSize(Math.max(6, Math.round((highContrast ? 9 : 8) * compactScale)));
        graphics.text('Accessibility', panel.x + 10, panel.y + 18);
        graphics.textSize(Math.max(5, Math.round(6 * compactScale)));

        for (const control of controls) {
            graphics.fill(...buttonFill);
            graphics.stroke(...buttonStroke);
            graphics.strokeWeight(highContrast ? 2 : 1);
            graphics.rect(control.x, control.y, control.width, control.height, 7);

            graphics.noStroke();
            graphics.fill(...buttonText);
            graphics.textAlign(LEFT, CENTER);
            graphics.text(control.label, control.x + 8, control.y + control.height / 2 + 1);

            const valueWidth = Math.min(
                Math.round(control.width * 0.42),
                Math.max(Math.round(32 * compactScale), this.measureTextWidth(graphics, control.value) + Math.round(8 * compactScale))
            );
            const valueX = control.x + control.width - valueWidth - 8;
            graphics.fill(...valueFill);
            graphics.rect(valueX, control.y + 3, valueWidth, control.height - 6, 6);
            graphics.fill(...valueText);
            graphics.textAlign(CENTER, CENTER);
            graphics.text(control.value, valueX + valueWidth / 2, control.y + control.height / 2 + 1);
        }

        graphics.textAlign(LEFT, TOP);
        graphics.fill(...footerText);
        graphics.textSize(Math.max(5, Math.round(5.5 * compactScale)));
        graphics.text(`UI Scale ${uiScaleLabel}`, slider.x, slider.y - 10);
        graphics.fill(...(highContrast ? [255, 255, 255, 255] : [40, 48, 62, 220]));
        graphics.rect(slider.x, slider.y + 6, slider.width, 4, 3);
        const sliderRatio = ((this.accessibilitySettings.uiScale || 1) - 0.75) / 0.5;
        const knobX = slider.x + (Math.max(0, Math.min(1, sliderRatio)) * slider.width);
        graphics.fill(...accent, 255);
        graphics.ellipse(knobX, slider.y + 8, 10, 10);
        graphics.pop();
    }

    getBattleSetupPreview(gameState) {
        return gameCore?.buildSinglePlayerAutoBattlePreview?.() ||
            rosterSystem?.getSinglePlayerAutoBattlePreview?.(gameState) ||
            null;
    }

    getBattleSetupTeamSummary(team = []) {
        const readinessScores = team
            .map(entry => entry?.battleReadinessScore)
            .filter(score => Number.isFinite(score));
        const averageReady = readinessScores.length
            ? Math.round(readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length)
            : 0;
        return {
            count: team.length,
            averageReady
        };
    }

    getBattleHudTeamPalette(teamId = 'left') {
        if (teamId === 'right') {
            return {
                frame: [118, 86, 74],
                panel: [26, 20, 18],
                row: [50, 38, 34],
                selectedRow: [134, 88, 72],
                chip: [156, 108, 88],
                hp: [236, 162, 124],
                pressure: [244, 210, 132],
                text: [255, 248, 242]
            };
        }
        return {
            frame: [106, 132, 182],
            panel: [18, 22, 28],
            row: [34, 42, 54],
            selectedRow: [82, 112, 164],
            chip: [96, 128, 182],
            hp: [122, 228, 168],
            pressure: [238, 214, 128],
            text: [246, 250, 255]
        };
    }

    getBattleHudTeamSummary(team = []) {
        const activeCount = team.filter(entry => !entry?.defeated && !entry?.retreated).length;
        const downCount = team.filter(entry => !!entry?.defeated).length;
        const outCount = team.filter(entry => !!entry?.retreated).length;
        const totalHp = team.reduce((sum, entry) => sum + Math.max(0, entry?.hp || 0), 0);
        const totalMaxHp = team.reduce((sum, entry) => sum + Math.max(1, entry?.maxHp || 100), 0);
        const hpPercent = totalMaxHp > 0 ? Math.round((totalHp / totalMaxHp) * 100) : 0;
        const avgPressure = team.length
            ? Math.round(team.reduce((sum, entry) => sum + Math.max(0, entry?.pressure || 0), 0) / team.length)
            : 0;
        const readinessScores = team
            .map(entry => entry?.statProfile?.readinessProfile?.score)
            .filter(score => Number.isFinite(score));
        const avgReady = readinessScores.length
            ? Math.round(readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length)
            : 0;
        return {
            totalCount: team.length,
            activeCount,
            downCount,
            outCount,
            totalHp,
            totalMaxHp,
            hpPercent,
            avgPressure,
            avgReady
        };
    }

    getBattleHudFocus(snapshot, recentEvents = []) {
        const selectedId = this.battleUi.selectedParticipantId;
        if (selectedId && snapshot?.participantsById?.[selectedId]) {
            return {
                participant: snapshot.participantsById[selectedId],
                source: 'selected',
                label: 'Pinned focus',
                event: null
            };
        }

        for (const event of recentEvents) {
            const actorId = event?.payload?.actorId || null;
            if (actorId && snapshot?.participantsById?.[actorId]) {
                return {
                    participant: snapshot.participantsById[actorId],
                    source: 'recent-action',
                    label: 'Latest action',
                    event
                };
            }
            const targetId = event?.payload?.targetId || null;
            if (targetId && snapshot?.participantsById?.[targetId]) {
                return {
                    participant: snapshot.participantsById[targetId],
                    source: 'recent-target',
                    label: 'Latest target',
                    event
                };
            }
        }

        const liveParticipants = Object.values(snapshot?.participantsById || {})
            .filter(participant => !participant?.defeated && !participant?.retreated);
        const pressured = [...liveParticipants]
            .sort((left, right) => {
                const pressureDelta = (right?.pressure || 0) - (left?.pressure || 0);
                if (pressureDelta !== 0) return pressureDelta;
                return (left?.hp || 0) - (right?.hp || 0);
            })[0] || null;
        if (pressured) {
            return {
                participant: pressured,
                source: 'pressure',
                label: 'Pressure focus',
                event: null
            };
        }

        const fallback = liveParticipants[0] || Object.values(snapshot?.participantsById || {})[0] || null;
        return {
            participant: fallback,
            source: fallback ? 'fallback' : 'none',
            label: fallback ? 'Field focus' : 'No focus',
            event: null
        };
    }

    getBattleEventPresentation(event, teamLabels = {}) {
        const payload = event?.payload || {};
        const trim = (value, maxLength = 18) => {
            const text = String(value || '');
            return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 3))}...` : text;
        };
        const actor = trim(payload.actorLabel || payload.actorId || 'unit', 16);
        const target = trim(payload.targetLabel || payload.targetId || 'target', 14);
        const actionLabel = payload.specialLabel || payload.abilityLabel || payload.type || event?.eventType || 'event';

        if (event?.eventType === 'round-action') {
            if (payload.type === 'rally') {
                return {
                    tag: 'SUP',
                    tone: [96, 148, 118],
                    headline: `${actor} -> ${target}`,
                    detail: `${actionLabel}${payload.restoredHp ? ` | +${Math.abs(payload.restoredHp)} HP` : ''}`
                };
            }
            if (payload.type === 'guard') {
                return {
                    tag: 'GRD',
                    tone: [94, 114, 156],
                    headline: actor,
                    detail: actionLabel
                };
            }
            if (payload.type === 'retreat') {
                return {
                    tag: 'OUT',
                    tone: [172, 132, 82],
                    headline: actor,
                    detail: 'Retreating from the field'
                };
            }
            return {
                tag: payload.specialLabel ? 'SPC' : 'ATK',
                tone: [156, 104, 96],
                headline: `${actor} -> ${target}`,
                detail: `${actionLabel}${payload.damage ? ` | -${Math.abs(payload.damage)} HP` : ''}${payload.pressure ? ` | +${Math.abs(payload.pressure)} P` : ''}`
            };
        }

        if (event?.eventType === 'participant-retreated') {
            return {
                tag: 'OUT',
                tone: [172, 132, 82],
                headline: actor,
                detail: 'Retreated from the field'
            };
        }

        if (event?.eventType === 'battle-resolved') {
            const winnerLabel = payload.winnerTeamId ? (teamLabels[payload.winnerTeamId] || payload.winnerTeamId) : 'No side';
            return {
                tag: 'END',
                tone: [120, 160, 108],
                headline: winnerLabel,
                detail: payload.summary || 'Battle resolved'
            };
        }

        if (event?.eventType === 'round-started') {
            return {
                tag: 'RD',
                tone: [98, 120, 168],
                headline: `Round ${payload.roundNumber || '?'}`,
                detail: 'Opening exchange'
            };
        }

        if (event?.eventType === 'round-finished') {
            return {
                tag: 'RD',
                tone: [94, 112, 138],
                headline: `Round ${payload.roundNumber || '?'}`,
                detail: 'Exchange resolved'
            };
        }

        if (event?.eventType === 'battle-paused') {
            return {
                tag: 'PAU',
                tone: [164, 148, 96],
                headline: 'Autobattle paused',
                detail: 'Waiting for resume'
            };
        }

        if (event?.eventType === 'battle-resumed') {
            return {
                tag: 'RUN',
                tone: [106, 152, 110],
                headline: 'Autobattle resumed',
                detail: 'Flow restored'
            };
        }

        if (event?.eventType === 'battle-speed-changed') {
            return {
                tag: 'SPD',
                tone: [116, 142, 188],
                headline: `Speed ${payload.speed || 1}x`,
                detail: 'Battle pacing changed'
            };
        }

        return {
            tag: 'EVT',
            tone: [112, 120, 136],
            headline: trim(event?.eventType || 'event', 18),
            detail: trim(JSON.stringify(payload), 28)
        };
    }

    drawBattleSetupPanel(graphics, gameState) {
        const panel = this.battleSetupPanel;
        const compactScale = Math.max(0.5, this.getEffectiveUiScale() * 0.58);
        const preview = this.getBattleSetupPreview(gameState);
        const playerSummary = this.getBattleSetupTeamSummary(preview?.playerTeam || []);
        const opponentSummary = this.getBattleSetupTeamSummary(preview?.opponentTeam || []);
        const highContrast = this.accessibilitySettings.highContrastUI;
        const fillColor = highContrast ? [0, 0, 0, 246] : [14, 18, 24, 228];
        const strokeColor = highContrast ? [255, 255, 255, 255] : [228, 236, 248, 110];
        const mutedText = highContrast ? [255, 255, 255, 255] : [190, 198, 210, 255];
        const panelText = [255, 255, 255, 255];

        panel.navigationRects = [];
        panel.actionRects = [];

        graphics.push();
        graphics.fill(...fillColor);
        graphics.stroke(...strokeColor);
        graphics.strokeWeight(highContrast ? 2 : 1);
        graphics.rect(panel.x, panel.y, panel.width, panel.height, 9);

        graphics.noStroke();
        graphics.fill(...panelText);
        graphics.textAlign(LEFT, TOP);
        graphics.textSize(Math.max(7, Math.round(8.5 * compactScale)));
        graphics.text('Battle Mode', panel.x + 8, panel.y + 8);
        graphics.textSize(Math.max(5, Math.round(5.5 * compactScale)));
        graphics.fill(...mutedText);
        graphics.text(
            `Roster ${preview?.rosterCount || 0} | Arena ${preview?.teamSize || 0}/${preview?.maxTeamSize || 0}`,
            panel.x + 8,
            panel.y + 20
        );

        const summaryY = panel.y + 32;
        const summaryWidth = Math.floor((panel.width - 22) / 2);
        const drawSummaryCard = (x, title, summary, tint) => {
            graphics.fill(tint[0], tint[1], tint[2], highContrast ? 228 : 138);
            graphics.stroke(...strokeColor);
            graphics.strokeWeight(1);
            graphics.rect(x, summaryY, summaryWidth, 24, 7);
            graphics.noStroke();
            graphics.fill(...panelText);
            graphics.textAlign(LEFT, TOP);
            graphics.textSize(Math.max(5, Math.round(5.4 * compactScale)));
            graphics.text(title, x + 6, summaryY + 5);
            graphics.textAlign(RIGHT, TOP);
            graphics.text(`x${summary.count} | R ${summary.averageReady || '--'}`, x + summaryWidth - 6, summaryY + 5);
        };
        drawSummaryCard(panel.x + 8, 'Your Team', playerSummary, [66, 84, 126]);
        drawSummaryCard(panel.x + panel.width - summaryWidth - 8, 'Garden AI', opponentSummary, [104, 72, 72]);

        graphics.textAlign(LEFT, TOP);
        graphics.fill(...mutedText);
        graphics.textSize(Math.max(5, Math.round(5.2 * compactScale)));
        const introLines = this.wrapTextLines(
            graphics,
            preview?.selectionLabel || 'Strongest eligible butterflies are auto-selected for single-player autobattle.',
            panel.width - 16,
            3
        );
        let lineY = panel.y + 62;
        for (const line of introLines) {
            graphics.text(line, panel.x + 8, lineY);
            lineY += Math.max(6, Math.round(6 * compactScale));
        }

        const buildTeamLines = (label, team) => {
            const names = (team || []).slice(0, 3).map(entry => {
                const name = entry.displayName || entry.personalityType || entry.id;
                const ready = Number.isFinite(entry.battleReadinessScore) ? Math.round(entry.battleReadinessScore) : '--';
                return `${name} · R ${ready}`;
            });
            return [label, ...(names.length ? names : ['No fighters selected'])];
        };

        const teamLines = [
            ...buildTeamLines('Your picks', preview?.playerTeam || []),
            '',
            ...buildTeamLines('Garden rivals', preview?.opponentTeam || [])
        ];

        graphics.fill(...panelText);
        let previewY = lineY + 4;
        for (const line of teamLines) {
            if (!line) {
                previewY += 4;
                continue;
            }
            const wrapped = this.wrapTextLines(graphics, line, panel.width - 16, 2);
            for (const segment of wrapped) {
                graphics.text(segment, panel.x + 8, previewY);
                previewY += Math.max(6, Math.round(6 * compactScale));
            }
        }

        const statusLine = preview?.canStart
            ? `${preview.teamSize}v${preview.teamSize} autobattle on the arena`
            : (preview?.actionLabel || preview?.reason || 'Need eligible butterflies to begin');
        const statusY = panel.y + panel.height - 40;
        graphics.fill(...mutedText);
        const statusSegments = this.wrapTextLines(graphics, statusLine, panel.width - 16, 2);
        for (let index = 0; index < statusSegments.length; index++) {
            graphics.text(statusSegments[index], panel.x + 8, statusY + (index * Math.max(6, Math.round(6 * compactScale))));
        }

        const actionButtons = [
            {
                id: 'start-battle',
                label: preview?.canStart ? `Start ${preview.teamSize}v${preview.teamSize}` : (preview?.actionLabel || 'Need fighters'),
                x: panel.x + 8,
                y: panel.y + panel.height - 18,
                width: panel.width - 16,
                height: 14,
                fill: preview?.canStart ? [94, 62, 44] : [54, 54, 54]
            }
        ];
        for (const button of actionButtons) {
            graphics.fill(...button.fill, 228);
            graphics.stroke(...strokeColor);
            graphics.strokeWeight(1);
            graphics.rect(button.x, button.y, button.width, button.height, 6);
            graphics.noStroke();
            graphics.fill(...panelText);
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(Math.max(4, Math.round(4.8 * compactScale)));
            graphics.text(button.label, button.x + button.width / 2, button.y + button.height / 2 + 1);
            panel.actionRects.push(button);
        }

        graphics.pop();
    }

    handleBattleSetupMousePressed(point, gameState) {
        const panel = this.battleSetupPanel;
        const preview = this.getBattleSetupPreview(gameState);

        for (const rect of panel.actionRects || []) {
            if (!this.isInsideRect(point, rect)) continue;
            if (rect.id === 'start-battle') {
                if (!preview?.canStart) return true;
                const snapshot = gameCore?.startSinglePlayerAutoBattleSession?.();
                if (snapshot) {
                    panel.visible = false;
                    this.battleUi.selectedParticipantId = null;
                }
                return !!snapshot;
            }
        }

        return false;
    }

    drawBattleHud(graphics, gameState) {
        const snapshot = typeof battleSystem !== 'undefined'
            ? battleSystem.getSnapshot?.(gameState.activeBattleId)
            : null;
        if (!snapshot) return;
        this.battleUi.selectedParticipantId = null;

        const compactScale = Math.max(0.5, this.getEffectiveUiScale() * 0.62);
        const railPanel = { x: Math.round((gameConfig.canvas.baseWidth / 2) - 180), y: gameConfig.canvas.baseHeight - 40, width: 360, height: 28 };
        const resultPanel = { x: Math.round((gameConfig.canvas.baseWidth / 2) - 166), y: 14, width: 332, height: 72 };
        const teams = Object.values(snapshot.teams || {});
        const leftTeamId = teams[0]?.teamId || 'left';
        const rightTeamId = teams[1]?.teamId || 'right';
        const teamLabels = snapshot.metadata?.teamLabels || { left: 'Your Team', right: 'Garden AI' };
        const getParticipants = (teamId) => (snapshot.teams?.[teamId]?.participantIds || [])
            .map(id => snapshot.participantsById?.[id])
            .filter(Boolean);
        const leftParticipants = getParticipants(leftTeamId);
        const rightParticipants = getParticipants(rightTeamId);
        const recentEvents = battleSystem?.getRecentBattleEvents?.(snapshot.battleId, 6) || [];
        const metadata = snapshot.metadata || {};
        const autoPaused = !!metadata.autoBattlePaused;
        const resultReady = !!snapshot.result;
        const leftSummary = this.getBattleHudTeamSummary(leftParticipants);
        const rightSummary = this.getBattleHudTeamSummary(rightParticipants);
        const focusInfo = this.getBattleHudFocus(snapshot, recentEvents);
        const focusParticipant = focusInfo.participant || null;
        const focusEventCard = focusInfo.event
            ? this.getBattleEventPresentation(focusInfo.event, teamLabels)
            : null;
        const eventItems = recentEvents
            .slice(0, 4)
            .map(event => ({
                id: event?.id || null,
                ...this.getBattleEventPresentation(event, teamLabels)
            }));

        this.battleUi.participantRects = [];
        this.battleUi.controlRects = [];
        this.battleUi.teamSummaries = {
            [leftTeamId]: leftSummary,
            [rightTeamId]: rightSummary
        };
        this.battleUi.eventItems = eventItems;
        this.battleUi.focusSummary = {
            participantId: focusParticipant?.id || null,
            source: focusInfo.source,
            label: focusInfo.label,
            eventId: focusInfo.event?.id || null
        };
        this.battleUi.statusSummary = {
            roundNumber: metadata.roundNumber || 0,
            autoPaused,
            resultReady,
            resultSummary: snapshot.result?.summary || null
        };

        graphics.push();
        const drawSoftPanel = (rect, alpha = 212) => {
            graphics.fill(12, 16, 22, alpha);
            graphics.stroke(235, 241, 252, 110);
            graphics.strokeWeight(1);
            graphics.rect(rect.x, rect.y, rect.width, rect.height, 10);
        };
        const drawControl = (rect, fillColor) => {
            graphics.fill(fillColor[0], fillColor[1], fillColor[2], 226);
            graphics.stroke(255, 255, 255, 84);
            graphics.strokeWeight(1);
            graphics.rect(rect.x, rect.y, rect.width, rect.height, 6);
            graphics.noStroke();
            graphics.fill(255);
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(Math.max(5, Math.round(5.7 * compactScale)));
            graphics.text(rect.label, rect.x + (rect.width / 2), rect.y + (rect.height / 2) + 1);
        };

        const pauseRect = {
            id: 'togglePause',
            label: autoPaused ? 'Resume' : 'Pause',
            x: railPanel.x + 6,
            y: railPanel.y + 5,
            width: 72,
            height: 18
        };
        const commitRect = resultReady
            ? {
                id: 'commitBattle',
                label: 'Return to Garden',
                x: railPanel.x + railPanel.width - 130,
                y: railPanel.y + 5,
                width: 124,
                height: 18
            }
            : null;
        this.battleUi.controlRects.push(pauseRect);
        if (commitRect) {
            this.battleUi.controlRects.push(commitRect);
        }

        const roundText = resultReady
            ? snapshot.result?.summary || 'Battle resolved'
            : autoPaused
                ? `Round ${metadata.roundNumber || 0} paused`
                : `Round ${metadata.roundNumber || 0} unfolding`;
        const teamText = `${teamLabels[leftTeamId] || leftTeamId} ${leftSummary.activeCount}/${leftSummary.totalCount}  |  ${teamLabels[rightTeamId] || rightTeamId} ${rightSummary.activeCount}/${rightSummary.totalCount}`;
        const eventText = focusEventCard
            ? `${focusEventCard.headline} • ${focusEventCard.detail}`
            : (focusParticipant ? `${focusInfo.label} • ${this.getEntityDisplayName(focusParticipant, 'Butterfly')}` : 'Battle log continues in the background');

        drawSoftPanel(railPanel, 218);
        drawControl(pauseRect, [88, 66, 50]);
        if (commitRect) {
            drawControl(commitRect, [78, 110, 70]);
        }

        graphics.noStroke();
        graphics.fill(255);
        graphics.textAlign(CENTER, TOP);
        graphics.textSize(Math.max(6, Math.round(6.8 * compactScale)));
        const railCenterX = railPanel.x + (railPanel.width / 2);
        const railTextOffset = commitRect ? -18 : 0;
        graphics.text(this.truncateText(graphics, roundText, 210), railCenterX + railTextOffset, railPanel.y + 5);
        graphics.fill(218, 226, 238, 232);
        graphics.textSize(Math.max(4, Math.round(4.7 * compactScale)));
        graphics.text(this.truncateText(graphics, teamText, 236), railCenterX + railTextOffset, railPanel.y + 15);

        if (!resultReady && eventText) {
            graphics.fill(218, 226, 238, 210);
            graphics.textSize(Math.max(4, Math.round(4.5 * compactScale)));
            graphics.text(this.truncateText(graphics, eventText, 250), railCenterX + railTextOffset, railPanel.y - 12);
        }

        if (resultReady) {
            drawSoftPanel(resultPanel, 224);
            graphics.noStroke();
            graphics.fill(255);
            graphics.textAlign(LEFT, TOP);
            graphics.textSize(Math.max(7, Math.round(8.2 * compactScale)));
            graphics.text('Battle Result', resultPanel.x + 10, resultPanel.y + 8);
            graphics.textSize(Math.max(5, Math.round(5.8 * compactScale)));
            const winnerLabel = snapshot.result?.winnerTeamId
                ? (teamLabels[snapshot.result.winnerTeamId] || snapshot.result.winnerTeamId)
                : 'Even field';
            graphics.fill(224, 236, 248, 236);
            graphics.text(winnerLabel, resultPanel.x + 10, resultPanel.y + 22);
            const resultLines = this.wrapTextLines(
                graphics,
                snapshot.result?.summary || 'Battle resolved.',
                resultPanel.width - 20,
                2
            );
            graphics.fill(242, 246, 252, 236);
            let textY = resultPanel.y + 36;
            for (const line of resultLines) {
                graphics.text(line, resultPanel.x + 10, textY);
                textY += 12;
            }
            graphics.fill(214, 224, 236, 214);
            graphics.text('Return to Garden commits the result back to the roster.', resultPanel.x + 10, resultPanel.y + resultPanel.height - 14);
        }

        this.battleUi.renderSummary = {
            focusParticipantId: focusParticipant?.id || null,
            focusSource: focusInfo.source,
            roundNumber: metadata.roundNumber || 0,
            autoPaused,
            resultReady,
            resultSummary: snapshot.result?.summary || null,
            commitLabel: commitRect?.label || null,
            eventItems: eventItems.map(item => ({ tag: item.tag, headline: item.headline, detail: item.detail })),
            teamSummaries: this.battleUi.teamSummaries,
            overlayMode: 'minimal-field',
            sidePanelsVisible: false,
            feedPanelVisible: false,
            fieldHealthBars: true,
            controlCount: this.battleUi.controlRects.length,
            roundText,
            teamText
        };
        graphics.pop();
    }

    handleBattleHudMousePressed(point, gameState) {
        const snapshot = typeof battleSystem !== 'undefined'
            ? battleSystem.getSnapshot?.(gameState.activeBattleId)
            : null;
        if (!snapshot) return false;

        for (const rect of this.battleUi.controlRects || []) {
            if (!this.isInsideRect(point, rect)) continue;
            if (rect.id === 'togglePause') {
                const current = battleSystem?.getSnapshot?.(gameState.activeBattleId);
                const paused = !(current?.metadata?.autoBattlePaused);
                return !!battleSystem?.setAutoBattlePaused?.(gameState.activeBattleId, paused);
            }
            if (rect.id === 'commitBattle') {
                if (!snapshot.result) return true;
                const committed = gameCore?.commitBattleSession?.(gameState.activeBattleId);
                if (committed) {
                    this.battleUi.selectedParticipantId = null;
                }
                return !!committed;
            }
        }

        return false;
    }
    
    // Update boundary zones visibility
    setBoundaryZonesVisible(visible) {
        this.showBoundaryZones = visible;
    }
    
    // Helper function for isometric conversion (temporary until gridManager is available)
    isoToScreen(gridX, gridY) {
        // Use unified grid system to prevent coordinate drift
        return gridManager.isoToScreen(gridX, gridY);
    }
    
    // Helper to check if screen coordinates are within the playable area
    isWithinPlayableArea(x, y) {
        // Use gridManager if available
        if (typeof gridManager !== 'undefined' && gridManager.screenToIso) {
            const gridPos = gridManager.screenToIso(x, y);
            return gridManager.isInBounds(gridPos.x, gridPos.y);
        }
        
        // Fallback: define a diamond-shaped playable area based on the isometric grid
        const centerX = gameConfig.canvas.baseWidth / 2;
        const centerY = gameConfig.canvas.baseHeight / 2;
        
        // Convert to relative position from center
        const relX = x - centerX;
        const relY = y - centerY;
        
        // Check if within diamond bounds (simplified)
        const maxDist = 250; // Approximate playable area radius
        return Math.abs(relX) + Math.abs(relY * 2) < maxDist;
    }
    
    // Handle interaction feedback (for failed plant attempts, etc.)
    showInteractionFeedback(x, y, type = 'neutral') {
        // This would emit particles or other visual feedback
        // Could be integrated with the particle system
        const feedbackColors = {
            success: [100, 255, 100],
            failure: [255, 100, 100],
            neutral: [255, 200, 100]
        };
        
        // Emit event for feedback
        if (window.eventBus) {
            eventBus.emit('ui:feedback', {
                x, y,
                color: feedbackColors[type] || feedbackColors.neutral,
                intensity: 8
            });
        }
    }
    
    // Draw visual hints for player interactions
    drawInteractionHints(graphics) {
        if (!this.interactionSystem) return;
        
        // Delegate to the interaction system which has more sophisticated hint drawing
        this.interactionSystem.drawInteractionHints(graphics);
    }
    
    // Update method for any time-based animations
    update() {
        // Any per-frame updates for UI animations would go here
        // Currently the UI is mostly stateless and driven by frameCount
    }
    
    
    // Toggle butterfly collection display
    toggleButterflyCollection() {
        if (this.butterflyCollection) {
            this.butterflyCollection.toggle();
        }
    }
    
    // Clean shutdown
    dispose() {
        if (this.domActionUnsubscribe) {
            this.domActionUnsubscribe();
            this.domActionUnsubscribe = null;
        }
        if (typeof shellDomOverlay !== 'undefined') {
            shellDomOverlay.hideAll?.();
        }
        this.interactionSystem = null;
        this.flowerManager = null;
        this.initialized = false;
    }
}

// Create global instance
const gameUI = new GameUI();


