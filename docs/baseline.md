# Phase 0 baseline (legacy/wodblok-v100.html)

Recorded Oct 8 2026 in the Claude Code sandbox (Chromium 141 via Playwright 1.56.0, software rendering).
`legacy/wodblok-v100.html` sha256 `eefef728e5a53c811d7a367532740e5f7c0b3b8c956f77d1ffe86800760179aa`
(this is the published artifact page as served: the app's own document wrapped in the artifact page shell).

## Result
Full suite, three consecutive runs on the untouched legacy file: **41 passed, 1 skipped** each time, no snapshot updates between runs 2 and 3.
The skipped test is the WebKit smoke test (WebKit is not installed in this sandbox; it runs in CI, `npm run test:webkit`).

## Speed (this machine; use ratios, not absolute numbers)
- Drag the layer "lrp" slider 40 steps on the 4:3 project (5 layers, textures, blends, grading): median **7.0 s** (runs 8.2 / 7.0 / 6.7 s). About 190 ms per step, 34 long tasks per drag, 2.1 DOM nodes added per move.
- Randomize roll (seed 21) until the drawing is quiet: **2.0 s**.
- Stamp-editor motif dragging is not measured yet.

## What had to be neutralised to make runs repeat
These are v100 behaviours that differ run to run even with the same random seed and a fixed clock. They are not in the document or the picture; the tests ignore them, and Phase 1 must not rely on them:
- Blob URLs for stamp prints carry a random id.
- The block-rim print cache sprite (`bk###` symbols, their viewBox offsets, the sheet's pixel size) depends on which prints finish first.
- Counter-numbered element ids (`ks####` masks and similar) depend on how many redraws happened before.
- The number of redraws during a drag varies with timing (draft mode), so drag counters are compared with a tolerance.

## Size
Goldens (29 PNGs, about 22 MB) are specific to the environment that made them (`tests/__golden__/sandbox/`). CI should create its own set on its first run (`WB_ENV=ci`). Consider Git LFS for them if the repo grows.
