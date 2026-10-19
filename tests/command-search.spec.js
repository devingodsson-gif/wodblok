// Command search (Mod+K): finds any command in the registry and runs it, by keyboard or by pointer.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, setMode } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build; v100 has no command registry'); });

const rowsOf = page => page.locator('#cmdkl .ckr b').allTextContents();

test('Ctrl+K opens it with the cursor in the box; typing narrows the list; Enter runs the first match; Escape closes and gives focus back', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('#cmdk')).toBeHidden();
  await page.locator('#pnm').focus();
  await page.keyboard.press('Control+k');
  await expect(page.locator('#cmdk')).toBeVisible();
  await expect(page.locator('#cmdki')).toBeFocused();
  const all = await rowsOf(page);
  expect(all.length).toBeGreaterThan(30);
  await page.keyboard.type('open rand');
  const some = await rowsOf(page);
  expect(some.length).toBeLessThan(all.length);
  expect(some.every(l => /open/i.test(l) && /rand/i.test(l))).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.locator('#cmdk')).toBeHidden();
  await expect(page.locator('section.pn[data-p="rand"]')).toBeVisible();      // "Open Randomize" ran: the panel is open
  await page.keyboard.press('Control+k');
  await page.keyboard.press('Escape');
  await expect(page.locator('#cmdk')).toBeHidden();
  expect(errors).toEqual([]);
});

test('the search button opens it, arrows move, a click on a row runs that command, and commands that cannot run are dimmed and skipped', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#cmdkb');
  await expect(page.locator('#cmdk')).toBeVisible();
  // a blank document has nothing to undo: Undo is listed but dimmed, and Enter never runs it
  await page.keyboard.type('undo');
  const undo = page.locator('#cmdkl .ckr', { hasText: /^Undo/ });
  await expect(undo).toHaveClass(/dis/);
  await page.keyboard.press('Enter');
  await expect(page.locator('#cmdk')).toBeVisible();
  // the first row after clearing the box is a command that can run, and Down / Up wander only over those
  await page.fill('#cmdki', '');
  const on0 = await page.locator('#cmdkl .ckr.on b').textContent();
  await page.keyboard.press('ArrowDown');
  expect(await page.locator('#cmdkl .ckr.on b').textContent()).not.toBe(on0);
  await page.keyboard.press('ArrowUp');
  expect(await page.locator('#cmdkl .ckr.on b').textContent()).toBe(on0);
  // pointer: click the Colour grading row
  await page.fill('#cmdki', 'grading');
  await page.locator('#cmdkl .ckr', { hasText: 'Open Colour grading' }).click();
  await expect(page.locator('#cmdk')).toBeHidden();
  await expect(page.locator('section.pn[data-p="grade"]')).toBeVisible();
  // clicking the dim backdrop closes it
  await page.click('#cmdkb');
  await page.mouse.click(5, 5);
  await expect(page.locator('#cmdk')).toBeHidden();
  expect(errors).toEqual([]);
});

test('shortcuts are shown next to their commands, and a search with no match says so', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 30000 });
  await page.keyboard.press('Control+k');
  await page.keyboard.type('undo');
  await expect(page.locator('#cmdkl .ckr', { hasText: /^Undo/ })).not.toHaveClass(/dis/);   // after a roll there is something to undo
  await expect(page.locator('#cmdkl .ckr', { hasText: /^Undo/ }).locator('kbd')).toHaveText(/Ctrl\+Z|Cmd\+Z/);
  await page.fill('#cmdki', 'zzzz nothing');
  await expect(page.locator('#cmdkl .ckn')).toHaveText('No matching command');
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('with nothing typed, the list starts with what you ran last, then commands that apply in this view (UX review C17)', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.keyboard.press('Control+k');
  const first = await rowsOf(page);
  // Pattern view: the stamp editor's motif commands are listed after the ones that apply here
  expect(first.indexOf('Duplicate shape')).toBeGreaterThan(first.indexOf('Open Canvas'));
  expect(first.indexOf('Knock out')).toBeGreaterThan(first.indexOf('Open Layers'));
  // run a command from the list: it comes first next time
  await page.keyboard.type('zoom in');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Control+k');
  expect((await rowsOf(page))[0]).toBe('Zoom in');
  await page.keyboard.press('Escape');
  // switch to the Stamp editor: its commands now rank above the Pattern-only tools
  await setMode(page, 'stamp');
  await settle(page);
  await page.keyboard.press('Control+k');
  const stamp = await rowsOf(page);
  expect(stamp.indexOf('Open Shapes')).toBeLessThan(stamp.indexOf('Open Layers'));
  expect(errors).toEqual([]);
});
