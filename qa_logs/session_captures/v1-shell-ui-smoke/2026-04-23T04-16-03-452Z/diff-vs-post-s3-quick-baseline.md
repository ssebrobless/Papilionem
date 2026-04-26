# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v1-shell-ui-smoke\2026-04-23T04-16-03-452Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 38.58 | -0.7% |
| avgRenderMs | 44.91 | 41.91 | -6.7% |
| p50FrameMs | 91.20 | 89.10 | -2.3% |
| p95FrameMs | 101.00 | 105.00 | +4.0% |
| p99FrameMs | 148.70 | 134.90 | -9.3% |
| compositeCallsPerFrame | 4.19 | 4.21 | +0.4% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 91.00 | 90.00 | -1.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 25.13 | -0.3% |
| avgRenderMs | 25.35 | 25.20 | -0.6% |
| p50FrameMs | 48.50 | 48.50 | 0.0% |
| p95FrameMs | 68.60 | 67.70 | -1.3% |
| p99FrameMs | 71.90 | 72.80 | +1.3% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 106.00 | 106.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 23.69 | -1.5% |
| avgRenderMs | 30.82 | 26.07 | -15.4% |
| p50FrameMs | 54.60 | 47.60 | -12.8% |
| p95FrameMs | 73.80 | 57.00 | -22.8% |
| p99FrameMs | 82.90 | 67.80 | -18.2% |
| compositeCallsPerFrame | 4.97 | 4.96 | -0.1% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 76.00 | 22.00 | -71.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 23.81 | -2.7% |
| avgRenderMs | 27.76 | 28.45 | +2.5% |
| p50FrameMs | 50.70 | 51.10 | +0.8% |
| p95FrameMs | 70.10 | 68.10 | -2.9% |
| p99FrameMs | 85.00 | 73.50 | -13.5% |
| compositeCallsPerFrame | 5.08 | 5.24 | +3.2% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 128.00 | 127.00 | -0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 23.92 | -0.1% |
| avgRenderMs | 33.94 | 25.73 | -24.2% |
| p50FrameMs | 55.50 | 48.00 | -13.5% |
| p95FrameMs | 83.30 | 58.40 | -29.9% |
| p99FrameMs | 89.10 | 69.90 | -21.5% |
| compositeCallsPerFrame | 4.95 | 5.08 | +2.5% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 83.00 | 28.00 | -66.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |
