# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T08-04-05-161Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-foreonly\2026-04-23T18-30-04-119Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 37.98 | 39.91 | +5.1% |
| avgRenderMs | 53.73 | 40.29 | -25.0% |
| p50FrameMs | 112.50 | 84.90 | -24.5% |
| p95FrameMs | 131.20 | 101.60 | -22.6% |
| p99FrameMs | 151.40 | 122.60 | -19.0% |
| compositeCallsPerFrame | 4.22 | 4.17 | -1.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 80.00 | 99.00 | +23.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.50 | 25.57 | +0.3% |
| avgRenderMs | 25.40 | 27.03 | +6.4% |
| p50FrameMs | 48.70 | 49.70 | +2.1% |
| p95FrameMs | 67.40 | 67.90 | +0.7% |
| p99FrameMs | 75.40 | 75.90 | +0.7% |
| compositeCallsPerFrame | 4.98 | 5.30 | +6.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 99.00 | 96.00 | -3.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.00 | 23.60 | -1.6% |
| avgRenderMs | 30.34 | 29.86 | -1.6% |
| p50FrameMs | 54.00 | 51.80 | -4.1% |
| p95FrameMs | 71.50 | 72.80 | +1.8% |
| p99FrameMs | 77.60 | 86.70 | +11.7% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 76.00 | 79.00 | +3.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.19 | 24.21 | -3.9% |
| avgRenderMs | 27.19 | 27.72 | +2.0% |
| p50FrameMs | 51.40 | 50.80 | -1.2% |
| p95FrameMs | 69.30 | 68.70 | -0.9% |
| p99FrameMs | 83.00 | 77.00 | -7.2% |
| compositeCallsPerFrame | 5.07 | 5.21 | +2.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 127.00 | 128.00 | +0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## travel

- missing baseline file: no
- missing candidate file: yes
