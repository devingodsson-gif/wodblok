# WODBLOK
Stamped-pattern editor, web app first. Commercial product; the repo is private.

## Commands
npm run build | dev | check:platform | test | test:build | test:legacy | test:update-golden | test:webkit | perf | coupling-map
Source of truth for the app is src/: ES modules in src/modules (order in manifest.json), start-up in src/main.js, page in src/shell.html. `npm run build` bundles them into dist/wodblok.html plus an identical dist/index.html for hosting (no bundler dependency); `npm run dev` serves the unbundled modules at http://127.0.0.1:5199/ (test them with WB_TARGET=esm). legacy/ is never edited.

## Never break (what the app must always be)
- No explanatory text or tooltips in panels. No tool windows open at launch. Launch in Pattern mode, fully cleared.
- No brush masks. No Claude-generated motifs (users import their own).
- Speed first: run `npm run perf` before committing anything that touches drawing, dragging or sliders. No perf regression over 10%.
- Old .wodblok.json files (format v:18 and earlier) must always open; never overwrite a file on first open of an older format.
- Platform access only through src/platform/. User actions are commands in the registry. The document is plain data with stable ids. No runtime network; fonts bundled. Pointer events; nothing hover-only in new code. No alert/confirm/prompt.
- Modules export functions and do no work on import; start-up order lives in src/main.js.
- Ask before adding a dependency. Licences: MIT, BSD, ISC, Apache, OFL.
- Phase 1: no behaviour or visual changes. Phases 2-3: only what the phase lists; existing tools unchanged. Phases 1-3: no bug fixes; log bugs in docs/known-issues.md.
- Snapshots and golden screenshots: never update them just to make tests pass. **Pixel goldens** (`tests/__golden__/`): when a full-suite run fails some, look at each diff; if it is exactly the change this release made on purpose (new labels, text size, layout, a new control), regenerate those goldens (`--update-snapshots=changed` on just those tests, then re-run them), and say in the report which ones and why. A golden that fails for a reason the release does not explain is a bug: fix it or ask, never regenerate it. **State and SVG snapshots** (`tests/__snapshots__/`) still need the user's approval first: say which changed and why, and ask.
- Desktop (Mac/Windows) and mobile are later; do not build them now, but do not block them.

## Release workflow
1. **Check the version first.** At the start of every session, fetch, state the newest version on `main` (package.json) and the latest tag, and work from that, never from an older checkout or branch. Older versions and `legacy/` are never touched, rebuilt, archived or modified unless the user explicitly says so.
2. **Branch.** Work on `fix/<version>-<name>` (or `feat/...`), never on `main`. Keep releases small (one theme, a few items) so a revert undoes little. One commit per behaviour change, each with a test (renames and CSS-only changes may share one commit and one test).
3. **Test, scaled to the risk.** Run the quick tests that touch the change (under a minute or two) and `npm run perf` where the Never-break list says so. Run the full suite (about 15-20 minutes) only for risky changes: about 60-90% importance for drawing, rendering, Randomize, saving and opening files, the file format or anything in src/platform; 30-50% for shared code such as history, panels or the document. Below that, quick tests are enough. CI (.github/workflows/test.yml) runs the whole suite, including WebKit, once per pull request to `main` (not on pushes to branches; a draft pull request does not run it), so open the pull request as a draft while working, mark it ready when the release is done, and check CI before going live. GitHub Actions minutes are limited (docs/ci-budget-rules.md): never add workflows that run on every push, never use macOS or Windows runners outside release builds, and keep a new push from restarting a run (concurrency cancel).
4. **Version and docs.** Bump package.json and the lockfile (the version is MAJOR.MINOR.PATCH; the build writes it into WB_VER, the badge and <title>; 1.0.0 shows as v1.0, 1.2.1 as v1.2.1). Each release raises the minor, a hotfix raises the patch, the major changes only when the user says so; the UX fix plan (docs/fix-plan.md, 1.0.1 to 1.0.20) is closed as of 1.1.0; the next plan goes in docs/plan.md. One git tag per release (made by the tag workflow). Update the release's outcome in docs/fix-plan.md.
5. **Preview.** After each push that is not docs- or tests-only, rebuild (`npm run build`, from the clean commit so the bottom-bar stamp is the commit date) and publish dist/wodblok.html to the preview artifact (https://claude.ai/artifact/AkEURvCERNYJmNPWwiEduB, same URL, same capabilities) without being asked.
6. **Report, once, in one short block:** a task list with approximate % complete; what was and was not run; the importance of the full suite as a percentage with one sentence of why (if it was not run); any snapshot or golden that changed (ask before updating).
7. **Going live.** `main` is hosted on Cloudflare: whatever lands on `main` is live on wodblok.com. Merging into `main` is called "going live". Never go live without the user saying so for that release. Say before going live if the release touches saving, opening files or the file format. To undo a release, see docs/going-live.md.

## Tests (Phase 0 safety net)
- `legacy/wodblok-v100.html` is the untouched baseline (sha256 in `legacy/wodblok-v100.html.sha256`). Tests run on it by default; `WB_TARGET=build` runs them on `dist/wodblok.html`.
- Tests drive the real UI and use only these hooks: the page's `coreStr()` (the build exposes `window.__wbTest = { state(), commands }`; `state()` returns the same string, `commands` is the command registry for the commands tests).
- Determinism: seeded Math.random, fixed Date, no network, fixed viewport and locale. All injected from the test side; the app is not modified.
- Three layers of checks: document state (`tests/__snapshots__/**/*.state.json`), SVG markup summary (`*.svg.json`), pixels (`tests/__golden__/<WB_ENV>/`, only valid in the environment that made them; set `WB_PIXELS=0` to skip them).
- Real project files in `tests/fixtures/` are format v18 and must open in every future build.
- Known v100 quirks are pinned, not fixed: see docs/known-issues.md.
- Coupling map of the single-file code: docs/coupling-map.md (`npm run coupling-map`).
