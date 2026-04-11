// Main game UI system - handles all non-debug UI elements
// Integrates with interactionSystem, renderManager, and debugUI
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
            x: 560,
            y: 14,
            width: 228,
            lineHeight: 14
        };

        this.accessibilityPanel = {
            visible: false,
            x: 532,
            y: 188,
            width: 256,
            lineHeight: 14
        };

        this.accessibilitySettings = {
            reducedMotion: false,
            battleMotionSimplify: true,
            highContrastUI: false,
            colorblindSafeIndicators: true,
            strongSelectionOutlines: true,
            trailVisibility: 'full',
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
        
        // Initialize butterfly collection UI
        this.butterflyCollection = new ButterflyCollectionUI();
        
        this.initialized = true;
    }
    
    // Main draw method for game UI (non-debug mode)
    draw(graphics, gameState, debugMode) {
        if (!this.initialized) return;
        
        graphics.push();
        
        // Cursor hints handled by interaction system - no duplicate rendering needed
        
        
        // Draw boundary zones if requested
        if (this.showBoundaryZones && !debugMode.enabled) {
            this.drawBoundaryZones(graphics);
        }
        
        // Update and draw butterfly collection UI
        if (this.butterflyCollection) {
            this.butterflyCollection.update();
            this.butterflyCollection.draw(graphics);
        }

        if (this.inspectPanel.visible) {
            this.drawInspectPanel(graphics, gameState);
        }

        if (this.accessibilityPanel.visible) {
            this.drawAccessibilityPanel(graphics, gameState);
        }

        if (gameState.viewMode === 'battle') {
            this.drawBattleHud(graphics, gameState);
        }
        
        graphics.pop();
    }
    
    // Cursor hint removed - interaction system provides better contextual feedback
    
    // Draw boundary zones visualization using unified system
    drawBoundaryZones(graphics) {
        // Use unified boundary zone drawing with our configured zones
        gridManager.drawBoundaryZones(graphics, this.boundaryZones);
    }
    
    // Draw info panel on main canvas (not on UI layer)
    drawInfoPanel(gameState, debugMode) {
        if (debugMode.enabled) return;
        
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
        text(`Press C for Butterfly Collection`, x, y);
        
        pop();
    }
    
    // Handle key presses for UI controls
    handleKeyPress(key, keyCode) {
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

            if (key === 'R' || key === 'r') {
                if (this.butterflyCollection.promptRenameCurrentHybrid()) {
                    return true;
                }
            }
        }
        
        // Handle boundary zones toggle (B key)
        if (key === 'B' || key === 'b') {
            // This is handled as keyIsDown in the main draw loop
            return false;
        }
        
        // Handle butterfly collection toggle (C key)
        if (key === 'C' || key === 'c') {
            this.toggleButterflyCollection();
            return true;
        }

        if (key === 'I' || key === 'i') {
            this.inspectPanel.visible = !this.inspectPanel.visible;
            return true;
        }

        if (key === 'A' || key === 'a') {
            this.accessibilityPanel.visible = !this.accessibilityPanel.visible;
            return true;
        }

        if (key === 'M' || key === 'm') {
            this.toggleAccessibilitySetting('reducedMotion');
            return true;
        }

        if (key === 'T' || key === 't') {
            this.cycleAccessibilitySetting('trailVisibility', ['full', 'reduced', 'off']);
            return true;
        }

        if (key === 'G' || key === 'g') {
            this.cycleAccessibilitySetting('backgroundAtmosphere', ['full', 'reduced', 'minimal']);
            return true;
        }

        if (key === 'H' || key === 'h') {
            this.toggleAccessibilitySetting('highContrastUI');
            return true;
        }

        if (key === 'S' || key === 's') {
            this.toggleAccessibilitySetting('battleMotionSimplify');
            return true;
        }
        
        return false; // No key consumed
    }

    resolveInspectTarget(gameState) {
        const hovered = gameCore?.interactionSystem?.hoveredButterfly || null;
        if (hovered?.id) return hovered;

        const cursorX = gameState.adjustedMouseX ?? 0;
        const cursorY = gameState.adjustedMouseY ?? 0;
        const butterflies = gameState.butterflies || [];
        let closest = null;
        let closestDistance = 28;

        for (const butterfly of butterflies) {
            const distance = butterfly.distanceTo(cursorX, cursorY);
            if (distance < closestDistance) {
                closest = butterfly;
                closestDistance = distance;
            }
        }

        return closest;
    }

    drawInspectPanel(graphics, gameState) {
        const target = this.resolveInspectTarget(gameState);
        const panel = this.inspectPanel;

        graphics.push();
        graphics.fill(14, 18, 22, 190);
        if (this.accessibilitySettings.highContrastUI) {
            graphics.fill(0, 0, 0, 220);
            graphics.stroke(255);
            graphics.strokeWeight(1.5);
        } else {
            graphics.noStroke();
        }
        graphics.rect(panel.x, panel.y, panel.width, 166, 8);

        graphics.fill(240, 240, 240);
        graphics.textAlign(LEFT);
        graphics.textSize(12);
        graphics.text('Inspect (I)', panel.x + 10, panel.y + 18);

        if (!target) {
            graphics.fill(180);
            graphics.text('Hover near a butterfly to inspect.', panel.x + 10, panel.y + 40);
            graphics.text('The panel uses live owner-system state.', panel.x + 10, panel.y + 56);
            graphics.pop();
            return;
        }

        const sleepState = typeof sleepSystem !== 'undefined'
            ? sleepSystem.getSleepState?.(target.id)
            : null;
        const statusBundle = typeof statusSystem !== 'undefined'
            ? statusSystem.getAggregatedModifiers?.(target.id)
            : { numeric: {}, cooldowns: {} };
        const zoneId = typeof zoneSystem !== 'undefined'
            ? zoneSystem.getZoneAtGrid?.(target.gridPos?.x ?? 0, target.gridPos?.y ?? 0)?.id || null
            : null;
        const lines = [
            `${target.displayName || target.personalityType || 'butterfly'} (${target.sex || '?'})`,
            `State: ${target.state || 'normal'}   Special: ${target.getSpecialAbility?.() || 'none'}`,
            `Zone: ${zoneId || 'unknown'}   Happiness: ${Math.round(target.happiness || 0)}`,
            `Exhaustion: ${Math.round((sleepState?.exhaustion || 0) * 100)}   Sleep: ${sleepState?.subtype || 'awake'}`,
            `Trust: ${Math.round((target.cursor?.trustLevel || 0))}   Age ticks: ${target.lifeSim?.lifecycle?.ageTicks || 0}`,
            `Move bonus: ${((statusBundle.numeric?.movement_speed_bonus || 0) * 100).toFixed(0)}%`,
            `Heal bonus: ${((statusBundle.numeric?.healing_received_bonus || 0) * 100).toFixed(0)}%`,
            `Wake resist: ${((statusBundle.numeric?.wake_resistance || 0) * 100).toFixed(0)}%`
        ];

        graphics.fill(255);
        graphics.textSize(11);
        let y = panel.y + 40;
        for (const line of lines) {
            graphics.text(line, panel.x + 10, y);
            y += panel.lineHeight;
        }

        graphics.fill(170);
        graphics.text(`Cooldowns: ${Object.keys(statusBundle.cooldowns || {}).join(', ') || 'none'}`, panel.x + 10, y + 8);

        if (this.accessibilitySettings.strongSelectionOutlines) {
            graphics.noFill();
            if (this.accessibilitySettings.highContrastUI) {
                graphics.stroke(255);
            } else {
                graphics.stroke(255, 228, 140, 220);
            }
            graphics.strokeWeight(2);
            graphics.ellipse(target.x, target.y - 2, 30, 20);
        }
        graphics.pop();
    }

    getAccessibilitySettings() {
        return { ...this.accessibilitySettings };
    }

    toggleAccessibilitySetting(key) {
        this.accessibilitySettings[key] = !this.accessibilitySettings[key];
        return this.accessibilitySettings[key];
    }

    cycleAccessibilitySetting(key, values) {
        const currentIndex = values.indexOf(this.accessibilitySettings[key]);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % values.length : 0;
        this.accessibilitySettings[key] = values[nextIndex];
        return this.accessibilitySettings[key];
    }

    drawAccessibilityPanel(graphics, gameState) {
        const panel = this.accessibilityPanel;
        const uiScaleLabel = `${Math.round((this.accessibilitySettings.uiScale || 1) * 100)}%`;
        const panelFill = this.accessibilitySettings.highContrastUI ? [0, 0, 0, 225] : [20, 24, 30, 196];
        const accent = this.accessibilitySettings.highContrastUI ? [255, 255, 255] : [210, 228, 255];

        graphics.push();
        graphics.fill(...panelFill);
        graphics.stroke(...accent, 220);
        graphics.strokeWeight(1);
        graphics.rect(panel.x, panel.y, panel.width, 162, 8);

        graphics.noStroke();
        graphics.fill(255);
        graphics.textAlign(LEFT);
        graphics.textSize(12);
        graphics.text('Accessibility / Readability (A)', panel.x + 10, panel.y + 18);
        graphics.textSize(11);

        const lines = [
            `M Reduced motion: ${this.accessibilitySettings.reducedMotion ? 'On' : 'Off'}`,
            `T Trails: ${this.accessibilitySettings.trailVisibility}`,
            `G Background: ${this.accessibilitySettings.backgroundAtmosphere}`,
            `H High contrast UI: ${this.accessibilitySettings.highContrastUI ? 'On' : 'Off'}`,
            `S Battle motion simplify: ${this.accessibilitySettings.battleMotionSimplify ? 'On' : 'Off'}`,
            `Status density: ${this.accessibilitySettings.statusIndicatorDensity}`,
            `Color-safe: ${this.accessibilitySettings.colorblindSafeIndicators ? 'On' : 'Off'}  Outlines: ${this.accessibilitySettings.strongSelectionOutlines ? 'Strong' : 'Normal'}`,
            `UI scale: ${uiScaleLabel}  View: ${gameState.viewMode || 'focused-garden'}`
        ];

        let y = panel.y + 40;
        for (const line of lines) {
            graphics.fill(...accent);
            graphics.text(line, panel.x + 10, y);
            y += panel.lineHeight;
        }

        graphics.fill(185, 190, 198);
        graphics.text('Normal play uses these render/readability settings.', panel.x + 10, panel.y + 150);
        graphics.pop();
    }

    drawBattleHud(graphics, gameState) {
        const snapshot = typeof battleSystem !== 'undefined'
            ? battleSystem.getSnapshot?.(gameState.activeBattleId)
            : null;
        const participants = Object.values(snapshot?.participantsById || {});
        const teams = Object.values(snapshot?.teams || {});
        const debugOverlayActive = (typeof gameCore !== 'undefined' && gameCore.getDebugMode?.().enabled) || false;
        const teamSummaries = teams.map(team => {
            const activeCount = (team.participantIds || []).filter(id => {
                const participant = snapshot.participantsById?.[id];
                return participant && !participant.defeated && !participant.retreated;
            }).length;
            return `${team.teamId}:${activeCount}`;
        });
        const hudWidth = 250;
        const hudHeight = 82;
        const hudX = debugOverlayActive ? (gameConfig.canvas.baseWidth - hudWidth - 14) : 14;
        const hudY = 14;

        graphics.push();
        graphics.fill(this.accessibilitySettings.highContrastUI ? 0 : 12, this.accessibilitySettings.highContrastUI ? 0 : 18, this.accessibilitySettings.highContrastUI ? 0 : 28, 198);
        graphics.stroke(this.accessibilitySettings.highContrastUI ? 255 : 180, this.accessibilitySettings.highContrastUI ? 255 : 220, this.accessibilitySettings.highContrastUI ? 255 : 255, 180);
        graphics.strokeWeight(1);
        graphics.rect(hudX, hudY, hudWidth, hudHeight, 8);

        graphics.noStroke();
        graphics.fill(255);
        graphics.textAlign(LEFT);
        graphics.textSize(12);
        graphics.text('Battle View', hudX + 10, hudY + 18);
        graphics.textSize(11);
        graphics.text(`Battle: ${gameState.activeBattleId || 'none'}`, hudX + 10, hudY + 34);
        graphics.text(`Teams: ${teamSummaries.join('  ') || 'none'}`, hudX + 10, hudY + 48);
        graphics.text(`Units: ${participants.length}   Time: x${gameState.timeScale || 1}`, hudX + 10, hudY + 62);
        graphics.text(`Motion simplify: ${this.accessibilitySettings.battleMotionSimplify ? 'On' : 'Off'}`, hudX + 10, hudY + 76);
        graphics.pop();
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
        this.interactionSystem = null;
        this.flowerManager = null;
        this.initialized = false;
    }
}

// Create global instance
const gameUI = new GameUI();
