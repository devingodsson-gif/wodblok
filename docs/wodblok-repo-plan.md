# WODBLOK repo plan: web app first, built so desktop and mobile come cheaply later
Draft 3, Oct 8 2026, at v100. Reviewed by Opus against the live v100 source; the measurements in section 2 come from parsing that file.

Draft 3 changes:
- Section 2 corrected from measurements: the code is page-global script, not one closure; the core engine has no section markers; 60 variables are reassigned from other sections; there are no Workers today.
- Phase 0: the legacy file stays untouched (the tests control randomness and time from outside); adds an artifact-runtime stub, state and SVG snapshots alongside screenshots, a coupling map, a WebKit run, and perf compared side by side in one job.
- Phase 1 split into 1a / 1b / 1c (cut into files, then a state object, then modules). Phase 1 only moves code; adapters and commands wait for Phase 2.
- Phase 2 adds "Export everything / Import everything", because data in the artifact cannot be read from the web app's address.
- Phase 3: zip details; the format number continues from today's `v:18`; assets stored once by content; SVG from files is cleaned.
- Phase 4: host privately until the selling model is decided; Safari and Firefox have no save-to-file picker; Safari deletes unused site data after 7 days.
- New rule: once Phase 0 lands, the repo is the only source; every release, including the preview artifact, is built from it.
- Section 7 now holds answers, plus decisions only the user can make (7b).

## 1. Goal
Move WODBLOK out of a single 683 KB HTML file into a real repository, with a new project file system, and ship it as an in-browser app that is installable and works offline.
Later, the same code should become a Mac and Windows desktop app and a mobile app without a rewrite. For now only the web app is built; the later targets only constrain how we write code (section 4).
Nothing the user can see or do should change during the move (same look, same speed, same results) until new capabilities are switched on.

## 2. What the code is today (measured on v100, Oct 8)
- One file, 4,465 lines, 683 KB, three scripts: theme pre-paint, the main script (lines 1123–4455), and the light/dark toggle.
- **Not one closure.** The main script runs at page level: 631 top-level names (245 functions, 263 const, 94 let, 29 var). Functions and vars become properties of `window`; consts and lets are shared by every script on the page. Sections also call each other through 44 explicit `window.wbX` bridges (`wbHistGet`, `wbBA`, `wbGrade`, `wbTx*`, …).
- **Coupling, measured:** 278 top-level names are used outside their own section; 122 lets and vars are reassigned; **60 are reassigned from another section** (most: `fpSel`, `fpB`, `cur`, `fpMS`, `brush`, `selL`, `fpGhost`, `nid`, `dim`, `proj`). Those 60 are the real cost of going to modules, because a module cannot reassign another module's variable.
- **Section markers don't cover the core.** There are 27 `// =====` markers, but lines 1124–1416 (start-up, print cache, draft mode, stamp and canvas outlines) come before the first one; the "Misc motifs" marker runs 708 lines because the engine (library folders, symmetry, grids, motif drawing, layer layout, pressure, flooding, block edges, and state such as `cur`, `layers`, `tiles`) follows the motif data unmarked; and state saving and project save (around 2497–2560) sit inside the "Texture library" section. Splitting along the markers works for the tools, not for the core.
- 1,190 `$()` lookups. No inline HTML handlers (handlers are set in script), so nothing depends on HTML attributes reaching globals.
- Randomness and time: 21 `Math.random` sites (Randomize, seeds, ids); ids are built from `Date.now` plus random; 22 `performance.now`, 46 `setTimeout`, 14 `requestAnimationFrame`. Tests must control all of these.
- No Workers. 6 Blob URL uses (downloads, images). Textures and grading use SVG filters (`feTurbulence`, 15 filter definitions), which cannot run inside a Worker.
- Storage:
  - 88 `localStorage` calls over about 36 keys with version-stamped prefixes (`wb2_` … `wb95_`). They include saved projects (`wb18_projects`, `wb2_proj`) and imported fonts as base64 (`wb17_fonts`). localStorage holds only about 5 MB per site, so this is already a size limit.
  - The artifact runtime is reached through one helper, `use('db'|'user'|'downloads')`, which returns nothing outside claude.ai. The app already runs outside the artifact with browser-only storage. The stamp library (`SL`) has two backends, "account" and "browser".
- History keeps up to 120 full JSON copies of the core state (`coreStr()`). Art images stay out of it (kept by id in a separate `ARTS` registry), a good precedent for rule 4.7.
- Project file: JSON with `app:'WODBLOK', v:18`, the core state, `arts` (images embedded as data URLs), cover, grade, and `lib` (motifs, colours). The format already has a number to continue from. Snapshots (v95) live only in browser storage.
- The comment at line 1612 says the built-in motif sets are Claude-drawn (decided Oct 12: allowed, see 7b).
- 178 native `title=` hover tooltips (Undo, Save, shape names, "Choose which kinds", …) and 112 `aria-label`s (see 7b).
- Some buttons only appear on hover (e.g. the History row buttons).
- Tests today: ad-hoc Playwright scripts in a scratch folder (profile, pixel diff of before/after). None are in a repo.

## 3. Guardrails (carry into CLAUDE.md)
- Commercial product. Repo is private. Check licences of anything added (fonts Fraunces and Hanken Grotesk are OFL, fine to bundle); MIT, BSD, ISC, Apache and OFL are fine; nothing GPL in the shipped app. Ask before adding a dependency.
- **One source of truth:** once Phase 0 lands, every release (including the preview artifact) is built from the repo. No more hand edits to a single file outside it. Design explorations in chat are prototypes; anything kept becomes a pull request.
- Speed is a feature. A perf budget is part of the tests; no change may slow dragging or sliders.
- No explanatory text or tooltips in panels. No tool windows open at launch. Opens in Pattern mode, fully cleared. No brush masks.
- Phase 1 changes nothing the user can see or do. Phases 2–3 add only the capabilities they list (Export everything, autosave, recent projects and so on); existing tools look and behave the same.
- Phases 1–3 are bug-for-bug: bugs found are logged in `docs/known-issues.md`, not fixed, and get fixed after Phase 3 as normal releases.
- Keep every version: one git tag per release (vNNN) and the built single file attached to a GitHub Release. v100 is the baseline tag; v101 is the first release built from the repo.
- The single-file build keeps working for now, because the preview artifact is published from it. Once the web app is hosted (Phase 4) and the user's data has been moved over (Phase 2), ask whether the artifact is still needed.
- Old `.wodblok.json` files must always still open, and opening an old file never overwrites it.

## 4. Built-in readiness for desktop and mobile (rules from day one, no extra phases)
These cost almost nothing now and avoid a rewrite later. Phase 1 only moves code; these rules apply to new code from the start and are applied to old code in Phase 2.
1. **Platform access** goes through `src/platform/`: storage, files (open, save, export, incoming drops and share-sheet files), fonts, clipboard, downloads, `window.claude`. Nothing else calls them directly. A desktop or mobile version means writing one new adapter, not touching the app. No `alert`, `confirm` or `prompt` (v100 has none; keep it that way).
2. **Commands:** every user action is a named command in one registry (id, label, shortcut, enabled-check, run). Menus, shortcuts, command search (Mod+K) and a future native menu bar all read from it. Shortcuts use "Mod" (Cmd on Mac, Ctrl elsewhere), with a separate desktop shortcut where a browser keeps the key for itself (Mod+N, Mod+W, Mod+T cannot be taken in a browser tab). Commands that change the document go through history.
3. **Document model:** the project is plain, versioned data that can be copied and saved as-is (no DOM nodes, functions or class instances in it), with a stable id on everything (layers, stamps, motifs, art, snapshots), made by one `newId()`. This is what files, undo, Workers, live links and several windows all need. Keep the document in one object (Phase 1b), so a second open project later is a second instance.
4. **No network at runtime:** fonts bundled, no CDN scripts, relative asset paths only. The app works from a file or any host. User-imported fonts are assets, not base64 strings in settings.
5. **Input:** pointer events (mouse, touch and pen through one path); nothing important is hover-only in new code (today's hover-only buttons are fixed when the touch layout is designed); hit targets and layout use CSS variables; keep `safe-area-inset` handling; window-edge gaps stay variables (`--tl` exists for Mac window buttons; add a right-hand one for Windows controls). Canvas sizes go through one helper that knows each platform's limits (iOS Safari caps canvas size and memory).
6. **Heavy work separable:** pure functions with plain inputs and outputs. Only canvas and pixel work (tracing, stamp printing to bitmaps, PNG encoding) can move to a Worker. SVG-filter work (textures, grading) needs the DOM, so moving it off the main thread means a canvas or WebGL version (Phase 6 decision).
7. **Memory discipline:** big textures, images and fonts are referenced by id from the asset store, never copied into state or history.
8. **Accessibility basics:** every icon button keeps an `aria-label` (112 exist), keyboard focus stays visible, reduced motion is respected (all exist today). Labels are not visible, so this does not conflict with the no-tooltips rule; command search will reuse the same names.

## 5. Phases (each ends with all tests green and a tagged release; branch per phase)

### Phase 0: Repo and safety net (one to two sessions)
1. Private GitHub repo `wodblok`. Commit `legacy/wodblok-v100.html` untouched and record its sha256; archive older builds in `archive/` if the user has them. Tag `v100` with the file attached.
2. `CLAUDE.md` (section 9).
3. Test harness: Playwright at a pinned version, Chromium, run in the official Playwright Docker image so renders match every time.
   - **Determinism without editing legacy:** an init script replaces `Math.random` with a seeded generator; Playwright's clock control fixes `Date.now`, `performance.now` and timers; tests wait for `document.fonts.ready`; fixed viewport and pixel ratio; reduced motion on. The repo build later gets a real `?seed=` hook, but the tests must also run on the untouched legacy file.
   - **Artifact runtime stub:** a fake `window.claude.use('db'|'user'|'downloads')` (in-memory database, fixed user id, captured downloads), so the "account" storage paths are tested too; plus a run with no runtime (browser-only).
   - **Three layers of checks:**
     - State snapshots: the core state (`coreStr()`) after each scripted scenario, compared as JSON. Identical on any machine; the main regression net.
     - SVG markup snapshots: the stage SVG with ids and numbers normalised, compared as text.
     - Golden screenshots for the final picture (filters, masks, grading), small tolerance, only in the container.
   - **Scenarios:** launch state (Pattern mode, cleared, no panels open: the guardrail as a test), Pattern, Stamp editor, Grade with masks, Cover, Randomize with a seed, Before/After, History and snapshots, Text tool, Art layer with crop, Free place, Frame layers, image trace, motif sheets.
   - **Project round-trip:** open sample files (including a `v:18` file with art and imported fonts), save, reopen, compare state. Ask the user for 3–5 real project files to use as fixtures.
   - **Perf:** shared CI machines are noisy, so legacy and branch run in the same job and the test compares the ratio of medians; fail if the 40-stamp drag is more than 10% slower. Also record counters that don't depend on machine speed (DOM nodes created per move, renders per move, forced layouts). The user's Mac stays the reference for felt speed: `npm run perf` locally before each release.
   - **Page errors:** no console errors in any scenario.
   - **WebKit smoke run** (Playwright WebKit): no screenshots, just "loads, scenarios complete, no errors", with perf numbers recorded. The web app targets Safari, and SVG filter speed there is the biggest unknown.
4. **Coupling map:** a script that lists every top-level name, its home section, and which sections read and write it; output committed as `docs/coupling-map.md`. It sets the Phase 1 order.
5. Run everything against the legacy file twice and record the baseline.
Exit: suite green on the legacy file in CI, twice in a row with identical results.

### Phase 1: Module split with no behaviour change (the risky one)
Phase 1 only moves code. Bugs are logged, not fixed.

**1a. Cut into files (lowest risk).**
- Cut the main script into ordered files `src/legacy/NN-name.js` at the existing markers.
- Add new cut points inside the unmarked core: start-up; print cache and draft mode; stamp and canvas outlines; motif library folders; symmetry; grids; motif drawing; layer layout; impression effects (pressure, flooding, block edges); state, history and project I/O.
- The build joins them back into one script.
- Check: the built output matches v100 apart from whitespace, and all tests are green.
- Gives git history per area straight away.

**1b. State object (still one script).**
- Move the 60 cross-section variables, then the other reassigned ones, onto one state object `S` (`cur` becomes `S.cur`), in batches by codemod, with tests after each batch.
- Replace the 44 `window.wbX` bridges with one small, explicit registry and event helper.
- Stop relying on functions being on `window`.

**1c. ES modules, leaf-first.**
- Order: data (motifs, palettes, texture definitions) → self-contained tools (trace, motif sheets, text, crop, stamp library) → engine (layout, stamp printing, textures, grading, export) → history, Randomize, Before/After → UI shell (panel workspace, controls, menus).
- Rules:
  - Modules export functions and do no work when imported.
  - One `src/main.js` runs start-up in today's order. This avoids init-order errors and circular-import surprises.
  - Keep `$()` as a tiny DOM helper.
- From 1c on, files carry `// @ts-check` with JSDoc types (type checking without changing code).

Exit: suite green; single-file build behaves identically; bundle size within 5% of legacy; perf ratio no worse than legacy.

### Phase 2: Platform seam, commands, and moving data out of the artifact
- **Platform interface:** `projects`, `library` (stamps, motifs), `settings`, `files` (open, save, export, incoming), `assets`, `fonts`, `clipboard`. It replaces every `use(...)` and `localStorage.wb*` call. Two adapters:
  - Artifact adapter: exactly today's behaviour, so the preview artifact keeps working.
  - Web adapter:
    - Large files (images, textures, fonts, autosave) in OPFS, the browser's private file storage.
    - Small records (project list, settings, snapshot list) in IndexedDB.
    - Saving: real Save to the opened file on Chrome and Edge; download and upload on Safari and Firefox.
- **Settings:** one versioned settings record replaces the ~36 `wbNN_` keys, with a one-time migration that reads the old keys. Fonts and saved projects leave localStorage for the asset store.
- **Command registry:** every action, with the shortcut table (Mod key, per-platform overrides).
- **Export everything / Import everything:** one file with the stamp library, motif library and folders, palettes, settings and snapshots. Data saved in the artifact can't be read from the web app's address (browser storage belongs to one address, and the "account" database belongs to claude.ai), so this has to ship while the artifact is still the live version.
- TypeScript (`.ts`) for the platform interfaces.

Exit: app behaves the same with both adapters; tests run against both; an export from the artifact imports cleanly into the web build.

### Phase 3: Project format v2 (the "file system overhaul")
**3a. The container**
- `.wodblok` is a zip (decision in 7.2). Entries:
  - `mimetype` first, uncompressed (`application/vnd.wodblok+zip`), so the type can be recognised.
  - `project.json`.
  - `assets/<content-hash>.<ext>`: each image stored once, however often it is used.
  - `thumbnail.png`, so file browsers can show a preview.
  - Optional `snapshots/`.
- PNG and JPEG are stored as-is (no recompression); JSON is compressed. Library: fflate (MIT, small, fast, works in Workers).
- **Format numbers continue from today's `v:18`** (the zip format starts at 19). One migration chain: each step is a pure function, tested against fixture files kept in the repo forever. `.wodblok.json` files open forever.
- **Files from a newer app** open read-only with a clear message. Unknown fields are kept on save, never dropped.
- **Validation on load** (schema check), so damaged or hostile files fail with a friendly message, never a blank app.
- **SVG from any file is cleaned before use.** Imported motifs are SVG strings; v100 checks them with a pattern and a 600 KB limit, but once files are shared between customers this needs a real sanitiser.
- **Safe saving:** write a new file, then replace the old one (Chrome and Edge do this for you). On desktop later: write to a temp file, rename, keep one backup.
- The data model, format and migrations are written in TypeScript.

**3b. Working with files**
- Autosave and crash recovery: write to a recovery slot every N seconds; offer to restore after a crash.
- Snapshots and named history move inside the project file. History is optional and capped, because today each step is a full copy of the state.
- Live-linked Art layers store the source's id, its relative path and a cached copy inside the file. A missing source shows the last version, marked "missing source".
- Recent projects list; "Save as copy"; export of a single stamp or motif as its own small file.

Exit: round-trip tests from `v:18` JSON to the zip format and zip to zip with large images; fuzz test with damaged files shows a friendly error, never a blank app.

### Phase 4: The web app
- Bundle the fonts (no Google Fonts call). Add a web manifest and service worker for offline use and "install app". A new version applies on next launch, or shows a small update dot; it never reloads during work.
- **Host privately first.** GitHub Pages can only be private on GitHub Enterprise Cloud. Use Cloudflare Pages behind Cloudflare Access (the free plan lists up to 50 users; confirm at setup), with a preview address per branch. A public static site exposes the whole app, so go public only after the selling model is decided (7b).
- **Saving, per browser:**
  - Chrome and Edge: real Save to the opened file. The installed app can also become the opener for `.wodblok` files (desktop only).
  - Safari and Firefox: no save-to-file picker, so Save is a download and Open is a file picker. The existing unsaved dot means "not saved to a file".
- **Storage:**
  - Request persistent storage and show storage use.
  - Safari deletes data a site wrote if the site isn't used for 7 days (unless it's added to the Dock or Home Screen). Treat browser storage as a cache and files as the truth.
  - Autosave protects against crashes, not against eviction. On launch, notice missing data and point to the file.
- Then ask the user whether the preview artifact is still needed.

Exit: installs and runs fully offline on Chrome, Edge and Safari (as a Dock app); opens and saves project files; Safari speed acceptable to the user on their Mac.

### Phase 5: Features resume, as normal pull requests with tests
First the bugs logged in Phases 1–3. Then Variations strip, Presets with hover preview (reminder: use the Asian colour book palettes; ask which book and palettes), task bar, navigator/zoom/pan, command search (built on the registry), workspaces, export recipes, repeat-tile export, print proof (see `wodblok-premium-roadmap.md`).

### Phase 6: Performance work enabled by the split
- Move tracing, stamp printing and PNG encoding into Web Workers (OffscreenCanvas where available).
- Textures and grading use SVG filters, so moving them off the main thread means a canvas or WebGL version. This belongs with the optional canvas renderer (the biggest speed-up), and becomes urgent if Safari is too slow.
- The parked idea of moving only a dragged motif's transforms.
- Each lands behind the perf budget.

### Later (parked until the user asks)
- **Desktop for Mac and Windows.**
  - First check whether the installed Chrome/Edge web app (own window, offline, opens `.wodblok` files) is enough.
  - If not, Electron (7.7) with a thin desktop adapter: real files, native dialogs, native menu bar from the command registry, file association, recent files, export to a folder, several windows.
  - Built by a GitHub Actions matrix: Mac universal .dmg, Windows installer.
  - Signing:
    - Mac: Apple Developer Program, $99/yr.
    - Windows: Azure Artifact Signing (renamed from Trusted Signing), $9.99/mo for 5,000 signatures; individuals only in the US and Canada; otherwise a code-signing certificate.
  - Auto-update only after signing.
- **Mobile.**
  - iPad first, as the installed web app (touch, pinch, Apple Pencil, share-sheet files).
  - Then a real tablet/phone layout: panels as bottom sheets, touch versions of hover-only buttons. A design job, not a port.
  - Capacitor wrapper only if there is a clear reason.
  - Risks: SVG filter speed and canvas memory on mobile Safari.
- Because of section 4, each of these is one adapter plus packaging and layout work.

## 6. Working method with Claude Code
- One phase per branch, one section or concern per commit, suite run before every commit.
- Claude Code does the repo work. Browser-chat Claude can also build from the repo (clone it, `npm run build:single`, publish over the existing artifact address, check it live), so there is never a second copy of the code.
- Releases: tag `vNNN`, GitHub Release with the single file, CHANGELOG entry per version. During Phases 1–3, release once at each phase end, not per commit.
- Status updates: short, with a task list and approximate % complete.

## 7. Review answers (Opus, Oct 8)
1. **Split method: extract, don't rewrite.**
   - The coupling is real but bounded (60 names written across sections).
   - A rewrite would have to match pixel-exact behaviour (before/after diff 0.0, Randomize distributions, history labels) with only screenshots to check against.
   - Don't trust the 27 markers for the core: use 1a/1b/1c. The 1,190 `$()` lookups are fine as they are.
2. **Project format: zip.**
   - Folder packages don't travel: downloads and email need one file, Windows has no packages, and the iPad Files app and share sheet want one file.
   - JSON plus side files breaks as soon as someone moves one file.
   - Zip is what Procreate, Krita, OpenRaster and Word files use. Details in Phase 3a.
3. **Readiness rules: the right set, with additions** (now in section 4): a plain, copyable document model with stable ids; per-platform shortcuts; no browser dialogs; fonts as assets; SVG-filter work can't go to Workers; canvas limits; accessibility basics. Nothing on the list is costly enough to drop.
4. **Storage: OPFS for large files, IndexedDB for small records.**
   - Both share one quota and are deleted together, so neither protects against eviction.
   - "Always offer save to a file" is not enough on its own. Also needed: a persistent-storage request, autosave, Export everything (the stamp and motif library is the most valuable data and today lives only in browser or account storage), storage warnings, and a launch check that notices missing data.
5. **Determinism: screenshots alone are not enough.**
   - Use three layers: state JSON, SVG markup, pixels. Most regressions show in state or markup, which are identical on any machine.
   - Pixels are compared only in the pinned container.
   - Randomness and time are controlled from the test side.
6. **TypeScript: not at the start of Phase 1.**
   - JSDoc with `@ts-check` from 1c.
   - `.ts` for platform interfaces (Phase 2) and the data model, format and migrations (Phase 3).
   - Other code converts only when touched.
7. **Desktop: still Electron, when desktop happens.**
   - Tauri uses the system browser engine: Safari's engine on Mac and Chromium on Windows. That means two engines, and on Mac it's the engine where SVG filter speed is unproven.
   - Electron ships the same Chromium the tests run.
   - Step zero is the installed Chrome/Edge web app; Electron when selling, native menus, several windows or folder export make it worth it.
8. **Missing pieces:**
   - **Selling model and licensing:** the biggest gap; it decides Phase 4 hosting and whether "no network at runtime" can hold (7b).
   - **Accounts and cloud sync:** don't build; stable ids and timestamps keep them possible.
   - **Crash reporting:** a local error log the user can export, plus crash recovery. Remote reporting only opt-in, with a privacy policy, later. No usage analytics by default.
   - **Accessibility:** section 4.8.
   - **Localisation:** skip; panels have little text by design, so it stays cheap later.
   - **Security:** SVG cleaning (3a) and a content security policy on the hosted app.
   - **Content rights:** see 7b.

### 7b. Decisions for the user (none block Phase 0)
1. **How will WODBLOK be sold?** One-time desktop licence, subscription web app, app stores, or free plus paid. This decides hosting, accounts, licence checks versus offline use. Needed before Phase 4 goes public.
2. **Built-in motif sets:** decided Oct 12 2026: the "no Claude-generated motifs" rule is removed. The built-in sets stay and are part of the library (and of the motif export).
3. **Native hover tooltips:** v100 has 178 `title=` hover tooltips. Keep them (they appear only on hover), or remove them to match the no-tooltips rule? Phases 1–3 keep them either way.
4. **The preview artifact:** still needed after Phase 4?
5. **Asian colour book palettes:** which book and palettes (at Presets, Phase 5).

## 8. Main risks
- **Hidden coupling** makes the split slower than it looks. Now measured (60 written across sections, 278 read across). Mitigation: 1a/1b/1c, coupling map, tests after every step.
- **Module behaviour differences** (init order, circular imports, read-only imports). Mitigation: the state object first, no work on import, one start-up file.
- **Two copies of the code** (chat edits to the single file while the repo moves on). Mitigation: repo-only rule from Phase 0.
- **Safari speed of SVG filters and masks** (the web app targets Safari now, not only mobile later). Mitigation: WebKit run from Phase 0; if slow, the Phase 6 canvas renderer moves up.
- **User data stuck in the artifact.** Mitigation: Export/Import everything in Phase 2, before the artifact is retired.
- **Flaky screenshots across machines.** Mitigation: state and SVG snapshots carry most checks; pixels only in the container.
- **Noisy perf numbers in CI.** Mitigation: side-by-side runs in one job, machine-independent counters, local Mac check.
- **Project-format migration bugs losing user work.** Mitigation: v18 JSON stays readable, round-trip and fuzz tests, never overwrite the original on first open.
- **Browser storage is not durable** (including Safari's 7-day rule). Mitigation: files are the truth, autosave, Export everything, storage warnings.
- **Public hosting exposes the app** before the selling model exists. Mitigation: private hosting until 7b.1 is decided.
- **Scope creep.** Rule: during Phases 1–3, nothing beyond what each phase lists, and no bug fixes.

## 9. Draft CLAUDE.md
```
# WODBLOK
Stamped-pattern editor, web app first. Commercial product; the repo is private.

## Commands
npm run dev | build | build:single | test | test:update-golden | perf | coupling-map

## Rules
- The repo is the only source of truth. Every release, including the claude.ai preview artifact, is built from it.
- Speed first: run `npm run perf` before committing anything that touches drawing, dragging or sliders. No perf regression over 10%.
- No explanatory text or tooltips in panels. No tool windows open at launch. Launch in Pattern mode, fully cleared.
- No brush masks.
- Never edit legacy/. Old .wodblok.json files (format v:18 and earlier) must always open; never overwrite a file on first open of an older format.
- Phase 1: no behaviour or visual changes. Phases 2-3: only what the phase lists; existing tools unchanged. Phases 1-3: no bug fixes; log bugs in docs/known-issues.md.
- Never update golden screenshots or snapshots just to make tests pass: say which changed and why, and ask.
- Platform access only through src/platform/. User actions are commands in the registry. The document is plain data with stable ids. No runtime network; fonts bundled. Pointer events; nothing hover-only in new code. No alert/confirm/prompt.
- Modules export functions and do no work on import; start-up order lives in src/main.js.
- Ask before adding a dependency. Licences: MIT, BSD, ISC, Apache, OFL.
- Version lives in package.json; the build writes it into WB_VER and <title>. v100 is the baseline; v101 is the first repo build. One git tag per release.
- Desktop (Mac/Windows) and mobile are later; do not build them now, but do not block them.
- Status updates: short, task list with approximate % complete.
```

## 10. First Claude Code session (paste this)
"Read CLAUDE.md and docs/wodblok-repo-plan.md. Do Phase 0 only:
- Create the repo structure and put legacy/wodblok-v100.html in place unchanged (record its sha256).
- Add the Playwright harness:
  - seeded Math.random and clock control injected from the test side (no edits to the legacy file);
  - a stub of the artifact runtime;
  - state snapshots, SVG markup snapshots and golden screenshots;
  - project round-trip, page-error checks, perf side by side, and a WebKit smoke run.
- Write the coupling-map script and commit its report.
- Run everything against the legacy file twice, then report the baseline numbers and any flakiness.

Do not start Phase 1."

## 10. Status (Oct 8, end of day)
- Phase 0, 1 and 2 are done. Phase 3 is done apart from items parked below.
- **Phase 3 as built:**
  - `.wodblok` is a zip: `mimetype` first (stored), `project.json`, `assets/<sha256>.<ext>` (each image once), `thumbnail.png`, `snapshots/NN.json`. Format 19. Download writes it; Open reads it, and still reads `.wodblok.json` (v18 and earlier) unchanged. Opening never writes back.
  - Files from a newer app open as an unsaved copy and are not added to Projects.
  - Damaged files give a plain message (`FormatError`); a 300-case byte-flip test shows only "opens" or a friendly error.
  - Crash recovery: unsaved work is copied to a recovery slot every 8 s; the app still launches blank and offers "Restore unsaved work" / "Dismiss" in the status bar. The old copy is kept until one of them is pressed.
  - A library stamp can be saved as `.wodblok-stamp` and imported back.
  - "Save as copy" is the existing Duplicate project, "Recent projects" is the existing Projects list (newest first), and linked Art already keeps its cached picture and says when its source is gone, so none of those needed new code.
  - fflate 0.8.3 (MIT) is vendored in `src/vendor/` (regenerate with `node tools/vendor-fflate.js`); the bundle grew by about 100 KB. TypeScript is a dev dependency used only to type-check `src/platform/`; the format code is JavaScript.
- **Parked:** the SVG cleaner (`src/format/svg.js`) is written and tested but not wired in, because v100's `clean()` already guards motifs read from files and replacing it would change an existing tool. Wire it when SVG import arrives (Phase 5). Export everything still writes its own JSON file.
- **Open:** tag `v101` could not be pushed to GitHub from the build environment (create it on commit 3c30728); create the `v100` tag and release by hand; the WebKit smoke test runs only in CI.

## 11. Status (Oct 9): Phase 4 built, hosting not yet chosen
- **Done (v108):** fonts bundled (Fraunces, Hanken Grotesk and the 14 lettering fonts, latin subsets, OFL licences in `src/fonts/licences/`; the Text tool no longer calls Google); `npm run build:web` makes `dist/web/` (one-file app, manifest, icons, service worker, `_headers`); the app opens offline; a new version waits and shows an "Update ready" dot in the status bar (asks to save first, never reloads by itself); the app asks the browser to keep its data and shows "Stored N MB"; Chrome and Edge write back to the opened or last saved file and the installed app can open `.wodblok` files; Safari and Firefox keep Download and the file picker.
- **Not done:** hosting (see `docs/hosting.md`; needs the selling-model decision and a Cloudflare account); testing on Safari (the WebKit smoke test still runs only in CI); the Dock-app check on a Mac. The single-file preview artifact keeps working unchanged (it does not register the service worker).
- **Check on a real browser before calling Phase 4 finished:** install from the hosted address in Chrome and Edge, open a `.wodblok` file by double-click, Save twice and check the same file updates, then go offline and relaunch.

## 12. Status: Phase 5 and 6 done, 1.0.0
- Phase 5 (command search, navigator, workspaces, export recipes, repeat tile, print proof, presets, Variations, task bar) shipped as 0.109 to 0.119.
- Phase 6 (performance) was measured first (docs/perf-baseline.md): workers and a canvas/WebGL renderer would not fix the real costs, so they were not built; saved and exported pictures now share identical knockout masks (13 MB to under 3 MB) and PNG export shows a message (0.120).
- 1.0.0 was cut on the user's command. Still open after 1.0: the Mac/Safari speed check (`npm run perf-baseline`, `npm run test:webkit`), the hosting and selling-model decision, desktop and mobile, and a fluent reader's review of the Japanese colour names.
