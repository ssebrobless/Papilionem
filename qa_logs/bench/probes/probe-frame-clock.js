#!/usr/bin/env node
// Probe P0.a: gameState.currentFrame advances exactly once per simulation tick.

const { chromium } = require('playwright');
const {
    ensureServer,
    launchHarness,
    closeHarness
} = require('../../../scripts/harness-core');

async function readCurrentFrame(page) {
    return page.evaluate(() => {
        const core = typeof gameCore !== 'undefined' ? gameCore : null;
        return {
            currentFrame: core?.getCurrentFrame?.() ?? core?.gameState?.currentFrame ?? null,
            rawCurrentFrame: core?.gameState?.currentFrame ?? null,
            p5FrameCount: typeof frameCount === 'number' ? frameCount : null,
            initialized: !!core?.gameState?.initialized
        };
    });
}

async function probeHarnessPath(ctx) {
    const session = await launchHarness({ baseUrl: ctx.baseUrl, headless: true });
    try {
        await session.page.evaluate(() => {
            gameCore.gameState.currentFrame = 0;
        });
        const before = await readCurrentFrame(session.page);
        const tick = await session.page.evaluate(() => window.papilionemHarness.tick(100));
        const after = await readCurrentFrame(session.page);
        const delta = after.currentFrame - before.currentFrame;
        if (delta !== 100 || after.currentFrame !== 100) {
            throw new Error(`noLoop harness path expected currentFrame 100, got ${after.currentFrame} (delta ${delta})`);
        }
        return { before, after, tick };
    } finally {
        await closeHarness(session, ctx);
    }
}

async function probeLiveDrawPath(ctx) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    try {
        await page.goto(ctx.baseUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(
            () => typeof gameCore !== 'undefined' && gameCore?.gameState?.initialized === true,
            null,
            { timeout: 45000 }
        );
        await page.evaluate(() => {
            showTitleScreen = false;
            titleFading = false;
            if (typeof noLoop === 'function') noLoop();
        });
        await page.waitForTimeout(50);
        await page.evaluate(() => {
            gameCore.gameState.currentFrame = 0;
        });
        const before = await readCurrentFrame(page);
        await page.evaluate(() => {
            for (let i = 0; i < 100; i += 1) draw();
        });
        const after = await readCurrentFrame(page);
        const delta = after.currentFrame - before.currentFrame;
        if (delta !== 100 || after.currentFrame !== 100) {
            throw new Error(`live p5 draw path expected currentFrame 100, got ${after.currentFrame} (delta ${delta})`);
        }
        return { before, after };
    } finally {
        await page.close().catch(() => {});
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
    }
}

async function main() {
    const ctx = await ensureServer();
    const harnessPath = await probeHarnessPath(ctx);
    const liveDrawPath = await probeLiveDrawPath(ctx);
    console.log(JSON.stringify({
        ok: true,
        probe: 'p0a-frame-clock',
        server: ctx.baseUrl,
        harnessPath,
        liveDrawPath
    }, null, 2));
}

main().catch(error => {
    console.error('[probe-frame-clock] FAILED:', error);
    process.exit(1);
});
