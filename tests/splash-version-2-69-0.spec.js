// 2.69.0: the loading screen shows the version number under the name, the same text as the status bar's.
const { test, expect } = require('@playwright/test');
const { openApp } = require('./helpers/harness');

test('the loading screen shows the version, the same as the status bar', async ({ page }) => {
  await page.addInitScript(() => {
    window.__splSeen = null;
    new MutationObserver(() => { const e = document.getElementById('splver'); if (e && e.textContent) window.__splSeen = { text: e.textContent, shown: !!e.offsetParent, size: getComputedStyle(e).fontSize }; }).observe(document, { childList: true, subtree: true, characterData: true });
  });
  const { errors } = await openApp(page);
  const ver = await page.locator('footer.status #ver').textContent();
  const seen = await page.evaluate(() => window.__splSeen);
  expect(seen && seen.text).toBe(ver);
  expect(ver).toMatch(/^v\d+\.\d+/);
  expect(seen.shown).toBe(true);
  expect(seen.size).toBe('11px');         // the small label size of the UI scale (--fs-s)
  expect(errors).toEqual([]);
});
