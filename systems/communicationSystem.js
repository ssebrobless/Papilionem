class CommunicationSystem {
    constructor() {
        this.entities = new Map();
        this.history = [];
        this.dialogueHistory = [];
        this.activeSignals = new Map();
        this.listenersAttached = false;
        this.initialized = false;
        this.simulationClockSeconds = 0;
        this.maxHistoryEntries = 160;
        this.maxDialogueEntries = 180;
        this.maxEdgeResidueEntries = 3;
        this.dialogueReplyDelaySeconds = 2.0;
        this.dialogueReplyDelayMs = 2000;
    }

    initialize() {
        if (!this.listenersAttached) {
            this.attachEventListeners();
            this.listenersAttached = true;
        }
        this.initialized = true;
    }

    attachEventListeners() {
        if (typeof eventBus === 'undefined') return;
        eventBus.on(GameEvents.COMMUNICATION_SIGNAL, data => this.handleSignal(data));
    }

    reset() {
        this.entities.clear();
        this.history = [];
        this.dialogueHistory = [];
        this.activeSignals.clear();
        this.simulationClockSeconds = 0;
    }

    registerEntity(entity) {
        if (!entity?.id || !entity?.lifeSim) return null;
        if (!entity.lifeSim.communication) {
            entity.lifeSim.communication = createCommunicationProfile();
        }
        entity.lifeSim.communication.recentEmitted = entity.lifeSim.communication.recentEmitted || [];
        entity.lifeSim.communication.recentReceived = entity.lifeSim.communication.recentReceived || [];
        entity.lifeSim.communication.recentConversations = entity.lifeSim.communication.recentConversations || [];
        entity.lifeSim.communication.recentDialogues = entity.lifeSim.communication.recentDialogues || [];
        entity.lifeSim.communication.recentResidues = entity.lifeSim.communication.recentResidues || [];
        entity.lifeSim.communication.retainedLessons = entity.lifeSim.communication.retainedLessons || [];
        entity.lifeSim.communication.pendingUtterances = entity.lifeSim.communication.pendingUtterances || [];
        entity.lifeSim.communication.lastSpokenAtSeconds = entity.lifeSim.communication.lastSpokenAtSeconds ?? null;
        entity.lifeSim.communication.lastHeardAtSeconds = entity.lifeSim.communication.lastHeardAtSeconds ?? null;
        entity.lifeSim.communication.knownNames = entity.lifeSim.communication.knownNames || {};
        entity.lifeSim.communication.selfName = entity.lifeSim.communication.selfName || null;
        for (const targetId of Object.keys(entity.lifeSim.socialEdges || {})) {
            ensureLifeSocialEdge?.(entity, targetId);
        }
        this.entities.set(entity.id, entity);
        this.ensureNameIdentity(entity);
        return entity.lifeSim.communication;
    }

    unregisterEntity(entityId) {
        if (!entityId) return;
        this.entities.delete(entityId);
        this.activeSignals.delete(entityId);
    }

    requestLifeSimRefresh(entityOrId, reason = 'communication-change') {
        const entityId = typeof entityOrId === 'string' ? entityOrId : entityOrId?.id;
        if (!entityId) return null;
        return lifeSimSystem?.requestDeepRefresh?.(entityId, reason) || null;
    }

    update(gameState, deltaSeconds = 0) {
        this.simulationClockSeconds += deltaSeconds;
        const now = this.simulationClockSeconds;

        for (const [entityId, signal] of Array.from(this.activeSignals.entries())) {
            if ((signal.expiresAtSeconds ?? 0) > now) continue;
            this.activeSignals.delete(entityId);
            const entity = this.getEntityById(entityId, gameState);
            if (entity?.lifeSim?.communication) {
                entity.lifeSim.communication.activeSignal = null;
                this.requestLifeSimRefresh(entity, 'signal-expired');
            }
        }

        for (const entity of this.getLiveEntities(gameState)) {
            this.decayConversationTexture(entity, deltaSeconds, now);
            this.trimCommunicationState(entity);
        }

        this.updateQueuedResponses(gameState);
    }

    getLiveEntities(gameState = gameCore?.gameState) {
        const butterflies = gameState?.butterflies || [];
        const caterpillars = gameState?.caterpillars || [];
        return [...butterflies, ...caterpillars].filter(entity => entity?.lifeSim);
    }

    getEntityById(entityId, gameState = gameCore?.gameState) {
        if (!entityId) return null;
        const registered = this.entities.get(entityId);
        if (registered) return registered;
        return this.getLiveEntities(gameState).find(entity => entity.id === entityId) || null;
    }

    getPressureProfile() {
        return gameCore?.telemetrySystem?.getPressureProfile?.()
            || telemetrySystem?.getPressureProfile?.()
            || {
                tier: 'normal',
                isHot: false,
                isCritical: false,
                visibleButterflies: 0
            };
    }

    clamp01(value) {
        return Math.max(0, Math.min(1, value ?? 0));
    }

    buildNameSeed(...parts) {
        return parts
            .flat()
            .filter(part => part !== undefined && part !== null)
            .join(':')
            .split('')
            .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    }

    getEntityLabel(entity, fallback = 'Butterfly') {
        if (!entity) return fallback;
        return entity.getCanonicalLabel?.({ includeSex: true })
            || entity.displayName
            || entity.getDisplayName?.()
            || entity.personalityType
            || entity.id
            || fallback;
    }

    stripSexSuffix(label = '') {
        return String(label || '').replace(/\([A-Z?]\)$/, '').trim();
    }

    getLanguageBandLabel(band = 'average') {
        const labels = {
            below_average: 'below-average',
            average: 'average',
            above_average: 'above-average',
            exceptional: 'scholar'
        };
        return labels[band] || String(band || 'average').replace(/_/g, '-');
    }

    getSignalFieldKey(signalType = '') {
        const families = {
            warning_signal: 'warning',
            teaching_signal: 'teaching',
            courtship_signal: 'courtship',
            calming_signal: 'calming',
            guidance_signal: 'guidance',
            acknowledgement_signal: 'support',
            trust_display: 'support'
        };
        return families[signalType] || 'support';
    }

    getSignalFieldDisplayLabel(field = 'support') {
        const labels = {
            warning: 'warning field',
            teaching: 'teaching pocket',
            courtship: 'courtship pocket',
            calming: 'calm support',
            guidance: 'guidance thread',
            support: 'support field',
            quiet: 'quiet'
        };
        return labels[field] || String(field || 'support').replace(/_/g, ' ');
    }

    getLocalSignalField(entityIdOrEntity, gameState = gameCore?.gameState, options = {}) {
        const entity = typeof entityIdOrEntity === 'string'
            ? this.getEntityById(entityIdOrEntity, gameState)
            : entityIdOrEntity;
        if (!entity?.id) {
            return {
                dominantFamily: 'quiet',
                sourceCount: 0,
                targetedCount: 0,
                totalPressure: 0,
                warningPressure: 0,
                teachingPressure: 0,
                courtshipPressure: 0,
                calmingPressure: 0,
                guidancePressure: 0,
                supportPressure: 0,
                counts: {},
                contributors: [],
                label: 'quiet | no active field',
                detail: 'No nearby active signals'
            };
        }

        const zoneId = entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null;
        const radius = options.radius || 104;
        const radiusSq = radius * radius;
        const counts = {
            warning: 0,
            teaching: 0,
            courtship: 0,
            calming: 0,
            guidance: 0,
            support: 0
        };
        const weights = {
            warning: 0,
            teaching: 0,
            courtship: 0,
            calming: 0,
            guidance: 0,
            support: 0
        };
        const sourceIds = new Set();
        const targetedSources = new Set();
        const contributors = [];

        for (const signal of this.activeSignals.values()) {
            if (!signal?.sourceId) continue;
            const source = this.getEntityById(signal.sourceId, gameState);
            if (!source?.id) continue;

            const sourceZoneId = signal.sourceZoneId || source.currentZoneId || source.lifeSim?.lifecycle?.currentZoneId || null;
            if (zoneId && sourceZoneId && sourceZoneId !== zoneId) continue;

            const targeted = Array.isArray(signal.targetIds) && signal.targetIds.includes(entity.id);
            if (signal.sourceId !== entity.id) {
                const dx = (source.x || 0) - (entity.x || 0);
                const dy = (source.y || 0) - (entity.y || 0);
                if (!targeted && ((dx * dx) + (dy * dy)) > radiusSq) continue;
            }

            const field = this.getSignalFieldKey(signal.signalType);
            const intensity = this.clamp01(signal.intensity ?? 0.55);
            const weight = this.clamp01(intensity + (targeted ? 0.16 : 0) + (signal.sourceId === entity.id ? 0.08 : 0));
            counts[field] += 1;
            weights[field] += weight;
            if (signal.sourceId !== entity.id) sourceIds.add(signal.sourceId);
            if (targeted) targetedSources.add(signal.sourceId);
            contributors.push({
                signalId: signal.id,
                signalType: signal.signalType,
                field,
                sourceId: signal.sourceId,
                sourceLabel: signal.sourceLabel || this.getEntityLabel(source),
                targeted,
                intensity,
                weight
            });
        }

        const recentReceived = entity.lifeSim?.communication?.recentReceived || [];
        const recentWeights = {
            warning: 0,
            teaching: 0,
            courtship: 0,
            calming: 0,
            guidance: 0,
            support: 0
        };
        for (let index = 0; index < Math.min(recentReceived.length, 4); index += 1) {
            const entry = recentReceived[index];
            const field = this.getSignalFieldKey(entry?.signalType);
            const memoryWeight = Math.max(0, 0.09 - (index * 0.015));
            recentWeights[field] += memoryWeight;
        }

        const pressureFor = field => this.clamp01((weights[field] || 0) * 0.72 + (recentWeights[field] || 0));
        const warningPressure = pressureFor('warning');
        const teachingPressure = pressureFor('teaching');
        const courtshipPressure = pressureFor('courtship');
        const calmingPressure = pressureFor('calming');
        const guidancePressure = pressureFor('guidance');
        const supportPressure = pressureFor('support');
        const dominantEntry = Object.entries({
            warning: warningPressure,
            teaching: teachingPressure,
            courtship: courtshipPressure,
            calming: calmingPressure,
            guidance: guidancePressure,
            support: supportPressure
        }).sort((left, right) => right[1] - left[1])[0] || ['quiet', 0];
        const dominantFamily = dominantEntry[1] > 0.08 ? dominantEntry[0] : 'quiet';
        const totalPressure = this.clamp01(
            Math.max(
                warningPressure,
                teachingPressure,
                courtshipPressure,
                calmingPressure,
                guidancePressure,
                supportPressure
            )
        );
        const label = dominantFamily === 'quiet'
            ? 'quiet | no active field'
            : `${this.getSignalFieldDisplayLabel(dominantFamily)} | ${sourceIds.size} nearby | ${Math.round(totalPressure * 100)}`;
        const detail = contributors.length
            ? contributors
                .slice()
                .sort((left, right) => right.weight - left.weight)
                .slice(0, 2)
                .map(entry => `${this.getSignalFieldDisplayLabel(entry.field)} ${entry.sourceLabel}`)
                .join(' | ')
            : 'No nearby active signals';

        return {
            dominantFamily,
            sourceCount: sourceIds.size,
            targetedCount: targetedSources.size,
            totalPressure,
            warningPressure,
            teachingPressure,
            courtshipPressure,
            calmingPressure,
            guidancePressure,
            supportPressure,
            counts,
            contributors,
            label,
            detail
        };
    }

    ensureNameIdentity(entity) {
        const communication = entity?.lifeSim?.communication;
        if (!entity?.id || !communication) return null;
        communication.knownNames = communication.knownNames || {};
        const displayLabel = this.getEntityLabel(entity);
        const baseName = this.stripSexSuffix(displayLabel);
        const existing = communication.knownNames[entity.id] || {};
        communication.selfName = displayLabel;
        communication.knownNames[entity.id] = {
            entityId: entity.id,
            displayLabel,
            baseName,
            learnedAtSeconds: existing.learnedAtSeconds ?? this.simulationClockSeconds,
            certainty: Math.max(existing.certainty ?? 0, 1),
            self: true
        };
        if (entity.lifeSim?.identity) {
            entity.lifeSim.identity.displayName = displayLabel;
            entity.lifeSim.identity.personalName = entity.personalName || baseName;
        }
        return communication.knownNames[entity.id];
    }

    rememberKnownName(observer, subject, options = {}) {
        const communication = observer?.lifeSim?.communication;
        if (!observer?.id || !subject?.id || !communication) return null;
        communication.knownNames = communication.knownNames || {};

        const displayLabel = options.displayLabel || this.getEntityLabel(subject);
        const baseName = options.baseName || this.stripSexSuffix(displayLabel);
        const existing = communication.knownNames[subject.id] || {};
        communication.knownNames[subject.id] = {
            entityId: subject.id,
            displayLabel,
            baseName,
            learnedAtSeconds: this.simulationClockSeconds,
            certainty: Math.max(existing.certainty || 0, options.certainty ?? 0.78),
            self: !!options.self
        };
        return communication.knownNames[subject.id];
    }

    getKnownName(observer, subject, options = {}) {
        if (!subject) return options.fallback || 'Butterfly';
        if (!observer?.lifeSim?.communication?.knownNames) {
            return options.includeSex ? this.getEntityLabel(subject, options.fallback) : this.stripSexSuffix(this.getEntityLabel(subject, options.fallback));
        }
        const known = observer.lifeSim.communication.knownNames[subject.id];
        if (known?.displayLabel || known?.baseName) {
            return options.includeSex ? (known.displayLabel || this.getEntityLabel(subject, options.fallback)) : (known.baseName || this.stripSexSuffix(known.displayLabel));
        }
        return options.includeSex ? this.getEntityLabel(subject, options.fallback) : this.stripSexSuffix(this.getEntityLabel(subject, options.fallback));
    }

    getResolvedEntityLabel(entityId, fallback = 'Butterfly', options = {}) {
        const entity = this.getEntityById(entityId);
        if (!entity) return fallback;
        const label = this.getEntityLabel(entity, fallback);
        return options.includeSex === false ? this.stripSexSuffix(label) : label;
    }

    refreshIdentityLabels(gameState = gameCore?.gameState) {
        const entities = this.getLiveEntities(gameState);
        const entityIds = new Set(entities.map(entity => entity.id));

        for (const entity of entities) {
            this.ensureNameIdentity(entity);
        }

        for (const entity of entities) {
            const communication = entity?.lifeSim?.communication;
            if (!communication?.knownNames) continue;

            for (const [knownId, known] of Object.entries(communication.knownNames)) {
                if (!entityIds.has(knownId)) continue;
                const displayLabel = this.getResolvedEntityLabel(knownId, known?.displayLabel || knownId, { includeSex: true });
                communication.knownNames[knownId] = {
                    ...known,
                    displayLabel,
                    baseName: this.stripSexSuffix(displayLabel)
                };
                if (knownId === entity.id) {
                    communication.selfName = displayLabel;
                }
            }
        }

        for (const signal of this.activeSignals.values()) {
            if (!signal?.sourceId) continue;
            signal.sourceLabel = this.getResolvedEntityLabel(signal.sourceId, signal.sourceLabel || signal.sourceId, { includeSex: true });
            if (Array.isArray(signal.targetIds)) {
                signal.targetLabels = signal.targetIds.map((targetId, index) =>
                    this.getResolvedEntityLabel(targetId, signal?.targetLabels?.[index] || targetId, { includeSex: true })
                );
            }
            if (Array.isArray(signal.targetLabels) && signal.targetLabels.length === 1) {
                signal.targetLabel = signal.targetLabels[0];
            }
        }

        this.history = (this.history || []).map(entry => {
            if (!entry) return entry;
            const next = { ...entry };
            if (entry.sourceId) {
                next.sourceLabel = this.getResolvedEntityLabel(entry.sourceId, entry.sourceLabel || entry.sourceId, { includeSex: true });
            }
            if (Array.isArray(entry.targetIds)) {
                next.targetLabels = entry.targetIds.map((targetId, index) =>
                    this.getResolvedEntityLabel(targetId, entry?.targetLabels?.[index] || targetId, { includeSex: true })
                );
                if (next.targetLabels.length === 1) {
                    next.targetLabel = next.targetLabels[0];
                }
            }
            return next;
        });

        this.dialogueHistory = (this.dialogueHistory || []).map(entry => {
            if (!entry) return entry;
            const next = { ...entry };
            if (entry.sourceId) {
                next.sourceLabel = this.getResolvedEntityLabel(entry.sourceId, entry.sourceLabel || entry.sourceId, { includeSex: true });
            }
            if (Array.isArray(entry.targetIds)) {
                next.targetLabels = entry.targetIds.map((targetId, index) =>
                    this.getResolvedEntityLabel(targetId, entry?.targetLabels?.[index] || targetId, { includeSex: true })
                );
                if (next.targetLabels.length === 1) {
                    next.targetLabel = next.targetLabels[0];
                }
            }
            if (Array.isArray(entry.residues)) {
                next.residues = entry.residues.map(residue => {
                    if (!residue) return residue;
                    const refreshed = { ...residue };
                    if (residue.recipientId) {
                        refreshed.recipientLabel = this.getResolvedEntityLabel(residue.recipientId, residue.recipientLabel || residue.recipientId, { includeSex: true });
                    }
                    if (residue.partnerId) {
                        refreshed.partnerLabel = this.getResolvedEntityLabel(residue.partnerId, residue.partnerLabel || residue.partnerId, { includeSex: true });
                    }
                    if (residue.sourceId) {
                        refreshed.sourceLabel = this.getResolvedEntityLabel(residue.sourceId, residue.sourceLabel || residue.sourceId, { includeSex: true });
                    }
                    return refreshed;
                });
            }
            return next;
        });
    }

    getDialogueSpec(signalType) {
        const specs = {
            teaching_signal: {
                verbal: true,
                intentTags: ['teaching'],
                category: 'talk',
                register: 'formal',
                allowResponse: true
            },
            calming_signal: {
                verbal: true,
                intentTags: ['comfort'],
                category: 'talk',
                register: 'neutral',
                allowResponse: true
            },
            warning_signal: {
                verbal: true,
                intentTags: ['warning'],
                category: 'talk',
                register: 'neutral',
                allowResponse: true
            },
            courtship_signal: {
                verbal: true,
                intentTags: ['courtship'],
                category: 'talk',
                register: 'casual',
                allowResponse: true
            },
            acknowledgement_signal: {
                verbal: true,
                intentTags: ['reply', 'casual'],
                category: 'talk',
                register: 'casual',
                allowResponse: true
            },
            guidance_signal: {
                verbal: true,
                intentTags: ['guidance', 'coordination'],
                category: 'talk',
                register: 'neutral',
                allowResponse: true
            },
            trust_display: {
                verbal: false,
                intentTags: ['display'],
                category: 'signals',
                register: 'neutral',
                allowResponse: false
            }
        };

        return specs[signalType] || {
            verbal: false,
            intentTags: ['signal'],
            category: 'signals',
            register: 'neutral',
            allowResponse: false
        };
    }

    getDialogueIntentProfile(signalType, source = null, context = {}) {
        const carryingObject = !!source?.blockInteraction?.carryingBlockId || !!source?.pendingPollenDropTarget;
        const talkMode = context.talkMode || 'open_talk';
        const guidanceSubtype = carryingObject
            ? 'direct_place'
            : (talkMode === 'open_talk' ? 'announce_route' : 'direct_move');
        const primaryTarget = Array.isArray(context.recipients) ? context.recipients[0] : null;
        const pairState = this.getPairConversationState(source, primaryTarget?.id || null);
        const pairTexture = this.getPairConversationTextureState(source, primaryTarget?.id || null);
        const acknowledgementSubtype = this.selectAcknowledgementSubtype(source, primaryTarget, context, pairState, pairTexture);
        const calmingSubtype = this.selectCalmingSubtype(source, primaryTarget, context, pairState, pairTexture);

        const profiles = {
            teaching_signal: {
                family: 'teaching',
                subtype: talkMode === 'multi_target' ? 'demonstrate' : 'explain',
                intentTags: ['teaching'],
                allowResponse: true,
                pairMode: pairState.mode,
                pairTexture: pairTexture.key,
                pairTextureLabel: pairTexture.label
            },
            calming_signal: {
                family: 'social',
                subtype: calmingSubtype,
                intentTags: calmingSubtype === 'reassure'
                    ? ['comfort']
                    : this.getSocialSubtypeIntentTags(calmingSubtype),
                allowResponse: true,
                pairMode: pairState.mode,
                pairTexture: pairTexture.key,
                pairTextureLabel: pairTexture.label
            },
            warning_signal: {
                family: 'warning',
                subtype: 'warn',
                intentTags: ['warning'],
                allowResponse: talkMode === 'single_target' && !!primaryTarget,
                pairMode: pairState.mode,
                pairTexture: pairTexture.key,
                pairTextureLabel: pairTexture.label
            },
            courtship_signal: {
                family: 'social',
                subtype: 'court',
                intentTags: ['courtship'],
                allowResponse: true,
                pairMode: pairState.mode,
                pairTexture: pairTexture.key,
                pairTextureLabel: pairTexture.label
            },
            acknowledgement_signal: {
                family: 'social',
                subtype: acknowledgementSubtype,
                intentTags: this.getSocialSubtypeIntentTags(acknowledgementSubtype),
                allowResponse: talkMode === 'single_target' && !!primaryTarget,
                pairMode: pairState.mode,
                pairTexture: pairTexture.key,
                pairTextureLabel: pairTexture.label
            },
            guidance_signal: {
                family: 'task',
                subtype: guidanceSubtype,
                intentTags: ['guidance', 'coordination'],
                allowResponse: true,
                pairMode: pairState.mode,
                pairTexture: pairTexture.key,
                pairTextureLabel: pairTexture.label
            }
        };

        return profiles[signalType] || {
            family: 'social',
            subtype: 'observe',
            intentTags: ['reply'],
            allowResponse: false,
            pairMode: pairState.mode,
            pairTexture: pairTexture.key,
            pairTextureLabel: pairTexture.label
        };
    }

    getRelationshipContext(entity, partnerId = null) {
        const edge = partnerId
            ? (entity?.lifeSim?.socialEdges?.[partnerId] || {})
            : {};
        const chemistry = this.computeChemistry(edge, 0);
        const pairState = this.getPairConversationState(entity, partnerId);
        const pairTexture = this.getPairConversationTextureState(entity, partnerId);
        return {
            trust: edge.trust || 0,
            comfort: edge.comfort || 0,
            admiration: edge.admiration || 0,
            resentment: edge.resentment || 0,
            attachment: edge.attachment || 0,
            protectiveness: edge.protectiveness || 0,
            rejectionWeight: edge.rejectionWeight || 0,
            reciprocityScore: edge.reciprocityScore || 0,
            followThroughScore: edge.followThroughScore || 0,
            forgivenessWeight: edge.forgivenessWeight || 0,
            repairState: edge.repairState || null,
            chemistry,
            recentWarmth: pairState.warmth,
            recentEase: pairState.ease,
            recentFriction: pairState.friction,
            recentMutualAttention: pairState.mutualAttention,
            pairMode: pairState.mode,
            pairModeLabel: pairState.label,
            pairTexture: pairTexture.key,
            pairTextureLabel: pairTexture.label,
            pairTextureSignature: pairTexture.signature,
            pairTextureLingerBias: pairTexture.lingerBias,
            pairTextureConfidenceBias: pairTexture.confidenceBias,
            pairTextureCourtshipBias: pairTexture.courtshipBias,
            pairTextureVolatility: pairTexture.volatility
        };
    }

    getFollowThroughBehaviorProfile(entity, gameState = gameCore?.gameState, options = {}) {
        if (!entity?.id) {
            return {
                dominantMode: 'none',
                label: 'no strong carry-over',
                detail: 'seek 0 | avoid 0 | imitate 0 | protect 0'
            };
        }

        const zoneId = options.zoneId || entity.currentZoneId || entity?.lifeSim?.lifecycle?.currentZoneId || null;
        const candidates = Array.isArray(options.nearbyButterflies)
            ? options.nearbyButterflies.filter(candidate => candidate?.id && candidate.id !== entity.id)
            : ((gameCore?.getButterfliesInZone?.(zoneId) || gameState?.butterflies || [])
                .filter(candidate => candidate?.id && candidate.id !== entity.id));

        const ranked = candidates.map(candidate => {
            const relationship = this.getRelationshipContext(entity, candidate.id);
            const distance = Math.hypot((candidate.x || 0) - (entity.x || 0), (candidate.y || 0) - (entity.y || 0));
            const distanceWeight = this.clamp01(distance / 180);
            const candidateVulnerable = this.isEntitySociallyVulnerable(candidate);
            const pairTexture = relationship.pairTexture || 'steady';
            const repairState = candidate?.lifeSim?.socialEdges?.[entity.id]?.repairState || relationship.repairState || null;

            const seekScore = this.clamp01(
                relationship.trust * 0.16
                + relationship.comfort * 0.2
                + relationship.attachment * 0.22
                + relationship.followThroughScore * 0.16
                + relationship.recentWarmth * 0.12
                + relationship.recentEase * 0.08
                + relationship.recentMutualAttention * 0.1
                + Math.max(0, relationship.pairTextureLingerBias || 0) * 0.4
                - relationship.resentment * 0.14
                - relationship.rejectionWeight * 0.16
                - relationship.recentFriction * 0.12
                - distanceWeight * 0.12
            );

            const avoidScore = this.clamp01(
                relationship.resentment * 0.28
                + relationship.rejectionWeight * 0.24
                + relationship.recentFriction * 0.24
                + ((pairTexture === 'strained' || pairTexture === 'guarded') ? 0.12 : 0)
                + ((repairState === 'hurt' || repairState === 'offered') ? 0.06 : 0)
                + (distance <= 112 ? 0.08 : 0)
                - relationship.trust * 0.08
                - relationship.comfort * 0.08
            );

            const imitateScore = this.clamp01(
                relationship.admiration * 0.46
                + relationship.followThroughScore * 0.14
                + relationship.recentMutualAttention * 0.1
                + Math.max(0, relationship.pairTextureConfidenceBias || 0) * 0.36
                + relationship.recentWarmth * 0.06
                + relationship.trust * 0.08
                - relationship.resentment * 0.1
                - relationship.rejectionWeight * 0.08
                - distanceWeight * 0.1
            );

            const protectScore = this.clamp01(
                relationship.protectiveness * 0.38
                + relationship.attachment * 0.14
                + relationship.trust * 0.1
                + relationship.followThroughScore * 0.08
                + (candidateVulnerable ? 0.18 : 0)
                - relationship.resentment * 0.08
                - distanceWeight * 0.08
            );

            return {
                candidate,
                relationship,
                distance,
                candidateVulnerable,
                seekScore,
                avoidScore,
                imitateScore,
                protectScore
            };
        }).sort((left, right) => left.distance - right.distance);

        const pickBest = (field, threshold = 0.26) => {
            const viable = ranked
                .filter(entry => (entry[field] || 0) >= threshold)
                .sort((left, right) => ((right[field] || 0) - (left[field] || 0)) || (left.distance - right.distance));
            return viable[0] || null;
        };

        const seek = pickBest('seekScore', 0.28);
        const avoid = pickBest('avoidScore', 0.3);
        const imitate = pickBest('imitateScore', 0.22);
        const protect = pickBest('protectScore', 0.26);

        const dominant = [
            { mode: 'seek', entry: seek, score: seek?.seekScore || 0 },
            { mode: 'avoid', entry: avoid, score: avoid?.avoidScore || 0 },
            { mode: 'imitate', entry: imitate, score: imitate?.imitateScore || 0 },
            { mode: 'protect', entry: protect, score: protect?.protectScore || 0 }
        ].sort((left, right) => right.score - left.score)[0];

        const detail = `seek ${Math.round((seek?.seekScore || 0) * 100)} | avoid ${Math.round((avoid?.avoidScore || 0) * 100)} | imitate ${Math.round((imitate?.imitateScore || 0) * 100)} | protect ${Math.round((protect?.protectScore || 0) * 100)}`;

        const dominantLabel = dominant?.entry?.candidate
            ? `${dominant.mode} ${this.getEntityLabel(dominant.entry.candidate)}`
            : 'no strong carry-over';

        return {
            dominantMode: dominant?.score > 0 ? dominant.mode : 'none',
            label: dominantLabel,
            detail,
            seekPartnerId: seek?.candidate?.id || null,
            seekPartnerLabel: seek?.candidate ? this.getEntityLabel(seek.candidate) : null,
            seekScore: this.clamp01(seek?.seekScore || 0),
            avoidPartnerId: avoid?.candidate?.id || null,
            avoidPartnerLabel: avoid?.candidate ? this.getEntityLabel(avoid.candidate) : null,
            avoidScore: this.clamp01(avoid?.avoidScore || 0),
            imitatePartnerId: imitate?.candidate?.id || null,
            imitatePartnerLabel: imitate?.candidate ? this.getEntityLabel(imitate.candidate) : null,
            imitateScore: this.clamp01(imitate?.imitateScore || 0),
            protectPartnerId: protect?.candidate?.id || null,
            protectPartnerLabel: protect?.candidate ? this.getEntityLabel(protect.candidate) : null,
            protectScore: this.clamp01(protect?.protectScore || 0)
        };
    }

    getPairConversationModeLabel(mode = 'easy') {
        const labels = {
            easy: 'easy',
            playful: 'playful',
            tender: 'tender',
            guarded: 'guarded',
            strained: 'strained',
            admiring: 'admiring'
        };
        return labels[mode] || 'easy';
    }

    getPairConversationTextureLabel(texture = 'steady') {
        const labels = {
            devoted: 'devoted',
            playful: 'playful',
            admiring: 'admiring',
            repairing: 'repairing',
            guarded: 'guarded',
            strained: 'strained',
            steady: 'steady'
        };
        return labels[texture] || 'steady';
    }

    getPairConversationTextureSignature(texture = 'steady') {
        const labels = {
            devoted: 'strong closeness that keeps finding its way back',
            playful: 'light teasing warmth and shared attention',
            admiring: 'notice-and-praise pull',
            repairing: 'trying to soften old sharpness',
            guarded: 'careful distance and slow trust',
            strained: 'friction arrives faster than ease',
            steady: 'familiar ease without much drama'
        };
        return labels[texture] || labels.steady;
    }

    getPairConversationState(entity, partnerId = null) {
        const edge = partnerId
            ? (entity?.lifeSim?.socialEdges?.[partnerId] || {})
            : {};
        const warmth = this.clamp01(edge.recentWarmth || 0);
        const ease = this.clamp01(edge.recentEase || 0);
        const friction = this.clamp01(edge.recentFriction || 0);
        const mutualAttention = this.clamp01(edge.recentMutualAttention || 0);
        const trust = this.clamp01(edge.trust || 0);
        const comfort = this.clamp01(edge.comfort || 0);
        const admiration = this.clamp01(edge.admiration || 0);
        const attachment = this.clamp01(edge.attachment || 0);
        const resentment = this.clamp01(edge.resentment || 0);
        const rejectionWeight = this.clamp01(edge.rejectionWeight || 0);
        const reciprocity = this.clamp01(edge.reciprocityScore || 0);

        let mode = 'easy';
        if (friction > 0.34 || resentment > 0.22 || rejectionWeight > 0.18) {
            mode = 'strained';
        } else if (rejectionWeight > 0.1 || (trust < 0.16 && comfort < 0.18)) {
            mode = 'guarded';
        } else if (attachment > 0.32 || (comfort > 0.34 && warmth > 0.2)) {
            mode = 'tender';
        } else if (admiration > 0.34 && comfort < 0.28) {
            mode = 'admiring';
        } else if (ease > 0.18 && warmth > 0.18 && mutualAttention > 0.14 && reciprocity > 0.08) {
            mode = 'playful';
        }

        return {
            mode,
            label: this.getPairConversationModeLabel(mode),
            warmth,
            ease,
            friction,
            mutualAttention
        };
    }

    getPairConversationTextureState(entity, partnerId = null) {
        const edge = partnerId
            ? (entity?.lifeSim?.socialEdges?.[partnerId] || {})
            : {};
        const pairState = this.getPairConversationState(entity, partnerId);
        const chemistry = this.computeChemistry(edge, 0);
        const trust = this.clamp01(edge.trust || 0);
        const comfort = this.clamp01(edge.comfort || 0);
        const admiration = this.clamp01(edge.admiration || 0);
        const attachment = this.clamp01(edge.attachment || 0);
        const reciprocity = this.clamp01(edge.reciprocityScore || 0);
        const forgiveness = this.clamp01(edge.forgivenessWeight || 0);
        const resentment = this.clamp01(edge.resentment || 0);
        const rejectionWeight = this.clamp01(edge.rejectionWeight || 0);
        const repairState = edge.repairState || null;
        const recentResidues = Array.isArray(edge.recentResidues) ? edge.recentResidues : [];
        const recentPlayful = recentResidues.filter(residue => residue?.type === 'playful-banter').length;
        const recentRepair = recentResidues.filter(residue => ['accepted-repair', 'repair-offer', 'shared-calm'].includes(residue?.type)).length;
        const recentPraise = recentResidues.filter(residue => residue?.type === 'small-praise').length;

        let key = 'steady';
        if (
            pairState.mode === 'strained'
            || pairState.friction > 0.34
            || resentment > 0.24
            || rejectionWeight > 0.2
        ) {
            key = 'strained';
        } else if (
            ['repair-open', 'offered', 'hurt'].includes(repairState)
            || (recentRepair >= 1 && (resentment > 0.08 || rejectionWeight > 0.05 || pairState.friction > 0.08))
            || (forgiveness > 0.22 && pairState.friction > 0.1)
        ) {
            key = 'repairing';
        } else if (
            (attachment > 0.4 && comfort > 0.42 && reciprocity > 0.24)
            || (chemistry > 0.54 && pairState.warmth > 0.24 && pairState.mutualAttention > 0.18)
        ) {
            key = 'devoted';
        } else if (
            pairState.mode === 'playful'
            || recentPlayful >= 1
            || (pairState.ease > 0.2 && pairState.warmth > 0.2 && pairState.mutualAttention > 0.18 && chemistry > 0.32)
        ) {
            key = 'playful';
        } else if (
            pairState.mode === 'admiring'
            || admiration > 0.36
            || recentPraise >= 1
        ) {
            key = 'admiring';
        } else if (
            pairState.mode === 'guarded'
            || rejectionWeight > 0.1
            || (trust < 0.2 && comfort < 0.2 && pairState.warmth < 0.14)
        ) {
            key = 'guarded';
        }

        const biasByTexture = {
            devoted: { lingerBias: 0.18, confidenceBias: 0.08, courtshipBias: 0.12, volatility: 0.12 },
            playful: { lingerBias: 0.1, confidenceBias: 0.06, courtshipBias: 0.04, volatility: 0.2 },
            admiring: { lingerBias: 0.04, confidenceBias: 0.12, courtshipBias: 0.08, volatility: 0.14 },
            repairing: { lingerBias: 0.06, confidenceBias: -0.02, courtshipBias: -0.04, volatility: 0.32 },
            guarded: { lingerBias: -0.04, confidenceBias: -0.06, courtshipBias: -0.06, volatility: 0.24 },
            strained: { lingerBias: -0.12, confidenceBias: -0.12, courtshipBias: -0.12, volatility: 0.52 },
            steady: { lingerBias: 0.06, confidenceBias: 0.03, courtshipBias: 0.02, volatility: 0.16 }
        };
        const bias = biasByTexture[key] || biasByTexture.steady;

        return {
            key,
            label: this.getPairConversationTextureLabel(key),
            signature: this.getPairConversationTextureSignature(key),
            chemistry,
            warmth: pairState.warmth,
            ease: pairState.ease,
            friction: pairState.friction,
            mutualAttention: pairState.mutualAttention,
            lingerBias: bias.lingerBias,
            confidenceBias: bias.confidenceBias,
            courtshipBias: bias.courtshipBias,
            volatility: bias.volatility
        };
    }

    pickPairSubtype(source, partnerId, seedTag, choices = []) {
        const pool = choices.filter(Boolean);
        if (!pool.length) return null;
        const seed = this.buildNameSeed(
            source?.id || 'speaker',
            partnerId || 'none',
            seedTag,
            Math.floor(this.simulationClockSeconds * 2),
            this.dialogueHistory.length
        );
        return pool[seed % pool.length];
    }

    getSocialSubtypeIntentTags(subtype = 'check_in') {
        const tagsBySubtype = {
            check_in: ['reply', 'casual', 'companionship', 'warmth'],
            shared_observation: ['reply', 'casual', 'shared_attention'],
            playful_banter: ['reply', 'casual', 'playful', 'warmth', 'shared_attention'],
            gentle_tease: ['reply', 'casual', 'playful', 'friction', 'warmth'],
            quiet_companionship: ['comfort', 'casual', 'companionship', 'warmth'],
            small_praise: ['reply', 'casual', 'admiration', 'warmth'],
            light_irritation: ['reply', 'casual', 'friction'],
            soft_repair: ['comfort', 'casual', 'repair', 'forgiveness', 'warmth']
        };
        return tagsBySubtype[subtype] || ['reply', 'casual'];
    }

    selectAcknowledgementSubtype(source, partner = null, context = {}, pairState = null, pairTextureState = null) {
        const state = pairState || this.getPairConversationState(source, partner?.id || null);
        const texture = pairTextureState || this.getPairConversationTextureState(source, partner?.id || null);
        const talkMode = context.talkMode || 'open_talk';
        const responseTo = context.responseTo || null;
        const partnerEdge = partner?.lifeSim?.socialEdges?.[source?.id] || {};
        const partnerAdmiration = this.clamp01(partnerEdge.admiration || 0);
        const partnerWarmth = this.clamp01(partnerEdge.recentWarmth || 0);

        if (responseTo?.intentTags?.includes('repair') || ['offered', 'repair-open', 'hurt'].includes(partner?.lifeSim?.socialEdges?.[source?.id]?.repairState)) {
            return this.pickPairSubtype(source, partner?.id || null, 'soft-repair', ['soft_repair', 'check_in']);
        }
        if (texture.key === 'strained') {
            return this.pickPairSubtype(source, partner?.id || null, 'strained', ['light_irritation', 'check_in', 'soft_repair']);
        }
        if (texture.key === 'repairing') {
            return this.pickPairSubtype(source, partner?.id || null, 'repairing', ['soft_repair', 'quiet_companionship', 'check_in']);
        }
        if (texture.key === 'playful') {
            return this.pickPairSubtype(source, partner?.id || null, 'playful', ['playful_banter', 'gentle_tease', 'shared_observation']);
        }
        if (texture.key === 'devoted' || state.mode === 'tender') {
            return this.pickPairSubtype(source, partner?.id || null, 'tender', ['quiet_companionship', 'small_praise', 'check_in']);
        }
        if (texture.key === 'admiring' || state.mode === 'admiring') {
            return this.pickPairSubtype(source, partner?.id || null, 'admiring', ['small_praise', 'shared_observation', 'check_in']);
        }
        if (talkMode === 'open_talk') {
            const openChoices = ['shared_observation', 'check_in'];
            if (state.warmth > 0.12 || partnerWarmth > 0.12) {
                openChoices.push('quiet_companionship');
            }
            if (partnerAdmiration > 0.18) {
                openChoices.push('small_praise');
            }
            if (texture.key === 'repairing') {
                openChoices.push('soft_repair');
            }
            if (texture.key === 'playful') {
                openChoices.push('playful_banter');
            }
            return this.pickPairSubtype(source, partner?.id || null, 'open', openChoices);
        }
        if (texture.key === 'guarded' || state.mode === 'guarded') {
            return this.pickPairSubtype(source, partner?.id || null, 'guarded', ['check_in', 'shared_observation']);
        }
        const easyChoices = ['check_in', 'shared_observation', 'quiet_companionship'];
        if (partnerAdmiration > 0.16 || state.warmth > 0.14 || partnerWarmth > 0.14) {
            easyChoices.push('small_praise');
        }
        return this.pickPairSubtype(source, partner?.id || null, 'easy', easyChoices);
    }

    selectCalmingSubtype(source, partner = null, context = {}, pairState = null, pairTextureState = null) {
        const state = pairState || this.getPairConversationState(source, partner?.id || null);
        const texture = pairTextureState || this.getPairConversationTextureState(source, partner?.id || null);
        const threat = this.clamp01(source?.lifeSim?.emotions?.threat ?? 0);
        const agitation = this.clamp01(source?.lifeSim?.emotions?.agitation ?? 0);
        const repairState = partner?.lifeSim?.socialEdges?.[source?.id]?.repairState || null;

        if (texture.key === 'repairing' || ['offered', 'repair-open', 'hurt'].includes(repairState) || context.responseTo?.intentTags?.includes('repair')) {
            return 'soft_repair';
        }
        if (texture.key === 'devoted' && threat < 0.24 && agitation < 0.3) {
            return this.pickPairSubtype(source, partner?.id || null, 'calm-devoted', ['quiet_companionship', 'check_in']);
        }
        if (threat < 0.2 && agitation < 0.28 && (state.warmth + state.ease) > 0.22) {
            return this.pickPairSubtype(source, partner?.id || null, 'calm-casual', ['quiet_companionship', 'check_in']);
        }
        return 'reassure';
    }

    getRecentPartnerDialogue(entity, partnerId = null) {
        if (!entity?.lifeSim?.communication?.recentDialogues?.length || !partnerId) return null;
        return entity.lifeSim.communication.recentDialogues.find(entry => entry.partnerId === partnerId) || null;
    }

    getRecentPartnerResidue(entity, partnerId = null) {
        const residues = entity?.lifeSim?.communication?.recentResidues;
        if (!Array.isArray(residues) || !residues.length) return null;
        if (!partnerId) return residues[0] || null;
        return residues.find(entry => entry?.partnerId === partnerId) || null;
    }

    getLatestRetainedLesson(entity, partnerId = null) {
        const lessons = entity?.lifeSim?.communication?.retainedLessons;
        if (!Array.isArray(lessons) || !lessons.length) return null;
        if (!partnerId) return lessons[0] || null;
        return lessons.find(entry => entry?.partnerId === partnerId) || null;
    }

    getResponseIntentMetadata(stance, dialogue, recipient = null) {
        const responseToTags = dialogue?.intentTags || [];
        const edge = recipient?.lifeSim?.socialEdges?.[dialogue?.sourceId] || {};
        const repairContext = (edge.resentment || 0) > 0.14 || (edge.rejectionWeight || 0) > 0.08;

        if (stance === 'flirt_back') {
            return {
                intentSubtype: 'mutual_courtship',
                intentTags: ['courtship', 'reciprocal', 'follow_through']
            };
        }
        if (stance === 'warm_reply') {
            return {
                intentSubtype: 'warming_reply',
                intentTags: ['courtship', 'reciprocal']
            };
        }
        if (stance === 'hesitate' && responseToTags.includes('courtship')) {
            return {
                intentSubtype: 'gentle_rejection',
                intentTags: ['reply', 'rejection']
            };
        }
        if (stance === 'hesitate' && (responseToTags.includes('warning') || responseToTags.includes('guidance') || responseToTags.includes('coordination'))) {
            return {
                intentSubtype: 'uneasy_reply',
                intentTags: ['reply', 'refusal']
            };
        }
        if (stance === 'reflect') {
            return {
                intentSubtype: 'retained_lesson',
                intentTags: ['teaching', 'learned', 'follow_through', 'agreement']
            };
        }
        if (stance === 'comply') {
            return {
                intentSubtype: responseToTags.includes('warning') ? 'accept_warning' : 'accepted_guidance',
                intentTags: [...(responseToTags.includes('warning') ? ['warning'] : ['guidance']), 'agreement', 'follow_through']
            };
        }
        if (stance === 'comfort_back') {
            return {
                intentSubtype: repairContext ? 'repair_reply' : 'shared_calm',
                intentTags: ['comfort', ...(repairContext ? ['repair', 'forgiveness'] : ['follow_through'])]
            };
        }
        if (responseToTags.includes('comfort') && repairContext) {
            return {
                intentSubtype: 'repair_open',
                intentTags: ['reply', 'forgiveness']
            };
        }
        return {
            intentSubtype: null,
            intentTags: []
        };
    }

    countRecentDialogueResidues(entity, partnerId = null, matcher = null) {
        const residues = entity?.lifeSim?.communication?.recentResidues;
        if (!Array.isArray(residues) || !residues.length) return 0;
        return residues.filter(entry => {
            if (partnerId && entry?.partnerId !== partnerId) return false;
            return typeof matcher === 'function' ? !!matcher(entry) : true;
        }).length;
    }

    getDialogueRememberability(score = 0) {
        if (score >= 0.72) return 'anchoring';
        if (score >= 0.42) return 'notable';
        return 'fleeting';
    }

    getDialogueResidueTypeLabel(type = 'heard') {
        const labels = {
            'mutual-courtship': 'mutual courtship',
            'warming-courtship': 'warming courtship',
            'gentle-rejection': 'gentle rejection',
            'courtship-offer': 'courtship offer',
            'retained-lesson': 'retained lesson',
            'heard-lesson': 'heard lesson',
            'missed-lesson': 'missed lesson',
            'held-guidance': 'held guidance',
            'protective-warning': 'protective warning',
            'warning-heard': 'warning heard',
            'guidance-heard': 'guidance heard',
            'uneasy-guidance': 'uneasy guidance',
            'accepted-repair': 'repair accepted',
            'repair-offer': 'repair offered',
            'shared-calm': 'shared calm',
            'comfort-heard': 'comfort heard',
            'agreement': 'agreement held',
            'warm-company': 'quiet company',
            'shared-observation': 'shared observation',
            'playful-banter': 'playful banter',
            'small-praise': 'small praise',
            'light-friction': 'light friction',
            'acknowledged': 'acknowledged'
        };
        return labels[type] || type || 'heard';
    }

    buildDialogueResidue(recipient, source, dialogue, deltas = {}, stance = null) {
        if (!recipient?.lifeSim || !source?.id || !dialogue?.id) return null;

        const edge = recipient.lifeSim.socialEdges?.[source.id] || {};
        const communication = recipient.lifeSim.communication || {};
        const clarity = this.clamp01(recipient.lifeSim?.interpretation?.clarity ?? 0.5);
        const threat = this.clamp01(recipient.lifeSim?.emotions?.threat ?? 0);
        const trust = this.clamp01(edge.trust || 0);
        const comfort = this.clamp01(edge.comfort || 0);
        const resentment = this.clamp01(edge.resentment || 0);
        const rejectionWeight = this.clamp01(edge.rejectionWeight || 0);
        const intentTags = dialogue.intentTags || [];
        const reinforcementCount = this.countRecentDialogueResidues(recipient, source.id, residue =>
            Array.isArray(residue?.intentTags) && residue.intentTags.some(tag => intentTags.includes(tag))
        );
        const directness = dialogue.talkMode === 'single_target' ? 0.08 : dialogue.talkMode === 'multi_target' ? 0.03 : 0;
        const relationshipImpact = Object.values(deltas || {}).reduce((sum, value) => sum + Math.abs(value || 0), 0);
        const pairState = this.getPairConversationState(recipient, source.id);
        const openness = this.clamp01(
            0.38
            + (clarity * 0.32)
            + (trust * 0.16)
            + (comfort * 0.12)
            - (threat * 0.22)
            - (resentment * 0.14)
            - (rejectionWeight * 0.12)
        );

        let rememberabilityScore = 0.14
            + (clarity * 0.28)
            + (openness * 0.18)
            + (relationshipImpact * 2.6)
            + directness
            + Math.min(0.12, reinforcementCount * 0.04);
        if (intentTags.includes('courtship') || intentTags.includes('teaching') || intentTags.includes('warning') || intentTags.includes('comfort')) {
            rememberabilityScore += 0.08;
        }
        if (['flirt_back', 'warm_reply', 'hesitate', 'reflect', 'comply', 'comfort_back'].includes(stance)) {
            rememberabilityScore += 0.08;
        }
        if (threat > 0.5 || resentment > 0.18) {
            rememberabilityScore += 0.05;
        }
        if (intentTags.includes('casual') && !intentTags.includes('courtship') && !intentTags.includes('teaching') && !intentTags.includes('warning')) {
            rememberabilityScore -= 0.1;
        }
        if (intentTags.includes('shared_attention') || intentTags.includes('playful') || intentTags.includes('companionship')) {
            rememberabilityScore -= 0.04;
        }

        const rememberability = this.getDialogueRememberability(rememberabilityScore);
        const repairContext = intentTags.includes('comfort') && (
            (edge.resentment || 0) > 0.14
            || (edge.rejectionWeight || 0) > 0.08
            || ((edge.forgivenessWeight || 0) > 0.05 && (edge.recentFriction || 0) > 0.08)
        );

        let type = 'acknowledged';
        let followThroughState = 'heard';
        let relationshipDeltas = {
            reciprocityDelta: 0,
            rejectionDelta: 0,
            followThroughDelta: 0,
            forgivenessDelta: 0,
            resentmentRelief: 0,
            warmthDelta: 0,
            easeDelta: 0,
            frictionDelta: 0,
            frictionRelief: 0,
            mutualAttentionDelta: 0
        };

        if (intentTags.includes('courtship')) {
            if (stance === 'flirt_back') {
                type = 'mutual-courtship';
                followThroughState = 'returned';
                relationshipDeltas.reciprocityDelta = 0.18;
                relationshipDeltas.followThroughDelta = 0.08;
            } else if (stance === 'warm_reply') {
                type = 'warming-courtship';
                followThroughState = 'opened';
                relationshipDeltas.reciprocityDelta = 0.08;
                relationshipDeltas.followThroughDelta = 0.04;
            } else if (stance === 'hesitate') {
                type = 'gentle-rejection';
                followThroughState = 'held-at-distance';
                relationshipDeltas.rejectionDelta = 0.16;
            } else {
                type = 'courtship-offer';
            }
        } else if (intentTags.includes('teaching')) {
            if (stance === 'reflect') {
                type = 'retained-lesson';
                followThroughState = 'held';
                relationshipDeltas.followThroughDelta = 0.14;
            } else if (stance === 'hesitate') {
                type = 'missed-lesson';
                followThroughState = 'uncertain';
            } else {
                type = 'heard-lesson';
                followThroughState = 'considering';
                relationshipDeltas.followThroughDelta = 0.06;
            }
        } else if (intentTags.includes('warning') || intentTags.includes('guidance') || intentTags.includes('coordination')) {
            if (stance === 'comply') {
                type = intentTags.includes('warning') ? 'protective-warning' : 'held-guidance';
                followThroughState = 'acting';
                relationshipDeltas.followThroughDelta = 0.12;
            } else if (stance === 'hesitate') {
                type = 'uneasy-guidance';
                followThroughState = 'resisted';
                relationshipDeltas.rejectionDelta = 0.04;
            } else {
                type = intentTags.includes('warning') ? 'warning-heard' : 'guidance-heard';
            }
        } else if (intentTags.includes('comfort')) {
            if (repairContext && (stance === 'comfort_back' || stance === 'acknowledge')) {
                type = 'accepted-repair';
                followThroughState = 'repair-open';
                relationshipDeltas.forgivenessDelta = 0.16;
                relationshipDeltas.resentmentRelief = 0.04;
                relationshipDeltas.warmthDelta = 0.08;
                relationshipDeltas.easeDelta = 0.06;
                relationshipDeltas.frictionRelief = 0.08;
                relationshipDeltas.mutualAttentionDelta = 0.05;
            } else if (repairContext) {
                type = 'repair-offer';
                followThroughState = 'repair-offered';
                relationshipDeltas.forgivenessDelta = 0.06;
                relationshipDeltas.resentmentRelief = 0.02;
                relationshipDeltas.warmthDelta = 0.04;
                relationshipDeltas.easeDelta = 0.04;
                relationshipDeltas.frictionRelief = 0.04;
                relationshipDeltas.mutualAttentionDelta = 0.04;
            } else if (stance === 'comfort_back') {
                type = 'shared-calm';
                followThroughState = 'held';
                relationshipDeltas.followThroughDelta = 0.06;
                relationshipDeltas.warmthDelta = 0.06;
                relationshipDeltas.easeDelta = 0.08;
                relationshipDeltas.mutualAttentionDelta = 0.04;
            } else {
                type = 'comfort-heard';
                relationshipDeltas.warmthDelta = 0.03;
                relationshipDeltas.easeDelta = 0.04;
                relationshipDeltas.mutualAttentionDelta = 0.03;
            }
        } else if (intentTags.includes('playful')) {
            type = 'playful-banter';
            followThroughState = 'lingering';
            relationshipDeltas.warmthDelta = 0.09;
            relationshipDeltas.easeDelta = 0.1;
            relationshipDeltas.mutualAttentionDelta = 0.08;
            if (intentTags.includes('friction')) {
                relationshipDeltas.frictionDelta = 0.03;
            }
        } else if (intentTags.includes('shared_attention')) {
            type = 'shared-observation';
            followThroughState = 'lingering';
            relationshipDeltas.warmthDelta = 0.04;
            relationshipDeltas.easeDelta = 0.05;
            relationshipDeltas.mutualAttentionDelta = 0.1;
        } else if (intentTags.includes('admiration')) {
            type = 'small-praise';
            followThroughState = 'held';
            relationshipDeltas.warmthDelta = 0.06;
            relationshipDeltas.easeDelta = 0.04;
            relationshipDeltas.mutualAttentionDelta = 0.06;
        } else if (intentTags.includes('companionship')) {
            type = 'warm-company';
            followThroughState = 'held';
            relationshipDeltas.warmthDelta = 0.07;
            relationshipDeltas.easeDelta = 0.08;
            relationshipDeltas.mutualAttentionDelta = 0.07;
        } else if (intentTags.includes('friction')) {
            type = 'light-friction';
            followThroughState = 'carried';
            relationshipDeltas.frictionDelta = 0.08;
            relationshipDeltas.mutualAttentionDelta = 0.04;
        } else if (intentTags.includes('rejection')) {
            type = 'gentle-rejection';
            followThroughState = 'held-at-distance';
            relationshipDeltas.rejectionDelta = 0.18;
        } else if (intentTags.includes('agreement')) {
            type = 'agreement';
            followThroughState = 'acting';
            relationshipDeltas.followThroughDelta = 0.08;
        }

        const priorTeachingResidues = this.countRecentDialogueResidues(recipient, source.id, residue =>
            Array.isArray(residue?.intentTags)
            && residue.intentTags.includes('teaching')
            && ['notable', 'anchoring'].includes(residue.rememberability)
        );
        const speakerName = this.stripSexSuffix(this.getEntityLabel(source));
        const learnEligible = intentTags.includes('teaching')
            && stance === 'reflect'
            && rememberability !== 'fleeting'
            && priorTeachingResidues >= 1;
        const learnLabel = learnEligible
            ? `Held onto ${speakerName}'s lesson.`
            : null;

        return {
            id: `residue_${dialogue.id}_${recipient.id}`,
            dialogueId: dialogue.id,
            recipientId: recipient.id,
            recipientLabel: this.getEntityLabel(recipient),
            partnerId: source.id,
            partnerLabel: this.getEntityLabel(source),
            phrase: dialogue.phrase,
            intentTags: [...intentTags],
            stance: stance || null,
            type,
            label: this.getDialogueResidueTypeLabel(type),
            rememberability,
            rememberabilityScore: Number(rememberabilityScore.toFixed(3)),
            openness: Number(openness.toFixed(3)),
            reinforcementCount,
            followThroughState,
            repairContext,
            pairMode: pairState.mode,
            pairTexture: this.getPairConversationTextureState(recipient, source.id).key,
            relationshipDeltas,
            learnEligible,
            learnCategory: learnEligible ? 'dialogue_teaching' : null,
            learnLabel,
            learnOutcome: null,
            createdAtSeconds: dialogue.createdAtSeconds
        };
    }

    shouldRetainEdgeResidueSnapshot(residue) {
        if (!residue) return false;
        if (residue.learnOutcome || residue.learnEligible) return true;
        if (residue.rememberability === 'anchoring') return true;
        return [
            'mutual-courtship',
            'warming-courtship',
            'courtship-offer',
            'retained-lesson',
            'missed-lesson',
            'protective-warning',
            'held-guidance',
            'uneasy-guidance',
            'accepted-repair',
            'repair-offer',
            'shared-calm',
            'playful-banter',
            'shared-observation',
            'small-praise',
            'warm-company',
            'light-friction',
            'gentle-rejection',
            'agreement'
        ].includes(residue.type);
    }

    compactEdgeResidueHistory(edge) {
        if (!edge || typeof edge !== 'object') return;
        edge.recentResidues = Array.isArray(edge.recentResidues)
            ? edge.recentResidues.filter(residue => this.shouldRetainEdgeResidueSnapshot(residue))
            : [];
        this.trimList(edge.recentResidues, this.maxEdgeResidueEntries);
    }

    storeDialogueResidue(recipient, residue) {
        const communication = recipient?.lifeSim?.communication;
        if (!communication || !residue) return null;
        communication.recentResidues = communication.recentResidues || [];
        communication.recentResidues.unshift(JSON.parse(JSON.stringify(residue)));
        this.trimCommunicationState(recipient);
        return communication.recentResidues[0];
    }

    syncRetainedLessonEdge(recipient, source, atSeconds = null) {
        if (!recipient?.lifeSim?.communication || !source?.id) return null;
        const targetEdge = ensureLifeSocialEdge?.(recipient, source.id)
            || recipient?.lifeSim?.socialEdges?.[source.id]
            || null;
        if (!targetEdge) return null;

        const partnerLessonCount = (recipient.lifeSim.communication.retainedLessons || [])
            .filter(entry => entry?.partnerId === source.id)
            .length;
        if (partnerLessonCount > 0) {
            targetEdge.learnedDialogueCount = Math.max(targetEdge.learnedDialogueCount || 0, partnerLessonCount);
            targetEdge.followThroughScore = this.clamp01(Math.max(targetEdge.followThroughScore || 0, 0.18));
            targetEdge.lastConversationAtSeconds = atSeconds ?? targetEdge.lastConversationAtSeconds ?? null;
        }
        return targetEdge;
    }

    recordRetainedDialogueLesson(recipient, source, dialogue, residue) {
        if (!recipient?.lifeSim?.communication || !source?.id || !residue?.learnEligible) return null;

        const communication = recipient.lifeSim.communication;
        const existing = (communication.retainedLessons || []).find(entry =>
            entry?.partnerId === source.id
            && entry?.category === residue.learnCategory
            && Math.abs((entry?.atSeconds ?? 0) - (dialogue.createdAtSeconds ?? 0)) < 18
        );
        if (existing) {
            residue.learnOutcome = { ...existing };
            residue.followThroughState = 'learned';
            residue.relationshipDeltas.followThroughDelta = Math.max(
                residue.relationshipDeltas.followThroughDelta || 0,
                0.18
            );
            this.syncRetainedLessonEdge(recipient, source, dialogue.createdAtSeconds);
            return existing;
        }

        const lesson = {
            id: `dialogue_learn_${dialogue.id}_${recipient.id}`,
            partnerId: source.id,
            partnerLabel: this.getEntityLabel(source),
            category: residue.learnCategory,
            label: residue.learnLabel,
            atSeconds: dialogue.createdAtSeconds,
            rememberability: residue.rememberability,
            dialogueId: dialogue.id
        };

        if (typeof appendUpbringingLesson === 'function') {
            appendUpbringingLesson(recipient, {
                category: residue.learnCategory,
                teacherId: source.id,
                strength: residue.rememberability === 'anchoring' ? 0.18 : 0.14,
                createdAtSeconds: dialogue.createdAtSeconds,
                tags: ['dialogue-learn'],
                content: {
                    source: 'dialogue',
                    dialogueId: dialogue.id,
                    signalType: dialogue.sourceSignalType || null,
                    rememberability: residue.rememberability
                }
            });
        }
        if (typeof reinforceLifeRoutine === 'function') {
            reinforceLifeRoutine(recipient, 'teaching', source.id, residue.rememberability === 'anchoring' ? 0.05 : 0.035, {
                phaseAffinity: 'dialogue-learning',
                recency: 1
            });
        }
        if (recipient.lifeSim?.interpretation) {
            recipient.lifeSim.interpretation.clarity = this.clamp01(
                (recipient.lifeSim.interpretation.clarity || 0) + (residue.rememberability === 'anchoring' ? 0.018 : 0.012)
            );
        }

        communication.retainedLessons = communication.retainedLessons || [];
        communication.retainedLessons.unshift(lesson);
        residue.learnOutcome = { ...lesson };
        residue.followThroughState = 'learned';
        residue.relationshipDeltas.followThroughDelta = Math.max(
            residue.relationshipDeltas.followThroughDelta || 0,
            0.18
        );
        this.trimCommunicationState(recipient);
        this.syncRetainedLessonEdge(recipient, source, dialogue.createdAtSeconds);
        return lesson;
    }

    applyDialogueRelationshipResidue(recipient, source, residue, edge = null) {
        const targetEdge = edge || recipient?.lifeSim?.socialEdges?.[source?.id];
        if (!targetEdge || !residue) return targetEdge;

        const deltas = residue.relationshipDeltas || {};
        targetEdge.reciprocityScore = this.clamp01((targetEdge.reciprocityScore || 0) + (deltas.reciprocityDelta || 0));
        targetEdge.rejectionWeight = this.clamp01(
            (targetEdge.rejectionWeight || 0)
            + (deltas.rejectionDelta || 0)
            - ((deltas.forgivenessDelta || 0) * 0.4)
        );
        targetEdge.followThroughScore = this.clamp01((targetEdge.followThroughScore || 0) + (deltas.followThroughDelta || 0));
        targetEdge.forgivenessWeight = this.clamp01((targetEdge.forgivenessWeight || 0) + (deltas.forgivenessDelta || 0));
        targetEdge.recentWarmth = this.clamp01((targetEdge.recentWarmth || 0) + (deltas.warmthDelta || 0));
        targetEdge.recentEase = this.clamp01((targetEdge.recentEase || 0) + (deltas.easeDelta || 0));
        targetEdge.recentMutualAttention = this.clamp01((targetEdge.recentMutualAttention || 0) + (deltas.mutualAttentionDelta || 0));
        targetEdge.recentFriction = this.clamp01(
            (targetEdge.recentFriction || 0)
            + (deltas.frictionDelta || 0)
            - (deltas.frictionRelief || 0)
        );

        if ((deltas.resentmentRelief || 0) > 0) {
            targetEdge.resentment = this.clamp01((targetEdge.resentment || 0) - deltas.resentmentRelief);
        }
        if (residue.type === 'gentle-rejection') {
            targetEdge.reciprocityScore = this.clamp01((targetEdge.reciprocityScore || 0) - 0.06);
            targetEdge.repairState = 'hurt';
        } else if (residue.type === 'accepted-repair') {
            targetEdge.repairState = 'repair-open';
        } else if (residue.type === 'repair-offer') {
            targetEdge.repairState = 'offered';
        } else if (residue.type === 'mutual-courtship' || residue.type === 'warming-courtship' || residue.type === 'shared-calm') {
            targetEdge.repairState = 'steady';
        }
        targetEdge.lastConversationMode = residue.pairMode || targetEdge.lastConversationMode || 'easy';
        targetEdge.lastConversationAtSeconds = residue.createdAtSeconds ?? targetEdge.lastConversationAtSeconds ?? null;

        const residueSnapshot = {
            dialogueId: residue.dialogueId,
            label: residue.label,
            type: residue.type,
            rememberability: residue.rememberability,
            followThroughState: residue.followThroughState,
            createdAtSeconds: residue.createdAtSeconds,
            pairMode: residue.pairMode || null,
            pairTexture: residue.pairTexture || null
        };
        targetEdge.lastDialogueResidue = { ...residueSnapshot };
        targetEdge.recentResidues = Array.isArray(targetEdge.recentResidues) ? targetEdge.recentResidues : [];
        if (this.shouldRetainEdgeResidueSnapshot(residue)) {
            targetEdge.recentResidues.unshift(residueSnapshot);
        }
        this.compactEdgeResidueHistory(targetEdge);

        if (residue.rememberability === 'anchoring') {
            targetEdge.anchoringDialogueCount = (targetEdge.anchoringDialogueCount || 0) + 1;
        }
        if (residue.learnOutcome) {
            targetEdge.learnedDialogueCount = (targetEdge.learnedDialogueCount || 0) + 1;
        }

        return targetEdge;
    }

    selectDialogueStance(recipient, dialogue) {
        if (!recipient?.id || !dialogue?.sourceId) return 'acknowledge';
        const relationship = this.getRelationshipContext(recipient, dialogue.sourceId);
        const clarity = this.clamp01(recipient?.lifeSim?.interpretation?.clarity ?? 0.5);
        const caution = this.clamp01(recipient?.lifeSim?.derived?.behaviorBiases?.caution ?? 0);
        const threat = this.clamp01(recipient?.lifeSim?.emotions?.threat ?? 0);
        const intentTags = dialogue.intentTags || [];
        const pairTexture = relationship.pairTexture || 'steady';

        if (intentTags.includes('courtship')) {
            if (relationship.resentment > 0.22 || relationship.rejectionWeight > 0.18 || threat > 0.5) return 'hesitate';
            if (relationship.chemistry >= 0.42 || relationship.comfort >= 0.34 || relationship.reciprocityScore > 0.16) return 'flirt_back';
            return clarity >= 0.55 ? 'warm_reply' : 'hesitate';
        }

        if (intentTags.includes('warning')) {
            if (clarity < 0.42) return 'hesitate';
            return (relationship.trust >= 0.18 || caution >= 0.38) ? 'comply' : 'acknowledge';
        }

        if (intentTags.includes('teaching')) {
            if (clarity >= 0.78 && this.getLanguageBand(recipient) !== 'below_average') return 'reflect';
            return clarity >= 0.46 ? 'acknowledge' : 'hesitate';
        }

        if (intentTags.includes('comfort')) {
            return relationship.comfort >= 0.16 ? 'comfort_back' : 'acknowledge';
        }

        if (intentTags.includes('guidance') || intentTags.includes('coordination')) {
            return (clarity >= 0.48 && caution < 0.72) ? 'comply' : 'hesitate';
        }

        if (intentTags.includes('casual')) {
            if (intentTags.includes('repair') || intentTags.includes('forgiveness')) {
                return (pairTexture === 'repairing' || relationship.comfort >= 0.14 || relationship.forgivenessWeight >= 0.12)
                    ? 'comfort_back'
                    : 'acknowledge';
            }
            if (pairTexture === 'strained' && intentTags.includes('friction')) {
                return 'hesitate';
            }
            if (intentTags.includes('companionship') && (
                pairTexture === 'devoted'
                || pairTexture === 'repairing'
                ||
                relationship.comfort >= 0.18
                || relationship.attachment >= 0.18
                || relationship.recentWarmth >= 0.14
            )) {
                return 'comfort_back';
            }
            if (intentTags.includes('admiration') && (pairTexture === 'admiring' || pairTexture === 'devoted') && relationship.comfort >= 0.18) {
                return 'comfort_back';
            }
            if (intentTags.includes('shared_attention') && clarity < 0.34) {
                return 'hesitate';
            }
            if (intentTags.includes('playful') && pairTexture === 'guarded' && clarity < 0.58) {
                return 'hesitate';
            }
            return 'acknowledge';
        }

        return 'acknowledge';
    }

    getDialogueContext(source, signalType, zoneId = null, context = {}) {
        const style = this.getZoneCommunicationStyle(zoneId);
        const lexicon = this.getZoneDialogueLexicon(style);
        const band = context.band || this.getLanguageBand(source);
        const tone = context.tone || this.getDialogueTone(source, signalType);
        const register = context.register || this.getDialogueRegister(source, signalType);
        const primaryTarget = Array.isArray(context.recipients) ? context.recipients[0] : null;
        const targetLabel = context.targetLabel
            || (primaryTarget ? this.getKnownName(source, primaryTarget, { includeSex: false }) : null);
        const nearbyCount = typeof source?.getNearbyButterflyCount === 'function'
            ? source.getNearbyButterflyCount(92)
            : 0;
        const crowdWord = nearbyCount >= 6 ? 'crowd' : nearbyCount >= 3 ? 'cluster' : 'space';
        const relationship = primaryTarget ? this.getRelationshipContext(source, primaryTarget.id) : this.getRelationshipContext(source, null);
        return {
            ...context,
            zoneId,
            style,
            lexicon,
            band,
            tone,
            register,
            primaryTarget,
            targetLabel,
            addressName: targetLabel ? this.stripSexSuffix(targetLabel) : null,
            relationship,
            crowdWord
        };
    }

    joinDialogueParts(parts = [], band = 'average') {
        const filtered = parts.filter(Boolean).map(part => String(part).trim()).filter(Boolean);
        if (!filtered.length) return '';
        if (band === 'below_average') {
            return filtered.slice(0, 2).join('. ');
        }
        if (band === 'average') {
            return filtered.slice(0, 2).join(' ');
        }
        if (band === 'above_average') {
            return filtered.slice(0, 3).join('; ');
        }
        return filtered.slice(0, 3).join('; ');
    }

    maybePrefixAddress(source, text, context = {}) {
        if (!text || context.talkMode !== 'single_target' || !context.addressName) return text;
        const shouldPrefix = ['court', 'reassure', 'warn', 'direct_move', 'direct_place', 'acknowledge']
            .concat(['check_in', 'quiet_companionship', 'small_praise', 'soft_repair', 'light_irritation'])
            .includes(context.intentSubtype)
            || !!context.responseTo;
        if (!shouldPrefix) return text;

        const roll = this.buildNameSeed(
            source?.id || 'speaker',
            context.addressName,
            context.intentSubtype,
            context.responseTo?.id || '',
            this.dialogueHistory.length
        ) % 100;
        if (roll > 46) return text;
        return `${context.addressName}, ${text}`;
    }

    composeDialoguePhrase(source, signalType, zoneId = null, context = {}) {
        const intentProfile = context.intentProfile || this.getDialogueIntentProfile(signalType, source, context);
        const dialogueContext = this.getDialogueContext(source, signalType, zoneId, {
            ...context,
            intentSubtype: intentProfile.subtype
        });
        const { lexicon, band, talkMode, targetLabel, crowdWord } = dialogueContext;
        const pairTextureState = dialogueContext.relationship?.pairTexture
            ? {
                key: dialogueContext.relationship.pairTexture,
                label: dialogueContext.relationship.pairTextureLabel,
                signature: dialogueContext.relationship.pairTextureSignature
            }
            : this.getPairConversationTextureState(source, dialogueContext.primaryTarget?.id || null);
        const pairTexture = pairTextureState.key || intentProfile.pairTexture || 'steady';
        const targetText = context.targetCount > 1 ? 'all of you' : (targetLabel || 'you');
        const isResponse = !!context.responseTo;

        const pick = (candidates, seedTag) => this.pickDialogueCandidate(
            candidates,
            source,
            `${signalType}:${intentProfile.subtype}:${seedTag}`,
            zoneId,
            {
                targetLabel,
                targetCount: context.targetCount || 0
            }
        );

        let parts = [];

        switch (intentProfile.subtype) {
            case 'explain':
            case 'demonstrate':
                parts = [
                    pick([
                        'watch this pattern',
                        'keep this pattern in mind',
                        'look closely here',
                        'hold this shape in your head'
                    ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            `the ${lexicon.route} changes first`,
                            `the ${lexicon.landmark} tells you where to move`,
                            `the ${lexicon.space} shifts before it looks wrong`
                        ], 'core-low')
                        : pick([
                            `the ${lexicon.route} changes before the rest of the ${lexicon.space}`,
                            `the ${lexicon.landmark} tells you where the safer line opens`,
                            `the change in the ${lexicon.atmosphere} starts before the ground looks different`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            `once you notice that rhythm, the next move is much easier to read`,
                            `that is how you stay ahead of the turn instead of reacting late`,
                            `if you remember that sequence, the whole ${lexicon.space} makes more sense`
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                `that is what keeps you from drifting wide`,
                                `it makes the next move clearer`,
                                `that is the safer read`
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'reassure':
                parts = [
                    pick([
                        'stay with me',
                        'slow down and stay close',
                        'easy now',
                        'keep near me a moment'
                    ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            'you are alright',
                            `this ${crowdWord} is settling`,
                            'nothing is chasing us now'
                        ], 'core-low')
                        : pick([
                            `this part of the ${lexicon.space} is steady enough for you to breathe again`,
                            `the pressure in the ${lexicon.atmosphere} has already dropped`,
                            `nothing urgent is moving through this side of the ${lexicon.space}`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            `you do not need to carry the whole surge with you once it has passed`,
                            `we can let the panic pass before we choose the next move`,
                            `there is no need to rush the next decision`
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                'we have enough room to settle',
                                'you can let your pace ease',
                                'we can wait one beat before moving again'
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'warn':
                parts = [
                    pick([
                        `back away from the ${lexicon.landmark}`,
                        `do not take that ${lexicon.route}`,
                        `stay clear of that side`,
                        `careful near the ${lexicon.shelter}`
                    ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            'something feels wrong there',
                            `that side is off`,
                            `the air changed too fast`
                        ], 'core-low')
                        : pick([
                            `the ${lexicon.atmosphere} shifted too sharply for that to be harmless`,
                            `the pattern there is breaking unevenly`,
                            `something in that part of the ${lexicon.space} does not feel stable`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            `I do not trust what comes next if we commit too early`,
                            `that is usually the point right before trouble becomes obvious`,
                            `those warning signs show up before the danger fully reveals itself`
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                'give it one more moment',
                                'wait before you commit to that line',
                                'let the pattern settle first'
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'court':
                parts = [
                    pick([
                        'stay with me a little longer',
                        'keep close to me',
                        'fly with me for a while',
                        'come closer'
                    ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            'I like this',
                            `I like your pace`,
                            'do not drift away yet'
                        ], 'core-low')
                        : pick([
                            `I like the way you move through this ${lexicon.space}`,
                            `this part of the ${lexicon.space} feels better when you are beside me`,
                            `I want to see what this feeling becomes if we stop rushing it`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            `your rhythm changes the whole feeling of the ${lexicon.space}`,
                            `I want to learn what this feeling becomes when we let it breathe`,
                            `something about your pace makes this place feel more alive`
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                'we move well together here',
                                'this feels calmer with you beside me',
                                'I want to keep this moment a little longer'
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'direct_place':
                parts = [
                    pick([
                        `${targetText}, bring it this way`,
                        `${targetText}, set it over here`,
                        `${targetText}, keep it on this side`
                    ], 'opener'),
                    pick([
                        `leave it near the ${lexicon.shelter}`,
                        `set it just off the ${lexicon.route}`,
                        `place it where it keeps the ${lexicon.space} open`
                    ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            `that side leaves the cleanest line for the next move`,
                            `it keeps the ${lexicon.route} open and the ${crowdWord} from tightening`,
                            `that placement gives everyone more room to work`
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                `it leaves more room around the ${lexicon.landmark}`,
                                `that keeps the line clear`,
                                `it is cleaner there`
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'announce_route':
            case 'direct_move':
                parts = [
                    pick([
                        `${targetText}, come this way`,
                        `${targetText}, stay on this side`,
                        `${targetText}, move with me`,
                        `${targetText}, take this line`
                    ], 'opener'),
                    pick([
                        `keep to the ${lexicon.route}`,
                        `cross through this edge of the ${lexicon.space}`,
                        `stay off the ${lexicon.landmark}`
                    ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            `it gives us the cleanest line through the ${lexicon.space}`,
                            `the ${lexicon.landmark} will pull you out of position if you cut too early`,
                            `there is more room on this side for the next move`
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                `it stays clearer than the rest of the ${lexicon.space}`,
                                `you will keep your shape better from here`,
                                `it is cleaner on this side`
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'check_in':
                parts = [
                    pairTexture === 'repairing'
                        ? pick([
                            'before this turns sharp again, how are you holding up',
                            'I wanted to check on you before we drift hard again',
                            'are you alright with me right now'
                        ], 'opener-repairing')
                        : pairTexture === 'devoted'
                            ? pick([
                                'how are you holding up, really',
                                'I can feel your mood shifting before you say it',
                                'are you still with me here'
                            ], 'opener-devoted')
                            : pairTexture === 'guarded'
                                ? pick([
                                    'I am trying not to guess wrong about you',
                                    'you seem quieter than before',
                                    'are you alright beside me'
                                ], 'opener-guarded')
                                : pick([
                                    'how are you holding up',
                                    'you seem quieter than before',
                                    'are you still with me here',
                                    'you alright beside me'
                                ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            'I wanted to check',
                            'you felt far away',
                            'I did not want to miss you'
                        ], 'core-low')
                        : pairTexture === 'devoted'
                            ? pick([
                                `I wanted to know how this ${lexicon.space} is sitting with you before it sat too long between us`,
                                `you felt farther away from me than a moment ago and I notice that quickly`,
                                `I did not want to let this part of the ${lexicon.space} pass without hearing your read first`
                            ], 'core-devoted')
                            : pairTexture === 'repairing'
                                ? pick([
                                    `I wanted to check before the feeling of this ${lexicon.space} hardened between us again`,
                                    `I would rather ask than let the distance do the talking for us`,
                                    `I did not want this stretch of the ${lexicon.space} to pass with us still reading each other wrong`
                                ], 'core-repairing')
                                : pick([
                                    `I wanted to know how this ${lexicon.space} is sitting with you`,
                                    `you felt farther away from me than a moment ago`,
                                    `I did not want to let this part of the ${lexicon.space} pass without checking on you`
                                ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            'we do better when I know where your head is',
                            'I would rather ask than guess at your mood',
                            'it matters to me whether this still feels right to you'
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                'I would rather ask than assume',
                                'it helps to know where you stand',
                                'I wanted to hear your read'
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'shared_observation':
                parts = [
                    pick([
                        'look at this for a second',
                        'the garden feels different right here',
                        'do you notice this too',
                        'this side of the garden changed'
                    ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            `the ${lexicon.atmosphere} feels lighter here`,
                            `the ${lexicon.route} is calmer on this side`,
                            `everything slowed down a little`
                        ], 'core-low')
                        : pick([
                            `the ${lexicon.atmosphere} shifted before we even crossed the ${lexicon.route}`,
                            `this edge of the ${lexicon.space} is calmer than the rest of it`,
                            `the whole feeling of this place changes near the ${lexicon.landmark}`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            'it is easier to stay present when we both notice the same small thing',
                            'sometimes the shared noticing matters more than the move itself',
                            'I like when the same detail catches both of us at once'
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                'it feels better when we catch the same thing',
                                'I wanted to share that with you',
                                'it is a good detail to hold together'
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'playful_banter':
                parts = [
                    pick([
                        'you always make that turn like you planned it all along',
                        'there you go showing off again',
                        'you make that look easier than it should',
                        'you knew I was watching that'
                    ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            'I like it',
                            'it is good when you do that',
                            'you look happy doing it'
                        ], 'core-low')
                        : pick([
                            `you make even this rough part of the ${lexicon.space} look graceful`,
                            `you carry your confidence through the ${lexicon.route} like you want the rest of us to notice`,
                            `it is hard not to smile when you move through the ${lexicon.space} like that`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            'I am teasing you, but I really do enjoy that rhythm in you',
                            'it would be unbearable if it were not so charming',
                            'I pretend to make fun of it because I do not want to admit how much I like it'
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                'I am teasing, but I mean it kindly',
                                'do not let that go to your head too fast',
                                'you know I like that about you'
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'gentle_tease':
                parts = [
                    pick([
                        'you hover forever before you choose a side',
                        'you always pretend you are not about to do exactly that',
                        'there is that careful little pause again',
                        'you make that hesitation look like a style choice'
                    ], 'opener'),
                    pick([
                        `I can read it on your face before you move`,
                        `I know that rhythm in you already`,
                        `you are not as unreadable as you think`
                    ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            'I only say it because I know you well enough for the joke to land softly',
                            'it is easier to tease you when I know you will hear the affection under it',
                            'I like that I know your patterns well enough to tease them'
                        ], 'detail')
                        : null
                ];
                break;
            case 'quiet_companionship':
                parts = [
                    pairTexture === 'devoted'
                        ? pick([
                            'you can stay beside me as long as you want',
                            'we do not have to fill every quiet moment to know where we stand',
                            'it is enough that you are here with me'
                        ], 'opener-devoted')
                        : pairTexture === 'repairing'
                            ? pick([
                                'we do not have to solve all of this right now, just stay near',
                                'let the quiet do a little repair for us',
                                'just stay close a little longer and let this settle'
                            ], 'opener-repairing')
                            : pick([
                                'you can stay beside me',
                                'we do not have to fill every quiet moment',
                                'just stay near a little longer',
                                'it is enough that you are here'
                            ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            'this is good',
                            'I like this quiet',
                            'we can rest here'
                        ], 'core-low')
                        : pick([
                            `this part of the ${lexicon.space} is easier to hold when you are beside me`,
                            `I do not need more than your company right now`,
                            `the quiet lands more softly when we share it`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            'there is a kind of trust in being able to be quiet together',
                            'I like the kind of closeness that does not have to prove itself aloud',
                            'sometimes the gentlest bond is the one that can rest in silence'
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                'it feels steady like this',
                                'I am glad you stayed',
                                'this quiet suits us'
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'small_praise':
                parts = [
                    pairTexture === 'admiring'
                        ? pick([
                            'you really do something special with moments like that',
                            'that was a good read, and I do not want to let it pass unnamed',
                            'you moved through that in a way I notice every time'
                        ], 'opener-admiring')
                        : pairTexture === 'devoted'
                            ? pick([
                                'you handled that well, like you always do when it matters',
                                'that was a good read and I knew it would be',
                                'you moved through that cleanly again'
                            ], 'opener-devoted')
                            : pick([
                                'you handled that well',
                                'that was a good read',
                                'you moved through that cleanly',
                                'you did that better than most would'
                            ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            'I noticed it',
                            'it mattered',
                            'I liked that'
                        ], 'core-low')
                        : pick([
                            `you steadied the whole ${crowdWord} with that choice`,
                            `you made the next move feel easier for everyone near you`,
                            `you carried that moment with more grace than you know`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            'I do not want to let good work pass unnoticed when it genuinely moved me',
                            'I respect the care that was inside that small choice',
                            'that kind of steadiness deserves to be named out loud'
                        ], 'detail')
                        : null
                ];
                break;
            case 'light_irritation':
                parts = [
                    pick([
                        'you keep cutting across my line',
                        'stop brushing past me like that',
                        'you are crowding me more than you think',
                        'give me a little more room than that'
                    ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            'it is getting on me',
                            'I do not like it',
                            'I need more space'
                        ], 'core-low')
                        : pick([
                            `I can feel you pushing into my pace every time we cross this ${lexicon.route}`,
                            `that closeness feels heavier than you probably mean it to`,
                            `I need a softer line between us right now`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            'I would rather say it plainly than let the irritation sit and harden',
                            'I am naming it now so it does not become something sharper later',
                            'I am still trying to keep this small instead of letting it grow teeth'
                        ], 'detail')
                        : null
                ];
                break;
            case 'soft_repair':
                parts = [
                    pairTexture === 'repairing'
                        ? pick([
                            'I do not want that sharpness sitting between us any longer than it has to',
                            'let me try that again more gently, because I still want us reachable',
                            'I would rather mend this than keep proving we can wound each other'
                        ], 'opener-repairing')
                        : pick([
                            'I do not want that sharpness sitting between us',
                            'let me try that again more gently',
                            'I would rather mend this than carry it',
                            'I do not want to stay turned away from you'
                        ], 'opener'),
                    band === 'below_average'
                        ? pick([
                            'I want this easier again',
                            'we can soften this',
                            'I do not want us hurt like this'
                        ], 'core-low')
                        : pick([
                            `I would rather ease the weight between us than pretend it is gone`,
                            `we do not have to let one rough turn set the whole ${lexicon.space} between us`,
                            `I am trying to leave room for us to come back toward each other`
                        ], 'core'),
                    band === 'exceptional'
                        ? pick([
                            'repair feels quieter than apology sometimes, but I mean it just as much',
                            'I know trust does not reset in one breath, but I still want to move toward it',
                            'I would rather make a softer next move than defend the sharp one that already happened'
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                'I want the next turn to land better',
                                'I am trying to make this easier, not heavier',
                                'I would rather soften this than keep it sharp'
                            ], 'detail-mid')
                            : null)
                ];
                break;
            case 'acknowledge':
            default:
                parts = [
                    pick([
                        'I heard you',
                        'alright, I heard that',
                        'got it',
                        'I understand'
                    ], 'opener'),
                    band === 'exceptional'
                        ? pick([
                            'I understand what mattered in that',
                            'I will carry that forward',
                            'I heard the point beneath that'
                        ], 'detail')
                        : (band === 'above_average'
                            ? pick([
                                'I will keep that in mind',
                                'I know what you want from me here',
                                'I am with you on that'
                            ], 'detail-mid')
                            : (band === 'average'
                                ? pick([
                                    'I am with you',
                                    'I will follow that',
                                    'I will keep it in mind'
                                ], 'detail-avg')
                                : null))
                ];
                break;
        }

        if (isResponse) {
            const stance = context.stance || 'acknowledge';
            if (stance === 'comply') {
                parts = [
                    pick([
                        'alright',
                        'okay',
                        'I will do that',
                        'got it'
                    ], 'reply-opener'),
                    pick([
                        `I will keep to the ${lexicon.route}`,
                        'I will move with you',
                        `I will stay off the ${lexicon.landmark}`
                    ], 'reply-core')
                ];
            } else if (stance === 'hesitate') {
                if (context.responseTo?.intentTags?.includes('courtship')) {
                    parts = [
                        pick([
                            'you matter to me, but not that way',
                            'I heard you, but give me more room',
                            'do not press that feeling on me yet'
                        ], 'reply-opener'),
                        pick([
                            'I am not ready to carry that closeness',
                            `I need more space than that right now`,
                            'let this stay lighter than that'
                        ], 'reply-core')
                    ];
                } else {
                    parts = [
                        pick([
                            'I heard you',
                            'maybe',
                            'alright, but listen',
                            'wait'
                        ], 'reply-opener'),
                        pick([
                            `I still do not like that ${lexicon.landmark}`,
                            `that side still feels wrong to me`,
                            `I am not settled about that route yet`
                        ], 'reply-core')
                    ];
                }
            } else if (stance === 'reflect') {
                parts = [
                    pick([
                        'I see it now',
                        'I understand the pattern now',
                        'that makes sense now'
                    ], 'reply-opener'),
                    pick([
                        `the ${lexicon.route} changes before the rest of the ${lexicon.space}`,
                        `the ${lexicon.landmark} marks the safer line`,
                        `the shift starts in the ${lexicon.atmosphere} before it reaches the ground`
                    ], 'reply-core')
                ];
            } else if (stance === 'comfort_back') {
                if (context.responseTo?.intentTags?.includes('comfort')) {
                    parts = pairTexture === 'repairing'
                        ? [
                            pick([
                                'that helps more than you know',
                                'I can let some of that go if you stay gentle',
                                'alright, I can meet you there'
                            ], 'reply-opener-repairing'),
                            pick([
                                'maybe we really can make the next turn softer',
                                `this ${crowdWord} feels lighter when we stop bracing against each other`,
                                'I can feel the edge coming down a little'
                            ], 'reply-core-repairing')
                        ]
                        : [
                            pick([
                                'alright, stay near me then',
                                'that helps more than you know',
                                'I can let some of that go'
                            ], 'reply-opener'),
                            pick([
                                'I can breathe again',
                                `this ${crowdWord} feels lighter now`,
                                'maybe we can hold steadier this time'
                            ], 'reply-core')
                        ];
                } else {
                    parts = pairTexture === 'devoted'
                        ? [
                            pick([
                                'stay near me then',
                                'I am calmer with you here',
                                'good, keep your place beside me'
                            ], 'reply-opener-devoted'),
                            pick([
                                'that helps every time',
                                'I can breathe again when it is you',
                                `this ${crowdWord} feels lighter when we steady each other`
                            ], 'reply-core-devoted')
                        ]
                        : [
                            pick([
                                'alright',
                                'stay near me then',
                                'I am calmer with you here'
                            ], 'reply-opener'),
                            pick([
                                'that helps',
                                'I can breathe again',
                                `this ${crowdWord} feels lighter now`
                            ], 'reply-core')
                        ];
                }
            } else if (stance === 'flirt_back' || stance === 'warm_reply') {
                parts = pairTexture === 'admiring'
                    ? [
                        pick([
                            'then stay close a little longer',
                            'keep pace with me and let me look at you properly',
                            'do not drift away just when this got interesting'
                        ], 'reply-opener-admiring'),
                        pick([
                            'I like the pull of this too',
                            'you make closeness feel worth noticing',
                            'I want to stay inside this feeling a little longer'
                        ], 'reply-core-admiring')
                    ]
                    : [
                        pick([
                            'then stay close',
                            'keep pace with me',
                            'do not drift away from me yet'
                        ], 'reply-opener'),
                        pick([
                            `I like this too`,
                            `we move well together here`,
                            `I want to keep this feeling a little longer`
                        ], 'reply-core')
                    ];
            } else if (stance === 'acknowledge' && (context.responseTo?.intentTags || []).includes('casual')) {
                const responseTags = context.responseTo?.intentTags || [];
                if (pairTexture === 'guarded') {
                    parts = [
                        pick([
                            'I hear you, I am just slower to open than you are',
                            'alright, I heard that',
                            'I am listening, even if I do not show it quickly'
                        ], 'reply-opener-guarded'),
                        pick([
                            'give me a little room and I will meet you more clearly',
                            'I am still deciding how close to stand to that feeling',
                            'I would rather move carefully than answer too fast'
                        ], 'reply-core-guarded')
                    ];
                } else if (pairTexture === 'repairing' && (responseTags.includes('repair') || responseTags.includes('forgiveness') || responseTags.includes('companionship'))) {
                    parts = [
                        pick([
                            'I hear you trying',
                            'that lands better than silence would',
                            'alright, I can meet you part of the way'
                        ], 'reply-opener-repairing'),
                        pick([
                            'let us keep the next turn gentler than the last one',
                            'I would rather ease this than keep scraping at it',
                            'we can still make a softer pattern out of this'
                        ], 'reply-core-repairing')
                    ];
                } else if (responseTags.includes('playful')) {
                    parts = [
                        pick([
                            'oh, so that is how you are meeting me today',
                            'keep teasing me like that then',
                            'you know I heard the joke in that'
                        ], 'reply-opener'),
                        pick([
                            'I can take a little mischief from you',
                            'that lands softer when it comes from you',
                            'alright, I will give you that one'
                        ], 'reply-core')
                    ];
                } else if (responseTags.includes('admiration')) {
                    parts = [
                        pick([
                            'you really saw that in me',
                            'that lands warmly coming from you',
                            'I heard the kindness in that'
                        ], 'reply-opener'),
                        pick([
                            'I will carry that with me a while',
                            'it feels good to be noticed like that',
                            'you made this stretch of the garden feel lighter'
                        ], 'reply-core')
                    ];
                } else if (responseTags.includes('companionship') || pairTexture === 'devoted') {
                    parts = [
                        pick([
                            'then stay with me',
                            'good, keep close a little longer',
                            'I am glad you want the quiet too'
                        ], 'reply-opener'),
                        pick([
                            'it is easier when we hold the same pace',
                            'I like when the quiet belongs to both of us',
                            'that kind of closeness settles me'
                        ], 'reply-core')
                    ];
                } else if (responseTags.includes('shared_attention')) {
                    parts = [
                        pick([
                            'yes, I caught that too',
                            'I saw the same little shift',
                            'good, it was not just me then'
                        ], 'reply-opener'),
                        pick([
                            'it feels better when we notice it together',
                            'shared noticing changes the whole mood of a place',
                            'I like when the same detail pulls both of us in'
                        ], 'reply-core')
                    ];
                } else if (responseTags.includes('repair') || responseTags.includes('forgiveness')) {
                    parts = [
                        pick([
                            'I hear you trying to soften this',
                            'that reaches me more than silence would',
                            'alright, I can meet you there a little'
                        ], 'reply-opener'),
                        pick([
                            'let us keep the next turn gentler then',
                            'I would rather ease this than keep scraping at it',
                            'we can try for a softer line from here'
                        ], 'reply-core')
                    ];
                } else {
                    parts = [
                        pick([
                            'I hear you',
                            'yeah, I felt that too',
                            'I am with you there',
                            'I noticed it too'
                        ], 'reply-opener'),
                        pick([
                            'keep talking to me like that',
                            'that lands better than silence',
                            'it is easier when we stay open with each other',
                            'I am glad you said it aloud'
                        ], 'reply-core')
                    ];
                }
            }
        }

        const text = this.joinDialogueParts(parts, band);
        return this.maybePrefixAddress(source, text, {
            ...dialogueContext,
            intentSubtype: intentProfile.subtype,
            responseTo: context.responseTo || null
        });
    }

    isSpeechSignal(signalType) {
        return !!this.getDialogueSpec(signalType)?.verbal;
    }

    getTalkMode(signal) {
        const targetCount = Array.isArray(signal?.targetIds) ? signal.targetIds.length : 0;
        if (targetCount > 1) return 'multi_target';
        if (targetCount === 1) return 'single_target';
        return 'open_talk';
    }

    getLanguageBand(entity) {
        const communication = entity?.lifeSim?.communication || {};
        const interpretation = entity?.lifeSim?.interpretation || {};
        const social = entity?.lifeSim?.social || {};
        const traits = entity?.traits || {};
        const ability = typeof statProfileSystem !== 'undefined'
            ? statProfileSystem.getAbilityForSubject?.(entity)
            : (entity?.specialAbility || entity?.traits?.special || null);

        let score = 0.18;
        score += (communication.expressiveness || 0) * 0.18;
        score += (communication.receptivity || 0) * 0.18;
        score += (interpretation.clarity || 0) * 0.24;
        score += (social.confidence || 0) * 0.1;
        score += Math.max(0, ((traits.trustSpeed || 1) - 1) * 0.12);
        score -= Math.max(0, ((traits.jitteriness || 0) - 1) * 0.08);

        if (ability === 'ancient_scholar') {
            score += 0.24;
        }

        if (score < 0.35) return 'below_average';
        if (score < 0.62) return 'average';
        if (score < 0.82) return 'above_average';
        return 'exceptional';
    }

    getDialogueTone(entity, signalType) {
        const personality = entity?.personalityType || entity?.lifeSim?.identity?.archetype || 'friendly';
        const emotions = entity?.lifeSim?.emotions || {};
        const significance = emotions.significance || 0;
        const agitation = emotions.agitation || 0;
        const threat = emotions.threat || 0;

        if (signalType === 'warning_signal' && (agitation > 0.55 || threat > 0.5)) {
            return 'aggressive';
        }
        if (signalType === 'courtship_signal') {
            return personality === 'skittish' ? 'hesitant' : personality === 'energetic' ? 'playful' : 'warm';
        }
        if (signalType === 'teaching_signal') {
            return personality === 'wise' || entity?.specialAbility === 'ancient_scholar' ? 'formal' : 'curious';
        }
        if (significance > 0.72 && agitation < 0.25 && personality === 'golden') {
            return 'assertive';
        }

        const byPersonality = {
            friendly: 'warm',
            cautious: 'diplomatic',
            energetic: 'playful',
            skittish: 'hesitant',
            wise: 'formal',
            mystic: 'curious',
            golden: 'assertive'
        };
        return byPersonality[personality] || 'direct';
    }

    getDialogueRegister(entity, signalType) {
        const band = this.getLanguageBand(entity);
        if (signalType === 'teaching_signal') return band === 'below_average' ? 'neutral' : 'formal';
        if (signalType === 'courtship_signal') return band === 'exceptional' ? 'neutral' : 'casual';
        if (signalType === 'acknowledgement_signal') return 'casual';
        return band === 'below_average' ? 'casual' : 'neutral';
    }

    getSlangWord(entity, phrase = '') {
        const slang = [
            'bet',
            'no cap',
            'sus',
            'low-key',
            'rizz',
            'slay',
            'drip',
            "bussin'",
            'say less',
            'ghosted',
            'lit',
            'hits different'
        ];
        const seed = `${entity?.id || 'butterfly'}:${phrase}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return slang[seed % slang.length];
    }

    normalizeDialoguePhrase(phrase, { entity = null, signalType = '', tone = 'direct', register = 'neutral', band = 'average' } = {}) {
        let text = String(phrase || '').replace(/\s+/g, ' ').trim();
        if (!text) return '';

        text = text.charAt(0).toUpperCase() + text.slice(1);

        if (band === 'below_average') {
            text = text.replace(/,\s*/g, '. ');
        } else if (band === 'exceptional' && signalType === 'teaching_signal' && !/[.!?]$/.test(text)) {
            text = `${text}.`;
        }

        const slangChanceByBand = {
            below_average: 0.28,
            average: 0.14,
            above_average: 0.1,
            exceptional: 0.05
        };
        const slangChance = register === 'casual' ? (slangChanceByBand[band] || 0.08) : 0;
        const slangRoll = (this.buildNameSeed(entity?.id || 'speaker', text, signalType, register, tone) % 100) / 100;
        if (slangChance > 0 && slangRoll < slangChance && !/\b(?:bet|no cap|sus|low-key|rizz|slay|drip|bussin'|say less|ghosted|lit|hits different)\b/i.test(text)) {
            const slangWord = this.getSlangWord(entity, text);
            if (band === 'below_average') {
                text = `${text}, ${slangWord}`;
            } else if (band === 'average' && slangRoll < (slangChance * 0.7)) {
                text = `${text} ${slangWord}`;
            }
        }

        if (!/[.!?]$/.test(text)) {
            text += tone === 'aggressive' ? '!' : '.';
        }

        return text;
    }

    formatTalkTarget(dialogue) {
        if (dialogue?.talkMode === 'open_talk') return null;
        if (dialogue?.targetIds?.length > 1) {
            return `${dialogue.targetIds.length} butterflies`;
        }
        if (dialogue?.targetIds?.length === 1) {
            return this.getResolvedEntityLabel(
                dialogue.targetIds[0],
                dialogue?.targetLabels?.[0] || dialogue?.targetLabel || dialogue.targetIds[0],
                { includeSex: true }
            );
        }
        return dialogue?.targetLabels?.[0] || dialogue?.targetIds?.[0] || dialogue?.targetLabel || null;
    }

    classifyDialogueMemoryFamily(intentTags = []) {
        if (intentTags.includes('warning')) return 'danger';
        if (intentTags.includes('comfort')) return 'care';
        if (intentTags.includes('teaching')) return 'social';
        if (intentTags.includes('guidance') || intentTags.includes('coordination')) return 'interaction';
        if (intentTags.includes('courtship')) return 'social';
        return 'interaction';
    }

    buildDialogueEdgeDeltas(dialogue, recipient, stance = null) {
        const interpretation = recipient?.lifeSim?.interpretation || {};
        const clarity = this.clamp01(interpretation.clarity ?? 0.5);
        const trustBias = clarity * 0.018;
        const intentTags = dialogue?.intentTags || [];
        const responseToTags = dialogue?.responseToIntentTags || [];
        const resolvedStance = stance || dialogue?.stance || null;
        const deltas = {};

        if (intentTags.includes('comfort')) {
            deltas.trust = 0.01 + trustBias;
            deltas.comfort = 0.02 + trustBias;
            if (resolvedStance === 'comfort_back') {
                deltas.trust = Math.max(deltas.trust || 0, 0.016 + trustBias);
                deltas.comfort = Math.max(deltas.comfort || 0, 0.026 + trustBias);
                deltas.resentment = -0.024;
            }
        }
        if (intentTags.includes('warning')) {
            deltas.trust = Math.max(deltas.trust || 0, 0.008 + trustBias);
            deltas.admiration = 0.006 + (clarity * 0.01);
            if (resolvedStance === 'comply') {
                deltas.trust = Math.max(deltas.trust || 0, 0.016 + trustBias);
                deltas.admiration = Math.max(deltas.admiration || 0, 0.014 + (clarity * 0.01));
            }
        }
        if (intentTags.includes('teaching')) {
            deltas.trust = Math.max(deltas.trust || 0, 0.01 + trustBias);
            deltas.admiration = 0.014 + (clarity * 0.01);
            if (resolvedStance === 'reflect') {
                deltas.trust = Math.max(deltas.trust || 0, 0.018 + trustBias);
                deltas.admiration = Math.max(deltas.admiration || 0, 0.024 + (clarity * 0.01));
            } else if (resolvedStance === 'hesitate') {
                deltas.trust = Math.min(deltas.trust || 0, 0.004 + trustBias);
            }
        }
        if (intentTags.includes('courtship')) {
            if (resolvedStance === 'hesitate') {
                deltas.comfort = -0.004;
                deltas.attachment = -0.006;
                deltas.resentment = 0.012;
            } else {
                deltas.comfort = Math.max(deltas.comfort || 0, 0.012 + trustBias);
                deltas.attachment = 0.005 + (clarity * 0.005);
                if (resolvedStance === 'warm_reply') {
                    deltas.trust = Math.max(deltas.trust || 0, 0.006 + (clarity * 0.006));
                    deltas.attachment = Math.max(deltas.attachment || 0, 0.012 + (clarity * 0.006));
                } else if (resolvedStance === 'flirt_back') {
                    deltas.trust = Math.max(deltas.trust || 0, 0.01 + (clarity * 0.008));
                    deltas.comfort = Math.max(deltas.comfort || 0, 0.02 + trustBias);
                    deltas.attachment = Math.max(deltas.attachment || 0, 0.02 + (clarity * 0.008));
                }
            }
        }
        if (intentTags.includes('reply') || intentTags.includes('guidance')) {
            deltas.trust = Math.max(deltas.trust || 0, 0.006 + (clarity * 0.008));
        }
        if (intentTags.includes('companionship') || intentTags.includes('shared_attention')) {
            deltas.trust = Math.max(deltas.trust || 0, 0.004 + (clarity * 0.006));
            deltas.comfort = Math.max(deltas.comfort || 0, 0.006 + trustBias);
        }
        if (intentTags.includes('warmth')) {
            deltas.trust = Math.max(deltas.trust || 0, 0.006 + (clarity * 0.006));
            deltas.comfort = Math.max(deltas.comfort || 0, 0.01 + trustBias);
        }
        if (intentTags.includes('playful')) {
            deltas.comfort = Math.max(deltas.comfort || 0, 0.012 + trustBias);
            deltas.resentment = Math.min(deltas.resentment || 0, -0.008);
        }
        if (intentTags.includes('admiration')) {
            deltas.admiration = Math.max(deltas.admiration || 0, 0.014 + (clarity * 0.008));
            deltas.trust = Math.max(deltas.trust || 0, 0.006 + (clarity * 0.005));
        }
        if (intentTags.includes('agreement') || intentTags.includes('follow_through')) {
            deltas.trust = Math.max(deltas.trust || 0, 0.012 + (clarity * 0.008));
            deltas.admiration = Math.max(deltas.admiration || 0, 0.008 + (clarity * 0.008));
        }
        if (intentTags.includes('friction') && !intentTags.includes('repair') && !intentTags.includes('rejection')) {
            deltas.comfort = Math.min(deltas.comfort || 0, -0.004);
            deltas.resentment = Math.max(deltas.resentment || 0, 0.012);
        }
        if (intentTags.includes('rejection')) {
            deltas.trust = -0.004;
            deltas.comfort = -0.006;
            deltas.attachment = -0.01;
            deltas.resentment = Math.max(deltas.resentment || 0, 0.014);
        }
        if (intentTags.includes('repair') || intentTags.includes('forgiveness')) {
            deltas.resentment = Math.min(deltas.resentment || 0, -0.028);
            deltas.trust = Math.max(deltas.trust || 0, 0.008 + trustBias);
            deltas.comfort = Math.max(deltas.comfort || 0, 0.012 + trustBias);
        }
        if (responseToTags.includes('courtship') && resolvedStance === 'hesitate') {
            deltas.attachment = Math.min(deltas.attachment || 0, -0.012);
            deltas.resentment = Math.max(deltas.resentment || 0, 0.016);
        }

        return deltas;
    }

    computeChemistry(edge = {}, recentCourtshipWeight = 0) {
        const trust = edge.trust || 0;
        const comfort = edge.comfort || 0;
        const admiration = edge.admiration || 0;
        const attachment = edge.attachment || 0;
        const resentment = edge.resentment || 0;
        const reciprocity = edge.reciprocityScore || 0;
        const rejectionWeight = edge.rejectionWeight || 0;
        const forgiveness = edge.forgivenessWeight || 0;
        const followThrough = edge.followThroughScore || 0;
        return this.clamp01(
            (trust * 0.26) +
            (comfort * 0.26) +
            (admiration * 0.18) +
            (attachment * 0.18) +
            (reciprocity * 0.18) +
            (followThrough * 0.08) +
            (forgiveness * 0.06) +
            recentCourtshipWeight -
            (resentment * 0.24) -
            (rejectionWeight * 0.26)
        );
    }

    getSignalConfig(signalType) {
        const defaults = {
            trust_display: {
                durationSeconds: 2.4,
                radius: 0,
                indicator: 'trust',
                indicatorGlyph: '\u2665',
                intensity: 0.72,
                clarityDelta: 0.02
            },
            teaching_signal: {
                durationSeconds: 3.2,
                radius: gameConfig?.balance?.social?.teachingPulseRadius || 80,
                indicator: 'teach',
                indicatorGlyph: '\u2736',
                intensity: 0.88,
                clarityDelta: 0.06
            },
            calming_signal: {
                durationSeconds: 2.8,
                radius: gameConfig?.balance?.social?.trustCascadeRadius || 78,
                indicator: 'calm',
                indicatorGlyph: '~',
                intensity: 0.78,
                clarityDelta: 0.05
            },
            warning_signal: {
                durationSeconds: 2.0,
                radius: 92,
                indicator: 'warn',
                indicatorGlyph: '!',
                intensity: 0.82,
                clarityDelta: 0.03
            },
            courtship_signal: {
                durationSeconds: 2.6,
                radius: 70,
                indicator: 'court',
                indicatorGlyph: '\u2661',
                intensity: 0.86,
                clarityDelta: 0.04
            },
            acknowledgement_signal: {
                durationSeconds: 2.0,
                radius: 56,
                indicator: 'reply',
                indicatorGlyph: '\u21ba',
                intensity: 0.7,
                clarityDelta: 0.04
            },
            guidance_signal: {
                durationSeconds: 2.3,
                radius: 74,
                indicator: 'guide',
                indicatorGlyph: '\u27a4',
                intensity: 0.78,
                clarityDelta: 0.05
            }
        };

        return defaults[signalType] || {
            durationSeconds: 2.2,
            radius: 72,
            indicator: 'signal',
            indicatorGlyph: '\u2022',
            intensity: 0.7,
            clarityDelta: 0.03
        };
    }

    getZoneCommunicationStyle(zoneId = null) {
        if (!zoneId || typeof gameCore === 'undefined' || !gameCore.getZoneEcologyProfile) {
            return null;
        }
        return gameCore.getZoneEcologyProfile(zoneId)?.communicationStyle || null;
    }

    getZoneDialogueLexicon(style = null) {
        const shared = {
            route: 'open path',
            landmark: 'stone edge',
            space: 'open ground',
            shelter: 'wall',
            atmosphere: 'light'
        };
        const byStyle = {
            'open-land-calm': {
                route: 'open grass',
                landmark: 'stone edge',
                space: 'quiet ground',
                shelter: 'sunlit wall',
                atmosphere: 'light'
            },
            'loud-training': {
                route: 'drill line',
                landmark: 'center ring',
                space: 'training floor',
                shelter: 'outer wall',
                atmosphere: 'pressure'
            },
            'open-land-watchful': {
                route: 'moss path',
                landmark: 'covered edge',
                space: 'low ground',
                shelter: 'covered wall',
                atmosphere: 'air'
            },
            'open-land-echoing': {
                route: 'waterlit path',
                landmark: 'pool edge',
                space: 'echoing ground',
                shelter: 'stone rim',
                atmosphere: 'echo'
            }
        };
        return {
            ...shared,
            ...(byStyle[style] || {})
        };
    }

    getDialogueFingerprint(phrase = '') {
        return String(phrase || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }

    pickDialogueCandidate(candidates = [], source = null, signalType = 'speech', zoneId = null, context = {}) {
        const pool = candidates.filter(Boolean);
        if (!pool.length) return 'I am here';

        const recentFingerprints = (source?.lifeSim?.communication?.recentDialogues || [])
            .filter(entry => entry?.direction === 'outgoing')
            .slice(0, 4)
            .map(entry => this.getDialogueFingerprint(entry?.phrase || ''));
        const filtered = pool.filter(candidate => !recentFingerprints.includes(this.getDialogueFingerprint(candidate)));
        const choices = filtered.length ? filtered : pool;
        const seedSource = [
            source?.id || 'butterfly',
            signalType,
            zoneId || 'zone',
            context.targetLabel || '',
            context.targetCount || 0,
            this.dialogueHistory.length,
            Math.floor(this.simulationClockSeconds)
        ].join(':');
        const seed = seedSource.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return choices[seed % choices.length];
    }

    buildSignalPhrase(source, signalType, zoneId = null, intent = '', context = {}) {
        const intentProfile = this.getDialogueIntentProfile(signalType, source, context);
        return this.composeDialoguePhrase(source, signalType, zoneId, {
            ...context,
            intent,
            intentProfile
        });
    }

    createDialogueRecord(signal, source, recipients = [], overrides = {}) {
        const dialogueSpec = this.getDialogueSpec(signal?.signalType);
        if (!dialogueSpec.verbal || !source?.id) return null;

        const zoneId = overrides.zoneId || signal?.sourceZoneId || source.currentZoneId || source.lifeSim?.lifecycle?.currentZoneId || null;
        const band = overrides.band || this.getLanguageBand(source);
        const tone = overrides.tone || this.getDialogueTone(source, signal?.signalType);
        const register = overrides.register || this.getDialogueRegister(source, signal?.signalType);
        const intentProfile = overrides.intentProfile || this.getDialogueIntentProfile(signal?.signalType, source, {
            talkMode: overrides.talkMode || this.getTalkMode({
                targetIds: Array.isArray(overrides.targetIds)
                    ? [...new Set(overrides.targetIds.filter(Boolean))]
                    : recipients.map(entity => entity.id),
                radius: overrides.radius ?? signal?.radius ?? 0
            }),
            targetCount: Array.isArray(overrides.targetIds)
                ? overrides.targetIds.filter(Boolean).length
                : recipients.length,
            recipients
        });
        const phrase = this.normalizeDialoguePhrase(
            overrides.phrase || signal?.phrase || this.composeDialoguePhrase(source, signal?.signalType, zoneId, {
                recipients,
                targetCount: Array.isArray(overrides.targetIds)
                    ? overrides.targetIds.filter(Boolean).length
                    : recipients.length,
                targetLabel: overrides.targetLabel || signal?.targetLabel || null,
                band,
                tone,
                register,
                intentProfile,
                talkMode: overrides.talkMode || this.getTalkMode({
                    targetIds: Array.isArray(overrides.targetIds)
                        ? [...new Set(overrides.targetIds.filter(Boolean))]
                        : recipients.map(entity => entity.id),
                    radius: overrides.radius ?? signal?.radius ?? 0
                })
            }),
            { entity: source, signalType: signal?.signalType, tone, register, band }
        );
        if (!phrase) return null;

        const targetIds = Array.isArray(overrides.targetIds)
            ? [...new Set(overrides.targetIds.filter(Boolean))]
            : recipients.map(entity => entity.id);
        const targetLabels = Array.isArray(overrides.targetLabels)
            ? overrides.targetLabels.filter(Boolean)
            : recipients.map(entity => this.getEntityLabel(entity));
        const talkMode = overrides.talkMode || this.getTalkMode({
            targetIds,
            radius: overrides.radius ?? signal?.radius ?? 0
        });
        const conversationId = overrides.conversationId || (targetIds.length === 1
            ? this.getConversationId(source.id, targetIds[0], zoneId)
            : null);

        return {
            id: overrides.id || `dialogue_${signal?.signalType || 'speech'}_${source.id}_${Math.round((overrides.createdAtSeconds ?? signal?.createdAtSeconds ?? this.simulationClockSeconds) * 1000)}`,
            timestamp: overrides.timestamp || Date.now(),
            createdAtSeconds: overrides.createdAtSeconds ?? signal?.createdAtSeconds ?? this.simulationClockSeconds,
            sourceId: source.id,
            sourceLabel: this.getEntityLabel(source),
            sourceZoneId: zoneId,
            sourceSignalType: signal?.signalType || overrides.sourceSignalType || null,
            phrase,
            tone,
            register,
            languageBand: band,
            talkMode,
            conversationId,
            targetIds,
            targetLabels,
            targetLabel: overrides.targetLabel || signal?.targetLabel || null,
            targetCount: targetIds.length,
            intentFamily: overrides.intentFamily || intentProfile.family,
            intentSubtype: overrides.intentSubtype || intentProfile.subtype,
            pairMode: overrides.pairMode || intentProfile.pairMode || null,
            pairTexture: overrides.pairTexture || intentProfile.pairTexture || null,
            pairTextureLabel: overrides.pairTextureLabel || intentProfile.pairTextureLabel || null,
            stance: overrides.stance || null,
            intentTags: [...new Set([...(dialogueSpec.intentTags || []), ...(intentProfile.intentTags || []), ...(overrides.intentTags || [])])],
            responseToId: overrides.responseToId || null,
            responseToSignalType: overrides.responseToSignalType || null,
            responseToIntentTags: Array.isArray(overrides.responseToIntentTags) ? [...new Set(overrides.responseToIntentTags.filter(Boolean))] : [],
            responseToSourceId: overrides.responseToSourceId || null,
            autoReplyDepth: overrides.autoReplyDepth || 0,
            responseExpected: overrides.responseExpected ?? (dialogueSpec.allowResponse && (intentProfile.allowResponse ?? true))
        };
    }

    buildResponseDialogue(recipient, dialogue) {
        if (!recipient?.id || !dialogue?.sourceId) return null;
        const sourceSpeaker = this.getEntityById(dialogue.sourceId);
        const stance = this.selectDialogueStance(recipient, dialogue);
        if (stance === 'ignore') return null;
        const responseType = stance === 'flirt_back'
            ? 'courtship_signal'
            : stance === 'comfort_back'
                ? 'calming_signal'
                : stance === 'reflect'
                    ? 'teaching_signal'
                    : stance === 'comply'
                        ? 'guidance_signal'
                        : 'acknowledgement_signal';
        const zoneId = recipient.currentZoneId || recipient.lifeSim?.lifecycle?.currentZoneId || dialogue.sourceZoneId || null;
        const targetEntity = this.getEntityById(dialogue.sourceId);
        const intentProfile = this.getDialogueIntentProfile(responseType, recipient, {
            talkMode: 'single_target',
            targetCount: 1,
            recipients: targetEntity ? [targetEntity] : []
        });
        const responseIntent = this.getResponseIntentMetadata(stance, dialogue, recipient);
        return this.createDialogueRecord({
            signalType: responseType,
            sourceZoneId: zoneId,
            createdAtSeconds: this.simulationClockSeconds
        }, recipient, [targetEntity].filter(Boolean), {
            targetIds: [dialogue.sourceId],
            targetLabels: [dialogue.sourceLabel || this.getEntityLabel(sourceSpeaker)],
            phrase: this.composeDialoguePhrase(recipient, responseType, zoneId, {
                recipients: [targetEntity].filter(Boolean),
                targetCount: 1,
                targetLabel: dialogue.sourceLabel || this.getEntityLabel(sourceSpeaker),
                talkMode: 'single_target',
                responseTo: dialogue,
                stance,
                intentProfile
            }),
            createdAtSeconds: this.simulationClockSeconds,
            autoReplyDepth: (dialogue.autoReplyDepth || 0) + 1,
            responseExpected: false,
            stance,
            intentProfile,
            intentFamily: intentProfile.family,
            intentSubtype: responseIntent.intentSubtype || intentProfile.subtype,
            intentTags: responseIntent.intentTags || [],
            responseToId: dialogue.id,
            responseToSignalType: dialogue.sourceSignalType || null,
            responseToIntentTags: [...(dialogue.intentTags || [])],
            responseToSourceId: dialogue.sourceId
        });
    }

    maybeQueueResponse(recipients, dialogue) {
        if (!dialogue?.responseExpected || (dialogue.autoReplyDepth || 0) >= 1) return;
        const pressure = this.getPressureProfile();
        if (pressure.isCritical && dialogue.talkMode === 'open_talk') return;

        const candidates = (recipients || []).filter(recipient => {
            if (!recipient?.lifeSim?.communication || recipient.id === dialogue.sourceId) return false;
            if (pressure.isHot && dialogue.talkMode === 'open_talk') return false;
            return true;
        });
        if (!candidates.length) return;

        const scored = candidates
            .map(recipient => {
                const communication = recipient.lifeSim.communication || {};
                const interpretation = recipient.lifeSim.interpretation || {};
                const clarity = interpretation.clarity ?? 0;
                const receptivity = communication.receptivity ?? 0.5;
                const targetBoost = dialogue.targetIds?.includes(recipient.id) ? 0.25 : 0;
                const directMode = dialogue.talkMode === 'single_target' ? 0.2 : dialogue.talkMode === 'multi_target' ? 0.08 : 0;
                const score = (clarity * 0.42) + (receptivity * 0.28) + targetBoost + directMode;
                return { recipient, score, clarity, receptivity };
            })
            .filter(entry => entry.clarity >= 0.38 && entry.receptivity >= 0.28)
            .sort((left, right) => right.score - left.score);

        const choice = scored[0];
        if (!choice?.recipient) return;

        const communication = choice.recipient.lifeSim.communication;
        const response = this.buildResponseDialogue(choice.recipient, dialogue);
        if (!response) return;

        const responseFingerprint = this.getDialogueFingerprint(response.phrase);
        const existingPending = communication.pendingUtterances || [];
        const hasMatchingPending = existingPending.some(item =>
            this.getDialogueFingerprint(item?.phrase || '') === responseFingerprint
        );
        if (hasMatchingPending) return;

        const recentOutgoing = (communication.recentDialogues || [])
            .filter(entry => entry.direction === 'outgoing')
            .slice(0, 2);
        const recentlySaidSameThing = recentOutgoing.some(entry =>
            this.getDialogueFingerprint(entry?.phrase || '') === responseFingerprint
        );
        if (recentlySaidSameThing) return;

        communication.pendingUtterances = communication.pendingUtterances || [];
        communication.pendingUtterances = communication.pendingUtterances.slice(0, pressure.isCritical ? 0 : 1);
        communication.pendingUtterances.push({
            ...response,
            emitAtSeconds: this.simulationClockSeconds + this.dialogueReplyDelaySeconds,
            emitAtMs: Date.now() + this.dialogueReplyDelayMs
        });
    }

    normalizeSignal(data = {}, gameState = gameCore?.gameState) {
        const source = data?.sourceButterfly || this.getEntityById(data?.sourceId, gameState);
        if (!source?.id) return null;

        const signalType = data.signalType || 'generic_signal';
        const config = this.getSignalConfig(signalType);
        const createdAtSeconds = data.createdAtSeconds ?? this.simulationClockSeconds;
        const zoneId = data.zoneId || source.currentZoneId || source.lifeSim?.lifecycle?.currentZoneId || null;
        const targetIds = Array.isArray(data.targetIds)
            ? [...new Set(data.targetIds.filter(Boolean))]
            : (data.targetId && data.targetId !== 'player_cursor' ? [data.targetId] : []);
        const talkMode = targetIds.length > 1
            ? 'multi_target'
            : (targetIds.length === 1 ? 'single_target' : 'open_talk');
        const recipients = targetIds
            .map(entityId => this.getEntityById(entityId, gameState))
            .filter(Boolean);

        return {
            id: data.id || `signal_${signalType}_${source.id}_${Math.round(createdAtSeconds * 1000)}`,
            sourceId: source.id,
            sourceLabel: this.getEntityLabel(source),
            sourceArchetype: source.personalityType || source.lifeSim?.identity?.archetype || 'butterfly',
            sourceZoneId: zoneId,
            signalType,
            intent: data.intent || config.indicator,
            indicator: data.indicator || config.indicator,
            indicatorGlyph: data.indicatorGlyph || config.indicatorGlyph,
            intensity: data.intensity ?? config.intensity,
            radius: data.radius ?? config.radius,
            phrase: data.phrase || this.buildSignalPhrase(source, signalType, zoneId, data.intent || '', {
                recipients,
                targetCount: targetIds.length,
                targetLabel: data.targetLabel || null,
                talkMode
            }),
            targetLabel: data.targetLabel || null,
            targetIds,
            createdAtSeconds,
            expiresAtSeconds: createdAtSeconds + (data.durationSeconds ?? config.durationSeconds),
            clarityDelta: data.clarityDelta ?? config.clarityDelta
        };
    }

    resolveRecipients(signal, gameState = gameCore?.gameState) {
        if (!signal) return [];
        const allEntities = this.getLiveEntities(gameState);
        const source = this.getEntityById(signal.sourceId, gameState);
        if (!source) return [];

        if (signal.targetIds.length) {
            return signal.targetIds
                .map(entityId => this.getEntityById(entityId, gameState))
                .filter(entity => entity?.id && entity.id !== source.id);
        }

        if (!signal.radius) return [];
        const radiusSq = signal.radius * signal.radius;
        return allEntities.filter(entity => {
            if (!entity?.id || entity.id === source.id) return false;
            const entityZoneId = entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null;
            if (signal.sourceZoneId && entityZoneId && entityZoneId !== signal.sourceZoneId) return false;
            const dx = source.x - entity.x;
            const dy = source.y - entity.y;
            return (dx * dx + dy * dy) <= radiusSq;
        });
    }

    createCommunicationEntry(entity, signal, role) {
        return {
            id: `${signal.id}_${role}_${entity?.id || 'none'}`,
            signalId: signal.id,
            signalType: signal.signalType,
            intent: signal.intent,
            phrase: signal.phrase,
            sourceId: signal.sourceId,
            role,
            atSeconds: signal.createdAtSeconds,
            zoneId: signal.sourceZoneId,
            indicator: signal.indicator,
            indicatorGlyph: signal.indicatorGlyph
        };
    }

    trimList(list, maxSize) {
        if (!Array.isArray(list)) return;
        if (list.length > maxSize) {
            list.length = maxSize;
        }
    }

    trimCommunicationState(entity) {
        const communication = entity?.lifeSim?.communication;
        const interpretation = entity?.lifeSim?.interpretation;
        if (!communication || !interpretation) return;
        this.trimList(communication.recentEmitted, 16);
        this.trimList(communication.recentReceived, 16);
        this.trimList(communication.recentConversations, 10);
        this.trimList(communication.recentDialogues, 16);
        this.trimList(communication.recentResidues, 12);
        this.trimList(communication.retainedLessons, 8);
        this.trimList(communication.pendingUtterances, 2);
        this.trimList(interpretation.lastSignals, 12);
        for (const edge of Object.values(entity?.lifeSim?.socialEdges || {})) {
            this.compactEdgeResidueHistory(edge);
        }
    }

    decayConversationTexture(entity, deltaSeconds = 0, nowSeconds = this.simulationClockSeconds) {
        if (!entity?.lifeSim?.socialEdges) return;
        const decayStep = Math.max(0.002, deltaSeconds > 0 ? deltaSeconds * 0.06 : 0.002);
        for (const edge of Object.values(entity.lifeSim.socialEdges)) {
            if (!edge || typeof edge !== 'object') continue;
            edge.recentWarmth = this.clamp01(Math.max(0, (edge.recentWarmth || 0) - decayStep * 0.8));
            edge.recentEase = this.clamp01(Math.max(0, (edge.recentEase || 0) - decayStep * 0.7));
            edge.recentFriction = this.clamp01(Math.max(0, (edge.recentFriction || 0) - decayStep * 0.55));
            edge.recentMutualAttention = this.clamp01(Math.max(0, (edge.recentMutualAttention || 0) - decayStep * 1.1));
        }

        const communication = entity.lifeSim.communication;
        const activeConversation = communication?.activeConversation || null;
        if (activeConversation && (nowSeconds - (activeConversation.lastAtSeconds ?? 0)) > 22) {
            communication.activeConversation = null;
        }
    }

    getConversationId(sourceId, targetId, zoneId = null) {
        const pair = [sourceId, targetId].filter(Boolean).sort().join('::');
        return `${pair}@${zoneId || 'garden'}`;
    }

    updateConversationState(source, recipient, interaction) {
        if (!source?.lifeSim?.communication || !recipient?.lifeSim?.communication) return;
        const zoneId = interaction?.sourceZoneId || interaction?.zoneId || null;
        const conversationId = this.getConversationId(source.id, recipient.id, zoneId);
        const atSeconds = interaction?.createdAtSeconds ?? this.simulationClockSeconds;
        const writeSnapshot = (owner, partner, direction) => {
            const communication = owner.lifeSim.communication;
            const active = communication.activeConversation;
            const sameConversation = active?.conversationId === conversationId && ((atSeconds - (active.lastAtSeconds ?? 0)) <= 18);
            const turnCount = sameConversation ? ((active.turnCount || 0) + 1) : 1;
            const snapshot = {
                conversationId,
                partnerId: partner.id,
                partnerLabel: this.getEntityLabel(partner),
                zoneId,
                signalType: interaction?.signalType || null,
                phrase: interaction?.phrase || null,
                talkMode: interaction?.talkMode || null,
                direction,
                turnCount,
                lastAtSeconds: atSeconds
            };
            communication.activeConversation = snapshot;
            communication.recentConversations = communication.recentConversations || [];
            communication.recentConversations.unshift({ ...snapshot });

            const edge = ensureLifeSocialEdge?.(owner, partner.id);
            if (edge) {
                edge.recentMutualAttention = this.clamp01((edge.recentMutualAttention || 0) + (sameConversation ? 0.08 : 0.04));
                if (sameConversation && turnCount >= 2) {
                    edge.recentEase = this.clamp01((edge.recentEase || 0) + 0.025);
                }
                edge.lastConversationAtSeconds = atSeconds;
            }
            this.trimCommunicationState(owner);
            this.requestLifeSimRefresh(owner, 'conversation-state');
        };

        writeSnapshot(source, recipient, 'outgoing');
        writeSnapshot(recipient, source, 'incoming');
    }

    applySignalToSource(source, signal) {
        const communication = source?.lifeSim?.communication;
        if (!communication) return;

        communication.activeSignal = {
            signalId: signal.id,
            signalType: signal.signalType,
            intent: signal.intent,
            phrase: signal.phrase,
            indicator: signal.indicator,
            indicatorGlyph: signal.indicatorGlyph,
            intensity: signal.intensity,
            targetIds: [...(signal.targetIds || [])],
            targetCount: signal.targetIds?.length || 0,
            expiresAtSeconds: signal.expiresAtSeconds,
            zoneId: signal.sourceZoneId
        };
        communication.recentEmitted.unshift(this.createCommunicationEntry(source, signal, 'emitted'));
        communication.lexicon[signal.signalType] = (communication.lexicon[signal.signalType] || 0) + 1;
        this.trimCommunicationState(source);
        this.requestLifeSimRefresh(source, 'signal-source');
    }

    applySignalToRecipient(recipient, signal) {
        const communication = recipient?.lifeSim?.communication;
        const interpretation = recipient?.lifeSim?.interpretation;
        if (!communication || !interpretation) return;

        communication.recentReceived.unshift(this.createCommunicationEntry(recipient, signal, 'received'));
        interpretation.lastSignals.unshift({
            signalId: signal.id,
            signalType: signal.signalType,
            sourceId: signal.sourceId,
            sourceLabel: signal.sourceLabel,
            phrase: signal.phrase,
            atSeconds: signal.createdAtSeconds,
            intent: signal.intent
        });

        const receptivity = communication.receptivity ?? 0.5;
        const clarityBias = communication.clarityBias ?? 0;
        const anxietyBias = recipient?.lifeSim?.distortion?.anxietyBias ?? 0;
        const warpedChance = Math.max(0, anxietyBias - receptivity * 0.25);
        const warped = Math.random() < warpedChance;

        if (warped) {
            interpretation.warpedSignals = (interpretation.warpedSignals || 0) + 1;
        } else {
            interpretation.clarity = this.clamp01(
                (interpretation.clarity || 0) + signal.clarityDelta + clarityBias * 0.02
            );
        }

        this.trimCommunicationState(recipient);
        this.requestLifeSimRefresh(recipient, 'signal-recipient');
    }

    isEntitySociallyVulnerable(entity) {
        if (!entity?.lifeSim) return false;
        const threat = this.clamp01(entity.lifeSim?.emotions?.threat || 0);
        const exhaustion = this.clamp01(entity.lifeSim?.emotions?.exhaustion || 0);
        const confidence = this.clamp01(entity.lifeSim?.social?.confidence || 0);
        const sleepSubtype = sleepSystem?.getSleepState?.(entity.id)?.subtype || null;
        return entity?.state === 'scared'
            || !!sleepSubtype
            || threat >= 0.42
            || exhaustion >= 0.56
            || confidence <= 0.24;
    }

    getDialogueWitnesses(source, recipients = [], dialogue = null, gameState = gameCore?.gameState) {
        if (!source?.id) return [];
        const zoneId = dialogue?.sourceZoneId
            || source.currentZoneId
            || source.lifeSim?.lifecycle?.currentZoneId
            || null;
        const anchors = [source, ...recipients.filter(recipient => recipient?.id)];
        const excludedIds = new Set(anchors.map(entity => entity.id));
        const radiusSq = 148 * 148;
        return (gameState?.butterflies || [])
            .filter(candidate => candidate?.id && candidate?.lifeSim && !excludedIds.has(candidate.id))
            .filter(candidate => {
                const candidateZoneId = candidate.currentZoneId || candidate.lifeSim?.lifecycle?.currentZoneId || null;
                return !zoneId || !candidateZoneId || candidateZoneId === zoneId;
            })
            .filter(candidate => anchors.some(anchor => {
                const dx = (candidate.x || 0) - (anchor.x || 0);
                const dy = (candidate.y || 0) - (anchor.y || 0);
                return ((dx * dx) + (dy * dy)) <= radiusSq;
            }));
    }

    buildDialogueWitnessEdgeDeltas(witness, subject, dialogue, role = 'speaker', focusPartner = null) {
        if (!witness?.id || !subject?.id || witness.id === subject.id || !dialogue) return {};
        const intentTags = dialogue.intentTags || [];
        const targetCount = Math.max(1, dialogue.targetIds?.length || 0, dialogue.targetCount || 0);
        const scale = 1 / targetCount;
        const clarity = this.clamp01(witness.lifeSim?.interpretation?.clarity ?? 0.5);
        const focusEdge = focusPartner?.id
            ? ensureLifeSocialEdge?.(witness, focusPartner.id)
            : null;
        const focusAffinity = focusEdge
            ? this.clamp01(
                (focusEdge.trust || 0) * 0.24
                + (focusEdge.comfort || 0) * 0.24
                + (focusEdge.attachment || 0) * 0.22
                + (focusEdge.protectiveness || 0) * 0.3
                + (focusEdge.admiration || 0) * 0.1
            )
            : 0;
        const focusVulnerable = this.isEntitySociallyVulnerable(focusPartner);
        const positiveShow = intentTags.some(tag => ['comfort', 'companionship', 'warmth', 'admiration', 'agreement', 'follow_through'].includes(tag));
        const harshShow = intentTags.some(tag => ['friction', 'rejection'].includes(tag));
        const repairShow = intentTags.some(tag => ['repair', 'forgiveness'].includes(tag));
        const teachingShow = intentTags.includes('teaching');
        const warningShow = intentTags.includes('warning');
        const praiseShow = intentTags.includes('admiration') || intentTags.includes('warmth');

        const deltas = {};
        if (role === 'speaker') {
            if (positiveShow || repairShow || teachingShow) {
                deltas.admiration = Math.max(deltas.admiration || 0, scale * (0.004 + clarity * 0.004));
                deltas.trust = Math.max(deltas.trust || 0, scale * (0.003 + clarity * 0.003 + focusAffinity * 0.004));
            }
            if (teachingShow) {
                deltas.admiration = Math.max(deltas.admiration || 0, scale * (0.008 + clarity * 0.005));
            }
            if (warningShow && focusVulnerable) {
                deltas.admiration = Math.max(deltas.admiration || 0, scale * (0.006 + focusAffinity * 0.006 + clarity * 0.004));
                deltas.protectiveness = Math.max(deltas.protectiveness || 0, scale * (0.004 + focusAffinity * 0.006));
            }
            if (harshShow && focusAffinity > 0.14) {
                deltas.rivalry = Math.max(deltas.rivalry || 0, scale * (0.006 + focusAffinity * 0.008 + clarity * 0.004));
                deltas.resentment = Math.max(deltas.resentment || 0, scale * (0.005 + focusAffinity * 0.008));
                deltas.trust = Math.min(deltas.trust || 0, -scale * (0.002 + focusAffinity * 0.004));
            }
        } else if (role === 'recipient') {
            if (positiveShow || repairShow) {
                deltas.comfort = Math.max(deltas.comfort || 0, scale * (0.003 + focusAffinity * 0.004));
            }
            if (praiseShow) {
                deltas.admiration = Math.max(deltas.admiration || 0, scale * (0.004 + clarity * 0.003));
            }
            if (harshShow) {
                deltas.protectiveness = Math.max(deltas.protectiveness || 0, scale * (0.006 + focusAffinity * 0.008 + clarity * 0.003));
                deltas.trust = Math.max(deltas.trust || 0, scale * (0.002 + focusAffinity * 0.003));
            }
            if (warningShow && focusVulnerable) {
                deltas.protectiveness = Math.max(deltas.protectiveness || 0, scale * (0.004 + focusAffinity * 0.006));
            }
        }

        return deltas;
    }

    applyDialogueWitnessCarryover(source, dialogue, recipients = [], gameState = gameCore?.gameState) {
        if (!source?.id || !dialogue) return [];
        const witnesses = this.getDialogueWitnesses(source, recipients, dialogue, gameState);
        if (!witnesses.length) return [];

        const tagBase = (dialogue.intentTags || []).includes('teaching')
            ? 'teaching'
            : (dialogue.intentTags || []).includes('repair') || (dialogue.intentTags || []).includes('forgiveness')
                ? 'repair'
                : (dialogue.intentTags || []).includes('warning')
                    ? 'warning'
                    : (dialogue.intentTags || []).includes('friction') || (dialogue.intentTags || []).includes('rejection')
                        ? 'friction'
                        : 'social';
        const touched = [];

        for (const witness of witnesses) {
            if (!witness?.id) continue;
            let witnessTouched = false;
            const speakerDeltas = this.buildDialogueWitnessEdgeDeltas(witness, source, dialogue, 'speaker', recipients[0] || null);
            if (Object.keys(speakerDeltas).length && typeof adjustLifeSocialEdge === 'function') {
                adjustLifeSocialEdge(witness, source.id, speakerDeltas, {
                    updatedAtSeconds: dialogue.createdAtSeconds,
                    tag: `witness-speaker-${tagBase}`
                });
                witnessTouched = true;
            }

            for (const recipient of recipients) {
                if (!recipient?.id) continue;
                const recipientDeltas = this.buildDialogueWitnessEdgeDeltas(witness, recipient, dialogue, 'recipient', source);
                if (Object.keys(recipientDeltas).length && typeof adjustLifeSocialEdge === 'function') {
                    adjustLifeSocialEdge(witness, recipient.id, recipientDeltas, {
                        updatedAtSeconds: dialogue.createdAtSeconds,
                        tag: `witness-recipient-${tagBase}`
                    });
                    witnessTouched = true;
                }
            }

            if (witnessTouched) {
                touched.push(witness.id);
            }
        }

        return touched;
    }

    recordDialogueMemory(recipient, source, dialogue, deltas, residue = null) {
        if (!recipient?.lifeSim || !source?.id) return;

        const family = this.classifyDialogueMemoryFamily(dialogue.intentTags);
        const interpretation = recipient.lifeSim.interpretation || {};
        const clarity = this.clamp01(interpretation.clarity ?? 0.5);
        const strength = Math.max(0.14, Math.min(0.46, 0.16 + clarity * 0.18 + (dialogue.intentTags?.includes('teaching') ? 0.05 : 0)));
        const valence = dialogue.intentTags?.includes('warning')
            ? 0.1
            : dialogue.intentTags?.includes('courtship')
                ? 0.22
                : dialogue.intentTags?.includes('comfort')
                    ? 0.26
                    : 0.18;

        let memory = null;
        if (typeof appendLifeMemory === 'function') {
            memory = appendLifeMemory(recipient, family, {
                subjectId: source.id,
                valence,
                strength,
                tags: [
                    ...(dialogue.intentTags || []),
                    'dialogue',
                    ...(residue?.type ? [residue.type] : []),
                    ...(residue?.rememberability ? [`memory-${residue.rememberability}`] : []),
                    ...(residue?.learnOutcome ? ['dialogue-learn'] : [])
                ],
                createdAtSeconds: dialogue.createdAtSeconds,
                metadata: {
                    phrase: dialogue.phrase,
                    sourceLabel: dialogue.sourceLabel,
                    talkMode: dialogue.talkMode,
                    residueType: residue?.type || null,
                    residueLabel: residue?.label || null,
                    rememberability: residue?.rememberability || null,
                    followThroughState: residue?.followThroughState || null,
                    stance: residue?.stance || null,
                    learnLabel: residue?.learnOutcome?.label || null
                }
            });
        }

        let edge = null;
        if (typeof adjustLifeSocialEdge === 'function') {
            edge = adjustLifeSocialEdge(recipient, source.id, deltas, {
                updatedAtSeconds: dialogue.createdAtSeconds,
                tag: `dialogue-${residue?.type || (dialogue.intentTags || ['speech'])[0]}`
            });
        }

        if (residue) {
            this.applyDialogueRelationshipResidue(recipient, source, residue, edge);
        }

        return { memory, edge, residue };
    }

    applyDialogueToRecipient(recipient, source, dialogue) {
        const communication = recipient?.lifeSim?.communication;
        const interpretation = recipient?.lifeSim?.interpretation;
        if (!communication || !interpretation || !dialogue) return;

        if (source?.id) {
            this.rememberKnownName(recipient, source);
        }
        if (recipient?.id && source?.id) {
            this.rememberKnownName(source, recipient);
        }

        const stance = this.selectDialogueStance(recipient, dialogue);
        const deltas = this.buildDialogueEdgeDeltas(dialogue, recipient, stance);
        const residue = this.buildDialogueResidue(recipient, source, dialogue, deltas, stance);
        if (residue) {
            this.recordRetainedDialogueLesson(recipient, source, dialogue, residue);
        }

        communication.recentDialogues.unshift({
            id: `${dialogue.id}_incoming_${recipient.id}`,
            direction: 'incoming',
            phrase: dialogue.phrase,
            sourceId: dialogue.sourceId,
            sourceLabel: dialogue.sourceLabel,
            partnerId: source?.id || null,
            partnerLabel: this.getEntityLabel(source),
            atSeconds: dialogue.createdAtSeconds,
            talkMode: dialogue.talkMode,
            sourceSignalType: dialogue.sourceSignalType || null,
            intentTags: [...(dialogue.intentTags || [])],
            tone: dialogue.tone,
            register: dialogue.register,
            languageBand: dialogue.languageBand,
            residueLabel: residue?.label || null,
            rememberability: residue?.rememberability || null,
            followThroughState: residue?.followThroughState || null,
            learnOutcomeLabel: residue?.learnOutcome?.label || null,
            stance
        });
        communication.lastHeardAtSeconds = dialogue.createdAtSeconds;

        this.recordDialogueMemory(recipient, source, dialogue, deltas, residue);
        if (residue) {
            this.storeDialogueResidue(recipient, residue);
        }
        this.trimCommunicationState(recipient);
        this.requestLifeSimRefresh(recipient, 'dialogue-received');
        return residue;
    }

    storeHistory(signal, recipients) {
        const entry = {
            id: signal.id,
            timestamp: Date.now(),
            createdAtSeconds: signal.createdAtSeconds,
            event: GameEvents.COMMUNICATION_SIGNAL,
            signalType: signal.signalType,
            phrase: signal.phrase,
            intent: signal.intent,
            sourceId: signal.sourceId,
            sourceLabel: signal.sourceLabel,
            targetIds: recipients.map(entity => entity.id),
            targetLabels: recipients.map(entity => this.getEntityLabel(entity)),
            targetLabel: signal.targetLabel || null,
            zoneId: signal.sourceZoneId,
            indicator: signal.indicator,
            indicatorGlyph: signal.indicatorGlyph
        };
        this.history.push(entry);
        if (this.history.length > this.maxHistoryEntries) {
            this.history.shift();
        }
        return entry;
    }

    storeDialogue(dialogue) {
        if (!dialogue?.id) return null;
        this.dialogueHistory.push(this.cloneDialogue(dialogue));
        if (this.dialogueHistory.length > this.maxDialogueEntries) {
            this.dialogueHistory.shift();
        }
        return dialogue;
    }

    cloneDialogue(dialogue) {
        return JSON.parse(JSON.stringify(dialogue || null));
    }

    emitDialogue(dialogue, recipients = []) {
        if (!dialogue?.sourceId) return null;
        const source = this.getEntityById(dialogue.sourceId);
        if (!source?.lifeSim?.communication) return null;

        const communication = source.lifeSim.communication;
        this.ensureNameIdentity(source);
        communication.recentDialogues.unshift({
            id: `${dialogue.id}_outgoing_${source.id}`,
            direction: 'outgoing',
            phrase: dialogue.phrase,
            sourceId: dialogue.sourceId,
            sourceLabel: dialogue.sourceLabel,
            partnerId: dialogue.targetIds?.[0] || null,
            partnerLabel: dialogue.targetLabels?.[0] || dialogue.targetLabel || null,
            atSeconds: dialogue.createdAtSeconds,
            talkMode: dialogue.talkMode,
            sourceSignalType: dialogue.sourceSignalType || null,
            intentTags: [...(dialogue.intentTags || [])],
            tone: dialogue.tone,
            register: dialogue.register,
            languageBand: dialogue.languageBand,
            stance: dialogue.stance || null,
            responseToIntentTags: [...(dialogue.responseToIntentTags || [])]
        });
        communication.lastSpokenAtSeconds = dialogue.createdAtSeconds;
        this.trimCommunicationState(source);
        this.requestLifeSimRefresh(source, 'dialogue-spoken');

        const recipientResidues = [];
        for (const recipient of recipients) {
            if (!recipient?.id) continue;
            this.rememberKnownName(source, recipient);
            this.updateConversationState(source, recipient, dialogue);
            const residue = this.applyDialogueToRecipient(recipient, source, dialogue);
            if (residue) {
                recipientResidues.push(JSON.parse(JSON.stringify(residue)));
            }
        }

        const stored = this.storeDialogue({
            ...dialogue,
            residues: recipientResidues,
            learnOutcomes: recipientResidues
                .filter(entry => !!entry?.learnOutcome)
                .map(entry => ({
                    recipientId: entry.recipientId,
                    recipientLabel: entry.recipientLabel,
                    partnerId: entry.partnerId,
                    partnerLabel: entry.partnerLabel,
                    label: entry.learnOutcome.label,
                    category: entry.learnOutcome.category,
                    rememberability: entry.rememberability
                }))
        });
        if (typeof eventBus !== 'undefined' && GameEvents?.DIALOGUE_SPOKEN) {
            eventBus.emit(GameEvents.DIALOGUE_SPOKEN, this.cloneDialogue({
                ...stored,
                zoneId: stored.sourceZoneId
            }));
        }

        this.applyDialogueWitnessCarryover(source, dialogue, recipients);
        this.maybeQueueResponse(recipients, dialogue);
        return stored;
    }

    handleSignal(data = {}) {
        const signal = this.normalizeSignal(data);
        if (!signal) return null;

        const source = this.getEntityById(signal.sourceId);
        if (!source?.lifeSim) return null;
        this.registerEntity(source);

        const recipients = this.resolveRecipients(signal);
        this.applySignalToSource(source, signal);
        for (const recipient of recipients) {
            this.registerEntity(recipient);
            this.applySignalToRecipient(recipient, signal);
        }

        this.activeSignals.set(signal.sourceId, signal);
        const internalEntry = this.storeHistory(signal, recipients);
        const dialogue = this.createDialogueRecord(signal, source, recipients);
        if (dialogue) {
            this.emitDialogue(dialogue, recipients);
        }
        return internalEntry;
    }

    updateQueuedResponses(gameState = gameCore?.gameState) {
        const pressure = this.getPressureProfile();
        let remainingBudget = pressure.isCritical ? 1 : pressure.isHot ? 2 : pressure.isWarm ? 3 : 6;
        const nowMs = Date.now();
        for (const entity of this.getLiveEntities(gameState)) {
            if (remainingBudget <= 0) break;
            const communication = entity?.lifeSim?.communication;
            if (!communication?.pendingUtterances?.length) continue;

            const ready = communication.pendingUtterances.filter(item => {
                if (typeof item.emitAtMs === 'number') {
                    return item.emitAtMs <= nowMs;
                }
                return (item.emitAtSeconds ?? 0) <= this.simulationClockSeconds;
            });
            communication.pendingUtterances = communication.pendingUtterances.filter(item => {
                if (typeof item.emitAtMs === 'number') {
                    return item.emitAtMs > nowMs;
                }
                return (item.emitAtSeconds ?? 0) > this.simulationClockSeconds;
            });

            for (const dialogue of ready) {
                if (remainingBudget <= 0) {
                    communication.pendingUtterances.unshift(dialogue);
                    continue;
                }
                if (pressure.isHot && dialogue.talkMode === 'open_talk') {
                    continue;
                }
                const recipients = (dialogue.targetIds || [])
                    .map(entityId => this.getEntityById(entityId, gameState))
                    .filter(Boolean);
                this.emitDialogue({
                    ...dialogue,
                    timestamp: Date.now(),
                    createdAtSeconds: this.simulationClockSeconds
                }, recipients);
                remainingBudget--;
            }
        }
    }

    getSignalLabel(signalType) {
        const labels = {
            trust_display: 'Expression',
            teaching_signal: 'Attention',
            calming_signal: 'Coordination',
            warning_signal: 'Urgency',
            courtship_signal: 'Expression',
            acknowledgement_signal: 'Attention',
            guidance_signal: 'Direction'
        };
        return labels[signalType] || 'Signal';
    }

    getSignalAudienceLabel(signal = {}) {
        const targetCount = Array.isArray(signal?.targetIds)
            ? signal.targetIds.filter(Boolean).length
            : 0;
        if (targetCount === 1) return '1 target';
        if (targetCount > 1) return `${targetCount} targets`;
        return 'open-local';
    }

    getSignalUrgencyLabel(signal = {}) {
        const intensity = Number(signal?.intensity ?? 0);
        if (intensity >= 0.75) return 'high';
        if (intensity >= 0.45) return 'medium';
        return 'low';
    }

    getSignalSupportSummary(signal = null) {
        if (!signal) {
            return {
                family: 'quiet',
                audience: 'none',
                urgency: 'none',
                label: 'quiet | no active support',
                detail: 'No active coordination signal'
            };
        }

        const family = this.getSignalLabel(signal.signalType);
        const audience = this.getSignalAudienceLabel(signal);
        const urgency = this.getSignalUrgencyLabel(signal);
        return {
            family,
            audience,
            urgency,
            label: `${family} | ${audience} | ${urgency}`,
            detail: signal.intent || signal.phrase || 'active support'
        };
    }

    getPrimaryRelationshipSummary(entityId) {
        const entity = this.getEntityById(entityId);
        const communication = entity?.lifeSim?.communication;
        const edges = entity?.lifeSim?.socialEdges || {};
        if (!entity || !communication) return null;

        const activePartnerId = communication.activeConversation?.partnerId || null;
        const recentLearnResidue = (communication.recentResidues || []).find(entry =>
            entry?.partnerId && (
                entry?.type === 'retained-lesson'
                || !!entry?.learnOutcome
                || !!entry?.learnEligible
            )
        ) || null;
        const recentRetainedLesson = this.getLatestRetainedLesson(entity) || communication.retainedLessons?.[0] || null;
        let partnerId = recentLearnResidue?.partnerId
            || recentRetainedLesson?.partnerId
            || activePartnerId;
        if (!partnerId) {
            const ranked = Object.entries(edges)
                .map(([targetId, edge]) => {
                    const chemistry = this.computeChemistry(edge, 0);
                    const weight = chemistry + (edge.attachment || 0) + (edge.trust || 0) + (edge.comfort || 0);
                    return { targetId, weight };
                })
                .sort((left, right) => right.weight - left.weight);
            partnerId = ranked[0]?.targetId || null;
        }
        if (!partnerId) {
            const recentDialogue = (communication.recentDialogues || []).find(entry => entry.partnerId);
            partnerId = recentDialogue?.partnerId || null;
        }
        if (!partnerId) return null;

        if (!edges[partnerId]) {
            const partner = this.getEntityById(partnerId);
            return {
                partnerId,
                partnerLabel: this.getEntityLabel(partner, partnerId),
                trust: 0,
                comfort: 0,
                admiration: 0,
                resentment: 0,
                attachment: 0,
                chemistry: 0,
                reciprocity: 0,
                rejection: 0,
                followThrough: 0,
                forgiveness: 0,
                pairTexture: 'steady',
                pairTextureLabel: this.getPairConversationTextureLabel('steady'),
                pairTextureSignature: this.getPairConversationTextureSignature('steady'),
                pairTextureLingerBias: 0.06,
                pairTextureConfidenceBias: 0.03,
                pairTextureCourtshipBias: 0.02,
                pairTextureVolatility: 0.16,
                courtshipLabel: 'quiet',
                followThroughLabel: 'no strong carry-over',
                repairLabel: 'steady',
                recentResidueLabel: 'No recent dialogue residue',
                recentLessonLabel: 'No retained dialogue lesson',
                anchoringCount: 0,
                learnedDialogueCount: 0
            };
        }

        const partner = this.getEntityById(partnerId);
        const edge = edges[partnerId];
        const recentCourtshipWeight = (communication.recentDialogues || [])
            .filter(entry => entry.partnerId === partnerId && entry.direction === 'outgoing' && (entry.intentTags || []).includes('courtship'))
            .slice(0, 4)
            .reduce((sum, entry, index) => sum + Math.max(0, 0.05 - (index * 0.01)), 0);
        const chemistry = this.computeChemistry(edge, recentCourtshipWeight);
        const toPercent = value => Math.round(this.clamp01(value) * 100);
        const recentResidue = this.getRecentPartnerResidue(entity, partnerId);
        const recentLesson = this.getLatestRetainedLesson(entity, partnerId);
        const pairState = this.getPairConversationState(entity, partnerId);
        const pairTexture = this.getPairConversationTextureState(entity, partnerId);
        const reciprocity = toPercent(edge.reciprocityScore || 0);
        const rejection = toPercent(edge.rejectionWeight || 0);
        const followThrough = toPercent(edge.followThroughScore || 0);
        const forgiveness = toPercent(edge.forgivenessWeight || 0);
        const courtshipLabel = (edge.reciprocityScore || 0) > 0.34
            ? 'mutual'
            : (edge.rejectionWeight || 0) > 0.18
                ? 'guarded'
                : chemistry > 0.42 || (edge.attachment || 0) > 0.24
                    ? 'warming'
                    : 'quiet';
        const followThroughLabel = (edge.followThroughScore || 0) > 0.48
            ? 'holds what this partner says'
            : (edge.followThroughScore || 0) > 0.24
                ? 'some carry-over is visible'
                : recentLesson
                    ? 'recent lesson held'
                    : 'no strong carry-over';
        const repairLabel = (edge.forgivenessWeight || 0) > 0.34
            ? 'repair holding'
            : edge.repairState === 'repair-open'
                ? 'repair open'
                : edge.repairState === 'offered'
                    ? 'repair offered'
                    : edge.repairState === 'hurt' || (edge.rejectionWeight || 0) > 0.18
                        ? 'hurt still remembered'
                        : 'steady';

        return {
            partnerId,
            partnerLabel: this.getEntityLabel(partner, partnerId),
            trust: toPercent(edge.trust),
            comfort: toPercent(edge.comfort),
            admiration: toPercent(edge.admiration),
            resentment: toPercent(edge.resentment),
            attachment: toPercent(edge.attachment),
            chemistry: toPercent(chemistry),
            reciprocity,
            rejection,
            followThrough,
            forgiveness,
            pairMode: pairState.mode,
            pairModeLabel: pairState.label,
            pairTexture: pairTexture.key,
            pairTextureLabel: pairTexture.label,
            pairTextureSignature: pairTexture.signature,
            pairTextureLingerBias: pairTexture.lingerBias,
            pairTextureConfidenceBias: pairTexture.confidenceBias,
            pairTextureCourtshipBias: pairTexture.courtshipBias,
            pairTextureVolatility: pairTexture.volatility,
            recentWarmth: toPercent(pairState.warmth),
            recentEase: toPercent(pairState.ease),
            recentFriction: toPercent(pairState.friction),
            recentMutualAttention: toPercent(pairState.mutualAttention),
            courtshipLabel,
            followThroughLabel,
            repairLabel,
            recentResidueLabel: recentResidue
                ? `${recentResidue.label} | ${recentResidue.rememberability}`
                : 'No recent dialogue residue',
            recentLessonLabel: recentLesson?.label || 'No retained dialogue lesson',
            anchoringCount: edge.anchoringDialogueCount || 0,
            learnedDialogueCount: edge.learnedDialogueCount || 0
        };
    }

    getCommunicationSummary(entityId) {
        const entity = this.getEntityById(entityId);
        const communication = entity?.lifeSim?.communication;
        const interpretation = entity?.lifeSim?.interpretation;
        if (!communication || !interpretation) return null;

        const active = communication.activeSignal;
        const lastHeard = (communication.recentDialogues || []).find(entry => entry.direction === 'incoming') || null;
        const lastSpoken = (communication.recentDialogues || []).find(entry => entry.direction === 'outgoing') || null;
        const activeConversation = communication.activeConversation || communication.recentConversations?.[0] || null;
        const relationship = this.getPrimaryRelationshipSummary(entityId);
        const recentResidue = this.getRecentPartnerResidue(entity, relationship?.partnerId || null) || communication.recentResidues?.[0] || null;
        const recentLesson = this.getLatestRetainedLesson(entity, relationship?.partnerId || null) || communication.retainedLessons?.[0] || null;
        const signalSupport = this.getSignalSupportSummary(active);
        const localSignalField = this.getLocalSignalField(entity);
        const voiceRecord = lastSpoken || lastHeard || null;
        const voiceBand = voiceRecord?.languageBand || this.getLanguageBand(entity);
        const voiceRegister = voiceRecord?.register || (active?.signalType ? this.getDialogueRegister(entity, active.signalType) : 'neutral');
        const voiceTone = voiceRecord?.tone || (active?.signalType ? this.getDialogueTone(entity, active.signalType) : 'direct');

        return {
            activeSignalLabel: active ? this.getSignalLabel(active.signalType) : 'quiet',
            activePhrase: active?.phrase || null,
            signalSupportLabel: signalSupport.label,
            signalSupportDetail: signalSupport.detail,
            signalSupportFamily: signalSupport.family,
            signalSupportAudience: signalSupport.audience,
            signalSupportUrgency: signalSupport.urgency,
            localSignalFieldLabel: localSignalField.label,
            localSignalFieldDetail: localSignalField.detail,
            localSignalFieldFamily: localSignalField.dominantFamily,
            recentHeardLabel: lastHeard
                ? `${lastHeard.sourceLabel || this.getEntityLabel(this.getEntityById(lastHeard.sourceId))}`
                : 'none',
            recentHeardPhrase: lastHeard?.phrase || activeConversation?.phrase || null,
            recentSpokenPhrase: lastSpoken?.phrase || null,
            voiceBand,
            voiceBandLabel: this.getLanguageBandLabel(voiceBand),
            voiceRegister,
            voiceTone,
            voiceSummaryLabel: `${this.getLanguageBandLabel(voiceBand)} | ${voiceRegister} | ${voiceTone}`,
            clarityPercent: Math.round((interpretation.clarity || 0) * 100),
            warpedSignals: interpretation.warpedSignals || 0,
            emittedCount: communication.recentEmitted?.length || 0,
            receivedCount: communication.recentReceived?.length || 0,
            activeConversationPhrase: activeConversation?.phrase || null,
            recentConversationCount: communication.recentConversations?.length || 0,
            dialogueCount: communication.recentDialogues?.length || 0,
            activeConversationLabel: activeConversation
                ? `with ${activeConversation.partnerLabel || 'partner'} | ${relationship?.pairTextureLabel || relationship?.pairModeLabel || 'steady'} | ${activeConversation.turnCount || 1} turns`
                : 'none',
            recentResidueLabel: recentResidue
                ? `${recentResidue.label} | ${recentResidue.rememberability}`
                : 'No recent dialogue residue',
            recentResidueDetail: recentResidue
                ? `${recentResidue.partnerLabel} | ${relationship?.pairTextureLabel || relationship?.pairModeLabel || 'steady'} | warm ${relationship?.recentWarmth || 0} | friction ${relationship?.recentFriction || 0}`
                : 'No later-behavior residue tracked',
            retainedLessonLabel: recentLesson?.label || 'No retained dialogue lesson',
            relationship,
            zoneStyle: this.getZoneCommunicationStyle(
                entity?.currentZoneId || entity?.lifeSim?.lifecycle?.currentZoneId || activeConversation?.zoneId || active?.zoneId || null
            )
        };
    }

    getZoneLabel(zoneId = null) {
        if (!zoneId) return 'Garden';
        return zoneSystem?.getZone?.(zoneId)?.label
            || gameCore?.getZoneConfig?.(zoneId)?.label
            || zoneId;
    }

    getDialogueTalkModeLabel(dialogue = {}) {
        const targetCount = dialogue?.targetCount || dialogue?.targetIds?.length || 0;
        const mode = dialogue?.talkMode || 'open_talk';
        if (mode === 'single_target') {
            const targetLabel = dialogue?.targetLabels?.[0] || dialogue?.targetLabel || dialogue?.targetText || 'one butterfly';
            return `Direct talk to ${targetLabel}`;
        }
        if (mode === 'multi_target') {
            return `Group talk to ${Math.max(2, targetCount)} butterflies`;
        }
        return 'Open call in view';
    }

    getDialogueVisibleContextLabel(grounding = {}) {
        if (!grounding) return 'moving through the zone';
        if (grounding.state === 'feeding') return 'feeding at flower edge';
        if (grounding.state === 'mating') return 'staying close in courtship';
        if (grounding.state === 'sleeping') return 'settling into shelter';
        if (grounding.socialContext === 'roosting') return 'holding in a roost pocket';
        if (grounding.socialContext === 'warning-cascade') return 'reacting to a warning wave';
        if (grounding.socialContext === 'teaching-pocket') return 'keeping to a teaching pocket';
        if (grounding.socialContext === 'courtship-territory') return 'circling a courtship edge';
        if (grounding.socialContext === 'clique-comfort') return 'holding inside a familiar cluster';
        if (grounding.socialContext === 'clique-exclusion') return 'skimming a tense cluster edge';
        if (grounding.socialContext === 'protective-ring') return 'keeping a protective ring';
        if (grounding.socialContext === 'reputation-wave') return 'drawing local social attention';
        if (grounding.focusType === 'flower') {
            if (grounding.affordance === 'feed') return 'working a nearby flower';
            return 'holding near flowers';
        }
        if (grounding.focusType === 'block') {
            if (grounding.affordance === 'carry') return 'handling a nearby block';
            if (grounding.affordance === 'shelter') return 'holding near shelter blocks';
            return 'moving around blocks';
        }
        if (grounding.socialContext === 'training-ground') return 'keeping to the training edge';
        if (grounding.socialContext === 'signaling') return 'signaling in view';
        if (grounding.socialContext === 'metamorphosis') return 'holding near chrysalis space';
        if (grounding.pathState === 'sheltered') return 'keeping to shelter';
        return 'moving through the zone';
    }

    buildDialogueFeedPresentation(entry, focusResidue = null) {
        const sourceEntity = this.getEntityById(entry?.sourceId);
        const partnerId = entry?.targetIds?.length === 1 ? entry.targetIds[0] : null;
        const pairState = this.getPairConversationState(sourceEntity, partnerId);
        const pairTexture = this.getPairConversationTextureState(sourceEntity, partnerId);
        const grounding = typeof lifeSimSystem !== 'undefined'
            ? lifeSimSystem.getFeedGroundingSummary?.(entry?.sourceId)
            : null;
        const sourceLabel = sourceEntity
            ? this.getEntityLabel(sourceEntity, entry?.sourceLabel || entry?.sourceId || 'Butterfly')
            : (entry?.sourceLabel || entry?.sourceId || 'Butterfly');
        const targetText = this.formatTalkTarget(entry);
        const cleanSource = this.stripSexSuffix(sourceLabel);
        const cleanTarget = targetText ? this.stripSexSuffix(targetText) : null;
        const sameVisibleName = !!cleanTarget && cleanTarget === cleanSource;
        const headlineSource = sameVisibleName ? sourceLabel : cleanSource;
        const headlineTarget = sameVisibleName ? targetText : cleanTarget;
        const zoneLabel = this.getZoneLabel(entry?.sourceZoneId || grounding?.zoneId || null);
        const talkModeLabel = this.getDialogueTalkModeLabel({
            ...entry,
            targetText
        });
        const visibleContext = this.getDialogueVisibleContextLabel(grounding);
        const contextTags = [
            talkModeLabel,
            zoneLabel,
            visibleContext,
            pairTexture?.label ? `${pairTexture.label} texture` : null,
            pairState?.label ? `${pairState.label} exchange` : null,
            focusResidue?.label || null,
            focusResidue?.rememberability ? `memory ${focusResidue.rememberability}` : null
        ].filter(Boolean);

        return {
            sourceLabel,
            targetText,
            headline: headlineTarget ? `${headlineSource} -> ${headlineTarget}` : headlineSource,
            detail: entry?.phrase || '',
            grounding: contextTags.join(' | '),
            contextTags,
            zoneLabel,
            pairMode: pairState.mode,
            pairModeLabel: pairState.label,
            pairTexture: pairTexture.key,
            pairTextureLabel: pairTexture.label,
            threadHeadline: headlineTarget ? `${headlineSource} <-> ${headlineTarget}` : headlineSource,
            partnerId
        };
    }

    groupTalkFeedEntries(entries = []) {
        const grouped = [];
        for (const entry of entries) {
            const previous = grouped[grouped.length - 1];
            const sameThread = previous
                && previous.category === 'talk'
                && entry.category === 'talk'
                && previous.conversationId
                && entry.conversationId
                && previous.conversationId === entry.conversationId
                && ((entry.timestamp || 0) - (previous.lastThreadAt || previous.timestamp || 0)) <= 24000
                && (previous.threadLines?.length || 0) < 3;

            if (sameThread) {
                previous.threadLines.push({
                    speakerLabel: entry.threadSpeaker,
                    phrase: entry.threadPhrase,
                    timeLabel: entry.timeLabel
                });
                previous.detail = previous.threadLines
                    .map(line => `${line.speakerLabel}: ${line.phrase}`)
                    .join('\n');
                previous.threadCount = previous.threadLines.length;
                previous.timeLabel = entry.timeLabel;
                previous.timestamp = entry.timestamp;
                previous.lastThreadAt = entry.timestamp;
                previous.grounding = entry.grounding || previous.grounding;
                previous.contextTags = entry.contextTags?.length ? entry.contextTags : previous.contextTags;
                previous.pairTextureLabel = entry.pairTextureLabel || previous.pairTextureLabel;
                previous.signature = `dialogue-thread:${previous.conversationId}:${previous.threadStartedAt}:${previous.threadCount}`;
                continue;
            }

            grouped.push({
                ...entry,
                pairTextureLabel: entry.pairTextureLabel || null,
                signature: `dialogue-thread:${entry.conversationId || entry.signature}:${entry.timestamp}:${entry.threadLines?.length || 1}`,
                threadStartedAt: entry.timestamp,
                lastThreadAt: entry.timestamp,
                threadCount: entry.threadLines?.length || 1
            });
        }

        return grouped;
    }

    buildDialogueLearnFeedEntries(entry, time, presentation, residues = []) {
        return (residues || [])
            .filter(residue => !!residue?.learnOutcome)
            .map((residue, index) => ({
                timestamp: (entry.timestamp || Date.now()) + (index + 1),
                signature: `dialogue-learn:${entry.id}:${residue.recipientId}:${residue.learnOutcome?.category || 'dialogue'}`,
                line: `${time}-${residue.recipientLabel}: ${residue.learnOutcome.label}`,
                category: 'learn',
                headline: residue.recipientLabel,
                detail: residue.learnOutcome.label,
                grounding: [
                    presentation.zoneLabel,
                    `dialogue ${residue.rememberability}`,
                    residue.label
                ].filter(Boolean).join(' | '),
                contextTags: [
                    presentation.zoneLabel,
                    residue.label,
                    `dialogue ${residue.rememberability}`
                ].filter(Boolean),
                timeLabel: time,
                targetText: this.stripSexSuffix(residue.partnerLabel || '')
            }));
    }

    getFeedEntries(options = {}) {
        const targetId = options.targetId || null;
        const zoneId = options.zoneId || null;
        const limit = options.limit || 40;
        const filtered = this.dialogueHistory.filter(entry => {
            if (!targetId) return true;
            return entry.sourceId === targetId || entry.targetIds.includes(targetId);
        }).filter(entry => {
            if (!zoneId) return true;
            return entry.sourceZoneId === zoneId;
        });
        const talkEntries = filtered.slice(-limit).map(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit'
            });
            const relevantResidues = (entry.residues || []).filter(residue => {
                if (!targetId) return true;
                if (entry.sourceId === targetId) return true;
                return residue?.recipientId === targetId || residue?.partnerId === targetId;
            });
            const focusResidue = relevantResidues[0] || (entry.residues || [])[0] || null;
            const presentation = this.buildDialogueFeedPresentation(entry, focusResidue);
            return {
                timestamp: entry.timestamp,
                signature: `dialogue:${entry.id}`,
                line: `${time}-${presentation.sourceLabel}: ${entry.phrase}`,
                category: 'talk',
                headline: presentation.threadHeadline,
                detail: presentation.detail,
                grounding: presentation.grounding,
                contextTags: presentation.contextTags,
                timeLabel: time,
                targetText: presentation.targetText,
                conversationId: entry.conversationId || (entry.targetIds?.length === 1 ? this.getConversationId(entry.sourceId, entry.targetIds[0], entry.sourceZoneId) : null),
                threadSpeaker: presentation.sourceLabel,
                threadPhrase: presentation.detail,
                threadLines: [{
                    speakerLabel: presentation.sourceLabel,
                    phrase: presentation.detail,
                    timeLabel: time
                }],
                pairModeLabel: presentation.pairModeLabel,
                pairTextureLabel: presentation.pairTextureLabel
            };
        });
        const groupedTalkEntries = this.groupTalkFeedEntries(talkEntries);
        const learnEntries = filtered.slice(-limit).flatMap(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit'
            });
            const relevantResidues = (entry.residues || []).filter(residue => {
                if (!targetId) return true;
                if (entry.sourceId === targetId) return true;
                return residue?.recipientId === targetId || residue?.partnerId === targetId;
            });
            const focusResidue = relevantResidues[0] || (entry.residues || [])[0] || null;
            const presentation = this.buildDialogueFeedPresentation(entry, focusResidue);
            return this.buildDialogueLearnFeedEntries(entry, time, presentation, relevantResidues);
        });

        return [...groupedTalkEntries, ...learnEntries]
            .sort((left, right) => (left.timestamp || 0) - (right.timestamp || 0))
            .slice(-limit);
    }

    drawSignalIndicator(graphics, entity, alpha = 255) {
        if (gameConfig?.presentation?.renderCommunicationIndicators === false) {
            return;
        }
        const active = entity?.lifeSim?.communication?.activeSignal;
        if (!active) return;

        const remaining = Math.max(0, (active.expiresAtSeconds ?? 0) - this.simulationClockSeconds);
        if (remaining <= 0) return;

        const fade = Math.min(1, remaining / 1.2);
        const bubbleAlpha = Math.min(220, alpha * 0.6 * fade);
        const ringAlpha = Math.min(110, alpha * 0.3 * fade);
        const yOffset = -24;

        graphics.push();
        graphics.noStroke();
        graphics.fill(10, 14, 22, bubbleAlpha);
        graphics.ellipse(0, yOffset, 34, 18);
        graphics.fill(255, 255, 255, Math.min(255, bubbleAlpha + 30));
        graphics.textAlign(CENTER, CENTER);
        graphics.textSize(8);
        graphics.text(active.indicatorGlyph || '\u2022', 0, yOffset + 1);

        graphics.noFill();
        graphics.stroke(255, 255, 255, ringAlpha);
        graphics.strokeWeight(1.5);
        const pulse = 20 + (Math.sin(frameCount * 0.12) * 3);
        graphics.ellipse(0, 0, pulse, pulse * 0.7);
        graphics.pop();
    }

    serializeDurableState() {
        return {
            simulationClockSeconds: this.simulationClockSeconds,
            history: JSON.parse(JSON.stringify(this.history.slice(-80))),
            dialogueHistory: JSON.parse(JSON.stringify(this.dialogueHistory.slice(-80))),
            activeSignals: Array.from(this.activeSignals.values()).map(signal => JSON.parse(JSON.stringify(signal)))
        };
    }

    deserializeDurableState(serialized = {}) {
        this.simulationClockSeconds = serialized?.simulationClockSeconds || 0;
        this.history = Array.isArray(serialized?.history) ? JSON.parse(JSON.stringify(serialized.history)) : [];
        this.dialogueHistory = Array.isArray(serialized?.dialogueHistory) ? JSON.parse(JSON.stringify(serialized.dialogueHistory)) : [];
        this.activeSignals.clear();
        for (const signal of serialized?.activeSignals || []) {
            if (!signal?.sourceId) continue;
            this.activeSignals.set(signal.sourceId, JSON.parse(JSON.stringify(signal)));
            const entity = this.getEntityById(signal.sourceId);
            if (entity?.lifeSim?.communication) {
                entity.lifeSim.communication.activeSignal = {
                    signalId: signal.id,
                    signalType: signal.signalType,
                    intent: signal.intent,
                    phrase: signal.phrase,
                    indicator: signal.indicator,
                    indicatorGlyph: signal.indicatorGlyph,
                    intensity: signal.intensity,
                    expiresAtSeconds: signal.expiresAtSeconds,
                    zoneId: signal.sourceZoneId
                };
            }
        }
        this.refreshIdentityLabels();
    }
}

const communicationSystem = new CommunicationSystem();
