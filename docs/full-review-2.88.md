# Full review: WODBLOK 2.88.0 (Nov 3 2026)

Owner, Nov 3 2026: "Do a full trial run of the whole project. Everything. Make sure everything is in line with our style guidelines and check for bugs and missing features. Compare the program to Lightroom, Photoshop, GIMP, Fusion 360 and other similar programs for features that are missing for the goal of the project, which is to make patterns and other pattern-based images. Give me the full report."

Everything below the facts is a recommendation for the owner to approve or drop. The earlier review, docs/pro-gap-review-2.86.md, is the base; this one marks what the pro basics plan closed and adds what is missing for patterns.

## How this was checked
- **Tests.** The CI suite on 2.88.0 with the test fixes (run 41704836293): 824 Chromium tests and WebKit, no failures, nothing flaky, 10 skipped on purpose (a browser feature the test browser lacks, the speed checks, the other engine). The picture comparison has not run since today's changes.
- **Commands.** The 152 commands in the registry were run one by one on a randomized design; 142 ran and none threw an error. Ten were left out because they open the system's file pickers, start a new project or restore crash recovery.
- **Panels.** Every panel was opened in light and dark at 1440 × 900 and on a phone at 390 px. No page errors, no panel content past its box, no native dropdown showing, no sideways scroll on the phone. Each panel was looked at in screenshots.
- **Style.** `npm run check:style` passes (font sizes, radii, weights, layers, gaps, motion). A second scan looked for what that check does not cover: raw colours, spacing and heights off the scales, explanatory text, icons outside the icon set.
- **Targeted checks.** Where today's new features meet the older ones: the book cover, the repeat tile and its 3 × 3 preview, a stamp's tab.
- **Comparison.** Photoshop, Lightroom, GIMP, Fusion 360, Illustrator, Inkscape, Affinity Designer, Procreate, and the pattern and textile tools Repper, Spoonflower, Adobe Textile Designer and NedGraphics.

Not checked: Safari on a Mac, a real tablet with a pen, screen readers, very large prints (over 64 million pixels, the browser's limit).

## Bugs
| # | Bug | Where | Severity |
|---|---|---|---|
| 1 | **The book cover's real size is ignored by the new units and print exports.** A 12.70 × 9.25 in cover gives a print PDF of 11.81 × 8.60 in (the 300 mm default), and X, Y, W, H, the rulers, guides, Separations and CMYK measure it the same wrong way. (Bleed is turned off on a book cover, which has its own.) The book cover's own Print cover PDF and PNG are right. | `physOf()` has no size for a book cover, so units (98) and colour and print output (36, 42) fall back to 300 mm | **High** for anyone printing a cover. Fixed in 2.88.1 |
| 2 | The "Exit 3 × 3 preview" button sits over the top ruler when both are on. | Stage overlay order | Low |
| 3 | After a slider is clicked it keeps the focus: the arrow keys move the slider instead of the selection, and Delete does nothing, until the canvas is clicked. | Browser focus on range inputs | Low (it may be what people expect; owner's call) |
| 4 | Five scenario state snapshots fail in the local container and pass in CI (letter positions with local fonts). | Test environment, not the app | None for users |

No other bug was found: every command ran, and every panel opened cleanly in both themes and on a phone.

## Style (docs/developing-wodblok.md Part 9)
The app follows the standard closely; `check:style` passes and the panels look and behave alike in light and dark. The second scan found:
| # | Finding | Rule | Fix |
|---|---|---|---|
| 1 | The **Swap width and height** buttons (Canvas and Stamp) draw a text arrow (⇆) instead of an icon. | Every icon lives in 00-icons.js | Add a `swap` icon |
| 2 | The **Split** bar says "Drag the line to place it. Drag the round end to turn it (Shift snaps to 15°)." | No explanatory text (owner) | Ask: it is a stage bar, not a panel; keep, shorten to "Split", or move it to Help |
| 3 | The element bar, the segmented control and the zoom box use their own small shadow (`rgba(0,0,0,.06)`). | Elevation: `--shadow`, or none for things that are not floating | Use the token or no shadow |
| 4 | Spacing off the scale in a few places: panel tabs (0 10), the stamp editing bar (7 10), the Settings page list (0 9), dropdown buttons (3 8). | Spacing 2 4 6 8 12 16 | Snap to the scale; extend `check:style` to padding and margin |
| 5 | The Export panel's print proof row wraps: the paper list fills the row and PDF and PNG drop below it. | Rows share one height | Put the paper list and the two buttons on one row |
| 6 | Raw colours outside the tokens in about 80 places, almost all correct by nature (the hue strip, the transparency checkerboard, white handles). | Colour tokens | Leave; add the few theme greys to tokens when touched |

## What is already strong for patterns
These are ahead of Photoshop, Lightroom and GIMP for the job, and level with or ahead of Illustrator and Repper in places.
- **Stamps:** reusable blocks with block edges, ink, symmetry, splits and knockouts, printed like real stamps.
- **Patterns:** the 17 wallpaper groups, radial, scatter, spiral and frame; accents; weighted and random picking; per-piece edits; density by picture or gradient; patterns inside shapes and along outlines; repeat tiles in grid, brick and half drop with a 3 × 3 preview and repeat-unit export.
- **Colour:** the tray, colourways, saved trays; since today separations per ink, spot inks, CMYK and a soft proof.
- **Print:** since today bleed on any canvas, a print PDF with boxes, marks and spot plates, a print TIFF and a layered PSD with ink channels.
- **Making:** Randomize with 15 Looks (plus Any); non-destructive effects for wear, halftone, line screen, misregistration; rulers, guides, real units, smart guides, a snapping grid; History with snapshots; Help.

## What is missing for making patterns
Priority: **P1** is what a pattern designer reaches for in the first session; **P2** within the first months; **P3** makes it a platform.

### A. Repeats and tilings
| Missing | Who has it | WODBLOK now | Priority |
|---|---|---|---|
| **Drops and offsets other than a half**: a third, a quarter, any amount, for brick and drop repeats | Illustrator (brick offset), NedGraphics (drop, shift), Affinity templates | Grid, brick and half drop only | **P1** |
| **Mirror repeat** of the tile (and Spoonflower's centre placement) | Spoonflower (mirror, centre), NedGraphics | Mirror only inside the wallpaper groups of a Pattern, not for the repeat tile | P1 |
| **Make seamless** for a picture: blend its edges so it tiles without a seam, and an offset view to paint across the seam | Repper (edge blending), GIMP (Tile Seamless), Photoshop (Offset filter) | A picture tiles with a seam | P1 |
| **More tilings**: hexagon and triangle repeat tiles, aperiodic tilings (Penrose), Truchet tiles, Islamic star and girih patterns | Repper (30+ tilings, Penrose), Inkscape (tiled clones) | 17 wallpaper groups and five Pattern layouts | P2 |
| **Gradual change across the surface** (pieces grow, turn or change colour from one side to the other) | Repper (Metamorphosis), NedGraphics (ombre) | Density by gradient (size or count) | P2 |
| **Ikat, ombre and dip-dye effects** | NedGraphics | None | P3 |

### B. Seeing the pattern in use
| Missing | Who has it | WODBLOK now | Priority |
|---|---|---|---|
| **Product mockups**: fabric, shirt, cushion, wallpaper on a wall, wrapping paper, phone case | Repper (3D mockups), print-on-demand tools | None | **P1** for selling patterns |
| **Real-size preview**: the repeat at its printed size on a yard of fabric or a wallpaper drop, with the fabric width shown | Spoonflower (layout preview), textile tools | The 3 × 3 preview at screen size | P1 |
| **Full-surface export**: the repeat filled over a set size (a yard, A3, 24 in by 10 ft) | Repper (full surface), Spoonflower | The tile and the repeat unit only | P2 |

### C. Colour for pattern work
| Missing | Who has it | WODBLOK now | Priority |
|---|---|---|---|
| **Colour reduction**: turn a scan or picture into a set number of tray inks, with clean-up of stray pixels | NedGraphics (Colour Reduction & Cleaning), Adobe Textile Designer | Pictures keep their colours; they are on no separation plate | **P1** for screen and textile printers |
| **Colourway generation**: several colourways at once from a rule (harmony, light to dark, a theme), and a colourway sheet export | Illustrator (Recolor), NedGraphics (Colorist, AI colourways) | Colourways by hand; Randomize changes colours one roll at a time | P1 |
| **Named ink libraries** (Pantone TCX and TPG for textiles, ink makers' sets) | Photoshop, NedGraphics | Saved colours and the Wada sets; licensing needs checking | P2 |
| **Colour count of the repeat** shown on the canvas | Textile tools | The Separations dialog shows the ink count | P3 |

### D. Drawing the pieces
| Missing | Who has it | WODBLOK now | Priority |
|---|---|---|---|
| **Pen tool and point editing** of shapes | Illustrator, Affinity, Inkscape, Photoshop | Shapes from the library or traced from an image; points cannot be edited | **P1** (from the 2.86 review) |
| **Shape booleans** (unite, subtract, intersect, exclude) on the canvas | Illustrator, Affinity, Inkscape, Fusion | Split and Knock out in a stamp's tab only | P2 |
| **Painting with live symmetry** (mirror, radial, tiling, painting across the tile's edge) | Procreate (symmetry guides), GIMP (symmetry painting: mirror, tiling, mandala) | Paint exists but is hidden; symmetry is for a stamp's shapes | P2 |
| **Free transform**: skew, distort, perspective | Photoshop, Illustrator | Scale, turn and flip | P2 |

### E. Building like an engineer (Fusion 360)
| Missing | Fusion 360 | WODBLOK now | Priority |
|---|---|---|---|
| **Named parameters and expressions**: a spacing or size set as a name (gap = 8 mm) that many patterns use | User parameters, expressions | Unit fields take sums, per field | P3 |
| **A timeline of operations that can be reordered or edited later** | Timeline | Element settings are live and History is linear, which covers most of this | P3 |
| Pattern along a path, suppress one instance, rectangular and circular patterns | Yes | Already there: Map to shape (Follow outline), Edit pieces (Delete), Tiling and Radial | Done |

### F. Compositing and finishing (open from the 2.86 review)
| Missing | WODBLOK now | Priority |
|---|---|---|
| **Clipping masks and layer masks** | Patterns inside shapes and Filter shapes only | **P1** |
| Layer styles: shadow, glow, stroke on any element | Outline on shapes only | P2 |
| Adjustment layers and image tools: histogram, Curves, Levels, a colour mixer | The colour grade | P2 |
| Presets for effect stacks and grades | Text styles and export recipes only | P2 |
| Background and object removal for pictures | Crop and Point crop | P2 |
| The five missing blend modes (Linear burn, Vivid light, Linear light, Subtract, Divide) | Left out: the browser cannot draw them live | P3 |

### G. Files, projects and reliability
| Missing | WODBLOK now | Priority |
|---|---|---|
| **Opening files made by older versions** | Refused by design (owner, Oct 18 and 19). A blocker once people keep real work | **P1, owner's decision** |
| A projects browser with thumbnails, search and versions | Projects folder, recent files, snapshots that last until the project closes | P2 |
| Editable SVG import (keep the vectors) | An SVG is traced to a shape | P2 |
| Export presets for print-on-demand sites (Spoonflower 150 DPI, wallpaper widths) | Export recipes by hand | P2 |
| Custom shortcuts, macros and batch | A shortcut list; export all recipes and colourways | P3 |

### H. Features that clash with the app's own rules
These are common in the other tools, but WODBLOK's rules rule them out today. They are listed so the choice is explicit.
- **AI text-to-pattern generation** (Illustrator's Generate patterns with Firefly) and **stock image search** (Repper's Unsplash search) both need the network while working. The app has no runtime network by rule.
- **Cloud sync and sharing** (Repper's automatic sync) needs accounts with storage. Accounts are for access only today.
- **Rich tooltips and contextual hints** are against the no-explanatory-text rule. Help now carries the explanations.

## Recommended next updates
1. **Fix bug 1** (book cover sizes) as a patch: it touches print output, so it needs the related export specs and a check of the cover PDF.
2. **Repeats for pattern designers:** any drop or offset, mirror repeat, Make seamless for pictures, and a real-size preview. These are the features a surface pattern designer reaches for in the first session.
3. **Selling patterns:** product mockups, full-surface export and print-on-demand export presets.
4. **Colour for printers:** colour reduction of pictures to tray inks, then colourway generation with a colourway sheet.
5. **Drawing depth:** clipping and layer masks, the pen tool with point editing, shape booleans, and painting with live symmetry.
6. **The style clean-ups** above, in one small patch, with `check:style` extended to padding and margin.

## Questions for the owner
1. Bug 3: should the keys go back to the canvas after a slider is used?
2. Style 2: keep, shorten or move the Split bar's instructions?
3. Which first: repeats (2), selling (3) or colour for printers (4)?
4. Mockups: which products matter most (fabric, wallpaper, clothing, stationery)?
5. Older project files: open them (a migration step) before the first paying users?

## Sources
- [Repper features](https://repper.app/en/features/)
- [Spoonflower: repeat types](https://support.spoonflower.com/hc/en-us/articles/204444650)
- [NedGraphics print studio design tools](https://www.nedgraphics.com/studio/print-studio-design-tools/)
- [Adobe Textile Designer (PrintWeek)](https://www.printweek.com/content/product-news/adobe-launches-textile-design-photoshop-plugin-at-fespa)
- [Illustrator: edit patterns](https://helpx.adobe.com/illustrator/desktop/paint-and-fill/create-and-edit-patterns/edit-patterns.html)
- [Photoshop: Pattern Preview](https://helpx.adobe.com/photoshop/using/pattern-preview.html)
- [GIMP: Symmetry Painting](https://docs.gimp.org/en/gimp-symmetry-dialog.html)
- [Procreate: drawing guides](https://help.procreate.com/articles/ozqZja-drawing-guides-symmetry-mirror-grid-ruler)
- [Fusion 360: patterning solid bodies (UMD)](https://dozuki.umd.edu/Guide/Patterning+and+Modifying+Solid+Bodies+in+Fusion+360/286)
