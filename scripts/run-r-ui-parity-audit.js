const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_ui_parity_audit');
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
  await page.waitForTimeout(1800);
}

async function resetBaseline(page) {
  await page.evaluate((keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
  }, STORAGE_KEYS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  await page.evaluate(async () => {
    await gameCore.resetGame(true);
    gameUI.setAccessibilitySettings?.({
      highContrastUI: false,
      colorblindMode: 'off',
      colorblindSafeIndicators: true,
      trailVisibility: 'off',
      uiScale: 1
    });
    gameUI.activityLogPanel.visible = false;
    gameUI.accessibilityPanel.visible = false;
    gameUI.inspectPanel.visible = false;
    gameUI.butterflyCollection.visible = false;
    gameUI.battleSetupPanel.visible = false;
    gameUI.clearInspectSelection?.(gameCore.gameState);
    debugUI && (debugUI.enabled = false);
  });
  await page.waitForTimeout(900);
}

async function newPage(browser, report, domEnabled) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  await context.addInitScript((enabled) => {
    window.__PAPILIONEM_PERFORMANCE_FLAG_OVERRIDES__ = { shellUiDom: enabled };
  }, domEnabled);
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(String(error)));
  page.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push(msg.text());
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await waitForGame(page);
  await dismissTitle(page);
  return { context, page };
}

async function saveShot(page, outputDir, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function phase(page, report, outputDir, name, run) {
  const result = await run();
  const screenshot = await saveShot(page, outputDir, name);
  report.phases.push({
    name,
    pass: !!result.pass,
    details: result.details || null,
    screenshot
  });
  return result;
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
    outputDir,
    phases: [],
    residuals: [],
    pageErrors: [],
    consoleErrors: [],
    server: null,
    overall: 'pending'
  };

  let browser;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });

    const canvas = await newPage(browser, report, false);
    await resetBaseline(canvas.page);

    await phase(canvas.page, report, outputDir, '01-canvas-hitbox-overlap', async () => {
      const details = await canvas.page.evaluate(() => {
        const overlapRatio = (a, b) => {
          if (!a || !b) return 0;
          const left = Math.max(a.x, b.x);
          const top = Math.max(a.y, b.y);
          const right = Math.min(a.x + a.width, b.x + b.width);
          const bottom = Math.min(a.y + a.height, b.y + b.height);
          const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
          const area = Math.max(1, Math.min(a.width * a.height, b.width * b.height));
          return intersection / area;
        };
        const rect = source => ({
          x: source.x,
          y: source.y,
          width: source.width,
          height: source.height
        });
        const scales = [0.75, 1, 1.25];
        const checks = [];
        for (const scale of scales) {
          gameUI.setUiScaleValue?.(scale);
          gameUI.syncPanelLayouts?.(gameCore.gameState);
          gameUI.activityLogPanel.visible = true;
          gameUI.accessibilityPanel.visible = true;
          gameUI.inspectPanel.visible = true;
          gameUI.butterflyCollection.visible = true;
          gameUI.battleSetupPanel.visible = false;
          gameUI.clearInspectSelection?.(gameCore.gameState);

          const playerDrawn = new Map(gameUI.buildPlayerButtonStates(gameCore.gameState).map(button => [button.id, button]));
          for (const hit of gameUI.getVisiblePlayerButtons()) {
            checks.push({
              scale,
              panel: 'top-buttons',
              id: hit.id,
              overlap: overlapRatio(rect(playerDrawn.get(hit.id)), rect(hit))
            });
          }

          for (const control of gameUI.getAccessibilityControlButtons()) {
            checks.push({
              scale,
              panel: 'accessibility',
              id: control.id,
              overlap: overlapRatio(rect(control), rect(control))
            });
          }
          const slider = gameUI.getAccessibilitySliderRect();
          checks.push({
            scale,
            panel: 'accessibility',
            id: 'uiScale-slider',
            overlap: overlapRatio(rect(slider), rect(slider))
          });

          for (const button of gameUI.getFeedFilterButtons()) {
            checks.push({
              scale,
              panel: 'feed',
              id: button.id,
              overlap: overlapRatio(rect(button), rect(button))
            });
          }

          const inspectRects = [
            ['all', gameUI.getInspectAllButtonRect?.()],
            ['list', gameUI.getInspectListButtonRect?.()],
            ['release', gameUI.getInspectReleaseButtonRect?.()],
            ['roster', gameUI.getInspectRosterButtonRect?.()],
            ['mate', gameUI.getInspectMateButtonRect?.()]
          ].filter(([, value]) => value);
          for (const [id, button] of inspectRects) {
            checks.push({
              scale,
              panel: 'inspect',
              id,
              overlap: overlapRatio(rect(button), rect(button))
            });
          }

          gameUI.butterflyCollection?.refreshLayout?.();
          const journalButtons = [
            ...(gameUI.butterflyCollection?.tabButtons || []),
            ...(Object.values(gameUI.butterflyCollection?.actionButtons || {}).filter(Boolean))
          ];
          for (const button of journalButtons) {
            checks.push({
              scale,
              panel: 'journal',
              id: button.id || button.label || 'button',
              overlap: overlapRatio(rect(button), rect(button))
            });
          }
        }
        const failures = checks.filter(check => check.overlap < 0.95);
        return {
          checkCount: checks.length,
          failures,
          worstOverlap: checks.reduce((min, check) => Math.min(min, check.overlap), 1)
        };
      });
      return {
        pass: details.checkCount > 0 && details.failures.length === 0,
        details
      };
    });

    await phase(canvas.page, report, outputDir, '02-canvas-accessibility-settings', async () => {
      const details = await canvas.page.evaluate(async () => {
        const after = {};
        gameUI.setAccessibilitySettings?.({
          highContrastUI: false,
          colorblindMode: 'off',
          colorblindSafeIndicators: true,
          trailVisibility: 'off',
          uiScale: 1
        });
        gameUI.activityLogPanel.visible = false;
        gameUI.inspectPanel.visible = false;
        gameUI.butterflyCollection.visible = false;
        gameUI.battleSetupPanel.visible = false;
        gameUI.accessibilityPanel.visible = true;
        gameUI.syncPanelLayouts?.(gameCore.gameState);

        const controls = Object.fromEntries(gameUI.getAccessibilityControlButtons().map(control => [control.id, control]));
        const toScreenPoint = (x, y) => ({
          x: x * (gameConfig.canvas.targetWidth / gameConfig.canvas.baseWidth),
          y: y * (gameConfig.canvas.targetHeight / gameConfig.canvas.baseHeight)
        });
        const clickControl = id => {
          const control = controls[id];
          if (!control) return false;
          const point = toScreenPoint(control.x + control.width / 2, control.y + control.height / 2);
          return gameUI.handleMousePressed(
            point.x,
            point.y,
            gameCore.gameState
          );
        };
        clickControl('highContrastUI');
        after.highContrastUI = gameUI.getAccessibilitySettings().highContrastUI;
        clickControl('trailVisibility');
        after.trailVisibility = gameUI.getAccessibilitySettings().trailVisibility;
        clickControl('cycleColorblindMode');
        if (typeof applyCanvasAccessibilityStyle === 'function') {
          applyCanvasAccessibilityStyle();
        }
        after.colorblindMode = gameUI.getAccessibilitySettings().colorblindMode;
        after.canvasFilter = document.querySelector('canvas')?.style?.filter || '';
        const slider = gameUI.getAccessibilitySliderRect();
        const sliderPoint = toScreenPoint(slider.x + slider.width, slider.y + slider.height / 2);
        gameUI.handleMousePressed(sliderPoint.x, sliderPoint.y, gameCore.gameState);
        after.uiScale = gameUI.getAccessibilitySettings().uiScale;
        await gameCore.saveGameToStorage?.({ source: 'ui-parity-audit' });
        return after;
      });
      await canvas.page.reload({ waitUntil: 'domcontentloaded' });
      await waitForGame(canvas.page);
      await canvas.page.waitForTimeout(600);
      const persisted = await canvas.page.evaluate(() => gameUI.getAccessibilitySettings());
      return {
        pass:
          details.highContrastUI === true &&
          details.trailVisibility !== 'off' &&
          details.colorblindMode !== 'off' &&
          details.canvasFilter &&
          details.canvasFilter !== 'none' &&
          details.uiScale > 1 &&
          persisted.highContrastUI === true &&
          persisted.trailVisibility === details.trailVisibility &&
          persisted.colorblindMode === details.colorblindMode &&
          persisted.uiScale === details.uiScale,
        details: { afterClick: details, persisted }
      };
    });

    await canvas.context.close();

    const dom = await newPage(browser, report, true);
    await resetBaseline(dom.page);

    await phase(dom.page, report, outputDir, '03-dom-accessibility-controls', async () => {
      await dom.page.evaluate(() => {
        gameUI.setAccessibilitySettings?.({
          highContrastUI: false,
          colorblindMode: 'off',
          colorblindSafeIndicators: true,
          trailVisibility: 'off',
          uiScale: 1
        });
        gameUI.accessibilityPanel.visible = true;
        gameUI.updateDomShell?.(gameCore.gameState);
      });
      await dom.page.waitForSelector('.shell-access-panel');
      const initialWidth = await dom.page.locator('.shell-access-panel').evaluate(node => node.getBoundingClientRect().width);
      const buttons = dom.page.locator('.shell-access-panel button.shell-button');
      await buttons.nth(0).click();
      await buttons.nth(1).click();
      await buttons.nth(2).click();
      const slider = dom.page.locator('.shell-access-panel input[type="range"]');
      await slider.fill('1.25');
      await dom.page.waitForTimeout(300);
      const details = await dom.page.evaluate(async () => {
        if (typeof applyCanvasAccessibilityStyle === 'function') {
          applyCanvasAccessibilityStyle();
        }
        await gameCore.saveGameToStorage?.({ source: 'ui-parity-dom-audit' });
        return {
          settings: gameUI.getAccessibilitySettings(),
          filter: document.querySelector('canvas')?.style?.filter || '',
          panelHighContrast: document.querySelector('.shell-access-panel')?.classList?.contains('is-high-contrast') || false,
          buttonCount: document.querySelectorAll('.shell-access-panel button.shell-button').length
        };
      });
      await dom.page.reload({ waitUntil: 'domcontentloaded' });
      await waitForGame(dom.page);
      await dom.page.evaluate(() => {
        gameUI.accessibilityPanel.visible = true;
        gameUI.updateDomShell?.(gameCore.gameState);
      });
      await dom.page.waitForSelector('.shell-access-panel');
      const persisted = await dom.page.evaluate(() => gameUI.getAccessibilitySettings());
      const updatedWidth = await dom.page.locator('.shell-access-panel').evaluate(node => node.getBoundingClientRect().width);
      return {
        pass:
          details.buttonCount >= 4 &&
          details.settings.highContrastUI === true &&
          details.settings.trailVisibility !== 'off' &&
          details.settings.colorblindMode !== 'off' &&
          details.settings.uiScale === 1.25 &&
          details.filter &&
          details.filter !== 'none' &&
          details.panelHighContrast === true &&
          persisted.highContrastUI === true &&
          persisted.trailVisibility === details.settings.trailVisibility &&
          persisted.colorblindMode === details.settings.colorblindMode &&
          persisted.uiScale === 1.25 &&
          updatedWidth > initialWidth,
        details: { initialWidth, updatedWidth, afterClick: details, persisted }
      };
    });

    await phase(dom.page, report, outputDir, '04-dom-feed-heard-meaning', async () => {
      const details = await dom.page.evaluate(() => {
        shellDomOverlay.initialize?.();
        shellDomOverlay.update?.({
          feed: {
            visible: true,
            rect: { x: 16, y: 92, width: 320, height: 260 },
            highContrast: false,
            contextLabel: 'Audit thread',
            filters: { talk: true, action: true, learn: true, warning: true, system: true },
            entries: [{
              category: 'talk',
              headline: 'Iris spoke to Mira',
              detail: 'The phrase was softened by context.',
              threadLines: [{ heardMeaning: 'I thought you meant stay close.' }],
              footer: 'now'
            }]
          }
        });
        const node = document.querySelector('.shell-feed-heard-meaning');
        const style = node ? getComputedStyle(node) : null;
        return {
          found: !!node,
          text: node?.textContent || '',
          fontStyle: style?.fontStyle || ''
        };
      });
      return {
        pass:
          details.found === true &&
          details.text.includes('(heard: I thought you meant stay close.)') &&
          details.fontStyle === 'italic',
        details
      };
    });

    await phase(dom.page, report, outputDir, '05-dom-inspect-feeling-row', async () => {
      const details = await dom.page.evaluate(() => {
        shellDomOverlay.initialize?.();
        shellDomOverlay.update?.({
          inspect: {
            visible: true,
            mode: 'detail',
            rect: { x: 350, y: 92, width: 320, height: 280 },
            highContrast: false,
            title: 'Inspect',
            subtitle: 'Iris',
            detailState: {
              heroLines: ['wild | calm | awake'],
              cognition: {
                strongestFeeling: 'jealousy',
                feelings: {
                  loneliness: 12,
                  comfortSeeking: 44,
                  socialInsecurity: 21,
                  jealousy: 68,
                  grief: 8,
                  pride: 33,
                  shame: 6,
                  loyaltyBias: 57
                }
              },
              sections: []
            }
          }
        });
        const row = document.querySelector('.shell-inspect-feeling-row');
        const chips = Array.from(document.querySelectorAll('.shell-inspect-feeling-row [data-feeling-key]'))
          .map(node => ({
            key: node.getAttribute('data-feeling-key'),
            text: node.textContent || ''
          }));
        return {
          found: !!row,
          chipCount: chips.length,
          keys: chips.map(chip => chip.key),
          texts: chips.map(chip => chip.text)
        };
      });
      const expectedKeys = [
        'strongestFeeling',
        'loneliness',
        'comfortSeeking',
        'socialInsecurity',
        'jealousy',
        'grief',
        'pride',
        'shame',
        'loyaltyBias'
      ];
      return {
        pass:
          details.found === true &&
          expectedKeys.every(key => details.keys.includes(key)) &&
          details.texts.some(text => text.includes('jealous 68%')) &&
          details.texts.some(text => text.includes('loyal 57%')),
        details
      };
    });

    await phase(dom.page, report, outputDir, '06-dom-canvas-inventory', async () => {
      const details = await dom.page.evaluate(() => {
        gameUI.accessibilityPanel.visible = true;
        gameUI.activityLogPanel.visible = true;
        gameUI.inspectPanel.visible = true;
        gameUI.butterflyCollection.visible = true;
        gameUI.syncPanelLayouts?.(gameCore.gameState);
        shellDomOverlay.panelSignatures?.clear?.();
        shellDomOverlay.update?.({
          feed: gameUI.buildFeedDomState?.(gameCore.gameState) || { visible: false },
          access: gameUI.buildAccessibilityDomState?.(gameCore.gameState) || { visible: false },
          inspect: gameUI.buildInspectDomState?.(gameCore.gameState) || { visible: false },
          journal: gameUI.buildJournalDomState?.(gameCore.gameState) || { visible: false },
          debug: { visible: false },
          guide: { visible: false }
        });
        const canvasInventory = {
          accessControls: gameUI.getAccessibilityControlButtons().map(control => control.id),
          feedFilters: gameUI.getFeedFilterButtons().map(button => button.id),
          inspectControls: ['all', 'list', 'release', 'roster', 'mate']
        };
        const domInventory = {
          accessButtons: Array.from(document.querySelectorAll('.shell-access-panel button.shell-button')).map(button => button.textContent.trim()),
          feedFilters: Array.from(document.querySelectorAll('.shell-feed-panel button.shell-button')).map(button => button.textContent.trim()),
          inspectButtons: Array.from(document.querySelectorAll('.shell-inspect-panel button.shell-button')).map(button => button.textContent.trim()),
          panels: Array.from(document.querySelectorAll('.shell-panel')).map(panel => panel.dataset.panel)
        };
        return { canvasInventory, domInventory };
      });
      const residuals = [];
      if (!details.domInventory.panels.includes('access')) {
        residuals.push('DOM access panel missing');
      }
      if (details.domInventory.accessButtons.length < details.canvasInventory.accessControls.length) {
        residuals.push('DOM access controls fewer than canvas controls');
      }
      if (details.domInventory.feedFilters.length < details.canvasInventory.feedFilters.length) {
        residuals.push('DOM feed filters fewer than canvas filters');
      }
      report.residuals.push(...residuals.map(message => ({ lane: 'ui-parity-gaps', message })));
      return {
        pass:
          details.domInventory.panels.includes('access') &&
          details.domInventory.accessButtons.length >= details.canvasInventory.accessControls.length,
        details: { ...details, residuals }
      };
    });

    await dom.context.close();
    report.overall = report.phases.every(item => item.pass)
      && report.pageErrors.length === 0
      && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
  } catch (error) {
    report.overall = 'error';
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }

  if (report.overall !== 'pass') {
    process.exitCode = 1;
  }
}

run();
