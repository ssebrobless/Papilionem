# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-25T23-12-54-825Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 18.82 | -51.6% |
| avgRenderMs | 44.91 | 24.72 | -45.0% |
| p50FrameMs | 91.20 | 52.10 | -42.9% |
| p95FrameMs | 101.00 | 60.60 | -40.0% |
| p99FrameMs | 148.70 | 91.80 | -38.3% |
| compositeCallsPerFrame | 4.19 | 3.63 | -13.5% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 91.00 | 131.00 | +44.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 6.56 | -74.0% |
| avgRenderMs | 25.35 | 12.75 | -49.7% |
| p50FrameMs | 48.50 | 19.60 | -59.6% |
| p95FrameMs | 68.60 | 24.50 | -64.3% |
| p99FrameMs | 71.90 | 25.70 | -64.3% |
| compositeCallsPerFrame | 4.00 | 6.16 | +54.1% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 106.00 | 22.00 | -79.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 9.41 | -60.9% |
| avgRenderMs | 30.82 | 13.97 | -54.7% |
| p50FrameMs | 54.60 | 23.40 | -57.1% |
| p95FrameMs | 73.80 | 29.50 | -60.0% |
| p99FrameMs | 82.90 | 30.50 | -63.2% |
| compositeCallsPerFrame | 4.97 | 6.00 | +20.8% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 76.00 | 33.00 | -56.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 10.54 | -56.9% |
| avgRenderMs | 27.76 | 13.34 | -51.9% |
| p50FrameMs | 50.70 | 22.60 | -55.4% |
| p95FrameMs | 70.10 | 39.40 | -43.8% |
| p99FrameMs | 85.00 | 44.90 | -47.2% |
| compositeCallsPerFrame | 5.08 | 5.85 | +15.3% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 128.00 | 75.00 | -41.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 7.48 | -68.7% |
| avgRenderMs | 33.94 | 12.29 | -63.8% |
| p50FrameMs | 55.50 | 20.50 | -63.1% |
| p95FrameMs | 83.30 | 26.80 | -67.8% |
| p99FrameMs | 89.10 | 30.50 | -65.8% |
| compositeCallsPerFrame | 4.95 | 5.87 | +18.6% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 83.00 | 56.00 | -32.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |
