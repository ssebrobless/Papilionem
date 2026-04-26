const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r4_ui_readability_audit');
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

function getFlagOverrides() {
  const raw = process.env.PAPILIONEM_FLAG_OVERRIDES;
  if (!raw) return null;
  return JSON.parse(raw);
}

function getAccessibilityOverrides() {
  const raw = process.env.PAPILIONEM_ACCESSIBILITY_OVERRIDES;
  if (!raw) return null;
  return JSON.parse(raw);
}

async function applyFlagOverrides(context, flagOverrides) {
  if (!flagOverrides || typeof flagOverrides !== 'object') return;
  await context.addInitScript((overrides) => {
    window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = overrides;
  }, flagOverrides);
}

async function applyAccessibilityOverrides(context, accessibilityOverrides) {
  if (!accessibilityOverrides || typeof accessibilityOverrides !== 'object') return;
  await context.addInitScript((overrides) => {
    window.__PAPILIONEM_ACCESSIBILITY_OVERRIDES__ = overrides;
  }, accessibilityOverrides);
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
    gameUI.setAccessibilitySettings?.({ highContrastUI: false, uiScale: 1 });
    gameUI.butterflyCollection.visible = false;
    gameUI.inspectPanel.visible = false;
    gameUI.activityLogPanel.visible = false;
    gameUI.clearInspectSelection?.(gameCore.getGameState());
    if (typeof debugUI !== 'undefined') {
      debugUI.enabled = false;
    }
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

async function getCanvasPoint(page, rect) {
  return {
    x: Math.round(rect.x + (rect.width / 2)),
    y: Math.round(rect.y + (rect.height / 2))
  };
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
  const flagOverrides = getFlagOverrides();
  const accessibilityOverrides = getAccessibilityOverrides();

  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    await applyFlagOverrides(context, flagOverrides);
    await applyAccessibilityOverrides(context, accessibilityOverrides);
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

    await phase(page, report, outputDir, '01-journal-collection-header', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        gameUI.toggleButterflyCollection();
        const panel = gameUI.butterflyCollection;
        panel.update();
        return {
          visible: panel.visible,
          mode: panel.mode,
          width: panel.width,
          height: panel.height,
          tabButtons: panel.tabButtons,
          filterButton: panel.filterButton,
          pageKind: panel.getCurrentPage()?.kind || null
        };
      });
      return {
        pass:
          details.visible === true &&
          details.mode === 'collection' &&
          details.width >= 280 &&
          details.height >= 320 &&
          details.pageKind === 'base' &&
          Array.isArray(details.tabButtons) &&
          details.tabButtons.length === 2,
        details
      };
    });

    await phase(page, report, outputDir, '02-journal-roster-wheel-scroll', async () => {
      await resetBaseline(page);
      const before = await page.evaluate(() => {
        gameUI.toggleButterflyCollection();
        const panel = gameUI.butterflyCollection;
        panel.setMode?.('roster');
        panel.refreshLayout();
        const currentEntry = panel.getCurrentRosterEntry?.() || null;
        const currentSummary = currentEntry && typeof rosterSystem !== 'undefined'
          ? rosterSystem.getEntitySummary?.(currentEntry.id, gameCore.gameState)
          : null;
        const currentProfile = currentEntry && typeof statProfileSystem !== 'undefined'
          ? statProfileSystem.getEntityProfile?.(currentEntry, gameCore.gameState)
          : null;
        return {
          currentRosterIndex: panel.currentRosterIndex,
          scrollOffset: panel.getCurrentScrollOffset?.() || 0,
          maxScrollOffset: panel.maxScrollOffset || 0,
          rect: { x: panel.x, y: panel.y, width: panel.width, height: panel.height },
          entryCount: panel.getRosterEntries().length,
          rosterCount: gameCore?.gameState?.roster?.memberIds?.length || 0,
          actionButtons: panel.rosterActionButtons,
          currentEntryId: currentEntry?.id || null,
          currentEntryName: currentEntry?.displayName || currentEntry?.personalityType || null,
          memberLabel: currentSummary?.label || null,
          readinessTier: currentProfile?.readinessProfile?.tier || null,
          readinessScore: Math.round(currentProfile?.readinessProfile?.score || 0)
        };
      });
      await page.waitForTimeout(100);
      await page.evaluate(({ x, y }) => {
        gameUI.butterflyCollection?.handleMouseWheel?.(x, y, -420);
      }, {
        x: Math.round(before.rect.x + (before.rect.width / 2)),
        y: Math.round(before.rect.y + (before.rect.height / 2))
      });
      await page.waitForTimeout(100);
      const after = await page.evaluate(() => ({
        currentRosterIndex: gameUI.butterflyCollection.currentRosterIndex,
        scrollOffset: gameUI.butterflyCollection.getCurrentScrollOffset?.() || 0,
        maxScrollOffset: gameUI.butterflyCollection.maxScrollOffset || 0
      }));
      const scrollHandled = after.maxScrollOffset > 0
        ? after.scrollOffset > before.scrollOffset
        : after.scrollOffset === before.scrollOffset;
      return {
        pass:
          before.entryCount > 1 &&
          before.rect.width >= 300 &&
          before.rect.height >= 340 &&
          before.actionButtons?.toggleMember?.width >= 78 &&
          before.actionButtons?.openBattle?.width >= 78 &&
          !!before.currentEntryId &&
          !!before.currentEntryName &&
          before.readinessScore >= 0 &&
          after.currentRosterIndex === before.currentRosterIndex &&
          scrollHandled,
        details: { before, after }
      };
    });

    await phase(page, report, outputDir, '03-inspect-browse-scroll', async () => {
      await resetBaseline(page);
      const before = await page.evaluate(() => {
        const state = gameCore.getGameState();
        while ((gameCore.getButterfliesInZone?.(state.focusedZoneId)?.length || 0) < 14) {
          debugUI?.godSpawnButterfly?.(gridManager.bounds);
        }
        gameUI.inspectPanel.visible = true;
        gameUI.clearInspectSelection?.(state);
        gameUI.syncPanelLayouts(state);
        return {
          scrollOffset: gameUI.inspectPanel.scrollOffset,
          entries: gameUI.getInspectBrowseEntries(state).length,
          rect: {
            x: gameUI.inspectPanel.x,
            y: gameUI.inspectPanel.y,
            width: gameUI.inspectPanel.width,
            height: gameUI.inspectPanel.height
          }
        };
      });
      await page.evaluate(({ x, y }) => {
        const scaleX = gameConfig.canvas.targetWidth / gameConfig.canvas.baseWidth;
        const scaleY = gameConfig.canvas.targetHeight / gameConfig.canvas.baseHeight;
        gameUI.handleMouseWheel?.(x * scaleX, y * scaleY, -240, gameCore.getGameState());
      }, {
        x: Math.round(before.rect.x + (before.rect.width / 2)),
        y: Math.round(before.rect.y + (before.rect.height / 2))
      });
      await page.waitForTimeout(100);
      const after = await page.evaluate(() => ({
        scrollOffset: gameUI.inspectPanel.scrollOffset
      }));
      return {
        pass: before.entries > 8 && after.scrollOffset > before.scrollOffset,
        details: { before, after }
      };
    });

    await phase(page, report, outputDir, '04-inspect-detail-scroll', async () => {
      await resetBaseline(page);
      const before = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const first = (gameCore.getButterfliesInZone(state.focusedZoneId) || [])[0] || null;
        if (!first) {
          return { ok: false };
        }
        debugUI.enabled = true;
        gameUI.inspectPanel.visible = true;
        gameUI.beginGuidingButterfly(first, state);
        gameUI.syncPanelLayouts(state);
        return {
          ok: true,
          targetId: first.id,
          scrollOffset: gameUI.inspectPanel.scrollOffset,
          rect: {
            x: gameUI.inspectPanel.x,
            y: gameUI.inspectPanel.y,
            width: gameUI.inspectPanel.width,
            height: gameUI.inspectPanel.height
          }
        };
      });
      if (before.ok) {
        await page.evaluate(({ x, y }) => {
          const scaleX = gameConfig.canvas.targetWidth / gameConfig.canvas.baseWidth;
          const scaleY = gameConfig.canvas.targetHeight / gameConfig.canvas.baseHeight;
          gameUI.handleMouseWheel?.(x * scaleX, y * scaleY, -420, gameCore.getGameState());
        }, {
          x: Math.round(before.rect.x + (before.rect.width / 2)),
          y: Math.round(before.rect.y + (before.rect.height / 2))
        });
        await page.waitForTimeout(100);
      }
      const after = await page.evaluate(() => ({
        scrollOffset: gameUI.inspectPanel.scrollOffset,
        targetId: gameUI.inspectPanel.lockedTargetId
      }));
      return {
        pass: before.ok && !!after.targetId && after.scrollOffset > before.scrollOffset,
        details: { before, after }
      };
    });

    await phase(page, report, outputDir, '05-inspect-release-checklist', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const zoneId = state.focusedZoneId;
        const baseTraits = progressionManager.getWildSpawnTraits(state, 'friendly');
        for (let index = 0; index < 3; index += 1) {
          const hybrid = new Butterfly(220 + index * 22, 220, null, false, 'hybrid', {
            currentZoneId: zoneId,
            birthSource: 'bred',
            sex: index % 2 === 0 ? 'F' : 'M',
            hybridGenome: {
              audit: true,
              index,
              heritage: {
                lineageTypes: index % 2 === 0 ? ['friendly', 'wise'] : ['cautious', 'skittish']
              }
            },
            customTraits: {
              ...baseTraits,
              speed: baseTraits.speed + 0.15
            },
            isHybrid: true
          });
          gameCore.assignEntityToZone(hybrid, zoneId);
          state.butterflies.push(hybrid);
        }
        gameUI.inspectPanel.visible = true;
        gameUI.enterInspectReleaseMode(state);
        const entries = gameUI.getInspectReleaseEntries(state);
        return {
          releaseMode: gameUI.inspectControl.releaseMode,
          entryCount: entries.length,
          allMarkedReleasable: entries.every(entry => entry.subtitle.includes('releasable hybrid')),
          allShowBatchContext: entries.every(entry => entry.subtitle.includes('batch 0/10')),
          allShowLineageContext: entries.every(entry => entry.subtitle.includes('friendly') || entry.subtitle.includes('cautious'))
        };
      });
      return {
        pass:
          details.releaseMode === true &&
          details.entryCount >= 3 &&
          details.allMarkedReleasable &&
          details.allShowBatchContext &&
          details.allShowLineageContext,
        details
      };
    });

    await phase(page, report, outputDir, '06-inspect-high-contrast-browse', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        gameUI.setAccessibilitySettings?.({ highContrastUI: true });
        gameUI.inspectPanel.visible = true;
        gameUI.clearInspectSelection?.(state);
        gameUI.syncPanelLayouts(state);
        return {
          highContrast: !!gameUI.accessibilitySettings.highContrastUI,
          panel: {
            x: gameUI.inspectPanel.x,
            y: gameUI.inspectPanel.y,
            width: gameUI.inspectPanel.width,
            height: gameUI.inspectPanel.height
          },
          entryCount: gameUI.getInspectBrowseEntries(state).length
        };
      });
      return {
        pass: details.highContrast === true && details.entryCount >= 1,
        details
      };
    });

    await phase(page, report, outputDir, '07-spatial-shell-focus', async () => {
      await resetBaseline(page);
      const setup = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const first = (gameCore.getButterfliesInZone(state.focusedZoneId) || [])[0] || null;
        if (!first) return { ok: false };
        gameUI.inspectPanel.visible = true;
        gameUI.beginGuidingButterfly(first, state);
        gameCore.setDebugEnabled?.(true);
        return {
          ok: true,
          targetId: first.id
        };
      });
      await page.waitForTimeout(120);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const target = gameUI.getLockedInspectTarget?.(state) || null;
        renderManager.drawSpatialShellOverlay?.(renderManager.layers?.ui, state, { debugEnabled: true });
        return {
          targetId: target?.id || null,
          inspectSpatial: target ? gameUI.getInspectSpatialProofSummary?.(target, state) || null : null,
          renderOverlay: renderManager.spatialShellOverlayState || null,
          debugSpatial: debugUI?.buildSpatialFocusSnapshot?.(state) || debugUI?.lastSpatialFocusSummary || null
        };
      });
      return {
        pass:
          setup.ok === true &&
          details.targetId === setup.targetId &&
          !!details.inspectSpatial?.headline &&
          !!details.inspectSpatial?.detail &&
          details.renderOverlay?.focusId === setup.targetId &&
          (details.renderOverlay?.focusLines?.length || 0) >= 2 &&
          details.debugSpatial?.focusId === setup.targetId &&
          (details.debugSpatial?.lines?.length || 0) >= 3,
        details: { setup, details }
      };
    });

    await phase(page, report, outputDir, '08-ml-explainability-shell', async () => {
      await resetBaseline(page);
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const first = (gameCore.getButterfliesInZone(state.focusedZoneId) || [])[0] || null;
        if (!first) {
          return { ok: false };
        }
        debugUI.enabled = true;
        gameUI.inspectPanel.visible = true;
        gameUI.beginGuidingButterfly(first, state);
        gameUI.syncPanelLayouts(state);
        const mlSummary = mlInferenceSystem.getEntitySummary?.(first.id, state) || null;
        const mlRows = mlSummary ? gameUI.buildMlInspectRows?.(mlSummary) || [] : [];
        const debugSnapshot = debugUI.buildMlExplainabilitySnapshot?.(state) || debugUI.lastMlExplainabilitySummary || null;
        return {
          ok: true,
          targetId: first.id,
          rowLabels: mlRows.map(row => row.label),
          pathRow: mlRows.find(row => row.label === 'Path')?.value || '',
          whyRow: mlRows.find(row => row.label === 'Why')?.value || '',
          debugSnapshot
        };
      });
      return {
        pass:
          details.ok === true &&
          details.rowLabels?.includes('Path') &&
          details.rowLabels?.includes('Why') &&
          /assets\/ml\//i.test(details.pathRow || '') &&
          (details.whyRow?.length || 0) > 8 &&
          details.debugSnapshot?.focusId === details.targetId &&
          (details.debugSnapshot?.lines?.length || 0) >= 4,
        details
      };
    });

    report.overall = report.phases.every(phaseEntry => phaseEntry.pass) && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath, overall: report.overall }, null, 2));
    if (report.overall === 'error') process.exitCode = 1;
    if (report.overall === 'fail') process.exitCode = 2;
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
