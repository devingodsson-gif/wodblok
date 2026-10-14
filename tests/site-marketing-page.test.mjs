import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');

test('marketing page clearly positions Wodblok for pattern and print makers', () => {
  assert.match(html, /<title>Wodblok — Pattern &amp; Print Design for Artists<\/title>/);
  assert.match(html, /<h1>Make a mark\. <em>Build a pattern\.<\/em><\/h1>/);
  assert.match(html, /printmakers, stamp artists, and surface-pattern designers/);
});

test('early access is the primary hero action and points to the waitlist', () => {
  assert.match(html, /class="btn" href="#waitlist">Get early access/);
  assert.match(html, /id="waitlist"/);
});

test('waitlist keeps the API contract and essential signup fields', () => {
  assert.match(html, /id="join-form" method="post" action="\/api\/waitlist"/);
  assert.match(html, /id="f-email" name="email" type="email"[^>]*required/);
  assert.match(html, /id="f-role" name="role" required/);
  assert.match(html, /id="f-heard" name="heard" type="hidden"/);
  assert.match(html, /id="f-testing" name="early_access" type="checkbox"/);
});

test('source attribution is captured without an extra visible referral question', () => {
  assert.match(html, /params\.get\('utm_source'\)/);
  assert.match(html, /document\.referrer/);
  assert.doesNotMatch(html, /How did you hear about Wodblok\?/);
  assert.doesNotMatch(html, /id="f-why"/);
  assert.doesNotMatch(html, /other\(document\.getElementById\('f-heard'\),document\.getElementById\('f-heard-other'\)\)/);
});
