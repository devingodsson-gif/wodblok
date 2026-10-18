// 1.36.0: the Text tool (Stamp editor) and the Text layer use the same controls; 20 more fonts, each shown in its own face;
// word spacing, justify and case; Enter is a new line in both.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle, getState, putText } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('one Text panel in both editors: the controls are the same, the Layers panel has none of them', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'pattern');
  await openPanel(page, 'text');
  for (const k of ['t', 'f', 'file', 'sz', 'ls', 'ws', 'lh', 'wd', 'ht', 'al', 'va', 'tc', 'cv', 'rot', 'go'])
    await expect(page.locator('#tx_' + k), k).toHaveCount(1);
  expect(await page.locator('#tb_t, #tb_f, #tb_go, #lftx').count()).toBe(0);
  await expect(page.locator('#tx_lay')).toBeVisible();     // ink and textures belong to a Text layer
  await expect(page.locator('#tx_pv')).toBeHidden();
  await setMode(page, 'stamp');
  await openPanel(page, 'text');
  await expect(page.locator('#tx_lay')).toBeHidden();
  await expect(page.locator('#tx_pv')).toBeVisible();
  expect(errors).toEqual([]);
});

test('in the Pattern editor, typing in the Text panel with no Text layer makes one', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await setMode(page, 'pattern');
  await openPanel(page, 'text');
  const n0 = JSON.parse(await getState(page)).layers.length;
  await page.fill('#tx_t', 'HELLO');
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'true');
  const L = async () => JSON.parse(await getState(page)).layers;
  expect((await L()).length).toBe(n0 + 1);
  expect((await L()).filter(l => l.txt).length).toBe(1);
  await expect(page.locator('section.pn[data-p="text"]')).toBeVisible();      // the Text panel stays open
  expect(errors).toEqual([]);
});

test('thirty-four fonts, each written in its own face in the list', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await openPanel(page, 'text');
  const n = await page.locator('#tx_f option[data-font]').count();
  expect(n).toBe(34);
  await page.click('#tx_f + .dd2 .ddb');
  const first = page.locator('div.ddl:not([hidden]) .ddi').nth(14);        // the first of the new fonts
  await expect(first).toBeVisible();
  const ff = await first.evaluate(e => getComputedStyle(e).fontFamily);
  expect(ff).toContain('Playfair Display');
  const items = await page.locator('div.ddl:not([hidden]) .ddi').evaluateAll(a => a.map(e => [e.textContent, getComputedStyle(e).fontFamily]));
  for (const [name, fam] of items) expect(fam, name).toContain(name);
  expect(errors).toEqual([]);
});

test('case, word spacing and justify change the letters on the stamp; Enter is a new line', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await openPanel(page, 'text');
  const keys = async () => JSON.parse(await getState(page)).tiles[0].items.map(i => i.m);
  const xs = async () => JSON.parse(await getState(page)).tiles[0].items.map(i => i.x);
  await page.fill('#tx_t', 'ab');
  await putText(page);
  const k0 = await keys();
  await page.click('#tx_tc [data-c="u"]');
  await expect.poll(keys, { timeout: 15000 }).not.toEqual(k0);       // A and B instead of a and b
  await page.click('#tx_tc [data-c=""]');
  await expect.poll(keys, { timeout: 15000 }).toEqual(k0);
  // word spacing moves the second word away
  await page.fill('#tx_t', 'a b');
  await expect.poll(async () => (await keys()).length, { timeout: 15000 }).toBe(2);
  await settle(page);
  const x0 = await xs();
  await page.evaluate(() => { const r = document.getElementById('tx_ws'); r.value = 120; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect.poll(async () => { const x = await xs(); return Math.abs(x[1] - x[0]); }, { timeout: 15000 }).toBeGreaterThan(Math.abs(x0[1] - x0[0]) + 5);
  // justify: the first line of two stretches to the width of the longer one
  await page.fill('#tx_t', 'a b\ncccccc');
  await page.click('#tx_al [data-a="l"]');
  await page.evaluate(() => { const r = document.getElementById('tx_ws'); r.value = 0; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect.poll(async () => (await keys()).length, { timeout: 15000 }).toBe(8);
  await settle(page);
  const left = (await xs())[1];
  await page.click('#tx_al [data-a="j"]');
  await expect.poll(async () => (await xs())[1], { timeout: 15000 }).toBeGreaterThan(left + 5);
  // Enter makes a line
  await page.fill('#tx_t', 'ab');
  await page.click('#tx_t'); await page.keyboard.press('End'); await page.keyboard.press('Enter'); await page.keyboard.type('c');
  await expect(page.locator('#tx_t')).toHaveValue('ab\nc');
  expect(errors).toEqual([]);
});

test('Enter is a new line in the Text layer too', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await page.click('#ly_add');
  await page.click('#ly_menu [data-lt="t"]'); await openPanel(page, 'text');
  await settle(page);
  await page.fill('#tx_t', 'ab');
  await page.click('#tx_t'); await page.keyboard.press('End'); await page.keyboard.press('Enter'); await page.keyboard.type('c');
  await expect(page.locator('#tx_t')).toHaveValue('ab\nc');
  expect(errors).toEqual([]);
});
