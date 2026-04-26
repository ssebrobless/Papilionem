const workerState = {
    modelVersionId: null,
    policies: null
};

function sigmoid(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0.5;
    return 1 / (1 + Math.exp(-numeric));
}

function clamp01(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    if (numeric <= 0) return 0;
    if (numeric >= 1) return 1;
    return numeric;
}

function getTopPolicyEntries(scores = {}, count = 3) {
    return Object.entries(scores)
        .map(([label, value]) => ({ label, value: clamp01(value) }))
        .sort((left, right) => right.value - left.value)
        .slice(0, count);
}

function buildConfidence(topEntries = []) {
    const best = topEntries[0]?.value || 0;
    const second = topEntries[1]?.value || 0;
    const margin = clamp01(best - second);
    const normalized = clamp01(best * 0.68 + margin * 0.32);
    return {
        score: Math.round(normalized * 100),
        band: normalized >= 0.72 ? 'high' : normalized >= 0.46 ? 'medium' : 'low',
        uncertainty: normalized < 0.38
    };
}

function buildPolicyTrace(policyName, scores, source = 'ml', alternativeCount = 2) {
    const topEntries = getTopPolicyEntries(scores, Math.max(3, alternativeCount + 1));
    const chosen = topEntries[0] || { label: 'none', value: 0 };
    const alternatives = topEntries.slice(1, alternativeCount + 1);
    return {
        policy: policyName,
        source,
        chosen: chosen.label,
        chosenScore: Math.round((chosen.value || 0) * 100),
        confidence: buildConfidence(topEntries),
        alternatives: alternatives.map(entry => ({
            label: entry.label,
            score: Math.round((entry.value || 0) * 100)
        })),
        scores: Object.fromEntries(Object.entries(scores || {}).map(([label, value]) => [label, Math.round(clamp01(value) * 100)]))
    };
}

function scoreLinearPolicy(policyDefinition = {}, flatFeatures = {}) {
    const labels = Array.isArray(policyDefinition.labels) ? policyDefinition.labels : [];
    const bias = policyDefinition.bias || {};
    const weights = policyDefinition.weights || {};
    const scores = {};

    for (const label of labels) {
        let rawScore = Number(bias[label] || 0);
        const labelWeights = weights[label] || {};
        for (const [featureName, weight] of Object.entries(labelWeights)) {
            rawScore += (flatFeatures[featureName] || 0) * Number(weight || 0);
        }
        scores[label] = sigmoid(rawScore);
    }

    return scores;
}

function buildModelPolicies(policies = {}, flatFeatures = {}, battleMode = false) {
    const modelPolicies = {};
    if (!battleMode && policies.actionFamily) {
        modelPolicies.actionFamily = scoreLinearPolicy(policies.actionFamily, flatFeatures);
    }
    if (!battleMode && policies.targetPreference) {
        modelPolicies.targetPreference = scoreLinearPolicy(policies.targetPreference, flatFeatures);
    }
    if (!battleMode && policies.signalChoice) {
        modelPolicies.signalChoice = scoreLinearPolicy(policies.signalChoice, flatFeatures);
    }
    if (!battleMode && policies.riskPosture) {
        modelPolicies.riskPosture = scoreLinearPolicy(policies.riskPosture, flatFeatures);
    }
    if (policies.autobattlePosture) {
        modelPolicies.autobattlePosture = scoreLinearPolicy(policies.autobattlePosture, flatFeatures);
    }
    return Object.keys(modelPolicies).length ? modelPolicies : null;
}

function buildModelPolicyTraces(modelPolicies = null, alternativeCount = 2) {
    if (!modelPolicies || typeof modelPolicies !== 'object') return null;
    const traces = {};
    for (const [policyName, scores] of Object.entries(modelPolicies)) {
        if (!scores || typeof scores !== 'object') continue;
        traces[policyName] = buildPolicyTrace(policyName, scores, 'ml', alternativeCount);
    }
    return Object.keys(traces).length ? traces : null;
}

self.onmessage = (event) => {
    const message = event?.data || {};
    const seq = Number(message?.seq);

    try {
        if (message.kind === 'ml.loadArtifact') {
            workerState.modelVersionId = message?.payload?.modelVersionId || null;
            workerState.policies = message?.payload?.policies || null;
            self.postMessage({
                seq,
                ok: true,
                payload: {
                    modelVersionId: workerState.modelVersionId
                }
            });
            return;
        }

        if (message.kind === 'ml.infer') {
            const policies = message?.payload?.policies || workerState.policies;
            if (!policies) {
                throw new Error('ml policies unavailable');
            }
            const modelPolicies = buildModelPolicies(
                policies,
                message?.payload?.flatFeatures || {},
                !!message?.payload?.battleMode
            );
            self.postMessage({
                seq,
                ok: true,
                payload: {
                    modelVersionId: workerState.modelVersionId,
                    modelPolicies,
                    modelTraces: buildModelPolicyTraces(
                        modelPolicies,
                        Math.max(1, Math.round(message?.payload?.alternativeCount || 2))
                    )
                }
            });
            return;
        }

        if (message.kind === 'ml.infer.batch') {
            const policies = message?.payload?.policies || workerState.policies;
            if (!policies) {
                throw new Error('ml policies unavailable');
            }
            const items = Array.isArray(message?.payload?.items) ? message.payload.items : [];
            self.postMessage({
                seq,
                ok: true,
                payload: {
                    modelVersionId: workerState.modelVersionId,
                    items: items.map((item) => ({
                        entityId: item?.entityId || null,
                        ...(function () {
                            const modelPolicies = buildModelPolicies(
                                policies,
                                item?.flatFeatures || {},
                                !!item?.battleMode
                            );
                            return {
                                modelPolicies,
                                modelTraces: buildModelPolicyTraces(
                                    modelPolicies,
                                    Math.max(1, Math.round(item?.alternativeCount || message?.payload?.alternativeCount || 2))
                                )
                            };
                        })()
                    }))
                }
            });
            return;
        }

        throw new Error(`unsupported worker kind: ${message?.kind || 'unknown'}`);
    } catch (error) {
        self.postMessage({
            seq,
            ok: false,
            error: String(error?.message || error)
        });
    }
};
