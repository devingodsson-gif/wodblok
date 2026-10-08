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
