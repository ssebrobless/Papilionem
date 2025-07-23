// Particle System - Manages individual particles and color pool accumulation
// Handles physics, lifecycle, and pooling of pixel particles in the garden ecosystem

// Import dependencies (assumes global availability)
// Requires: config, gridManager, eventBus, GameEvents

// safeGetConfig removed - use unified gameConfig to prevent drift

/**
 * Individual pixel particle with physics and lifecycle
 */
class Pixel {
    constructor(x, y, color, type = 'scale') {
        this.x = x;
        this.y = y;
        
        // Store initial position to calculate target ground position
        this.startX = x;
        this.startY = y;
        
        // Find the isometric ground position beneath this particle
        this.calculateGroundTarget();
        
        // Isometric physics - particles drift naturally towards ground with scatter
        this.initializeIsometricVelocity(type);
        
        this.color = color;
        this.type = type;
        this.lifetime = this.getInitialLifetime();
        this.settled = false;
        // Use unified config - no drift-prone fallbacks
        this.bounce = gameConfig.particles.bounce;
        this.friction = gameConfig.particles.friction;
        this.size = gameConfig.particles.pixelSize * 1.5; // Larger pixels for visibility
        
        // Pop-out effect for happy pixels
        this.popOutDuration = 0;
        this.popOutTimer = 0;
        
        // Spiral physics for magnetic attraction
        this.orbitAngle = random(TWO_PI);
        this.orbitSpeed = 0;
        this.spiralRadius = 0;
    }
    
    calculateGroundTarget() {
        // Use unified physics engine for ground targeting
        const target = isometricPhysics.calculateGroundTarget(this.startX, this.startY, 0.3);
        this.targetGroundX = target.x;
        this.targetGroundY = target.y;
    }
    
    initializeIsometricVelocity(type) {
        if (type === 'joy' || type === 'happy' || type === 'happy_visual') {
            // Use unified physics for burst velocity (dynamic movement for joy and happiness particles)
            const intensity = type === 'happy_visual' ? 0.8 : 1.0; // Visual particles slightly less intense
            const velocity = isometricPhysics.calculateBurstVelocity(-2, -0.5, intensity);
            this.vx = velocity.vx;
            this.vy = velocity.vy;
        } else {
            // Use unified physics for target-directed velocity (scale, pollen, stress particles)
            const velocity = isometricPhysics.calculateTargetVelocity(
                this.x, this.y, 
                this.targetGroundX, this.targetGroundY, 
                random(0.3, 0.8), 0.4
            );
            this.vx = velocity.vx;
            this.vy = velocity.vy;
        }
    }
    
    getInitialLifetime() {
        // Use unified config system - no legacy fallbacks
        const typeConfig = gameConfig.particles.types[this.type];
        return typeConfig ? typeConfig.lifetime : 255;
    }
    
    update() {
        // Handle pop-out animation phase for happy pixels
        if (this.popOutDuration > 0 && this.popOutTimer < this.popOutDuration) {
            this.popOutTimer++;
            // During pop-out, only apply friction, no gravity or attraction
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;
            // Don't do normal physics during pop-out
            return;
        }
        
        if (!this.settled) {
            this.updatePhysics();
            this.checkGroundCollision();
            this.checkWallCollisions();
        }
        
        this.updateLifetime();
    }
    
    updatePhysics() {
        // Happy particles skip ground physics - only subject to pool attraction
        if (this.type === 'happy' || this.type === 'happy_visual') {
            // Only apply friction and basic physics for happy particles
            // Pool attraction will be applied separately by mainColorPool
            isometricPhysics.applyFriction(this);
            this.x += this.vx;
            this.y += this.vy;
            return;
        }
        
        // All other particles use unified physics engine for ground movement  
        if (!this.settled && this.targetGroundX !== undefined && this.targetGroundY !== undefined) {
            // Apply attraction force towards ground target
            isometricPhysics.applyAttractionForce(this, this.targetGroundX, this.targetGroundY, 0.1, 0.3);
        } else {
            // Apply standard gravity
            isometricPhysics.applyGravity(this);
        }
        
        // Add natural drift
        isometricPhysics.addIsometricDrift(this, 0.01, 0.3);
        
        // Apply friction and update position
        isometricPhysics.applyFriction(this);
        this.x += this.vx;
        this.y += this.vy;
    }
    
    checkGroundCollision() {
        // Particles should land at their pre-calculated target ground position
        // This ensures proper isometric perspective throughout the fall
        if (this.targetGroundY !== undefined) {
            // Check if particle has reached its target ground level
            if (this.y + this.size >= this.targetGroundY) {
                // Snap to target ground position for clean landing
                this.y = this.targetGroundY - this.size;
                
                // Handle bounce physics
                if (Math.abs(this.vy) > 0.15) {
                    this.vy *= -this.bounce;
                    this.vx += random(-0.3, 0.3); // Add scatter on bounce
                } else {
                    // Particle has settled
                    this.settled = true;
                    this.vx = 0;
                    this.vy = 0;
                    // Final position uses pre-calculated target X with small random offset
                    this.x = this.targetGroundX + random(-2, 2);
                    this.onSettled();
                }
            }
        } else {
            // Fallback for particles without target (shouldn't happen)
            const canvasHeight = gameConfig.canvas.baseHeight;
            if (this.y + this.size >= canvasHeight) {
                this.y = canvasHeight - this.size;
                this.settled = true;
                this.vx = 0;
                this.vy = 0;
                this.onSettled();
            }
        }
    }
    
    checkWallCollisions() {
        // Use unified config - no hardcoded fallbacks
        const canvasWidth = gameConfig.canvas.baseWidth;
        if (this.x <= 0 || this.x + this.size >= canvasWidth) {
            this.vx *= -this.bounce;
            this.x = constrain(this.x, 0, canvasWidth - this.size);
        }
    }
    
    updateLifetime() {
        // Use unified config system - no drift-prone fallbacks
        const typeConfig = gameConfig.particles.types[this.type];
        const fadeSpeed = typeConfig ? typeConfig.fadeSpeed : 0;
        if (fadeSpeed > 0 && this.lifetime > 0) {
            this.lifetime -= fadeSpeed;
        }
    }
    
    onSettled() {
        // Emit event when pixel settles
        if (typeof eventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
            eventBus.emit(GameEvents.PIXELS_SETTLED, { 
                pixel: this,
                position: { x: this.x, y: this.y }
            });
        }
    }
    
    isDead() {
        return this.lifetime <= 0;
    }
    
    distanceTo(x, y) {
        return dist(this.x + this.size/2, this.y + this.size/2, x, y);
    }
    
    draw(graphics) {
        graphics.noStroke();
        
        if (this.type === 'joy') {
            const alpha = map(this.lifetime, 0, 255, 0, 255);
            const [r, g, b] = this.color;
            graphics.fill(r, g, b, alpha * 0.9);
        } else {
            graphics.fill(this.color[0], this.color[1], this.color[2], 240);
        }
        
        // Draw particles as diamonds to match isometric aesthetic
        graphics.push();
        graphics.translate(this.x + this.size/2, this.y + this.size/2);
        graphics.rotate(PI/4);
        graphics.rect(-this.size/2, -this.size/2, this.size, this.size);
        graphics.pop();
    }
}

/**
 * Color pool that accumulates settled pixels and can spawn new butterflies
 */
class ColorPool {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.pixels = [];
        // Use unified config system - no drift-prone fallbacks
        this.radius = gameConfig.colorPools.radius;
        this.pulseTimer = 0;
        this.isPulsing = false;
        this.spawnTimer = 0;
        this.color = [0, 0, 0];
        this.id = Date.now() + random(1000);
        
        // Emit creation event
        if (typeof eventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
            eventBus.emit(GameEvents.POOL_CREATED, { pool: this });
        }
    }
    
    addPixel(pixel) {
        this.pixels.push({
            color: pixel.color,
            x: pixel.x - this.x + this.radius,
            y: pixel.y - this.y + this.radius
        });
        
        this.updateAverageColor();
        
        const requiredPixels = gameConfig.colorPools.requiredPixels;
        if (this.pixels.length >= requiredPixels && !this.isPulsing) {
            this.isPulsing = true;
            if (typeof eventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
                eventBus.emit(GameEvents.POOL_READY, { pool: this });
            }
        }
    }
    
    updateAverageColor() {
        if (this.pixels.length === 0) return;
        
        let r = 0, g = 0, b = 0;
        for (let pixel of this.pixels) {
            r += pixel.color[0];
            g += pixel.color[1];
            b += pixel.color[2];
        }
        
        this.color = [
            r / this.pixels.length,
            g / this.pixels.length,
            b / this.pixels.length
        ];
    }
    
    update() {
        if (this.isPulsing) {
            this.pulseTimer += gameConfig.colorPools.pulseSpeed;
            this.spawnTimer++;
            
            const spawnDelay = gameConfig.colorPools.spawnDelay;
            if (this.spawnTimer > spawnDelay) {
                return 'spawn';
            }
        }
        
        return null;
    }
    
    draw(graphics) {
        graphics.push();
        graphics.translate(this.x, this.y);
        
        if (this.isPulsing) {
            const pulseScale = 1 + sin(this.pulseTimer) * 0.1;
            graphics.scale(pulseScale);
        }
        
        // Draw accumulated pixels as diamonds
        for (let pixel of this.pixels) {
            graphics.noStroke();
            graphics.push();
            graphics.translate(
                pixel.x - this.radius + gameConfig.particles.pixelSize/2, 
                pixel.y - this.radius + gameConfig.particles.pixelSize/2
            );
            graphics.rotate(PI/4);
            graphics.fill(pixel.color[0], pixel.color[1], pixel.color[2], 255);
            const pixelSize = gameConfig.particles.pixelSize;
            graphics.rect(-pixelSize/2, -pixelSize/2, pixelSize, pixelSize);
            graphics.pop();
            
            // Add subtle highlight to some pixels (also as diamonds)
            if (random() < 0.3) {
                graphics.push();
                graphics.translate(
                    pixel.x - this.radius + gameConfig.particles.pixelSize/2, 
                    pixel.y - this.radius + gameConfig.particles.pixelSize/2
                );
                graphics.rotate(PI/4);
                graphics.fill(255, 255, 255, 100);
                graphics.rect(-0.5, -0.5, 1, 1);
                graphics.pop();
            }
        }
        
        // Draw pulsing ring when ready
        if (this.isPulsing) {
            graphics.noFill();
            graphics.stroke(255, 255, 255, 100 * abs(sin(this.pulseTimer)));
            graphics.strokeWeight(2);
            graphics.ellipse(0, 0, this.radius * 2);
        }
        
        graphics.pop();
    }
    
    getSpawnPosition() {
        return {
            x: this.x,
            y: this.y,
            colors: this.getMixedColors()
        };
    }
    
    getMixedColors() {
        const baseColor = this.color;
        const variation = 30;
        
        return [
            [
                constrain(baseColor[0] + random(-variation, variation), 0, 255),
                constrain(baseColor[1] + random(-variation, variation), 0, 255),
                constrain(baseColor[2] + random(-variation, variation), 0, 255)
            ],
            [
                constrain(baseColor[0] + random(-variation, variation), 0, 255),
                constrain(baseColor[1] + random(-variation, variation), 0, 255),
                constrain(baseColor[2] + random(-variation, variation), 0, 255)
            ]
        ];
    }
    
    consumeForSpawn() {
        const requiredPixels = gameConfig.colorPools.requiredPixels;
        const consumed = this.pixels.splice(0, requiredPixels);
        this.updateAverageColor();
        
        if (this.pixels.length < requiredPixels) {
            this.isPulsing = false;
            this.pulseTimer = 0;
            this.spawnTimer = 0;
        }
        
        return consumed.length > 0;
    }
    
    isEmpty() {
        return this.pixels.length === 0;
    }
}

/**
 * Main particle system that manages all particles and their lifecycle
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        // Use unified config system - no drift-prone fallbacks
        this.maxParticles = gameConfig.particles.maxParticles;
    }
    
    emit(x, y, color, count = 1, type = 'scale') {
        let lastPixel = null;
        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                const offsetX = random(-5, 5);
                const offsetY = random(-5, 5);
                const pixel = new Pixel(x + offsetX, y + offsetY, color, type);
                this.particles.push(pixel);
                lastPixel = pixel;
            }
        }
        
        // Emit spawning event
        if (typeof eventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
            eventBus.emit(GameEvents.PIXELS_SPAWNED, { 
                count, 
                type, 
                position: { x, y }, 
                color 
            });
        }
        
        // Return the last created pixel for single emissions
        return count === 1 ? lastPixel : null;
    }
    
    emitBurst(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                // Emit particles in isometric pattern
                const isoAngles = [PI/4, 3*PI/4, 5*PI/4, 7*PI/4]; // Diagonal directions
                const baseAngle = random(isoAngles);
                const angle = baseAngle + random(-0.3, 0.3);
                const speed = random(1.5, 3);
                const pixel = new Pixel(x, y, color, 'joy');
                pixel.vx = cos(angle) * speed;
                pixel.vy = sin(angle) * speed - 0.5;
                pixel.size = gameConfig.particles.pixelSize; // Keep consistent size
                this.particles.push(pixel);
            }
        }
        
        // Emit burst event
        if (typeof eventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
            eventBus.emit(GameEvents.PIXELS_SPAWNED, { 
                count, 
                type: 'burst', 
                position: { x, y }, 
                color 
            });
        }
    }
    
    // Emit a fountain of particles
    emitFountain(x, y, color, count = 20, height = 3) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                const angle = random(PI * 0.3, PI * 0.7); // Upward arc
                const speed = random(2, 4) * height / 3;
                const pixel = new Pixel(x + random(-2, 2), y, color, 'joy');
                pixel.vx = cos(angle) * speed;
                pixel.vy = -sin(angle) * speed; // Negative for upward
                pixel.lifetime = 300 + random(100); // Longer lifetime
                pixel.size = gameConfig.particles.pixelSize * random(0.8, 1.2);
                this.particles.push(pixel);
            }
        }
    }
    
    // Emit a spiral of particles
    emitSpiral(x, y, color, count = 16) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                const angle = (TWO_PI / count) * i;
                const speed = 2;
                const pixel = new Pixel(x, y, color, 'joy');
                pixel.vx = cos(angle) * speed;
                pixel.vy = sin(angle) * speed;
                pixel.orbitAngle = angle;
                pixel.orbitSpeed = 0.1;
                pixel.lifetime = 200;
                this.particles.push(pixel);
            }
        }
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    getSettledPixels() {
        return this.particles.filter(p => p.settled && p.type === 'scale');
    }
    
    getPollenCount() {
        return this.particles.filter(p => p.type === 'pollen' && !p.settled).length;
    }
    
    removePixels(predicate) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (predicate(this.particles[i])) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw(graphics) {
        for (let particle of this.particles) {
            particle.draw(graphics);
        }
    }
    
    clear() {
        this.particles = [];
    }
    
    // Debug information
    getParticleCount() {
        return this.particles.length;
    }
    
    getParticlesByType(type) {
        return this.particles.filter(p => p.type === type);
    }
}

/**
 * Pool manager that handles color pool creation, management, and spawning
 */
class PoolManager {
    constructor() {
        this.pools = new Map();
        // Use unified config - no fallbacks to prevent drift
        this.gridSize = gameConfig.colorPools.gridSize;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for settled pixels to potentially add to pools
        if (typeof eventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
            eventBus.on(GameEvents.PIXELS_SETTLED, (data) => {
                const { pixel } = data;
                if (pixel.type === 'scale') {
                    this.addPixelToPool(pixel);
                }
            });
        }
    }
    
    addPixelToPool(pixel) {
        const pool = this.findOrCreatePool(pixel.x, pixel.y);
        if (pool) {
            pool.addPixel(pixel);
        }
    }
    
    update(particleSystem, butterflies) {
        // Handle settled pixels (fallback for direct calls)
        const settledPixels = particleSystem.getSettledPixels();
        for (let pixel of settledPixels) {
            const pool = this.findOrCreatePool(pixel.x, pixel.y);
            if (pool) {
                pool.addPixel(pixel);
                const index = particleSystem.particles.indexOf(pixel);
                if (index > -1) {
                    particleSystem.particles.splice(index, 1);
                }
            }
        }
        
        // Update pools and handle spawning
        const spawnRequests = [];
        for (let [id, pool] of this.pools) {
            const result = pool.update();
            if (result === 'spawn') {
                spawnRequests.push(pool);
            }
            
            // Clean up empty pools
            if (pool.isEmpty()) {
                this.pools.delete(id);
            }
        }
        
        // Process spawn requests
        this.processSpawnRequests(spawnRequests, butterflies, particleSystem);
    }
    
    processSpawnRequests(spawnRequests, butterflies, particleSystem) {
        const maxButterflies = gameConfig.entities.maxButterflies;
        
        for (let pool of spawnRequests) {
            if (butterflies.length < maxButterflies && pool.consumeForSpawn()) {
                const spawn = pool.getSpawnPosition();
                
                // Create new butterfly - let personality determine colors
                const newButterfly = new Butterfly(spawn.x, spawn.y, null);
                butterflies.push(newButterfly);
                
                // Create spawn effect
                particleSystem.emitBurst(spawn.x, spawn.y, [255, 255, 255], 12);
                
                // Emit events
                if (typeof eventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
                    eventBus.emit(GameEvents.POOL_SPAWNING, { pool, butterfly: newButterfly });
                    eventBus.emit(GameEvents.BUTTERFLY_SPAWNED, { butterfly: newButterfly, source: 'pool' });
                }
            }
        }
    }
    
    findOrCreatePool(x, y) {
        // Check existing pools for proximity
        for (let [id, pool] of this.pools) {
            const dist = Math.hypot(pool.x - x, pool.y - y);
            if (dist < pool.radius) {
                return pool;
            }
        }
        
        // Only create pools within the isometric playable area
        let isInPlayableArea = false;
        
        if (typeof gridManager !== 'undefined' && gridManager.screenToIso) {
            const gridPos = gridManager.screenToIso(x, y);
            isInPlayableArea = gridManager.isInBounds(gridPos.x, gridPos.y);
        } else if (typeof isWithinPlayableArea !== 'undefined') {
            isInPlayableArea = isWithinPlayableArea(x, y);
        } else {
            // Fallback: assume valid if within canvas bounds
            // Use unified config - no hardcoded dimensions
            isInPlayableArea = x > 0 && x < gameConfig.canvas.baseWidth && y > 0 && y < gameConfig.canvas.baseHeight;
        }
        
        if (isInPlayableArea) {
            const gridX = Math.floor(x / this.gridSize) * this.gridSize;
            const gridY = Math.floor(y / this.gridSize) * this.gridSize;
            const newPool = new ColorPool(gridX + this.gridSize/2, gridY + this.gridSize/2);
            this.pools.set(newPool.id, newPool);
            return newPool;
        }
        
        return null;
    }
    
    draw(graphics) {
        for (let [id, pool] of this.pools) {
            pool.draw(graphics);
        }
    }
    
    // Utility methods
    getPoolCount() {
        return this.pools.size;
    }
    
    getPoolsArray() {
        return Array.from(this.pools.values());
    }
    
    getNearbyPools(x, y, radius) {
        const nearby = [];
        for (let pool of this.pools.values()) {
            const dist = Math.hypot(pool.x - x, pool.y - y);
            if (dist <= radius) {
                nearby.push({ pool, distance: dist });
            }
        }
        return nearby.sort((a, b) => a.distance - b.distance);
    }
    
    clearPools() {
        this.pools.clear();
    }
}

// Export classes for global use
if (typeof window !== 'undefined') {
    window.Pixel = Pixel;
    window.ColorPool = ColorPool;
    window.ParticleSystem = ParticleSystem;
    window.PoolManager = PoolManager;
}