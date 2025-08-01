// Special Effects System - Handles visual effects for butterfly abilities and game events
class SpecialEffectsSystem {
    constructor() {
        this.activeEffects = [];
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (typeof eventBus === 'undefined' || typeof GameEvents === 'undefined') return;
        
        // Listen for special ability events
        eventBus.on('speedzone:created', (data) => {
            this.addSpeedZoneEffect(data.x, data.y, data.radius);
        });
        
        eventBus.on('trust:cascade', (data) => {
            this.addTrustCascadeEffect(data.x, data.y, data.butterflies);
        });
        
        eventBus.on('teaching:pulse', (data) => {
            this.addTeachingPulseEffect(data.x, data.y);
        });
        
        eventBus.on('combo:achieved', (data) => {
            this.addComboEffect(data.x, data.y, data.combo);
        });
        
        eventBus.on('butterfly:collected', (data) => {
            this.addCollectionEffect(data.butterfly);
        });
    }
    
    // Add a speed zone visual effect
    addSpeedZoneEffect(x, y, radius) {
        this.activeEffects.push({
            type: 'speedzone',
            x: x,
            y: y,
            radius: radius,
            maxRadius: radius * 3,
            lifetime: 120, // 2 seconds
            maxLifetime: 120,
            color: [200, 150, 255], // Purple for speed
            pulseSpeed: 0.1
        });
    }
    
    // Add trust cascade visual effect
    addTrustCascadeEffect(x, y, butterflies) {
        // Create ripple effect from source butterfly
        this.activeEffects.push({
            type: 'trustcascade',
            x: x,
            y: y,
            radius: 20,
            maxRadius: 150,
            lifetime: 90, // 1.5 seconds
            maxLifetime: 90,
            color: [100, 255, 200], // Teal for trust
            waveCount: 3
        });
        
        // Create connection lines to affected butterflies
        for (let butterfly of butterflies) {
            this.activeEffects.push({
                type: 'trustline',
                startX: x,
                startY: y,
                endX: butterfly.x,
                endY: butterfly.y,
                lifetime: 60,
                maxLifetime: 60,
                color: [100, 255, 200]
            });
        }
    }
    
    // Add teaching pulse effect
    addTeachingPulseEffect(x, y) {
        this.activeEffects.push({
            type: 'teachingpulse',
            x: x,
            y: y,
            radius: 30,
            maxRadius: 80,
            lifetime: 45,
            maxLifetime: 45,
            color: [180, 140, 220] // Wise purple
        });
    }
    
    // Add combo visual effect
    addComboEffect(x, y, comboCount) {
        // Create combo text effect
        this.activeEffects.push({
            type: 'combotext',
            x: x,
            y: y,
            text: `${comboCount}x COMBO!`,
            lifetime: 90,
            maxLifetime: 90,
            size: 16 + comboCount * 2, // Bigger text for higher combos
            color: [255, 255, 100]
        });
        
        // Create star burst for high combos
        if (comboCount >= 3) {
            const starCount = 8 + comboCount * 2;
            for (let i = 0; i < starCount; i++) {
                const angle = (TWO_PI / starCount) * i;
                this.activeEffects.push({
                    type: 'combostar',
                    x: x,
                    y: y,
                    vx: cos(angle) * 3,
                    vy: sin(angle) * 3,
                    lifetime: 60,
                    maxLifetime: 60,
                    size: 4,
                    color: [255, 215, 0]
                });
            }
        }
    }
    
    // Add butterfly collection celebration effect
    addCollectionEffect(butterfly) {
        const x = butterfly.x;
        const y = butterfly.y;
        
        // Just create the rising text with collection count
        const collectedCount = gameCore.gameState.collectedButterflies.size;
        this.activeEffects.push({
            type: 'collectiontext',
            x: x,
            y: y - 30,
            text: `${collectedCount}/7 COLLECTED!`,
            lifetime: 150,
            maxLifetime: 150,
            size: 24,
            color: [255, 215, 0] // Golden color for collection
        });
    }
    
    // Update all active effects
    update() {
        // Update effects and remove expired ones
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.lifetime--;
            
            // Update specific effect types
            switch (effect.type) {
                case 'speedzone':
                    effect.radius = lerp(effect.radius, effect.maxRadius, 0.1);
                    break;
                    
                case 'trustcascade':
                    const progress = 1 - (effect.lifetime / effect.maxLifetime);
                    effect.radius = effect.maxRadius * progress;
                    break;
                    
                case 'teachingpulse':
                    const pulseProgress = 1 - (effect.lifetime / effect.maxLifetime);
                    effect.radius = effect.maxRadius * pulseProgress;
                    break;
                    
                case 'combotext':
                    effect.y -= 0.5; // Float upward
                    break;
                    
                case 'combostar':
                    effect.x += effect.vx;
                    effect.y += effect.vy;
                    effect.vx *= 0.95;
                    effect.vy *= 0.95;
                    break;
                    
                case 'collection':
                    const collectionProgress = 1 - (effect.lifetime / effect.maxLifetime);
                    effect.radius = effect.maxRadius * collectionProgress;
                    break;
                    
                case 'collectionstar':
                    effect.x += effect.vx;
                    effect.y += effect.vy;
                    effect.vx *= 0.92;
                    effect.vy *= 0.92;
                    break;
                    
                case 'collectiontext':
                    effect.y -= 0.8; // Rise faster than combo text
                    break;
            }
            
            // Remove expired effects
            if (effect.lifetime <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }
    }
    
    // Draw all active effects
    draw(graphics) {
        for (let effect of this.activeEffects) {
            const alpha = (effect.lifetime / effect.maxLifetime) * 255;
            
            switch (effect.type) {
                case 'speedzone':
                    this.drawSpeedZone(graphics, effect, alpha);
                    break;
                    
                case 'trustcascade':
                    this.drawTrustCascade(graphics, effect, alpha);
                    break;
                    
                case 'trustline':
                    this.drawTrustLine(graphics, effect, alpha);
                    break;
                    
                case 'teachingpulse':
                    this.drawTeachingPulse(graphics, effect, alpha);
                    break;
                    
                case 'combotext':
                    this.drawComboText(graphics, effect, alpha);
                    break;
                    
                case 'combostar':
                    this.drawComboStar(graphics, effect, alpha);
                    break;
                    
                case 'collection':
                    this.drawCollectionEffect(graphics, effect, alpha);
                    break;
                    
                case 'collectionstar':
                    this.drawCollectionStar(graphics, effect, alpha);
                    break;
                    
                case 'collectiontext':
                    this.drawCollectionText(graphics, effect, alpha);
                    break;
            }
        }
    }
    
    // Draw speed zone effect
    drawSpeedZone(graphics, effect, alpha) {
        graphics.push();
        graphics.noFill();
        
        // Draw multiple expanding rings
        for (let i = 0; i < 3; i++) {
            const ringAlpha = alpha * (1 - i * 0.3);
            const ringRadius = effect.radius - i * 15;
            
            if (ringRadius > 0) {
                graphics.stroke(effect.color[0], effect.color[1], effect.color[2], ringAlpha * 0.5);
                graphics.strokeWeight(2);
                graphics.ellipse(effect.x, effect.y, ringRadius * 2, ringRadius);
                
                // Add pulsing inner ring
                const pulse = sin(frameCount * effect.pulseSpeed + i) * 0.2 + 0.8;
                graphics.stroke(effect.color[0], effect.color[1], effect.color[2], ringAlpha * 0.8 * pulse);
                graphics.strokeWeight(1);
                graphics.ellipse(effect.x, effect.y, ringRadius * 2 * pulse, ringRadius * pulse);
            }
        }
        
        // Add particle effects
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (TWO_PI / particleCount) * i + frameCount * 0.02;
            const px = effect.x + cos(angle) * effect.radius * 0.8;
            const py = effect.y + sin(angle) * effect.radius * 0.4; // Isometric compression
            
            graphics.noStroke();
            graphics.fill(effect.color[0], effect.color[1], effect.color[2], alpha * 0.6);
            graphics.ellipse(px, py, 4, 4);
        }
        
        graphics.pop();
    }
    
    // Draw trust cascade effect
    drawTrustCascade(graphics, effect, alpha) {
        graphics.push();
        graphics.noFill();
        
        // Draw expanding waves
        for (let i = 0; i < effect.waveCount; i++) {
            const waveOffset = (effect.maxRadius / effect.waveCount) * i;
            const waveRadius = effect.radius - waveOffset;
            
            if (waveRadius > 0 && waveRadius < effect.maxRadius) {
                const waveAlpha = alpha * (1 - waveRadius / effect.maxRadius);
                graphics.stroke(effect.color[0], effect.color[1], effect.color[2], waveAlpha * 0.6);
                graphics.strokeWeight(3);
                graphics.ellipse(effect.x, effect.y, waveRadius * 2, waveRadius);
            }
        }
        
        graphics.pop();
    }
    
    // Draw trust connection line
    drawTrustLine(graphics, effect, alpha) {
        graphics.push();
        
        // Calculate control points for curved line
        const midX = (effect.startX + effect.endX) / 2;
        const midY = (effect.startY + effect.endY) / 2 - 30;
        
        graphics.noFill();
        graphics.stroke(effect.color[0], effect.color[1], effect.color[2], alpha * 0.6);
        graphics.strokeWeight(2);
        
        // Draw curved line
        graphics.beginShape();
        graphics.vertex(effect.startX, effect.startY);
        graphics.quadraticVertex(midX, midY, effect.endX, effect.endY);
        graphics.endShape();
        
        // Add sparkles along the line
        for (let t = 0; t < 1; t += 0.2) {
            const x = bezierPoint(effect.startX, midX, midX, effect.endX, t);
            const y = bezierPoint(effect.startY, midY, midY, effect.endY, t);
            
            graphics.noStroke();
            graphics.fill(255, 255, 255, alpha * 0.8);
            graphics.ellipse(x, y, 3, 3);
        }
        
        graphics.pop();
    }
    
    // Draw teaching pulse effect
    drawTeachingPulse(graphics, effect, alpha) {
        graphics.push();
        
        // Draw soft expanding circle
        graphics.noStroke();
        const gradient = graphics.drawingContext.createRadialGradient(
            effect.x, effect.y, 0,
            effect.x, effect.y, effect.radius
        );
        
        const r = effect.color[0];
        const g = effect.color[1];
        const b = effect.color[2];
        const a = alpha / 255;
        
        // Use standard gradient without experimental features
        graphics.push();
        graphics.noStroke();
        
        // Draw multiple circles to simulate gradient
        for (let i = 5; i > 0; i--) {
            const radiusFactor = i / 5;
            const alphaFactor = (1 - radiusFactor) * a;
            graphics.fill(r, g, b, alphaFactor * 100);
            graphics.ellipse(effect.x, effect.y, effect.radius * 2 * radiusFactor, effect.radius * radiusFactor);
        }
        
        graphics.pop();
    }
    
    // Draw combo text effect
    drawComboText(graphics, effect, alpha) {
        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(effect.size);
        
        // Draw shadow
        graphics.fill(0, 0, 0, alpha * 0.5);
        graphics.text(effect.text, effect.x + 2, effect.y + 2);
        
        // Draw main text
        graphics.fill(effect.color[0], effect.color[1], effect.color[2], alpha);
        graphics.text(effect.text, effect.x, effect.y);
        
        graphics.pop();
    }
    
    // Draw combo star particle
    drawComboStar(graphics, effect, alpha) {
        graphics.push();
        graphics.translate(effect.x, effect.y);
        graphics.rotate(frameCount * 0.1);
        
        graphics.noStroke();
        graphics.fill(effect.color[0], effect.color[1], effect.color[2], alpha);
        
        // Draw 4-pointed star
        graphics.beginShape();
        for (let i = 0; i < 8; i++) {
            const angle = (TWO_PI / 8) * i;
            const radius = i % 2 === 0 ? effect.size : effect.size * 0.5;
            graphics.vertex(cos(angle) * radius, sin(angle) * radius);
        }
        graphics.endShape(CLOSE);
        
        graphics.pop();
    }
    
    // Draw collection effect (expanding ring)
    drawCollectionEffect(graphics, effect, alpha) {
        graphics.push();
        
        // Expanding ring
        graphics.noFill();
        graphics.stroke(effect.color[0], effect.color[1], effect.color[2], alpha * 100);
        graphics.strokeWeight(3);
        graphics.ellipse(effect.x, effect.y, effect.radius * 2);
        
        // Pulsing center
        const pulse = sin(frameCount * 0.2) * 0.3 + 0.7;
        graphics.fill(255, 255, 255, alpha * 150 * pulse);
        graphics.noStroke();
        graphics.ellipse(effect.x, effect.y, 20 * pulse);
        
        graphics.pop();
    }
    
    // Draw collection star
    drawCollectionStar(graphics, effect, alpha) {
        graphics.push();
        graphics.translate(effect.x, effect.y);
        graphics.rotate(frameCount * 0.1);
        graphics.noStroke();
        graphics.fill(effect.color[0], effect.color[1], effect.color[2], alpha * 255);
        
        // Simple 4-point star
        const s = effect.size;
        graphics.beginShape();
        graphics.vertex(0, -s);
        graphics.vertex(s/3, -s/3);
        graphics.vertex(s, 0);
        graphics.vertex(s/3, s/3);
        graphics.vertex(0, s);
        graphics.vertex(-s/3, s/3);
        graphics.vertex(-s, 0);
        graphics.vertex(-s/3, -s/3);
        graphics.endShape(CLOSE);
        
        graphics.pop();
    }
    
    // Draw collection text
    drawCollectionText(graphics, effect, alpha) {
        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(effect.size);
        graphics.fill(effect.color[0], effect.color[1], effect.color[2], alpha * 255);
        graphics.text(effect.text, effect.x, effect.y);
        graphics.pop();
    }
    
    // Draw collection text effect (similar to combo text but golden)
    drawCollectionText(graphics, effect, alpha) {
        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(effect.size);
        graphics.textStyle(BOLD);
        
        // Draw shadow
        graphics.fill(0, 0, 0, alpha * 0.5);
        graphics.text(effect.text, effect.x + 2, effect.y + 2);
        
        // Draw main text with golden color
        graphics.fill(effect.color[0], effect.color[1], effect.color[2], alpha);
        graphics.text(effect.text, effect.x, effect.y);
        
        graphics.textStyle(NORMAL);
        graphics.pop();
    }
}

// Create global instance
const specialEffects = new SpecialEffectsSystem();