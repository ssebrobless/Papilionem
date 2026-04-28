class StructureSystem {
    constructor() {
        this.initialized = false;
        this.zoneProfiles = new Map();
        this.blockProfiles = new Map();
        this.lastRebuildSignature = null;
        this.runtimeCacheFrame = null;
        this.collisionQueryRuntimeCache = new Map();
        this.spatialContextRuntimeCache = new Map();
        const sharedHooks = Array.isArray(gameConfig?.ml?.contract?.sharedSpatialHooks) && gameConfig.ml.contract.sharedSpatialHooks.length
            ? gameConfig.ml.contract.sharedSpatialHooks.filter(Boolean)
            : ['verticality', 'structureRole', 'pathState', 'bodyFit'];
        this.spatialSemantics = {
            version: 'b3-occupancy-semantics-v1',
            sharedHooks,
            occupancyBands: ['ground', 'stacked', 'overhead'],
            verticality: ['ground', 'stacked', 'overhead'],
            structureRole: ['loose', 'wall', 'roof', 'opening', 'shelter'],
            pathState: ['open', 'obstructed', 'enterable', 'trapped'],
            bodyFit: ['canPass', 'tooNarrow', 'canShelterInside'],
            defaults: {
                verticality: 'ground',
                structureRole: 'loose',
                pathState: 'open',
                bodyFit: 'canPass'
            },
            defaultOccupancyBand: 'ground'
        };
    }

    initialize() {
        this.initialized = true;
    }

    reset() {
        this.zoneProfiles.clear();
        this.blockProfiles.clear();
        this.lastRebuildSignature = null;
        this.clearRuntimeCaches();
    }

    clearRuntimeCaches() {
        this.runtimeCacheFrame = null;
        this.collisionQueryRuntimeCache.clear();
        this.spatialContextRuntimeCache.clear();
    }

    getRuntimeFrameTag() {
        const currentFrame = gameCore?.getCurrentFrame?.();
        if (Number.isFinite(currentFrame)) {
            return Math.max(0, Math.round(currentFrame));
        }
        return typeof frameCount === 'number'
            ? Math.max(0, Math.round(frameCount))
            : 0;
    }

    ensureRuntimeCaches() {
        const currentFrame = this.getRuntimeFrameTag();
        if (this.runtimeCacheFrame !== currentFrame) {
            this.runtimeCacheFrame = currentFrame;
            this.collisionQueryRuntimeCache.clear();
            this.spatialContextRuntimeCache.clear();
        }
        return currentFrame;
    }

    normalizeRuntimeCacheNumber(value, precision = 100) {
        if (!Number.isFinite(value)) return 'na';
        return Math.round(value * precision) / precision;
    }

    buildCollisionQueryRuntimeCacheKey(zoneId, point, options = {}) {
        if (!zoneId || !point) return null;
        const currentPointX = options.fromX ?? options.fromPoint?.x ?? options.entity?.x ?? point.x;
        const currentPointY = options.fromY ?? options.fromPoint?.y ?? options.entity?.y ?? point.y;
        const entityKey = options.entity?.id
            || options.entity?.currentZoneId
            || options.entity?.type
            || options.entity?.constructor?.name
            || 'none';
        return [
            zoneId,
            entityKey,
            this.normalizeRuntimeCacheNumber(point.x),
            this.normalizeRuntimeCacheNumber(point.y),
            this.normalizeRuntimeCacheNumber(currentPointX),
            this.normalizeRuntimeCacheNumber(currentPointY),
            this.normalizeRuntimeCacheNumber(options.corridorMargin || 0),
            Number.isFinite(options.occupancyRadius)
                ? this.normalizeRuntimeCacheNumber(options.occupancyRadius)
                : 'auto'
        ].join('|');
    }

    cloneCollisionQueryResult(result) {
        if (!result) return null;
        return {
            ...result,
            point: result.point ? { ...result.point } : null,
            currentPoint: result.currentPoint ? { ...result.currentPoint } : null,
            opening: this.cloneValue(result.opening, null),
            interiorVolume: this.cloneValue(result.interiorVolume, null),
            roofFootprint: this.cloneValue(result.roofFootprint, null),
            wallNormal: this.cloneValue(result.wallNormal, null),
            nearbyOccupancyColumns: this.cloneValue(result.nearbyOccupancyColumns, []),
            relevantShelter: this.cloneValue(result.relevantShelter, null)
        };
    }

    buildSpatialContextRuntimeCacheKey(entity, zoneId = entity?.currentZoneId || entity?.lifeSim?.lifecycle?.currentZoneId || null) {
        if (!entity?.id || !zoneId) return null;
        return [
            zoneId,
            entity.id,
            this.normalizeRuntimeCacheNumber(entity.x || 0),
            this.normalizeRuntimeCacheNumber(entity.y || 0),
            entity.blockInteraction?.carryingBlockId ? 'carrying' : 'free'
        ].join('|');
    }

    cloneValue(value, fallback = null) {
        if (value == null) return fallback;
        return JSON.parse(JSON.stringify(value));
    }

    maybeCloneValue(value, fallback = null, shouldClone = true) {
        if (value == null) return fallback;
        return shouldClone ? this.cloneValue(value, fallback) : value;
    }

    clamp01(value) {
        return Math.max(0, Math.min(1, value ?? 0));
    }

    getZoneProfile(zoneId) {
        return this.cloneValue(this.zoneProfiles.get(zoneId), null);
    }

    getZoneProfileRef(zoneId) {
        return this.zoneProfiles.get(zoneId) || null;
    }

    getBlockProfile(blockId) {
        return this.cloneValue(this.blockProfiles.get(blockId), null);
    }

    getBlockProfileRef(blockId) {
        return this.blockProfiles.get(blockId) || null;
    }

    getZoneCollisionGeometry(zoneId) {
        return this.cloneValue(this.getZoneCollisionGeometryRef(zoneId), null);
    }

    getZoneCollisionGeometryRef(zoneId) {
        return this.zoneProfiles.get(zoneId)?.collisionGeometry || null;
    }

    getSpatialSemantics() {
        return this.cloneValue(this.getSpatialSemanticsRef(), null);
    }

    getSpatialSemanticsRef() {
        return this.spatialSemantics;
    }

    getSharedSpatialHooks() {
        return [...(this.spatialSemantics?.sharedHooks || [])];
    }

    normalizeSpatialHookValue(hook, value) {
        const semantics = this.getSpatialSemanticsRef() || {};
        const domain = Array.isArray(semantics?.[hook]) ? semantics[hook] : null;
        if (!domain?.length) return value;
        if (domain.includes(value)) return value;
        return semantics?.defaults?.[hook] || domain[0];
    }

    normalizeOccupancyBand(value) {
        const semantics = this.getSpatialSemanticsRef() || {};
        const domain = Array.isArray(semantics?.occupancyBands) ? semantics.occupancyBands : ['ground', 'stacked', 'overhead'];
        if (domain.includes(value)) return value;
        return semantics?.defaultOccupancyBand || domain[0];
    }

    getMaxStackHeight() {
        return Math.max(2, Math.round(gameConfig?.entities?.block?.maxStackHeight || 3));
    }

    getSpatialFootprintRegistry() {
        return gameConfig?.entities?.spatialFootprints || {};
    }

    createCanonicalBlockEntity(overrides = {}) {
        const blockConfig = gameConfig?.entities?.block || {};
        return {
            renderWidth: blockConfig.renderWidth || 20,
            renderHeight: blockConfig.renderHeight || 20,
            stackIndex: Math.max(0, overrides.stackIndex ?? 0),
            ...overrides
        };
    }

    getCanonicalBlockMetrics(stackIndex = 0) {
        return this.getEntityMetrics(
            this.createCanonicalBlockEntity({ stackIndex: Math.max(0, stackIndex) }),
            'block'
        );
    }

    getCanonicalBlockUnit(stackHeight = 1) {
        const resolvedHeight = Math.max(1, Math.round(stackHeight || 1));
        const metrics = this.getCanonicalBlockMetrics(resolvedHeight - 1);
        const width = Math.max(metrics.width || 18, 18);
        const radius = Math.max(metrics.radius || 8, 8);
        const spacing = width * 0.92;
        const openingDepth = Math.max(width * 0.92, 16);
        return {
            width,
            radius,
            spacing,
            sideMargin: Math.max(width * 0.9, 18),
            openingWidthFloor: Math.round(width * 1.05),
            openingRoleThreshold: width * 1.15,
            interiorInset: width * 0.9,
            entryOffset: Math.max(width * 0.85, 12),
            openingDepth,
            openingOutwardDepth: openingDepth * 1.35,
            columnRadius: Math.max(metrics.columnRadius || 10, 10),
            columnQueryRadius: Math.max(metrics.columnQueryRadius || radius, radius),
            openingConflictRadius: Math.max(metrics.openingConflictRadius || radius, radius),
            adjacencyClearance: spacing * 0.8,
            supportAlignRadius: Math.max(10, spacing * 0.38),
            visualLiftStep: Math.max(6, Math.round(width * 0.4)),
            scatterRandomPadding: Math.round(width * 1.7),
            doorwayAvoidRadius: Math.round(width * 2.2),
            blockDistanceScoreMax: Math.round(width * 4.8),
            flowerDistanceScoreMax: Math.round(width * 3.6),
            butterflyDistanceScoreMax: Math.round(width * 4.2),
            nudgeDistanceMin: Math.round(width * 0.9),
            nudgeDistanceMax: Math.round(width * 1.7),
            groundFallbackMin: Math.round(width * 1.0),
            groundFallbackMax: Math.round(width * 2.4),
            safeDropRadii: [0.8, 1.2, 1.6, 2].map(scale => Math.round(width * scale)),
            diagonalOffsetX: spacing * 0.62,
            diagonalOffsetY: spacing * 0.55,
            forwardOffsetY: spacing * 0.72,
            clampPadding: Math.max(8, Math.round(width * 0.5))
        };
    }

    resolveEntityFootprintFamily(entity, entityType = null) {
        const explicitType = entityType
            || entity?.physics?.entityType
            || entity?.objectProfile?.entityType
            || entity?.lifeSim?.entityType
            || null;

        if (explicitType === 'block') return 'block';
        if (explicitType === 'butterfly') return 'butterfly';
        if (explicitType === 'caterpillar') return 'caterpillar';
        if (explicitType === 'flower' || entity?.flowerType) {
            if (entity?.occupancyState === 'egg') return 'egg';
            if (entity?.occupancyState === 'chrysalis') return 'chrysalis';
            return 'flower';
        }
        if (Number.isFinite(entity?.renderWidth) || Number.isFinite(entity?.renderHeight)) {
            return 'block';
        }
        if (entity?.occupancyState === 'egg') return 'egg';
        if (entity?.occupancyState === 'chrysalis') return 'chrysalis';
        return 'butterfly';
    }

    getEntityFootprintSpec(entity, entityType = null) {
        const registry = this.getSpatialFootprintRegistry();
        const family = this.resolveEntityFootprintFamily(entity, entityType);
        return {
            family,
            spec: registry[family] || registry.butterfly || {}
        };
    }

    createDefaultSpatialContext(overrides = {}) {
        const semantics = this.getSpatialSemanticsRef() || {};
        return {
            zoneId: null,
            verticality: semantics?.defaults?.verticality || 'ground',
            structureRole: semantics?.defaults?.structureRole || 'loose',
            pathState: semantics?.defaults?.pathState || 'open',
            bodyFit: semantics?.defaults?.bodyFit || 'canPass',
            occupancyBand: semantics?.defaultOccupancyBand || 'ground',
            obstacleDensity: 0,
            shelterCandidate: false,
            canUseInterior: false,
            insideShelter: false,
            shelterConfidenceTarget: 0.18,
            preferredShelterPoint: null,
            nearestComponentId: null,
            openingWidth: 0,
            interiorClearance: 0,
            ...overrides
        };
    }

    getNearestComponentForPoint(zoneProfile, point, maxDistance = 132) {
        if (!zoneProfile?.components?.length || !point) return null;
        const nearest = zoneProfile.components
            .map(component => ({
                component,
                distance: Math.hypot((component.center?.x || 0) - point.x, (component.center?.y || 0) - point.y)
            }))
            .sort((left, right) => left.distance - right.distance)[0] || null;
        if (!nearest) return null;
        return nearest.distance <= maxDistance ? nearest.component : null;
    }

    getNearestOccupancyColumn(component, point, spacing = 18) {
        if (!component?.occupancyColumns?.length || !point) return null;
        const nearest = component.occupancyColumns
            .map(column => ({
                column,
                distance: Math.hypot((column.x || 0) - point.x, (column.y || 0) - point.y)
            }))
            .sort((left, right) => left.distance - right.distance)[0] || null;
        if (!nearest) return null;
        const maxDistance = Math.max(spacing, nearest.column?.radius || 12);
        return nearest.distance <= maxDistance ? nearest.column : null;
    }

    getBlockSupportContext(block, candidateBlocks = []) {
        const zoneId = block?.currentZoneId || null;
        const maxStackHeight = this.getMaxStackHeight();
        const defaultContext = {
            zoneId,
            componentId: null,
            columnId: null,
            supportState: block?.carriedById ? 'carried' : 'grounded',
            stable: true,
            occupancyBand: this.normalizeOccupancyBand(block?.carriedById ? 'overhead' : ((block?.stackIndex || 0) > 0 ? 'stacked' : 'ground')),
            stackIndex: Math.max(0, block?.stackIndex || 0),
            stackHeight: Math.max(1, (block?.stackIndex || 0) + 1),
            maxStackHeight,
            supportBlockId: block?.supportBlockId || null,
            supportBlockStackIndex: null,
            placementMode: block?.lastPlacedMode || ((block?.stackIndex || 0) > 0 ? 'stacked' : 'ground'),
            openingConflict: false
        };
        if (!block || !zoneId) {
            return defaultContext;
        }

        const zoneProfile = this.getZoneProfileRef(zoneId);
        if (!zoneProfile) {
            return defaultContext;
        }

        const zoneBlocks = (Array.isArray(candidateBlocks) && candidateBlocks.length > 0)
            ? candidateBlocks.filter(entry => entry && (entry.currentZoneId || null) === zoneId)
            : (gameCore?.getBlocksInZone?.(zoneId) || []);
        const blockById = new Map(zoneBlocks.filter(Boolean).map(entry => [entry.id, entry]));
        const stackIndex = Math.max(0, block.stackIndex || 0);
        const point = { x: block.x || 0, y: block.y || 0 };
        const blockUnit = this.getCanonicalBlockUnit(stackIndex + 1);
        const spacing = blockUnit.spacing;
        const component = this.getNearestComponentForPoint(zoneProfile, point);
        const column = component ? this.getNearestOccupancyColumn(component, point, blockUnit.columnQueryRadius) : null;
        const supportBlock = block.supportBlockId ? blockById.get(block.supportBlockId) || null : null;
        const supportAligned = !!supportBlock
            && Math.hypot((supportBlock.x || 0) - point.x, (supportBlock.y || 0) - point.y) <= Math.max(10, blockUnit.radius * 0.9);
        const supportStable = !!supportBlock
            && !supportBlock.carriedById
            && (supportBlock.currentZoneId || null) === zoneId
            && Math.max(0, supportBlock.stackIndex || 0) === Math.max(0, stackIndex - 1)
            && supportAligned;
        const columnAligned = !!column
            && Math.hypot((column.x || 0) - point.x, (column.y || 0) - point.y) <= Math.max(10, (column.radius || 12) * 0.9);
        const withinLimit = stackIndex < maxStackHeight;
        const stackedStable = stackIndex === 0
            ? true
            : withinLimit && supportStable && columnAligned;
        const supportState = block.carriedById
            ? 'carried'
            : stackIndex > 0
                ? (stackedStable ? 'supported' : 'unsupported')
                : 'grounded';

        return {
            zoneId,
            componentId: component?.id || null,
            columnId: column?.id || null,
            supportState,
            stable: supportState !== 'unsupported',
            occupancyBand: this.normalizeOccupancyBand(
                supportState === 'carried'
                    ? 'overhead'
                    : stackIndex > 0
                        ? 'stacked'
                        : 'ground'
            ),
            stackIndex,
            stackHeight: Math.max(1, stackIndex + 1),
            maxStackHeight,
            supportBlockId: block.supportBlockId || null,
            supportBlockStackIndex: supportBlock?.stackIndex ?? null,
            placementMode: block.lastPlacedMode || (stackIndex > 0 ? 'stacked' : 'ground'),
            openingConflict: component ? this.pointConflictsWithOpening(component, point, spacing) : false
        };
    }

    resolveOccupancyBandForEntity(entity, nearestProfile = null) {
        if (entity?.blockInteraction?.carryingBlockId) {
            return this.normalizeOccupancyBand('overhead');
        }
        if (nearestProfile) {
            if ((nearestProfile.stackIndex || 0) > 0) {
                return this.normalizeOccupancyBand(nearestProfile.structureRole === 'roof' ? 'overhead' : 'stacked');
            }
            if ((nearestProfile.stackHeight || 0) >= 3) {
                return this.normalizeOccupancyBand('overhead');
            }
        }
        const zLift = entity?.physics?.position?.zLift
            || (typeof entity?.getVisualLift === 'function' ? entity.getVisualLift() : 0)
            || 0;
        if (zLift > 6) {
            return this.normalizeOccupancyBand('stacked');
        }
        return this.normalizeOccupancyBand('ground');
    }

    update(gameState) {
        if (!this.initialized) return;
        const rebuildSignature = this.buildRebuildSignature(gameState);
        if (rebuildSignature === this.lastRebuildSignature) {
            return false;
        }
        this.rebuild(gameState);
        this.lastRebuildSignature = rebuildSignature;
        return true;
    }

    buildRebuildSignature(gameState = gameCore?.gameState) {
        const blocks = (gameState?.blocks || [])
            .filter(Boolean)
            .slice()
            .sort((left, right) => String(left?.id || '').localeCompare(String(right?.id || '')));
        const zoneIds = gameCore?.getZoneIds?.() || [];
        const blockSignature = blocks.map(block => [
            block.id || 'unknown',
            block.currentZoneId || 'none',
            block.carriedById || 'ground',
            Math.round(block.x || 0),
            Math.round(block.y || 0),
            Math.max(0, block.stackIndex || 0),
            block.supportBlockId || 'none',
            block.lastPlacedMode || 'ground'
        ].join(':')).join('|');
        return `${zoneIds.join(',')}::${blockSignature}`;
    }

    rebuild(gameState = gameCore?.gameState) {
        this.zoneProfiles.clear();
        this.blockProfiles.clear();
        this.clearRuntimeCaches();

        const blocks = (gameState?.blocks || []).filter(block => block && !block.carriedById);
        const zoneIds = gameCore?.getZoneIds?.() || [...new Set(blocks.map(block => block.currentZoneId).filter(Boolean))];

        for (const zoneId of zoneIds) {
            const zoneBlocks = blocks.filter(block => (block.currentZoneId || null) === zoneId);
            const profile = this.buildZoneProfile(zoneId, zoneBlocks);
            this.zoneProfiles.set(zoneId, profile);
            for (const blockProfile of profile.blockProfiles) {
                this.blockProfiles.set(blockProfile.id, blockProfile);
            }
        }
    }

    buildZoneProfile(zoneId, blocks = []) {
        const region = gameCore?.getZoneConfig?.(zoneId)?.renderProfile?.screenRegion || null;
        const blockMetrics = blocks.map(block => this.getEntityMetrics(block, 'block'));
        const connectDistance = Math.max(
            42,
            ...blockMetrics.map(metrics => Math.round(metrics.connectDistance || 42))
        );
        const blockRadius = Math.max(
            8,
            ...blockMetrics.map(metrics => Math.round(metrics.radius || 8))
        );
        const components = this.buildComponents(blocks, connectDistance, blockRadius);
        const blockProfiles = [];
        for (const component of components) {
            for (const block of component.blocks) {
                blockProfiles.push(this.buildBlockProfile(block, component));
            }
        }

        const shelters = components.filter(component => component.shelterEligible);
        const collisionGeometry = this.buildZoneCollisionGeometry(zoneId, components);
        return {
            zoneId,
            region: region ? { ...region } : null,
            updatedAtFrame: gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0),
            blockCount: blocks.length,
            componentCount: components.length,
            shelterCount: shelters.length,
            components: this.cloneValue(components, []),
            shelters: this.cloneValue(shelters, []),
            collisionGeometry,
            blockProfiles
        };
    }

    buildComponents(blocks, connectDistance, blockRadius) {
        const remaining = new Set(blocks.map(block => block.id));
        const byId = new Map(blocks.map(block => [block.id, block]));
        const components = [];
        let componentIndex = 0;

        while (remaining.size > 0) {
            const seedId = remaining.values().next().value;
            remaining.delete(seedId);
            const stack = [byId.get(seedId)];
            const componentBlocks = [];

            while (stack.length > 0) {
                const current = stack.pop();
                if (!current) continue;
                componentBlocks.push(current);

                for (const candidateId of [...remaining]) {
                    const candidate = byId.get(candidateId);
                    if (!candidate) continue;
                    if (!this.areBlocksConnected(current, candidate, connectDistance)) continue;
                    remaining.delete(candidateId);
                    stack.push(candidate);
                }
            }

            components.push(this.buildComponentProfile(componentIndex++, componentBlocks, blockRadius));
        }

        return components;
    }

    areBlocksConnected(left, right, connectDistance) {
        if (!left || !right) return false;
        if (left.id === right.id) return true;
        if (left.supportBlockId === right.id || right.supportBlockId === left.id) return true;
        const dx = (left.x || 0) - (right.x || 0);
        const dy = (left.y || 0) - (right.y || 0);
        return Math.hypot(dx, dy) <= connectDistance;
    }

    buildComponentProfile(componentIndex, blocks, blockRadius) {
        const stacks = this.buildStacks(blocks, blockRadius);
        const xs = blocks.map(block => block.x || 0);
        const ys = blocks.map(block => block.y || 0);
        const bounds = {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        };
        const center = {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
        };
        const averageBlockSize = Math.max(
            16,
            Math.round(blocks.reduce((sum, block) => sum + this.getEntityMetrics(block, 'block').width, 0) / Math.max(1, blocks.length))
        );
        const blockUnit = this.getCanonicalBlockUnit();
        const tallStacks = stacks.filter(stack => stack.height >= 2);
        const threshold = gameConfig?.entities?.block?.shelterThresholdBlocks || 6;
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const sideScores = this.buildSideScores(stacks, bounds, blockUnit);
        const openingDirection = Object.entries(sideScores).sort((left, right) => left[1] - right[1])[0]?.[0] || 'bottom';
        const openingWidth = Math.max(
            blockUnit.openingWidthFloor,
            Math.round((openingDirection === 'left' || openingDirection === 'right' ? height : width) / Math.max(2, (sideScores[openingDirection] || 0) + 1))
        );
        const inset = blockUnit.interiorInset;
        const interiorBounds = (width > inset * 2.2 && height > inset * 2.2)
            ? {
                minX: bounds.minX + inset,
                maxX: bounds.maxX - inset,
                minY: bounds.minY + inset,
                maxY: bounds.maxY - inset
            }
            : null;
        const shelterEligible = !!interiorBounds && blocks.length >= threshold && tallStacks.length >= 2;
        const entryPoint = this.buildEntryPoint(bounds, center, openingDirection, blockUnit);
        const openingProfile = this.buildOpeningProfile(bounds, center, openingDirection, openingWidth, blockUnit);
        const occupancyColumns = this.buildOccupancyColumns(stacks);
        const interiorPoint = interiorBounds
            ? {
                x: (interiorBounds.minX + interiorBounds.maxX) / 2,
                y: (interiorBounds.minY + interiorBounds.maxY) / 2
            }
            : center;
        const interiorClearance = interiorBounds
            ? Math.min(interiorBounds.maxX - interiorBounds.minX, interiorBounds.maxY - interiorBounds.minY)
            : 0;

        return {
            id: `component_${componentIndex}`,
            blockIds: blocks.map(block => block.id),
            blocks: this.cloneValue(blocks, []),
            stackIds: stacks.map(stack => stack.id),
            stacks,
            bounds,
            center,
            interiorBounds,
            interiorClearance,
            interiorPoint,
            entryPoint,
            openingProfile,
            occupancyColumns,
            averageBlockSize,
            blockUnit,
            openingDirection,
            openingWidth,
            sideScores,
            shelterEligible,
            tallStackCount: tallStacks.length
        };
    }

    buildStacks(blocks, blockRadius) {
        const byId = new Map(blocks.map(block => [block.id, block]));
        const visited = new Set();
        const stacks = [];
        let stackIndex = 0;
        const quantize = value => Math.round((value || 0) / Math.max(10, blockRadius * 1.35));

        for (const block of blocks) {
            if (!block || visited.has(block.id)) continue;
            const stackBlocks = [];
            const pending = [block];
            while (pending.length > 0) {
                const current = pending.pop();
                if (!current || visited.has(current.id)) continue;
                visited.add(current.id);
                stackBlocks.push(current);

                for (const candidate of blocks) {
                    if (!candidate || visited.has(candidate.id) || candidate.id === current.id) continue;
                    const shareSupport = candidate.supportBlockId === current.id || current.supportBlockId === candidate.id;
                    const sameColumn = quantize(candidate.x) === quantize(current.x)
                        && quantize(candidate.y) === quantize(current.y);
                    if (shareSupport || sameColumn) {
                        pending.push(candidate);
                    }
                }
            }

            stackBlocks.sort((left, right) => {
                const leftIndex = left.stackIndex ?? 0;
                const rightIndex = right.stackIndex ?? 0;
                if (leftIndex !== rightIndex) return leftIndex - rightIndex;
                return (left.y || 0) - (right.y || 0);
            });

            const height = Math.max(
                stackBlocks.length,
                ...stackBlocks.map(entry => (entry.stackIndex ?? 0) + 1)
            );
            const baseBlock = stackBlocks[0];
            const topBlock = stackBlocks[stackBlocks.length - 1];
            stacks.push({
                id: `stack_${stackIndex++}`,
                blockIds: stackBlocks.map(entry => entry.id),
                blocks: this.cloneValue(stackBlocks, []),
                x: baseBlock?.x || 0,
                y: baseBlock?.y || 0,
                baseBlockId: baseBlock?.id || null,
                topBlockId: topBlock?.id || null,
                height
            });
        }

        return stacks;
    }

    buildSideScores(stacks, bounds, blockUnit = this.getCanonicalBlockUnit()) {
        const margin = blockUnit?.sideMargin || 18;
        const scores = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };

        for (const stack of stacks) {
            const weight = Math.max(1, stack.height);
            if (stack.x <= bounds.minX + margin) scores.left += weight;
            if (stack.x >= bounds.maxX - margin) scores.right += weight;
            if (stack.y <= bounds.minY + margin) scores.top += weight;
            if (stack.y >= bounds.maxY - margin) scores.bottom += weight;
        }

        return scores;
    }

    buildEntryPoint(bounds, center, openingDirection, blockUnit = this.getCanonicalBlockUnit()) {
        const offset = blockUnit?.entryOffset || 12;
        switch (openingDirection) {
            case 'left':
                return { x: bounds.minX + offset, y: center.y };
            case 'right':
                return { x: bounds.maxX - offset, y: center.y };
            case 'top':
                return { x: center.x, y: bounds.minY + offset };
            case 'bottom':
            default:
                return { x: center.x, y: bounds.maxY - offset };
        }
    }

    buildOpeningProfile(bounds, center, openingDirection, openingWidth, blockUnit = this.getCanonicalBlockUnit()) {
        const halfWidth = Math.max(10, openingWidth / 2);
        const depth = blockUnit?.openingDepth || 16;
        const outwardDepth = blockUnit?.openingOutwardDepth || (depth * 1.35);
        switch (openingDirection) {
            case 'left':
                return {
                    direction: openingDirection,
                    corridorBounds: {
                        minX: bounds.minX - outwardDepth,
                        maxX: bounds.minX + depth,
                        minY: center.y - halfWidth,
                        maxY: center.y + halfWidth
                    },
                    innerPoint: { x: bounds.minX + depth, y: center.y },
                    outerPoint: { x: bounds.minX - outwardDepth * 0.72, y: center.y },
                    segmentStart: { x: bounds.minX, y: center.y - halfWidth },
                    segmentEnd: { x: bounds.minX, y: center.y + halfWidth }
                };
            case 'right':
                return {
                    direction: openingDirection,
                    corridorBounds: {
                        minX: bounds.maxX - depth,
                        maxX: bounds.maxX + outwardDepth,
                        minY: center.y - halfWidth,
                        maxY: center.y + halfWidth
                    },
                    innerPoint: { x: bounds.maxX - depth, y: center.y },
                    outerPoint: { x: bounds.maxX + outwardDepth * 0.72, y: center.y },
                    segmentStart: { x: bounds.maxX, y: center.y - halfWidth },
                    segmentEnd: { x: bounds.maxX, y: center.y + halfWidth }
                };
            case 'top':
                return {
                    direction: openingDirection,
                    corridorBounds: {
                        minX: center.x - halfWidth,
                        maxX: center.x + halfWidth,
                        minY: bounds.minY - outwardDepth,
                        maxY: bounds.minY + depth
                    },
                    innerPoint: { x: center.x, y: bounds.minY + depth },
                    outerPoint: { x: center.x, y: bounds.minY - outwardDepth * 0.72 },
                    segmentStart: { x: center.x - halfWidth, y: bounds.minY },
                    segmentEnd: { x: center.x + halfWidth, y: bounds.minY }
                };
            case 'bottom':
            default:
                return {
                    direction: openingDirection,
                    corridorBounds: {
                        minX: center.x - halfWidth,
                        maxX: center.x + halfWidth,
                        minY: bounds.maxY - depth,
                        maxY: bounds.maxY + outwardDepth
                    },
                    innerPoint: { x: center.x, y: bounds.maxY - depth },
                    outerPoint: { x: center.x, y: bounds.maxY + outwardDepth * 0.72 },
                    segmentStart: { x: center.x - halfWidth, y: bounds.maxY },
                    segmentEnd: { x: center.x + halfWidth, y: bounds.maxY }
                };
        }
    }

    pushWallNormalSegment(segments, side, start, end, normal) {
        if (!start || !end || !normal) return;
        const length = Math.hypot((end.x || 0) - (start.x || 0), (end.y || 0) - (start.y || 0));
        if (length < 2) return;
        segments.push({
            side,
            start: { x: start.x, y: start.y },
            end: { x: end.x, y: end.y },
            normal: { x: normal.x, y: normal.y },
            length
        });
    }

    buildWallNormals(bounds, openingDirection, openingProfile) {
        if (!bounds) return [];
        const segments = [];
        const openingStart = openingProfile?.segmentStart || null;
        const openingEnd = openingProfile?.segmentEnd || null;
        const gapMinX = Math.min(openingStart?.x ?? bounds.minX, openingEnd?.x ?? bounds.minX);
        const gapMaxX = Math.max(openingStart?.x ?? bounds.maxX, openingEnd?.x ?? bounds.maxX);
        const gapMinY = Math.min(openingStart?.y ?? bounds.minY, openingEnd?.y ?? bounds.minY);
        const gapMaxY = Math.max(openingStart?.y ?? bounds.maxY, openingEnd?.y ?? bounds.maxY);

        if (openingDirection === 'top') {
            this.pushWallNormalSegment(segments, 'top', { x: bounds.minX, y: bounds.minY }, { x: gapMinX, y: bounds.minY }, { x: 0, y: -1 });
            this.pushWallNormalSegment(segments, 'top', { x: gapMaxX, y: bounds.minY }, { x: bounds.maxX, y: bounds.minY }, { x: 0, y: -1 });
        } else {
            this.pushWallNormalSegment(segments, 'top', { x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.minY }, { x: 0, y: -1 });
        }

        if (openingDirection === 'bottom') {
            this.pushWallNormalSegment(segments, 'bottom', { x: bounds.minX, y: bounds.maxY }, { x: gapMinX, y: bounds.maxY }, { x: 0, y: 1 });
            this.pushWallNormalSegment(segments, 'bottom', { x: gapMaxX, y: bounds.maxY }, { x: bounds.maxX, y: bounds.maxY }, { x: 0, y: 1 });
        } else {
            this.pushWallNormalSegment(segments, 'bottom', { x: bounds.minX, y: bounds.maxY }, { x: bounds.maxX, y: bounds.maxY }, { x: 0, y: 1 });
        }

        if (openingDirection === 'left') {
            this.pushWallNormalSegment(segments, 'left', { x: bounds.minX, y: bounds.minY }, { x: bounds.minX, y: gapMinY }, { x: -1, y: 0 });
            this.pushWallNormalSegment(segments, 'left', { x: bounds.minX, y: gapMaxY }, { x: bounds.minX, y: bounds.maxY }, { x: -1, y: 0 });
        } else {
            this.pushWallNormalSegment(segments, 'left', { x: bounds.minX, y: bounds.minY }, { x: bounds.minX, y: bounds.maxY }, { x: -1, y: 0 });
        }

        if (openingDirection === 'right') {
            this.pushWallNormalSegment(segments, 'right', { x: bounds.maxX, y: bounds.minY }, { x: bounds.maxX, y: gapMinY }, { x: 1, y: 0 });
            this.pushWallNormalSegment(segments, 'right', { x: bounds.maxX, y: gapMaxY }, { x: bounds.maxX, y: bounds.maxY }, { x: 1, y: 0 });
        } else {
            this.pushWallNormalSegment(segments, 'right', { x: bounds.maxX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }, { x: 1, y: 0 });
        }

        return segments;
    }

    buildRoofFootprint(component) {
        if (!component?.bounds) return null;
        const sourceBounds = component.interiorBounds || component.bounds;
        const roofInset = component.shelterEligible
            ? Math.max(2, Math.round((component.blockUnit?.width || component.averageBlockSize || 18) * 0.18))
            : 0;
        const insetBounds = {
            minX: sourceBounds.minX + roofInset,
            maxX: sourceBounds.maxX - roofInset,
            minY: sourceBounds.minY + roofInset,
            maxY: sourceBounds.maxY - roofInset
        };
        const usableBounds = (insetBounds.maxX > insetBounds.minX && insetBounds.maxY > insetBounds.minY)
            ? insetBounds
            : { ...sourceBounds };
        return {
            bounds: usableBounds,
            center: {
                x: (usableBounds.minX + usableBounds.maxX) / 2,
                y: (usableBounds.minY + usableBounds.maxY) / 2
            },
            stackCount: component.stacks?.length || 0,
            tallStackCount: component.tallStackCount || 0
        };
    }

    buildComponentCollisionGeometry(component) {
        if (!component) return null;
        const opening = component.openingProfile
            ? {
                direction: component.openingDirection || component.openingProfile.direction || null,
                width: component.openingWidth || 0,
                corridorBounds: component.openingProfile.corridorBounds ? { ...component.openingProfile.corridorBounds } : null,
                innerPoint: component.openingProfile.innerPoint ? { ...component.openingProfile.innerPoint } : null,
                outerPoint: component.openingProfile.outerPoint ? { ...component.openingProfile.outerPoint } : null,
                segmentStart: component.openingProfile.segmentStart ? { ...component.openingProfile.segmentStart } : null,
                segmentEnd: component.openingProfile.segmentEnd ? { ...component.openingProfile.segmentEnd } : null
            }
            : null;
        const wallNormals = this.buildWallNormals(component.bounds, component.openingDirection, component.openingProfile)
            .map((segment, index) => ({
                ...segment,
                id: `${component.id}:wall:${segment.side}:${index}`,
                componentId: component.id
            }));
        const occupancyColumns = (component.occupancyColumns || []).map(column => ({
            ...column,
            componentId: component.id
        }));
        const roofFootprint = this.buildRoofFootprint(component);
        return {
            componentId: component.id,
            shelterEligible: !!component.shelterEligible,
            bounds: component.bounds ? { ...component.bounds } : null,
            center: component.center ? { ...component.center } : null,
            entryPoint: component.entryPoint ? { ...component.entryPoint } : null,
            openingDirection: component.openingDirection || null,
            openingWidth: component.openingWidth || 0,
            opening,
            interiorBounds: component.interiorBounds ? { ...component.interiorBounds } : null,
            interiorPoint: component.interiorPoint ? { ...component.interiorPoint } : null,
            interiorClearance: component.interiorClearance || 0,
            interiorVolume: component.interiorBounds
                ? {
                    bounds: { ...component.interiorBounds },
                    point: component.interiorPoint ? { ...component.interiorPoint } : null,
                    clearance: component.interiorClearance || 0
                }
                : null,
            roofFootprint: roofFootprint
                ? {
                    ...roofFootprint,
                    componentId: component.id
                }
                : null,
            wallNormals,
            occupancyColumns,
            averageBlockSize: component.averageBlockSize || 0,
            stackCount: component.stacks?.length || 0
        };
    }

    buildZoneCollisionGeometry(zoneId, components = []) {
        const componentGeometry = components
            .map(component => this.buildComponentCollisionGeometry(component))
            .filter(Boolean);
        const openings = componentGeometry
            .filter(component => !!component.opening)
            .map(component => ({
                ...component.opening,
                componentId: component.componentId
            }));
        const roofs = componentGeometry
            .filter(component => !!component.roofFootprint)
            .map(component => ({ ...component.roofFootprint }));
        const wallNormals = componentGeometry.flatMap(component => component.wallNormals || []);
        const occupancyColumns = componentGeometry.flatMap(component => component.occupancyColumns || []);
        return {
            version: 'b2',
            zoneId,
            updatedAtFrame: gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : 0),
            componentCount: componentGeometry.length,
            shelterCount: componentGeometry.filter(component => component.shelterEligible).length,
            openingCount: openings.length,
            roofCount: roofs.length,
            wallNormalCount: wallNormals.length,
            occupancyColumnCount: occupancyColumns.length,
            components: componentGeometry,
            openings,
            roofs,
            wallNormals,
            occupancyColumns
        };
    }

    buildOccupancyColumns(stacks) {
        return (stacks || []).map(stack => ({
            id: stack.id,
            x: stack.x || 0,
            y: stack.y || 0,
            height: stack.height || 1,
            topBlockId: stack.topBlockId || null,
            baseBlockId: stack.baseBlockId || null,
            radius: this.getCanonicalBlockUnit(stack.height || 1).columnRadius
        }));
    }

    buildBlockProfile(block, component) {
        const blockMetrics = this.getEntityMetrics(block, 'block');
        const stack = component.stacks.find(entry => entry.blockIds.includes(block.id)) || null;
        const stackHeight = stack?.height || ((block.stackIndex ?? 0) + 1);
        const occupancyColumn = component.occupancyColumns?.find(entry => entry.id === stack?.id) || null;
        let structureRole = 'loose';
        if (component.shelterEligible) {
            const openingProximity = this.getDirectionalOpeningProximity(block, component);
            if ((stackHeight <= 1) && openingProximity < (component.blockUnit?.openingRoleThreshold || (component.averageBlockSize * 1.15))) {
                structureRole = 'opening';
            } else if ((block.stackIndex ?? 0) >= 2 || (stackHeight >= 3 && stack?.topBlockId === block.id)) {
                structureRole = 'roof';
            } else if (stackHeight >= 2 || (block.stackIndex ?? 0) > 0) {
                structureRole = 'wall';
            } else {
                structureRole = 'wall';
            }
        } else if ((block.stackIndex ?? 0) >= 2 || (stackHeight >= 3 && stack?.topBlockId === block.id)) {
            structureRole = 'roof';
        } else if (stackHeight >= 2 || (block.stackIndex ?? 0) > 0) {
            structureRole = 'wall';
        }

        return {
            id: block.id,
            zoneId: block.currentZoneId || null,
            componentId: component.id,
            stackId: stack?.id || null,
            x: block.x || 0,
            y: block.y || 0,
            renderWidth: block.renderWidth || 18,
            renderHeight: block.renderHeight || 18,
            footprintFamily: blockMetrics.family,
            footprintWidth: blockMetrics.width,
            stackIndex: block.stackIndex ?? 0,
            stackHeight,
            occupancyRadius: occupancyColumn?.radius || blockMetrics.occupancyRadius,
            supportBlockId: block.supportBlockId || null,
            structureRole: this.normalizeSpatialHookValue('structureRole', structureRole),
            shelterEligible: component.shelterEligible,
            openingDirection: component.openingDirection,
            openingWidth: component.openingWidth,
            blockUnitWidth: component.blockUnit?.width || component.averageBlockSize || 0,
            interiorBounds: component.interiorBounds ? { ...component.interiorBounds } : null,
            entryPoint: component.entryPoint ? { ...component.entryPoint } : null
        };
    }

    getDirectionalOpeningProximity(block, component) {
        if (!block || !component?.bounds) return Infinity;
        switch (component.openingDirection) {
            case 'left':
                return Math.abs((block.x || 0) - component.bounds.minX);
            case 'right':
                return Math.abs((block.x || 0) - component.bounds.maxX);
            case 'top':
                return Math.abs((block.y || 0) - component.bounds.minY);
            case 'bottom':
            default:
                return Math.abs((block.y || 0) - component.bounds.maxY);
        }
    }

    isPointInsideBounds(point, bounds) {
        if (!point || !bounds) return false;
        return point.x >= bounds.minX
            && point.x <= bounds.maxX
            && point.y >= bounds.minY
            && point.y <= bounds.maxY;
    }

    distancePointToSegment(point, start, end) {
        if (!point || !start || !end) return Infinity;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
            return Math.hypot(point.x - start.x, point.y - start.y);
        }
        const t = Math.max(0, Math.min(1, (((point.x - start.x) * dx) + ((point.y - start.y) * dy)) / ((dx * dx) + (dy * dy))));
        const projectedX = start.x + (dx * t);
        const projectedY = start.y + (dy * t);
        return Math.hypot(point.x - projectedX, point.y - projectedY);
    }

    expandBounds(bounds, margin = 0) {
        if (!bounds) return null;
        return {
            minX: bounds.minX - margin,
            maxX: bounds.maxX + margin,
            minY: bounds.minY - margin,
            maxY: bounds.maxY + margin
        };
    }

    getEntityMetrics(entity, entityType = null) {
        const { family, spec } = this.getEntityFootprintSpec(entity, entityType);
        const widthMode = spec.widthMode || 'fixed';
        const widthScale = spec.widthScale ?? 1;
        let rawWidth = spec.width ?? 12;

        if (widthMode === 'render-scale') {
            rawWidth = (entity?.renderWidth || spec.width || 18) * widthScale;
        } else if (widthMode === 'size-scale') {
            rawWidth = (entity?.size || spec.width || 12) * widthScale;
        }

        const width = Math.max(spec.minWidth || 10, rawWidth);
        const radius = Math.max(
            spec.minRadius || 6,
            spec.radius ?? (width * (spec.radiusScale ?? 0.5))
        );
        const clearance = spec.clearanceMode === 'stack-index-plus-one'
            ? Math.max(spec.minClearance || 1, (entity?.stackIndex || 0) + 1)
            : Math.max(spec.minClearance || 1, spec.clearance ?? 1);
        const stackHeight = Math.max(1, (entity?.stackIndex || 0) + 1);
        const occupancyRadius = spec.occupancyRadius != null
            ? spec.occupancyRadius
            : (spec.occupancyRadiusBase != null
                ? spec.occupancyRadiusBase + Math.max(0, stackHeight - 1) * (spec.occupancyRadiusPerStack || 0)
                : Math.max(radius, width * 0.9));
        const connectDistance = Math.max(
            spec.minConnectDistance || 42,
            spec.connectDistance ?? (width * (spec.connectDistanceScale ?? 3))
        );
        const columnRadius = spec.columnRadiusBase != null
            ? spec.columnRadiusBase + Math.max(0, stackHeight - 1) * (spec.columnRadiusPerStack || 0)
            : Math.max(10, Math.round(width * 0.44));
        const separationDistance = Math.max(
            spec.minSeparationDistance || 11,
            spec.separationDistance ?? (width * (spec.separationDistanceScale ?? 0.92))
        );

        return {
            family,
            width,
            radius,
            clearance,
            occupancyRadius,
            connectDistance,
            columnRadius,
            columnQueryRadius: Math.max(radius, width * (spec.columnQueryScale ?? 0.62)),
            openingConflictRadius: Math.max(radius, width * (spec.openingConflictScale ?? 0.92)),
            separationDistance
        };
    }

    getContainingShelter(zoneProfile, point) {
        if (!zoneProfile || !point) return null;
        return (zoneProfile.shelters || []).find(component =>
            component?.interiorBounds && this.isPointInsideBounds(point, component.interiorBounds)
        ) || null;
    }

    queryCollisionGeometry(zoneId, point, options = {}) {
        if (!zoneId || !point) return null;
        const cloneResults = options.cloneResults !== false;
        this.ensureRuntimeCaches();
        const cacheKey = this.buildCollisionQueryRuntimeCacheKey(zoneId, point, options);
        if (cacheKey && this.collisionQueryRuntimeCache.has(cacheKey)) {
            const cached = this.collisionQueryRuntimeCache.get(cacheKey);
            return cloneResults ? this.cloneCollisionQueryResult(cached) : cached;
        }
        const zoneGeometry = this.getZoneCollisionGeometryRef(zoneId);
        if (!zoneGeometry) return null;
        const currentPoint = {
            x: options.fromX ?? options.fromPoint?.x ?? options.entity?.x ?? point.x,
            y: options.fromY ?? options.fromPoint?.y ?? options.entity?.y ?? point.y
        };
        const components = zoneGeometry.components || [];
        let nearestComponent = null;
        let nearestComponentDistance = Infinity;
        let containingComponent = null;
        let nearestShelter = null;
        let nearestShelterDistance = Infinity;
        let containingShelter = null;
        for (const component of components) {
            if (!component) continue;
            const centerDistance = Math.hypot((component.center?.x || 0) - point.x, (component.center?.y || 0) - point.y);
            if (centerDistance < nearestComponentDistance) {
                nearestComponentDistance = centerDistance;
                nearestComponent = component;
            }
            if (!containingComponent && component?.bounds && this.isPointInsideBounds(point, component.bounds)) {
                containingComponent = component;
            }
            if (!component.shelterEligible) continue;
            if (centerDistance < nearestShelterDistance) {
                nearestShelterDistance = centerDistance;
                nearestShelter = component;
            }
            if (!containingShelter && component?.interiorVolume?.bounds && this.isPointInsideBounds(point, component.interiorVolume.bounds)) {
                containingShelter = component;
            }
        }
        const relevantShelter = containingShelter || nearestShelter || null;
        const opening = relevantShelter?.opening || null;
        const corridorBounds = opening?.corridorBounds
            ? this.expandBounds(opening.corridorBounds, options.corridorMargin || 0)
            : null;
        const inOpeningCorridor = !!opening?.corridorBounds
            && this.isPointInsideBounds(point, corridorBounds);
        const currentInOpeningCorridor = !!opening?.corridorBounds
            && this.isPointInsideBounds(currentPoint, corridorBounds);
        const occupancyRadius = Math.max(
            24,
            options.occupancyRadius
            || (options.entity ? this.getEntityMetrics(options.entity).radius * 3.2 : 54)
        );
        const nearbyOccupancyColumns = [];
        for (const column of zoneGeometry.occupancyColumns || []) {
            const distance = Math.hypot((column.x || 0) - point.x, (column.y || 0) - point.y);
            if (distance <= occupancyRadius) {
                nearbyOccupancyColumns.push({ column, distance });
            }
        }
        nearbyOccupancyColumns.sort((left, right) => left.distance - right.distance);
        const wallSource = containingComponent || relevantShelter || nearestComponent || null;
        let nearestWall = null;
        let nearestWallDistance = Infinity;
        for (const segment of wallSource?.wallNormals || []) {
            const distance = this.distancePointToSegment(point, segment.start, segment.end);
            if (distance < nearestWallDistance) {
                nearestWallDistance = distance;
                nearestWall = {
                    ...segment,
                    distance
                };
            }
        }

        const rawResult = {
            version: zoneGeometry.version || 'b2',
            zoneId,
            point: { x: point.x, y: point.y },
            currentPoint,
            nearestComponentId: nearestComponent?.componentId || null,
            containingComponentId: containingComponent?.componentId || null,
            nearestShelterId: nearestShelter?.componentId || null,
            containingShelterId: containingShelter?.componentId || null,
            relevantShelterId: relevantShelter?.componentId || null,
            insideShelter: !!containingShelter,
            inOpeningCorridor,
            currentInOpeningCorridor,
            openingWidth: opening?.width || 0,
            opening,
            interiorVolume: relevantShelter?.interiorVolume || null,
            roofFootprint: relevantShelter?.roofFootprint || null,
            wallNormal: nearestWall,
            nearbyOccupancyColumns: nearbyOccupancyColumns.map(entry => entry.column),
            relevantShelter
        };
        if (cacheKey) {
            this.collisionQueryRuntimeCache.set(cacheKey, rawResult);
        }
        return cloneResults ? this.cloneCollisionQueryResult(rawResult) : rawResult;
    }

    isPointWithinOpeningCorridor(component, point, margin = 0) {
        if (!component?.openingProfile?.corridorBounds || !point) return false;
        return this.isPointInsideBounds(point, this.expandBounds(component.openingProfile.corridorBounds, margin));
    }

    resolveBodyFitForEntity(entity, shelter) {
        const metrics = this.getEntityMetrics(entity);
        if (!shelter) return 'canPass';
        const openingWidth = shelter.openingWidth || 0;
        const interiorClearance = shelter.interiorClearance || 0;
        // A butterfly should be able to meaningfully use a shelter interior when the
        // opening and interior are at least roughly body-width, not dramatically larger.
        if (openingWidth >= metrics.width * 0.95 && interiorClearance >= metrics.width * 1.02) {
            return 'canShelterInside';
        }
        if (openingWidth >= metrics.width * 0.82 && interiorClearance >= metrics.width * 0.9) {
            return 'canPass';
        }
        return 'tooNarrow';
    }

    isTransitionBlockedForEntity(point, entity, zoneProfile, options = {}) {
        if (!zoneProfile || !entity || !point) return false;
        const currentPoint = {
            x: options.fromX ?? entity.x ?? 0,
            y: options.fromY ?? entity.y ?? 0
        };
        const currentQuery = this.queryCollisionGeometry(zoneProfile.zoneId, currentPoint, {
            entity,
            fromX: currentPoint.x,
            fromY: currentPoint.y,
            cloneResults: false
        });
        const targetQuery = this.queryCollisionGeometry(zoneProfile.zoneId, point, {
            entity,
            fromX: currentPoint.x,
            fromY: currentPoint.y,
            cloneResults: false
        });
        const relevantShelter = targetQuery?.relevantShelter || currentQuery?.relevantShelter || null;
        if (!relevantShelter?.interiorVolume?.bounds) return false;
        const currentInside = currentQuery?.insideShelter === true && currentQuery?.relevantShelterId === relevantShelter.componentId;
        const targetInside = targetQuery?.insideShelter === true && targetQuery?.relevantShelterId === relevantShelter.componentId;
        if (currentInside === targetInside) return false;
        const currentInCorridor = currentQuery?.inOpeningCorridor === true;
        const targetInCorridor = targetQuery?.inOpeningCorridor === true;
        return !(currentInCorridor || targetInCorridor);
    }

    isPointBlockedForEntity(x, y, entity, options = {}) {
        if (!entity || !Number.isFinite(x) || !Number.isFinite(y)) return false;
        const zoneId = options.zoneId || entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null;
        const zoneProfile = zoneId ? this.getZoneProfileRef(zoneId) : null;
        if (!zoneProfile) return false;
        const ignoreIds = new Set(options.ignoreBlockIds || []);
        const metrics = this.getEntityMetrics(entity);
        const clearance = metrics.clearance;

        for (const blockProfile of zoneProfile.blockProfiles) {
            if (ignoreIds.has(blockProfile.id)) continue;
            if (blockProfile.stackHeight <= clearance) continue;
            const radius = blockProfile.occupancyRadius || this.getEntityMetrics(blockProfile, 'block').occupancyRadius;
            if (Math.hypot(blockProfile.x - x, blockProfile.y - y) < radius) {
                return true;
            }
        }

        const targetPoint = { x, y };
        const currentShelter = this.getContainingShelter(zoneProfile, {
            x: options.fromX ?? entity.x ?? 0,
            y: options.fromY ?? entity.y ?? 0
        });
        const targetShelter = this.getContainingShelter(zoneProfile, targetPoint);
        const nearestShelter = targetShelter || currentShelter || this.getNearestShelter(zoneProfile, x, y);
        if (nearestShelter?.interiorBounds && this.isPointInsideBounds(targetPoint, nearestShelter.interiorBounds)) {
            const bodyFit = this.resolveBodyFitForEntity(entity, nearestShelter);
            if (bodyFit === 'tooNarrow') {
                return true;
            }
        }

        if (this.isTransitionBlockedForEntity(targetPoint, entity, zoneProfile, options)) {
            return true;
        }

        return false;
    }

    isBlockObstacleForEntity(block, entity) {
        const profile = this.getBlockProfileRef(block?.id);
        if (!profile || !entity) return false;
        const clearance = this.getEntityMetrics(entity).clearance;
        return profile.stackHeight > clearance;
    }

    getNearestShelter(zoneProfile, x, y) {
        let nearestShelter = null;
        let nearestDistance = Infinity;
        for (const shelter of zoneProfile?.shelters || []) {
            const distance = Math.hypot((shelter.center?.x || 0) - x, (shelter.center?.y || 0) - y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestShelter = shelter;
            }
        }
        return nearestShelter;
    }

    getSpatialContextForEntity(entity, gameState = gameCore?.gameState) {
        if (!entity) return null;
        const zoneId = entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null;
        this.ensureRuntimeCaches();
        const contextCacheKey = this.buildSpatialContextRuntimeCacheKey(entity, zoneId);
        if (contextCacheKey && this.spatialContextRuntimeCache.has(contextCacheKey)) {
            return this.spatialContextRuntimeCache.get(contextCacheKey);
        }
        const zoneProfile = zoneId ? this.getZoneProfileRef(zoneId) : null;
        const emptyContext = this.createDefaultSpatialContext({
            zoneId,
            occupancyBand: this.resolveOccupancyBandForEntity(entity, null),
            verticality: entity.blockInteraction?.carryingBlockId ? 'overhead' : 'ground'
        });
        if (!zoneProfile || zoneProfile.blockCount === 0) {
            return emptyContext;
        }

        const x = entity.x || 0;
        const y = entity.y || 0;
        const metrics = this.getEntityMetrics(entity);
        const geometryQuery = zoneId
            ? this.queryCollisionGeometry(zoneId, { x, y }, {
                entity,
                fromX: x,
                fromY: y,
                cloneResults: false
            })
            : null;
        const entityWidth = metrics.width;
        let nearbySolidCount = 0;
        let nearestProfile = null;
        let nearestProfileDistance = Infinity;
        for (const profile of zoneProfile.blockProfiles || []) {
            const distance = Math.hypot(profile.x - x, profile.y - y);
            if (distance > 92) continue;
            if (profile.stackHeight > metrics.clearance) {
                nearbySolidCount += 1;
            }
            if (distance < nearestProfileDistance) {
                nearestProfileDistance = distance;
                nearestProfile = profile;
            }
        }
        const obstacleDensity = this.clamp01(nearbySolidCount / 6);
        const nearestShelter = geometryQuery?.relevantShelter || null;
        const insideShelter = geometryQuery?.insideShelter === true;
        const openingWidth = geometryQuery?.openingWidth || 0;
        const bodyFit = this.resolveBodyFitForEntity(entity, nearestShelter);

        const passableSamples = this.countPassableSamples(entity, zoneId, 18);
        const pathState = passableSamples === 0
            ? 'trapped'
            : passableSamples <= 2
                ? 'obstructed'
                : passableSamples <= 5
                    ? 'enterable'
                    : 'open';

        const preferredShelterPoint = nearestShelter
            ? (insideShelter ? nearestShelter.interiorPoint : (nearestShelter.opening?.outerPoint || nearestShelter.entryPoint))
            : null;

        let structureRole = nearestProfile?.structureRole || 'loose';
        if (insideShelter) {
            structureRole = 'shelter';
        } else if (
            nearestShelter
            && (
                geometryQuery?.inOpeningCorridor
                || Math.hypot((nearestShelter.entryPoint?.x || 0) - x, (nearestShelter.entryPoint?.y || 0) - y) < Math.max(18, openingWidth * 0.8)
            )
        ) {
            structureRole = 'opening';
        }

        const occupancyBand = this.resolveOccupancyBandForEntity(entity, nearestProfile);
        const verticality = this.normalizeSpatialHookValue('verticality', occupancyBand);

        const context = {
            zoneId,
            verticality,
            structureRole: this.normalizeSpatialHookValue('structureRole', structureRole),
            pathState: this.normalizeSpatialHookValue('pathState', pathState),
            bodyFit: this.normalizeSpatialHookValue('bodyFit', bodyFit),
            occupancyBand,
            obstacleDensity,
            shelterCandidate: !!nearestShelter,
            canUseInterior: !!nearestShelter && bodyFit === 'canShelterInside',
            insideShelter,
            shelterConfidenceTarget: insideShelter ? 0.92 : nearestShelter ? 0.64 : 0.18,
            preferredShelterPoint,
            nearestComponentId: geometryQuery?.nearestComponentId || nearestProfile?.componentId || nearestShelter?.componentId || null,
            openingWidth,
            interiorClearance: nearestShelter?.interiorClearance || geometryQuery?.interiorVolume?.clearance || 0
        };
        if (contextCacheKey) {
            this.spatialContextRuntimeCache.set(contextCacheKey, context);
        }
        return context;
    }

    countPassableSamples(entity, zoneId, distance = 18) {
        const angles = [0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4, Math.PI, (Math.PI * 5) / 4, (Math.PI * 3) / 2, (Math.PI * 7) / 4];
        let passable = 0;
        for (const angle of angles) {
            const point = {
                x: (entity.x || 0) + Math.cos(angle) * distance,
                y: (entity.y || 0) + Math.sin(angle) * distance
            };
            if (!this.isPointBlockedForEntity(point.x, point.y, entity, { zoneId })) {
                passable += 1;
            }
        }
        return passable;
    }

    getPreferredShelterPointForEntity(entity, zoneId = entity?.currentZoneId || entity?.lifeSim?.lifecycle?.currentZoneId || null) {
        if (!entity || !zoneId) return null;
        const context = this.getSpatialContextForEntity(entity);
        if (!context?.shelterCandidate) return null;
        if (context.preferredShelterPoint) {
            return { ...context.preferredShelterPoint };
        }
        const zoneProfile = this.getZoneProfileRef(zoneId);
        const shelter = this.getNearestShelter(zoneProfile, entity.x || 0, entity.y || 0);
        return shelter?.openingProfile?.outerPoint
            ? { ...shelter.openingProfile.outerPoint }
            : shelter?.entryPoint
                ? { ...shelter.entryPoint }
                : null;
    }

    getCarryAnchorForEntity(entity, block) {
        if (!entity || !block) return null;
        const blockMetrics = this.getEntityMetrics(block, 'block');
        const entityMetrics = this.getEntityMetrics(entity);
        const blockWidth = Math.max(blockMetrics.width || 18, 18);
        const blockRadius = Math.max(blockMetrics.radius || 8, 8);
        const entityWidth = Math.max(entityMetrics.width || 12, 12);
        const target = entity.movement?.target
            ? gridManager?.isoToScreen?.(entity.movement.target.x, entity.movement.target.y)
            : null;
        const dx = (target?.x ?? entity.x + (entity.sex === 'F' ? -8 : 8)) - (entity.x || 0);
        const dy = (target?.y ?? entity.y) - (entity.y || 0);
        const length = Math.hypot(dx, dy) || 1;
        const dirX = dx / length;
        const dirY = dy / length;
        const normalX = -dirY;
        const normalY = dirX;
        const sideBias = entity.sex === 'F' ? -1 : 1;
        const sideDistance = Math.max(blockWidth * 0.34, entityWidth * 0.36);
        const trailDistance = Math.max(blockRadius * 0.45, 4);
        return {
            x: (entity.x || 0) + (normalX * sideDistance * sideBias) - (dirX * trailDistance),
            y: (entity.y || 0) - Math.max(blockWidth * 0.58, 10) + (normalY * sideDistance * 0.18 * sideBias) - (dirY * trailDistance * 0.2),
            zLift: 18 + Math.max(0, Math.round(blockWidth * 0.08))
        };
    }

    getCarryAnchorForGroundPoint(entity, block, groundPoint, options = {}) {
        if (!entity || !block || !groundPoint) return null;
        const blockMetrics = this.getEntityMetrics(block, 'block');
        const entityMetrics = this.getEntityMetrics(entity);
        const blockWidth = Math.max(blockMetrics.width || 18, 18);
        const blockRadius = Math.max(blockMetrics.radius || 8, 8);
        const entityWidth = Math.max(entityMetrics.width || 12, 12);
        const target = options.targetPoint
            || (entity.movement?.target
                ? gridManager?.isoToScreen?.(entity.movement.target.x, entity.movement.target.y)
                : null);
        const dx = (target?.x ?? groundPoint.x + (entity.sex === 'F' ? -8 : 8)) - groundPoint.x;
        const dy = (target?.y ?? groundPoint.y) - groundPoint.y;
        const length = Math.hypot(dx, dy) || 1;
        const dirX = dx / length;
        const dirY = dy / length;
        const normalX = -dirY;
        const normalY = dirX;
        const sideBias = entity.sex === 'F' ? -1 : 1;
        const sideDistance = Math.max(blockWidth * 0.34, entityWidth * 0.36);
        const trailDistance = Math.max(blockRadius * 0.45, 4);
        return {
            x: groundPoint.x + (normalX * sideDistance * sideBias) - (dirX * trailDistance),
            y: groundPoint.y - Math.max(blockWidth * 0.58, 10) + (normalY * sideDistance * 0.18 * sideBias) - (dirY * trailDistance * 0.2),
            zLift: 18 + Math.max(0, Math.round(blockWidth * 0.08))
        };
    }

    isCarryAnchorBlockedForEntity(entity, block, groundPoint, options = {}) {
        if (!entity || !block || !groundPoint) {
            return { blocked: false, anchor: null };
        }
        const zoneId = options.zoneId || block.currentZoneId || entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null;
        const anchor = this.getCarryAnchorForGroundPoint(entity, block, groundPoint, options);
        if (!anchor) {
            return { blocked: false, anchor: null };
        }
        const blocked = this.isPointBlockedForEntity(anchor.x, anchor.y, block, {
            zoneId,
            ignoreBlockIds: [block.id],
            fromX: options.fromX ?? block.x ?? anchor.x,
            fromY: options.fromY ?? block.y ?? anchor.y
        });
        return { blocked: !!blocked, anchor };
    }

    pointConflictsWithOpening(component, point, spacing = 0) {
        if (!component?.openingProfile || !point) return false;
        const blockUnit = component?.blockUnit || this.getCanonicalBlockUnit();
        const resolvedSpacing = Math.max(blockUnit.openingConflictRadius || 0, spacing || 0);
        return this.isPointWithinOpeningCorridor(component, point, Math.max(4, resolvedSpacing * 0.42));
    }

    validatePlacementTargetForBlock(butterfly, block, placement, candidateBlocks = []) {
        if (!butterfly || !block || !placement) return false;
        const zoneId = placement.zoneId || block.currentZoneId || butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || null;
        const zoneProfile = zoneId ? this.getZoneProfileRef(zoneId) : null;
        if (!zoneProfile) return false;
        const maxStackHeight = this.getMaxStackHeight();
        const requestedStackIndex = Math.max(0, placement.stackIndex ?? 0);
        if (requestedStackIndex >= maxStackHeight) {
            return false;
        }
        if (requestedStackIndex > 0 && !placement.supportBlockId) {
            return false;
        }

        const blockUnit = this.getCanonicalBlockUnit(requestedStackIndex + 1);
        const spacing = blockUnit.spacing;
        const openBlockIds = new Set(
            (candidateBlocks || [])
                .filter(entry => entry && entry.id !== block.id && !entry.carriedById && (entry.currentZoneId || null) === zoneId)
                .map(entry => entry.id)
        );
        const preferredComponent = zoneProfile.components.find(component => component.id === placement.componentId)
            || zoneProfile.components.find(component => component.id === placement.supportComponentId)
            || zoneProfile.shelters[0]
            || zoneProfile.components[0]
            || null;
        const point = { x: placement.x, y: placement.y };

        if (preferredComponent && this.pointConflictsWithOpening(preferredComponent, point, spacing)) {
            return false;
        }

        const ignoreBlockIds = [block.id];
        if (requestedStackIndex > 0 && placement.supportBlockId) {
            const supportProfile = this.blockProfiles.get(placement.supportBlockId);
            if (!supportProfile) {
                return false;
            }
            if (Math.hypot((supportProfile.x || 0) - point.x, (supportProfile.y || 0) - point.y) > blockUnit.supportAlignRadius) {
                return false;
            }

            const supportComponent = preferredComponent
                || zoneProfile.components.find(component => component.id === supportProfile.componentId)
                || null;
            const supportStack = supportComponent?.stacks?.find(stack =>
                stack?.blockIds?.includes?.(placement.supportBlockId)
            ) || null;
            if (!supportStack) {
                return false;
            }
            if (requestedStackIndex !== supportStack.height) {
                return false;
            }
            for (const supportId of supportStack.blockIds || []) {
                ignoreBlockIds.push(supportId);
            }
        }

        for (const blockId of openBlockIds) {
            if (ignoreBlockIds.includes(blockId)) continue;
            const profile = this.blockProfiles.get(blockId);
            if (!profile) continue;
            if (Math.hypot(profile.x - point.x, profile.y - point.y) < blockUnit.adjacencyClearance) {
                return false;
            }
        }

        if (this.isPointBlockedForEntity(point.x, point.y, block, {
            zoneId,
            ignoreBlockIds
        })) {
            return false;
        }

        if (!gameCore?.canResolveFlowerConflictsForBlockPlacement?.(zoneId, point, block)) {
            return false;
        }

        return true;
    }

    findSafeDropPlacementForBlock(butterfly, block, candidateBlocks = []) {
        if (!butterfly || !block) return null;
        const zoneId = block.currentZoneId || butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || null;
        if (!zoneId) return null;

        const attempts = [];
        const origin = {
            x: butterfly.x || 0,
            y: (butterfly.y || 0) + 4
        };
        const blockUnit = this.getCanonicalBlockUnit();
        attempts.push(origin);
        for (const radius of blockUnit.safeDropRadii) {
            for (const angle of [0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4, Math.PI, (Math.PI * 5) / 4, (Math.PI * 3) / 2, (Math.PI * 7) / 4]) {
                attempts.push({
                    x: origin.x + Math.cos(angle) * radius,
                    y: origin.y + Math.sin(angle) * radius
                });
            }
        }

        for (const point of attempts) {
            const clamped = gameCore?.clampPlacementPoint?.(point.x, point.y, blockUnit.clampPadding) || point;
            const placement = {
                x: clamped.x,
                y: clamped.y,
                stackIndex: 0,
                supportBlockId: null,
                placementMode: 'ground',
                zoneId
            };
            if (this.validatePlacementTargetForBlock(butterfly, block, placement, candidateBlocks)) {
                return placement;
            }
        }

        return null;
    }

    buildPerimeterPlacementPoint(component, side, spacing) {
        const bounds = component?.bounds;
        if (!bounds) return null;
        const blockUnit = component?.blockUnit || this.getCanonicalBlockUnit();
        const clampedSpacing = Math.max(blockUnit.width * 0.6, spacing);
        switch (side) {
            case 'left':
                return { x: bounds.minX - clampedSpacing * 0.45, y: component.center.y + random(-clampedSpacing, clampedSpacing) };
            case 'right':
                return { x: bounds.maxX + clampedSpacing * 0.45, y: component.center.y + random(-clampedSpacing, clampedSpacing) };
            case 'top':
                return { x: component.center.x + random(-clampedSpacing, clampedSpacing), y: bounds.minY - clampedSpacing * 0.4 };
            case 'bottom':
            default:
                return { x: component.center.x + random(-clampedSpacing, clampedSpacing), y: bounds.maxY + clampedSpacing * 0.4 };
        }
    }

    findPlacementTargetForBlock(butterfly, carriedBlock, candidateBlocks = []) {
        if (!butterfly || !carriedBlock) return null;
        const zoneId = carriedBlock.currentZoneId || butterfly.currentZoneId || butterfly.lifeSim?.lifecycle?.currentZoneId || null;
        const zoneProfile = zoneId ? this.getZoneProfileRef(zoneId) : null;
        if (!zoneProfile) return null;

        const blockUnit = this.getCanonicalBlockUnit((carriedBlock?.stackIndex || 0) + 1);
        const spacing = blockUnit.spacing;
        const openBlockIds = new Set(
            (candidateBlocks || [])
                .filter(block => block && block.id !== carriedBlock.id && !block.carriedById && (block.currentZoneId || null) === zoneId)
                .map(block => block.id)
        );
        const stacks = zoneProfile.components
            .flatMap(component => component.stacks.map(stack => ({ ...stack, componentId: component.id, component })))
            .filter(stack => stack.blockIds.some(blockId => openBlockIds.has(blockId)));

        const preferredComponent = stacks[0]?.component
            || zoneProfile.shelters[0]
            || zoneProfile.components[0]
            || null;

        const isClear = (point, placementMode = 'ground', stackIndex = 0, supportBlockId = null, componentId = preferredComponent?.id || null) =>
            this.validatePlacementTargetForBlock(
                butterfly,
                carriedBlock,
                {
                    x: point?.x,
                    y: point?.y,
                    stackIndex,
                    supportBlockId,
                    placementMode,
                    zoneId,
                    componentId,
                    supportComponentId: componentId
                },
                candidateBlocks
            );

        const nearestStack = stacks
            .slice()
            .sort((left, right) =>
                Math.hypot((left.x || 0) - butterfly.x, (left.y || 0) - butterfly.y)
                - Math.hypot((right.x || 0) - butterfly.x, (right.y || 0) - butterfly.y)
            )[0] || null;

        if (nearestStack && nearestStack.height < this.getMaxStackHeight()) {
            const stackedPlacement = {
                x: nearestStack.x,
                y: nearestStack.y,
                stackIndex: nearestStack.height,
                supportBlockId: nearestStack.topBlockId || nearestStack.baseBlockId || null,
                placementMode: 'stacked',
                zoneId,
                componentId: nearestStack.componentId || nearestStack.component?.id || null,
                supportComponentId: nearestStack.componentId || nearestStack.component?.id || null
            };
            if (this.validatePlacementTargetForBlock(butterfly, carriedBlock, stackedPlacement, candidateBlocks)) {
                return stackedPlacement;
            }
        }

        const perimeterComponent = nearestStack?.component
            || zoneProfile.shelters[0]
            || zoneProfile.components[0]
            || null;

        if (perimeterComponent) {
            const sideOrder = ['left', 'right', 'top', 'bottom']
                .filter(side => side !== perimeterComponent.openingDirection)
                .concat(perimeterComponent.openingDirection ? [perimeterComponent.openingDirection] : []);

            for (const side of sideOrder) {
                const proposed = this.buildPerimeterPlacementPoint(perimeterComponent, side, spacing);
                if (!proposed) continue;
                const clamped = gameCore?.clampPlacementPoint?.(proposed.x, proposed.y, blockUnit.clampPadding) || proposed;
                if (!isClear(clamped, 'connected', 0, nearestStack?.baseBlockId || null, perimeterComponent.id)) continue;
                return {
                    x: clamped.x,
                    y: clamped.y,
                    stackIndex: 0,
                    supportBlockId: nearestStack?.baseBlockId || null,
                    placementMode: 'connected',
                    zoneId,
                    componentId: perimeterComponent.id,
                    supportComponentId: perimeterComponent.id
                };
            }
        }

        for (let attempt = 0; attempt < 8; attempt++) {
            const angle = random(TWO_PI);
            const distance = random(blockUnit.groundFallbackMin, blockUnit.groundFallbackMax);
            const proposed = gameCore?.clampPlacementPoint?.(
                butterfly.x + Math.cos(angle) * distance,
                butterfly.y + Math.sin(angle) * distance,
                blockUnit.clampPadding
            ) || {
                x: butterfly.x + Math.cos(angle) * distance,
                y: butterfly.y + Math.sin(angle) * distance
            };
            if (!isClear(proposed, 'ground', 0, null, preferredComponent?.id || null)) continue;
            return {
                x: proposed.x,
                y: proposed.y,
                stackIndex: 0,
                supportBlockId: null,
                placementMode: 'ground',
                zoneId,
                componentId: preferredComponent?.id || null
            };
        }

        return null;
    }
}

const structureSystem = new StructureSystem();
