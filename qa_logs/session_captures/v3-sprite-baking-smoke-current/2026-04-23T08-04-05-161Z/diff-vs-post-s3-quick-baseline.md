# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T08-04-05-161Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 37.98 | -2.2% |
| avgRenderMs | 44.91 | 53.73 | +19.7% |
| p50FrameMs | 91.20 | 112.50 | +23.4% |
| p95FrameMs | 101.00 | 131.20 | +29.9% |
| p99FrameMs | 148.70 | 151.40 | +1.8% |
| compositeCallsPerFrame | 4.19 | 4.22 | +0.6% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 91.00 | 80.00 | -12.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 25.50 | +1.2% |
| avgRenderMs | 25.35 | 25.40 | +0.2% |
| p50FrameMs | 48.50 | 48.70 | +0.4% |
| p95FrameMs | 68.60 | 67.40 | -1.7% |
| p99FrameMs | 71.90 | 75.40 | +4.9% |
| compositeCallsPerFrame | 4.00 | 4.98 | +24.5% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 106.00 | 99.00 | -6.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 24.00 | -0.2% |
| avgRenderMs | 30.82 | 30.34 | -1.6% |
| p50FrameMs | 54.60 | 54.00 | -1.1% |
| p95FrameMs | 73.80 | 71.50 | -3.1% |
| p99FrameMs | 82.90 | 77.60 | -6.4% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 76.00 | 76.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 25.19 | +3.0% |
| avgRenderMs | 27.76 | 27.19 | -2.0% |
| p50FrameMs | 50.70 | 51.40 | +1.4% |
| p95FrameMs | 70.10 | 69.30 | -1.1% |
| p99FrameMs | 85.00 | 83.00 | -2.4% |
| compositeCallsPerFrame | 5.08 | 5.07 | -0.2% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 128.00 | 127.00 | -0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 24.05 | +0.5% |
| avgRenderMs | 33.94 | 32.79 | -3.4% |
| p50FrameMs | 55.50 | 59.80 | +7.7% |
| p95FrameMs | 83.30 | 69.60 | -16.4% |
| p99FrameMs | 89.10 | 82.20 | -7.7% |
| compositeCallsPerFrame | 4.95 | 5.23 | +5.6% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 83.00 | 85.00 | +2.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
