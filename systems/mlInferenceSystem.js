class MlInferenceSystem {
    constructor() {
        this.initialized = false;
        this.simulationClockSeconds = 0;
        this.frameCounter = 0;
        this.runtimeByEntityId = new Map();
        const spatialSemantics = structureSystem?.getSpatialSemanticsRef?.() || {};
        this.categoryDomains = {
            entityType: ['butterfly', 'caterpillar', 'flower', 'entity'],
            rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
            sex: ['F', 'M', 'N'],
            birthSource: ['wild', 'bred', 'rostered'],
            ability: ['none', 'welcome', 'teacher', 'speedzone', 'trustcascade', 'sleepassist'],
            focusType: ['none', 'flower', 'pollen', 'egg', 'block'],
            affordance: ['observe', 'feedFrom', 'carry', 'plant', 'drop', 'stack', 'shelterUse'],
            carryingType: ['none', 'flower', 'pollen', 'egg', 'block'],
            occupancyBand: [...(spatialSemantics.occupancyBands || ['ground', 'stacked', 'overhead'])],
            verticality: [...(spatialSemantics.verticality || ['ground', 'stacked', 'overhead'])],
            structureRole: [...(spatialSemantics.structureRole || ['loose', 'wall', 'roof', 'opening', 'shelter'])],
            pathState: [...(spatialSemantics.pathState || ['open', 'obstructed', 'enterable', 'trapped'])],
            bodyFit: [...(spatialSemantics.bodyFit || ['canPass', 'tooNarrow', 'canShelterInside'])],
            zoneKind: ['open-land', 'training', 'sanctum', 'unknown'],
            battleMode: ['garden', 'battle'],
            activeContext: ['wandering', 'feeding', 'courtship', 'danger', 'training-ground', 'signaling', 'sleep', 'metamorphosis', 'foraging'],
            societyTone: ['mixed', 'clique-comfort', 'clique-exclusion', 'protective-ring', 'reputation-wave'],
            relationshipTexture: ['steady', 'devoted', 'playful', 'admiring', 'repairing', 'guarded', 'strained'],
            followThroughMode: ['none', 'seek', 'avoid', 'imitate', 'protect'],
            localFieldTone: ['quiet', 'warning', 'teaching', 'courtship', 'calming', 'guidance', 'support'],
            spacingState: ['open', 'crowded', 'tight']
        };
        this.featureOrders = Object.freeze({
            groupOrder: Object.freeze([
                'identity',
                'genetics',
                'drives',
                'emotions',
                'derivedFeelings',
                'social',
                'interpretation',
                'memoryRoutine',
                'playerInteraction',
                'objectAwareness',
                'spatial',
                'progression',
                'world',
                'autobattle',
                'behavior'
            ]),
            traitKeys: Object.freeze(['speed', 'jitteriness', 'trustPropensity', 'trustSpeed', 'scareThreshold', 'happinessBonus']),
            driveKeys: Object.freeze(['selfMaintenance', 'safetyAvoidance', 'resourceControl', 'socialConnection', 'caregiving', 'exploration', 'statusExpression', 'rest']),
            emotionKeys: Object.freeze(['threat', 'relief', 'attachment', 'rejection', 'significance', 'failure', 'curiosity', 'agitation', 'exhaustion']),
            memoryRoutineKeys: Object.freeze([
                'placeMemoryDensity',
                'objectMemoryDensity',
                'socialMemoryDensity',
                'careMemoryDensity',
                'movementRoutine',
                'socialRoutine',
                'careRoutine',
                'teachingRoutine',
                'communicationActivity'
            ]),
            progressionKeys: Object.freeze(['originType', 'rarityExposure', 'variantFamiliarity', 'lineageValue', 'encounterValue']),
            spatialFieldTiers: Object.freeze({
                b3Stable: Object.freeze(['verticality', 'structureRole', 'pathState', 'bodyFit']),
                b7Stable: Object.freeze(['occupancyBand', 'obstacleDensity', 'shelterCandidate', 'insideShelter', 'canUseInterior'])
            })
        });
        this.modelConfig = this.createDefaultModelConfig();
        this.modelRuntime = this.createDefaultModelRuntime();
        this.workerOffload = this.createDefaultWorkerOffloadState();
    }

    createDefaultContractConfig() {
        const contract = gameConfig?.ml?.contract || {};
        const sharedSpatialHooks = Array.isArray(contract.sharedSpatialHooks) && contract.sharedSpatialHooks.length
            ? contract.sharedSpatialHooks.filter(Boolean)
            : ['verticality', 'structureRole', 'pathState', 'bodyFit'];
        return {
            version: contract.version || 'c1-runtime-contract-v1',
            currentRuntimeShape: contract.currentRuntimeShape || 'local-static-policy-json',
            currentArtifactFormat: contract.currentArtifactFormat || 'linear-policy-json',
            lockedFutureRuntime: contract.lockedFutureRuntime || 'onnx-runtime-web',
            lockedFutureArtifactFormat: contract.lockedFutureArtifactFormat || 'onnx-bundle',
            trainingPath: contract.trainingPath || 'offline-supervised-imitation',
            corpusSource: contract.corpusSource || 'heuristic-traces-plus-curated-audit-scenarios',
            offlineOnly: contract.offlineOnly !== false,
            allowServerInference: !!contract.allowServerInference,
            allowOnlineTraining: !!contract.allowOnlineTraining,
            fallbackMode: contract.fallbackMode || 'heuristic-fallback-required',
            spatialHookOwner: contract.spatialHookOwner || 'structureSystem',
            hookSchemaVersion: contract.hookSchemaVersion || 'c1-shared-spatial-hooks-v1',
            sharedSpatialHooks
        };
    }

    mergeContractConfig(serializedContract = {}) {
        const defaults = this.createDefaultContractConfig();
        return {
            ...defaults,
            ...(serializedContract || {}),
            sharedSpatialHooks: Array.isArray(serializedContract?.sharedSpatialHooks) && serializedContract.sharedSpatialHooks.length
                ? serializedContract.sharedSpatialHooks.filter(Boolean)
                : defaults.sharedSpatialHooks
        };
    }

    createDefaultModelConfig() {
        const config = gameConfig?.ml || {};
        const contract = this.createDefaultContractConfig();
        return {
            runtime: config.runtime || 'local-static-policy',
            modelVersionId: config.modelVersionId || 'm4-garden-policy-v1',
            featureSchemaVersion: config.featureSchemaVersion || 'm4-feature-schema-v1',
            traceSchemaVersion: config.traceSchemaVersion || 'm4-trace-schema-v1',
            policyArtifactPath: config.policyArtifactPath || 'assets/ml/m4-garden-policy.json',
            policyArtifactFormat: config.policyArtifactFormat || contract.currentArtifactFormat,
            useModelInference: !!config.useModelInference,
            cadenceFactor: Math.max(1, Math.round(config.cadenceFactor || 1)),
            gardenCadenceFrames: Math.max(4, config.gardenCadenceFrames || 20),
            battleCadenceFrames: Math.max(1, config.battleCadenceFrames || 1),
            alternativeCount: Math.max(1, config.alternativeCount || 2),
            decisionHistoryLimit: Math.max(4, config.decisionHistoryLimit || 6),
            contract
        };
    }

    createDefaultModelRuntime() {
        return {
            modelAvailable: false,
            modelLoaded: false,
            loadAttempted: false,
            artifactPath: null,
            artifactFormat: null,
            backend: null,
            loadedPolicies: [],
            modelArtifact: null,
            lastLoadError: null,
            lastInferenceError: null,
            fallbackCount: 0,
            lastDecisionSource: 'heuristic-fallback'
        };
    }

    createDefaultWorkerOffloadState() {
        return {
            host: null,
            syncedModelVersionId: null,
            lastError: null,
            pendingBatch: false,
            pendingBatchSeq: 0,
            pendingBatchFrame: -1
        };
    }

    isOutcomeWindowCaptureEnabled() {
        return gameConfig?.ml?.traceCapture?.outcomeWindow !== false;
    }

    getOutcomeWindowDelayFrames() {
        const configured = gameConfig?.ml?.traceCapture?.outcomeWindowFrames;
        return Math.max(1, Math.round(Number.isFinite(configured) ? configured : 60));
    }

    isWorkerOffloadEnabled() {
        return !!gameConfig?.performance?.flags?.workerOffload;
    }

    ensureWorkerOffloadHost() {
        if (!this.isWorkerOffloadEnabled()) return null;
        if (typeof OffloadHost !== 'function') return null;
        if (!this.workerOffload.host) {
            this.workerOffload.host = new OffloadHost('workers/mlOffloadWorker.js', { timeoutMs: 250 });
        }
        return this.workerOffload.host;
    }

    async syncWorkerModelArtifact(force = false) {
        const host = this.ensureWorkerOffloadHost();
        const artifact = this.modelRuntime.modelArtifact;
        const modelVersionId = artifact?.modelVersionId || this.modelConfig.modelVersionId || null;
        if (!host || !artifact?.policies || !modelVersionId) {
            return false;
        }
        if (!force && this.workerOffload.syncedModelVersionId === modelVersionId) {
            return true;
        }

        try {
            await host.request('ml.loadArtifact', {
                modelVersionId,
                policies: this.cloneValue(artifact.policies, {})
            }, { timeoutMs: 250 });
            this.workerOffload.syncedModelVersionId = modelVersionId;
            this.workerOffload.lastError = null;
            return true;
        } catch (error) {
            this.workerOffload.lastError = String(error?.message || error);
            return false;
        }
    }

    getBudgetTargets() {
        const physicsTargets = typeof physicsSystem !== 'undefined'
            ? physicsSystem?.getBudgetTargets?.() || {}
            : {};
        return {
            focusedGardenInferenceMs: 3.5,
            battleDecisionMs: 0.75,
            focusedGardenPhysicsMs: physicsTargets.focusedGardenPhysicsMs || 2.5,
            focusedGardenTotalUpdateMs: physicsTargets.focusedGardenTotalUpdateMs || 16
        };
    }

    getExpectedPolicyFamilies() {
        return ['actionFamily', 'targetPreference', 'signalChoice', 'riskPosture', 'autobattlePosture'];
    }

    isLegacyModelArtifact(artifact = null) {
        const modelVersionId = artifact?.modelVersionId || null;
        const schemaVersion = artifact?.schemaVersion || null;
        return modelVersionId === 'm2-garden-policy-v1'
            || modelVersionId === 'm3-garden-policy-v1'
            || schemaVersion === 'm2-linear-policy-v1'
            || schemaVersion === 'm3-linear-policy-v1';
    }

    buildModelArtifactSummary(artifact = this.modelRuntime.modelArtifact) {
        const policyFamilies = Object.keys(artifact?.policies || {});
        const expectedPolicyFamilies = this.getExpectedPolicyFamilies();
        const resolvedArtifactFormat = artifact?.artifactFormat
            || this.modelConfig.policyArtifactFormat
            || this.modelConfig.contract?.currentArtifactFormat
            || null;
        return {
            schemaVersion: artifact?.schemaVersion || null,
            modelVersionId: artifact?.modelVersionId || null,
            runtime: artifact?.runtime || null,
            backend: artifact?.backend || null,
            artifactFormat: resolvedArtifactFormat,
            featureSchemaVersion: artifact?.featureSchemaVersion || null,
            traceSchemaVersion: artifact?.traceSchemaVersion || null,
            contractVersion: artifact?.contractVersion || null,
            trainedFrom: artifact?.trainedFrom || null,
            policyCount: policyFamilies.length,
            policyFamilies,
            expectedPolicyFamilies,
            missingPolicyFamilies: expectedPolicyFamilies.filter(policyName => !policyFamilies.includes(policyName)),
            legacyArtifact: this.isLegacyModelArtifact(artifact),
            compatibleWithRuntime: {
                runtime: !artifact?.runtime || artifact.runtime === this.modelConfig.runtime,
                artifactFormat: !resolvedArtifactFormat
                    || resolvedArtifactFormat === (this.modelConfig.policyArtifactFormat || this.modelConfig.contract?.currentArtifactFormat || null),
                featureSchema: !artifact?.featureSchemaVersion
                    || artifact.featureSchemaVersion === this.modelConfig.featureSchemaVersion,
                traceSchema: !artifact?.traceSchemaVersion
                    || artifact.traceSchemaVersion === this.modelConfig.traceSchemaVersion,
                contractVersion: !artifact?.contractVersion
                    || artifact.contractVersion === this.modelConfig.contract?.version
            }
        };
    }

    async initialize() {
        this.modelConfig = this.createDefaultModelConfig();
        this.modelRuntime = this.createDefaultModelRuntime();
        this.workerOffload = this.createDefaultWorkerOffloadState();
        this.initialized = true;
        await this.loadModelArtifact();
    }

    reset() {
        this.simulationClockSeconds = 0;
        this.frameCounter = 0;
        this.runtimeByEntityId.clear();
        this.modelConfig = this.createDefaultModelConfig();
        this.modelRuntime = this.createDefaultModelRuntime();
        this.workerOffload?.host?.terminate?.();
        this.workerOffload = this.createDefaultWorkerOffloadState();
    }

    async loadModelArtifact(forceReload = false) {
        if (!this.modelConfig.useModelInference) {
            this.modelRuntime.loadAttempted = false;
            this.modelRuntime.modelAvailable = false;
            this.modelRuntime.modelLoaded = false;
            this.modelRuntime.backend = null;
            this.modelRuntime.artifactPath = this.modelConfig.policyArtifactPath || null;
            this.modelRuntime.artifactFormat = this.modelConfig.policyArtifactFormat
                || this.modelConfig.contract?.currentArtifactFormat
                || null;
            this.modelRuntime.modelArtifact = null;
            this.modelRuntime.loadedPolicies = [];
            this.modelRuntime.lastLoadError = null;
            this.markAllRuntimeStale();
            return false;
        }

        if (this.modelRuntime.modelLoaded && this.modelRuntime.modelAvailable && !forceReload) {
            return true;
        }

        this.modelRuntime.loadAttempted = true;
        this.modelRuntime.artifactPath = this.modelConfig.policyArtifactPath || null;
        this.modelRuntime.lastLoadError = null;
        this.modelRuntime.lastInferenceError = null;
        this.modelRuntime.modelAvailable = false;
        this.modelRuntime.modelLoaded = false;
        this.modelRuntime.backend = null;
        this.modelRuntime.artifactFormat = this.modelConfig.policyArtifactFormat
            || this.modelConfig.contract?.currentArtifactFormat
            || null;
        this.modelRuntime.modelArtifact = null;
        this.modelRuntime.loadedPolicies = [];

        try {
            if (typeof fetch !== 'function') {
                throw new Error('fetch unavailable for ML policy artifact loading');
            }
            const response = await fetch(this.modelConfig.policyArtifactPath, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`artifact load failed: ${response.status}`);
            }
            const artifact = await response.json();
            this.validateModelArtifact(artifact);

            this.modelRuntime.modelArtifact = artifact;
            this.modelRuntime.modelAvailable = true;
            this.modelRuntime.modelLoaded = true;
            this.modelRuntime.backend = artifact.backend || this.modelConfig.runtime;
            this.modelRuntime.artifactFormat = artifact.artifactFormat
                || this.modelConfig.policyArtifactFormat
                || this.modelConfig.contract?.currentArtifactFormat
                || null;
            this.modelRuntime.loadedPolicies = Object.keys(artifact.policies || {});
            this.modelConfig.modelVersionId = artifact.modelVersionId || this.modelConfig.modelVersionId;
            this.modelConfig.runtime = artifact.runtime || this.modelConfig.runtime;
            this.modelConfig.featureSchemaVersion = artifact.featureSchemaVersion || this.modelConfig.featureSchemaVersion;
            this.modelConfig.traceSchemaVersion = artifact.traceSchemaVersion || this.modelConfig.traceSchemaVersion;
            this.modelConfig.policyArtifactFormat = artifact.artifactFormat
                || this.modelConfig.policyArtifactFormat
                || this.modelConfig.contract?.currentArtifactFormat
                || null;
            if (this.isWorkerOffloadEnabled()) {
                void this.syncWorkerModelArtifact(true);
            }
            this.markAllRuntimeStale();
            return true;
        } catch (error) {
            this.modelRuntime.lastLoadError = String(error?.message || error);
            this.modelRuntime.modelAvailable = false;
            this.modelRuntime.modelLoaded = false;
            this.modelRuntime.backend = null;
            this.modelRuntime.artifactFormat = this.modelConfig.policyArtifactFormat
                || this.modelConfig.contract?.currentArtifactFormat
                || null;
            this.modelRuntime.modelArtifact = null;
            this.modelRuntime.loadedPolicies = [];
            this.workerOffload.syncedModelVersionId = null;
            this.markAllRuntimeStale();
            return false;
        }
    }

    validateModelArtifact(artifact) {
        if (!artifact || typeof artifact !== 'object') {
            throw new Error('invalid ML artifact');
        }
        if (typeof artifact.schemaVersion !== 'string' || !artifact.schemaVersion) {
            throw new Error('missing artifact schemaVersion');
        }
        if (typeof artifact.modelVersionId !== 'string' || !artifact.modelVersionId) {
            throw new Error('missing artifact modelVersionId');
        }
        if (typeof artifact.runtime !== 'string' || !artifact.runtime) {
            throw new Error('missing artifact runtime');
        }
        if (typeof artifact.backend !== 'string' || !artifact.backend) {
            throw new Error('missing artifact backend');
        }
        const legacyArtifact = this.isLegacyModelArtifact(artifact);
        const expectedArtifactFormat = this.modelConfig.policyArtifactFormat
            || this.modelConfig.contract?.currentArtifactFormat
            || null;
        if (!legacyArtifact) {
            if (typeof artifact.artifactFormat !== 'string' || !artifact.artifactFormat) {
                throw new Error('missing artifact artifactFormat');
            }
            if (artifact.artifactFormat !== expectedArtifactFormat) {
                throw new Error(`artifact format mismatch: ${artifact.artifactFormat}`);
            }
            if (artifact.featureSchemaVersion !== this.modelConfig.featureSchemaVersion) {
                throw new Error(`artifact feature schema mismatch: ${artifact.featureSchemaVersion}`);
            }
            if (artifact.traceSchemaVersion !== this.modelConfig.traceSchemaVersion) {
                throw new Error(`artifact trace schema mismatch: ${artifact.traceSchemaVersion}`);
            }
            if (artifact.contractVersion !== this.modelConfig.contract?.version) {
                throw new Error(`artifact contract mismatch: ${artifact.contractVersion}`);
            }
        }
        const policies = artifact.policies || {};
        const requirePolicyShape = (policyName) => {
            const policy = policies[policyName];
            if (!policy || !Array.isArray(policy.labels) || !policy.labels.length) {
                throw new Error(`missing policy labels for ${policyName}`);
            }
            if (!policy.bias || typeof policy.bias !== 'object') {
                throw new Error(`missing policy bias for ${policyName}`);
            }
            if (!policy.weights || typeof policy.weights !== 'object') {
                throw new Error(`missing policy weights for ${policyName}`);
            }
        };

        for (const requiredPolicy of ['actionFamily', 'targetPreference']) {
            requirePolicyShape(requiredPolicy);
        }
        for (const optionalPolicy of ['signalChoice', 'riskPosture', 'autobattlePosture']) {
            if (policies[optionalPolicy]) {
                requirePolicyShape(optionalPolicy);
            }
        }
        return true;
    }

    upgradeLegacyModelConfig(serializedConfig = {}) {
        const defaults = this.createDefaultModelConfig();
        const merged = {
            ...defaults,
            ...(serializedConfig || {})
        };
        merged.contract = this.mergeContractConfig(serializedConfig?.contract);
        merged.policyArtifactFormat = serializedConfig?.policyArtifactFormat || defaults.policyArtifactFormat;
        const knownLegacyVersionIds = new Set(['m2-garden-policy-v1', 'm3-garden-policy-v1']);
        const knownLegacyArtifacts = new Set([
            'assets/ml/m2-garden-policy.json',
            'assets/ml/m3-garden-policy.json'
        ]);
        const looksLikeLegacyDefault = merged.runtime === 'local-static-policy'
            && (knownLegacyVersionIds.has(serializedConfig?.modelVersionId) || knownLegacyArtifacts.has(serializedConfig?.policyArtifactPath));

        if (!looksLikeLegacyDefault) {
            return merged;
        }

        return {
            ...merged,
            modelVersionId: defaults.modelVersionId,
            featureSchemaVersion: defaults.featureSchemaVersion,
            traceSchemaVersion: defaults.traceSchemaVersion,
            policyArtifactPath: defaults.policyArtifactPath,
            policyArtifactFormat: defaults.policyArtifactFormat,
            contract: defaults.contract
        };
    }

    cloneValue(value, fallback = null) {
        if (value == null) return fallback;
        return JSON.parse(JSON.stringify(value));
    }

    roundTraceNumber(value, digits = 3) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return null;
        const scale = 10 ** Math.max(0, digits);
        return Math.round(numeric * scale) / scale;
    }

    clamp01(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        return Math.max(0, Math.min(1, numeric));
    }

    normalizeTraitValue(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        return this.clamp01(numeric / 10);
    }

    normalizeCount(value, divisor = 10) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || divisor <= 0) return 0;
        return this.clamp01(numeric / divisor);
    }

    categoricalIndex(value, domainName, fallbackValue = null) {
        const domain = this.categoryDomains[domainName] || [];
        const normalizedValue = value ?? fallbackValue ?? domain[0] ?? null;
        const index = domain.indexOf(normalizedValue);
        if (index >= 0) return index;
        return domain.indexOf(fallbackValue) >= 0 ? domain.indexOf(fallbackValue) : 0;
    }

    hashEntityKey(value = '') {
        return String(value || '')
            .split('')
            .reduce((sum, char, index) => sum + (char.charCodeAt(0) * (index + 1)), 0);
    }

    getCadenceConfig(gameState, options = {}) {
        const simulationCadence = gameConfig?.simulation?.cadence || {};
        const cadenceFactor = Math.max(1, Math.round(
            Number.isFinite(this.modelConfig?.cadenceFactor)
                ? this.modelConfig.cadenceFactor
                : (gameConfig?.ml?.cadenceFactor || 1)
        ));
        const currentFrame = Number.isFinite(options?.currentFrame)
            ? Math.max(0, Math.round(options.currentFrame))
            : (this.frameCounter + 1);
        const viewMode = gameState?.viewMode === 'battle' ? 'battle' : 'garden';
        return {
            currentFrame,
            viewMode,
            enabled: !!options?.cadenceEnabled && viewMode !== 'battle',
            cadenceFactor,
            gardenIntervalFrames: Math.max(1, Math.round((simulationCadence.mlScoringIntervalFrames || 12) * cadenceFactor)),
            gardenBudgetMs: Number(
                simulationCadence.mlScoringBudgetMs
                || this.getBudgetTargets()?.focusedGardenInferenceMs
                || 0
            ),
            legacyGardenIntervalFrames: Math.max(1, Math.round((this.modelConfig.gardenCadenceFrames || 1) * cadenceFactor)),
            legacyBattleIntervalFrames: Math.max(1, Math.round(this.modelConfig.battleCadenceFrames || 1)),
            battleBypass: !!simulationCadence.mlBattleBypass,
            zoneTravelBypass: !!simulationCadence.mlZoneTravelBypass
        };
    }

    getEntityCadenceOffset(entity, intervalFrames = 1) {
        const normalizedInterval = Math.max(1, Math.round(intervalFrames || 1));
        if (normalizedInterval <= 1) return 0;
        const identity = entity?.lifeSim?.identity || {};
        const seed = [
            entity?.id || 'entity',
            identity.entityType || entity?.constructor?.name || 'entity',
            identity.birthSource || 'wild'
        ].join('|');
        return this.hashEntityKey(seed) % normalizedInterval;
    }

    getRuntimeLastValidFrame(runtime) {
        if (!runtime) return -1;
        if (Number.isFinite(runtime.lastTraceAtGameFrame) && runtime.lastTraceAtGameFrame >= 0) {
            return runtime.lastTraceAtGameFrame;
        }
        return Number.isFinite(runtime.lastTraceAtFrame) ? runtime.lastTraceAtFrame : -1;
    }

    buildTraceFreshness(runtime, currentFrame = (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : this.frameCounter || 0))) {
        const lastValidFrame = this.getRuntimeLastValidFrame(runtime);
        const safeCurrentFrame = Number.isFinite(currentFrame) ? Math.max(0, Math.round(currentFrame)) : 0;
        return {
            lastValidFrame: Math.max(0, lastValidFrame),
            staleFrames: lastValidFrame >= 0 ? Math.max(0, safeCurrentFrame - lastValidFrame) : safeCurrentFrame,
            cadenceIntervalFrames: Math.max(1, Math.round(runtime?.cadenceIntervalFrames || 1)),
            cadenceOffset: Math.max(0, Math.round(runtime?.cadenceOffset || 0))
        };
    }

    buildModelPolicyFreshness(runtime, currentFrame = (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : this.frameCounter || 0))) {
        const safeCurrentFrame = Number.isFinite(currentFrame) ? Math.max(0, Math.round(currentFrame)) : 0;
        const lastValidFrame = Number.isFinite(runtime?.lastModelPoliciesAtGameFrame)
            ? Math.max(-1, Math.round(runtime.lastModelPoliciesAtGameFrame))
            : -1;
        return {
            lastValidFrame: Math.max(0, lastValidFrame),
            staleFrames: lastValidFrame >= 0 ? Math.max(0, safeCurrentFrame - lastValidFrame) : safeCurrentFrame,
            pending: !!runtime?.pendingWorkerInference,
            lastResolvedSeq: Math.max(0, Math.round(runtime?.resolvedWorkerInferenceSeq || 0))
        };
    }

    getRequestedModelPoliciesForMode(gardenMode = true) {
        return this.modelConfig.useModelInference
            ? (gardenMode
                ? ['actionFamily', 'targetPreference', 'signalChoice', 'riskPosture']
                : ['autobattlePosture'])
            : [];
    }

    buildHeuristicAutobattlePolicy(features) {
        const autobattle = features?.groups?.autobattle || {};
        const behavior = features?.groups?.behavior || {};
        return {
            engage: this.clamp01(0.12 + behavior.battleAggression * 0.42 + autobattle.targetPriority * 0.18 + autobattle.offense * 0.08),
            support: this.clamp01(0.08 + autobattle.supportOpportunity * 0.4 + autobattle.support * 0.14 + autobattle.allyPressure * 0.08),
            focusWeakTarget: this.clamp01(0.08 + autobattle.targetPriority * 0.46 + autobattle.offense * 0.08),
            stabilize: this.clamp01(0.08 + autobattle.guard * 0.14 + autobattle.resolve * 0.14 + autobattle.retreatPressure * 0.1),
            retreat: this.clamp01(0.04 + autobattle.retreatPressure * 0.46 + autobattle.enemyThreat * 0.2)
        };
    }

    buildPreparedPolicyTrace(policyName, trace = null, fallbackScores = null, fallbackSource = 'heuristic-fallback') {
        if (trace && typeof trace === 'object') {
            return {
                ...this.cloneValue(trace, {}),
                policy: policyName,
                source: trace.source || fallbackSource
            };
        }
        return this.buildPolicyTrace(policyName, fallbackScores || {}, fallbackSource);
    }

    shouldDeferWorkerRefresh(entry, workerBatchQueued = 0) {
        const runtime = entry?.runtime;
        const refreshState = entry?.refreshState;
        const features = entry?.features;
        if (!this.isWorkerOffloadEnabled()) return false;
        if (!runtime?.trace || !runtime?.features) return false;
        if (!refreshState?.refresh || !refreshState?.contextSignature) return false;
        if (workerBatchQueued <= 0) return false;
        if (features?.groups?.world?.battleMode === 'battle') return false;
        if (refreshState.reason === 'missing-trace' || refreshState.reason === 'zone-travel') return false;
        return runtime.lastContextSignature === refreshState.contextSignature;
    }

    queueDeferredWorkerRefresh(runtime, entry, requestFrame) {
        if (!runtime || !entry?.entity?.id || !entry?.features || !entry?.refreshState?.contextSignature) return;
        runtime.pendingWorkerRefresh = {
            entityId: entry.entity.id,
            contextSignature: entry.refreshState.contextSignature,
            features: entry.features,
            currentFrame: requestFrame,
            cadenceIntervalFrames: Math.max(1, Math.round(entry.refreshState.cadenceIntervalFrames || runtime.cadenceIntervalFrames || 1)),
            cadenceOffset: Math.max(0, Math.round(entry.refreshState.cadenceOffset || runtime.cadenceOffset || 0))
        };
    }

    clearDeferredWorkerRefresh(runtime) {
        if (!runtime) return;
        runtime.pendingWorkerRefresh = null;
    }

    flushDeferredWorkerRefresh(entity, runtime, requestFrame = null) {
        const pending = runtime?.pendingWorkerRefresh || null;
        if (!entity?.id || !runtime || !pending?.features || pending.entityId !== entity.id) return false;
        this.refreshEntityTrace(
            entity,
            gameCore?.gameState,
            runtime,
            pending.contextSignature,
            null,
            {
                currentFrame: Number.isFinite(requestFrame) ? requestFrame : pending.currentFrame,
                cadenceIntervalFrames: pending.cadenceIntervalFrames,
                cadenceOffset: pending.cadenceOffset,
                prebuiltFeatures: pending.features
            }
        );
        this.clearDeferredWorkerRefresh(runtime);
        return true;
    }

    ensureRuntime(entity) {
        if (!entity?.id) return null;
        if (!this.runtimeByEntityId.has(entity.id)) {
            this.runtimeByEntityId.set(entity.id, {
                entityId: entity.id,
                entityType: entity.lifeSim?.identity?.entityType || 'entity',
                lastTraceAtFrame: -1,
                lastTraceAtGameFrame: -1,
                lastContextSignature: null,
                features: null,
                trace: null,
                decisionHistory: [],
                lastHistoryKey: null,
                nextOutcomeDueFrame: null,
                cadenceIntervalFrames: 1,
                cadenceOffset: 0,
                lastModelPolicies: null,
                lastModelPolicyTraces: null,
                lastModelPoliciesAtGameFrame: -1,
                pendingWorkerInference: false,
                pendingWorkerInferenceSeq: 0,
                resolvedWorkerInferenceSeq: 0,
                pendingWorkerRefresh: null
            });
        }
        return this.runtimeByEntityId.get(entity.id);
    }

    registerEntity(entity) {
        return this.ensureRuntime(entity);
    }

    unregisterEntity(entityId) {
        this.runtimeByEntityId.delete(entityId);
    }

    markAllRuntimeStale() {
        for (const runtime of this.runtimeByEntityId.values()) {
            runtime.lastTraceAtFrame = -1;
            runtime.lastTraceAtGameFrame = -1;
            runtime.lastContextSignature = null;
            runtime.features = null;
            runtime.trace = null;
            runtime.cadenceIntervalFrames = 1;
            runtime.cadenceOffset = 0;
            runtime.lastModelPolicies = null;
            runtime.lastModelPolicyTraces = null;
            runtime.lastModelPoliciesAtGameFrame = -1;
            runtime.pendingWorkerInference = false;
            runtime.pendingWorkerInferenceSeq = 0;
            runtime.resolvedWorkerInferenceSeq = 0;
            runtime.pendingWorkerRefresh = null;
        }
    }

    getLiveEntities(gameState = gameCore?.gameState) {
        return [
            ...(gameState?.butterflies || []),
            ...(gameState?.caterpillars || [])
        ].filter(entity => entity?.id && entity?.lifeSim);
    }

    resolveZoneKind(zoneId) {
        const zone = zoneSystem?.getZoneById?.(zoneId) || zoneSystem?.getZone?.(zoneId) || null;
        if (!zone) return 'unknown';
        if (zone.kind === 'training' || zone.renderProfile?.trainingStations?.length) return 'training';
        if (zone.kind) return zone.kind;
        return 'open-land';
    }

    computeContextSignature(entity, gameState, behaviorRuntime) {
        const lifeSim = entity?.lifeSim || {};
        const sleepSubtype = sleepSystem?.getSleepState?.(entity.id)?.subtype || 'awake';
        const pressureBucket = Math.round((entity?.battleState?.pressure || 0));
        const hpSeed = Math.round(entity?.battleState?.hp ?? entity?.hp ?? 0);
        const cursorFearBucket = Math.round((lifeSim.playerInteraction?.cursorFear || 0) * 10);
        const threatBucket = Math.round((lifeSim.emotions?.threat || 0) * 10);
        const feedUrgencyBucket = Math.round((lifeSim.derived?.behaviorBiases?.feedUrgency || 0) * 10);
        const objectInterestBucket = Math.round((lifeSim.derived?.behaviorBiases?.objectInterest || 0) * 10);
        const shelterSeekingBucket = Math.round((lifeSim.derived?.behaviorBiases?.shelterSeeking || 0) * 10);
        const parts = [
            entity?.state || 'idle',
            entity?.currentZoneId || lifeSim.lifecycle?.currentZoneId || 'none',
            behaviorRuntime?.currentActionFamily || 'idle',
            behaviorRuntime?.currentActionSubtype || 'idle',
            behaviorRuntime?.currentTargetId || 'none',
            lifeSim.objectAwareness?.focusType || 'none',
            lifeSim.objectAwareness?.currentAffordance || 'observe',
            lifeSim.spatialAwareness?.pathState || 'open',
            lifeSim.playerInteraction?.calmedByCursor ? 'calmed' : 'uncalmed',
            sleepSubtype,
            entity?.blockInteraction?.carryingBlockId ? 'carry' : 'free',
            entity?.pendingPollenDropTarget ? 'pollen' : 'none',
            entity?.pregnancy?.active ? 'pregnant' : 'not-pregnant',
            entity?.zoneTravel?.phase || 'stationary',
            gameState?.viewMode === 'battle' ? 'battle' : 'garden',
            pressureBucket,
            hpSeed,
            cursorFearBucket,
            threatBucket,
            feedUrgencyBucket,
            objectInterestBucket,
            shelterSeekingBucket
        ];
        return parts.join('|');
    }

    shouldRefreshTrace(entity, runtime, gameState, behaviorRuntime, cadence = null) {
        if (!runtime) {
            return {
                refresh: false,
                forced: false,
                contextSignature: null,
                reason: 'missing-runtime',
                cadenceOffset: 0,
                cadenceIntervalFrames: 1
            };
        }

        const cadenceConfig = cadence || this.getCadenceConfig(gameState, {});
        if (cadenceConfig.enabled) {
            const cadenceIntervalFrames = Math.max(1, Math.round(cadenceConfig.gardenIntervalFrames || 1));
            const cadenceOffset = this.getEntityCadenceOffset(entity, cadenceIntervalFrames);
            runtime.cadenceIntervalFrames = cadenceIntervalFrames;
            runtime.cadenceOffset = cadenceOffset;

            const lastValidFrame = this.getRuntimeLastValidFrame(runtime);
            const ageFrames = lastValidFrame >= 0
                ? Math.max(0, cadenceConfig.currentFrame - lastValidFrame)
                : cadenceIntervalFrames;
            const zoneTravelPhase = entity?.zoneTravel?.phase || null;
            const zoneTravelActive = !!(zoneTravelPhase && zoneTravelPhase !== 'stationary');
            const forceRefresh = !runtime.trace
                || !runtime.features
                || (cadenceConfig.zoneTravelBypass && zoneTravelActive)
                || ageFrames >= cadenceIntervalFrames;
            const cadenceHit = ((cadenceConfig.currentFrame % cadenceIntervalFrames) === cadenceOffset);

            if (!forceRefresh && !cadenceHit) {
                return {
                    refresh: false,
                    forced: false,
                    contextSignature: null,
                    reason: 'phase-skip',
                    cadenceOffset,
                    cadenceIntervalFrames
                };
            }

            return {
                refresh: true,
                forced: forceRefresh,
                contextSignature: this.computeContextSignature(entity, gameState, behaviorRuntime),
                reason: forceRefresh
                    ? (!runtime.trace || !runtime.features
                        ? 'missing-trace'
                        : (cadenceConfig.zoneTravelBypass && zoneTravelActive ? 'zone-travel' : 'stale-refresh'))
                    : 'phase-hit',
                cadenceOffset,
                cadenceIntervalFrames
            };
        }

        const cadenceIntervalFrames = cadenceConfig.viewMode === 'battle'
            ? cadenceConfig.legacyBattleIntervalFrames
            : cadenceConfig.legacyGardenIntervalFrames;
        const cadenceOffset = this.getEntityCadenceOffset(entity, cadenceIntervalFrames);
        runtime.cadenceIntervalFrames = cadenceIntervalFrames;
        runtime.cadenceOffset = cadenceOffset;
        const contextSignature = this.computeContextSignature(entity, gameState, behaviorRuntime);
        const cadenceHit = this.getRuntimeLastValidFrame(runtime) < 0
            || ((cadenceConfig.currentFrame + cadenceOffset) % cadenceIntervalFrames === 0);
        const contextChanged = runtime.lastContextSignature !== contextSignature;
        return {
            refresh: cadenceHit || contextChanged,
            forced: false,
            contextSignature,
            reason: contextChanged ? 'context-change' : 'legacy-cadence',
            cadenceOffset,
            cadenceIntervalFrames
        };
    }

    getTopPolicyEntries(scores = {}, count = 3) {
        return Object.entries(scores)
            .map(([label, value]) => ({ label, value: this.clamp01(value) }))
            .sort((left, right) => right.value - left.value)
            .slice(0, count);
    }

    buildConfidence(topEntries = []) {
        const best = topEntries[0]?.value || 0;
        const second = topEntries[1]?.value || 0;
        const margin = this.clamp01(best - second);
        const normalized = this.clamp01(best * 0.68 + margin * 0.32);
        return {
            score: Math.round(normalized * 100),
            band: normalized >= 0.72 ? 'high' : normalized >= 0.46 ? 'medium' : 'low',
            uncertainty: normalized < 0.38
        };
    }

    buildFeatureGroups(entity, gameState, behaviorRuntime = null) {
        const lifeSim = entity?.lifeSim || {};
        const entitySummary = lifeSimSystem?.getEntitySummary?.(entity.id) || null;
        const statProfile = entity?.lifeSim ? statProfileSystem?.getEntityProfile?.(entity, gameState) : null;
        const readiness = statProfile?.readinessProfile || null;
        const battleProfile = statProfile?.battleProfile || null;
        const zoneId = entity?.currentZoneId || lifeSim.lifecycle?.currentZoneId || null;
        const battleMode = gameState?.viewMode === 'battle' ? 'battle' : 'garden';
        const specialAbility = statProfileSystem?.getAbilityForSubject?.(entity) || entity?.specialAbility || 'none';
        const rarity = entity?.personality?.rarity || entity?.lifeSim?.identity?.rarity || 'common';
        const socialEcology = lifeSim.derived?.socialEcology || entitySummary?.socialEcology || {};
        const followThrough = socialEcology?.followThrough || {};
        const localSignalField = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getLocalSignalField?.(entity, gameState)
            : null;
        const societyTone = this.resolveCategoryValue(socialEcology?.societyTone, 'societyTone', 'mixed');
        const relationshipTexture = this.resolveCategoryValue(socialEcology?.relationshipTextureLabel, 'relationshipTexture', 'steady');
        const followThroughMode = this.resolveCategoryValue(followThrough?.dominantMode, 'followThroughMode', 'none');
        const localFieldTone = this.resolveCategoryValue(localSignalField?.dominantFamily, 'localFieldTone', 'quiet');
        const followThroughStrength = this.clamp01(Math.max(
            followThrough?.seekScore || 0,
            followThrough?.avoidScore || 0,
            followThrough?.imitateScore || 0,
            followThrough?.protectScore || 0
        ));
        const localFieldPressure = this.clamp01(localSignalField?.totalPressure || 0);

        const groups = {
            identity: {
                archetype: entity?.lifeSim?.identity?.archetype || entity?.personalityType || 'entity',
                entityType: entity?.lifeSim?.identity?.entityType || 'entity',
                rarity,
                sex: entity?.sex || 'N',
                birthSource: entity?.birthSource || entity?.lifeSim?.identity?.source || 'wild',
                specialAbility
            },
            genetics: {
                baselineTraits: statProfile?.baselineTraits || {},
                effectiveTraits: statProfile?.effectiveTraits || {},
                inheritedAbilityOrigin: statProfileSystem?.getAbilityOriginLabel?.(entity, gameState) || 'natural',
                mutationPresence: !!statProfile?.mutationProfile?.mutatedTraits?.length,
                upbringingStrength: this.normalizeCount(lifeSim?.upbringing?.lessons?.length || 0, 12)
            },
            drives: { ...(lifeSim.drives || {}) },
            emotions: { ...(lifeSim.emotions || {}) },
            derivedFeelings: {
                loneliness: lifeSim.derived?.derivedFeelings?.loneliness || 0,
                comfortSeeking: lifeSim.derived?.derivedFeelings?.comfortSeeking || 0,
                socialInsecurity: lifeSim.derived?.derivedFeelings?.socialInsecurity || 0,
                jealousy: lifeSim.derived?.derivedFeelings?.jealousy || 0,
                grief: lifeSim.derived?.derivedFeelings?.grief || 0,
                pride: lifeSim.derived?.derivedFeelings?.pride || 0,
                shame: lifeSim.derived?.derivedFeelings?.shame || 0,
                loyaltyBias: lifeSim.derived?.derivedFeelings?.loyaltyBias || 0
            },
            social: {
                reputation: lifeSim.social?.reputation || 0,
                belonging: lifeSim.social?.belonging || 0,
                confidence: lifeSim.social?.confidence || 0,
                activeContext: lifeSim.social?.activeContext || 'wandering',
                edgeTrustAverage: this.normalizeCount(entitySummary?.social?.reputation || 0, 100),
                edgeAttachmentAverage: this.normalizeCount(entitySummary?.social?.belonging || 0, 100),
                societyTone,
                relationshipTexture,
                followThroughMode,
                followThroughStrength,
                localFieldTone,
                localFieldPressure
            },
            interpretation: {
                clarity: lifeSim.interpretation?.clarity ?? 1,
                warpedSignals: this.normalizeCount(lifeSim.interpretation?.warpedSignals || 0, 8),
                anxietyBias: lifeSim.distortion?.anxietyBias || 0,
                withdrawalBias: lifeSim.distortion?.withdrawalBias || 0,
                fixationBias: lifeSim.distortion?.fixationBias || 0,
                insomniaBias: lifeSim.distortion?.insomniaBias || 0,
                oversleepBias: lifeSim.distortion?.oversleepBias || 0,
                warpedTeachingBias: lifeSim.distortion?.warpedTeachingBias || 0
            },
            memoryRoutine: {
                placeMemoryDensity: this.normalizeCount(lifeSim.memories?.place?.length || 0, 12),
                objectMemoryDensity: this.normalizeCount(lifeSim.memories?.object?.length || 0, 12),
                socialMemoryDensity: this.normalizeCount(lifeSim.memories?.social?.length || 0, 12),
                careMemoryDensity: this.normalizeCount(lifeSim.memories?.care?.length || 0, 12),
                movementRoutine: this.normalizeCount(lifeSim.routines?.movement?.length || 0, 10),
                socialRoutine: this.normalizeCount(lifeSim.routines?.social?.length || 0, 10),
                careRoutine: this.normalizeCount(lifeSim.routines?.care?.length || 0, 10),
                teachingRoutine: this.normalizeCount(lifeSim.routines?.teaching?.length || 0, 10),
                communicationActivity: this.normalizeCount(
                    (lifeSim.communication?.recentEmitted?.length || 0) +
                    (lifeSim.communication?.recentReceived?.length || 0) +
                    (lifeSim.communication?.recentConversations?.length || 0),
                    18
                )
            },
            playerInteraction: {
                cursorTrust: lifeSim.playerInteraction?.cursorTrust || 0,
                cursorFear: lifeSim.playerInteraction?.cursorFear || 0,
                petHistory: this.normalizeCount(lifeSim.playerInteraction?.petHistory || 0, 12),
                clapStartleHistory: this.normalizeCount(lifeSim.playerInteraction?.clapStartleHistory || 0, 12),
                calmedByCursor: !!lifeSim.playerInteraction?.calmedByCursor
            },
            objectAwareness: {
                focusType: lifeSim.objectAwareness?.focusType || 'none',
                currentAffordance: lifeSim.objectAwareness?.currentAffordance || 'observe',
                carryingType: lifeSim.objectAwareness?.carryingType || 'none',
                flowerFamiliarity: lifeSim.objectAwareness?.flowerFamiliarity || 0,
                pollenFamiliarity: lifeSim.objectAwareness?.pollenFamiliarity || 0,
                eggFamiliarity: lifeSim.objectAwareness?.eggFamiliarity || 0,
                blockFamiliarity: lifeSim.objectAwareness?.blockFamiliarity || 0,
                shelterConfidence: lifeSim.objectAwareness?.shelterConfidence || 0
            },
            spatial: {
                verticality: lifeSim.spatialAwareness?.verticality || 'ground',
                structureRole: lifeSim.spatialAwareness?.structureRole || 'loose',
                pathState: lifeSim.spatialAwareness?.pathState || 'open',
                bodyFit: lifeSim.spatialAwareness?.bodyFit || 'canPass',
                occupancyBand: lifeSim.spatialAwareness?.occupancyBand || lifeSim.spatialAwareness?.verticality || 'ground',
                obstacleDensity: lifeSim.spatialAwareness?.obstacleDensity || 0,
                shelterCandidate: !!lifeSim.spatialAwareness?.shelterCandidate,
                canUseInterior: !!lifeSim.spatialAwareness?.canUseInterior,
                insideShelter: !!lifeSim.spatialAwareness?.insideShelter
            },
            progression: {
                originType: lifeSim.progression?.originType || 'wild',
                rarityExposure: lifeSim.progression?.rarityExposure || 0,
                variantFamiliarity: lifeSim.progression?.variantFamiliarity || 0,
                lineageValue: lifeSim.progression?.lineageValue || 0,
                encounterValue: lifeSim.progression?.encounterValue || 0
            },
            world: {
                zoneId,
                zoneKind: this.resolveZoneKind(zoneId),
                crowding: lifeSim.derived?.crowding || 0,
                novelty: lifeSim.derived?.novelty || 0,
                flowerAvailability: this.normalizeCount((gameCore?.getFlowersInZone?.(zoneId) || []).length, 8),
                nearbyAllies: this.normalizeCount(
                    (gameCore?.getButterfliesInZone?.(zoneId) || []).filter(candidate => candidate?.id !== entity.id && (candidate.birthSource || 'wild') === (entity.birthSource || 'wild')).length,
                    6
                ),
                nearbyRivals: this.normalizeCount(
                    (gameCore?.getButterfliesInZone?.(zoneId) || []).filter(candidate => candidate?.id !== entity.id && candidate.personalityType !== entity.personalityType).length,
                    6
                ),
                nearbyVulnerableTargets: this.normalizeCount(
                    (gameCore?.getButterfliesInZone?.(zoneId) || []).filter(candidate => candidate?.id !== entity.id && ((candidate.battleState?.pressure || 0) >= 3)).length,
                    6
                ),
                battleMode
            },
            autobattle: {
                allyPressure: lifeSim.battleContext?.allyPressure || 0,
                enemyThreat: lifeSim.battleContext?.enemyThreat || 0,
                targetPriority: lifeSim.battleContext?.targetPriority || 0,
                spacingState: lifeSim.battleContext?.spacingState || 'open',
                retreatPressure: lifeSim.battleContext?.retreatPressure || 0,
                supportOpportunity: lifeSim.battleContext?.supportOpportunity || 0,
                readinessScore: this.normalizeCount(readiness?.score || 0, 100),
                readinessTier: readiness?.tier || 'Rest',
                offense: this.normalizeCount(battleProfile?.offense || 0, 120),
                guard: this.normalizeCount(battleProfile?.guard || 0, 120),
                resolve: this.normalizeCount(battleProfile?.resolve || 0, 120),
                support: this.normalizeCount(battleProfile?.support || 0, 120)
            },
            behavior: {
                currentActionFamily: behaviorRuntime?.currentActionFamily || 'idle',
                currentActionSubtype: behaviorRuntime?.currentActionSubtype || 'idle',
                currentTargetId: behaviorRuntime?.currentTargetId || null,
                wanderScale: lifeSim.derived?.behaviorBiases?.wanderScale || 0,
                feedUrgency: lifeSim.derived?.behaviorBiases?.feedUrgency || 0,
                displayConfidence: lifeSim.derived?.behaviorBiases?.displayConfidence || 0,
                socialConfidence: lifeSim.derived?.behaviorBiases?.socialConfidence || 0,
                caution: lifeSim.derived?.behaviorBiases?.caution || 0,
                trainingAffinity: lifeSim.derived?.behaviorBiases?.trainingAffinity || 0,
                objectInterest: lifeSim.derived?.behaviorBiases?.objectInterest || 0,
                cursorAffinity: lifeSim.derived?.behaviorBiases?.cursorAffinity || 0,
                shelterSeeking: lifeSim.derived?.behaviorBiases?.shelterSeeking || 0,
                battleAggression: lifeSim.derived?.behaviorBiases?.battleAggression || 0,
                followThroughDrive: lifeSim.derived?.behaviorBiases?.followThroughDrive || 0,
                socialAvoidance: lifeSim.derived?.behaviorBiases?.socialAvoidance || 0
            }
        };

        const numericVector = this.buildNumericVector(groups);
        const flatFeatures = this.buildFlatFeatureMap(groups);

        return {
            schemaVersion: this.modelConfig.featureSchemaVersion,
            entityId: entity.id,
            generatedAtSeconds: this.simulationClockSeconds,
            groups,
            flatFeatures,
            flatFeatureCount: Object.keys(flatFeatures).length,
            numericVector,
            vectorLength: numericVector.length
        };
    }

    buildFlatFeatureMap(groups = {}) {
        const flat = {};
        const baselineTraits = groups.genetics?.baselineTraits || {};
        const effectiveTraits = groups.genetics?.effectiveTraits || {};
        const push = (key, value) => {
            flat[key] = this.clamp01(value);
        };
        const pushTraitFamily = (prefix, traits = {}) => {
            push(`${prefix}.speed`, this.normalizeTraitValue(traits.speed));
            push(`${prefix}.jitteriness`, this.normalizeTraitValue(traits.jitteriness));
            push(`${prefix}.trustPropensity`, this.normalizeTraitValue(traits.trustPropensity));
            push(`${prefix}.trustSpeed`, this.normalizeTraitValue(traits.trustSpeed));
            push(`${prefix}.scareThreshold`, this.normalizeTraitValue(traits.scareThreshold));
            push(`${prefix}.happinessBonus`, this.normalizeTraitValue(traits.happinessBonus));
        };

        pushTraitFamily('genetics.baseline', baselineTraits);
        pushTraitFamily('genetics.effective', effectiveTraits);

        for (const key of this.featureOrders.driveKeys) push(`drives.${key}`, groups.drives?.[key] || 0);
        for (const key of this.featureOrders.emotionKeys) push(`emotions.${key}`, groups.emotions?.[key] || 0);
        for (const key of ['loneliness', 'comfortSeeking', 'socialInsecurity', 'jealousy', 'grief', 'pride', 'shame', 'loyaltyBias']) {
            push(`derivedFeelings.${key}`, groups.derivedFeelings?.[key] || 0);
        }

        push('social.reputation', groups.social?.reputation || 0);
        push('social.belonging', groups.social?.belonging || 0);
        push('social.confidence', groups.social?.confidence || 0);
        push('social.edgeTrustAverage', groups.social?.edgeTrustAverage || 0);
        push('social.edgeAttachmentAverage', groups.social?.edgeAttachmentAverage || 0);
        push('social.followThroughStrength', groups.social?.followThroughStrength || 0);
        push('social.localFieldPressure', groups.social?.localFieldPressure || 0);

        push('interpretation.clarity', groups.interpretation?.clarity || 0);
        push('memory.communicationActivity', groups.memoryRoutine?.communicationActivity || 0);

        push('player.cursorTrust', groups.playerInteraction?.cursorTrust || 0);
        push('player.cursorFear', groups.playerInteraction?.cursorFear || 0);
        push('player.petHistory', groups.playerInteraction?.petHistory || 0);
        push('player.clapStartleHistory', groups.playerInteraction?.clapStartleHistory || 0);
        push('player.calmedByCursor', groups.playerInteraction?.calmedByCursor ? 1 : 0);

        push('object.flowerFamiliarity', groups.objectAwareness?.flowerFamiliarity || 0);
        push('object.pollenFamiliarity', groups.objectAwareness?.pollenFamiliarity || 0);
        push('object.eggFamiliarity', groups.objectAwareness?.eggFamiliarity || 0);
        push('object.blockFamiliarity', groups.objectAwareness?.blockFamiliarity || 0);
        push('object.shelterConfidence', groups.objectAwareness?.shelterConfidence || 0);
        push('object.focusIsFlower', groups.objectAwareness?.focusType === 'flower' ? 1 : 0);
        push('object.focusIsPollen', groups.objectAwareness?.focusType === 'pollen' ? 1 : 0);
        push('object.focusIsEgg', groups.objectAwareness?.focusType === 'egg' ? 1 : 0);
        push('object.focusIsBlock', groups.objectAwareness?.focusType === 'block' ? 1 : 0);
        push('object.affordanceIsObserve', groups.objectAwareness?.currentAffordance === 'observe' ? 1 : 0);
        push('object.affordanceIsFeedFrom', groups.objectAwareness?.currentAffordance === 'feedFrom' ? 1 : 0);
        push('object.affordanceIsCarry', groups.objectAwareness?.currentAffordance === 'carry' ? 1 : 0);
        push('object.affordanceIsPlant', groups.objectAwareness?.currentAffordance === 'plant' ? 1 : 0);
        push('object.affordanceIsShelterUse', groups.objectAwareness?.currentAffordance === 'shelterUse' ? 1 : 0);

        push('spatial.obstacleDensity', groups.spatial?.obstacleDensity || 0);
        push('spatial.shelterCandidate', groups.spatial?.shelterCandidate ? 1 : 0);
        push('spatial.insideShelter', groups.spatial?.insideShelter ? 1 : 0);
        push('spatial.canUseInterior', groups.spatial?.canUseInterior ? 1 : 0);
        push('spatial.pathIsOpen', groups.spatial?.pathState === 'open' ? 1 : 0);
        push('spatial.pathIsObstructed', groups.spatial?.pathState === 'obstructed' ? 1 : 0);
        push('spatial.structureIsShelter', groups.spatial?.structureRole === 'shelter' ? 1 : 0);
        push('spatial.verticalIsGround', groups.spatial?.verticality === 'ground' ? 1 : 0);
        push('spatial.occupancyIsGround', groups.spatial?.occupancyBand === 'ground' ? 1 : 0);
        push('spatial.occupancyIsStacked', groups.spatial?.occupancyBand === 'stacked' ? 1 : 0);
        push('spatial.occupancyIsOverhead', groups.spatial?.occupancyBand === 'overhead' ? 1 : 0);

        push('progression.rarityExposure', groups.progression?.rarityExposure || 0);
        push('progression.variantFamiliarity', groups.progression?.variantFamiliarity || 0);
        push('progression.lineageValue', groups.progression?.lineageValue || 0);
        push('progression.encounterValue', groups.progression?.encounterValue || 0);

        push('world.crowding', groups.world?.crowding || 0);
        push('world.novelty', groups.world?.novelty || 0);
        push('world.flowerAvailability', groups.world?.flowerAvailability || 0);
        push('world.nearbyAllies', groups.world?.nearbyAllies || 0);
        push('world.nearbyRivals', groups.world?.nearbyRivals || 0);
        push('world.nearbyVulnerableTargets', groups.world?.nearbyVulnerableTargets || 0);
        push('world.zoneIsTraining', groups.world?.zoneKind === 'training' ? 1 : 0);
        push('world.modeIsGarden', groups.world?.battleMode === 'garden' ? 1 : 0);
        push('world.modeIsBattle', groups.world?.battleMode === 'battle' ? 1 : 0);

        push('autobattle.allyPressure', groups.autobattle?.allyPressure || 0);
        push('autobattle.enemyThreat', groups.autobattle?.enemyThreat || 0);
        push('autobattle.targetPriority', groups.autobattle?.targetPriority || 0);
        push('autobattle.retreatPressure', groups.autobattle?.retreatPressure || 0);
        push('autobattle.supportOpportunity', groups.autobattle?.supportOpportunity || 0);

        push('behavior.wanderScale', groups.behavior?.wanderScale || 0);
        push('behavior.feedUrgency', groups.behavior?.feedUrgency || 0);
        push('behavior.displayConfidence', groups.behavior?.displayConfidence || 0);
        push('behavior.socialConfidence', groups.behavior?.socialConfidence || 0);
        push('behavior.caution', groups.behavior?.caution || 0);
        push('behavior.trainingAffinity', groups.behavior?.trainingAffinity || 0);
        push('behavior.objectInterest', groups.behavior?.objectInterest || 0);
        push('behavior.cursorAffinity', groups.behavior?.cursorAffinity || 0);
        push('behavior.shelterSeeking', groups.behavior?.shelterSeeking || 0);
        push('behavior.battleAggression', groups.behavior?.battleAggression || 0);
        push('behavior.followThroughDrive', groups.behavior?.followThroughDrive || 0);
        push('behavior.socialAvoidance', groups.behavior?.socialAvoidance || 0);
        return flat;
    }

    createDefaultFeatureGroups() {
        const traitDefaults = {
            speed: 0,
            jitteriness: 0,
            trustPropensity: 0,
            trustSpeed: 0,
            scareThreshold: 0,
            happinessBonus: 0
        };
        return {
            identity: {
                archetype: 'entity',
                entityType: 'entity',
                rarity: 'common',
                sex: 'N',
                birthSource: 'wild',
                specialAbility: 'none'
            },
            genetics: {
                baselineTraits: { ...traitDefaults },
                effectiveTraits: { ...traitDefaults },
                inheritedAbilityOrigin: 'natural',
                mutationPresence: false,
                upbringingStrength: 0
            },
            drives: {
                selfMaintenance: 0,
                safetyAvoidance: 0,
                resourceControl: 0,
                socialConnection: 0,
                caregiving: 0,
                exploration: 0,
                statusExpression: 0,
                rest: 0
            },
            emotions: {
                threat: 0,
                relief: 0,
                attachment: 0,
                rejection: 0,
                significance: 0,
                failure: 0,
                curiosity: 0,
                agitation: 0,
                exhaustion: 0
            },
            derivedFeelings: {
                loneliness: 0,
                comfortSeeking: 0,
                socialInsecurity: 0,
                jealousy: 0,
                grief: 0,
                pride: 0,
                shame: 0,
                loyaltyBias: 0
            },
            social: {
                reputation: 0,
                belonging: 0,
                confidence: 0,
                activeContext: 'training-ground',
                edgeTrustAverage: 0,
                edgeAttachmentAverage: 0,
                societyTone: 'mixed',
                relationshipTexture: 'steady',
                followThroughMode: 'none',
                followThroughStrength: 0,
                localFieldTone: 'quiet',
                localFieldPressure: 0
            },
            interpretation: {
                clarity: 1,
                warpedSignals: 0,
                anxietyBias: 0,
                withdrawalBias: 0,
                fixationBias: 0,
                insomniaBias: 0,
                oversleepBias: 0,
                warpedTeachingBias: 0
            },
            memoryRoutine: {
                placeMemoryDensity: 0,
                objectMemoryDensity: 0,
                socialMemoryDensity: 0,
                careMemoryDensity: 0,
                movementRoutine: 0,
                socialRoutine: 0,
                careRoutine: 0,
                teachingRoutine: 0,
                communicationActivity: 0
            },
            playerInteraction: {
                cursorTrust: 0,
                cursorFear: 0,
                petHistory: 0,
                clapStartleHistory: 0,
                calmedByCursor: false
            },
            objectAwareness: {
                focusType: 'none',
                currentAffordance: 'observe',
                carryingType: 'none',
                flowerFamiliarity: 0,
                pollenFamiliarity: 0,
                eggFamiliarity: 0,
                blockFamiliarity: 0,
                shelterConfidence: 0
            },
            spatial: {
                verticality: 'ground',
                structureRole: 'loose',
                pathState: 'open',
                bodyFit: 'canPass',
                occupancyBand: 'ground',
                obstacleDensity: 0,
                shelterCandidate: false,
                canUseInterior: false,
                insideShelter: false
            },
            progression: {
                originType: 'wild',
                rarityExposure: 0,
                variantFamiliarity: 0,
                lineageValue: 0,
                encounterValue: 0
            },
            world: {
                zoneKind: 'training',
                crowding: 0,
                novelty: 0,
                flowerAvailability: 0,
                nearbyAllies: 0,
                nearbyRivals: 0,
                nearbyVulnerableTargets: 0,
                battleMode: 'battle'
            },
            autobattle: {
                allyPressure: 0,
                enemyThreat: 0,
                targetPriority: 0,
                spacingState: 'open',
                retreatPressure: 0,
                supportOpportunity: 0,
                readinessScore: 0,
                readinessTier: 'Rest',
                offense: 0,
                guard: 0,
                resolve: 0,
                support: 0
            },
            behavior: {
                currentActionFamily: 'battlePosture',
                currentActionSubtype: 'battlePosture',
                currentTargetId: null,
                wanderScale: 0,
                feedUrgency: 0,
                displayConfidence: 0,
                socialConfidence: 0,
                caution: 0,
                trainingAffinity: 0,
                objectInterest: 0,
                cursorAffinity: 0,
                shelterSeeking: 0,
                battleAggression: 0,
                followThroughDrive: 0,
                socialAvoidance: 0
            }
        };
    }

    getLiveEntityById(entityId, gameState = gameCore?.gameState) {
        if (!entityId) return null;
        return this.getLiveEntities(gameState).find(entity => entity.id === entityId) || null;
    }

    normalizeBattleMetric(value, divisor = 100) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        if (numeric >= 0 && numeric <= 1) return this.clamp01(numeric);
        return this.normalizeCount(numeric, divisor);
    }

    resolveCategoryValue(value, categoryName, fallback) {
        const domain = this.categoryDomains?.[categoryName] || [];
        return domain.includes(value) ? value : fallback;
    }

    getCategoryBias(value, biasMap = {}, fallback = 0) {
        const resolved = biasMap?.[value];
        return Number.isFinite(resolved) ? resolved : fallback;
    }

    getFeatureContractSnapshot() {
        const defaults = this.createDefaultFeatureGroups();
        const flatFeatures = this.buildFlatFeatureMap(defaults);
        const numericVector = this.buildNumericVector(defaults);
        return {
            featureSchemaVersion: this.modelConfig.featureSchemaVersion,
            traceSchemaVersion: this.modelConfig.traceSchemaVersion,
            groupOrder: [...this.featureOrders.groupOrder],
            groupCount: this.featureOrders.groupOrder.length,
            flatFeatureCount: Object.keys(flatFeatures).length,
            vectorLength: numericVector.length,
            sharedSpatialHooks: [...(this.modelConfig.contract?.sharedSpatialHooks || [])],
            spatialFieldTiers: this.cloneValue(this.featureOrders.spatialFieldTiers, {})
        };
    }

    buildNumericVector(groups = {}) {
        const numericVector = [];
        const pushNumeric = (value) => numericVector.push(this.clamp01(value));
        const defaults = this.createDefaultFeatureGroups();
        const readGroupValue = (groupName, key) => groups?.[groupName]?.[key] ?? defaults?.[groupName]?.[key];
        const baselineTraits = groups?.genetics?.baselineTraits || defaults.genetics.baselineTraits;
        const effectiveTraits = groups?.genetics?.effectiveTraits || defaults.genetics.effectiveTraits;
        const spatialTiers = this.featureOrders.spatialFieldTiers;

        pushNumeric(this.categoricalIndex(readGroupValue('identity', 'entityType'), 'entityType') / Math.max(1, this.categoryDomains.entityType.length - 1));
        pushNumeric(this.categoricalIndex(readGroupValue('identity', 'rarity'), 'rarity') / Math.max(1, this.categoryDomains.rarity.length - 1));
        pushNumeric(this.categoricalIndex(readGroupValue('identity', 'sex'), 'sex') / Math.max(1, this.categoryDomains.sex.length - 1));
        pushNumeric(this.categoricalIndex(readGroupValue('identity', 'birthSource'), 'birthSource') / Math.max(1, this.categoryDomains.birthSource.length - 1));
        pushNumeric(this.categoricalIndex(readGroupValue('identity', 'specialAbility'), 'ability') / Math.max(1, this.categoryDomains.ability.length - 1));

        for (const key of this.featureOrders.traitKeys) pushNumeric(this.normalizeTraitValue(baselineTraits[key]));
        for (const key of this.featureOrders.traitKeys) pushNumeric(this.normalizeTraitValue(effectiveTraits[key]));
        pushNumeric(readGroupValue('genetics', 'inheritedAbilityOrigin') === 'inherited' ? 1 : readGroupValue('genetics', 'inheritedAbilityOrigin') === 'bred' ? 0.5 : 0);
        pushNumeric(readGroupValue('genetics', 'mutationPresence') ? 1 : 0);
        pushNumeric(readGroupValue('genetics', 'upbringingStrength'));

        for (const key of this.featureOrders.driveKeys) pushNumeric(readGroupValue('drives', key));
        for (const key of this.featureOrders.emotionKeys) pushNumeric(readGroupValue('emotions', key));

        pushNumeric(readGroupValue('social', 'reputation'));
        pushNumeric(readGroupValue('social', 'belonging'));
        pushNumeric(readGroupValue('social', 'confidence'));
        pushNumeric(readGroupValue('social', 'edgeTrustAverage'));
        pushNumeric(readGroupValue('social', 'edgeAttachmentAverage'));
        pushNumeric(this.categoricalIndex(readGroupValue('social', 'activeContext'), 'activeContext') / Math.max(1, this.categoryDomains.activeContext.length - 1));
        pushNumeric(this.categoricalIndex(readGroupValue('social', 'societyTone'), 'societyTone') / Math.max(1, this.categoryDomains.societyTone.length - 1));
        pushNumeric(this.categoricalIndex(readGroupValue('social', 'relationshipTexture'), 'relationshipTexture') / Math.max(1, this.categoryDomains.relationshipTexture.length - 1));
        pushNumeric(this.categoricalIndex(readGroupValue('social', 'followThroughMode'), 'followThroughMode') / Math.max(1, this.categoryDomains.followThroughMode.length - 1));
        pushNumeric(readGroupValue('social', 'followThroughStrength'));
        pushNumeric(this.categoricalIndex(readGroupValue('social', 'localFieldTone'), 'localFieldTone') / Math.max(1, this.categoryDomains.localFieldTone.length - 1));
        pushNumeric(readGroupValue('social', 'localFieldPressure'));

        pushNumeric(readGroupValue('interpretation', 'clarity'));
        pushNumeric(readGroupValue('interpretation', 'warpedSignals'));
        pushNumeric(readGroupValue('interpretation', 'anxietyBias'));
        pushNumeric(readGroupValue('interpretation', 'withdrawalBias'));
        pushNumeric(readGroupValue('interpretation', 'fixationBias'));
        pushNumeric(readGroupValue('interpretation', 'insomniaBias'));
        pushNumeric(readGroupValue('interpretation', 'oversleepBias'));
        pushNumeric(readGroupValue('interpretation', 'warpedTeachingBias'));

        for (const key of this.featureOrders.memoryRoutineKeys) pushNumeric(readGroupValue('memoryRoutine', key));

        pushNumeric(readGroupValue('playerInteraction', 'cursorTrust'));
        pushNumeric(readGroupValue('playerInteraction', 'cursorFear'));
        pushNumeric(readGroupValue('playerInteraction', 'petHistory'));
        pushNumeric(readGroupValue('playerInteraction', 'clapStartleHistory'));
        pushNumeric(readGroupValue('playerInteraction', 'calmedByCursor') ? 1 : 0);

        pushNumeric(this.categoricalIndex(readGroupValue('objectAwareness', 'focusType'), 'focusType') / Math.max(1, this.categoryDomains.focusType.length - 1));
        pushNumeric(this.categoricalIndex(readGroupValue('objectAwareness', 'currentAffordance'), 'affordance') / Math.max(1, this.categoryDomains.affordance.length - 1));
        pushNumeric(this.categoricalIndex(readGroupValue('objectAwareness', 'carryingType'), 'carryingType') / Math.max(1, this.categoryDomains.carryingType.length - 1));
        pushNumeric(readGroupValue('objectAwareness', 'flowerFamiliarity'));
        pushNumeric(readGroupValue('objectAwareness', 'pollenFamiliarity'));
        pushNumeric(readGroupValue('objectAwareness', 'eggFamiliarity'));
        pushNumeric(readGroupValue('objectAwareness', 'blockFamiliarity'));
        pushNumeric(readGroupValue('objectAwareness', 'shelterConfidence'));

        for (const key of spatialTiers.b3Stable) {
            pushNumeric(this.categoricalIndex(readGroupValue('spatial', key), key) / Math.max(1, this.categoryDomains[key].length - 1));
        }
        pushNumeric(this.categoricalIndex(readGroupValue('spatial', 'occupancyBand'), 'occupancyBand') / Math.max(1, this.categoryDomains.occupancyBand.length - 1));
        pushNumeric(readGroupValue('spatial', 'obstacleDensity'));
        pushNumeric(readGroupValue('spatial', 'shelterCandidate') ? 1 : 0);
        pushNumeric(readGroupValue('spatial', 'insideShelter') ? 1 : 0);
        pushNumeric(readGroupValue('spatial', 'canUseInterior') ? 1 : 0);

        pushNumeric(readGroupValue('progression', 'originType') === 'bred' ? 1 : readGroupValue('progression', 'originType') === 'rostered' ? 0.5 : 0);
        for (const key of this.featureOrders.progressionKeys.slice(1)) pushNumeric(readGroupValue('progression', key));

        pushNumeric(this.categoricalIndex(readGroupValue('world', 'zoneKind'), 'zoneKind') / Math.max(1, this.categoryDomains.zoneKind.length - 1));
        pushNumeric(readGroupValue('world', 'crowding'));
        pushNumeric(readGroupValue('world', 'novelty'));
        pushNumeric(readGroupValue('world', 'flowerAvailability'));
        pushNumeric(readGroupValue('world', 'nearbyAllies'));
        pushNumeric(readGroupValue('world', 'nearbyRivals'));
        pushNumeric(readGroupValue('world', 'nearbyVulnerableTargets'));
        pushNumeric(this.categoricalIndex(readGroupValue('world', 'battleMode'), 'battleMode') / Math.max(1, this.categoryDomains.battleMode.length - 1));

        pushNumeric(readGroupValue('autobattle', 'allyPressure'));
        pushNumeric(readGroupValue('autobattle', 'enemyThreat'));
        pushNumeric(readGroupValue('autobattle', 'targetPriority'));
        pushNumeric(this.categoricalIndex(readGroupValue('autobattle', 'spacingState'), 'spacingState') / Math.max(1, this.categoryDomains.spacingState.length - 1));
        pushNumeric(readGroupValue('autobattle', 'retreatPressure'));
        pushNumeric(readGroupValue('autobattle', 'supportOpportunity'));
        pushNumeric(readGroupValue('autobattle', 'readinessScore'));
        pushNumeric(readGroupValue('autobattle', 'offense'));
        pushNumeric(readGroupValue('autobattle', 'guard'));
        pushNumeric(readGroupValue('autobattle', 'resolve'));
        pushNumeric(readGroupValue('autobattle', 'support'));

        pushNumeric(readGroupValue('behavior', 'wanderScale'));
        pushNumeric(readGroupValue('behavior', 'feedUrgency'));
        pushNumeric(readGroupValue('behavior', 'displayConfidence'));
        pushNumeric(readGroupValue('behavior', 'socialConfidence'));
        pushNumeric(readGroupValue('behavior', 'caution'));
        pushNumeric(readGroupValue('behavior', 'trainingAffinity'));
        pushNumeric(readGroupValue('behavior', 'objectInterest'));
        pushNumeric(readGroupValue('behavior', 'cursorAffinity'));
        pushNumeric(readGroupValue('behavior', 'shelterSeeking'));
        pushNumeric(readGroupValue('behavior', 'battleAggression'));
        pushNumeric(readGroupValue('behavior', 'followThroughDrive'));
        pushNumeric(readGroupValue('behavior', 'socialAvoidance'));

        return numericVector;
    }

    buildFeatureTraceSummary(features = {}, trace = null) {
        const contract = this.getFeatureContractSnapshot();
        const groupLabels = contract.groupOrder.filter(groupName => features?.groups?.[groupName]);
        const spatial = features?.groups?.spatial || {};
        return {
            featureSchemaVersion: features?.schemaVersion || this.modelConfig.featureSchemaVersion,
            traceSchemaVersion: trace?.schemaVersion || this.modelConfig.traceSchemaVersion,
            groupCount: groupLabels.length,
            groupLabels,
            flatFeatureCount: Number.isFinite(features?.flatFeatureCount) ? features.flatFeatureCount : Object.keys(features?.flatFeatures || {}).length,
            vectorLength: Number.isFinite(features?.vectorLength) ? features.vectorLength : Array.isArray(features?.numericVector) ? features.numericVector.length : 0,
            sharedSpatialHooks: [...contract.sharedSpatialHooks],
            spatialFieldTiers: this.cloneValue(contract.spatialFieldTiers, {}),
            currentSpatial: {
                verticality: spatial.verticality || 'ground',
                structureRole: spatial.structureRole || 'loose',
                pathState: spatial.pathState || 'open',
                bodyFit: spatial.bodyFit || 'canPass',
                occupancyBand: spatial.occupancyBand || 'ground',
                shelterCandidate: !!spatial.shelterCandidate,
                insideShelter: !!spatial.insideShelter,
                canUseInterior: !!spatial.canUseInterior
            }
        };
    }

    humanizeFeatureKey(featureKey = '') {
        const raw = String(featureKey || '').split('.').pop() || String(featureKey || '');
        return raw
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    getFeatureValueBand(value = 0) {
        const numeric = this.clamp01(value);
        if (numeric >= 0.67) return 'high';
        if (numeric >= 0.34) return 'steady';
        return 'low';
    }

    buildPolicyHighlightSummary(policyName, trace = null, features = null) {
        if (trace?.source !== 'ml') {
            return {
                shortText: 'Fallback heuristic active',
                debugText: 'fallback heuristic active',
                entries: []
            };
        }

        const chosenLabel = trace?.chosen || null;
        const artifactPolicy = this.modelRuntime.modelArtifact?.policies?.[policyName] || null;
        const labelWeights = artifactPolicy?.weights?.[chosenLabel] || null;
        const flatFeatures = features?.flatFeatures || {};
        if (!chosenLabel || !labelWeights) {
            return {
                shortText: 'No driver highlights',
                debugText: 'no driver highlights',
                entries: []
            };
        }

        const entries = Object.entries(labelWeights)
            .map(([featureKey, weight]) => {
                const featureValue = this.clamp01(flatFeatures?.[featureKey] || 0);
                const contribution = Number(weight || 0) * featureValue;
                return {
                    featureKey,
                    label: this.humanizeFeatureKey(featureKey),
                    featureValue,
                    weight: Number(weight || 0),
                    contribution
                };
            })
            .filter(entry => entry.contribution > 0.03 && entry.featureValue > 0.01)
            .sort((left, right) => right.contribution - left.contribution)
            .slice(0, 3)
            .map(entry => ({
                ...entry,
                contributionLabel: `+${entry.contribution.toFixed(2)}`,
                valueBand: this.getFeatureValueBand(entry.featureValue)
            }));

        if (!entries.length) {
            return {
                shortText: 'No clear positive driver',
                debugText: 'no clear positive driver',
                entries: []
            };
        }

        return {
            shortText: entries.map(entry => `${entry.label} ${entry.valueBand}`).join(' | '),
            debugText: entries.map(entry => `${entry.featureKey} ${entry.contributionLabel}`).join(' | '),
            entries
        };
    }

    buildBattleParticipantFeatureBundle(participant, snapshot, gameState = gameCore?.gameState) {
        const liveEntity = this.getLiveEntityById(participant?.id, gameState);
        const liveFeatures = liveEntity
            ? this.buildFeatureGroups(
                liveEntity,
                { ...(gameState || {}), viewMode: 'battle' },
                behaviorSystem?.getRuntime?.(liveEntity.id) || null
            )
            : null;
        const groups = this.cloneValue(liveFeatures?.groups, this.createDefaultFeatureGroups());
        const activeParticipants = Object.values(snapshot?.participantsById || {}).filter(Boolean);
        const activeAllies = activeParticipants.filter(entry =>
            entry.id !== participant?.id
            && entry.teamId === participant?.teamId
            && !entry.defeated
            && !entry.retreated
        );
        const activeEnemies = activeParticipants.filter(entry =>
            entry.teamId !== participant?.teamId
            && !entry.defeated
            && !entry.retreated
        );
        const vulnerableEnemies = activeEnemies.filter(entry => {
            const maxHp = Math.max(1, entry.maxHp || entry.hp || 1);
            const hpRatio = this.clamp01((entry.hp || 0) / maxHp);
            return hpRatio < 0.45 || (entry.pressure || 0) >= 3;
        });
        const battleContext = participant?.cognition?.battle || {};
        const battleStats = participant?.statProfile?.battleStats || {};
        const readinessScore = participant?.statProfile?.readinessProfile?.score
            || participant?.statProfile?.readiness?.score
            || 0;
        const maxHp = Math.max(1, participant?.maxHp || participant?.hp || 1);
        const hpRatio = this.clamp01((participant?.hp || 0) / maxHp);
        const pressureRatio = this.clamp01((participant?.pressure || 0) / 8);
        const derivedAggression = this.clamp01(
            (this.normalizeCount((battleStats.offense || 0) + (battleStats.initiative || 0), 220) * 0.55)
            + (this.normalizeCount(readinessScore, 100) * 0.2)
            + ((1 - pressureRatio) * 0.15)
        );

        groups.identity.archetype = participant?.archetype || groups.identity.archetype;
        groups.identity.entityType = participant?.entityType || groups.identity.entityType;
        groups.world.zoneKind = 'training';
        groups.world.battleMode = 'battle';
        groups.world.flowerAvailability = 0;
        groups.world.crowding = this.normalizeCount(activeParticipants.length, 10);
        groups.world.novelty = 0.08;
        groups.world.nearbyAllies = this.normalizeCount(activeAllies.length, 6);
        groups.world.nearbyRivals = this.normalizeCount(activeEnemies.length, 6);
        groups.world.nearbyVulnerableTargets = this.normalizeCount(vulnerableEnemies.length, 6);

        groups.social.activeContext = 'training-ground';
        groups.playerInteraction.cursorTrust = 0;
        groups.playerInteraction.cursorFear = 0;
        groups.playerInteraction.calmedByCursor = false;

        groups.autobattle.allyPressure = this.normalizeBattleMetric(battleContext.allyPressure);
        groups.autobattle.enemyThreat = this.normalizeBattleMetric(battleContext.enemyThreat);
        groups.autobattle.targetPriority = this.normalizeBattleMetric(battleContext.targetPriority);
        groups.autobattle.spacingState = battleContext.spacingState || (activeParticipants.length >= 8 ? 'tight' : activeParticipants.length >= 5 ? 'crowded' : 'open');
        groups.autobattle.retreatPressure = this.clamp01(Math.max(
            this.normalizeBattleMetric(battleContext.retreatPressure),
            ((1 - hpRatio) * 0.45) + (pressureRatio * 0.4)
        ));
        groups.autobattle.supportOpportunity = this.normalizeBattleMetric(battleContext.supportOpportunity);
        groups.autobattle.readinessScore = this.normalizeCount(readinessScore, 100);
        groups.autobattle.readinessTier = participant?.statProfile?.readinessProfile?.tier || participant?.statProfile?.readiness?.tier || 'Ready';
        groups.autobattle.offense = this.normalizeCount(battleStats.offense || 0, 120);
        groups.autobattle.guard = this.normalizeCount(battleStats.guard || 0, 120);
        groups.autobattle.resolve = this.normalizeCount(battleStats.resolve || 0, 120);
        groups.autobattle.support = this.normalizeCount(battleStats.support || 0, 120);

        groups.behavior.currentActionFamily = participant?.actionFamily || 'battlePosture';
        groups.behavior.currentActionSubtype = participant?.actionSubtype || 'battlePosture';
        groups.behavior.currentTargetId = participant?.targetId || null;
        groups.behavior.battleAggression = Math.max(groups.behavior.battleAggression || 0, derivedAggression);
        groups.behavior.caution = Math.max(
            groups.behavior.caution || 0,
            this.clamp01((groups.autobattle.enemyThreat * 0.45) + (groups.autobattle.retreatPressure * 0.35))
        );

        groups.emotions.threat = Math.max(groups.emotions.threat || 0, groups.autobattle.enemyThreat);
        groups.emotions.exhaustion = Math.max(
            groups.emotions.exhaustion || 0,
            this.normalizeBattleMetric(participant?.exhaustion || 0)
        );
        groups.objectAwareness.focusType = 'none';
        groups.objectAwareness.currentAffordance = 'observe';

        const flatFeatures = this.buildFlatFeatureMap(groups);
        const numericVector = this.buildNumericVector(groups);

        return {
            schemaVersion: this.modelConfig.featureSchemaVersion,
            entityId: participant?.id || null,
            generatedAtSeconds: this.simulationClockSeconds,
            groups,
            flatFeatures,
            flatFeatureCount: Object.keys(flatFeatures).length,
            numericVector,
            vectorLength: numericVector.length
        };
    }

    sigmoid(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0.5;
        return 1 / (1 + Math.exp(-numeric));
    }

    scoreLinearPolicy(policyDefinition = {}, flatFeatures = {}) {
        const labels = Array.isArray(policyDefinition.labels) ? policyDefinition.labels : [];
        const bias = policyDefinition.bias || {};
        const weights = policyDefinition.weights || {};
        const scores = {};

        for (const label of labels) {
            let rawScore = Number(bias[label] || 0);
            const labelWeights = weights[label] || {};
            for (const [featureName, weight] of Object.entries(labelWeights)) {
                rawScore += (flatFeatures[featureName] || 0) * Number(weight || 0);
            }
            scores[label] = this.sigmoid(rawScore);
        }

        return scores;
    }

    buildModelPoliciesInline(features, gameState = gameCore?.gameState) {
        if (!this.modelConfig.useModelInference || !this.modelRuntime.modelAvailable) return null;
        const artifact = this.modelRuntime.modelArtifact;
        const flatFeatures = features?.flatFeatures || {};
        if (!artifact?.policies) return null;
        const battleMode = features?.groups?.world?.battleMode === 'battle';

        try {
            const modelPolicies = {};
            if (!battleMode && artifact.policies.actionFamily) {
                modelPolicies.actionFamily = this.scoreLinearPolicy(artifact.policies.actionFamily, flatFeatures);
            }
            if (!battleMode && artifact.policies.targetPreference) {
                modelPolicies.targetPreference = this.scoreLinearPolicy(artifact.policies.targetPreference, flatFeatures);
            }
            if (!battleMode && artifact.policies.signalChoice) {
                modelPolicies.signalChoice = this.scoreLinearPolicy(artifact.policies.signalChoice, flatFeatures);
            }
            if (!battleMode && artifact.policies.riskPosture) {
                modelPolicies.riskPosture = this.scoreLinearPolicy(artifact.policies.riskPosture, flatFeatures);
            }
            if (artifact.policies.autobattlePosture) {
                modelPolicies.autobattlePosture = this.scoreLinearPolicy(artifact.policies.autobattlePosture, flatFeatures);
            }
            return Object.keys(modelPolicies).length ? modelPolicies : null;
        } catch (error) {
            this.modelRuntime.lastInferenceError = String(error?.message || error);
            return null;
        }
    }

    queueWorkerModelPoliciesBatch(entries = [], options = {}) {
        if (!Array.isArray(entries) || entries.length === 0 || this.workerOffload.pendingBatch) return false;
        const host = this.ensureWorkerOffloadHost();
        const modelVersionId = this.modelRuntime.modelArtifact?.modelVersionId || this.modelConfig.modelVersionId || null;
        if (!host || this.workerOffload.syncedModelVersionId !== modelVersionId) return false;

        const requestEntries = entries.filter((entry) => entry?.runtime && entry?.entity?.id && entry?.features?.flatFeatures);
        if (requestEntries.length === 0) return false;

        const seq = Math.max(1, (this.workerOffload.pendingBatchSeq || 0) + 1);
        const requestFrame = Number.isFinite(options?.currentFrame)
            ? Math.max(0, Math.round(options.currentFrame))
            : this.frameCounter;

        this.workerOffload.pendingBatch = true;
        this.workerOffload.pendingBatchSeq = seq;
        this.workerOffload.pendingBatchFrame = requestFrame;
        for (const entry of requestEntries) {
            entry.runtime.pendingWorkerInference = true;
            entry.runtime.pendingWorkerInferenceSeq = seq;
        }

        host.request('ml.infer.batch', {
            items: requestEntries.map((entry) => ({
                entityId: entry.entity.id,
                flatFeatures: entry.features?.flatFeatures || {},
                battleMode: false,
                alternativeCount: this.modelConfig.alternativeCount
            })),
            alternativeCount: this.modelConfig.alternativeCount
        }, { timeoutMs: 250 }).then((result) => {
            if ((this.workerOffload.pendingBatchSeq || 0) !== seq) {
                return;
            }
            const resultByEntityId = new Map();
            for (const item of Array.isArray(result?.items) ? result.items : []) {
                resultByEntityId.set(item?.entityId || null, {
                    modelPolicies: item?.modelPolicies || null,
                    modelTraces: item?.modelTraces || null
                });
            }
            for (const entry of requestEntries) {
                const hasResult = resultByEntityId.has(entry.entity.id);
                const payload = hasResult
                    ? resultByEntityId.get(entry.entity.id)
                    : null;
                const modelPolicies = hasResult
                    ? payload?.modelPolicies || null
                    : entry.runtime.lastModelPolicies;
                const modelTraces = hasResult
                    ? payload?.modelTraces || null
                    : entry.runtime.lastModelPolicyTraces;
                entry.runtime.lastModelPolicies = this.cloneValue(modelPolicies, null);
                entry.runtime.lastModelPolicyTraces = this.cloneValue(modelTraces, null);
                if (hasResult) {
                    entry.runtime.lastModelPoliciesAtGameFrame = requestFrame;
                    this.flushDeferredWorkerRefresh(entry.entity, entry.runtime, requestFrame);
                }
                entry.runtime.resolvedWorkerInferenceSeq = seq;
                entry.runtime.pendingWorkerInference = false;
            }
            this.workerOffload.pendingBatch = false;
            this.workerOffload.lastError = null;
        }).catch((error) => {
            if ((this.workerOffload.pendingBatchSeq || 0) === seq) {
                this.workerOffload.pendingBatch = false;
                for (const entry of requestEntries) {
                    if ((entry.runtime?.pendingWorkerInferenceSeq || 0) === seq) {
                        entry.runtime.pendingWorkerInference = false;
                        if (entry.runtime?.pendingWorkerRefresh) {
                            this.flushDeferredWorkerRefresh(entry.entity, entry.runtime, requestFrame);
                        }
                    }
                }
            }
            this.workerOffload.lastError = String(error?.message || error);
        });

        return true;
    }

    buildModelPolicies(features, gameState = gameCore?.gameState, runtime = null, options = {}) {
        if (Object.prototype.hasOwnProperty.call(options || {}, 'modelPoliciesOverride')) {
            return options.modelPoliciesOverride || null;
        }
        const battleMode = features?.groups?.world?.battleMode === 'battle';
        if (!runtime || battleMode || !this.isWorkerOffloadEnabled()) {
            return this.buildModelPoliciesInline(features, gameState);
        }

        const host = this.ensureWorkerOffloadHost();
        const modelVersionId = this.modelRuntime.modelArtifact?.modelVersionId || this.modelConfig.modelVersionId || null;
        if (!host || !modelVersionId) {
            return this.buildModelPoliciesInline(features, gameState);
        }

        if (this.workerOffload.syncedModelVersionId !== modelVersionId) {
            void this.syncWorkerModelArtifact();
            return runtime.lastModelPolicies || null;
        }

        if (this.workerOffload.lastError) {
            return this.buildModelPoliciesInline(features, gameState);
        }

        return runtime.lastModelPolicies || null;
    }

    applyCurrentActionPrior(scores, currentActionFamily, amount = 0.06) {
        if (!currentActionFamily || !(currentActionFamily in scores)) return scores;
        scores[currentActionFamily] = this.clamp01((scores[currentActionFamily] || 0) + amount);
        return scores;
    }

    buildHeuristicPolicies(entity, features) {
        const drives = features.groups.drives;
        const emotions = features.groups.emotions;
        const social = features.groups.social;
        const player = features.groups.playerInteraction;
        const objectAwareness = features.groups.objectAwareness;
        const spatial = features.groups.spatial;
        const progression = features.groups.progression;
        const world = features.groups.world;
        const autobattle = features.groups.autobattle;
        const behavior = features.groups.behavior;
        const communicationActivity = features.groups.memoryRoutine.communicationActivity;
        const societyTone = social.societyTone || 'mixed';
        const relationshipTexture = social.relationshipTexture || 'steady';
        const followThroughMode = social.followThroughMode || 'none';
        const localFieldTone = social.localFieldTone || 'quiet';
        const followThroughStrength = social.followThroughStrength || 0;
        const localFieldPressure = social.localFieldPressure || 0;
        const followThroughDrive = behavior.followThroughDrive || 0;
        const socialAvoidance = behavior.socialAvoidance || 0;
        const societySocialBias = this.getCategoryBias(societyTone, {
            'clique-comfort': 0.08,
            'protective-ring': 0.05,
            'reputation-wave': 0.04,
            'clique-exclusion': -0.08,
            mixed: 0
        });
        const textureSocialBias = this.getCategoryBias(relationshipTexture, {
            devoted: 0.12,
            playful: 0.08,
            admiring: 0.06,
            repairing: 0.02,
            steady: 0.04,
            guarded: -0.06,
            strained: -0.12
        });
        const textureCourtshipBias = this.getCategoryBias(relationshipTexture, {
            devoted: 0.12,
            playful: 0.08,
            admiring: 0.1,
            repairing: -0.04,
            guarded: -0.06,
            strained: -0.12
        });
        const localFieldSocialBias = this.getCategoryBias(localFieldTone, {
            quiet: 0.04,
            courtship: 0.06,
            calming: 0.04,
            support: 0.04,
            teaching: 0.02,
            guidance: 0.02,
            warning: -0.04
        });
        const butterflyPreferenceBias = this.getCategoryBias(followThroughMode, {
            seek: 0.12,
            imitate: 0.1,
            protect: 0.08,
            avoid: -0.18,
            none: 0
        });
        const invitationBias = this.getCategoryBias(localFieldTone, {
            courtship: 0.08,
            quiet: 0.04,
            warning: -0.08
        }) + this.getCategoryBias(followThroughMode, {
            seek: 0.1,
            imitate: 0.06,
            avoid: -0.12,
            protect: 0.02,
            none: 0
        });
        const calmingBias = this.getCategoryBias(localFieldTone, {
            warning: 0.12,
            support: 0.08,
            calming: 0.14
        }) + this.getCategoryBias(societyTone, {
            'protective-ring': 0.08
        }) + this.getCategoryBias(followThroughMode, {
            protect: 0.08
        });
        const warningBias = this.getCategoryBias(localFieldTone, {
            warning: 0.14
        }) + this.getCategoryBias(societyTone, {
            'protective-ring': 0.1
        });
        const teachingBias = this.getCategoryBias(localFieldTone, {
            teaching: 0.16
        }) + this.getCategoryBias(societyTone, {
            'reputation-wave': 0.12
        }) + this.getCategoryBias(relationshipTexture, {
            admiring: 0.08
        }) + this.getCategoryBias(followThroughMode, {
            imitate: 0.08
        });
        const quietBias = this.getCategoryBias(localFieldTone, {
            quiet: 0.12,
            warning: -0.08
        }) + this.getCategoryBias(relationshipTexture, {
            guarded: 0.04,
            strained: 0.08
        });
        const approachFollowBias = this.getCategoryBias(followThroughMode, {
            seek: 0.1,
            imitate: 0.08,
            protect: 0.08,
            avoid: -0.16,
            none: 0
        });
        const avoidFollowBias = this.getCategoryBias(followThroughMode, {
            avoid: 0.16,
            seek: -0.04,
            imitate: -0.03,
            protect: 0.02,
            none: 0
        });

        const actionScores = this.applyCurrentActionPrior({
            wander: this.clamp01(0.16 + behavior.wanderScale * 0.36 + drives.exploration * 0.22 + emotions.curiosity * 0.14 - drives.rest * 0.1),
            feed: this.clamp01(0.12 + behavior.feedUrgency * 0.54 + drives.resourceControl * 0.16 + world.flowerAvailability * 0.08),
            socialize: this.clamp01(
                0.1
                + behavior.socialConfidence * 0.34
                + drives.socialConnection * 0.18
                + social.belonging * 0.12
                + followThroughDrive * 0.22
                + followThroughStrength * 0.1
                + societySocialBias
                + textureSocialBias
                + localFieldSocialBias
                - socialAvoidance * 0.26
            ),
            signal: this.clamp01(
                0.08
                + behavior.displayConfidence * 0.28
                + social.reputation * 0.12
                + communicationActivity * 0.1
                + localFieldPressure * 0.08
                + followThroughStrength * 0.08
                + this.getCategoryBias(localFieldTone, {
                    warning: 0.04,
                    teaching: 0.06,
                    courtship: 0.04,
                    calming: 0.06,
                    guidance: 0.04,
                    support: 0.05,
                    quiet: -0.02
                })
            ),
            teach: this.clamp01(
                0.04
                + behavior.trainingAffinity * 0.42
                + social.reputation * 0.12
                + teachingBias
            ),
            court: this.clamp01(
                0.04
                + drives.caregiving * 0.28
                + emotions.attachment * 0.18
                + progression.lineageValue * 0.08
                + textureCourtshipBias
                + this.getCategoryBias(localFieldTone, {
                    courtship: 0.12
                })
            ),
            rest: this.clamp01(0.08 + drives.rest * 0.48 + emotions.exhaustion * 0.24),
            avoid: this.clamp01(
                0.06
                + behavior.caution * 0.38
                + emotions.threat * 0.18
                + player.cursorFear * 0.14
                + socialAvoidance * 0.34
                + avoidFollowBias
                + this.getCategoryBias(societyTone, {
                    'clique-exclusion': 0.1
                })
                + this.getCategoryBias(localFieldTone, {
                    warning: 0.06
                })
            ),
            buildOrUseObject: this.clamp01(
                0.05
                + behavior.objectInterest * 0.4
                + behavior.shelterSeeking * 0.24
                + objectAwareness.blockFamiliarity * 0.1
                - followThroughDrive * 0.08
                + socialAvoidance * 0.04
            ),
            battlePosture: this.clamp01(0.03 + behavior.battleAggression * 0.5 + autobattle.enemyThreat * 0.14)
        }, behavior.currentActionFamily);

        return {
            actionFamily: actionScores,
            targetPreference: {
                flower: this.clamp01(0.08 + behavior.feedUrgency * 0.54 + objectAwareness.flowerFamiliarity * 0.12 + (objectAwareness.focusType === 'flower' ? 0.16 : 0)),
                butterfly: this.clamp01(
                    0.08
                    + behavior.socialConfidence * 0.34
                    + drives.socialConnection * 0.16
                    + social.belonging * 0.1
                    + followThroughDrive * 0.24
                    + followThroughStrength * 0.12
                    + societySocialBias
                    + textureSocialBias
                    + butterflyPreferenceBias
                    - socialAvoidance * 0.3
                ),
                block: this.clamp01(0.04 + behavior.objectInterest * 0.52 + objectAwareness.blockFamiliarity * 0.14 + (objectAwareness.focusType === 'block' ? 0.18 : 0)),
                shelter: this.clamp01(0.04 + behavior.shelterSeeking * 0.56 + objectAwareness.shelterConfidence * 0.18 + (spatial.shelterCandidate ? 0.12 : 0)),
                doorway: this.clamp01(0.02 + progression.encounterValue * 0.14 + (world.battleMode === 'garden' ? 0.04 : 0)),
                emptySpace: this.clamp01(0.06 + behavior.wanderScale * 0.5 + world.novelty * 0.16)
            },
            signalChoice: {
                calming: this.clamp01(
                    0.06
                    + emotions.relief * 0.28
                    + emotions.attachment * 0.16
                    + player.cursorTrust * 0.12
                    + calmingBias
                ),
                warning: this.clamp01(
                    0.05
                    + emotions.threat * 0.38
                    + behavior.caution * 0.16
                    + player.cursorFear * 0.12
                    + warningBias
                    + socialAvoidance * 0.12
                ),
                teaching: this.clamp01(
                    0.04
                    + behavior.trainingAffinity * 0.42
                    + social.reputation * 0.12
                    + teachingBias
                ),
                invitation: this.clamp01(
                    0.04
                    + behavior.socialConfidence * 0.24
                    + emotions.attachment * 0.16
                    + progression.encounterValue * 0.08
                    + this.getCategoryBias(societyTone, {
                        'clique-comfort': 0.12
                    })
                    + this.getCategoryBias(relationshipTexture, {
                        devoted: 0.12,
                        playful: 0.1,
                        admiring: 0.08,
                        repairing: 0.02,
                        guarded: -0.06,
                        strained: -0.12
                    })
                    + invitationBias
                    - socialAvoidance * 0.24
                ),
                quiet: this.clamp01(
                    0.1
                    + drives.rest * 0.18
                    + (1 - communicationActivity) * 0.12
                    + quietBias
                    + socialAvoidance * 0.2
                )
            },
            riskPosture: {
                approach: this.clamp01(
                    0.12
                    + behavior.cursorAffinity * 0.28
                    + behavior.socialConfidence * 0.16
                    + player.cursorTrust * 0.14
                    + followThroughDrive * 0.14
                    + approachFollowBias
                    - socialAvoidance * 0.18
                ),
                observe: this.clamp01(0.16 + world.novelty * 0.2 + (objectAwareness.currentAffordance === 'observe' ? 0.14 : 0.08) + localFieldPressure * 0.1),
                avoid: this.clamp01(
                    0.08
                    + behavior.caution * 0.34
                    + player.cursorFear * 0.16
                    + emotions.rejection * 0.1
                    + socialAvoidance * 0.28
                    + avoidFollowBias
                    + this.getCategoryBias(societyTone, {
                        'clique-exclusion': 0.08
                    })
                ),
                flee: this.clamp01(0.04 + emotions.threat * 0.46 + autobattle.retreatPressure * 0.18 + player.cursorFear * 0.1)
            },
            autobattlePosture: {
                engage: this.clamp01(0.12 + behavior.battleAggression * 0.42 + autobattle.targetPriority * 0.18 + autobattle.offense * 0.08),
                support: this.clamp01(0.08 + autobattle.supportOpportunity * 0.4 + autobattle.support * 0.14 + autobattle.allyPressure * 0.08),
                focusWeakTarget: this.clamp01(0.08 + autobattle.targetPriority * 0.46 + autobattle.offense * 0.08),
                stabilize: this.clamp01(0.08 + autobattle.guard * 0.14 + autobattle.resolve * 0.14 + autobattle.retreatPressure * 0.1),
                retreat: this.clamp01(0.04 + autobattle.retreatPressure * 0.46 + autobattle.enemyThreat * 0.2)
            }
        };
    }

    buildPolicyTrace(policyName, scores, source = 'heuristic-fallback') {
        const topEntries = this.getTopPolicyEntries(scores, Math.max(3, this.modelConfig.alternativeCount + 1));
        const chosen = topEntries[0] || { label: 'none', value: 0 };
        const alternatives = topEntries.slice(1, this.modelConfig.alternativeCount + 1);
        return {
            policy: policyName,
            source,
            chosen: chosen.label,
            chosenScore: Math.round((chosen.value || 0) * 100),
            confidence: this.buildConfidence(topEntries),
            alternatives: alternatives.map(entry => ({
                label: entry.label,
                score: Math.round((entry.value || 0) * 100)
            })),
            scores: Object.fromEntries(Object.entries(scores).map(([label, value]) => [label, Math.round(this.clamp01(value) * 100)]))
        };
    }

    buildHeuristicTrace(entity, _gameState, features) {
        const heuristicPolicies = this.buildHeuristicPolicies(entity, features);
        const policySources = {
            actionFamily: 'heuristic',
            targetPreference: 'heuristic',
            signalChoice: 'heuristic',
            riskPosture: 'heuristic',
            autobattlePosture: 'heuristic'
        };
        const traces = {
            actionFamily: this.buildPolicyTrace('actionFamily', heuristicPolicies.actionFamily, policySources.actionFamily),
            targetPreference: this.buildPolicyTrace('targetPreference', heuristicPolicies.targetPreference, policySources.targetPreference),
            signalChoice: this.buildPolicyTrace('signalChoice', heuristicPolicies.signalChoice, policySources.signalChoice),
            riskPosture: this.buildPolicyTrace('riskPosture', heuristicPolicies.riskPosture, policySources.riskPosture),
            autobattlePosture: this.buildPolicyTrace('autobattlePosture', heuristicPolicies.autobattlePosture, policySources.autobattlePosture)
        };
        return {
            schemaVersion: this.modelConfig.traceSchemaVersion,
            entityId: entity.id,
            updatedAtSeconds: this.simulationClockSeconds,
            source: 'heuristic',
            modelVersionId: this.modelConfig.modelVersionId,
            runtime: 'heuristic-corpus-baseline',
            modelAvailable: false,
            policySources,
            chosenPath: {
                actionFamily: traces.actionFamily.chosen,
                targetPreference: traces.targetPreference.chosen,
                signalChoice: traces.signalChoice.chosen,
                riskPosture: traces.riskPosture.chosen,
                autobattlePosture: traces.autobattlePosture.chosen
            },
            traces
        };
    }

    buildReviewedLabels(baseLabels = {}, reviewedLabels = {}) {
        const trainingLabels = {
            ...(baseLabels || {})
        };
        const corrections = {};
        for (const [policyName, nextLabel] of Object.entries(reviewedLabels || {})) {
            if (!nextLabel) continue;
            const previousLabel = trainingLabels[policyName] || null;
            if (previousLabel !== nextLabel) {
                corrections[policyName] = {
                    from: previousLabel,
                    to: nextLabel
                };
            }
            trainingLabels[policyName] = nextLabel;
        }
        return {
            trainingLabels,
            corrections,
            correctedPolicies: Object.keys(corrections)
        };
    }

    buildCorpusFeatureSnapshot(features = {}) {
        return {
            schemaVersion: features?.schemaVersion || this.modelConfig.featureSchemaVersion,
            vectorLength: Number.isFinite(features?.vectorLength) ? features.vectorLength : null,
            flatFeatureCount: Number.isFinite(features?.flatFeatureCount) ? features.flatFeatureCount : Object.keys(features?.flatFeatures || {}).length,
            groupCount: Object.keys(features?.groups || {}).length,
            groups: this.cloneValue(features?.groups, {}),
            flatFeatures: this.cloneValue(features?.flatFeatures, {})
        };
    }

    buildCorpusTelemetrySnapshot() {
        return {
            pressure: this.cloneValue(telemetrySystem?.getPressureProfile?.(), null),
            ecology: this.cloneValue(telemetrySystem?.getEcologyProfile?.(), null)
        };
    }

    getSourceLabel(source = 'heuristic-fallback') {
        if (source === 'ml') return 'ML';
        if (source === 'heuristic') return 'Heuristic';
        return 'FB';
    }

    getConfidenceLabel(confidence = {}) {
        const score = Math.max(0, Math.round(confidence?.score || 0));
        const band = confidence?.band || 'low';
        return `${score} ${band}`;
    }

    buildPolicySummary(trace = null) {
        if (!trace) {
            return {
                label: 'none',
                source: 'heuristic-fallback',
                sourceLabel: 'FB',
                confidence: 0,
                confidenceBand: 'low',
                uncertainty: true,
                confidenceLabel: '0 low',
                alternatives: [],
                alternativeLabels: [],
                primaryAlternative: null,
                compact: 'none FB | 0 low'
            };
        }

        const alternatives = (trace.alternatives || []).map(entry => ({
            label: entry.label,
            score: Math.max(0, Math.round(entry.score || 0))
        }));
        const sourceLabel = this.getSourceLabel(trace.source);
        const confidenceLabel = this.getConfidenceLabel(trace.confidence);
        const compact = `${trace.chosen || 'none'} ${sourceLabel} | ${confidenceLabel}`
            + (alternatives.length ? ` | next ${alternatives.map(entry => `${entry.label} ${entry.score}`).join(', ')}` : '');

        return {
            label: trace.chosen || 'none',
            source: trace.source || 'heuristic-fallback',
            sourceLabel,
            confidence: Math.max(0, Math.round(trace.confidence?.score || 0)),
            confidenceBand: trace.confidence?.band || 'low',
            uncertainty: !!trace.confidence?.uncertainty,
            confidenceLabel,
            alternatives,
            alternativeLabels: alternatives.map(entry => entry.label),
            primaryAlternative: alternatives[0] || null,
            compact
        };
    }

    buildHistoryEntry(trace) {
        const action = this.buildPolicySummary(trace?.traces?.actionFamily);
        const target = this.buildPolicySummary(trace?.traces?.targetPreference);
        const signal = this.buildPolicySummary(trace?.traces?.signalChoice);
        const risk = this.buildPolicySummary(trace?.traces?.riskPosture);
        const battle = this.buildPolicySummary(trace?.traces?.autobattlePosture);
        const sourceLabel = this.getSourceLabel(trace?.source);
        const actionAlt = action.primaryAlternative ? ` > ${action.primaryAlternative.label}` : '';
        const updatedAtFrame = Number.isFinite(trace?.updatedAtFrame) ? Math.max(0, Math.round(trace.updatedAtFrame)) : null;
        const outcomeDelayFrames = this.getOutcomeWindowDelayFrames();
        return {
            atSeconds: Number(trace?.updatedAtSeconds || 0),
            atFrame: updatedAtFrame,
            outcomeDueFrame: updatedAtFrame == null ? null : updatedAtFrame + outcomeDelayFrames,
            outcomeWindow: null,
            zoneId: trace?.zoneId || null,
            boardPos: this.cloneValue(trace?.boardPos || null, null),
            source: trace?.source || 'heuristic-fallback',
            sourceLabel,
            action: action.label,
            target: target.label,
            signal: signal.label,
            risk: risk.label,
            battle: battle.label,
            confidence: action.confidence,
            confidenceBand: action.confidenceBand,
            compact: `${sourceLabel} ${action.label} > ${target.label}${actionAlt} | ${signal.label} | ${risk.label} | ${action.confidenceLabel}`
        };
    }

    buildHistoryKey(trace) {
        if (!trace) return 'none';
        return [
            trace.source || 'heuristic-fallback',
            trace.chosenPath?.actionFamily || 'none',
            trace.chosenPath?.targetPreference || 'none',
            trace.chosenPath?.signalChoice || 'quiet',
            trace.chosenPath?.riskPosture || 'observe',
            trace.chosenPath?.autobattlePosture || 'stabilize'
        ].join('|');
    }

    pushDecisionHistory(runtime, trace) {
        if (!runtime || !trace) return;
        const historyKey = this.buildHistoryKey(trace);
        if (runtime.lastHistoryKey === historyKey) return;
        runtime.lastHistoryKey = historyKey;
        runtime.decisionHistory = Array.isArray(runtime.decisionHistory) ? runtime.decisionHistory : [];
        const entry = this.buildHistoryEntry(trace);
        runtime.decisionHistory.unshift(entry);
        while (runtime.decisionHistory.length > this.modelConfig.decisionHistoryLimit) {
            runtime.decisionHistory.pop();
        }
        if (Number.isFinite(entry?.outcomeDueFrame)) {
            runtime.nextOutcomeDueFrame = Number.isFinite(runtime.nextOutcomeDueFrame)
                ? Math.min(runtime.nextOutcomeDueFrame, entry.outcomeDueFrame)
                : entry.outcomeDueFrame;
        }
    }

    buildOutcomeBoardPos(entity) {
        const boardPos = entity?.boardPos || null;
        if (boardPos) {
            return {
                u: this.roundTraceNumber(boardPos.u ?? boardPos.x),
                v: this.roundTraceNumber(boardPos.v ?? boardPos.y),
                h: this.roundTraceNumber(boardPos.h || 0)
            };
        }
        if (typeof renderManager?.screenToBoard === 'function') {
            const projected = renderManager.screenToBoard(entity?.x || 0, entity?.y || 0, entity?.currentZoneId || null);
            return {
                u: this.roundTraceNumber(projected?.u ?? projected?.x),
                v: this.roundTraceNumber(projected?.v ?? projected?.y),
                h: this.roundTraceNumber(projected?.h || 0)
            };
        }
        return {
            u: this.roundTraceNumber(entity?.gridPos?.x ?? entity?.x ?? 0),
            v: this.roundTraceNumber(entity?.gridPos?.y ?? entity?.y ?? 0),
            h: 0
        };
    }

    buildOutcomeWindow(entity, entry, currentFrame) {
        const safeCurrentFrame = Math.max(0, Math.round(currentFrame || 0));
        const lifeSim = entity?.lifeSim || {};
        const behaviorBiases = lifeSim.derived?.behaviorBiases || {};
        const emotions = lifeSim.emotions || {};
        const drives = lifeSim.drives || {};
        const social = lifeSim.social || {};
        const boardPos = this.buildOutcomeBoardPos(entity);
        const dominantDrive = Object.entries(drives)
            .filter(([, value]) => Number.isFinite(Number(value)))
            .sort((left, right) => Number(right[1]) - Number(left[1]))[0]?.[0] || null;
        const dominantEmotion = Object.entries(emotions)
            .filter(([, value]) => Number.isFinite(Number(value)))
            .sort((left, right) => Number(right[1]) - Number(left[1]))[0]?.[0] || null;
        const currentFamily = entity?.state || lifeSim.objectAwareness?.currentAffordance || 'normal';

        return {
            schemaVersion: 'p8-outcome-window-v1',
            capturedAtFrame: safeCurrentFrame,
            elapsedFrames: Math.max(0, safeCurrentFrame - Math.max(0, Math.round(entry?.atFrame || 0))),
            zoneId: entity?.currentZoneId || lifeSim.lifecycle?.currentZoneId || null,
            boardPos,
            alive: entity?.isDead !== true && entity?.dead !== true,
            state: currentFamily,
            action: {
                chosenFamily: entry?.action || null,
                currentFamily,
                retainedFamily: !entry?.action || currentFamily === entry.action
            },
            object: {
                focusType: lifeSim.objectAwareness?.focusType || null,
                affordance: lifeSim.objectAwareness?.currentAffordance || null,
                carryingType: entity?.blockInteraction?.carryingBlockId ? 'block' : null
            },
            social: {
                activeContext: social.activeContext || null,
                dominantDrive,
                dominantEmotion,
                socialConnection: this.roundTraceNumber(behaviorBiases.socialConnection ?? behaviorBiases.socialConfidence ?? 0),
                attachment: this.roundTraceNumber(emotions.attachment ?? 0),
                threat: this.roundTraceNumber(emotions.threat ?? 0)
            },
            movement: {
                zoneChanged: !!entry?.zoneId && entry.zoneId !== (entity?.currentZoneId || null),
                zoneTravelActive: !!entity?.zoneTravel?.targetZoneId,
                wanderScale: this.roundTraceNumber(behaviorBiases.wanderScale ?? 0)
            }
        };
    }

    populateOutcomeWindows(gameState, currentFrame = this.frameCounter) {
        if (!this.isOutcomeWindowCaptureEnabled()) return 0;
        const safeCurrentFrame = Math.max(0, Math.round(currentFrame || 0));
        const dueRuntimes = [...this.runtimeByEntityId.values()].filter(runtime =>
            Number.isFinite(runtime?.nextOutcomeDueFrame)
            && safeCurrentFrame >= runtime.nextOutcomeDueFrame
        );
        if (!dueRuntimes.length) return 0;

        const entitiesById = new Map(this.getLiveEntities(gameState).map(entity => [entity.id, entity]));
        let populatedCount = 0;
        for (const runtime of dueRuntimes) {
            const entity = entitiesById.get(runtime?.entityId);
            if (!entity || !Array.isArray(runtime?.decisionHistory)) {
                runtime.nextOutcomeDueFrame = null;
                continue;
            }
            let nextDueFrame = Infinity;
            for (const entry of runtime.decisionHistory) {
                if (entry?.outcomeWindow || !Number.isFinite(entry?.outcomeDueFrame)) continue;
                if (safeCurrentFrame < entry.outcomeDueFrame) continue;
                entry.outcomeWindow = this.buildOutcomeWindow(entity, entry, safeCurrentFrame);
                populatedCount += 1;
            }
            for (const entry of runtime.decisionHistory) {
                if (!entry?.outcomeWindow && Number.isFinite(entry?.outcomeDueFrame)) {
                    nextDueFrame = Math.min(nextDueFrame, entry.outcomeDueFrame);
                }
            }
            runtime.nextOutcomeDueFrame = Number.isFinite(nextDueFrame) ? nextDueFrame : null;
        }
        return populatedCount;
    }

    getBattleParticipantPolicyTrace(participant, snapshot, gameState = gameCore?.gameState) {
        const traceStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const features = this.buildBattleParticipantFeatureBundle(participant, snapshot, gameState);
        const heuristicScores = this.buildHeuristicPolicies(null, features).autobattlePosture;
        const artifactPolicy = this.modelRuntime.modelArtifact?.policies?.autobattlePosture || null;
        let resolvedScores = heuristicScores;
        let source = 'heuristic-fallback';

        if (this.modelConfig.useModelInference && artifactPolicy && this.modelRuntime.modelAvailable) {
            try {
                resolvedScores = this.scoreLinearPolicy(artifactPolicy, features.flatFeatures);
                source = 'ml';
            } catch (error) {
                this.modelRuntime.lastInferenceError = String(error?.message || error);
                this.modelRuntime.fallbackCount += 1;
            }
        } else if (this.modelConfig.useModelInference) {
            this.modelRuntime.fallbackCount += 1;
        }

        const trace = {
            ...this.buildPolicyTrace('autobattlePosture', resolvedScores, source),
            modelVersionId: this.modelConfig.modelVersionId,
            backend: this.modelRuntime.backend || this.modelConfig.runtime,
            sourceLabel: source === 'ml' ? 'ML' : 'FB'
        };
        const totalMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - traceStart;
        telemetrySystem?.recordMlRuntimeSample?.(gameState, {
            mode: 'battle-policy',
            totalMs,
            battleDecisionCount: 1,
            mlPolicyCount: source === 'ml' ? 1 : 0,
            fallbackPolicyCount: source === 'ml' ? 0 : 1,
            modelAvailable: this.modelRuntime.modelAvailable,
            modelLoaded: this.modelRuntime.modelLoaded,
            useModelInference: this.modelConfig.useModelInference,
            lastDecisionSource: source,
            gardenCadenceFrames: this.modelConfig.gardenCadenceFrames,
            battleCadenceFrames: this.modelConfig.battleCadenceFrames,
            budgetTargets: this.getBudgetTargets()
        });
        return trace;
    }

    getBattleParticipantHeuristicTrace(participant, snapshot, gameState = gameCore?.gameState) {
        const features = this.buildBattleParticipantFeatureBundle(participant, snapshot, gameState);
        return {
            ...this.buildPolicyTrace('autobattlePosture', this.buildHeuristicPolicies(null, features).autobattlePosture, 'heuristic'),
            modelVersionId: this.modelConfig.modelVersionId,
            backend: 'heuristic-corpus-baseline',
            sourceLabel: 'Heuristic'
        };
    }

    getBattleParticipantDecision(participant, snapshot, gameState = gameCore?.gameState) {
        const trace = this.getBattleParticipantPolicyTrace(participant, snapshot, gameState);
        return {
            source: trace.source,
            sourceLabel: trace.sourceLabel,
            label: trace.chosen,
            confidence: trace.confidence?.score || 0,
            confidenceBand: trace.confidence?.band || 'low',
            uncertainty: !!trace.confidence?.uncertainty,
            alternatives: (trace.alternatives || []).map(entry => entry.label),
            backend: trace.backend || this.modelConfig.runtime,
            modelVersionId: trace.modelVersionId || this.modelConfig.modelVersionId,
            trace
        };
    }

    buildCorpusRecord(entityId, gameState = gameCore?.gameState, options = {}) {
        const entity = typeof entityId === 'object' ? entityId : this.getLiveEntityById(entityId, gameState);
        if (!entity?.id) return null;

        const behaviorRuntime = behaviorSystem?.getRuntime?.(entity.id) || null;
        const runtime = this.registerEntity(entity);
        const contextSignature = this.computeContextSignature(entity, gameState, behaviorRuntime);
        this.populateOutcomeWindows(gameState, this.frameCounter);
        this.refreshEntityTrace(entity, gameState, runtime, contextSignature, behaviorRuntime);
        this.populateOutcomeWindows(gameState, this.frameCounter);

        const activeTrace = this.cloneValue(runtime?.trace, null);
        const features = this.cloneValue(runtime?.features, null);
        const decisionHistory = this.cloneValue(runtime?.decisionHistory || [], []);
        const outcomeWindowCount = decisionHistory.filter(entry => !!entry?.outcomeWindow).length;
        if (!activeTrace || !features) return null;

        const heuristicTrace = this.buildHeuristicTrace(entity, gameState, features);
        const reviewedLabels = options?.review?.correctedLabels || options?.correctedLabels || {};
        const labelResolution = this.buildReviewedLabels(heuristicTrace?.chosenPath || {}, reviewedLabels);
        const reviewStatus = labelResolution.correctedPolicies.length
            ? 'corrected'
            : Object.keys(reviewedLabels).length
                ? 'reviewed-match'
                : 'unreviewed';
        const runtimeSummary = this.getRuntimeSummary();
        const migration = entity?.lifeSim?.derived?.migration || entity?.lifeSim?.migration || {};
        const record = {
            schemaVersion: 'c2-trace-corpus-record-v1',
            recordKind: 'garden',
            scenarioId: options.scenarioId || `entity-${entity.id}`,
            scenarioFamily: options.scenarioFamily || 'garden',
            auditPhase: options.auditPhase || null,
            tags: Array.isArray(options.tags) ? options.tags.filter(Boolean) : [],
            generatedAtFrame: this.frameCounter,
            generatedAtSeconds: this.simulationClockSeconds,
            entityId: entity.id,
            entityType: entity?.lifeSim?.identity?.entityType || entity?.constructor?.name || 'entity',
            zoneId: entity?.currentZoneId || entity?.lifeSim?.lifecycle?.currentZoneId || null,
            battleMode: features?.groups?.world?.battleMode || 'garden',
            contextSignature,
            featureSchemaVersion: features?.schemaVersion || this.modelConfig.featureSchemaVersion,
            traceSchemaVersion: activeTrace?.schemaVersion || this.modelConfig.traceSchemaVersion,
            activeTrace,
            heuristicTrace,
            decisionHistory,
            trainingLabels: this.cloneValue(labelResolution.trainingLabels, {}),
            review: {
                status: reviewStatus,
                rationale: options?.review?.rationale || null,
                correctedPolicies: labelResolution.correctedPolicies,
                corrections: this.cloneValue(labelResolution.corrections, {})
            },
            features: this.buildCorpusFeatureSnapshot(features),
            runtimeSummary,
            telemetry: this.buildCorpusTelemetrySnapshot(),
            entitySnapshot: {
                birthSource: entity?.birthSource || entity?.lifeSim?.identity?.source || 'wild',
                activeContext: entity?.lifeSim?.social?.activeContext || 'wandering',
                currentActionFamily: features?.groups?.behavior?.currentActionFamily || 'idle',
                focusType: features?.groups?.objectAwareness?.focusType || 'none',
                homeZoneId: migration?.homeZoneId || null,
                travelTargetZoneId: migration?.travelTargetZoneId || entity?.zoneTravel?.targetZoneId || null,
                travelIntent: migration?.travelIntent || entity?.zoneTravel?.reason || null
            }
        };

        telemetrySystem?.recordMlCorpusSample?.({
            scenarioId: record.scenarioId,
            scenarioFamily: record.scenarioFamily,
            auditPhase: record.auditPhase,
            recordKind: record.recordKind,
            entityId: record.entityId,
            entityType: record.entityType,
            zoneId: record.zoneId,
            battleMode: record.battleMode,
            activeSource: activeTrace?.source || runtimeSummary?.lastDecisionSource || null,
            heuristicSource: heuristicTrace?.source || 'heuristic',
            reviewStatus,
            correctedPolicies: labelResolution.correctedPolicies,
            corrections: labelResolution.corrections,
            featureSchemaVersion: record.featureSchemaVersion,
            traceSchemaVersion: record.traceSchemaVersion,
            outcomeWindowCount,
            tags: record.tags,
            trainingLabels: record.trainingLabels
        });

        return this.cloneValue(record, null);
    }

    buildBattleCorpusRecord(participantOrId, snapshot, gameState = gameCore?.gameState, options = {}) {
        const participant = typeof participantOrId === 'string'
            ? snapshot?.participantsById?.[participantOrId] || null
            : participantOrId;
        if (!participant?.id || !snapshot) return null;

        const features = this.buildBattleParticipantFeatureBundle(participant, snapshot, gameState);
        const activeTrace = this.getBattleParticipantPolicyTrace(participant, snapshot, gameState);
        const heuristicTrace = this.getBattleParticipantHeuristicTrace(participant, snapshot, gameState);
        const reviewedLabels = options?.review?.correctedLabels || options?.correctedLabels || {};
        const labelResolution = this.buildReviewedLabels(
            { autobattlePosture: heuristicTrace?.chosen || 'stabilize' },
            reviewedLabels
        );
        const reviewStatus = labelResolution.correctedPolicies.length
            ? 'corrected'
            : Object.keys(reviewedLabels).length
                ? 'reviewed-match'
                : 'unreviewed';
        const runtimeSummary = this.getRuntimeSummary();
        const record = {
            schemaVersion: 'c2-trace-corpus-record-v1',
            recordKind: 'battle',
            scenarioId: options.scenarioId || `battle-${snapshot?.battleId || participant.id}`,
            scenarioFamily: options.scenarioFamily || 'autobattle',
            auditPhase: options.auditPhase || null,
            tags: Array.isArray(options.tags) ? options.tags.filter(Boolean) : [],
            generatedAtFrame: this.frameCounter,
            generatedAtSeconds: this.simulationClockSeconds,
            entityId: participant.id,
            entityType: participant?.entityType || 'butterfly',
            zoneId: participant?.zoneId || null,
            battleMode: 'battle',
            battleId: snapshot?.battleId || null,
            teamId: participant?.teamId || null,
            featureSchemaVersion: features?.schemaVersion || this.modelConfig.featureSchemaVersion,
            traceSchemaVersion: this.modelConfig.traceSchemaVersion,
            activeTrace: this.cloneValue(activeTrace, null),
            heuristicTrace: this.cloneValue(heuristicTrace, null),
            trainingLabels: this.cloneValue(labelResolution.trainingLabels, {}),
            review: {
                status: reviewStatus,
                rationale: options?.review?.rationale || null,
                correctedPolicies: labelResolution.correctedPolicies,
                corrections: this.cloneValue(labelResolution.corrections, {})
            },
            features: this.buildCorpusFeatureSnapshot(features),
            runtimeSummary,
            telemetry: this.buildCorpusTelemetrySnapshot(),
            entitySnapshot: {
                hp: participant?.hp || 0,
                maxHp: participant?.maxHp || participant?.hp || 0,
                pressure: participant?.pressure || 0,
                actionFamily: participant?.actionFamily || 'battlePosture',
                targetId: participant?.targetId || null
            }
        };

        telemetrySystem?.recordMlCorpusSample?.({
            scenarioId: record.scenarioId,
            scenarioFamily: record.scenarioFamily,
            auditPhase: record.auditPhase,
            recordKind: record.recordKind,
            entityId: record.entityId,
            entityType: record.entityType,
            zoneId: record.zoneId,
            battleMode: record.battleMode,
            activeSource: activeTrace?.source || runtimeSummary?.lastDecisionSource || null,
            heuristicSource: heuristicTrace?.source || 'heuristic',
            reviewStatus,
            correctedPolicies: labelResolution.correctedPolicies,
            corrections: labelResolution.corrections,
            featureSchemaVersion: record.featureSchemaVersion,
            traceSchemaVersion: record.traceSchemaVersion,
            tags: record.tags,
            trainingLabels: record.trainingLabels
        });

        return this.cloneValue(record, null);
    }

    buildTrace(entity, _gameState, features, runtime = null, options = {}) {
        const modelPolicies = this.buildModelPolicies(features, _gameState, runtime, options);
        const gardenMode = features?.groups?.world?.battleMode !== 'battle';
        const requestedModelPolicies = this.getRequestedModelPoliciesForMode(gardenMode);
        const hasFullGardenWorkerCoverage = this.isWorkerOffloadEnabled()
            && gardenMode
            && requestedModelPolicies.length > 0
            && requestedModelPolicies.every(policyName => !!modelPolicies?.[policyName]);
        const heuristicPolicies = hasFullGardenWorkerCoverage
            ? {
                autobattlePosture: this.buildHeuristicAutobattlePolicy(features)
            }
            : this.buildHeuristicPolicies(entity, features);
        const modelPolicyTraces = runtime?.lastModelPolicyTraces || options?.modelPolicyTracesOverride || null;
        const traces = {
            actionFamily: modelPolicies?.actionFamily
                ? this.buildPreparedPolicyTrace('actionFamily', modelPolicyTraces?.actionFamily, modelPolicies.actionFamily, 'ml')
                : this.buildPolicyTrace('actionFamily', heuristicPolicies.actionFamily, 'heuristic-fallback'),
            targetPreference: modelPolicies?.targetPreference
                ? this.buildPreparedPolicyTrace('targetPreference', modelPolicyTraces?.targetPreference, modelPolicies.targetPreference, 'ml')
                : this.buildPolicyTrace('targetPreference', heuristicPolicies.targetPreference, 'heuristic-fallback'),
            signalChoice: modelPolicies?.signalChoice
                ? this.buildPreparedPolicyTrace('signalChoice', modelPolicyTraces?.signalChoice, modelPolicies.signalChoice, 'ml')
                : this.buildPolicyTrace('signalChoice', heuristicPolicies.signalChoice, 'heuristic-fallback'),
            riskPosture: modelPolicies?.riskPosture
                ? this.buildPreparedPolicyTrace('riskPosture', modelPolicyTraces?.riskPosture, modelPolicies.riskPosture, 'ml')
                : this.buildPolicyTrace('riskPosture', heuristicPolicies.riskPosture, 'heuristic-fallback'),
            autobattlePosture: modelPolicies?.autobattlePosture
                ? this.buildPreparedPolicyTrace('autobattlePosture', modelPolicyTraces?.autobattlePosture, modelPolicies.autobattlePosture, 'ml')
                : this.buildPolicyTrace('autobattlePosture', heuristicPolicies.autobattlePosture, 'heuristic-fallback')
        };
        const policySources = {
            actionFamily: traces.actionFamily.source || 'heuristic-fallback',
            targetPreference: traces.targetPreference.source || 'heuristic-fallback',
            signalChoice: traces.signalChoice.source || 'heuristic-fallback',
            riskPosture: traces.riskPosture.source || 'heuristic-fallback',
            autobattlePosture: traces.autobattlePosture.source || 'heuristic-fallback'
        };

        const source = policySources.actionFamily === 'ml'
            || policySources.targetPreference === 'ml'
            || policySources.signalChoice === 'ml'
            || policySources.riskPosture === 'ml'
            || policySources.autobattlePosture === 'ml'
            ? 'ml'
            : 'heuristic-fallback';
        const missingModelPolicies = requestedModelPolicies.filter(policyName => policySources[policyName] !== 'ml');
        if (missingModelPolicies.length > 0) {
            this.modelRuntime.fallbackCount += 1;
        }
        this.modelRuntime.lastDecisionSource = source;

        return {
            schemaVersion: this.modelConfig.traceSchemaVersion,
            entityId: entity.id,
            updatedAtSeconds: this.simulationClockSeconds,
            updatedAtFrame: Number.isFinite(options?.currentFrame) ? Math.max(0, Math.round(options.currentFrame)) : this.frameCounter,
            zoneId: entity?.currentZoneId || entity?.lifeSim?.lifecycle?.currentZoneId || null,
            boardPos: this.buildOutcomeBoardPos(entity),
            source,
            modelVersionId: this.modelConfig.modelVersionId,
            runtime: this.modelConfig.runtime,
            modelAvailable: !!this.modelRuntime.modelAvailable,
            modelPolicyFreshness: this.buildModelPolicyFreshness(runtime, options?.currentFrame),
            policySources,
            chosenPath: {
                actionFamily: traces.actionFamily.chosen,
                targetPreference: traces.targetPreference.chosen,
                signalChoice: traces.signalChoice.chosen,
                riskPosture: traces.riskPosture.chosen,
                autobattlePosture: traces.autobattlePosture.chosen
            },
            traces
        };
    }

    refreshEntityTrace(entity, gameState, runtime, contextSignature, behaviorRuntime, options = {}) {
        const features = options?.prebuiltFeatures || this.buildFeatureGroups(entity, gameState, behaviorRuntime);
        const trace = this.buildTrace(entity, gameState, features, runtime, options);
        runtime.entityType = entity?.lifeSim?.identity?.entityType || entity?.constructor?.name || 'entity';
        runtime.lastTraceAtFrame = this.frameCounter;
        runtime.lastTraceAtGameFrame = Number.isFinite(options?.currentFrame)
            ? Math.max(0, Math.round(options.currentFrame))
            : this.frameCounter;
        runtime.lastContextSignature = contextSignature;
        runtime.cadenceIntervalFrames = Math.max(1, Math.round(options?.cadenceIntervalFrames || runtime.cadenceIntervalFrames || 1));
        runtime.cadenceOffset = Math.max(0, Math.round(
            Number.isFinite(options?.cadenceOffset)
                ? options.cadenceOffset
                : (runtime.cadenceOffset || 0)
        ));
        runtime.features = features;
        runtime.trace = trace;
        this.pushDecisionHistory(runtime, trace);
        return runtime;
    }

    update(gameState, deltaSeconds = gameConfig?.simulation?.fixedDeltaSeconds || (1 / 60), options = {}) {
        if (!this.initialized) return null;
        if (this.modelConfig.useModelInference && !this.modelRuntime.modelLoaded && !this.modelRuntime.loadAttempted) {
            void this.loadModelArtifact();
        }
        const cadence = this.getCadenceConfig(gameState, options);
        this.simulationClockSeconds += deltaSeconds;
        this.frameCounter = Number.isFinite(options?.currentFrame)
            ? cadence.currentFrame
            : (this.frameCounter + 1);
        const updateStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        let refreshedTraceCount = 0;
        let cadenceSkippedCount = 0;
        let forcedRefreshCount = 0;
        let mlPolicyCount = 0;
        let fallbackPolicyCount = 0;
        let workerBatchEligibleCount = 0;
        let workerBatchQueued = 0;
        let outcomeWindowCount = 0;
        const battleBypassed = !!(options?.cadenceEnabled && cadence.viewMode === 'battle' && cadence.battleBypass);

        if (!battleBypassed) {
            const refreshEntries = [];
            for (const entity of this.getLiveEntities(gameState)) {
                const runtime = this.registerEntity(entity);
                const behaviorRuntime = behaviorSystem?.getRuntime?.(entity.id) || null;
                const refreshState = this.shouldRefreshTrace(entity, runtime, gameState, behaviorRuntime, cadence);
                if (!refreshState.refresh) {
                    if (cadence.enabled) cadenceSkippedCount += 1;
                    continue;
                }
                refreshEntries.push({
                    entity,
                    runtime,
                    behaviorRuntime,
                    refreshState,
                    features: this.buildFeatureGroups(entity, gameState, behaviorRuntime)
                });
            }

            const workerBatchEligible = refreshEntries.filter((entry) => entry?.features?.groups?.world?.battleMode !== 'battle');
            workerBatchEligibleCount = workerBatchEligible.length;
            if (
                this.isWorkerOffloadEnabled()
                && workerBatchEligible.length > 0
                && !this.workerOffload.lastError
            ) {
                const host = this.ensureWorkerOffloadHost();
                const modelVersionId = this.modelRuntime.modelArtifact?.modelVersionId || this.modelConfig.modelVersionId || null;
                if (!host || !modelVersionId) {
                    // Keep the main thread on the current safe path until the worker seam is truly ready.
                } else if (this.workerOffload.syncedModelVersionId !== modelVersionId) {
                    void this.syncWorkerModelArtifact();
                } else {
                    if (this.queueWorkerModelPoliciesBatch(workerBatchEligible, {
                        currentFrame: cadence.currentFrame
                    })) {
                        workerBatchQueued = workerBatchEligible.length;
                    }
                }
            }

            for (const entry of refreshEntries) {
                if (this.shouldDeferWorkerRefresh(entry, workerBatchQueued)) {
                    this.queueDeferredWorkerRefresh(entry.runtime, entry, cadence.currentFrame);
                    continue;
                }
                this.refreshEntityTrace(
                    entry.entity,
                    gameState,
                    entry.runtime,
                    entry.refreshState.contextSignature,
                    entry.behaviorRuntime,
                    {
                        currentFrame: cadence.currentFrame,
                        cadenceIntervalFrames: entry.refreshState.cadenceIntervalFrames,
                        cadenceOffset: entry.refreshState.cadenceOffset,
                        prebuiltFeatures: entry.features
                    }
                );
                refreshedTraceCount += 1;
                if (entry.refreshState.forced) forcedRefreshCount += 1;
                for (const source of Object.values(entry.runtime?.trace?.policySources || {})) {
                    if (source === 'ml') {
                        mlPolicyCount += 1;
                    } else if (source) {
                        fallbackPolicyCount += 1;
                    }
                }
            }
        }
        outcomeWindowCount = this.populateOutcomeWindows(gameState, this.frameCounter);

        const totalMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - updateStart;
        telemetrySystem?.recordMlRuntimeSample?.(gameState, {
            mode: battleBypassed ? 'battle-bypass' : 'garden-update',
            totalMs,
            cadenceEnabled: cadence.enabled,
            cadenceIntervalFrames: cadence.enabled ? cadence.gardenIntervalFrames : cadence.legacyGardenIntervalFrames,
            cadenceFactor: cadence.cadenceFactor,
            refreshedTraceCount,
            cadenceSkippedCount,
            forcedRefreshCount,
            outcomeWindowCount,
            battleBypassed,
            mlPolicyCount,
            fallbackPolicyCount,
            modelAvailable: this.modelRuntime.modelAvailable,
            modelLoaded: this.modelRuntime.modelLoaded,
            useModelInference: this.modelConfig.useModelInference,
            workerOffloadEnabled: this.isWorkerOffloadEnabled(),
            workerOffloadReady: this.workerOffload.syncedModelVersionId === (this.modelRuntime.modelArtifact?.modelVersionId || this.modelConfig.modelVersionId || null),
            workerBatchPending: !!this.workerOffload.pendingBatch,
            workerBatchEligibleCount,
            workerBatchQueued,
            workerOffloadError: this.workerOffload.lastError || null,
            lastDecisionSource: this.modelRuntime.lastDecisionSource,
            gardenCadenceFrames: this.modelConfig.gardenCadenceFrames,
            cadenceFactor: this.modelConfig.cadenceFactor,
            battleCadenceFrames: this.modelConfig.battleCadenceFrames,
            budgetTargets: this.getBudgetTargets()
        });

        return {
            cadenceEnabled: cadence.enabled ? 1 : 0,
            cadenceIntervalFrames: cadence.enabled ? cadence.gardenIntervalFrames : cadence.legacyGardenIntervalFrames,
            refreshedTraceCount,
            cadenceSkippedCount,
            forcedRefreshCount,
            outcomeWindowCount,
            battleBypassed: battleBypassed ? 1 : 0,
            totalMs
        };
    }

    getEntityTrace(entityId) {
        const runtime = this.runtimeByEntityId.get(entityId);
        if (!runtime?.trace) return null;
        return {
            ...this.cloneValue(runtime.trace, {}),
            freshness: this.buildTraceFreshness(runtime)
        };
    }

    getEntityFeatures(entityId) {
        const runtime = this.runtimeByEntityId.get(entityId);
        return runtime?.features ? this.cloneValue(runtime.features) : null;
    }

    getRuntimeSummary() {
        return {
            runtime: this.modelConfig.runtime,
            backend: this.modelRuntime.backend || this.modelConfig.runtime || 'heuristic-fallback',
            useModelInference: !!this.modelConfig.useModelInference,
            modelVersionId: this.modelConfig.modelVersionId,
            featureSchemaVersion: this.modelConfig.featureSchemaVersion,
            traceSchemaVersion: this.modelConfig.traceSchemaVersion,
            policyArtifactPath: this.modelConfig.policyArtifactPath || null,
            policyArtifactFormat: this.modelRuntime.artifactFormat
                || this.modelConfig.policyArtifactFormat
                || this.modelConfig.contract?.currentArtifactFormat
                || null,
            gardenCadenceFrames: this.modelConfig.gardenCadenceFrames,
            cadenceFactor: this.modelConfig.cadenceFactor,
            battleCadenceFrames: this.modelConfig.battleCadenceFrames,
            alternativeCount: this.modelConfig.alternativeCount,
            decisionHistoryLimit: this.modelConfig.decisionHistoryLimit,
            contract: this.cloneValue(this.modelConfig.contract, {}),
            modelAvailable: !!this.modelRuntime.modelAvailable,
            modelLoaded: !!this.modelRuntime.modelLoaded,
            loadAttempted: !!this.modelRuntime.loadAttempted,
            loadedPolicies: this.cloneValue(this.modelRuntime.loadedPolicies, []),
            artifactSummary: this.buildModelArtifactSummary(),
            featureContract: this.getFeatureContractSnapshot(),
            performanceBudget: this.getBudgetTargets(),
            performanceProfile: telemetrySystem?.getMlRuntimeProfile?.() || null,
            schedulerCadenceIntervalFrames: Math.max(1, Math.round((gameConfig?.simulation?.cadence?.mlScoringIntervalFrames || 12) * (this.modelConfig.cadenceFactor || 1))),
            fallbackCount: Number(this.modelRuntime.fallbackCount || 0),
            lastDecisionSource: this.modelRuntime.lastDecisionSource || 'heuristic-fallback',
            lastLoadError: this.modelRuntime.lastLoadError || null,
            lastInferenceError: this.modelRuntime.lastInferenceError || null
        };
    }

    getEntitySummary(entityId, gameState = gameCore?.gameState) {
        const entity = this.getLiveEntities(gameState).find(entry => entry.id === entityId);
        if (entity && !this.runtimeByEntityId.has(entityId)) {
            const behaviorRuntime = behaviorSystem?.getRuntime?.(entity.id) || null;
            const runtime = this.registerEntity(entity);
            const contextSignature = this.computeContextSignature(entity, gameState, behaviorRuntime);
            this.refreshEntityTrace(entity, gameState, runtime, contextSignature, behaviorRuntime, {
                currentFrame: gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : this.frameCounter),
                cadenceIntervalFrames: runtime?.cadenceIntervalFrames || 1,
                cadenceOffset: runtime?.cadenceOffset || 0
            });
        }

        const trace = this.getEntityTrace(entityId);
        const features = this.getEntityFeatures(entityId);
        if (!trace || !features) return null;
        const runtime = this.runtimeByEntityId.get(entityId);
        const actionPolicy = this.buildPolicySummary(trace.traces?.actionFamily);
        const targetPolicy = this.buildPolicySummary(trace.traces?.targetPreference);
        const signalPolicy = this.buildPolicySummary(trace.traces?.signalChoice);
        const riskPolicy = this.buildPolicySummary(trace.traces?.riskPosture);
        const battlePolicy = this.buildPolicySummary(trace.traces?.autobattlePosture);
        const history = this.cloneValue(runtime?.decisionHistory || [], []);
        const runtimeSummary = this.getRuntimeSummary();
        const explainability = {
            action: this.buildPolicyHighlightSummary('actionFamily', trace.traces?.actionFamily, features),
            target: this.buildPolicyHighlightSummary('targetPreference', trace.traces?.targetPreference, features),
            signal: this.buildPolicyHighlightSummary('signalChoice', trace.traces?.signalChoice, features),
            risk: this.buildPolicyHighlightSummary('riskPosture', trace.traces?.riskPosture, features),
            battle: this.buildPolicyHighlightSummary('autobattlePosture', trace.traces?.autobattlePosture, features)
        };

        return {
            source: trace.source,
            sourceLabel: trace.source === 'ml' ? 'ML' : trace.source === 'heuristic-fallback' ? 'Fallback' : 'Heuristic',
            actionSource: trace.policySources?.actionFamily || trace.source,
            targetSource: trace.policySources?.targetPreference || trace.source,
            signalSource: trace.policySources?.signalChoice || trace.source,
            riskSource: trace.policySources?.riskPosture || trace.source,
            battleSource: trace.policySources?.autobattlePosture || trace.source,
            actionSourceLabel: (trace.policySources?.actionFamily || trace.source) === 'ml' ? 'ML' : 'FB',
            targetSourceLabel: (trace.policySources?.targetPreference || trace.source) === 'ml' ? 'ML' : 'FB',
            signalSourceLabel: (trace.policySources?.signalChoice || trace.source) === 'ml' ? 'ML' : 'FB',
            riskSourceLabel: (trace.policySources?.riskPosture || trace.source) === 'ml' ? 'ML' : 'FB',
            battleSourceLabel: (trace.policySources?.autobattlePosture || trace.source) === 'ml' ? 'ML' : 'FB',
            actionLabel: trace.chosenPath.actionFamily || 'none',
            targetLabel: trace.chosenPath.targetPreference || 'none',
            signalLabel: trace.chosenPath.signalChoice || 'quiet',
            riskLabel: trace.chosenPath.riskPosture || 'observe',
            battleLabel: trace.chosenPath.autobattlePosture || 'stabilize',
            confidence: trace.traces?.actionFamily?.confidence?.score || 0,
            confidenceBand: trace.traces?.actionFamily?.confidence?.band || 'low',
            uncertainty: !!trace.traces?.actionFamily?.confidence?.uncertainty,
            alternatives: (trace.traces?.actionFamily?.alternatives || []).map(entry => entry.label),
            backend: this.modelRuntime.backend || this.modelConfig.runtime,
            modelVersionId: trace.modelVersionId || this.modelConfig.modelVersionId,
            runtime: runtimeSummary,
            freshness: this.buildTraceFreshness(runtime),
            featureTrace: this.buildFeatureTraceSummary(features, trace),
            policies: {
                action: actionPolicy,
                target: targetPolicy,
                signal: signalPolicy,
                risk: riskPolicy,
                battle: battlePolicy
            },
            history,
            explainability,
            context: {
                dominantDrive: features.groups?.drives
                    ? Object.entries(features.groups.drives).sort((left, right) => right[1] - left[1])[0]?.[0] || 'rest'
                    : 'rest',
                dominantEmotion: features.groups?.emotions
                    ? Object.entries(features.groups.emotions).sort((left, right) => right[1] - left[1])[0]?.[0] || 'curiosity'
                    : 'curiosity',
                focusType: features.groups?.objectAwareness?.focusType || 'none',
                playerTrust: features.groups?.playerInteraction?.cursorTrust || 0,
                playerFear: features.groups?.playerInteraction?.cursorFear || 0,
                battleMode: features.groups?.world?.battleMode || 'garden'
            }
        };
    }

    getDecisionExplanation(entityId, gameState = gameCore?.gameState) {
        const summary = this.getEntitySummary(entityId, gameState);
        if (!summary) {
            return {
                source: 'heuristic-fallback',
                actionLabel: 'none',
                targetLabel: 'none',
                signalLabel: 'quiet',
                riskLabel: 'observe',
                confidenceBand: 'low',
                topAlternative: null,
                highestFeatureGroup: null,
                shortText: 'No decision trace yet'
            };
        }
        const action = summary.policies?.action || {};
        const target = summary.policies?.target || {};
        const signal = summary.policies?.signal || {};
        const risk = summary.policies?.risk || {};
        const highlights = [
            ...(summary.explainability?.action?.entries || []),
            ...(summary.explainability?.target?.entries || []),
            ...(summary.explainability?.signal?.entries || []),
            ...(summary.explainability?.risk?.entries || [])
        ].filter(Boolean);
        const strongest = highlights
            .sort((left, right) => Math.abs(right.contribution || 0) - Math.abs(left.contribution || 0))[0] || null;
        const alternative = action.primaryAlternative?.label || target.primaryAlternative?.label || null;
        const sourceLabel = summary.sourceLabel || 'Fallback';
        const shortText = [
            `${sourceLabel} chose ${summary.actionLabel || action.label || 'none'}`,
            `toward ${summary.targetLabel || target.label || 'none'}`,
            `signal ${summary.signalLabel || signal.label || 'quiet'}`,
            `risk ${summary.riskLabel || risk.label || 'observe'}`,
            `${summary.confidenceBand || action.confidenceBand || 'low'} confidence`
        ].join(' | ');
        return {
            source: summary.source || 'heuristic-fallback',
            sourceLabel,
            actionLabel: summary.actionLabel || action.label || 'none',
            targetLabel: summary.targetLabel || target.label || 'none',
            signalLabel: summary.signalLabel || signal.label || 'quiet',
            riskLabel: summary.riskLabel || risk.label || 'observe',
            confidenceBand: summary.confidenceBand || action.confidenceBand || 'low',
            confidence: summary.confidence || action.confidence || 0,
            topAlternative: alternative,
            highestFeatureGroup: strongest?.group || strongest?.feature || null,
            highestFeatureLabel: strongest?.label || strongest?.feature || null,
            shortText,
            debugText: strongest
                ? `${shortText} | strongest feature ${strongest.label || strongest.feature || strongest.group}`
                : shortText
        };
    }

    serializeDurableState() {
        return {
            modelConfig: this.cloneValue(this.modelConfig, {})
        };
    }

    deserializeDurableState(serialized = {}) {
        this.modelConfig = this.upgradeLegacyModelConfig(serialized?.modelConfig || {});
        this.modelRuntime = {
            ...this.createDefaultModelRuntime(),
            ...(serialized?.modelRuntime || {}),
            modelAvailable: false,
            modelLoaded: false
        };
        if (this.initialized && this.modelConfig.useModelInference) {
            void this.loadModelArtifact(true);
        }
    }
}

const mlInferenceSystem = new MlInferenceSystem();
