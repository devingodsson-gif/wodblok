# WODBLOK: project status

The one page that says where development stands. **Every agent reads this after `CLAUDE.md` and updates it before finishing a session** (what changed, what was and was not tested, what is unfinished). The detail behind it lives in `docs/plan.md` (outcome of every release), `docs/known-issues.md` and `docs/agent-memory.md`. When this page and the code disagree, the code wins: fix this page.

Public repo: keep this page free of names, emails, accounts, prices and business plans (`CLAUDE.md`, "Public repo rules").

**As of Oct 22 2026.** `main` is at **2.24.0** (live on wodblok.com); branch `fix/2.25.0-stamp-tab` holds 2.25.0, not merged. Project file format **25** (`FMT_LATEST` in `src/format/container.js`, unchanged since 2.9.0). 77 files in `src/modules`, 140 spec files in `tests/`.

## Direction
- A professional, minimal, clean editor in the class of Photoshop and Lightroom (the owner's reference applications). Web app first; Mac, Windows and mobile later and not blocked. A commercial product, sold later; the repo is public until then.
- Styling is heading toward the Photoshop interface (dark neutral greys, dense panels). The UI standard is Part 9 of `docs/developing-wodblok.md`; a restyle changes that guide first.

## What exists now (from `docs/plan.md`, 2.2.0 to 2.15.0)
- **Element model.** One ordered list of elements (no layers). Kinds: Motif, Shape, Text, Stamp, Pattern (Paint exists but its button is hidden). Each element can carry an ordered stack of effects (Texture, Colour grade, Jitter, Pressure offset, Morph, stamp settings).
- **Add bar** (Motif, Shape, Text, Stamp, Pattern): a button only opens that kind's panel; the panel starts with the list of that kind and an Add button. Motifs and Stamps picked from a library follow the pointer and place on each click.
- **Shape** has 11 presets, a pen with curves, and a colour or image fill (a picture is a Shape fill, never its own element). Text and Pattern can Map to a Shape.
- **Background** is a canvas colour with a None option, not an element.
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
- `main` is at 2.24.0 (live, "nothing lost, nothing out of reach", step 1 of the fix plan from the 2.23 review: five releases, 2.24.0 to 2.28.0).
- **2.25.0 "The stamp tab works like the canvas"** (branch `fix/2.25.0-stamp-tab`) is done and waiting for his word. Details in `docs/plan.md`.
- Still waiting for his word from 2.24.0: regenerating the `scenarios` randomize snapshots (seed 1 and 2 state: one text id; seed 3 SVG summary) and whether to fix the repeat-tile seam (`repeat-tile` roll 21).
- Next by the plan: 2.26.0 first five minutes; 2.27.0 editing habits; 2.28.0 style and words.
- Owner decisions for the plan (Oct 22 2026): the element bar buttons arm their tool at once (the panel's Add button stays); starter templates: one per format plus a framed border; the canvas texture switch goes in the Canvas panel, Texture group; corner handles stay as 2.15.0 made them (no Photoshop-style corner change); stamps and patterns get stable names even if the file format has to change (a format change refuses older files, by the no-backwards-compatibility rule; say before going live); the wordmark stays 21 px and the guide is changed to say so.
- Waiting by his word: Stamp library search.
- Decide with the owner: snapshot regeneration (above), and a first full CI suite run (suggest it with the importance percentage: high, about 80%, because 2.4.0 to 2.15.0 changed launch, panels, selection, stamps and icons with no recorded full run).
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
- Keep `CLAUDE.md` short and move detail to the docs it already points at (its opening paragraph had grown into a release-by-release list; it now points here and to `docs/plan.md` instead).
- Run the CI shard suite once before the next release goes live (my estimate: high importance, because 2.4.0 to 2.9.0 changed the Add bar, panels, stamp view and removed tools with no recorded full run). The owner said to ask him first, so suggest it with the importance percentage and wait.

## Changelog of this page
- Oct 21 2026 (night): updated for 2.10.0 to 2.15.0, the handover to another agent.
- Oct 21 2026: first version, written from a fresh clone of `main` at 2.9.0 and the existing docs. Same day: owner's answers recorded.
