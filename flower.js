class Flower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.stage = 'bloom';
        this.stageTimer = 0;
        this.stageDurations = {
            bloom: 600,     // 10 seconds at 60fps
            mature: 1200,   // 20 seconds
            wilting: 600,   // 10 seconds
            dissolve: 180   // 3 seconds
        };
        
        this.size = 8;
        this.petalCount = 5;
        this.stemHeight = 20;
        this.petalColor = [
            random(200, 255),
            random(150, 255),
            random(200, 255)
        ];
        this.centerColor = [255, 230, 100];
        
        this.pollenTimer = 0;
        this.pollenCooldown = 180;
        this.lastVisitor = null;
        
        this.swayAngle = 0;
        this.swaySpeed = 0.02 + random(0.01);
        this.swayAmount = 0.1;
    }
    
    update(butterflies, particleSystem) {
        this.stageTimer++;
        this.swayAngle += this.swaySpeed;
        
        const currentDuration = this.stageDurations[this.stage];
        if (this.stageTimer >= currentDuration) {
            this.nextStage();
        }
        
        if (this.stage === 'mature') {
            this.checkButterflyVisits(butterflies, particleSystem);
        }
        
        if (this.pollenTimer > 0) {
            this.pollenTimer--;
        }
    }
    
    nextStage() {
        const stages = ['bloom', 'mature', 'wilting', 'dissolve'];
        const currentIndex = stages.indexOf(this.stage);
        
        if (currentIndex < stages.length - 1) {
            this.stage = stages[currentIndex + 1];
            this.stageTimer = 0;
        }
    }
    
    checkButterflyVisits(butterflies, particleSystem) {
        for (let butterfly of butterflies) {
            const dist = Math.hypot(butterfly.x - this.x, butterfly.y - this.y);
            
            if (dist < 20 && 
                butterfly.state === 'resting' && 
                butterfly !== this.lastVisitor &&
                this.pollenTimer === 0) {
                
                this.generatePollen(particleSystem);
                this.lastVisitor = butterfly;
                this.pollenTimer = this.pollenCooldown;
            }
        }
    }
    
    generatePollen(particleSystem) {
        const pollenColor = [250, 250, 250];
        
        for (let i = 0; i < 3; i++) {
            const angle = random(TWO_PI);
            const distance = random(5, 15);
            const px = this.x + cos(angle) * distance;
            const py = this.y - this.size + sin(angle) * distance;
            
            const pollen = new Pixel(px, py, pollenColor, 'pollen');
            pollen.vx = cos(angle) * 0.5;
            pollen.vy = -random(0.5, 1);
            pollen.lifetime = 400;
            
            particleSystem.particles.push(pollen);
        }
    }
    
    draw(graphics) {
        graphics.push();
        graphics.translate(this.x, this.y);
        
        const sway = sin(this.swayAngle) * this.swayAmount;
        graphics.rotate(sway);
        
        let alpha = 255;
        if (this.stage === 'dissolve') {
            alpha = map(this.stageTimer, 0, this.stageDurations.dissolve, 255, 0);
        }
        
        graphics.stroke(100, 180, 100, alpha * 0.95);
        graphics.strokeWeight(2);
        graphics.line(0, 0, 0, this.stemHeight);
        
        graphics.translate(0, -this.stemHeight);
        
        const petalSize = this.stage === 'bloom' ? 
            map(this.stageTimer, 0, this.stageDurations.bloom, 2, this.size) :
            this.stage === 'wilting' ?
            map(this.stageTimer, 0, this.stageDurations.wilting, this.size, this.size * 0.6) :
            this.size;
        
        graphics.noStroke();
        
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            
            let petalAlpha = alpha;
            if (this.stage === 'wilting') {
                petalAlpha *= map(this.stageTimer, 0, this.stageDurations.wilting, 1, 0.5);
            }
            
            graphics.fill(
                this.petalColor[0],
                this.petalColor[1],
                this.petalColor[2],
                petalAlpha * 0.95
            );
            
            for (let j = 0; j < petalSize; j += 2) {
                const px = cos(angle) * j;
                const py = sin(angle) * j;
                const size = map(j, 0, petalSize, 4, 2);
                graphics.rect(px - size/2, py - size/2, size, size);
            }
        }
        
        const centerSize = this.stage === 'mature' ? 6 : 4;
        graphics.fill(this.centerColor[0], this.centerColor[1], this.centerColor[2], alpha * 0.95);
        graphics.rect(-centerSize/2, -centerSize/2, centerSize, centerSize);
        
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 100;
            graphics.fill(255, 255, 255, glowAlpha);
            graphics.rect(-centerSize/2 - 1, -centerSize/2 - 1, centerSize + 2, centerSize + 2);
        }
        
        graphics.pop();
    }
    
    isDead() {
        return this.stage === 'dissolve' && 
               this.stageTimer >= this.stageDurations.dissolve;
    }
    
    canPlantNear(x, y) {
        const dist = Math.hypot(this.x - x, this.y - y);
        return dist > 40;
    }
}

class FlowerManager {
    constructor() {
        this.pollenCount = 5;
    }
    
    update(flowers, butterflies, particleSystem) {
        this.pollenCount = 0;
        
        for (let particle of particleSystem.particles) {
            if (particle.type === 'pollen' && !particle.settled) {
                this.pollenCount++;
            }
        }
        
        for (let i = flowers.length - 1; i >= 0; i--) {
            const flower = flowers[i];
            flower.update(butterflies, particleSystem);
            
            if (flower.isDead()) {
                for (let j = 0; j < 5; j++) {
                    particleSystem.emit(
                        flower.x + random(-10, 10),
                        flower.y + random(-5, 5),
                        flower.petalColor,
                        1,
                        'scale'
                    );
                }
                flowers.splice(i, 1);
            }
        }
    }
    
    canPlant(x, y, flowers) {
        if (this.pollenCount < 5) return false;
        
        // Only allow planting within the isometric playable area
        if (!isWithinPlayableArea(x, y)) return false;
        
        for (let flower of flowers) {
            if (!flower.canPlantNear(x, y)) {
                return false;
            }
        }
        
        return true;
    }
    
    plantFlower(x, y, flowers, particleSystem) {
        if (this.canPlant(x, y, flowers) && flowers.length < 6) {
            flowers.push(new Flower(x, y));
            
            let pollenConsumed = 0;
            for (let i = particleSystem.particles.length - 1; i >= 0; i--) {
                const particle = particleSystem.particles[i];
                if (particle.type === 'pollen' && pollenConsumed < 5) {
                    particleSystem.particles.splice(i, 1);
                    pollenConsumed++;
                }
            }
            
            particleSystem.emitBurst(x, y, [255, 255, 255], 8);
            
            return true;
        }
        return false;
    }
    
    drawPlantingHint(graphics, x, y, flowers) {
        if (this.canPlant(x, y, flowers)) {
            graphics.push();
            graphics.translate(x, y);
            
            const alpha = (sin(frameCount * 0.1) + 1) * 0.5 * 50 + 50;
            graphics.noFill();
            graphics.stroke(255, 255, 255, alpha);
            graphics.strokeWeight(1);
            
            for (let i = 0; i < 5; i++) {
                const angle = (TWO_PI / 5) * i + frameCount * 0.02;
                const px = cos(angle) * 8;
                const py = sin(angle) * 8;
                graphics.rect(px - 1, py - 1, 2, 2);
            }
            
            graphics.pop();
        }
    }
}