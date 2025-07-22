const config = {
    baseWidth: 800,
    baseHeight: 450,
    targetWidth: 800,
    targetHeight: 450,
    backgroundColor: '#f4e8dc',
    maxParticles: 150,
    gravity: 0.08,    // Gentler gravity for isometric view
    pixelSize: 3,     // Larger pixels for visibility
    gridSize: 16,     // Finer grid - each old tile is now 4 tiles
    // Isometric playable area boundaries (in grid units)
    isoBounds: {
        maxX: 18,    // Maximum X coordinate (right edge) - doubled for finer grid
        maxY: 18     // Maximum Y coordinate (bottom edge) - doubled for finer grid
    },
    // Grid offset to align with background image
    gridOffset: {
        x: 8,        // Doubled for finer grid
        y: 8         // Doubled for finer grid
    },
    entityHeightOffset: {
        butterfly: 12,  // Butterflies float gently above ground
        flower: 0       // Flowers sit on the ground
    }
};

let backgroundImage;

let gameState = {
    butterflies: [],
    flowers: [],
    particleSystem: null,
    poolManager: null,
    flowerManager: null,
    cursorVelocity: 0,
    lastCursorX: 0,
    lastCursorY: 0,
    framesSinceMovement: 0
};

let debugMode = {
    enabled: false,
    cursorX: 0,
    cursorY: 0,
    selectedTool: 'butterfly',
    tools: ['butterfly', 'flower', 'walkable', 'blocked'],
    walkableTiles: new Set(), // Set of "x,y" strings for walkable tiles
    blockedTiles: new Set(),  // Set of "x,y" strings for blocked tiles
};

let canvasScale = 1;
let canvasOffsetX = 0;
let canvasOffsetY = 0;

let layers = {
    background: null,
    entities: null,
    particles: null,
    ui: null
};

function preload() {
    backgroundImage = loadImage('background.png');
}

function setup() {
    const container = select('#canvas-container');
    const canvas = createCanvas(config.targetWidth, config.targetHeight);
    canvas.parent(container);
    
    pixelDensity(1);
    noSmooth();
    
    gameState.particleSystem = new ParticleSystem();
    gameState.poolManager = new PoolManager();
    gameState.flowerManager = new FlowerManager();
    
    initializeLayers();
    drawBackground();
    
    initializeEntities();
    
    windowResized();
}

function initializeEntities() {
    // Richer, more saturated colors matching the background palette
    const butterflyColors = [
        [[255, 140, 60], [255, 220, 120]],   // Orange/yellow like the flowers
        [[220, 100, 150], [255, 180, 200]],  // Pink/coral
        [[150, 120, 200], [200, 170, 255]],  // Purple/lavender
        [[100, 180, 140], [150, 220, 180]]   // Teal/mint
    ];
    
    // Place butterflies using grid coordinates - start them centrally
    for (let i = 0; i < 2; i++) {
        const gridX = random(6, 12);  // Adjusted for finer grid
        const gridY = random(6, 12);  // Adjusted for finer grid
        const screenPos = isoToScreen(gridX, gridY);
        const colors = random(butterflyColors);
        // Butterflies float above ground
        gameState.butterflies.push(new Butterfly(
            screenPos.x, 
            screenPos.y - config.entityHeightOffset.butterfly, 
            colors
        ));
    }
    
    // Create initial color pool near bottom of playable area
    const poolGridX = 9 + random(-2, 2);  // Adjusted for finer grid
    const poolGridY = 14;  // Adjusted for finer grid
    const poolScreenPos = isoToScreen(poolGridX, poolGridY);
    const pool = gameState.poolManager.findOrCreatePool(poolScreenPos.x, poolScreenPos.y);
    
    if (pool) {
        const poolColor = random(butterflyColors)[0];
        for (let i = 0; i < 45; i++) {
            pool.addPixel({
                x: poolScreenPos.x + random(-15, 15),
                y: poolScreenPos.y + random(-15, 15),
                color: poolColor
            });
        }
    }
    
    // Place initial flower
    const flowerScreenPos = isoToScreen(6, 8);  // Adjusted for finer grid
    gameState.flowers.push(new Flower(
        flowerScreenPos.x,
        flowerScreenPos.y  // isoToScreen already includes ground level
    ));
}

function initializeLayers() {
    layers.background = createGraphics(config.baseWidth, config.baseHeight);
    layers.entities = createGraphics(config.baseWidth, config.baseHeight);
    layers.particles = createGraphics(config.baseWidth, config.baseHeight);
    layers.ui = createGraphics(config.baseWidth, config.baseHeight);
    
    layers.background.pixelDensity(1);
    layers.entities.pixelDensity(1);
    layers.particles.pixelDensity(1);
    layers.ui.pixelDensity(1);
}

function drawBackground() {
    layers.background.push();
    
    if (backgroundImage) {
        layers.background.image(backgroundImage, 0, 0, config.baseWidth, config.baseHeight);
    } else {
        layers.background.fill(config.backgroundColor);
        layers.background.rect(0, 0, config.baseWidth, config.baseHeight);
    }
    
    layers.background.pop();
}

function draw() {
    background(0);
    
    layers.entities.clear();
    layers.particles.clear();
    layers.ui.clear();
    
    updateCursorTracking();
    
    updateEntities();
    gameState.particleSystem.update();
    gameState.poolManager.update(gameState.particleSystem, gameState.butterflies);
    gameState.flowerManager.update(gameState.flowers, gameState.butterflies, gameState.particleSystem);
    
    drawEntitiesLayer();
    drawParticlesLayer();
    drawUILayer();
    
    // Draw all layers scaled to fill the canvas
    image(layers.background, 0, 0, config.targetWidth, config.targetHeight);
    blendMode(MULTIPLY);
    image(layers.entities, 0, 0, config.targetWidth, config.targetHeight);
    blendMode(BLEND);
    image(layers.particles, 0, 0, config.targetWidth, config.targetHeight);
    image(layers.ui, 0, 0, config.targetWidth, config.targetHeight);
    
    drawDebugInfo();
}

function updateEntities() {
    const adjustedMouseX = mouseX * (config.baseWidth / config.targetWidth);
    const adjustedMouseY = mouseY * (config.baseHeight / config.targetHeight);
    
    for (let i = gameState.butterflies.length - 1; i >= 0; i--) {
        const butterfly = gameState.butterflies[i];
        butterfly.update(
            adjustedMouseX, 
            adjustedMouseY, 
            gameState.cursorVelocity,
            gameState.framesSinceMovement,
            gameState.flowers,
            gameState.particleSystem
        );
        
        if (butterfly.isDead()) {
            const fadeColors = butterfly.colors.map(c => 
                [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8]
            );
            gameState.particleSystem.emitBurst(
                butterfly.x, 
                butterfly.y, 
                random(fadeColors), 
                10
            );
            gameState.butterflies.splice(i, 1);
        }
    }
}

function drawEntitiesLayer() {
    layers.entities.push();
    
    // Collect all entities for depth sorting
    let entities = [];
    
    for (let flower of gameState.flowers) {
        entities.push({
            obj: flower,
            y: flower.y,
            type: 'flower'
        });
    }
    
    for (let butterfly of gameState.butterflies) {
        entities.push({
            obj: butterfly,
            y: butterfly.y,
            type: 'butterfly'
        });
    }
    
    // Sort by y position (draw back to front)
    entities.sort((a, b) => a.y - b.y);
    
    // Draw in sorted order
    for (let entity of entities) {
        entity.obj.draw(layers.entities);
    }
    
    layers.entities.pop();
}

function drawParticlesLayer() {
    layers.particles.push();
    
    gameState.poolManager.draw(layers.particles);
    gameState.particleSystem.draw(layers.particles);
    
    layers.particles.pop();
}

function drawUILayer() {
    layers.ui.push();
    
    const adjustedMouseX = mouseX * (config.baseWidth / config.targetWidth);
    const adjustedMouseY = mouseY * (config.baseHeight / config.targetHeight);
    
    if (!debugMode.enabled) {
        if (gameState.framesSinceMovement > 60) {
            // Pixel art style cursor hint - rotating square
            layers.ui.push();
            layers.ui.translate(adjustedMouseX, adjustedMouseY);
            layers.ui.rotate(frameCount * 0.02);
            layers.ui.noFill();
            layers.ui.stroke(255, 255, 255, 80);
            layers.ui.strokeWeight(2);
            const size = 20 + sin(frameCount * 0.05) * 4;
            // Draw pixelated diamond shape
            layers.ui.beginShape();
            layers.ui.vertex(0, -size);
            layers.ui.vertex(size, 0);
            layers.ui.vertex(0, size);
            layers.ui.vertex(-size, 0);
            layers.ui.endShape(CLOSE);
            layers.ui.pop();
        }
        
        gameState.flowerManager.drawPlantingHint(layers.ui, adjustedMouseX, adjustedMouseY, gameState.flowers);
    } else {
        drawDebugOverlays();
    }
    
    // Boundary zones can be shown in any mode
    if (keyIsDown(66)) { // Hold 'B' to see boundary zones
        drawBoundaryZones();
    }
    
    layers.ui.pop();
}

function drawDebugOverlays() {
    drawIsometricGrid();
    drawTileStates();
    drawDebugCursor();
    drawDebugUI();
}

// Helper function to convert isometric grid coordinates to screen coordinates
function isoToScreen(gridX, gridY) {
    const tileWidth = config.gridSize * 2;
    const tileHeight = config.gridSize;
    
    // Apply grid offset to align with background
    const offsetX = gridX + config.gridOffset.x;
    const offsetY = gridY + config.gridOffset.y;
    
    const screenX = (offsetX - offsetY) * tileWidth / 2 + config.baseWidth / 2;
    const screenY = (offsetX + offsetY) * tileHeight / 2;
    
    return { x: screenX, y: screenY + tileHeight / 2 };
}

// Helper function to convert screen coordinates to grid coordinates
function screenToIso(screenX, screenY) {
    const tileWidth = config.gridSize * 2;
    const tileHeight = config.gridSize;
    
    // Adjust for tile height offset
    screenY -= tileHeight / 2;
    
    // Convert from screen to isometric
    const offsetX = screenX - config.baseWidth / 2;
    const offsetY = screenY;
    
    // Inverse of isometric transformation
    const isoX = (2 * offsetY + offsetX) / tileWidth;
    const isoY = (2 * offsetY - offsetX) / tileWidth;
    
    // Remove grid offset
    return {
        x: (isoX + isoY) / 2 - config.gridOffset.x,
        y: (isoY - isoX) / 2 - config.gridOffset.y
    };
}

// Helper function to check if a screen position is within the isometric playable area
function isWithinPlayableArea(screenX, screenY) {
    // Get the four corners of the playable area
    const topCorner = isoToScreen(0, 0);
    const rightCorner = isoToScreen(config.isoBounds.maxX, 0);
    const bottomCorner = isoToScreen(config.isoBounds.maxX, config.isoBounds.maxY);
    const leftCorner = isoToScreen(0, config.isoBounds.maxY);
    
    // Create a simple point-in-diamond test
    // This is a rough approximation - for exact testing we'd need proper polygon testing
    const centerX = (topCorner.x + bottomCorner.x) / 2;
    const centerY = (topCorner.y + bottomCorner.y) / 2;
    const halfWidth = (rightCorner.x - leftCorner.x) / 2;
    const halfHeight = (bottomCorner.y - topCorner.y) / 2;
    
    // Normalize position relative to center
    const normalX = Math.abs(screenX - centerX) / halfWidth;
    const normalY = Math.abs(screenY - centerY) / halfHeight;
    
    // Point is inside diamond if sum is less than 1
    return (normalX + normalY) < 1;
}

function drawIsometricGrid() {
    layers.ui.stroke(255, 255, 255, 30);
    layers.ui.strokeWeight(1);
    
    const bounds = config.isoBounds;
    
    // Draw boundary outline
    layers.ui.stroke(255, 200, 100, 100);
    layers.ui.strokeWeight(2);
    layers.ui.noFill();
    
    // Calculate the four corners of the playable area
    const topCorner = isoToScreen(0, 0);
    const rightCorner = isoToScreen(bounds.maxX, 0);
    const bottomCorner = isoToScreen(bounds.maxX, bounds.maxY);
    const leftCorner = isoToScreen(0, bounds.maxY);
    
    const boundaryPoints = [
        [topCorner.x, topCorner.y],
        [rightCorner.x, rightCorner.y],
        [bottomCorner.x, bottomCorner.y],
        [leftCorner.x, leftCorner.y]
    ];
    
    layers.ui.beginShape();
    for (let point of boundaryPoints) {
        layers.ui.vertex(point[0], point[1]);
    }
    layers.ui.endShape(CLOSE);
    
    // Draw grid lines within bounds
    layers.ui.strokeWeight(1);
    
    // Lines going right-down (constant Y)
    for (let y = 0; y <= bounds.maxY; y++) {
        // Draw major grid lines (every 2 units) stronger
        if (y % 2 === 0) {
            layers.ui.stroke(255, 255, 255, 40);
        } else {
            layers.ui.stroke(255, 255, 255, 20);
        }
        const start = isoToScreen(0, y);
        const end = isoToScreen(bounds.maxX, y);
        layers.ui.line(start.x, start.y, end.x, end.y);
    }
    
    // Lines going left-down (constant X)
    for (let x = 0; x <= bounds.maxX; x++) {
        // Draw major grid lines (every 2 units) stronger
        if (x % 2 === 0) {
            layers.ui.stroke(255, 255, 255, 40);
        } else {
            layers.ui.stroke(255, 255, 255, 20);
        }
        const start = isoToScreen(x, 0);
        const end = isoToScreen(x, bounds.maxY);
        layers.ui.line(start.x, start.y, end.x, end.y);
    }
}

function drawTileStates() {
    // Draw walkable tiles
    layers.ui.fill(100, 255, 100, 50);
    layers.ui.noStroke();
    for (let tileKey of debugMode.walkableTiles) {
        const [x, y] = tileKey.split(',').map(Number);
        drawIsometricTile(x, y);
    }
    
    // Draw blocked tiles
    layers.ui.fill(255, 100, 100, 50);
    layers.ui.noStroke();
    for (let tileKey of debugMode.blockedTiles) {
        const [x, y] = tileKey.split(',').map(Number);
        drawIsometricTile(x, y);
    }
}

function drawIsometricTile(gridX, gridY) {
    const screenPos = isoToScreen(gridX, gridY);
    const tileWidth = config.gridSize * 2;
    const tileHeight = config.gridSize;
    
    layers.ui.beginShape();
    layers.ui.vertex(screenPos.x, screenPos.y);
    layers.ui.vertex(screenPos.x + tileWidth / 2, screenPos.y + tileHeight / 2);
    layers.ui.vertex(screenPos.x, screenPos.y + tileHeight);
    layers.ui.vertex(screenPos.x - tileWidth / 2, screenPos.y + tileHeight / 2);
    layers.ui.endShape(CLOSE);
}

function drawDebugCursor() {
    const screenPos = isoToScreen(debugMode.cursorX, debugMode.cursorY);
    const tileWidth = config.gridSize * 2;
    const tileHeight = config.gridSize;
    
    layers.ui.noFill();
    layers.ui.stroke(255, 255, 255, 200);
    layers.ui.strokeWeight(2);
    
    // Draw isometric tile cursor for all tools
    layers.ui.beginShape();
    layers.ui.vertex(screenPos.x, screenPos.y);
    layers.ui.vertex(screenPos.x + tileWidth / 2, screenPos.y + tileHeight / 2);
    layers.ui.vertex(screenPos.x, screenPos.y + tileHeight);
    layers.ui.vertex(screenPos.x - tileWidth / 2, screenPos.y + tileHeight / 2);
    layers.ui.endShape(CLOSE);
    
    // Show tool-specific visual feedback
    const toolColors = {
        butterfly: [255, 150, 100],
        flower: [150, 255, 150],
        walkable: [100, 255, 100],
        blocked: [255, 100, 100]
    };
    
    if (toolColors[debugMode.selectedTool]) {
        layers.ui.fill(...toolColors[debugMode.selectedTool], 50);
        layers.ui.noStroke();
        layers.ui.beginShape();
        layers.ui.vertex(screenPos.x, screenPos.y);
        layers.ui.vertex(screenPos.x + tileWidth / 2, screenPos.y + tileHeight / 2);
        layers.ui.vertex(screenPos.x, screenPos.y + tileHeight);
        layers.ui.vertex(screenPos.x - tileWidth / 2, screenPos.y + tileHeight / 2);
        layers.ui.endShape(CLOSE);
    }
}

function drawDebugUI() {
    layers.ui.fill(0, 0, 0, 150);
    layers.ui.noStroke();
    layers.ui.rect(10, 10, 250, 195);
    
    layers.ui.fill(255);
    layers.ui.textAlign(LEFT);
    layers.ui.text('DEBUG MODE (D to toggle)', 15, 25);
    layers.ui.text(`Cursor: ${debugMode.cursorX}, ${debugMode.cursorY}`, 15, 45);
    layers.ui.text(`Tool: ${debugMode.selectedTool}`, 15, 65);
    layers.ui.text('Arrow keys: Move cursor', 15, 85);
    layers.ui.text('Q/E: Change tool', 15, 105);
    
    if (debugMode.selectedTool === 'walkable' || debugMode.selectedTool === 'blocked') {
        layers.ui.text('Space: Toggle tile state', 15, 125);
    } else {
        layers.ui.text('Space: Place entity', 15, 125);
    }
    
    layers.ui.text('X: Export data', 15, 145);
    
    // Show bounds configuration info
    layers.ui.textSize(10);
    layers.ui.fill(200);
    layers.ui.text(`Bounds: (0,0) to (${config.isoBounds.maxX},${config.isoBounds.maxY})`, 15, 165);
    layers.ui.text(`Grid: ${config.gridSize}px tiles`, 15, 180);
}

function updateCursorTracking() {
    const adjustedMouseX = mouseX * (config.baseWidth / config.targetWidth);
    const adjustedMouseY = mouseY * (config.baseHeight / config.targetHeight);
    
    const dx = adjustedMouseX - gameState.lastCursorX;
    const dy = adjustedMouseY - gameState.lastCursorY;
    gameState.cursorVelocity = sqrt(dx * dx + dy * dy);
    
    if (gameState.cursorVelocity < 0.5) {
        gameState.framesSinceMovement++;
    } else {
        gameState.framesSinceMovement = 0;
    }
    
    gameState.lastCursorX = adjustedMouseX;
    gameState.lastCursorY = adjustedMouseY;
}

function drawDebugInfo() {
    if (debugMode.enabled) return;
    
    push();
    noStroke();
    fill(150);
    textAlign(LEFT);
    text(`Cursor velocity: ${gameState.cursorVelocity.toFixed(2)}`, 10, 20);
    text(`Still frames: ${gameState.framesSinceMovement}`, 10, 35);
    text(`Pollen: ${gameState.flowerManager.pollenCount}/5`, 10, 50);
    text(`FPS: ${frameRate().toFixed(0)}`, 10, 65);
    text(`Press D for Debug Mode`, 10, 80);
    text(`Hold B to see boundary zones`, 10, 95);
    pop();
}

function drawBoundaryZones() {
    layers.ui.push();
    
    // Draw expanding boundary zones
    const bounds = config.isoBounds;
    
    // Get corners of playable area
    const corners = [
        isoToScreen(0, 0),
        isoToScreen(bounds.maxX, 0),
        isoToScreen(bounds.maxX, bounds.maxY),
        isoToScreen(0, bounds.maxY)
    ];
    
    // Draw zones at different distances
    const zones = [
        { dist: 0, color: [100, 255, 100, 50], label: "Safe" },
        { dist: 50, color: [255, 255, 100, 40], label: "Soft" },
        { dist: 100, color: [255, 150, 100, 30], label: "Hard" },
        { dist: 150, color: [255, 100, 100, 20], label: "Max" }
    ];
    
    layers.ui.noStroke();
    
    // Draw zones in reverse order (largest first)
    for (let i = zones.length - 1; i >= 0; i--) {
        const zone = zones[i];
        layers.ui.fill(...zone.color);
        
        // Create expanded diamond shape
        layers.ui.beginShape();
        for (let j = 0; j < corners.length; j++) {
            const corner = corners[j];
            const next = corners[(j + 1) % corners.length];
            
            // Calculate outward normal
            const dx = next.x - corner.x;
            const dy = next.y - corner.y;
            const len = sqrt(dx * dx + dy * dy);
            const nx = -dy / len * zone.dist;
            const ny = dx / len * zone.dist;
            
            layers.ui.vertex(corner.x + nx, corner.y + ny);
        }
        layers.ui.endShape(CLOSE);
    }
    
    layers.ui.pop();
}

function windowResized() {
    const availableWidth = windowWidth * 0.95;
    const availableHeight = windowHeight * 0.95;
    const baseAspect = config.baseWidth / config.baseHeight;
    const availableAspect = availableWidth / availableHeight;
    
    // Calculate new canvas size maintaining aspect ratio
    if (availableAspect > baseAspect) {
        config.targetHeight = availableHeight;
        config.targetWidth = availableHeight * baseAspect;
    } else {
        config.targetWidth = availableWidth;
        config.targetHeight = availableWidth / baseAspect;
    }
    
    // Calculate scale from base to target
    canvasScale = config.targetWidth / config.baseWidth;
    
    // Center the canvas
    canvasOffsetX = (windowWidth - config.targetWidth) / 2;
    canvasOffsetY = (windowHeight - config.targetHeight) / 2;
    
    // Resize the actual canvas
    resizeCanvas(config.targetWidth, config.targetHeight);
    
    // Recreate layers at new size
    initializeLayers();
    drawBackground();
}

function mousePressed() {
    if (debugMode.enabled) return;
    
    const adjustedMouseX = mouseX * (config.baseWidth / config.targetWidth);
    const adjustedMouseY = mouseY * (config.baseHeight / config.targetHeight);
    
    if (adjustedMouseX >= 0 && adjustedMouseX <= config.baseWidth &&
        adjustedMouseY >= 0 && adjustedMouseY <= config.baseHeight) {
        
        if (!gameState.flowerManager.plantFlower(
            adjustedMouseX, 
            adjustedMouseY, 
            gameState.flowers, 
            gameState.particleSystem
        )) {
            const testColors = [
                [255, 100, 100],
                [100, 255, 100],
                [100, 100, 255],
                [255, 200, 100]
            ];
            
            const color = random(testColors);
            gameState.particleSystem.emitBurst(adjustedMouseX, adjustedMouseY, color, 8);
        }
    }
}

function keyPressed() {
    if (key === 'D' || key === 'd') {
        debugMode.enabled = !debugMode.enabled;
        if (debugMode.enabled) {
            // Start cursor in center of isometric bounds
            const bounds = config.isoBounds;
            debugMode.cursorX = Math.floor(bounds.maxX / 2);
            debugMode.cursorY = Math.floor(bounds.maxY / 2);
        }
        return;
    }
    
    if (!debugMode.enabled) return;
    
    // Always use isometric movement in debug mode
    if (keyCode === LEFT_ARROW) {
        // Isometric movement: left = move northwest
        if (debugMode.cursorY > 0) {
            debugMode.cursorY--;
        }
    } else if (keyCode === RIGHT_ARROW) {
        // Isometric movement: right = move southeast
        if (debugMode.cursorY < config.isoBounds.maxY) {
            debugMode.cursorY++;
        }
    } else if (keyCode === UP_ARROW) {
        // Isometric movement: up = move northeast
        if (debugMode.cursorX > 0) {
            debugMode.cursorX--;
        }
    } else if (keyCode === DOWN_ARROW) {
        // Isometric movement: down = move southwest
        if (debugMode.cursorX < config.isoBounds.maxX) {
            debugMode.cursorX++;
        }
    }
    
    if (key === 'Q' || key === 'q') {
        let currentIndex = debugMode.tools.indexOf(debugMode.selectedTool);
        currentIndex = (currentIndex - 1 + debugMode.tools.length) % debugMode.tools.length;
        debugMode.selectedTool = debugMode.tools[currentIndex];
    } else if (key === 'E' || key === 'e') {
        let currentIndex = debugMode.tools.indexOf(debugMode.selectedTool);
        currentIndex = (currentIndex + 1) % debugMode.tools.length;
        debugMode.selectedTool = debugMode.tools[currentIndex];
    }
    
    if (key === ' ') {
        handleDebugPlacement();
    }
    
    if (key === 'X' || key === 'x') {
        exportZoneData();
    }
}

function handleDebugPlacement() {
    const gridX = debugMode.cursorX;
    const gridY = debugMode.cursorY;
    
    // Convert isometric grid coordinates to screen coordinates
    const screenPos = isoToScreen(gridX, gridY);
    const pixelX = screenPos.x;
    const pixelY = screenPos.y; // Ground level already included in isoToScreen
    
    if (debugMode.selectedTool === 'butterfly') {
        const butterflyColors = [
            [[255, 140, 60], [255, 220, 120]],   // Orange/yellow
            [[220, 100, 150], [255, 180, 200]],  // Pink/coral
            [[150, 120, 200], [200, 170, 255]],  // Purple/lavender
            [[100, 180, 140], [150, 220, 180]]   // Teal/mint
        ];
        const colors = random(butterflyColors);
        // Butterflies float above the grid
        const floatY = pixelY - config.entityHeightOffset.butterfly;
        gameState.butterflies.push(new Butterfly(pixelX, floatY, colors));
        
    } else if (debugMode.selectedTool === 'flower') {
        gameState.flowers.push(new Flower(pixelX, pixelY));
        
    } else if (debugMode.selectedTool === 'walkable' || debugMode.selectedTool === 'blocked') {
        const tileKey = `${gridX},${gridY}`;
        
        if (debugMode.selectedTool === 'walkable') {
            // Toggle walkable state
            if (debugMode.walkableTiles.has(tileKey)) {
                debugMode.walkableTiles.delete(tileKey);
            } else {
                debugMode.walkableTiles.add(tileKey);
                // Remove from blocked if it was there
                debugMode.blockedTiles.delete(tileKey);
            }
        } else if (debugMode.selectedTool === 'blocked') {
            // Toggle blocked state
            if (debugMode.blockedTiles.has(tileKey)) {
                debugMode.blockedTiles.delete(tileKey);
            } else {
                debugMode.blockedTiles.add(tileKey);
                // Remove from walkable if it was there
                debugMode.walkableTiles.delete(tileKey);
            }
        }
    }
}

function exportZoneData() {
    console.log('=== TILE DATA EXPORT ===');
    
    if (debugMode.walkableTiles.size > 0) {
        console.log('const walkableTiles = [');
        for (let tileKey of debugMode.walkableTiles) {
            const [x, y] = tileKey.split(',');
            console.log(`  { x: ${x}, y: ${y} },`);
        }
        console.log('];');
        console.log('');
    }
    
    if (debugMode.blockedTiles.size > 0) {
        console.log('const blockedTiles = [');
        for (let tileKey of debugMode.blockedTiles) {
            const [x, y] = tileKey.split(',');
            console.log(`  { x: ${x}, y: ${y} },`);
        }
        console.log('];');
    }
    
    console.log('========================');
}