#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_zone_lookup_coverage_audit');
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-world-rendermode'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function ensureServer(report) {
  const reachable = await fetch(URL).then(() => true).catch(() => false);
  if (reachable) {
    report.server = { reused: true, pid: null };
    return;
  }
  const { spawn } = require('child_process');
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, detached: true, stdio: 'ignore' });
  child.unref();
  report.server = { reused: false, pid: child.pid };
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ok = await fetch(URL).then(() => true).catch(() => false);
    if (ok) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Server did not become reachable in time');
}

async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, { timeout: 30000 });
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);
  const report = {
    startedAt: new Date().toISOString(),
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    phases: []
  };

  await ensureServer(report);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', error => report.pageErrors.push(String(error)));
  page.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push(msg.text());
  });

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await page.evaluate((keys) => {
      keys.forEach(key => window.localStorage.removeItem(key));
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    }, STORAGE_KEYS);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await page.keyboard.press('Space').catch(() => {});
    await page.evaluate(async () => {
      await gameCore.resetGame(true);
      eventBus.clearHistory?.();
      gameCore.telemetrySystem?.clearRuntimeIssues?.();
    });

    const details = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const zoneId = (gameCore.getZoneIds?.() || []).find(id => id !== 'sun-court') || state.focusedZoneId;
      gameCore.focusZone(zoneId);
      const butterfly = state.butterflies[0];
      const board = zoneSystem.getBoardConfigForZone(zoneId);
      const path = [];
      const mismatches = [];
      const legacyBefore = gameCore.telemetrySystem?.getRuntimeIssues?.()
        ?.filter(issue => issue.kind === 'legacy-zone-grid-lookup').length || 0;

      for (let frame = 0; frame < 120; frame += 1) {
        const u = 1 + ((board.widthUnits - 2) * frame / 119);
        const v = 2 + ((board.depthUnits - 4) * frame / 119);
        const boardPos = { zoneId, u, v, h: 0 };
        const screen = renderManager.boardToScreen(boardPos);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.boardPos = boardPos;
        butterfly.x = screen.x;
        butterfly.y = screen.y - (butterfly.shadowOffset || 0);
        butterfly.syncDebugGridPos?.();
        behaviorSystem.registerEntity?.(butterfly);
        behaviorSystem.assignAction?.(butterfly, 'wander', 'zone-lookup-audit', null, { reason: 'zone-lookup-audit' });

        const marker = gameCore.spawnFlowerAt(zoneId, screen.x, screen.y, {
          exactPoint: true,
          ignoreZoneFlowerCap: true,
          allowFlowerOverlap: true,
          persistentUntilConsumed: true,
          resourceOrigin: 'zone-lookup-audit'
        });
        objectSystem.registerObject(marker, { type: 'flower', subtype: 'zone-lookup-audit' });
        objectSystem.syncEntityProfile(marker);

        const objectZoneId = objectSystem.getObjectState(marker.id)?.zoneId || null;
        const behaviorZoneId = behaviorSystem.getRuntime(butterfly.id)?.currentZoneId || null;
        const inspectState = gameUI.buildInspectDetailDomState?.(butterfly, state) || null;
        const inspectZoneLine = inspectState?.heroLines?.find(line => /Open Land|Training Grounds|Court|Cloister|Hollow|Heart/i.test(line)) || '';
        const helperZoneId = zoneSystem.getEntityZone(butterfly)?.id || null;
        const pass = objectZoneId === zoneId && behaviorZoneId === zoneId && helperZoneId === zoneId && inspectZoneLine.length > 0;
        if (!pass) {
          mismatches.push({ frame, objectZoneId, behaviorZoneId, helperZoneId, inspectZoneLine, expected: zoneId });
        }
        path.push({ frame, u, v, objectZoneId, behaviorZoneId, helperZoneId });
        gameCore.removeFlowerFromGame?.(marker, 'zone-lookup-audit-cleanup');
      }

      const legacyAfter = gameCore.telemetrySystem?.getRuntimeIssues?.()
        ?.filter(issue => issue.kind === 'legacy-zone-grid-lookup').length || 0;
      return {
        zoneId,
        sampledFrames: path.length,
        mismatches,
        legacyZoneGridLookupDelta: legacyAfter - legacyBefore,
        pathSample: path.slice(0, 5),
        pass: mismatches.length === 0 && (legacyAfter - legacyBefore) === 0
      };
    });

    report.phases.push({ name: 'zone-lookup-coverage', pass: !!details.pass, details });
    report.screenshot = path.join(outputDir, 'zone-lookup-coverage.png');
    await page.screenshot({ path: report.screenshot, fullPage: true });
    report.overall = report.phases.every(phase => phase.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0 ? 'pass' : 'fail';
  } finally {
    await browser.close();
  }

  report.finishedAt = new Date().toISOString();
  const reportPath = path.join(outputDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ overall: report.overall, reportPath, phases: report.phases }, null, 2));
  process.exit(report.overall === 'pass' ? 0 : 1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
