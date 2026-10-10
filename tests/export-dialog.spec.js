// Exports ask where to save first and render afterwards, so the browser's Save dialog still counts the click as recent (before, a long export
// lost the dialog and silently downloaded). Cancelling the dialog stops the export. (1.0.10, Q14)
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

async function mockPicker(page, { cancel = false } = {}) {
  await page.evaluate(cancel => {
    window.__log = []; window.__bytes = [];
    window.showSaveFilePicker = async o => {
      window.__log.push({ ev: 'picker', name: o.suggestedName, msg: document.getElementById('pmsg').textContent });
      if (cancel) throw Object.assign(new Error('cancelled'), { name: 'AbortError' });
      return { createWritable: async () => ({ write: async d => { window.__bytes.push(new Uint8Array(await new Blob([d]).arrayBuffer()).slice(0, 4)); window.__log.push({ ev: 'write' }); }, close: async () => {} }) };
    };
  }, cancel);
}
const log = page => page.evaluate(() => window.__log.map(x => x.ev + (x.name ? ':' + x.name : '')));

test('Export now opens the Save dialog before it renders, then writes into the chosen file', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5, runtime: 'none' });
  await openPanel(page, 'xrec');
  await mockPicker(page);
  await page.click('#xrnow');
  await expect.poll(() => log(page), { timeout: 60000 }).toHaveLength(2);
  const l = await page.evaluate(() => window.__log);
  expect(l.map(x => x.ev)).toEqual(['picker', 'write']);
  expect(l[0].msg, 'the dialog came before the "Exporting…" message').not.toContain('Exporting');
  expect(l[0].name).toMatch(/\.png$/);
  expect(await page.evaluate(() => Array.from(window.__bytes[0]))).toEqual([0x89, 0x50, 0x4e, 0x47]);     // a PNG
  expect(errors).toEqual([]);
});

test('Export all as one zip asks first too, and writes one zip', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5, runtime: 'none' });
  await openPanel(page, 'xrec');
  await mockPicker(page);
  await page.click('#xrall');
  await expect.poll(() => log(page), { timeout: 120000 }).toHaveLength(2);
  const l = await page.evaluate(() => window.__log);
  expect(l.map(x => x.ev)).toEqual(['picker', 'write']);
  expect(l[0].name).toMatch(/-exports\.zip$/);
  expect(l[0].msg).not.toMatch(/Exporting \d/);
  expect(await page.evaluate(() => Array.from(window.__bytes[0]))).toEqual([0x50, 0x4b, 0x03, 0x04]);    // a zip
  expect(errors).toEqual([]);
});

test('cancelling the Save dialog stops the export: nothing is rendered or written', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5, runtime: 'none' });
  await openPanel(page, 'xrec');
  await mockPicker(page, { cancel: true });
  await page.click('#xrnow');
  await expect.poll(() => page.evaluate(() => window.__log.length)).toBe(1);
  await page.waitForTimeout(1500);
  expect((await page.evaluate(() => window.__log.map(x => x.ev)))).toEqual(['picker']);
  await expect(page.locator('#pmsg')).not.toContainText('Exporting');
  expect(errors).toEqual([]);
});
