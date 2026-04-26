# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-control-no-flag-post-journalfix\2026-04-23T23-07-09-553Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-posebucket16-post-journalfix\2026-04-23T23-08-13-173Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 44.65 | 44.35 | -0.7% |
| avgRenderMs | 33.63 | 31.89 | -5.2% |
| p50FrameMs | 79.60 | 77.40 | -2.8% |
| p95FrameMs | 93.50 | 88.60 | -5.2% |
| p99FrameMs | 127.20 | 122.50 | -3.7% |
| compositeCallsPerFrame | 4.16 | 4.15 | -0.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 99.00 | 104.00 | +5.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | simulation-dominant | simulation-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 28.20 | 28.13 | -0.2% |
| avgRenderMs | 29.72 | 29.07 | -2.2% |
| p50FrameMs | 54.60 | 53.80 | -1.5% |
| p95FrameMs | 75.60 | 75.50 | -0.1% |
| p99FrameMs | 84.80 | 88.50 | +4.4% |
| compositeCallsPerFrame | 5.33 | 5.33 | -0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 88.00 | 89.00 | +1.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.24 | 25.70 | -2.1% |
| avgRenderMs | 33.33 | 32.35 | -2.9% |
| p50FrameMs | 58.10 | 56.90 | -2.1% |
| p95FrameMs | 79.70 | 79.10 | -0.8% |
| p99FrameMs | 81.70 | 81.10 | -0.7% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 70.00 | 72.00 | +2.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 27.28 | 26.02 | -4.6% |
| avgRenderMs | 30.06 | 28.99 | -3.6% |
| p50FrameMs | 56.10 | 54.30 | -3.2% |
| p95FrameMs | 74.50 | 73.50 | -1.3% |
| p99FrameMs | 93.30 | 89.00 | -4.6% |
| compositeCallsPerFrame | 5.22 | 5.26 | +0.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 119.00 | 119.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |
