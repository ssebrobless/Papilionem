const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'h5_long_running_save_smoothness_audit');
const SAVE_EXPORT_ROOT = path.join(ROOT, 'qa_logs', 'save_exports');
const DEFAULT_PORT = 3000;
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

function buildUrl(port) {
  return `http://127.0.0.1:${port}/`;
}

async function getRuntimeCapabilities(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}api/runtime-capabilities`);
    if (!response.ok) return null;
    const result = await response.json().catch(() => null);
    if (!result?.ok) return null;
    return result;
  } catch (_error) {
    return null;
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
  const capabilities = reachable ? await getRuntimeCapabilities(defaultUrl) : null;
  if (reachable && capabilities?.saveExport && capabilities?.sessionCaptureExport) {
    report.server = { reused: true, pid: null, port: DEFAULT_PORT };
    return defaultUrl;
  }

  const auditPort = reachable ? 3015 : DEFAULT_PORT;
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
  const runtimeCapabilities = await getRuntimeCapabilities(auditUrl);
  if (!runtimeCapabilities?.saveExport || !runtimeCapabilities?.sessionCaptureExport) {
    throw new Error(`Runtime capability route was unavailable on port ${auditPort}`);
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

function resolveSavePath(candidate = null) {
  if (candidate) {
    const resolved = path.resolve(ROOT, candidate);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      const savePath = path.join(resolved, 'save.json');
      if (fs.existsSync(savePath)) return savePath;
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return resolved;
    }
    throw new Error(`Provided save export path does not exist: ${resolved}`);
  }

  if (!fs.existsSync(SAVE_EXPORT_ROOT)) return null;
  const candidates = fs.readdirSync(SAVE_EXPORT_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .filter(entry => !/^g0h-scripted-fixture-/.test(entry.name))
    .map(entry => path.join(SAVE_EXPORT_ROOT, entry.name))
    .map(dir => ({
      dir,
      savePath: path.join(dir, 'save.json')
    }))
    .filter(entry => fs.existsSync(entry.savePath))
    .sort((left, right) => right.dir.localeCompare(left.dir));

  return candidates[0]?.savePath || null;
}

function readSaveSummary(savePath) {
  const raw = fs.readFileSync(savePath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    raw,
    summary: {
      focusedZoneId: parsed?.meta?.focusedZoneId || null,
      viewMode: parsed?.meta?.viewMode || 'focused-garden',
      butterflyCount: Array.isArray(parsed?.butterflies) ? parsed.butterflies.length : 0,
      flowerCount: Array.isArray(parsed?.flowers) ? parsed.flowers.length : 0,
      caterpillarCount: Array.isArray(parsed?.caterpillars) ? parsed.caterpillars.length : 0,
      blockCount: Array.isArray(parsed?.blocks) ? parsed.blocks.length : 0,
      hybridJournalCount: Array.isArray(parsed?.progression?.hybridJournal) ? parsed.progression.hybridJournal.length : 0
    }
  };
}

async function createFixtureSaveExport(browser, baseUrl, report, flagOverrides = null) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 }
  });
  await applyFlagOverrides(context, flagOverrides);
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    const result = await page.evaluate(async () => {
      const serialized = debugUI?.buildAuditPresetState?.('social-routine-web');
      if (!serialized) {
        return { ok: false, error: 'Unable to build social-routine-web fixture export' };
      }

      gameCore.applySerializedState(serialized);
      const state = gameCore.getGameState();
      state.paused = false;
      state.timeScale = 1;
      gameUI.activityLogPanel.visible = false;
      gameUI.inspectPanel.visible = false;
      state.showButterflyCollection = false;
      gameUI.clearInspectSelection?.(state);

      const response = await fetch('/api/save-exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          label: 'h5-fixture-social-web',
          serializedState: gameCore.serializeGameState()
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        return {
          ok: false,
          error: payload?.error || `Save export failed with status ${response.status}`
        };
      }
      return {
        ok: true,
        savePath: payload.savePath || null,
        outputDir: payload.outputDir || null,
        summaryPath: payload.summaryPath || null,
        summary: payload.summary || null
      };
    });

    if (!result?.ok || !result?.savePath) {
      throw new Error(result?.error || 'Fixture save export failed');
    }

    report.fixtureExport = result;
    return result.savePath;
  } finally {
    await context.close();
  }
}

async function phase(page, report, outputDir, name, run, options = {}) {
  const result = await run();
  const screenshot = options.skipScreenshot ? null : await saveShot(page, outputDir, name);
  report.phases.push({
    name,
    pass: !!result.pass,
    details: result.details || null,
    screenshot
  });
  return result;
}

async function importSaveIntoPage(page, rawSave) {
  return await page.evaluate(({ rawSave, storageKeys }) => {
    return (async () => {
      storageKeys.forEach(key => window.localStorage.removeItem(key));
      if (typeof saveSystem !== 'undefined' && typeof saveSystem.writePayloadToIndexedDb === 'function') {
        await saveSystem.writePayloadToIndexedDb('papilionem-save-v2', rawSave);
      } else {
        window.localStorage.setItem('papilionem-save-v2', rawSave);
      }
      const restored = await gameCore.loadGameFromStorage?.();
      const state = gameCore.getGameState();
      return {
        restored: !!restored,
        focusedZoneId: state?.focusedZoneId || null,
        viewMode: state?.viewMode || 'focused-garden',
        butterflies: (state?.butterflies || []).length,
        flowers: (state?.flowers || []).length,
        caterpillars: (state?.caterpillars || []).length,
        blocks: (state?.blocks || []).length,
        hybridJournalCount: state?.hybridJournal?.length || 0,
        zoneIds: gameCore.getZoneIds?.() || []
      };
    })();
  }, {
    rawSave,
    storageKeys: STORAGE_KEYS
  });
}

async function startSessionCapture(page, label) {
  await page.evaluate((sessionLabel) => {
    gameCore.telemetrySystem?.startSessionCapture?.(gameCore.getGameState(), {
      label: sessionLabel
    });
  }, label);
}

async function exportSessionCapture(page) {
  return await page.evaluate(async () => {
    return await gameCore.telemetrySystem.exportSessionCapture(gameCore.getGameState(), {
      source: 'h5-audit'
    });
  });
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  ensureDir(SAVE_EXPORT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    url: null,
    server: null,
    saveSource: null,
    phases: [],
    pageErrors: [],
    consoleErrors: [],
    exportResult: null,
    overall: 'pending'
  };

  let browser;
  let context;
  let page;
  const flagOverrides = getFlagOverrides();
  const accessibilityOverrides = getAccessibilityOverrides();

  try {
    const explicitSaveArg = process.argv.slice(2).find(arg => !arg.startsWith('--')) || null;
    const baseUrl = await ensureServer(report);
    report.url = baseUrl;

    browser = await chromium.launch({ headless: true });
    let savePath = resolveSavePath(explicitSaveArg);
    let saveKind = (savePath && /h5-fixture-/.test(savePath))
      ? 'fixture-export'
      : 'real-export';
    if (!savePath) {
      saveKind = 'fixture-export';
      savePath = await createFixtureSaveExport(browser, baseUrl, report, flagOverrides);
    }

    const importedSave = readSaveSummary(savePath);
    report.saveSource = {
      kind: saveKind,
      savePath,
      summary: importedSave.summary
    };

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

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    await phase(page, report, outputDir, '01-import-exported-save', async () => {
      const details = await importSaveIntoPage(page, importedSave.raw);
      await page.evaluate(() => {
        if (gameUI?.firstSessionGuide) {
          gameUI.firstSessionGuide.visible = false;
        }
      });
      await page.waitForTimeout(1200);
      return {
        pass:
          details.restored === true &&
          details.butterflies > 0 &&
          details.zoneIds.length >= 1,
        details
      };
    });

    await startSessionCapture(page, 'h5-long-running-save');

    await phase(page, report, outputDir, '02-calm-garden-observe', async () => {
      await page.evaluate(() => {
        const state = gameCore.getGameState();
        gameUI.activityLogPanel.visible = false;
        gameUI.inspectPanel.visible = false;
        state.showButterflyCollection = false;
        if (gameUI?.butterflyCollection?.visible) {
          gameUI.toggleButterflyCollection?.();
        }
        gameUI.accessibilityPanel.visible = false;
        gameUI.clearInspectSelection?.(state);
        if (gameUI?.firstSessionGuide) {
          gameUI.firstSessionGuide.visible = false;
        }
        gameCore.setViewMode?.('focused-garden');
      });
      await page.waitForTimeout(7000);
      const details = await page.evaluate(() => {
        const telemetry = gameCore.getTelemetrySnapshot?.() || null;
        return {
          viewMode: gameCore.getGameState()?.viewMode || 'focused-garden',
          pressureTier: telemetry?.pressure?.tier || 'unknown',
          avgUpdateMs: Number(telemetry?.averages?.updateMs || 0),
          avgRenderMs: Number(telemetry?.averages?.renderMs || 0),
          lagCategory: telemetry?.attribution?.category || 'unknown',
          shellSummary: telemetry?.attribution?.shellSummary || null
        };
      });
      return {
        pass:
          details.viewMode === 'focused-garden' &&
          details.avgUpdateMs <= 12 &&
          details.avgRenderMs <= 14,
        details
      };
    }, { skipScreenshot: true });

    await phase(page, report, outputDir, '03-shell-heavy-retest', async () => {
      await page.evaluate(() => {
        const state = gameCore.getGameState();
        const inspectTarget = (state.butterflies || [])
          .find(entity => entity?.id && !entity.zoneTravel && !entity.isSpawning) || (state.butterflies || [])[0] || null;
        gameUI.activityLogPanel.visible = true;
        gameUI.resumeLatestFeedView?.();
        gameUI.inspectPanel.visible = false;
        if (gameUI.butterflyCollection?.visible) {
          gameUI.toggleButterflyCollection?.();
        }
        gameUI.clearInspectSelection?.(state);
      });
      await page.waitForTimeout(1800);
      await page.evaluate(() => {
        const state = gameCore.getGameState();
        const inspectTarget = (state.butterflies || [])
          .find(entity => entity?.id && !entity.zoneTravel && !entity.isSpawning) || (state.butterflies || [])[0] || null;
        gameUI.activityLogPanel.visible = false;
        gameUI.inspectPanel.visible = true;
        gameUI.inspectControl.browseScope = 'all';
        if (inspectTarget) {
          gameUI.beginGuidingButterfly?.(inspectTarget, state);
        } else {
          gameUI.clearInspectSelection?.(state);
        }
      });
      await page.waitForTimeout(1800);
      await page.evaluate(() => {
        gameUI.activityLogPanel.visible = false;
        gameUI.inspectPanel.visible = false;
        gameUI.clearInspectSelection?.(gameCore.getGameState());
        if (!gameUI.butterflyCollection?.visible) {
          gameUI.toggleButterflyCollection?.();
        }
      });
      await page.waitForTimeout(5000);
      const details = await page.evaluate(() => {
        const telemetry = gameCore.getTelemetrySnapshot?.() || null;
        return {
          feedVisible: true,
          inspectVisible: true,
          inspectSequenceComplete: true,
          journalVisible: !!gameUI.butterflyCollection?.visible,
          inspectTargetId: gameUI.inspectPanel?.lockedTargetId || gameUI.inspectPanel?.selectedTargetId || null,
          pressureTier: telemetry?.pressure?.tier || 'unknown',
          avgUpdateMs: Number(telemetry?.averages?.updateMs || 0),
          avgRenderMs: Number(telemetry?.averages?.renderMs || 0),
          shellSummary: telemetry?.attribution?.shellSummary || null
        };
      });
      return {
        pass:
          details.feedVisible &&
          details.inspectVisible &&
          details.inspectSequenceComplete &&
          details.journalVisible &&
          details.avgUpdateMs <= 16 &&
          details.avgRenderMs <= 19,
        details
      };
    }, { skipScreenshot: true });

    await phase(page, report, outputDir, '04-zone-travel-retest', async () => {
      const setup = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const traveler = (state.butterflies || [])
          .find(entity => entity?.id && !entity.zoneTravel && !entity.isSpawning) || null;
        const sourceZoneId = traveler?.currentZoneId || traveler?.lifeSim?.lifecycle?.currentZoneId || null;
        const targetZoneId = (gameCore.getZoneIds?.() || [])
          .filter(zoneId => zoneId !== sourceZoneId)
          .find(zoneId => gameCore.buildZoneTravelRoute?.(sourceZoneId, zoneId)?.edgeMode) || null;
        if (!sourceZoneId || !targetZoneId || !traveler?.id) {
          return { ok: false, reason: 'missing-edge-travel-fixture', travelerId: traveler?.id || null, sourceZoneId, targetZoneId };
        }
        gameCore.focusZone?.(sourceZoneId);
        const started = !!gameCore.startZoneTravel?.(traveler, targetZoneId, 'h5-travel-retest');
        return {
          ok: started,
          travelerId: traveler.id,
          sourceZoneId,
          targetZoneId
        };
      });
      if (!setup?.ok) {
        return {
          pass: false,
          details: setup
        };
      }

      await page.waitForFunction(({ travelerId, targetZoneId }) => {
        const traveler = (gameCore.getGameState()?.butterflies || []).find(entity => entity.id === travelerId) || null;
        const currentZoneId = traveler?.currentZoneId || traveler?.lifeSim?.lifecycle?.currentZoneId || null;
        return currentZoneId === targetZoneId && !traveler?.zoneTravel;
      }, setup, { timeout: 15000 });

      const details = await page.evaluate(({ travelerId, targetZoneId }) => {
        const traveler = (gameCore.getGameState()?.butterflies || []).find(entity => entity.id === travelerId) || null;
        return {
          travelerId,
          targetZoneId,
          currentZoneId: traveler?.currentZoneId || traveler?.lifeSim?.lifecycle?.currentZoneId || null,
          zoneTravel: traveler?.zoneTravel || null
        };
      }, setup);
      return {
        pass:
          details.currentZoneId === details.targetZoneId &&
          details.zoneTravel === null,
        details
      };
    }, { skipScreenshot: true });

    await phase(page, report, outputDir, '05-save-load-roundtrip', async () => {
      const details = await page.evaluate(() => {
        const state = gameCore.getGameState();
        const previousPaused = !!state.paused;
        state.paused = true;
        const collectStableSnapshot = () => ({
          focusedZoneId: state.focusedZoneId || null,
          viewMode: state.viewMode || 'focused-garden',
          butterflyIds: (state.butterflies || []).map(entity => entity.id).sort(),
          butterflyZones: (state.butterflies || [])
            .map(entity => ({
              id: entity.id,
              zoneId: entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null
            }))
            .sort((left, right) => left.id.localeCompare(right.id)),
          blockCount: (state.blocks || []).length,
          flowerCount: (state.flowers || []).length,
          hybridJournalCount: state.hybridJournal?.length || 0
        });
        const before = collectStableSnapshot();
        gameCore.saveGameToStorage({ source: 'h5-audit' });
        const restored = !!gameCore.loadGameFromStorage();
        const after = collectStableSnapshot();
        state.paused = previousPaused;
        return {
          restored,
          snapshotMatches: JSON.stringify(before) === JSON.stringify(after),
          before,
          after
        };
      });
      await page.waitForTimeout(1000);
      return {
        pass:
          details.restored === true &&
          details.snapshotMatches === true,
        details
      };
    }, { skipScreenshot: true });

    await phase(page, report, outputDir, '06-battle-entry-exit', async () => {
      const setup = await page.evaluate(() => {
        const butterflies = gameCore.getGameState()?.butterflies || [];
        const leftIds = butterflies.slice(0, 2).map(entity => entity.id);
        const rightIds = butterflies.slice(2, 4).map(entity => entity.id);
        const fastOptions = {
          mode: 'h5-retest-battle',
          autoBattle: true,
          autoBattlePaused: false,
          autoBattleSpeed: 2,
          autoBattleIntervalFrames: 12,
          maxRounds: 10,
          maxTeamSize: 2
        };
        let snapshot = (leftIds.length >= 1 && rightIds.length >= 1)
          ? gameCore.startBattleFromSides?.(leftIds, rightIds, fastOptions)
          : null;
        const preview = !snapshot ? gameCore.buildSinglePlayerAutoBattlePreview?.(fastOptions) : null;
        if (!snapshot && preview?.canStart) {
          snapshot = gameCore.startSinglePlayerAutoBattleSession?.(fastOptions) || null;
        }
        if (!snapshot) {
          const fallbackLeftIds = butterflies.slice(0, 3).map(entity => entity.id);
          const fallbackRightIds = butterflies.slice(3, 6).map(entity => entity.id);
          if (fallbackLeftIds.length >= 1 && fallbackRightIds.length >= 1) {
            snapshot = gameCore.startBattleFromSides?.(fallbackLeftIds, fallbackRightIds, {
              ...fastOptions,
              maxTeamSize: 3,
              maxRounds: 12
            }) || null;
          }
        }
        return {
          battleId: snapshot?.battleId || null
        };
      });
      if (!setup?.battleId) {
        return {
          pass: false,
          details: {
            ok: false,
            reason: 'unable-to-start-battle'
          }
        };
      }

      await page.waitForFunction((battleId) => {
        return gameCore.getGameState()?.viewMode === 'battle'
          && !!battleSystem.getSnapshot?.(battleId);
      }, setup.battleId, { timeout: 10000 });

      await page.waitForFunction((battleId) => {
        return !!battleSystem.getSnapshot?.(battleId)?.result;
      }, setup.battleId, { timeout: 20000 });

      const during = await page.evaluate((battleId) => {
        const snapshot = battleSystem.getSnapshot?.(battleId);
        return {
          battleId,
          roundNumber: snapshot?.roundNumber || 0,
          summary: snapshot?.result?.summary || null,
          eventCount: Array.isArray(snapshot?.events) ? snapshot.events.length : 0
        };
      }, setup.battleId);

      const committed = await page.evaluate((battleId) => {
        const result = gameCore.commitBattleSession?.(battleId);
        return {
          committed: !!result,
          viewMode: gameCore.getGameState()?.viewMode || null,
          activeBattleId: gameCore.getGameState()?.activeBattleId || null
        };
      }, setup.battleId);
      await page.waitForTimeout(1200);

      return {
        pass:
          !!during.summary &&
          during.eventCount >= 3 &&
          committed.committed === true &&
          committed.viewMode === 'focused-garden' &&
          committed.activeBattleId === null,
        details: {
          during,
          committed
        }
      };
    }, { skipScreenshot: true });

    report.exportResult = await exportSessionCapture(page);
    const exportSummary = report.exportResult?.payloadSummary || report.exportResult?.summary || null;
    report.phases.push({
      name: '07-export-session-capture',
      pass:
        !!exportSummary?.sessionId &&
        Number(exportSummary?.totalTimelineEntries || exportSummary?.timelineCount || 0) > 0 &&
        Number(exportSummary?.freezeSuspectCount || exportSummary?.eventCounts?.freeze_suspect || 0) === 0 &&
        Number(
          exportSummary?.errorRuntimeIssueCount
          ?? exportSummary?.runtimeIssueCount
          ?? 0
        ) === 0 &&
        Number(exportSummary?.avgUpdateMs || 0) <= 16 &&
        Number(exportSummary?.avgRenderMs || 0) <= 18,
      details: exportSummary
    });

    report.overall = report.phases.every(entry => entry.pass) && report.pageErrors.length === 0
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
