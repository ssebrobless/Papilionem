# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T00-52-16-156Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-free-wins\2026-04-22T21-26-17-254Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 39.01 | 39.60 | +1.5% |
| avgRenderMs | 48.02 | 45.70 | -4.8% |
| p50FrameMs | 96.60 | 95.90 | -0.7% |
| p95FrameMs | 108.90 | 111.80 | +2.7% |
| p99FrameMs | 139.30 | 141.70 | +1.7% |
| compositeCallsPerFrame | 4.34 | 4.18 | -3.5% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 84.00 | 89.00 | +6.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.40 | 28.22 | +6.9% |
| avgRenderMs | 28.94 | 27.67 | -4.4% |
| p50FrameMs | 52.90 | 52.80 | -0.2% |
| p95FrameMs | 74.40 | 71.20 | -4.3% |
| p99FrameMs | 78.70 | 77.00 | -2.2% |
| compositeCallsPerFrame | 4.00 | 4.94 | +23.6% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 96.00 | 90.00 | -6.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.34 | 24.03 | -5.2% |
| avgRenderMs | 34.55 | 30.45 | -11.8% |
| p50FrameMs | 58.80 | 53.20 | -9.5% |
| p95FrameMs | 85.00 | 72.90 | -14.2% |
| p99FrameMs | 92.30 | 77.20 | -16.4% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 68.00 | 77.00 | +13.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.43 | 25.09 | -1.3% |
| avgRenderMs | 29.08 | 29.09 | +0.0% |
| p50FrameMs | 52.50 | 51.90 | -1.1% |
| p95FrameMs | 74.90 | 72.70 | -2.9% |
| p99FrameMs | 94.40 | 85.40 | -9.5% |
| compositeCallsPerFrame | 5.07 | 5.29 | +4.3% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 121.00 | 125.00 | +3.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.57 | 24.16 | -1.7% |
| avgRenderMs | 37.11 | 34.21 | -7.8% |
| p50FrameMs | 67.10 | 61.80 | -7.9% |
| p95FrameMs | 75.30 | 72.10 | -4.2% |
| p99FrameMs | 78.40 | 85.60 | +9.2% |
| compositeCallsPerFrame | 5.16 | 5.34 | +3.5% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 54.00 | 93.00 | +72.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
