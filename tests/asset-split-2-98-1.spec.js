// 2.98.1 (owner Nov 4 2026, docs/asset-split-plan.md step 1): the hosted app (npm run build:web) keeps the app's own files next to the page, in assets/, and fetches
// each only when it is needed; the single file keeps them inside. Mockup products are the first: their photos and masks load from assets/mockups/ when the
// Mockup tab shows them, nothing else is fetched at start, and the library's Export still gets their bytes.
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const H = require('./helpers/harness');
const ROOT = path.join(__dirname, '..');
let dir, server, base;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-web-'));
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'build.js'), path.join(dir, 'index.html'), '--web'], { cwd: ROOT, stdio: 'ignore' });
  server = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/$/, '/index.html'));
    if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
  await new Promise(res => server.listen(0, '127.0.0.1', res)); base = 'http://127.0.0.1:' + server.address().port + '/';
});
test.afterAll(async () => { if (server) await new Promise(res => server.close(res)); if (dir) fs.rmSync(dir, { recursive: true, force: true }); });

test('the hosted build: mockup photos are files in assets/, fetched only when the Mockup tab shows them', async ({ page }) => {
  test.setTimeout(120000);
  const files = fs.readdirSync(path.join(dir, 'assets', 'mockups'));
  expect(files.filter(f => /^[a-z]+\.[0-9a-f]{10}\.webp$/.test(f)).length).toBe(6);
  expect(files.filter(f => /-mask\.[0-9a-f]{10}\.png$/.test(f)).length).toBe(6);
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  expect(html).toContain('"assets/mockups/tshirt.');
  expect(html).not.toContain(fs.readFileSync(path.join(ROOT, 'mockups', 'tshirt.webp')).toString('base64').slice(0, 400));   // the photo is not inside the page
  const asked = []; page.on('request', q => { const u = q.url(); if (u.includes('/assets/')) asked.push(u.slice(u.indexOf('/assets/'))); });
  const { errors } = await H.openApp(page, { seed: 4, url: base, before: p => p.route(u => u.href.startsWith(base), r => r.continue()) });   // the harness answers other hosts empty; let this server through
  expect(asked).toEqual([]);   // nothing of assets/ at start
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  await page.waitForFunction(() => { const c = document.getElementById('mkc'); return c && c.width > 0; }, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  expect(asked.some(u => /^\/assets\/mockups\/tshirt\.[0-9a-f]{10}\.webp$/.test(u))).toBe(true);
  expect(asked.some(u => /^\/assets\/mockups\/tshirt-mask\.[0-9a-f]{10}\.png$/.test(u))).toBe(true);
  // the thumbnails are the files too, and they load
  const ok = await page.locator('#mkpane [data-mk^="p-"] img').evaluateAll(a => Promise.all(a.map(i => i.decode().then(() => i.naturalWidth > 0, () => false))));
  expect(ok).toEqual([true, true, true, true, true, true]);
  // the view drew the photo (not an empty canvas)
  const lit = await page.evaluate(() => { const c = document.getElementById('mkc'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 400) if (d[i]) n++; return n; });
  expect(lit).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});
