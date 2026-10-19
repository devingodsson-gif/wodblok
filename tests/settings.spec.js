// Phase 2c: the ~36 wbNN_ keys live in one versioned record (`wb_settings`). The old keys are migrated on first read and are
// left in place; big values (fonts, projects, the autosave) keep their own keys.
const { test, expect } = require('@playwright/test');
const { openApp, settle } = require('./helpers/harness');

async function freshPage(browser, seedKeys) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (seedKeys) await ctx.addInitScript(([keys]) => { if (!localStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(keys)) localStorage.setItem(k, v); localStorage.setItem('__seeded', '1'); } }, [seedKeys]);
  const page = await ctx.newPage();
  return { ctx, page };
}

test('old keys are migrated into one record and left in place', async ({ browser }) => {
  const dim = JSON.stringify({ s: [1, 1], c: [4, 3], k: 'rect', o: 'f' });
  const { ctx, page } = await freshPage(browser, { wb98_probe: 'canvas', wb14_dim: dim });
  const { errors } = await openApp(page);
  const r = await page.evaluate(() => ({ rec: JSON.parse(localStorage.getItem('wb_settings')), a: localStorage.getItem('wb98_probe'), viaKv: window.__wbTest.kv.get('wb98_probe') }));
  expect(r.rec.v).toBe(1);
  expect(r.rec.values.wb98_probe).toBe('canvas');
  expect(r.viaKv).toBe('canvas');
  expect(r.a).toBe('canvas');                                    // the original key was not deleted by the migration
  expect(errors).toEqual([]);
  await ctx.close();
});

test('small values go to the record, big ones keep their own key, removal clears both', async ({ page }) => {
  const { errors } = await openApp(page);
  const r = await page.evaluate(() => {
    const kv = window.__wbTest.kv, rec = () => JSON.parse(localStorage.getItem('wb_settings')).values;
    kv.set('wb99_small', 'x'); const small = { inRec: rec().wb99_small, own: localStorage.getItem('wb99_small'), got: kv.get('wb99_small') };
    const big = 'y'.repeat(70 * 1024); kv.set('wb99_big', big); const bigR = { inRec: 'wb99_big' in rec(), own: localStorage.getItem('wb99_big') === big, got: kv.get('wb99_big') === big };
    kv.set('wb99_big', 'z'); const shrunk = { inRec: rec().wb99_big, own: localStorage.getItem('wb99_big') };
    kv.set('wb99_small', 'y'.repeat(70 * 1024)); const grew = { inRec: 'wb99_small' in rec(), got: kv.get('wb99_small').length };
    kv.remove('wb99_small'); kv.remove('wb99_big');
    return { small, bigR, shrunk, grew, gone: [kv.get('wb99_small'), kv.get('wb99_big'), localStorage.getItem('wb99_small'), 'wb99_big' in rec()], keys: kv.keys().filter(k => k.startsWith('wb99')) };
  });
  expect(r.small).toEqual({ inRec: 'x', own: null, got: 'x' });
  expect(r.bigR).toEqual({ inRec: false, own: true, got: true });
  expect(r.shrunk).toEqual({ inRec: 'z', own: null });
  expect(r.grew).toEqual({ inRec: false, got: 70 * 1024 });
  expect(r.gone).toEqual([null, null, null, false]);
  expect(r.keys).toEqual([]);
  expect(errors).toEqual([]);
});

test('a setting changed in the app survives a reload through the record', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#thm'); await settle(page);                  // the theme toggle writes its own pre-paint key, so use a real app setting instead:
  await page.evaluate(() => window.__wbTest.kv.set('wb98_probe', 'grade'));
  await page.reload(); await page.waitForFunction(() => window.__wbTest && document.fonts.status === 'loaded');
  expect(await page.evaluate(() => window.__wbTest.kv.get('wb98_probe'))).toBe('grade');
  expect(errors).toEqual([]);
});
