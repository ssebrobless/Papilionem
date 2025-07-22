// Cursor tracking, entity responses, and player feedback
class InteractionSystem {
    constructor() {
        this.cursorVelocity = 0;
        this.lastCursorX = 0;
        this.lastCursorY = 0;
        this.framesSinceMovement = 0;
        this.adjustedMouseX = 0;
        this.adjustedMouseY = 0;
        
        // Interaction thresholds from config
        this.stillFramesRequired = gameConfig.interaction.stillFramesRequired;
        this.cursorZoneRadius = gameConfig.interaction.cursorZoneRadius;
    }
    
    // Update cursor tracking and calculate interaction zones
    update() {
        // Calculate screen-adjusted cursor position
        this.adjustedMouseX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
        this.adjustedMouseY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
        
        // Track cursor velocity
        const dx = this.adjustedMouseX - this.lastCursorX;
        const dy = this.adjustedMouseY - this.lastCursorY;
        this.cursorVelocity = sqrt(dx * dx + dy * dy);
        
        // Track stillness for gentle interactions
        if (this.cursorVelocity < 0.5) {
            this.framesSinceMovement++;
        } else {
            this.framesSinceMovement = 0;
        }
        
        this.lastCursorX = this.adjustedMouseX;
        this.lastCursorY = this.adjustedMouseY;
    }
    
    // Check if cursor is still enough for gentle interactions
    isGentle() {
        return this.framesSinceMovement > this.stillFramesRequired;
    }
    
    // Get cursor position adjusted for canvas scaling
    getCursorPosition() {
        return {
            x: this.adjustedMouseX,
            y: this.adjustedMouseY
        };
    }
    
    // Check if cursor is within interaction range of an entity
    isNearEntity(entity, radius = this.cursorZoneRadius) {
        const dist = entity.distanceTo(this.adjustedMouseX, this.adjustedMouseY);
        return dist <= radius;
    }
    
    // Find entities within interaction range
    getEntitiesInRange(entities, radius = this.cursorZoneRadius) {
        return entities.filter(entity => this.isNearEntity(entity, radius));
    }
    
    // Handle plant attempt
    handlePlantAttempt(flowerManager, flowers, particleSystem) {
        if (!flowerManager.plantFlower(
            this.adjustedMouseX, 
            this.adjustedMouseY, 
            flowers, 
            particleSystem
        )) {
            // Show feedback particles if planting failed
            const testColors = [
                [255, 100, 100],
                [100, 255, 100],
                [100, 100, 255],
                [255, 200, 100]
            ];
            
            const color = random(testColors);
            particleSystem.emitBurst(this.adjustedMouseX, this.adjustedMouseY, color, 8);
        }
        
        // Emit event for plant attempt
        eventBus.emit(GameEvents.PLANT_ATTEMPTED, {
            x: this.adjustedMouseX,
            y: this.adjustedMouseY,
            success: false
        });
    }
    
    // Draw interaction UI elements
    drawInteractionHints(graphics) {
        if (this.isGentle()) {
            // Draw gentle cursor zone
            graphics.noFill();
            graphics.stroke(255, 255, 255, 50);
            graphics.strokeWeight(1);
            const radius = this.cursorZoneRadius + sin(frameCount * 0.05) * 5;
            graphics.ellipse(this.adjustedMouseX, this.adjustedMouseY, radius * 2);
            
            // Emit gentle hover events for nearby entities
            // This would be called from the main game loop with entity lists
        }
    }
    
    // Check for butterfly interactions
    checkButterflyInteractions(butterflies) {
        if (!this.isGentle()) return;
        
        const nearbyButterflies = this.getEntitiesInRange(butterflies);
        for (let butterfly of nearbyButterflies) {
            eventBus.emit(GameEvents.GENTLE_HOVER, { butterfly });
        }
    }
}

// Create global instance
const interactionSystem = new InteractionSystem();