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
        
        // Pre-allocated cursor position object to avoid frequent allocation
        this.cursorPositionCache = { x: 0, y: 0 };
        
        
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
    
    // Get cursor position adjusted for canvas scaling (using pre-allocated object)
    getCursorPosition() {
        this.cursorPositionCache.x = this.adjustedMouseX;
        this.cursorPositionCache.y = this.adjustedMouseY;
        return this.cursorPositionCache;
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
    
    
    // Draw interaction UI elements
    drawInteractionHints(graphics) {
        // Keep only the current cursor-state indicator used by the modern shell.
        this.drawCursorStateIndicator(graphics);
    }
    
    // Check for butterfly interactions
    checkButterflyInteractions(butterflies) {
        // The old gentle-hover display loop was retired during the overhaul.
        // Keep the method so the rest of the runtime can call it safely.
        this.resetHover();
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
