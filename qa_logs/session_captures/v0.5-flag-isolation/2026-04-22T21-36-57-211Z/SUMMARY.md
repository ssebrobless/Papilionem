# V0.5 Flag Isolation Summary

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- save: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\save_exports\2026-04-21T21-56-03-846Z-playtest-manual\save.json`

## pauseWhenHidden

- output: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\pauseWhenHidden\2026-04-22T21-36-57-633Z`
- diff: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\pauseWhenHidden\2026-04-22T21-36-57-633Z\diff-vs-baseline.md`

| lane | metric | baseline | candidate | delta |
| --- | --- | ---: | ---: | --- |
| calm | avgUpdateMs | 25.20 | 24.77 | -1.7% |
| calm | avgRenderMs | 25.35 | 25.22 | -0.5% |
| calm | p95FrameMs | 68.60 | 67.00 | -2.3% |
| calm | p99FrameMs | 71.90 | 71.30 | -0.8% |
| shell | avgUpdateMs | 24.06 | 23.41 | -2.7% |
| shell | avgRenderMs | 30.82 | 30.62 | -0.6% |
| shell | p95FrameMs | 73.80 | 70.80 | -4.1% |
| shell | p99FrameMs | 82.90 | 78.60 | -5.2% |
| travel | avgUpdateMs | 23.94 | 24.79 | +3.6% |
| travel | avgRenderMs | 33.94 | 34.78 | +2.5% |
| travel | p95FrameMs | 83.30 | 72.10 | -13.4% |
| travel | p99FrameMs | 89.10 | 89.70 | +0.7% |
| battle | avgUpdateMs | 38.85 | 41.75 | +7.5% |
| battle | avgRenderMs | 44.91 | 48.53 | +8.1% |
| battle | p95FrameMs | 101.00 | 131.80 | +30.5% |
| battle | p99FrameMs | 148.70 | 150.00 | +0.9% |
| soak40 | avgUpdateMs | 24.46 | 25.05 | +2.4% |
| soak40 | avgRenderMs | 27.76 | 27.28 | -1.7% |
| soak40 | p95FrameMs | 70.10 | 72.20 | +3.0% |
| soak40 | p99FrameMs | 85.00 | 81.30 | -4.4% |

## asyncImageDecode

- output: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\asyncImageDecode\2026-04-22T21-37-56-425Z`
- diff: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\asyncImageDecode\2026-04-22T21-37-56-425Z\diff-vs-baseline.md`

| lane | metric | baseline | candidate | delta |
| --- | --- | ---: | ---: | --- |
| calm | avgUpdateMs | 25.20 | 27.76 | +10.1% |
| calm | avgRenderMs | 25.35 | 27.27 | +7.6% |
| calm | p95FrameMs | 68.60 | 75.10 | +9.5% |
| calm | p99FrameMs | 71.90 | 79.10 | +10.0% |
| shell | avgUpdateMs | 24.06 | 25.29 | +5.2% |
| shell | avgRenderMs | 30.82 | 32.40 | +5.1% |
| shell | p95FrameMs | 73.80 | 77.90 | +5.6% |
| shell | p99FrameMs | 82.90 | 85.50 | +3.1% |
| travel | avgUpdateMs | 23.94 | 24.51 | +2.4% |
| travel | avgRenderMs | 33.94 | 34.27 | +1.0% |
| travel | p95FrameMs | 83.30 | 84.00 | +0.8% |
| travel | p99FrameMs | 89.10 | 89.80 | +0.8% |
| battle | avgUpdateMs | 38.85 | 38.63 | -0.6% |
| battle | avgRenderMs | 44.91 | 44.16 | -1.7% |
| battle | p95FrameMs | 101.00 | 96.80 | -4.2% |
| battle | p99FrameMs | 148.70 | 131.40 | -11.6% |
| soak40 | avgUpdateMs | 24.46 | 24.12 | -1.4% |
| soak40 | avgRenderMs | 27.76 | 27.18 | -2.1% |
| soak40 | p95FrameMs | 70.10 | 67.10 | -4.3% |
| soak40 | p99FrameMs | 85.00 | 72.50 | -14.7% |

## telemetryRingCap

- output: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\telemetryRingCap\2026-04-22T21-38-55-178Z`
- diff: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\telemetryRingCap\2026-04-22T21-38-55-178Z\diff-vs-baseline.md`

| lane | metric | baseline | candidate | delta |
| --- | --- | ---: | ---: | --- |
| calm | avgUpdateMs | 25.20 | 25.69 | +1.9% |
| calm | avgRenderMs | 25.35 | 25.68 | +1.3% |
| calm | p95FrameMs | 68.60 | 68.20 | -0.6% |
| calm | p99FrameMs | 71.90 | 76.70 | +6.7% |
| shell | avgUpdateMs | 24.06 | 24.23 | +0.7% |
| shell | avgRenderMs | 30.82 | 31.17 | +1.1% |
| shell | p95FrameMs | 73.80 | 72.00 | -2.4% |
| shell | p99FrameMs | 82.90 | 77.60 | -6.4% |
| travel | avgUpdateMs | 23.94 | 25.33 | +5.8% |
| travel | avgRenderMs | 33.94 | 33.98 | +0.1% |
| travel | p95FrameMs | 83.30 | 72.10 | -13.4% |
| travel | p99FrameMs | 89.10 | 85.60 | -3.9% |
| battle | avgUpdateMs | 38.85 | 40.39 | +4.0% |
| battle | avgRenderMs | 44.91 | 44.92 | +0.0% |
| battle | p95FrameMs | 101.00 | 118.10 | +16.9% |
| battle | p99FrameMs | 148.70 | 137.60 | -7.5% |
| soak40 | avgUpdateMs | 24.46 | 25.09 | +2.6% |
| soak40 | avgRenderMs | 27.76 | 26.94 | -2.9% |
| soak40 | p95FrameMs | 70.10 | 73.10 | +4.3% |
| soak40 | p99FrameMs | 85.00 | 86.30 | +1.5% |

## textMeasureCache

- output: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\textMeasureCache\2026-04-22T21-39-52-742Z`
- diff: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0.5-flag-isolation\2026-04-22T21-36-57-211Z\textMeasureCache\2026-04-22T21-39-52-742Z\diff-vs-baseline.md`

| lane | metric | baseline | candidate | delta |
| --- | --- | ---: | ---: | --- |
| calm | avgUpdateMs | 25.20 | 26.30 | +4.4% |
| calm | avgRenderMs | 25.35 | 26.52 | +4.6% |
| calm | p95FrameMs | 68.60 | 68.90 | +0.4% |
| calm | p99FrameMs | 71.90 | 76.00 | +5.7% |
| shell | avgUpdateMs | 24.06 | 24.06 | +0.0% |
| shell | avgRenderMs | 30.82 | 30.92 | +0.3% |
| shell | p95FrameMs | 73.80 | 75.50 | +2.3% |
| shell | p99FrameMs | 82.90 | 90.10 | +8.7% |
| travel | avgUpdateMs | 23.94 | 24.23 | +1.2% |
| travel | avgRenderMs | 33.94 | 33.70 | -0.7% |
| travel | p95FrameMs | 83.30 | 72.20 | -13.3% |
| travel | p99FrameMs | 89.10 | 85.60 | -3.9% |
| battle | avgUpdateMs | 38.85 | 39.52 | +1.7% |
| battle | avgRenderMs | 44.91 | 45.25 | +0.8% |
| battle | p95FrameMs | 101.00 | 106.90 | +5.8% |
| battle | p99FrameMs | 148.70 | 142.20 | -4.4% |
| soak40 | avgUpdateMs | 24.46 | 26.08 | +6.6% |
| soak40 | avgRenderMs | 27.76 | 30.07 | +8.3% |
| soak40 | p95FrameMs | 70.10 | 74.20 | +5.8% |
| soak40 | p99FrameMs | 85.00 | 90.80 | +6.8% |
