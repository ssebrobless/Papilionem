function hashFlowerTypeName(value = '') {
    let hash = 0;
    for (const char of String(value)) {
        hash = ((hash << 5) - hash) + char.charCodeAt(0);
        hash |= 0;
    }
    return Math.abs(hash);
}

function normalizeFlowerTypeName(requestedType, canonicalTypes = []) {
    const types = Array.isArray(canonicalTypes) && canonicalTypes.length
        ? canonicalTypes
        : ['daisy'];
    if (typeof requestedType !== 'string' || !requestedType.trim().length) {
        return random(types);
    }

    const normalizedType = requestedType.trim().toLowerCase();
    if (types.includes(normalizedType)) {
        return normalizedType;
    }

    const legacyMap = {
        rose: 'daisy',
        lily: 'tulip',
        sunflower: 'bush'
    };

    if (legacyMap[normalizedType]) {
        return legacyMap[normalizedType];
    }

    return types[hashFlowerTypeName(normalizedType) % types.length];
}

class Flower extends Entity {
    constructor(x, y, isImmortal = false, options = {}) {
        super(x, y);
        
        // Unified lifecycle configuration - doubled for better gameplay
        this.stageDurations = {
            bloom: 1200,    // 20 seconds at 60fps (was 10)
            mature: 2400,   // 40 seconds (was 20)
            wilting: 1200,  // 20 seconds (was 10)
            dissolve: 360   // 6 seconds (was 3)
        };
        
        // Override base properties to match stage durations
        this.lifetime = Object.values(this.stageDurations).reduce((a, b) => a + b, 0); // 5160 frames (~86 seconds)
        this.fadeStartLifetime = this.stageDurations.dissolve; // Fade during dissolve stage
        this.shadowOffset = 2; // Flowers sit on ground
        
        // Unique ID for tracking feeding cooldowns
        this.id = `flower_${Date.now()}_${Math.floor(x)}_${Math.floor(y)}_${random(1000)}`;
        this.currentZoneId = options.currentZoneId || null;
        
        // Immortality flag for starting flowers
        this.isImmortal = isImmortal;
        this.persistentUntilConsumed = options.persistentUntilConsumed ?? true;
        this.consumed = false;
        
        // Flower lifecycle stages
        this.stage = 'bloom';
        this.stageTimer = 0;
        
        const flowerTypes = gameConfig?.entities?.flower?.types || ['daisy', 'tulip', 'sprout', 'lavender', 'bush'];
        this.flowerType = normalizeFlowerTypeName(options.flowerType, flowerTypes);
        this.visualStyle = 'garden-bloom';
        this.size = 13;
        this.stemHeight = gameConfig?.entities?.flower?.stemHeight || 16;
        this.petalCount = 7;
        this.petalStyle = 'garden-bloom';
        this.objectProfile = createObjectProfile({
            entityType: 'flower',
            subtype: this.flowerType,
            resourceTags: ['nectar', 'care', 'garden-object'],
            carryable: false,
            consumable: true,
            occupancyState: 'normal',
            lifecycleStage: this.stage
        });
        
        const flowerPalettes = gameConfig?.entities?.flower?.palettes || [
            { petals: [255, 180, 120], center: [255, 240, 180] },
            { petals: [255, 150, 200], center: [255, 255, 220] },
            { petals: [200, 150, 255], center: [255, 230, 150] },
            { petals: [255, 220, 150], center: [255, 255, 200] },
            { petals: [180, 220, 255], center: [255, 255, 240] }
        ];
        const knownTypeIndex = flowerTypes.indexOf(this.flowerType);
        const paletteIndex = knownTypeIndex >= 0
            ? knownTypeIndex % flowerPalettes.length
            : Math.floor(random(flowerPalettes.length));
        const basePalette = flowerPalettes[paletteIndex] || flowerPalettes[0] || { petals: [255, 180, 120], center: [255, 240, 180] };
        const palette = {
            petals: basePalette.petals,
            center: basePalette.center,
            accent: basePalette.accent || [
                Math.max(0, basePalette.petals[0] - 48),
                Math.max(0, basePalette.petals[1] - 42),
                Math.max(0, basePalette.petals[2] - 36)
            ],
            stemColor: basePalette.stemColor || [52, 138, 66]
        };
        this.petalColor = palette.petals;
        this.centerColor = palette.center;
        this.accentColor = palette.accent;
        this.stemColor = palette.stemColor || [34, 139, 34];
        
        this.lastVisitor = null;
        this.currentFeeder = null;
        this.ensureLifecycleData();
        
        // Unified animation state
        this.animation = {
            swayAngle: random(TWO_PI),
            swaySpeed: 0.02 + random(0.01),
            swayAmount: 0.06,       // Base sway for flower heads
            shearAmount: 0.14,      // Top-heavy lean intensity
            petalPhase: random(TWO_PI),
            petalWaveSpeed: 0.02
        };
    }

    ensureLifecycleData() {
        this.occupancyState = this.occupancyState || 'normal';
        this.allowedButterflyId = this.allowedButterflyId || null;
        this.eggData = this.eggData || null;
        this.chrysalisData = this.chrysalisData || null;
        this.postHatchFadeTimer = this.postHatchFadeTimer || 0;
        this.currentFeeder = this.currentFeeder || null;
    }
    
    update(gameState) {
        const { butterflies, particleSystem } = gameState;
        this.ensureLifecycleData();
        this.objectProfile.lifecycleStage = this.stage;
        this.objectProfile.occupancyState = this.occupancyState;
        
        // Update golden blessing timer
        if (this.goldenBlessing > 0) {
            this.goldenBlessing--;
        }
        
        // Update animation regardless of mortality
        this.animation.swayAngle += this.animation.swaySpeed;
        
        const holdAtMature = this.isImmortal || (this.persistentUntilConsumed && !this.consumed && this.occupancyState === 'normal');

        // Immortal/persistent flowers have special handling
        if (holdAtMature) {
            // Only update z-index, skip lifetime decrement
            this.updateZIndex();
            if (this.stage === 'bloom') {
                this.stageTimer++;
                if (this.stageTimer >= this.stageDurations.bloom) {
                    this.stage = 'mature';
                    this.objectProfile.lifecycleStage = this.stage;
                    this.stageTimer = 0;
                }
            } else {
                this.stage = 'mature';
                this.objectProfile.lifecycleStage = this.stage;
                this.stageTimer = 0;
            }
        } else {
            // Occupied flowers pause their normal fade/lifecycle until the lifecycle completes
            if (this.occupancyState === 'normal' || this.postHatchFadeTimer > 0) {
                super.update(gameState);
                this.stageTimer++;
                
                const currentDuration = this.stageDurations[this.stage];
                if (this.stageTimer >= currentDuration) {
                    this.nextStage();
                }
            }
        }

        if (this.postHatchFadeTimer > 0) {
            this.postHatchFadeTimer--;
            if (this.postHatchFadeTimer === 0) {
                this.occupancyState = 'normal';
                this.objectProfile.occupancyState = 'normal';
                this.allowedButterflyId = null;
                this.eggData = null;
                this.chrysalisData = null;
                this.currentFeeder = null;
                this.stage = this.persistentUntilConsumed ? 'mature' : 'dissolve';
                this.objectProfile.lifecycleStage = this.stage;
                this.stageTimer = 0;
            }
        }
        
        // Check butterfly visits when mature
        if (this.stage === 'mature') {
            this.checkButterflyVisits(butterflies, particleSystem);
        }
    }
    
    nextStage() {
        if (this.persistentUntilConsumed && this.stage === 'mature') {
            return;
        }

        const stages = ['bloom', 'mature', 'wilting', 'dissolve'];
        const currentIndex = stages.indexOf(this.stage);
        
        if (currentIndex < stages.length - 1) {
            this.stage = stages[currentIndex + 1];
            this.objectProfile.lifecycleStage = this.stage;
            this.stageTimer = 0;
        }
    }
    
    checkButterflyVisits(butterflies, particleSystem) {
        for (let butterfly of butterflies) {
            if (this.currentZoneId && butterfly.currentZoneId && butterfly.currentZoneId !== this.currentZoneId) {
                continue;
            }
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
    
    // Handle special interactions based on the butterfly's assigned ability profile
    handleSpecialInteraction(butterfly, particleSystem) {
        const interactionType = typeof butterfly.getFlowerInteractionType === 'function'
            ? butterfly.getFlowerInteractionType()
            : butterfly.personalityType;
        if (!interactionType) return;
        
        switch (interactionType) {
            case 'friendly':
                break;
                
            case 'cautious':
            case 'sparkle':
                // Cautious butterflies make flowers last longer
                if (this.stage === 'mature' && !this.isImmortal) {
                    this.stageTimer = Math.max(0, this.stageTimer - 1); // Slow aging
                }
                break;
                
            case 'energetic':
            case 'speedzone':
                // Energetic butterflies make flowers bloom faster
                if (this.stage === 'bloom') {
                    this.stageTimer += 60; // Speed up blooming
                }
                break;
                
            case 'skittish':
            case 'cascade':
                break;
                
            case 'wise':
            case 'teacher':
                break;
                
            case 'golden':
                // Golden butterflies make flowers golden temporarily
                this.goldenBlessing = 300; // 5 seconds of golden state
                if (typeof eventBus !== 'undefined') {
                    eventBus.emit('ability:visual', {
                        ability: 'golden',
                        sourceId: butterfly?.id || null,
                        x: butterfly?.x ?? this.x,
                        y: butterfly?.y ?? this.y,
                        durationFrames: 32
                    });
                }
                break;
                
            case 'mystic':
            case 'shimmer':
                break;
        }
    }
    
    
    // Override parent's shadow drawing for soft layered shadow
    drawShadow(graphics, alpha) {
        const shadowWidthScale = 1.05;
        graphics.noStroke();
        for (let i = 3; i > 0; i--) {
            graphics.fill(0, 0, 0, min(20 * (4 - i), alpha * 0.08 * (4 - i)));
            const shadowSize = this.size * shadowWidthScale * (1.05 + i * 0.22);
            graphics.ellipse(this.x, this.y + this.shadowOffset, shadowSize, shadowSize * 0.5);
        }
    }
    
    // Override parent's entity drawing
    drawEntity(graphics, alpha) {
        // Handle flower-specific alpha during dissolve
        if (this.stage === 'dissolve') {
            alpha = map(this.stageTimer, 0, this.stageDurations.dissolve, 255, 0);
        }
        
        const shear = sin(this.animation.swayAngle) * this.animation.shearAmount;

        // Base position anchored to ground
        graphics.push();
        graphics.translate(this.x, this.y);

        // Top-heavy sway: base stays anchored, top leans left/right
        graphics.shearX(shear);

        // Draw golden blessing effect
        if (this.goldenBlessing > 0) {
            this.drawGoldenBlessing(graphics);
        }
        
        // Draw pulsing guide aura when butterflies are being led
        if (this.shouldShowLeadingGuide()) {
            this.drawLeadingGuideAura(graphics);
        }
        
        this.drawStem(graphics, alpha);
        
        // Draw flower head(s)
        this.drawFlowerHead(graphics, alpha);
        this.drawLifecycleAttachment(graphics, alpha);
        
        graphics.pop();
    }

    drawLifecycleAttachment(graphics, alpha) {
        if (this.occupancyState === 'egg') {
            graphics.push();
            graphics.translate(0, -this.stemHeight);
            graphics.noStroke();
            graphics.fill(0, 0, 0, alpha * 0.18);
            graphics.ellipse(8.8, -1.2, 9.5, 8.5);
            graphics.fill(255, 255, 255, alpha);
            graphics.ellipse(8, -2, 8, 8);
            graphics.fill(255, 245, 200, alpha * 0.9);
            graphics.ellipse(6.8, -3.2, 2.6, 2.2);
            graphics.pop();
            return;
        }

        if (this.occupancyState === 'chrysalis') {
            let sprite = this.chrysalisData?.hasHatched ? spriteManager.cocoonSprites.hatched : spriteManager.cocoonSprites.unhatched;
            if (!sprite) return;

            graphics.push();
            graphics.translate(0, -this.stemHeight + 6);
            graphics.smooth();
            const scale = 0.024;
            let w = sprite.width * scale;
            let h = sprite.height * scale;
            if (spriteManager.isBakedCreatureSpritesEnabled?.()) {
                const bakedSprite = spriteManager.getBakedCocoonSprite(this.chrysalisData?.hasHatched ? 'hatched' : 'unhatched', w, h);
                if (bakedSprite) {
                    sprite = bakedSprite;
                    w = bakedSprite.width;
                    h = bakedSprite.height;
                }
            }
            if (alpha < 255) {
                graphics.tint(255, alpha);
            }
            graphics.image(sprite, -w / 2, -h / 2, w, h);
            if (alpha < 255) {
                graphics.noTint();
            }
            graphics.noSmooth();
            graphics.pop();
        }
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

    drawBushStems(graphics, alpha) {
        const sway = sinSway(this.animation.swayAngle) * this.animation.swayAmount;
        const stemOrigins = [
            { x: -4 + sway * 2, y: 0, length: this.stemHeight + 1 },
            { x: 0, y: 0, length: this.stemHeight + 3 },
            { x: 4 + sway * 2, y: 0, length: this.stemHeight + 1 }
        ];

        graphics.noStroke();
        for (const origin of stemOrigins) {
            for (let y = 0; y < origin.length; y += 2) {
                const bendFactor = y / Math.max(origin.length, 1);
                const bend = sway * bendFactor * bendFactor * 6;
                graphics.fill(this.stemColor[0], this.stemColor[1], this.stemColor[2], alpha);
                graphics.rect(origin.x + bend - 1, -y - 2, 2, 2);
            }
        }
    }
    
    drawFlowerHead(graphics, alpha) {
        const sway = sinSway(this.animation.swayAngle) * this.animation.swayAmount;
        if (this.drawBakedFlowerHead(graphics, alpha, sway)) {
            return;
        }
        graphics.push();
        graphics.translate(sway * 6, -this.stemHeight);
        graphics.rotate(sway * 0.24);
        this.drawGardenBloom(graphics, alpha);
        graphics.pop();
    }

    canUseBakedFlowerHead() {
        return this.stage === 'mature'
            && this.visualStyle === 'garden-bloom'
            && this.petalStyle === 'garden-bloom'
            && typeof spriteManager?.getBakedFlowerHeadData === 'function'
            && spriteManager.isBakedFlowerHeadsEnabled?.();
    }

    drawBakedFlowerHead(graphics, alpha, sway = 0) {
        if (!this.canUseBakedFlowerHead()) return false;

        const bakedHead = spriteManager.getBakedFlowerHeadData(this, {
            frameCount,
            baseSize: this.size,
            centerSize: 8
        });
        if (!bakedHead?.surface) return false;

        const livePetalSize = this.getPetalSize();
        const headScale = livePetalSize / Math.max(1, this.size || livePetalSize || 1);

        graphics.push();
        graphics.translate(sway * 6, -this.stemHeight);
        graphics.rotate((sway * 0.24) + this.animation.petalPhase);
        if (Math.abs(headScale - 1) > 0.001) {
            graphics.scale(headScale);
        }
        if (alpha < 255) {
            graphics.tint(255, alpha);
        }
        graphics.image(
            bakedHead.surface,
            -bakedHead.anchorX,
            -bakedHead.anchorY,
            bakedHead.drawWidth,
            bakedHead.drawHeight
        );
        if (alpha < 255) {
            graphics.noTint();
        }
        graphics.pop();
        return true;
    }

    drawGardenBloom(graphics, alpha) {
        const petalSize = this.getPetalSize();

        graphics.strokeWeight(2);
        graphics.stroke(0, 0, 0, alpha * 0.28);

        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i + this.animation.petalPhase;
            const petalWave = sin(frameCount * this.animation.petalWaveSpeed + i) * 0.08 + 1;

            graphics.push();
            graphics.rotate(angle);
            graphics.fill(this.petalColor[0], this.petalColor[1], this.petalColor[2], alpha);
            graphics.ellipse(petalSize * 0.56, 0, petalSize * 0.92 * petalWave, petalSize * 0.42);
            graphics.fill(this.accentColor[0], this.accentColor[1], this.accentColor[2], alpha * 0.42);
            graphics.ellipse(petalSize * 0.66, 0, petalSize * 0.42, petalSize * 0.18);
            graphics.fill(255, 255, 255, alpha * 0.16);
            graphics.ellipse(petalSize * 0.72, -0.2, petalSize * 0.18, petalSize * 0.12);
            graphics.pop();
        }

        this.drawFlowerCenter(graphics, alpha, 8);
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
        if ((this.isImmortal || this.persistentUntilConsumed) && !this.consumed) return false;
        if (this.occupancyState === 'egg' || this.occupancyState === 'chrysalis') return false;
        
        // Normal flowers die after dissolve stage completes
        return this.stage === 'dissolve' && 
               this.stageTimer >= this.stageDurations.dissolve;
    }
    
    
    canPlantNear(x, y) {
        const dist = Math.hypot(this.x - x, this.y - y);
        // Smaller spacing for smaller flowers
        return dist > 40;
    }

    canAcceptButterfly(butterfly) {
        this.ensureLifecycleData();
        if (this.occupancyState === 'normal') return true;
        if (this.occupancyState === 'egg') {
            return this.allowedButterflyId === butterfly.id;
        }
        return false;
    }

    canReceiveEggFrom(butterfly) {
        this.ensureLifecycleData();
        return this.occupancyState === 'normal' && this.stage !== 'dissolve' && (!this.currentFeeder || this.currentFeeder === butterfly);
    }

    attachEgg(eggData) {
        this.ensureLifecycleData();
        this.occupancyState = 'egg';
        this.objectProfile.occupancyState = 'egg';
        this.allowedButterflyId = eggData.motherId;
        this.eggData = eggData;
        this.currentFeeder = null;

        if (typeof eventBus !== 'undefined' && GameEvents?.FLOWER_EGG_LAID) {
            eventBus.emit(GameEvents.FLOWER_EGG_LAID, {
                flower: this,
                flowerId: this.id,
                motherId: eggData.motherId,
                hatchFrame: eggData.hatchFrame,
                lifecycleData: eggData.lifecycleData || null
            });
        }
    }

    afterButterflyFeed(butterfly) {
        if (this.occupancyState === 'egg' && this.allowedButterflyId === butterfly.id) {
            this.allowedButterflyId = null;
        }
    }

    canHostCaterpillar(phase) {
        this.ensureLifecycleData();
        if (this.stage === 'dissolve') return false;
        return this.occupancyState === 'normal';
    }

    consumeByCaterpillar(particleSystem) {
        this.consumed = true;
        this.occupancyState = 'normal';
        this.objectProfile.occupancyState = 'normal';
        this.eggData = null;
        this.chrysalisData = null;
        this.currentFeeder = null;
        this.stage = 'dissolve';
        this.objectProfile.lifecycleStage = this.stage;
        this.stageTimer = this.stageDurations.dissolve;

        if (particleSystem) {
            particleSystem.emitBurst(this.x, this.y - this.stemHeight, this.petalColor, 10);
        }
    }

    becomeChrysalisFlower(lifecycleData) {
        this.ensureLifecycleData();
        const hybridBalance = gameConfig?.balance?.hybrid || {};
        const minCocoonFrames = hybridBalance.cocoonHatchFrames?.min ?? (60 * 90);
        const maxCocoonFrames = hybridBalance.cocoonHatchFrames?.max ?? (60 * 180);
        this.occupancyState = 'chrysalis';
        this.objectProfile.occupancyState = 'chrysalis';
        this.chrysalisData = {
            lifecycleData,
            hatchFrame: (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0)) + Math.floor(random(minCocoonFrames, maxCocoonFrames)),
            hasHatched: false,
            hatchedAt: 0
        };
        this.currentFeeder = null;

        if (typeof eventBus !== 'undefined' && GameEvents?.CHRYSALIS_FORMED) {
            eventBus.emit(GameEvents.CHRYSALIS_FORMED, {
                flower: this,
                flowerId: this.id,
                lifecycleData: lifecycleData || null
            });
        }
    }

    startPostHatchFade() {
        this.postHatchFadeTimer = this.persistentUntilConsumed ? 30 : 90;
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
        
        return hasLedButterfly && this.stage !== 'dissolve' && !this.currentFeeder && this.occupancyState === 'normal';
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
