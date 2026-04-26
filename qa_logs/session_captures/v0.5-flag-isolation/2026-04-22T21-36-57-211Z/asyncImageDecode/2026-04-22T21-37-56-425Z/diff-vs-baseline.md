# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\asyncImageDecode\2026-04-22T21-37-56-425Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 38.63 | -0.6% |
| avgRenderMs | 44.91 | 44.16 | -1.7% |
| p50FrameMs | 91.20 | 89.20 | -2.2% |
| p95FrameMs | 101.00 | 96.80 | -4.2% |
| p99FrameMs | 148.70 | 131.40 | -11.6% |
| compositeCallsPerFrame | 4.19 | 4.17 | -0.4% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 91.00 | 94.00 | +3.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 27.76 | +10.1% |
| avgRenderMs | 25.35 | 27.27 | +7.6% |
| p50FrameMs | 48.50 | 52.60 | +8.5% |
| p95FrameMs | 68.60 | 75.10 | +9.5% |
| p99FrameMs | 71.90 | 79.10 | +10.0% |
| compositeCallsPerFrame | 4.00 | 5.00 | +25.0% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 106.00 | 92.00 | -13.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 25.29 | +5.2% |
| avgRenderMs | 30.82 | 32.40 | +5.1% |
| p50FrameMs | 54.60 | 58.40 | +7.0% |
| p95FrameMs | 73.80 | 77.90 | +5.6% |
| p99FrameMs | 82.90 | 85.50 | +3.1% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 76.00 | 72.00 | -5.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 24.12 | -1.4% |
| avgRenderMs | 27.76 | 27.18 | -2.1% |
| p50FrameMs | 50.70 | 50.40 | -0.6% |
| p95FrameMs | 70.10 | 67.10 | -4.3% |
| p99FrameMs | 85.00 | 72.50 | -14.7% |
| compositeCallsPerFrame | 5.08 | 5.19 | +2.3% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 128.00 | 130.00 | +1.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 24.51 | +2.4% |
| avgRenderMs | 33.94 | 34.27 | +1.0% |
| p50FrameMs | 55.50 | 62.10 | +11.9% |
| p95FrameMs | 83.30 | 84.00 | +0.8% |
| p99FrameMs | 89.10 | 89.80 | +0.8% |
| compositeCallsPerFrame | 4.95 | 5.32 | +7.4% |
| peakHeapUsedMB | 124.93 | 124.93 | 0.0% |
| uiRedrawCount | 83.00 | 85.00 | +2.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
