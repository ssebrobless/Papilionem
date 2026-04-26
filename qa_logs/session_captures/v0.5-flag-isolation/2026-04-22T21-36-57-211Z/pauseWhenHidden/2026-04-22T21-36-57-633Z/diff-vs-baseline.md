# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\pauseWhenHidden\2026-04-22T21-36-57-633Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 41.75 | +7.5% |
| avgRenderMs | 44.91 | 48.53 | +8.1% |
| p50FrameMs | 91.20 | 101.60 | +11.4% |
| p95FrameMs | 101.00 | 131.80 | +30.5% |
| p99FrameMs | 148.70 | 150.00 | +0.9% |
| compositeCallsPerFrame | 4.19 | 4.20 | +0.2% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 91.00 | 82.00 | -9.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 24.77 | -1.7% |
| avgRenderMs | 25.35 | 25.22 | -0.5% |
| p50FrameMs | 48.50 | 47.40 | -2.3% |
| p95FrameMs | 68.60 | 67.00 | -2.3% |
| p99FrameMs | 71.90 | 71.30 | -0.8% |
| compositeCallsPerFrame | 4.00 | 4.98 | +24.5% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 106.00 | 101.00 | -4.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 23.41 | -2.7% |
| avgRenderMs | 30.82 | 30.62 | -0.6% |
| p50FrameMs | 54.60 | 53.40 | -2.2% |
| p95FrameMs | 73.80 | 70.80 | -4.1% |
| p99FrameMs | 82.90 | 78.60 | -5.2% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 76.00 | 78.00 | +2.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 25.05 | +2.4% |
| avgRenderMs | 27.76 | 27.28 | -1.7% |
| p50FrameMs | 50.70 | 53.00 | +4.5% |
| p95FrameMs | 70.10 | 72.20 | +3.0% |
| p99FrameMs | 85.00 | 81.30 | -4.4% |
| compositeCallsPerFrame | 5.08 | 5.10 | +0.5% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 128.00 | 123.00 | -3.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 24.79 | +3.6% |
| avgRenderMs | 33.94 | 34.78 | +2.5% |
| p50FrameMs | 55.50 | 62.70 | +13.0% |
| p95FrameMs | 83.30 | 72.10 | -13.4% |
| p99FrameMs | 89.10 | 89.70 | +0.7% |
| compositeCallsPerFrame | 4.95 | 5.18 | +4.6% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 83.00 | 87.00 | +4.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
