# Mockups (2.90.1 to 2.91.0)

Owner, Nov 3 2026: "Let's do mockups". His answers: all four product groups (fabric and cushion, wallpaper on a wall, clothing, paper goods); a **Mockup panel, live**; people's **own photos in the first release** (bring in a photo, drag four corners onto the print area, like a Photoshop smart object); the built-in product photos are **made by the owner in ChatGPT** from prompts that match (plain white print area, front-on, even light) and attached here.

## How a mockup works
- A mockup is a photo and its print area: four corners (a quad) on the photo, kept as fractions of its width and height.
- The design is the canvas as it is exported (`ser()`), drawn flat at the size of the print area: **Repeat** lays it side by side (on the repeat tile's own lattice: grid, brick or half drop) with **Scale** the width of one copy in % of the print area; **Once** places it in the middle with Scale its size in % of the print area.
- The flat picture is warped onto the quad (a perspective map, drawn as small triangles), multiplied by the photo's light (its greyscale, made white at the print area's brightest) by **Shading** (0 to 100%), and cut to the quad. The photo shows everywhere else.
- The panel shows it live: it is made again a moment after the design changes while the panel is open. **Edit corners** shows the quad's four squares on the view (pointer events; the same look as the crop's squares).
- **Export mockup** saves a PNG at the photo's own size.

## Where things are kept
- Your mockups are a library on the shared folder tree (Part 9, section 12), as cards: Yours, your folders, the built-in sets. The photos are kept in this browser (IndexedDB, through `collection('mockups')`); names, folders, corners and a small picture in `kv` (`wb2901_mockups`). The mockup in use and the panel's settings in `wb2901_mockui`.
- Nothing is saved in the project: the file format does not change.

## Steps
1. **2.90.1: the Mockup panel and your own photos.** Window > Mockup (`panel.mock`), Export > Export mockup (`export.mockup`); Add mockup, the library, the live view, Fill (Repeat / Once), Scale, Shading, Edit corners, Export mockup. Test: tests/mockups-2-90-1.spec.js.
2. **2.90.2: the built-in products. Done Nov 4 2026 with six (T-shirt, tote bag, cushion, fabric, wallpaper, notebook); gift wrap and phone case when their photos come.** The owner's eight photos (fabric, cushion, wallpaper, T-shirt, tote bag, gift wrap, notebook, phone case), compressed to about 200 KB each, each with its print area: a traced outline (not only four corners) and, for the curved ones (fabric, cushion, T-shirt), a gentle warp that follows the folds. A built-in set, Products, in the library. Real-size Scale where the product's size is known and the canvas has one (Canvas > Format).
3. **2.91.0: closes the update** (Help, What's new, docs). Done Nov 4 2026.

## Open questions
- The owner's photos become public when committed while the repo is public (told him Nov 3 2026).
- The app grows by about 1.6 MB with the photos; the preview artifact is already over its 16 MB limit (17.8 MB at 2.90.0).
