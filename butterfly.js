class Butterfly {
    constructor(x, y, colors) {
        this.x = x;
        this.y = y;
        // Store grid position for isometric movement
        this.gridPos = screenToIso(x, y);
        this.targetGridPos = {...this.gridPos};
        this.size = 12; // Smaller, cuter butterflies
        this.colors = colors;
        
        this.wingAngle = 0;
        this.wingSpeed = 0.05;
        
        this.speed = 0.008; // Much slower movement
        this.wanderTimer = random(60, 120); // How often to pick new destination
        
        // Goal-oriented movement
        this.goalGridPos = {...this.gridPos}; // Long-term destination
        this.movesSinceNewGoal = 0; // Track moves toward current goal
        
        this.pixelDropTimer = 0;
        this.lastPixelDrop = 0;
        
        this.lifetime = 10000; // Long lifetime for testing
    }
    
    update(cursorX, cursorY, cursorVelocity, stillFrames, flowers, particleSystem) {
        this.lifetime--;
        
        // Simple wandering behavior
        this.wander(flowers);
        
        // Move toward target
        this.move();
        
        // Update wing animation
        this.updateWings();
        
        // Occasionally drop pixels
        if (frameCount % 120 === 0 && random() < 0.3) {
            const color = random(this.colors);
            particleSystem.emit(this.x, this.y, color, 1, 'scale');
        }
    }
    
    move() {
        // Move in grid space for proper isometric movement
        const gridDx = this.targetGridPos.x - this.gridPos.x;
        const gridDy = this.targetGridPos.y - this.gridPos.y;
        
        // Update grid position
        this.gridPos.x += gridDx * this.speed;
        this.gridPos.y += gridDy * this.speed;
        
        // Convert to screen space
        const newScreenPos = isoToScreen(this.gridPos.x, this.gridPos.y);
        this.x = newScreenPos.x;
        this.y = newScreenPos.y - config.entityHeightOffset.butterfly;
    }
    
    updateWings() {
        this.wingAngle += this.wingSpeed;
    }
    
    wander(flowers) {
        this.wanderTimer--;
        
        if (this.wanderTimer <= 0) {
            this.wanderTimer = random(40, 90); // Wander more frequently but shorter distances
            
            const maxWanderDistance = 3; // Maximum grid units to move
            
            if (flowers.length > 0 && random() < 0.3) {
                // Sometimes move toward a flower if it's nearby
                const nearbyFlowers = flowers.filter(flower => {
                    const flowerGrid = screenToIso(flower.x, flower.y);
                    const dist = abs(flowerGrid.x - this.gridPos.x) + abs(flowerGrid.y - this.gridPos.y);
                    return dist < maxWanderDistance * 2;
                });
                
                if (nearbyFlowers.length > 0) {
                    const flower = random(nearbyFlowers);
                    const flowerGrid = screenToIso(flower.x, flower.y);
                    // Move partially toward the flower
                    const dx = constrain(flowerGrid.x - this.gridPos.x, -maxWanderDistance, maxWanderDistance);
                    const dy = constrain(flowerGrid.y - this.gridPos.y, -maxWanderDistance, maxWanderDistance);
                    this.targetGridPos.x = constrain(this.gridPos.x + dx * 0.5, 0, config.isoBounds.maxX);
                    this.targetGridPos.y = constrain(this.gridPos.y + dy * 0.5, 0, config.isoBounds.maxY);
                } else {
                    // No nearby flowers, do local wander
                    this.localWander(maxWanderDistance);
                }
            } else {
                // Local wandering within small radius
                this.localWander(maxWanderDistance);
            }
        }
    }
    
    localWander(maxDistance) {
        // Pick a random direction and distance
        const angle = random(TWO_PI);
        const distance = random(0.5, maxDistance);
        
        // Calculate new position
        const newX = this.gridPos.x + cos(angle) * distance;
        const newY = this.gridPos.y + sin(angle) * distance;
        
        // Constrain to bounds
        this.targetGridPos.x = constrain(newX, 1, config.isoBounds.maxX - 1);
        this.targetGridPos.y = constrain(newY, 1, config.isoBounds.maxY - 1);
    }
    
    draw(graphics) {
        graphics.push();
        
        // No alpha/transparency - completely solid
        
        // Draw solid shadow
        const shadowY = config.entityHeightOffset.butterfly;
        graphics.noStroke();
        graphics.fill(0, 0, 0, 50); // Darker solid shadow
        graphics.ellipse(this.x, this.y + shadowY, this.size * 0.8, this.size * 0.4);
        
        // Draw butterfly
        graphics.translate(this.x, this.y);
        
        const wingFlap = sin(this.wingAngle);
        const wingSpread = map(wingFlap, -1, 1, 0.4, 1);
        const wingTilt = map(wingFlap, -1, 1, -0.2, 0.1);
        
        graphics.noStroke();
        
        // Draw wings with Stardew Valley style - attached to body
        graphics.push();
        graphics.rotate(wingTilt);
        this.drawStardewWing(graphics, -1, wingSpread); // Left wing
        this.drawStardewWing(graphics, 1, wingSpread);  // Right wing
        graphics.pop();
        
        // Draw body on top
        this.drawBody(graphics);
        
        graphics.pop();
    }
    
    drawStardewWing(graphics, direction, spread) {
        graphics.push();
        graphics.scale(spread, 1);
        
        // Stardew Valley style wing - simpler, cuter, attached to body
        const wingPattern = [
            [0,0,1,1,1],
            [0,1,1,1,1],
            [1,1,1,1,1],
            [1,1,1,1,0],
            [1,1,1,0,0],
            [0,1,0,0,0]
        ];
        
        // Wing base position (attached to body)
        const startX = direction * 2;
        const startY = -2;
        
        for (let y = 0; y < wingPattern.length; y++) {
            for (let x = 0; x < wingPattern[y].length; x++) {
                if (wingPattern[y][x]) {
                    // Main wing color - full opacity
                    graphics.fill(this.colors[0][0], this.colors[0][1], this.colors[0][2]);
                    
                    // Add pattern spots
                    if ((x === 2 && y === 2) || (x === 3 && y === 1)) {
                        graphics.fill(this.colors[1][0], this.colors[1][1], this.colors[1][2]);
                    }
                    
                    // Edge darkening for depth
                    if (x === 0 || x === 4 || y === 5) {
                        const dark = 0.8;
                        graphics.fill(
                            this.colors[0][0] * dark,
                            this.colors[0][1] * dark,
                            this.colors[0][2] * dark
                        );
                    }
                    
                    const pixelX = startX + (x * 2 * direction);
                    const pixelY = startY + (y * 2) - 4;
                    graphics.rect(pixelX, pixelY, 2, 2);
                }
            }
        }
        
        graphics.pop();
    }
    
    drawBody(graphics) {
        // Cute pixel art body - full opacity
        graphics.fill(40, 30, 20);
        graphics.rect(-2, -3, 4, 6); // Main body
        
        // Body highlights
        graphics.fill(60, 45, 30);
        graphics.rect(-1, -2, 2, 4);
        
        // Head
        graphics.fill(40, 30, 20);
        graphics.rect(-1, -4, 2, 2);
        
        // Antennae
        graphics.fill(40, 30, 20);
        graphics.rect(-2, -5, 1, 2);
        graphics.rect(1, -5, 1, 2);
    }
    
    isDead() {
        return this.lifetime <= 0;
    }
}