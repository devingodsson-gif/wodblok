# Pattern plan (Oct 29 2026)

Owner, Oct 29 2026: "WODBLOK is primarily a pattern making tool. What are some improvements or additions we could make for the patterning to be more useful and prevalent", then "make a plan that encompasses everything you just mentioned, plus all the items that would improve the user experience from the test before" (the 2.76 review: Project doc `claude/wodblok-review-2.76.md`; bugs B1 to B4 were fixed in 2.76.2).

Status: **started Oct 29 2026 (steps 0 to 4 built, 2.76.3 to 2.76.7, 2.76.6 live; step 2 without misregistration per piece).** Testing (owner, Oct 29 2026): no CI and no full suite until the end of the plan; only quick, targeted local tests on the way. The owner answered every question on Oct 29 2026 (below). Mockups are shelved for later.

## What patterns already do (2.76.2)
- Tiling by a tile shape (From stamp, Square, Hexagon, Triangle, Diamond, Circle, Octagon) with 19 arrangements; Size, Spacing, Rotate, Shift (92-pattern-tiling.js).
- Radial, Scatter and Frame layouts; Map to a Basic shapes motif (77-map-to-shape.js).
- Sources: stamps, motifs (with their own look) and text, chosen by Cycle, Random or Weight, from a seed.
- A pattern area with sides and corners, cut at its edge; the repeat-tile canvas (seamless, Repeat 3 x 3 view).
- Effects on a Pattern reach every piece. **Jitter** already gives each piece its own nudge, turn, size and flips; Misregistration and Pressure offset exist as effects.
- Speed limit to respect (docs/randomize-plan.md): a Pattern with Pressure offset or Texture draws each piece on its own (up to 7 million characters in tests). Every per-piece feature below must stay inside the stamp's single print, or be measured with `npm run perf` (no regression over 10%).

## Releases
One update (owner, Oct 29 2026: "roll it into one update"; his standing rule: a plan of several steps is one update). Each step raises the patch, 2.76.3 to 2.76.12, one theme each; the minor rises once, to **2.77.0**, when the whole plan is done. The Randomize plan's open steps are step 0.

### Step 0 — 2.76.3: Randomize finished (docs/randomize-plan.md steps 2 to 4, as one update)
Step 1, the Looks, is live (2.74.1). The rest, which the owner answered on Oct 28 2026:
- **The simple panel:** a Look choice (Any, or one of the eight Looks) and switches for Background, Pattern, Focal point, Text, Frame, Colours, Effects, Finish and Canvas size, replacing today's long list of sliders.
- **Looks everywhere:** a roll with Stamps off, on a Book cover and on a repeat tile uses a Look too, so the **old roller is removed** (one roller, one code path).
- **Tests:** the `randomize-*` specs, `text-randomize`, `repeat-tile`, `nothing-lost-2-24` and `motif-look-2-31` rewritten for the Looks; a coverage test (many seeds give a wide variety of Looks and layouts, nothing empty, nothing off the canvas, speed within the limit); the Randomize scenario snapshots regenerated in CI **with the owner's approval** (the rolls change).
- `npm run perf` (a roll stays at most about 400,000 characters of `#dyn` markup). Suite: about 70% (Randomize touches drawing, every element kind and the document). Docs: docs/randomize-plan.md marked done.

### Step 1 — 2.76.4: Review fixes (the small bugs left from the 2.76 review)
- B5: at 1024 px the menu bar runs over the project title, and the Randomize number boxes overlap their "All" menus.
- B6: Radial and Scatter label their controls "Columns" and "Rows" (Radial: Spokes and Rings; Scatter: Count).
- B7: the Image panel's picture row is out of line (thumbnail on the panel edge, Replace outside the padding).
- B8: Export panel: "Export now" at the top so it is never cut off; "px" no longer overlaps the Long side value.
- B9: Point crop says nothing about how to start (click to add points), and fewer than 3 points are dropped silently: the Enter key stays greyed until there are 3.
- B10: Ctrl+D puts the copy on top of the original; it gets the same offset as Ctrl+V.
- B11: Randomize names stamps by a running count ("Stamp 4" in a project with one): it takes the next free number.
- B12: the Pattern button in a stamp tab opens an empty panel: it is greyed there (a stamp holds no Pattern).
- Stamp shape icons: Arch and Lancet look the same at that size, and Octagon looks like a circle.
- Tests: one per bug. Suite: about 20% (UI only).

### Step 2 — 2.76.5: Pieces look hand-printed
- **Turn in steps:** Jitter's turn can be Free or in steps of 90° or 180° (a square stamp turned at random, the way a printer turns the block).
- **Colour per piece:** a pattern's pieces take their ink from a tray or a colourway, **by place** (a Checkerboard's two colours from one stamp, a Diagonal's stripes, Three colours on a honeycomb) or **at random** (weighted, from the seed). A stamp's two-colour runs keep their roles.
- **Ink per piece:** pressure (how full the print is) and opacity vary from piece to piece by an amount, from the seed.
- **Overprinting:** where pieces overlap they multiply like real ink (a Blend between pieces, not only with what is under the pattern).
- **Misregistration per piece:** each piece's colour layers shift by their own small amount.
- File format 30 (new fields on the Pattern; older files refused, no conversion; say before going live).
- Tests: by-place colours on Checkerboard and Honeycomb, random colours repeatable by seed, turn steps, overprint pixels, format 30 saved and opened, 29 refused. `npm run perf`. Suite: about 85% (drawing, the file format, Randomize).

### Step 3 — 2.76.6: Patterns you can print and sell
- **Physical canvas size:** px, in or mm with a DPI, for every canvas (today a ratio, except Book cover). The ratio stays as the quick choice.
- **Physical piece size:** a pattern's Size as "2 in" or "50 mm" once the canvas has a physical size.
- **Export the repeat:** one seamless repeat unit (grid, brick and half-drop repeats exported correctly) at the canvas's physical size and DPI, as PNG or TIFF, the files fabric and wallpaper printers ask for.
- **Export panel tidy:** one Export entry in the menu (today Export…, Open Export and Export with the recipe settings); file names follow the project name (today always `wodblok-pattern.*`); a PDF of the artwork itself (today only Print proof).
- Tests: physical size round trip, repeat export is seamless when tiled 2 x 2 (pixel edges match), file name, PDF opens. Suite: about 70% (export, the file format).

### Step 4 — 2.76.7: More arrangements and edges
- **Scatter without overlaps:** a minimum distance between pieces (even spacing that still looks hand-placed).
- **New layouts:** Stripes and bands (rows alternate sources), Ogee, Fish scale, Herringbone, Chevron, Spiral (sunflower).
- **Wallpaper symmetries:** the 17 wallpaper groups (Mirror covers one today), each named plainly with a small preview.
- **Edges:** whole pieces only, or pieces cut at the area (today), and a margin inside the area.
- Tests: no two Scatter pieces closer than the distance; each layout places pieces; whole-pieces mode has none crossing the edge; repeat-tile seamless for each new layout. `npm run perf`. Suite: about 60%.

### Step 5 — 2.76.8: The first minute
- **Starter content:** a few built-in stamps drawn from the built-in shapes (owner: "draw them for now") and the starter templates the owner set on Oct 22 2026 (one per format plus a framed border). The template picker then opens at launch again (owner: yes).
- **Element buttons place something:** the Shape button arms the last shape (else a rectangle) at once, as it does in a stamp tab and as the owner decided on Oct 22 2026; the panel's Add button stays.
- **A new Pattern starts ready:** it takes the selected stamp or motif, or the project's only stamp, as its source, and goes just above the Background instead of over everything.
- **Make pattern:** a right-click and Element menu item on a selected stamp or motif.
- **Fewer controls with nothing selected:** the Shape panel shows only the library until a shape exists; Width and Height sit beside Size.
- **Wording:** the title reads "Untitled project"; "No shapes yet" becomes "No elements"; New project offers to save first.
- **Panels:** the canvas no longer jumps sideways when the left column opens; panel tabs that pile up past four fold into a menu instead of scrolling.
- Tests: launch with starter content, Shape places at once, new Pattern's source and place, Make pattern, the save-first prompt. Suite: about 50% (launch, panels).

### Step 6 — 2.76.9: Patterns inside shapes, and density
- **A pattern inside any shape or letter:** fill a motif, a Sheet's shape or a text with pieces, cut at its outline (today the area is a rectangle and Map to shape puts pieces along the outline).
- **Density from a picture or gradient:** pieces grow, shrink and thin out (owner: both, "the more variety the better") with an image's light and dark (a halftone made of stamps), or fade across the area.
- Tests: pieces only inside the outline, follow the outline when it moves; density follows a two-tone picture. `npm run perf`. Suite: about 70%.

### Step 7 — 2.76.10: Editing pieces, and patterns of patterns
- **Edit one piece** (owner: "whatever you think is right", plus making it its own element): click a piece to delete it, swap it for another source, recolour it, or move and turn it; the rest stays generated, and the change is kept when Size or Spacing changes (a piece is known by its place). **Make into its own element:** the piece leaves the pattern and becomes an ordinary Stamp element (a Motif or Text for those sources) at the same place, size, turn and colour, one history step; its place in the pattern stays empty.
- **A pattern as a source** of another pattern.
- **An accent layer:** a second set of pieces between the main ones (what Randomize's accents do today), set by hand.
- Tests: an edited piece survives a Size change and Undo; nesting draws; accents sit between pieces. Suite: about 70% (the file format if piece edits are stored).

### Step 8 — 2.76.11: Patterns library
- **Patterns library:** saved patterns reused across projects, on the shared library tree (`ltMake`: folders, Move to, Export, Import), like stamps, trays and colourways.
- Tests: save, reuse in a new project, export and import the library. Suite: about 40%.

### Step 9 — 2.76.12: For experienced users
- **Edit and right-click menus:** Bring forward and Send backward, Lock, Hide, Rename, Select all, Deselect, Group in the right-click menu.
- **Command search** covers every menu item and panel action (rotate, flip, canvas size, hide, lock, order, font, select).
- **Navigation:** Ctrl+wheel zooms in clear steps; the middle button pans.
- **Menus:** Image and Sheet panels in the Window menu; the Image menu gets more than Open Canvas and Open Grid.
- **History names the step:** "Moved Diamond", "Halftone on photo" instead of "Changed element".
- **Crop and Point crop** for pictures in shapes, Sheets and stamps (open since 2.74.2).
- **Randomize and your elements:** your title takes the Look's title place instead of being avoided, and your text keeps a readable contrast after a roll (2.76.2 only keeps the roll clear of your elements).
- Tests: each menu item, search finds each action, history names, crop on a Sheet picture. Suite: about 40%.

## Owner's answers (Oct 29 2026)
1. Order: the Randomize plan's open steps go first, inside this one update ("already told you": "roll it into one update").
2. The step order is right ("yes").
3. Once starter templates exist, the template picker opens at launch again ("yes"; step 5 turns Settings > General > Templates at launch on by default and rewrites the Never-break rule in CLAUDE.md).
4. Starter stamps: drawn from the built-in shapes for now ("yeah sure draw them for now").
5. Density from a picture: both bigger and smaller pieces and fewer pieces ("both, the more variety the better").
6. Editing one piece: "whatever you think is right", so all four (delete, swap, recolour, move and turn), and also making a piece its own Stamp element.
7. Mockups: "ignore mockups for now and shelve it for later". Out of this plan; kept under Suggestions in docs/PROJECT_STATUS.md.
8. The project title: "Untitled project" ("Untitled Project is fine").
