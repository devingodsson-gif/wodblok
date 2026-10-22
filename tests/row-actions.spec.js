// Row buttons are never reachable by hover alone: the selected row shows them, and so does keyboard focus (UX review D16, C14).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

test('History: every row shows its Compare button without hovering', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#rzdo');
  await settle(page);
  await openPanel(page, 'hist');
  await page.click('#rzdo');
  await settle(page);
  const row = page.locator('#hhl .hr:not(.on)').first();
  await expect(row).toBeVisible();
  await page.mouse.move(5, 5);
  const btns = row.locator('button');
  expect(await btns.count()).toBeGreaterThan(0);
  await expect(btns.first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('no row control is revealed by :hover alone', async () => {
  const fs = require('fs'), path = require('path');
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8');
  for (const sel of ['.hr', '.mlist .mr', '.txl .mr', '.lib>div']) {
    const esc = sel.replace(/[.>]/g, '\\$&');
    const hov = new RegExp(esc + ':hover[^{,]*\\{[^}]*(visibility:visible|display:block)', 'g');
    expect(css.match(hov) || [], sel + ' has a hover-only reveal').toHaveLength(0);
  }
});

test('every rule that reveals something on :hover has a keyboard or selected-row twin (no hover-only reveal is left)', async () => {
  const fs = require('fs'), path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'), css = html.slice(html.indexOf('<style'), html.indexOf('</style>'));
  const lone = [];
  for (const m of css.matchAll(/([^{}]*:hover[ >+~][^{]*)\{([^}]*(?:visibility:visible|opacity:1\b|display:block)[^}]*)\}/g)) {
    for (const part of m[1].split(',').map(s => s.trim().split('\n').pop().trim()).filter(s => /:hover[ >+~]/.test(s))) {
      const twin = [part.replace(':hover', ':focus-visible'), part.replace(':hover', ':focus-within'), part.replace(':hover', '.on')];
      const sel = part.replace(/:hover/g, '');
      const has = twin.some(t => css.includes(t)) || css.includes(sel.replace(/\s.*$/, '') + '.on') || css.includes(':focus-within') && css.includes(sel.split(' ')[0] + ':focus-within');
      if (!has) lone.push(part);
    }
  }
  expect(lone, 'hover-only reveals: ' + lone.join(' | ')).toEqual([]);
});
