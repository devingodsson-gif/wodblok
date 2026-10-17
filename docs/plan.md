# Development plan

No open plan. The UX fix plan ([`fix-plan.md`](fix-plan.md), 1.0.1 to 1.0.20) closed with 1.1.0.

Next: test 1.1.0 by hand (Monday), then write the polish plan here. Candidates from the closed plan are listed at the top of `fix-plan.md`.

## 1.6.0: Randomize shape folders
Randomize has a "Shape folders" row with a dropdown of every library folder (built-in sets, My imports, your own folders, folders inside folders). A roll takes its shapes only from the ticked folders; the Dots set stays the accents when ticked, otherwise accents come from the chosen folder. All ticked behaves exactly as before. Ticking a folder ticks the folders inside it, at least one folder holding shapes always stays ticked, new folders start ticked, and the choice is remembered in the browser like the other Randomize options (not in the project file). Test: tests/randomize-folders.spec.js.

## 1.7.0: Lighter redraws (speed, pass 3)
Speed work from the Oct 15 audit (`docs/known-issues.md` lists the two old quirks found on the way). Nothing changes on screen.
- Every stamp's outline (clip, mask, shape) now lives once in a hidden block (`#stdefs`) that is rewritten only when a stamp changes. The pattern itself carries the ready-made prints, so it no longer repeats those outlines on every redraw (busy test project: 2.7 MB of markup on screen down to about 38 KB).
- The pattern build numbers its mask ids from a fixed start, so the same stamps give the same text every time; a stamp's fingerprint is only worked out again when its text changed.
- New tests: `tests/speed-guard.spec.js` (counts the markup on screen and checks that nothing points at a missing id, after slider moves, zoom, the Stamp editor and Randomize) and `tests/picture-compare.spec.js` (CI draws the same projects with `main` and with the branch and compares the pictures pixel by pixel, including a PNG export).
- Measured on the busy test project (Chromium, 1x, sandbox): stamp size slider step 154 → 89 ms, texture Amount 248 → 163 ms, undo 219 → 149 ms, Randomize first frame 785 → 587 ms. Freezes of 0.3–0.7 s and the 8 s export are for passes 4 and 5.

## 1.9.0: no long freezes (speed, pass 5)
- Stamp prints are made in small sheets (about 1 megapixel at most, instead of up to 4096 x 4096) with the app free to react between them; the pattern is redrawn when the queue is empty, or every half second while it is long. During a Randomize hold the overlay position is read at most every 250 ms instead of every frame.
- Busy test project (Chromium, 1x, sandbox), longest freeze: opening a file 1375 → 554-626 ms; stamp size drag 1180 → 272-317 ms; undo x3 382 → 89-96 ms; zoom back to Fit about 100 ms (one earlier run showed 1.8-2 s, not reproduced alone); Randomize x3 1332 → 872-1010 ms. Perf ratio unchanged.
- The printed stamps' grain moves a little (the grain depends on where a stamp sits in its sheet): mean difference under 0.5 of 255 and about 250 pixels off by more than 48 on the diamond project; exports are identical. CI's picture comparison uses a tolerance of 0.6 for this release only (remove in 1.10).
- Not done from the pass 5 plan: C3 (history thumbnail from the on-screen prints; it is made when the page is idle, not during editing).
- New test: `tests/print-batches.spec.js`; `speed-guard` now waits for the prints before it checks.

## 1.8.0: Texture Amount without a pattern rebuild (speed, pass 4)
- Textures tool, Amount slider on a relief or stain texture that only the canvas uses: while it moves, the picture is made once at full strength and Amount is its opacity; when it is let go, the exact picture is drawn as before. Nothing rebuilds the pattern (it does not depend on a relief or stain texture). Wear textures, and textures that stamps or layers also use, still rebuild it. Scale, angle and type changes on a canvas-only texture skip the pattern rebuild too.
- Busy test project (Chromium, 1x, sandbox), per slider step: 163 → 17 ms; freezes over 50 ms during the drag 39 → 5; pattern redraws 34 → 2. The picture after letting go is pixel-identical to 1.7.0 (`picture-compare` has a texture step now).
- New test: `tests/texture-amount-fast.spec.js`. Not done from the pass 4 plan: texture pictures as blob URLs (B3); it only matters at the moment of letting go.

## 1.9.1 (test follow-ups to 1.9)
- Test hook `__wbTest.printsBusy()`; `settle` waits for the stamp prints, so the quiet-25 workarounds in speed-guard and repeat-tile are gone.
- picture-compare: the temporary 0.6 tolerance became a permanent 0.05 (mean of 255): print sheets are made up by timing, so grain moves ~0.01 between runs (measured main vs this branch). A build without the hook is given 2.5 s extra.
- Seamless-tile right/down limit is 0.12*half+0.25 (was +0.15): 1.9's smaller print sheets move grain by about 1 of 255 on the CI renderer.

## 1.10.0: Colour tray and Colourways
- **The tray** (`src/modules/50-tray-core.js`): the project's colours, up to 16 (`TRAY_MAX`), each a place with a stable id (`proj.ts`). Everything that has a colour holds a colour reference: `@k3` follows tray place k3; `#rrggbb[aa]` is a fixed colour of its own (locked); `#rrggbb[aa]|k3` is fixed and remembers the place it was locked from. Colours carry their own opacity (the `aa`). `col()` in module 04 resolves references, so drawing code is unchanged.
- **Colourways**: `proj.cw` is a list of colour sets for the same places (`{id, n, c:{place: colour}, m:{place: name}}`), `proj.cwa` the one showing. Every colourway has every place, so links stay valid; switching only changes colours. History, saving, crash recovery and compare carry it all because it lives in the document.
- **On screen** (`52-tray-ui.js`): the dock above the canvas in both views (7 places, "+" to add, up to 16; click to edit, drag to move; a colourway switcher when there are two or more); colour wells with a lock for Paper, Ink, stamp ink, layer ink, the Replace colour and text colour; the Colours tool rebuilt (the tray as a list with what uses each colour, paper and ink, saved trays in folders with Wada's 348 sets built in, search, your own trays and folders). The palette list left Presets (it is in Saved trays); old custom palettes become saved trays.
- **Picker and dropper** (`51-colour-picker.js`): one picker for every colour: saturation/brightness square, hue, opacity, hex/RGB/HSB fields, recent colours. Our own dropper renders the finished picture (the export vector) at screen size and reads the pixel under the pointer with a magnifier; Alt+click keeps the opacity. Colour fields in other tools (grade colour mask) open the same picker.
- **Colourways tool** (`53-colourways.js`): cards with a picture of the piece in each colourway, switch, new, rename, duplicate, move, delete; export every colourway as one zip (PNG/JPG/SVG, long side), each file named after its colourway.
- **File format 20**. Older files open and keep their colours: their colour names become tray colours (paper, ink, accents and any stamp/layer inks, up to 16; more stay fixed) linked where they were used. Older files' layer inks show again: since the Wada colours came in, layer inks with an old colour name were silently left out; the tray brings back the file's own colour (see known issues).
- Randomize, Looks, Variations, the print proof, the stamp library and the grade colour mask work with the tray (a new palette fills the tray's first places; locked colours are never changed by Randomize).
- Not in this release: making a colourway switch instant (stamps are re-printed in the new colours, about the same time as a big slider change); the dropper sampling one layer only; drag a tray colour onto the canvas.
- New tests: `tests/colour-tray.spec.js`; palette, palette-names, presets, print-proof, easy-wins, small-ones, rail and format tests updated for the tray.

### 1.10.0 follow-up: Export recipes regrouped
Export recipes now has four groups (Recipes, Custom export, Quick, Print proof) and a Colourways switch at the top (Showing / All, only when there is more than one colourway). "All" makes every export once per colourway in one zip, each file named after its colourway. The export block left the Colourways tool; its Export… button opens Export recipes with All chosen.

## 1.11.0: Templates
- **A template is a saved project** (.wodblok, format 20; no format change). Its kind comes from the project: book cover on → Book, repeat tile (`dim.rt`) → Repeating pattern, else Normal canvas.
- **File menu**: New project, New from template…, Clear, Open…, Save as template… (commands `template.new`, `template.save`). Launch is unchanged.
- **Picker** (`54-templates.js`): three kinds (remembered), Starting points (Blank first, then 3 built-ins per kind) and Yours. Opening works like New project (two-tap when there is unsaved work), goes through `openData`, leaves no file link, no name, the unsaved dot off, history reset.
- **Yours**: stored in the browser through the platform (`collection('templates')` for the bytes, kv `wb111_templates` for the list with a small thumbnail). Rename, Download, Delete (two-tap), Replace on the same name, Add from file (newer formats refused).
- **Built-ins** are made by `npm run templates` from `tools/templates/recipes.js` (drives the built app, built-in shapes and plain colours only) into `src/templates/<kind>/*.wodblok` and `src/data/templates.js`. The stored files drop their own thumbnail (the list holds it). Files total about 1.5 MB (art image per file), which the build carries as base64 (about 2.2 MB).
- Tests: `tests/templates.spec.js`; `save-project.spec.js` File menu list updated.

## 1.11.1: Template picker close button id (hotfix)
- The picker's close button reused the id `tpx` of the repeat tile's "Exit 3 × 3 preview" pill, so it took on the pill's styling and its click handler was attached to the wrong element. It is now `tpclose`; nothing else changed.
- Test: `tests/templates.spec.js` checks that no id appears twice on the page and that the picker's X closes it. `repeat-tile.spec.js` (UX review D11) passes again.

## 1.12.0: UI standard (appearance only)
Applies docs/style-guide.md to the page CSS: tokens, three radii (4/8/12), three font sizes (11/12.5/14), one spacing scale, two durations, one group-label style, one sans-serif font (Fraunces removed). `npm run check:style` guards sizes, radii and fonts. No behaviour changes. Not done yet (own releases): shared folder-tree component and moving every library onto it ("Yours" home folder), icon stroke weights, `#fff`/`#000` literals, saved colourways and textures libraries.
Next: imported textures (was planned as 1.12.0; now 1.13.0).

## 1.14.0: Settings
- **File > Settings…** (command `settings.open`; last item of the File menu). One dialog, six pages, remembered page. Nothing opens at launch.
- **General:** Light / Dark (the existing top-bar toggle), Stage dots (the existing Display switch), **Accent**: eight presets (Oak is the built-in default) plus Custom from the colour picker. One colour becomes `--acc`, `--acc-ink`, `--acc-fg` and `--acc-soft` for both themes, with the ink kept at 4.5:1 on the panel. Oak writes nothing, so the stylesheet values stay exactly as they were. Kept in `wb114_accent`.
- **Colour:** Places shown in the tray dock (7 to 16, `setTrayView`), Clear recent colours.
- **Speed:** Draft while dragging (on by default; off skips the drafting while sliders and the stamp editor are dragged), Reduce motion (`body.calm`).
- **Files:** Autosave every 8 s / 30 s / 2 min (crash-recovery slot), storage used, Keep my data (the browser's persistent-storage request).
- **Shortcuts:** a searchable, read-only list built from the command registry.
- **About:** version and licences (Hanken Grotesk and IM Fell English under the SIL OFL, fflate under MIT).
- Not in this release: **Export everything / Import everything** (still not built, so Files cannot offer it), a units setting (the app has no inch/cm switch), and **rebinding shortcuts** (the key handler in `34-desktop-shell.js` is written key by key, so the registry's shortcuts only document it).
- Code: `src/modules/55-settings.js`; `setAutosaveEvery` in 38, `setTrayView` in 50, `paintDock` exported from 52, one `!WBS.NODR` check in 02. Ids and classes of the dialog start with `stg` (the saved-trays list already owns `st…`).
- Tests: `tests/settings-menu.spec.js`; the File menu lists in `save-project.spec.js` and `templates.spec.js` now end with Settings….

## 1.15.0: Wood accents
- The Settings accent presets are named after woods and tuned to sit with Oak: **Oak** (the bronze default), **Birch** (silver grey), **Rosewood** (red), **Ironwood** (metallic blue), **Eucalyptus** (green), **Purpleheart** (purple), **Walnut** (dark brown), **Maple** (pink). All are desaturated and warm; the accent tokens of each theme are still derived from the one base colour, ink at 4.5:1 or better on the panel.
- The swatches are in hue order (Rosewood, Walnut, Oak, Eucalyptus, Ironwood, Purpleheart, Maple), with the grey Birch last.
- The Accent row shows the chosen name (Custom for a picked colour). A colour saved by 1.14.0 that is not one of these eight shows as Custom.
- Code: `stACCENTS` and `stAccentName` in `55-settings.js`. Test: `tests/settings-menu.spec.js`.

## 1.16.0: Export watermark
- A **Watermark** checkbox at the top of the Export panel (off by default, kept in this browser as `wb116_watermark`). When on, PNG, JPG and TIFF pictures get the Wodblok mark in the top-left corner and "Made with Wodblok" in the bottom-right. This covers custom export, recipes, Export all, colourway zips and the Quick PNG.
- The mark and "Wodblok" use the current accent colour. "Wodblok" is set in IM Fell English (the top bar wordmark font) and "Made with" in Hanken Grotesk at 600, the heaviest bundled weight. "Made with" turns white or near-black to suit the picture under it, and both marks carry a faint soft shadow so they stay readable on busy patterns. Sizes follow the shorter side of the picture (logo 11%, text 4.2%).
- SVG files are never watermarked (a vector file cannot carry the fonts), and the checkbox is greyed out while SVG is the chosen format. The Print cover PDF/PNG and the print proof are not watermarked.
- The mark is drawn from the top bar logo's own outline, so there is no second copy of the logo in the code.
- Code: `src/modules/56-watermark.js` (`wmGet`, `wmSet`, `wmReady`, `wmDraw`); hooks in `xrRender` (43) and the Quick PNG handler (14). Test: `tests/watermark.spec.js`.

## 1.16.1: Favicon links for the hosted app
- The hosted page (app.wodblok.com) now links `favicon.ico` and a new 32 px PNG (`icon-32.png`, cut from the existing icon) next to the inline SVG icon, so Chrome has plain files to fall back on and a new address to fetch. Both files are in the offline cache and served with `no-cache`, so a changed icon is picked up. The artwork is unchanged: the same WB mark.
- Chrome keeps favicons for a long time. If a tab still shows an old icon after this goes live, close the tab and reopen the site.
- Code: `WEBHEAD` in `tools/build.js`, `src/web/sw.js`, `src/web/_headers`. Test: `tests/web-app.spec.js`.

## 1.27.0 (accounts in the app)
Name chip in the status bar, File > Account…, File > Send feedback…, the 7-day offline pass with a locked screen, active-time totals for early access and testers, Sign out and Manage account through the site. `/api/me` reports `gated`; the gate cookie lasts one day. The network rule in CLAUDE.md now allows `src/platform/account.js` only, and `check:platform` enforces it. Tests: `tests/account.spec.js` (build target), `tests/site-accounts.test.mjs`, `tests/site-account.spec.js`. Fixed a comment that made `check:platform` fail.

## 1.27.2 (site simplified, product video slot, privacy page, accent colour on the site)
- **Site copy** cut to plain statements: title "Stamped-pattern editor", one line under it, section labels "Video" and "Artwork", footer "Privacy" and "Contact". The waitlist form is gone from the page (Create account already puts people on the list; `/api/waitlist` and its tests stay). One way in: the big button reads Create account when signed out, Open Wodblok when approved, and is hidden when signed in but not approved.
- **Video slot:** a 16:9 frame under the title. Put the time-lapse at `site/video/timelapse.mp4` (an optional still at `site/video/timelapse.jpg`); it autoplays muted on a loop, with controls if reduced motion is on. Until the file exists the frame stays empty. Cloudflare Pages allows 25 MiB per file.
- **Privacy page:** `site/privacy.html`, linked from the footer and listed in the sitemap. The owner should read it once: it states what is stored (docs/accounts.md) and that nothing from a project is uploaded.
- **Accent colour:** the app writes the colour picked in Settings > General > Accent as a cookie for the whole domain (`wb_accent`, six hex digits; Oak clears it; hosted app only, in `src/platform/account.js`). `site/accent.js` reads it and sets the same four tokens, using the app's own colour maths copied unchanged (`tests/site-accent.test.mjs` fails if the copies differ). It follows the browser, not the account, so a different browser shows the default colour until the app has been opened there.
- Tests: `tests/site-marketing-page.test.mjs`, `tests/site-accent.test.mjs`, `tests/account.spec.js` (cookie set, cleared, none from a local copy).

## 1.26.3 (header polish)
The plain "Open Wodblok" button no longer flashes before the account header appears (hidden while Clerk loads, back if Clerk cannot load); the signed-in button reads "Hi <name>!".

## 1.26.2 (gate cookie)
The app host never received Clerk's session cookie, so the gate bounced signed-in people back to the site. The site now sets a one-hour signed cookie (`wb_gate`) for the whole domain; the gate and `/api/*` accept it. Tests: `tests/site-accounts.test.mjs`, `tests/site-account.spec.js`. Also restores `npm run test:site` to include the accounts tests.

## 1.20.0: Accounts, server side and website (the app side is 1.21)
- **What:** sign-up and sign-in with Clerk; the owner approves people by setting `type` (`early_access`, `tester`, `subscriber`) in the Clerk dashboard; only approved accounts can open the hosted app; an automatic "You're in" email on first approval; a new-account alert to the owner; usage time and feedback stored in D1 for the app to send (1.21). Full description and the dashboard set-up steps: docs/accounts.md.
- **Switched off until configured:** the header buttons need a Clerk key in `site/account-config.js`; the gate needs `GATE_HOSTS` in Cloudflare. Merging changes nothing visible by itself.
- **Code:** `functions/_middleware.js` (gate), `functions/api/{me,usage,feedback}.js`, `functions/api/webhooks/clerk.js`, shared code in `server/accounts/`, header buttons `site/account.js`, `site/account.css`, `site/account-config.js`; `tools/accounts/make-pass-key.mjs` makes the offline pass key. The app itself (`src/`) is not touched.
- **Email:** through Resend, which the waitlist already uses (no Cloudflare Email Service, so no Workers Paid plan is needed for email).
- **Tests:** `tests/site-accounts.test.mjs` (token checks, gate, usage, feedback, webhook; real SQLite, generated keys, run by `npm run test:site`) and `tests/site-account.spec.js` (header with Clerk stubbed). CI's site job now runs on `functions/**` and `server/**` changes and uses Node 22.
- **Not tested against a live Clerk:** see "Things to know" in docs/accounts.md.
- **Next, 1.21:** name chip in the status bar, File > Account…, File > Send feedback…, the 7-day offline pass, the usage counter, and the CLAUDE.md network rule (only `src/platform/account.js`).


## 1.25.0: Logo 1 template; the template picker opens at launch
- **Logo 1** (a project supplied by the owner) is the first starting point after Blank in Normal canvas. Hand-made built-ins are listed in `CUSTOM` in `tools/templates/recipes.js`, kept in `tools/templates/custom/`, and added by `tools/templates/add-custom.js` (which `npm run templates` runs at the end, so regenerating keeps them).
- **Launch**: the New from template picker opens when the app starts (Normal canvas kind unless another was last used). Closing it leaves the blank project. Settings > General > Templates at launch turns it off (`wb111_tplstart`).
- Tests: `tests/templates.spec.js` (Logo 1, launch picker and the setting); the test harness turns the picker off unless a test passes `templates: true`.

## 1.26.0: Sidon album cover template
- **Sidon album cover** (a project supplied by the owner, a diamond canvas with three pictures) is the second starting point after Blank in Normal canvas, right after Logo 1. Added through `CUSTOM` in `tools/templates/recipes.js` like Logo 1.
- Tests: `tests/templates.spec.js` (order, count, opens clean like the other built-ins).
