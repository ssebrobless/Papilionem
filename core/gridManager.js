// Centralized grid management system
class GridManager {
    constructor() {
        // Restore original working grid parameters
        this.gridSize = 16;  // Original working value
        this.gridWidth = 18;
        this.gridHeight = 18;
        
        // Cache frequently used calculations - using original formulas
        this.tileWidth = this.gridSize * 2;  // 32px (original working size)
        this.tileHeight = this.gridSize;     // 16px (original working size)
        this.halfCell = this.gridSize / 2;
        
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
        const tileWidth = this.tileWidth;
        const tileHeight = this.tileHeight;
        
        // This must be the EXACT inverse of isoToScreen()
        // First, undo the final screen position adjustments from isoToScreen
        screenY -= tileHeight / 2; // Undo the + tileHeight/2
        
        // Convert back to pre-canvas-center coordinates
        const preCanvasX = screenX - gameConfig.canvas.baseWidth / 2;
        
        // Undo the isometric projection: (offsetX - offsetY) * tileWidth/2 = preCanvasX
        //                                  (offsetX + offsetY) * tileHeight/2 = screenY
        // Solve the system of equations for offsetX and offsetY:
        const offsetX = (preCanvasX / (tileWidth/2) + screenY / (tileHeight/2)) / 2;
        const offsetY = (screenY / (tileHeight/2) - preCanvasX / (tileWidth/2)) / 2;
        
        // Remove grid offset to get actual grid coordinates
        const gridOffsetX = gameConfig.grid.gridOffset.x;
        const gridOffsetY = gameConfig.grid.gridOffset.y;
        
        return {
            x: offsetX - gridOffsetX,
            y: offsetY - gridOffsetY
        };
    }
    
    // Convert isometric grid coordinates to screen coordinates  
    isoToScreen(isoX, isoY) {
        // Use original working algorithm
        const tileWidth = this.tileWidth;
        const tileHeight = this.tileHeight;
        
        // Apply grid offset to align with background
        const gridOffsetX = gameConfig.grid.gridOffset.x;
        const gridOffsetY = gameConfig.grid.gridOffset.y;
        
        const offsetX = isoX + gridOffsetX;
        const offsetY = isoY + gridOffsetY;
        
        const screenX = (offsetX - offsetY) * tileWidth / 2 + gameConfig.canvas.baseWidth / 2;
        const screenY = (offsetX + offsetY) * tileHeight / 2;
        
        return { x: screenX, y: screenY + tileHeight / 2 };
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
    
    // Unified function to draw a single isometric tile
    drawTile(graphics, gridX, gridY, fillColor = null, strokeColor = null, strokeWeight = 1) {
        // Set fill
        if (fillColor) {
            graphics.fill(...fillColor);
        } else {
            graphics.noFill();
        }
        
        // Set stroke
        if (strokeColor) {
            graphics.stroke(...strokeColor);
            graphics.strokeWeight(strokeWeight);
        } else {
            graphics.noStroke();
        }
        
        // Calculate diamond vertices using actual grid geometry
        // The tile diamond is bounded by the four surrounding grid points
        const topLeft = this.isoToScreen(gridX, gridY);
        const topRight = this.isoToScreen(gridX + 1, gridY);  
        const bottomRight = this.isoToScreen(gridX + 1, gridY + 1);
        const bottomLeft = this.isoToScreen(gridX, gridY + 1);
        
        // Draw diamond shape using actual grid point positions
        graphics.beginShape();
        graphics.vertex(topLeft.x, topLeft.y);       // Top
        graphics.vertex(topRight.x, topRight.y);     // Right  
        graphics.vertex(bottomRight.x, bottomRight.y); // Bottom
        graphics.vertex(bottomLeft.x, bottomLeft.y);   // Left
        graphics.endShape(CLOSE);
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
            
            for (let cell of cells) {
                // Use unified tile drawing function
                this.drawTile(graphics, cell.x, cell.y, color);
            }
        }
    }
    
    // Unified diamond drawing for UI elements (screen coordinates)
    drawDiamond(graphics, centerX, centerY, size, fillColor = null, strokeColor = null, strokeWeight = 1) {
        // Set fill
        if (fillColor) {
            graphics.fill(...fillColor);
        } else {
            graphics.noFill();
        }
        
        // Set stroke
        if (strokeColor) {
            graphics.stroke(...strokeColor);
            graphics.strokeWeight(strokeWeight);
        } else {
            graphics.noStroke();
        }
        
        // Draw diamond using consistent geometry
        graphics.beginShape();
        graphics.vertex(centerX, centerY - size);     // Top
        graphics.vertex(centerX + size, centerY);     // Right
        graphics.vertex(centerX, centerY + size);     // Bottom  
        graphics.vertex(centerX - size, centerY);     // Left
        graphics.endShape(CLOSE);
    }
    
    // Unified boundary calculation and drawing
    drawBoundary(graphics, strokeColor = [255, 200, 100, 100], strokeWeight = 2) {
        graphics.stroke(...strokeColor);
        graphics.strokeWeight(strokeWeight);
        graphics.noFill();
        
        // Calculate the four corners of the playable area
        const corners = this.getBoundaryCorners();
        
        graphics.beginShape();
        for (let corner of corners) {
            graphics.vertex(corner.x, corner.y);
        }
        graphics.endShape(CLOSE);
    }
    
    // Get boundary corner positions (reusable for zones)
    getBoundaryCorners() {
        return [
            this.isoToScreen(0, 0),
            this.isoToScreen(this.bounds.maxX, 0),
            this.isoToScreen(this.bounds.maxX, this.bounds.maxY),
            this.isoToScreen(0, this.bounds.maxY)
        ];
    }
    
    // Unified boundary zone drawing (for debug/UI)
    drawBoundaryZones(graphics, zones) {
        graphics.push();
        graphics.noStroke();
        
        const corners = this.getBoundaryCorners();
        
        // Draw zones in reverse order (largest first)
        for (let i = zones.length - 1; i >= 0; i--) {
            const zone = zones[i];
            graphics.fill(...zone.color);
            
            // Create expanded shape
            graphics.beginShape();
            for (let j = 0; j < corners.length; j++) {
                const corner = corners[j];
                const next = corners[(j + 1) % corners.length];
                
                // Calculate outward normal
                const dx = next.x - corner.x;
                const dy = next.y - corner.y;
                const len = sqrt(dx * dx + dy * dy);
                const nx = -dy / len * zone.dist;
                const ny = dx / len * zone.dist;
                
                graphics.vertex(corner.x + nx, corner.y + ny);
            }
            graphics.endShape(CLOSE);
        }
        
        graphics.pop();
    }
}

// Create global instance
const gridManager = new GridManager();