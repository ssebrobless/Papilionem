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
        
        // Initialize butterfly collection UI
        this.butterflyCollection = new ButterflyCollectionUI();
        
        this.initialized = true;
    }
    
    // Main draw method for game UI (non-debug mode)
    draw(graphics, gameState, debugMode) {
        if (!this.initialized || debugMode.enabled) return;
        
        graphics.push();
        
        // Cursor hints handled by interaction system - no duplicate rendering needed
        
        
        // Draw boundary zones if requested
        if (this.showBoundaryZones) {
            this.drawBoundaryZones(graphics);
        }
        
        // Update and draw butterfly collection UI
        if (this.butterflyCollection) {
            this.butterflyCollection.update();
            this.butterflyCollection.draw(graphics);
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
        
        return false; // No key consumed
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