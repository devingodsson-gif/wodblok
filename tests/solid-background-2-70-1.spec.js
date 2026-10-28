// 2.70.1: the Background stays solid. A canvas Wear texture works on the whole drawing (and, in 2.70.1, the print settings Roughness and Ink squash did too; they went in 2.71.0). A solid copy of
// the Background is drawn under them, so the checkerboard cannot show through the paper.
// "See-through" is measured exactly: the canvas is shot over magenta and over green; a pixel that differs lets what is behind the canvas through, however little.
// A plain project measures about 0.5% (the anti-aliased edge of the canvas).
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState } = require('./helpers/harness');

const seeThrough = async page => {
  const shot = async c => { const st = await page.addStyleTag({ content: `#art.cvck{background:${c} !important}` }); const b = await page.locator('#art').screenshot(); await st.evaluate(e => e.remove()); return b; };
  const a = await shot('#ff00ff'), b = await shot('#00ff00');
  return page.evaluate(async ([a, b]) => {
    const px = async s => { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()); const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, im.width, im.height).data; };
    const A = await px(a), B = await px(b); let n = 0; for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 6) n++;
    return n / (A.length / 4);
  }, [a.toString('base64'), b.toString('base64')]);
};

test('a canvas Wear texture leaves the Background solid', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5, background: true });
  await page.click('#rzdo'); await settle(page, { max: 90000 });               // a picture, with a canvas texture in its library
  const s = JSON.parse(await getState(page));
  expect(await seeThrough(page)).toBeLessThan(0.01);
  if ((s.tex.u || []).length) { s.tex.u = s.tex.u.map(u => ({ ...u, md: 'wear' })); await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s)); await settle(page, { max: 30000 }); expect(await seeThrough(page)).toBeLessThan(0.01); }
  // a Background with no fill is see-through on purpose, and stays so
  s.els.find(q => q.bgd).fl = 'none';
  await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s)); await settle(page, { max: 30000 });
  expect(await seeThrough(page)).toBeGreaterThan(0.05);
  expect(errors).toEqual([]);
});
