# WODBLOK: what the project's Claude memory knows

For any Claude agent that works on WODBLOK without access to the owner's Claude memory or Project. It is the development-relevant part of that memory, kept in the repo so every agent has the same context. **Rule: whenever something about WODBLOK is saved to Claude's memory (a decision, a preference, a standing instruction), add it here too, in the same session, with the date.** Keep it free of anything personal (no names, emails, accounts, prices or business plans; this repo is public). The rules themselves are in `CLAUDE.md` and `docs/developing-wodblok.md`; this file is the history and the standing preferences behind them.

Last updated Oct 18 2026 (version 1.46.0).

## How the owner wants Claude to work
- Show a task list, and an approximate percentage complete on short status updates, in the chat. No separate progress page.
- Work only from the newest `main` on GitHub. Any preview is built from the repo and published to the one preview artifact (https://claude.ai/artifact/AkEURvCERNYJmNPWwiEduB); never a parallel copy.
- The "refresher": check out the repo to get up to date and look at wodblok.com.
- Do not run the full test suite unless told to.
- Do not mention stop-hook "unpushed commits" warnings unless one is real.
- Every release is double-checked to be actually live.
- Versioning: a multi-step update is one update. Each step raises only the patch (0.0.x); the minor (0.x.0) rises once when the whole update is finished. (The text update 1.39-1.46 predates the rule.)
- The layer update, when finished, is **version 2.0.0** (a new major, by the owner's choice), not 1.47.0. Its steps are 1.46.1, 1.46.2 and so on.
- When suggesting the full test suite, give an importance percentage with one sentence of why, and run it as the CI shard suite (PR ready: four Chromium shards, WebKit, picture comparison), not the slow local run; only when the owner says so.
- Layer update: one complete step at a time; the plan document (`docs/layer-update-plan.md`) is updated after each step; anything saved to memory is also written to this file.
- Going live (merging to `main`) only when the owner says; he sometimes says "just merge" without CI, which is his call. Say before going live if saving, opening files or the file format is touched.
- Snapshots: state and SVG snapshots only with his approval. Pending: `tests/__snapshots__/scenarios.spec.js/randomize-seed-1-state.json` (a letter's y changes by a fraction since 1.42.0's real font outlines; also differs locally on `main`).

## Product decisions (by date)
- **Direction:** a professional editor (Adobe-like), desktop-first look, web app first; Mac/Windows/mobile later, not blocked. Commercial product, to be sold later.
- **Panels have no explanatory text, no tooltips.** Plain everyday words for names. "Motif" is now "shape"; "Ink surface" is now "stamp texture".
- **Canvas shapes** are regular geometric ones only. **No brush masks.** Grade masks: linear, radial, layer, colour range, luminance range, per stamp and over the whole canvas.
- **Launch:** always fully cleared, Pattern mode; Clear resets the canvas shape to a rectangle; workspaces open their tool windows; the template picker opens unless switched off in Settings.
- **Randomize:** a left-rail tool; checkboxes for the main features with dropdown sub-options; with everything off it changes nothing; keeps showing the old picture until the new one is ready; must not bring in saved library stamps (imported shapes are fine); gentle random grading; can place free stamps and text.
- **Colour:** Wada's *A Dictionary of Color Combinations* is the library; the **tray** (7 slots shown, "+" to 16) replaces fixed palettes; "palettes" are now **trays**, saved in folders; **colourways** are named saved trays (export all colourways as a zip); lock icon on colour selectors (open lock = linked to a tray slot, locked = fixed colour, never alters the slot); colours carry opacity; colour picker with RGB/HSB/hex and a dropper that samples the canvas. Old saved files need not carry over for colour changes.
- **Libraries** (shapes, stamps, textures, colours, colourways, templates, workspaces, export recipes, text styles) all use the same folder tree as the shape library. Saved textures can be imported as greyscale and tile in tile mode only.
- **Templates:** literally saved project files with their own colours; users can save their own; three types (normal canvas, repeating pattern, book). The owner designs the built-in starter templates himself and hands them over as exported projects.
- **Settings:** a Settings menu (General, Colour, Speed, Files & storage, Shortcuts, About); the accent colour is the user's choice among eight woods (Oak default, Birch, Rosewood, Ironwood, Eucalyptus, Purpleheart, Walnut, Maple), sorted by hue.
- **Brand:** "WB" letter mark in bronze (bare letters, no tile); the wordmark in IM Fell English; the mark is also the favicon. Light/dark toggle in the top bar, dark default ("Atelier" style: warm graphite and warm paper, brass accent).
- **Speed matters** ("the speed update", done in passes: redraw less, draft while dragging, each stamp printed once). Vector stamp textures preferred to filtered bitmaps. A big renderer rewrite was shelved for now.
- **Stamps and layers (earlier decisions):** each stamp has its own shape and size (mixed through layers that share a grid); Free place layers list their stamps; a blend where the overlap prints nothing, and a "Replace" blend with a chosen colour; Art layers import images or saved projects (live link), crop per placed copy; stamp library with PNG export; a Randomness section (rotation and position jitter, random flips, random rotation that respects each stamp's symmetry); Shape selector in the grid tools (Square, Hexagon, Triangle, Diamond); the Shape editor is a floating panel that opens when a shape is placed.
- **Text update (done, 1.39-1.46):** one Text tool for both editors; real font outlines (opentype.js); box and fit; letter effects; styled letters and paragraph options; wave and spiral paths, warp; Text styles library. Not built: drop caps, hyphenation, justify variants, text on a drawn path, a caret drawn on the canvas, hand-moved letters on Text layers.
- **Accounts:** sign-in with a managed auth service (Clerk) and Cloudflare for the backend; app requires sign-in and owner approval; usage time for early-access accounts only; users can delete their account and send feedback; one-week offline grace. Details: `docs/accounts.md`.
- **Site and beta:** the marketing site and waitlist are separate from the editor (`docs/site.md`). An early-access beta with a small group of artists is the near-term goal; speed and the UI reorganisation (templates, tray, colourways) were the first priorities.
- **Public repo:** public while developed; see `docs/public-repo.md` and Part 8 of `docs/developing-wodblok.md`.

## The layer update (started Oct 18 2026)
Owner additions (Oct 18): the tool rail has one tool per old layer type (Select, Arrange, Frame, Stamp, Shape, Image, Text, Grid); the Shape editor is renamed the **Element editor** and edits any selected shape, image, text or stamp.
The owner's decisions are in `docs/layer-update-plan.md`: no layer types, one continuous editing environment, a Stamp tool with outlines and an opacity slider, stamps are global, each stamp has a lock (locked by default; unlocked stamps take edits, locked ones don't), stamp contents are clipped at the outline, one arrangement per layer, Duplicate stamp yes, "Make unique" no, Pattern preview panel removed, Zoom to stamp with a Solo layer button, no Labs switch and no old editor kept, **no backwards compatibility at all** (old project files and templates need not open; the "old files must open" rule is removed when step 1 starts).
