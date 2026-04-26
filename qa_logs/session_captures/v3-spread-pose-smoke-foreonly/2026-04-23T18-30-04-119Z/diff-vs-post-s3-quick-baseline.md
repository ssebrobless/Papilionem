# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-foreonly\2026-04-23T18-30-04-119Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 39.91 | +2.7% |
| avgRenderMs | 44.91 | 40.29 | -10.3% |
| p50FrameMs | 91.20 | 84.90 | -6.9% |
| p95FrameMs | 101.00 | 101.60 | +0.6% |
| p99FrameMs | 148.70 | 122.60 | -17.6% |
| compositeCallsPerFrame | 4.19 | 4.17 | -0.6% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 91.00 | 99.00 | +8.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 25.57 | +1.5% |
| avgRenderMs | 25.35 | 27.03 | +6.7% |
| p50FrameMs | 48.50 | 49.70 | +2.5% |
| p95FrameMs | 68.60 | 67.90 | -1.0% |
| p99FrameMs | 71.90 | 75.90 | +5.6% |
| compositeCallsPerFrame | 4.00 | 5.30 | +32.6% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 106.00 | 96.00 | -9.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 23.60 | -1.9% |
| avgRenderMs | 30.82 | 29.86 | -3.1% |
| p50FrameMs | 54.60 | 51.80 | -5.1% |
| p95FrameMs | 73.80 | 72.80 | -1.4% |
| p99FrameMs | 82.90 | 86.70 | +4.6% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 76.00 | 79.00 | +3.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 24.21 | -1.0% |
| avgRenderMs | 27.76 | 27.72 | -0.1% |
| p50FrameMs | 50.70 | 50.80 | +0.2% |
| p95FrameMs | 70.10 | 68.70 | -2.0% |
| p99FrameMs | 85.00 | 77.00 | -9.4% |
| compositeCallsPerFrame | 5.08 | 5.21 | +2.6% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 128.00 | 128.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

- missing baseline file: no
- missing candidate file: yes
