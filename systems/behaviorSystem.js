class BehaviorSystem {
    constructor() {
        this.runtimeByEntityId = new Map();
        this.simulationClockSeconds = 0;
        this.initialized = false;
    }

    initialize() {
        this.initialized = true;
    }

    registerEntity(entity) {
        const runtime = this.ensureRuntime(entity);
        if (runtime) {
            this.syncRuntimeFromEntity(entity, runtime);
        }
        return runtime;
    }

    unregisterEntity(entityId) {
        this.runtimeByEntityId.delete(entityId);
    }

    reset() {
        this.runtimeByEntityId.clear();
        this.simulationClockSeconds = 0;
    }

    ensureRuntime(entity) {
        if (!entity?.id) return null;
        if (!this.runtimeByEntityId.has(entity.id)) {
            this.runtimeByEntityId.set(entity.id, {
                currentActionFamily: 'idle',
                currentActionSubtype: 'idle',
                currentTargetId: null,
                currentZoneId: null,
                priorityScore: 0,
                reason: 'uninitialized',
                overrideSecondsRemaining: 0,
                updatedAtSeconds: this.simulationClockSeconds
            });
        }
        return this.runtimeByEntityId.get(entity.id);
    }

    assignAction(entity, actionFamily, actionSubtype = actionFamily, targetId = null, options = {}) {
        const runtime = this.ensureRuntime(entity);
        if (!runtime) return null;
        runtime.currentActionFamily = actionFamily;
        runtime.currentActionSubtype = actionSubtype;
        runtime.currentTargetId = targetId;
        runtime.currentZoneId = this.resolveZoneId(entity);
        runtime.priorityScore = options.priorityScore ?? runtime.priorityScore ?? 0;
        runtime.reason = options.reason || 'manual-assignment';
        runtime.overrideSecondsRemaining = Math.max(0, options.overrideDurationSeconds ?? 0);
        runtime.updatedAtSeconds = this.simulationClockSeconds;
        return runtime;
    }

    getRuntime(entityId) {
        const runtime = this.runtimeByEntityId.get(entityId);
        return runtime ? JSON.parse(JSON.stringify(runtime)) : null;
    }

    resolveZoneId(entity) {
        if (!entity || typeof zoneSystem === 'undefined') return null;
        return zoneSystem.getEntityZone?.(entity)?.id || null;
    }

    clamp01(value) {
        return Math.max(0, Math.min(1, Number(value) || 0));
    }

    getAffordanceMigrationConfig() {
        return gameConfig?.zones?.affordanceMigrationPressure || {};
    }

    getPrimaryDrive(entity) {
        const drives = entity?.lifeSim?.drives || {};
        let best = { key: null, value: 0 };
        for (const [key, value] of Object.entries(drives)) {
            const score = this.clamp01(value);
            if (score > best.value) best = { key, value: score };
        }
        return best;
    }

    mapDriveToZoneAffordance(driveKey) {
        const map = {
            selfMaintenance: 'resource',
            resourceControl: 'resource',
            socialConnection: 'social',
            caregiving: 'social',
            safetyAvoidance: 'shelter',
            rest: 'shelter',
            exploration: 'exploration',
            statusExpression: 'training'
        };
        return map[driveKey] || null;
    }

    getAffordanceMigrationIntent(entity, gameState) {
        const config = this.getAffordanceMigrationConfig();
        if (config.enabled === false || !entity?.id || typeof zoneSystem === 'undefined') return null;
        const currentFrame = gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0);
        const interval = Math.max(1, Math.round(config.decisionIntervalFrames ?? 120));
        const offset = Math.abs(String(entity.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % interval;
        if ((currentFrame + offset) % interval !== 0) return null;
        const currentZoneId = this.resolveZoneId(entity);
        if (!currentZoneId || entity.zoneTravel || entity.isSpawning) return null;
        const snapshot = zoneSystem.getZoneAffordanceSnapshot?.(gameState) || {};
        const currentVector = snapshot[currentZoneId] || zoneSystem.getZoneAffordanceVector?.(currentZoneId, gameState);
        if (!currentVector) return null;
        const adjacentZones = zoneSystem.getAdjacentZones?.(currentZoneId) || [];
        let activeDrives = Object.entries(entity?.lifeSim?.drives || {})
            .map(([key, value]) => ({ key, value: this.clamp01(value), affordanceKey: this.mapDriveToZoneAffordance(key) }))
            .filter(drive => drive.affordanceKey && drive.value >= Number(config.minActiveDrive ?? 0.55))
            .sort((left, right) => right.value - left.value);
        if (config.scarcityResourcePriority !== false && currentVector.scarcityActive) {
            const resourceDrives = activeDrives.filter(drive => drive.affordanceKey === 'resource');
            if (resourceDrives.length) {
                activeDrives = resourceDrives;
            }
        }
        let best = null;
        for (const drive of activeDrives) {
            const currentValue = this.clamp01(currentVector[drive.affordanceKey]);
            if (currentValue > Number(config.bottomQuantile ?? 0.35)) continue;
            for (const zone of adjacentZones) {
                if (!zone?.id || zone.id === currentZoneId) continue;
                if (config.excludeTrainingAsAmbientTarget !== false && zone.kind === 'training') continue;
                const vector = snapshot[zone.id] || zoneSystem.getZoneAffordanceVector?.(zone.id, gameState);
                if (!vector) continue;
                const targetValue = this.clamp01(vector[drive.affordanceKey]);
                const delta = targetValue - currentValue;
                if (targetValue < Number(config.topQuantile ?? 0.62) || delta < Number(config.minDelta ?? 0.18)) continue;
                const weightedDelta = delta * drive.value;
                if (!best || weightedDelta > best.weightedDelta || targetValue > best.targetValue) {
                    best = { zoneId: zone.id, vector, targetValue, currentValue, delta, weightedDelta, drive };
                }
            }
        }
        if (!best) return null;
        return {
            actionFamily: 'wander',
            actionSubtype: 'zone-affordance-migration',
            targetId: best.zoneId,
            targetZoneId: best.zoneId,
            priorityScore: Math.round((Number(config.urgencyBase ?? 0.64) + (best.drive.value * Number(config.urgencyScale ?? 0.32))) * 100),
            reason: `seeking-${best.drive.affordanceKey}-affordance`,
            driveKey: best.drive.key,
            driveValue: best.drive.value,
            affordanceKey: best.drive.affordanceKey,
            currentZoneId,
            currentValue: best.currentValue,
            targetValue: best.targetValue,
            delta: best.delta
        };
    }

    applyAffordanceMigrationIntent(entity, intent) {
        if (!entity?.lifeSim || !intent?.targetZoneId) return;
        entity.lifeSim.derived = entity.lifeSim.derived || {};
        entity.lifeSim.derived.migration = entity.lifeSim.derived.migration || {};
        const config = this.getAffordanceMigrationConfig();
        entity.lifeSim.derived.migration.travelTargetZoneId = intent.targetZoneId;
        entity.lifeSim.derived.migration.travelUrgency = this.clamp01((Number(config.urgencyBase ?? 0.64) + intent.driveValue * Number(config.urgencyScale ?? 0.32)));
        entity.lifeSim.derived.migration.affordancePull = {
            targetZoneId: intent.targetZoneId,
            driveKey: intent.driveKey,
            affordanceKey: intent.affordanceKey,
            currentZoneId: intent.currentZoneId,
            currentValue: intent.currentValue,
            targetValue: intent.targetValue,
            delta: intent.delta,
            updatedAtSeconds: this.simulationClockSeconds
        };
        entity.lifeSim.migration = entity.lifeSim.migration || {};
        entity.lifeSim.migration.zoneAffinities = entity.lifeSim.migration.zoneAffinities || {};
        entity.lifeSim.migration.zoneAffinities[intent.targetZoneId] = this.clamp01(
            (entity.lifeSim.migration.zoneAffinities[intent.targetZoneId] || 0)
            + Number(config.targetAffinityBoost ?? 0.22)
        );
    }

    getSocialEcologyIntent(entity) {
        const socialEcology = entity?.lifeSim?.derived?.socialEcology || null;
        const behaviorBiases = entity?.lifeSim?.derived?.behaviorBiases || {};
        if (!socialEcology) return null;
        const primaryRhythm = socialEcology.primaryRhythm || 'wandering';

        if (primaryRhythm === 'warning-cascade' && (socialEcology.warning?.score || 0) >= 0.24) {
            return {
                actionFamily: 'wander',
                actionSubtype: 'warning-cascade',
                priorityScore: Math.round((socialEcology.warning.score || 0) * 100),
                reason: 'following-local-warning-field'
            };
        }

        if (primaryRhythm === 'roosting-pocket' && (socialEcology.roosting?.score || 0) >= 0.32 && (behaviorBiases.shelterSeeking || 0) >= 0.4) {
            return {
                actionFamily: 'wander',
                actionSubtype: 'roosting',
                priorityScore: Math.round((socialEcology.roosting.score || 0) * 100),
                reason: 'holding-near-roost-pocket'
            };
        }

        if (primaryRhythm === 'teaching-pocket' && (socialEcology.teaching?.score || 0) >= 0.32) {
            return {
                actionFamily: 'socialize',
                actionSubtype: 'teaching-pocket',
                priorityScore: Math.round((socialEcology.teaching.score || 0) * 100),
                reason: 'staying-inside-teaching-pocket'
            };
        }

        if (primaryRhythm === 'courtship-territory' && (socialEcology.courtship?.score || 0) >= 0.28) {
            return {
                actionFamily: 'socialize',
                actionSubtype: 'courtship-territory',
                priorityScore: Math.round((socialEcology.courtship.score || 0) * 100),
                reason: 'circling-courtship-territory'
            };
        }

        if ((behaviorBiases.shelterSeeking || 0) >= 0.66) {
            return {
                actionFamily: 'wander',
                actionSubtype: 'shelter-seeking',
                priorityScore: Math.round((behaviorBiases.shelterSeeking || 0) * 100),
                reason: 'prefers-shelter-lane'
            };
        }

        return null;
    }

    getMetacognitionIntent(entity) {
        const metaBias = entity?.lifeSim?.derived?.metacognitionBias || null;
        const behaviorBiases = entity?.lifeSim?.derived?.behaviorBiases || {};
        if (!metaBias?.active) return null;
        if (metaBias.actionBias === 'seek-shelter-after-surprise' && (behaviorBiases.shelterSeeking || 0) >= 0.66) {
            return {
                actionFamily: 'wander',
                actionSubtype: 'shelter-seeking',
                priorityScore: Math.max(70, Math.round((behaviorBiases.shelterSeeking || 0) * 100)),
                reason: 'metacognition-surprised-by-feeling'
            };
        }
        if (metaBias.actionBias === 'pause-after-social-error') {
            return {
                actionFamily: 'socialize',
                actionSubtype: 'reflective-pause',
                priorityScore: Math.max(50, Math.round((metaBias.metaIntensity || 0) * 100)),
                reason: 'metacognition-reflective-pause'
            };
        }
        return null;
    }

    getFollowThroughIntent(entity) {
        const followThrough = entity?.lifeSim?.derived?.socialEcology?.followThrough || null;
        if (!followThrough) return null;

        if (followThrough.protectPartnerId && (followThrough.protectScore || 0) >= 0.3) {
            return {
                actionFamily: 'socialize',
                actionSubtype: 'protective-follow-through',
                targetId: followThrough.protectPartnerId,
                priorityScore: Math.round((followThrough.protectScore || 0) * 100),
                reason: 'staying-near-vulnerable-partner'
            };
        }

        if (followThrough.avoidPartnerId && (followThrough.avoidScore || 0) >= 0.34) {
            return {
                actionFamily: 'wander',
                actionSubtype: 'strained-avoidance',
                targetId: followThrough.avoidPartnerId,
                priorityScore: Math.round((followThrough.avoidScore || 0) * 100),
                reason: 'keeping-distance-from-strained-partner'
            };
        }

        if (followThrough.seekPartnerId && (followThrough.seekScore || 0) >= 0.3) {
            return {
                actionFamily: 'socialize',
                actionSubtype: 'partner-return',
                targetId: followThrough.seekPartnerId,
                priorityScore: Math.round((followThrough.seekScore || 0) * 100),
                reason: 'returning-to-familiar-partner'
            };
        }

        if (followThrough.imitatePartnerId && (followThrough.imitateScore || 0) >= 0.3) {
            return {
                actionFamily: 'socialize',
                actionSubtype: 'admiring-shadow',
                targetId: followThrough.imitatePartnerId,
                priorityScore: Math.round((followThrough.imitateScore || 0) * 100),
                reason: 'shadowing-admired-partner'
            };
        }

        return null;
    }

    inferActionFamily(entity) {
        const sleepSubtype = typeof sleepSystem !== 'undefined' ? sleepSystem.getSleepState(entity.id)?.subtype : null;
        if (sleepSubtype) return 'sleep';

        if (entity?.lifeSim?.lifecycle?.stage === 'larval' || entity?.constructor?.name === 'Caterpillar') {
            return entity.targetFlower ? 'seek_resource' : 'wander';
        }

        if (entity?.feeding?.targetFlower || entity?.currentFeeder) {
            return 'seek_resource';
        }

        if (entity?.state === 'display' || entity?.state === 'trusting') {
            return 'socialize';
        }

        return 'wander';
    }

    inferActionSubtype(entity, actionFamily) {
        if (actionFamily === 'sleep') {
            return typeof sleepSystem !== 'undefined'
                ? (sleepSystem.getSleepState(entity.id)?.subtype || 'sleep')
                : 'sleep';
        }

        if (entity?.constructor?.name === 'Caterpillar' && entity?.phase) {
            return entity.phase;
        }

        return entity?.state || actionFamily;
    }

    inferTargetId(entity) {
        if (entity?.targetFlower?.id) return entity.targetFlower.id;
        if (entity?.feeding?.targetFlower?.id) return entity.feeding.targetFlower.id;
        if (entity?.currentFeeder?.id) return entity.currentFeeder.id;
        return null;
    }

    syncRuntimeFromEntity(entity, runtime = this.ensureRuntime(entity)) {
        if (!runtime) return null;
        const actionFamily = this.inferActionFamily(entity);
        const socialIntent = actionFamily === 'sleep'
            ? null
            : (this.getMetacognitionIntent(entity) || this.getAffordanceMigrationIntent(entity, gameCore?.gameState) || this.getFollowThroughIntent(entity) || this.getSocialEcologyIntent(entity));
        if (socialIntent?.actionSubtype === 'zone-affordance-migration') {
            this.applyAffordanceMigrationIntent(entity, socialIntent);
        }
        runtime.currentActionFamily = socialIntent?.actionFamily || actionFamily;
        runtime.currentActionSubtype = socialIntent?.actionSubtype || this.inferActionSubtype(entity, actionFamily);
        runtime.currentTargetId = socialIntent?.targetId || this.inferTargetId(entity);
        runtime.currentZoneId = this.resolveZoneId(entity);
        runtime.priorityScore = socialIntent?.priorityScore ?? runtime.priorityScore ?? 0;
        runtime.reason = runtime.reason === 'manual-assignment' && runtime.overrideSecondsRemaining > 0
            ? runtime.reason
            : (socialIntent?.reason || 'derived-from-entity-state');
        runtime.updatedAtSeconds = this.simulationClockSeconds;
        return runtime;
    }

    update(gameState, deltaSeconds = gameConfig.simulation.fixedDeltaSeconds) {
        this.simulationClockSeconds += deltaSeconds;

        for (const butterfly of gameState.butterflies || []) {
            const runtime = this.registerEntity(butterfly);
            if (runtime?.overrideSecondsRemaining > 0) {
                runtime.overrideSecondsRemaining = Math.max(0, runtime.overrideSecondsRemaining - deltaSeconds);
            } else {
                this.syncRuntimeFromEntity(butterfly, runtime);
            }
        }

        for (const caterpillar of gameState.caterpillars || []) {
            const runtime = this.registerEntity(caterpillar);
            if (runtime?.overrideSecondsRemaining > 0) {
                runtime.overrideSecondsRemaining = Math.max(0, runtime.overrideSecondsRemaining - deltaSeconds);
            } else {
                this.syncRuntimeFromEntity(caterpillar, runtime);
            }
        }
    }
}

const behaviorSystem = new BehaviorSystem();
