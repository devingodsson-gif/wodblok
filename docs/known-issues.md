# Known issues in v100 (kept as-is through Phases 1-3)

Phases 1-3 move code and add the capabilities each phase lists; they do not fix bugs, so the tests can
prove nothing else changed. Each item here is pinned by a test, so a fix shows up as a deliberate snapshot
change. Fix them after Phase 3 as normal releases.

1. **Undo after Clear leaves the colour grade blank.** Open a project that has grading, File > Clear, then
   Ctrl+Z: the layers, stamps, palette and textures return, but the grade (sliders and masks) stays at zero.
   Cause (from the code): the history's first entry is taken before the opened project's grade is applied.
   Pinned by `tests/scenarios.spec.js` ("clear resets to a blank document...", snapshot `clear-undo-grade.json`).
2. **Opening a file nudges a frame inset from 9.6 to 9.5** in `project-1-diamond.wodblok.json`
   (`layers.2.fr.i`). Probably clamping or rounding on load. Pinned by the `open-normalisation-*` snapshots in
   `tests/__snapshots__/roundtrip.spec.js/`.

## Test flake: canvas shape "hex" SVG summary (seen once, Phase 2d run)
One full-suite run produced a different SVG summary for `canvas shape: hex` (clipPath 11→9, polygon 6→4, use 38→39); the same test passed 6 of 6 repeats on both the build and the untouched v100 file straight afterwards. So it is rare timing in the app (something drawn after the settle check), not a change from the build. Snapshot not touched. If it recurs, make `settle` also wait for pending frames before the summary is taken.

## Observation: Before (\) did not turn on right after Ctrl+S on a fresh document (not investigated)
In a test that pressed Ctrl+S on a new document, then rolled Randomize, the `\` key did not switch Before on; with the order reversed it did. Probably the Save flow (name prompt or the reference picture) interferes. Not reproduced by hand; logged only.

## Test flake: "open project-3" round trip on the raw-module target (seen once, Phase 2e run)
Failed once in a full run on `WB_TARGET=esm`; passed 3 of 3 repeats straight afterwards and on every bundle run. Same family as the hex-shape flake above (something drawn after the settle check). Not changed.

## v103 note: tests no longer match the v100 baseline
v103 replaced the colour library (Wada colours, src/data/wada.js) and the default ink/paper (Dark Tyrian Blue on Pale Lemon Yellow, was Marian Blue on Lily White). Snapshots and screenshots were regenerated from the build with the owner's OK, so `WB_TARGET=legacy` runs now differ by design. Run the tests on the build (or esm) from here on.
