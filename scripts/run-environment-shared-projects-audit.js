const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'environment_shared_projects_audit');
const URL = 'http://127.0.0.1:3000/';
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
    return;
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
  await page.waitForTimeout(1200);
}

async function resetBaseline(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
    window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
    window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
    gameCore.focusZone?.('moss-hollow');
  });
  await page.waitForTimeout(700);
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const auditId = stamp();
  const outputDir = path.join(OUTPUT_ROOT, auditId);
  ensureDir(outputDir);

  const report = {
    auditId,
    startedAt: new Date().toISOString(),
    outputDir,
    url: URL,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    assertions: [],
    overall: 'pending'
  };

  let browser;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addInitScript(() => {
      window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
      window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(msg.text());
    });
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await resetBaseline(page);

    report.assertions = await page.evaluate(async () => {
      const assertions = [];
      const add = (id, pass, details = {}) => assertions.push({ id, pass: !!pass, details });
      const zoneId = 'moss-hollow';
      const cell = (u, v, h = 0) => ({ zoneId, u, v, h });
      const screen = (u, v, h = 0) => renderManager.boardToScreen(cell(u, v, h));

      const clearZone = () => {
        objectSystem?.reset?.();
        for (const flower of [...(gameCore.gameState.flowers || [])]) {
          if (gameCore.getEntityZoneId(flower, null) === zoneId) {
            gameCore.removeFlowerFromGame?.(flower, 'shared-projects-audit-reset');
          }
        }
        for (const block of [...(gameCore.gameState.blocks || [])]) {
          const blockCell = structureSystem.getBlockCell?.(block, { zoneId });
          if (blockCell?.zoneId === zoneId) {
            gameCore.entityManager?.removeEntity?.('blocks', block);
            gameCore.unregisterEntityFromFoundationSystems?.(block);
            gameCore.gameState.blocks = (gameCore.gameState.blocks || []).filter(entry => entry?.id !== block.id);
          }
        }
      };

      const spawnBlockAt = (u, v, h = 0, supportBlock = null) => {
        const point = screen(u, v, h);
        const block = gameCore.godSpawnBlock?.(zoneId, point.x, point.y);
        block.supportBlockId = supportBlock?.id || null;
        block.applyBoardCell?.({ accepted: true, zoneId, u, v, h }, { requireAccepted: false });
        return block;
      };

      const moveButterflyToCell = (butterfly, u, v) => {
        const point = screen(u, v, 0);
        butterfly.currentZoneId = zoneId;
        butterfly.lifeSim.lifecycle.currentZoneId = zoneId;
        butterfly.x = point.x;
        butterfly.y = point.y;
        butterfly.boardPos = cell(u, v, 0);
        butterfly.gridPos = { x: u, y: v };
        butterfly.syncBoardPosFromScreen?.({ zoneId });
      };

      const ensureEdgePair = (left, right, values = {}) => {
        const leftEdge = ensureLifeSocialEdge?.(left, right.id);
        const rightEdge = ensureLifeSocialEdge?.(right, left.id);
        Object.assign(leftEdge, values);
        Object.assign(rightEdge, values);
      };

      clearZone();
      const [requester, helper, alternative] = gameCore.gameState.butterflies || [];
      if (!requester || !helper || !alternative) {
        add('audit-has-three-butterflies', false, { butterflyCount: (gameCore.gameState.butterflies || []).length });
        return assertions;
      }

      moveButterflyToCell(requester, 20, 16);
      moveButterflyToCell(helper, 22, 16);
      moveButterflyToCell(alternative, 23, 16);
      requester.lifeSim.drives.rest = 0.88;
      requester.lifeSim.emotions.exhaustion = 0.74;
      requester.lifeSim.derived = requester.lifeSim.derived || {};
      requester.lifeSim.derived.behaviorBiases = requester.lifeSim.derived.behaviorBiases || {};
      requester.lifeSim.derived.behaviorBiases.shelterSeeking = 0.94;
      requester.lifeSim.derived.behaviorBiases.objectInterest = 0.72;
      helper.lifeSim.emotions.curiosity = 0.5;
      helper.lifeSim.drives.exploration = 0.42;
      helper.lifeSim.derived = helper.lifeSim.derived || {};
      helper.lifeSim.derived.behaviorBiases = helper.lifeSim.derived.behaviorBiases || {};
      helper.lifeSim.derived.behaviorBiases.objectInterest = 0.7;
      helper.blockInteraction.cooldownFrames = 0;
      requester.blockInteraction.cooldownFrames = 0;
      alternative.lifeSim.derived = alternative.lifeSim.derived || {};
      alternative.lifeSim.derived.behaviorBiases = alternative.lifeSim.derived.behaviorBiases || {};
      alternative.lifeSim.derived.behaviorBiases.objectInterest = 0.72;
      alternative.blockInteraction.cooldownFrames = 0;
      ensureEdgePair(requester, helper, {
        trust: 0.5,
        comfort: 0.48,
        attachment: 0.34,
        admiration: 0.16,
        bondTier: 'companion',
        followThroughScore: 0.18,
        recentWarmth: 0.12
      });
      ensureEdgePair(requester, alternative, {
        trust: 0.58,
        comfort: 0.54,
        attachment: 0.36,
        admiration: 0.18,
        bondTier: 'companion',
        followThroughScore: 0.08,
        recentWarmth: 0.08
      });
      appendLifeMemory?.(requester, 'object', {
        subjectId: 'prior-shade-project',
        valence: 0.45,
        strength: 0.86,
        createdAtSeconds: lifeSimSystem?.simulationClockSeconds ?? null,
        emotionalColoring: { attachment: 0.24, relief: 0.2, significance: 0.18 },
        tags: ['shared-project-completion', 'shade-building-cooperation', 'shelter-use'],
        metadata: {
          projectId: 'prior-shade-project',
          projectType: 'shadeShelter',
          zoneId,
          contributorIds: [requester.id, helper.id],
          completedAtFrame: Math.max(0, (gameCore.getCurrentFrame?.() || 0) - 120),
          createsShade: true,
          blockIds: []
        }
      });
      const cooperationConfig = gameConfig.entities.block.shade.buildingCooperation;
      const sharedProjectConfig = gameConfig.entities.block.shade.sharedProjects;
      const originalMaxHelpers = cooperationConfig.maxHelpers;
      const originalAbandonAfterFrames = sharedProjectConfig.failureFeedback?.abandonAfterFrames;
      cooperationConfig.maxHelpers = 1;
      if (sharedProjectConfig.failureFeedback) {
        sharedProjectConfig.failureFeedback.abandonAfterFrames = 30;
      }

      const baseBlock = spawnBlockAt(20, 15, 0);
      const requesterBlock = spawnBlockAt(21, 16, 0);
      const helperBlock = spawnBlockAt(22, 16, 0);
      const alternativeBlock = spawnBlockAt(23, 16, 0);
      requesterBlock.pickupBy?.(requester);
      requester.blockInteraction.carryingBlockId = requesterBlock.id;
      requester.blockInteraction.carryFrames = 12;
      structureSystem.rebuild?.(gameCore.gameState);
      structureSystem.lastRebuildSignature = structureSystem.buildRebuildSignature?.(gameCore.gameState);

      const requesterPlacement = requester.chooseBlockPlacementTarget?.(requesterBlock, gameCore.gameState.blocks || []);
      add('requester-has-shade-building-target', requesterPlacement?.shadeIntent?.createsShade === true, {
        requesterPlacement
      });
      const preferredScoreBeforeRequest = communicationSystem.scoreBuildingHelperCandidate?.(requester, helper, zoneId, requesterPlacement, gameCore.gameState.blocks || []);
      const alternativeScoreBeforeRequest = communicationSystem.scoreBuildingHelperCandidate?.(requester, alternative, zoneId, requesterPlacement, gameCore.gameState.blocks || []);

      const emitted = communicationSystem.updateShadeBuildingCooperation?.(gameCore.gameState, gameCore.getCurrentFrame?.() || 0, { force: true });
      const requestEvent = (eventBus.getHistory?.('building:cooperation-requested') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.requesterId === requester.id)
        .slice(-1)[0] || null;
      const projectAfterRequest = requestEvent?.projectId
        ? objectSystem.getEnvironmentProject?.(requestEvent.projectId)
        : null;
      const projectCreatedEvent = (eventBus.getHistory?.('environment:project-created') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.projectId === requestEvent?.projectId)
        .slice(-1)[0] || null;
      const requestContributionEvent = (eventBus.getHistory?.('environment:project-contribution') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.projectId === requestEvent?.projectId && event?.contributionType === 'project-request')
        .slice(-1)[0] || null;

      add('shared-project-created-from-building-request', emitted >= 1
        && !!requestEvent?.projectId
        && projectAfterRequest?.type === 'shadeShelter'
        && projectAfterRequest?.status === 'active'
        && !!projectCreatedEvent, {
        emitted,
        requestEvent,
        projectAfterRequest,
        projectCreatedEvent
      });
      add('requester-contributes-project-request', !!requestContributionEvent
        && (projectAfterRequest?.contributors?.[requester.id]?.contributions || 0) >= 1, {
        requestContributionEvent,
        requesterContributor: projectAfterRequest?.contributors?.[requester.id] || null
      });
      add('helper-is-invited-but-not-yet-counted-as-progress', !!projectAfterRequest?.contributors?.[helper.id]
        && (projectAfterRequest?.contributors?.[helper.id]?.roles || []).includes('invited-helper')
        && (projectAfterRequest?.contributors?.[helper.id]?.contributions || 0) === 0, {
        helperContributor: projectAfterRequest?.contributors?.[helper.id] || null
      });
      const preferenceScores = requestEvent?.helperPreference || [];
      const preferredScore = preferenceScores.find(entry => entry.helperId === helper.id) || null;
      add('prior-project-memory-selects-preferred-helper', requestEvent?.helperIds?.[0] === helper.id
        && !requestEvent?.helperIds?.includes?.(alternative.id)
        && preferredScore?.requesterMemoryScore > 0
        && preferredScore?.reason === 'prior-shared-project'
        && preferredScoreBeforeRequest?.score > alternativeScoreBeforeRequest?.score, {
        requestEvent,
        preferredScore,
        preferredScoreBeforeRequest,
        alternativeScoreBeforeRequest,
        alternativeId: alternative.id,
        alternativeBlockId: alternativeBlock?.id || null
      });
      add('helper-preference-exposes-role-profile', !!preferredScore?.roleLabel
        && !!preferredScore?.roleScores
        && Object.keys(preferredScore.roleScores || {}).length >= 3, {
        preferredScore
      });

      const roleProbeHelperPoint = screen(16, 16, 0);
      helper.x = roleProbeHelperPoint.x;
      helper.y = roleProbeHelperPoint.y;
      helper.syncBoardPosFromScreen?.({ zoneId });
      const roleProbeConstructionPoint = screen(20, 16, 1);
      const makeProbeBlock = (id, point) => {
        return {
          id,
          x: point.x,
          y: point.y,
          currentZoneId: zoneId,
          carriedById: null,
          canBeMovedBy: () => true
        };
      };
      const roleProbeBlocks = {
        nearHelper: makeProbeBlock('role-probe-near-helper', { x: roleProbeHelperPoint.x + 6, y: roleProbeHelperPoint.y }),
        middle: makeProbeBlock('role-probe-middle', {
          x: (roleProbeHelperPoint.x + roleProbeConstructionPoint.x) / 2,
          y: (roleProbeHelperPoint.y + roleProbeConstructionPoint.y) / 2
        }),
        nearBuild: makeProbeBlock('role-probe-near-build', { x: roleProbeConstructionPoint.x, y: roleProbeConstructionPoint.y })
      };
      const roleProbeBaseSignal = {
        sourceId: requester.id,
        signalId: 'role-probe-signal',
        metadata: {
          reason: 'shade-building-help',
          requestedAtFrame: gameCore.getCurrentFrame?.() || 0,
          supportBlockId: baseBlock.id,
          constructionPoint: {
            ...roleProbeConstructionPoint,
            boardPos: cell(20, 16, 1)
          }
        }
      };
      const roleProbeTarget = (roleLabel) => helper.findBuildingHelpBlockTarget?.(
        Object.values(roleProbeBlocks),
        {
          ...roleProbeBaseSignal,
          metadata: {
            ...roleProbeBaseSignal.metadata,
            helperPreference: [{
              helperId: helper.id,
              roleLabel,
              roleScores: { builder: roleLabel === 'builder' ? 1 : 0, carrier: roleLabel === 'carrier' ? 1 : 0, coordinator: roleLabel === 'coordinator' ? 1 : 0 }
            }]
          }
        }
      );
      const builderTarget = roleProbeTarget('builder');
      const carrierTarget = roleProbeTarget('carrier');
      const coordinatorTarget = roleProbeTarget('coordinator');
      add('role-coverage-builder-and-carrier-target-different-blocks', builderTarget?.id === roleProbeBlocks.nearBuild.id
        && carrierTarget?.id
        && carrierTarget?.id !== roleProbeBlocks.nearBuild.id
        && builderTarget?.id !== carrierTarget?.id, {
        builderTargetId: builderTarget?.id || null,
        carrierTargetId: carrierTarget?.id || null,
        probeBlockIds: Object.fromEntries(Object.entries(roleProbeBlocks).map(([label, block]) => [label, block.id]))
      });
      add('role-coverage-coordinator-has-actionable-target', !!coordinatorTarget?.id
        && Object.values(roleProbeBlocks).some(block => block.id === coordinatorTarget.id), {
        coordinatorTargetId: coordinatorTarget?.id || null,
        probeBlockIds: Object.fromEntries(Object.entries(roleProbeBlocks).map(([label, block]) => [label, block.id]))
      });

      moveButterflyToCell(helper, 22, 16);

      helper.checkBlockExperimentation?.(gameCore.gameState.blocks || []);
      const acceptedEvent = (eventBus.getHistory?.('building:helper-accepted') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.helperId === helper.id && event?.requesterId === requester.id)
        .slice(-1)[0] || null;
      add('helper-accepts-shared-project-help', helper.blockInteraction?.buildingAssist?.requesterId === requester.id
        && helper.blockInteraction?.buildingAssist?.projectId === requestEvent?.projectId
        && helper.blockInteraction?.carryingBlockId === helperBlock.id
        && helper.blockInteraction?.buildingAssist?.roleLabel === preferredScore?.roleLabel
        && acceptedEvent?.roleLabel === preferredScore?.roleLabel
        && !!acceptedEvent, {
        buildingAssist: helper.blockInteraction?.buildingAssist || null,
        acceptedEvent,
        preferredScore
      });

      const helperPlacement = helper.blockInteraction?.placementTarget || helper.chooseBlockPlacementTarget?.(helperBlock, gameCore.gameState.blocks || []);
      if (helperPlacement) {
        helper.x = helperPlacement.x;
        helper.y = helperPlacement.y;
        helper.syncBoardPosFromScreen?.({ zoneId });
      }
      const placed = helper.placeCarriedBlock?.(helperBlock, zoneId);
      structureSystem.rebuild?.(gameCore.gameState);
      structureSystem.lastRebuildSignature = structureSystem.buildRebuildSignature?.(gameCore.gameState);

      const completedProject = requestEvent?.projectId
        ? objectSystem.getEnvironmentProject?.(requestEvent.projectId)
        : null;
      const shadeColumn = (structureSystem.getShadeColumnsForZoneProfile?.(structureSystem.getZoneProfileRef?.(zoneId)) || [])
        .find(column => column.sourceBlockId === helperBlock.id) || null;
      const placementContribution = (completedProject?.contributionLog || [])
        .find(entry => entry?.contributorId === helper.id && entry?.contributionType === 'block-placement') || null;
      const followContribution = (completedProject?.contributionLog || [])
        .find(entry => entry?.contributorId === helper.id && entry?.contributionType === 'helper-followthrough') || null;
      const completedEvent = (eventBus.getHistory?.('environment:project-completed') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.projectId === requestEvent?.projectId)
        .slice(-1)[0] || null;
      const followthroughEvent = (eventBus.getHistory?.('building:cooperation-followthrough') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.projectId === requestEvent?.projectId && event?.helperId === helper.id)
        .slice(-1)[0] || null;
      const socialPayoffEvent = (eventBus.getHistory?.('environment:project-social-payoff') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.projectId === requestEvent?.projectId)
        .slice(-1)[0] || null;
      const requesterMemory = (requester.lifeSim?.memories?.object || [])
        .find(memory => memory?.metadata?.projectId === requestEvent?.projectId
          && memory?.tags?.includes?.('shared-project-completion')) || null;
      const helperMemory = (helper.lifeSim?.memories?.object || [])
        .find(memory => memory?.metadata?.projectId === requestEvent?.projectId
          && memory?.tags?.includes?.('shared-project-completion')) || null;
      const helperEdge = helper.lifeSim?.socialEdges?.[requester.id] || {};
      const requesterEdge = requester.lifeSim?.socialEdges?.[helper.id] || {};
      const formattedFeed = gameUI?.formatActivityEntry?.({
        event: 'environment:project-completed',
        data: completedEvent || {},
        timestamp: Date.now()
      }) || null;

      add('helper-placement-completes-shade-project', placed === true
        && !!shadeColumn
        && completedProject?.status === 'completed'
        && (completedProject?.progress?.blockPlacements || 0) >= 1
        && completedProject?.progress?.createsShade === true, {
        placed,
        shadeColumn,
        completedProject
      });
      add('shared-project-records-two-real-contributors', !!placementContribution
        && !!followContribution
        && (completedProject?.contributors?.[requester.id]?.contributions || 0) >= 1
        && (completedProject?.contributors?.[helper.id]?.contributions || 0) >= 2, {
        placementContribution,
        followContribution,
        requesterContributor: completedProject?.contributors?.[requester.id] || null,
        helperContributor: completedProject?.contributors?.[helper.id] || null
      });
      add('project-completed-event-names-both-butterflies', !!completedEvent
        && completedEvent.contributorIds?.includes?.(requester.id)
        && completedEvent.contributorIds?.includes?.(helper.id), {
        completedEvent
      });
      add('helper-role-follows-into-project-events', followContribution?.metadata?.roleLabel === preferredScore?.roleLabel
        && followthroughEvent?.roleLabel === preferredScore?.roleLabel
        && completedEvent?.contributorRoles?.[helper.id]?.roleLabel === preferredScore?.roleLabel, {
        preferredScore,
        followContribution,
        followthroughEvent,
        completedContributorRole: completedEvent?.contributorRoles?.[helper.id] || null
      });
      add('shared-project-completion-records-object-memories', !!socialPayoffEvent
        && completedEvent?.memoryCount >= 2
        && !!requesterMemory
        && !!helperMemory, {
        socialPayoffEvent,
        completedEvent,
        requesterMemory,
        helperMemory
      });
      add('shared-project-completion-strengthens-social-edges', (helperEdge.historyTags || []).includes('shared-project-completion')
        && (requesterEdge.historyTags || []).includes('shared-project-completion')
        && (helperEdge.followThroughScore || 0) > 0.16
        && (requesterEdge.followThroughScore || 0) > 0.16, {
        helperEdge,
        requesterEdge
      });
      add('shared-project-completion-has-feed-line', !!formattedFeed?.line
        && /shared shade shelter/i.test(formattedFeed.line)
        && /memories/i.test(formattedFeed.grounding || '')
        && /bond updates/i.test(formattedFeed.grounding || '')
        && /roles:/i.test(formattedFeed.grounding || ''), {
        formattedFeed
      });
      add('shared-projects-remain-runtime-only', !saveSystem?.serializeState
        || (() => {
          const snapshot = saveSystem.serializeState(gameCore.gameState);
          const serializedObjects = JSON.stringify(snapshot?.foundations?.objects || {});
          return !serializedObjects.includes(requestEvent?.projectId || 'missing-project-id');
        })(), {
        projectId: requestEvent?.projectId || null
      });

      const failureEdgeBefore = {
        requesterToHelper: { ...(requester.lifeSim?.socialEdges?.[alternative.id] || {}) },
        helperToRequester: { ...(alternative.lifeSim?.socialEdges?.[requester.id] || {}) }
      };
      const abandonedProject = objectSystem.recordShadeProjectRequest?.({
        requesterId: requester.id,
        helperIds: [alternative.id],
        zoneId,
        targetCell: cell(25, 18, 0),
        shadeIntentScore: 0.82,
        shadeProgress: 'needs-block'
      });
      const liveAbandonedProject = abandonedProject?.id
        ? objectSystem.environmentProjects?.get?.(abandonedProject.id)
        : null;
      if (liveAbandonedProject) {
        liveAbandonedProject.createdAtFrame = (gameCore.getCurrentFrame?.() || 0) - 360;
      }
      const timeoutResult = objectSystem.updateEnvironmentProjectTimeouts?.() || {};
      const abandonedProjectAfter = abandonedProject?.id
        ? objectSystem.getEnvironmentProject?.(abandonedProject.id)
        : null;
      const abandonedEvent = (eventBus.getHistory?.('environment:project-abandoned') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.projectId === abandonedProject?.id)
        .slice(-1)[0] || null;
      const failureFeedbackEvent = (eventBus.getHistory?.('environment:project-failure-feedback') || [])
        .map(entry => entry?.data || entry)
        .filter(event => event?.projectId === abandonedProject?.id)
        .slice(-1)[0] || null;
      const requesterFailureMemory = (requester.lifeSim?.memories?.object || [])
        .find(memory => memory?.metadata?.projectId === abandonedProject?.id
          && memory?.tags?.includes?.('shared-project-abandoned')) || null;
      const helperFailureMemory = (alternative.lifeSim?.memories?.object || [])
        .find(memory => memory?.metadata?.projectId === abandonedProject?.id
          && memory?.tags?.includes?.('shared-project-abandoned')) || null;
      const failureEdgeAfter = {
        requesterToHelper: { ...(requester.lifeSim?.socialEdges?.[alternative.id] || {}) },
        helperToRequester: { ...(alternative.lifeSim?.socialEdges?.[requester.id] || {}) }
      };
      add('abandoned-project-times-out-with-failure-feedback', timeoutResult.abandoned >= 1
        && abandonedProjectAfter?.status === 'abandoned'
        && !!abandonedEvent
        && !!failureFeedbackEvent
        && !!requesterFailureMemory
        && !!helperFailureMemory, {
        timeoutResult,
        abandonedProjectAfter,
        abandonedEvent,
        failureFeedbackEvent,
        requesterFailureMemory,
        helperFailureMemory
      });
      add('abandoned-project-softens-follow-through-without-new-schema', (failureEdgeAfter.requesterToHelper.followThroughScore || 0) < (failureEdgeBefore.requesterToHelper.followThroughScore || 0)
        && (failureEdgeAfter.helperToRequester.followThroughScore || 0) < (failureEdgeBefore.helperToRequester.followThroughScore || 0)
        && (failureEdgeAfter.requesterToHelper.historyTags || []).includes('shared-project-abandoned')
        && (!saveSystem?.serializeState || (() => {
          const snapshot = saveSystem.serializeState(gameCore.gameState);
          const serializedObjects = JSON.stringify(snapshot?.foundations?.objects || {});
          return !serializedObjects.includes(abandonedProject?.id || 'missing-abandoned-project-id');
        })()), {
        failureEdgeBefore,
        failureEdgeAfter,
        projectId: abandonedProject?.id || null
      });
      cooperationConfig.maxHelpers = originalMaxHelpers;
      if (sharedProjectConfig.failureFeedback) {
        sharedProjectConfig.failureFeedback.abandonAfterFrames = originalAbandonAfterFrames;
      }

      return assertions;
    });

    report.overall = report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      && report.assertions.every(assertion => assertion.pass)
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = String(error?.stack || error);
  } finally {
    if (browser) await browser.close();
    report.completedAt = new Date().toISOString();
    report.reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overall: report.overall,
      reportPath: report.reportPath,
      assertions: report.assertions.map(assertion => ({ id: assertion.id, pass: assertion.pass })),
      pageErrors: report.pageErrors.length,
      consoleErrors: report.consoleErrors.length
    }, null, 2));
    if (report.overall !== 'pass') {
      process.exitCode = 1;
    }
  }
}

run();
