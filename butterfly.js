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
        this.comfortZone = this.personality === 'brave' ? 60 : 
                          this.personality === 'cautious' ? 100 : 80;
        this.fleeDistance = this.personality === 'brave' ? 40 : 
                           this.personality === 'cautious' ? 80 : 60;
        
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
        
        // Much less reactive - only flee if very close AND fast movement
        if (distToCursor < this.fleeDistance * 0.5 && cursorVelocity > 6) {
            this.setState('fleeing');
        } else if (distToCursor < this.comfortZone && cursorVelocity > 2) {
            this.setState('alert');
        }
    }
    
    updateAlert(distToCursor, cursorVelocity, stillFrames) {
        this.wingSpeed = 0.01;
        
        // Much higher thresholds for fleeing
        if (cursorVelocity > 8 && distToCursor < this.fleeDistance * 0.7) {
            this.setState('fleeing');
        } else if (distToCursor > this.comfortZone * 1.2) {
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
        this.speed = 0.1;
        
        const angle = atan2(this.y - cursorY, this.x - cursorX);
        const fleeDistance = 40; // Much less dramatic
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
        if (this.stateTimer > 45) {
            this.setState('resting');
            this.speed = 0.05; // Return to normal speed
        } else if (this.stateTimer > 20) {
            // Gradual deceleration
            this.speed = max(0.05, this.speed * 0.92);
        }
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }
    
    move() {
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        let actualSpeed = this.speed;
        
        // Check if butterfly is outside playable area
        if (!isWithinPlayableArea(this.x, this.y)) {
            // Find nearest point on the boundary
            const nearestBoundaryPoint = this.findNearestBoundaryPoint();
            const distFromBounds = dist(this.x, this.y, nearestBoundaryPoint.x, nearestBoundaryPoint.y);
            
            // Calculate angle of intended movement
            const moveAngle = atan2(dy, dx);
            
            // Calculate angle toward the playable area
            const returnAngle = atan2(nearestBoundaryPoint.y - this.y, nearestBoundaryPoint.x - this.x);
            
            // Calculate angular difference (0 = moving toward grid, PI = moving away)
            let angleDiff = abs(moveAngle - returnAngle);
            if (angleDiff > PI) angleDiff = TWO_PI - angleDiff;
            
            // Exponential resistance based on distance and angle
            const distanceFactor = pow(distFromBounds / 50, 2); // Exponential growth
            const angleFactor = angleDiff / PI; // 0 to 1, where 1 is directly away
            
            // Apply directional resistance
            if (angleDiff > PI/2) {
                // Moving away from grid - apply strong resistance
                const resistance = 1 - (0.9 * angleFactor * min(distanceFactor, 1));
                actualSpeed *= max(0.1, resistance);
            } else {
                // Moving toward grid - slight boost
                actualSpeed *= 1 + (0.3 * (1 - angleFactor));
            }
            
            // Passive pull back to bounds
            const pullStrength = min(distanceFactor * 0.03, 0.15);
            dx += (nearestBoundaryPoint.x - this.x) * pullStrength;
            dy += (nearestBoundaryPoint.y - this.y) * pullStrength;
        }
        
        this.x += dx * actualSpeed;
        this.y += dy * actualSpeed;
    }
    
    findNearestBoundaryPoint() {
        // Sample points along the boundary to find nearest
        let nearestDist = Infinity;
        let nearestPoint = null;
        
        // Check edges of the diamond
        for (let t = 0; t <= 1; t += 0.1) {
            // Top-right edge
            const tr = isoToScreen(config.isoBounds.maxX * t, 0);
            // Bottom-right edge
            const br = isoToScreen(config.isoBounds.maxX, config.isoBounds.maxY * t);
            // Bottom-left edge
            const bl = isoToScreen(config.isoBounds.maxX * (1-t), config.isoBounds.maxY);
            // Top-left edge
            const tl = isoToScreen(0, config.isoBounds.maxY * (1-t));
            
            for (let point of [tr, br, bl, tl]) {
                const d = dist(this.x, this.y, point.x, point.y);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestPoint = point;
                }
            }
        }
        
        return nearestPoint || isoToScreen(config.isoBounds.maxX/2, config.isoBounds.maxY/2);
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
                // Prefer more central positions
                const centerBias = 0.3; // How much to bias toward center
                const gridX = random(1 + centerBias, config.isoBounds.maxX - 1 - centerBias);
                const gridY = random(1 + centerBias, config.isoBounds.maxY - 1 - centerBias);
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