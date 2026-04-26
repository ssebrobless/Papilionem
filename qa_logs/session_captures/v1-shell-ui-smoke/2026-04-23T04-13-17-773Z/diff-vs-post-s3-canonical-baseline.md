# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T22-11-18-179Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v1-shell-ui-smoke\2026-04-23T04-13-17-773Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 36.98 | 39.39 | +6.5% |
| avgRenderMs | 43.52 | 42.38 | -2.6% |
| p50FrameMs | 89.80 | 92.40 | +2.9% |
| p95FrameMs | 99.80 | 103.50 | +3.7% |
| p99FrameMs | 141.50 | 134.30 | -5.1% |
| compositeCallsPerFrame | 4.24 | 4.12 | -2.8% |
| peakHeapUsedMB | 168.80 | 124.93 | -26.0% |
| uiRedrawCount | 2318.00 | 85.00 | -96.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.17 | 26.07 | +7.9% |
| avgRenderMs | 24.58 | 26.13 | +6.3% |
| p50FrameMs | 48.50 | 50.70 | +4.5% |
| p95FrameMs | 67.10 | 71.00 | +5.8% |
| p99FrameMs | 74.60 | 75.30 | +0.9% |
| compositeCallsPerFrame | 4.67 | 4.00 | -14.3% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 5149.00 | 102.00 | -98.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.73 | 24.54 | -4.6% |
| avgRenderMs | 32.08 | 27.62 | -13.9% |
| p50FrameMs | 63.70 | 51.10 | -19.8% |
| p95FrameMs | 72.10 | 67.50 | -6.4% |
| p99FrameMs | 86.40 | 75.80 | -12.3% |
| compositeCallsPerFrame | 4.59 | 4.89 | +6.5% |
| peakHeapUsedMB | 168.80 | 124.93 | -26.0% |
| uiRedrawCount | 7275.00 | 21.00 | -99.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.34 | 25.33 | -3.8% |
| avgRenderMs | 27.56 | 28.46 | +3.3% |
| p50FrameMs | 53.10 | 52.60 | -0.9% |
| p95FrameMs | 71.60 | 75.80 | +5.9% |
| p99FrameMs | 77.40 | 87.40 | +12.9% |
| compositeCallsPerFrame | 4.68 | 5.11 | +9.1% |
| peakHeapUsedMB | 272.75 | 124.93 | -54.2% |
| uiRedrawCount | 18526.00 | 122.00 | -99.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.54 | 24.61 | -3.6% |
| avgRenderMs | 35.08 | 26.82 | -23.5% |
| p50FrameMs | 62.60 | 49.50 | -20.9% |
| p95FrameMs | 74.00 | 70.20 | -5.1% |
| p99FrameMs | 88.10 | 71.90 | -18.4% |
| compositeCallsPerFrame | 5.08 | 4.90 | -3.5% |
| peakHeapUsedMB | 168.80 | 124.93 | -26.0% |
| uiRedrawCount | 4268.00 | 28.00 | -99.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |
