// No visible text is smaller than 11 px, in the panels of either view (UX review C13).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const small = page => page.evaluate(() => {
  const out = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (cs.display === 'none' || cs.visibility === 'hidden' || !r.width || !r.height || el.closest('svg')) continue;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (own && parseFloat(cs.fontSize) < 10.99) out.add((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]) + ' ' + cs.fontSize + ' "' + el.textContent.trim().slice(0, 18) + '"');
  }
  return [...out];
});

for (const view of ['pattern', 'stamp']) {
  test(`${view}: every tool panel opens with text of at least 11 px`, async ({ page }) => {
    const { errors } = await openApp(page, { seed: 4 });
    await setMode(page, view);
    const tools = await page.evaluate(() => [...document.querySelectorAll('.rail [data-pn]')].filter(b => !b.hidden && b.offsetParent).map(b => b.dataset.pn));
    const bad = [];
    for (const t of tools) { await openPanel(page, t); await settle(page); bad.push(...(await small(page)).map(x => t + ': ' + x)); await page.click(`.rail [data-pn="${t}"]`).catch(() => {}); }
    expect(bad, bad.join('\n')).toEqual([]);
    expect(errors).toEqual([]);
  });
}
