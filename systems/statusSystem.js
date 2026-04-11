let __statusEffectCounter = 0;

function createStatusEffectId() {
    __statusEffectCounter += 1;
    return `status_effect_${__statusEffectCounter}`;
}

function cloneStatusValue(value, fallback = null) {
    if (value == null) return fallback;
    return JSON.parse(JSON.stringify(value));
}

class StatusSystem {
    constructor() {
        this.effectsByTarget = new Map();
        this.aggregatedModifiers = new Map();
        this.cooldownsByEntityId = new Map();
        this.chargesByEntityId = new Map();
        this.immunitiesByEntityId = new Map();
        this.simulationClockSeconds = 0;
        this.initialized = false;
    }

    initialize() {
        this.initialized = true;
    }

    registerEntity(entity) {
        if (!entity?.id) return null;
        this.ensureTarget(entity.id);
        this.ensureCooldownState(entity.id);
        this.ensureChargeState(entity.id);
        this.ensureImmunityState(entity.id);
        return this.getEntityState(entity.id);
    }

    unregisterEntity(entityId) {
        this.effectsByTarget.delete(entityId);
        this.aggregatedModifiers.delete(entityId);
        this.cooldownsByEntityId.delete(entityId);
        this.chargesByEntityId.delete(entityId);
        this.immunitiesByEntityId.delete(entityId);
    }

    reset() {
        this.effectsByTarget.clear();
        this.aggregatedModifiers.clear();
        this.cooldownsByEntityId.clear();
        this.chargesByEntityId.clear();
        this.immunitiesByEntityId.clear();
        this.simulationClockSeconds = 0;
    }

    ensureTarget(targetId) {
        if (!this.effectsByTarget.has(targetId)) {
            this.effectsByTarget.set(targetId, []);
        }
        return this.effectsByTarget.get(targetId);
    }

    ensureCooldownState(entityId) {
        if (!this.cooldownsByEntityId.has(entityId)) {
            this.cooldownsByEntityId.set(entityId, { channels: {} });
        }
        return this.cooldownsByEntityId.get(entityId);
    }

    ensureChargeState(entityId) {
        if (!this.chargesByEntityId.has(entityId)) {
            this.chargesByEntityId.set(entityId, { channels: {} });
        }
        return this.chargesByEntityId.get(entityId);
    }

    ensureImmunityState(entityId) {
        if (!this.immunitiesByEntityId.has(entityId)) {
            this.immunitiesByEntityId.set(entityId, { families: {} });
        }
        return this.immunitiesByEntityId.get(entityId);
    }

    getEntityState(entityId) {
        return {
            effects: this.getEffects(entityId),
            aggregatedModifiers: this.getAggregatedModifiers(entityId),
            cooldowns: this.getCooldownState(entityId),
            charges: this.getChargeState(entityId),
            immunities: this.getImmunityState(entityId)
        };
    }

    applyEffect(effect) {
        if (!effect?.targetId || !effect?.family) return null;

        if (this.hasImmunity(effect.targetId, effect.family) && !effect.ignoreImmunity) {
            return null;
        }

        const normalized = {
            id: effect.id || createStatusEffectId(),
            family: effect.family,
            subtype: effect.subtype || effect.family,
            sourceId: effect.sourceId || null,
            targetId: effect.targetId,
            strength: effect.strength ?? 0,
            durationSeconds: effect.durationSeconds ?? null,
            elapsedSeconds: 0,
            appliedAtSeconds: this.simulationClockSeconds,
            metadata: cloneStatusValue(effect.metadata, {}),
            ignoreImmunity: !!effect.ignoreImmunity,
            tags: [...(effect.tags || [])]
        };

        const effects = this.ensureTarget(normalized.targetId);
        const existingIndex = effects.findIndex(existing => existing.id === normalized.id);
        if (existingIndex >= 0) {
            effects[existingIndex] = normalized;
        } else {
            effects.push(normalized);
        }

        this.rebuildTargetBundle(normalized.targetId);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.STATUS_APPLIED, { effect: normalized });
        }
        return normalized;
    }

    removeEffect(effectId, targetId = null) {
        if (targetId) {
            return this.removeEffectFromTarget(effectId, targetId);
        }

        for (const currentTargetId of this.effectsByTarget.keys()) {
            if (this.removeEffectFromTarget(effectId, currentTargetId)) {
                return true;
            }
        }

        return false;
    }

    removeEffectFromTarget(effectId, targetId) {
        const effects = this.effectsByTarget.get(targetId);
        if (!effects) return false;
        const index = effects.findIndex(effect => effect.id === effectId);
        if (index < 0) return false;

        const [removed] = effects.splice(index, 1);
        this.rebuildTargetBundle(targetId);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.STATUS_REMOVED, { effect: removed });
        }
        return true;
    }

    getEffects(targetId) {
        return cloneStatusValue(this.effectsByTarget.get(targetId) || [], []);
    }

    hasEffectFamily(targetId, family) {
        const effects = this.effectsByTarget.get(targetId) || [];
        return effects.some(effect => effect.family === family);
    }

    getAggregatedModifiers(targetId) {
        return cloneStatusValue(this.aggregatedModifiers.get(targetId) || { families: {}, totalEffects: 0 }, { families: {}, totalEffects: 0 });
    }

    setCooldown(entityId, channel, remainingSeconds, options = {}) {
        if (!entityId || !channel) return null;
        const state = this.ensureCooldownState(entityId);
        state.channels[channel] = {
            remainingSeconds: Math.max(0, remainingSeconds ?? 0),
            durationSeconds: Math.max(0, options.durationSeconds ?? remainingSeconds ?? 0),
            sourceId: options.sourceId || null,
            tags: [...(options.tags || [])]
        };
        this.rebuildTargetBundle(entityId);
        return cloneStatusValue(state.channels[channel]);
    }

    clearCooldown(entityId, channel) {
        const state = this.cooldownsByEntityId.get(entityId);
        if (!state?.channels?.[channel]) return false;
        delete state.channels[channel];
        this.rebuildTargetBundle(entityId);
        return true;
    }

    getCooldownState(entityId) {
        return cloneStatusValue(this.cooldownsByEntityId.get(entityId) || { channels: {} }, { channels: {} });
    }

    setCharges(entityId, channel, current, max = current, options = {}) {
        if (!entityId || !channel) return null;
        const state = this.ensureChargeState(entityId);
        state.channels[channel] = {
            current: Math.max(0, current ?? 0),
            max: Math.max(0, max ?? current ?? 0),
            sourceId: options.sourceId || null,
            tags: [...(options.tags || [])]
        };
        this.rebuildTargetBundle(entityId);
        return cloneStatusValue(state.channels[channel]);
    }

    spendCharge(entityId, channel, amount = 1) {
        const state = this.ensureChargeState(entityId);
        const entry = state.channels[channel];
        if (!entry || entry.current < amount) return false;
        entry.current = Math.max(0, entry.current - amount);
        this.rebuildTargetBundle(entityId);
        return true;
    }

    restoreCharge(entityId, channel, amount = 1) {
        const state = this.ensureChargeState(entityId);
        const entry = state.channels[channel];
        if (!entry) return false;
        entry.current = Math.min(entry.max, entry.current + amount);
        this.rebuildTargetBundle(entityId);
        return true;
    }

    getChargeState(entityId) {
        return cloneStatusValue(this.chargesByEntityId.get(entityId) || { channels: {} }, { channels: {} });
    }

    grantImmunity(entityId, family, durationSeconds = null, options = {}) {
        if (!entityId || !family) return null;
        const state = this.ensureImmunityState(entityId);
        state.families[family] = {
            remainingSeconds: durationSeconds == null ? null : Math.max(0, durationSeconds),
            sourceId: options.sourceId || null,
            tags: [...(options.tags || [])]
        };
        this.rebuildTargetBundle(entityId);
        return cloneStatusValue(state.families[family]);
    }

    clearImmunity(entityId, family) {
        const state = this.immunitiesByEntityId.get(entityId);
        if (!state?.families?.[family]) return false;
        delete state.families[family];
        this.rebuildTargetBundle(entityId);
        return true;
    }

    hasImmunity(entityId, family) {
        const state = this.immunitiesByEntityId.get(entityId);
        return !!state?.families?.[family];
    }

    getImmunityState(entityId) {
        return cloneStatusValue(this.immunitiesByEntityId.get(entityId) || { families: {} }, { families: {} });
    }

    rebuildTargetBundle(targetId) {
        const effects = this.effectsByTarget.get(targetId) || [];
        const cooldowns = this.cooldownsByEntityId.get(targetId)?.channels || {};
        const charges = this.chargesByEntityId.get(targetId)?.channels || {};
        const immunities = this.immunitiesByEntityId.get(targetId)?.families || {};
        const bundle = {
            families: {},
            numeric: {},
            cooldowns: cloneStatusValue(cooldowns, {}),
            charges: cloneStatusValue(charges, {}),
            immunities: cloneStatusValue(immunities, {}),
            totalEffects: effects.length
        };

        for (const effect of effects) {
            const current = bundle.families[effect.family];
            if (!current || effect.strength >= current.strength) {
                bundle.families[effect.family] = {
                    id: effect.id,
                    subtype: effect.subtype,
                    sourceId: effect.sourceId,
                    strength: effect.strength,
                    tags: [...effect.tags]
                };
            }
            bundle.numeric[effect.family] = Math.max(bundle.numeric[effect.family] || 0, effect.strength);
        }

        this.aggregatedModifiers.set(targetId, bundle);
        return bundle;
    }

    reconcileAuras(gameState = null) {
        const liveEntityIds = new Set();
        const collections = [
            ...(gameState?.butterflies || []),
            ...(gameState?.caterpillars || []),
            ...(gameState?.flowers || [])
        ];

        for (const entity of collections) {
            if (!entity?.id) continue;
            liveEntityIds.add(entity.id);
            this.registerEntity(entity);
            this.rebuildTargetBundle(entity.id);
        }

        const trackedIds = new Set([
            ...this.effectsByTarget.keys(),
            ...this.cooldownsByEntityId.keys(),
            ...this.chargesByEntityId.keys(),
            ...this.immunitiesByEntityId.keys()
        ]);

        for (const targetId of trackedIds) {
            if (!liveEntityIds.has(targetId) && gameState) {
                this.unregisterEntity(targetId);
            }
        }
    }

    serializeDurableState() {
        const serializeMapValues = (sourceMap) => {
            const serialized = {};
            for (const [key, value] of sourceMap.entries()) {
                serialized[key] = cloneStatusValue(value);
            }
            return serialized;
        };

        return {
            effectsByTarget: serializeMapValues(this.effectsByTarget),
            cooldownsByEntityId: serializeMapValues(this.cooldownsByEntityId),
            chargesByEntityId: serializeMapValues(this.chargesByEntityId),
            immunitiesByEntityId: serializeMapValues(this.immunitiesByEntityId)
        };
    }

    deserializeDurableState(serialized = {}) {
        this.reset();

        const loadMapValues = (targetMap, values = {}) => {
            for (const [key, value] of Object.entries(values || {})) {
                targetMap.set(key, cloneStatusValue(value));
            }
        };

        loadMapValues(this.effectsByTarget, serialized.effectsByTarget);
        loadMapValues(this.cooldownsByEntityId, serialized.cooldownsByEntityId);
        loadMapValues(this.chargesByEntityId, serialized.chargesByEntityId);
        loadMapValues(this.immunitiesByEntityId, serialized.immunitiesByEntityId);

        for (const targetId of this.effectsByTarget.keys()) {
            this.rebuildTargetBundle(targetId);
        }
    }

    update(gameState, deltaSeconds = gameConfig.simulation.fixedDeltaSeconds) {
        this.simulationClockSeconds += deltaSeconds;
        this.reconcileAuras(gameState);

        for (const [targetId, effects] of this.effectsByTarget.entries()) {
            let removedAny = false;
            for (let i = effects.length - 1; i >= 0; i--) {
                const effect = effects[i];
                if (effect.durationSeconds == null) continue;
                effect.elapsedSeconds += deltaSeconds;
                if (effect.elapsedSeconds >= effect.durationSeconds) {
                    effects.splice(i, 1);
                    removedAny = true;
                }
            }

            if (removedAny) {
                this.rebuildTargetBundle(targetId);
                if (typeof eventBus !== 'undefined') {
                    eventBus.emit(GameEvents.STATUS_TICKED, { targetId });
                }
            }
        }

        for (const [entityId, state] of this.cooldownsByEntityId.entries()) {
            let changed = false;
            for (const [channel, entry] of Object.entries(state.channels)) {
                if (entry.remainingSeconds == null) continue;
                entry.remainingSeconds = Math.max(0, entry.remainingSeconds - deltaSeconds);
                if (entry.remainingSeconds === 0) {
                    delete state.channels[channel];
                }
                changed = true;
            }
            if (changed) {
                this.rebuildTargetBundle(entityId);
            }
        }

        for (const [entityId, state] of this.immunitiesByEntityId.entries()) {
            let changed = false;
            for (const [family, entry] of Object.entries(state.families)) {
                if (entry.remainingSeconds == null) continue;
                entry.remainingSeconds = Math.max(0, entry.remainingSeconds - deltaSeconds);
                if (entry.remainingSeconds === 0) {
                    delete state.families[family];
                }
                changed = true;
            }
            if (changed) {
                this.rebuildTargetBundle(entityId);
            }
        }
    }
}

const statusSystem = new StatusSystem();
