class SelfModelSystem {
    constructor() {
        this.initialized = false;
        this.lastSummary = null;
    }

    initialize() {
        this.initialized = true;
    }

    reset() {
        this.lastSummary = null;
    }

    getConfig() {
        return gameConfig?.cognition?.selfModel || {};
    }

    isEnabled() {
        return this.getConfig().enabled !== false;
    }

    getEntitySummary(entity) {
        const selfModel = entity?.lifeSim?.selfModel || null;
        if (!selfModel) return null;
        return {
            enabled: this.isEnabled(),
            predictedNextEmotion: selfModel.predictedNextEmotion || 'steady',
            divergenceFromActual: Number(selfModel.divergenceFromActual || 0),
            currentSelfAssessment: { ...(selfModel.currentSelfAssessment || {}) },
            perceivedByOthersBelief: { ...(selfModel.perceivedByOthersBelief || {}) },
            initialized: !!selfModel.initialized,
            lastUpdatedTick: Number.isFinite(selfModel.lastUpdatedTick) ? selfModel.lastUpdatedTick : 0
        };
    }

    update(gameState = gameCore?.gameState) {
        this.lastSummary = this.getRuntimeSummary(gameState);
        return this.lastSummary;
    }

    getRuntimeSummary(gameState = gameCore?.gameState) {
        const entities = [
            ...(gameState?.butterflies || []),
            ...(gameState?.caterpillars || [])
        ].filter(entity => entity?.lifeSim);
        const summaries = entities
            .map(entity => this.getEntitySummary(entity))
            .filter(Boolean);
        const divergenceValues = summaries
            .map(summary => summary.divergenceFromActual)
            .filter(value => Number.isFinite(value));
        const meanDivergence = divergenceValues.length
            ? divergenceValues.reduce((sum, value) => sum + value, 0) / divergenceValues.length
            : 0;
        return {
            enabled: this.isEnabled() ? 1 : 0,
            entities: summaries.length,
            initialized: summaries.filter(summary => summary.initialized).length,
            meanDivergence
        };
    }
}

const selfModelSystem = new SelfModelSystem();
