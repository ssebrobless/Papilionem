// Main Color Pool System - Manages the central pool that attracts particles and spawns butterflies
// Location: Center at grid position (8.5, 7) with radius of 5 grid squares

class MainColorPool {
    constructor() {
        // Pool location in grid coordinates
        this.gridCenter = { x: 8.5, y: 7 };
        this.gridRadius = 5; // 5 grid squares in each direction
        this.sectionRotationDegrees = 0;
        
        // Convert to screen coordinates
        const screenCenter = gridManager.isoToScreen(this.gridCenter.x, this.gridCenter.y);
        this.baseX = screenCenter.x;
        this.baseY = screenCenter.y;
        this.x = screenCenter.x;
        this.y = screenCenter.y;
        
        // Pool properties
        this.absorbedPixels = [];
        this.glowIntensity = 0;
        this.maxGlowIntensity = 100;
        this.spawnThreshold = 35; // Glow intensity needed to spawn butterfly (reduced from 50 for easier spawning)
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
    
    rotatePointForSection(point, rotationDegrees = this.sectionRotationDegrees) {
        if (!rotationDegrees) return { ...point };
        const centerX = gameConfig.canvas.baseWidth / 2;
        const centerY = gameConfig.canvas.baseHeight / 2;
        const rotationRadians = radians(rotationDegrees);
        const dx = point.x - centerX;
        const dy = point.y - centerY;

        return {
            x: centerX + (dx * cos(rotationRadians)) - (dy * sin(rotationRadians)),
            y: centerY + (dx * sin(rotationRadians)) + (dy * cos(rotationRadians))
        };
    }

    setSectionRotation(rotationDegrees = 0) {
        this.sectionRotationDegrees = rotationDegrees || 0;
        const rotatedCenter = this.rotatePointForSection({ x: this.baseX, y: this.baseY });
        this.x = rotatedCenter.x;
        this.y = rotatedCenter.y;
    }

    // Update pool state and handle spawning
    update(butterflies, particleSystem) {
        const wildButterflyCount = butterflies.filter(butterfly => butterfly.birthSource !== 'bred').length;
        const totalAdultCount = butterflies.length;
        this.pulseTimer += this.pulseSpeed;
        
        // Apply gravity to all particles
        this.applyGravityToParticles(particleSystem);
        
        // Update spawn cooldown
        if (this.spawnCooldown > 0) {
            this.spawnCooldown--;
        }
        
        // Passive gain: 1% per 5 seconds (1 point per 5 seconds since max is 100)
        // At 60 fps, this is 1/300 per frame (60 fps * 5 seconds = 300 frames)
        const passiveGainPerFrame = 1 / 300;
        this.glowIntensity = Math.min(this.maxGlowIntensity, this.glowIntensity + passiveGainPerFrame);
        
        // Check for butterfly spawning
        if (this.glowIntensity >= this.spawnThreshold && 
            this.spawnCooldown === 0 && 
            wildButterflyCount < gameConfig.entities.maxButterflies) {
            this.spawnButterfly(butterflies, particleSystem);
        }
        
        // Decay glow intensity only when there are more than 2 butterflies
        // This makes spawning progressively harder as population grows
        if (wildButterflyCount > 2 && this.glowIntensity > 0) {
            // Decay rate scales with butterfly count but is much gentler
            // Base decay: 0.002 (less than passive gain of 0.00333)
            // Additional decay: 0.001 per butterfly over 3
            const decayRate = 0.002 + (wildButterflyCount - 3) * 0.001;
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
        
        // Clean up old absorbed pixels (keep only last 100)
        if (this.absorbedPixels.length > 100) {
            this.absorbedPixels = this.absorbedPixels.slice(-100);
        }
        
        // Increase glow intensity based on particle type (increased by 30% for easier spawning)
        let glowIncrease = 1.3; // Default for 'scale' particles (was 1)
        if (particle.type === 'happy') {
            glowIncrease = 2.6; // Full value for happiness particles (was 2)
        } else if (particle.type === 'happy_visual') {
            glowIncrease = 0.65; // Visual particles (was 0.5)
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
        // Pick archway spawn point (50/50 chance)
        const archways = [
            { x: 232, y: 139 },  // Left archway
            { x: 589, y: 103 },  // Right archway
        ].map(archway => this.rotatePointForSection(archway));
        const archway = archways[Math.floor(random(2))];
        
        // Check if we should spawn the golden butterfly
        let personalityType = null;
        let isGoldenButterfly = false;
        if (this.shouldSpawnGoldenButterfly()) {
            personalityType = 'golden';
            isGoldenButterfly = true;
            console.log('🌟 GOLDEN BUTTERFLY SPAWNING!');
        }
        
        // Create new butterfly at archway position
        const isFirstButterfly = butterflies.filter(butterfly => butterfly.birthSource !== 'bred').length === 0;
        const spawnX = archway.x;
        const spawnY = archway.y;
        const newButterfly = new Butterfly(
            spawnX,
            spawnY,
            null, // Let personality determine colors
            isFirstButterfly,
            personalityType // Golden if conditions met, otherwise random
        );

        // Calculate target in main area (diagonal inward from archway)
        const targetX = archway === archways[0]
            ? 320 + random(-30, 30)   // Left archway → fly toward center-right
            : 480 + random(-30, 30);  // Right archway → fly toward center-left
        const targetY = 250 + random(-30, 30);

        // Set up spawn flight
        newButterfly.isSpawning = true;
        newButterfly.spawnFlight = {
            originX: spawnX,
            originY: spawnY,
            targetX: targetX,
            targetY: targetY,
            progress: 0,
            duration: 120
        };

        // Mark butterfly as newly spawned for special effects
        newButterfly.spawnTimer = isGoldenButterfly ? 300 : 180;
        newButterfly.spawnGlowIntensity = 1.0;

        // Add butterfly to game
        butterflies.push(newButterfly);
        
        // Delegate legacy pool progression to the canonical progression owner.
        if (typeof gameCore !== 'undefined' && gameCore.gameState && typeof progressionManager !== 'undefined') {
            progressionManager.recordEncounter(gameCore.gameState, newButterfly.personalityType, {
                source: 'colorPool'
            });
        }
        
        // Create spawn animation effect at pool
        particleSystem.emitBurst(this.x, this.y, [255, 255, 255], 12);

        // Create magical trail from pool to archway
        this.createMagicalTrail(particleSystem, this.x, this.y, spawnX, spawnY);

        // Create arrival burst at archway (enhanced for golden butterfly)
        if (isGoldenButterfly) {
            this.createGoldenArrivalBurst(particleSystem, spawnX, spawnY);
        } else {
            this.createArrivalBurst(particleSystem, spawnX, spawnY, newButterfly.colors);
        }
        
        // Reduce glow intensity by spawn threshold but don't go below 0
        this.glowIntensity = Math.max(0, this.glowIntensity - this.spawnThreshold);
        
        // Create magical explosion effect at pool
        this.createSpawnExplosion(particleSystem, this.x, this.y);
        
        // Set spawn cooldown
        this.spawnCooldown = this.spawnCooldownDuration;
        
        // Emit events
        eventBus.emit(GameEvents.POOL_SPAWNING, {
            pool: this,
            butterfly: newButterfly,
            spawnLocation: { x: spawnX, y: spawnY }
        });
        
        eventBus.emit(GameEvents.BUTTERFLY_SPAWNED, { 
            butterfly: newButterfly, 
            source: 'colorPool' 
        });
        
        console.log('🦋 Spawned butterfly from main color pool');
    }
    
    // Check if conditions are met to spawn the golden butterfly
    shouldSpawnGoldenButterfly() {
        // Golden now participates in the canonical unlocked ladder and should not
        // use the old single-special-spawn path.
        return false;
        if (typeof gameCore === 'undefined' || !gameCore.gameState) return false;
        if (typeof progressionManager !== 'undefined') {
            const unlocked = progressionManager.isGoldenUnlocked?.(gameCore.gameState);
            if (unlocked) {
                console.log('ðŸŒŸ All butterflies collected! Golden butterfly can now spawn!');
            }
            return !!unlocked && !gameCore.gameState.goldenButterflySpawned;
        }
        
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
    
    // Draw pool base layer (below entities) — ring, spiral, glow, absorbed pixels
    drawBase() {
        push();
        translate(this.x, this.y);

        if (typeof debugUI !== 'undefined' && debugUI.enabled) {
            this.drawPoolBoundary_main();
            this.drawExclusionZone_main();
        }

        this.drawAbsorbedPixels_main();
        this.drawBaseGlow();

        pop();
    }

    // Draw pool top layer (above entities) — spawn readiness only
    draw(graphics) {
        if (this.glowIntensity < this.spawnThreshold || this.spawnCooldown > 0) return;

        graphics.push();
        graphics.translate(this.x, this.y);

        const readyPulse = sin(this.pulseTimer * 4) * 0.4 + 0.6;
        graphics.noStroke();
        for (let i = 2; i > 0; i--) {
            graphics.fill(255, 255, 255, 120 * readyPulse / i);
            graphics.ellipse(0, 0, 60 * readyPulse * i, 42 * readyPulse * i);
        }

        graphics.push();
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(12);
        graphics.fill(255, 255, 255, 200 * readyPulse);
        graphics.text("✨", 0, -45);
        graphics.pop();

        graphics.pop();
    }
    
    // Draw pool boundary on main canvas (for drawBase)
    drawPoolBoundary_main() {
        noFill();
        stroke(255, 255, 255, 100);
        strokeWeight(1);
        const screenRadiusX = this.gridRadius * gameConfig.grid.cellSize;
        const screenRadiusY = this.gridRadius * gameConfig.grid.cellSize * 0.5;
        ellipse(0, 0, screenRadiusX * 2, screenRadiusY * 2);
    }

    // Draw exclusion zone on main canvas (for drawBase)
    drawExclusionZone_main() {
        noFill();
        stroke(255, 100, 100, 80);
        strokeWeight(1);
        const exclusionRadius = 2.5 * gameConfig.grid.cellSize;
        const screenRadiusX = exclusionRadius;
        const screenRadiusY = exclusionRadius * 0.5;
        const segments = 32;
        for (let i = 0; i < segments; i += 2) {
            const angle1 = (TWO_PI / segments) * i;
            const angle2 = (TWO_PI / segments) * (i + 1);
            line(cos(angle1) * screenRadiusX, sin(angle1) * screenRadiusY,
                 cos(angle2) * screenRadiusX, sin(angle2) * screenRadiusY);
        }
    }

    // Draw absorbed pixels on main canvas (for drawBase)
    drawAbsorbedPixels_main() {
        noStroke();
        this.absorbedPixels = this.absorbedPixels.filter(pixel => {
            const age = frameCount - pixel.absorbedTime;
            return age < 300;
        });
        for (let pixel of this.absorbedPixels) {
            const age = frameCount - pixel.absorbedTime;
            const fadeAlpha = Math.max(50, 200 - age * 2);
            fill(pixel.color[0], pixel.color[1], pixel.color[2], fadeAlpha);
            push();
            translate(pixel.x, pixel.y);
            rotate(PI/4);
            rect(-2, -2, 4, 4);
            pop();
        }
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
        
        // Clean up very old pixels while drawing
        this.absorbedPixels = this.absorbedPixels.filter(pixel => {
            const age = frameCount - pixel.absorbedTime;
            return age < 300; // Remove pixels older than 5 seconds
        });
        
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
    
    // Create magical trail from pool to butterfly spawn location
    createMagicalTrail(particleSystem, startX, startY, endX, endY) {
        const distance = dist(startX, startY, endX, endY);
        const steps = Math.floor(distance / 15); // One particle every 15 pixels
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = lerp(startX, endX, t);
            const y = lerp(startY, endY, t);
            
            // Delay particles to create trailing effect
            setTimeout(() => {
                // Create golden trail particles
                const pixel = particleSystem.emit(
                    x + random(-5, 5), 
                    y + random(-5, 5), 
                    [255, 215, 0], // Golden color
                    1, 
                    'joy'
                );
                if (pixel) {
                    pixel.lifetime = 200; // Shorter lifetime for trail
                    pixel.size = gameConfig.particles.pixelSize * 0.8;
                    // Add slight upward drift
                    pixel.vy -= 0.5;
                }
                
                // Add sparkle particles
                if (i % 2 === 0) {
                    const sparkle = particleSystem.emit(
                        x + random(-8, 8),
                        y + random(-8, 8),
                        [255, 255, 255], // White sparkles
                        1,
                        'joy'
                    );
                    if (sparkle) {
                        sparkle.lifetime = 150;
                        sparkle.size = gameConfig.particles.pixelSize * 0.6;
                    }
                }
            }, i * 20); // 20ms delay between each particle
        }
    }
    
    // Create arrival burst at butterfly spawn location
    createArrivalBurst(particleSystem, x, y, butterflyColors) {
        // Delay the arrival burst to sync with trail
        const trailDuration = 300; // Based on trail animation time
        
        setTimeout(() => {
            // Main starburst effect
            const numRays = 16;
            for (let i = 0; i < numRays; i++) {
                const angle = (TWO_PI / numRays) * i;
                const speed = random(3, 5);
                
                // Use butterfly's colors for the burst
                const color = i % 2 === 0 ? butterflyColors[0] : butterflyColors[1];
                
                const pixel = particleSystem.emit(x, y, color, 1, 'joy');
                if (pixel) {
                    pixel.vx = cos(angle) * speed;
                    pixel.vy = sin(angle) * speed - 1;
                    pixel.lifetime = 300;
                    pixel.size = gameConfig.particles.pixelSize * 1.2;
                }
            }
            
            // Central bright flash
            particleSystem.emitBurst(x, y, [255, 255, 255], 20);
            
            // Ring of sparkles
            for (let i = 0; i < 12; i++) {
                const angle = (TWO_PI / 12) * i;
                const ringRadius = 20;
                const px = x + cos(angle) * ringRadius;
                const py = y + sin(angle) * ringRadius;
                
                particleSystem.emit(px, py, [255, 255, 200], 1, 'joy');
            }
            
            // Vertical fountain effect
            particleSystem.emitFountain(x, y, butterflyColors[0], 15, 3);
        }, trailDuration);
    }
    
    // Create special arrival burst for golden butterfly
    createGoldenArrivalBurst(particleSystem, x, y) {
        // Delay the arrival burst to sync with trail
        const trailDuration = 300;
        
        setTimeout(() => {
            // Create massive golden explosion
            const numRays = 32; // Double the rays
            for (let i = 0; i < numRays; i++) {
                const angle = (TWO_PI / numRays) * i;
                const speed = random(4, 7);
                
                // Alternating gold and white rays
                const color = i % 2 === 0 ? [255, 215, 0] : [255, 255, 255];
                
                const pixel = particleSystem.emit(x, y, color, 1, 'joy');
                if (pixel) {
                    pixel.vx = cos(angle) * speed;
                    pixel.vy = sin(angle) * speed - 1.5;
                    pixel.lifetime = 500; // Longer lasting
                    pixel.size = gameConfig.particles.pixelSize * 1.5;
                }
            }
            
            // Multiple ring explosions
            for (let ring = 0; ring < 3; ring++) {
                setTimeout(() => {
                    const ringRadius = 30 + ring * 20;
                    const numParticles = 16 + ring * 8;
                    
                    for (let i = 0; i < numParticles; i++) {
                        const angle = (TWO_PI / numParticles) * i;
                        const px = x + cos(angle) * ringRadius;
                        const py = y + sin(angle) * ringRadius * 0.7;
                        
                        particleSystem.emit(px, py, [255, 215, 0], 1, 'joy');
                    }
                }, ring * 100);
            }
            
            // Central massive burst
            particleSystem.emitBurst(x, y, [255, 255, 255], 40);
            
            // Golden fountain cascade
            particleSystem.emitFountain(x, y, [255, 215, 0], 30, 5);
            
            // Delayed golden spiral
            setTimeout(() => {
                particleSystem.emitSpiral(x, y, [255, 215, 0], 24);
            }, 200);
            
            // Create lingering sparkle field
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const sparkleX = x + random(-40, 40);
                    const sparkleY = y + random(-40, 40);
                    particleSystem.emit(sparkleX, sparkleY, [255, 255, 100], 1, 'joy');
                }, i * 50);
            }
            
            // Special effects event for UI/sound
            eventBus.emit('golden:spawned', {
                x: x,
                y: y
            });
        }, trailDuration);
    }
    
    // Draw base glow on main canvas (ring, spiral, ambient glow — below entities)
    drawBaseGlow() {
        const baseGlow = 0.25 + (this.glowIntensity / this.maxGlowIntensity) * 0.3;
        const glowRatio = Math.max(baseGlow, this.glowIntensity / this.maxGlowIntensity);
        const pulseval = sin(this.pulseTimer) * 0.15 + 0.85;
        const progress = this.glowIntensity / this.spawnThreshold;
        const progressPercent = Math.round(Math.min(progress * 100, 100));

        // Progress ring
        push();
        translate(5, 10);
        strokeWeight(8);
        stroke(255, 255, 255, 60);
        noFill();
        ellipse(0, 0, 114.4, 57.2);

        if (progress > 0) {
            strokeWeight(7);
            const r = lerp(150, 255, Math.min(progress, 1));
            const g = lerp(100, 230, Math.min(progress, 1));
            const b = lerp(255, 50, Math.min(progress, 1));
            stroke(r, g, b, 220 + pulseval * 35);
            const ang = map(Math.min(progress, 1), 0, 1, 0, TWO_PI);
            arc(0, 0, 114.4, 57.2, -HALF_PI, -HALF_PI + ang);
        }
        pop();

        // Percentage text - keep it anchored to the pool center so flowers do not crowd it
        push();
        translate(0, 8);
        textAlign(CENTER, CENTER);
        stroke(255, 255, 255, 90);
        strokeWeight(1);
        fill(22, 18, 32, 158);
        ellipse(0, 0, 42, 22);
        noStroke();
        fill(255, 248, 228, 72);
        ellipse(0, -2, 28, 8);
        textSize(11);
        fill(255, 255, 255, 250);
        stroke(0, 0, 0, 170);
        strokeWeight(0.9);
        text(`${progressPercent}%`, 0, 0);
        pop();

        // Spiral vortex — draw to main canvas (offset down to align with pool color)
        push();
        translate(0, 6);
        this.drawSpiralVortex_main(glowRatio, pulseval, 0, null);
        this.drawSpiralVortex_main(glowRatio, pulseval, 0.2 * 60 * this.pulseSpeed, 'cyan');
        pop();

        // Ambient glow layers
        const numLayers = 5 + Math.floor(glowRatio * 3);
        noStroke();
        for (let i = numLayers; i > 0; i--) {
            const layerSize = (35 + glowRatio * 60) * (i / numLayers) * pulseval;
            const layerAlpha = (baseGlow * 50 + glowRatio * 100) / (i * 0.7);
            fill(
                200 + glowRatio * 55,
                120 + glowRatio * 100,
                255 - glowRatio * 150,
                Math.min(layerAlpha, 150)
            );
            ellipse(0, 0, layerSize, layerSize * 0.7);
        }

        // Inner core
        if (this.glowIntensity > 0) {
            const coreSize = 15 + glowRatio * 20;
            fill(255, 255, 255, glowRatio * 60);
            ellipse(0, 0, coreSize, coreSize * 0.7);
        }
    }

    // Bold Archimedean spiral vortex on main canvas
    drawSpiralVortex_main(glowRatio, pulse, timeOffset = 0, colorMode = null) {
        const numArms = 5;
        const t = this.pulseTimer * 0.6 - timeOffset;
        const maxRadius = 55 + glowRatio * 20;
        const dotsPerArm = 40;

        // Archimedean spiral: r = a + b * theta (uniform ring spacing)
        const a = 3;
        const b = 2.2;

        push();
        noStroke();
        for (let arm = 0; arm < numArms; arm++) {
            const armOffset = (TWO_PI / numArms) * arm;

            for (let j = 0; j < dotsPerArm; j++) {
                const progress = j / dotsPerArm;
                const theta = progress * TWO_PI * 3 + armOffset + t;
                const r = a + b * (progress * TWO_PI * 3);

                if (r > maxRadius) continue;

                const px = cos(theta) * r;
                const py = sin(theta) * r * 0.5;

                const baseAlpha = 40 + glowRatio * 80;
                const dotAlpha = (1 - progress * 0.7) * baseAlpha * pulse;

                let dotR, dotG, dotB;
                if (colorMode === 'cyan') {
                    dotR = lerp(255, 0, progress);
                    dotG = lerp(255, 220 + glowRatio * 35, progress);
                    dotB = lerp(255, 255, progress);
                } else {
                    dotR = lerp(255, 200 + glowRatio * 55, progress);
                    dotG = lerp(255, 120 + glowRatio * 100, progress);
                    dotB = lerp(255, 255 - glowRatio * 150, progress);
                }

                const dotSize = (1 - progress * 0.5) * 5 * pulse;
                fill(dotR, dotG, dotB, dotAlpha);
                ellipse(px, py, dotSize, dotSize * 0.7);
            }
        }
        pop();
    }
}

// Create global instance
const mainColorPool = new MainColorPool();
