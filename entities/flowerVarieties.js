// Modular flower variety system providing different flower archetypes
// Each variety has its own specialized rendering and behavior while sharing lifecycle

// Base flower archetype - provides common structure for all varieties
class FlowerArchetype {
    constructor(config = {}) {
        this.name = config.name || 'generic';
        this.size = config.size || 8;
        this.stemHeight = config.stemHeight || 12;
        this.rarity = config.rarity || 1.0; // Higher = more common
        this.pollenMultiplier = config.pollenMultiplier || 1.0;
        
        // Visual identity
        this.shadowScale = config.shadowScale || 1.0;
        this.swayAmount = config.swayAmount || 0.08;
        this.swaySpeed = config.swaySpeed || 0.02;
        
        // Lifecycle adjustments
        this.stageMultipliers = config.stageMultipliers || {
            bloom: 1.0,
            mature: 1.0,
            wilting: 1.0,
            dissolve: 1.0
        };
    }
    
    // Initialize instance-specific properties
    initializeInstance(flower) {
        flower.archetype = this;
        flower.swayAngle = random(TWO_PI);
        flower.swaySpeed = this.swaySpeed + random(0.01);
        flower.swayAmount = this.swayAmount;
        flower.petalPhase = random(TWO_PI);
        flower.petalWaveSpeed = 0.02;
        
        // Apply stage duration modifiers
        for (let stage in this.stageMultipliers) {
            if (flower.stageDurations[stage]) {
                flower.stageDurations[stage] *= this.stageMultipliers[stage];
            }
        }
    }
    
    // Default drawing method - to be overridden
    draw(graphics, flower, alpha) {
        graphics.fill(255, 100, 100, alpha);
        graphics.ellipse(0, 0, this.size, this.size);
    }
    
    // Custom shadow drawing if needed
    drawShadow(graphics, flower, alpha) {
        graphics.noStroke();
        graphics.fill(0, 0, 0, min(30, alpha * 0.15));
        const shadowSize = this.size * this.shadowScale;
        graphics.ellipse(flower.x, flower.y + flower.shadowOffset, 
                        shadowSize, shadowSize * 0.5);
    }
    
    // Generate pollen with variety-specific multiplier
    generatePollen(flower, particleSystem) {
        const pollenColor = [250, 250, 220];
        const amount = Math.ceil(3 * this.pollenMultiplier);
        particleSystem.emit(flower.x, flower.y - this.size, pollenColor, amount, 'pollen');
    }
    
    // Check spacing requirements
    canPlantNear(x, y, otherFlower) {
        const dist = Math.hypot(otherFlower.x - x, otherFlower.y - y);
        return dist > (this.size * 3 + 20);
    }
}

// Bush/Cluster variety - low, spreading flowers in groups
class BushFlower extends FlowerArchetype {
    constructor() {
        super({
            name: 'bush',
            size: 8,
            stemHeight: 4,
            rarity: 2.0,
            pollenMultiplier: 1.5,
            swayAmount: 0.04,
            shadowScale: 1.5,
            stageMultipliers: {
                bloom: 1.2,
                mature: 1.5,
                wilting: 0.8,
                dissolve: 1.0
            }
        });
    }
    
    initializeInstance(flower) {
        super.initializeInstance(flower);
        flower.clusterCount = 3 + floor(random(3)); // 3-5 flower heads
        flower.petalCount = 5;
        flower.clusterSpread = 0.6 + random(0.4); // Randomize cluster spread
    }
    
    draw(graphics, flower, alpha) {
        const sway = sinSway(flower.swayAngle) * flower.swayAmount;
        
        // Draw multiple flower heads in a natural cluster pattern
        for (let i = 0; i < flower.clusterCount; i++) {
            const angle = (TWO_PI / flower.clusterCount) * i + flower.swayAngle * 0.1;
            const distance = this.size * flower.clusterSpread;
            const clusterX = cos(angle) * distance + sway * 2;
            const clusterY = sin(angle) * distance * 0.4 - this.stemHeight;
            
            graphics.push();
            graphics.translate(clusterX, clusterY);
            graphics.rotate(sway * 0.2);
            
            // Draw individual flower head
            this.drawClusterHead(graphics, flower, alpha, i);
            
            graphics.pop();
        }
        
        // Draw subtle connecting stems
        this.drawBushStems(graphics, flower, alpha);
        
        // Pollen ready glow for whole cluster
        if (flower.stage === 'mature' && flower.pollenTimer === 0) {
            graphics.fill(255, 255, 220, 30);
            graphics.ellipse(0, -this.stemHeight, this.size * 2.5, this.size * 1.2);
        }
    }
    
    drawClusterHead(graphics, flower, alpha, index) {
        const headSize = this.size * (0.7 + index * 0.1); // Varied sizes
        
        graphics.noStroke();
        for (let j = 0; j < flower.petalCount; j++) {
            const petalAngle = (TWO_PI / flower.petalCount) * j;
            graphics.fill(flower.petalColor[0], flower.petalColor[1], flower.petalColor[2], alpha);
            graphics.push();
            graphics.rotate(petalAngle);
            graphics.ellipse(headSize * 0.4, 0, headSize * 0.6, headSize * 0.3);
            graphics.pop();
        }
        
        // Small center
        graphics.fill(flower.centerColor[0], flower.centerColor[1], flower.centerColor[2], alpha);
        graphics.ellipse(0, 0, headSize * 0.4, headSize * 0.4);
    }
    
    drawBushStems(graphics, flower, alpha) {
        // Very short, thick base stems
        graphics.noStroke();
        graphics.fill(60, 120, 60, alpha);
        
        for (let i = 0; i < flower.clusterCount; i++) {
            const angle = (TWO_PI / flower.clusterCount) * i;
            const stemX = cos(angle) * this.size * 0.3;
            const stemY = sin(angle) * this.size * 0.15;
            
            // Short thick stem
            graphics.rect(stemX - 2, stemY, 4, this.stemHeight);
        }
    }
}

// Lavender variety - vertical clusters with multiple stems
class LavenderFlower extends FlowerArchetype {
    constructor() {
        super({
            name: 'lavender',
            size: 6,
            stemHeight: 18,
            rarity: 1.5,
            pollenMultiplier: 0.8,
            swayAmount: 0.12,
            swaySpeed: 0.015,
            shadowScale: 0.8,
            stageMultipliers: {
                bloom: 1.5,
                mature: 1.2,
                wilting: 1.0,
                dissolve: 0.8
            }
        });
    }
    
    initializeInstance(flower) {
        super.initializeInstance(flower);
        flower.stemCount = 3 + floor(random(3)); // 3-5 stems
        flower.floretDensity = 6 + floor(random(4)); // 6-9 florets per stem
        flower.purpleIntensity = 0.7 + random(0.3);
    }
    
    draw(graphics, flower, alpha) {
        // Draw multiple vertical stems with floret clusters
        for (let i = 0; i < flower.stemCount; i++) {
            const stemOffset = (i - flower.stemCount/2) * 4;
            const stemSway = sin(flower.swayAngle + i * 0.3) * flower.swayAmount;
            
            graphics.push();
            graphics.translate(stemOffset, 0);
            
            // Draw stem
            this.drawLavenderStem(graphics, flower, alpha, i, stemSway);
            
            // Draw floret cluster
            this.drawLavenderFlorets(graphics, flower, alpha, i, stemSway);
            
            graphics.pop();
        }
        
        // Subtle aromatic effect for mature lavender
        if (flower.stage === 'mature' && flower.pollenTimer === 0) {
            graphics.fill(220, 200, 255, 20);
            graphics.ellipse(0, -this.stemHeight - 4, this.size * 3, this.size * 1.5);
        }
    }
    
    drawLavenderStem(graphics, flower, alpha, stemIndex, sway) {
        graphics.fill(80, 120, 80, alpha);
        graphics.noStroke();
        
        // Thin, flexible stem
        for (let y = 0; y < this.stemHeight; y += 2) {
            const x = sin(flower.swayAngle + stemIndex * 0.3) * (y / this.stemHeight) * 4 * flower.swayAmount;
            graphics.rect(x - 1, -y - 2, 2, 2);
        }
    }
    
    drawLavenderFlorets(graphics, flower, alpha, stemIndex, sway) {
        graphics.push();
        graphics.translate(sway * 6, -this.stemHeight);
        
        // Small purple florets along the stem top
        for (let j = 0; j < flower.floretDensity; j++) {
            const y = j * 2.5;
            const floretSize = 2.5 - j * 0.2;
            
            // Purple gradient from base to tip
            const purpleR = lerp(flower.petalColor[0], 150, j / flower.floretDensity);
            const purpleG = lerp(flower.petalColor[1], 120, j / flower.floretDensity);
            const purpleB = lerp(flower.petalColor[2], 200, j / flower.floretDensity);
            
            graphics.fill(purpleR * flower.purpleIntensity, 
                         purpleG * flower.purpleIntensity, 
                         purpleB * flower.purpleIntensity, alpha);
            graphics.noStroke();
            
            // Tiny clustered florets around the stem
            for (let k = 0; k < 4; k++) {
                const floretAngle = (PI/2) * k;
                const fx = cos(floretAngle) * floretSize;
                const fy = sin(floretAngle) * floretSize * 0.5;
                graphics.ellipse(fx, y + fy, floretSize, floretSize);
            }
        }
        
        graphics.pop();
    }
}

// Ground Sprout variety - tiny flowers very close to ground
class GroundSprout extends FlowerArchetype {
    constructor() {
        super({
            name: 'sprout',
            size: 4,
            stemHeight: 2,
            rarity: 3.0,
            pollenMultiplier: 0.5,
            swayAmount: 0.02,
            swaySpeed: 0.03,
            shadowScale: 0.6,
            stageMultipliers: {
                bloom: 0.8,
                mature: 0.9,
                wilting: 1.2,
                dissolve: 1.5
            }
        });
    }
    
    initializeInstance(flower) {
        super.initializeInstance(flower);
        flower.petalCount = 4 + floor(random(2)); // 4-5 petals
        flower.brightness = 0.8 + random(0.4);
        flower.delicacy = random(1); // How fragile it appears
    }
    
    draw(graphics, flower, alpha) {
        graphics.push();
        graphics.translate(0, -this.stemHeight);
        
        // Tiny, delicate petals
        graphics.noStroke();
        const petalSize = this.size * (0.8 + sin(frameCount * 0.05 + flower.petalPhase) * 0.1);
        
        for (let i = 0; i < flower.petalCount; i++) {
            const angle = (TWO_PI / flower.petalCount) * i;
            const px = cos(angle) * petalSize * 0.8;
            const py = sin(angle) * petalSize * 0.8;
            
            // Soft, glowing petals
            graphics.fill(flower.petalColor[0] * flower.brightness, 
                         flower.petalColor[1] * flower.brightness, 
                         flower.petalColor[2] * flower.brightness, 
                         alpha * (0.7 + flower.delicacy * 0.3));
            graphics.ellipse(px, py, petalSize, petalSize * 0.8);
        }
        
        // Tiny, bright center
        graphics.fill(flower.centerColor[0], flower.centerColor[1], flower.centerColor[2], alpha);
        graphics.ellipse(0, 0, petalSize * 0.5, petalSize * 0.5);
        
        // Very subtle pollen ready indication
        if (flower.stage === 'mature' && flower.pollenTimer === 0) {
            graphics.fill(255, 255, 200, 40);
            graphics.ellipse(0, 0, petalSize * 1.5, petalSize * 1.5);
        }
        
        graphics.pop();
    }
}

// Moss Patch variety - spreading ground cover with tiny blooms
class MossPatch extends FlowerArchetype {
    constructor() {
        super({
            name: 'moss',
            size: 10,
            stemHeight: 1,
            rarity: 1.2,
            pollenMultiplier: 2.0,
            swayAmount: 0.01,
            swaySpeed: 0.01,
            shadowScale: 2.0,
            stageMultipliers: {
                bloom: 2.0,
                mature: 2.5,
                wilting: 1.5,
                dissolve: 1.0
            }
        });
    }
    
    initializeInstance(flower) {
        super.initializeInstance(flower);
        flower.mossSpread = 8 + random(6); // Size of moss patch
        flower.bloomCount = 4 + floor(random(6)); // 4-9 tiny blooms
        flower.mossColor = [
            40 + random(20),   // Dark green base
            80 + random(40),
            40 + random(20)
        ];
        flower.bloomPositions = [];
        
        // Pre-calculate bloom positions
        for (let i = 0; i < flower.bloomCount; i++) {
            flower.bloomPositions.push({
                x: random(-flower.mossSpread, flower.mossSpread),
                y: random(-flower.mossSpread * 0.5, flower.mossSpread * 0.5),
                phase: random(TWO_PI),
                size: 0.5 + random(0.8)
            });
        }
    }
    
    draw(graphics, flower, alpha) {
        // Draw moss base
        this.drawMossBase(graphics, flower, alpha);
        
        // Draw tiny blooms scattered across the moss
        this.drawMossBlooms(graphics, flower, alpha);
        
        // Organic pollen effect
        if (flower.stage === 'mature' && flower.pollenTimer === 0) {
            graphics.fill(200, 255, 180, 25);
            graphics.ellipse(0, 0, flower.mossSpread * 2, flower.mossSpread);
        }
    }
    
    drawMossBase(graphics, flower, alpha) {
        graphics.noStroke();
        
        // Draw organic moss shape with multiple layers
        for (let layer = 3; layer > 0; layer--) {
            const layerAlpha = alpha * (0.3 + layer * 0.2);
            const layerSize = flower.mossSpread * (0.8 + layer * 0.2);
            
            graphics.fill(flower.mossColor[0] + layer * 10, 
                         flower.mossColor[1] + layer * 15, 
                         flower.mossColor[2] + layer * 8, 
                         layerAlpha);
            
            // Irregular moss shape using multiple overlapping circles
            for (let i = 0; i < 6; i++) {
                const angle = (TWO_PI / 6) * i;
                const offsetX = cos(angle) * layerSize * 0.3;
                const offsetY = sin(angle) * layerSize * 0.15;
                graphics.ellipse(offsetX, offsetY - 1, layerSize, layerSize * 0.6);
            }
        }
    }
    
    drawMossBlooms(graphics, flower, alpha) {
        graphics.noStroke();
        
        for (let bloom of flower.bloomPositions) {
            graphics.push();
            graphics.translate(bloom.x, bloom.y);
            
            // Tiny, almost microscopic flowers
            const bloomSize = 2 * bloom.size * (1 + sin(frameCount * 0.03 + bloom.phase) * 0.2);
            const bloomAlpha = alpha * (0.6 + sin(frameCount * 0.02 + bloom.phase) * 0.2);
            
            // Tiny bright bloom
            graphics.fill(flower.petalColor[0] * 0.9, 
                         flower.petalColor[1] * 0.9, 
                         flower.petalColor[2] * 0.9, 
                         bloomAlpha);
            graphics.ellipse(0, 0, bloomSize, bloomSize);
            
            // Even tinier center
            graphics.fill(255, 255, 200, bloomAlpha);
            graphics.ellipse(0, 0, bloomSize * 0.4, bloomSize * 0.4);
            
            graphics.pop();
        }
    }
    
    // Moss spreads more and needs more space
    canPlantNear(x, y, otherFlower) {
        const dist = Math.hypot(otherFlower.x - x, otherFlower.y - y);
        return dist > (this.size * 4 + 30);
    }
}

// Factory system for creating flower varieties
class FlowerVarietyFactory {
    constructor() {
        this.varieties = [
            new BushFlower(),
            new LavenderFlower(),
            new GroundSprout(),
            new MossPatch()
        ];
        
        // Build weighted selection array based on rarity
        this.weightedVarieties = [];
        for (let variety of this.varieties) {
            const weight = Math.floor(variety.rarity * 10);
            for (let i = 0; i < weight; i++) {
                this.weightedVarieties.push(variety);
            }
        }
    }
    
    // Get a random variety based on rarity weights
    getRandomVariety() {
        return random(this.weightedVarieties);
    }
    
    // Get a specific variety by name
    getVariety(name) {
        return this.varieties.find(v => v.name === name);
    }
    
    // Get all available variety names
    getVarietyNames() {
        return this.varieties.map(v => v.name);
    }
    
    // Create a flower with a specific variety
    createFlower(x, y, varietyName = null) {
        const variety = varietyName ? this.getVariety(varietyName) : this.getRandomVariety();
        if (!variety) return null;
        
        // Create base flower instance (assumes Flower class exists)
        const flower = new Flower(x, y);
        
        // Override flower type and properties
        flower.flowerType = variety.name;
        flower.size = variety.size;
        flower.stemHeight = variety.stemHeight;
        
        // Initialize variety-specific properties
        variety.initializeInstance(flower);
        
        return flower;
    }
    
    // Enhanced spacing check that considers variety-specific requirements
    canPlantAt(x, y, flowers, varietyName = null) {
        const variety = varietyName ? this.getVariety(varietyName) : this.getRandomVariety();
        if (!variety) return false;
        
        for (let flower of flowers) {
            if (!variety.canPlantNear(x, y, flower)) {
                return false;
            }
        }
        
        return true;
    }
}

// Enhanced flower manager that integrates with variety system
class VarietyFlowerManager extends FlowerManager {
    constructor() {
        super();
        this.varietyFactory = new FlowerVarietyFactory();
    }
    
    // Override plantFlower to use variety system
    plantFlower(x, y, flowers, particleSystem, varietyName = null) {
        if (this.canPlant(x, y, flowers) && flowers.length < 6) {
            const flower = this.varietyFactory.createFlower(x, y, varietyName);
            if (flower) {
                flowers.push(flower);
                
                // Remove pollen particles for planting
                let pollenConsumed = 0;
                particleSystem.removePixels(p => {
                    if (p.type === 'pollen' && pollenConsumed < 5) {
                        pollenConsumed++;
                        return true;
                    }
                    return false;
                });
                
                particleSystem.emitBurst(x, y, [255, 255, 255], 8);
                return true;
            }
        }
        return false;
    }
    
    // Enhanced spacing check using variety requirements
    canPlant(x, y, flowers, varietyName = null) {
        if (this.pollenCount < 5) return false;
        if (!isWithinPlayableArea(x, y)) return false;
        
        return this.varietyFactory.canPlantAt(x, y, flowers, varietyName);
    }
    
    // Get variety statistics for debugging/UI
    getVarietyStats(flowers) {
        const stats = {};
        for (let variety of this.varietyFactory.varieties) {
            stats[variety.name] = 0;
        }
        
        for (let flower of flowers) {
            if (flower.archetype && stats.hasOwnProperty(flower.archetype.name)) {
                stats[flower.archetype.name]++;
            }
        }
        
        return stats;
    }
}

// Export the variety system components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FlowerArchetype,
        BushFlower,
        LavenderFlower,
        GroundSprout,
        MossPatch,
        FlowerVarietyFactory,
        VarietyFlowerManager
    };
}