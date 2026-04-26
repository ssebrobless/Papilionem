# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T22-11-18-179Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v2-full-proof\2026-04-23T05-37-30-766Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 36.98 | 37.83 | +2.3% |
| avgRenderMs | 43.52 | 41.40 | -4.9% |
| p50FrameMs | 89.80 | 88.70 | -1.2% |
| p95FrameMs | 99.80 | 96.30 | -3.5% |
| p99FrameMs | 141.50 | 141.60 | +0.1% |
| compositeCallsPerFrame | 4.24 | 4.30 | +1.4% |
| peakHeapUsedMB | 168.80 | 149.73 | -11.3% |
| uiRedrawCount | 2318.00 | 2369.00 | +2.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.17 | 28.99 | +20.0% |
| avgRenderMs | 24.58 | 25.43 | +3.5% |
| p50FrameMs | 48.50 | 52.80 | +8.9% |
| p95FrameMs | 67.10 | 68.50 | +2.1% |
| p99FrameMs | 74.60 | 76.70 | +2.8% |
| compositeCallsPerFrame | 4.67 | 4.70 | +0.8% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 5149.00 | 5078.00 | -1.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | simulation-dominant | mixed -> simulation-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.73 | 24.26 | -5.7% |
| avgRenderMs | 32.08 | 32.46 | +1.2% |
| p50FrameMs | 63.70 | 61.20 | -3.9% |
| p95FrameMs | 72.10 | 70.90 | -1.7% |
| p99FrameMs | 86.40 | 87.40 | +1.2% |
| compositeCallsPerFrame | 4.59 | 4.71 | +2.7% |
| peakHeapUsedMB | 168.80 | 149.73 | -11.3% |
| uiRedrawCount | 7275.00 | 6673.00 | -8.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.34 | 30.32 | +15.1% |
| avgRenderMs | 27.56 | 27.12 | -1.6% |
| p50FrameMs | 53.10 | 53.20 | +0.2% |
| p95FrameMs | 71.60 | 68.30 | -4.6% |
| p99FrameMs | 77.40 | 76.70 | -0.9% |
| compositeCallsPerFrame | 4.68 | 4.81 | +2.7% |
| peakHeapUsedMB | 272.75 | 256.54 | -5.9% |
| uiRedrawCount | 18526.00 | 18413.00 | -0.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.54 | 25.42 | -0.5% |
| avgRenderMs | 35.08 | 36.82 | +5.0% |
| p50FrameMs | 62.60 | 64.70 | +3.4% |
| p95FrameMs | 74.00 | 74.60 | +0.8% |
| p99FrameMs | 88.10 | 92.50 | +5.0% |
| compositeCallsPerFrame | 5.08 | 5.02 | -1.3% |
| peakHeapUsedMB | 168.80 | 149.73 | -11.3% |
| uiRedrawCount | 4268.00 | 4179.00 | -2.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
