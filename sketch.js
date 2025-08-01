// Minimal p5.js sketch - delegates to GameCore for all game logic
let backgroundImage;
let titleImage;
let showTitleScreen = true;
let titleFadeAlpha = 255;
let titleFading = false;

// End game sequence variables
let endGameTriggered = false;
let endGamePhase = 'none'; // 'fadeOut', 'black', 'fadeIn'
let endGameTimer = 0;
let endGameFadeAlpha = 0;
let endGameMessage = "The garden is complete...";

function preload() {
    backgroundImage = loadImage('background2.png');
    titleImage = loadImage('title.png');
}

function setup() {
    const container = select('#canvas-container');
    
    // Enable antialiasing for better text quality
    setAttributes({ antialias: true });
    
    const canvas = createCanvas(gameConfig.canvas.targetWidth, gameConfig.canvas.targetHeight);
    canvas.parent(container);
    
    // Set target frame rate to 60 FPS
    frameRate(60);
    
    // Use pixel density of 1 for better performance
    // (displayDensity() can be 2 on retina displays, causing 4x pixel rendering)
    pixelDensity(2);
    
    // Keep pixel art aesthetic with nearest neighbor scaling for sprites only
    // Don't apply noSmooth() globally to allow better text rendering
    // Individual elements will apply noSmooth() as needed
    
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
        
        // Set up end game listener
        setupEndGameListener();
    }).catch(error => {
        console.error('Game initialization failed:', error);
    });
}

// Set up listener for golden butterfly collection
function setupEndGameListener() {
    if (typeof eventBus !== 'undefined') {
        eventBus.on('butterfly:collected', (data) => {
            if (data.type === 'golden' && !endGameTriggered) {
                console.log('🌟 GOLDEN BUTTERFLY COLLECTED! Starting end game sequence...');
                triggerEndGame();
            }
        });
    }
}

// Start the end game sequence
function triggerEndGame() {
    endGameTriggered = true;
    endGamePhase = 'fadeOut';
    endGameTimer = 0;
    endGameFadeAlpha = 0;
    console.log('🎭 End game sequence initiated');
}

// Reset the game to initial state
function resetGame() {
    console.log('🔄 Resetting game state...');
    
    // Reset end game variables
    endGameTriggered = false;
    endGamePhase = 'none';
    endGameTimer = 0;
    endGameFadeAlpha = 0;
    
    // Reset title screen variables
    showTitleScreen = true;
    titleFadeAlpha = 255;
    titleFading = false;
    
    // Reset game core if it exists
    if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
        gameCore.resetGame();
    }
    
    console.log('✨ Game reset complete');
}

function draw() {
    // Handle end game sequence
    if (endGameTriggered) {
        updateEndGameSequence();
        drawEndGameSequence();
        return;
    }
    
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
            image(titleImage, width/2, height/2, width, height);
            pop();
        }
        
        // Handle fade out
        if (titleFading) {
            titleFadeAlpha -= 3; // Slower fade for smooth cross-fade
            if (titleFadeAlpha <= 0) {
                showTitleScreen = false;
                titleFading = false;
            }
        }
    }
}

// Update end game sequence logic
function updateEndGameSequence() {
    endGameTimer++;
    
    switch (endGamePhase) {
        case 'fadeOut':
            // Fade to black over 3 seconds (180 frames at 60fps)
            endGameFadeAlpha = map(endGameTimer, 0, 180, 0, 255);
            if (endGameTimer >= 180) {
                endGamePhase = 'black';
                endGameTimer = 0;
                endGameFadeAlpha = 255;
            }
            break;
            
        case 'black':
            // Stay black for 2 seconds (120 frames)
            if (endGameTimer >= 120) {
                endGamePhase = 'fadeIn';
                endGameTimer = 0;
            }
            break;
            
        case 'fadeIn':
            // Fade back to title screen over 3 seconds
            endGameFadeAlpha = map(endGameTimer, 0, 180, 255, 0);
            if (endGameTimer >= 180) {
                // End game sequence complete - reset everything
                resetGame();
            }
            break;
    }
}

// Draw end game sequence
function drawEndGameSequence() {
    // Continue drawing the game underneath
    if (endGamePhase === 'fadeOut') {
        gameCore.draw();
    } else if (endGamePhase === 'fadeIn') {
        // Draw title screen underneath for fade in
        if (titleImage) {
            push();
            imageMode(CENTER);
            image(titleImage, width/2, height/2, width, height);
            pop();
        }
    }
    
    // Draw end game message during black phase
    if (endGamePhase === 'black') {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(24);
        text(endGameMessage, width/2, height/2);
    }
    
    // Draw fade overlay
    if (endGameFadeAlpha > 0) {
        fill(0, 0, 0, endGameFadeAlpha);
        rect(0, 0, width, height);
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