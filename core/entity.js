// Base class for all game entities (butterflies, flowers, etc)
let __entityIdCounter = 0;

function generateEntityId(prefix = 'entity') {
    __entityIdCounter++;
    return `${prefix}_${Date.now()}_${__entityIdCounter}`;
}

function createDriveProfile(overrides = {}) {
    return {
        selfMaintenance: 0,
        safetyAvoidance: 0,
        resourceControl: 0,
        socialConnection: 0,
        caregiving: 0,
        exploration: 0,
        statusExpression: 0,
        rest: 0,
        ...overrides
    };
}

function createEmotionProfile(overrides = {}) {
    return {
        threat: 0,
        relief: 0,
        attachment: 0,
        rejection: 0,
        significance: 0,
        failure: 0,
        curiosity: 0,
        agitation: 0,
        exhaustion: 0,
        ...overrides
    };
}

function createMemoryStore() {
    return {
        place: [],
        object: [],
        interaction: [],
        outcome: [],
        routine: [],
        social: [],
        danger: [],
        care: []
    };
}

function createRoutineStore() {
    return {
        movement: [],
        social: [],
        care: [],
        resource: [],
        rest: [],
        vigilance: [],
        teaching: []
    };
}

function createDistortionProfile(overrides = {}) {
    return {
        traumaBias: 0,
        anxietyBias: 0,
        withdrawalBias: 0,
        fixationBias: 0,
        insomniaBias: 0,
        oversleepBias: 0,
        warpedTeachingBias: 0,
        ...overrides
    };
}

function createCommunicationProfile(overrides = {}) {
    return {
        expressiveness: 0.5,
        receptivity: 0.5,
        clarityBias: 0,
        lexicon: {},
        knownNames: {},
        selfName: null,
        activeSignal: null,
        activeConversation: null,
        recentEmitted: [],
        recentReceived: [],
        recentConversations: [],
        recentDialogues: [],
        recentResidues: [],
        retainedLessons: [],
        pendingUtterances: [],
        lastSpokenAtSeconds: null,
        lastHeardAtSeconds: null,
        ...overrides
    };
}

function createSocialProfile(overrides = {}) {
    return {
        reputation: 0.2,
        belonging: 0.2,
        confidence: 0.2,
        focus: 'rest',
        activeContext: 'wandering',
        ...overrides
    };
}

function createPlayerInteractionProfile(overrides = {}) {
    return {
        cursorTrust: 0,
        cursorFear: 0,
        petHistory: 0,
        clapStartleHistory: 0,
        calmedByCursor: false,
        startledByCursor: false,
        lastPetAtSeconds: null,
        lastClapAtSeconds: null,
        ...overrides
    };
}

function createObjectAwarenessProfile(overrides = {}) {
    return {
        focusType: 'none',
        currentAffordance: 'observe',
        carryingType: null,
        recentAffordances: [],
        flowerFamiliarity: 0,
        pollenFamiliarity: 0,
        eggFamiliarity: 0,
        blockFamiliarity: 0,
        shelterConfidence: 0,
        ...overrides
    };
}

function createSpatialAwarenessProfile(overrides = {}) {
    const defaultSpatial = typeof structureSystem !== 'undefined' && structureSystem?.createDefaultSpatialContext
        ? structureSystem.createDefaultSpatialContext()
        : {
            verticality: 'ground',
            structureRole: 'loose',
            pathState: 'open',
            bodyFit: 'canPass',
            occupancyBand: 'ground',
            obstacleDensity: 0,
            shelterCandidate: false,
            canUseInterior: false,
            insideShelter: false
        };
    return {
        ...defaultSpatial,
        ...overrides
    };
}

function createProgressionContextProfile(overrides = {}) {
    return {
        originType: 'wild',
        rarityExposure: 0,
        variantFamiliarity: 0,
        lineageValue: 0,
        encounterValue: 0,
        ...overrides
    };
}

function createBattleContextProfile(overrides = {}) {
    return {
        allyPressure: 0,
        enemyThreat: 0,
        targetPriority: 0,
        spacingState: 'open',
        retreatPressure: 0,
        supportOpportunity: 0,
        ...overrides
    };
}

function createMigrationProfile(overrides = {}) {
    return {
        homeZoneId: overrides.homeZoneId || null,
        homeZoneStrength: Math.max(0, Math.min(1, overrides.homeZoneStrength ?? 0)),
        zoneAffinities: { ...(overrides.zoneAffinities || {}) },
        zoneVisitCounts: { ...(overrides.zoneVisitCounts || {}) },
        zoneDwellSeconds: { ...(overrides.zoneDwellSeconds || {}) },
        lastObservedZoneId: overrides.lastObservedZoneId || null,
        lastTravelReason: overrides.lastTravelReason || null,
        lastTravelAtSeconds: Number.isFinite(overrides.lastTravelAtSeconds) ? overrides.lastTravelAtSeconds : null,
        lastSyncedTravelFrame: Number.isFinite(overrides.lastSyncedTravelFrame) ? overrides.lastSyncedTravelFrame : null,
        completedTravelCount: Math.max(0, overrides.completedTravelCount || 0),
        homeReturnCount: Math.max(0, overrides.homeReturnCount || 0),
        scoutingTripCount: Math.max(0, overrides.scoutingTripCount || 0),
        recentTravelReasons: [...(overrides.recentTravelReasons || [])]
    };
}

function createSocialEcologyChannelProfile(label = 'quiet', overrides = {}) {
    return {
        label,
        score: 0,
        nearbyCount: 0,
        supportCount: 0,
        targetedCount: 0,
        anchorId: null,
        anchorLabel: null,
        detail: 'quiet',
        ...overrides
    };
}

function createSocialEcologyProfile(overrides = {}) {
    return {
        primaryRhythm: 'wandering',
        primaryScore: 0,
        headline: 'quiet | no strong local rhythm',
        detail: 'roost 0 | warn 0 | teach 0 | court 0',
        localFieldLabel: 'quiet | no active field',
        localFieldDetail: 'No nearby active signals',
        anchorZoneId: overrides.anchorZoneId || null,
        preferredShelterId: overrides.preferredShelterId || null,
        preferredPartnerId: overrides.preferredPartnerId || null,
        roosting: createSocialEcologyChannelProfile('roost', overrides.roosting),
        warning: createSocialEcologyChannelProfile('warning', overrides.warning),
        teaching: createSocialEcologyChannelProfile('teaching', overrides.teaching),
        courtship: createSocialEcologyChannelProfile('courtship', overrides.courtship)
    };
}

function createDerivedLifeSimProfile(overrides = {}) {
    const { socialEcology: socialEcologyOverrides = null, ...restOverrides } = overrides || {};
    return {
        dominantDrive: 'rest',
        secondaryDrive: 'exploration',
        dominantEmotion: 'curiosity',
        secondaryEmotion: 'relief',
        drivePeaks: [],
        emotionPeaks: [],
        crowding: 0,
        novelty: 0,
        derivedFeelings: {
            loneliness: 0,
            comfortSeeking: 0,
            socialInsecurity: 0,
            jealousy: 0,
            grief: 0,
            pride: 0,
            shame: 0,
            loyaltyBias: 0,
            dominant: 'steady',
            motiveBias: null,
            targetPartnerId: null,
            updatedAtFrame: 0
        },
        behaviorBiases: {
            wanderScale: 1,
            feedUrgency: 0,
            displayConfidence: 0,
            socialConfidence: 0,
            caution: 0,
            trainingAffinity: 0,
            objectInterest: 0,
            cursorAffinity: 0,
            shelterSeeking: 0,
            battleAggression: 0,
            migrationUrgency: 0,
            returnHomeBias: 0,
            noveltySeeking: 0,
            mateSeeking: 0,
            overcrowdingEscape: 0,
            homeAffinity: 0
        },
        migration: {
            homeZoneId: null,
            homeZoneStrength: 0,
            currentZoneAffinity: 0,
            preferredZoneId: null,
            scoutTargetZoneId: null,
            preferredMateZoneId: null,
            travelTargetZoneId: null,
            travelIntent: 'settling',
            visitedZoneCount: 0,
            awayFromHome: false,
            returnHomeBias: 0,
            scoutingDrive: 0,
            overcrowdingEscape: 0,
            mateSeeking: 0,
            travelUrgency: 0,
            noveltySeeking: 0,
            zoneMateOpportunities: {}
        },
        socialEcology: createSocialEcologyProfile(socialEcologyOverrides || {}),
        lastUpdatedSeconds: 0,
        lastUpdatedFrame: 0,
        cadenceIntervalFrames: 1,
        ...restOverrides
    };
}

function createGeneticsProfile(options = {}) {
    return {
        source: options.source || 'wild',
        baselineTraits: { ...(options.baselineTraits || {}) },
        inheritedTraits: { ...(options.inheritedTraits || {}) },
        mutationProfile: options.mutationProfile ? { ...(options.mutationProfile || {}) } : null,
        heritageTags: [...(options.heritageTags || [])],
        lineageTypes: [...(options.lineageTypes || [])],
        lineageDepth: Math.max(0, options.lineageDepth || 0),
        lineageIds: {
            parents: [...(options.parentIds || [])],
            ancestors: [...(options.ancestorIds || [])]
        }
    };
}

function createLifecycleProfile(overrides = {}) {
    return {
        stage: overrides.stage || 'adult',
        ageTicks: overrides.ageTicks || 0,
        deathState: overrides.deathState || null,
        upbringingState: overrides.upbringingState || null
    };
}

function createSelfModelProfile(overrides = {}) {
    const assessment = overrides.currentSelfAssessment || {};
    const perceived = overrides.perceivedByOthersBelief || {};
    return {
        predictedNextEmotion: overrides.predictedNextEmotion || 'steady',
        currentSelfAssessment: {
            confidence: Math.max(0, Math.min(1, assessment.confidence ?? 0.35)),
            roleGuess: assessment.roleGuess || 'wanderer',
            dominantDrive: assessment.dominantDrive || null,
            dominantEmotion: assessment.dominantEmotion || null,
            workspaceFocus: assessment.workspaceFocus || null
        },
        perceivedByOthersBelief: {
            mood: perceived.mood || 'unknown',
            intent: perceived.intent || 'unknown',
            reputationEstimate: Math.max(0, Math.min(1, perceived.reputationEstimate ?? 0.2)),
            socialContext: perceived.socialContext || 'quiet'
        },
        divergenceFromActual: Math.max(0, Math.min(1, overrides.divergenceFromActual ?? 0)),
        predictedNextEmotionIntensity: Math.max(0, Math.min(1, overrides.predictedNextEmotionIntensity ?? 0)),
        actualEmotion: overrides.actualEmotion || null,
        initialized: !!overrides.initialized,
        lastUpdatedTick: Number.isFinite(overrides.lastUpdatedTick) ? overrides.lastUpdatedTick : 0
    };
}

function createBaseLifeSimState(options = {}) {
    return {
        identity: {
            entityType: options.entityType || 'entity',
            archetype: options.archetype || options.entityType || 'entity',
            source: options.source || 'wild'
        },
        drives: createDriveProfile(options.drives),
        emotions: createEmotionProfile(options.emotions),
        memories: createMemoryStore(),
        socialEdges: {},
        social: createSocialProfile(options.social),
        routines: createRoutineStore(),
        interpretation: {
            clarity: 1,
            lastSignals: [],
            warpedSignals: 0
        },
        communication: createCommunicationProfile(options.communication),
        distortion: createDistortionProfile(options.distortion),
        derived: createDerivedLifeSimProfile(options.derived),
        playerInteraction: createPlayerInteractionProfile(options.playerInteraction),
        objectAwareness: createObjectAwarenessProfile(options.objectAwareness),
        spatialAwareness: createSpatialAwarenessProfile(options.spatialAwareness),
        progression: createProgressionContextProfile(options.progression),
        battleContext: createBattleContextProfile(options.battleContext),
        migration: createMigrationProfile(options.migration),
        genetics: createGeneticsProfile(options.genetics),
        upbringing: {
            imprintSources: [...(options.imprintSources || [])],
            lessons: [],
            routineReinforcement: {}
        },
        lifecycle: createLifecycleProfile(options.lifecycle),
        selfModel: createSelfModelProfile(options.selfModel)
    };
}

function createObjectProfile(options = {}) {
    return {
        entityType: options.entityType || 'object',
        subtype: options.subtype || 'generic',
        resourceTags: [...(options.resourceTags || [])],
        carryable: !!options.carryable,
        consumable: !!options.consumable,
        occupancyState: options.occupancyState || 'normal',
        lifecycleStage: options.lifecycleStage || null
    };
}

function clampLifeSimUnit(value) {
    return Math.max(0, Math.min(1, value ?? 0));
}

function appendLifeMemory(entity, family, packet = {}) {
    const store = entity?.lifeSim?.memories?.[family];
    if (!Array.isArray(store)) return null;

    const normalized = {
        id: packet.id || `${family}_memory_${entity.id}_${Date.now()}_${store.length + 1}`,
        family,
        subjectId: packet.subjectId || null,
        valence: packet.valence ?? 0,
        strength: clampLifeSimUnit(packet.strength ?? 0.25),
        recency: packet.recency ?? 1,
        reinforcementCount: packet.reinforcementCount ?? 1,
        emotionalColoring: { ...(packet.emotionalColoring || {}) },
        warped: !!packet.warped,
        tags: [...(packet.tags || [])],
        createdAtSeconds: packet.createdAtSeconds ?? null,
        metadata: { ...(packet.metadata || {}) }
    };

    store.unshift(normalized);
    if (store.length > 24) {
        store.length = 24;
    }
    return normalized;
}

function ensureLifeSocialEdge(entity, targetId) {
    if (!entity?.lifeSim || !targetId) return null;
    if (!entity.lifeSim.socialEdges[targetId]) {
        entity.lifeSim.socialEdges[targetId] = {
            trust: 0,
            comfort: 0,
            attachment: 0,
            dependence: 0,
            rivalry: 0,
            resentment: 0,
            admiration: 0,
            protectiveness: 0,
            reciprocityScore: 0,
            rejectionWeight: 0,
            followThroughScore: 0,
            forgivenessWeight: 0,
            recentWarmth: 0,
            recentEase: 0,
            recentFriction: 0,
            recentMutualAttention: 0,
            lastConversationMode: 'easy',
            lastConversationAtSeconds: null,
            repairState: 'steady',
            recentResidues: [],
            lastDialogueResidue: null,
            anchoringDialogueCount: 0,
            learnedDialogueCount: 0,
            bondTier: 'acquaintance',
            coTimeSeconds: 0,
            lastTierChangeAtFrame: null,
            loyalty: 0,
            lastUpdatedSeconds: null,
            historyTags: []
        };
    }
    const edge = entity.lifeSim.socialEdges[targetId];
    edge.historyTags = Array.isArray(edge.historyTags) ? edge.historyTags : [];
    edge.recentResidues = Array.isArray(edge.recentResidues) ? edge.recentResidues : [];
    edge.repairState = edge.repairState || 'steady';
    edge.reciprocityScore = edge.reciprocityScore ?? 0;
    edge.rejectionWeight = edge.rejectionWeight ?? 0;
    edge.followThroughScore = edge.followThroughScore ?? 0;
    edge.forgivenessWeight = edge.forgivenessWeight ?? 0;
    edge.recentWarmth = edge.recentWarmth ?? 0;
    edge.recentEase = edge.recentEase ?? 0;
    edge.recentFriction = edge.recentFriction ?? 0;
    edge.recentMutualAttention = edge.recentMutualAttention ?? 0;
    edge.lastConversationMode = edge.lastConversationMode || 'easy';
    edge.lastConversationAtSeconds = edge.lastConversationAtSeconds ?? null;
    edge.anchoringDialogueCount = edge.anchoringDialogueCount ?? 0;
    edge.learnedDialogueCount = edge.learnedDialogueCount ?? 0;
    edge.bondTier = edge.bondTier || 'acquaintance';
    edge.coTimeSeconds = Math.max(0, edge.coTimeSeconds || 0);
    edge.lastTierChangeAtFrame = edge.lastTierChangeAtFrame ?? null;
    edge.loyalty = edge.loyalty ?? 0;
    return edge;
}

function adjustLifeSocialEdge(entity, targetId, deltas = {}, metadata = {}) {
    const edge = ensureLifeSocialEdge(entity, targetId);
    if (!edge) return null;

    const edgeFamilies = [
        'trust',
        'comfort',
        'attachment',
        'dependence',
        'rivalry',
        'resentment',
        'admiration',
        'protectiveness'
    ];

    for (const family of edgeFamilies) {
        if (typeof deltas[family] !== 'number') continue;
        edge[family] = clampLifeSimUnit(edge[family] + deltas[family]);
    }

    edge.lastUpdatedSeconds = metadata.updatedAtSeconds ?? edge.lastUpdatedSeconds;
    edge.historyTags = Array.isArray(edge.historyTags) ? edge.historyTags : [];
    if (metadata.tag) {
        edge.historyTags.unshift(metadata.tag);
        if (edge.historyTags.length > 8) {
            edge.historyTags.length = 8;
        }
    }

    return edge;
}

function reinforceLifeRoutine(entity, family, targetReference = null, rewardDelta = 0.05, metadata = {}) {
    const routines = entity?.lifeSim?.routines?.[family];
    if (!Array.isArray(routines)) return null;

    let routine = routines.find(entry => entry.targetReference === targetReference);
    if (!routine) {
        routine = {
            family,
            targetReference,
            phaseAffinity: metadata.phaseAffinity || null,
            strength: 0,
            stability: 0,
            recency: 0,
            emotionalReward: 0
        };
        routines.unshift(routine);
    }

    routine.strength = clampLifeSimUnit(routine.strength + rewardDelta);
    routine.stability = clampLifeSimUnit(routine.stability + rewardDelta * 0.5);
    routine.recency = metadata.recency ?? 1;
    routine.emotionalReward = clampLifeSimUnit((routine.emotionalReward || 0) + rewardDelta);
    if (routines.length > 16) {
        routines.length = 16;
    }

    return routine;
}

function appendUpbringingLesson(entity, lesson = {}) {
    const lessons = entity?.lifeSim?.upbringing?.lessons;
    if (!Array.isArray(lessons)) return null;

    const normalized = {
        id: lesson.id || `lesson_${entity.id}_${Date.now()}_${lessons.length + 1}`,
        category: lesson.category || 'general',
        teacherId: lesson.teacherId || null,
        strength: clampLifeSimUnit(lesson.strength ?? 0.25),
        warped: !!lesson.warped,
        createdAtSeconds: lesson.createdAtSeconds ?? null,
        tags: [...(lesson.tags || [])],
        content: { ...(lesson.content || {}) }
    };

    lessons.unshift(normalized);
    if (lessons.length > 24) {
        lessons.length = 24;
    }
    return normalized;
}

class Entity {
    constructor(x, y) {
        this.id = generateEntityId('entity');
        this.x = x;
        this.y = y;
        this.gridPos = gridManager.screenToIso(x, y);
        
        // Lifecycle - engagement based
        this.engagementTimer = 7200; // 2 minutes at 60 fps
        this.maxEngagementTimer = 7200;
        this.criticalEngagementThreshold = 1800; // 30 seconds - warning phase
        this.fadeStartThreshold = 600; // 10 seconds - start fading
        this.isDying = false;
        this.engagementDecayEnabled = true;
        
        // Visual properties
        this.size = 10;
        this.shadowOffset = 0;
        this.zIndex = 0; // For depth sorting
        
        // State management
        this.state = 'idle';
        this.stateTimer = 0;
    }
    
    // Update method to be overridden by subclasses
    update(gameState) {
        // Decrease engagement timer (death by neglect)
        if (this.engagementDecayEnabled && this.engagementTimer > 0) {
            this.engagementTimer--;
        }
        this.updateZIndex();
    }
    
    // Reset engagement timer (called when entity is interacted with)
    // Only resets if butterfly count is below threshold
    resetEngagement(butterflyCount = 0) {
        if (!this.engagementDecayEnabled) {
            this.engagementTimer = this.maxEngagementTimer;
            this.isDying = false;
            return;
        }
        // Only reset engagement timer if there are fewer than 4 butterflies
        if (butterflyCount < 4) {
            this.engagementTimer = this.maxEngagementTimer;
            this.isDying = false;
        }
    }
    
    // Calculate z-index for proper depth sorting
    updateZIndex() {
        // Isometric depth calculation: farther back (lower y) and to the left (lower x) appear behind
        this.zIndex = this.gridPos.y * 1000 + this.gridPos.x;
    }
    
    // Common state management
    setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            this.stateTimer = 0;
            this.onStateChange(newState);
        }
    }
    
    // Hook for subclasses to respond to state changes
    onStateChange(newState) {
        // Override in subclasses
    }
    
    // Base draw method - handles shadows and common effects
    draw(graphics) {
        if (this.engagementDecayEnabled && this.engagementTimer <= 0) return;
        
        graphics.push();
        
        // Calculate alpha for fading
        let alpha = 255;
        if (this.engagementDecayEnabled && (this.isDying || this.engagementTimer < this.fadeStartThreshold)) {
            alpha = map(this.engagementTimer, 0, this.fadeStartThreshold, 0, 255);
        }
        
        // Draw shadow if entity has one
        if (this.shadowOffset > 0) {
            this.drawShadow(graphics, alpha);
        }
        
        // Draw the entity itself
        this.drawEntity(graphics, alpha);
        
        graphics.pop();
    }
    
    drawShadow(graphics, alpha) {
        graphics.noStroke();
        graphics.fill(0, 0, 0, min(50, alpha * 0.2));
        graphics.ellipse(
            this.x, 
            this.y + this.shadowOffset, 
            this.size * 0.8, 
            this.size * 0.4
        );
    }
    
    // To be overridden by subclasses
    drawEntity(graphics, alpha) {
        // Subclasses implement their specific drawing logic
    }
    
    // Check if entity is dead
    isDead() {
        return this.engagementDecayEnabled && this.engagementTimer <= 0;
    }
    
    // Check if entity needs attention (warning phase)
    needsAttention() {
        return this.engagementDecayEnabled && this.engagementTimer < this.criticalEngagementThreshold;
    }
    
    // Get distance to a point
    distanceTo(x, y) {
        return dist(this.x, this.y, x, y);
    }
    
    // Get grid distance (Manhattan distance)
    gridDistanceTo(gridX, gridY) {
        return abs(this.gridPos.x - gridX) + abs(this.gridPos.y - gridY);
    }
}

// Mixin for entities that move on the grid
class GridMovable {
    constructor() {
        this.targetGridPos = null;
        this.speed = 0.05;
    }
    
    moveToGridPos(targetX, targetY) {
        this.targetGridPos = { x: targetX, y: targetY };
    }
    
    updateGridMovement() {
        if (!this.targetGridPos) return;
        
        // Smooth interpolation toward target
        const dx = this.targetGridPos.x - this.gridPos.x;
        const dy = this.targetGridPos.y - this.gridPos.y;
        
        if (abs(dx) < 0.1 && abs(dy) < 0.1) {
            this.gridPos.x = this.targetGridPos.x;
            this.gridPos.y = this.targetGridPos.y;
        } else {
            this.gridPos.x += dx * this.speed;
            this.gridPos.y += dy * this.speed;
        }
        
        // Update screen position using unified coordinate system
        const screenPos = gridManager.isoToScreen(this.gridPos.x, this.gridPos.y);
        this.x = screenPos.x;
        this.y = screenPos.y;
    }
}

// Mixin for entities with lifecycle stages
class LifecycleEntity {
    constructor() {
        this.stage = 'birth';
        this.stageTimer = 0;
        this.stageDurations = {
            birth: 60,
            mature: 600,
            aging: 300,
            dying: 180
        };
    }
    
    updateLifecycle() {
        this.stageTimer++;
        
        const currentDuration = this.stageDurations[this.stage];
        if (currentDuration && this.stageTimer >= currentDuration) {
            this.nextStage();
        }
    }
    
    nextStage() {
        const stages = Object.keys(this.stageDurations);
        const currentIndex = stages.indexOf(this.stage);
        
        if (currentIndex < stages.length - 1) {
            this.stage = stages[currentIndex + 1];
            this.stageTimer = 0;
            this.onStageChange(this.stage);
        }
    }
    
    onStageChange(newStage) {
        // Override in subclasses
    }
}
