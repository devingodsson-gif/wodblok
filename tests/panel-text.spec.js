// No explanatory text in panels (CLAUDE.md rule; UX review C10). Panels may hold labels, values and short facts, but not sentences that explain.
// This opens every tool in both views and looks for sentences (several words ending in a full stop, ? or !). Data lines ("Last roll: …", the
// palette's "No. 60 · …") are not sentences of this kind.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'the v100 file has these sentences by design'); });

test('no tool panel opens with an explanatory sentence', async ({ page }) => {
  const { errors } = await openApp(page);
  const found = [];
  for (const mode of ['pattern']) {
    const tools = await page.locator('.rail [data-pn]:visible').evaluateAll(b => b.map(x => x.dataset.pn).filter(p => !(p === 'mlist' && __wbTest.unlockedStamp() == null)));   // the Shape list is empty in Pattern until a stamp is unlocked
    for (const pn of tools) {
      await page.click('#rcls');
      await page.click(`.rail [data-pn="${pn}"]`);
      await page.waitForSelector(`section.pn[data-p="${pn}"]:not([hidden])`);
      const sentences = await page.evaluate(pn => {
        const sec = document.querySelector(`section.pn[data-p="${pn}"]`), out = [];
        const w = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
          const t = n.nodeValue.trim(), e = n.parentElement;
          if (!t || !e.getClientRects().length) continue;
          if (t.split(/\s+/).length >= 5 && /[.!?]$/.test(t) && !/^Last roll:/.test(t)) out.push(t);
        }
        return out;
      }, pn);
      sentences.forEach(s => found.push(`${pn}: ${s}`));
    }
  }
  expect(found).toEqual([]);
  expect(errors).toEqual([]);
});

test('nor do the layout modes, a grade mask, the repeat tile or the book cover', async ({ page }) => {
  const { errors } = await openApp(page);
  const found = [];
  const scan = async (pn, tag) => {
    const sentences = await page.evaluate(pn => {
      const sec = document.querySelector(`section.pn[data-p="${pn}"]`), out = [];
      const w = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const t = n.nodeValue.trim(), e = n.parentElement;
        if (!t || !e.getClientRects().length) continue;
        if (t.split(/\s+/).length >= 5 && /[.!?]$/.test(t) && !/^Last roll:/.test(t)) out.push(t);
      }
      return out;
    }, pn);
    sentences.forEach(s => found.push(`${tag}: ${s}`));
  };
  await page.click('.rail [data-pn="layers"]');
  for (const m of ['f', 'x', 'p']) { await page.click(`#lmode [data-m="${m}"]`); await scan('layers', 'layout ' + m); }
  await page.click('#rcls');
  await page.click('.rail [data-pn="grade"]');
  for (const t of ['rad', 'lin', 'lay', 'col', 'lum']) { await page.click('#gm_add'); await page.click(`#gm_menu [data-gt="${t}"]`); await scan('grade', 'mask ' + t); }
  await page.click('#rcls');
  await page.click('.rail [data-pn="canvas"]');
  for (const f of ['Repeat tile', 'Book cover']) { await page.locator('section.pn[data-p="canvas"] button', { hasText: f }).first().click(); await scan('canvas', f); }
  await page.click('#rcls');
  await page.click('.rail [data-pn="stamp"]');
  for (const sym of ['lr', 'quad', 'rot', 'grid']) { const b = page.locator(`#sym [data-m="${sym}"], .sym [data-m="${sym}"]`).first(); if (await b.count()) { await b.click(); await scan('stamp', 'symmetry ' + sym); } }
  expect(found).toEqual([]);
  expect(errors).toEqual([]);
});
