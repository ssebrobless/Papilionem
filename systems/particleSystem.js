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
        this.reset(x, y, color, type);
    }
    
    // Reset method for object pooling - reinitializes all properties
    reset(x, y, color, type = 'scale') {
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
        
        // Pool management flag
        this.active = true;
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
        return this.lifetime <= 0 || !this.active;
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
    
    // Get rendering data for batched drawing
    getRenderData() {
        let alpha;
        if (this.type === 'joy') {
            alpha = map(this.lifetime, 0, 255, 0, 255) * 0.9;
        } else {
            alpha = 240;
        }
        
        return {
            x: this.x + this.size/2,
            y: this.y + this.size/2,
            size: this.size,
            color: this.color,
            alpha: alpha,
            type: this.type
        };
    }
}

/**
 * Optimized particle renderer that batches particles by color and type to reduce state changes
 */
class ParticleBatchRenderer {
    constructor() {
        // Pre-calculated diamond vertices for different sizes
        this.diamondCache = new Map();
        this.maxCacheSize = 10; // Limit cache size for common particle sizes
    }
    
    // Pre-calculate diamond vertices for a given size
    getDiamondVertices(size) {
        if (this.diamondCache.has(size)) {
            return this.diamondCache.get(size);
        }
        
        // Calculate diamond vertices (rotated square)
        const halfSize = size / 2;
        const vertices = [
            { x: 0, y: -halfSize },      // Top
            { x: halfSize, y: 0 },       // Right
            { x: 0, y: halfSize },       // Bottom
            { x: -halfSize, y: 0 }       // Left
        ];
        
        // Cache the vertices if we haven't exceeded cache size
        if (this.diamondCache.size < this.maxCacheSize) {
            this.diamondCache.set(size, vertices);
        }
        
        return vertices;
    }
    
    // Create a render key for batching particles with similar properties
    createRenderKey(renderData) {
        const [r, g, b] = renderData.color;
        const alpha = Math.floor(renderData.alpha);
        return `${r}-${g}-${b}-${alpha}-${renderData.size}-${renderData.type}`;
    }
    
    // Group particles by render properties for batching
    groupParticlesByRenderKey(particles) {
        const groups = new Map();
        
        for (const particle of particles) {
            const renderData = particle.getRenderData();
            const key = this.createRenderKey(renderData);
            
            if (!groups.has(key)) {
                groups.set(key, {
                    renderData: renderData,
                    positions: []
                });
            }
            
            groups.get(key).positions.push({
                x: renderData.x,
                y: renderData.y
            });
        }
        
        return groups;
    }
    
    // Draw a batch of particles with the same properties
    drawParticleBatch(graphics, batchData) {
        const { renderData, positions } = batchData;
        const { color, alpha, size } = renderData;
        
        // Set fill color once for the entire batch
        graphics.noStroke();
        graphics.fill(color[0], color[1], color[2], alpha);
        
        // Get pre-calculated diamond vertices
        const vertices = this.getDiamondVertices(size);
        
        // Draw all particles in this batch
        graphics.beginShape(TRIANGLES);
        for (const pos of positions) {
            // Create two triangles to form the diamond
            // Triangle 1: Top-Right-Bottom
            graphics.vertex(pos.x + vertices[0].x, pos.y + vertices[0].y); // Top
            graphics.vertex(pos.x + vertices[1].x, pos.y + vertices[1].y); // Right
            graphics.vertex(pos.x + vertices[2].x, pos.y + vertices[2].y); // Bottom
            
            // Triangle 2: Top-Bottom-Left
            graphics.vertex(pos.x + vertices[0].x, pos.y + vertices[0].y); // Top
            graphics.vertex(pos.x + vertices[2].x, pos.y + vertices[2].y); // Bottom
            graphics.vertex(pos.x + vertices[3].x, pos.y + vertices[3].y); // Left
        }
        graphics.endShape();
    }
    
    // Main batched rendering method
    drawParticlesBatched(graphics, particles) {
        if (particles.length === 0) return;
        
        // Group particles by render properties
        const batches = this.groupParticlesByRenderKey(particles);
        
        // Draw each batch
        for (const batch of batches.values()) {
            this.drawParticleBatch(graphics, batch);
        }
    }
    
    // Fallback to individual rendering for debugging or compatibility
    drawParticlesIndividual(graphics, particles) {
        for (const particle of particles) {
            particle.draw(graphics);
        }
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
        
        // Use batched rendering for accumulated pixels
        this.drawPixelsBatched(graphics);
        
        // Draw pulsing ring when ready
        if (this.isPulsing) {
            graphics.noFill();
            graphics.stroke(255, 255, 255, 100 * abs(sin(this.pulseTimer)));
            graphics.strokeWeight(2);
            graphics.ellipse(0, 0, this.radius * 2);
        }
        
        graphics.pop();
    }
    
    // Optimized batched rendering for accumulated pixels
    drawPixelsBatched(graphics) {
        if (this.pixels.length === 0) return;
        
        // Group pixels by color for batching
        const colorGroups = new Map();
        const pixelSize = gameConfig.particles.pixelSize;
        
        for (const pixel of this.pixels) {
            const colorKey = `${pixel.color[0]}-${pixel.color[1]}-${pixel.color[2]}`;
            
            if (!colorGroups.has(colorKey)) {
                colorGroups.set(colorKey, {
                    color: pixel.color,
                    positions: [],
                    highlights: []
                });
            }
            
            const group = colorGroups.get(colorKey);
            const pos = {
                x: pixel.x - this.radius + pixelSize/2,
                y: pixel.y - this.radius + pixelSize/2
            };
            
            group.positions.push(pos);
            
            // Add highlight positions (30% chance)
            if (random() < 0.3) {
                group.highlights.push(pos);
            }
        }
        
        // Pre-calculate diamond vertices
        const halfSize = pixelSize / 2;
        const vertices = [
            { x: 0, y: -halfSize },      // Top
            { x: halfSize, y: 0 },       // Right
            { x: 0, y: halfSize },       // Bottom
            { x: -halfSize, y: 0 }       // Left
        ];
        
        graphics.noStroke();
        
        // Draw each color group as a batch
        for (const group of colorGroups.values()) {
            // Draw main pixels
            graphics.fill(group.color[0], group.color[1], group.color[2], 255);
            graphics.beginShape(TRIANGLES);
            
            for (const pos of group.positions) {
                // Create two triangles to form the diamond
                graphics.vertex(pos.x + vertices[0].x, pos.y + vertices[0].y); // Top
                graphics.vertex(pos.x + vertices[1].x, pos.y + vertices[1].y); // Right
                graphics.vertex(pos.x + vertices[2].x, pos.y + vertices[2].y); // Bottom
                
                graphics.vertex(pos.x + vertices[0].x, pos.y + vertices[0].y); // Top
                graphics.vertex(pos.x + vertices[2].x, pos.y + vertices[2].y); // Bottom
                graphics.vertex(pos.x + vertices[3].x, pos.y + vertices[3].y); // Left
            }
            graphics.endShape();
            
            // Draw highlights as a separate batch
            if (group.highlights.length > 0) {
                graphics.fill(255, 255, 255, 100);
                graphics.beginShape(TRIANGLES);
                
                for (const pos of group.highlights) {
                    const highlightSize = 0.5;
                    graphics.vertex(pos.x, pos.y - highlightSize);
                    graphics.vertex(pos.x + highlightSize, pos.y);
                    graphics.vertex(pos.x, pos.y + highlightSize);
                    
                    graphics.vertex(pos.x, pos.y - highlightSize);
                    graphics.vertex(pos.x, pos.y + highlightSize);
                    graphics.vertex(pos.x - highlightSize, pos.y);
                }
                graphics.endShape();
            }
        }
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
 * Advanced particle object pool that eliminates object creation/destruction overhead
 * Pre-allocates a fixed number of Pixel objects and reuses them throughout the game
 */
class ParticlePool {
    constructor(maxSize = 200) {
        this.maxSize = maxSize;
        this.pool = [];
        this.activeParticles = [];
        this.inactiveIndices = [];
        
        // Pre-allocate all particles
        this.initializePool();
        
        // Performance tracking
        this.stats = {
            totalAllocated: maxSize,
            activeCount: 0,
            inactiveCount: maxSize,
            peakUsage: 0,
            reuseCount: 0
        };
    }
    
    initializePool() {
        // Pre-allocate maximum number of Pixel objects
        for (let i = 0; i < this.maxSize; i++) {
            // Create pixels with dummy values - they'll be reset when retrieved
            const pixel = new Pixel(0, 0, [255, 255, 255], 'scale');
            pixel.active = false; // Mark as inactive initially
            this.pool.push(pixel);
            this.inactiveIndices.push(i);
        }
        
        console.log(`🎯 ParticlePool initialized with ${this.maxSize} pre-allocated particles`);
    }
    
    getParticle(x, y, color, type = 'scale') {
        // Check if we have any inactive particles available
        if (this.inactiveIndices.length === 0) {
            console.warn(`⚠️ ParticlePool exhausted! ${this.maxSize} particles already active`);
            return null; // Pool exhausted
        }
        
        // Get an inactive particle from the pool
        const index = this.inactiveIndices.pop();
        const particle = this.pool[index];
        
        // Reset the particle with new parameters
        particle.reset(x, y, color, type);
        particle.active = true;
        
        // Add to active particles tracking
        this.activeParticles.push(particle);
        
        // Update stats
        this.stats.activeCount++;
        this.stats.inactiveCount--;
        this.stats.reuseCount++;
        this.stats.peakUsage = Math.max(this.stats.peakUsage, this.stats.activeCount);
        
        return particle;
    }
    
    releaseParticle(particle) {
        if (!particle || !particle.active) {
            return false; // Particle already inactive or invalid
        }
        
        // Find the particle in our pool
        const poolIndex = this.pool.indexOf(particle);
        if (poolIndex === -1) {
            console.warn('⚠️ Attempted to release particle not from this pool');
            return false;
        }
        
        // Mark as inactive
        particle.active = false;
        
        // Remove from active particles
        const activeIndex = this.activeParticles.indexOf(particle);
        if (activeIndex !== -1) {
            this.activeParticles.splice(activeIndex, 1);
        }
        
        // Add back to inactive indices
        this.inactiveIndices.push(poolIndex);
        
        // Update stats
        this.stats.activeCount--;
        this.stats.inactiveCount++;
        
        return true;
    }
    
    getActiveParticles() {
        // Return array of active particles only
        return this.activeParticles.slice(); // Return copy to prevent external modification
    }
    
    updateActiveParticles() {
        // Optimized update loop - only process active particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            if (!particle.active) {
                // Particle was marked inactive, remove from active list
                this.activeParticles.splice(i, 1);
                continue;
            }
            
            particle.update();
            
            // Check if particle died during update
            if (particle.isDead()) {
                this.releaseParticle(particle);
            }
        }
    }
    
    clear() {
        // Release all active particles back to the pool
        while (this.activeParticles.length > 0) {
            this.releaseParticle(this.activeParticles[0]);
        }
    }
    
    getStats() {
        return {
            ...this.stats,
            poolUtilization: (this.stats.activeCount / this.maxSize) * 100,
            memoryEfficiency: (this.stats.reuseCount / Math.max(this.stats.peakUsage, 1)) * 100
        };
    }
    
    // Get particles matching a predicate (for compatibility with existing code)
    getParticlesWhere(predicate) {
        return this.activeParticles.filter(predicate);
    }
    
    // Remove particles matching a predicate (for compatibility with existing code)
    removeParticlesWhere(predicate) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            if (predicate(particle)) {
                this.releaseParticle(particle);
            }
        }
    }
}

/**
 * Main particle system that manages all particles and their lifecycle
 */
class ParticleSystem {
    constructor() {
        // Initialize particle pool based on gameConfig with headroom for bursts
        const poolSize = Math.max(gameConfig.particles.maxParticles * 2, 200);
        this.particlePool = new ParticlePool(poolSize);
        
        // Legacy compatibility - this.particles now points to active particles
        this.particles = this.particlePool.activeParticles;
        
        // Use unified config system - no drift-prone fallbacks
        this.maxParticles = gameConfig.particles.maxParticles;
        
        // Initialize batched renderer
        this.batchRenderer = new ParticleBatchRenderer();
        
        // Performance tracking
        this.useBatchedRendering = true; // Can be toggled for debugging
        
        // Pre-allocated color arrays for common particle effects
        this.whiteColor = [255, 255, 255];
        this.isometricAngles = [PI/4, 3*PI/4, 5*PI/4, 7*PI/4]; // Pre-calculated diagonal directions
        this.renderStats = {
            lastBatchCount: 0,
            lastParticleCount: 0,
            renderTime: 0
        };
        
        console.log(`🎮 ParticleSystem initialized with pool size: ${poolSize}, active limit: ${this.maxParticles}`);
    }
    
    emit(x, y, color, count = 1, type = 'scale') {
        let lastPixel = null;
        let actualCount = 0;
        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                const offsetX = random(-5, 5);
                const offsetY = random(-5, 5);
                const pixel = this.particlePool.getParticle(x + offsetX, y + offsetY, color, type);
                if (pixel) {
                    lastPixel = pixel;
                    actualCount++;
                }
            }
        }
        
        
        // Emit spawning event
        if (typeof eventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
            eventBus.emit(GameEvents.PIXELS_SPAWNED, { 
                count: actualCount, 
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
                // Emit particles in isometric pattern using pre-allocated angles
                const baseAngle = random(this.isometricAngles);
                const angle = baseAngle + random(-0.3, 0.3);
                const speed = random(1.5, 3);
                const pixel = this.particlePool.getParticle(x, y, color, 'joy');
                if (pixel) {
                    pixel.vx = cos(angle) * speed;
                    pixel.vy = sin(angle) * speed - 0.5;
                    pixel.size = gameConfig.particles.pixelSize; // Keep consistent size
                }
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
                const pixel = this.particlePool.getParticle(x + random(-2, 2), y, color, 'joy');
                if (pixel) {
                    pixel.vx = cos(angle) * speed;
                    pixel.vy = -sin(angle) * speed; // Negative for upward
                    pixel.lifetime = 300 + random(100); // Longer lifetime
                    pixel.size = gameConfig.particles.pixelSize * random(0.8, 1.2);
                }
            }
        }
    }
    
    // Emit a spiral of particles
    emitSpiral(x, y, color, count = 16) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                const angle = (TWO_PI / count) * i;
                const speed = 2;
                const pixel = this.particlePool.getParticle(x, y, color, 'joy');
                if (pixel) {
                    pixel.vx = cos(angle) * speed;
                    pixel.vy = sin(angle) * speed;
                    pixel.orbitAngle = angle;
                    pixel.orbitSpeed = 0.1;
                    pixel.lifetime = 200;
                }
            }
        }
    }
    
    update() {
        // Use the particle pool's optimized update method
        this.particlePool.updateActiveParticles();
    }
    
    getSettledPixels() {
        return this.particles.filter(p => p.settled && p.type === 'scale');
    }
    
    
    removePixels(predicate) {
        this.particlePool.removeParticlesWhere(predicate);
    }
    
    draw(graphics) {
        if (this.particles.length === 0) return;
        
        const startTime = performance.now();
        
        if (this.useBatchedRendering) {
            // Use optimized batched rendering
            this.batchRenderer.drawParticlesBatched(graphics, this.particles);
            
            // Update stats for debugging
            const batches = this.batchRenderer.groupParticlesByRenderKey(this.particles);
            this.renderStats.lastBatchCount = batches.size;
        } else {
            // Fall back to individual rendering for debugging
            this.batchRenderer.drawParticlesIndividual(graphics, this.particles);
            this.renderStats.lastBatchCount = this.particles.length; // Each particle is its own "batch"
        }
        
        // Track performance
        this.renderStats.renderTime = performance.now() - startTime;
        this.renderStats.lastParticleCount = this.particles.length;
    }
    
    // Toggle between batched and individual rendering for debugging
    setBatchedRendering(enabled) {
        this.useBatchedRendering = enabled;
    }
    
    // Get rendering performance stats
    getRenderStats() {
        return {
            ...this.renderStats,
            particleCount: this.particles.length,
            batchingEnabled: this.useBatchedRendering,
            averageParticlesPerBatch: this.renderStats.lastBatchCount > 0 ? 
                this.renderStats.lastParticleCount / this.renderStats.lastBatchCount : 0
        };
    }
    
    clear() {
        this.particlePool.clear();
    }
    
    // Debug information
    getParticleCount() {
        return this.particles.length;
    }
    
    getParticlesByType(type) {
        return this.particles.filter(p => p.type === type);
    }
    
    // Get particle pool statistics for performance monitoring
    getPoolStats() {
        return this.particlePool.getStats();
    }
    
    // Get comprehensive performance data including both rendering and pooling stats
    getPerformanceStats() {
        const poolStats = this.getPoolStats();
        const renderStats = this.getRenderStats();
        
        return {
            pool: poolStats,
            rendering: renderStats,
            memoryEfficiency: {
                objectsCreated: poolStats.totalAllocated,
                objectsReused: poolStats.reuseCount,
                reuseRatio: poolStats.reuseCount / Math.max(poolStats.peakUsage, 1),
                poolUtilization: poolStats.poolUtilization
            },
            performance: {
                avgParticlesPerBatch: renderStats.averageParticlesPerBatch,
                lastRenderTime: renderStats.renderTime,
                batchingEnabled: renderStats.batchingEnabled
            }
        };
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
                
                // Mark as encountered
                if (typeof gameCore !== 'undefined' && gameCore.gameState) {
                    gameCore.gameState.encounteredButterflies.add(newButterfly.personalityType);
                }
                
                // Create spawn effect using pre-allocated white color
                particleSystem.emitBurst(spawn.x, spawn.y, particleSystem.whiteColor, 12);
                
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
    window.ParticlePool = ParticlePool;
    window.ParticleBatchRenderer = ParticleBatchRenderer;
    window.ColorPool = ColorPool;
    window.ParticleSystem = ParticleSystem;
    window.PoolManager = PoolManager;
}