// Keyboard focus must be visible on sliders and fields, small text must be readable, and slider rows must be easy to hit (UX review C13).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel } = require('./helpers/harness');

const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

for (const theme of ['dark', 'light']) {
  test(`${theme}: the faint text colour reaches 4.5:1 on the panel`, async ({ page }) => {
    const { errors } = await openApp(page, { seed: 1 });
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    const c = await page.evaluate(() => { const s = getComputedStyle(document.documentElement); return { faint: s.getPropertyValue('--faint').trim(), panel: s.getPropertyValue('--panel').trim() }; });
    expect(ratio(c.faint, c.panel)).toBeGreaterThanOrEqual(4.5);
    expect(errors).toEqual([]);
  });
}

test('a slider thumb and a number field show a clear focus ring from the keyboard', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 1 });
  await openPanel(page, 'canvas');
  await page.evaluate(() => { const e = [...document.querySelectorAll('section.pn[data-p="canvas"] input[type=range]')].find(i => i.getBoundingClientRect().height > 0); e.setAttribute('data-a11y', '1'); });
  const thumb = async () => {
    const bb = await page.locator('[data-a11y]').boundingBox();
    return page.screenshot({ clip: { x: bb.x + bb.width / 2 - 24, y: bb.y - 8, width: 48, height: bb.height + 16 } });
  };
  await page.mouse.move(700, 500);
  const off = await thumb();
  await page.keyboard.press('Tab');
  await page.focus('[data-a11y]');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  const on = await thumb();
  // count pixels that are clearly the accent colour: a ring of that colour only appears when focused
  const accentPixels = async buf => page.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 196) < 14 && Math.abs(d[i + 1] - 164) < 14 && Math.abs(d[i + 2] - 110) < 14) n++;
    return n;
  }, buf.toString('base64'));
  expect(await accentPixels(on)).toBeGreaterThan((await accentPixels(off)) + 40);
  const num = await page.evaluate(() => { const e = [...document.querySelectorAll('section.pn[data-p="canvas"] input[type=number]')].find(i => i.getBoundingClientRect().width > 0); e.focus(); return getComputedStyle(e).boxShadow; });
  expect(num).not.toBe('none');
  expect(errors).toEqual([]);
});

test('slider rows are at least 24 px tall', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 1 });
  await openPanel(page, 'canvas');
  await page.evaluate(() => { const e = [...document.querySelectorAll('section.pn[data-p="canvas"] input[type=range]')].find(i => i.getBoundingClientRect().height > 0); e.setAttribute('data-a11y', '1'); });
  const h = await page.evaluate(() => document.querySelector('[data-a11y]').getBoundingClientRect().height);
  expect(h).toBeGreaterThanOrEqual(24);
  expect(errors).toEqual([]);
});
