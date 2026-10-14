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


test('landing page leads with pattern and print design and prioritizes the waitlist', async () => {
  const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  assert.match(html, /<title>Wodblok — Pattern &amp; Print Design for Artists<\/title>/);
  assert.match(html, /Make a mark\. <em>Build a pattern\.<\/em>/);
  assert.match(html, /href="#waitlist">Get early access/);
  assert.match(html, /From a single mark to a world of pattern\./);
  assert.match(html, /01 \/ MOTIF[\s\S]*02 \/ REPEAT[\s\S]*03 \/ MAKE/);
  assert.match(html, /Linocut or block printing/);
  assert.match(html, /Stamp design/);
  assert.match(html, /https:\/\/wodblok\.com\/img\/gallery\/image-10\.webp/);
  assert.match(html, /class="pillars"[^]*?grid-template-columns:minmax\(0,1fr\)/);
});
