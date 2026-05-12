// Centralized game configuration
const PAPILIONEM_WORLD_SOURCE = {
    width: 5504,
    height: 3072
};
const PAPILIONEM_BOARD_UNIT_PX = 20;

function papilionemBoardUnitsToPx(units, pixelsPerUnit = PAPILIONEM_BOARD_UNIT_PX) {
    return Number.isFinite(units) ? units * pixelsPerUnit : 0;
}

function papilionemPxToBoardUnits(px, pixelsPerUnit = PAPILIONEM_BOARD_UNIT_PX) {
    return Number.isFinite(px) && pixelsPerUnit ? px / pixelsPerUnit : 0;
}

const PAPILIONEM_PERFORMANCE_FLAG_OVERRIDE_KEY = 'papilionem-performance-flag-overrides-v1';
const PAPILIONEM_WORLD_RENDERMODE_KEY = 'papilionem-world-rendermode';
const PAPILIONEM_WORLD_RENDER_MODES = ['section-scenes', 'sim-board'];

function normalizePapilionemWorldRenderMode(mode, fallback = 'sim-board') {
    return PAPILIONEM_WORLD_RENDER_MODES.includes(mode) ? mode : fallback;
}

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

function getPapilionemWorldRenderMode(defaultMode = 'sim-board') {
    const fallback = normalizePapilionemWorldRenderMode(defaultMode, 'sim-board');
    if (typeof window === 'undefined') {
        return fallback;
    }

    try {
        const directOverride = window.__PAPILIONEM_WORLD_RENDERMODE__;
        if (typeof directOverride === 'string') {
            return normalizePapilionemWorldRenderMode(directOverride, fallback);
        }
    } catch (_error) {
        // Ignore override lookup failures.
    }

    try {
        if (typeof localStorage === 'undefined') return fallback;
        return normalizePapilionemWorldRenderMode(localStorage.getItem(PAPILIONEM_WORLD_RENDERMODE_KEY), fallback);
    } catch (_error) {
        return fallback;
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

PAPILIONEM_LAND_MAP.visualReadabilityAvoidPolygons = [
    [
        canvasPoint(12, 272),
        canvasPoint(132, 224),
        canvasPoint(186, 294),
        canvasPoint(150, 408),
        canvasPoint(12, 408)
    ],
    [
        canvasPoint(148, 108),
        canvasPoint(642, 108),
        canvasPoint(704, 214),
        canvasPoint(616, 238),
        canvasPoint(508, 206),
        canvasPoint(400, 218),
        canvasPoint(292, 206),
        canvasPoint(194, 244),
        canvasPoint(126, 218)
    ],
    [
        canvasPoint(654, 168),
        canvasPoint(788, 264),
        canvasPoint(788, 408),
        canvasPoint(662, 408),
        canvasPoint(620, 322),
        canvasPoint(654, 252)
    ]
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
            maxBakedSpriteSurfaceMB: 64,
            wingDimensionStep: 1,
            wingSpreadBuckets: 24,
            wingPoseSpreadBuckets: 16,
            wingPoseSpreadDelta: 0.16,
            wingPoseForeOnly: true,
            wingPoseBattleOnly: true,
            flowerWaveBuckets: 12
        },
        pressureTier: {
            disaggregated: true
        },
        pressureGate: {
            disaggregated: true
        },
        directPresentFlowerMaxVisible: 64,
        denseDirectPresentFlowerMinVisible: 96,
        denseDirectPresentFlowerMaxButterflies: 96,
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
        butterflyVisualScale: 1.6,  // 60% larger visual rendering (interaction radii unchanged)
        creatureBakeMode: 'fixed-high-res',
        creatureBakeSize: {
            enabled: true,
            body: 96,
            wing: {
                width: 128,
                height: 96
            },
            antenna: 48
        },
        creatureLodCloseupSize: {
            body: 256,
            wing: {
                width: 384,
                height: 256
            },
            antenna: 128
        },
        creatureLodBattleSize: {
            body: 96,
            wing: {
                width: 128,
                height: 96
            },
            antenna: 48
        },
        blockStackShadow: {
            enabled: true
        },
        creatureBakeEvictOnInspectClose: true,
        creatureBakeAsyncOnInspect: true
    },

    // Canvas settings
    canvas: {
        baseWidth: 800,
        baseHeight: 450,
        targetWidth: 800,
        targetHeight: 450,
        backgroundColor: '#f4e8dc'
    },

    save: {
        preferV5OnRead: true
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

    spatial: {
        projection: {
            ppu: 20,
            groundT: 0.56,
            hStep: 8,
            origin: {
                screenX: 40,
                screenY: 96
            },
            defaultWidthUnits: 36,
            defaultDepthUnits: 22
        },
        ambientGrid: {
            enabled: true,
            stepUnits: 4,
            alpha: 12,
            every1Alpha: 0
        },
        diagnosticGrid: {
            stepUnits: 1,
            alpha: 80,
            axisLabelAlpha: 130
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
            decayEnabled: true,
            reserveFoodEnabled: true,
            decayFrames: 3600,
            pileCleanupRadius: 32,
            pileCleanupBoardRadius: 1.25,
            pileCleanupSelfMaintenance: 0.56,
            soiledSpawnSuppression: {
                enabled: true,
                thresholdPiles: 1,
                maxPenalty: 1
            },
            naturalSpawn: {
                enabled: true,
                openLandMaxNormalFlowers: 5,
                trainingMaxNormalFlowers: 0,
                openLandMinNormalFlowers: 1,
                trainingMinNormalFlowers: 0,
                openLandFloorTarget: 1,
                trainingFloorTarget: 0
            },
            pollenPropagation: {
                enabled: true,
                chargesPerFlowerUse: 1,
                maxCharges: 2,
                chargeTtlFrames: 7200,
                bloomFrames: 1200,
                handoffEnabled: true,
                handoffCheckIntervalFrames: 180,
                handoffRadiusUnits: 2.5,
                handoffMinDonorCharges: 2,
                handoffRecipientMaxCharges: 0,
                handoffDistanceWeight: 1,
                handoffRelationshipWeight: 0.9,
                handoffTaskReadinessWeight: 0.35,
                handoffScarcityWeight: 0.25,
                plantSearchRadiusUnits: 2,
                bloomMinDistance: 0,
                bloomRetryFrames: 30,
                compostEnabled: true,
                compostTtlFrames: 3600,
                compostPreferenceBonus: 2.5,
                compostBloomFrameMultiplier: 0.5,
                compostPlanningSignalEnabled: true
            },
            flowerToBlock: {
                enabled: true,
                minConversionScore: 0.55,
                interactionRadius: 22,
                cooldownFrames: 1200,
                maxSearchRadius: 3,
                pollenCharges: 1,
                exhaustionCost: 0.1,
                curiosityBoost: 0.04,
                significanceBoost: 0.045,
                autoCarry: true,
                minUsefulBlocksPerZone: 4
            },
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
            snapToCellInt: true,
            outlineWeight: 1.25,
            depthX: 7,
            depthY: 4,
            scatterColumns: 6,
            scatterRows: 5,
            interactionRadius: 18,
            placementAvoidFlowerRadius: 20,
            shelterThresholdBlocks: 6,
            maxStackHeight: 12,
            shade: {
                enabled: true,
                minStackHeight: 2,
                radiusUnits: 1.35,
                restDriveBoost: 0.12,
                reliefBoost: 0.1,
                exhaustionRecovery: 0.01,
                shelterSeekingBoost: 0.18,
                buildingIntent: {
                    enabled: true,
                    stackCompletionBonus: 0.7,
                    shadeExtensionBonus: 0.24,
                    stackContinuityBonus: 0.12,
                    distancePenaltyScale: 0.018,
                    shelterSeekingWeight: 0.42,
                    restWeight: 0.25,
                    exhaustionWeight: 0.22,
                    objectInterestWeight: 0.18,
                    explorationWeight: 0.1,
                    memoryStrength: 0.5,
                    reliefReward: 0.04,
                    significanceReward: 0.035
                },
                buildingCooperation: {
                    enabled: true,
                    minIntentScore: 0.45,
                    askAfterCarryFrames: 6,
                    requestCooldownFrames: 900,
                    responseWindowFrames: 720,
                    maxHelpers: 2,
                    maxHelperDistanceUnits: 7,
                    maxHelperBlockDistanceUnits: 5,
                    minHelperEdgeScore: 0.38,
                    requesterEdgeTrust: 0.012,
                    requesterEdgeComfort: 0.014,
                    requesterEdgeAdmiration: 0.006,
                    helperEdgeTrust: 0.016,
                    helperEdgeComfort: 0.018,
                    helperEdgeAdmiration: 0.01,
                    followThroughBoost: 0.04,
                    mutualAttentionBoost: 0.05,
                    warmthBoost: 0.04,
                    projectPreference: {
                        enabled: true,
                        candidateEdgeWeight: 0.5,
                        requesterEdgeWeight: 0.18,
                        requesterMemoryWeight: 0.12,
                        candidateMemoryWeight: 0.04,
                        followThroughWeight: 0.08,
                        objectInterestWeight: 0.06,
                        distancePenaltyWeight: 0.1,
                        memoryGateBoost: 0.04
                    },
                    roleSelection: {
                        enabled: true,
                        builderMemoryWeight: 0.36,
                        builderFollowThroughWeight: 0.34,
                        carrierObjectInterestWeight: 0.42,
                        carrierBlockProximityWeight: 0.34,
                        coordinatorEdgeWeight: 0.3,
                        coordinatorWarmthWeight: 0.2,
                        diversityTieBreakWeight: 0.04
                    }
                },
                sharedProjects: {
                    enabled: true,
                    completionRequiresContributors: 2,
                    completionRequiresPlacements: 1,
                    maxActiveProjectsPerZone: 6,
                    socialPayoff: {
                        enabled: true,
                        memoryStrength: 0.62,
                        trustBoost: 0.008,
                        comfortBoost: 0.01,
                        admirationBoost: 0.006,
                        attachmentBoost: 0.003,
                        followThroughBoost: 0.02,
                        mutualAttentionBoost: 0.025,
                        warmthBoost: 0.02
                    },
                    failureFeedback: {
                        enabled: true,
                        abandonAfterFrames: 1800,
                        memoryStrength: 0.32,
                        trustPenalty: 0.006,
                        comfortPenalty: 0.006,
                        followThroughPenalty: 0.015,
                        frictionBoost: 0.012
                    }
                }
            }
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

    zones: {
        affordanceMigrationPressure: {
            enabled: true,
            decisionIntervalFrames: 60,
            minActiveDrive: 0.55,
            bottomQuantile: 1,
            topQuantile: 0,
            minDelta: 0.01,
            urgencyBase: 0.78,
            urgencyScale: 0.34,
            targetAffinityBoost: 0.34,
            scarcityResourcePriority: true,
            excludeTrainingAsAmbientTarget: true
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
        uiScale: 1,
        feedThreads: {
            interpretationItalic: true,
            interpretationItalicDom: true
        }
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
        modelVersionId: 'm8-garden-policy-protected-slower',
        featureSchemaVersion: 'm4-feature-schema-v1',
        traceSchemaVersion: 'm4-trace-schema-v1',
        policyArtifactPath: 'assets/ml/m8-garden-policy.json',
        policyArtifactFormat: 'linear-policy-json',
        useModelInference: true,
        cadenceFactor: 2,
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

    cognition: {
        derivedFeelings: { enabled: true },
        // SR1 - Global Workspace (docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md).
        // Per-agent attention buffer with salience-gated arbitration. Observe-only
        // in SR1: no downstream module reads broadcastQueue yet.
        workspace: {
            enabled: true,
            attentionDepth: 4,
            candidateCap: 16,
            broadcastTtlFrames: 90,
            seedFromObservables: true,
            arbitrationMode: 'top-salience'
        },
        // SR2 - Self-Model. Durable selfModel state is owned by lifeSim; this
        // flag only controls whether the after-workspace updater writes new
        // predictions and divergence values.
        selfModel: {
            enabled: true,
            smoothingAlpha: 0.18,
            divergenceAlpha: 0.16,
            divergenceFloor: 0.04,
            divergenceClamp: 1,
            confidenceAlpha: 0.12,
            inspectEnabled: true
        },
        // SR3 - Metacognition. A bounded lifeSim-owned ring buffer of
        // second-order emotion tags produced when the SR2 prediction model is
        // surprised by the next first-order emotion.
        metacognition: {
            enabled: true,
            ringBufferCap: 32,
            minDivergence: 0.18,
            minIntensity: 0.22,
            minIntervalFrames: 300,
            decisionInfluenceFrames: 1800,
            shelterSeekingBoost: 0.72,
            cautionBoost: 0.16,
            socialConfidencePenalty: 0.08,
            inspectEnabled: true
        },
        // SR4 - Theory of Mind. Durable models live on lifeSim.socialEdges[*];
        // this controls whether observations update those models and whether
        // active beliefs can bias the next social decision.
        theoryOfMind: {
            enabled: true,
            updateIntervalFrames: 120,
            maxEdgesPerTick: 8,
            divergenceAlpha: 0.2,
            contradictionAlpha: 0.55,
            decisionInfluenceFrames: 1800,
            careIntentThreshold: 0.42,
            avoidIntentThreshold: 0.5,
            inspectEnabled: true
        },
        // SR5 - Intrinsic motivation. Adds lifeSim.intrinsicDrives as a
        // sibling to the locked drive families; the original drives remain
        // untouched, and these values only add small derived behavior nudges.
        intrinsicDrives: {
            enabled: true,
            smoothingAlpha: 0.1,
            curiosityNoveltyWeight: 0.52,
            competencePracticeWeight: 0.46,
            boredomFamiliarityWeight: 0.5,
            explorationBoost: 0.18,
            objectInterestBoost: 0.16,
            trainingBoost: 0.16,
            boredomNoveltyBoost: 0.12,
            inspectEnabled: true
        },
        bondTier: {
            enabled: true,
            arcEvents: {
                enabled: true,
                eventWeighting: true,
                maxProcessedTags: 12,
                transitionCooldownFrames: 300,
                stabilization: {
                    enabled: true,
                    familiarPromotionHoldFrames: 1200,
                    companionPromotionHoldFrames: 3600,
                    bondedPromotionHoldFrames: 7200
                },
                sharedSuccess: { trust: 0.024, comfort: 0.024, attachment: 0.028, coTimeSeconds: 45 },
                conflict: { trust: -0.04, comfort: -0.035, attachment: -0.025, resentment: 0.045 },
                absence: { comfort: -0.025, attachment: -0.02 },
                rivalry: { trust: -0.025, comfort: -0.02, rivalry: 0.025 },
                loyalty: { trust: 0.035, attachment: 0.04, coTimeSeconds: 120 }
            }
        },
        affordances: {
            cleanupNavigationBias: true,
            cleanupNavigationPriority: 4,
            cleanupNavigationMaxUnits: 40,
            cleanupArrivalBoardRadius: 1.05,
            cleanupSocialModulation: true,
            cleanupSocialPriorityBase: 4,
            cleanupCaregivingDriveWeight: 0.16,
            cleanupStatusDriveWeight: 0.1,
            cleanupSelfMaintenanceBoost: 0.18,
            cleanupStatusDisplayBoost: 0.06,
            cleanupActivityDirt: {
                enabled: true,
                intervalFrames: 1800,
                minActiveButterflies: 3,
                maxPilesPerZone: 7,
                maxTotalPiles: 28,
                activityScale: 0.22
            }
        },
            ecologyCommunication: {
                enabled: true,
                cooldownFrames: 1800,
                maxSignalsPerUpdate: 1,
                opportunitySelection: {
                    enabled: true,
                    urgentDuringMigrationScore: 0.82
                },
                eventFollowup: {
                    enabled: true,
                    cooldownFrames: 900,
                    suppressDuringMigration: true
                },
                cleanup: { enabled: true },
                pollen: { enabled: true },
            reserveFood: {
                enabled: true,
                followThroughEnabled: true,
                maxSharedUses: 6,
                selfMaintenanceRelief: 0.08,
                resourceRelief: 0.06,
                exhaustionRelief: 0.03,
                reliefBoost: 0.05
            },
            shadeRest: {
                enabled: true,
                followThroughEnabled: true,
                targetDurationFrames: 2400,
                movementPriority: 7,
                movementWobble: 0.04,
                sleepAssistStrength: 0.16
            }
        },
        grief: {
            enabled: true,
            longAbsence: { enabled: true }
        },
        jealousy: {
            enabled: true,
            witnessedAffection: {
                exposureBias: true,
                distanceUnits: 8,
                decayFrames: 5400,
                opportunityBoost: 0.08
            }
        },
        anchors: { enabled: true },
        loyalty: { enabled: true },
        triggers: {
            pride: {
                enabled: true,
                battleWin: { enabled: true },
                caregivingSuccess: { enabled: true },
                scoutCluster: { enabled: true }
            },
            shame: {
                enabled: true,
                warningIgnoredHarm: { enabled: true },
                abandonedAlly: { enabled: true }
            },
            loyalty: {
                enabled: true,
                competingDistress: {
                    enabled: true,
                    canonicalDedupe: true
                },
                competingScout: { enabled: true }
            }
        }
    },

    expression: {
        namedMemoryDialogue: {
            enabled: true,
            minEdgeComposite: 0.35,
            maxPrefixCharacters: 72
        },
        conversationContinuityDialogue: {
            enabled: true,
            minAgeSeconds: 18,
            maxAgeSeconds: 420,
            maxPrefixCharacters: 78
        },
        languagePolish: {
            modernSlangEnabled: false
        },
        whyThisMoment: {
            enabled: true
        },
        causeLabel: {
            enabled: true,
            maxCharacters: 24,
            cooldownSeconds: 60
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
            teachingPulseRadiusUnits: 3.8,
            teachingPulseRadius: papilionemBoardUnitsToPx(3.8),
            teachingPulseMemoryValence: 0.22,
            teachingPulseMemoryStrength: 0.26,
            teachingPulseEdgeTrust: 0.02,
            teachingPulseEdgeAdmiration: 0.035,
            teachingPulseEdgeComfort: 0.015,
            teachingPulseRoutineReinforcement: 0.025,
            trustCascadeRadiusUnits: 6.6,
            trustCascadeRadius: papilionemBoardUnitsToPx(6.6),
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
            stationRadiusUnits: 2.1,
            stationRadius: papilionemBoardUnitsToPx(2.1),
            maxListenersPerDrill: 3,
            movementPriority: 7,
            movementWobble: 0.08,
            impactChance: 0.04,
            impactRadiusUnits: 1.1,
            impactRadius: papilionemBoardUnitsToPx(1.1),
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
            decisionIntervalFrames: 60,
            routeDurationFrames: 60,
            arrivalSettleFrames: 42,
            exitDurationFrames: 42,
            simBoardArrivalInteriorUnits: 6.8,
            diversityNudgeWeight: 0.08,
            recentZoneDiversityPenalty: 0.04,
            overcrowdingBias: 0.62,
            mismatchThreshold: 0.14,
            maxConcurrentTravelers: 3,
            wildArrivalIntervalFrames: 720
        }
    },

    presentation: {
        renderCommunicationIndicators: false
    },

    communication: {
        ambientSocial: {
            enabled: true,
            intervalFrames: 1200,
            cooldownFrames: 5400,
            initialQuietFrames: 900,
            maxSignalsPerUpdate: 1,
            minBondTier: 'bonded',
            minWitnessBondTier: 'companion',
            maxPairDistanceUnits: 4,
            maxWitnessDistanceUnits: 8,
            minScore: 0.78,
            witnessOpportunityBoost: 0.18
        },
        partnerSelection: {
            recencyPressure: true,
            recencyWindowSeconds: 180,
            recencyDecaySeconds: 180,
            recencyPenalty: 8,
            suppressFullyRecentPartnerSignals: true,
            suppressPenaltyThreshold: 1,
            repeatedWarningDialogueCooldownSeconds: 330,
            explicitTargetBias: 0.08,
            needTypedWeighting: true,
            lonelinessBondedBoost: 0.28,
            comfortCompanionBoost: 0.24,
            curiosityAcquaintanceBoost: 0.32,
            statusAdmirationBoost: 0.24,
            shameRepairBoost: 0.36,
            bondedCheckInExemptionSeconds: 60,
            bondedCheckInGriefThreshold: 0.45,
            bondedCheckInLonelinessThreshold: 0.55
        }
    },

    world: {
        layout: 'land-sanctum-world',
        renderMode: getPapilionemWorldRenderMode('sim-board'),
        renderModes: PAPILIONEM_WORLD_RENDER_MODES,
        overviewMode: false,
        heavyBlockCooperation: true,
        shelterTrustScaling: true,
        zoneScarcityPulse: true,
        distressCascade: true,
        scoutDiscovery: true,
        viewModes: ['overview', 'focused-garden', 'battle'],
        mapGeometry: {
            sourceSize: { ...PAPILIONEM_WORLD_SOURCE },
            roamPolygon: PAPILIONEM_LAND_MAP.roamPolygon,
            placementRegion: PAPILIONEM_SECTION_PLACEMENT_REGION,
            doorwayPassages: PAPILIONEM_LAND_MAP.doorways,
            doorwayAvoidPolygons: PAPILIONEM_LAND_MAP.doorwayAvoidPolygons,
            visualReadabilityAvoidPolygons: PAPILIONEM_LAND_MAP.visualReadabilityAvoidPolygons,
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
        closeupBakeEvictOnExit: true,
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
            pixelsPerArenaUnit: PAPILIONEM_BOARD_UNIT_PX,
            unitsPerArenaCell: 1,
            attackAdvanceUnits: 1.6,
            attackAdvancePx: papilionemBoardUnitsToPx(1.6),
            attackDurationMs: 560,
            hitRecoilUnits: 0.8,
            hitRecoilPx: papilionemBoardUnitsToPx(0.8),
            hitReactionDurationMs: 340,
            rallyAdvanceUnits: 0.6,
            rallyAdvancePx: papilionemBoardUnitsToPx(0.6),
            rallyDurationMs: 520,
            rallyLiftUnits: 0.3,
            rallyLiftPx: papilionemBoardUnitsToPx(0.3),
            guardBobUnits: 0.15,
            guardBobPx: papilionemBoardUnitsToPx(0.15),
            guardDurationMs: 420,
            retreatAdvanceUnits: 1.7,
            retreatAdvancePx: papilionemBoardUnitsToPx(1.7),
            retreatDurationMs: 520,
            projectileDurationMs: 460,
            idleBobUnits: 0.11,
            idleBobPx: papilionemBoardUnitsToPx(0.11),
            projectileArcHeightUnits: 0.9,
            projectileArcHeightPx: papilionemBoardUnitsToPx(0.9),
            releaseDurationMs: 980,
            roamRadiusXUnits: 1,
            roamRadiusX: papilionemBoardUnitsToPx(1),
            roamRadiusYUnits: 0.6,
            roamRadiusY: papilionemBoardUnitsToPx(0.6),
            engagementDriftUnits: 0.7,
            engagementDriftPx: papilionemBoardUnitsToPx(0.7)
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

function setWorldRenderMode(mode, options = {}) {
    const nextMode = normalizePapilionemWorldRenderMode(mode, gameConfig?.world?.renderMode || 'sim-board');
    const persist = options.persist !== false;
    if (gameConfig?.world) {
        gameConfig.world.renderMode = nextMode;
    }
    if (persist && typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(PAPILIONEM_WORLD_RENDERMODE_KEY, nextMode);
        } catch (_error) {
            // Ignore storage failures; the live config still updates.
        }
    }
    if (typeof renderManager !== 'undefined') {
        const activeGameCore = typeof gameCore !== 'undefined' ? gameCore : null;
        const activeZoneSystem = typeof zoneSystem !== 'undefined' ? zoneSystem : null;
        if (nextMode === 'section-scenes') {
            renderManager.prepareWorldSectionAssets?.();
            renderManager.applyWorldSection?.(activeGameCore?.getFocusedZoneId?.() || activeZoneSystem?.focusedZoneId || null);
        }
        renderManager.drawBackground?.();
        renderManager.invalidateScene?.('world-render-mode');
    }
    return nextMode;
}
