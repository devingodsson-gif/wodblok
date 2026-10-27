// 2.64.0 (owner Oct 27 2026, docs/text-plan.md release 2): the Text panel is Text, Style, Character, Paragraph and Shape; one Shape choice replaces Curve, Warp and Path;
// Size, the box, word spacing, balance, letter size and raise, letter rotation and the random letters are gone (the Jitter effect does random letters).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const txt = async page => JSON.parse(await H.getState(page)).els.find(x => x.tx);
const shape = (page, v) => page.evaluate(v => { const s = document.getElementById('tx_shk'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const range = (page, id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);

test('the Text panel: its groups, nothing of what was removed, and the Shape choice writing the line the letters sit on', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await H.placeArmed(page, 'text'); await H.showPanel(page, 'text');
  const sec = page.locator('section.pn[data-p="text"]');
  for (const g of ['Text', 'Character', 'Paragraph', 'Shape']) await expect(sec.locator('details.g > summary', { hasText: new RegExp('^' + g) }).first()).toBeVisible();
  for (const id of ['tx_sz', 'tx_ws', 'tx_wd', 'tx_ht', 'tx_bal', 'tx_zs', 'tx_dy', 'tx_rot', 'tx_rp', 'tx_rr', 'tx_rs', 'tx_bb', 'tx_scat', 'tx_vary', 'tx_cv', 'tx_wp', 'tx_pt']) await expect(page.locator('#' + id)).toBeHidden();
  await expect(page.locator('#tx_shar')).toBeHidden();
  await shape(page, 'arc'); await range(page, 'tx_sha', -60);
  await expect.poll(async () => (await txt(page)).tx.cv, { timeout: 12000 }).toBe(-60);
  await shape(page, 'wave'); await range(page, 'tx_sha', 30); await range(page, 'tx_shl', 70);
  await expect(page.locator('#tx_shlr')).toBeVisible();
  await expect.poll(async () => { const t = (await txt(page)).tx; return [t.pt, t.pa, t.pw, t.cv]; }, { timeout: 12000 }).toEqual(['w', 30, 70, 0]);
  await shape(page, 'b'); await range(page, 'tx_sha', 45);
  await expect.poll(async () => { const t = (await txt(page)).tx; return [t.wp, t.wa, t.pt || '']; }, { timeout: 12000 }).toEqual(['b', 45, '']);
  await expect(page.locator('#tx_shlr')).toBeHidden();
  await shape(page, '');
  await expect.poll(async () => { const t = (await txt(page)).tx; return [t.wp || '', t.pt || '', t.cv]; }, { timeout: 12000 }).toEqual(['', '', 0]);
  // the removed options are never saved, even when set
  await range(page, 'tx_rp', 40); await range(page, 'tx_ws', 50);
  await page.waitForTimeout(400);
  const t = (await txt(page)).tx;
  expect(t.rp).toBeUndefined(); expect(t.ws).toBe(0);
  expect(errors).toEqual([]);
});

test('a stamp\'s tab has the same panel: no Size or box, the Shape choice', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addStamp(page); await H.unlockStamp(page, 0); await H.settle(page);
  await H.showPanel(page, 'text');
  await expect(page.locator('#tx_shk')).toBeAttached();
  await expect(page.locator('#tx_sz')).toBeHidden(); await expect(page.locator('#tx_wd')).toBeHidden();
  expect(errors).toEqual([]);
});
