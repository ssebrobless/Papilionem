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
            happinessBonus: 1.2  // Slightly higher happiness when fed
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
            happinessBonus: 0.8  // Lower happiness (burns energy)
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
            happinessBonus: 1.5  // High reward if you manage to feed
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
            happinessBonus: 2.0  // Double happiness - wise feeding
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
            happinessBonus: 2.5   // Very high happiness
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
            speed: 2.5,            // Much faster than any other butterfly
            jitteriness: 3.0,      // Extremely erratic movement
            trustPropensity: 0.1,  // Extremely hard to befriend
            trustSpeed: 0.0667,    // 15 seconds at 60fps (900 frames / 60 = 15 seconds)
            scareThreshold: 999,   // Cannot be scared - requires persistence
            happinessBonus: 5.0    // Massive happiness bonus
        },
        colors: [[255, 215, 0], [255, 255, 100]],  // Gold/bright yellow
        size: 16,    // Largest - truly magnificent
        wingPattern: 'golden',
        description: "The legendary golden butterfly - divine golden magnificence"
    }
};

const BUTTERFLY_VARIANT_ABILITIES = {
    friendly: 'welcome',
    cautious: 'sparkle',
    energetic: 'speedzone',
    skittish: 'cascade',
    wise: 'teacher',
    mystic: 'shimmer',
    golden: 'golden'
};

const BUTTERFLY_ABILITY_SOURCE_VARIANTS = {
    welcome: 'friendly',
    sparkle: 'cautious',
    speedzone: 'energetic',
    cascade: 'skittish',
    teacher: 'wise',
    shimmer: 'mystic',
    golden: 'golden'
};

const BUTTERFLY_VARIANT_DISPLAY_NAMES = {
    friendly: 'WarmWelcome',
    cautious: 'DelicatePink',
    energetic: 'ElectricViolet',
    skittish: 'NervousJewel',
    wise: 'AncientScholar',
    mystic: 'TwilightDancer',
    golden: 'Golden'
};

const BUTTERFLY_ABILITY_VISUALS = {
    welcome: { style: 'ring', radius: 90, durationFrames: 28 },
    sparkle: { style: 'trail' },
    speedzone: { style: 'ring', radius: 100, durationFrames: 32 },
    cascade: { style: 'symbol', symbol: '🤝', fallbackSymbol: 'S', durationFrames: 30 },
    teacher: { style: 'symbol', symbol: '📘', fallbackSymbol: 'T', durationFrames: 30 },
    shimmer: { style: 'ring', radius: 85, durationFrames: 26 },
    golden: { style: 'symbol', symbol: '👑', fallbackSymbol: '★', durationFrames: 32 }
};

// Original spawn percentages (golden removed - it's special unlock only)
const BUTTERFLY_SPAWN_WEIGHTS = {
    friendly: 40,
    cautious: 15,
    energetic: 15,
    skittish: 10,
    wise: 10,
    mystic: 10  // Increased from 8 to account for golden's 2% removal
};

// Get a random personality based on rarity weights with spawn limits
function getRandomPersonality() {
    // Get spawn counts from game state
    const spawnCounts = (typeof gameCore !== 'undefined' && gameCore.gameState) ? 
        gameCore.gameState.butterflySpawnCounts : {};
    
    // Calculate adjusted weights based on spawn counts
    const adjustedWeights = {};
    let totalWeight = 0;
    let reducedWeight = 0;
    
    // First pass: calculate weights and track reductions
    for (let [type, baseWeight] of Object.entries(BUTTERFLY_SPAWN_WEIGHTS)) {
        const count = spawnCounts[type] || 0;
        
        if (count >= 2) {
            // Halve the weight for types spawned 2+ times
            const halfWeight = baseWeight / 2;
            adjustedWeights[type] = halfWeight;
            reducedWeight += (baseWeight - halfWeight);
            totalWeight += halfWeight;
        } else {
            adjustedWeights[type] = baseWeight;
            totalWeight += baseWeight;
        }
    }
    
    // Count types that haven't reached the 2 spawn limit
    const typesUnderLimit = Object.entries(BUTTERFLY_SPAWN_WEIGHTS)
        .filter(([type, _]) => (spawnCounts[type] || 0) < 2).length;
    
    // Second pass: redistribute reduced weight to types under limit
    if (reducedWeight > 0 && typesUnderLimit > 0) {
        const redistributionPerType = reducedWeight / typesUnderLimit;
        
        for (let [type, weight] of Object.entries(adjustedWeights)) {
            const count = spawnCounts[type] || 0;
            if (count < 2) {
                adjustedWeights[type] += redistributionPerType;
                totalWeight += redistributionPerType;
            }
        }
    }
    
    // Log current spawn distribution for debugging
    if (frameCount % 600 === 0) { // Log every 10 seconds
        console.log('🦋 Butterfly spawn weights:', adjustedWeights);
        console.log('🦋 Spawn counts:', spawnCounts);
    }
    
    // If no types available (shouldn't happen), return friendly
    if (totalWeight === 0) {
        console.warn('All butterfly types at spawn limit!');
        return 'friendly';
    }
    
    // Roll within the adjusted total
    const roll = random(totalWeight);
    let cumulative = 0;
    
    for (let [type, weight] of Object.entries(adjustedWeights)) {
        cumulative += weight;
        if (roll < cumulative) {
            // Track the spawn
            if (typeof gameCore !== 'undefined' && gameCore.gameState) {
                gameCore.gameState.butterflySpawnCounts[type] = (spawnCounts[type] || 0) + 1;
                console.log(`🦋 Spawning ${type} butterfly (count: ${(spawnCounts[type] || 0) + 1})`);
            }
            return type;
        }
    }
    
    // Fallback
    return 'friendly';
}

function chooseProgressionPersonality() {
    if (typeof progressionManager !== 'undefined' && typeof gameCore !== 'undefined' && gameCore?.gameState) {
        const chosen = progressionManager.chooseWildVariant?.(gameCore.gameState, { allowGolden: true });
        if (chosen) {
            return chosen;
        }
    }
    return getRandomPersonality();
}

class Butterfly extends Entity {
    constructor(x, y, colors, isImmortal = false, personalityType = null, options = {}) {
        super(x, y);
        this.id = generateEntityId('butterfly');
        
        // Personality system (must be set first to get size)
        this.personalityType = personalityType || chooseProgressionPersonality();
        this.sex = options.sex || (random() < 0.5 ? 'M' : 'F');
        this.birthSource = options.birthSource || 'wild';
        this.hybridGenome = options.hybridGenome || null;
        this.isHybrid = !!options.isHybrid || !!this.hybridGenome || this.personalityType === 'hybrid';
        this.renderSpecCache = null;
        this.collectionRenderSpecCache = null;
        this.mutationProfile = options.mutationProfile || null;
        this.displayName = options.displayName || null;
        this.personalName = options.personalName || null;
        this.nameDisambiguator = options.nameDisambiguator || null;
        this.hybridEntryId = options.hybridEntryId || null;
        this.currentZoneId = options.currentZoneId || null;
        this.boardPos = options.boardPos || null;
        this.pheromoneCooldownUntil = options.pheromoneCooldownUntil || 0;
        this.fertilityUsesRemaining = options.fertilityUsesRemaining ?? (this.birthSource === 'bred'
            ? (gameConfig?.balance?.hybrid?.bredFertilityUses ?? 1)
            : Infinity);
        this.breeding = {
            partnerId: null,
            matingTimer: 0,
            matingResolved: false,
            attractedMaleId: null,
            attractionStrength: 0
        };
        this.pregnancy = options.pregnancy || null;

        if (this.isHybrid) {
            this.personality = {
                rarity: 'hybrid',
                traits: options.customTraits || {
                    speed: 1,
                    jitteriness: 1,
                    trustPropensity: 1,
                    trustSpeed: 1,
                    scareThreshold: 4,
                    happinessBonus: 1,
                    special: options.customAbility || null
                },
                size: 13,
                wingPattern: 'hybrid',
                description: 'A hybrid butterfly born from the garden.'
            };
        } else {
            this.personality = BUTTERFLY_PERSONALITIES[this.personalityType];
        }
        this.bodySpriteScale = this.sex === 'M' ? 0.8 : 1.0;
        this.wingSpriteScale = this.sex === 'F' ? 1.2 : 1.0;
        this.traits = {
            ...this.personality.traits,
            ...(options.customTraits || {})
        };
        const defaultAbility = this.isHybrid
            ? null
            : (BUTTERFLY_VARIANT_ABILITIES[this.personalityType] || null);
        this.specialAbility = options.specialAbility ?? options.customAbility ?? options.customTraits?.special ?? defaultAbility;
        this.traits.special = this.specialAbility;
        this.visualCueCooldowns = {
            sparkleSeed: 0
        };
        this.lifeSim = createBaseLifeSimState({
            entityType: 'butterfly',
            archetype: this.personalityType,
            source: this.birthSource,
            drives: {
                selfMaintenance: 0.45,
                safetyAvoidance: Math.max(0.15, 1 / Math.max(this.traits.scareThreshold, 1)),
                resourceControl: 0.2,
                socialConnection: Math.min(1, this.traits.trustPropensity * 0.5),
                caregiving: this.pregnancy ? 0.6 : 0.15,
                exploration: Math.min(1, this.traits.speed * 0.5),
                statusExpression: this.personality.rarity === 'legendary' ? 1 : 0.35,
                rest: 0.2
            },
            emotions: {
                significance: this.personality.rarity === 'legendary' ? 0.75 : 0.25,
                curiosity: Math.min(1, this.traits.speed * 0.4),
                agitation: Math.min(1, this.traits.jitteriness * 0.35)
            },
            communication: {
                expressiveness: Math.max(0.2, Math.min(1, 0.28 + this.traits.trustPropensity * 0.22 + this.traits.happinessBonus * 0.06)),
                receptivity: Math.max(0.2, Math.min(1, 0.3 + this.traits.scareThreshold * 0.1)),
                clarityBias: Math.max(-0.25, Math.min(0.25, (this.traits.trustSpeed - 1) * 0.12)),
                lexicon: {},
                activeSignal: null,
                recentEmitted: [],
                recentReceived: []
            },
            genetics: {
                source: this.isHybrid ? 'hybrid' : this.birthSource,
                baselineTraits: this.traits,
                inheritedTraits: options.inheritedTraits || (this.isHybrid ? this.traits : {}),
                mutationProfile: this.mutationProfile,
                heritageTags: (options.heritageTags || [
                    this.personalityType,
                    this.personality.wingPattern || 'solid',
                    this.mutationProfile?.active ? 'mutant' : null
                ]).filter(Boolean),
                lineageTypes: (options.lineageTypes || [
                    this.personalityType !== 'hybrid' ? this.personalityType : null
                ]).filter(Boolean),
                lineageDepth: Math.max(0, options.lineageDepth ?? (this.isHybrid ? 1 : 0)),
                parentIds: options.parentIds || [],
                ancestorIds: options.ancestorIds || []
            },
            progression: {
                originType: this.birthSource === 'bred' ? 'bred' : 'wild'
            },
            lifecycle: {
                stage: 'adult',
                currentZoneId: this.currentZoneId
            }
        });
        
        // Override base properties with personality-based values
        this.size = this.personality.size || 12; // Personality-based size
        
        // Engagement-based lifecycle (overrides Entity defaults)
        this.engagementTimer = 10800; // 3 minutes at 60 fps
        this.maxEngagementTimer = 10800;
        this.criticalEngagementThreshold = 3600; // 1 minute - warning phase
        this.fadeStartThreshold = 1200; // 20 seconds - start fading
        this.engagementDecayEnabled = false;
        
        this.shadowOffset = gameConfig.entities.heightOffset.butterfly;
        this.flightH = 0;
        this.flightHProbeOverride = null;
        
        // Immortality flag for first butterfly to prevent ecosystem collapse
        this.isImmortal = isImmortal;
        
        // Butterfly specific properties
        this.colors = colors || this.personality.colors || [[255, 255, 255], [200, 200, 200]];
        this.wingPattern = this.personality.wingPattern || 'solid';
        
        // Log butterfly spawn for learning
        console.log(`🦋 SPAWNED: ${this.personalityType} butterfly (${this.personality.rarity}) - ${this.personality.description}`);
        
        // === UNIFIED MOVEMENT SYSTEM ===
        const movementOwner = this;
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
                    this.target = movementOwner.normalizeMovementTarget(x, y, { space: 'legacy-grid' });
                    this.targetType = type;
                    this.targetPriority = priority;
                    this.wobbleAmount = wobble;
                }
            },

            setBoardTarget(u, v, type, priority = 1, wobble = 0) {
                if (priority >= this.targetPriority) {
                    this.target = movementOwner.normalizeMovementTarget(u, v, { space: 'board' });
                    this.targetType = type;
                    this.targetPriority = priority;
                    this.wobbleAmount = wobble;
                }
            },

            setScreenTarget(x, y, type, priority = 1, wobble = 0) {
                if (priority >= this.targetPriority) {
                    this.target = movementOwner.normalizeMovementTarget(x, y, { space: 'screen' });
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
            mating: 0,
            postFeedingCooldown: 0,
            postFeedingLeadCooldown: 0,
            scareImmunity: 0,
            exclamation: 0,
            postFeedingDash: 0,
            
            // Intervals (count up and reset)
            wander: { current: 0, duration: random(300, 600) / this.traits.jitteriness }, // 5-10 seconds for more frequent movement
            flowerSeek: { current: 0, duration: 600 },
            particle: { current: 0, duration: 90 },
            
            // Update all timers
            update() {
                const signals = [];
                
                // Count down active timers
                const activeTimers = ['display', 'scared', 'feeding', 'following', 'mating',
                    'postFeedingCooldown', 'postFeedingLeadCooldown', 'scareImmunity',
                    'exclamation', 'postFeedingDash'];
                
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
        this.targetFlower = null;
        this.targetCleanupPile = null;
        this.targetFlowerToBlockId = null;
        this._decisionTraceCache = {
            frame: -1,
            trace: null,
            choices: null
        };
        
        // === CURSOR INTERACTION ===
        this.cursor = {
            // Normalize interest radius to be more fair across personalities
            // Golden butterflies get a larger interaction zone to compensate for their speed
            interestRadius: this.personalityType === 'golden' ? 
                90 : // Larger zone for golden butterfly
                60 + (20 * Math.min(1.2, this.traits.trustPropensity)),
            patienceRequired: 90 / this.traits.trustSpeed,
            currentPatience: 0,
            trustLevel: 0,
            trustGlowAlpha: 0,
            trustDisplayTriggered: false,
            trustRewardCooldownFrames: 0,
            calmedByCursor: false,
            clapFear: 0,
            followDistance: 30,
            maxFollowTime: 600,
            followingPos: null
        };
        this.signalDecisionCooldownFrames = 0;
        
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
            meander: 0.015 * this.traits.speed, // Increased for more noticeable movement
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
            teachingAura: false, // For wise butterflies
            trustCascadeCache: [] // Pre-allocated for skittish
        };

        this.blockInteraction = {
            targetBlockId: null,
            carryingBlockId: null,
            placementTarget: null,
            buildingAssist: null,
            materialSource: null,
            lastPlacementMode: 'ground',
            cooldownFrames: Math.floor(random(72, 156)),
            lastRelativeSize: 0,
            carryFrames: 0
        };

        this.dispersal = {
            recentSectorKeys: [],
            recentAnchorIds: [],
            lastRecordedSectorKey: null,
            lastRecordedFrame: 0
        };
        
        // === SPAWN EFFECTS ===
        this.spawnTimer = 0; // Set by color pool when spawned
        this.spawnGlowIntensity = 0; // Glow effect for newly spawned butterflies

        // === AFTERIMAGE TRAIL ===
        this.afterimages = [];        // Rolling buffer of { x, y, wingAngle } snapshots
        this.afterimageInterval = 4;  // Record a snapshot every 4 frames
        this.afterimageMax = 20;      // Keep up to 20 ghost positions

        // === SPAWN FLIGHT (archway entry) ===
        this.isSpawning = false;
        this.spawnFlight = {
            originX: 0, originY: 0,
            targetX: 0, targetY: 0,
            progress: 0,
            duration: 120  // ~2 seconds at 60fps
        };
        
        // Start with a wander target for immediate movement
        this.pickNewWanderTarget();
    }
    
    update(gameState) {
        // During spawn flight, skip all normal logic
        if (this.isSpawning) {
            this.updateSpawnFlight(gameState);
            return;
        }

        // Call parent update
        super.update(gameState);
        this.lifeSim.lifecycle.ageTicks++;
        
        // Extract what we need from gameState
        const { flowers, particleSystem, cursorVelocity, adjustedMouseX, adjustedMouseY } = gameState;
        
        // 0. Failsafe: Ensure butterflies in normal state always have a movement target
        if (this.state === 'normal' && (!this.movement.target || !this.movement.targetType)) {
            this.pickNewWanderTarget();
        }

        if (this.state === 'normal' && !this.zoneTravel && !this.pendingPollenDropTarget) {
            const crowdRetargetFrame = 45 + (((this.id || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 17);
            if (this.movement.targetType === 'meander' && this.getDecisionFrame() % crowdRetargetFrame === 0) {
                const nearbyCrowd = this.getNearbyButterflyCount(84);
                const crowdPressure = Math.min(1, nearbyCrowd / 6);
                if (crowdPressure > 0.62) {
                    this.timers.wander.current = 0;
                    this.pickNewWanderTarget();
                }
            }
        }
        
        // 1. Update timers first
        const timerSignals = this.timers.update();
        
        // 2. Update happiness system
        this.updateHappiness();
        
        // 3. Update feeding cooldowns
        this.updateFeedingCooldowns();
        
        // 4. Update visual properties
        if (this.cursor.trustRewardCooldownFrames > 0) {
            this.cursor.trustRewardCooldownFrames--;
        }
        if (this.signalDecisionCooldownFrames > 0) {
            this.signalDecisionCooldownFrames--;
        }
        if (this.cursor.clapFear > 0) {
            this.cursor.clapFear = Math.max(0, this.cursor.clapFear - 0.0008);
        }
        if (this.timers.exclamation > 0) {
            this.visual.exclamationY -= 0.5;
        }
        if (this.cursor.trustGlowAlpha > 0 && this.cursor.currentPatience === 0) {
            this.cursor.trustGlowAlpha = Math.max(0, this.cursor.trustGlowAlpha - 12);
        }

        const sleepState = this.getSleepState();
        if (!sleepState?.subtype && this.movement.targetType === 'sleep') {
            this.movement.clearTarget();
            this.pickNewWanderTarget();
        }

        if (sleepState?.subtype) {
            this.updateSleepingState(gameState, sleepState);
            this.updateFlightH();
            this.updateSpawnEffects(particleSystem);
            return;
        }
        
        // 5. Check state transitions
        this.checkStateTransitions(gameState);
        
        // 6. Execute state behavior
        this.executeStateBehavior(gameState);
        
        // 7. Calculate speed once
        const currentSpeed = this.getSpeed();
        
        // 8. Update movement once
        this.updateMovement(currentSpeed);
        this.updateFlightH();
        
        // 9. Update visuals
        this.updateWings();
        this.updateSpecialAbilities(gameState);

        // 9.5 Record afterimage snapshot only when the current render profile can afford it
        const trailMode = typeof renderManager !== 'undefined'
            ? renderManager.getTrailVisibilityMode?.() || 'reduced'
            : 'reduced';
        if (trailMode === 'off') {
            this.afterimages.length = 0;
        } else {
            const afterimageInterval = trailMode === 'reduced'
                ? Math.max(this.afterimageInterval, 7)
                : this.afterimageInterval;
            const afterimageMax = trailMode === 'reduced'
                ? Math.min(this.afterimageMax, 6)
                : this.afterimageMax;
            if (frameCount % afterimageInterval === 0) {
                this.afterimages.push({ x: this.x, y: this.y, wingAngle: this.visual.wingAngle });
                if (this.afterimages.length > afterimageMax) {
                    this.afterimages.shift();
                }
            }
        }
        
        // 10. Update spawn effects
        this.updateSpawnEffects(particleSystem);

        const dispersalConfig = this.getDispersalConfig();
        if (this.getDecisionFrame() - (this.dispersal.lastRecordedFrame || 0) >= dispersalConfig.visitRecordIntervalFrames) {
            this.recordDispersalVisit();
        }
        
        // 11. Handle timer signals
        if (timerSignals.includes('wander') && this.state === 'normal') {
            // Pick new wander target if we don't have one or if we're already meandering
            if (!this.movement.target || !this.movement.targetType || this.movement.targetType === 'meander') {
                this.pickNewWanderTarget();
            }
        }
        if (timerSignals.includes('particle')) this.checkParticleEmission(particleSystem);
        if (timerSignals.includes('flowerSeek') && this.state === 'normal') {
            this.checkFlowerSeeking(flowers);
        }
    }

    getSleepState() {
        if (typeof sleepSystem === 'undefined') return null;
        return sleepSystem.getSleepState(this.id);
    }

    updateSleepingState(gameState, sleepState) {
        const { particleSystem } = gameState;
        const allBlocks = gameState?.blocks || [];
        const carriedBlock = this.getCarriedBlock(allBlocks);

        if (carriedBlock) {
            this.releaseCarriedBlockForSleep(allBlocks);
        }

        if (this.getCarriedBlock(allBlocks)) {
            sleepSystem?.wakeEntity?.(this.id, 'carrying-block');
            this.movement.clearTarget();
            return;
        }

        this.afterimages.length = 0;
        if (this.isBoardMovementWorld()) {
            const boardPos = this.ensureBoardPos();
            if (boardPos) {
                this.movement.target = this.makeBoardMovementTarget(boardPos);
                this.movement.smoothFollowTarget = {
                    x: boardPos.u,
                    y: boardPos.v,
                    u: boardPos.u,
                    v: boardPos.v,
                    zoneId: boardPos.zoneId
                };
            }
        } else {
            this.movement.target.x = this.gridPos.x;
            this.movement.target.y = this.gridPos.y;
        }
        this.movement.targetType = 'sleep';
        this.movement.targetPriority = 999;
        this.movement.wobbleAmount = 0;
        this.movement.followOffset.x = 0;
        this.movement.followOffset.y = 0;
        this.cursor.trustGlowAlpha = Math.max(0, this.cursor.trustGlowAlpha - 12);

        if (this.state === 'display' || this.state === 'following') {
            this.state = 'normal';
            this.stateData = {};
        }

        this.updateWings();
        this.syncDebugGridPos();
        this.updateZIndex();

        if (sleepState.subtype !== 'settling_sleep' && particleSystem && frameCount % 180 === 0) {
            particleSystem.emit(this.x + random(-2, 2), this.y - 4 + random(-1, 1), [210, 225, 255], 1, 'joy');
        }
    }

    updateSpawnEffects(particleSystem) {
        if (this.spawnTimer <= 0) return;

        this.spawnTimer--;
        const maxSpawnTimer = this.personalityType === 'golden' ? 300 : 180;
        this.spawnGlowIntensity = this.spawnTimer / maxSpawnTimer;
        const crowdSuppression = this.getCrowdSuppressionFactor(96);

        if (crowdSuppression > 0.36 && this.spawnTimer % 14 === 0) {
            const sparkleColor = this.personalityType === 'golden'
                ? [255, 215, 0]
                : [255, 255, 200];

            particleSystem.emit(
                this.x + random(-10, 10),
                this.y + random(-10, 10),
                sparkleColor,
                1,
                'joy'
            );
        }
    }
    
    // === CENTRALIZED SPEED CALCULATION ===
    getSpeed() {
        // Base speed from personality
        let speed = this.speeds.base;
        const behaviorBiases = this.lifeSim?.derived?.behaviorBiases || {};
        
        // State-based modifiers (in priority order)
        if (this.state === 'feeding') return 0;
        if (this.state === 'mating') return 0;
        if (this.state === 'scared') {
            return this.speeds.flee * (1 + ((behaviorBiases.caution || 0) * 0.18));
        }
        if (this.state === 'pregnant-travel') return this.speeds.seeking * 1.15;
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

        if (this.movement.targetType === 'goal') {
            speed *= 1 + ((behaviorBiases.feedUrgency || 0) * 0.14);
        } else if (this.movement.targetType === 'meander') {
            speed *= Math.max(0.7, Math.min(1.32, behaviorBiases.wanderScale || 1));
        } else {
            speed *= 0.96 + ((behaviorBiases.socialConfidence || 0) * 0.08);
        }
        
        const movementSpeedBonus = this.getStatusStrength('movement_speed_bonus');
        if (movementSpeedBonus > 0) {
            speed *= 1 + movementSpeedBonus;
        }
        
        return speed;
    }
    
    // === STATE MANAGEMENT ===
    checkStateTransitions(gameState) {
        const { cursorVelocity, adjustedMouseX, adjustedMouseY, particleSystem } = gameState;
        const dx = this.x - adjustedMouseX;
        const dy = this.y - adjustedMouseY;
        const distToCursorSq = dx * dx + dy * dy;
        let riskProfile = null;
        const getRiskProfile = () => {
            if (!riskProfile) {
                riskProfile = this.getDecisionRiskProfile();
            }
            return riskProfile;
        };
        
        // Check for fast cursor movement (scare response)
        if (this.timers.scareImmunity === 0 && this.state !== 'display') {
            const maxScareRadius = this.constants.scareRadius * 0.95;
            if (distToCursorSq < (maxScareRadius * maxScareRadius)) {
                const caution = this.lifeSim?.derived?.behaviorBiases?.caution || 0;
                const socialConfidence = this.lifeSim?.derived?.behaviorBiases?.socialConfidence || 0;
                const cursorTrustBuffer = this.cursor.calmedByCursor ? 0.42 : 0.24;
                const fearPenalty = this.cursor.clapFear * 0.55;
                const activeRiskProfile = getRiskProfile();
                const effectiveScareThreshold = this.constants.scareThreshold * Math.max(
                    1.05,
                    1.28 + cursorTrustBuffer + (socialConfidence * 0.08) - (caution * 0.18) - fearPenalty
                ) * (activeRiskProfile.scareThresholdMultiplier || 1);
                const scareRadius = this.constants.scareRadius * (activeRiskProfile.scareRadiusMultiplier || 0.72);
                if (cursorVelocity > effectiveScareThreshold &&
                    distToCursorSq < (scareRadius * scareRadius)) {
                    if (this.state !== 'scared') {
                        this.changeState('scared', { cursorX: adjustedMouseX, cursorY: adjustedMouseY });
                    }
                }
            }
        }
        
        // Check for cursor interaction (leading system)
        if (this.state !== 'scared' && this.state !== 'display' && 
            this.state !== 'feeding' && this.state !== 'mating' &&
            this.state !== 'pregnant-travel' &&
            this.timers.postFeedingLeadCooldown === 0) {
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
        eventBus.emit(GameEvents?.BUTTERFLY_STATE_CHANGED || 'butterfly:stateChange', {
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
                this.targetFlower = null;
                this.movement.clearTarget();
                this.setFleeTarget(data.cursorX, data.cursorY);
                eventBus.emit(GameEvents?.COMMUNICATION_SIGNAL || 'communication:signal', {
                    sourceId: this.id,
                    sourceButterfly: this,
                    signalType: 'warning_signal',
                    intent: 'warn nearby butterflies'
                });
                // Reduce happiness slightly
                const happinessLoss = 2 + random(1, 3);
                this.happiness = Math.max(5, this.happiness - happinessLoss);
                break;
                
            case 'display':
                this.timers.display = this.constants.displayDuration;
                this.visual.hasBeenHovered = true;
                this.targetFlower = null;
                this.movement.clearTarget();
                break;
                
            case 'feeding':
                this.timers.feeding = 0;
                this.timers.scareImmunity = this.constants.scareImmunityDuration;
                this.feeding.startHappiness = this.happiness;
                this.feeding.targetFlower = data.flower;
                this.targetFlower = data.flower || null;
                if (data.flower) {
                    if (data.flower.currentFeeder && data.flower.currentFeeder !== this) {
                        this.feeding.targetFlower = null;
                        this.targetFlower = null;
                        this.movement.clearTarget('goal');
                        break;
                    }
                    data.flower.currentFeeder = this;
                    // Position close to flower
                    this.setMovementTargetFromScreen(data.flower.x, data.flower.y, 'immediate', 10, 0, {
                        zoneId: data.flower.currentZoneId || this.getMovementZoneId(),
                        offset: { x: random(-0.3, 0.3), y: random(-0.3, 0.3) }
                    });
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
                this.targetFlower = null;
                this.movement.clearTarget();
                this.cursor.trustGlowAlpha = 0;

                break;

            case 'mating':
                this.timers.mating = this.breeding.matingTimer || 120;
                this.targetFlower = null;
                this.movement.clearTarget();
                eventBus.emit(GameEvents?.COMMUNICATION_SIGNAL || 'communication:signal', {
                    sourceId: this.id,
                    sourceButterfly: this,
                    signalType: 'courtship_signal',
                    intent: 'court nearby butterflies',
                    targetId: this.breeding.partnerId || null
                });
                break;

            case 'pregnant-travel':
                if (data.flower) {
                    this.setMovementTargetFromScreen(data.flower.x, data.flower.y, 'pregnant', 11, 0, {
                        zoneId: data.flower.currentZoneId || this.getMovementZoneId()
                    });
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
                this.targetFlower = null;
                this.feeding.startHappiness = null;
                this.timers.postFeedingCooldown = this.feeding.postFeedingCooldownDuration;
                this.timers.postFeedingLeadCooldown = this.feeding.postFeedingLeadCooldownDuration;
                this.setPostFeedingDestination();
                // Reset wander timer to ensure butterfly picks new targets after feeding
                this.timers.wander.current = 0;
                break;
            case 'following':
                this.cursor.currentPatience = 0;
                this.cursor.trustLevel = Math.max(0, this.cursor.trustLevel - 5);
                this.timers.wander.current = 0;
                break;
            case 'mating':
                this.timers.mating = 0;
                this.breeding.matingResolved = false;
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
            case 'mating':
                this.executeMatingBehavior(gameState);
                break;
            case 'pregnant-travel':
                this.executePregnantTravelBehavior(gameState);
                break;
        }
    }
    
    // === UNIFIED MOVEMENT SYSTEM ===
    isBoardMovementWorld() {
        return gameCore?.isSimBoardWorld?.() || gameConfig?.world?.renderMode === 'sim-board';
    }

    getMovementZoneId() {
        return this.currentZoneId
            || this.lifeSim?.lifecycle?.currentZoneId
            || this.boardPos?.zoneId
            || gameCore?.getFocusedZoneId?.()
            || null;
    }

    getProjectionForMovement(zoneId = this.getMovementZoneId()) {
        return renderManager?.getProjectionForZone?.(zoneId) || null;
    }

    getFlightHConfig() {
        const config = gameConfig?.entities?.butterfly?.flightH || {};
        return {
            enabled: config.enabled !== false,
            idleBobUnits: Number.isFinite(config.idleBobUnits) ? config.idleBobUnits : 0.22,
            movingMinUnits: Number.isFinite(config.movingMinUnits) ? config.movingMinUnits : 0.75,
            movingMaxUnits: Number.isFinite(config.movingMaxUnits) ? config.movingMaxUnits : 2.4,
            distantTargetUnits: Number.isFinite(config.distantTargetUnits) ? config.distantTargetUnits : 3,
            smoothness: Number.isFinite(config.smoothness) ? config.smoothness : 0.18
        };
    }

    getBoardHStep(zoneId = this.getMovementZoneId()) {
        const projection = this.getProjectionForMovement(zoneId);
        return Number.isFinite(projection?.hStep)
            ? projection.hStep
            : (gameConfig?.spatial?.projection?.hStep || 8);
    }

    getDesiredFlightH() {
        const config = this.getFlightHConfig();
        if (!config.enabled) return 0;
        if (Number.isFinite(this.flightHProbeOverride)) {
            return Math.max(0, Math.min(6, this.flightHProbeOverride));
        }
        if (this.getSleepState?.()?.subtype || this.state === 'feeding' || this.state === 'mating') {
            return 0;
        }
        if (this.isSpawning) {
            return Math.min(config.distantTargetUnits, config.movingMaxUnits + 0.35);
        }

        const distance = this.getDistanceToMovementTarget();
        if (!Number.isFinite(distance) || distance < 0.35 || !this.movement?.targetType) {
            return 0;
        }

        const travelLift = distance >= 8
            ? config.distantTargetUnits
            : config.movingMinUnits + ((Math.min(distance, 8) / 8) * (config.movingMaxUnits - config.movingMinUnits));
        const frame = this.getDecisionFrame();
        const bob = Math.sin((frame * 0.08) + ((this.id || '').length * 0.7)) * config.idleBobUnits;
        return Math.max(0, travelLift + bob);
    }

    updateFlightH() {
        const config = this.getFlightHConfig();
        const targetH = this.getDesiredFlightH();
        const smoothness = Math.max(0.01, Math.min(1, config.smoothness));
        this.flightH += (targetH - this.flightH) * smoothness;
        if (Math.abs(this.flightH) < 0.001) {
            this.flightH = 0;
        }
        return this.flightH;
    }

    getShadowScreenPoint() {
        const zoneId = this.getMovementZoneId();
        const boardPos = this.boardPos && Number.isFinite(this.boardPos.u) && Number.isFinite(this.boardPos.v)
            ? { ...this.boardPos, zoneId: this.boardPos.zoneId || zoneId, h: 0 }
            : null;
        if (this.isBoardMovementWorld() && boardPos && renderManager?.boardToScreen) {
            return renderManager.boardToScreen(boardPos);
        }
        return {
            x: this.x || 0,
            y: (this.y || 0) + (this.shadowOffset || 0),
            zoneId
        };
    }

    getFlightRenderOffset() {
        if (!this.getFlightHConfig().enabled || !Number.isFinite(this.flightH) || this.flightH <= 0) {
            return { x: 0, y: 0 };
        }
        const zoneId = this.getMovementZoneId();
        const boardPos = this.boardPos && Number.isFinite(this.boardPos.u) && Number.isFinite(this.boardPos.v)
            ? { ...this.boardPos, zoneId: this.boardPos.zoneId || zoneId }
            : null;
        if (this.isBoardMovementWorld() && boardPos && renderManager?.boardToScreen) {
            const shadow = renderManager.boardToScreen({ ...boardPos, h: 0 });
            const sprite = renderManager.boardToScreen({ ...boardPos, h: this.flightH });
            return {
                x: sprite.x - shadow.x,
                y: sprite.y - shadow.y
            };
        }
        return {
            x: 0,
            y: -this.flightH * this.getBoardHStep(zoneId)
        };
    }

    clampBoardTarget(boardPos = {}, zoneId = this.getMovementZoneId()) {
        const projection = this.getProjectionForMovement(zoneId);
        const maxU = projection?.widthUnits ?? gameConfig?.spatial?.projection?.defaultWidthUnits ?? 36;
        const maxV = projection?.depthUnits ?? gameConfig?.spatial?.projection?.defaultDepthUnits ?? 22;
        const u = Number.isFinite(boardPos.u) ? boardPos.u : Number.isFinite(boardPos.x) ? boardPos.x : 0.5;
        const v = Number.isFinite(boardPos.v) ? boardPos.v : Number.isFinite(boardPos.y) ? boardPos.y : 0.5;
        return {
            zoneId: boardPos.zoneId || zoneId,
            u: Math.max(0.5, Math.min(Math.max(0.5, maxU - 0.5), u)),
            v: Math.max(0.5, Math.min(Math.max(0.5, maxV - 0.5), v)),
            h: Number.isFinite(boardPos.h) ? boardPos.h : 0
        };
    }

    makeBoardMovementTarget(boardPos = {}) {
        const clamped = this.clampBoardTarget(boardPos, boardPos.zoneId || this.getMovementZoneId());
        return {
            x: clamped.u,
            y: clamped.v,
            u: clamped.u,
            v: clamped.v,
            h: clamped.h || 0,
            zoneId: clamped.zoneId,
            space: 'board'
        };
    }

    screenPointToBoardTarget(x, y, zoneId = this.getMovementZoneId()) {
        const renderer = typeof renderManager !== 'undefined' ? renderManager : null;
        if (!renderer?.screenToBoard) {
            return this.clampBoardTarget({ zoneId, u: x, v: y, h: 0 }, zoneId);
        }
        return this.clampBoardTarget(renderer.screenToBoard(x, y, zoneId, 0), zoneId);
    }

    screenPointToLegacyGridTarget(x, y) {
        if (typeof gridManager !== 'undefined' && gridManager?.screenToIso) {
            return gridManager.screenToIso(x, y);
        }
        return { x, y };
    }

    setMovementTargetFromScreen(x, y, type, priority = 1, wobble = 0, options = {}) {
        const offset = options.offset || {};
        const zoneId = options.zoneId || this.getMovementZoneId();
        if (this.isBoardMovementWorld()) {
            const target = this.screenPointToBoardTarget(x, y, zoneId);
            const u = target.u + (offset.u ?? offset.x ?? 0);
            const v = target.v + (offset.v ?? offset.y ?? 0);
            this.movement.setBoardTarget(u, v, type, priority, wobble);
            return this.makeBoardMovementTarget({ zoneId: target.zoneId, u, v, h: target.h || 0 });
        }
        const target = this.screenPointToLegacyGridTarget(x, y);
        const gridX = target.x + (offset.x ?? offset.u ?? 0);
        const gridY = target.y + (offset.y ?? offset.v ?? 0);
        this.movement.setTarget(gridX, gridY, type, priority, wobble);
        return { x: gridX, y: gridY };
    }

    normalizeMovementTarget(x, y, options = {}) {
        if (!this.isBoardMovementWorld()) {
            return { x, y };
        }

        const zoneId = options.zoneId || this.getMovementZoneId();
        if (options.space === 'board') {
            return this.makeBoardMovementTarget({ zoneId, u: x, v: y, h: 0 });
        }

        if (options.space === 'screen') {
            return this.makeBoardMovementTarget(this.screenPointToBoardTarget(x, y, zoneId));
        }

        const screenPoint = gridManager?.isoToScreen?.(x, y) || { x, y };
        return this.makeBoardMovementTarget(this.screenPointToBoardTarget(screenPoint.x, screenPoint.y, zoneId));
    }

    ensureBoardPos(options = {}) {
        const zoneId = options.zoneId || this.getMovementZoneId();
        if (this.boardPos && Number.isFinite(this.boardPos.u) && Number.isFinite(this.boardPos.v)) {
            this.boardPos = this.clampBoardTarget(this.boardPos, this.boardPos.zoneId || zoneId);
            return this.boardPos;
        }
        return this.syncBoardPosFromScreen({ zoneId, force: true });
    }

    applyScreenFromBoardPos(boardPos = this.boardPos) {
        if (!boardPos || !renderManager?.boardToScreen) return false;
        const clamped = this.clampBoardTarget(boardPos, boardPos.zoneId || this.getMovementZoneId());
        const screen = renderManager.boardToScreen(clamped);
        this.boardPos = clamped;
        this.x = screen.x;
        this.y = screen.y - (this.shadowOffset || 0);
        this.syncDebugGridPos();
        return true;
    }

    syncDebugGridPos() {
        if (typeof gridManager !== 'undefined' && gridManager?.screenToIso) {
            this.gridPos = gridManager.screenToIso(this.x || 0, (this.y || 0) + (this.shadowOffset || 0));
        }
        return this.gridPos || null;
    }

    getMovementTargetBoardPos() {
        if (!this.movement?.target) return null;
        if (Number.isFinite(this.movement.target.u) && Number.isFinite(this.movement.target.v)) {
            return this.clampBoardTarget(this.movement.target, this.movement.target.zoneId || this.getMovementZoneId());
        }
        return this.normalizeMovementTarget(this.movement.target.x, this.movement.target.y, { space: 'legacy-grid' });
    }

    getEntityBoardPos(entity, zoneId = this.getMovementZoneId()) {
        if (!entity) return null;
        if (entity.boardPos && Number.isFinite(entity.boardPos.u) && Number.isFinite(entity.boardPos.v)) {
            return this.clampBoardTarget(entity.boardPos, entity.boardPos.zoneId || zoneId);
        }
        if (Number.isFinite(entity.x) && Number.isFinite(entity.y)) {
            return this.screenPointToBoardTarget(entity.x, entity.y + (entity.shadowOffset || 0), zoneId);
        }
        return null;
    }

    getDistanceToMovementTarget() {
        const target = this.getMovementTargetBoardPos();
        if (this.isBoardMovementWorld() && target) {
            const current = this.ensureBoardPos();
            if (!current) return Infinity;
            return Math.hypot(target.u - current.u, target.v - current.v);
        }
        if (!this.movement?.target || !this.gridPos) return Infinity;
        return Math.hypot(this.movement.target.x - this.gridPos.x, this.movement.target.y - this.gridPos.y);
    }

    updateMovement(currentSpeed) {
        if (!this.movement.target || currentSpeed === 0) return;

        if (this.isBoardMovementWorld()) {
            this.updateBoardMovement(currentSpeed);
            return;
        }
        
        // Calculate direction to target
        const dx = this.movement.target.x - this.gridPos.x;
        const dy = this.movement.target.y - this.gridPos.y;
        const distToTarget = sqrt(dx * dx + dy * dy);
        
        if (distToTarget < 0.1) {
            // We've reached the target - clear it
            const wasImmediate = this.movement.targetType === 'immediate';
            const wasGoal = this.movement.targetType === 'goal';
            this.recordDispersalVisit();
            this.movement.clearTarget();
            
            // If we're in normal state, always pick a new wander target
            if (this.state === 'normal') {
                // Reset wander timer to ensure immediate new target selection
                this.timers.wander.current = 0;
                this.pickNewWanderTarget();
            }
            return;
        }
        
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
        
        const baseAngle = atan2(moveY, moveX);
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        const steerOffsets = [0, 0.42, -0.42, 0.8, -0.8, 1.15, -1.15];
        const currentGroundPoint = {
            x: this.x || 0,
            y: (this.y || 0) + (this.shadowOffset || 0)
        };
        const targetScreen = gridManager.isoToScreen(this.movement.target.x, this.movement.target.y);
        const candidateGroundPoints = [];

        for (const offset of steerOffsets) {
            const stepAngle = baseAngle + offset;
            const candidateGridX = this.gridPos.x + (cos(stepAngle) * currentSpeed);
            const candidateGridY = this.gridPos.y + (sin(stepAngle) * currentSpeed);
            const candidateScreen = gridManager.isoToScreen(candidateGridX, candidateGridY);
            const allowDoorways = !!gameCore?.shouldAllowDoorwayTraversalForButterfly?.(this, {
                zoneId,
                currentPoint: currentGroundPoint,
                targetPoint: targetScreen,
                candidatePoint: candidateScreen
            });
            candidateGroundPoints.push({
                x: candidateScreen.x,
                y: candidateScreen.y,
                allowDoorways
            });
        }

        if (!candidateGroundPoints.length) {
            return;
        }

        const resolvedMove = gameCore?.physicsSystem?.resolveButterflyMotionIntent?.(this, {
            zoneId,
            fromPoint: currentGroundPoint,
            candidateGroundPoints,
            source: this.movement.targetType || 'movement',
            gameState: gameCore?.gameState
        });

        if (!resolvedMove?.point && candidateGroundPoints[0]) {
            this.x = candidateGroundPoints[0].x;
            this.y = candidateGroundPoints[0].y - this.shadowOffset;
            this.syncDebugGridPos();
        }

        if (this.pendingPollenDropTarget) {
            const dropDistance = Math.hypot(this.x - this.pendingPollenDropTarget.x, this.y - this.pendingPollenDropTarget.y);
            if (dropDistance < 18) {
                gameCore?.completePollenDrop?.(this);
            }
        }
    }

    updateBoardMovement(currentSpeed) {
        const zoneId = this.getMovementZoneId();
        const currentBoard = this.ensureBoardPos({ zoneId });
        const target = this.getMovementTargetBoardPos();
        if (!currentBoard || !target) return;

        const dx = target.u - currentBoard.u;
        const dy = target.v - currentBoard.v;
        const distToTarget = Math.hypot(dx, dy);

        if (distToTarget < 0.3) {
            this.boardPos = this.clampBoardTarget(target, zoneId);
            this.applyScreenFromBoardPos(this.boardPos);
            this.recordDispersalVisit();
            this.movement.clearTarget();
            if (this.state === 'normal') {
                this.timers.wander.current = 0;
                this.pickNewWanderTarget();
            }
            return;
        }

        let moveX = dx / (distToTarget || 1);
        let moveY = dy / (distToTarget || 1);
        if (this.movement.wobbleAmount > 0 && distToTarget >= 0.5) {
            const wobble = random(-this.movement.wobbleAmount, this.movement.wobbleAmount);
            const angle = atan2(moveY, moveX) + wobble;
            moveX = cos(angle);
            moveY = sin(angle);
        }

        const baseAngle = atan2(moveY, moveX);
        const step = Math.min(Math.max(0.002, currentSpeed), distToTarget);
        const steerOffsets = distToTarget < 0.5 ? [0] : [0, 0.32, -0.32, 0.64, -0.64];
        const currentGroundPoint = {
            x: this.x || 0,
            y: (this.y || 0) + (this.shadowOffset || 0)
        };
        const targetScreen = renderManager?.boardToScreen?.(target) || currentGroundPoint;
        const candidateGroundPoints = [];

        for (const offset of steerOffsets) {
            const stepAngle = baseAngle + offset;
            const candidateBoard = this.clampBoardTarget({
                zoneId,
                u: currentBoard.u + (cos(stepAngle) * step),
                v: currentBoard.v + (sin(stepAngle) * step),
                h: currentBoard.h || 0
            }, zoneId);
            const candidateScreen = renderManager?.boardToScreen?.(candidateBoard);
            if (!candidateScreen) continue;
            const allowDoorways = !!gameCore?.shouldAllowDoorwayTraversalForButterfly?.(this, {
                zoneId,
                currentPoint: currentGroundPoint,
                targetPoint: targetScreen,
                candidatePoint: candidateScreen
            });
            candidateGroundPoints.push({
                x: candidateScreen.x,
                y: candidateScreen.y,
                boardPos: candidateBoard,
                allowDoorways
            });
        }

        const resolvedMove = gameCore?.physicsSystem?.resolveButterflyMotionIntent?.(this, {
            zoneId,
            fromPoint: currentGroundPoint,
            candidateGroundPoints,
            source: this.movement.targetType || 'movement',
            gameState: gameCore?.gameState
        });
        const chosenPoint = resolvedMove?.point || candidateGroundPoints[0] || null;
        if (chosenPoint) {
            const nextBoard = chosenPoint.boardPos
                || this.screenPointToBoardTarget(chosenPoint.x, chosenPoint.y, zoneId);
            this.applyScreenFromBoardPos(nextBoard);
        }

        if (this.pendingPollenDropTarget) {
            const dropDistance = Math.hypot(this.x - this.pendingPollenDropTarget.x, this.y - this.pendingPollenDropTarget.y);
            if (dropDistance < 18) {
                gameCore?.completePollenDrop?.(this);
            }
        }
    }
    
    // === STATE BEHAVIOR IMPLEMENTATIONS ===
    executeNormalBehavior(gameState) {
        const { flowers, blocks } = gameState;
        const displayConfidence = this.lifeSim?.derived?.behaviorBiases?.displayConfidence || 0;
        const socialConfidence = this.lifeSim?.derived?.behaviorBiases?.socialConfidence || 0;
        
        if (
            this.timers.postFeedingCooldown === 0 &&
            !this.lifeSim?.communication?.activeSignal &&
            displayConfidence > 0.72 &&
            socialConfidence > 0.4 &&
            this.getNearbyButterflyCount(84) < 4 &&
            random() < 0.0025
        ) {
            this.changeState('display', { reason: 'life-sim-expression' });
            return;
        }

        this.maybeEmitDecisionSignal(gameState);
        
        // Always ensure we have a movement target
        if (!this.movement.target || !this.movement.targetType) {
            this.pickNewWanderTarget();
            // Don't return early - continue with behavior logic
        }
        
        if (this.checkCleanupSeeking(flowers)) {
            const targetPile = this.targetCleanupPile || this.findDirtPileAtTarget(flowers);
            if (targetPile && this.getDistanceToMovementTarget() < 0.65) {
                targetPile.tryCleanupDirtPile?.([this]);
                this.movement.clearTarget('cleanup');
                this.targetCleanupPile = null;
                this.pickNewWanderTarget();
            }
            return;
        }

        if (this.checkFlowerToBlockConversion(flowers, blocks || [])) {
            return;
        }

        this.checkFlowerSeeking(flowers);

        if (this.movement.targetType === 'goal') {
            const lowFlowerPressure = flowers.filter(flower => this.isFlowerAvailable(flower)).length <= 2;
            if (this.getDistanceToMovementTarget() < 0.5) {
                const targetFlower = this.findFlowerAtTarget(flowers);
                if (targetFlower && this.isFlowerAvailable(targetFlower)) {
                    if (this.happiness < this.baselineHappiness || lowFlowerPressure) {
                        this.changeState('feeding', { flower: targetFlower });
                    } else {
                        this.movement.clearTarget('goal');
                        this.targetFlower = null;
                        this.pickNewWanderTarget();
                    }
                } else {
                    this.movement.clearTarget('goal');
                    this.targetFlower = null;
                    this.pickNewWanderTarget();
                }
            }
        } else {
            // Happy or on cooldown - ensure we're always moving
            if (!this.movement.target || (!this.movement.targetType || 
                (this.movement.targetType !== 'meander' &&
                 this.movement.targetType !== 'immediate' &&
                 this.movement.targetType !== 'cleanup' &&
                 this.movement.targetType !== 'pheromone'))) {
                // Pick a new wander target if we don't have one or if we're not already wandering/dashing
                this.pickNewWanderTarget();
            }
        }

        this.checkBlockExperimentation(blocks || []);
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
            this.pickNewWanderTarget(); // Immediately pick a destination
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
            this.pickNewWanderTarget(); // Start moving again
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

        if (this.feeding.targetFlower.currentFeeder && this.feeding.targetFlower.currentFeeder !== this) {
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
        
        // Emit regular happiness particles while feeding (increased contribution)
        if (frameCount % 15 === 0) {
            particleSystem.emit(this.x, this.y, random(this.colors), 1, 'happy');
        }
        
        // Determine target happiness
        const targetHappiness = this.feeding.startHappiness < this.baselineHappiness ? 60 : 75;
        
        // End feeding if done
        if (this.timers.feeding >= this.feeding.maxDuration || this.happiness >= targetHappiness) {
            this.endFeeding(particleSystem);
            this.changeState('normal');
            // Note: setPostFeedingDestination is already called in exitState
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
            this.pickNewWanderTarget(); // Start wandering when done following
            return;
        }
        
        // Check for feeding opportunities
        if (this.happiness < this.feeding.minHappiness) {
            for (let flower of flowers) {
                const fx = this.x - flower.x;
                const fy = this.y - flower.y;
                if (fx*fx + fy*fy < 100 && this.isFlowerAvailable(flower)) {
                    this.changeState('feeding', { flower: flower });
                    
                    // Add 20% magic pool bonus for successfully leading butterfly to flower
                    if (typeof mainColorPool !== 'undefined' && false) {
                        const bonusAmount = mainColorPool.spawnThreshold * 0.2; // 20% of spawn threshold
                        mainColorPool.glowIntensity = Math.min(
                            mainColorPool.maxGlowIntensity, 
                            mainColorPool.glowIntensity + bonusAmount
                        );
                        
                        // Visual feedback for the bonus
                        if (particleSystem) {
                            particleSystem.emitBurst(this.x, this.y, [255, 215, 0], 10);
                        }
                        
                        console.log(`✨ Magic pool bonus! +${bonusAmount.toFixed(1)}% (${mainColorPool.glowIntensity.toFixed(1)}/${mainColorPool.spawnThreshold})`);
                    }
                    
                    return;
                }
            }
        }
        
        // Update follow position
        const rotationSpeed = 0.005;
        const newAngle = atan2(this.movement.followOffset.y, this.movement.followOffset.x) + rotationSpeed;
        const projection = this.getProjectionForMovement?.();
        const boardDistance = this.cursor.followDistance / Math.max(1, projection?.ppu || gameConfig.grid.cellSize || 20);
        const dist = this.isBoardMovementWorld() ? boardDistance : (this.cursor.followDistance / gameConfig.grid.cellSize);
        this.movement.followOffset.x = cos(newAngle) * dist;
        this.movement.followOffset.y = sin(newAngle) * dist;

        if (this.isBoardMovementWorld()) {
            const cursorBoard = this.screenPointToBoardTarget(adjustedMouseX, adjustedMouseY);
            const desiredU = cursorBoard.u + this.movement.followOffset.x;
            const desiredV = cursorBoard.v + this.movement.followOffset.y;
            const currentSmooth = this.movement.smoothFollowTarget || {
                x: cursorBoard.u,
                y: cursorBoard.v,
                u: cursorBoard.u,
                v: cursorBoard.v
            };
            const smoothU = lerp(currentSmooth.u ?? currentSmooth.x, desiredU, this.movement.followSmoothness);
            const smoothV = lerp(currentSmooth.v ?? currentSmooth.y, desiredV, this.movement.followSmoothness);
            this.movement.smoothFollowTarget = {
                x: smoothU,
                y: smoothV,
                u: smoothU,
                v: smoothV,
                zoneId: cursorBoard.zoneId
            };
            this.movement.setBoardTarget(smoothU, smoothV, 'follow', 5);
        } else {
            const cursorGrid = this.screenPointToLegacyGridTarget(adjustedMouseX, adjustedMouseY);

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
        }
        
        // Visual feedback
        if (this.timers.following % 45 === 0) {
            particleSystem.emit(this.x, this.y, [255, 255, 200], 1, 'joy');
        }
        
        this.cursor.followingPos = { x: adjustedMouseX, y: adjustedMouseY };
    }

    executeMatingBehavior(gameState) {
        const partner = (gameState.butterflies || []).find(item => item.id === this.breeding.partnerId);
        if (!partner) {
            this.changeState('normal');
            return;
        }

        this.timers.mating = Math.max(0, this.breeding.matingTimer || 0);
        const midpointX = (this.x + partner.x) / 2;
        const midpointY = (this.y + partner.y) / 2;
        const offsetX = this.sex === 'M' ? -4 : 4;
        this.setMovementTargetFromScreen(midpointX + offsetX, midpointY, 'mating', 12, 0);
    }

    executePregnantTravelBehavior(gameState) {
        const flower = this.pregnancy?.targetFlower || this.stateData.flower;
        if (!flower || !(gameState.flowers || []).includes(flower)) {
            this.movement.clearTarget('pregnant');
            return;
        }

        this.setMovementTargetFromScreen(flower.x, flower.y, 'pregnant', 11, 0, {
            zoneId: flower.currentZoneId || this.getMovementZoneId()
        });

        if (gameState.particleSystem && frameCount % 10 === 0) {
            const pixel = gameState.particleSystem.emit(
                this.x + random(-3, 3),
                this.y - 8 + random(-2, 2),
                [255, 255, 255],
                1,
                'joy'
            );
            if (pixel) {
                pixel.lifetime = 90;
                pixel.size = Math.max(1.5, gameConfig.particles.pixelSize * 0.8);
            }
        }
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

    getNearbyButterflyCount(radius = 72) {
        if (typeof gameCore === 'undefined' || !gameCore?.gameState?.butterflies) return 0;
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        if (!zoneId) return 0;
        const store = gameCore.butterflyStore;
        if (store) {
            return store.proximityCount(zoneId, this.x, this.y, radius, this.id);
        }
        const bucket = gameCore.getButterfliesInZone?.(zoneId) || [];
        const rSq = radius * radius;
        let count = 0;
        for (let i = 0; i < bucket.length; i += 1) {
            const butterfly = bucket[i];
            if (!butterfly || butterfly.id === this.id) continue;
            const dx = butterfly.x - this.x;
            const dy = butterfly.y - this.y;
            if (dx * dx + dy * dy <= rSq) count += 1;
        }
        return count;
    }

    getCrowdSuppressionFactor(radius = 72) {
        const nearbyCount = this.getNearbyButterflyCount(radius);
        if (nearbyCount <= 2) return 1;
        if (nearbyCount <= 4) return 0.72;
        if (nearbyCount <= 6) return 0.42;
        return Math.max(0.02, 0.42 - ((nearbyCount - 6) * 0.1));
    }
    
    checkParticleEmission(particleSystem) {
        if (!particleSystem) return;
        const crowdSuppression = this.getCrowdSuppressionFactor();
        if (crowdSuppression <= 0.04) return;

        if (this.happiness > this.baselineHappiness) {
            const happinessRatio = (this.happiness - this.baselineHappiness) / 
                                  (this.maxHappiness - this.baselineHappiness);
            
            // Keep ambient contribution readable during crowded long-soak scenes.
            const baseCount = Math.max(0, Math.ceil(happinessRatio * 5 * crowdSuppression));
            if (baseCount > 0) {
                this.emitParticles('happy', baseCount / 10, particleSystem);
            }
            
            const visualCount = Math.max(0, Math.floor(baseCount * 0.5));
            if (visualCount > 0 && crowdSuppression > 0.36) {
                this.emitParticles('happy_visual', visualCount / 12, particleSystem);
            }
            
            // Reserve fountains/spirals for calmer scenes so clusters stay readable.
            if (crowdSuppression > 0.9 && this.happiness > 97 && random() < 0.08 * crowdSuppression) {
                particleSystem.emitFountain(this.x, this.y, random(this.colors), 20, 3);
            } else if (crowdSuppression > 0.78 && this.happiness > 88 && random() < 0.06 * crowdSuppression) {
                particleSystem.emitSpiral(this.x, this.y, random(this.colors), 12);
            }
        } else if (crowdSuppression > 0.84 && this.happiness === this.baselineHappiness && random() < 0.02 * crowdSuppression) {
            particleSystem.emit(this.x, this.y, random(this.colors), 1, 'scale');
        }
    }
    
    // === MOVEMENT HELPERS ===
    setFleeTarget(cursorX, cursorY) {
        if (this.isBoardMovementWorld()) {
            const cursorBoard = this.screenPointToBoardTarget(cursorX, cursorY);
            const currentBoard = this.ensureBoardPos();
            if (cursorBoard && currentBoard) {
                const awayU = currentBoard.u - cursorBoard.u;
                const awayV = currentBoard.v - cursorBoard.v;
                const dist = Math.max(Math.hypot(awayU, awayV), 0.1);
                const fleeDistance = random(3, 6);
                const clamped = this.clampBoardTarget({
                    zoneId: currentBoard.zoneId,
                    u: currentBoard.u + (awayU / dist) * fleeDistance,
                    v: currentBoard.v + (awayV / dist) * fleeDistance,
                    h: currentBoard.h || 0
                }, currentBoard.zoneId);
                this.movement.setBoardTarget(clamped.u, clamped.v, 'flee', 10);
                return;
            }
        }

        const cursorGrid = this.screenPointToLegacyGridTarget(cursorX, cursorY);
        
        // Calculate direction away from cursor
        const awayX = this.gridPos.x - cursorGrid.x;
        const awayY = this.gridPos.y - cursorGrid.y;
        
        // Normalize and extend
        const dist = Math.max(sqrt(awayX * awayX + awayY * awayY), 0.1);
        const fleeDistance = random(3, 6);
        
        const targetX = this.gridPos.x + (awayX / dist) * fleeDistance;
        const targetY = this.gridPos.y + (awayY / dist) * fleeDistance;
        
        const clamped = gridManager.clampGridPosToRoamArea(targetX, targetY, 8);
        this.movement.setTarget(
            clamped.x,
            clamped.y,
            'flee',
            10 // High priority
        );
    }

    getDecisionTrace() {
        const currentFrame = this.getDecisionFrame();
        if (this._decisionTraceCache?.frame === currentFrame) {
            return this._decisionTraceCache.trace;
        }
        const trace = typeof mlInferenceSystem !== 'undefined'
            ? mlInferenceSystem.getEntityTrace?.(this.id)
            : null;
        this._decisionTraceCache = {
            frame: currentFrame,
            trace,
            choices: new Map()
        };
        return trace;
    }

    getDecisionFrame() {
        if (Number.isFinite(gameCore?.gameState?.currentFrame)) {
            return Math.max(0, Math.round(gameCore.gameState.currentFrame));
        }
        return typeof frameCount === 'number' ? frameCount : 0;
    }

    getDecisionPolicyChoice(policyName, fallbackLabel = 'none') {
        const currentFrame = this.getDecisionFrame();
        if (this._decisionTraceCache?.frame !== currentFrame) {
            this.getDecisionTrace();
        }
        if (!(this._decisionTraceCache?.choices instanceof Map)) {
            this._decisionTraceCache = {
                frame: currentFrame,
                trace: this._decisionTraceCache?.trace || null,
                choices: new Map()
            };
        }
        const cacheKey = `${policyName}::${fallbackLabel}`;
        if (this._decisionTraceCache.choices.has(cacheKey)) {
            return this._decisionTraceCache.choices.get(cacheKey);
        }
        const trace = this._decisionTraceCache.trace;
        const policyTrace = trace?.traces?.[policyName] || null;
        const choice = {
            label: trace?.chosenPath?.[policyName] || policyTrace?.chosen || fallbackLabel,
            source: policyTrace?.source || trace?.source || 'heuristic-fallback',
            confidenceScore: policyTrace?.confidence?.score || 0,
            chosenScore: policyTrace?.chosenScore || 0,
            trace
        };
        this._decisionTraceCache.choices.set(cacheKey, choice);
        return choice;
    }

    getDecisionRiskProfile() {
        const choice = this.getDecisionPolicyChoice('riskPosture', 'observe');
        const profiles = {
            approach: {
                scareThresholdMultiplier: 1.18,
                scareRadiusMultiplier: 0.68,
                trustRadiusMultiplier: 1.18,
                maxTrustVelocity: 1.12,
                patienceGain: 1.18,
                patienceLossMultiplier: 0.68
            },
            observe: {
                scareThresholdMultiplier: 1.02,
                scareRadiusMultiplier: 0.72,
                trustRadiusMultiplier: 1.0,
                maxTrustVelocity: 0.96,
                patienceGain: 1,
                patienceLossMultiplier: 0.84
            },
            avoid: {
                scareThresholdMultiplier: 0.88,
                scareRadiusMultiplier: 0.82,
                trustRadiusMultiplier: 0.72,
                maxTrustVelocity: 0.74,
                patienceGain: 0.52,
                patienceLossMultiplier: 1.08
            },
            flee: {
                scareThresholdMultiplier: 0.72,
                scareRadiusMultiplier: 0.95,
                trustRadiusMultiplier: 0.48,
                maxTrustVelocity: 0.56,
                patienceGain: 0.18,
                patienceLossMultiplier: 1.34
            }
        };
        return {
            label: choice.label || 'observe',
            source: choice.source,
            confidenceScore: choice.confidenceScore,
            ...(profiles[choice.label] || profiles.observe)
        };
    }

    getDispersalConfig() {
        return gameCore?.getButterflyDispersalConfig?.()
            || gameConfig?.entities?.butterfly?.dispersal
            || {
                sectorMemoryLimit: 6,
                anchorMemoryLimit: 6,
                visitRecordIntervalFrames: 96
            };
    }

    pushRecentUnique(list, value, limit = 6) {
        if (!Array.isArray(list) || !value) return;
        const existingIndex = list.indexOf(value);
        if (existingIndex >= 0) {
            list.splice(existingIndex, 1);
        }
        list.unshift(value);
        if (list.length > limit) {
            list.length = limit;
        }
    }

    recordDispersalVisit(point = { x: this.x, y: this.y }, options = {}) {
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || gameCore?.getFocusedZoneId?.();
        if (!zoneId || !point) return null;
        const sectorKey = gameCore?.getZoneSectorKey?.(zoneId, point);
        if (!sectorKey) return null;
        if (!options.force && sectorKey === this.dispersal.lastRecordedSectorKey) {
            return sectorKey;
        }
        const config = this.getDispersalConfig();
        this.pushRecentUnique(this.dispersal.recentSectorKeys, sectorKey, config.sectorMemoryLimit || 6);
        this.dispersal.lastRecordedSectorKey = sectorKey;
        this.dispersal.lastRecordedFrame = this.getDecisionFrame();
        return sectorKey;
    }

    rememberDispersalAnchor(anchorId) {
        if (!anchorId) return null;
        const config = this.getDispersalConfig();
        this.pushRecentUnique(this.dispersal.recentAnchorIds, anchorId, config.anchorMemoryLimit || 6);
        return anchorId;
    }

    mapDecisionSignalToCommunicationType(signalLabel, actionLabel = 'signal') {
        switch (signalLabel) {
            case 'calming':
                return 'calming_signal';
            case 'warning':
                return 'warning_signal';
            case 'teaching':
                return 'teaching_signal';
            case 'invitation':
                if (actionLabel === 'court') return 'courtship_signal';
                if (actionLabel === 'socialize') return 'acknowledgement_signal';
                return 'guidance_signal';
            default:
                return null;
        }
    }

    getNearbySignalRecipients(gameState, signalLabel, targetPreference, radius = 86) {
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        const candidates = (gameCore?.getButterfliesInZone?.(zoneId) || (gameState?.butterflies || []))
            .filter(candidate => candidate?.id && candidate.id !== this.id)
            .map(candidate => ({
                candidate,
                distance: Math.hypot((candidate.x || 0) - this.x, (candidate.y || 0) - this.y),
                edge: this.lifeSim?.socialEdges?.[candidate.id] || {}
            }))
            .filter(entry => entry.distance <= radius)
            .map(entry => {
                const edge = entry.edge || {};
                const trust = edge.trust || 0;
                const comfort = edge.comfort || 0;
                const attachment = edge.attachment || 0;
                const admiration = edge.admiration || 0;
                const recentWarmth = edge.recentWarmth || 0;
                const recentEase = edge.recentEase || 0;
                const recentMutualAttention = edge.recentMutualAttention || 0;
                const resentment = edge.resentment || 0;
                const rejectionWeight = edge.rejectionWeight || 0;
                const distanceWeight = Math.min(0.24, entry.distance / Math.max(120, radius * 1.4));
                const socialScore = (
                    trust * 0.2
                    + comfort * 0.24
                    + attachment * 0.18
                    + admiration * 0.12
                    + recentWarmth * 0.12
                    + recentEase * 0.08
                    + recentMutualAttention * 0.08
                    - resentment * 0.2
                    - rejectionWeight * 0.22
                    - distanceWeight
                );
                return {
                    ...entry,
                    socialScore
                };
            })
            .sort((left, right) => {
                if (signalLabel === 'warning') {
                    return left.distance - right.distance;
                }
                return (right.socialScore - left.socialScore) || (left.distance - right.distance);
            });

        if (!candidates.length) return [];

        if (targetPreference === 'butterfly') {
            const maxTargets = signalLabel === 'teaching'
                ? 2
                : signalLabel === 'warning'
                    ? Math.min(2, Math.max(1, candidates.filter(entry => entry.distance <= 54).length))
                    : 1;
            return candidates.slice(0, maxTargets).map(entry => entry.candidate.id);
        }

        if (signalLabel === 'invitation') {
            const preferred = candidates.filter(entry => entry.socialScore > -0.02 || entry.distance <= 56);
            return (preferred.length ? preferred : candidates).slice(0, 1).map(entry => entry.candidate.id);
        }

        if (signalLabel === 'warning') {
            const maxTargets = Math.min(2, Math.max(1, candidates.filter(entry => entry.distance <= 54).length));
            return candidates.slice(0, maxTargets).map(entry => entry.candidate.id);
        }

        if (signalLabel === 'calming') {
            return candidates.slice(0, 1).map(entry => entry.candidate.id);
        }

        return [];
    }

    maybeEmitDecisionSignal(gameState, options = {}) {
        if (typeof eventBus === 'undefined' || !this.lifeSim?.communication) return false;
        if (!options.force && this.signalDecisionCooldownFrames > 0) return false;
        if (!options.force && this.lifeSim.communication.activeSignal) return false;
        if (!options.force && (this.state !== 'normal' || this.isSpawning || this.zoneTravel || this.pendingPollenDropTarget)) return false;

        const signalChoice = this.getDecisionPolicyChoice('signalChoice', 'quiet');
        const actionChoice = this.getDecisionPolicyChoice('actionFamily', 'wander');
        const targetChoice = this.getDecisionPolicyChoice('targetPreference', 'emptySpace');
        const riskChoice = this.getDecisionPolicyChoice('riskPosture', 'observe');
        const signalLabel = signalChoice.label || 'quiet';
        if (signalLabel === 'quiet') return false;

        const signalType = this.mapDecisionSignalToCommunicationType(signalLabel, actionChoice.label || 'signal');
        if (!signalType) return false;

        const social = this.lifeSim?.social || {};
        const emotions = this.lifeSim?.emotions || {};
        const behaviorBiases = this.lifeSim?.derived?.behaviorBiases || {};
        const localSignalField = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getLocalSignalField?.(this, gameState)
            : null;
        const recentReceivedWarnings = (this.lifeSim.communication?.recentReceived || []).filter(entry =>
            entry?.signalType === 'warning_signal'
            && ((communicationSystem?.simulationClockSeconds || 0) - (entry?.atSeconds || 0)) <= 8
        ).length;
        const hasWarningContext = recentReceivedWarnings > 0
            || social.activeContext === 'warning-cascade'
            || riskChoice.label === 'flee'
            || this.state === 'scared';
        const warningSeverity = Math.max(
            emotions.threat || 0,
            (emotions.agitation || 0) * 0.82,
            (behaviorBiases.caution || 0) * 0.74,
            localSignalField?.warningPressure || 0,
            social.activeContext === 'warning-cascade' ? 0.72 : 0
        );
        const calmSocialWindow = warningSeverity < 0.26
            && (social.confidence || 0) + (social.belonging || 0) > 0.24;
        const recentSignals = (this.lifeSim.communication?.recentEmitted || []).slice(0, 5);
        const recentWarningSignals = recentSignals.filter(entry => entry?.signalType === 'warning_signal').length;
        const recentSocialSignals = recentSignals.filter(entry =>
            ['acknowledgement_signal', 'courtship_signal', 'calming_signal'].includes(entry?.signalType)
        ).length;

        const radius = signalLabel === 'warning'
            ? 92
            : signalLabel === 'teaching'
                ? (gameConfig?.balance?.social?.teachingPulseRadius || 80)
                : (gameConfig?.balance?.social?.trustCascadeRadius || 78);
        const targetIds = this.getNearbySignalRecipients(gameState, signalLabel, targetChoice.label || 'emptySpace', radius);
        if (!targetIds.length && (
            signalType === 'teaching_signal'
            || signalType === 'guidance_signal'
            || signalType === 'courtship_signal'
            || signalType === 'warning_signal'
            || signalType === 'acknowledgement_signal'
        ) && !options.force) {
            return false;
        }

        if (!options.force) {
            if (signalLabel === 'warning' && !hasWarningContext && (emotions.threat || 0) < 0.18 && (emotions.agitation || 0) < 0.18 && (behaviorBiases.caution || 0) < 0.22) {
                return false;
            }
            if (signalLabel === 'warning' && warningSeverity < 0.34) {
                return false;
            }
            if (signalLabel === 'invitation' && warningSeverity > 0.42) {
                return false;
            }
        }

        if (!options.force) {
            const confidence = (signalChoice.confidenceScore || signalChoice.chosenScore || 0) / 100;
            const socialOpportunity = Math.max(
                0,
                ((social.confidence || 0) * 0.22)
                + ((social.belonging || 0) * 0.24)
                + ((behaviorBiases.socialConnection || 0) * 0.2)
                + (targetIds.length > 0 ? 0.08 : 0)
            );
            const baseChance = signalLabel === 'warning'
                ? Math.max(0.0015, 0.0015 + (warningSeverity * 0.012) - (recentWarningSignals * 0.0025))
                : signalLabel === 'calming'
                    ? 0.006 + (socialOpportunity * 0.006) + (warningSeverity * 0.004)
                    : signalLabel === 'teaching'
                        ? 0.005 + ((behaviorBiases.trainingAffinity || 0) * 0.008)
                        : 0.008 + (socialOpportunity * 0.012) + (calmSocialWindow ? 0.01 : 0) - (recentSocialSignals * 0.001);
            const actionBoost = actionChoice.label === 'signal'
                ? 0.012
                : actionChoice.label === 'teach'
                    ? 0.008
                    : actionChoice.label === 'socialize'
                        ? 0.008
                        : 0;
            const riskBoost = riskChoice.label === 'flee' && signalLabel === 'warning'
                ? 0.008
                : riskChoice.label === 'approach' && signalLabel === 'calming'
                    ? 0.004
                    : 0;
            if (random() >= (baseChance + actionBoost + riskBoost + (confidence * 0.012))) {
                return false;
            }
        }

        eventBus.emit(GameEvents?.COMMUNICATION_SIGNAL || 'communication:signal', {
            sourceId: this.id,
            sourceButterfly: this,
            signalType,
            intent: signalLabel,
            targetIds,
            radius,
            intensity: Math.max(0.45, Math.min(0.95, (signalChoice.chosenScore || 72) / 100)),
            zoneId: this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null
        });

        const cooldownBySignal = {
            calming: 150,
            warning: 110,
            teaching: 190,
            invitation: 135
        };
        this.signalDecisionCooldownFrames = cooldownBySignal[signalLabel] || 150;
        return true;
    }

    getSocialFollowThroughTargets(zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || gameCore?.getFocusedZoneId?.()) {
        const followThrough = this.lifeSim?.derived?.socialEcology?.followThrough || null;
        if (!followThrough) {
            return {
                followThrough: null,
                seekPartner: null,
                avoidPartner: null,
                imitatePartner: null,
                protectPartner: null
            };
        }

        const zoneList = gameCore?.getButterfliesInZone?.(zoneId) || [];
        const zoneButterflies = zoneList.length ? zoneList : (gameCore?.getGameState?.()?.butterflies || []);
        const resolvePartner = partnerId => zoneButterflies.find(candidate => candidate?.id === partnerId && candidate.id !== this.id) || null;

        return {
            followThrough,
            seekPartner: resolvePartner(followThrough.seekPartnerId),
            avoidPartner: resolvePartner(followThrough.avoidPartnerId),
            imitatePartner: resolvePartner(followThrough.imitatePartnerId),
            protectPartner: resolvePartner(followThrough.protectPartnerId)
        };
    }

    pickNewWanderTarget() {
        this.targetFlower = null;
        this.targetCleanupPile = null;
        const behaviorBiases = this.lifeSim?.derived?.behaviorBiases || {};
        const wanderScale = Math.max(0.7, Math.min(1.35, behaviorBiases.wanderScale || 1));
        const shelterSeeking = Math.max(0, Math.min(1, behaviorBiases.shelterSeeking || 0));
        const nearbyCrowd = this.getNearbyButterflyCount(84);
        const crowdPressure = Math.min(1, nearbyCrowd / 6);
        const mlTrace = typeof mlInferenceSystem !== 'undefined' ? mlInferenceSystem.getEntityTrace?.(this.id) : null;
        const mlTargetSource = mlTrace?.traces?.targetPreference?.source || null;
        const prefersShelterTarget = mlTargetSource === 'ml' && mlTrace?.chosenPath?.targetPreference === 'shelter';
        const prefersEmptySpaceTarget = mlTargetSource === 'ml' && mlTrace?.chosenPath?.targetPreference === 'emptySpace';
        const preferOpenSpace = prefersEmptySpaceTarget || crowdPressure > 0.44;
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || gameCore?.getFocusedZoneId?.();
        const socialTargets = this.getSocialFollowThroughTargets(zoneId);
        const followThrough = socialTargets.followThrough || null;
        const isProjectedNearEntity = (entity, screenPoint) => {
            if (!entity || !screenPoint) return false;
            const groundY = (entity.y || 0) + (entity.shadowOffset || 0);
            return Math.hypot((screenPoint.x || 0) - (entity.x || 0), (screenPoint.y || 0) - groundY) <= 96;
        };
        const getBoardAnchorPoint = entity => {
            if (!entity || !this.isBoardMovementWorld()) return null;
            const boardPos = this.getEntityBoardPos(entity, zoneId);
            const screenPoint = boardPos && renderManager?.boardToScreen?.(boardPos);
            if (screenPoint && isProjectedNearEntity(entity, screenPoint)) return boardPos;
            if (renderManager?.screenToBoard && Number.isFinite(entity.x) && Number.isFinite(entity.y)) {
                return renderManager.screenToBoard(entity.x, (entity.y || 0) + (entity.shadowOffset || 0), zoneId, 0);
            }
            return boardPos || null;
        };
        const getGroundScreenPoint = entity => {
            if (!entity) return null;
            if (this.isBoardMovementWorld()) {
                const boardPos = getBoardAnchorPoint(entity);
                const screenPoint = boardPos && renderManager?.boardToScreen?.(boardPos);
                if (screenPoint) return screenPoint;
            }
            if (entity.gridPos && Number.isFinite(entity.gridPos.x) && Number.isFinite(entity.gridPos.y)) {
                return gridManager?.isoToScreen?.(entity.gridPos.x, entity.gridPos.y) || null;
            }
            if (Number.isFinite(entity.x) && Number.isFinite(entity.y)) {
                return {
                    x: entity.x,
                    y: entity.y + (entity.shadowOffset || 0)
                };
            }
            return null;
        };
        const socialAnchorCandidates = {
            protect: (socialTargets.protectPartner && (followThrough?.protectScore || 0) >= 0.28)
                ? { partner: socialTargets.protectPartner, mode: 'protect', score: followThrough.protectScore || 0, spreadX: 20, spreadY: 16 }
                : null,
            seek: (socialTargets.seekPartner && (followThrough?.seekScore || 0) >= 0.28)
                ? { partner: socialTargets.seekPartner, mode: 'seek', score: followThrough.seekScore || 0, spreadX: 26, spreadY: 20 }
                : null,
            imitate: (socialTargets.imitatePartner && (followThrough?.imitateScore || 0) >= 0.28)
                ? { partner: socialTargets.imitatePartner, mode: 'imitate', score: followThrough.imitateScore || 0, spreadX: 30, spreadY: 22 }
                : null
        };
        const dominantAnchor = followThrough?.dominantMode
            ? socialAnchorCandidates[followThrough.dominantMode] || null
            : null;
        const socialAnchor = dominantAnchor
            || Object.values(socialAnchorCandidates)
                .filter(Boolean)
                .sort((left, right) => (right?.score || 0) - (left?.score || 0))[0]
            || null;
        const socialAnchorPoint = socialAnchor?.partner ? getGroundScreenPoint(socialAnchor.partner) : null;
        const socialAnchorBoardPoint = this.isBoardMovementWorld() && socialAnchor?.partner
            ? getBoardAnchorPoint(socialAnchor.partner)
            : null;
        const socialAnchorGridPoint = !this.isBoardMovementWorld() && socialAnchor?.partner?.gridPos
            && Number.isFinite(socialAnchor.partner.gridPos.x)
            && Number.isFinite(socialAnchor.partner.gridPos.y)
            ? {
                x: socialAnchor.partner.gridPos.x,
                y: socialAnchor.partner.gridPos.y
            }
            : null;
        const socialPreferredPoint = socialAnchorPoint
            ? {
                x: socialAnchorPoint.x + random(-socialAnchor.spreadX, socialAnchor.spreadX),
                y: socialAnchorPoint.y + random(-socialAnchor.spreadY, socialAnchor.spreadY)
            }
            : null;
        const socialAvoidPoints = socialTargets.avoidPartner && (followThrough?.avoidScore || 0) >= 0.3
            ? [getGroundScreenPoint(socialTargets.avoidPartner)].filter(Boolean)
            : [];
        const socialFollowThroughDrive = Math.max(
            followThrough?.seekScore || 0,
            followThrough?.imitateScore || 0,
            followThrough?.protectScore || 0
        );
        const socialAvoidance = followThrough?.avoidScore || 0;
        const preferSocialAnchor = !!socialPreferredPoint && socialFollowThroughDrive >= 0.28;
        const preferWideOpenSpace = preferOpenSpace || socialAvoidance >= 0.34;
        const gridFollowSpread = socialAnchor?.mode === 'protect'
            ? { x: 0.42, y: 0.34 }
            : socialAnchor?.mode === 'imitate'
                ? { x: 0.68, y: 0.52 }
                : { x: 0.56, y: 0.42 };
        const directSocialBoardTarget = this.isBoardMovementWorld() && preferSocialAnchor && socialAvoidPoints.length === 0 && socialAnchor?.score >= (socialAnchor?.mode === 'imitate' ? 0.42 : 0.34) && socialAnchorBoardPoint
            ? this.clampBoardTarget({
                zoneId,
                u: socialAnchorBoardPoint.u + random(-gridFollowSpread.x, gridFollowSpread.x),
                v: socialAnchorBoardPoint.v + random(-gridFollowSpread.y, gridFollowSpread.y),
                h: 0
            }, zoneId)
            : null;
        const directSocialGridTarget = !this.isBoardMovementWorld() && preferSocialAnchor && socialAvoidPoints.length === 0 && socialAnchor?.score >= (socialAnchor?.mode === 'imitate' ? 0.42 : 0.34) && socialAnchorGridPoint
            ? {
                x: constrain(
                    socialAnchorGridPoint.x + random(-gridFollowSpread.x, gridFollowSpread.x),
                    0.5,
                    Math.max(0.5, (gridManager?.bounds?.maxX || 18) - 0.5)
                ),
                y: constrain(
                    socialAnchorGridPoint.y + random(-gridFollowSpread.y, gridFollowSpread.y),
                    0.5,
                    Math.max(0.5, (gridManager?.bounds?.maxY || 18) - 0.5)
                )
            }
            : null;

        // Golden butterflies move much more erratically and frequently
        if (this.personalityType === 'golden') {
            const targetPoint = (directSocialGridTarget || directSocialBoardTarget) ? null : gameCore?.findBestButterflyWanderPoint?.(this, zoneId, {
                candidateCount: 10,
                localHop: { min: 18, max: 42 },
                preferOpenSpace: preferWideOpenSpace,
                preferredPoint: socialPreferredPoint,
                preferredPointBonus: preferSocialAnchor ? 0.34 : 0.24,
                preferredDistanceScale: preferSocialAnchor ? 140 : 180,
                avoidPoints: socialAvoidPoints,
                avoidRadius: socialAvoidance >= 0.42 ? 118 : 92,
                avoidWeight: socialAvoidance >= 0.42 ? 0.4 : 0.28,
                localCrowdRadius: 72,
                maxDistanceForBonus: 90
            }) || gridManager.isoToScreen(
                this.gridPos.x + cos(random(TWO_PI)) * random(2, 4) * wanderScale,
                this.gridPos.y + sin(random(TWO_PI)) * random(2, 4) * wanderScale
            );
            if (directSocialBoardTarget) {
                this.movement.setBoardTarget(
                    directSocialBoardTarget.u,
                    directSocialBoardTarget.v,
                    'meander',
                    1,
                    0.24 + ((behaviorBiases.caution || 0) * 0.12)
                );
            } else if (directSocialGridTarget) {
                this.movement.setTarget(
                    directSocialGridTarget.x,
                    directSocialGridTarget.y,
                    'meander',
                    1,
                    0.24 + ((behaviorBiases.caution || 0) * 0.12)
                );
            } else {
                this.setMovementTargetFromScreen(targetPoint.x, targetPoint.y, 'meander', 1, 0.24 + ((behaviorBiases.caution || 0) * 0.12), { zoneId });
            }
            this.timers.wander.duration = random(20, 40) / Math.max(0.7, wanderScale); // Change direction every 0.3-0.7 seconds
        } else {
            // Normal butterflies pick a destination inside their current land region.
            const targetInsetBase = prefersEmptySpaceTarget ? 26 : (preferSocialAnchor ? 24 : 34);
            const targetInset = targetInsetBase + Math.round((shelterSeeking + (prefersShelterTarget ? 0.28 : 0)) * 14);
            const shelterPoint = (prefersShelterTarget || shelterSeeking > 0.46)
                ? structureSystem?.getPreferredShelterPointForEntity?.(this, zoneId)
                : null;
            const stronglyPreferShelter = !!shelterPoint && (prefersShelterTarget || shelterSeeking > 0.84);
            const effectivePreferredPoint = socialPreferredPoint || shelterPoint;
            const targetPoint = (stronglyPreferShelter ? shelterPoint : null)
                || gameCore?.findBestButterflyWanderPoint?.(this, zoneId, {
                    padding: targetInset,
                    preferredPoint: effectivePreferredPoint,
                    preferredPointBonus: preferSocialAnchor
                        ? (socialAnchor?.mode === 'protect' ? 0.4 : socialAnchor?.mode === 'imitate' ? 0.34 : 0.36)
                        : (!!shelterPoint ? 0.24 : 0.22),
                    preferredDistanceScale: preferSocialAnchor ? 132 : 180,
                    avoidPoints: socialAvoidPoints,
                    avoidRadius: socialAvoidance >= 0.42 ? 124 : 96,
                    avoidWeight: socialAvoidance >= 0.42 ? 0.42 : 0.3,
                    preferShelter: !!shelterPoint,
                    preferOpenSpace: preferWideOpenSpace,
                    localCrowdRadius: preferWideOpenSpace ? 108 : 84,
                    maxDistanceForBonus: 220
                })
                || shelterPoint
                || gameCore?.getRandomZonePoint?.(zoneId, targetInset)
                || gridManager.isoToScreen(random(3, gridManager.bounds.maxX - 3), random(3, gridManager.bounds.maxY - 3));
            if (directSocialBoardTarget) {
                this.movement.setBoardTarget(
                    directSocialBoardTarget.u,
                    directSocialBoardTarget.v,
                    'meander',
                    1,
                    0.08 + ((behaviorBiases.caution || 0) * 0.08)
                );
            } else if (directSocialGridTarget) {
                this.movement.setTarget(
                    directSocialGridTarget.x,
                    directSocialGridTarget.y,
                    'meander',
                    1,
                    0.08 + ((behaviorBiases.caution || 0) * 0.08)
                );
            } else {
                this.setMovementTargetFromScreen(targetPoint.x, targetPoint.y, 'meander', 1, 0.08 + ((behaviorBiases.caution || 0) * 0.08), { zoneId });
            }
            this.timers.wander.duration = ((random(300, 600) / this.traits.jitteriness) / Math.max(0.75, wanderScale))
                * (crowdPressure > 0.44 ? 0.6 : 1)
                * (preferSocialAnchor ? 0.72 : 1)
                * (socialAvoidance >= 0.36 ? 0.82 : 1);
        }
    }
    
    setPostFeedingDestination() {
        const dropTarget = this.pendingPollenDropTarget || gameCore?.planPollenDropTarget?.(this);
        if (dropTarget?.x && dropTarget?.y) {
            this.setMovementTargetFromScreen(dropTarget.x, dropTarget.y, 'immediate', 8, 0.06, {
                zoneId: dropTarget.currentZoneId || this.getMovementZoneId()
            });
            this.timers.postFeedingDash = this.constants.dashDuration;
            return;
        }
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || gameCore?.getFocusedZoneId?.();
        const targetPoint = gameCore?.findBestButterflyWanderPoint?.(this, zoneId, {
            candidateCount: 12,
            preferOpenSpace: true,
            localCrowdRadius: 90,
            maxDistanceForBonus: 200
        }) || gameCore?.getRandomZonePoint?.(zoneId, 34);
        if (targetPoint) {
            this.setMovementTargetFromScreen(targetPoint.x, targetPoint.y, 'immediate', 8, 0.1, { zoneId });
        } else {
            const clamped = gridManager.clampGridPosToRoamArea(
                this.gridPos.x + cos(random(TWO_PI)) * random(4, 8),
                this.gridPos.y + sin(random(TWO_PI)) * random(4, 8),
                8
            );
            this.movement.setTarget(
                clamped.x,
                clamped.y,
                'immediate',
                8,
                0.1 // Very low wobble for direct movement
            );
        }
        
        this.timers.postFeedingDash = this.constants.dashDuration;
        
        // If the post-feeding destination is too close (butterfly at edge), pick a wander target instead
        if (this.getDistanceToMovementTarget() < 2) { // If destination is less than 2 units away
            this.pickNewWanderTarget(); // Just wander instead
        }
    }

    getCarriedBlockCandidateIds() {
        const candidateIds = new Set();
        const localCarryId = this.blockInteraction?.carryingBlockId || null;
        if (localCarryId) {
            candidateIds.add(localCarryId);
        }

        const indexedCarryIds = objectSystem?.getObjectsByCarrier?.(this.id) || [];
        for (const objectId of indexedCarryIds) {
            if (objectId) {
                candidateIds.add(objectId);
            }
        }

        return candidateIds;
    }

    getCarriedBlock(blocks = []) {
        const candidateBlocks = Array.isArray(blocks) ? blocks : [];
        if (!candidateBlocks.length) {
            return null;
        }

        const candidateIds = this.getCarriedBlockCandidateIds();
        let carriedBlock = candidateBlocks.find(block => candidateIds.has(block?.id)) || null;

        if (!carriedBlock) {
            carriedBlock = candidateBlocks.find(block => block?.carriedById === this.id) || null;
        }

        if (carriedBlock?.id) {
            this.blockInteraction.carryingBlockId = carriedBlock.id;
            const objectState = objectSystem?.getObjectState?.(carriedBlock.id);
            if (objectState?.carriedById !== this.id) {
                objectSystem?.registerObject?.(carriedBlock, { type: 'block' });
            }
            return carriedBlock;
        }

        if (this.blockInteraction?.carryingBlockId) {
            this.blockInteraction.carryingBlockId = null;
        }

        return null;
    }

    updateCarriedBlockPose(block) {
        if (!block) return;
        this.blockInteraction.lastRelativeSize = block.renderWidth / Math.max(1, this.size);
        if (typeof block.syncCarriedPose === 'function') {
            block.syncCarriedPose(this);
            return;
        }
        const anchor = this.physics?.carry?.anchor
            || structureSystem?.getCarryAnchorForEntity?.(this, block)
            || null;
        block.carriedById = this.id;
        block.currentZoneId = this.currentZoneId || block.currentZoneId;
        block.x = anchor?.x ?? (this.x + (block.attachedOffset?.x ?? (this.sex === 'F' ? -7 : 7)));
        block.y = anchor?.y ?? (this.y + (block.attachedOffset?.y ?? -10));
        if (this.isBoardMovementWorld()) {
            const boardPos = this.screenPointToBoardTarget(block.x, block.y, block.currentZoneId || this.getMovementZoneId());
            block.boardPos = { ...boardPos };
            block.gridPos = { x: boardPos.u, y: boardPos.v };
        } else {
            block.gridPos = this.screenPointToLegacyGridTarget(block.x, block.y);
        }
        block.zIndex = (this.zIndex || 0) + (anchor?.zLift ?? 18);
    }

    chooseBlockPlacementTarget(block, blocks = []) {
        const placement = gameCore?.findBlockPlacementTarget?.(this, block, blocks) || null;
        this.blockInteraction.placementTarget = placement;
        this.blockInteraction.lastPlacementMode = placement?.placementMode || 'ground';
        if (placement?.supportBlockId) {
            this.rememberDispersalAnchor(`block:${placement.supportBlockId}`);
        } else if (placement) {
            const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
            const sectorKey = zoneId ? gameCore?.getZoneSectorKey?.(zoneId, placement) : null;
            if (sectorKey) {
                this.rememberDispersalAnchor(`sector:${sectorKey}`);
            }
        }
        if (placement) {
            this.setMovementTargetFromScreen(placement.x, placement.y, 'immediate', 4, 0, {
                zoneId: placement.zoneId || this.getMovementZoneId()
            });
        }
        return placement;
    }

    placeCarriedBlock(block, zoneId) {
        const zoneBlocks = gameCore?.getBlocksInZone?.(zoneId) || [];
        let placement = gameCore?.physicsSystem?.resolveBlockPlacementRequest?.(
            this,
            block,
            this.blockInteraction.placementTarget || this.chooseBlockPlacementTarget(block, zoneBlocks),
            zoneBlocks,
            {
                sceneState: gameCore?.gameState,
                safeDrop: false
            }
        ) || null;
        if (!placement) {
            placement = gameCore?.physicsSystem?.resolveBlockPlacementRequest?.(
                this,
                block,
                null,
                zoneBlocks,
                {
                    sceneState: gameCore?.gameState,
                    safeDrop: true
                }
            ) || null;
        }
        if (!placement) return false;

        const placed = gameCore?.physicsSystem?.applyResolvedBlockPlacement?.(
            block,
            placement,
            this.id,
            gameCore?.gameState
        );
        if (!placed) return false;

        const shadeIntent = placement.shadeIntent || null;
        const createsShade = shadeIntent?.createsShade === true || placement.createsShade === true;
        const shadeProgress = shadeIntent?.shadeProgress || placement.shadeProgress || null;
        const shadeConfig = gameConfig?.entities?.block?.shade?.buildingIntent || {};
        const buildingAssist = this.blockInteraction.buildingAssist || null;
        this.lifeSim.emotions.curiosity = Math.min(1, (this.lifeSim.emotions.curiosity || 0) + 0.028);
        this.lifeSim.emotions.happiness = Math.min(1, (this.lifeSim.emotions.happiness || 0) + 0.018);
        if (createsShade) {
            this.lifeSim.emotions.relief = Math.min(1, (this.lifeSim.emotions.relief || 0) + Number(shadeConfig.reliefReward ?? 0.04));
            this.lifeSim.emotions.significance = Math.min(1, (this.lifeSim.emotions.significance || 0) + Number(shadeConfig.significanceReward ?? 0.035));
        }
        appendLifeMemory(this, 'object', {
            subjectId: block.id,
            valence: createsShade ? 0.32 : 0.24,
            strength: createsShade ? Number(shadeConfig.memoryStrength ?? 0.5) : 0.42,
            tags: [
                'block',
                'shelter-material',
                placement.placementMode || 'placed-block',
                ...(this.blockInteraction.materialSource === 'converted-flower' ? ['converted-flower', 'building-cost'] : []),
                ...(shadeProgress ? ['shade', shadeProgress] : []),
                ...(createsShade && shadeProgress !== 'creates-shade' ? ['creates-shade'] : [])
            ],
            metadata: {
                zoneId,
                relativeSize: this.blockInteraction.lastRelativeSize,
                placementMode: placement.placementMode || 'ground',
                stackIndex: placement.stackIndex ?? 0,
                supportBlockId: placement.supportBlockId || null,
                shadeIntentScore: shadeIntent?.intentScore ?? placement.shadeIntentScore ?? null,
                shadeProgress,
                createsShade,
                shadeIntentSource: shadeIntent?.source || null,
                targetStackHeight: shadeIntent?.targetStackHeight ?? null,
                materialSource: this.blockInteraction.materialSource || block.materialSource?.kind || null,
                sourceFlowerId: block.materialSource?.sourceFlowerId || null,
                assistedRequesterId: buildingAssist?.requesterId || null,
                assistSignalId: buildingAssist?.signalId || null
            }
        });
        if (createsShade || shadeProgress) {
            eventBus?.emit?.('building:shade-progress', {
                butterflyId: this.id,
                blockId: block.id,
                projectId: buildingAssist?.projectId || placement.projectId || null,
                zoneId,
                currentFrame: gameCore?.getCurrentFrame?.() ?? frameCount,
                placementMode: placement.placementMode || 'ground',
                stackIndex: placement.stackIndex ?? 0,
                supportBlockId: placement.supportBlockId || null,
                shadeProgress,
                createsShade,
                shadeIntentScore: shadeIntent?.intentScore ?? placement.shadeIntentScore ?? null
            });
            objectSystem?.recordShadeProjectPlacement?.({
                projectId: buildingAssist?.projectId || placement.projectId || null,
                butterflyId: this.id,
                blockId: block.id,
                supportBlockId: placement.supportBlockId || null,
                zoneId,
                boardPos: placement.boardPos || null,
                constructionPoint: {
                    x: placement.x,
                    y: placement.y,
                    boardPos: placement.boardPos || null
                },
                shadeProgress,
                createsShade,
                shadeIntentScore: shadeIntent?.intentScore ?? placement.shadeIntentScore ?? null
            });
        }
        if (buildingAssist?.requesterId && (createsShade || shadeProgress)) {
            this.recordBuildingAssistFollowThrough(buildingAssist, block, placement, {
                shadeProgress,
                createsShade,
                shadeIntentScore: shadeIntent?.intentScore ?? placement.shadeIntentScore ?? null
            });
        }
        gameCore?.particleSystem?.emitBurst?.(block.x, block.y - 4, [88, 232, 208], 5);

        this.blockInteraction.carryingBlockId = null;
        this.blockInteraction.targetBlockId = null;
        this.blockInteraction.placementTarget = null;
        this.blockInteraction.buildingAssist = null;
        this.blockInteraction.materialSource = null;
        this.blockInteraction.carryFrames = 0;
        const behaviorBiases = this.lifeSim?.derived?.behaviorBiases || {};
        const continuationBias = Math.max(
            behaviorBiases.objectInterest || 0,
            behaviorBiases.shelterSeeking || 0,
            this.lifeSim?.emotions?.curiosity || 0,
            this.lifeSim?.drives?.exploration || 0
        );
        const cooldownMin = continuationBias > 0.72 ? 42 : 96;
        const cooldownMax = continuationBias > 0.72 ? 116 : 188;
        this.blockInteraction.cooldownFrames = Math.floor(random(cooldownMin, cooldownMax));
        this.pickNewWanderTarget();
        return true;
    }

    dropCarriedBlockAtSafePlacement(block, zoneId, zoneBlocks = []) {
        if (!block) return false;
        const safeDrop = gameCore?.physicsSystem?.resolveBlockPlacementRequest?.(
            this,
            block,
            null,
            zoneBlocks,
            {
                sceneState: gameCore?.gameState,
                safeDrop: true
            }
        ) || {
            x: this.x,
            y: this.y + 4,
            stackIndex: 0,
            supportBlockId: null,
            placementMode: 'ground',
            zoneId
        };
        const placed = gameCore?.physicsSystem?.applyResolvedBlockPlacement?.(
            block,
            safeDrop,
            this.id,
            gameCore?.gameState
        );
        if (!placed) return false;
        this.blockInteraction.carryingBlockId = null;
        this.blockInteraction.targetBlockId = null;
        this.blockInteraction.placementTarget = null;
        this.blockInteraction.buildingAssist = null;
        this.blockInteraction.materialSource = null;
        this.blockInteraction.carryFrames = 0;
        this.blockInteraction.cooldownFrames = Math.max(this.blockInteraction.cooldownFrames || 0, 72);
        return true;
    }

    releaseCarriedBlockForSleep(blocks = null) {
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        const allBlocks = Array.isArray(blocks)
            ? blocks
            : (gameCore?.gameState?.blocks || []);
        const zoneBlocks = allBlocks.filter(block => (block?.currentZoneId || null) === zoneId);
        const carriedBlock = this.getCarriedBlock(allBlocks);
        if (!carriedBlock) {
            this.blockInteraction.carryingBlockId = null;
            this.blockInteraction.placementTarget = null;
            this.blockInteraction.carryFrames = 0;
            return true;
        }
        return this.dropCarriedBlockAtSafePlacement(carriedBlock, zoneId, zoneBlocks);
    }

    checkBlockExperimentation(blocks = []) {
        if (!Array.isArray(blocks) || blocks.length === 0) return;
        if (this.pendingPollenDropTarget) return;
        if (this.state !== 'normal' || this.isSpawning || this.zoneTravel) return;
        if (this.movement.targetType === 'goal' || this.movement.targetType === 'pregnant') return;
        const behaviorBiases = this.lifeSim?.derived?.behaviorBiases || {};
        const objectInterest = Math.max(0, Math.min(1, behaviorBiases.objectInterest || 0));
        const shelterSeeking = Math.max(0, Math.min(1, behaviorBiases.shelterSeeking || 0));
        const mlTrace = typeof mlInferenceSystem !== 'undefined' ? mlInferenceSystem.getEntityTrace?.(this.id) : null;
        const mlActionSource = mlTrace?.traces?.actionFamily?.source || null;
        const mlTargetSource = mlTrace?.traces?.targetPreference?.source || null;
        const prefersObjectAction = mlActionSource === 'ml' && mlTrace?.chosenPath?.actionFamily === 'buildOrUseObject';
        const prefersBlockTarget = mlTargetSource === 'ml' && mlTrace?.chosenPath?.targetPreference === 'block';
        const prefersShelterTarget = mlTargetSource === 'ml' && mlTrace?.chosenPath?.targetPreference === 'shelter';

        if (this.blockInteraction.cooldownFrames > 0) {
            this.blockInteraction.cooldownFrames--;
        }

        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        const zoneBlocks = blocks.filter(block => block?.currentZoneId === zoneId);
        if (!zoneBlocks.length) {
            this.blockInteraction.targetBlockId = null;
            this.blockInteraction.carryingBlockId = null;
            this.blockInteraction.placementTarget = null;
            this.blockInteraction.buildingAssist = null;
            this.blockInteraction.materialSource = null;
            return;
        }

        const carriedBlock = this.getCarriedBlock(blocks);
        if (carriedBlock) {
            this.blockInteraction.carryFrames = (this.blockInteraction.carryFrames || 0) + 1;
            this.updateCarriedBlockPose(carriedBlock);
            let placement = this.blockInteraction.placementTarget || this.chooseBlockPlacementTarget(carriedBlock, zoneBlocks);
            if (placement && !structureSystem?.validatePlacementTargetForBlock?.(this, carriedBlock, placement, zoneBlocks)) {
                placement = this.chooseBlockPlacementTarget(carriedBlock, zoneBlocks);
            }
            if (!placement) {
                this.blockInteraction.cooldownFrames = 96;
                this.dropCarriedBlockAtSafePlacement(carriedBlock, zoneId, zoneBlocks);
                return;
            }
            const distanceToPlacement = Math.hypot(placement.x - this.x, placement.y - this.y);
            if (distanceToPlacement > 16) {
                this.setMovementTargetFromScreen(placement.x, placement.y, 'immediate', 5, 0, {
                    zoneId: placement.zoneId || this.getMovementZoneId()
                });
                if (this.blockInteraction.carryFrames < 42) return;
            }
            this.placeCarriedBlock(carriedBlock, zoneId);
            return;
        }

        this.blockInteraction.carryFrames = 0;

        let targetBlock = null;
        if (this.blockInteraction.targetBlockId) {
            targetBlock = zoneBlocks.find(block => block.id === this.blockInteraction.targetBlockId) || null;
            if (targetBlock?.carriedById && targetBlock.carriedById !== this.id) {
                this.blockInteraction.targetBlockId = null;
                this.blockInteraction.buildingAssist = null;
                this.blockInteraction.materialSource = null;
                this.blockInteraction.cooldownFrames = 120;
                targetBlock = null;
            }
        }

        if (!targetBlock && this.blockInteraction.cooldownFrames === 0) {
            const curiosity = this.lifeSim?.emotions?.curiosity || 0;
            const exploration = this.lifeSim?.drives?.exploration || 0;
            const buildingHelp = this.getRecentBuildingHelpSignal();
            const helpBlock = buildingHelp
                ? this.findBuildingHelpBlockTarget(zoneBlocks, buildingHelp)
                : null;
            if (helpBlock) {
                targetBlock = helpBlock;
                this.blockInteraction.targetBlockId = targetBlock.id;
                this.blockInteraction.buildingAssist = {
                    requesterId: buildingHelp.sourceId,
                    signalId: buildingHelp.signalId,
                    requestedAtFrame: buildingHelp.metadata?.requestedAtFrame ?? null,
                    supportBlockId: buildingHelp.metadata?.supportBlockId || null,
                    projectId: buildingHelp.metadata?.projectId || null,
                    shadeProgress: buildingHelp.metadata?.shadeProgress || null,
                    shadeIntentScore: buildingHelp.metadata?.shadeIntentScore ?? null
                };
                this.rememberDispersalAnchor(`block:${targetBlock.id}`);
                this.setMovementTargetFromScreen(targetBlock.x, targetBlock.y, 'immediate', 5, 0, {
                    zoneId: targetBlock.currentZoneId || this.getMovementZoneId()
                });
                eventBus?.emit?.('building:helper-accepted', {
                    helperId: this.id,
                    requesterId: buildingHelp.sourceId,
                    signalId: buildingHelp.signalId,
                    blockId: targetBlock.id,
                    zoneId,
                    currentFrame: gameCore?.getCurrentFrame?.() ?? frameCount
                });
            }
        }

        if (!targetBlock && this.blockInteraction.cooldownFrames === 0) {
            const curiosity = this.lifeSim?.emotions?.curiosity || 0;
            const exploration = this.lifeSim?.drives?.exploration || 0;
            const nearbyBlock = gameCore?.chooseBestBlockForButterfly?.(
                this,
                zoneBlocks.filter(block => !block?.carriedById),
                {
                    preferShelter: prefersShelterTarget || shelterSeeking > 0.46
                }
            ) || null;
            const nearbyDistance = nearbyBlock ? Math.hypot(nearbyBlock.x - this.x, nearbyBlock.y - this.y) : Infinity;
            const nearbyOpportunity = !!nearbyBlock && nearbyDistance < 22 && (
                objectInterest > 0.14
                || curiosity > 0.14
                || shelterSeeking > 0.16
                || prefersObjectAction
                || prefersBlockTarget
                || prefersShelterTarget
            );
            const isStronglyCurious = curiosity > 0.28
                || exploration > 0.28
                || objectInterest > 0.28
                || prefersObjectAction
                || prefersBlockTarget
                || prefersShelterTarget;
            const interestChance = 0.0064
                + (curiosity * 0.011)
                + (exploration * 0.007)
                + (objectInterest * 0.014)
                + (shelterSeeking * 0.006)
                + (prefersObjectAction ? 0.012 : 0)
                + (prefersBlockTarget ? 0.009 : 0)
                + (prefersShelterTarget ? 0.006 : 0);
            if (nearbyBlock && (nearbyOpportunity || (isStronglyCurious && nearbyDistance < 92) || random() < interestChance)) {
                targetBlock = nearbyBlock;
                this.blockInteraction.targetBlockId = targetBlock.id;
                this.rememberDispersalAnchor(`block:${targetBlock.id}`);
                this.setMovementTargetFromScreen(targetBlock.x, targetBlock.y, 'immediate', 5, 0, {
                    zoneId: targetBlock.currentZoneId || this.getMovementZoneId()
                });
            }
        }

        if (!targetBlock) return;

        const distance = Math.hypot(targetBlock.x - this.x, targetBlock.y - this.y);
        if (distance > 18) {
            this.setMovementTargetFromScreen(targetBlock.x, targetBlock.y, 'immediate', 5, 0, {
                zoneId: targetBlock.currentZoneId || this.getMovementZoneId()
            });
            return;
        }
        if (!targetBlock.canBeMovedBy?.(this)) {
            this.blockInteraction.targetBlockId = null;
            this.blockInteraction.buildingAssist = null;
            this.blockInteraction.materialSource = null;
            this.blockInteraction.cooldownFrames = 96;
            return;
        }

        const pickedUp = objectSystem?.pickupObject?.(targetBlock.id, this.id);
        if (!pickedUp) {
            this.blockInteraction.targetBlockId = null;
            this.blockInteraction.buildingAssist = null;
            this.blockInteraction.materialSource = null;
            this.blockInteraction.cooldownFrames = 72;
            return;
        }
        targetBlock.pickupBy?.(this);
        this.blockInteraction.carryingBlockId = targetBlock.id;
        this.blockInteraction.targetBlockId = null;
        this.blockInteraction.carryFrames = 0;
        this.chooseBlockPlacementTarget(targetBlock, zoneBlocks);
        this.lifeSim.emotions.curiosity = Math.min(1, (this.lifeSim.emotions.curiosity || 0) + 0.02);
        this.lifeSim.objectAwareness.shelterConfidence = Math.min(1, (this.lifeSim.objectAwareness?.shelterConfidence || 0) + 0.05);
        appendLifeMemory(this, 'object', {
            subjectId: targetBlock.id,
            valence: 0.16,
            strength: 0.3,
            tags: ['block', 'shelter-material', 'carried-object'],
            metadata: {
                zoneId,
                relativeSize: targetBlock.renderWidth / Math.max(1, this.size)
            }
        });
        gameCore?.particleSystem?.emitBurst?.(targetBlock.x, targetBlock.y - 4, [60, 220, 230], 4);
    }

    getRecentBuildingHelpSignal() {
        const config = gameConfig?.entities?.block?.shade?.buildingCooperation || {};
        if (config.enabled === false) return null;
        const responseWindowFrames = Math.max(1, Math.round(Number(config.responseWindowFrames ?? 720)));
        const currentFrame = gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0);
        const recent = this.lifeSim?.communication?.recentReceived || [];
        return recent.find(entry => {
            const metadata = entry?.metadata || {};
            if (metadata.reason !== 'shade-building-help') return false;
            if (!entry?.sourceId || entry.sourceId === this.id) return false;
            if (metadata.requestedAtFrame == null) return true;
            return (currentFrame - metadata.requestedAtFrame) <= responseWindowFrames;
        }) || null;
    }

    findBuildingHelpBlockTarget(zoneBlocks = [], helpSignal = null) {
        const metadata = helpSignal?.metadata || {};
        const config = gameConfig?.entities?.block?.shade?.buildingCooperation || {};
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        const constructionPoint = metadata.constructionPoint || {};
        const ignoredIds = new Set([
            metadata.carriedBlockId,
            metadata.supportBlockId
        ].filter(Boolean));
        const maxDistanceUnits = Number(config.maxHelperBlockDistanceUnits ?? 5);
        let bestBlock = null;
        let bestScore = -Infinity;
        for (const block of zoneBlocks || []) {
            if (!block?.id || ignoredIds.has(block.id) || block.carriedById) continue;
            if ((block.currentZoneId || null) !== zoneId) continue;
            if (block.canBeMovedBy?.(this) === false) continue;
            const helperDistanceUnits = communicationSystem?.getBoardDistanceBetween?.(this, block, zoneId)
                ?? (Math.hypot((block.x || 0) - (this.x || 0), (block.y || 0) - (this.y || 0)) / 20);
            if (helperDistanceUnits > maxDistanceUnits) continue;
            const buildDistance = Number.isFinite(constructionPoint.x) && Number.isFinite(constructionPoint.y)
                ? Math.hypot((block.x || 0) - constructionPoint.x, (block.y || 0) - constructionPoint.y)
                : 0;
            const score = Math.max(0, 1 - (helperDistanceUnits / Math.max(1, maxDistanceUnits)))
                + Math.max(0, 0.42 - (buildDistance / 180));
            if (score > bestScore) {
                bestScore = score;
                bestBlock = block;
            }
        }
        return bestBlock;
    }

    recordBuildingAssistFollowThrough(buildingAssist, block, placement, outcome = {}) {
        if (!buildingAssist?.requesterId || !this.id) return null;
        const requester = communicationSystem?.getEntityById?.(buildingAssist.requesterId)
            || (gameCore?.gameState?.butterflies || []).find(entry => entry?.id === buildingAssist.requesterId)
            || null;
        if (!requester?.id) return null;
        const config = gameConfig?.entities?.block?.shade?.buildingCooperation || {};
        const updatedAtSeconds = lifeSimSystem?.simulationClockSeconds ?? communicationSystem?.simulationClockSeconds ?? null;
        const helperEdge = typeof adjustLifeSocialEdge === 'function'
            ? adjustLifeSocialEdge(this, requester.id, {
                trust: Number(config.helperEdgeTrust ?? 0.016),
                comfort: Number(config.helperEdgeComfort ?? 0.018),
                admiration: Number(config.helperEdgeAdmiration ?? 0.01)
            }, {
                updatedAtSeconds,
                tag: 'shade-building-cooperation'
            })
            : ensureLifeSocialEdge?.(this, requester.id);
        const requesterEdge = typeof adjustLifeSocialEdge === 'function'
            ? adjustLifeSocialEdge(requester, this.id, {
                trust: Number(config.requesterEdgeTrust ?? 0.012),
                comfort: Number(config.requesterEdgeComfort ?? 0.014),
                admiration: Number(config.requesterEdgeAdmiration ?? 0.006)
            }, {
                updatedAtSeconds,
                tag: 'shade-building-cooperation'
            })
            : ensureLifeSocialEdge?.(requester, this.id);
        for (const edge of [helperEdge, requesterEdge]) {
            if (!edge) continue;
            edge.followThroughScore = Math.min(1, (edge.followThroughScore || 0) + Number(config.followThroughBoost ?? 0.04));
            edge.recentMutualAttention = Math.min(1, (edge.recentMutualAttention || 0) + Number(config.mutualAttentionBoost ?? 0.05));
            edge.recentWarmth = Math.min(1, (edge.recentWarmth || 0) + Number(config.warmthBoost ?? 0.04));
        }
        eventBus?.emit?.('building:cooperation-followthrough', {
            helperId: this.id,
            requesterId: requester.id,
            blockId: block?.id || null,
            projectId: buildingAssist.projectId || null,
            zoneId: placement?.zoneId || this.currentZoneId || null,
            currentFrame: gameCore?.getCurrentFrame?.() ?? frameCount,
            placementMode: placement?.placementMode || null,
            stackIndex: placement?.stackIndex ?? null,
            shadeProgress: outcome.shadeProgress || placement?.shadeProgress || null,
            createsShade: outcome.createsShade === true || placement?.createsShade === true,
            shadeIntentScore: outcome.shadeIntentScore ?? placement?.shadeIntentScore ?? null
        });
        objectSystem?.recordShadeProjectFollowthrough?.({
            projectId: buildingAssist.projectId || null,
            helperId: this.id,
            requesterId: requester.id,
            blockId: block?.id || null,
            supportBlockId: placement?.supportBlockId || buildingAssist.supportBlockId || null,
            zoneId: placement?.zoneId || this.currentZoneId || null,
            boardPos: placement?.boardPos || null,
            constructionPoint: {
                x: placement?.x,
                y: placement?.y,
                boardPos: placement?.boardPos || null
            },
            shadeProgress: outcome.shadeProgress || placement?.shadeProgress || null,
            createsShade: outcome.createsShade === true || placement?.createsShade === true,
            shadeIntentScore: outcome.shadeIntentScore ?? placement?.shadeIntentScore ?? null
        });
        return { helperEdge, requesterEdge };
    }

    getFlowerToBlockConfig() {
        return gameConfig?.entities?.flower?.flowerToBlock || {};
    }

    getFlowerToBlockConversionScore(flowers = [], blocks = []) {
        const config = this.getFlowerToBlockConfig();
        const behaviorBiases = this.lifeSim?.derived?.behaviorBiases || {};
        const objectInterest = Math.max(0, Math.min(1, behaviorBiases.objectInterest || 0));
        const shelterSeeking = Math.max(0, Math.min(1, behaviorBiases.shelterSeeking || 0));
        const rest = Math.max(0, Math.min(1, this.lifeSim?.drives?.rest || 0));
        const exhaustion = Math.max(0, Math.min(1, this.lifeSim?.emotions?.exhaustion || 0));
        const exploration = Math.max(0, Math.min(1, this.lifeSim?.drives?.exploration || 0));
        const feedUrgency = Math.max(0, Math.min(1, behaviorBiases.feedUrgency || 0));
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        const liveFlowers = (flowers || []).filter(flower => this.isFlowerAvailable(flower) && (flower.currentZoneId || null) === zoneId);
        const zoneBlocks = (blocks || []).filter(block => block?.currentZoneId === zoneId && !block.carriedById);
        const usefulBlockTarget = Math.max(0, Math.round(Number(config.minUsefulBlocksPerZone ?? 4)));
        const materialNeed = usefulBlockTarget > 0
            ? Math.max(0, (usefulBlockTarget - zoneBlocks.length) / usefulBlockTarget)
            : 0;
        const lowFlowerProtection = liveFlowers.length <= 1 ? 0.2 : 0;
        return Math.max(0, Math.min(1,
            shelterSeeking * 0.34
            + objectInterest * 0.24
            + rest * 0.16
            + exhaustion * 0.16
            + exploration * 0.08
            + materialNeed * 0.2
            - feedUrgency * 0.22
            - lowFlowerProtection
        ));
    }

    findFlowerToBlockTarget(flowers = [], blocks = []) {
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        const candidates = (flowers || []).filter(flower =>
            this.isFlowerAvailable(flower)
            && (flower.currentZoneId || null) === zoneId
            && !flower.currentFeeder
        );
        if (!candidates.length || !gameCore?.canSpawnBlocksInZone?.(zoneId)) return null;
        const conversionScore = this.getFlowerToBlockConversionScore(flowers, blocks);
        const config = this.getFlowerToBlockConfig();
        const minScore = Math.max(0, Number(config.minConversionScore ?? 0.55));
        if (conversionScore < minScore) return null;

        return candidates
            .slice()
            .sort((left, right) => {
                const scoreFlower = (flower) => {
                    const distance = Math.hypot((flower.x || 0) - (this.x || 0), (flower.y || 0) - (this.y || 0));
                    const recentPenalty = gameCore?.getEntityRecentAnchorPenalty?.(this, `flower-to-block:${flower.id}`) || 0;
                    return conversionScore
                        + Math.max(0, 0.5 - (distance / 180))
                        - recentPenalty * 0.35;
                };
                return scoreFlower(right) - scoreFlower(left);
            })[0] || null;
    }

    checkFlowerToBlockConversion(flowers = [], blocks = []) {
        const config = this.getFlowerToBlockConfig();
        if (config.enabled === false) return false;
        if (this.state !== 'normal' || this.isSpawning || this.zoneTravel || this.pendingPollenDropTarget) return false;
        if (this.blockInteraction?.carryingBlockId || this.getCarriedBlock(blocks)) return false;
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        if (!zoneId || !gameCore?.canSpawnBlocksInZone?.(zoneId)) return false;

        if (this.blockInteraction.cooldownFrames > 0) {
            return false;
        }

        let targetFlower = this.targetFlowerToBlockId
            ? (flowers || []).find(flower => flower?.id === this.targetFlowerToBlockId) || null
            : null;
        if (!targetFlower || !this.isFlowerAvailable(targetFlower) || targetFlower.currentFeeder) {
            targetFlower = this.findFlowerToBlockTarget(flowers, blocks);
            this.targetFlowerToBlockId = targetFlower?.id || null;
        }
        if (!targetFlower) return false;

        this.targetFlower = null;
        this.rememberDispersalAnchor(`flower-to-block:${targetFlower.id}`);
        const distance = Math.hypot((targetFlower.x || 0) - (this.x || 0), (targetFlower.y || 0) - (this.y || 0));
        const interactionRadius = Math.max(8, Number(config.interactionRadius ?? 22));
        if (distance > interactionRadius) {
            this.setMovementTargetFromScreen(targetFlower.x, targetFlower.y, 'flower-to-block', 4, 0, {
                zoneId: targetFlower.currentZoneId || zoneId
            });
            return true;
        }

        const beforeHappiness = this.happiness;
        const result = gameCore?.convertFlowerToBlockMaterial?.(targetFlower, this, {
            source: 'butterfly-flower-to-block'
        });
        this.targetFlowerToBlockId = null;
        this.movement.clearTarget('flower-to-block');
        if (!result?.converted || !result.block) {
            this.blockInteraction.cooldownFrames = Math.max(120, Math.round(Number(config.cooldownFrames ?? 1200) * 0.35));
            this.pickNewWanderTarget();
            return true;
        }

        const block = result.block;
        if (config.autoCarry !== false && objectSystem?.pickupObject?.(block.id, this.id) && block.pickupBy?.(this)) {
            this.blockInteraction.carryingBlockId = block.id;
            this.blockInteraction.targetBlockId = null;
            this.blockInteraction.placementTarget = null;
            this.blockInteraction.materialSource = 'converted-flower';
            this.blockInteraction.carryFrames = 0;
            this.chooseBlockPlacementTarget(block, gameCore?.getBlocksInZone?.(zoneId) || blocks || []);
        }
        this.happiness = beforeHappiness;
        this.blockInteraction.cooldownFrames = Math.max(this.blockInteraction.cooldownFrames || 0, Math.round(Number(config.cooldownFrames ?? 1200)));
        eventBus?.emit?.('building:flower-to-block-accepted', {
            butterflyId: this.id,
            blockId: block.id,
            sourceFlowerId: result.sourceFlowerId || null,
            zoneId,
            currentFrame: gameCore?.getCurrentFrame?.() ?? frameCount,
            autoCarry: config.autoCarry !== false
        });
        return true;
    }
    
    checkFlowerSeeking(flowers) {
        if (this.lifeSim?.objectAwareness?.currentAffordance === 'clean' && this.checkCleanupSeeking(flowers)) {
            return;
        }
        const availableFlowers = flowers.filter(f => this.isFlowerAvailable(f));
        const feedUrgency = this.lifeSim?.derived?.behaviorBiases?.feedUrgency || 0;
        const mlTrace = typeof mlInferenceSystem !== 'undefined' ? mlInferenceSystem.getEntityTrace?.(this.id) : null;
        const mlActionSource = mlTrace?.traces?.actionFamily?.source || null;
        const mlTargetSource = mlTrace?.traces?.targetPreference?.source || null;
        const prefersFeedAction = mlActionSource === 'ml' && mlTrace?.chosenPath?.actionFamily === 'feed';
        const prefersAvoidAction = mlActionSource === 'ml' && mlTrace?.chosenPath?.actionFamily === 'avoid';
        const prefersFlowerTarget = mlTargetSource === 'ml' && mlTrace?.chosenPath?.targetPreference === 'flower';
        const lowFlowerPressure = availableFlowers.length <= 2;
        const shouldSeekFood = this.happiness < this.baselineHappiness ||
            feedUrgency > 0.48 ||
            (lowFlowerPressure && this.happiness < (this.baselineHappiness + 18)) ||
            prefersFeedAction ||
            prefersFlowerTarget;

        if ((!shouldSeekFood && !prefersFlowerTarget) || this.timers.postFeedingCooldown > 0) {
            this.movement.clearTarget('goal');
            this.targetFlower = null;
            return;
        }

        if (prefersAvoidAction && this.happiness >= this.baselineHappiness && !prefersFlowerTarget) {
            this.movement.clearTarget('goal');
            this.targetFlower = null;
            return;
        }
        
        // Validate current goal
        if (this.movement.targetType === 'goal') {
            const currentFlower = this.findFlowerAtTarget(flowers);
            if (!currentFlower || !this.isFlowerAvailable(currentFlower)) {
                this.movement.clearTarget('goal');
                this.targetFlower = null;
            } else {
                const currentFlowerCrowd = gameCore?.countNearbyButterflies?.(
                    this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null,
                    currentFlower,
                    62,
                    this.id
                ) || 0;
                const currentTargeters = gameCore?.countButterfliesTargetingFlower?.(
                    this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null,
                    currentFlower.id,
                    this.id
                ) || 0;
                if (availableFlowers.length > 2 && (currentFlowerCrowd >= 4 || currentTargeters >= 2)) {
                    this.movement.clearTarget('goal');
                    this.targetFlower = null;
                } else {
                    this.targetFlower = currentFlower;
                    return; // Keep current goal
                }
            }
        }

        if (this.movement.targetType === 'goal') {
            this.movement.clearTarget('goal');
            this.targetFlower = null;
        }
        
        // Find new flower
        if (availableFlowers.length > 0) {
            const targetFlower = gameCore?.chooseBestFlowerForButterfly?.(this, availableFlowers, {
                feedUrgency,
                prefersFlowerTarget
            }) || availableFlowers
                .slice()
                .sort((left, right) => {
                    const leftDistance = Math.hypot((left.x || 0) - this.x, (left.y || 0) - this.y);
                    const rightDistance = Math.hypot((right.x || 0) - this.x, (right.y || 0) - this.y);
                    const leftBias = (feedUrgency * 32) + (prefersFlowerTarget ? 18 : 0);
                    return (leftDistance - leftBias) - rightDistance;
            })[0] || random(availableFlowers);
            this.rememberDispersalAnchor(`flower:${targetFlower.id}`);
            this.targetFlower = targetFlower;
            this.setMovementTargetFromScreen(targetFlower.x, targetFlower.y, 'goal', 3, 0, {
                zoneId: targetFlower.currentZoneId || this.getMovementZoneId()
            });
        }
    }

    getDirtPileCleanupDrive() {
        const selfMaintenance = this.lifeSim?.drives?.selfMaintenance
            ?? this.lifeSim?.derived?.driveTargets?.selfMaintenance
            ?? 0;
        const threshold = Math.max(0, gameConfig?.entities?.flower?.pileCleanupSelfMaintenance || 0.56);
        return { selfMaintenance, threshold };
    }

    getDirtPilesInCurrentZone(flowers = []) {
        const zoneId = this.getMovementZoneId();
        return (flowers || []).filter(flower =>
            flower?.lifecycleKind === 'dirt-pile'
            && (!zoneId || !flower.currentZoneId || flower.currentZoneId === zoneId)
        );
    }

    findNearestCleanupPile(flowers = []) {
        const current = this.ensureBoardPos();
        if (!current) return null;
        const maxUnits = Math.max(1, Number(gameConfig?.cognition?.affordances?.cleanupNavigationMaxUnits || 18));
        let best = null;
        let bestScore = Infinity;
        for (const pile of this.getDirtPilesInCurrentZone(flowers)) {
            const pileBoard = this.getEntityBoardPos(pile, current.zoneId);
            if (!pileBoard) continue;
            const distance = Math.hypot((pileBoard.u || 0) - current.u, (pileBoard.v || 0) - current.v);
            if (distance > maxUnits) continue;
            const targeters = (gameCore?.gameState?.butterflies || []).filter(other =>
                other?.id
                && other.id !== this.id
                && other.targetCleanupPile?.id === pile.id
            ).length;
            const score = distance + (targeters * 2.5);
            if (score < bestScore) {
                best = { pile, boardPos: pileBoard, distance, targeters };
                bestScore = score;
            }
        }
        return best;
    }

    findDirtPileAtTarget(flowers = []) {
        if (!this.movement?.target) return null;
        const targetBoard = this.getMovementTargetBoardPos();
        if (!targetBoard) return null;
        for (const pile of this.getDirtPilesInCurrentZone(flowers)) {
            const pileBoard = this.getEntityBoardPos(pile, targetBoard.zoneId);
            if (!pileBoard) continue;
            const distance = Math.hypot((pileBoard.u || 0) - targetBoard.u, (pileBoard.v || 0) - targetBoard.v);
            if (distance <= 0.75) return pile;
        }
        return null;
    }

    checkCleanupSeeking(flowers = []) {
        if (gameConfig?.cognition?.affordances?.cleanupNavigationBias === false) {
            if (this.movement.targetType === 'cleanup') this.movement.clearTarget('cleanup');
            this.targetCleanupPile = null;
            return false;
        }
        if (this.state !== 'normal' || this.zoneTravel || this.pendingPollenDropTarget || this.blockInteraction?.carryingBlockId) {
            if (this.movement.targetType === 'cleanup') this.movement.clearTarget('cleanup');
            this.targetCleanupPile = null;
            return false;
        }
        const { selfMaintenance, threshold } = this.getDirtPileCleanupDrive();
        if (selfMaintenance < threshold) {
            if (this.movement.targetType === 'cleanup') this.movement.clearTarget('cleanup');
            this.targetCleanupPile = null;
            return false;
        }
        const zonePiles = this.getDirtPilesInCurrentZone(flowers);
        const affordanceWantsClean = this.lifeSim?.objectAwareness?.currentAffordance === 'clean';
        const directCleanupPressure = zonePiles.length > 0 && selfMaintenance >= threshold + 0.04;
        if (!affordanceWantsClean && !directCleanupPressure) {
            if (this.movement.targetType === 'cleanup') this.movement.clearTarget('cleanup');
            this.targetCleanupPile = null;
            return false;
        }
        if (this.targetCleanupPile && !(flowers || []).includes(this.targetCleanupPile)) {
            this.targetCleanupPile = null;
            if (this.movement.targetType === 'cleanup') this.movement.clearTarget('cleanup');
        }
        if (this.movement.targetType === 'cleanup' && this.targetCleanupPile) {
            return true;
        }
        const candidate = this.findNearestCleanupPile(zonePiles);
        if (!candidate?.pile || !candidate.boardPos) {
            if (this.movement.targetType === 'cleanup') this.movement.clearTarget('cleanup');
            this.targetCleanupPile = null;
            return false;
        }
        this.targetCleanupPile = candidate.pile;
        this.rememberDispersalAnchor(`cleanup:${candidate.pile.id}`);
        const priority = Number(gameConfig?.cognition?.affordances?.cleanupNavigationPriority || 4);
        this.movement.setBoardTarget(candidate.boardPos.u, candidate.boardPos.v, 'cleanup', priority, 0);
        return true;
    }
    
    findFlowerAtTarget(flowers) {
        if (!this.movement.target) return null;
        if (this.isBoardMovementWorld()) {
            const targetBoard = this.getMovementTargetBoardPos();
            if (!targetBoard) return null;
            for (let flower of flowers) {
                const flowerBoard = this.getEntityBoardPos(flower, targetBoard.zoneId);
                if (!flowerBoard) continue;
                const dx = flowerBoard.u - targetBoard.u;
                const dy = flowerBoard.v - targetBoard.v;
                if (dx*dx + dy*dy < 1) {
                    return flower;
                }
            }
            return null;
        }
        
        for (let flower of flowers) {
            const flowerGrid = this.screenPointToLegacyGridTarget(flower.x, flower.y);
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
        const lifecycleAllowed = typeof flower.canAcceptButterfly === 'function'
            ? flower.canAcceptButterfly(this)
            : true;
        return !onCooldown && !beingFedFrom && lifecycleAllowed;
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
        
        // Limit cooldowns size to prevent memory buildup (keep only 10 most recent)
        if (this.feeding.cooldowns.size > 10) {
            const entries = Array.from(this.feeding.cooldowns.entries());
            this.feeding.cooldowns.clear();
            // Keep the 10 most recent (highest cooldown values)
            entries.sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([id, time]) => {
                this.feeding.cooldowns.set(id, time);
            });
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
        
        const healingReceivedBonus = this.getStatusStrength('healing_received_bonus');
        if (healingReceivedBonus > 0) {
            rate *= 1 + healingReceivedBonus;
        }
        
        return rate;
    }
    
    endFeeding(particleSystem) {
        // Update combo system
        if (typeof gameCore !== 'undefined' && gameCore.gameState) {
            const now = this.getDecisionFrame();
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
        if (this.getSpecialAbility() === 'cascade' && this.feeding.targetFlower) {
            const butterflies = gameCore ? gameCore.gameState.butterflies : [];
            this.createTrustCascade(butterflies);
        }
        
        if (this.feeding.targetFlower && typeof this.feeding.targetFlower.afterButterflyFeed === 'function') {
            this.feeding.targetFlower.afterButterflyFeed(this);
        }

        if (this.feeding.targetFlower?.id) {
            objectSystem?.recordInteraction?.(this.feeding.targetFlower.id, 'fed from', this.id, {
                flowerType: this.feeding.targetFlower.flowerType || null,
                zoneId: this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null
            });
        }
        
        // Emit feeding event
        eventBus.emit(GameEvents.BUTTERFLY_VISITED_FLOWER, {
            butterfly: this,
            flower: this.feeding.targetFlower
        });

        if (typeof gameCore !== 'undefined') {
            gameCore.grantPollenCharges?.(this, this.feeding.targetFlower, {
                reason: 'fed-from-flower'
            });
            gameCore.planPollenDropTarget?.(this);
        }
        
        // Reset engagement timer on successful feeding (only if fewer than 4 butterflies)
        const butterflyCount = gameCore?.gameState?.butterflies?.length || 0;
        this.resetEngagement(butterflyCount);

        if (typeof gameCore !== 'undefined' && gameCore.gameState) {
            progressionManager.save(gameCore.gameState);
        }
    }
    
    // === CURSOR INTERACTION SYSTEM ===
    handleCursorInteraction(cursorVelocity, cursorX, cursorY, particleSystem, gameState) {
        const dx = this.x - cursorX;
        const dy = this.y - cursorY;
        const distToCursorSq = dx*dx + dy*dy;

        const trustRadius = this.cursor.interestRadius * 1.45;
        if (distToCursorSq <= trustRadius * trustRadius) {
            const distToCursor = Math.sqrt(distToCursorSq);
            this.evaluateCursorPresence(cursorVelocity, cursorX, cursorY, distToCursor, particleSystem);
        } else {
            if (!this.cursor.calmedByCursor && this.cursor.currentPatience > 0) {
                const patienceLoss = this.personalityType === 'golden' ? 0.14 : 0.3;
                this.cursor.currentPatience = Math.max(0, this.cursor.currentPatience - patienceLoss);
                if (this.cursor.currentPatience === 0) {
                    this.cursor.trustDisplayTriggered = false;
                }
            }
        }
    }
    
    canInteractWithCursor(butterflies) {
        // Golden butterflies always have priority
        if (this.personalityType === 'golden') {
            // Check if another golden butterfly is already following
            for (let butterfly of butterflies) {
                if (butterfly !== this && butterfly.state === 'following' && butterfly.personalityType === 'golden') {
                    return false;
                }
            }
            return true; // Golden always wins over non-golden
        }
        
        // If another butterfly is already following, respect that
        for (let butterfly of butterflies) {
            if (butterfly !== this && butterfly.state === 'following') {
                return false;
            }
        }
        
        // Non-golden butterflies cannot interact if a golden butterfly is building patience
        for (let butterfly of butterflies) {
            if (butterfly !== this && butterfly.personalityType === 'golden' && butterfly.cursor.currentPatience > 0) {
                return false; // Golden butterfly takes priority
            }
        }
        
        // For butterflies building patience, use distance-based priority
        const cursorX = gameCore?.gameState?.adjustedMouseX || 0;
        const cursorY = gameCore?.gameState?.adjustedMouseY || 0;
        const myDistance = Math.hypot(this.x - cursorX, this.y - cursorY);
        
        for (let butterfly of butterflies) {
            if (butterfly !== this && butterfly.cursor.currentPatience > 0) {
                const theirDistance = Math.hypot(butterfly.x - cursorX, butterfly.y - cursorY);
                
                // Distance threshold - if they're significantly closer, they win
                const distanceAdvantage = 20; // pixels
                if (theirDistance < myDistance - distanceAdvantage) {
                    // Log when distance priority kicks in (only occasionally to avoid spam)
                    if (frameCount % 60 === 0) {
                        console.log(`🦋 ${butterfly.personalityType} (${theirDistance.toFixed(0)}px) has priority over ${this.personalityType} (${myDistance.toFixed(0)}px)`);
                    }
                    return false;
                }
                
                // If distances are similar, use patience as tiebreaker
                if (Math.abs(theirDistance - myDistance) <= distanceAdvantage) {
                    // Add small personality-based modifier to prevent friendly butterflies always winning
                    const myPriority = this.cursor.currentPatience + (this.traits.trustPropensity * 0.1);
                    const theirPriority = butterfly.cursor.currentPatience + (butterfly.traits.trustPropensity * 0.1);
                    
                    if (theirPriority > myPriority) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    evaluateCursorPresence(cursorVelocity, cursorX, cursorY, distance, particleSystem) {
        let cursorState = 'neutral';

        const riskProfile = this.getDecisionRiskProfile();
        const trustRadius = this.cursor.interestRadius * 1.45 * (riskProfile.trustRadiusMultiplier || 1);
        const clapFearPenalty = this.cursor.clapFear * 1.25;
        const scareThreshold = Math.max(
            1.4,
            (this.constants.scareThreshold + 1.25 - clapFearPenalty) * (riskProfile.scareThresholdMultiplier || 1)
        );
        const fleeBiasTriggered = riskProfile.label === 'flee'
            && distance < this.constants.scareRadius * 0.95
            && (
                cursorVelocity > scareThreshold * 0.72
                || this.cursor.clapFear > 0.22
                || (this.lifeSim?.emotions?.threat || 0) > 0.72
            );

        if ((distance < this.constants.scareRadius * (riskProfile.scareRadiusMultiplier || 0.72) && cursorVelocity > scareThreshold && !this.cursor.calmedByCursor)
            || fleeBiasTriggered) {
            cursorState = 'scaring';
        } else if (
            !this.cursor.calmedByCursor
            && cursorVelocity < (riskProfile.maxTrustVelocity || 0.9)
            && distance < trustRadius
            && (riskProfile.patienceGain || 0) > 0.2
        ) {
            cursorState = 'attracting';
        }
        
        switch (cursorState) {
            case 'scaring':
                this.resetCursorInteraction({ startled: true });
                break;
            case 'attracting':
                this.buildCursorTrust(cursorX, cursorY, particleSystem);
                break;
            case 'neutral':
                if (!this.cursor.calmedByCursor && this.cursor.currentPatience > 0) {
                    const patienceLoss = (this.personalityType === 'golden' ? 0.14 : 0.32) * (riskProfile.patienceLossMultiplier || 1);
                    this.cursor.currentPatience = Math.max(0, this.cursor.currentPatience - patienceLoss);
                    if (this.cursor.currentPatience < this.cursor.patienceRequired * 0.65) {
                        this.cursor.trustDisplayTriggered = false;
                    }
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
        if (this.cursor.trustRewardCooldownFrames > 0 || this.cursor.calmedByCursor) {
            return;
        }
        const riskProfile = this.getDecisionRiskProfile();
        if (riskProfile.label === 'flee' && ((this.cursor.clapFear || 0) > 0.26 || (this.lifeSim?.emotions?.threat || 0) > 0.74)) {
            this.resetCursorInteraction({ startled: true });
            return;
        }
        this.cursor.currentPatience += (riskProfile.patienceGain || 1);
        this.cursor.trustGlowAlpha = Math.min(255, (this.cursor.currentPatience / this.cursor.patienceRequired) * 255);
        
        if (this.cursor.currentPatience >= this.cursor.patienceRequired && !this.cursor.trustDisplayTriggered) {
            this.cursor.trustDisplayTriggered = true;
            this.cursor.trustLevel = Math.min(100, this.cursor.trustLevel + 10);
            this.cursor.calmedByCursor = true;
            this.cursor.clapFear = Math.max(0, this.cursor.clapFear - 0.15);
            this.happiness = Math.min(this.maxHappiness, this.happiness + 6);
            if (this.lifeSim?.emotions) {
                this.lifeSim.emotions.relief = Math.min(1, (this.lifeSim.emotions.relief || 0) + 0.08);
                this.lifeSim.emotions.attachment = Math.min(1, (this.lifeSim.emotions.attachment || 0) + 0.06);
                this.lifeSim.emotions.significance = Math.min(1, (this.lifeSim.emotions.significance || 0) + 0.03);
            }
            if (this.lifeSim?.playerInteraction) {
                this.lifeSim.playerInteraction.calmedByCursor = true;
                this.lifeSim.playerInteraction.startledByCursor = false;
                this.lifeSim.playerInteraction.cursorTrust = Math.min(1, (this.lifeSim.playerInteraction.cursorTrust || 0) + 0.12);
                this.lifeSim.playerInteraction.cursorFear = Math.max(0, (this.lifeSim.playerInteraction.cursorFear || 0) - 0.08);
            }
            appendLifeMemory(this, 'interaction', {
                subjectId: 'player_cursor',
                valence: 0.32,
                strength: 0.46,
                tags: ['player', 'cursor', 'trust']
            });
            
            // Cursor trust still matters socially, but explicit inspect control now owns guiding.
            const butterflyCount = gameCore?.gameState?.butterflies?.length || 0;
            this.resetEngagement(butterflyCount);
            
            eventBus.emit(GameEvents.BUTTERFLY_DISPLAY, {
                butterfly: this,
                reason: 'cursorTrust'
            });
            eventBus.emit(GameEvents?.COMMUNICATION_SIGNAL || 'communication:signal', {
                sourceId: this.id,
                sourceButterfly: this,
                signalType: 'trust_display',
                intent: 'build trust',
                targetId: 'player_cursor',
                targetLabel: 'player cursor'
            });
            
            particleSystem.emitBurst(this.x, this.y, random(this.colors), 3);
            this.cursor.currentPatience = this.cursor.patienceRequired;
            this.cursor.trustGlowAlpha = 120;
            this.cursor.trustRewardCooldownFrames = 120;
        }
    }

    canReceivePetInteraction() {
        return !!this.cursor.calmedByCursor && !this.isSpawning && !this.zoneTravel && this.state !== 'scared';
    }

    receivePetInteraction(gameState = {}) {
        if (!this.canReceivePetInteraction()) return false;
        this.happiness = Math.min(this.maxHappiness, this.happiness + 3.5);
        this.cursor.trustLevel = Math.min(100, (this.cursor.trustLevel || 0) + 6);
        this.cursor.trustGlowAlpha = Math.max(this.cursor.trustGlowAlpha || 0, 120);
        this.cursor.trustRewardCooldownFrames = Math.max(this.cursor.trustRewardCooldownFrames || 0, 24);
        if (this.lifeSim?.emotions) {
            this.lifeSim.emotions.relief = Math.min(1, (this.lifeSim.emotions.relief || 0) + 0.1);
            this.lifeSim.emotions.attachment = Math.min(1, (this.lifeSim.emotions.attachment || 0) + 0.08);
            this.lifeSim.emotions.significance = Math.min(1, (this.lifeSim.emotions.significance || 0) + 0.04);
        }
        if (this.lifeSim?.playerInteraction) {
            this.lifeSim.playerInteraction.cursorTrust = Math.min(1, (this.lifeSim.playerInteraction.cursorTrust || 0) + 0.08);
            this.lifeSim.playerInteraction.petHistory = (this.lifeSim.playerInteraction.petHistory || 0) + 1;
            this.lifeSim.playerInteraction.lastPetAtSeconds = lifeSimSystem?.simulationClockSeconds ?? null;
        }
        appendLifeMemory(this, 'interaction', {
            subjectId: 'player_cursor',
            valence: 0.38,
            strength: 0.42,
            tags: ['player', 'pet', 'comfort']
        });
        eventBus?.emit?.('cursor:pet', {
            butterflyId: this.id,
            x: this.x,
            y: this.y - 6,
            colors: this.colors?.[0] || [140, 255, 140]
        });
        return true;
    }

    receiveClapInteraction(gameState = {}) {
        if (this.isSpawning || this.zoneTravel) return false;
        const cursorX = gameState.adjustedMouseX ?? this.x;
        const cursorY = gameState.adjustedMouseY ?? this.y;
        if (typeof sleepSystem !== 'undefined' && sleepSystem.isSleeping?.(this.id)) {
            sleepSystem.wakeEntity(this.id, 'cursor-clap');
        }
        if (this.lifeSim?.emotions) {
            this.lifeSim.emotions.threat = Math.min(1, (this.lifeSim.emotions.threat || 0) + 0.22);
            this.lifeSim.emotions.agitation = Math.min(1, (this.lifeSim.emotions.agitation || 0) + 0.16);
            this.lifeSim.emotions.relief = Math.max(0, (this.lifeSim.emotions.relief || 0) - 0.08);
            this.lifeSim.emotions.attachment = Math.max(0, (this.lifeSim.emotions.attachment || 0) - 0.05);
        }
        this.cursor.calmedByCursor = false;
        this.cursor.clapFear = Math.min(1, (this.cursor.clapFear || 0) + 0.18);
        this.cursor.currentPatience = 0;
        this.cursor.trustGlowAlpha = 0;
        this.cursor.trustDisplayTriggered = false;
        this.happiness = Math.max(4, this.happiness - 3);
        if (this.lifeSim?.playerInteraction) {
            this.lifeSim.playerInteraction.calmedByCursor = false;
            this.lifeSim.playerInteraction.startledByCursor = true;
            this.lifeSim.playerInteraction.cursorFear = Math.min(1, (this.lifeSim.playerInteraction.cursorFear || 0) + 0.14);
            this.lifeSim.playerInteraction.clapStartleHistory = (this.lifeSim.playerInteraction.clapStartleHistory || 0) + 1;
            this.lifeSim.playerInteraction.lastClapAtSeconds = lifeSimSystem?.simulationClockSeconds ?? null;
        }
        appendLifeMemory(this, 'danger', {
            subjectId: 'player_cursor',
            valence: -0.3,
            strength: 0.44,
            tags: ['player', 'clap', 'startled']
        });
        this.changeState('scared', { cursorX, cursorY });
        eventBus?.emit?.('cursor:clap', {
            butterflyId: this.id,
            x: this.x,
            y: this.y - 4
        });
        return true;
    }
    
    resetCursorInteraction(options = {}) {
        if (options.startled) {
            this.cursor.calmedByCursor = false;
            this.cursor.clapFear = Math.min(1, (this.cursor.clapFear || 0) + 0.05);
            if (this.lifeSim?.playerInteraction) {
                this.lifeSim.playerInteraction.calmedByCursor = false;
                this.lifeSim.playerInteraction.startledByCursor = true;
                this.lifeSim.playerInteraction.cursorFear = Math.min(1, (this.lifeSim.playerInteraction.cursorFear || 0) + 0.04);
            }
        }
        this.cursor.currentPatience = 0;
        this.cursor.trustDisplayTriggered = false;
        if (this.state === 'following' && !gameUI?.isExplicitGuidanceActiveFor?.(this.id)) {
            this.changeState('normal');
        }
    }
    
    // === SPAWN FLIGHT ===
    updateSpawnFlight(gameState) {
        const sf = this.spawnFlight;
        sf.progress += 1 / sf.duration;

        if (sf.progress >= 1.0) {
            // Arrived in main area
            sf.progress = 1.0;
            this.x = sf.targetX;
            this.y = sf.targetY;
            this.isSpawning = false;

            // Sync grid position from screen position
            this.syncDebugGridPos();

            // Start normal behavior with a fresh wander target
            this.pickNewWanderTarget();
            return;
        }

        // Smooth ease-out lerp for natural deceleration on arrival
        const t = 1 - Math.pow(1 - sf.progress, 2);
        this.x = sf.originX + (sf.targetX - sf.originX) * t;
        this.y = sf.originY + (sf.targetY - sf.originY) * t;

        // Still update wings so they animate during flight
        this.updateWings();
        this.updateFlightH();

        // Record afterimage snapshot during flight too
        if (frameCount % this.afterimageInterval === 0) {
            this.afterimages.push({ x: this.x, y: this.y, wingAngle: this.visual.wingAngle });
            if (this.afterimages.length > this.afterimageMax) {
                this.afterimages.shift();
            }
        }

        // Still update spawn glow effects
        if (this.spawnTimer > 0) {
            this.spawnTimer--;
            const maxSpawnTimer = this.personalityType === 'golden' ? 300 : 180;
            this.spawnGlowIntensity = this.spawnTimer / maxSpawnTimer;
        }

        // Keep depth sorting current during spawn flight without using the old neglect timer.
        this.updateZIndex();
    }

    updateZIndex() {
        if (this.isBoardMovementWorld() && this.boardPos && Number.isFinite(this.boardPos.u) && Number.isFinite(this.boardPos.v)) {
            this.boardPos = this.clampBoardTarget(this.boardPos, this.boardPos.zoneId || this.getMovementZoneId());
            this.syncDebugGridPos();
        } else {
            this.syncBoardPosFromScreen?.();
        }
        const renderer = typeof renderManager !== 'undefined' ? renderManager : null;
        if (this.boardPos && renderer?.computeRenderSortKey) {
            this.zIndex = renderer.computeRenderSortKey(this);
            return;
        }
        const baseGridY = this.gridPos?.y ?? 0;
        const baseGridX = this.gridPos?.x ?? 0;
        this.zIndex = (baseGridY * 1000) + baseGridX + 320;
    }

    syncBoardPosFromScreen(options = {}) {
        const renderer = typeof renderManager !== 'undefined' ? renderManager : null;
        const zoneId = options.zoneId
            || this.currentZoneId
            || this.lifeSim?.lifecycle?.currentZoneId
            || gameCore?.getFocusedZoneId?.()
            || null;
        if (!zoneId || !renderer?.screenToBoard) return this.boardPos || null;
        if (!options.force && this.isBoardMovementWorld() && this.boardPos && Number.isFinite(this.boardPos.u) && Number.isFinite(this.boardPos.v)) {
            this.boardPos = this.clampBoardTarget(this.boardPos, this.boardPos.zoneId || zoneId);
            return this.boardPos;
        }
        const groundY = (this.y || 0) + (this.shadowOffset || 0);
        const boardPos = renderer.screenToBoard(this.x || 0, groundY, zoneId, 0);
        this.boardPos = {
            zoneId,
            u: boardPos.u,
            v: boardPos.v,
            h: 0
        };
        return this.boardPos;
    }

    // === VISUAL UPDATES ===
    updateWings() {
        // Calculate wing speed based on state and happiness
        let speed = this.visual.wingSpeed;
        const sleepState = this.getSleepState();

        if (sleepState?.subtype === 'settling_sleep') {
            speed = this.visual.wingSpeed * 0.35;
        } else if (sleepState?.subtype) {
            speed = this.visual.wingSpeed * 0.08;
        } else {
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
        }
        
        this.visual.wingAngle += speed;
    }
    
    
    
    
    
    
    
    
    getRenderSpec() {
        if (!this.renderSpecCache) {
            this.renderSpecCache = Object.freeze({
                personalityType: this.personalityType,
                baseType: this.personalityType,
                sex: this.sex,
                isHybrid: this.isHybrid,
                hybridGenome: this.hybridGenome
            });
        }
        return this.renderSpecCache;
    }

    getCollectionRenderSpec() {
        if (!this.collectionRenderSpecCache) {
            this.collectionRenderSpecCache = Object.freeze({
                personalityType: this.personalityType,
                baseType: this.personalityType,
                sex: this.sex,
                isHybrid: this.isHybrid,
                hybridGenome: this.hybridGenome
            });
        }
        return this.collectionRenderSpecCache;
    }

    getFlattenedWingSource(wingKey) {
        if (this.hybridGenome?.wingDonors?.[wingKey]) {
            return this.hybridGenome.wingDonors[wingKey];
        }

        return {
            personalityType: this.personalityType === 'hybrid' ? 'friendly' : this.personalityType,
            sex: this.sex
        };
    }

    getSpecialAbility() {
        return this.specialAbility ?? this.traits.special ?? null;
    }

    getAbilitySourceVariant(ability = this.getSpecialAbility()) {
        return BUTTERFLY_ABILITY_SOURCE_VARIANTS[ability] || this.personalityType || 'friendly';
    }

    getAbilityVisualPalette(ability = this.getSpecialAbility()) {
        const sourceVariant = this.getAbilitySourceVariant(ability);
        const palette = BUTTERFLY_PERSONALITIES[sourceVariant]?.colors;
        if (Array.isArray(palette) && palette.length >= 2) {
            return {
                primaryColor: [...palette[0]],
                secondaryColor: [...palette[1]]
            };
        }
        return {
            primaryColor: [...(this.colors?.[0] || [255, 255, 255])],
            secondaryColor: [...(this.colors?.[1] || this.colors?.[0] || [255, 255, 255])]
        };
    }

    getAbilityVisualProfile(ability = this.getSpecialAbility()) {
        const profile = BUTTERFLY_ABILITY_VISUALS[ability] || { style: 'symbol', symbol: '✦', fallbackSymbol: '*', durationFrames: 24 };
        return {
            ...profile,
            ability
        };
    }

    emitAbilityVisual(ability = this.getSpecialAbility(), overrides = {}) {
        if (!ability || typeof eventBus === 'undefined') return;

        const visual = this.getAbilityVisualProfile(ability);
        if (visual.style === 'trail') return;

        const palette = this.getAbilityVisualPalette(ability);
        eventBus.emit('ability:visual', {
            ability,
            sourceId: this.id,
            x: this.x,
            y: this.y,
            visualStyle: visual.style,
            abilityRadius: visual.radius ?? null,
            durationFrames: visual.durationFrames || 24,
            symbol: visual.symbol || null,
            fallbackSymbol: visual.fallbackSymbol || null,
            primaryColor: palette.primaryColor,
            secondaryColor: palette.secondaryColor,
            ...overrides
        });
    }

    getStatusBundle() {
        if (typeof statusSystem === 'undefined' || !this.id) {
            return { families: {}, numeric: {}, cooldowns: {}, charges: {}, immunities: {}, totalEffects: 0 };
        }
        return statusSystem.getAggregatedModifiers(this.id);
    }

    getStatusStrength(family) {
        const bundle = this.getStatusBundle();
        if (typeof bundle.numeric?.[family] === 'number') {
            return bundle.numeric[family];
        }
        return bundle.families?.[family]?.strength ?? 0;
    }

    getAbilityCooldownRemaining(channel) {
        const bundle = this.getStatusBundle();
        return bundle.cooldowns?.[channel]?.remainingSeconds ?? 0;
    }

    setAbilityCooldown(channel, remainingSeconds, options = {}) {
        if (typeof statusSystem === 'undefined' || !this.id || !channel) return null;
        return statusSystem.setCooldown(this.id, channel, remainingSeconds, {
            sourceId: this.id,
            tags: ['butterfly-ability', this.getAbilityDebugLabel()],
            ...options
        });
    }

    applyAbilityAura(targetId, family, strength, durationSeconds, effectId, metadata = {}) {
        if (typeof statusSystem === 'undefined' || !targetId || !family || !effectId) return null;
        return statusSystem.applyEffect({
            id: effectId,
            family,
            subtype: this.getAbilityDebugLabel(),
            sourceId: this.id,
            targetId,
            strength,
            durationSeconds,
            metadata,
            tags: ['butterfly-ability', this.getAbilityDebugLabel()]
        });
    }

    setSpecialAbility(ability) {
        this.specialAbility = ability || null;
        this.traits.special = this.specialAbility;
    }

    getAbilityDebugLabel() {
        return this.getSpecialAbility() || this.personalityType || 'butterfly';
    }

    getFlowerInteractionType() {
        return this.getSpecialAbility() || this.personalityType;
    }

    getBodySpriteScale() {
        return this.bodySpriteScale;
    }

    getWingSpriteScale() {
        return this.wingSpriteScale;
    }

    shouldUseBakedCreatureSprites() {
        return gameConfig.rendering.useSprites
            && spriteManager.loaded
            && spriteManager.isBakedCreatureSpritesEnabled?.();
    }

    getCreatureBakeOptions(battleActive = null) {
        const renderContext = typeof renderManager !== 'undefined'
            ? renderManager.getRenderContext?.() || {}
            : {};
        const inBattle = battleActive === null ? !!renderContext.battleActive : !!battleActive;
        const closeup = inBattle || !!gameUI?.isInspectLockedToEntity?.(this.id);
        const currentFrame = Number(
            gameCore?.getCurrentFrame?.()
            ?? gameCore?.gameState?.currentFrame
            ?? (typeof frameCount !== 'undefined' ? frameCount : 0)
            ?? 0
        );
        const inspectOpenedAtFrame = Number(this.inspectOpenedAtFrame);
        const asyncBake = !!(
            closeup
            && gameConfig?.rendering?.creatureBakeAsyncOnInspect !== false
            && Number.isFinite(inspectOpenedAtFrame)
            && Number.isFinite(currentFrame)
            && currentFrame >= inspectOpenedAtFrame
            && currentFrame - inspectOpenedAtFrame <= 4
        );
        return {
            lod: closeup ? 'closeup' : 'garden',
            closeup,
            async: asyncBake,
            entityId: this.id
        };
    }

    hasRenderableWings() {
        return gameConfig.rendering.useSprites
            && spriteManager.loaded
            && spriteManager.hasRenderableSpec(this.getRenderSpec());
    }

    getVariantDisplayName() {
        if (this.displayName) return this.displayName;
        if (this.personalName) {
            return this.nameDisambiguator
                ? `${this.personalName} ${this.nameDisambiguator}.`
                : this.personalName;
        }
        if (this.isHybrid) return 'Hybrid';
        return BUTTERFLY_VARIANT_DISPLAY_NAMES[this.personalityType] || this.personalityType || 'Butterfly';
    }

    getCanonicalLabel(options = {}) {
        const includeSex = !!options.includeSex;
        const baseLabel = this.getVariantDisplayName();
        if (!includeSex) return baseLabel;
        return `${baseLabel}(${this.sex || '?'})`;
    }

    getDisplayName() {
        return this.getVariantDisplayName();
    }

    // Override parent's draw to add following connection
    draw(graphics) {
        const renderContext = typeof renderManager !== 'undefined'
            ? renderManager.getRenderContext?.() || {}
            : {};
        const inBattle = !!renderContext.battleActive;
        // Draw following connection line first (behind everything)
        if (!inBattle && this.state === 'following' && this.cursor.followingPos) {
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
    getVisualScale(renderContext = null) {
        const context = renderContext || (typeof renderManager !== 'undefined'
            ? renderManager.getRenderContext?.() || {}
            : {});
        const baseScale = gameConfig.rendering.butterflyVisualScale;
        if (context?.battleActive) {
            return baseScale * (gameConfig?.battle?.presentation?.fieldEntityScale || 1);
        }
        return baseScale;
    }

    drawShadow(graphics, alpha) {
        const sleepState = this.getSleepState?.();
        if (sleepState?.subtype) return;
        const vs = this.getVisualScale();
        const shadowPoint = this.getShadowScreenPoint();
        graphics.noStroke();
        graphics.fill(0, 0, 0, min(50, alpha * 0.2));
        graphics.ellipse(shadowPoint.x, shadowPoint.y, this.size * 0.8 * vs, this.size * 0.4 * vs);
    }
    
    // Override parent's entity drawing
    drawAfterimages(graphics) {
        if (this.afterimages.length === 0) return;
        if (typeof renderManager !== 'undefined' && renderManager.getRenderContext?.().battleActive) return;
        if (typeof renderManager !== 'undefined' && !renderManager.shouldRenderAfterimageTrails()) return;
        const trailMode = typeof renderManager !== 'undefined'
            ? renderManager.getTrailVisibilityMode?.() || 'full'
            : 'full';
        const startIndex = trailMode === 'reduced'
            ? Math.max(0, this.afterimages.length - Math.ceil(this.afterimages.length / 2))
            : 0;

        const useSprites = this.hasRenderableWings();
        const renderSpec = useSprites ? this.getRenderSpec() : null;

        for (let i = startIndex; i < this.afterimages.length; i++) {
            const ghost = this.afterimages[i];
            const relativeIndex = i - startIndex;
            const relativeLength = Math.max(1, this.afterimages.length - startIndex);
            const ghostAlpha = map(relativeIndex, 0, relativeLength, trailMode === 'reduced' ? 28 : 20, trailMode === 'reduced' ? 48 : 60);

            graphics.push();
            graphics.translate(ghost.x, ghost.y);
            graphics.scale(gameConfig.rendering.butterflyVisualScale);

            const wingFlap = sinWing(ghost.wingAngle);
            const wingSpread = map(wingFlap, -1, 1, 0.4, 1);
            const wingTilt = map(wingFlap, -1, 1, -0.2, 0.1);

            graphics.noStroke();

            if (useSprites) {
                graphics.tint(255, ghostAlpha);

                this.drawSpriteBody(graphics, renderSpec);
                this.drawSpriteAntennae(graphics, renderSpec);

                graphics.push();
                graphics.rotate(wingTilt);

                const hindFlap = sinWing(ghost.wingAngle - 0.6);
                const hindSpread = map(hindFlap, -1, 1, 0.35, 0.95);
                this.drawSpriteWing(graphics, 'hindLeft', hindSpread, renderSpec, false);
                this.drawSpriteWing(graphics, 'hindRight', hindSpread, renderSpec, false);
                this.drawSpriteWing(graphics, 'foreLeft', wingSpread, renderSpec, false);
                this.drawSpriteWing(graphics, 'foreRight', wingSpread, renderSpec, false);

                graphics.pop();
                graphics.noTint();
            } else {
                graphics.push();
                graphics.rotate(wingTilt);
                const c = this.colors[0];
                graphics.fill(c[0], c[1], c[2], ghostAlpha);
                this.drawStardewWing(graphics, -1, wingSpread);
                this.drawStardewWing(graphics, 1, wingSpread);
                graphics.pop();

                graphics.fill(this.colors[1][0], this.colors[1][1], this.colors[1][2], ghostAlpha);
                graphics.ellipse(0, 0, this.size * 0.3, this.size * 0.5);
            }

            graphics.pop();
        }
    }

    drawEntity(graphics, alpha) {
        const sleepState = this.getSleepState();
        const renderContext = typeof renderManager !== 'undefined'
            ? renderManager.getRenderContext?.() || {}
            : {};
        const inBattle = !!renderContext.battleActive;
        const trackButterflyComponentCosts = !!renderContext.trackButterflyComponentCosts;
        const nowMs = trackButterflyComponentCosts
            ? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()))
            : null;
        const recordComponentCost = (metricKey, startMs) => {
            if (!trackButterflyComponentCosts || startMs == null || typeof renderManager === 'undefined') return;
            renderManager.accumulateEntityComponentRenderCost?.(metricKey, nowMs() - startMs);
        };
        const visualScale = this.getVisualScale(renderContext);

        // Draw afterimage trail behind the main butterfly
        if (!sleepState?.subtype && !inBattle) {
            const afterimageStart = trackButterflyComponentCosts ? nowMs() : null;
            this.drawAfterimages(graphics);
            recordComponentCost('entityFamilyButterflyAfterimageMs', afterimageStart);
        }

        const sleepVisual = typeof sleepSystem !== 'undefined' ? sleepSystem.getVisualState(this.id) : null;
        const useSprites = this.hasRenderableWings();
        const renderSpec = useSprites ? this.getRenderSpec() : null;

        // Draw butterfly at current position
        graphics.push();
        const flightRenderOffset = this.getFlightRenderOffset();
        graphics.translate(
            this.x + flightRenderOffset.x,
            this.y + flightRenderOffset.y + (sleepVisual?.yOffset || 0)
        );
        if (sleepVisual?.tilt) {
            graphics.rotate(sleepVisual.tilt);
        }
        graphics.scale(visualScale);
        
        const wingFlap = sinWing(this.visual.wingAngle);
        const wingSpread = map(wingFlap, -1, 1, 0.4, 1);
        const wingTilt = map(wingFlap, -1, 1, -0.2, 0.1);
        
        graphics.noStroke();

        if (useSprites) {
            // Apply alpha for fading butterflies
            if (alpha < 255) {
                graphics.tint(255, alpha);
            }

            // --- BODY (bottom layer — behind wings) ---
            const bodyStart = trackButterflyComponentCosts ? nowMs() : null;
            this.drawSpriteBody(graphics, renderSpec);
            recordComponentCost('entityFamilyButterflyBodyMs', bodyStart);

            // --- ANTENNAE (middle layer — between body and wings) ---
            const antennaStart = trackButterflyComponentCosts ? nowMs() : null;
            this.drawSpriteAntennae(graphics, renderSpec);
            recordComponentCost('entityFamilyButterflyAntennaMs', antennaStart);

            // --- WINGS (top layer, inside wingTilt rotation) ---
            const wingStart = trackButterflyComponentCosts ? nowMs() : null;
            graphics.push();
            graphics.rotate(wingTilt);

            // Hindwings first (behind forewings) with 0.6 rad phase lag (~0.2s at normal speed)
            const hindFlap = sinWing(this.visual.wingAngle - 0.6);
            const hindSpread = map(hindFlap, -1, 1, 0.35, 0.95);
            this.drawSpriteWing(graphics, 'hindLeft', hindSpread, renderSpec, inBattle);
            this.drawSpriteWing(graphics, 'hindRight', hindSpread, renderSpec, inBattle);

            // Forewings on top with primary timing
            this.drawSpriteWing(graphics, 'foreLeft', wingSpread, renderSpec, inBattle);
            this.drawSpriteWing(graphics, 'foreRight', wingSpread, renderSpec, inBattle);

            graphics.pop();
            recordComponentCost('entityFamilyButterflyWingMs', wingStart);

            // Remove tint after drawing this sprite batch.
            if (alpha < 255) {
                graphics.noTint();
            }
        } else {
            // Fallback: original procedural rendering
            const wingStart = trackButterflyComponentCosts ? nowMs() : null;
            graphics.push();
            graphics.rotate(wingTilt);
            this.drawStardewWing(graphics, -1, wingSpread); // Left wing
            this.drawStardewWing(graphics, 1, wingSpread);  // Right wing
            graphics.pop();
            recordComponentCost('entityFamilyButterflyWingMs', wingStart);

            // Draw body on top
            const bodyStart = trackButterflyComponentCosts ? nowMs() : null;
            this.drawBody(graphics);
            recordComponentCost('entityFamilyButterflyBodyMs', bodyStart);
        }
        
        // Draw exclamation mark popup if active
        const overlayStart = trackButterflyComponentCosts ? nowMs() : null;
        if (!inBattle && this.timers.exclamation > 0) {
            this.drawExclamation(graphics);
        }
        
        // Draw trust building indicator
        if (!inBattle && this.cursor.trustGlowAlpha > 0) {
            this.drawTrustIndicator(graphics);
        }

        if (!inBattle && typeof communicationSystem !== 'undefined') {
            communicationSystem.drawSignalIndicator(graphics, this, alpha);
        }

        if (!inBattle && sleepState?.subtype) {
            this.drawSleepIndicator(graphics, sleepState, alpha);
        }

        if (typeof gameUI !== 'undefined' && gameUI.isInspectLockedToEntity?.(this.id)) {
            this.drawLockedInspectIndicator(graphics);
        }
        recordComponentCost('entityFamilyButterflyOverlayMs', overlayStart);
        
        graphics.pop();
    }

    drawSleepIndicator(graphics, sleepState, alpha) {
        graphics.push();
        graphics.noStroke();

        const indicatorColor = sleepState.subtype === 'oversleeping'
            ? [170, 190, 255]
            : [220, 230, 255];

        if (sleepState.subtype !== 'settling_sleep') {
            graphics.fill(indicatorColor[0], indicatorColor[1], indicatorColor[2], alpha * 0.85);
            graphics.textAlign(CENTER, CENTER);
            graphics.textSize(8);
            graphics.text('z', 6, -12);
            graphics.textSize(6);
            graphics.text('z', 11, -18);
        }

        graphics.pop();
    }

    drawLockedInspectIndicator(graphics) {
        graphics.push();
        graphics.noFill();

        const highContrast = !!gameUI?.accessibilitySettings?.highContrastUI;
        if (highContrast) {
            graphics.stroke(255, 255, 255, 240);
            graphics.strokeWeight(2.5);
        } else {
            graphics.stroke(110, 245, 170, 220);
            graphics.strokeWeight(2.5);
        }

        graphics.ellipse(0, 8, 28, 16);
        graphics.pop();
    }
    
    // Draw happiness aura/glow behind butterfly
    drawHappinessAura(graphics, alpha) {
        const crowdSuppression = this.getCrowdSuppressionFactor(92);
        if (crowdSuppression <= 0.05) {
            return;
        }

        // Add shimmer effect for mystic butterflies
        if (this.personalityType === 'mystic' && crowdSuppression > 0.42) {
            const shimmerTime = frameCount * 0.1;
            const shimmerAlpha = (sin(shimmerTime) * 0.3 + 0.7) * alpha * crowdSuppression;
            graphics.push();
            graphics.noStroke();
            // Iridescent shimmer layers
            for (let i = 3; i > 0; i--) {
                const size = 30 * (i / 3) * Math.max(0.7, crowdSuppression);
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
                const auraSize = (25 + sadnessRatio * 15) * Math.max(0.68, crowdSuppression);
                const auraAlpha = min(60 * sadnessRatio, alpha * 0.8) * crowdSuppression;
                
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
        const auraSize = (20 + happinessRatio * maxAuraSize) * Math.max(0.62, crowdSuppression);
        const auraAlpha = min(50 + happinessRatio * 100, alpha * 0.9) * crowdSuppression;
        
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
        if (happinessRatio > 0.8 && crowdSuppression > 0.55) {
            const pulse = sinFrame(frameCount, 0.1) * 0.2 + 0.8;
            const pulseSize = auraSize * pulse;
            graphics.fill(255, 255, 255, auraAlpha * 0.3 * pulse);
            graphics.ellipse(0, 0, pulseSize, pulseSize * 0.7);
        }
        
        graphics.pop();
    }
    
    // Sprite-based wing rendering using anchor-point positioning
    // wingKey: 'foreLeft', 'foreRight', 'hindLeft', 'hindRight'
    drawSpriteWing(graphics, wingKey, spread, renderSpec = null, battleActive = null) {
        const spec = renderSpec || this.getRenderSpec();
        const rawPiece = spriteManager.getWingPieceForSpec(spec, wingKey);
        if (!rawPiece) return;

        const anchor = spriteManager.anchors.wings[wingKey];
        const relAnchor = spriteManager.anchors.wingsRelative[wingKey];
        const bodyCenter = spriteManager.anchors.body;

        const bodyScale = this.getBodySpriteScale();
        const wingScale = this.getWingSpriteScale();
        const s = ((this.size * spriteManager.SPRITE_SCALE) / 1080) * bodyScale;
        const ws = ((this.size * spriteManager.SPRITE_SCALE) / 1080) * wingScale * 1.45;

        // Body connection point in game-space (relative to butterfly center)
        const bodyConnX = (anchor.onBody.x - bodyCenter.centerX) * s;
        let bodyConnY = (anchor.onBody.y - bodyCenter.centerY) * s;

        // Scoot hindwings up 5 pixels
        const isHind = wingKey === 'hindLeft' || wingKey === 'hindRight';
        if (isHind) {
            bodyConnY -= 5 * s;
        }

        // Wing piece dimensions in game-space (using wing scale)
        let piece = rawPiece;
        let pieceW = rawPiece.width * ws;
        let pieceH = rawPiece.height * ws;
        let anchorX = relAnchor.x * ws;
        let anchorY = relAnchor.y * ws;
        let bakedPoseUsed = false;
        if (this.shouldUseBakedCreatureSprites()) {
            const bakeOptions = this.getCreatureBakeOptions(battleActive);
            const bakedPose = spriteManager.shouldUseBakedWingPose?.(wingKey, spread, battleActive)
                ? spriteManager.getBakedWingPoseData(spec, wingKey, ws, spread, bakeOptions)
                : null;
            if (bakedPose?.surface) {
                piece = bakedPose.surface;
                pieceW = bakedPose.drawWidth;
                pieceH = bakedPose.drawHeight;
                anchorX = bakedPose.anchorX;
                anchorY = bakedPose.anchorY;
                bakedPoseUsed = true;
            } else {
                const bakedPiece = spriteManager.getBakedWingPieceData(spec, wingKey, ws, bakeOptions);
                if (bakedPiece?.surface) {
                    piece = bakedPiece.surface;
                    pieceW = bakedPiece.drawWidth;
                    pieceH = bakedPiece.drawHeight;
                    anchorX = bakedPiece.anchorX;
                    anchorY = bakedPiece.anchorY;
                }
            }
        }

        // Position so the wing's anchor pixel aligns with the body connection
        const drawX = bodyConnX - anchorX;
        const drawY = bodyConnY - anchorY;

        if (bakedPoseUsed) {
            graphics.image(piece, drawX, drawY, pieceW, pieceH);
            return;
        }

        graphics.push();
        graphics.scale(spread, 1); // 3D flap: X-axis compression toward body center
        graphics.image(piece, drawX, drawY, pieceW, pieceH);
        graphics.pop();
    }

    // Sprite-based body rendering — drawn centered using unified scale
    drawSpriteBody(graphics, renderSpec = null) {
        if (!spriteManager.hasBody()) {
            return this.drawBody(graphics);
        }

        const s = ((this.size * spriteManager.SPRITE_SCALE) / 1080) * this.getBodySpriteScale();
        if (this.shouldUseBakedCreatureSprites()) {
            const bakedBody = spriteManager.getBakedBodySpriteData?.(
                renderSpec || this.getRenderSpec(),
                s,
                this.getCreatureBakeOptions()
            );
            if (bakedBody?.surface) {
                graphics.image(
                    bakedBody.surface,
                    bakedBody.offsetX,
                    bakedBody.offsetY,
                    bakedBody.drawWidth,
                    bakedBody.drawHeight
                );
                return;
            }
        }

        const bodySprite = spriteManager.body;
        const bodyW = bodySprite.width * s;
        const bodyH = bodySprite.height * s;
        graphics.image(bodySprite, -bodyW / 2, -bodyH / 2, bodyW, bodyH);
    }

    // Sprite-based antenna rendering with anchor-point positioning and sway
    drawSpriteAntennae(graphics, renderSpec = null) {
        if (!spriteManager.hasAntenna()) return;

        const s = ((this.size * spriteManager.SPRITE_SCALE) / 1080) * this.getBodySpriteScale();
        const bodyCenter = spriteManager.anchors.body;
        const bakedAntenna = this.shouldUseBakedCreatureSprites()
            ? spriteManager.getBakedAntennaSpriteData?.(
                renderSpec || this.getRenderSpec(),
                s,
                this.getCreatureBakeOptions()
            )
            : null;
        const antennaImg = bakedAntenna?.surface || spriteManager.antenna;
        const antennaW = bakedAntenna?.drawWidth || antennaImg.width * s;
        const antennaH = bakedAntenna?.drawHeight || antennaImg.height * s;

        // Subtle sway animation
        const baseSway = sin(frameCount * 0.08) * 0.05;
        const scaredSway = (this.state === 'scared') ? sin(frameCount * 0.2) * 0.1 : 0;
        const sway = baseSway + scaredSway;

        // Draw each antenna separately using anchor points
        const antennaAnchors = spriteManager.anchors.antenna;
        for (const side of ['left', 'right']) {
            const anchor = antennaAnchors[side];

            // Body connection point in game-space
            const bodyConnX = (anchor.onBody.x - bodyCenter.centerX) * s;
            const bodyConnY = (anchor.onBody.y - bodyCenter.centerY) * s;

            // Position antenna so its anchor aligns with body connection
            const antennaAnchor = bakedAntenna?.anchors?.[side] || {
                x: anchor.onAntenna.x * s,
                y: anchor.onAntenna.y * s
            };
            const drawX = bodyConnX - antennaAnchor.x;
            const drawY = bodyConnY - antennaAnchor.y;

            graphics.push();
            // Rotate around the body connection point for natural sway
            graphics.translate(bodyConnX, bodyConnY);
            graphics.rotate(side === 'left' ? sway : -sway);
            graphics.translate(-bodyConnX, -bodyConnY);
            graphics.image(antennaImg, drawX, drawY, antennaW, antennaH);
            graphics.pop();
        }
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
        const crowdSuppression = this.getCrowdSuppressionFactor(84);
        if (crowdSuppression <= 0.08 && this.personalityType !== 'golden') {
            graphics.pop();
            return;
        }
        // Golden butterflies get full opacity indicators for easier tracking
        const alpha = (this.personalityType === 'golden' ? 210 * pulse : this.cursor.trustGlowAlpha * pulse) * crowdSuppression;
        
        // Use special symbols for golden butterfly
        const isGolden = this.personalityType === 'golden';
        const activelyBuilding = this.cursor.currentPatience > 0;
        const symbolCount = activelyBuilding
            ? (crowdSuppression < 0.55 ? 1 : (crowdSuppression < 0.8 ? 2 : 3))
            : 1;
        
        // Draw small symbols floating up
        for (let i = 0; i < symbolCount; i++) {
            const angle = (TWO_PI / Math.max(symbolCount, 1)) * i + frameCount * (activelyBuilding ? 0.02 : 0.006);
            const distance = 12 + sin(frameCount * 0.05 + i) * 4 * crowdSuppression;
            const x = cos(angle) * distance;
            const y = sin(angle) * distance - 10;
            
            graphics.push();
            graphics.translate(x, y);
            graphics.scale(0.5);
            
            graphics.noStroke();
            
            if (isGolden) {
                // Draw golden star for legendary butterfly - enhanced visibility
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
            
            if (isGolden) {
                // Golden butterfly progress bar - much more visible
                graphics.strokeWeight(4); // Thicker
                graphics.stroke(255, 215, 0, 220); // Brighter gold, nearly opaque
                
                // Background circle for context
                graphics.stroke(255, 215, 0, 100);
                graphics.strokeWeight(2);
                graphics.arc(0, 0, 28, 28, 0, TWO_PI);
                
                // Progress arc
                graphics.stroke(255, 215, 0, 255); // Full opacity
                graphics.strokeWeight(4);
                const arcEnd = map(progress, 0, 1, 0, TWO_PI);
                graphics.arc(0, 0, 28, 28, -HALF_PI, -HALF_PI + arcEnd);
                
                // Add pulsing outer ring for dramatic effect
                if (crowdSuppression > 0.9) {
                    const outerPulse = sin(frameCount * 0.15) * 0.3 + 0.7;
                    graphics.stroke(255, 255, 100, 150 * outerPulse * crowdSuppression);
                    graphics.strokeWeight(1.5);
                    graphics.arc(0, 0, 38, 38, -HALF_PI, -HALF_PI + arcEnd);
                }
            } else {
                // Normal butterfly progress bar
                graphics.strokeWeight(1.5);
                graphics.stroke(100, 255, 100, alpha * 0.5);
                const arcEnd = map(progress, 0, 1, 0, TWO_PI);
                graphics.arc(0, 0, 24, 24, -HALF_PI, -HALF_PI + arcEnd);
            }
        }
        
        graphics.pop();
    }
    
    // Draw spawn glow effect for newly spawned butterflies
    drawSpawnGlow(graphics, alpha) {
        graphics.push();
        graphics.noStroke();
        
        // Multi-layered magical glow
        const glowIntensity = this.spawnGlowIntensity;
        const pulse = sin(frameCount * 0.2) * 0.2 + 0.8;
        
        // Outer soft glow - largest and most transparent
        const outerSize = 60 + pulse * 10;
        const outerAlpha = glowIntensity * 30 * (alpha / 255);
        graphics.fill(255, 240, 200, outerAlpha);
        graphics.ellipse(0, 0, outerSize, outerSize * 0.7);
        
        // Middle bright glow
        const middleSize = 40 + pulse * 8;
        const middleAlpha = glowIntensity * 50 * (alpha / 255);
        graphics.fill(255, 230, 150, middleAlpha);
        graphics.ellipse(0, 0, middleSize, middleSize * 0.7);
        
        // Inner intense core
        const innerSize = 25 + pulse * 5;
        const innerAlpha = glowIntensity * 80 * (alpha / 255);
        graphics.fill(255, 255, 220, innerAlpha);
        graphics.ellipse(0, 0, innerSize, innerSize * 0.7);
        
        // Radiating light rays
        if (glowIntensity > 0.5) {
            const numRays = 8;
            for (let i = 0; i < numRays; i++) {
                const angle = (TWO_PI / numRays) * i + frameCount * 0.02;
                const rayLength = 30 + sin(frameCount * 0.1 + i) * 10;
                const rayAlpha = glowIntensity * 40 * (alpha / 255) * pulse;
                
                graphics.push();
                graphics.rotate(angle);
                graphics.fill(255, 255, 200, rayAlpha);
                graphics.beginShape();
                graphics.vertex(0, 0);
                graphics.vertex(rayLength * 0.3, -2);
                graphics.vertex(rayLength, 0);
                graphics.vertex(rayLength * 0.3, 2);
                graphics.endShape(CLOSE);
                graphics.pop();
            }
        }
        
        // Sparkle ring that rotates
        const sparkleRadius = 35;
        const numSparkles = 6;
        for (let i = 0; i < numSparkles; i++) {
            const sparkleAngle = (TWO_PI / numSparkles) * i + frameCount * 0.03;
            const sx = cos(sparkleAngle) * sparkleRadius;
            const sy = sin(sparkleAngle) * sparkleRadius * 0.7; // Isometric compression
            const sparkleSize = 3 + sin(frameCount * 0.2 + i) * 2;
            const sparkleAlpha = glowIntensity * 150 * (alpha / 255);
            
            graphics.fill(255, 255, 255, sparkleAlpha);
            graphics.noStroke();
            graphics.ellipse(sx, sy, sparkleSize, sparkleSize);
        }
        
        graphics.pop();
    }
    
    // Draw warning effect when butterfly needs attention
    drawWarningEffect(graphics, alpha) {
        // Similar to stress effect but with different colors and patterns
        const criticalRatio = 1 - (this.engagementTimer / this.criticalEngagementThreshold);
        const warningIntensity = criticalRatio; // Gets stronger as time runs out
        
        // Pulsing dark aura
        const pulse = sin(frameCount * 0.15) * 0.3 + 0.7; // Faster pulse when critical
        const auraSize = 25 + warningIntensity * 15;
        const auraAlpha = (40 + warningIntensity * 60) * pulse * (alpha / 255);
        
        graphics.push();
        graphics.noStroke();
        
        // Dark purple warning aura
        graphics.fill(100, 50, 150, auraAlpha);
        graphics.ellipse(0, 0, auraSize, auraSize * 0.7);
        
        // Add flickering effect when very critical
        if (this.engagementTimer < this.fadeStartThreshold) {
            const flicker = random() > 0.3 ? 1 : 0.5;
            graphics.fill(150, 50, 100, auraAlpha * flicker);
            graphics.ellipse(0, 0, auraSize * 0.8, auraSize * 0.6);
        }
        
        // Warning particles emitted occasionally
        if (frameCount % 30 === 0 && random() < warningIntensity) {
            // Emit a warning particle (handled by particle system in update)
            if (typeof gameCore !== 'undefined' && gameCore.particleSystem) {
                const particleColor = [100 + random(50), 50, 150 + random(50)];
                gameCore.particleSystem.emit(this.x, this.y, particleColor, 1, 'stress');
            }
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
        
        // Immortal, golden, and bred butterflies restart instead of dying
        if (shouldDie && (this.isImmortal || this.personalityType === 'golden' || this.birthSource === 'bred')) {
            console.log(`🦋 ${this.personalityType === 'golden' ? 'Golden' : 'Immortal'} butterfly restarting lifecycle`);
            this.restartLifecycle();
            return false;
        }
        
        return shouldDie;
    }
    
    // Restart lifecycle for immortal butterflies
    restartLifecycle() {
        this.engagementTimer = this.maxEngagementTimer; // Reset engagement timer
        this.happiness = this.baselineHappiness; // Reset to baseline happiness
        this.state = 'normal';
        this.feeding.cooldowns.clear(); // Clear all feeding cooldowns
        this.pregnancy = null;
        this.visual.hasBeenHovered = false;
        if (typeof sleepSystem !== 'undefined') {
            sleepSystem.setExhaustion(this.id, 0);
            sleepSystem.wakeEntity(this.id, 'lifecycle-restart');
        }
        this.lifeSim.emotions.exhaustion = 0;
        this.lifeSim.lifecycle.deathState = null;
        
        // Reset movement to prevent weird glitches
        if (this.isBoardMovementWorld()) {
            const boardPos = this.ensureBoardPos();
            this.movement.smoothFollowTarget = {
                x: boardPos?.u ?? this.gridPos.x,
                y: boardPos?.v ?? this.gridPos.y,
                u: boardPos?.u ?? this.gridPos.x,
                v: boardPos?.v ?? this.gridPos.y,
                zoneId: boardPos?.zoneId || this.getMovementZoneId()
            };
        } else {
            this.movement.smoothFollowTarget = { x: this.gridPos.x, y: this.gridPos.y };
        }
        
        // Pick a new wander target for active movement
        this.pickNewWanderTarget();
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
        const ability = this.getSpecialAbility();
        if (!ability) return;
        
        const { butterflies, particleSystem } = gameState;
        if (this.visualCueCooldowns.sparkleSeed > 0) {
            this.visualCueCooldowns.sparkleSeed--;
        }
        
        switch (ability) {
            case 'welcome':
                this.updateWarmWelcomeAura(butterflies);
                break;

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
                this.updateSleepAssistAura(butterflies);
                break;

            case 'golden':
                break;
        }
    }

    updateWarmWelcomeAura(butterflies) {
        if (this.happiness <= this.baselineHappiness) return;

        let affectedCount = 0;
        for (const butterfly of butterflies) {
            if (butterfly === this || !butterfly?.id) continue;

            const dx = this.x - butterfly.x;
            const dy = this.y - butterfly.y;
            if ((dx * dx) + (dy * dy) >= 8100) continue;

            this.applyAbilityAura(
                butterfly.id,
                'healing_received_bonus',
                0.2,
                0.35,
                `welcome_heal_${this.id}_${butterfly.id}`,
                { ability: 'welcome', radius: 90 }
            );
            this.applyAbilityAura(
                butterfly.id,
                'panic_resistance',
                0.18,
                0.35,
                `welcome_panic_${this.id}_${butterfly.id}`,
                { ability: 'welcome', radius: 90 }
            );
            affectedCount++;
        }

        if (affectedCount > 0 && frameCount % 24 === 0) {
            this.emitAbilityVisual('welcome');
        }
    }
    
    // Cautious butterfly - leaves sparkle trail when happy
    updateSparkleTrail(particleSystem) {
        if (this.happiness <= this.baselineHappiness) return;
        const crowdSuppression = this.getCrowdSuppressionFactor(90);
        const zoneId = this.currentZoneId || this.lifeSim?.lifecycle?.currentZoneId || null;
        if (crowdSuppression <= 0.08) {
            this.abilities.sparkleTrail.length = 0;
            return;
        }
        
        // Add current position to trail
        this.abilities.sparkleTrail.push({
            x: this.x,
            y: this.y,
            life: crowdSuppression < 0.5 ? 36 : 60 // Shorter-lived in busy scenes
        });
        
        // Update and emit sparkles from trail
        for (let i = this.abilities.sparkleTrail.length - 1; i >= 0; i--) {
            const sparkle = this.abilities.sparkleTrail[i];
            sparkle.life--;
            
            // Emit sparkle particle every few frames
            if (crowdSuppression > 0.35 && sparkle.life % (crowdSuppression < 0.6 ? 14 : 10) === 0) {
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
        const maxTrailLength = crowdSuppression < 0.5 ? 12 : 20;
        if (this.abilities.sparkleTrail.length > maxTrailLength) {
            this.abilities.sparkleTrail.shift();
        }

        if (zoneId && this.visualCueCooldowns.sparkleSeed <= 0 && this.abilities.sparkleTrail.length >= 8 && random() < 0.01) {
            const anchor = this.abilities.sparkleTrail[0];
            if (gameCore?.queuePollenPlanting?.(this.id, zoneId, anchor.x, anchor.y, { source: 'sparkle-trail' })) {
                this.visualCueCooldowns.sparkleSeed = 360;
            }
        }
    }
    
    // Energetic butterfly - creates speed zones
    updateSpeedZone(butterflies) {
        if (this.happiness <= this.baselineHappiness) return;

        if (this.getAbilityCooldownRemaining('speedzone_pulse') > 0) return;

        let affectedCount = 0;
        for (const butterfly of butterflies) {
            if (butterfly === this || !butterfly?.id) continue;

            const dx = this.x - butterfly.x;
            const dy = this.y - butterfly.y;
            if ((dx * dx) + (dy * dy) >= 10000) continue;

            this.applyAbilityAura(
                butterfly.id,
                'movement_speed_bonus',
                0.5,
                3,
                `speedzone_${this.id}_${butterfly.id}`,
                { ability: 'speedzone', radius: 100 }
            );
            affectedCount++;
        }

        if (affectedCount > 0) {
            this.setAbilityCooldown('speedzone_pulse', 5, { durationSeconds: 5 });
            this.emitAbilityVisual('speedzone');
        }
    }
    
    // Wise butterfly - teaches nearby butterflies
    updateTeachingAura(butterflies) {
        if (this.happiness <= 50) { // Need to be reasonably happy to teach
            this.abilities.teachingAura = false;
            return;
        }
        
        const teachingPulseRadius = gameConfig?.balance?.social?.teachingPulseRadius ?? 80;
        this.abilities.teachingAura = true;
        
        if (this.getAbilityCooldownRemaining('teaching_pulse') <= 0) {
            if (typeof eventBus !== 'undefined') {
                eventBus.emit('teaching:pulse', {
                    teacherId: this.id,
                    x: this.x,
                    y: this.y,
                    radius: teachingPulseRadius
                });
            }
            this.emitAbilityVisual('teacher', { abilityRadius: teachingPulseRadius });
            this.setAbilityCooldown('teaching_pulse', 2, { durationSeconds: 2 });
        }

        for (const butterfly of butterflies) {
            if (butterfly === this || !butterfly?.id) continue;

            const dx = this.x - butterfly.x;
            const dy = this.y - butterfly.y;
            if ((dx * dx) + (dy * dy) >= 6400) continue;

            this.applyAbilityAura(
                butterfly.id,
                'healing_received_bonus',
                0.5,
                0.35,
                `teacher_heal_${this.id}_${butterfly.id}`,
                { ability: 'teacher', radius: 80 }
            );
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
            if (dx*dx + dy*dy < ((gameConfig?.balance?.social?.trustCascadeRadius ?? 150) ** 2)) {
                this.abilities.trustCascadeCache.push({
                    id: butterfly.id,
                    x: butterfly.x,
                    y: butterfly.y
                });
            }
        }
        
        // Visual feedback - green wave with affected butterflies
        if (this.abilities.trustCascadeCache.length > 0) {
            if (typeof eventBus !== 'undefined') {
                eventBus.emit('trust:cascade', {
                    sourceId: this.id,
                    x: this.x,
                    y: this.y,
                    radius: gameConfig?.balance?.social?.trustCascadeRadius ?? 150,
                    butterflies: this.abilities.trustCascadeCache
                });
            }
            this.emitAbilityVisual('cascade', {
                abilityRadius: gameConfig?.balance?.social?.trustCascadeRadius ?? 150
            });
        }
    }

    updateSleepAssistAura(butterflies) {
        if (this.happiness <= this.baselineHappiness) return;
        if (typeof sleepSystem === 'undefined') return;

        for (const butterfly of butterflies) {
            if (butterfly === this || !butterfly?.id) continue;

            const dx = this.x - butterfly.x;
            const dy = this.y - butterfly.y;
            if ((dx * dx) + (dy * dy) >= 7225) continue;

            sleepSystem.requestSleepAssist(butterfly.id, this.id, 'comfort', 0.18);
            this.applyAbilityAura(
                butterfly.id,
                'sleep_comfort_bonus',
                0.2,
                0.35,
                `shimmer_comfort_${this.id}_${butterfly.id}`,
                { ability: 'shimmer', radius: 85 }
            );
            this.applyAbilityAura(
                butterfly.id,
                'wake_resistance',
                0.16,
                0.35,
                `shimmer_wake_${this.id}_${butterfly.id}`,
                { ability: 'shimmer', radius: 85 }
            );
            this.applyAbilityAura(
                butterfly.id,
                'sleep_recovery_multiplier',
                0.18,
                0.35,
                `shimmer_recovery_${this.id}_${butterfly.id}`,
                { ability: 'shimmer', radius: 85 }
            );
        }

        if (frameCount % 30 === 0) {
            this.emitAbilityVisual('shimmer');
        }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
}

