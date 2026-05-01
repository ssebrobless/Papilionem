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
        const socialIntent = ['sleep', 'seek_resource'].includes(actionFamily)
            ? null
            : (this.getFollowThroughIntent(entity) || this.getSocialEcologyIntent(entity));
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
