# Development plan

No open plan. The UX fix plan ([`fix-plan.md`](fix-plan.md), 1.0.1 to 1.0.20) closed with 1.1.0.

Next: test 1.1.0 by hand (Monday), then write the polish plan here. Candidates from the closed plan are listed at the top of `fix-plan.md`.

## 1.6.0: Randomize shape folders
Randomize has a "Shape folders" row with a dropdown of every library folder (built-in sets, My imports, your own folders, folders inside folders). A roll takes its shapes only from the ticked folders; the Dots set stays the accents when ticked, otherwise accents come from the chosen folder. All ticked behaves exactly as before. Ticking a folder ticks the folders inside it, at least one folder holding shapes always stays ticked, new folders start ticked, and the choice is remembered in the browser like the other Randomize options (not in the project file). Test: tests/randomize-folders.spec.js.

## 1.7.0: Lighter redraws (speed, pass 3)
Speed work from the Oct 15 audit (`docs/known-issues.md` lists the two old quirks found on the way). Nothing changes on screen.
- Every stamp's outline (clip, mask, shape) now lives once in a hidden block (`#stdefs`) that is rewritten only when a stamp changes. The pattern itself carries the ready-made prints, so it no longer repeats those outlines on every redraw (busy test project: 2.7 MB of markup on screen down to about 38 KB).
- The pattern build numbers its mask ids from a fixed start, so the same stamps give the same text every time; a stamp's fingerprint is only worked out again when its text changed.
- New tests: `tests/speed-guard.spec.js` (counts the markup on screen and checks that nothing points at a missing id, after slider moves, zoom, the Stamp editor and Randomize) and `tests/picture-compare.spec.js` (CI draws the same projects with `main` and with the branch and compares the pictures pixel by pixel, including a PNG export).
- Measured on the busy test project (Chromium, 1x, sandbox): stamp size slider step 154 → 89 ms, texture Amount 248 → 163 ms, undo 219 → 149 ms, Randomize first frame 785 → 587 ms. Freezes of 0.3–0.7 s and the 8 s export are for passes 4 and 5.
