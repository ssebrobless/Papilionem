// SR1 - Global Workspace System
//
// Per-entity attention buffer with salience-gated arbitration. Implements a
// minimal Global Workspace Theory broadcast loop on top of the existing
// eventBus, scoped to each butterfly (and caterpillar) rather than as a
// single global stage.
//
// Phase contract (SR1 - observe-only):
//   - Modules may submit candidate broadcasts via workspaceSystem.submit(id, candidate).
//   - The system also auto-seeds candidates each tick from observable lifeSim
//     and communication state (seedCandidatesFromObservables).
//   - Each tick the workspace arbitrates and writes a top-k broadcast queue
//     onto its own runtimeState. No downstream module reads broadcastQueue
//     yet -> no behavior change. Determinism preserved.
//   - Persisted save fields added: none (see docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md).
//
// Determinism:
//   - Arbitration is sort by salience DESC then sequence ASC. Sequence is a
//     monotonic per-agent counter on submit. Two seeded runs produce identical
//     broadcast queues.
//
// Ownership rules (per docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md):
//   - workspaceSystem never writes lifeSim fields, never mutates entities,
//     never owns durable truth. broadcastQueue is ephemeral per-tick state.
class WorkspaceSystem {
    constructor() {
        this.initialized = false;
        this.runtimeState = new Map();
        this.frameCounters = {
            broadcasts: 0,
            candidates: 0,
            agentsWithBroadcast: 0,
            lastUpdateFrame: -1
        };
    }

    initialize() {
        this.initialized = true;
        this.attachEventListeners();
    }

    reset() {
        this.runtimeState.clear();
        this.frameCounters.broadcasts = 0;
        this.frameCounters.candidates = 0;
        this.frameCounters.agentsWithBroadcast = 0;
        this.frameCounters.lastUpdateFrame = -1;
    }

    getConfig() {
        const fromGameConfig = typeof gameConfig !== 'undefined'
            ? gameConfig?.cognition?.workspace
            : null;
        return Object.assign({
            enabled: true,
            attentionDepth: 4,
            candidateCap: 16,
            broadcastTtlFrames: 90,
            seedFromObservables: true,
            arbitrationMode: 'top-salience'
        }, fromGameConfig || {});
    }

    isEnabled() {
        return !!this.getConfig().enabled;
    }

    ensureState(entityId) {
        if (!this.runtimeState.has(entityId)) {
            this.runtimeState.set(entityId, {
                broadcastQueue: [],
                pendingCandidates: [],
                lastBroadcastTick: 0,
                totalBroadcasts: 0,
                totalCandidates: 0
            });
        }
        return this.runtimeState.get(entityId);
    }

    submit(entityId, candidate) {
        if (!this.isEnabled()) return false;
        if (!entityId || !candidate) return false;
        const config = this.getConfig();
        const state = this.ensureState(entityId);
        if (state.pendingCandidates.length >= (config.candidateCap || 16)) return false;
        const currentFrame = (typeof gameCore !== 'undefined' && gameCore?.getCurrentFrame)
            ? gameCore.getCurrentFrame()
            : 0;
        const salienceRaw = Number(candidate.salience);
        const salience = Number.isFinite(salienceRaw) ? Math.max(0, Math.min(1, salienceRaw)) : 0;
        const ttl = Number.isFinite(candidate.expiresAtFrame)
            ? candidate.expiresAtFrame
            : currentFrame + (config.broadcastTtlFrames || 90);
        const sequence = state.totalCandidates;
        state.pendingCandidates.push({
            sourceModule: String(candidate.sourceModule || 'unknown'),
            content: this.normalizeContent(candidate.content),
            salience,
            expiresAtFrame: ttl,
            submittedAtFrame: currentFrame,
            sequence
        });
        state.totalCandidates += 1;
        return true;
    }

    normalizeContent(content) {
        if (content == null) return { kind: 'none' };
        if (typeof content === 'string') return { kind: 'text', label: content };
        if (typeof content === 'object') {
            const kind = typeof content.kind === 'string' ? content.kind : 'event';
            const label = typeof content.label === 'string' ? content.label : null;
            const out = { kind };
            if (label) out.label = label;
            return out;
        }
        return { kind: 'text', label: String(content) };
    }

    update(gameState, deltaSeconds, opts = {}) {
        this.frameCounters.broadcasts = 0;
        this.frameCounters.candidates = 0;
        this.frameCounters.agentsWithBroadcast = 0;
        const config = this.getConfig();
        if (!config.enabled) {
            for (const state of this.runtimeState.values()) {
                state.pendingCandidates.length = 0;
                state.broadcastQueue.length = 0;
            }
            this.frameCounters.lastUpdateFrame = opts.currentFrame ?? this.frameCounters.lastUpdateFrame;
            return { enabled: 0, broadcasts: 0, candidates: 0, agents: 0 };
        }

        const currentFrame = opts.currentFrame
            ?? (typeof gameCore !== 'undefined' && gameCore?.getCurrentFrame ? gameCore.getCurrentFrame() : 0);
        const attentionDepth = Math.max(1, Math.min(8, Math.round(config.attentionDepth || 4)));

        if (config.seedFromObservables !== false) {
            this.seedCandidatesFromObservables(gameState, { currentFrame });
        }

        const butterflies = gameState?.butterflies || [];
        const caterpillars = gameState?.caterpillars || [];
        const entities = butterflies.concat(caterpillars);

        if (this.runtimeState.size && entities.length) {
            const alive = new Set(entities.map(entity => entity?.id).filter(Boolean));
            for (const id of Array.from(this.runtimeState.keys())) {
                if (!alive.has(id)) this.runtimeState.delete(id);
            }
        }

        for (const entity of entities) {
            if (!entity?.id) continue;
            const state = this.ensureState(entity.id);
            this.frameCounters.candidates += state.pendingCandidates.length;
            const fresh = state.pendingCandidates.filter(candidate => candidate.expiresAtFrame > currentFrame);
            fresh.sort((a, b) => {
                if (b.salience !== a.salience) return b.salience - a.salience;
                return a.sequence - b.sequence;
            });
            const broadcast = fresh.slice(0, attentionDepth).map(candidate => ({
                sourceModule: candidate.sourceModule,
                content: candidate.content,
                salience: candidate.salience,
                submittedAtFrame: candidate.submittedAtFrame,
                broadcastAtFrame: currentFrame,
                sequence: candidate.sequence
            }));
            state.broadcastQueue = broadcast;
            state.lastBroadcastTick = currentFrame;
            state.totalBroadcasts += broadcast.length;
            state.pendingCandidates.length = 0;
            this.frameCounters.broadcasts += broadcast.length;
            if (broadcast.length) this.frameCounters.agentsWithBroadcast += 1;
        }
        this.frameCounters.lastUpdateFrame = currentFrame;
        return {
            enabled: 1,
            broadcasts: this.frameCounters.broadcasts,
            candidates: this.frameCounters.candidates,
            agents: this.frameCounters.agentsWithBroadcast,
            attentionDepth,
            entityCount: entities.length
        };
    }

    seedCandidatesFromObservables(gameState, opts = {}) {
        const config = this.getConfig();
        if (!config.enabled || config.seedFromObservables === false) return 0;
        const currentFrame = opts.currentFrame
            ?? (typeof gameCore !== 'undefined' && gameCore?.getCurrentFrame ? gameCore.getCurrentFrame() : 0);
        const ttl = config.broadcastTtlFrames || 90;
        let seeded = 0;
        const butterflies = gameState?.butterflies || [];
        for (const entity of butterflies) {
            const lifeSim = entity?.lifeSim;
            if (!lifeSim) continue;

            const strongest = lifeSim.derived?.strongestFeeling || null;
            if (strongest && strongest !== 'steady') {
                const feelings = lifeSim.derived?.feelings || lifeSim.feelings || {};
                const intensity = Number(feelings[strongest]) || 0.3;
                this.submit(entity.id, {
                    sourceModule: 'lifeSim.feeling',
                    content: { kind: 'feeling', label: strongest },
                    salience: Math.max(0.15, Math.min(1, intensity)),
                    expiresAtFrame: currentFrame + ttl
                });
                seeded += 1;
            }

            const dominantDrive = lifeSim.derived?.dominantDrive || null;
            if (dominantDrive) {
                const drives = lifeSim.drives || {};
                const intensity = Number(drives[dominantDrive]) || 0.2;
                this.submit(entity.id, {
                    sourceModule: 'lifeSim.drive',
                    content: { kind: 'drive', label: dominantDrive },
                    salience: Math.max(0.1, Math.min(1, intensity * 0.85)),
                    expiresAtFrame: currentFrame + ttl
                });
                seeded += 1;
            }

            const activeContext = lifeSim.social?.activeContext || null;
            if (activeContext && activeContext !== 'wandering') {
                this.submit(entity.id, {
                    sourceModule: 'lifeSim.social',
                    content: { kind: 'social', label: activeContext },
                    salience: 0.55,
                    expiresAtFrame: currentFrame + ttl
                });
                seeded += 1;
            }

            // Communication signals are sourced via event subscription
            // (eventSeededCount) rather than polling getCommunicationSummary
            // per butterfly per tick - polling the summary is ~0.4ms per call
            // and trips the H5 calm-garden update budget.
        }
        return seeded;
    }

    // Event-driven seeding: subscribe once on initialize(). Each fired event
    // submits a candidate to the relevant butterfly's pending queue. This
    // avoids per-tick polling of heavy summaries.
    attachEventListeners() {
        if (this.eventListenersAttached) return;
        if (typeof eventBus === 'undefined' || typeof GameEvents === 'undefined') return;
        eventBus.on(GameEvents.DIALOGUE_SPOKEN, data => {
            if (!this.isEnabled()) return;
            const speakerId = data?.speakerId || data?.sourceId || null;
            const heardBy = data?.heardByIds || data?.recipientIds || [];
            const frame = (typeof gameCore !== 'undefined' && gameCore?.getCurrentFrame)
                ? gameCore.getCurrentFrame() : 0;
            const ttl = this.getConfig().broadcastTtlFrames || 90;
            if (speakerId) {
                this.submit(speakerId, {
                    sourceModule: 'communication.spoken',
                    content: { kind: 'spoken', label: 'self-spoke' },
                    salience: 0.35,
                    expiresAtFrame: frame + ttl
                });
            }
            for (const listenerId of heardBy) {
                this.submit(listenerId, {
                    sourceModule: 'communication.heard',
                    content: { kind: 'heard', label: 'heard-dialogue' },
                    salience: 0.45,
                    expiresAtFrame: frame + ttl
                });
            }
        });
        eventBus.on(GameEvents.BUTTERFLY_SCARED, data => {
            if (!this.isEnabled()) return;
            const id = data?.entity?.id || data?.butterfly?.id || data?.id || null;
            if (!id) return;
            const frame = (typeof gameCore !== 'undefined' && gameCore?.getCurrentFrame)
                ? gameCore.getCurrentFrame() : 0;
            this.submit(id, {
                sourceModule: 'lifeSim.scared',
                content: { kind: 'startle', label: 'scared' },
                salience: 0.8,
                expiresAtFrame: frame + (this.getConfig().broadcastTtlFrames || 90)
            });
        });
        this.eventListenersAttached = true;
    }

    getBroadcast(entityId) {
        const state = this.runtimeState.get(entityId);
        if (!state) return [];
        return state.broadcastQueue;
    }

    getEntitySummary(entityId) {
        if (!this.isEnabled()) return null;
        const state = this.runtimeState.get(entityId);
        if (!state) return null;
        const queue = state.broadcastQueue.map(item => ({
            sourceModule: item.sourceModule,
            salience: Math.round((item.salience || 0) * 100) / 100,
            label: item.content?.label || item.content?.kind || 'event',
            kind: item.content?.kind || 'event',
            broadcastAtFrame: item.broadcastAtFrame
        }));
        return {
            attentionDepth: this.getConfig().attentionDepth,
            broadcastCount: queue.length,
            broadcastQueue: queue,
            totalBroadcasts: state.totalBroadcasts,
            totalCandidates: state.totalCandidates,
            lastBroadcastTick: state.lastBroadcastTick
        };
    }

    getRuntimeSummary() {
        const config = this.getConfig();
        return {
            enabled: !!config.enabled,
            attentionDepth: config.attentionDepth,
            seedFromObservables: config.seedFromObservables !== false,
            broadcastTtlFrames: config.broadcastTtlFrames,
            arbitrationMode: config.arbitrationMode,
            lastUpdateFrame: this.frameCounters.lastUpdateFrame,
            lastBroadcasts: this.frameCounters.broadcasts,
            lastCandidates: this.frameCounters.candidates,
            lastAgentsWithBroadcast: this.frameCounters.agentsWithBroadcast,
            trackedEntityCount: this.runtimeState.size
        };
    }
}

const workspaceSystem = new WorkspaceSystem();
