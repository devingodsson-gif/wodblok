# Developing WODBLOK

The one document for anyone (a person or a Claude agent) who changes WODBLOK. It holds the working rules, the way a release is made, the code and test conventions, and, as Part 9, the complete UI and CSS standard. Read Parts 1 to 3 before touching anything, and Part 9 before touching any UI.

Written Oct 18 2026 at version 1.46.0 and brought up to 2.0.3 on Oct 19 2026, from the project's CLAUDE.md, the docs in this folder, and the owner's standing instructions. `CLAUDE.md` stays as the short list of rules that every session loads; this document is the long form. When they disagree, ask the owner. The layer update (the rewrite of the editor, finished as 2.0.0) is recorded in `docs/layer-update-plan.md`; the open plan is `docs/plan.md`.

**Contents**
1. What WODBLOK is, and the owner
2. Rules that are never broken
3. Working with the owner
4. The release workflow, step by step
5. The code: layout, build, conventions
6. Tests
7. Git, pull requests, CI, going live, undoing
8. The public repo, hosting, accounts and the other docs
9. The UI and CSS standard (the style guide, complete)

---

## 1. What WODBLOK is, and the owner

WODBLOK is a stamped-pattern editor: you design stamps (shapes, text, images), arrange them on layers in repeating or free layouts, add colour, texture and print effects, and export artwork. It is a web app first (one hosted page, also built as a single HTML file); Mac, Windows and mobile apps come later, and the code must not block them (Part 2, platform access).

It is a **commercial product**. The owner plans to sell it and wants it to feel like a professional editor (Lightroom, Photoshop, Affinity): quiet interface, fast, nothing wasted. Every release is treated as something real users will see, and every release must be double-checked to be actually released and working.

The owner is the only person who decides product questions: what a feature does, what the standard is, when something goes live. If a rule, a scale or a plan does not cover something, **ask and change the document first**; do not invent. Keep questions short and ask them only when the answer changes what you build.

Current state: see `docs/PROJECT_STATUS.md` (kept up to date by every session; this guide no longer carries a version).

## 2. Rules that are never broken

These are from CLAUDE.md and the owner's instructions. They win over anything else.

**What the app must always be**
- **No explanatory text or helper paragraphs in panels.** Short labels and clear grouping only. (The owner asked for these to be removed everywhere; do not bring them back.) **Tooltips: only a short name on hover (the `title` attribute: the `aria-label`, then its shortcut in brackets when it has one) on an icon-only control, never on a control that already shows its name, never a sentence (owner, Oct 22 2026).**
- At launch no panel is open and the project is empty (2.10.0). The template picker (New from template) also opens at launch unless Settings > General > Templates at launch is off. The app launches in **Pattern mode, fully cleared** (no work from the last session loads). Tests start with no panel open and the picker off (`tests/helpers/harness.js`), so they see an empty launch unless a test asks (`workspaces: true`, `templates: true`).
- **UI follows the standard in Part 9**: tokens and scales, one component per role, one folder tree for every library. Do not invent a size, radius, colour, duration or list design. If the scale lacks something, ask, and change the guide first.
- **Speed first.** Run `npm run perf` before committing anything that touches drawing, dragging or sliders. No perf regression over 10%.
- **No backwards compatibility** (owner, Oct 18 and 19 2026): a project file or template made by an older WODBLOK is refused with a message and never converted; the 18 to 21 migration and the v18 fixtures are gone (2.0.2). A file from a newer app still opens read-only and is never rewritten.
- **Platform access only through `src/platform/`.** User actions are commands in the registry. The document is plain data with stable ids. **No runtime network**, with one exception: `src/platform/account.js` may talk to the app's own host (`/api/me`, `/api/usage`, `/api/feedback`, `/api/gate-cookie`; see docs/accounts.md) and makes no request from a file or a local dev server. `npm run check:platform` fails on `fetch` and friends anywhere else. Fonts are bundled. Usage tracking is active-time totals per day for early-access and tester accounts only, never anything from a project or file, and nothing on the drawing or dragging path. Pointer events only; **nothing hover-only in new code**. **No `alert`, `confirm` or `prompt`.**
- **Modules export functions and do no work on import.** Start-up order lives in `src/main.js`.
- **Ask before adding a dependency.** Allowed licences: MIT, BSD, ISC, Apache, OFL. (The font parser opentype.js, MIT, was approved for 1.42.0.)
- **Snapshots and golden screenshots are never updated just to make tests pass.**
  - **Pixel goldens** (`tests/__golden__/`): when a full-suite run fails some, look at each diff. If it is exactly the change this release made on purpose (new labels, text size, layout, a new control), regenerate those goldens (`--update-snapshots=changed` on just those tests, then re-run them) and say in the report which ones and why. A golden that fails for a reason the release does not explain is a bug: fix it or ask, never regenerate it.
  - **State and SVG snapshots** (`tests/__snapshots__/`) need the owner's approval first: say which changed and why, and ask.
- Desktop (Mac/Windows) and mobile are later; do not build them now, but do not block them.

**Product decisions that shape the code** (all from the owner)
- The colour system is the **tray** (up to 16 colours; palettes are called trays; Wada's *A Dictionary of Color Combinations* is the default library); a small lock icon next to a colour selector means fixed colour, an open lock means linked to a tray slot. Colours carry their own opacity. Colourways are saved named trays.
- Libraries of any kind (shapes, stamps, textures, colours, colourways, templates, workspaces, export recipes, text styles) use the **same folder tree** as the shape library (Part 9, section 12).
- The word is **shape** everywhere in the UI (2.32.0: the library art and the element are both "Shape"; the code and the file still say `motif`). "Ink surface" was renamed **stamp texture**. Panels use plain everyday words (no jargon like "dry brayer").
- The canvas is always a rectangle (2.32.0; the rounded, circle, oval, arch, hexagon, triangle, diamond and polygon outlines are gone). A stamp can still have its own outline.
- Brand: the "WB" letter mark in bronze (bare letters, no tile behind them); the wordmark is set in IM Fell English and appears on the splash and the website, not in the top bar (2.43.0: the WB mark alone heads the bar); the same mark is the favicon. The accent colour is the user's choice, eight woods: Oak (default bronze), Birch, Rosewood, Ironwood, Eucalyptus, Purpleheart, Walnut, Maple.
- Launch is always cleared and in Pattern mode. Clear resets the canvas.

## 3. Working with the owner

- **Say what you are about to do first**, in a sentence, then start. Do not stop to ask whether to proceed when the request is clear. Ask (with a short choice) only when a wrong guess would be expensive to redo.
- **Keep a task list and show progress.** Use the task-list tool for any multi-step job, and in short status updates give an approximate percentage complete. Do not build a separate progress page.
- **Report once, in one short block** when a release is done: a task list with approximate % complete; what was and was not run; the importance of the full suite as a percentage with one sentence of why (if it was not run); any snapshot or golden that changed (ask before updating).
- **Do not run the full test suite unless the owner says so.** (He has objected to it being started unasked.) Run the quick tests that touch the change, and `npm run perf` where Part 2 says so. CI runs the whole suite on the pull request.
- **Do not mention "unpushed commits" stop-hook warnings or call them false alarms** unless one really matters (for example GitHub truly lacks the latest commit).
- **Always work from the newest `main` on GitHub.** At the start of every session: fetch, state the newest version on `main` (package.json) and the latest tag, and work from that, never from an older checkout or branch. Older versions and `legacy/` are never touched, rebuilt, archived or modified unless the owner explicitly says so. (The owner calls "check out the repo and go to wodblok.com to get up to date" the **refresher**.)
- **One preview artifact, never a copy.** Any preview is built from the repo and published to the one existing preview artifact (Part 4, step 5). Never publish a parallel or separate version; the owner worries about version fragmentation.
- **Going live is the owner's call**, per release: never merge to `main` until he says so. Say before going live if the release touches saving, opening files or the file format.
- **Memory in the repo:** anything about WODBLOK that is saved to a Claude's own memory (a decision, a preference, a standing instruction) is also written to `docs/agent-memory.md` in the same session, so every agent has the same context. Read that file at the start of a session.
- Write for a person who is not watching: finish, then give the result and one natural next step. No recap of the steps.
- Nothing personal in the repo (Part 8).

## 4. The release workflow, step by step

1. **Check the version first.** Fetch; state `main`'s version and the latest tag; work from that.
2. **Branch.** Work on `fix/<version>-<name>` or `feat/<version>-<name>`, never on `main`. Keep releases small (one theme, a few items) so a revert undoes little. **One commit per behaviour change, each with a test** (renames and CSS-only changes may share one commit and one test).
3. **Test, scaled to the risk** (Part 6). Quick tests for the change (under a minute or two) and `npm run perf` where Part 2 says so. The full suite only for risky changes, and only when the owner says so. When you suggest it, **give an importance percentage and one sentence of why**, and run it as the **CI shard suite** (open or mark the pull request ready; CI runs four Chromium shards, WebKit and the picture comparison), not as the slow local full run. Importance guide: about 60-90% importance for drawing, rendering, Randomize, saving and opening files, the file format or anything in `src/platform`; 30-50% for shared code such as history, panels or the document; below that, quick tests are enough.
4. **Version and docs.** Bump `package.json` and the lockfile (both version fields in `package-lock.json`). The build writes the version into `WB_VER`, the badge and `<title>` (1.0.0 shows as v1.0, 1.2.1 as v1.2.1). Each release raises the minor; a hotfix raises the patch; the major changes only when the owner says so.
   - **A release made of several steps is one update.** Each step raises only the patch (1.46.1, 1.46.2, ...) and the minor goes up once, when the whole update is done. (The text update 1.39-1.46 was numbered by step, before this rule. The layer update follows it: steps 1.46.1, 1.46.2 ... and the finished update is **2.0.0**, a new major version by the owner's choice.)
   - Write the release's outcome in `docs/plan.md` (the current plan; `docs/fix-plan.md` is the closed 1.0.x UX fix plan). One git tag per release, made by the tag workflow.
5. **Preview.** After each push that is not docs- or tests-only, rebuild (`npm run build`, from the clean commit so the bottom-bar stamp is the commit date) and publish `dist/wodblok.html` to the preview artifact (https://claude.ai/artifact/Y7qKSU4gbU9sCdQYNmBH93) with the Artifact tool: same URL, same capabilities, without being asked. (Updating it needs access to that artifact; if you cannot, say so and hand over the built file instead.)
6. **Report** once, in one short block (Part 3).
7. **Going live.** `main` is hosted on Cloudflare, so whatever lands on `main` is live on wodblok.com. Never go live without the owner saying so for that release. To undo, see Part 7.

## 5. The code

**Layout**
- `src/modules/*.js`: ES modules, in the order listed in `src/modules/manifest.json`. Source of truth for the app. `src/main.js` imports them and calls each module's `initNN()` in start-up order. `src/shell.html` is the page (markup, CSS). `src/platform/` is the only place that talks to the browser or network; `src/format/` is the project file container, migration and validation; `src/data/` holds the Wada colours, built-in shapes and templates; `src/vendor/` holds third-party code; `src/fonts/` bundled fonts (text fonts as `.woff`); `src/commands/` the command registry.
- `legacy/` is the old v100 single file and its hash, kept only as history; no test uses it. Do not edit it.
- `tools/` build and check scripts (`build.js`, `check-platform.js`, `check-style.js`, fonts, icons, templates, social batch, site tools).
- `dist/` is build output (`dist/wodblok.html` plus an identical `dist/index.html` for hosting).

**Commands** (`npm run ...`): `build` (single file), `build:web` (hosted app with service worker), `dev` (serves the unbundled modules at http://127.0.0.1:5199/; run tests against it with `WB_TARGET=esm`), `check:platform`, `check:style`, `test`, `test:build`, `test:legacy`, `test:update-golden`, `test:webkit`, `perf`, `perf-baseline`, `typecheck`, `coupling-map`.

**How the build works, and what follows from it**
- `npm run build` bundles all modules into **one scope**. So **every top-level name must be unique across all modules**. Prefix new helpers with a module-specific prefix (the text engine uses `te*`, the text panel `txo*`/`TXO_*`, text styles `ts*`/`TS*`). A clash shows up as "Identifier ... has already been declared" at start-up, not at build time.
- Code style is **dense, minified-style one-line statements**. Never put a `//` comment in the middle of a line (it swallows the rest). Put comments on their own lines.
- A vendor library in `src/vendor/` must end with a line `export {names};`; the build wraps it in a function so its names stay private. Keep its licence file next to it.
- Fonts are inlined as base64 `@font-face` by `tools/fonts.js`.
- Modules **do no work on import**. Adding a module: create the file, add it to `manifest.json`, import it in `main.js`, and call its `initNN()` where the order needs it.
- Add a new panel control by adding the markup in `src/shell.html` and reading it through the module that owns that panel. Use the existing component classes (Part 9); never new ad-hoc CSS.
- Keep the **document plain data with stable ids**; keep anything that needs a browser, network or storage behind `src/platform`.

**Textures (2.50.0)**
- Every texture is a **picture**: a grayscale WebP, at most 1024 px on its long side, that repeats without a seam. One picture is one repeat of the texture at Scale 100%.
- The built-in ones are the files in `textures/<set>/<id>.webp`. The build puts them into the app (`tools/textures/folders.js` fills `src/data/textures.js`), as it does with `templates/`. To change one, replace the file; to add one, drop a file in a set folder (the file name is the id: lower case, digits and `-`; the name shown is from `tools/textures/sets.json`, or made from the file name). Sets and ids in `sets.json` keep their order, because Randomize and saved projects use them.
- A dropped PNG or JPEG must be converted first: `npm run textures` (`tools/textures/make.js`) makes it a grayscale WebP of the right size and removes the original (`--seam` also blends the edges of a picture that was not made to repeat). The build refuses any other picture, and any file over 600 KB. Keep the whole folder under about 5 MB: it is inside the app. `textures/span.json` says how many repeats at Scale 100% a picture holds (default 1): a broad texture (big blotches) should hold 2 or 3 so it does not show a grid on a whole canvas.
- The placeholders were drawn by `tools/textures/bake.js` from the generators the app had until 2.49.0 (the generators live in that tool now, for later procedural effects).
- `16-texture-generators.js` draws a texture by repeating its picture (Scale, Rotate, Flip across, Flip down; a use's variation moves it) and then makes the wear, relief or stain picture as before. Pictures are read the first time they are wanted; everything is drawn again when they are ready (`WBX.wbTexPicReady`), and the tests wait for them (`printsBusy`).
- The texture library (`86-texture-library.js`) is the folder tree of Part 9 section 12, shown in the Texture effect. Your imported textures are kept in the browser (`wb250_textures`, through the platform); a project saves the imported textures it uses as files in its zip (`texImgs`), and opening it adds them to the library. No file format change: an older app ignores `texImgs`.

**The text system (1.39-1.46), the part most likely to be extended**
- `60-text-engine.js` is a pure engine: one options object in, positioned letter outlines out. Real outlines come from font files via opentype.js (`teReal`); the old tracing is the fallback. Layout and kerning use canvas `measureText`. Glyph key `t|<fontId>|<codepoint base36>`. Allowed stored path characters are `[MLQZ0-9.,\- ]`.
- `61-text-panel.js` reads and writes **all** Text panel controls (`txoRead`, `txoWrite`, `txoBind`, `txoSelBind`). A new text option is added **here, in the engine and in `src/shell.html` only**.
- `22-text-tool.js` is the unlocked-stamp side (text in a stamp is stored as one shape per letter, tagged `tg`, with a group record `tgm`); `26-text-boxes.js` is the Text layer side (one record per text `{u,tx,G,Lt,bw,bh,n,x,y,s,r,f}`). `62-text-styles.js` is the Text styles library.
- Options are saved **only when set** (`pd ft ov rp rr rs bb sc sd ind psp bal sty wp wa pt pa pw`, `va:'s'`), so old files and snapshots do not change. Randomness is repeatable (`teRnd(seed, letterIndex, purpose)`): adding a letter never moves the others. Randomize must not draw extra `Math.random` numbers for new options (derive from the words) or every Randomize snapshot shifts.
- The per-letter form of text in a stamp is a leftover of the old Stamp editor (gone in 2.0.0); build new text features as options on the text item and in the engine, never only on per-letter shapes.

## 6. Tests

- **Playwright**, driving the real UI. The only hooks are `window.__wbTest = { state(), commands, kv, ... }` (document state as a string; the command registry; the settings store). Helpers are in `tests/helpers/harness.js`: `openApp`, `openPanel`, `setMode`, `settle`, `getState`, `putText`, `checkpoint`.
- Determinism is injected from the test side: seeded `Math.random`, fixed `Date`, no network, fixed viewport and locale. The app is not modified for tests.
- **Targets:** `WB_TARGET=build` (default: `dist/wodblok.html`; run `npm run build` first), `WB_TARGET=esm` (unbundled modules from `node tools/serve-esm.js`, which must be running). Typical run: `WB_TARGET=build WB_PIXELS=0 npx playwright test tests/<file> --project=chromium --reporter=list`. `WB_PIXELS=0` skips pixel compares.
- **Three layers of checks:** document state (`tests/__snapshots__/**/*.state.json`), SVG markup summary (`*.svg.json`), pixels (`tests/__golden__/<WB_ENV>/`, only valid in the environment that made them). **CI is the reference for fonts and pixels**: a local run can differ slightly (for example the Randomize seed-1 snapshot differs by a fraction of a pixel locally, even on `main`).
- **Do not rebuild `dist/` while tests are running against it.** Build first, then test.
- **Writing a test:** one spec per feature, named for the release (`text-warp.spec.js`); assert `errors` is empty (`const { errors } = await openApp(page)`); drive controls through the DOM (a `set(page, id, value)` helper that sets `.value` and dispatches `input` works for ranges and selects); use `expect.poll` for anything that updates after a delay. Letters of a text in a stamp are readable in `getState` (`tiles[0].items`, group data in `tiles[0].tgm`); text layer pieces are in `layers[].pl`.
- **Known flakes** (docs/known-issues.md): SVG summaries taken a moment too early on slow machines; a re-run alone passes. `speed-guard` once reported "dangling references" in a full run and passed alone. Do not "fix" a flake by regenerating a snapshot.
- **Speed:** `npm run perf` (counters and timings on a fixed project, compared with `docs/perf-baseline.md`). `tests/helpers/speed.js` guards against new dangling references.
- Edit a stamp in a test through the canvas: `unlockStamp(page)`, `pickShape(page)`, `stampInstance(page)`, `clickStamp(page, p)` in `tests/helpers/harness.js`. Add tests when you touch an area without any.
- In a Claude Code session, a foreground command is limited to about 10 minutes: run long test runs in the background and wait with an until-loop on the log.

## 7. Git, pull requests, CI, going live, undoing

- Branches: `feat/<version>-<name>`, `fix/<version>-<name>`, `docs/<name>`. Never commit to `main`. Commits are small; each behaviour change has a test. **Never rewrite history, force-push, delete the repo or change its visibility** unless the owner asks for exactly that.
- **Pull requests:** open as a **draft** while working. Neither a draft nor a ready pull request starts the suite: it runs only when the owner asks (label the pull request `run-suite`, or run the workflow by hand). Several releases can be stacked (each PR based on the previous branch) and merged together later; retarget each to `main` in order when merging.
- In Claude Code sessions the GitHub tools are the `gh` CLI (`gh api repos/<owner>/wodblok/pulls --input file.json` to open a PR; REST check-runs to read CI; GraphQL is unavailable). A new feature branch needs `git config --add remote.origin.fetch '+refs/heads/<branch>:refs/remotes/origin/<branch>'` so the stop hook sees it. If a rebased branch is rejected as non-fast-forward, merge the remote branch with `git merge -s ours origin/<branch>` instead of force-pushing.
- **CI** (`.github/workflows/test.yml`) runs only when the owner asks (pull request label `run-suite` or Run workflow by hand): four Chromium shards, WebKit, the picture comparison with `main`, and a collecting job named `chromium`. Never add a workflow that runs on every push, never use macOS or Windows runners outside release builds, and keep a new push from restarting a run (concurrency cancel). Rules and reasons: docs/ci-budget-rules.md.
- **Going live:** merging into `main` makes the release live on wodblok.com a few moments later, and the tag workflow adds `vX.Y.Z`. Do it only when the owner says so for that release.
- **Undoing a release:** on a new branch run `git revert -m 1 <merge commit>`, open a pull request, check CI, merge. Do not force-push `main`; do not delete tags (the reverted version keeps its tag; the next release gets the next number). Full text: docs/going-live.md.

## 8. The public repo, hosting, accounts and the other docs

**The repo is public** (since Oct 11 2026) while WODBLOK is developed, and goes private again before it is sold. Treat everything pushed as published (it can be cloned at once, and copies survive going private).
- Never commit secrets (keys, tokens, passwords, the Clerk **secret** key; only the Clerk *publishable* key, which is public by design), the owner's email or phone, local file paths, or personal files. Check `git diff --cached` before every commit.
- Test fixtures (`tests/fixtures/`) must be made-up sample projects or ones the owner approved as public. Never add the owner's real project files, artwork, imported fonts or stamp library exports without asking.
- No third-party artwork, fonts or code without a licence that allows publishing (MIT, BSD, ISC, Apache, OFL). Claude-drawn built-in shape sets are allowed (the owner removed that rule on Oct 12 2026).
- No licence file and no "open source" wording: the code stays all-rights-reserved. No README that invites contributions or copies.
- Nothing that identifies the owner personally beyond the git commit author.
- Do not link wodblok.com anywhere public. Putting the site behind Cloudflare Access or blocking search engines is the owner's decision: never do it unasked, and do not raise it again unless the situation changes (selling starts, a paywall is built). The owner accepted on Oct 11 2026 that anyone who finds the site may use it for now.
- Before the repo goes private again, follow the checklist in docs/public-repo.md.

**Hosting:** `main` deploys to Cloudflare Pages (wodblok.com); docs/hosting.md has the build settings and the offline/update behaviour of the hosted app. Never put anything in the build that must stay secret (the whole built app is downloadable by visitors).

**Accounts:** sign-in uses Clerk with an approval gate for the hosted app, on Cloudflare (Worker, D1); it stays OFF until `GATE_HOSTS` is set in Cloudflare, so merging code changes nothing by itself. Full design: docs/accounts.md. A person must be approved to use the hosted app; first name is required at sign-up; usage time is tracked for early-access accounts only; people can delete their own account and send feedback from the app.

**Other docs in this folder**

| File | What it is |
|---|---|
| `PROJECT_STATUS.md` | Where development stands: current state, what was and was not tested, known issues, next steps, open questions (read at the start of a session, update at the end) |
| `agent-memory.md` | What the owner's Claude memory knows: standing preferences, decisions by date (read at the start of a session) |
| `layer-update-plan.md` | The layer update: the plan, the decisions and the progress log, updated after every step |
| `plan.md` | The current plan and the outcome of each release since 1.1.0 (add yours here) |
| `fix-plan.md` | The closed UX fix plan, 1.0.1 to 1.0.20 |
| `known-issues.md` | Bugs and test flakes found and not fixed, with what is known |
| `going-live.md`, `ci-budget-rules.md` | Release and CI procedure |
| `public-repo.md`, `hosting.md`, `accounts.md`, `site.md` | Public repo, hosting, accounts, the marketing site |
| `perf-baseline.md`, `baseline.md`, `coupling-map.md` | Speed numbers, the v100 baseline (history), map of the built app |
| `ux-review.md`, `ux-review/` | The Oct 2026 UX review and its pictures |
| `wodblok-repo-plan.md`, `phase5-spec.md` | The repo plan and the phase 5 spec (history) |
| `palette-names.md` | The Wada colour names |
| `social-batch.md` | The automated social image batch |

**Plans that live outside the repo** (the owner's Claude Project): the text plan, accounts plan, beta-week plan, speed audit, future features and premium roadmap. Ask the owner for any you need.

---

## 9. The UI and CSS standard

This part is the style guide (formerly `docs/style-guide.md`), complete and unchanged except that its headings sit one level lower. **Inside this part, "section N" means the numbered headings below (`### 1.` to `### 18.`), not the Parts of this document.** `npm run check:style` enforces the scales on the page CSS.

The rulebook for how every part of the editor looks and behaves. Read it before adding or changing any UI. When a rule here and the code disagree, the rule wins and the code is a bug to fix (section 15 lists the known ones).

**Scope:** the editor (`src/shell.html`, `src/modules/`). The marketing site is separate.
**Status:** written Oct 16 2026. Sections 2–14 are the standard. Release 1.12.0 applied the tokens, the three radii, three font sizes, the sans-serif font and the heading levels to the page CSS; `npm run check:style` enforces sizes, radii and fonts. Section 15 is the measurement taken on 1.11.0, before that release; what 1.12.0 did not change is listed in section 16.
**Words:** MUST and MUST NOT are rules. SHOULD is a default you can break only with a stated reason in the pull request.

### 1. Principles

1. **One way to do each thing.** If a control, list, dialog or heading already exists, reuse it. A second version of the same thing is a bug, even if it looks nicer.
2. **Few values, used everywhere.** Every size, radius, colour and duration comes from a short scale (sections 3–8). New numbers are not allowed in a feature; if the scale is missing something, change the scale first, in this document.
3. **Quiet chrome, loud artwork.** Neutral grey surfaces in the manner of Photoshop (owner, Oct 20 2026: "as much like Photoshop as possible"), dense rows, one accent, thin lines. The pattern is the only thing allowed to be bold.
4. **Labels, not words.** No explanatory text or helper paragraphs in panels. Clear grouping and short labels do the work. An icon-only control shows its name on hover (a `title`); a labelled control shows nothing extra.
5. **Nothing is hover-only.** Hover may add feedback, never the only way to find or use something.
6. **Speed is part of the look.** A style that slows drawing, dragging or sliders is rejected (`npm run perf`).

### 2. How to use this guide

- **Tokens, not numbers.** In CSS, write `var(--r-m)`, never `8px`; `var(--fs-m)`, never `12.5px`. The token names are defined in sections 3–8. Until the standardisation release lands (section 16), the table beside each token gives the literal value to use.
- **Roles, not look.** Choose a component by what it is for (section 9), not by which one looks closest.
- **No inline styles for chrome.** Colour, size, radius and font belong in CSS classes that use tokens. JavaScript may set only position and size that are computed (floating panel coordinates, the swatch colour variable `--c`).
- **Change the guide with the code.** A pull request that adds a reusable pattern updates this document in the same commit.
- **The user decides the standard.** Do not change a scale value, add a step or retire a component without asking.

### 3. Colour

The editor supports light and dark. Both must be correct for every screen. Theme is stored in `wb60_theme` and applied as `data-theme` on `:root`; the dark values are defined for the system preference and for the explicit setting. Keep both paths.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--stage` | `#d6d6d6` | `#1e1e1e` | Work stage behind the artwork |
| `--stage-dot` | `rgba(0,0,0,.06)` | `rgba(255,255,255,.04)` | Stage dots (off with `body.plain`) |
| `--panel` | `#ececec` | `#282828` | Panels, docks, dialogs, the active tab |
| `--raise` | `#f7f7f7` | `#323232` | Raised surfaces, menus, hovered rows, buttons |
| `--field` | `#ffffff` | `#1c1c1c` | Input and dropdown backgrounds, value boxes |
| `--line` | `#d0d0d0` | `#383838` | Quiet dividers and card borders |
| `--line2` | `#b8b8b8` | `#4a4a4a` | Control edges, menu and dialog borders, slider tracks |
| `--fg` | `#1f1f1f` | `#e3e3e3` | Primary text |
| `--mut` | `#5c5c5c` | `#a6a6a6` | Secondary text, idle icons |
| `--faint` | `#6b6b6b` | `#8f8f8f` | Group labels, counts, hints |
| `--sel` | `#c7d6ec` | `#3a5578` | **Selected row** in every list (Elements, libraries, menus' current item): Photoshop's muted blue |
| `--sel-fg` | `#1f1f1f` | `#ffffff` | Text and icons on `--sel` |
| `--acc` | `#b8914f` | `#c4a46e` | Accent: focus, key actions, slider fill and thumb, pressed toggles |
| `--acc-ink` | `#836635` | `#c4a46e` | Text and icons on a soft accent background |
| `--acc-fg` | `#1b1a18` | `#1b1a18` | Text on a solid accent fill |
| `--acc-soft` | `rgba(184,145,79,.16)` | `rgba(196,164,110,.16)` | Pressed toggles and modes, slider halo |
| `--warn` | `#c0532e` | `#e8895c` | Unsaved dot, warnings, destructive confirm |
| `--ok` | `#3f8f66` | `#7fb08a` | Success |
| `--shadow` | layered, neutral | layered, dark | Floating surfaces only |
| `--paper-shadow` | broad, neutral | broad, dark | The artwork sheet only |

Rules:
- Chrome MUST use these tokens. No literal hex or `rgb()` in chrome CSS or inline styles.
- Literal colours are allowed only for: the artwork and colours the user chose; the colour picker's own hue bar and handles; the swatch fallback `var(--c,#888)`; scrims (`rgba(10,11,14,.45)`).
- A swatch of the user's colour MUST have the swatch edge (`inset 0 0 0 1px rgba(0,0,0,.2)`) so pale colours stay visible. One value, everywhere.
- The accent colour is the person's choice (Settings > General). The values in the table are the default, **Oak** (again since 2.8.0; Steel, the blue of 2.3.0 to 2.7.0, is gone). The other named accents are woods: Rosewood, Walnut, Eucalyptus, Ironwood, Purpleheart, Maple, Birch. Chrome uses the tokens, never the literal, so a changed accent reaches every control. The settings code derives the four accent tokens of both themes from the one colour picked and keeps the ink at 4.5:1 or better on the panel.
- Selected rows use `--sel`, not the accent (Photoshop's Layers panel). The accent is for focus, pressed toggles and the one key action in a view. Never use it as decoration, and never for more than one primary action per view.
- `--warn` and `--ok` carry meaning only.
- Contrast: check muted and disabled text in both themes. State is never carried by colour alone (add the edge, weight or icon).
- Compare colours: `--ca` (blue) is A and `--cb` (amber) is B in Before/After; they mean nothing else.

### 4. Type

| Token | Size | Use |
|---|---|---|
| `--fs-s` | 11px | Labels, hints, counts, group labels, tab text, meta |
| `--fs-m` | 12px | Body, buttons, fields, list rows, menus. The base size |
| `--fs-l` | 13px | Panel and dialog titles (600); group titles use `--fs-m` 600 |

Brand sizes are separate and fixed: splash 20px (the 21px top-bar wordmark was removed in 2.43.0, owner Oct 24 2026). The "+" glyph of an empty slot is 18px (list) or 28px (large). Nothing else uses another size.

Font (one family, sans-serif only):
- **Hanken Grotesk** for every piece of text in the app, except the "WODBLOK" wordmark, which is set in IM Fell English (owner, Oct 22 2026; this is the only serif in the app; since 2.43.0 it is not in the top bar): the splash, titles, labels, buttons, fields, lists, menus, status messages and the print proof sheet. Fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- No serif, display or second UI face. Hierarchy comes from size, weight and case, never from a different font.
- Exempt: the fonts the user picks for their own artwork in the Text tool (and imported fonts). They are content, not interface.
- The font is bundled; no remote fonts, no runtime network.

Weights: 400 body; 500 tabs and segmented buttons; 600 titles, emphasis, selected row text and the primary button. Nothing else (no 300, no 700).

Other type rules:
- Numbers users compare (sizes, counts, values, dimensions) MUST be tabular (`font-variant-numeric: tabular-nums`; already set on `body`).
- Group labels: `--fs-s`, uppercase, `letter-spacing: .06em`, `--faint`. One style (section 11.2).
- Line height 1.4 unless a control sets a fixed height.
- Text in a control or row that can be long MUST truncate with an ellipsis, never wrap or push neighbours.

### 5. Shape

Three radii and a circle. Nothing else.

| Token | Value | Use |
|---|---|---|
| `--r-s` | 2px | Elements 20px tall or less: chips, checkboxes, tags, small swatches, slider-like handles that are not round |
| `--r-m` | 3px | **Everything else you can click, type in or select:** buttons, icon buttons, fields, dropdown buttons, list rows, menu items, tab highlights, segmented buttons, swatch wells, thumbnails, tiles, cards, the segmented container |
| `--r-l` | 6px | Surfaces that float or contain: menus, popovers, dialogs, floating panels, the colour picker |
| `50%` | circle | Dots, radio marks, round handles |

- A shape nested inside a padded parent takes the next radius down: inside `--r-l` use `--r-m`; inside `--r-m` use `--r-s`. A swatch well (`--r-m`) holds a swatch at `--r-s`; the segmented container (`--r-m`) holds buttons at `--r-s`.
- Slider and progress tracks use half their height.
- Docked panels, panel headers, tab strips and dock edges are square (radius 0). Only floating panels use `--r-l`.
- Border: 1px, `--line` for dividers and card borders, `--line2` for the edge of anything you click or type in. No 2px outlines except focus and selection (section 10).
- Corners are nearly square (Photoshop, 2.3.0). There is no 4, 5, 7, 8, 9, 10, 12 or 14. If a shape seems to need one, it is one of the three above.
- Exemptions: tracks of 1–3px (sliders, scrollbars) and the picture buttons listed in section 9.1. `check:style` allows these and nothing else.

### 6. Size, spacing and layers

**Control heights** (anything you click or type in):

| Token | Height | Use |
|---|---|---|
| `--h-xs` | 18px | Compact buttons inside rows and chips that act |
| `--h-sm` | 22px | Toolbar and panel-header icon buttons, small inline buttons, segmented control buttons |
| `--h-md` | 24px | **Default.** Buttons, fields, dropdowns, icon buttons, swatch wells |
| `--h-row` | 28px | List rows and folder headers (Elements rows hold a 20px thumbnail) |
| `--h-touch` | 36px | Any control that needs a touch target (the rail that used it is gone since 2.44.0) |

Elements under 18px are indicators (dots, chips that do not act, handles), not controls. Mixed heights in one row are not allowed: a row of controls shares one height.

**Spacing** (gap, margin and padding steps): 2, 4, 6, 8, 12, 16 px (`--sp-1` … `--sp-6`). 6 and 8 are the workhorses (control rows use gap 6; field groups gap 8).
- Between control rows in a group: 4.
- Between groups: 8.
- Panel and group inset: 12 on the left and right, matching the header; rows inside lists use 8. Spacing above 16 is a multiple of 4.
- A control's internal horizontal padding: 8 for fields, 12 for buttons with text.

**Elevation:** `--shadow` on menus, popovers, dialogs, floating panels and dragged ghosts. `--paper-shadow` on the artwork only. Docked panels, rows and cards have no shadow.

**Layers (z-index)** use these bands only; a new layer picks a band, never a new number:

| Band | Value | What |
|---|---|---|
| In a component | 1–9 | Overlap inside one control |
| Stage overlays | 40–45 | Bars, labels and handles over the stage |
| Menus and popovers | 50–60 | Anchored menus, dropdown lists |
| Drag ghosts, modals | 70–80 | Dock ghosts, dialogs with scrim |
| Floating panels | 9000+ | Managed by script, raised on focus |
| Pickers | 9100 | Colour picker, always above floating panels |
| Command search | 9500 | Mod+K |
| Transient | 9999 | Messages that must be seen |
| Splash | 10000 | Launch only |

### 7. Motion

| Token | Value | Use |
|---|---|---|
| `--t-fast` | 120ms | Hover, press, selection, chevron turns, slider thumb |
| `--t-slow` | 200ms | Fades and the unsaved dot |

- Menus, dropdown lists and popovers enter with `popin` (fade, 4px rise, scale .98→1) at `--t-fast`, ease-out. Nothing else animates on entry.
- Panels do not animate open, close or dock (deferred; see the roadmap).
- Animate only `opacity`, `transform` and colour properties. Never animate `width`, `height`, `top` or `left` of anything over the artwork.
- `prefers-reduced-motion: reduce` MUST remove every animation and transition.
- Nothing may block or delay input for the sake of motion.

### 8. Icons

- One icon family, drawn once in `src/modules/00-icons.js` (2.14.0, owner: minimalist and clear, like Photoshop): line icons on a 24-unit grid inside 3.5..20.5, `stroke="currentColor"`, round caps and joins, no fill, no emoji, no text glyphs as icons. Frames have a 1.5 corner radius; a dot is a small circle.
- The page's icons are `<svg class="ic" data-ic="name"></svg>` (filled at start-up by `icFill`); code uses `ICN.name` or `ic(name)`. A new icon is added to the set, never drawn inline.
- Sizes: 13px in dense rows, 15px in panel headers and toolbars, 18px in the top bar's icon buttons. Nothing else.
- Stroke weight is one hairline at every size: `--ic-w` (1.25px) with `vector-effect: non-scaling-stroke` in the `.ic` rules; an icon sets no stroke width of its own.
- Idle icons `--mut`; hover `--fg`; selected `--acc-ink`.
- Every icon-only control has an `aria-label`, the same words as its `title` (shown as a short name on hover; owner, Oct 22 2026), and a keyboard route.
- Texture, brand and drawn shapes are artwork, not icons, and are exempt.

### 9. Components

Each component has one definition. If a screen needs a variant, it uses the closest one; it does not invent a look.

#### 9.1 Buttons

| Role | Looks | Use |
|---|---|---|
| **Primary** | `--acc` fill, `--acc-fg` text, 600, `--h-md`, `--r-m` | The one key action of a view or dialog (Save, Open, Replace). At most one per view |
| **Secondary** | `--raise` fill, `--line2` border, 400, `--h-md`, `--r-m` | Every other text button |
| **Quiet** | Transparent, no border, `--mut` text | Rows, headers and toolbars where a bordered button would be noisy |
| **Icon** | Transparent until hover, `--h-md` square (`--h-sm` in a panel header, `--h-xs` in a row), `--r-m` | One action, no text |
| **Toggle** | Secondary that stays selected: `--acc-soft` fill, `--acc` edge, `--acc-ink` text, `aria-pressed` | On/off settings |
| **Destructive confirm** | Secondary whose label turns to the verb with `--warn` text on the first tap | Second tap does it (sections 12.6 and 12.7) |

- Button text: sentence case, a verb or a short noun ("Save", "Add colour"). A trailing `…` means it opens a dialog or asks for more input, and only then.
- Buttons in a row sit 8px apart; icon buttons 4px apart.
- Buttons do not change size when their state changes.

#### 9.2 Sliders (the value row)

One row layout for every slider: **label | track | value**, in a grid of `96px  1fr  44px`, gap 8, rows 4px apart (Photoshop style, 2.3.0).
- Label: `--fs-s`, `--mut`. Dragging the label scrubs the value (`ew-resize`).
- Track: 1px tall, `--line2`, filled part `--acc`. Thumb: a small triangle (9px wide, 6px tall) pointing up, sitting just under the track, `--fg` fill (`--acc` while pressed).
- While pressed the thumb takes the accent. That is the only slider motion.
- Value: a small box (`--field`, `--line` edge, `--r-s`), right-aligned, tabular, `--fs-s`; it is editable by clicking. Units appear in the value (`12 px`, `45%`), never in the label.
- Slider steps and ranges are chosen so a drag feels continuous; never fewer than about 100 positions across the track unless the setting is discrete.
- A slider MUST NOT rebuild the whole picture when only an overlay opacity changed (see the speed audit).

#### 9.3 Fields

- Text and number fields: `--h-md`, `--r-m`, `--field` fill, `--line2` border, `--fs-m`, padding 5 / 8. Number fields are tabular and right-aligned.
- Focus shows the standard outline (section 10); no glow.
- An invalid value shows `--warn` edge and keeps the typed text. It does not clear the field.
- Colour fields (hex, RGB, HSB) are uppercase and tabular.
- Search fields are fields with a leading icon; they appear when a list can pass about 20 items.

#### 9.4 Dropdowns

- Native `<select>` is never shown. Use the custom dropdown (`.dd2`, which hides the native select).
- Button: `--h-md` minimum, `--r-m`, `--field` fill, text left, chevron right that turns 180° when open.
- List: `--r-l`, `--raise`, `--line2` border, `--shadow`, padding 5, enters with `popin`.
- Item: padding 6 / 9, `--r-m`; current item `--acc-soft`, `--acc-ink`, 600; disabled item opacity .4.
- Opens below the button; flips above when there is no room. Esc closes; arrow keys move; Enter picks.

#### 9.5 Segmented control

A row of two to four mutually exclusive options. Container `--r-m`, `--panel` fill, `--line` border, padding 2, gap 2; buttons `--r-s`, 500; selected = `--raise` fill with `--line2` edge (or `--acc-soft` when it shows a mode of the whole app). Use it instead of a dropdown when there are four options or fewer and the choice should be visible.

#### 9.6 Colour wells and the picker

- Well (`.ccb`): 38 × 30, `--r-m`, padding 3, the swatch inside fills it and has the swatch edge. It opens the picker directly.
- Linked or locked state: the lock icon sits beside the well, `--h-md` square icon button; open lock = linked to a tray slot, closed lock = fixed. Same place on every colour control.
- Picker (`.cpop`): 224px wide, `--r-l`, padding 10, gap 10, `--shadow`. Saturation square 132px tall `--r-m`; hue bar 12px tall; fields below; recent colours last.
- Dropper is part of the picker, never a separate window.
- Never write a one-off colour input; every colour in the app is chosen through the picker.

#### 9.7 Tabs and panel openers

- No rail (2.44.0, owner Oct 25 2026): panels open from the menu bar (Window lists all; Image: Canvas, Grid; Elements: the element list; Edit: History; Colour: Colours; Export: Export recipes; Effects: Randomize), from the element bar, and from two top bar buttons (History beside undo, a gear beside Randomize). A top bar button that opens a panel is an `.ib` with `aria-pressed`, `--acc-soft` while its panel shows, and a second press closes it. The hidden `#pnop` buttons are the openers every command and menu presses; never show them again as a strip.
- Panel tabs (`.wtab`), Photoshop style: the tab strip is `--stage`; tabs `--fs-s`, 500, `--mut`, 10px side padding, square; the active tab takes the `--panel` colour and `--fg` text, so it joins the panel below. No accent bar.
- Stamp tabs (2.5.0): the strip over the stage reuses `.wtab` (the Canvas first, then one per open stamp with a close `.ib` of `--h-xs`); it is `--stage` with a `--line` bottom edge, `--h-md` high, and is not on screen while no stamp is open.
- A tool opens a panel; a panel never opens by itself at launch, except through the built-in launch layout.

#### 9.8 Swatches, thumbnails and cards

- Swatch: 18–30px square, `--r-s` (≤20px) or `--r-m`, with the swatch edge.
- Thumbnail: keeps the picture's aspect, `--r-m`, `--line` border. Lazy-loaded; never rendered on open.
- Card (a thumbnail with a name): `--r-m`, `--line` border, name `--fs-m` truncated below the picture; hover `--raise`; selected `--acc` edge + `--acc-soft`.

#### 9.9 Status

- One status line at the bottom of the window. Messages are short past-tense sentences with the name in curly quotes: `Saved template “Rose”`, `Started from “Brick”`, `Could not read that file`. Library messages are in section 12.9.
- The unsaved state is an 8px dot (`--warn`) beside the name; no text.
- No toasts, no `alert`, `confirm` or `prompt`.
- The account chip ("Hi <first name>!", the one place an exclamation mark is allowed: the owner asked for it to match the website; `--fs-s`, `--mut`, a quiet button) sits at the right of the status line and exists only while signed in.

#### 9.10 The element UI (2.3.0, Photoshop)

- **Elements and element panels (2.6.0):** one docked column on the right. Elements (the list of everything) on top; the element panels sit under it as tabs under their own names (Text, Pattern, Shape, Stamp); there is no "Properties" tab. Each panel starts with the list of its own elements (`.elk`, the Elements row design) and, for Text, Shape and Pattern, an Add button; the selected element's properties follow. Selecting an element anywhere shows its kind's panel.
- **Add bar** (the element bar over the stage): Select first, then Paint (hidden for now), Shape, Text, Stamp, Pattern. Shape and Stamp make nothing by themselves: each clears the selection and opens its own properties. A Shape or a Stamp picked there follows the pointer as a ghost and every click on the canvas places one, as often as wanted (Select, V or a right click puts it away). Text, Pattern and Image make an element at once, just above the selected one, and select it (an imported picture makes a Rectangle shape filled with it). The Background is not an element and has no button (Canvas panel). The pressed button is the armed or waiting tool; Select is pressed when nothing is. `--h-md` icon buttons in a `--r-l` floating strip.
- **Options strip:** one line under the Add bar while a tool with settings is armed (Paint: Brush / Eraser and size). `--h-row`, `--panel`, `--line` edge, `--r-m`. It holds copies of the tool's own controls, nothing else.
- **List rows** (Elements, effects, sources): `--h-row`, eye first, a 20px thumbnail or icon, the name (truncates), actions last (⋯). Selected row `--sel`. A row with effects shows an `fx` chip; its arrow unfolds one `--h-sm` sub-row per effect (eye, name), indented.
- **Effects group:** the title carries a `+` (`--h-sm` icon button) that opens the menu of effects. Rows: eye, chevron, name, ⋯ (Duplicate, Move up, Move down, Delete); drag to reorder. Clicking a row opens its settings right under it and closes the one that was open.
- **Pattern sources:** rows with a `--h-md` thumbnail, the name, the weight (only when the pattern picks by weight) and remove.
- **Width and height, Fill and Outline groups** (2.31.0, the look of a shape; the old Shape element is gone and its shapes are the Basic shapes set): in the Shape panel under Edit while a canvas motif or a stamp's motifs are selected, and under a Pattern's sources while one of its motif sources is picked (one set of controls that moves, like the Element group). Width and height (two sliders and a colour well) shows for a pattern source only; Fill is a three-segment control (None, Colour, Image) with the picture strip, Cover/Fit and Zoom; Outline is a switch with a Thickness slider and a colour well. **Map to shape** (Text and Pattern): a select of the Basic shapes motifs on the canvas, then a two-segment control (Follow outline, Inside) and a Start slider.
- **Smart guides** (2.40.0): while something is dragged or a side pulled, a 1px `--acc` line (`.sgl`, non-scaling, crisp) runs through every edge or middle that lines up, across the boxes it lines up with or the whole canvas; equal gaps get a line with a 4px tick at each end (`.sgs`), three quarters of the way along the part the boxes share. Drawn in the selection overlay, nothing else; no labels. Settings > Guides holds the switches (toggle rows) and Snap distance (segmented, `4 px` `6 px` `10 px`).
- **Stamp editing bar:** while a stamp is being edited, a floating bar at the top of the stage reads "Editing Stamp N" with a primary Done. The Elements list shows the stamp's contents in place of the elements.

### 10. States

| State | Rule |
|---|---|
| Rest | Token colours, no shadow |
| Hover | Fill `--raise` (on `--panel`) or edge `--line2`; icons to `--fg`. `--t-fast` |
| Pressed | One step darker/lighter fill; never a size change |
| Selected row | `--sel` fill, `--sel-fg` text and icons (Photoshop's Layers). No edge needed: the fill is the cue |
| On (toggle, mode) | `--acc-soft` fill, `--acc` edge, `--acc-ink` text. Plus a non-colour cue (edge or weight 600) |
| Focus | `:focus-visible { outline: 2px solid var(--acc); outline-offset: 1px }`. Never removed. On a coloured fill use `0 0 0 2px var(--panel), 0 0 0 4px var(--acc)` |
| Disabled | Opacity .4, not clickable, still readable. No tooltip explaining why |
| Dirty / unsaved | 8px `--warn` dot |
| Error | `--warn` edge and a status-line message; content is kept |
| Loading | Keep the old picture; show the busy state in the status line. No spinners over the artwork |

### 11. Panels, headings and groups

#### 11.1 Panel structure

- **Panel header:** min-height 32, padding 4 / 8 / 4 / 8, bottom border `--line`; title `--fs-l` 600; header actions on the right are `--h-sm` icon buttons or one `--h-sm` quiet text button, gap 8.
- **Body:** scrolls; inset 8 left and right.
- **Group (`details.g`):** summary padding 6 / 8, `--fs-m` 600, chevron left, bottom border `--line`; hover tints with `--raise`. Group content aligns to the same 12px inset.
- **Group label** (a sub-heading inside a group): section 11.2.
- **Panel bar** (the compact bar under a header with a setting, e.g. Auto-open): padding 7 / 10, `--fs-s`, `--mut`, bottom border `--line`.
- Panels MUST work at narrow widths: no fixed widths that overflow; labels truncate; the slider grid keeps its columns.
- A panel works docked left, right, top or bottom, tabbed and floating. Test all three before shipping.

#### 11.2 Headings (the complete list)

| Level | Style | Use |
|---|---|---|
| Panel / dialog title | `--fs-l`, 600 | Once per panel or dialog |
| Group title | `--fs-m`, 600, in a `details.g` summary | Collapsible groups |
| Group label | `--fs-s`, uppercase, `.06em`, `--faint`, padding 8 / 10 / 2 | Dividing a group inside a panel ("Showing", "All"). Libraries do not use it; their folders are rows (section 12) |

There is no fourth heading. `h1`–`h6` tags are used for structure, then styled as one of these three.

#### 11.3 Mode and launch

- Launch: Pattern mode, fully cleared, no tool window open.
- There is one list of panels for the whole app (the Stamp editor is gone in 2.0.0); a stamp is edited on the canvas by unlocking it in the Stamps panel.
- Workspaces (saved layouts) were removed in 2.9.0; the one built-in launch layout is applied once at launch. Variations, Presets, Navigator and the Textures and Grade tools were removed too.

### 12. Libraries and the folder system

**The motif (shapes) library is the model.** Its folder system is the one way to organise anything a person picks from a saved collection. Every other library works exactly like it: the same tree, the same rows, the same menus, the same words. Only the item (tile, card or row) differs.

#### 12.1 What is a library

A library is any collection a person saves things into and later chooses from. Today and planned:

| Library | Items | Item shown as |
|---|---|---|
| Shapes (motifs) | Imported and built-in shapes | Tiles |
| Stamps (saved stamps) | Stamps | Tiles |
| Textures | Imported and built-in textures | Tiles |
| Colours (saved trays) | Trays of colours | Rows with a swatch strip |
| Colourways (saved colourways) | Named colour sets | Cards |
| Templates | Template projects | Cards |
| Workspaces | Panel layouts | Rows |
| Export recipes | Export presets | Rows |

Rule: if someone chooses one of many saved things from a list or a menu, it is a library and it uses this tree. No library gets its own list design, its own folder design or its own words. A short list is still the tree, just with no folders made yet.
Not libraries: the layers list, the Stamps tool's list of this project's stamps, the tray's 16 colour places, history, and **this project's colourways** (a handful of cards that belong to the document, so no folders). A colourway becomes a library item only when it is saved to the Colourways library.

#### 12.2 One tree

Words (use these and no others):
- **Item:** one saved thing (a shape, a stamp, a texture, a tray, a colourway, a template).
- **Folder:** a container the user makes. It holds folders and items, to any depth.
- **Set:** a built-in folder that ships with the app (for example a shape set, Wada's tray sets, Starting points). Sets sit in the same list as your folders.
- **Home:** the folder that holds your own items that are not in a folder. It is the first row of every library and is always shown. Its name is **Yours** in every library. (Shapes still say "My imports" until the standardisation release renames it.)
- **Active folder:** the last folder opened, or the last one whose menu was used. New items, imports and new folders go there; with none active they go to Home.

Structure:
- The top level is one list: **Home first, then your folders and the sets together, A to Z** (case-insensitive, numbers sorted as numbers). Inside a folder: its folders first (A to Z), then its items.
- A folder is known by its **path** (`Florals/Roses`); an item stores that one path string, so nesting needs no file-format change. A set is known by its original name, so renaming the set changes nothing underneath.
- Folder names: up to 30 characters; no `\ " < > & | /`; unique among siblings, case-insensitive. Making a name that exists opens the existing folder; renaming onto an existing name merges the two ("Merged “A” into “B”").
- Sets can hold your folders and items you file into them; an item filed into a set also stays in its own set. Sets can be renamed (**Reset name** puts it back) or hidden, **never deleted**. Hidden sets collect in a **Hidden sets** row at the bottom of the list, closed by default, with a count.
- Items you made can be deleted. Built-in items and items in use in the project cannot (a status message says so).

#### 12.3 The folder row

One row design for every folder, set, Home and the Hidden sets row (`.lfr`, `.lfh`):
- Height `--h-row` (32), `--r-m`, gap 6, padding 0 4, indented 12px per level of depth (`--d`).
- In order: **chevron** (13px, turns 90° open, `--t-fast`) · **icon** (closed folder, open folder, or the Home icon; hidden sets are dimmed) · **name** (truncates) · **count** (`--fs-s`, `--faint`, tabular: items inside it and every folder inside it, each counted once) · **"…" button** (always visible, `--h-xs`).
- Hover fills the row `--raise`. The **active folder** has the `--raise` fill and a 2px `--acc` bar on its left edge; this is the selected state for every row in a tree.
- The whole row is the target: **click opens or closes in place**; Right arrow opens, Left arrow closes (rows are focusable); right-click opens the same menu as "…".
- **Many folders can be open at once.** Which are open is remembered between sessions (a per-library key). Opening makes a folder active; closing the active one hands "active" to the folder above it.
- Under an open folder: its folders, then its items in the item style of the library, then nothing else. An open folder with nothing in it shows one line, `Empty folder` (Home: `No <items> yet`), in `--faint`.
- Drilling into a folder with a Back button is not allowed; the tree opens in place.

#### 12.4 Items

- **Tiles** (shapes, stamps, textures): square (`aspect-ratio: 1`), `--r-m`, `--field` fill, `--line` border, padding 5, gap 6, in a grid indented under the folder (12px per level plus 8). The size slider sets items per row (remembered per library). The tile in use has the accent edge; select mode shows a check.
- **Cards** (templates, colourways): section 9.8.
- **Rows** (saved trays, workspaces, recipes): `--h-row`, the same anatomy as a folder row but with a swatch strip, thumbnail or name instead of the chevron.
- Items always have an `aria-label` with their name. A tile or card never shows its name as a tooltip.
- The remove (×) button on your own items is always visible (never hover-only).

#### 12.5 The toolbar (top of every library)

Same order, same icons, in the library's header row: **Expand/Collapse all** (one toggle; its label says which) · **Select** (toggle, `aria-pressed`) · **New folder** · **size slider** (tiles and cards only) · **Import / Add** (a menu: Image…, Motif sheet…, From file… as the library allows). Search appears when a library can pass about 20 items and is a normal field (9.3) under the toolbar.

#### 12.6 Folder menu and the folder form

The "…" menu (Export… is disabled for an empty folder). Items in this order, leaving out what does not apply:

| Row | Menu |
|---|---|
| Your folder | New folder inside · Rename · Move to… · Export… · Delete folder |
| Set | New folder inside · Rename · Reset name (disabled until renamed) · Hide from the list / Show in the list · Export… |
| Home | Export… |

Choosing New folder inside, Rename, Move to… or Delete folder opens the **folder form inline, directly under the active folder** (not a dialog, not a prompt):
- **New / rename:** a name field and a button (Create, Rename). Enter confirms, Esc cancels. The new folder opens and becomes active. When items are selected, New folder offers **Create and move**.
- **Move to…:** a destination dropdown (Top level, then every folder by full path `A / B`, excluding itself and its own children) and **Move**. Moving a folder moves everything inside it and everything filed in it.
- **Delete folder:** one line, `Delete “Name” and 2 folders inside?` and a `--warn` **Delete** button. Items are not deleted: they return to Home and the status line says so.
- Cancel is always there; the form never covers other rows.

#### 12.7 Select mode (many items at once)

- **Select** toggles select mode. Clicking items toggles them; **Shift-click** selects the range from the last click; **Select all / Select none** works on the items visible (only open folders count). Esc leaves select mode.
- A bar shows `N selected` or `None selected` with: **Move to…** (a dropdown of every folder by full path, and `＋ New folder…` to make one and move into it) · **Take out of folder** · **Delete N**.
- **Delete N is two-tap in place:** the first tap changes the label to `Click to confirm` for 3 seconds; the second tap deletes. Built-in items and items in use are skipped, and the status line says how many.
- **Drag an item onto a folder row** moves it (the whole selection if the dragged item is selected). The row highlights while you hover over it. A drop never copies.

#### 12.8 Where things are saved

- Folder list, each item's path, set renames and hidden sets, open folders and tile size are saved with the library, through `src/platform` (never `localStorage` directly in new code). Open and active state are per-person settings, not part of a project.
- A project file keeps each item's folder as a plain path string.
- Export, Randomize and every "Save to" or "Move to" picker use the same flat list of folders by full path (`A / B / C`), in tree order, indented by depth.
- A library always supports **Export** (a folder, with its folders) and **Import from file**, so people can move data between browsers and back it up. Until Export everything exists, this is the backup route.

#### 12.9 Messages

Short past-tense sentences, names in curly quotes, paths with ` / `, in the status line:
`Made the folder “A / B”.` · `Renamed the folder to “Name”.` · `Moved “Name” to “A / B”.` · `Moved 3 shapes to “A / B”.` · `Deleted the folder “Name”. Its items went back to Yours.` · `Merged “A” into “B”.` · `“Name” is back in the list.` · `Those shapes are used on your stamps. Remove them from the stamps first.`
Replace “shapes” with the library's own word (stamps, textures, trays, colourways, templates).

#### 12.10 Starting points

Starting points (built-in templates, workspaces, recipes, shape sets, Wada tray sets) are **sets**: they appear in the same list as your folders, can be hidden, can hold your folders, and have no delete. A library with only a few built-ins can show them as one set called **Starting points**; it is still a set, with the set menu, not a separate heading style.

### 13. Dialogs and menus

#### 13.1 Dialogs

- Backdrop: `rgba(10,11,14,.45)` scrim, `--z` 80, padding 30 (8 on a phone). Clicking the scrim or pressing Esc closes (unless a destructive step is mid-way).
- Surface: `--panel`, `--line2` border, `--r-l`, `--shadow`; width `min(<design width>, 100%)`.
- Header: title (`--fs-l`, 600) left; a `--h-sm` close icon button right.
- Body: scrolls; inset 12.
- Footer: actions right-aligned, gap 8; **Cancel** (secondary) then the **primary** on the far right. Enter triggers the primary; Esc cancels.
- Focus moves into the dialog on open and returns to the opener on close.
- A dialog asks for input or shows a library. It does not show instructions, and it does not ask yes/no questions; use two-tap instead.
- The locked screen (signed out, not approved, offline too long) is a dialog with no close button and no Escape: its title says why, its buttons are Sign in (primary), Try again and Save project, so work can always be saved.

#### 13.2 Menus

- Anchored to the control that opened them. `--raise`, `--line2`, `--r-l`, padding 5, `--shadow`, `popin`.
- Item: `--fs-m`, about 30px tall (padding 6 / 9), `--r-m`; icon (optional) 15px at the left; shortcut right, `--fs-s` `--faint`.
- Divider: 1px `--line`, 4px above and below.
- A menu item that opens a dialog ends with `…`. Disabled items stay visible at opacity .4.
- Keyboard: arrows move, Enter picks, Esc closes and returns focus.
- The File menu order is fixed: New project, New from template…, Clear, divider, Open…, Save as template…, then the rest. Add to a menu at the end of its logical group, and ask before reordering.
- **The menu bar** (2.42.0, `85-menu-bar.js`): File, Export, Edit, Elements, Effects, Colour, View, Window, Help, as plain text names (`.mnbb`: `--h-md`, padding 0 8, `--r-m`, `--fs-m` 400, transparent; `--raise` on hover and while open) at the left of the top bar after the wordmark. The menus are `.pop.mnbm`. Every item is a registry command: its label (plus `…` for a dialog or file picker), its shortcut, greyed out when the command is; an on/off command shows a tick (`check` icon, `--acc-ink`) in the 15px icon column. A submenu (`.mnbs`, chevron right) opens beside its item on hover, click or Right arrow. With a menu open, pointing at another name opens it. Down on a name opens it at its first item; Left and Right move along the bar. A new menu item is a command added to the `MNB` list, never a button written into a menu.

- **The top bar** (2.43.0, owner Oct 24 2026: "really clean"): three zones in a grid. Left (`.tl`): the WB mark and the menu bar. Middle: the project's name (`#pnm`, centred text, a field on click) and its unsaved dot. Right (`.tr`): undo, redo, search, Randomize (the one prominent button) and light/dark; the account goes here later. Nothing else: Save project and the projects folder are File menu items, the version is in the status line (`#ver`). A new tool does not go in the top bar without asking.
- **2.44.0**: the right side is undo, redo, History (`#hstb`), search, Randomize, its gear (`#rzopt`, opens the Randomize panel) and light/dark; the menu bar gains Image (after Edit). The rail column is gone from `#app`'s grid.

#### 13.3 Commands and shortcuts

- Every action is a named command in the registry (id, label, shortcut, enabled check, run). Menus, shortcuts and command search all read it.
- Shortcuts use Mod (Cmd on Mac, Ctrl elsewhere). Single-key tools stay single keys. Do not use a key a browser tab keeps for itself (Mod+N, Mod+W, Mod+T).
- Command labels are the same words as the menu items.

#### 13.4 Settings

- One dialog (`File > Settings…`, command `settings.open`), width 640, a page list on the left (`--h-row` items, the current page `--acc-soft`, `--acc-ink`, 600) and one page at a time on the right. On a phone the list becomes a row across the top.
- A setting is one row: label left, control right, `--h-row` tall, a `--line` rule between rows. Controls are the standard ones: toggle (`.pvc`, the sliding switch, 28 x 18), segmented control, slider row, button, swatch row. No explanatory text; the label says what it does.
- A setting changes the app at once, is kept in the settings record (kv, keys `wb114_…`), and has no Apply or Save button.
- A page lists only what the app can really do today. Do not add a control whose effect is not built.

### 14. Words

- **British spelling:** Colours, Colourways, Colour grading, Grey.
- **Sentence case** for every label, button, menu item and title. Uppercase only for group labels (done by CSS, so the source text stays in sentence case).
- **Vocabulary:** Tray (the working colours), Saved trays, Colourways, Folder, Set, Yours (the home folder), Hidden sets, Starting points (a set), Untitled pattern, Stamp, Layer, Canvas, Project, Template. Use these words and no synonyms (not "palette", "category", "collection", "preset pack", "my items").
- Verbs on buttons: Save, Open, Add, Rename, Duplicate, Download, Delete, Replace, Clear, Import, Export. Not "OK", "Yes", "Submit".
- Units: a space between number and unit (`12 px`, `300 dpi`), `%` without a space, `×` for sizes (`6 × 9 in`).
- No exclamation marks (except the account chip, 9.9), no emoji, no first person in the UI.
- Accessible names (`aria-label`) say the same words as the visible label; icon-only controls use the command name.

### 15. Where the code does not follow this yet (measured on 1.11.0)

Counts are occurrences of a declared value in `src/shell.html` and `src/modules/`.

| Area | Standard | Today |
|---|---|---|
| Font sizes | 3 (11, 12.5, 14) | 11 (11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 18, 20, 28). 11px ×58, 11.5px ×26, 12px ×27, 12.5px ×24 |
| Font weights | 400, 500, 600 | also 300, 700, and `inherit` |
| Radii | 4, 8, 12, 50% (three, plus a circle) | 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 20 plus tracks (1, 2, 3). 5px ×20, 7px ×19, 9px ×13, 10px ×7 |
| Control heights | 22, 26, 30, 32, 40 | 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 44, 46, 54. 28px ×13, 24px ×8, 34px ×4 |
| Same-size controls with different radii | one radius per size | 30px tall controls use 6, 7, 8 and 15 |
| Gaps | 2, 4, 6, 8, 12, 16 | also 1, 3, 5, 7, 9, 10, 14. 9px ×8, 5px ×8 |
| Group labels | one style | duplicated as `.wxh` (workspaces), `.xrh` (export recipes), `h3` uppercase, with different paddings |
| Shapes library | the model (section 12) | Complete: nested tree, many open, select mode, drag to folder, hidden sets. Home is called "My imports" and an old "Drawn by Claude" folder shows only for old projects (do not copy it) |
| Saved trays (colours) | the tree | One level of folders only; you drill in and use a Back button; its own rows (`.stf`), search and rename; no nesting, no select mode, no Move to…, no drag; Wada sets sit in three fixed folders instead of being sets in the list |
| Saved stamps | the tree | Complete (2.51.2); a stamp carries the pictures of the imported textures it uses since 2.51.0 |
| Textures | the tree | Complete (2.51.0): Yours, your folders and the built-in sets with tiles, in the Texture effect; Add texture imports pictures and zips; nested folders (also inside sets), select mode, drag to folder, renamed and hidden sets, Export to a zip of pictures |
| Colourways | the tree for saved colourways | Only this project's colourways exist (flat cards); no saved colourways library |
| Templates, workspaces, export recipes | the tree | Flat list under two headings ("Starting points", "Yours"), three separate heading classes, no folders, no select mode |
| Folder "…" button | always visible (rule 5) | Done: `.lmo` is always visible in the Shapes library and the shared tree (`87-library-tree.js`, 2.51.1) |
| Deleting | items two-tap in place; folders by the inline form | Folder delete is a form; item delete is two-tap; trays and templates use their own confirm styles |
| Heading styles | 3 | panel title (Fraunces 14/500), group title (Fraunces 14/500), `h3` 12px/600 with a border, `h3` uppercase 11px, dialog `h2` 14/600 |
| Fonts | 1 (Hanken Grotesk) | Fraunces (serif) in the wordmark, splash, panel and group titles and the print proof sheet; 67 KB of font file |
| Icon stroke | one weight per size | five widths (1.7, 2.1, 2.25, 2.4, 2.6) assigned per control class |
| Motion | 120 ms and 200 ms | .1, .12, .13, .15, .16, .2, .25, .28 s |
| Layers | bands in section 6 | 30 distinct values, from 2 to 99999 (`.tdl` 9999, a one-off 99999) |
| Literal colours in chrome | none | `#fff` ×69, `#000` ×33, plus one-off `#e33`, `#215`, `#176` |
| Swatch edge | one value | `rgba(0,0,0,.18)` ×8 and `rgba(0,0,0,.2)` ×4 |
| Disabled opacity | .4 | .4 and .5 (`.hr.fut`) |
| Tokens | `--r-*`, `--fs-*`, `--h-*`, `--sp-*`, `--t-*`, `--z-*` | None of these exist yet; only colour, shadow and `--tl` do |

### 16. Closing the gap

**Done in 1.12.0** (appearance only, no behaviour): tokens in `:root`; font sizes, radii, spacing, durations and the group label moved onto the scales; Fraunces removed (titles, wordmark, splash and the print proof sheet are sans-serif); `.wxh` and `.xrh` merged into `.glb`; one title style; segmented buttons fixed at `--h-sm` (26); `npm run check:style` fails on a font size, radius or serif font outside the scales.

**Exemptions the checker allows:** brand text 15 and 20px; "+" glyphs 18 and 28px; tracks of 1–3px.

**Still to do, each its own release:**
1. **Extract the folder tree** from `06-motif-library-folders.js` and `21-motif-library-ui.js` into one shared component. A library supplies only: its items, its built-in sets, its Home name ("Yours"), how an item is drawn (tile, card or row), what "Export" writes, and the key it saves under. Then move each library onto it: saved trays first, then stamps, templates, workspaces and recipes; textures and saved colourways are born on it. Rename the shapes home folder "My imports" to "Yours", and make the folder "…" button always visible.
2. Icon stroke weights to the set in section 8.
3. Remove the `#fff` and `#000` literals from chrome (section 3).
4. Extend `check:style` to heights, z-index bands and literal colours once those are clean.

Side effects of 1.12.0: controls moved by one or two pixels (for example the type-dock bar is 32 high, so the stage is about 2px smaller at 1440×900). Pixel goldens that changed for this reason were listed in the release report.

### 17. New UI checklist

- [ ] Uses tokens for colour, size, radius, spacing, motion and layer; no new numbers.
- [ ] Reuses a component from section 9; anything chosen from a saved collection is a library on the shared folder tree (section 12), not a new list.
- [ ] Looks right in light and dark.
- [ ] Heights in a row match; radii follow section 5.
- [ ] Headings are one of the three levels.
- [ ] Hover, focus-visible, selected, disabled and error states exist; nothing depends on hover.
- [ ] No explanatory text; a hover name only on icon-only controls; no `alert`/`confirm`/`prompt`; destructive actions use two-tap.
- [ ] Every action is a registry command; icon-only controls have `aria-label`.
- [ ] Works docked, tabbed and floating, at narrow width, and on touch (pointer events).
- [ ] Wording follows section 14 (British, sentence case, standard words).
- [ ] Respects reduced motion; no animation of layout properties over the artwork.
- [ ] Does not change artwork rendering or export.
- [ ] Tests pass; screenshot changes are explained, not regenerated to go green.
- [ ] This guide updated if a new reusable pattern was added.

### 18. Source-of-truth map

| Concern | Source |
|---|---|
| Tokens, global type, focus, controls, motion | `src/shell.html` |
| Docking, panel groups, workspaces | `src/modules/34-desktop-shell.js`, `src/modules/42-workspaces.js` |
| Menus and commands | `src/modules/37-command-list.js`, `src/modules/40-command-search.js` |
| Colour tray, picker, wells | `src/modules/50-tray-core.js`, `51-colour-picker.js`, `52-tray-ui.js` |
| Library folder tree (the model) | `06-motif-library-folders.js` (data, paths, sets), `21-motif-library-ui.js` (rows, menu, form, select mode) |
| Other libraries (to move onto the tree) | `27-stamp-library.js`, `52-tray-ui.js` (saved trays), `53-colourways.js`, `42-workspaces.js`, `43-export-recipes.js`, `54-templates.js` |
| Engineering constraints | `CLAUDE.md` |
| UI audit and screenshots | `docs/ux-review.md`, `docs/ux-review/` |
