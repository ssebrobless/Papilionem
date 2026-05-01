#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_logs', 'r_cognition_trigger_coverage');
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
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, detached: true, stdio: 'ignore' });
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
  await page.waitForFunction(() => typeof gameCore !== 'undefined' && gameCore.isInitialized?.(), null, { timeout: 30000 });
}

async function resetBaseline(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
    window.__PAPILIONEM_WORLD_RENDERMODE__ = 'sim-board';
    window.localStorage.setItem('papilionem-world-rendermode', 'sim-board');
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await page.keyboard.press('Space').catch(() => {});
  await page.waitForTimeout(400);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
    gameUI.firstSessionGuide.visible = false;
    eventBus.clearHistory?.();
    communicationSystem.reset?.();
    communicationSystem.initialize?.();
  });
}

async function run() {
  ensureDir(OUTPUT_ROOT);
  const outputDir = path.join(OUTPUT_ROOT, stamp());
  ensureDir(outputDir);
  const report = {
    startedAt: new Date().toISOString(),
    outputDir,
    server: null,
    pageErrors: [],
    consoleErrors: [],
    durationFrames: 18000,
    assertions: []
  };

  await ensureServer(report);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(String(error)));
  page.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push(msg.text());
  });

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await resetBaseline(page);
    report.production = await page.evaluate(async () => {
      const state = gameCore.getGameState();
      const zoneId = gameCore.getZoneIds?.().find(id => id !== 'sun-court') || state.focusedZoneId || 'moss-hollow';
      const otherZoneId = gameCore.getZoneIds?.().find(id => id !== zoneId) || 'sun-court';

      const setFrame = (frame) => {
        state.currentFrame = frame;
        gameCore.gameState.currentFrame = frame;
      };
      const place = (entity, u, v, h = 0) => {
        const boardPos = { zoneId, u, v, h };
        const screen = renderManager.boardToScreen(boardPos);
        entity.currentZoneId = zoneId;
        entity.boardPos = boardPos;
        entity.x = screen.x;
        entity.y = screen.y - (entity.shadowOffset || 0);
        entity.gridPos = { x: Math.round(u), y: Math.round(v) };
        entity.syncDebugGridPos?.();
        communicationSystem.registerEntity?.(entity);
      };
      const ensureButterflies = () => {
        let attempts = 0;
        while ((state.butterflies || []).length < 12 && attempts < 24) {
          attempts += 1;
          const screen = renderManager.boardToScreen({
            zoneId,
            u: 4 + attempts,
            v: 5 + (attempts % 4),
            h: 0
          });
          gameCore.godSpawnButterfly?.(screen.x, screen.y, null);
        }
        return state.butterflies.slice(0, 12);
      };
      const makeEdge = (source, target, overrides = {}) => {
        const edge = ensureLifeSocialEdge(source, target.id);
        Object.assign(edge, {
          trust: 0.72,
          comfort: 0.7,
          attachment: 0.68,
          protectiveness: 0.62,
          admiration: 0.4,
          coTimeSeconds: 900,
          bondTier: 'companion',
          ...overrides
        });
        return edge;
      };
      const triggersBefore = eventBus.getHistory('cognition:triggered').length;
      const butterflies = ensureButterflies();
      butterflies.forEach((butterfly, index) => {
        butterfly.lifeSim = butterfly.lifeSim || (typeof createLifeSimState === 'function' ? createLifeSimState(butterfly) : {});
        butterfly.lifeSim.communication = butterfly.lifeSim.communication || (typeof createCommunicationProfile === 'function' ? createCommunicationProfile() : {});
        butterfly.lifeSim.emotions = butterfly.lifeSim.emotions || {};
        butterfly.lifeSim.drives = butterfly.lifeSim.drives || {};
        butterfly.lifeSim.memories = butterfly.lifeSim.memories || { social: [], outcome: [] };
        butterfly.lifeSim.socialEdges = butterfly.lifeSim.socialEdges || {};
        butterfly.dead = false;
        butterfly.hp = butterfly.hp ?? 100;
        butterfly.battleState = {
          ...(butterfly.battleState || {}),
          hp: butterfly.battleState?.hp ?? 100,
          maxHp: butterfly.battleState?.maxHp ?? 100,
          lastOutcome: null
        };
        place(butterfly, 5 + index * 0.8, 7 + (index % 3), 0);
      });
      communicationSystem.simulationClockSeconds = 1000;

      // Battle win pride: real battle snapshot -> resolve -> commit production path.
      setFrame(60);
      const battle = battleSystem.startBattle([
        { entity: butterflies[0], teamId: 'alpha' },
        { entity: butterflies[1], teamId: 'alpha' },
        { entity: butterflies[2], teamId: 'beta' }
      ], { battleId: 'audit_w1_pride', autoBattle: false, maxRounds: 6 });
      battleSystem.appendBattleEvent(battle.battleId, 'round-action', {
        roundNumber: 1,
        actorId: butterflies[0].id,
        type: 'attack',
        targetId: butterflies[2].id,
        damage: 36,
        pressure: 4
      });
      battleSystem.resolveSnapshot(battle.battleId, {
        winnerTeamId: 'alpha',
        summary: 'audit alpha victory'
      });
      battleSystem.commitResults(battle.battleId);

      // Warning ignored -> harm shame: communication warning plus production battle action event.
      setFrame(180);
      communicationSystem.emitCooperationSignal(butterflies[3], {
        signalType: 'warning_signal',
        intentFamily: 'care',
        intentTags: ['warning', 'comfort'],
        phrase: 'Please move back; this is unsafe.',
        targetIds: [butterflies[4].id],
        zoneId,
        reason: 'audit-warning'
      });
      const warningProbe = {
        listenerCount: eventBus.getListenerCount?.(GameEvents.BATTLE_ACTION_OCCURRED) || 0,
        warningRecordCount: communicationSystem.warningRecords?.length || 0,
        lastWarning: communicationSystem.warningRecords?.slice?.(-1)?.map?.(record => ({
          warnerId: record.warnerId,
          witnessIds: record.witnessIds,
          emittedAtFrame: record.emittedAtFrame
        }))?.[0] || null
      };
      setFrame(240);
      eventBus.emit(GameEvents.BATTLE_ACTION_OCCURRED, {
        battleId: 'audit_w1_warning_harm',
        roundNumber: 1,
        actorId: butterflies[2].id,
        type: 'attack',
        targetId: butterflies[4].id,
        damage: 9
      });
      warningProbe.afterEventTriggerCount = eventBus.getHistory('cognition:triggered')
        .filter(entry => entry?.data?.trigger === 'warningIgnoredHarm').length;

      // Competing distress and caregiving success: distress cascade production loop.
      setFrame(270);
      const distressedA = butterflies[5];
      const distressedB = butterflies[6];
      const caregiver = butterflies[7];
      place(distressedA, 12, 10);
      place(distressedB, 13.2, 10.2);
      place(caregiver, 12.5, 10.4);
      caregiver.lifeSim.drives.caregiving = 0.95;
      distressedA.lifeSim.emotions.threat = 0.86;
      distressedB.lifeSim.emotions.threat = 0.8;
      distressedA.lifeSim.communication.lastDistressAtSeconds = -Infinity;
      distressedB.lifeSim.communication.lastDistressAtSeconds = -Infinity;
      makeEdge(caregiver, distressedA);
      makeEdge(caregiver, distressedB);
      communicationSystem.updateDistressCascade(state, 270);
      setFrame(360);
      communicationSystem.simulationClockSeconds += 30;
      distressedA.lifeSim.emotions.threat = 0.08;
      distressedA.lifeSim.emotions.exhaustion = 0.08;
      distressedB.lifeSim.emotions.threat = 0.86;
      distressedB.lifeSim.emotions.exhaustion = 0.66;
      communicationSystem.updateDistressCascade(state, 360);
      setFrame(450);
      communicationSystem.simulationClockSeconds += 30;
      distressedB.lifeSim.emotions.threat = 0.82;
      distressedB.lifeSim.emotions.exhaustion = 0.62;
      communicationSystem.updateDistressCascade(state, 450);
      setFrame(540);
      communicationSystem.simulationClockSeconds += 30;
      distressedB.lifeSim.emotions.threat = 0.08;
      distressedB.lifeSim.emotions.exhaustion = 0.08;
      communicationSystem.updateDistressCascade(state, 540);

      // Scout cluster pride and competing scout loyalty.
      setFrame(1800);
      communicationSystem.simulationClockSeconds += 60;
      const scoutA = butterflies[8];
      const scoutB = butterflies[9];
      const recipientA = butterflies[10];
      const recipientB = butterflies[11];
      [scoutA, scoutB, recipientA, recipientB].forEach((entity, index) => place(entity, 8 + index, 14 + (index % 2)));
      [recipientA, recipientB].forEach(recipient => {
        makeEdge(recipient, scoutA, { admiration: 0.72, loyalty: 0.45 });
        makeEdge(recipient, scoutB, { admiration: 0.7, loyalty: 0.44 });
      });
      scoutA.lifeSim.derived = scoutA.lifeSim.derived || {};
      scoutB.lifeSim.derived = scoutB.lifeSim.derived || {};
      scoutA.lifeSim.derived.migration = {
        scoutTargetZoneId: otherZoneId,
        travelTargetZoneId: otherZoneId,
        scoutingDrive: 0.92,
        travelIntent: 'scouting'
      };
      scoutB.lifeSim.derived.migration = {
        scoutTargetZoneId: 'sun-court',
        travelTargetZoneId: 'sun-court',
        scoutingDrive: 0.9,
        travelIntent: 'scouting'
      };
      scoutA.lifeSim.communication.lastScoutDiscoveryAtSeconds = -Infinity;
      scoutB.lifeSim.communication.lastScoutDiscoveryAtSeconds = -Infinity;
      communicationSystem.updateScoutDiscovery(state, 1800);

      // Abandoned ally shame: candidate has companion edge, stays in zone, and does not respond.
      setFrame(2700);
      const abandoned = butterflies[1];
      const nonResponder = butterflies[2];
      place(abandoned, 18, 12);
      place(nonResponder, 24, 12);
      abandoned.lifeSim.emotions.threat = 0.9;
      abandoned.lifeSim.communication.lastDistressAtSeconds = -Infinity;
      nonResponder.lifeSim.drives.caregiving = 0.05;
      makeEdge(nonResponder, abandoned);
      communicationSystem.updateDistressCascade(state, 2700);
      setFrame(3330);
      communicationSystem.simulationClockSeconds += 30;
      communicationSystem.updateDistressCascade(state, 3330);

      setFrame(18000);
      const triggerEvents = eventBus.getHistory('cognition:triggered').slice(triggersBefore).map(entry => entry.data);
      const outcome = entity => entity.lifeSim?.memories?.outcome || [];
      const social = entity => entity.lifeSim?.memories?.social || [];
      const prideAnchors = butterflies.flatMap(entity => outcome(entity).filter(packet => packet.anchor === 'pride').map(packet => ({ entityId: entity.id, reason: packet.reason })));
      const shameAnchors = butterflies.flatMap(entity => outcome(entity).filter(packet => packet.anchor === 'shame').map(packet => ({ entityId: entity.id, reason: packet.reason })));
      const loyaltyChoices = butterflies.flatMap(entity => social(entity).filter(packet => packet.kind === 'loyaltyChoice').map(packet => ({
        entityId: entity.id,
        chosenPartnerId: packet.chosenPartnerId,
        rejectedPartnerId: packet.rejectedPartnerId
      })));

      return {
        zoneId,
        butterflyCount: butterflies.length,
        triggerEvents,
        triggerCounts: triggerEvents.reduce((acc, event) => {
          const key = `${event.kind}:${event.trigger}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
        warningProbe,
        prideAnchors,
        shameAnchors,
        loyaltyChoices
      };
    });

    const counts = report.production.triggerCounts || {};
    const checks = [
      ['battle pride production trigger', (counts['pride:battleWin'] || 0) >= 1],
      ['caregiving pride production trigger', (counts['pride:caregivingSuccess'] || 0) >= 1],
      ['scout pride production trigger', (counts['pride:scoutCluster'] || 0) >= 1],
      ['warning shame production trigger', (counts['shame:warningIgnoredHarm'] || 0) >= 1],
      ['abandoned shame production trigger', (counts['shame:abandonedAlly'] || 0) >= 1],
      ['loyalty production trigger', ((counts['loyalty:competingDistress'] || 0) + (counts['loyalty:competingScout'] || 0)) >= 1],
      ['pride anchor persisted', (report.production.prideAnchors || []).length >= 1],
      ['shame anchor persisted', (report.production.shameAnchors || []).length >= 1],
      ['loyalty choice persisted', (report.production.loyaltyChoices || []).length >= 1]
    ];
    report.assertions = checks.map(([name, pass]) => ({ name, pass }));
    report.pass = report.assertions.every(assertion => assertion.pass)
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0;
  } finally {
    await page.screenshot({ path: path.join(outputDir, 'final.png'), fullPage: true }).catch(() => {});
    await browser.close();
  }

  const reportPath = path.join(outputDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    overall: report.pass ? 'pass' : 'fail',
    reportPath,
    assertions: report.assertions,
    triggerCounts: report.production?.triggerCounts || {},
    pageErrors: report.pageErrors.length,
    consoleErrors: report.consoleErrors.length
  }, null, 2));
  process.exit(report.pass ? 0 : 1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
