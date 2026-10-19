// The command registry (Phase 2e): every user action is a named command. These tests keep the registry and the buttons it
// drives in step, and keep the documented shortcuts honest (a shortcut listed in the table must really do that today).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

const cmds = page => page.evaluate(() => window.__wbTest.commands.list().map(c => ({ id: c.id, label: c.label, shortcut: c.shortcut || null, elId: c.elId })));

test('every command has a label and a real button behind it, and shortcuts do not clash', async ({ page }) => {
  const { errors } = await openApp(page);
  const list = await cmds(page);
  expect(list.length).toBeGreaterThanOrEqual(20);
  expect(new Set(list.map(c => c.id)).size).toBe(list.length);
  for (const c of list) {
    expect(c.label, c.id).toBeTruthy();
    expect(await page.locator('#' + c.elId).count(), `${c.id} -> #${c.elId}`).toBe(1);
  }
  expect(await page.evaluate(() => window.__wbTest.commands.conflicts())).toEqual([]);
  expect(await page.evaluate(() => [window.__wbTest.commands.formatShortcut('Mod+Shift+Z', true), window.__wbTest.commands.formatShortcut('Mod+Shift+Z', false)])).toEqual(['Cmd+Shift+Z', 'Ctrl+Shift+Z']);
  expect(errors).toEqual([]);
});

test('running a command does what its button does', async ({ page }) => {
  const { errors } = await openApp(page);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).not.toBe('light');
  expect(await page.evaluate(() => window.__wbTest.commands.run('view.theme'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  expect(await page.evaluate(() => window.__wbTest.commands.run('no.such.command'))).toBe(false);
  expect(await page.evaluate(() => window.__wbTest.commands.run('file.save'))).toBe(true);
  await settle(page);
  await page.waitForFunction(() => window.__wbDownloads.some(d => /\.wodblok$/.test(d.filename)));
  expect(errors).toEqual([]);
});

test('a disabled button means a disabled command', async ({ page }) => {
  const { errors } = await openApp(page);
  const r = await page.evaluate(() => { const c = window.__wbTest.commands; return c.list().map(x => [x.id, c.isEnabled(x.id), c.run.length >= 0]); });
  for (const [id, enabled] of r) {
    const el = await page.evaluate(id => { const c = window.__wbTest.commands.get(id); const b = document.getElementById(c.elId); return { hidden: b.hidden, disabled: !!b.disabled, input: b.tagName === 'INPUT' }; }, id);
    expect(enabled, id).toBe(el.input ? true : !el.hidden && !el.disabled);
  }
  expect(errors).toEqual([]);
});

test('documented shortcuts really work', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  // "\" turns Before on, and pressing it again turns it off (needs something to compare against); holding it peeks
  await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 30000 });
  await expect(page.locator('#fzst')).not.toHaveClass(/on/);   // the roll's hold is over; a key pressed while it is on is ignored
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  // a tap keeps Before on; holding it is a peek that ends when the key is let go (the picture being compared is the current one after a roll)
  await page.keyboard.press('Backslash');
  await expect(page.locator('#bab')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Backslash');
  await expect(page.locator('#bab')).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.down('Backslash');
  await expect(page.locator('#bab')).toHaveAttribute('aria-pressed', 'true');   // it takes a moment to get the other picture ready
  await page.waitForSelector('.baov');   // the other picture is on screen (the button reads pressed while it is still being made; letting go before it is ready leaves Before on, as a tap does)
  await page.waitForTimeout(500);
  await page.keyboard.up('Backslash');
  await expect(page.locator('#bab')).toHaveAttribute('aria-pressed', 'false');
  // Mod+S clicks Save
  await page.evaluate(() => { window.__saveClicks = 0; document.getElementById('psv').addEventListener('click', () => { window.__saveClicks++; }); });
  await page.keyboard.press('Control+s'); await settle(page);
  expect(await page.evaluate(() => window.__saveClicks)).toBe(1);
  // Mod+Z is Undo
  expect((await page.evaluate(() => window.__wbTest.commands.get('edit.undo').shortcut))).toBe('Mod+Z');
  expect(errors).toEqual([]);
});
