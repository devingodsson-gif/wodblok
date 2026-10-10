# Known issues in v100 (kept as-is through Phases 1-3)

Phases 1-3 move code and add the capabilities each phase lists; they do not fix bugs, so the tests can
prove nothing else changed. Each item here is pinned by a test, so a fix shows up as a deliberate snapshot
change. Fix them after Phase 3 as normal releases.

Fixed in v107: Undo after Clear leaving the colour grade blank (the grade was reset before the step was saved), and
opening a file nudging a frame inset from 9.6 to 9.5 (the panel wrote the slider's rounded value back). Also fixed in
v107: Undo stalling after several Randomize rolls in a row (loading a step added a stray history step).

## Test flake: canvas shape "hex" SVG summary (seen once, Phase 2d run)
One full-suite run produced a different SVG summary for `canvas shape: hex` (clipPath 11→9, polygon 6→4, use 38→39); the same test passed 6 of 6 repeats on both the build and the untouched v100 file straight afterwards. So it is rare timing in the app (something drawn after the settle check), not a change from the build. Snapshot not touched. If it recurs, make `settle` also wait for pending frames before the summary is taken.

## Observation: Before (\) did not turn on right after Ctrl+S on a fresh document (not investigated)
In a test that pressed Ctrl+S on a new document, then rolled Randomize, the `\` key did not switch Before on; with the order reversed it did. Probably the Save flow (name prompt or the reference picture) interferes. Not reproduced by hand; logged only.

## Test flake: "open project-3" round trip on the raw-module target (seen once, Phase 2e run)
Failed once in a full run on `WB_TARGET=esm`; passed 3 of 3 repeats straight afterwards and on every bundle run. Same family as the hex-shape flake above (something drawn after the settle check). Not changed.

## v103 note: tests no longer match the v100 baseline
v103 replaced the colour library (Wada colours, src/data/wada.js) and the default ink/paper (Dark Tyrian Blue on Pale Lemon Yellow, was Marian Blue on Lily White). Snapshots and screenshots were regenerated from the build with the owner's OK, so `WB_TARGET=legacy` runs now differ by design. Run the tests on the build (or esm) from here on.

## Test flake: canvas shape "arch" SVG summary (seen once, v106 full run)
One full-suite run gave a different hash for `canvas shape: arch` (same length and tag counts); 4 of 4 repeats passed straight afterwards. Same family as the hex-shape flake above: something drawn after the settle check. Snapshot not touched.

## Test flake: "open project-1-diamond" (state or SVG snapshot, seen once, v0.115.1 run)
Failed once in a run of the scenarios, round-trip and repeat-tile specs; passed alone, and 5 of 5 repeats straight afterwards. Same family as the hex, arch and project-3 flakes above (something drawn after the settle check). Snapshot not touched.

## Seen once, not reproduced: stamps vanish after a canvas shape change (UX review, 1.0)
After switching the canvas shape to Arch on a rolled piece, the stamps were missing from the canvas (the 4 stamps were still in the tray) until the next edit. Two later attempts, including the same steps, did not reproduce it. Same family as the flakes above (something drawn after a settle point). 1.0.1 adds a progress bar after shape changes, which should make a late draw visible.

## Switching a layer between Free place, Art and Text clears its placed items
Found by reading `23-frame-layers.js` (`if(was&&was!=m)L.pl=[]`), not by a test. Undo should bring them back. Not fixed.

## Text layer Ink dropdown looked blank once (UX review D5)
Could not be reproduced in later runs; no change made.

## Test flake again: roundtrip "open project-…" SVG summary (seen twice, 1.0.1 and 1.0.2 runs)
`open-project-4-rect-4x3.svg.json` failed once on the 1.0.1 build and `open-project-1-diamond.svg.json` once on the 1.0.2 build (with the rail collapsed); each passed on an immediate re-run on the same build. Same family as the flakes above. Snapshots not touched.
