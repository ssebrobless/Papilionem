const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'f3_long_running_save_regression_audit');
const DEFAULT_PORT = 3000;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function buildUrl(port) {
  return `http://127.0.0.1:${port}/`;
}

async function hasSessionRoute(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}api/session-captures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: { sessionId: 'audit-probe', label: 'audit-probe' },
        summary: { durationMs: 1 }
      })
    });
    return response.ok;
  } catch (_error) {
    return false;
  }
}

async function waitForServer(baseUrl) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ok = await fetch(baseUrl).then(() => true).catch(() => false);
    if (ok) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

async function ensureServer(report) {
  const defaultUrl = buildUrl(DEFAULT_PORT);
  const reachable = await fetch(defaultUrl).then(() => true).catch(() => false);
  if (reachable && await hasSessionRoute(defaultUrl)) {
    report.server = { reused: true, pid: null, port: DEFAULT_PORT };
    return defaultUrl;
  }

  const auditPort = reachable ? 3013 : DEFAULT_PORT;
  const auditUrl = buildUrl(auditPort);
  const { spawn } = require('child_process');
  const serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: String(auditPort)
    }
  });
  serverProcess.unref();
  report.server = { reused: false, pid: serverProcess.pid, port: auditPort };

  const becameReachable = await waitForServer(auditUrl);
  if (!becameReachable) {
    throw new Error(`Server did not become reachable in time on port ${auditPort}`);
  }
  if (!await hasSessionRoute(auditUrl)) {
    throw new Error(`Session capture endpoint was not available on port ${auditPort}`);
  }
  return auditUrl;
}

async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, {
    timeout: 30000
  });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1800);
}

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    url: null,
    server: null,
    phases: [],
    pageErrors: [],
    consoleErrors: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let page;

  try {
    const baseUrl = await ensureServer(report);
    report.url = baseUrl;
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await saveShot(page, outputDir, '01-garden');

    const socialSetup = await page.evaluate(() => {
      const serialized = debugUI?.buildAuditPresetState?.('social-routine-web');
      if (!serialized) return { ok: false };
      gameCore.applySerializedState(serialized);
      const state = gameCore.getGameState();
      state.paused = false;
      state.timeScale = 1;
      return {
        ok: true,
        butterflies: state.butterflies.length,
        flowers: state.flowers.length
      };
    });
    if (!socialSetup?.ok) {
      throw new Error('Unable to build or apply social-routine-web preset');
    }
    await page.waitForTimeout(3000);
    await saveShot(page, outputDir, '02-social-web');

    const socialRoundTrip = await page.evaluate(() => {
      const collectSocialSnapshot = () => {
        const state = gameCore.getGameState();
        const butterflies = (state.butterflies || []).map(entity => ({
          id: entity.id,
          displayName: entity.displayName || null,
          personalityType: entity.personalityType || null,
          birthSource: entity.birthSource || null,
          currentZoneId: entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null,
          retainedLessonCount: (entity.lifeSim?.communication?.retainedLessons || []).length,
          recentResidueCount: (entity.lifeSim?.communication?.recentResidues || []).length,
          recentConversationCount: (entity.lifeSim?.communication?.recentConversations || []).length,
          knownNames: Object.keys(entity.lifeSim?.communication?.knownNames || {}).sort(),
          confidence: Math.round((entity.lifeSim?.social?.confidence || 0) * 100),
          belonging: Math.round((entity.lifeSim?.social?.belonging || 0) * 100)
        })).sort((left, right) => left.id.localeCompare(right.id));
        const teaching = teachingSystem?.serializeDurableState?.() || {};
        const communication = communicationSystem?.serializeDurableState?.() || {};
        return {
          butterflies,
          activeLessonKeys: Object.keys(teaching.activeLessons || {}).sort(),
          packetOwners: Object.keys(teaching.packetsByEntityId || {}).sort(),
          dialogueHistoryCount: (communication.dialogueHistory || []).length,
          signalHistoryCount: (communication.history || []).length,
          activeSignalCount: (communication.activeSignals || []).length
        };
      };

      const beforeSerialized = gameCore.serializeGameState();
      const before = collectSocialSnapshot();
      gameCore.saveGameToStorage({ source: 'f3-social-roundtrip' });
      const restored = !!gameCore.loadGameFromStorage();
      const afterSerialized = gameCore.serializeGameState();
      const after = collectSocialSnapshot();
      const mismatches = (gameCore.saveSystem?.compareSerializedDurableState?.(beforeSerialized, afterSerialized) || [])
        .filter(entry => entry.path !== 'meta.serializedAtMs');
      return {
        restored,
        before,
        after,
        mismatchCount: mismatches.length,
        mismatchPreview: mismatches.slice(0, 12),
        snapshotMatches: JSON.stringify(before) === JSON.stringify(after)
      };
    });

    report.phases.push({
      name: 'social-web-roundtrip',
      pass:
        !!socialRoundTrip?.restored
        && socialRoundTrip?.mismatchCount === 0
        && !!socialRoundTrip?.snapshotMatches,
      details: socialRoundTrip
    });

    const lineageSetup = await page.evaluate(() => {
      const serialized = debugUI?.buildAuditPresetState?.('nursery-lineage');
      if (!serialized) return { ok: false };
      gameCore.applySerializedState(serialized);
      const state = gameCore.getGameState();
      state.paused = false;
      state.timeScale = 1;
      return {
        ok: true,
        butterflies: state.butterflies.length,
        flowers: state.flowers.length,
        hybridJournalCount: state.hybridJournal?.length || 0
      };
    });
    if (!lineageSetup?.ok) {
      throw new Error('Unable to build or apply nursery-lineage preset');
    }
    await saveShot(page, outputDir, '03-nursery-lineage');

    const lineageRoundTrip = await page.evaluate(() => {
      const collectLineageSnapshot = () => {
        const state = gameCore.getGameState();
        const progression = progressionManager?.serializeDurableState?.(state) || {};
        return {
          butterflies: (state.butterflies || []).map(entity => ({
            id: entity.id,
            displayName: entity.displayName || null,
            isHybrid: !!entity.isHybrid,
            hybridEntryId: entity.hybridEntryId || null,
            currentZoneId: entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null,
            pregnancyActive: !!entity.pregnancy?.active,
            pregnancyTargetFlowerId: entity.pregnancy?.targetFlower?.id || null
          })).sort((left, right) => left.id.localeCompare(right.id)),
          caterpillars: (state.caterpillars || []).map(entity => ({
            id: entity.id,
            phase: entity.phase || null,
            targetFlowerId: entity.targetFlowerId || null,
            inheritedTraitKeys: Object.keys(entity.lifecycleData?.inheritedTraits || {}).sort()
          })).sort((left, right) => left.id.localeCompare(right.id)),
          hybridJournal: (progression.hybridJournal || []).map(entry => ({
            id: entry.id,
            displayName: entry.displayName || null
          })).sort((left, right) => left.id - right.id),
          nextHybridId: progression.nextHybridId || null,
          pendingOffspringReservations: progression.pendingOffspringReservations || 0
        };
      };

      const beforeSerialized = gameCore.serializeGameState();
      const before = collectLineageSnapshot();
      gameCore.saveGameToStorage({ source: 'f3-lineage-roundtrip' });
      const restored = !!gameCore.loadGameFromStorage();
      const afterSerialized = gameCore.serializeGameState();
      const after = collectLineageSnapshot();
      const mismatches = (gameCore.saveSystem?.compareSerializedDurableState?.(beforeSerialized, afterSerialized) || [])
        .filter(entry => entry.path !== 'meta.serializedAtMs');
      return {
        restored,
        before,
        after,
        mismatchCount: mismatches.length,
        mismatchPreview: mismatches.slice(0, 12),
        snapshotMatches: JSON.stringify(before) === JSON.stringify(after)
      };
    });

    report.phases.push({
      name: 'nursery-lineage-roundtrip',
      pass:
        !!lineageRoundTrip?.restored
        && lineageRoundTrip?.mismatchCount === 0
        && !!lineageRoundTrip?.snapshotMatches,
      details: lineageRoundTrip
    });

    const refreshSetup = await page.evaluate(() => {
      const serialized = debugUI?.buildAuditPresetState?.('social-routine-web');
      if (!serialized) return { ok: false };
      gameCore.applySerializedState(serialized);
      const state = gameCore.getGameState();
      state.paused = false;
      state.timeScale = 1;

      const traveler = (state.butterflies || [])[0] || null;
      const sourceZoneId = traveler?.currentZoneId || traveler?.lifeSim?.lifecycle?.currentZoneId || null;
      const targetZoneId = (gameCore.getZoneIds?.() || []).find(zoneId => zoneId !== sourceZoneId) || null;
      if (!traveler?.id || !sourceZoneId || !targetZoneId) {
        return { ok: false, reason: 'missing-traveler-or-target-zone' };
      }

      const preservedBlock = (state.blocks || [])[0] || null;
      if (!preservedBlock?.id) {
        return { ok: false, reason: 'missing-block' };
      }
      preservedBlock.x = 236;
      preservedBlock.y = 248;
      preservedBlock.lastMovedById = traveler.id;
      preservedBlock.movedAtFrame = 120;
      preservedBlock.lastPlacedMode = 'stacked';

      const started = !!gameCore.startZoneTravel?.(traveler, targetZoneId, 'f3-save-regression');
      return {
        ok: started,
        travelerId: traveler.id,
        sourceZoneId,
        targetZoneId,
        preservedBlockId: preservedBlock.id
      };
    });
    if (!refreshSetup?.ok) {
      throw new Error(`Unable to prepare doorway refresh scenario (${refreshSetup?.reason || 'unknown'})`);
    }

    await page.waitForTimeout(500);

    const refreshRoundTrip = await page.evaluate(({ travelerId, targetZoneId, preservedBlockId }) => {
      const state = gameCore.getGameState();
      const buildSocialIdentitySnapshot = () => (state.butterflies || []).map(entity => ({
        id: entity.id,
        displayName: entity.displayName || null,
        retainedLessonCount: (entity.lifeSim?.communication?.retainedLessons || []).length,
        recentResidueCount: (entity.lifeSim?.communication?.recentResidues || []).length,
        zoneId: entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null
      })).sort((left, right) => left.id.localeCompare(right.id));
      const buildBlockMetrics = () => {
        const blocks = state.blocks || [];
        const rounded = blocks.map(block => ({
          id: block.id,
          x: Math.round(block.x || 0),
          y: Math.round(block.y || 0)
        }));
        const uniquePositions = new Set(rounded.map(block => `${block.x}:${block.y}`));
        const xs = rounded.map(block => block.x);
        const ys = rounded.map(block => block.y);
        return {
          count: blocks.length,
          uniqueRoundedPositions: uniquePositions.size,
          xSpread: xs.length ? (Math.max(...xs) - Math.min(...xs)) : 0,
          ySpread: ys.length ? (Math.max(...ys) - Math.min(...ys)) : 0
        };
      };
      const buildTravelSnapshot = () => {
        const traveler = (state.butterflies || []).find(entity => entity.id === travelerId) || null;
        return traveler ? {
          id: traveler.id,
          currentZoneId: traveler.currentZoneId || traveler.lifeSim?.lifecycle?.currentZoneId || null,
          zoneTravel: traveler.zoneTravel ? {
            targetZoneId: traveler.zoneTravel.targetZoneId || null,
            phase: traveler.zoneTravel.phase || null,
            renderBehindCover: !!traveler.zoneTravel.renderBehindCover
          } : null
        } : null;
      };

      const beforeSocial = buildSocialIdentitySnapshot();
      const beforeTravel = buildTravelSnapshot();
      gameCore.saveGameToStorage({ source: 'f3-refresh-roundtrip' });

      const raw = window.localStorage.getItem('papilionem-save-v2');
      const saved = raw ? JSON.parse(raw) : null;
      if (!saved) {
        return { restored: false, reason: 'missing-saved-state' };
      }

      const focusedZoneId = saved?.meta?.focusedZoneId || targetZoneId || gameCore.getFocusedZoneId?.() || null;
      const region = focusedZoneId ? gameCore.getZonePlacementRegion?.(focusedZoneId) : null;
      const collapsedX = region ? region.minX + 18 : 120;
      const collapsedY = region ? region.minY + 18 : 120;
      saved.meta = saved.meta || {};
      saved.meta.refreshRevisions = {
        environmentLayout: saved.meta.refreshRevisions?.environmentLayout || gameCore.saveSystem?.getCurrentRefreshRevisions?.()?.environmentLayout || null,
        blockLayout: 'stale-blocks-v0',
        butterflyRuntime: saved.meta.refreshRevisions?.butterflyRuntime || gameCore.saveSystem?.getCurrentRefreshRevisions?.()?.butterflyRuntime || null
      };
      saved.blocks = (saved.blocks || []).map((block, index) => {
        if (block.id === preservedBlockId) {
          return {
            ...block,
            x: 236,
            y: 248,
            lastMovedById: travelerId,
            movedAtFrame: 120,
            lastPlacedMode: 'stacked'
          };
        }
        return {
          ...block,
          x: collapsedX + (index % 2),
          y: collapsedY + Math.floor(index / 2),
          stackIndex: 0,
          supportBlockId: null,
          lastPlacedMode: 'ground',
          carriedById: null,
          attachedOffset: null,
          movedAtFrame: 0,
          lastMovedById: null
        };
      });
      window.localStorage.setItem('papilionem-save-v2', JSON.stringify(saved));

      const restored = !!gameCore.loadGameFromStorage();
      const afterLoadSocial = buildSocialIdentitySnapshot();
      const afterLoadTravel = buildTravelSnapshot();
      const refreshMeta = gameCore.saveSystem?.getCurrentRefreshRevisions?.() || {};
      const restoreMeta = gameCore.getGameState()?.meta?.refreshRevisions || gameCore.saveSystem?.lastSerializedState?.meta?.refreshRevisions || {};

      return {
        restored,
        beforeSocial,
        afterLoadSocial,
        socialMatches: JSON.stringify(beforeSocial) === JSON.stringify(afterLoadSocial),
        beforeTravel,
        afterLoadTravel,
        blockMetrics: buildBlockMetrics(),
        preservedBlock: (state.blocks || []).find(block => block.id === preservedBlockId) || null,
        refreshMeta,
        restoreMeta
      };
    }, refreshSetup);

    await page.waitForTimeout(3200);
    await saveShot(page, outputDir, '04-after-refresh');

    const refreshSettled = await page.evaluate(({ travelerId, targetZoneId, preservedBlockId }) => {
      const state = gameCore.getGameState();
      const traveler = (state.butterflies || []).find(entity => entity.id === travelerId) || null;
      const preservedBlock = (state.blocks || []).find(block => block.id === preservedBlockId) || null;
      return {
        traveler: traveler ? {
          id: traveler.id,
          currentZoneId: traveler.currentZoneId || traveler.lifeSim?.lifecycle?.currentZoneId || null,
          zoneTravel: traveler.zoneTravel ? {
            targetZoneId: traveler.zoneTravel.targetZoneId || null,
            phase: traveler.zoneTravel.phase || null,
            renderBehindCover: !!traveler.zoneTravel.renderBehindCover
          } : null
        } : null,
        preservedBlock: preservedBlock ? {
          id: preservedBlock.id,
          x: Math.round(preservedBlock.x || 0),
          y: Math.round(preservedBlock.y || 0),
          lastPlacedMode: preservedBlock.lastPlacedMode || null,
          lastMovedById: preservedBlock.lastMovedById || null
        } : null,
        targetZoneId
      };
    }, refreshSetup);

    const refreshPass = !!refreshRoundTrip?.restored
      && !!refreshRoundTrip?.socialMatches
      && (refreshRoundTrip?.blockMetrics?.uniqueRoundedPositions || 0) >= Math.min(10, refreshRoundTrip?.blockMetrics?.count || 0)
      && (refreshRoundTrip?.blockMetrics?.xSpread || 0) >= 60
      && (refreshRoundTrip?.blockMetrics?.ySpread || 0) >= 24
      && refreshSettled?.traveler?.currentZoneId === refreshSetup.targetZoneId
      && !refreshSettled?.traveler?.zoneTravel
      && refreshSettled?.preservedBlock?.lastPlacedMode === 'stacked'
      && refreshSettled?.preservedBlock?.lastMovedById === refreshSetup.travelerId
      && refreshRoundTrip?.restoreMeta?.blockLayout === refreshRoundTrip?.refreshMeta?.blockLayout;

    report.phases.push({
      name: 'stale-refresh-and-doorway-travel',
      pass: refreshPass,
      details: {
        setup: refreshSetup,
        refreshRoundTrip,
        refreshSettled
      }
    });

    report.overall = report.phases.every(phase => phase.pass) && report.pageErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = error?.stack || String(error);
  } finally {
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
