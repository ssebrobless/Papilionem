class Butterfly {
    constructor(x, y, colors) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 12; // Smaller, cuter butterflies
        this.colors = colors;
        this.elasticForce = 0.02; // Pull strength when outside bounds
        
        this.state = 'resting';
        this.stateTimer = 0;
        this.wingAngle = 0;
        this.wingSpeed = 0.05;
        
        this.personality = random(['brave', 'cautious', 'curious']);
        this.comfortZone = this.personality === 'brave' ? 50 : 
                          this.personality === 'cautious' ? 90 : 70;
        this.fleeDistance = this.personality === 'brave' ? 30 : 
                           this.personality === 'cautious' ? 70 : 50;
        
        this.speed = 0.05;
        this.wanderTimer = random(100, 200);
        this.restingFlower = null;
        
        this.pixelDropTimer = 0;
        this.lastPixelDrop = 0;
        
        this.lifetime = 1000 + random(500);
        this.fadeStartLifetime = 200;
    }
    
    update(cursorX, cursorY, cursorVelocity, stillFrames, flowers, particleSystem) {
        this.lifetime--;
        
        const distToCursor = dist(this.x, this.y, cursorX, cursorY);
        
        switch(this.state) {
            case 'resting':
                this.updateResting(distToCursor, cursorVelocity);
                break;
            case 'alert':
                this.updateAlert(distToCursor, cursorVelocity, stillFrames);
                break;
            case 'display':
                this.updateDisplay(particleSystem);
                break;
            case 'fleeing':
                this.updateFleeing(cursorX, cursorY, particleSystem);
                break;
        }
        
        this.move();
        this.updateWings();
        this.wander(flowers);
    }
    
    updateResting(distToCursor, cursorVelocity) {
        this.wingSpeed = 0.02;
        
        if (distToCursor < this.fleeDistance && cursorVelocity > 4) {
            this.setState('fleeing');
        } else if (distToCursor < this.comfortZone) {
            this.setState('alert');
        }
    }
    
    updateAlert(distToCursor, cursorVelocity, stillFrames) {
        this.wingSpeed = 0.01;
        
        if (cursorVelocity > 5 || distToCursor < this.fleeDistance) {
            this.setState('fleeing');
        } else if (distToCursor > this.comfortZone) {
            this.setState('resting');
        } else if (stillFrames > 120 && this.personality !== 'cautious') {
            this.setState('display');
        }
    }
    
    updateDisplay(particleSystem) {
        this.wingSpeed = 0.1;
        this.stateTimer++;
        
        if (this.stateTimer > 60 && this.stateTimer % 20 === 0) {
            const color = random(this.colors);
            particleSystem.emitBurst(this.x, this.y, color, 5);
        }
        
        if (this.stateTimer > 150) {
            this.setState('resting');
        }
    }
    
    updateFleeing(cursorX, cursorY, particleSystem) {
        this.wingSpeed = 0.25;
        this.speed = 0.12;
        
        const angle = atan2(this.y - cursorY, this.x - cursorX);
        const fleeDistance = 60; // Less dramatic flee distance
        this.targetX = this.x + cos(angle) * fleeDistance;
        this.targetY = this.y + sin(angle) * fleeDistance;
        
        // Don't constrain immediately - let elastic boundary handle it
        
        if (frameCount % 5 === 0) {
            // Drop darker, more visible stress particles
            const color = [
                this.colors[0][0] * 0.6,
                this.colors[0][1] * 0.6,
                this.colors[0][2] * 0.6
            ];
            particleSystem.emit(this.x, this.y, color, 3, 'scale');
        }
        
        this.stateTimer++;
        if (this.stateTimer > 60) {
            this.setState('resting');
            this.speed = 0.05; // Return to normal speed
        } else if (this.stateTimer > 30) {
            // Gradual deceleration
            this.speed = max(0.05, this.speed * 0.95);
        }
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }
    
    move() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        // Apply elastic boundary force if outside playable area
        if (!isWithinPlayableArea(this.x, this.y)) {
            // Find nearest point within bounds
            const gridCenterX = config.isoBounds.maxX / 2;
            const gridCenterY = config.isoBounds.maxY / 2;
            
            // Try to find the closest edge point
            let closestGridX = constrain(gridCenterX, 0, config.isoBounds.maxX);
            let closestGridY = constrain(gridCenterY, 0, config.isoBounds.maxY);
            
            const nearestInBounds = isoToScreen(closestGridX, closestGridY);
            
            // Calculate distance from playable area
            const distFromBounds = dist(this.x, this.y, nearestInBounds.x, nearestInBounds.y);
            const softBoundary = 80;  // Start gentle pull
            const hardBoundary = 150; // Maximum distance allowed
            
            if (distFromBounds > softBoundary) {
                // Gradual elastic pull that gets stronger with distance
                const pullAngle = atan2(nearestInBounds.y - this.y, nearestInBounds.x - this.x);
                const overDistance = distFromBounds - softBoundary;
                const pullStrength = min(overDistance / (hardBoundary - softBoundary), 1) * this.elasticForce;
                
                // Apply pull to target, not position directly
                this.targetX += cos(pullAngle) * pullStrength * 50;
                this.targetY += sin(pullAngle) * pullStrength * 50;
            }
        }
        
        this.x += dx * this.speed;
        this.y += dy * this.speed;
    }
    
    updateWings() {
        this.wingAngle += this.wingSpeed;
    }
    
    wander(flowers) {
        this.wanderTimer--;
        
        if (this.wanderTimer <= 0 && this.state === 'resting') {
            this.wanderTimer = random(100, 300);
            
            if (flowers.length > 0 && random() < 0.6) {
                const flower = random(flowers);
                this.targetX = flower.x + random(-8, 8);
                this.targetY = flower.y - 8;
                this.restingFlower = flower;
            } else {
                // Wander to a random position within the isometric bounds
                const gridX = random(1, config.isoBounds.maxX - 1);
                const gridY = random(1, config.isoBounds.maxY - 1);
                const screenPos = isoToScreen(gridX, gridY);
                this.targetX = screenPos.x;
                this.targetY = screenPos.y - config.entityHeightOffset.butterfly;
                this.restingFlower = null;
            }
        }
    }
    
    draw(graphics) {
        graphics.push();
        graphics.translate(this.x, this.y);
        
        let alpha = 255;
        if (this.lifetime < this.fadeStartLifetime) {
            alpha = map(this.lifetime, 0, this.fadeStartLifetime, 0, 255);
        }
        
        const wingFlap = sin(this.wingAngle);
        const wingSpread = map(wingFlap, -1, 1, 0.4, 1);
        const wingTilt = map(wingFlap, -1, 1, -0.2, 0.1);
        
        graphics.noStroke();
        
        // Draw wings with Stardew Valley style - attached to body
        graphics.push();
        graphics.rotate(wingTilt);
        this.drawStardewWing(graphics, -1, wingSpread, alpha); // Left wing
        this.drawStardewWing(graphics, 1, wingSpread, alpha);  // Right wing
        graphics.pop();
        
        // Draw body on top
        this.drawBody(graphics, alpha);
        
        graphics.pop();
    }
    
    drawStardewWing(graphics, direction, spread, alpha) {
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
                    // Main wing color
                    graphics.fill(this.colors[0][0], this.colors[0][1], this.colors[0][2], alpha);
                    
                    // Add pattern spots
                    if ((x === 2 && y === 2) || (x === 3 && y === 1)) {
                        graphics.fill(this.colors[1][0], this.colors[1][1], this.colors[1][2], alpha);
                    }
                    
                    // Edge darkening for depth
                    if (x === 0 || x === 4 || y === 5) {
                        const dark = 0.8;
                        graphics.fill(
                            this.colors[0][0] * dark,
                            this.colors[0][1] * dark,
                            this.colors[0][2] * dark,
                            alpha
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
    
    drawBody(graphics, alpha) {
        // Cute pixel art body
        graphics.fill(40, 30, 20, alpha);
        graphics.rect(-2, -3, 4, 6); // Main body
        
        // Body highlights
        graphics.fill(60, 45, 30, alpha);
        graphics.rect(-1, -2, 2, 4);
        
        // Head
        graphics.fill(40, 30, 20, alpha);
        graphics.rect(-1, -4, 2, 2);
        
        // Antennae
        graphics.fill(40, 30, 20, alpha * 0.8);
        graphics.rect(-2, -5, 1, 2);
        graphics.rect(1, -5, 1, 2);
    }
    
    isDead() {
        return this.lifetime <= 0;
    }
}