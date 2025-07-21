class ColorPool {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.pixels = [];
        this.radius = 20;
        this.pulseTimer = 0;
        this.isPulsing = false;
        this.spawnTimer = 0;
        this.color = [0, 0, 0];
        this.id = Date.now() + random(1000);
    }
    
    addPixel(pixel) {
        this.pixels.push({
            color: pixel.color,
            x: pixel.x - this.x + this.radius,
            y: pixel.y - this.y + this.radius
        });
        
        this.updateAverageColor();
        
        if (this.pixels.length >= 50 && !this.isPulsing) {
            this.isPulsing = true;
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
            this.pulseTimer += 0.1;
            this.spawnTimer++;
            
            if (this.spawnTimer > 180) {
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
        
        for (let pixel of this.pixels) {
            graphics.noStroke();
            // Draw pixels with stronger presence
            graphics.fill(pixel.color[0], pixel.color[1], pixel.color[2], 255);
            graphics.rect(
                pixel.x - this.radius, 
                pixel.y - this.radius, 
                config.pixelSize, 
                config.pixelSize
            );
            // Add subtle highlight to some pixels
            if (random() < 0.3) {
                graphics.fill(255, 255, 255, 100);
                graphics.rect(
                    pixel.x - this.radius + 1, 
                    pixel.y - this.radius + 1, 
                    1, 
                    1
                );
            }
        }
        
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
        const consumed = this.pixels.splice(0, 50);
        this.updateAverageColor();
        
        if (this.pixels.length < 50) {
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

class PoolManager {
    constructor() {
        this.pools = new Map();
        this.gridSize = 40;
    }
    
    update(particles, butterflies) {
        const settledPixels = particles.getSettledPixels();
        
        for (let pixel of settledPixels) {
            const pool = this.findOrCreatePool(pixel.x, pixel.y);
            if (pool) {
                pool.addPixel(pixel);
                const index = particles.particles.indexOf(pixel);
                if (index > -1) {
                    particles.particles.splice(index, 1);
                }
            }
        }
        
        const spawnRequests = [];
        for (let [id, pool] of this.pools) {
            const result = pool.update();
            if (result === 'spawn') {
                spawnRequests.push(pool);
            }
            
            if (pool.isEmpty()) {
                this.pools.delete(id);
            }
        }
        
        for (let pool of spawnRequests) {
            if (butterflies.length < 12 && pool.consumeForSpawn()) {
                const spawn = pool.getSpawnPosition();
                butterflies.push(new Butterfly(spawn.x, spawn.y, spawn.colors));
                
                particles.emitBurst(spawn.x, spawn.y, [255, 255, 255], 12);
            }
        }
    }
    
    findOrCreatePool(x, y) {
        const gridX = Math.floor(x / this.gridSize) * this.gridSize;
        const gridY = Math.floor(y / this.gridSize) * this.gridSize;
        
        for (let [id, pool] of this.pools) {
            const dist = Math.hypot(pool.x - x, pool.y - y);
            if (dist < pool.radius) {
                return pool;
            }
        }
        
        // Only create pools within the isometric playable area
        if (isWithinPlayableArea(x, y)) {
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
}