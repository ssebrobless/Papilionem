# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v1-shell-ui-smoke\2026-04-22T23-36-40-133Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 37.53 | -3.4% |
| avgRenderMs | 44.91 | 49.21 | +9.6% |
| p50FrameMs | 91.20 | 93.70 | +2.7% |
| p95FrameMs | 101.00 | 101.00 | 0.0% |
| p99FrameMs | 148.70 | 140.70 | -5.4% |
| compositeCallsPerFrame | 4.19 | 4.05 | -3.4% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 91.00 | 90.00 | -1.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 25.72 | +2.0% |
| avgRenderMs | 25.35 | 29.63 | +16.9% |
| p50FrameMs | 48.50 | 53.20 | +9.7% |
| p95FrameMs | 68.60 | 73.10 | +6.6% |
| p99FrameMs | 71.90 | 77.00 | +7.1% |
| compositeCallsPerFrame | 4.00 | 4.76 | +19.1% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 106.00 | 93.00 | -12.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 24.10 | +0.2% |
| avgRenderMs | 30.82 | 33.08 | +7.4% |
| p50FrameMs | 54.60 | 54.90 | +0.5% |
| p95FrameMs | 73.80 | 75.00 | +1.6% |
| p99FrameMs | 82.90 | 84.40 | +1.8% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 76.00 | 60.00 | -21.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 24.67 | +0.9% |
| avgRenderMs | 27.76 | 31.16 | +12.3% |
| p50FrameMs | 50.70 | 55.30 | +9.1% |
| p95FrameMs | 70.10 | 114.60 | +63.5% |
| p99FrameMs | 85.00 | 120.70 | +42.0% |
| compositeCallsPerFrame | 5.08 | 4.97 | -2.1% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 128.00 | 107.00 | -16.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 24.28 | +1.4% |
| avgRenderMs | 33.94 | 39.31 | +15.8% |
| p50FrameMs | 55.50 | 67.20 | +21.1% |
| p95FrameMs | 83.30 | 76.30 | -8.4% |
| p99FrameMs | 89.10 | 92.90 | +4.3% |
| compositeCallsPerFrame | 4.95 | 5.19 | +4.9% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 83.00 | 88.00 | +6.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
