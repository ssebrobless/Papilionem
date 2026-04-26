const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'v0_5_save_migration_proof');
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

function buildUrl(port) {
  return `http://127.0.0.1:${port}/`;
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
  if (reachable && capabilities?.saveExport) {
    report.server = { reused: true, pid: null, port: DEFAULT_PORT };
    return defaultUrl;
  }

  const auditPort = reachable ? 3022 : DEFAULT_PORT;
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

  const ready = await waitForServer(auditUrl);
  if (!ready) {
    throw new Error(`Server did not become reachable on port ${auditPort}`);
  }
  return auditUrl;
}

function resolveSavePath(candidate = null) {
  if (candidate) {
    const resolved = path.resolve(ROOT, candidate);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Provided save export path does not exist: ${resolved}`);
    }
    if (fs.statSync(resolved).isDirectory()) {
      const savePath = path.join(resolved, 'save.json');
      if (!fs.existsSync(savePath)) {
        throw new Error(`Provided save export directory is missing save.json: ${resolved}`);
      }
      return savePath;
    }
    return resolved;
  }

  const candidates = fs.readdirSync(SAVE_EXPORT_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(SAVE_EXPORT_ROOT, entry.name))
    .map(dir => ({
      dir,
      savePath: path.join(dir, 'save.json'),
      isFixture: /h5-fixture-/.test(dir)
    }))
    .filter(entry => fs.existsSync(entry.savePath) && !entry.isFixture)
    .sort((left, right) => right.dir.localeCompare(left.dir));

  const latest = candidates[0];
  if (!latest) {
    throw new Error('No real save export was found under qa_logs/save_exports');
  }
  return latest.savePath;
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

async function importSaveIntoPage(page, rawSave) {
  return await page.evaluate(async ({ rawSave, storageKeys }) => {
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
      butterflies: (state?.butterflies || []).length,
      flowers: (state?.flowers || []).length,
      blocks: (state?.blocks || []).length,
      focusedZoneId: state?.focusedZoneId || null,
      viewMode: state?.viewMode || 'focused-garden',
      hybridJournalCount: state?.hybridJournal?.length || 0
    };
  }, {
    rawSave,
    storageKeys: STORAGE_KEYS
  });
}

function readSaveSummary(savePath) {
  const raw = fs.readFileSync(savePath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    raw,
    summary: {
      butterflyCount: Array.isArray(parsed?.butterflies) ? parsed.butterflies.length : 0,
      flowerCount: Array.isArray(parsed?.flowers) ? parsed.flowers.length : 0,
      blockCount: Array.isArray(parsed?.blocks) ? parsed.blocks.length : 0,
      hybridJournalCount: Array.isArray(parsed?.progression?.hybridJournal) ? parsed.progression.hybridJournal.length : 0,
      focusedZoneId: parsed?.meta?.focusedZoneId || null
    }
  };
}

async function exportDerivedSave(page) {
  return await page.evaluate(async () => {
    const state = gameCore.getGameState();
    state.paused = false;
    state.timeScale = 1;
    gameUI.activityLogPanel.visible = false;
    gameUI.inspectPanel.visible = false;
    gameUI.clearInspectSelection?.(state);

    // Let the lived-in world advance a little so this is a distinct real export.
    const traveler = (state.butterflies || []).find(entity => entity?.id && !entity.zoneTravel && !entity.isSpawning) || null;
    const sourceZoneId = traveler?.currentZoneId || traveler?.lifeSim?.lifecycle?.currentZoneId || null;
    const targetZoneId = (gameCore.getZoneIds?.() || []).find(zoneId => zoneId !== sourceZoneId) || null;
    if (traveler?.id && sourceZoneId && targetZoneId) {
      gameCore.focusZone?.(sourceZoneId);
      gameCore.startZoneTravel?.(traveler, targetZoneId, 'v0-5-derived-save-proof');
    }
    await new Promise(resolve => setTimeout(resolve, 1200));

    const response = await fetch('/api/save-exports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        label: 'v0-5-derived-real',
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
      outputDir: payload.outputDir || null,
      savePath: payload.savePath || null,
      summaryPath: payload.summaryPath || null,
      summary: payload.summary || null
    };
  });
}

async function verifyDerivedRestore(page, rawSave) {
  const imported = await importSaveIntoPage(page, rawSave);
  if (!imported?.restored) {
    throw new Error('Derived save failed to restore in the verification browser');
  }
  return await page.evaluate(async () => {
    await gameCore.saveGameToStorage?.({ source: 'v0.5-derived-proof' });
    const stored = await saveSystem.readPayloadFromStorage('papilionem-save-v2');
    const state = gameCore.getGameState();
    return {
      backend: stored?.backend || null,
      butterflies: (state?.butterflies || []).length,
      flowers: (state?.flowers || []).length,
      blocks: (state?.blocks || []).length,
      focusedZoneId: state?.focusedZoneId || null,
      viewMode: state?.viewMode || 'focused-garden',
      hybridJournalCount: state?.hybridJournal?.length || 0
    };
  });
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    server: null,
    sourceSave: null,
    derivedSave: null,
    importSummary: null,
    verification: null,
    overall: 'pending'
  };

  let browser;
  let context;
  let page;
  let verifyContext;
  let verifyPage;

  try {
    const baseUrl = await ensureServer(report);
    report.url = baseUrl;

    const savePath = resolveSavePath(process.argv[2] || null);
    const sourceSave = readSaveSummary(savePath);
    report.sourceSave = {
      savePath,
      summary: sourceSave.summary
    };

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    report.importSummary = await importSaveIntoPage(page, sourceSave.raw);
    if (!report.importSummary?.restored) {
      throw new Error('Source real save failed to restore in the export browser');
    }

    const exportResult = await exportDerivedSave(page);
    if (!exportResult?.ok || !exportResult?.savePath) {
      throw new Error(exportResult?.error || 'Derived real save export failed');
    }
    report.derivedSave = exportResult;

    const derivedRawSave = fs.readFileSync(exportResult.savePath, 'utf8');
    verifyContext = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    verifyPage = await verifyContext.newPage();
    await verifyPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForGame(verifyPage);
    await dismissTitle(verifyPage);

    report.verification = await verifyDerivedRestore(verifyPage, derivedRawSave);
    report.overall = report.verification?.backend === 'indexeddb' ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'fail';
    report.error = error?.stack || String(error);
  } finally {
    if (verifyContext) await verifyContext.close();
    if (context) await context.close();
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify({ reportPath, overall: report.overall, derivedSave: report.derivedSave?.savePath || null }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
