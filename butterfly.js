class Butterfly {
    constructor(x, y, colors) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 16;
        this.colors = colors;
        
        this.state = 'resting';
        this.stateTimer = 0;
        this.wingAngle = 0;
        this.wingSpeed = 0.05;
        
        this.personality = random(['brave', 'cautious', 'curious']);
        this.comfortZone = this.personality === 'brave' ? 40 : 
                          this.personality === 'cautious' ? 80 : 60;
        this.fleeDistance = this.personality === 'brave' ? 20 : 
                           this.personality === 'cautious' ? 60 : 40;
        
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
        
        if (distToCursor < this.comfortZone && cursorVelocity > 2) {
            this.setState('fleeing');
        } else if (distToCursor < this.comfortZone) {
            this.setState('alert');
        }
    }
    
    updateAlert(distToCursor, cursorVelocity, stillFrames) {
        this.wingSpeed = 0.01;
        
        if (cursorVelocity > 3 || distToCursor < this.fleeDistance) {
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
        this.wingSpeed = 0.3;
        this.speed = 0.15;
        
        const angle = atan2(this.y - cursorY, this.x - cursorX);
        this.targetX = this.x + cos(angle) * 100;
        this.targetY = this.y + sin(angle) * 100;
        
        // Constrain to isometric playable area
        if (!isWithinPlayableArea(this.targetX, this.targetY)) {
            // If target is outside, find a random safe position within bounds
            const safeGridX = random(1, config.isoBounds.maxX - 1);
            const safeGridY = random(1, config.isoBounds.maxY - 1);
            const safePos = isoToScreen(safeGridX, safeGridY);
            this.targetX = safePos.x;
            this.targetY = safePos.y - config.entityHeightOffset.butterfly;
        }
        
        if (frameCount % 5 === 0) {
            const color = [
                this.colors[0][0] * 0.7,
                this.colors[0][1] * 0.7,
                this.colors[0][2] * 0.7
            ];
            particleSystem.emit(this.x, this.y, color, 2, 'scale');
        }
        
        this.stateTimer++;
        if (this.stateTimer > 60) {
            this.setState('resting');
            this.speed = 0.05;
        }
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }
    
    move() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
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
                this.targetX = flower.x + random(-10, 10);
                this.targetY = flower.y - 10;
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
        
        const wingSpread = abs(sin(this.wingAngle)) * 0.8 + 0.2;
        
        graphics.noStroke();
        
        const leftWingX = -this.size * wingSpread;
        const rightWingX = this.size * wingSpread;
        const wingY = -2;
        
        graphics.fill(this.colors[0][0], this.colors[0][1], this.colors[0][2], alpha * 0.9);
        this.drawWing(graphics, leftWingX, wingY, -1);
        this.drawWing(graphics, rightWingX, wingY, 1);
        
        graphics.fill(80, 60, 40, alpha * 0.95);
        graphics.rect(-1, -3, 2, 6);
        
        graphics.pop();
    }
    
    drawWing(graphics, x, y, direction) {
        graphics.push();
        graphics.translate(x, y);
        
        for (let py = 0; py < 8; py++) {
            for (let px = 0; px < 6; px++) {
                if (this.getWingPattern(px, py)) {
                    const colorIndex = (px + py) % this.colors.length;
                    const color = this.colors[colorIndex];
                    graphics.fill(color[0], color[1], color[2], 240);
                    graphics.rect(px * 2 * direction, py * 2 - 4, 2, 2);
                }
            }
        }
        
        graphics.pop();
    }
    
    getWingPattern(x, y) {
        const patterns = [
            [1,1,1,1,1,0],
            [1,1,1,1,1,1],
            [1,1,1,1,1,1],
            [1,1,1,1,1,1],
            [1,1,1,1,1,1],
            [1,1,1,1,1,0],
            [1,1,1,0,0,0],
            [1,0,0,0,0,0]
        ];
        return patterns[y] && patterns[y][x];
    }
    
    isDead() {
        return this.lifetime <= 0;
    }
}