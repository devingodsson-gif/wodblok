// 1.46.0: the Text styles library: built-in Starter styles, Save style, folders, apply, rename, delete (same tree as Saved colours).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle, getState, putText } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const set = (page, id, v) => page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
const items = async page => JSON.parse(await getState(page)).tiles[0].items;
const spread = a => Math.max(...a) - Math.min(...a);
const stored = page => page.evaluate(() => JSON.parse(window.__wbTest.kv.get('wb200_textstyles') || 'null'));
async function start(page, text, size = 8) {
  await setMode(page, 'stamp'); await openPanel(page, 'text');
  await page.fill('#tx_t', text); await putText(page);
  await set(page, 'tx_sz', size); await settle(page, { max: 30000 });
}

test('Starter styles are listed, and clicking one applies it to the text', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'IIIIIIII');
  await expect(page.locator('#tsl .scf[data-k="Starter styles"]')).toBeVisible();
  await page.click('#tsl .scf[data-k="Starter styles"]');
  expect(await page.locator('#tsl .scr').count()).toBeGreaterThanOrEqual(5);
  expect(spread((await items(page)).map(q => q.y))).toBeLessThan(1);
  await page.click('#tsl .scr:has-text("Wavy")'); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.y)), { timeout: 15000 }).toBeGreaterThan(3);
  expect(await page.inputValue('#tx_pt')).toBe('w');
  expect(await page.inputValue('#tx_t')).toBe('IIIIIIII');                  // the words stay
  await page.click('#tsl .scr:has-text("Seal")'); await settle(page, { max: 30000 });
  expect(await page.inputValue('#tx_cv')).toBe('100');
  expect(await page.inputValue('#tx_pt')).toBe('');                          // the other style's path is gone
  expect(errors).toEqual([]);
});

test('Save style keeps the panel, can be renamed and applied again', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'ABC');
  await set(page, 'tx_ls', 17); await set(page, 'tx_bb', 33);
  await page.click('#tsadd');
  await expect(page.locator('#tsl .scr.ren input')).toBeVisible();
  await page.fill('#tsl .scr.ren input', 'Mine'); await page.keyboard.press('Enter');
  await expect(page.locator('#tsl .scr:has-text("Mine")')).toBeVisible();
  const d = await stored(page);
  expect(d.c.length).toBe(1); expect(d.c[0].n).toBe('Mine'); expect(d.c[0].o.ls).toBe(17); expect(d.c[0].o.bb).toBe(33);
  expect(d.c[0].o.text).toBeUndefined();
  await set(page, 'tx_ls', 0); await set(page, 'tx_bb', 0);
  await page.click('#tsl .scr:has-text("Mine")'); await settle(page, { max: 30000 });
  expect(await page.inputValue('#tx_ls')).toBe('17'); expect(await page.inputValue('#tx_bb')).toBe('33');
  expect(await page.inputValue('#tx_t')).toBe('ABC');
  await page.click('#tsl .scr:has-text("Mine") [data-del]');
  await expect(page.locator('#tsl .scr:has-text("Mine")')).toHaveCount(0);
  expect((await stored(page)).c.length).toBe(0);
  expect(errors).toEqual([]);
});

test('Folders: a new folder is made, becomes active, and the next saved style goes into it', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp'); await openPanel(page, 'text');
  await page.click('#tsnew');
  await page.fill('#tsl .scform input', 'Posters'); await page.keyboard.press('Enter');
  await expect(page.locator('#tsl .scf[data-k="Posters"]')).toBeVisible();
  await page.click('#tsadd'); await page.fill('#tsl .scr.ren input', 'Big'); await page.keyboard.press('Enter');
  await expect(page.locator('#tsl .scr:has-text("Big")')).toBeVisible();
  const d = await stored(page);
  expect(d.f).toContain('Posters'); expect(d.c[0].f).toBe('Posters');
  await page.fill('#tsq', 'big');
  await expect(page.locator('#tsl .scr')).toHaveCount(1);
  await page.fill('#tsq', 'zzz');
  await expect(page.locator('#tsl .stno')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Text layer: a style applies to the selected text', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await page.click('#ly_add');
  await page.click('#ly_menu [data-lt="t"]'); await openPanel(page, 'text');
  await settle(page);
  await page.fill('#tx_t', 'STYLE ME');
  await page.waitForTimeout(500);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);
  await page.click('#tx_go');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);
  await page.click('#tsl .scf[data-k="Starter styles"]');
  await page.click('#tsl .scr:has-text("Swell")');
  const piece = async () => JSON.parse(await getState(page)).layers.flatMap(l => (l.pl || []).filter(p => p.tx))[0];
  await expect.poll(async () => (await piece()).tx.wp, { timeout: 8000 }).toBe('b');
  expect((await piece()).tx.text).toBe('STYLE ME');
  expect(errors).toEqual([]);
});
