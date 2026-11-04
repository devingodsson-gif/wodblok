# Repeats (2.91.1 to 2.92.0)

Owner, Nov 3 2026: "Let's impliment the repeats first", then Nov 4 2026 "Do it" (the rest of the repeats update from docs/full-review-2.88.md, section B). Drops and offsets of any amount were done at the pattern level in 2.90.0 (every arrangement's own settings); the canvas repeat tile keeps Grid, Brick and Half drop.

## Steps
1. **2.91.1: Mirror repeat for the canvas tile.** Canvas > Format > Repeat gets a fourth choice, Mirror (`dim.rk = 'mirror'`): the tile is repeated flipped across every other column and flipped down every other row, so its edges always meet their own reflection and nothing has to wrap. What runs off an edge is cut there (no copies at the opposite edge); the 3 × 3 view, the exported repeat unit (2 × 2 tiles), the print file's bleed (mirrored, as before) and the mockups follow it.
2. **2.91.2: Make seamless for pictures.** An Image (or a picture fill) gets Make seamless: its edges are blended into the opposite ones (as the texture importer does) so it repeats with no seam; with the offset view (half a tile across and down) to check it.
3. **2.91.3: Real-size preview.** View > Real size shows the canvas at its printed size on the screen (from the screen's pixels per inch, which can be set in Settings > General), with the fabric or wallpaper width shown.
4. **2.92.0: closes the update** (Help, What's new, docs).
