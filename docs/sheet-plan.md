# Sheet element plan (2.53.0)

Owner, Oct 26 2026: "I want to make an element called a Sheet. It always covers the whole canvas and can't be resized. By default the background element is now a Sheet with a colour selected. Sheets also work as filters by default if they have no colour selected; by default they have no colour selected. I'd also like to be able to render an image on a Sheet." One big release, clean and in line with the guide.

Answers (Oct 26 2026): the Background is a normal Sheet (it can be moved, hidden and deleted like any other); a Sheet's effects work on everything under it **and** on its own fill when it has one; an image fits by Cover, Fit (contain), Stretch or Tile.

History: a Sheet element existed in 2.2.4 (paper colour and effects) and was replaced on Oct 20 2026 by a canvas background, then (2.27.0) by the Background Rectangle. This Sheet is new: it covers the canvas, holds a colour or an image, and filters what is under it.

## The element
- Kind `sheet` in the element registry (65-element-core.js), its own module `89-sheet-element.js`, its own panel "Sheet" (`section.pn[data-p="sheet"]`), a button on the element bar (Add sheet) and in the Add menu.
- Record: `{u, k:'sheet', n, fl, ink, a, im, iz, fx, op, bl, v, g, bgd}`. The same fill fields as a shape (`fl`: `'none'`, `'img'`, or absent for a colour; `ink`: the colour, a tray link or a fixed colour; `a`: the picture; `im`: `'contain'` (Fit), `'stretch'`, `'tile'`, or absent for Cover; `iz`: zoom %). A new Sheet has `fl:'none'`.
- Always the whole canvas (follows every canvas size, repeat tile and book cover); no size, position, turn or flip; not hit by a click on the canvas (picked from the Elements list), not in the marquee, Align, smart guides or Map to shape.
- Drawing: the fill (a rectangle the size of the canvas, or the picture fitted, clipped to the canvas). Effects (Texture, Colour grade, the filter effects): on the fill as on any element, and on everything drawn under the Sheet at its level, as a Filter shape does (the picture is kept and a copy through the effects is laid over it). Opacity is the Sheet's strength for both; blend applies to the fill.
- Panel: Add sheet at the top, then the Fill group (the Shape panel's own Fill group moves here while a Sheet is selected; it gains a Colour well for a Sheet and two more fits, Stretch and Tile; the Filter switch and Outline are not shown), then Effects.

## The Background
- A new project's Background is a Sheet with a colour: `{k:'sheet', n:'Background', ink: the paper colour (tray link), bgd:1}`. `bgd` only tells Randomize to keep it under a roll (as before) and gives the filter effects their paper colour.
- The Background follow-the-canvas code (`bgFit`, 2.33.0, 2.37.0) goes: a Sheet always covers the canvas.
- Randomize's full-canvas filter (2.39.0) becomes a Sheet with no fill named "Filter"; the smaller filter shapes stay shapes.

## File format
- Format 28 (a new element kind). A project or template made by an older WODBLOK is refused with the usual message (no conversion, owner's rule). The three test fixtures carry no Background, so they are rewritten as format 28 by a one-off test tool (their content is unchanged). The built-in starting points are made again with `npm run templates` (its picker steps updated for 2.52.0).

## Tests
- New spec `sheet-2-53.spec.js`: add, panel, fill none / colour / image with each fit, effects on what is under and on the fill, opacity, the Background is a Sheet, click goes through, delete, undo, save and open, canvas size change, repeat tile.
- Update the Background and Filter specs that assumed a Rectangle; the Randomize filter spec.
- Snapshots: list what changes and ask the owner before any state or SVG snapshot is updated.

## As built (2.53.0)
- The image fits are labelled Cover, Fit, Stretch and Tile ("Fit" is the word the Shape panel already uses for contain).
- A colour behind a picture is a second Sheet with a colour under it, not a second fill on one Sheet.
- Found on the way: a project with no stamps could not be opened again after saving; fixed in the same release.
