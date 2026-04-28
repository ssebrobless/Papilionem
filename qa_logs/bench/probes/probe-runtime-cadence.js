#!/usr/bin/env node
// Probe P0.b: runtime cadence consumers use gameState.currentFrame while p5 frameCount is frozen.

const {
    ensureServer,
    launchHarness,
    closeHarness,
    applySeed,
    forceZoneFocus,
    spawnTo,
    tick
} = require('../../../scripts/harness-core');

async function queryProximity(page) {
    return page.evaluate(() => {
        const core = typeof gameCore !== 'undefined' ? gameCore : null;
        const zoneId = core?.getFocusedZoneId?.() || 'ivy-cloister';
        const butterflies = core?.getButterfliesInZone?.(zoneId) || [];
        const first = butterflies[0] || null;
        if (!core || !first) return null;
        const count = core.countNearbyButterflies(zoneId, { x: first.x || 0, y: first.y || 0 }, 220, first.id);
        return {
            count,
            currentFrame: core.getCurrentFrame?.() ?? core.gameState?.currentFrame ?? null,
            p5FrameCount: typeof frameCount === 'number' ? frameCount : null,
            stats: core.butterflyStore?.debugStats?.() || null
        };
    });
}

async function main() {
    const ctx = await ensureServer();
    const session = await launchHarness({ baseUrl: ctx.baseUrl, headless: true });
    try {
        await applySeed(session.page, 424242);
        await forceZoneFocus(session.page, 'ivy-cloister', { mode: 'focused-garden' });
        await spawnTo(session.page, 110, { zoneId: 'ivy-cloister' });
        await session.page.evaluate(() => {
            gameCore.gameState.currentFrame = 0;
        });

        const first = await queryProximity(session.page);
        await tick(session.page, 1);
        const second = await queryProximity(session.page);
        await tick(session.page, 1);
        const third = await queryProximity(session.page);

        const rebuilds = [
            first?.stats?.gridRebuilds,
            second?.stats?.gridRebuilds,
            third?.stats?.gridRebuilds
        ];
        const frames = [first?.currentFrame, second?.currentFrame, third?.currentFrame];
        const p5Frames = [first?.p5FrameCount, second?.p5FrameCount, third?.p5FrameCount];

        if (!(rebuilds[0] >= 1 && rebuilds[1] > rebuilds[0] && rebuilds[2] > rebuilds[1])) {
            throw new Error(`expected proximity grid rebuilds to advance across currentFrame ticks, got ${rebuilds.join(' -> ')}`);
        }
        if (!(frames[0] === 0 && frames[1] === 1 && frames[2] === 2)) {
            throw new Error(`expected game frames 0 -> 1 -> 2, got ${frames.join(' -> ')}`);
        }
        if (!(p5Frames[0] === p5Frames[1] && p5Frames[1] === p5Frames[2])) {
            throw new Error(`expected p5 frameCount to stay frozen in harness, got ${p5Frames.join(' -> ')}`);
        }

        console.log(JSON.stringify({
            ok: true,
            probe: 'p0b-runtime-cadence',
            server: ctx.baseUrl,
            rebuilds,
            frames,
            p5Frames,
            first,
            second,
            third
        }, null, 2));
    } finally {
        await closeHarness(session, ctx);
    }
}

main().catch(error => {
    console.error('[probe-runtime-cadence] FAILED:', error);
    process.exit(1);
});
