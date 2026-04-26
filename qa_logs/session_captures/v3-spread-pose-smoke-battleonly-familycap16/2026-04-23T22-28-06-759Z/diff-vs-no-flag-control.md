# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-control-no-flag-keycompact\2026-04-23T22-24-04-406Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-battleonly-familycap16\2026-04-23T22-28-06-759Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 39.65 | 37.61 | -5.1% |
| avgRenderMs | 41.20 | 46.10 | +11.9% |
| p50FrameMs | 86.40 | 94.40 | +9.3% |
| p95FrameMs | 93.40 | 104.90 | +12.3% |
| p99FrameMs | 124.20 | 133.40 | +7.4% |
| compositeCallsPerFrame | 4.17 | 4.19 | +0.6% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 99.00 | 90.00 | -9.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.58 | 25.64 | +0.2% |
| avgRenderMs | 27.23 | 27.11 | -0.4% |
| p50FrameMs | 50.10 | 49.80 | -0.6% |
| p95FrameMs | 71.20 | 71.90 | +1.0% |
| p99FrameMs | 78.60 | 75.40 | -4.1% |
| compositeCallsPerFrame | 5.30 | 5.30 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 96.00 | 96.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.53 | 23.42 | -0.4% |
| avgRenderMs | 30.66 | 30.33 | -1.1% |
| p50FrameMs | 52.20 | 52.90 | +1.3% |
| p95FrameMs | 74.10 | 68.80 | -7.2% |
| p99FrameMs | 83.40 | 76.80 | -7.9% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 77.00 | 78.00 | +1.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.41 | 24.11 | -1.2% |
| avgRenderMs | 27.25 | 27.38 | +0.5% |
| p50FrameMs | 50.90 | 50.40 | -1.0% |
| p95FrameMs | 69.80 | 67.80 | -2.9% |
| p99FrameMs | 79.20 | 73.90 | -6.7% |
| compositeCallsPerFrame | 5.21 | 5.23 | +0.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 128.00 | 129.00 | +0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |
