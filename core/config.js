// Centralized game configuration
const gameConfig = {
    // Rendering settings
    rendering: {
        useSprites: true,           // Set to false to revert to procedural butterfly rendering
        butterflyVisualScale: 1.6   // 60% larger visual rendering (interaction radii unchanged)
    },

    // Canvas settings
    canvas: {
        baseWidth: 800,
        baseHeight: 450,
        targetWidth: 800,
        targetHeight: 450,
        backgroundColor: '#f4e8dc'
    },
    
    // Grid settings
    grid: {
        cellSize: 16,  // Restored original working value
        gridWidth: 18,
        gridHeight: 18,
        debugGridSize: 32, // For debug mode display
        // Grid offset to align with background image
        gridOffset: {
            x: 10,   // Move grid up and left to fix "one too high" issue
            y: 8    // Reduced from previous values
        }
    },
    
    // Isometric view settings
    isometric: {
        tileWidth: 18,
        tileHeight: 9,
        offsetX: 400, // Center of canvas
        offsetY: 100,
        bounds: {
            minX: 0,
            maxX: 17,
            minY: 0,
            maxY: 17
        }
    },
    
    // Entity settings
    entities: {
        maxButterflies: 12,
        maxFlowers: 6,
        
        // Height offsets for isometric depth
        heightOffset: {
            butterfly: 10,
            flower: 0,
            pixel: 0
        },
        
        // Butterfly configuration
        butterfly: {
            size: 12,
            speed: 0.008,
            wanderTimer: { min: 40, max: 90 },
            maxWanderDistance: 3,
            lifetime: 10000,
            personalities: ['brave', 'cautious', 'curious'],
            colors: [
                [[255, 140, 60], [255, 220, 120]],   // Orange/yellow
                [[220, 100, 150], [255, 180, 200]],  // Pink/coral
                [[150, 120, 200], [200, 170, 255]],  // Purple/lavender
                [[100, 180, 140], [150, 220, 180]]   // Teal/mint
            ]
        },
        
        // Flower configuration
        flower: {
            types: ['daisy', 'tulip', 'rose', 'sunflower', 'lily'],
            stemHeight: 16,
            stageDurations: {
                bloom: 1200,    // 20 seconds at 60fps (doubled for gameplay)
                mature: 2400,   // 40 seconds (doubled for gameplay)
                wilting: 1200,  // 20 seconds (doubled for gameplay)
                dissolve: 360   // 6 seconds (doubled for gameplay)
            },
            palettes: [
                { petals: [255, 180, 120], center: [255, 240, 180] }, // Warm orange
                { petals: [255, 150, 200], center: [255, 255, 220] }, // Pink
                { petals: [200, 150, 255], center: [255, 230, 150] }, // Purple
                { petals: [255, 220, 150], center: [255, 255, 200] }, // Yellow
                { petals: [180, 220, 255], center: [255, 255, 240] }  // Light blue
            ]
        }
    },
    
    // Particle system settings
    particles: {
        maxParticles: 100, // Active particle limit, pool pre-allocates 2x this amount
        gravity: 0.1,
        pixelSize: 2,
        bounce: 0.3,
        friction: 0.99,
        
        // Particle types
        types: {
            scale: {
                lifetime: -1, // Infinite until settled
                fadeSpeed: 0
            },
            joy: {
                lifetime: 255,
                fadeSpeed: 2
            },
            stress: {
                lifetime: 180, // Shorter lifetime than joy pixels
                fadeSpeed: 3   // Faster fade than joy pixels (more frantic)
            },
            happy: {
                lifetime: -1, // Infinite lifetime until absorbed
                fadeSpeed: 0  // No fade for happy pixels
            },
            happy_visual: {
                lifetime: 200, // Shorter lifetime for visual effect particles
                fadeSpeed: 1   // Gentle fade for visual particles
            }
        }
    },
    
    // Color pool settings
    colorPools: {
        radius: 20,
        requiredPixels: 50,
        pulseSpeed: 0.1,
        spawnDelay: 180, // 3 seconds
        gridSize: 40
    },
    
    // Interaction settings
    interaction: {
        stillFramesRequired: 120, // 2 seconds for gentle hover
        cursorZoneRadius: 30,
        
        // Butterfly interaction zones
        butterflyZones: {
            brave: {
                comfort: 60,
                flee: 40
            },
            cautious: {
                comfort: 100,
                flee: 80
            },
            curious: {
                comfort: 80,
                flee: 60
            }
        }
    },
    
    // Visual effects
    effects: {
        shadowOpacity: 50,
        glowPulseSpeed: 0.1,
        swaySpeed: { min: 0.02, max: 0.03 },
        swayAmount: 0.1
    },
    
    // Debug mode settings
    debug: {
        enabled: false,
        showGrid: true,
        showZones: true,
        showCoordinates: true,
        showFPS: true,
        gardenTimeControls: {
            enabledInNormalPlay: false,
            debugSpeedPresets: [1, 2, 4]
        },
        auditTools: {
            scenarioPresets: true,
            snapshotDiff: true,
            invariantChecker: true,
            eventTimeline: true,
            saveLoadVerifier: true,
            screenshotNotes: true
        }
    },

    accessibility: {
        reducedMotion: false,
        battleMotionSimplify: true,
        highContrastUI: false,
        colorblindSafeIndicators: true,
        strongSelectionOutlines: true,
        trailVisibility: 'full',
        backgroundAtmosphere: 'full',
        statusIndicatorDensity: 'simplified',
        uiScale: 1
    },

    simulation: {
        defaultTimeScale: 1,
        battleTimeScales: [1, 2],
        frameRate: 60,
        fixedDeltaSeconds: 1 / 60
    },

    balance: {
        sleep: {
            assistStrengthDefault: 0.15,
            movementMultiplierSettling: 0.25,
            wingAnimationMultiplierSettling: 0.35,
            wingAnimationMultiplierAsleep: 0.08,
            visualYOffsetSettling: 1.5,
            visualYOffsetAsleep: 3,
            visualTiltSettling: 0.08,
            visualTiltAsleep: 0.18,
            passiveExhaustionBaseGain: 0.006,
            passiveExhaustionRestMultiplier: 0.004,
            passiveExhaustionInsomniaMultiplier: 0.002,
            settleThresholdBase: 0.62,
            settleThresholdFloor: 0.28,
            settleThresholdInsomniaMultiplier: 0.08,
            settleThresholdComfortMultiplier: 0.05,
            settlingDurationSeconds: 1.5,
            normalRecoveryBaseRate: 0.032,
            normalRecoveryComfortMultiplier: 0.014,
            oversleepPressureGainMultiplier: 0.02,
            wakeThresholdBase: 0.18,
            wakeThresholdFloor: 0.08,
            wakeThresholdResistanceMultiplier: 0.03,
            wakeMinimumSleepSeconds: 4,
            oversleepThresholdBase: 0.35,
            oversleepThresholdBiasMultiplier: 0.15,
            oversleepRecoveryRate: 0.02,
            oversleepPressureDecayRate: 0.016,
            forcedSleepRecoveryRate: 0.014,
            passiveOversleepPressureDecayRate: 0.004
        },
        social: {
            teachingLessonDurationSeconds: 1.6,
            teachingPulseRadius: 76,
            teachingPulseMemoryValence: 0.22,
            teachingPulseMemoryStrength: 0.26,
            teachingPulseEdgeTrust: 0.02,
            teachingPulseEdgeAdmiration: 0.035,
            teachingPulseEdgeComfort: 0.015,
            teachingPulseRoutineReinforcement: 0.025,
            trustCascadeRadius: 132,
            trustCascadeMemoryValence: 0.28,
            trustCascadeMemoryStrength: 0.34,
            trustCascadeEdgeTrust: 0.035,
            trustCascadeEdgeComfort: 0.025,
            trustCascadeEdgeAdmiration: 0.015,
            lessonUpbringingStrength: 0.28,
            lessonRoutineReinforcement: 0.05,
            lessonInterpretationClarityGain: 0.01,
            lessonMemoryValence: 0.36,
            lessonMemoryStrength: 0.4,
            lessonEdgeTrust: 0.03,
            lessonEdgeAdmiration: 0.04,
            lessonEdgeComfort: 0.02,
            listenerTeachingRoutineReinforcement: 0.035,
            teacherTeachingRoutineReinforcement: 0.025,
            teachingBoostFrames: 16
        },
        hybrid: {
            pheromoneRadius: 132,
            matingDistance: 16,
            matingDurationFrames: 150,
            pheromoneCooldownFrames: 21600,
            adultHardCap: 50,
            eggHatchFrames: {
                min: 28800,
                max: 39600
            },
            cocoonHatchFrames: {
                min: 28800,
                max: 39600
            },
            bredFertilityUses: 1
        }
    },

    world: {
        layout: 'single-zone-foundation',
        overviewMode: false,
        viewModes: ['overview', 'focused-garden', 'battle'],
        zones: [
            {
                id: 'garden-core',
                label: 'Garden Core',
                kind: 'garden',
                poolAllowed: true,
                doorwayIds: [],
                adjacentZoneIds: [],
                bounds: {
                    minX: 0,
                    maxX: 17,
                    minY: 0,
                    maxY: 17
                },
                renderProfile: {
                    movingBackgroundEffectsInFocus: true,
                    movingBackgroundEffectsInOverview: false,
                    afterimageTrailsInFocus: true,
                    afterimageTrailsInBattle: false
                }
            }
        ]
    },

    registries: {
        actionFamilies: [
            'idle',
            'wander',
            'seek_resource',
            'care_for_vulnerable',
            'teach_or_listen',
            'sleep',
            'socialize',
            'reposition',
            'battle'
        ],
        statusFamilies: [
            'healing_received_bonus',
            'panic_resistance',
            'aggression_suppression',
            'attack_speed_bonus',
            'movement_speed_bonus',
            'energetic_state_boost',
            'reposition_guidance',
            'cooldown_intelligence',
            'sleep_comfort_bonus',
            'wake_resistance',
            'forced_sleep',
            'forced_sleep_immunity',
            'sleep_recovery_multiplier'
        ],
        sleepSubtypes: [
            'settling_sleep',
            'normal_sleep',
            'oversleeping',
            'forced_battle_sleep'
        ],
        battleStates: [
            'inactive',
            'snapshotting',
            'active',
            'resolving',
            'committing'
        ],
        persistenceFieldClasses: {
            durable: 'durable',
            derived: 'derived',
            runtime: 'runtime'
        }
    },

    systems: {
        phaseFoundationOrder: [
            'zoneSystem',
            'statusSystem',
            'behaviorSystem',
            'objectSystem',
            'sleepSystem',
            'teachingSystem',
            'battleSystem',
            'saveSystem'
        ]
    }
};

// Helper function to get nested config values
function getConfig(path) {
    return path.split('.').reduce((obj, key) => obj[key], gameConfig);
}

// Helper function to update config values
function setConfig(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], gameConfig);
    target[lastKey] = value;
}
