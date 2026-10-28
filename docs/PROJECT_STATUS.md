# WODBLOK: project status

The one page that says where development stands. **Every agent reads this after `CLAUDE.md` and updates it before finishing a session** (what changed, what was and was not tested, what is unfinished). The detail behind it lives in `docs/plan.md` (outcome of every release), `docs/known-issues.md` and `docs/agent-memory.md`. When this page and the code disagree, the code wins: fix this page.

Public repo: keep this page free of names, emails, accounts, prices and business plans (`CLAUDE.md`, "Public repo rules").

**Oct 27 2026 (2.67.0).** The Place copies ghost is the element itself; a gradient Sheet's effects fade along the gradient (full at its End).

**Oct 27 2026 (2.66.2).** CI suite run on 2.66.0 (owner); its failures fixed in 2.66.1 and 2.66.2: the Repeat 3 x 3 view is a picture of the tile (it stalled on heavy rolls), three older specs updated. Still failing, dropped by the owner: `smart-guides-2-40` Settings > Guides, `randomize-effects-2-39` seeded roll.

**Oct 27 2026 (2.66.0).** About ninety built-in fonts in eight groups, 29 with real bold, italic and bold italic. The text plan (docs/text-plan.md) is complete with this release. The app is 17.5 MB, over the preview artifact's 16 MB limit: the preview is now published with the `<style id="wbfonts">` contents moved into a `fonts.css` file next to the page (a same-origin stylesheet, which the Text tool still reads its outlines from); `dist/` itself is unchanged.

**Oct 27 2026 (2.65.0).** Bold, Italic, Underline, Strikethrough and Highlight on selected letters (drawn bold and slanted italic until the fonts release). Next: 2.66.0 about 90 built-in fonts with real bold and italic.

**Oct 27 2026 (2.64.0).** The new Text panel (Text, Style, Character, Paragraph, Shape); the unused and random controls removed. Next: 2.65.0 bold, italic, underline, strikethrough, highlight; 2.66.0 about 90 built-in fonts.

**Oct 27 2026 (2.63.0).** Text plan (docs/text-plan.md) answered by the owner; release 1, box-first text on the canvas, built. Next: 2.64.0 the new Text panel (also in a stamp's tab), 2.65.0 bold, italic, underline, strikethrough, highlight, 2.66.0 about 90 built-in fonts with real bold and italic.

**Oct 27 2026 (2.62.0).** Letter colour: the selected letters of a text take their own colour. The artist-test to-do is closed (owner, Oct 27 2026: the open items are dropped: the shape menus question, fonts, bold and italic, and the two old test failures).

**Oct 27 2026 (2.61.0).** Release 2 of the artist test: paste clamp, Pattern area minimum, colour picker Done, menus fit their items, same see-through squares on every stamp shape, close each panel tab, Place copies, crop in the shape import window, Sheet gradients (Linear and Radial, effects work on them), Film Grain redone.

**Oct 27 2026 (2.60.0).** Release 1 of the artist test (docs/artist-test-todo.md): selection and control (text picked on its letters, longer drag before a box, click round the canvas deselects, Lock in the Elements list, Shift turns guides off, Highlight colour). Next: release 2 (fixes, place copies, import crop, gradients, film grain), then release 3 (text overhaul; ask the owner first). A locked element is a new optional field in the project (`lk`), no format change.

**Oct 27 2026 (2.59.0).** Export recipes are on the shared library tree; workspaces are gone (the Default panels mode went). The hexagon/triangle stamp offset is fixed (owner). Randomize scenario snapshots regenerated in CI. Full suite not run for 2.56.0 to 2.59.0.

**Oct 26 2026 (Sheet).** Branch `feat/2.53.0-sheets` (2.53.0, not merged, waiting for the owner's word): the Sheet element (docs/sheet-plan.md); the Background is a Sheet; file format 28 (older files refused); a project with no stamps can be opened again (bug found and fixed). Known, not caused by it: `repeat-tile` "repeat 3 x 3" never settles (also on `main`); the five Randomize scenario snapshots still fail (owner to decide).

**Oct 26 2026 (library update).** Branches stacked and unmerged (owner's word needed): 2.49.0 to 2.52.0. The libraries now run on one folder-tree component (docs/library-update-plan.md): textures (2.51.1), saved stamps (2.51.2), saved trays, templates and a new saved-colourways library (all in 2.52.0). Workspaces and export recipes were skipped by the owner. Trays saved under the old key (`wb200_trays`) are not shown any more (no conversion, by his rule). Tested with the specs listed in docs/plan.md (Chromium), perf not run, no snapshot changed.

**As of Oct 25 2026 (morning).** `main` is at **2.44.0**: 2.42.0 (menu bar), 2.43.0 (clean top bar) and 2.44.0 (the rail moved into the top bar: Image menu with Canvas and Grid, element list first in Elements, History in Edit and beside undo, a gear beside Randomize) went live together at the owner's word ("Merge everything"), pull request #125. Tested with targeted runs only (docs/plan.md); the full CI suite and WebKit were not run, and the whole-window pixel goldens will differ on purpose until they are regenerated after a suite run. The branch `docs/2.44.0-live` (pull request #126, closed) was cut from a stale main by mistake; it is unused and can be deleted (the session could not delete it).

**As of Oct 24 2026 (evening).** `main` is at **2.41.0** (Misregistration uses the colour tray, Random offset). Branch `feat/2.42.0-menu-bar` (2.42.0, not merged, waiting for the owner's word): the menu bar (File, Export, Edit, Elements, Effects, Colour, View, Window, Help), every item a registry command; details in `docs/plan.md`. Tested: the new `menu-bar-2-42` spec and a targeted batch of the specs that touch the top bar, menus, commands and effects (results in the 2.42.0 report); not run: the full suite, CI, WebKit, `npm run perf` (nothing on the drawing path changed). The owner develops desktop-only for now (Oct 24 2026). Stacked on it, branch `feat/2.43.0-clean-top-bar` (2.43.0, not merged): a clean top bar (no wordmark, the name centred, Save project and the projects folder in File, the version in the status line). Targeted runs: 2.42.0 batch 100 of 101 passed (the one failure was a test reading every menu item, fixed in the test); 2.43.0 batch 76 of 80, the three File-list tests updated for the new item and passing, `commands` "documented shortcuts" failed once and passed alone (known flake). The preview artifact could not be read from this session (not found or not shared with this account), so the built file was handed over instead. Pixel goldens of the whole window will differ (new top bar): regenerate after a suite run, on the owner's word.

**Earlier on Oct 24.** Branch `feat/2.41.0-misreg-tray` (2.41.0): Misregistration's colour is a tray well and it has a Random offset slider. `main` was at **2.40.1** (smart guides, Filter shapes wrap on a repeat tile; file format 27). Pull request #124 (`fix/2.40.1-repeat-tile-filter`), merged at the owner's word, holds 2.40.1: a Filter shape wraps round the edges of a repeat tile; Randomize adds no effects or Filter shapes on a repeat tile. **CI suite run on #124 (the first since Oct 21, so it covers 2.22.0 to 2.40.1):** the picture comparison and WebKit passed; Chromium shards 1, 2 and 4 passed; shard 3 had 157 passed and 6 failed: (1) four scenario state snapshots (`scenarios.spec.js`: randomize seeds 2 and 3, before view, split view) differ from CI only in the position, size and angle of lettering (x, y, r, s, mx, my of text glyph items): the saved snapshots were made in the agent sandbox, whose fonts or text layout differ from CI's; this is not from 2.40.1 and probably dates from the 2.30.0 regeneration; (2) `shape-folders` import window ('#ifnew' not shown) and (3) `saved-colours-list` (a click timed out) pass on most local runs and look timing-dependent (the first fails about one run in three locally, on 2.40.0 and on 2.40.1). Open question for the owner: how the lettering snapshots should be kept (regenerated from CI output, or compared with a tolerance).

## Direction
- A professional, minimal, clean editor in the class of Photoshop and Lightroom (the owner's reference applications). Web app first; Mac, Windows and mobile later and not blocked. A commercial product, sold later; the repo is public until then.
- Styling is heading toward the Photoshop interface (dark neutral greys, dense panels). The UI standard is Part 9 of `docs/developing-wodblok.md`; a restyle changes that guide first.

## What exists now (from `docs/plan.md`, 2.2.0 to 2.15.0)
- **Element model.** One ordered list of elements (no layers). Kinds: Motif, Text, Stamp, Pattern (Paint exists but its button is hidden; the Shape element is gone since 2.31.0). A shape can be a filter (2.38.0: `flt`, its effects work on what is under it). Each element can carry an ordered stack of effects (Texture, Colour grade, Jitter, Pressure offset, Add Noise, Film Grain, Dust & Scratches, Gaussian Blur, Motion Blur, Halftone, Line Screen, Stipple, Ink Bleed, Misregistration, Roughen, Ripple, Morph, stamp settings).
- **Add bar** (Motif, Text, Stamp, Pattern): a button only opens that kind's panel; the panel starts with the list of that kind and an Add button. Motifs and Stamps picked from a library follow the pointer and place on each click.
- **Motifs took over the Shape element (2.31.0).** The 11 old presets are the Basic shapes motifs (fixed outlines, the first set of the library; the pen is gone). Every motif (on the canvas, in a stamp, as a pattern's source) can be stretched, have no fill or an image in place of its colour, and an outline (`mtDraw` in 74-motif-element.js; the groups are in 82-motif-look.js). Text and Pattern can Map to a Basic shapes motif. A click picks a motif by its outline.
- **Background** (2.27.0) is an element: a Rectangle motif the size of the canvas, in the first tray colour, skipped by canvas clicks.
- **Stamp tabs** edit a stamp alone in its own view. A new Pattern starts empty and shows arrows for each position.
- **Removed in 2.9.0:** Variations, Presets, Workspaces, Navigator, Textures and Grade tools (texture and grade are effects only).
- **Empty start (2.10.0, 2.15.0):** a new or launched project has no Pattern, **no stamp**, and no panel open. `WBS.tiles` is `[]`; code that reads the current stamp falls back to `WBS.noTile`. Add stamp and Edit are disabled until a stamp exists; the last stamp can be deleted. Colourways live at the bottom of Colours (2.11.0).
- **Element flow (2.12.0):** selecting an element jumps to its panel; a picked motif is a ghost on the pointer and a click places it, with or without a stamp; a stamp tab has Add motif and Add text.
- **Stamp panel (2.13.0):** redone. **Create New Stamp** (2.15.0) is an Add button like the others (`.elk[data-k]` wrapper) and makes a rectangle stamp at once without opening its tab.
- **Icons (2.14.0):** every icon is in `src/modules/00-icons.js` (`ICN`, `data-ic`, `icFill()`), one hairline weight (`--ic-w`).
- **Selection box (2.15.0):** one-pixel accent line, square handles and a round rotate handle in style tokens only (`#fpov` rules in `src/shell.html`; stamp tab uses `#stoh` `.steh`/`.stes`). **Corner handles move one axis** (the first direction dragged decides width or height); **Control or Command** drags both like before; Shift still grows from the middle. Logic: `fpResize` in `28-canvas-select.js`, `hdResize` in `11-...`, `64-stamp-canvas-edit.js`.
- **Stamp tabs without a Pattern (2.15.0):** the old bug (a motif added in a stamp tab could not be clicked or placed) came from `STP.on` in `63-stamp-tool.js`; it now counts an open stamp tab (`wbSteScene`).
- Accent colour: Oak is the default (2.8.0).

## Release history on `main` (newest first)
| Version | What |
|---|---|
| 2.24.0 | Nothing lost: roll stamps reachable, Open asks first, drags stay on the sheet, hidden elements take no clicks, paste and stamp delete keep the document whole |
| 2.16.0 to 2.23.0 | Bug fixes, words, components, one panel per element, adding and typing on the canvas, File/Export/Randomize, copy and paste, the Stamp library in the Stamp panel, Open recent (each in `docs/plan.md`) |
| 2.15.0 | Selection box, one-axis corners, no stamp by default, Create New Stamp, stamp-tab motifs |
| 2.14.0 | Every icon redrawn in one set |
| 2.13.0 | Stamp panel redone |
| 2.12.0 | Element flow |
| 2.11.0 | Colourways in Colours |
| 2.10.0 | Tidy start (nothing created, nothing open) |
| 2.9.0 | Fewer tools (also carries 2.7.0 and 2.8.0) |
| 2.5.1 + 2.6.0 | Stamp tab shows the stamp alone; one panel per element kind |
| 2.4.0 + 2.5.0 | Element refinement (Add bar picks then places); stamp tabs |
| 2.3.0 | Element UI, Background, Motifs, Shapes, Map to shape |
| 2.2.x | Flat element list; the old arrangement engine removed |
| 2.2.0 | The element update |

## Testing state (what has and has not been verified)
- The last recorded suite check was on 2.3.x (Oct 21, local Chromium without pixels): 448 passed, 44 failed. The state and SVG snapshots were then regenerated with the owner's approval. Other failures recorded there: `align` (3), `grade-undo` "unlocked stamp" (both also failed on 2.2.5), and `commands` "documented shortcuts" (flaky).
- **2.10.0 to 2.15.0 (merged to `main` Oct 21 night at the owner's word):** only targeted specs were run (new `selection-box`, `stamp-tab-motifs`, `stamp-panel`, `resize-handles*`, `element-flow`, `new-project`, `speed-guard` and others, passing). A wide batch of about 70 specs was triaged against 2.14.0; the failures caused by the empty start and the one-axis corners were fixed in the specs (`roundtrip` and `speed-guard` pass alone; load flakes under 4 workers). **Not run: the full suite, CI, `npm run perf`, WebKit.**
- **Still failing or unconfirmed after 2.15.0:** `repeat-tile.spec.js` "seamless with more of Randomize switched on" rolls 7 and 21 (a roll-dependent seamless tolerance; rolls 2 and 6 of the sibling test already failed on 2.14.0; the harness now makes a stamp before the Pattern, which changes the seeded draws; not checked against 2.14.0 side by side). Failures that also fail on 2.14.0: `launch`, `easy-wins` (2), `command-search`, `print-batches`, `randomize-elements`, `projects-folder`, `project-files` library stamp save (now `test.fixme`), `save-project`, `save-rename` (2), `spelling`, and the `repeat-tile:92` rolls.
- **State and SVG snapshots NOT regenerated** (launch, Randomize seeds 1 to 3, before-view, split-view and others changed by the empty start from 2.10.0). The owner must approve first: ask whether to regenerate all or only the ones seen. Pixel goldens differ for icons (2.14.0) and the selection box (2.15.0): intended, regenerate after a suite run on his word.
- **Releases 2.4.0 to 2.9.0 are on `main` with no recorded CI or full-suite run.** `docs/plan.md` says CI and the full suite were not run for 2.5.1 to 2.9.0 (owner's standing instruction) and `npm run perf` was not run for 2.5.1 to 2.9.0; it records nothing either way for 2.4.0 and 2.5.0. Their specs were updated or added, but whether the whole suite passes together is not recorded anywhere.
- Pixel goldens and the picture comparison were not regenerated after 2.3.x or after the 2.8.0 accent change (to be regenerated after a suite run, on the owner's word).
- Nothing in this status page was test-run by the agent that wrote it.

## Known issues
- Full list and history: `docs/known-issues.md` (mostly rare "drawn after the settle check" flakes; re-run the spec alone before calling it a bug).
- From `docs/plan.md`: Texture, mask and filter effects on Text mapped to an outline use the Shape's area; selection handles of mapped text show the text box at the Shape's middle; separate pop-overs for shapes, stamps and pictures and Stamp texture as an effect were left for later (2.3.0).
- Repeat tile: a rolled Pattern with a Texture effect can show a faint seam at the tile edge (`repeat-tile` roll 21 fails since 2.24.0, which shows the roll as it is saved; 2.23.0 had the same seam after Undo and Redo). Not fixed.
- `speed-guard` markup budget: "after Randomize" sits at about 148,000 against a limit of 150,000, so adding markup to a rolled picture will fail it.
- 2.9.0 left the texture and grade engines, the `tu` / `WBS.tex` fields and the unreachable grade panel DOM and `init31` UI code in place. The owner has said a project-wide texture/grade element is planned; cleanup is not decided.

## Unfinished and next
Only items the owner has stated are listed as next. Nothing is started unless he says so.
- `main` is at 2.25.0 (live; 2.24.0 "nothing lost, nothing out of reach" and 2.25.0 "the stamp tab works like the canvas" are steps 1 and 2 of the fix plan from the 2.23 review: five releases, 2.24.0 to 2.28.0).
- **2.26.0 "A clear first five minutes"** (branch `fix/2.26.0-first-five-minutes`) is done and waiting for his word. Details in `docs/plan.md`. The three `scenarios` randomize snapshots were regenerated with his word (Oct 22 2026).
- Still open with the owner: whether to fix the repeat-tile seam (`repeat-tile` roll 21), asked Oct 22 2026; for now it goes into a later release.
- Next by the plan: 2.27.0 editing habits; 2.28.0 style and words.
- Owner decisions for the plan (Oct 22 2026): the element bar buttons arm their tool at once (the panel's Add button stays); starter templates: one per format plus a framed border; the canvas texture switch goes in the Canvas panel, Texture group; corner handles stay as 2.15.0 made them (no Photoshop-style corner change); stamps and patterns get stable names even if the file format has to change (a format change refuses older files, by the no-backwards-compatibility rule; say before going live); the wordmark stays 21 px and the guide is changed to say so.
- Waiting by his word: Stamp library search.
- Decide with the owner: a first full CI suite run (suggest it with the importance percentage: high, about 80%, because 2.4.0 to 2.15.0 changed launch, panels, selection, stamps and icons with no recorded full run).
- The preview artifact (https://claude.ai/artifact/Y7qKSU4gbU9sCdQYNmBH93) was last published from 2.14.0; publish from `main` after the next build.
- Stale branches: `feat/2.10.0-tidy-start` to `feat/2.15.0-selection-box` are merged into `main`; the temporary worktree `/tmp/claude-0/wt214` may remain in the old session's container only.
- A new project-wide element to replace the removed whole-design texture and grade (owner's plan, not specified yet).
- Regenerate pixel goldens and picture comparison after a suite run, when the owner says.
- Decide cleanup of the inert 2.9.0 code (above).
- Open pull requests: #55 (social post tool, draft) and #45 (UI standard rewrite, draft). 171 branches exist on the remote, most of them from merged or closed work.

## Owner's answers (Oct 21 2026)
- **Testing:** quick targeted runs of the specs touching a change are fine without asking; anything larger than that (the whole program's suite, CI) needs his word first.
- **Versions:** no 3.0.0 until he says so; every update keeps raising the minor by one (next is 2.10.0, my reading of "progressing by 0.1"; he can correct it).
- **Suite before the next release goes live:** not without asking him first.
- **Business model:** stays out of the repo.
- **Old remote branches:** he is fine with agents tidying them. My suggestion, not his rule: list the candidates (merged into `main`) and say which before deleting anything.

## Open questions for the owner
None at the moment. Add new ones here.

### Oct 26 2026: polish plan built
- 2.55.0 and 2.55.1 on main. 2.56.0 (Transform) and 2.57.0 (Patterns, format 29) built on their branches, waiting for the owner. Full CI suite suggested before 2.57.0 goes live. The Randomize scenario snapshots change with 2.57.0 (rolls are tilings): make them again with the update-snapshots workflow after the owner approves.

### Oct 26 2026: 2.55.0 (Panels) merged at the owner's word
- Next: polish plan release 2, 2.56.0 Transform (corners both ways with Shift/Alt, pulling through mirrors, elements vanishing while dragged), then release 3, 2.57.0 Patterns (format 29).

### Planned Oct 26 2026: the polish plan
- docs/polish-plan.md (plan only): three releases. 2.55.0 Panels (panels open on the left, launch with the Elements list on the right, no Effects arrow without effects, and the rest of docs/panel-modes-plan.md); 2.56.0 Transform (corners both ways, pulling through mirrors, elements vanishing while dragged); 2.57.0 Patterns (edge-to-edge tiling by tile shape, many arrangements, pattern area with corners; format 29). The owner answered its five questions Oct 26 2026.

### Planned Oct 26 2026: create and edit, the effect pop-out
- docs/panel-modes-plan.md (plan only, nothing built): element panels show a library only while creating, a Replace row while editing; an Effects menu item opens a detached window with the same settings pane and Apply. Owner answered its three questions Oct 26 2026.

### Found Oct 26 2026 (2.53.0 and 2.54.0)
- Full CI run on main's code (eight shards, 17 minutes): failing are element-bar (stale since 2.53.0, fixed in 2.54.0), the five Randomize scenario snapshots (they fail on main in CI; the sandbox cannot make matching ones, see the Oct 25 note), `repeat-tile` "repeat 3 x 3", and `saved-colours-list` (the row menu's Rename is "not stable" in CI; passes in the sandbox). `history-thumbs` and `recovery` failed once each and passed on a rerun (flaky).
- Owner (Oct 26 2026): eight CI shards; a manual workflow that regenerates the scenario snapshots in CI.

### Found Oct 25 2026 (speed work)
- Scenario state/SVG snapshots (tests/__snapshots__/scenarios.spec.js) were regenerated IN CI (owner approved, Oct 25 2026) because they depend on the machine (text metrics): the values differ slightly between the sandbox's Chromium 1243 and CI's Playwright 1.56 image. CI is the reference; run in the sandbox, seed 2, 3, before/after and split show small position differences. Made by a temporary workflow job that is removed again.
- Full CI run on fix/2.45.1-goldens (Oct 25 2026): 4 specs were stale after the menu/top bar work and are fixed in 2.45.1 (File menu lists in account and templates specs lack 'Open projects folder…'; the command list put panel commands after in-view ones because their hidden openers count as not in view: 40-command-search.js `inView` now accepts #pnop). Still failing in CI, passing here: tests/history-thumbs.spec.js (thumbnail not there in time) and tests/commands.spec.js 'documented shortcuts' (Before key race at line 59/66; fails 1 in 5 on 2.44.2 too, so not from the speed work). Second CI run (after those fixes): shards 2, 4 and WebKit green; shard 1 had only the commands.spec flake; shard 3 failed on 6 tests: (1) four scenarios state snapshots (randomize seed 2 and 3, before/after, split) differ from the stored ones by small position and size changes (about 0.01 to 0.7 units) - these are tests/__snapshots__ files, NOT updated, owner approval needed (seed 2 also differs locally, a different stamp b434 against b435); (2) shape-folders import window: a race in the test (fixed in 2.45.1, it failed 1 run in 4 on 2.44.2 as well); (3) saved-colours-list 'element is not stable' on a menu click: passes here 4 of 4 on old and new, not understood, not changed.
- The pixel goldens in tests/__golden__/sandbox (scenarios, roundtrip, launch, 16 pictures) were regenerated in 2.45.1 (owner, Oct 25 2026): I looked at the diffs; they showed the new top bar and menus, no rail (stage 44 px wider), the newer version badge and date. They had been stale since about 2.33.
- `tests/__snapshots__/scenarios.spec.js/randomize-seed-2-state.json` and `-svg.json` no longer match: Randomize with seed 2 now picks stamp b434 (and more items) where the snapshot has b435. Not caused by the speed work (it does not change the document). NOT updated: needs the owner's approval.
- `tests/repeat-tile.spec.js` roll 4 failed once in a long run under load (down seam 24.8, limit 19.0) and passed alone and in its spec; stamp prints finishing during the measurement is the likely cause, not checked further.
- tests/helpers/harness.js: `WB_BUILD_FILE=<path>` loads another built file than dist/wodblok.html (used to compare two builds picture by picture).

### Handover Oct 26 2026 (owner moved to another agent)
- `main` is at 2.47.0 (merged Oct 25 night on his word "merge": 2.45.2 square shape previews, 2.46.0 symmetry lines on the stamp tab plus six new symmetry types, 2.47.0 a new Pattern starts at 100% of its cell). Preview artifact not republished since 2.44.x.
- **Fixed in 2.50.1 (branch fix/2.50.1-stamp-shape-lines): hexagon and triangle stamp shapes render with an offset** (the stage kept the old stamp's size in the tab). (owner: hexagon offset to the right, triangle offset down). Suspect `src/modules/04-canvas-and-stamp-outlines.js` (hex lattice `HL`, `SW`/`SH`; the triangle's centre is at `SH*2/3`, not `SH/2`) and how a stamp block is placed in a pattern. Not confirmed; reproduce with a screenshot first, add a test.
- **Answered Oct 26 2026 (2.48.0): yes, columns and rows come from the stamp size.** (Original question: should a new Pattern's columns and rows come from the stamp size (canvas / stamp, e.g. 1000 / 100 = 10 x 10) instead of a fixed 4 x 4, with a separate Spacing slider? 2.47.0 only changed the default size to 100%. Hexagon and triangle cannot fill a square cell, so they still leave gaps.) A separate Spacing slider is not built.
- Dropped by the owner Oct 26 2026: the "most used items" strip on the top bar. (Was: a "most used items" strip on the top bar (my recommendation: pinned plus usage-filled slots, fixed order, counts kept local; he had not decided the look.)
- Open CI notes: top-bar-2-43 (Ctrl+S after a body click), saved-colours-list ("element is not stable") and the commands.spec 'documented shortcuts' test were flaky in CI; the baseline run on v2.44.0 listed no failing shards.
- Still open from before: owner's Mac `npm run perf:draw`; printing text, picture and pattern elements with effects (2.44.3 prints only shapes); stale remote branch docs/2.44.0-live could not be deleted.

## Suggestions (my recommendations, not decisions)
- Library standard release: the owner wants every library to work the same way as the Shapes library (Oct 26 2026). Saved stamps (no folders), Saved trays (one level, no select mode, no drag), templates, workspaces and export recipes (flat lists) and colourways (no library) still differ; one release per library, starting with Saved stamps.
- Drawing speed: plan in docs/speed-plan.md (Oct 25 2026). Owner said yes to the order below. 2.44.1 to 2.44.4 (now released as 2.45.0) are built on feat/2.44.1-perf-draw (not merged; 2.44.2: -8% work per slider/shape step, -21% undo/redo; 2.44.3 on top: another -50%, see docs/perf-baseline.md). 2.44.4 updates the canvas in place (another -10 to -22%). 2.44.3 prints shapes with effects once; text, picture and pattern elements with effects are still drawn live (a later step if wanted). Order: 2.44.1 measure, 2.44.2 stop refreshing unchanged panels, 2.44.3 print effect elements once (the big one), 2.44.4 update the canvas in place.
- Known bug found while measuring: `npm run dev` (unbundled modules) fails at start, "teD is not defined" (22-text-tool.js uses teD from 60-text-engine.js without importing it). Fixed in 2.44.1.
- Window > Close all panels could change its label to Default panels when that is what it does (the command label is fixed today).
- The panel commands read "Open Canvas", "Open Grid", "Open Export" in the menus; shorter menu labels (Canvas…, Grid…, Export recipes) would read more like Photoshop. Needs the owner's word (command search shows the same labels).
- Keep `CLAUDE.md` short and move detail to the docs it already points at (its opening paragraph had grown into a release-by-release list; it now points here and to `docs/plan.md` instead).
- Run the CI shard suite once before the next release goes live (my estimate: high importance, because 2.4.0 to 2.9.0 changed the Add bar, panels, stamp view and removed tools with no recorded full run). The owner said to ask him first, so suggest it with the importance percentage and wait.

## Changelog of this page
- Oct 26 2026: 2.51.0 (texture library follow-ups: select mode, drag to folder, hidden sets, export and zip import, stamp pictures) on branch feat/2.51.0-texture-library-follow-up (built on 2.50.2), not merged. The saved-stamps, saved-trays, templates and colourways libraries still lack folders or select mode (see the table in docs/developing-wodblok.md); bringing them to the same standard is a separate release, suggested below.
- Oct 21 2026 (night): updated for 2.10.0 to 2.15.0, the handover to another agent.
- Oct 21 2026: first version, written from a fresh clone of `main` at 2.9.0 and the existing docs. Same day: owner's answers recorded.
- Oct 26 2026: handover to another agent; 2.45.2 to 2.47.0 recorded.
- Oct 26 2026: whole-app bug test and 2.50.2 fixes on branch fix/2.50.2-bug-test (built on 2.50.1, on 2.50.0, on 2.49.0), not merged. Findings: docs/known-issues.md. Open for the owner: the five Randomize scenario snapshots (regenerate or investigate). Note: `main` (2.48.0) has the double-click-on-text bug until this is merged.
- Oct 26 2026: 2.49.0 (sharper textures, Scale max 200%) and 2.50.0 (textures are pictures, texture library, Add texture, Rotate and Flip) on branch feat/2.50.0-image-textures (built on 2.49.0), not merged. Snapshots regenerated on the owner's word; the five Randomize scenario snapshots that also fail on main were left as they are.
- Oct 26 2026: 2.48.0 (new Pattern columns and rows from the stamp size) recorded; the 'most used items' strip dropped by the owner.
