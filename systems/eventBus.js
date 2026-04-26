// Event-driven communication system for decoupled entity interactions
class EventBus {
    constructor() {
        this.events = new Map();
        this.history = [];
        this.maxHistorySize = 250;
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

    clearHistory() {
        this.history = [];
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
    BUTTERFLY_STATE_CHANGED: 'butterfly:stateChanged',
    BUTTERFLY_VISITED_FLOWER: 'butterfly:visitedFlower',
    BUTTERFLY_DROPPED_PIXELS: 'butterfly:droppedPixels',
    
    // Flower events
    FLOWER_BLOOMED: 'flower:bloomed',
    FLOWER_MATURED: 'flower:matured',
    FLOWER_WILTED: 'flower:wilted',
    FLOWER_DIED: 'flower:died',
    FLOWER_EGG_LAID: 'flower:eggLaid',
    CHRYSALIS_FORMED: 'lifecycle:chrysalisFormed',
    CATERPILLAR_HATCHED: 'lifecycle:caterpillarHatched',
    HYBRID_BORN: 'lifecycle:hybridBorn',
    TRUST_CASCADE_OCCURRED: 'social:trustCascade',
    
    // Pixel/Particle events
    PIXELS_SPAWNED: 'pixels:spawned',
    PIXELS_SETTLED: 'pixels:settled',
    
    // Pool events
    POOL_CREATED: 'pool:created',
    
    // Interaction events
    CURSOR_STILL: 'cursor:still',
    CURSOR_MOVING: 'cursor:moving',
    PLANT_ATTEMPTED: 'interaction:plantAttempted',
    
    // System events
    ENTITY_LIMIT_REACHED: 'system:entityLimitReached',
    ECOSYSTEM_BALANCED: 'system:ecosystemBalanced',
    RARE_COLOR_DISCOVERED: 'system:rareColorDiscovered',

    // Foundation system events
    STATUS_APPLIED: 'status:applied',
    STATUS_REMOVED: 'status:removed',
    STATUS_TICKED: 'status:ticked',
    SLEEP_STATE_CHANGED: 'sleep:stateChanged',
    SLEEP_ASSIST_REQUESTED: 'sleep:assistRequested',
    TEACHING_STARTED: 'teaching:started',
    TEACHING_COMPLETED: 'teaching:completed',
    TRAINING_DRILL_STARTED: 'training:drillStarted',
    TRAINING_DRILL_COMPLETED: 'training:drillCompleted',
    COMMUNICATION_SIGNAL: 'communication:signal',
    DIALOGUE_SPOKEN: 'communication:dialogueSpoken',
    ZONE_TRAVEL_STARTED: 'zone:travelStarted',
    ZONE_TRAVEL_COMPLETED: 'zone:travelCompleted',
    OBJECT_PICKED_UP: 'object:pickedUp',
    OBJECT_DROPPED: 'object:dropped',
    OBJECT_DELIVERED: 'object:delivered',
    OBJECT_CONSUMED: 'object:consumed',
    BATTLE_ACTION_OCCURRED: 'battle:actionOccurred',
    BATTLE_SNAPSHOT_CREATED: 'battle:snapshotCreated',
    BATTLE_COMMITTED: 'battle:committed',
    REPLAY_SESSION_STARTED: 'replay:sessionStarted',
    REPLAY_SEED_CHANGED: 'replay:seedChanged',
    REPLAY_MARKER_RECORDED: 'replay:markerRecorded',
    SAVE_SERIALIZED: 'save:serialized',
    SAVE_DESERIALIZED: 'save:deserialized',
    SAVE_REBUILT: 'save:rebuilt',
    ZONE_FOCUS_CHANGED: 'zone:focusChanged',
    DEBUG_AUDIT_SCENARIO_LOADED: 'debug:auditScenarioLoaded'
};

// Create global event bus
const eventBus = new EventBus();

// Helper function to set up ecosystem event chains
function setupEcosystemEvents() {
    // When butterfly visits flower, trigger special effects
    eventBus.on(GameEvents.BUTTERFLY_VISITED_FLOWER, (data) => {
        const { flower, butterfly } = data;
        // Flower handles special interactions directly now
    });
    
    // Legacy prototype pool and gentle-hover chains were retired in the overhaul.
}
