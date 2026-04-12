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

async function evalAuditState(page) {
  return page.evaluate(() => {
    const state = typeof gameCore !== 'undefined' ? gameCore.getGameState?.() || {} : {};
    const auditState = typeof debugUI !== 'undefined' && debugUI.auditState
      ? JSON.parse(JSON.stringify(debugUI.auditState))
      : null;
    const replay = typeof gameCore !== 'undefined' ? gameCore.getReplayMetadata?.() || null : null;
    const telemetry = typeof gameCore !== 'undefined' ? gameCore.getTelemetrySnapshot?.() || null : null;
    return {
      debugEnabled: typeof debugUI !== 'undefined' ? !!debugUI.enabled : false,
      auditState,
      state: {
        butterflies: state.butterflies?.length || 0,
        caterpillars: state.caterpillars?.length || 0,
        flowers: state.flowers?.length || 0,
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

    const savedStorage = await page.evaluate((keys) => {
      const snapshot = {};
      for (const key of keys) snapshot[key] = window.localStorage.getItem(key);
      return snapshot;
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
        () => page.keyboard.press('KeyP'),
        state => state.auditState?.lastStatus === 'pass' && state.auditState?.scenarioLabel === label,
        `04-preset-${String(i + 1).padStart(2, '0')}-${sanitizeFileName(label)}`
      );
    }

    await runAction(
      page,
      report,
      'save-game',
      () => page.keyboard.press('KeyK'),
      state => state.auditState?.lastAction === 'Save Game' && state.auditState?.lastStatus === 'pass',
      '05-save-game'
    );

    await runAction(
      page,
      report,
      'load-game',
      () => page.keyboard.press('KeyL'),
      state => state.auditState?.lastAction === 'Load Game' && ['pass', 'idle'].includes(state.auditState?.lastStatus),
      '06-load-game'
    );

    await runAction(
      page,
      report,
      'verify-roundtrip',
      () => page.keyboard.press('KeyV'),
      state => state.auditState?.lastAction === 'Verify Roundtrip' && state.auditState?.lastStatus === 'pass',
      '07-roundtrip'
    );

    await runAction(
      page,
      report,
      'capture-snapshot',
      () => page.evaluate(() => debugUI?.captureSnapshot?.()),
      state => state.auditState?.lastAction === 'Capture Snapshot' && state.auditState?.lastStatus === 'pass',
      '08-capture-snapshot'
    );

    await runAction(
      page,
      report,
      'invariant-check',
      () => page.evaluate(() => debugUI?.runInvariantCheck?.()),
      state => state.auditState?.lastAction === 'Check Invariants' && ['pass', 'warn'].includes(state.auditState?.lastStatus),
      '09-invariant-check'
    );

    await runAction(
      page,
      report,
      'gameplay-audit',
      () => page.keyboard.press('KeyY'),
      state => state.auditState?.lastAction === 'Run Gameplay Audit' && ['pass', 'warn'].includes(state.auditState?.lastStatus),
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

    await page.evaluate(({ keys, snapshot }) => {
      for (const key of keys) {
        if (snapshot[key] == null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, snapshot[key]);
        }
      }
      gameCore?.resetGame?.(true);
    }, { keys: STORAGE_KEYS, snapshot: savedStorage });
    await page.waitForTimeout(800);
    report.cleanup.restoredStorage = true;
    report.cleanup.resetCalled = true;
    report.cleanup.screenshot = await saveShot(page, '12-post-cleanup');

    const relevantConsole = report.consoleMessages.filter(entry => ['error', 'warning', 'assert'].includes(entry.type));
    const passingSteps = report.steps.filter(step => step.pass).length;
    report.summary = {
      passingSteps,
      totalSteps: report.steps.length,
      pageErrors: report.pageErrors.length,
      relevantConsoleMessages: relevantConsole.length,
    };
    report.overall = passingSteps === report.steps.length && report.pageErrors.length === 0 && relevantConsole.length === 0
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
