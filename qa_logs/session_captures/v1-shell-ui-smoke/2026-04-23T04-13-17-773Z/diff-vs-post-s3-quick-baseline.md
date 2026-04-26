# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v1-shell-ui-smoke\2026-04-23T04-13-17-773Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 39.39 | +1.4% |
| avgRenderMs | 44.91 | 42.38 | -5.6% |
| p50FrameMs | 91.20 | 92.40 | +1.3% |
| p95FrameMs | 101.00 | 103.50 | +2.5% |
| p99FrameMs | 148.70 | 134.30 | -9.7% |
| compositeCallsPerFrame | 4.19 | 4.12 | -1.7% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 91.00 | 85.00 | -6.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 26.07 | +3.4% |
| avgRenderMs | 25.35 | 26.13 | +3.1% |
| p50FrameMs | 48.50 | 50.70 | +4.5% |
| p95FrameMs | 68.60 | 71.00 | +3.5% |
| p99FrameMs | 71.90 | 75.30 | +4.7% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 106.00 | 102.00 | -3.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 24.54 | +2.0% |
| avgRenderMs | 30.82 | 27.62 | -10.4% |
| p50FrameMs | 54.60 | 51.10 | -6.4% |
| p95FrameMs | 73.80 | 67.50 | -8.5% |
| p99FrameMs | 82.90 | 75.80 | -8.6% |
| compositeCallsPerFrame | 4.97 | 4.89 | -1.6% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 76.00 | 21.00 | -72.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 25.33 | +3.6% |
| avgRenderMs | 27.76 | 28.46 | +2.5% |
| p50FrameMs | 50.70 | 52.60 | +3.7% |
| p95FrameMs | 70.10 | 75.80 | +8.1% |
| p99FrameMs | 85.00 | 87.40 | +2.8% |
| compositeCallsPerFrame | 5.08 | 5.11 | +0.7% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 128.00 | 122.00 | -4.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 24.61 | +2.8% |
| avgRenderMs | 33.94 | 26.82 | -21.0% |
| p50FrameMs | 55.50 | 49.50 | -10.8% |
| p95FrameMs | 83.30 | 70.20 | -15.7% |
| p99FrameMs | 89.10 | 71.90 | -19.3% |
| compositeCallsPerFrame | 4.95 | 4.90 | -1.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 83.00 | 28.00 | -66.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |
