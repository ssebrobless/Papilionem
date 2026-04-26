class TeachingSystem {
    constructor() {
        this.packetsByEntityId = new Map();
        this.activeLessons = new Map();
        this.trainingCooldownsByTeacher = new Map();
        this.trainingImpactCooldowns = new Map();
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

    getSocialBalance() {
        return gameConfig?.balance?.social || {};
    }

    getTrainingBalance() {
        return gameConfig?.balance?.training || {};
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

    getEntityZoneId(entity, fallback = null) {
        return entity?.currentZoneId || entity?.lifeSim?.lifecycle?.currentZoneId || fallback;
    }

    getTrainingZone() {
        return zoneSystem?.getZones?.()?.find?.(zone => zone.kind === 'training') || null;
    }

    getButterfliesInZone(zoneId) {
        return this.getLiveButterflies().filter(butterfly => this.getEntityZoneId(butterfly, null) === zoneId);
    }

    getTrainingStations(zone) {
        const stations = zone?.renderProfile?.trainingStations || [];
        return stations.map(station => ({
            ...station,
            grid: typeof isometricPhysics !== 'undefined'
                ? isometricPhysics.screenToGrid(station.x, station.y)
                : { x: station.x / 32, y: station.y / 16 }
        }));
    }

    pickTrainingTeacher(candidates = []) {
        return candidates
            .slice()
            .sort((left, right) => {
                const leftTeacherBias = left.getSpecialAbility?.() === 'teacher' ? 3 : 0;
                const rightTeacherBias = right.getSpecialAbility?.() === 'teacher' ? 3 : 0;
                const leftScore = leftTeacherBias + (left.happiness || 0) + ((left.lifeSim?.social?.reputation || 0) * 10);
                const rightScore = rightTeacherBias + (right.happiness || 0) + ((right.lifeSim?.social?.reputation || 0) * 10);
                return rightScore - leftScore;
            })[0] || null;
    }

    pickTrainingListeners(teacher, candidates = [], maxListeners = 3) {
        return candidates
            .filter(candidate => candidate.id !== teacher?.id)
            .sort((left, right) => {
                const leftDist = Math.hypot((left.x || 0) - (teacher?.x || 0), (left.y || 0) - (teacher?.y || 0));
                const rightDist = Math.hypot((right.x || 0) - (teacher?.x || 0), (right.y || 0) - (teacher?.y || 0));
                return leftDist - rightDist;
            })
            .slice(0, maxListeners);
    }

    moveButterflyToTrainingStation(butterfly, station, offsetIndex = 0) {
        if (!butterfly?.movement?.setTarget || !station?.grid) return;

        const spacing = 0.65;
        const laneOffset = (offsetIndex - 1) * spacing;
        butterfly.movement.setTarget(
            station.grid.x + laneOffset,
            station.grid.y + (offsetIndex === 0 ? 0 : 0.35),
            'training',
            this.getTrainingBalance().movementPriority ?? 7,
            this.getTrainingBalance().movementWobble ?? 0.08
        );
        if (butterfly.lifeSim?.routines) {
            butterfly.lifeSim.routines.activeContext = 'training-ground';
            butterfly.lifeSim.routines.lastAnchorId = station.id;
        }
    }

    isButterflyNearStation(butterfly, station, radius = this.getTrainingBalance().stationRadius ?? 42) {
        if (!butterfly || !station) return false;
        return Math.hypot((butterfly.x || 0) - station.x, (butterfly.y || 0) - station.y) <= radius;
    }

    pickNearestTrainingStation(teacher, stations = []) {
        if (!teacher || !stations.length) return stations[0] || null;
        return stations
            .slice()
            .sort((left, right) => {
                const leftDist = Math.hypot((teacher.x || 0) - left.x, (teacher.y || 0) - left.y);
                const rightDist = Math.hypot((teacher.x || 0) - right.x, (teacher.y || 0) - right.y);
                return leftDist - rightDist;
            })[0] || null;
    }

    attachEventListeners() {
        if (typeof eventBus === 'undefined') return;

        eventBus.on('teaching:pulse', data => this.handleTeachingPulse(data));
        eventBus.on('trust:cascade', data => this.handleTrustCascade(data));
        eventBus.on(GameEvents.BUTTERFLY_VISITED_FLOWER, data => this.handleButterflyVisitedFlower(data));
        eventBus.on(GameEvents.BUTTERFLY_STATE_CHANGED || 'butterfly:stateChange', data => this.handleButterflyStateChange(data));
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
        this.trainingCooldownsByTeacher.delete(entityId);
        this.trainingImpactCooldowns.delete(entityId);
    }

    reset() {
        this.packetsByEntityId.clear();
        this.activeLessons.clear();
        this.trainingCooldownsByTeacher.clear();
        this.trainingImpactCooldowns.clear();
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

        const socialBalance = this.getSocialBalance();
        const radius = data.radius || socialBalance.teachingPulseRadius || 80;
        const radiusSq = radius * radius;
        const listenerIds = [];
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
                valence: socialBalance.teachingPulseMemoryValence ?? 0.25,
                strength: socialBalance.teachingPulseMemoryStrength ?? 0.3,
                metadata: { source: 'teaching-pulse' }
            });
            adjustLifeSocialEdge(listener, teacher.id, {
                trust: socialBalance.teachingPulseEdgeTrust ?? 0.03,
                admiration: socialBalance.teachingPulseEdgeAdmiration ?? 0.05,
                comfort: socialBalance.teachingPulseEdgeComfort ?? 0.02
            }, {
                updatedAtSeconds: this.simulationClockSeconds,
                tag: 'teaching-pulse'
            });
            reinforceLifeRoutine(listener, 'teaching', teacher.id, socialBalance.teachingPulseRoutineReinforcement ?? 0.04, {
                phaseAffinity: 'learning',
                recency: 1
            });
            listenerIds.push(listener.id);
        }

        if (listenerIds.length && typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents?.COMMUNICATION_SIGNAL || 'communication:signal', {
                sourceId: teacher.id,
                sourceButterfly: teacher,
                signalType: 'teaching_signal',
                intent: 'share lesson',
                targetIds: listenerIds
            });
        }
    }

    handleTrustCascade(data = {}) {
        const source = this.getEntityById(data.sourceId);
        if (!source || !Array.isArray(data.butterflies)) return;

        const socialBalance = this.getSocialBalance();
        for (const entry of data.butterflies) {
            const butterflyId = typeof entry === 'string' ? entry : entry?.id;
            const butterfly = this.getEntityById(butterflyId);
            if (!butterfly?.lifeSim || butterfly.id === source.id) continue;

            this.recordSocialMemory(butterfly, source.id, ['trust-cascade'], {
                valence: socialBalance.trustCascadeMemoryValence ?? 0.35,
                strength: socialBalance.trustCascadeMemoryStrength ?? 0.4,
                metadata: { source: 'trust-cascade' }
            });
            adjustLifeSocialEdge(butterfly, source.id, {
                trust: socialBalance.trustCascadeEdgeTrust ?? 0.05,
                comfort: socialBalance.trustCascadeEdgeComfort ?? 0.04,
                admiration: socialBalance.trustCascadeEdgeAdmiration ?? 0.02
            }, {
                updatedAtSeconds: this.simulationClockSeconds,
                tag: 'trust-cascade'
            });
        }

        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.TRUST_CASCADE_OCCURRED, {
                sourceId: source.id,
                butterflyIds: data.butterflies
                    .map(entry => typeof entry === 'string' ? entry : entry?.id)
                    .filter(Boolean)
            });
            eventBus.emit(GameEvents?.COMMUNICATION_SIGNAL || 'communication:signal', {
                sourceId: source.id,
                sourceButterfly: source,
                signalType: 'calming_signal',
                intent: 'spread calm',
                targetIds: data.butterflies
                    .map(entry => typeof entry === 'string' ? entry : entry?.id)
                    .filter(Boolean)
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
        const socialBalance = this.getSocialBalance();
        const trainingBalance = this.getTrainingBalance();
        const warpedTeachingBias = listener?.lifeSim?.distortion?.warpedTeachingBias ?? 0;
        const warped = warpedTeachingBias > 0.6;
        const fromTrainingGrounds = resolvedLesson.content?.source === 'training-ground';

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
            strength: socialBalance.lessonUpbringingStrength ?? 0.35,
            warped,
            createdAtSeconds: this.simulationClockSeconds,
            tags: ['teaching-complete'],
            content: resolvedLesson.content || {}
        });

        if (listener.lifeSim?.upbringing?.routineReinforcement) {
            listener.lifeSim.upbringing.routineReinforcement[resolvedLesson.lessonCategory] =
                this.clamp01(
                    (listener.lifeSim.upbringing.routineReinforcement[resolvedLesson.lessonCategory] || 0) +
                    (socialBalance.lessonRoutineReinforcement ?? 0.08) +
                    (fromTrainingGrounds ? (trainingBalance.routineReinforcementBonus ?? 0.04) : 0)
                );
        }

        if (listener.lifeSim?.interpretation) {
            listener.lifeSim.interpretation.clarity = this.clamp01(
                (listener.lifeSim.interpretation.clarity || 0) +
                (socialBalance.lessonInterpretationClarityGain ?? 0.015) +
                (fromTrainingGrounds ? (trainingBalance.interpretationClarityBonus ?? 0.02) : 0)
            );
        }

        this.recordSocialMemory(listener, teacher?.id || resolvedLesson.teacherId, ['lesson-complete'], {
            valence: socialBalance.lessonMemoryValence ?? 0.4,
            strength: socialBalance.lessonMemoryStrength ?? 0.45,
            metadata: { category: resolvedLesson.lessonCategory }
        });

        adjustLifeSocialEdge(listener, teacher?.id || resolvedLesson.teacherId, {
            trust: (socialBalance.lessonEdgeTrust ?? 0.04) + (fromTrainingGrounds ? (trainingBalance.lessonTrustBonus ?? 0.02) : 0),
            admiration: (socialBalance.lessonEdgeAdmiration ?? 0.06) + (fromTrainingGrounds ? (trainingBalance.lessonAdmirationBonus ?? 0.03) : 0),
            comfort: (socialBalance.lessonEdgeComfort ?? 0.03) + (fromTrainingGrounds ? (trainingBalance.lessonComfortBonus ?? 0.015) : 0)
        }, {
            updatedAtSeconds: this.simulationClockSeconds,
            tag: 'lesson-complete'
        });

        reinforceLifeRoutine(listener, 'teaching', teacher?.id || resolvedLesson.teacherId, socialBalance.listenerTeachingRoutineReinforcement ?? 0.05, {
            phaseAffinity: 'learning',
            recency: 1
        });

        if (listener.timers) {
            listener.timers.teachingBoost = Math.max(listener.timers.teachingBoost || 0, socialBalance.teachingBoostFrames ?? 20);
        }

        if (teacher?.lifeSim) {
            appendLifeMemory(teacher, 'care', {
                subjectId: listener.id,
                valence: 0.3,
                strength: 0.3,
                tags: ['taught-listener'],
                createdAtSeconds: this.simulationClockSeconds
            });
            reinforceLifeRoutine(teacher, 'teaching', listener.id, socialBalance.teacherTeachingRoutineReinforcement ?? 0.04, {
                phaseAffinity: 'teacher',
                recency: 1
            });
        }

        if (fromTrainingGrounds && typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.TRAINING_DRILL_COMPLETED, {
                teacherId: teacher?.id || resolvedLesson.teacherId,
                listenerId: listener.id,
                zoneId: resolvedLesson.content?.zoneId || this.getEntityZoneId(listener, null),
                stationId: resolvedLesson.content?.stationId || null,
                stationLabel: resolvedLesson.content?.stationLabel || 'training station'
            });
        }
    }

    updateActiveLessons() {
        const lessonDurationSeconds = this.getSocialBalance().teachingLessonDurationSeconds ?? 1.25;
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

    canTrainingImpact(butterfly) {
        if (!butterfly?.id) return false;
        if (butterfly.state !== 'normal') return false;
        if (butterfly.isSpawning) return false;
        if (butterfly.zoneTravel?.active) return false;
        return (this.trainingImpactCooldowns.get(butterfly.id) || 0) <= frameCount;
    }

    markTrainingImpactCooldown(...butterflies) {
        const cooldownFrames = this.getTrainingBalance().impactCooldownFrames ?? 45;
        for (const butterfly of butterflies) {
            if (!butterfly?.id) continue;
            this.trainingImpactCooldowns.set(butterfly.id, frameCount + cooldownFrames);
        }
    }

    buildTrainingImpactNormal(left, right) {
        const dx = (right.x || 0) - (left.x || 0);
        const dy = (right.y || 0) - (left.y || 0);
        const distance = Math.hypot(dx, dy);
        if (distance > 0.0001) {
            return { nx: dx / distance, ny: dy / distance, distance };
        }

        const source = `${left?.id || 'left'}|${right?.id || 'right'}`;
        let hash = 0;
        for (let index = 0; index < source.length; index += 1) {
            hash = ((hash * 31) + source.charCodeAt(index)) >>> 0;
        }
        const angle = (hash % 360) * (Math.PI / 180);
        return {
            nx: Math.cos(angle) || 1,
            ny: Math.sin(angle) || 0,
            distance: 0
        };
    }

    applyTrainingImpact(left, right, options = {}) {
        if (!left || !right) return false;
        const { nx, ny } = this.buildTrainingImpactNormal(left, right);
        const push = Math.max(1, options.push || this.getTrainingBalance().impactImpulse || 3.8);
        const frames = Math.max(1, Math.round(options.frames || this.getTrainingBalance().impactFrames || 4));
        const leftImpulse = { x: -nx * push * 0.5, y: -ny * push * 0.5 };
        const rightImpulse = { x: nx * push * 0.5, y: ny * push * 0.5 };

        physicsSystem?.applyImpulse?.(left, {
            x: leftImpulse.x,
            y: leftImpulse.y,
            frames,
            maxMagnitude: push,
            source: 'training-impact'
        });
        physicsSystem?.applyImpulse?.(right, {
            x: rightImpulse.x,
            y: rightImpulse.y,
            frames,
            maxMagnitude: push,
            source: 'training-impact'
        });

        if (left.lifeSim?.emotions) {
            left.lifeSim.emotions.agitation = this.clamp01((left.lifeSim.emotions.agitation || 0) + 0.03);
        }
        if (right.lifeSim?.emotions) {
            right.lifeSim.emotions.agitation = this.clamp01((right.lifeSim.emotions.agitation || 0) + 0.03);
        }

        left.happiness = Math.max(0, (left.happiness || 0) - 0.35);
        right.happiness = Math.max(0, (right.happiness || 0) - 0.35);
        left.battleState = left.battleState || {};
        right.battleState = right.battleState || {};
        left.battleState.pressure = (left.battleState.pressure || 0) + 1;
        right.battleState.pressure = (right.battleState.pressure || 0) + 1;
        left.battleState.hp = Math.max(0, (left.battleState.hp ?? 100) - 1);
        right.battleState.hp = Math.max(0, (right.battleState.hp ?? 100) - 1);
        left.battleState.lastImpactAtFrame = typeof frameCount === 'number' ? frameCount : 0;
        right.battleState.lastImpactAtFrame = typeof frameCount === 'number' ? frameCount : 0;
        left.battleState.lastImpactStrength = push;
        right.battleState.lastImpactStrength = push;
        left.battleState.lastImpactSource = 'training';
        right.battleState.lastImpactSource = 'training';
        this.markTrainingImpactCooldown(left, right);

        if (typeof eventBus !== 'undefined') {
            eventBus.emit('training:impact', {
                x: ((left.x || 0) + (right.x || 0)) / 2,
                y: ((left.y || 0) + (right.y || 0)) / 2,
                sourceIds: [left.id, right.id],
                impactStrength: push
            });
        }

        return true;
    }

    updateTrainingContacts(zoneButterflies = []) {
        if (zoneButterflies.length < 2) return;
        const trainingBalance = this.getTrainingBalance();
        const impactRadius = trainingBalance.impactRadius ?? 22;
        const impactChance = trainingBalance.impactChance ?? 0.04;

        for (let i = 0; i < zoneButterflies.length; i++) {
            const left = zoneButterflies[i];
            if (!this.canTrainingImpact(left)) continue;

            for (let j = i + 1; j < zoneButterflies.length; j++) {
                const right = zoneButterflies[j];
                if (!this.canTrainingImpact(right)) continue;

                const dx = (right.x || 0) - (left.x || 0);
                const dy = (right.y || 0) - (left.y || 0);
                const distance = Math.hypot(dx, dy);
                if (distance > impactRadius || random() >= impactChance) continue;

                this.applyTrainingImpact(left, right, {
                    push: trainingBalance.impactImpulse ?? 3.8,
                    frames: trainingBalance.impactFrames ?? 4
                });
                break;
            }
        }
    }

    updateTrainingGrounds(gameState) {
        const trainingZone = this.getTrainingZone();
        if (!trainingZone) return;

        const trainingBalance = this.getTrainingBalance();
        const zoneButterflies = this.getButterfliesInZone(trainingZone.id)
            .filter(butterfly => butterfly?.state !== 'scared' && butterfly?.state !== 'sleeping');
        if (zoneButterflies.length < 2) return;

        this.updateTrainingContacts(zoneButterflies);

        const teacher = this.pickTrainingTeacher(zoneButterflies);
        if (!teacher?.id) return;

        const listeners = this.pickTrainingListeners(
            teacher,
            zoneButterflies,
            trainingBalance.maxListenersPerDrill ?? 3
        );
        if (!listeners.length) return;

        const nextDrillAt = this.trainingCooldownsByTeacher.get(teacher.id) || 0;
        if (this.simulationClockSeconds < nextDrillAt) return;

        this.trainingCooldownsByTeacher.set(
            teacher.id,
            this.simulationClockSeconds + (trainingBalance.drillCooldownSeconds ?? 5)
        );

        if (typeof eventBus !== 'undefined') {
            eventBus.emit(GameEvents.TRAINING_DRILL_STARTED, {
                teacherId: teacher.id,
                listenerIds: listeners.map(listener => listener.id),
                zoneId: trainingZone.id,
                stationId: null,
                stationLabel: trainingZone.label || 'training grounds'
            });
            eventBus.emit(GameEvents?.COMMUNICATION_SIGNAL || 'communication:signal', {
                sourceId: teacher.id,
                sourceButterfly: teacher,
                signalType: 'teaching_signal',
                intent: 'practice in the training grounds',
                targetIds: listeners.map(listener => listener.id)
            });
        }

        for (const listener of listeners) {
            if (this.activeLessons.has(listener.id)) continue;
            this.beginTeach(teacher.id, listener.id, 'training_drill', {
                source: 'training-ground',
                zoneId: trainingZone.id,
                stationId: null,
                stationLabel: trainingZone.label || 'training grounds',
                teacherArchetype: teacher.personalityType
            });
        }

    }

    update(gameState, deltaSeconds = gameConfig.simulation.fixedDeltaSeconds) {
        this.simulationClockSeconds += deltaSeconds;
        const battleActive = gameState?.viewMode === 'battle' || !!gameState?.activeBattleId;
        const battleCadenceFrames = gameConfig?.performance?.runtimeHardening?.battleTeachingCadenceFrames || 6;
        const frameIndex = typeof frameCount === 'number' ? frameCount : 0;
        const shouldAdvanceLessons = !battleActive || (frameIndex % battleCadenceFrames === 0);

        for (const butterfly of gameState.butterflies || []) {
            this.registerEntity(butterfly);
        }
        for (const caterpillar of gameState.caterpillars || []) {
            this.registerEntity(caterpillar);
        }

        if (shouldAdvanceLessons) {
            this.updateActiveLessons();
        }
        if (!battleActive) {
            this.updateTrainingGrounds(gameState);
        }
    }
}

const teachingSystem = new TeachingSystem();
