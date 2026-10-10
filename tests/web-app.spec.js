// The hosted / installable web app (npm run build:web): works offline, finds a newer version in the background without
// reloading, applies it only when asked, fetches nothing from the network, and shows how much it stores.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { ROOT } = require('./helpers/harness');

const OUT = path.join(ROOT, 'test-results', 'web-app');
const [vMa, vMi, vPa] = require(path.join(ROOT, 'package.json')).version.split('.');
const VER = +vMa >= 100 ? vMa : `${vMa}.${vMi}${+vPa ? '.' + vPa : ''}`;     // as the build writes it
const build = (name, built) => {
  const dir = path.join(OUT, name);
  fs.rmSync(dir, { recursive: true, force: true });
  execFileSync('node', [path.join(ROOT, 'tools', 'build.js'), path.join(dir, 'index.html'), '--web'], { env: { ...process.env, WB_BUILT: built }, stdio: 'ignore' });
  return dir;
};
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

test.describe.configure({ mode: 'serial' });
let server, root, base;
test.beforeAll(async () => {
  const a = build('a', '2026-10-09T10:00:00Z'), b = build('b', '2026-10-09T11:00:00Z');
  root = a;
  server = http.createServer((q, r) => {
    const u = q.url.split('?')[0], f = path.join(root, u === '/' ? 'index.html' : u);
    if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(fs.readFileSync(f));
  });
  await new Promise(res => server.listen(0, '127.0.0.1', res));
  base = 'http://127.0.0.1:' + server.address().port + '/';
  test.info().annotations.push({ type: 'b', description: b });
});
test.afterAll(() => server && server.close());

test('installs, opens offline, finds a new version without reloading, and applies it when asked', async ({ page, context }) => {
  const external = [];
  page.on('request', r => { const u = r.url(); if (!u.startsWith(base) && !/^(data|blob):/.test(u)) external.push(u); });
  await page.goto(base);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect(page.locator('#ver')).toBeVisible();
  await expect(page.locator('#pstore')).toContainText('Stored');
  await expect(page.locator('#pupd')).toBeHidden();

  // offline: the whole app still opens from the device
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#ver')).toBeVisible();
  expect(await page.evaluate(() => typeof window.__wbTest)).toBe('object');
  await context.setOffline(false);

  // a newer build appears on the server: it is fetched in the background and waits
  root = path.join(OUT, 'b');
  await page.evaluate(() => { window.__stay = 'same page'; });
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
  await expect(page.locator('#pupd')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => window.__stay)).toBe('same page');            // the page was not reloaded
  expect(await page.evaluate(async () => (await caches.keys()).sort())).toEqual([`wodblok-${VER}-2026-10-09T10:00:00Z`, `wodblok-${VER}-2026-10-09T11:00:00Z`]);

  // with unsaved work the dot asks to save first and changes nothing
  await page.click('.rail [data-pn="rand"]');
  await page.click('#rzdo');
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)') && window.__wbTest.state().length > 1500);
  await page.click('#pupd');
  await expect(page.locator('#pmsg')).toContainText('Save your work first');
  expect(await page.evaluate(() => window.__stay)).toBe('same page');

  // a new launch (a reload here) starts blank and still sees the waiting version; with nothing to lose the dot applies it and reloads
  await page.reload();
  await expect(page.locator('#pupd')).toBeVisible({ timeout: 15000 });
  await Promise.all([page.waitForEvent('load'), page.click('#pupd')]);
  await page.waitForFunction(async () => (await caches.keys()).length === 1);
  expect(await page.evaluate(async () => (await caches.keys())[0])).toBe(`wodblok-${VER}-2026-10-09T11:00:00Z`);
  await expect(page.locator('#pupd')).toBeHidden();
  expect(external).toEqual([]);                                                  // no fonts or anything else from the network
});

test('the web manifest is installable and every file it names exists', async ({ page }) => {
  const m = JSON.parse(fs.readFileSync(path.join(OUT, 'a', 'manifest.webmanifest'), 'utf8'));
  expect(m.display).toBe('standalone');
  for (const i of m.icons) expect(fs.existsSync(path.join(OUT, 'a', i.src)), i.src).toBe(true);
  expect(m.icons.map(i => i.purpose)).toEqual(['any', 'any', 'maskable']);
  const html = fs.readFileSync(path.join(OUT, 'a', 'index.html'), 'utf8');
  expect(html).toContain('<link rel="manifest" href="manifest.webmanifest">');
  expect(fs.readFileSync(path.join(ROOT, 'dist', 'wodblok.html'), 'utf8')).not.toContain('manifest.webmanifest');   // the single file stays plain
});

test('favicon.ico is shipped and kept for offline use, so browsers that ask for it do not get a 404 (UX review P6)', async () => {
  expect(fs.existsSync(path.join(OUT, 'a', 'favicon.ico'))).toBe(true);
  expect(fs.readFileSync(path.join(OUT, 'a', 'sw.js'), 'utf8')).toContain("'favicon.ico'");
});
