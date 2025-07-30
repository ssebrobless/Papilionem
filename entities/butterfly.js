// Butterfly personality profiles with distinctive colors and visual traits
const BUTTERFLY_PERSONALITIES = {
    // Common (40% spawn rate) - Warm and approachable
    friendly: {
        rarity: 'common',
        traits: {
            speed: 1.0,          // Normal speed
            jitteriness: 0.5,    // Low - calm movement
            trustPropensity: 1.5, // High - easy to befriend
            trustSpeed: 1.2,     // Fast trust building
            scareThreshold: 4.5, // High - forgiving of fast movement
            happinessBonus: 1.0  // Normal happiness gain
        },
        colors: [[255, 165, 0], [255, 215, 0]],      // Bright orange and gold - warm and welcoming
        size: 12,    // Standard size
        wingPattern: 'solid',
        description: "Friendly and trusting - warm orange butterflies"
    },
    
    // Uncommon (30% spawn rate) - Soft and delicate
    cautious: {
        rarity: 'uncommon',
        traits: {
            speed: 0.8,          // Slower
            jitteriness: 1.0,    // Normal
            trustPropensity: 0.7, // Low - harder to befriend
            trustSpeed: 0.8,     // Slow trust building
            scareThreshold: 3.0, // Low - easily scared
            happinessBonus: 1.2, // Slightly higher happiness when fed
            special: 'sparkle'   // Leaves sparkle trail when happy
        },
        colors: [[255, 182, 193], [255, 20, 147]],   // Light pink and deep pink - cautious but beautiful
        size: 10,    // Slightly smaller - more delicate
        wingPattern: 'spots',
        description: "Cautious but leaves sparkling trails - delicate pink butterflies"
    },
    
    // Uncommon (30% spawn rate) - Electric and vibrant
    energetic: {
        rarity: 'uncommon',
        traits: {
            speed: 1.5,          // Fast
            jitteriness: 1.8,    // High - zippy movement
            trustPropensity: 1.0, // Normal
            trustSpeed: 1.5,     // Fast but requires stillness
            scareThreshold: 3.5, // Medium
            happinessBonus: 0.8, // Lower happiness (burns energy)
            special: 'speedzone' // Creates speed boost zones
        },
        colors: [[138, 43, 226], [75, 0, 130]],      // Blue violet and indigo - electric energy
        size: 13,    // Slightly larger - more presence
        wingPattern: 'lightning',
        description: "Creates speed boost zones - electric purple butterflies"
    },
    
    // Rare (20% spawn rate) - Nervous and unpredictable
    skittish: {
        rarity: 'rare',
        traits: {
            speed: 1.3,          // Fast
            jitteriness: 2.0,    // Very high - erratic
            trustPropensity: 0.5, // Very low
            trustSpeed: 0.5,     // Very slow
            scareThreshold: 2.0, // Very low - super jumpy
            happinessBonus: 1.5, // High reward if you manage to feed
            special: 'cascade'   // Trust cascade effect
        },
        colors: [[0, 255, 127], [32, 178, 170]],     // Spring green and dark turquoise - quick and fleeting
        size: 11,    // Slightly smaller - nervous energy
        wingPattern: 'jagged',
        description: "Feeding creates trust cascade - nervous teal butterflies"
    },
    
    // Rare (20% spawn rate) - Regal and composed
    wise: {
        rarity: 'rare',
        traits: {
            speed: 1.0,          // Normal speed (more fun than slow)
            jitteriness: 0.3,    // Very low - graceful
            trustPropensity: 0.8, // Medium-low
            trustSpeed: 1.0,     // Normal but requires patience
            scareThreshold: 5.0, // Very high - nearly unflappable
            happinessBonus: 2.0, // Double happiness - wise feeding
            special: 'teacher'   // Teaches nearby butterflies
        },
        colors: [[72, 61, 139], [106, 90, 205]],     // Dark slate blue and slate blue - deep wisdom
        size: 14,    // Larger - commanding presence
        wingPattern: 'ornate',
        description: "Wise teacher - regal dark blue butterflies"
    },
    
    // Epic (8% spawn rate) - Otherworldly and magical
    mystic: {
        rarity: 'epic',
        traits: {
            speed: 1.0,
            jitteriness: 0.8,
            trustPropensity: 0.6,
            trustSpeed: 0.7,
            scareThreshold: 3.5,
            happinessBonus: 2.5,  // Very high happiness
            special: 'shimmer'    // Visual effect
        },
        colors: [[218, 112, 214], [0, 255, 255]],    // Orchid and cyan - magical shimmer
        size: 13,    // Elegant size
        wingPattern: 'shimmer',
        description: "Mystical butterfly with shimmering wings - magical pink-cyan butterflies"
    },
    
    // Legendary (2% spawn rate) - Divine and magnificent
    golden: {
        rarity: 'legendary',
        traits: {
            speed: 0.8,
            jitteriness: 0.5,
            trustPropensity: 0.3,  // Very hard to befriend
            trustSpeed: 0.4,       // Extremely slow
            scareThreshold: 2.5,   // Moderately jumpy
            happinessBonus: 5.0,   // Massive happiness bonus
            special: 'golden'      // Special trust symbols
        },
        colors: [[255, 215, 0], [255, 255, 100]],  // Gold/bright yellow
        size: 16,    // Largest - truly magnificent
        wingPattern: 'golden',
        description: "The legendary golden butterfly - divine golden magnificence"
    }
};

// Original spawn percentages
const BUTTERFLY_SPAWN_WEIGHTS = {
    friendly: 40,
    cautious: 15,
    energetic: 15,
    skittish: 10,
    wise: 10,
    mystic: 8,
    golden: 2
};

// Get a random personality based on rarity weights with spawn limits
function getRandomPersonality() {
    // Get spawn counts from game state
    const spawnCounts = (typeof gameCore !== 'undefined' && gameCore.gameState) ? 
        gameCore.gameState.butterflySpawnCounts : {};
    
    // Filter out types that have spawned 3+ times
    const availableTypes = {};
    let totalWeight = 0;
    
    for (let [type, weight] of Object.entries(BUTTERFLY_SPAWN_WEIGHTS)) {
        const count = spawnCounts[type] || 0;
        if (count < 3) {
            availableTypes[type] = weight;
            totalWeight += weight;
        }
    }
    
    // If no types available (shouldn't happen), return friendly
    if (totalWeight === 0) {
        console.warn('All butterfly types at spawn limit!');
        return 'friendly';
    }
    
    // Roll within the adjusted total
    const roll = random(totalWeight);
    let cumulative = 0;
    
    for (let [type, weight] of Object.entries(availableTypes)) {
        cumulative += weight;
        if (roll < cumulative) {
            // Track the spawn
            if (typeof gameCore !== 'undefined' && gameCore.gameState) {
                gameCore.gameState.butterflySpawnCounts[type] = (spawnCounts[type] || 0) + 1;
            }
            return type;
        }
    }
    
    // Fallback
    return 'friendly';
}

class Butterfly extends Entity {
    constructor(x, y, colors, isImmortal = false, personalityType = null) {
        super(x, y);
        
        // Personality system (must be set first to get size)
        this.personalityType = personalityType || getRandomPersonality();
        this.personality = BUTTERFLY_PERSONALITIES[this.personalityType];
        this.traits = this.personality.traits;
        
        // Override base properties with personality-based values
        this.size = this.personality.size || 12; // Personality-based size
        this.lifetime = 10000; // Long lifetime
        this.fadeStartLifetime = 2000;
        this.shadowOffset = gameConfig.entities.heightOffset.butterfly;
        
        // Immortality flag for first butterfly to prevent ecosystem collapse
        this.isImmortal = isImmortal;
        
        // Butterfly specific properties
        this.colors = colors || this.personality.colors;
        this.wingPattern = this.personality.wingPattern || 'solid';
        
        // Log butterfly spawn for learning
        console.log(`🦋 SPAWNED: ${this.personalityType} butterfly (${this.personality.rarity}) - ${this.personality.description}`);
        
        // === UNIFIED MOVEMENT SYSTEM ===
        this.movement = {
            target: { x: this.gridPos.x, y: this.gridPos.y },
            targetType: null, // 'immediate', 'goal', 'meander', 'flee', 'follow'
            targetPriority: 0, // Higher priority overrides lower
            wobbleAmount: 0, // 0 = direct, 1 = full wobble
            smoothFollowTarget: { x: this.gridPos.x, y: this.gridPos.y },
            followOffset: { x: 0, y: 0 },
            followSmoothness: 0.1,
            
            setTarget(x, y, type, priority = 1, wobble = 0) {
                if (priority >= this.targetPriority) {
                    this.target.x = x;
                    this.target.y = y;
                    this.targetType = type;
                    this.targetPriority = priority;
                    this.wobbleAmount = wobble;
                }
            },
            
            clearTarget(type = null) {
                if (!type || this.targetType === type) {
                    this.targetType = null;
                    this.targetPriority = 0;
                }
            }
        };
        
        // === UNIFIED STATE SYSTEM ===
        this.state = 'normal';
        this.stateData = {}; // State-specific data
        
        // === UNIFIED TIMER SYSTEM ===
        this.timers = {
            // Active timers (count down)
            display: 0,
            scared: 0,
            feeding: 0,
            following: 0,
            postFeedingCooldown: 0,
            postFeedingLeadCooldown: 0,
            scareImmunity: 0,
            speedBoost: 0,
            teachingBoost: 0,
            trustBoost: 0,
            exclamation: 0,
            postFeedingDash: 0,
            
            // Intervals (count up and reset)
            wander: { current: 0, duration: random(60, 120) / this.traits.jitteriness },
            flowerSeek: { current: 0, duration: 600 },
            particle: { current: 0, duration: 90 },
            
            // Update all timers
            update() {
                const signals = [];
                
                // Count down active timers
                const activeTimers = ['display', 'scared', 'feeding', 'following', 
                    'postFeedingCooldown', 'postFeedingLeadCooldown', 'scareImmunity',
                    'speedBoost', 'teachingBoost', 'trustBoost', 'exclamation', 'postFeedingDash'];
                
                for (let key of activeTimers) {
                    if (this[key] > 0) this[key]--;
                }
                
                // Update intervals
                if (++this.wander.current >= this.wander.duration) {
                    this.wander.current = 0;
                    signals.push('wander');
                }
                if (++this.flowerSeek.current >= this.flowerSeek.duration) {
                    this.flowerSeek.current = 0;
                    signals.push('flowerSeek');
                }
                if (++this.particle.current >= this.particle.duration) {
                    this.particle.current = 0;
                    signals.push('particle');
                }
                
                return signals;
            }
        };
        
        // === UNIFIED BOOSTS SYSTEM ===
        this.boosts = {
            speed: 1.0,
            trust: 1.0,
            happiness: 1.0
        };
        
        // === HAPPINESS SYSTEM ===
        this.happiness = 30; // All butterflies start at baseline
        this.baselineHappiness = 30;
        this.maxHappiness = 100;
        this.happinessDecayRate = (70 / (90 * 60)); // Decay from 100% to 30% in 90 seconds
        
        // === FEEDING SYSTEM ===
        this.feeding = {
            targetFlower: null,
            startHappiness: null,
            cooldowns: new Map(), // Per-flower cooldowns
            minHappiness: 85, // Won't feed if happiness >= 85%
            maxDuration: 180, // 3 seconds at 60fps
            cooldownDuration: 900, // 15 seconds
            postFeedingCooldownDuration: 300, // 5 seconds
            postFeedingLeadCooldownDuration: 480 // 8 seconds
        };
        
        // === CURSOR INTERACTION ===
        this.cursor = {
            interestRadius: 80 * this.traits.trustPropensity,
            patienceRequired: 90 / this.traits.trustSpeed,
            currentPatience: 0,
            trustLevel: 0,
            trustGlowAlpha: 0,
            followDistance: 30,
            maxFollowTime: 600,
            followingPos: null
        };
        
        // === VISUAL PROPERTIES ===
        this.visual = {
            wingAngle: 0,
            wingSpeed: 0.05,
            wingDisplaySpeed: 0.15,
            wingScaredSpeed: 0.25,
            happyWingSpeed: 0.08,
            exclamationY: 0,
            hasBeenHovered: false
        };
        
        // === MOVEMENT SPEEDS ===
        this.speeds = {
            base: 0.008 * this.traits.speed,
            flee: 0.025 * this.traits.speed,
            dash: 0.02,
            happy: 0.012,
            meander: 0.006,
            seeking: 0.007
        };
        
        // === PERSONALITY CONSTANTS ===
        this.constants = {
            scareThreshold: this.traits.scareThreshold,
            scareRadius: 45,
            scareImmunityDuration: 120,
            scareDuration: 120,
            displayDuration: 180,
            dashDuration: 120,
            exclamationDuration: 45
        };
        
        // === SPECIAL ABILITIES ===
        this.abilities = {
            sparkleTrail: [], // For cautious butterflies
            speedZoneTimer: 0, // For energetic butterflies
            teachingAura: false, // For wise butterflies
            teachingPulseTimer: 0,
            trustCascadeCache: [] // Pre-allocated for skittish
        };
    }
    
    update(gameState) {
        // Call parent update
        super.update(gameState);
        
        // Extract what we need from gameState
        const { flowers, particleSystem, cursorVelocity, adjustedMouseX, adjustedMouseY } = gameState;
        
        // 1. Update timers first
        const timerSignals = this.timers.update();
        
        // 2. Update happiness system
        this.updateHappiness();
        
        // 3. Update feeding cooldowns
        this.updateFeedingCooldowns();
        
        // 4. Update visual properties
        if (this.timers.exclamation > 0) {
            this.visual.exclamationY -= 0.5;
        }
        if (this.cursor.trustGlowAlpha > 0 && this.cursor.currentPatience === 0) {
            this.cursor.trustGlowAlpha = Math.max(0, this.cursor.trustGlowAlpha - 5);
        }
        
        // 5. Check state transitions
        this.checkStateTransitions(gameState);
        
        // 6. Execute state behavior
        this.executeStateBehavior(gameState);
        
        // 7. Calculate speed once
        const currentSpeed = this.getSpeed();
        
        // 8. Update movement once
        this.updateMovement(currentSpeed);
        
        // 9. Update visuals
        this.updateWings();
        this.updateSpecialAbilities(gameState);
        
        // 10. Handle timer signals
        if (timerSignals.includes('wander')) this.pickNewWanderTarget();
        if (timerSignals.includes('particle')) this.checkParticleEmission(particleSystem);
        if (timerSignals.includes('flowerSeek') && this.state === 'normal') {
            this.checkFlowerSeeking(flowers);
        }
    }
    
    // === CENTRALIZED SPEED CALCULATION ===
    getSpeed() {
        // Base speed from personality
        let speed = this.speeds.base;
        
        // State-based modifiers (in priority order)
        if (this.state === 'feeding') return 0;
        if (this.state === 'scared') return this.speeds.flee;
        if (this.timers.postFeedingDash > 0) return this.speeds.dash;
        
        // Activity modifiers
        if (this.movement.targetType === 'goal') speed = this.speeds.seeking;
        if (this.movement.targetType === 'meander') speed = this.speeds.meander;
        
        // Happiness modifier (only if not in special state)
        if (this.happiness > this.baselineHappiness) {
            const ratio = (this.happiness - this.baselineHappiness) / 
                         (this.maxHappiness - this.baselineHappiness);
            speed = speed + (this.speeds.happy - speed) * ratio;
        }
        
        // Apply speed boost
        if (this.timers.speedBoost > 0) {
            speed *= this.boosts.speed;
        }
        
        return speed;
    }
    
    // === STATE MANAGEMENT ===
    checkStateTransitions(gameState) {
        const { cursorVelocity, adjustedMouseX, adjustedMouseY, particleSystem } = gameState;
        
        // Check for fast cursor movement (scare response)
        if (this.timers.scareImmunity === 0 && this.state !== 'display') {
            const dx = this.x - adjustedMouseX;
            const dy = this.y - adjustedMouseY;
            const distToCursorSq = dx*dx + dy*dy;
            
            if (cursorVelocity > this.constants.scareThreshold && 
                distToCursorSq < this.constants.scareRadius * this.constants.scareRadius) {
                if (this.state !== 'scared') {
                    this.changeState('scared', { cursorX: adjustedMouseX, cursorY: adjustedMouseY });
                }
            }
        }
        
        // Check for cursor interaction (leading system)
        if (this.state !== 'scared' && this.state !== 'display' && 
            this.state !== 'feeding' && this.timers.postFeedingLeadCooldown === 0) {
            this.handleCursorInteraction(cursorVelocity, adjustedMouseX, adjustedMouseY, particleSystem, gameState);
        }
    }
    
    changeState(newState, data = {}) {
        const oldState = this.state;
        if (oldState === newState) return;
        
        // Exit old state
        this.exitState(oldState);
        
        // Enter new state
        this.state = newState;
        this.stateData = data;
        this.enterState(newState, data);
        
        // Log state change
        console.log(`🦋 STATE CHANGE: ${oldState} → ${newState}`);
        
        // Emit state change event
        eventBus.emit('butterfly:stateChange', {
            butterfly: this,
            from: oldState,
            to: newState
        });
    }
    
    enterState(state, data) {
        switch (state) {
            case 'scared':
                this.timers.scared = this.constants.scareDuration;
                this.timers.exclamation = this.constants.exclamationDuration;
                this.visual.exclamationY = -5;
                this.movement.clearTarget();
                this.setFleeTarget(data.cursorX, data.cursorY);
                // Reduce happiness slightly
                const happinessLoss = 2 + random(1, 3);
                this.happiness = Math.max(5, this.happiness - happinessLoss);
                break;
                
            case 'display':
                this.timers.display = this.constants.displayDuration;
                this.visual.hasBeenHovered = true;
                this.movement.clearTarget();
                break;
                
            case 'feeding':
                this.timers.feeding = 0;
                this.timers.scareImmunity = this.constants.scareImmunityDuration;
                this.feeding.startHappiness = this.happiness;
                this.feeding.targetFlower = data.flower;
                if (data.flower) {
                    data.flower.currentFeeder = this;
                    // Position close to flower
                    const flowerGrid = gridManager.screenToIso(data.flower.x, data.flower.y);
                    this.movement.setTarget(
                        flowerGrid.x + random(-0.3, 0.3),
                        flowerGrid.y + random(-0.3, 0.3),
                        'immediate',
                        10
                    );
                }
                this.movement.clearTarget('goal');
                this.movement.clearTarget('meander');
                break;
                
            case 'following':
                this.timers.following = 0;
                this.cursor.followingPos = { x: data.cursorX, y: data.cursorY };
                const angle = random(TWO_PI);
                const dist = this.cursor.followDistance / gameConfig.grid.cellSize;
                this.movement.followOffset.x = cos(angle) * dist;
                this.movement.followOffset.y = sin(angle) * dist;
                this.movement.smoothFollowTarget.x = this.gridPos.x;
                this.movement.smoothFollowTarget.y = this.gridPos.y;
                this.movement.clearTarget();
                this.cursor.trustGlowAlpha = 0;
                
                // Mark this butterfly type as collected!
                if (typeof gameCore !== 'undefined' && gameCore.gameState) {
                    const wasCollected = gameCore.gameState.collectedButterflies.has(this.personalityType);
                    gameCore.gameState.collectedButterflies.add(this.personalityType);
                    
                    // Initialize collection stats if needed
                    if (!gameCore.gameState.butterflyCollectionStats[this.personalityType]) {
                        gameCore.gameState.butterflyCollectionStats[this.personalityType] = {
                            firstCollectedTime: frameCount,
                            timesCollected: 0,
                            timesFed: 0
                        };
                    }
                    
                    gameCore.gameState.butterflyCollectionStats[this.personalityType].timesCollected++;
                    
                    // Emit collection event if this is the first time
                    if (!wasCollected) {
                        console.log(`🏆 NEW BUTTERFLY COLLECTED: ${this.personalityType}!`);
                        eventBus.emit('butterfly:collected', {
                            butterfly: this,
                            type: this.personalityType,
                            totalCollected: gameCore.gameState.collectedButterflies.size
                        });
                    }
                }
                break;
        }
    }
    
    exitState(state) {
        switch (state) {
            case 'scared':
                this.timers.scared = 0;
                break;
            case 'display':
                this.timers.display = 0;
                break;
            case 'feeding':
                if (this.feeding.targetFlower) {
                    if (this.feeding.targetFlower.currentFeeder === this) {
                        this.feeding.targetFlower.currentFeeder = null;
                    }
                    const flowerId = this.feeding.targetFlower.id || this.getFlowerId(this.feeding.targetFlower);
                    this.feeding.cooldowns.set(flowerId, this.feeding.cooldownDuration);
                }
                this.feeding.targetFlower = null;
                this.feeding.startHappiness = null;
                this.timers.postFeedingCooldown = this.feeding.postFeedingCooldownDuration;
                this.timers.postFeedingLeadCooldown = this.feeding.postFeedingLeadCooldownDuration;
                this.setPostFeedingDestination();
                break;
            case 'following':
                this.cursor.currentPatience = 0;
                this.cursor.trustLevel = Math.max(0, this.cursor.trustLevel - 5);
                this.timers.wander.current = 0;
                break;
        }
    }
    
    executeStateBehavior(gameState) {
        switch (this.state) {
            case 'normal':
                this.executeNormalBehavior(gameState);
                break;
            case 'scared':
                this.executeScaredBehavior(gameState);
                break;
            case 'display':
                this.executeDisplayBehavior(gameState);
                break;
            case 'feeding':
                this.executeFeedingBehavior(gameState);
                break;
            case 'following':
                this.executeFollowingBehavior(gameState);
                break;
        }
    }
    
    // === UNIFIED MOVEMENT SYSTEM ===
    updateMovement(currentSpeed) {
        if (!this.movement.target || currentSpeed === 0) return;
        
        // Calculate direction to target
        const dx = this.movement.target.x - this.gridPos.x;
        const dy = this.movement.target.y - this.gridPos.y;
        const distToTarget = sqrt(dx * dx + dy * dy);
        
        if (distToTarget < 0.1) return; // Close enough
        
        // Normalize direction
        let moveX = dx / distToTarget;
        let moveY = dy / distToTarget;
        
        // Apply wobble if specified
        if (this.movement.wobbleAmount > 0) {
            const wobble = random(-this.movement.wobbleAmount, this.movement.wobbleAmount);
            const angle = atan2(moveY, moveX) + wobble;
            moveX = cos(angle);
            moveY = sin(angle);
        }
        
        // Update grid position
        this.gridPos.x += moveX * currentSpeed;
        this.gridPos.y += moveY * currentSpeed;
        
        // Constrain to bounds
        this.gridPos.x = constrain(this.gridPos.x, 2, gridManager.bounds.maxX - 2);
        this.gridPos.y = constrain(this.gridPos.y, 2, gridManager.bounds.maxY - 2);
        
        // Convert to screen space
        const newScreenPos = gridManager.isoToScreen(this.gridPos.x, this.gridPos.y);
        this.x = newScreenPos.x;
        this.y = newScreenPos.y - this.shadowOffset;
    }
    
    // === STATE BEHAVIOR IMPLEMENTATIONS ===
    executeNormalBehavior(gameState) {
        const { flowers } = gameState;
        
        // Check if we should seek flowers
        if (this.happiness < this.baselineHappiness && this.timers.postFeedingCooldown === 0) {
            if (this.movement.targetType === 'goal') {
                // Check if we've reached the flower
                const dx = this.gridPos.x - this.movement.target.x;
                const dy = this.gridPos.y - this.movement.target.y;
                if (dx*dx + dy*dy < 0.25) {
                    const targetFlower = this.findFlowerAtTarget(flowers);
                    if (targetFlower && this.isFlowerAvailable(targetFlower)) {
                        if (this.happiness < this.baselineHappiness) {
                            this.changeState('feeding', { flower: targetFlower });
                        } else {
                            this.movement.clearTarget('goal');
                        }
                    } else {
                        this.movement.clearTarget('goal');
                    }
                }
            }
        } else {
            // Happy or on cooldown - meander
            if (this.movement.targetType !== 'meander') {
                this.pickNewWanderTarget();
            }
        }
    }
    
    executeScaredBehavior(gameState) {
        const { particleSystem, adjustedMouseX, adjustedMouseY } = gameState;
        
        // Continue fleeing
        const dx = this.x - adjustedMouseX;
        const dy = this.y - adjustedMouseY;
        if (dx*dx + dy*dy < this.constants.scareRadius * 0.7 * this.constants.scareRadius * 0.7) {
            this.setFleeTarget(adjustedMouseX, adjustedMouseY);
        }
        
        // Emit stress particles occasionally
        if (this.timers.scared % 20 === 0 && random() < 0.6) {
            this.emitParticles('stress', 1, particleSystem);
        }
        
        // End scared state when timer expires
        if (this.timers.scared === 0) {
            this.changeState('normal');
            this.timers.wander.current = 0; // Reset wander to pick new target
        }
    }
    
    executeDisplayBehavior(gameState) {
        const { particleSystem } = gameState;
        
        // Emit particles at specific intervals
        const timer = this.constants.displayDuration - this.timers.display;
        if (timer === 1) {
            particleSystem.emitBurst(this.x, this.y, random(this.colors), 8);
        }
        if (timer === 30 || timer === 60 || timer === 90) {
            this.emitParticles('joy', 1, particleSystem);
        }
        if (timer === 45) {
            particleSystem.emitFountain(this.x, this.y, random(this.colors), 15, 2.5);
        }
        if (timer === this.constants.displayDuration - 10) {
            particleSystem.emitSpiral(this.x, this.y, random(this.colors), 12);
        }
        
        // End display when timer expires
        if (this.timers.display === 0) {
            this.changeState('normal');
        }
    }
    
    executeFeedingBehavior(gameState) {
        const { flowers, particleSystem } = gameState;
        
        this.timers.feeding++;
        
        // Check if flower still exists
        if (!this.feeding.targetFlower || !flowers.includes(this.feeding.targetFlower)) {
            this.changeState('normal');
            return;
        }
        
        // Check distance to flower
        const dx = this.x - this.feeding.targetFlower.x;
        const dy = this.y - this.feeding.targetFlower.y;
        if (dx*dx + dy*dy > 625) { // 25^2
            this.changeState('normal');
            return;
        }
        
        // Update happiness
        const feedingRate = this.getFeedingRate(this.feeding.targetFlower);
        this.happiness = Math.min(this.maxHappiness, this.happiness + feedingRate);
        
        // Emit golden particles from blessed flowers
        if (this.feeding.targetFlower.goldenBlessing > 0 && frameCount % 10 === 0) {
            particleSystem.emit(this.x, this.y, [255, 215, 0], 1, 'happy');
        }
        
        // Determine target happiness
        const targetHappiness = this.feeding.startHappiness < this.baselineHappiness ? 60 : 75;
        
        // End feeding if done
        if (this.timers.feeding >= this.feeding.maxDuration || this.happiness >= targetHappiness) {
            this.endFeeding(particleSystem);
            this.changeState('normal');
        }
    }
    
    executeFollowingBehavior(gameState) {
        const { flowers, particleSystem, adjustedMouseX, adjustedMouseY } = gameState;
        
        this.timers.following++;
        
        // Check distance to cursor
        const dx = this.x - adjustedMouseX;
        const dy = this.y - adjustedMouseY;
        const maxDist = this.cursor.interestRadius * 1.5;
        
        if (dx*dx + dy*dy > maxDist * maxDist || this.timers.following >= this.cursor.maxFollowTime) {
            this.changeState('normal');
            return;
        }
        
        // Check for feeding opportunities
        if (this.happiness < this.feeding.minHappiness) {
            for (let flower of flowers) {
                const fx = this.x - flower.x;
                const fy = this.y - flower.y;
                if (fx*fx + fy*fy < 100 && this.isFlowerAvailable(flower)) {
                    this.changeState('feeding', { flower: flower });
                    return;
                }
            }
        }
        
        // Update follow position
        const cursorGrid = gridManager.screenToIso(adjustedMouseX, adjustedMouseY);
        const rotationSpeed = 0.005;
        const newAngle = atan2(this.movement.followOffset.y, this.movement.followOffset.x) + rotationSpeed;
        const dist = this.cursor.followDistance / gameConfig.grid.cellSize;
        this.movement.followOffset.x = cos(newAngle) * dist;
        this.movement.followOffset.y = sin(newAngle) * dist;
        
        // Smooth interpolation
        const desiredX = cursorGrid.x + this.movement.followOffset.x;
        const desiredY = cursorGrid.y + this.movement.followOffset.y;
        this.movement.smoothFollowTarget.x = lerp(this.movement.smoothFollowTarget.x, desiredX, this.movement.followSmoothness);
        this.movement.smoothFollowTarget.y = lerp(this.movement.smoothFollowTarget.y, desiredY, this.movement.followSmoothness);
        
        // Set movement target
        this.movement.setTarget(
            this.movement.smoothFollowTarget.x,
            this.movement.smoothFollowTarget.y,
            'follow',
            5
        );
        
        // Visual feedback
        if (this.timers.following % 45 === 0) {
            particleSystem.emit(this.x, this.y, [255, 255, 200], 1, 'joy');
        }
        
        this.cursor.followingPos = { x: adjustedMouseX, y: adjustedMouseY };
    }
    
    // === UNIFIED PARTICLE EMISSION ===
    emitParticles(type, intensity = 1, particleSystem) {
        const configs = {
            joy: {
                count: [3, 6],
                colors: this.colors,
                pattern: 'burst',
                velocity: 'upward'
            },
            stress: {
                count: [3, 6],
                colors: this.colors.map(c => [Math.floor(c[0] * 0.4), Math.floor(c[1] * 0.4), Math.floor(c[2] * 0.4)]),
                pattern: 'directional',
                velocity: 'outward'
            },
            happy: {
                count: Math.ceil(intensity * 8),
                colors: this.colors,
                pattern: 'random',
                velocity: 'gentle'
            },
            happy_visual: {
                count: Math.ceil(intensity * 24), // 3x more for visual effect
                colors: this.colors,
                pattern: 'random',
                velocity: 'gentle',
                sizeMultiplier: 0.7,
                lifetimeMultiplier: 0.6
            },
            sparkle: {
                count: 1,
                colors: [[255, 200, 255]],
                pattern: 'trail',
                velocity: 'minimal'
            }
        };
        
        const config = configs[type];
        if (!config) return;
        
        const count = Array.isArray(config.count) ? 
            random(config.count[0], config.count[1]) : config.count;
            
        for (let i = 0; i < count; i++) {
            this.emitSingleParticle(config, particleSystem, type);
        }
        
        // Emit event for particle drops
        if (type === 'joy' || type === 'stress') {
            eventBus.emit(GameEvents.BUTTERFLY_DROPPED_PIXELS, {
                butterfly: this,
                count: count,
                type: type
            });
        }
    }
    
    emitSingleParticle(config, particleSystem, type) {
        let x = this.x;
        let y = this.y;
        let vx = 0;
        let vy = 0;
        
        // Apply pattern
        switch (config.pattern) {
            case 'burst':
                x += random(-5, 5);
                y += random(-5, 5);
                break;
            case 'directional':
                const angle = random(TWO_PI);
                const distance = random(8, 15);
                x += cos(angle) * distance;
                y += sin(angle) * distance;
                vx = cos(angle) * 1.5;
                vy = sin(angle) * 1.5 + 0.5;
                break;
            case 'random':
                x += random(-8, 8);
                y += random(-5, 5);
                break;
            case 'trail':
                x += random(-3, 3);
                y += random(-3, 3);
                break;
        }
        
        const color = random(config.colors);
        const pixel = particleSystem.emit(x, y, color, 1, type);
        
        if (pixel && config.pattern === 'directional') {
            pixel.vx = vx;
            pixel.vy = vy;
            pixel.lifetime = 150; // Shorter for stress
        }
        
        if (pixel && config.sizeMultiplier) {
            pixel.size *= config.sizeMultiplier;
        }
        
        if (pixel && config.lifetimeMultiplier) {
            pixel.lifetime *= config.lifetimeMultiplier;
        }
    }
    
    checkParticleEmission(particleSystem) {
        if (this.happiness > this.baselineHappiness) {
            const happinessRatio = (this.happiness - this.baselineHappiness) / 
                                  (this.maxHappiness - this.baselineHappiness);
            
            // Base particles for pool contribution
            const baseCount = Math.ceil(happinessRatio * 8);
            this.emitParticles('happy', baseCount / 8, particleSystem);
            
            // Additional visual particles
            const visualCount = (baseCount * 3) / 8;
            this.emitParticles('happy_visual', visualCount / 8, particleSystem);
            
            // Special effects for very happy
            if (this.happiness > 95 && random() < 0.3) {
                particleSystem.emitFountain(this.x, this.y, random(this.colors), 20, 3);
            } else if (this.happiness > 85 && random() < 0.2) {
                particleSystem.emitSpiral(this.x, this.y, random(this.colors), 12);
            }
        } else if (this.happiness === this.baselineHappiness && random() < 0.1) {
            particleSystem.emit(this.x, this.y, random(this.colors), 1, 'scale');
        }
    }
    
    // === MOVEMENT HELPERS ===
    setFleeTarget(cursorX, cursorY) {
        const cursorGrid = gridManager.screenToIso(cursorX, cursorY);
        
        // Calculate direction away from cursor
        const awayX = this.gridPos.x - cursorGrid.x;
        const awayY = this.gridPos.y - cursorGrid.y;
        
        // Normalize and extend
        const dist = Math.max(sqrt(awayX * awayX + awayY * awayY), 0.1);
        const fleeDistance = random(3, 6);
        
        const targetX = this.gridPos.x + (awayX / dist) * fleeDistance;
        const targetY = this.gridPos.y + (awayY / dist) * fleeDistance;
        
        this.movement.setTarget(
            constrain(targetX, 2, gridManager.bounds.maxX - 2),
            constrain(targetY, 2, gridManager.bounds.maxY - 2),
            'flee',
            10 // High priority
        );
    }
    
    pickNewWanderTarget() {
        const targetX = random(3, gridManager.bounds.maxX - 3);
        const targetY = random(3, gridManager.bounds.maxY - 3);
        
        this.movement.setTarget(targetX, targetY, 'meander', 1, 0.6); // High wobble
        this.timers.wander.duration = random(60, 120) / this.traits.jitteriness;
    }
    
    setPostFeedingDestination() {
        const angle = random(TWO_PI);
        const distance = random(6, 10);
        
        const targetX = this.gridPos.x + cos(angle) * distance;
        const targetY = this.gridPos.y + sin(angle) * distance;
        
        this.movement.setTarget(
            constrain(targetX, 2, gridManager.bounds.maxX - 2),
            constrain(targetY, 2, gridManager.bounds.maxY - 2),
            'immediate',
            8
        );
        
        this.timers.postFeedingDash = this.constants.dashDuration;
    }
    
    checkFlowerSeeking(flowers) {
        if (this.happiness >= this.baselineHappiness || this.timers.postFeedingCooldown > 0) {
            this.movement.clearTarget('goal');
            return;
        }
        
        // Validate current goal
        if (this.movement.targetType === 'goal') {
            const currentFlower = this.findFlowerAtTarget(flowers);
            if (!currentFlower || !this.isFlowerAvailable(currentFlower)) {
                this.movement.clearTarget('goal');
            } else {
                return; // Keep current goal
            }
        }
        
        // Find new flower
        const availableFlowers = flowers.filter(f => this.isFlowerAvailable(f));
        if (availableFlowers.length > 0) {
            const targetFlower = random(availableFlowers);
            const flowerGrid = gridManager.screenToIso(targetFlower.x, targetFlower.y);
            this.movement.setTarget(flowerGrid.x, flowerGrid.y, 'goal', 3);
        }
    }
    
    findFlowerAtTarget(flowers) {
        if (!this.movement.target) return null;
        
        for (let flower of flowers) {
            const flowerGrid = gridManager.screenToIso(flower.x, flower.y);
            const dx = flowerGrid.x - this.movement.target.x;
            const dy = flowerGrid.y - this.movement.target.y;
            if (dx*dx + dy*dy < 1) {
                return flower;
            }
        }
        return null;
    }
    
    isFlowerAvailable(flower) {
        const flowerId = flower.id || this.getFlowerId(flower);
        const onCooldown = this.feeding.cooldowns.has(flowerId);
        const beingFedFrom = flower.currentFeeder && flower.currentFeeder !== this;
        return !onCooldown && !beingFedFrom;
    }
    
    getFlowerId(flower) {
        return `${Math.floor(flower.x)}_${Math.floor(flower.y)}`;
    }
    
    // === HAPPINESS & FEEDING SYSTEM ===
    updateHappiness() {
        // Only decay happiness if above baseline
        if (this.happiness > this.baselineHappiness) {
            this.happiness = Math.max(this.baselineHappiness, this.happiness - this.happinessDecayRate);
        }
        // Clamp to valid range
        this.happiness = Math.max(0, Math.min(this.maxHappiness, this.happiness));
    }
    
    updateFeedingCooldowns() {
        for (let [flowerId, cooldownTime] of this.feeding.cooldowns.entries()) {
            if (cooldownTime > 0) {
                this.feeding.cooldowns.set(flowerId, cooldownTime - 1);
            } else {
                this.feeding.cooldowns.delete(flowerId);
            }
        }
    }
    
    getFeedingRate(flower) {
        let baseRate = 0.125;
        switch (flower.stage) {
            case 'bloom': baseRate = 0.125; break;
            case 'mature': baseRate = 0.167; break;
            case 'wilting': baseRate = 0.083; break;
            case 'dissolve': baseRate = 0.042; break;
        }
        
        // Apply personality bonus
        let rate = baseRate * this.traits.happinessBonus;
        
        // Apply golden blessing
        if (flower.goldenBlessing > 0) {
            rate *= 2.0;
        }
        
        // Apply teaching bonus
        if (this.timers.teachingBoost > 0) {
            rate *= 1.5;
        }
        
        return rate;
    }
    
    endFeeding(particleSystem) {
        // Update combo system
        if (typeof gameCore !== 'undefined' && gameCore.gameState) {
            const now = frameCount;
            const timeSinceLastFeed = now - gameCore.gameState.lastFeedingTime;
            
            if (timeSinceLastFeed < 300) {
                gameCore.gameState.feedingCombo++;
                gameCore.gameState.maxCombo = Math.max(gameCore.gameState.maxCombo, gameCore.gameState.feedingCombo);
                
                eventBus.emit('combo:achieved', {
                    x: this.x,
                    y: this.y,
                    combo: gameCore.gameState.feedingCombo
                });
                
                const comboParticles = gameCore.gameState.feedingCombo * 2;
                particleSystem.emitBurst(this.x, this.y, [255, 255, 100], comboParticles);
            } else {
                gameCore.gameState.feedingCombo = 1;
            }
            
            gameCore.gameState.lastFeedingTime = now;
        }
        
        // Trigger special abilities
        if (this.traits.special === 'cascade' && this.feeding.targetFlower) {
            const butterflies = gameCore ? gameCore.gameState.butterflies : [];
            this.createTrustCascade(butterflies);
        }
        
        // Update collection statistics if this butterfly type has been collected
        if (typeof gameCore !== 'undefined' && gameCore.gameState) {
            if (gameCore.gameState.collectedButterflies.has(this.personalityType) &&
                gameCore.gameState.butterflyCollectionStats[this.personalityType]) {
                gameCore.gameState.butterflyCollectionStats[this.personalityType].timesFed++;
            }
        }
        
        // Emit feeding event
        eventBus.emit(GameEvents.BUTTERFLY_VISITED_FLOWER, {
            butterfly: this,
            flower: this.feeding.targetFlower
        });
        
        // Check for golden butterfly endgame
        if (this.personalityType === 'golden') {
            console.log('🌟 GOLDEN BUTTERFLY FED! GAME COMPLETE!');
            if (typeof gameCore !== 'undefined' && gameCore.gameState) {
                gameCore.gameState.gameComplete = true;
                eventBus.emit('game:complete', {
                    butterfly: this,
                    flower: this.feeding.targetFlower
                });
            }
        }
    }
    
    // === CURSOR INTERACTION SYSTEM ===
    handleCursorInteraction(cursorVelocity, cursorX, cursorY, particleSystem, gameState) {
        const dx = this.x - cursorX;
        const dy = this.y - cursorY;
        const distToCursorSq = dx*dx + dy*dy;
        
        // Check if cursor is within interest radius
        if (distToCursorSq <= this.cursor.interestRadius * this.cursor.interestRadius) {
            // Check if another butterfly is already being interacted with
            if (!this.canInteractWithCursor(gameState.butterflies || [])) {
                this.resetCursorInteraction();
                return;
            }
            
            const distToCursor = Math.sqrt(distToCursorSq);
            this.evaluateCursorPresence(cursorVelocity, cursorX, cursorY, distToCursor, particleSystem);
        } else {
            this.resetCursorInteraction();
        }
    }
    
    canInteractWithCursor(butterflies) {
        for (let butterfly of butterflies) {
            if (butterfly !== this && 
                (butterfly.state === 'following' || 
                 (butterfly.cursor.currentPatience > 0 && 
                  butterfly.cursor.currentPatience > this.cursor.currentPatience))) {
                return false;
            }
        }
        return true;
    }
    
    evaluateCursorPresence(cursorVelocity, cursorX, cursorY, distance, particleSystem) {
        let cursorState = 'neutral';
        
        if (cursorVelocity > this.constants.scareThreshold) {
            cursorState = 'scaring';
        } else if (cursorVelocity < 0.5 && distance < this.cursor.interestRadius * 0.7) {
            cursorState = 'attracting';
        }
        
        switch (cursorState) {
            case 'scaring':
                this.resetCursorInteraction();
                break;
            case 'attracting':
                this.buildCursorTrust(cursorX, cursorY, particleSystem);
                break;
            case 'neutral':
                if (this.cursor.currentPatience > 0) {
                    this.cursor.currentPatience = Math.max(0, this.cursor.currentPatience - 0.5);
                }
                break;
        }
        
        eventBus.emit('cursor:state', {
            butterfly: this,
            cursorState: cursorState,
            distance: distance,
            patience: this.cursor.currentPatience,
            trustLevel: this.cursor.trustLevel
        });
    }
    
    buildCursorTrust(cursorX, cursorY, particleSystem) {
        this.cursor.currentPatience++;
        this.cursor.trustGlowAlpha = Math.min(255, (this.cursor.currentPatience / this.cursor.patienceRequired) * 255);
        
        if (this.cursor.currentPatience >= this.cursor.patienceRequired && this.state !== 'following') {
            this.changeState('following', { cursorX: cursorX, cursorY: cursorY });
            this.cursor.trustLevel = Math.min(100, this.cursor.trustLevel + 10);
            
            eventBus.emit(GameEvents.BUTTERFLY_DISPLAY, {
                butterfly: this,
                reason: 'cursorTrust'
            });
            
            particleSystem.emitBurst(this.x, this.y, random(this.colors), 3);
        }
    }
    
    resetCursorInteraction() {
        this.cursor.currentPatience = 0;
        if (this.state === 'following') {
            this.changeState('normal');
        }
    }
    
    // === VISUAL UPDATES ===
    updateWings() {
        // Calculate wing speed based on state and happiness
        let speed = this.visual.wingSpeed;
        
        if (this.state === 'display') {
            speed = this.visual.wingDisplaySpeed;
        } else if (this.state === 'scared') {
            speed = this.visual.wingScaredSpeed;
        } else if (this.state === 'feeding') {
            speed = this.visual.wingSpeed * 0.3; // Slow, gentle
        } else if (this.state === 'following') {
            speed = this.visual.wingSpeed * 1.3; // Excited
        } else if (this.happiness > this.baselineHappiness) {
            const happinessRatio = (this.happiness - this.baselineHappiness) / 
                                  (this.maxHappiness - this.baselineHappiness);
            speed = this.visual.wingSpeed + 
                   (this.visual.happyWingSpeed - this.visual.wingSpeed) * happinessRatio;
        }
        
        this.visual.wingAngle += speed;
    }
    
    
    
    
    
    
    
    
    // Override parent's draw to add following connection
    draw(graphics) {
        // Draw following connection line first (behind everything)
        if (this.state === 'following' && this.cursor.followingPos) {
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
        const dx = this.cursor.followingPos.x - this.x;
        const dy = this.cursor.followingPos.y - this.y;
        
        graphics.noFill();
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const x = this.x + dx * t;
            const y = this.y + dy * t;
            
            // Fade effect - more visible but not fully solid
            const alpha = map(i, 0, segments, 120, 60);
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
        
        // Special golden crown/halo for legendary butterfly
        if (this.personalityType === 'golden') {
            graphics.push();
            graphics.noStroke();
            const goldenPulse = sinFrame(frameCount, 0.05) * 0.2 + 0.8;
            
            // Crown/halo effect above butterfly
            graphics.fill(255, 215, 0, 150 * goldenPulse);
            graphics.ellipse(0, -10, 20 * goldenPulse, 8 * goldenPulse);
            
            // Three crown points
            for (let i = -1; i <= 1; i++) {
                graphics.push();
                graphics.translate(i * 6, -12);
                graphics.rotate(i * 0.2);
                graphics.fill(255, 215, 0, 200 * goldenPulse);
                graphics.beginShape();
                graphics.vertex(0, 0);
                graphics.vertex(-2, -4);
                graphics.vertex(0, -6);
                graphics.vertex(2, -4);
                graphics.endShape(CLOSE);
                graphics.pop();
            }
            
            graphics.pop();
        }
        
        const wingFlap = sinWing(this.visual.wingAngle);
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
        if (this.timers.exclamation > 0) {
            this.drawExclamation(graphics);
        }
        
        // Draw trust building indicator
        if (this.cursor.trustGlowAlpha > 0) {
            this.drawTrustIndicator(graphics);
        }
        
        graphics.pop();
    }
    
    // Draw happiness aura/glow behind butterfly
    drawHappinessAura(graphics, alpha) {
        // Add shimmer effect for mystic butterflies
        if (this.personalityType === 'mystic') {
            const shimmerTime = frameCount * 0.1;
            const shimmerAlpha = (sin(shimmerTime) * 0.3 + 0.7) * alpha;
            graphics.push();
            graphics.noStroke();
            // Iridescent shimmer layers
            for (let i = 3; i > 0; i--) {
                const size = 30 * (i / 3);
                const layerAlpha = shimmerAlpha * 0.3 / i;
                const hue = (shimmerTime * 50 + i * 60) % 360;
                // Convert HSB to RGB approximation
                const r = sin(hue * PI/180) * 127 + 128;
                const g = sin((hue + 120) * PI/180) * 127 + 128;
                const b = sin((hue + 240) * PI/180) * 127 + 128;
                graphics.fill(r, g, b, layerAlpha);
                graphics.ellipse(0, 0, size, size * 0.7);
            }
            graphics.pop();
        }
        
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
            const pulse = sinFrame(frameCount, 0.1) * 0.2 + 0.8;
            const pulseSize = auraSize * pulse;
            graphics.fill(255, 255, 255, auraAlpha * 0.3 * pulse);
            graphics.ellipse(0, 0, pulseSize, pulseSize * 0.7);
        }
        
        graphics.pop();
    }
    
    drawStardewWing(graphics, direction, spread) {
        graphics.push();
        graphics.scale(spread, 1);
        
        // Get wing pattern based on personality
        const wingPatterns = this.getWingPatterns();
        const wingPattern = wingPatterns[this.wingPattern] || wingPatterns.solid;
        
        // Wing base position (attached to body)
        const startX = direction * 2;
        const startY = -2;
        
        for (let y = 0; y < wingPattern.length; y++) {
            for (let x = 0; x < wingPattern[y].length; x++) {
                if (wingPattern[y][x]) {
                    // Get colors for this wing pattern type
                    this.drawWingPixel(graphics, x, y, direction, wingPattern[y][x]);
                    
                    // Wing base position (attached to body)
                    const pixelX = startX + (direction > 0 ? x : -x) * 2;
                    const pixelY = startY + y * 2;
                    graphics.rect(pixelX, pixelY, 2, 2);
                }
            }
        }
        
        graphics.pop();
    }
    
    // Get wing patterns for different personality types
    getWingPatterns() {
        return {
            solid: [
                [0,0,1,1,1],
                [0,1,1,1,1],
                [1,1,1,1,1],
                [1,1,1,1,0],
                [1,1,1,0,0],
                [0,1,0,0,0]
            ],
            spots: [
                [0,0,1,1,1],
                [0,1,2,1,1],
                [1,2,1,2,1],
                [1,1,2,1,0],
                [1,1,1,0,0],
                [0,1,0,0,0]
            ],
            lightning: [
                [0,0,1,1,1],
                [0,1,3,1,1],
                [1,3,1,3,1],
                [1,1,3,1,0],
                [1,3,1,0,0],
                [0,1,0,0,0]
            ],
            jagged: [
                [0,0,1,0,1],
                [0,1,0,1,1],
                [1,0,1,0,1],
                [1,1,0,1,0],
                [1,0,1,0,0],
                [0,1,0,0,0]
            ],
            ornate: [
                [0,0,1,1,1],
                [0,1,2,3,1],
                [1,2,3,2,1],
                [1,3,2,1,0],
                [1,2,1,0,0],
                [0,1,0,0,0]
            ],
            shimmer: [
                [0,0,1,2,1],
                [0,2,1,2,1],
                [1,2,1,2,1],
                [1,1,2,1,0],
                [1,2,1,0,0],
                [0,1,0,0,0]
            ],
            golden: [
                [0,0,1,3,1],
                [0,1,3,1,3],
                [1,3,1,3,1],
                [1,1,3,1,0],
                [1,3,1,0,0],
                [0,1,0,0,0]
            ]
        };
    }
    
    // Draw individual wing pixel with pattern-specific coloring
    drawWingPixel(graphics, x, y, direction, patternValue) {
        switch (patternValue) {
            case 1: // Base wing color
                graphics.fill(this.colors[0][0], this.colors[0][1], this.colors[0][2]);
                break;
            case 2: // Secondary accent color
                graphics.fill(this.colors[1][0], this.colors[1][1], this.colors[1][2]);
                break;
            case 3: // Special highlight/pattern color
                if (this.wingPattern === 'golden') {
                    // Golden sparkle effect
                    const sparkle = sin(frameCount * 0.1 + x + y) * 0.3 + 0.7;
                    graphics.fill(255, 255, 100 + sparkle * 155);
                } else if (this.wingPattern === 'shimmer') {
                    // Iridescent shimmer
                    const shimmer = sin(frameCount * 0.05 + x * 0.5 + y * 0.3) * 0.5 + 0.5;
                    graphics.fill(
                        this.colors[0][0] * (0.5 + shimmer * 0.5),
                        this.colors[1][1] * (0.5 + shimmer * 0.5),
                        255 * shimmer
                    );
                } else if (this.wingPattern === 'lightning') {
                    // Electric highlight
                    graphics.fill(255, 255, 255);
                } else {
                    // Default accent
                    const lighter = this.colors[1].map(c => Math.min(255, c * 1.2));
                    graphics.fill(lighter[0], lighter[1], lighter[2]);
                }
                break;
            default:
                graphics.fill(this.colors[0][0], this.colors[0][1], this.colors[0][2]);
        }
        
        // Apply edge darkening for depth
        if (x === 0 || x === 4 || y === 5) {
            const dark = 0.8;
            const currentFill = graphics.drawingContext.fillStyle;
            // Extract RGB values and darken them
            graphics.fill(
                this.colors[0][0] * dark,
                this.colors[0][1] * dark,
                this.colors[0][2] * dark
            );
        }
    }
    
    // Continue from the rest of the original method that was truncated...
    
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
        const fadeRatio = this.timers.exclamation / this.constants.exclamationDuration;
        const alpha = fadeRatio * 255;
        
        graphics.push();
        graphics.translate(0, this.visual.exclamationY - 20); // Position above butterfly
        
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
    
    // Draw trust building indicator - soft green hearts (or golden stars for legendary)
    drawTrustIndicator(graphics) {
        graphics.push();
        
        const pulse = sinFrame(frameCount, 0.1) * 0.2 + 0.8;
        const alpha = this.cursor.trustGlowAlpha * pulse;
        
        // Use special symbols for golden butterfly
        const isGolden = this.personalityType === 'golden';
        
        // Draw small symbols floating up
        for (let i = 0; i < 3; i++) {
            const angle = (TWO_PI / 3) * i + frameCount * 0.02;
            const distance = 15 + sin(frameCount * 0.05 + i) * 5;
            const x = cos(angle) * distance;
            const y = sin(angle) * distance - 10;
            
            graphics.push();
            graphics.translate(x, y);
            graphics.scale(0.5);
            
            graphics.noStroke();
            
            if (isGolden) {
                // Draw golden star for legendary butterfly
                graphics.fill(255, 215, 0, alpha);
                graphics.push();
                graphics.rotate(frameCount * 0.05);
                // Draw star shape
                for (let j = 0; j < 5; j++) {
                    const starAngle = (TWO_PI / 5) * j - HALF_PI;
                    const innerAngle = starAngle + TWO_PI / 10;
                    const outerRadius = 8;
                    const innerRadius = 4;
                    
                    if (j === 0) graphics.beginShape();
                    graphics.vertex(cos(starAngle) * outerRadius, sin(starAngle) * outerRadius);
                    graphics.vertex(cos(innerAngle) * innerRadius, sin(innerAngle) * innerRadius);
                }
                graphics.endShape(CLOSE);
                graphics.pop();
            } else {
                // Draw simple heart shape for normal butterflies
                graphics.fill(100, 255, 100, alpha);
                graphics.beginShape();
                graphics.vertex(0, -2);
                graphics.bezierVertex(-3, -5, -6, -3, -6, 0);
                graphics.bezierVertex(-6, 2, -3, 4, 0, 6);
                graphics.bezierVertex(3, 4, 6, 2, 6, 0);
                graphics.bezierVertex(6, -3, 3, -5, 0, -2);
                graphics.endShape(CLOSE);
            }
            
            graphics.pop();
        }
        
        // Trust progress circle
        const progress = this.cursor.currentPatience / this.cursor.patienceRequired;
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
            this.changeState('display');
        }
    }
    
    
    
    // Reset hover state when cursor moves away
    resetHoverState() {
        this.visual.hasBeenHovered = false;
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
        this.feeding.cooldowns.clear(); // Clear all feeding cooldowns
        this.visual.hasBeenHovered = false;
        
        // Keep butterfly at current position - no teleportation!
        // Only update the target position to current position to stop any movement
        this.targetGridPos = {...this.gridPos};
        
        // Reset movement to prevent weird glitches
        this.movement.clearTarget();
        this.movement.smoothFollowTarget = { x: this.gridPos.x, y: this.gridPos.y };
        this.movement.followOffset = { x: 0, y: 0 };
        
        // Clear any ongoing goals
        this.goalGridPos = null;
        this.targetFlower = null;
        this.timers.wander.current = 0; // Reset wander timer
        
        // Emit rebirth event
        eventBus.emit(GameEvents.BUTTERFLY_SPAWNED, { 
            butterfly: this, 
            source: 'immortalRestart' 
        });
    }
    
    
    
    
    
    
    
    
    // Update special abilities based on personality
    updateSpecialAbilities(gameState) {
        if (!this.traits.special) return;
        
        const { butterflies, particleSystem } = gameState;
        
        switch (this.traits.special) {
            case 'sparkle':
                this.updateSparkleTrail(particleSystem);
                break;
                
            case 'speedzone':
                this.updateSpeedZone(butterflies);
                break;
                
            case 'teacher':
                this.updateTeachingAura(butterflies);
                break;
                
            case 'cascade':
                // Handled in feeding completion
                break;
                
            case 'shimmer':
                // Visual effect handled in draw
                break;
        }
    }
    
    // Cautious butterfly - leaves sparkle trail when happy
    updateSparkleTrail(particleSystem) {
        if (this.happiness <= this.baselineHappiness) return;
        
        // Add current position to trail
        this.abilities.sparkleTrail.push({
            x: this.x,
            y: this.y,
            life: 60 // 1 second
        });
        
        // Update and emit sparkles from trail
        for (let i = this.abilities.sparkleTrail.length - 1; i >= 0; i--) {
            const sparkle = this.abilities.sparkleTrail[i];
            sparkle.life--;
            
            // Emit sparkle particle every few frames
            if (sparkle.life % 10 === 0) {
                const pixel = particleSystem.emit(
                    sparkle.x + random(-3, 3),
                    sparkle.y + random(-3, 3),
                    [255, 200, 255], // Pink sparkle
                    1,
                    'joy'
                );
                if (pixel) {
                    pixel.lifetime = 100; // Short lived sparkles
                    pixel.size = gameConfig.particles.pixelSize; // Smaller
                }
            }
            
            if (sparkle.life <= 0) {
                this.abilities.sparkleTrail.splice(i, 1);
            }
        }
        
        // Limit trail length
        if (this.abilities.sparkleTrail.length > 30) {
            this.abilities.sparkleTrail.shift();
        }
    }
    
    // Energetic butterfly - creates speed zones
    updateSpeedZone(butterflies) {
        if (this.happiness <= this.baselineHappiness) return;
        
        this.abilities.speedZoneTimer++;
        
        // Create speed zone every 5 seconds
        if (this.abilities.speedZoneTimer >= 300) {
            this.abilities.speedZoneTimer = 0;
            
            // Boost nearby butterflies
            for (let butterfly of butterflies) {
                if (butterfly === this) continue;
                
                const dx = this.x - butterfly.x;
                const dy = this.y - butterfly.y;
                if (dx*dx + dy*dy < 10000) { // 100^2 = 10000
                    // Give temporary speed boost
                    butterfly.boosts.speed = 1.5;
                    butterfly.timers.speedBoost = 180; // 3 seconds
                    
                    // Visual feedback
                    eventBus.emit('speedzone:created', {
                        x: this.x,
                        y: this.y,
                        radius: 100
                    });
                }
            }
        }
    }
    
    // Wise butterfly - teaches nearby butterflies
    updateTeachingAura(butterflies) {
        if (this.happiness <= 50) { // Need to be reasonably happy to teach
            this.abilities.teachingAura = false;
            return;
        }
        
        this.abilities.teachingAura = true;
        
        // Emit teaching pulse periodically
        this.abilities.teachingPulseTimer++;
        
        if (this.abilities.teachingPulseTimer >= 120) { // Every 2 seconds
            this.abilities.teachingPulseTimer = 0;
            eventBus.emit('teaching:pulse', {
                x: this.x,
                y: this.y
            });
        }
        
        // Boost happiness gain of nearby butterflies
        for (let butterfly of butterflies) {
            if (butterfly === this) continue;
            
            const dx = this.x - butterfly.x;
            const dy = this.y - butterfly.y;
            if (dx*dx + dy*dy < 6400) { // 80^2 = 6400
                // Mark butterfly as being taught
                butterfly.timers.teachingBoost = 10;
            }
        }
    }
    
    // Create trust cascade when skittish butterfly is fed
    createTrustCascade(butterflies) {
        console.log('🌊 TRUST CASCADE! Nearby butterflies become more trusting');
        
        // Use pre-allocated cache array to avoid allocation
        this.abilities.trustCascadeCache.length = 0; // Clear without allocation
        
        for (let butterfly of butterflies) {
            if (butterfly === this) continue;
            
            const dx = this.x - butterfly.x;
            const dy = this.y - butterfly.y;
            if (dx*dx + dy*dy < 22500) { // 150^2 = 22500
                // Temporarily boost trust
                butterfly.boosts.trust = 2.0;
                butterfly.timers.trustBoost = 300; // 5 seconds
                this.abilities.trustCascadeCache.push(butterfly);
            }
        }
        
        // Visual feedback - green wave with affected butterflies
        if (this.abilities.trustCascadeCache.length > 0) {
            eventBus.emit('trust:cascade', {
                x: this.x,
                y: this.y,
                radius: 150,
                butterflies: this.abilities.trustCascadeCache
            });
        }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
}