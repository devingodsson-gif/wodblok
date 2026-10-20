// Element update, step 10 (2.1.10): speed with many strokes. Strokes are drawn with synthetic pointer events straight onto the canvas; the time a stroke takes to join the
// element and the picture to be redrawn (pointer up) must stay small when the element already holds hundreds of strokes.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState } = require('./helpers/harness');

test('a Paint element with hundreds of strokes still takes a new stroke quickly', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="paint"]');
  await page.click('#pamode [data-m="brush"]');
  const real = async () => { const box = await page.locator('#art').boundingBox(); await page.mouse.move(box.x + box.width * .2, box.y + box.height * .5); await page.mouse.down(); for (let i = 1; i <= 6; i++) await page.mouse.move(box.x + box.width * (.2 + .08 * i), box.y + box.height * .5); const t0 = Date.now(); await page.mouse.up(); await settle(page); return Date.now() - t0; };
  const empty = await real();
  const r = await page.evaluate(async () => {
    const a = document.getElementById('art'), b = a.getBoundingClientRect(), ev = (t, x, y) => a.dispatchEvent(new PointerEvent(t, { clientX: b.x + b.width * x, clientY: b.y + b.height * y, button: 0, buttons: 1, pointerId: 7, bubbles: true, cancelable: true }));
    const times = [];
    for (let i = 0; i < 400; i++) {
      const y = 0.1 + 0.8 * ((i * 37) % 100) / 100, x0 = 0.1 + 0.5 * ((i * 53) % 100) / 100;
      ev('pointerdown', x0, y);
      for (let j = 1; j <= 30; j++) ev('pointermove', x0 + j * 0.01, y + Math.sin(j / 3) * 0.01);
      const t0 = performance.now(); ev('pointerup', x0 + 0.3, y); times.push(performance.now() - t0);
      if (i % 20 == 0) await new Promise(r => setTimeout(r, 0));
    }
    const last = times.slice(-20).sort((p, q) => p - q);
    return { first: times.slice(0, 20).sort((p, q) => p - q)[10], last: last[10], max: Math.max(...times) };
  });
  const full = await real();
  console.log('paint-speed', JSON.stringify({ ...r, emptyMs: empty, fullMs: full }));
  const p = JSON.parse(await getState(page)).layers[0].pl.find(q => q.k === 'paint');
  expect(p.st).toHaveLength(402);
  expect(full, 'a stroke on 400 others, from pointer up to a settled picture (ms)').toBeLessThan(empty + 1500);
  expect(r.last, 'median commit time with 400 strokes in the element (ms)').toBeLessThan(250);
  expect(errors).toEqual([]);
});
