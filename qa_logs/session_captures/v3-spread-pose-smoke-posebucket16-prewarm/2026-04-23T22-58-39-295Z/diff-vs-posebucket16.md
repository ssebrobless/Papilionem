# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-posebucket16\2026-04-23T22-35-53-145Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-posebucket16-prewarm\2026-04-23T22-58-39-295Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 39.51 | 48.11 | +21.8% |
| avgRenderMs | 39.94 | 54.89 | +37.4% |
| p50FrameMs | 83.80 | 118.20 | +41.1% |
| p95FrameMs | 101.60 | 131.10 | +29.0% |
| p99FrameMs | 125.30 | 179.20 | +43.0% |
| compositeCallsPerFrame | 4.17 | 4.17 | -0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 103.00 | 70.00 | -32.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.10 | 36.28 | +44.6% |
| avgRenderMs | 26.56 | 39.42 | +48.4% |
| p50FrameMs | 48.60 | 73.10 | +50.4% |
| p95FrameMs | 68.00 | 100.10 | +47.2% |
| p99FrameMs | 79.70 | 104.70 | +31.4% |
| compositeCallsPerFrame | 5.30 | 5.43 | +2.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 97.00 | 68.00 | -29.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.00 | 34.51 | +50.0% |
| avgRenderMs | 29.53 | 42.48 | +43.8% |
| p50FrameMs | 51.30 | 77.50 | +51.1% |
| p95FrameMs | 67.20 | 108.30 | +61.2% |
| p99FrameMs | 75.30 | 116.10 | +54.2% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 79.00 | 55.00 | -30.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.66 | 31.32 | +32.4% |
| avgRenderMs | 26.34 | 31.99 | +21.4% |
| p50FrameMs | 49.70 | 64.70 | +30.2% |
| p95FrameMs | 66.70 | 97.50 | +46.2% |
| p99FrameMs | 71.40 | 133.00 | +86.3% |
| compositeCallsPerFrame | 5.18 | 5.00 | -3.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 131.00 | 100.00 | -23.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |
