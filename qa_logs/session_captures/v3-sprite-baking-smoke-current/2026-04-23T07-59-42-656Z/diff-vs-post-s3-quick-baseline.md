# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T07-59-42-656Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 43.21 | +11.2% |
| avgRenderMs | 44.91 | 43.27 | -3.7% |
| p50FrameMs | 91.20 | 93.30 | +2.3% |
| p95FrameMs | 101.00 | 107.60 | +6.5% |
| p99FrameMs | 148.70 | 137.80 | -7.3% |
| compositeCallsPerFrame | 4.19 | 4.29 | +2.4% |
| peakHeapUsedMB | 124.93 | 179.29 | +43.5% |
| uiRedrawCount | 91.00 | 88.00 | -3.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 34.55 | +37.1% |
| avgRenderMs | 25.35 | 33.44 | +31.9% |
| p50FrameMs | 48.50 | 64.30 | +32.6% |
| p95FrameMs | 68.60 | 90.90 | +32.5% |
| p99FrameMs | 71.90 | 96.60 | +34.4% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 124.93 | 179.29 | +43.5% |
| uiRedrawCount | 106.00 | 80.00 | -24.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 31.10 | +29.3% |
| avgRenderMs | 30.82 | 39.13 | +27.0% |
| p50FrameMs | 54.60 | 70.20 | +28.6% |
| p95FrameMs | 73.80 | 94.60 | +28.2% |
| p99FrameMs | 82.90 | 104.60 | +26.2% |
| compositeCallsPerFrame | 4.97 | 4.43 | -10.8% |
| peakHeapUsedMB | 124.93 | 179.29 | +43.5% |
| uiRedrawCount | 76.00 | 61.00 | -19.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 25.68 | +5.0% |
| avgRenderMs | 27.76 | 27.03 | -2.6% |
| p50FrameMs | 50.70 | 51.10 | +0.8% |
| p95FrameMs | 70.10 | 70.50 | +0.6% |
| p99FrameMs | 85.00 | 87.60 | +3.1% |
| compositeCallsPerFrame | 5.08 | 4.89 | -3.7% |
| peakHeapUsedMB | 124.93 | 179.29 | +43.5% |
| uiRedrawCount | 128.00 | 127.00 | -0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 30.54 | +27.6% |
| avgRenderMs | 33.94 | 40.32 | +18.8% |
| p50FrameMs | 55.50 | 69.50 | +25.2% |
| p95FrameMs | 83.30 | 92.70 | +11.3% |
| p99FrameMs | 89.10 | 98.10 | +10.1% |
| compositeCallsPerFrame | 4.95 | 5.17 | +4.4% |
| peakHeapUsedMB | 124.93 | 179.29 | +43.5% |
| uiRedrawCount | 83.00 | 89.00 | +7.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
