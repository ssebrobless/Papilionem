class ObjectSystem {
    constructor() {
        this.objectState = new Map();
        this.objectsByCarrierId = new Map();
        this.lastActivityDirtFrameByZone = new Map();
        this.environmentProjects = new Map();
        this.projectKeyIndex = new Map();
        this.initialized = false;
    }

    initialize() {
        this.initialized = true;
    }

    reset() {
        this.objectState.clear();
        this.objectsByCarrierId.clear();
        this.lastActivityDirtFrameByZone.clear();
        this.environmentProjects.clear();
        this.projectKeyIndex.clear();
    }

    registerObject(entity, metadata = {}) {
        if (!entity?.id) return null;
        const existing = this.objectState.get(entity.id) || {};
        const zoneId = typeof zoneSystem !== 'undefined'
            ? zoneSystem.getEntityZone?.(entity)?.id || null
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
        state.lastInteractionAt = gameCore?.getCurrentFrame?.() ?? (typeof frameCount === 'number' ? frameCount : Date.now());
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
        state.zoneId = typeof zoneSystem !== 'undefined'
            ? zoneSystem.getEntityZone?.(entity)?.id || null
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

    getSharedProjectConfig() {
        return gameConfig?.entities?.block?.shade?.sharedProjects || {};
    }

    isSharedProjectEnabled() {
        return this.getSharedProjectConfig()?.enabled !== false;
    }

    normalizeProjectCell(point = {}) {
        const boardPos = point.boardPos || point;
        if (!boardPos?.zoneId && !point.zoneId) return null;
        return {
            zoneId: boardPos.zoneId || point.zoneId,
            u: Math.round(Number(boardPos.u ?? point.u ?? 0)),
            v: Math.round(Number(boardPos.v ?? point.v ?? 0)),
            h: Math.max(0, Math.round(Number(boardPos.h ?? point.h ?? 0)))
        };
    }

    getShadeProjectKey(data = {}) {
        const zoneId = data.zoneId || data.constructionPoint?.boardPos?.zoneId || null;
        const cell = this.normalizeProjectCell(data.constructionPoint?.boardPos || data.boardPos || data.targetCell || data);
        const support = data.supportBlockId || data.supportBlockID || null;
        if (support) return `shadeShelter:${zoneId}:support:${support}`;
        if (cell) return `shadeShelter:${cell.zoneId}:${cell.u}:${cell.v}:${cell.h}`;
        return `shadeShelter:${zoneId}:unknown`;
    }

    createProjectId(type = 'project') {
        return `${type}_${gameCore?.getCurrentFrame?.() ?? 0}_${this.environmentProjects.size + 1}`;
    }

    cloneProject(project) {
        return project ? JSON.parse(JSON.stringify(project)) : null;
    }

    getEnvironmentProject(projectId) {
        return this.cloneProject(this.environmentProjects.get(projectId));
    }

    getEnvironmentProjects(filter = {}) {
        return [...this.environmentProjects.values()]
            .filter(project => !filter.type || project.type === filter.type)
            .filter(project => !filter.zoneId || project.zoneId === filter.zoneId)
            .filter(project => !filter.status || project.status === filter.status)
            .map(project => this.cloneProject(project));
    }

    ensureProjectContributor(project, contributorId, role = 'contributor', metadata = {}) {
        if (!project || !contributorId) return null;
        project.contributors = project.contributors || {};
        const existing = project.contributors[contributorId] || {
            id: contributorId,
            roles: [],
            contributions: 0,
            firstAtFrame: gameCore?.getCurrentFrame?.() ?? 0,
            lastAtFrame: gameCore?.getCurrentFrame?.() ?? 0,
            metadata: {}
        };
        if (role && !existing.roles.includes(role)) existing.roles.push(role);
        existing.lastAtFrame = gameCore?.getCurrentFrame?.() ?? 0;
        existing.metadata = {
            ...(existing.metadata || {}),
            ...metadata
        };
        project.contributors[contributorId] = existing;
        return existing;
    }

    ensureShadeShelterProject(data = {}) {
        if (!this.isSharedProjectEnabled()) return null;
        const projectKey = this.getShadeProjectKey(data);
        const existingId = this.projectKeyIndex.get(projectKey);
        const currentFrame = gameCore?.getCurrentFrame?.() ?? 0;
        if (existingId && this.environmentProjects.has(existingId)) {
            const existing = this.environmentProjects.get(existingId);
            if (existing.status !== 'abandoned') {
                existing.updatedAtFrame = currentFrame;
                return existing;
            }
            this.projectKeyIndex.delete(projectKey);
        }

        const zoneId = data.zoneId || data.constructionPoint?.boardPos?.zoneId || null;
        const activeInZone = [...this.environmentProjects.values()].filter(project =>
            project.zoneId === zoneId && project.status === 'active'
        );
        const maxActive = Math.max(1, Math.round(Number(this.getSharedProjectConfig()?.maxActiveProjectsPerZone ?? 6)));
        if (activeInZone.length >= maxActive) return null;

        const cell = this.normalizeProjectCell(data.constructionPoint?.boardPos || data.boardPos || data.targetCell || data);
        const project = {
            id: this.createProjectId('shadeShelter'),
            type: 'shadeShelter',
            status: 'active',
            projectKey,
            zoneId,
            targetCell: cell,
            supportBlockId: data.supportBlockId || null,
            createdById: data.requesterId || data.butterflyId || null,
            createdAtFrame: currentFrame,
            updatedAtFrame: currentFrame,
            completedAtFrame: null,
            requestedMaterials: { block: 2 },
            progress: {
                blockPlacements: 0,
                helperResponses: 0,
                shadeProgress: data.shadeProgress || null,
                createsShade: false,
                shadeIntentScore: data.shadeIntentScore ?? null
            },
            contributors: {},
            contributionLog: [],
            blockIds: []
        };
        this.environmentProjects.set(project.id, project);
        this.projectKeyIndex.set(projectKey, project.id);
        if (project.createdById) {
            this.ensureProjectContributor(project, project.createdById, 'creator');
        }
        eventBus?.emit?.('environment:project-created', {
            projectId: project.id,
            type: project.type,
            zoneId: project.zoneId,
            createdById: project.createdById,
            currentFrame
        });
        return project;
    }

    recordProjectContribution(projectId, contributorId, contributionType, metadata = {}) {
        const project = this.environmentProjects.get(projectId);
        if (!project || !contributorId) return null;
        const currentFrame = gameCore?.getCurrentFrame?.() ?? 0;
        const contributor = this.ensureProjectContributor(project, contributorId, contributionType || 'contributor', metadata);
        contributor.contributions += 1;
        contributor.lastAtFrame = currentFrame;
        const entry = {
            contributorId,
            contributionType: contributionType || 'contribution',
            atFrame: currentFrame,
            metadata: { ...metadata }
        };
        project.contributionLog.push(entry);
        if (project.contributionLog.length > 24) project.contributionLog.shift();
        project.updatedAtFrame = currentFrame;
        if (metadata.blockId && !project.blockIds.includes(metadata.blockId)) {
            project.blockIds.push(metadata.blockId);
        }
        eventBus?.emit?.('environment:project-contribution', {
            projectId,
            contributorId,
            contributionType: entry.contributionType,
            zoneId: project.zoneId,
            currentFrame
        });
        this.maybeCompleteEnvironmentProject(project);
        return this.cloneProject(project);
    }

    maybeCompleteEnvironmentProject(project) {
        if (!project || project.status === 'completed' || project.status === 'abandoned') return project;
        const config = this.getSharedProjectConfig();
        const contributorCount = Object.values(project.contributors || {})
            .filter(contributor => (contributor?.contributions || 0) > 0)
            .length;
        const minContributors = Math.max(1, Math.round(Number(config.completionRequiresContributors ?? 2)));
        const minPlacements = Math.max(1, Math.round(Number(config.completionRequiresPlacements ?? 1)));
        const hasShade = project.progress?.createsShade === true || project.progress?.shadeProgress === 'creates-shade';
        if (project.type === 'shadeShelter'
            && hasShade
            && contributorCount >= minContributors
            && (project.progress?.blockPlacements || 0) >= minPlacements) {
            project.status = 'completed';
            project.completedAtFrame = gameCore?.getCurrentFrame?.() ?? 0;
            const socialPayoff = lifeSimSystem?.recordSharedProjectCompletion?.(project, gameCore?.gameState) || null;
            eventBus?.emit?.('environment:project-completed', {
                projectId: project.id,
                type: project.type,
                zoneId: project.zoneId,
                contributorIds: Object.keys(project.contributors || {}),
                contributorRoles: Object.fromEntries(Object.entries(project.contributors || {})
                    .map(([id, contributor]) => [id, {
                        roles: [...(contributor.roles || [])],
                        roleLabel: contributor.metadata?.roleLabel || null,
                        contributions: contributor.contributions || 0
                    }])),
                blockIds: [...(project.blockIds || [])],
                memoryCount: socialPayoff?.memories?.length || 0,
                edgeUpdateCount: socialPayoff?.edgeUpdates?.length || 0,
                currentFrame: project.completedAtFrame
            });
        }
        return project;
    }

    getSharedProjectFailureFeedbackConfig() {
        const config = this.getSharedProjectConfig()?.failureFeedback || {};
        return {
            enabled: config.enabled !== false,
            abandonAfterFrames: Math.max(300, Math.round(Number(config.abandonAfterFrames ?? 1800)))
        };
    }

    abandonEnvironmentProject(project, reason = 'timeout') {
        if (!project || project.status !== 'active') return null;
        const currentFrame = gameCore?.getCurrentFrame?.() ?? 0;
        project.status = 'abandoned';
        project.abandonedAtFrame = currentFrame;
        project.abandonedReason = reason;
        project.updatedAtFrame = currentFrame;
        const failureFeedback = lifeSimSystem?.recordSharedProjectAbandonment?.(project, gameCore?.gameState, { reason }) || null;
        eventBus?.emit?.('environment:project-abandoned', {
            projectId: project.id,
            type: project.type,
            zoneId: project.zoneId,
            createdById: project.createdById || null,
            invitedHelperIds: Object.values(project.contributors || {})
                .filter(contributor => (contributor?.roles || []).includes('invited-helper'))
                .map(contributor => contributor.id),
            memoryCount: failureFeedback?.memories?.length || 0,
            edgeUpdateCount: failureFeedback?.edgeUpdates?.length || 0,
            reason,
            currentFrame
        });
        return this.cloneProject(project);
    }

    updateEnvironmentProjectTimeouts() {
        const config = this.getSharedProjectFailureFeedbackConfig();
        if (!config.enabled) return { abandoned: 0, skipped: 'disabled' };
        const currentFrame = gameCore?.getCurrentFrame?.() ?? 0;
        let abandoned = 0;
        for (const project of this.environmentProjects.values()) {
            if (project?.status !== 'active') continue;
            const createdAtFrame = Number.isFinite(project.createdAtFrame) ? project.createdAtFrame : currentFrame;
            const ageFrames = currentFrame - createdAtFrame;
            const hasPlacement = (project.progress?.blockPlacements || 0) > 0;
            if (hasPlacement || ageFrames < config.abandonAfterFrames) continue;
            if (this.abandonEnvironmentProject(project, 'timeout-no-placement')) {
                abandoned += 1;
            }
        }
        return { abandoned };
    }

    recordShadeProjectRequest(data = {}) {
        const project = this.ensureShadeShelterProject(data);
        if (!project) return null;
        const requesterId = data.requesterId || data.butterflyId || data.createdById || null;
        if (requesterId) {
            this.recordProjectContribution(project.id, requesterId, 'project-request', {
                signalId: data.signalId || null,
                blockId: data.blockId || null,
                supportBlockId: data.supportBlockId || project.supportBlockId || null,
                shadeProgress: data.shadeProgress || null
            });
        }
        for (const helperId of data.helperIds || []) {
            this.ensureProjectContributor(project, helperId, 'invited-helper');
        }
        project.progress.shadeProgress = data.shadeProgress || project.progress.shadeProgress || null;
        project.progress.shadeIntentScore = data.shadeIntentScore ?? project.progress.shadeIntentScore ?? null;
        project.updatedAtFrame = gameCore?.getCurrentFrame?.() ?? 0;
        return this.cloneProject(project);
    }

    findShadeProject(data = {}) {
        const projectId = data.projectId || null;
        if (projectId && this.environmentProjects.has(projectId)) {
            return this.environmentProjects.get(projectId);
        }
        const key = this.getShadeProjectKey(data);
        const indexed = this.projectKeyIndex.get(key);
        return indexed ? this.environmentProjects.get(indexed) || null : null;
    }

    recordShadeProjectPlacement(data = {}) {
        const project = this.findShadeProject(data) || this.ensureShadeShelterProject(data);
        if (!project) return null;
        project.progress.blockPlacements = Math.max(0, project.progress.blockPlacements || 0) + 1;
        project.progress.shadeProgress = data.shadeProgress || project.progress.shadeProgress || null;
        project.progress.createsShade = project.progress.createsShade === true || data.createsShade === true;
        project.progress.shadeIntentScore = data.shadeIntentScore ?? project.progress.shadeIntentScore ?? null;
        return this.recordProjectContribution(project.id, data.butterflyId || data.helperId || data.actorId, 'block-placement', {
            blockId: data.blockId || null,
            supportBlockId: data.supportBlockId || project.supportBlockId || null,
            createsShade: data.createsShade === true,
            shadeProgress: data.shadeProgress || null,
            roleLabel: data.roleLabel || null
        });
    }

    recordShadeProjectFollowthrough(data = {}) {
        const project = this.findShadeProject(data);
        if (!project) return null;
        project.progress.helperResponses = Math.max(0, project.progress.helperResponses || 0) + 1;
        return this.recordProjectContribution(project.id, data.helperId || data.butterflyId || data.actorId, 'helper-followthrough', {
            requesterId: data.requesterId || null,
            blockId: data.blockId || null,
            createsShade: data.createsShade === true,
            shadeProgress: data.shadeProgress || null,
            roleLabel: data.roleLabel || null
        });
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

    getCleanupActivityConfig() {
        const config = gameConfig?.cognition?.affordances?.cleanupActivityDirt || {};
        return {
            enabled: config.enabled !== false && gameConfig?.cognition?.affordances?.cleanupSocialModulation !== false,
            intervalFrames: Math.max(300, Math.round(config.intervalFrames || 3600)),
            minActiveButterflies: Math.max(1, Math.round(config.minActiveButterflies || 3)),
            maxPilesPerZone: Math.max(1, Math.round(config.maxPilesPerZone || 3)),
            maxTotalPiles: Math.max(1, Math.round(config.maxTotalPiles || 12)),
            activityScale: Math.max(0, Number(config.activityScale ?? 0.34))
        };
    }

    getEntityZoneId(entity, fallback = null) {
        return gameCore?.getEntityZoneId?.(entity, fallback)
            || entity?.currentZoneId
            || entity?.boardPos?.zoneId
            || fallback;
    }

    getZoneDirtPiles(zoneId, gameState = gameCore?.gameState) {
        return (gameState?.flowers || []).filter(flower =>
            flower?.lifecycleKind === 'dirt-pile'
            && this.getEntityZoneId(flower, null) === zoneId
        );
    }

    getActivityDirtBoardPoint(zoneId, zoneIndex = 0, currentFrame = 0) {
        const config = zoneSystem?.getBoardConfigForZone?.(zoneId) || {};
        const width = Math.max(8, Math.round(config.widthUnits || 28));
        const depth = Math.max(8, Math.round(config.depthUnits || 22));
        const seed = Math.abs(String(zoneId || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0))
            + zoneIndex * 17
            + Math.floor(currentFrame / 900) * 7;
        return {
            zoneId,
            u: 3 + (seed % Math.max(1, width - 6)),
            v: 4 + ((seed * 5) % Math.max(1, depth - 8)),
            h: 0
        };
    }

    spawnActivityDirtPile(zoneId, options = {}) {
        const boardPos = this.getActivityDirtBoardPoint(zoneId, options.zoneIndex || 0, options.currentFrame || 0);
        const screen = renderManager?.boardToScreen?.(boardPos);
        if (!screen) return null;
        const flower = gameCore?.spawnFlowerAt?.(zoneId, screen.x, screen.y, {
            exactPoint: true,
            preferredPoint: screen,
            ignoreZoneFlowerCap: true,
            allowFlowerOverlap: false,
            minDistance: gameConfig?.entities?.flower?.spawnMinDistance || 52,
            persistentUntilConsumed: true,
            resourceOrigin: 'cleanup-activity-dirt'
        });
        const dirt = gameCore?.transformFlowerToDirtPile?.(flower, {
            source: 'cleanup-activity-dirt'
        });
        if (dirt) {
            dirt.resourceOrigin = 'cleanup-activity-dirt';
            dirt.boardPos = dirt.boardPos || { ...boardPos };
            dirt.syncDebugGridPos?.();
            this.syncEntityProfile(dirt);
        }
        return dirt || null;
    }

    updateActivityDirtPressure(gameState = gameCore?.gameState) {
        const config = this.getCleanupActivityConfig();
        if (!config.enabled || !gameState) return { spawned: 0, skipped: 'disabled' };
        const currentFrame = gameCore?.getCurrentFrame?.() ?? gameState.currentFrame ?? 0;
        const zones = gameCore?.getZoneIds?.() || [];
        const totalPiles = (gameState.flowers || []).filter(flower => flower?.lifecycleKind === 'dirt-pile').length;
        if (totalPiles >= config.maxTotalPiles) return { spawned: 0, skipped: 'total-cap', totalPiles };
        let spawned = 0;
        zones.forEach((zoneId, zoneIndex) => {
            if (spawned || totalPiles + spawned >= config.maxTotalPiles) return;
            const lastFrame = this.lastActivityDirtFrameByZone.get(zoneId) ?? -Infinity;
            if (currentFrame - lastFrame < config.intervalFrames) return;
            const activeButterflies = (gameState.butterflies || []).filter(entity =>
                entity?.id
                && !entity.dead
                && this.getEntityZoneId(entity, null) === zoneId
                && entity.state !== 'sleeping'
                && entity.state !== 'mating'
                && !entity.zoneTravel
            );
            if (activeButterflies.length < config.minActiveButterflies) return;
            const zonePiles = this.getZoneDirtPiles(zoneId, gameState);
            if (zonePiles.length >= config.maxPilesPerZone) return;
            const cleanupPressure = activeButterflies.reduce((sum, entity) => {
                const drives = entity.lifeSim?.drives || {};
                return sum
                    + Math.max(0, drives.caregiving || 0) * 0.45
                    + Math.max(0, drives.statusExpression || 0) * 0.28
                    + Math.max(0, drives.selfMaintenance || 0) * 0.18;
            }, 0) / Math.max(1, activeButterflies.length);
            if (cleanupPressure < config.activityScale) return;
            if (this.spawnActivityDirtPile(zoneId, { zoneIndex, currentFrame })) {
                this.lastActivityDirtFrameByZone.set(zoneId, currentFrame);
                spawned += 1;
            }
        });
        return { spawned };
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
        this.updateEnvironmentProjectTimeouts();
        this.updateActivityDirtPressure(gameState);
    }
}

const objectSystem = new ObjectSystem();
