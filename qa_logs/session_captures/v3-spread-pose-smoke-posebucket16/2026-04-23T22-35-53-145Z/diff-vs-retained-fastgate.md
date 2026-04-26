# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-battleonly-fastgate\2026-04-23T20-23-21-866Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-posebucket16\2026-04-23T22-35-53-145Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.30 | 39.51 | +3.2% |
| avgRenderMs | 39.60 | 39.94 | +0.9% |
| p50FrameMs | 82.90 | 83.80 | +1.1% |
| p95FrameMs | 91.40 | 101.60 | +11.2% |
| p99FrameMs | 121.00 | 125.30 | +3.6% |
| compositeCallsPerFrame | 4.17 | 4.17 | -0.1% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 99.00 | 103.00 | +4.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.50 | 25.10 | +2.5% |
| avgRenderMs | 25.83 | 26.56 | +2.8% |
| p50FrameMs | 47.30 | 48.60 | +2.7% |
| p95FrameMs | 67.50 | 68.00 | +0.7% |
| p99FrameMs | 72.60 | 79.70 | +9.8% |
| compositeCallsPerFrame | 5.29 | 5.30 | +0.2% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 100.00 | 97.00 | -3.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 22.42 | 23.00 | +2.6% |
| avgRenderMs | 29.62 | 29.53 | -0.3% |
| p50FrameMs | 50.60 | 51.30 | +1.4% |
| p95FrameMs | 71.00 | 67.20 | -5.4% |
| p99FrameMs | 81.40 | 75.30 | -7.5% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 82.00 | 79.00 | -3.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.37 | 23.66 | -2.9% |
| avgRenderMs | 26.06 | 26.34 | +1.1% |
| p50FrameMs | 49.20 | 49.70 | +1.0% |
| p95FrameMs | 67.70 | 66.70 | -1.5% |
| p99FrameMs | 75.20 | 71.40 | -5.1% |
| compositeCallsPerFrame | 5.14 | 5.18 | +0.7% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 132.00 | 131.00 | -0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |
