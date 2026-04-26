// Centralized game configuration
const PAPILIONEM_WORLD_SOURCE = {
    width: 5504,
    height: 3072
};

const PAPILIONEM_PERFORMANCE_FLAG_OVERRIDE_KEY = 'papilionem-performance-flag-overrides-v1';

function getPapilionemPerformanceFlagOverrides() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return {};
    }

    try {
        const directOverrides = window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__;
        if (directOverrides && typeof directOverrides === 'object') {
            return { ...directOverrides };
        }
    } catch (_error) {
        // Ignore override lookup failures.
    }

    try {
        const raw = localStorage.getItem(PAPILIONEM_PERFORMANCE_FLAG_OVERRIDE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? { ...parsed } : {};
    } catch (_error) {
        return {};
    }
}

function mapWorldPointToCanvas(x, y) {
    return {
        x: (x / PAPILIONEM_WORLD_SOURCE.width) * 800,
        y: (y / PAPILIONEM_WORLD_SOURCE.height) * 450
    };
}

function mapWorldRectToCanvas(minX, minY, maxX, maxY) {
    const topLeft = mapWorldPointToCanvas(minX, minY);
    const bottomRight = mapWorldPointToCanvas(maxX, maxY);
    return {
        minX: topLeft.x,
        minY: topLeft.y,
        maxX: bottomRight.x,
        maxY: bottomRight.y
    };
}

function canvasPoint(x, y) {
    return { x, y };
}

function buildBufferedSegmentPolygon(startPoint, endPoint, halfWidth = 22, extension = 10) {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const ux = dx / magnitude;
    const uy = dy / magnitude;
    const px = -uy;
    const py = ux;
    const expandedStart = {
        x: startPoint.x - (ux * extension),
        y: startPoint.y - (uy * extension)
    };
    const expandedEnd = {
        x: endPoint.x + (ux * extension),
        y: endPoint.y + (uy * extension)
    };
    return [
        {
            x: expandedStart.x + (px * halfWidth),
            y: expandedStart.y + (py * halfWidth)
        },
        {
            x: expandedEnd.x + (px * halfWidth),
            y: expandedEnd.y + (py * halfWidth)
        },
        {
            x: expandedEnd.x - (px * halfWidth),
            y: expandedEnd.y - (py * halfWidth)
        },
        {
            x: expandedStart.x - (px * halfWidth),
            y: expandedStart.y - (py * halfWidth)
        }
    ];
}

function clampCanvasValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function scaleCanvasPolygon(polygon, scaleX = 1, scaleY = 1, clampBounds = {}) {
    if (!Array.isArray(polygon) || polygon.length < 3) return polygon || [];
    const center = polygon.reduce((acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
    }, { x: 0, y: 0 });
    center.x /= polygon.length;
    center.y /= polygon.length;

    const minX = clampBounds.minX ?? 0;
    const maxX = clampBounds.maxX ?? 800;
    const minY = clampBounds.minY ?? 0;
    const maxY = clampBounds.maxY ?? 450;

    return polygon.map(point => ({
        x: clampCanvasValue(center.x + ((point.x - center.x) * scaleX), minX, maxX),
        y: clampCanvasValue(center.y + ((point.y - center.y) * scaleY), minY, maxY)
    }));
}

function buildPlacementRegionFromPolygon(polygon, insetX = 18, insetY = 18) {
    if (!Array.isArray(polygon) || polygon.length < 3) return null;
    const bounds = polygon.reduce((acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxX: Math.max(acc.maxX, point.x),
        maxY: Math.max(acc.maxY, point.y)
    }), {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    });
    return {
        minX: bounds.minX + insetX,
        minY: bounds.minY + insetY,
        maxX: bounds.maxX - insetX,
        maxY: bounds.maxY - insetY
    };
}

const PAPILIONEM_BASE_ROAM_POLYGON = [
    canvasPoint(156, 144),
    canvasPoint(236, 112),
    canvasPoint(418, 96),
    canvasPoint(608, 102),
    canvasPoint(688, 132),
    canvasPoint(788, 264),
    canvasPoint(788, 408),
    canvasPoint(12, 408),
    canvasPoint(12, 300)
];

const PAPILIONEM_UI_RESERVE_TOP = 304;

function createDoorwayTraversalProfile(profile, direction) {
    return {
        fromAnchor: { ...profile.path, direction },
        approachLane: profile.approachLane ? { ...profile.approachLane, direction } : null,
        lineupAnchor: profile.lineup ? { ...profile.lineup, direction } : null,
        coverAnchor: { ...profile.cover, direction },
        toAnchor: { ...profile.spawn, direction },
        settleAnchor: profile.settle ? { ...profile.settle, direction } : null
    };
}

const PAPILIONEM_LAND_MAP = {
    roamPolygon: scaleCanvasPolygon(PAPILIONEM_BASE_ROAM_POLYGON, 1, 1, {
        minX: 12,
        maxX: 788,
        minY: 96,
        maxY: 410
    }),
    doorways: {
        left: {
            path: canvasPoint(268, 132),
            approachLane: {
                y: 112,
                minX: 104,
                maxX: 698
            },
            lineup: canvasPoint(312, 112),
            cover: canvasPoint(230, 104),
            spawn: canvasPoint(194, 100),
            settle: canvasPoint(282, 154)
        },
        right: {
            path: canvasPoint(546, 124),
            approachLane: {
                y: 110,
                minX: 104,
                maxX: 698
            },
            lineup: canvasPoint(498, 110),
            cover: canvasPoint(585, 102),
            spawn: canvasPoint(622, 98),
            settle: canvasPoint(532, 150)
        }
    },
    zones: {
        'ivy-cloister': mapWorldRectToCanvas(320, 860, 2470, 1940),
        'sun-court': mapWorldRectToCanvas(2860, 730, 5050, 1760),
        'moss-hollow': mapWorldRectToCanvas(300, 1880, 2450, 2660),
        'pool-heart': mapWorldRectToCanvas(3040, 1880, 5140, 2660)
    }
};

const PAPILIONEM_SECTION_PLACEMENT_REGION = buildPlacementRegionFromPolygon(
    PAPILIONEM_LAND_MAP.roamPolygon,
    16,
    12
);

PAPILIONEM_LAND_MAP.doorwayAvoidPolygons = [
    buildBufferedSegmentPolygon(PAPILIONEM_LAND_MAP.doorways.left.path, PAPILIONEM_LAND_MAP.doorways.left.spawn, 28, 24),
    buildBufferedSegmentPolygon(PAPILIONEM_LAND_MAP.doorways.right.path, PAPILIONEM_LAND_MAP.doorways.right.spawn, 28, 24)
];

const PAPILIONEM_BATTLE_ARENA = {
    bounds: mapWorldRectToCanvas(290, 276, 5256, 2852),
    laneDividerX: mapWorldPointToCanvas(2770, 0).x,
    rects: {
        leftSupport: mapWorldRectToCanvas(290, 972, 851, 2464),
        leftField: mapWorldRectToCanvas(851, 276, 2770, 2852),
        rightField: mapWorldRectToCanvas(2770, 276, 4698, 2852),
        rightSupport: mapWorldRectToCanvas(4698, 972, 5256, 2464)
    },
    slotCounts: {
        supportRows: 2,
        fieldCols: 4,
        fieldRows: 4
    }
};

  const runtimeFlagOverrides = getPapilionemPerformanceFlagOverrides();

  const gameConfig = {
    performance: {
        focusedGardenUpdateBudgetMs: 16,
        canvas: {
            defaultPixelDensityCap: 2,
            largeCanvasPixelDensityCap: 1,
            highResolutionPixelThreshold: 1300000,
            maxDisplayWidth: 1440,
            maxDisplayHeight: 810,
            uiLayerPixelDensity: 2
        },
        smoothedButterflySpriteMaxVisible: 4,
        telemetry: {
            sessionTimelineMax: 480,
            frameHistoryMax: 720,
            runtimeIssueMax: 96,
            eventHistoryMax: 2000,
            textMeasureCacheMaxEntries: 4096
        },
        cache: {
            maxBakedSprites: 224,
            wingDimensionStep: 1,
            wingSpreadBuckets: 24,
            wingPoseSpreadBuckets: 16,
            wingPoseSpreadDelta: 0.16,
            wingPoseForeOnly: true,
            wingPoseBattleOnly: true,
            flowerWaveBuckets: 12
        },
        flags: {
        pauseWhenHidden: false,
        asyncImageDecode: false,
        telemetryRingCap: false,
        textMeasureCache: false,
            saveStoreIndexedDbOnly: false,
            shellUiDom: true,
            memoryAttributionEnabled: false,
            entityObjectPools: false,
            bakedCreatureSprites: true,
            bakedFlowerHeads: true,
            spriteAtlas: false,
            simCadenceSplit: true,
            compositeBlocksLayer: true,
            compositeBlocksLayerReuse: true,
            directPresentFlowers: false,
            compositeDirtyRegions: true,
            compositeNativeDraw: true,
            mainRenderScale: 1,
            adaptiveQualityScaler: false,
            workerOffload: false,
            trailsQualityReduced: true,
            trailsQualityFull: true,
            rendererBatchedWebGL: false,
            ...runtimeFlagOverrides
        }
    },

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
        maxButterflies: 500,
        wildTargetCount: 12,
        maxFlowers: 24,
        blocksPerZone: 27,
        placementEdgeInset: 22,
        
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
            dispersal: {
                candidateCount: 16,
                sectorMemoryLimit: 6,
                anchorMemoryLimit: 6,
                visitRecordIntervalFrames: 96,
                underusedSectorBonus: 0.35,
                noveltyBonus: 0.2,
                localCrowdPenalty: 0.45,
                anchorSaturationPenalty: 0.35,
                recentSelfReusePenalty: 0.25,
                edgeDiscomfortPenalty: 0.15
            },
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
            types: ['daisy', 'tulip', 'sprout', 'lavender', 'bush'],
            visualStyle: 'garden-bloom',
            stemHeight: 16,
            spawnMinDistance: 52,
            preferredSpacing: 96,
            placementAvoidDoorwayRadius: 42,
            placementAvoidBlockRadius: 14,
            sectorGrid: {
                cols: 4,
                rows: 3
            },
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
        },

        block: {
            renderWidth: 20,
            renderHeight: 20,
            outlineWeight: 1.25,
            depthX: 7,
            depthY: 4,
            scatterColumns: 6,
            scatterRows: 5,
            interactionRadius: 18,
            placementAvoidFlowerRadius: 20,
            shelterThresholdBlocks: 6,
            maxStackHeight: 12
        },

        spatialFootprints: {
            butterfly: {
                widthMode: 'size-scale',
                widthScale: 1.08,
                minWidth: 10,
                radiusScale: 0.48,
                minRadius: 7,
                clearance: 1,
                occupancyRadius: 24,
                separationDistanceScale: 0.92,
                minSeparationDistance: 11
            },
            caterpillar: {
                widthMode: 'size-scale',
                widthScale: 1,
                minWidth: 18,
                radiusScale: 0.46,
                minRadius: 9,
                clearance: 2,
                occupancyRadius: 28,
                separationDistanceScale: 0.94,
                minSeparationDistance: 14
            },
            flower: {
                widthMode: 'size-scale',
                widthScale: 1,
                minWidth: 12,
                radiusScale: 0.54,
                minRadius: 7,
                clearance: 1,
                occupancyRadius: 18
            },
            egg: {
                widthMode: 'size-scale',
                widthScale: 0.92,
                minWidth: 12,
                radiusScale: 0.5,
                minRadius: 6,
                clearance: 1,
                occupancyRadius: 16
            },
            chrysalis: {
                widthMode: 'size-scale',
                widthScale: 1.24,
                minWidth: 15,
                radiusScale: 0.5,
                minRadius: 8,
                clearance: 1,
                occupancyRadius: 20
            },
            block: {
                widthMode: 'render-scale',
                widthScale: 1,
                minWidth: 12,
                radiusScale: 0.42,
                minRadius: 8,
                clearanceMode: 'stack-index-plus-one',
                minClearance: 1,
                occupancyRadiusBase: 10,
                occupancyRadiusPerStack: 2,
                connectDistanceScale: 3,
                minConnectDistance: 42,
                columnRadiusBase: 10,
                columnRadiusPerStack: 2,
                columnQueryScale: 0.62,
                openingConflictScale: 0.92
            }
        }
    },
    
    // Particle system settings
    particles: {
        maxParticles: 80, // Slightly tighter active particle limit for clearer long-soak scenes
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
            pollen: {
                lifetime: 180,
                fadeSpeed: 3
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
        battleMotionSimplify: false,
        highContrastUI: false,
        colorblindSafeIndicators: true,
        strongSelectionOutlines: true,
        trailVisibility: 'off',
        backgroundAtmosphere: 'full',
        statusIndicatorDensity: 'simplified',
        uiScale: 1
    },

    simulation: {
        defaultTimeScale: 1,
        battleTimeScales: [1, 2],
        frameRate: 60,
        fixedDeltaSeconds: 1 / 60,
        cadence: {
            lifeSimDeepIntervalFrames: 24,
            lifeSimDeepBudgetMs: 6,
            lifeSimBattleBypass: true,
            lifeSimZoneTravelBypass: true,
            mlScoringIntervalFrames: 48,
            mlScoringBudgetMs: 3.5,
            mlBattleBypass: true,
            mlZoneTravelBypass: true,
            ecologyRefreshIntervalFrames: 30,
            ecologyRefreshBudgetMs: 2.5
        }
    },

    ml: {
        runtime: 'local-static-policy',
        modelVersionId: 'm4-garden-policy-v1',
        featureSchemaVersion: 'm4-feature-schema-v1',
        traceSchemaVersion: 'm4-trace-schema-v1',
        policyArtifactPath: 'assets/ml/m4-garden-policy.json',
        policyArtifactFormat: 'linear-policy-json',
        useModelInference: true,
        gardenCadenceFrames: 20,
        battleCadenceFrames: 1,
        alternativeCount: 2,
        decisionHistoryLimit: 6,
        contract: {
            version: 'c1-runtime-contract-v1',
            currentRuntimeShape: 'local-static-policy-json',
            currentArtifactFormat: 'linear-policy-json',
            lockedFutureRuntime: 'onnx-runtime-web',
            lockedFutureArtifactFormat: 'onnx-bundle',
            trainingPath: 'offline-supervised-imitation',
            corpusSource: 'heuristic-traces-plus-curated-audit-scenarios',
            offlineOnly: true,
            allowServerInference: false,
            allowOnlineTraining: false,
            fallbackMode: 'heuristic-fallback-required',
            spatialHookOwner: 'structureSystem',
            hookSchemaVersion: 'c1-shared-spatial-hooks-v1',
            sharedSpatialHooks: ['verticality', 'structureRole', 'pathState', 'bodyFit']
        }
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
        training: {
            drillCooldownSeconds: 4.25,
            stationRadius: 42,
            maxListenersPerDrill: 3,
            movementPriority: 7,
            movementWobble: 0.08,
            impactChance: 0.04,
            impactRadius: 22,
            impactImpulse: 3.8,
            impactFrames: 4,
            impactCooldownFrames: 45,
            lessonTrustBonus: 0.02,
            lessonAdmirationBonus: 0.03,
            lessonComfortBonus: 0.015,
            interpretationClarityBonus: 0.02,
            routineReinforcementBonus: 0.04,
            visualMarkerPulseSeconds: 1.8
        },
        hybrid: {
            pheromoneRadius: 132,
            matingDistance: 16,
            matingDurationFrames: 150,
            pheromoneCooldownFrames: 21600,
            adultHardCap: 150,
            zoneAdultSoftCap: 14,
            zoneReservationCap: 2,
            matingFreezePressure: 0.82,
            zoneFreezePressure: 0.9,
            minZoneFlowersForBreeding: 2,
            eggHatchFrames: {
                min: 2700,
                max: 5400
            },
            cocoonHatchFrames: {
                min: 5400,
                max: 10800
            },
            bredFertilityUses: 1,
            mutationChance: 0.2,
            majorMutationChance: 0.06,
            mutationDeltaMin: 0.08,
            mutationDeltaMax: 0.24,
            majorMutationDeltaMin: 0.18,
            majorMutationDeltaMax: 0.42,
            maxMutatedTraits: 2
        },
        migration: {
            autoHabitatTravel: true,
            decisionIntervalFrames: 360,
            routeDurationFrames: 60,
            arrivalSettleFrames: 42,
            exitDurationFrames: 42,
            overcrowdingBias: 0.62,
            mismatchThreshold: 0.14,
            maxConcurrentTravelers: 3,
            wildArrivalIntervalFrames: 720
        }
    },

    presentation: {
        renderCommunicationIndicators: false
    },

    world: {
        layout: 'land-sanctum-world',
        renderMode: 'section-scenes',
        overviewMode: false,
        viewModes: ['overview', 'focused-garden', 'battle'],
        mapGeometry: {
            sourceSize: { ...PAPILIONEM_WORLD_SOURCE },
            roamPolygon: PAPILIONEM_LAND_MAP.roamPolygon,
            placementRegion: PAPILIONEM_SECTION_PLACEMENT_REGION,
            doorwayPassages: PAPILIONEM_LAND_MAP.doorways,
            doorwayAvoidPolygons: PAPILIONEM_LAND_MAP.doorwayAvoidPolygons,
            uiReserveTop: PAPILIONEM_UI_RESERVE_TOP,
            groundPlane: {
                ellipseScaleY: 0.56,
                haloScaleY: 0.6,
                centerYOffset: 3
            }
        },
        doorways: [
            {
                id: 'ivy-left-to-moss',
                label: 'Open Land NW -> Open Land SW',
                fromZoneId: 'ivy-cloister',
                toZoneId: 'moss-hollow',
                grid: { x: 4, y: 8 },
                ...createDoorwayTraversalProfile(PAPILIONEM_LAND_MAP.doorways.left, 'left')
            },
            {
                id: 'ivy-right-to-sun',
                label: 'Open Land NW -> Training Grounds',
                fromZoneId: 'ivy-cloister',
                toZoneId: 'sun-court',
                grid: { x: 11, y: 4 },
                ...createDoorwayTraversalProfile(PAPILIONEM_LAND_MAP.doorways.right, 'right')
            },
            {
                id: 'sun-left-to-ivy',
                label: 'Training Grounds -> Open Land NW',
                fromZoneId: 'sun-court',
                toZoneId: 'ivy-cloister',
                grid: { x: 10, y: 4 },
                ...createDoorwayTraversalProfile(PAPILIONEM_LAND_MAP.doorways.left, 'left')
            },
            {
                id: 'sun-right-to-pool',
                label: 'Training Grounds -> Open Land SE',
                fromZoneId: 'sun-court',
                toZoneId: 'pool-heart',
                grid: { x: 14, y: 7 },
                ...createDoorwayTraversalProfile(PAPILIONEM_LAND_MAP.doorways.right, 'right')
            },
            {
                id: 'pool-left-to-moss',
                label: 'Open Land SE -> Open Land SW',
                fromZoneId: 'pool-heart',
                toZoneId: 'moss-hollow',
                grid: { x: 9, y: 12 },
                ...createDoorwayTraversalProfile(PAPILIONEM_LAND_MAP.doorways.left, 'left')
            },
            {
                id: 'pool-right-to-sun',
                label: 'Open Land SE -> Training Grounds',
                fromZoneId: 'pool-heart',
                toZoneId: 'sun-court',
                grid: { x: 14, y: 10 },
                ...createDoorwayTraversalProfile(PAPILIONEM_LAND_MAP.doorways.right, 'right')
            },
            {
                id: 'moss-left-to-ivy',
                label: 'Open Land SW -> Open Land NW',
                fromZoneId: 'moss-hollow',
                toZoneId: 'ivy-cloister',
                grid: { x: 4, y: 13 },
                ...createDoorwayTraversalProfile(PAPILIONEM_LAND_MAP.doorways.left, 'left')
            },
            {
                id: 'moss-right-to-pool',
                label: 'Open Land SW -> Open Land SE',
                fromZoneId: 'moss-hollow',
                toZoneId: 'pool-heart',
                grid: { x: 8, y: 13 },
                ...createDoorwayTraversalProfile(PAPILIONEM_LAND_MAP.doorways.right, 'right')
            }
        ],
        zones: [
            {
                id: 'ivy-cloister',
                label: 'Open Land NW',
                kind: 'open-land',
                poolAllowed: false,
                doorwayIds: ['ivy-left-to-moss', 'ivy-right-to-sun'],
                adjacentZoneIds: ['sun-court', 'moss-hollow'],
                bounds: {
                    minX: 0,
                    maxX: 8,
                    minY: 0,
                    maxY: 8
                },
                renderProfile: {
                    movingBackgroundEffectsInFocus: false,
                    movingBackgroundEffectsInOverview: false,
                    afterimageTrailsInFocus: true,
                    afterimageTrailsInBattle: false,
                    overlayTint: [121, 145, 96, 42],
                    assetSet: 'land',
                    rotationDegrees: 0,
                    overviewSlot: { col: 0, row: 0 },
                    screenRegion: PAPILIONEM_LAND_MAP.zones['ivy-cloister']
                },
                ecologyProfile: {
                    identityLabel: 'Quiet cloister',
                    identityTags: ['social', 'rest', 'teaching'],
                    settleBias: 0.42,
                    preferredPersonalities: ['friendly', 'cautious', 'wise'],
                    toleratedPersonalities: ['curious', 'hybrid', 'golden'],
                    preferredFlowerTypes: ['daisy', 'tulip', 'sprout'],
                    communicationStyle: 'open-land-calm',
                    actionBiases: {
                        social: 0.88,
                        teaching: 0.72,
                        exploration: 0.38,
                        rest: 0.82,
                        objectUse: 0.28,
                        vigilance: 0.32,
                        training: 0.18,
                        status: 0.36,
                        caregiving: 0.68
                    },
                    migrationAffinity: {
                        'sun-court': 0.44,
                        'moss-hollow': 0.36,
                        'pool-heart': 0.2
                    }
                }
            },
            {
                id: 'sun-court',
                label: 'Training Grounds',
                kind: 'training',
                poolAllowed: false,
                doorwayIds: ['sun-left-to-ivy', 'sun-right-to-pool'],
                adjacentZoneIds: ['ivy-cloister', 'pool-heart'],
                bounds: {
                    minX: 9,
                    maxX: 17,
                    minY: 0,
                    maxY: 8
                },
                renderProfile: {
                    movingBackgroundEffectsInFocus: false,
                    movingBackgroundEffectsInOverview: false,
                    afterimageTrailsInFocus: true,
                    afterimageTrailsInBattle: false,
                    overlayTint: [184, 148, 80, 46],
                    assetSet: 'land',
                    rotationDegrees: 0,
                    overviewSlot: { col: 1, row: 0 },
                    screenRegion: PAPILIONEM_LAND_MAP.zones['sun-court']
                },
                ecologyProfile: {
                    identityLabel: 'Sun court drills',
                    identityTags: ['training', 'status', 'object-use'],
                    settleBias: 0.16,
                    preferredPersonalities: ['energetic', 'wise', 'skittish'],
                    toleratedPersonalities: ['brave', 'hybrid', 'friendly'],
                    preferredFlowerTypes: ['tulip', 'lavender'],
                    communicationStyle: 'loud-training',
                    actionBiases: {
                        social: 0.44,
                        teaching: 0.78,
                        exploration: 0.34,
                        rest: 0.18,
                        objectUse: 0.74,
                        vigilance: 0.58,
                        training: 0.96,
                        status: 0.76,
                        caregiving: 0.24
                    },
                    migrationAffinity: {
                        'ivy-cloister': 0.35,
                        'pool-heart': 0.4,
                        'moss-hollow': 0.25
                    }
                }
            },
            {
                id: 'moss-hollow',
                label: 'Open Land SW',
                kind: 'open-land',
                poolAllowed: false,
                doorwayIds: ['moss-left-to-ivy', 'moss-right-to-pool'],
                adjacentZoneIds: ['ivy-cloister', 'pool-heart'],
                bounds: {
                    minX: 0,
                    maxX: 8,
                    minY: 9,
                    maxY: 17
                },
                renderProfile: {
                    movingBackgroundEffectsInFocus: false,
                    movingBackgroundEffectsInOverview: false,
                    afterimageTrailsInFocus: true,
                    afterimageTrailsInBattle: false,
                    overlayTint: [86, 116, 88, 40],
                    assetSet: 'land',
                    rotationDegrees: 0,
                    overviewSlot: { col: 0, row: 1 },
                    screenRegion: PAPILIONEM_LAND_MAP.zones['moss-hollow']
                },
                ecologyProfile: {
                    identityLabel: 'Moss watch',
                    identityTags: ['vigilance', 'shelter', 'build'],
                    settleBias: 0.24,
                    preferredPersonalities: ['brave', 'cautious'],
                    toleratedPersonalities: ['skittish', 'hybrid', 'friendly'],
                    preferredFlowerTypes: ['sprout', 'bush'],
                    communicationStyle: 'open-land-watchful',
                    actionBiases: {
                        social: 0.34,
                        teaching: 0.28,
                        exploration: 0.52,
                        rest: 0.58,
                        objectUse: 0.72,
                        vigilance: 0.9,
                        training: 0.24,
                        status: 0.22,
                        caregiving: 0.42
                    },
                    migrationAffinity: {
                        'ivy-cloister': 0.31,
                        'pool-heart': 0.45,
                        'sun-court': 0.24
                    }
                }
            },
            {
                id: 'pool-heart',
                label: 'Open Land SE',
                kind: 'open-land',
                poolAllowed: false,
                doorwayIds: ['pool-left-to-moss', 'pool-right-to-sun'],
                adjacentZoneIds: ['sun-court', 'moss-hollow'],
                bounds: {
                    minX: 9,
                    maxX: 17,
                    minY: 9,
                    maxY: 17
                },
                renderProfile: {
                    movingBackgroundEffectsInFocus: false,
                    movingBackgroundEffectsInOverview: false,
                    afterimageTrailsInFocus: true,
                    afterimageTrailsInBattle: false,
                    overlayTint: [108, 132, 104, 40],
                    assetSet: 'land',
                    rotationDegrees: 0,
                    overviewSlot: { col: 1, row: 1 },
                    screenRegion: PAPILIONEM_LAND_MAP.zones['pool-heart']
                },
                ecologyProfile: {
                    identityLabel: 'Echo pool',
                    identityTags: ['exploration', 'dialogue', 'social'],
                    settleBias: 0.2,
                    preferredPersonalities: ['friendly', 'mystic', 'curious'],
                    toleratedPersonalities: ['wise', 'hybrid', 'golden'],
                    preferredFlowerTypes: ['bush', 'daisy', 'lavender'],
                    communicationStyle: 'open-land-echoing',
                    actionBiases: {
                        social: 0.74,
                        teaching: 0.46,
                        exploration: 0.92,
                        rest: 0.4,
                        objectUse: 0.26,
                        vigilance: 0.3,
                        training: 0.32,
                        status: 0.52,
                        caregiving: 0.36
                    },
                    migrationAffinity: {
                        'sun-court': 0.38,
                        'moss-hollow': 0.34,
                        'ivy-cloister': 0.28
                    }
                }
            }
        ]
    },

    battle: {
        arena: {
            geometry: PAPILIONEM_BATTLE_ARENA,
            teamOrder: ['left', 'right'],
            slotScale: 0.82,
            tokenYOffset: -10,
            lineColor: [8, 18, 12, 90],
            dividerColor: [16, 22, 18, 110]
        },
        autoBattle: {
            intervalFrames: 24,
            maxRounds: 16,
            minIntervalFrames: 18
        },
        motion: {
            attackAdvancePx: 32,
            attackDurationMs: 560,
            hitRecoilPx: 16,
            hitReactionDurationMs: 340,
            rallyAdvancePx: 12,
            rallyDurationMs: 520,
            rallyLiftPx: 6,
            guardBobPx: 3,
            guardDurationMs: 420,
            retreatAdvancePx: 34,
            retreatDurationMs: 520,
            projectileDurationMs: 460,
            idleBobPx: 2.2,
            releaseDurationMs: 980,
            roamRadiusX: 20,
            roamRadiusY: 12,
            engagementDriftPx: 14
        },
        presentation: {
            fieldEntityScale: 1.18,
            healthBarWidth: 16,
            healthBarHeight: 3
        }
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
