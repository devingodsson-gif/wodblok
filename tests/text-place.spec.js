// Text: in both editors the text follows the cursor with its box drawn round it, a click puts it down, and it stays on the cursor to put down again (1.38.0).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const groups = async page => new Set(JSON.parse(await getState(page)).tiles[0].items.map(i => i.tg)).size;
const hover = async (page, fx, fy) => { const b = await page.locator('#ed').boundingBox(), x = b.x + b.width * fx, y = b.y + b.height * fy; await page.mouse.move(x - 5, y - 5); await page.mouse.move(x, y); return [x, y]; };

test('Stamp editor: typing puts the text on the cursor with a box; each click puts a copy down; right-click stops', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp'); await openPanel(page, 'text');
  await expect(page.locator('#tx_go')).toHaveText('Add text');
  await page.fill('#tx_t', 'Wod');
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'true');
  await hover(page, 0.4, 0.5);
  await expect(page.locator('#ed #ghost path')).not.toHaveCount(0);
  await expect(page.locator('#ed #ghost rect')).toHaveCount(2);   // the box: a white line under a dashed one
  expect(await groups(page)).toBe(0);                            // nothing is on the stamp until you click
  const [x1, y1] = await hover(page, 0.4, 0.5); await page.mouse.click(x1, y1); await settle(page, { max: 30000 });
  expect(await groups(page)).toBe(1);
  const [x2, y2] = await hover(page, 0.6, 0.5); await page.mouse.click(x2, y2); await settle(page, { max: 30000 });
  expect(await groups(page)).toBe(2);                            // still on the cursor
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.click(x2, y2 + 60, { button: 'right' }); await settle(page);
  await expect(page.locator('#ed #ghost')).toHaveCount(0);
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'false');
  expect(await groups(page)).toBe(2);
  expect(errors).toEqual([]);
});

test('Stamp editor: the box on the cursor follows Box width and Box height', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp'); await openPanel(page, 'text');
  await page.fill('#tx_t', 'Wod lok');
  await hover(page, 0.5, 0.5);
  const set = (id, v) => page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
  const dims = () => page.evaluate(() => { const r = document.querySelector('#ed #ghost rect:last-of-type'); return r ? [+r.getAttribute('width'), +r.getAttribute('height')] : null; });
  const side = () => page.evaluate(() => { const v = document.getElementById('ed').viewBox.baseVal; return Math.min(v.width - 48, v.height - 48); });
  await set('tx_wd', 50); await set('tx_ht', 30);
  await expect.poll(async () => { const d = await dims(); return d && Math.round(d[0]); }, { timeout: 15000 }).toBe(Math.round(await side() * 0.5));
  expect(Math.round((await dims())[1])).toBe(Math.round(await side() * 0.3));
  expect(errors).toEqual([]);
});

test('Text layer: the text on the cursor has its box drawn round it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await page.click('#ly_add'); await page.click('#ly_menu [data-lt="t"]'); await settle(page);
  await page.fill('#tb_t', 'ONE TWO');
  await page.waitForTimeout(500);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width / 2 - 5, b.y + b.height / 2 - 5); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('#fpov rect.gh')).toHaveCount(1, { timeout: 10000 });
  const w = +(await page.locator('#fpov rect.gh').getAttribute('width'));
  expect(w).toBeGreaterThan(10);
  expect(errors).toEqual([]);
});
