#!/usr/bin/env node
// `npm run perf:draw`: builds the app and measures how long drawing takes with many elements and effects (tests/perf-draw.spec.js, docs/speed-plan.md).
// Prints one table. WB_DRAW_N and WB_DRAW_K change the number of shapes and the effects on each (default 40 and 4). Nothing is compared or stored: write the
// table into docs/perf-baseline.md and compare the same machine before and after a change.
const { execSync } = require('child_process'), path = require('path');
const ROOT = path.join(__dirname, '..'), sh = c => execSync(c, { stdio: 'inherit', cwd: ROOT, env: { ...process.env, WB_PERF: '1', WB_TARGET: 'build', WB_PIXELS: '0' } });
sh('node tools/build.js');
try { sh('npx playwright test --project=chromium tests/perf-draw.spec.js --reporter=line'); } catch (e) { process.exit(1); }
