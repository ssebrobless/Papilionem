// Centralized game configuration
const gameConfig = {
    // Canvas settings
    canvas: {
        baseWidth: 800,
        baseHeight: 450,
        targetWidth: 800,
        targetHeight: 450,
        backgroundColor: '#f4e8dc'
    },
    
    // Grid settings
    grid: {
        cellSize: 16,  // Restored original working value
        gridWidth: 18,
        gridHeight: 18,
        debugGridSize: 32, // For debug mode display
        // Grid offset to align with background image
        gridOffset: {
            x: 10,   // Move grid up and left to fix "one too high" issue
            y: 8    // Reduced from previous values
        }
    },
    
    // Isometric view settings
    isometric: {
        tileWidth: 18,
        tileHeight: 9,
        offsetX: 400, // Center of canvas
        offsetY: 100,
        bounds: {
            minX: 0,
            maxX: 17,
            minY: 0,
            maxY: 17
        }
    },
    
    // Entity settings
    entities: {
        maxButterflies: 12,
        maxFlowers: 6,
        
        // Height offsets for isometric depth
        heightOffset: {
            butterfly: 10,
            flower: 0,
            pixel: 0
        },
        
        // Butterfly configuration
        butterfly: {
            size: 12,
            speed: 0.008,
            wanderTimer: { min: 40, max: 90 },
            maxWanderDistance: 3,
            lifetime: 10000,
            personalities: ['brave', 'cautious', 'curious'],
            colors: [
                [[255, 140, 60], [255, 220, 120]],   // Orange/yellow
                [[220, 100, 150], [255, 180, 200]],  // Pink/coral
                [[150, 120, 200], [200, 170, 255]],  // Purple/lavender
                [[100, 180, 140], [150, 220, 180]]   // Teal/mint
            ]
        },
        
        // Flower configuration
        flower: {
            types: ['daisy', 'tulip', 'rose', 'sunflower', 'lily'],
            stemHeight: 16,
            stageDurations: {
                bloom: 600,     // 10 seconds at 60fps
                mature: 1200,   // 20 seconds
                wilting: 600,   // 10 seconds
                dissolve: 180   // 3 seconds
            },
            pollenCooldown: 180,
            palettes: [
                { petals: [255, 180, 120], center: [255, 240, 180] }, // Warm orange
                { petals: [255, 150, 200], center: [255, 255, 220] }, // Pink
                { petals: [200, 150, 255], center: [255, 230, 150] }, // Purple
                { petals: [255, 220, 150], center: [255, 255, 200] }, // Yellow
                { petals: [180, 220, 255], center: [255, 255, 240] }  // Light blue
            ]
        }
    },
    
    // Particle system settings
    particles: {
        maxParticles: 100,
        gravity: 0.1,
        pixelSize: 2,
        bounce: 0.3,
        friction: 0.99,
        
        // Particle types
        types: {
            scale: {
                lifetime: -1, // Infinite until settled
                fadeSpeed: 0
            },
            joy: {
                lifetime: 255,
                fadeSpeed: 2
            },
            pollen: {
                lifetime: 400,
                fadeSpeed: 1
            },
            stress: {
                lifetime: 180, // Shorter lifetime than joy pixels
                fadeSpeed: 3   // Faster fade than joy pixels (more frantic)
            },
            happy: {
                lifetime: -1, // Infinite lifetime until absorbed
                fadeSpeed: 0  // No fade for happy pixels
            }
        }
    },
    
    // Color pool settings
    colorPools: {
        radius: 20,
        requiredPixels: 50,
        pulseSpeed: 0.1,
        spawnDelay: 180, // 3 seconds
        gridSize: 40
    },
    
    // Interaction settings
    interaction: {
        stillFramesRequired: 120, // 2 seconds for gentle hover
        cursorZoneRadius: 30,
        plantingPollenRequired: 5,
        
        // Butterfly interaction zones
        butterflyZones: {
            brave: {
                comfort: 60,
                flee: 40
            },
            cautious: {
                comfort: 100,
                flee: 80
            },
            curious: {
                comfort: 80,
                flee: 60
            }
        }
    },
    
    // Visual effects
    effects: {
        shadowOpacity: 50,
        glowPulseSpeed: 0.1,
        swaySpeed: { min: 0.02, max: 0.03 },
        swayAmount: 0.1
    },
    
    // Debug mode settings
    debug: {
        enabled: false,
        showGrid: true,
        showZones: true,
        showCoordinates: true,
        showFPS: true
    }
};

// Helper function to get nested config values
function getConfig(path) {
    return path.split('.').reduce((obj, key) => obj[key], gameConfig);
}

// Helper function to update config values
function setConfig(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], gameConfig);
    target[lastKey] = value;
}