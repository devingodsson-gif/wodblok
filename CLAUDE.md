# WODBLOK
Stamped-pattern editor, web app first. Commercial product; the repo is private.

## Commands
npm run build | dev | verify:build | test | test:build | test:legacy | test:update-golden | test:webkit | perf | coupling-map
Source of truth for the app is src/ (src/shell.html + src/legacy/*.js in manifest order); `npm run build` writes dist/wodblok.html. legacy/ is never edited.

## Rules
- The repo is the only source of truth. Every release, including the claude.ai preview artifact, is built from it.
- Speed first: run `npm run perf` before committing anything that touches drawing, dragging or sliders. No perf regression over 10%.
- No explanatory text or tooltips in panels. No tool windows open at launch. Launch in Pattern mode, fully cleared.
- No brush masks. No Claude-generated motifs (users import their own).
- Never edit legacy/. Old .wodblok.json files (format v:18 and earlier) must always open; never overwrite a file on first open of an older format.
- Phase 1: no behaviour or visual changes. Phases 2-3: only what the phase lists; existing tools unchanged. Phases 1-3: no bug fixes; log bugs in docs/known-issues.md.
- Never update snapshots or golden screenshots just to make tests pass: say which changed and why, and ask.
- Platform access only through src/platform/. User actions are commands in the registry. The document is plain data with stable ids. No runtime network; fonts bundled. Pointer events; nothing hover-only in new code. No alert/confirm/prompt.
- Modules export functions and do no work on import; start-up order lives in src/main.js.
- Ask before adding a dependency. Licences: MIT, BSD, ISC, Apache, OFL.
- Version lives in package.json; the build writes it into WB_VER and <title>. v100 is the baseline; v101 is the first repo build. One git tag per release.
- Desktop (Mac/Windows) and mobile are later; do not build them now, but do not block them.
- Status updates: short, task list with approximate % complete.

## Tests (Phase 0 safety net)
- `legacy/wodblok-v100.html` is the untouched baseline (sha256 in `legacy/wodblok-v100.html.sha256`). Tests run on it by default; `WB_TARGET=build` runs them on `dist/wodblok.html`.
- Tests drive the real UI and use only two hooks: the page's `coreStr()` (the build must expose `window.__wbTest = { state() }` returning the same string).
- Determinism: seeded Math.random, fixed Date, no network, fixed viewport and locale. All injected from the test side; the app is not modified.
- Three layers of checks: document state (`tests/__snapshots__/**/*.state.json`), SVG markup summary (`*.svg.json`), pixels (`tests/__golden__/<WB_ENV>/`, only valid in the environment that made them; set `WB_PIXELS=0` to skip them).
- Real project files in `tests/fixtures/` are format v18 and must open in every future build.
- Known v100 quirks are pinned, not fixed: see docs/known-issues.md.
- Coupling map of the single-file code: docs/coupling-map.md (`npm run coupling-map`).
