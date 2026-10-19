#!/usr/bin/env node
// `npm run perf`: builds the app and the last release (origin/main, or main) side by side and runs tests/perf.spec.js, which fails if the drag is more than
// 10% slower than on main. WB_BASELINE=<path> uses an existing older build instead.
const { execSync } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const ROOT = path.join(__dirname, '..'), sh = (c, o = {}) => execSync(c, { stdio: 'inherit', cwd: ROOT, ...o });
sh('node tools/build.js');
let base = process.env.WB_BASELINE, tmp = null;
if (!base) {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-perf-base-'));
  const ref = (() => { try { execSync('git rev-parse --verify origin/main', { cwd: ROOT, stdio: 'ignore' }); return 'origin/main'; } catch (e) { return 'main'; } })();
  sh(`git worktree add --detach "${tmp}/src" ${ref}`);
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(tmp, 'src', 'node_modules'));
  sh('node tools/build.js', { cwd: path.join(tmp, 'src') });
  base = path.join(tmp, 'src', 'dist', 'wodblok.html');
}
let code = 0;
try { sh('npx playwright test --project=chromium tests/perf.spec.js', { env: { ...process.env, WB_PERF: '1', WB_TARGET: 'build', WB_BASELINE: base } }); } catch (e) { code = 1; }
if (tmp) { try { sh(`git worktree remove --force "${tmp}/src"`); } catch (e) { /* the temp folder goes with the system */ } }
process.exit(code);
