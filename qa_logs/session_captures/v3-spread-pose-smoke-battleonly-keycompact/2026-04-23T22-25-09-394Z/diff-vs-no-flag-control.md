# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-control-no-flag-keycompact\2026-04-23T22-24-04-406Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-battleonly-keycompact\2026-04-23T22-25-09-394Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 39.65 | 38.78 | -2.2% |
| avgRenderMs | 41.20 | 42.38 | +2.8% |
| p50FrameMs | 86.40 | 88.70 | +2.7% |
| p95FrameMs | 93.40 | 95.80 | +2.6% |
| p99FrameMs | 124.20 | 126.10 | +1.5% |
| compositeCallsPerFrame | 4.17 | 4.18 | +0.2% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 99.00 | 94.00 | -5.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.58 | 25.38 | -0.8% |
| avgRenderMs | 27.23 | 26.68 | -2.0% |
| p50FrameMs | 50.10 | 49.50 | -1.2% |
| p95FrameMs | 71.20 | 69.60 | -2.2% |
| p99FrameMs | 78.60 | 76.20 | -3.1% |
| compositeCallsPerFrame | 5.30 | 5.30 | -0.1% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 96.00 | 97.00 | +1.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.53 | 23.39 | -0.6% |
| avgRenderMs | 30.66 | 30.08 | -1.9% |
| p50FrameMs | 52.20 | 51.90 | -0.6% |
| p95FrameMs | 74.10 | 72.90 | -1.6% |
| p99FrameMs | 83.40 | 84.90 | +1.8% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 77.00 | 78.00 | +1.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.41 | 24.74 | +1.3% |
| avgRenderMs | 27.25 | 27.32 | +0.3% |
| p50FrameMs | 50.90 | 51.30 | +0.8% |
| p95FrameMs | 69.80 | 68.30 | -2.1% |
| p99FrameMs | 79.20 | 75.80 | -4.3% |
| compositeCallsPerFrame | 5.21 | 5.23 | +0.4% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 128.00 | 127.00 | -0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |
