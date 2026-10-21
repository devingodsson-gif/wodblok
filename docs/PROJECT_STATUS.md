# WODBLOK: project status

The one page that says where development stands. **Every agent reads this after `CLAUDE.md` and updates it before finishing a session** (what changed, what was and was not tested, what is unfinished). The detail behind it lives in `docs/plan.md` (outcome of every release), `docs/known-issues.md` and `docs/agent-memory.md`. When this page and the code disagree, the code wins: fix this page.

Public repo: keep this page free of names, emails, accounts, prices and business plans (`CLAUDE.md`, "Public repo rules").

**As of Oct 21 2026.** `main` is at **2.9.0** (commit `3b32455`, tag `v2.9.0`), project file format **25** (`FMT_LATEST` in `src/format/container.js`). Working tree clean. Verified from a fresh clone: 74 files in `src/modules`, 123 spec files in `tests/`.

## Direction
- A professional, minimal, clean editor in the class of Photoshop and Lightroom (the owner's reference applications). Web app first; Mac, Windows and mobile later and not blocked. A commercial product, sold later; the repo is public until then.
- Styling is heading toward the Photoshop interface (dark neutral greys, dense panels). The UI standard is Part 9 of `docs/developing-wodblok.md`; a restyle changes that guide first.

## What exists now (from `docs/plan.md`, 2.2.0 to 2.9.0)
- **Element model.** One ordered list of elements (no layers). Kinds: Motif, Shape, Text, Stamp, Pattern (Paint exists but its button is hidden). Each element can carry an ordered stack of effects (Texture, Colour grade, Jitter, Pressure offset, Morph, stamp settings).
- **Add bar** (Motif, Shape, Text, Stamp, Pattern): a button only opens that kind's panel; the panel starts with the list of that kind and an Add button. Motifs and Stamps picked from a library follow the pointer and place on each click.
- **Shape** has 11 presets, a pen with curves, and a colour or image fill (a picture is a Shape fill, never its own element). Text and Pattern can Map to a Shape.
- **Background** is a canvas colour with a None option, not an element.
- **Stamp tabs** edit a stamp alone in its own view. A new Pattern starts empty and shows arrows for each position.
- **Removed in 2.9.0:** Variations, Presets, Workspaces, Navigator, Textures and Grade tools (texture and grade are effects only). Launch opens one built-in layout.
- Accent colour: Oak is the default (2.8.0).

## Release history on `main` (newest first)
| Version | What |
|---|---|
| 2.9.0 | Fewer tools (also carries 2.7.0 and 2.8.0) |
| 2.5.1 + 2.6.0 | Stamp tab shows the stamp alone; one panel per element kind |
| 2.4.0 + 2.5.0 | Element refinement (Add bar picks then places); stamp tabs |
| 2.3.0 | Element UI, Background, Motifs, Shapes, Map to shape |
| 2.2.x | Flat element list; the old arrangement engine removed |
| 2.2.0 | The element update |

## Testing state (what has and has not been verified)
- The last recorded suite check was on 2.3.x (Oct 21, local Chromium without pixels): 448 passed, 44 failed. The state and SVG snapshots were then regenerated with the owner's approval. Other failures recorded there: `align` (3), `grade-undo` "unlocked stamp" (both also failed on 2.2.5), and `commands` "documented shortcuts" (flaky).
- **Releases 2.4.0 to 2.9.0 are on `main` with no recorded CI or full-suite run.** `docs/plan.md` says CI and the full suite were not run for 2.5.1 to 2.9.0 (owner's standing instruction) and `npm run perf` was not run for 2.5.1 to 2.9.0; it records nothing either way for 2.4.0 and 2.5.0. Their specs were updated or added, but whether the whole suite passes together is not recorded anywhere.
- Pixel goldens and the picture comparison were not regenerated after 2.3.x or after the 2.8.0 accent change (to be regenerated after a suite run, on the owner's word).
- Nothing in this status page was test-run by the agent that wrote it.

## Known issues
- Full list and history: `docs/known-issues.md` (mostly rare "drawn after the settle check" flakes; re-run the spec alone before calling it a bug).
- From `docs/plan.md`: Texture, mask and filter effects on Text mapped to an outline use the Shape's area; selection handles of mapped text show the text box at the Shape's middle; separate pop-overs for shapes, stamps and pictures and Stamp texture as an effect were left for later (2.3.0).
- `speed-guard` markup budget: "after Randomize" sits at about 148,000 against a limit of 150,000, so adding markup to a rolled picture will fail it.
- 2.9.0 left the texture and grade engines, the `tu` / `WBS.tex` fields and the unreachable grade panel DOM and `init31` UI code in place. The owner has said a project-wide texture/grade element is planned; cleanup is not decided.

## Unfinished and next
Only items the owner has stated are listed as next. Nothing is started unless he says so.
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
- Oct 21 2026: first version, written from a fresh clone of `main` at 2.9.0 and the existing docs. Same day: owner's answers recorded.
