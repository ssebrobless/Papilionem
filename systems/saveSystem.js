const PAPILIONEM_SAVE_KEY = 'papilionem-save-v2';
const CURRENT_SAVE_VERSION = 4;
const PAPILIONEM_AUDIT_SETUP_KEY = 'papilionem-audit-setup-v1';
const PAPILIONEM_AUDIT_REPORTS_KEY = 'papilionem-audit-reports-v1';
const PAPILIONEM_SAVE_DB_NAME = 'papilionem-save-db-v1';
const PAPILIONEM_SAVE_DB_VERSION = 1;
const PAPILIONEM_SAVE_STORE = 'saveSlots';
const CURRENT_WORLD_REFRESH_REVISIONS = Object.freeze({
    environmentLayout: 'garden-placement-v3',
    blockLayout: 'block-dispersion-v3',
    butterflyRuntime: 'butterfly-placement-v2'
});

class SaveSystem {
    constructor() {
        this.initialized = false;
        this.lastSerializedState = null;
        this.lastAutoSaveAtMs = 0;
        this.lastAutoSaveRequestedAtMs = 0;
        this.autoSaveIntervalMs = 45000;
        this.saveDatabasePromise = null;
        this.saveChain = Promise.resolve();
        this.pendingAutoSave = false;
        this.pendingAutoSaveTimeoutId = null;
        this.pendingAutoSaveIdleId = null;
    }

    initialize() {
        this.initialized = true;
    }

    getCurrentRefreshRevisions() {
        return this.cloneValue(CURRENT_WORLD_REFRESH_REVISIONS, {});
    }

    normalizeRefreshRevisions(refreshRevisions = {}) {
        return {
            environmentLayout: refreshRevisions?.environmentLayout || null,
            blockLayout: refreshRevisions?.blockLayout || null,
            butterflyRuntime: refreshRevisions?.butterflyRuntime || null
        };
    }

    getDefaultRestoreZoneId(gameCoreInstance, fallbackZoneId = null) {
        const zoneIds = gameCoreInstance?.getZoneIds?.() || [];
        if (fallbackZoneId && zoneIds.includes(fallbackZoneId)) return fallbackZoneId;
        return zoneIds[0]
            || gameCoreInstance?.getFocusedZoneId?.()
            || gameCoreInstance?.gameState?.focusedZoneId
            || fallbackZoneId
            || null;
    }

    buildLoadRefreshPlan(meta = {}, gameCoreInstance = null) {
        const current = this.getCurrentRefreshRevisions();
        const saved = this.normalizeRefreshRevisions(meta?.refreshRevisions || {});
        const zoneIds = gameCoreInstance?.getZoneIds?.() || [];
        const forceFreshWorld = !!meta?.forceFreshWorld;
        const missingRevisionMetadata = !saved.environmentLayout || !saved.blockLayout || !saved.butterflyRuntime;
        const environmentLayoutChanged = saved.environmentLayout !== current.environmentLayout;
        const blockLayoutChanged = saved.blockLayout !== current.blockLayout;
        const butterflyRuntimeChanged = saved.butterflyRuntime !== current.butterflyRuntime;
        const refreshEnvironmentLayout = forceFreshWorld || environmentLayoutChanged;
        const refreshBlocks = forceFreshWorld || environmentLayoutChanged || blockLayoutChanged;
        const refreshButterflies = forceFreshWorld || environmentLayoutChanged || butterflyRuntimeChanged;
        const refreshFlowers = forceFreshWorld || environmentLayoutChanged;
        const refreshCaterpillars = forceFreshWorld || environmentLayoutChanged;
        const persistRefreshedSave =
            !!meta?.persistRefreshToStorage
            || missingRevisionMetadata
            || refreshEnvironmentLayout
            || refreshBlocks
            || refreshButterflies;

        return {
            current,
            saved,
            zoneIds,
            forceFreshWorld,
            missingRevisionMetadata,
            refreshEnvironmentLayout,
            refreshBlocks,
            refreshButterflies,
            refreshFlowers,
            refreshCaterpillars,
            persistRefreshedSave
        };
    }

    cloneValue(value, fallback = null) {
        if (value == null) return fallback;
        return JSON.parse(JSON.stringify(value));
    }

    trimTailEntries(entries, maxEntries = 0) {
        if (!Array.isArray(entries)) return [];
        if (maxEntries <= 0) return [];
        return entries.slice(-maxEntries);
    }

    trimKnownNamesForSave(knownNames = {}, maxEntries = 24) {
        if (!knownNames || typeof knownNames !== 'object') return {};
        const entries = Object.entries(knownNames);
        if (entries.length <= maxEntries) {
            return this.cloneValue(knownNames, {});
        }

        const ranked = entries
            .sort((left, right) => {
                const leftValue = left[1] || {};
                const rightValue = right[1] || {};
                const leftSelf = leftValue.self ? 1 : 0;
                const rightSelf = rightValue.self ? 1 : 0;
                if (leftSelf !== rightSelf) return rightSelf - leftSelf;
                const leftTime = Number(leftValue.learnedAtSeconds || 0);
                const rightTime = Number(rightValue.learnedAtSeconds || 0);
                if (leftTime !== rightTime) return rightTime - leftTime;
                return Number(rightValue.certainty || 0) - Number(leftValue.certainty || 0);
            })
            .slice(0, maxEntries);

        return Object.fromEntries(ranked.map(([key, value]) => [key, this.cloneValue(value, {})]));
    }

    supportsIndexedDb() {
        return typeof indexedDB !== 'undefined';
    }

    openSaveDatabase() {
        if (!this.supportsIndexedDb()) return Promise.resolve(null);
        if (this.saveDatabasePromise) return this.saveDatabasePromise;

        this.saveDatabasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(PAPILIONEM_SAVE_DB_NAME, PAPILIONEM_SAVE_DB_VERSION);

            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(PAPILIONEM_SAVE_STORE)) {
                    database.createObjectStore(PAPILIONEM_SAVE_STORE);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                this.saveDatabasePromise = null;
                reject(request.error || new Error('Unable to open Papilionem save database'));
            };
            request.onblocked = () => {
                this.saveDatabasePromise = null;
                reject(new Error('Papilionem save database is blocked by another tab'));
            };
        });

        return this.saveDatabasePromise;
    }

    async readPayloadFromIndexedDb(storageKey) {
        const database = await this.openSaveDatabase();
        if (!database) return null;
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(PAPILIONEM_SAVE_STORE, 'readonly');
            const store = transaction.objectStore(PAPILIONEM_SAVE_STORE);
            const request = store.get(storageKey);
            request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
            request.onerror = () => reject(request.error || transaction.error || new Error('Unable to read indexed save slot'));
            transaction.onabort = () => reject(transaction.error || new Error('Indexed save read aborted'));
        });
    }

    async writePayloadToIndexedDb(storageKey, payload) {
        const database = await this.openSaveDatabase();
        if (!database) return false;
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(PAPILIONEM_SAVE_STORE, 'readwrite');
            const store = transaction.objectStore(PAPILIONEM_SAVE_STORE);
            const request = store.put(payload, storageKey);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error || transaction.error || new Error('Unable to write indexed save slot'));
            transaction.onabort = () => reject(transaction.error || new Error('Indexed save write aborted'));
        });
        return true;
    }

    removeLegacyLocalSave(storageKey = PAPILIONEM_SAVE_KEY) {
        if (typeof localStorage === 'undefined') return false;
        try {
            if (localStorage.getItem(storageKey) == null) return false;
            localStorage.removeItem(storageKey);
            return true;
        } catch (_error) {
            return false;
        }
    }

    recordStorageBackendFailure(error, storageKey = PAPILIONEM_SAVE_KEY, stage = 'read') {
        gameCore?.telemetrySystem?.recordRuntimeIssue?.(`save-storage-${stage}-error`, {
            message: error?.message || String(error || 'save-storage-read-error'),
            storageKey
        });
    }

    shouldUseIndexedDbOnly() {
        return !!(
            gameConfig?.performance?.flags?.saveStoreIndexedDbOnly
            && this.supportsIndexedDb()
        );
    }

    async readPayloadFromStorage(storageKey = PAPILIONEM_SAVE_KEY) {
        if (this.supportsIndexedDb()) {
            try {
                const indexedPayload = await this.readPayloadFromIndexedDb(storageKey);
                if (indexedPayload) {
                    return {
                        payload: indexedPayload,
                        backend: 'indexeddb'
                    };
                }
            } catch (error) {
                this.recordStorageBackendFailure(error, storageKey, 'read');
            }
        }

        if (this.shouldUseIndexedDbOnly()) {
            return {
                payload: null,
                backend: null
            };
        }

        if (typeof localStorage === 'undefined') {
            return {
                payload: null,
                backend: null
            };
        }

        const legacyPayload = localStorage.getItem(storageKey);
        if (!legacyPayload) {
            return {
                payload: null,
                backend: null
            };
        }

        if (this.supportsIndexedDb()) {
            void this.writePayloadToIndexedDb(storageKey, legacyPayload)
                .then(() => {
                    this.removeLegacyLocalSave(storageKey);
                })
                .catch(error => {
                    this.recordStorageBackendFailure(error, storageKey, 'migrate');
                });
        }

        return {
            payload: legacyPayload,
            backend: 'localstorage'
        };
    }

    commitSaveStatus(options = {}) {
        this.lastAutoSaveAtMs = Date.now();
        if (typeof gameUI !== 'undefined' && gameUI.markSaveStatus) {
            const source = options.source === 'autosave' ? 'Autosaved' : 'Saved';
            const timeLabel = new Date(this.lastAutoSaveAtMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            gameUI.markSaveStatus('saved', `${source} ${timeLabel}`);
        }
    }

    enqueueSave(operation) {
        const run = this.saveChain
            .catch(() => null)
            .then(operation);
        this.saveChain = run.catch(() => null);
        return run;
    }

    clearPendingAutoSaveSchedule() {
        if (this.pendingAutoSaveTimeoutId != null) {
            clearTimeout(this.pendingAutoSaveTimeoutId);
            this.pendingAutoSaveTimeoutId = null;
        }
        if (
            this.pendingAutoSaveIdleId != null
            && typeof cancelIdleCallback === 'function'
        ) {
            cancelIdleCallback(this.pendingAutoSaveIdleId);
            this.pendingAutoSaveIdleId = null;
        }
    }

    scheduleAutoSave(gameState) {
        if (this.pendingAutoSave) return false;
        this.pendingAutoSave = true;

        const runAutoSave = () => {
            this.pendingAutoSaveTimeoutId = null;
            this.pendingAutoSaveIdleId = null;
            void this.saveToStorageDeferred(gameState, { source: 'autosave' })
                .finally(() => {
                    this.pendingAutoSave = false;
                });
        };

        if (typeof requestIdleCallback === 'function') {
            this.pendingAutoSaveIdleId = requestIdleCallback(() => {
                runAutoSave();
            }, { timeout: 1500 });
            return true;
        }

        this.pendingAutoSaveTimeoutId = setTimeout(() => {
            runAutoSave();
        }, 0);
        return true;
    }

    sanitizeCapturedLifeSimState(cloned) {
        if (!cloned) return cloned;
        if (cloned.communication) {
            // Active signal fanout is rebuilt from the communication foundation layer.
            // Persisting per-butterfly target lists makes save comparisons treat
            // transient recipients as durable truth.
            cloned.communication.activeSignal = null;
            cloned.communication.activeConversation = null;
            cloned.communication.pendingUtterances = [];
            cloned.communication.recentEmitted = this.trimTailEntries(cloned.communication.recentEmitted, 0);
            cloned.communication.recentReceived = this.trimTailEntries(cloned.communication.recentReceived, 0);
            cloned.communication.recentConversations = this.trimTailEntries(cloned.communication.recentConversations, 0);
            cloned.communication.recentDialogues = this.trimTailEntries(cloned.communication.recentDialogues, 0);
            cloned.communication.recentResidues = this.trimTailEntries(cloned.communication.recentResidues, 4);
            cloned.communication.retainedLessons = this.trimTailEntries(cloned.communication.retainedLessons, 6);
            cloned.communication.knownNames = this.trimKnownNamesForSave(cloned.communication.knownNames, 24);
        }
        if (cloned.interpretation) {
            cloned.interpretation.lastSignals = [];
        }
        delete cloned.derived;
        delete cloned.objectAwareness;
        delete cloned.spatialAwareness;
        delete cloned.progression;
        delete cloned.battleContext;
        return cloned;
    }

    captureZoneTravelState(zoneTravel) {
        if (!zoneTravel?.sourceZoneId) return null;
        return {
            sourceZoneId: zoneTravel.sourceZoneId || null,
            targetZoneId: zoneTravel.targetZoneId || null,
            phase: zoneTravel.phase || 'departing',
            progressFrames: Math.max(0, zoneTravel.progressFrames || 0),
            reason: zoneTravel.reason || null,
            arrivalTargetEntityId: zoneTravel.arrivalTargetEntityId || null
        };
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

        return this.sanitizeCapturedLifeSimState(cloned);
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
            personalName: butterfly.personalName || butterfly.lifeSim?.identity?.personalName || null,
            nameDisambiguator: butterfly.nameDisambiguator || null,
            currentZoneId: butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || null,
            hybridGenome: this.cloneValue(butterfly.hybridGenome, null),
            mutationProfile: this.cloneValue(butterfly.mutationProfile || butterfly.lifeSim?.genetics?.mutationProfile, null),
            isHybrid: !!butterfly.isHybrid,
            hybridEntryId: butterfly.hybridEntryId || null,
            pheromoneCooldownUntil: butterfly.pheromoneCooldownUntil ?? 0,
            fertilityUsesRemaining: Number.isFinite(butterfly.fertilityUsesRemaining)
                ? butterfly.fertilityUsesRemaining
                : 'infinite',
            pregnancy: this.cloneValue(butterfly.pregnancy, null),
            breeding: this.cloneValue(butterfly.breeding, null),
            wildLifecycle: this.cloneValue(butterfly.wildLifecycle, null),
            colors: this.cloneValue(butterfly.colors, null),
            wingPattern: butterfly.wingPattern || null,
            timers: this.cloneValue(butterfly.timers, {}),
            blockInteraction: this.cloneValue({
                targetBlockId: butterfly.blockInteraction?.targetBlockId || null,
                carryingBlockId: butterfly.blockInteraction?.carryingBlockId || null,
                placementTarget: butterfly.blockInteraction?.placementTarget || null,
                lastPlacementMode: butterfly.blockInteraction?.lastPlacementMode || 'ground',
                lastRelativeSize: butterfly.blockInteraction?.lastRelativeSize ?? 0,
                cooldownFrames: butterfly.blockInteraction?.cooldownFrames ?? 0,
                carryFrames: butterfly.blockInteraction?.carryFrames ?? 0
            }, null),
            feeding: {
                cooldowns: Array.from(butterfly.feeding?.cooldowns?.entries?.() || []),
                targetFlowerId: butterfly.feeding?.targetFlower?.id || null,
                startHappiness: butterfly.feeding?.startHappiness ?? null
            },
            zoneTravel: this.captureZoneTravelState(butterfly.zoneTravel),
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
            objectProfile: this.cloneValue(flower.objectProfile, null),
            currentZoneId: flower.currentZoneId || null
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
            currentZoneId: caterpillar.currentZoneId || caterpillar.lifeSim?.lifecycle?.currentZoneId || null,
            lifecycleData: this.cloneValue(caterpillar.lifecycleData, {}),
            lifeSim: this.captureLifeSimState(caterpillar)
        };
    }

    serializeBlock(block) {
        return {
            id: block.id,
            x: block.x,
            y: block.y,
            currentZoneId: block.currentZoneId || null,
            renderWidth: block.renderWidth ?? null,
            renderHeight: block.renderHeight ?? null,
            blockHeight: block.blockHeight ?? 1,
            stackIndex: block.stackIndex ?? 0,
            supportBlockId: block.supportBlockId || null,
            lastPlacedMode: block.lastPlacedMode || 'ground',
            carriedById: block.carriedById || null,
            attachedOffset: this.cloneValue(block.attachedOffset, null),
            movedAtFrame: block.movedAtFrame ?? 0,
            lastMovedById: block.lastMovedById || null,
            objectProfile: this.cloneValue(block.objectProfile, null)
        };
    }

    serializeFoundationState(gameState) {
        if (typeof zoneSystem !== 'undefined') zoneSystem.update?.(gameState, 0);
        if (typeof statusSystem !== 'undefined') statusSystem.reconcileAuras?.(gameState);
        if (typeof objectSystem !== 'undefined') objectSystem.update?.(gameState, 0);
        if (typeof structureSystem !== 'undefined') structureSystem.update?.(gameState, 0);
        if (typeof physicsSystem !== 'undefined') physicsSystem.update?.(gameState, 0);
        if (typeof lifeSimSystem !== 'undefined') lifeSimSystem.rebuildDerivedState?.(gameState);
        if (typeof mlInferenceSystem !== 'undefined') mlInferenceSystem.update?.(gameState, 0);

        return {
            zones: typeof zoneSystem !== 'undefined' ? zoneSystem.serializeDurableState?.() || null : null,
            statuses: typeof statusSystem !== 'undefined' ? statusSystem.serializeDurableState?.() || null : null,
            objects: typeof objectSystem !== 'undefined' ? objectSystem.serializeDurableState?.() || null : null,
            sleep: typeof sleepSystem !== 'undefined' ? sleepSystem.serializeDurableState?.() || null : null,
            lifeSim: typeof lifeSimSystem !== 'undefined' ? lifeSimSystem.serializeDurableState?.() || null : null,
            mlInference: typeof mlInferenceSystem !== 'undefined' ? mlInferenceSystem.serializeDurableState?.() || null : null,
            roster: typeof rosterSystem !== 'undefined' ? rosterSystem.serializeDurableState?.(gameState) || null : null,
            teaching: typeof teachingSystem !== 'undefined' ? teachingSystem.serializeDurableState?.() || null : null,
            communication: typeof communicationSystem !== 'undefined' ? communicationSystem.serializeDurableState?.() || null : null
        };
    }

    serializeState(gameState) {
        const safeViewMode = gameState.viewMode === 'battle'
            ? 'focused-garden'
            : (gameState.viewMode || 'focused-garden');
        const serialized = {
            version: CURRENT_SAVE_VERSION,
            meta: {
                serializedAtMs: Date.now(),
                timeScale: gameState.timeScale ?? 1,
                focusedZoneId: gameState.focusedZoneId || null,
                viewMode: safeViewMode,
                activeBattleId: null,
                refreshRevisions: this.getCurrentRefreshRevisions(),
                replay: this.cloneValue(gameState.replay, null),
                accessibilitySettings: typeof gameUI !== 'undefined' && gameUI.getAccessibilitySettings
                    ? this.cloneValue(gameUI.getAccessibilitySettings(), {})
                    : {}
            },
            butterflies: (gameState.butterflies || []).map(butterfly => this.serializeButterfly(butterfly)),
            flowers: (gameState.flowers || []).map(flower => this.serializeFlower(flower)),
            caterpillars: (gameState.caterpillars || []).map(caterpillar => this.serializeCaterpillar(caterpillar)),
            blocks: (gameState.blocks || []).map(block => this.serializeBlock(block)),
            progression: typeof progressionManager !== 'undefined' && progressionManager.serializeDurableState
                ? progressionManager.serializeDurableState(gameState)
                : {
                    hybridJournal: this.cloneValue(gameState.hybridJournal, []),
                    nextHybridId: gameState.nextHybridId || 1,
                    progressionOrderIndex: gameState.progressionOrderIndex ?? 0,
                    unlockedButterflyTypes: Array.from(gameState.unlockedButterflyTypes || []),
                    unlockHistory: this.cloneValue(gameState.unlockHistory, []),
                    starterPairsSeeded: this.cloneValue(gameState.starterPairsSeeded, {}),
                    perTypeUnlockStatus: this.cloneValue(gameState.perTypeUnlockStatus, {}),
                    perWildButterflyProgress: this.cloneValue(gameState.perWildButterflyProgress, {})
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

        this.lastSerializedState = {
            serializedAtMs: serialized.meta?.serializedAtMs || Date.now(),
            butterflyCount: serialized.butterflies?.length || 0,
            flowerCount: serialized.flowers?.length || 0,
            caterpillarCount: serialized.caterpillars?.length || 0,
            blockCount: serialized.blocks?.length || 0
        };

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
            blocks: [],
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
            blocks: [],
            progression: {},
            runtime: {},
            foundations: {},
            meta: {}
        });
        const loadedFromVersion = migrated.version || null;

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
                refreshRevisions: this.normalizeRefreshRevisions(migrated.meta?.refreshRevisions),
                replay: this.cloneValue(migrated.meta?.replay, null),
                accessibilitySettings: this.cloneValue(migrated.meta?.accessibilitySettings, {})
            };
        }

        migrated.meta = migrated.meta || {};
        migrated.version = CURRENT_SAVE_VERSION;
        migrated.meta.refreshRevisions = this.normalizeRefreshRevisions(migrated.meta.refreshRevisions);
        migrated.meta.replay = this.cloneValue(migrated.meta.replay, null);
        if (migrated.meta.viewMode === 'battle') {
            migrated.meta.viewMode = 'focused-garden';
            migrated.meta.activeBattleId = null;
        }
        if (loadedFromVersion !== CURRENT_SAVE_VERSION) {
            migrated.meta.persistRefreshToStorage = true;
        }

        return migrated;
    }

    getRestoreSafetyLimits() {
        const entityConfig = gameConfig?.entities || {};
        const zoneCount = Math.max(1, (gameConfig?.world?.zones || []).length);
        const maxButterflies = entityConfig.maxButterflies || 8;
        const maxFlowers = entityConfig.maxFlowers || 6;
        const blockBudget = (gameConfig?.entities?.blocksPerZone || 20) * zoneCount;
        return {
            // Long-soak ecology now grows materially beyond the old repair-era caps.
            // Keep the guard, but size it to valid late-cycle worlds instead of
            // treating them as overload and wiping the restore payload.
            butterflies: Math.max(40, maxButterflies * 5),
            flowers: Math.max(84, maxFlowers * 14),
            caterpillars: 24,
            blocks: Math.max(96, blockBudget + 16),
            totalEntities: Math.max(260, blockBudget + (maxButterflies * 5) + (maxFlowers * 14) + 36),
            hybridJournal: 240
        };
    }

    sanitizeRestoredState(normalized = {}) {
        const limits = this.getRestoreSafetyLimits();
        const sanitized = this.cloneValue(normalized, {
            butterflies: [],
            flowers: [],
            caterpillars: [],
            blocks: [],
            progression: {},
            runtime: {},
            foundations: {},
            meta: {}
        });
        sanitized.meta = sanitized.meta || {};
        sanitized.progression = sanitized.progression || {};
        sanitized.runtime = sanitized.runtime || {};
        sanitized.foundations = sanitized.foundations || {};

        const originalCounts = {
            butterflies: (sanitized.butterflies || []).length,
            flowers: (sanitized.flowers || []).length,
            caterpillars: (sanitized.caterpillars || []).length,
            blocks: (sanitized.blocks || []).length
        };
        const totalEntities = originalCounts.butterflies + originalCounts.flowers + originalCounts.caterpillars + originalCounts.blocks;

        const severeOverload =
            originalCounts.butterflies > (limits.butterflies * 2) ||
            originalCounts.flowers > (limits.flowers * 2) ||
            originalCounts.caterpillars > (limits.caterpillars * 2) ||
            originalCounts.blocks > (limits.blocks * 2) ||
            totalEntities > (limits.totalEntities * 2);

        const prioritizeButterfly = (butterfly = {}) => {
            let score = 0;
            if (butterfly.birthSource === 'bred') score += 100;
            if (butterfly.isHybrid) score += 60;
            if (butterfly.isImmortal) score += 40;
            if (butterfly.pregnancy) score += 20;
            score += Number.isFinite(butterfly.happiness) ? butterfly.happiness * 0.05 : 0;
            return score;
        };

        const prioritizeFlower = (flower = {}) => {
            let score = 0;
            if (flower.isImmortal) score += 50;
            if (flower.eggData) score += 30;
            if (flower.chrysalisData) score += 30;
            if (flower.occupancyState && flower.occupancyState !== 'normal') score += 10;
            return score;
        };

        const prioritizeCaterpillar = (caterpillar = {}) => {
            let score = 0;
            if (caterpillar.phase === 'forming-chrysalis') score += 30;
            if (caterpillar.lifecycleData?.reservationActive) score += 20;
            return score;
        };

        const pruneEntityFamiliesToLimits = () => {
            sanitized.butterflies = (sanitized.butterflies || [])
                .sort((a, b) => prioritizeButterfly(b) - prioritizeButterfly(a))
                .slice(0, limits.butterflies);
            sanitized.flowers = (sanitized.flowers || [])
                .sort((a, b) => prioritizeFlower(b) - prioritizeFlower(a))
                .slice(0, limits.flowers);
            sanitized.caterpillars = (sanitized.caterpillars || [])
                .sort((a, b) => prioritizeCaterpillar(b) - prioritizeCaterpillar(a))
                .slice(0, limits.caterpillars);
            sanitized.blocks = (sanitized.blocks || []).slice(0, limits.blocks);

            return {
                butterflies: sanitized.butterflies.length,
                flowers: sanitized.flowers.length,
                caterpillars: sanitized.caterpillars.length,
                blocks: sanitized.blocks.length
            };
        };

        if (severeOverload) {
            const prunedCounts = pruneEntityFamiliesToLimits();
            sanitized.meta.forceFreshWorld = false;
            sanitized.meta.persistRefreshToStorage = true;
            sanitized.meta.restoreRecoveryNote = `Recovered overloaded save by preserving ${prunedCounts.butterflies} butterflies, ${prunedCounts.flowers} flowers, ${prunedCounts.caterpillars} caterpillars, ${prunedCounts.blocks} blocks from ${originalCounts.butterflies}/${originalCounts.flowers}/${originalCounts.caterpillars}/${originalCounts.blocks}`;
            sanitized.runtime.pendingOffspringReservations = 0;
        } else {
            const prunedCounts = pruneEntityFamiliesToLimits();

            if (
                prunedCounts.butterflies !== originalCounts.butterflies ||
                prunedCounts.flowers !== originalCounts.flowers ||
                prunedCounts.caterpillars !== originalCounts.caterpillars
            ) {
                sanitized.meta.restoreRecoveryNote =
                    `Pruned restored world to ${prunedCounts.butterflies} butterflies, ${prunedCounts.flowers} flowers, ${prunedCounts.caterpillars} caterpillars, ${prunedCounts.blocks} blocks`;
            }
        }

        if (Array.isArray(sanitized.progression.hybridJournal)) {
            sanitized.progression.hybridJournal = sanitized.progression.hybridJournal.slice(0, limits.hybridJournal);
        }

        return sanitized;
    }

    restoreFeedingState(butterfly, feedingData = {}, flowerById = new Map()) {
        butterfly.feeding = butterfly.feeding || {};
        butterfly.feeding.cooldowns = new Map(feedingData.cooldowns || []);
        butterfly.feeding.startHappiness = feedingData.startHappiness ?? null;
        butterfly.feeding.targetFlower = feedingData.targetFlowerId ? (flowerById.get(feedingData.targetFlowerId) || null) : null;
    }

    instantiateButterfly(savedButterfly, flowerById = new Map()) {
        const restoredBaselineTraits = this.cloneValue(savedButterfly.lifeSim?.genetics?.baselineTraits, null);
        const restoredMutationProfile = this.cloneValue(
            savedButterfly.mutationProfile || savedButterfly.lifeSim?.genetics?.mutationProfile,
            null
        );
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
                mutationProfile: restoredMutationProfile,
                isHybrid: !!savedButterfly.isHybrid,
                displayName: savedButterfly.displayName || null,
                hybridEntryId: savedButterfly.hybridEntryId || null,
                pheromoneCooldownUntil: savedButterfly.pheromoneCooldownUntil ?? 0,
                fertilityUsesRemaining: savedButterfly.fertilityUsesRemaining === 'infinite'
                    ? Infinity
                    : (savedButterfly.fertilityUsesRemaining ?? Infinity),
                pregnancy: this.cloneValue(savedButterfly.pregnancy, null),
                specialAbility: savedButterfly.specialAbility || null,
                customTraits: savedButterfly.isHybrid ? restoredBaselineTraits : null,
                currentZoneId: savedButterfly.currentZoneId || savedButterfly.lifeSim?.lifecycle?.currentZoneId || null,
                wildLifecycle: this.cloneValue(savedButterfly.wildLifecycle, null)
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
        butterfly.wildLifecycle = this.cloneValue(savedButterfly.wildLifecycle, butterfly.wildLifecycle || null);
        butterfly.lifeSim = this.cloneValue(savedButterfly.lifeSim, butterfly.lifeSim);
        butterfly.mutationProfile = restoredMutationProfile;
        butterfly.personalName = savedButterfly.personalName || butterfly.personalName || null;
        butterfly.nameDisambiguator = savedButterfly.nameDisambiguator || null;
        if (savedButterfly.displayName) {
            butterfly.displayName = savedButterfly.displayName;
            butterfly.name = savedButterfly.displayName;
        }
        if (butterfly.lifeSim?.identity) {
            butterfly.lifeSim.identity.personalName = savedButterfly.personalName || butterfly.lifeSim.identity.personalName || null;
            butterfly.lifeSim.identity.displayName = savedButterfly.displayName || butterfly.lifeSim.identity.displayName || null;
        }
        if (butterfly.lifeSim?.communication && savedButterfly.displayName) {
            butterfly.lifeSim.communication.selfName = savedButterfly.displayName;
        }
        if (restoredBaselineTraits) {
            butterfly.traits = {
                ...butterfly.traits,
                ...restoredBaselineTraits
            };
        }
        butterfly.specialAbility = savedButterfly.specialAbility
            || butterfly.traits?.special
            || restoredBaselineTraits?.special
            || butterfly.specialAbility
            || null;
        butterfly.traits.special = butterfly.specialAbility;
        if (butterfly.personality?.traits) {
            butterfly.personality.traits = {
                ...butterfly.personality.traits,
                ...butterfly.traits
            };
        }
        butterfly.currentZoneId = savedButterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || butterfly.currentZoneId;
        if (butterfly.lifeSim?.lifecycle) {
            butterfly.lifeSim.lifecycle.currentZoneId = butterfly.currentZoneId || null;
        }
        butterfly.timers = {
            ...butterfly.timers,
            ...(savedButterfly.timers || {})
        };
        butterfly.blockInteraction = {
            ...butterfly.blockInteraction,
            ...(savedButterfly.blockInteraction || {})
        };
        this.restoreFeedingState(butterfly, savedButterfly.feeding, flowerById);
        butterfly.zoneTravel = this.cloneValue(savedButterfly.zoneTravel, null);
        if (butterfly.zoneTravel) {
            butterfly.stateData = butterfly.stateData || {};
            butterfly.stateData.zoneTravel = butterfly.zoneTravel;
        }
        return butterfly;
    }

    instantiateFlower(savedFlower) {
        const flower = new Flower(savedFlower.x, savedFlower.y, !!savedFlower.isImmortal, {
            currentZoneId: savedFlower.currentZoneId || null,
            flowerType: savedFlower.flowerType || null
        });
        flower.id = savedFlower.id;
        flower.stage = savedFlower.stage || flower.stage;
        flower.stageTimer = savedFlower.stageTimer ?? flower.stageTimer;
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
        const caterpillar = new Caterpillar(
            savedCaterpillar.x,
            savedCaterpillar.y,
            this.cloneValue(savedCaterpillar.lifecycleData, {}),
            { currentZoneId: savedCaterpillar.currentZoneId || null }
        );
        caterpillar.id = savedCaterpillar.id;
        caterpillar.phase = savedCaterpillar.phase || caterpillar.phase;
        caterpillar.phaseStartedAt = savedCaterpillar.phaseStartedAt ?? caterpillar.phaseStartedAt;
        caterpillar.phaseTimeout = savedCaterpillar.phaseTimeout ?? caterpillar.phaseTimeout;
        caterpillar.dead = !!savedCaterpillar.dead;
        caterpillar.failReason = savedCaterpillar.failReason || null;
        caterpillar.lifeSim = this.cloneValue(savedCaterpillar.lifeSim, caterpillar.lifeSim);
        caterpillar.currentZoneId = savedCaterpillar.currentZoneId || caterpillar.lifeSim?.lifecycle?.currentZoneId || caterpillar.currentZoneId;
        if (caterpillar.lifeSim?.lifecycle) {
            caterpillar.lifeSim.lifecycle.currentZoneId = caterpillar.currentZoneId || null;
        }
        caterpillar.__savedTargetFlowerId = savedCaterpillar.targetFlowerId || null;
        return caterpillar;
    }

    instantiateBlock(savedBlock) {
        const block = new Block(savedBlock.x, savedBlock.y, {
            currentZoneId: savedBlock.currentZoneId || null,
            renderWidth: savedBlock.renderWidth || undefined,
            renderHeight: savedBlock.renderHeight || undefined,
            blockHeight: savedBlock.blockHeight || 1,
            stackIndex: savedBlock.stackIndex || 0,
            supportBlockId: savedBlock.supportBlockId || null,
            lastPlacedMode: savedBlock.lastPlacedMode || 'ground',
            carriedById: savedBlock.carriedById || null,
            attachedOffset: this.cloneValue(savedBlock.attachedOffset, null)
        });
        block.id = savedBlock.id;
        block.movedAtFrame = savedBlock.movedAtFrame ?? block.movedAtFrame;
        block.lastMovedById = savedBlock.lastMovedById || null;
        block.objectProfile = this.cloneValue(savedBlock.objectProfile, block.objectProfile);
        return block;
    }

    getLiveEntityIds(worldState = {}) {
        return new Set([
            ...(worldState.butterflies || []).map(entity => entity?.id).filter(Boolean),
            ...(worldState.flowers || []).map(entity => entity?.id).filter(Boolean),
            ...(worldState.caterpillars || []).map(entity => entity?.id).filter(Boolean),
            ...(worldState.blocks || []).map(entity => entity?.id).filter(Boolean)
        ]);
    }

    getLiveObjectIds(worldState = {}) {
        return new Set([
            ...(worldState.flowers || []).map(entity => entity?.id).filter(Boolean),
            ...(worldState.blocks || []).map(entity => entity?.id).filter(Boolean)
        ]);
    }

    filterSerializedMapEntries(source = {}, allowedIds = new Set()) {
        const filtered = {};
        for (const [entryId, value] of Object.entries(source || {})) {
            if (!allowedIds.has(entryId)) continue;
            filtered[entryId] = this.cloneValue(value, null);
        }
        return filtered;
    }

    filterFoundationStateForLiveWorld(foundations = {}, worldState = {}) {
        const liveEntityIds = this.getLiveEntityIds(worldState);
        const liveObjectIds = this.getLiveObjectIds(worldState);

        return {
            ...(foundations || {}),
            objects: this.filterSerializedMapEntries(foundations?.objects || {}, liveObjectIds),
            statuses: {
                effectsByTarget: this.filterSerializedMapEntries(foundations?.statuses?.effectsByTarget || {}, liveEntityIds),
                cooldownsByEntityId: this.filterSerializedMapEntries(foundations?.statuses?.cooldownsByEntityId || {}, liveEntityIds),
                chargesByEntityId: this.filterSerializedMapEntries(foundations?.statuses?.chargesByEntityId || {}, liveEntityIds),
                immunitiesByEntityId: this.filterSerializedMapEntries(foundations?.statuses?.immunitiesByEntityId || {}, liveEntityIds)
            }
        };
    }

    shouldPreserveStructuredBlock(block) {
        if (!block?.id) return false;
        if (block.carriedById) return false;
        return !!block.lastMovedById
            || (block.movedAtFrame || 0) > 0
            || (block.stackIndex || 0) > 0
            || !!block.supportBlockId
            || (block.lastPlacedMode && block.lastPlacedMode !== 'ground');
    }

    getZoneIdForRestoredEntity(gameCoreInstance, entity, fallbackZoneId = null, zoneIds = []) {
        const resolvedZoneId = gameCoreInstance?.getEntityZoneId?.(entity, null)
            || entity?.currentZoneId
            || entity?.lifeSim?.lifecycle?.currentZoneId
            || entity?.lifecycleData?.currentZoneId
            || fallbackZoneId
            || null;
        if (resolvedZoneId && zoneIds.includes(resolvedZoneId)) return resolvedZoneId;
        return this.getDefaultRestoreZoneId(gameCoreInstance, fallbackZoneId);
    }

    getRestorePlacementProfile(gameCoreInstance, entityType = 'entity', zoneId = null, entity = null) {
        if (!gameCoreInstance) {
            return {
                padding: 8,
                randomPadding: 28,
                avoidDoorwayRadius: 0
            };
        }

        if (entityType === 'butterfly') {
            const interactionSpace = gameCoreInstance.getButterflyInteractionSpace?.(zoneId, { entity }) || {};
            return {
                padding: interactionSpace.clampPadding ?? 8,
                randomPadding: interactionSpace.randomPadding ?? 28,
                avoidDoorwayRadius: interactionSpace.doorwayAvoidRadius ?? 42
            };
        }

        if (entityType === 'flower') {
            const interactionSpace = gameCoreInstance.getFlowerInteractionSpace?.(zoneId, {
                entity,
                occupancyState: entity?.occupancyState || 'normal',
                flowerType: entity?.flowerType || null
            }) || {};
            return {
                padding: interactionSpace.clampPadding ?? 8,
                randomPadding: interactionSpace.randomPadding ?? 30,
                avoidDoorwayRadius: interactionSpace.doorwayAvoidRadius ?? 42
            };
        }

        if (entityType === 'caterpillar') {
            const interactionSpace = gameCoreInstance.getCaterpillarInteractionSpace?.(zoneId, { entity }) || {};
            const flowerSpace = gameCoreInstance.getFlowerInteractionSpace?.(zoneId) || {};
            return {
                padding: interactionSpace.clampPadding ?? 8,
                randomPadding: flowerSpace.randomPadding ?? 28,
                avoidDoorwayRadius: flowerSpace.doorwayAvoidRadius ?? 42
            };
        }

        if (entityType === 'block') {
            const blockUnit = gameCoreInstance?.structureSystem?.getCanonicalBlockUnit?.(
                Math.max(1, (entity?.stackIndex || 0) + 1)
            ) || {};
            return {
                padding: blockUnit.clampPadding ?? 8,
                randomPadding: blockUnit.scatterRandomPadding ?? 40,
                avoidDoorwayRadius: blockUnit.doorwayAvoidRadius ?? 0
            };
        }

        return {
            padding: 8,
            randomPadding: 28,
            avoidDoorwayRadius: 0
        };
    }

    reconcileLoadedEntityPlacement(gameCoreInstance, entity, options = {}) {
        if (!entity) return entity;
        const zoneIds = options.zoneIds || gameCoreInstance?.getZoneIds?.() || [];
        const fallbackZoneId = options.fallbackZoneId || null;
        const zoneId = this.getZoneIdForRestoredEntity(gameCoreInstance, entity, fallbackZoneId, zoneIds);
        if (!zoneId) return entity;
        const padding = options.padding ?? 8;
        const randomPadding = options.randomPadding ?? 26;
        const avoidDoorwayRadius = options.avoidDoorwayRadius ?? 0;

        gameCoreInstance?.assignEntityToZone?.(entity, zoneId);
        const hasPoint = Number.isFinite(entity.x) && Number.isFinite(entity.y);
        const clampedPoint = hasPoint
            ? gameCoreInstance?.clampPlacementPointInZone?.(zoneId, entity.x, entity.y, padding)
            : null;
        const shouldAvoidDoorway = Number.isFinite(avoidDoorwayRadius) && avoidDoorwayRadius > 0;
        const pointNearDoorway = shouldAvoidDoorway && clampedPoint
            ? !!gameCoreInstance?.isPointNearZoneDoorway?.(zoneId, clampedPoint, avoidDoorwayRadius)
            : false;
        const pointIsUsable = !!clampedPoint && (!shouldAvoidDoorway || !pointNearDoorway);
        const nextPoint = pointIsUsable
            ? clampedPoint
            : gameCoreInstance?.getRandomPlacementPoint?.(zoneId, randomPadding)
                || gameCoreInstance?.getZoneCenter?.(zoneId)
                || clampedPoint
                || null;

        if (nextPoint) {
            entity.x = nextPoint.x;
            entity.y = nextPoint.y;
            if (typeof gridManager !== 'undefined' && gridManager?.screenToIso) {
                entity.gridPos = gridManager.screenToIso(entity.x, entity.y + (entity.shadowOffset || 0));
            }
        }

        if (options.clearMovementTarget && entity.movement?.clearTarget) {
            entity.movement.clearTarget();
        }

        if (entity.zoneTravel?.targetZoneId && zoneIds.length && !zoneIds.includes(entity.zoneTravel.targetZoneId)) {
            entity.zoneTravel.targetZoneId = null;
        }

        return entity;
    }

    buildAmbientBlocksForRefresh(gameCoreInstance, preservedBlocks = [], zoneIds = []) {
        const blockConfig = gameConfig?.entities?.block || {};
        const blocksPerZone = gameConfig?.entities?.blocksPerZone || 20;
        const byZone = new Map();
        const refreshed = [];

        for (const block of preservedBlocks) {
            const zoneId = this.getZoneIdForRestoredEntity(gameCoreInstance, block, null, zoneIds);
            if (!zoneId) continue;
            const restoreProfile = this.getRestorePlacementProfile(gameCoreInstance, 'block', zoneId, block);
            gameCoreInstance?.assignEntityToZone?.(block, zoneId);
            const clamped = gameCoreInstance?.clampPlacementPointInZone?.(zoneId, block.x, block.y, restoreProfile.padding);
            if (clamped) {
                block.x = clamped.x;
                block.y = clamped.y;
                if (typeof gridManager !== 'undefined' && gridManager?.screenToIso) {
                    block.gridPos = gridManager.screenToIso(block.x, block.y);
                }
            }
            if (!byZone.has(zoneId)) byZone.set(zoneId, []);
            byZone.get(zoneId).push(block);
            refreshed.push(block);
        }

        for (const zoneId of zoneIds || []) {
            const zoneBlocks = byZone.get(zoneId) || [];
            const ambientBudget = Math.max(0, blocksPerZone - zoneBlocks.length);
            const restoreProfile = this.getRestorePlacementProfile(gameCoreInstance, 'block', zoneId, null);
            for (let index = 0; index < ambientBudget; index += 1) {
                const point = gameCoreInstance?.findValidBlockSpawnPoint?.(zoneId, zoneBlocks, {
                    maxAttempts: 36
                }) || gameCoreInstance?.getRandomPlacementPoint?.(zoneId, restoreProfile.randomPadding);
                if (!point) continue;
                const block = new Block(point.x, point.y, {
                    currentZoneId: zoneId,
                    renderWidth: blockConfig.renderWidth || 16,
                    renderHeight: blockConfig.renderHeight || 16
                });
                gameCoreInstance?.assignEntityToZone?.(block, zoneId);
                zoneBlocks.push(block);
                refreshed.push(block);
            }
        }

        return refreshed;
    }

    clearButterflyTransientWorldState(butterfly, options = {}) {
        if (!butterfly) return;
        const validFlowerIds = options.validFlowerIds || new Set();
        const zoneIds = options.zoneIds || [];

        if (butterfly.feeding?.targetFlower?.id && !validFlowerIds.has(butterfly.feeding.targetFlower.id)) {
            butterfly.feeding.targetFlower = null;
        }

        if (options.refreshBlocks && butterfly.blockInteraction) {
            butterfly.blockInteraction.targetBlockId = null;
            butterfly.blockInteraction.carryingBlockId = null;
            butterfly.blockInteraction.placementTarget = null;
            butterfly.blockInteraction.carryFrames = 0;
            butterfly.blockInteraction.cooldownFrames = Math.max(90, butterfly.blockInteraction.cooldownFrames || 0);
        }

        if (butterfly.physics?.carry) {
            butterfly.physics.carry.anchor = null;
        }

        if (butterfly.zoneTravel?.targetZoneId && zoneIds.length && !zoneIds.includes(butterfly.zoneTravel.targetZoneId)) {
            butterfly.zoneTravel.targetZoneId = null;
        }
    }

    clearRestoredZoneTravel(butterfly) {
        if (!butterfly) return;
        butterfly.zoneTravel = null;
        if (butterfly.stateData?.zoneTravel) {
            delete butterfly.stateData.zoneTravel;
        }
    }

    placeRestoredTraveler(entity, point) {
        if (!entity || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
        entity.x = point.x;
        entity.y = point.y;
        if (typeof gridManager !== 'undefined' && gridManager?.screenToIso) {
            entity.gridPos = gridManager.screenToIso(entity.x, entity.y + (entity.shadowOffset || 0));
        }
        entity.updateZIndex?.();
    }

    restoreButterflyZoneTravel(gameCoreInstance, butterfly, options = {}) {
        if (!butterfly?.zoneTravel) return null;

        const zoneIds = options.zoneIds || gameCoreInstance?.getZoneIds?.() || [];
        const fallbackZoneId = options.fallbackZoneId || null;
        const phase = ['departing', 'warping', 'entering', 'arriving', 'exiting'].includes(butterfly.zoneTravel.phase)
            ? butterfly.zoneTravel.phase
            : (butterfly.zoneTravel.targetZoneId ? 'departing' : 'exiting');
        const sourceZoneId = butterfly.zoneTravel.sourceZoneId
            || this.getZoneIdForRestoredEntity(gameCoreInstance, butterfly, fallbackZoneId, zoneIds);
        const targetZoneId = butterfly.zoneTravel.targetZoneId || null;

        if (!sourceZoneId) {
            this.clearRestoredZoneTravel(butterfly);
            return null;
        }

        if (targetZoneId && zoneIds.length && !zoneIds.includes(targetZoneId)) {
            this.clearRestoredZoneTravel(butterfly);
            return null;
        }

        const route = gameCoreInstance?.buildZoneTravelRoute?.(sourceZoneId, targetZoneId)
            || null;
        if (!route?.departureVisibleAnchor || !route?.departureWarpAnchor) {
            this.clearRestoredZoneTravel(butterfly);
            return null;
        }

        const normalized = {
            sourceZoneId,
            targetZoneId,
            sourceAnchor: route.departureVisibleAnchor,
            targetAnchor: route.departureWarpAnchor,
            departureVisibleAnchor: route.departureVisibleAnchor,
            departureWarpAnchor: route.departureWarpAnchor,
            arrivalVisibleAnchor: route.arrivalVisibleAnchor || route.departureVisibleAnchor,
            arrivalWarpAnchor: route.arrivalWarpAnchor || route.departureWarpAnchor,
            phase,
            progressFrames: Math.max(0, butterfly.zoneTravel.progressFrames || 0),
            reason: butterfly.zoneTravel.reason || 'migration',
            arrivalTargetEntityId: butterfly.zoneTravel.arrivalTargetEntityId || null,
            renderBehindCover: phase === 'warping' || phase === 'entering' || phase === 'exiting'
        };

        if (normalized.targetZoneId) {
            normalized.arrivalTarget = gameCoreInstance?.getZoneTravelSettleTarget?.(normalized)
                || normalized.arrivalVisibleAnchor
                || normalized.targetAnchor;
        }

        butterfly.zoneTravel = normalized;
        butterfly.stateData = butterfly.stateData || {};
        butterfly.stateData.zoneTravel = normalized;

        if (phase === 'departing' || phase === 'exiting') {
            gameCoreInstance?.assignEntityToZone?.(butterfly, sourceZoneId);
            this.placeRestoredTraveler(butterfly, normalized.departureVisibleAnchor);
            return normalized;
        }

        if (phase === 'warping') {
            gameCoreInstance?.assignEntityToZone?.(butterfly, sourceZoneId);
            this.placeRestoredTraveler(butterfly, normalized.departureWarpAnchor);
            return normalized;
        }

        if (normalized.targetZoneId) {
            gameCoreInstance?.assignEntityToZone?.(butterfly, normalized.targetZoneId);
        }

        if (phase === 'entering') {
            this.placeRestoredTraveler(butterfly, normalized.arrivalWarpAnchor || normalized.arrivalVisibleAnchor);
            return normalized;
        }

        this.placeRestoredTraveler(
            butterfly,
            normalized.arrivalVisibleAnchor
                || normalized.arrivalTarget
                || gameCoreInstance?.getZoneCenter?.(normalized.targetZoneId)
        );
        return normalized;
    }

    reconcileLoadedWorld(gameCoreInstance, normalized, worldState = {}) {
        const refreshPlan = this.buildLoadRefreshPlan(normalized?.meta || {}, gameCoreInstance);
        const fallbackZoneId = this.getDefaultRestoreZoneId(gameCoreInstance, normalized?.meta?.focusedZoneId || null);
        const zoneIds = refreshPlan.zoneIds.length ? refreshPlan.zoneIds : [fallbackZoneId].filter(Boolean);

        const flowers = [...(worldState.flowers || [])];
        const butterflies = [...(worldState.butterflies || [])];
        const caterpillars = [...(worldState.caterpillars || [])];
        const instantiatedBlocks = [...(worldState.blocks || [])];

        if (refreshPlan.refreshFlowers) {
            for (const flower of flowers) {
                const zoneId = this.getZoneIdForRestoredEntity(gameCoreInstance, flower, fallbackZoneId, zoneIds);
                const restoreProfile = this.getRestorePlacementProfile(gameCoreInstance, 'flower', zoneId, flower);
                this.reconcileLoadedEntityPlacement(gameCoreInstance, flower, {
                    zoneIds,
                    fallbackZoneId,
                    padding: restoreProfile.padding,
                    randomPadding: restoreProfile.randomPadding,
                    avoidDoorwayRadius: restoreProfile.avoidDoorwayRadius
                });
            }
        }

        if (refreshPlan.refreshCaterpillars) {
            for (const caterpillar of caterpillars) {
                const zoneId = this.getZoneIdForRestoredEntity(gameCoreInstance, caterpillar, fallbackZoneId, zoneIds);
                const restoreProfile = this.getRestorePlacementProfile(gameCoreInstance, 'caterpillar', zoneId, caterpillar);
                this.reconcileLoadedEntityPlacement(gameCoreInstance, caterpillar, {
                    zoneIds,
                    fallbackZoneId,
                    padding: restoreProfile.padding,
                    randomPadding: restoreProfile.randomPadding,
                    avoidDoorwayRadius: restoreProfile.avoidDoorwayRadius,
                    clearMovementTarget: true
                });
            }
        }

        const validFlowerIds = new Set(flowers.map(flower => flower?.id).filter(Boolean));

        if (refreshPlan.refreshButterflies) {
            for (const butterfly of butterflies) {
                const zoneId = this.getZoneIdForRestoredEntity(gameCoreInstance, butterfly, fallbackZoneId, zoneIds);
                const restoreProfile = this.getRestorePlacementProfile(gameCoreInstance, 'butterfly', zoneId, butterfly);
                this.reconcileLoadedEntityPlacement(gameCoreInstance, butterfly, {
                    zoneIds,
                    fallbackZoneId,
                    padding: restoreProfile.padding,
                    randomPadding: restoreProfile.randomPadding,
                    avoidDoorwayRadius: restoreProfile.avoidDoorwayRadius,
                    clearMovementTarget: true
                });
                this.clearButterflyTransientWorldState(butterfly, {
                    refreshBlocks: refreshPlan.refreshBlocks,
                    validFlowerIds,
                    zoneIds
                });
            }
        }

        for (const butterfly of butterflies) {
            this.restoreButterflyZoneTravel(gameCoreInstance, butterfly, {
                zoneIds,
                fallbackZoneId
            });
        }

        const blocks = refreshPlan.refreshBlocks
            ? this.buildAmbientBlocksForRefresh(
                gameCoreInstance,
                instantiatedBlocks.filter(block => this.shouldPreserveStructuredBlock(block)),
                zoneIds
            )
            : instantiatedBlocks.map(block => {
                const zoneId = this.getZoneIdForRestoredEntity(gameCoreInstance, block, fallbackZoneId, zoneIds);
                const restoreProfile = this.getRestorePlacementProfile(gameCoreInstance, 'block', zoneId, block);
                return this.reconcileLoadedEntityPlacement(gameCoreInstance, block, {
                    zoneIds,
                    fallbackZoneId,
                    padding: restoreProfile.padding,
                    randomPadding: restoreProfile.randomPadding,
                    avoidDoorwayRadius: restoreProfile.avoidDoorwayRadius
                });
            });

        normalized.meta = normalized.meta || {};
        normalized.meta.refreshRevisions = refreshPlan.current;
        normalized.meta.persistRefreshToStorage = refreshPlan.persistRefreshedSave;

        if (refreshPlan.persistRefreshedSave) {
            const refreshReasons = [];
            if (refreshPlan.missingRevisionMetadata) refreshReasons.push('added save refresh metadata');
            if (refreshPlan.refreshEnvironmentLayout) refreshReasons.push('re-seated the garden layout');
            if (refreshPlan.refreshBlocks) refreshReasons.push('rebuilt ambient block scatter');
            if (refreshPlan.refreshButterflies) refreshReasons.push('re-seated butterfly placements');
            if (refreshPlan.refreshFlowers) refreshReasons.push('re-seated flower placements');
            if (refreshPlan.refreshCaterpillars) refreshReasons.push('re-seated lifecycle placements');
            normalized.meta.restoreRecoveryNote = [
                normalized.meta.restoreRecoveryNote,
                `Refreshed this save to the current build without resetting long-running butterflies (${refreshReasons.join(' | ')})`
            ].filter(Boolean).join(' · ');
        }

        normalized.foundations = this.filterFoundationStateForLiveWorld(normalized.foundations || {}, {
            butterflies,
            flowers,
            caterpillars,
            blocks
        });

        return {
            refreshPlan,
            butterflies,
            flowers,
            caterpillars,
            blocks
        };
    }

    applyProgressionState(gameState, progression = {}) {
        if (typeof progressionManager !== 'undefined' && progressionManager.applyDurableState) {
            progressionManager.applyDurableState(gameState, progression);
            return;
        }
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
        const normalized = this.sanitizeRestoredState(this.deserializeState(serialized));
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
        const blocks = (normalized.blocks || []).map(block => this.instantiateBlock(block));

        for (const caterpillar of caterpillars) {
            caterpillar.targetFlower = caterpillar.__savedTargetFlowerId
                ? (flowerById.get(caterpillar.__savedTargetFlowerId) || null)
                : null;
            delete caterpillar.__savedTargetFlowerId;
        }

        const reconciledWorld = this.reconcileLoadedWorld(gameCoreInstance, normalized, {
            butterflies,
            flowers,
            caterpillars,
            blocks
        });

        gameCoreInstance.entityManager?.clear?.();
        gameCoreInstance.resetFoundationSystems?.({
            preserveTelemetry: !!gameCoreInstance.telemetrySystem?.isSessionCaptureActive?.()
        });

        gameState.butterflies = reconciledWorld.butterflies;
        gameState.flowers = reconciledWorld.flowers;
        gameState.caterpillars = reconciledWorld.caterpillars;
        gameState.blocks = reconciledWorld.blocks;

        this.applyProgressionState(gameState, normalized.progression || {});
        this.applyRuntimeState(gameState, normalized.meta || {}, normalized.runtime || {});
        gameCoreInstance.ensureZoneOwnership?.();

        for (const butterfly of gameState.butterflies) {
            gameCoreInstance.entityManager?.addEntity?.('butterflies', butterfly);
            gameCoreInstance.registerEntityWithFoundationSystems?.(butterfly, 'butterfly');
        }
        for (const flower of gameState.flowers) {
            gameCoreInstance.entityManager?.addEntity?.('flowers', flower);
            gameCoreInstance.registerEntityWithFoundationSystems?.(flower, 'flower');
        }
        for (const caterpillar of gameState.caterpillars) {
            gameCoreInstance.entityManager?.addEntity?.('caterpillars', caterpillar);
            gameCoreInstance.registerEntityWithFoundationSystems?.(caterpillar, 'caterpillar');
        }
        for (const block of gameState.blocks) {
            gameCoreInstance.entityManager?.addEntity?.('blocks', block);
            gameCoreInstance.registerEntityWithFoundationSystems?.(block, 'block');
        }

        zoneSystem?.deserializeDurableState?.(normalized.foundations?.zones || {});
        statusSystem?.deserializeDurableState?.(normalized.foundations?.statuses || {});
        objectSystem?.deserializeDurableState?.(normalized.foundations?.objects || {});
        sleepSystem?.deserializeDurableState?.(normalized.foundations?.sleep || {});
        lifeSimSystem?.deserializeDurableState?.(normalized.foundations?.lifeSim || {});
        mlInferenceSystem?.deserializeDurableState?.(normalized.foundations?.mlInference || {});
        rosterSystem?.deserializeDurableState?.(normalized.foundations?.roster || {}, gameState);
        teachingSystem?.deserializeDurableState?.(normalized.foundations?.teaching || {});
        communicationSystem?.deserializeDurableState?.(normalized.foundations?.communication || {});

        if (normalized.meta?.focusedZoneId && gameCoreInstance.focusZone?.(normalized.meta.focusedZoneId)) {
            gameState.focusedZoneId = normalized.meta.focusedZoneId;
        }
        const restoredViewMode = normalized.meta?.viewMode === 'battle'
            ? 'focused-garden'
            : normalized.meta?.viewMode;
        if (restoredViewMode) {
            gameCoreInstance.setViewMode?.(restoredViewMode);
        }
        if (normalized.meta?.accessibilitySettings && typeof gameUI !== 'undefined') {
            gameUI.setAccessibilitySettings?.(normalized.meta.accessibilitySettings);
        }
        if (normalized.meta?.restoreRecoveryNote && typeof gameUI !== 'undefined') {
            gameUI.markSaveStatus?.('saved', normalized.meta.restoreRecoveryNote);
        }

        this.rebuildDerivedState(gameState);
        return normalized;
    }

    isQuotaExceededError(error) {
        const message = String(error?.message || '');
        return error?.name === 'QuotaExceededError'
            || error?.code === 22
            || error?.code === 1014
            || message.includes('exceeded the quota')
            || message.includes('QuotaExceededError');
    }

    trimStoredAuditReports(maxReports = 6) {
        if (typeof localStorage === 'undefined') return false;
        try {
            const raw = localStorage.getItem(PAPILIONEM_AUDIT_REPORTS_KEY);
            if (!raw) return false;
            const reports = JSON.parse(raw);
            if (!Array.isArray(reports) || reports.length <= maxReports) return false;
            localStorage.setItem(
                PAPILIONEM_AUDIT_REPORTS_KEY,
                JSON.stringify(reports.slice(-maxReports))
            );
            return true;
        } catch (_error) {
            try {
                localStorage.removeItem(PAPILIONEM_AUDIT_REPORTS_KEY);
                return true;
            } catch (__error) {
                return false;
            }
        }
    }

    reclaimStorageQuota() {
        if (typeof localStorage === 'undefined') return false;
        let reclaimed = false;
        try {
            if (localStorage.getItem(PAPILIONEM_AUDIT_SETUP_KEY) != null) {
                localStorage.removeItem(PAPILIONEM_AUDIT_SETUP_KEY);
                reclaimed = true;
            }
        } catch (_error) {
            // Ignore storage cleanup failures.
        }

        reclaimed = this.trimStoredAuditReports(6) || reclaimed;
        return reclaimed;
    }

    recordStorageFailure(error, payloadLength = 0, options = {}) {
        const isQuota = this.isQuotaExceededError(error);
        const summary = {
            message: error?.message || String(error || 'save-storage-failure'),
            quotaExceeded: isQuota,
            payloadLength,
            source: options.source || 'manual',
            storageKey: options.storageKey || PAPILIONEM_SAVE_KEY
        };
        gameCore?.telemetrySystem?.recordRuntimeIssue?.(
            isQuota ? 'save-storage-quota' : 'save-storage-error',
            summary
        );
        if (typeof gameUI !== 'undefined' && gameUI.markSaveStatus) {
            gameUI.markSaveStatus(
                'error',
                isQuota
                    ? 'Save storage is full; trimmed debug storage but could not finish autosave'
                    : 'Save failed; current session is still running'
            );
        }
    }

    async persistSerializedPayload(storageKey, payload, serialized, options = {}) {
        if (this.supportsIndexedDb()) {
            try {
                await this.writePayloadToIndexedDb(storageKey, payload);
                this.removeLegacyLocalSave(storageKey);
                this.commitSaveStatus(options);
                return serialized;
            } catch (error) {
                this.recordStorageBackendFailure(error, storageKey, 'write');
                if (this.shouldUseIndexedDbOnly()) {
                    if (options.throwOnError) throw error;
                    return null;
                }
            }
        }

        if (typeof localStorage === 'undefined') return null;
        const attemptSave = () => localStorage.setItem(storageKey, payload);

        try {
            attemptSave();
        } catch (error) {
            if (this.isQuotaExceededError(error) && this.reclaimStorageQuota()) {
                try {
                    attemptSave();
                } catch (retryError) {
                    this.recordStorageFailure(retryError, payload.length, { ...options, storageKey });
                    if (options.throwOnError) throw retryError;
                    return null;
                }
            } else {
                this.recordStorageFailure(error, payload.length, { ...options, storageKey });
                if (options.throwOnError) throw error;
                return null;
            }
        }
        this.commitSaveStatus(options);
        return serialized;
    }

    async saveToStorage(gameState, options = {}) {
        const storageKey = options.storageKey || PAPILIONEM_SAVE_KEY;
        const serialized = this.serializeState(gameState);
        const payload = JSON.stringify(serialized);

        return this.enqueueSave(() => this.persistSerializedPayload(storageKey, payload, serialized, options));
    }

    async saveToStorageDeferred(gameState, options = {}) {
        const storageKey = options.storageKey || PAPILIONEM_SAVE_KEY;
        return this.enqueueSave(async () => {
            const serialized = this.serializeState(gameState);
            const payload = JSON.stringify(serialized);
            return this.persistSerializedPayload(storageKey, payload, serialized, options);
        });
    }

    async loadFromStorage(gameCoreInstance, storageKey = PAPILIONEM_SAVE_KEY) {
        const stored = await this.readPayloadFromStorage(storageKey);
        if (!stored?.payload) return null;
        const serialized = JSON.parse(stored.payload);
        const restored = this.applyDeserializedState(gameCoreInstance, serialized);
        if (restored?.meta?.persistRefreshToStorage && gameCoreInstance?.gameState) {
            await this.saveToStorage(gameCoreInstance.gameState, {
                source: 'refresh',
                storageKey
            });
            if (restored.meta.restoreRecoveryNote && typeof gameUI !== 'undefined') {
                gameUI.markSaveStatus?.('saved', restored.meta.restoreRecoveryNote);
            }
        }
        return restored;
    }

    shouldIgnoreDurableMismatch(path = '') {
        if (!path) return false;
        if (path === 'meta.serializedAtMs') return true;
        if (path.includes('.lifeSim.derived')) return true;
        if (path.includes('.lifeSim.objectAwareness')) return true;
        if (path.includes('.lifeSim.spatialAwareness')) return true;
        if (path.includes('.lifeSim.progression')) return true;
        if (path.includes('.lifeSim.battleContext')) return true;
        return false;
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
            if (this.shouldIgnoreDurableMismatch(path)) continue;
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
        if (typeof structureSystem !== 'undefined') structureSystem.update?.(gameState, 0);
        if (typeof physicsSystem !== 'undefined') physicsSystem.update?.(gameState, 0);
        if (typeof sleepSystem !== 'undefined') sleepSystem.update?.(gameState, 0);
        if (typeof lifeSimSystem !== 'undefined') lifeSimSystem.rebuildDerivedState?.(gameState);
        if (typeof teachingSystem !== 'undefined') teachingSystem.update?.(gameState, 0);
        if (typeof behaviorSystem !== 'undefined') behaviorSystem.update?.(gameState, 0);
        if (typeof mlInferenceSystem !== 'undefined' && mlInferenceSystem.modelConfig?.useModelInference) {
            void mlInferenceSystem.loadModelArtifact?.();
        }
        if (typeof mlInferenceSystem !== 'undefined') mlInferenceSystem.update?.(gameState, 0);
        if (typeof battleSystem !== 'undefined') battleSystem.update?.(gameState, 0);

        if (typeof eventBus !== 'undefined' && GameEvents.SAVE_REBUILT) {
            eventBus.emit(GameEvents.SAVE_REBUILT, { gameState });
        }
    }

    update(gameState) {
        if (!this.initialized) return;
        const now = Date.now();
        if (!this.lastAutoSaveRequestedAtMs) {
            this.lastAutoSaveRequestedAtMs = now;
            return;
        }
        if (now - this.lastAutoSaveRequestedAtMs < this.autoSaveIntervalMs) return;
        this.lastAutoSaveRequestedAtMs = now;
        this.scheduleAutoSave(gameState);
    }
}

const saveSystem = new SaveSystem();
