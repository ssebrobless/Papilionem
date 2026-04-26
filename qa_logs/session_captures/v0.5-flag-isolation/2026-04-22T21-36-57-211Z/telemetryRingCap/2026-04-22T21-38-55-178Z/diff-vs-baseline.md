# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\telemetryRingCap\2026-04-22T21-38-55-178Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 40.39 | +4.0% |
| avgRenderMs | 44.91 | 44.92 | +0.0% |
| p50FrameMs | 91.20 | 92.90 | +1.9% |
| p95FrameMs | 101.00 | 118.10 | +16.9% |
| p99FrameMs | 148.70 | 137.60 | -7.5% |
| compositeCallsPerFrame | 4.19 | 4.07 | -2.9% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 91.00 | 89.00 | -2.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 25.69 | +1.9% |
| avgRenderMs | 25.35 | 25.68 | +1.3% |
| p50FrameMs | 48.50 | 48.80 | +0.6% |
| p95FrameMs | 68.60 | 68.20 | -0.6% |
| p99FrameMs | 71.90 | 76.70 | +6.7% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 106.00 | 104.00 | -1.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 24.23 | +0.7% |
| avgRenderMs | 30.82 | 31.17 | +1.1% |
| p50FrameMs | 54.60 | 55.00 | +0.7% |
| p95FrameMs | 73.80 | 72.00 | -2.4% |
| p99FrameMs | 82.90 | 77.60 | -6.4% |
| compositeCallsPerFrame | 4.97 | 4.92 | -0.9% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 76.00 | 75.00 | -1.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 25.09 | +2.6% |
| avgRenderMs | 27.76 | 26.94 | -2.9% |
| p50FrameMs | 50.70 | 52.20 | +3.0% |
| p95FrameMs | 70.10 | 73.10 | +4.3% |
| p99FrameMs | 85.00 | 86.30 | +1.5% |
| compositeCallsPerFrame | 5.08 | 5.04 | -0.7% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 128.00 | 125.00 | -2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 25.33 | +5.8% |
| avgRenderMs | 33.94 | 33.98 | +0.1% |
| p50FrameMs | 55.50 | 63.10 | +13.7% |
| p95FrameMs | 83.30 | 72.10 | -13.4% |
| p99FrameMs | 89.10 | 85.60 | -3.9% |
| compositeCallsPerFrame | 4.95 | 4.90 | -1.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 83.00 | 82.00 | -1.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
