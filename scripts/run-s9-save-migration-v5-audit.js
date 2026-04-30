const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 's9_save_migration_v5_audit');
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
    return null;
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
    if (ok) return serverProcess;
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
  await page.waitForTimeout(1200);
}

async function main() {
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);
  const report = {
    startedAt: new Date().toISOString(),
    outputDir,
    url: URL,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    checks: [],
    overall: 'pending'
  };

  const check = (name, pass, details = {}) => {
    report.checks.push({ name, pass: !!pass, details });
    if (!pass) {
      throw new Error(`${name} failed: ${JSON.stringify(details)}`);
    }
  };

  let browser;
  let context;
  let serverProcess = null;

  try {
    serverProcess = await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript((storageKeys) => {
      storageKeys.forEach(key => window.localStorage.removeItem(key));
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    }, STORAGE_KEYS);

    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    const result = await page.evaluate(async () => {
      const clone = value => JSON.parse(JSON.stringify(value ?? null));
      const failures = [];
      const notes = {};
      const issueCounts = { clamp: 0, stackFallback: 0 };
      const approxEqual = (a, b, epsilon = 0.001) => Math.abs((a ?? 0) - (b ?? 0)) <= epsilon;

      const countRuntimeIssues = () => {
        const telemetry = gameCore.getTelemetrySnapshot?.() || {};
        const runtimeIssues = telemetry.runtimeIssues || telemetry.recentRuntimeIssues || [];
        const flat = Array.isArray(runtimeIssues)
          ? runtimeIssues
          : Object.values(runtimeIssues).flatMap(value => Array.isArray(value) ? value : []);
        issueCounts.clamp = flat.filter(issue => issue?.type === 'save-migration-clamp').length;
        issueCounts.stackFallback = flat.filter(issue => issue?.type === 'save-migration-stack-fallback').length;
      };

      const stripV5Fields = (payload) => {
        payload.version = 4;
        if (payload.meta) {
          payload.meta.refreshRevisions = saveSystem.getCurrentRefreshRevisions?.() || payload.meta.refreshRevisions;
          delete payload.meta.saveMigration;
        }
        for (const collectionName of ['butterflies', 'flowers', 'caterpillars', 'blocks']) {
          for (const entity of payload[collectionName] || []) {
            delete entity.boardPos;
            if (entity.eggData) delete entity.eggData.boardPos;
            if (entity.chrysalisData) delete entity.chrysalisData.boardPos;
            if (entity.zoneTravel) delete entity.zoneTravel.migrationIntent;
          }
        }
        if (payload.foundations?.zones) {
          delete payload.foundations.zones.boardConfigs;
          delete payload.foundations.zones.boardConfig;
        }
        return payload;
      };

      const collectEntityBoardPositions = (payload) => {
        const rows = [];
        for (const collectionName of ['butterflies', 'flowers', 'caterpillars', 'blocks']) {
          for (const entity of payload[collectionName] || []) {
            rows.push({
              type: collectionName,
              id: entity.id,
              currentZoneId: entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null,
              boardPos: entity.boardPos || null
            });
            if (entity.eggData) {
              rows.push({
                type: 'eggData',
                id: `${entity.id}:egg`,
                currentZoneId: entity.currentZoneId || entity.eggData?.lifecycleData?.currentZoneId || null,
                boardPos: entity.eggData.boardPos || null
              });
            }
            if (entity.chrysalisData) {
              rows.push({
                type: 'chrysalisData',
                id: `${entity.id}:chrysalis`,
                currentZoneId: entity.currentZoneId || entity.chrysalisData?.lifecycleData?.currentZoneId || null,
                boardPos: entity.chrysalisData.boardPos || null
              });
            }
          }
        }
        return rows;
      };

      const validateBoardRows = (payload) => {
        const rows = collectEntityBoardPositions(payload);
        const invalid = [];
        for (const row of rows) {
          const boardPos = row.boardPos;
          if (
            !boardPos
            || !boardPos.zoneId
            || !Number.isFinite(boardPos.u)
            || !Number.isFinite(boardPos.v)
            || !Number.isFinite(boardPos.h)
          ) {
            invalid.push({ ...row, reason: 'missing-or-nonfinite-board-pos' });
            continue;
          }
          const board = zoneSystem.getBoardConfigForZone?.(boardPos.zoneId);
          if (!board) {
            invalid.push({ ...row, reason: 'missing-zone-board-config' });
            continue;
          }
          if (
            boardPos.u < -0.001
            || boardPos.v < -0.001
            || boardPos.h < -0.001
            || boardPos.u > (board.widthUnits || 0) + 0.001
            || boardPos.v > (board.depthUnits || 0) + 0.001
          ) {
            invalid.push({
              ...row,
              reason: 'outside-zone-bounds',
              board: {
                widthUnits: board.widthUnits,
                depthUnits: board.depthUnits
              }
            });
          }
        }
        return { rows, invalid };
      };

      const signatureById = (payload) => {
        const entries = {};
        for (const butterfly of payload.butterflies || []) {
          entries[butterfly.id] = clone({
            id: butterfly.id,
            currentZoneId: butterfly.currentZoneId,
            displayName: butterfly.displayName,
            personalName: butterfly.personalName,
            specialAbility: butterfly.specialAbility,
            birthSource: butterfly.birthSource,
            pregnancy: butterfly.pregnancy,
            breeding: butterfly.breeding,
            wildLifecycle: butterfly.wildLifecycle,
            hybridGenome: butterfly.hybridGenome,
            mutationProfile: butterfly.mutationProfile,
            isHybrid: butterfly.isHybrid,
            hybridEntryId: butterfly.hybridEntryId,
            lifeSim: {
              identity: butterfly.lifeSim?.identity || null,
              genetics: butterfly.lifeSim?.genetics || null,
              drives: butterfly.lifeSim?.drives || null,
              emotions: butterfly.lifeSim?.emotions || null,
              memories: butterfly.lifeSim?.memories || null,
              social: butterfly.lifeSim?.social || null,
              socialEdges: butterfly.lifeSim?.socialEdges || null,
              communication: butterfly.lifeSim?.communication || null,
              routines: butterfly.lifeSim?.routines || null,
              interpretation: butterfly.lifeSim?.interpretation || null,
              socialEcology: butterfly.lifeSim?.socialEcology || null,
              distortion: butterfly.lifeSim?.distortion || null,
              upbringing: butterfly.lifeSim?.upbringing || null,
              lifecycle: butterfly.lifeSim?.lifecycle || null
            }
          });
        }
        return entries;
      };

      const stableString = value => JSON.stringify(value, Object.keys(value || {}).sort());
      const compareSignatures = (before, after) => {
        const mismatches = [];
        const ids = new Set([...Object.keys(before), ...Object.keys(after)]);
        for (const id of ids) {
          if (JSON.stringify(before[id] ?? null) !== JSON.stringify(after[id] ?? null)) {
            mismatches.push({ id, before: before[id] || null, after: after[id] || null });
          }
        }
        return mismatches;
      };

      const compareBoardDrift = (beforePayload, afterPayload) => {
        const before = new Map(collectEntityBoardPositions(beforePayload).map(row => [row.id, row]));
        const drift = [];
        for (const row of collectEntityBoardPositions(afterPayload)) {
          const prior = before.get(row.id);
          if (!prior?.boardPos || !row.boardPos) continue;
          if (
            prior.boardPos.zoneId !== row.boardPos.zoneId
            || !approxEqual(prior.boardPos.u, row.boardPos.u)
            || !approxEqual(prior.boardPos.v, row.boardPos.v)
            || !approxEqual(prior.boardPos.h, row.boardPos.h)
          ) {
            drift.push({ id: row.id, before: prior.boardPos, after: row.boardPos });
          }
        }
        return drift;
      };

      const buildLivedInSave = async () => {
        const preset = debugUI?.buildAuditPresetState?.('social-routine-web');
        if (preset) {
          gameCore.applySerializedState(preset);
        } else {
          await gameCore.resetGame(true);
        }
        const state = gameCore.getGameState();
        state.paused = false;
        state.timeScale = 1;
        gameUI.activityLogPanel.visible = false;
        gameUI.inspectPanel.visible = false;
        state.showButterflyCollection = false;
        gameUI.clearInspectSelection?.(state);
        for (let i = 0; i < 30; i += 1) {
          gameCore.update?.();
        }

        const refreshed = gameCore.getGameState();
        const flowers = refreshed.flowers || [];
        const butterflies = refreshed.butterflies || [];
        if (flowers[0] && butterflies[0]) {
          flowers[0].eggData = flowers[0].eggData || {
            motherId: butterflies[0].id,
            fatherId: butterflies[1]?.id || null,
            hatchFrame: gameCore.getCurrentFrame?.() + 600,
            lifecycleData: { currentZoneId: flowers[0].currentZoneId || refreshed.focusedZoneId || null }
          };
          flowers[0].occupancyState = 'egg';
          flowers[0].allowedButterflyId = butterflies[0].id;
        }
        if (flowers[1] && butterflies[1]) {
          flowers[1].chrysalisData = flowers[1].chrysalisData || {
            butterflyId: butterflies[1].id,
            hatchFrame: gameCore.getCurrentFrame?.() + 900,
            lifecycleData: { currentZoneId: flowers[1].currentZoneId || refreshed.focusedZoneId || null }
          };
          flowers[1].occupancyState = 'chrysalis';
          flowers[1].allowedButterflyId = butterflies[1].id;
        }
        if ((refreshed.blocks || []).length >= 2) {
          const base = refreshed.blocks[0];
          const stacked = refreshed.blocks[1];
          stacked.currentZoneId = base.currentZoneId;
          stacked.stackIndex = 1;
          stacked.supportBlockId = base.id;
          stacked.boardPos = {
            ...(base.boardPos || saveSystem.serializeBoardPos(base) || { zoneId: base.currentZoneId, u: 1, v: 1, h: 0 }),
            h: 1
          };
          const projected = renderManager.boardToScreen?.(stacked.boardPos);
          if (projected) {
            stacked.x = projected.x;
            stacked.y = projected.y;
          }
        }
        return saveSystem.serializeState(refreshed);
      };

      const beforeV5 = await buildLivedInSave();
      const beforeSignature = signatureById(beforeV5);
      const v4Payload = stripV5Fields(clone(beforeV5));
      const v4EntityCount = ['butterflies', 'flowers', 'caterpillars', 'blocks']
        .reduce((count, key) => count + ((v4Payload[key] || []).length), 0);

      const normalizedMigrated = saveSystem.deserializeState(v4Payload);
      notes.normalizedMigrationMeta = normalizedMigrated.meta?.saveMigration || null;
      const normalizedBoard = validateBoardRows(normalizedMigrated);
      if (normalizedMigrated.version !== 5) failures.push('deserializeState did not bump v4 payload to version 5');
      if (normalizedBoard.invalid.length) failures.push(`normalized migration has ${normalizedBoard.invalid.length} invalid boardPos rows`);
      if (!normalizedMigrated.foundations?.zones?.boardConfigs) failures.push('normalized migration missing foundations.zones.boardConfigs');

      const applied = saveSystem.applyDeserializedState(gameCore, v4Payload);
      if (!applied || applied.version !== 5) failures.push('applyDeserializedState did not return v5 normalized state');

      const afterLoad = saveSystem.serializeState(gameCore.getGameState());
      const afterLoadBoard = validateBoardRows(afterLoad);
      if (afterLoad.version !== 5) failures.push('serialized migrated state is not v5');
      if (afterLoadBoard.invalid.length) failures.push(`serialized migrated state has ${afterLoadBoard.invalid.length} invalid boardPos rows`);
      if (!afterLoad.foundations?.zones?.boardConfigs) failures.push('serialized migrated state missing foundations.zones.boardConfigs');

      const v5RoundTripPayload = clone(afterLoad);
      const appliedAgain = saveSystem.applyDeserializedState(gameCore, v5RoundTripPayload);
      if (!appliedAgain || appliedAgain.version !== 5) failures.push('v5 reload did not return v5 normalized state');
      const afterReload = saveSystem.serializeState(gameCore.getGameState());
      const afterReloadBoard = validateBoardRows(afterReload);
      if (afterReloadBoard.invalid.length) failures.push(`v5 reload has ${afterReloadBoard.invalid.length} invalid boardPos rows`);

      const countSummary = (payload) => ({
        butterflies: (payload.butterflies || []).length,
        flowers: (payload.flowers || []).length,
        caterpillars: (payload.caterpillars || []).length,
        blocks: (payload.blocks || []).length
      });
      const beforeCounts = countSummary(beforeV5);
      const afterCounts = countSummary(afterReload);
      if (JSON.stringify(beforeCounts) !== JSON.stringify(afterCounts)) {
        failures.push('entity counts changed through v4->v5->v5 round trip');
      }

      const afterLoadSignature = signatureById(afterLoad);
      const afterReloadSignature = signatureById(afterReload);
      const loadSignatureMismatches = compareSignatures(beforeSignature, afterLoadSignature);
      const reloadSignatureMismatches = compareSignatures(afterLoadSignature, afterReloadSignature);
      if (loadSignatureMismatches.length) failures.push(`social/biological signature drifted on v4 load (${loadSignatureMismatches.length})`);
      if (reloadSignatureMismatches.length) failures.push(`social/biological signature drifted on v5 reload (${reloadSignatureMismatches.length})`);

      const boardDrift = compareBoardDrift(afterLoad, afterReload);
      if (boardDrift.length) failures.push(`boardPos drifted after v5 reload (${boardDrift.length})`);

      const oldPreference = gameConfig.save.preferV5OnRead;
      let preferV4Probe = null;
      try {
        const butterfly = clone(afterLoad.butterflies?.[0]);
        if (butterfly) {
          const fromScreen = saveSystem.clampBoardPosToZone(saveSystem.computeBoardPosFromScreen(butterfly, {
            zoneId: butterfly.currentZoneId,
            includeShadowOffset: true
          }), butterfly.id);
          butterfly.boardPos = {
            zoneId: butterfly.currentZoneId,
            u: Math.min((zoneSystem.getBoardConfigForZone(butterfly.currentZoneId)?.widthUnits || 10) - 0.5, (fromScreen?.u || 0) + 4),
            v: Math.min((zoneSystem.getBoardConfigForZone(butterfly.currentZoneId)?.depthUnits || 10) - 0.5, (fromScreen?.v || 0) + 4),
            h: fromScreen?.h || 0
          };
          gameConfig.save.preferV5OnRead = false;
          const restored = saveSystem.getRestoredEntityBoardPos(butterfly, {
            zoneId: butterfly.currentZoneId,
            includeShadowOffset: true
          });
          preferV4Probe = { fromScreen, bogusBoardPos: butterfly.boardPos, restored };
          if (!fromScreen || !restored || !approxEqual(fromScreen.u, restored.u) || !approxEqual(fromScreen.v, restored.v)) {
            failures.push('preferV5OnRead=false did not prefer x/y-derived boardPos');
          }
        }
      } finally {
        gameConfig.save.preferV5OnRead = oldPreference;
      }

      countRuntimeIssues();
      const issueBudget = Math.max(1, Math.floor(v4EntityCount * 0.01));
      if (issueCounts.clamp > issueBudget) failures.push(`save-migration-clamp issue count ${issueCounts.clamp} exceeds budget ${issueBudget}`);
      if (issueCounts.stackFallback > issueBudget) failures.push(`save-migration-stack-fallback issue count ${issueCounts.stackFallback} exceeds budget ${issueBudget}`);

      notes.counts = { before: beforeCounts, after: afterCounts };
      notes.boardRows = {
        normalized: normalizedBoard.rows.length,
        afterLoad: afterLoadBoard.rows.length,
        afterReload: afterReloadBoard.rows.length
      };
      notes.invalidBoardRows = {
        normalized: normalizedBoard.invalid.slice(0, 10),
        afterLoad: afterLoadBoard.invalid.slice(0, 10),
        afterReload: afterReloadBoard.invalid.slice(0, 10)
      };
      notes.signatureMismatches = {
        load: loadSignatureMismatches.slice(0, 5),
        reload: reloadSignatureMismatches.slice(0, 5)
      };
      notes.boardDrift = boardDrift.slice(0, 10);
      notes.runtimeIssues = { ...issueCounts, issueBudget };
      notes.preferV4Probe = preferV4Probe;
      notes.mlRuntimeSummary = mlInferenceSystem.getRuntimeSummary?.() || null;
      notes.stableSignatureHash = {
        before: stableString(beforeSignature).length,
        afterLoad: stableString(afterLoadSignature).length,
        afterReload: stableString(afterReloadSignature).length
      };

      return {
        pass: failures.length === 0,
        failures,
        notes
      };
    });

    check('v4 to v5 lived-in save migration', result.pass, result);
    await page.screenshot({ path: path.join(outputDir, 's9-save-migration-v5.png'), fullPage: true });

    if (report.pageErrors.length || report.consoleErrors.length) {
      throw new Error(`Browser errors observed: ${JSON.stringify({ pageErrors: report.pageErrors, consoleErrors: report.consoleErrors })}`);
    }

    report.overall = 'pass';
  } catch (error) {
    report.overall = 'fail';
    report.error = error?.stack || String(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (serverProcess) {
      try {
        process.kill(-serverProcess.pid);
      } catch (_error) {
        // Ignore server shutdown failures.
      }
    }
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      outputDir,
      checks: report.checks.map(check => ({ name: check.name, pass: check.pass })),
      error: report.error || null
    }, null, 2));
  }
}

main();
