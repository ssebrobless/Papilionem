// Minimal p5.js sketch - delegates to GameCore for all game logic
let backgroundImage;

function preload() {
    backgroundImage = loadImage('background2.png');
}

function setup() {
    const container = select('#canvas-container');
    const canvas = createCanvas(gameConfig.canvas.targetWidth, gameConfig.canvas.targetHeight);
    canvas.parent(container);
    
    // Use display's native pixel density for crisp rendering
    pixelDensity(displayDensity());
    
    // Keep pixel art aesthetic with nearest neighbor scaling
    noSmooth();
    
    // Initialize game systems
    gameCore.initialize(backgroundImage).then(() => {
        console.log('Game fully initialized');
        // Handle initial window resize after initialization completes
        // Use setTimeout to ensure all initialization is fully complete
        setTimeout(() => {
            if (gameCore.isInitialized()) {
                windowResized();
            }
        }, 10);
    }).catch(error => {
        console.error('Game initialization failed:', error);
    });
}

function draw() {
    // Delegate to GameCore
    gameCore.update();
    gameCore.draw();
}

function windowResized() {
    // Only delegate to GameCore if it's initialized
    if (gameCore && gameCore.isInitialized()) {
        gameCore.handleWindowResize();
    } else {
        console.log('Sketch: Skipping window resize - GameCore not ready');
    }
}

function mousePressed() {
    // Delegate to GameCore
    gameCore.handleMousePressed();
}

function keyPressed() {
    // Delegate to GameCore
    gameCore.handleKeyPressed(key, keyCode);
}

// Global helper function to check if screen coordinates are within the playable area
// Used by various systems for boundary checking
function isWithinPlayableArea(x, y) {
    // Use gridManager if available
    if (typeof gridManager !== 'undefined' && gridManager.screenToIso) {
        const gridPos = gridManager.screenToIso(x, y);
        return gridManager.isInBounds(gridPos.x, gridPos.y);
    }
    
    // Fallback: define a diamond-shaped playable area based on the isometric grid
    const config = window.gameConfig || { canvas: { baseWidth: 800, baseHeight: 450 }};
    const centerX = config.canvas.baseWidth / 2;
    const centerY = config.canvas.baseHeight / 2;
    
    // Convert to relative position from center
    const relX = x - centerX;
    const relY = y - centerY;
    
    // Check if within diamond bounds (simplified)
    const maxDist = 250; // Approximate playable area radius
    return Math.abs(relX) + Math.abs(relY * 2) < maxDist;
}