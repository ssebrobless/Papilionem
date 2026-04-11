// Minimal p5.js sketch - delegates to GameCore for all game logic
let backgroundImage;
let titleImage;
let foliageImage;
let groundWaveImage;
let spawnCoverImage;
let showTitleScreen = true;
let titleFadeAlpha = 255;
let titleFading = false;
const TITLE_FADE_PER_SECOND = 180;

function preload() {
    backgroundImage = loadImage('background2.png');
    titleImage = loadImage('assets/newtitle.png');
    foliageImage = loadImage('assets/ephemera-background-moving-leaves-effect.png');
    groundWaveImage = loadImage('assets/ephemera-background-waving-effect.png');
    spawnCoverImage = loadImage('assets/ephemera-background-spawn covers.png');
    spriteManager.preloadAssets();
}

function setup() {
    const container = select('#canvas-container');
    
    const canvas = createCanvas(gameConfig.canvas.targetWidth, gameConfig.canvas.targetHeight);
    canvas.parent(container);
    
    // The default 2D renderer already handles text smoothing; p5's setAttributes
    // helper is for WEBGL contexts and spams warnings when used with createGraphics layers.
    
    // Set target frame rate to 60 FPS
    frameRate(60);
    
    // Use pixel density of 1 for better performance
    // (displayDensity() can be 2 on retina displays, causing 4x pixel rendering)
    pixelDensity(2);
    
    // Keep pixel art aesthetic with nearest neighbor scaling for sprites only
    // Don't apply noSmooth() globally to allow better text rendering
    // Individual elements will apply noSmooth() as needed
    
    // Initialize sprite assets (wing slicing + transparency processing)
    spriteManager.initialize();

    // Initialize foliage overlay (leaf rustling effect)
    if (foliageImage) {
        renderManager.setFoliageImage(foliageImage);
    }

    // Initialize ground wave overlay (grass waving effect)
    if (groundWaveImage) {
        renderManager.setGroundWaveImage(groundWaveImage);
    }

    // Initialize spawn cover overlay (stone archways)
    if (spawnCoverImage) {
        renderManager.setSpawnCoverImage(spawnCoverImage);
    }

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
    // Update game only if title screen is not showing or is fading
    if (!showTitleScreen || titleFading) {
        gameCore.update();
    }
    
    // Always draw the game for cross-fade effect
    gameCore.draw();
    
    // Draw title screen on top if active
    if (showTitleScreen) {
        // Draw title image centered
        if (titleImage) {
            push();
            imageMode(CENTER);
            tint(255, titleFadeAlpha);
            
            // Draw image to fill entire canvas
            image(titleImage, width / 2, height / 2, width, height);
            pop();
        }
        
        // Handle fade out
        if (titleFading) {
            const fadeStep = TITLE_FADE_PER_SECOND * Math.max(0, deltaTime || 0) / 1000;
            titleFadeAlpha -= fadeStep;
            if (titleFadeAlpha <= 0) {
                titleFadeAlpha = 0;
                showTitleScreen = false;
                titleFading = false;
            }
        }
    }
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
    // Handle title screen click
    if (showTitleScreen && !titleFading) {
        titleFading = true;
        return;
    }
    
    // Only process game input if title screen is not showing
    if (!showTitleScreen) {
        // Check debug UI god mode buttons first
        if (typeof debugUI !== 'undefined' && debugUI.enabled) {
            if (debugUI.handleMouseClick(mouseX, mouseY)) {
                return; // Button handled the click
            }
        }
        
        // Handle normal game mouse input
        gameCore.handleMousePressed();
    }
}

function keyPressed() {
    // Handle title screen - any key starts the fade
    if (showTitleScreen && !titleFading) {
        titleFading = true;
        return;
    }
    
    // Only process key input if title screen is not showing
    if (!showTitleScreen) {
        // Delegate to GameCore
        gameCore.handleKeyPressed(key, keyCode);
    }
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
    // Use unified config system - no fallbacks to prevent drift
    const centerX = gameConfig.canvas.baseWidth / 2;
    const centerY = gameConfig.canvas.baseHeight / 2;
    
    // Convert to relative position from center
    const relX = x - centerX;
    const relY = y - centerY;
    
    // Check if within diamond bounds (simplified)
    const maxDist = 250; // Approximate playable area radius
    return Math.abs(relX) + Math.abs(relY * 2) < maxDist;
}
