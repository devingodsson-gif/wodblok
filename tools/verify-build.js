#!/usr/bin/env node
// Phase 1a exit check: the built file is byte-identical to legacy/wodblok-v100.html.
// (From Phase 1b on the code changes, so this check is retired and the test suite is the judge.)
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
execFileSync('node', [path.join(__dirname, 'build.js')], { stdio: 'inherit' });
const h = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const a = h('legacy/wodblok-v100.html'), b = h('dist/wodblok.html');
console.log('legacy', a, '\nbuilt ', b);
if (a !== b) { console.error('MISMATCH: the build is not identical to v100'); process.exit(1); }
console.log('OK: identical to v100');
