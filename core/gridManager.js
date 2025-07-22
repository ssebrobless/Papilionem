// Centralized grid management system
class GridManager {
    constructor() {
        this.cellSize = 18;
        this.gridWidth = 18;
        this.gridHeight = 18;
        
        // Cache frequently used calculations
        this.halfCell = this.cellSize / 2;
        this.tileWidth = this.cellSize;
        this.tileHeight = this.cellSize / 2;
        
        // Define playable bounds
        this.bounds = {
            minX: 0,
            maxX: this.gridWidth - 1,
            minY: 0,
            maxY: this.gridHeight - 1
        };
        
        // Zone definitions (can be loaded from debug mode exports)
        this.zones = {
            grass: [],
            blocked: [],
            path: [],
            water: []
        };
    }
    
    // Convert screen coordinates to isometric grid coordinates
    screenToIso(screenX, screenY) {
        const offsetX = gameConfig.canvas.baseWidth / 2;
        const offsetY = gameConfig.isometric.offsetY;
        
        const x = (screenX - offsetX) / this.tileWidth + (screenY - offsetY) / this.tileHeight;
        const y = (screenY - offsetY) / this.tileHeight - (screenX - offsetX) / this.tileWidth;
        
        return {
            x: round(x),
            y: round(y)
        };
    }
    
    // Convert isometric grid coordinates to screen coordinates  
    isoToScreen(isoX, isoY) {
        const offsetX = gameConfig.canvas.baseWidth / 2;
        const offsetY = gameConfig.isometric.offsetY;
        
        const x = (isoX - isoY) * this.tileWidth / 2 + offsetX;
        const y = (isoX + isoY) * this.tileHeight / 2 + offsetY;
        
        return { x, y };
    }
    
    // Get the ground Y position at a given grid coordinate
    getGroundY(gridX, gridY) {
        const screenPos = this.isoToScreen(gridX, gridY);
        return screenPos.y;
    }
    
    // Check if a grid position is within bounds
    isInBounds(gridX, gridY) {
        return gridX >= this.bounds.minX && 
               gridX <= this.bounds.maxX && 
               gridY >= this.bounds.minY && 
               gridY <= this.bounds.maxY;
    }
    
    // Constrain a grid position to bounds
    constrainToBounds(gridX, gridY) {
        return {
            x: constrain(gridX, this.bounds.minX, this.bounds.maxX),
            y: constrain(gridY, this.bounds.minY, this.bounds.maxY)
        };
    }
    
    // Get zone type at a grid position
    getZoneAt(gridX, gridY) {
        for (let [zoneType, cells] of Object.entries(this.zones)) {
            for (let cell of cells) {
                if (cell.x === gridX && cell.y === gridY) {
                    return zoneType;
                }
            }
        }
        return 'default';
    }
    
    // Check if a position is walkable
    isWalkable(gridX, gridY) {
        if (!this.isInBounds(gridX, gridY)) return false;
        const zone = this.getZoneAt(gridX, gridY);
        return zone !== 'blocked' && zone !== 'water';
    }
    
    // Find nearest walkable position
    findNearestWalkable(gridX, gridY) {
        if (this.isWalkable(gridX, gridY)) {
            return { x: gridX, y: gridY };
        }
        
        // Spiral outward to find nearest walkable cell
        for (let radius = 1; radius < 10; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (abs(dx) === radius || abs(dy) === radius) {
                        const testX = gridX + dx;
                        const testY = gridY + dy;
                        if (this.isWalkable(testX, testY)) {
                            return { x: testX, y: testY };
                        }
                    }
                }
            }
        }
        
        return { x: gridX, y: gridY }; // Fallback
    }
    
    // Get all cells of a specific zone type
    getCellsOfType(zoneType) {
        return this.zones[zoneType] || [];
    }
    
    // Add a cell to a zone
    addZoneCell(zoneType, gridX, gridY) {
        if (!this.zones[zoneType]) {
            this.zones[zoneType] = [];
        }
        
        // Check if cell already exists
        const exists = this.zones[zoneType].some(cell => 
            cell.x === gridX && cell.y === gridY
        );
        
        if (!exists) {
            this.zones[zoneType].push({ x: gridX, y: gridY });
        }
    }
    
    // Remove a cell from a zone
    removeZoneCell(zoneType, gridX, gridY) {
        if (!this.zones[zoneType]) return;
        
        this.zones[zoneType] = this.zones[zoneType].filter(cell =>
            !(cell.x === gridX && cell.y === gridY)
        );
    }
    
    // Load zone data from debug mode export
    loadZones(zoneData) {
        for (let [key, zone] of Object.entries(zoneData)) {
            if (zone.cells) {
                this.zones[zone.type] = [...zone.cells];
            }
        }
    }
    
    // Draw grid for debug mode
    drawGrid(graphics) {
        graphics.stroke(255, 255, 255, 50);
        graphics.strokeWeight(1);
        
        for (let x = 0; x <= this.gridWidth; x++) {
            for (let y = 0; y <= this.gridHeight; y++) {
                const screenPos = this.isoToScreen(x, y);
                
                // Draw horizontal line
                if (x < this.gridWidth) {
                    const nextPos = this.isoToScreen(x + 1, y);
                    graphics.line(screenPos.x, screenPos.y, nextPos.x, nextPos.y);
                }
                
                // Draw vertical line
                if (y < this.gridHeight) {
                    const nextPos = this.isoToScreen(x, y + 1);
                    graphics.line(screenPos.x, screenPos.y, nextPos.x, nextPos.y);
                }
            }
        }
    }
    
    // Draw zones for debug mode
    drawZones(graphics) {
        const zoneColors = {
            grass: [0, 255, 0, 50],
            blocked: [255, 0, 0, 50],
            path: [255, 255, 0, 50],
            water: [0, 100, 255, 50]
        };
        
        for (let [zoneType, cells] of Object.entries(this.zones)) {
            const color = zoneColors[zoneType];
            if (!color) continue;
            
            graphics.fill(...color);
            graphics.noStroke();
            
            for (let cell of cells) {
                const screenPos = this.isoToScreen(cell.x, cell.y);
                
                // Draw diamond shape for isometric cell
                graphics.beginShape();
                graphics.vertex(screenPos.x, screenPos.y - this.tileHeight);
                graphics.vertex(screenPos.x + this.tileWidth/2, screenPos.y);
                graphics.vertex(screenPos.x, screenPos.y + this.tileHeight);
                graphics.vertex(screenPos.x - this.tileWidth/2, screenPos.y);
                graphics.endShape(CLOSE);
            }
        }
    }
}

// Create global instance
const gridManager = new GridManager();