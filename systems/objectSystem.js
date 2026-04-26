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
            carriedById: entity.carriedById || existing.carriedById || null,
            delivered: !!existing.delivered,
            consumed: !!existing.consumed,
            occupancyState: entity.objectProfile?.occupancyState || existing.occupancyState || metadata.occupancyState || 'normal',
            lifecycleStage: entity.objectProfile?.lifecycleStage || existing.lifecycleStage || metadata.lifecycleStage || null,
            resourceTags: [...(entity.objectProfile?.resourceTags || existing.resourceTags || metadata.resourceTags || [])],
            x: entity.x ?? existing.x ?? null,
            y: entity.y ?? existing.y ?? null,
            zoneId,
            interactionCount: existing.interactionCount || 0,
            lastInteractionType: existing.lastInteractionType || null,
            lastInteractionAt: existing.lastInteractionAt || 0,
            lastActorId: existing.lastActorId || null,
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

    recordInteraction(objectId, interactionType, actorId = null, metadata = {}) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        state.interactionCount = (state.interactionCount || 0) + 1;
        state.lastInteractionType = interactionType || 'interacted';
        state.lastInteractionAt = typeof frameCount === 'number' ? frameCount : Date.now();
        state.lastActorId = actorId || null;
        state.metadata = {
            ...(state.metadata || {}),
            ...metadata
        };
        return true;
    }

    getEntityInteractionSummary(actorId, gameState = gameCore?.gameState) {
        if (!actorId) return null;
        const interactions = Array.from(this.objectState.values())
            .filter(state => state.lastActorId === actorId || state.carriedById === actorId)
            .sort((left, right) => (right.lastInteractionAt || 0) - (left.lastInteractionAt || 0));

        const latest = interactions[0] || null;
        const counts = {
            touched: interactions.length,
            carried: interactions.filter(state => state.carriedById === actorId).length,
            flowers: interactions.filter(state => state.type === 'flower').length,
            blocks: interactions.filter(state => state.type === 'block').length
        };

        return {
            counts,
            latest,
            latestLabel: latest
                ? `${latest.lastInteractionType || 'interacted'} ${latest.type === 'flower' ? 'flower' : latest.subtype || latest.type}`
                : 'No recent object interaction',
            currentCarryLabel: counts.carried > 0
                ? `carrying ${counts.carried} object${counts.carried === 1 ? '' : 's'}`
                : 'hands free'
        };
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
        if (state.type === 'block') {
            state.metadata = {
                ...(state.metadata || {}),
                stackIndex: entity.stackIndex ?? 0,
                supportBlockId: entity.supportBlockId || null,
                lastPlacedMode: entity.lastPlacedMode || 'ground',
                supportState: entity.physics?.diagnostics?.supportState || null,
                occupancyBand: entity.physics?.diagnostics?.occupancyBand || null,
                stablePlacement: entity.physics?.diagnostics?.supportState !== 'unsupported'
            };
        }
        return state;
    }

    pickupObject(objectId, carrierId) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        if (state.carriedById && state.carriedById !== carrierId) {
            return false;
        }
        state.carriedById = carrierId;
        state.delivered = false;
        this.recordInteraction(objectId, 'picked up', carrierId);
        this.rebuildCarrierIndex(objectId, carrierId);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.OBJECT_PICKED_UP, {
                objectId,
                carrierId,
                sourceId: carrierId,
                objectType: state.type,
                subtype: state.subtype
            });
        }
        return true;
    }

    dropObject(objectId) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        const actorId = state.carriedById || null;
        state.carriedById = null;
        this.recordInteraction(objectId, 'dropped', actorId);
        this.rebuildCarrierIndex(objectId, null);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.OBJECT_DROPPED, {
                objectId,
                sourceId: actorId,
                objectType: state.type,
                subtype: state.subtype
            });
        }
        return true;
    }

    deliverObject(objectId, targetId = null) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        const actorId = state.carriedById || null;
        state.carriedById = null;
        state.delivered = true;
        state.metadata.lastDeliveredTo = targetId;
        this.recordInteraction(objectId, 'delivered', actorId, { lastDeliveredTo: targetId });
        this.rebuildCarrierIndex(objectId, null);
        if (typeof eventBus !== 'undefined' && GameEvents.OBJECT_DELIVERED) {
            eventBus.emit(GameEvents.OBJECT_DELIVERED, {
                objectId,
                targetId,
                sourceId: actorId,
                objectType: state.type,
                subtype: state.subtype
            });
        }
        return true;
    }

    consumeObject(objectId, consumerId = null) {
        const state = this.objectState.get(objectId);
        if (!state) return false;
        state.carriedById = null;
        state.consumed = true;
        state.metadata.lastConsumedBy = consumerId;
        this.recordInteraction(objectId, 'consumed', consumerId, { lastConsumedBy: consumerId });
        this.rebuildCarrierIndex(objectId, null);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.OBJECT_CONSUMED, {
                objectId,
                consumerId,
                sourceId: consumerId,
                objectType: state.type,
                subtype: state.subtype
            });
        }
        return true;
    }

    serializeDurableState() {
        const serialized = {};
        for (const [objectId, state] of this.objectState.entries()) {
            serialized[objectId] = {
                id: objectId,
                type: state.type || 'object',
                carriedById: state.carriedById || null,
                delivered: !!state.delivered,
                consumed: !!state.consumed,
                interactionCount: state.interactionCount || 0,
                lastInteractionType: state.lastInteractionType || null,
                lastInteractionAt: state.lastInteractionAt || 0,
                lastActorId: state.lastActorId || null,
                metadata: {
                    lastDeliveredTo: state.metadata?.lastDeliveredTo || null,
                    lastConsumedBy: state.metadata?.lastConsumedBy || null
                }
            };
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
        for (const block of gameState.blocks || []) {
            this.registerObject(block, { type: 'block', carryable: true });
            this.syncEntityProfile(block);
        }
    }
}

const objectSystem = new ObjectSystem();
