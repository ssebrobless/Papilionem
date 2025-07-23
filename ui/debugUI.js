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
        this.drawDebugUI(graphics);
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
}

// Create global instance
const debugUI = new DebugUI();