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
        
        // Draw enhanced planting hints with ghost flower preview
        if (this.flowerManager && gameState.flowers) {
            // Use unified coordinate system to prevent cursor tracking issues
            const adjustedMouseX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
            const adjustedMouseY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
            
            // Draw ghost flower preview when enough pollen is available
            const pollenCount = gameState.particleSystem ? gameState.particleSystem.getPollenCount() : 0;
            if (pollenCount >= 5) {
                this.drawGhostFlowerPreview(graphics, adjustedMouseX, adjustedMouseY, gameState.flowers);
            }
            
            // Draw original planting hint particles
            this.flowerManager.drawPlantingHint(graphics, adjustedMouseX, adjustedMouseY, gameState.flowers, gameState.particleSystem);
        }
        
        // Draw pollen cluster visualization
        this.drawPollenCluster(graphics, gameState);
        
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
        
        // Enhanced pollen count display
        if (gameState.particleSystem) {
            const pollenCount = gameState.particleSystem.getPollenCount();
            
            // Change color and size based on pollen count
            push();
            if (pollenCount >= 5) {
                // Ready to plant - glow effect
                fill(255, 255, 200);
                textStyle(BOLD);
            } else if (pollenCount >= 3) {
                // Getting close - warm color
                fill(255, 220, 150);
            }
            
            text(`Pollen: ${pollenCount}/5`, x, y);
            
            // Add "Ready to plant!" text when at 5
            if (pollenCount >= 5) {
                fill(255, 255, 200, 150);
                textStyle(NORMAL);
                text(` Ready to plant!`, x + 70, y);
            }
            
            pop();
            y += lineHeight;
        }
        
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
    
    // Draw a ghost flower preview at cursor position when planting is possible
    drawGhostFlowerPreview(graphics, x, y, flowers) {
        // First check if we're within the playable area using the same logic as FlowerManager
        if (!this.isWithinPlayableArea(x, y)) return;
        
        if (!this.flowerManager.canPlant(x, y, flowers, gameState.particleSystem)) return;
        
        graphics.push();
        graphics.translate(x, y);
        
        // Subtle pulsing alpha for ghost effect
        const baseAlpha = 40;
        const pulseAlpha = sin(frameCount * 0.08) * 20;
        const alpha = baseAlpha + pulseAlpha;
        
        // Draw a simple ghost flower silhouette
        graphics.noStroke();
        
        // Ghost stem
        graphics.fill(200, 255, 200, alpha * 0.5);
        for (let i = 0; i < 12; i += 2) {
            const stemX = sinFrame(frameCount, 0.02) * (i / 12) * 2;
            graphics.rect(stemX - 1, -i - 2, 2, 2);
        }
        
        // Ghost petals in a simple flower shape
        const petalCount = 5;
        const petalSize = 8;
        
        graphics.push();
        graphics.translate(0, -12);
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (TWO_PI / petalCount) * i;
            graphics.push();
            graphics.rotate(angle);
            
            // Simple petal shape
            graphics.fill(255, 255, 255, alpha);
            graphics.ellipse(petalSize/2, 0, petalSize, petalSize/3);
            graphics.pop();
        }
        
        // Ghost center
        graphics.fill(255, 255, 200, alpha * 1.5);
        graphics.ellipse(0, 0, 4, 4);
        
        graphics.pop();
        
        // Add a subtle ring around the planting area
        graphics.noFill();
        graphics.stroke(255, 255, 255, alpha * 0.5);
        graphics.strokeWeight(1);
        const ringSize = 20 + sinFrame(frameCount, 0.05) * 3;
        graphics.ellipse(0, 0, ringSize * 2);
        
        graphics.pop();
    }
    
    // Draw pollen cluster visualization to show collection progress
    drawPollenCluster(graphics, gameState) {
        if (!this.flowerManager) return;
        
        const pollenCount = this.flowerManager.pollenCount;
        if (pollenCount === 0) return;
        
        // Position near the pollen counter
        const x = this.infoPanel.x + 80;
        const y = this.infoPanel.y + this.infoPanel.lineHeight * 3 - 5;
        
        graphics.push();
        graphics.translate(x, y);
        
        // Draw pollen particles in a cluster formation
        const maxPollen = 5;
        const spacing = 8;
        
        for (let i = 0; i < maxPollen; i++) {
            const angle = (TWO_PI / maxPollen) * i - PI/2; // Start from top
            const dist = 10;
            const px = cos(angle) * dist;
            const py = sin(angle) * dist;
            
            if (i < pollenCount) {
                // Active pollen particle
                graphics.noStroke();
                graphics.fill(255, 255, 200);
                
                // Add glow effect for collected pollen
                const glowSize = 6 + sin(frameCount * 0.1 + i) * 1;
                graphics.fill(255, 255, 200, 30);
                graphics.ellipse(px, py, glowSize * 2);
                
                // Main particle
                graphics.fill(255, 255, 200);
                graphics.ellipse(px, py, 4, 4);
            } else {
                // Empty slot indicator
                graphics.noFill();
                graphics.stroke(255, 255, 255, 30);
                graphics.strokeWeight(1);
                graphics.ellipse(px, py, 6, 6);
            }
        }
        
        // When ready to plant, add a flower hint in the center
        if (pollenCount >= 5) {
            const flowerAlpha = (sin(frameCount * 0.08) + 1) * 0.5 * 100 + 50;
            
            // Tiny flower icon
            graphics.noStroke();
            for (let i = 0; i < 5; i++) {
                const angle = (TWO_PI / 5) * i;
                const px = cos(angle) * 3;
                const py = sin(angle) * 3;
                graphics.fill(255, 255, 255, flowerAlpha);
                graphics.ellipse(px, py, 3, 3);
            }
            graphics.fill(255, 255, 200, flowerAlpha);
            graphics.ellipse(0, 0, 3, 3);
        }
        
        graphics.pop();
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