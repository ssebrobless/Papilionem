# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T22-11-18-179Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v8a-runtime-proof\2026-04-26T02-19-35-305Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 36.98 | 16.98 | -54.1% |
| avgRenderMs | 43.52 | 22.70 | -47.8% |
| p50FrameMs | 89.80 | 42.10 | -53.1% |
| p95FrameMs | 99.80 | 61.30 | -38.6% |
| p99FrameMs | 141.50 | 104.70 | -26.0% |
| compositeCallsPerFrame | 4.24 | 5.01 | +18.2% |
| peakHeapUsedMB | 168.80 | 214.58 | +27.1% |
| uiRedrawCount | 2318.00 | 2843.00 | +22.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.17 | 9.20 | -61.9% |
| avgRenderMs | 24.58 | 12.14 | -50.6% |
| p50FrameMs | 48.50 | 19.70 | -59.4% |
| p95FrameMs | 67.10 | 26.10 | -61.1% |
| p99FrameMs | 74.60 | 28.20 | -62.2% |
| compositeCallsPerFrame | 4.67 | 5.65 | +21.2% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 5149.00 | 3119.00 | -39.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.73 | 7.01 | -72.7% |
| avgRenderMs | 32.08 | 12.55 | -60.9% |
| p50FrameMs | 63.70 | 20.50 | -67.8% |
| p95FrameMs | 72.10 | 26.60 | -63.1% |
| p99FrameMs | 86.40 | 29.00 | -66.4% |
| compositeCallsPerFrame | 4.59 | 5.74 | +25.2% |
| peakHeapUsedMB | 168.80 | 214.58 | +27.1% |
| uiRedrawCount | 7275.00 | 3211.00 | -55.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.34 | 6.94 | -73.6% |
| avgRenderMs | 27.56 | 13.10 | -52.5% |
| p50FrameMs | 53.10 | 19.90 | -62.5% |
| p95FrameMs | 71.60 | 27.40 | -61.7% |
| p99FrameMs | 77.40 | 30.20 | -61.0% |
| compositeCallsPerFrame | 4.68 | 5.80 | +23.8% |
| peakHeapUsedMB | 272.75 | 326.16 | +19.6% |
| uiRedrawCount | 18526.00 | 11319.00 | -38.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.54 | 12.82 | -49.8% |
| avgRenderMs | 35.08 | 13.38 | -61.9% |
| p50FrameMs | 62.60 | 22.70 | -63.7% |
| p95FrameMs | 74.00 | 30.10 | -59.3% |
| p99FrameMs | 88.10 | 33.90 | -61.5% |
| compositeCallsPerFrame | 5.08 | 6.11 | +20.3% |
| peakHeapUsedMB | 168.80 | 214.58 | +27.1% |
| uiRedrawCount | 4268.00 | 2852.00 | -33.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |
