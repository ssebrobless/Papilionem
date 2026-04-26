const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'f4_shell_followup_audit');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
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
  const serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore'
  });
  serverProcess.unref();
  report.server = { reused: false, pid: serverProcess.pid };

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ok = await fetch(URL).then(() => true).catch(() => false);
    if (ok) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error('Server did not become reachable in time');
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

async function resetBaseline(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
    gameUI.setAccessibilitySettings?.({
      trailVisibility: 'off',
      battleMotionSimplify: false,
      reducedMotion: false,
      highContrastUI: false,
      uiScale: 1
    });
    gameUI.inspectPanel.visible = false;
    gameUI.activityLogPanel.visible = false;
    gameUI.clearInspectSelection?.(gameCore.getGameState());
    gameUI.resumeLatestFeedView?.();
    const zoneIds = gameCore.getZoneIds?.() || [];
    const butterflies = gameCore.getGameState().butterflies || [];
    butterflies.forEach((butterfly, index) => {
      const zoneId = zoneIds[index % zoneIds.length] || gameCore.getFocusedZoneId();
      const point = gameCore.getRandomPlacementPoint?.(zoneId, 40) || gameCore.getZoneCenter?.(zoneId);
      if (!zoneId || !point) return;
      gameCore.assignEntityToZone?.(butterfly, zoneId);
      butterfly.zoneTravel = null;
      butterfly.x = point.x;
      butterfly.y = point.y;
      butterfly.gridPos = gridManager.screenToIso(butterfly.x, butterfly.y + (butterfly.shadowOffset || 0));
      butterfly.updateZIndex?.();
    });
    if (typeof debugUI !== 'undefined') {
      debugUI.enabled = false;
    }
    if (typeof communicationSystem !== 'undefined') {
      communicationSystem.dialogueHistory = [];
    }
    if (typeof eventBus !== 'undefined' && Array.isArray(eventBus.history)) {
      eventBus.history.length = 0;
    }
    gameUI.activityLogCache = { key: null, entries: [] };
  });
  await page.waitForTimeout(1000);
}

async function phase(page, report, outputDir, name, run) {
  const result = await run();
  const screenshot = await saveShot(page, outputDir, name);
  report.phases.push({
    name,
    pass: !!result.pass,
    details: result.details || null,
    screenshot
  });
  return result;
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    url: URL,
    phases: [],
    pageErrors: [],
    consoleErrors: [],
    server: null,
    overall: 'pending'
  };

  let browser;
  let context;
  let page;

  try {
    await ensureServer(report);
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

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    await phase(page, report, outputDir, '01-inspect-all-browse', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        gameUI.inspectPanel.visible = true;
        gameUI.inspectControl.browseScope = 'all';
        gameUI.clearInspectSelection?.(state);
        gameUI.syncPanelLayouts(state);
        const focusedZoneId = state.focusedZoneId || null;
        const allEntries = gameUI.getInspectBrowseEntries(state);
        const zoneEntries = allEntries.filter(entry => {
          return (entry.subtitle || '').includes(gameUI.getZoneDisplayName(focusedZoneId));
        });
        const zones = [...new Set(allEntries.map(entry => gameUI.getEntityZoneId(entry.butterfly, null)).filter(Boolean))];
        return {
          browseScope: gameUI.inspectControl.browseScope,
          allButtonRect: gameUI.getInspectAllButtonRect(),
          totalEntries: allEntries.length,
          zoneOnlyEntries: zoneEntries.length,
          zoneLabels: zones
        };
      });
      return {
        pass:
          details.browseScope === 'all' &&
          details.totalEntries > details.zoneOnlyEntries &&
          details.zoneLabels.length >= 2 &&
          details.allButtonRect?.width >= 24,
        details
      };
    });

    await phase(page, report, outputDir, '02-inspect-clears-on-zone-leave', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const sourceZoneId = state.focusedZoneId || null;
        const target = (gameCore.getButterfliesInZone(sourceZoneId) || []).find(entry => entry?.id && !entry.zoneTravel && !entry.isSpawning) || null;
        const otherZoneId = (gameCore.getZoneIds?.() || []).find(zoneId => zoneId !== sourceZoneId) || null;
        if (!target?.id || !otherZoneId) {
          return { ok: false, reason: 'missing-target-or-other-zone' };
        }

        const destination = gameCore.getRandomPlacementPoint?.(otherZoneId, 40) || gameCore.getZoneCenter?.(otherZoneId);
        gameUI.inspectPanel.visible = true;
        gameUI.inspectControl.browseScope = 'zone';
        gameUI.beginGuidingButterfly(target, state);
        const before = {
          lockedTargetId: gameUI.inspectPanel.lockedTargetId,
          targetZoneId: gameUI.getEntityZoneId(target, null)
        };

        gameCore.assignEntityToZone?.(target, otherZoneId);
        if (destination) {
          target.x = destination.x;
          target.y = destination.y;
          target.gridPos = gridManager.screenToIso(target.x, target.y + (target.shadowOffset || 0));
          target.updateZIndex?.();
        }

        gameUI.resolveInspectTarget(state);
        return {
          ok: true,
          before,
          after: {
            lockedTargetId: gameUI.inspectPanel.lockedTargetId,
            targetZoneId: gameUI.getEntityZoneId(target, null)
          }
        };
      });
      return {
        pass:
          details.ok === true &&
          !!details.before?.lockedTargetId &&
          details.after?.lockedTargetId === null,
        details
      };
    });

    await phase(page, report, outputDir, '03-doorway-travel-route', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const sourceZoneId = state.focusedZoneId || null;
        const targetZoneId = (gameCore.getZoneIds?.() || []).find(zoneId => zoneId !== sourceZoneId) || null;
        const traveler = (gameCore.getButterfliesInZone(sourceZoneId) || []).find(entry => entry?.id && !entry.zoneTravel && !entry.isSpawning) || null;
        if (!sourceZoneId || !targetZoneId || !traveler?.id) {
          return { ok: false, reason: 'missing-travel-fixture' };
        }

        const started = !!gameCore.startZoneTravel?.(traveler, targetZoneId, 'f4-doorway-retest');
        if (!started) {
          return { ok: false, reason: 'start-zone-travel-failed' };
        }

        const phasesSeen = [];
        let warpingStartDistance = null;
        let enteringStartDistance = null;
        const recordPhase = () => {
          const phase = traveler.zoneTravel?.phase || null;
          if (phase && !phasesSeen.includes(phase)) {
            phasesSeen.push(phase);
          }
        };

        recordPhase();
        for (let index = 0; index < 260; index += 1) {
          if (traveler.zoneTravel?.phase === 'warping' && warpingStartDistance === null) {
            warpingStartDistance = Math.hypot(
              (traveler.x || 0) - (traveler.zoneTravel.sourceAnchor?.x || 0),
              (traveler.y || 0) - (traveler.zoneTravel.sourceAnchor?.y || 0)
            );
          }
          if (traveler.zoneTravel?.phase === 'entering' && enteringStartDistance === null) {
            enteringStartDistance = Math.hypot(
              (traveler.x || 0) - (traveler.zoneTravel.arrivalWarpAnchor?.x || 0),
              (traveler.y || 0) - (traveler.zoneTravel.arrivalWarpAnchor?.y || 0)
            );
          }
          gameCore.updateZoneTravelers(gameConfig?.simulation?.fixedDeltaSeconds || (1 / 60));
          recordPhase();
          if (!traveler.zoneTravel) break;
        }

        return {
          ok: true,
          sourceZoneId,
          targetZoneId,
          phasesSeen,
          warpingStartDistance,
          enteringStartDistance,
          finalZoneId: gameCore.getEntityZoneId(traveler, null),
          activeTravel: !!traveler.zoneTravel
        };
      });
      return {
        pass:
          details.ok === true &&
          details.phasesSeen.includes('departing') &&
          details.phasesSeen.includes('warping') &&
          details.phasesSeen.includes('entering') &&
          details.finalZoneId === details.targetZoneId &&
          details.activeTravel === false &&
          typeof details.warpingStartDistance === 'number' &&
          details.warpingStartDistance < 24 &&
          typeof details.enteringStartDistance === 'number' &&
          details.enteringStartDistance < 12,
        details
      };
    });

    await phase(page, report, outputDir, '04-feed-clean-shell', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId || null;
        const zoneButterflies = gameCore.getButterfliesInZone(zoneId) || [];
        const source = zoneButterflies[0] || null;
        const target = zoneButterflies[1] || source || null;
        const listener = zoneButterflies[2] || target || source || null;
        if (!source?.id || !target?.id || !listener?.id) {
          return { ok: false, reason: 'missing-feed-fixture' };
        }

        const now = Date.now();
        communicationSystem.dialogueHistory.push({
          id: 'f4-dialogue-shell',
          timestamp: now - 3000,
          sourceId: source.id,
          sourceZoneId: zoneId,
          sourceLabel: gameUI.getEntityDisplayName(source, source.id),
          targetIds: [target.id],
          targetLabels: [gameUI.getEntityDisplayName(target, target.id)],
          targetCount: 1,
          phrase: 'Staying close.',
          talkMode: 'single_target',
          residues: []
        });
        eventBus.history.push({
          event: GameEvents?.OBJECT_PICKED_UP || 'object:pickedUp',
          timestamp: now - 2000,
          data: {
            sourceId: source.id,
            zoneId,
            objectType: 'block'
          }
        });
        eventBus.history.push({
          event: GameEvents?.TEACHING_COMPLETED || 'teaching:completed',
          timestamp: now - 1000,
          data: {
            teacherId: source.id,
            listenerId: listener.id,
            zoneId
          }
        });

        gameUI.activityLogPanel.visible = true;
        gameUI.activityLogPanel.filters = { talk: true, actions: true, learn: true };
        gameUI.activityLogCache = { key: null, entries: [] };

        const entries = gameUI.getRecentActivityEntries();
        const buttons = gameUI.getFeedFilterButtons().map(button => ({
          id: button.id,
          accent: button.style?.accent || null
        }));
        return {
          ok: true,
          buttons,
          categories: [...new Set(entries.map(entry => entry.category))],
          entries: entries.slice(-6).map(entry => ({
            category: entry.category,
            headline: entry.headline,
            badgeText: entry.badgeText || null
          }))
        };
      });
      const accentKeys = (details.buttons || []).map(button => JSON.stringify(button.accent || null));
      const uniqueAccentCount = new Set(accentKeys).size;
      return {
        pass:
          details.ok === true &&
          (details.buttons || []).length === 3 &&
          uniqueAccentCount === 3 &&
          details.categories.includes('talk') &&
          details.categories.includes('actions') &&
          details.categories.includes('learn') &&
          (details.entries || []).every(entry => entry.badgeText === null),
        details
      };
    });

    await phase(page, report, outputDir, '05-trail-toggle-cycle', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const before = gameUI.getAccessibilitySettings?.().trailVisibility || null;
        gameUI.cycleAccessibilitySetting?.('trailVisibility', ['off', 'reduced', 'full']);
        const afterOne = gameUI.getAccessibilitySettings?.().trailVisibility || null;
        gameUI.cycleAccessibilitySetting?.('trailVisibility', ['off', 'reduced', 'full']);
        const afterTwo = gameUI.getAccessibilitySettings?.().trailVisibility || null;
        gameUI.cycleAccessibilitySetting?.('trailVisibility', ['off', 'reduced', 'full']);
        const afterThree = gameUI.getAccessibilitySettings?.().trailVisibility || null;
        return {
          before,
          afterOne,
          afterTwo,
          afterThree
        };
      });
      return {
        pass:
          details.before === 'off' &&
          details.afterOne === 'reduced' &&
          details.afterTwo === 'full' &&
          details.afterThree === 'off',
        details
      };
    });

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
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
