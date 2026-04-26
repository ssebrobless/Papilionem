# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-free-wins\2026-04-22T21-26-17-254Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 39.60 | +1.9% |
| avgRenderMs | 44.91 | 45.70 | +1.8% |
| p50FrameMs | 91.20 | 95.90 | +5.2% |
| p95FrameMs | 101.00 | 111.80 | +10.7% |
| p99FrameMs | 148.70 | 141.70 | -4.7% |
| compositeCallsPerFrame | 4.19 | 4.18 | -0.2% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 91.00 | 89.00 | -2.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 28.22 | +12.0% |
| avgRenderMs | 25.35 | 27.67 | +9.2% |
| p50FrameMs | 48.50 | 52.80 | +8.9% |
| p95FrameMs | 68.60 | 71.20 | +3.8% |
| p99FrameMs | 71.90 | 77.00 | +7.1% |
| compositeCallsPerFrame | 4.00 | 4.94 | +23.6% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 106.00 | 90.00 | -15.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 24.03 | -0.1% |
| avgRenderMs | 30.82 | 30.45 | -1.2% |
| p50FrameMs | 54.60 | 53.20 | -2.6% |
| p95FrameMs | 73.80 | 72.90 | -1.2% |
| p99FrameMs | 82.90 | 77.20 | -6.9% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 76.00 | 77.00 | +1.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 25.09 | +2.6% |
| avgRenderMs | 27.76 | 29.09 | +4.8% |
| p50FrameMs | 50.70 | 51.90 | +2.4% |
| p95FrameMs | 70.10 | 72.70 | +3.7% |
| p99FrameMs | 85.00 | 85.40 | +0.5% |
| compositeCallsPerFrame | 5.08 | 5.29 | +4.3% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 128.00 | 125.00 | -2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 24.16 | +0.9% |
| avgRenderMs | 33.94 | 34.21 | +0.8% |
| p50FrameMs | 55.50 | 61.80 | +11.4% |
| p95FrameMs | 83.30 | 72.10 | -13.4% |
| p99FrameMs | 89.10 | 85.60 | -3.9% |
| compositeCallsPerFrame | 4.95 | 5.34 | +7.8% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 83.00 | 93.00 | +12.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
