# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T08-04-05-161Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-battleonly\2026-04-23T18-32-08-971Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 37.98 | 40.24 | +6.0% |
| avgRenderMs | 53.73 | 40.36 | -24.9% |
| p50FrameMs | 112.50 | 86.20 | -23.4% |
| p95FrameMs | 131.20 | 92.30 | -29.6% |
| p99FrameMs | 151.40 | 123.90 | -18.2% |
| compositeCallsPerFrame | 4.22 | 4.16 | -1.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 80.00 | 99.00 | +23.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.50 | 25.69 | +0.7% |
| avgRenderMs | 25.40 | 26.48 | +4.3% |
| p50FrameMs | 48.70 | 48.80 | +0.2% |
| p95FrameMs | 67.40 | 69.80 | +3.6% |
| p99FrameMs | 75.40 | 75.50 | +0.1% |
| compositeCallsPerFrame | 4.98 | 5.30 | +6.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 99.00 | 97.00 | -2.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.00 | 23.34 | -2.7% |
| avgRenderMs | 30.34 | 29.59 | -2.5% |
| p50FrameMs | 54.00 | 51.90 | -3.9% |
| p95FrameMs | 71.50 | 68.60 | -4.1% |
| p99FrameMs | 77.60 | 74.30 | -4.3% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 76.00 | 79.00 | +3.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.19 | 24.23 | -3.8% |
| avgRenderMs | 27.19 | 27.28 | +0.3% |
| p50FrameMs | 51.40 | 50.60 | -1.6% |
| p95FrameMs | 69.30 | 67.80 | -2.2% |
| p99FrameMs | 83.00 | 77.30 | -6.9% |
| compositeCallsPerFrame | 5.07 | 5.22 | +3.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 127.00 | 128.00 | +0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## travel

- missing baseline file: no
- missing candidate file: yes
