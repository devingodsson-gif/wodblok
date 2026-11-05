# Whole-application bug test, 2.105.0 (Nov 5 2026)

Owner, Nov 5 2026: "Do a bug test. Check everything. Also check for speed. I'm gonna change to a different agent later today so I basically want a brief of bugs and also style problems. Drawing problems. Anything we should work on next. Please send a full report to me and write it in the project."

Tested: 2.105.0 (`main`, live), built from `main`, in Chromium (the sandbox: 2 processor threads, no graphics card), driven through its real UI by throwaway sweep scripts (not committed); the full CI suite on `main`; the live site in Chromium through the sandbox's proxy. A finding counts only when it was checked again by hand; false alarms are listed at the end so nobody chases them again.

## What was exercised

| Area | How | Result |
| --- | --- | --- |
| Full CI suite (run 42061429885, on `main` at 2.105.0; "check everything" taken as the owner's word for it) | eight Chromium shards and WebKit | **all passed**. The picture comparison job was skipped (it runs only when asked; the pixel goldens are stale, see Testing state in PROJECT_STATUS) |
| Every Look of Randomize | 15 Looks, 3 rolls each (45); page errors, non-finite or missing places, elements off the canvas checked after each; 4 Undos and 4 Redos | no error, nothing broken or off the canvas; Undo and Redo exact |
| Every command | 158 commands in three states (empty, after a roll, a shape selected): 257 ran, 196 disabled in that state (as meant) | no page error, no broken document. Not run: file.new, file.clear, file.projects, file.open and the library imports (they open file pickers or clear the session) |
| Every panel control | 172 actions over every rail panel, then 61 more with each kind of element picked in the Elements list | no page error, no broken number. "Changes nothing" flags all explained (see False alarms) |
| Drawing: export against the screen | each of the 15 Looks rolled, exported as PNG and compared with the canvas, pixel by pixel; at the screen's own size, at 800 px and at 3x (2,160 px) | at the same size they match (mean difference 0.6 to 1.9 of 255). Larger exports differ: **B1** |
| Group panel and group effects | covered by the suite (group-panel-2-104-1, group-effects-2-104-2) and the style sweep | pass; B4 |
| Style: rules | `npm run check:style`; every module scanned for sizes and colours written inline; the page CSS scanned for colours outside the tokens | style check OK; nothing outside the standard (the colour picker's gradient and the checkerboard are meant) |
| Style: by eye | every rail panel and the Group panel at 1440 x 900 and 390 x 844, measured for text cut off, controls sticking out of a panel, panels off-screen, sideways page scroll and small touch targets; screenshots looked at | B2, B3, B4; phone notes under B6 |
| Speed | start-up, panel opens, slider steps, Randomize rolls per Look, every export, `npm run perf` (six runs), `speed-guard.spec.js` | figures below; no regression |
| Live site | the page, the service worker, all 228 asset files the page names and the 5 pieces of the two split AI files; a first visit, a reload and an offline visit in Chromium | B5 only; everything present, nothing over 25 MiB, offline works |

The app is sturdy: no page error anywhere, in about 800 actions plus the full suite. What this test found are differences between the screen and the export, a few style slips, and stale notes.

## Findings

### B1 (high for a print product): an export larger than the screen does not look like the screen
**Fixed in 2.106.0** (owner: "Screen matches print"; docs/plan.md): the cause was the screen, which wore away stamp lines thinner than a pixel; stamps are now printed at 2 pixels or more per stamp unit.
At the screen's own size (480 x 720 here) the PNG export matches the canvas. At 800 px it starts to differ, and at 3x (2,160 px, the "PNG image 3x" button) it clearly differs: in Tilework the thin frame lines that are **broken and worn on screen are solid unbroken lines in the export**, and the ink's surface wear is a different pattern. Mean difference against the screen at 3x: Tilework 5.5, Random 4.2, Plate 3.0, Repeat 2.3 (of 255), with up to 6% of pixels clearly different; at the screen's size all are under 2.
- Why it matters: what prints (3x, PDF, CMYK) is not what the owner judged on screen.
- Suspect (not confirmed): the worn edge (`11-pressure-flooding-block-edges.js`, the filter at line 35: noise, then a very steep cut, slope 40) and the other noise filters decide pixel by pixel, so the result depends on how many pixels the drawing is made at; the break pattern of thin lines then changes with the size. It is also possible that thin lines take a different path in the export.
- Next: reproduce on one thin line with one effect at 1x, 2x and 3x; decide which one is right (the owner should say: the screen is the reference, or the print is); then make the noise and the cut independent of the output size (or render the screen at the export's density). Needs `npm run perf` and the picture comparison, since it touches drawing.

### B2 (low, style): every Mockup tile name is cut off
In the Mockup panel's library (desktop width, five tiles a row) every product name is cut to three or four letters: "T-sh...", "Tote...", "Cus...", "Fab...", "Wall...", "Not...". On a phone (four a row) Wallpaper and Notebook are still cut. Nobody can read the library by name. Fix inside the standard (Part 9): the same card as the other libraries, with fewer columns or the name allowed a second line.

### B3 (low, style): "Paragraph spacing" is wider than its label column
Text panel: the label measures 99 px in a 96 px column, so its last letters touch or clip the slider. Same on a phone. Fix: a shorter word ("Paragraph") or the standard's label width for long labels.

### B4 (low, style): X, Y, W and H fields do not line up
The Element section (every element panel) and the new Group panel put X and Y on one line and W and H on the next, each letter followed by its field; because W is wider than X, the second row's fields start further right, so the four fields are not in columns. Shared markup (`.aspc unr`), so one fix covers both.

### B5 (cosmetic, live site): a red 401 in the browser console on every visit
The app asks `/api/me` whether someone is signed in; signed out, the host answers 401, which the app handles as meant ("signedout"), but the browser prints it as a red error in its console. Harmless; it only looks like a fault to anyone who opens the console. If wanted: answer 200 with a signed-out state instead (functions side; docs/accounts.md).

### B6 (note, phone; mobile is later by the rules): small touch targets at 390 px
Switches are 28 x 18 px and icon buttons (eye, lock, row menu, Compare) 18 x 18 px. Fine with a mouse; too small for a finger. Not a bug today (mobile is later), recorded for the mobile work.

### Stale notes (fixed in this report's docs change)
- PROJECT_STATUS "Known issues" said the speed guard's markup after Randomize sits at about 148,000 of 150,000; it is **32,398** now (2.105.0), so there is plenty of room.
- PROJECT_STATUS handover said 2.105.0 was not merged; it is live.

## Speed (2.105.0, sandbox Chromium, 2 threads, no graphics card)

| What | Time |
| --- | --- |
| Start-up, single file, to a ready app | 1.04 to 1.11 s (DOMContentLoaded 0.97 to 1.04 s) |
| Live site, first visit (through the sandbox's proxy) to a ready app | 2.4 s; reload 1.1 s; offline 1.1 s (served by the service worker) |
| Live site, what the page carries | page 2.2 MB; 12.9 MB of other files fetched as needed (shapes and templates 4.6, textures 4.2, fonts 3.6, mockups 0.5); AI about 101 MB in pieces of at most 24 MiB, fetched only the first time AI is used |
| Opening a panel | about 0.5 s (Mockup 0.85 s), harness waits included |
| A slider step on a rolled piece | 25 to 41 ms (two frames) |
| Randomize roll | 1.0 to 2.3 s per Look; Random is the heaviest (1.6 to 2.1 MB of drawing, up to 4.7 s once) |
| Exports | PNG 800 px 0.1 to 0.9 s; PNG 3x 0.9 to 1.1 s; PNG through the command 2.4 s; PDF 2.6 s; all recipes 3.1 s; proof PDF 3.9 s; CMYK PDF 4.0 s |
| `npm run perf` | mean ratio about 1.01 over six runs (one run 1.10): no regression |
| `speed-guard.spec.js` | passes: markup on screen 16k to 35k at Fit (budget 120k to 150k), 32k after Randomize; zoomed in (live) 1.9 MB, which is meant (zoom draws everything) |

Nothing is slow enough to call a bug. The things a user may feel: the Random Look's heavier rolls (up to about 4.7 s here) and the print exports (about 4 s).

## False alarms (checked, not bugs)
- Sheet panel: Across, Down (radial gradient only, hidden otherwise), the gradient midpoint (hidden when the gradient has stops), the fill segment already on: change nothing, as meant.
- Elements panel: Align's Margin applies at the next Align, not live; Image panel: Seamless Blend applies at Make seamless.
- Picture Width and Height: hidden for pictures (Rotate works).
- Pattern settings that belong to other layouts (`peao_sk`, `peacz`, `pert`, `pepdr`, `peac`, `peov`, `pepe`, `peacs`, `peda`, `pepsrc`, `pepcol`): change nothing in the layout tested, as meant.
- Colours panel: the tray line ("#793327 · Ink · 2 texts · 1 element ...") ends in a deliberate ellipsis.
- Group panel: the Effects heading has no arrow while there are no effects, the same as every element panel (2.55.0).
- The first drawing comparison runs were invalid (the floating Export panel covered the canvas in the screenshot); the numbers above are from runs with every panel closed.

## What to work on next (recommendations, not decisions)
1. **B1, print matches screen** (high): the investigation above, then the fix. It is the one finding that changes what a customer receives.
2. **One small style release** (B2, B3, B4): Mockup tile names, the Paragraph spacing label, X/Y/W/H in columns. Low risk; quick tests and the style check.
3. **Book changes as an undo step** (existing suggestion, Nov 5): today undoing an edit made before a spine change puts that element back where it was for the old spine.
4. **The picture comparison in CI**: the pixel goldens are stale, so the one job that would catch a drawing change (like B1) is skipped. Regenerating them needs a suite run and the owner's word.
5. **Random Look weight**: its rolls are the heaviest (about 2 MB, up to 4.7 s); a cap on its element count would keep every roll near 2 s.
6. Already decided or shelved by the owner, listed so they are not lost: AI in the Image panel (shelved Nov 4); cross-origin isolation for faster AI (suggestion, needs a check against sign-in); mapped-text effects using the Shape's area (old known issue).
