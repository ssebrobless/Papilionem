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
        this.lifetime = 255;
        this.settled = false;
        this.bounce = 0.3;
        this.friction = 0.98;
        this.size = config.pixelSize * 1.5; // Larger pixels for visibility
    }
    
    update() {
        if (!this.settled) {
            // Apply gravity along isometric Y axis (southeast direction)
            this.vy += config.gravity;
            
            // Add slight drift along isometric axes for more natural fall
            const isoDrift = 0.02;
            if (random() < 0.5) {
                this.vx += isoDrift * (random() < 0.5 ? 1 : -1);
            }
            
            this.vx *= this.friction;
            this.vy *= this.friction;
            
            this.x += this.vx;
            this.y += this.vy;
            
            // Check if pixel hits the isometric ground
            // Convert to grid coordinates to check ground level
            const gridPos = screenToIso(this.x, this.y);
            
            // Check if within playable grid bounds
            if (gridPos.x >= 0 && gridPos.x <= config.isoBounds.maxX &&
                gridPos.y >= 0 && gridPos.y <= config.isoBounds.maxY) {
                
                // Get the ground level for this grid position
                const groundScreenPos = isoToScreen(gridPos.x, gridPos.y);
                const groundLevel = groundScreenPos.y;
                
                if (this.y + this.size >= groundLevel) {
                    this.y = groundLevel - this.size;
                    this.vy *= -this.bounce;
                    
                    if (abs(this.vy) < 0.1 && abs(this.vx) < 0.1) {
                        this.settled = true;
                        this.vx = 0;
                        this.vy = 0;
                    }
                }
            } else if (this.y + this.size >= config.baseHeight) {
                // If outside grid, still stop at canvas bottom
                this.y = config.baseHeight - this.size;
                this.settled = true;
                this.vx = 0;
                this.vy = 0;
            }
            
            if (this.x <= 0 || this.x + this.size >= config.baseWidth) {
                this.vx *= -this.bounce;
                this.x = constrain(this.x, 0, config.baseWidth - this.size);
            }
        }
        
        if (this.type === 'joy' && this.lifetime > 0) {
            this.lifetime -= 2;
        }
    }
    
    isDead() {
        return this.lifetime <= 0;
    }
    
    distanceTo(x, y) {
        return dist(this.x + this.size/2, this.y + this.size/2, x, y);
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    emit(x, y, color, count = 1, type = 'scale') {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < config.maxParticles) {
                const offsetX = random(-5, 5);
                const offsetY = random(-5, 5);
                this.particles.push(new Pixel(x + offsetX, y + offsetY, color, type));
            }
        }
    }
    
    emitBurst(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < config.maxParticles) {
                // Emit particles in isometric pattern
                const isoAngles = [PI/4, 3*PI/4, 5*PI/4, 7*PI/4]; // Diagonal directions
                const baseAngle = random(isoAngles);
                const angle = baseAngle + random(-0.3, 0.3);
                const speed = random(1.5, 3);
                const pixel = new Pixel(x, y, color, 'joy');
                pixel.vx = cos(angle) * speed;
                pixel.vy = sin(angle) * speed - 0.5;
                pixel.size = config.pixelSize; // Keep consistent size
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
    
    draw(graphics) {
        for (let particle of this.particles) {
            graphics.noStroke();
            
            if (particle.type === 'joy') {
                const alpha = map(particle.lifetime, 0, 255, 0, 255);
                const [r, g, b] = particle.color;
                graphics.fill(r, g, b, alpha * 0.9);
            } else {
                graphics.fill(particle.color[0], particle.color[1], particle.color[2], 240);
            }
            
            // Draw particles as diamonds to match isometric aesthetic
            graphics.push();
            graphics.translate(particle.x + particle.size/2, particle.y + particle.size/2);
            graphics.rotate(PI/4);
            graphics.rect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            graphics.pop();
        }
    }
    
    clear() {
        this.particles = [];
    }
}