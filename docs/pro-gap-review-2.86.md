# Professional gap review: WODBLOK 2.86.0 against Photoshop and Lightroom (Nov 3 2026)

Owner, Nov 3 2026: "Please run the app testing for professionalism and feature wholeness, I want to know what's missing in Wodblok that apps like Lightroom and Photoshop have. Make a list of features we still need and where we need to be to get on their level."

**How this was tested.** The live build (2.86.0, `main`) in Chromium at desktop size:
- **Inventory.** The command registry (135 commands), every panel and group, the menus, the effects (18), and the file types it imports and exports.
- **Hands-on checks.** Nudge, duplicate, delete, undo, Alt-drag, units on the panels, rulers, blend modes, masks, help, and 300 elements at once.
- **Comparison.** Adobe's current feature lists for Photoshop (Generative Fill, Expand and Upscale, Harmonize, Remove, adjustment brush, Clarity and Dehaze, the contextual task bar) and Lightroom Classic (AI masking of subject, sky and people, denoise, presets, catalog, smart collections, faces, duplicate detection, WebP and PSB).

Not tested: a real tablet with a pen, Safari, very large prints (over 6000 px), and screen readers.

The owner's stated preferences are kept apart from recommendations here: everything below is a recommendation for him to approve or drop.

## Where WODBLOK is already ahead (keep it)
These are things Photoshop and Lightroom do not do, or do badly. They are the reason to choose WODBLOK.
- **Stamps.** Stamps with block edges, symmetry, knockouts and splitting are reusable, non-destructive "smart objects" made for printing.
- **Patterns.** Grid, brick and half-drop repeats, the 17 wallpaper groups, scatter, spiral, frame, accents, per-piece edits, patterns inside shapes, and a repeat-tile preview with a repeat-unit export. Photoshop's Pattern Preview and Illustrator's pattern options are thinner.
- **Randomize.** Fifteen Looks give instant varied designs.
- **Colour.** The colour tray and colourways recolour a whole design at once, saved trays and colourways included.
- **Effects.** A non-destructive effect stack on every element: texture and wear, print effects (halftone, line screen, stipple, bleed, misregistration, threshold), distortions, jitter and pressure.
- **Comparing and History.** Before/After and split view; History with thumbnails and snapshots, 120 steps.
- **Export.** Export recipes (PNG, JPG, SVG, TIFF, 72 to 600 DPI, watermark), PDF, a print proof, and a book cover layout with spine and bleed.
- **Working habits.** Command search (Ctrl+K), smart guides, a grid with snapping, align and distribute, crash recovery, and phone and tablet touch support.

## What is missing, by area
Priority: **P1** is expected by any professional on day one; **P2** is expected within the first months of use; **P3** is what makes Adobe a platform.

### A. Precision and layout
| Missing | Photoshop/Lightroom | WODBLOK now | Priority |
|---|---|---|---|
| Real units on every field: X, Y, W, H in px, in, mm | Info and Properties panels | Position, size and width in **% only** | P1 |
| Rulers, and guides dragged from them | Rulers (Ctrl+R), guides, guide layouts | None (smart guides and the grid only) | P1 |
| Alt-drag to duplicate | Universal habit | Alt-drag moves, it does not copy (tested) | P1 |
| Free transform: skew, distort, perspective | Ctrl+T with modifiers | Scale, rotate and flip only (Warp is an effect) | P2 |
| A reference point for transforms, and a numeric rotate about it | Yes | Rotates about the middle | P2 |
| Several artboards or canvases in one file | Artboards | One canvas (plus the book cover layout) | P2 |

### B. Layers and compositing
| Missing | Photoshop | WODBLOK now | Priority |
|---|---|---|---|
| Layer masks: paint or shape a mask on any element | Core feature | None (Filter shapes and Map to shape partly) | P1 |
| Clipping masks (clip an element to the one below) | Core feature | None (patterns inside shapes only) | P1 |
| More blend modes: Colour burn and dodge, Linear burn, Difference, Exclusion, Hue, Saturation, Colour, Luminosity | 27 modes | 7 plus Replace | P1 (easy) |
| Layer styles: drop shadow, inner shadow, glow, bevel, stroke on any element | Layer styles | Outline on shapes only; no shadow or glow | P2 |
| Adjustment layers: Curves, Levels, Hue/Saturation over everything below | Adjustment layers | A Sheet acts as a filter with effects; no Curves, Levels or Hue/Saturation | P2 |
| Smart filters with their own mask and blend | Yes | The effect stack has no per-effect mask or blend | P3 |

### C. Drawing and vector
| Missing | Photoshop/Illustrator | WODBLOK now | Priority |
|---|---|---|---|
| Pen tool and point-by-point path editing of a shape | Pen, curvature pen, direct selection | Shapes come from the library or a traced image; no editing of their points | P1 for a design tool |
| Shape booleans: unite, subtract, intersect, exclude | Pathfinder, shape modes | Knockout and Split in stamps only | P2 |
| Brush and eraser painting (with pen pressure) | Brushes, mixer brush | Paint exists in code but is hidden | P2 |
| Pick colours with an eyedropper anywhere on screen | Yes | Inside the colour picker only | P3 |

### D. Colour and print (the most important for a print-focused tool)
| Missing | Photoshop | WODBLOK now | Priority |
|---|---|---|---|
| CMYK and spot colours, with separations per ink for screen, block and riso printing | CMYK, channels, spot channels | RGB only; the tray holds a design's inks but they do not export as separations | P1 for printers and textiles |
| Colour profiles (ICC), soft proofing, embedding a profile in exports | Colour settings, proof setup | None | P2 |
| PDF/X export for print shops, with bleed and crop marks on any canvas | Yes | PDF and a print proof; bleed only on the book cover | P2 |
| Colour libraries (named ink systems) and colour harmony tools | Libraries, colour themes | Saved colours and trays (no harmony rules) | P3 |

### E. Image editing (the Lightroom side)
| Missing | Lightroom/Photoshop | WODBLOK now | Priority |
|---|---|---|---|
| A histogram | Always visible | None | P2 |
| Curves and Levels; a colour mixer (HSL per colour); colour grading wheels | Basic panel, Tone curve, Colour mixer, Colour grading | Colour grade: Exposure, Contrast, Highlights, Shadows, Whites, Blacks, Temperature, Tint, Saturation, Vibrance, Hue, Fade, with a range | P2 |
| Presets for the grade and for effect stacks, saved and shared | Presets | Text styles and export recipes only; no effect or grade presets | P2 |
| Clarity, Dehaze, Sharpen, noise reduction | Yes | Blur and Grain only | P3 |
| AI masks and removal: select subject or sky, remove the background, remove an object | Select subject, AI masks, Remove, Generative Fill | Crop and Point crop only. The owner asked about removing a subject or background on Oct 28 | P2 |
| Healing and clone | Yes | None | P3 |

### F. Type
| Missing | Photoshop | WODBLOK now | Priority |
|---|---|---|---|
| OpenType features (ligatures, alternates, small caps), kerning pairs, a glyphs panel | Yes | Letter and word spacing, styles, text on paths, warp, per-letter styles | P2 |
| Spell check, find and replace | Yes | None | P3 |
| Variable font axes | Yes | None | P3 |

### G. Files, projects and reliability
| Missing | Photoshop/Lightroom | WODBLOK now | Priority |
|---|---|---|---|
| **Opening files made by older versions** | Always: files from decades ago open | Refused by design ("no backwards compatibility", owner Oct 18 and 19). Fine during development; a blocker once people keep real work in WODBLOK | **P1, owner's decision** |
| Layered export (PSD or layered TIFF) and editable SVG import | PSD round trip, Place SVG | PNG, JPG, SVG, TIFF and PDF out; images in (an SVG is traced, not kept as vectors) | P2 |
| WebP and AVIF export; a JPG quality setting | Yes | PNG, JPG, SVG and TIFF | P3 |
| Version history of a project (Save version, browse versions) | Cloud versions, virtual copies | Snapshots in History (lost when the project closes) | P2 |
| A projects browser (thumbnails, search, tags, ratings, collections) | Lightroom catalog, smart collections | Projects folder and recent files | P2 |
| Several projects open at once | Document tabs | One project (stamp tabs inside it) | P2 |
| Cloud sync and sharing a project for comments | Creative Cloud | None (accounts exist for access only) | P3 |

### H. Automation and customisation
| Missing | Photoshop | WODBLOK now | Priority |
|---|---|---|---|
| Customisable keyboard shortcuts | Edit > Keyboard Shortcuts | A shortcuts list; not editable | P2 |
| Actions or macros and batch processing | Actions, Batch, Image Processor | Export all recipes and all colourways only | P3 |
| Plugins or a scripting interface | UXP plugins, scripting | None (the command registry is a good base) | P3 |

### I. Help, onboarding and polish
| Missing | Photoshop/Lightroom | WODBLOK now | Priority |
|---|---|---|---|
| In-app help: a manual, short guides, "What's new" | Help, Discover panel, tutorials | Help menu: Keyboard shortcuts and About only | P1 |
| A first-run tour or sample projects | Home screen, tutorials | Starter templates at launch | P2 |
| Contextual hints | Contextual task bar, rich tooltips | No explanatory text or tooltips in panels (owner's rule); icon names on hover | Owner's rule; a separate Help is the way round it |
| Other languages, accessibility review | Many languages, screen-reader support | English only; a few accessibility specs | P3 |

### J. Platform and performance
| Missing | Photoshop/Lightroom | WODBLOK now | Priority |
|---|---|---|---|
| Desktop apps (Mac and Windows), working offline | Native apps | Web app; desktop later (owner's rule) | P2 |
| GPU drawing for big, dense work and very large exports | GPU canvas | SVG drawing: 300 elements build in about 0.65 s and undo in about 0.5 s (tested), fine for now. Dense patterns and big prints will need a canvas or WebGL renderer for exports | P2 |
| A reliable test suite | (internal) | CI green with a few timing-flaky tests (small-updates-2-79-2, top-bar-2-43); picture comparison rarely run | P2 |

## Where we need to be: four steps
Each step is one update of a few releases, in the order that adds the most professional feel for the least risk.

1. **Pro basics (the first thing a Photoshop user tries).**
   - Real units on every field, rulers and guides, and Alt-drag to duplicate.
   - The missing blend modes, clipping masks and then layer masks.
   - A Help menu with a short manual and "What's new".
   - A decision on opening files from older versions.
2. **Print-ready (WODBLOK's own market).**
   - Ink separations per tray colour (spot colours) and CMYK export.
   - PDF/X with bleed and crop marks on any canvas, and colour profiles with soft proofing.
   - Layered PSD or TIFF export.
3. **Design depth.**
   - The pen tool and editing a shape's points; shape booleans.
   - Layer styles (shadow, glow, stroke).
   - Free transform with skew and perspective.
   - Effect and grade presets.
   - OpenType features.
   - Painting, by bringing back the hidden Paint element with pressure.
4. **The Lightroom side and the platform.**
   - A histogram, Curves, Levels, a colour mixer and grading wheels.
   - Background, subject and object removal.
   - A projects browser with versions; several projects open at once.
   - Custom shortcuts.
   - Desktop apps.
   - Later: macros and plugins.

After step 2, WODBLOK is a professional tool for its own job (stamped and printed pattern design), with things Photoshop cannot do. After step 4 it stands next to Photoshop and Lightroom for the editing people expect around that job.

## Questions for the owner
1. Should older project files open (a migration step on open), now or before the first paying users?
2. Which comes first: step 1 (pro basics) or step 2 (print-ready)?
3. Ink separations: which printing do you want to serve first (screen printing, block or relief, riso, textile print-on-demand)?
4. Help: is a separate Help panel or manual acceptable, given the no-tooltips rule for panels?
