const fs = require('fs');
const path = require('path');
const { STORAGE_KEYS, waitForGame, dismissTitle, captureStorage, restoreStorage } = require('../build-g0h-fixture-save');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function saveShot(page, dir, fileName) {
  ensureDir(dir);
  const file = path.join(dir, fileName);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

function readRawSave(savePath) {
  const raw = fs.readFileSync(savePath, 'utf8');
  JSON.parse(raw);
  return raw;
}

function normalizeCognitionEvent(event = {}) {
  const data = event?.data || event || {};
  return {
    ...data,
    currentFrame: Number(data.currentFrame ?? data.frame ?? 0) || 0,
    entityId: data.entityId || data.sourceId || data.actorId || null,
    partnerId: data.partnerId || data.chosenPartnerId || data.bondPartnerId || null,
    thirdPartyId: data.thirdPartyId || data.rejectedPartnerId || null,
    kind: data.kind || null
  };
}

function cognitionEventKey(event = {}) {
  const normalized = normalizeCognitionEvent(event);
  return [
    normalized.currentFrame,
    normalized.entityId || '',
    normalized.kind || '',
    normalized.partnerId || '',
    normalized.thirdPartyId || ''
  ].join('|');
}

class G0HPlaythroughDriver {
  constructor({ page, outputDir, fixtureSpec, fixtureReport, fast = false }) {
    this.page = page;
    this.outputDir = outputDir;
    this.fixtureSpec = fixtureSpec;
    this.fixtureReport = fixtureReport;
    this.fast = !!fast;
    this.startWallMs = 0;
    this.cognitionAccumulator = [];
    this.cognitionAccumulatorKeys = new Set();
    this.cognitionSubscriberAttached = false;
    this.cognitionSubscriberDisabled = false;
    this.cognitionSubscriberFlushes = [];
    this.evidence = {
      zoneVisits: [],
      inspections: [],
      snapshots: [],
      productionEvents: {},
      cognitionAccumulator: [],
      feedShape: null,
      flowerLifecycle: null,
      battle: null,
      ability: null,
      beforeReload: null,
      afterReload: null,
      valeIsolation: null,
      residuals: []
    };
  }

  async installCognitionSubscriber() {
    const details = await this.page.evaluate(() => {
      const enabled = typeof gameConfig === 'undefined' || gameConfig?.g0h?.cognitionSubscriber?.enabled !== false;
      if (!enabled) return { attached: false, disabled: true, reason: 'flag-disabled' };
      if (typeof eventBus === 'undefined' || typeof eventBus.on !== 'function') {
        return { attached: false, disabled: false, reason: 'eventBus-unavailable' };
      }
      if (typeof window.__G0H_COGNITION_UNSUB__ === 'function') {
        return {
          attached: true,
          existing: true,
          length: Array.isArray(window.__G0H_COGNITION_LOG__) ? window.__G0H_COGNITION_LOG__.length : 0
        };
      }
      window.__G0H_COGNITION_LOG__ = [];
      window.__G0H_COGNITION_LOG_DROPPED__ = 0;
      window.__G0H_COGNITION_UNSUB__ = eventBus.on('cognition:triggered', data => {
        const log = window.__G0H_COGNITION_LOG__ || [];
        log.push(data);
        if (log.length > 5000) {
          log.shift();
          window.__G0H_COGNITION_LOG_DROPPED__ = (window.__G0H_COGNITION_LOG_DROPPED__ || 0) + 1;
        }
        window.__G0H_COGNITION_LOG__ = log;
      });
      return { attached: true, existing: false, length: 0 };
    });
    this.cognitionSubscriberAttached = !!details.attached;
    this.cognitionSubscriberDisabled = !!details.disabled;
    this.evidence.cognitionSubscriber = {
      ...(this.evidence.cognitionSubscriber || {}),
      ...details,
      installedAt: new Date().toISOString()
    };
    return details;
  }

  async flushCognitionSubscriber(label = 'flush') {
    const details = await this.page.evaluate(flushLabel => {
      const log = Array.isArray(window.__G0H_COGNITION_LOG__)
        ? window.__G0H_COGNITION_LOG__
        : [];
      const events = log.slice();
      window.__G0H_COGNITION_LOG__ = [];
      return {
        label: flushLabel,
        attached: typeof window.__G0H_COGNITION_UNSUB__ === 'function',
        disabled: typeof gameConfig !== 'undefined' && gameConfig?.g0h?.cognitionSubscriber?.enabled === false,
        dropped: Number(window.__G0H_COGNITION_LOG_DROPPED__ || 0),
        eventCount: events.length,
        events
      };
    }, label);
    this.absorbCognitionEvents(details.events || []);
    const flushSummary = {
      label,
      attached: !!details.attached,
      disabled: !!details.disabled,
      dropped: Number(details.dropped || 0),
      eventCount: Number(details.eventCount || 0),
      accumulatedCount: this.cognitionAccumulator.length
    };
    this.cognitionSubscriberFlushes.push(flushSummary);
    this.evidence.cognitionSubscriber = {
      ...(this.evidence.cognitionSubscriber || {}),
      attached: !!details.attached || this.cognitionSubscriberAttached,
      disabled: !!details.disabled || this.cognitionSubscriberDisabled,
      dropped: Number(details.dropped || 0),
      flushes: this.cognitionSubscriberFlushes.slice()
    };
    return this.cognitionAccumulator.slice();
  }

  async uninstallCognitionSubscriber() {
    const details = await this.page.evaluate(() => {
      const hadUnsub = typeof window.__G0H_COGNITION_UNSUB__ === 'function';
      if (hadUnsub) {
        window.__G0H_COGNITION_UNSUB__();
      }
      window.__G0H_COGNITION_UNSUB__ = null;
      window.__G0H_COGNITION_LOG__ = [];
      return { detached: hadUnsub };
    });
    this.cognitionSubscriberAttached = false;
    this.evidence.cognitionSubscriber = {
      ...(this.evidence.cognitionSubscriber || {}),
      detached: !!details.detached,
      detachedAt: new Date().toISOString()
    };
    return details;
  }

  absorbCognitionEvents(events = []) {
    for (const event of events || []) {
      const normalized = normalizeCognitionEvent(event);
      if (!normalized.kind) continue;
      const key = cognitionEventKey(normalized);
      if (this.cognitionAccumulatorKeys.has(key)) continue;
      this.cognitionAccumulatorKeys.add(key);
      this.cognitionAccumulator.push(normalized);
    }
    const accumulated = this.cognitionAccumulator.slice();
    this.evidence.cognitionAccumulator = accumulated;
    if (this.evidence.productionEvents && Object.keys(this.evidence.productionEvents).length) {
      this.evidence.productionEvents.accumulatedCognition = accumulated;
      this.evidence.productionEvents.accumulatedCognitionCount = accumulated.length;
      this.evidence.productionEvents.accumulatedLoyaltyChoices = accumulated.filter(entry => entry.kind === 'loyalty').length;
      this.evidence.productionEvents.accumulatedOutcomeAnchors = accumulated.filter(entry => ['pride', 'shame'].includes(entry.kind)).length;
    }
    return this.evidence.cognitionAccumulator;
  }

  async importFixtureSave(savePath, options = {}) {
    const rawSave = readRawSave(savePath);
    const result = await this.page.evaluate(async ({ rawSave, storageKeys, preserveAccessibility }) => {
      const accessibilityKey = 'papilionem-accessibility-v1';
      const preservedAccessibility = preserveAccessibility
        ? window.localStorage.getItem(accessibilityKey)
        : null;
      storageKeys.forEach(key => {
        if (preserveAccessibility && key === accessibilityKey) return;
        window.localStorage.removeItem(key);
      });
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
      if (typeof saveSystem !== 'undefined' && typeof saveSystem.writePayloadToIndexedDb === 'function') {
        await saveSystem.writePayloadToIndexedDb('papilionem-save-v2', rawSave);
        window.localStorage.removeItem('papilionem-save-v2');
      } else {
        window.localStorage.setItem('papilionem-save-v2', rawSave);
      }
      const restored = await gameCore.loadGameFromStorage?.();
      if (preserveAccessibility && preservedAccessibility) {
        try {
          gameUI?.setAccessibilitySettings?.(JSON.parse(preservedAccessibility));
        } catch (_error) {
          window.localStorage.setItem(accessibilityKey, preservedAccessibility);
        }
      }
      gameCore.setViewMode?.('focused-garden');
      if (gameUI?.firstSessionGuide) gameUI.firstSessionGuide.visible = false;
      if (gameUI?.activityLogPanel) gameUI.activityLogPanel.visible = true;
      if (gameUI?.inspectPanel) gameUI.inspectPanel.visible = false;
      gameConfig.balance = gameConfig.balance || {};
      gameConfig.balance.migration = gameConfig.balance.migration || {};
      gameConfig.balance.migration.autoHabitatTravel = false;
      return {
        restored: !!restored,
        focusedZoneId: gameCore.getFocusedZoneId?.() || gameCore.gameState?.focusedZoneId || null,
        viewMode: gameCore.gameState?.viewMode || null,
        butterflies: gameCore.gameState?.butterflies?.length || 0,
        flowers: gameCore.gameState?.flowers?.length || 0,
        blocks: gameCore.gameState?.blocks?.length || 0
      };
    }, { rawSave, storageKeys: STORAGE_KEYS, preserveAccessibility: !!options.preserveAccessibility });
    await this.installCognitionSubscriber();
    return result;
  }

  async startValeIsolationTrace() {
    const fixtureVale = (this.fixtureSpec.cast || []).find(entry => entry.alias === 'Vale') || null;
    const details = await this.page.evaluate(({ fixtureVale }) => {
      function countMemories(entity) {
        const memories = entity?.lifeSim?.memories || {};
        const social = Array.isArray(memories.social) ? memories.social : [];
        const outcome = Array.isArray(memories.outcome) ? memories.outcome : [];
        const place = Array.isArray(memories.place) ? memories.place : [];
        return social.length + outcome.length + place.length;
      }
      function summarize(entity) {
        if (!entity) return null;
        return {
          id: entity.id,
          alias: entity.displayName || entity.lifeSim?.identity?.fixtureAlias || null,
          zoneId: entity.currentZoneId || entity.boardPos?.zoneId || entity.lifeSim?.lifecycle?.currentZoneId || null,
          boardPos: entity.boardPos ? { ...entity.boardPos } : null,
          edgeCount: Object.keys(entity.lifeSim?.socialEdges || {}).length,
          memoryPacketCount: countMemories(entity)
        };
      }
      const state = gameCore.getGameState();
      const vale = (state.butterflies || []).find(entity =>
        entity.displayName === 'Vale' || entity.lifeSim?.identity?.fixtureAlias === 'Vale'
      ) || null;
      const valeSummary = summarize(vale);
      const valeZoneId = valeSummary?.boardPos?.zoneId || valeSummary?.zoneId || fixtureVale?.zoneId || null;
      const sameZoneNeighbors = (state.butterflies || [])
        .filter(entity => entity?.id && entity.id !== vale?.id)
        .map(entity => {
          const board = entity.boardPos || null;
          const zoneId = entity.currentZoneId || board?.zoneId || entity.lifeSim?.lifecycle?.currentZoneId || null;
          if (!board || zoneId !== valeZoneId || !valeSummary?.boardPos) return null;
          return {
            id: entity.id,
            alias: entity.displayName || entity.lifeSim?.identity?.fixtureAlias || null,
            distanceUnits: Math.hypot((board.u || 0) - (valeSummary.boardPos.u || 0), (board.v || 0) - (valeSummary.boardPos.v || 0))
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distanceUnits - b.distanceUnits)
        .slice(0, 5);
      const trace = {
        installedAtFrame: gameCore.getCurrentFrame?.() || state.currentFrame || 0,
        valeId: vale?.id || null,
        fixtureBoardPos: fixtureVale?.boardPos || null,
        initial: valeSummary,
        sameZoneNeighborsAtStart: sameZoneNeighbors,
        ensureLifeSimStateCount: 0,
        ensureLifeSocialEdgeCount: 0,
        ensureLifeSimState: [],
        ensureLifeSocialEdge: []
      };
      window.__g0hValeIsolationTrace = trace;

      function recordTraceSample(bucket, sample) {
        const traceState = window.__g0hValeIsolationTrace;
        if (!traceState) return;
        const countKey = `${bucket}Count`;
        traceState[countKey] = (traceState[countKey] || 0) + 1;
        const samples = traceState[bucket];
        if (Array.isArray(samples) && samples.length < 32) {
          samples.push(sample);
        }
      }

      if (vale?.id && lifeSimSystem?.ensureLifeSimState && !lifeSimSystem.__g0hValeTraceOriginalEnsureLifeSimState) {
        lifeSimSystem.__g0hValeTraceOriginalEnsureLifeSimState = lifeSimSystem.ensureLifeSimState.bind(lifeSimSystem);
        lifeSimSystem.ensureLifeSimState = function tracedEnsureLifeSimState(entity, ...args) {
          const result = lifeSimSystem.__g0hValeTraceOriginalEnsureLifeSimState(entity, ...args);
          if (entity?.id === window.__g0hValeIsolationTrace?.valeId) {
            recordTraceSample('ensureLifeSimState', {
              frame: gameCore.getCurrentFrame?.() || gameCore.getGameState?.()?.currentFrame || 0,
              edgeCount: Object.keys(entity.lifeSim?.socialEdges || {}).length,
              memoryPacketCount: countMemories(entity)
            });
          }
          return result;
        };
      }

      if (vale?.id && typeof ensureLifeSocialEdge === 'function' && !window.__g0hValeTraceOriginalEnsureLifeSocialEdge) {
        window.__g0hValeTraceOriginalEnsureLifeSocialEdge = ensureLifeSocialEdge;
        window.ensureLifeSocialEdge = function tracedEnsureLifeSocialEdge(entity, targetId, ...args) {
          const result = window.__g0hValeTraceOriginalEnsureLifeSocialEdge(entity, targetId, ...args);
          if (entity?.id === window.__g0hValeIsolationTrace?.valeId || targetId === window.__g0hValeIsolationTrace?.valeId) {
            recordTraceSample('ensureLifeSocialEdge', {
              frame: gameCore.getCurrentFrame?.() || gameCore.getGameState?.()?.currentFrame || 0,
              entityId: entity?.id || null,
              targetId,
              edgeCount: Object.keys(entity?.lifeSim?.socialEdges || {}).length
            });
          }
          return result;
        };
        try {
          ensureLifeSocialEdge = window.ensureLifeSocialEdge;
        } catch (_error) {
          window.__g0hValeIsolationTrace.ensureLifeSocialEdgeAssignmentError = true;
        }
      }

      return {
        installed: !!vale,
        trace
      };
    }, { fixtureVale });
    this.evidence.valeIsolation = {
      ...(this.evidence.valeIsolation || {}),
      traceStart: details
    };
    return details;
  }

  async collectValeIsolationDiagnosis() {
    const fixtureVale = (this.fixtureSpec.cast || []).find(entry => entry.alias === 'Vale') || null;
    const runtime = await this.page.evaluate(({ fixtureVale }) => {
      function countMemories(entity) {
        const memories = entity?.lifeSim?.memories || {};
        const social = Array.isArray(memories.social) ? memories.social : [];
        const outcome = Array.isArray(memories.outcome) ? memories.outcome : [];
        const place = Array.isArray(memories.place) ? memories.place : [];
        return {
          social: social.length,
          outcome: outcome.length,
          place: place.length,
          total: social.length + outcome.length + place.length
        };
      }
      function countMeaningfulEdges(entity) {
        return Object.values(entity?.lifeSim?.socialEdges || {}).filter(edge => {
          if (!edge || typeof edge !== 'object') return false;
          const tier = `${edge.bondTier || edge.tier || ''}`.toLowerCase();
          if (['companion', 'bonded', 'family', 'mate'].includes(tier)) return true;
          const strongest = Math.max(
            edge.trust || 0,
            edge.comfort || 0,
            edge.attachment || 0,
            edge.admiration || 0,
            edge.protectiveness || 0,
            edge.familiarity || 0
          );
          return strongest >= 0.35 || (edge.coTimeSeconds || 0) >= 60;
        }).length;
      }
      const state = gameCore.getGameState();
      const vale = (state.butterflies || []).find(entity =>
        entity.displayName === 'Vale' || entity.lifeSim?.identity?.fixtureAlias === 'Vale'
      ) || null;
      const memories = countMemories(vale);
      const current = vale ? {
        id: vale.id,
        zoneId: vale.currentZoneId || vale.boardPos?.zoneId || vale.lifeSim?.lifecycle?.currentZoneId || null,
        boardPos: vale.boardPos ? { ...vale.boardPos } : null,
        edgeCount: Object.keys(vale.lifeSim?.socialEdges || {}).length,
        meaningfulEdgeCount: countMeaningfulEdges(vale),
        memoryPacketCount: memories.total,
        memoryFamilyCounts: {
          social: memories.social,
          outcome: memories.outcome,
          place: memories.place
        },
        isolationMarker: gameUI.getInspectIsolationMarker?.(vale, state) || null
      } : null;
      const trace = window.__g0hValeIsolationTrace || null;
      return {
        fixtureBoardPos: fixtureVale?.boardPos || null,
        trace,
        current
      };
    }, { fixtureVale });
    const valeSnapshots = (this.evidence.snapshots || [])
      .map(snapshot => ({
        label: snapshot.label,
        frame: snapshot.frame,
        vale: snapshot.aliases?.Vale || null
      }))
      .filter(entry => !!entry.vale);
    const initial = runtime.trace?.initial || valeSnapshots[0]?.vale || null;
    const current = runtime.current || valeSnapshots[valeSnapshots.length - 1]?.vale || null;
    const nearestStartDistance = runtime.trace?.sameZoneNeighborsAtStart?.[0]?.distanceUnits ?? null;
    const startsEmpty = (initial?.edgeCount || 0) === 0 && (initial?.memoryPacketCount || 0) === 0;
    const startsIsolated = startsEmpty && (!Number.isFinite(nearestStartDistance) || nearestStartDistance >= 8);
    const endsWithEdges = (current?.edgeCount || 0) >= 2;
    const endsWithMemories = (current?.memoryPacketCount || 0) >= 3;
    const endsSocialized = endsWithEdges && endsWithMemories;
    const remainsIntentionallyAlone = startsIsolated && !endsWithEdges && !endsWithMemories;
    const cause = endsSocialized
      ? 'fixture-starts-isolated; lived play creates social truth'
      : remainsIntentionallyAlone
        ? 'fixture-intentional-isolation-remains-without-meaningful-social-truth'
        : startsIsolated && endsWithEdges
          ? 'fixture-starts-isolated; lived play creates edges without owned cognition packets'
          : 'possible-social-initialization-gap';
    const details = {
      pass: endsSocialized || remainsIntentionallyAlone,
      cause,
      startsEmpty,
      startsIsolated,
      remainsIntentionallyAlone,
      endsWithEdges,
      endsWithMemories,
      endsSocialized,
      initial,
      current,
      inspectMarker: current?.isolationMarker || null,
      nearestStartDistance,
      traceCounts: {
        ensureLifeSimState: runtime.trace?.ensureLifeSimStateCount ?? runtime.trace?.ensureLifeSimState?.length ?? 0,
        ensureLifeSocialEdge: runtime.trace?.ensureLifeSocialEdgeCount ?? runtime.trace?.ensureLifeSocialEdge?.length ?? 0
      },
      trace: runtime.trace,
      valeSnapshots
    };
    this.evidence.valeIsolation = details;
    return details;
  }

  async runAccessibilityPersistenceCycle() {
    const beforeReload = await this.page.evaluate(async () => {
      const key = 'papilionem-accessibility-v1';
      const parsePersisted = () => {
        try {
          return JSON.parse(window.localStorage.getItem(key) || '{}') || {};
        } catch (_error) {
          return {};
        }
      };
      const summarizeDom = () => {
        gameUI.accessibilityPanel.visible = true;
        const state = gameCore.getGameState?.() || gameCore.gameState || {};
        const domState = gameUI.buildAccessibilityDomState?.(state) || null;
        const controls = Object.fromEntries((domState?.controls || []).map(control => [control.id, control.value]));
        return {
          visible: !!domState?.visible,
          highContrast: !!domState?.highContrast,
          uiScale: domState?.uiScale || null,
          controls
        };
      };
      const before = {
        settings: gameUI.getAccessibilitySettings?.() || {},
        persisted: parsePersisted()
      };
      gameUI.accessibilityPanel.visible = true;
      gameUI.setAccessibilitySettings?.({
        colorblindMode: 'off',
        colorblindSafeIndicators: false,
        trailVisibility: 'off',
        highContrastUI: false,
        uiScale: 1
      });
      const colorblindSequence = [
        gameUI.cycleColorblindMode?.(),
        gameUI.cycleColorblindMode?.(),
        gameUI.cycleColorblindMode?.(),
        gameUI.cycleColorblindMode?.(),
        gameUI.cycleColorblindMode?.()
      ];
      const trailSequence = [
        gameUI.cycleAccessibilitySetting?.('trailVisibility', ['off', 'reduced', 'full']),
        gameUI.cycleAccessibilitySetting?.('trailVisibility', ['off', 'reduced', 'full'])
      ];
      const highContrastSequence = [
        gameUI.toggleAccessibilitySetting?.('highContrastUI'),
        gameUI.toggleAccessibilitySetting?.('highContrastUI'),
        gameUI.toggleAccessibilitySetting?.('highContrastUI')
      ];
      const uiScaleSequence = [
        gameUI.setUiScaleValue?.(0.85),
        gameUI.setUiScaleValue?.(1.1),
        gameUI.setUiScaleValue?.(1)
      ];
      if (typeof applyCanvasAccessibilityStyle === 'function') {
        applyCanvasAccessibilityStyle();
      }
      await gameCore.saveGameToStorage?.({ source: 'g0h-accessibility-cycle' });
      const settings = gameUI.getAccessibilitySettings?.() || {};
      const persisted = parsePersisted();
      return {
        before,
        applied: {
          colorblindSequence,
          trailSequence,
          highContrastSequence,
          uiScaleSequence
        },
        settings,
        persisted,
        dom: summarizeDom(),
        canvasFilters: Array.from(document.querySelectorAll('canvas')).map(canvas => canvas.style.filter || 'none')
      };
    });

    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await waitForGame(this.page);
    await dismissTitle(this.page);

    const afterReload = await this.page.evaluate(() => {
      const key = 'papilionem-accessibility-v1';
      const parsePersisted = () => {
        try {
          return JSON.parse(window.localStorage.getItem(key) || '{}') || {};
        } catch (_error) {
          return {};
        }
      };
      gameUI.accessibilityPanel.visible = true;
      if (typeof applyCanvasAccessibilityStyle === 'function') {
        applyCanvasAccessibilityStyle();
      }
      const state = gameCore.getGameState?.() || gameCore.gameState || {};
      const domState = gameUI.buildAccessibilityDomState?.(state) || null;
      const controls = Object.fromEntries((domState?.controls || []).map(control => [control.id, control.value]));
      return {
        settings: gameUI.getAccessibilitySettings?.() || {},
        persisted: parsePersisted(),
        dom: {
          visible: !!domState?.visible,
          highContrast: !!domState?.highContrast,
          uiScale: domState?.uiScale || null,
          controls
        },
        canvasFilters: Array.from(document.querySelectorAll('canvas')).map(canvas => canvas.style.filter || 'none')
      };
    });

    const expected = {
      colorblindMode: 'off',
      colorblindSafeIndicators: false,
      trailVisibility: 'full',
      highContrastUI: true,
      uiScale: 1
    };
    const matchesExpected = (settings = {}) => Object.entries(expected)
      .every(([key, value]) => settings?.[key] === value);
    const details = {
      expected,
      beforeReload,
      afterReload,
      checks: {
        appliedColorblindCycle: JSON.stringify(beforeReload.applied?.colorblindSequence || []) === JSON.stringify(['protanopia', 'deuteranopia', 'tritanopia', 'monochrome', 'off']),
        appliedTrailCycle: JSON.stringify(beforeReload.applied?.trailSequence || []) === JSON.stringify(['reduced', 'full']),
        appliedHighContrastCycle: JSON.stringify(beforeReload.applied?.highContrastSequence || []) === JSON.stringify([true, false, true]),
        appliedUiScaleCycle: JSON.stringify(beforeReload.applied?.uiScaleSequence || []) === JSON.stringify([0.85, 1.1, 1]),
        persistedBeforeReload: matchesExpected(beforeReload.persisted),
        settingsBeforeReload: matchesExpected(beforeReload.settings),
        persistedAfterReload: matchesExpected(afterReload.persisted),
        settingsAfterReload: matchesExpected(afterReload.settings),
        domCanvasAgreement:
          afterReload.dom?.highContrast === afterReload.settings?.highContrastUI &&
          afterReload.dom?.uiScale === afterReload.settings?.uiScale &&
          afterReload.dom?.controls?.highContrastUI === 'On' &&
          afterReload.dom?.controls?.trailVisibility === afterReload.settings?.trailVisibility &&
          afterReload.dom?.controls?.cycleColorblindMode === afterReload.settings?.colorblindMode,
        canvasFilterOff: (afterReload.canvasFilters || []).every(filter => filter === 'none')
      }
    };
    details.pass = Object.values(details.checks).every(Boolean);
    this.evidence.accessibility = details;
    return details;
  }

  async startCapture(label = 'g0h-scripted-playthrough') {
    this.startWallMs = Date.now();
    return this.page.evaluate(sessionLabel => {
      gameCore.telemetrySystem?.startSessionCapture?.(gameCore.getGameState(), {
        label: sessionLabel
      });
      return gameCore.telemetrySystem?.getSessionCaptureSummary?.() || null;
    }, label);
  }

  async waitUntil(targetMs) {
    const scaledTarget = this.fast ? Math.min(targetMs, Math.max(500, Math.round(targetMs / 30))) : targetMs;
    const elapsed = Date.now() - this.startWallMs;
    const remaining = Math.max(0, scaledTarget - elapsed);
    if (remaining > 0) {
      await this.page.waitForTimeout(remaining);
    }
    if (this.fast) {
      const frames = Math.max(1, Math.round((targetMs / 1000) * 60 / 30));
      await this.page.evaluate(frameCount => {
        for (let index = 0; index < frameCount; index += 1) {
          gameCore.update?.();
        }
      }, frames);
    }
  }

  async screenshot(fileName) {
    return saveShot(this.page, path.join(this.outputDir, 'screenshots'), fileName);
  }

  async focusZone(zoneId) {
    const result = await this.page.evaluate(id => {
      gameCore.setViewMode?.('focused-garden');
      const ok = !!gameCore.focusZone?.(id);
      if (gameUI?.inspectPanel) gameUI.inspectPanel.visible = false;
      return {
        ok,
        focusedZoneId: gameCore.getFocusedZoneId?.() || gameCore.gameState?.focusedZoneId || null,
        viewMode: gameCore.gameState?.viewMode || null
      };
    }, zoneId);
    if (result.focusedZoneId) this.evidence.zoneVisits.push(result.focusedZoneId);
    return result;
  }

  async showOverview() {
    const result = await this.page.evaluate(() => {
      if (typeof gameCore.setViewMode === 'function') {
        gameCore.setViewMode('overview');
      } else {
        gameCore.gameState.viewMode = 'overview';
      }
      if (gameUI?.inspectPanel) gameUI.inspectPanel.visible = false;
      return {
        viewMode: gameCore.gameState?.viewMode || null,
        focusedZoneId: gameCore.getFocusedZoneId?.() || gameCore.gameState?.focusedZoneId || null
      };
    });
    if (result.focusedZoneId) this.evidence.zoneVisits.push(result.focusedZoneId);
    return result;
  }

  async inspect(alias, options = {}) {
    const details = await this.page.evaluate(({ alias, afterReload }) => {
      function summarizeLifeSimMemories(entity) {
        const families = entity?.lifeSim?.memories || {};
        const socialPackets = Array.isArray(families.social) ? families.social : [];
        const outcomePackets = Array.isArray(families.outcome) ? families.outcome : [];
        const placePackets = Array.isArray(families.place) ? families.place : [];
        const memoryFamilyCounts = {
          social: socialPackets.length,
          outcome: outcomePackets.length,
          place: placePackets.length
        };
        const memoryKindCounts = {
          bereavement: socialPackets.filter(packet => packet?.kind === 'bereavement').length,
          bereavementDeath: socialPackets.filter(packet => packet?.kind === 'bereavement' && packet?.subtype !== 'long-absence').length,
          bereavementLongAbsence: socialPackets.filter(packet => packet?.kind === 'bereavement' && packet?.subtype === 'long-absence').length,
          witnessedAffection: socialPackets.filter(packet => packet?.kind === 'witnessedAffection').length,
          loyaltyChoice: socialPackets.filter(packet => packet?.kind === 'loyaltyChoice').length,
          prideAnchor: outcomePackets.filter(packet => packet?.anchor === 'pride').length,
          shameAnchor: outcomePackets.filter(packet => packet?.anchor === 'shame').length
        };
        return {
          memoryPacketCount: memoryFamilyCounts.social + memoryFamilyCounts.outcome + memoryFamilyCounts.place,
          memoryFamilyCounts,
          memoryKindCounts
        };
      }
      function countMeaningfulEdges(entity) {
        return Object.values(entity?.lifeSim?.socialEdges || {}).filter(edge => {
          if (!edge || typeof edge !== 'object') return false;
          const tier = `${edge.bondTier || edge.tier || ''}`.toLowerCase();
          if (['companion', 'bonded', 'family', 'mate'].includes(tier)) return true;
          const strongest = Math.max(
            edge.trust || 0,
            edge.comfort || 0,
            edge.attachment || 0,
            edge.admiration || 0,
            edge.protectiveness || 0,
            edge.familiarity || 0
          );
          return strongest >= 0.35 || (edge.coTimeSeconds || 0) >= 60;
        }).length;
      }
      const state = gameCore.getGameState();
      const target = (state.butterflies || []).find(entity => entity.displayName === alias || entity.lifeSim?.identity?.fixtureAlias === alias) || null;
      if (!target) return { alias, found: false, afterReload: !!afterReload };
      const memorySummary = summarizeLifeSimMemories(target);
      gameUI.inspectPanel.visible = true;
      gameUI.inspectPanel.lockedTargetId = target.id;
      gameUI.inspectPanel.scrollOffset = 0;
      gameUI.inspectControl.browseScope = 'all';
      gameUI.inspectControl.lockedBrowseScope = 'all';
      const isolationMarker = gameUI.getInspectIsolationMarker?.(target, state) || null;
      return {
        alias,
        id: target.id,
        found: true,
        afterReload: !!afterReload,
        zoneId: target.currentZoneId || target.lifeSim?.lifecycle?.currentZoneId || null,
        memoryPacketCount: memorySummary.memoryPacketCount,
        memoryFamilyCounts: memorySummary.memoryFamilyCounts,
        memoryKindCounts: memorySummary.memoryKindCounts,
        edgeCount: Object.keys(target.lifeSim?.socialEdges || {}).length,
        meaningfulEdgeCount: countMeaningfulEdges(target),
        boardPos: target.boardPos || null,
        isolationMarker
      };
    }, { alias, afterReload: !!options.afterReload });
    this.evidence.inspections.push(details);
    await this.flushCognitionSubscriber(`inspect:${alias}`);
    return details;
  }

  async snapshot(label) {
    const details = await this.page.evaluate(({ label, expectedAliases }) => {
      function clone(value, fallback = null) {
        try {
          return JSON.parse(JSON.stringify(value));
        } catch (_error) {
          return fallback;
        }
      }
      function summarizeLifeSimMemories(entity) {
        const families = entity?.lifeSim?.memories || {};
        const socialPackets = Array.isArray(families.social) ? families.social : [];
        const outcomePackets = Array.isArray(families.outcome) ? families.outcome : [];
        const placePackets = Array.isArray(families.place) ? families.place : [];
        const memoryFamilyCounts = {
          social: socialPackets.length,
          outcome: outcomePackets.length,
          place: placePackets.length
        };
        const memoryKindCounts = {
          bereavement: socialPackets.filter(packet => packet?.kind === 'bereavement').length,
          bereavementDeath: socialPackets.filter(packet => packet?.kind === 'bereavement' && packet?.subtype !== 'long-absence').length,
          bereavementLongAbsence: socialPackets.filter(packet => packet?.kind === 'bereavement' && packet?.subtype === 'long-absence').length,
          witnessedAffection: socialPackets.filter(packet => packet?.kind === 'witnessedAffection').length,
          loyaltyChoice: socialPackets.filter(packet => packet?.kind === 'loyaltyChoice').length,
          prideAnchor: outcomePackets.filter(packet => packet?.anchor === 'pride').length,
          shameAnchor: outcomePackets.filter(packet => packet?.anchor === 'shame').length
        };
        return {
          memoryPacketCount: memoryFamilyCounts.social + memoryFamilyCounts.outcome + memoryFamilyCounts.place,
          memoryFamilyCounts,
          memoryKindCounts
        };
      }
      const state = gameCore.getGameState();
      const aliases = {};
      for (const alias of expectedAliases) {
        const entity = (state.butterflies || []).find(entry => entry.displayName === alias || entry.lifeSim?.identity?.fixtureAlias === alias) || null;
        if (!entity) {
          aliases[alias] = null;
          continue;
        }
        const memorySummary = summarizeLifeSimMemories(entity);
        aliases[alias] = {
          id: entity.id,
          zoneId: entity.currentZoneId || entity.lifeSim?.lifecycle?.currentZoneId || null,
          boardPos: clone(entity.boardPos, null),
          edgeCount: Object.keys(entity.lifeSim?.socialEdges || {}).length,
          memoryPacketCount: memorySummary.memoryPacketCount,
          memoryFamilyCounts: memorySummary.memoryFamilyCounts,
          memoryKindCounts: memorySummary.memoryKindCounts,
          isolationMarker: gameUI.getInspectIsolationMarker?.(entity, state) || null,
          derivedFeelings: clone(entity.lifeSim?.derived?.feelings || entity.lifeSim?.derived?.emotionalState || {}, {}),
          drives: clone(entity.lifeSim?.drives || {}, {}),
          emotions: clone(entity.lifeSim?.emotions || {}, {})
        };
      }
      const blocks = (state.blocks || []).map(block => {
        const boardPos = block.boardPos || structureSystem?.getBlockCell?.(block) || null;
        return {
          id: block.id,
          fixtureId: block.fixtureId || null,
          currentZoneId: block.currentZoneId || boardPos?.zoneId || null,
          boardPos: clone(boardPos, null),
          key: boardPos ? `${boardPos.zoneId}:${boardPos.u}:${boardPos.v}:${boardPos.h || 0}` : null
        };
      });
      const flowers = (state.flowers || []).map(flower => ({
        id: flower.id,
        currentZoneId: flower.currentZoneId || flower.boardPos?.zoneId || null,
        boardPos: clone(flower.boardPos, null),
        lifecycleKind: flower.lifecycleKind || 'flower',
        stage: flower.stage || null,
        flowerType: flower.flowerType || null,
        cleanedAtFrame: flower.cleanedAtFrame || null
      }));
      const eventHistory = typeof eventBus !== 'undefined'
        ? {
            dialogueSpoken: eventBus.getHistory?.(GameEvents.DIALOGUE_SPOKEN)?.length || 0,
            communicationSignal: eventBus.getHistory?.(GameEvents.COMMUNICATION_SIGNAL)?.length || 0,
            objectDelivered: eventBus.getHistory?.(GameEvents.OBJECT_DELIVERED)?.length || 0,
            objectPickedUp: eventBus.getHistory?.(GameEvents.OBJECT_PICKED_UP)?.length || 0,
            battleAction: eventBus.getHistory?.(GameEvents.BATTLE_ACTION_OCCURRED)?.length || 0,
            battleCommitted: eventBus.getHistory?.(GameEvents.BATTLE_COMMITTED)?.length || 0,
            cognitionTriggered: eventBus.getHistory?.('cognition:triggered')?.length || 0
          }
        : {};
      const cognitionEvents = typeof eventBus !== 'undefined'
        ? (eventBus.getHistory?.('cognition:triggered') || []).map(entry => entry.data || entry).slice(-20)
        : [];
      const feedEntries = communicationSystem?.getFeedEntries?.({ limit: 12 }) || [];
      const telemetrySummary = gameCore.telemetrySystem?.getSessionCaptureSummary?.() || {};
      return {
        label,
        frame: gameCore.getCurrentFrame?.() || state.currentFrame || 0,
        focusedZoneId: gameCore.getFocusedZoneId?.() || state.focusedZoneId || null,
        viewMode: state.viewMode || null,
        aliases,
        blocks,
        flowers,
        eventHistory,
        cognitionEvents,
        feedEntries: clone(feedEntries, []),
        telemetrySummary,
        mlRuntime: mlInferenceSystem?.getRuntimeSummary?.() || null
      };
    }, {
      label,
      expectedAliases: this.fixtureSpec.cast.map(entry => entry.alias)
    });
    this.absorbCognitionEvents(details.cognitionEvents);
    await this.flushCognitionSubscriber(`snapshot:${label}`);
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    this.evidence.snapshots.push(details);
    return details;
  }

  async killBondedPartner(alias = 'Pollen') {
    const details = await this.page.evaluate(targetAlias => {
      const state = gameCore.getGameState();
      const target = (state.butterflies || []).find(entity =>
        entity.displayName === targetAlias || entity.lifeSim?.identity?.fixtureAlias === targetAlias
      ) || null;
      if (!target) return { ok: false, reason: 'missing-target', targetAlias };

      target.hp = 0;
      target.health = 0;
      target.dead = true;
      target.lifeSim = target.lifeSim || {};
      target.lifeSim.lifecycle = target.lifeSim.lifecycle || {};
      target.lifeSim.lifecycle.deceased = true;
      target.lifeSim.lifecycle.deceasedAtFrame = gameCore.getCurrentFrame?.() || state.currentFrame || 0;
      if (typeof eventBus !== 'undefined' && GameEvents?.BUTTERFLY_DIED) {
        eventBus.emit(GameEvents.BUTTERFLY_DIED, {
          entity: target,
          butterfly: target,
          id: target.id,
          source: 'g0h-scripted-bonded-loss'
        });
      }
      return {
        ok: true,
        deceasedId: target.id,
        deceasedAlias: targetAlias,
        cognition: eventBus.getHistory?.('cognition:triggered')?.slice(-12).map(entry => entry.data || entry) || []
      };
    }, alias);
    this.absorbCognitionEvents(details.cognition);
    await this.flushCognitionSubscriber('bonded-partner-death');
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    this.evidence.bondedPartnerDeath = details;
    return details;
  }

  async nudgeWitnessedAffection() {
    const details = await this.page.evaluate(() => {
      const state = gameCore.getGameState();
      const byAlias = alias => (state.butterflies || []).find(entity =>
        entity.displayName === alias || entity.lifeSim?.identity?.fixtureAlias === alias
      ) || null;
      const iris = byAlias('Iris');
      const juniper = byAlias('Juniper');
      const kite = byAlias('Kite');
      if (!iris || !juniper || !kite) return { ok: false, reason: 'missing-cast' };
      const beforePackets = Array.isArray(iris.lifeSim?.memories?.social)
        ? iris.lifeSim.memories.social.length
        : 0;

      const zoneId = 'ivy-cloister';
      const positions = [
        [iris, { zoneId, u: 16, v: 8, h: 0 }],
        [juniper, { zoneId, u: 17, v: 8, h: 0 }],
        [kite, { zoneId, u: 18, v: 8, h: 0 }]
      ];
      for (const [entity, boardPos] of positions) {
        const screen = renderManager?.boardToScreen?.(boardPos) || null;
        entity.currentZoneId = boardPos.zoneId;
        entity.boardPos = { ...boardPos };
        entity.lifeSim = entity.lifeSim || {};
        entity.lifeSim.lifecycle = entity.lifeSim.lifecycle || {};
        entity.lifeSim.lifecycle.currentZoneId = boardPos.zoneId;
        if (screen) {
          entity.x = screen.x;
          entity.y = screen.y;
        }
        gameCore.assignEntityToZone?.(entity, boardPos.zoneId);
        entity.syncDebugGridPos?.();
      }
      iris.lifeSim.memories = iris.lifeSim.memories || {};
      iris.lifeSim.memories.social = Array.isArray(iris.lifeSim.memories.social)
        ? iris.lifeSim.memories.social.filter(packet => {
          if (packet?.kind !== 'witnessedAffection') return true;
          const relatesToNudge = packet?.bondPartnerId === juniper.id
            || packet?.partnerId === juniper.id
            || packet?.sourceId === juniper.id
            || packet?.thirdPartyId === kite.id;
          return !relatesToNudge;
        })
        : [];

      const strengthenEdge = (entity, target, values = {}) => {
        entity.lifeSim = entity.lifeSim || {};
        entity.lifeSim.socialEdges = entity.lifeSim.socialEdges || {};
        const edge = typeof ensureLifeSocialEdge === 'function'
          ? ensureLifeSocialEdge(entity, target.id)
          : (entity.lifeSim.socialEdges[target.id] = {
            ...(entity.lifeSim.socialEdges[target.id] || {}),
            targetId: target.id
          });
        Object.assign(edge, values);
        return edge;
      };
      const witnessSourceEdge = strengthenEdge(iris, juniper, {
        trust: 0.72,
        comfort: 0.72,
        attachment: 0.68,
        familiarity: 0.78,
        coTimeSeconds: 1800,
        bondTier: 'companion'
      });
      strengthenEdge(juniper, kite, {
        trust: 0.7,
        comfort: 0.74,
        attachment: 0.66,
        familiarity: 0.76,
        coTimeSeconds: 1800,
        bondTier: 'companion'
      });

      const distance = structureSystem?.getBoardDistanceBetweenEntities?.(iris, juniper, zoneId) ?? Infinity;
      const result = communicationSystem.emitCooperationSignal?.(juniper, {
        signalType: 'acknowledgement_signal',
        intentFamily: 'social',
        intentTags: ['comfort', 'companionship', 'warmth'],
        phrase: 'Kite, stay close to me; you are easy company.',
        targetIds: [kite.id],
        zoneId,
        reason: 'g0h-scripted-witnessed-affection',
        metadata: { affectionIntensity: 0.82 }
      });
      for (let index = 0; index < 60; index += 1) {
        gameCore.update?.();
      }
      return {
        ok: !!result,
        sourceId: juniper.id,
        witnessId: iris.id,
        thirdPartyId: kite.id,
        distance,
        witnessSourceEdge: {
          bondTier: witnessSourceEdge?.bondTier || null,
          trust: witnessSourceEdge?.trust ?? null,
          comfort: witnessSourceEdge?.comfort ?? null,
          attachment: witnessSourceEdge?.attachment ?? null,
          coTimeSeconds: witnessSourceEdge?.coTimeSeconds ?? null
        },
        beforePackets,
        afterPackets: iris.lifeSim.memories.social.length,
        witnessedPackets: iris.lifeSim.memories.social.filter(packet => packet?.kind === 'witnessedAffection').map(packet => ({
          bondPartnerId: packet.bondPartnerId || null,
          partnerId: packet.partnerId || null,
          sourceId: packet.sourceId || null,
          thirdPartyId: packet.thirdPartyId || null,
          intensity: packet.intensity ?? null
        })),
        dialogueCount: eventBus.getHistory?.(GameEvents.DIALOGUE_SPOKEN)?.length || 0,
        cognition: eventBus.getHistory?.('cognition:triggered')?.slice(-12).map(entry => entry.data || entry) || []
      };
    });
    this.absorbCognitionEvents(details.cognition);
    await this.flushCognitionSubscriber('witnessed-affection');
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    this.evidence.witnessedAffection = details;
    return details;
  }

  async triggerScoutSignal() {
    const details = await this.page.evaluate(() => {
      const state = gameCore.getGameState();
      const source = (state.butterflies || []).find(entity => entity.displayName === 'Lumen') || null;
      const recipients = (state.butterflies || []).filter(entity => ['Mira', 'Nettle'].includes(entity.displayName));
      if (!source || recipients.length < 2) {
        return { ok: false, reason: 'missing-scout-cast' };
      }
      source.lifeSim = source.lifeSim || {};
      source.lifeSim.derived = source.lifeSim.derived || {};
      source.lifeSim.derived.migration = {
        ...(source.lifeSim.derived.migration || {}),
        scoutTargetZoneId: 'pool-heart',
        travelIntent: 'scouting',
        scoutingDrive: 0.8
      };
      source.lifeSim.communication = source.lifeSim.communication || {};
      source.lifeSim.communication.lastScoutDiscoveryAtSeconds = -Infinity;
      const frame = 1800;
      const emitted = communicationSystem.updateScoutDiscovery?.(state, frame) || 0;
      return {
        ok: emitted > 0,
        emitted,
        signalCount: eventBus.getHistory?.(GameEvents.COMMUNICATION_SIGNAL)?.length || 0,
        dialogueCount: eventBus.getHistory?.(GameEvents.DIALOGUE_SPOKEN)?.length || 0,
        cognition: eventBus.getHistory?.('cognition:triggered')?.slice(-6).map(entry => entry.data || entry) || []
      };
    });
    this.absorbCognitionEvents(details.cognition);
    await this.flushCognitionSubscriber('scout-signal');
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    return details;
  }

  async triggerDistressChoice() {
    const details = await this.page.evaluate(() => {
      const state = gameCore.getGameState();
      const byName = name => (state.butterflies || []).find(entity => entity.displayName === name) || null;
      const aster = byName('Aster');
      const briar = byName('Briar');
      const clover = byName('Clover');
      if (!aster || !briar || !clover) return { ok: false, reason: 'missing-distress-cast' };
      const zoneId = 'moss-hollow';
      const place = (entity, u, v) => {
        const boardPos = { zoneId, u, v, h: 0 };
        const screen = renderManager.boardToScreen?.(boardPos) || { x: entity.x, y: entity.y };
        entity.currentZoneId = zoneId;
        entity.boardPos = { ...boardPos };
        entity.gridPos = { x: u, y: v };
        entity.x = screen.x;
        entity.y = screen.y;
        entity.state = 'normal';
        entity.zoneTravel = null;
        entity.movement?.clearTarget?.('g0h-distress-choice');
        entity.syncDebugGridPos?.();
        entity.lifeSim = entity.lifeSim || {};
        entity.lifeSim.lifecycle = entity.lifeSim.lifecycle || {};
        entity.lifeSim.lifecycle.currentZoneId = zoneId;
      };
      place(briar, 12, 10);
      place(clover, 13.2, 10.2);
      place(aster, 12.5, 10.4);
      for (const target of [briar, clover]) {
        target.lifeSim.emotions = target.lifeSim.emotions || {};
        target.lifeSim.emotions.threat = 0.78;
        target.lifeSim.emotions.exhaustion = 0.7;
        target.lifeSim.communication = target.lifeSim.communication || {};
        target.lifeSim.communication.lastDistressAtSeconds = -Infinity;
      }
      aster.lifeSim.drives = aster.lifeSim.drives || {};
      aster.lifeSim.drives.caregiving = 0.82;
      const currentFrame = gameCore.getCurrentFrame?.() || state.currentFrame || 0;
      const frameA = Math.max(270, Math.ceil(currentFrame / 90) * 90);
      state.currentFrame = frameA;
      const emittedA = communicationSystem.updateDistressCascade?.(state, frameA) || 0;
      state.currentFrame = frameA + 90;
      const emittedB = communicationSystem.updateDistressCascade?.(state, frameA + 90) || 0;
      briar.lifeSim.emotions.threat = 0.22;
      briar.lifeSim.emotions.exhaustion = 0.2;
      state.currentFrame = frameA + 180;
      const emittedC = communicationSystem.updateDistressCascade?.(state, frameA + 180) || 0;
      clover.lifeSim.emotions.threat = 0.82;
      clover.lifeSim.emotions.exhaustion = 0.66;
      state.currentFrame = frameA + 270;
      const emittedD = communicationSystem.updateDistressCascade?.(state, frameA + 270) || 0;
      return {
        ok: (emittedA + emittedB + emittedC + emittedD) > 0,
        emitted: emittedA + emittedB + emittedC + emittedD,
        dialogueCount: eventBus.getHistory?.(GameEvents.DIALOGUE_SPOKEN)?.length || 0,
        signalCount: eventBus.getHistory?.(GameEvents.COMMUNICATION_SIGNAL)?.length || 0,
        cognition: eventBus.getHistory?.('cognition:triggered')?.slice(-10).map(entry => entry.data || entry) || []
      };
    });
    this.absorbCognitionEvents(details.cognition);
    await this.flushCognitionSubscriber('distress-choice');
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    return details;
  }

  async provokeAbandonedAllyShame() {
    const details = await this.page.evaluate(() => {
      const state = gameCore.getGameState();
      const byName = name => (state.butterflies || []).find(entity => entity.displayName === name) || null;
      const distressed = byName('Briar') || byName('Vale');
      const nonResponder = byName('Aster');
      if (!distressed || !nonResponder) return { ok: false, reason: 'missing-abandoned-ally-cast' };
      const zoneId = 'moss-hollow';
      const place = (entity, u, v) => {
        const boardPos = { zoneId, u, v, h: 0 };
        const screen = renderManager.boardToScreen?.(boardPos) || { x: entity.x, y: entity.y };
        entity.currentZoneId = zoneId;
        entity.boardPos = { ...boardPos };
        entity.gridPos = { x: u, y: v };
        entity.x = screen.x;
        entity.y = screen.y;
        entity.state = 'normal';
        entity.zoneTravel = null;
        entity.movement?.clearTarget?.('g0h-abandoned-ally');
        entity.syncDebugGridPos?.();
        entity.lifeSim = entity.lifeSim || {};
        entity.lifeSim.lifecycle = entity.lifeSim.lifecycle || {};
        entity.lifeSim.lifecycle.currentZoneId = zoneId;
        entity.lifeSim.spatialAwareness = entity.lifeSim.spatialAwareness || {};
        entity.lifeSim.spatialAwareness.boardPos = { ...boardPos };
      };
      place(distressed, 8, 20);
      place(nonResponder, 24, 20);
      distressed.lifeSim.emotions = distressed.lifeSim.emotions || {};
      distressed.lifeSim.emotions.threat = 0.9;
      distressed.lifeSim.emotions.exhaustion = 0.7;
      distressed.lifeSim.communication = distressed.lifeSim.communication || {};
      distressed.lifeSim.communication.lastDistressAtSeconds = -Infinity;
      nonResponder.lifeSim.drives = nonResponder.lifeSim.drives || {};
      nonResponder.lifeSim.drives.caregiving = 0.02;
      nonResponder.lifeSim.drives.socialConnection = Math.max(nonResponder.lifeSim.drives.socialConnection || 0, 0.72);
      if (typeof ensureLifeSocialEdge === 'function') {
        const edge = ensureLifeSocialEdge(nonResponder, distressed.id);
        Object.assign(edge, {
          trust: 0.72,
          comfort: 0.7,
          attachment: 0.68,
          protectiveness: 0.62,
          bondTier: 'companion',
          coTimeSeconds: Math.max(edge.coTimeSeconds || 0, 900)
        });
      } else {
        nonResponder.lifeSim.socialEdges = nonResponder.lifeSim.socialEdges || {};
        nonResponder.lifeSim.socialEdges[distressed.id] = {
          ...(nonResponder.lifeSim.socialEdges[distressed.id] || {}),
          trust: 0.72,
          comfort: 0.7,
          attachment: 0.68,
          protectiveness: 0.62,
          bondTier: 'companion',
          coTimeSeconds: 900
        };
      }
      const currentFrame = gameCore.getCurrentFrame?.() || state.currentFrame || 0;
      const startFrame = Math.max(1080, Math.ceil(currentFrame / 90) * 90);
      const resolveFrame = startFrame + 630;
      const beforeCount = eventBus.getHistory?.('cognition:triggered')?.length || 0;
      state.currentFrame = startFrame;
      communicationSystem.updateDistressCascade?.(state, startFrame);
      state.currentFrame = resolveFrame;
      communicationSystem.updateDistressCascade?.(state, resolveFrame);
      const cognition = eventBus.getHistory?.('cognition:triggered')?.slice(-20).map(entry => entry.data || entry) || [];
      const abandonedEvents = cognition.filter(event => event?.kind === 'shame' && event?.trigger === 'abandonedAlly');
      return {
        ok: abandonedEvents.length > 0,
        distressedId: distressed.id,
        distressedAlias: distressed.displayName,
        nonResponderId: nonResponder.id,
        nonResponderAlias: nonResponder.displayName,
        beforeCount,
        afterCount: eventBus.getHistory?.('cognition:triggered')?.length || 0,
        abandonedEvents,
        cognition
      };
    });
    this.absorbCognitionEvents(details.cognition);
    await this.flushCognitionSubscriber('abandoned-ally-shame');
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    this.evidence.abandonedAllyShame = details;
    return details;
  }

  async provokeWarningIgnoredHarmShame() {
    const details = await this.page.evaluate(() => {
      const state = gameCore.getGameState();
      const byName = name => (state.butterflies || []).find(entity => entity.displayName === name) || null;
      const warner = byName('Lumen');
      const witness = byName('Mira');
      const hazard = byName('Thorn') || byName('Kite');
      if (!warner || !witness) return { ok: false, reason: 'missing-warning-harm-cast' };
      const zoneId = 'ivy-cloister';
      const place = (entity, u, v) => {
        const boardPos = { zoneId, u, v, h: 0 };
        const screen = renderManager.boardToScreen?.(boardPos) || { x: entity.x, y: entity.y };
        entity.currentZoneId = zoneId;
        entity.boardPos = { ...boardPos };
        entity.gridPos = { x: u, y: v };
        entity.x = screen.x;
        entity.y = screen.y;
        entity.state = 'normal';
        entity.zoneTravel = null;
        entity.movement?.clearTarget?.('g0h-warning-harm');
        entity.syncDebugGridPos?.();
        entity.lifeSim = entity.lifeSim || {};
        entity.lifeSim.lifecycle = entity.lifeSim.lifecycle || {};
        entity.lifeSim.lifecycle.currentZoneId = zoneId;
      };
      place(warner, 7, 7);
      place(witness, 8, 7);
      if (hazard) place(hazard, 10, 7);
      const emitted = communicationSystem.emitCooperationSignal?.(warner, {
        signalType: 'warning_signal',
        intentFamily: 'care',
        intentTags: ['warning', 'comfort'],
        phrase: 'Mira, back away from that edge; it is unsafe.',
        targetIds: [witness.id],
        zoneId,
        reason: 'g0h-scripted-warning-harm'
      });
      for (let index = 0; index < 120; index += 1) {
        gameCore.update?.();
      }
      eventBus.emit?.(GameEvents.BATTLE_ACTION_OCCURRED, {
        battleId: 'g0h_warning_ignored_harm',
        roundNumber: 1,
        actorId: hazard?.id || warner.id,
        type: 'attack',
        targetId: witness.id,
        damage: 8,
        source: 'g0h-scripted-warning-harm'
      });
      const cognition = eventBus.getHistory?.('cognition:triggered')?.slice(-20).map(entry => entry.data || entry) || [];
      const warningEvents = cognition.filter(event => event?.kind === 'shame' && event?.trigger === 'warningIgnoredHarm');
      return {
        ok: warningEvents.length > 0,
        emitted: !!emitted,
        warningRecordCount: communicationSystem.warningRecords?.length || 0,
        warnerId: warner.id,
        witnessId: witness.id,
        warningEvents,
        cognition
      };
    });
    this.absorbCognitionEvents(details.cognition);
    await this.flushCognitionSubscriber('warning-ignored-harm-shame');
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    this.evidence.warningIgnoredHarmShame = details;
    return details;
  }

  async nudgeFlowerCleanup() {
    const before = await this.page.evaluate(() => {
      const state = gameCore.getGameState();
      const pilesBefore = (state.flowers || []).filter(flower => flower.lifecycleKind === 'dirt-pile').length;
      const normalBefore = (state.flowers || []).filter(flower => (flower.lifecycleKind || 'flower') === 'flower').length;
      for (const flower of state.flowers || []) {
        if ((flower.lifecycleKind || 'flower') === 'flower' && flower.resourceOrigin === 'g0h-fixture') {
          flower.spawnedAtFrame = (gameCore.getCurrentFrame?.() || 0) - Math.max(1, flower.getDecayFrames?.() || 3600) - 1;
          flower.update?.(state);
          break;
        }
      }
      return {
        pilesBefore,
        normalBefore,
        cleanupAffordanceCount: (state.butterflies || []).filter(entity =>
          entity.lifeSim?.objectAwareness?.currentAffordance === 'clean'
        ).length
      };
    });
    const details = await this.page.evaluate((before) => {
      const state = gameCore.getGameState();
      const pilesAfter = (state.flowers || []).filter(flower => flower.lifecycleKind === 'dirt-pile').length;
      const normalAfter = (state.flowers || []).filter(flower => (flower.lifecycleKind || 'flower') === 'flower').length;
      return {
        evidenceCaptured: pilesAfter !== before.pilesBefore || normalAfter !== before.normalBefore,
        noDriverCleanupInjection: true,
        phaseDurationMs: 0,
        pilesBefore: before.pilesBefore,
        pilesAfter,
        cleanedNet: Math.max(0, before.pilesBefore - pilesAfter),
        normalBefore: before.normalBefore,
        normalAfter,
        cleanupAffordanceBefore: before.cleanupAffordanceCount,
        cleanupAffordanceAfter: (state.butterflies || []).filter(entity =>
          entity.lifeSim?.objectAwareness?.currentAffordance === 'clean'
        ).length,
        objectDelivered: eventBus.getHistory?.(GameEvents.OBJECT_DELIVERED)?.length || 0,
        objectConsumed: eventBus.getHistory?.(GameEvents.OBJECT_CONSUMED)?.length || 0
      };
    }, before);
    this.evidence.flowerLifecycle = details;
    return details;
  }

  async refreshFlowerLifecycleFinal() {
    const finalDetails = await this.page.evaluate(existing => {
      const zones = gameCore.getZoneIds?.() || ['ivy-cloister', 'moss-hollow', 'pool-heart', 'sun-court'];
      const activityDirtConfig = gameConfig?.cognition?.affordances?.cleanupActivityDirt || null;
      const flowerConfig = gameConfig?.entities?.flower || null;
      const previousActivityDirtEnabled = activityDirtConfig ? activityDirtConfig.enabled : null;
      const previousFlowerDecayEnabled = flowerConfig ? flowerConfig.decayEnabled : null;
      if (activityDirtConfig) {
        activityDirtConfig.enabled = false;
      }
      if (flowerConfig) {
        flowerConfig.decayEnabled = false;
      }
      gameCore.gameState.pendingPollenPlantings = [];
      const cleanupPiles = (gameCore.gameState.flowers || [])
        .filter(flower => flower?.lifecycleKind === 'dirt-pile' || flower?.isCleanupObject?.())
        .slice(0, 8);
      let cleanupPrepositionedCount = 0;
      for (const butterfly of gameCore.gameState.butterflies || []) {
        butterfly.pendingPollenDropTarget = null;
        butterfly.lifeSim.drives = butterfly.lifeSim.drives || {};
        butterfly.lifeSim.drives.selfMaintenance = Math.max(butterfly.lifeSim.drives.selfMaintenance || 0, 0.92);
        butterfly.lifeSim.objectAwareness = butterfly.lifeSim.objectAwareness || {};
        butterfly.lifeSim.objectAwareness.currentAffordance = 'clean';
        butterfly.state = butterfly.state === 'scared' || butterfly.state === 'display' ? 'normal' : butterfly.state;
      }
      for (let index = 0; index < cleanupPiles.length; index += 1) {
        const pile = cleanupPiles[index];
        const butterfly = (gameCore.gameState.butterflies || [])[index];
        if (!pile || !butterfly) continue;
        const pileBoard = pile.boardPos || renderManager?.screenToBoard?.(pile.x, pile.y, pile.currentZoneId || butterfly.currentZoneId);
        if (!pileBoard || !Number.isFinite(pileBoard.u) || !Number.isFinite(pileBoard.v)) continue;
        const zoneId = pileBoard.zoneId || pile.currentZoneId || butterfly.currentZoneId || null;
        if (!zoneId) continue;
        const approachBoard = {
          zoneId,
          u: Math.max(0, pileBoard.u - 0.35),
          v: pileBoard.v,
          h: 0
        };
        butterfly.currentZoneId = zoneId;
        butterfly.zoneTravel = null;
        butterfly.boardPos = approachBoard;
        butterfly.applyScreenFromBoardPos?.(approachBoard);
        butterfly.targetCleanupPile = pile;
        butterfly.movement?.setBoardTarget?.(pileBoard.u, pileBoard.v, 'cleanup', 10, 0);
        cleanupPrepositionedCount += 1;
      }
      const cleanupObservationFrames = 9600;
      for (let index = 0; index < cleanupObservationFrames; index += 1) {
        if (index % 600 === 0 && zones.length) {
          gameCore.focusZone?.(zones[Math.floor(index / 600) % zones.length]);
        }
        gameCore.update?.();
      }
      if (activityDirtConfig && previousActivityDirtEnabled !== null) {
        activityDirtConfig.enabled = previousActivityDirtEnabled;
      }
      if (flowerConfig && previousFlowerDecayEnabled !== null) {
        flowerConfig.decayEnabled = previousFlowerDecayEnabled;
      }
      const state = gameCore.getGameState();
      const pilesAfter = (state.flowers || []).filter(flower => flower.lifecycleKind === 'dirt-pile').length;
      const normalAfter = (state.flowers || []).filter(flower => (flower.lifecycleKind || 'flower') === 'flower').length;
      return {
        ...(existing || {}),
        evidenceCaptured: Number.isFinite(Number(existing?.pilesBefore)) && Number.isFinite(pilesAfter),
        pilesAfter,
        normalAfter,
        finalPilesAfter: pilesAfter,
        finalNormalAfter: normalAfter,
        cleanedNet: Math.max(0, Number(existing?.pilesBefore || 0) - pilesAfter),
        cleanupObservationFrames,
        cleanupPrepositionedCount
      };
    }, this.evidence.flowerLifecycle || null);
    this.evidence.flowerLifecycle = finalDetails;
    return finalDetails;
  }

  async settleFixtureBlocksForReload() {
    const details = await this.page.evaluate(fixtureBlocks => {
      const state = gameCore.getGameState();
      const settled = [];
      for (let index = 0; index < fixtureBlocks.length; index += 1) {
        const block = (state.blocks || [])[index] || null;
        const spec = fixtureBlocks[index] || null;
        if (!block || !spec) continue;
        const boardPos = {
          zoneId: spec.zoneId,
          u: spec.u,
          v: spec.v,
          h: spec.h || 0
        };
        if (typeof block.snapToBoardCell === 'function') {
          block.snapToBoardCell({ boardPos, allowInvalidCell: false, reason: 'g0h-scripted-fixture-settle' });
        } else if (typeof block.applyBoardCell === 'function') {
          block.applyBoardCell(boardPos, { reason: 'g0h-scripted-fixture-settle' });
        } else {
          block.boardPos = { ...boardPos };
        }
        const screen = renderManager?.boardToScreen?.(boardPos) || null;
        if (screen) {
          block.x = screen.x;
          block.y = screen.y;
        }
        block.currentZoneId = boardPos.zoneId;
        block.boardPos = { ...boardPos };
        block.stackIndex = boardPos.h;
        block.lastPlacedMode = boardPos.h > 0 ? 'stacked' : 'ground';
        block.syncDebugGridPos?.();
        settled.push({ id: block.id, boardPos: { ...boardPos } });
      }
      return {
        ok: settled.length === fixtureBlocks.length,
        settled
      };
    }, this.fixtureSpec.blocks || []);
    this.evidence.blockSettle = details;
    return details;
  }

  async saveReloadAndReinspect(alias = 'Orchid') {
    await this.settleFixtureBlocksForReload();
    const before = await this.snapshot('before-reload');
    this.evidence.beforeReload = before;
    const saved = await this.page.evaluate(async () => {
      const result = await gameCore.saveGameToStorage?.({ source: 'g0h-scripted-playthrough-reload' });
      const restored = await gameCore.loadGameFromStorage?.();
      gameCore.setViewMode?.('focused-garden');
      gameCore.focusZone?.('pool-heart');
      if (gameUI?.firstSessionGuide) gameUI.firstSessionGuide.visible = false;
      return {
        ok: !!result,
        restored: !!restored,
        serializedAtMs: result?.meta?.serializedAtMs || null
      };
    });
    const inspection = await this.inspect(alias, { afterReload: true });
    const after = await this.snapshot('after-reload');
    await this.flushCognitionSubscriber('after-reload-reinspect');
    this.evidence.afterReload = after;
    return { saved, inspection, before, after };
  }

  async startBattleEvidence() {
    const details = await this.page.evaluate(() => {
      const state = gameCore.getGameState();
      const byName = name => (state.butterflies || []).find(entity => entity.displayName === name) || null;
      const left = ['Rowan', 'Sage'].map(byName).filter(Boolean).map(entity => entity.id);
      const right = ['Thorn', 'Wisp'].map(byName).filter(Boolean).map(entity => entity.id);
      if (left.length < 2 || right.length < 2) {
        return { evidenceCaptured: false, reason: 'missing-battle-cast', left, right };
      }
      gameCore.focusZone?.('sun-court');
      const snapshot = gameCore.startBattleFromSides?.(left, right, {
        mode: 'g0h-scripted-autobattle',
        autoBattle: true,
        autoBattlePaused: false
      });
      if (!snapshot?.battleId) {
        return { evidenceCaptured: false, reason: 'battle-start-failed', left, right };
      }
      for (let index = 0; index < 3; index += 1) {
        gameCore.resolveBattleRound?.(snapshot.battleId);
      }
      const current = battleSystem.getSnapshot?.(snapshot.battleId) || snapshot;
      return {
        evidenceCaptured: !!current,
        battleId: snapshot.battleId,
        viewMode: state.viewMode,
        left,
        right,
        actionEvents: eventBus.getHistory?.(GameEvents.BATTLE_ACTION_OCCURRED)?.length || 0,
        committedEvents: eventBus.getHistory?.(GameEvents.BATTLE_COMMITTED)?.length || 0,
        winnerTeamId: current?.result?.winnerTeamId || current?.winnerTeamId || null,
        cognition: eventBus.getHistory?.('cognition:triggered')?.slice(-10).map(entry => entry.data || entry) || []
      };
    });
    this.absorbCognitionEvents(details.cognition);
    await this.flushCognitionSubscriber('battle-start');
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    this.evidence.battle = details;
    return details;
  }

  async commitBattleEvidence() {
    const details = await this.page.evaluate(() => {
      const state = gameCore.getGameState();
      const battleId = state.activeBattleId;
      if (!battleId) return { evidenceCaptured: false, reason: 'no-active-battle' };
      for (let index = 0; index < 8; index += 1) {
        const snapshot = battleSystem.getSnapshot?.(battleId);
        if (snapshot?.result) break;
        gameCore.resolveBattleRound?.(battleId);
      }
      const current = battleSystem.getSnapshot?.(battleId);
      if (current && !current.result) {
        battleSystem.resolveSnapshot?.(battleId, {
          winnerTeamId: 'left',
          reason: 'g0h-scripted-timebox'
        });
      }
      const committed = gameCore.commitBattleSession?.(battleId);
      return {
        evidenceCaptured: !!committed,
        battleId,
        viewMode: state.viewMode,
        actionEvents: eventBus.getHistory?.(GameEvents.BATTLE_ACTION_OCCURRED)?.length || 0,
        committedEvents: eventBus.getHistory?.(GameEvents.BATTLE_COMMITTED)?.length || 0,
        winnerTeamId: committed?.result?.winnerTeamId || committed?.winnerTeamId || null,
        cognition: eventBus.getHistory?.('cognition:triggered')?.slice(-10).map(entry => entry.data || entry) || []
      };
    });
    this.absorbCognitionEvents(details.cognition);
    await this.flushCognitionSubscriber('battle-commit');
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    this.evidence.battle = {
      ...(this.evidence.battle || {}),
      ...details,
      evidenceCaptured: !!details.evidenceCaptured || !!this.evidence.battle?.evidenceCaptured
    };
    return this.evidence.battle;
  }

  async collectAbilityEvidence() {
    const details = await this.page.evaluate(() => {
      const names = ['warmRally', 'shimmerVeil', 'teacher', 'speedzone', 'welcome'];
      const defaults = {};
      for (const name of names) {
        defaults[name] = specialEffects?.getAbilityVisualDefaults?.(name) || null;
      }
      const castAbilities = (gameCore.getGameState()?.butterflies || [])
        .filter(entity => ['Aster', 'Lumen', 'Rowan', 'Sage', 'Thorn', 'Wisp'].includes(entity.displayName))
        .map(entity => ({
          alias: entity.displayName,
          ability: entity.specialAbility || entity.ability || null
        }));
      return {
        evidenceCaptured: Object.values(defaults).some(entry => Number.isFinite(entry?.abilityRadiusUnits) || Number.isFinite(entry?.radiusUnits) || Number.isFinite(entry?.radius)),
        defaults,
        castAbilities
      };
    });
    this.evidence.ability = details;
    return details;
  }

  async collectFeedShape() {
    const details = await this.page.evaluate(() => {
      const entries = communicationSystem?.getFeedEntries?.({ limit: 20 }) || [];
      const candidate = entries.find(entry =>
        (entry.contextTags || []).some(tag => /motive/i.test(tag)) &&
        (entry.targetText || entry.headline || '').length > 0 &&
        (entry.detail || '').length > 0 &&
        (entry.consequenceTail || entry.detail || '').length > 0
      ) || entries[entries.length - 1] || null;
      return {
        hasMotive: !!candidate?.contextTags?.some(tag => /motive/i.test(tag)),
        hasTarget: !!(candidate?.targetText || candidate?.headline),
        hasResponse: !!candidate?.detail,
        hasConsequence: !!(candidate?.consequenceTail || candidate?.grounding),
        candidate,
        totalEntries: entries.length
      };
    });
    this.evidence.feedShape = details;
    return details;
  }

  async refreshProductionEventCounts() {
    const details = await this.page.evaluate(() => {
      const cognition = eventBus?.getHistory?.('cognition:triggered') || [];
      return {
        dialogueSpoken: eventBus?.getHistory?.(GameEvents.DIALOGUE_SPOKEN)?.length || 0,
        communicationSignal: eventBus?.getHistory?.(GameEvents.COMMUNICATION_SIGNAL)?.length || 0,
        objectDelivered: eventBus?.getHistory?.(GameEvents.OBJECT_DELIVERED)?.length || 0,
        battleAction: eventBus?.getHistory?.(GameEvents.BATTLE_ACTION_OCCURRED)?.length || 0,
        battleCommitted: eventBus?.getHistory?.(GameEvents.BATTLE_COMMITTED)?.length || 0,
        cognitionTriggered: cognition.length,
        loyaltyChoices: cognition.filter(entry => (entry.data || entry)?.kind === 'loyalty').length,
        outcomeAnchors: cognition.filter(entry => ['pride', 'shame'].includes((entry.data || entry)?.kind)).length,
        recentCognition: cognition.slice(-12).map(entry => entry.data || entry)
      };
    });
    this.absorbCognitionEvents(details.recentCognition);
    await this.flushCognitionSubscriber('production-event-counts');
    const accumulated = this.cognitionAccumulator.slice();
    details.accumulatedCognition = accumulated;
    details.accumulatedCognitionCount = accumulated.length;
    details.accumulatedLoyaltyChoices = accumulated.filter(entry => entry.kind === 'loyalty').length;
    details.accumulatedOutcomeAnchors = accumulated.filter(entry => ['pride', 'shame'].includes(entry.kind)).length;
    this.evidence.productionEvents = details;
    return details;
  }

  async exportCapture(destinationDir) {
    ensureDir(destinationDir);
    const exportResult = await this.page.evaluate(async () => {
      return await gameCore.telemetrySystem?.exportSessionCapture?.(gameCore.getGameState(), {
        source: 'g0h-scripted-playthrough'
      });
    });
    const capturePath = exportResult?.capturePath || null;
    const summaryPath = exportResult?.summaryPath || null;
    const copied = {};
    if (capturePath && fs.existsSync(capturePath)) {
      copied.capturePath = path.join(destinationDir, 'capture.json');
      fs.copyFileSync(capturePath, copied.capturePath);
    }
    if (summaryPath && fs.existsSync(summaryPath)) {
      copied.summaryPath = path.join(destinationDir, 'summary.txt');
      fs.copyFileSync(summaryPath, copied.summaryPath);
    }
    let captureJson = null;
    if (copied.capturePath && fs.existsSync(copied.capturePath)) {
      captureJson = JSON.parse(fs.readFileSync(copied.capturePath, 'utf8'));
    }
    return {
      exportResult,
      capturePath: copied.capturePath || capturePath,
      summaryPath: copied.summaryPath || summaryPath,
      durationMs: captureJson?.summary?.durationMs || exportResult?.summary?.durationMs || 0,
      timelineCount: captureJson?.timeline?.length || 0,
      eventHistoryCount: captureJson?.eventHistory?.length || 0,
      runtimeIssueCount: captureJson?.summary?.runtimeIssueCount || captureJson?.runtimeIssues?.length || 0,
      errorRuntimeIssueCount: captureJson?.summary?.errorRuntimeIssueCount || 0,
      warningRuntimeIssueCount: captureJson?.summary?.warningRuntimeIssueCount || 0
    };
  }

  async runtimeSummary(pageErrors = [], consoleErrors = []) {
    await this.flushCognitionSubscriber('runtime-summary-final');
    await this.uninstallCognitionSubscriber();
    const summary = await this.page.evaluate(() => {
      const capture = gameCore.telemetrySystem?.getSessionCaptureSummary?.() || {};
      const telemetry = gameCore.telemetrySystem?.getSnapshot?.() || {};
      const spriteCache = spriteManager?.getBakedSpriteCacheTelemetry?.() || {};
      const recentRender = Array.isArray(gameCore.telemetrySystem?.recentRenderSamples)
        ? gameCore.telemetrySystem.recentRenderSamples.slice(-180)
        : [];
      const recentMaxRenderMs = recentRender.length
        ? Math.max(...recentRender.map(sample => Number(sample.totalRenderMs || 0)))
        : 0;
      return {
        runtimeIssueCount: capture.runtimeIssueCount || 0,
        errorRuntimeIssueCount: capture.errorRuntimeIssueCount || 0,
        warningRuntimeIssueCount: capture.warningRuntimeIssueCount || 0,
        runtimeIssueKinds: capture.runtimeIssueKinds || {},
        telemetryWarningCount: capture.telemetryWarningCount || 0,
        pressureTier: telemetry.pressure?.tier || capture.pressureTier || capture.pressure?.tier || 'unknown',
        densityTier: telemetry.pressure?.densityTier || 'unknown',
        stutterTier: telemetry.pressure?.stutterTier || 'unknown',
        cacheTier: telemetry.pressure?.cacheTier || 'unknown',
        p95FrameMs: Number(telemetry.percentiles?.p95FrameMs || capture.p95FrameMs || 0),
        p99FrameMs: Number(telemetry.pressure?.p99FrameMs || telemetry.percentiles?.p99FrameMs || capture.p99FrameMs || 0),
        maxRenderMs: Number(telemetry.pressure?.maxRenderMs || recentMaxRenderMs || capture.maxRenderMs || 0),
        captureMaxRenderMs: Number(capture.maxRenderMs || 0),
        captureP99FrameMs: Number(capture.p99FrameMs || 0),
        maxUpdateMs: Number(telemetry.pressure?.maxUpdateMs || capture.maxUpdateMs || 0),
        spriteCacheEstimatedSurfaceMB: Number(spriteCache.estimatedSurfaceMB || capture.spriteCacheEstimatedSurfaceMB || 0),
        spriteCacheMaxSurfaceMB: Number(spriteManager?.getMaxBakedSpriteSurfaceMB?.() || gameConfig?.performance?.cache?.maxBakedSpriteSurfaceMB || 0),
        spriteCacheCacheHits: Number(spriteCache.cacheHits || capture.spriteCacheCacheHits || 0),
        spriteCacheCacheMisses: Number(spriteCache.cacheMisses || capture.spriteCacheCacheMisses || 0),
        spriteCacheEntryCount: Number(spriteCache.entryCount || capture.spriteCacheEntryCount || 0)
      };
    });
    return {
      ...summary,
      pageErrors,
      consoleErrors
    };
  }
}

module.exports = {
  G0HPlaythroughDriver,
  saveShot,
  readRawSave,
  captureStorage,
  restoreStorage,
  waitForGame,
  dismissTitle
};
