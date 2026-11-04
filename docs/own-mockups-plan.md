# Your own mockups, as good as the built-in ones (2.92.2 to 2.93.0)

Owner, Nov 4 2026: "I want to give it a photo and it generates the mask with a tolerance slider to help". Until now your own mockups had only four corners: the design covered the background around anything that is not a flat rectangle, did not follow folds and had no Real size.

## Steps
1. **2.92.2: Find product.** Add mockup finds the product in the photo and makes its mask in the browser: the background's colours are read from the photo's border, every pixel is measured against them (colour counts more than light, so a white product on a pale wall is still found), Tolerance (0 to 100) sets how different a pixel must be to be product; the largest part is kept and its holes filled (the product's own pale or shaded parts), and the edge is softened by a pixel. The corners are set to the product's box. It cannot tell a wall that fills the photo from the things in front of it (on a wallpaper photo it finds the sideboard): for those, Find product off and the corners. The Mockup group shows Find product (on by default for a new mockup) and Tolerance for your own mockups; the mask is kept with the photo in this browser.
2. **2.92.3: Folds and Real width for your own mockups. Done Nov 4 2026.** A Folds slider (how much the design follows the photo's folds) and a Real width field (the print area's width, in the units of Settings > General) so Real size works for them too.
3. **2.93.0: closes the update** (Help, What's new, docs). Done Nov 4 2026.
