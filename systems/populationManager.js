// Centralized entity lifecycle management
class EntityManager {
    constructor() {
        this.entities = {
            butterflies: [],
            flowers: [],
            particles: [],
            pools: []
        };
        
        this.entityLimits = {
            butterflies: gameConfig.entities.maxButterflies,
            flowers: gameConfig.entities.maxFlowers
        };
        
        // Event listeners
        this.eventListeners = new Map();
    }
    
    // Add an entity to the manager
    addEntity(type, entity) {
        if (!this.entities[type]) {
            console.warn(`Unknown entity type: ${type}`);
            return false;
        }
        
        // Check limits
        if (this.entityLimits[type] && this.entities[type].length >= this.entityLimits[type]) {
            // Remove oldest entity if at limit
            const oldest = this.entities[type][0];
            oldest.isDying = true;
            this.emit('entityLimitReached', { type, entity: oldest });
        }
        
        this.entities[type].push(entity);
        this.emit('entityAdded', { type, entity });
        return true;
    }
    
    // Remove an entity
    removeEntity(type, entity) {
        const array = this.entities[type];
        if (!array) return false;
        
        const index = array.indexOf(entity);
        if (index > -1) {
            array.splice(index, 1);
            this.emit('entityRemoved', { type, entity });
            return true;
        }
        return false;
    }
    
    // Update all entities
    update(gameState) {
        // Update each entity type
        for (let [type, entities] of Object.entries(this.entities)) {
            for (let i = entities.length - 1; i >= 0; i--) {
                const entity = entities[i];
                
                // Update entity
                entity.update(gameState);
                
                // Remove dead entities
                if (entity.isDead && entity.isDead()) {
                    this.handleEntityDeath(type, entity, i);
                }
            }
        }
        
        // Check for interactions between entity types
        this.checkInteractions();
    }
    
    // Handle entity death
    handleEntityDeath(type, entity, index) {
        // Emit death event before removal
        this.emit('entityDied', { type, entity });
        
        // Type-specific death handling
        switch (type) {
            case 'butterflies':
                this.handleButterflyDeath(entity);
                break;
            case 'flowers':
                this.handleFlowerDeath(entity);
                break;
        }
        
        // Remove entity
        this.entities[type].splice(index, 1);
    }
    
    // Handle butterfly death - release pixels
    handleButterflyDeath(butterfly) {
        if (window.gameState && window.gameState.particleSystem) {
            const fadeColors = butterfly.colors.map(c => 
                [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8]
            );
            window.gameState.particleSystem.emitBurst(
                butterfly.x, 
                butterfly.y, 
                random(fadeColors), 
                10
            );
        }
    }
    
    // Handle flower death - release petals
    handleFlowerDeath(flower) {
        if (window.gameState && window.gameState.particleSystem) {
            for (let j = 0; j < 5; j++) {
                window.gameState.particleSystem.emit(
                    flower.x + random(-10, 10),
                    flower.y + random(-5, 5),
                    flower.petalColor,
                    1,
                    'scale'
                );
            }
        }
    }
    
    // Check interactions between entities
    checkInteractions() {
        const butterflies = this.entities.butterflies;
        const flowers = this.entities.flowers;
        
        // Check butterfly-flower interactions
        for (let butterfly of butterflies) {
            for (let flower of flowers) {
                const dist = butterfly.distanceTo(flower.x, flower.y);
                
                if (dist < 20 && flower.stage === 'mature' && flower.pollenTimer === 0) {
                    this.emit('butterflyVisitedFlower', { butterfly, flower });
                }
            }
        }
    }
    
    // Draw all entities with proper depth sorting
    draw(graphics, type) {
        const entities = this.entities[type];
        if (!entities) return;
        
        // Sort by z-index for proper depth
        const sorted = [...entities].sort((a, b) => {
            const aZ = a.zIndex || (a.gridPos ? a.gridPos.y * 1000 + a.gridPos.x : 0);
            const bZ = b.zIndex || (b.gridPos ? b.gridPos.y * 1000 + b.gridPos.x : 0);
            return aZ - bZ;
        });
        
        // Draw each entity
        for (let entity of sorted) {
            entity.draw(graphics);
        }
    }
    
    // Get all entities of a type
    getEntities(type) {
        return this.entities[type] || [];
    }
    
    // Get entity count
    getCount(type) {
        return this.entities[type] ? this.entities[type].length : 0;
    }
    
    // Find nearest entity of type to a position
    findNearest(type, x, y, maxDistance = Infinity) {
        const entities = this.entities[type];
        if (!entities || entities.length === 0) return null;
        
        let nearest = null;
        let nearestDist = maxDistance;
        
        for (let entity of entities) {
            const dist = entity.distanceTo(x, y);
            if (dist < nearestDist) {
                nearest = entity;
                nearestDist = dist;
            }
        }
        
        return nearest;
    }
    
    // Find entities within radius
    findWithinRadius(type, x, y, radius) {
        const entities = this.entities[type];
        if (!entities) return [];
        
        return entities.filter(entity => entity.distanceTo(x, y) <= radius);
    }
    
    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    off(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            for (let callback of listeners) {
                callback(data);
            }
        }
    }
    
    // Clear all entities
    clear() {
        for (let type in this.entities) {
            this.entities[type] = [];
        }
        this.emit('allEntitiesCleared', {});
    }
    
    // Spawn helpers
    spawnButterfly(x, y, colors) {
        if (this.getCount('butterflies') >= this.entityLimits.butterflies) {
            return null;
        }
        
        const butterfly = new Butterfly(x, y, colors || null); // Allow custom colors or use personality
        this.addEntity('butterflies', butterfly);
        return butterfly;
    }
    
    spawnFlower(x, y) {
        if (this.getCount('flowers') >= this.entityLimits.flowers) {
            return null;
        }
        
        const flower = new Flower(x, y);
        this.addEntity('flowers', flower);
        return flower;
    }
}

// Create global instance
const entityManager = new EntityManager();