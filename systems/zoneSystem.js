class ZoneSystem {
    constructor() {
        this.zones = new Map();
        this.doorways = new Map();
        this.ecologyStates = new Map();
        this.focusedZoneId = null;
        this.overviewMode = true;
        this.initialized = false;
        this.viewMode = 'focused-garden';
        this.ecologySchemaVersion = 'a1-zone-pressure-v1';
        this.legacyGridLookupWarnings = new Set();
    }

    initialize(gridManagerInstance = null) {
        const configuredZones = gameConfig.world?.zones || [];
        const configuredDoorways = gameConfig.world?.doorways || [];
        const projectionDefaults = gameConfig?.spatial?.projection || {};
        this.overviewMode = !!gameConfig.world?.overviewMode;
        this.viewMode = this.overviewMode ? 'overview' : 'focused-garden';
        this.zones.clear();
        this.doorways.clear();
        this.ecologyStates.clear();

        for (const zone of configuredZones) {
            const board = this.createZoneBoardConfig(zone, projectionDefaults);
            const nextZone = {
                id: zone.id,
                label: zone.label,
                kind: zone.kind,
                poolAllowed: !!zone.poolAllowed,
                doorwayIds: [...(zone.doorwayIds || [])],
                adjacentZoneIds: [...(zone.adjacentZoneIds || [])],
                bounds: { ...(zone.bounds || {}) },
                renderProfile: { ...(zone.renderProfile || {}) },
                board,
                exits: [],
                ecologyProfile: {
                    ...(zone.ecologyProfile || {}),
                    preferredPersonalities: [...(zone.ecologyProfile?.preferredPersonalities || [])],
                    toleratedPersonalities: [...(zone.ecologyProfile?.toleratedPersonalities || [])],
                    preferredFlowerTypes: [...(zone.ecologyProfile?.preferredFlowerTypes || [])],
                    identityTags: [...(zone.ecologyProfile?.identityTags || [])],
                    actionBiases: { ...(zone.ecologyProfile?.actionBiases || {}) },
                    migrationAffinity: { ...(zone.ecologyProfile?.migrationAffinity || {}) }
                },
                cells: []
            };
            this.zones.set(zone.id, nextZone);
            this.ecologyStates.set(zone.id, this.createDefaultZoneEcologyState(zone.id, nextZone));
        }
        this.buildZoneExits();

        for (const doorway of configuredDoorways) {
            this.doorways.set(doorway.id, {
                id: doorway.id,
                label: doorway.label,
                fromZoneId: doorway.fromZoneId,
                toZoneId: doorway.toZoneId,
                grid: { ...(doorway.grid || {}) }
            });
        }

        if (configuredZones.length > 0) {
            this.focusedZoneId = configuredZones[0].id;
        }

        if (gridManagerInstance?.zones && this.zones.has(this.focusedZoneId)) {
            const gardenZone = this.zones.get(this.focusedZoneId);
            gardenZone.legacyGridZones = gridManagerInstance.zones;
        }

        this.initialized = true;
    }

    createZoneBoardConfig(zone = {}, projectionDefaults = gameConfig?.spatial?.projection || {}) {
        const configuredBoard = zone.board || {};
        const screenRegion = zone.renderProfile?.screenRegion || {};
        const origin = configuredBoard.origin || {};
        return {
            widthUnits: Math.max(1, Math.round(configuredBoard.widthUnits ?? projectionDefaults.defaultWidthUnits ?? 36)),
            depthUnits: Math.max(1, Math.round(configuredBoard.depthUnits ?? projectionDefaults.defaultDepthUnits ?? 22)),
            origin: {
                screenX: Number.isFinite(origin.screenX)
                    ? origin.screenX
                    : (projectionDefaults.origin?.screenX ?? screenRegion.minX ?? 0),
                screenY: Number.isFinite(origin.screenY)
                    ? origin.screenY
                    : (projectionDefaults.origin?.screenY ?? screenRegion.minY ?? 0)
            },
            ppu: Number.isFinite(configuredBoard.ppu) ? configuredBoard.ppu : (projectionDefaults.ppu ?? 20),
            groundT: Number.isFinite(configuredBoard.groundT) ? configuredBoard.groundT : (projectionDefaults.groundT ?? 0.56),
            hStep: Number.isFinite(configuredBoard.hStep) ? configuredBoard.hStep : (projectionDefaults.hStep ?? 8)
        };
    }

    resolveExitDirection(sourceZone, targetZone) {
        const sourceBounds = sourceZone?.bounds || {};
        const targetBounds = targetZone?.bounds || {};
        const sourceCenter = {
            x: ((sourceBounds.minX ?? 0) + (sourceBounds.maxX ?? 0)) / 2,
            y: ((sourceBounds.minY ?? 0) + (sourceBounds.maxY ?? 0)) / 2
        };
        const targetCenter = {
            x: ((targetBounds.minX ?? 0) + (targetBounds.maxX ?? 0)) / 2,
            y: ((targetBounds.minY ?? 0) + (targetBounds.maxY ?? 0)) / 2
        };
        const dx = targetCenter.x - sourceCenter.x;
        const dy = targetCenter.y - sourceCenter.y;
        if (Math.abs(dx) > Math.abs(dy) * 1.2) return dx > 0 ? 'E' : 'W';
        if (Math.abs(dy) > Math.abs(dx) * 1.2) return dy > 0 ? 'S' : 'N';
        if (dx >= 0 && dy >= 0) return 'SE';
        if (dx >= 0 && dy < 0) return 'NE';
        if (dx < 0 && dy >= 0) return 'SW';
        return 'NW';
    }

    getDirectionVector(direction) {
        return {
            N: { du: 0, dv: -1 },
            S: { du: 0, dv: 1 },
            E: { du: 1, dv: 0 },
            W: { du: -1, dv: 0 },
            NE: { du: 1, dv: -1 },
            NW: { du: -1, dv: -1 },
            SE: { du: 1, dv: 1 },
            SW: { du: -1, dv: 1 }
        }[direction] || { du: 1, dv: 0 };
    }

    buildEdgeSegment(board, direction) {
        const widthUnits = board?.widthUnits || 36;
        const depthUnits = board?.depthUnits || 22;
        const uInset = widthUnits * 0.28;
        const vInset = depthUnits * 0.28;
        if (direction === 'E') return { uStart: widthUnits, vStart: vInset, uEnd: widthUnits, vEnd: depthUnits - vInset };
        if (direction === 'W') return { uStart: 0, vStart: vInset, uEnd: 0, vEnd: depthUnits - vInset };
        if (direction === 'N') return { uStart: uInset, vStart: 0, uEnd: widthUnits - uInset, vEnd: 0 };
        if (direction === 'S') return { uStart: uInset, vStart: depthUnits, uEnd: widthUnits - uInset, vEnd: depthUnits };
        if (direction === 'NE') return { uStart: widthUnits * 0.7, vStart: 0, uEnd: widthUnits, vEnd: depthUnits * 0.3 };
        if (direction === 'NW') return { uStart: 0, vStart: depthUnits * 0.3, uEnd: widthUnits * 0.3, vEnd: 0 };
        if (direction === 'SE') return { uStart: widthUnits * 0.7, vStart: depthUnits, uEnd: widthUnits, vEnd: depthUnits * 0.7 };
        if (direction === 'SW') return { uStart: 0, vStart: depthUnits * 0.7, uEnd: widthUnits * 0.3, vEnd: depthUnits };
        return { uStart: widthUnits, vStart: vInset, uEnd: widthUnits, vEnd: depthUnits - vInset };
    }

    getOppositeExitDirection(direction) {
        return {
            N: 'S',
            S: 'N',
            E: 'W',
            W: 'E',
            NE: 'SW',
            NW: 'SE',
            SE: 'NW',
            SW: 'NE'
        }[direction] || 'W';
    }

    buildZoneExits() {
        for (const zone of this.zones.values()) {
            zone.exits = [];
        }
        for (const sourceZone of this.zones.values()) {
            for (const targetZoneId of sourceZone.adjacentZoneIds || []) {
                const targetZone = this.getZone(targetZoneId);
                if (!targetZone) continue;
                const direction = this.resolveExitDirection(sourceZone, targetZone);
                const arrivalDirection = this.getOppositeExitDirection(direction);
                sourceZone.exits.push({
                    id: `${sourceZone.id}->${targetZoneId}`,
                    targetZoneId,
                    direction,
                    exitSegment: this.buildEdgeSegment(sourceZone.board, direction),
                    arrivalSegment: this.buildEdgeSegment(targetZone.board, arrivalDirection),
                    flightVector: this.getDirectionVector(direction)
                });
            }
        }
    }

    update(gameState = gameCore?.gameState) {
        if (gameConfig?.world?.zoneScarcityPulse === false) return null;
        const currentFrame = gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0);
        return this.tickScarcityPulse(gameState, currentFrame);
    }

    clampUnit(value) {
        return Math.max(0, Math.min(1, value ?? 0));
    }

    roundUnit(value, digits = 2) {
        const scale = 10 ** digits;
        return Math.round(this.clampUnit(value) * scale) / scale;
    }

    createDefaultZoneEcologyState(zoneId, zone = this.getZone(zoneId)) {
        const actionBiases = zone?.ecologyProfile?.actionBiases || {};
        const social = this.clampUnit(actionBiases.social || 0);
        const teaching = this.clampUnit(actionBiases.teaching || 0);
        const exploration = this.clampUnit(actionBiases.exploration || 0);
        const rest = this.clampUnit(actionBiases.rest || 0);
        const objectUse = this.clampUnit(actionBiases.objectUse || 0);
        const vigilance = this.clampUnit(actionBiases.vigilance || 0);
        const training = this.clampUnit(actionBiases.training || 0);
        const status = this.clampUnit(actionBiases.status || 0);
        const caregiving = this.clampUnit(actionBiases.caregiving || 0);
        return {
            schemaVersion: this.ecologySchemaVersion,
            foodRichness: this.clampUnit(0.22 + (rest * 0.18) + (exploration * 0.08) + (caregiving * 0.06)),
            shelterCapacity: this.clampUnit(0.24 + (objectUse * 0.26) + (vigilance * 0.18) + (rest * 0.12)),
            crowdingTolerance: this.clampUnit(0.34 + (social * 0.16) + (exploration * 0.12) + (training * 0.08) - (vigilance * 0.06)),
            crowdingPressure: 0.18,
            migrationPull: this.clampUnit(0.16 + (exploration * 0.38) + (status * 0.08) + (training * 0.06)),
            socialValence: this.clampUnit(0.18 + (social * 0.46) + (teaching * 0.16) + (caregiving * 0.08)),
            trainingValence: this.clampUnit(0.08 + (training * 0.52) + (teaching * 0.18) + (status * 0.12)),
            recoveryPressure: this.clampUnit(0.12 + (rest * 0.44) + (social * 0.12) + (caregiving * 0.06)),
            resourceReserve: this.clampUnit(0.42 + (rest * 0.14) + (exploration * 0.08) + (caregiving * 0.06)),
            habitatQuality: this.clampUnit(0.38 + (social * 0.12) + (rest * 0.12) + (objectUse * 0.08) + (exploration * 0.06)),
            depletionPressure: 0.08,
            recoveryFloor: this.clampUnit(0.24 + (rest * 0.08) + (social * 0.04) + (caregiving * 0.06)),
            consumptionPressure: 0,
            residentRatio: 0.5,
            wildRatio: 0.5,
            scarcityActive: false,
            scarcityStartedFrame: null,
            scarcityUntilFrame: null,
            scarcityReason: null,
            lastScarcitySignalFrame: null,
            lastUpdatedFrame: 0,
            lastFlowerConsumptionFrame: 0,
            cadenceIntervalFrames: 1,
            cadenceOffset: 0
        };
    }

    normalizeZoneEcologyState(zoneId, state = {}) {
        const defaults = this.createDefaultZoneEcologyState(zoneId);
        return {
            schemaVersion: this.ecologySchemaVersion,
            foodRichness: this.clampUnit(state.foodRichness ?? defaults.foodRichness),
            shelterCapacity: this.clampUnit(state.shelterCapacity ?? defaults.shelterCapacity),
            crowdingTolerance: this.clampUnit(state.crowdingTolerance ?? defaults.crowdingTolerance),
            crowdingPressure: this.clampUnit(state.crowdingPressure ?? defaults.crowdingPressure),
            migrationPull: this.clampUnit(state.migrationPull ?? defaults.migrationPull),
            socialValence: this.clampUnit(state.socialValence ?? defaults.socialValence),
            trainingValence: this.clampUnit(state.trainingValence ?? defaults.trainingValence),
            recoveryPressure: this.clampUnit(state.recoveryPressure ?? defaults.recoveryPressure),
            resourceReserve: this.clampUnit(state.resourceReserve ?? defaults.resourceReserve),
            habitatQuality: this.clampUnit(state.habitatQuality ?? defaults.habitatQuality),
            depletionPressure: this.clampUnit(state.depletionPressure ?? defaults.depletionPressure),
            recoveryFloor: this.clampUnit(state.recoveryFloor ?? defaults.recoveryFloor),
            consumptionPressure: this.clampUnit(state.consumptionPressure ?? defaults.consumptionPressure),
            residentRatio: this.clampUnit(state.residentRatio ?? defaults.residentRatio),
            wildRatio: this.clampUnit(state.wildRatio ?? defaults.wildRatio),
            scarcityActive: !!state.scarcityActive,
            scarcityStartedFrame: Number.isFinite(state.scarcityStartedFrame) ? state.scarcityStartedFrame : defaults.scarcityStartedFrame,
            scarcityUntilFrame: Number.isFinite(state.scarcityUntilFrame) ? state.scarcityUntilFrame : defaults.scarcityUntilFrame,
            scarcityReason: state.scarcityReason || defaults.scarcityReason,
            lastScarcitySignalFrame: Number.isFinite(state.lastScarcitySignalFrame) ? state.lastScarcitySignalFrame : defaults.lastScarcitySignalFrame,
            lastUpdatedFrame: Number.isFinite(state.lastUpdatedFrame) ? state.lastUpdatedFrame : defaults.lastUpdatedFrame,
            lastFlowerConsumptionFrame: Number.isFinite(state.lastFlowerConsumptionFrame) ? state.lastFlowerConsumptionFrame : defaults.lastFlowerConsumptionFrame,
            cadenceIntervalFrames: Math.max(1, Math.round(state.cadenceIntervalFrames ?? defaults.cadenceIntervalFrames)),
            cadenceOffset: Math.max(0, Math.round(state.cadenceOffset ?? defaults.cadenceOffset))
        };
    }

    ensureZoneEcologyState(zoneId) {
        if (!zoneId || !this.zones.has(zoneId)) return null;
        if (!this.ecologyStates.has(zoneId)) {
            this.ecologyStates.set(zoneId, this.createDefaultZoneEcologyState(zoneId));
        }
        return this.ecologyStates.get(zoneId) || null;
    }

    getZoneEcologyState(zoneId) {
        const state = this.ensureZoneEcologyState(zoneId);
        return state ? { ...state } : null;
    }

    setZoneEcologyState(zoneId, partial = {}, options = {}) {
        const current = this.ensureZoneEcologyState(zoneId);
        if (!current) return null;
        const nextState = options.replace
            ? this.normalizeZoneEcologyState(zoneId, partial)
            : this.normalizeZoneEcologyState(zoneId, { ...current, ...partial });
        this.ecologyStates.set(zoneId, nextState);
        return { ...nextState };
    }

    getOpenScarcityZones() {
        return [...this.zones.values()].filter(zone => zone?.id && zone.id !== 'sun-court');
    }

    tickScarcityPulse(gameState = gameCore?.gameState, currentFrame = 0, options = {}) {
        const safeFrame = Math.max(0, Math.round(currentFrame || 0));
        const intervalFrames = Math.max(600, Math.round(options.intervalFrames || 21600));
        const durationFrames = Math.max(300, Math.round(options.durationFrames || 1800));
        const active = [];
        for (const zone of this.zones.values()) {
            const state = this.ensureZoneEcologyState(zone.id);
            if (!state) continue;
            if (state.scarcityActive && Number.isFinite(state.scarcityUntilFrame) && safeFrame >= state.scarcityUntilFrame) {
                state.scarcityActive = false;
                state.scarcityReason = null;
                state.foodRichness = this.clampUnit(Math.max(state.foodRichness, 0.24));
                state.resourceReserve = this.clampUnit(Math.max(state.resourceReserve, 0.3));
            }
            if (state.scarcityActive) active.push(zone.id);
        }
        if (active.length && !options.force) return { activeZoneId: active[0], started: false };
        if (!options.force && (safeFrame <= 0 || safeFrame % intervalFrames !== 0)) return null;
        const candidateZones = this.getOpenScarcityZones();
        const selected = options.zoneId
            ? this.getZone(options.zoneId)
            : candidateZones[(Math.floor(safeFrame / intervalFrames)) % Math.max(1, candidateZones.length)];
        if (!selected?.id) return null;
        return this.triggerScarcityPulse(selected.id, {
            currentFrame: safeFrame,
            durationFrames,
            reason: options.reason || 'periodic-scarcity',
            gameState
        });
    }

    triggerScarcityPulse(zoneId, options = {}) {
        const state = this.ensureZoneEcologyState(zoneId);
        if (!state) return null;
        const currentFrame = Math.max(0, Math.round(options.currentFrame ?? gameCore?.getCurrentFrame?.() ?? 0));
        const durationFrames = Math.max(300, Math.round(options.durationFrames || 1800));
        state.scarcityActive = true;
        state.scarcityStartedFrame = currentFrame;
        state.scarcityUntilFrame = currentFrame + durationFrames;
        state.scarcityReason = options.reason || 'scarcity';
        state.lastScarcitySignalFrame = currentFrame;
        state.foodRichness = this.clampUnit(state.foodRichness * 0.42);
        state.resourceReserve = this.clampUnit(state.resourceReserve * 0.55);
        state.depletionPressure = this.clampUnit(Math.max(state.depletionPressure, 0.68));
        state.migrationPull = this.clampUnit(Math.max(state.migrationPull, 0.62));
        state.lastUpdatedFrame = currentFrame;

        const gameState = options.gameState || gameCore?.gameState;
        const zoneButterflies = (gameState?.butterflies || []).filter(entity =>
            (entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null) === zoneId
        );
        const caller = zoneButterflies[0] || null;
        if (caller) {
            communicationSystem?.emitCooperationSignal?.(caller, {
                signalType: 'warning_signal',
                intentFamily: 'guidance',
                intentTags: ['warning', 'guidance', 'coordination'],
                phrase: 'Food is getting scarce here; we should share or scout.',
                targetIds: zoneButterflies.slice(1, 4).map(entity => entity.id),
                zoneId,
                reason: 'zone-scarcity'
            });
        }
        const reserve = (gameState?.flowers || []).find(flower =>
            flower?.isReserveFoodBall?.()
            && (flower.currentZoneId || flower.boardPos?.zoneId || null) === zoneId
        ) || null;
        let shared = false;
        if (caller && reserve && zoneButterflies[1]) {
            communicationSystem?.emitReserveFoodSharing?.(caller, zoneButterflies[1], reserve, {
                reason: 'zone-scarcity'
            });
            shared = true;
        }
        return {
            activeZoneId: zoneId,
            started: true,
            untilFrame: state.scarcityUntilFrame,
            warningEmitted: !!caller,
            reserveFoodShared: shared
        };
    }

    describeZoneEcologySignature(zoneId, state, profile = {}) {
        if (!state) return 'steady habitat';
        const style = profile.communicationStyle || '';
        if (style === 'loud-training') return 'drill-heavy pull';
        if (style === 'open-land-watchful') return 'watchful shelter';
        if (style === 'open-land-echoing') return 'echoing roam';
        if (style === 'open-land-calm') return 'social calm';

        const candidates = [
            { label: 'social calm', value: state.socialValence + (state.recoveryPressure * 0.18) },
            { label: 'drill-heavy pull', value: state.trainingValence + (state.migrationPull * 0.16) },
            { label: 'watchful shelter', value: state.shelterCapacity + (state.crowdingTolerance * 0.12) },
            { label: 'echoing roam', value: state.migrationPull + (state.foodRichness * 0.08) }
        ];
        return candidates.sort((left, right) => right.value - left.value)[0]?.label || (profile.identityLabel || zoneId || 'steady habitat');
    }

    buildZoneEcologyFreshness(state = {}, currentFrame = (gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0))) {
        const lastValidFrame = Number.isFinite(state?.lastUpdatedFrame) ? Math.max(0, Math.round(state.lastUpdatedFrame)) : 0;
        const cadenceIntervalFrames = Math.max(1, Math.round(state?.cadenceIntervalFrames || 1));
        const cadenceOffset = Math.max(0, Math.round(state?.cadenceOffset || 0));
        const safeCurrentFrame = Number.isFinite(currentFrame) ? Math.max(0, Math.round(currentFrame)) : 0;
        return {
            lastValidFrame,
            staleFrames: Math.max(0, safeCurrentFrame - lastValidFrame),
            cadenceIntervalFrames,
            cadenceOffset
        };
    }

    getZoneEcologySummary(zoneId, options = {}) {
        const zone = this.getZone(zoneId);
        if (!zone) return null;

        const profile = zone.ecologyProfile || {};
        const state = this.ensureZoneEcologyState(zoneId);
        if (!state) return null;

        const stats = options.stats || {};
        const butterflyCount = Math.max(0, options.butterflyCount ?? stats.butterflies ?? 0);
        const flowerCount = Math.max(0, options.flowerCount ?? stats.flowers ?? 0);
        const blockCount = Math.max(0, options.blockCount ?? stats.blocks ?? 0);
        const residentButterflies = Math.max(0, options.residentButterflies ?? stats.residentButterflies ?? 0);
        const wildButterflies = Math.max(0, options.wildButterflies ?? stats.wildButterflies ?? 0);
        const freshness = this.buildZoneEcologyFreshness(state, options.currentFrame);
        const residentRatio = butterflyCount > 0 ? residentButterflies / butterflyCount : state.residentRatio;
        const wildRatio = butterflyCount > 0 ? wildButterflies / butterflyCount : state.wildRatio;
        const signatureLabel = this.describeZoneEcologySignature(zoneId, state, profile);

        return {
            zoneId,
            label: zone.label || zoneId,
            kind: zone.kind || 'open-land',
            identityLabel: profile.identityLabel || zone.label || zoneId,
            identityTags: [...(profile.identityTags || [])],
            communicationStyle: profile.communicationStyle || null,
            signatureLabel,
            foodRichness: this.roundUnit(state.foodRichness),
            shelterCapacity: this.roundUnit(state.shelterCapacity),
            crowdingTolerance: this.roundUnit(state.crowdingTolerance),
            crowdingPressure: this.roundUnit(state.crowdingPressure),
            migrationPull: this.roundUnit(state.migrationPull),
            socialValence: this.roundUnit(state.socialValence),
            trainingValence: this.roundUnit(state.trainingValence),
            recoveryPressure: this.roundUnit(state.recoveryPressure),
            resourceReserve: this.roundUnit(state.resourceReserve),
            habitatQuality: this.roundUnit(state.habitatQuality),
            depletionPressure: this.roundUnit(state.depletionPressure),
            recoveryFloor: this.roundUnit(state.recoveryFloor),
            consumptionPressure: this.roundUnit(state.consumptionPressure),
            scarcityActive: !!state.scarcityActive,
            scarcityReason: state.scarcityReason || null,
            scarcityUntilFrame: state.scarcityUntilFrame,
            freshness,
            residentRatio: this.roundUnit(residentRatio),
            wildRatio: this.roundUnit(wildRatio),
            butterflyCount,
            flowerCount,
            blockCount,
            headline: `${profile.identityLabel || zone.label || zoneId} | ${signatureLabel}`,
            detail: `food ${Math.round(state.foodRichness * 100)} | reserve ${Math.round(state.resourceReserve * 100)} | qual ${Math.round(state.habitatQuality * 100)} | crowd ${Math.round(state.crowdingPressure * 100)}`
        };
    }

    getZone(zoneId) {
        return this.zones.get(zoneId) || null;
    }

    getBoardConfigForZone(zoneId = this.focusedZoneId) {
        const zone = this.getZone(zoneId) || this.getFocusedZone();
        return zone?.board ? {
            ...zone.board,
            origin: { ...(zone.board.origin || {}) }
        } : null;
    }

    getZonePlacementRegion(zoneId = this.focusedZoneId) {
        const zone = this.getZone(zoneId) || this.getFocusedZone();
        if (!zone) return null;

        if (gameConfig?.world?.renderMode === 'sim-board') {
            const board = zone.board || this.createZoneBoardConfig(zone);
            const origin = board.origin || {};
            const ppu = board.ppu ?? gameConfig?.spatial?.projection?.ppu ?? 20;
            const groundT = board.groundT ?? gameConfig?.spatial?.projection?.groundT ?? 0.56;
            const hStep = board.hStep ?? gameConfig?.spatial?.projection?.hStep ?? 8;
            const widthUnits = board.widthUnits ?? gameConfig?.spatial?.projection?.defaultWidthUnits ?? 36;
            const depthUnits = board.depthUnits ?? gameConfig?.spatial?.projection?.defaultDepthUnits ?? 22;
            const screenX = Number.isFinite(origin.screenX) ? origin.screenX : (origin.x ?? 0);
            const screenY = Number.isFinite(origin.screenY) ? origin.screenY : (origin.y ?? 0);

            return {
                minX: screenX + (0.5 * ppu),
                maxX: screenX + ((widthUnits - 0.5) * ppu),
                minY: screenY + (0.5 * hStep),
                maxY: screenY + ((depthUnits - 0.5) * ppu * groundT)
            };
        }

        const region = zone.renderProfile?.screenRegion || null;
        return region ? { ...region } : null;
    }

    getExits(zoneId = this.focusedZoneId) {
        const zone = this.getZone(zoneId);
        return (zone?.exits || []).map(exit => ({
            ...exit,
            exitSegment: { ...(exit.exitSegment || {}) },
            arrivalSegment: { ...(exit.arrivalSegment || {}) },
            flightVector: { ...(exit.flightVector || {}) }
        }));
    }

    getExitForTarget(zoneId, targetZoneId) {
        return this.getExits(zoneId).find(exit => exit.targetZoneId === targetZoneId) || null;
    }

    getZones() {
        return Array.from(this.zones.values());
    }

    getDoorways() {
        return Array.from(this.doorways.values());
    }

    getDoorway(doorwayId) {
        return this.doorways.get(doorwayId) || null;
    }

    getFocusedZone() {
        return this.getZone(this.focusedZoneId);
    }

    getZoneCenter(zoneId) {
        const zone = this.getZone(zoneId);
        if (!zone?.bounds) return null;
        return {
            x: (zone.bounds.minX + zone.bounds.maxX) / 2,
            y: (zone.bounds.minY + zone.bounds.maxY) / 2
        };
    }

    getZoneAtGrid(gridX, gridY) {
        if (['section-scenes', 'sim-board'].includes(gameConfig?.world?.renderMode)) {
            const warningKey = 'getZoneAtGrid:focused-render-mode';
            if (!this.legacyGridLookupWarnings.has(warningKey)) {
                this.legacyGridLookupWarnings.add(warningKey);
                gameCore?.telemetrySystem?.recordRuntimeIssue?.('legacy-zone-grid-lookup', {
                    mode: gameConfig?.world?.renderMode || null,
                    gridX,
                    gridY,
                    recommendation: 'pass boardPos to zoneSystem.getZoneAtBoard(boardPos)'
                });
            }
            return this.getFocusedZone();
        }
        for (const zone of this.zones.values()) {
            const bounds = zone.bounds;
            if (!bounds) continue;
            if (gridX >= bounds.minX && gridX <= bounds.maxX && gridY >= bounds.minY && gridY <= bounds.maxY) {
                return zone;
            }
        }
        return null;
    }

    getZoneAtBoard(boardPos = null) {
        if (!boardPos || !Number.isFinite(boardPos.u) || !Number.isFinite(boardPos.v)) return null;
        if (gameConfig?.spatial?.boardZoneLookup === false) {
            return this.getFocusedZone();
        }
        const preferredZone = boardPos.zoneId ? this.getZone(boardPos.zoneId) : null;
        const contains = (zone) => {
            const board = zone?.board || null;
            if (!board) return false;
            const widthUnits = board.widthUnits ?? gameConfig?.spatial?.projection?.defaultWidthUnits ?? 36;
            const depthUnits = board.depthUnits ?? gameConfig?.spatial?.projection?.defaultDepthUnits ?? 22;
            return boardPos.u >= 0
                && boardPos.u <= widthUnits
                && boardPos.v >= 0
                && boardPos.v <= depthUnits;
        };
        if (preferredZone && contains(preferredZone)) return preferredZone;
        for (const zone of this.zones.values()) {
            if (contains(zone)) return zone;
        }
        return preferredZone || null;
    }

    getEntityZone(entity) {
        if (!entity) return null;
        if (entity.boardPos && this.getZoneAtBoard) {
            const zone = this.getZoneAtBoard(entity.boardPos);
            if (zone) return zone;
        }
        if (entity.currentZoneId) return this.getZone(entity.currentZoneId);
        if (entity.gridPos) return this.getZoneAtGrid(entity.gridPos.x, entity.gridPos.y);
        return null;
    }

    getAdjacentZones(zoneId = this.focusedZoneId) {
        const zone = this.getZone(zoneId);
        if (!zone) return [];
        return (zone.adjacentZoneIds || [])
            .map(adjacentZoneId => this.getZone(adjacentZoneId))
            .filter(Boolean);
    }

    areZonesAdjacent(zoneAId, zoneBId) {
        const zoneA = this.getZone(zoneAId);
        if (!zoneA || !zoneBId) return false;
        return zoneA.adjacentZoneIds?.includes(zoneBId) || false;
    }

    setFocusedZone(zoneId) {
        if (!this.zones.has(zoneId) || this.focusedZoneId === zoneId) return false;
        this.focusedZoneId = zoneId;
        this.overviewMode = false;
        this.viewMode = 'focused-garden';
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.ZONE_FOCUS_CHANGED, { zoneId });
        }
        return true;
    }

    setOverviewMode(enabled) {
        this.overviewMode = !!enabled;
        this.viewMode = this.overviewMode ? 'overview' : 'focused-garden';
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.overviewMode = mode === 'overview';
    }

    serializeDurableState() {
        const ecologyStates = {};
        const boardConfigs = {};
        for (const [zoneId, state] of this.ecologyStates.entries()) {
            if (!this.zones.has(zoneId)) continue;
            ecologyStates[zoneId] = this.normalizeZoneEcologyState(zoneId, state);
        }
        for (const zone of this.getZones()) {
            boardConfigs[zone.id] = this.getBoardConfigForZone(zone.id);
        }
        return {
            focusedZoneId: this.focusedZoneId,
            overviewMode: this.overviewMode,
            viewMode: this.viewMode,
            boardConfigs,
            ecologyStates
        };
    }

    deserializeDurableState(serialized = {}) {
        const focusMigrationMap = {
            'garden-core': 'ivy-cloister'
        };
        const nextFocusedZoneId = focusMigrationMap[serialized.focusedZoneId] || serialized.focusedZoneId;
        if (nextFocusedZoneId && this.zones.has(nextFocusedZoneId)) {
            this.focusedZoneId = nextFocusedZoneId;
        }

        if (typeof serialized.overviewMode === 'boolean') {
            this.overviewMode = serialized.overviewMode;
        }

        if (typeof serialized.viewMode === 'string') {
            this.viewMode = serialized.viewMode;
            this.overviewMode = serialized.viewMode === 'overview';
        }

        const serializedEcologyStates = serialized?.ecologyStates && typeof serialized.ecologyStates === 'object'
            ? serialized.ecologyStates
            : {};
        this.ecologyStates.clear();
        for (const zone of this.getZones()) {
            this.ecologyStates.set(
                zone.id,
                this.normalizeZoneEcologyState(zone.id, serializedEcologyStates[zone.id] || {})
            );
        }

        return this.getViewState();
    }

    getViewState() {
        return {
            focusedZoneId: this.focusedZoneId,
            overviewMode: this.overviewMode,
            viewMode: this.viewMode
        };
    }
}

const zoneSystem = new ZoneSystem();
