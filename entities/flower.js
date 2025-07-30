class Flower extends Entity {
    constructor(x, y, isImmortal = false) {
        super(x, y);
        
        // Unified lifecycle configuration
        this.stageDurations = {
            bloom: 600,     // 10 seconds at 60fps
            mature: 1200,   // 20 seconds
            wilting: 600,   // 10 seconds
            dissolve: 180   // 3 seconds
        };
        
        // Override base properties to match stage durations
        this.lifetime = Object.values(this.stageDurations).reduce((a, b) => a + b, 0); // 2580
        this.fadeStartLifetime = this.stageDurations.dissolve; // Fade during dissolve stage
        this.shadowOffset = 2; // Flowers sit on ground
        
        // Unique ID for tracking feeding cooldowns
        this.id = `flower_${Date.now()}_${Math.floor(x)}_${Math.floor(y)}_${random(1000)}`;
        
        // Immortality flag for starting flowers
        this.isImmortal = isImmortal;
        
        // Flower lifecycle stages
        this.stage = 'bloom';
        this.stageTimer = 0;
        
        // Flower type configuration
        const flowerConfigs = {
            daisy: {
                size: 14,
                stemHeight: 16,
                petalCount: 8,
                petalStyle: 'simple'
            },
            tulip: {
                size: 15,
                stemHeight: 18,
                petalCount: 6,
                petalStyle: 'cup'
            },
            bush: {
                size: 12,
                stemHeight: 6,
                petalCount: 6,
                petalStyle: 'cluster',
                clusterCount: () => 3 + floor(random(3)) // 3-5 flower heads
            },
            lavender: {
                size: 8,
                stemHeight: 16, // Using default height
                petalStyle: 'vertical',
                stemCount: () => 3 + floor(random(3)) // 3-5 stems
            },
            sprout: {
                size: 10,
                stemHeight: 5,
                petalCount: 5,
                petalStyle: 'tiny'
            }
        };
        
        // Pick a random flower type and apply its configuration
        const flowerTypes = Object.keys(flowerConfigs);
        this.flowerType = random(flowerTypes);
        const config = flowerConfigs[this.flowerType];
        
        // Apply base configuration
        this.size = config.size;
        this.stemHeight = config.stemHeight;
        this.petalCount = config.petalCount || 0;
        this.petalStyle = config.petalStyle;
        
        // Apply dynamic properties
        if (config.clusterCount) this.clusterCount = config.clusterCount();
        if (config.stemCount) this.stemCount = config.stemCount();
        
        // Vibrant colors with strong contrast against the background
        const flowerPalettes = [
            { petals: [255, 105, 180], center: [255, 255, 100], accent: [255, 20, 147], stemColor: [34, 139, 34] }, // Hot pink
            { petals: [255, 69, 0], center: [255, 255, 0], accent: [255, 140, 0], stemColor: [0, 100, 0] }, // Bright orange
            { petals: [148, 0, 211], center: [255, 255, 150], accent: [186, 85, 211], stemColor: [34, 139, 34] }, // Vivid purple
            { petals: [255, 20, 147], center: [255, 255, 200], accent: [255, 105, 180], stemColor: [0, 128, 0] }, // Deep pink
            { petals: [30, 144, 255], center: [255, 255, 255], accent: [0, 191, 255], stemColor: [34, 139, 34] }  // Bright blue
        ];
        const palette = random(flowerPalettes);
        this.petalColor = palette.petals;
        this.centerColor = palette.center;
        this.accentColor = palette.accent;
        this.stemColor = palette.stemColor || [34, 139, 34]; // Default green if not specified
        
        this.lastVisitor = null;
        
        // Unified animation state
        this.animation = {
            swayAngle: random(TWO_PI),
            swaySpeed: 0.02 + random(0.01),
            swayAmount: 0.08, // Reduced sway
            petalPhase: random(TWO_PI),
            petalWaveSpeed: 0.02 // Slower, subtler animation
        };
    }
    
    update(gameState) {
        const { butterflies, particleSystem } = gameState;
        
        // Update golden blessing timer
        if (this.goldenBlessing > 0) {
            this.goldenBlessing--;
        }
        
        // Update animation regardless of mortality
        this.animation.swayAngle += this.animation.swaySpeed;
        
        // Immortal flowers have special handling
        if (this.isImmortal) {
            // Only update z-index, skip lifetime decrement
            this.updateZIndex();
            // Lock at mature stage
            this.stage = 'mature';
        } else {
            // Normal flowers age
            super.update(gameState);
            this.stageTimer++;
            
            const currentDuration = this.stageDurations[this.stage];
            if (this.stageTimer >= currentDuration) {
                this.nextStage();
            }
        }
        
        // Check butterfly visits when mature
        if (this.stage === 'mature') {
            this.checkButterflyVisits(butterflies, particleSystem);
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
                butterfly.state === 'feeding' && 
                butterfly !== this.lastVisitor) {
                
                // Special interactions based on butterfly personality
                this.handleSpecialInteraction(butterfly, particleSystem);
                
                this.lastVisitor = butterfly;
            }
        }
    }
    
    // Handle special interactions based on butterfly personality
    handleSpecialInteraction(butterfly, particleSystem) {
        if (!butterfly.personalityType) return;
        
        switch (butterfly.personalityType) {
            case 'friendly':
                // Friendly butterflies make flowers bloom more vibrantly
                if (this.stage === 'mature' && frameCount % 60 === 0) {
                    // Emit heart-shaped particles
                    for (let i = 0; i < 3; i++) {
                        const angle = random(TWO_PI);
                        const dist = random(10, 20);
                        const x = this.x + cos(angle) * dist;
                        const y = this.y - this.stemHeight + sin(angle) * dist;
                        const color = [255, 182, 193]; // Light pink
                        particleSystem.emit(x, y, color, 1, 'joy');
                    }
                }
                break;
                
            case 'cautious':
                // Cautious butterflies make flowers last longer
                if (this.stage === 'mature' && !this.isImmortal) {
                    this.stageTimer = Math.max(0, this.stageTimer - 1); // Slow aging
                }
                break;
                
            case 'energetic':
                // Energetic butterflies make flowers bloom faster
                if (this.stage === 'bloom') {
                    this.stageTimer += 60; // Speed up blooming
                    particleSystem.emitBurst(this.x, this.y - this.stemHeight, [255, 200, 255], 5);
                }
                break;
                
            case 'skittish':
                // Skittish butterflies create pollen explosions from excitement
                if (random() < 0.3) {
                    for (let i = 0; i < 5; i++) {
                        particleSystem.emit(
                            this.x + random(-15, 15), 
                            this.y - this.stemHeight + random(-10, 10), 
                            [250, 250, 200], 
                            1, 
                            'pollen'
                        );
                    }
                }
                break;
                
            case 'wise':
                // Wise butterflies create sparkles around flowers
                particleSystem.emitBurst(this.x, this.y - this.stemHeight, [255, 255, 255], 5);
                break;
                
            case 'golden':
                // Golden butterflies make flowers golden temporarily
                this.goldenBlessing = 300; // 5 seconds of golden state
                particleSystem.emitSpiral(this.x, this.y - this.stemHeight, [255, 215, 0], 16);
                break;
                
            case 'mystic':
                // Mystic butterflies create rainbow particles
                const rainbowColors = [
                    [255, 0, 0], [255, 127, 0], [255, 255, 0],
                    [0, 255, 0], [0, 0, 255], [75, 0, 130], [148, 0, 211]
                ];
                for (let i = 0; i < 7; i++) {
                    const angle = (TWO_PI / 7) * i;
                    const dist = 15;
                    particleSystem.emit(
                        this.x + cos(angle) * dist, 
                        this.y - this.stemHeight + sin(angle) * dist, 
                        rainbowColors[i], 
                        1, 
                        'joy'
                    );
                }
                break;
        }
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
        // Handle flower-specific alpha during dissolve
        if (this.stage === 'dissolve') {
            alpha = map(this.stageTimer, 0, this.stageDurations.dissolve, 255, 0);
        }
        
        // Base position anchored to ground
        graphics.push();
        graphics.translate(this.x, this.y);
        
        // Draw golden blessing effect
        if (this.goldenBlessing > 0) {
            this.drawGoldenBlessing(graphics);
        }
        
        // Draw pulsing guide aura when butterflies are being led
        if (this.shouldShowLeadingGuide()) {
            this.drawLeadingGuideAura(graphics);
        }
        
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
    
    // Draw golden blessing effect
    drawGoldenBlessing(graphics) {
        graphics.push();
        graphics.noStroke();
        
        const pulse = sinFrame(frameCount, 0.1) * 0.3 + 0.7;
        const alpha = (this.goldenBlessing / 300) * 100 * pulse;
        
        // Golden glow around entire flower
        for (let i = 3; i > 0; i--) {
            graphics.fill(255, 215, 0, alpha / i);
            const size = (30 + i * 10) * pulse;
            graphics.ellipse(0, -this.stemHeight, size, size * 0.7);
        }
        
        // Golden sparkles
        for (let i = 0; i < 5; i++) {
            const angle = (TWO_PI / 5) * i + frameCount * 0.05;
            const dist = 25 + sin(frameCount * 0.08 + i) * 5;
            const x = cos(angle) * dist;
            const y = sin(angle) * dist * 0.5 - this.stemHeight;
            
            graphics.fill(255, 255, 200, alpha * 2);
            graphics.ellipse(x, y, 3, 3);
        }
        
        graphics.pop();
    }
    
    drawStem(graphics, alpha) {
        graphics.noStroke();
        
        // Draw stem anchored to ground - no sway applied to stem base
        for (let y = 0; y < this.stemHeight; y += 2) {
            // Only slight curve near the top (no sway at base)
            const bendFactor = (y / this.stemHeight);
            const bendAmount = bendFactor * bendFactor; // Quadratic curve
            const stemX = sinSway(this.animation.swayAngle) * bendAmount * 3 * this.animation.swayAmount;
            const stemWidth = map(y, 0, this.stemHeight, 3, 1.5);
            
            // Use vibrant stem color
            graphics.fill(this.stemColor[0], this.stemColor[1], this.stemColor[2], alpha);
            graphics.rect(stemX - stemWidth/2, -y - 2, stemWidth, 2);
            
            // Add highlight for depth
            graphics.fill(this.stemColor[0] + 30, this.stemColor[1] + 30, this.stemColor[2] + 30, alpha * 0.5);
            graphics.rect(stemX - stemWidth/2 + 1, -y - 2, 1, 2);
        }
    }
    drawLavenderStems(graphics, alpha) {
        // Multiple thin stems for lavender - anchored at base
        for (let i = 0; i < this.stemCount; i++) {
            const stemOffset = (i - this.stemCount/2) * 4;
            
            graphics.push();
            graphics.translate(stemOffset, 0);
            
            // Thin vertical stem with vibrant color
            for (let y = 0; y < this.stemHeight; y += 2) {
                const bendFactor = (y / this.stemHeight);
                const x = sin(this.animation.swayAngle + i * 0.3) * bendFactor * bendFactor * 2 * this.animation.swayAmount;
                graphics.fill(this.stemColor[0], this.stemColor[1], this.stemColor[2], alpha);
                graphics.rect(x - 1, -y - 2, 2, 2);
            }
            
            graphics.pop();
        }
    }
    
    drawFlowerHead(graphics, alpha) {
        const sway = sinSway(this.animation.swayAngle) * this.animation.swayAmount;
        
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
        // Dark outline for contrast
        graphics.strokeWeight(2);
        graphics.stroke(0, 0, 0, alpha * 0.3);
        
        // Draw petals using common method
        this.drawPetals(graphics, alpha);
        
        // Draw center using common method
        this.drawFlowerCenter(graphics, alpha);
    }
    
    drawSimpleTulip(graphics, alpha) {
        const petalSize = this.getPetalSize();
        
        // Tulip cup shape with dark outline
        graphics.strokeWeight(2);
        graphics.stroke(0, 0, 0, alpha * 0.3);
        graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
        // Tulip cup with petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            const petalWave = sin(frameCount * this.animation.petalWaveSpeed * 0.5 + i) * 0.05 + 1;
            
            graphics.push();
            graphics.rotate(angle);
            
            // Tulip petal shape (teardrop)
            graphics.beginShape();
            graphics.vertex(0, 0);
            graphics.bezierVertex(
                petalSize * 0.3, -petalSize * 0.2,
                petalSize * 0.5, -petalSize * 0.6,
                0, -petalSize * 0.8 * petalWave
            );
            graphics.bezierVertex(
                -petalSize * 0.5, -petalSize * 0.6,
                -petalSize * 0.3, -petalSize * 0.2,
                0, 0
            );
            graphics.endShape(CLOSE);
            
            graphics.pop();
        }
        
        // Dark center with detail
        graphics.fill(this.centerColor[0] * 0.3, this.centerColor[1] * 0.3, this.centerColor[2] * 0.3, alpha);
        graphics.ellipse(0, 0, 6, 6);
        
    }
    
    drawBushClusters(graphics, alpha) {
        const sway = sinSway(this.animation.swayAngle) * this.animation.swayAmount;
        
        // Multiple small flower heads in a cluster
        for (let i = 0; i < this.clusterCount; i++) {
            const angle = (TWO_PI / this.clusterCount) * i;
            const distance = this.size * 0.6;
            const clusterX = cos(angle) * distance + sway * 4;
            const clusterY = sin(angle) * distance * 0.3 - this.stemHeight;
            
            graphics.push();
            graphics.translate(clusterX, clusterY);
            graphics.rotate(sway * 0.2);
            
            // Enhanced small flower with outline
            graphics.strokeWeight(1);
            graphics.stroke(0, 0, 0, alpha * 0.3);
            
            // Draw small petals
            this.drawPetals(graphics, alpha, { style: 'small', size: 10, wave: false });
            
            // Tiny center
            this.drawFlowerCenter(graphics, alpha, 2);
            
            graphics.pop();
        }
        
    }
    
    drawLavenderClusters(graphics, alpha) {
        // Draw simplified purple clusters on each stem
        for (let i = 0; i < this.stemCount; i++) {
            const stemOffset = (i - this.stemCount/2) * 4;
            const stemSway = sin(this.animation.swayAngle + i * 0.3) * this.animation.swayAmount;
            
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
        
    }
    
    drawTinySprout(graphics, alpha) {
        // Very simple tiny flower close to ground
        graphics.noStroke();
        
        // Draw tiny petals
        this.drawPetals(graphics, alpha, { size: 6, style: 'small', wave: false });
        
        // Draw tiny center
        this.drawFlowerCenter(graphics, alpha, 3);
        
    }
    
    
    getPetalSize() {
        let baseSize = this.size;
        
        // Subtle size variation
        baseSize += sin(frameCount * 0.02 + this.animation.petalPhase) * 0.5;
        
        if (this.stage === 'bloom') {
            return map(this.stageTimer, 0, this.stageDurations.bloom, 2, baseSize);
        } else if (this.stage === 'wilting') {
            const wiltProgress = this.stageTimer / this.stageDurations.wilting;
            return baseSize * (1 - wiltProgress * 0.3);
        }
        return baseSize;
    }
    
    
    drawFlowerCenter(graphics, alpha, size = 8) {
        // Main center
        graphics.fill(this.centerColor[0], this.centerColor[1], this.centerColor[2], alpha);
        graphics.ellipse(0, 0, size, size);
        
        // Center detail dots
        graphics.fill(0, 0, 0, alpha * 0.2);
        const dotCount = Math.min(5, Math.floor(size / 2));
        for (let i = 0; i < dotCount; i++) {
            const angle = (TWO_PI / dotCount) * i;
            const radius = size * 0.25;
            graphics.ellipse(cos(angle) * radius, sin(angle) * radius, 2, 2);
        }
    }
    
    drawPetals(graphics, alpha, config = {}) {
        const {
            count = this.petalCount,
            size = this.getPetalSize(),
            style = 'ellipse',
            wave = true
        } = config;
        
        for (let i = 0; i < count; i++) {
            const angle = (TWO_PI / count) * i + this.animation.petalPhase;
            const petalWave = wave ? sin(frameCount * this.animation.petalWaveSpeed + i) * 0.1 + 1 : 1;
            
            graphics.push();
            graphics.rotate(angle);
            
            graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
            
            if (style === 'ellipse') {
                graphics.ellipse(size * 0.5, 0, size * 0.8 * petalWave, size * 0.4);
                // Petal highlight
                graphics.fill(255, 255, 255, alpha * 0.3);
                graphics.ellipse(size * 0.6, 0, size * 0.3, size * 0.2);
            } else if (style === 'small') {
                const px = size * 0.4;
                graphics.ellipse(px, 0, 6, 4);
            }
            
            graphics.pop();
        }
    }
    
    
    // Override isDead to check stage instead of lifetime
    isDead() {
        // Immortal flowers never die
        if (this.isImmortal) return false;
        
        // Normal flowers die after dissolve stage completes
        return this.stage === 'dissolve' && 
               this.stageTimer >= this.stageDurations.dissolve;
    }
    
    
    canPlantNear(x, y) {
        const dist = Math.hypot(this.x - x, this.y - y);
        // Smaller spacing for smaller flowers
        return dist > 40;
    }
    
    // Check if we should show the leading guide aura
    shouldShowLeadingGuide() {
        // Check if any butterfly is being led and this flower is available
        let hasLedButterfly = false;
        
        // Try different ways to access butterflies
        if (typeof window !== 'undefined' && window.gameState && window.gameState.butterflies) {
            hasLedButterfly = window.gameState.butterflies.some(b => b.state === 'following');
        } else if (typeof gameCore !== 'undefined' && gameCore.gameState && gameCore.gameState.butterflies) {
            hasLedButterfly = gameCore.gameState.butterflies.some(b => b.state === 'following');
        }
        
        return hasLedButterfly && this.stage !== 'dissolve' && !this.currentFeeder;
    }
    
    // Draw pulsing aura to guide players when leading butterflies
    drawLeadingGuideAura(graphics) {
        graphics.push();
        graphics.noFill();
        
        // Pulsing effect
        const pulse = sin(frameCount * 0.08) * 0.3 + 0.7;
        const baseSize = 40;
        
        // Multiple rings for visibility
        for (let i = 2; i >= 0; i--) {
            const size = baseSize + i * 15;
            const alpha = 80 * pulse / (i + 1);
            
            // Soft green-yellow glow to indicate "feed here"
            graphics.stroke(200, 255, 100, alpha);
            graphics.strokeWeight(2);
            graphics.ellipse(0, -this.stemHeight, size * pulse, size * 0.7 * pulse);
        }
        
        // Central bright pulse
        graphics.noStroke();
        graphics.fill(220, 255, 150, 50 * pulse);
        graphics.ellipse(0, -this.stemHeight, 25 * pulse, 18 * pulse);
        
        graphics.pop();
    }
}

class FlowerManager {
    constructor() {
        // Simple flower manager for updates only
    }
    
    update(flowers, butterflies, particleSystem) {
        // Create a gameState object for flowers
        const gameState = { butterflies, particleSystem };
        
        for (let i = flowers.length - 1; i >= 0; i--) {
            const flower = flowers[i];
            flower.update(gameState);
            
            if (flower.isDead()) {
                // Emit petal particles when flower dies
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
}