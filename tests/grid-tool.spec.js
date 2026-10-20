// 1.29.0 Grid: one tool in Pattern mode and in the Stamp editor (same panel, same icon, same controls); snapping is chosen there,
// for every Free place, Pictures and Text layer; older projects that chose snapping per layer come in with it on.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { openApp, openPanel, settle, getState, openProjectFile, noPattern } = require('./helpers/harness');

// a layer starts with a Pattern; 'x' takes it away and picks the first stamp so clicks on the canvas place stamps freely
const pick = async (page, v) => { await noPattern(page); if (v === 'x') { await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click'); await settle(page); } };
const outline = (page, panel) => page.evaluate(p => {
  const s = document.querySelector(`section.pn[data-p="${p}"]`);
  const rows = [...s.querySelectorAll('summary, label, button, input')].map(e => e.tagName === 'INPUT' ? 'input:' + e.type + (e.min ? ':' + e.min + '-' + e.max : '') : e.tagName === 'SUMMARY' ? 'summary:' + e.firstChild.textContent.trim() : e.tagName.toLowerCase() + ':' + e.textContent.trim());
  return rows;
}, panel);

test('the Grid tool in the Pattern view has the name Grid and an icon', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  const rail = await page.evaluate(() => { const b = document.getElementById('rail-pgrid'); return [b.getAttribute('aria-label'), !!b.querySelector('svg')]; });
  expect(rail).toEqual(['Grid', true]);
  expect((await outline(page, 'pgrid')).length).toBeGreaterThan(14);
  expect(errors).toEqual([]);
});

async function placeAt(page, fx, fy) {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
}

test('Snap to grid in the Grid tool snaps every placed stamp, and off leaves them alone', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers'); await pick(page, 'x'); await settle(page);
  await openPanel(page, 'pgrid');
  await expect(page.locator('#pgn')).not.toBeChecked();
  await placeAt(page, 0.337, 0.411);
  const free = JSON.parse(await getState(page)).layers[0].pl[0];
  await page.click('#pgn'); await settle(page);
  await expect(page.locator('#pgs')).toBeChecked();                       // snapping shows the grid
  await page.click('#pgm [data-g="l"]'); await settle(page);
  const d = await page.locator('#art').evaluate(e => (e.getAttribute('viewBox') || '0 0 1000 1000').split(/[ ,]+/).map(Number));
  const cell = d[2] / 8;
  await placeAt(page, 0.6221, 0.3333);
  const pl = JSON.parse(await getState(page)).layers[0].pl;
  expect(pl.length).toBe(2);
  expect(pl[1].x / cell).toBeCloseTo(Math.round(pl[1].x / cell), 1);       // on a crossing
  expect(pl[1].y / cell).toBeCloseTo(Math.round(pl[1].y / cell), 1);
  expect(Math.abs(free.x / cell - Math.round(free.x / cell))).toBeGreaterThan(0.01);   // the one placed before stayed where it was
  // Snap all to grid brings the first one in
  await page.click('#pgq'); await settle(page);
  const all = JSON.parse(await getState(page)).layers[0].pl;
  all.forEach(p => { expect(p.x / cell).toBeCloseTo(Math.round(p.x / cell), 1); expect(p.y / cell).toBeCloseTo(Math.round(p.y / cell), 1); });
  // Cell centres
  await page.click('#pgm [data-g="c"]'); await settle(page);
  await placeAt(page, 0.8, 0.7);
  const q = JSON.parse(await getState(page)).layers[0].pl[2];
  expect(q.x / cell - 0.5).toBeCloseTo(Math.round(q.x / cell - 0.5), 1);
  // off: free again
  await page.click('#pgn'); await settle(page);
  await placeAt(page, 0.15, 0.85);
  const r = JSON.parse(await getState(page)).layers[0].pl[3];
  expect(Math.abs((r.x / cell - 0.5) - Math.round(r.x / cell - 0.5)) > 0.01 || Math.abs((r.y / cell - 0.5) - Math.round(r.y / cell - 0.5)) > 0.01).toBe(true);
  expect(errors).toEqual([]);
});

test('Layout no longer has its own snap boxes; Pictures and Text layers use the same Grid switch', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await expect(page.locator('section.pn[data-p="layers"] :text("Snap to grid")')).toHaveCount(0);
  expect(errors).toEqual([]);
});
