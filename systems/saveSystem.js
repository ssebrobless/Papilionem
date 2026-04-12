const PAPILIONEM_SAVE_KEY = 'papilionem-save-v2';
const CURRENT_SAVE_VERSION = 2;

class SaveSystem {
    constructor() {
        this.initialized = false;
        this.lastSerializedState = null;
    }

    initialize() {
        this.initialized = true;
    }

    cloneValue(value, fallback = null) {
        if (value == null) return fallback;
        return JSON.parse(JSON.stringify(value));
    }

    captureLifeSimState(entity) {
        const cloned = this.cloneValue(entity.lifeSim, null);
        if (!cloned) return null;

        const sleepState = typeof sleepSystem !== 'undefined'
            ? sleepSystem.getSleepState?.(entity.id)
            : null;

        if (sleepState) {
            if (cloned.emotions) {
                cloned.emotions.exhaustion = sleepState.exhaustion;
            }

            if (cloned.lifecycle) {
                cloned.lifecycle.sleepSubtype = sleepState.subtype;
                cloned.lifecycle.sleeping = !!sleepState.subtype;
                cloned.lifecycle.lastSleepStartSeconds = sleepState.lastSleepStartSeconds;
                cloned.lifecycle.lastWakeSeconds = sleepState.lastWakeSeconds;
                cloned.lifecycle.lastWakeReason = sleepState.lastWakeReason;
            }
        }

        return cloned;
    }

    serializeButterfly(butterfly) {
        return {
            id: butterfly.id,
            personalityType: butterfly.personalityType,
            sex: butterfly.sex,
            x: butterfly.x,
            y: butterfly.y,
            state: butterfly.state || 'idle',
            happiness: butterfly.happiness ?? null,
            baselineHappiness: butterfly.baselineHappiness ?? null,
            maxHappiness: butterfly.maxHappiness ?? null,
            specialAbility: typeof butterfly.getSpecialAbility === 'function' ? butterfly.getSpecialAbility() : butterfly.specialAbility || null,
            isImmortal: !!butterfly.isImmortal,
            birthSource: butterfly.birthSource || butterfly.lifeSim?.identity?.source || 'wild',
            displayName: butterfly.displayName || null,
            hybridGenome: this.cloneValue(butterfly.hybridGenome, null),
            isHybrid: !!butterfly.isHybrid,
            hybridEntryId: butterfly.hybridEntryId || null,
            pheromoneCooldownUntil: butterfly.pheromoneCooldownUntil ?? 0,
            fertilityUsesRemaining: Number.isFinite(butterfly.fertilityUsesRemaining)
                ? butterfly.fertilityUsesRemaining
                : 'infinite',
            pregnancy: this.cloneValue(butterfly.pregnancy, null),
            breeding: this.cloneValue(butterfly.breeding, null),
            colors: this.cloneValue(butterfly.colors, null),
            wingPattern: butterfly.wingPattern || null,
            timers: this.cloneValue(butterfly.timers, {}),
            feeding: {
                cooldowns: Array.from(butterfly.feeding?.cooldowns?.entries?.() || []),
                targetFlowerId: butterfly.feeding?.targetFlower?.id || null,
                startHappiness: butterfly.feeding?.startHappiness ?? null
            },
            lifeSim: this.captureLifeSimState(butterfly)
        };
    }

    serializeFlower(flower) {
        return {
            id: flower.id,
            x: flower.x,
            y: flower.y,
            stage: flower.stage,
            stageTimer: flower.stageTimer,
            isImmortal: !!flower.isImmortal,
            flowerType: flower.flowerType || null,
            petalColor: this.cloneValue(flower.petalColor, null),
            centerColor: this.cloneValue(flower.centerColor, null),
            accentColor: this.cloneValue(flower.accentColor, null),
            stemColor: this.cloneValue(flower.stemColor, null),
            occupancyState: flower.occupancyState || 'normal',
            allowedButterflyId: flower.allowedButterflyId || null,
            eggData: this.cloneValue(flower.eggData, null),
            chrysalisData: this.cloneValue(flower.chrysalisData, null),
            postHatchFadeTimer: flower.postHatchFadeTimer ?? 0,
            goldenBlessing: flower.goldenBlessing ?? 0,
            objectProfile: this.cloneValue(flower.objectProfile, null)
        };
    }

    serializeCaterpillar(caterpillar) {
        return {
            id: caterpillar.id,
            x: caterpillar.x,
            y: caterpillar.y,
            phase: caterpillar.phase || null,
            phaseStartedAt: caterpillar.phaseStartedAt ?? 0,
            phaseTimeout: caterpillar.phaseTimeout ?? 0,
            targetFlowerId: caterpillar.targetFlower?.id || null,
            dead: !!caterpillar.dead,
            failReason: caterpillar.failReason || null,
            lifecycleData: this.cloneValue(caterpillar.lifecycleData, {}),
            lifeSim: this.captureLifeSimState(caterpillar)
        };
    }

    serializeFoundationState(gameState) {
        if (typeof zoneSystem !== 'undefined') zoneSystem.update?.(gameState, 0);
        if (typeof statusSystem !== 'undefined') statusSystem.reconcileAuras?.(gameState);
        if (typeof objectSystem !== 'undefined') objectSystem.update?.(gameState, 0);

        return {
            zones: typeof zoneSystem !== 'undefined' ? zoneSystem.serializeDurableState?.() || null : null,
            statuses: typeof statusSystem !== 'undefined' ? statusSystem.serializeDurableState?.() || null : null,
            objects: typeof objectSystem !== 'undefined' ? objectSystem.serializeDurableState?.() || null : null,
            sleep: typeof sleepSystem !== 'undefined' ? sleepSystem.serializeDurableState?.() || null : null,
            teaching: typeof teachingSystem !== 'undefined' ? teachingSystem.serializeDurableState?.() || null : null
        };
    }

    serializeState(gameState) {
        const serialized = {
            version: CURRENT_SAVE_VERSION,
            meta: {
                serializedAtMs: Date.now(),
                timeScale: gameState.timeScale ?? 1,
                focusedZoneId: gameState.focusedZoneId || null,
                viewMode: gameState.viewMode || 'focused-garden',
                activeBattleId: null,
                replay: this.cloneValue(gameState.replay, null)
            },
            butterflies: (gameState.butterflies || []).map(butterfly => this.serializeButterfly(butterfly)),
            flowers: (gameState.flowers || []).map(flower => this.serializeFlower(flower)),
            caterpillars: (gameState.caterpillars || []).map(caterpillar => this.serializeCaterpillar(caterpillar)),
            progression: {
                encounteredButterflies: Array.from(gameState.encounteredButterflies || []),
                collectedButterflies: Array.from(gameState.collectedButterflies || []),
                butterflyCollectionStats: this.cloneValue(gameState.butterflyCollectionStats, {}),
                hybridJournal: this.cloneValue(gameState.hybridJournal, []),
                nextHybridId: gameState.nextHybridId || 1
            },
            runtime: {
                butterflySpawnCounts: this.cloneValue(gameState.butterflySpawnCounts, {}),
                goldenButterflySpawned: !!gameState.goldenButterflySpawned,
                feedingCombo: gameState.feedingCombo ?? 0,
                lastFeedingTime: gameState.lastFeedingTime ?? 0,
                maxCombo: gameState.maxCombo ?? 0,
                showButterflyCollection: !!gameState.showButterflyCollection,
                pendingOffspringReservations: gameState.pendingOffspringReservations ?? 0
            },
            foundations: this.serializeFoundationState(gameState)
        };

        this.lastSerializedState = this.cloneValue(serialized);

        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.SAVE_SERIALIZED, { serialized });
        }
        return serialized;
    }

    deserializeState(serialized) {
        const normalized = this.cloneValue(serialized, {
            version: CURRENT_SAVE_VERSION,
            butterflies: [],
            flowers: [],
            caterpillars: [],
            progression: {},
            runtime: {},
            foundations: {}
        });
        const migrated = this.migrateState(normalized);

        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.SAVE_DESERIALIZED, { serialized: migrated });
        }
        return migrated;
    }

    migrateState(serialized = {}) {
        const migrated = this.cloneValue(serialized, {
            version: CURRENT_SAVE_VERSION,
            butterflies: [],
            flowers: [],
            caterpillars: [],
            progression: {},
            runtime: {},
            foundations: {},
            meta: {}
        });

        if (!migrated.version || migrated.version < 2) {
            migrated.version = CURRENT_SAVE_VERSION;
            migrated.runtime = {
                butterflySpawnCounts: this.cloneValue(migrated.runtime?.butterflySpawnCounts, {}),
                goldenButterflySpawned: !!migrated.runtime?.goldenButterflySpawned,
                feedingCombo: migrated.runtime?.feedingCombo ?? 0,
                lastFeedingTime: migrated.runtime?.lastFeedingTime ?? 0,
                maxCombo: migrated.runtime?.maxCombo ?? 0,
                showButterflyCollection: !!migrated.runtime?.showButterflyCollection,
                pendingOffspringReservations: migrated.runtime?.pendingOffspringReservations ?? 0
            };
            migrated.meta = {
                serializedAtMs: migrated.meta?.serializedAtMs ?? Date.now(),
                timeScale: migrated.meta?.timeScale ?? 1,
                focusedZoneId: migrated.meta?.focusedZoneId ?? null,
                viewMode: migrated.meta?.viewMode ?? 'focused-garden',
                activeBattleId: null,
                replay: this.cloneValue(migrated.meta?.replay, null)
            };
        }

        migrated.meta = migrated.meta || {};
        migrated.meta.replay = this.cloneValue(migrated.meta.replay, null);

        return migrated;
    }

    restoreFeedingState(butterfly, feedingData = {}, flowerById = new Map()) {
        butterfly.feeding = butterfly.feeding || {};
        butterfly.feeding.cooldowns = new Map(feedingData.cooldowns || []);
        butterfly.feeding.startHappiness = feedingData.startHappiness ?? null;
        butterfly.feeding.targetFlower = feedingData.targetFlowerId ? (flowerById.get(feedingData.targetFlowerId) || null) : null;
    }

    instantiateButterfly(savedButterfly, flowerById = new Map()) {
        const butterfly = new Butterfly(
            savedButterfly.x,
            savedButterfly.y,
            savedButterfly.colors || null,
            !!savedButterfly.isImmortal,
            savedButterfly.personalityType || null,
            {
                sex: savedButterfly.sex || 'F',
                birthSource: savedButterfly.birthSource || 'wild',
                hybridGenome: this.cloneValue(savedButterfly.hybridGenome, null),
                isHybrid: !!savedButterfly.isHybrid,
                displayName: savedButterfly.displayName || null,
                hybridEntryId: savedButterfly.hybridEntryId || null,
                pheromoneCooldownUntil: savedButterfly.pheromoneCooldownUntil ?? 0,
                fertilityUsesRemaining: savedButterfly.fertilityUsesRemaining === 'infinite'
                    ? Infinity
                    : (savedButterfly.fertilityUsesRemaining ?? Infinity),
                pregnancy: this.cloneValue(savedButterfly.pregnancy, null),
                specialAbility: savedButterfly.specialAbility || null
            }
        );

        butterfly.id = savedButterfly.id;
        butterfly.state = savedButterfly.state || butterfly.state;
        butterfly.happiness = savedButterfly.happiness ?? butterfly.happiness;
        butterfly.baselineHappiness = savedButterfly.baselineHappiness ?? butterfly.baselineHappiness;
        butterfly.maxHappiness = savedButterfly.maxHappiness ?? butterfly.maxHappiness;
        butterfly.colors = this.cloneValue(savedButterfly.colors, butterfly.colors);
        butterfly.wingPattern = savedButterfly.wingPattern || butterfly.wingPattern;
        butterfly.breeding = this.cloneValue(savedButterfly.breeding, butterfly.breeding);
        butterfly.lifeSim = this.cloneValue(savedButterfly.lifeSim, butterfly.lifeSim);
        butterfly.timers = {
            ...butterfly.timers,
            ...(savedButterfly.timers || {})
        };
        this.restoreFeedingState(butterfly, savedButterfly.feeding, flowerById);
        return butterfly;
    }

    instantiateFlower(savedFlower) {
        const flower = new Flower(savedFlower.x, savedFlower.y, !!savedFlower.isImmortal);
        flower.id = savedFlower.id;
        flower.stage = savedFlower.stage || flower.stage;
        flower.stageTimer = savedFlower.stageTimer ?? flower.stageTimer;
        flower.flowerType = savedFlower.flowerType || flower.flowerType;
        flower.petalColor = this.cloneValue(savedFlower.petalColor, flower.petalColor);
        flower.centerColor = this.cloneValue(savedFlower.centerColor, flower.centerColor);
        flower.accentColor = this.cloneValue(savedFlower.accentColor, flower.accentColor);
        flower.stemColor = this.cloneValue(savedFlower.stemColor, flower.stemColor);
        flower.occupancyState = savedFlower.occupancyState || flower.occupancyState;
        flower.allowedButterflyId = savedFlower.allowedButterflyId || null;
        flower.eggData = this.cloneValue(savedFlower.eggData, null);
        flower.chrysalisData = this.cloneValue(savedFlower.chrysalisData, null);
        flower.postHatchFadeTimer = savedFlower.postHatchFadeTimer ?? 0;
        flower.goldenBlessing = savedFlower.goldenBlessing ?? 0;
        flower.objectProfile = this.cloneValue(savedFlower.objectProfile, flower.objectProfile);
        return flower;
    }

    instantiateCaterpillar(savedCaterpillar) {
        const caterpillar = new Caterpillar(savedCaterpillar.x, savedCaterpillar.y, this.cloneValue(savedCaterpillar.lifecycleData, {}));
        caterpillar.id = savedCaterpillar.id;
        caterpillar.phase = savedCaterpillar.phase || caterpillar.phase;
        caterpillar.phaseStartedAt = savedCaterpillar.phaseStartedAt ?? caterpillar.phaseStartedAt;
        caterpillar.phaseTimeout = savedCaterpillar.phaseTimeout ?? caterpillar.phaseTimeout;
        caterpillar.dead = !!savedCaterpillar.dead;
        caterpillar.failReason = savedCaterpillar.failReason || null;
        caterpillar.lifeSim = this.cloneValue(savedCaterpillar.lifeSim, caterpillar.lifeSim);
        caterpillar.__savedTargetFlowerId = savedCaterpillar.targetFlowerId || null;
        return caterpillar;
    }

    applyProgressionState(gameState, progression = {}) {
        gameState.encounteredButterflies = new Set(progression.encounteredButterflies || []);
        gameState.collectedButterflies = new Set(progression.collectedButterflies || []);
        gameState.butterflyCollectionStats = this.cloneValue(progression.butterflyCollectionStats, {});
        gameState.hybridJournal = this.cloneValue(progression.hybridJournal, []);
        gameState.nextHybridId = Math.max(1, progression.nextHybridId || 1);
    }

    applyRuntimeState(gameState, meta = {}, runtime = {}) {
        gameState.timeScale = meta.timeScale ?? gameState.timeScale ?? 1;
        gameState.focusedZoneId = meta.focusedZoneId ?? null;
        gameState.viewMode = meta.viewMode || 'focused-garden';
        gameState.activeBattleId = null;
        gameState.replay = this.cloneValue(meta.replay, gameState.replay);
        gameState.butterflySpawnCounts = this.cloneValue(runtime.butterflySpawnCounts, {});
        gameState.goldenButterflySpawned = !!runtime.goldenButterflySpawned;
        gameState.feedingCombo = runtime.feedingCombo ?? 0;
        gameState.lastFeedingTime = runtime.lastFeedingTime ?? 0;
        gameState.maxCombo = runtime.maxCombo ?? 0;
        gameState.showButterflyCollection = !!runtime.showButterflyCollection;
        gameState.pendingOffspringReservations = runtime.pendingOffspringReservations ?? 0;
    }

    applyDeserializedState(gameCoreInstance, serialized) {
        const normalized = this.deserializeState(serialized);
        const gameState = gameCoreInstance?.gameState;
        if (!gameState) return null;

        gameCoreInstance.restoreReplayMetadata?.(normalized.meta?.replay || null, {
            forceNewSession: false,
            preserveMarkers: true
        });

        const flowers = (normalized.flowers || []).map(flower => this.instantiateFlower(flower));
        const flowerById = new Map(flowers.map(flower => [flower.id, flower]));
        const butterflies = (normalized.butterflies || []).map(butterfly => this.instantiateButterfly(butterfly, flowerById));
        const caterpillars = (normalized.caterpillars || []).map(caterpillar => this.instantiateCaterpillar(caterpillar));

        for (const caterpillar of caterpillars) {
            caterpillar.targetFlower = caterpillar.__savedTargetFlowerId
                ? (flowerById.get(caterpillar.__savedTargetFlowerId) || null)
                : null;
            delete caterpillar.__savedTargetFlowerId;
        }

        gameCoreInstance.entityManager?.clear?.();
        gameCoreInstance.resetFoundationSystems?.();

        gameState.butterflies = butterflies;
        gameState.flowers = flowers;
        gameState.caterpillars = caterpillars;

        this.applyProgressionState(gameState, normalized.progression || {});
        this.applyRuntimeState(gameState, normalized.meta || {}, normalized.runtime || {});

        for (const butterfly of butterflies) {
            gameCoreInstance.entityManager?.addEntity?.('butterflies', butterfly);
            gameCoreInstance.registerEntityWithFoundationSystems?.(butterfly, 'butterfly');
        }
        for (const flower of flowers) {
            gameCoreInstance.entityManager?.addEntity?.('flowers', flower);
            gameCoreInstance.registerEntityWithFoundationSystems?.(flower, 'flower');
        }
        for (const caterpillar of caterpillars) {
            gameCoreInstance.entityManager?.addEntity?.('caterpillars', caterpillar);
            gameCoreInstance.registerEntityWithFoundationSystems?.(caterpillar, 'caterpillar');
        }

        zoneSystem?.deserializeDurableState?.(normalized.foundations?.zones || {});
        statusSystem?.deserializeDurableState?.(normalized.foundations?.statuses || {});
        objectSystem?.deserializeDurableState?.(normalized.foundations?.objects || {});
        sleepSystem?.deserializeDurableState?.(normalized.foundations?.sleep || {});
        teachingSystem?.deserializeDurableState?.(normalized.foundations?.teaching || {});

        if (normalized.meta?.focusedZoneId && gameCoreInstance.focusZone?.(normalized.meta.focusedZoneId)) {
            gameState.focusedZoneId = normalized.meta.focusedZoneId;
        }
        if (normalized.meta?.viewMode) {
            gameCoreInstance.setViewMode?.(normalized.meta.viewMode);
        }

        this.rebuildDerivedState(gameState);
        return normalized;
    }

    saveToStorage(gameState, storageKey = PAPILIONEM_SAVE_KEY) {
        if (typeof localStorage === 'undefined') return null;
        const serialized = this.serializeState(gameState);
        localStorage.setItem(storageKey, JSON.stringify(serialized));
        return serialized;
    }

    loadFromStorage(gameCoreInstance, storageKey = PAPILIONEM_SAVE_KEY) {
        if (typeof localStorage === 'undefined') return null;
        const raw = localStorage.getItem(storageKey);
        if (!raw) return null;
        const serialized = JSON.parse(raw);
        return this.applyDeserializedState(gameCoreInstance, serialized);
    }

    compareSerializedDurableState(beforeState, afterState, basePath = '') {
        const mismatches = [];
        const before = beforeState ?? null;
        const after = afterState ?? null;

        if (typeof before !== typeof after) {
            mismatches.push({ path: basePath || 'root', before, after, reason: 'type-mismatch' });
            return mismatches;
        }

        if (before == null || after == null || typeof before !== 'object') {
            if (before !== after) {
                mismatches.push({ path: basePath || 'root', before, after, reason: 'value-mismatch' });
            }
            return mismatches;
        }

        if (Array.isArray(before) || Array.isArray(after)) {
            const maxLength = Math.max(before.length, after.length);
            for (let i = 0; i < maxLength; i++) {
                mismatches.push(...this.compareSerializedDurableState(before[i], after[i], `${basePath}[${i}]`));
            }
            return mismatches;
        }

        const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
        for (const key of keys) {
            const path = basePath ? `${basePath}.${key}` : key;
            if (path === 'meta.serializedAtMs') continue;
            mismatches.push(...this.compareSerializedDurableState(before[key], after[key], path));
        }

        return mismatches;
    }

    captureAuditSnapshot(gameState) {
        return this.serializeState(gameState);
    }

    rebuildDerivedState(gameState) {
        if (typeof zoneSystem !== 'undefined') zoneSystem.update?.(gameState, 0);
        if (typeof statusSystem !== 'undefined') statusSystem.reconcileAuras?.(gameState);
        if (typeof objectSystem !== 'undefined') objectSystem.update?.(gameState, 0);
        if (typeof sleepSystem !== 'undefined') sleepSystem.update?.(gameState, 0);
        if (typeof teachingSystem !== 'undefined') teachingSystem.update?.(gameState, 0);
        if (typeof behaviorSystem !== 'undefined') behaviorSystem.update?.(gameState, 0);
        if (typeof battleSystem !== 'undefined') battleSystem.update?.(gameState, 0);

        if (typeof eventBus !== 'undefined' && GameEvents.SAVE_REBUILT) {
            eventBus.emit(GameEvents.SAVE_REBUILT, { gameState });
        }
    }

    update() {}
}

const saveSystem = new SaveSystem();
