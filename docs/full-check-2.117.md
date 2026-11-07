# Full check: WODBLOK 2.117.0 (Nov 6 2026)

Owner, Nov 6 2026: "Do a full check of the app for bugs and styling problems. Make a full report and a clean plan with few steps to fix it." He said yes to the CI suite as part of it.

Checked: 2.117.0 (`main`, live), built from `main`, in Chromium at 1440 × 900, by throwaway sweep scripts that drive the real UI (not committed), plus the CI suite. A finding is listed only after I looked at it again by hand: a screenshot, the code, or a second run.

## What was run

| Area | How | Result |
| --- | --- | --- |
| CI suite, run 42236871292 on `main` | Eight Chromium shards and WebKit | WebKit passed. Chromium: 12 failed and everything else passed (below). The picture comparison job was skipped: it only runs on a pull request labelled `run-suite`, and the pixel goldens are stale. |
| Every command | 159 commands, each run in three states: empty canvas, after a Randomize roll, a shape selected | 254 ran and 199 were correctly disabled. No page errors and no broken numbers in the document. Not run: New, Clear, Open, Projects, the three library imports, and Export all recipes, because they open file pickers or clear the session. |
| Every panel | 17 panels, each opened alone after a roll, in dark and in light | No page errors, no panel content past its box, no native dropdowns. Text cut off: two places (S2 and B1). Every panel screenshot was checked by eye. |
| Menus | All 10 menus opened and screenshotted | Nothing cut off and nothing broken (see S5 for wording). |
| Randomize | 30 rolls across 14 Looks, with 3 Undos and 3 Redos after every 10 | No errors and nothing off the canvas. Undo and Redo were exact. A roll took 1.2 to 2.7 s on this 2-thread sandbox. |
| Drawing: export against the screen | 6 rolls: the canvas screenshot compared with the 3× PNG export, scaled down to the same size | They match (mean difference 1.8 to 6.4 out of 255). The largest difference is halftone dots landing in slightly different places, which is expected. |
| Mockups | All 7 products shown with a design; the book cover on the Notebook on a table | Screenshots checked: B3 and B4. |
| Style rules | `check:style` and `check:platform`, plus a scan of the page CSS for raw colours, sizes and paddings | Both checks pass. Findings S1 to S6. |

Not checked: Safari on a Mac, a tablet with a pen, a phone (the owner develops desktop-first), screen readers, and the live site itself.

## CI failures (12), sorted by cause

| Tests | Cause | What it needs |
| --- | --- | --- |
| style-slips-2-107 "B2: the Mockup library shows whole names" | **Real bug B1.** The card name "Notebook on a table" (added in 2.115.0) is cut off. | The fix in step 1 |
| asset-split-2-98-1 (expects 6 mockup masks, finds 7) | The test was not updated for the new product in 2.115.0. The app is right. | Change the test to 7 (step 1) |
| small-updates-2-79-2 "Alt + wheel … one History step" | **Real bug B2** on slow machines. Passed 4 out of 4 locally. | The fix in step 1 |
| 9 SVG snapshots: scenarios randomize seeds 1–3, before-view, split-view, theme-light; roundtrip open project 1, 3 and 4 | Expected. 2.116.0 added a `data-te="N"` attribute to texture pictures so exports can find them and redraw them at export size. Each file grew by exactly 12 or 13 characters per texture picture, and the tag counts did not change. The state snapshots did not change. | **Your approval** to regenerate them in CI (step 2) |

## Bugs

| # | Bug | Where | Severity |
|---|---|---|---|
| B1 | The Mockup card "Notebook on a table" shows a cut-off name. 2.107.0 made every card name fit; this new name is too long for a card. | 2.115.0 product name, card width | Low |
| B2 | Alt + wheel (size) and Shift + wheel (turn) on a selected element can save two History steps instead of one when the machine is slow. Each notch changes the slider, and History saves at the next idle moment, before the 700 ms "it has stopped" point. This is the same kind of bug as the group drag in 2.114.1. | 41-view-keys.js: the wheel gesture does not hold History the way a drag does | Medium (Undo takes two presses) |
| B3 | Three number fields with a two-letter unit draw the unit over the number: Export > Long side (px), Pattern > Piece size (in, mm, px) and Mockup > Real width (cm). A CSS rule with higher priority (`.ctl .num input.u`) overrides the wider padding meant for these fields (`.num input.u2`). | shell.html line 470 | Low (looks wrong) |
| B4 | **A book cover on a notebook mockup** shows the whole wrap (back, spine and front: 12.7 × 9.25 in) squeezed across the notebook's front, as a wide band with white above and below. A real book would show the front cover only. | 23-mockups.js has no idea of a book cover | Medium for anyone mocking up a cover |
| B5 | Warped mockups (T-shirt, Cushion, Tote) show faint hairline seams across the design where the warp's triangles meet. They are visible at 1×, in the view and probably in the mockup export. The triangles are already widened by 0.6 px, which is not quite enough with shading on. | mkTri in 23-mockups.js | Low |
| B6 | On screen only, at some zoom levels, faint light lines appear between pattern rows in dark bands (seen on a Quilt roll). The export has no lines. | The browser's anti-aliasing at cell edges | Low (screen only) |
| B7 | A mockup export keeps the view's texture resolution. 2.116.0 sharpened every other export, but not this one. | mkDesign calls ser() without an export size | Low |

No other bugs were found: every command ran cleanly, every panel opened cleanly in both themes, and 30 rolls with Undo and Redo left nothing broken.

## Style (developing-wodblok.md Part 9)

| # | Finding | Rule | Fix |
|---|---|---|---|
| S1 | The Stamp panel's Library shows the line **"Saved to your Claude account"** (or "Saved in this browser"). It is explanatory text in a panel, it names Claude in a product you will sell, and no other library has a line like it. It comes from when WODBLOK ran inside Claude. | No explanatory text (owner); keep the repo free of how the product is sold | Remove the line (step 1) |
| S2 | The Colours list cuts each colour's usage line short ("#501345 · Ink · 1 stamp · 1 text · 2 out…"). This looks deliberate (an ellipsis), but the word "out" is unclear when cut. | n/a | Leave as is, or say "fixed" instead of "out" (your call) |
| S3 | Paddings off the spacing scale in nine rules: `.dd2>.ddb` and `.ddb` 3 px, `.wtab` 10 px, `.smked` 7/10 px, `.stgn button` 9 px, `.board>div` 28 px, `.istg` 16/18 px, `.lmt` 3/7 px, `.lem` 18 px, `.modal` 30 px. | Spacing scale (Part 9) | Snap each to 2, 4, 8, 12, 16 or 24 px (step 1; a CSS-only commit) |
| S4 | `body` sets raw colours (#faf9f5 and #141413) under the tokens, and a canvas checkerboard uses #dcdcdc. | Colours through tokens | Use `var(--bg)` and `var(--fg)`; keep the checkerboard (it is artwork) |
| S5 | Menu wording: Edit has "Group the selected elements" next to "Ungroup". Help and the Help panel say "About Wodblok", while the app and docs write "WODBLOK". | One voice in menus | "Group", and "About WODBLOK" (your call on the name) |
| S6 | `check:style` does not catch S3 or S4, which is why they slipped in. | n/a | Add padding and raw-colour checks to tools/check-style.js (step 1) |

Looked at and fine: every panel's sections, rows, sliders, lists and folder trees match each other in both themes; the new tray shift button matches "+"; the menus line up; and the Layout panel's small upper-case "CANVAS" label is the same group label that Help and Export use.

## The plan: three steps

1. **2.118.0, small fixes (one release, about an hour; no drawing changes):**
   - B1: a shorter card name, for example "Notebook, angled". **Tell me the name you want.**
   - B2: hold History during a wheel gesture, the way a drag does.
   - B3: fix the priority of the `.u2` padding rule.
   - S1: remove the "Saved to…" line.
   - S3 and S4: snap the paddings to the scale and use colour tokens.
   - S6: extend check:style so these can't slip in again.
   - Update the asset-split test to 7 masks.
   - Tests for B1, B2 and B3, and quick runs of the specs those changes touch.
2. **Bring the snapshots and goldens up to date (CI; needs your yes):**
   - Regenerate the 9 SVG snapshots, which changed only by 2.116.0's `data-te` attribute.
   - Run the suite again with the picture comparison (`run-suite` label) and regenerate the pixel goldens whose differences are explained by recent releases (new tray button, sharper textures, cover guides). I'll list each one first.
3. **2.119.0, mockups done right (one release; touches drawing, so `npm run perf`):**
   - B4: a book cover shows its front cover on Notebook and Notebook on a table (you choose: front only, or a switch for "whole wrap").
   - B7: mockup exports at export resolution.
   - B5: wider triangle overlap, or a single-pass warp, so the seams go away.
   - B6 is screen-only and minor: look at it in the same release, but only if a clean fix appears.

## Outcome (Nov 6 2026)
- Owner: "Yes, front cover, yes".
- Step 1 is 2.118.0. The card name is "Angled book": the approved "Notebook, angled" was still cut off at 82 px in a 70 px card.
- Regenerating the snapshots turned up one more 2.116.0 slip: texture pictures and filters made for an old zoom step stayed in the page and went into exports. It is fixed in 2.118.0.
- Step 2: the 9 SVG snapshots were regenerated in CI. They now differ only by the `data-te` attribute.
- Step 3 is 2.119.0: B4, B5 and B7. B6 was not changed.
- Suite on PR #269 (run 42259583447): all passed, including WebKit and the picture comparison. The pixel goldens did not need regenerating: the picture comparison checks the build against `main`'s build and passed.
- Still open: B6, and the "About Wodblok" wording.

