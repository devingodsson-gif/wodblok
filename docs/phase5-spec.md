# Phase 5: what each feature is (defaults chosen where the plan only had a name)

The plan listed Phase 5 as names only (Variations strip, Presets, task bar, navigator/zoom/pan, command search, workspaces, export recipes,
repeat-tile export, print proof). Each feature below says what it does today or what it will do. Correct any of them and it changes in the
next release. One feature per release, in this order. Rules that hold for all of them: no explanatory text in panels, nothing hover-only,
commands in the registry (so command search finds them), no tool windows open at launch, old files always open.

| # | Feature | State |
|---|---|---|
| 1 | Command search (Ctrl/Cmd+K) | done, v0.109 |
| 2 | Navigator, hand tool, zoom keys | done, v0.112 |
| 3 | Workspaces | done, v0.113 |
| 4 | Export recipes | done, v0.114 |
| 5 | Repeat tile (a canvas format) | done, v0.115 |
| 6 | Print proof | done, v0.116 |
| 7 | Presets | done, v0.117 |
| 8 | Variations strip | done (v0.118) |
| 9 | Task bar | done, v0.119 |

## 2. Navigator, hand tool, zoom keys (v0.112)
- Navigator panel (side bar, Pattern view): the whole piece small with a frame for the visible part. Click or drag in it to move there. Zoom out/in, Fit, 100%.
- Hand tool: hold Space, press the middle mouse button, or turn on the Hand button, then drag the picture. Keys: `+` `-` zoom, `1` is 100%, `0` fits, `H` toggles Hand.
- Wheel or pinch zoom (Ctrl+wheel) now keeps the spot under the pointer fixed.

## 3. Workspaces (v0.113)
- A workspace is a saved arrangement of the tool panels: which tools are open, their tabs and where they are docked or floating, for the Pattern view and the Stamp editor.
- Save the current arrangement under a name, apply it with one click, rename, delete. Stored with your settings (not inside project files). A few starting ones: Colour work, Layout work, Everything closed.
- Launch still opens no tool windows; a workspace is only applied when you choose it. The Workspaces tool stays open (as its own group at the end) after you pick one, so the next is one click away. Commands: Open Workspaces, Save workspace. Your own saved workspaces are in the Workspaces tool, not in command search.

## 4. Export recipes (v0.114)
- A recipe is a saved set of export settings: format (PNG, JPG or SVG), the long side in pixels (256 to 8192), and an ending added to the file name. The Export recipes tool (side bar) has the current settings, "Export now", and "Save recipe".
- Click a recipe to export with it (its settings also load into the fields). Starting points: Web (PNG 2048 px), Print (PNG 6000 px), Preview (JPG 800 px). Yours can be renamed and deleted. "Export all as one zip" makes every recipe in a single file.
- Stored with your settings. The Export menu in the top bar is unchanged. Commands: Open Export recipes, Export with the recipe settings, Export all recipes as one zip.

## 5. Repeat tile (v0.115, a canvas format instead of an export)
- Canvas > Format has a third choice, Repeat tile: a rectangle (the ratio controls stay) whose edges meet. Saved with the canvas (`dim.rt`), undoable. Exports (also Export recipes) give the tile.
- Grids stretch or squeeze a little so a whole number of cells fills the tile each way (staggered grids use an even number); each cell's look comes from its place within one repeat. Loose layers (free-placed stamps, pictures, text) are drawn again one tile over each way. Canvas and layer textures are blended with a half-shifted copy so their edges meet; print roughness uses noise that repeats.
- Not drawn on a repeat tile: frames and gradients across the whole canvas (a note in the Canvas tool says how many). Layer rotation is ignored. Randomize leaves the tile's shape alone and adds no frame.
- v0.115.1: a layer coloured by a layer colour mask or a layer wear texture used to be cut to the middle tile (its grade area and texture filter only covered the canvas); both now reach past the edges and repeat.
- "Repeat 3 × 3" (top bar, only on a tile) shows the tile repeated so seams can be checked; nothing can be edited in that view.

## 6. Print proof (v0.116)
- In the Export recipes tool, under "Print proof": choose Letter or A4, then PDF or PNG (150 dpi). One portrait page: the project name, the date and app version, the piece (on a repeat tile: the single tile beside the tile repeated 3 × 3), the colours as swatches with their names and hex values, the palette's name and its number in Wada's book when it is one of the 348 combinations, the canvas ratio (or the print cover size and 300 DPI pixels), and the stamp and layer counts. Commands: Print proof (PDF), Print proof (PNG).

## 7. Presets (v0.117)
- The Presets tool (side bar, both views) has two parts. **Looks:** a look is a finish: the palette, colour grade, canvas texture and print effects. It never touches stamps or layout, and applying one is one undo step. Starting looks: Soft cotton, Strong ink, Worn block, Faded linen, Warm riso, Clean (they leave the palette alone). "Save look" keeps the current finish under a name with a small picture of the piece; rename and delete; kept with your settings (grade masks tied to a layer or stamp stay with that piece).
- **Palettes:** all 348 combinations of Wada's book with their names, as a searchable list (by name, colour or number). One click sets the palette and moves each ink the stamps and layers use to the same place in the new palette (paper, ink, 3rd, 4th); inks from outside the palette spread over the new accents.
- The plan said "hover preview"; a click applies and Undo takes it back, so nothing depends on hovering. More colour books can be added to the list later. Commands: Open Presets, Save look.

## 8. Variations strip (default design)
- A row of six small alternatives of the current piece, made by re-rolling what you choose (by default the colours only). Click one to apply it (one undo step). "More" makes six new ones. Nothing changes until you click.

## 9. Task bar (default design)
- A slim bar of the commands you use most. Pin any command from command search; unpin the same way. Stored with your settings.
