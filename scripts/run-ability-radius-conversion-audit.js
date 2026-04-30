const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'http://127.0.0.1:3000/';
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ability_radius_conversion_audit');
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
  await page.waitForTimeout(1000);
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

  let browser;
  let context;
  let serverProcess = null;

  const check = (name, pass, details = {}) => {
    report.checks.push({ name, pass: !!pass, details });
    if (!pass) {
      throw new Error(`${name} failed: ${JSON.stringify(details)}`);
    }
  };

  try {
    serverProcess = await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
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
    await page.evaluate(async () => {
      await gameCore.resetGame(true);
    });
    await page.waitForTimeout(800);

    const result = await page.evaluate(() => {
      const failures = [];
      const approx = (actual, expected, epsilon = 0.0001) => Math.abs((actual ?? 0) - expected) <= epsilon;
      const notes = {};

      const warmRally = specialEffects.getAbilityVisualDefaults('warmRally');
      const shimmerVeil = specialEffects.getAbilityVisualDefaults('shimmerVeil');
      notes.warmRally = warmRally;
      notes.shimmerVeil = shimmerVeil;
      if (!approx(warmRally.abilityRadiusUnits, 4.5)) failures.push('warmRally abilityRadiusUnits != 4.5');
      if (!approx(warmRally.abilityRadius, 90)) failures.push('warmRally abilityRadius != 90');
      if (!approx(shimmerVeil.abilityRadiusUnits, 5)) failures.push('shimmerVeil abilityRadiusUnits != 5');

      const teachingConfig = communicationSystem.getSignalConfig('teaching_signal');
      notes.teachingSignal = teachingConfig;
      if (!approx(teachingConfig.radiusUnits, 3.8)) failures.push('teaching_signal radiusUnits != 3.8');
      if (!approx(teachingConfig.radius, 76)) failures.push('teaching_signal radius != 76');

      const socialBalance = gameConfig.balance.social;
      const trainingBalance = gameConfig.balance.training;
      if (!approx(socialBalance.teachingPulseRadiusUnits, 3.8)) failures.push('teachingPulseRadiusUnits != 3.8');
      if (!approx(socialBalance.trustCascadeRadiusUnits, 6.6)) failures.push('trustCascadeRadiusUnits != 6.6');
      if (!approx(trainingBalance.stationRadiusUnits, 2.1)) failures.push('stationRadiusUnits != 2.1');
      if (!approx(trainingBalance.impactRadiusUnits, 1.1)) failures.push('impactRadiusUnits != 1.1');

      const motion = battleSystem.getMotionConfig();
      notes.battleMotion = motion;
      if (!approx(motion.attackAdvanceUnits, 1.6) || !approx(motion.attackAdvancePx, 32)) failures.push('attack advance conversion mismatch');
      if (!approx(motion.projectileArcHeightUnits, 0.9) || !approx(motion.projectileArcHeightPx, 18)) failures.push('projectile arc conversion mismatch');

      const state = gameCore.getGameState();
      const butterflies = state.butterflies.slice(0, 10);
      const zoneId = gameCore.getFocusedZoneId?.() || butterflies[0]?.currentZoneId || state.currentZoneId || null;
      const ppu = gameConfig.spatial.projection.ppu || 20;
      const comparisons = [];

      for (let seed = 0; seed < 8; seed += 1) {
        const source = butterflies[0];
        source.currentZoneId = zoneId;
        source.boardPos = { zoneId, u: 8 + seed * 0.15, v: 8 + seed * 0.1, h: 0 };
        Object.assign(source, renderManager.boardToScreen(source.boardPos));

        butterflies.slice(1).forEach((butterfly, index) => {
          const angle = (seed * 0.73) + (index * 0.91);
          const radiusUnits = 1.2 + ((seed + index) % 7) * 0.58;
          const u = source.boardPos.u + Math.cos(angle) * radiusUnits;
          const v = source.boardPos.v + (Math.sin(angle) * radiusUnits) / (gameConfig.spatial.projection.groundT || 0.56);
          butterfly.currentZoneId = zoneId;
          butterfly.boardPos = { zoneId, u, v, h: 0 };
          Object.assign(butterfly, renderManager.boardToScreen(butterfly.boardPos));
        });

        const signal = communicationSystem.normalizeSignal({
          sourceId: source.id,
          sourceButterfly: source,
          zoneId,
          signalType: 'teaching_signal'
        }, state);
        const recipients = communicationSystem.resolveRecipients(signal, state).map(entity => entity.id).sort();
        const legacy = butterflies.slice(1)
          .filter(entity => Math.hypot((entity.x || 0) - (source.x || 0), (entity.y || 0) - (source.y || 0)) <= (teachingConfig.radius || 76))
          .map(entity => entity.id)
          .sort();
        comparisons.push({
          seed,
          recipients: recipients.length,
          legacy: legacy.length,
          delta: Math.abs(recipients.length - legacy.length)
        });
        if (Math.abs(recipients.length - legacy.length) > 1) {
          failures.push(`recipient cohort drift > 1 at seed ${seed}`);
        }
      }
      notes.recipientComparisons = comparisons;

      return { pass: failures.length === 0, failures, notes };
    });

    check('ability radius unit defaults', result.pass, result);
    await page.screenshot({ path: path.join(outputDir, 'ability-radius-conversion.png'), fullPage: true });
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
      checks: report.checks.map(check => ({ name: check.name, pass: check.pass }))
    }, null, 2));
  }
}

main();
