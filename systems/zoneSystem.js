class ZoneSystem {
    constructor() {
        this.zones = new Map();
        this.focusedZoneId = null;
        this.overviewMode = true;
        this.initialized = false;
        this.viewMode = 'focused-garden';
    }

    initialize(gridManagerInstance = null) {
        const configuredZones = gameConfig.world?.zones || [];
        this.overviewMode = !!gameConfig.world?.overviewMode;
        this.viewMode = this.overviewMode ? 'overview' : 'focused-garden';
        this.zones.clear();

        for (const zone of configuredZones) {
            this.zones.set(zone.id, {
                id: zone.id,
                label: zone.label,
                kind: zone.kind,
                poolAllowed: !!zone.poolAllowed,
                doorwayIds: [...(zone.doorwayIds || [])],
                adjacentZoneIds: [...(zone.adjacentZoneIds || [])],
                bounds: { ...(zone.bounds || {}) },
                renderProfile: { ...(zone.renderProfile || {}) },
                cells: []
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

    getZone(zoneId) {
        return this.zones.get(zoneId) || null;
    }

    getZones() {
        return Array.from(this.zones.values());
    }

    getFocusedZone() {
        return this.getZone(this.focusedZoneId);
    }

    getZoneAtGrid(gridX, gridY) {
        for (const zone of this.zones.values()) {
            const bounds = zone.bounds;
            if (!bounds) continue;
            if (gridX >= bounds.minX && gridX <= bounds.maxX && gridY >= bounds.minY && gridY <= bounds.maxY) {
                return zone;
            }
        }
        return null;
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
        return {
            focusedZoneId: this.focusedZoneId,
            overviewMode: this.overviewMode,
            viewMode: this.viewMode
        };
    }

    deserializeDurableState(serialized = {}) {
        const nextFocusedZoneId = serialized.focusedZoneId;
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
