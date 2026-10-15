// Run with: npm run test:site (plain Node, no browser, no database: D1 is replaced by a small fake).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequestPost } from '../functions/api/waitlist.js';

function fakeDB() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      return {
        bind: (...a) => ({
          run: async () => {
            const [email, role, heard, why, now] = a;
            const old = rows.get(email);
            rows.set(email, { email, role, heard, why, created_at: old ? old.created_at : now, updated_at: now });
          },
        }),
        run: async () => {},
      };
    },
  };
}
const post = (body, env, headers = {}) =>
  onRequestPost({
    request: new Request('https://wodblok.com/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
    env,
  });

test('stores a sign-up with its answers', async () => {
  const DB = fakeDB();
  const r = await post({ email: ' Ana@Example.com ', role: 'Screen printing', heard: 'Etsy', why: 'Prints for tote bags' }, { DB });
  assert.equal(r.status, 200);
  assert.deepEqual(DB.rows.get('ana@example.com').role, 'Screen printing');
  assert.equal(DB.rows.get('ana@example.com').heard, 'Etsy');
});

test('"other" uses the typed text', async () => {
  const DB = fakeDB();
  await post({ email: 'a@b.co', role: 'other', role_other: 'Ceramics', heard: 'other', heard_other: 'A podcast' }, { DB });
  const row = DB.rows.get('a@b.co');
  assert.equal(row.role, 'Other: Ceramics');
  assert.equal(row.heard, 'Other: A podcast');
});

test('the same email updates one row', async () => {
  const DB = fakeDB();
  await post({ email: 'a@b.co', role: 'Pattern design' }, { DB });
  await post({ email: 'A@B.co', role: 'Hobby or making' }, { DB });
  assert.equal(DB.rows.size, 1);
  assert.equal(DB.rows.get('a@b.co').role, 'Hobby or making');
});

test('rejects bad email, missing use, other sites and a missing database', async () => {
  const DB = fakeDB();
  assert.equal((await post({ email: 'nope', role: 'Screen printing' }, { DB })).status, 400);
  assert.equal((await post({ email: 'a@b.co' }, { DB })).status, 400);
  assert.equal((await post({ email: 'a@b.co', role: 'x' }, { DB }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await post({ email: 'a@b.co', role: 'x' }, {})).status, 503);
  assert.equal(DB.rows.size, 0);
});

test('the hidden field is ignored quietly', async () => {
  const DB = fakeDB();
  const r = await post({ email: 'bot@b.co', role: 'x', company: 'Acme' }, { DB });
  assert.equal(r.status, 200);
  assert.equal(DB.rows.size, 0);
});



test('sends a Resend notification after saving a signup', async () => {
  const DB = fakeDB();
  const originalFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (url, options) => {
    sent = { url, options };
    return new Response(JSON.stringify({ id: 'email_test_123' }), { status: 200 });
  };
  try {
    const r = await post(
      { email: 'new@example.com', role: 'Pattern design', heard: 'Instagram', why: 'I want to make fabric prints' },
      { DB, RESEND_API_KEY: 'test-resend-key' },
    );
    assert.equal(r.status, 200);
    assert.equal(DB.rows.has('new@example.com'), true);
    assert.equal(sent.url, 'https://api.resend.com/emails');
    assert.equal(sent.options.headers.authorization, 'Bearer test-resend-key');
    const message = JSON.parse(sent.options.body);
    assert.deepEqual(message.to, ['devingodsson@gmail.com']);
    assert.equal(message.from, 'Wodblok Notifications <notification@wodblok.com>');
    assert.equal(message.subject, 'New Wodblok Early Access Signup');
    assert.match(message.text, /new@example.com/);
    assert.match(message.text, /Pattern design/);
    assert.match(message.text, /Instagram/);
    assert.match(message.text, /I want to make fabric prints/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('email delivery failure does not fail or discard a saved signup', async () => {
  const DB = fakeDB();
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  globalThis.fetch = async () => new Response('provider unavailable', { status: 503 });
  console.error = () => {};
  try {
    const r = await post(
      { email: 'saved@example.com', role: 'Screen printing' },
      { DB, RESEND_API_KEY: 'test-resend-key' },
    );
    assert.equal(r.status, 200);
    assert.equal(DB.rows.has('saved@example.com'), true);
    assert.deepEqual(await r.json(), { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

test('landing page leads with pattern and print design and prioritizes the waitlist', async () => {
  const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  assert.match(html, /<title>Wodblok — Pattern &amp; Print Design for Artists<\/title>/);
  assert.match(html, /Make a mark\. <em>Build a pattern\.<\/em>/);
  assert.match(html, /href="#waitlist">Get early access/);
  assert.match(html, /From a single mark to a world of pattern\./);
  assert.doesNotMatch(html, /A focused creative workspace|01 \/ MOTIF|02 \/ REPEAT|03 \/ MAKE/);
  assert.match(html, /Linocut or block printing/);
  assert.match(html, /Stamp design/);
  assert.match(html, /https:\/\/wodblok\.com\/img\/gallery\/image-10\.webp/);
  assert.match(html, /\.pillars\s*\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
});
