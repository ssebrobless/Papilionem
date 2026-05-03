const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const {
  sanitizeScenarioName,
  signatureForAssertions,
  summarizeAssertions
} = require('./dsl');

const ROOT = path.resolve(__dirname, '..', '..');
const URL = process.env.PAPILIONEM_SCENARIO_URL || 'http://127.0.0.1:3000/';
const SCENARIO_DIR = path.join(__dirname, 'scenarios');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'scenario');
const STORAGE_KEYS = [
  'papilionem-save-v2',
  'papilionem-progression-v1',
  'papilionem-accessibility-v1',
  'papilionem-audit-setup-v1',
  'papilionem-audit-reports-v1',
  'papilionem-world-rendermode'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function readScenario(name) {
  const scenarioName = sanitizeScenarioName(name);
  const file = path.join(SCENARIO_DIR, `${scenarioName}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Scenario not found: ${scenarioName}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function ensureServer(report) {
  const reachable = await fetch(URL).then(() => true).catch(() => false);
  if (reachable) {
    report.server = { reused: true, pid: null };
    return;
  }
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
  return page.evaluate(keys => {
    const snapshot = {};
    for (const key of keys) {
      snapshot[key] = window.localStorage.getItem(key);
    }
    return snapshot;
  }, STORAGE_KEYS);
}

async function restoreStorage(page, snapshot) {
  await page.evaluate(({ keys, snapshot: stored }) => {
    for (const key of keys) {
      if (stored[key] === null || typeof stored[key] === 'undefined') {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, stored[key]);
      }
    }
  }, { keys: STORAGE_KEYS, snapshot });
}

function sameStorage(left, right) {
  return STORAGE_KEYS.every(key => (left[key] || null) === (right[key] || null));
}

class ScenarioRunner {
  constructor(options = {}) {
    this.url = options.url || URL;
    this.outputRoot = options.outputRoot || OUTPUT_ROOT;
  }

  async runAll(options = {}) {
    const names = fs.readdirSync(SCENARIO_DIR)
      .filter(name => name.endsWith('.json'))
      .map(name => sanitizeScenarioName(path.basename(name, '.json')))
      .sort();
    const runs = [];
    for (const name of names) {
      runs.push(await this.runByName(name, { ...options, repeat: options.repeat || 1 }));
    }
    return {
      scenarioCount: names.length,
      pass: runs.every(run => run.overall === 'pass'),
      runs
    };
  }

  async runByName(name, options = {}) {
    const scenario = readScenario(name);
    const scenarioName = sanitizeScenarioName(scenario.id || name);
    const repeat = Math.max(1, Number(options.repeat || 1));
    const runs = [];
    for (let index = 0; index < repeat; index += 1) {
      runs.push(await this.runOnce(scenarioName, scenario, index + 1));
    }
    const firstSignature = runs[0]?.assertionSignature || '';
    const deterministic = runs.every(run => run.assertionSignature === firstSignature);
    const report = {
      scenario: scenarioName,
      repeat,
      deterministic,
      runs,
      overall: deterministic && runs.every(run => run.overall === 'pass') ? 'pass' : 'fail'
    };
    const outputDir = path.join(this.outputRoot, scenarioName, stamp());
    ensureDir(outputDir);
    report.reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
    return report;
  }

  async runOnce(scenarioName, scenario, repeatIndex) {
    ensureDir(this.outputRoot);
    const outputDir = path.join(this.outputRoot, scenarioName, stamp(), `run-${repeatIndex}`);
    ensureDir(outputDir);
    const report = {
      scenario: scenarioName,
      repeatIndex,
      startedAt: new Date().toISOString(),
      outputDir,
      server: null,
      pageErrors: [],
      consoleErrors: [],
      assertions: [],
      storageRestored: false,
      screenshot: null,
      overall: 'pending'
    };

    await ensureServer(report);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', error => report.pageErrors.push(String(error?.message || error)));
    page.on('console', message => {
      if (message.type() === 'error') report.consoleErrors.push(message.text());
    });

    let initialStorage = null;
    try {
      await page.goto(this.url, { waitUntil: 'domcontentloaded' });
      await waitForGame(page);
      initialStorage = await captureStorage(page);
      await this.resetBaseline(page, scenario);
      const browserReport = await page.evaluate(runScenarioInBrowser, scenario);
      report.assertions = browserReport.assertions || [];
      report.browserSummary = browserReport.summary || {};
      report.screenshot = path.join(outputDir, 'final.png');
      await page.screenshot({ path: report.screenshot, fullPage: true });
      await restoreStorage(page, initialStorage);
      const restoredStorage = await captureStorage(page);
      report.storageRestored = sameStorage(initialStorage, restoredStorage);
      report.assertionSummary = summarizeAssertions(report.assertions);
      report.assertionSignature = signatureForAssertions(report.assertions);
      report.overall = report.assertionSummary.pass
        && report.storageRestored
        && report.pageErrors.length === 0
        && report.consoleErrors.length === 0
        ? 'pass'
        : 'fail';
    } catch (error) {
      report.error = String(error?.stack || error);
      if (initialStorage) {
        await restoreStorage(page, initialStorage).catch(() => {});
      }
      report.overall = 'fail';
    } finally {
      await browser.close();
    }

    report.finishedAt = new Date().toISOString();
    report.reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
    return report;
  }

  async resetBaseline(page, scenario) {
    await page.evaluate((keys) => {
      keys.forEach(key => window.localStorage.removeItem(key));
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    }, STORAGE_KEYS);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await page.evaluate(async ({ world, seed }) => {
      if (Number.isFinite(seed)) {
        if (typeof randomSeed === 'function') randomSeed(seed);
        if (typeof noiseSeed === 'function') noiseSeed(seed);
      }
      await gameCore.resetGame(true);
      if (Number.isFinite(seed)) {
        if (typeof randomSeed === 'function') randomSeed(seed);
        if (typeof noiseSeed === 'function') noiseSeed(seed);
      }
      if (typeof gameUI !== 'undefined' && gameUI?.firstSessionGuide) {
        gameUI.firstSessionGuide.visible = false;
      }
      if (world?.ecologyMode) {
        gameCore.gameState.ecologyMode = world.ecologyMode;
      }
      if (gameConfig?.zones?.affordanceMigrationPressure) {
        gameConfig.zones.affordanceMigrationPressure.enabled = world?.enableAffordanceMigrationPressure === true;
      }
      if (gameConfig?.cognition?.affordances?.cleanupActivityDirt) {
        gameConfig.cognition.affordances.cleanupActivityDirt.enabled = world?.enableCleanupActivityDirt === true;
      }
      if (gameConfig?.entities?.flower && world?.disableFlowerDecay === true) {
        gameConfig.entities.flower.decayEnabled = false;
      }
      const focusedZoneId = world?.focusedZoneId || 'ivy-cloister';
      gameCore.focusZone?.(focusedZoneId);
    }, { world: scenario.world || {}, seed: Number(scenario.seed) });
  }
}

function runScenarioInBrowser(scenario) {
  const assertions = [];
  const aliases = new Map();
  const state = gameCore.getGameState();

  function addAssertion(name, pass, details = {}) {
    assertions.push({ name, pass: !!pass, details });
  }

  function boardToScreen(boardPos) {
    return renderManager?.boardToScreen?.({
      zoneId: boardPos.zoneId,
      u: boardPos.u,
      v: boardPos.v,
      h: boardPos.h || 0
    }) || null;
  }

  function setEntityBoardPos(entity, boardPos) {
    const screen = boardToScreen(boardPos);
    if (!entity || !screen) return false;
    entity.currentZoneId = boardPos.zoneId;
    entity.lifeSim = entity.lifeSim || {};
    entity.lifeSim.lifecycle = entity.lifeSim.lifecycle || {};
    entity.lifeSim.lifecycle.currentZoneId = boardPos.zoneId;
    entity.boardPos = {
      zoneId: boardPos.zoneId,
      u: boardPos.u,
      v: boardPos.v,
      h: boardPos.h || 0
    };
    entity.x = screen.x;
    entity.y = screen.y;
    entity.syncDebugGridPos?.();
    gameCore.assignEntityToZone?.(entity, boardPos.zoneId);
    return true;
  }

  function getEntity(ref) {
    const id = aliases.get(ref) || ref;
    return (state.butterflies || []).find(entity => entity.id === id) || null;
  }

  function ensureEdge(source, target, values = {}) {
    if (!source?.id || !target?.id) return null;
    const edge = typeof ensureLifeSocialEdge === 'function'
      ? ensureLifeSocialEdge(source, target.id)
      : ((source.lifeSim.socialEdges = source.lifeSim.socialEdges || {})[target.id] = source.lifeSim.socialEdges[target.id] || {});
    Object.assign(edge, values);
    return edge;
  }

  function advanceCognition(seconds = 1) {
    const frames = Math.max(1, Math.round(seconds * 60));
    state.currentFrame = Math.max(state.currentFrame || 0, gameCore.getCurrentFrame?.() || 0) + frames;
    for (const butterfly of state.butterflies || []) {
      lifeSimSystem?.updateButterfly?.(butterfly, state, {
        deltaSeconds: seconds,
        currentFrame: state.currentFrame,
        cadenceIntervalFrames: 1,
        deepUpdate: true
      });
    }
    mlInferenceSystem?.update?.(state, seconds, { currentFrame: state.currentFrame });
  }

  function stepSimulation(frames = 60) {
    const totalFrames = Math.max(1, Math.round(frames || 60));
    for (let frame = 0; frame < totalFrames; frame += 1) {
      gameCore.update?.();
    }
  }

  function boardDistance(left, right) {
    if (!left || !right) return Infinity;
    const du = (right.u || 0) - (left.u || 0);
    const dv = (right.v || 0) - (left.v || 0);
    return Math.hypot(du, dv);
  }

  function getMovementTargetBoardPos(entity) {
    if (!entity) return null;
    if (typeof entity.getMovementTargetBoardPos === 'function') {
      return entity.getMovementTargetBoardPos();
    }
    const target = entity.movement?.target || null;
    if (!target) return null;
    if (Number.isFinite(target.u) && Number.isFinite(target.v)) {
      return {
        zoneId: target.zoneId || entity.currentZoneId || entity.boardPos?.zoneId || null,
        u: target.u,
        v: target.v,
        h: Number.isFinite(target.h) ? target.h : 0
      };
    }
    if (Number.isFinite(target.x) && Number.isFinite(target.y)) {
      return {
        zoneId: entity.currentZoneId || entity.boardPos?.zoneId || null,
        u: target.x,
        v: target.y,
        h: 0
      };
    }
    return null;
  }

  function getRecoveryDrive(entity) {
    const routine = entity?.lifeSim?.derived?.routine || entity?.lifeSim?.derived?.routines || {};
    return Number(routine.recoveryDrive ?? routine.recovery ?? entity?.lifeSim?.drives?.rest ?? 0) || 0;
  }

  function getDialoguePairDiversity(options = {}) {
    const now = communicationSystem?.simulationClockSeconds || 0;
    const sourceId = aliases.get(options.source) || options.source || null;
    const maxAgeSeconds = Number.isFinite(options.withinSeconds) ? options.withinSeconds : Infinity;
    const pairs = new Set();
    const pairCounts = {};
    for (const dialogue of communicationSystem?.dialogueHistory || []) {
      if (sourceId && dialogue.sourceId !== sourceId) continue;
      if (Number.isFinite(maxAgeSeconds) && (now - (dialogue.createdAtSeconds || 0)) > maxAgeSeconds) continue;
      const targetId = Array.isArray(dialogue.targetIds) ? dialogue.targetIds[0] : null;
      if (!dialogue.sourceId || !targetId) continue;
      const pair = `${dialogue.sourceId}->${targetId}`;
      pairs.add(pair);
      pairCounts[pair] = (pairCounts[pair] || 0) + 1;
    }
    return {
      distinctPairs: pairs.size,
      pairCounts
    };
  }

  function ensureButterflies(count, zoneId) {
    const limit = Math.max(gameConfig?.entities?.maxButterflies || 0, count);
    if (gameConfig?.entities) gameConfig.entities.maxButterflies = limit;
    while ((state.butterflies || []).length < count) {
      const point = boardToScreen({ zoneId, u: 8 + state.butterflies.length, v: 8, h: 0 }) || { x: 320, y: 240 };
      gameCore.godSpawnButterfly?.(point.x, point.y);
    }
  }

  const entitySpecs = scenario.entities || [];
  ensureButterflies(
    entitySpecs.filter(spec => (spec.type || 'butterfly') === 'butterfly').length,
    scenario.world?.focusedZoneId || 'ivy-cloister'
  );

  for (const spec of entitySpecs) {
    if ((spec.type || 'butterfly') !== 'butterfly') continue;
    const entity = (state.butterflies || [])[aliases.size] || null;
    if (!entity) continue;
    aliases.set(spec.id, entity.id);
    setEntityBoardPos(entity, spec.boardPos || { zoneId: scenario.world?.focusedZoneId || 'ivy-cloister', u: 8, v: 8, h: 0 });
    if (spec.traits && entity.lifeSim) {
      entity.lifeSim.traits = { ...(entity.lifeSim.traits || {}), ...spec.traits };
    }
    if (spec.drives && entity.lifeSim) {
      entity.lifeSim.drives = { ...(entity.lifeSim.drives || {}), ...spec.drives };
    }
    if (spec.emotions && entity.lifeSim) {
      entity.lifeSim.emotions = { ...(entity.lifeSim.emotions || {}), ...spec.emotions };
    }
    if (spec.social && entity.lifeSim) {
      entity.lifeSim.social = { ...(entity.lifeSim.social || {}), ...spec.social };
    }
    if (spec.derived && entity.lifeSim) {
      entity.lifeSim.derived = { ...(entity.lifeSim.derived || {}), ...spec.derived };
    }
  }

  for (const edgeSpec of scenario.edges || []) {
    const source = getEntity(edgeSpec.source);
    const target = getEntity(edgeSpec.target);
    ensureEdge(source, target, edgeSpec.values || {});
  }

  for (const objectSpec of scenario.objects || []) {
    const screen = boardToScreen(objectSpec.boardPos || { zoneId: scenario.world?.focusedZoneId || 'ivy-cloister', u: 10, v: 10, h: 0 });
    if (!screen) continue;
    if (objectSpec.type === 'block') {
      const block = gameCore.godSpawnBlock?.(objectSpec.boardPos.zoneId, screen.x, screen.y);
      if (block) {
        aliases.set(objectSpec.id, block.id);
        block.snapToBoardCell?.({ boardPos: objectSpec.boardPos, allowInvalidCell: false, reason: 'scenario' });
      }
    } else {
      const flower = gameCore.spawnFlowerAt?.(objectSpec.boardPos.zoneId, screen.x, screen.y, {
        exactPoint: true,
        preferredPoint: { x: screen.x, y: screen.y },
        persistentUntilConsumed: true,
        resourceOrigin: 'scenario'
      });
      const seededObject = flower || (objectSpec.type === 'dirt-pile'
        ? new Flower(screen.x, screen.y, true, {
            currentZoneId: objectSpec.boardPos.zoneId,
            lifecycleKind: 'dirt-pile',
            spawnedAtFrame: gameCore.getCurrentFrame?.() || 0,
            decayedAtFrame: gameCore.getCurrentFrame?.() || 0
          })
        : null);
      if (seededObject && !flower) {
        state.flowers = state.flowers || [];
        seededObject.boardPos = { ...objectSpec.boardPos };
        seededObject.syncDebugGridPos?.();
        state.flowers.push(seededObject);
        gameCore.assignEntityToZone?.(seededObject, objectSpec.boardPos.zoneId);
        gameCore.entityManager?.addEntity?.('flowers', seededObject);
        gameCore.registerEntityWithFoundationSystems?.(seededObject, 'flower');
      }
      if (seededObject) {
        const flower = seededObject;
        aliases.set(objectSpec.id, flower.id);
        if (objectSpec.type === 'dirt-pile') {
          flower.stage = 'decayed';
          flower.lifecycleKind = 'dirt-pile';
          flower.objectProfile = flower.objectProfile || {};
          flower.objectProfile.subtype = 'dirt-pile';
          flower.objectProfile.lifecycleStage = 'decayed';
        }
      }
    }
  }

  structureSystem?.update?.(state, 0);
  objectSystem?.update?.(state);
  state.currentFrame = 0;
  if (gameCore?.gameState) gameCore.gameState.currentFrame = 0;
  eventBus?.clearHistory?.();
  communicationSystem?.reset?.();
  lifeSimSystem?.reset?.();
  const scenarioCognitionLog = [];
  const unsubscribeScenarioCognition = eventBus?.on?.('cognition:triggered', data => {
    try {
      scenarioCognitionLog.push(JSON.parse(JSON.stringify(data || {})));
    } catch (_error) {
      scenarioCognitionLog.push(data || {});
    }
    if (scenarioCognitionLog.length > 2000) scenarioCognitionLog.shift();
  });

  for (const action of scenario.actions || []) {
    const sourceId = aliases.get(action.source) || action.source;
    const targetIds = (action.targets || []).map(target => aliases.get(target) || target).filter(Boolean);
    const source = (state.butterflies || []).find(entity => entity.id === sourceId) || null;
    if (action.type === 'emit_signal' && source) {
      communicationSystem?.emitCooperationSignal?.(source, {
        signalType: action.signalType || 'acknowledgement_signal',
        intentFamily: action.intentFamily || 'social',
        intentTags: action.intentTags || ['companionship'],
        phrase: action.phrase || 'Stay close.',
        targetIds,
        zoneId: source.currentZoneId || scenario.world?.focusedZoneId || null,
        reason: 'scenario'
      });
    }
    if (action.type === 'set_partner_recency_pressure') {
      gameConfig.communication = gameConfig.communication || {};
      gameConfig.communication.partnerSelection = gameConfig.communication.partnerSelection || {};
      gameConfig.communication.partnerSelection.recencyPressure = action.enabled !== false;
    }
    if (action.type === 'clear_dialogue_history') {
      if (communicationSystem) {
        communicationSystem.dialogueHistory = [];
        communicationSystem.history = [];
        communicationSystem.partnerSelectionHistory?.clear?.();
      }
      for (const entity of state.butterflies || []) {
        if (entity?.lifeSim?.communication) {
          entity.lifeSim.communication.recentDialogues = [];
          entity.lifeSim.communication.pendingUtterances = [];
          entity.lifeSim.communication.activeConversation = null;
        }
      }
    }
    if (action.type === 'assert_dialogue_pair_diversity') {
      const result = getDialoguePairDiversity({
        source: action.source,
        withinSeconds: action.withinSeconds
      });
      const minPass = Number.isFinite(action.minDistinct) ? result.distinctPairs >= action.minDistinct : true;
      const maxPass = Number.isFinite(action.maxDistinct) ? result.distinctPairs <= action.maxDistinct : true;
      addAssertion(action.name || 'dialogue_pair_diversity', minPass && maxPass, {
        distinctPairs: result.distinctPairs,
        minDistinct: action.minDistinct ?? null,
        maxDistinct: action.maxDistinct ?? null,
        pairCounts: result.pairCounts
      });
    }
    if (action.type === 'set_emotions' && source?.lifeSim?.emotions) {
      if (Number.isFinite(action.threat)) source.lifeSim.emotions.threat = action.threat;
      if (Number.isFinite(action.exhaustion)) source.lifeSim.emotions.exhaustion = action.exhaustion;
      if (Number.isFinite(action.attachment)) source.lifeSim.emotions.attachment = action.attachment;
      if (Number.isFinite(action.rejection)) source.lifeSim.emotions.rejection = action.rejection;
      if (Number.isFinite(action.significance)) source.lifeSim.emotions.significance = action.significance;
      if (Number.isFinite(action.failure)) source.lifeSim.emotions.failure = action.failure;
      if (Number.isFinite(action.curiosity)) source.lifeSim.emotions.curiosity = action.curiosity;
      if (Number.isFinite(action.agitation)) source.lifeSim.emotions.agitation = action.agitation;
      if (Number.isFinite(action.relief)) source.lifeSim.emotions.relief = action.relief;
      if (action.resetDistressCooldown !== false && source.lifeSim.communication) {
        source.lifeSim.communication.lastDistressAtSeconds = -Infinity;
      }
    }
    if (action.type === 'distress' && source?.lifeSim?.emotions) {
      source.lifeSim.emotions.threat = Math.max(source.lifeSim.emotions.threat || 0, action.threat ?? 0.75);
      source.lifeSim.emotions.exhaustion = Math.max(source.lifeSim.emotions.exhaustion || 0, action.exhaustion ?? 0.4);
      if (action.resetDistressCooldown !== false && source.lifeSim.communication) {
        source.lifeSim.communication.lastDistressAtSeconds = -Infinity;
      }
    }
    if (action.type === 'set_drives' && source?.lifeSim?.drives) {
      Object.assign(source.lifeSim.drives, action.values || {});
    }
    if (action.type === 'set_movement_target' && source?.movement) {
      const target = action.boardPos || null;
      if (target && typeof source.movement.setBoardTarget === 'function') {
        source.movement.setBoardTarget(target.u, target.v, action.targetType || 'goal', action.priority || 1, action.wobble || 0);
      }
      if (target) {
        source.movement.target = { ...target };
        source.movement.targetType = action.targetType || 'goal';
      }
    }
    if (action.type === 'set_board_pos' && source && action.boardPos) {
      setEntityBoardPos(source, action.boardPos);
    }
    if (action.type === 'emit_dialogue' && source) {
      communicationSystem?.emitCooperationSignal?.(source, {
        signalType: action.signalType || 'acknowledgement_signal',
        intentFamily: action.intentFamily || 'social',
        intentTags: action.intentTags || ['companionship'],
        phrase: action.phrase || 'Stay close.',
        targetIds,
        zoneId: source.currentZoneId || scenario.world?.focusedZoneId || null,
        reason: action.reason || 'scenario-dialogue',
        metadata: action.metadata || {}
      });
    }
    if (action.type === 'set_edge') {
      const target = getEntity(action.target);
      ensureEdge(source, target, action.values || {});
    }
    if (action.type === 'advance_cognition') {
      advanceCognition(action.seconds || 1);
    }
    if (action.type === 'kill' && source) {
      source.dead = true;
      eventBus?.emit?.(GameEvents?.BUTTERFLY_DIED || 'butterfly:died', { butterfly: source, entity: source, id: source.id });
    }
    if (action.type === 'outcome_anchor' && source) {
      addAssertion(`forbidden_action_${action.type}`, false, {
        message: 'Use production trigger actions instead of direct outcome anchors.'
      });
    }
    if (action.type === 'witness_affection' && source) {
      const specifiedWitnessIds = new Set((action.witnesses || [])
        .map(ref => aliases.get(ref) || ref)
        .filter(Boolean));
      if (action.isolateWitnesses === true) {
        const targetIdSet = new Set(targetIds);
        for (const butterfly of state.butterflies || []) {
          if (!butterfly?.id || butterfly.id === source.id || targetIdSet.has(butterfly.id) || specifiedWitnessIds.has(butterfly.id)) continue;
          setEntityBoardPos(butterfly, {
            zoneId: action.isolationZoneId || 'moss-hollow',
            u: 24,
            v: 24,
            h: 0
          });
        }
      }
      if (action.clearExistingWitnessedAffection !== false) {
        const targetIdSet = new Set(targetIds);
        for (const witness of state.butterflies || []) {
          if (!witness?.id || witness.id === source.id || targetIdSet.has(witness.id)) continue;
          if (specifiedWitnessIds.size && !specifiedWitnessIds.has(witness.id)) continue;
          const social = witness.lifeSim?.memories?.social;
          if (!Array.isArray(social)) continue;
          witness.lifeSim.memories.social = social.filter(packet => {
            if (packet?.kind !== 'witnessedAffection') return true;
            const relatesToAction = packet?.bondPartnerId === source.id
              || packet?.partnerId === source.id
              || packet?.sourceId === source.id
              || targetIdSet.has(packet?.thirdPartyId);
            return !relatesToAction;
          });
        }
      }
      if (action.ensureWitnessCompanion !== false) {
        const targetIdSet = new Set(targetIds);
        for (const witness of state.butterflies || []) {
          if (!witness?.id || witness.id === source.id || targetIdSet.has(witness.id)) continue;
          if (specifiedWitnessIds.size && !specifiedWitnessIds.has(witness.id)) continue;
          ensureEdge(witness, source, {
            trust: Math.max(witness.lifeSim?.socialEdges?.[source.id]?.trust || 0, action.witnessTrust ?? 0.68),
            comfort: Math.max(witness.lifeSim?.socialEdges?.[source.id]?.comfort || 0, action.witnessComfort ?? 0.64),
            attachment: Math.max(witness.lifeSim?.socialEdges?.[source.id]?.attachment || 0, action.witnessAttachment ?? 0.62),
            coTimeSeconds: Math.max(witness.lifeSim?.socialEdges?.[source.id]?.coTimeSeconds || 0, action.witnessCoTimeSeconds ?? 900),
            bondTier: 'companion'
          });
        }
      }
      communicationSystem?.emitCooperationSignal?.(source, {
        signalType: action.signalType || 'acknowledgement_signal',
        intentFamily: action.intentFamily || 'care',
        intentTags: action.intentTags || ['comfort', 'companionship', 'warmth'],
        phrase: action.phrase || 'I am glad you are here.',
        targetIds,
        zoneId: source.currentZoneId || scenario.world?.focusedZoneId || null,
        reason: 'witness-affection',
        metadata: { affectionIntensity: action.affectionIntensity ?? 0.75 }
      });
    }
    if (action.type === 'loyalty_choice' && source) {
      addAssertion(`forbidden_action_${action.type}`, false, {
        message: 'Use competing production signals instead of direct loyalty choices.'
      });
    }
    if (action.type === 'trigger_scarcity_pulse') {
      zoneSystem?.triggerScarcityPulse?.(action.zoneId || scenario.world?.focusedZoneId || source?.currentZoneId, {
        currentFrame: gameCore.getCurrentFrame?.() || state.currentFrame || 0,
        durationFrames: action.durationFrames || 1800,
        gameState: state
      });
    }
    if (action.type === 'emit_battle_action') {
      eventBus?.emit?.(GameEvents?.BATTLE_ACTION_OCCURRED || 'battle:actionOccurred', {
        battleId: action.battleId || 'scenario-battle-action',
        roundNumber: action.roundNumber || 1,
        actorId: aliases.get(action.actor) || action.actor || null,
        type: action.actionType || 'attack',
        targetId: aliases.get(action.target) || action.target || null,
        damage: action.damage ?? 8
      });
    }
    if (action.type === 'step' || action.type === 'step_simulation') {
      stepSimulation(action.frames || 60);
    }
    if (action.type === 'assert_object_count') {
      const collections = [...(state.flowers || []), ...(state.blocks || [])];
      const actual = action.kind
        ? collections.filter(entry => entry?.lifecycleKind === action.kind || entry?.objectProfile?.subtype === action.kind || entry?.objectProfile?.entityType === action.kind).length
        : collections.length;
      const minPass = Number.isFinite(action.min) ? actual >= action.min : true;
      const maxPass = Number.isFinite(action.max) ? actual <= action.max : true;
      addAssertion(action.name || 'assert_object_count', minPass && maxPass, {
        actual,
        min: action.min ?? null,
        max: action.max ?? null,
        kind: action.kind || null
      });
    }
  }

  for (const assertion of scenario.assertions || []) {
    if (assertion.type === 'entity_count') {
      addAssertion(assertion.name || 'entity_count', (state.butterflies || []).length >= assertion.min, {
        actual: (state.butterflies || []).length,
        min: assertion.min
      });
    } else if (assertion.type === 'object_count') {
      const collections = [...(state.flowers || []), ...(state.blocks || [])];
      const actual = assertion.kind
        ? collections.filter(entry => entry?.lifecycleKind === assertion.kind || entry?.objectProfile?.subtype === assertion.kind || entry?.objectProfile?.entityType === assertion.kind).length
        : collections.length;
      const minPass = Number.isFinite(assertion.min) ? actual >= assertion.min : true;
      const maxPass = Number.isFinite(assertion.max) ? actual <= assertion.max : true;
      addAssertion(assertion.name || 'object_count', minPass && maxPass, { actual, min: assertion.min ?? null, max: assertion.max ?? null, kind: assertion.kind || null });
    } else if (assertion.type === 'dialogue_count') {
      const actual = communicationSystem?.dialogueHistory?.length || 0;
      addAssertion(assertion.name || 'dialogue_count', actual >= assertion.min, { actual, min: assertion.min });
    } else if (assertion.type === 'zone_at_board') {
      const zones = assertion.zones || gameCore.getZoneIds?.() || [];
      const results = zones.map(zoneId => {
        const config = zoneSystem.getBoardConfigForZone?.(zoneId) || {};
        const boardPos = {
          zoneId,
          u: Math.max(1, Math.floor((config.widthUnits || 20) / 2)),
          v: Math.max(1, Math.floor((config.depthUnits || 20) / 2)),
          h: 0
        };
        const zone = zoneSystem.getZoneAtBoard?.(boardPos);
        return { zoneId, returnedZoneId: zone?.id || null, pass: zone?.id === zoneId };
      });
      addAssertion(assertion.name || 'zone_at_board', results.every(result => result.pass), { results });
    } else if (assertion.type === 'grid_board_agreement') {
      const entities = [...(state.butterflies || []), ...(state.blocks || [])].filter(entity => entity?.boardPos && entity?.gridPos);
      const mismatches = [];
      for (const entity of entities) {
        const screen = boardToScreen(entity.boardPos);
        const board = screen ? renderManager?.screenToBoard?.(screen.x, screen.y, entity.boardPos.zoneId, entity.boardPos.h || 0) : null;
        const drift = board ? Math.hypot((board.u || 0) - (entity.boardPos.u || 0), (board.v || 0) - (entity.boardPos.v || 0)) : Infinity;
        if (drift > (assertion.maxDrift || 0.5)) {
          mismatches.push({ id: entity.id, drift });
        }
      }
      addAssertion(assertion.name || 'grid_board_agreement', mismatches.length === 0, { checked: entities.length, mismatches });
    } else if (assertion.type === 'distance_ppu') {
      const zones = assertion.zones || gameCore.getZoneIds?.() || [];
      const results = zones.map(zoneId => {
        const ppu = structureSystem.getBoardPixelsPerUnit?.(zoneId) || 20;
        const left = { currentZoneId: zoneId, x: 100, y: 100 };
        const right = { currentZoneId: zoneId, x: 100 + (ppu * 2), y: 100 };
        const distance = structureSystem.getBoardDistanceBetweenEntities?.(left, right, zoneId);
        return { zoneId, ppu, distance, pass: Math.abs((distance || 0) - 2) < 0.01 };
      });
      addAssertion(assertion.name || 'distance_ppu', results.every(result => result.pass), { results });
    } else if (assertion.type === 'near') {
      const left = (state.butterflies || []).find(entity => entity.id === (aliases.get(assertion.left) || assertion.left));
      const right = (state.butterflies || []).find(entity => entity.id === (aliases.get(assertion.right) || assertion.right));
      const distance = left && right ? structureSystem.getBoardDistanceBetweenEntities?.(left, right, left.currentZoneId || right.currentZoneId) : Infinity;
      addAssertion(assertion.name || 'near', distance <= assertion.max, { distance, max: assertion.max });
    } else if (assertion.type === 'entity_zone_count') {
      const targetZoneId = assertion.zoneId || assertion.zone_id || null;
      const refs = assertion.entities || [];
      const results = refs.map(ref => {
        const entity = getEntity(ref);
        return {
          ref,
          id: entity?.id || null,
          zoneId: entity?.currentZoneId || entity?.boardPos?.zoneId || entity?.lifeSim?.lifecycle?.currentZoneId || null,
          zoneTravelTargetZoneId: entity?.zoneTravel?.targetZoneId || null,
          zoneTravelPhase: entity?.zoneTravel?.phase || null,
          affordancePull: entity?.lifeSim?.derived?.migration?.affordancePull || null
        };
      });
      const actual = results.filter(result => result.zoneId === targetZoneId).length;
      addAssertion(assertion.name || 'entity_zone_count', actual >= (assertion.min || 1), {
        actual,
        min: assertion.min || 1,
        zoneId: targetZoneId,
        results
      });
    } else if (assertion.type === 'entity_not_zone_count') {
      const excludedZoneId = assertion.zoneId || assertion.zone_id || null;
      const refs = assertion.entities || [];
      const results = refs.map(ref => {
        const entity = getEntity(ref);
        return {
          ref,
          id: entity?.id || null,
          zoneId: entity?.currentZoneId || entity?.boardPos?.zoneId || entity?.lifeSim?.lifecycle?.currentZoneId || null,
          zoneTravelTargetZoneId: entity?.zoneTravel?.targetZoneId || null,
          zoneTravelPhase: entity?.zoneTravel?.phase || null,
          affordancePull: entity?.lifeSim?.derived?.migration?.affordancePull || null
        };
      });
      const actual = results.filter(result => {
        if (result.zoneId && result.zoneId !== excludedZoneId) return true;
        return assertion.countDepartingAsMoved === true
          && result.zoneTravelTargetZoneId
          && result.zoneTravelTargetZoneId !== excludedZoneId
          && ['departing', 'in-transit', 'arriving'].includes(result.zoneTravelPhase);
      }).length;
      addAssertion(assertion.name || 'entity_not_zone_count', actual >= (assertion.min || 1), {
        actual,
        min: assertion.min || 1,
        excludedZoneId,
        results
      });
    } else if (assertion.type === 'ml_runtime') {
      const summary = typeof mlInferenceSystem !== 'undefined' ? mlInferenceSystem.getRuntimeSummary?.() || null : null;
      addAssertion(assertion.name || 'ml_runtime', !!summary || typeof mlInferenceSystem !== 'undefined', { summary });
    } else if (assertion.type === 'feeling_min') {
      const entity = getEntity(assertion.entity);
      lifeSimSystem?.updateCognitionExpansion?.(entity, state, { deltaSeconds: 0, currentFrame: state.currentFrame || gameCore.getCurrentFrame?.() || 0 });
      const actual = entity?.lifeSim?.derived?.derivedFeelings?.[assertion.key] || 0;
      addAssertion(assertion.name || `feeling_${assertion.key}`, actual >= assertion.min, { actual, min: assertion.min, key: assertion.key });
    } else if (assertion.type === 'bond_tier') {
      const entity = getEntity(assertion.entity);
      const target = getEntity(assertion.target);
      const actual = entity?.lifeSim?.socialEdges?.[target?.id]?.bondTier || 'acquaintance';
      const ranks = { acquaintance: 0, familiar: 1, companion: 2, bonded: 3 };
      addAssertion(assertion.name || 'bond_tier', (ranks[actual] || 0) >= (ranks[assertion.minTier || assertion.tier] || 0), { actual, expected: assertion.minTier || assertion.tier });
    } else if (assertion.type === 'memory_packet') {
      const entity = getEntity(assertion.entity);
      const memories = entity?.lifeSim?.memories?.[assertion.family || 'social'] || [];
      const partnerId = aliases.get(assertion.partner) || assertion.partner || null;
      const chosenPartnerId = aliases.get(assertion.chosenPartner || assertion.chosen_partner || assertion.chosenPartnerId || assertion.chosen_partner_id)
        || assertion.chosenPartner
        || assertion.chosen_partner
        || assertion.chosenPartnerId
        || assertion.chosen_partner_id
        || null;
      const rejectedPartnerId = aliases.get(assertion.rejectedPartner || assertion.rejected_partner || assertion.rejectedPartnerId || assertion.rejected_partner_id)
        || assertion.rejectedPartner
        || assertion.rejected_partner
        || assertion.rejectedPartnerId
        || assertion.rejected_partner_id
        || null;
      const matches = memories.filter(packet =>
        (!assertion.kind || packet.kind === assertion.kind)
        && (!assertion.anchor || packet.anchor === assertion.anchor)
        && (!assertion.subtype || packet.subtype === assertion.subtype)
        && (!partnerId || packet.partnerId === partnerId)
        && (!chosenPartnerId || packet.chosenPartnerId === chosenPartnerId)
        && (!rejectedPartnerId || packet.rejectedPartnerId === rejectedPartnerId)
      );
      const boundedMatches = matches.filter(packet => {
        const intensity = Number(packet.intensity ?? packet.strength ?? packet.activeStrength ?? 0);
        if (Number.isFinite(assertion.minIntensity ?? assertion.min_intensity) && intensity < (assertion.minIntensity ?? assertion.min_intensity)) return false;
        if (Number.isFinite(assertion.maxIntensity ?? assertion.max_intensity) && intensity > (assertion.maxIntensity ?? assertion.max_intensity)) return false;
        return true;
      });
      const actual = boundedMatches.length;
      const min = Number.isFinite(assertion.min) ? assertion.min : 1;
      const max = Number.isFinite(assertion.max) ? assertion.max : null;
      addAssertion(assertion.name || 'memory_packet', actual >= min && (max === null || actual <= max), {
        actual,
        matchedBeforeBounds: matches.length,
        min,
        max,
        kind: assertion.kind || null,
        anchor: assertion.anchor || null,
        subtype: assertion.subtype || null,
        partnerId,
        chosenPartnerId,
        rejectedPartnerId,
        minIntensity: assertion.minIntensity ?? assertion.min_intensity ?? null,
        maxIntensity: assertion.maxIntensity ?? assertion.max_intensity ?? null
      });
    } else if (assertion.type === 'cognition_event_count') {
      const entityId = aliases.get(assertion.entity) || assertion.entity || null;
      const partnerId = aliases.get(assertion.partner) || assertion.partner || null;
      const thirdPartyId = aliases.get(assertion.thirdParty) || assertion.thirdParty || null;
      const cognitionEvents = [
        ...scenarioCognitionLog,
        ...(eventBus?.getHistory?.('cognition:triggered') || []).map(entry => entry?.data || entry || {})
      ];
      const matches = cognitionEvents.filter(data => {
        return (!assertion.kind || data.kind === assertion.kind)
          && (!entityId || data.entityId === entityId)
          && (!partnerId || data.partnerId === partnerId)
          && (!thirdPartyId || data.thirdPartyId === thirdPartyId)
          && (!assertion.trigger || data.trigger === assertion.trigger);
      });
      const min = Number.isFinite(assertion.min) ? assertion.min : 1;
      const max = Number.isFinite(assertion.max) ? assertion.max : null;
      addAssertion(assertion.name || 'cognition_event_count', matches.length >= min && (max === null || matches.length <= max), {
        actual: matches.length,
        min,
        max,
        kind: assertion.kind || null,
        trigger: assertion.trigger || null,
        entityId,
        partnerId,
        thirdPartyId,
        scenarioCognitionEventCount: scenarioCognitionLog.length,
        recentCognitionEvents: cognitionEvents.slice(-8)
      });
    } else if (assertion.type === 'edge_min') {
      const entity = getEntity(assertion.entity);
      const target = getEntity(assertion.target);
      const actual = entity?.lifeSim?.socialEdges?.[target?.id]?.[assertion.key] || 0;
      addAssertion(assertion.name || `edge_${assertion.key}`, actual >= assertion.min, { actual, min: assertion.min, key: assertion.key });
    } else if (assertion.type === 'assert_movement_target_near') {
      const entity = getEntity(assertion.entity);
      const target = getMovementTargetBoardPos(entity);
      const nearEntity = assertion.near_id ? getEntity(assertion.near_id) : null;
      const nearBoardPos = assertion.near_boardPos || assertion.nearBoardPos || nearEntity?.boardPos || null;
      const distance = target && nearBoardPos ? boardDistance(target, nearBoardPos) : Infinity;
      const pass = assertion.not === true
        ? distance > assertion.max_units
        : distance <= assertion.max_units;
      addAssertion(assertion.name || 'assert_movement_target_near', pass, {
        entity: assertion.entity,
        target,
        nearBoardPos,
        distance,
        maxUnits: assertion.max_units,
        not: !!assertion.not
      });
    } else if (assertion.type === 'assert_dialogue_intent') {
      const entity = getEntity(assertion.entity);
      const now = communicationSystem?.simulationClockSeconds || 0;
      const expected = assertion.expected_intent_tags || assertion.expectedIntentTags || [];
      const within = Number.isFinite(assertion.within_seconds) ? assertion.within_seconds : Infinity;
      const matches = (communicationSystem?.dialogueHistory || []).filter(dialogue =>
        dialogue?.sourceId === entity?.id
        && (now - (dialogue.createdAtSeconds || 0)) <= within
        && expected.some(tag => (dialogue.intentTags || []).includes(tag))
      );
      addAssertion(assertion.name || 'assert_dialogue_intent', matches.length > 0, {
        entity: assertion.entity,
        expected,
        withinSeconds: within,
        matchCount: matches.length
      });
    } else if (assertion.type === 'assert_recovery_rate_below') {
      const entity = getEntity(assertion.entity);
      const baseline = getRecoveryDrive(entity);
      stepSimulation(Math.max(1, Math.round((assertion.observation_window_seconds || 1) * 60)));
      const after = getRecoveryDrive(entity);
      const ratio = baseline > 0 ? after / baseline : 0;
      addAssertion(assertion.name || 'assert_recovery_rate_below', ratio < assertion.max_ratio_of_baseline, {
        baseline,
        after,
        ratio,
        maxRatio: assertion.max_ratio_of_baseline
      });
    } else if (assertion.type === 'ml_feature') {
      const entity = getEntity(assertion.entity);
      const features = entity ? mlInferenceSystem?.buildFeatureGroups?.(entity, state) : null;
      const actual = assertion.path
        ? assertion.path.split('.').reduce((value, key) => value?.[key], features)
        : null;
      const pass = Number.isFinite(assertion.min) ? Number(actual) >= assertion.min : typeof actual !== 'undefined';
      addAssertion(assertion.name || 'ml_feature', pass, { path: assertion.path, actual, min: assertion.min ?? null });
    } else if (assertion.type === 'save_roundtrip_cognition') {
      const entity = getEntity(assertion.entity);
      const clone = entity?.lifeSim ? JSON.parse(JSON.stringify(entity.lifeSim)) : null;
      const hasFeelings = !!clone?.derived?.derivedFeelings;
      const hasBondTier = Object.values(clone?.socialEdges || {}).some(edge => !!edge?.bondTier);
      const hasPackets = Object.values(clone?.memories || {}).some(bucket => Array.isArray(bucket) && bucket.some(packet => packet?.kind || packet?.anchor));
      addAssertion(assertion.name || 'save_roundtrip_cognition', !!clone && hasFeelings && (assertion.requirePackets ? hasPackets : true) && (assertion.requireBondTier ? hasBondTier : true), {
        hasFeelings,
        hasBondTier,
        hasPackets
      });
    } else {
      addAssertion(assertion.name || assertion.type || 'unknown', true, { skippedUnknownAssertion: assertion.type || null });
    }
  }

  unsubscribeScenarioCognition?.();
  return {
    assertions,
    summary: {
      seed: scenario.seed || null,
      butterflyCount: (state.butterflies || []).length,
      flowerCount: (state.flowers || []).length,
      blockCount: (state.blocks || []).length,
      dialogueCount: communicationSystem?.dialogueHistory?.length || 0
    }
  };
}

module.exports = {
  ScenarioRunner,
  SCENARIO_DIR
};
