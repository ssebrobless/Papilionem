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
        
        this.size = 10;
        this.stemHeight = 16;
        
        // Pick a random flower type
        const flowerTypes = ['daisy', 'tulip', 'rose', 'sunflower', 'lily'];
        this.flowerType = random(flowerTypes);
        
        // Set properties based on flower type
        switch(this.flowerType) {
            case 'daisy':
                this.petalCount = 8;
                this.petalStyle = 'thin';
                break;
            case 'tulip':
                this.petalCount = 6;
                this.petalStyle = 'cup';
                break;
            case 'rose':
                this.petalCount = 5;
                this.petalStyle = 'layered';
                break;
            case 'sunflower':
                this.petalCount = 12;
                this.petalStyle = 'pointed';
                this.size = 12; // Bigger
                break;
            case 'lily':
                this.petalCount = 6;
                this.petalStyle = 'curved';
                break;
        }
        
        // Stronger, more saturated colors matching the background palette
        const flowerPalettes = [
            { petals: [255, 180, 120], center: [255, 240, 180] }, // Warm orange
            { petals: [255, 150, 200], center: [255, 255, 220] }, // Pink
            { petals: [200, 150, 255], center: [255, 230, 150] }, // Purple
            { petals: [255, 220, 150], center: [255, 255, 200] }, // Yellow
            { petals: [180, 220, 255], center: [255, 255, 240] }  // Light blue
        ];
        const palette = random(flowerPalettes);
        this.petalColor = palette.petals;
        this.centerColor = palette.center;
        
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
        
        // No alpha/transparency - fully opaque except during dissolve
        let alpha = 255;
        if (this.stage === 'dissolve') {
            alpha = map(this.stageTimer, 0, this.stageDurations.dissolve, 255, 0);
        }
        
        // Draw solid shadow at base
        graphics.noStroke();
        graphics.fill(0, 0, 0, 50); // Solid shadow
        graphics.ellipse(this.x, this.y + 2, this.size * 1.5, this.size * 0.7);
        
        graphics.translate(this.x, this.y);
        
        const sway = sin(this.swayAngle) * this.swayAmount;
        graphics.rotate(sway);
        
        // Pixel art stem
        graphics.noStroke();
        graphics.fill(80, 140, 80, alpha);
        graphics.rect(-2, 0, 4, this.stemHeight);
        graphics.fill(100, 160, 100, alpha);
        graphics.rect(-1, 0, 2, this.stemHeight);
        
        // Add leaves for some flower types
        if (this.flowerType === 'rose' || this.flowerType === 'tulip') {
            graphics.fill(90, 150, 90, alpha);
            graphics.rect(-6, this.stemHeight * 0.6, 4, 6);
            graphics.rect(2, this.stemHeight * 0.4, 4, 6);
        }
        
        graphics.translate(0, -this.stemHeight);
        
        // Draw petals based on flower type
        switch(this.flowerType) {
            case 'daisy':
                this.drawDaisyPetals(graphics, alpha);
                break;
            case 'tulip':
                this.drawTulipPetals(graphics, alpha);
                break;
            case 'rose':
                this.drawRosePetals(graphics, alpha);
                break;
            case 'sunflower':
                this.drawSunflowerPetals(graphics, alpha);
                break;
            case 'lily':
                this.drawLilyPetals(graphics, alpha);
                break;
        }
        
        graphics.pop();
    }
    
    drawDaisyPetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        
        // Thin, elongated petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            
            graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
            
            // Draw elongated petals
            for (let j = 0; j < petalSize; j += 2) {
                const px = cos(angle) * j;
                const py = sin(angle) * j;
                const size = map(j, 0, petalSize, 3, 1);
                graphics.rect(px - size/2, py - size/2, size, size);
            }
        }
        
        // Yellow center
        const centerSize = 6;
        graphics.fill(255, 220, 100, alpha);
        graphics.rect(-centerSize/2, -centerSize/2, centerSize, centerSize);
        graphics.fill(255, 240, 150, alpha);
        graphics.rect(-2, -2, 2, 2);
        
        // Pollen ready glow for mature flowers
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 100;
            graphics.fill(255, 255, 255, glowAlpha);
            graphics.rect(-centerSize/2 - 1, -centerSize/2 - 1, centerSize + 2, centerSize + 2);
        }
    }
    
    drawTulipPetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        
        // Cup-shaped petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            
            graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
            
            // Draw cup-shaped petals
            for (let y = -petalSize; y < petalSize/2; y += 2) {
                const width = map(y, -petalSize, petalSize/2, 2, 6);
                const px = cos(angle) * width;
                const py = sin(angle) * width + y;
                graphics.rect(px - 2, py - 2, 4, 4);
            }
        }
        
        // Dark center
        graphics.fill(40, 30, 20, alpha);
        graphics.rect(-3, -3, 6, 6);
        
        // Pollen ready glow for mature flowers
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 100;
            graphics.fill(255, 255, 200, glowAlpha);
            graphics.ellipse(0, 0, 10, 10);
        }
    }
    
    drawRosePetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        
        // Layered petals
        for (let layer = 2; layer >= 0; layer--) {
            const layerSize = petalSize - layer * 2;
            const layerOffset = layer * 0.2;
            
            for (let i = 0; i < this.petalCount; i++) {
                const angle = (TWO_PI / this.petalCount) * i + layerOffset;
                
                const brightness = 1 - layer * 0.15;
                graphics.fill(
                    this.petalColor[0] * brightness,
                    this.petalColor[1] * brightness,
                    this.petalColor[2] * brightness,
                    alpha
                );
                
                // Draw rounded petals
                for (let r = 2; r < layerSize; r += 2) {
                    const px = cos(angle) * r;
                    const py = sin(angle) * r;
                    const size = map(r, 0, layerSize, 4, 2);
                    graphics.rect(px - size/2, py - size/2, size, size);
                }
            }
        }
        
        // Small center
        graphics.fill(this.centerColor[0], this.centerColor[1], this.centerColor[2], alpha);
        graphics.rect(-2, -2, 4, 4);
        
        // Pollen ready glow for mature flowers
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 100;
            graphics.fill(255, 220, 255, glowAlpha);
            graphics.ellipse(0, 0, 8, 8);
        }
    }
    
    drawSunflowerPetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        
        // Pointed petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            
            graphics.fill(255, 200, 50, alpha); // Always yellow for sunflowers
            
            // Draw pointed petals
            for (let j = 0; j < petalSize; j += 2) {
                const px = cos(angle) * j;
                const py = sin(angle) * j;
                const size = j < petalSize * 0.7 ? 3 : 2;
                graphics.rect(px - size/2, py - size/2, size, size);
            }
        }
        
        // Large brown center with texture
        const centerSize = 10;
        graphics.fill(101, 67, 33, alpha);
        graphics.rect(-centerSize/2, -centerSize/2, centerSize, centerSize);
        
        // Add texture dots
        graphics.fill(80, 50, 20, alpha);
        for (let x = -centerSize/2 + 1; x < centerSize/2; x += 3) {
            for (let y = -centerSize/2 + 1; y < centerSize/2; y += 3) {
                graphics.rect(x, y, 1, 1);
            }
        }
        
        // Pollen ready glow for mature flowers
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 100;
            graphics.fill(255, 255, 255, glowAlpha);
            graphics.rect(-centerSize/2 - 1, -centerSize/2 - 1, centerSize + 2, centerSize + 2);
        }
    }
    
    drawLilyPetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        
        // Curved, elegant petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            
            graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
            
            // Draw curved petals with gradient effect
            for (let j = 0; j < petalSize; j += 2) {
                const curve = sin((j / petalSize) * PI) * 3;
                const px = cos(angle) * j + sin(angle) * curve;
                const py = sin(angle) * j - cos(angle) * curve;
                const size = map(j, 0, petalSize, 4, 2);
                
                // Add slight color variation
                if (j > petalSize * 0.6) {
                    graphics.fill(
                        this.petalColor[0] * 0.9,
                        this.petalColor[1] * 0.9,
                        this.petalColor[2] * 0.9,
                        alpha
                    );
                }
                
                graphics.rect(px - size/2, py - size/2, size, size);
            }
        }
        
        // Stamen
        graphics.fill(255, 150, 100, alpha);
        for (let i = 0; i < 3; i++) {
            const angle = (TWO_PI / 3) * i;
            graphics.rect(cos(angle) * 3 - 1, sin(angle) * 3 - 1, 2, 2);
        }
        
        // Center
        graphics.fill(this.centerColor[0], this.centerColor[1], this.centerColor[2], alpha);
        graphics.rect(-3, -3, 6, 6);
        
        // Pollen ready glow for mature flowers
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 100;
            graphics.fill(255, 255, 255, glowAlpha);
            graphics.rect(-4, -4, 8, 8);
        }
    }
    
    getPetalSize() {
        if (this.stage === 'bloom') {
            return map(this.stageTimer, 0, this.stageDurations.bloom, 2, this.size);
        } else if (this.stage === 'wilting') {
            return map(this.stageTimer, 0, this.stageDurations.wilting, this.size, this.size * 0.6);
        }
        return this.size;
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