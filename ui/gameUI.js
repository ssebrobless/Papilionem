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
        this.cursorHint = {
            size: 20,
            pulseSpeed: 0.05,
            rotationSpeed: 0.02,
            alpha: 80
        };
        
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
    }
    
    // Initialize the UI system with references to other systems
    initialize(flowerManager, config) {
        this.flowerManager = flowerManager;
        this.stillFramesRequired = config?.stillFramesRequired || 60;
        this.initialized = true;
    }
    
    // Main draw method for game UI (non-debug mode)
    draw(graphics, gameState, debugMode) {
        if (!this.initialized || debugMode.enabled) return;
        
        graphics.push();
        
        // Draw cursor interaction hints when player is still
        if (gameState.framesSinceMovement > this.stillFramesRequired) {
            this.drawCursorHint(graphics, gameState);
        }
        
        // Draw planting hints
        if (this.flowerManager && gameState.flowers) {
            const config = window.config || { baseWidth: 800, baseHeight: 450, targetWidth: 800, targetHeight: 450 };
            const adjustedMouseX = mouseX * (config.baseWidth / config.targetWidth);
            const adjustedMouseY = mouseY * (config.baseHeight / config.targetHeight);
            this.flowerManager.drawPlantingHint(graphics, adjustedMouseX, adjustedMouseY, gameState.flowers);
        }
        
        // Draw boundary zones if requested
        if (this.showBoundaryZones) {
            this.drawBoundaryZones(graphics);
        }
        
        graphics.pop();
    }
    
    // Draw the rotating cursor hint when player is still
    drawCursorHint(graphics, gameState) {
        const config = window.config || { baseWidth: 800, baseHeight: 450, targetWidth: 800, targetHeight: 450 };
        const adjustedMouseX = mouseX * (config.baseWidth / config.targetWidth);
        const adjustedMouseY = mouseY * (config.baseHeight / config.targetHeight);
        
        graphics.push();
        graphics.translate(adjustedMouseX, adjustedMouseY);
        graphics.rotate(frameCount * this.cursorHint.rotationSpeed);
        graphics.noFill();
        graphics.stroke(255, 255, 255, this.cursorHint.alpha);
        graphics.strokeWeight(2);
        
        // Pulsing diamond size
        const size = this.cursorHint.size + sin(frameCount * this.cursorHint.pulseSpeed) * 4;
        
        // Draw pixelated diamond shape
        graphics.beginShape();
        graphics.vertex(0, -size);
        graphics.vertex(size, 0);
        graphics.vertex(0, size);
        graphics.vertex(-size, 0);
        graphics.endShape(CLOSE);
        
        graphics.pop();
    }
    
    // Draw boundary zones visualization
    drawBoundaryZones(graphics) {
        graphics.push();
        
        // Get playable area boundaries from config
        const bounds = {
            maxX: 18, // These should come from config
            maxY: 18
        };
        
        // Get corners of playable area using isometric conversion
        const corners = [
            this.isoToScreen(0, 0),
            this.isoToScreen(bounds.maxX, 0),
            this.isoToScreen(bounds.maxX, bounds.maxY),
            this.isoToScreen(0, bounds.maxY)
        ];
        
        graphics.noStroke();
        
        // Draw zones in reverse order (largest first)
        for (let i = this.boundaryZones.length - 1; i >= 0; i--) {
            const zone = this.boundaryZones[i];
            graphics.fill(...zone.color);
            
            // Create expanded diamond shape
            graphics.beginShape();
            for (let j = 0; j < corners.length; j++) {
                const corner = corners[j];
                const next = corners[(j + 1) % corners.length];
                
                // Calculate outward normal
                const dx = next.x - corner.x;
                const dy = next.y - corner.y;
                const len = sqrt(dx * dx + dy * dy);
                const nx = -dy / len * zone.dist;
                const ny = dx / len * zone.dist;
                
                graphics.vertex(corner.x + nx, corner.y + ny);
            }
            graphics.endShape(CLOSE);
        }
        
        graphics.pop();
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
        
        // Pollen count
        if (this.flowerManager) {
            text(`Pollen: ${this.flowerManager.pollenCount}/5`, x, y);
            y += lineHeight;
        }
        
        // FPS
        text(`FPS: ${frameRate().toFixed(0)}`, x, y);
        y += lineHeight;
        
        // Controls
        text(`Press D for Debug Mode`, x, y);
        y += lineHeight;
        text(`Hold B to see boundary zones`, x, y);
        
        pop();
    }
    
    // Handle key presses for UI controls
    handleKeyPress(key, keyCode) {
        // Handle boundary zones toggle (B key)
        if (key === 'B' || key === 'b') {
            // This is handled as keyIsDown in the main draw loop
            return false;
        }
        
        return false; // No key consumed
    }
    
    // Update boundary zones visibility
    setBoundaryZonesVisible(visible) {
        this.showBoundaryZones = visible;
    }
    
    // Helper function for isometric conversion (temporary until gridManager is available)
    isoToScreen(gridX, gridY) {
        const config = {
            gridSize: 16,
            baseWidth: 800,
            baseHeight: 450,
            gridOffset: { x: 8, y: 8 }
        };
        
        const tileWidth = config.gridSize * 2;
        const tileHeight = config.gridSize;
        
        // Apply grid offset to align with background
        const offsetX = gridX + config.gridOffset.x;
        const offsetY = gridY + config.gridOffset.y;
        
        const screenX = (offsetX - offsetY) * tileWidth / 2 + config.baseWidth / 2;
        const screenY = (offsetX + offsetY) * tileHeight / 2;
        
        return { x: screenX, y: screenY + tileHeight / 2 };
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
        if (!this.interactionSystem || !this.interactionSystem.isGentle()) return;
        
        const cursor = this.interactionSystem.getCursorPosition();
        
        // Draw gentle interaction zone
        graphics.noFill();
        graphics.stroke(255, 255, 255, 50);
        graphics.strokeWeight(1);
        
        const radius = 30 + sin(frameCount * 0.05) * 5; // Pulsing radius
        graphics.ellipse(cursor.x, cursor.y, radius * 2);
    }
    
    // Update method for any time-based animations
    update() {
        // Any per-frame updates for UI animations would go here
        // Currently the UI is mostly stateless and driven by frameCount
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