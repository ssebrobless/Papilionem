# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-control-no-flag-post-scheduler\2026-04-23T23-39-29-898Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-sim-cadence-post-scheduler\2026-04-23T23-40-24-390Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 42.78 | 42.30 | -1.1% |
| avgRenderMs | 30.74 | 32.94 | +7.2% |
| p50FrameMs | 74.00 | 79.30 | +7.2% |
| p95FrameMs | 88.90 | 90.70 | +2.0% |
| p99FrameMs | 113.10 | 125.40 | +10.9% |
| compositeCallsPerFrame | 4.15 | 4.22 | +1.8% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 109.00 | 104.00 | -4.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | simulation-dominant | simulation-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 27.10 | 10.84 | -60.0% |
| avgRenderMs | 28.88 | 28.06 | -2.9% |
| p50FrameMs | 52.50 | 37.10 | -29.3% |
| p95FrameMs | 74.10 | 57.00 | -23.1% |
| p99FrameMs | 81.20 | 71.20 | -12.3% |
| compositeCallsPerFrame | 5.32 | 5.24 | -1.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 91.00 | 120.00 | +31.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.55 | 9.68 | -60.6% |
| avgRenderMs | 31.68 | 33.04 | +4.3% |
| p50FrameMs | 54.90 | 40.20 | -26.8% |
| p95FrameMs | 74.60 | 62.20 | -16.6% |
| p99FrameMs | 83.10 | 78.70 | -5.3% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 75.00 | 94.00 | +25.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.69 | 11.40 | -53.8% |
| avgRenderMs | 28.35 | 30.29 | +6.8% |
| p50FrameMs | 52.30 | 39.90 | -23.7% |
| p95FrameMs | 71.10 | 59.80 | -15.9% |
| p99FrameMs | 89.70 | 74.60 | -16.8% |
| compositeCallsPerFrame | 5.23 | 5.04 | -3.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 124.00 | 149.00 | +20.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
