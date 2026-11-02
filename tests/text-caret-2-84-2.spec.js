// 2.84.2 (T1): the typing field is set in the text's real font, size and spacing, so the caret sits where the next letter lands.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern } = require('./helpers/harness');

async function typeText(page, word) {
  await noPattern(page);
  await page.click('#elb [data-k="text"]'); await settle(page);
  await page.click('.elk[data-k="text"] [data-add]'); await settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.4);
  await page.waitForFunction(() => document.querySelector('#fpov .gh'), null, { timeout: 5000 });
  await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.4); await settle(page);
  await expect(page.locator('#txin')).toBeFocused();
  await page.keyboard.type(word); await settle(page);
}
// width of the typed text in the field's own font, against the width the letters are drawn at on the canvas
const measure = page => page.evaluate(() => {
  const e = document.getElementById('txin'), cs = getComputedStyle(e), c = document.createElement('canvas').getContext('2d');
  c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const field = c.measureText(e.value).width + (parseFloat(cs.letterSpacing) || 0) * e.value.length;
  const q = JSON.parse(__wbTest.state()).els.find(x => x.k === 'text'), m = document.getElementById('art').getScreenCTM();
  const drawn = q.bw * (q.s / Math.max(q.n || 1, .01)) * Math.hypot(m.a, m.b);
  return { field, drawn, ff: cs.fontFamily, fs: parseFloat(cs.fontSize), over: e.scrollWidth - e.clientWidth };
});

test('the typing field uses the text\'s font and its width matches the drawn letters', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await typeText(page, 'Hello World');
  const r = await measure(page);
  expect(r.ff).not.toMatch(/^(inherit|-apple|system)/);
  expect(Math.abs(r.field - r.drawn) / r.drawn, `field ${r.field} vs drawn ${r.drawn}`).toBeLessThan(0.1);
  expect(r.over).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('a longer text wraps into the same lines in the field as on the canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await typeText(page, 'Hello');
  await page.keyboard.type(' brave new world of printed patterns'); await settle(page);
  const r = await page.evaluate(() => {
    const e = document.getElementById('txin'), cs = getComputedStyle(e), q = JSON.parse(__wbTest.state()).els.find(x => x.k === 'text');
    e.style.height = '0px';
    const field = Math.round((e.scrollHeight - parseFloat(cs.paddingTop)) / parseFloat(cs.lineHeight));
    return { field, drawn: new Set(q.Lt.map(l => Math.round(l[2] / 4))).size, rows: q.Lt.length };
  });
  expect(r.drawn, 'the text wraps at all').toBeGreaterThan(1);
  expect(Math.abs(r.field - r.drawn), `field ${r.field} lines, canvas ${r.drawn}`).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
