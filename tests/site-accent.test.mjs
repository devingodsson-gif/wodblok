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

function run(cookie) {
  const styles = [];
  const document = {
    cookie,
    head: { appendChild: n => styles.push(n) },
    createElement: () => ({}),
  };
  vm.runInNewContext(site, { document });
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
