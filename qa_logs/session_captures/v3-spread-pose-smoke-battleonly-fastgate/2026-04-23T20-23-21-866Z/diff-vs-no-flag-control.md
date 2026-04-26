# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-control-no-flag\2026-04-23T20-26-07-521Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-battleonly-fastgate\2026-04-23T20-23-21-866Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 39.68 | 38.30 | -3.5% |
| avgRenderMs | 41.07 | 39.60 | -3.6% |
| p50FrameMs | 86.50 | 82.90 | -4.2% |
| p95FrameMs | 91.90 | 91.40 | -0.5% |
| p99FrameMs | 124.70 | 121.00 | -3.0% |
| compositeCallsPerFrame | 4.18 | 4.17 | -0.0% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 99.00 | 99.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.39 | 24.50 | +0.4% |
| avgRenderMs | 25.96 | 25.83 | -0.5% |
| p50FrameMs | 48.00 | 47.30 | -1.5% |
| p95FrameMs | 67.80 | 67.50 | -0.4% |
| p99FrameMs | 72.50 | 72.60 | +0.1% |
| compositeCallsPerFrame | 5.29 | 5.29 | 0.0% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 100.00 | 100.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.14 | 22.42 | -3.1% |
| avgRenderMs | 30.01 | 29.62 | -1.3% |
| p50FrameMs | 51.60 | 50.60 | -1.9% |
| p95FrameMs | 68.30 | 71.00 | +4.0% |
| p99FrameMs | 73.40 | 81.40 | +10.9% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 78.00 | 82.00 | +5.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.54 | 24.37 | -0.7% |
| avgRenderMs | 26.83 | 26.06 | -2.9% |
| p50FrameMs | 50.50 | 49.20 | -2.6% |
| p95FrameMs | 66.80 | 67.70 | +1.3% |
| p99FrameMs | 73.40 | 75.20 | +2.5% |
| compositeCallsPerFrame | 5.17 | 5.14 | -0.5% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 129.00 | 132.00 | +2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |
