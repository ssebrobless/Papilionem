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
        if (!entity?.gridPos || typeof zoneSystem === 'undefined') return null;
        return zoneSystem.getZoneAtGrid(entity.gridPos.x, entity.gridPos.y)?.id || null;
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
        runtime.currentActionFamily = actionFamily;
        runtime.currentActionSubtype = this.inferActionSubtype(entity, actionFamily);
        runtime.currentTargetId = this.inferTargetId(entity);
        runtime.currentZoneId = this.resolveZoneId(entity);
        runtime.priorityScore = runtime.priorityScore ?? 0;
        runtime.reason = runtime.reason === 'manual-assignment' && runtime.overrideSecondsRemaining > 0
            ? runtime.reason
            : 'derived-from-entity-state';
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
