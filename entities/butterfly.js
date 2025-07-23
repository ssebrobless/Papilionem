class Butterfly extends Entity {
    constructor(x, y, colors) {
        super(x, y);
        
        // Override base properties
        this.size = 12; // Smaller, cuter butterflies
        this.lifetime = 10000; // Long lifetime
        this.fadeStartLifetime = 2000;
        this.shadowOffset = gameConfig.entities.heightOffset.butterfly;
        
        // Butterfly specific properties
        this.targetGridPos = {...this.gridPos};
        this.colors = colors;
        
        this.wingAngle = 0;
        this.wingSpeed = 0.05;
        
        this.speed = 0.008; // Much slower movement
        this.wanderTimer = random(60, 120); // How often to pick new destination
        
        // Goal-oriented movement
        this.goalGridPos = null; // Will be set on first update
        this.movesSinceNewGoal = 0; // Track moves toward current goal
        
        this.pixelDropTimer = 0;
        this.lastPixelDrop = 0;
        
        // Gentle hover display state
        this.state = 'normal'; // 'normal', 'display'
        this.displayTimer = 0;
        this.displayDuration = 180; // 3 seconds at 60fps
        this.wingDisplaySpeed = 0.15; // Faster wing flapping during display
        this.hasBeenHovered = false; // Track if already displayed to this cursor position
    }
    
    update(gameState) {
        // Call parent update
        super.update(gameState);
        
        // Extract what we need from gameState
        const { flowers, particleSystem } = gameState;
        
        // Handle display state
        if (this.state === 'display') {
            this.updateDisplay(particleSystem);
        } else {
            // Normal behavior when not displaying
            // Simple wandering behavior
            this.wander(flowers);
            
            // Move toward target
            this.move();
        }
        
        // Update wing animation
        this.updateWings();
        
        // Occasionally drop pixels in normal state
        if (this.state === 'normal' && frameCount % 120 === 0 && random() < 0.3) {
            const color = random(this.colors);
            particleSystem.emit(this.x, this.y, color, 1, 'scale');
        }
    }
    
    move() {
        // Move in grid space for proper isometric movement
        const gridDx = this.targetGridPos.x - this.gridPos.x;
        const gridDy = this.targetGridPos.y - this.gridPos.y;
        
        // Update grid position
        this.gridPos.x += gridDx * this.speed;
        this.gridPos.y += gridDy * this.speed;
        
        // Convert to screen space
        const newScreenPos = gridManager.isoToScreen(this.gridPos.x, this.gridPos.y);
        this.x = newScreenPos.x;
        this.y = newScreenPos.y - this.shadowOffset;
    }
    
    updateWings() {
        // Use faster wing speed during display
        const speed = this.state === 'display' ? this.wingDisplaySpeed : this.wingSpeed;
        this.wingAngle += speed;
    }
    
    wander(flowers) {
        this.wanderTimer--;
        
        // Pick initial goal if we don't have one
        if (!this.goalGridPos) {
            this.pickNewGoal(flowers);
        }
        
        if (this.wanderTimer <= 0) {
            this.wanderTimer = random(40, 90); // Time between movement decisions
            
            // Calculate chance to forget current goal
            // Starts at 0%, increases rapidly after a few moves
            const forgetChance = this.movesSinceNewGoal === 0 ? 0 :
                                this.movesSinceNewGoal === 1 ? 0.1 :
                                this.movesSinceNewGoal === 2 ? 0.25 :
                                this.movesSinceNewGoal === 3 ? 0.45 :
                                this.movesSinceNewGoal === 4 ? 0.7 : 0.9;
            
            // Check if we've reached our goal or forgotten it
            const reachedGoal = abs(this.gridPos.x - this.goalGridPos.x) < 1 && 
                               abs(this.gridPos.y - this.goalGridPos.y) < 1;
            
            if (reachedGoal || random() < forgetChance) {
                // Pick a new goal
                this.pickNewGoal(flowers);
            }
            
            // Move toward goal with some randomness
            this.moveTowardGoal();
            
            // Track that we've made a move
            this.movesSinceNewGoal++;
        }
    }
    
    pickNewGoal(flowers) {
        this.movesSinceNewGoal = 0;
        
        // Initialize goalGridPos if needed
        if (!this.goalGridPos) {
            this.goalGridPos = {x: 0, y: 0};
        }
        
        // 30% chance to pick a flower as goal if any exist
        if (flowers.length > 0 && random() < 0.3) {
            const flower = random(flowers);
            const flowerGrid = gridManager.screenToIso(flower.x, flower.y);
            this.goalGridPos.x = flowerGrid.x;
            this.goalGridPos.y = flowerGrid.y;
        } else {
            // Pick random spot on the grid
            this.goalGridPos.x = random(2, gridManager.bounds.maxX - 2);
            this.goalGridPos.y = random(2, gridManager.bounds.maxY - 2);
        }
    }
    
    moveTowardGoal() {
        // Calculate direction to goal
        const dx = this.goalGridPos.x - this.gridPos.x;
        const dy = this.goalGridPos.y - this.gridPos.y;
        
        // If we're close enough, just stay put
        if (abs(dx) < 0.5 && abs(dy) < 0.5) {
            return;
        }
        
        // Normalize direction
        const dist = sqrt(dx * dx + dy * dy);
        let moveX = dx / dist;
        let moveY = dy / dist;
        
        // Add some randomness to movement (up to 45 degrees deviation)
        const wobble = random(-0.4, 0.4);
        const angle = atan2(moveY, moveX) + wobble;
        moveX = cos(angle);
        moveY = sin(angle);
        
        // Move 1-2 grid units in that direction
        const moveDistance = random(0.8, 1.5);
        this.targetGridPos.x = constrain(
            this.gridPos.x + moveX * moveDistance, 
            1, 
            gridManager.bounds.maxX - 1
        );
        this.targetGridPos.y = constrain(
            this.gridPos.y + moveY * moveDistance, 
            1, 
            gridManager.bounds.maxY - 1
        );
    }
    
    // Override parent's shadow drawing for custom butterfly shadow
    drawShadow(graphics, alpha) {
        graphics.noStroke();
        graphics.fill(0, 0, 0, min(50, alpha * 0.2));
        graphics.ellipse(this.x, this.y + this.shadowOffset, this.size * 0.8, this.size * 0.4);
    }
    
    // Override parent's entity drawing
    drawEntity(graphics, alpha) {
        // Draw butterfly at current position
        graphics.translate(this.x, this.y);
        
        const wingFlap = sin(this.wingAngle);
        const wingSpread = map(wingFlap, -1, 1, 0.4, 1);
        const wingTilt = map(wingFlap, -1, 1, -0.2, 0.1);
        
        graphics.noStroke();
        
        // Draw wings with Stardew Valley style - attached to body
        graphics.push();
        graphics.rotate(wingTilt);
        this.drawStardewWing(graphics, -1, wingSpread); // Left wing
        this.drawStardewWing(graphics, 1, wingSpread);  // Right wing
        graphics.pop();
        
        // Draw body on top
        this.drawBody(graphics);
    }
    
    drawStardewWing(graphics, direction, spread) {
        graphics.push();
        graphics.scale(spread, 1);
        
        // Stardew Valley style wing - simpler, cuter, attached to body
        const wingPattern = [
            [0,0,1,1,1],
            [0,1,1,1,1],
            [1,1,1,1,1],
            [1,1,1,1,0],
            [1,1,1,0,0],
            [0,1,0,0,0]
        ];
        
        // Wing base position (attached to body)
        const startX = direction * 2;
        const startY = -2;
        
        for (let y = 0; y < wingPattern.length; y++) {
            for (let x = 0; x < wingPattern[y].length; x++) {
                if (wingPattern[y][x]) {
                    // Main wing color - full opacity
                    graphics.fill(this.colors[0][0], this.colors[0][1], this.colors[0][2]);
                    
                    // Add pattern spots
                    if ((x === 2 && y === 2) || (x === 3 && y === 1)) {
                        graphics.fill(this.colors[1][0], this.colors[1][1], this.colors[1][2]);
                    }
                    
                    // Edge darkening for depth
                    if (x === 0 || x === 4 || y === 5) {
                        const dark = 0.8;
                        graphics.fill(
                            this.colors[0][0] * dark,
                            this.colors[0][1] * dark,
                            this.colors[0][2] * dark
                        );
                    }
                    
                    const pixelX = startX + (x * 2 * direction);
                    const pixelY = startY + (y * 2) - 4;
                    graphics.rect(pixelX, pixelY, 2, 2);
                }
            }
        }
        
        graphics.pop();
    }
    
    drawBody(graphics) {
        // Cute pixel art body - full opacity
        graphics.fill(40, 30, 20);
        graphics.rect(-2, -3, 4, 6); // Main body
        
        // Body highlights
        graphics.fill(60, 45, 30);
        graphics.rect(-1, -2, 2, 4);
        
        // Head
        graphics.fill(40, 30, 20);
        graphics.rect(-1, -4, 2, 2);
        
        // Antennae
        graphics.fill(40, 30, 20);
        graphics.rect(-2, -5, 1, 2);
        graphics.rect(1, -5, 1, 2);
    }
    
    // Start wing display animation
    startDisplay() {
        if (this.state === 'normal') {
            this.state = 'display';
            this.displayTimer = 0;
            this.hasBeenHovered = true;
        }
    }
    
    // Update display state
    updateDisplay(particleSystem) {
        this.displayTimer++;
        
        // Emit joy pixels at specific intervals during display
        if (this.displayTimer === 30 || this.displayTimer === 60 || this.displayTimer === 90) {
            this.emitJoyPixels(particleSystem);
        }
        
        // End display after duration
        if (this.displayTimer >= this.displayDuration) {
            this.state = 'normal';
            this.displayTimer = 0;
        }
    }
    
    // Emit joy pixels during display
    emitJoyPixels(particleSystem) {
        const numPixels = floor(random(3, 6)); // 3-5 pixels
        
        for (let i = 0; i < numPixels; i++) {
            // Use butterfly's colors for joy pixels
            const color = random(this.colors);
            
            // Emit with slight random offset and upward velocity
            const offsetX = random(-5, 5);
            const offsetY = random(-5, 5);
            
            // Create joy pixel with upward motion
            const pixel = particleSystem.emit(
                this.x + offsetX, 
                this.y + offsetY, 
                color, 
                1, 
                'joy'
            );
            
            // Joy pixels get their velocity from the isometric physics system
            // No need to manually override - the Pixel constructor handles this
        }
        
        // Emit display event for other systems to react
        eventBus.emit(GameEvents.BUTTERFLY_DROPPED_PIXELS, {
            butterfly: this,
            count: numPixels,
            type: 'joy'
        });
    }
    
    // Reset hover state when cursor moves away
    resetHoverState() {
        this.hasBeenHovered = false;
    }
    
}