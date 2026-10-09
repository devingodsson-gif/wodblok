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
| 4 | Export recipes | next |
| 5 | Repeat-tile export | |
| 6 | Print proof | |
| 7 | Presets | |
| 8 | Variations strip | |
| 9 | Task bar | |

## 2. Navigator, hand tool, zoom keys (v0.112)
- Navigator panel (side bar, Pattern view): the whole piece small with a frame for the visible part. Click or drag in it to move there. Zoom out/in, Fit, 100%.
- Hand tool: hold Space, press the middle mouse button, or turn on the Hand button, then drag the picture. Keys: `+` `-` zoom, `1` is 100%, `0` fits, `H` toggles Hand.
- Wheel or pinch zoom (Ctrl+wheel) now keeps the spot under the pointer fixed.

## 3. Workspaces (v0.113)
- A workspace is a saved arrangement of the tool panels: which tools are open, their tabs and where they are docked or floating, for the Pattern view and the Stamp editor.
- Save the current arrangement under a name, apply it with one click, rename, delete. Stored with your settings (not inside project files). A few starting ones: Colour work, Layout work, Everything closed.
- Launch still opens no tool windows; a workspace is only applied when you choose it. The Workspaces tool stays open (as its own group at the end) after you pick one, so the next is one click away. Commands: Open Workspaces, Save workspace. Your own saved workspaces are in the Workspaces tool, not in command search.

## 4. Export recipes (default design)
- A recipe is a saved set of export settings (format, size or scale, background, and the other choices the Export menu has). Save the current settings as a recipe, then export with one click, or run several recipes in a row ("web, print, thumbnail").
- Stored with your settings. Each recipe is a command.

## 5. Repeat-tile export (default design)
- Exports one repeat of the pattern as an image that tiles without a seam: PNG at a chosen size, and SVG. A check image shows it repeated 3 x 3 before saving.

## 6. Print proof (default design)
- A one-page proof sheet to check before printing: the piece, the repeat shown tiled, the colours used with their names and book numbers, the size, and the date. Saved as PNG or PDF.

## 7. Presets (default design)
- A preset is a saved look: palette, colour grade, textures and print effects. It does not touch stamps or layout. Save the current look, apply with one click (one undo step brings the old look back), rename, delete. Each shows a small picture of the piece when it was saved.
- The plan said "hover preview"; new code cannot depend on hovering, so a preset is applied by click and undone with Undo.
- Starting presets come from the palette book (the 348 named combinations) so you can try looks straight away. More colour books can be added later.

## 8. Variations strip (default design)
- A row of six small alternatives of the current piece, made by re-rolling what you choose (by default the colours only). Click one to apply it (one undo step). "More" makes six new ones. Nothing changes until you click.

## 9. Task bar (default design)
- A slim bar of the commands you use most. Pin any command from command search; unpin the same way. Stored with your settings.
