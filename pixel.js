class Pixel {
    constructor(x, y, color, type = 'scale') {
        this.x = x;
        this.y = y;
        this.vx = random(-0.5, 0.5);
        this.vy = random(-1, 0);
        this.color = color;
        this.type = type;
        this.lifetime = 255;
        this.settled = false;
        this.bounce = 0.3;
        this.friction = 0.99;
        this.size = config.pixelSize;
    }
    
    update() {
        if (!this.settled) {
            this.vy += config.gravity;
            
            this.vx *= this.friction;
            this.vy *= this.friction;
            
            this.x += this.vx;
            this.y += this.vy;
            
            // Check if pixel hits the isometric ground
            const groundLevel = config.baseHeight - 50; // Approximate ground level
            if (this.y + this.size >= groundLevel && isWithinPlayableArea(this.x, this.y)) {
                this.y = groundLevel - this.size;
                this.vy *= -this.bounce;
                
                if (abs(this.vy) < 0.1 && abs(this.vx) < 0.1) {
                    this.settled = true;
                    this.vx = 0;
                    this.vy = 0;
                }
            } else if (this.y + this.size >= config.baseHeight) {
                // If outside playable area, just stop at canvas bottom
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
                const angle = (TWO_PI / count) * i + random(-0.2, 0.2);
                const speed = random(1, 3);
                const pixel = new Pixel(x, y, color, 'joy');
                pixel.vx = cos(angle) * speed;
                pixel.vy = sin(angle) * speed - 1;
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
            
            graphics.rect(particle.x, particle.y, particle.size, particle.size);
        }
    }
    
    clear() {
        this.particles = [];
    }
}