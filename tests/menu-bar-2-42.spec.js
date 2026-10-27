// 2.42.0: the menu bar (owner, Oct 24 2026). File, Export, Edit, Image (2.44.0), Elements, Effects, Colour, View, Window, Help across the top, each item a command
// from the registry: same label, same shortcut, greyed out exactly when the command is. Click or keyboard; with one menu open, the pointer moves along the bar.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, addShape } = require('./helpers/harness');

const NAMES = ['File', 'Export', 'Edit', 'Image', 'Elements', 'Effects', 'Colour', 'View', 'Window', 'Help'];
const BARS = ['fileb', 'mnb-export', 'mnb-edit', 'mnb-image', 'mnb-elements', 'mnb-effects', 'mnb-colour', 'mnb-view', 'mnb-window', 'mnb-help'];
const open = async (page, id) => { await page.click('#' + id); await expect(page.locator('#' + id)).toHaveAttribute('aria-expanded', 'true'); };
const item = (page, menu, label) => page.locator(`#${menu} [data-cmd]`, { hasText: label }).first();

test('the bar lists the menus in order, and every item is a command with its state', async ({ page }) => {
  const { errors } = await openApp(page);
  expect(await page.locator('#mbar .mnbb').allTextContents()).toEqual(NAMES);
  for (const b of BARS.slice(1)) {
    await open(page, b);
    const menu = await page.locator('#' + b).getAttribute('aria-controls');
    const rows = await page.evaluate(m => [...document.querySelectorAll('#' + m + ' [data-cmd]')].map(x => ({ id: x.dataset.cmd, off: x.disabled, label: x.querySelector('.mnbt').textContent, kbd: (x.querySelector('kbd') || {}).textContent || '' })), menu);
    expect(rows.length, b).toBeGreaterThan(1);
    for (const r of rows) {
      const c = await page.evaluate(id => { const t = window.__wbTest.commands, x = t.get(id); return x && { label: x.label, on: t.isEnabled(id), sc: x.shortcut ? t.formatShortcut(x.shortcut, false) : '' }; }, r.id);
      expect(c, r.id).toBeTruthy();
      expect(r.off, r.id).toBe(!c.on);
      expect(r.label.replace(/…$/, ''), r.id).toBe(c.label);
      expect(r.kbd, r.id).toBe(c.sc);
    }
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('.pop.mnbm:not([hidden])')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('an item runs its command; on/off commands are ticked', async ({ page }) => {
  const { errors } = await openApp(page);
  await open(page, 'mnb-view');
  await expect(item(page, 'mnbm-view', 'Show grid')).toHaveAttribute('aria-checked', 'false');
  await item(page, 'mnbm-view', 'Show grid').click();
  await expect(page.locator('#mnbm-view')).toBeHidden();
  expect(await page.locator('#pgs').isChecked()).toBe(true);
  await open(page, 'mnb-view');
  await expect(item(page, 'mnbm-view', 'Show grid')).toHaveAttribute('aria-checked', 'true');
  await expect(item(page, 'mnbm-view', 'Show grid').locator('.ic')).toHaveCount(1);
  await page.keyboard.press('Escape');
  // Help > Keyboard shortcuts opens Settings on its Shortcuts page
  await open(page, 'mnb-help');
  await item(page, 'mnbm-help', 'Keyboard shortcuts').click();
  await expect(page.locator('#stgnav .on')).toHaveText('Shortcuts');
  expect(errors).toEqual([]);
});

test('Effects adds an effect to the selected element; Align opens as a submenu', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await open(page, 'mnb-effects');
  await expect(item(page, 'mnbm-effects', 'Jitter')).toBeDisabled();   // nothing selected
  await page.keyboard.press('Escape');
  await addShape(page); await settle(page);
  await open(page, 'mnb-effects');
  await item(page, 'mnbm-effects', 'Jitter').click(); await settle(page);
  // 2.55.0: its settings open in the effect pop-out; Apply keeps it
  await expect(page.locator('.fxwin .fxs[data-e="jitter"]')).toBeVisible();
  await page.click('.fxwin .fxwa'); await settle(page);
  const d = JSON.parse(await getState(page)), q = (d.els || []).find(x => x.k === 'motif' && !x.bgd);
  expect((q.fx || []).map(e => e.k)).toEqual(['jitter']);
  // a group of effects (Blur) is a submenu
  await open(page, 'mnb-effects');
  await page.locator('#mnbm-effects .mnbs', { hasText: 'Blur' }).hover();
  await expect(page.locator('.mnbsub [data-cmd]').first()).toBeVisible();
  // Edit > Align is a submenu of the align commands; hovering another item closes it
  await open(page, 'mnb-edit');
  await expect(page.locator('.mnbsub')).toHaveCount(0);
  await page.locator('#mnbm-edit .mnbs', { hasText: 'Align' }).hover();
  await expect(page.locator('.mnbsub [data-cmd="align.4"]')).toBeVisible();
  await item(page, 'mnbm-edit', 'Fit shape to canvas').hover();
  await expect(page.locator('.mnbsub')).toHaveCount(0);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('keyboard and pointer move along the bar', async ({ page }) => {
  const { errors } = await openApp(page);
  // ArrowDown on a menu name opens it at its first item; right and left move to the next menu; Escape closes and returns focus
  await page.focus('#fileb');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#filem')).toBeVisible();
  await expect(page.locator('#pnw')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#tpnew')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#mnbm-export')).toBeVisible();
  await expect(page.locator('#filem')).toBeHidden();
  await expect(page.locator('#mnbm-export [data-cmd="file.export"]')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#filem')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#filem')).toBeHidden();
  await expect(page.locator('#fileb')).toBeFocused();
  // with a menu open, pointing at another menu name opens that one, and the click that follows keeps it open
  await open(page, 'mnb-edit');
  await page.hover('#mnb-view');
  await expect(page.locator('#mnbm-view')).toBeVisible();
  await expect(page.locator('#mnbm-edit')).toBeHidden();
  await page.click('#mnb-view');
  await expect(page.locator('#mnbm-view')).toBeVisible();
  await page.click('#mnb-view');   // a second click closes it
  await expect(page.locator('#mnbm-view')).toBeHidden();
  // with no menu open, pointing does nothing
  await page.hover('#mnb-help');
  await expect(page.locator('#mnbm-help')).toBeHidden();
  expect(errors).toEqual([]);
});
