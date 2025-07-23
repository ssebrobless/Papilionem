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
        this.happiness = 30; // All butterflies start at baseline
        this.baselineHappiness = 30;
        this.maxHappiness = 100;
        this.happinessDecayRate = (70 / (90 * 60)); // Decay from 100% to 30% in 90 seconds (1.5 minutes)
        this.happinessDecayTimer = 0;
        
        // Feeding system
        this.feedingTimer = 0;
        this.maxFeedingTime = 180; // 3 seconds at 60fps for balanced feeding
        this.targetFlower = null;
        this.feedingCooldowns = new Map(); // Track cooldowns per flower
        this.feedingCooldownDuration = 600; // 10 seconds at 60fps
        this.minFeedingHappiness = 85; // Won't feed if happiness >= 85%
        this.postFeedingCooldown = 0; // Prevents immediate re-seeking after feeding
        this.postFeedingCooldownDuration = 300; // 5 seconds before seeking again
        
        // Happiness-based behavior
        this.happySpeed = 0.012; // Faster movement when happy
        this.happyWingSpeed = 0.08; // Livelier wing animation when happy
        
        // Cursor-based interaction system
        this.followingCursor = false;
        this.followingTimer = 0;
        this.maxFollowingTime = 600; // 10 seconds max following
        this.followDistance = 30; // Distance to maintain from cursor when following
        this.interestRadius = 80; // Larger distance for easier interaction
        this.patienceRequired = 90; // 1.5 seconds of gentle cursor presence (easier)
        this.currentPatienceTimer = 0;
        this.trustLevel = 0; // 0-100, how much butterfly trusts the current cursor session
        this.trustGlowAlpha = 0; // Visual feedback for trust building
        this.followOffset = { x: 0, y: 0 }; // Smooth following offset
        this.smoothFollowTarget = { x: 0, y: 0 }; // Smoothed target position
        this.followSmoothness = 0.1; // How quickly to interpolate to cursor position
        
        // Flower seeking tracking
        this.seekingFlower = false; // Flag to indicate active flower seeking
        this.flowerSeekTimer = 0; // Timer for seeking intervals
        this.flowerSeekInterval = 600; // Re-evaluate flower goals every 10 seconds (600 frames)
        
        // Meandering/roaming system (for happy butterflies >30% happiness)
        this.meanderTarget = null; // Separate from goalGridPos to avoid conflicts
        this.lastGridDistance = 0; // Track distance traveled for lose-focus mechanic
        this.meanderSpeed = 0.006; // Slower than normal speed for lazy roaming
        
        // Initialize feeding start happiness tracker
        this.feedingStartHappiness = null;
        
        // Exclamation mark popup for scared state
        this.exclamationTimer = 0;
        this.exclamationDuration = 45; // 0.75 seconds
        this.exclamationY = 0; // Vertical offset for animation
    }
    
    update(gameState) {
        // Call parent update
        super.update(gameState);
        
        // Extract what we need from gameState
        const { flowers, particleSystem, cursorVelocity, adjustedMouseX, adjustedMouseY } = gameState;
        
        // Check for fast cursor movement nearby
        this.checkMovementResponse(cursorVelocity, adjustedMouseX, adjustedMouseY, particleSystem);
        
        // Handle cursor-based interactions (leading system)
        this.handleCursorInteraction(cursorVelocity, adjustedMouseX, adjustedMouseY, particleSystem, gameState);
        
        // Update happiness system
        this.updateHappiness();
        
        // Update feeding cooldowns
        this.updateFeedingCooldowns();
        
        // Update post-feeding cooldown
        if (this.postFeedingCooldown > 0) {
            this.postFeedingCooldown--;
        }
        
        // Update exclamation popup timer
        if (this.exclamationTimer > 0) {
            this.exclamationTimer--;
            // Animate upward and fade
            this.exclamationY -= 0.5;
        }
        
        // Update trust glow fade
        if (this.trustGlowAlpha > 0 && this.currentPatienceTimer === 0) {
            this.trustGlowAlpha = Math.max(0, this.trustGlowAlpha - 5);
        }
        
        // Debug state transitions
        if (this.lastState !== this.state) {
            console.log(`🦋 STATE CHANGE: ${this.lastState || 'initial'} → ${this.state}`);
            this.lastState = this.state;
        }
        
        // Handle different states
        if (this.state === 'display') {
            this.updateDisplay(particleSystem);
        } else if (this.state === 'scared') {
            this.updateScared(adjustedMouseX, adjustedMouseY, particleSystem);
        } else if (this.state === 'feeding') {
            this.updateFeeding(flowers, particleSystem);
        } else if (this.state === 'following') {
            this.updateFollowing(adjustedMouseX, adjustedMouseY, particleSystem, flowers);
        } else {
            // Normal behavior when not displaying, scared, feeding, or following
            // Update seeking timer
            this.flowerSeekTimer++;
            
            // Check if we should seek flowers (if happiness < baseline and not on cooldown)
            if (this.happiness < this.baselineHappiness && this.postFeedingCooldown === 0) {
                // Only seek a NEW flower if we don't have a current goal, or need to re-evaluate
                if (!this.goalGridPos || (this.flowerSeekTimer >= this.flowerSeekInterval)) {
                    this.validateAndSeekFlowers(flowers);
                    this.flowerSeekTimer = 0; // Reset timer
                }
                
                // If we have a goal, commit to it - set target directly to the goal
                if (this.goalGridPos && this.seekingFlower) {
                    // Set target directly to the flower position - let move() handle the journey
                    this.targetGridPos.x = this.goalGridPos.x;
                    this.targetGridPos.y = this.goalGridPos.y;
                    
                    // Check if we've reached the target flower
                    const distToGoal = Math.hypot(this.gridPos.x - this.goalGridPos.x, this.gridPos.y - this.goalGridPos.y);
                    if (distToGoal < 0.5) { // Within half a grid unit
                        // Find the flower at our goal and start feeding
                        const targetFlower = this.findFlowerAtGoal(flowers);
                        if (targetFlower && this.isFlowerAvailable(targetFlower)) {
                            // Re-check if we still need to feed (happiness might have increased while traveling)
                            if (this.happiness < this.baselineHappiness) {
                                console.log(`🦋 REACHED FLOWER: Starting self-feeding at happiness ${Math.round(this.happiness)}%`);
                                this.startFeeding(targetFlower);
                            } else {
                                console.log(`🦋 NO LONGER HUNGRY: Happiness ${Math.round(this.happiness)}% >= baseline ${this.baselineHappiness}%`);
                                this.goalGridPos = null;
                                this.seekingFlower = false;
                            }
                        } else {
                            console.log(`🦋 FLOWER GONE: Target flower no longer available`);
                            this.goalGridPos = null;
                            this.seekingFlower = false;
                        }
                    }
                }
            } else {
                // Meandering behavior for happy butterflies (>= baseline) OR on cooldown
                if (this.happiness >= this.baselineHappiness) {
                    this.seekingFlower = false; // Not seeking when at or above baseline
                    this.goalGridPos = null; // Clear any seeking goal
                } else if (this.postFeedingCooldown > 0) {
                    if (this.seekingFlower) {
                        console.log(`🦋 COOLDOWN PREVENTS SEEKING: ${this.postFeedingCooldown} frames remaining`);
                    }
                    this.seekingFlower = false; // Not seeking when on cooldown
                    this.goalGridPos = null; // Clear any seeking goal
                }
                this.meander();
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
        const distToTarget = sqrt(gridDx * gridDx + gridDy * gridDy);
        
        
        // Calculate speed based on state and happiness
        let currentSpeed = this.speed;
        if (this.state === 'scared') {
            currentSpeed = this.fleeSpeed;
        } else if (this.state === 'feeding') {
            currentSpeed = 0; // Don't move while feeding
        } else if (this.seekingFlower) {
            // Butterflies move slightly faster when seeking flowers
            currentSpeed = 0.007; // 15-20% faster than meandering (0.006)
        } else if (this.meanderTarget) {
            // Slow meandering when roaming aimlessly  
            currentSpeed = this.meanderSpeed; // Slowest speed for lazy exploration
        } else if (this.happiness > this.baselineHappiness) {
            // Happier butterflies move faster and more lively
            const happinessRatio = (this.happiness - this.baselineHappiness) / (this.maxHappiness - this.baselineHappiness);
            currentSpeed = this.speed + (this.happySpeed - this.speed) * happinessRatio;
        }
        
        // Update grid position
        const oldX = this.gridPos.x;
        const oldY = this.gridPos.y;
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
        
        // Trigger exclamation mark popup
        this.exclamationTimer = this.exclamationDuration;
        this.exclamationY = -5; // Start position above butterfly
        
        // Clear any flower seeking goal and meandering when scared
        this.seekingFlower = false;
        this.goalGridPos = null;
        this.meanderTarget = null;
        
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
            // Reset to normal wandering (goal already cleared in startScared)
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
            2,
            gridManager.bounds.maxX - 2
        );
        this.targetGridPos.y = constrain(
            this.gridPos.y + (awayY / dist) * fleeDistance,
            2,
            gridManager.bounds.maxY - 2
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
    
    // Meandering behavior for happy butterflies (>30% happiness)
    meander() {
        // If no meander target, pick one
        if (!this.meanderTarget) {
            this.pickMeanderTarget();
        }
        
        // Calculate distance to current target
        const distToTarget = Math.hypot(
            this.meanderTarget.x - this.gridPos.x,
            this.meanderTarget.y - this.gridPos.y
        );
        
        // Check if we've reached the target (within 0.5 grid units)
        if (distToTarget < 0.5) {
            this.pickMeanderTarget(); // Pick new target when reached
            return;
        }
        
        // Track progress: 33% chance to lose focus for each grid unit traveled
        const currentDistance = Math.floor(distToTarget);
        if (currentDistance < this.lastGridDistance) {
            // We've made progress - check if we lose focus
            if (random() < 0.33) {
                this.pickMeanderTarget(); // Lose focus and pick new target
                return;
            }
        }
        this.lastGridDistance = currentDistance;
        
        // Move toward meander target with wobble
        this.moveTowardMeanderTarget();
    }
    
    // Pick a random grid coordinate for meandering
    pickMeanderTarget() {
        this.meanderTarget = {
            x: random(3, gridManager.bounds.maxX - 3),
            y: random(3, gridManager.bounds.maxY - 3)
        };
        this.lastGridDistance = Math.floor(Math.hypot(
            this.meanderTarget.x - this.gridPos.x,
            this.meanderTarget.y - this.gridPos.y
        ));
    }
    
    // Move toward meander target with wobble and randomness
    moveTowardMeanderTarget() {
        if (!this.meanderTarget) return;
        
        // Calculate direction to target
        const dx = this.meanderTarget.x - this.gridPos.x;
        const dy = this.meanderTarget.y - this.gridPos.y;
        const dist = Math.max(sqrt(dx * dx + dy * dy), 0.1);
        
        // Normalize direction
        let moveX = dx / dist;
        let moveY = dy / dist;
        
        // Add significant wobble for lazy meandering (up to 60 degrees deviation)
        const wobble = random(-0.6, 0.6);
        const angle = atan2(moveY, moveX) + wobble;
        moveX = cos(angle);
        moveY = sin(angle);
        
        // Move a small random distance (more random than goal-oriented movement)
        const moveDistance = random(0.3, 0.8);
        this.targetGridPos.x = constrain(
            this.gridPos.x + moveX * moveDistance,
            2,
            gridManager.bounds.maxX - 2
        );
        this.targetGridPos.y = constrain(
            this.gridPos.y + moveY * moveDistance,
            2,
            gridManager.bounds.maxY - 2
        );
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
            2, 
            gridManager.bounds.maxX - 2
        );
        this.targetGridPos.y = constrain(
            this.gridPos.y + moveY * moveDistance, 
            2, 
            gridManager.bounds.maxY - 2
        );
    }
    
    // Move directly toward goal without wobble (for committed flower-seeking)
    moveDirectlyTowardGoal() {
        if (!this.goalGridPos) {
            return;
        }
        
        // Calculate direction to goal
        const dx = this.goalGridPos.x - this.gridPos.x;
        const dy = this.goalGridPos.y - this.gridPos.y;
        const distToGoal = sqrt(dx * dx + dy * dy);
        
        // If we're close enough, just stay put
        if (abs(dx) < 0.3 && abs(dy) < 0.3) {
            return;
        }
        
        // Normalize direction
        const moveX = dx / distToGoal;
        const moveY = dy / distToGoal;
        
        // Move directly toward goal (no wobble, consistent distance)
        const moveDistance = 1.2; // Consistent movement speed for determined seeking
        this.targetGridPos.x = constrain(
            this.gridPos.x + moveX * moveDistance, 
            2, 
            gridManager.bounds.maxX - 2
        );
        this.targetGridPos.y = constrain(
            this.gridPos.y + moveY * moveDistance, 
            2, 
            gridManager.bounds.maxY - 2
        );
    }
    
    // Override parent's draw to add following connection
    draw(graphics) {
        // Draw following connection line first (behind everything)
        if (this.state === 'following' && this.followingCursorPos) {
            this.drawFollowingConnection(graphics);
        }
        
        // Call parent draw
        super.draw(graphics);
    }
    
    // Draw connection line when following cursor
    drawFollowingConnection(graphics) {
        graphics.push();
        
        // Soft dotted line effect
        const segments = 8;
        const dx = this.followingCursorPos.x - this.x;
        const dy = this.followingCursorPos.y - this.y;
        
        graphics.noFill();
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const x = this.x + dx * t;
            const y = this.y + dy * t;
            
            // Fade effect
            const alpha = map(i, 0, segments, 30, 10);
            graphics.stroke(255, 255, 200, alpha);
            graphics.strokeWeight(2);
            
            if (i % 2 === 0) {
                const nextT = (i + 0.5) / segments;
                const nextX = this.x + dx * nextT;
                const nextY = this.y + dy * nextT;
                graphics.line(x, y, nextX, nextY);
            }
        }
        
        graphics.pop();
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
        graphics.push();
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
        
        // Draw exclamation mark popup if active
        if (this.exclamationTimer > 0) {
            this.drawExclamation(graphics);
        }
        
        // Draw trust building indicator
        if (this.trustGlowAlpha > 0) {
            this.drawTrustIndicator(graphics);
        }
        
        graphics.pop();
    }
    
    // Draw happiness aura/glow behind butterfly
    drawHappinessAura(graphics, alpha) {
        // Check for scared state first - red stress aura
        if (this.state === 'scared') {
            const stressPulse = sin(frameCount * 0.3) * 0.3 + 0.7;
            const stressSize = 25 + stressPulse * 10;
            
            graphics.push();
            graphics.noStroke();
            // Red stress aura with pulsing
            for (let i = 3; i > 0; i--) {
                const layerSize = stressSize * (i / 3);
                const layerAlpha = (60 / i) * stressPulse;
                graphics.fill(255, 50, 50, layerAlpha);
                graphics.ellipse(0, 0, layerSize, layerSize * 0.7);
            }
            graphics.pop();
            return;
        }
        
        if (this.happiness <= this.baselineHappiness) {
            // No aura at or below baseline happiness
            if (this.happiness < this.baselineHappiness) {
                // Draw more obvious dark purple aura for unhappy butterflies
                const sadnessRatio = (this.baselineHappiness - this.happiness) / this.baselineHappiness;
                const auraSize = 25 + sadnessRatio * 15;
                const auraAlpha = min(60 * sadnessRatio, alpha * 0.8);
                
                graphics.push();
                graphics.noStroke();
                // Dark purple-blue for sadness
                graphics.fill(80, 50, 120, auraAlpha);
                graphics.ellipse(0, 0, auraSize, auraSize * 0.7);
                graphics.pop();
            }
            return;
        }
        
        // Calculate happiness ratio above baseline
        const happinessRatio = (this.happiness - this.baselineHappiness) / (this.maxHappiness - this.baselineHappiness);
        
        // Aura grows larger and brighter with happiness
        const maxAuraSize = 45;
        const auraSize = 20 + happinessRatio * maxAuraSize;
        const auraAlpha = min(50 + happinessRatio * 100, alpha * 0.9);
        
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
    
    // Draw exclamation mark popup
    drawExclamation(graphics) {
        const fadeRatio = this.exclamationTimer / this.exclamationDuration;
        const alpha = fadeRatio * 255;
        
        graphics.push();
        graphics.translate(0, this.exclamationY - 20); // Position above butterfly
        
        // White background circle
        graphics.noStroke();
        graphics.fill(255, 255, 255, alpha * 0.9);
        graphics.ellipse(0, 0, 16, 16);
        
        // Red exclamation mark
        graphics.fill(255, 50, 50, alpha);
        // Main body
        graphics.rect(-2, -5, 4, 7);
        // Dot
        graphics.rect(-2, 4, 4, 3);
        
        graphics.pop();
    }
    
    // Draw trust building indicator - soft green hearts
    drawTrustIndicator(graphics) {
        graphics.push();
        
        const pulse = sin(frameCount * 0.1) * 0.2 + 0.8;
        const alpha = this.trustGlowAlpha * pulse;
        
        // Draw small hearts floating up
        for (let i = 0; i < 3; i++) {
            const angle = (TWO_PI / 3) * i + frameCount * 0.02;
            const distance = 15 + sin(frameCount * 0.05 + i) * 5;
            const x = cos(angle) * distance;
            const y = sin(angle) * distance - 10;
            
            graphics.push();
            graphics.translate(x, y);
            graphics.scale(0.5);
            
            // Draw simple heart shape
            graphics.noStroke();
            graphics.fill(100, 255, 100, alpha);
            graphics.beginShape();
            graphics.vertex(0, -2);
            graphics.bezierVertex(-3, -5, -6, -3, -6, 0);
            graphics.bezierVertex(-6, 2, -3, 4, 0, 6);
            graphics.bezierVertex(3, 4, 6, 2, 6, 0);
            graphics.bezierVertex(6, -3, 3, -5, 0, -2);
            graphics.endShape(CLOSE);
            
            graphics.pop();
        }
        
        // Trust progress circle
        const progress = this.currentPatienceTimer / this.patienceRequired;
        if (progress > 0 && progress < 1) {
            graphics.noFill();
            graphics.strokeWeight(2);
            graphics.stroke(100, 255, 100, alpha * 0.5);
            const arcEnd = map(progress, 0, 1, 0, TWO_PI);
            graphics.arc(0, 0, 30, 30, -HALF_PI, -HALF_PI + arcEnd);
        }
        
        graphics.pop();
    }
    
    // Start wing display animation
    startDisplay() {
        if (this.state === 'normal') {
            this.state = 'display';
            this.displayTimer = 0;
            this.hasBeenHovered = true;
            
            // Clear any flower seeking goal and meandering when displaying
            this.seekingFlower = false;
            this.goalGridPos = null;
            this.meanderTarget = null;
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
        
        // Use the target that was already calculated when feeding started
        const targetHappiness = this.feedingStartHappiness < this.baselineHappiness ? 60 : 75;
        
        // Debug feeding progress every 30 frames (0.5 seconds)
        if (this.feedingTimer % 30 === 0) {
            console.log(`🍯 FEEDING UPDATE: Timer ${this.feedingTimer}/${this.maxFeedingTime}, happiness ${Math.round(this.happiness)}%/${targetHappiness}% (started at ${Math.round(this.feedingStartHappiness)}%)`);
        }
        
        // Check if target flower still exists and is nearby
        if (!this.targetFlower || !flowers.includes(this.targetFlower)) {
            console.log(`🍯 FEEDING END: Target flower no longer exists`);
            this.endFeeding();
            return;
        }
        
        // Check if we're still close enough to the flower
        const distToFlower = Math.hypot(this.x - this.targetFlower.x, this.y - this.targetFlower.y);
        if (distToFlower > 25) { // Lost contact with flower
            console.log(`🍯 FEEDING END: Too far from flower (distance: ${distToFlower.toFixed(1)})`);
            this.endFeeding();
            return;
        }
        
        // Increase happiness based on flower stage
        const oldHappiness = this.happiness;
        const feedingRate = this.getFeedingRate(this.targetFlower);
        this.happiness = Math.min(this.maxHappiness, this.happiness + feedingRate);
        
        // Debug happiness changes
        if (Math.round(oldHappiness) !== Math.round(this.happiness)) {
            console.log(`🍯 HAPPINESS GAIN: ${Math.round(oldHappiness)}% → ${Math.round(this.happiness)}% (+${feedingRate.toFixed(3)}/frame from ${this.targetFlower.stage} flower)`);
        }
        
        // End feeding if max time reached or target happiness reached
        if (this.feedingTimer >= this.maxFeedingTime || this.happiness >= targetHappiness) {
            const reason = this.feedingTimer >= this.maxFeedingTime ? 'time limit' : 'target happiness';
            console.log(`🍯 FEEDING END: ${reason} (timer: ${this.feedingTimer}/${this.maxFeedingTime}, happiness: ${Math.round(this.happiness)}%/${targetHappiness}%)`);
            this.endFeeding();
        }
    }
    
    // Determine feeding target based on context (self-feeding vs user-led feeding)
    // NOTE: This is called once when feeding starts, not during the feeding loop
    getFeedingTarget() {
        // Use the starting happiness that was already set in startFeeding()
        // Self-feeding (started at < baseline): aim for comfortable 60%
        // User-led feeding (started at >= baseline): aim for satisfied 75%
        // This ensures feeding sessions have clear, achievable endpoints
        const target = this.feedingStartHappiness < this.baselineHappiness ? 60 : 75;
        console.log(`🍯 FEEDING TARGET: Starting happiness ${Math.round(this.feedingStartHappiness)}%, target is ${target}%`);
        return target;
    }
    
    // Get feeding rate based on flower stage (balanced for 3-second feeding sessions)
    getFeedingRate(flower) {
        switch (flower.stage) {
            case 'bloom': return 0.125; // 22.5% over 3 seconds
            case 'mature': return 0.167; // 30% over 3 seconds (full happiness boost)
            case 'wilting': return 0.083; // 15% over 3 seconds  
            case 'dissolve': return 0.042; // 7.5% over 3 seconds
            default: return 0.125;
        }
    }
    
    // End feeding state and set cooldown
    endFeeding() {
        console.log(`🍯 END FEEDING CALLED: state='${this.state}', timer=${this.feedingTimer}, happiness=${Math.round(this.happiness)}%`);
        
        if (this.targetFlower) {
            // Clear the flower's current feeder
            if (this.targetFlower.currentFeeder === this) {
                this.targetFlower.currentFeeder = null;
            }
            
            // Set feeding cooldown for this specific flower
            const flowerId = this.targetFlower.id || this.getFlowerId(this.targetFlower);
            this.feedingCooldowns.set(flowerId, this.feedingCooldownDuration);
            console.log(`🍯 COOLDOWN SET: Flower ${flowerId} on cooldown for ${this.feedingCooldownDuration} frames`);
        }
        
        // Reset feeding session data
        this.feedingStartHappiness = null;
        this.state = 'normal';
        this.feedingTimer = 0;
        this.targetFlower = null;
        this.wanderTimer = random(30, 60); // Resume wandering
        this.postFeedingCooldown = this.postFeedingCooldownDuration; // Set cooldown
        
        console.log(`🍯 FEEDING ENDED: Butterfly returning to normal state (post-feeding cooldown: ${this.postFeedingCooldownDuration} frames)`);
    }
    
    // Generate unique ID for flower (fallback if flower doesn't have id)
    getFlowerId(flower) {
        return `${Math.floor(flower.x)}_${Math.floor(flower.y)}`;
    }
    
    // Validate current goal and seek new flower if needed (COMMITTED SEEKING)
    validateAndSeekFlowers(flowers) {
        // Only log when meaningful changes happen, not every 10 seconds
        if (this.goalGridPos !== this.lastLoggedGoal) {
            console.log(`🦋 VALIDATE SEEK: happiness=${Math.round(this.happiness)}%, postFeedingCooldown=${this.postFeedingCooldown}`);
            this.lastLoggedGoal = this.goalGridPos;
        }
        
        // First, check if we have a current goal and if it's still valid
        if (this.goalGridPos && this.seekingFlower) {
            const currentGoalFlower = this.findFlowerAtGoal(flowers);
            if (currentGoalFlower && this.isFlowerAvailable(currentGoalFlower)) {
                // Current goal is still valid - keep it!
                return; // Don't change goal - butterfly stays committed!
            } else {
                // Current goal is no longer valid
                console.log(`🦋 GOAL INVALID: Clearing current flower goal`);
                this.goalGridPos = null;
                this.seekingFlower = false;
            }
        }
        
        // No valid current goal - seek a new one
        this.seekNewFlower(flowers);
    }
    
    // Find the flower that matches our current goal position
    findFlowerAtGoal(flowers) {
        if (!this.goalGridPos) return null;
        
        for (let flower of flowers) {
            const flowerGrid = gridManager.screenToIso(flower.x, flower.y);
            const dist = Math.hypot(flowerGrid.x - this.goalGridPos.x, flowerGrid.y - this.goalGridPos.y);
            if (dist < 1) { // Close enough to be the same flower
                return flower;
            }
        }
        return null;
    }
    
    // Check if a flower is available for feeding (not on cooldown)
    isFlowerAvailable(flower) {
        const flowerId = flower.id || this.getFlowerId(flower);
        const onCooldown = this.feedingCooldowns.has(flowerId);
        const beingFedFrom = flower.currentFeeder && flower.currentFeeder !== this;
        return !onCooldown && !beingFedFrom;
    }
    
    // Seek a completely new flower target (SELF-FEEDING <30%)
    seekNewFlower(flowers) {
        // Look for available flowers (not on cooldown and not being fed from by another butterfly)
        // Note: this function is only called when happiness < 30%, so butterflies are below baseline
        const availableFlowers = flowers.filter(flower => {
            return this.isFlowerAvailable(flower);
        });
        
        if (availableFlowers.length > 0) {
            // Pick a random available flower (not always closest)
            const targetFlower = random(availableFlowers);
            const distToTarget = Math.hypot(this.x - targetFlower.x, this.y - targetFlower.y);
            
            console.log(`🦋 NEW FLOWER TARGET: ${availableFlowers.length} available, picked flower at distance ${Math.round(distToTarget)}`);
            
            // Set target to the flower (this is what debug lines will show)
            const flowerGrid = gridManager.screenToIso(targetFlower.x, targetFlower.y);
            this.goalGridPos = this.goalGridPos || {x: 0, y: 0};
            this.goalGridPos.x = flowerGrid.x;
            this.goalGridPos.y = flowerGrid.y;
            
            // Mark that we're actively seeking (for debug info)
            this.seekingFlower = true;
            
            
            // Check if we're close enough to start feeding immediately
            if (distToTarget < 20) {
                // Double-check we still need to feed
                if (this.happiness < this.baselineHappiness) {
                    console.log(`🦋 IMMEDIATE FEEDING: Already at flower, happiness ${Math.round(this.happiness)}%`);
                    this.startFeeding(targetFlower);
                } else {
                    console.log(`🦋 SKIP IMMEDIATE FEEDING: happiness ${Math.round(this.happiness)}% >= baseline`);
                    this.seekingFlower = false;
                    this.goalGridPos = null;
                }
            }
        } else {
            // No available flowers, clear seeking
            console.log(`🦋 NO FLOWERS AVAILABLE: ${flowers.length} total flowers, 0 available`);
            this.seekingFlower = false;
            this.goalGridPos = null;
        }
    }
    
    // Start feeding from a flower
    startFeeding(flower) {
        console.log(`🍯 START FEEDING CALLED: Current state='${this.state}', happiness=${Math.round(this.happiness)}%`);
        
        this.state = 'feeding';
        this.targetFlower = flower;
        this.feedingTimer = 0;
        this.feedingStartHappiness = this.happiness; // Store starting happiness
        
        // Mark flower as being fed from
        flower.currentFeeder = this;
        
        // Clear seeking state and meandering when starting to feed
        this.seekingFlower = false;
        this.goalGridPos = null;
        this.meanderTarget = null;
        
        const targetHappiness = this.getFeedingTarget();
        console.log(`🍯 FEEDING START: Butterfly happiness ${Math.round(this.happiness)}% → feeding from ${flower.stage} flower (target: ${targetHappiness}%) for max ${this.maxFeedingTime} frames`);
        
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
        // Emit particles based on happiness level
        if (frameCount % 90 === 0) { // Check every 1.5 seconds
            if (this.happiness > this.baselineHappiness) {
                // Happy butterflies always emit, amount based on happiness
                const happinessRatio = (this.happiness - this.baselineHappiness) / (this.maxHappiness - this.baselineHappiness);
                
                // More happiness = more particles
                const particleCount = Math.ceil(happinessRatio * 3); // 1-3 particles
                
                // Emit with some randomness in position
                for (let i = 0; i < particleCount; i++) {
                    const offsetX = random(-5, 5);
                    const offsetY = random(-3, 3);
                    const color = random(this.colors);
                    particleSystem.emit(this.x + offsetX, this.y + offsetY, color, 1, 'happy');
                }
                
                // Silent emission - no console spam
            } else if (this.happiness === this.baselineHappiness) {
                // At baseline, very rarely emit a single pixel (maintenance)
                if (random() < 0.1) { // 10% chance
                    const color = random(this.colors);
                    particleSystem.emit(this.x, this.y, color, 1, 'scale');
                }
            }
            // Sad butterflies (< baseline) emit no happy pixels
        }
    }
    
    // Handle cursor-based interaction system for leading butterflies
    handleCursorInteraction(cursorVelocity, cursorX, cursorY, particleSystem, gameState) {
        // Skip cursor interactions if in certain states
        if (this.state === 'scared' || this.state === 'display' || this.state === 'feeding') {
            this.resetCursorInteraction();
            return;
        }
        
        const distToCursor = Math.hypot(this.x - cursorX, this.y - cursorY);
        
        // Check if cursor is within interest radius
        if (distToCursor <= this.interestRadius) {
            // Check if another butterfly is already being interacted with
            if (!this.canInteractWithCursor(gameState.butterflies || [])) {
                this.resetCursorInteraction();
                return;
            }
            
            // Cursor is nearby - evaluate interaction
            this.evaluateCursorPresence(cursorVelocity, cursorX, cursorY, distToCursor, particleSystem);
        } else {
            // Cursor is too far away - reset interaction state
            this.resetCursorInteraction();
        }
    }
    
    // Check if this butterfly can interact with cursor (no others are)
    canInteractWithCursor(butterflies) {
        // Check if any OTHER butterfly is building trust or following
        for (let butterfly of butterflies) {
            if (butterfly !== this && 
                (butterfly.state === 'following' || 
                 (butterfly.currentPatienceTimer > 0 && butterfly.currentPatienceTimer > this.currentPatienceTimer))) {
                return false;
            }
        }
        return true;
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
        
        // Update trust glow visual feedback
        this.trustGlowAlpha = Math.min(255, (this.currentPatienceTimer / this.patienceRequired) * 255);
        
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
        
        // Set initial follow offset (where butterfly will hover relative to cursor)
        const angle = random(TWO_PI);
        const dist = this.followDistance / gameConfig.grid.cellSize;
        this.followOffset.x = cos(angle) * dist;
        this.followOffset.y = sin(angle) * dist;
        
        // Initialize smooth follow target to current grid position
        this.smoothFollowTarget.x = this.gridPos.x;
        this.smoothFollowTarget.y = this.gridPos.y;
        
        // Clear any flower seeking goal and meandering when following cursor
        this.seekingFlower = false;
        this.goalGridPos = null;
        this.meanderTarget = null;
        
        // Clear trust glow as we're now following
        this.trustGlowAlpha = 0;
        
        // Emit following event
        eventBus.emit('butterfly:startFollowing', {
            butterfly: this,
            cursorPosition: { x: cursorX, y: cursorY }
        });
    }
    
    // Update following behavior
    updateFollowing(cursorX, cursorY, particleSystem, flowers) {
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
        
        // Check for user-led feeding opportunities (≤85% happiness)
        if (this.happiness < this.minFeedingHappiness) {
            for (let flower of flowers) {
                const distToFlower = Math.hypot(this.x - flower.x, this.y - flower.y);
                if (distToFlower < 10) { // Must be directly on flower
                    if (this.isFlowerAvailable(flower)) {
                        console.log(`🦋 USER-LED FEEDING: Starting at happiness ${Math.round(this.happiness)}%`);
                        this.startFeeding(flower);
                        return; // Start feeding, exit following
                    }
                }
            }
        }
        
        // Follow the cursor smoothly using consistent offset
        const cursorGrid = gridManager.screenToIso(cursorX, cursorY);
        
        // Slightly rotate the offset over time for organic movement
        const rotationSpeed = 0.005; // Slower rotation for smoother movement
        const newAngle = atan2(this.followOffset.y, this.followOffset.x) + rotationSpeed;
        const dist = this.followDistance / gameConfig.grid.cellSize;
        this.followOffset.x = cos(newAngle) * dist;
        this.followOffset.y = sin(newAngle) * dist;
        
        // Calculate desired position with offset
        const desiredX = cursorGrid.x + this.followOffset.x;
        const desiredY = cursorGrid.y + this.followOffset.y;
        
        // Smooth interpolation to desired position
        this.smoothFollowTarget.x = lerp(this.smoothFollowTarget.x, desiredX, this.followSmoothness);
        this.smoothFollowTarget.y = lerp(this.smoothFollowTarget.y, desiredY, this.followSmoothness);
        
        // Set target to smoothed position
        this.targetGridPos.x = this.smoothFollowTarget.x;
        this.targetGridPos.y = this.smoothFollowTarget.y;
        
        // Constrain to grid bounds (stay within playable area)
        this.targetGridPos.x = constrain(this.targetGridPos.x, 2, gridManager.bounds.maxX - 2);
        this.targetGridPos.y = constrain(this.targetGridPos.y, 2, gridManager.bounds.maxY - 2);
        
        // Move toward target at normal speed (smoothness comes from interpolation)
        this.move();
        
        // Emit visual feedback while following
        if (this.followingTimer % 45 === 0) { // Every 0.75 seconds
            // Small sparkle effect
            particleSystem.emit(this.x, this.y, [255, 255, 200], 1, 'joy');
        }
        
        // Store cursor position for drawing connection line
        this.followingCursorPos = { x: cursorX, y: cursorY };
    }
    
    // End following state
    endFollowing(reason) {
        this.state = 'normal';
        this.followingCursor = false;
        this.followingTimer = 0;
        this.currentPatienceTimer = 0;
        
        // Don't reset trust completely - it persists across sessions
        this.trustLevel = Math.max(0, this.trustLevel - 5);
        
        
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
        // Don't immediately clear trust glow - let it fade in update
        
        if (this.state === 'following') {
            this.endFollowing('reset');
        }
    }
    
}