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
      residuals: []
    };
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

  async importFixtureSave(savePath) {
    const rawSave = readRawSave(savePath);
    return this.page.evaluate(async ({ rawSave, storageKeys }) => {
      storageKeys.forEach(key => window.localStorage.removeItem(key));
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
      if (typeof saveSystem !== 'undefined' && typeof saveSystem.writePayloadToIndexedDb === 'function') {
        await saveSystem.writePayloadToIndexedDb('papilionem-save-v2', rawSave);
        window.localStorage.removeItem('papilionem-save-v2');
      } else {
        window.localStorage.setItem('papilionem-save-v2', rawSave);
      }
      const restored = await gameCore.loadGameFromStorage?.();
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
    }, { rawSave, storageKeys: STORAGE_KEYS });
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
      const state = gameCore.getGameState();
      const target = (state.butterflies || []).find(entity => entity.displayName === alias || entity.lifeSim?.identity?.fixtureAlias === alias) || null;
      if (!target) return { alias, found: false, afterReload: !!afterReload };
      const memorySummary = summarizeLifeSimMemories(target);
      gameUI.inspectPanel.visible = true;
      gameUI.inspectPanel.lockedTargetId = target.id;
      gameUI.inspectPanel.scrollOffset = 0;
      gameUI.inspectControl.browseScope = 'all';
      gameUI.inspectControl.lockedBrowseScope = 'all';
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
        boardPos: target.boardPos || null
      };
    }, { alias, afterReload: !!options.afterReload });
    this.evidence.inspections.push(details);
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
        ? iris.lifeSim.memories.social.filter(packet =>
          !(packet?.kind === 'witnessedAffection' && packet?.bondPartnerId === juniper.id)
        )
        : [];

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
        beforePackets,
        afterPackets: iris.lifeSim.memories.social.length,
        dialogueCount: eventBus.getHistory?.(GameEvents.DIALOGUE_SPOKEN)?.length || 0,
        cognition: eventBus.getHistory?.('cognition:triggered')?.slice(-12).map(entry => entry.data || entry) || []
      };
    });
    this.absorbCognitionEvents(details.cognition);
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
      const frame = Math.max(270, gameCore.getCurrentFrame?.() || state.currentFrame || 0);
      for (const target of [briar, clover]) {
        target.lifeSim.emotions = target.lifeSim.emotions || {};
        target.lifeSim.emotions.threat = 0.78;
        target.lifeSim.emotions.exhaustion = 0.7;
        target.lifeSim.communication = target.lifeSim.communication || {};
        target.lifeSim.communication.lastDistressAtSeconds = -Infinity;
      }
      aster.lifeSim.drives = aster.lifeSim.drives || {};
      aster.lifeSim.drives.caregiving = 0.82;
      const emittedA = communicationSystem.updateDistressCascade?.(state, 270) || 0;
      const emittedB = communicationSystem.updateDistressCascade?.(state, 360) || 0;
      briar.lifeSim.emotions.threat = 0.22;
      briar.lifeSim.emotions.exhaustion = 0.2;
      const emittedC = communicationSystem.updateDistressCascade?.(state, 450) || 0;
      clover.lifeSim.emotions.threat = 0.82;
      clover.lifeSim.emotions.exhaustion = 0.66;
      const emittedD = communicationSystem.updateDistressCascade?.(state, 540) || 0;
      return {
        ok: (emittedA + emittedB + emittedC + emittedD) > 0,
        emitted: emittedA + emittedB + emittedC + emittedD,
        dialogueCount: eventBus.getHistory?.(GameEvents.DIALOGUE_SPOKEN)?.length || 0,
        signalCount: eventBus.getHistory?.(GameEvents.COMMUNICATION_SIGNAL)?.length || 0,
        cognition: eventBus.getHistory?.('cognition:triggered')?.slice(-10).map(entry => entry.data || entry) || []
      };
    });
    this.absorbCognitionEvents(details.cognition);
    details.accumulatedCognition = this.cognitionAccumulator.slice();
    return details;
  }

  async nudgeFlowerCleanup() {
    const details = await this.page.evaluate(() => {
      const state = gameCore.getGameState();
      const aster = (state.butterflies || []).find(entity => entity.displayName === 'Aster') || null;
      const pilesBefore = (state.flowers || []).filter(flower => flower.lifecycleKind === 'dirt-pile').length;
      const normalBefore = (state.flowers || []).filter(flower => (flower.lifecycleKind || 'flower') === 'flower').length;
      if (aster) {
        aster.lifeSim.drives = aster.lifeSim.drives || {};
        aster.lifeSim.drives.selfMaintenance = Math.max(aster.lifeSim.drives.selfMaintenance || 0, 0.82);
        const pile = (state.flowers || []).find(flower => flower.lifecycleKind === 'dirt-pile' && flower.currentZoneId === 'moss-hollow') || null;
        if (pile) {
          aster.x = pile.x;
          aster.y = pile.y;
          aster.currentZoneId = 'moss-hollow';
          aster.boardPos = { ...(pile.boardPos || { zoneId: 'moss-hollow', u: 15, v: 12, h: 0 }) };
          pile.tryCleanupDirtPile?.([aster]);
        }
      }
      for (const flower of state.flowers || []) {
        if ((flower.lifecycleKind || 'flower') === 'flower' && flower.resourceOrigin === 'g0h-fixture') {
          flower.spawnedAtFrame = (gameCore.getCurrentFrame?.() || 0) - Math.max(1, flower.getDecayFrames?.() || 3600) - 1;
          flower.update?.(state);
          break;
        }
      }
      const pilesAfter = (state.flowers || []).filter(flower => flower.lifecycleKind === 'dirt-pile').length;
      const normalAfter = (state.flowers || []).filter(flower => (flower.lifecycleKind || 'flower') === 'flower').length;
      return {
        evidenceCaptured: pilesAfter !== pilesBefore || normalAfter !== normalBefore,
        pilesBefore,
        pilesAfter,
        normalBefore,
        normalAfter,
        objectDelivered: eventBus.getHistory?.(GameEvents.OBJECT_DELIVERED)?.length || 0,
        objectConsumed: eventBus.getHistory?.(GameEvents.OBJECT_CONSUMED)?.length || 0
      };
    });
    this.evidence.flowerLifecycle = details;
    return details;
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
