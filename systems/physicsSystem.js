class PhysicsSystem {
    constructor() {
        this.initialized = false;
        this.entityStates = new Map();
        this.lastUpdateFrame = -1;
        this.lastContactResolutionFrame = -1;
        this.lastUpdateSummary = {
            butterflies: 0,
            caterpillars: 0,
            blocks: 0,
            total: 0,
            updateMs: 0,
            frameBudgetMs: 3.5
        };
    }

    initialize() {
        this.initialized = true;
    }

    reset() {
        this.entityStates.clear();
        this.lastUpdateFrame = -1;
        this.lastContactResolutionFrame = -1;
        this.lastUpdateSummary = {
            butterflies: 0,
            caterpillars: 0,
            blocks: 0,
            total: 0,
            updateMs: 0,
            frameBudgetMs: 3.5
        };
    }

    getBudgetTargets() {
        return {
            focusedGardenPhysicsMs: 3.5,
            focusedGardenTotalUpdateMs: 22
        };
    }

    getEntityMetrics(entity, entityType = 'entity') {
        if (typeof structureSystem !== 'undefined' && structureSystem?.getEntityMetrics) {
            return structureSystem.getEntityMetrics(entity, entityType);
        }
        const width = entityType === 'block'
            ? Math.max(entity?.renderWidth || 18, 12)
            : Math.max((entity?.size || 12) * 1.08, 10);
        const radius = entityType === 'block'
            ? Math.max(8, width * 0.42)
            : Math.max(7, width * 0.48);
        const clearance = entityType === 'block'
            ? Math.max(1, (entity?.stackIndex || 0) + 1)
            : Math.max(1, Math.round((entity?.size || 12) / 12));
        return {
            width,
            radius,
            clearance,
            occupancyRadius: Math.max(radius, width * 0.9),
            separationDistance: Math.max(11, width * 0.92)
        };
    }

    getSnapshot() {
        return {
            initialized: this.initialized,
            lastUpdateFrame: this.lastUpdateFrame,
            lastContactResolutionFrame: this.lastContactResolutionFrame,
            lastUpdateSummary: { ...this.lastUpdateSummary },
            budgetTargets: this.getBudgetTargets()
        };
    }

    createDefaultPhysicsState(entity, entityType = 'entity') {
        const defaultSpatial = structureSystem?.createDefaultSpatialContext?.() || {
            verticality: 'ground',
            structureRole: 'loose',
            pathState: 'open',
            bodyFit: 'canPass',
            occupancyBand: 'ground'
        };
        const metrics = this.getEntityMetrics(entity, entityType);
        const zLift = entityType === 'block' && typeof entity?.getVisualLift === 'function'
            ? entity.getVisualLift()
            : 0;

        return {
            entityType,
            position: {
                x: entity?.x || 0,
                y: entity?.y || 0,
                zLift
            },
            motion: {
                previous: {
                    x: entity?.x || 0,
                    y: (entity?.y || 0) + (entity?.shadowOffset || 0)
                },
                desired: {
                    x: entity?.x || 0,
                    y: (entity?.y || 0) + (entity?.shadowOffset || 0)
                },
                movedFrame: -1,
                source: null
            },
            velocity: { x: 0, y: 0 },
            intent: { x: 0, y: 0 },
            body: {
                width: metrics.width,
                radius: metrics.radius,
                clearance: metrics.clearance,
                liftBand: structureSystem?.normalizeOccupancyBand?.(zLift > 0 ? 'stacked' : 'ground')
                    || (zLift > 0 ? 'stacked' : 'ground')
            },
            contact: {
                blocked: false,
                blockedByIds: [],
                touchedButterflyIds: [],
                touchedBlockIds: [],
                insideShelter: false,
                openingTransition: false
            },
            impulse: {
                x: 0,
                y: 0,
                frames: 0,
                source: null
            },
            carry: {
                attachedObjectId: null,
                anchor: null
            },
            diagnostics: {
                pathState: defaultSpatial.pathState,
                structureRole: defaultSpatial.structureRole,
                verticality: defaultSpatial.verticality,
                bodyFit: defaultSpatial.bodyFit,
                occupancyBand: defaultSpatial.occupancyBand || defaultSpatial.verticality,
                supportState: entityType === 'block' ? 'grounded' : null,
                stackHeight: entityType === 'block' ? Math.max(1, (entity?.stackIndex || 0) + 1) : 0,
                supportBlockId: entityType === 'block' ? (entity?.supportBlockId || null) : null,
                motionOwner: 'physicsSystem',
                lastMotionSource: null,
                lastResolvedFrame: typeof frameCount === 'number' ? frameCount : 0
            }
        };
    }

    ensurePhysicsContainer(entity, entityType = 'entity') {
        if (!entity?.id) return null;
        const existing = entity.physics && typeof entity.physics === 'object'
            ? entity.physics
            : this.createDefaultPhysicsState(entity, entityType);
        existing.entityType = entityType;
        existing.position = existing.position || { x: entity.x || 0, y: entity.y || 0, zLift: 0 };
        existing.motion = existing.motion || {
            previous: {
                x: entity?.x || 0,
                y: (entity?.y || 0) + (entity?.shadowOffset || 0)
            },
            desired: {
                x: entity?.x || 0,
                y: (entity?.y || 0) + (entity?.shadowOffset || 0)
            },
            movedFrame: -1,
            source: null
        };
        existing.velocity = existing.velocity || { x: 0, y: 0 };
        existing.intent = existing.intent || { x: 0, y: 0 };
        existing.body = existing.body || {};
        existing.contact = existing.contact || {};
        existing.impulse = existing.impulse || { x: 0, y: 0, frames: 0, source: null };
        existing.carry = existing.carry || { attachedObjectId: null, anchor: null };
        existing.diagnostics = existing.diagnostics || {};
        existing.diagnostics.motionOwner = existing.diagnostics.motionOwner || 'physicsSystem';
        existing.diagnostics.lastMotionSource = existing.diagnostics.lastMotionSource || null;
        entity.physics = existing;
        return existing;
    }

    registerEntity(entity, entityType = 'entity') {
        if (!entity?.id) return null;
        const physics = this.ensurePhysicsContainer(entity, entityType);
        this.entityStates.set(entity.id, {
            id: entity.id,
            entityType,
            physics
        });
        return physics;
    }

    unregisterEntity(entityId) {
        if (!entityId) return;
        this.entityStates.delete(entityId);
    }

    getEntityState(entityId) {
        const state = this.entityStates.get(entityId);
        return state?.physics || null;
    }

    getEntityById(entityId, sceneState = gameCore?.gameState) {
        if (!entityId || !sceneState) return null;
        const buckets = [
            sceneState?.butterflies || [],
            sceneState?.blocks || [],
            sceneState?.caterpillars || [],
            sceneState?.flowers || []
        ];
        for (const bucket of buckets) {
            const match = bucket.find(entity => entity?.id === entityId);
            if (match) return match;
        }
        return null;
    }

    getEntityDisplayLabel(entity) {
        if (!entity) return 'Entity';
        if (typeof entity.displayName === 'string' && entity.displayName.trim()) {
            return entity.displayName.trim();
        }
        if (typeof entity.personalityType === 'string' && entity.personalityType.trim()) {
            return entity.personalityType.trim();
        }
        if (typeof entity.objectType === 'string' && entity.objectType.trim()) {
            return entity.objectType.trim();
        }
        if (typeof entity.birthSource === 'string' && entity.birthSource.trim()) {
            return entity.birthSource.trim();
        }
        if (typeof entity.type === 'string' && entity.type.trim()) {
            return entity.type.trim();
        }
        return entity.constructor?.name || 'Entity';
    }

    getEntitySpatialSummary(entityOrId, sceneState = gameCore?.gameState) {
        const entity = typeof entityOrId === 'string'
            ? this.getEntityById(entityOrId, sceneState)
            : entityOrId;
        if (!entity?.id) return null;

        const physics = this.getEntityState(entity.id) || entity.physics || null;
        if (!physics) return null;

        const diagnostics = physics.diagnostics || {};
        const contact = physics.contact || {};
        const carry = physics.carry || {};
        const entityType = physics.entityType || entity.objectType || entity.type || 'entity';
        const zoneId = this.resolveZoneId(entity, sceneState?.focusedZoneId || null);
        const zoneLabel = zoneSystem?.getZoneById?.(zoneId)?.label || zoneId || 'unknown';
        const occupancyBand = structureSystem?.normalizeOccupancyBand?.(
            diagnostics.occupancyBand
            || diagnostics.verticality
            || physics.body?.liftBand
            || 'ground'
        ) || diagnostics.occupancyBand || diagnostics.verticality || physics.body?.liftBand || 'ground';
        const structureRole = diagnostics.structureRole || 'loose';
        const pathState = diagnostics.pathState || 'open';
        const bodyFit = diagnostics.bodyFit || 'canPass';
        const verticality = diagnostics.verticality || occupancyBand;
        const supportState = entityType === 'block'
            ? (diagnostics.supportState || 'grounded')
            : null;
        const stackHeight = entityType === 'block'
            ? Math.max(1, diagnostics.stackHeight || ((entity?.stackIndex || 0) + 1))
            : 0;
        const maxStackHeight = entityType === 'block'
            ? (structureSystem?.getMaxStackHeight?.() || 3)
            : 0;
        const touchedButterflyIds = [...(contact.touchedButterflyIds || [])];
        const touchedBlockIds = [...(contact.touchedBlockIds || [])];
        const blockedByIds = [...(contact.blockedByIds || [])];
        const touchCount = touchedButterflyIds.length + touchedBlockIds.length;
        const blockedByCount = blockedByIds.length;
        const contactStateLabel = contact.insideShelter
            ? 'inside shelter'
            : contact.openingTransition
                ? 'opening edge'
                : 'open air';
        const detailTail = entityType === 'block'
            ? `${supportState || 'grounded'} | stack ${stackHeight}/${maxStackHeight}`
            : carry.attachedObjectId
                ? 'material in tow'
                : 'hands free';

        return {
            id: entity.id,
            entity,
            entityType,
            displayName: this.getEntityDisplayLabel(entity),
            zoneId,
            zoneLabel,
            x: entity.x || 0,
            y: entity.y || 0,
            groundPoint: this.getEntityGroundPoint(entity),
            occupancyBand,
            verticality,
            structureRole,
            pathState,
            bodyFit,
            supportState,
            stackHeight,
            maxStackHeight,
            supportBlockId: diagnostics.supportBlockId || entity?.supportBlockId || null,
            contact: {
                blocked: !!contact.blocked,
                insideShelter: !!contact.insideShelter,
                openingTransition: !!contact.openingTransition,
                blockedByIds,
                blockedByCount,
                touchedButterflyIds,
                touchedBlockIds,
                touchCount,
                contactStateLabel
            },
            carry: {
                attachedObjectId: carry.attachedObjectId || null,
                anchor: carry.anchor ? { ...carry.anchor } : null
            },
            headline: `${occupancyBand} | ${structureRole} | ${pathState} | ${bodyFit}`,
            detail: `${contactStateLabel} | ${contact.blocked ? `blocked ${blockedByCount || 1}` : `touch ${touchCount}`} | ${detailTail}`
        };
    }

    clearContactState(physics) {
        if (!physics?.contact) return;
        physics.contact.blocked = false;
        physics.contact.blockedByIds = [];
        physics.contact.touchedButterflyIds = [];
        physics.contact.touchedBlockIds = [];
        physics.contact.insideShelter = false;
        physics.contact.openingTransition = false;
    }

    addUniqueContactId(list = [], value = null) {
        if (!value) return list;
        if (!Array.isArray(list)) return [value];
        if (!list.includes(value)) {
            list.push(value);
        }
        return list;
    }

    buildDeterministicFallbackNormal(leftId, rightId) {
        const source = `${leftId || 'left'}|${rightId || 'right'}`;
        let hash = 0;
        for (let index = 0; index < source.length; index += 1) {
            hash = ((hash * 31) + source.charCodeAt(index)) >>> 0;
        }
        const angle = (hash % 360) * (Math.PI / 180);
        return {
            x: Math.cos(angle) || 1,
            y: Math.sin(angle) || 0
        };
    }

    resolveZoneId(entity, fallback = null) {
        return gameCore?.getEntityZoneId?.(entity, null)
            || entity?.currentZoneId
            || entity?.lifeSim?.lifecycle?.currentZoneId
            || fallback
            || null;
    }

    clampEntityToZone(entity, zoneId = null) {
        if (!entity) return;
        const resolvedZoneId = this.resolveZoneId(entity, zoneId);
        const clamped = gameCore?.clampScreenPointToRoamArea?.(
            entity.x,
            (entity.y || 0) + (entity.shadowOffset || 0),
            8,
            resolvedZoneId ? { zoneId: resolvedZoneId } : {}
        ) || null;
        if (!clamped) return;
        entity.x = clamped.x;
        entity.y = clamped.y - (entity.shadowOffset || 0);
        entity.gridPos = gridManager?.screenToIso?.(entity.x, entity.y + (entity.shadowOffset || 0)) || entity.gridPos;
        entity.updateZIndex?.();
    }

    getEntityGroundPoint(entity) {
        return {
            x: entity?.x || 0,
            y: (entity?.y || 0) + (entity?.shadowOffset || 0)
        };
    }

    setEntityGroundPoint(entity, point) {
        if (!entity || !point) return;
        entity.x = point.x;
        entity.y = point.y - (entity.shadowOffset || 0);
        entity.gridPos = gridManager?.screenToIso?.(entity.x, entity.y + (entity.shadowOffset || 0)) || entity.gridPos;
        entity.updateZIndex?.();
    }

    clampGroundPointToZone(point, zoneId = null, options = {}) {
        if (!point) return null;
        return gameCore?.clampScreenPointToRoamArea?.(
            point.x,
            point.y,
            8,
            {
                ...(zoneId ? { zoneId } : {}),
                ...options
            }
        ) || { ...point };
    }

    isGroundPointBlockedForButterfly(entity, point, options = {}) {
        if (!entity || !point) return false;
        return !!structureSystem?.isPointBlockedForEntity?.(
            point.x,
            point.y,
            entity,
            options
        );
    }

    getStructureQueryForEntity(entity, point = null, options = {}) {
        if (!entity) return null;
        const targetPoint = point || this.getEntityGroundPoint(entity);
        if (!targetPoint) return null;
        const zoneId = this.resolveZoneId(entity, options.zoneId || null);
        if (!zoneId) return null;
        return structureSystem?.queryCollisionGeometry?.(zoneId, targetPoint, {
            entity,
            fromX: options.fromX,
            fromY: options.fromY,
            corridorMargin: options.corridorMargin,
            occupancyRadius: options.occupancyRadius
        }) || null;
    }

    pushSlideCandidate(candidates, seen, point, priority = 0) {
        if (!point) return;
        const key = `${Math.round(point.x * 10)}:${Math.round(point.y * 10)}:${priority}`;
        if (seen.has(key)) return;
        seen.add(key);
        candidates.push({ point, priority });
    }

    getCarriedBlockForButterfly(sceneState, butterfly) {
        if (!sceneState || !butterfly?.id) return null;
        const blocks = sceneState.blocks || [];
        const candidateIds = new Set();
        const localCarryId = butterfly.blockInteraction?.carryingBlockId || null;
        if (localCarryId) {
            candidateIds.add(localCarryId);
        }

        const indexedCarryIds = objectSystem?.getObjectsByCarrier?.(butterfly.id) || [];
        for (const objectId of indexedCarryIds) {
            if (objectId) {
                candidateIds.add(objectId);
            }
        }

        const carriedBlock = blocks.find(block => candidateIds.has(block?.id))
            || blocks.find(block => block?.carriedById === butterfly.id)
            || null;

        if (carriedBlock?.id && butterfly.blockInteraction?.carryingBlockId !== carriedBlock.id) {
            butterfly.blockInteraction.carryingBlockId = carriedBlock.id;
        }

        return carriedBlock;
    }

    applyImpulse(entity, options = {}) {
        if (!entity?.id) return false;
        const entityType = options.entityType || entity.physics?.entityType || 'butterfly';
        const physics = this.getEntityState(entity.id) || this.registerEntity(entity, entityType);
        if (!physics?.impulse) return false;

        const nextX = (physics.impulse.x || 0) + (options.x || 0);
        const nextY = (physics.impulse.y || 0) + (options.y || 0);
        const maxMagnitude = Math.max(0.5, options.maxMagnitude || 6);
        const magnitude = Math.hypot(nextX, nextY);
        if (magnitude > maxMagnitude) {
            const scale = maxMagnitude / magnitude;
            physics.impulse.x = nextX * scale;
            physics.impulse.y = nextY * scale;
        } else {
            physics.impulse.x = nextX;
            physics.impulse.y = nextY;
        }

        physics.impulse.frames = Math.max(
            physics.impulse.frames || 0,
            Math.max(1, Math.round(options.frames || 1))
        );
        physics.impulse.source = options.source || physics.impulse.source || null;
        physics.diagnostics.lastResolvedFrame = typeof frameCount === 'number' ? frameCount : physics.diagnostics.lastResolvedFrame;
        return true;
    }

    applyCarriedBlockAnchor(butterfly, block, groundPoint = this.getEntityGroundPoint(butterfly)) {
        if (!butterfly || !block) return null;
        const anchor = structureSystem?.getCarryAnchorForGroundPoint?.(butterfly, block, groundPoint)
            || structureSystem?.getCarryAnchorForEntity?.(butterfly, block)
            || null;
        if (!anchor) return null;
        block.carriedById = butterfly.id;
        block.currentZoneId = butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || block.currentZoneId;
        block.x = anchor.x;
        block.y = anchor.y;
        block.gridPos = gridManager?.screenToIso?.(block.x, block.y) || block.gridPos;
        block.zIndex = (butterfly.zIndex || 0) + (anchor.zLift ?? 18);
        const blockPhysics = this.getEntityState(block.id) || this.registerEntity(block, 'block');
        if (blockPhysics) {
            blockPhysics.position.x = block.x;
            blockPhysics.position.y = block.y;
            blockPhysics.position.zLift = anchor.zLift ?? blockPhysics.position.zLift;
            blockPhysics.carry.anchor = { ...anchor };
            blockPhysics.carry.attachedObjectId = butterfly.id;
            blockPhysics.diagnostics.supportState = 'carried';
            blockPhysics.diagnostics.occupancyBand = 'overhead';
            blockPhysics.diagnostics.stackHeight = 1;
            blockPhysics.diagnostics.supportBlockId = null;
        }
        const butterflyPhysics = this.getEntityState(butterfly.id) || this.registerEntity(butterfly, 'butterfly');
        if (butterflyPhysics) {
            butterflyPhysics.carry.attachedObjectId = block.id;
            butterflyPhysics.carry.anchor = { ...anchor };
        }
        block.syncPlacementProfile?.({ supportState: 'carried' });
        objectSystem?.syncEntityProfile?.(block);
        return anchor;
    }

    getBlockSupportContext(block, sceneState = gameCore?.gameState) {
        if (!block) return null;
        const zoneId = block.currentZoneId || null;
        const zoneBlocks = zoneId
            ? ((sceneState?.blocks || []).filter(entry => (entry?.currentZoneId || null) === zoneId))
            : (sceneState?.blocks || []);
        return structureSystem?.getBlockSupportContext?.(block, zoneBlocks) || null;
    }

    describeBlockPlacementTarget(butterfly, block, placement, sceneState = gameCore?.gameState) {
        if (!block || !placement) return null;
        const zoneId = placement.zoneId
            || block.currentZoneId
            || butterfly?.currentZoneId
            || butterfly?.lifeSim?.lifecycle?.currentZoneId
            || null;
        if (!zoneId) return null;

        const zoneBlocks = (sceneState?.blocks || []).filter(entry =>
            entry
            && entry.id !== block.id
            && (entry.currentZoneId || null) === zoneId
        );
        const actor = butterfly || {
            id: 'physics-placement-probe',
            x: placement.x,
            y: placement.y,
            currentZoneId: zoneId,
            lifeSim: {
                lifecycle: {
                    currentZoneId: zoneId
                }
            }
        };
        if (!structureSystem?.validatePlacementTargetForBlock?.(actor, block, placement, zoneBlocks)) {
            return null;
        }

        const zoneProfile = structureSystem?.getZoneProfileRef?.(zoneId) || null;
        const point = { x: placement.x, y: placement.y };
        const component = zoneProfile
            ? (zoneProfile.components.find(entry => entry.id === placement.componentId)
                || zoneProfile.components.find(entry => entry.id === placement.supportComponentId)
                || structureSystem?.getNearestComponentForPoint?.(zoneProfile, point)
                || null)
            : null;
        const blockMetrics = this.getEntityMetrics(block, 'block');
        const column = component
            ? structureSystem?.getNearestOccupancyColumn?.(
                component,
                point,
                Math.max(blockMetrics.width, 18) * 0.62
            ) || null
            : null;
        const stackIndex = Math.max(0, placement.stackIndex ?? 0);
        const supportContext = {
            zoneId,
            componentId: component?.id || placement.componentId || placement.supportComponentId || null,
            columnId: column?.id || null,
            supportState: stackIndex > 0 ? 'supported' : 'grounded',
            stable: true,
            occupancyBand: structureSystem?.normalizeOccupancyBand?.(stackIndex > 0 ? 'stacked' : 'ground')
                || (stackIndex > 0 ? 'stacked' : 'ground'),
            stackIndex,
            stackHeight: Math.max(1, stackIndex + 1),
            maxStackHeight: structureSystem?.getMaxStackHeight?.() || 3,
            supportBlockId: placement.supportBlockId || null,
            supportBlockStackIndex: stackIndex > 0 ? Math.max(0, stackIndex - 1) : null,
            placementMode: placement.placementMode || (stackIndex > 0 ? 'stacked' : 'ground'),
            openingConflict: component
                ? !!structureSystem?.pointConflictsWithOpening?.(
                    component,
                    point,
                    Math.max(blockMetrics.width, 18) * 0.92
                )
                : false
        };

        return {
            ...placement,
            zoneId,
            componentId: supportContext.componentId,
            supportComponentId: placement.supportComponentId || supportContext.componentId,
            supportContext
        };
    }

    resolveBlockPlacementRequest(butterfly, block, requestedPlacement = null, candidateBlocks = [], options = {}) {
        if (!block) return null;
        const sceneState = options.sceneState || gameCore?.gameState;
        const zoneId = block.currentZoneId
            || butterfly?.currentZoneId
            || butterfly?.lifeSim?.lifecycle?.currentZoneId
            || requestedPlacement?.zoneId
            || null;
        const zoneBlocks = (Array.isArray(candidateBlocks) && candidateBlocks.length > 0)
            ? candidateBlocks.filter(entry => entry && (entry.currentZoneId || null) === zoneId)
            : ((sceneState?.blocks || []).filter(entry => entry && (entry.currentZoneId || null) === zoneId));

        if (requestedPlacement) {
            const describedRequested = this.describeBlockPlacementTarget(
                butterfly,
                block,
                requestedPlacement,
                sceneState
            );
            if (describedRequested) {
                return describedRequested;
            }
        }

        const placementActor = butterfly || {
            id: 'physics-placement-fallback',
            x: block.x || 0,
            y: (block.y || 0) + 4,
            currentZoneId: zoneId,
            lifeSim: {
                lifecycle: {
                    currentZoneId: zoneId
                }
            }
        };
        let fallbackPlacement = options.safeDrop
            ? structureSystem?.findSafeDropPlacementForBlock?.(placementActor, block, zoneBlocks)
            : structureSystem?.findPlacementTargetForBlock?.(placementActor, block, zoneBlocks);
        if (!fallbackPlacement && !options.safeDrop) {
            fallbackPlacement = structureSystem?.findSafeDropPlacementForBlock?.(placementActor, block, zoneBlocks) || null;
        }
        if (!fallbackPlacement) {
            return null;
        }

        return this.describeBlockPlacementTarget(
            placementActor,
            block,
            fallbackPlacement,
            sceneState
        );
    }

    applyResolvedBlockPlacement(block, placement, actorId = null, sceneState = gameCore?.gameState) {
        if (!block || !placement) return false;
        const relocationResult = gameCore?.relocateFlowersForBlockPlacement?.(
            actorId
                ? ((sceneState?.butterflies || []).find(entry => entry?.id === actorId) || null)
                : null,
            placement.zoneId || block.currentZoneId || null,
            { x: placement.x, y: placement.y },
            block
        ) || { moved: true, failedFlowerIds: [] };
        if (!relocationResult.moved) {
            return false;
        }
        const actorState = actorId ? objectSystem?.getObjectsByCarrier?.(actorId) || [] : [];
        if (block.carriedById || objectSystem?.getObjectState?.(block.id)?.carriedById) {
            objectSystem?.dropObject?.(block.id);
        }

        block.placeAt?.(placement.x, placement.y, {
            movedById: actorId,
            stackIndex: placement.stackIndex ?? 0,
            supportBlockId: placement.supportBlockId || null,
            placementMode: placement.placementMode || 'ground',
            zoneId: placement.zoneId || block.currentZoneId || null
        });
        block.syncPlacementProfile?.(placement.supportContext || null);

        structureSystem?.update?.(sceneState, 0);
        objectSystem?.update?.(sceneState);

        const blockPhysics = this.refreshPhysicsState(block, 'block', sceneState, { resetContacts: false });
        if (blockPhysics) {
            blockPhysics.carry.attachedObjectId = null;
            blockPhysics.carry.anchor = null;
        }
        objectSystem?.syncEntityProfile?.(block);

        if (actorId) {
            const actor = (sceneState?.butterflies || []).find(entry => entry?.id === actorId) || null;
            const actorPhysics = actor ? this.getEntityState(actor.id) || this.registerEntity(actor, 'butterfly') : null;
            if (actorPhysics && actorState.includes(block.id)) {
                actorPhysics.carry.attachedObjectId = actor?.blockInteraction?.carryingBlockId === block.id
                    ? null
                    : (actor?.blockInteraction?.carryingBlockId || null);
                actorPhysics.carry.anchor = null;
            }
        }

        return true;
    }

    reconcileUnsupportedBlocks(gameState = gameCore?.gameState) {
        if (!gameState?.blocks?.length) return;
        let movedAny = false;

        for (const block of gameState.blocks) {
            if (!block) continue;
            const supportContext = this.getBlockSupportContext(block, gameState) || null;
            if (supportContext) {
                block.syncPlacementProfile?.(supportContext);
            }

            if (supportContext?.supportState !== 'unsupported') {
                continue;
            }

            const safePlacement = this.resolveBlockPlacementRequest(
                null,
                block,
                null,
                gameState.blocks,
                {
                    sceneState: gameState,
                    safeDrop: true
                }
            );
            if (!safePlacement) continue;
            if (safePlacement.x === block.x && safePlacement.y === block.y && (safePlacement.stackIndex ?? 0) === (block.stackIndex ?? 0)) {
                continue;
            }
            const applied = this.applyResolvedBlockPlacement(block, safePlacement, block.lastMovedById || null, gameState);
            movedAny = movedAny || applied;
        }

        if (movedAny) {
            structureSystem?.update?.(gameState, 0);
            objectSystem?.update?.(gameState);
        }
    }

    isCarrySafeAtGroundPoint(entity, groundPoint, carriedBlock, zoneId) {
        if (!entity || !carriedBlock || !groundPoint) {
            return { safe: true, anchor: null };
        }
        const result = structureSystem?.isCarryAnchorBlockedForEntity?.(entity, carriedBlock, groundPoint, {
            zoneId,
            fromX: carriedBlock.x,
            fromY: carriedBlock.y
        }) || { blocked: false, anchor: null };
        return {
            safe: !result.blocked,
            anchor: result.anchor || null
        };
    }

    findStructureSlidePoint(entity, fromPoint, desiredPoint, zoneId, options = {}) {
        if (!entity || !fromPoint || !desiredPoint) return null;
        const carriedBlock = options.carriedBlock || null;
        const clampOptions = options.clampOptions || {};
        const clampedDesired = this.clampGroundPointToZone(desiredPoint, zoneId, clampOptions);
        const blockCheck = point => {
            const butterflyBlocked = this.isGroundPointBlockedForButterfly(entity, point, {
                zoneId,
                fromX: fromPoint.x,
                fromY: fromPoint.y
            });
            if (butterflyBlocked) return false;
            const carryState = this.isCarrySafeAtGroundPoint(entity, point, carriedBlock, zoneId);
            return carryState.safe;
        };

        if (blockCheck(clampedDesired)) {
            return {
                point: clampedDesired,
                resolution: 'direct',
                anchor: this.isCarrySafeAtGroundPoint(entity, clampedDesired, carriedBlock, zoneId).anchor || null
            };
        }

        const dx = clampedDesired.x - fromPoint.x;
        const dy = clampedDesired.y - fromPoint.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= 0.001) {
            return {
                point: this.clampGroundPointToZone(fromPoint, zoneId),
                resolution: 'stop'
            };
        }

        const dirX = dx / distance;
        const dirY = dy / distance;
        const tangentA = { x: -dirY, y: dirX };
        const tangentB = { x: dirY, y: -dirX };
        const candidates = [];
        const seen = new Set();

        this.pushSlideCandidate(candidates, seen, { x: clampedDesired.x, y: fromPoint.y }, 1);
        this.pushSlideCandidate(candidates, seen, { x: fromPoint.x, y: clampedDesired.y }, 1);

        for (const forwardFraction of [0.85, 0.66, 0.5, 0.33, 0.16]) {
            this.pushSlideCandidate(candidates, seen, {
                x: fromPoint.x + (dx * forwardFraction),
                y: fromPoint.y + (dy * forwardFraction)
            }, 2);
        }

        for (const tangent of [tangentA, tangentB]) {
            for (const slideFraction of [1, 0.82, 0.66, 0.5, 0.33]) {
                this.pushSlideCandidate(candidates, seen, {
                    x: fromPoint.x + (tangent.x * distance * slideFraction),
                    y: fromPoint.y + (tangent.y * distance * slideFraction)
                }, 3);
            }
            for (const slideFraction of [0.82, 0.66, 0.5]) {
                for (const forwardFraction of [0.4, 0.2]) {
                    this.pushSlideCandidate(candidates, seen, {
                        x: fromPoint.x + (dx * forwardFraction) + (tangent.x * distance * slideFraction),
                        y: fromPoint.y + (dy * forwardFraction) + (tangent.y * distance * slideFraction)
                    }, 4);
                }
            }
        }

        for (const candidate of candidates) {
            const clamped = this.clampGroundPointToZone(candidate.point, zoneId, clampOptions);
            if (!blockCheck(clamped)) continue;
            return {
                point: clamped,
                resolution: candidate.priority <= 2 ? 'reduced' : 'slide',
                anchor: this.isCarrySafeAtGroundPoint(entity, clamped, carriedBlock, zoneId).anchor || null
            };
        }

        return {
            point: this.clampGroundPointToZone(fromPoint, zoneId),
            resolution: 'stop',
            anchor: this.isCarrySafeAtGroundPoint(entity, this.clampGroundPointToZone(fromPoint, zoneId), carriedBlock, zoneId).anchor || null
        };
    }

    resolveButterflyMotionIntent(entity, options = {}) {
        if (!this.initialized || !entity?.id) return null;

        const sceneState = options.gameState || gameCore?.gameState;
        const physics = this.getEntityState(entity.id) || this.registerEntity(entity, 'butterfly');
        if (!physics) return null;

        const activeFrame = typeof frameCount === 'number' ? frameCount : -1;
        const zoneId = this.resolveZoneId(entity, options.zoneId || null);
        const fromPoint = options.fromPoint || this.getEntityGroundPoint(entity);
        const carriedBlock = options.carriedBlock || this.getCarriedBlockForButterfly(sceneState, entity);
        const source = options.source || 'movement';
        const candidateGroundPoints = Array.isArray(options.candidateGroundPoints)
            ? options.candidateGroundPoints.filter(candidate => Number.isFinite(candidate?.x) && Number.isFinite(candidate?.y))
            : [];

        let resolvedMove = null;
        for (const candidate of candidateGroundPoints) {
            const clampOptions = { allowDoorways: !!candidate.allowDoorways };
            const desiredPoint = this.clampGroundPointToZone(candidate, zoneId, clampOptions);
            if (!desiredPoint) continue;
            const resolved = this.findStructureSlidePoint(entity, fromPoint, desiredPoint, zoneId, {
                carriedBlock,
                clampOptions
            });
            if (!resolved?.point) continue;

            const intendedDistance = Math.hypot(desiredPoint.x - fromPoint.x, desiredPoint.y - fromPoint.y);
            const resolvedDistance = Math.hypot(resolved.point.x - fromPoint.x, resolved.point.y - fromPoint.y);
            if (intendedDistance > 0.25 && resolved.resolution === 'stop' && resolvedDistance < 0.05) {
                continue;
            }

            resolvedMove = {
                point: resolved.point,
                resolution: resolved.resolution,
                anchor: resolved.anchor || null
            };
            break;
        }

        physics.motion.previous.x = fromPoint.x;
        physics.motion.previous.y = fromPoint.y;
        physics.motion.source = source;
        physics.motion.movedFrame = activeFrame;
        physics.diagnostics.motionOwner = 'physicsSystem';
        physics.diagnostics.lastMotionSource = source;
        physics.diagnostics.lastResolvedFrame = activeFrame;

        if (!resolvedMove?.point) {
            physics.motion.desired.x = fromPoint.x;
            physics.motion.desired.y = fromPoint.y;
            physics.velocity.x = 0;
            physics.velocity.y = 0;
            physics.intent.x = 0;
            physics.intent.y = 0;
            physics.contact.blocked = true;
            physics.diagnostics.pathState = 'obstructed';
            return {
                point: { ...fromPoint },
                resolution: 'stop',
                moved: false
            };
        }

        this.setEntityGroundPoint(entity, resolvedMove.point);
        physics.motion.desired.x = resolvedMove.point.x;
        physics.motion.desired.y = resolvedMove.point.y;
        physics.velocity.x = resolvedMove.point.x - fromPoint.x;
        physics.velocity.y = resolvedMove.point.y - fromPoint.y;
        physics.intent.x = resolvedMove.point.x - fromPoint.x;
        physics.intent.y = resolvedMove.point.y - fromPoint.y;
        physics.position.x = entity.x || 0;
        physics.position.y = entity.y || 0;
        physics.contact.blocked = resolvedMove.resolution !== 'direct' && resolvedMove.resolution !== 'reduced';
        physics.diagnostics.pathState = resolvedMove.resolution === 'slide'
            ? 'enterable'
            : resolvedMove.resolution === 'stop'
                ? 'obstructed'
                : 'open';

        if (physics.contact.blocked) {
            const structureQuery = this.getStructureQueryForEntity(entity, resolvedMove.point, {
                zoneId,
                fromX: fromPoint.x,
                fromY: fromPoint.y
            });
            const nearestComponentId = entity.lifeSim?.spatialAwareness?.nearestComponentId
                || structureQuery?.nearestComponentId
                || structureSystem?.getSpatialContextForEntity?.(entity, sceneState)?.nearestComponentId
                || null;
            if (nearestComponentId) {
                this.addUniqueContactId(physics.contact.blockedByIds, `structure:${nearestComponentId}`);
            } else {
                this.addUniqueContactId(physics.contact.blockedByIds, 'structure');
            }
        }

        if (carriedBlock) {
            const anchor = this.applyCarriedBlockAnchor(entity, carriedBlock, resolvedMove.point) || resolvedMove.anchor;
            if (anchor) {
                physics.carry.anchor = { ...anchor };
                physics.carry.attachedObjectId = carriedBlock.id;
            }
        }

        return {
            point: { ...resolvedMove.point },
            resolution: resolvedMove.resolution,
            moved: Math.hypot(physics.velocity.x || 0, physics.velocity.y || 0) > 0.01
        };
    }

    refreshPhysicsState(entity, entityType = 'entity', gameState = gameCore?.gameState, options = {}) {
        const physics = this.ensurePhysicsContainer(entity, entityType);
        if (!physics) return null;

        const metrics = this.getEntityMetrics(entity, entityType);
        const spatial = (entityType === 'butterfly' || entityType === 'caterpillar')
            ? structureSystem?.getSpatialContextForEntity?.(entity, gameState)
            : null;
        const blockSupport = entityType === 'block'
            ? this.getBlockSupportContext(entity, gameState)
            : null;

        const zLift = entityType === 'block' && typeof entity?.getVisualLift === 'function'
            ? entity.getVisualLift()
            : 0;
        const existingCarryAnchor = physics.carry?.anchor
            ? { ...physics.carry.anchor }
            : null;
        physics.position.x = entity?.x || 0;
        physics.position.y = entity?.y || 0;
        physics.position.zLift = zLift;
        physics.body.width = metrics.width;
        physics.body.radius = metrics.radius;
        physics.body.clearance = metrics.clearance;
        physics.body.liftBand = entityType === 'block'
            ? (blockSupport?.occupancyBand
                || structureSystem?.normalizeOccupancyBand?.(zLift > 0 ? 'stacked' : 'ground')
                || (zLift > 0 ? 'stacked' : 'ground'))
            : (spatial?.occupancyBand
                || structureSystem?.normalizeOccupancyBand?.(spatial?.verticality)
                || structureSystem?.normalizeOccupancyBand?.(zLift > 0 ? 'stacked' : 'ground')
                || (zLift > 0 ? 'stacked' : 'ground'));
        if (options.resetContacts !== false) {
            this.clearContactState(physics);
        }
        physics.contact.insideShelter = entityType === 'block'
            ? false
            : !!spatial?.insideShelter;
        physics.contact.openingTransition = entityType === 'block'
            ? false
            : spatial?.structureRole === 'opening';
        physics.carry.attachedObjectId = entityType === 'butterfly'
            ? (entity?.blockInteraction?.carryingBlockId || null)
            : entityType === 'block' && entity?.carriedById
                ? (entity?.carriedById || null)
                : null;
        physics.carry.anchor = entityType === 'block' && entity?.carriedById
            ? existingCarryAnchor
            : entityType === 'butterfly' && entity?.blockInteraction?.carryingBlockId
                ? existingCarryAnchor
                : null;
        physics.diagnostics.pathState = entityType === 'block'
            ? (blockSupport?.stable === false ? 'obstructed' : 'open')
            : (structureSystem?.normalizeSpatialHookValue?.('pathState', spatial?.pathState) || spatial?.pathState || 'open');
        physics.diagnostics.structureRole = entityType === 'block'
            ? ((blockSupport?.stackIndex || 0) > 0 ? 'wall' : 'loose')
            : (structureSystem?.normalizeSpatialHookValue?.('structureRole', spatial?.structureRole) || spatial?.structureRole || 'loose');
        physics.diagnostics.verticality = entityType === 'block'
            ? (blockSupport?.occupancyBand || physics.body.liftBand || 'ground')
            : (structureSystem?.normalizeSpatialHookValue?.('verticality', spatial?.verticality) || spatial?.verticality || physics.body.liftBand || 'ground');
        physics.diagnostics.bodyFit = entityType === 'block'
            ? 'canPass'
            : (structureSystem?.normalizeSpatialHookValue?.('bodyFit', spatial?.bodyFit) || spatial?.bodyFit || 'canPass');
        physics.diagnostics.occupancyBand = entityType === 'block'
            ? (blockSupport?.occupancyBand || physics.body.liftBand || 'ground')
            : (physics.body.liftBand || physics.diagnostics.verticality || 'ground');
        physics.diagnostics.supportState = entityType === 'block'
            ? (blockSupport?.supportState || 'grounded')
            : null;
        physics.diagnostics.stackHeight = entityType === 'block'
            ? (blockSupport?.stackHeight || Math.max(1, (entity?.stackIndex || 0) + 1))
            : 0;
        physics.diagnostics.supportBlockId = entityType === 'block'
            ? (blockSupport?.supportBlockId || null)
            : null;
        physics.diagnostics.lastResolvedFrame = typeof frameCount === 'number' ? frameCount : physics.diagnostics.lastResolvedFrame || 0;
        if (entityType === 'block') {
            entity.syncPlacementProfile?.(blockSupport || null);
        }
        return physics;
    }

    syncTrackedEntities(gameState = gameCore?.gameState, options = {}) {
        const seenIds = new Set();
        const track = (entities = [], entityType) => {
            for (const entity of entities) {
                if (!entity?.id) continue;
                seenIds.add(entity.id);
                if (!this.entityStates.has(entity.id)) {
                    this.registerEntity(entity, entityType);
                } else {
                    entity.physics = this.entityStates.get(entity.id)?.physics || entity.physics;
                }
                this.refreshPhysicsState(entity, entityType, gameState, options);
            }
        };

        track(gameState?.butterflies || [], 'butterfly');
        track(gameState?.caterpillars || [], 'caterpillar');
        track(gameState?.blocks || [], 'block');

        for (const entityId of [...this.entityStates.keys()]) {
            if (!seenIds.has(entityId)) {
                this.entityStates.delete(entityId);
            }
        }

        this.lastUpdateSummary = {
            butterflies: (gameState?.butterflies || []).length,
            caterpillars: (gameState?.caterpillars || []).length,
            blocks: (gameState?.blocks || []).length,
            total: seenIds.size
        };
    }

    resolveButterflyContacts(sceneState = gameCore?.gameState, options = {}) {
        if (!this.initialized || !sceneState) return false;
        const butterflies = sceneState?.butterflies || [];
        if (!options.skipSync) {
            this.syncTrackedEntities(sceneState, {
                resetContacts: options.resetContacts !== false
            });
        }
        if (butterflies.length < 2) {
            this.lastContactResolutionFrame = typeof frameCount === 'number' ? frameCount : this.lastContactResolutionFrame;
            return true;
        }
        const groupedByZone = new Map();
        for (const butterfly of butterflies) {
            if (!butterfly?.id || butterfly.isSpawning || butterfly.zoneTravel) continue;
            const sleepState = butterfly.getSleepState?.();
            if (sleepState?.subtype) continue;
            const zoneId = gameCore?.getEntityZoneId?.(butterfly, null) || 'default';
            if (!groupedByZone.has(zoneId)) groupedByZone.set(zoneId, []);
            groupedByZone.get(zoneId).push(butterfly);
        }

        for (const [zoneId, zoneButterflies] of groupedByZone.entries()) {
            for (let i = 0; i < zoneButterflies.length; i += 1) {
                const left = zoneButterflies[i];
                const leftPhysics = this.getEntityState(left.id) || this.registerEntity(left, 'butterfly');
                for (let j = i + 1; j < zoneButterflies.length; j += 1) {
                    const right = zoneButterflies[j];
                    const rightPhysics = this.getEntityState(right.id) || this.registerEntity(right, 'butterfly');
                    if (!leftPhysics || !rightPhysics) continue;

                    const leftPoint = this.getEntityGroundPoint(left);
                    const rightPoint = this.getEntityGroundPoint(right);
                    const leftMetrics = this.getEntityMetrics(left, 'butterfly');
                    const rightMetrics = this.getEntityMetrics(right, 'butterfly');
                    const dx = rightPoint.x - leftPoint.x;
                    const dy = rightPoint.y - leftPoint.y;
                    const distance = Math.hypot(dx, dy);
                    const minDistance = Math.max(
                        11,
                        ((leftMetrics.separationDistance || 11) + (rightMetrics.separationDistance || 11)) * 0.5
                    );
                    if (distance >= minDistance) continue;

                    let nx;
                    let ny;
                    if (distance > 0.001) {
                        nx = dx / distance;
                        ny = dy / distance;
                    } else {
                        const fallback = this.buildDeterministicFallbackNormal(left.id, right.id);
                        nx = fallback.x;
                        ny = fallback.y;
                    }

                    const push = (minDistance - Math.max(distance, 0.001)) * 0.52;
                    const resolvedLeftPoint = this.clampGroundPointToZone({
                        x: leftPoint.x - (nx * push * 0.5),
                        y: leftPoint.y - (ny * push * 0.5)
                    }, zoneId);
                    const resolvedRightPoint = this.clampGroundPointToZone({
                        x: rightPoint.x + (nx * push * 0.5),
                        y: rightPoint.y + (ny * push * 0.5)
                    }, zoneId);

                    this.setEntityGroundPoint(left, resolvedLeftPoint);
                    this.setEntityGroundPoint(right, resolvedRightPoint);

                    this.addUniqueContactId(leftPhysics.contact.touchedButterflyIds, right.id);
                    this.addUniqueContactId(rightPhysics.contact.touchedButterflyIds, left.id);
                    leftPhysics.contact.blocked = true;
                    rightPhysics.contact.blocked = true;
                    leftPhysics.intent.x = -nx * push * 0.5;
                    leftPhysics.intent.y = -ny * push * 0.5;
                    rightPhysics.intent.x = nx * push * 0.5;
                    rightPhysics.intent.y = ny * push * 0.5;
                    leftPhysics.position.x = left.x || 0;
                    leftPhysics.position.y = left.y || 0;
                    rightPhysics.position.x = right.x || 0;
                    rightPhysics.position.y = right.y || 0;
                    leftPhysics.motion.desired.x = resolvedLeftPoint.x;
                    leftPhysics.motion.desired.y = resolvedLeftPoint.y;
                    rightPhysics.motion.desired.x = resolvedRightPoint.x;
                    rightPhysics.motion.desired.y = resolvedRightPoint.y;
                    leftPhysics.diagnostics.lastResolvedFrame = typeof frameCount === 'number' ? frameCount : leftPhysics.diagnostics.lastResolvedFrame;
                    rightPhysics.diagnostics.lastResolvedFrame = typeof frameCount === 'number' ? frameCount : rightPhysics.diagnostics.lastResolvedFrame;
                }
            }
        }

        this.lastContactResolutionFrame = typeof frameCount === 'number' ? frameCount : this.lastContactResolutionFrame;
        return true;
    }

    resolveButterflyStructureCollisions(sceneState = gameCore?.gameState) {
        if (!this.initialized || !sceneState) return false;
        const butterflies = sceneState?.butterflies || [];
        if (butterflies.length === 0) return true;

        const activeFrame = typeof frameCount === 'number' ? frameCount : -1;
        for (const butterfly of butterflies) {
            if (!butterfly?.id || butterfly.isSpawning || butterfly.zoneTravel) continue;
            const sleepState = butterfly.getSleepState?.();
            if (sleepState?.subtype) continue;

            const physics = this.getEntityState(butterfly.id) || this.registerEntity(butterfly, 'butterfly');
            if (!physics) continue;

            const zoneId = gameCore?.getEntityZoneId?.(butterfly, null) || butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || null;
            const desiredPoint = this.getEntityGroundPoint(butterfly);
            const carriedBlock = this.getCarriedBlockForButterfly(sceneState, butterfly);
            const hasFreshMotion = physics.motion?.movedFrame === activeFrame;
            const fromPoint = hasFreshMotion
                ? {
                    x: physics.motion.previous?.x ?? desiredPoint.x,
                    y: physics.motion.previous?.y ?? desiredPoint.y
                }
                : {
                    x: desiredPoint.x,
                    y: desiredPoint.y
                };

            const blocked = this.isGroundPointBlockedForButterfly(butterfly, desiredPoint, {
                zoneId,
                fromX: fromPoint.x,
                fromY: fromPoint.y
            }) || !this.isCarrySafeAtGroundPoint(butterfly, desiredPoint, carriedBlock, zoneId).safe;
            if (!blocked) {
                if (carriedBlock) {
                    this.applyCarriedBlockAnchor(butterfly, carriedBlock, desiredPoint);
                }
                physics.motion.previous.x = desiredPoint.x;
                physics.motion.previous.y = desiredPoint.y;
                physics.motion.desired.x = desiredPoint.x;
                physics.motion.desired.y = desiredPoint.y;
                continue;
            }

            const resolved = this.findStructureSlidePoint(butterfly, fromPoint, desiredPoint, zoneId, { carriedBlock });
            if (!resolved?.point) continue;

            this.setEntityGroundPoint(butterfly, resolved.point);
            physics.contact.blocked = true;
            physics.intent.x = resolved.point.x - fromPoint.x;
            physics.intent.y = resolved.point.y - fromPoint.y;
            physics.velocity.x = resolved.point.x - desiredPoint.x;
            physics.velocity.y = resolved.point.y - desiredPoint.y;
            physics.diagnostics.pathState = resolved.resolution === 'slide' ? 'enterable' : 'obstructed';
            physics.diagnostics.lastResolvedFrame = activeFrame;

            this.refreshPhysicsState(butterfly, 'butterfly', sceneState, { resetContacts: false });
            const structureQuery = this.getStructureQueryForEntity(butterfly, resolved.point, {
                zoneId,
                fromX: fromPoint.x,
                fromY: fromPoint.y
            });
            const nearestComponentId = butterfly.lifeSim?.spatialAwareness?.nearestComponentId
                || structureQuery?.nearestComponentId
                || structureSystem?.getSpatialContextForEntity?.(butterfly, sceneState)?.nearestComponentId
                || null;
            if (nearestComponentId) {
                this.addUniqueContactId(physics.contact.blockedByIds, `structure:${nearestComponentId}`);
            } else {
                this.addUniqueContactId(physics.contact.blockedByIds, 'structure');
            }
            if (carriedBlock) {
                const anchor = this.applyCarriedBlockAnchor(butterfly, carriedBlock, resolved.point) || resolved.anchor;
                if (anchor) {
                    physics.carry.anchor = { ...anchor };
                    physics.carry.attachedObjectId = carriedBlock.id;
                }
            }
            physics.motion.previous.x = resolved.point.x;
            physics.motion.previous.y = resolved.point.y;
            physics.motion.desired.x = resolved.point.x;
            physics.motion.desired.y = resolved.point.y;
        }

        return true;
    }

    resolveButterflyImpulses(sceneState = gameCore?.gameState) {
        if (!this.initialized || !sceneState) return false;
        const butterflies = sceneState?.butterflies || [];
        if (butterflies.length === 0) return true;

        const activeFrame = typeof frameCount === 'number' ? frameCount : -1;
        for (const butterfly of butterflies) {
            if (!butterfly?.id || butterfly.isSpawning || butterfly.zoneTravel) continue;
            const sleepState = butterfly.getSleepState?.();
            if (sleepState?.subtype) continue;

            const physics = this.getEntityState(butterfly.id) || this.registerEntity(butterfly, 'butterfly');
            const impulse = physics?.impulse || null;
            if (!impulse || (impulse.frames || 0) <= 0) continue;

            const magnitude = Math.hypot(impulse.x || 0, impulse.y || 0);
            if (magnitude < 0.05) {
                impulse.x = 0;
                impulse.y = 0;
                impulse.frames = 0;
                continue;
            }

            const zoneId = gameCore?.getEntityZoneId?.(butterfly, null) || butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || null;
            const carriedBlock = this.getCarriedBlockForButterfly(sceneState, butterfly);
            const fromPoint = this.getEntityGroundPoint(butterfly);
            const desiredPoint = {
                x: fromPoint.x + (impulse.x || 0),
                y: fromPoint.y + (impulse.y || 0)
            };
            const resolved = this.findStructureSlidePoint(butterfly, fromPoint, desiredPoint, zoneId, { carriedBlock });
            if (!resolved?.point) continue;

            this.setEntityGroundPoint(butterfly, resolved.point);
            physics.motion.previous.x = fromPoint.x;
            physics.motion.previous.y = fromPoint.y;
            physics.motion.desired.x = resolved.point.x;
            physics.motion.desired.y = resolved.point.y;
            physics.motion.movedFrame = activeFrame;
            physics.motion.source = impulse.source || 'impulse';
            physics.velocity.x = resolved.point.x - fromPoint.x;
            physics.velocity.y = resolved.point.y - fromPoint.y;
            physics.intent.x = resolved.point.x - fromPoint.x;
            physics.intent.y = resolved.point.y - fromPoint.y;
            physics.diagnostics.pathState = resolved.resolution === 'slide' ? 'enterable' : resolved.resolution === 'stop' ? 'obstructed' : 'open';
            physics.diagnostics.lastResolvedFrame = activeFrame;

            if (resolved.resolution !== 'direct') {
                physics.contact.blocked = true;
                const structureQuery = this.getStructureQueryForEntity(butterfly, resolved.point, {
                    zoneId,
                    fromX: fromPoint.x,
                    fromY: fromPoint.y
                });
                const nearestComponentId = butterfly.lifeSim?.spatialAwareness?.nearestComponentId
                    || structureQuery?.nearestComponentId
                    || structureSystem?.getSpatialContextForEntity?.(butterfly, sceneState)?.nearestComponentId
                    || null;
                if (nearestComponentId) {
                    this.addUniqueContactId(physics.contact.blockedByIds, `structure:${nearestComponentId}`);
                } else {
                    this.addUniqueContactId(physics.contact.blockedByIds, 'structure');
                }
            }

            if (carriedBlock) {
                const anchor = this.applyCarriedBlockAnchor(butterfly, carriedBlock, resolved.point) || resolved.anchor;
                if (anchor) {
                    physics.carry.anchor = { ...anchor };
                    physics.carry.attachedObjectId = carriedBlock.id;
                }
            }

            impulse.x *= 0.58;
            impulse.y *= 0.58;
            impulse.frames = Math.max(0, (impulse.frames || 0) - 1);
            if (Math.hypot(impulse.x || 0, impulse.y || 0) < 0.05) {
                impulse.x = 0;
                impulse.y = 0;
                impulse.frames = 0;
            }
        }

        return true;
    }

    update(gameState = gameCore?.gameState, _deltaSeconds = gameConfig?.simulation?.fixedDeltaSeconds || 0, options = {}) {
        if (!this.initialized || !gameState) return;
        const updateStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.syncTrackedEntities(gameState, {
            ...options,
            resetContacts: true
        });
        this.reconcileUnsupportedBlocks(gameState);
        this.resolveButterflyContacts(gameState, {
            skipSync: true
        });
        this.resolveButterflyImpulses(gameState);
        this.resolveButterflyStructureCollisions(gameState);
        this.lastUpdateFrame = typeof frameCount === 'number' ? frameCount : this.lastUpdateFrame;
        this.lastUpdateSummary.updateMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - updateStart;
        this.lastUpdateSummary.frameBudgetMs = this.getBudgetTargets().focusedGardenPhysicsMs;
    }

    serializeDurableState() {
        return null;
    }

    deserializeDurableState(_state = null, gameState = gameCore?.gameState) {
        this.syncTrackedEntities(gameState);
    }
}

const physicsSystem = new PhysicsSystem();
