# WODBLOK: project status

The one page that says where development stands. **Every agent reads this after `CLAUDE.md` and updates it before finishing a session** (what changed, what was and was not tested, what is unfinished). The detail behind it lives in `docs/plan.md` (outcome of every release), `docs/known-issues.md` and `docs/agent-memory.md`. When this page and the code disagree, the code wins: fix this page.

Public repo: keep this page free of names, emails, accounts, prices and business plans (`CLAUDE.md`, "Public repo rules").

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

## Suggestions (my recommendations, not decisions)
- Window > Close all panels could change its label to Default panels when that is what it does (the command label is fixed today).
- The panel commands read "Open Canvas", "Open Grid", "Open Export" in the menus; shorter menu labels (Canvas…, Grid…, Export recipes) would read more like Photoshop. Needs the owner's word (command search shows the same labels).
- Keep `CLAUDE.md` short and move detail to the docs it already points at (its opening paragraph had grown into a release-by-release list; it now points here and to `docs/plan.md` instead).
- Run the CI shard suite once before the next release goes live (my estimate: high importance, because 2.4.0 to 2.9.0 changed the Add bar, panels, stamp view and removed tools with no recorded full run). The owner said to ask him first, so suggest it with the importance percentage and wait.

## Changelog of this page
- Oct 21 2026 (night): updated for 2.10.0 to 2.15.0, the handover to another agent.
- Oct 21 2026: first version, written from a fresh clone of `main` at 2.9.0 and the existing docs. Same day: owner's answers recorded.
