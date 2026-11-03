// 2.87.4 (docs/pro-basics-plan.md step 4): Help is an undocked panel. It opens floating in the middle of the window the first time, like Export; every Help
// menu item opens it at its page; search finds a topic; it fits a phone.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const pane = page => page.locator('section.pn[data-p="help"]');
const title = page => page.locator('#hlpb .hlph');
const run = (page, id) => page.evaluate(id => window.__wbTest.commands.run(id), id);

test('every Help menu item opens the Help panel at its page, floating in the middle the first time', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await page.locator('.mnbb', { hasText: 'Help' }).click();
  const items = await page.locator('.mnbm [data-cmd]').evaluateAll(es => es.map(e => e.dataset.cmd));
  expect(items).toEqual(expect.arrayContaining(['help.start', 'help.manual', 'help.shortcuts', 'help.whatsNew', 'help.about']));
  await page.locator('.mnbm [data-cmd="help.start"]').click(); await H.settle(page);
  await expect(pane(page)).toBeVisible(); await expect(title(page)).toHaveText('Getting started');
  // floating, in the middle
  const b = await pane(page).evaluate(e => { const g = e.closest('.wg'), r = g.getBoundingClientRect(); return { fl: g.classList.contains('fl'), c: r.left + r.width / 2, w: innerWidth }; });
  expect(b.fl).toBe(true); expect(Math.abs(b.c - b.w / 2)).toBeLessThan(4);
  for (const [id, t] of [['help.shortcuts', 'Keyboard shortcuts'], ['help.whatsNew', 'What’s new'], ['help.about', 'About Wodblok']]) {
    await run(page, id); await H.settle(page); await expect(title(page)).toHaveText(t);
  }
  await expect(page.locator('#hlpb .stgr b').first()).toHaveText(/^v\d/);
  // Manual opens the list of pages; each row opens its page and Back comes home
  await run(page, 'help.manual'); await H.settle(page);
  const rows = await page.locator('#hlpb [data-hp]').evaluateAll(es => es.map(e => [e.dataset.hp, e.textContent.trim()]));
  expect(rows.length).toBeGreaterThanOrEqual(11);
  for (const [id, t] of rows) {
    await page.locator(`#hlpb [data-hp="${id}"]`).click(); await expect(title(page)).toHaveText(t);
    expect(await page.locator('#hlpb .hlpc').evaluate(e => e.textContent.length)).toBeGreaterThan(20);
    await page.locator('#hlpbk').click(); await expect(page.locator('#hlpb [data-hp]')).toHaveCount(rows.length);
  }
  expect(errors).toEqual([]);
});

test('search finds a topic by its words, says when nothing matches, and Esc clears it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await run(page, 'help.manual'); await H.settle(page);
  await page.locator('#hlpq').fill('halftone');
  await expect(page.locator('#hlpb [data-hp="effects"]')).toBeVisible();
  await page.locator('#hlpq').fill('half drop repeat');
  await expect(page.locator('#hlpb [data-hp="patterns"]')).toBeVisible();
  await page.locator('#hlpb [data-hp="patterns"]').click(); await expect(title(page)).toHaveText('Patterns');
  await page.locator('#hlpq').fill('zzqx'); await expect(page.locator('#hlpb .hlpn')).toHaveText('No match');
  await page.locator('#hlpq').press('Escape'); await expect(page.locator('#hlpq')).toHaveValue('');
  await expect(title(page)).toHaveText('Patterns');   // back to the page it was on
  expect(errors).toEqual([]);
});

test('the Help panel fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await run(page, 'help.start'); await H.settle(page);
  await expect(pane(page)).toBeVisible();
  const r = await pane(page).evaluate(e => { const b = e.getBoundingClientRect(), x = document.getElementById('hlpb'); return { l: b.left, r: b.right, sw: x.scrollWidth, cw: x.clientWidth }; });
  expect(r.l).toBeGreaterThanOrEqual(0); expect(r.r).toBeLessThanOrEqual(390); expect(r.sw).toBeLessThanOrEqual(r.cw + 1);
  expect(errors).toEqual([]);
});
