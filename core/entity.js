// Base class for all game entities (butterflies, flowers, etc)
let __entityIdCounter = 0;

function generateEntityId(prefix = 'entity') {
    __entityIdCounter++;
    return `${prefix}_${Date.now()}_${__entityIdCounter}`;
}

class Entity {
    constructor(x, y) {
        this.id = generateEntityId('entity');
        this.x = x;
        this.y = y;
        this.gridPos = gridManager.screenToIso(x, y);
        
        // Lifecycle - engagement based
        this.engagementTimer = 7200; // 2 minutes at 60 fps
        this.maxEngagementTimer = 7200;
        this.criticalEngagementThreshold = 1800; // 30 seconds - warning phase
        this.fadeStartThreshold = 600; // 10 seconds - start fading
        this.isDying = false;
        
        // Visual properties
        this.size = 10;
        this.shadowOffset = 0;
        this.zIndex = 0; // For depth sorting
        
        // State management
        this.state = 'idle';
        this.stateTimer = 0;
    }
    
    // Update method to be overridden by subclasses
    update(gameState) {
        // Decrease engagement timer (death by neglect)
        if (this.engagementTimer > 0) {
            this.engagementTimer--;
        }
        this.updateZIndex();
    }
    
    // Reset engagement timer (called when entity is interacted with)
    // Only resets if butterfly count is below threshold
    resetEngagement(butterflyCount = 0) {
        // Only reset engagement timer if there are fewer than 4 butterflies
        if (butterflyCount < 4) {
            this.engagementTimer = this.maxEngagementTimer;
            this.isDying = false;
        }
    }
    
    // Calculate z-index for proper depth sorting
    updateZIndex() {
        // Isometric depth calculation: farther back (lower y) and to the left (lower x) appear behind
        this.zIndex = this.gridPos.y * 1000 + this.gridPos.x;
    }
    
    // Common state management
    setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            this.stateTimer = 0;
            this.onStateChange(newState);
        }
    }
    
    // Hook for subclasses to respond to state changes
    onStateChange(newState) {
        // Override in subclasses
    }
    
    // Base draw method - handles shadows and common effects
    draw(graphics) {
        if (this.engagementTimer <= 0) return;
        
        graphics.push();
        
        // Calculate alpha for fading
        let alpha = 255;
        if (this.isDying || this.engagementTimer < this.fadeStartThreshold) {
            alpha = map(this.engagementTimer, 0, this.fadeStartThreshold, 0, 255);
        }
        
        // Draw shadow if entity has one
        if (this.shadowOffset > 0) {
            this.drawShadow(graphics, alpha);
        }
        
        // Draw the entity itself
        this.drawEntity(graphics, alpha);
        
        graphics.pop();
    }
    
    drawShadow(graphics, alpha) {
        graphics.noStroke();
        graphics.fill(0, 0, 0, min(50, alpha * 0.2));
        graphics.ellipse(
            this.x, 
            this.y + this.shadowOffset, 
            this.size * 0.8, 
            this.size * 0.4
        );
    }
    
    // To be overridden by subclasses
    drawEntity(graphics, alpha) {
        // Subclasses implement their specific drawing logic
    }
    
    // Check if entity is dead
    isDead() {
        return this.engagementTimer <= 0;
    }
    
    // Check if entity needs attention (warning phase)
    needsAttention() {
        return this.engagementTimer < this.criticalEngagementThreshold;
    }
    
    // Get distance to a point
    distanceTo(x, y) {
        return dist(this.x, this.y, x, y);
    }
    
    // Get grid distance (Manhattan distance)
    gridDistanceTo(gridX, gridY) {
        return abs(this.gridPos.x - gridX) + abs(this.gridPos.y - gridY);
    }
}

// Mixin for entities that move on the grid
class GridMovable {
    constructor() {
        this.targetGridPos = null;
        this.speed = 0.05;
    }
    
    moveToGridPos(targetX, targetY) {
        this.targetGridPos = { x: targetX, y: targetY };
    }
    
    updateGridMovement() {
        if (!this.targetGridPos) return;
        
        // Smooth interpolation toward target
        const dx = this.targetGridPos.x - this.gridPos.x;
        const dy = this.targetGridPos.y - this.gridPos.y;
        
        if (abs(dx) < 0.1 && abs(dy) < 0.1) {
            this.gridPos.x = this.targetGridPos.x;
            this.gridPos.y = this.targetGridPos.y;
        } else {
            this.gridPos.x += dx * this.speed;
            this.gridPos.y += dy * this.speed;
        }
        
        // Update screen position using unified coordinate system
        const screenPos = gridManager.isoToScreen(this.gridPos.x, this.gridPos.y);
        this.x = screenPos.x;
        this.y = screenPos.y;
    }
}

// Mixin for entities with lifecycle stages
class LifecycleEntity {
    constructor() {
        this.stage = 'birth';
        this.stageTimer = 0;
        this.stageDurations = {
            birth: 60,
            mature: 600,
            aging: 300,
            dying: 180
        };
    }
    
    updateLifecycle() {
        this.stageTimer++;
        
        const currentDuration = this.stageDurations[this.stage];
        if (currentDuration && this.stageTimer >= currentDuration) {
            this.nextStage();
        }
    }
    
    nextStage() {
        const stages = Object.keys(this.stageDurations);
        const currentIndex = stages.indexOf(this.stage);
        
        if (currentIndex < stages.length - 1) {
            this.stage = stages[currentIndex + 1];
            this.stageTimer = 0;
            this.onStageChange(this.stage);
        }
    }
    
    onStageChange(newStage) {
        // Override in subclasses
    }
}
