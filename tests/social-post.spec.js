// The social post tool (tools/social/post.js and tools/social/publish/*): signing, media host, Instagram, accounts, the run, and one real test run.
// Everything that would touch Meta or Cloudflare uses a fake fetch, so nothing here reaches the network. Tooling only: the app is not touched.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { sign } = require('../tools/social/publish/sigv4');
const { makeHost } = require('../tools/social/publish/host');
const ig = require('../tools/social/publish/instagram');
const { validateAccounts, pickAccounts, missingSecrets, publishAll } = require('../tools/social/publish');
const { parseArgs, runPost, report } = require('../tools/social/post');
const { validate } = require('../tools/social/validate');

const ROOT = path.resolve(__dirname, '..');
const tmp = p => fs.mkdtempSync(path.join(os.tmpdir(), p));
const res = (body, status = 200) => ({ ok: status < 400, status, text: async () => typeof body === 'string' ? body : JSON.stringify(body) });

// A fake Instagram: records every call, answers like the real API
function fakeInstagram({ quota = 0, total = 100, statuses = ['FINISHED'], failPublish = false } = {}) {
  const calls = []; let n = 0, polls = 0;
  const fn = async (url, init = {}) => {
    const u = new URL(url), method = init.method || 'GET', body = init.body ? Object.fromEntries(new URLSearchParams(init.body)) : {};
    calls.push({ method, path: u.pathname.replace('/v23.0', ''), query: Object.fromEntries(u.searchParams), body, auth: init.headers && init.headers.Authorization, url });
    if (u.pathname.endsWith('/content_publishing_limit')) return res({ data: [{ quota_usage: quota, config: { quota_total: total } }] });
    if (method === 'POST' && u.pathname.endsWith('/media')) return res({ id: 'C' + (++n) });
    if (method === 'POST' && u.pathname.endsWith('/media_publish')) return failPublish ? res({ error: { message: 'Application request limit reached', code: 4 } }, 400) : res({ id: 'M1' });
    if (method === 'GET' && u.searchParams.get('fields') === 'status_code') return res({ status_code: statuses[Math.min(polls++, statuses.length - 1)] });
    if (method === 'GET' && u.searchParams.get('fields') === 'permalink') return res({ permalink: 'https://www.instagram.com/p/ABC/' });
    return res({ error: { message: 'unexpected ' + method + ' ' + u.pathname, code: 1 } }, 400);
  };
  return { fn, calls };
}
const ctx = (f, extra = {}) => ({ token: 'TOKEN123', userId: '1784', fetchFn: f.fn, wait: 0, ...extra });
const img = n => Array.from({ length: n }, (_, i) => ({ url: `https://pics.example/${i + 1}.jpg` }));

test.describe('request signing', () => {
  test("matches AWS's published test vector", () => {
    const r = sign({ method: 'GET', host: 'example.amazonaws.com', path: '/' }, { accessKeyId: 'AKIDEXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY' },
      { region: 'us-east-1', service: 'service', now: new Date('2015-08-30T12:36:00Z') });
    expect(r.signature).toBe('5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31');
  });
  test('a different body or key gives a different signature', () => {
    const c = { accessKeyId: 'A', secretAccessKey: 'S' }, now = new Date('2026-10-17T12:00:00Z');
    const a = sign({ method: 'PUT', host: 'h', path: '/b/k.jpg', body: 'one' }, c, { now }).signature;
    expect(sign({ method: 'PUT', host: 'h', path: '/b/k.jpg', body: 'two' }, c, { now }).signature).not.toBe(a);
    expect(sign({ method: 'PUT', host: 'h', path: '/b/k2.jpg', body: 'one' }, c, { now }).signature).not.toBe(a);
  });
});

test.describe('media host (Cloudflare R2)', () => {
  const env = { WB_R2_ACCOUNT_ID: 'acct', WB_R2_ACCESS_KEY_ID: 'KEYID', WB_R2_SECRET_ACCESS_KEY: 'SECRET999', WB_R2_BUCKET: 'bkt', WB_R2_PUBLIC_BASE: 'https://pub-abc.r2.dev/' };
  test('uploads a signed PUT and returns the public address; remove sends DELETE', async () => {
    const calls = [], f = async (url, init) => { calls.push({ url, init }); return res('', 200); };
    const h = makeHost(env, f, () => new Date('2026-10-17T12:00:00Z'));
    const url = await h.upload(Buffer.from('jpegdata'), 'posts/a b/01.jpg', 'image/jpeg');
    expect(url).toBe('https://pub-abc.r2.dev/posts/a%20b/01.jpg');
    expect(calls[0].url).toBe('https://acct.r2.cloudflarestorage.com/bkt/posts/a%20b/01.jpg');
    expect(calls[0].init.method).toBe('PUT');
    expect(calls[0].init.headers.authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=KEYID\/20261017\/auto\/s3\/aws4_request, SignedHeaders=.*content-type.*x-amz-date, Signature=[0-9a-f]{64}$/);
    expect(calls[0].init.headers.host).toBeUndefined();
    expect(JSON.stringify(calls)).not.toContain('SECRET999');
    await h.remove('posts/a b/01.jpg');
    expect(calls[1].init.method).toBe('DELETE');
  });
  test('missing settings are named (never their values), a plain http address is refused, errors hide the secret', async () => {
    expect(() => makeHost({ ...env, WB_R2_BUCKET: '', WB_R2_PUBLIC_BASE: '' })).toThrow(/WB_R2_BUCKET, WB_R2_PUBLIC_BASE/);
    expect(() => makeHost({ ...env, WB_R2_PUBLIC_BASE: 'http://x.example' })).toThrow(/https/);
    const bad = makeHost(env, async () => res('denied SECRET999', 403));
    await expect(bad.upload(Buffer.from('x'), 'k.jpg', 'image/jpeg')).rejects.toThrow(/HTTP 403/);
    await expect(bad.upload(Buffer.from('x'), 'k.jpg', 'image/jpeg')).rejects.not.toThrow(/SECRET999/);
  });
});

test.describe('instagram adapter', () => {
  test('checks the post before anything is sent', () => {
    expect(ig.check({ images: img(1), caption: 'hi' })).toEqual([]);
    expect(ig.check({ images: [], caption: '' })).toEqual(['no pictures']);
    expect(ig.check({ images: img(11), caption: '' })[0]).toMatch(/at most 10/);
    expect(ig.check({ images: img(1), caption: 'x'.repeat(2201) })[0]).toMatch(/2200/);
    expect(ig.check({ images: img(1), caption: Array.from({ length: 31 }, (_, i) => '#t' + i).join(' ') })[0]).toMatch(/30 hashtags/);
  });
  test('one picture: container, wait, publish, link. The token travels in a header only', async () => {
    const f = fakeInstagram({ statuses: ['IN_PROGRESS', 'FINISHED'] });
    const r = await ig.publish({ images: img(1), caption: 'Hello\nworld' }, ctx(f));
    expect(r).toEqual({ id: 'M1', link: 'https://www.instagram.com/p/ABC/' });
    const seq = f.calls.map(c => c.method + ' ' + c.path.replace('/1784', ''));
    expect(seq).toEqual(['GET /content_publishing_limit', 'POST /media', 'GET /C1', 'GET /C1', 'POST /media_publish', 'GET /M1']);
    expect(f.calls[1].body).toEqual({ image_url: 'https://pics.example/1.jpg', caption: 'Hello\nworld' });
    expect(f.calls[4].body).toEqual({ creation_id: 'C1' });
    for (const c of f.calls) { expect(c.auth).toBe('Bearer TOKEN123'); expect(c.url).not.toContain('TOKEN123'); }
  });
  test('several pictures become a carousel; the caption sits on the carousel, not the pictures', async () => {
    const f = fakeInstagram();
    await ig.publish({ images: img(3), caption: 'Three' }, ctx(f));
    const posts = f.calls.filter(c => c.method === 'POST' && c.path.endsWith('/media'));
    expect(posts).toHaveLength(4);
    for (const p of posts.slice(0, 3)) expect(p.body).toMatchObject({ is_carousel_item: 'true' }), expect(p.body.caption).toBeUndefined();
    expect(posts[3].body).toEqual({ media_type: 'CAROUSEL', children: 'C1,C2,C3', caption: 'Three' });
    expect(f.calls.find(c => c.path.endsWith('/media_publish')).body.creation_id).toBe('C4');
  });
  test('stops cleanly: picture rejected, daily limit reached, API error with the token hidden', async () => {
    await expect(ig.publish({ images: img(1) }, ctx(fakeInstagram({ statuses: ['ERROR'] })))).rejects.toThrow(/ERROR/);
    const full = fakeInstagram({ quota: 100, total: 100 });
    await expect(ig.publish({ images: img(1) }, ctx(full))).rejects.toThrow(/daily post limit/);
    expect(full.calls.filter(c => c.method === 'POST')).toHaveLength(0);     // nothing was created
    const e = await ig.publish({ images: img(1) }, ctx(fakeInstagram({ failPublish: true }))).catch(x => x.message);
    expect(e).toMatch(/Application request limit reached \(code 4\)/);
    expect(e).not.toContain('TOKEN123'); expect(e).not.toContain('1784');
  });
});

test.describe('accounts', () => {
  const list = [{ id: 'a-ig', platform: 'instagram', tokenEnv: 'T_A', userIdEnv: 'U_A' }, { id: 'b-ig', platform: 'instagram', tokenEnv: 'T_B', userIdEnv: 'U_B', enabled: false }, { id: 'c-ig', platform: 'instagram', tokenEnv: 'T_C', userIdEnv: 'U_C' }];
  test('the shipped list is valid', () => { expect(() => validateAccounts(require('../tools/social/accounts'))).not.toThrow(); });
  test('bad entries are refused with the reason', () => {
    const bad = (m, re) => expect(() => validateAccounts(list.map(a => ({ ...a })).map((a, i) => i === 0 ? m(a) : a))).toThrow(re);
    bad(a => ({ ...a, id: 'Bad Id' }), /lowercase/);
    bad(a => ({ ...a, platform: 'myspace' }), /supported: instagram/);
    bad(a => ({ ...a, tokenEnv: 'lowercase' }), /tokenEnv/);
    bad(a => ({ ...a, id: 'c-ig' }), /twice/);
    expect(() => validateAccounts([])).toThrow(/empty/);
  });
  test('picking: all means the enabled ones; names are checked', () => {
    expect(pickAccounts(list, 'all').map(a => a.id)).toEqual(['a-ig', 'c-ig']);
    expect(pickAccounts(list, '').map(a => a.id)).toEqual(['a-ig', 'c-ig']);
    expect(pickAccounts(list, 'c-ig, a-ig, c-ig').map(a => a.id)).toEqual(['c-ig', 'a-ig']);
    expect(() => pickAccounts(list, 'zzz')).toThrow(/Names: a-ig, b-ig, c-ig/);
    expect(() => pickAccounts(list, 'b-ig')).toThrow(/switched off/);
  });
  test('missing secrets are listed by name only', () => {
    expect(missingSecrets([list[0], list[2]], { T_A: 'x', U_C: 'y' })).toEqual(['U_A (for a-ig)', 'T_C (for c-ig)']);
  });
});

test.describe('fan-out', () => {
  const accts = [{ id: 'a-ig', platform: 'instagram', tokenEnv: 'T_A', userIdEnv: 'U_A' }, { id: 'c-ig', platform: 'instagram', tokenEnv: 'T_C', userIdEnv: 'U_C' }];
  const env = { T_A: 'ta', U_A: '1', T_C: 'tc', U_C: '2' };
  test('one account failing does not stop the next', async () => {
    let n = 0; const real = fakeInstagram();
    const fetchFn = async (url, init) => (String(url).includes('/1/') && ++n) ? res({ error: { message: 'token expired', code: 190 } }, 401) : real.fn(url, init);
    const out = await publishAll({ images: img(1), caption: 'x' }, accts, { env, real: true, fetchFn, wait: 0 });
    expect(out.map(r => [r.account, r.ok])).toEqual([['a-ig', false], ['c-ig', true]]);
    expect(out[0].error).toMatch(/token expired/);
  });
  test('a test run calls nothing, and a bad post is reported per account', async () => {
    const fetchFn = async () => { throw new Error('network must not be touched'); };
    expect((await publishAll({ images: img(1), caption: '' }, accts, { env, real: false, fetchFn })).every(r => r.ok && r.test)).toBe(true);
    const bad = await publishAll({ images: img(1), caption: 'x'.repeat(3000) }, accts, { env, real: true, fetchFn });
    expect(bad.every(r => !r.ok && /2200/.test(r.error))).toBe(true);
  });
});

test.describe('the post command', () => {
  test('arguments are checked', () => {
    expect(parseArgs(['--seeds', '5, 6', '--caption', 'a\\nb', '--accounts', 'x', '--real'])).toMatchObject({ seeds: [5, 6], caption: 'a\nb', accounts: 'x', real: true });
    expect(parseArgs(['--seeds', '5'])).toMatchObject({ real: false, accounts: 'all' });     // test run unless --real
    expect(() => parseArgs([])).toThrow(/--seeds is required/);
    expect(() => parseArgs(['--seeds', '5,5'])).toThrow(/twice/);
    expect(() => parseArgs(['--seeds', 'abc'])).toThrow(/whole numbers/);
    expect(() => parseArgs(['--seeds', '1,2,3,4,5,6,7,8,9,10,11'])).toThrow(/at most 10/);
    expect(() => parseArgs(['--seeds', '1', '--nope'])).toThrow(/unknown option/);
  });

  // deps with a fake renderer that writes real files, a fake host and a fake Instagram
  const world = (opts = {}) => {
    const dir = tmp('wb-post-'), ig2 = fakeInstagram(opts.ig), uploaded = [], removed = [], rendered = [];
    const renderBatch = async (cfg, o) => {
      rendered.push(o);
      const n = opts.renderN === undefined ? o.seeds.length : opts.renderN, items = [];
      for (let i = 1; i <= n; i++) { const f = String(i).padStart(2, '0') + '.png'; fs.writeFileSync(path.join(dir, f.replace('.png', '.jpg')), Buffer.from([0xff, 0xd8, 0xff, i])); items.push({ n: i, file: f, seed: o.seeds[i - 1] }); }
      return { outDir: dir, items, manifest: { size: o.size || 1080 } };
    };
    const host = { upload: async (b, k) => { uploaded.push(k); return 'https://pub.example/' + k; }, remove: async k => { removed.push(k); } };
    const env = { T: 'tok', U: '99' };
    const deps = { cfg: validate(require('../tools/social/config')), accounts: [{ id: 'main', platform: 'instagram', tokenEnv: 'T', userIdEnv: 'U' }], env, renderBatch, makeHost: () => host, fetchFn: ig2.fn, wait: 0 };
    return { deps, ig: ig2, uploaded, removed, rendered, dir };
  };
  const A = o => ({ seeds: [11, 22], caption: 'Hi', accounts: 'all', real: false, size: null, out: null, ...o });

  test('a test run renders but uploads and posts nothing', async () => {
    const w = world(); const out = await runPost(A(), w.deps);
    expect(w.rendered).toHaveLength(1); expect(w.rendered[0]).toMatchObject({ seeds: [11, 22], jpeg: true });
    expect(w.uploaded).toEqual([]); expect(w.ig.calls).toEqual([]);
    expect(out.results).toEqual([{ account: 'main', ok: true, test: true }]);
    expect(report(A(), out)).toContain('main: checked (test run)');
  });
  test('a real run uploads, posts a carousel, then deletes the uploads', async () => {
    const w = world(); const out = await runPost(A({ real: true }), w.deps);
    expect(w.uploaded).toHaveLength(2); expect(w.removed.sort()).toEqual([...w.uploaded].sort());
    expect(w.uploaded[0]).toMatch(/^posts\/[a-z0-9-]+\/01\.jpg$/);
    expect(out.results[0]).toMatchObject({ account: 'main', ok: true, link: 'https://www.instagram.com/p/ABC/' });
    expect(w.ig.calls.filter(c => c.path.endsWith('/media') && c.method === 'POST').pop().body).toMatchObject({ media_type: 'CAROUSEL', caption: 'Hi' });
  });
  test('uploads are deleted even when posting fails, and the failure is reported', async () => {
    const w = world({ ig: { failPublish: true } }); const out = await runPost(A({ real: true }), w.deps);
    expect(out.results[0].ok).toBe(false);
    expect(w.removed).toHaveLength(2);
  });
  test('stops before the slow work: bad caption, missing account secret, missing media host settings', async () => {
    let w = world(); await expect(runPost(A({ real: true, caption: 'x'.repeat(2300) }), w.deps)).rejects.toThrow(/main: .*2200/);
    expect(w.rendered).toHaveLength(0);
    w = world(); delete w.deps.env.T; await expect(runPost(A({ real: true }), w.deps)).rejects.toThrow(/missing secrets: T \(for main\)/);
    expect(w.rendered).toHaveLength(0);
    w = world(); w.deps.makeHost = () => { throw new Error('media host: set WB_R2_BUCKET (GitHub secrets)'); };
    await expect(runPost(A({ real: true }), w.deps)).rejects.toThrow(/WB_R2_BUCKET/);
    expect(w.rendered).toHaveLength(0);
    w = world(); delete w.deps.env.T; await expect(runPost(A(), w.deps)).resolves.toBeTruthy();    // a test run needs no secrets
  });
  test('a partial render posts nothing', async () => {
    const w = world({ renderN: 1 });
    await expect(runPost(A({ real: true }), w.deps)).rejects.toThrow(/only 1 of 2 pictures/);
    expect(w.uploaded).toEqual([]); expect(w.ig.calls).toEqual([]);
  });
});

test.describe('test run of the real thing', () => {
  const dist = path.join(ROOT, 'dist', 'wodblok.html');
  test.skip(!fs.existsSync(dist), 'run `npm run build` first');
  test.setTimeout(300000);
  test('two seeds come back as full-size square JPEGs, and nothing is posted', () => {
    const out = tmp('wb-post-real-'), env = { ...process.env };
    for (const k of Object.keys(env)) if (/^(RESEND|WB_)/.test(k)) delete env[k];     // no secrets at all: proves a test run needs none
    const shown = execFileSync('node', ['tools/social/post.js', '--seeds', '1562344001,1562344002', '--caption', 'Test', '--size', '512', '--out', out], { cwd: ROOT, env, timeout: 280000 }).toString();
    expect(shown).toContain('Test run done: 2 picture(s)');
    for (const f of ['01.jpg', '02.jpg']) {
      const b = fs.readFileSync(path.join(out, f));
      expect(b.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
      let i = 2, dims = null;                                   // walk the JPEG markers to the frame header
      while (i < b.length && !dims) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc2) dims = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + len; }
      expect(dims).toEqual([512, 512]);
    }
    fs.rmSync(out, { recursive: true });
  });
});
