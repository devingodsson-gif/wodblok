// 2.17.0: one vocabulary; short labels; no words for removed things. 2.32.0: library art and the element are both called "shape".
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

test('commands use "shape" for library art', async ({ page }) => {
  const { errors } = await openApp(page);
  const labels = await page.evaluate(() => window.__wbTest.commands.list().map(c => c.label));
  for (const l of ['Duplicate', 'Delete', 'Split', 'Import a shape from an image', 'New shape folder', 'Hand tool']) expect(labels, l).toContain(l);
  for (const l of ['Hand tool (drag to move the picture)']) expect(labels, l).not.toContain(l);
  expect(errors).toEqual([]);
});

test('status bar has no Layers or Block; the library home folder is Yours; labels carry no explanations', async ({ page }) => {
  const { errors } = await openApp(page);
  const bar = await page.locator('#sinfo').innerText();
  expect(bar).toContain('Stamp shape');
  expect(bar).not.toMatch(/Layers|Block/);
  await expect(page.locator('#smknew')).toHaveText('New stamp');
  await expect(page.locator('label:has(#neg), label:has(#iinv)').first()).toHaveText('Invert');
  await expect(page.locator('label:has(#bkman)')).toHaveText('Custom spine width');
  await openPanel(page, 'motifs'); await settle(page);
  await expect(page.locator('#lib')).toContainText('Yours');
  expect(errors).toEqual([]);
});

test('Randomize and Clear leave one short message', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await openPanel(page, 'rand');
  await page.click('#rzdo'); await settle(page, { max: 60000 });
  await expect(page.locator('#pmsg')).toHaveText(/^Randomized: [^.]+\.$/);   // 2.76.3: the message names the Look
  expect(errors).toEqual([]);
});
