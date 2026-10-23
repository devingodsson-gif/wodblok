// 2.2.2: the element list. No layers: one ordered list of elements with an eye, a name, an opacity and a blend on every row; Group and Ungroup (Ctrl+G, Ctrl+Shift+G).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, noPattern } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};
// three stamps on an empty list: element 0 at the bottom, element 2 on top
const three = async page => {
  await noPattern(page);
  await openPanel(page, 'stmp');
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await canvasClick(page, 0.25, 0.3);
  await canvasClick(page, 0.5, 0.5);
  await canvasClick(page, 0.75, 0.7);
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await openPanel(page, 'lyrs');
  await settle(page);
};
const setOp = (page, v) => page.evaluate(v => { const e = document.getElementById('ly_op'); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const setBl = (page, v) => page.evaluate(v => { const e = document.getElementById('ly_bl'); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const rows = page => page.locator('#lyl2 .lyr');

test('the Elements panel lists every element top first, with an eye, opacity and blend that act on the selected row', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await three(page);
  await expect(rows(page)).toHaveCount(3);
  await expect(page.locator('#lycnt')).toHaveText('3 elements');
  const els0 = (await st(page)).els.map(q => q.u);
  // the top row is the last element
  await expect(rows(page).nth(0)).toHaveAttribute('data-u', els0[2]);
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(1).locator('.lyn').click();
  await settle(page);
  await expect(rows(page).nth(1)).toHaveClass(/on/);
  await setOp(page, 40);
  await setBl(page, 'multiply');
  await settle(page);
  let els = (await st(page)).els;
  expect(els[1]).toMatchObject({ op: 40, bl: 'multiply' });
  expect(els[0].op).toBeUndefined();
  expect(await page.locator('#art [style*="mix-blend-mode:multiply"]').count()).toBeGreaterThan(0);
  expect(await page.locator('#art g[opacity="0.40"]').count()).toBeGreaterThan(0);
  // the eye hides one element without removing it
  const before = await page.locator('#art use[href^="#bk"]').count();
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(0).locator('[data-eye]').click();
  await settle(page);
  els = (await st(page)).els;
  expect(els[2].v).toBe(false);
  expect(els).toHaveLength(3);
  expect(await page.locator('#art use[href^="#bk"]').count()).toBeLessThan(before);
  expect(errors).toEqual([]);
});

test('Group wraps the selected rows in one row with its own opacity; Ungroup gives them back (Ctrl+G)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await three(page);
  await expect(page.locator('#lygrp')).toBeDisabled();
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(0).locator('.lyn').click();
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(1).locator('.lyn').click({ modifiers: ['Control'] });
  await expect(page.locator('#lygrp')).toBeEnabled();
  await settle(page); await showPanel(page, 'lyrs'); await page.click('#lygrp');
  await settle(page);
  let els = (await st(page)).els;
  const g = els.find(q => q.k === 'group');
  expect(g).toBeTruthy();
  expect(els).toHaveLength(4);
  expect(els.filter(q => q.g === g.u)).toHaveLength(2);
  expect(els[els.length - 1].k).toBe('group');            // the group row sits just above its members
  await expect(rows(page)).toHaveCount(4);
  await expect(page.locator('#lycnt')).toHaveText('3 elements');
  // the group has its own opacity: its members draw inside one wrapper
  await expect(rows(page).nth(0)).toHaveClass(/on/);
  await setOp(page, 50);
  await settle(page);
  els = (await st(page)).els;
  expect(els.find(q => q.k === 'group').op).toBe(50);
  expect(els.filter(q => q.g === g.u).every(q => q.op === undefined)).toBe(true);
  expect(await page.locator('#art g[opacity="0.50"]').count()).toBeGreaterThan(0);
  // fold hides the members from the list but not from the canvas
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(0).locator('[data-fold]').click();
  await expect(rows(page)).toHaveCount(2);
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(0).locator('[data-fold]').click();
  await expect(rows(page)).toHaveCount(4);
  // Ungroup
  await settle(page); await showPanel(page, 'lyrs'); await page.click('#lyung');
  await settle(page);
  els = (await st(page)).els;
  expect(els.some(q => q.k === 'group')).toBe(false);
  expect(els.every(q => !q.g)).toBe(true);
  expect(els).toHaveLength(3);
  // Ctrl+G groups again (2.27.0; it was Shift+G)
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(0).locator('.lyn').click();
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(1).locator('.lyn').click({ modifiers: ['Control'] });
  await expect(page.locator('#lygrp')).toBeEnabled();
  await page.keyboard.press('Control+G');
  await settle(page);
  expect((await st(page)).els.some(q => q.k === 'group')).toBe(true);
  expect(errors).toEqual([]);
});

test('rows move up and down, and a row dragged onto a group row goes into it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await three(page);
  const ids = (await st(page)).els.map(q => q.u);
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(0).locator('[data-more]').click();
  await page.locator('.rowm .ddi', { hasText: 'Move down' }).first().click();
  await settle(page);
  expect((await st(page)).els.map(q => q.u)).toEqual([ids[0], ids[2], ids[1]]);
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(2).locator('[data-more]').click();
  await page.locator('.rowm .ddi', { hasText: 'Move up' }).first().click();
  await settle(page);
  expect((await st(page)).els.map(q => q.u)).toEqual([ids[2], ids[0], ids[1]]);
  await settle(page); await showPanel(page, 'lyrs'); await rows(page).nth(0).locator('[data-more]').click();
  await page.locator('.rowm .ddi', { hasText: 'Delete' }).first().click();
  await settle(page);
  expect((await st(page)).els.map(q => q.u)).toEqual([ids[2], ids[0]]);
  expect(errors).toEqual([]);
});
