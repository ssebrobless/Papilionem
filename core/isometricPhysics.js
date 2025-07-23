// Unified isometric physics engine to prevent physics drift across entities
// Centralizes all 3D perspective calculations and movement behaviors

class IsometricPhysics {
    constructor() {
        this.gravity = gameConfig.particles?.gravity || 0.1;
        this.friction = gameConfig.particles?.friction || 0.99;
        this.bounce = gameConfig.particles?.bounce || 0.3;
    }
    
    // GROUND TARGETING SYSTEM
    
    /**
     * Calculate where an entity should land on the isometric ground
     * @param {number} startX - Screen X position 
     * @param {number} startY - Screen Y position
     * @param {number} scatterRange - Random scatter amount (0-1)
     * @returns {Object} {x, y} screen coordinates of ground target
     */
    calculateGroundTarget(startX, startY, scatterRange = 0.3) {
        if (typeof gridManager === 'undefined') {
            return { x: startX, y: startY + 20 }; // Fallback
        }
        
        // Convert to grid space
        const gridPos = gridManager.screenToIso(startX, startY);
        
        // Add random scatter within grid cell
        const scatteredX = gridPos.x + random(-scatterRange, scatterRange);
        const scatteredY = gridPos.y + random(-scatterRange, scatterRange);
        
        // Convert back to screen space
        const targetScreen = gridManager.isoToScreen(scatteredX, scatteredY);
        return { x: targetScreen.x, y: targetScreen.y };
    }
    
    /**
     * Get the exact ground level at a screen position
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {number} Ground Y coordinate
     */
    getGroundLevel(screenX, screenY) {
        if (typeof gridManager === 'undefined') {
            return gameConfig.canvas?.baseHeight || 450;
        }
        
        const gridPos = gridManager.screenToIso(screenX, screenY);
        return gridManager.getGroundY(gridPos.x, gridPos.y);
    }
    
    // VELOCITY CALCULATION SYSTEM
    
    /**
     * Calculate initial velocity towards a target with natural variation
     * @param {number} startX 
     * @param {number} startY 
     * @param {number} targetX 
     * @param {number} targetY 
     * @param {number} speed - Base movement speed
     * @param {number} scatter - Velocity randomness (0-1)
     * @returns {Object} {vx, vy} velocity components
     */
    calculateTargetVelocity(startX, startY, targetX, targetY, speed = 0.5, scatter = 0.4) {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) {
            return { vx: random(-scatter, scatter), vy: random(0, speed) };
        }
        
        // Normalize and apply speed
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;
        
        return {
            vx: normalizedX * speed + random(-scatter, scatter),
            vy: normalizedY * speed + random(-scatter, scatter)
        };
    }
    
    /**
     * Calculate upward burst velocity (for joy particles, butterfly takeoff, etc)
     * @param {number} minUpward - Minimum upward velocity
     * @param {number} maxUpward - Maximum upward velocity  
     * @param {number} horizontalSpread - Horizontal randomness
     * @returns {Object} {vx, vy} velocity components
     */
    calculateBurstVelocity(minUpward = -2, maxUpward = -0.5, horizontalSpread = 1) {
        return {
            vx: random(-horizontalSpread, horizontalSpread),
            vy: random(minUpward, maxUpward)
        };
    }
    
    // FORCE APPLICATION SYSTEM
    
    /**
     * Apply attraction force towards a target position
     * @param {Object} entity - Entity with x, y, vx, vy properties
     * @param {number} targetX 
     * @param {number} targetY 
     * @param {number} strength - Force strength
     * @param {number} horizontalFactor - How much horizontal vs vertical pull (0-1)
     */
    applyAttractionForce(entity, targetX, targetY, strength = 0.1, horizontalFactor = 0.3) {
        const dx = targetX - entity.x;
        const dy = targetY - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
            entity.vx += (dx / distance) * strength * horizontalFactor;
            entity.vy += (dy / distance) * strength + 0.05; // Extra downward bias
        }
    }
    
    /**
     * Apply standard gravity (straight down)
     * @param {Object} entity - Entity with vy property
     * @param {number} gravityStrength - Custom gravity strength
     */
    applyGravity(entity, gravityStrength = null) {
        entity.vy += gravityStrength || this.gravity;
    }
    
    /**
     * Apply friction to velocity
     * @param {Object} entity - Entity with vx, vy properties
     * @param {number} frictionAmount - Custom friction (0-1)
     */
    applyFriction(entity, frictionAmount = null) {
        const friction = frictionAmount || this.friction;
        entity.vx *= friction;
        entity.vy *= friction;
    }
    
    // COLLISION AND LANDING SYSTEM
    
    /**
     * Handle ground collision with scatter and bounce
     * @param {Object} entity - Entity with x, y, vx, vy, size properties
     * @param {number} groundY - Ground level Y coordinate
     * @param {number} scatterForce - Horizontal scatter on bounce
     * @param {number} bounceStrength - Vertical bounce strength
     * @returns {boolean} True if entity settled
     */
    handleGroundCollision(entity, groundY, scatterForce = 0.3, bounceStrength = null) {
        const bounce = bounceStrength || this.bounce;
        
        if (entity.y + entity.size >= groundY) {
            entity.y = groundY - entity.size;
            entity.vy *= -bounce;
            
            // Add horizontal scatter
            entity.vx += random(-scatterForce, scatterForce);
            
            // Check if settled
            if (Math.abs(entity.vy) < 0.15 && Math.abs(entity.vx) < 0.15) {
                entity.vx = 0;
                entity.vy = 0;
                entity.x += random(-2, 2); // Final scatter
                return true; // Settled
            }
        }
        
        return false; // Still moving
    }
    
    /**
     * Check if entity is within isometric bounds
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position  
     * @returns {boolean} True if in bounds
     */
    isInBounds(x, y) {
        if (typeof gridManager === 'undefined') {
            return x >= 0 && x <= (gameConfig.canvas?.baseWidth || 800) &&
                   y >= 0 && y <= (gameConfig.canvas?.baseHeight || 450);
        }
        
        const gridPos = gridManager.screenToIso(x, y);
        return gridManager.isInBounds(gridPos.x, gridPos.y);
    }
    
    // MOVEMENT INTERPOLATION SYSTEM
    
    /**
     * Calculate smooth movement between two isometric positions
     * @param {Object} startGrid - {x, y} grid coordinates
     * @param {Object} endGrid - {x, y} grid coordinates  
     * @param {number} progress - Interpolation progress (0-1)
     * @returns {Object} {x, y} screen coordinates
     */
    interpolateIsometricMovement(startGrid, endGrid, progress) {
        const lerpedX = lerp(startGrid.x, endGrid.x, progress);
        const lerpedY = lerp(startGrid.y, endGrid.y, progress);
        
        if (typeof gridManager !== 'undefined') {
            return gridManager.isoToScreen(lerpedX, lerpedY);
        }
        
        // Fallback linear interpolation in screen space
        return { x: lerpedX, y: lerpedY };
    }
    
    // UTILITY FUNCTIONS
    
    /**
     * Add natural drift to entity movement
     * @param {Object} entity - Entity with vx, vy properties
     * @param {number} driftStrength - How much drift to add
     * @param {number} probability - Chance per frame to apply drift
     */
    addIsometricDrift(entity, driftStrength = 0.01, probability = 0.3) {
        if (random() < probability) {
            entity.vx += driftStrength * (random() < 0.5 ? 1 : -1);
        }
    }
    
    /**
     * Calculate distance between two points (for proximity checks)
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     * @returns {number} Distance
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get grid coordinates from screen position
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {Object} {x, y} grid coordinates
     */
    screenToGrid(screenX, screenY) {
        if (typeof gridManager !== 'undefined') {
            return gridManager.screenToIso(screenX, screenY);
        }
        return { x: screenX / 32, y: screenY / 16 }; // Fallback approximation
    }
    
    /**
     * Get screen coordinates from grid position
     * @param {number} gridX 
     * @param {number} gridY 
     * @returns {Object} {x, y} screen coordinates
     */
    gridToScreen(gridX, gridY) {
        if (typeof gridManager !== 'undefined') {
            return gridManager.isoToScreen(gridX, gridY);
        }
        return { x: gridX * 32, y: gridY * 16 }; // Fallback approximation
    }
}

// Create global instance
const isometricPhysics = new IsometricPhysics();