# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-control-no-flag-keycompact\2026-04-23T22-24-04-406Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-posebucket16-prewarm\2026-04-23T22-58-39-295Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 39.65 | 48.11 | +21.3% |
| avgRenderMs | 41.20 | 54.89 | +33.2% |
| p50FrameMs | 86.40 | 118.20 | +36.8% |
| p95FrameMs | 93.40 | 131.10 | +40.4% |
| p99FrameMs | 124.20 | 179.20 | +44.3% |
| compositeCallsPerFrame | 4.17 | 4.17 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 99.00 | 70.00 | -29.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.58 | 36.28 | +41.9% |
| avgRenderMs | 27.23 | 39.42 | +44.8% |
| p50FrameMs | 50.10 | 73.10 | +45.9% |
| p95FrameMs | 71.20 | 100.10 | +40.6% |
| p99FrameMs | 78.60 | 104.70 | +33.2% |
| compositeCallsPerFrame | 5.30 | 5.43 | +2.3% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 96.00 | 68.00 | -29.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.53 | 34.51 | +46.7% |
| avgRenderMs | 30.66 | 42.48 | +38.5% |
| p50FrameMs | 52.20 | 77.50 | +48.5% |
| p95FrameMs | 74.10 | 108.30 | +46.2% |
| p99FrameMs | 83.40 | 116.10 | +39.2% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 77.00 | 55.00 | -28.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.41 | 31.32 | +28.3% |
| avgRenderMs | 27.25 | 31.99 | +17.4% |
| p50FrameMs | 50.90 | 64.70 | +27.1% |
| p95FrameMs | 69.80 | 97.50 | +39.7% |
| p99FrameMs | 79.20 | 133.00 | +67.9% |
| compositeCallsPerFrame | 5.21 | 5.00 | -3.9% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 128.00 | 100.00 | -21.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |
