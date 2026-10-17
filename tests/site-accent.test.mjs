// The website uses the accent colour picked in the app. site/accent.js carries the app's own colour maths, unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = await readFile(new URL('../src/modules/55-settings.js', import.meta.url), 'utf8');
const site = await readFile(new URL('../site/accent.js', import.meta.url), 'utf8');

const appBlock = app.slice(app.indexOf('const stHEX6='), app.indexOf('const stRule='));
const siteBlock = site.slice(site.indexOf('// ---- begin shared accent maths ----\n') + '// ---- begin shared accent maths ----\n'.length, site.indexOf('// ---- end shared accent maths ----'));

test('the site carries the app colour maths unchanged', () => {
  assert.ok(appBlock.includes('function accentVars'));
  assert.equal(siteBlock, appBlock);
});

const PRESETS = {Rosewood: '#a85a52', Walnut: '#744f3b', Eucalyptus: '#72977f', Ironwood: '#5f7f9a', Purpleheart: '#86629a', Maple: '#c48a96', Birch: '#a3a09a'};

function run(cookie, { host = 'wodblok.test', proto = 'https:' } = {}) {
  const styles = [];
  const document = {
    cookie,
    writes: [],
    head: { appendChild: n => { n.parentNode = document.head; n.removeFromHead = () => styles.splice(styles.indexOf(n), 1); styles.push(n); }, removeChild: n => n.removeFromHead() },
    getElementById: id => styles.find(n => n.id === id) || null,
    createElement: () => ({}),
  };
  Object.defineProperty(document, 'cookie', { get: () => cookie, set: v => { document.writes.push(v); const m = /^wb_accent=([^;]*)/.exec(v); cookie = m && m[1] && !/Max-Age=0/.test(v) ? 'wb_accent=' + m[1] : ''; } });
  const window = {};
  vm.runInNewContext(site, { document, window, location: { hostname: host, protocol: proto } });
  styles.window = window; styles.document = document;
  return styles;
}

test('a wb_accent cookie sets the four accent tokens for both themes', () => {
  for (const [name, hex] of Object.entries(PRESETS)) {
    const [el] = run('a=1; wb_accent=' + hex.slice(1) + '; b=2');
    assert.equal(el.id, 'accstyle', name);
    const vars = vm.runInNewContext(appBlock + ';accentVars("' + hex + '")');
    for (const t of ['light', 'dark']) assert.ok(el.textContent.includes('--acc:' + vars[t].acc + ';--acc-ink:' + vars[t].ink + ';--acc-fg:' + vars[t].fg + ';--acc-soft:' + vars[t].soft), name + ' ' + t);
    assert.match(el.textContent, /prefers-color-scheme:light/);
    assert.match(el.textContent, /\[data-theme="light"\]/);
    assert.match(el.textContent, /\[data-theme="dark"\]/);
  }
});

test('no cookie, or a cookie that is not six hex digits, changes nothing', () => {
  assert.equal(run('').length, 0);
  assert.equal(run('theme=dark').length, 0);
  assert.equal(run('wb_accent=').length, 0);
  assert.equal(run('wb_accent=zzzzzz').length, 0);
  assert.equal(run('wb_accent=a85a52ff').length, 0);
  assert.equal(run('xwb_accent=a85a52').length, 0);
});

test('sync: the colour saved with the account sets the cookie for the domain and recolours the page; Oak clears both', () => {
  const styles = run('');
  assert.equal(styles.length, 0);
  styles.window.WBAccent.sync('#86629A');
  assert.equal(styles.length, 1);
  const vars = vm.runInNewContext(appBlock + ';accentVars("#86629a")');
  assert.ok(styles[0].textContent.includes('--acc:' + vars.dark.acc));
  assert.match(styles.document.writes[0], /^wb_accent=86629a; Domain=\.wodblok\.test; Path=\/; Max-Age=31536000; SameSite=Lax; Secure$/);
  styles.window.WBAccent.sync('#a85a52');
  assert.equal(styles.length, 1);   // the same style element is reused
  styles.window.WBAccent.sync('');
  assert.equal(styles.length, 0);
  assert.match(styles.document.writes.at(-1), /^wb_accent=; Domain=\.wodblok\.test; Path=\/; Max-Age=0/);
});

test('sync: nothing is written when the cookie already matches; a bad value and an address with no domain are handled', () => {
  const styles = run('wb_accent=86629a');
  assert.equal(styles.length, 1);
  styles.window.WBAccent.sync('#86629a');
  assert.deepEqual(styles.document.writes, []);
  styles.window.WBAccent.sync('purple');
  assert.deepEqual(styles.document.writes, []);
  assert.equal(styles.length, 1);
  const local = run('', { host: 'localhost', proto: 'http:' });
  local.window.WBAccent.sync('#86629a');
  assert.equal(local.document.writes[0], 'wb_accent=86629a; Path=/; Max-Age=31536000; SameSite=Lax');   // no Domain on localhost, no Secure on http
});
