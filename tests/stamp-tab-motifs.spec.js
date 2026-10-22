// 2.15.0: a stamp's tab works on its own, with no Pattern anywhere in the project: Add motif makes a motif you can move, a library motif is a ghost on the pointer
// and a click puts it in the stamp.
const { test, expect } = require('@playwright/test');
const { openApp, showPanel, settle, getState, addKind } = require('./helpers/harness');

const items = async page => JSON.parse(await getState(page)).tiles[0].items.map(q => ({ m: q.m, x: q.x, y: q.y }));
async function newStampTab(page) {
  await showPanel(page, 'stmp');
  await page.click('#smknew'); await settle(page);
  await page.click('#smkedit'); await settle(page);
  await showPanel(page, 'motifs');
}

test('in a stamp tab of an empty project, Add motif makes a motif that can be dragged', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await newStampTab(page);
  await addKind(page, 'motif'); await settle(page);
  expect(await items(page)).toHaveLength(1);
  await expect(page.locator('#stoh .steh')).toHaveCount(9);          // the box and its eight handles
  const [x0, y0] = [(await items(page))[0].x, (await items(page))[0].y];
  const b = await page.locator('#art').boundingBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 60, cy + 40, { steps: 5 }); await page.mouse.up(); await settle(page);
  const m = (await items(page))[0];
  expect(m.x).toBeGreaterThan(x0 + 5); expect(m.y).toBeGreaterThan(y0 + 5);
  expect(errors).toEqual([]);
});

test('in a stamp tab of an empty project, a library motif is a ghost on the pointer and a click puts it in the stamp', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await newStampTab(page);
  await page.locator('#lib .lfr[data-f^="b:"]').first().click();
  await page.locator('#lib button[data-m]').first().click(); await settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.3, { steps: 3 }); await settle(page);
  await expect(page.locator('#stoh .stgh')).toHaveCount(1);
  await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.3); await settle(page);
  expect(await items(page)).toHaveLength(1);
  await page.mouse.click(b.x + b.width * 0.7, b.y + b.height * 0.7); await settle(page);
  expect(await items(page)).toHaveLength(2);                           // it stays armed: another click, another motif
  expect(errors).toEqual([]);
});

test('the other things a stamp tab offers work in an empty project: Add text, the Stamp shape, Symmetry', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await newStampTab(page);
  await showPanel(page, 'text');
  await addKind(page, 'text'); await settle(page);
  expect((await items(page)).length).toBeGreaterThan(0);
  await showPanel(page, 'stmp');
  await expect(page.locator('section.pn[data-p="stmp"] summary', { hasText: /^Stamp shape$/ })).toBeVisible();
  await page.click('#skind [data-k="circle"]'); await settle(page);
  expect(JSON.parse(await getState(page)).tiles[0].sh.k).toBe('circle');
  await page.locator('#sym button').nth(1).click(); await settle(page);
  expect(JSON.parse(await getState(page)).tiles[0].sym.m).not.toBe('off');
  expect(errors).toEqual([]);
});

// the corner handles (2.15.0): a plain corner stretches one side, Ctrl or Cmd scales both
test('in a stamp tab a corner pulled sideways widens, pulled down makes taller; Ctrl scales both', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await newStampTab(page);
  await addKind(page, 'motif'); await settle(page);
  const q = async () => JSON.parse(await getState(page)).tiles[0].items[0];
  const corner = async () => { const r = await page.locator('#stoh [data-hd="se"]').boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  const pull = async (dx, dy, ctrl) => { const c = await corner(); if (ctrl) await page.keyboard.down('Control'); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + dx, c.y + dy, { steps: 6 }); await page.mouse.up(); if (ctrl) await page.keyboard.up('Control'); await settle(page); };
  const a = await q();
  await pull(50, 2);
  const b = await q();
  expect(b.sx || 1).toBeGreaterThan((a.sx || 1) * 1.05); expect(b.sy || 1).toBe(a.sy || 1); expect(b.s).toBe(a.s);
  await pull(2, 50);
  const c = await q();
  expect(c.sy || 1).toBeGreaterThan((b.sy || 1) * 1.05); expect(c.sx || 1).toBe(b.sx || 1);
  await pull(40, 40, true);
  const d = await q();
  expect(d.s).toBeGreaterThan(c.s * 1.05);
  expect(errors).toEqual([]);
});
