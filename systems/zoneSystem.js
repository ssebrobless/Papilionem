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
    }

    initialize(gridManagerInstance = null) {
        const configuredZones = gameConfig.world?.zones || [];
        const configuredDoorways = gameConfig.world?.doorways || [];
        this.overviewMode = !!gameConfig.world?.overviewMode;
        this.viewMode = this.overviewMode ? 'overview' : 'focused-garden';
        this.zones.clear();
        this.doorways.clear();
        this.ecologyStates.clear();

        for (const zone of configuredZones) {
            const nextZone = {
                id: zone.id,
                label: zone.label,
                kind: zone.kind,
                poolAllowed: !!zone.poolAllowed,
                doorwayIds: [...(zone.doorwayIds || [])],
                adjacentZoneIds: [...(zone.adjacentZoneIds || [])],
                bounds: { ...(zone.bounds || {}) },
                renderProfile: { ...(zone.renderProfile || {}) },
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

    update() {}

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
        if (gameConfig?.world?.renderMode === 'section-scenes') {
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
        for (const [zoneId, state] of this.ecologyStates.entries()) {
            if (!this.zones.has(zoneId)) continue;
            ecologyStates[zoneId] = this.normalizeZoneEcologyState(zoneId, state);
        }
        return {
            focusedZoneId: this.focusedZoneId,
            overviewMode: this.overviewMode,
            viewMode: this.viewMode,
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
