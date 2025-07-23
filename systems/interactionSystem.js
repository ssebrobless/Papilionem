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
        
        // Gentle hover tracking
        this.hoveredButterfly = null;
        this.hoverFrames = 0;
        this.hoverTriggered = false;
        
        // Cursor state visualization for butterfly interactions
        this.currentCursorState = 'neutral'; // 'scaring', 'neutral', 'attracting'
        this.interactingButterfly = null;
        this.patienceProgress = 0;
        
        // Listen for cursor state events from butterflies
        this.setupCursorStateListeners();
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
        // Draw cursor state indicator first (underneath other indicators)
        this.drawCursorStateIndicator(graphics);
        
        // Draw hover progress indicator when hovering a butterfly
        if (this.hoveredButterfly && this.hoverFrames > 0 && !this.hoverTriggered) {
            const progress = this.hoverFrames / this.stillFramesRequired;
            
            // Draw a subtle progress ring around the cursor
            graphics.push();
            graphics.noFill();
            graphics.strokeWeight(2);
            
            // Fading in circle
            const alpha = map(progress, 0, 0.3, 0, 100);
            graphics.stroke(255, 255, 255, alpha);
            graphics.ellipse(this.adjustedMouseX, this.adjustedMouseY, this.cursorZoneRadius * 2);
            
            // Progress arc
            if (progress > 0.1) {
                graphics.stroke(255, 255, 255, 120);
                const startAngle = -PI/2;
                const endAngle = startAngle + (progress * TWO_PI);
                graphics.arc(
                    this.adjustedMouseX, 
                    this.adjustedMouseY, 
                    this.cursorZoneRadius * 2 - 4, 
                    this.cursorZoneRadius * 2 - 4,
                    startAngle,
                    endAngle
                );
            }
            
            graphics.pop();
        } else if (this.isGentle() && !this.hoveredButterfly && this.currentCursorState === 'neutral') {
            // Draw gentle cursor zone when still but not hovering anything (only if not showing other states)
            graphics.noFill();
            graphics.stroke(255, 255, 255, 30);
            graphics.strokeWeight(1);
            const radius = this.cursorZoneRadius + sin(frameCount * 0.05) * 5;
            graphics.ellipse(this.adjustedMouseX, this.adjustedMouseY, radius * 2);
        }
    }
    
    // Check for butterfly interactions
    checkButterflyInteractions(butterflies) {
        // Find butterflies within range
        const nearbyButterflies = this.getEntitiesInRange(butterflies);
        
        // Check if we're still hovering the same butterfly
        if (this.hoveredButterfly && nearbyButterflies.includes(this.hoveredButterfly)) {
            // Still hovering the same butterfly
            if (this.isGentle()) {
                this.hoverFrames++;
                
                // Check if we've hovered long enough and haven't triggered yet
                if (this.hoverFrames >= this.stillFramesRequired && !this.hoverTriggered) {
                    this.hoverTriggered = true;
                    
                    // Trigger the display animation
                    this.hoveredButterfly.startDisplay();
                    
                    // Emit event
                    eventBus.emit(GameEvents.GENTLE_HOVER, { 
                        butterfly: this.hoveredButterfly,
                        duration: this.hoverFrames
                    });
                    
                    eventBus.emit(GameEvents.BUTTERFLY_DISPLAY, { 
                        butterfly: this.hoveredButterfly 
                    });
                }
            } else {
                // Cursor is moving, reset hover
                this.resetHover();
            }
        } else {
            // Either no butterfly nearby or switched to a different one
            this.resetHover();
            
            // Start tracking a new butterfly if there's one nearby
            if (nearbyButterflies.length > 0 && this.isGentle()) {
                // Pick the closest butterfly
                let closestButterfly = nearbyButterflies[0];
                let closestDist = closestButterfly.distanceTo(this.adjustedMouseX, this.adjustedMouseY);
                
                for (let butterfly of nearbyButterflies) {
                    const dist = butterfly.distanceTo(this.adjustedMouseX, this.adjustedMouseY);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestButterfly = butterfly;
                    }
                }
                
                // Only start hovering if butterfly hasn't been hovered recently
                if (!closestButterfly.hasBeenHovered) {
                    this.hoveredButterfly = closestButterfly;
                    this.hoverFrames = 0;
                    this.hoverTriggered = false;
                }
            }
        }
        
        // Reset butterflies that are no longer being hovered
        for (let butterfly of butterflies) {
            if (butterfly !== this.hoveredButterfly && butterfly.hasBeenHovered) {
                const dist = butterfly.distanceTo(this.adjustedMouseX, this.adjustedMouseY);
                if (dist > this.cursorZoneRadius * 2) {
                    butterfly.resetHoverState();
                }
            }
        }
    }
    
    // Reset hover tracking
    resetHover() {
        this.hoveredButterfly = null;
        this.hoverFrames = 0;
        this.hoverTriggered = false;
    }
    
    // Setup cursor state event listeners
    setupCursorStateListeners() {
        if (typeof eventBus !== 'undefined') {
            eventBus.on('cursor:state', (data) => {
                this.currentCursorState = data.cursorState;
                this.interactingButterfly = data.butterfly;
                this.patienceProgress = data.patience / data.butterfly.patienceRequired;
            });
            
            // Reset cursor state when butterfly interactions end
            eventBus.on('butterfly:endFollowing', () => {
                this.currentCursorState = 'neutral';
                this.interactingButterfly = null;
                this.patienceProgress = 0;
            });
        }
    }
    
    // Draw cursor state visualization
    drawCursorStateIndicator(graphics) {
        // Only show cursor state indicator when interacting with a butterfly
        if (!this.interactingButterfly || this.currentCursorState === 'neutral') return;
        
        graphics.push();
        graphics.translate(this.adjustedMouseX, this.adjustedMouseY);
        graphics.noStroke();
        
        if (this.currentCursorState === 'scaring') {
            // Red warning indicator for scaring cursor
            graphics.fill(255, 100, 100, 150);
            graphics.ellipse(0, 0, 40, 40);
            
            // Warning text
            graphics.fill(255, 255, 255, 200);
            graphics.textAlign(CENTER);
            graphics.textSize(10);
            graphics.text('TOO FAST', 0, -25);
            
        } else if (this.currentCursorState === 'attracting') {
            // Building trust indicator
            const maxRadius = 30;
            const currentRadius = 10 + this.patienceProgress * 20;
            
            // Patience building ring  
            graphics.fill(100, 255, 100, 80);
            graphics.ellipse(0, 0, currentRadius * 2, currentRadius * 2);
            
            // Progress ring
            if (this.patienceProgress > 0) {
                graphics.noFill();
                graphics.stroke(100, 255, 100, 150);
                graphics.strokeWeight(2);
                
                const startAngle = -PI/2;
                const endAngle = startAngle + (this.patienceProgress * TWO_PI);
                
                graphics.arc(0, 0, maxRadius, maxRadius, startAngle, endAngle);
            }
            
            // Trust building text
            graphics.noStroke();
            graphics.fill(255, 255, 255, 200);
            graphics.textAlign(CENTER);
            graphics.textSize(8);
            
            if (this.patienceProgress < 1) {
                graphics.text('BUILDING TRUST...', 0, -20);
            } else {
                graphics.text('FOLLOWING!', 0, -20);
            }
        }
        
        graphics.pop();
    }
}

// Create global instance
const interactionSystem = new InteractionSystem();