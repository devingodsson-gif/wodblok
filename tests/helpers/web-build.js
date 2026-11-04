// The hosted app for the asset split specs (2.98.1, docs/asset-split-plan.md): builds `npm run build:web` into a temporary folder, serves it from a local
// server, and opens it with the harness (which answers every other host empty, so this server is let through). Use:
//   const W = webBuild();                       at the top of a spec (adds its own beforeAll and afterAll)
//   const { errors, asked } = await W.open(page, { seed: 4 })   asked lists the paths of assets/ the page fetched, from the very start
//   W.dir                                       the built folder (index.html, assets/...)
const { test } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const H = require('./harness');
const ROOT = path.join(__dirname, '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
function webBuild() {
  const W = { dir: null, base: null, server: null };
  test.beforeAll(async () => {
    W.dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-web-'));
    execFileSync(process.execPath, [path.join(ROOT, 'tools', 'build.js'), path.join(W.dir, 'index.html'), '--web'], { cwd: ROOT, stdio: 'ignore' });
    W.server = http.createServer((q, r) => {
      const p = path.join(W.dir, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/$/, '/index.html'));
      if (!p.startsWith(W.dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
    });
    await new Promise(res => W.server.listen(0, '127.0.0.1', res)); W.base = 'http://127.0.0.1:' + W.server.address().port + '/';
  });
  test.afterAll(async () => { if (W.server) await new Promise(res => W.server.close(res)); if (W.dir) fs.rmSync(W.dir, { recursive: true, force: true }); });
  W.open = async (page, o = {}) => {
    const asked = []; page.on('request', q => { const u = q.url(); if (u.includes('/assets/')) asked.push(u.slice(u.indexOf('/assets/'))); });
    const r = await H.openApp(page, { ...o, url: W.base, before: async p => { await p.route(u => u.href.startsWith(W.base), q => q.continue()); if (o.before) await o.before(p); } });
    return { ...r, asked };
  };
  return W;
}
module.exports = { webBuild };
