// 1.27: accounts in the app. The server is replaced by a stand-in for fetch (window.__api), so nothing here touches the network.
// Where no account server answers (local, previews, every other test) nothing shows; where one does, a name chip, File > Account…,
// File > Send feedback…, the offline pass, the locked screen and the active-time totals appear.
const { test, expect } = require('@playwright/test');
const { webcrypto } = require('crypto');
const fs = require('fs');
const path = require('path');
const { TARGET, ROOT, openApp } = require('./helpers/harness');

test.use({ serviceWorkers: 'block' });   // the app registers a service worker on a hosted address; none is wanted here

test.beforeEach(() => { test.skip(TARGET !== 'build', 'needs the built page, served from a made-up hosted address'); });

const ME = (over = {}) => ({ status: 200, body: { ok: true, gated: true, approved: true, firstName: 'Ana', email: 'ana@example.com', type: 'early_access', pass: null, ...over } });
const stub = cfg => `(() => {
  window.__api = { calls: [], cfg: ${JSON.stringify(cfg)} };
  window.fetch = async (url, init = {}) => {
    const path = '/api/' + String(url).split('/api/')[1];
    window.__api.calls.push({ path, method: init.method || 'GET', body: init.body || null });
    const r = window.__api.cfg[path];
    if (!r || r === 'offline') throw new TypeError('Failed to fetch');
    return new Response(r.body === null ? 'x' : JSON.stringify(r.body), { status: r.status });
  };
})();`;
// The built page is served from a made-up hosted address (the account code does nothing from a file or a local dev server).
const HOST = 'https://app.wodblok.test/';
const serve = p => p.route(HOST + '**', r => (/\/sw\.js$/.test(r.request().url())
  ? r.fulfill({ contentType: 'text/javascript', body: '/* no service worker in this test */' })   // the app registers one on a hosted address
  : r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(ROOT, 'dist', 'wodblok.html')) })));
const open = async (page, cfg) => { await page.addInitScript(stub(cfg)); return openApp(page, { url: HOST, before: serve }); };
const calls = (page, path) => page.evaluate(p => window.__api.calls.filter(c => c.path === p), path);
const set = (page, path, r) => page.evaluate(([p, v]) => { window.__api.cfg[p] = v; }, [path, r]);
const fileMenu = async page => { await page.click('#fileb'); return page.locator('#filem > button, #filem > label'); };

// a pass signed with a key made here, standing in for the server's
const b64u = b => Buffer.from(b).toString('base64url');
// The page's clock is fixed by the harness (not the real one), so passes and times are made from the page's now.
const pageNow = page => page.evaluate(() => Date.now());
async function makePass(now, over = {}) {
  const kp = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const sec = Math.floor(now / 1000);
  const head = b64u(JSON.stringify({ v: 1, sub: 'user_1', type: 'early_access', fn: 'Ana', iat: sec, exp: sec + 7 * 86400, ...over }));
  const sig = Buffer.from(await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, Buffer.from(head))).toString('base64url');
  return { pass: head + '.' + sig, pub: await webcrypto.subtle.exportKey('jwk', kp.publicKey) };
}
const check = (page, pass, pub, seen) => page.evaluate(async ([pass, pub, seen]) => {
  const a = window.__wbTest.account, kv = window.__wbTest.kv;
  a.setKey(pub); kv.set('wb300_acct_pass', pass); if (seen) kv.set('wb300_acct_seen', String(seen)); else kv.remove('wb300_acct_seen');
  return a.check();
}, [pass, pub, seen]);

test('where no account server answers, nothing shows and the menu and commands are as before', async ({ page }) => {
  const { errors } = await open(page, { '/api/me': { status: 404, body: null } });
  await expect(page.locator('#pacct')).toBeHidden();
  await expect(await fileMenu(page)).toHaveText(['New project', 'New from template…', 'Clear canvas', 'Open project…', 'Save as template…', 'Settings…']);
  expect(await page.evaluate(() => !!window.__wbTest.commands.get('account.open') || !!window.__wbTest.commands.get('feedback.open'))).toBe(false);
  await expect(page.locator('#aclk')).toBeHidden();
  expect(await calls(page, '/api/usage')).toEqual([]);
  expect(errors).toEqual([]);
});

test('from a file or a local server no request is made at all, so local copies and tests stay silent', async ({ page }) => {
  await page.addInitScript(stub({ '/api/me': ME() }));
  const { errors } = await openApp(page);   // file:// here
  await expect(page.locator('#pacct')).toBeHidden();
  expect(await calls(page, '/api/me')).toEqual([]);
  expect(await page.evaluate(() => window.__wbTest.account.check())).toEqual({ state: 'off' });
  expect(errors).toEqual([]);
});

test('an account host that says "not signed in" but is not gated (a preview) asks nothing of the person', async ({ page }) => {
  await open(page, { '/api/me': { status: 401, body: { ok: false, gated: false } } });
  await expect(page.locator('#aclk')).toBeHidden();
  await expect(page.locator('#pacct')).toBeHidden();
});

test('signed in: a name chip, File > Account… and File > Send feedback…, with commands', async ({ page }) => {
  const { errors } = await open(page, { '/api/me': ME() });
  await expect(page.locator('#pacct')).toHaveText('Hi Ana!');
  await expect(await fileMenu(page)).toHaveText(['New project', 'New from template…', 'Clear canvas', 'Open project…', 'Save as template…', 'Settings…', 'Account…', 'Send feedback…']);
  const c = await page.evaluate(() => ['account.open', 'feedback.open'].map(id => { const x = window.__wbTest.commands.get(id); return x && [x.label, x.enabled()]; }));
  expect(c).toEqual([['Account', true], ['Send feedback', true]]);
  await page.click('#acgo');
  await expect(page.locator('#acdlg')).toBeVisible();
  await expect(page.locator('#acbody .stgr')).toHaveText([/Name\s*Ana/, /Email\s*ana@example\.com/, /Account\s*Early access/]);
  await expect(page.locator('#acbody .row button')).toHaveText(['Manage account', 'Sign out']);
  await page.keyboard.press('Escape');
  await expect(page.locator('#acdlg')).toBeHidden();
  await page.click('#pacct');
  await expect(page.locator('#acdlg')).toBeVisible();
  await page.click('#acclose');
  await expect(page.locator('#acdlg')).toBeHidden();
  await expect(page.locator('#pacct')).toBeFocused();
  expect(errors).toEqual([]);
});

test('a name with markup is shown as text', async ({ page }) => {
  await open(page, { '/api/me': ME({ firstName: '<img src=x onerror=window.__x=1>' }) });
  await expect(page.locator('#pacct')).toHaveText('Hi <img src=x onerror=window.__x=1>!');
  await page.click('#pacct');
  expect(await page.evaluate(() => window.__x)).toBeUndefined();
});

test('feedback: Send waits for a message; one POST with the kind, text and version; the dialog closes and the status line says so', async ({ page }) => {
  await open(page, { '/api/me': ME(), '/api/feedback': { status: 200, body: { ok: true } } });
  await page.click('#fileb'); await page.click('#fbgo');
  await expect(page.locator('#fbdlg')).toBeVisible();
  await expect(page.locator('#fbok')).toBeDisabled();
  await page.click('#fbcat [data-v="bug"]');
  await page.fill('#fbmsg', 'The stamp jumps');
  await expect(page.locator('#fbok')).toBeEnabled();
  await page.click('#fbok');
  await expect(page.locator('#fbdlg')).toBeHidden();
  await expect(page.locator('#pmsg')).toHaveText('Sent feedback');
  const sent = await calls(page, '/api/feedback');
  expect(sent).toHaveLength(1);
  expect(sent[0].method).toBe('POST');
  const b = JSON.parse(sent[0].body);
  expect([b.category, b.message]).toEqual(['bug', 'The stamp jumps']);
  expect(b.key).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  expect(b.version).toMatch(/^\d/);
});

test('feedback: a failed send keeps the message and the dialog, and the retry uses the same key', async ({ page }) => {
  await open(page, { '/api/me': ME(), '/api/feedback': 'offline' });
  await page.click('#fileb'); await page.click('#fbgo');
  await page.fill('#fbmsg', 'Hello');
  await page.click('#fbok');
  await expect(page.locator('#pmsg')).toHaveText('No connection, feedback not sent');
  await expect(page.locator('#fbdlg')).toBeVisible();
  await expect(page.locator('#fbmsg')).toHaveValue('Hello');
  await set(page, '/api/feedback', { status: 200, body: { ok: true } });
  await page.click('#fbok');
  await expect(page.locator('#fbdlg')).toBeHidden();
  const keys = (await calls(page, '/api/feedback')).map(c => JSON.parse(c.body).key);
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  // a new message gets a new key
  await page.click('#fileb'); await page.click('#fbgo');
  await page.fill('#fbmsg', 'Again');
  await page.click('#fbok');
  const all = (await calls(page, '/api/feedback')).map(c => JSON.parse(c.body).key);
  expect(all[2]).not.toBe(all[0]);
});

test('feedback: Mod+Enter sends and Escape closes', async ({ page }) => {
  await open(page, { '/api/me': ME(), '/api/feedback': { status: 200, body: { ok: true } } });
  await page.click('#fileb'); await page.click('#fbgo');
  await page.keyboard.press('Escape');
  await expect(page.locator('#fbdlg')).toBeHidden();
  await page.click('#fileb'); await page.click('#fbgo');
  await page.fill('#fbmsg', 'Quick one');
  await page.press('#fbmsg', 'Control+Enter');
  await expect(page.locator('#fbdlg')).toBeHidden();
  expect(await calls(page, '/api/feedback')).toHaveLength(1);
});

test('signed out on a gated host: the locked screen, no way around it with Escape, Save project still works, Try again lets you in once signed in', async ({ page }) => {
  await open(page, { '/api/me': { status: 401, body: { ok: false, gated: true } } });
  await expect(page.locator('#aclk')).toBeVisible();
  await expect(page.locator('#aclt')).toHaveText('Signed out');
  await page.keyboard.press('Escape');
  await expect(page.locator('#aclk')).toBeVisible();
  await expect(page.locator('#aclsv')).toBeVisible();
  await set(page, '/api/me', ME());
  await page.click('#aclre');
  await expect(page.locator('#aclk')).toBeHidden();
  await expect(page.locator('#pacct')).toHaveText('Hi Ana!');
});

test('signed in but not approved on a gated host: says so', async ({ page }) => {
  await open(page, { '/api/me': { status: 200, body: { ok: true, gated: true, approved: false, type: 'waitlist' } } });
  await expect(page.locator('#aclt')).toHaveText('Not approved yet');
});

test('offline: a valid pass keeps the app open and says until when; no pass means nothing is asked', async ({ page }) => {
  await open(page, { '/api/me': 'offline' });
  await expect(page.locator('#aclk')).toBeHidden();
  const now = await pageNow(page);
  const { pass, pub } = await makePass(now);
  const r = await check(page, pass, pub, now - 1000);
  expect([r.state, r.name, r.type, r.online]).toEqual(['ok', 'Ana', 'early_access', false]);
  expect(r.until).toBeGreaterThan(now + 6 * 86400_000);
});

test('offline: an expired pass, a wound-back clock and a tampered pass lock the app; the fault is named', async ({ page }) => {
  await open(page, { '/api/me': 'offline' });
  const now = await pageNow(page), old = Math.floor(now / 1000) - 8 * 86400;
  const expired = await makePass(now, { iat: old, exp: old + 7 * 86400 });
  expect(await check(page, expired.pass, expired.pub, now - 1000)).toMatchObject({ state: 'locked', reason: 'expired' });
  const good = await makePass(now);
  expect(await check(page, good.pass, good.pub, now + 3 * 3600_000)).toMatchObject({ state: 'locked', reason: 'clock' });
  const [head, sig] = good.pass.split('.');
  const forged = b64u(JSON.stringify({ ...JSON.parse(Buffer.from(head, 'base64url').toString()), exp: Math.floor(now / 1000) + 99 * 86400 })) + '.' + sig;
  expect(await check(page, forged, good.pub, now - 1000)).toMatchObject({ state: 'locked', reason: 'expired' });
  // a pass signed by some other key is not ours
  const other = await makePass(now);
  expect(await check(page, good.pass, other.pub, now - 1000)).toMatchObject({ state: 'locked', reason: 'expired' });
});

test('online and approved: the pass from the server is checked and kept for offline use', async ({ page }) => {
  const { pass, pub } = await makePass(Date.UTC(2026, 9, 8, 12, 0, 0));
  await page.addInitScript(`window.__passKey = ${JSON.stringify(pub)};`);
  await open(page, { '/api/me': ME({ pass }) });
  await page.evaluate(() => window.__wbTest.account.setKey(window.__passKey));
  await page.evaluate(() => window.__wbTest.account.check());
  expect(await page.evaluate(() => window.__wbTest.kv.get('wb300_acct_pass'))).toBeTruthy();
  expect(await page.evaluate(() => Number(window.__wbTest.kv.get('wb300_acct_seen')))).toBeGreaterThan(0);
});

test('active time: counted as running totals, sent only when they changed, kept when offline, tracked for early access and testers only', async ({ page }) => {
  await open(page, { '/api/me': ME(), '/api/usage': 'offline' });
  const u = () => page.evaluate(() => window.__wbTest.account.usage.get());
  expect(await u()).toMatchObject({ seconds: 0, sessions: 1 });   // this launch is one session
  expect(await page.evaluate(() => ['early_access', 'tester', 'subscriber', 'none'].map(t => window.__wbTest.account.usage.tracked(t)))).toEqual([true, true, false, false]);
  await page.evaluate(() => { window.__wbTest.account.usage.add(15); window.__wbTest.account.usage.add(15); });
  expect(await u()).toMatchObject({ seconds: 30, sessions: 1 });
  expect(await page.evaluate(() => window.__wbTest.account.usage.send('1.27.0'))).toBe(false);   // offline: kept, not lost
  expect(await u()).toMatchObject({ seconds: 30 });
  await set(page, '/api/usage', { status: 200, body: { ok: true } });
  expect(await page.evaluate(() => window.__wbTest.account.usage.send('1.27.0'))).toBe(true);
  expect(await page.evaluate(() => window.__wbTest.account.usage.send('1.27.0'))).toBe(true);    // unchanged: nothing more is sent
  const sent = (await calls(page, '/api/usage')).filter(c => c.body);
  const ok = sent.map(c => JSON.parse(c.body));
  expect(ok[ok.length - 1]).toMatchObject({ seconds: 30, sessions: 1, version: '1.27.0' });
  expect(sent.length).toBe(2);   // one failed try, one that went through
  // a new day starts again at zero
  const tomorrow = (await pageNow(page)) + 86400_000;
  expect(await page.evaluate(t => window.__wbTest.account.usage.get(t), tomorrow)).toMatchObject({ seconds: 0, sessions: 0 });
});

test('sign out: clears the cookie and what the device kept, and goes to the site to finish', async ({ page }) => {
  await page.addInitScript(`Object.defineProperty(window, '__where', { value: [] });`);
  await open(page, { '/api/me': ME(), '/api/gate-cookie': { status: 200, body: { ok: true } } });
  await page.evaluate(() => { window.__wbTest.kv.set('wb300_acct_pass', 'x.y'); });
  const to = await page.evaluate(() => window.__wbTest.account.signOut());
  expect(to).toBe('https://wodblok.test/?signout=1');   // the site finishes signing out
  expect((await calls(page, '/api/gate-cookie')).map(c => c.method)).toEqual(['DELETE']);
  expect(await page.evaluate(() => window.__wbTest.kv.get('wb300_acct_pass'))).toBeNull();
});

test('no account code runs on the drawing path: no pointer-move listener is added by the account module', async ({ page }) => {
  await open(page, { '/api/me': ME() });
  const kinds = await page.evaluate(() => {
    const seen = []; const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (t, ...r) { seen.push(t); return add.call(this, t, ...r); };
    return window.__wbTest.account.check().then(() => seen);
  });
  expect(kinds.filter(k => /move|drag/.test(k))).toEqual([]);
});
