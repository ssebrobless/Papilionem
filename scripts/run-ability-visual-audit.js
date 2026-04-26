const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'ability_visual_audit');
const URL = 'http://127.0.0.1:3000/';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function timestampDir() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
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

async function applyPreset(page, presetId) {
  return page.evaluate((id) => {
    if (typeof debugUI === 'undefined' || typeof gameCore === 'undefined') return { ok: false, reason: 'missing-debug' };
    const serialized = debugUI.buildAuditPresetState?.(id);
    if (!serialized) return { ok: false, reason: 'missing-preset' };
    gameCore.applySerializedState?.(serialized);
    return { ok: true };
  }, presetId);
}

async function triggerScenario(page, scenarioId) {
  return page.evaluate((id) => {
    const state = gameCore?.getGameState?.() || gameCore?.gameState;
    const effectsOwner = typeof specialEffects !== 'undefined'
      ? specialEffects
      : (typeof specialEffectsSystem !== 'undefined' ? specialEffectsSystem : null);
    if (!state || !effectsOwner) return { ok: false, reason: 'missing-state' };

    const butterflies = state.butterflies || [];
    const findButterfly = (personalityType) => butterflies.find(butterfly => butterfly?.personalityType === personalityType);
    const summarizeEffects = () => (effectsOwner.activeEffects || []).map(effect => ({
      type: effect.type,
      ability: effect.ability,
      radius: effect.abilityRadius || null,
      sourceId: effect.sourceId || null,
      symbol: effect.symbol || null
    }));
    effectsOwner.activeEffects.length = 0;

    switch (id) {
      case 'welcome-ring': {
        const source = findButterfly('friendly');
        if (!source) return { ok: false, reason: 'missing-friendly' };
        source.happiness = Math.max(source.baselineHappiness + 24, 90);
        source.updateWarmWelcomeAura?.(butterflies);
        source.emitAbilityVisual?.('welcome');
        const effects = summarizeEffects();
        return {
          ok: effects.some(effect => effect.ability === 'welcome' && effect.type === 'abilityring'),
          effects
        };
      }
      case 'speedzone-ring': {
        const source = findButterfly('energetic');
        if (!source) return { ok: false, reason: 'missing-energetic' };
        source.happiness = Math.max(source.baselineHappiness + 24, 90);
        statusSystem?.clearCooldown?.(source.id, 'speedzone_pulse');
        source.updateSpeedZone?.(butterflies);
        const effects = summarizeEffects();
        return {
          ok: effects.some(effect => effect.ability === 'speedzone' && effect.type === 'abilityring'),
          effects
        };
      }
      case 'teacher-symbol': {
        const source = findButterfly('wise');
        if (!source) return { ok: false, reason: 'missing-wise' };
        source.happiness = Math.max(82, source.happiness || 0);
        statusSystem?.clearCooldown?.(source.id, 'teaching_pulse');
        source.updateTeachingAura?.(butterflies);
        const effects = summarizeEffects();
        return {
          ok: effects.some(effect => effect.ability === 'teacher' && effect.type === 'abilitysymbol'),
          effects
        };
      }
      case 'cascade-symbol': {
        const source = findButterfly('skittish');
        if (!source) return { ok: false, reason: 'missing-skittish' };
        source.createTrustCascade?.(butterflies);
        const effects = summarizeEffects();
        return {
          ok: effects.some(effect => effect.ability === 'cascade' && effect.type === 'abilitysymbol'),
          effects
        };
      }
      case 'shimmer-ring': {
        const source = findButterfly('mystic');
        if (!source) return { ok: false, reason: 'missing-mystic' };
        source.happiness = Math.max(source.baselineHappiness + 24, 90);
        source.updateSleepAssistAura?.(butterflies);
        source.emitAbilityVisual?.('shimmer');
        const effects = summarizeEffects();
        return {
          ok: effects.some(effect => effect.ability === 'shimmer' && effect.type === 'abilityring'),
          effects
        };
      }
      case 'golden-symbol': {
        effectsOwner.addAbilityVisualEffect?.({
          ability: 'golden',
          x: 360,
          y: 180,
          durationFrames: 32
        });
        const effects = summarizeEffects();
        return {
          ok: effects.some(effect => effect.ability === 'golden' && effect.type === 'abilitysymbol'),
          effects
        };
      }
      default:
        return { ok: false, reason: 'unknown-scenario' };
    }
  }, scenarioId);
}

async function main() {
  const outputDir = path.join(OUTPUT_ROOT, timestampDir());
  ensureDir(outputDir);

  const report = {
    startedAt: new Date().toISOString(),
    url: URL,
    steps: [],
    overall: 'pending'
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    const page = await context.newPage();

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);
    await waitForGame(page);
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(250);

    const steps = [
      { presetId: 'teaching-pair', scenarioId: 'welcome-ring', shot: '01-welcome-ring' },
      { presetId: 'trust-cascade-cluster', scenarioId: 'speedzone-ring', shot: '02-speedzone-ring' },
      { presetId: 'teaching-pair', scenarioId: 'teacher-symbol', shot: '03-teacher-symbol' },
      { presetId: 'trust-cascade-cluster', scenarioId: 'cascade-symbol', shot: '04-cascade-symbol' },
      { presetId: 'sleep-assist-cluster', scenarioId: 'shimmer-ring', shot: '05-shimmer-ring' },
      { presetId: 'sleep-assist-cluster', scenarioId: 'golden-symbol', shot: '06-golden-symbol' }
    ];

    for (const step of steps) {
      const presetResult = await applyPreset(page, step.presetId);
      await page.waitForTimeout(350);
      const scenarioResult = await triggerScenario(page, step.scenarioId);
      await page.waitForTimeout(180);
      const screenshot = await saveShot(page, outputDir, step.shot);
      const pass = !!presetResult.ok && !!scenarioResult.ok;
      report.steps.push({
        ...step,
        pass,
        presetResult,
        scenarioResult,
        screenshot
      });
    }

    report.overall = report.steps.every(step => step.pass) ? 'pass' : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = error?.message || String(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    outputDir,
    overall: report.overall
  }, null, 2));
  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

main();
