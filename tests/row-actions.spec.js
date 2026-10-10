// Row buttons are never reachable by hover alone: the selected row shows them, and so does keyboard focus (UX review D16, C14).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('History: every row shows its Compare button without hovering', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#rzbar');
  await settle(page);
  await openPanel(page, 'hist');
  await page.click('#rzbar');
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
