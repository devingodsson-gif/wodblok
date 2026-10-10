# UX review 2 (build 1.0.17, review only, no app code changed)

Method: Playwright on the built 1.0.17 (dark and light, 1440×900 and 1280×720), first-time-user path: launch → Add a motif → Stamp editor → drop a motif → Layers → Randomize → History → Colours → Presets → Canvas → command search → File menu → Export. Screenshots in `docs/ux-review-2/` (01–17).

## Verdict
The first minute is now clean and the big problems from review 1 are gone. What is left is mostly polish, plus the items we deliberately deferred.

## Confirmed good
- Launch: no panels open, Pattern mode, empty canvas, one clear "Add a motif" button, no unsaved dot (01, 16).
- Stamp editor opens with the library; dropped motif shows four corner handles and a rotate handle (02, 03).
- Layers "+" menu is a plain list of five types (05).
- Randomize has 0–100 sliders, Colours keeps its toggle (06).
- History has thumbnails, A/B compare and a default compare against the previous step (08).
- Export tool is the only place for images; File menu is short: New project, Clear canvas, Open project (13, 14).
- Light theme is consistent (15). Small screen: tray collapses and the canvas refits (16, 17).
- Roll takes about 4 s here (software rendering, no GPU); not a regression we can judge in this environment.

## Still wrong / new findings
| # | Severity | Finding | Where |
|---|---|---|---|
| N1 | Medium | Panel tabs overflow: with four panels open the tab "Colours" is cut to "Colou" and the rest hide behind the chevron. This is the P2 item we skipped (stacked panels instead of tabs). | 09–11 |
| N2 | Medium | Explanatory text still in panels, against the "no explanatory text" rule: Randomize "Last roll: new symmetry + …" paragraph, Colours "Clicking a colour sets", Stamp editor import section ("1. Subject for the prompt", "or drop / paste", "Paste here"). | 02, 07, 09 |
| N3 | Medium | Export panel has two overlapping sets of buttons: "Export now" (PNG/JPG/SVG tabs) and "PNG image 3× size / SVG vector / Copy SVG code / Export all as one zip". Unclear which to use; "3× size" is in a monospace font unlike everything else. | 14 |
| N4 | Low | History: only the newest row has a thumbnail; older rows show none. All rows say "now". "Snapshots" has a bare "+" with no label. | 08 |
| N5 | Low | Left rail has 15 icons with no labels (names only on hover). Fine for repeat users, hard for a first-timer; nothing is hover-only for function, but discovery is. | all |
| N6 | Low | Top bar "Open projects folder", "File" are plain text, not button-shaped; only Save project looks clickable. | 04 |
| N7 | Low | Canvas panel: "Rectangle" label touches the edges of its button; Width/Height boxes are tiny and right-aligned. | 11 |
| N8 | Low | Randomize at 100% on a fresh canvas gives black ink on pink with heavy texture; sliders at 0 for Layout/Shape/Size/Opacity are the defaults but not obvious as "off". Generator quality, not layout. | 07 |
| N9 | Low | Status bar message after Randomize is long and truncated ("…Ctrl+Z brings back the …"). | 07 |
| N10 | Low | Presets "Looks" thumbnails all look nearly the same (two shapes on cream), so they don't help choosing. | 10 |

## Status of review 1 items
Fixed: B1–B4, C1–C20 except those below, P1, P3, P4, D1–D12, D14–D19.
Still open: **D13** (Textures tool as library / apply where you work), **D4** (Art layer "Paper shows through"), **P2** (stacked panels, now N1), per-slot hex field in the colour dropdown, handles beyond the Stamp editor, Grade "Hold to compare" (declined), delaying the "Opened…" message (C5 part).

## Recommended next (1.0.18+, in order)
1. **1.0.18 Text and panels:** remove the explanatory text in N2 (keep behaviour), label the Snapshots "+", tidy N7, merge the duplicate export buttons (N3, needs your OK on which set stays).
2. **1.0.19 Tabs:** fix N1 (tab labels never cut; stack or scroll).
3. **1.0.20 History/top bar polish:** N4, N6.
4. D13 and D4 only if you still want them.

## Questions
- N3: keep "Export now" with the format tabs, and drop the second button group?
- N1: stack panels (bigger change) or just let the tab strip scroll (small)?
- Do you still want D13 and D4?
