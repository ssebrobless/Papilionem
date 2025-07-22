// Event-driven communication system for decoupled entity interactions
class EventBus {
    constructor() {
        this.events = new Map();
        this.history = [];
        this.maxHistorySize = 100;
    }
    
    // Subscribe to an event
    on(event, callback, context = null) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event).push({
            callback,
            context,
            once: false
        });
        
        return () => this.off(event, callback, context);
    }
    
    // Subscribe to an event once
    once(event, callback, context = null) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event).push({
            callback,
            context,
            once: true
        });
        
        return () => this.off(event, callback, context);
    }
    
    // Unsubscribe from an event
    off(event, callback, context = null) {
        const listeners = this.events.get(event);
        if (!listeners) return;
        
        this.events.set(event, listeners.filter(listener => 
            listener.callback !== callback || listener.context !== context
        ));
        
        if (this.events.get(event).length === 0) {
            this.events.delete(event);
        }
    }
    
    // Emit an event
    emit(event, data = {}) {
        // Add to history for debugging
        this.addToHistory(event, data);
        
        const listeners = this.events.get(event);
        if (!listeners) return;
        
        // Create a copy to avoid issues if listeners modify the array
        const listenersToCall = [...listeners];
        
        listenersToCall.forEach(listener => {
            if (listener.context) {
                listener.callback.call(listener.context, data);
            } else {
                listener.callback(data);
            }
            
            // Remove if it was a one-time listener
            if (listener.once) {
                this.off(event, listener.callback, listener.context);
            }
        });
    }
    
    // Clear all listeners for an event
    clear(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }
    
    // Add event to history
    addToHistory(event, data) {
        this.history.push({
            event,
            data,
            timestamp: Date.now(),
            frame: frameCount
        });
        
        // Keep history size limited
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }
    
    // Get event history for debugging
    getHistory(event = null) {
        if (event) {
            return this.history.filter(item => item.event === event);
        }
        return [...this.history];
    }
    
    // Get all registered events
    getRegisteredEvents() {
        return Array.from(this.events.keys());
    }
    
    // Get listener count for an event
    getListenerCount(event) {
        const listeners = this.events.get(event);
        return listeners ? listeners.length : 0;
    }
}

// Define game events
const GameEvents = {
    // Butterfly events
    BUTTERFLY_SPAWNED: 'butterfly:spawned',
    BUTTERFLY_DIED: 'butterfly:died',
    BUTTERFLY_SCARED: 'butterfly:scared',
    BUTTERFLY_DISPLAY: 'butterfly:display',
    BUTTERFLY_VISITED_FLOWER: 'butterfly:visitedFlower',
    BUTTERFLY_DROPPED_PIXELS: 'butterfly:droppedPixels',
    
    // Flower events
    FLOWER_PLANTED: 'flower:planted',
    FLOWER_BLOOMED: 'flower:bloomed',
    FLOWER_MATURED: 'flower:matured',
    FLOWER_WILTED: 'flower:wilted',
    FLOWER_DIED: 'flower:died',
    FLOWER_PRODUCED_POLLEN: 'flower:producedPollen',
    
    // Pixel/Particle events
    PIXELS_SPAWNED: 'pixels:spawned',
    PIXELS_SETTLED: 'pixels:settled',
    POLLEN_COLLECTED: 'pollen:collected',
    
    // Pool events
    POOL_CREATED: 'pool:created',
    POOL_READY: 'pool:ready',
    POOL_SPAWNING: 'pool:spawning',
    POOLS_MERGED: 'pools:merged',
    
    // Interaction events
    CURSOR_STILL: 'cursor:still',
    CURSOR_MOVING: 'cursor:moving',
    GENTLE_HOVER: 'interaction:gentleHover',
    PLANT_ATTEMPTED: 'interaction:plantAttempted',
    
    // System events
    ENTITY_LIMIT_REACHED: 'system:entityLimitReached',
    ECOSYSTEM_BALANCED: 'system:ecosystemBalanced',
    RARE_COLOR_DISCOVERED: 'system:rareColorDiscovered'
};

// Create global event bus
const eventBus = new EventBus();

// Helper function to set up ecosystem event chains
function setupEcosystemEvents() {
    // When butterfly visits flower, produce pollen
    eventBus.on(GameEvents.BUTTERFLY_VISITED_FLOWER, (data) => {
        const { flower, butterfly } = data;
        if (flower.stage === 'mature' && flower.pollenTimer === 0) {
            eventBus.emit(GameEvents.FLOWER_PRODUCED_POLLEN, { flower, butterfly });
        }
    });
    
    // When pixels settle, check for pool creation
    eventBus.on(GameEvents.PIXELS_SETTLED, (data) => {
        const { pixels } = data;
        // Pool manager will handle this
    });
    
    // When pool is ready, start pulsing
    eventBus.on(GameEvents.POOL_READY, (data) => {
        const { pool } = data;
        // Pool will handle its own pulsing
    });
    
    // When gentle hover detected, trigger butterfly display
    eventBus.on(GameEvents.GENTLE_HOVER, (data) => {
        const { butterfly } = data;
        if (butterfly && butterfly.state !== 'display') {
            eventBus.emit(GameEvents.BUTTERFLY_DISPLAY, { butterfly });
        }
    });
}