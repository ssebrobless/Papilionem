// Debug/Builder Mode - Development tools for testing and content creation
class DebugUI {
    constructor() {
        this.enabled = false;
        this.cursorX = 0;
        this.cursorY = 0;
        this.selectedTool = 'butterfly';
        this.tools = ['butterfly', 'flower', 'walkable', 'blocked'];
        this.walkableTiles = new Set(); // Set of "x,y" strings for walkable tiles
        this.blockedTiles = new Set();  // Set of "x,y" strings for blocked tiles
        
        // God mode testing buttons
        this.godModeButtons = [
            { id: 'spawnButterfly', text: 'Spawn Butterfly', x: 10, y: 0, width: 120, height: 25 },
            { id: 'spawnFlower', text: 'Spawn Flower', x: 140, y: 0, width: 100, height: 25 },
            { id: 'spawnPixels', text: 'Spawn Pixels', x: 250, y: 0, width: 100, height: 25 }
        ];
    }
    
    // Toggle debug mode on/off
    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            // Start cursor in center of isometric bounds
            const bounds = gridManager.bounds;
            this.cursorX = Math.floor(bounds.maxX / 2);
            this.cursorY = Math.floor(bounds.maxY / 2);
        }
    }
    
    // Handle debug mode keyboard input
    handleKeyPress(key, keyCode) {
        if (!this.enabled) return false;
        
        // Always use isometric movement in debug mode
        if (keyCode === LEFT_ARROW) {
            // Isometric movement: left = move northwest
            if (this.cursorY > 0) {
                this.cursorY--;
            }
        } else if (keyCode === RIGHT_ARROW) {
            // Isometric movement: right = move southeast
            if (this.cursorY < gridManager.bounds.maxY) {
                this.cursorY++;
            }
        } else if (keyCode === UP_ARROW) {
            // Isometric movement: up = move northeast
            if (this.cursorX > 0) {
                this.cursorX--;
            }
        } else if (keyCode === DOWN_ARROW) {
            // Isometric movement: down = move southwest
            if (this.cursorX < gridManager.bounds.maxX) {
                this.cursorX++;
            }
        }
        
        // Tool selection
        if (key === 'Q' || key === 'q') {
            let currentIndex = this.tools.indexOf(this.selectedTool);
            currentIndex = (currentIndex - 1 + this.tools.length) % this.tools.length;
            this.selectedTool = this.tools[currentIndex];
        } else if (key === 'E' || key === 'e') {
            let currentIndex = this.tools.indexOf(this.selectedTool);
            currentIndex = (currentIndex + 1) % this.tools.length;
            this.selectedTool = this.tools[currentIndex];
        }
        
        // Placement/action
        if (key === ' ') {
            this.handlePlacement();
        }
        
        // Export data
        if (key === 'X' || key === 'x') {
            this.exportZoneData();
        }
        
        return true; // Consumed the input
    }
    
    // Handle entity/tile placement
    handlePlacement() {
        const gridX = this.cursorX;
        const gridY = this.cursorY;
        
        // Convert isometric grid coordinates to screen coordinates
        const screenPos = gridManager.isoToScreen(gridX, gridY);
        const pixelX = screenPos.x;
        const pixelY = screenPos.y; // Ground level already included in isoToScreen
        
        if (this.selectedTool === 'butterfly') {
            // Spawn butterfly (this would need access to game state)
            this.spawnButterfly(pixelX, pixelY);
            
        } else if (this.selectedTool === 'flower') {
            // Spawn flower (this would need access to game state)
            this.spawnFlower(pixelX, pixelY);
            
        } else if (this.selectedTool === 'walkable' || this.selectedTool === 'blocked') {
            this.toggleTileState(gridX, gridY);
        }
    }
    
    // Toggle walkable/blocked tile state
    toggleTileState(gridX, gridY) {
        const tileKey = `${gridX},${gridY}`;
        
        if (this.selectedTool === 'walkable') {
            // Toggle walkable state
            if (this.walkableTiles.has(tileKey)) {
                this.walkableTiles.delete(tileKey);
            } else {
                this.walkableTiles.add(tileKey);
                // Remove from blocked if it was there
                this.blockedTiles.delete(tileKey);
            }
        } else if (this.selectedTool === 'blocked') {
            // Toggle blocked state
            if (this.blockedTiles.has(tileKey)) {
                this.blockedTiles.delete(tileKey);
            } else {
                this.blockedTiles.add(tileKey);
                // Remove from walkable if it was there
                this.walkableTiles.delete(tileKey);
            }
        }
    }
    
    // Spawn butterfly (needs access to game systems)
    spawnButterfly(x, y) {
        const butterflyColors = gameConfig.entities.butterfly.colors;
        const colors = random(butterflyColors);
        // Butterflies float above the grid
        const floatY = y - gameConfig.entities.heightOffset.butterfly;
        
        // This would need to be called via a callback or event
        eventBus.emit('debug:spawnButterfly', { x, y: floatY, colors });
    }
    
    // Spawn flower (needs access to game systems)
    spawnFlower(x, y) {
        eventBus.emit('debug:spawnFlower', { x, y });
    }
    
    // Handle mouse clicks for god mode buttons
    handleMouseClick(mouseX, mouseY) {
        if (!this.enabled) return false;
        
        // Check god mode buttons (positioned at bottom of screen)
        const canvasHeight = gameConfig.canvas.targetHeight;
        const buttonY = canvasHeight - 35;
        
        for (let button of this.godModeButtons) {
            if (mouseX >= button.x && mouseX <= button.x + button.width &&
                mouseY >= buttonY && mouseY <= buttonY + button.height) {
                
                this.handleGodModeAction(button.id);
                return true; // Consumed the click
            }
        }
        
        return false;
    }
    
    // Execute god mode actions
    handleGodModeAction(actionId) {
        const bounds = gridManager.bounds;
        
        switch (actionId) {
            case 'spawnButterfly':
                this.godSpawnButterfly(bounds);
                break;
            case 'spawnFlower':
                this.godSpawnFlower(bounds);
                break;
            case 'spawnPixels':
                this.godSpawnPixels(bounds);
                break;
        }
    }
    
    godSpawnButterfly(bounds) {
        // Pick random location within grid bounds
        const gridX = random(1, bounds.maxX - 1);
        const gridY = random(1, bounds.maxY - 1);
        const screenPos = gridManager.isoToScreen(gridX, gridY);
        
        // Random butterfly colors from config
        const butterflyColors = gameConfig.entities.butterfly.colors;
        const colors = random(butterflyColors);
        
        // Spawn at proper height offset
        const spawnY = screenPos.y - gameConfig.entities.heightOffset.butterfly;
        
        eventBus.emit('debug:spawnButterfly', { 
            x: screenPos.x, 
            y: spawnY, 
            colors: colors 
        });
        
        console.log('🦋 God Mode: Spawned butterfly at', gridX, gridY);
    }
    
    godSpawnFlower(bounds) {
        // Pick random location within grid bounds
        const gridX = random(2, bounds.maxX - 2);
        const gridY = random(2, bounds.maxY - 2);
        const screenPos = gridManager.isoToScreen(gridX, gridY);
        
        eventBus.emit('debug:spawnFlower', { 
            x: screenPos.x, 
            y: screenPos.y 
        });
        
        console.log('🌸 God Mode: Spawned flower at', gridX, gridY);
    }
    
    godSpawnPixels(bounds) {
        // Pick random location within grid bounds
        const gridX = random(1, bounds.maxX - 1);
        const gridY = random(1, bounds.maxY - 1);
        const screenPos = gridManager.isoToScreen(gridX, gridY);
        
        // Spawn above ground like butterfly would
        const spawnY = screenPos.y - gameConfig.entities.heightOffset.butterfly;
        
        // Get game state to access particle system
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const particleSystem = gameCore.particleSystem;
            
            // Spawn same amount as butterfly would drop (3-6 pixels)
            const numPixels = floor(random(3, 6));
            const butterflyColors = gameConfig.entities.butterfly.colors;
            const colors = random(butterflyColors);
            
            for (let i = 0; i < numPixels; i++) {
                const color = random(colors);
                const offsetX = random(-5, 5);
                const offsetY = random(-5, 5);
                
                particleSystem.emit(
                    screenPos.x + offsetX,
                    spawnY + offsetY,
                    color,
                    1,
                    'scale'
                );
            }
            
            console.log('✨ God Mode: Spawned', numPixels, 'pixels at', gridX, gridY);
        }
    }
    
    // Export zone data to console
    exportZoneData() {
        console.log('=== TILE DATA EXPORT ===');
        
        if (this.walkableTiles.size > 0) {
            console.log('const walkableTiles = [');
            for (let tileKey of this.walkableTiles) {
                const [x, y] = tileKey.split(',');
                console.log(`  { x: ${x}, y: ${y} },`);
            }
            console.log('];');
            console.log('');
        }
        
        if (this.blockedTiles.size > 0) {
            console.log('const blockedTiles = [');
            for (let tileKey of this.blockedTiles) {
                const [x, y] = tileKey.split(',');
                console.log(`  { x: ${x}, y: ${y} },`);
            }
            console.log('];');
        }
        
        console.log('========================');
    }
    
    // Draw debug overlays
    draw(graphics) {
        if (!this.enabled) return;
        
        this.drawGrid(graphics);
        this.drawTileStates(graphics);
        this.drawDebugCursor(graphics);
        this.drawButterflyPaths(graphics);
        this.drawDebugUI(graphics);
        this.drawGodModeButtons(graphics);
    }
    
    // Draw isometric grid using unified system
    drawGrid(graphics) {
        // Use gridManager's unified grid drawing
        gridManager.drawGrid(graphics);
        
        // Add boundary outline
        gridManager.drawBoundary(graphics);
    }
    
    // Draw tile states (walkable/blocked)
    drawTileStates(graphics) {
        // Draw walkable tiles
        for (let tileKey of this.walkableTiles) {
            const [x, y] = tileKey.split(',').map(Number);
            gridManager.drawTile(graphics, x, y, [100, 255, 100, 50]);
        }
        
        // Draw blocked tiles
        for (let tileKey of this.blockedTiles) {
            const [x, y] = tileKey.split(',').map(Number);
            gridManager.drawTile(graphics, x, y, [255, 100, 100, 50]);
        }
    }
    
    // Draw debug cursor
    drawDebugCursor(graphics) {
        // Draw cursor outline using unified tile function
        gridManager.drawTile(graphics, this.cursorX, this.cursorY, null, [255, 255, 255, 200], 2);
        
        // Show tool-specific visual feedback
        const toolColors = {
            butterfly: [255, 150, 100, 50],
            flower: [150, 255, 150, 50],
            walkable: [100, 255, 100, 50],
            blocked: [255, 100, 100, 50]
        };
        
        if (toolColors[this.selectedTool]) {
            // Draw tool preview using unified tile function
            gridManager.drawTile(graphics, this.cursorX, this.cursorY, toolColors[this.selectedTool]);
        }
    }
    
    // Draw debug UI panel
    drawDebugUI(graphics) {
        graphics.fill(0, 0, 0, 150);
        graphics.noStroke();
        graphics.rect(10, 10, 250, 195);
        
        graphics.fill(255);
        graphics.textAlign(LEFT);
        graphics.text('DEBUG MODE (D to toggle)', 15, 25);
        graphics.text(`Cursor: ${this.cursorX}, ${this.cursorY}`, 15, 45);
        graphics.text(`Tool: ${this.selectedTool}`, 15, 65);
        graphics.text('Arrow keys: Move cursor', 15, 85);
        graphics.text('Q/E: Change tool', 15, 105);
        
        if (this.selectedTool === 'walkable' || this.selectedTool === 'blocked') {
            graphics.text('Space: Toggle tile state', 15, 125);
        } else {
            graphics.text('Space: Place entity', 15, 125);
        }
        
        graphics.text('X: Export data', 15, 145);
        
        // Show bounds configuration info
        graphics.textSize(10);
        graphics.fill(200);
        graphics.text(`Bounds: (0,0) to (${gridManager.bounds.maxX},${gridManager.bounds.maxY})`, 15, 165);
        graphics.text(`Grid: ${gridManager.cellSize}px tiles`, 15, 180);
        graphics.textSize(12);
    }
    
    // Draw butterfly targeting paths
    drawButterflyPaths(graphics) {
        // Get butterflies from gameCore if available
        let butterflies = [];
        let flowers = [];
        
        if (typeof gameCore !== 'undefined' && gameCore.isInitialized()) {
            const gameState = gameCore.getGameState();
            butterflies = gameState.butterflies || [];
            flowers = gameState.flowers || [];
        }
        
        graphics.push();
        graphics.stroke(255, 100, 100, 150); // Red lines for paths
        graphics.strokeWeight(1);
        
        for (let butterfly of butterflies) {
            // Show path to goal position if butterfly has a goal (regardless of happiness for debug visibility)
            if (butterfly.goalGridPos) {
                const butterflyScreen = { x: butterfly.x, y: butterfly.y };
                const goalScreen = gridManager.isoToScreen(butterfly.goalGridPos.x, butterfly.goalGridPos.y);
                
                // Draw dashed line to goal
                this.drawDashedLine(graphics, butterflyScreen.x, butterflyScreen.y, goalScreen.x, goalScreen.y);
                
                // Draw small circle at goal
                graphics.noFill();
                graphics.ellipse(goalScreen.x, goalScreen.y, 8, 8);
                
                // Find which flower this goal corresponds to
                for (let flower of flowers) {
                    const flowerGrid = gridManager.screenToIso(flower.x, flower.y);
                    const distToGoal = Math.hypot(flowerGrid.x - butterfly.goalGridPos.x, flowerGrid.y - butterfly.goalGridPos.y);
                    
                    if (distToGoal < 1) { // Close enough to be the target flower
                        // Highlight the target flower
                        graphics.stroke(255, 200, 100, 200); // Orange highlight
                        graphics.strokeWeight(2);
                        graphics.ellipse(flower.x, flower.y, 25, 25);
                        graphics.strokeWeight(1);
                        graphics.stroke(255, 100, 100, 150); // Back to red for paths
                        break;
                    }
                }
            }
            
            // Show path to feeding flower if currently feeding
            if (butterfly.state === 'feeding' && butterfly.targetFlower) {
                graphics.stroke(100, 255, 100, 200); // Green line for feeding
                graphics.strokeWeight(2);
                graphics.line(butterfly.x, butterfly.y, butterfly.targetFlower.x, butterfly.targetFlower.y);
                
                // Highlight feeding flower
                graphics.noFill();
                graphics.ellipse(butterfly.targetFlower.x, butterfly.targetFlower.y, 30, 30);
                graphics.strokeWeight(1);
            }
            
            // Show connection to cursor if following
            if (butterfly.state === 'following') {
                // Get cursor position from interaction system if available
                let cursorX = mouseX * (gameConfig.canvas.baseWidth / gameConfig.canvas.targetWidth);
                let cursorY = mouseY * (gameConfig.canvas.baseHeight / gameConfig.canvas.targetHeight);
                
                graphics.stroke(100, 200, 255, 150); // Light blue line for following
                graphics.strokeWeight(1);
                this.drawDashedLine(graphics, butterfly.x, butterfly.y, cursorX, cursorY, 8);
                
                // Show cursor target position
                graphics.noFill();
                graphics.stroke(100, 200, 255, 200);
                graphics.ellipse(cursorX, cursorY, 20, 20);
            }
            
            // Show butterfly happiness as a text label
            graphics.fill(255, 255, 255, 200);
            graphics.noStroke();
            graphics.textAlign(CENTER);
            graphics.textSize(8);
            graphics.text(`${Math.round(butterfly.happiness)}%`, butterfly.x, butterfly.y - 15);
            
            // Show butterfly state
            const stateColors = {
                'normal': [255, 255, 255],
                'feeding': [100, 255, 100],
                'scared': [255, 100, 100],
                'display': [255, 255, 100],
                'following': [100, 200, 255]
            };
            const stateColor = stateColors[butterfly.state] || [255, 255, 255];
            graphics.fill(stateColor[0], stateColor[1], stateColor[2], 150);
            graphics.text(butterfly.state, butterfly.x, butterfly.y - 25);
            
            // Show goal info for debugging
            graphics.textSize(6);
            graphics.fill(200, 200, 200, 150);
            const hasGoal = butterfly.goalGridPos ? 'GOAL' : 'NO GOAL';
            const seekingFlowers = butterfly.happiness <= butterfly.baselineHappiness ? 'SEEKING' : 'NOT SEEKING';
            graphics.text(`${hasGoal} | ${seekingFlowers}`, butterfly.x, butterfly.y - 35);
        }
        
        graphics.pop();
    }
    
    // Helper function to draw dashed lines
    drawDashedLine(graphics, x1, y1, x2, y2, dashLength = 5) {
        const distance = Math.hypot(x2 - x1, y2 - y1);
        const dashCount = Math.floor(distance / dashLength);
        const dx = (x2 - x1) / dashCount;
        const dy = (y2 - y1) / dashCount;
        
        for (let i = 0; i < dashCount; i += 2) {
            const startX = x1 + dx * i;
            const startY = y1 + dy * i;
            const endX = x1 + dx * (i + 1);
            const endY = y1 + dy * (i + 1);
            graphics.line(startX, startY, endX, endY);
        }
    }
    
    // Draw boundary zones (when B key is held) using unified system
    drawBoundaryZones(graphics) {
        // Define zone configuration
        const zones = [
            { dist: 0, color: [100, 255, 100, 50], label: "Safe" },
            { dist: 50, color: [255, 255, 100, 40], label: "Soft" },
            { dist: 100, color: [255, 150, 100, 30], label: "Hard" },
            { dist: 150, color: [255, 100, 100, 20], label: "Max" }
        ];
        
        // Use unified boundary zone drawing
        gridManager.drawBoundaryZones(graphics, zones);
    }
    
    // Draw god mode testing buttons
    drawGodModeButtons(graphics) {
        const canvasHeight = gameConfig.canvas.targetHeight;
        const buttonY = canvasHeight - 35;
        
        graphics.push();
        
        // Draw button panel background
        graphics.fill(0, 0, 0, 150);
        graphics.noStroke();
        graphics.rect(5, buttonY - 5, 360, 35);
        
        // Draw title
        graphics.fill(255);
        graphics.textAlign(LEFT);
        graphics.textSize(10);
        graphics.text('GOD MODE:', 10, buttonY - 10);
        
        // Draw buttons
        for (let button of this.godModeButtons) {
            // Button background
            graphics.fill(60, 60, 60);
            graphics.stroke(120);
            graphics.strokeWeight(1);
            graphics.rect(button.x, buttonY, button.width, button.height);
            
            // Button text
            graphics.fill(255);
            graphics.noStroke();
            graphics.textAlign(CENTER);
            graphics.textSize(11);
            graphics.text(button.text, button.x + button.width/2, buttonY + 16);
        }
        
        graphics.pop();
    }
}

// Create global instance
const debugUI = new DebugUI();