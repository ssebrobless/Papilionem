const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'r_hover_scroll_audit');
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
  await page.evaluate(async (keys) => {
    keys.forEach(key => window.localStorage.removeItem(key));
    await gameCore.resetGame(true);
    gameUI.setAccessibilitySettings?.({ uiScale: 1, highContrastUI: false });
  }, STORAGE_KEYS);
  await page.waitForTimeout(900);
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
    pageErrors: [],
    consoleErrors: [],
    server: null,
    overall: 'pending'
  };

  let browser;
  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });

    const dom = await newPage(browser, report, true);
    await phase(dom.page, report, outputDir, '01-dom-hover-scroll', async () => {
      await dom.page.evaluate(() => {
        gameUI.activityLogPanel.visible = false;
        gameUI.accessibilityPanel.visible = false;
        gameUI.inspectPanel.visible = false;
        gameUI.butterflyCollection.visible = false;
        gameUI.firstSessionGuide.visible = false;
        if (typeof debugUI !== 'undefined') debugUI.enabled = false;
        gameUI.updateDomShell?.(gameCore.gameState);
      });
      await dom.page.waitForTimeout(500);
      const panelIds = ['feed', 'access', 'inspect', 'journal', 'debug'];
      const setupPanel = async (panelId) => {
        await dom.page.evaluate((id) => {
          gameUI.activityLogPanel.visible = id === 'feed';
          gameUI.accessibilityPanel.visible = id === 'access';
          gameUI.inspectPanel.visible = id === 'inspect';
          gameUI.butterflyCollection.visible = id === 'journal';
          gameUI.firstSessionGuide.visible = false;
          if (typeof debugUI !== 'undefined') debugUI.enabled = id === 'debug';
          shellDomOverlay.panelSignatures?.clear?.();
          gameUI.updateDomShell?.(gameCore.gameState);
        }, panelId);
        await dom.page.waitForTimeout(160);
        return dom.page.evaluate((id) => {
          const panel = document.querySelector(`.shell-panel[data-panel="${id}"]`);
          if (!panel) return null;
          const scrollerSelectors = [
            '.shell-feed-list',
            '.shell-body-scroll',
            '.shell-access-list',
            '.shell-debug-status'
          ];
          const scroller = scrollerSelectors
            .map(selector => panel.querySelector(selector))
            .find(Boolean);
          if (!scroller) return null;
          if ((scroller.scrollHeight - scroller.clientHeight) < 320) {
            const filler = document.createElement('div');
            filler.className = 'shell-scroll-audit-filler';
            filler.style.height = '720px';
            filler.textContent = 'Scroll audit filler';
            scroller.appendChild(filler);
          }
          const rect = panel.getBoundingClientRect();
          return {
            id: panel.dataset.panel || panel.className,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            hasScroller: !!scroller,
            scrollHeight: scroller.scrollHeight,
            clientHeight: scroller.clientHeight
          };
        }, panelId);
      };
      const setup = [];
      const checks = [];
      for (const panelId of panelIds) {
        const panel = await setupPanel(panelId);
        if (!panel?.hasScroller) continue;
        setup.push(panel);
        const targets = [
          { name: 'header', x: panel.rect.x + panel.rect.width / 2, y: panel.rect.y + 12 },
          { name: 'body', x: panel.rect.x + panel.rect.width / 2, y: panel.rect.y + panel.rect.height / 2 },
          { name: 'footer', x: panel.rect.x + panel.rect.width / 2, y: panel.rect.y + panel.rect.height - 10 }
        ];
        for (const target of targets) {
          await setupPanel(panelId);
          const before = await dom.page.evaluate((id) => {
            const panel = document.querySelector(`.shell-panel[data-panel="${id}"]`);
            const scroller = ['.shell-feed-list', '.shell-body-scroll', '.shell-access-list', '.shell-debug-status']
              .map(selector => panel?.querySelector(selector))
              .find(Boolean);
            if (scroller) scroller.scrollTop = 0;
            return scroller?.scrollTop || 0;
          }, panelId);
          await dom.page.mouse.move(target.x, target.y);
          await dom.page.mouse.wheel(0, 320);
          await dom.page.waitForTimeout(80);
          const after = await dom.page.evaluate((id) => {
            const panel = document.querySelector(`.shell-panel[data-panel="${id}"]`);
            const scroller = ['.shell-feed-list', '.shell-body-scroll', '.shell-access-list', '.shell-debug-status']
              .map(selector => panel?.querySelector(selector))
              .find(Boolean);
            return scroller?.scrollTop || 0;
          }, panelId);
          checks.push({
            panel: panelId,
            target: target.name,
            before,
            after,
            pass: after > before
          });
        }
      }
      const details = { panels: setup, checks };
      return {
        pass: checks.length > 0 && checks.every(check => check.pass),
        details
      };
    });
    await dom.context.close();

    const canvas = await newPage(browser, report, false);
    await phase(canvas.page, report, outputDir, '02-canvas-hover-scroll', async () => {
      const details = await canvas.page.evaluate(() => {
        const hideAll = () => {
          gameUI.activityLogPanel.visible = false;
          gameUI.inspectPanel.visible = false;
          gameUI.butterflyCollection.visible = false;
          gameUI.accessibilityPanel.visible = false;
          gameUI.battleSetupPanel.visible = false;
          gameUI.firstSessionGuide.visible = false;
        };
        const point = rect => ({
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2
        });
        const toScreenPoint = canvasPoint => ({
          x: canvasPoint.x * (gameConfig.canvas.targetWidth / gameConfig.canvas.baseWidth),
          y: canvasPoint.y * (gameConfig.canvas.targetHeight / gameConfig.canvas.baseHeight)
        });
        const checks = [];

        hideAll();
        gameUI.activityLogPanel.visible = true;
        gameUI.syncPanelLayouts?.(gameCore.gameState);
        const feedRect = gameUI.getDomPanelRect(gameUI.activityLogPanel);
        const feedPoint = toScreenPoint(point(feedRect));
        gameUI.activityLogPanel.scrollOffset = 0;
        gameUI.activityLogPanel.followLatest = true;
        const feedBefore = gameUI.activityLogPanel.scrollOffset || 0;
        const feedHandled = gameUI.handleMouseWheel(feedPoint.x, feedPoint.y, -360, gameCore.gameState);
        checks.push({
          panel: 'feed',
          before: feedBefore,
          after: gameUI.activityLogPanel.scrollOffset || 0,
          handled: feedHandled,
          pass: feedHandled && (gameUI.activityLogPanel.scrollOffset || 0) > feedBefore
        });

        hideAll();
        gameUI.inspectPanel.visible = true;
        gameUI.syncPanelLayouts?.(gameCore.gameState);
        const inspectRect = gameUI.getInspectPanelRect();
        const inspectPoint = toScreenPoint(point(inspectRect));
        gameUI.inspectPanel.scrollOffset = 0;
        const inspectBefore = gameUI.inspectPanel.scrollOffset || 0;
        const inspectHandled = gameUI.handleMouseWheel(inspectPoint.x, inspectPoint.y, -360, gameCore.gameState);
        checks.push({
          panel: 'inspect',
          before: inspectBefore,
          after: gameUI.inspectPanel.scrollOffset || 0,
          handled: inspectHandled,
          pass: inspectHandled && (gameUI.inspectPanel.scrollOffset || 0) > inspectBefore
        });

        hideAll();
        gameUI.butterflyCollection.visible = true;
        gameUI.syncPanelLayouts?.(gameCore.gameState);
        gameUI.butterflyCollection?.refreshLayout?.();
        const journal = gameUI.butterflyCollection;
        const journalRect = { x: journal.x, y: journal.y, width: journal.width, height: journal.height };
        const journalPoint = toScreenPoint(point(journalRect));
        const journalBefore = journal.getCurrentScrollOffset?.() || 0;
        const journalHandled = gameUI.handleMouseWheel(journalPoint.x, journalPoint.y, -420, gameCore.gameState);
        const journalAfter = journal.getCurrentScrollOffset?.() || 0;
        checks.push({
          panel: 'journal',
          before: journalBefore,
          after: journalAfter,
          handled: journalHandled,
          pass: journalHandled && journalAfter >= journalBefore
        });

        hideAll();
        gameUI.accessibilityPanel.visible = true;
        gameUI.syncPanelLayouts?.(gameCore.gameState);
        const accessSlider = gameUI.getAccessibilitySliderRect();
        const accessPanel = gameUI.getDomPanelRect(
          gameUI.accessibilityPanel,
          (accessSlider.y + accessSlider.height + 14) - gameUI.accessibilityPanel.y
        );
        const accessPoint = toScreenPoint(point(accessPanel));
        const accessHandled = gameUI.handleMouseWheel(accessPoint.x, accessPoint.y, -360, gameCore.gameState);
        checks.push({
          panel: 'accessibility',
          handled: accessHandled,
          pass: accessHandled
        });

        return { checks };
      });
      return {
        pass: details.checks.every(check => check.pass),
        details
      };
    });
    await canvas.context.close();

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
