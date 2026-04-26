# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T22-11-18-179Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v1-shell-ui-smoke\2026-04-23T04-16-03-452Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 36.98 | 38.58 | +4.3% |
| avgRenderMs | 43.52 | 41.91 | -3.7% |
| p50FrameMs | 89.80 | 89.10 | -0.8% |
| p95FrameMs | 99.80 | 105.00 | +5.2% |
| p99FrameMs | 141.50 | 134.90 | -4.7% |
| compositeCallsPerFrame | 4.24 | 4.21 | -0.7% |
| peakHeapUsedMB | 168.80 | 124.93 | -26.0% |
| uiRedrawCount | 2318.00 | 90.00 | -96.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.17 | 25.13 | +4.0% |
| avgRenderMs | 24.58 | 25.20 | +2.5% |
| p50FrameMs | 48.50 | 48.50 | 0.0% |
| p95FrameMs | 67.10 | 67.70 | +0.9% |
| p99FrameMs | 74.60 | 72.80 | -2.4% |
| compositeCallsPerFrame | 4.67 | 4.00 | -14.3% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 5149.00 | 106.00 | -97.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.73 | 23.69 | -7.9% |
| avgRenderMs | 32.08 | 26.07 | -18.7% |
| p50FrameMs | 63.70 | 47.60 | -25.3% |
| p95FrameMs | 72.10 | 57.00 | -20.9% |
| p99FrameMs | 86.40 | 67.80 | -21.5% |
| compositeCallsPerFrame | 4.59 | 4.96 | +8.2% |
| peakHeapUsedMB | 168.80 | 124.93 | -26.0% |
| uiRedrawCount | 7275.00 | 22.00 | -99.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.34 | 23.81 | -9.6% |
| avgRenderMs | 27.56 | 28.45 | +3.2% |
| p50FrameMs | 53.10 | 51.10 | -3.8% |
| p95FrameMs | 71.60 | 68.10 | -4.9% |
| p99FrameMs | 77.40 | 73.50 | -5.0% |
| compositeCallsPerFrame | 4.68 | 5.24 | +11.8% |
| peakHeapUsedMB | 272.75 | 124.93 | -54.2% |
| uiRedrawCount | 18526.00 | 127.00 | -99.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.54 | 23.92 | -6.3% |
| avgRenderMs | 35.08 | 25.73 | -26.6% |
| p50FrameMs | 62.60 | 48.00 | -23.3% |
| p95FrameMs | 74.00 | 58.40 | -21.1% |
| p99FrameMs | 88.10 | 69.90 | -20.7% |
| compositeCallsPerFrame | 5.08 | 5.08 | -0.1% |
| peakHeapUsedMB | 168.80 | 124.93 | -26.0% |
| uiRedrawCount | 4268.00 | 28.00 | -99.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |
