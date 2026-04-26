class RosterSystem {
    constructor() {
        this.initialized = false;
        this.defaultSides = ['left', 'right'];
        this.sideAliases = {
            alpha: 'left',
            beta: 'right',
            left: 'left',
            right: 'right'
        };
    }

    initialize() {
        this.initialized = true;
    }

    reset(gameState = gameCore?.gameState) {
        if (!gameState) return;
        gameState.roster = {
            memberIds: [],
            battleSides: {
                left: [],
                right: []
            },
            lastBattleStates: {}
        };
    }

    ensureState(gameState = gameCore?.gameState) {
        if (!gameState) return null;
        gameState.roster = gameState.roster || {};
        gameState.roster.memberIds = Array.isArray(gameState.roster.memberIds) ? gameState.roster.memberIds : [];
        const legacySquads = gameState.roster.squads || {};
        gameState.roster.battleSides = gameState.roster.battleSides || {};
        for (const sideId of this.defaultSides) {
            const legacyIds = sideId === 'left'
                ? (legacySquads.left || legacySquads.alpha || [])
                : (legacySquads.right || legacySquads.beta || []);
            gameState.roster.battleSides[sideId] = Array.isArray(gameState.roster.battleSides[sideId])
                ? gameState.roster.battleSides[sideId]
                : Array.isArray(legacyIds)
                    ? [...legacyIds]
                : [];
        }
        delete gameState.roster.squads;
        gameState.roster.lastBattleStates = gameState.roster.lastBattleStates || {};
        this.pruneMissingMembers(gameState, gameState.roster);
        return gameState.roster;
    }

    normalizeSideId(sideId = 'left') {
        return this.sideAliases?.[sideId] || 'left';
    }

    pruneMissingMembers(gameState = gameCore?.gameState, roster = null) {
        const safeRoster = roster || this.ensureState(gameState);
        if (!safeRoster) return;
        const liveIds = new Set((gameState?.butterflies || []).map(butterfly => butterfly.id));
        safeRoster.memberIds = safeRoster.memberIds.filter(id => liveIds.has(id));
        for (const sideId of this.defaultSides) {
            safeRoster.battleSides[sideId] = safeRoster.battleSides[sideId].filter(id => liveIds.has(id) && safeRoster.memberIds.includes(id));
        }
        for (const entityId of Object.keys(safeRoster.lastBattleStates || {})) {
            if (!liveIds.has(entityId)) {
                delete safeRoster.lastBattleStates[entityId];
            }
        }
    }

    registerButterfly(_entity, gameState = gameCore?.gameState) {
        this.ensureState(gameState);
    }

    unregisterButterfly(entityId, gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        if (!roster || !entityId) return;
        roster.memberIds = roster.memberIds.filter(id => id !== entityId);
        for (const sideId of this.defaultSides) {
            roster.battleSides[sideId] = roster.battleSides[sideId].filter(id => id !== entityId);
        }
        delete roster.lastBattleStates[entityId];
    }

    isMember(entityId, gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        return !!entityId && roster.memberIds.includes(entityId);
    }

    toggleMember(entityId, gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        if (!entityId) return false;
        if (this.isMember(entityId, gameState)) {
            this.unregisterButterfly(entityId, gameState);
            return false;
        }
        roster.memberIds.push(entityId);
        return true;
    }

    assignToBattleSide(entityId, sideId = 'left', gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        const normalizedSideId = this.normalizeSideId(sideId);
        if (!entityId || !this.defaultSides.includes(normalizedSideId)) return false;
        if (!this.isMember(entityId, gameState)) {
            roster.memberIds.push(entityId);
        }
        for (const candidateSideId of this.defaultSides) {
            roster.battleSides[candidateSideId] = roster.battleSides[candidateSideId].filter(id => id !== entityId);
        }
        roster.battleSides[normalizedSideId].push(entityId);
        return true;
    }

    removeFromBattleSides(entityId, gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        if (!entityId) return false;
        for (const sideId of this.defaultSides) {
            roster.battleSides[sideId] = roster.battleSides[sideId].filter(id => id !== entityId);
        }
        return true;
    }

    cycleSquad(entityId, gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        if (!entityId) return null;
        if (!this.isMember(entityId, gameState)) {
            this.assignToBattleSide(entityId, 'left', gameState);
            return 'left';
        }

        const currentIndex = this.defaultSides.findIndex(sideId => roster.battleSides[sideId].includes(entityId));
        const nextSideId = this.defaultSides[(currentIndex + 1) % this.defaultSides.length];
        this.assignToBattleSide(entityId, nextSideId, gameState);
        return nextSideId;
    }

    assignToSquad(entityId, squadId = 'left', gameState = gameCore?.gameState) {
        return this.assignToBattleSide(entityId, squadId, gameState);
    }

    getBattleSideMembers(sideId = 'left', gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        return (roster?.battleSides?.[this.normalizeSideId(sideId)] || []).slice();
    }

    getSquadMembers(squadId = 'left', gameState = gameCore?.gameState) {
        return this.getBattleSideMembers(squadId, gameState);
    }

    getEntitySummary(entityId, gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        if (!entityId) {
            return {
                member: false,
                label: 'Not on battle roster'
            };
        }
        return {
            member: roster.memberIds.includes(entityId),
            label: roster.memberIds.includes(entityId)
                ? 'On battle roster'
                : 'Not on battle roster'
        };
    }

    getBattleCapacity(_gameState = gameCore?.gameState) {
        const counts = gameConfig?.battle?.arena?.geometry?.slotCounts || {};
        const supportRows = Math.max(0, counts.supportRows || 0);
        const fieldCols = Math.max(0, counts.fieldCols || 0);
        const fieldRows = Math.max(0, counts.fieldRows || 0);
        return Math.max(1, supportRows + (fieldCols * fieldRows));
    }

    isBattleEligible(entity, _gameState = gameCore?.gameState) {
        if (!entity) return false;
        if ((entity.lifeSim?.identity?.entityType || 'butterfly') !== 'butterfly') return false;
        if (entity.markedForRemoval || entity.destroyed) return false;
        return true;
    }

    getBattleReadinessScore(entity, gameState = gameCore?.gameState) {
        return statProfileSystem?.getEntityProfile?.(entity, gameState)?.readinessProfile?.score || 0;
    }

    sortBattleEntities(entities = [], gameState = gameCore?.gameState) {
        return [...entities].sort((left, right) => {
            const leftReady = this.getBattleReadinessScore(left, gameState);
            const rightReady = this.getBattleReadinessScore(right, gameState);
            if (leftReady !== rightReady) return rightReady - leftReady;
            return String(left.displayName || left.personalityType || left.id)
                .localeCompare(String(right.displayName || right.personalityType || right.id));
        });
    }

    getRosterMembers(gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        const butterflies = gameState?.butterflies || [];
        const byId = new Map(butterflies.map(entity => [entity.id, entity]));
        return roster.memberIds
            .map(id => byId.get(id))
            .filter(entity => this.isBattleEligible(entity, gameState));
    }

    getSinglePlayerAutoBattlePreview(gameState = gameCore?.gameState, options = {}) {
        const roster = this.ensureState(gameState);
        const butterflies = (gameState?.butterflies || []).filter(entity => this.isBattleEligible(entity, gameState));
        const strongestLiving = this.sortBattleEntities(butterflies, gameState);
        const rosterMembers = this.sortBattleEntities(this.getRosterMembers(gameState), gameState);
        const rosterIds = new Set(roster.memberIds || []);
        const maxTeamSize = Math.max(1, options.maxTeamSize || this.getBattleCapacity(gameState));
        const opponentPool = this.sortBattleEntities(
            butterflies.filter(entity => !rosterIds.has(entity.id)),
            gameState
        );
        const canRunRosterSplit = rosterMembers.length > 0 && opponentPool.length > 0;
        const selectionMode = canRunRosterSplit ? 'roster-vs-garden' : 'strongest-living-split';
        const selectionLabel = canRunRosterSplit
            ? 'Strongest eligible butterflies are auto-selected from your roster against the live garden.'
            : 'Strongest living butterflies are auto-split into your team and a Garden AI rival team.';
        const maxSplitTeamSize = Math.floor(strongestLiving.length / 2);
        const teamSize = canRunRosterSplit
            ? Math.min(maxTeamSize, rosterMembers.length, opponentPool.length)
            : Math.min(maxTeamSize, maxSplitTeamSize);
        const playerTeam = canRunRosterSplit
            ? rosterMembers.slice(0, teamSize)
            : strongestLiving.slice(0, teamSize);
        const opponentTeam = canRunRosterSplit
            ? opponentPool.slice(0, teamSize)
            : strongestLiving.slice(teamSize, teamSize * 2);
        const averageReady = (entries = []) => entries.length
            ? Math.round(entries.reduce((sum, entity) => sum + this.getBattleReadinessScore(entity, gameState), 0) / entries.length)
            : 0;

        let reason = null;
        let actionLabel = `Start ${teamSize}v${teamSize}`;
        if (teamSize < 1) {
            if (strongestLiving.length < 2) {
                reason = 'Need at least two eligible butterflies for autobattle';
                actionLabel = 'Need 2+';
            } else {
                reason = 'Need at least one fighter on each side';
                actionLabel = 'Need 1+1';
            }
        }

        return {
            canStart: !reason,
            reason,
            actionLabel,
            selectionMode,
            selectionLabel,
            maxTeamSize,
            teamSize,
            rosterCount: rosterMembers.length,
            eligibleCount: strongestLiving.length,
            opponentPoolCount: opponentPool.length,
            playerCandidates: canRunRosterSplit ? rosterMembers : strongestLiving,
            opponentCandidates: canRunRosterSplit ? opponentPool : strongestLiving.slice(teamSize),
            playerTeam,
            opponentTeam,
            playerTeamIds: playerTeam.map(entity => entity.id),
            opponentTeamIds: opponentTeam.map(entity => entity.id),
            playerAverageReady: averageReady(playerTeam),
            opponentAverageReady: averageReady(opponentTeam)
        };
    }

    recordBattleState(entityId, summary, gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        if (!entityId) return;
        roster.lastBattleStates[entityId] = JSON.parse(JSON.stringify(summary || {}));
    }

    serializeDurableState(gameState = gameCore?.gameState) {
        const roster = this.ensureState(gameState);
        return JSON.parse(JSON.stringify(roster));
    }

    deserializeDurableState(serialized = {}, gameState = gameCore?.gameState) {
        if (!gameState) return;
        gameState.roster = JSON.parse(JSON.stringify(serialized || {
            memberIds: [],
            battleSides: { left: [], right: [] },
            lastBattleStates: {}
        }));
        this.ensureState(gameState);
    }
}

const rosterSystem = new RosterSystem();
