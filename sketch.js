// Minimal p5.js sketch - delegates to GameCore for all game logic
let landBackgroundImage;
let battleArenaBackgroundImage;
let titleImage;
let doorwayCoverImage;
let blockSpriteImage;
let showTitleScreen = true;
let titleFadeAlpha = 255;
let titleFading = false;
const TITLE_FADE_PER_SECOND = 180;
let lastSketchFrameError = null;
let lastSketchFrameErrorAtMs = 0;

const PAPILIONEM_HARNESS_ACTIVE = typeof window !== 'undefined'
    && !!window.__PAPILIONEM_HARNESS_MODE__;

function applyCanvasPerformanceProfile(targetWidth = gameConfig.canvas.targetWidth, targetHeight = gameConfig.canvas.targetHeight) {
    const performanceConfig = gameConfig.performance?.canvas || {};
    const deviceDensity = typeof displayDensity === 'function'
        ? displayDensity()
        : (window?.devicePixelRatio || 1);
    const safeDensity = Math.max(1, Number(deviceDensity) || 1);
    const totalPixels = Math.max(1, targetWidth) * Math.max(1, targetHeight) * safeDensity * safeDensity;
    const densityCap = totalPixels >= (performanceConfig.highResolutionPixelThreshold || 1600000)
        ? (performanceConfig.largeCanvasPixelDensityCap || 1.5)
        : (performanceConfig.defaultPixelDensityCap || 2);
    pixelDensity(Math.max(1, Math.min(safeDensity, densityCap)));
}

if (typeof window !== 'undefined') {
    window.applyCanvasPerformanceProfile = applyCanvasPerformanceProfile;
}

function preload() {
    landBackgroundImage = loadImage('assets/base-land-map.png');
    battleArenaBackgroundImage = loadImage('assets/battle-mode-arena-map.png');
    titleImage = loadImage('assets/newtitle.png');
    doorwayCoverImage = loadImage('assets/base-land-doorway-cover.png');
    blockSpriteImage = loadImage('assets/block-papilionem.png');
    spriteManager.preloadAssets();
}

function setup() {
    const container = select('#canvas-container');
    
    const canvas = createCanvas(gameConfig.canvas.targetWidth, gameConfig.canvas.targetHeight);
    canvas.parent(container);
    if (canvas?.elt) {
        canvas.elt.oncontextmenu = () => false;
    }
    
    // The default 2D renderer already handles text smoothing; p5's setAttributes
    // helper is for WEBGL contexts and spams warnings when used with createGraphics layers.
    
    // Set target frame rate to 60 FPS
    frameRate(60);
    
    // Keep butterfly and UI detail readable without letting large browser windows
    // explode the backing canvas cost on high-DPI displays.
    applyCanvasPerformanceProfile(gameConfig.canvas.targetWidth, gameConfig.canvas.targetHeight);
    
    // Keep pixel art aesthetic with nearest neighbor scaling for sprites only
    // Don't apply noSmooth() globally to allow better text rendering
    // Individual elements will apply noSmooth() as needed
    
    Promise.resolve(spriteManager.initialize()).then(() => {
        // Initialize spawn cover overlay (stone archways)
        if (doorwayCoverImage) {
            renderManager.setSpawnCoverImage(doorwayCoverImage);
        }
        if (battleArenaBackgroundImage) {
            renderManager.setBattleBackgroundImage(battleArenaBackgroundImage);
        }

        renderManager.setWorldSectionLibrary({
            land: {
                background: landBackgroundImage,
                foliage: null,
                groundWave: null,
                spawnCover: doorwayCoverImage
            }
        });

        // Initialize game systems
        return gameCore.initialize(landBackgroundImage);
    }).then(() => {
        console.log('Game fully initialized');
        // Handle initial window resize after initialization completes
        // Use setTimeout to ensure all initialization is fully complete
        setTimeout(() => {
            if (gameCore.isInitialized()) {
                windowResized();
            }
            if (PAPILIONEM_HARNESS_ACTIVE) {
                installPapilionemHarness();
            }
        }, 10);
    }).catch(error => {
        console.error('Game initialization failed:', error);
    });
}

function installPapilionemHarness() {
    showTitleScreen = false;
    titleFading = false;
    titleFadeAlpha = 0;
    if (typeof noLoop === 'function') {
        noLoop();
    }
    const stepFrame = () => {
        gameCore.update();
        gameCore.draw();
    };
    const harness = {
        ready: true,
        step: stepFrame,
        tick(n = 1) {
            const count = Math.max(1, Math.floor(Number(n) || 1));
            const t0 = performance.now();
            for (let i = 0; i < count; i += 1) stepFrame();
            return { frames: count, wallMs: performance.now() - t0 };
        },
        snapshot() {
            return gameCore?.telemetrySystem?.getSnapshot?.() || null;
        },
        storeStats() {
            return gameCore?.butterflyStore?.debugStats?.() || null;
        },
        getButterflyCount() {
            return gameCore?.gameState?.butterflies?.length || 0;
        },
        spawnTo(targetCount, options = {}) {
            const target = Math.max(0, Math.floor(Number(targetCount) || 0));
            const limit = (typeof gameConfig !== 'undefined' && gameConfig.entities?.maxButterflies) || 500;
            const cappedTarget = Math.min(target, limit);
            const zoneId = options && typeof options === 'object' ? options.zoneId || null : null;
            let attempts = 0;
            const attemptCap = cappedTarget * 8 + 32;
            while ((gameCore.gameState.butterflies?.length || 0) < cappedTarget && attempts < attemptCap) {
                if (zoneId) {
                    gameCore.spawnAmbientWildButterfly(zoneId);
                } else {
                    gameCore.spawnAmbientWildButterfly();
                }
                attempts += 1;
            }
            return {
                requested: target,
                cappedTo: cappedTarget,
                actual: gameCore.gameState.butterflies?.length || 0,
                attempts,
                zoneId
            };
        },
        spawnFlowersTo(targetCount, options = {}) {
            const target = Math.max(0, Math.floor(Number(targetCount) || 0));
            const zoneId = options.zoneId || gameCore.getFocusedZoneId();
            const flowerType = options.flowerType || null;
            // The global maxFlowers config is a per-zone planting target, not a hard global cap.
            // breedingSystem and other producers bypass it, so real play exceeds the config value
            // (the validation capture has 163 total flowers). Don't gate the harness on it.
            let attempts = 0;
            const attemptCap = target * 24 + 96;
            const minDistanceLadder = [40, 28, 18, 12];
            let ladderIdx = 0;
            let stallCount = 0;
            const initialFlowerCount = gameCore.gameState.flowers?.length || 0;
            const targetTotal = initialFlowerCount + target;
            let lastCount = initialFlowerCount;
            while ((gameCore.gameState.flowers?.length || 0) < targetTotal && attempts < attemptCap) {
                gameCore.spawnFlowerAt(zoneId, null, null, {
                    flowerType,
                    minDistance: minDistanceLadder[ladderIdx],
                    maxAttempts: 24
                });
                attempts += 1;
                const nowCount = gameCore.gameState.flowers?.length || 0;
                if (nowCount === lastCount) {
                    stallCount += 1;
                    if (stallCount >= 16 && ladderIdx < minDistanceLadder.length - 1) {
                        ladderIdx += 1;
                        stallCount = 0;
                    } else if (stallCount >= 16 * minDistanceLadder.length) {
                        break;
                    }
                } else {
                    stallCount = 0;
                    lastCount = nowCount;
                }
            }
            return {
                requested: target,
                actual: gameCore.gameState.flowers?.length || 0,
                addedDelta: (gameCore.gameState.flowers?.length || 0) - initialFlowerCount,
                attempts,
                zoneId,
                finalLadderMinDistance: minDistanceLadder[ladderIdx]
            };
        },
        spawnBlocksTo(targetCount, options = {}) {
            const target = Math.max(0, Math.floor(Number(targetCount) || 0));
            const zoneId = options.zoneId || gameCore.getFocusedZoneId();
            let attempts = 0;
            const attemptCap = target * 8 + 32;
            while ((gameCore.gameState.blocks?.length || 0) < target && attempts < attemptCap) {
                gameCore.godSpawnBlock(zoneId);
                attempts += 1;
            }
            return {
                requested: target,
                actual: gameCore.gameState.blocks?.length || 0,
                attempts,
                zoneId
            };
        },
        scatterButterflies(options = {}) {
            const zoneId = options.zoneId || gameCore.getFocusedZoneId();
            if (!zoneId) return { applied: false, count: 0, zoneId: null };
            const butterflies = gameCore.gameState?.butterflies || [];
            const padding = Number.isFinite(options.padding) ? options.padding : 28;
            let scattered = 0;
            for (const butterfly of butterflies) {
                if ((butterfly.currentZoneId || null) !== zoneId) continue;
                const point = gameCore.getRandomPlacementPoint?.(zoneId, padding);
                if (!point) continue;
                butterfly.x = point.x;
                butterfly.y = point.y - (gameConfig.entities?.heightOffset?.butterfly || 10);
                scattered += 1;
            }
            return { applied: true, count: scattered, zoneId };
        },
        forceZoneFocus(zoneId, options = {}) {
            if (!zoneId) return { applied: false, zoneId: null };
            const mode = options.mode || 'focused-garden';
            const zoneSystem = gameCore?.zoneSystem;
            if (!zoneSystem) return { applied: false, zoneId };
            zoneSystem.setFocusedZone(zoneId);
            zoneSystem.setOverviewMode(mode === 'overview');
            zoneSystem.setViewMode(mode);
            if (gameCore.gameState) {
                gameCore.gameState.focusedZoneId = zoneId;
                gameCore.gameState.viewMode = mode;
            }
            return {
                applied: true,
                zoneId,
                mode,
                resolvedFocus: gameCore.getFocusedZoneId()
            };
        },
        applySeed(seed) {
            return gameCore.resetReplayMetadata({ forceNewSession: true, seed });
        },
        startCapture(label = 'harness-bench') {
            return gameCore.telemetrySystem?.startSessionCapture?.(gameCore.getGameState(), {
                label,
                source: 'harness'
            });
        },
        finishCapture() {
            return gameCore.telemetrySystem?.finishSessionCapture?.(gameCore.getGameState(), {
                reason: 'harness-finish'
            });
        },
        buildCaptureExport(options = {}) {
            return gameCore.telemetrySystem?.buildSessionCaptureExport?.(gameCore.getGameState(), {
                source: 'harness',
                ...options
            }) || null;
        }
    };
    window.papilionemHarness = harness;
    window.dispatchEvent(new CustomEvent('papilionem:harness-ready'));
}

function draw() {
    try {
        // Update game only if title screen is not showing or is fading
        if (!showTitleScreen || titleFading) {
            gameCore.update();
        }

        // Always draw the game for cross-fade effect
        gameCore.draw();

        // Draw title screen on top if active
        if (showTitleScreen) {
            // Draw title image centered
            if (titleImage) {
                push();
                imageMode(CENTER);
                tint(255, titleFadeAlpha);

                // Draw image to fill entire canvas
                image(titleImage, width / 2, height / 2, width, height);
                pop();
            }

            // Handle fade out
            if (titleFading) {
                const fadeStep = TITLE_FADE_PER_SECOND * Math.max(0, deltaTime || 0) / 1000;
                titleFadeAlpha -= fadeStep;
                if (titleFadeAlpha <= 0) {
                    titleFadeAlpha = 0;
                    showTitleScreen = false;
                    titleFading = false;
                }
            }
        }

        applyCanvasAccessibilityStyle();
        lastSketchFrameError = null;
    } catch (error) {
        const now = Date.now();
        const message = error?.message || String(error || 'frame failure');
        lastSketchFrameError = {
            message,
            stage: 'sketch-draw',
            atMs: now
        };
        if ((now - lastSketchFrameErrorAtMs) >= 1200) {
            lastSketchFrameErrorAtMs = now;
            console.error('Sketch frame failure:', error);
            gameCore?.telemetrySystem?.recordRuntimeIssue?.('sketch-frame-error', {
                message,
                stack: error?.stack || null,
                stage: 'sketch-draw',
                frame: typeof frameCount === 'number' ? frameCount : null
            });
        }
        drawSketchRuntimeOverlay(lastSketchFrameError);
    }
}

function drawSketchRuntimeOverlay(errorSummary = null) {
    if (!errorSummary) return;
    push();
    noStroke();
    fill(10, 10, 14, 214);
    rect(20, 20, Math.min(width - 40, 380), 82, 12);
    fill(255, 214, 168);
    textAlign(LEFT, TOP);
    textSize(14);
    text('Runtime hiccup captured', 36, 34);
    fill(236);
    textSize(11);
    const detail = (errorSummary.message || 'frame error').slice(0, 96);
    text(`The last good frame was kept visible.\n${detail}`, 36, 56);
    pop();
}

function windowResized() {
    // Only delegate to GameCore if it's initialized
    if (gameCore && gameCore.isInitialized()) {
        gameCore.handleWindowResize();
        applyCanvasPerformanceProfile(width, height);
    } else {
        console.log('Sketch: Skipping window resize - GameCore not ready');
    }
}

function mousePressed() {
    // Handle title screen click
    if (showTitleScreen && !titleFading) {
        titleFading = true;
        return;
    }
    
    // Only process game input if title screen is not showing
    if (!showTitleScreen) {
        // Check debug UI god mode buttons first
        if (typeof debugUI !== 'undefined' && debugUI.enabled) {
            if (debugUI.handleMouseClick(mouseX, mouseY)) {
                return false; // Button handled the click
            }
        }
        
        // Handle normal game mouse input
        if (gameCore.handleMousePressed(mouseButton)) {
            return false;
        }
    }

    if (mouseButton === RIGHT) return false;
}

function keyPressed() {
    // Handle title screen - any key starts the fade
    if (showTitleScreen && !titleFading) {
        titleFading = true;
        return;
    }
    
    // Only process key input if title screen is not showing
    if (!showTitleScreen) {
        // Delegate to GameCore
        if (gameCore.handleKeyPressed(key, keyCode)) {
            return false;
        }
    }
}

function mouseWheel(event) {
    if (!showTitleScreen) {
        return gameCore.handleMouseWheel(event);
    }
    return true;
}

// Global helper function to check if screen coordinates are within the playable area
// Used by various systems for boundary checking
function isWithinPlayableArea(x, y) {
    const roamPolygon = gameConfig?.world?.mapGeometry?.roamPolygon;
    if (Array.isArray(roamPolygon) && typeof gridManager?.isPointInPolygon === 'function') {
        return gridManager.isPointInPolygon({ x, y }, roamPolygon);
    }

    // Use gridManager if available
    if (typeof gridManager !== 'undefined' && gridManager.screenToIso) {
        const gridPos = gridManager.screenToIso(x, y);
        return gridManager.isInBounds(gridPos.x, gridPos.y);
    }
    
    // Fallback: define a diamond-shaped playable area based on the isometric grid
    // Use unified config system - no fallbacks to prevent drift
    const centerX = gameConfig.canvas.baseWidth / 2;
    const centerY = gameConfig.canvas.baseHeight / 2;
    
    // Convert to relative position from center
    const relX = x - centerX;
    const relY = y - centerY;
    
    // Check if within diamond bounds (simplified)
    const maxDist = 250; // Approximate playable area radius
    return Math.abs(relX) + Math.abs(relY * 2) < maxDist;
}

function applyCanvasAccessibilityStyle() {
    const canvasElements = Array.from(document.querySelectorAll('canvas'));
    if (canvasElements.length === 0) return;
    const settings = typeof gameUI !== 'undefined' && gameUI.getAccessibilitySettings
        ? gameUI.getAccessibilitySettings()
        : {};
    const mode = settings.colorblindMode || 'off';
    const filters = {
        off: 'none',
        protanopia: 'sepia(0.18) saturate(0.82) hue-rotate(-18deg) contrast(1.03)',
        deuteranopia: 'sepia(0.12) saturate(0.78) hue-rotate(22deg) contrast(1.02)',
        tritanopia: 'sepia(0.08) saturate(0.9) hue-rotate(88deg) contrast(1.02)',
        monochrome: 'grayscale(1) contrast(1.08)'
    };
    const nextFilter = filters[mode] || 'none';
    for (const canvasEl of canvasElements) {
        if (canvasEl.style.filter !== nextFilter) {
            canvasEl.style.filter = nextFilter;
        }
    }
}
