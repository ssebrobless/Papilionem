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
        
        // Pre-allocated color arrays for spawn effects
        this.whiteParticleColor = [255, 255, 255];
        this.spawnEffectColors = [
            [255, 220, 200],
            [220, 255, 150],
            [200, 150, 255]
        ];
        
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
        
        // Decay glow intensity only when there are more than 2 butterflies
        // This makes spawning progressively harder as population grows
        if (butterflies.length > 2 && this.glowIntensity > 0) {
            // Decay rate scales with butterfly count
            const decayRate = 0.05 + (butterflies.length - 3) * 0.02; // 0.05 base + 0.02 per butterfly over 3
            this.glowIntensity = Math.max(0, this.glowIntensity - decayRate);
        }
    }
    
    // Apply magnetic gravity to all particles
    applyGravityToParticles(particleSystem) {
        for (let particle of particleSystem.particles) {
            // Only affect happy and scale particles (not stress particles)
            if (particle.type === 'happy' || particle.type === 'happy_visual' || particle.type === 'scale') {
                this.applyGravityToParticle(particle);
            }
        }
    }
    
    // Apply gravity force to a single particle
    applyGravityToParticle(particle) {
        // Skip particles still in pop-out phase
        if (particle.popOutDuration > 0 && particle.popOutTimer < particle.popOutDuration) {
            return;
        }
        
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
        
        // Apply bathtub drain vortex effect
        if (distance > 0) {
            // Calculate distance ratio for spiral transition
            const distanceRatio = distance / this.maxGravityDistance;
            
            // Determine spiral intensity based on distance (bathtub drain effect)
            let spiralRatio = 0;
            if (distanceRatio > 0.7) {
                // Far particles: minimal spiral (5% tangential, 95% inward)
                spiralRatio = 0.05;
            } else if (distanceRatio > 0.4) {
                // Medium particles: gentle spiral (20% tangential, 80% inward)  
                spiralRatio = 0.2;
            } else if (distanceRatio > 0.2) {
                // Close particles: noticeable spiral (40% tangential, 60% inward)
                spiralRatio = 0.4;
            } else {
                // Very close: dramatic vortex (60% tangential, 40% inward)
                spiralRatio = 0.6;
            }
            
            // Calculate force components
            const totalForce = gravityStrength;
            const inwardForce = totalForce * (1 - spiralRatio);
            const tangentForce = totalForce * spiralRatio;
            
            // Calculate proper tangential direction (perpendicular to radial)
            const radialX = dx / distance; // Normalized vector toward center
            const radialY = dy / distance;
            const tangentX = -radialY; // Perpendicular for clockwise spiral
            const tangentY = radialX;
            
            // Apply forces
            particle.vx += radialX * inwardForce + tangentX * tangentForce;
            particle.vy += radialY * inwardForce + tangentY * tangentForce;
            
            // Vortex acceleration for dramatic drain effect when very close
            if (distance < 40) {
                const vortexBoost = (40 - distance) / 40;
                const boostMultiplier = 1 + vortexBoost * 0.8;
                particle.vx *= boostMultiplier;
                particle.vy *= boostMultiplier;
            }
        }
        
        // Check if particle should be absorbed
        if (this.isWithinAbsorptionZone(particle.x, particle.y)) {
            this.absorbeParticle(particle);
        }
    }
    
    // Check if position is within the pool's absorption zone
    isWithinAbsorptionZone(x, y) {
        // Tighter absorption zone for dramatic final spiral
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Very small absorption radius for dramatic effect
        return distance < 8;
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
        let glowIncrease = 1; // Default for 'scale' particles
        if (particle.type === 'happy') {
            glowIncrease = 2; // Full value for happiness particles
        } else if (particle.type === 'happy_visual') {
            glowIncrease = 0.5; // 1/4 value for visual particles (2 * 0.5 = 1, same as scale)
        }
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
        
        // Check if we should spawn the golden butterfly
        let personalityType = null;
        if (this.shouldSpawnGoldenButterfly()) {
            personalityType = 'golden';
            console.log('🌟 GOLDEN BUTTERFLY SPAWNING!');
        }
        
        // Create new butterfly - let personality determine colors
        // If this would be the first butterfly, make it immortal
        const isFirstButterfly = butterflies.length === 0;
        const newButterfly = new Butterfly(
            spawnScreen.x, 
            spawnScreen.y - gameConfig.entities.heightOffset.butterfly, 
            null, // Let personality determine colors
            isFirstButterfly,
            personalityType // Golden if conditions met, otherwise random
        );
        
        // Add butterfly to game
        butterflies.push(newButterfly);
        
        // Track encountered butterfly types
        if (typeof gameCore !== 'undefined' && gameCore.gameState) {
            gameCore.gameState.encounteredButterflies.add(newButterfly.personalityType);
            if (newButterfly.personalityType === 'golden') {
                gameCore.gameState.goldenButterflySpawned = true;
            }
        }
        
        // Create spawn animation effect
        particleSystem.emitBurst(this.x, this.y, [255, 255, 255], 12);
        
        // Reduce glow intensity by spawn threshold but don't go below 0
        this.glowIntensity = Math.max(0, this.glowIntensity - this.spawnThreshold);
        
        // Create magical explosion effect
        this.createSpawnExplosion(particleSystem, this.x, this.y);
        
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
    
    // Check if conditions are met to spawn the golden butterfly
    shouldSpawnGoldenButterfly() {
        if (typeof gameCore === 'undefined' || !gameCore.gameState) return false;
        
        const state = gameCore.gameState;
        
        // Don't spawn if already spawned
        if (state.goldenButterflySpawned) return false;
        
        // Check if player has collected all non-golden butterflies
        const requiredTypes = ['friendly', 'cautious', 'energetic', 'skittish', 'wise', 'mystic'];
        for (let type of requiredTypes) {
            if (!state.collectedButterflies.has(type)) {
                return false;
            }
        }
        
        // All butterflies collected! Time for the golden butterfly!
        console.log('🌟 All butterflies collected! Golden butterfly can now spawn!');
        return true;
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
        
        // Draw pool boundary and exclusion zone (for debug/visibility)
        if (typeof debugUI !== 'undefined' && debugUI.enabled) {
            this.drawPoolBoundary(graphics);
            this.drawExclusionZone(graphics);
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
    
    // Draw flower exclusion zone for debug mode
    drawExclusionZone(graphics) {
        graphics.noFill();
        graphics.stroke(255, 100, 100, 80);
        graphics.strokeWeight(1);
        
        // 2.5 tile radius exclusion zone
        const exclusionRadius = 2.5 * gameConfig.grid.cellSize;
        const screenRadiusX = exclusionRadius;
        const screenRadiusY = exclusionRadius * 0.5; // Isometric compression
        
        // Draw dashed ellipse manually
        const segments = 32;
        for (let i = 0; i < segments; i += 2) {
            const angle1 = (TWO_PI / segments) * i;
            const angle2 = (TWO_PI / segments) * (i + 1);
            
            const x1 = cos(angle1) * screenRadiusX;
            const y1 = sin(angle1) * screenRadiusY;
            const x2 = cos(angle2) * screenRadiusX;
            const y2 = sin(angle2) * screenRadiusY;
            
            graphics.line(x1, y1, x2, y2);
        }
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
    
    // Create magical explosion effect when spawning
    createSpawnExplosion(particleSystem, x, y) {
        // Create a burst of magical particles in a ring pattern
        const numParticles = 24;
        for (let i = 0; i < numParticles; i++) {
            const angle = (TWO_PI / numParticles) * i;
            const speed = random(2, 4);
            
            // Alternate between white and pre-allocated pool-colored particles
            const color = i % 2 === 0 ? 
                this.whiteParticleColor : 
                random(this.spawnEffectColors);
            
            const pixel = particleSystem.emit(x, y, color, 1, 'joy');
            if (pixel) {
                // Override velocity for explosion pattern
                pixel.vx = cos(angle) * speed;
                pixel.vy = sin(angle) * speed - 1; // Slight upward bias
                pixel.lifetime = 400; // Longer lifetime for dramatic effect
            }
        }
        
        // Create inner burst of smaller particles
        for (let i = 0; i < 12; i++) {
            const angle = random(TWO_PI);
            const speed = random(1, 2);
            const pixel = particleSystem.emit(x, y, [255, 255, 200], 1, 'joy');
            if (pixel) {
                pixel.vx = cos(angle) * speed;
                pixel.vy = sin(angle) * speed - 0.5;
            }
        }
        
        // Add a magical fountain effect for spawn
        particleSystem.emitFountain(x, y, [255, 215, 0], 30, 4); // Golden fountain
        
        // And a spiral for extra flair
        setTimeout(() => {
            particleSystem.emitSpiral(x, y, [255, 255, 255], 16);
        }, 100);
    }
    
    // Draw glow effect based on intensity
    drawGlowEffect(graphics) {
        // Always show a subtle base glow that increases with intensity
        const baseGlow = 0.25 + (this.glowIntensity / this.maxGlowIntensity) * 0.3;
        const glowRatio = Math.max(baseGlow, this.glowIntensity / this.maxGlowIntensity);
        const pulse = sin(this.pulseTimer) * 0.15 + 0.85;
        
        // Progress indicator ring - much more prominent and always visible
        const progress = this.glowIntensity / this.spawnThreshold;
        
        // Always show progress ring (even at 0%) for clear feedback
        graphics.push();
        graphics.translate(5, 10); // Offset position as requested
        
        // Draw larger, more visible background ring - properly isometric (2:1 ratio)
        graphics.strokeWeight(8);
        graphics.stroke(255, 255, 255, 60); // More opaque background
        graphics.noFill();
        graphics.ellipse(0, 0, 110, 55); // True isometric proportions (width, height * 0.5)
        
        // Draw progress ring with much more visibility - properly isometric
        if (progress > 0) {
            graphics.strokeWeight(7);
            // Enhanced color transitions from deep purple to bright gold
            const r = lerp(150, 255, Math.min(progress, 1));
            const g = lerp(100, 230, Math.min(progress, 1));
            const b = lerp(255, 50, Math.min(progress, 1));
            graphics.stroke(r, g, b, 220 + pulse * 35); // Very opaque
            
            // Draw arc showing progress with proper isometric ellipse
            const angle = map(Math.min(progress, 1), 0, 1, 0, TWO_PI);
            graphics.arc(0, 0, 110, 55, -HALF_PI, -HALF_PI + angle);
        }
        
        graphics.pop();
        
        // Show numerical progress as text with background bubble - keep this separate for better readability
        graphics.push();
        graphics.translate(1, 1); // Same offset for consistency
        graphics.textAlign(CENTER, CENTER);
        
        // Draw background bubble for contrast
        graphics.noStroke();
        graphics.fill(0, 0, 0, 120); // Semi-transparent dark background
        graphics.ellipse(0, -60, 35, 18); // Background bubble
        
        // Draw text with high contrast
        graphics.textSize(11); // Slightly larger
        graphics.fill(255, 255, 255, 250); // Very high contrast, almost opaque
        graphics.stroke(0, 0, 0, 150); // Stronger outline for better readability
        graphics.strokeWeight(0.8);
        const percentText = Math.round(Math.min(progress * 100, 100)) + "%";
        graphics.text(percentText, 0, -60);
        graphics.pop();
        
        // Progressive ambient glow that builds with intensity
        const numLayers = 5 + Math.floor(glowRatio * 3);
        for (let i = numLayers; i > 0; i--) {
            const layerSize = (35 + glowRatio * 60) * (i / numLayers) * pulse;
            const layerAlpha = (baseGlow * 50 + glowRatio * 100) / (i * 0.7);
            
            graphics.noStroke();
            // Enhanced magical glow with more vibrant colors
            const glowProgress = glowRatio;
            graphics.fill(
                200 + glowProgress * 55, 
                120 + glowProgress * 100, 
                255 - glowProgress * 150, 
                Math.min(layerAlpha, 150)
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