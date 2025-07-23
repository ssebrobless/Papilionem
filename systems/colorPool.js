// Main Color Pool System - Manages the central pool that attracts particles and spawns butterflies
// Location: Center at grid position (8.5, 7) with radius of 5 grid squares

class MainColorPool {
    constructor() {
        // Pool location in grid coordinates
        this.gridCenter = { x: 8.5, y: 7 };
        this.gridRadius = 5; // 5 grid squares in each direction
        
        // Convert to screen coordinates
        const screenCenter = gridManager.isoToScreen(this.gridCenter.x, this.gridCenter.y);
        this.x = screenCenter.x;
        this.y = screenCenter.y;
        
        // Pool properties
        this.absorbedPixels = [];
        this.glowIntensity = 0;
        this.maxGlowIntensity = 100;
        this.spawnThreshold = 50; // Glow intensity needed to spawn butterfly
        this.spawnCooldown = 0;
        this.spawnCooldownDuration = 300; // 5 seconds between spawns
        
        // Visual properties
        this.pulseTimer = 0;
        this.pulseSpeed = 0.05;
        
        // Gravity properties
        this.minGravityStrength = 0.002; // Minimum attraction force
        this.maxGravityStrength = 0.05;  // Maximum attraction force
        this.maxGravityDistance = 200;   // Maximum distance for gravity effect
        
        console.log(`🌀 Main Color Pool created at screen position (${this.x}, ${this.y})`);
    }
    
    // Update pool state and handle spawning
    update(butterflies, particleSystem) {
        this.pulseTimer += this.pulseSpeed;
        
        // Apply gravity to all particles
        this.applyGravityToParticles(particleSystem);
        
        // Update spawn cooldown
        if (this.spawnCooldown > 0) {
            this.spawnCooldown--;
        }
        
        // Check for butterfly spawning
        if (this.glowIntensity >= this.spawnThreshold && 
            this.spawnCooldown === 0 && 
            butterflies.length < gameConfig.entities.maxButterflies) {
            this.spawnButterfly(butterflies, particleSystem);
        }
        
        // Gradually decay glow intensity
        if (this.glowIntensity > 0) {
            this.glowIntensity = Math.max(0, this.glowIntensity - 0.1);
        }
    }
    
    // Apply magnetic gravity to all particles
    applyGravityToParticles(particleSystem) {
        for (let particle of particleSystem.particles) {
            // Only affect happy and scale particles (not stress particles)
            if (particle.type === 'happy' || particle.type === 'scale') {
                this.applyGravityToParticle(particle);
            }
        }
    }
    
    // Apply gravity force to a single particle
    applyGravityToParticle(particle) {
        const dx = this.x - particle.x;
        const dy = this.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Skip if particle is too far away
        if (distance > this.maxGravityDistance) return;
        
        // Calculate gravity strength based on distance (inverse square law with minimum)
        const normalizedDistance = distance / this.maxGravityDistance;
        const gravityStrength = this.minGravityStrength + 
                               (this.maxGravityStrength - this.minGravityStrength) * 
                               (1 - normalizedDistance * normalizedDistance);
        
        // Apply force toward pool center
        if (distance > 0) {
            const forceX = (dx / distance) * gravityStrength;
            const forceY = (dy / distance) * gravityStrength;
            
            particle.vx += forceX;
            particle.vy += forceY;
        }
        
        // Check if particle should be absorbed
        if (this.isWithinAbsorptionZone(particle.x, particle.y)) {
            this.absorbeParticle(particle);
        }
    }
    
    // Check if position is within the pool's absorption zone
    isWithinAbsorptionZone(x, y) {
        // Convert screen coordinates to grid coordinates
        const gridPos = gridManager.screenToIso(x, y);
        
        // Check if within elliptical bounds
        const dx = gridPos.x - this.gridCenter.x;
        const dy = gridPos.y - this.gridCenter.y;
        
        // Elliptical bounds: (x-cx)²/rx² + (y-cy)²/ry² <= 1
        const normalizedDistance = (dx * dx) / (this.gridRadius * this.gridRadius) + 
                                  (dy * dy) / (this.gridRadius * this.gridRadius);
        
        return normalizedDistance <= 1;
    }
    
    // Absorb a particle into the pool
    absorbeParticle(particle) {
        // Add to absorbed pixels
        this.absorbedPixels.push({
            color: particle.color,
            absorbedTime: frameCount,
            x: particle.x - this.x,
            y: particle.y - this.y
        });
        
        // Increase glow intensity based on particle type
        const glowIncrease = particle.type === 'happy' ? 2 : 1;
        this.glowIntensity = Math.min(this.maxGlowIntensity, this.glowIntensity + glowIncrease);
        
        // Mark particle for removal by setting lifetime to 0
        particle.lifetime = 0;
        
        // Emit absorption event
        eventBus.emit(GameEvents.PIXELS_SETTLED, {
            pixel: particle,
            pool: this
        });
    }
    
    // Spawn a new butterfly from the pool
    spawnButterfly(butterflies, particleSystem) {
        // Calculate spawn position at least 5 grid spaces away
        const spawnDistance = 5 + random(3); // 5-8 grid spaces away
        const spawnAngle = random(TWO_PI);
        
        const spawnGridX = this.gridCenter.x + cos(spawnAngle) * spawnDistance;
        const spawnGridY = this.gridCenter.y + sin(spawnAngle) * spawnDistance;
        
        // Clamp to grid bounds (ensure we stay within playable area)
        const clampedGridX = constrain(spawnGridX, 2, gridManager.bounds.maxX - 2);
        const clampedGridY = constrain(spawnGridY, 2, gridManager.bounds.maxY - 2);
        
        const spawnScreen = gridManager.isoToScreen(clampedGridX, clampedGridY);
        
        // Create new butterfly with mixed colors from absorbed pixels
        const butterflyColors = this.getMixedColorsForButterfly();
        // If this would be the first butterfly, make it immortal
        const isFirstButterfly = butterflies.length === 0;
        const newButterfly = new Butterfly(
            spawnScreen.x, 
            spawnScreen.y - gameConfig.entities.heightOffset.butterfly, 
            butterflyColors,
            isFirstButterfly
        );
        
        // Add butterfly to game
        butterflies.push(newButterfly);
        
        // Create spawn animation effect
        particleSystem.emitBurst(this.x, this.y, [255, 255, 255], 12);
        
        // Reduce glow intensity
        this.glowIntensity = Math.max(0, this.glowIntensity - this.spawnThreshold);
        
        // Set spawn cooldown
        this.spawnCooldown = this.spawnCooldownDuration;
        
        // Emit events
        eventBus.emit(GameEvents.POOL_SPAWNING, { 
            pool: this, 
            butterfly: newButterfly,
            spawnLocation: { x: spawnScreen.x, y: spawnScreen.y }
        });
        
        eventBus.emit(GameEvents.BUTTERFLY_SPAWNED, { 
            butterfly: newButterfly, 
            source: 'colorPool' 
        });
        
        console.log('🦋 Spawned butterfly from main color pool');
    }
    
    // Generate mixed colors for new butterfly based on absorbed pixels
    getMixedColorsForButterfly() {
        if (this.absorbedPixels.length === 0) {
            // Fallback to default colors
            return random(gameConfig.entities.butterfly.colors);
        }
        
        // Calculate average colors from recent absorbed pixels
        const recentPixels = this.absorbedPixels.slice(-20); // Use last 20 pixels
        let r1 = 0, g1 = 0, b1 = 0;
        let r2 = 0, g2 = 0, b2 = 0;
        
        // First color: average of all recent pixels
        for (let pixel of recentPixels) {
            r1 += pixel.color[0];
            g1 += pixel.color[1];
            b1 += pixel.color[2];
        }
        
        const count = recentPixels.length;
        const color1 = [r1 / count, g1 / count, b1 / count];
        
        // Second color: slightly brighter version
        const color2 = [
            Math.min(255, color1[0] * 1.2),
            Math.min(255, color1[1] * 1.2), 
            Math.min(255, color1[2] * 1.2)
        ];
        
        return [color1, color2];
    }
    
    // Draw the color pool
    draw(graphics) {
        graphics.push();
        graphics.translate(this.x, this.y);
        
        // Draw pool boundary (for debug/visibility)
        if (typeof debugUI !== 'undefined' && debugUI.enabled) {
            this.drawPoolBoundary(graphics);
        }
        
        // Draw absorbed pixels as a glowing mass
        this.drawAbsorbedPixels(graphics);
        
        // Draw glow effect
        this.drawGlowEffect(graphics);
        
        graphics.pop();
    }
    
    // Draw pool boundary for debug mode
    drawPoolBoundary(graphics) {
        graphics.noFill();
        graphics.stroke(255, 255, 255, 100);
        graphics.strokeWeight(1);
        
        // Draw elliptical boundary based on grid coordinates
        const screenRadiusX = this.gridRadius * gameConfig.grid.cellSize;
        const screenRadiusY = this.gridRadius * gameConfig.grid.cellSize * 0.5; // Isometric compression
        
        graphics.ellipse(0, 0, screenRadiusX * 2, screenRadiusY * 2);
    }
    
    // Draw absorbed pixels with glow
    drawAbsorbedPixels(graphics) {
        graphics.noStroke();
        
        for (let pixel of this.absorbedPixels) {
            // Fade effect based on absorption time
            const age = frameCount - pixel.absorbedTime;
            const fadeAlpha = Math.max(50, 200 - age * 2);
            
            graphics.fill(pixel.color[0], pixel.color[1], pixel.color[2], fadeAlpha);
            
            // Draw as diamond
            graphics.push();
            graphics.translate(pixel.x, pixel.y);
            graphics.rotate(PI/4);
            graphics.rect(-2, -2, 4, 4);
            graphics.pop();
        }
    }
    
    // Draw glow effect based on intensity
    drawGlowEffect(graphics) {
        // Always show a subtle base glow
        const baseGlow = 0.2;
        const glowRatio = Math.max(baseGlow, this.glowIntensity / this.maxGlowIntensity);
        const pulse = sin(this.pulseTimer) * 0.2 + 0.8;
        
        // Progress indicator ring
        const progress = this.glowIntensity / this.spawnThreshold;
        
        // Outer progress ring
        if (progress > 0) {
            graphics.push();
            graphics.noFill();
            graphics.strokeWeight(3);
            // Color transitions from blue to gold as it fills
            const r = lerp(100, 255, progress);
            const g = lerp(150, 220, progress);
            const b = lerp(255, 100, progress);
            graphics.stroke(r, g, b, 150);
            
            // Draw arc showing progress
            const angle = map(progress, 0, 1, 0, TWO_PI);
            graphics.arc(0, 0, 80, 56, -HALF_PI, -HALF_PI + angle);
            graphics.pop();
        }
        
        // Multiple glow layers with enhanced visibility
        for (let i = 4; i > 0; i--) {
            const layerSize = (30 + glowRatio * 50) * (i / 4) * pulse;
            const layerAlpha = (baseGlow * 40 + glowRatio * 80) / i;
            
            graphics.noStroke();
            // Magical purple-pink glow
            graphics.fill(
                200 + glowRatio * 55, 
                100 + glowRatio * 100, 
                255 - glowRatio * 100, 
                layerAlpha
            );
            graphics.ellipse(0, 0, layerSize, layerSize * 0.7);
        }
        
        // Inner bright core
        if (this.glowIntensity > 0) {
            const coreSize = 15 + glowRatio * 20;
            graphics.fill(255, 255, 255, glowRatio * 60);
            graphics.ellipse(0, 0, coreSize, coreSize * 0.7);
        }
        
        // Spawn readiness indicator - bright pulsing
        if (this.glowIntensity >= this.spawnThreshold && this.spawnCooldown === 0) {
            const readyPulse = sin(this.pulseTimer * 4) * 0.4 + 0.6;
            // Bright white burst effect
            for (let i = 2; i > 0; i--) {
                graphics.fill(255, 255, 255, 120 * readyPulse / i);
                graphics.ellipse(0, 0, 60 * readyPulse * i, 42 * readyPulse * i);
            }
            
            // Show "READY" text effect
            graphics.push();
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(12);
            graphics.fill(255, 255, 255, 200 * readyPulse);
            graphics.text("✨", 0, -45);
            graphics.pop();
        }
    }
}

// Create global instance
const mainColorPool = new MainColorPool();