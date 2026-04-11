class BattleSystem {
    constructor() {
        this.snapshots = new Map();
        this.activeBattleId = null;
        this.battleCounter = 0;
        this.maxEventsPerBattle = 120;
        this.initialized = false;
    }

    initialize() {
        this.initialized = true;
    }

    reset() {
        this.snapshots.clear();
        this.activeBattleId = null;
        this.battleCounter = 0;
    }

    cloneValue(value, fallback = null) {
        if (value == null) return fallback;
        return JSON.parse(JSON.stringify(value));
    }

    createBattleId() {
        this.battleCounter += 1;
        return `battle_${Date.now()}_${this.battleCounter}`;
    }

    getParticipantSource(entityId) {
        const collections = [
            ...(gameCore?.gameState?.butterflies || []),
            ...(gameCore?.gameState?.caterpillars || []),
            ...(gameCore?.gameState?.flowers || [])
        ];
        return collections.find(entity => entity.id === entityId) || null;
    }

    normalizeParticipants(participants = []) {
        return participants
            .map((entry, index) => {
                if (!entry) return null;
                if (entry.entity) {
                    return {
                        entity: entry.entity,
                        teamId: entry.teamId || 'neutral',
                        role: entry.role || 'combatant',
                        index
                    };
                }
                return {
                    entity: entry,
                    teamId: 'neutral',
                    role: 'combatant',
                    index
                };
            })
            .filter(Boolean);
    }

    createParticipantSnapshot(participant) {
        const entity = participant.entity;
        const sleepState = typeof sleepSystem !== 'undefined' ? sleepSystem.getSleepState(entity.id) : null;
        const behaviorRuntime = typeof behaviorSystem !== 'undefined' ? behaviorSystem.getRuntime(entity.id) : null;
        const statusBundle = typeof statusSystem !== 'undefined'
            ? statusSystem.getAggregatedModifiers(entity.id)
            : { families: {}, totalEffects: 0 };

        return {
            id: entity.id,
            entityType: entity.lifeSim?.identity?.entityType || entity.constructor?.name || 'entity',
            archetype: entity.lifeSim?.identity?.archetype || entity.personalityType || entity.constructor?.name || 'entity',
            teamId: participant.teamId,
            role: participant.role,
            hp: entity.hp ?? entity.battleState?.hp ?? 100,
            maxHp: entity.maxHp ?? entity.battleState?.maxHp ?? 100,
            pressure: entity.battleState?.pressure ?? 0,
            retreatScore: entity.battleState?.retreatScore ?? 0,
            defeated: false,
            retreated: false,
            exhaustion: sleepState?.exhaustion ?? entity.lifeSim?.emotions?.exhaustion ?? 0,
            sleepSubtype: sleepState?.subtype || null,
            actionFamily: behaviorRuntime?.currentActionFamily ?? 'idle',
            actionSubtype: behaviorRuntime?.currentActionSubtype ?? 'idle',
            targetId: behaviorRuntime?.currentTargetId ?? null,
            statusBundle: this.cloneValue(statusBundle, { families: {}, totalEffects: 0 }),
            cooldowns: typeof statusSystem !== 'undefined' ? statusSystem.getCooldownState(entity.id) : { channels: {} },
            charges: typeof statusSystem !== 'undefined' ? statusSystem.getChargeState(entity.id) : { channels: {} },
            carriedObjectIds: typeof objectSystem !== 'undefined' ? objectSystem.getObjectsByCarrier(entity.id) : [],
            socialEdges: this.cloneValue(entity.lifeSim?.socialEdges || {}, {}),
            genetics: this.cloneValue(entity.lifeSim?.genetics || {}, {}),
            abilities: {
                specialAbility: typeof entity.getSpecialAbility === 'function'
                    ? entity.getSpecialAbility()
                    : entity.specialAbility || null
            },
            commit: {
                exhaustion: sleepState?.exhaustion ?? entity.lifeSim?.emotions?.exhaustion ?? 0,
                cooldowns: typeof statusSystem !== 'undefined' ? statusSystem.getCooldownState(entity.id) : { channels: {} },
                charges: typeof statusSystem !== 'undefined' ? statusSystem.getChargeState(entity.id) : { channels: {} },
                memories: [],
                socialAdjustments: {}
            }
        };
    }

    buildSnapshot(battleId, participants = [], options = {}) {
        const normalizedParticipants = this.normalizeParticipants(participants);
        const participantSnapshots = normalizedParticipants.map(participant => this.createParticipantSnapshot(participant));
        const teams = {};

        for (const participant of participantSnapshots) {
            if (!teams[participant.teamId]) {
                teams[participant.teamId] = {
                    teamId: participant.teamId,
                    participantIds: []
                };
            }
            teams[participant.teamId].participantIds.push(participant.id);
        }

        return {
            battleId,
            state: 'snapshotting',
            mode: options.mode || 'skirmish',
            createdAtMs: Date.now(),
            participantOrder: participantSnapshots.map(participant => participant.id),
            participantsById: Object.fromEntries(participantSnapshots.map(participant => [participant.id, participant])),
            teams,
            events: [],
            result: null,
            metadata: this.cloneValue(options.metadata, {})
        };
    }

    startSnapshot(battleId, participants = [], options = {}) {
        const snapshot = this.buildSnapshot(battleId, participants, options);
        this.snapshots.set(battleId, snapshot);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.BATTLE_SNAPSHOT_CREATED, { battleId, snapshot });
        }
        return snapshot;
    }

    startBattle(participants = [], options = {}) {
        const battleId = options.battleId || this.createBattleId();
        const snapshot = this.startSnapshot(battleId, participants, options);
        snapshot.state = 'active';
        this.activeBattleId = battleId;
        this.appendBattleEvent(battleId, 'battle-started', {
            mode: snapshot.mode,
            participantIds: [...snapshot.participantOrder],
            teamIds: Object.keys(snapshot.teams || {})
        });
        return snapshot;
    }

    getSnapshot(battleId = this.activeBattleId) {
        const snapshot = this.snapshots.get(battleId);
        return snapshot ? this.cloneValue(snapshot) : null;
    }

    getParticipantSnapshot(battleId, participantId) {
        const snapshot = this.snapshots.get(battleId);
        return snapshot?.participantsById?.[participantId]
            ? this.cloneValue(snapshot.participantsById[participantId])
            : null;
    }

    appendBattleEvent(battleId, eventType, payload = {}) {
        const snapshot = this.snapshots.get(battleId);
        if (!snapshot) return null;
        const event = {
            id: `${battleId}_event_${snapshot.events.length + 1}`,
            eventType,
            timestampMs: Date.now(),
            payload: this.cloneValue(payload, {})
        };
        snapshot.events.push(event);
        if (snapshot.events.length > this.maxEventsPerBattle) {
            snapshot.events.shift();
        }
        return event;
    }

    getBattleEvents(battleId = this.activeBattleId) {
        const snapshot = this.snapshots.get(battleId);
        return snapshot ? this.cloneValue(snapshot.events, []) : [];
    }

    getRecentBattleEvents(battleId = this.activeBattleId, limit = 6) {
        return this.getBattleEvents(battleId).slice(-limit).reverse();
    }

    withParticipant(battleId, participantId, updater) {
        const snapshot = this.snapshots.get(battleId);
        if (!snapshot?.participantsById?.[participantId]) return null;
        const participant = snapshot.participantsById[participantId];
        updater(participant, snapshot);
        return participant;
    }

    setParticipantAction(battleId, participantId, actionFamily, actionSubtype = actionFamily, targetId = null) {
        return this.withParticipant(battleId, participantId, participant => {
            participant.actionFamily = actionFamily;
            participant.actionSubtype = actionSubtype;
            participant.targetId = targetId;
            this.appendBattleEvent(battleId, 'action-set', {
                actorId: participantId,
                actionFamily,
                actionSubtype,
                targetId
            });
        });
    }

    modifyParticipantHp(battleId, participantId, delta) {
        return this.withParticipant(battleId, participantId, participant => {
            participant.hp = Math.max(0, Math.min(participant.maxHp, participant.hp + delta));
            participant.defeated = participant.hp <= 0;
            participant.commit.hp = participant.hp;
            this.appendBattleEvent(battleId, delta >= 0 ? 'hp-restored' : 'hp-lost', {
                actorId: participantId,
                delta,
                hp: participant.hp,
                defeated: participant.defeated
            });
        });
    }

    applyPressure(battleId, participantId, delta) {
        return this.withParticipant(battleId, participantId, participant => {
            participant.pressure = Math.max(0, participant.pressure + delta);
            participant.commit.pressure = participant.pressure;
            this.appendBattleEvent(battleId, 'pressure-changed', {
                actorId: participantId,
                delta,
                pressure: participant.pressure
            });
        });
    }

    markParticipantRetreat(battleId, participantId, retreatScore = 1) {
        return this.withParticipant(battleId, participantId, participant => {
            participant.retreated = true;
            participant.retreatScore = Math.max(participant.retreatScore, retreatScore);
            participant.commit.retreated = true;
            participant.commit.retreatScore = participant.retreatScore;
            this.appendBattleEvent(battleId, 'participant-retreated', {
                actorId: participantId,
                retreatScore: participant.retreatScore
            });
        });
    }

    spendCooldown(battleId, participantId, channel, remainingSeconds, options = {}) {
        return this.withParticipant(battleId, participantId, participant => {
            participant.cooldowns.channels[channel] = {
                remainingSeconds: Math.max(0, remainingSeconds),
                durationSeconds: Math.max(0, options.durationSeconds ?? remainingSeconds),
                sourceId: options.sourceId || null,
                tags: [...(options.tags || [])]
            };
            participant.commit.cooldowns = this.cloneValue(participant.cooldowns);
            this.appendBattleEvent(battleId, 'cooldown-set', {
                actorId: participantId,
                channel,
                remainingSeconds: participant.cooldowns.channels[channel].remainingSeconds,
                durationSeconds: participant.cooldowns.channels[channel].durationSeconds
            });
        });
    }

    spendCharge(battleId, participantId, channel, amount = 1) {
        return this.withParticipant(battleId, participantId, participant => {
            const entry = participant.charges.channels[channel];
            if (!entry) return;
            entry.current = Math.max(0, entry.current - amount);
            participant.commit.charges = this.cloneValue(participant.charges);
            this.appendBattleEvent(battleId, 'charge-spent', {
                actorId: participantId,
                channel,
                amount,
                remaining: entry.current
            });
        });
    }

    addCommitMemory(battleId, participantId, memory) {
        return this.withParticipant(battleId, participantId, participant => {
            participant.commit.memories.push(this.cloneValue(memory, {}));
            this.appendBattleEvent(battleId, 'memory-added', {
                actorId: participantId,
                family: memory?.family || 'outcome',
                subjectId: memory?.subjectId || null
            });
        });
    }

    adjustCommitSocialEdge(battleId, participantId, targetId, deltas = {}) {
        return this.withParticipant(battleId, participantId, participant => {
            if (!participant.commit.socialAdjustments[targetId]) {
                participant.commit.socialAdjustments[targetId] = {};
            }
            for (const [key, value] of Object.entries(deltas)) {
                participant.commit.socialAdjustments[targetId][key] =
                    (participant.commit.socialAdjustments[targetId][key] || 0) + value;
            }
            this.appendBattleEvent(battleId, 'social-adjusted', {
                actorId: participantId,
                targetId,
                deltas: this.cloneValue(deltas, {})
            });
        });
    }

    buildCommitPayload(snapshot) {
        return {
            battleId: snapshot.battleId,
            participants: snapshot.participantOrder.map(participantId => ({
                id: participantId,
                ...this.cloneValue(snapshot.participantsById[participantId].commit, {})
            })),
            result: this.cloneValue(snapshot.result, {})
        };
    }

    resolveSnapshot(battleId, result = {}) {
        const snapshot = this.snapshots.get(battleId);
        if (!snapshot) return null;
        snapshot.state = 'resolving';
        snapshot.result = {
            winnerTeamId: result.winnerTeamId || null,
            summary: result.summary || null,
            endedAtMs: Date.now(),
            metadata: this.cloneValue(result.metadata, {})
        };
        snapshot.commitPayload = this.buildCommitPayload(snapshot);
        this.appendBattleEvent(battleId, 'battle-resolved', {
            winnerTeamId: snapshot.result.winnerTeamId,
            summary: snapshot.result.summary || null
        });
        return this.cloneValue(snapshot);
    }

    applyCommitPayload(payload) {
        for (const participantResult of payload.participants || []) {
            const entity = this.getParticipantSource(participantResult.id);
            if (!entity) continue;

            entity.battleState = {
                hp: participantResult.hp ?? entity.battleState?.hp ?? 100,
                maxHp: entity.battleState?.maxHp ?? 100,
                pressure: participantResult.pressure ?? entity.battleState?.pressure ?? 0,
                retreated: !!participantResult.retreated,
                retreatScore: participantResult.retreatScore ?? entity.battleState?.retreatScore ?? 0,
                lastBattleId: payload.battleId
            };

            if (typeof sleepSystem !== 'undefined' && typeof participantResult.exhaustion === 'number') {
                sleepSystem.setExhaustion(entity.id, participantResult.exhaustion);
            }

            if (typeof statusSystem !== 'undefined') {
                for (const [channel, cooldown] of Object.entries(participantResult.cooldowns?.channels || {})) {
                    statusSystem.setCooldown(entity.id, channel, cooldown.remainingSeconds, cooldown);
                }
                for (const [channel, charge] of Object.entries(participantResult.charges?.channels || {})) {
                    statusSystem.setCharges(entity.id, channel, charge.current, charge.max, charge);
                }
            }

            for (const memory of participantResult.memories || []) {
                appendLifeMemory(entity, memory.family || 'outcome', {
                    subjectId: memory.subjectId || payload.battleId,
                    valence: memory.valence ?? 0,
                    strength: memory.strength ?? 0.3,
                    tags: [...(memory.tags || ['battle-result'])],
                    createdAtSeconds: memory.createdAtSeconds ?? null,
                    metadata: { ...(memory.metadata || {}) }
                });
            }

            for (const [targetId, deltas] of Object.entries(participantResult.socialAdjustments || {})) {
                adjustLifeSocialEdge(entity, targetId, deltas, {
                    updatedAtSeconds: null,
                    tag: 'battle-result'
                });
            }

            if (entity.lifeSim?.lifecycle) {
                entity.lifeSim.lifecycle.lastBattleId = payload.battleId;
                entity.lifeSim.lifecycle.lastBattleResult = this.cloneValue(payload.result, {});
            }
        }
    }

    commitResults(battleId) {
        const snapshot = this.snapshots.get(battleId);
        if (!snapshot) return null;
        snapshot.state = 'committing';
        const payload = snapshot.commitPayload || this.buildCommitPayload(snapshot);
        this.appendBattleEvent(battleId, 'battle-commit-started', {
            participantCount: payload.participants?.length || 0
        });
        this.applyCommitPayload(payload);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.BATTLE_COMMITTED, { battleId, snapshot: this.cloneValue(snapshot), payload });
        }
        if (this.activeBattleId === battleId) {
            this.activeBattleId = null;
        }
        this.appendBattleEvent(battleId, 'battle-committed', {
            winnerTeamId: payload.result?.winnerTeamId || null
        });
        return this.cloneValue(snapshot);
    }

    update(gameState) {
        if (!this.activeBattleId) return;
        const snapshot = this.snapshots.get(this.activeBattleId);
        if (!snapshot || snapshot.state !== 'active') return;
        snapshot.lastObservedPopulation = {
            butterflies: gameState.butterflies?.length || 0,
            caterpillars: gameState.caterpillars?.length || 0,
            flowers: gameState.flowers?.length || 0
        };
    }
}

const battleSystem = new BattleSystem();
