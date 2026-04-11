class TeachingSystem {
    constructor() {
        this.packetsByEntityId = new Map();
        this.activeLessons = new Map();
        this.simulationClockSeconds = 0;
        this.initialized = false;
        this.listenersAttached = false;
    }

    initialize() {
        if (!this.listenersAttached) {
            this.attachEventListeners();
            this.listenersAttached = true;
        }
        this.initialized = true;
    }

    clamp01(value) {
        return Math.max(0, Math.min(1, value ?? 0));
    }

    getLiveButterflies() {
        return gameCore?.gameState?.butterflies || [];
    }

    getEntityById(entityId) {
        for (const butterfly of this.getLiveButterflies()) {
            if (butterfly.id === entityId) return butterfly;
        }
        for (const caterpillar of gameCore?.gameState?.caterpillars || []) {
            if (caterpillar.id === entityId) return caterpillar;
        }
        return null;
    }

    attachEventListeners() {
        if (typeof eventBus === 'undefined') return;

        eventBus.on('teaching:pulse', data => this.handleTeachingPulse(data));
        eventBus.on('trust:cascade', data => this.handleTrustCascade(data));
        eventBus.on(GameEvents.BUTTERFLY_VISITED_FLOWER, data => this.handleButterflyVisitedFlower(data));
        eventBus.on('butterfly:stateChange', data => this.handleButterflyStateChange(data));
    }

    registerEntity(entity) {
        if (!entity?.id) return null;
        if (!this.packetsByEntityId.has(entity.id)) {
            this.packetsByEntityId.set(entity.id, []);
        }
        return this.getPackets(entity.id);
    }

    unregisterEntity(entityId) {
        this.packetsByEntityId.delete(entityId);
        this.activeLessons.delete(entityId);
    }

    reset() {
        this.packetsByEntityId.clear();
        this.activeLessons.clear();
        this.simulationClockSeconds = 0;
    }

    addPacket(entityId, packet) {
        if (!this.packetsByEntityId.has(entityId)) {
            this.packetsByEntityId.set(entityId, []);
        }

        const packets = this.packetsByEntityId.get(entityId);
        const normalized = {
            id: packet.id || `lesson_packet_${entityId}_${packets.length + 1}`,
            category: packet.category || 'general',
            content: packet.content || null,
            warped: !!packet.warped,
            createdAtSeconds: packet.createdAtSeconds ?? this.simulationClockSeconds
        };

        packets.unshift(normalized);
        if (packets.length > 24) {
            packets.length = 24;
        }
        return normalized;
    }

    getPackets(entityId) {
        return JSON.parse(JSON.stringify(this.packetsByEntityId.get(entityId) || []));
    }

    beginTeach(teacherId, listenerId, lessonCategory = 'general', content = {}) {
        const lesson = {
            teacherId,
            listenerId,
            lessonCategory,
            content: { ...content },
            startedAtSeconds: this.simulationClockSeconds
        };
        this.activeLessons.set(listenerId, lesson);
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.TEACHING_STARTED, lesson);
        }
        return lesson;
    }

    resolveLesson(listenerId, result = {}) {
        const lesson = this.activeLessons.get(listenerId);
        if (!lesson) return null;
        this.activeLessons.delete(listenerId);
        const resolved = { ...lesson, ...result };
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.TEACHING_COMPLETED, resolved);
        }
        return resolved;
    }

    recordSocialMemory(entity, subjectId, tags = [], extra = {}) {
        appendLifeMemory(entity, 'social', {
            subjectId,
            valence: extra.valence ?? 0.3,
            strength: extra.strength ?? 0.35,
            tags,
            createdAtSeconds: this.simulationClockSeconds,
            metadata: extra.metadata || {}
        });
    }

    handleTeachingPulse(data = {}) {
        const teacher = this.getEntityById(data.teacherId);
        if (!teacher) return;

        const radius = data.radius || 80;
        const radiusSq = radius * radius;
        for (const listener of this.getLiveButterflies()) {
            if (listener === teacher) continue;

            const dx = teacher.x - listener.x;
            const dy = teacher.y - listener.y;
            if (dx * dx + dy * dy > radiusSq) continue;

            this.beginTeach(teacher.id, listener.id, 'teaching_aura', {
                source: 'wise_aura',
                teacherArchetype: teacher.personalityType
            });

            this.recordSocialMemory(listener, teacher.id, ['teaching-pulse'], {
                valence: 0.25,
                strength: 0.3,
                metadata: { source: 'teaching-pulse' }
            });
            adjustLifeSocialEdge(listener, teacher.id, {
                trust: 0.03,
                admiration: 0.05,
                comfort: 0.02
            }, {
                updatedAtSeconds: this.simulationClockSeconds,
                tag: 'teaching-pulse'
            });
            reinforceLifeRoutine(listener, 'teaching', teacher.id, 0.04, {
                phaseAffinity: 'learning',
                recency: 1
            });
        }
    }

    handleTrustCascade(data = {}) {
        const source = this.getEntityById(data.sourceId);
        if (!source || !Array.isArray(data.butterflies)) return;

        for (const entry of data.butterflies) {
            const butterflyId = typeof entry === 'string' ? entry : entry?.id;
            const butterfly = this.getEntityById(butterflyId);
            if (!butterfly?.lifeSim || butterfly.id === source.id) continue;

            this.recordSocialMemory(butterfly, source.id, ['trust-cascade'], {
                valence: 0.35,
                strength: 0.4,
                metadata: { source: 'trust-cascade' }
            });
            adjustLifeSocialEdge(butterfly, source.id, {
                trust: 0.05,
                comfort: 0.04,
                admiration: 0.02
            }, {
                updatedAtSeconds: this.simulationClockSeconds,
                tag: 'trust-cascade'
            });
        }
    }

    handleButterflyVisitedFlower(data = {}) {
        const butterfly = data.butterfly;
        const flower = data.flower;
        if (!butterfly?.lifeSim || !flower?.id) return;

        appendLifeMemory(butterfly, 'object', {
            subjectId: flower.id,
            valence: 0.3,
            strength: 0.35,
            tags: ['feeding-success', flower.stage || 'unknown-stage'],
            createdAtSeconds: this.simulationClockSeconds
        });
        appendLifeMemory(butterfly, 'outcome', {
            subjectId: flower.id,
            valence: 0.4,
            strength: 0.45,
            tags: ['happiness-gain'],
            createdAtSeconds: this.simulationClockSeconds
        });
        reinforceLifeRoutine(butterfly, 'resource', flower.id, 0.06, {
            phaseAffinity: 'feeding',
            recency: 1
        });
    }

    handleButterflyStateChange(data = {}) {
        const butterfly = data.butterfly;
        if (!butterfly?.lifeSim) return;

        if (data.to === 'following') {
            appendLifeMemory(butterfly, 'interaction', {
                subjectId: 'player_cursor',
                valence: 0.35,
                strength: 0.4,
                tags: ['trusted-cursor'],
                createdAtSeconds: this.simulationClockSeconds
            });
            reinforceLifeRoutine(butterfly, 'social', 'player_cursor', 0.05, {
                phaseAffinity: 'trust',
                recency: 1
            });
        }

        if (data.to === 'scared') {
            appendLifeMemory(butterfly, 'danger', {
                subjectId: 'player_cursor',
                valence: -0.35,
                strength: 0.45,
                tags: ['cursor-scare'],
                createdAtSeconds: this.simulationClockSeconds
            });
        }
    }

    applyResolvedLesson(listener, teacher, resolvedLesson) {
        const warpedTeachingBias = listener?.lifeSim?.distortion?.warpedTeachingBias ?? 0;
        const warped = warpedTeachingBias > 0.6;

        this.addPacket(listener.id, {
            category: resolvedLesson.lessonCategory,
            content: {
                teacherId: resolvedLesson.teacherId,
                source: resolvedLesson.content?.source || 'lesson'
            },
            warped
        });

        appendUpbringingLesson(listener, {
            category: resolvedLesson.lessonCategory,
            teacherId: resolvedLesson.teacherId,
            strength: 0.35,
            warped,
            createdAtSeconds: this.simulationClockSeconds,
            tags: ['teaching-complete'],
            content: resolvedLesson.content || {}
        });

        if (listener.lifeSim?.upbringing?.routineReinforcement) {
            listener.lifeSim.upbringing.routineReinforcement[resolvedLesson.lessonCategory] =
                this.clamp01((listener.lifeSim.upbringing.routineReinforcement[resolvedLesson.lessonCategory] || 0) + 0.08);
        }

        if (listener.lifeSim?.interpretation) {
            listener.lifeSim.interpretation.clarity = this.clamp01((listener.lifeSim.interpretation.clarity || 0) + 0.015);
        }

        this.recordSocialMemory(listener, teacher?.id || resolvedLesson.teacherId, ['lesson-complete'], {
            valence: 0.4,
            strength: 0.45,
            metadata: { category: resolvedLesson.lessonCategory }
        });

        adjustLifeSocialEdge(listener, teacher?.id || resolvedLesson.teacherId, {
            trust: 0.04,
            admiration: 0.06,
            comfort: 0.03
        }, {
            updatedAtSeconds: this.simulationClockSeconds,
            tag: 'lesson-complete'
        });

        reinforceLifeRoutine(listener, 'teaching', teacher?.id || resolvedLesson.teacherId, 0.05, {
            phaseAffinity: 'learning',
            recency: 1
        });

        if (listener.timers) {
            listener.timers.teachingBoost = Math.max(listener.timers.teachingBoost || 0, 20);
        }

        if (teacher?.lifeSim) {
            appendLifeMemory(teacher, 'care', {
                subjectId: listener.id,
                valence: 0.3,
                strength: 0.3,
                tags: ['taught-listener'],
                createdAtSeconds: this.simulationClockSeconds
            });
            reinforceLifeRoutine(teacher, 'teaching', listener.id, 0.04, {
                phaseAffinity: 'teacher',
                recency: 1
            });
        }
    }

    updateActiveLessons() {
        const lessonDurationSeconds = 1.25;
        for (const [listenerId, lesson] of Array.from(this.activeLessons.entries())) {
            if ((this.simulationClockSeconds - lesson.startedAtSeconds) < lessonDurationSeconds) continue;

            const resolved = this.resolveLesson(listenerId, {
                completedAtSeconds: this.simulationClockSeconds
            });
            if (!resolved) continue;

            const listener = this.getEntityById(listenerId);
            if (!listener) continue;

            const teacher = this.getEntityById(resolved.teacherId);
            this.applyResolvedLesson(listener, teacher, resolved);
        }
    }

    serializeDurableState() {
        const packetsByEntityId = {};
        const activeLessons = {};

        for (const [entityId, packets] of this.packetsByEntityId.entries()) {
            packetsByEntityId[entityId] = JSON.parse(JSON.stringify(packets));
        }
        for (const [listenerId, lesson] of this.activeLessons.entries()) {
            activeLessons[listenerId] = JSON.parse(JSON.stringify(lesson));
        }

        return { packetsByEntityId, activeLessons };
    }

    deserializeDurableState(serialized = {}) {
        this.reset();

        for (const [entityId, packets] of Object.entries(serialized.packetsByEntityId || {})) {
            this.packetsByEntityId.set(entityId, JSON.parse(JSON.stringify(packets)));
        }
        for (const [listenerId, lesson] of Object.entries(serialized.activeLessons || {})) {
            this.activeLessons.set(listenerId, JSON.parse(JSON.stringify(lesson)));
        }
    }

    update(gameState, deltaSeconds = gameConfig.simulation.fixedDeltaSeconds) {
        this.simulationClockSeconds += deltaSeconds;

        for (const butterfly of gameState.butterflies || []) {
            this.registerEntity(butterfly);
        }
        for (const caterpillar of gameState.caterpillars || []) {
            this.registerEntity(caterpillar);
        }

        this.updateActiveLessons();
    }
}

const teachingSystem = new TeachingSystem();
