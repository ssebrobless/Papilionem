# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\textMeasureCache\2026-04-22T21-39-52-742Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 39.52 | +1.7% |
| avgRenderMs | 44.91 | 45.25 | +0.8% |
| p50FrameMs | 91.20 | 91.10 | -0.1% |
| p95FrameMs | 101.00 | 106.90 | +5.8% |
| p99FrameMs | 148.70 | 142.20 | -4.4% |
| compositeCallsPerFrame | 4.19 | 4.17 | -0.4% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 91.00 | 94.00 | +3.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 26.30 | +4.4% |
| avgRenderMs | 25.35 | 26.52 | +4.6% |
| p50FrameMs | 48.50 | 50.50 | +4.1% |
| p95FrameMs | 68.60 | 68.90 | +0.4% |
| p99FrameMs | 71.90 | 76.00 | +5.7% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 106.00 | 102.00 | -3.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 24.06 | +0.0% |
| avgRenderMs | 30.82 | 30.92 | +0.3% |
| p50FrameMs | 54.60 | 54.60 | +0.0% |
| p95FrameMs | 73.80 | 75.50 | +2.3% |
| p99FrameMs | 82.90 | 90.10 | +8.7% |
| compositeCallsPerFrame | 4.97 | 4.91 | -1.1% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 76.00 | 76.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 26.08 | +6.6% |
| avgRenderMs | 27.76 | 30.07 | +8.3% |
| p50FrameMs | 50.70 | 55.10 | +8.7% |
| p95FrameMs | 70.10 | 74.20 | +5.8% |
| p99FrameMs | 85.00 | 90.80 | +6.8% |
| compositeCallsPerFrame | 5.08 | 5.08 | +0.1% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 128.00 | 119.00 | -7.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 24.23 | +1.2% |
| avgRenderMs | 33.94 | 33.70 | -0.7% |
| p50FrameMs | 55.50 | 62.00 | +11.7% |
| p95FrameMs | 83.30 | 72.20 | -13.3% |
| p99FrameMs | 89.10 | 85.60 | -3.9% |
| compositeCallsPerFrame | 4.95 | 4.97 | +0.4% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 83.00 | 91.00 | +9.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
