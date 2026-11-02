// 2.84.5 (patch 4 of docs/patch-todo-2.85.md): panels and inputs.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));

async function placeText(page, word = 'Hello') {
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await page.click('.elk[data-k="text"] [data-add]'); await H.settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * .4, b.y + b.height * .4);
  await page.waitForFunction(() => document.querySelector('#fpov .gh'), null, { timeout: 5000 });
  await page.mouse.click(b.x + b.width * .4, b.y + b.height * .4); await H.settle(page);
  await page.keyboard.type(word); await page.keyboard.press('Escape'); await H.settle(page);
}

// T16
test('the Text panel\'s Size slider sizes the letters and leaves the box as it is', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await placeText(page);
  const t0 = (await st(page)).els.find(q => q.k === 'text'), box = t => [t.bw * t.s / t.n, t.bh * t.s / t.n];
  await expect(page.locator('#tx_fsz')).toBeVisible();
  const v0 = +(await page.inputValue('#tx_fsz'));
  expect(v0, 'it shows the size the letters are drawn at, not the Size field').not.toBe(t0.tx.sz);
  await page.evaluate(v => { const z = document.getElementById('tx_fsz'); z.value = v; z.dispatchEvent(new Event('input', { bubbles: true })); }, Math.round(v0 / 2)); await H.settle(page);
  const t1 = (await st(page)).els.find(q => q.k === 'text');
  expect(t1.Lt[0][4] * t1.s / t1.n, 'the letters are smaller').toBeLessThan(t0.Lt[0][4] * t0.s / t0.n * 0.7);
  const [w0, h0] = box(t0), [w1, h1] = box(t1);
  expect(Math.abs(w1 - w0)).toBeLessThan(1); expect(Math.abs(h1 - h0)).toBeLessThan(1);
  expect(t1.tx.ft, 'the text keeps its own size (not fitted to the box)').toBe('z');
  expect(errors).toEqual([]);
});

// T15
test('opening an element panel closes the other element panels; the Elements list stays', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, workspaces: 'launch' });
  await H.openPanel(page, 'motifs'); await H.settle(page);
  await H.openPanel(page, 'colors'); await H.settle(page);
  await H.openPanel(page, 'text'); await H.settle(page);
  const s = await page.evaluate(() => JSON.stringify([...document.querySelectorAll('.wg')].map(g => [...g.querySelectorAll('[data-tx],[data-p]')].map(t => t.dataset.tx || t.dataset.p))));
  expect(s).toContain('"text"');
  expect(s, 'the Shape panel was closed').not.toContain('"motifs"');
  expect(s, 'the Elements list stays').toContain('"lyrs"');
  expect(s, 'Colours stays').toContain('"colors"');
  expect(errors).toEqual([]);
});

test('in a stamp\'s tab the Stamp panel stays open beside another element panel', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.showPanel(page, 'stmp'); await page.click('#smknew'); await H.settle(page); await page.click('#smkedit'); await H.settle(page);
  await H.openPanel(page, 'text'); await H.settle(page);
  await H.openPanel(page, 'motifs'); await H.settle(page);
  const s = await page.evaluate(() => JSON.stringify([...document.querySelectorAll('.wg')].map(g => [...g.querySelectorAll('[data-tx],[data-p]')].map(t => t.dataset.tx || t.dataset.p))));
  expect(s).toContain('"stmp"'); expect(s).toContain('"motifs"');
  expect(s, 'the Text panel was closed').not.toContain('"text"');
  expect(errors).toEqual([]);
});
