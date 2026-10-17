import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
const privacy = await readFile(new URL('../site/privacy.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../site/sitemap.xml', import.meta.url), 'utf8');
const visible = s => s.replace(/<(style|script)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('the page says what Wodblok is in plain words', () => {
  assert.match(html, /<title>Wodblok — Stamped-Pattern Editor<\/title>/);
  assert.match(html, /<h1><span class="nb">Stamped-pattern<\/span> <em>editor<\/em><\/h1>/);
  assert.match(html, /Place stamps on a canvas to make repeating patterns\./);
});

test('the copy that was cut stays out', () => {
  const text = visible(html);
  for (const gone of ['Make a mark', 'pattern-minded', 'Selected work', 'From a single mark', 'Pattern studies', 'Made with Wodblok', 'canvas for what comes next', 'Open the studio', 'Testing spots']) {
    assert.ok(!text.includes(gone), gone);
  }
});

test('one way in: the hero button is the account button, and the waitlist form is gone', () => {
  assert.match(html, /id="hero-cta" href="https:\/\/app\.wodblok\.com">Open Wodblok</);
  assert.doesNotMatch(html, /id="join-form"|id="waitlist"|\/api\/waitlist/);
  assert.equal((html.match(/Open Wodblok/g) || []).length, 2);   // the header button and the hero button; account.js swaps them for Create account
});

test('there is a place for the product video, empty until the file exists', () => {
  assert.match(html, /<video id="timelapse" muted loop playsinline[^>]*hidden>/);
  assert.match(html, /\/video\/timelapse\.mp4/);
  assert.match(html, /id="video"/);
});

test('privacy page exists, is linked from the footer and listed in the sitemap', () => {
  assert.match(html, /<footer>[\s\S]*href="\/privacy\.html"[\s\S]*data-contact-link/);
  assert.match(sitemap, /https:\/\/wodblok\.com\/privacy\.html/);
  assert.match(privacy, /<title>Privacy — Wodblok<\/title>/);
  assert.match(privacy, /Projects and files stay on your device/);
});

test('the accent script loads before the page paints', () => {
  assert.match(html, /<\/style>\s*<script src="\/accent\.js"><\/script>/);
});

test('the link preview picture is still there', () => {
  assert.match(html, /og:image" content="https:\/\/wodblok\.com\/img\/gallery\/image-10\.webp"/);
});

test('the contact email lives in one script that both pages load', async () => {
  const contact = await readFile(new URL('../site/contact.js', import.meta.url), 'utf8');
  assert.match(contact, /CONTACT_EMAIL = "[^"]+@[^"]+"/);
  for (const page of [html, privacy]) { assert.match(page, /<script src="\/contact\.js"><\/script>/); assert.doesNotMatch(page, /@gmail/); }
});
