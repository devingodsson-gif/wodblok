// Run with: npm run test:site (plain Node 22, no browser). The database is a real SQLite (D1 is SQLite), the keys are made here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto as crypto } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import { verifyToken, getSession } from '../server/accounts/clerk.js';
import { ensureSchema, resetSchemaFlag } from '../server/accounts/db.js';
import { bytesToB64u, textToB64u, b64uToText, b64uToBytes } from '../server/accounts/util.js';
import { onRequest as gate } from '../functions/_middleware.js';
import { onRequestGet as me } from '../functions/api/me.js';
import { onRequestPost as usage } from '../functions/api/usage.js';
import { onRequestPost as feedback } from '../functions/api/feedback.js';
import { onRequestPost as webhook } from '../functions/api/webhooks/clerk.js';

const ISS = 'https://clerk.example.test';
const rsa = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
const pair = await crypto.subtle.generateKey({ ...rsa, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, true, ['sign', 'verify']);
const other = await crypto.subtle.generateKey({ ...rsa, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, true, ['sign', 'verify']);
const pem = async (k) => {
  const der = new Uint8Array(await crypto.subtle.exportKey('spki', k));
  return '-----BEGIN PUBLIC KEY-----\n' + Buffer.from(der).toString('base64').match(/.{1,64}/g).join('\n') + '\n-----END PUBLIC KEY-----';
};
const PEM = await pem(pair.publicKey);
const ecPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const PASS_JWK = JSON.stringify(await crypto.subtle.exportKey('jwk', ecPair.privateKey));
const WH_SECRET = 'whsec_' + Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('base64');

async function token(claims = {}, { key = pair.privateKey, alg = 'RS256', kid = 'k1' } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const head = textToB64u(JSON.stringify({ alg, typ: 'JWT', kid }));
  const body = textToB64u(JSON.stringify({ iss: ISS, sub: 'user_1', iat: now, nbf: now - 5, exp: now + 60, fn: 'Ana', em: 'ana@example.com', type: 'early_access', ...claims }));
  const sig = new Uint8Array(await crypto.subtle.sign(rsa, key, new TextEncoder().encode(head + '.' + body)));
  return head + '.' + body + '.' + bytesToB64u(sig);
}

function fakeDB() {
  const db = new DatabaseSync(':memory:');
  const stmt = (sql) => ({
    args: [],
    bind(...a) { this.args = a; return this; },
    async run() { const r = db.prepare(sql).run(...this.args); return { success: true, meta: { changes: Number(r.changes) } }; },
    async first() { return db.prepare(sql).get(...this.args) ?? null; },
  });
  return { raw: db, prepare: stmt, async batch(list) { for (const s of list) await s.run(); return []; } };
}

// replaces fetch for Resend (and the key list) and records what was sent
function mockFetch({ mailOk = true, jwks } = {}) {
  const real = globalThis.fetch;
  const mail = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://api.resend.com/')) {
      if (mailOk) mail.push(JSON.parse(init.body));
      return new Response(mailOk ? '{}' : 'nope', { status: mailOk ? 200 : 500 });
    }
    if (jwks && String(url).endsWith('/.well-known/jwks.json')) return new Response(JSON.stringify({ keys: jwks }), { status: 200 });
    throw new Error('unexpected fetch ' + url);
  };
  return { mail, restore: () => (globalThis.fetch = real) };
}

const baseEnv = (extra = {}) => ({ CLERK_ISSUER: ISS, CLERK_JWT_KEY: PEM, PASS_PRIVATE_JWK: PASS_JWK, NOTIFY_TO: 'owner@example.test', RESEND_API_KEY: 're_test', ...extra });
const withDb = (extra) => { resetSchemaFlag(); return baseEnv({ DB: fakeDB(), ...extra }); };
const req = async (path, { method = 'GET', body, claims, bearer, headers = {} } = {}) =>
  new Request('https://app.example.test' + path, {
    method,
    headers: { ...(bearer === false ? {} : { authorization: 'Bearer ' + (bearer || (await token(claims))) }), 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
const today = () => new Date().toISOString().slice(0, 10);

// ---------- token checks ----------
test('a good token is accepted; wrong key, expiry, issuer, party and algorithm are not', async () => {
  const env = baseEnv({ CLERK_AUTHORIZED_PARTIES: 'https://wodblok.com' });
  assert.ok(await verifyToken(await token({ azp: 'https://wodblok.com' }), env));
  assert.equal(await verifyToken(await token({}, { key: other.privateKey }), env), null);
  assert.equal(await verifyToken(await token({ exp: Math.floor(Date.now() / 1000) - 60 }), env), null);
  assert.equal(await verifyToken(await token({ iss: 'https://evil.example' }), env), null);
  assert.equal(await verifyToken(await token({ azp: 'https://evil.example' }), env), null);
  assert.equal(await verifyToken(await token({ nbf: Math.floor(Date.now() / 1000) + 600 }), env), null);
  const none = textToB64u('{"alg":"none"}') + '.' + textToB64u('{"iss":"' + ISS + '","sub":"u","exp":9999999999}') + '.';
  assert.equal(await verifyToken(none, env), null);
  assert.equal(await verifyToken('not.a.token', env), null);
  assert.equal(await verifyToken(await token(), { ...env, CLERK_ISSUER: '' }), null);
});

test('keys can also come from the issuer key list', async () => {
  const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'k1' };
  const f = mockFetch({ jwks: [jwk] });
  try {
    const env = { CLERK_ISSUER: ISS };
    assert.ok(await verifyToken(await token(), env));
    assert.equal(await verifyToken(await token({}, { key: other.privateKey }), env), null);
  } finally {
    f.restore();
  }
});

test('session type: unknown or missing means waitlist; the token can come from the cookie', async () => {
  const env = baseEnv();
  const c = await token({ type: '' });
  const s = await getSession(new Request('https://x.test/', { headers: { cookie: 'a=1; __session=' + encodeURIComponent(c) } }), env);
  assert.equal(s.type, 'waitlist');
  assert.equal(s.firstName, 'Ana');
  assert.equal((await getSession(await req('/', { claims: { type: 'none' } }), env)).type, 'none');
  assert.equal((await getSession(await req('/', { claims: { type: 'Tester' } }), env)).type, 'tester');
  assert.equal(await getSession(new Request('https://x.test/'), env), null);
});

// ---------- /api/me ----------
test('/api/me: 401 signed out; approved accounts get a pass that checks out and lasts 7 days', async () => {
  const env = baseEnv();
  assert.equal((await me({ request: await req('/api/me', { bearer: false }), env })).status, 401);

  const wl = await (await me({ request: await req('/api/me', { claims: { type: '' } }), env })).json();
  assert.deepEqual([wl.approved, wl.pass, wl.type], [false, null, 'waitlist']);

  const r = await (await me({ request: await req('/api/me'), env })).json();
  assert.equal(r.firstName, 'Ana');
  assert.equal(r.approved, true);
  const [head, sig] = r.pass.split('.');
  const pub = await crypto.subtle.importKey('jwk', await crypto.subtle.exportKey('jwk', ecPair.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, b64uToBytes(sig), new TextEncoder().encode(head)));
  const p = JSON.parse(b64uToText(head));
  assert.equal(p.exp - p.iat, 7 * 24 * 3600);
  assert.equal(p.sub, 'user_1');
  assert.equal(p.type, 'early_access');

  const noKey = await (await me({ request: await req('/api/me'), env: baseEnv({ PASS_PRIVATE_JWK: '' }) })).json();
  assert.equal(noKey.pass, null);
});

// ---------- /api/usage ----------
test('usage: only tracked types are stored; the larger total wins; bad input is refused', async () => {
  const env = withDb();
  await ensureSchema(env);
  const post = async (body, o = {}) => usage({ request: await req('/api/usage', { method: 'POST', body, ...o }), env });
  const rows = () => env.DB.raw.prepare('SELECT user_id, day, active_seconds, sessions, app_version FROM usage_daily').all();

  assert.equal((await post({ day: today(), seconds: 60, sessions: 1 }, { bearer: false })).status, 401);
  assert.equal((await post({ day: today(), seconds: 60, sessions: 1 }, { claims: { type: '' } })).status, 403);
  assert.equal((await (await post({ day: today(), seconds: 60, sessions: 1 }, { claims: { type: 'subscriber' } })).json()).stored, false);
  assert.equal(rows().length, 0);

  assert.equal((await post({ day: today(), seconds: 600, sessions: 2, version: '1.20.0', browser: 'Chrome' })).status, 200);
  await post({ day: today(), seconds: 300, sessions: 1, version: '1.20.0', browser: 'Chrome' }); // an older retry arrives late
  assert.deepEqual({ ...rows()[0] }, { user_id: 'user_1', day: today(), active_seconds: 600, sessions: 2, app_version: '1.20.0' });
  await post({ day: today(), seconds: 900, sessions: 3, version: '1.20.0', browser: 'Chrome' });
  assert.equal(rows().length, 1);
  assert.equal(rows()[0].active_seconds, 900);

  for (const bad of [{ day: 'today', seconds: 1, sessions: 1 }, { day: today(), seconds: 86401, sessions: 1 }, { day: today(), seconds: -1, sessions: 1 }, { day: '2020-01-01', seconds: 1, sessions: 1 }, { day: '2099-01-01', seconds: 1, sessions: 1 }]) {
    assert.equal((await post(bad)).status, 400, JSON.stringify(bad));
  }
  const cross = await usage({ request: await req('/api/usage', { method: 'POST', body: { day: today(), seconds: 1, sessions: 1 }, headers: { origin: 'https://evil.example' } }), env });
  assert.equal(cross.status, 403);
  assert.equal((await usage({ request: await req('/api/usage', { method: 'POST', body: { day: today(), seconds: 1, sessions: 1 } }), env: baseEnv() })).status, 503);
});

// ---------- /api/feedback ----------
test('feedback: stored and emailed once; the same key twice does nothing more', async () => {
  const f = mockFetch();
  try {
    const env = withDb();
    const post = async (body, o = {}) => feedback({ request: await req('/api/feedback', { method: 'POST', body, ...o }), env });
    const body = { key: 'abcdefgh12345', category: 'bug', message: 'The undo button does nothing.\nSecond line.', version: '1.20.0', browser: 'Safari' };

    assert.equal((await post(body, { bearer: false })).status, 401);
    assert.equal((await post(body, { claims: { type: '' } })).status, 403);
    assert.equal((await post({ ...body, message: '   ' })).status, 400);
    assert.equal((await post({ ...body, key: 'x' })).status, 400);

    assert.equal((await post(body)).status, 200);
    assert.equal((await post(body)).status, 200);
    assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM feedback').get().n, 1);
    assert.equal(f.mail.length, 1);
    assert.match(f.mail[0].subject, /feedback \(bug\)/);
    assert.deepEqual(f.mail[0].to, ['owner@example.test']);
    assert.equal(f.mail[0].reply_to, 'ana@example.com');
    assert.match(f.mail[0].text, /Safari/);
    assert.equal(env.DB.raw.prepare('SELECT category, status FROM feedback').get().status, 'new');

    assert.equal((await post({ ...body, key: 'zzzzzzzz2', category: 'nonsense' })).status, 200);
    assert.equal(env.DB.raw.prepare("SELECT category FROM feedback WHERE idem = 'zzzzzzzz2'").get().category, 'other');
  } finally {
    f.restore();
  }
});

test('feedback: a failed email still keeps the message; 30 a day is the limit', async () => {
  const f = mockFetch({ mailOk: false });
  try {
    const env = withDb();
    const post = async (n) => feedback({ request: await req('/api/feedback', { method: 'POST', body: { key: 'key-number-' + n, category: 'idea', message: 'idea ' + n } }), env });
    assert.equal((await post(0)).status, 200);
    assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM feedback').get().n, 1);
    for (let i = 1; i < 30; i++) assert.equal((await post(i)).status, 200);
    assert.equal((await post(30)).status, 429);
  } finally {
    f.restore();
  }
});

// ---------- Clerk webhook ----------
async function hook(env, type, data, { secret = WH_SECRET, ts = Math.floor(Date.now() / 1000), id = 'msg_' + Math.random() } = {}) {
  const raw = JSON.stringify({ type, data });
  const key = await crypto.subtle.importKey('raw', Buffer.from(secret.replace(/^whsec_/, ''), 'base64'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${raw}`))).toString('base64');
  return webhook({
    request: new Request('https://app.example.test/api/webhooks/clerk', { method: 'POST', body: raw, headers: { 'svix-id': id, 'svix-timestamp': String(ts), 'svix-signature': 'v1,' + mac } }),
    env: { CLERK_WEBHOOK_SECRET: WH_SECRET, ...env },
  });
}
const user = (extra = {}) => ({ id: 'user_9', first_name: 'Bo', primary_email_address_id: 'e1', email_addresses: [{ id: 'e1', email_address: 'Bo@Example.com' }], public_metadata: {}, ...extra });

test('webhook: bad signatures, old timestamps and wrong secrets are refused', async () => {
  const env = withDb();
  assert.equal((await hook(env, 'user.created', user(), { secret: 'whsec_' + Buffer.from('another secret value!!').toString('base64') })).status, 400);
  assert.equal((await hook(env, 'user.created', user(), { ts: Math.floor(Date.now() / 1000) - 3600 })).status, 400);
  const plain = await webhook({ request: new Request('https://x.test/api/webhooks/clerk', { method: 'POST', body: '{}' }), env: { ...env, CLERK_WEBHOOK_SECRET: WH_SECRET } });
  assert.equal(plain.status, 400);
});

test('webhook: a new account emails the owner, with any waitlist answers', async () => {
  const f = mockFetch();
  try {
    const env = withDb();
    await env.DB.prepare('CREATE TABLE waitlist (email TEXT, role TEXT, heard TEXT, why TEXT)').run();
    await env.DB.prepare('INSERT INTO waitlist VALUES (?1, ?2, ?3, ?4)').bind('bo@example.com', 'Screen printing', 'Etsy', 'Tote bags').run();
    assert.equal((await hook(env, 'user.created', user())).status, 200);
    assert.equal(f.mail.length, 1);
    assert.deepEqual(f.mail[0].to, ['owner@example.test']);
    assert.match(f.mail[0].text, /Screen printing/);
    assert.match(f.mail[0].text, /bo@example\.com/);
  } finally {
    f.restore();
  }
});

test('webhook: "You\'re in" goes out once, when the type first becomes approved', async () => {
  const f = mockFetch();
  try {
    const env = withDb();
    await hook(env, 'user.updated', user({ public_metadata: {} }));
    await hook(env, 'user.updated', user({ public_metadata: { type: 'none' } }));
    assert.equal(f.mail.length, 0);

    assert.equal((await hook(env, 'user.updated', user({ public_metadata: { type: 'early_access' } }))).status, 200);
    assert.equal(f.mail.length, 1);
    assert.deepEqual(f.mail[0].to, ['bo@example.com']);
    assert.match(f.mail[0].subject, /You.re in/);
    assert.match(f.mail[0].text, /Hi Bo,/);
    assert.match(f.mail[0].text, /https:\/\/app\.wodblok\.com/);

    await hook(env, 'user.updated', user({ public_metadata: { type: 'early_access' } })); // duplicate event
    await hook(env, 'user.updated', user({ public_metadata: { type: 'tester' } })); // changed type
    assert.equal(f.mail.length, 1);
    const row = env.DB.raw.prepare('SELECT type, notified_at FROM approvals').get();
    assert.equal(row.type, 'tester');
    assert.ok(row.notified_at);
  } finally {
    f.restore();
  }
});

test('webhook: if the email fails the event is retried and then sends', async () => {
  const env = withDb();
  let f = mockFetch({ mailOk: false });
  try {
    assert.equal((await hook(env, 'user.updated', user({ public_metadata: { type: 'tester' } }))).status, 500);
    assert.equal(env.DB.raw.prepare('SELECT notified_at FROM approvals').get().notified_at, null);
  } finally {
    f.restore();
  }
  f = mockFetch();
  try {
    assert.equal((await hook(env, 'user.updated', user({ public_metadata: { type: 'tester' } }))).status, 200);
    assert.equal(f.mail.length, 1);
  } finally {
    f.restore();
  }
});

test('webhook: deleting an account removes its usage, feedback and approval rows and nobody else\'s', async () => {
  const env = withDb();
  const f = mockFetch();
  try {
    await hook(env, 'user.updated', user({ public_metadata: { type: 'tester' } }));
    const db = env.DB.raw;
    db.prepare("INSERT INTO usage_daily VALUES ('user_9', '2026-10-01', 5, 1, 'v', 'b', 'now'), ('user_2', '2026-10-01', 5, 1, 'v', 'b', 'now')").run();
    db.prepare("INSERT INTO feedback (user_id, created_at, category, message, idem) VALUES ('user_9', 'now', 'bug', 'm', 'k1'), ('user_2', 'now', 'bug', 'm', 'k1')").run();
    assert.equal((await hook(env, 'user.deleted', { id: 'user_9', deleted: true })).status, 200);
    for (const t of ['usage_daily', 'feedback', 'approvals']) assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE user_id = 'user_9'`).get().n, 0, t);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM usage_daily WHERE user_id = 'user_2'").get().n, 1);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM feedback WHERE user_id = 'user_2'").get().n, 1);
  } finally {
    f.restore();
  }
});

// ---------- the gate ----------
const gateCall = async (url, env, o = {}) => {
  let passed = false;
  const request = new Request(url, { headers: { accept: 'text/html', ...(o.headers || {}), ...(o.claims !== undefined || o.bearer ? { authorization: 'Bearer ' + (o.bearer || (await token(o.claims))) } : {}) } });
  const res = await gate({ request, env, next: async () => ((passed = true), new Response('the app')) });
  return { res, passed };
};

test('gate: off unless GATE_HOSTS is set, and only for the listed hosts; /api always passes', async () => {
  assert.equal((await gateCall('https://app.wodblok.com/', baseEnv())).passed, true);
  const env = baseEnv({ GATE_HOSTS: 'app.wodblok.com, *.pages.dev' });
  assert.equal((await gateCall('https://wodblok.com/', env)).passed, true);
  assert.equal((await gateCall('https://app.wodblok.com/api/me', env)).passed, true);
  assert.equal((await gateCall('https://app.wodblok.com/', env)).passed, false);
  assert.equal((await gateCall('https://feat-x.wodblok.pages.dev/', env)).passed, false);
});

test('gate: signed out is sent to sign in; files other than pages get 401', async () => {
  const env = baseEnv({ GATE_HOSTS: 'app.wodblok.com' });
  const page = await gateCall('https://app.wodblok.com/', env);
  assert.equal(page.res.status, 302);
  assert.equal(page.res.headers.get('location'), 'https://wodblok.com/?signin=1');
  assert.equal(page.res.headers.get('cache-control'), 'no-store');
  const sw = await gateCall('https://app.wodblok.com/sw.js', env, { headers: { accept: '*/*' } });
  assert.equal(sw.res.status, 401);
  const custom = await gateCall('https://app.wodblok.com/', { ...env, SITE_URL: 'https://site.example.test/' });
  assert.equal(custom.res.headers.get('location'), 'https://site.example.test/?signin=1');
});

test('gate: approved accounts get the app; others get the "on the list" page with their name escaped', async () => {
  const env = baseEnv({ GATE_HOSTS: 'app.wodblok.com' });
  for (const type of ['early_access', 'tester', 'subscriber']) assert.equal((await gateCall('https://app.wodblok.com/', env, { claims: { type } })).passed, true, type);
  const wl = await gateCall('https://app.wodblok.com/', env, { claims: { type: '', fn: '<b>Ana</b>' } });
  assert.equal(wl.passed, false);
  assert.equal(wl.res.status, 403);
  const html = await wl.res.text();
  assert.match(html, /on the list/);
  assert.ok(!html.includes('<b>Ana</b>'));
  assert.match(html, /&lt;b&gt;Ana&lt;\/b&gt;/);
  assert.equal((await gateCall('https://app.wodblok.com/', env, { claims: { type: 'none' } })).passed, false);
  assert.equal((await gateCall('https://app.wodblok.com/', env, { bearer: await token({}, { key: other.privateKey }) })).res.status, 302);
});
