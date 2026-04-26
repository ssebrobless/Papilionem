const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_CAPTURE_ROOT = path.join(ROOT, 'qa_logs', 'session_captures', 'v0-baseline');
const DEFAULT_SCREENSHOT_ROOT = path.join(ROOT, 'qa_screenshots', 'v0_baseline');
const SAVE_EXPORT_ROOT = path.join(ROOT, 'qa_logs', 'save_exports');
const DEFAULT_PORT = 3000;
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1'
];
const DEFAULT_LANES = ['calm', 'shell', 'travel', 'battle', 'soak40'];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function buildUrl(port) {
  return `http://127.0.0.1:${port}/`;
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    quick: false,
    allowFixture: false,
    savePath: null,
    captureRoot: DEFAULT_CAPTURE_ROOT,
    screenshotRoot: DEFAULT_SCREENSHOT_ROOT,
    flagOverrides: null,
    lanes: [...DEFAULT_LANES]
  };
  const envFlagOverrides = process.env.PAPILIONEM_FLAG_OVERRIDES;
  if (envFlagOverrides) {
    args.flagOverrides = JSON.parse(envFlagOverrides);
  }
  for (const arg of argv) {
    if (arg === '--quick') {
      args.quick = true;
    } else if (arg === '--allow-fixture') {
      args.allowFixture = true;
    } else if (arg.startsWith('--capture-root=')) {
      const value = arg.slice('--capture-root='.length).trim();
      if (value) {
        args.captureRoot = path.resolve(ROOT, value);
      }
    } else if (arg.startsWith('--screenshot-root=')) {
      const value = arg.slice('--screenshot-root='.length).trim();
      if (value) {
        args.screenshotRoot = path.resolve(ROOT, value);
      }
    } else if (arg.startsWith('--flag-overrides=')) {
      const value = arg.slice('--flag-overrides='.length).trim();
      if (value) {
        args.flagOverrides = JSON.parse(value);
      }
    } else if (arg.startsWith('--lanes=')) {
      const value = arg.slice('--lanes='.length).trim();
      if (value) {
        const requested = value
          .split(',')
          .map(lane => lane.trim())
          .filter(Boolean);
        const filtered = DEFAULT_LANES.filter(lane => requested.includes(lane));
        if (filtered.length) {
          args.lanes = filtered;
        }
      }
    } else if (!arg.startsWith('--') && !args.savePath) {
      args.savePath = arg;
    }
  }
  return args;
}

async function getRuntimeCapabilities(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}api/runtime-capabilities`);
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    return payload?.ok ? payload : null;
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

  const auditPort = reachable ? 3018 : DEFAULT_PORT;
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

function resolveSavePath(candidate = null, options = {}) {
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
    .map(entry => path.join(SAVE_EXPORT_ROOT, entry.name))
    .map(dir => ({
      dir,
      savePath: path.join(dir, 'save.json'),
      isFixture: /h5-fixture-/.test(dir)
    }))
    .filter(entry => fs.existsSync(entry.savePath))
    .sort((left, right) => right.dir.localeCompare(left.dir));

  const realCandidate = candidates.find(entry => !entry.isFixture) || null;
  if (realCandidate) return realCandidate.savePath;
  if (options.allowFixture) {
    return candidates[0]?.savePath || null;
  }
  return null;
}

function readSaveSummary(savePath) {
  const raw = fs.readFileSync(savePath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    raw,
    isFixture: /h5-fixture-/.test(savePath),
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

async function exportSessionCapture(page, source) {
  return await page.evaluate(async (captureSource) => {
    return await gameCore.telemetrySystem.exportSessionCapture(gameCore.getGameState(), {
      source: captureSource
    });
  }, source);
}

function copyCaptureArtifacts(exportResult, baselineDir, laneSlug) {
  const capturePath = exportResult?.capturePath || null;
  const summaryPath = exportResult?.summaryPath || null;
  if (!capturePath || !summaryPath) {
    throw new Error(`Missing capture artifacts for lane ${laneSlug}`);
  }
  const targetCapturePath = path.join(baselineDir, `capture-${laneSlug}.json`);
  const targetSummaryPath = path.join(baselineDir, `summary-${laneSlug}.txt`);
  fs.copyFileSync(capturePath, targetCapturePath);
  fs.copyFileSync(summaryPath, targetSummaryPath);
  return {
    capturePath: targetCapturePath,
    summaryPath: targetSummaryPath
  };
}

async function calmLane(page, durationMs) {
  await page.evaluate(() => {
    const state = gameCore.getGameState();
    gameUI.activityLogPanel.visible = false;
    gameUI.inspectPanel.visible = false;
    gameUI.accessibilityPanel.visible = false;
    if (gameUI?.butterflyCollection?.visible) {
      gameUI.toggleButterflyCollection?.();
    }
    gameUI.clearInspectSelection?.(state);
    gameCore.setViewMode?.('focused-garden');
  });
  await page.waitForTimeout(durationMs);
}

async function shellLane(page, durationMs) {
  const segmentMs = Math.max(1500, Math.floor(durationMs / 3));
  await page.evaluate(() => {
    const state = gameCore.getGameState();
    gameUI.activityLogPanel.visible = true;
    gameUI.resumeLatestFeedView?.();
    gameUI.inspectPanel.visible = false;
    gameUI.clearInspectSelection?.(state);
    if (gameUI?.butterflyCollection?.visible) {
      gameUI.toggleButterflyCollection?.();
    }
  });
  await page.waitForTimeout(segmentMs);

  await page.evaluate(() => {
    const state = gameCore.getGameState();
    const inspectTarget = (state.butterflies || []).find(entity => entity?.id && !entity.zoneTravel && !entity.isSpawning) || null;
    gameUI.activityLogPanel.visible = false;
    gameUI.inspectPanel.visible = true;
    gameUI.inspectControl.browseScope = 'all';
    if (inspectTarget) {
      gameUI.beginGuidingButterfly?.(inspectTarget, state);
    }
  });
  await page.waitForTimeout(segmentMs);

  await page.evaluate(() => {
    gameUI.activityLogPanel.visible = false;
    gameUI.inspectPanel.visible = false;
    gameUI.clearInspectSelection?.(gameCore.getGameState());
    if (!gameUI.butterflyCollection?.visible) {
      gameUI.toggleButterflyCollection?.();
    }
  });
  await page.waitForTimeout(Math.max(1500, durationMs - (segmentMs * 2)));
}

async function travelLane(page, durationMs) {
  const deadline = Date.now() + durationMs;
  let completedTravels = 0;
  let attemptedTravels = 0;
  let lastTravelError = null;
  while (Date.now() < deadline) {
    const setup = await page.evaluate(() => {
      const state = gameCore.getGameState();
      const zoneIds = gameCore.getZoneIds?.() || [];
      const travelers = (state.butterflies || [])
        .filter(entity => entity?.id && !entity.zoneTravel && !entity.isSpawning);
      for (const traveler of travelers) {
        const sourceZoneId = traveler?.currentZoneId || traveler?.lifeSim?.lifecycle?.currentZoneId || null;
        if (!sourceZoneId) continue;
        const targetZoneIds = zoneIds.filter(zoneId => zoneId !== sourceZoneId);
        for (const targetZoneId of targetZoneIds) {
          gameCore.focusZone?.(sourceZoneId);
          const started = !!gameCore.startZoneTravel?.(traveler, targetZoneId, 'v0-baseline-travel');
          if (!started) continue;
          return {
            ok: true,
            travelerId: traveler.id,
            sourceZoneId,
            targetZoneId
          };
        }
      }
      return { ok: false };
    });
    if (!setup?.ok) {
      await page.waitForTimeout(1000);
      continue;
    }
    attemptedTravels += 1;
    const remainingMs = Math.max(1, deadline - Date.now());
    const timeoutMs = Math.min(45000, Math.max(15000, remainingMs));
    try {
      await page.waitForFunction(({ travelerId, targetZoneId }) => {
        const traveler = (gameCore.getGameState()?.butterflies || []).find(entity => entity.id === travelerId) || null;
        const currentZoneId = traveler?.currentZoneId || traveler?.lifeSim?.lifecycle?.currentZoneId || null;
        return currentZoneId === targetZoneId && !traveler?.zoneTravel;
      }, setup, { timeout: timeoutMs });
      completedTravels += 1;
    } catch (error) {
      lastTravelError = error;
      await page.waitForTimeout(1200);
      continue;
    }
    await page.waitForTimeout(800);
  }
  if (completedTravels < 1) {
    const errorMessage = lastTravelError?.message || 'No travel completed within the allotted lane window.';
    throw new Error(
      `Travel lane completed 0 migrations after ${attemptedTravels} attempts. ${errorMessage}`
    );
  }
}

async function battleLane(page, durationMs) {
  const deadline = Date.now() + durationMs;
  while (Date.now() < deadline) {
    const setup = await page.evaluate(() => {
      const preview = gameCore.buildSinglePlayerAutoBattlePreview?.();
      let snapshot = preview?.canStart
        ? gameCore.startSinglePlayerAutoBattleSession?.({
            maxRounds: 6,
            autoBattleIntervalFrames: 12
          })
        : null;
      if (!snapshot) {
        const butterflies = gameCore.getGameState()?.butterflies || [];
        const leftIds = butterflies.slice(0, 3).map(entity => entity.id);
        const rightIds = butterflies.slice(3, 6).map(entity => entity.id);
        if (leftIds.length >= 1 && rightIds.length >= 1) {
          snapshot = gameCore.startBattleFromSides?.(leftIds, rightIds, {
            mode: 'v0-baseline-battle',
            maxRounds: 6,
            autoBattleIntervalFrames: 12
          }) || null;
        }
      }
      return {
        battleId: snapshot?.battleId || null
      };
    });
    if (!setup?.battleId) {
      await page.waitForTimeout(1000);
      continue;
    }

    await page.waitForFunction((battleId) => {
      return gameCore.getGameState()?.viewMode === 'battle'
        && !!battleSystem.getSnapshot?.(battleId);
    }, setup.battleId, { timeout: 10000 });

    let resolved = false;
    while (Date.now() < deadline) {
      const battleState = await page.evaluate((battleId) => {
        const snapshot = battleSystem.getSnapshot?.(battleId);
        return {
          exists: !!snapshot,
          resolved: !!snapshot?.result,
          roundNumber: snapshot?.roundNumber || snapshot?.metadata?.roundNumber || 0,
          activeBattleId: gameCore.getGameState?.()?.activeBattleId || null,
          viewMode: gameCore.getGameState?.()?.viewMode || 'focused-garden'
        };
      }, setup.battleId);

      if (!battleState?.exists) break;
      if (battleState.resolved) {
        resolved = true;
        break;
      }
      await page.waitForTimeout(400);
    }

    if (!resolved) {
      await page.evaluate((battleId) => {
        const liveSnapshot = battleSystem.getSnapshot?.(battleId);
        if (!liveSnapshot || liveSnapshot.result) {
          return { resolved: !!liveSnapshot?.result, mode: 'already-resolved' };
        }
        const scoreFor = (teamId) => battleSystem.getTeamResolutionScore?.(liveSnapshot, teamId) || 0;
        const leftScore = scoreFor('left');
        const rightScore = scoreFor('right');
        const winnerTeamId = leftScore === rightScore
          ? null
          : (leftScore > rightScore ? 'left' : 'right');
        const roundNumber = liveSnapshot.roundNumber || liveSnapshot.metadata?.roundNumber || 0;
        gameCore.resolveBattleSession?.(battleId, {
          winnerTeamId,
          summary: 'v0 baseline timebox resolution',
          metadata: {
            resolutionMode: 'timebox-score',
            leftScore,
            rightScore,
            roundNumber
          }
        });
        return {
          resolved: true,
          mode: 'timebox-score',
          winnerTeamId,
          leftScore,
          rightScore,
          roundNumber
        };
      }, setup.battleId);
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(900);
    await page.evaluate((battleId) => {
      gameCore.commitBattleSession?.(battleId);
    }, setup.battleId);
    await page.waitForTimeout(1200);
  }
}

async function soakLane(page, durationMs) {
  await page.evaluate(() => {
    gameCore.setViewMode?.('focused-garden');
    gameUI.activityLogPanel.visible = false;
    gameUI.inspectPanel.visible = false;
    if (gameUI?.butterflyCollection?.visible) {
      gameUI.toggleButterflyCollection?.();
    }
  });
  const segmentMs = Math.max(4000, Math.floor(durationMs / 4));
  const zoneIds = await page.evaluate(() => gameCore.getZoneIds?.() || []);
  for (let index = 0; index < 4; index += 1) {
    const nextZoneId = zoneIds[index % Math.max(1, zoneIds.length)] || null;
    if (nextZoneId) {
      await page.evaluate((zoneId) => {
        gameCore.focusZone?.(zoneId);
      }, nextZoneId);
    }
    await page.waitForTimeout(segmentMs);
  }
}

async function runLane(page, baselineDir, laneSlug, durationMs, action, report) {
  await startSessionCapture(page, `v0-baseline-${laneSlug}`);
  await action(page, durationMs);
  const exportResult = await exportSessionCapture(page, `v0-baseline-${laneSlug}`);
  const copied = copyCaptureArtifacts(exportResult, baselineDir, laneSlug);
  report.lanes.push({
    lane: laneSlug,
    durationMs,
    output: copied,
    summary: exportResult?.summary || null
  });
  return exportResult;
}

async function run() {
  const args = parseArgs();
  ensureDir(args.captureRoot);
  ensureDir(args.screenshotRoot);
  const auditId = stamp();
  const baselineDir = path.join(args.captureRoot, auditId);
  const screenshotDir = path.join(args.screenshotRoot, auditId);
  ensureDir(baselineDir);
  ensureDir(screenshotDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    baselineDir,
    screenshotDir,
    server: null,
    saveSource: null,
    lanes: [],
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
    const savePath = resolveSavePath(args.savePath, { allowFixture: args.allowFixture });
    if (!savePath) {
      throw new Error(
        'No real lived-in save export was found under qa_logs/save_exports. Export a real browser save first, or rerun with --allow-fixture for a harness smoke pass.'
      );
    }
    const importedSave = readSaveSummary(savePath);
    if (importedSave.isFixture && !args.allowFixture) {
      throw new Error(
        `Latest export is still the fixture world (${savePath}). Export a real lived-in save first, or rerun with --allow-fixture for a smoke pass.`
      );
    }
    report.saveSource = {
      kind: importedSave.isFixture ? 'fixture-export' : 'real-export',
      savePath,
      summary: importedSave.summary
    };

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1.5
    });
    if (args.flagOverrides && typeof args.flagOverrides === 'object') {
      await context.addInitScript((flagOverrides) => {
        window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = flagOverrides;
      }, args.flagOverrides);
    }
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

    const importDetails = await importSaveIntoPage(page, importedSave.raw);
    report.import = importDetails;
    if (!importDetails.restored) {
      throw new Error('Unable to restore the provided save export into the audit browser');
    }

    const durations = args.quick
      ? {
          calm: 6000,
          shell: 6000,
          travel: 6000,
          battle: 8000,
          soak40: 12000
        }
      : {
          calm: 10 * 60 * 1000,
          shell: 10 * 60 * 1000,
          travel: 10 * 60 * 1000,
          battle: 5 * 60 * 1000,
          soak40: 40 * 60 * 1000
        };

    const laneRunners = {
      calm: calmLane,
      shell: shellLane,
      travel: travelLane,
      battle: battleLane,
      soak40: soakLane
    };
    for (const lane of args.lanes) {
      const runner = laneRunners[lane];
      const durationMs = durations[lane];
      if (!runner || !durationMs) continue;
      await runLane(page, baselineDir, lane, durationMs, runner, report);
    }

    const summary = {
      baselineDir,
      saveKind: report.saveSource.kind,
      lanes: report.lanes.map(entry => ({
        lane: entry.lane,
        avgUpdateMs: Number(entry.summary?.avgUpdateMs || 0),
        avgRenderMs: Number(entry.summary?.avgRenderMs || 0),
        p95FrameMs: Number(entry.summary?.p95FrameMs || 0),
        peakHeapUsedMB: Number(entry.summary?.peakHeapUsedMB || 0),
        pressureTier: entry.summary?.pressureTier || 'unknown'
      }))
    };
    report.overall = report.pageErrors.length === 0 ? 'pass' : 'warn';
    fs.writeFileSync(path.join(baselineDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(path.join(baselineDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
    console.log(JSON.stringify({ baselineDir, overall: report.overall, saveKind: report.saveSource.kind }, null, 2));
  } catch (error) {
    report.overall = 'fail';
    report.error = error?.stack || String(error);
    fs.writeFileSync(path.join(baselineDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify({ baselineDir, overall: report.overall, error: report.error }, null, 2));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
}

run();
