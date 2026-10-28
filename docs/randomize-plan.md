# Randomize rewrite: plan (in progress; step 1 on `feat/2.74.1-randomize-looks`)

Owner, Oct 27 2026: "rewrite Randomize so it touches every option we have right now, all the elements and everything, all the effects and settings. The random results should look appealing, like a real image."

## What Randomize does today (2.67.0)
- `20-before-after-and-randomizer.js` (`randomizeCore`, about 250 dense lines) builds stamps from motifs, one to three Pattern layers, a frame, sometimes placed stamps and lettering inside a stamp, then reworks layout, opacity and blend, pressure, textures, colour grade, grade masks and canvas texture. `71-randomize-elements.js` turns that into elements and adds the Noise, Blur, Print and Distort effects and a Filter on top.
- It grew one switch at a time since v67. It never makes: a gradient Sheet, a Motif element on the canvas (outside a Filter), a canvas Text box (text is only lettering inside a stamp, in the 34 old fonts), Paint, a Tiling chosen on purpose (only by chance from an old arrangement), text shapes (curve, wave, circle, spiral), bold, italic, highlight or letter colours, Map to shape, Pattern sources that are motifs or text, element opacity and blend on elements, or a Sheet's effects fading over a gradient.
- Each part is rolled on its own, so a roll is a pile of independent choices: nothing decides what the picture is, so colours, sizes and effects do not agree with each other.

## The idea: a roll is a composed picture
Every roll first picks a **Look** (an art direction). The Look decides the whole picture at once: which elements it is made of, where they sit, which colours have which role, which fonts, how strong the finish is. Across rolls every option comes up; inside one roll only what belongs together is used.

### Looks (first set)
| Look | Made of | Feels like |
|---|---|---|
| Repeat | 1 to 3 Patterns (Tiling, Grid, Brick, Half drop) of rolled stamps, overprinted inks, sometimes a frame | wallpaper, fabric (what Randomize makes today, kept and improved) |
| Poster | gradient Sheet, one large focal stamp or shape, title and a small line under it, a quiet pattern behind | a screen-printed poster |
| Book plate | paper Sheet, frame and rules, a centred emblem stamp, text round a circle, a name line | an ex libris, a label |
| Badge | circle or hex emblem, curved text top and bottom, rules, halftone | a seal, a badge, a sticker |
| Specimen | scattered shapes (Pattern on Scatter, or placed), a small caption, stipple, cream paper | a botanical or specimen print |
| Modern | Tiling of basic shapes, bold sans or display title, flat colours, misregistration | a geometric print |
| Sunburst | Radial pattern, script title with a highlight band, ink bleed and halftone, warm grade | a retro print or ad |
| Quilt | Tiling turned, pinwheel or basketweave, frame, soft grade | a quilt, a tiled floor |

### The parts of every picture (bottom to top)
1. **Background**: a Sheet in the paper colour, or a linear or radial gradient between two related colours (the gradient effects fade, 2.67.0).
2. **Field**: a Pattern that fills the canvas (stamps, shapes or text as sources; any layout or Tiling).
3. **Second field or accents**: an accent Pattern on the same lattice, or a few placed stamps or shapes.
4. **Focal point**: one large stamp, shape or Map-to-shape text, on the middle or a third.
5. **Type**: a title and, often, a smaller second line, as canvas Text boxes; a font pair chosen for the Look.
6. **Frame**: a Frame pattern and thin rules.
7. **Finish**: element effects (Texture, Pressure, Jitter, Noise, Grain, Dust, Halftone, Line screen, Stipple, Ink bleed, Misregistration, Roughen, Ripple, Blur, Motion blur), a Filter Sheet or Filter shape, the colour grade and its masks, the canvas texture.
A Look uses some parts, never all of them.

### Rules that make it look like a real image
- **Colour**: one palette (a Wada combination or the tray's colourway). Roles by lightness: paper, main ink (clear contrast with the paper), one or two accents. About 60/30/10 in area. Text always has strong contrast with what is under it. A gradient uses two palette colours close in lightness.
- **Layout**: a margin of 6 to 10 % of the short side; the focal point on the middle or a third line; text lines share one axis with the focal point; nothing important crosses the edge; text never sits on a busy field without a band, a frame or a quiet area.
- **Hierarchy**: one large thing, one middle thing, one small thing. Title 10 to 18 % of the short side, second line 30 to 45 % of the title, capitals spaced out.
- **Type**: font pairs per Look from the 90 fonts (a display or script title with a serif or sans line); bold and italic only where the font has them; underline, strike-through, highlight and letter colours used sparingly (a highlight band on a Sunburst, one coloured initial on a Book plate); text shapes where they belong (circle on a Badge, a gentle curve on a Poster, a wave rarely).
- **Finish budget**: at most one texture effect, one print effect and one noise effect on a picture, in ranges that stay printable; blur and distortion only small, on a second field or a Filter shape; Jitter on scatters and text only.
- **Checks after the roll** (cheap, no drawing): text fits inside the margins, contrast is met, the element count and markup stay under the speed budget (`speed-guard`: about 150,000), the build time stays as it is. A part that fails is rolled again.

### Every option comes up
A table in this document (made in step 1) lists every element kind, layout, Tiling shape and arrangement, effect, font group, text option, Sheet fill and setting, and the Looks that use it. A new test rolls many seeds and checks that each option came up at least once, so a new feature that Randomize does not reach fails the test until a Look uses it.

### What stays
- Rolls stay seeded (tests), undoable, one history step, with the hold-and-fade while it builds.
- A roll replaces the previous roll and leaves your own elements alone, or starts fresh (the 2.21.0 switch).
- Anything switched off in the Randomize panel stays as it is.
- No runtime network; speed first (`npm run perf` on every step).

## Owner's answers (Oct 28 2026)
- Simplify the Randomize panel: a Look choice (Any, or one Look) and a few switches.
- The Look list: the eight above.
- A roll builds new stamp art from shapes by default (it does not take saved stamps).
- "Spend more time on the looks: they should look more or less like finished art work ready to use, with all the features WODBLOK has to offer; a wide variety of possible outputs."

## Steps (each a patch; 2.75.0 when the plan is done; renumbered Oct 28 2026, the plan was written against 2.67.0)
1. **2.74.1 The Looks**: the Look engine (93-randomize-looks.js) with shared parts (grounds, fields, focal points, words round a circle, borders, corners, rules, ribbons, a brush swash) and several layouts per Look; Repeat moved onto it (the old roll is kept for a roll with Stamps off, a book cover and a repeat tile); colour roles read through the palette being rolled; a Look choice at the top of the Randomize panel. **Done, see docs/plan.md.**
2. **2.74.2 The panel**: the simplified switches (Background, Pattern, Focal point, Text, Frame, Colours, Effects, Finish, Canvas size) replacing today's sliders.
3. **2.74.3 Tests**: the `randomize-*` specs, `text-randomize`, `repeat-tile` and `nothing-lost-2-24` rewritten for the Looks; the coverage test; the Randomize scenario snapshots regenerated in CI with the owner's approval.
4. **2.74.4 The old roller removed** (once Stamps off, book covers and repeat tiles have a Look), docs. Then 2.75.0.

## What each Look makes (2.74.1)
| Look | Layouts | Uses |
|---|---|---|
| Poster | Classic, Block (words in a band of colour), Sun (a disc on a horizon behind a silhouette), Type (the title set big), Framed (an ornament border) | gradient and halftone Sheets, a quiet Tiling or Scatter field, emblem stamps, Motif silhouettes, wreaths (a Pattern mapped onto a circle), print effects, rules, Film Grain |
| Book plate | Classic (double rule, corner ornaments), Arch (curved title), Border (a Frame pattern of ornaments), Seal (words round a circle, Map to shape) | paper textures, emblem stamps with two-colour runs, italic second lines |
| Badge | Seal (words all round a disc), Outline (a dotted ring, curved words top and bottom, stars), Banner (a shield or hexagon with a ribbon) | Roughen, Halftone or Wear on the seal, Map to shape text |
| Specimen | Grid (every place a different specimen, numbered), Row, Single (one large specimen with details) | Stipple and Line Screen, Roman numerals, italic captions |
| Modern | Shapes (a grid of basic shapes and one large overprinted shape), Tiles, Bands, Circles, Big type (the title over a large shape, Multiply or Screen) | blend modes, Halftone, Misregistration, Add Noise |
| Sunburst | Rays (wedges on a circle round an emblem), Sunset (a striped half sun), Rainbow (arcs and clouds) | a highlight band or a brush swash (Paint) under a script title, wavy text, warm grade |
| Quilt | Blocks, Sashing, Medallion | Tiling arrangements (turned, pinwheel, mirror, basket, checker), inverted (carved) blocks, binding, a label |
| Repeat | Wallpaper (with a filler between), Pair, Stripe, Toile (a jittered half drop), Damask (a large tone stamp and a small sprig) | square, circle, hexagon and diamond Tilings, stamps made of one motif for repeated detail |

Speed: a motif is drawn in full at every place it is put (about 10,000 characters each), so a repeated detailed motif goes into a stamp that prints once; a whole Pattern never gets a Pressure offset or a Texture effect (each placement would be drawn on its own: up to 7 million characters in tests). Rolls measured at most about 400,000 characters of `#dyn` markup.

## Tests and snapshots
- Every seeded roll changes, so the Randomize scenario snapshots (`scenarios.spec.js`: seeds 1 to 3, before view, split view) and the specs that check rolled content (`randomize-*.spec.js`, `text-randomize`, `repeat-tile` seamless rolls, `nothing-lost-2-24`) change. Snapshots are regenerated in CI with the owner's approval; the specs are rewritten for the new roller.
- Importance of the full CI suite at the end: about 70 % (Randomize touches drawing, every element kind and the document).

## Questions for the owner
1. The Randomize panel: keep today's long list of switches and sliders, or simplify it to a Look choice (Any or one Look) plus a few switches (Background, Pattern, Focal point, Text, Frame, Colours, Effects, Finish, Canvas size)?
2. Words: what may a roll write? Made-up titles that fit the Look, the project's name, a word list you can edit in Settings, or a mix?
3. Is the list of Looks right? Any to add or drop?
4. Should a roll still build new stamp artwork from the shapes (as now), or also use your saved stamps and shapes by default?
