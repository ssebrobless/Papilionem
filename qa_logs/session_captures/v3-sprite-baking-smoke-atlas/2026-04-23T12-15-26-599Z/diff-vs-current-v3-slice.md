# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T08-02-25-046Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-atlas\2026-04-23T12-15-26-599Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.84 | 41.25 | +6.2% |
| avgRenderMs | 39.94 | 41.98 | +5.1% |
| p50FrameMs | 83.00 | 87.90 | +5.9% |
| p95FrameMs | 89.80 | 100.10 | +11.5% |
| p99FrameMs | 121.50 | 132.30 | +8.9% |
| compositeCallsPerFrame | 4.00 | 4.14 | +3.6% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 104.00 | 96.00 | -7.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.54 | 26.89 | +9.6% |
| avgRenderMs | 24.65 | 26.11 | +5.9% |
| p50FrameMs | 47.20 | 51.30 | +8.7% |
| p95FrameMs | 65.50 | 67.60 | +3.2% |
| p99FrameMs | 72.10 | 78.50 | +8.9% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 108.00 | 101.00 | -6.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 22.78 | 25.33 | +11.2% |
| avgRenderMs | 29.94 | 31.06 | +3.7% |
| p50FrameMs | 52.20 | 55.80 | +6.9% |
| p95FrameMs | 68.80 | 73.70 | +7.1% |
| p99FrameMs | 76.40 | 79.50 | +4.1% |
| compositeCallsPerFrame | 5.00 | 4.89 | -2.3% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 79.00 | 73.00 | -7.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.72 | 25.22 | +6.3% |
| avgRenderMs | 28.25 | 27.31 | -3.3% |
| p50FrameMs | 50.60 | 51.90 | +2.6% |
| p95FrameMs | 66.20 | 70.70 | +6.8% |
| p99FrameMs | 75.50 | 77.60 | +2.8% |
| compositeCallsPerFrame | 5.29 | 5.09 | -3.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 129.00 | 126.00 | -2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.86 | 25.17 | +5.5% |
| avgRenderMs | 33.07 | 33.68 | +1.9% |
| p50FrameMs | 59.40 | 62.70 | +5.6% |
| p95FrameMs | 68.80 | 71.20 | +3.5% |
| p99FrameMs | 83.90 | 85.20 | +1.5% |
| compositeCallsPerFrame | 5.06 | 4.87 | -3.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 88.00 | 84.00 | -4.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
