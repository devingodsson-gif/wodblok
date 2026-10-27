// 2.66.0 (owner Oct 27 2026, docs/text-plan.md release 4): about ninety built-in fonts in groups; a family with its own bold and italic sets bold and italic letters
// in them (not drawn bold or slanted); a font without them still draws them.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const txt = async page => JSON.parse(await H.getState(page)).els.find(x => x.tx);
const font = (page, v) => page.evaluate(v => { const s = document.getElementById('tx_f'); s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const sel = (page, a, b) => page.evaluate(([a, b]) => { const t = document.getElementById('tx_t'); t.focus(); t.setSelectionRange(a, b); t.dispatchEvent(new Event('select')); }, [a, b]);

test('the font list: about ninety fonts in eight groups', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  const g = await page.evaluate(() => [...document.querySelectorAll('#tx_f optgroup')].map(o => [o.label, o.children.length]));
  expect(g.map(x => x[0])).toEqual(['Serif', 'Sans', 'Slab', 'Display', 'Script', 'Blackletter', 'Handwritten', 'Mono']);
  const n = g.reduce((a, x) => a + x[1], 0);
  expect(n).toBeGreaterThanOrEqual(85); expect(n).toBeLessThanOrEqual(100);
  expect(errors).toEqual([]);
});

test('Bold and Italic use the font\'s own bold and italic when it has them, and are drawn when it has not', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await H.placeArmed(page, 'text'); await H.showPanel(page, 'text');
  await page.fill('#tx_t', 'Abc'); await font(page, 'lora'); await H.settle(page);
  await sel(page, 0, 3); await page.click('#tx_fx [data-fl="b"]'); await page.click('#tx_fx [data-fl="i"]');
  await expect.poll(async () => (await txt(page)).Lt.map(l => l[0].split('|')[1]).join(','), { timeout: 15000 }).toBe('lora-bi,lora-bi,lora-bi');
  await expect(page.locator('#art use[stroke]')).toHaveCount(0);
  await expect(page.locator('#art use[transform="skewX(-12)"]')).toHaveCount(0);
  // Cinzel has no bold or italic of its own: they are drawn
  await font(page, 'cinzel');
  await expect.poll(async () => (await txt(page)).Lt.map(l => l[0].split('|')[1]).join(','), { timeout: 15000 }).toBe('cinzel,cinzel,cinzel');
  await expect(page.locator('#art use[stroke]')).toHaveCount(3);
  await expect(page.locator('#art use[transform="skewX(-12)"]')).toHaveCount(3);
  expect(errors).toEqual([]);
});
