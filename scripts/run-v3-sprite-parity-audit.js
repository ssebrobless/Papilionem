const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'qa_screenshots', 'v3_sprite_parity_audit');
const URL = 'http://127.0.0.1:3000/';

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

function writeDataUrlPng(dataUrl, outputPath) {
  const normalized = String(dataUrl || '').replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(outputPath, Buffer.from(normalized, 'base64'));
}

function buildMarkdownReport(report, specimens) {
  const lines = [
    '# V3 Sprite Parity Audit',
    '',
    '```text',
    `overall`,
    `├─ pass count   ${report.passCount}/${report.specimenCount}`,
    `├─ fail count   ${report.failCount}`,
    `├─ max diff     ${report.maxDiffScore.toFixed(5)}`,
    `└─ max bbox drift ${report.maxBBoxDrift}px`,
    '```',
    '',
    '## Thresholds',
    '',
    '```text',
    `diffScore <= ${report.thresholds.diffScore}`,
    `bbox drift <= ${report.thresholds.bboxDriftPx}px`,
    '```',
    '',
    '## Specimens',
    ''
  ];

  for (const specimen of specimens) {
    lines.push(`- ${specimen.name}: ${specimen.pass ? 'pass' : 'fail'} | diff ${specimen.diffScore.toFixed(5)} | bbox drift ${specimen.bboxDriftPx}px | [side-by-side](${path.basename(specimen.screenshot)})`);
  }

  return lines.join('\n');
}

function buildPerceptualMarkdownReport(report, specimens) {
  const lines = [
    '# V3 Sprite Parity Audit',
    '',
    '```text',
    'overall',
    `pass count          ${report.passCount}/${report.specimenCount}`,
    `fail count          ${report.failCount}`,
    `max diff            ${report.maxDiffScore.toFixed(5)}`,
    `max perceptual diff ${report.maxPerceptualDiffScore.toFixed(5)}`,
    `max bbox drift      ${report.maxBBoxDrift}px`,
    '```',
    '',
    '## Thresholds',
    '',
    '```text',
    `perceptualDiffScore <= ${report.thresholds.perceptualDiffScore}`,
    'diffScore diagnostic only',
    `bbox drift <= ${report.thresholds.bboxDriftPx}px`,
    '```',
    '',
    '## Specimens',
    ''
  ];

  for (const specimen of specimens) {
    lines.push(`- ${specimen.name}: ${specimen.pass ? 'pass' : 'fail'} | perceptual ${specimen.perceptualDiffScore.toFixed(5)} | raw diff ${specimen.diffScore.toFixed(5)} | bbox drift ${specimen.bboxDriftPx}px | [side-by-side](${path.basename(specimen.screenshot)})`);
  }

  return lines.join('\n');
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
    thresholds: {
      perceptualDiffScore: 0.07,
      bboxDriftPx: 2
    },
    specimenCount: 0,
    passCount: 0,
    failCount: 0,
    maxDiffScore: 0,
    maxPerceptualDiffScore: 0,
    maxBBoxDrift: 0,
    pageErrors: [],
    consoleErrors: [],
    server: null,
    overall: 'pending',
    specimens: []
  };

  let browser;
  let context;
  let page;

  try {
    await ensureServer(report);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1600, height: 900 }
    });
    page = await context.newPage();

    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitForGame(page);
    await dismissTitle(page);

    const results = await page.evaluate(() => {
      const WIDTH = 220;
      const HEIGHT = 180;
      const GAP = 12;
      const BUTTERFLY_SCALE = 0.048;

      const butterflySpecs = ['friendly', 'cautious', 'energetic', 'skittish', 'wise', 'mystic', 'golden']
        .flatMap(personalityType => ([
          { family: 'butterfly', name: `${personalityType}-F-rest`, spec: { personalityType, baseType: personalityType, sex: 'F' }, pose: 'rest' },
          { family: 'butterfly', name: `${personalityType}-M-rest`, spec: { personalityType, baseType: personalityType, sex: 'M' }, pose: 'rest' },
          { family: 'butterfly', name: `${personalityType}-F-flare`, spec: { personalityType, baseType: personalityType, sex: 'F' }, pose: 'flare' }
        ]));

      butterflySpecs.push({
        family: 'butterfly',
        name: 'hybrid-F-flare',
        pose: 'flare',
        spec: {
          personalityType: 'hybrid',
          baseType: 'friendly',
          sex: 'F',
          isHybrid: true,
          hybridGenome: {
            wingDonors: {
              foreLeft: { personalityType: 'friendly', sex: 'F' },
              foreRight: { personalityType: 'cautious', sex: 'F' },
              hindLeft: { personalityType: 'wise', sex: 'M' },
              hindRight: { personalityType: 'mystic', sex: 'F' }
            }
          }
        }
      });

      const nonButterflySpecs = [
        { family: 'caterpillar', name: 'caterpillar-frame0', frameIndex: 0 },
        { family: 'cocoon', name: 'cocoon-unhatched', cocoonState: 'unhatched' },
        { family: 'cocoon', name: 'cocoon-hatched', cocoonState: 'hatched' }
      ];

      const allSpecs = [...butterflySpecs, ...nonButterflySpecs];

      function normalizeBBox(bounds) {
        if (!bounds) {
          return { minX: null, minY: null, maxX: null, maxY: null, width: 0, height: 0 };
        }
        return {
          minX: bounds.minX,
          minY: bounds.minY,
          maxX: bounds.maxX,
          maxY: bounds.maxY,
          width: bounds.maxX >= bounds.minX ? (bounds.maxX - bounds.minX + 1) : 0,
          height: bounds.maxY >= bounds.minY ? (bounds.maxY - bounds.minY + 1) : 0
        };
      }

      function prepareSurface(surface) {
        surface.pixelDensity(1);
        surface.noSmooth();
        if (surface.drawingContext) {
          surface.drawingContext.imageSmoothingEnabled = false;
        }
        surface.clear();
        return surface;
      }

      function computeImageMetrics(surface) {
        const ctx = surface.drawingContext;
        const imageData = ctx.getImageData(0, 0, surface.width, surface.height).data;
        let visiblePixels = 0;
        let bounds = null;
        for (let y = 0; y < surface.height; y += 1) {
          for (let x = 0; x < surface.width; x += 1) {
            const idx = ((y * surface.width) + x) * 4;
            const alpha = imageData[idx + 3];
            if (alpha > 0) {
              visiblePixels += 1;
              if (!bounds) {
                bounds = { minX: x, minY: y, maxX: x, maxY: y };
              } else {
                bounds.minX = Math.min(bounds.minX, x);
                bounds.minY = Math.min(bounds.minY, y);
                bounds.maxX = Math.max(bounds.maxX, x);
                bounds.maxY = Math.max(bounds.maxY, y);
              }
            }
          }
        }
        return {
          visiblePixels,
          bounds: normalizeBBox(bounds)
        };
      }

      function compareSurfaces(a, b) {
        const dataA = a.drawingContext.getImageData(0, 0, a.width, a.height).data;
        const dataB = b.drawingContext.getImageData(0, 0, b.width, b.height).data;
        let unionVisible = 0;
        let totalChannelDiff = 0;
        for (let i = 0; i < dataA.length; i += 4) {
          const alphaA = dataA[i + 3];
          const alphaB = dataB[i + 3];
          if (alphaA > 0 || alphaB > 0) {
            unionVisible += 1;
            totalChannelDiff += Math.abs(dataA[i] - dataB[i]);
            totalChannelDiff += Math.abs(dataA[i + 1] - dataB[i + 1]);
            totalChannelDiff += Math.abs(dataA[i + 2] - dataB[i + 2]);
            totalChannelDiff += Math.abs(alphaA - alphaB);
          }
        }

        const metricsA = computeImageMetrics(a);
        const metricsB = computeImageMetrics(b);
        const diffScore = unionVisible > 0
          ? totalChannelDiff / (unionVisible * 4 * 255)
          : 0;
        const bboxDriftPx = Math.max(
          Math.abs((metricsA.bounds.minX ?? 0) - (metricsB.bounds.minX ?? 0)),
          Math.abs((metricsA.bounds.minY ?? 0) - (metricsB.bounds.minY ?? 0)),
          Math.abs((metricsA.bounds.maxX ?? 0) - (metricsB.bounds.maxX ?? 0)),
          Math.abs((metricsA.bounds.maxY ?? 0) - (metricsB.bounds.maxY ?? 0))
        );

        return {
          diffScore,
          bboxDriftPx,
          off: metricsA,
          baked: metricsB
        };
      }

      function computePerceptualDiffScore(a, b) {
        const SAMPLE_WIDTH = 64;
        const SAMPLE_HEIGHT = 64;
        const sampleA = createGraphics(SAMPLE_WIDTH, SAMPLE_HEIGHT);
        const sampleB = createGraphics(SAMPLE_WIDTH, SAMPLE_HEIGHT);
        sampleA.pixelDensity(1);
        sampleB.pixelDensity(1);
        sampleA.smooth();
        sampleB.smooth();
        if (sampleA.drawingContext) {
          sampleA.drawingContext.imageSmoothingEnabled = true;
        }
        if (sampleB.drawingContext) {
          sampleB.drawingContext.imageSmoothingEnabled = true;
        }
        sampleA.clear();
        sampleB.clear();
        sampleA.image(a, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
        sampleB.image(b, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
        const diffScore = compareSurfaces(sampleA, sampleB).diffScore;
        sampleA.remove?.();
        sampleB.remove?.();
        return diffScore;
      }

      function drawButterflyPreview(graphics, spec, pose, useBakedSprites) {
        const bodyScale = spec.sex === 'M' ? 0.8 : 1.0;
        const wingScale = spec.sex === 'F' ? 1.2 : 1.0;
        const bodyCenter = spriteManager.anchors.body;
        const wingSpread = pose === 'flare' ? 1 : 0.84;
        const hindSpread = pose === 'flare' ? 0.95 : 0.8;

        graphics.clear();
        graphics.push();
        graphics.translate(WIDTH / 2, HEIGHT / 2);
        graphics.noSmooth();
        if (graphics.drawingContext) {
          graphics.drawingContext.imageSmoothingEnabled = false;
        }
        graphics.tint(255, 255);

        if (spriteManager.body) {
          const s = BUTTERFLY_SCALE * bodyScale;
          const bodySprite = spriteManager.body;
          const bodyW = spriteManager.body.width * s;
          const bodyH = spriteManager.body.height * s;
          graphics.image(bodySprite, -bodyW / 2, -bodyH / 2, bodyW, bodyH);
        }

        if (spriteManager.antenna) {
          const antennaScale = BUTTERFLY_SCALE * bodyScale;
          const antennaSprite = spriteManager.antenna;
          const antennaW = spriteManager.antenna.width * antennaScale;
          const antennaH = spriteManager.antenna.height * antennaScale;
          const anchors = spriteManager.anchors.antenna;
          for (const side of ['left', 'right']) {
            const anchor = anchors[side];
            const bodyConnX = (anchor.onBody.x - bodyCenter.centerX) * antennaScale;
            const bodyConnY = (anchor.onBody.y - bodyCenter.centerY) * antennaScale;
            const drawX = bodyConnX - (anchor.onAntenna.x * antennaScale);
            const drawY = bodyConnY - (anchor.onAntenna.y * antennaScale);
            graphics.image(antennaSprite, drawX, drawY, antennaW, antennaH);
          }
        }

        graphics.push();
        for (const wingKey of ['hindLeft', 'hindRight', 'foreLeft', 'foreRight']) {
          const rawPiece = spriteManager.getWingPieceForSpec(spec, wingKey);
          if (!rawPiece) continue;

          const anchor = spriteManager.anchors.wings[wingKey];
          const relAnchor = spriteManager.anchors.wingsRelative[wingKey];
          const bodyConnX = (anchor.onBody.x - bodyCenter.centerX) * (BUTTERFLY_SCALE * bodyScale);
          let bodyConnY = (anchor.onBody.y - bodyCenter.centerY) * (BUTTERFLY_SCALE * bodyScale);
          if (wingKey.startsWith('hind')) {
            bodyConnY -= 5 * BUTTERFLY_SCALE * bodyScale;
          }

          const ws = BUTTERFLY_SCALE * wingScale * 1.45;
          let piece = rawPiece;
          let pieceW = rawPiece.width * ws;
          let pieceH = rawPiece.height * ws;
          let anchorX = relAnchor.x * ws;
          let anchorY = relAnchor.y * ws;
          let bakedPoseUsed = false;
          const spread = wingKey.startsWith('hind') ? hindSpread : wingSpread;
          if (useBakedSprites) {
            const bakedPose = spriteManager.shouldUseBakedWingPose?.(wingKey, spread, false)
              ? spriteManager.getBakedWingPoseData(spec, wingKey, ws, spread)
              : null;
            if (bakedPose?.surface) {
              piece = bakedPose.surface;
              pieceW = bakedPose.drawWidth;
              pieceH = bakedPose.drawHeight;
              anchorX = bakedPose.anchorX;
              anchorY = bakedPose.anchorY;
              bakedPoseUsed = true;
            } else {
              const bakedPiece = spriteManager.getBakedWingPieceData(spec, wingKey, ws);
              if (bakedPiece?.surface) {
                piece = bakedPiece.surface;
                pieceW = bakedPiece.drawWidth;
                pieceH = bakedPiece.drawHeight;
                anchorX = bakedPiece.anchorX;
                anchorY = bakedPiece.anchorY;
              }
            }
          }

          const drawX = bodyConnX - anchorX;
          const drawY = bodyConnY - anchorY;

          if (bakedPoseUsed) {
            graphics.image(piece, drawX, drawY, pieceW, pieceH);
            continue;
          }

          graphics.push();
          graphics.translate(bodyConnX, bodyConnY);
          graphics.scale(spread, 1);
          graphics.translate(-bodyConnX, -bodyConnY);
          graphics.image(piece, drawX, drawY, pieceW, pieceH);
          graphics.pop();
        }
        graphics.pop();

        graphics.noTint();
        graphics.pop();
      }

      function drawCaterpillarPreview(graphics, frameIndex, useBakedSprites) {
        graphics.clear();
        graphics.push();
        graphics.translate(WIDTH / 2, HEIGHT / 2);
        graphics.noSmooth();
        if (graphics.drawingContext) {
          graphics.drawingContext.imageSmoothingEnabled = false;
        }
        const frame = spriteManager.caterpillarFrames?.[frameIndex];
        if (frame) {
          const scale = (24 * 1.7) / 1080;
          const drawFrame = frame;
          const w = frame.width * scale;
          const h = frame.height * scale;
          const drawX = -w / 2;
          const drawY = -h / 2;
          graphics.image(drawFrame, drawX, drawY, w, h);
        }
        graphics.pop();
      }

      function drawCocoonPreview(graphics, cocoonState, useBakedSprites) {
        graphics.clear();
        graphics.push();
        graphics.translate(WIDTH / 2, HEIGHT / 2);
        graphics.noSmooth();
        if (graphics.drawingContext) {
          graphics.drawingContext.imageSmoothingEnabled = false;
        }
        let sprite = cocoonState === 'hatched' ? spriteManager.cocoonSprites.hatched : spriteManager.cocoonSprites.unhatched;
        if (sprite) {
          let w = sprite.width * 0.024;
          let h = sprite.height * 0.024;
          if (useBakedSprites) {
            const bakedSprite = spriteManager.getBakedCocoonSprite(cocoonState, w, h);
            if (bakedSprite) {
              sprite = bakedSprite;
              w = bakedSprite.width;
              h = bakedSprite.height;
            }
          }
          graphics.image(sprite, -w / 2, -h / 2, w, h);
        }
        graphics.pop();
      }

      function buildSideBySide(offSurface, bakedSurface, label) {
        const composite = createGraphics((WIDTH * 2) + GAP, HEIGHT + 26);
        prepareSurface(composite);
        composite.background(17, 20, 28, 255);
        composite.fill(235, 240, 250, 255);
        composite.noStroke();
        composite.textAlign(CENTER, TOP);
        composite.textSize(12);
        composite.text(label, composite.width / 2, 4);
        composite.image(offSurface, 0, 24, WIDTH, HEIGHT);
        composite.image(bakedSurface, WIDTH + GAP, 24, WIDTH, HEIGHT);
        composite.fill(170, 184, 204, 255);
        composite.textSize(10);
        composite.text('raw', WIDTH / 2, HEIGHT + 6);
        composite.text('baked', WIDTH + GAP + (WIDTH / 2), HEIGHT + 6);
        return composite;
      }

      const priorFlag = gameConfig.performance.flags.bakedCreatureSprites;
      const results = [];

      try {
        for (const specimen of allSpecs) {
          const offSurface = prepareSurface(createGraphics(WIDTH, HEIGHT));
          const bakedSurface = prepareSurface(createGraphics(WIDTH, HEIGHT));

          gameConfig.performance.flags.bakedCreatureSprites = false;
          if (specimen.family === 'butterfly') {
            drawButterflyPreview(offSurface, specimen.spec, specimen.pose, false);
          } else if (specimen.family === 'caterpillar') {
            drawCaterpillarPreview(offSurface, specimen.frameIndex, false);
          } else {
            drawCocoonPreview(offSurface, specimen.cocoonState, false);
          }

          gameConfig.performance.flags.bakedCreatureSprites = true;
          if (specimen.family === 'butterfly') {
            drawButterflyPreview(bakedSurface, specimen.spec, specimen.pose, true);
          } else if (specimen.family === 'caterpillar') {
            drawCaterpillarPreview(bakedSurface, specimen.frameIndex, true);
          } else {
            drawCocoonPreview(bakedSurface, specimen.cocoonState, true);
          }

          const comparison = compareSurfaces(offSurface, bakedSurface);
          const perceptualDiffScore = computePerceptualDiffScore(offSurface, bakedSurface);
          const sideBySide = buildSideBySide(offSurface, bakedSurface, specimen.name);
          results.push({
            family: specimen.family,
            name: specimen.name,
            diffScore: comparison.diffScore,
            perceptualDiffScore,
            bboxDriftPx: comparison.bboxDriftPx,
            offVisiblePixels: comparison.off.visiblePixels,
            bakedVisiblePixels: comparison.baked.visiblePixels,
            offBounds: comparison.off.bounds,
            bakedBounds: comparison.baked.bounds,
            imageDataUrl: sideBySide.canvas.toDataURL('image/png')
          });

          offSurface.remove?.();
          bakedSurface.remove?.();
          sideBySide.remove?.();
        }
      } finally {
        gameConfig.performance.flags.bakedCreatureSprites = priorFlag;
      }

      return results;
    });

    report.specimenCount = results.length;
    for (const specimen of results) {
      const screenshot = path.join(outputDir, `${specimen.name}.png`);
      writeDataUrlPng(specimen.imageDataUrl, screenshot);
      const pass = specimen.perceptualDiffScore <= report.thresholds.perceptualDiffScore
        && specimen.bboxDriftPx <= report.thresholds.bboxDriftPx
        && specimen.offVisiblePixels > 0
        && specimen.bakedVisiblePixels > 0;
      report.maxDiffScore = Math.max(report.maxDiffScore, specimen.diffScore);
      report.maxPerceptualDiffScore = Math.max(report.maxPerceptualDiffScore, specimen.perceptualDiffScore);
      report.maxBBoxDrift = Math.max(report.maxBBoxDrift, specimen.bboxDriftPx);
      if (pass) {
        report.passCount += 1;
      } else {
        report.failCount += 1;
      }
      report.specimens.push({
        ...specimen,
        pass,
        screenshot,
        imageDataUrl: undefined
      });
    }

    report.overall = report.failCount === 0 && report.pageErrors.length === 0 && report.consoleErrors.length === 0
      ? 'pass'
      : 'fail';
    report.finishedAt = new Date().toISOString();

    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(outputDir, 'REPORT.md'), buildPerceptualMarkdownReport(report, report.specimens));

    console.log(JSON.stringify({
      reportPath: path.join(outputDir, 'report.json'),
      overall: report.overall
    }, null, 2));
  } catch (error) {
    report.overall = 'fail';
    report.error = error?.stack || String(error);
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2));
    throw error;
  } finally {
    await page?.close?.().catch(() => {});
    await context?.close?.().catch(() => {});
    await browser?.close?.().catch(() => {});
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
