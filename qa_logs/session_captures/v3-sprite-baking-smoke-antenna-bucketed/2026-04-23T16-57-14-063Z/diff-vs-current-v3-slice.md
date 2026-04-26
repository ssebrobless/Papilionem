# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T08-02-25-046Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-antenna-bucketed\2026-04-23T16-57-14-063Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.84 | 47.25 | +21.6% |
| avgRenderMs | 39.94 | 45.56 | +14.1% |
| p50FrameMs | 83.00 | 105.80 | +27.5% |
| p95FrameMs | 89.80 | 138.00 | +53.7% |
| p99FrameMs | 121.50 | 168.80 | +38.9% |
| compositeCallsPerFrame | 4.00 | 4.28 | +6.9% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 104.00 | 76.00 | -26.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.54 | 33.28 | +35.6% |
| avgRenderMs | 24.65 | 31.96 | +29.7% |
| p50FrameMs | 47.20 | 61.80 | +30.9% |
| p95FrameMs | 65.50 | 86.60 | +32.2% |
| p99FrameMs | 72.10 | 93.20 | +29.3% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 108.00 | 83.00 | -23.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 22.78 | 31.08 | +36.5% |
| avgRenderMs | 29.94 | 36.60 | +22.2% |
| p50FrameMs | 52.20 | 68.60 | +31.4% |
| p95FrameMs | 68.80 | 89.70 | +30.4% |
| p99FrameMs | 76.40 | 101.00 | +32.2% |
| compositeCallsPerFrame | 5.00 | 4.51 | -9.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 79.00 | 62.00 | -21.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.72 | 29.45 | +24.1% |
| avgRenderMs | 28.25 | 31.72 | +12.3% |
| p50FrameMs | 50.60 | 60.30 | +19.2% |
| p95FrameMs | 66.20 | 80.80 | +22.1% |
| p99FrameMs | 75.50 | 96.10 | +27.3% |
| compositeCallsPerFrame | 5.29 | 4.72 | -10.8% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 129.00 | 110.00 | -14.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.86 | 31.50 | +32.0% |
| avgRenderMs | 33.07 | 39.04 | +18.1% |
| p50FrameMs | 59.40 | 70.60 | +18.9% |
| p95FrameMs | 68.80 | 91.80 | +33.4% |
| p99FrameMs | 83.90 | 109.50 | +30.5% |
| compositeCallsPerFrame | 5.06 | 5.17 | +2.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 88.00 | 89.00 | +1.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
