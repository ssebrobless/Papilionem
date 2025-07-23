class Butterfly extends Entity {
    constructor(x, y, colors, isImmortal = false) {
        super(x, y);
        
        // Override base properties
        this.size = 12; // Smaller, cuter butterflies
        this.lifetime = 10000; // Long lifetime
        this.fadeStartLifetime = 2000;
        this.shadowOffset = gameConfig.entities.heightOffset.butterfly;
        
        // Immortality flag for first butterfly to prevent ecosystem collapse
        this.isImmortal = isImmortal;
        
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
        
        // Butterfly states
        this.state = 'normal'; // 'normal', 'display', 'scared', 'feeding', 'following'
        this.displayTimer = 0;
        this.displayDuration = 180; // 3 seconds at 60fps
        this.wingDisplaySpeed = 0.15; // Faster wing flapping during display
        this.hasBeenHovered = false; // Track if already displayed to this cursor position
        
        // Movement response system
        this.scaredTimer = 0;
        this.scaredDuration = 120; // 2 seconds at 60fps
        this.scareThreshold = 3.5; // Cursor velocity that triggers fear
        this.scareRadius = 45; // Distance within which fast cursor scares butterfly
        this.fleeSpeed = 0.025; // Faster movement when scared (vs normal 0.008)
        this.wingScaredSpeed = 0.25; // Very fast frantic wing flapping when scared
        
        // Happiness system (0-100%, 30% is baseline)
        this.happiness = 30; // Start at baseline
        this.baselineHappiness = 30;
        this.maxHappiness = 100;
        this.happinessDecayRate = (70 / (30 * 60)); // Decay from 100% to 30% in 30 seconds
        this.happinessDecayTimer = 0;
        
        // Feeding system
        this.feedingTimer = 0;
        this.maxFeedingTime = 300; // 5 seconds at 60fps
        this.targetFlower = null;
        this.feedingCooldowns = new Map(); // Track cooldowns per flower
        this.feedingCooldownDuration = 600; // 10 seconds at 60fps
        this.minFeedingHappiness = 85; // Won't feed if happiness >= 85%
        
        // Happiness-based behavior
        this.happySpeed = 0.012; // Faster movement when happy
        this.happyWingSpeed = 0.08; // Livelier wing animation when happy
        
        // Cursor-based interaction system
        this.followingCursor = false;
        this.followingTimer = 0;
        this.maxFollowingTime = 600; // 10 seconds max following
        this.followDistance = 25; // Distance to maintain from cursor when following
        this.interestRadius = 60; // Distance within which butterfly can become interested
        this.patienceRequired = 120; // 2 seconds of gentle cursor presence to gain trust
        this.currentPatienceTimer = 0;
        this.trustLevel = 0; // 0-100, how much butterfly trusts the current cursor session
    }
    
    update(gameState) {
        // Call parent update
        super.update(gameState);
        
        // Extract what we need from gameState
        const { flowers, particleSystem, cursorVelocity, adjustedMouseX, adjustedMouseY } = gameState;
        
        // Check for fast cursor movement nearby
        this.checkMovementResponse(cursorVelocity, adjustedMouseX, adjustedMouseY, particleSystem);
        
        // Handle cursor-based interactions (leading system)
        this.handleCursorInteraction(cursorVelocity, adjustedMouseX, adjustedMouseY, particleSystem);
        
        // Update happiness system
        this.updateHappiness();
        
        // Update feeding cooldowns
        this.updateFeedingCooldowns();
        
        // Handle different states
        if (this.state === 'display') {
            this.updateDisplay(particleSystem);
        } else if (this.state === 'scared') {
            this.updateScared(adjustedMouseX, adjustedMouseY, particleSystem);
        } else if (this.state === 'feeding') {
            this.updateFeeding(flowers, particleSystem);
        } else if (this.state === 'following') {
            this.updateFollowing(adjustedMouseX, adjustedMouseY, particleSystem);
        } else {
            // Normal behavior when not displaying, scared, feeding, or following
            // Check if we should seek flowers (if happiness <= baseline)
            if (this.happiness <= this.baselineHappiness) {
                this.seekFlowers(flowers);
            } else {
                // Simple wandering behavior
                this.wander(flowers);
            }
            
            // Move toward target
            this.move();
        }
        
        // Update wing animation
        this.updateWings();
        
        // Emit particles based on happiness level
        this.updateParticleEmission(particleSystem);
    }
    
    move() {
        // Move in grid space for proper isometric movement
        const gridDx = this.targetGridPos.x - this.gridPos.x;
        const gridDy = this.targetGridPos.y - this.gridPos.y;
        
        // Calculate speed based on state and happiness
        let currentSpeed = this.speed;
        if (this.state === 'scared') {
            currentSpeed = this.fleeSpeed;
        } else if (this.state === 'feeding') {
            currentSpeed = 0; // Don't move while feeding
        } else if (this.happiness > this.baselineHappiness) {
            // Happier butterflies move faster and more lively
            const happinessRatio = (this.happiness - this.baselineHappiness) / (this.maxHappiness - this.baselineHappiness);
            currentSpeed = this.speed + (this.happySpeed - this.speed) * happinessRatio;
        }
        
        // Update grid position
        this.gridPos.x += gridDx * currentSpeed;
        this.gridPos.y += gridDy * currentSpeed;
        
        // Convert to screen space
        const newScreenPos = gridManager.isoToScreen(this.gridPos.x, this.gridPos.y);
        this.x = newScreenPos.x;
        this.y = newScreenPos.y - this.shadowOffset;
    }
    
    // Check for fast cursor movement and respond accordingly
    checkMovementResponse(cursorVelocity, cursorX, cursorY, particleSystem) {
        // Only respond if not already in display state
        if (this.state === 'display') return;
        
        // Calculate distance to cursor
        const distToCursor = Math.hypot(this.x - cursorX, this.y - cursorY);
        
        // If cursor is moving fast and nearby, get scared
        if (cursorVelocity > this.scareThreshold && distToCursor < this.scareRadius) {
            if (this.state !== 'scared') {
                this.startScared(cursorX, cursorY);
                this.emitStressPixels(particleSystem);
                
                // Slightly reduce happiness when scared (but not easily to 0%)
                const happinessLoss = 2 + random(1, 3); // Lose 2-5% happiness
                this.happiness = Math.max(5, this.happiness - happinessLoss); // Never drop below 5%
                
                // Emit scared event
                eventBus.emit(GameEvents.BUTTERFLY_SCARED, {
                    butterfly: this,
                    cursorVelocity: cursorVelocity,
                    distance: distToCursor
                });
            }
        }
    }
    
    // Start scared state
    startScared(cursorX, cursorY) {
        this.state = 'scared';
        this.scaredTimer = 0;
        
        // Set flee target away from cursor
        this.setFleeTarget(cursorX, cursorY);
    }
    
    // Update scared state behavior
    updateScared(cursorX, cursorY, particleSystem) {
        this.scaredTimer++;
        
        // Continue fleeing from cursor
        this.fleeFromCursor(cursorX, cursorY);
        
        // Move toward flee target
        this.move();
        
        // Emit stress pixels occasionally while scared
        if (this.scaredTimer % 20 === 0 && random() < 0.6) {
            this.emitStressPixels(particleSystem);
        }
        
        // End scared state after duration
        if (this.scaredTimer >= this.scaredDuration) {
            this.state = 'normal';
            this.scaredTimer = 0;
            // Reset to normal wandering
            this.wanderTimer = random(30, 60);
        }
    }
    
    // Set a target position away from the cursor
    setFleeTarget(cursorX, cursorY) {
        const cursorGrid = gridManager.screenToIso(cursorX, cursorY);
        
        // Calculate direction away from cursor
        const awayX = this.gridPos.x - cursorGrid.x;
        const awayY = this.gridPos.y - cursorGrid.y;
        
        // Normalize and extend
        const dist = Math.max(sqrt(awayX * awayX + awayY * awayY), 0.1);
        const fleeDistance = random(3, 6); // Flee 3-6 grid units away
        
        this.targetGridPos.x = constrain(
            this.gridPos.x + (awayX / dist) * fleeDistance,
            1,
            gridManager.bounds.maxX - 1
        );
        this.targetGridPos.y = constrain(
            this.gridPos.y + (awayY / dist) * fleeDistance,
            1,
            gridManager.bounds.maxY - 1
        );
    }
    
    // Continue fleeing behavior during scared state
    fleeFromCursor(cursorX, cursorY) {
        // Update flee target if cursor is still too close
        const distToCursor = Math.hypot(this.x - cursorX, this.y - cursorY);
        if (distToCursor < this.scareRadius * 0.7) {
            this.setFleeTarget(cursorX, cursorY);
        }
    }
    
    // Emit darker stressed pixels when scared
    emitStressPixels(particleSystem) {
        const numPixels = floor(random(2, 4)); // Fewer stress pixels than joy pixels
        
        for (let i = 0; i < numPixels; i++) {
            // Create darker, stressed version of butterfly colors
            const baseColor = random(this.colors);
            const stressColor = [
                Math.floor(baseColor[0] * 0.4), // Much darker red
                Math.floor(baseColor[1] * 0.4), // Much darker green  
                Math.floor(baseColor[2] * 0.4)  // Much darker blue
            ];
            
            // Add slight random offset
            const offsetX = random(-8, 8);
            const offsetY = random(-8, 8);
            
            particleSystem.emit(
                this.x + offsetX,
                this.y + offsetY,
                stressColor,
                1,
                'stress' // New particle type for stress pixels
            );
        }
        
        // Emit stress event
        eventBus.emit(GameEvents.BUTTERFLY_DROPPED_PIXELS, {
            butterfly: this,
            count: numPixels,
            type: 'stress'
        });
    }
    
    updateWings() {
        // Use different wing speeds based on state and happiness
        let speed = this.wingSpeed;
        if (this.state === 'display') {
            speed = this.wingDisplaySpeed;
        } else if (this.state === 'scared') {
            speed = this.wingScaredSpeed;
        } else if (this.state === 'feeding') {
            speed = this.wingSpeed * 0.3; // Slow, gentle wing flapping while feeding
        } else if (this.state === 'following') {
            speed = this.wingSpeed * 1.3; // Slightly faster, excited wing flapping when following
        } else if (this.happiness > this.baselineHappiness) {
            // Happier butterflies have livelier wing animation
            const happinessRatio = (this.happiness - this.baselineHappiness) / (this.maxHappiness - this.baselineHappiness);
            speed = this.wingSpeed + (this.happyWingSpeed - this.wingSpeed) * happinessRatio;
        }
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
        
        // Draw happiness aura/glow behind butterfly
        this.drawHappinessAura(graphics, alpha);
        
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
    
    // Draw happiness aura/glow behind butterfly
    drawHappinessAura(graphics, alpha) {
        if (this.happiness <= this.baselineHappiness) {
            // No aura at or below baseline happiness
            if (this.happiness < this.baselineHappiness) {
                // Draw subtle dark aura for unhappy butterflies
                const sadnessRatio = (this.baselineHappiness - this.happiness) / this.baselineHappiness;
                const auraSize = 20 + sadnessRatio * 10;
                const auraAlpha = min(40 * sadnessRatio, alpha * 0.6);
                
                graphics.push();
                graphics.noStroke();
                graphics.fill(50, 50, 80, auraAlpha);
                graphics.ellipse(0, 0, auraSize, auraSize * 0.7);
                graphics.pop();
            }
            return;
        }
        
        // Calculate happiness ratio above baseline
        const happinessRatio = (this.happiness - this.baselineHappiness) / (this.maxHappiness - this.baselineHappiness);
        
        // Aura grows larger and brighter with happiness
        const maxAuraSize = 35;
        const auraSize = 15 + happinessRatio * maxAuraSize;
        const auraAlpha = min(30 + happinessRatio * 80, alpha * 0.8);
        
        // Use butterfly's colors for the aura
        const auraColor = this.colors[0]; // Use primary wing color
        
        graphics.push();
        graphics.noStroke();
        
        // Draw multiple layers for a soft glow effect
        for (let i = 3; i > 0; i--) {
            const layerSize = auraSize * (i / 3);
            const layerAlpha = auraAlpha * (0.3 / i);
            
            graphics.fill(
                auraColor[0], 
                auraColor[1], 
                auraColor[2], 
                layerAlpha
            );
            graphics.ellipse(0, 0, layerSize, layerSize * 0.7);
        }
        
        // Add a subtle pulse effect for very happy butterflies
        if (happinessRatio > 0.8) {
            const pulse = sin(frameCount * 0.1) * 0.2 + 0.8;
            const pulseSize = auraSize * pulse;
            graphics.fill(255, 255, 255, auraAlpha * 0.3 * pulse);
            graphics.ellipse(0, 0, pulseSize, pulseSize * 0.7);
        }
        
        graphics.pop();
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
    
    // Override isDead to handle immortal butterflies
    isDead() {
        const shouldDie = super.isDead(); // Call parent's isDead logic
        
        // Immortal butterflies restart instead of dying
        if (shouldDie && this.isImmortal) {
            console.log(`🦋 Immortal butterfly restarting lifecycle`);
            this.restartLifecycle();
            return false;
        }
        
        return shouldDie;
    }
    
    // Restart lifecycle for immortal butterflies
    restartLifecycle() {
        this.lifetime = 10000; // Reset to full lifetime
        this.happiness = this.baselineHappiness; // Reset to baseline happiness
        this.state = 'normal';
        this.feedingCooldowns.clear(); // Clear all feeding cooldowns
        this.hasBeenHovered = false;
        
        // Reset position to a safe location
        const safeGridX = random(4, 14);
        const safeGridY = random(4, 14);
        const safeScreen = gridManager.isoToScreen(safeGridX, safeGridY);
        this.x = safeScreen.x;
        this.y = safeScreen.y - this.shadowOffset;
        this.gridPos.x = safeGridX;
        this.gridPos.y = safeGridY;
        this.targetGridPos = {...this.gridPos};
        
        // Clear any ongoing goals
        this.goalGridPos = null;
        this.targetFlower = null;
        this.wanderTimer = random(30, 60);
        
        // Emit rebirth event
        eventBus.emit(GameEvents.BUTTERFLY_SPAWNED, { 
            butterfly: this, 
            source: 'immortalRestart' 
        });
    }
    
    // Update happiness system - handles decay over time
    updateHappiness() {
        // Only decay happiness if above baseline
        if (this.happiness > this.baselineHappiness) {
            this.happiness = Math.max(this.baselineHappiness, this.happiness - this.happinessDecayRate);
        }
        
        // Clamp happiness to valid range
        this.happiness = Math.max(0, Math.min(this.maxHappiness, this.happiness));
    }
    
    // Update feeding cooldowns for all flowers
    updateFeedingCooldowns() {
        for (let [flowerId, cooldownTime] of this.feedingCooldowns.entries()) {
            if (cooldownTime > 0) {
                this.feedingCooldowns.set(flowerId, cooldownTime - 1);
            } else {
                this.feedingCooldowns.delete(flowerId);
            }
        }
    }
    
    // Handle feeding state behavior
    updateFeeding(flowers, particleSystem) {
        this.feedingTimer++;
        
        // Check if target flower still exists and is nearby
        if (!this.targetFlower || !flowers.includes(this.targetFlower)) {
            this.endFeeding();
            return;
        }
        
        // Check if we're still close enough to the flower
        const distToFlower = Math.hypot(this.x - this.targetFlower.x, this.y - this.targetFlower.y);
        if (distToFlower > 25) { // Lost contact with flower
            this.endFeeding();
            return;
        }
        
        // Increase happiness based on flower stage
        const feedingRate = this.getFeedingRate(this.targetFlower);
        this.happiness = Math.min(this.maxHappiness, this.happiness + feedingRate);
        
        // End feeding if max time reached or max happiness reached
        if (this.feedingTimer >= this.maxFeedingTime || this.happiness >= this.maxHappiness) {
            this.endFeeding();
        }
    }
    
    // Get feeding rate based on flower stage
    getFeedingRate(flower) {
        switch (flower.stage) {
            case 'bloom': return 0.2; // 20% per 5 seconds = 4% per second
            case 'mature': return 0.4; // 40% per 5 seconds = 8% per second  
            case 'wilting': return 0.1; // 10% per 5 seconds = 2% per second
            case 'dissolve': return 0.05; // 5% per 5 seconds = 1% per second
            default: return 0.2;
        }
    }
    
    // End feeding state and set cooldown
    endFeeding() {
        if (this.targetFlower) {
            // Set feeding cooldown for this specific flower
            const flowerId = this.targetFlower.id || this.getFlowerId(this.targetFlower);
            this.feedingCooldowns.set(flowerId, this.feedingCooldownDuration);
        }
        
        this.state = 'normal';
        this.feedingTimer = 0;
        this.targetFlower = null;
        this.wanderTimer = random(30, 60); // Resume wandering
    }
    
    // Generate unique ID for flower (fallback if flower doesn't have id)
    getFlowerId(flower) {
        return `${Math.floor(flower.x)}_${Math.floor(flower.y)}`;
    }
    
    // Actively seek flowers when happiness is at or below baseline
    seekFlowers(flowers) {
        // Look for available flowers (not on cooldown, within feeding happiness range)
        const availableFlowers = flowers.filter(flower => {
            const flowerId = flower.id || this.getFlowerId(flower);
            const onCooldown = this.feedingCooldowns.has(flowerId);
            const canFeed = this.happiness < this.minFeedingHappiness;
            const inRange = Math.hypot(this.x - flower.x, this.y - flower.y) < 80; // Seek within reasonable range
            return !onCooldown && canFeed && inRange;
        });
        
        if (availableFlowers.length > 0) {
            // Pick the closest available flower
            let closestFlower = availableFlowers[0];
            let closestDist = Math.hypot(this.x - closestFlower.x, this.y - closestFlower.y);
            
            for (let flower of availableFlowers) {
                const dist = Math.hypot(this.x - flower.x, this.y - flower.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestFlower = flower;
                }
            }
            
            // Set target to the flower
            const flowerGrid = gridManager.screenToIso(closestFlower.x, closestFlower.y);
            this.goalGridPos = this.goalGridPos || {x: 0, y: 0};
            this.goalGridPos.x = flowerGrid.x;
            this.goalGridPos.y = flowerGrid.y;
            
            // Check if we're close enough to start feeding
            if (closestDist < 20) {
                this.startFeeding(closestFlower);
            } else {
                // Move toward the flower
                this.moveTowardGoal();
            }
        } else {
            // No available flowers, just wander
            this.wander(flowers);
        }
    }
    
    // Start feeding from a flower
    startFeeding(flower) {
        this.state = 'feeding';
        this.targetFlower = flower;
        this.feedingTimer = 0;
        
        // Position butterfly close to flower for feeding
        const flowerGrid = gridManager.screenToIso(flower.x, flower.y);
        this.targetGridPos.x = flowerGrid.x + random(-0.3, 0.3); // Small offset for natural look
        this.targetGridPos.y = flowerGrid.y + random(-0.3, 0.3);
        
        // Emit feeding event
        eventBus.emit(GameEvents.BUTTERFLY_VISITED_FLOWER, {
            butterfly: this,
            flower: flower
        });
    }
    
    // Emit particles based on happiness level
    updateParticleEmission(particleSystem) {
        // Only emit particles occasionally and based on happiness
        if (frameCount % 180 === 0) { // Every 3 seconds
            if (this.happiness > this.baselineHappiness) {
                // Happy butterflies emit stronger pixels
                const happinessRatio = (this.happiness - this.baselineHappiness) / (this.maxHappiness - this.baselineHappiness);
                const emitChance = 0.3 + happinessRatio * 0.4; // 30-70% chance based on happiness
                
                if (random() < emitChance) {
                    const color = random(this.colors);
                    const strength = 1 + Math.floor(happinessRatio * 2); // 1-3 particles based on happiness
                    particleSystem.emit(this.x, this.y, color, strength, 'happy');
                }
            }
            // Baseline happiness butterflies emit nothing
            // Sad/scared butterflies emit stress pixels (handled in scared state)
        }
    }
    
    // Handle cursor-based interaction system for leading butterflies
    handleCursorInteraction(cursorVelocity, cursorX, cursorY, particleSystem) {
        // Skip cursor interactions if in certain states
        if (this.state === 'scared' || this.state === 'display' || this.state === 'feeding') {
            this.resetCursorInteraction();
            return;
        }
        
        const distToCursor = Math.hypot(this.x - cursorX, this.y - cursorY);
        
        // Check if cursor is within interest radius
        if (distToCursor <= this.interestRadius) {
            // Cursor is nearby - evaluate interaction
            this.evaluateCursorPresence(cursorVelocity, cursorX, cursorY, distToCursor, particleSystem);
        } else {
            // Cursor is too far away - reset interaction state
            this.resetCursorInteraction();
        }
    }
    
    // Evaluate cursor presence and build trust/interest
    evaluateCursorPresence(cursorVelocity, cursorX, cursorY, distance, particleSystem) {
        // Define cursor states based on velocity and distance
        let cursorState = 'neutral';
        
        if (cursorVelocity > this.scareThreshold) {
            cursorState = 'scaring'; // Fast movement = scary
        } else if (cursorVelocity < 0.5 && distance < this.interestRadius * 0.7) {
            cursorState = 'attracting'; // Still and close = potentially attractive
        } else {
            cursorState = 'neutral'; // Moving but not fast, or far away
        }
        
        // Handle different cursor states
        switch (cursorState) {
            case 'scaring':
                // Reset trust and patience when cursor is scary
                this.resetCursorInteraction();
                break;
                
            case 'attracting':
                // Build patience and trust when cursor is gentle and close
                this.buildCursorTrust(cursorX, cursorY, particleSystem);
                break;
                
            case 'neutral':
                // Slow decay of patience when cursor is neutral
                if (this.currentPatienceTimer > 0) {
                    this.currentPatienceTimer = Math.max(0, this.currentPatienceTimer - 0.5);
                }
                break;
        }
        
        // Emit cursor state event for visual feedback
        eventBus.emit('cursor:state', {
            butterfly: this,
            cursorState: cursorState,
            distance: distance,
            patience: this.currentPatienceTimer,
            trustLevel: this.trustLevel
        });
    }
    
    // Build trust and patience with gentle cursor presence
    buildCursorTrust(cursorX, cursorY, particleSystem) {
        this.currentPatienceTimer++;
        
        // If we've built enough patience and aren't already following
        if (this.currentPatienceTimer >= this.patienceRequired && this.state !== 'following') {
            this.startFollowing(cursorX, cursorY);
            
            // Increase trust level
            this.trustLevel = Math.min(100, this.trustLevel + 10);
            
            // Emit trust gained event
            eventBus.emit(GameEvents.BUTTERFLY_DISPLAY, {
                butterfly: this,
                reason: 'cursorTrust'
            });
            
            // Small joy particle burst to show trust
            particleSystem.emitBurst(this.x, this.y, random(this.colors), 3);
        }
    }
    
    // Start following the cursor
    startFollowing(cursorX, cursorY) {
        this.state = 'following';
        this.followingTimer = 0;
        this.followingCursor = true;
        
        console.log('🦋 Butterfly started following cursor');
        
        // Emit following event
        eventBus.emit('butterfly:startFollowing', {
            butterfly: this,
            cursorPosition: { x: cursorX, y: cursorY }
        });
    }
    
    // Update following behavior
    updateFollowing(cursorX, cursorY, particleSystem) {
        this.followingTimer++;
        
        const distToCursor = Math.hypot(this.x - cursorX, this.y - cursorY);
        
        // End following if cursor moved too fast or too far away
        if (distToCursor > this.interestRadius * 1.5) {
            this.endFollowing('tooFar');
            return;
        }
        
        // End following after max time
        if (this.followingTimer >= this.maxFollowingTime) {
            this.endFollowing('timeout');
            return;
        }
        
        // Follow the cursor by setting target position near it
        const cursorGrid = gridManager.screenToIso(cursorX, cursorY);
        
        // Calculate a position near the cursor but not too close
        const followAngle = random(TWO_PI);
        const followDist = this.followDistance / gameConfig.grid.cellSize; // Convert to grid units
        
        this.targetGridPos.x = cursorGrid.x + cos(followAngle) * followDist;
        this.targetGridPos.y = cursorGrid.y + sin(followAngle) * followDist;
        
        // Constrain to grid bounds
        this.targetGridPos.x = constrain(this.targetGridPos.x, 1, gridManager.bounds.maxX - 1);
        this.targetGridPos.y = constrain(this.targetGridPos.y, 1, gridManager.bounds.maxY - 1);
        
        // Move toward target
        this.move();
        
        // Occasionally emit happy particles while following
        if (this.followingTimer % 60 === 0) { // Every second
            particleSystem.emit(this.x, this.y, random(this.colors), 1, 'joy');
        }
    }
    
    // End following state
    endFollowing(reason) {
        this.state = 'normal';
        this.followingCursor = false;
        this.followingTimer = 0;
        this.currentPatienceTimer = 0;
        
        // Don't reset trust completely - it persists across sessions
        this.trustLevel = Math.max(0, this.trustLevel - 5);
        
        console.log(`🦋 Butterfly stopped following cursor (${reason})`);
        
        // Resume normal wandering
        this.wanderTimer = random(30, 60);
        
        // Emit following end event
        eventBus.emit('butterfly:endFollowing', {
            butterfly: this,
            reason: reason,
            duration: this.followingTimer
        });
    }
    
    // Reset cursor interaction state
    resetCursorInteraction() {
        this.currentPatienceTimer = 0;
        
        if (this.state === 'following') {
            this.endFollowing('reset');
        }
    }
    
}