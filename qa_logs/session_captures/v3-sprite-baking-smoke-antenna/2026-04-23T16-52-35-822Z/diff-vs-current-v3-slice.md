# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T08-02-25-046Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-antenna\2026-04-23T16-52-35-822Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.84 | 49.57 | +27.6% |
| avgRenderMs | 39.94 | 45.66 | +14.3% |
| p50FrameMs | 83.00 | 106.80 | +28.7% |
| p95FrameMs | 89.80 | 129.00 | +43.7% |
| p99FrameMs | 121.50 | 162.80 | +34.0% |
| compositeCallsPerFrame | 4.00 | 4.27 | +6.7% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 104.00 | 75.00 | -27.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.54 | 37.15 | +51.4% |
| avgRenderMs | 24.65 | 33.50 | +35.9% |
| p50FrameMs | 47.20 | 67.70 | +43.4% |
| p95FrameMs | 65.50 | 90.70 | +38.5% |
| p99FrameMs | 72.10 | 100.50 | +39.4% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 108.00 | 77.00 | -28.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 22.78 | 33.67 | +47.8% |
| avgRenderMs | 29.94 | 37.33 | +24.7% |
| p50FrameMs | 52.20 | 69.60 | +33.3% |
| p95FrameMs | 68.80 | 100.90 | +46.7% |
| p99FrameMs | 76.40 | 109.00 | +42.7% |
| compositeCallsPerFrame | 5.00 | 4.75 | -5.1% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 79.00 | 60.00 | -24.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.72 | 32.50 | +37.0% |
| avgRenderMs | 28.25 | 33.75 | +19.5% |
| p50FrameMs | 50.60 | 65.60 | +29.6% |
| p95FrameMs | 66.20 | 87.50 | +32.2% |
| p99FrameMs | 75.50 | 102.40 | +35.6% |
| compositeCallsPerFrame | 5.29 | 5.00 | -5.5% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 129.00 | 102.00 | -20.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.86 | 31.43 | +31.7% |
| avgRenderMs | 33.07 | 39.34 | +19.0% |
| p50FrameMs | 59.40 | 73.40 | +23.6% |
| p95FrameMs | 68.80 | 90.10 | +31.0% |
| p99FrameMs | 83.90 | 109.00 | +29.9% |
| compositeCallsPerFrame | 5.06 | 5.18 | +2.4% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 88.00 | 79.00 | -10.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
