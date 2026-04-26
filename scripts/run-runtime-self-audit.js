const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'runtime_self_audit');
const REPORT_PATH = path.join(OUTPUT_ROOT, 'report.json');
const URL = 'http://127.0.0.1:3000/';
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFileName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function saveShot(page, name) {
  const file = path.join(OUTPUT_ROOT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function waitForGame(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, {
    timeout: 30000,
  });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(1900);
}

async function callDebugAction(page, expression) {
  await page.evaluate(expression);
  await page.waitForTimeout(350);
}

function isAcceptableRoundTripDrift(auditState) {
  if (!auditState || auditState.lastAction !== 'Verify Roundtrip') return false;
  return ['pass', 'warn'].includes(auditState.lastStatus);
}

async function evalAuditState(page) {
  return page.evaluate(async () => {
    const state = typeof gameCore !== 'undefined' ? gameCore.getGameState?.() || {} : {};
    const auditState = typeof debugUI !== 'undefined' && debugUI.auditState
      ? JSON.parse(JSON.stringify(debugUI.auditState))
      : null;
    const replay = typeof gameCore !== 'undefined' ? gameCore.getReplayMetadata?.() || null : null;
    const telemetry = typeof gameCore !== 'undefined' ? gameCore.getTelemetrySnapshot?.() || null : null;
    const spatialFocus = typeof debugUI !== 'undefined' && debugUI.buildSpatialFocusSnapshot
      ? debugUI.buildSpatialFocusSnapshot(state)
      : null;
    const firstButterfly = state.butterflies?.[0] || null;
    const mlRuntime = typeof mlInferenceSystem !== 'undefined'
      ? mlInferenceSystem.getRuntimeSummary?.() || null
      : null;
    const mlSummary = firstButterfly && typeof mlInferenceSystem !== 'undefined'
      ? mlInferenceSystem.getEntitySummary?.(firstButterfly.id, state) || null
      : null;
    const mlInspectRows = mlSummary && typeof gameUI !== 'undefined' && gameUI.buildMlInspectRows
      ? gameUI.buildMlInspectRows(mlSummary)
      : [];
    const mlDebug = typeof debugUI !== 'undefined' && debugUI.buildMlExplainabilitySnapshot
      ? debugUI.buildMlExplainabilitySnapshot(state)
      : null;
    let savedMeta = null;
    try {
      const stored = typeof saveSystem !== 'undefined' && saveSystem?.readPayloadFromStorage
        ? await saveSystem.readPayloadFromStorage('papilionem-save-v2')
        : {
            payload: window.localStorage.getItem('papilionem-save-v2') || null
          };
      savedMeta = JSON.parse(stored?.payload || 'null')?.meta || null;
    } catch (_error) {
      savedMeta = null;
    }
    const blocks = state.blocks || [];
    const roundedBlockPositions = new Map();
    let minBlockX = Number.POSITIVE_INFINITY;
    let maxBlockX = Number.NEGATIVE_INFINITY;
    let minBlockY = Number.POSITIVE_INFINITY;
    let maxBlockY = Number.NEGATIVE_INFINITY;
    for (const block of blocks) {
      if (!Number.isFinite(block?.x) || !Number.isFinite(block?.y)) continue;
      const key = `${Math.round(block.x)},${Math.round(block.y)}`;
      roundedBlockPositions.set(key, (roundedBlockPositions.get(key) || 0) + 1);
      minBlockX = Math.min(minBlockX, block.x);
      maxBlockX = Math.max(maxBlockX, block.x);
      minBlockY = Math.min(minBlockY, block.y);
      maxBlockY = Math.max(maxBlockY, block.y);
    }
    const roundedCounts = [...roundedBlockPositions.values()];
    const currentRefreshRevisions = typeof saveSystem !== 'undefined'
      ? saveSystem.getCurrentRefreshRevisions?.() || null
      : null;
    return {
      debugEnabled: typeof debugUI !== 'undefined' ? !!debugUI.enabled : false,
      auditState,
      spatialFocus,
      mlRuntime,
      mlSummary,
      mlInspectRows,
      mlDebug,
      savedMeta,
      currentRefreshRevisions,
      blockMetrics: {
        count: blocks.length,
        uniqueRoundedPositions: roundedBlockPositions.size,
        maxRoundedOverlap: roundedCounts.length ? Math.max(...roundedCounts) : 0,
        xSpread: Number.isFinite(minBlockX) && Number.isFinite(maxBlockX) ? (maxBlockX - minBlockX) : 0,
        ySpread: Number.isFinite(minBlockY) && Number.isFinite(maxBlockY) ? (maxBlockY - minBlockY) : 0,
      },
      state: {
        butterflies: state.butterflies?.length || 0,
        caterpillars: state.caterpillars?.length || 0,
        flowers: state.flowers?.length || 0,
        blocks: state.blocks?.length || 0,
        activeBattleId: state.activeBattleId || null,
        viewMode: state.viewMode || null,
        focusedZoneId: state.focusedZoneId || null,
        hybridJournal: state.hybridJournal?.length || 0,
      },
      replay,
      telemetry,
    };
  });
}

async function runAction(page, report, label, actionFn, expectFn, screenshotName) {
  await actionFn();
  await page.waitForTimeout(350);
  const state = await evalAuditState(page);
  const pass = expectFn(state);
  const shot = screenshotName ? await saveShot(page, screenshotName) : null;
  report.steps.push({
    label,
    pass,
    screenshot: shot,
    auditState: state.auditState,
    gameState: state.state,
    replay: state.replay,
  });
  return { pass, state, shot };
}

async function main() {
  ensureDir(OUTPUT_ROOT);
  const report = {
    startedAt: new Date().toISOString(),
    url: URL,
    coverage: [
      'startup and title dismissal',
      'debug mode activation',
      'all six audit presets',
      'save/load/roundtrip controls',
      'stale-save environment refresh',
      'post-load spatial focus snapshot',
      'post-load ml feature contract snapshot',
      'snapshot capture and diff',
      'invariant check',
      'gameplay audit',
      'battle snapshot start/resolve/commit',
      'save restoration / cleanup',
    ],
    steps: [],
    consoleMessages: [],
    pageErrors: [],
    server: { reused: false, pid: null },
    cleanup: { restoredStorage: false, resetCalled: false },
    overall: 'pending',
  };

  let browser;
  let page;
  let serverProcess = null;

  try {
    const net = await fetch(URL).then(() => true).catch(() => false);
    if (!net) {
      const { spawn } = require('child_process');
      serverProcess = spawn(process.execPath, ['server.js'], {
        cwd: ROOT,
        detached: true,
        stdio: 'ignore',
      });
      serverProcess.unref();
      report.server.pid = serverProcess.pid;
      for (let i = 0; i < 40; i += 1) {
        const ok = await fetch(URL).then(() => true).catch(() => false);
        if (ok) break;
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    } else {
      report.server.reused = true;
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1600, height: 900 },
    });
    page = await context.newPage();

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      report.consoleMessages.push({ type, text });
    });
    page.on('pageerror', error => {
      report.pageErrors.push(String(error));
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await saveShot(page, '01-title-screen');
    await dismissTitle(page);
    await waitForGame(page);
    await saveShot(page, '02-garden-after-title');

    const savedStorage = await page.evaluate(async (keys) => {
      const localStorageSnapshot = {};
      for (const key of keys) localStorageSnapshot[key] = window.localStorage.getItem(key);
      const primarySave = typeof saveSystem !== 'undefined' && saveSystem?.readPayloadFromStorage
        ? await saveSystem.readPayloadFromStorage('papilionem-save-v2')
        : {
            payload: window.localStorage.getItem('papilionem-save-v2'),
            backend: window.localStorage.getItem('papilionem-save-v2') == null ? null : 'localstorage'
          };
      return {
        localStorageSnapshot,
        primarySavePayload: primarySave?.payload || null,
        primarySaveBackend: primarySave?.backend || null
      };
    }, STORAGE_KEYS);

    await page.keyboard.press('KeyD');
    await page.waitForTimeout(300);
    const debugState = await evalAuditState(page);
    report.steps.push({
      label: 'debug-mode',
      pass: debugState.debugEnabled,
      screenshot: await saveShot(page, '03-debug-mode'),
      auditState: debugState.auditState,
      gameState: debugState.state,
    });

    const presetLabels = [
      'Sleep Assist',
      'Teaching Pair',
      'Trust Cascade',
      'Social Web',
      'Hybrid Lineage',
      'Nursery Lineage',
    ];
    for (let i = 0; i < presetLabels.length; i += 1) {
      const label = presetLabels[i];
      await runAction(
        page,
        report,
        `preset-${sanitizeFileName(label)}`,
        () => callDebugAction(page, () => debugUI?.loadNextAuditPreset?.()),
        state => state.auditState?.lastStatus === 'pass' && state.auditState?.scenarioLabel === label,
        `04-preset-${String(i + 1).padStart(2, '0')}-${sanitizeFileName(label)}`
      );
    }

    await runAction(
      page,
      report,
      'save-game',
      () => page.evaluate(() => debugUI?.saveGameState?.()),
      state => state.auditState?.lastAction === 'Save Game' && state.auditState?.lastStatus === 'pass',
      '05-save-game'
    );

    await runAction(
      page,
      report,
      'load-game',
      () => callDebugAction(page, () => debugUI?.loadGameState?.()),
      state => state.auditState?.lastAction === 'Restore Save' && ['pass', 'idle'].includes(state.auditState?.lastStatus),
      '06-load-game'
    );

    await runAction(
      page,
      report,
      'spatial-focus-after-load',
      () => callDebugAction(page, () => debugUI?.buildSpatialFocusSnapshot?.()),
      state =>
        state.auditState?.lastAction === 'Restore Save' &&
        Array.isArray(state.spatialFocus?.lines) &&
        state.spatialFocus.lines.length >= 3 &&
        state.spatialFocus.title === 'Spatial Focus',
      '06b-spatial-focus-after-load'
    );

    await runAction(
      page,
      report,
      'verify-roundtrip',
      () => callDebugAction(page, () => debugUI?.runRoundTripAudit?.()),
      state => isAcceptableRoundTripDrift(state.auditState),
      '07-roundtrip'
    );

    await runAction(
      page,
      report,
      'refresh-stale-world-save',
      () => page.evaluate(async () => {
        const stored = typeof saveSystem !== 'undefined' && saveSystem?.readPayloadFromStorage
          ? await saveSystem.readPayloadFromStorage('papilionem-save-v2')
          : {
              payload: window.localStorage.getItem('papilionem-save-v2'),
              backend: window.localStorage.getItem('papilionem-save-v2') == null ? null : 'localstorage'
            };
        if (!stored?.payload) return;
        const saved = JSON.parse(stored.payload);
        const focusedZoneId = gameCore?.getGameState?.()?.focusedZoneId
          || saved?.meta?.focusedZoneId
          || gameCore?.getZoneIds?.()?.[0]
          || null;
        const region = focusedZoneId ? gameCore?.getZonePlacementRegion?.(focusedZoneId) : null;
        const collapsedX = region ? region.minX + 18 : 120;
        const collapsedY = region ? region.minY + 18 : 120;
        saved.meta = saved.meta || {};
        saved.meta.refreshRevisions = {
          environmentLayout: 'stale-layout-v0',
          blockLayout: 'stale-blocks-v0',
          butterflyRuntime: 'stale-butterflies-v0',
        };
        saved.blocks = (saved.blocks || []).map((block, index) => ({
          ...block,
          x: collapsedX + (index % 2),
          y: collapsedY + Math.floor(index / 2),
          stackIndex: 0,
          supportBlockId: null,
          lastPlacedMode: 'ground',
          carriedById: null,
          attachedOffset: null,
          movedAtFrame: 0,
          lastMovedById: null,
        }));
        const payload = JSON.stringify(saved);
        if (typeof saveSystem !== 'undefined' && saveSystem?.supportsIndexedDb?.()) {
          try {
            await saveSystem.writePayloadToIndexedDb?.('papilionem-save-v2', payload);
          } catch (_error) {}
        }
        window.localStorage.setItem('papilionem-save-v2', payload);
        await debugUI?.loadGameState?.();
      }),
      state => {
        const savedRevisions = state.savedMeta?.refreshRevisions || {};
        const currentRevisions = state.currentRefreshRevisions || {};
        return state.auditState?.lastAction === 'Restore Save' &&
          state.auditState?.lastStatus === 'pass' &&
          state.state.butterflies >= 1 &&
          state.state.blocks >= 4 &&
          state.blockMetrics.uniqueRoundedPositions >= Math.min(10, state.state.blocks) &&
          state.blockMetrics.maxRoundedOverlap <= 2 &&
          state.blockMetrics.xSpread >= 60 &&
          state.blockMetrics.ySpread >= 24 &&
          savedRevisions.environmentLayout === currentRevisions.environmentLayout &&
          savedRevisions.blockLayout === currentRevisions.blockLayout &&
          savedRevisions.butterflyRuntime === currentRevisions.butterflyRuntime;
      },
      '07b-refresh-stale-world-save'
    );

    await runAction(
      page,
      report,
      'ml-feature-trace-after-load',
      () => callDebugAction(page, () => mlInferenceSystem?.getRuntimeSummary?.()),
      state => {
        const labels = (state.mlInspectRows || []).map(row => row.label);
        const pathRow = (state.mlInspectRows || []).find(row => row.label === 'Path')?.value || '';
        const whyRow = (state.mlInspectRows || []).find(row => row.label === 'Why')?.value || '';
        return state.mlRuntime?.modelVersionId === 'm4-garden-policy-v1' &&
          state.mlRuntime?.featureSchemaVersion === 'm4-feature-schema-v1' &&
          state.mlRuntime?.traceSchemaVersion === 'm4-trace-schema-v1' &&
          state.mlRuntime?.featureContract?.groupCount === 14 &&
        state.mlRuntime?.featureContract?.flatFeatureCount === 98 &&
        state.mlRuntime?.featureContract?.vectorLength === 124 &&
          state.mlRuntime?.performanceBudget?.focusedGardenInferenceMs === 3.5 &&
          state.mlRuntime?.performanceBudget?.battleDecisionMs === 0.75 &&
          !!state.mlRuntime?.performanceProfile &&
          state.mlSummary?.featureTrace?.groupCount === 14 &&
        state.mlSummary?.featureTrace?.flatFeatureCount === 98 &&
        state.mlSummary?.featureTrace?.vectorLength === 124 &&
          labels.includes('Path') &&
          labels.includes('Why') &&
          labels.includes('Schema') &&
          labels.includes('Feat') &&
          labels.includes('Space') &&
          /assets\/ml\//i.test(pathRow) &&
          whyRow.length > 8 &&
          !!state.mlDebug?.focusId &&
          (state.mlDebug?.lines?.length || 0) >= 4;
      },
      '06c-ml-feature-trace-after-load'
    );

    await runAction(
      page,
      report,
      'capture-snapshot',
      () => callDebugAction(page, () => debugUI?.captureSnapshot?.()),
      state => state.auditState?.lastAction === 'Capture Snapshot' && state.auditState?.lastStatus === 'pass',
      '08-capture-snapshot'
    );

    await runAction(
      page,
      report,
      'invariant-check',
      () => callDebugAction(page, () => debugUI?.runInvariantCheck?.()),
      state => state.auditState?.lastAction === 'Check World' && ['pass', 'warn'].includes(state.auditState?.lastStatus),
      '09-invariant-check'
    );

    await runAction(
      page,
      report,
      'gameplay-audit',
      () => callDebugAction(page, () => debugUI?.runGameplayAudit?.()),
      state => state.auditState?.lastAction === 'Audit World' && ['pass', 'warn'].includes(state.auditState?.lastStatus),
      '10-gameplay-audit'
    );

    const battleState = await page.evaluate(() => {
      const state = typeof gameCore !== 'undefined' ? gameCore.getGameState?.() : null;
      const participants = (state?.butterflies || []).slice(0, 2).map((entity, index) => ({
        entity,
        teamId: index === 0 ? 'alpha' : 'beta',
        role: 'combatant',
      }));
      if (participants.length < 2) {
        return { ok: false, reason: 'not-enough-participants' };
      }
      const snapshot = gameCore?.startBattleSession?.(participants, {
        mode: 'audit-skirmish',
        metadata: { source: 'runtime-self-audit' },
      });
      if (!snapshot?.battleId) {
        return { ok: false, reason: 'start-failed' };
      }
      const [first, second] = snapshot.participantOrder;
      battleSystem?.setParticipantAction?.(snapshot.battleId, first, 'support', 'support', second);
      battleSystem?.modifyParticipantHp?.(snapshot.battleId, second, -12);
      battleSystem?.applyPressure?.(snapshot.battleId, second, 3);
      battleSystem?.resolveSnapshot?.(snapshot.battleId, {
        winnerTeamId: 'alpha',
        summary: 'self-audit skirmish',
        metadata: { source: 'runtime-self-audit' },
      });
      const eventsBeforeCommit = battleSystem?.getBattleEvents?.(snapshot.battleId) || [];
      const committed = gameCore?.commitBattleSession?.(snapshot.battleId);
      const stateAfter = gameCore?.getGameState?.();
      return {
        ok: true,
        battleId: snapshot.battleId,
        eventCount: eventsBeforeCommit.length,
        committedState: committed?.state || null,
        activeBattleId: stateAfter?.activeBattleId || null,
        viewMode: stateAfter?.viewMode || null,
      };
    });
    report.steps.push({
      label: 'battle-snapshot-cycle',
      pass: !!battleState.ok && battleState.eventCount > 0 && battleState.activeBattleId === null && battleState.viewMode === 'focused-garden',
      screenshot: await saveShot(page, '11-battle-after-commit'),
      battle: battleState,
      auditState: (await evalAuditState(page)).auditState,
    });

    await page.evaluate(async ({ keys, snapshot }) => {
      const deleteIndexedSave = async (storageKey) => {
        if (typeof saveSystem === 'undefined' || !saveSystem?.supportsIndexedDb?.()) return;
        const database = await saveSystem.openSaveDatabase?.();
        if (!database) return;
        await new Promise((resolve, reject) => {
          const transaction = database.transaction('saveSlots', 'readwrite');
          const store = transaction.objectStore('saveSlots');
          const request = store.delete(storageKey);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error || transaction.error || new Error('Unable to delete indexed save slot'));
          transaction.onabort = () => reject(transaction.error || new Error('Indexed save delete aborted'));
        });
      };

      for (const key of keys) {
        const value = snapshot.localStorageSnapshot?.[key];
        if (value == null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, value);
        }
      }
      if (snapshot.primarySavePayload == null) {
        await deleteIndexedSave('papilionem-save-v2');
        window.localStorage.removeItem('papilionem-save-v2');
      } else if (typeof saveSystem !== 'undefined' && saveSystem?.supportsIndexedDb?.()) {
        await saveSystem.writePayloadToIndexedDb?.('papilionem-save-v2', snapshot.primarySavePayload);
        if (snapshot.primarySaveBackend === 'indexeddb') {
          window.localStorage.removeItem('papilionem-save-v2');
        } else {
          window.localStorage.setItem('papilionem-save-v2', snapshot.primarySavePayload);
        }
      } else {
        window.localStorage.setItem('papilionem-save-v2', snapshot.primarySavePayload);
      }
      gameCore?.resetGame?.(true);
    }, { keys: STORAGE_KEYS, snapshot: savedStorage });
    await page.waitForTimeout(800);
    report.cleanup.restoredStorage = true;
    report.cleanup.resetCalled = true;
    report.cleanup.screenshot = await saveShot(page, '12-post-cleanup');

    const relevantConsole = report.consoleMessages.filter(entry => ['error', 'warning', 'assert'].includes(entry.type));
    const passingSteps = report.steps.filter(step => step.pass).length;
    const finalSnapshot = await evalAuditState(page);
    const avgRenderMs = finalSnapshot?.telemetry?.averages?.renderMs ?? Infinity;
    const avgUpdateMs = finalSnapshot?.telemetry?.averages?.updateMs ?? Infinity;
    report.summary = {
      passingSteps,
      totalSteps: report.steps.length,
      pageErrors: report.pageErrors.length,
      relevantConsoleMessages: relevantConsole.length,
      avgRenderMs,
      avgUpdateMs
    };
    report.overall = passingSteps === report.steps.length &&
      report.pageErrors.length === 0 &&
      relevantConsole.length === 0 &&
      avgRenderMs <= 240 &&
      avgUpdateMs <= 10
      ? 'pass'
      : 'warn';
  } catch (error) {
    report.overall = 'error';
    report.fatalError = error.stack || String(error);
  } finally {
    try {
      if (page && !page.isClosed()) {
        await page.close();
      }
    } catch (_) {}
    try {
      if (browser) {
        await browser.close();
      }
    } catch (_) {}
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ reportPath: REPORT_PATH, overall: report.overall }, null, 2));
    if (report.overall === 'error') process.exitCode = 1;
  }
}

main();
