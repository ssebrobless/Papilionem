# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T08-04-05-161Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke\2026-04-23T18-26-56-333Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 37.98 | 39.54 | +4.1% |
| avgRenderMs | 53.73 | 41.74 | -22.3% |
| p50FrameMs | 112.50 | 87.60 | -22.1% |
| p95FrameMs | 131.20 | 99.20 | -24.4% |
| p99FrameMs | 151.40 | 127.70 | -15.7% |
| compositeCallsPerFrame | 4.22 | 4.17 | -1.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 80.00 | 95.00 | +18.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.50 | 25.28 | -0.9% |
| avgRenderMs | 25.40 | 28.70 | +13.0% |
| p50FrameMs | 48.70 | 51.70 | +6.2% |
| p95FrameMs | 67.40 | 69.70 | +3.4% |
| p99FrameMs | 75.40 | 78.70 | +4.4% |
| compositeCallsPerFrame | 4.98 | 5.31 | +6.6% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 99.00 | 94.00 | -5.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.00 | 23.47 | -2.2% |
| avgRenderMs | 30.34 | 31.71 | +4.5% |
| p50FrameMs | 54.00 | 54.40 | +0.7% |
| p95FrameMs | 71.50 | 71.50 | +0.0% |
| p99FrameMs | 77.60 | 77.20 | -0.5% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 76.00 | 76.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.19 | 24.28 | -3.6% |
| avgRenderMs | 27.19 | 29.79 | +9.5% |
| p50FrameMs | 51.40 | 53.20 | +3.5% |
| p95FrameMs | 69.30 | 68.10 | -1.7% |
| p99FrameMs | 83.00 | 78.60 | -5.3% |
| compositeCallsPerFrame | 5.07 | 5.27 | +4.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 127.00 | 125.00 | -1.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## travel

- missing baseline file: no
- missing candidate file: yes
