// Navigator, hand tool and zoom keys (Phase 5): see the whole piece small, move around a zoomed piece without the scroll bars.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const board = page => page.locator('#boardP');
const scroll = page => board(page).evaluate(b => [b.scrollLeft, b.scrollTop]);
const bigger = async (page, n = 6) => { await page.keyboard.press('1'); for (let i = 0; i < n; i++) await page.keyboard.press('+'); };   // so the picture is larger than the window both ways
const pct = page => page.locator('#zl').textContent().then(t => parseInt(t, 10));

test('zoom keys: + and - zoom, 1 is 100%, 0 fits again', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  const fit = await pct(page);
  await page.keyboard.press('+');
  expect(await pct(page)).toBeGreaterThan(fit);
  await page.keyboard.press('-'); await page.keyboard.press('-');
  expect(await pct(page)).toBeLessThan(fit);
  await page.keyboard.press('1');
  expect(await pct(page)).toBe(100);
  await page.keyboard.press('0');
  expect(await pct(page)).toBe(fit);
  expect(errors).toEqual([]);
});

test('Ctrl+wheel zooms around the pointer: the spot under the pointer stays put', async ({ page }) => {
  const { errors } = await openApp(page);
  await bigger(page);
  const r = await board(page).boundingBox();
  const px = r.x + r.width * 0.7, py = r.y + r.height * 0.4;
  const at = async () => page.evaluate(([x, y]) => { const a = document.getElementById('art').getBoundingClientRect(); return [(x - a.left) / a.width, (y - a.top) / a.height, a.width, a.height]; }, [px, py]);
  const before = await at();
  await page.mouse.move(px, py);
  await page.keyboard.down('Control'); await page.mouse.wheel(0, -300); await page.keyboard.up('Control');
  await page.waitForTimeout(200);
  const after = await at();
  expect(after[2]).toBeGreaterThan(before[2] * 1.05);                          // it did zoom
  expect(Math.abs(after[0] - before[0]) * after[2]).toBeLessThan(8);           // the same spot, within a few pixels
  expect(Math.abs(after[1] - before[1]) * after[3]).toBeLessThan(8);
  expect(errors).toEqual([]);
});

test('hand tool: Space+drag, middle button and the Hand button move the picture without changing the document', async ({ page }) => {
  const { errors } = await openApp(page);
  await bigger(page);
  await page.waitForTimeout(400); await settle(page);                           // the zoom has finished moving the view before it is measured
  const doc = await getState(page);
  const r = await board(page).boundingBox(), cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const s0 = await scroll(page);
  // Space + drag
  await page.keyboard.down(' ');
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx - 120, cy - 90, { steps: 6 }); await page.mouse.up();
  await page.keyboard.up(' ');
  const s1 = await scroll(page);
  expect(s1[0]).toBeGreaterThan(s0[0] + 80); expect(s1[1]).toBeGreaterThan(s0[1] + 60);
  // the Hand button in the Navigator
  await openPanel(page, 'nav');
  await page.click('#nvhand');
  await expect(page.locator('#nvhand')).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 100, cy + 70, { steps: 6 }); await page.mouse.up();
  const s2 = await scroll(page);
  expect(s2[0]).toBeLessThan(s1[0] - 60);
  await page.click('#nvhand');
  await expect(page.locator('#nvhand')).toHaveAttribute('aria-pressed', 'false');
  // middle button
  await page.mouse.move(cx, cy); await page.mouse.down({ button: 'middle' }); await page.mouse.move(cx + 60, cy, { steps: 4 }); await page.mouse.up({ button: 'middle' });   // to the right: there is room to scroll left (to the left the view can already be at its end)
  expect((await scroll(page))[0]).toBeLessThan(s2[0] - 30);
  expect(await getState(page)).toBe(doc);
  expect(errors).toEqual([]);
});

test('Navigator: shows the piece with a frame for what is visible; clicking it moves the view; Fit and 100% work', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 30000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
  await openPanel(page, 'nav');
  await expect(page.locator('#nvi')).toHaveAttribute('src', /^data:image/, { timeout: 15000 });
  const full = await page.locator('#nvr').boundingBox(), pic = await page.locator('#nvi').boundingBox();
  expect(full.width).toBeGreaterThan(pic.width * 0.9);            // fitted: the frame is the whole picture
  await page.click('#nv100'); for (let i = 0; i < 6; i++) await page.click('#nvzi');
  await page.waitForTimeout(150);
  const small = await page.locator('#nvr').boundingBox();
  expect(small.width).toBeLessThan(pic.width * 0.8);
  expect(await page.locator('#nvz').textContent()).toMatch(/\d+%/);
  // click the bottom right corner of the small map: the view scrolls there
  const s0 = await scroll(page);
  await page.mouse.click(pic.x + pic.width * 0.95, pic.y + pic.height * 0.95);
  const s1 = await scroll(page);
  expect(s1[0]).toBeGreaterThan(s0[0]); expect(s1[1]).toBeGreaterThan(s0[1]);
  // the frame follows the view (it is redrawn a moment after the scrolling)
  await expect.poll(async () => { const f = await page.locator('#nvr').boundingBox(), p = await page.locator('#nvi').boundingBox(); return [f.x + f.width > p.x + p.width - 6, f.y + f.height > p.y + p.height - 6]; }).toEqual([true, true]);
  await page.click('#nvfit');
  await expect.poll(async () => (await page.locator('#nvr').boundingBox()).width).toBeGreaterThan(pic.width * 0.9);
  expect(errors).toEqual([]);
});
