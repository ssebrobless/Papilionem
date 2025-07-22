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
    }).catch(error => {
        console.error('Game initialization failed:', error);
    });
    
    // Handle initial window resize
    windowResized();
}

function draw() {
    // Delegate to GameCore
    gameCore.update();
    gameCore.draw();
}

function windowResized() {
    // Delegate to GameCore
    gameCore.handleWindowResize();
}

function mousePressed() {
    // Delegate to GameCore
    gameCore.handleMousePressed();
}

function keyPressed() {
    // Delegate to GameCore
    gameCore.handleKeyPressed(key, keyCode);
}