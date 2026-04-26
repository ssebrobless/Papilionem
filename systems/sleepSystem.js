function cloneSleepValue(value, fallback = null) {
    if (value == null) return fallback;
    return JSON.parse(JSON.stringify(value));
}

class SleepSystem {
    constructor() {
        this.sleepStateByEntityId = new Map();
        this.simulationClockSeconds = 0;
        this.initialized = false;
    }

    initialize() {
        this.initialized = true;
    }

    createStateFromEntity(entity = null) {
        return {
            subtype: null,
            exhaustion: entity?.lifeSim?.emotions?.exhaustion ?? 0,
            sleepPressure: entity?.lifeSim?.drives?.rest ?? 0.2,
            sleepComfort: 0,
            wakeDrive: 0.5,
            oversleepPressure: 0,
            oversleepHabit: entity?.lifeSim?.distortion?.oversleepBias ?? 0,
            assistSources: [],
            settlingSeconds: 0,
            asleepSeconds: 0,
            lastSleepStartSeconds: null,
            lastWakeSeconds: 0,
            lastWakeReason: null
        };
    }

    registerEntity(entity) {
        return this.ensureState(entity);
    }

    unregisterEntity(entityId) {
        this.sleepStateByEntityId.delete(entityId);
    }

    reset() {
        this.sleepStateByEntityId.clear();
        this.simulationClockSeconds = 0;
    }

    ensureState(entity) {
        if (!entity?.id) return null;
        if (!this.sleepStateByEntityId.has(entity.id)) {
            this.sleepStateByEntityId.set(entity.id, this.createStateFromEntity(entity));
        }
        return this.sleepStateByEntityId.get(entity.id);
    }

    clamp01(value) {
        return Math.max(0, Math.min(1, value));
    }

    getTuning() {
        return gameConfig?.balance?.sleep || {};
    }

    getKnownSleepSubtypes() {
        return new Set(gameConfig?.registries?.sleepSubtypes || []);
    }

    setExhaustion(entityId, exhaustion) {
        const state = this.sleepStateByEntityId.get(entityId) || this.createStateFromEntity();
        state.exhaustion = this.clamp01(exhaustion ?? 0);
        this.sleepStateByEntityId.set(entityId, state);
        return cloneSleepValue(state);
    }

    requestSleepAssist(targetId, sourceId, assistType = 'comfort', strength = null) {
        const state = this.sleepStateByEntityId.get(targetId) || this.createStateFromEntity();
        const tuning = this.getTuning();
        state.assistSources.push({
            sourceId,
            assistType,
            strength: typeof strength === 'number' ? strength : (tuning.assistStrengthDefault ?? 0.15),
            requestedAtSeconds: this.simulationClockSeconds
        });
        this.sleepStateByEntityId.set(targetId, state);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.SLEEP_ASSIST_REQUESTED, { targetId, sourceId, assistType, strength });
        }
        return cloneSleepValue(state);
    }

    setSleepSubtype(entityId, subtype, reason = null) {
        const state = this.sleepStateByEntityId.get(entityId) || this.createStateFromEntity();
        const knownSubtypes = this.getKnownSleepSubtypes();
        const normalizedSubtype = subtype && knownSubtypes.has(subtype) ? subtype : subtype || null;
        const changed = state.subtype !== normalizedSubtype;

        state.subtype = normalizedSubtype;
        if (!normalizedSubtype) {
            state.settlingSeconds = 0;
            state.asleepSeconds = 0;
            state.lastWakeSeconds = this.simulationClockSeconds;
            state.lastWakeReason = reason || state.lastWakeReason;
        } else if (changed) {
            state.lastSleepStartSeconds = this.simulationClockSeconds;
            state.lastWakeReason = null;
            if (normalizedSubtype === 'settling_sleep') {
                state.settlingSeconds = 0;
            }
            if (normalizedSubtype === 'normal_sleep' || normalizedSubtype === 'oversleeping' || normalizedSubtype === 'forced_battle_sleep') {
                state.asleepSeconds = 0;
            }
        }

        this.sleepStateByEntityId.set(entityId, state);
        if (changed && typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.SLEEP_STATE_CHANGED, { entityId, subtype: normalizedSubtype, reason });
        }
        return cloneSleepValue(state);
    }

    wakeEntity(entityId, reason = 'manual') {
        return this.setSleepSubtype(entityId, null, reason);
    }

    getSleepState(entityId) {
        const state = this.sleepStateByEntityId.get(entityId);
        return state ? cloneSleepValue(state) : null;
    }

    isSleeping(entityId) {
        return !!this.sleepStateByEntityId.get(entityId)?.subtype;
    }

    isFullyAsleep(entityId) {
        const subtype = this.sleepStateByEntityId.get(entityId)?.subtype;
        return subtype === 'normal_sleep' || subtype === 'oversleeping' || subtype === 'forced_battle_sleep';
    }

    getMovementMultiplier(entityId) {
        const tuning = this.getTuning();
        const subtype = this.sleepStateByEntityId.get(entityId)?.subtype;
        if (subtype === 'settling_sleep') return tuning.movementMultiplierSettling ?? 0.25;
        if (subtype === 'normal_sleep' || subtype === 'oversleeping' || subtype === 'forced_battle_sleep') return 0;
        return 1;
    }

    getWingAnimationMultiplier(entityId) {
        const tuning = this.getTuning();
        const subtype = this.sleepStateByEntityId.get(entityId)?.subtype;
        if (subtype === 'settling_sleep') return tuning.wingAnimationMultiplierSettling ?? 0.35;
        if (subtype === 'normal_sleep' || subtype === 'oversleeping' || subtype === 'forced_battle_sleep') return tuning.wingAnimationMultiplierAsleep ?? 0.08;
        return 1;
    }

    getVisualState(entityId) {
        const tuning = this.getTuning();
        const state = this.sleepStateByEntityId.get(entityId);
        if (!state) return null;
        return {
            subtype: state.subtype,
            isSleeping: !!state.subtype,
            settled: state.subtype === 'normal_sleep' || state.subtype === 'oversleeping' || state.subtype === 'forced_battle_sleep',
            yOffset: state.subtype ? (state.subtype === 'settling_sleep'
                ? (tuning.visualYOffsetSettling ?? 1.5)
                : (tuning.visualYOffsetAsleep ?? 3)) : 0,
            tilt: state.subtype ? (state.subtype === 'settling_sleep'
                ? (tuning.visualTiltSettling ?? 0.08)
                : (tuning.visualTiltAsleep ?? 0.18)) : 0
        };
    }

    canEntitySleep(entity) {
        if (!entity || entity.isSpawning) return false;
        if (entity.constructor?.name === 'Flower') return false;
        const allBlocks = gameCore?.gameState?.blocks || [];
        const carriedBlock = typeof entity.getCarriedBlock === 'function'
            ? entity.getCarriedBlock(allBlocks)
            : null;
        if (carriedBlock || entity.blockInteraction?.carryingBlockId) return false;

        const blockedStates = new Set(['scared', 'feeding', 'following', 'mating', 'pregnant-travel']);
        return !blockedStates.has(entity.state);
    }

    getStatusStrength(entityId, family) {
        const bundle = typeof statusSystem !== 'undefined'
            ? statusSystem.getAggregatedModifiers(entityId)
            : { numeric: {}, families: {} };
        if (typeof bundle.numeric?.[family] === 'number') {
            return bundle.numeric[family];
        }
        return bundle.families?.[family]?.strength ?? 0;
    }

    syncStateToEntity(entity, state) {
        if (!entity?.lifeSim) return;

        if (entity.lifeSim.emotions) {
            entity.lifeSim.emotions.exhaustion = state.exhaustion;
        }

        if (entity.lifeSim.lifecycle) {
            entity.lifeSim.lifecycle.sleepSubtype = state.subtype;
            entity.lifeSim.lifecycle.sleeping = !!state.subtype;
            entity.lifeSim.lifecycle.lastSleepStartSeconds = state.lastSleepStartSeconds;
            entity.lifeSim.lifecycle.lastWakeSeconds = state.lastWakeSeconds;
            entity.lifeSim.lifecycle.lastWakeReason = state.lastWakeReason;
        }

        if (entity.lifeSim.distortion) {
            state.oversleepHabit = entity.lifeSim.distortion.oversleepBias ?? state.oversleepHabit;
        }

        if (entity.lifeSim.drives) {
            state.sleepPressure = this.clamp01(entity.lifeSim.drives.rest ?? state.sleepPressure);
        }
    }

    updateEntityState(entity, deltaSeconds) {
        const state = this.ensureState(entity);
        if (!state) return null;
        const tuning = this.getTuning();

        const comfortAssist = state.assistSources.reduce((total, assist) => total + (assist.strength || 0), 0);
        const comfortBonus = this.getStatusStrength(entity.id, 'sleep_comfort_bonus');
        const wakeResistance = this.getStatusStrength(entity.id, 'wake_resistance');
        const recoveryMultiplier = 1 + this.getStatusStrength(entity.id, 'sleep_recovery_multiplier');
        const forcedSleepStrength = this.getStatusStrength(entity.id, 'forced_sleep');
        const forcedSleepImmune = this.getStatusStrength(entity.id, 'forced_sleep_immunity') > 0
            || (typeof statusSystem !== 'undefined' && statusSystem.hasImmunity(entity.id, 'forced_sleep'));
        const socialEcology = entity?.lifeSim?.derived?.socialEcology || {};
        const roostSupport = this.clamp01(
            (socialEcology?.roosting?.score || 0) * 0.28
            + Math.min(0.16, (socialEcology?.roosting?.supportCount || 0) * 0.04)
        );
        const warningPressure = this.clamp01((socialEcology?.warning?.score || 0) * 0.24);

        state.sleepComfort = this.clamp01(comfortAssist + comfortBonus + roostSupport);
        state.wakeDrive = this.clamp01(0.4 + (1 - state.exhaustion) * 0.5 - wakeResistance * 0.1 - roostSupport * 0.12 + warningPressure * 0.08);

        const restDrive = this.clamp01(entity?.lifeSim?.drives?.rest ?? state.sleepPressure ?? 0.2);
        const insomniaBias = this.clamp01(entity?.lifeSim?.distortion?.insomniaBias ?? 0);
        const oversleepBias = this.clamp01(entity?.lifeSim?.distortion?.oversleepBias ?? state.oversleepHabit ?? 0);
        const allBlocks = gameCore?.gameState?.blocks || [];
        const isCarryingForSleep = () => {
            const carriedBlock = typeof entity.getCarriedBlock === 'function'
                ? entity.getCarriedBlock(allBlocks)
                : null;
            return !!(carriedBlock || entity.blockInteraction?.carryingBlockId);
        };
        const releaseCarryForSleepAttempt = () => {
            if (!isCarryingForSleep()) return false;
            entity.releaseCarriedBlockForSleep?.(allBlocks);
            return isCarryingForSleep();
        };
        let canSleep = this.canEntitySleep(entity);

        if (!state.subtype) {
            const passiveGain =
                (tuning.passiveExhaustionBaseGain ?? 0.006) +
                restDrive * (tuning.passiveExhaustionRestMultiplier ?? 0.004) +
                insomniaBias * (tuning.passiveExhaustionInsomniaMultiplier ?? 0.002);
            state.exhaustion = this.clamp01(state.exhaustion + passiveGain * deltaSeconds);

            const settleThreshold = Math.max(
                tuning.settleThresholdFloor ?? 0.28,
                (tuning.settleThresholdBase ?? 0.62) +
                insomniaBias * (tuning.settleThresholdInsomniaMultiplier ?? 0.08) -
                state.sleepComfort * (tuning.settleThresholdComfortMultiplier ?? 0.05) +
                warningPressure * 0.04 -
                roostSupport * 0.06
            );
            const shouldForceSleep = forcedSleepStrength > 0 && !forcedSleepImmune;
            if (shouldForceSleep || state.exhaustion >= settleThreshold) {
                if (!canSleep && isCarryingForSleep()) {
                    const stillCarrying = releaseCarryForSleepAttempt();
                    canSleep = this.canEntitySleep(entity);
                    if (stillCarrying || !canSleep) {
                        this.syncStateToEntity(entity, state);
                        return state;
                    }
                }
            }
            if (canSleep && (shouldForceSleep || state.exhaustion >= settleThreshold)) {
                this.setSleepSubtype(entity.id, shouldForceSleep ? 'forced_battle_sleep' : 'settling_sleep', shouldForceSleep ? 'forced-sleep' : 'exhaustion-threshold');
            }
        } else if (state.subtype === 'settling_sleep') {
            if (!canSleep) {
                if (isCarryingForSleep()) {
                    releaseCarryForSleepAttempt();
                    canSleep = this.canEntitySleep(entity);
                }
                if (!canSleep) {
                    this.wakeEntity(entity.id, 'sleep-interrupted');
                }
            } else {
                state.settlingSeconds += deltaSeconds;
                const settlingDuration = Math.max(0.8, (tuning.settlingDurationSeconds ?? 1.5) - roostSupport * 0.25 + warningPressure * 0.1);
                if (state.settlingSeconds >= settlingDuration) {
                    this.setSleepSubtype(entity.id, 'normal_sleep', 'settled');
                }
            }
        } else if (state.subtype === 'normal_sleep') {
            state.asleepSeconds += deltaSeconds;
            const recoveryRate = (
                (tuning.normalRecoveryBaseRate ?? 0.032) +
                state.sleepComfort * (tuning.normalRecoveryComfortMultiplier ?? 0.014)
            ) * recoveryMultiplier * (1 + roostSupport * 0.12);
            state.exhaustion = this.clamp01(state.exhaustion - recoveryRate * deltaSeconds);
            state.oversleepPressure = this.clamp01(
                state.oversleepPressure +
                oversleepBias * (tuning.oversleepPressureGainMultiplier ?? 0.02) * deltaSeconds
            );

            const wakeThreshold = Math.max(
                tuning.wakeThresholdFloor ?? 0.08,
                (tuning.wakeThresholdBase ?? 0.18) -
                wakeResistance * (tuning.wakeThresholdResistanceMultiplier ?? 0.03) +
                warningPressure * 0.04 -
                roostSupport * 0.03
            );
            if (forcedSleepStrength <= 0 && state.exhaustion <= wakeThreshold && state.asleepSeconds >= (tuning.wakeMinimumSleepSeconds ?? 4)) {
                if (state.oversleepPressure > (tuning.oversleepThresholdBase ?? 0.35) + oversleepBias * (tuning.oversleepThresholdBiasMultiplier ?? 0.15)) {
                    this.setSleepSubtype(entity.id, 'oversleeping', 'oversleep-pressure');
                } else {
                    this.wakeEntity(entity.id, 'recovered');
                }
            }
        } else if (state.subtype === 'oversleeping') {
            state.asleepSeconds += deltaSeconds;
            state.exhaustion = this.clamp01(state.exhaustion - (tuning.oversleepRecoveryRate ?? 0.02) * recoveryMultiplier * deltaSeconds);
            state.oversleepPressure = this.clamp01(state.oversleepPressure - (tuning.oversleepPressureDecayRate ?? 0.016) * deltaSeconds);

            if (forcedSleepStrength <= 0 && state.oversleepPressure <= 0.05 && state.asleepSeconds >= 8) {
                this.wakeEntity(entity.id, 'oversleep-finished');
            }
        } else if (state.subtype === 'forced_battle_sleep') {
            state.asleepSeconds += deltaSeconds;
            state.exhaustion = this.clamp01(state.exhaustion - (tuning.forcedSleepRecoveryRate ?? 0.014) * recoveryMultiplier * deltaSeconds);
            if (forcedSleepStrength <= 0) {
                this.wakeEntity(entity.id, 'forced-sleep-ended');
            }
        }

        if (!state.subtype) {
            state.oversleepPressure = this.clamp01(
                state.oversleepPressure - (tuning.passiveOversleepPressureDecayRate ?? 0.004) * deltaSeconds
            );
        }

        state.assistSources = [];
        this.syncStateToEntity(entity, state);
        return state;
    }

    serializeDurableState() {
        const serialized = {};
        for (const [entityId, state] of this.sleepStateByEntityId.entries()) {
            const entity = [
                ...(gameCore?.gameState?.butterflies || []),
                ...(gameCore?.gameState?.caterpillars || [])
            ].find(item => item?.id === entityId);
            if (entity?.lifeSim?.drives) {
                state.sleepPressure = this.clamp01(entity.lifeSim.drives.rest ?? state.sleepPressure);
            }
            if (entity?.lifeSim?.distortion) {
                state.oversleepHabit = this.clamp01(entity.lifeSim.distortion.oversleepBias ?? state.oversleepHabit);
            }
            serialized[entityId] = {
                subtype: state.subtype,
                exhaustion: state.exhaustion,
                sleepPressure: state.sleepPressure,
                oversleepPressure: state.oversleepPressure,
                oversleepHabit: state.oversleepHabit,
                settlingSeconds: state.settlingSeconds,
                asleepSeconds: state.asleepSeconds,
                lastSleepStartSeconds: state.lastSleepStartSeconds,
                lastWakeSeconds: state.lastWakeSeconds,
                lastWakeReason: state.lastWakeReason
            };
        }
        return serialized;
    }

    deserializeDurableState(serialized = {}) {
        this.reset();
        for (const [entityId, state] of Object.entries(serialized || {})) {
            this.sleepStateByEntityId.set(entityId, {
                ...this.createStateFromEntity(),
                ...cloneSleepValue(state),
                assistSources: []
            });
        }
    }

    update(gameState, deltaSeconds = gameConfig.simulation.fixedDeltaSeconds) {
        this.simulationClockSeconds += deltaSeconds;

        for (const butterfly of gameState.butterflies || []) {
            this.updateEntityState(butterfly, deltaSeconds);
        }
        for (const caterpillar of gameState.caterpillars || []) {
            this.updateEntityState(caterpillar, deltaSeconds);
        }
    }
}

const sleepSystem = new SleepSystem();
