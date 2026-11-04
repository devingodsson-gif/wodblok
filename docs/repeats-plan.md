# Repeats (2.91.1 to 2.92.0)

Owner, Nov 3 2026: "Let's impliment the repeats first", then Nov 4 2026 "Do it" (the rest of the repeats update from docs/full-review-2.88.md, section B). Drops and offsets of any amount were done at the pattern level in 2.90.0 (every arrangement's own settings); the canvas repeat tile keeps Grid, Brick and Half drop.

## Steps
1. **2.91.1: Mirror repeat for the canvas tile.** Canvas > Format > Repeat gets a fourth choice, Mirror (`dim.rk = 'mirror'`): the tile is repeated flipped across every other column and flipped down every other row, so its edges always meet their own reflection and nothing has to wrap. What runs off an edge is cut there (no copies at the opposite edge); the 3 × 3 view, the exported repeat unit (2 × 2 tiles), the print file's bleed (mirrored, as before) and the mockups follow it.
2. **2.91.2: Make seamless for pictures. Done Nov 4 2026.** The Image panel's Seamless group: Make seamless turns the selected Image's picture into a new one whose edges fade (Blend: how far in, 25% by default) into the picture moved half across and half down, so its opposite edges meet; the middle stays. One History step; the old picture stays in Pictures. No separate offset view: an Image stretched to a repeat tile is checked in View > Repeat tile's 3 × 3 view (the review's idea; not built).
3. **2.91.3: Real-size preview. Done Nov 4 2026.** View > Real size (`view.realSize`) zooms the canvas to its printed width times the screen's pixels per inch (Settings > General > Screen resolution, 60 to 300, 96 by default). Not built: the fabric or wallpaper width drawn beside it (the Mockup panel's Real size shows the repeat on a product instead).
4. **2.92.0: closes the update** (Help, What's new, docs).
