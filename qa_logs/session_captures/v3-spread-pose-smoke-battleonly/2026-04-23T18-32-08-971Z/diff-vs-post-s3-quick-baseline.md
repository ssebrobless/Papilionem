# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-battleonly\2026-04-23T18-32-08-971Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 40.24 | +3.6% |
| avgRenderMs | 44.91 | 40.36 | -10.1% |
| p50FrameMs | 91.20 | 86.20 | -5.5% |
| p95FrameMs | 101.00 | 92.30 | -8.6% |
| p99FrameMs | 148.70 | 123.90 | -16.7% |
| compositeCallsPerFrame | 4.19 | 4.16 | -0.8% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 91.00 | 99.00 | +8.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 25.69 | +1.9% |
| avgRenderMs | 25.35 | 26.48 | +4.5% |
| p50FrameMs | 48.50 | 48.80 | +0.6% |
| p95FrameMs | 68.60 | 69.80 | +1.7% |
| p99FrameMs | 71.90 | 75.50 | +5.0% |
| compositeCallsPerFrame | 4.00 | 5.30 | +32.5% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 106.00 | 97.00 | -8.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 23.34 | -3.0% |
| avgRenderMs | 30.82 | 29.59 | -4.0% |
| p50FrameMs | 54.60 | 51.90 | -4.9% |
| p95FrameMs | 73.80 | 68.60 | -7.0% |
| p99FrameMs | 82.90 | 74.30 | -10.4% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 76.00 | 79.00 | +3.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 24.23 | -0.9% |
| avgRenderMs | 27.76 | 27.28 | -1.7% |
| p50FrameMs | 50.70 | 50.60 | -0.2% |
| p95FrameMs | 70.10 | 67.80 | -3.3% |
| p99FrameMs | 85.00 | 77.30 | -9.1% |
| compositeCallsPerFrame | 5.08 | 5.22 | +2.8% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 128.00 | 128.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

- missing baseline file: no
- missing candidate file: yes
