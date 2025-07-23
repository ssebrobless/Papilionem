class Flower extends Entity {
    constructor(x, y, isImmortal = false) {
        super(x, y);
        
        // Override base properties
        this.lifetime = 2580; // Sum of all stage durations
        this.fadeStartLifetime = 0; // We handle fading in dissolve stage
        this.shadowOffset = 2; // Flowers sit on ground
        
        // Unique ID for tracking feeding cooldowns
        this.id = `flower_${Date.now()}_${Math.floor(x)}_${Math.floor(y)}_${random(1000)}`;
        
        // Immortality flag for starting flowers
        this.isImmortal = isImmortal;
        
        // Flower lifecycle stages
        this.stage = 'bloom';
        this.stageTimer = 0;
        this.stageDurations = {
            bloom: 600,     // 10 seconds at 60fps
            mature: 1200,   // 20 seconds
            wilting: 600,   // 10 seconds
            dissolve: 180   // 3 seconds
        };
        
        // Pick a random flower type with new varieties
        const flowerTypes = ['daisy', 'tulip', 'bush', 'lavender', 'sprout'];
        this.flowerType = random(flowerTypes);
        
        // Set properties based on flower type - appropriately sized
        switch(this.flowerType) {
            case 'daisy':
                this.size = 10;
                this.stemHeight = 12;
                this.petalCount = 6;
                this.petalStyle = 'simple';
                break;
            case 'tulip':
                this.size = 11;
                this.stemHeight = 14;
                this.petalCount = 6;
                this.petalStyle = 'cup';
                break;
            case 'bush':
                this.size = 8;
                this.stemHeight = 4; // Very short, spreading
                this.clusterCount = 3 + floor(random(3)); // 3-5 flower heads
                this.petalCount = 5;
                this.petalStyle = 'cluster';
                break;
            case 'lavender':
                this.size = 6;
                this.stemHeight = gameConfig.entities.flower.stemHeight;
                this.stemCount = 3 + floor(random(3)); // 3-5 stems
                this.petalStyle = 'vertical';
                break;
            case 'sprout':
                this.size = 6;
                this.stemHeight = 3; // Tiny, close to ground
                this.petalCount = 4;
                this.petalStyle = 'tiny';
                break;
        }
        
        // Rich colors matching the background's painted aesthetic
        const flowerPalettes = [
            { petals: [255, 182, 193], center: [255, 248, 220], accent: [255, 160, 170] }, // Soft pink
            { petals: [255, 160, 200], center: [255, 220, 180], accent: [240, 140, 180] }, // Rose pink
            { petals: [218, 160, 255], center: [255, 248, 200], accent: [200, 140, 240] }, // Lavender
            { petals: [255, 200, 120], center: [255, 255, 200], accent: [240, 180, 100] }, // Peach
            { petals: [200, 180, 255], center: [255, 240, 220], accent: [180, 160, 240] }  // Periwinkle
        ];
        const palette = random(flowerPalettes);
        this.petalColor = palette.petals;
        this.centerColor = palette.center;
        this.accentColor = palette.accent;
        
        this.pollenTimer = 0;
        this.pollenCooldown = 180;
        this.lastVisitor = null;
        
        this.swayAngle = random(TWO_PI);
        this.swaySpeed = 0.02 + random(0.01);
        this.swayAmount = 0.08; // Reduced sway
        
        // Individual petal animation
        this.petalPhase = random(TWO_PI);
        this.petalWaveSpeed = 0.02; // Slower, subtler animation
    }
    
    update(gameState) {
        const { butterflies, particleSystem } = gameState;
        
        // Immortal flowers are locked at mature stage and don't age AT ALL
        if (this.isImmortal) {
            // DON'T call super.update() - this prevents base Entity lifetime decrement
            // Just update z-index manually
            this.updateZIndex();
            
            // Ensure immortal flowers are always at mature stage  
            this.stage = 'mature';
            // Only update sway animation, no stage progression
            this.swayAngle += this.swaySpeed;
            this.checkButterflyVisits(butterflies, particleSystem);
            
            if (this.pollenTimer > 0) {
                this.pollenTimer--;
            }
            return; // Skip all aging logic
        }
        
        // For mortal flowers, call parent update (which decrements lifetime)
        super.update(gameState);
        
        // Normal aging logic for mortal flowers
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
        // Use emit for pollen generation - the particle system will handle physics
        particleSystem.emit(this.x, this.y - this.size, pollenColor, 3, 'pollen');
    }
    
    // Override parent's shadow drawing for soft layered shadow
    drawShadow(graphics, alpha) {
        graphics.noStroke();
        for (let i = 3; i > 0; i--) {
            graphics.fill(0, 0, 0, min(20 * (4 - i), alpha * 0.08 * (4 - i)));
            const shadowSize = this.size * (1.2 + i * 0.3);
            graphics.ellipse(this.x, this.y + this.shadowOffset, shadowSize, shadowSize * 0.5);
        }
    }
    
    // Override parent's entity drawing
    drawEntity(graphics, alpha) {
        // Handle flower-specific alpha during dissolve (but not for immortal flowers)
        if (this.stage === 'dissolve' && !this.isImmortal) {
            alpha = map(this.stageTimer, 0, this.stageDurations.dissolve, 255, 0);
        }
        
        // Base position anchored to ground
        graphics.push();
        graphics.translate(this.x, this.y);
        
        // Draw stem(s) based on flower type
        if (this.flowerType === 'lavender') {
            this.drawLavenderStems(graphics, alpha);
        } else if (this.flowerType !== 'bush' && this.flowerType !== 'sprout') {
            this.drawStem(graphics, alpha);
        }
        
        // Draw flower head(s)
        this.drawFlowerHead(graphics, alpha);
        
        graphics.pop();
    }
    
    drawStem(graphics, alpha) {
        graphics.noStroke();
        
        // Draw stem anchored to ground - no sway applied to stem base
        for (let y = 0; y < this.stemHeight; y += 2) {
            // Only slight curve near the top (no sway at base)
            const bendFactor = (y / this.stemHeight);
            const bendAmount = bendFactor * bendFactor; // Quadratic curve
            const stemX = sin(this.swayAngle) * bendAmount * 3 * this.swayAmount;
            const stemWidth = map(y, 0, this.stemHeight, 3, 1.5);
            
            graphics.fill(80, 140, 80, alpha);
            graphics.rect(stemX - stemWidth/2, -y - 2, stemWidth, 2);
        }
    }
    drawLavenderStems(graphics, alpha) {
        // Multiple thin stems for lavender - anchored at base
        for (let i = 0; i < this.stemCount; i++) {
            const stemOffset = (i - this.stemCount/2) * 4;
            
            graphics.push();
            graphics.translate(stemOffset, 0);
            
            // Thin vertical stem with minimal sway only at top
            graphics.fill(100, 120, 140, alpha);
            for (let y = 0; y < this.stemHeight; y += 2) {
                const bendFactor = (y / this.stemHeight);
                const x = sin(this.swayAngle + i * 0.3) * bendFactor * bendFactor * 2 * this.swayAmount;
                graphics.rect(x - 1, -y - 2, 2, 2);
            }
            
            graphics.pop();
        }
    }
    
    drawFlowerHead(graphics, alpha) {
        const sway = sin(this.swayAngle) * this.swayAmount;
        
        switch(this.flowerType) {
            case 'daisy':
                graphics.push();
                // Position flower head at top of stem with sway
                graphics.translate(sway * 6, -this.stemHeight);
                graphics.rotate(sway * 0.3);
                this.drawSimpleDaisy(graphics, alpha);
                graphics.pop();
                break;
            case 'tulip':
                graphics.push();
                // Position flower head at top of stem with sway
                graphics.translate(sway * 5, -this.stemHeight);
                graphics.rotate(sway * 0.2);
                this.drawSimpleTulip(graphics, alpha);
                graphics.pop();
                break;
            case 'bush':
                this.drawBushClusters(graphics, alpha);
                break;
            case 'lavender':
                this.drawLavenderClusters(graphics, alpha);
                break;
            case 'sprout':
                graphics.push();
                // Sprouts don't sway much due to short stems
                graphics.translate(0, -this.stemHeight);
                this.drawTinySprout(graphics, alpha);
                graphics.pop();
                break;
        }
    }
    
    drawSimpleDaisy(graphics, alpha) {
        const petalSize = this.getPetalSize();
        
        // Simplified petals - single pass
        graphics.noStroke();
        graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
        
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            const px = cos(angle) * petalSize * 0.4;
            const py = sin(angle) * petalSize * 0.4;
            graphics.ellipse(px, py, petalSize * 0.6, petalSize * 0.3);
        }
        
        // Simple center
        graphics.fill(255, 220, 100, alpha);
        graphics.ellipse(0, 0, 4, 4);
        
        // Pollen ready indicator
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            graphics.fill(255, 255, 220, 60);
            graphics.ellipse(0, 0, 7, 7);
        }
    }
    
    drawSimpleTulip(graphics, alpha) {
        const petalSize = this.getPetalSize();
        
        // Simplified tulip - just an elliptical flower head
        graphics.noStroke();
        graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
        graphics.ellipse(0, 0, petalSize, petalSize * 1.2);
        
        // Simple dark center
        graphics.fill(40, 30, 20, alpha);
        graphics.ellipse(0, 0, 3, 3);
        
        // Pollen ready indicator
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            graphics.fill(255, 240, 200, 50);
            graphics.ellipse(0, 0, petalSize + 2, petalSize + 2);
        }
    }
    
    drawBushClusters(graphics, alpha) {
        const sway = sin(this.swayAngle) * this.swayAmount;
        
        // Multiple small flower heads in a cluster
        for (let i = 0; i < this.clusterCount; i++) {
            const angle = (TWO_PI / this.clusterCount) * i;
            const distance = this.size * 0.6;
            const clusterX = cos(angle) * distance + sway * 4;
            const clusterY = sin(angle) * distance * 0.3 - this.stemHeight;
            
            graphics.push();
            graphics.translate(clusterX, clusterY);
            graphics.rotate(sway * 0.2);
            
            // Simplified small flower - just petals and center
            graphics.noStroke();
            graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
            graphics.ellipse(0, 0, 5, 5); // Simple circular flower head
            
            // Tiny center
            graphics.fill(this.centerColor[0], this.centerColor[1], this.centerColor[2], alpha);
            graphics.ellipse(0, 0, 2, 2);
            
            graphics.pop();
        }
        
        // Pollen ready glow for whole cluster
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            graphics.fill(255, 255, 220, 40);
            graphics.ellipse(sway * 4, -this.stemHeight, this.size * 1.5, this.size * 0.8);
        }
    }
    
    drawLavenderClusters(graphics, alpha) {
        // Draw simplified purple clusters on each stem
        for (let i = 0; i < this.stemCount; i++) {
            const stemOffset = (i - this.stemCount/2) * 4;
            const stemSway = sin(this.swayAngle + i * 0.3) * this.swayAmount;
            
            graphics.push();
            graphics.translate(stemOffset + stemSway * 4, -this.stemHeight);
            
            // Simplified lavender spike - just a vertical cluster
            graphics.noStroke();
            graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
            
            // Draw as simple vertical ellipse with texture
            for (let j = 0; j < 5; j++) {
                const y = j * 2;
                const size = 3 - j * 0.3;
                graphics.ellipse(0, y, size, size);
            }
            
            graphics.pop();
        }
        
        // Pollen ready effect
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const avgSway = sin(this.swayAngle) * this.swayAmount * 2;
            graphics.fill(255, 220, 255, 50);
            graphics.ellipse(avgSway, -this.stemHeight - 2, this.size * 1.5, this.size * 0.8);
        }
    }
    
    drawTinySprout(graphics, alpha) {
        // Very simple tiny flower close to ground
        graphics.noStroke();
        
        // Tiny petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
            const px = cos(angle) * 3;
            const py = sin(angle) * 3;
            graphics.ellipse(px, py, 4, 4);
        }
        
        // Tiny center
        graphics.fill(this.centerColor[0], this.centerColor[1], this.centerColor[2], alpha);
        graphics.ellipse(0, 0, 3, 3);
        
        // Subtle pollen ready
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            graphics.fill(255, 255, 200, 60);
            graphics.ellipse(0, 0, 6, 6);
        }
    }
    
    
    getPetalSize() {
        let baseSize = this.size;
        
        // Subtle size variation
        baseSize += sin(frameCount * 0.02 + this.petalPhase) * 0.5;
        
        if (this.stage === 'bloom') {
            return map(this.stageTimer, 0, this.stageDurations.bloom, 2, baseSize);
        } else if (this.stage === 'wilting') {
            const wiltProgress = this.stageTimer / this.stageDurations.wilting;
            return baseSize * (1 - wiltProgress * 0.3);
        }
        return baseSize;
    }
    
    
    // Override isDead to check stage instead of lifetime
    isDead() {
        const shouldDie = this.stage === 'dissolve' && 
                         this.stageTimer >= this.stageDurations.dissolve;
        
        // Immortal flowers restart their lifecycle instead of dying
        if (shouldDie && this.isImmortal) {
            this.restartLifecycle();
            return false;
        }
        
        return shouldDie;
    }
    
    // Restart lifecycle for immortal flowers
    restartLifecycle() {
        this.stage = 'bloom';
        this.stageTimer = 0;
        this.pollenTimer = 0;
        this.lastVisitor = null;
        
        // Emit rebirth event
        eventBus.emit(GameEvents.FLOWER_BLOOMED, { flower: this });
    }
    
    canPlantNear(x, y) {
        const dist = Math.hypot(this.x - x, this.y - y);
        // Smaller spacing for smaller flowers
        return dist > 40;
    }
}

class FlowerManager {
    constructor() {
        this.pollenCount = 5;
    }
    
    update(flowers, butterflies, particleSystem) {
        this.pollenCount = particleSystem.getPollenCount();
        
        // Create a gameState object for flowers
        const gameState = { butterflies, particleSystem };
        
        for (let i = flowers.length - 1; i >= 0; i--) {
            const flower = flowers[i];
            flower.update(gameState);
            
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
        
        // Check distance from magic pool (2 tile radius exclusion)
        const gridPos = gridManager.screenToIso(x, y);
        const poolCenter = { x: 8.5, y: 7 }; // Magic pool center
        const distToPool = Math.hypot(gridPos.x - poolCenter.x, gridPos.y - poolCenter.y);
        if (distToPool < 2.5) { // 2 tile radius plus small buffer
            return false;
        }
        
        for (let flower of flowers) {
            if (!flower.canPlantNear(x, y)) {
                return false;
            }
        }
        
        return true;
    }
    
    plantFlower(x, y, flowers, particleSystem) {
        if (this.canPlant(x, y, flowers) && flowers.length < 6) {  // Original limit
            flowers.push(new Flower(x, y));
            
            // Remove pollen particles for planting (up to 5)
            let pollenConsumed = 0;
            particleSystem.removePixels(p => {
                if (p.type === 'pollen' && pollenConsumed < 5) {
                    pollenConsumed++;
                    return true;
                }
                return false;
            });
            
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