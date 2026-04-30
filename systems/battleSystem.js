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
        const displayName = this.getParticipantDisplayName(entity);
        const canonicalLabel = this.getParticipantCanonicalLabel(entity, displayName);
        const specialAbility = typeof entity.getSpecialAbility === 'function'
            ? entity.getSpecialAbility()
            : entity.specialAbility || null;

        return {
            id: entity.id,
            entityType: entity.lifeSim?.identity?.entityType || entity.constructor?.name || 'entity',
            archetype: entity.lifeSim?.identity?.archetype || entity.personalityType || entity.constructor?.name || 'entity',
            displayName,
            canonicalLabel,
            sex: entity.sex || entity.lifeSim?.identity?.sex || null,
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
            cognition: typeof lifeSimSystem !== 'undefined'
                ? this.cloneValue(lifeSimSystem.getEntitySummary?.(entity.id), null)
                : null,
            inference: typeof mlInferenceSystem !== 'undefined'
                ? this.cloneValue(mlInferenceSystem.getEntitySummary?.(entity.id), null)
                : null,
            statProfile: typeof statProfileSystem !== 'undefined'
                ? this.cloneValue(statProfileSystem.getBattleSnapshot?.(entity), null)
                : null,
            abilities: {
                specialAbility,
                displayLabel: this.getAbilityDisplayLabel(specialAbility)
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

    getParticipantDisplayName(entity, fallback = 'Butterfly') {
        if (!entity) return fallback;
        return entity.getDisplayName?.() || entity.displayName || entity.personalName || entity.name || entity.personalityType || entity.id || fallback;
    }

    getParticipantCanonicalLabel(entity, fallback = 'Butterfly') {
        if (!entity) return fallback;
        if (typeof entity.getCanonicalLabel === 'function') {
            return entity.getCanonicalLabel({ includeSex: true }) || fallback;
        }
        const baseLabel = this.getParticipantDisplayName(entity, fallback);
        const sex = entity.sex || entity.lifeSim?.identity?.sex || '?';
        return /\([A-Z?]\)$/.test(baseLabel) ? baseLabel : `${baseLabel}(${sex})`;
    }

    getParticipantLabel(participant, fallback = 'Butterfly') {
        if (!participant) return fallback;
        return participant.canonicalLabel || participant.displayName || participant.id || fallback;
    }

    getAbilityDisplayLabel(ability = null) {
        const labels = {
            welcome: 'Warm Welcome',
            sparkle: 'Delicate Pink',
            speedzone: 'Electric Violet',
            cascade: 'Nervous Jewel',
            teacher: 'Ancient Scholar',
            shimmer: 'Twilight Dancer',
            golden: 'Golden'
        };
        return labels[ability] || (ability ? String(ability) : 'Ability');
    }

    getBattleActionPresentation(participant, actionType, targetId = null, details = {}) {
        const ability = participant?.abilities?.specialAbility || null;
        const base = {
            ability,
            abilityLabel: this.getAbilityDisplayLabel(ability),
            displayLabel: this.getParticipantLabel(participant),
            targetLabel: targetId || null,
            visualSubtype: actionType,
            projectileStyle: actionType === 'rally' ? 'support-pulse' : 'strike-bolt',
            effectStyle: actionType,
            reactionStyle: actionType === 'rally' ? 'heal-burst' : 'impact-burst',
            specialLabel: null,
            isSpecial: false,
            flowerRelated: false
        };

        if (actionType === 'guard') {
            if (ability === 'shimmer') {
                return { ...base, visualSubtype: 'shimmer-guard', effectStyle: 'shimmer-veil', specialLabel: 'Shimmer Veil', isSpecial: true };
            }
            if (ability === 'golden') {
                return { ...base, visualSubtype: 'golden-guard', effectStyle: 'golden-guard', specialLabel: 'Golden Guard', isSpecial: true };
            }
            return { ...base, visualSubtype: 'brace', effectStyle: 'brace' };
        }

        if (actionType === 'retreat') {
            return { ...base, visualSubtype: 'retreat', effectStyle: 'retreat-trail' };
        }

        if (actionType === 'rally') {
            switch (ability) {
                case 'welcome':
                    return { ...base, visualSubtype: 'warm-support', projectileStyle: 'warm-orb', effectStyle: 'welcome-pulse', specialLabel: 'Warm Welcome', isSpecial: true };
                case 'teacher':
                    return { ...base, visualSubtype: 'lesson-pulse', projectileStyle: 'lesson-glyph', effectStyle: 'lesson-glyph', specialLabel: 'Scholar Pulse', isSpecial: true };
                case 'shimmer':
                    return { ...base, visualSubtype: 'shimmer-support', projectileStyle: 'shimmer-orb', effectStyle: 'shimmer-veil', specialLabel: 'Twilight Veil', isSpecial: true };
                case 'sparkle':
                    return { ...base, visualSubtype: 'bloom-lift', projectileStyle: 'petal-ribbon', effectStyle: 'bloom-ring', specialLabel: 'Bloom Lift', isSpecial: true, flowerRelated: true };
                default:
                    return { ...base, visualSubtype: 'support', projectileStyle: 'support-pulse', effectStyle: 'support-pulse' };
            }
        }

        switch (ability) {
            case 'sparkle':
                return { ...base, visualSubtype: 'petal-burst', projectileStyle: 'petal-burst', effectStyle: 'petal-bloom', specialLabel: 'Petal Burst', isSpecial: true, flowerRelated: true };
            case 'speedzone':
                return { ...base, visualSubtype: 'violet-surge', projectileStyle: 'violet-surge', effectStyle: 'surge-ring', specialLabel: 'Violet Surge', isSpecial: true };
            case 'cascade':
                return { ...base, visualSubtype: 'cascade-strike', projectileStyle: 'cascade-shard', effectStyle: 'cascade-wave', specialLabel: 'Cascade Strike', isSpecial: true };
            case 'teacher':
                return { ...base, visualSubtype: 'scholar-strike', projectileStyle: 'lesson-glyph', effectStyle: 'lesson-glyph', specialLabel: 'Scholar Mark', isSpecial: true };
            case 'shimmer':
                return { ...base, visualSubtype: 'shimmer-strike', projectileStyle: 'shimmer-orb', effectStyle: 'shimmer-veil', specialLabel: 'Shimmer Arc', isSpecial: true };
            case 'golden':
                return { ...base, visualSubtype: 'golden-flare', projectileStyle: 'golden-star', effectStyle: 'golden-flare', specialLabel: 'Golden Flare', isSpecial: true };
            default:
                return { ...base, visualSubtype: 'strike', projectileStyle: 'strike-bolt', effectStyle: 'impact-burst' };
        }
    }

    getMotionConfig() {
        const configured = gameConfig?.battle?.motion || {};
        const pixelsPerArenaUnit = configured.pixelsPerArenaUnit || gameConfig?.spatial?.projection?.ppu || 20;
        const unitsToPx = (units, fallbackPx = 0) => Number.isFinite(units)
            ? units * pixelsPerArenaUnit
            : fallbackPx;
        return {
            pixelsPerArenaUnit,
            unitsPerArenaCell: configured.unitsPerArenaCell ?? 1,
            attackAdvanceUnits: configured.attackAdvanceUnits ?? 1.6,
            attackAdvancePx: unitsToPx(configured.attackAdvanceUnits, configured.attackAdvancePx || 32),
            attackDurationMs: configured.attackDurationMs || 560,
            hitRecoilUnits: configured.hitRecoilUnits ?? 0.8,
            hitRecoilPx: unitsToPx(configured.hitRecoilUnits, configured.hitRecoilPx || 16),
            hitReactionDurationMs: configured.hitReactionDurationMs || 340,
            rallyAdvanceUnits: configured.rallyAdvanceUnits ?? 0.6,
            rallyAdvancePx: unitsToPx(configured.rallyAdvanceUnits, configured.rallyAdvancePx || 12),
            rallyDurationMs: configured.rallyDurationMs || 520,
            rallyLiftUnits: configured.rallyLiftUnits ?? 0.3,
            rallyLiftPx: unitsToPx(configured.rallyLiftUnits, configured.rallyLiftPx || 6),
            guardBobUnits: configured.guardBobUnits ?? 0.15,
            guardBobPx: unitsToPx(configured.guardBobUnits, configured.guardBobPx || 3),
            guardDurationMs: configured.guardDurationMs || 420,
            retreatAdvanceUnits: configured.retreatAdvanceUnits ?? 1.7,
            retreatAdvancePx: unitsToPx(configured.retreatAdvanceUnits, configured.retreatAdvancePx || 34),
            retreatDurationMs: configured.retreatDurationMs || 520,
            projectileDurationMs: configured.projectileDurationMs || 460,
            idleBobUnits: configured.idleBobUnits ?? 0.11,
            idleBobPx: unitsToPx(configured.idleBobUnits, configured.idleBobPx || 2.2),
            projectileArcHeightUnits: configured.projectileArcHeightUnits ?? 0.9,
            projectileArcHeightPx: unitsToPx(configured.projectileArcHeightUnits, configured.projectileArcHeightPx || 18),
            releaseDurationMs: configured.releaseDurationMs || 980,
            roamRadiusXUnits: configured.roamRadiusXUnits ?? 1,
            roamRadiusX: unitsToPx(configured.roamRadiusXUnits, configured.roamRadiusX || 20),
            roamRadiusYUnits: configured.roamRadiusYUnits ?? 0.6,
            roamRadiusY: unitsToPx(configured.roamRadiusYUnits, configured.roamRadiusY || 12),
            engagementDriftUnits: configured.engagementDriftUnits ?? 0.7,
            engagementDriftPx: unitsToPx(configured.engagementDriftUnits, configured.engagementDriftPx || 14)
        };
    }

    getAbilityVisualProfile(ability = null) {
        const profile = (typeof BUTTERFLY_ABILITY_VISUALS !== 'undefined' && ability)
            ? BUTTERFLY_ABILITY_VISUALS[ability]
            : null;
        if (profile) {
            const pixelsPerArenaUnit = gameConfig?.battle?.motion?.pixelsPerArenaUnit || gameConfig?.spatial?.projection?.ppu || 20;
            const radiusUnits = Number.isFinite(profile.radiusUnits)
                ? profile.radiusUnits
                : (Number.isFinite(profile.radius) && pixelsPerArenaUnit ? profile.radius / pixelsPerArenaUnit : null);
            return {
                style: profile.style || 'symbol',
                radius: profile.radius ?? null,
                radiusUnits,
                symbol: profile.symbol || null,
                fallbackSymbol: profile.fallbackSymbol || null
            };
        }
        return {
            style: 'symbol',
            radius: null,
            radiusUnits: null,
            symbol: null,
            fallbackSymbol: '*'
        };
    }

    getAbilityVisualPalette(participant) {
        const ability = participant?.abilities?.specialAbility || null;
        const sourceVariant = (typeof BUTTERFLY_ABILITY_SOURCE_VARIANTS !== 'undefined' && ability)
            ? BUTTERFLY_ABILITY_SOURCE_VARIANTS[ability]
            : null;
        const variantKey = sourceVariant || participant?.archetype || null;
        const palette = (typeof BUTTERFLY_PERSONALITIES !== 'undefined' && variantKey)
            ? BUTTERFLY_PERSONALITIES[variantKey]?.colors
            : null;
        if (Array.isArray(palette) && palette.length >= 2) {
            return {
                primaryColor: [...palette[0]],
                secondaryColor: [...palette[1]]
            };
        }
        return {
            primaryColor: [255, 244, 210],
            secondaryColor: [255, 255, 255]
        };
    }

    createParticipantBattleVisual(participant, assignment) {
        const ability = participant?.abilities?.specialAbility || null;
        const palette = this.getAbilityVisualPalette(participant);
        const profile = this.getAbilityVisualProfile(ability);
        const homePosition = assignment?.position
            ? { ...assignment.position }
            : { x: 400, y: 225 };
        const spawnPosition = assignment?.spawnPosition
            ? { ...assignment.spawnPosition }
            : { ...homePosition };
        const motionPhase = String(participant?.id || '')
            .split('')
            .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;

        return {
            homePosition,
            spawnPosition,
            motionPhase,
            ability,
            visualStyle: profile.style || 'symbol',
            abilityRadius: profile.radius ?? null,
            abilityRadiusUnits: profile.radiusUnits ?? null,
            symbol: profile.symbol || null,
            fallbackSymbol: profile.fallbackSymbol || null,
            primaryColor: palette.primaryColor,
            secondaryColor: palette.secondaryColor,
            action: null,
            reaction: null
        };
    }

    ensureBattleVisualState(snapshot) {
        if (!snapshot) return null;
        snapshot.metadata = snapshot.metadata || {};
        snapshot.metadata.visuals = snapshot.metadata.visuals || {
            projectiles: [],
            lastVisualUpdateAtMs: 0
        };

        const nowMs = Date.now();
        const assignments = snapshot.metadata?.arena?.assignments || {};
        for (const participant of Object.values(snapshot.participantsById || {})) {
            const assignment = assignments[participant.id] || null;
            if (!participant.battleVisual) {
                participant.battleVisual = this.createParticipantBattleVisual(participant, assignment);
                continue;
            }

            if (assignment?.position) {
                participant.battleVisual.homePosition = { ...assignment.position };
            }
            if (assignment?.spawnPosition) {
                participant.battleVisual.spawnPosition = { ...assignment.spawnPosition };
            }

            participant.battleVisual.ability = participant?.abilities?.specialAbility || null;
            const profile = this.getAbilityVisualProfile(participant.battleVisual.ability);
            const palette = this.getAbilityVisualPalette(participant);
            participant.battleVisual.visualStyle = profile.style || 'symbol';
            participant.battleVisual.abilityRadius = profile.radius ?? null;
            participant.battleVisual.abilityRadiusUnits = profile.radiusUnits ?? null;
            participant.battleVisual.symbol = profile.symbol || null;
            participant.battleVisual.fallbackSymbol = profile.fallbackSymbol || null;
            participant.battleVisual.primaryColor = palette.primaryColor;
            participant.battleVisual.secondaryColor = palette.secondaryColor;
        }

        snapshot.metadata.visuals.projectiles = (snapshot.metadata.visuals.projectiles || [])
            .filter(projectile => (nowMs - (projectile.startedAtMs || 0)) <= ((projectile.durationMs || 0) + 120));
        return snapshot.metadata.visuals;
    }

    setParticipantBattleActionVisual(snapshot, participantId, action = null) {
        const participant = snapshot?.participantsById?.[participantId];
        if (!participant) return null;
        this.ensureBattleVisualState(snapshot);
        participant.battleVisual = participant.battleVisual || this.createParticipantBattleVisual(participant, snapshot.metadata?.arena?.assignments?.[participantId]);
        participant.battleVisual.action = action ? this.cloneValue(action, {}) : null;
        return participant.battleVisual;
    }

    setParticipantBattleReactionVisual(snapshot, participantId, reaction = null) {
        const participant = snapshot?.participantsById?.[participantId];
        if (!participant) return null;
        this.ensureBattleVisualState(snapshot);
        participant.battleVisual = participant.battleVisual || this.createParticipantBattleVisual(participant, snapshot.metadata?.arena?.assignments?.[participantId]);
        participant.battleVisual.reaction = reaction ? this.cloneValue(reaction, {}) : null;
        return participant.battleVisual;
    }

    registerBattleVisualAction(snapshot, participant, actionType, targetId = null, details = {}) {
        if (!snapshot || !participant?.id) return;
        const motion = this.getMotionConfig();
        const nowMs = Date.now();
        const assignments = snapshot.metadata?.arena?.assignments || {};
        const targetPosition = targetId && assignments[targetId]?.position
            ? { ...assignments[targetId].position }
            : null;
        const presentation = this.getBattleActionPresentation(participant, actionType, targetId, details);

        const durationMs =
            actionType === 'attack' ? motion.attackDurationMs :
            actionType === 'rally' ? motion.rallyDurationMs :
            actionType === 'retreat' ? motion.retreatDurationMs :
            motion.guardDurationMs;

        const actionVisual = {
            type: actionType,
            startedAtMs: nowMs,
            durationMs,
            targetId: targetId || null,
            targetPosition,
            roundNumber: details.roundNumber || 0,
            damage: details.damage || 0,
            restoredHp: details.restoredHp || 0,
            pressure: details.pressure || 0,
            ability: presentation.ability,
            abilityLabel: presentation.abilityLabel,
            visualSubtype: presentation.visualSubtype,
            projectileStyle: presentation.projectileStyle,
            effectStyle: presentation.effectStyle,
            reactionStyle: presentation.reactionStyle,
            specialLabel: presentation.specialLabel,
            isSpecial: !!presentation.isSpecial,
            flowerRelated: !!presentation.flowerRelated
        };
        this.setParticipantBattleActionVisual(snapshot, participant.id, actionVisual);

        if ((actionType === 'attack' || actionType === 'rally') && targetId) {
            const visuals = this.ensureBattleVisualState(snapshot);
            visuals.projectiles.push({
                id: `${snapshot.battleId}_${participant.id}_${actionType}_${nowMs}`,
                actionType,
                actorId: participant.id,
                targetId,
                startedAtMs: nowMs,
                durationMs: motion.projectileDurationMs,
                arcHeightUnits: motion.projectileArcHeightUnits,
                arcHeightPx: motion.projectileArcHeightPx,
                ability: participant.abilities?.specialAbility || null,
                abilityLabel: presentation.abilityLabel,
                projectileStyle: presentation.projectileStyle,
                isSpecial: !!presentation.isSpecial,
                flowerRelated: !!presentation.flowerRelated,
                ...this.getAbilityVisualPalette(participant)
            });
        }

        if (actionType === 'attack' && targetId) {
            this.setParticipantBattleReactionVisual(snapshot, targetId, {
                type: 'hit',
                sourceId: participant.id,
                startedAtMs: nowMs + 70,
                durationMs: motion.hitReactionDurationMs,
                damage: details.damage || 0,
                pressure: details.pressure || 0,
                reactionStyle: presentation.reactionStyle,
                specialLabel: presentation.specialLabel,
                flowerRelated: !!presentation.flowerRelated
            });
        } else if (actionType === 'rally' && targetId) {
            this.setParticipantBattleReactionVisual(snapshot, targetId, {
                type: 'heal',
                sourceId: participant.id,
                startedAtMs: nowMs + 40,
                durationMs: Math.max(220, motion.rallyDurationMs - 80),
                restoredHp: details.restoredHp || 0,
                reactionStyle: presentation.reactionStyle,
                specialLabel: presentation.specialLabel,
                flowerRelated: !!presentation.flowerRelated
            });
        }
        return actionVisual;
    }

    getArenaGeometry() {
        return gameConfig?.battle?.arena?.geometry || null;
    }

    createSlotGrid(rect, cols, rows, side = 'left', role = 'field') {
        if (!rect || cols <= 0 || rows <= 0) return [];
        const slots = [];
        const width = rect.maxX - rect.minX;
        const height = rect.maxY - rect.minY;
        const cellWidth = width / cols;
        const cellHeight = height / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const visualCol = side === 'left' ? col : (cols - 1 - col);
                slots.push({
                    side,
                    role,
                    row,
                    col: visualCol,
                    position: {
                        x: rect.minX + (cellWidth * (col + 0.5)),
                        y: rect.minY + (cellHeight * (row + 0.5)) + (role === 'support' ? 8 : 0)
                    }
                });
            }
        }

        return slots;
    }

    createArenaAssignments(participantSnapshots = []) {
        const geometry = this.getArenaGeometry();
        if (!geometry) return { assignments: {}, slotsByTeam: {} };

        const counts = geometry.slotCounts || { supportRows: 2, fieldCols: 4, fieldRows: 4 };
        const teamOrder = gameConfig?.battle?.arena?.teamOrder || ['alpha', 'beta'];
        const teams = {};

        for (const participant of participantSnapshots) {
            const teamId = participant.teamId || 'neutral';
            if (!teams[teamId]) teams[teamId] = [];
            teams[teamId].push(participant);
        }

        const sideByTeam = {};
        if (teamOrder[0]) sideByTeam[teamOrder[0]] = 'left';
        if (teamOrder[1]) sideByTeam[teamOrder[1]] = 'right';
        const fallbackSides = ['left', 'right'];
        for (const teamId of Object.keys(teams)) {
            if (!sideByTeam[teamId]) {
                sideByTeam[teamId] = fallbackSides[Object.keys(sideByTeam).length % fallbackSides.length];
            }
        }

        const buildSlotsForSide = (side) => {
            if (side === 'left') {
                return [
                    ...this.createSlotGrid(geometry.rects.leftSupport, 1, counts.supportRows, 'left', 'support'),
                    ...this.createSlotGrid(geometry.rects.leftField, counts.fieldCols, counts.fieldRows, 'left', 'field')
                ];
            }
            return [
                ...this.createSlotGrid(geometry.rects.rightSupport, 1, counts.supportRows, 'right', 'support'),
                ...this.createSlotGrid(geometry.rects.rightField, counts.fieldCols, counts.fieldRows, 'right', 'field')
            ];
        };

        const buildSpawnSlotsForSide = (side, teamSize = 1) => {
            const rect = side === 'left'
                ? geometry.rects.leftSupport
                : geometry.rects.rightSupport;
            const cols = teamSize <= 4 ? 1 : 2;
            const rows = Math.max(2, Math.ceil(teamSize / cols));
            return this.createSlotGrid(rect, cols, rows, side, 'spawn');
        };

        const slotsBySide = {
            left: buildSlotsForSide('left'),
            right: buildSlotsForSide('right')
        };
        const assignments = {};
        const slotsByTeam = {};

        for (const [teamId, participants] of Object.entries(teams)) {
            const side = sideByTeam[teamId] || 'left';
            const slots = slotsBySide[side] || [];
            const spawnSlots = buildSpawnSlotsForSide(side, participants.length);
            slotsByTeam[teamId] = slots;
            participants.forEach((participant, index) => {
                const slot = slots[index % Math.max(1, slots.length)];
                const spawnSlot = spawnSlots[index % Math.max(1, spawnSlots.length)] || slot;
                const role = slot?.role || 'field';
                const wanderRadiusX = role === 'support' ? 14 : 24;
                const wanderRadiusY = role === 'support' ? 9 : 15;
                assignments[participant.id] = {
                    teamId,
                    side,
                    role,
                    row: slot?.row ?? 0,
                    col: slot?.col ?? index,
                    position: slot?.position
                        ? { ...slot.position, y: slot.position.y + (gameConfig?.battle?.arena?.tokenYOffset || 0) }
                        : { x: 400, y: 225 },
                    spawnPosition: spawnSlot?.position
                        ? { ...spawnSlot.position, y: spawnSlot.position.y + (gameConfig?.battle?.arena?.tokenYOffset || 0) }
                        : (slot?.position
                            ? { ...slot.position, y: slot.position.y + (gameConfig?.battle?.arena?.tokenYOffset || 0) }
                            : { x: 400, y: 225 }),
                    wanderRadiusX,
                    wanderRadiusY
                };
            });
        }

        return {
            assignments,
            slotsByTeam
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

        const arenaLayout = this.createArenaAssignments(participantSnapshots);

        return {
            battleId,
            state: 'snapshotting',
            mode: options.mode || 'skirmish',
            createdAtMs: Date.now(),
            eventSequence: 0,
            participantOrder: participantSnapshots.map(participant => participant.id),
            participantsById: Object.fromEntries(participantSnapshots.map(participant => [participant.id, participant])),
            teams,
            events: [],
            result: null,
            metadata: {
                ...this.cloneValue(options.metadata, {}),
                arena: arenaLayout
            }
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
        const autoBattleConfig = gameConfig?.battle?.autoBattle || {};
        snapshot.state = 'active';
        snapshot.metadata = snapshot.metadata || {};
        snapshot.metadata.autoBattle = options.autoBattle !== false;
        snapshot.metadata.autoBattlePaused = !!options.autoBattlePaused;
        snapshot.metadata.autoBattleSpeed = Math.max(1, options.autoBattleSpeed || 1);
        snapshot.metadata.maxRounds = Math.max(6, options.maxRounds || snapshot.metadata.maxRounds || autoBattleConfig.maxRounds || 18);
        snapshot.metadata.autoBattleIntervalFrames = Math.max(
            autoBattleConfig.minIntervalFrames || 12,
            options.autoBattleIntervalFrames || snapshot.metadata.autoBattleIntervalFrames || autoBattleConfig.intervalFrames || 30
        );
        snapshot.metadata.autoBattleElapsedFrames = 0;
        this.ensureBattleVisualState(snapshot);
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
        if (!snapshot) return null;
        this.ensureBattleVisualState(snapshot);
        return this.cloneValue(snapshot);
    }

    getParticipantSnapshot(battleId, participantId) {
        const snapshot = this.snapshots.get(battleId);
        if (snapshot) {
            this.ensureBattleVisualState(snapshot);
        }
        return snapshot?.participantsById?.[participantId]
            ? this.cloneValue(snapshot.participantsById[participantId])
            : null;
    }

    appendBattleEvent(battleId, eventType, payload = {}) {
        const snapshot = this.snapshots.get(battleId);
        if (!snapshot) return null;
        snapshot.eventSequence = (snapshot.eventSequence || 0) + 1;
        const event = {
            id: `${battleId}_event_${snapshot.eventSequence}`,
            sequence: snapshot.eventSequence,
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

    emitBattleActionOccurred(payload = {}) {
        if (typeof eventBus === 'undefined' || !GameEvents?.BATTLE_ACTION_OCCURRED) return;
        eventBus.emit(GameEvents.BATTLE_ACTION_OCCURRED, this.cloneValue(payload, {}));
    }

    getBattleEvents(battleId = this.activeBattleId) {
        const snapshot = this.snapshots.get(battleId);
        return snapshot ? this.cloneValue(snapshot.events, []) : [];
    }

    getRecentBattleEvents(battleId = this.activeBattleId, limit = 6) {
        if (!Number.isFinite(limit) || limit <= 0) return [];
        const events = this.getBattleEvents(battleId);
        if (!events.length) return [];

        const recentWindow = events
            .slice(-Math.max(limit * 10, 48))
            .reverse();
        const selected = [];
        const selectedIds = new Set();
        const seenActionTypes = new Set();
        const preferredContextEvents = new Set([
            'battle-resolved',
            'participant-retreated',
            'round-finished',
            'round-started',
            'battle-paused',
            'battle-resumed',
            'battle-speed-changed',
            'battle-started'
        ]);

        // Keep the combat feed representative by surfacing the newest example of each
        // action family before filling the remaining slots with nearby context.
        for (const event of recentWindow) {
            if (event?.eventType !== 'round-action') continue;
            const actionType = event?.payload?.type || 'action';
            if (seenActionTypes.has(actionType)) continue;
            selected.push(event);
            selectedIds.add(event.id);
            seenActionTypes.add(actionType);
            if (selected.length >= limit) break;
        }

        for (const event of recentWindow) {
            if (selected.length >= limit) break;
            if (!event || selectedIds.has(event.id) || !preferredContextEvents.has(event.eventType)) continue;
            selected.push(event);
            selectedIds.add(event.id);
        }

        for (const event of recentWindow) {
            if (selected.length >= limit) break;
            if (!event || selectedIds.has(event.id)) continue;
            selected.push(event);
            selectedIds.add(event.id);
        }

        return selected
            .sort((left, right) => {
                const sequenceDelta = (right?.sequence || 0) - (left?.sequence || 0);
                if (sequenceDelta !== 0) return sequenceDelta;
                return (right?.timestampMs || 0) - (left?.timestampMs || 0);
            })
            .slice(0, limit);
    }

    getActiveParticipantIds(snapshot, teamId = null) {
        if (!snapshot?.participantsById) return [];
        return Object.values(snapshot.participantsById)
            .filter(participant => {
                if (teamId && participant.teamId !== teamId) return false;
                return !participant.defeated && !participant.retreated;
            })
            .map(participant => participant.id);
    }

    chooseTargetId(snapshot, actorId, preference = 'enemy-weakest') {
        const actor = snapshot?.participantsById?.[actorId];
        if (!actor) return null;
        const everyone = Object.values(snapshot.participantsById || {});
        const allies = everyone.filter(participant => participant.teamId === actor.teamId && !participant.defeated && !participant.retreated && participant.id !== actorId);
        const enemies = everyone.filter(participant => participant.teamId !== actor.teamId && !participant.defeated && !participant.retreated);

        if (preference === 'ally-lowest-hp' && allies.length) {
            return allies.sort((left, right) => left.hp - right.hp)[0].id;
        }

        if (enemies.length) {
            if (preference === 'enemy-priority') {
                return enemies
                    .sort((left, right) => {
                        const leftScore = (left.pressure || 0) + ((left.statProfile?.battleStats?.support || 0) * 0.03) + (((left.statProfile?.readinessProfile?.score || 0) / 100) * 2);
                        const rightScore = (right.pressure || 0) + ((right.statProfile?.battleStats?.support || 0) * 0.03) + (((right.statProfile?.readinessProfile?.score || 0) / 100) * 2);
                        if (leftScore !== rightScore) return rightScore - leftScore;
                        return left.hp - right.hp;
                    })[0]
                    .id;
            }
            return enemies
                .sort((left, right) => {
                    if (left.hp !== right.hp) return left.hp - right.hp;
                    return (right.pressure || 0) - (left.pressure || 0);
                })[0]
                .id;
        }

        return allies[0]?.id || null;
    }

    chooseAutoAction(snapshot, participant) {
        if (!participant) return { type: 'guard', targetId: null };
        const hpRatio = participant.hp / Math.max(1, participant.maxHp || participant.hp || 1);
        const cognitionBattle = participant.cognition?.battle || {};
        const enemyThreat = (cognitionBattle.enemyThreat || 0) / 100;
        const allyPressure = (cognitionBattle.allyPressure || 0) / 100;
        const targetPriority = (cognitionBattle.targetPriority || 0) / 100;
        const retreatPressure = (cognitionBattle.retreatPressure || 0) / 100;
        const supportOpportunity = (cognitionBattle.supportOpportunity || 0) / 100;
        const pressureRatio = Math.max(0, Math.min(1, (participant.pressure || 0) / 8));
        const supportScore = participant.statProfile?.battleStats?.support || 0;
        const offenseScore = participant.statProfile?.battleStats?.offense || 0;
        const specialAbility = participant.abilities?.specialAbility || null;
        const allySupportTargetId = this.chooseTargetId(snapshot, participant.id, 'ally-lowest-hp');
        const allySupportTarget = allySupportTargetId ? snapshot?.participantsById?.[allySupportTargetId] || null : null;
        const allyNeedsSupport = !!allySupportTarget && (
            (allySupportTarget.hp / Math.max(1, allySupportTarget.maxHp || allySupportTarget.hp || 1)) < 0.92
            || (allySupportTarget.pressure || 0) >= 2
        );
        const attackTargetId = this.chooseTargetId(
            snapshot,
            participant.id,
            targetPriority > 0.56 ? 'enemy-priority' : 'enemy-weakest'
        );
        const postureDecision = typeof mlInferenceSystem !== 'undefined'
            ? mlInferenceSystem.getBattleParticipantDecision?.(participant, snapshot, gameCore?.gameState)
            : null;
        const posture = postureDecision?.label || 'stabilize';

        participant.inference = {
            ...(participant.inference || {}),
            battleLabel: posture,
            battleSource: postureDecision?.source || 'heuristic-fallback',
            battleSourceLabel: postureDecision?.sourceLabel || 'FB',
            battleConfidence: postureDecision?.confidence || 0,
            battleConfidenceBand: postureDecision?.confidenceBand || 'low',
            battleAlternatives: postureDecision?.alternatives || [],
            battleBackend: postureDecision?.backend || null,
            battleModelVersionId: postureDecision?.modelVersionId || null
        };

        if (posture === 'retreat') {
            if (hpRatio < 0.42 || pressureRatio > 0.58 || retreatPressure > 0.52 || enemyThreat > 0.72) {
                return { type: 'retreat', targetId: null };
            }
            return { type: 'guard', targetId: null };
        }

        if (posture === 'support') {
            if (!allyNeedsSupport) {
                return { type: 'attack', targetId: attackTargetId };
            }
            return {
                type: 'rally',
                targetId: allySupportTargetId
            };
        }

        if (posture === 'focusWeakTarget') {
            return {
                type: 'attack',
                targetId: this.chooseTargetId(snapshot, participant.id, 'enemy-priority')
            };
        }

        if (posture === 'engage') {
            return {
                type: 'attack',
                targetId: this.chooseTargetId(snapshot, participant.id, targetPriority > 0.56 ? 'enemy-priority' : 'enemy-weakest')
            };
        }

        if (hpRatio < 0.28 || pressureRatio > 0.74 || retreatPressure > 0.6 || (enemyThreat > 0.8 && hpRatio < 0.44)) {
            return { type: 'guard', targetId: null };
        }
        if (supportOpportunity > 0.56 && allyPressure > 0.38 && allyNeedsSupport) {
            return {
                type: 'rally',
                targetId: allySupportTargetId
            };
        }
        if ((specialAbility === 'teacher' || specialAbility === 'welcome') && supportScore >= offenseScore && allyPressure > 0.26 && allyNeedsSupport) {
            return {
                type: 'rally',
                targetId: allySupportTargetId
            };
        }
        return {
            type: 'attack',
            targetId: attackTargetId
        };
    }

    ensureRoundState(snapshot) {
        const autoBattleConfig = gameConfig?.battle?.autoBattle || {};
        snapshot.metadata = snapshot.metadata || {};
        snapshot.metadata.roundNumber = Math.max(0, snapshot.metadata.roundNumber || 0);
        snapshot.metadata.maxRounds = Math.max(6, snapshot.metadata.maxRounds || autoBattleConfig.maxRounds || 18);
        snapshot.metadata.autoBattle = snapshot.metadata.autoBattle !== false;
        snapshot.metadata.autoBattlePaused = !!snapshot.metadata.autoBattlePaused;
        snapshot.metadata.autoBattleSpeed = Math.max(1, snapshot.metadata.autoBattleSpeed || 1);
        snapshot.metadata.autoBattleIntervalFrames = Math.max(
            autoBattleConfig.minIntervalFrames || 12,
            snapshot.metadata.autoBattleIntervalFrames || autoBattleConfig.intervalFrames || 30
        );
        snapshot.metadata.autoBattleElapsedFrames = Math.max(0, snapshot.metadata.autoBattleElapsedFrames || 0);
        this.ensureBattleVisualState(snapshot);
    }

    getTeamResolutionScore(snapshot, teamId) {
        const participants = (snapshot?.teams?.[teamId]?.participantIds || [])
            .map(participantId => snapshot.participantsById?.[participantId])
            .filter(Boolean);
        return participants.reduce((sum, participant) => {
            const hpScore = Math.max(0, participant.hp || 0);
            const pressureScore = Math.max(0, 12 - (participant.pressure || 0));
            const readinessScore = (participant.statProfile?.readinessProfile?.score || 0) * 0.15;
            const retreatPenalty = participant.retreated ? 8 : 0;
            const defeatedPenalty = participant.defeated ? 12 : 0;
            return sum + hpScore + pressureScore + readinessScore - retreatPenalty - defeatedPenalty;
        }, 0);
    }

    setAutoBattlePaused(battleId, paused = true) {
        const snapshot = this.snapshots.get(battleId);
        if (!snapshot) return null;
        this.ensureRoundState(snapshot);
        snapshot.metadata.autoBattlePaused = !!paused;
        this.appendBattleEvent(battleId, paused ? 'battle-paused' : 'battle-resumed', {
            battleId,
            roundNumber: snapshot.metadata.roundNumber || 0
        });
        return this.getSnapshot(battleId);
    }

    cycleAutoBattleSpeed(battleId) {
        const snapshot = this.snapshots.get(battleId);
        if (!snapshot) return null;
        this.ensureRoundState(snapshot);
        const speeds = [1, 2, 3];
        const currentIndex = Math.max(0, speeds.indexOf(snapshot.metadata.autoBattleSpeed || 1));
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        snapshot.metadata.autoBattleSpeed = nextSpeed;
        this.appendBattleEvent(battleId, 'battle-speed-changed', {
            battleId,
            speed: nextSpeed
        });
        return this.getSnapshot(battleId);
    }

    resolveRound(battleId, queuedActions = {}) {
        const snapshot = this.snapshots.get(battleId);
        if (!snapshot || snapshot.state !== 'active') return null;

        this.ensureRoundState(snapshot);
        snapshot.metadata.roundNumber += 1;
        const roundNumber = snapshot.metadata.roundNumber;
        const participants = Object.values(snapshot.participantsById || {})
            .filter(participant => !participant.defeated && !participant.retreated)
            .sort((left, right) => {
                const leftInit = left.statProfile?.battleStats?.initiative || 0;
                const rightInit = right.statProfile?.battleStats?.initiative || 0;
                return rightInit - leftInit;
            });

        this.appendBattleEvent(battleId, 'round-started', {
            roundNumber,
            participantIds: participants.map(participant => participant.id)
        });

        for (const participant of participants) {
            if (participant.defeated || participant.retreated) continue;
            const command = queuedActions?.[participant.id] || this.chooseAutoAction(snapshot, participant);
            const actionType = command?.type || 'attack';
            const targetId = command?.targetId || (
                actionType === 'rally'
                    ? this.chooseTargetId(snapshot, participant.id, 'ally-lowest-hp')
                    : this.chooseTargetId(snapshot, participant.id, 'enemy-weakest')
            );

            participant.actionFamily = actionType;
            participant.actionSubtype = actionType;
            participant.targetId = targetId || null;

            if (actionType === 'retreat') {
                const visual = this.registerBattleVisualAction(snapshot, participant, 'retreat', null, { roundNumber });
                this.markParticipantRetreat(battleId, participant.id, 1);
                this.emitBattleActionOccurred({
                    battleId,
                    roundNumber,
                    actorId: participant.id,
                    actorLabel: this.getParticipantLabel(participant),
                    type: 'retreat',
                    specialLabel: visual?.specialLabel || null
                });
                continue;
            }

            if (actionType === 'guard') {
                const guardGain = Math.max(3, Math.round((participant.statProfile?.battleStats?.guard || 30) * 0.04));
                this.modifyParticipantHp(battleId, participant.id, guardGain);
                this.applyPressure(battleId, participant.id, -2);
                const visual = this.registerBattleVisualAction(snapshot, participant, 'guard', null, {
                    roundNumber,
                    restoredHp: guardGain
                });
                this.appendBattleEvent(battleId, 'round-action', {
                    roundNumber,
                    actorId: participant.id,
                    actorLabel: this.getParticipantLabel(participant),
                    type: 'guard',
                    restoredHp: guardGain,
                    specialLabel: visual?.specialLabel || null,
                    isSpecial: !!visual?.isSpecial
                });
                this.emitBattleActionOccurred({
                    battleId,
                    roundNumber,
                    actorId: participant.id,
                    actorLabel: this.getParticipantLabel(participant),
                    type: 'guard',
                    restoredHp: guardGain,
                    specialLabel: visual?.specialLabel || null,
                    isSpecial: !!visual?.isSpecial
                });
                continue;
            }

            if (actionType === 'rally') {
                const rallyTargetId = targetId || participant.id;
                const rallyTarget = snapshot.participantsById?.[rallyTargetId];
                if (rallyTarget && !rallyTarget.defeated && !rallyTarget.retreated) {
                    const support = participant.statProfile?.battleStats?.support || 28;
                    const healAmount = Math.max(4, Math.round(support * 0.12));
                    this.modifyParticipantHp(battleId, rallyTargetId, healAmount);
                    this.applyPressure(battleId, rallyTargetId, -2);
                    const visual = this.registerBattleVisualAction(snapshot, participant, 'rally', rallyTargetId, {
                        roundNumber,
                        restoredHp: healAmount
                    });
                    this.appendBattleEvent(battleId, 'round-action', {
                        roundNumber,
                        actorId: participant.id,
                        actorLabel: this.getParticipantLabel(participant),
                        type: 'rally',
                        targetId: rallyTargetId,
                        targetLabel: this.getParticipantLabel(rallyTarget),
                        restoredHp: healAmount,
                        ability: participant.abilities?.specialAbility || null,
                        abilityLabel: participant.abilities?.displayLabel || this.getAbilityDisplayLabel(participant.abilities?.specialAbility || null),
                        specialLabel: visual?.specialLabel || null,
                        isSpecial: !!visual?.isSpecial,
                        flowerRelated: !!visual?.flowerRelated,
                        projectileStyle: visual?.projectileStyle || null
                    });
                    this.emitBattleActionOccurred({
                        battleId,
                        roundNumber,
                        actorId: participant.id,
                        actorLabel: this.getParticipantLabel(participant),
                        type: 'rally',
                        targetId: rallyTargetId,
                        targetLabel: this.getParticipantLabel(rallyTarget),
                        restoredHp: healAmount,
                        ability: participant.abilities?.specialAbility || null,
                        abilityLabel: participant.abilities?.displayLabel || this.getAbilityDisplayLabel(participant.abilities?.specialAbility || null),
                        specialLabel: visual?.specialLabel || null,
                        isSpecial: !!visual?.isSpecial,
                        flowerRelated: !!visual?.flowerRelated,
                        projectileStyle: visual?.projectileStyle || null
                    });
                }
                continue;
            }

            const target = snapshot.participantsById?.[targetId];
            if (!target || target.defeated || target.retreated || target.teamId === participant.teamId) {
                continue;
            }

            const offense = participant.statProfile?.battleStats?.offense || 28;
            const resolve = participant.statProfile?.battleStats?.resolve || 28;
            const targetGuard = target.statProfile?.battleStats?.guard || 24;
            const targetResolve = target.statProfile?.battleStats?.resolve || 24;
            const damage = Math.max(3, Math.round((offense * 0.12) + (resolve * 0.03) - (targetGuard * 0.055)));
            const pressure = Math.max(1, Math.round((offense / 40) + (participant.statProfile?.battleStats?.initiative || 0) / 85));
            this.modifyParticipantHp(battleId, target.id, -damage);
            this.applyPressure(battleId, target.id, pressure);
            this.applyPressure(battleId, participant.id, -1);
            const visual = this.registerBattleVisualAction(snapshot, participant, 'attack', target.id, {
                roundNumber,
                damage,
                pressure
            });
            this.appendBattleEvent(battleId, 'round-action', {
                roundNumber,
                actorId: participant.id,
                actorLabel: this.getParticipantLabel(participant),
                type: 'attack',
                targetId: target.id,
                targetLabel: this.getParticipantLabel(target),
                damage,
                pressure,
                targetGuard,
                targetResolve,
                ability: participant.abilities?.specialAbility || null,
                abilityLabel: participant.abilities?.displayLabel || this.getAbilityDisplayLabel(participant.abilities?.specialAbility || null),
                specialLabel: visual?.specialLabel || null,
                isSpecial: !!visual?.isSpecial,
                flowerRelated: !!visual?.flowerRelated,
                projectileStyle: visual?.projectileStyle || null
            });
            this.emitBattleActionOccurred({
                battleId,
                roundNumber,
                actorId: participant.id,
                actorLabel: this.getParticipantLabel(participant),
                type: 'attack',
                targetId: target.id,
                targetLabel: this.getParticipantLabel(target),
                damage,
                pressure,
                targetGuard,
                targetResolve,
                ability: participant.abilities?.specialAbility || null,
                abilityLabel: participant.abilities?.displayLabel || this.getAbilityDisplayLabel(participant.abilities?.specialAbility || null),
                specialLabel: visual?.specialLabel || null,
                isSpecial: !!visual?.isSpecial,
                flowerRelated: !!visual?.flowerRelated,
                projectileStyle: visual?.projectileStyle || null
            });
        }

        const survivingTeams = Object.values(snapshot.teams || {})
            .filter(team => this.getActiveParticipantIds(snapshot, team.teamId).length > 0)
            .map(team => team.teamId);

        const teamLabels = snapshot.metadata?.teamLabels || {};
        if (survivingTeams.length <= 1) {
            const winnerLabel = survivingTeams[0]
                ? (teamLabels[survivingTeams[0]] || survivingTeams[0])
                : null;
            this.resolveSnapshot(battleId, {
                winnerTeamId: survivingTeams[0] || null,
                summary: winnerLabel ? `${winnerLabel} secured the field in round ${roundNumber}` : `No side held the field by round ${roundNumber}`,
                metadata: { roundNumber }
            });
        } else if (roundNumber >= (snapshot.metadata?.maxRounds || 18)) {
            const scoredTeams = Object.keys(snapshot.teams || {})
                .map(teamId => ({
                    teamId,
                    score: this.getTeamResolutionScore(snapshot, teamId)
                }))
                .sort((left, right) => right.score - left.score);
            const topTeam = scoredTeams[0] || null;
            const secondTeam = scoredTeams[1] || null;
            const winnerTeamId = topTeam && (!secondTeam || topTeam.score > secondTeam.score)
                ? topTeam.teamId
                : null;
            const winnerLabel = winnerTeamId ? (teamLabels[winnerTeamId] || winnerTeamId) : null;
            this.resolveSnapshot(battleId, {
                winnerTeamId,
                summary: winnerLabel
                    ? `${winnerLabel} won on endurance in round ${roundNumber}`
                    : `Battle ended even after ${roundNumber} rounds`,
                metadata: {
                    roundNumber,
                    resolution: 'endurance'
                }
            });
        } else {
            this.appendBattleEvent(battleId, 'round-finished', {
                roundNumber,
                survivingTeams
            });
        }

        return this.getSnapshot(battleId);
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
                actorLabel: this.getParticipantLabel(participant),
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
                actorLabel: this.getParticipantLabel(participant),
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
                actorLabel: this.getParticipantLabel(participant),
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
            participants: snapshot.participantOrder.map(participantId => {
                const participant = snapshot.participantsById[participantId];
                return {
                    id: participantId,
                    teamId: participant?.teamId || null,
                    ...this.cloneValue(participant?.commit, {})
                };
            }),
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
        const winnerTeamId = payload.result?.winnerTeamId || null;
        for (const participantResult of payload.participants || []) {
            const entity = this.getParticipantSource(participantResult.id);
            if (!entity) continue;
            const nextHp = participantResult.hp ?? entity.battleState?.hp ?? 100;
            const nextPressure = participantResult.pressure ?? entity.battleState?.pressure ?? 0;
            const lastOutcome = participantResult.retreated
                ? 'retreated'
                : nextHp <= 0
                    ? 'down'
                    : winnerTeamId
                        ? (participantResult.teamId === winnerTeamId ? 'won' : 'lost')
                        : 'resolved';

            entity.battleState = {
                hp: nextHp,
                maxHp: entity.battleState?.maxHp ?? 100,
                pressure: nextPressure,
                retreated: !!participantResult.retreated,
                retreatScore: participantResult.retreatScore ?? entity.battleState?.retreatScore ?? 0,
                lastBattleId: payload.battleId,
                lastOutcome
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

            if (typeof rosterSystem !== 'undefined') {
                rosterSystem.recordBattleState(entity.id, {
                    battleId: payload.battleId,
                    teamId: participantResult.teamId || null,
                    winnerTeamId,
                    hp: nextHp,
                    pressure: nextPressure,
                    retreated: !!participantResult.retreated,
                    lastOutcome,
                    summary: payload.result?.summary || null
                });
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
        this.ensureRoundState(snapshot);
        snapshot.lastObservedPopulation = {
            butterflies: gameState.butterflies?.length || 0,
            caterpillars: gameState.caterpillars?.length || 0,
            flowers: gameState.flowers?.length || 0
        };
        if (!snapshot.metadata.autoBattle || snapshot.metadata.autoBattlePaused) return;

        snapshot.metadata.autoBattleElapsedFrames += snapshot.metadata.autoBattleSpeed || 1;
        const intervalFrames = snapshot.metadata.autoBattleIntervalFrames || 30;
        if (snapshot.metadata.autoBattleElapsedFrames < intervalFrames) return;
        snapshot.metadata.autoBattleElapsedFrames = 0;

        this.resolveRound(this.activeBattleId);
    }
}

const battleSystem = new BattleSystem();
