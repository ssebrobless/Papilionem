class Flower extends Entity {
    constructor(x, y) {
        super(x, y);
        
        // Override base properties
        this.lifetime = 2580; // Sum of all stage durations
        this.fadeStartLifetime = 0; // We handle fading in dissolve stage
        this.shadowOffset = 2; // Flowers sit on ground
        
        // Flower lifecycle stages
        this.stage = 'bloom';
        this.stageTimer = 0;
        this.stageDurations = {
            bloom: 600,     // 10 seconds at 60fps
            mature: 1200,   // 20 seconds
            wilting: 600,   // 10 seconds
            dissolve: 180   // 3 seconds
        };
        
        this.size = 16;  // Larger base size for more detail
        this.stemHeight = 24;  // Taller stems for better proportion
        
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
                this.petalCount = 16;
                this.petalStyle = 'pointed';
                this.size = 20; // Much bigger
                this.stemHeight = 32; // Taller stem
                break;
            case 'lily':
                this.petalCount = 6;
                this.petalStyle = 'curved';
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
        this.swayAmount = 0.15;
        
        // Individual petal animation
        this.petalPhase = random(TWO_PI);
        this.petalWaveSpeed = 0.03 + random(0.02);
    }
    
    update(gameState) {
        // Call parent update
        super.update(gameState);
        
        const { butterflies, particleSystem } = gameState;
        
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
        
        graphics.translate(this.x, this.y);
        
        const sway = sin(this.swayAngle) * this.swayAmount;
        graphics.rotate(sway);
        
        // Organic curved stem with gradient
        graphics.noStroke();
        for (let y = 0; y < this.stemHeight; y += 2) {
            const stemCurve = sin(y * 0.1 + this.swayAngle) * 2;
            const stemWidth = map(y, 0, this.stemHeight, 5, 3);
            const brightness = map(y, 0, this.stemHeight, 0.7, 1);
            
            // Dark edge
            graphics.fill(60 * brightness, 120 * brightness, 60 * brightness, alpha);
            graphics.rect(stemCurve - stemWidth/2, y, stemWidth, 2);
            
            // Light center
            graphics.fill(100 * brightness, 180 * brightness, 100 * brightness, alpha);
            graphics.rect(stemCurve - stemWidth/2 + 1, y, stemWidth - 2, 2);
        }
        
        // Add detailed leaves
        if (this.flowerType !== 'daisy') {
            // Left leaf
            const leaf1Y = this.stemHeight * 0.6;
            const leaf1Angle = -0.5 + sin(this.swayAngle * 0.5) * 0.1;
            this.drawLeaf(graphics, -4, leaf1Y, leaf1Angle, alpha);
            
            // Right leaf
            const leaf2Y = this.stemHeight * 0.4;
            const leaf2Angle = 0.5 + sin(this.swayAngle * 0.5 + PI) * 0.1;
            this.drawLeaf(graphics, 4, leaf2Y, leaf2Angle, alpha);
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
    }
    
    drawDaisyPetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        const petalWave = sin(frameCount * 0.05 + this.petalPhase) * 0.1;
        
        // Draw petals in two layers for depth
        for (let layer = 0; layer < 2; layer++) {
            for (let i = 0; i < this.petalCount; i++) {
                const angle = (TWO_PI / this.petalCount) * i + (layer ? PI / this.petalCount : 0);
                const layerOffset = layer ? 0.9 : 1;
                
                // Create gradient effect
                for (let j = 0; j < petalSize * layerOffset; j++) {
                    const distance = j;
                    const px = cos(angle + petalWave) * distance;
                    const py = sin(angle + petalWave) * distance;
                    
                    // Petal shape - wider in middle, tapered at ends
                    const petalWidth = sin((distance / (petalSize * layerOffset)) * PI) * 4;
                    const brightness = map(distance, 0, petalSize * layerOffset, 1.1, 0.85);
                    
                    // Apply shading
                    const r = min(255, this.petalColor[0] * brightness);
                    const g = min(255, this.petalColor[1] * brightness);
                    const b = min(255, this.petalColor[2] * brightness);
                    
                    graphics.fill(r, g, b, alpha * (layer ? 0.8 : 1));
                    graphics.noStroke();
                    
                    // Draw petal segment
                    for (let w = -petalWidth; w <= petalWidth; w += 2) {
                        const segmentSize = map(abs(w), 0, petalWidth, 2, 1);
                        graphics.rect(px + w - segmentSize/2, py - segmentSize/2, segmentSize, segmentSize);
                    }
                }
            }
        }
        
        // Detailed center with texture
        const centerSize = 8;
        // Dark ring
        graphics.fill(200, 160, 60, alpha);
        for (let r = centerSize; r > centerSize - 2; r--) {
            for (let angle = 0; angle < TWO_PI; angle += 0.3) {
                graphics.rect(cos(angle) * r - 1, sin(angle) * r - 1, 2, 2);
            }
        }
        
        // Yellow center
        graphics.fill(255, 220, 100, alpha);
        graphics.ellipse(0, 0, centerSize, centerSize);
        
        // Center texture
        graphics.fill(240, 200, 80, alpha);
        for (let i = 0; i < 6; i++) {
            const angle = random(TWO_PI);
            const dist = random(centerSize/2 - 1);
            graphics.rect(cos(angle) * dist - 0.5, sin(angle) * dist - 0.5, 1, 1);
        }
        
        // Pollen ready glow
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 60;
            for (let i = 2; i > 0; i--) {
                graphics.fill(255, 255, 220, glowAlpha / i);
                graphics.ellipse(0, 0, centerSize + i * 3, centerSize + i * 3);
            }
        }
    }
    
    drawTulipPetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        const cupDepth = petalSize * 1.2;
        const petalSway = sin(frameCount * 0.03 + this.petalPhase) * 0.05;
        
        // Draw overlapping cup-shaped petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            
            graphics.push();
            graphics.rotate(angle + petalSway);
            
            // Create cup shape with gradient
            for (let y = -cupDepth; y < cupDepth * 0.3; y++) {
                const cupWidth = sin((y + cupDepth) / cupDepth * PI * 0.7) * petalSize * 0.8;
                const brightness = map(y, -cupDepth, cupDepth * 0.3, 0.85, 1.1);
                
                // Main petal color with gradient
                const r = min(255, this.petalColor[0] * brightness);
                const g = min(255, this.petalColor[1] * brightness);
                const b = min(255, this.petalColor[2] * brightness);
                graphics.fill(r, g, b, alpha);
                
                // Draw petal width
                for (let x = -cupWidth; x <= cupWidth; x += 2) {
                    const edgeFade = map(abs(x), cupWidth * 0.7, cupWidth, 1, 0.7);
                    const segmentAlpha = alpha * edgeFade;
                    graphics.fill(r, g, b, segmentAlpha);
                    graphics.rect(x - 1, y - 1, 2, 2);
                    
                    // Add highlight on one edge
                    if (i % 2 === 0 && x < -cupWidth * 0.6 && x > -cupWidth * 0.8) {
                        graphics.fill(255, 255, 255, alpha * 0.3);
                        graphics.rect(x, y, 1, 1);
                    }
                }
            }
            
            graphics.pop();
        }
        
        // Dark center with gradient
        for (let r = 5; r > 0; r--) {
            const darkness = map(r, 0, 5, 0.2, 1);
            graphics.fill(40 * darkness, 30 * darkness, 20 * darkness, alpha);
            graphics.ellipse(0, 0, r * 2, r * 2);
        }
        
        // Inner glow
        graphics.fill(this.accentColor[0], this.accentColor[1], this.accentColor[2], alpha * 0.4);
        graphics.ellipse(0, -2, 4, 4);
        
        // Pollen ready effect
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 50;
            graphics.fill(255, 240, 200, glowAlpha);
            for (let i = 0; i < 3; i++) {
                const sparkAngle = (TWO_PI / 3) * i + frameCount * 0.05;
                const sparkDist = 6 + sin(frameCount * 0.1) * 2;
                graphics.rect(cos(sparkAngle) * sparkDist - 1, sin(sparkAngle) * sparkDist - 1, 2, 2);
            }
        }
    }
    
    drawRosePetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        const petalCurl = sin(frameCount * 0.04 + this.petalPhase) * 0.1;
        
        // Draw multiple layers of curled petals
        for (let layer = 3; layer >= 0; layer--) {
            const layerSize = petalSize - layer * 3;
            const layerRotation = layer * 0.3 + petalCurl;
            const petalCount = this.petalCount + (3 - layer) * 2; // More petals in outer layers
            
            for (let i = 0; i < petalCount; i++) {
                const angle = (TWO_PI / petalCount) * i + layerRotation;
                
                graphics.push();
                graphics.rotate(angle);
                
                // Draw individual rose petal with curl
                for (let r = 0; r < layerSize; r++) {
                    const petalAngle = map(r, 0, layerSize, 0, PI * 0.3);
                    const petalX = r;
                    const petalY = sin(petalAngle) * 4 * (1 - layer * 0.2);
                    
                    // Create gradient from center to edge
                    const brightness = map(r, 0, layerSize, 1.2, 0.8) - layer * 0.1;
                    const r_color = min(255, this.petalColor[0] * brightness);
                    const g_color = min(255, this.petalColor[1] * brightness);
                    const b_color = min(255, this.petalColor[2] * brightness);
                    
                    // Petal width varies along length
                    const petalWidth = sin((r / layerSize) * PI) * 5 * (1 - layer * 0.15);
                    
                    for (let w = -petalWidth; w <= petalWidth; w += 2) {
                        const edgeDarkness = map(abs(w), petalWidth * 0.7, petalWidth, 1, 0.7);
                        graphics.fill(r_color * edgeDarkness, g_color * edgeDarkness, b_color * edgeDarkness, alpha);
                        graphics.rect(petalX + w - 1, petalY - 1, 2, 2);
                    }
                    
                    // Add petal texture
                    if (r % 4 === 0 && random() < 0.3) {
                        graphics.fill(this.accentColor[0], this.accentColor[1], this.accentColor[2], alpha * 0.5);
                        graphics.rect(petalX - 1, petalY, 1, 1);
                    }
                }
                
                graphics.pop();
            }
        }
        
        // Detailed center with swirl
        for (let r = 4; r > 0; r--) {
            const swirl = frameCount * 0.02 + r * 0.5;
            for (let a = 0; a < TWO_PI; a += PI/3) {
                const cx = cos(a + swirl) * r;
                const cy = sin(a + swirl) * r;
                graphics.fill(this.centerColor[0] * (1 - r * 0.1), this.centerColor[1] * (1 - r * 0.1), this.centerColor[2], alpha);
                graphics.rect(cx - 1, cy - 1, 2, 2);
            }
        }
        
        // Pollen ready sparkle
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 40;
            graphics.fill(255, 220, 255, glowAlpha);
            for (let i = 0; i < 5; i++) {
                const sparkAngle = (TWO_PI / 5) * i + frameCount * 0.03;
                const sparkDist = 8 + sin(frameCount * 0.15 + i) * 3;
                graphics.ellipse(cos(sparkAngle) * sparkDist, sin(sparkAngle) * sparkDist, 3, 3);
            }
        }
    }
    
    drawSunflowerPetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        const petalWave = sin(frameCount * 0.02 + this.petalPhase) * 0.05;
        
        // Draw two layers of petals for fullness
        for (let layer = 0; layer < 2; layer++) {
            const layerOffset = layer ? PI / this.petalCount : 0;
            const layerSize = layer ? petalSize * 0.9 : petalSize;
            
            for (let i = 0; i < this.petalCount; i++) {
                const angle = (TWO_PI / this.petalCount) * i + layerOffset + petalWave;
                
                graphics.push();
                graphics.rotate(angle);
                
                // Draw textured sunflower petal
                for (let j = 0; j < layerSize; j++) {
                    const petalWidth = sin((j / layerSize) * PI * 0.8) * 4;
                    const brightness = map(j, 0, layerSize, 1.2, 0.7);
                    
                    // Golden yellow gradient
                    const r = min(255, 255 * brightness);
                    const g = min(255, 200 * brightness);
                    const b = min(255, 50 * brightness);
                    
                    for (let w = -petalWidth; w <= petalWidth; w += 2) {
                        // Add slight orange tinge to edges
                        const edgeTint = map(abs(w), 0, petalWidth, 1, 1.2);
                        graphics.fill(r * edgeTint, g, b, alpha * (layer ? 0.8 : 1));
                        graphics.rect(j - 1, w - 1, 2, 2);
                        
                        // Petal veins
                        if (j % 6 === 0 && abs(w) < petalWidth * 0.5) {
                            graphics.fill(240, 180, 40, alpha * 0.6);
                            graphics.rect(j, w, 1, 1);
                        }
                    }
                }
                
                graphics.pop();
            }
        }
        
        // Large detailed center with spiral pattern
        const centerSize = 14;
        
        // Dark outer ring
        graphics.fill(80, 50, 20, alpha);
        graphics.ellipse(0, 0, centerSize, centerSize);
        
        // Spiral seed pattern
        const goldenAngle = 137.5 * PI / 180;
        for (let i = 0; i < 40; i++) {
            const angle = i * goldenAngle;
            const radius = sqrt(i) * 2;
            if (radius < centerSize/2 - 1) {
                const x = cos(angle) * radius;
                const y = sin(angle) * radius;
                const seedBrightness = map(radius, 0, centerSize/2, 0.8, 0.4);
                graphics.fill(101 * seedBrightness, 67 * seedBrightness, 33 * seedBrightness, alpha);
                graphics.rect(x - 1, y - 1, 2, 2);
                
                // Highlight some seeds
                if (i % 7 === 0) {
                    graphics.fill(120, 80, 40, alpha);
                    graphics.rect(x, y - 1, 1, 1);
                }
            }
        }
        
        // Pollen ready glow
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 50;
            for (let r = centerSize + 4; r > centerSize; r -= 2) {
                graphics.fill(255, 240, 180, glowAlpha * (1 - (r - centerSize) / 4));
                graphics.ellipse(0, 0, r, r);
            }
        }
    }
    
    drawLilyPetals(graphics, alpha) {
        const petalSize = this.getPetalSize();
        const petalCurl = sin(frameCount * 0.03 + this.petalPhase) * 0.15;
        
        // Draw elegant curved petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (TWO_PI / this.petalCount) * i;
            
            graphics.push();
            graphics.rotate(angle);
            
            // Draw curved lily petal with gradient and spots
            for (let j = 0; j < petalSize; j++) {
                // Create elegant S-curve
                const petalCurve = sin((j / petalSize) * PI) * 6;
                const curlAmount = sin((j / petalSize) * PI * 2) * 2 * petalCurl;
                const px = j;
                const py = petalCurve + curlAmount;
                
                // Petal width with elegant taper
                const petalWidth = sin((j / petalSize) * PI * 0.9) * 5;
                
                // Create gradient from base to tip
                const brightness = map(j, 0, petalSize, 1, 0.7);
                const tipTint = map(j, petalSize * 0.7, petalSize, 1, 1.3);
                
                for (let w = -petalWidth; w <= petalWidth; w += 2) {
                    // Main petal color with gradient
                    const edgeFade = map(abs(w), petalWidth * 0.8, petalWidth, 1, 0.6);
                    const r = min(255, this.petalColor[0] * brightness * tipTint * edgeFade);
                    const g = min(255, this.petalColor[1] * brightness * edgeFade);
                    const b = min(255, this.petalColor[2] * brightness * edgeFade);
                    
                    graphics.fill(r, g, b, alpha);
                    graphics.rect(px - 1, py + w - 1, 2, 2);
                    
                    // Add characteristic lily spots
                    if (j > petalSize * 0.3 && j < petalSize * 0.7 && random() < 0.02) {
                        graphics.fill(this.accentColor[0], this.accentColor[1], this.accentColor[2], alpha * 0.6);
                        graphics.rect(px, py + w, 1, 1);
                    }
                    
                    // White highlight along center
                    if (abs(w) < 1 && j > petalSize * 0.2) {
                        graphics.fill(255, 255, 255, alpha * 0.4);
                        graphics.rect(px, py, 1, 1);
                    }
                }
            }
            
            graphics.pop();
        }
        
        // Detailed stamen with pollen
        for (let i = 0; i < 6; i++) {
            const angle = (TWO_PI / 6) * i + frameCount * 0.01;
            const stamenLength = 5 + sin(frameCount * 0.05 + i) * 1;
            
            // Stamen filament
            for (let j = 0; j < stamenLength; j++) {
                const sx = cos(angle) * j;
                const sy = sin(angle) * j;
                graphics.fill(200, 180, 100, alpha);
                graphics.rect(sx - 0.5, sy - 0.5, 1, 1);
            }
            
            // Anther with pollen
            const ax = cos(angle) * stamenLength;
            const ay = sin(angle) * stamenLength;
            graphics.fill(255, 180, 100, alpha);
            graphics.rect(ax - 1.5, ay - 1.5, 3, 3);
            graphics.fill(255, 220, 150, alpha);
            graphics.rect(ax - 0.5, ay - 0.5, 1, 1);
        }
        
        // Pistil in center
        graphics.fill(this.centerColor[0] * 0.8, this.centerColor[1] * 0.8, this.centerColor[2] * 0.8, alpha);
        graphics.ellipse(0, 0, 4, 4);
        graphics.fill(this.centerColor[0], this.centerColor[1], this.centerColor[2], alpha);
        graphics.ellipse(0, 0, 2, 2);
        
        // Pollen ready effect
        if (this.stage === 'mature' && this.pollenTimer === 0) {
            const glowAlpha = (sin(frameCount * 0.1) + 1) * 0.5 * 40;
            // Pollen particles floating
            for (let i = 0; i < 6; i++) {
                const pollenAngle = (TWO_PI / 6) * i + frameCount * 0.02;
                const pollenDist = 8 + sin(frameCount * 0.08 + i) * 4;
                graphics.fill(255, 240, 180, glowAlpha + 20);
                graphics.ellipse(cos(pollenAngle) * pollenDist, sin(pollenAngle) * pollenDist, 2, 2);
            }
        }
    }
    
    getPetalSize() {
        let baseSize = this.size;
        
        // Add subtle breathing animation
        baseSize += sin(frameCount * 0.02 + this.petalPhase) * 1;
        
        if (this.stage === 'bloom') {
            return map(this.stageTimer, 0, this.stageDurations.bloom, 4, baseSize);
        } else if (this.stage === 'wilting') {
            const wiltProgress = this.stageTimer / this.stageDurations.wilting;
            // Petals curl and shrink when wilting
            return baseSize * (1 - wiltProgress * 0.4);
        }
        return baseSize;
    }
    
    drawLeaf(graphics, x, y, angle, alpha) {
        graphics.push();
        graphics.translate(x, y);
        graphics.rotate(angle);
        
        // Leaf shape with gradient
        for (let i = 0; i < 8; i++) {
            const leafY = i - 4;
            const leafWidth = 4 - abs(leafY) * 0.8;
            const brightness = map(abs(leafY), 0, 4, 1, 0.7);
            
            graphics.fill(70 * brightness, 140 * brightness, 70 * brightness, alpha);
            graphics.rect(-leafWidth, leafY, leafWidth * 2, 1);
            
            // Leaf vein
            if (i === 4) {
                graphics.fill(60, 120, 60, alpha);
                graphics.rect(-0.5, -4, 1, 8);
            }
        }
        
        graphics.pop();
    }
    
    // Override isDead to check stage instead of lifetime
    isDead() {
        return this.stage === 'dissolve' && 
               this.stageTimer >= this.stageDurations.dissolve;
    }
    
    canPlantNear(x, y) {
        const dist = Math.hypot(this.x - x, this.y - y);
        // Larger spacing for these detailed flowers
        return dist > 60;
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
        
        for (let flower of flowers) {
            if (!flower.canPlantNear(x, y)) {
                return false;
            }
        }
        
        return true;
    }
    
    plantFlower(x, y, flowers, particleSystem) {
        if (this.canPlant(x, y, flowers) && flowers.length < 8) {  // Allow more flowers
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