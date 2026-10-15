# CI budget rules (GitHub Actions minutes)

The repo is private on the GitHub Free plan: 2,000 Actions minutes a month. Linux runners count 1x, Windows 2x, macOS 10x. Each job is rounded up to whole minutes. The allowance was used up in two days when the tests ran on every push and every pull request update (two jobs, the full Chromium suite at 15-20 minutes each time).

## Status: the repo is public (since Oct 11 2026)
GitHub Actions on standard runners are free and unlimited for public repositories, so the minutes limit does not apply now. The rules below stay in place on purpose: they keep CI fast and tidy, and they are what keeps the project inside the 2,000 free minutes if the repo is made private again. If CI on every push ever becomes useful while the repo is public, add `push` to the triggers in `.github/workflows/test.yml`, and remove it again before the repo goes private.

## Rules
1. **CI runs once per pull request to `main`**, not on pushes to branches. Work and push to a branch freely; no minutes are used.
2. **Open the pull request as a draft** while working (a draft does not run CI). Mark it ready when the release is done and local tests pass; that starts the run. Each later push to a ready pull request restarts it, so push fixes in batches.
3. **Cancel superseded runs.** Every workflow has a `concurrency` group with `cancel-in-progress: true`.
4. **Linux runners only**, except a future release build for the desktop app (macOS or Windows, on version tags only, never on pull requests).
5. **Timeouts on every job** (`timeout-minutes`) so a hung test cannot burn an hour.
6. **Upload test results only on failure**, kept 3 days, so artifact storage (500 MB on Free) does not fill.
7. **Run tests locally first**, scaled to risk as in CLAUDE.md step 3; CI is the final check before going live, not the development loop.
8. **No `paths-ignore` on the test workflow.** The `chromium` and `webkit` checks are required for merging (docs/going-live.md); a workflow skipped by a path filter leaves a required check pending forever.
9. **The tag workflow runs on pushes to `main` only.**
10. **To test a branch without a pull request**, run the `tests` workflow by hand (Actions tab > tests > Run workflow).
11. **Check the Usage page** (GitHub > Settings > Billing and licensing > Usage) on the 1st and 15th. Consider a small spending budget as a safety net so CI keeps running at the limit.

12. **The Chromium suite runs in four parts at once** (`chromium-shard 1/4` to `4/4`, Playwright `--shard`), the picture comparison with `main` is its own job, and a last job named `chromium` collects them so the required check name stays `chromium`. A run takes about a quarter of the time but uses a little more minutes in total (each part installs and builds). Keep new work inside these jobs; do not add more parallel jobs.

## What a month should cost
About one full run per release (about 25-40 minutes for Chromium plus WebKit), a few more when CI finds something, so roughly 4-8 releases use 150-400 minutes. If a month needs more, the cheapest next step is a `test:quick` subset for early pull request updates; a paid plan comes after that.

## If minutes run out anyway
Nothing is lost; jobs wait until the cycle resets. Run `npm test` and `npm run test:webkit` locally (Claude Code can run them in its own session) and merge when they pass.
