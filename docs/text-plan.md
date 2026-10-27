# Text plan: simpler text, box-first sizing, more fonts, real styling

Owner, Oct 27 2026 (by voice): "the text system is a little too complicated: a lot of sliders and settings, and a lot of them don't do anything." Keep saved text styles; 80 to 100 fonts by default plus importing a font; standard editor options (highlight, underline, italic, strikethrough, bold); ways to morph the text (curve, wave, spiral, round a circle); paragraph options. "Text sizing is complicated: when you create a text, whatever the box size is, the text fits to that size, and we adjust the box by dragging the four corners and the four sides."

Status: answered (owner, Oct 27 2026, below); release 1 (2.63.0) live; release 2 (2.64.0) built. Shape: Circle is an Arc at 100%; Fit to a shape stays its own group (Map to shape).

## What is there today (2.62.0)
One long Text panel: Font, Size, Letter / Word / Line spacing, Box width, Box height, Padding, Fit to box, Overflow, Align, Vertical, Case, First-line indent, Paragraph spacing, Balance lines, Letter size / raise / spacing / colour with Super, Sub, Clear, Curve, Warp and Warp amount, Path with amount and length, Rotate letters, Random position / rotation / size, Bounce, Scatter, Ink; then Text styles and Map to shape. 34 bundled fonts (about 1 MB) and Load a font file. The handles on the canvas scale the letters; the box is set by sliders.

## Box-first sizing (the owner's idea; recommended)
- A text is a box. Placing a text makes a box of a set size; the letters always fit the box (the largest size at which every line fits, the engine's existing "Fill the box"). Typing more makes the letters smaller; a bigger box makes them bigger.
- Eight handles: corners and sides change the box (Shift keeps its proportions, Alt from the middle), the round handle turns it. The letters are never stretched.
- The Size slider, Box width and height, Padding, Fit to box and Overflow leave the panel.
- Why it is better: one way to size a text instead of four, and it works like the other elements (pull the box). The cost: two texts of different lengths in same-size boxes get different letter sizes; Fixed size covers that.

## The panel after the plan (top to bottom)
1. **Style**: the saved Text styles library (kept as it is).
2. **Character**: Font (about 90 fonts with search and categories, Import font); a row of toggle buttons Bold, Italic, Underline, Strikethrough, Highlight (with its colour); Case; Colour; Letter spacing. They act on the selected letters, or the whole text when none are selected (as Letter colour does since 2.62.0).
3. **Paragraph**: Align (left, centre, right, justify), Vertical (top, middle, bottom), Line spacing, Paragraph spacing, First-line indent.
4. **Shape**: one choice: None, Arc, Circle, Wave, Spiral, Bulge, Rise, Flag, Fit to a shape (today's Map to shape); one Amount slider, and Length only where it matters. Replaces Curve, Warp, Path and Map to shape's separate groups.
- Removed: Word spacing, Balance lines, Letter size and raise with Super / Sub (super and subscript can come back as two toggles if wanted), Rotate letters, Random position / rotation / size, Bounce, Scatter (the Jitter effect does random letters already), and every slider the audit finds doing nothing.

## Releases (each raises the minor; steps are patches)
1. **2.63.0 Box-first sizing.** Eight handles change the box; letters fit it; the box sliders, Size, Padding, Fit and Overflow go. Touches the text format: file format 30, older files refused (no backwards compatibility). Perf and broader text tests.
2. **2.64.0 The new panel.** Audit every text control on canvas texts and in a stamp's tab; regroup into Style, Character, Paragraph, Shape; one Shape picker; remove what is listed above. Text styles saved before are refused or reset (they hold the removed fields).
3. **2.65.0 Character styles.** Bold, Italic, Underline, Strikethrough, Highlight on selected letters (letter runs, as Letter colour). Bold and italic use the font's own bold and italic where it has them, else a drawn bold (thickened outline) and a slanted italic; underline, strikethrough and highlight are drawn per line under the letters.
4. **2.66.0 Fonts.** About 90 fonts (all OFL, Google Fonts), grouped (serif, sans, slab, display, script, blackletter, handwritten, mono) with a search; bold and italic files for the families that have them. Import font stays. Adds about 3 to 5 MB to the app (34 fonts are about 1 MB today; the app is 13.6 MB).

## The owner's answers (Oct 27 2026)
1. Box-first: "your choice, it should be as simple as possible": letters always fit the box, no Fixed size switch.
2. Fonts are built into the app.
3. Real bold and italic font files ("I'm fine with a bigger file size").
4. Random letters are done with the Jitter effect: the random letter sliders go.
5. A stamp's tab gets the same simplification.

## Questions for the owner
1. Box-first: letters always fit the box, plus a Fixed size switch for matching sizes? Or fit only, no switch?
2. Fonts: bundle them all in the app (bigger download, works offline, no network) or fetch fonts from wodblok.com when first used (smaller app, needs an exception to the no-network rule)?
3. Bold and italic: real font files where the family has them and a drawn fallback otherwise, or drawn only (smaller, not as good)?
4. The random letter sliders (position, rotation, size, bounce, scatter): remove them (Jitter effect covers it), or keep them in the Shape group?
5. Stamps: a stamp's tab uses the same Text panel. Same simplification there?
