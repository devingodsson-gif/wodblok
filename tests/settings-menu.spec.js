// 1.14: the Settings dialog. File menu item and command, six pages, accent colour (presets, custom, both themes, contrast, remembered),
// theme and stage dots, tray places, reduce motion, draft toggle, autosave interval, storage line, searchable shortcuts, About.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET !== 'build' && TARGET !== 'esm', 'new in the repo build'); });

const open = async page => { await page.click('#fileb'); await page.click('#stgo'); await expect(page.locator('#stgdlg')).toBeVisible(); };
const go = async (page, p) => { await page.click(`#stgnav [data-p="${p}"]`); await expect(page.locator(`#stgnav [data-p="${p}"]`)).toHaveAttribute('aria-selected', 'true'); };
const tok = (page, n) => page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), n);
const kvGet = (page, k) => page.evaluate(k => window.__wbTest.kv.get(k), k);
// contrast of the accent ink on the theme's panel, measured in the page from the real computed tokens
const inkContrast = page => page.evaluate(() => {
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const probe = document.createElement('i'); document.body.appendChild(probe);
  const rgb = v => { probe.style.color = v; const m = getComputedStyle(probe).color.match(/[\d.]+/g).map(Number); return m.slice(0, 3); };
  const L = c => { const a = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const a = L(rgb(css('--acc-ink'))), b = L(rgb(css('--panel')));
  probe.remove(); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
});

test('launch has no settings window open, and File > Settings… is the last File item', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('#stgdlg')).toBeHidden();
  await page.click('#fileb');
  await expect(page.locator('#filem > button, #filem > label')).toHaveText(['New project', 'New from template…', 'Clear canvas', 'Open project…', 'Save as template…', 'Settings…']);
  expect(errors).toEqual([]);
});

test('the dialog has six pages, opens on General, keeps arrow-key order, closes on Esc and returns focus', async ({ page }) => {
  const { errors } = await openApp(page);
  await open(page);
  await expect(page.locator('#stgnav button')).toHaveText(['General', 'Colour', 'Speed', 'Files', 'Shortcuts', 'About']);
  await expect(page.locator('#stgnav [data-p="general"]')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#stgnav [data-p="colour"]')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.locator('#stgnav [data-p="about"]')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#stgdlg')).toBeHidden();
  await expect(page.locator('#fileb')).toBeFocused();
  expect(errors).toEqual([]);
});

test('the settings.open command is registered and opens the dialog', async ({ page }) => {
  await openApp(page);
  const c = await page.evaluate(() => { const x = window.__wbTest.commands.get('settings.open'); return x && { label: x.label, enabled: x.enabled() }; });
  expect(c).toEqual({ label: 'Settings', enabled: true });
  await page.evaluate(() => window.__wbTest.commands.run('settings.open'));
  await expect(page.locator('#stgdlg')).toBeVisible();
});

test('General: theme and stage dots follow the existing controls', async ({ page }) => {
  await openApp(page);
  await open(page);
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('dark');
  await page.click('#stgth [data-v="light"]');
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('light');
  await expect(page.locator('#stgth [data-v="light"]')).toHaveClass(/on/);
  await expect(page.locator('#stgdt')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#stgdt');
  expect(await page.evaluate(() => document.body.classList.contains('plain'))).toBe(true);
  await expect(page.locator('#stgdt')).toHaveAttribute('aria-pressed', 'false');
});

test('accent: a preset recolours both themes, stays readable, is remembered, and Bronze restores the stylesheet values', async ({ page }) => {
  const { errors } = await openApp(page);
  const bronzeDark = await tok(page, '--acc');
  await open(page);
  await page.click('#stgacc [aria-label="Plum"]');
  await expect(page.locator('#stgacc [aria-label="Plum"]')).toHaveAttribute('aria-pressed', 'true');
  const plumDark = await tok(page, '--acc');
  expect(plumDark).not.toBe(bronzeDark);
  expect(await inkContrast(page)).toBeGreaterThanOrEqual(4.5);
  await page.click('#stgth [data-v="light"]');
  const plumLight = await tok(page, '--acc');
  expect(plumLight).not.toBe(plumDark);
  expect(await inkContrast(page)).toBeGreaterThanOrEqual(4.5);
  expect(await kvGet(page, 'wb114_accent')).toBe('#8a5aa6');
  await page.reload();
  await page.waitForFunction(() => window.__wbTest && document.fonts.status === 'loaded');
  expect(await tok(page, '--acc')).toBe(plumLight);
  await open(page);
  await page.click('#stgacc [aria-label="Bronze"]');
  expect(await kvGet(page, 'wb114_accent')).toBeNull();
  expect(await page.evaluate(() => (document.getElementById('accstyle') || { textContent: '' }).textContent)).toBe('');
  expect(await tok(page, '--acc')).toBe('#b8914f');
  expect(errors).toEqual([]);
});

test('accent: every preset keeps its ink readable on both panels', async ({ page }) => {
  await openApp(page);
  await open(page);
  const names = await page.$$eval('#stgacc .stgab:not(.stgac)', bs => bs.map(b => b.getAttribute('aria-label')));
  expect(names.length).toBe(8);
  for (const n of names) {
    await page.click(`#stgacc [aria-label="${n}"]`);
    for (const t of ['dark', 'light']) {
      await page.click(`#stgth [data-v="${t}"]`);
      expect(await inkContrast(page), n + ' ' + t).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('accent: Custom opens the colour picker above the dialog and a typed hex sets the accent', async ({ page }) => {
  await openApp(page);
  await open(page);
  await page.click('#stgacc .stgac');
  const pk = page.locator('.cpk:not([hidden])');
  await expect(pk).toBeVisible();
  const hex = pk.locator('[data-f="hex"]');
  await hex.fill('#336699');
  await hex.press('Enter');
  expect(await kvGet(page, 'wb114_accent')).toBe('#336699');
  await expect(page.locator('#stgacc .stgac')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#stgdlg')).toBeVisible();   // the first Escape closes the picker only
  await page.keyboard.press('Escape');
  await expect(page.locator('#stgdlg')).toBeHidden();
});

test('Colour: Places shown changes the tray dock; Clear empties the recent colours', async ({ page }) => {
  await openApp(page);
  const places = () => page.locator('#tyc .tys, #tyc .tye').count();
  const before = await places();
  await open(page); await go(page, 'colour');
  await page.locator('#stgtv').fill('12');
  await expect(page.locator('#stgtvo')).toHaveText('12');
  expect(await places()).toBeGreaterThan(before);
  expect(await kvGet(page, 'wb114_trayview')).toBe('12');
  await page.evaluate(() => window.__wbTest.kv.set('wb200_recent', JSON.stringify(['#112233'])));
  await page.click('#stgrc');
  expect(await kvGet(page, 'wb200_recent')).toBeNull();
});

test('Speed: Reduce motion and Draft while dragging are remembered', async ({ page }) => {
  await openApp(page);
  await open(page); await go(page, 'speed');
  await expect(page.locator('#stgdr')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#stgca')).toHaveAttribute('aria-pressed', 'false');
  await page.click('#stgca');
  expect(await page.evaluate(() => document.body.classList.contains('calm'))).toBe(true);
  await page.click('#stgdr');
  expect(await kvGet(page, 'wb114_draft')).toBe('0');
  expect(await kvGet(page, 'wb114_calm')).toBe('1');
  await page.reload();
  await page.waitForFunction(() => window.__wbTest && document.fonts.status === 'loaded');
  expect(await page.evaluate(() => document.body.classList.contains('calm'))).toBe(true);
});

test('Files: autosave interval is remembered and the storage line shows', async ({ page }) => {
  await openApp(page);
  await open(page); await go(page, 'files');
  await page.click('#stgas [data-v="30"]');
  await expect(page.locator('#stgas [data-v="30"]')).toHaveClass(/on/);
  expect(await kvGet(page, 'wb114_autosave')).toBe('30');
  await expect(page.locator('#stguse')).not.toHaveText('…');
});

test('Shortcuts: a searchable list from the command registry', async ({ page }) => {
  await openApp(page);
  await open(page); await go(page, 'shortcuts'.replace('shortcuts', 'keys'));
  const all = await page.locator('#stgkl .stgkr').count();
  expect(all).toBeGreaterThan(8);
  await page.fill('#stgkq', 'undo');
  const rows = page.locator('#stgkl .stgkr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Undo');
  await page.fill('#stgkq', 'zzzz');
  await expect(page.locator('#stgkl')).toContainText('No match');
});

test('About: shows the version from the page title and the licences', async ({ page }) => {
  await openApp(page);
  await open(page); await go(page, 'about');
  const ver = (await page.title()).replace(/^Wodblok /, '');
  await expect(page.locator('#stgbody')).toContainText(ver);
  await expect(page.locator('#stgbody')).toContainText('SIL OFL 1.1');
  await expect(page.locator('#stgbody')).toContainText('fflate');
});

test('the dialog fits a phone: pages become a row and nothing overflows sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await openApp(page);
  await page.evaluate(() => window.__wbTest.commands.run('settings.open'));
  await expect(page.locator('#stgdlg')).toBeVisible();
  const w = await page.evaluate(() => { const d = document.querySelector('.stgd').getBoundingClientRect(); return { right: d.right, vw: innerWidth, sb: document.getElementById('stgbody').scrollWidth - document.getElementById('stgbody').clientWidth }; });
  expect(w.right).toBeLessThanOrEqual(w.vw);
  expect(w.sb).toBeLessThanOrEqual(1);
});
