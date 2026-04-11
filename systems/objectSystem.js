class ObjectSystem {
    constructor() {
        this.objectState = new Map();
        this.objectsByCarrierId = new Map();
        this.initialized = false;
    }

    initialize() {
        this.initialized = true;
    }

    reset() {
        this.objectState.clear();
        this.objectsByCarrierId.clear();
    }

    registerObject(entity, metadata = {}) {
        if (!entity?.id) return null;
        const existing = this.objectState.get(entity.id) || {};
        const zoneId = typeof zoneSystem !== 'undefined' && entity.gridPos
            ? zoneSystem.getZoneAtGrid(entity.gridPos.x, entity.gridPos.y)?.id || null
            : null;
        const state = {
            id: entity.id,
            type: metadata.type || existing.type || entity.constructor?.name || 'object',
            subtype: entity.objectProfile?.subtype || existing.subtype || metadata.subtype || 'generic',
            carriedById: existing.carriedById || null,
            delivered: !!existing.delivered,
            consumed: !!existing.consumed,
            occupancyState: entity.objectProfile?.occupancyState || existing.occupancyState || metadata.occupancyState || 'normal',
            lifecycleStage: entity.objectProfile?.lifecycleStage || existing.lifecycleStage || metadata.lifecycleStage || null,
            resourceTags: [...(entity.objectProfile?.resourceTags || existing.resourceTags || metadata.resourceTags || [])],
            x: entity.x ?? existing.x ?? null,
            y: entity.y ?? existing.y ?? null,
            zoneId,
            metadata: {
                ...(existing.metadata || {}),
                ...metadata
            }
        };
        this.objectState.set(entity.id, state);
        this.rebuildCarrierIndex(entity.id, state.carriedById);
        return state;
    }

    unregisterObject(objectId) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        if (state.carriedById && this.objectsByCarrierId.has(state.carriedById)) {
            this.objectsByCarrierId.get(state.carriedById).delete(objectId);
            if (this.objectsByCarrierId.get(state.carriedById).size === 0) {
                this.objectsByCarrierId.delete(state.carriedById);
            }
        }
        this.objectState.delete(objectId);
        return true;
    }

    rebuildCarrierIndex(objectId, carrierId) {
        for (const [existingCarrierId, objectIds] of this.objectsByCarrierId.entries()) {
            objectIds.delete(objectId);
            if (objectIds.size === 0) {
                this.objectsByCarrierId.delete(existingCarrierId);
            }
        }

        if (!carrierId) return;
        if (!this.objectsByCarrierId.has(carrierId)) {
            this.objectsByCarrierId.set(carrierId, new Set());
        }
        this.objectsByCarrierId.get(carrierId).add(objectId);
    }

    getObjectState(objectId) {
        const state = this.objectState.get(objectId);
        return state ? JSON.parse(JSON.stringify(state)) : null;
    }

    getObjectsByCarrier(carrierId) {
        return Array.from(this.objectsByCarrierId.get(carrierId) || []);
    }

    getObjectsByType(type) {
        return Array.from(this.objectState.values())
            .filter(state => state.type === type)
            .map(state => JSON.parse(JSON.stringify(state)));
    }

    syncEntityProfile(entity) {
        if (!entity?.id || !this.objectState.has(entity.id)) return null;
        const state = this.objectState.get(entity.id);
        state.subtype = entity.objectProfile?.subtype || state.subtype;
        state.occupancyState = entity.objectProfile?.occupancyState || state.occupancyState;
        state.lifecycleStage = entity.objectProfile?.lifecycleStage || state.lifecycleStage;
        state.resourceTags = [...(entity.objectProfile?.resourceTags || state.resourceTags || [])];
        state.x = entity.x ?? state.x;
        state.y = entity.y ?? state.y;
        state.zoneId = typeof zoneSystem !== 'undefined' && entity.gridPos
            ? zoneSystem.getZoneAtGrid(entity.gridPos.x, entity.gridPos.y)?.id || null
            : state.zoneId;
        return state;
    }

    pickupObject(objectId, carrierId) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        state.carriedById = carrierId;
        state.delivered = false;
        this.rebuildCarrierIndex(objectId, carrierId);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.OBJECT_PICKED_UP, { objectId, carrierId });
        }
        return true;
    }

    dropObject(objectId) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        state.carriedById = null;
        this.rebuildCarrierIndex(objectId, null);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.OBJECT_DROPPED, { objectId });
        }
        return true;
    }

    deliverObject(objectId, targetId = null) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        state.carriedById = null;
        state.delivered = true;
        state.metadata.lastDeliveredTo = targetId;
        this.rebuildCarrierIndex(objectId, null);
        if (typeof eventBus !== 'undefined' && GameEvents.OBJECT_DELIVERED) {
            eventBus.emit(GameEvents.OBJECT_DELIVERED, { objectId, targetId });
        }
        return true;
    }

    consumeObject(objectId, consumerId = null) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        state.carriedById = null;
        state.consumed = true;
        state.metadata.lastConsumedBy = consumerId;
        this.rebuildCarrierIndex(objectId, null);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.OBJECT_CONSUMED, { objectId, consumerId });
        }
        return true;
    }

    serializeDurableState() {
        const serialized = {};
        for (const [objectId, state] of this.objectState.entries()) {
            serialized[objectId] = JSON.parse(JSON.stringify(state));
        }
        return serialized;
    }

    deserializeDurableState(serialized = {}) {
        this.reset();
        for (const [objectId, state] of Object.entries(serialized || {})) {
            this.objectState.set(objectId, JSON.parse(JSON.stringify(state)));
            this.rebuildCarrierIndex(objectId, state.carriedById || null);
        }
    }

    update(gameState) {
        for (const flower of gameState.flowers || []) {
            this.registerObject(flower, { type: 'flower', consumable: true });
            this.syncEntityProfile(flower);
        }
    }
}

const objectSystem = new ObjectSystem();
