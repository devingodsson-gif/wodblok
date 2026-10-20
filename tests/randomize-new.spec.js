// 1.31.0: Randomize can use the new layout controls: round arrangements, size/gaps variation and brick offset (Stamps moves and the Layout switch).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

async function only(page, ft, subs) {
  await page.evaluate(([ft, subs]) => {
    document.querySelectorAll('[data-ft]').forEach(c => { if (c.type === 'range') c.value = 0; else c.checked = false; c.dispatchEvent(new Event('input', { bubbles: true })); });
    document.querySelectorAll(`[data-sub^="${ft}."]`).forEach(c => { c.checked = subs.includes(c.dataset.sub.split('.')[1]); c.dispatchEvent(new Event('change', { bubbles: true })); });
    const m = document.querySelector(`[data-ft="${ft}"]`); m.value = 100; m.dispatchEvent(new Event('input', { bubbles: true }));
  }, [ft, subs]);
}
const layers = async page => [{ pl: JSON.parse(await getState(page)).els }];
// the Pattern elements of every layer
const pats = async page => (await layers(page)).flatMap(l => (l.pl || []).filter(p => p.k === 'pattern'));
const jits = async page => (await pats(page)).filter(p => (p.fx || []).some(e => e.k === 'jitter' && (e.pos || e.sz)));

test('the Randomize panel lists the new kinds, ticked', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 6 });
  await openPanel(page, 'rand');
  for (const s of ['stamps.radial', 'stamps.vary', 'layout.radial', 'layout.vary']) await expect(page.locator(`[data-sub="${s}"]`)).toBeChecked();
  expect(errors).toEqual([]);
});

test('Layout can roll round arrangements, and size, gaps and brick offset', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 9 });
  await openPanel(page, 'rand');
  await page.click('#rzdo'); await settle(page, { max: 90000 });                       // a project with repeating layers to rework
  await only(page, 'layout', ['type', 'radial']);
  let radial = 0;
  for (let i = 0; i < 12 && !radial; i++) { await page.click('#rzdo'); await settle(page, { max: 90000 }); radial = (await pats(page)).filter(p => p.lay === 'radial').length; }
  expect(radial).toBeGreaterThan(0);
  await only(page, 'layout', ['vary']);
  let vary = 0;
  for (let i = 0; i < 12 && !vary; i++) { await page.click('#rzdo'); await settle(page, { max: 90000 }); vary = (await jits(page)).length; }
  expect(vary).toBeGreaterThan(0);
  await only(page, 'layout', ['type']);                                                  // without "round arrangements" nothing round is picked
  for (let i = 0; i < 4; i++) { await page.click('#rzdo'); await settle(page, { max: 90000 }); (await pats(page)).forEach(p => expect(p.lay).not.toBe('radial')); }
  expect(errors).toEqual([]);
});

test('Stamps can roll round arrangements and size, gaps and offset as moves', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 12 });
  await openPanel(page, 'rand');
  await only(page, 'stamps', ['radial']);
  let radial = 0;
  for (let i = 0; i < 12 && !radial; i++) { await page.click('#rzdo'); await settle(page, { max: 90000 }); radial = (await pats(page)).filter(p => p.lay === 'radial').length; }
  expect(radial).toBeGreaterThan(0);
  await only(page, 'stamps', ['vary']);
  let vary = 0;
  for (let i = 0; i < 12 && !vary; i++) { await page.click('#rzdo'); await settle(page, { max: 90000 }); vary = (await jits(page)).length; }
  expect(vary).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
