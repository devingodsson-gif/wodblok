// Randomize: each main switch is a slider from 0 (off) to 100 (fully on); Colours keeps a plain switch (1.0.8, Q6).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const set = (page, k, v) => page.evaluate(([k, v]) => { const c = document.querySelector(`[data-ft="${k}"]`); c.value = v; c.dispatchEvent(new Event('input', { bubbles: true })); }, [k, v]);
const roll = async page => { await page.click('#rzdo'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };

test('every switch is a slider except Colours; the old on/off choices are 100 and 0; a saved choice survives a reload', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'rand');
  const kinds = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-ft]')].map(c => [c.dataset.ft, c.type === 'range' ? c.value : c.checked])));
  expect(kinds).toEqual({ stamps: '100', text: '100', layout: '0', frame: '100', size: '0', free: '100', col: true, gr: '100', masks: '100', tx: '100', pr: '100', look: '0', jit: '100' });
  await set(page, 'frame', 35);
  await page.reload(); await page.waitForFunction(() => document.fonts.status === 'loaded'); await settle(page);
  await openPanel(page, 'rand');
  expect(await page.evaluate(() => document.querySelector('[data-ft="frame"]').value)).toBe('35');
  expect(errors).toEqual([]);
});

test('All off sets every slider to 0 and disables Randomize; All on sets them to 100', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'rand');
  await page.click('#rznone');
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-ft]')].every(c => (c.type === 'range' ? +c.value === 0 : !c.checked)))).toBe(true);
  await expect(page.locator('#rzdo')).toBeDisabled();
  await page.click('#rzall');
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-ft]')].every(c => (c.type === 'range' ? +c.value === 100 : c.checked)))).toBe(true);
  await expect(page.locator('#rzdo')).toBeEnabled();
  expect(errors).toEqual([]);
});

test('a feature at 0 is left alone; the same roll at 100 changes it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'rand');
  await page.click('#rznone');
  await set(page, 'gr', 0); await set(page, 'tx', 100);
  await roll(page);
  const s = JSON.parse(await getState(page));
  expect(Object.values(s.grade || {}).every(v => v === 0 || v === false || (Array.isArray(v) && !v.length))).toBe(true);   // the grade is still neutral
  expect(errors).toEqual([]);
});

test('a lower amount makes a milder grade: the same roll at 30 has smaller values than at 100', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 9 });
  await openPanel(page, 'rand');
  await page.click('#rznone');
  const grade = async amt => {
    await page.evaluate(() => { Math.random = (() => { let a = 12345; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(); });
    await set(page, 'gr', amt);
    await roll(page);
    const g = JSON.parse(await getState(page)).grade || {};
    return Object.entries(g).filter(([k, v]) => typeof v === 'number' && k !== 'cov').reduce((n, [, v]) => n + Math.abs(v), 0);
  };
  const full = await grade(100), mild = await grade(30);
  expect(full).toBeGreaterThan(0);
  expect(mild).toBeLessThan(full);
  expect(errors).toEqual([]);
});
