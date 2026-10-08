// Phase 2f: the web adapter (IndexedDB records, OPFS blobs, Save/download) behaves as the platform contract says.
// Runs against the unbundled modules only, because the artifact build does not ship the web adapter yet.
const { test, expect } = require('@playwright/test');
const { TARGET, APP_URL } = require('./helpers/harness');

test.beforeEach(({}, ti) => { if (!/wiring|without an account/.test(ti.title)) test.skip(TARGET !== 'esm', 'web adapter unit tests load the ES modules (WB_TARGET=esm)'); });

async function adapter(page) {
  await page.goto(APP_URL);
  await page.evaluate(async () => { window.__web = await import('/platform/web.js'); });
}

test('records: put, get, list, delete round-trip', async ({ page }) => {
  await adapter(page);
  const r = await page.evaluate(async () => {
    const { records } = window.__web;
    await records.put('p1', { name: 'A', n: [1, 2, 3] }); await records.put('p2', { name: 'B' });
    const mine = async () => (await records.list()).filter(k => !k.includes(':')).sort(), a = await records.get('p1'), keys = await mine(), miss = await records.get('nope');
    await records.del('p1');
    return { a, keys, miss, after: await mine() };
  });
  expect(r.a).toEqual({ name: 'A', n: [1, 2, 3] });
  expect(r.keys).toEqual(['p1', 'p2']);
  expect(r.miss).toBeNull();
  expect(r.after).toEqual(['p2']);
});

test('blobs: large files go to OPFS and come back intact', async ({ page }) => {
  await adapter(page);
  const r = await page.evaluate(async () => {
    const { blobs } = window.__web, bytes = new Uint8Array(300000).map((_, i) => i % 251);
    await blobs.put('big.bin', new Blob([bytes]));
    const b = await blobs.get('big.bin'), back = new Uint8Array(await b.arrayBuffer()), names = await blobs.list();
    const same = back.length === bytes.length && back.every((v, i) => v === bytes[i]);
    await blobs.del('big.bin');
    return { same, names, gone: await blobs.get('big.bin'), delTwice: await blobs.del('big.bin').then(() => 'ok') };
  });
  expect(r.same).toBe(true);
  expect(r.names).toContain('big.bin');
  expect(r.gone).toBeNull();
  expect(r.delTwice).toBe('ok');
});

test('files.save falls back to a download when there is no save picker', async ({ page }) => {
  await adapter(page);
  const dl = page.waitForEvent('download');
  const res = await page.evaluate(async () => { delete window.showSaveFilePicker; return window.__web.files.save('x.txt', new Blob(['hi'])); });
  expect(res).toBe('downloaded');
  expect((await dl).suggestedFilename()).toBe('x.txt');
});

// Wiring (any build that has the web adapter): with no Claude account, projects live in IndexedDB; the old localStorage key is copied once and kept.
test('without an account, projects move from the old key to IndexedDB and survive a reload', async ({ browser }) => {
  test.skip(TARGET === 'legacy', 'new in the repo build');
  const { openApp, settle } = require('./helpers/harness');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { if (!localStorage.getItem('__seeded')) { localStorage.setItem('__seeded', '1'); localStorage.setItem('wb18_projects', JSON.stringify({ pOld1: { name: 'Old project', updated: 1, info: 'x', thumb: '', data: '{}' } })); } });
  const page = await ctx.newPage();
  const { errors } = await openApp(page, { runtime: 'none' });
  await page.click('#pls'); await settle(page);
  await expect(page.locator('#pgrid .pc')).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('wb18_projects'))).toContain('pOld1');          // not deleted
  await page.evaluate(() => { localStorage.removeItem('wb18_projects'); });                              // prove the list now comes from IndexedDB
  await page.reload(); await page.waitForFunction(() => document.fonts.status === 'loaded'); await settle(page);
  await page.click('#pls'); await settle(page);
  await expect(page.locator('#pgrid .pc')).toHaveCount(1);
  expect(errors).toEqual([]);
  await ctx.close();
});
