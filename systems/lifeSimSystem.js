class LifeSimSystem {
    constructor() {
        this.initialized = false;
        this.simulationClockSeconds = 0;
        this.runtimeState = new Map();
    }

    initialize() {
        this.initialized = true;
    }

    reset() {
        this.simulationClockSeconds = 0;
        this.runtimeState.clear();
    }

    clamp01(value) {
        return Math.max(0, Math.min(1, value ?? 0));
    }

    lerpValue(current, target, factor = 0.1) {
        const base = current ?? 0;
        return base + (target - base) * factor;
    }

    ensureLifeSimState(entity) {
        if (!entity?.lifeSim) return null;
        entity.lifeSim.drives = entity.lifeSim.drives || createDriveProfile();
        entity.lifeSim.emotions = entity.lifeSim.emotions || createEmotionProfile();
        entity.lifeSim.memories = entity.lifeSim.memories || createMemoryStore();
        entity.lifeSim.routines = entity.lifeSim.routines || createRoutineStore();
        entity.lifeSim.communication = entity.lifeSim.communication || createCommunicationProfile();
        entity.lifeSim.distortion = entity.lifeSim.distortion || createDistortionProfile();
        entity.lifeSim.social = entity.lifeSim.social || createSocialProfile();
        entity.lifeSim.derived = entity.lifeSim.derived || createDerivedLifeSimProfile();
        entity.lifeSim.playerInteraction = entity.lifeSim.playerInteraction || createPlayerInteractionProfile();
        entity.lifeSim.objectAwareness = entity.lifeSim.objectAwareness || createObjectAwarenessProfile();
        entity.lifeSim.spatialAwareness = entity.lifeSim.spatialAwareness || createSpatialAwarenessProfile();
        entity.lifeSim.progression = entity.lifeSim.progression || createProgressionContextProfile();
        entity.lifeSim.battleContext = entity.lifeSim.battleContext || createBattleContextProfile();
        entity.lifeSim.migration = entity.lifeSim.migration || createMigrationProfile();
        entity.lifeSim.upbringing = entity.lifeSim.upbringing || { imprintSources: [], lessons: [], routineReinforcement: {} };
        entity.lifeSim.interpretation = entity.lifeSim.interpretation || { clarity: 1, lastSignals: [], warpedSignals: 0 };
        entity.lifeSim.lifecycle = entity.lifeSim.lifecycle || createLifecycleProfile();
        return entity.lifeSim;
    }

    ensureRuntimeState(entityId) {
        if (!entityId) return null;
        let runtime = this.runtimeState.get(entityId);
        if (!runtime) {
            runtime = {
                cadenceOffset: null,
                lastDeepUpdateFrame: null,
                lastZoneId: null,
                lastState: null,
                pendingDeepRefresh: false,
                pendingRefreshReason: null
            };
            this.runtimeState.set(entityId, runtime);
        }
        return runtime;
    }

    requestDeepRefresh(entityId, reason = 'external-change') {
        const runtime = this.ensureRuntimeState(entityId);
        if (!runtime) return null;
        runtime.pendingDeepRefresh = true;
        runtime.pendingRefreshReason = reason || 'external-change';
        return runtime;
    }

    hashEntityKey(value) {
        const raw = String(value || '');
        let hash = 0;
        for (let index = 0; index < raw.length; index += 1) {
            hash = ((hash << 5) - hash) + raw.charCodeAt(index);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    getCadenceConfig(gameState = gameCore?.gameState, options = {}) {
        const enabled = !!(options.cadenceEnabled ?? gameConfig?.performance?.flags?.simCadenceSplit);
        const intervalFrames = Math.max(
            1,
            Math.round(options.intervalFrames ?? gameConfig?.simulation?.cadence?.lifeSimDeepIntervalFrames ?? 6)
        );
        const currentFrame = Number.isFinite(options.currentFrame)
            ? options.currentFrame
            : (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0));
        const battleBypass = options.battleBypass ?? (gameConfig?.simulation?.cadence?.lifeSimBattleBypass !== false);
        const zoneTravelBypass = options.zoneTravelBypass ?? (gameConfig?.simulation?.cadence?.lifeSimZoneTravelBypass !== false);
        return {
            enabled,
            intervalFrames,
            currentFrame,
            battleBypass,
            zoneTravelBypass,
            battleActive: !!(battleBypass && gameState?.viewMode === 'battle')
        };
    }

    getEntityCadenceOffset(entity, intervalFrames = 1) {
        if (intervalFrames <= 1) return 0;
        return this.hashEntityKey(entity?.id || entity?.name || entity?.personalityType || 'life-sim') % intervalFrames;
    }

    shouldRunButterflyDeepEvaluation(entity, gameState, cadence = this.getCadenceConfig(gameState)) {
        if (!entity?.id) {
            return {
                shouldDeepUpdate: true,
                forced: true,
                cadenceOffset: 0,
                zoneChanged: false,
                stateChanged: false,
                pendingRefresh: false
            };
        }
        const runtime = this.ensureRuntimeState(entity.id);
        const zoneId = this.getZoneId(entity);
        const currentState = entity?.state || 'normal';
        const urgentStateBypass = currentState === 'scared';
        const cadenceOffset = runtime?.cadenceOffset ?? this.getEntityCadenceOffset(entity, cadence.intervalFrames);
        if (runtime) {
            runtime.cadenceOffset = cadenceOffset;
        }

        const firstDeepUpdate = !Number.isFinite(runtime?.lastDeepUpdateFrame);
        const zoneChanged = runtime?.lastZoneId != null && runtime.lastZoneId !== zoneId;
        const stateChanged = runtime?.lastState != null && runtime.lastState !== currentState;
        const pendingRefresh = !!runtime?.pendingDeepRefresh;
        const forced = firstDeepUpdate
            || zoneChanged
            || stateChanged
            || pendingRefresh
            || urgentStateBypass
            || !!(cadence.zoneTravelBypass && entity?.zoneTravel)
            || !!cadence.battleActive;
        const cadenceMatch = !cadence.enabled
            || gameCore?.shouldRunCadencedSystem?.(
                'life-sim-deep-evaluation',
                cadence.intervalFrames,
                cadenceOffset,
                cadence.currentFrame
            );

        return {
            shouldDeepUpdate: forced || cadenceMatch,
            forced,
            cadenceOffset,
            zoneChanged,
            stateChanged,
            pendingRefresh
        };
    }

    pruneRuntimeState(liveEntityIds = []) {
        if (!this.runtimeState.size) return;
        const liveIdSet = new Set((liveEntityIds || []).filter(Boolean));
        if (!liveIdSet.size) {
            this.runtimeState.clear();
            return;
        }
        for (const entityId of this.runtimeState.keys()) {
            if (!liveIdSet.has(entityId)) {
                this.runtimeState.delete(entityId);
            }
        }
    }

    getLiveEntities(gameState = gameCore?.gameState) {
        return [
            ...(gameState?.butterflies || []),
            ...(gameState?.caterpillars || [])
        ].filter(entity => entity?.lifeSim);
    }

    getEntityById(entityId, gameState = gameCore?.gameState) {
        if (!entityId) return null;
        return this.getLiveEntities(gameState).find(entity => entity.id === entityId) || null;
    }

    getZoneId(entity) {
        return entity?.currentZoneId || entity?.lifeSim?.lifecycle?.currentZoneId || null;
    }

    getButterfliesInZone(zoneId, gameState = gameCore?.gameState) {
        if (gameState && gameCore && gameState === gameCore.gameState && typeof gameCore.getButterfliesInZone === 'function') {
            return gameCore.getButterfliesInZone(zoneId);
        }
        return (gameState?.butterflies || []).filter(entity => this.getZoneId(entity) === zoneId);
    }

    getFlowersInZone(zoneId, gameState = gameCore?.gameState) {
        return (gameState?.flowers || []).filter(entity => (entity?.currentZoneId || null) === zoneId);
    }

    getAverageEdgeValue(entity, keys = []) {
        const edges = Object.values(entity?.lifeSim?.socialEdges || {});
        if (!edges.length) return 0;
        let total = 0;
        let count = 0;
        for (const edge of edges) {
            for (const key of keys) {
                if (typeof edge?.[key] !== 'number') continue;
                total += edge[key];
                count++;
            }
        }
        return count ? total / count : 0;
    }

    getRoutineStrength(entity, family) {
        const routines = entity?.lifeSim?.routines?.[family];
        if (!Array.isArray(routines) || !routines.length) return 0;
        const total = routines.reduce((sum, routine) => sum + (routine?.strength || 0), 0);
        return total / routines.length;
    }

    getMemoryDensity(entity, family) {
        const memories = entity?.lifeSim?.memories?.[family];
        return Array.isArray(memories) ? memories.length : 0;
    }

    getCommunicationActivity(entity) {
        const communication = entity?.lifeSim?.communication;
        return {
            emitted: communication?.recentEmitted?.length || 0,
            received: communication?.recentReceived?.length || 0,
            conversations: communication?.recentConversations?.length || 0
        };
    }

    getAverageConversationTexture(entity) {
        return {
            warmth: this.getAverageEdgeValue(entity, ['recentWarmth']),
            ease: this.getAverageEdgeValue(entity, ['recentEase']),
            friction: this.getAverageEdgeValue(entity, ['recentFriction']),
            mutualAttention: this.getAverageEdgeValue(entity, ['recentMutualAttention'])
        };
    }

    getNearbyEntityCount(entity, allEntities = [], radius = 72, filterFn = null) {
        if (!entity) return 0;
        return (allEntities || []).filter(candidate => {
            if (!candidate || candidate === entity) return false;
            if (filterFn && !filterFn(candidate)) return false;
            return Math.hypot((candidate.x || 0) - (entity.x || 0), (candidate.y || 0) - (entity.y || 0)) <= radius;
        }).length;
    }

    getRecentMemoryCount(entity, family, tag = null) {
        const memories = entity?.lifeSim?.memories?.[family];
        if (!Array.isArray(memories)) return 0;
        if (!tag) return memories.length;
        return memories.filter(memory => memory?.tags?.includes?.(tag)).length;
    }

    getTopCountEntries(labels = [], count = 3) {
        const totals = new Map();
        for (const label of labels) {
            if (!label) continue;
            totals.set(label, (totals.get(label) || 0) + 1);
        }
        return Array.from(totals.entries())
            .sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])))
            .slice(0, count)
            .map(([label, total]) => ({ label, total }));
    }

    getTopLabels(profile = {}, count = 2) {
        return Object.entries(profile)
            .filter(([, value]) => typeof value === 'number')
            .sort((left, right) => right[1] - left[1])
            .slice(0, count)
            .map(([label, value]) => ({ label, value }));
    }

    getStrongestUpbringingReinforcement(entity) {
        return Object.entries(entity?.lifeSim?.upbringing?.routineReinforcement || {})
            .filter(([, value]) => typeof value === 'number' && value > 0)
            .sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])))
            .map(([label, value]) => ({ label, value }))[0] || null;
    }

    getZoneDisplayLabel(zoneId) {
        return gameCore?.getZoneConfig?.(zoneId)?.label || zoneId || 'garden';
    }

    getReleaseEcologyInfluence(entity, gameState = gameCore?.gameState) {
        return progressionManager?.getReleaseEcologyContext?.(gameState, entity) || null;
    }

    ensureMigrationState(entity, zoneIds = gameCore?.getZoneIds?.() || []) {
        if (!entity?.lifeSim) return null;
        const migration = entity.lifeSim.migration = entity.lifeSim.migration || createMigrationProfile();
        const zoneSet = new Set(zoneIds || []);
        const sanitizeMap = (source, { clamp = false, integer = false } = {}) => {
            const next = {};
            for (const [zoneId, rawValue] of Object.entries(source || {})) {
                if (!zoneId || (zoneSet.size && !zoneSet.has(zoneId))) continue;
                if (!Number.isFinite(rawValue)) continue;
                const normalized = integer
                    ? Math.max(0, Math.round(rawValue))
                    : Math.max(0, rawValue);
                next[zoneId] = clamp ? this.clamp01(normalized) : normalized;
            }
            return next;
        };

        migration.zoneAffinities = sanitizeMap(migration.zoneAffinities, { clamp: true });
        migration.zoneVisitCounts = sanitizeMap(migration.zoneVisitCounts, { integer: true });
        migration.zoneDwellSeconds = sanitizeMap(migration.zoneDwellSeconds);
        migration.homeZoneStrength = this.clamp01(migration.homeZoneStrength || 0);
        migration.lastObservedZoneId = migration.lastObservedZoneId || null;
        migration.lastTravelReason = migration.lastTravelReason || null;
        migration.lastTravelAtSeconds = Number.isFinite(migration.lastTravelAtSeconds) ? migration.lastTravelAtSeconds : null;
        migration.lastSyncedTravelFrame = Number.isFinite(migration.lastSyncedTravelFrame) ? migration.lastSyncedTravelFrame : null;
        migration.completedTravelCount = Math.max(0, migration.completedTravelCount || 0);
        migration.homeReturnCount = Math.max(0, migration.homeReturnCount || 0);
        migration.scoutingTripCount = Math.max(0, migration.scoutingTripCount || 0);
        migration.recentTravelReasons = Array.isArray(migration.recentTravelReasons)
            ? migration.recentTravelReasons.filter(Boolean).slice(0, 6)
            : [];

        if (zoneSet.size) {
            if (migration.homeZoneId && !zoneSet.has(migration.homeZoneId)) migration.homeZoneId = null;
            if (migration.lastObservedZoneId && !zoneSet.has(migration.lastObservedZoneId)) migration.lastObservedZoneId = null;
        }

        return migration;
    }

    getMigrationZoneAffinity(migration, zoneId) {
        if (!migration || !zoneId) return 0;
        return this.clamp01(migration.zoneAffinities?.[zoneId] || 0);
    }

    getMigrationZoneVisitCount(migration, zoneId) {
        if (!migration || !zoneId) return 0;
        return Math.max(0, migration.zoneVisitCounts?.[zoneId] || 0);
    }

    getMigrationZoneDwellSeconds(migration, zoneId) {
        if (!migration || !zoneId) return 0;
        return Math.max(0, migration.zoneDwellSeconds?.[zoneId] || 0);
    }

    countPotentialMateOpportunities(entity, zoneId, gameState = gameCore?.gameState) {
        if (!entity?.id || !zoneId || typeof breedingSystem === 'undefined') return 0;
        if (entity.sex === 'F' && !breedingSystem.isEligibleFemale?.(entity, gameState)) return 0;
        if (entity.sex === 'M' && !breedingSystem.isEligibleMale?.(entity, gameState)) return 0;

        return this.getButterfliesInZone(zoneId, gameState).filter(candidate => {
            if (!candidate?.id || candidate.id === entity.id || candidate.zoneTravel) return false;
            if (entity.sex === 'F') {
                return breedingSystem.isEligibleMale?.(candidate, gameState);
            }
            if (entity.sex === 'M') {
                return breedingSystem.isEligibleFemale?.(candidate, gameState);
            }
            return false;
        }).length;
    }

    getTopMigrationZones(migration, zoneIds = gameCore?.getZoneIds?.() || [], count = 3) {
        return (zoneIds || [])
            .map(zoneId => {
                const affinity = this.getMigrationZoneAffinity(migration, zoneId);
                const visits = this.getMigrationZoneVisitCount(migration, zoneId);
                const dwellSeconds = this.getMigrationZoneDwellSeconds(migration, zoneId);
                const score = this.clamp01(
                    (affinity * 0.58)
                    + Math.min(0.22, visits * 0.05)
                    + Math.min(0.2, dwellSeconds / 240)
                );
                return {
                    zoneId,
                    label: this.getZoneDisplayLabel(zoneId),
                    affinity,
                    visits,
                    dwellSeconds,
                    score
                };
            })
            .sort((left, right) =>
                right.score - left.score
                || right.affinity - left.affinity
                || right.visits - left.visits
                || left.label.localeCompare(right.label)
            )
            .slice(0, count);
    }

    getMemorySummary(entity) {
        const memoryStore = entity?.lifeSim?.memories || {};
        const families = [];
        const packets = [];
        let totalCount = 0;

        for (const [label, memories] of Object.entries(memoryStore)) {
            if (!Array.isArray(memories) || !memories.length) continue;
            const averageStrength = memories.reduce((sum, memory) => sum + (memory?.strength || 0), 0) / memories.length;
            totalCount += memories.length;
            families.push({ label, count: memories.length, averageStrength });
            packets.push(...memories);
        }

        families.sort((left, right) => right.count - left.count || right.averageStrength - left.averageStrength || left.label.localeCompare(right.label));
        packets.sort((left, right) =>
            (right?.createdAtSeconds ?? -Infinity) - (left?.createdAtSeconds ?? -Infinity)
            || (right?.recency ?? 0) - (left?.recency ?? 0)
            || (right?.strength ?? 0) - (left?.strength ?? 0)
        );

        const recentTags = [];
        const seenTags = new Set();
        for (const packet of packets) {
            for (const tag of packet?.tags || []) {
                if (!tag || seenTags.has(tag)) continue;
                seenTags.add(tag);
                recentTags.push(tag);
                if (recentTags.length >= 3) break;
            }
            if (recentTags.length >= 3) break;
        }

        return {
            totalCount,
            topFamilies: families.slice(0, 3),
            recentTags,
            headline: families.length
                ? families.slice(0, 3).map(entry => `${entry.label} ${entry.count}`).join(' | ')
                : 'No reinforced residue yet',
            detail: recentTags.length
                ? `Recent ${recentTags.join(' | ')}`
                : totalCount > 0
                    ? 'Recent residue is untagged'
                    : 'No tagged memory families yet'
        };
    }

    getRoutineSummary(entity) {
        const routineStore = entity?.lifeSim?.routines || {};
        const families = [];
        let totalCount = 0;

        for (const [label, routines] of Object.entries(routineStore)) {
            if (!Array.isArray(routines) || !routines.length) continue;
            const totalStrength = routines.reduce((sum, routine) => sum + (routine?.strength || 0), 0);
            const peakStrength = routines.reduce((peak, routine) => Math.max(peak, routine?.strength || 0), 0);
            totalCount += routines.length;
            families.push({
                label,
                count: routines.length,
                averageStrength: totalStrength / routines.length,
                peakStrength
            });
        }

        families.sort((left, right) =>
            right.averageStrength - left.averageStrength
            || right.count - left.count
            || right.peakStrength - left.peakStrength
            || left.label.localeCompare(right.label)
        );

        const strongest = families[0] || null;
        const activeContext = entity?.lifeSim?.routines?.activeContext || entity?.lifeSim?.social?.activeContext || 'wandering';

        return {
            totalCount,
            activeContext,
            topFamilies: families.slice(0, 3),
            headline: families.length
                ? [`ctx ${activeContext}`, ...families.slice(0, 2).map(entry => `${entry.label} ${Math.round(entry.averageStrength * 100)}`)].join(' | ')
                : `ctx ${activeContext} | no reinforced routines`,
            detail: strongest
                ? `${strongest.label} ${Math.round(strongest.averageStrength * 100)} avg | ${strongest.count} anchors`
                : 'No strong routine anchors yet'
        };
    }

    getUpbringingSummary(entity) {
        const upbringing = entity?.lifeSim?.upbringing || {};
        const lessons = Array.isArray(upbringing.lessons) ? upbringing.lessons : [];
        const imprintSources = Array.isArray(upbringing.imprintSources) ? upbringing.imprintSources : [];
        const lessonCategories = this.getTopCountEntries(
            lessons.map(lesson => lesson?.category || 'general'),
            2
        ).map(entry => ({ label: entry.label, count: entry.total }));
        const strongestReinforcement = this.getStrongestUpbringingReinforcement(entity);
        const warpedLessonCount = lessons.filter(lesson => !!lesson?.warped).length;

        return {
            lessonCount: lessons.length,
            imprintCount: imprintSources.length,
            warpedLessonCount,
            topLessonCategories: lessonCategories,
            strongestReinforcement,
            headline: lessonCategories.length
                ? [`lessons ${lessons.length}`, `imprint ${imprintSources.length}`, ...lessonCategories.map(entry => `${entry.label} ${entry.count}`)].join(' | ')
                : `lessons ${lessons.length} | imprint ${imprintSources.length}`,
            detail: strongestReinforcement
                ? `reinforce ${strongestReinforcement.label} ${Math.round(strongestReinforcement.value * 100)}${warpedLessonCount ? ` | warped ${warpedLessonCount}` : ''}`
                : warpedLessonCount
                    ? `warped ${warpedLessonCount} | no routine reinforcement yet`
                    : 'No routine reinforcement yet'
        };
    }

    getDistortionSummary(entity) {
        const distortion = entity?.lifeSim?.distortion || {};
        const activeBiases = Object.entries(distortion)
            .filter(([, value]) => typeof value === 'number' && value > 0.06)
            .sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])))
            .slice(0, 3)
            .map(([label, value]) => ({ label, value }));
        const dominantBias = activeBiases[0] || this.getTopLabels(distortion, 1)[0] || null;
        const warpedSignals = entity?.lifeSim?.interpretation?.warpedSignals || 0;

        return {
            activeBiases,
            dominantBias: dominantBias ? { label: dominantBias.label, value: dominantBias.value || 0 } : null,
            warpedSignals,
            headline: activeBiases.length
                ? activeBiases.map(entry => `${entry.label} ${Math.round(entry.value * 100)}`).join(' | ')
                : 'stable',
            detail: dominantBias
                ? `${dominantBias.label} ${Math.round((dominantBias.value || 0) * 100)} | warped ${warpedSignals}`
                : `warped ${warpedSignals} | stable`
        };
    }

    getButterflyContext(entity, zoneId) {
        const routineContext = entity?.lifeSim?.routines?.activeContext;
        if (routineContext) return routineContext;
        if (entity.state === 'feeding') return 'feeding';
        if (entity.state === 'mating') return 'courtship';
        if (entity.state === 'scared') return 'danger';
        const zone = zoneSystem?.getZoneById?.(zoneId) || zoneSystem?.getZone?.(zoneId) || gameCore?.getZoneConfig?.(zoneId) || null;
        if (zone?.kind === 'training' || zone?.renderProfile?.trainingStations?.length) return 'training-ground';
        if (entity.lifeSim?.communication?.activeSignal) return 'signaling';
        return 'wandering';
    }

    isSociallyVulnerable(entity) {
        if (!entity?.lifeSim) return false;
        const threat = this.clamp01(entity.lifeSim?.emotions?.threat || 0);
        const exhaustion = this.clamp01(entity.lifeSim?.emotions?.exhaustion || 0);
        const confidence = this.clamp01(entity.lifeSim?.social?.confidence || 0);
        const sleepSubtype = typeof sleepSystem !== 'undefined'
            ? sleepSystem.getSleepState?.(entity.id)?.subtype
            : null;
        return entity?.state === 'scared'
            || !!sleepSubtype
            || threat >= 0.42
            || exhaustion >= 0.56
            || confidence <= 0.24;
    }

    resolveActiveSocialContext(entity, zoneId, socialEcology = null) {
        const baseContext = this.getButterflyContext(entity, zoneId);
        if (['feeding', 'courtship', 'danger', 'metamorphosis'].includes(baseContext)) {
            return baseContext;
        }

        const primaryRhythm = socialEcology?.primaryRhythm || 'wandering';
        const rhythmContexts = {
            'roosting-pocket': 'roosting',
            'warning-cascade': 'warning-cascade',
            'teaching-pocket': 'teaching-pocket',
            'courtship-territory': 'courtship-territory',
            'clique-comfort': 'clique-comfort',
            'clique-exclusion': 'clique-exclusion',
            'protective-ring': 'protective-ring',
            'reputation-wave': 'reputation-wave'
        };
        return rhythmContexts[primaryRhythm] || baseContext;
    }

    getSocialEcologySummary(entity, gameState = gameCore?.gameState, options = {}) {
        const lifeSim = entity?.lifeSim;
        if (!entity?.id || !lifeSim) return null;

        const zoneId = options.zoneId || this.getZoneId(entity);
        const nearbyButterflies = Array.isArray(options.nearbyButterflies)
            ? options.nearbyButterflies
            : this.getButterfliesInZone(zoneId, gameState).filter(candidate => candidate?.id && candidate.id !== entity.id);
        const localButterflies = nearbyButterflies.filter(candidate =>
            Math.hypot((candidate.x || 0) - (entity.x || 0), (candidate.y || 0) - (entity.y || 0)) <= 96
        );
        const spatialContext = options.spatialContext
            || (typeof structureSystem !== 'undefined'
                ? structureSystem.getSpatialContextForEntity?.(entity, gameState)
                : null)
            || {};
        const signalField = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getLocalSignalField?.(entity, gameState)
            : null;
        const zoneSummary = options.zoneSummary || options.zoneInfluence?.zoneSummary || gameCore?.getZoneEcologySummary?.(zoneId) || {};
        const sleepState = typeof sleepSystem !== 'undefined' ? sleepSystem.getSleepState?.(entity.id) : null;
        const relationship = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getPrimaryRelationshipSummary?.(entity.id)
            : null;
        const behaviorBiases = lifeSim.derived?.behaviorBiases || {};
        const dangerMemoryDensity = this.clamp01(this.getMemoryDensity(entity, 'danger') / 10);
        const lessonCount = lifeSim.upbringing?.lessons?.length || 0;
        const socialConfidence = this.clamp01(lifeSim.social?.confidence || 0);
        const displayConfidence = this.clamp01(behaviorBiases.displayConfidence || 0);
        const trainingAffinity = this.clamp01(options.trainingAffinity ?? behaviorBiases.trainingAffinity ?? this.getRoutineStrength(entity, 'teaching'));
        const mateSeeking = this.clamp01(options.mateSeeking ?? lifeSim.derived?.migration?.mateSeeking ?? 0);
        const chemistry = this.clamp01((relationship?.chemistry || 0) / 100);
        const attachment = this.clamp01((relationship?.attachment || 0) / 100);
        const relationshipTextureLingerBias = relationship?.pairTextureLingerBias || 0;
        const relationshipTextureConfidenceBias = relationship?.pairTextureConfidenceBias || 0;
        const relationshipTextureCourtshipBias = relationship?.pairTextureCourtshipBias || 0;
        const relationshipTextureVolatility = relationship?.pairTextureVolatility || 0;
        const localWarningSources = signalField?.counts?.warning || 0;
        const localTeachingSources = signalField?.counts?.teaching || 0;
        const localCourtshipSources = signalField?.counts?.courtship || 0;
        const localCalmingSources = signalField?.counts?.calming || 0;
        const nearbySleeping = localButterflies.filter(candidate => sleepSystem?.isSleeping?.(candidate.id)).length;
        const nearbySheltered = localButterflies.filter(candidate =>
            candidate?.lifeSim?.spatialAwareness?.insideShelter
            || candidate?.lifeSim?.spatialAwareness?.shelterCandidate
        ).length;
        const nearbyScared = localButterflies.filter(candidate => candidate?.state === 'scared').length;
        const nearbyTeachers = localButterflies.filter(candidate =>
            (candidate.getSpecialAbility?.() || candidate.specialAbility) === 'teacher'
            || candidate?.lifeSim?.communication?.activeSignal?.signalType === 'teaching_signal'
        ).length;
        const nearbyCourtship = localButterflies.filter(candidate =>
            candidate?.state === 'mating'
            || candidate?.lifeSim?.communication?.activeSignal?.signalType === 'courtship_signal'
        ).length;
        const localEdgeSummaries = localButterflies.map(candidate => {
            const outgoingEdge = entity?.lifeSim?.socialEdges?.[candidate.id] || {};
            const incomingEdge = candidate?.lifeSim?.socialEdges?.[entity.id] || {};
            const warmth = this.clamp01(
                ((outgoingEdge.trust || 0) + (outgoingEdge.comfort || 0) + (incomingEdge.trust || 0) + (incomingEdge.comfort || 0)) * 0.16
                + ((outgoingEdge.recentWarmth || 0) + (incomingEdge.recentWarmth || 0)) * 0.16
                + ((outgoingEdge.recentEase || 0) + (incomingEdge.recentEase || 0)) * 0.12
                + ((outgoingEdge.recentMutualAttention || 0) + (incomingEdge.recentMutualAttention || 0)) * 0.1
                + ((outgoingEdge.attachment || 0) + (incomingEdge.attachment || 0)) * 0.12
            );
            const tension = this.clamp01(
                ((outgoingEdge.rivalry || 0) + (incomingEdge.rivalry || 0) + (outgoingEdge.resentment || 0) + (incomingEdge.resentment || 0)) * 0.18
                + ((outgoingEdge.recentFriction || 0) + (incomingEdge.recentFriction || 0)) * 0.22
                + ((outgoingEdge.rejectionWeight || 0) + (incomingEdge.rejectionWeight || 0)) * 0.16
            );
            return {
                candidate,
                warmth,
                tension,
                incomingAdmiration: this.clamp01(incomingEdge.admiration || 0),
                outgoingProtectiveness: this.clamp01(outgoingEdge.protectiveness || 0),
                incomingProtectiveness: this.clamp01(incomingEdge.protectiveness || 0),
                candidateVulnerable: this.isSociallyVulnerable(candidate),
                mutualLink: warmth >= 0.36 && tension <= 0.18
            };
        });
        const averageMetric = key => localEdgeSummaries.length
            ? localEdgeSummaries.reduce((sum, entry) => sum + (entry[key] || 0), 0) / localEdgeSummaries.length
            : 0;
        const warmPairCount = localEdgeSummaries.filter(entry => entry.warmth >= 0.34).length;
        const tensePairCount = localEdgeSummaries.filter(entry => entry.tension >= 0.24).length;
        const mutualLinkCount = localEdgeSummaries.filter(entry => entry.mutualLink).length;
        const admiredByCount = localEdgeSummaries.filter(entry => entry.incomingAdmiration >= 0.18).length;
        const incomingProtectCount = localEdgeSummaries.filter(entry => entry.incomingProtectiveness >= 0.18).length;
        const outgoingProtectCount = localEdgeSummaries.filter(entry => entry.candidateVulnerable && entry.outgoingProtectiveness >= 0.18).length;
        const vulnerableNearbyCount = localEdgeSummaries.filter(entry => entry.candidateVulnerable).length;
        const averageWarmth = averageMetric('warmth');
        const averageTension = averageMetric('tension');
        const averageIncomingAdmiration = averageMetric('incomingAdmiration');
        const averageIncomingProtectiveness = averageMetric('incomingProtectiveness');
        const averageOutgoingProtectiveness = averageMetric('outgoingProtectiveness');
        const selfVulnerable = this.isSociallyVulnerable(entity);
        const shelterCandidate = !!(spatialContext?.shelterCandidate || lifeSim.spatialAwareness?.shelterCandidate);
        const insideShelter = !!(spatialContext?.insideShelter || lifeSim.spatialAwareness?.insideShelter);
        const canUseInterior = !!(spatialContext?.canUseInterior || lifeSim.spatialAwareness?.canUseInterior);
        const zoneCrowdingPressure = this.clamp01(zoneSummary?.crowdingPressure || 0);
        const zoneShelterCapacity = this.clamp01(zoneSummary?.shelterCapacity || 0);
        const zoneSocialValence = this.clamp01(zoneSummary?.socialValence || 0);
        const zoneTrainingValence = this.clamp01(zoneSummary?.trainingValence || 0);
        const roostScore = this.clamp01(
            (lifeSim.drives?.rest || 0) * 0.24
            + (lifeSim.emotions?.relief || 0) * 0.18
            + (sleepState?.subtype ? 0.18 : 0)
            + (insideShelter ? 0.18 : shelterCandidate ? 0.12 : 0)
            + (canUseInterior ? 0.08 : 0)
            + Math.min(0.2, nearbySleeping * 0.08)
            + Math.min(0.16, nearbySheltered * 0.05)
            + (signalField?.calmingPressure || 0) * 0.18
            + zoneShelterCapacity * 0.1
            + socialConfidence * 0.06
            - (signalField?.warningPressure || 0) * 0.18
        );
        const warningScore = this.clamp01(
            (signalField?.warningPressure || 0) * 0.52
            + Math.min(0.18, localWarningSources * 0.08)
            + Math.min(0.18, nearbyScared * 0.08)
            + (behaviorBiases.caution || 0) * 0.18
            + (lifeSim.emotions?.threat || 0) * 0.16
            + dangerMemoryDensity * 0.14
            + (shelterCandidate ? 0.08 : 0)
        );
        const teachingScore = this.clamp01(
            (signalField?.teachingPressure || 0) * 0.44
            + Math.min(0.16, localTeachingSources * 0.06)
            + Math.min(0.18, nearbyTeachers * 0.08)
            + trainingAffinity * 0.18
            + zoneTrainingValence * 0.14
            + (this.getButterflyContext(entity, zoneId) === 'training-ground' ? 0.12 : 0)
            + Math.min(0.14, lessonCount * 0.02)
        );
        const courtshipScore = this.clamp01(
            (signalField?.courtshipPressure || 0) * 0.46
            + Math.min(0.16, localCourtshipSources * 0.06)
            + Math.min(0.18, nearbyCourtship * 0.08)
            + mateSeeking * 0.2
            + displayConfidence * 0.1
            + socialConfidence * 0.08
            + chemistry * 0.12
            + attachment * 0.08
            + Math.max(-0.06, Math.min(0.08, relationshipTextureCourtshipBias * 0.4))
            + zoneSocialValence * 0.12
            + Math.max(0, 0.28 - zoneCrowdingPressure) * 0.2
        );
        const cliqueComfortScore = this.clamp01(
            (lifeSim.social?.belonging || 0) * 0.26
            + averageWarmth * 0.42
            + Math.min(0.22, warmPairCount * 0.08)
            + Math.min(0.16, mutualLinkCount * 0.05)
            + zoneSocialValence * 0.12
            + (signalField?.calmingPressure || 0) * 0.08
            - averageTension * 0.14
        );
        const cliqueExclusionScore = this.clamp01(
            Math.max(0, 0.42 - (lifeSim.social?.belonging || 0)) * 0.26
            + averageTension * 0.46
            + Math.min(0.22, tensePairCount * 0.08)
            + zoneCrowdingPressure * 0.12
            + (signalField?.warningPressure || 0) * 0.08
            - averageWarmth * 0.12
        );
        const protectiveScore = this.clamp01(
            (selfVulnerable
                ? Math.min(0.28, incomingProtectCount * 0.08) + averageIncomingProtectiveness * 0.34
                : Math.min(0.24, vulnerableNearbyCount * 0.06) + averageOutgoingProtectiveness * 0.34 + Math.min(0.16, outgoingProtectCount * 0.05))
            + (signalField?.warningPressure || 0) * 0.14
            + (signalField?.calmingPressure || 0) * 0.08
            + (lifeSim.drives?.caregiving || 0) * 0.12
            + attachment * 0.08
        );
        const reputationScore = this.clamp01(
            (lifeSim.social?.reputation || 0) * 0.44
            + averageIncomingAdmiration * 0.34
            + Math.min(0.18, admiredByCount * 0.06)
            + socialConfidence * 0.06
            + displayConfidence * 0.04
            + zoneSocialValence * 0.08
        );

        const rhythmCandidates = [
            { key: 'warning-cascade', score: warningScore, threshold: 0.22 },
            { key: 'roosting-pocket', score: roostScore, threshold: 0.24 },
            { key: 'teaching-pocket', score: teachingScore, threshold: 0.24 },
            { key: 'courtship-territory', score: courtshipScore, threshold: 0.24 },
            { key: 'clique-comfort', score: cliqueComfortScore, threshold: 0.26 },
            { key: 'clique-exclusion', score: cliqueExclusionScore, threshold: 0.24 },
            { key: 'protective-ring', score: protectiveScore, threshold: 0.24 },
            { key: 'reputation-wave', score: reputationScore, threshold: 0.28 }
        ].sort((left, right) => right.score - left.score);
        const primary = rhythmCandidates[0]?.score >= rhythmCandidates[0]?.threshold
            ? rhythmCandidates[0]
            : { key: 'wandering', score: 0 };
        const societyCandidates = [
            { key: 'clique-comfort', score: cliqueComfortScore, threshold: 0.26 },
            { key: 'clique-exclusion', score: cliqueExclusionScore, threshold: 0.24 },
            { key: 'protective-ring', score: protectiveScore, threshold: 0.24 },
            { key: 'reputation-wave', score: reputationScore, threshold: 0.28 }
        ].sort((left, right) => right.score - left.score);
        const primarySociety = societyCandidates[0]?.score >= societyCandidates[0]?.threshold
            ? societyCandidates[0]
            : { key: 'mixed', score: 0 };
        const followThrough = typeof communicationSystem !== 'undefined'
            ? communicationSystem.getFollowThroughBehaviorProfile?.(entity, gameState, {
                zoneId,
                nearbyButterflies: localButterflies
            })
            : null;

        const roostAnchorLabel = insideShelter
            ? 'inside shelter'
            : shelterCandidate
                ? 'shelter edge'
                : 'open perch';
        const warningAnchorLabel = signalField?.sourceCount
            ? `${signalField.sourceCount} nearby`
            : nearbyScared
                ? `${nearbyScared} startled`
                : 'quiet edge';
        const teachingAnchorLabel = nearbyTeachers
            ? `${nearbyTeachers} guide${nearbyTeachers === 1 ? '' : 's'}`
            : this.getButterflyContext(entity, zoneId) === 'training-ground'
                ? 'training edge'
                : 'quiet lesson';
        const courtshipAnchorLabel = relationship?.partnerLabel
            ? relationship.partnerLabel
            : nearbyCourtship
                ? `${nearbyCourtship} nearby`
                : 'open court';
        const cliqueAnchorLabel = warmPairCount
            ? `${warmPairCount} close`
            : relationship?.partnerLabel
                ? `near ${relationship.partnerLabel}`
                : 'thin cluster';
        const exclusionAnchorLabel = tensePairCount
            ? `${tensePairCount} tense`
            : 'edge drift';
        const protectiveAnchorLabel = selfVulnerable
            ? `${incomingProtectCount} shielding`
            : vulnerableNearbyCount
                ? `${vulnerableNearbyCount} exposed`
                : 'quiet watch';
        const reputationAnchorLabel = admiredByCount
            ? `${admiredByCount} noticing`
            : nearbyTeachers
                ? 'teaching glow'
                : 'quiet name';

        const headlineByRhythm = {
            'roosting-pocket': `roost ${Math.round(roostScore * 100)} | ${roostAnchorLabel}`,
            'warning-cascade': `warning ${Math.round(warningScore * 100)} | ${warningAnchorLabel}`,
            'teaching-pocket': `teach ${Math.round(teachingScore * 100)} | ${teachingAnchorLabel}`,
            'courtship-territory': `court ${Math.round(courtshipScore * 100)} | ${courtshipAnchorLabel}`,
            'clique-comfort': `clique ${Math.round(cliqueComfortScore * 100)} | ${cliqueAnchorLabel}`,
            'clique-exclusion': `edge ${Math.round(cliqueExclusionScore * 100)} | ${exclusionAnchorLabel}`,
            'protective-ring': `protect ${Math.round(protectiveScore * 100)} | ${protectiveAnchorLabel}`,
            'reputation-wave': `rep ${Math.round(reputationScore * 100)} | ${reputationAnchorLabel}`,
            wandering: 'quiet | no strong local rhythm'
        };
        const societyLabelByTone = {
            'clique-comfort': `clique ${Math.round(cliqueComfortScore * 100)} | ${cliqueAnchorLabel}`,
            'clique-exclusion': `edge ${Math.round(cliqueExclusionScore * 100)} | ${exclusionAnchorLabel}`,
            'protective-ring': `protect ${Math.round(protectiveScore * 100)} | ${protectiveAnchorLabel}`,
            'reputation-wave': `rep ${Math.round(reputationScore * 100)} | ${reputationAnchorLabel}`,
            mixed: 'mixed | no dominant local society tone'
        };
        const societyDetail = `clique ${Math.round(cliqueComfortScore * 100)} | excl ${Math.round(cliqueExclusionScore * 100)} | protect ${Math.round(protectiveScore * 100)} | rep ${Math.round(reputationScore * 100)}`;

        return {
            primaryRhythm: primary.key,
            primaryScore: this.clamp01(primary.score || 0),
            headline: headlineByRhythm[primary.key] || headlineByRhythm.wandering,
            detail: societyDetail,
            societyTone: primarySociety.key,
            societyLabel: societyLabelByTone[primarySociety.key] || societyLabelByTone.mixed,
            societyDetail,
            habitatDetail: `roost ${Math.round(roostScore * 100)} | warn ${Math.round(warningScore * 100)} | teach ${Math.round(teachingScore * 100)} | court ${Math.round(courtshipScore * 100)}`,
            followThrough: {
                dominantMode: followThrough?.dominantMode || 'none',
                label: followThrough?.label || 'no strong carry-over',
                detail: followThrough?.detail || 'seek 0 | avoid 0 | imitate 0 | protect 0',
                seekPartnerId: followThrough?.seekPartnerId || null,
                seekPartnerLabel: followThrough?.seekPartnerLabel || null,
                seekScore: followThrough?.seekScore || 0,
                avoidPartnerId: followThrough?.avoidPartnerId || null,
                avoidPartnerLabel: followThrough?.avoidPartnerLabel || null,
                avoidScore: followThrough?.avoidScore || 0,
                imitatePartnerId: followThrough?.imitatePartnerId || null,
                imitatePartnerLabel: followThrough?.imitatePartnerLabel || null,
                imitateScore: followThrough?.imitateScore || 0,
                protectPartnerId: followThrough?.protectPartnerId || null,
                protectPartnerLabel: followThrough?.protectPartnerLabel || null,
                protectScore: followThrough?.protectScore || 0
            },
            relationshipTextureLabel: relationship?.pairTextureLabel || 'steady',
            relationshipTextureSignature: relationship?.pairTextureSignature || 'familiar ease without much drama',
            relationshipTextureLingerBias,
            relationshipTextureConfidenceBias,
            relationshipTextureCourtshipBias,
            relationshipTextureVolatility,
            localFieldLabel: signalField?.label || 'quiet | no active field',
            localFieldDetail: signalField?.detail || 'No nearby active signals',
            anchorZoneId: zoneId || null,
            preferredShelterId: spatialContext?.supportBlockId || null,
            preferredPartnerId: relationship?.partnerId || null,
            roosting: {
                label: 'roost pocket',
                score: roostScore,
                nearbyCount: localButterflies.length,
                supportCount: nearbySleeping + nearbySheltered + localCalmingSources,
                targetedCount: signalField?.targetedCount || 0,
                anchorId: spatialContext?.supportBlockId || null,
                anchorLabel: roostAnchorLabel,
                detail: `sleep ${nearbySleeping} | shelter ${nearbySheltered + (insideShelter ? 1 : 0)} | calm ${localCalmingSources}`
            },
            warning: {
                label: 'warning cascade',
                score: warningScore,
                nearbyCount: localButterflies.length,
                supportCount: localWarningSources + nearbyScared,
                targetedCount: signalField?.targetedCount || 0,
                anchorId: null,
                anchorLabel: warningAnchorLabel,
                detail: `warn ${localWarningSources} | startled ${nearbyScared} | shelter ${shelterCandidate ? 1 : 0}`
            },
            teaching: {
                label: 'teaching pocket',
                score: teachingScore,
                nearbyCount: localButterflies.length,
                supportCount: localTeachingSources + nearbyTeachers,
                targetedCount: signalField?.targetedCount || 0,
                anchorId: null,
                anchorLabel: teachingAnchorLabel,
                detail: `teach ${localTeachingSources} | guides ${nearbyTeachers} | lessons ${lessonCount}`
            },
            courtship: {
                label: 'courtship territory',
                score: courtshipScore,
                nearbyCount: localButterflies.length,
                supportCount: localCourtshipSources + nearbyCourtship,
                targetedCount: signalField?.targetedCount || 0,
                anchorId: relationship?.partnerId || null,
                anchorLabel: courtshipAnchorLabel,
                detail: `court ${localCourtshipSources} | pair ${nearbyCourtship} | chemistry ${Math.round(chemistry * 100)} | ${relationship?.pairTextureLabel || 'steady'}`
            },
            clique: {
                label: 'clique comfort',
                score: cliqueComfortScore,
                nearbyCount: localButterflies.length,
                supportCount: warmPairCount + mutualLinkCount,
                targetedCount: mutualLinkCount,
                anchorId: null,
                anchorLabel: cliqueAnchorLabel,
                detail: `warm ${warmPairCount} | links ${mutualLinkCount} | belong ${Math.round((lifeSim.social?.belonging || 0) * 100)}`
            },
            exclusion: {
                label: 'clique exclusion',
                score: cliqueExclusionScore,
                nearbyCount: localButterflies.length,
                supportCount: tensePairCount,
                targetedCount: tensePairCount,
                anchorId: null,
                anchorLabel: exclusionAnchorLabel,
                detail: `tense ${tensePairCount} | belong ${Math.round((lifeSim.social?.belonging || 0) * 100)} | crowd ${Math.round(zoneCrowdingPressure * 100)}`
            },
            protection: {
                label: 'protective ring',
                score: protectiveScore,
                nearbyCount: localButterflies.length,
                supportCount: selfVulnerable ? incomingProtectCount : outgoingProtectCount,
                targetedCount: vulnerableNearbyCount,
                anchorId: null,
                anchorLabel: protectiveAnchorLabel,
                detail: `in ${incomingProtectCount} | out ${outgoingProtectCount} | vuln ${selfVulnerable ? 1 : vulnerableNearbyCount}`
            },
            reputation: {
                label: 'reputation wave',
                score: reputationScore,
                nearbyCount: localButterflies.length,
                supportCount: admiredByCount,
                targetedCount: admiredByCount,
                anchorId: null,
                anchorLabel: reputationAnchorLabel,
                detail: `admired ${admiredByCount} | rep ${Math.round((lifeSim.social?.reputation || 0) * 100)} | conf ${Math.round(socialConfidence * 100)}`
            }
        };
    }

    getZoneEcologyProfile(zoneId) {
        return gameCore?.getZoneEcologyProfile?.(zoneId) || {};
    }

    getZoneLifeSimInfluence(zoneId, entity = null) {
        const profile = this.getZoneEcologyProfile(zoneId);
        const zoneSummary = gameCore?.getZoneEcologySummary?.(zoneId) || null;
        const actionBiases = profile?.actionBiases || {};
        const social = this.clamp01(actionBiases.social || 0);
        const teaching = this.clamp01(actionBiases.teaching || 0);
        const exploration = this.clamp01(actionBiases.exploration || 0);
        const rest = this.clamp01(actionBiases.rest || 0);
        const objectUse = this.clamp01(actionBiases.objectUse || 0);
        const vigilance = this.clamp01(actionBiases.vigilance || 0);
        const training = this.clamp01(actionBiases.training || 0);
        const status = this.clamp01(actionBiases.status || 0);
        const caregiving = this.clamp01(actionBiases.caregiving || 0);
        const foodRichness = this.clamp01(zoneSummary?.foodRichness ?? 0.5);
        const shelterCapacity = this.clamp01(zoneSummary?.shelterCapacity ?? 0.5);
        const crowdingPressure = this.clamp01(zoneSummary?.crowdingPressure ?? 0.18);
        const migrationPull = this.clamp01(zoneSummary?.migrationPull ?? 0.3);
        const socialValence = this.clamp01(zoneSummary?.socialValence ?? social);
        const trainingValence = this.clamp01(zoneSummary?.trainingValence ?? training);
        const recoveryPressure = this.clamp01(zoneSummary?.recoveryPressure ?? rest);
        const communicationStyle = zoneSummary?.communicationStyle || profile?.communicationStyle || '';
        const cautionStyleBias = communicationStyle === 'open-land-watchful'
            ? 0.08
            : communicationStyle === 'loud-training'
                ? -0.04
                : 0;
        const recentZones = Array.isArray(entity?.zoneEcologyState?.recentZoneIds)
            ? entity.zoneEcologyState.recentZoneIds
            : [];
        const revisitNovelty = recentZones[0] === zoneId
            ? 0.04
            : recentZones.includes(zoneId)
                ? 0.08
                : 0.16;

        return {
            profile,
            zoneSummary,
            identityLabel: zoneSummary?.identityLabel || profile.identityLabel || zoneId || 'garden',
            identityTags: zoneSummary?.identityTags || (Array.isArray(profile.identityTags) ? profile.identityTags : []),
            drives: {
                selfMaintenance: (caregiving * 0.05) + (rest * 0.02) + (foodRichness * 0.06) + (recoveryPressure * 0.04),
                safetyAvoidance: (vigilance * 0.2) - (training * 0.08) - (status * 0.03) + (crowdingPressure * 0.12) - (shelterCapacity * 0.04),
                resourceControl: (objectUse * 0.04) + (foodRichness * 0.05) + (shelterCapacity * 0.02),
                socialConnection: (social * 0.18) + (teaching * 0.06) + (socialValence * 0.14) - (crowdingPressure * 0.04),
                caregiving: (caregiving * 0.16) + (social * 0.04) + (recoveryPressure * 0.05),
                exploration: (exploration * 0.22) + revisitNovelty + (migrationPull * 0.14) - (recoveryPressure * 0.04),
                statusExpression: (status * 0.18) + (training * 0.06) + (trainingValence * 0.1),
                rest: (rest * 0.22) - (training * 0.06) + (recoveryPressure * 0.16) + (shelterCapacity * 0.08) - (migrationPull * 0.04)
            },
            emotions: {
                relief: (social * 0.08) + (rest * 0.1) + (recoveryPressure * 0.08) + (foodRichness * 0.04),
                curiosity: (exploration * 0.1) + (revisitNovelty * 0.4) + (migrationPull * 0.08) - (crowdingPressure * 0.04),
                threat: (vigilance * 0.08) - (social * 0.03) - (rest * 0.02) + (crowdingPressure * 0.12) - (shelterCapacity * 0.04) + cautionStyleBias,
                significance: (status * 0.08) + (training * 0.05) + (trainingValence * 0.08)
            },
            derived: {
                cautionBias: (vigilance * 0.18) + (rest * 0.04) + (caregiving * 0.02) - (training * 0.05) - (social * 0.03) + (crowdingPressure * 0.08) - (shelterCapacity * 0.02) + cautionStyleBias,
                trainingAffinity: (training * 0.4) + (teaching * 0.18) + (trainingValence * 0.22),
                objectInterest: (objectUse * 0.3) + (vigilance * 0.08) + (shelterCapacity * 0.12),
                shelterSeeking: (vigilance * 0.22) + (rest * 0.14) + (crowdingPressure * 0.1) + (shelterCapacity * 0.08) + (recoveryPressure * 0.06),
                battleAggression: (training * 0.18) + (status * 0.12) - (rest * 0.08) + (trainingValence * 0.08) - (recoveryPressure * 0.04)
            }
        };
    }

    syncMigrationState(entity, gameState = gameCore?.gameState, options = {}) {
        const lifeSim = this.ensureLifeSimState(entity);
        if (!lifeSim) return null;

        const zoneIds = gameCore?.getZoneIds?.() || [];
        const zoneId = options.zoneId || this.getZoneId(entity);
        const migration = this.ensureMigrationState(entity, zoneIds);
        if (!migration || !zoneId) return null;

        const deltaSeconds = Number.isFinite(options.deltaSeconds) ? options.deltaSeconds : (gameConfig?.simulation?.fixedDeltaSeconds || (1 / 60));
        const allowDurableMutation = deltaSeconds > 0;
        const previousHomeZoneId = migration.homeZoneId || null;
        if (allowDurableMutation) {
            migration.zoneVisitCounts[zoneId] = Math.max(1, migration.zoneVisitCounts?.[zoneId] || 1);
            if (migration.lastObservedZoneId !== zoneId) {
                migration.zoneVisitCounts[zoneId] = Math.max(1, (migration.zoneVisitCounts?.[zoneId] || 0) + 1);
                migration.lastObservedZoneId = zoneId;
            }
            migration.zoneDwellSeconds[zoneId] = Math.max(0, Math.min(1800, (migration.zoneDwellSeconds?.[zoneId] || 0) + deltaSeconds));
        }

        const completedTravelFrame = entity?.zoneEcologyState?.lastTravelCompletedAtFrame;
        const completedTravelReason = entity?.zoneEcologyState?.lastTravelReason || null;
        if (Number.isFinite(completedTravelFrame) && migration.lastSyncedTravelFrame !== completedTravelFrame) {
            migration.lastSyncedTravelFrame = completedTravelFrame;
            migration.lastTravelReason = completedTravelReason;
            migration.lastTravelAtSeconds = this.simulationClockSeconds;
            migration.completedTravelCount = Math.max(0, (migration.completedTravelCount || 0) + 1);
            if (completedTravelReason === 'return-home') {
                migration.homeReturnCount = Math.max(0, (migration.homeReturnCount || 0) + 1);
            }
            if (completedTravelReason === 'scouting') {
                migration.scoutingTripCount = Math.max(0, (migration.scoutingTripCount || 0) + 1);
            }
            if (completedTravelReason) {
                migration.recentTravelReasons = [
                    completedTravelReason,
                    ...(migration.recentTravelReasons || []).filter(reason => reason && reason !== completedTravelReason)
                ].slice(0, 6);
            }
        }

        const zoneSummary = options.zoneSummary || gameCore?.getZoneEcologySummary?.(zoneId) || {};
        const crowding = this.clamp01(options.crowding ?? lifeSim.derived?.crowding ?? 0);
        const novelty = this.clamp01(options.novelty ?? lifeSim.derived?.novelty ?? 0);
        const attachment = this.clamp01(options.attachment ?? this.getAverageEdgeValue(entity, ['trust', 'comfort', 'attachment']));
        const socialConfidence = this.clamp01(options.socialConfidence ?? lifeSim.social?.confidence ?? 0);
        const trainingAffinity = this.clamp01(options.trainingAffinity ?? this.getRoutineStrength(entity, 'teaching'));
        const curiosity = this.clamp01(options.curiosity ?? lifeSim.emotions?.curiosity ?? 0);
        const relief = this.clamp01(options.relief ?? lifeSim.emotions?.relief ?? 0);
        const exhaustion = this.clamp01(options.exhaustion ?? lifeSim.emotions?.exhaustion ?? 0);
        const threat = this.clamp01(options.threat ?? lifeSim.emotions?.threat ?? 0);
        const cohortPreferredZoneId = options.cohortPreferredZoneId || null;
        const cohortPreferredZoneBoost = this.clamp01(options.cohortPreferredZoneBoost ?? 0);
        const crowdingPressure = this.clamp01(options.crowdingPressure ?? zoneSummary?.crowdingPressure ?? 0);
        const foodRichness = this.clamp01(zoneSummary?.foodRichness ?? 0.5);
        const habitatQuality = this.clamp01(zoneSummary?.habitatQuality ?? 0.5);
        const socialValence = this.clamp01(zoneSummary?.socialValence ?? 0.5);
        const trainingValence = this.clamp01(zoneSummary?.trainingValence ?? 0.5);
        const recoveryPressure = this.clamp01(zoneSummary?.recoveryPressure ?? 0.5);
        const explorationDrive = this.clamp01((lifeSim.drives?.exploration || 0) * 0.48 + curiosity * 0.32 + novelty * 0.2);
        const homeAnchorTarget = this.clamp01(
            0.16
            + foodRichness * 0.16
            + habitatQuality * 0.2
            + recoveryPressure * 0.08
            + socialValence * socialConfidence * 0.14
            + trainingValence * trainingAffinity * 0.1
            + attachment * 0.08
            + relief * 0.06
            - crowdingPressure * 0.16
            - crowding * 0.12
        );

        const baseAffinity = 0.08;
        const recentTravelAgeSeconds = Number.isFinite(migration.lastTravelAtSeconds)
            ? Math.max(0, this.simulationClockSeconds - migration.lastTravelAtSeconds)
            : Infinity;
        const recentlyCompletedTravel = recentTravelAgeSeconds <= 90;
        const supportsResettling = ['scouting', 'mate-seeking', 'overcrowding', 'migration'].includes(completedTravelReason || migration.lastTravelReason || '');

        if (allowDurableMutation) {
            for (const candidateZoneId of zoneIds) {
                const currentAffinity = this.getMigrationZoneAffinity(migration, candidateZoneId) || baseAffinity;
                if (candidateZoneId === zoneId) {
                    const visitBias = Math.min(0.16, this.getMigrationZoneVisitCount(migration, candidateZoneId) * 0.03);
                    const dwellBias = Math.min(0.16, this.getMigrationZoneDwellSeconds(migration, candidateZoneId) / 180);
                    const arrivalBias = recentlyCompletedTravel && candidateZoneId !== previousHomeZoneId
                        ? (supportsResettling ? 0.18 : 0.08)
                        : 0;
                    const cohortStayBias = candidateZoneId === cohortPreferredZoneId ? cohortPreferredZoneBoost : 0;
                    const targetAffinity = this.clamp01(homeAnchorTarget + visitBias + dwellBias + arrivalBias + cohortStayBias);
                    const lerpRate = recentlyCompletedTravel ? 0.18 : 0.08;
                    migration.zoneAffinities[candidateZoneId] = this.clamp01(this.lerpValue(currentAffinity, targetAffinity, lerpRate));
                } else {
                    const preservedMemory = previousHomeZoneId && candidateZoneId === previousHomeZoneId
                        ? Math.min(0.18, this.getMigrationZoneVisitCount(migration, candidateZoneId) * 0.02)
                        : 0;
                    const cohortMemory = candidateZoneId === cohortPreferredZoneId ? (cohortPreferredZoneBoost * 0.45) : 0;
                    const targetAffinity = this.clamp01(baseAffinity + preservedMemory + cohortMemory);
                    const decayRate = previousHomeZoneId && candidateZoneId === previousHomeZoneId && zoneId !== previousHomeZoneId
                        ? 0.03
                        : 0.01;
                    migration.zoneAffinities[candidateZoneId] = this.clamp01(this.lerpValue(currentAffinity, targetAffinity, decayRate));
                }
            }
        }

        const topZones = this.getTopMigrationZones(migration, zoneIds, zoneIds.length || 4);
        const previousHomeScore = previousHomeZoneId
            ? (topZones.find(entry => entry.zoneId === previousHomeZoneId)?.score || 0)
            : 0;
        const bestZone = topZones[0] || null;
        const currentZoneEntry = topZones.find(entry => entry.zoneId === zoneId) || null;
        const resettleScore = currentZoneEntry
            ? this.clamp01(
                currentZoneEntry.score
                + Math.min(0.16, currentZoneEntry.dwellSeconds / 90)
                + Math.min(0.12, currentZoneEntry.visits * 0.03)
                + (currentZoneEntry.zoneId === cohortPreferredZoneId ? cohortPreferredZoneBoost * 0.5 : 0)
                + (recentlyCompletedTravel && supportsResettling && currentZoneEntry.zoneId !== previousHomeZoneId ? 0.08 : 0)
            )
            : 0;
        const canResettleHome = allowDurableMutation
            && !!currentZoneEntry
            && !!previousHomeZoneId
            && previousHomeZoneId !== zoneId
            && currentZoneEntry.visits >= 2
            && currentZoneEntry.dwellSeconds >= 4
            && supportsResettling;
        const stickyHomeCandidate = previousHomeZoneId && previousHomeScore >= ((bestZone?.score || 0) - 0.05)
            ? topZones.find(entry => entry.zoneId === previousHomeZoneId) || bestZone
            : bestZone;
        const homeZoneCandidate = canResettleHome && resettleScore >= (previousHomeScore - 0.04)
            ? currentZoneEntry
            : stickyHomeCandidate;

        if (allowDurableMutation) {
            migration.homeZoneId = (homeZoneCandidate?.score || 0) >= 0.24
                ? homeZoneCandidate.zoneId
                : (previousHomeZoneId && zoneIds.includes(previousHomeZoneId) ? previousHomeZoneId : zoneId);
            migration.homeZoneStrength = this.clamp01(
                homeZoneCandidate?.zoneId === zoneId
                    ? Math.max(homeZoneCandidate?.score || 0, resettleScore || 0)
                    : (homeZoneCandidate?.score || 0)
            );
        }

        const visitedZoneCount = zoneIds.filter(candidateZoneId => this.getMigrationZoneVisitCount(migration, candidateZoneId) > 0).length;
        const awayFromHome = !!(migration.homeZoneId && migration.homeZoneId !== zoneId);
        const currentZoneAffinity = this.getMigrationZoneAffinity(migration, zoneId);
        const homeZoneAffinity = migration.homeZoneId ? this.getMigrationZoneAffinity(migration, migration.homeZoneId) : currentZoneAffinity;
        const overcrowdingEscape = this.clamp01(crowding * 0.42 + crowdingPressure * 0.38 + threat * 0.14 - socialConfidence * 0.08);

        const zoneMateOpportunities = {};
        for (const candidateZoneId of zoneIds) {
            zoneMateOpportunities[candidateZoneId] = this.countPotentialMateOpportunities(entity, candidateZoneId, gameState);
        }
        const maxMateOpportunities = Math.max(0, ...Object.values(zoneMateOpportunities));
        const mateSeeking = this.clamp01(
            (lifeSim.drives?.socialConnection || 0) * 0.34
            + socialConfidence * 0.24
            + Math.min(0.22, maxMateOpportunities * 0.1)
            - (entity.pregnancy?.active ? 0.6 : 0)
            - (entity.state === 'mating' || entity.state === 'pregnant-travel' ? 0.5 : 0)
        );
        const returnHomeBias = awayFromHome
            ? this.clamp01(homeZoneAffinity * 0.72 + attachment * 0.18 + (lifeSim.drives?.rest || 0) * 0.1 + exhaustion * 0.08 - explorationDrive * 0.18 - overcrowdingEscape * 0.16)
            : 0;

        const maxVisits = Math.max(1, ...zoneIds.map(candidateZoneId => this.getMigrationZoneVisitCount(migration, candidateZoneId)));
        let scoutTargetZoneId = null;
        let scoutTargetScore = -Infinity;
        let preferredMateZoneId = null;
        let preferredMateScore = -Infinity;
        let preferredZoneId = migration.homeZoneId || zoneId;

        for (const candidateZoneId of zoneIds) {
            const candidateAffinity = this.getMigrationZoneAffinity(migration, candidateZoneId);
            const candidateSummary = gameCore?.getZoneEcologySummary?.(candidateZoneId) || {};
            const visitRatio = this.getMigrationZoneVisitCount(migration, candidateZoneId) / maxVisits;
            const noveltyBonus = Math.max(0, 1 - visitRatio);
            const candidateScore = this.clamp01(
                candidateAffinity * 0.28
                + noveltyBonus * 0.3
                + (candidateSummary.migrationPull || 0) * 0.18
                + (candidateSummary.foodRichness || 0) * 0.1
                + (candidateSummary.socialValence || 0) * socialConfidence * 0.12
                + (candidateSummary.trainingValence || 0) * trainingAffinity * 0.1
                + (candidateZoneId === cohortPreferredZoneId ? cohortPreferredZoneBoost * 0.28 : 0)
            );
            if (candidateScore > (topZones.find(entry => entry.zoneId === preferredZoneId)?.score || -Infinity)) {
                preferredZoneId = candidateZoneId;
            }
            if (candidateZoneId !== zoneId && candidateScore > scoutTargetScore) {
                scoutTargetScore = candidateScore;
                scoutTargetZoneId = candidateZoneId;
            }

            if (candidateZoneId !== zoneId) {
                const mateScore = (zoneMateOpportunities[candidateZoneId] || 0) * 0.44 + candidateAffinity * 0.16 + noveltyBonus * 0.1;
                if (mateScore > preferredMateScore) {
                    preferredMateScore = mateScore;
                    preferredMateZoneId = candidateZoneId;
                }
            }
        }

        const scoutingDrive = this.clamp01(
            explorationDrive * 0.72
            + (visitedZoneCount < zoneIds.length ? 0.18 : 0)
            + (scoutTargetScore > 0 ? scoutTargetScore * 0.24 : 0)
            - homeZoneAffinity * 0.16
        );

        let travelIntent = 'settling';
        let travelTargetZoneId = null;
        if (awayFromHome && migration.homeZoneId && returnHomeBias >= Math.max(overcrowdingEscape, mateSeeking * 0.88, scoutingDrive * 0.92) && returnHomeBias > 0.24) {
            travelIntent = 'return-home';
            travelTargetZoneId = migration.homeZoneId;
        } else if (preferredMateZoneId && mateSeeking > 0.3 && (zoneMateOpportunities[preferredMateZoneId] || 0) > (zoneMateOpportunities[zoneId] || 0)) {
            travelIntent = 'mate-seeking';
            travelTargetZoneId = preferredMateZoneId;
        } else if (scoutTargetZoneId && Math.max(overcrowdingEscape, scoutingDrive) > 0.24) {
            travelIntent = overcrowdingEscape > scoutingDrive ? 'overcrowding' : 'scouting';
            travelTargetZoneId = scoutTargetZoneId;
        }

        if (entity?.zoneTravel?.targetZoneId) {
            travelTargetZoneId = entity.zoneTravel.targetZoneId;
        }
        if (entity?.zoneTravel?.reason) {
            travelIntent = entity.zoneTravel.reason;
        }

        const travelUrgency = this.clamp01(
            Math.max(
                returnHomeBias,
                overcrowdingEscape * 0.92,
                mateSeeking * 0.78,
                scoutingDrive * 0.74
            )
            + (options.dwellPressure ?? 0) * 0.18
        );

        const derivedSummary = {
            homeZoneId: migration.homeZoneId || null,
            homeZoneStrength: this.clamp01(migration.homeZoneStrength || 0),
            currentZoneAffinity: this.clamp01(currentZoneAffinity),
            preferredZoneId: preferredZoneId || zoneId,
            scoutTargetZoneId: scoutTargetZoneId || null,
            preferredMateZoneId: preferredMateZoneId || null,
            travelTargetZoneId: travelTargetZoneId || null,
            travelIntent,
            visitedZoneCount,
            awayFromHome,
            returnHomeBias,
            scoutingDrive,
            overcrowdingEscape,
            mateSeeking,
            travelUrgency,
            noveltySeeking: explorationDrive,
            zoneMateOpportunities
        };

        lifeSim.derived.migration = derivedSummary;
        return derivedSummary;
    }

    getMigrationSummary(entity) {
        const migration = entity?.lifeSim?.migration || {};
        const derived = entity?.lifeSim?.derived?.migration || {};
        const zoneIds = gameCore?.getZoneIds?.() || Object.keys(migration.zoneAffinities || {});
        const topZones = this.getTopMigrationZones(migration, zoneIds, 3);
        const homeZoneId = derived.homeZoneId || migration.homeZoneId || topZones[0]?.zoneId || null;
        const homeZoneLabel = this.getZoneDisplayLabel(homeZoneId);
        const travelTargetZoneId = derived.travelTargetZoneId || derived.scoutTargetZoneId || null;
        const travelTargetLabel = travelTargetZoneId ? this.getZoneDisplayLabel(travelTargetZoneId) : null;
        const reasonLabel = (entity?.zoneTravel?.reason || derived.travelIntent || migration.lastTravelReason || 'settling').replace(/-/g, ' ');
        const topZoneText = topZones.length
            ? topZones.map(entry => `${entry.label} ${Math.round(entry.score * 100)}`).join(' | ')
            : 'No zone anchors yet';
        const headlineParts = [`home ${homeZoneLabel} ${Math.round((derived.homeZoneStrength || migration.homeZoneStrength || 0) * 100)}`];
        if (travelTargetLabel && travelTargetZoneId !== homeZoneId) {
            const shortLabel = reasonLabel === 'mate seeking'
                ? 'mate'
                : reasonLabel === 'return home'
                    ? 'return'
                    : reasonLabel === 'overcrowding'
                        ? 'escape'
                        : 'scout';
            headlineParts.push(`${shortLabel} ${travelTargetLabel}`);
        }
        headlineParts.push(`travel ${Math.round((derived.travelUrgency || 0) * 100)}`);

        return {
            homeZoneId,
            homeZoneLabel,
            travelTargetZoneId,
            travelTargetLabel,
            preferredMateZoneId: derived.preferredMateZoneId || null,
            preferredMateLabel: derived.preferredMateZoneId ? this.getZoneDisplayLabel(derived.preferredMateZoneId) : null,
            reasonLabel,
            visitedZoneCount: derived.visitedZoneCount || 0,
            awayFromHome: !!derived.awayFromHome,
            headline: headlineParts.join(' | '),
            detail: `${topZoneText}${migration.lastTravelReason ? ` | last ${String(migration.lastTravelReason).replace(/-/g, ' ')}` : ''}`,
            topZones,
            urgency: Math.round((derived.travelUrgency || 0) * 100),
            returnHomeBias: Math.round((derived.returnHomeBias || 0) * 100),
            scoutingDrive: Math.round((derived.scoutingDrive || 0) * 100),
            overcrowdingEscape: Math.round((derived.overcrowdingEscape || 0) * 100),
            mateSeeking: Math.round((derived.mateSeeking || 0) * 100)
        };
    }

    updateDerivedState(lifeSim, options = {}) {
        const drivePeaks = this.getTopLabels(lifeSim.drives, 2);
        const emotionPeaks = this.getTopLabels(lifeSim.emotions, 2);
        const social = lifeSim.social || {};
        const distortion = lifeSim.distortion || {};
        const socialEcology = options.socialEcology || lifeSim.derived?.socialEcology || null;

        lifeSim.social.focus = drivePeaks[0]?.label || 'rest';
        lifeSim.derived.dominantDrive = drivePeaks[0]?.label || 'rest';
        lifeSim.derived.secondaryDrive = drivePeaks[1]?.label || lifeSim.derived.dominantDrive;
        lifeSim.derived.dominantEmotion = emotionPeaks[0]?.label || 'curiosity';
        lifeSim.derived.secondaryEmotion = emotionPeaks[1]?.label || lifeSim.derived.dominantEmotion;
        lifeSim.derived.drivePeaks = drivePeaks;
        lifeSim.derived.emotionPeaks = emotionPeaks;
        lifeSim.derived.crowding = options.crowding ?? 0;
        lifeSim.derived.novelty = options.novelty ?? 0;
        lifeSim.derived.behaviorBiases = {
            wanderScale: this.clamp01(
                0.5
                + lifeSim.drives.exploration * 0.75
                + social.confidence * 0.2
                - lifeSim.drives.rest * 0.3
                - distortion.withdrawalBias * 0.12
                - (options.lingerBias ?? 0) * 0.18
            ) + 0.1,
            feedUrgency: this.clamp01(lifeSim.drives.resourceControl * 0.72 + lifeSim.emotions.failure * 0.18 + lifeSim.drives.selfMaintenance * 0.1),
            displayConfidence: this.clamp01(
                lifeSim.drives.statusExpression * 0.46
                + lifeSim.emotions.significance * 0.34
                + social.confidence * 0.28
                + distortion.fixationBias * 0.08
                - lifeSim.emotions.threat * 0.16
                - distortion.withdrawalBias * 0.12
                + (options.displayConfidenceBoost ?? 0)
            ),
            socialConfidence: this.clamp01(
                lifeSim.drives.socialConnection * 0.34
                + social.belonging * 0.34
                + social.confidence * 0.22
                - lifeSim.emotions.rejection * 0.18
                - distortion.withdrawalBias * 0.2
                + (options.socialConfidenceBoost ?? 0)
            ),
            caution: this.clamp01(
                lifeSim.drives.safetyAvoidance * 0.44
                + lifeSim.emotions.threat * 0.34
                + distortion.anxietyBias * 0.22
                + distortion.traumaBias * 0.14
                + distortion.withdrawalBias * 0.08
                + (options.cautionBias ?? 0) * 0.35
                + (options.cautionBoost ?? 0)
            ),
            trainingAffinity: this.clamp01((options.trainingAffinity ?? 0) + (options.trainingAffinityBoost ?? 0)),
            objectInterest: this.clamp01((options.objectInterest ?? 0) + distortion.fixationBias * 0.12),
            cursorAffinity: this.clamp01((options.cursorAffinity ?? 0) - distortion.traumaBias * 0.12 - distortion.anxietyBias * 0.05),
            shelterSeeking: this.clamp01(
                (options.shelterSeeking ?? 0)
                + distortion.traumaBias * 0.14
                + distortion.insomniaBias * 0.04
                + (options.shelterSeekingBoost ?? 0)
            ),
            battleAggression: this.clamp01((options.battleAggression ?? 0) + distortion.fixationBias * 0.08 - distortion.withdrawalBias * 0.08),
            followThroughDrive: this.clamp01(options.followThroughDrive ?? 0),
            socialAvoidance: this.clamp01(options.socialAvoidance ?? 0),
            migrationUrgency: this.clamp01(options.migrationUrgency ?? 0),
            returnHomeBias: this.clamp01(options.returnHomeBias ?? 0),
            noveltySeeking: this.clamp01(options.noveltySeeking ?? 0),
            mateSeeking: this.clamp01((options.mateSeeking ?? 0) + (options.mateSeekingBoost ?? 0)),
            overcrowdingEscape: this.clamp01(options.overcrowdingEscape ?? 0),
            homeAffinity: this.clamp01(options.homeAffinity ?? 0)
        };
        lifeSim.derived.migration = {
            homeZoneId: options.homeZoneId || null,
            homeZoneStrength: this.clamp01(options.homeZoneStrength ?? 0),
            currentZoneAffinity: this.clamp01(options.currentZoneAffinity ?? 0),
            preferredZoneId: options.preferredZoneId || null,
            scoutTargetZoneId: options.scoutTargetZoneId || null,
            preferredMateZoneId: options.preferredMateZoneId || null,
            travelTargetZoneId: options.travelTargetZoneId || null,
            travelIntent: options.travelIntent || 'settling',
            visitedZoneCount: Math.max(0, options.visitedZoneCount || 0),
            awayFromHome: !!options.awayFromHome,
            returnHomeBias: this.clamp01(options.returnHomeBias ?? 0),
            scoutingDrive: this.clamp01(options.scoutingDrive ?? 0),
            overcrowdingEscape: this.clamp01(options.overcrowdingEscape ?? 0),
            mateSeeking: this.clamp01(options.mateSeeking ?? 0),
            travelUrgency: this.clamp01(options.migrationUrgency ?? 0),
            noveltySeeking: this.clamp01(options.noveltySeeking ?? 0),
            zoneMateOpportunities: { ...(options.zoneMateOpportunities || {}) }
        };
        if (socialEcology) {
            lifeSim.derived.socialEcology = JSON.parse(JSON.stringify(socialEcology));
        }
        lifeSim.derived.lastUpdatedSeconds = this.simulationClockSeconds;
        lifeSim.derived.lastUpdatedFrame = Number.isFinite(options.currentFrame)
            ? options.currentFrame
            : (lifeSim.derived.lastUpdatedFrame || 0);
        lifeSim.derived.cadenceIntervalFrames = Math.max(
            1,
            Math.round(options.cadenceIntervalFrames ?? lifeSim.derived.cadenceIntervalFrames ?? 1)
        );
    }

    refreshButterflyDerivedState(entity, gameState, options = {}) {
        const lifeSim = this.ensureLifeSimState(entity);
        if (!lifeSim) return;
        const currentFrame = Number.isFinite(options.currentFrame)
            ? options.currentFrame
            : (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0));
        const cadenceIntervalFrames = Math.max(1, Math.round(options.cadenceIntervalFrames ?? 1));
        const runtime = this.ensureRuntimeState(entity.id);

        const zoneId = this.getZoneId(entity);
        lifeSim.lifecycle.currentZoneId = zoneId;
        const zoneFlowers = this.getFlowersInZone(zoneId, gameState);
        const nearbyCount = typeof entity.getNearbyButterflyCount === 'function'
            ? entity.getNearbyButterflyCount(92)
            : Math.max(0, this.getButterfliesInZone(zoneId, gameState).length - 1);
        const crowding = this.clamp01(nearbyCount / 6);
        const trainingStrength = this.getRoutineStrength(entity, 'teaching');
        const novelty = this.clamp01(1 - Math.min(1, this.getMemoryDensity(entity, 'place') / 10));
        const zoneInfluence = this.getZoneLifeSimInfluence(zoneId, entity);
        const zoneBlocks = gameCore?.getBlocksInZone?.(zoneId) || [];
        const nearbyBlockCount = this.getNearbyEntityCount(entity, zoneBlocks, 74, block => !block?.carriedById);
        const spatialContext = typeof structureSystem !== 'undefined'
            ? structureSystem.getSpatialContextForEntity?.(entity, gameState)
            : null;
        const happinessRange = Math.max(1, (entity.maxHappiness || 100) - (entity.baselineHappiness || 30));
        const happinessRatio = this.clamp01(((entity.happiness || 0) - (entity.baselineHappiness || 0)) / happinessRange);
        const cursorTrust = this.clamp01(entity.cursor?.trustLevel ? (entity.cursor.trustLevel / 100) : (lifeSim.playerInteraction?.cursorTrust || 0));
        const cursorFear = this.clamp01(entity.cursor?.clapFear ?? lifeSim.playerInteraction?.cursorFear ?? 0);
        const isCarryingObject = !!entity.blockInteraction?.carryingBlockId;
        const currentAffordance = entity.pregnancy?.active
            ? 'drop'
            : entity.pendingPollenDropTarget
                ? 'plant'
                : isCarryingObject
                    ? 'stack'
                    : spatialContext?.shelterCandidate && !zoneFlowers.length
                        ? 'shelterUse'
                        : zoneFlowers.length
                            ? 'feedFrom'
                            : nearbyBlockCount > 0
                                ? 'carry'
                                : 'observe';
        const focusType = entity.pregnancy?.active
            ? 'egg'
            : entity.pendingPollenDropTarget
                ? 'pollen'
                : isCarryingObject || entity.blockInteraction?.targetBlockId
                    ? 'block'
                    : zoneFlowers.length
                        ? 'flower'
                        : spatialContext?.shelterCandidate
                            ? 'block'
                            : 'none';
        const obstacleDensity = spatialContext?.obstacleDensity ?? this.clamp01(nearbyBlockCount / 6);
        const nearbyButterflies = this.getButterfliesInZone(zoneId, gameState).filter(item => item !== entity);
        const nearbyAllies = nearbyButterflies.filter(candidate => (candidate.birthSource || 'wild') === (entity.birthSource || 'wild'));
        const nearbyRivals = nearbyButterflies.filter(candidate => candidate.personalityType !== entity.personalityType);
        const nearbyPressedAllies = nearbyAllies.filter(candidate => (candidate.battleState?.pressure || 0) >= 3);
        const attachment = this.getAverageEdgeValue(entity, ['trust', 'comfort', 'attachment']);
        const rejection = this.getAverageEdgeValue(entity, ['resentment', 'rivalry']);
        const rarityExposure = this.clamp01((gameState?.encounteredButterflies?.size || 0) / 7);
        const variantFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'social') / 12);
        const lineageValue = this.clamp01(
            ((entity.birthSource === 'bred' || entity.isHybrid) ? 0.42 : 0.14) +
            ((entity.lifeSim?.genetics?.lineageIds?.parents?.length || 0) * 0.18)
        );
        const encounterValue = this.clamp01(
            (entity.birthSource === 'wild' ? 0.34 : 0.2) +
            (entity.personality?.rarity === 'legendary' ? 0.42 : entity.personality?.rarity === 'epic' ? 0.24 : 0.08)
        );
        const releaseEcology = this.getReleaseEcologyInfluence(entity, gameState);
        const releaseWaveSeeded = releaseEcology?.seededBy === 'release-wave';
        const adjustedVariantFamiliarity = this.clamp01(variantFamiliarity + (releaseEcology?.cohortFamiliarityBoost || 0));
        const adjustedLineageValue = this.clamp01(lineageValue + (releaseWaveSeeded ? (releaseEcology?.lineageMatchShare || 0) * 0.08 : 0));
        const adjustedEncounterValue = this.clamp01(encounterValue + (releaseWaveSeeded ? 0.04 : 0));

        lifeSim.lifecycle.zoneIdentity = zoneInfluence.identityLabel;
        lifeSim.lifecycle.zoneTags = zoneInfluence.identityTags;
        lifeSim.social.activeContext = this.getButterflyContext(entity, zoneId);
        lifeSim.objectAwareness.focusType = focusType;
        lifeSim.objectAwareness.currentAffordance = currentAffordance;
        lifeSim.objectAwareness.carryingType = isCarryingObject ? 'block' : null;
        lifeSim.objectAwareness.flowerFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'object', 'flower') / 10);
        lifeSim.objectAwareness.pollenFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'object', 'pollen') / 8);
        lifeSim.objectAwareness.eggFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'care', 'egg') / 8);
        lifeSim.objectAwareness.blockFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'object', 'block') / 10);
        lifeSim.playerInteraction.cursorTrust = cursorTrust;
        lifeSim.playerInteraction.cursorFear = cursorFear;
        lifeSim.playerInteraction.calmedByCursor = !!entity.cursor?.calmedByCursor;
        lifeSim.spatialAwareness.verticality = spatialContext?.verticality || (isCarryingObject ? 'overhead' : 'ground');
        lifeSim.spatialAwareness.structureRole = spatialContext?.structureRole || 'loose';
        lifeSim.spatialAwareness.pathState = spatialContext?.pathState || (obstacleDensity > 0.55 ? 'obstructed' : obstacleDensity > 0.22 ? 'enterable' : 'open');
        lifeSim.spatialAwareness.bodyFit = spatialContext?.bodyFit || ((entity.blockInteraction?.lastRelativeSize || 0) > 1.05 ? 'tooNarrow' : 'canPass');
        lifeSim.spatialAwareness.obstacleDensity = obstacleDensity;
        lifeSim.spatialAwareness.shelterCandidate = !!spatialContext?.shelterCandidate;
        lifeSim.spatialAwareness.canUseInterior = !!spatialContext?.canUseInterior;
        lifeSim.progression.originType = entity.birthSource === 'bred' ? 'bred' : 'wild';
        lifeSim.progression.rarityExposure = rarityExposure;
        lifeSim.progression.variantFamiliarity = adjustedVariantFamiliarity;
        lifeSim.progression.lineageValue = adjustedLineageValue;
        lifeSim.progression.encounterValue = adjustedEncounterValue;
        lifeSim.battleContext.spacingState = obstacleDensity > 0.5 ? 'tight' : nearbyCount > 3 ? 'crowded' : 'open';
        lifeSim.battleContext.allyPressure = this.clamp01((nearbyPressedAllies.length / Math.max(1, nearbyAllies.length || 1)) + (entity.battleState?.pressure || 0) * 0.03);
        lifeSim.battleContext.enemyThreat = this.clamp01(((lifeSim.emotions?.threat || 0) * 0.58) + (nearbyRivals.length * 0.08) + rejection * 0.12);
        lifeSim.battleContext.targetPriority = this.clamp01(
            ((lifeSim.drives?.statusExpression || 0) * 0.22)
            + ((lifeSim.drives?.resourceControl || 0) * 0.18)
            + ((lifeSim.derived?.behaviorBiases?.feedUrgency || 0) * 0.28)
        );
        lifeSim.battleContext.retreatPressure = this.clamp01(((entity.battleState?.pressure || 0) * 0.04) + (lifeSim.emotions?.exhaustion || 0) * 0.45 + (lifeSim.emotions?.threat || 0) * 0.32);
        lifeSim.battleContext.supportOpportunity = this.clamp01((nearbyAllies.length * 0.08) + attachment * 0.24 + (lifeSim.drives?.socialConnection || 0) * 0.2);
        const migrationSummary = this.syncMigrationState(entity, gameState, {
            zoneId,
            zoneSummary: zoneInfluence?.zoneSummary || null,
            deltaSeconds: Number.isFinite(options.deltaSeconds) ? options.deltaSeconds : 0,
            crowding,
            novelty,
            attachment,
            socialConfidence: lifeSim.social?.confidence || 0,
            trainingAffinity: this.clamp01(trainingStrength + (lifeSim.social?.confidence || 0) * 0.25 + zoneInfluence.derived.trainingAffinity),
            curiosity: lifeSim.emotions?.curiosity || 0,
            relief: lifeSim.emotions?.relief || 0,
            exhaustion: lifeSim.emotions?.exhaustion || 0,
            threat: lifeSim.emotions?.threat || 0,
            crowdingPressure: zoneInfluence?.zoneSummary?.crowdingPressure || 0,
            cohortPreferredZoneId: releaseEcology?.preferredZoneId || null,
            cohortPreferredZoneBoost: releaseEcology?.cohortPreferredZoneBoost || 0
        });
        const socialEcology = this.getSocialEcologySummary(entity, gameState, {
            zoneId,
            nearbyButterflies,
            spatialContext,
            zoneInfluence,
            zoneSummary: zoneInfluence?.zoneSummary || null,
            trainingAffinity: this.clamp01(trainingStrength + (lifeSim.social?.confidence || 0) * 0.25 + zoneInfluence.derived.trainingAffinity),
            mateSeeking: migrationSummary?.mateSeeking || 0
        });
        lifeSim.social.activeContext = this.resolveActiveSocialContext(entity, zoneId, socialEcology);

        this.updateDerivedState(lifeSim, {
            crowding,
            novelty,
            cautionBias: this.clamp01(zoneInfluence.derived.cautionBias || 0),
            trainingAffinity: this.clamp01(trainingStrength + (lifeSim.social?.confidence || 0) * 0.25 + zoneInfluence.derived.trainingAffinity),
            trainingAffinityBoost: (socialEcology?.teaching?.score || 0) * 0.22,
            objectInterest: this.clamp01((focusType === 'block' ? 0.36 : focusType === 'flower' ? 0.24 : 0.08) + lifeSim.objectAwareness.blockFamiliarity * 0.18 + (lifeSim.emotions?.curiosity || 0) * 0.24 + zoneInfluence.derived.objectInterest),
            cursorAffinity: this.clamp01((lifeSim.playerInteraction.cursorTrust || 0) * 0.72 + (lifeSim.playerInteraction.calmedByCursor ? 0.18 : 0) - (lifeSim.playerInteraction.cursorFear || 0) * 0.28),
            shelterSeeking: this.clamp01(
                (spatialContext?.shelterCandidate ? 0.32 : 0.08)
                + obstacleDensity * 0.24
                + (lifeSim.emotions?.threat || 0) * 0.26
                + (spatialContext?.insideShelter ? 0.12 : 0)
                + (spatialContext?.canUseInterior ? 0.08 : 0)
                + zoneInfluence.derived.shelterSeeking
            ),
            shelterSeekingBoost: ((socialEcology?.roosting?.score || 0) * 0.18) + ((socialEcology?.warning?.score || 0) * 0.24),
            battleAggression: this.clamp01((lifeSim.battleContext.targetPriority || 0) * 0.44 + (lifeSim.social?.confidence || 0) * 0.18 - (lifeSim.battleContext.retreatPressure || 0) * 0.16 + zoneInfluence.derived.battleAggression),
            displayConfidenceBoost: ((socialEcology?.courtship?.score || 0) * 0.14) + ((socialEcology?.teaching?.score || 0) * 0.06),
            socialConfidenceBoost: ((socialEcology?.teaching?.score || 0) * 0.12) + ((socialEcology?.courtship?.score || 0) * 0.1),
            cautionBoost: (socialEcology?.warning?.score || 0) * 0.22,
            migrationUrgency: migrationSummary?.travelUrgency || 0,
            returnHomeBias: migrationSummary?.returnHomeBias || 0,
            noveltySeeking: migrationSummary?.noveltySeeking || 0,
            mateSeeking: migrationSummary?.mateSeeking || 0,
            mateSeekingBoost: (socialEcology?.courtship?.score || 0) * 0.16,
            overcrowdingEscape: migrationSummary?.overcrowdingEscape || 0,
            homeAffinity: migrationSummary?.homeZoneStrength || migrationSummary?.currentZoneAffinity || 0,
            homeZoneId: migrationSummary?.homeZoneId || null,
            homeZoneStrength: migrationSummary?.homeZoneStrength || 0,
            currentZoneAffinity: migrationSummary?.currentZoneAffinity || 0,
            preferredZoneId: migrationSummary?.preferredZoneId || null,
            scoutTargetZoneId: migrationSummary?.scoutTargetZoneId || null,
            preferredMateZoneId: migrationSummary?.preferredMateZoneId || null,
            travelTargetZoneId: migrationSummary?.travelTargetZoneId || null,
            travelIntent: migrationSummary?.travelIntent || 'settling',
            visitedZoneCount: migrationSummary?.visitedZoneCount || 0,
            awayFromHome: migrationSummary?.awayFromHome || false,
            scoutingDrive: migrationSummary?.scoutingDrive || 0,
            zoneMateOpportunities: migrationSummary?.zoneMateOpportunities || {},
            socialEcology,
            currentFrame,
            cadenceIntervalFrames
        });
        if (runtime) {
            runtime.lastDeepUpdateFrame = currentFrame;
            runtime.lastZoneId = zoneId;
            runtime.lastState = entity?.state || 'normal';
            runtime.pendingDeepRefresh = false;
            runtime.pendingRefreshReason = null;
        }
    }

    refreshCaterpillarDerivedState(entity, gameState, options = {}) {
        const lifeSim = this.ensureLifeSimState(entity);
        if (!lifeSim) return;
        const currentFrame = Number.isFinite(options.currentFrame)
            ? options.currentFrame
            : (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0));
        const cadenceIntervalFrames = Math.max(1, Math.round(options.cadenceIntervalFrames ?? 1));
        const runtime = this.ensureRuntimeState(entity.id);

        const zoneId = this.getZoneId(entity);
        lifeSim.lifecycle.currentZoneId = zoneId;
        const flowerCount = this.getFlowersInZone(zoneId, gameState).length;
        this.updateDerivedState(lifeSim, {
            crowding: 0,
            novelty: this.clamp01(flowerCount <= 1 ? 0.35 : 0.15),
            trainingAffinity: 0,
            objectInterest: 0.12,
            cursorAffinity: 0,
            shelterSeeking: 0,
            battleAggression: 0,
            currentFrame,
            cadenceIntervalFrames
        });
        if (runtime) {
            runtime.lastDeepUpdateFrame = currentFrame;
            runtime.lastZoneId = zoneId;
            runtime.lastState = entity?.state || 'normal';
            runtime.pendingDeepRefresh = false;
            runtime.pendingRefreshReason = null;
        }
    }

    rebuildDerivedState(gameState, options = {}) {
        for (const butterfly of gameState?.butterflies || []) {
            this.refreshButterflyDerivedState(butterfly, gameState, {
                deltaSeconds: Number.isFinite(options.deltaSeconds) ? options.deltaSeconds : 0,
                currentFrame: Number.isFinite(options.currentFrame) ? options.currentFrame : (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0)),
                cadenceIntervalFrames: Math.max(1, Math.round(options.cadenceIntervalFrames ?? 1))
            });
        }
        for (const caterpillar of gameState?.caterpillars || []) {
            this.refreshCaterpillarDerivedState(caterpillar, gameState, {
                currentFrame: Number.isFinite(options.currentFrame) ? options.currentFrame : (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0)),
                cadenceIntervalFrames: Math.max(1, Math.round(options.cadenceIntervalFrames ?? 1))
            });
        }
    }

    updateButterfly(entity, gameState, options = {}) {
        const lifeSim = this.ensureLifeSimState(entity);
        if (!lifeSim) return;
        const currentFrame = Number.isFinite(options.currentFrame)
            ? options.currentFrame
            : (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0));
        const cadenceIntervalFrames = Math.max(1, Math.round(options.cadenceIntervalFrames ?? 1));
        const runtime = this.ensureRuntimeState(entity.id);
        const deepUpdate = options.deepUpdate !== false;

        const zoneId = this.getZoneId(entity);
        lifeSim.lifecycle.currentZoneId = zoneId;
        if (runtime) {
            runtime.lastZoneId = zoneId;
        }
        if (!deepUpdate) {
            lifeSim.derived.cadenceIntervalFrames = cadenceIntervalFrames;
            return {
                deepUpdate: false,
                lastValidFrame: lifeSim.derived?.lastUpdatedFrame || 0,
                cadenceIntervalFrames,
                cadenceOffset: runtime?.cadenceOffset ?? 0
            };
        }
        const zoneFlowers = this.getFlowersInZone(zoneId, gameState);
        const nearbyCount = typeof entity.getNearbyButterflyCount === 'function' ? entity.getNearbyButterflyCount(92) : Math.max(0, this.getButterfliesInZone(zoneId, gameState).length - 1);
        const crowding = this.clamp01(nearbyCount / 6);
        const attachment = this.getAverageEdgeValue(entity, ['trust', 'comfort', 'attachment']);
        const admiration = this.getAverageEdgeValue(entity, ['admiration', 'protectiveness']);
        const rejection = this.getAverageEdgeValue(entity, ['resentment', 'rivalry']);
        const conversationTexture = this.getAverageConversationTexture(entity);
        const recentWarmth = conversationTexture.warmth;
        const recentEase = conversationTexture.ease;
        const recentFriction = conversationTexture.friction;
        const recentMutualAttention = conversationTexture.mutualAttention;
        const communicationActivity = this.getCommunicationActivity(entity);
        const lessons = lifeSim.upbringing?.lessons?.length || 0;
        const trainingStrength = this.getRoutineStrength(entity, 'teaching');
        const movementRoutineStrength = this.getRoutineStrength(entity, 'movement');
        const socialRoutineStrength = this.getRoutineStrength(entity, 'social');
        const careRoutineStrength = this.getRoutineStrength(entity, 'care');
        const resourceRoutineStrength = this.getRoutineStrength(entity, 'resource');
        const restRoutineStrength = this.getRoutineStrength(entity, 'rest');
        const vigilanceRoutineStrength = this.getRoutineStrength(entity, 'vigilance');
        const novelty = this.clamp01(1 - Math.min(1, this.getMemoryDensity(entity, 'place') / 10));
        const placeMemoryDensity = this.clamp01(this.getMemoryDensity(entity, 'place') / 12);
        const socialMemoryDensity = this.clamp01(this.getMemoryDensity(entity, 'social') / 12);
        const interactionMemoryDensity = this.clamp01(this.getMemoryDensity(entity, 'interaction') / 12);
        const outcomeMemoryDensity = this.clamp01(this.getMemoryDensity(entity, 'outcome') / 12);
        const routineMemoryDensity = this.clamp01(this.getMemoryDensity(entity, 'routine') / 10);
        const dangerMemoryDensity = this.clamp01(this.getMemoryDensity(entity, 'danger') / 10);
        const careMemoryDensity = this.clamp01(this.getMemoryDensity(entity, 'care') / 10);
        const strongestLessonReinforcement = this.getStrongestUpbringingReinforcement(entity);
        const lessonReinforcementStrength = strongestLessonReinforcement?.value || 0;
        const lessonDepth = this.clamp01((lessons / 10) + lessonReinforcementStrength * 0.6);
        const zoneInfluence = this.getZoneLifeSimInfluence(zoneId, entity);
        const warningPressure = lifeSim.communication?.recentReceived?.some(entry => entry?.signalType === 'warning_signal') ? 0.2 : 0;
        const calmPressure = lifeSim.communication?.recentReceived?.some(entry => entry?.signalType === 'calming_signal') ? 0.18 : 0;
        const activeConversationBonus = lifeSim.communication?.activeConversation ? 0.06 : 0;
        const specialAbility = entity.getSpecialAbility?.() || entity.specialAbility || null;
        const reputationBias = specialAbility === 'teacher' ? 0.18 : 0;
        const rarityBias = entity.personality?.rarity === 'legendary' ? 0.28 : entity.personality?.rarity === 'epic' ? 0.12 : 0;
        const flowerAvailability = zoneFlowers.length
            ? this.clamp01(zoneFlowers.filter(flower => flower?.canAcceptButterfly?.(entity) ?? true).length / zoneFlowers.length)
            : 0;
        const zoneBlocks = gameCore?.getBlocksInZone?.(zoneId) || [];
        const nearbyBlockCount = this.getNearbyEntityCount(entity, zoneBlocks, 74, block => !block?.carriedById);
        const spatialContext = typeof structureSystem !== 'undefined'
            ? structureSystem.getSpatialContextForEntity?.(entity, gameState)
            : null;
        const nearbyButterflies = this.getButterfliesInZone(zoneId, gameState).filter(item => item !== entity);
        const nearbyAllies = nearbyButterflies.filter(candidate => (candidate.birthSource || 'wild') === (entity.birthSource || 'wild'));
        const nearbyRivals = nearbyButterflies.filter(candidate => candidate.personalityType !== entity.personalityType);
        const nearbyPressedAllies = nearbyAllies.filter(candidate => (candidate.battleState?.pressure || 0) >= 3);
        const stateThreat = entity.state === 'scared' ? 0.8 : 0;
        const stateCare = entity.pregnancy ? 0.55 : 0;
        const stateDisplay = entity.state === 'display' ? 0.2 : 0;
        const stateFeedFocus = (entity.state === 'feeding' || entity.movement?.targetType === 'goal') ? 0.2 : 0;
        const sleepState = typeof sleepSystem !== 'undefined' ? sleepSystem.getSleepState?.(entity.id) : null;
        const isSleeping = !!sleepState?.subtype;
        const happinessRange = Math.max(1, (entity.maxHappiness || 100) - (entity.baselineHappiness || 30));
        const happinessRatio = this.clamp01(((entity.happiness || 0) - (entity.baselineHappiness || 0)) / happinessRange);
        const hungerPressure = this.clamp01(1 - happinessRatio);
        const cursorTrust = this.clamp01((entity.cursor?.trustLevel || 0) / 100);
        const cursorFear = this.clamp01(entity.cursor?.clapFear || 0);
        const isCarryingObject = !!entity.blockInteraction?.carryingBlockId;
        const currentAffordance = entity.pregnancy?.active
            ? 'drop'
            : entity.pendingPollenDropTarget
                ? 'plant'
                : isCarryingObject
                    ? 'stack'
                    : spatialContext?.shelterCandidate && !zoneFlowers.length
                        ? 'shelterUse'
                    : zoneFlowers.length
                        ? 'feedFrom'
                        : nearbyBlockCount > 0
                            ? 'carry'
                            : 'observe';
        const focusType = entity.pregnancy?.active
            ? 'egg'
            : entity.pendingPollenDropTarget
                ? 'pollen'
                : isCarryingObject || entity.blockInteraction?.targetBlockId
                    ? 'block'
                    : zoneFlowers.length
                        ? 'flower'
                        : spatialContext?.shelterCandidate
                            ? 'block'
                        : 'none';
        const obstacleDensity = spatialContext?.obstacleDensity ?? this.clamp01(nearbyBlockCount / 6);
        const structureRole = spatialContext?.structureRole || 'loose';
        const verticality = isCarryingObject
            ? 'overhead'
            : (spatialContext?.verticality || 'ground');
        const bodyFit = spatialContext?.bodyFit || ((entity.blockInteraction?.lastRelativeSize || 0) > 1.05 ? 'tooNarrow' : 'canPass');
        const pathState = spatialContext?.pathState || (obstacleDensity > 0.55 ? 'obstructed' : obstacleDensity > 0.22 ? 'enterable' : 'open');
        const shelterCandidate = !!spatialContext?.shelterCandidate;
        const resourceFocusPressure = this.clamp01(
            stateFeedFocus
            + (focusType === 'flower' ? 0.16 : 0)
            + (focusType === 'pollen' ? 0.28 : 0)
            + (focusType === 'block' ? 0.12 : 0)
            + (currentAffordance === 'feedFrom' ? 0.24 : 0)
            + (currentAffordance === 'plant' ? 0.34 : 0)
            + (currentAffordance === 'stack' ? 0.18 : 0)
            + (currentAffordance === 'carry' ? 0.12 : 0)
            + (isCarryingObject ? 0.08 : 0)
        );
        const rarityExposure = this.clamp01((gameState?.encounteredButterflies?.size || 0) / 7);
        const variantFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'social') / 12);
        const lineageValue = this.clamp01(
            ((entity.birthSource === 'bred' || entity.isHybrid) ? 0.42 : 0.14) +
            ((entity.lifeSim?.genetics?.lineageIds?.parents?.length || 0) * 0.18)
        );
        const encounterValue = this.clamp01(
            (entity.birthSource === 'wild' ? 0.34 : 0.2) +
            (entity.personality?.rarity === 'legendary' ? 0.42 : entity.personality?.rarity === 'epic' ? 0.24 : 0.08)
        );
        const releaseEcology = this.getReleaseEcologyInfluence(entity, gameState);
        const releaseWaveSeeded = releaseEcology?.seededBy === 'release-wave';
        const adjustedVariantFamiliarity = this.clamp01(variantFamiliarity + (releaseEcology?.cohortFamiliarityBoost || 0));
        const adjustedLineageValue = this.clamp01(lineageValue + (releaseWaveSeeded ? (releaseEcology?.lineageMatchShare || 0) * 0.08 : 0));
        const adjustedEncounterValue = this.clamp01(encounterValue + (releaseWaveSeeded ? 0.04 : 0));
        const allyPressure = this.clamp01((nearbyPressedAllies.length / Math.max(1, nearbyAllies.length || 1)) + (entity.battleState?.pressure || 0) * 0.03);
        const enemyThreat = this.clamp01(((lifeSim.emotions?.threat || 0) * 0.58) + (nearbyRivals.length * 0.08) + rejection * 0.12);

        const driveTargets = {
            selfMaintenance: this.clamp01(0.14 + hungerPressure * 0.45 + resourceFocusPressure * 0.22 + stateThreat * 0.18 + rejection * 0.1 + outcomeMemoryDensity * 0.06 + restRoutineStrength * 0.05 + zoneInfluence.drives.selfMaintenance),
            safetyAvoidance: this.clamp01(0.12 + crowding * 0.24 + stateThreat * 0.56 + warningPressure + dangerMemoryDensity * 0.18 + vigilanceRoutineStrength * 0.18 + (lifeSim.distortion?.anxietyBias || 0) * 0.18 + (lifeSim.distortion?.traumaBias || 0) * 0.14 + zoneInfluence.drives.safetyAvoidance),
            resourceControl: this.clamp01(0.12 + hungerPressure * 0.58 + stateFeedFocus + resourceFocusPressure * 0.36 + (1 - flowerAvailability) * 0.12 + resourceRoutineStrength * 0.18 + outcomeMemoryDensity * 0.06 + zoneInfluence.drives.resourceControl),
            socialConnection: this.clamp01(0.1 + (1 - attachment) * 0.22 + communicationActivity.received * 0.03 + activeConversationBonus + trainingStrength * 0.15 + socialRoutineStrength * 0.16 + socialMemoryDensity * 0.08 + interactionMemoryDensity * 0.08 + lessonDepth * 0.08 + recentWarmth * 0.16 + recentEase * 0.12 + recentMutualAttention * 0.12 - recentFriction * 0.16 - resourceFocusPressure * 0.14 + zoneInfluence.drives.socialConnection),
            caregiving: this.clamp01(0.05 + stateCare + admiration * 0.1 + careRoutineStrength * 0.18 + careMemoryDensity * 0.2 + zoneInfluence.drives.caregiving),
            exploration: this.clamp01(0.1 + novelty * 0.34 + happinessRatio * 0.2 - crowding * 0.24 - stateCare * 0.3 - resourceFocusPressure * 0.18 - (isSleeping ? 0.4 : 0) + movementRoutineStrength * 0.12 + placeMemoryDensity * 0.06 + routineMemoryDensity * 0.05 + zoneInfluence.drives.exploration),
            statusExpression: this.clamp01(0.1 + rarityBias + reputationBias + admiration * 0.22 + stateDisplay + communicationActivity.emitted * 0.03 + trainingStrength * 0.08 + lessonDepth * 0.08 + zoneInfluence.drives.statusExpression),
            rest: this.clamp01(0.08 + (lifeSim.emotions?.exhaustion || 0) * 0.74 + (isSleeping ? 0.18 : 0) + restRoutineStrength * 0.14 + (lifeSim.distortion?.oversleepBias || 0) * 0.08 - (lifeSim.distortion?.insomniaBias || 0) * 0.06 + zoneInfluence.drives.rest)
        };

        const emotionTargets = {
            threat: this.clamp01(stateThreat + driveTargets.safetyAvoidance * 0.34 + warningPressure + dangerMemoryDensity * 0.16 + (lifeSim.distortion?.traumaBias || 0) * 0.14 - calmPressure * 0.4 + zoneInfluence.emotions.threat),
            relief: this.clamp01(calmPressure + attachment * 0.24 + careMemoryDensity * 0.06 + (entity.state === 'feeding' ? 0.22 : 0) + (isSleeping ? 0.28 : 0) + recentWarmth * 0.16 + recentEase * 0.12 - recentFriction * 0.12 + zoneInfluence.emotions.relief),
            attachment: this.clamp01(attachment + communicationActivity.received * 0.025 + trainingStrength * 0.08 + careMemoryDensity * 0.08 + socialMemoryDensity * 0.06 + recentWarmth * 0.14 + recentMutualAttention * 0.08),
            rejection: this.clamp01(rejection + (lifeSim.interpretation?.warpedSignals || 0) * 0.04 + (lifeSim.distortion?.withdrawalBias || 0) * 0.08 + Math.max(0, crowding - 0.35) * 0.18 + recentFriction * 0.2),
            significance: this.clamp01(driveTargets.statusExpression * 0.62 + lessons * 0.02 + lessonDepth * 0.12 + socialMemoryDensity * 0.04 + (lifeSim.communication?.activeSignal ? 0.08 : 0) + reputationBias + zoneInfluence.emotions.significance),
            failure: this.clamp01(Math.max(0, hungerPressure - flowerAvailability * 0.4) * 0.35 + rejection * 0.2 + outcomeMemoryDensity * 0.06 + (lifeSim.interpretation?.warpedSignals || 0) * 0.03),
            curiosity: this.clamp01(driveTargets.exploration * 0.72 + novelty * 0.28 + movementRoutineStrength * 0.06 + (lifeSim.distortion?.fixationBias || 0) * 0.04 - stateThreat * 0.18 + zoneInfluence.emotions.curiosity),
            agitation: this.clamp01((entity.traits?.jitteriness || 0.5) * 0.14 + crowding * 0.28 + stateThreat * 0.4 + rejection * 0.12 + dangerMemoryDensity * 0.08 + (lifeSim.distortion?.anxietyBias || 0) * 0.12 + recentFriction * 0.16 - recentEase * 0.1 - calmPressure * 0.18),
            exhaustion: this.clamp01(lifeSim.emotions?.exhaustion || 0)
        };
        const targetPriority = this.clamp01((driveTargets.statusExpression * 0.22) + (driveTargets.resourceControl * 0.18) + (lifeSim.derived?.behaviorBiases?.feedUrgency || 0) * 0.28);
        const retreatPressure = this.clamp01(((entity.battleState?.pressure || 0) * 0.04) + (emotionTargets.exhaustion || 0) * 0.45 + (emotionTargets.threat || 0) * 0.32);
        const supportOpportunity = this.clamp01((nearbyAllies.length * 0.08) + attachment * 0.24 + driveTargets.socialConnection * 0.2);

        for (const [key, target] of Object.entries(driveTargets)) {
            lifeSim.drives[key] = this.clamp01(this.lerpValue(lifeSim.drives[key], target, 0.08));
        }
        for (const [key, target] of Object.entries(emotionTargets)) {
            if (key === 'exhaustion') {
                lifeSim.emotions[key] = target;
                continue;
            }
            lifeSim.emotions[key] = this.clamp01(this.lerpValue(lifeSim.emotions[key], target, 0.08));
        }

        const clarityTarget = this.clamp01(0.56 + attachment * 0.18 + emotionTargets.relief * 0.12 - emotionTargets.agitation * 0.16 - crowding * 0.08);
        lifeSim.interpretation.clarity = this.clamp01(this.lerpValue(lifeSim.interpretation.clarity ?? 1, clarityTarget, 0.06));

        const traumaTarget = this.clamp01(dangerMemoryDensity * 0.52 + emotionTargets.threat * 0.24 + lifeSim.playerInteraction.cursorFear * 0.18);
        const anxietyTarget = this.clamp01(emotionTargets.threat * 0.7 + emotionTargets.agitation * 0.22 + dangerMemoryDensity * 0.12);
        const withdrawalTarget = this.clamp01(emotionTargets.rejection * 0.8 + crowding * 0.08 + lessonReinforcementStrength * 0.04);
        const fixationTarget = this.clamp01(Math.max(driveTargets.statusExpression, driveTargets.caregiving, driveTargets.resourceControl * 0.82) * 0.72 + lessonDepth * 0.08);
        const insomniaTarget = this.clamp01(emotionTargets.agitation * 0.44 + emotionTargets.threat * 0.18 + warningPressure * 0.3 - emotionTargets.relief * 0.14);
        const oversleepTarget = this.clamp01((emotionTargets.exhaustion || 0) * 0.54 + driveTargets.rest * 0.24 - emotionTargets.agitation * 0.08);
        const warpedTeachingTarget = this.clamp01((lifeSim.interpretation?.warpedSignals || 0) * 0.1 + lessonDepth * 0.12 + emotionTargets.rejection * 0.12 + (lifeSim.social?.activeContext === 'training-ground' ? emotionTargets.agitation * 0.08 : 0));
        lifeSim.distortion.traumaBias = this.clamp01(this.lerpValue(lifeSim.distortion.traumaBias || 0, traumaTarget, 0.05));
        lifeSim.distortion.anxietyBias = this.clamp01(this.lerpValue(lifeSim.distortion.anxietyBias || 0, anxietyTarget, 0.05));
        lifeSim.distortion.withdrawalBias = this.clamp01(this.lerpValue(lifeSim.distortion.withdrawalBias || 0, withdrawalTarget, 0.05));
        lifeSim.distortion.fixationBias = this.clamp01(this.lerpValue(lifeSim.distortion.fixationBias || 0, fixationTarget, 0.05));
        lifeSim.distortion.insomniaBias = this.clamp01(this.lerpValue(lifeSim.distortion.insomniaBias || 0, insomniaTarget, 0.05));
        lifeSim.distortion.oversleepBias = this.clamp01(this.lerpValue(lifeSim.distortion.oversleepBias || 0, oversleepTarget, 0.05));
        lifeSim.distortion.warpedTeachingBias = this.clamp01(this.lerpValue(lifeSim.distortion.warpedTeachingBias || 0, warpedTeachingTarget, 0.05));

        lifeSim.social.reputation = this.clamp01(this.lerpValue(lifeSim.social.reputation || 0, admiration * 0.45 + lessons * 0.025 + driveTargets.statusExpression * 0.2 + reputationBias, 0.08));
        lifeSim.social.belonging = this.clamp01(this.lerpValue(lifeSim.social.belonging || 0, attachment * 0.7 + activeConversationBonus * 0.5 + recentWarmth * 0.24 + recentMutualAttention * 0.14 - rejection * 0.2 - recentFriction * 0.16, 0.08));
        lifeSim.social.confidence = this.clamp01(this.lerpValue(lifeSim.social.confidence || 0, emotionTargets.significance * 0.45 + attachment * 0.22 + emotionTargets.relief * 0.12 + recentEase * 0.14 - emotionTargets.failure * 0.2 - recentFriction * 0.1, 0.08));
        lifeSim.lifecycle.zoneIdentity = zoneInfluence.identityLabel;
        lifeSim.lifecycle.zoneTags = zoneInfluence.identityTags;
        lifeSim.playerInteraction.cursorTrust = this.clamp01(this.lerpValue(lifeSim.playerInteraction.cursorTrust || 0, cursorTrust, 0.12));
        lifeSim.playerInteraction.cursorFear = this.clamp01(this.lerpValue(lifeSim.playerInteraction.cursorFear || 0, cursorFear, 0.12));
        lifeSim.playerInteraction.calmedByCursor = !!entity.cursor?.calmedByCursor;
        lifeSim.objectAwareness.focusType = focusType;
        lifeSim.objectAwareness.currentAffordance = currentAffordance;
        lifeSim.objectAwareness.carryingType = isCarryingObject ? 'block' : null;
        lifeSim.objectAwareness.flowerFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'object', 'flower') / 10);
        lifeSim.objectAwareness.pollenFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'object', 'pollen') / 8);
        lifeSim.objectAwareness.eggFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'care', 'egg') / 8);
        lifeSim.objectAwareness.blockFamiliarity = this.clamp01(this.getRecentMemoryCount(entity, 'object', 'block') / 10);
        lifeSim.objectAwareness.shelterConfidence = this.clamp01(this.lerpValue(
            lifeSim.objectAwareness.shelterConfidence || 0,
            spatialContext?.shelterConfidenceTarget ?? (shelterCandidate ? 0.62 : 0.2),
            0.08
        ));
        lifeSim.spatialAwareness.verticality = verticality;
        lifeSim.spatialAwareness.structureRole = structureRole;
        lifeSim.spatialAwareness.pathState = pathState;
        lifeSim.spatialAwareness.bodyFit = bodyFit;
        lifeSim.spatialAwareness.obstacleDensity = this.clamp01(this.lerpValue(lifeSim.spatialAwareness.obstacleDensity || 0, obstacleDensity, 0.12));
        lifeSim.spatialAwareness.shelterCandidate = shelterCandidate;
        lifeSim.spatialAwareness.canUseInterior = !!spatialContext?.canUseInterior;
        lifeSim.progression.originType = entity.birthSource === 'bred' ? 'bred' : 'wild';
        lifeSim.progression.rarityExposure = this.clamp01(this.lerpValue(lifeSim.progression.rarityExposure || 0, rarityExposure, 0.08));
        lifeSim.progression.variantFamiliarity = this.clamp01(this.lerpValue(lifeSim.progression.variantFamiliarity || 0, adjustedVariantFamiliarity, 0.08));
        lifeSim.progression.lineageValue = this.clamp01(this.lerpValue(lifeSim.progression.lineageValue || 0, adjustedLineageValue, 0.08));
        lifeSim.progression.encounterValue = this.clamp01(this.lerpValue(lifeSim.progression.encounterValue || 0, adjustedEncounterValue, 0.08));
        lifeSim.battleContext.allyPressure = this.clamp01(this.lerpValue(lifeSim.battleContext.allyPressure || 0, allyPressure, 0.12));
        lifeSim.battleContext.enemyThreat = this.clamp01(this.lerpValue(lifeSim.battleContext.enemyThreat || 0, enemyThreat, 0.12));
        lifeSim.battleContext.targetPriority = this.clamp01(this.lerpValue(lifeSim.battleContext.targetPriority || 0, targetPriority, 0.12));
        lifeSim.battleContext.spacingState = obstacleDensity > 0.5 ? 'tight' : nearbyCount > 3 ? 'crowded' : 'open';
        lifeSim.battleContext.retreatPressure = this.clamp01(this.lerpValue(lifeSim.battleContext.retreatPressure || 0, retreatPressure, 0.12));
        lifeSim.battleContext.supportOpportunity = this.clamp01(this.lerpValue(lifeSim.battleContext.supportOpportunity || 0, supportOpportunity, 0.12));
        const migrationSummary = this.syncMigrationState(entity, gameState, {
            zoneId,
            zoneSummary: zoneInfluence?.zoneSummary || null,
            crowding,
            novelty,
            attachment,
            socialConfidence: lifeSim.social?.confidence || 0,
            trainingAffinity: this.clamp01(trainingStrength + lessonDepth * 0.22 + lessonReinforcementStrength * 0.18 + reputationBias + lifeSim.social.confidence * 0.25 + zoneInfluence.derived.trainingAffinity),
            curiosity: lifeSim.emotions?.curiosity || 0,
            relief: lifeSim.emotions?.relief || 0,
            exhaustion: lifeSim.emotions?.exhaustion || 0,
            threat: lifeSim.emotions?.threat || 0,
            crowdingPressure: zoneInfluence?.zoneSummary?.crowdingPressure || 0,
            dwellPressure: Math.max(0, crowding - 0.28),
            cohortPreferredZoneId: releaseEcology?.preferredZoneId || null,
            cohortPreferredZoneBoost: releaseEcology?.cohortPreferredZoneBoost || 0
        });
        const socialEcology = this.getSocialEcologySummary(entity, gameState, {
            zoneId,
            nearbyButterflies,
            spatialContext,
            zoneInfluence,
            zoneSummary: zoneInfluence?.zoneSummary || null,
            trainingAffinity: this.clamp01(trainingStrength + lessonDepth * 0.22 + lessonReinforcementStrength * 0.18 + reputationBias + lifeSim.social.confidence * 0.25 + zoneInfluence.derived.trainingAffinity),
            mateSeeking: migrationSummary?.mateSeeking || 0
        });
        lifeSim.social.activeContext = this.resolveActiveSocialContext(entity, zoneId, socialEcology);

        this.updateDerivedState(lifeSim, {
            crowding,
            novelty,
            cautionBias: this.clamp01(zoneInfluence.derived.cautionBias || 0),
            trainingAffinity: this.clamp01(trainingStrength + lessonDepth * 0.22 + lessonReinforcementStrength * 0.18 + reputationBias + lifeSim.social.confidence * 0.25 + zoneInfluence.derived.trainingAffinity),
            trainingAffinityBoost: (socialEcology?.teaching?.score || 0) * 0.22,
            objectInterest: this.clamp01(
                (focusType === 'block' ? 0.4 : focusType === 'flower' ? 0.24 : 0.1)
                + lifeSim.objectAwareness.blockFamiliarity * 0.22
                + (lifeSim.objectAwareness.shelterConfidence || 0) * 0.14
                + (lifeSim.emotions.curiosity || 0) * 0.24
                + ((socialEcology?.roosting?.score || 0) * 0.16)
                + ((socialEcology?.warning?.score || 0) * 0.08)
                + zoneInfluence.derived.objectInterest
            ),
            cursorAffinity: this.clamp01((lifeSim.playerInteraction.cursorTrust || 0) * 0.72 + (lifeSim.playerInteraction.calmedByCursor ? 0.18 : 0) - (lifeSim.playerInteraction.cursorFear || 0) * 0.28),
            lingerBias: this.clamp01(
                recentWarmth * 0.42
                + recentEase * 0.34
                + recentMutualAttention * 0.38
                - recentFriction * 0.28
                + (socialEcology?.relationshipTextureLingerBias || 0)
                + ((socialEcology?.clique?.score || 0) * 0.12)
                - ((socialEcology?.exclusion?.score || 0) * 0.1)
            ),
            shelterSeeking: this.clamp01(
                (shelterCandidate ? 0.32 : 0.08)
                + obstacleDensity * 0.24
                + (lifeSim.emotions.threat || 0) * 0.26
                + dangerMemoryDensity * 0.22
                + (spatialContext?.insideShelter ? 0.12 : 0)
                + (spatialContext?.canUseInterior ? 0.08 : 0)
                + zoneInfluence.derived.shelterSeeking
            ),
            shelterSeekingBoost: ((socialEcology?.roosting?.score || 0) * 0.18) + ((socialEcology?.warning?.score || 0) * 0.24),
            battleAggression: this.clamp01(targetPriority * 0.44 + (lifeSim.social.confidence || 0) * 0.18 - retreatPressure * 0.16 + zoneInfluence.derived.battleAggression),
            displayConfidenceBoost: ((socialEcology?.courtship?.score || 0) * 0.14) + ((socialEcology?.teaching?.score || 0) * 0.06) + ((socialEcology?.reputation?.score || 0) * 0.18),
            socialConfidenceBoost: ((socialEcology?.teaching?.score || 0) * 0.12) + ((socialEcology?.courtship?.score || 0) * 0.1) + ((socialEcology?.clique?.score || 0) * 0.14) + ((socialEcology?.reputation?.score || 0) * 0.12) + ((socialEcology?.protection?.score || 0) * 0.08) + recentWarmth * 0.12 + recentEase * 0.08 - recentFriction * 0.08 - ((socialEcology?.exclusion?.score || 0) * 0.16) + ((socialEcology?.relationshipTextureConfidenceBias || 0) * 0.4) - ((socialEcology?.relationshipTextureVolatility || 0) * 0.04),
            cautionBoost: ((socialEcology?.warning?.score || 0) * 0.22) + ((socialEcology?.protection?.score || 0) * 0.1) + ((socialEcology?.exclusion?.score || 0) * 0.18),
            followThroughDrive: Math.max(
                socialEcology?.followThrough?.seekScore || 0,
                socialEcology?.followThrough?.imitateScore || 0,
                socialEcology?.followThrough?.protectScore || 0
            ),
            socialAvoidance: socialEcology?.followThrough?.avoidScore || 0,
            migrationUrgency: migrationSummary?.travelUrgency || 0,
            returnHomeBias: migrationSummary?.returnHomeBias || 0,
            noveltySeeking: migrationSummary?.noveltySeeking || 0,
            mateSeeking: migrationSummary?.mateSeeking || 0,
            mateSeekingBoost: (socialEcology?.courtship?.score || 0) * 0.16,
            overcrowdingEscape: migrationSummary?.overcrowdingEscape || 0,
            homeAffinity: migrationSummary?.homeZoneStrength || migrationSummary?.currentZoneAffinity || 0,
            homeZoneId: migrationSummary?.homeZoneId || null,
            homeZoneStrength: migrationSummary?.homeZoneStrength || 0,
            currentZoneAffinity: migrationSummary?.currentZoneAffinity || 0,
            preferredZoneId: migrationSummary?.preferredZoneId || null,
            scoutTargetZoneId: migrationSummary?.scoutTargetZoneId || null,
            preferredMateZoneId: migrationSummary?.preferredMateZoneId || null,
            travelTargetZoneId: migrationSummary?.travelTargetZoneId || null,
            travelIntent: migrationSummary?.travelIntent || 'settling',
            visitedZoneCount: migrationSummary?.visitedZoneCount || 0,
            awayFromHome: migrationSummary?.awayFromHome || false,
            scoutingDrive: migrationSummary?.scoutingDrive || 0,
            zoneMateOpportunities: migrationSummary?.zoneMateOpportunities || {},
            socialEcology,
            currentFrame,
            cadenceIntervalFrames
        });
        if (runtime) {
            runtime.lastDeepUpdateFrame = currentFrame;
            runtime.lastZoneId = zoneId;
            runtime.lastState = entity?.state || 'normal';
            runtime.pendingDeepRefresh = false;
            runtime.pendingRefreshReason = null;
        }
        return {
            deepUpdate: true,
            lastValidFrame: currentFrame,
            cadenceIntervalFrames,
            cadenceOffset: runtime?.cadenceOffset ?? 0
        };
    }

    updateCaterpillar(entity, gameState, options = {}) {
        const lifeSim = this.ensureLifeSimState(entity);
        if (!lifeSim) return;
        const currentFrame = Number.isFinite(options.currentFrame)
            ? options.currentFrame
            : (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0));
        const cadenceIntervalFrames = Math.max(1, Math.round(options.cadenceIntervalFrames ?? 1));
        const runtime = this.ensureRuntimeState(entity.id);

        const zoneId = this.getZoneId(entity);
        lifeSim.lifecycle.currentZoneId = zoneId;
        const flowerCount = this.getFlowersInZone(zoneId, gameState).length;
        const hasTargetFlower = !!entity.targetFlower;
        const seekingChrysalis = entity.phase === 'seekingChrysalis';

        const driveTargets = {
            selfMaintenance: this.clamp01(0.28 + (!hasTargetFlower ? 0.3 : 0.06)),
            safetyAvoidance: this.clamp01(0.1 + (flowerCount === 0 ? 0.18 : 0)),
            resourceControl: this.clamp01(0.25 + (!seekingChrysalis ? 0.35 : 0.12)),
            socialConnection: 0.02,
            caregiving: 0,
            exploration: this.clamp01(0.1 + (hasTargetFlower ? 0.08 : 0.22)),
            statusExpression: 0,
            rest: this.clamp01(0.2 + (seekingChrysalis ? 0.22 : 0.06))
        };
        const emotionTargets = {
            threat: this.clamp01(!hasTargetFlower ? 0.22 : 0.04),
            relief: this.clamp01(hasTargetFlower ? 0.2 : 0.02),
            attachment: 0,
            rejection: 0,
            significance: this.clamp01(seekingChrysalis ? 0.18 : 0.04),
            failure: this.clamp01(!hasTargetFlower ? 0.16 : 0),
            curiosity: this.clamp01(driveTargets.exploration * 0.75),
            agitation: this.clamp01(!hasTargetFlower ? 0.2 : 0.06),
            exhaustion: this.clamp01(lifeSim.emotions?.exhaustion || 0)
        };

        for (const [key, target] of Object.entries(driveTargets)) {
            lifeSim.drives[key] = this.clamp01(this.lerpValue(lifeSim.drives[key], target, 0.08));
        }
        for (const [key, target] of Object.entries(emotionTargets)) {
            if (key === 'exhaustion') {
                lifeSim.emotions[key] = target;
                continue;
            }
            lifeSim.emotions[key] = this.clamp01(this.lerpValue(lifeSim.emotions[key], target, 0.08));
        }

        lifeSim.social.reputation = 0;
        lifeSim.social.belonging = 0;
        lifeSim.social.confidence = this.clamp01(0.08 + driveTargets.resourceControl * 0.2);
        lifeSim.social.activeContext = seekingChrysalis ? 'metamorphosis' : 'foraging';
        this.updateDerivedState(lifeSim, {
            crowding: 0,
            novelty: this.clamp01(flowerCount <= 1 ? 0.35 : 0.15),
            trainingAffinity: 0,
            currentFrame,
            cadenceIntervalFrames
        });
        if (runtime) {
            runtime.lastDeepUpdateFrame = currentFrame;
            runtime.lastZoneId = zoneId;
            runtime.lastState = entity?.state || 'normal';
            runtime.pendingDeepRefresh = false;
            runtime.pendingRefreshReason = null;
        }
    }

    update(gameState, deltaSeconds = gameConfig?.simulation?.fixedDeltaSeconds || (1 / 60), options = {}) {
        this.simulationClockSeconds += deltaSeconds;
        const cadence = this.getCadenceConfig(gameState, options);
        const stats = {
            cadenceEnabled: cadence.enabled ? 1 : 0,
            cadenceIntervalFrames: cadence.intervalFrames,
            currentFrame: cadence.currentFrame,
            butterfliesDeepUpdated: 0,
            butterfliesCadenceSkipped: 0,
            butterfliesForcedDeepUpdated: 0,
            caterpillarsDeepUpdated: 0
        };

        for (const butterfly of gameState?.butterflies || []) {
            const cadenceDecision = this.shouldRunButterflyDeepEvaluation(butterfly, gameState, cadence);
            const result = this.updateButterfly(butterfly, gameState, {
                ...options,
                currentFrame: cadence.currentFrame,
                cadenceIntervalFrames: cadence.intervalFrames,
                deepUpdate: cadenceDecision.shouldDeepUpdate
            }) || {};
            if (result.deepUpdate) {
                stats.butterfliesDeepUpdated += 1;
                if (cadenceDecision.forced) {
                    stats.butterfliesForcedDeepUpdated += 1;
                }
            } else {
                stats.butterfliesCadenceSkipped += 1;
            }
        }
        for (const caterpillar of gameState?.caterpillars || []) {
            this.updateCaterpillar(caterpillar, gameState, {
                ...options,
                currentFrame: cadence.currentFrame,
                cadenceIntervalFrames: cadence.intervalFrames
            });
            stats.caterpillarsDeepUpdated += 1;
        }

        if (cadence.currentFrame % 120 === 0) {
            this.pruneRuntimeState(
                this.getLiveEntities(gameState).map(entity => entity?.id).filter(Boolean)
            );
        }
        return stats;
    }

    getEntitySummary(entityId) {
        const entity = this.getEntityById(entityId);
        const lifeSim = entity?.lifeSim;
        if (!lifeSim) return null;
        const runtime = this.runtimeState.get(entityId) || null;
        const nowFrame = gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : null);
        const lastValidFrame = lifeSim.derived?.lastUpdatedFrame
            || runtime?.lastDeepUpdateFrame
            || null;
        const drivePeaks = lifeSim.derived?.drivePeaks || this.getTopLabels(lifeSim.drives, 2);
        const emotionPeaks = lifeSim.derived?.emotionPeaks || this.getTopLabels(lifeSim.emotions, 2);
        const memories = this.getMemorySummary(entity);
        const routines = this.getRoutineSummary(entity);
        const upbringing = this.getUpbringingSummary(entity);
        const distortion = this.getDistortionSummary(entity);
        const migration = this.getMigrationSummary(entity);
        const releaseEcology = this.getReleaseEcologyInfluence(entity, gameCore?.gameState);
        const zoneId = this.getZoneId(entity);
        const zoneInfluence = this.getZoneLifeSimInfluence(zoneId, entity);
        const zoneSummary = zoneInfluence?.zoneSummary || null;
        const socialEcology = this.getSocialEcologySummary(entity, gameCore?.gameState, {
            zoneId,
            zoneInfluence,
            zoneSummary
        }) || lifeSim.derived?.socialEcology || null;
        return {
            dominantDrives: drivePeaks.map(entry => `${entry.label} ${Math.round((entry.value || 0) * 100)}`),
            dominantEmotions: emotionPeaks.map(entry => `${entry.label} ${Math.round((entry.value || 0) * 100)}`),
            social: {
                reputation: Math.round((lifeSim.social?.reputation || 0) * 100),
                belonging: Math.round((lifeSim.social?.belonging || 0) * 100),
                confidence: Math.round((lifeSim.social?.confidence || 0) * 100),
                focus: lifeSim.social?.focus || lifeSim.derived?.dominantDrive || 'rest',
                context: lifeSim.social?.activeContext || 'wandering'
            },
            freshness: {
                lastValidFrame,
                staleFrames: Number.isFinite(lastValidFrame) && Number.isFinite(nowFrame)
                    ? Math.max(0, nowFrame - lastValidFrame)
                    : null,
                cadenceIntervalFrames: Math.max(1, Math.round(lifeSim.derived?.cadenceIntervalFrames || 1)),
                cadenceOffset: runtime?.cadenceOffset ?? 0
            },
            player: {
                trust: Math.round((lifeSim.playerInteraction?.cursorTrust || 0) * 100),
                fear: Math.round((lifeSim.playerInteraction?.cursorFear || 0) * 100),
                calmed: !!lifeSim.playerInteraction?.calmedByCursor,
                petHistory: lifeSim.playerInteraction?.petHistory || 0,
                clapHistory: lifeSim.playerInteraction?.clapStartleHistory || 0
            },
            memories,
            routines,
            upbringing,
            distortion,
            migration,
            zone: {
                identity: zoneInfluence?.identityLabel || zoneId || 'garden',
                signature: zoneSummary?.signatureLabel || 'steady habitat',
                headline: zoneSummary?.headline || `${zoneInfluence?.identityLabel || zoneId || 'garden'} | steady habitat`,
                detail: zoneSummary?.detail || 'food 0 | shelter 0 | crowd 0 | pull 0',
                foodRichness: Math.round((zoneSummary?.foodRichness || 0) * 100),
                resourceReserve: Math.round((zoneSummary?.resourceReserve || 0) * 100),
                habitatQuality: Math.round((zoneSummary?.habitatQuality || 0) * 100),
                depletionPressure: Math.round((zoneSummary?.depletionPressure || 0) * 100),
                recoveryFloor: Math.round((zoneSummary?.recoveryFloor || 0) * 100),
                shelterCapacity: Math.round((zoneSummary?.shelterCapacity || 0) * 100),
                crowdingPressure: Math.round((zoneSummary?.crowdingPressure || 0) * 100),
                migrationPull: Math.round((zoneSummary?.migrationPull || 0) * 100),
                socialValence: Math.round((zoneSummary?.socialValence || 0) * 100),
                trainingValence: Math.round((zoneSummary?.trainingValence || 0) * 100),
                recoveryPressure: Math.round((zoneSummary?.recoveryPressure || 0) * 100)
            },
            objects: {
                focusType: lifeSim.objectAwareness?.focusType || 'none',
                affordance: lifeSim.objectAwareness?.currentAffordance || 'observe',
                carryingType: lifeSim.objectAwareness?.carryingType || 'none',
                flowerFamiliarity: Math.round((lifeSim.objectAwareness?.flowerFamiliarity || 0) * 100),
                blockFamiliarity: Math.round((lifeSim.objectAwareness?.blockFamiliarity || 0) * 100),
                shelterConfidence: Math.round((lifeSim.objectAwareness?.shelterConfidence || 0) * 100)
            },
            space: {
                verticality: lifeSim.spatialAwareness?.verticality || 'ground',
                role: lifeSim.spatialAwareness?.structureRole || 'loose',
                pathState: lifeSim.spatialAwareness?.pathState || 'open',
                bodyFit: lifeSim.spatialAwareness?.bodyFit || 'canPass',
                obstacleDensity: Math.round((lifeSim.spatialAwareness?.obstacleDensity || 0) * 100)
            },
            progression: {
                origin: lifeSim.progression?.originType || lifeSim.identity?.source || 'wild',
                rarityExposure: Math.round((lifeSim.progression?.rarityExposure || 0) * 100),
                lineageValue: Math.round((lifeSim.progression?.lineageValue || 0) * 100),
                variantFamiliarity: Math.round((lifeSim.progression?.variantFamiliarity || 0) * 100),
                encounterValue: Math.round((lifeSim.progression?.encounterValue || 0) * 100),
                releaseBatchCount: releaseEcology?.batchCount || 0,
                nextWaveRemaining: releaseEcology?.nextWaveRemaining ?? 10,
                releaseLineages: (releaseEcology?.releaseLineages || []).slice(0, 3),
                cohortId: releaseEcology?.cohortId || null,
                cohortZoneLabel: releaseEcology?.preferredZoneLabel || null,
                cohortLineages: (releaseEcology?.cohortLineages || []).slice(0, 2).map(entry => entry.label || entry.id),
                cohortBlendGuard: Math.round((releaseEcology?.cohortBlendGuard || 0) * 100)
            },
            battle: {
                allyPressure: Math.round((lifeSim.battleContext?.allyPressure || 0) * 100),
                enemyThreat: Math.round((lifeSim.battleContext?.enemyThreat || 0) * 100),
                spacingState: lifeSim.battleContext?.spacingState || 'open',
                supportOpportunity: Math.round((lifeSim.battleContext?.supportOpportunity || 0) * 100),
                targetPriority: Math.round((lifeSim.battleContext?.targetPriority || 0) * 100),
                retreatPressure: Math.round((lifeSim.battleContext?.retreatPressure || 0) * 100)
            },
            socialEcology: {
                primaryRhythm: socialEcology?.primaryRhythm || 'wandering',
                primaryScore: Math.round((socialEcology?.primaryScore || 0) * 100),
                headline: socialEcology?.headline || 'quiet | no strong local rhythm',
                detail: socialEcology?.detail || 'clique 0 | excl 0 | protect 0 | rep 0',
                societyTone: socialEcology?.societyTone || 'mixed',
                societyLabel: socialEcology?.societyLabel || 'mixed | no dominant local society tone',
                societyDetail: socialEcology?.societyDetail || 'clique 0 | excl 0 | protect 0 | rep 0',
                habitatDetail: socialEcology?.habitatDetail || 'roost 0 | warn 0 | teach 0 | court 0',
                followThroughLabel: socialEcology?.followThrough?.label || 'no strong carry-over',
                followThroughDetail: socialEcology?.followThrough?.detail || 'seek 0 | avoid 0 | imitate 0 | protect 0',
                localFieldLabel: socialEcology?.localFieldLabel || 'quiet | no active field',
                localFieldDetail: socialEcology?.localFieldDetail || 'No nearby active signals',
                roosting: {
                    score: Math.round((socialEcology?.roosting?.score || 0) * 100),
                    nearbyCount: socialEcology?.roosting?.nearbyCount || 0,
                    supportCount: socialEcology?.roosting?.supportCount || 0,
                    detail: socialEcology?.roosting?.detail || 'sleep 0 | shelter 0 | calm 0'
                },
                warning: {
                    score: Math.round((socialEcology?.warning?.score || 0) * 100),
                    nearbyCount: socialEcology?.warning?.nearbyCount || 0,
                    supportCount: socialEcology?.warning?.supportCount || 0,
                    detail: socialEcology?.warning?.detail || 'warn 0 | startled 0 | shelter 0'
                },
                teaching: {
                    score: Math.round((socialEcology?.teaching?.score || 0) * 100),
                    nearbyCount: socialEcology?.teaching?.nearbyCount || 0,
                    supportCount: socialEcology?.teaching?.supportCount || 0,
                    detail: socialEcology?.teaching?.detail || 'teach 0 | guides 0 | lessons 0'
                },
                courtship: {
                    score: Math.round((socialEcology?.courtship?.score || 0) * 100),
                    nearbyCount: socialEcology?.courtship?.nearbyCount || 0,
                    supportCount: socialEcology?.courtship?.supportCount || 0,
                    detail: socialEcology?.courtship?.detail || 'court 0 | pair 0 | chemistry 0'
                },
                clique: {
                    score: Math.round((socialEcology?.clique?.score || 0) * 100),
                    nearbyCount: socialEcology?.clique?.nearbyCount || 0,
                    supportCount: socialEcology?.clique?.supportCount || 0,
                    detail: socialEcology?.clique?.detail || 'warm 0 | links 0 | belong 0'
                },
                exclusion: {
                    score: Math.round((socialEcology?.exclusion?.score || 0) * 100),
                    nearbyCount: socialEcology?.exclusion?.nearbyCount || 0,
                    supportCount: socialEcology?.exclusion?.supportCount || 0,
                    detail: socialEcology?.exclusion?.detail || 'tense 0 | belong 0 | crowd 0'
                },
                protection: {
                    score: Math.round((socialEcology?.protection?.score || 0) * 100),
                    nearbyCount: socialEcology?.protection?.nearbyCount || 0,
                    supportCount: socialEcology?.protection?.supportCount || 0,
                    detail: socialEcology?.protection?.detail || 'in 0 | out 0 | vuln 0'
                },
                reputation: {
                    score: Math.round((socialEcology?.reputation?.score || 0) * 100),
                    nearbyCount: socialEcology?.reputation?.nearbyCount || 0,
                    supportCount: socialEcology?.reputation?.supportCount || 0,
                    detail: socialEcology?.reputation?.detail || 'admired 0 | rep 0 | conf 0'
                },
                followThrough: {
                    dominantMode: socialEcology?.followThrough?.dominantMode || 'none',
                    seekPartnerLabel: socialEcology?.followThrough?.seekPartnerLabel || null,
                    seekScore: Math.round((socialEcology?.followThrough?.seekScore || 0) * 100),
                    avoidPartnerLabel: socialEcology?.followThrough?.avoidPartnerLabel || null,
                    avoidScore: Math.round((socialEcology?.followThrough?.avoidScore || 0) * 100),
                    imitatePartnerLabel: socialEcology?.followThrough?.imitatePartnerLabel || null,
                    imitateScore: Math.round((socialEcology?.followThrough?.imitateScore || 0) * 100),
                    protectPartnerLabel: socialEcology?.followThrough?.protectPartnerLabel || null,
                    protectScore: Math.round((socialEcology?.followThrough?.protectScore || 0) * 100),
                    detail: socialEcology?.followThrough?.detail || 'seek 0 | avoid 0 | imitate 0 | protect 0'
                }
            }
        };
    }

    getFeedGroundingSummary(entityId) {
        const entity = this.getEntityById(entityId);
        if (!entity?.lifeSim) return null;
        const summary = this.getEntitySummary(entityId);
        if (!summary) return null;
        return {
            zoneId: this.getZoneId(entity),
            zoneHeadline: summary.zone?.headline || null,
            state: entity.state || 'normal',
            socialContext: summary.social?.context || 'wandering',
            focusType: summary.objects?.focusType || 'none',
            affordance: summary.objects?.affordance || 'observe',
            carryingType: summary.objects?.carryingType || 'none',
            pathState: summary.space?.pathState || 'open',
            activeSignalType: entity.lifeSim?.communication?.activeSignal?.signalType || null,
            socialRhythm: summary.socialEcology?.primaryRhythm || 'wandering'
        };
    }

    serializeDurableState() {
        return { simulationClockSeconds: this.simulationClockSeconds };
    }

    deserializeDurableState(serialized = {}) {
        this.simulationClockSeconds = serialized?.simulationClockSeconds || 0;
    }
}

const lifeSimSystem = new LifeSimSystem();
