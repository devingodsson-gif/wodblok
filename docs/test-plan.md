# What the Phase 0 tests cover, and what they don't yet

Covered (all against `legacy/wodblok-v100.html`):
- Launch state: Pattern mode, no tool windows, dark theme, one blank stamp and layer, only Google Fonts as network. With and without the claude.ai artifact runtime.
- Opening each real project file (3 fixtures: diamond canvas with frames and a grade mask; 16:9 with a Free place layer; 4:3 with five layers, textures, blends, grading). Document state, SVG summary and picture are recorded.
- Round trip: Download project file, reopen in a fresh page, identical document. What opening changes in the original file is recorded.
- Project list in the account database (stand-in runtime), open from the list.
- Randomize with three seeds; undo/redo; Before and Split compare; nine canvas shapes; light theme; Stamp editor; nine tool windows open with a real project; History; Clear and undo.
- Text tool (smoke only: glyph shapes depend on the installed fonts).
- Perf: slider drag on the 4:3 fixture (counters snapshotted; times written to test-results/perf-*.json, compared side by side once a build exists). Randomize roll time.
- WebKit smoke (`npm run test:webkit`): loads, opens a project, randomizes, no errors, timings written down. Needs WebKit installed (CI).

Not covered yet (add when touched, or before Phase 1c at the latest):
- Art layers (imported image or saved project, crop editor), image trace, motif sheets, import fonts, stamp library save/export, frame layer editing by hand, Free place by hand, grade mask editing, cover overlay and print-cover PDF export, PNG/SVG export contents.
- Motif dragging speed in the Stamp editor (needs a stable way to find a motif on screen).
- The artifact's real runtime (the stand-in only implements what the app calls).
