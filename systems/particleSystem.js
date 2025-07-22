// Particle System - Manages individual particles and color pool accumulation
// Handles physics, lifecycle, and pooling of pixel particles in the garden ecosystem

// Import dependencies (assumes global availability)
// Requires: config, gridManager, eventBus, GameEvents

/**
 * Helper function to safely get config values with fallbacks
 */
function safeGetConfig(path, fallback) {
    if (typeof getConfig !== 'undefined') {
        return getConfig(path) || fallback;
    }
    return fallback;
}

/**
 * Individual pixel particle with physics and lifecycle
 */
class Pixel {
    constructor(x, y, color, type = 'scale') {
        this.x = x;
        this.y = y;
        
        // Isometric physics - particles drift along isometric axes
        const isoAngle = random(TWO_PI);
        const speed = random(0.2, 0.8);
        this.vx = cos(isoAngle) * speed;
        this.vy = sin(isoAngle) * speed - 0.5;
        
        this.color = color;
        this.type = type;
        this.lifetime = this.getInitialLifetime();
        this.settled = false;
        this.bounce = safeGetConfig('particles.bounce', 0.3);
        this.friction = safeGetConfig('particles.friction', 0.99);
        this.size = safeGetConfig('particles.pixelSize', 3) * 1.5; // Larger pixels for visibility
    }
    
    getInitialLifetime() {
        if (typeof getConfig !== 'undefined') {
            const typeConfig = getConfig(`particles.types.${this.type}`);
            return typeConfig ? typeConfig.lifetime : 255;
        }
        // Legacy fallbacks
        const lifetimes = { scale: -1, joy: 255, pollen: 400 };
        return lifetimes[this.type] || 255;
    }
    
    update() {
        if (!this.settled) {
            this.updatePhysics();
            this.checkGroundCollision();
            this.checkWallCollisions();
        }
        
        this.updateLifetime();
    }
    
    updatePhysics() {
        // Apply gravity along isometric Y axis (southeast direction)
        this.vy += safeGetConfig('particles.gravity', 0.1);
        
        // Add slight drift along isometric axes for more natural fall
        const isoDrift = 0.02;
        if (random() < 0.5) {
            this.vx += isoDrift * (random() < 0.5 ? 1 : -1);
        }
        
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    checkGroundCollision() {
        // Use legacy coordinate functions if gridManager is not available
        let gridPos, groundLevel, isInBounds;
        
        if (typeof gridManager !== 'undefined' && gridManager.screenToIso) {
            gridPos = gridManager.screenToIso(this.x, this.y);
            isInBounds = gridManager.isInBounds(gridPos.x, gridPos.y);
            groundLevel = isInBounds ? gridManager.getGroundY(gridPos.x, gridPos.y) : null;
        } else if (typeof screenToIso !== 'undefined') {
            // Fallback to legacy functions
            gridPos = screenToIso(this.x, this.y);
            isInBounds = gridPos.x >= 0 && gridPos.x <= 18 && gridPos.y >= 0 && gridPos.y <= 18;
            groundLevel = isInBounds ? isoToScreen(gridPos.x, gridPos.y).y : null;
        } else {
            // Fallback to canvas bounds
            isInBounds = false;
            groundLevel = null;
        }
        
        if (isInBounds && groundLevel !== null) {
            if (this.y + this.size >= groundLevel) {
                this.y = groundLevel - this.size;
                this.vy *= -this.bounce;
                
                if (abs(this.vy) < 0.1 && abs(this.vx) < 0.1) {
                    this.settled = true;
                    this.vx = 0;
                    this.vy = 0;
                    this.onSettled();
                }
            }
        } else {
            // Fallback: use canvas height
            const canvasHeight = safeGetConfig('canvas.baseHeight', 450);
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
        const canvasWidth = safeGetConfig('canvas.baseWidth', 800);
        if (this.x <= 0 || this.x + this.size >= canvasWidth) {
            this.vx *= -this.bounce;
            this.x = constrain(this.x, 0, canvasWidth - this.size);
        }
    }
    
    updateLifetime() {
        const fadeSpeed = safeGetConfig(`particles.types.${this.type}.fadeSpeed`, this.type === 'joy' ? 2 : 0);
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
        this.radius = safeGetConfig('colorPools.radius', 20);
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
        
        const requiredPixels = safeGetConfig('colorPools.requiredPixels', 50);
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
            this.pulseTimer += safeGetConfig('colorPools.pulseSpeed', 0.1);
            this.spawnTimer++;
            
            const spawnDelay = safeGetConfig('colorPools.spawnDelay', 180);
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
                pixel.x - this.radius + safeGetConfig('particles.pixelSize', 3)/2, 
                pixel.y - this.radius + safeGetConfig('particles.pixelSize', 3)/2
            );
            graphics.rotate(PI/4);
            graphics.fill(pixel.color[0], pixel.color[1], pixel.color[2], 255);
            const pixelSize = safeGetConfig('particles.pixelSize', 3);
            graphics.rect(-pixelSize/2, -pixelSize/2, pixelSize, pixelSize);
            graphics.pop();
            
            // Add subtle highlight to some pixels (also as diamonds)
            if (random() < 0.3) {
                graphics.push();
                graphics.translate(
                    pixel.x - this.radius + safeGetConfig('particles.pixelSize', 3)/2, 
                    pixel.y - this.radius + safeGetConfig('particles.pixelSize', 3)/2
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
        const requiredPixels = safeGetConfig('colorPools.requiredPixels', 50);
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
        this.maxParticles = safeGetConfig('particles.maxParticles', 100);
    }
    
    emit(x, y, color, count = 1, type = 'scale') {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                const offsetX = random(-5, 5);
                const offsetY = random(-5, 5);
                const pixel = new Pixel(x + offsetX, y + offsetY, color, type);
                this.particles.push(pixel);
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
                pixel.size = safeGetConfig('particles.pixelSize', 3); // Keep consistent size
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
        this.gridSize = safeGetConfig('colorPools.gridSize', 40);
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
        const maxButterflies = safeGetConfig('entities.maxButterflies', 12);
        
        for (let pool of spawnRequests) {
            if (butterflies.length < maxButterflies && pool.consumeForSpawn()) {
                const spawn = pool.getSpawnPosition();
                
                // Create new butterfly (assumes Butterfly class is globally available)
                const newButterfly = new Butterfly(spawn.x, spawn.y, spawn.colors);
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
            isInPlayableArea = x > 0 && x < 800 && y > 0 && y < 450;
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