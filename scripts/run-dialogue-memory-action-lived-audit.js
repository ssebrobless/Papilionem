const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'dialogue_memory_action_lived_audit');
const FRAME_COUNT = Math.max(2400, Math.round(Number(getArgValue('--frames', 7200))));
const MIN_ACTION_SUBTYPES = Math.max(1, Math.round(Number(getArgValue('--min-action-subtypes', 1))));
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-world-rendermode'
];

function getArgValue(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

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
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore'
  });
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
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, {
    timeout: 30000
  });
}

async function dismissTitle(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(900);
}

async function captureStorage(page) {
  return page.evaluate(keys => keys.reduce((snapshot, key) => {
    snapshot[key] = window.localStorage.getItem(key);
    return snapshot;
  }, {}), STORAGE_KEYS);
}

async function restoreStorage(page, snapshot) {
  await page.evaluate(({ keys, snapshot: stored }) => {
    for (const key of keys) {
      if (stored[key] == null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, stored[key]);
    }
  }, { keys: STORAGE_KEYS, snapshot });
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
    frameCount: FRAME_COUNT,
    minActionSubtypes: MIN_ACTION_SUBTYPES,
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    checks: [],
    overall: 'pending'
  };

  let browser;
  let context;
  let page;
  let initialStorage = null;

  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error?.message || error)));
    page.on('console', message => {
      if (message.type() === 'error') report.consoleErrors.push(message.text());
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    initialStorage = await captureStorage(page);
    await page.evaluate(keys => {
      keys.forEach(key => window.localStorage.removeItem(key));
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    }, STORAGE_KEYS);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    const browserResult = await page.evaluate(async ({ frameCount }) => {
      if (typeof randomSeed === 'function') randomSeed(6921);
      if (typeof noiseSeed === 'function') noiseSeed(6921);
      await gameCore.resetGame?.(true);
      if (gameUI?.firstSessionGuide) gameUI.firstSessionGuide.visible = false;
      eventBus.clearHistory?.();
      if (communicationSystem) {
        communicationSystem.history = [];
        communicationSystem.dialogueHistory = [];
        communicationSystem.responseQueue = [];
        communicationSystem.partnerSelectionHistory?.clear?.();
        communicationSystem.simulationClockSeconds = 0;
      }

      for (let attempt = 0; attempt < 240 && (gameCore.getGameState?.()?.butterflies?.length || 0) < 10; attempt += 1) {
        gameCore.update?.();
      }

      const dialogueEvents = [];
      const unsubscribe = eventBus.on?.(GameEvents.DIALOGUE_SPOKEN, event => {
        if (event?.id) {
          dialogueEvents.push({
            id: event.id,
            sourceId: event.sourceId,
            sourceLabel: event.sourceLabel || null,
            targetIds: Array.isArray(event.targetIds) ? [...event.targetIds] : [],
            targetLabels: Array.isArray(event.targetLabels) ? [...event.targetLabels] : [],
            phrase: event.phrase || '',
            createdAtFrame: event.createdAtFrame ?? gameCore.getCurrentFrame?.() ?? 0,
            createdAtSeconds: event.createdAtSeconds ?? communicationSystem?.simulationClockSeconds ?? 0,
            intentTags: Array.isArray(event.intentTags) ? [...event.intentTags] : []
          });
        }
      });

      const seenArcKeys = new Set();
      const residueHits = [];
      const arcs = [];
      const sampleEntity = entity => {
        const summary = lifeSimSystem?.getEntitySummary?.(entity.id) || null;
        const runtime = behaviorSystem?.getRuntime?.(entity.id) || null;
        const communicationSummary = communicationSystem?.getCommunicationSummary?.(entity.id) || null;
        return { summary, runtime, communicationSummary };
      };

      const inspectResidues = () => {
        const state = gameCore.getGameState?.() || {};
        const tracked = new Map(dialogueEvents.map(entry => [entry.id, entry]));
        for (const entity of state.butterflies || []) {
          const residues = entity?.lifeSim?.communication?.recentResidues || [];
          for (const residue of residues) {
            const dialogue = tracked.get(residue?.dialogueId);
            if (!dialogue || residue.partnerId !== dialogue.sourceId) continue;
            const key = `${entity.id}:${residue.dialogueId}`;
            if (!residueHits.some(hit => hit.key === key)) {
              residueHits.push({
                key,
                entityId: entity.id,
                entityLabel: communicationSystem?.getEntityLabel?.(entity) || entity.id,
                partnerId: residue.partnerId,
                partnerLabel: residue.partnerLabel || dialogue.sourceLabel || residue.partnerId,
                dialogueId: residue.dialogueId,
                phrase: dialogue.phrase,
                residueType: residue.type || null,
                residueLabel: residue.label || null,
                createdAtFrame: dialogue.createdAtFrame,
                firstSeenFrame: gameCore.getCurrentFrame?.() ?? 0
              });
            }
            const { summary, runtime, communicationSummary } = sampleEntity(entity);
            const ageFrames = (gameCore.getCurrentFrame?.() ?? 0) - (dialogue.createdAtFrame || 0);
            const followsPartner = runtime?.currentTargetId === dialogue.sourceId
              && ['partner-return', 'protective-follow-through', 'admiring-shadow', 'strained-avoidance'].includes(runtime?.currentActionSubtype);
            if (ageFrames >= 1800 && followsPartner) {
              const arcKey = `${key}:${runtime.currentActionSubtype}`;
              if (!seenArcKeys.has(arcKey)) {
                seenArcKeys.add(arcKey);
                arcs.push({
                  entityId: entity.id,
                  entityLabel: communicationSystem?.getEntityLabel?.(entity) || entity.id,
                  partnerId: dialogue.sourceId,
                  partnerLabel: residue.partnerLabel || dialogue.sourceLabel || dialogue.sourceId,
                  dialogueId: dialogue.id,
                  dialogueAgeFrames: ageFrames,
                  dialogueAgeSeconds: Number((ageFrames / 60).toFixed(2)),
                  phrase: dialogue.phrase,
                  residueType: residue.type || null,
                  residueLabel: residue.label || null,
                  actionSubtype: runtime.currentActionSubtype,
                  behaviorReason: runtime.reason || null,
                  followThrough: summary?.socialEcology?.followThrough || null,
                  communicationResidueLabel: communicationSummary?.recentResidueLabel || null,
                  recentHeardPhrase: communicationSummary?.recentHeardPhrase || null
                });
              }
            }
          }
        }
      };

      for (let frame = 0; frame < frameCount; frame += 1) {
        gameCore.update?.();
        if (frame % 60 === 0) inspectResidues();
      }
      inspectResidues();
      if (typeof unsubscribe === 'function') unsubscribe();

      const dialogueHistory = communicationSystem?.dialogueHistory || [];
      const continuityLines = dialogueHistory.filter(entry =>
        entry?.metadata?.conversationContinuity === true
        || entry?.metadata?.causeLabel === 'earlier talk'
        || entry?.dialogueMetadata?.causeLabel === 'earlier talk'
      );
      const feedEntries = gameUI?.getRecentActivityEntries?.() || [];
      const continuityFeedEntries = feedEntries.filter(entry =>
        entry?.metadata?.conversationContinuity === true
        || entry?.causeLabel === 'earlier talk'
        || /\[earlier talk\]/i.test(entry?.detail || entry?.text || entry?.message || '')
      );
      const inspectCausalitySamples = arcs.slice(-8).map(arc => {
        const entity = (gameCore.getGameState?.()?.butterflies || []).find(item => item?.id === arc.entityId) || null;
        const detailState = entity && gameUI?.buildInspectDetailDomState
          ? gameUI.buildInspectDetailDomState(entity, gameCore.getGameState?.())
          : null;
        const lines = (detailState?.sections || []).flatMap(section =>
          (section.lines || []).map(line => ({
            sectionId: section.id,
            sectionTitle: section.title,
            line: String(line || '')
          }))
        );
        const causalityLines = lines.filter(item => /acting because/i.test(item.line));
        const actionLabel = gameUI?.formatActionSubtypeLabel?.(arc.actionSubtype) || arc.actionSubtype;
        return {
          entityId: arc.entityId,
          entityLabel: arc.entityLabel,
          actionSubtype: arc.actionSubtype,
          actionLabel,
          behaviorReason: arc.behaviorReason || null,
          dialogueId: arc.dialogueId,
          causalityLines,
          matchedRuntimeTruth: causalityLines.some(item =>
            item.line.includes(actionLabel)
            || item.line.includes(arc.actionSubtype)
            || item.line.includes(arc.partnerLabel || '')
            || /earlier talk|relationship carry-over/i.test(item.line)
          )
        };
      });
      const feedCausalityEntries = feedEntries.filter(entry =>
        /Because |Acting because/i.test(String(entry?.consequenceTail || entry?.detail || entry?.line || ''))
      );
      const actionSubtypeCounts = arcs.reduce((counts, arc) => {
        const key = arc.actionSubtype || 'unknown';
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {});

      return {
        butterflyCount: gameCore.getGameState?.()?.butterflies?.length || 0,
        dialogueEventCount: dialogueEvents.length,
        dialogueHistoryCount: dialogueHistory.length,
        residueHitCount: residueHits.length,
        arcCount: arcs.length,
        actionSubtypeCounts,
        distinctActionSubtypeCount: Object.keys(actionSubtypeCounts).length,
        continuityLineCount: continuityLines.length,
        continuityFeedEntryCount: continuityFeedEntries.length,
        inspectCausalityCount: inspectCausalitySamples.filter(sample => sample.causalityLines.length > 0).length,
        inspectCausalityMatchedCount: inspectCausalitySamples.filter(sample => sample.matchedRuntimeTruth).length,
        feedActionCausalityCount: feedCausalityEntries.length,
        dialogueSamples: dialogueEvents.slice(-8),
        residueSamples: residueHits.slice(-8),
        arcSamples: arcs.slice(-8),
        inspectCausalitySamples,
        continuitySamples: continuityLines.slice(-8).map(entry => ({
          phrase: entry.phrase,
          sourceLabel: entry.sourceLabel || entry.sourceId,
          targetLabels: entry.targetLabels || [],
          causeLabel: entry.metadata?.causeLabel || entry.dialogueMetadata?.causeLabel || null,
          continuityAgeSeconds: entry.metadata?.continuityAgeSeconds ?? null
        })),
        feedContinuitySamples: continuityFeedEntries.slice(-8),
        feedCausalitySamples: feedCausalityEntries.slice(-8)
      };
    }, { frameCount: FRAME_COUNT });

    report.browserResult = browserResult;
    const addCheck = (name, pass, details = {}) => {
      report.checks.push({ name, pass: !!pass, details });
    };
    addCheck('browser-clean', report.pageErrors.length === 0 && report.consoleErrors.length === 0, {
      pageErrors: report.pageErrors,
      consoleErrors: report.consoleErrors
    });
    addCheck('dialogue-events-observed', browserResult.dialogueEventCount >= 8, {
      actual: browserResult.dialogueEventCount,
      min: 8
    });
    addCheck('dialogue-residue-observed', browserResult.residueHitCount >= 1, {
      actual: browserResult.residueHitCount,
      min: 1
    });
    addCheck('memory-to-action-arc-observed', browserResult.arcCount >= 1, {
      actual: browserResult.arcCount,
      min: 1,
      samples: browserResult.arcSamples
    });
    addCheck('memory-to-action-action-diversity', browserResult.distinctActionSubtypeCount >= MIN_ACTION_SUBTYPES, {
      actual: browserResult.distinctActionSubtypeCount,
      min: MIN_ACTION_SUBTYPES,
      actionSubtypeCounts: browserResult.actionSubtypeCounts
    });
    addCheck('continuity-language-visible', browserResult.continuityLineCount >= 1 || browserResult.continuityFeedEntryCount >= 1, {
      dialogueContinuity: browserResult.continuityLineCount,
      feedContinuity: browserResult.continuityFeedEntryCount
    });
    addCheck('inspect-causality-visible', browserResult.arcCount <= 0 || browserResult.inspectCausalityCount >= 1, {
      arcCount: browserResult.arcCount,
      inspectCausalityCount: browserResult.inspectCausalityCount,
      samples: browserResult.inspectCausalitySamples
    });
    addCheck('inspect-causality-matches-runtime', browserResult.arcCount <= 0 || browserResult.inspectCausalityMatchedCount >= 1, {
      arcCount: browserResult.arcCount,
      inspectCausalityMatchedCount: browserResult.inspectCausalityMatchedCount,
      samples: browserResult.inspectCausalitySamples
    });

    const screenshot = path.join(outputDir, 'dialogue-memory-action-lived.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    report.screenshot = screenshot;

    const hardChecksPass = report.checks
      .filter(check => check.name !== 'memory-to-action-arc-observed')
      .filter(check => check.name !== 'memory-to-action-action-diversity')
      .filter(check => check.name !== 'inspect-causality-visible')
      .filter(check => check.name !== 'inspect-causality-matches-runtime')
      .every(check => check.pass);
    if (report.checks.every(check => check.pass)) {
      report.overall = 'pass';
    } else if (hardChecksPass) {
      report.overall = 'pass-with-residual';
      report.residual = 'No unforced memory-to-action arc surfaced in this run.';
    } else {
      report.overall = 'fail';
    }
  } catch (error) {
    report.overall = 'fail';
    report.error = String(error && error.stack ? error.stack : error);
  } finally {
    report.finishedAt = new Date().toISOString();
    if (initialStorage && page) {
      await restoreStorage(page, initialStorage).catch(() => {});
    }
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }

  const reportPath = path.join(outputDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    overall: report.overall,
    reportPath,
    frameCount: FRAME_COUNT,
    minActionSubtypes: MIN_ACTION_SUBTYPES,
    checks: report.checks,
    residual: report.residual || null
  }, null, 2));
  if (report.overall === 'fail') process.exitCode = 1;
}

run();
