# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-battleonly-fastgate\2026-04-23T20-23-21-866Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 38.30 | -1.4% |
| avgRenderMs | 44.91 | 39.60 | -11.8% |
| p50FrameMs | 91.20 | 82.90 | -9.1% |
| p95FrameMs | 101.00 | 91.40 | -9.5% |
| p99FrameMs | 148.70 | 121.00 | -18.6% |
| compositeCallsPerFrame | 4.19 | 4.17 | -0.4% |
| peakHeapUsedMB | 124.93 | 168.80 | +35.1% |
| uiRedrawCount | 91.00 | 99.00 | +8.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 24.50 | -2.8% |
| avgRenderMs | 25.35 | 25.83 | +1.9% |
| p50FrameMs | 48.50 | 47.30 | -2.5% |
| p95FrameMs | 68.60 | 67.50 | -1.6% |
| p99FrameMs | 71.90 | 72.60 | +1.0% |
| compositeCallsPerFrame | 4.00 | 5.29 | +32.3% |
| peakHeapUsedMB | 124.93 | 168.80 | +35.1% |
| uiRedrawCount | 106.00 | 100.00 | -5.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 22.42 | -6.8% |
| avgRenderMs | 30.82 | 29.62 | -3.9% |
| p50FrameMs | 54.60 | 50.60 | -7.3% |
| p95FrameMs | 73.80 | 71.00 | -3.8% |
| p99FrameMs | 82.90 | 81.40 | -1.8% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 168.80 | +35.1% |
| uiRedrawCount | 76.00 | 82.00 | +7.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 24.37 | -0.4% |
| avgRenderMs | 27.76 | 26.06 | -6.1% |
| p50FrameMs | 50.70 | 49.20 | -3.0% |
| p95FrameMs | 70.10 | 67.70 | -3.4% |
| p99FrameMs | 85.00 | 75.20 | -11.5% |
| compositeCallsPerFrame | 5.08 | 5.14 | +1.3% |
| peakHeapUsedMB | 124.93 | 168.80 | +35.1% |
| uiRedrawCount | 128.00 | 132.00 | +3.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## travel

- missing baseline file: no
- missing candidate file: yes
