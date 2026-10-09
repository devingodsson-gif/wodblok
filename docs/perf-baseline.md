# Phase 6 baseline (v0.119, Chromium headless, 1440x900, in this sandbox)

Run with `WB_TARGET=build npm run perf-baseline` (five-layer 4:3 fixture; sliders driven in the page, time = input event until two frames later).
Times are for orientation only: machines differ, so nothing here is a pass/fail number. Compare the same machine before and after a change.

| Work | Result |
|---|---|
| Layer pattern slider, per input | median 32 ms (two frames, nothing extra), slowest 194 ms |
| Grade exposure slider | median 32 ms, slowest 32 ms |
| Texture amount slider | median 32 ms, slowest 144 ms |
| Randomize roll until the picture settles | 2.9 s |
| PNG export of the current piece | 4.6 s |
| Slider drag, build vs the v100 file (`npm run perf`) | build 14% faster (ratio 0.855) |

Reading it: dragging is already smooth (drafting while you drag); the occasional spike is the full redraw when a drag lands. The heavy work is Randomize (2.9 s) and PNG export (4.6 s).
Not measured: Safari/WebKit (no WebKit browser in this sandbox; run `npm run test:webkit` and `npm run perf-baseline` on a Mac), motif dragging on the canvas.
