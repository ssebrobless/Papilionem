#!/usr/bin/env node
// Probe P0.c: teleport/scatter refreshes derived spatial, movement, physics, and proximity state.

const {
    ensureServer,
    launchHarness,
    closeHarness,
    applySeed,
    forceZoneFocus,
    spawnTo,
    scatterButterflies
} = require('../../../scripts/harness-core');

function assertClose(label, actual, expected, epsilon = 0.001) {
    if (Math.abs((actual || 0) - (expected || 0)) > epsilon) {
        throw new Error(`${label} expected ${expected}, got ${actual}`);
    }
}

async function primeStaleState(page) {
    return page.evaluate(() => {
        const core = typeof gameCore !== 'undefined' ? gameCore : null;
        const zoneId = core?.getFocusedZoneId?.() || 'ivy-cloister';
        const butterflies = core?.getButterfliesInZone?.(zoneId) || [];
        const first = butterflies[0] || null;
        if (!core || !first) return null;

        core.gameState.currentFrame = 0;
        const preQueryCount = core.countNearbyButterflies(zoneId, { x: first.x || 0, y: first.y || 0 }, 220, first.id);
        const statsAfterPrime = core.butterflyStore?.debugStats?.() || null;
        const staleGrid = {
            x: (first.gridPos?.x || 0) + 50,
            y: (first.gridPos?.y || 0) + 50
        };
        if (first.movement?.setTarget) {
            first.movement.setTarget(staleGrid.x, staleGrid.y, 'goal', 10, 0);
            first.movement.smoothFollowTarget = { ...staleGrid };
        }
        const physics = core.physicsSystem?.getEntityState?.(first.id)
            || core.physicsSystem?.registerEntity?.(first, 'butterfly')
            || null;
        if (physics) {
            physics.velocity = { x: 7, y: -3 };
            physics.intent = { x: 7, y: -3 };
            physics.impulse = { x: 5, y: -4, frames: 9, source: 'probe-stale' };
            physics.motion = physics.motion || { previous: {}, desired: {} };
            physics.motion.desired = { x: (first.x || 0) + 99, y: (first.y || 0) + 99 };
        }

        return {
            zoneId,
            firstId: first.id,
            preQueryCount,
            currentFrame: core.getCurrentFrame?.() ?? null,
            p5FrameCount: typeof frameCount === 'number' ? frameCount : null,
            statsAfterPrime,
            staleGrid,
            stalePhysics: physics ? {
                velocity: physics.velocity,
                intent: physics.intent,
                impulse: physics.impulse,
                desired: physics.motion?.desired
            } : null
        };
    });
}

async function readAfterScatter(page, firstId, zoneId) {
    return page.evaluate(({ id, zone }) => {
        const core = typeof gameCore !== 'undefined' ? gameCore : null;
        const first = (core?.gameState?.butterflies || []).find(entry => entry?.id === id) || null;
        if (!core || !first) return null;

        const expectedGrid = gridManager?.screenToIso?.(
            first.x || 0,
            (first.y || 0) + (first.shadowOffset || 0)
        ) || null;
        const statsBeforeQuery = core.butterflyStore?.debugStats?.() || null;
        const postQueryCount = core.countNearbyButterflies(zone, { x: first.x || 0, y: first.y || 0 }, 220, first.id);
        const statsAfterQuery = core.butterflyStore?.debugStats?.() || null;
        const physics = core.physicsSystem?.getEntityState?.(first.id) || first.physics || null;

        return {
            id: first.id,
            zoneId: core.getEntityZoneId?.(first, null) || first.currentZoneId || null,
            x: first.x,
            y: first.y,
            currentFrame: core.getCurrentFrame?.() ?? null,
            p5FrameCount: typeof frameCount === 'number' ? frameCount : null,
            gridPos: first.gridPos || null,
            expectedGrid,
            movement: first.movement ? {
                target: first.movement.target || null,
                smoothFollowTarget: first.movement.smoothFollowTarget || null,
                targetType: first.movement.targetType || null,
                targetPriority: first.movement.targetPriority || 0
            } : null,
            physics: physics ? {
                position: physics.position || null,
                velocity: physics.velocity || null,
                intent: physics.intent || null,
                impulse: physics.impulse || null,
                desired: physics.motion?.desired || null,
                previous: physics.motion?.previous || null,
                movedFrame: physics.motion?.movedFrame ?? null,
                source: physics.motion?.source || null
            } : null,
            postQueryCount,
            statsBeforeQuery,
            statsAfterQuery
        };
    }, { id: firstId, zone: zoneId });
}

async function main() {
    const ctx = await ensureServer();
    const session = await launchHarness({ baseUrl: ctx.baseUrl, headless: true });
    try {
        await applySeed(session.page, 515151);
        await forceZoneFocus(session.page, 'ivy-cloister', { mode: 'focused-garden' });
        await spawnTo(session.page, 110, { zoneId: 'ivy-cloister' });

        const before = await primeStaleState(session.page);
        if (!before?.firstId) throw new Error('failed to prime butterfly state');
        const scatter = await scatterButterflies(session.page, { zoneId: before.zoneId });
        const after = await readAfterScatter(session.page, before.firstId, before.zoneId);
        if (!scatter?.applied || scatter.count < 1) {
            throw new Error(`expected scatter to move butterflies, got ${JSON.stringify(scatter)}`);
        }
        if (!after?.expectedGrid || !after?.gridPos) {
            throw new Error('expected scatter hook to refresh gridPos');
        }

        assertClose('gridPos.x', after.gridPos.x, after.expectedGrid.x);
        assertClose('gridPos.y', after.gridPos.y, after.expectedGrid.y);
        assertClose('movement.target.x', after.movement?.target?.x, after.expectedGrid.x);
        assertClose('movement.target.y', after.movement?.target?.y, after.expectedGrid.y);
        assertClose('movement.smoothFollowTarget.x', after.movement?.smoothFollowTarget?.x, after.expectedGrid.x);
        assertClose('movement.smoothFollowTarget.y', after.movement?.smoothFollowTarget?.y, after.expectedGrid.y);
        if (after.movement?.targetType !== null || after.movement?.targetPriority !== 0) {
            throw new Error(`expected movement target to be cleared, got ${JSON.stringify(after.movement)}`);
        }
        assertClose('physics.velocity.x', after.physics?.velocity?.x, 0);
        assertClose('physics.velocity.y', after.physics?.velocity?.y, 0);
        assertClose('physics.intent.x', after.physics?.intent?.x, 0);
        assertClose('physics.intent.y', after.physics?.intent?.y, 0);
        assertClose('physics.impulse.x', after.physics?.impulse?.x, 0);
        assertClose('physics.impulse.y', after.physics?.impulse?.y, 0);
        if ((after.physics?.impulse?.frames || 0) !== 0) {
            throw new Error(`expected physics impulse frames reset, got ${JSON.stringify(after.physics?.impulse)}`);
        }
        const rebuildsBefore = before.statsAfterPrime?.gridRebuilds || 0;
        const rebuildsAfter = after.statsAfterQuery?.gridRebuilds || 0;
        if (!(rebuildsAfter > rebuildsBefore)) {
            throw new Error(`expected proximity grid rebuild after same-frame scatter, got ${rebuildsBefore} -> ${rebuildsAfter}`);
        }
        if (before.currentFrame !== after.currentFrame) {
            throw new Error(`expected scatter to avoid ticking frame clock, got ${before.currentFrame} -> ${after.currentFrame}`);
        }

        console.log(JSON.stringify({
            ok: true,
            probe: 'p0c-scatter-teleport-state',
            server: ctx.baseUrl,
            scatter,
            before,
            after
        }, null, 2));
    } finally {
        await closeHarness(session, ctx);
    }
}

main().catch(error => {
    console.error('[probe-scatter-teleport-state] FAILED:', error);
    process.exit(1);
});
