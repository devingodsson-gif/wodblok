# WODBLOK
Stamped-pattern editor, web app first. Commercial product; the repo is private.

## Commands
npm run build | dev | check:platform | test | test:build | test:legacy | test:update-golden | test:webkit | perf | coupling-map
Source of truth for the app is src/: ES modules in src/modules (order in manifest.json), start-up in src/main.js, page in src/shell.html. `npm run build` bundles them into dist/wodblok.html plus an identical dist/index.html for hosting (no bundler dependency); `npm run dev` serves the unbundled modules at http://127.0.0.1:5199/ (test them with WB_TARGET=esm). legacy/ is never edited.

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
- Every time an update is committed and pushed (not for changes that only touch docs or tests), rebuild (`npm run build`, from the clean commit so the bottom-bar stamp is the commit date) and publish dist/wodblok.html to the existing preview artifact (https://claude.ai/artifact/AkEURvCERNYJmNPWwiEduB, same URL, same capabilities) without being asked. Say so in the status update.
- The full test suite (about 13 minutes) is not run automatically. Before publishing, run only the quick tests that touch the change (under a minute or two). After publishing, say plainly what was and was not run, and ask whether to run the full suite, with how important it is as a percentage (how likely the change could have broken something elsewhere: about 5-15% for data, text or isolated additions; 30-50% for changes to shared code such as the history, panels, file format or the document; 60-90% for drawing, rendering, Randomize, saving and opening files, or anything in src/platform). Give one sentence of why.
- Version lives in package.json as MAJOR.MINOR.PATCH; the build writes it into WB_VER, the badge and <title> (1.0.0 shows as v1.0, 1.2.1 as v1.2.1; before 1.0, 0.108.0 showed as v0.108). Phase 6 was finished and 1.0.0 was cut on the user's command (it was held until then). Each release raises the minor, a hotfix raises the patch; the major changes only when the user says so. The UX fix releases in docs/fix-plan.md are numbered 1.0.1 to 1.0.7 (patch +1 each), on the user's instruction. v100 is the baseline; v101 was the first repo build. One git tag per release (made by the tag workflow).
- `main` is hosted on Cloudflare: whatever lands on `main` is live on wodblok.com. Merging into `main` is called "going live". Never go live without the user saying so for that release; release work stays on its branch (`fix/<version>-...`), and the preview artifact is published from the branch. Say before going live if the release touches saving, opening files or the file format.
- Always check the version first. At the start of every session, fetch, state the newest version on `main` (package.json) and the latest tag, and work from that, never from an older checkout or branch. Older versions and `legacy/` are never touched, rebuilt, archived or modified unless the user explicitly says so.
- Desktop (Mac/Windows) and mobile are later; do not build them now, but do not block them.
- Status updates: short, task list with approximate % complete.

## Tests (Phase 0 safety net)
- `legacy/wodblok-v100.html` is the untouched baseline (sha256 in `legacy/wodblok-v100.html.sha256`). Tests run on it by default; `WB_TARGET=build` runs them on `dist/wodblok.html`.
- Tests drive the real UI and use only these hooks: the page's `coreStr()` (the build exposes `window.__wbTest = { state(), commands }`; `state()` returns the same string, `commands` is the command registry for the commands tests).
- Determinism: seeded Math.random, fixed Date, no network, fixed viewport and locale. All injected from the test side; the app is not modified.
- Three layers of checks: document state (`tests/__snapshots__/**/*.state.json`), SVG markup summary (`*.svg.json`), pixels (`tests/__golden__/<WB_ENV>/`, only valid in the environment that made them; set `WB_PIXELS=0` to skip them).
- Real project files in `tests/fixtures/` are format v18 and must open in every future build.
- Known v100 quirks are pinned, not fixed: see docs/known-issues.md.
- Coupling map of the single-file code: docs/coupling-map.md (`npm run coupling-map`).
