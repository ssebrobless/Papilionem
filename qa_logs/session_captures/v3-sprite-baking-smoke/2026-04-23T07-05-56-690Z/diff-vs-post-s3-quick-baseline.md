# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke\2026-04-23T07-05-56-690Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 40.58 | +4.5% |
| avgRenderMs | 44.91 | 41.22 | -8.2% |
| p50FrameMs | 91.20 | 86.90 | -4.7% |
| p95FrameMs | 101.00 | 96.70 | -4.3% |
| p99FrameMs | 148.70 | 125.00 | -15.9% |
| compositeCallsPerFrame | 4.19 | 3.98 | -5.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 91.00 | 99.00 | +8.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 24.71 | -2.0% |
| avgRenderMs | 25.35 | 24.89 | -1.8% |
| p50FrameMs | 48.50 | 47.80 | -1.4% |
| p95FrameMs | 68.60 | 64.60 | -5.8% |
| p99FrameMs | 71.90 | 70.80 | -1.5% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 106.00 | 107.00 | +0.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 23.49 | -2.4% |
| avgRenderMs | 30.82 | 30.11 | -2.3% |
| p50FrameMs | 54.60 | 52.60 | -3.7% |
| p95FrameMs | 73.80 | 67.70 | -8.3% |
| p99FrameMs | 82.90 | 76.60 | -7.6% |
| compositeCallsPerFrame | 4.97 | 4.98 | +0.2% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 76.00 | 78.00 | +2.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 24.95 | +2.0% |
| avgRenderMs | 27.76 | 27.21 | -2.0% |
| p50FrameMs | 50.70 | 51.40 | +1.4% |
| p95FrameMs | 70.10 | 69.90 | -0.3% |
| p99FrameMs | 85.00 | 90.60 | +6.6% |
| compositeCallsPerFrame | 5.08 | 5.14 | +1.2% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 128.00 | 124.00 | -3.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 24.44 | +2.1% |
| avgRenderMs | 33.94 | 33.22 | -2.1% |
| p50FrameMs | 55.50 | 60.30 | +8.6% |
| p95FrameMs | 83.30 | 70.90 | -14.9% |
| p99FrameMs | 89.10 | 86.90 | -2.5% |
| compositeCallsPerFrame | 4.95 | 4.99 | +0.7% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 83.00 | 86.00 | +3.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
