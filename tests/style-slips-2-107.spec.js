// 2.107.0 (B2 to B4 of docs/bug-test-2.105.md): three style slips found by the 2.105.0 bug test.
//  B2: every Mockup card's name was cut to three or four letters (five cards a row); the library starts at three a row, like Templates and Colourways.
//  B3: "Paragraph spacing" was wider than the 96px label column of the slider row; it is "Paragraph gap".
//  B4: X and Y over W and H did not line up (W is wider than X); the paired rows are a grid with one label column, so the fields stand in columns.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

test('B2: the Mockup library shows whole names', async ({ page }) => {
  const { errors } = await H.openApp(page);
  await H.openPanel(page, 'mock');
  await page.waitForSelector('#mkpane .lib.crd b');
  const cut = await page.$$eval('#mkpane .lib.crd b', bs => bs.filter(b => b.offsetWidth > 0).map(b => ({ t: b.textContent, cut: b.scrollWidth > b.clientWidth + 1 })));
  expect(cut.length, 'mockup cards on show').toBeGreaterThan(0);
  expect(cut.filter(c => c.cut).map(c => c.t), 'names cut off').toEqual([]);
  expect(errors).toEqual([]);
});

test('B3: every Text panel label fits its column', async ({ page }) => {
  const { errors } = await H.openApp(page);
  await H.openPanel(page, 'text');
  // every label of the panel (a slider row's label sits in its .ctl grid, cut with an ellipsis at 96px)
  const wide = await page.$$eval('section.pn[data-p="text"] label', ls => ls.filter(l => l.offsetWidth > 0 && l.scrollWidth > l.clientWidth).map(l => l.textContent));
  expect(wide, 'labels wider than their column').toEqual([]);
  await expect(page.locator('section.pn[data-p="text"] label', { hasText: 'Paragraph gap' })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('B4: X, Y, W and H stand in two columns', async ({ page }) => {
  const { errors } = await H.openApp(page);
  // the rows are measured where they sit in the page (Element group and Group panel); they are shown here without picking anything, which is all the layout needs
  const cols = await page.evaluate(() => {
    const out = {};
    for (const box of ['lfpxy', 'gpbox']) {
      const b = document.getElementById(box); let n = b; const shown = [];
      while (n && n !== document.body) { if (n.hidden) { n.hidden = false; shown.push(n); } if (n.tagName === 'DETAILS' && !n.open) { n.open = true; shown.push(n); } n = n.parentElement; }
      const rows = [...b.querySelectorAll('.aspc.xy')].map(r => [...r.querySelectorAll('input')].map(i => Math.round(i.getBoundingClientRect().left)));
      out[box] = rows;
    }
    return out;
  });
  for (const [box, rows] of Object.entries(cols)) {
    expect(rows.length, `${box}: two rows`).toBe(2);
    expect(rows[1], `${box}: W under X, H under Y`).toEqual(rows[0]);
  }
  expect(errors).toEqual([]);
});
