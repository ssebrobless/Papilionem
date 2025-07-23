// Trigonometric cache system for optimizing repeated sin/cos calculations
// Pre-computes and caches frequently used trigonometric values

class TrigCache {
    constructor() {
        // Cache tables for different precision levels
        this.caches = {
            // High precision cache for smooth animations (3600 entries = 0.1 degree precision)
            highPrecision: {
                sin: new Array(3600),
                cos: new Array(3600),
                stepSize: TWO_PI / 3600
            },
            
            // Medium precision cache for general use (1800 entries = 0.2 degree precision)
            mediumPrecision: {
                sin: new Array(1800),
                cos: new Array(1800),
                stepSize: TWO_PI / 1800
            },
            
            // Low precision cache for background effects (720 entries = 0.5 degree precision)
            lowPrecision: {
                sin: new Array(720),
                cos: new Array(720),
                stepSize: TWO_PI / 720
            }
        };
        
        // Animation-specific caches for common frame-based patterns
        this.animationCaches = {
            // Cache for frameCount * 0.05 patterns (very common in effects)
            frameCount005: {
                sin: new Array(1260), // 21 seconds at 60fps
                cos: new Array(1260),
                frameMultiplier: 0.05
            },
            
            // Cache for frameCount * 0.1 patterns
            frameCount01: {
                sin: new Array(628), // ~10.5 seconds at 60fps
                cos: new Array(628),
                frameMultiplier: 0.1
            },
            
            // Cache for frameCount * 0.02 patterns
            frameCount002: {
                sin: new Array(3142), // ~52 seconds at 60fps
                cos: new Array(3142),
                frameMultiplier: 0.02
            }
        };
        
        // Wing animation cache for butterfly wing angles
        this.wingCache = {
            sin: new Array(628), // 100 different wing positions for smooth animation
            cos: new Array(628),
            stepSize: TWO_PI / 628
        };
        
        // Sway animation cache for flower movements
        this.swayCache = {
            sin: new Array(628), // Smooth swaying motion
            cos: new Array(628),
            stepSize: TWO_PI / 628
        };
        
        this.initialized = false;
    }
    
    // Initialize all cache tables
    initialize() {
        console.log("Initializing trigonometric cache system...");
        
        // Initialize precision-based caches
        for (const [cacheName, cache] of Object.entries(this.caches)) {
            for (let i = 0; i < cache.sin.length; i++) {
                const angle = i * cache.stepSize;
                cache.sin[i] = Math.sin(angle);
                cache.cos[i] = Math.cos(angle);
            }
        }
        
        // Initialize animation-specific caches
        for (const [cacheName, cache] of Object.entries(this.animationCaches)) {
            for (let i = 0; i < cache.sin.length; i++) {
                const angle = i * cache.frameMultiplier;
                cache.sin[i] = Math.sin(angle);
                cache.cos[i] = Math.cos(angle);
            }
        }
        
        // Initialize wing animation cache
        for (let i = 0; i < this.wingCache.sin.length; i++) {
            const angle = i * this.wingCache.stepSize;
            this.wingCache.sin[i] = Math.sin(angle);
            this.wingCache.cos[i] = Math.cos(angle);
        }
        
        // Initialize sway animation cache
        for (let i = 0; i < this.swayCache.sin.length; i++) {
            const angle = i * this.swayCache.stepSize;
            this.swayCache.sin[i] = Math.sin(angle);
            this.swayCache.cos[i] = Math.cos(angle);
        }
        
        this.initialized = true;
        console.log("Trigonometric cache initialized successfully");
    }
    
    // Get cached sin value with automatic precision selection
    sin(angle, precision = 'medium') {
        if (!this.initialized) {
            return Math.sin(angle);
        }
        
        // Normalize angle to [0, TWO_PI]
        angle = this.normalizeAngle(angle);
        
        const cache = this.caches[precision + 'Precision'];
        if (!cache) {
            return Math.sin(angle);
        }
        
        const index = Math.round(angle / cache.stepSize) % cache.sin.length;
        return cache.sin[index];
    }
    
    // Get cached cos value with automatic precision selection
    cos(angle, precision = 'medium') {
        if (!this.initialized) {
            return Math.cos(angle);
        }
        
        // Normalize angle to [0, TWO_PI]
        angle = this.normalizeAngle(angle);
        
        const cache = this.caches[precision + 'Precision'];
        if (!cache) {
            return Math.cos(angle);
        }
        
        const index = Math.round(angle / cache.stepSize) % cache.cos.length;
        return cache.cos[index];
    }
    
    // Optimized sin for frame-based animations
    sinFrame(frameCount, multiplier = 0.05) {
        if (!this.initialized) {
            return Math.sin(frameCount * multiplier);
        }
        
        // Select appropriate cache based on multiplier
        let cache;
        if (Math.abs(multiplier - 0.05) < 0.001) {
            cache = this.animationCaches.frameCount005;
        } else if (Math.abs(multiplier - 0.1) < 0.001) {
            cache = this.animationCaches.frameCount01;
        } else if (Math.abs(multiplier - 0.02) < 0.001) {
            cache = this.animationCaches.frameCount002;
        } else {
            // Fallback for other multipliers
            return this.sin(frameCount * multiplier);
        }
        
        const index = Math.round(frameCount) % cache.sin.length;
        return cache.sin[index];
    }
    
    // Optimized cos for frame-based animations
    cosFrame(frameCount, multiplier = 0.05) {
        if (!this.initialized) {
            return Math.cos(frameCount * multiplier);
        }
        
        // Select appropriate cache based on multiplier
        let cache;
        if (Math.abs(multiplier - 0.05) < 0.001) {
            cache = this.animationCaches.frameCount005;
        } else if (Math.abs(multiplier - 0.1) < 0.001) {
            cache = this.animationCaches.frameCount01;
        } else if (Math.abs(multiplier - 0.02) < 0.001) {
            cache = this.animationCaches.frameCount002;
        } else {
            // Fallback for other multipliers
            return this.cos(frameCount * multiplier);
        }
        
        const index = Math.round(frameCount) % cache.cos.length;
        return cache.cos[index];
    }
    
    // Optimized sin for wing animations
    sinWing(angle) {
        if (!this.initialized) {
            return Math.sin(angle);
        }
        
        angle = this.normalizeAngle(angle);
        const index = Math.round(angle / this.wingCache.stepSize) % this.wingCache.sin.length;
        return this.wingCache.sin[index];
    }
    
    // Optimized cos for wing animations
    cosWing(angle) {
        if (!this.initialized) {
            return Math.cos(angle);
        }
        
        angle = this.normalizeAngle(angle);
        const index = Math.round(angle / this.wingCache.stepSize) % this.wingCache.cos.length;
        return this.wingCache.cos[index];
    }
    
    // Optimized sin for sway animations
    sinSway(angle) {
        if (!this.initialized) {
            return Math.sin(angle);
        }
        
        angle = this.normalizeAngle(angle);
        const index = Math.round(angle / this.swayCache.stepSize) % this.swayCache.sin.length;
        return this.swayCache.sin[index];
    }
    
    // Optimized cos for sway animations
    cosSway(angle) {
        if (!this.initialized) {
            return Math.cos(angle);
        }
        
        angle = this.normalizeAngle(angle);
        const index = Math.round(angle / this.swayCache.stepSize) % this.swayCache.cos.length;
        return this.swayCache.cos[index];
    }
    
    // Utility function to normalize angle to [0, TWO_PI]
    normalizeAngle(angle) {
        while (angle < 0) angle += TWO_PI;
        while (angle >= TWO_PI) angle -= TWO_PI;
        return angle;
    }
    
    // Get cache statistics for debugging
    getStats() {
        const totalEntries = Object.values(this.caches).reduce((sum, cache) => sum + cache.sin.length, 0) +
                           Object.values(this.animationCaches).reduce((sum, cache) => sum + cache.sin.length, 0) +
                           this.wingCache.sin.length + this.swayCache.sin.length;
        
        return {
            initialized: this.initialized,
            totalCacheEntries: totalEntries,
            memoryUsageKB: Math.round(totalEntries * 8 * 2 / 1024), // 8 bytes per number, sin + cos
            caches: {
                precision: Object.keys(this.caches).map(key => ({
                    name: key,
                    entries: this.caches[key].sin.length,
                    stepSize: this.caches[key].stepSize
                })),
                animation: Object.keys(this.animationCaches).map(key => ({
                    name: key,
                    entries: this.animationCaches[key].sin.length,
                    multiplier: this.animationCaches[key].frameMultiplier
                })),
                wing: { entries: this.wingCache.sin.length },
                sway: { entries: this.swayCache.sin.length }
            }
        };
    }
}

// Global instance
let trigCache = null;

// Initialize the global cache
function initializeTrigCache() {
    if (!trigCache) {
        trigCache = new TrigCache();
        trigCache.initialize();
    }
    return trigCache;
}

// Convenience functions for global access
function sin(angle, precision = 'medium') {
    return trigCache ? trigCache.sin(angle, precision) : Math.sin(angle);
}

function cos(angle, precision = 'medium') {
    return trigCache ? trigCache.cos(angle, precision) : Math.cos(angle);
}

function sinFrame(frameCount, multiplier = 0.05) {
    return trigCache ? trigCache.sinFrame(frameCount, multiplier) : Math.sin(frameCount * multiplier);
}

function cosFrame(frameCount, multiplier = 0.05) {
    return trigCache ? trigCache.cosFrame(frameCount, multiplier) : Math.cos(frameCount * multiplier);
}

function sinWing(angle) {
    return trigCache ? trigCache.sinWing(angle) : Math.sin(angle);
}

function cosWing(angle) {
    return trigCache ? trigCache.cosWing(angle) : Math.cos(angle);
}

function sinSway(angle) {
    return trigCache ? trigCache.sinSway(angle) : Math.sin(angle);
}

function cosSway(angle) {
    return trigCache ? trigCache.cosSway(angle) : Math.cos(angle);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TrigCache,
        initializeTrigCache,
        sin, cos, sinFrame, cosFrame, sinWing, cosWing, sinSway, cosSway
    };
}