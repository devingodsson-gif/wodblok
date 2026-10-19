// One spelling (UX review P1): British, as the colour names and the print proof already are. No panel, button, title or label says "color" or "center".
// (The title of Wada's book, "Dictionary of Color Combinations", is a title and stays as printed.)
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, unlockStamp } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'the v100 file is American by design'); });

const US = /\b(colors?|colored|centers?|centered|grays?)\b/i;

async function visibleWords(page) {
  return page.evaluate(() => {
    const out = [];
    document.querySelectorAll('body *').forEach(e => {
      if (['SCRIPT', 'STYLE', 'OPTION'].includes(e.tagName) && e.tagName !== 'OPTION') return;
      if (e.closest('#cl')) return;                       // colour names in the library ("Slate Color", "Neutral Gray") are names, not interface text
      const r = e.getBoundingClientRect();
      if (!r.width && !r.height) return;
      for (const a of ['title', 'aria-label', 'placeholder']) { const v = e.getAttribute(a); if (v) out.push(a + ': ' + v); }
      [...e.childNodes].forEach(n => { if (n.nodeType === 3 && n.nodeValue.trim()) out.push(n.nodeValue.trim()); });
    });
    return out;
  });
}

test('no American spelling in the panels, also with a stamp unlocked', async ({ page }) => {
  const { errors } = await openApp(page);
  const bad = new Set();
  for (const mode of ['pattern', 'unlocked stamp']) {
    if (mode !== 'pattern') await unlockStamp(page);
    const tools = await page.locator('.rail [data-pn]:visible').evaluateAll(b => b.map(x => x.dataset.pn).filter(p => !(p === 'mlist' && document.getElementById('boardS').hidden)));   // the Shape list is empty in Pattern until a stamp is unlocked
    for (const pn of tools) {
      await page.click('#rcls');
      await page.click(`.rail [data-pn="${pn}"]`);
      await page.waitForSelector(`section.pn[data-p="${pn}"]:not([hidden])`);
      for (const w of await visibleWords(page)) if (US.test(w) && !/Dictionary of Color Combinations/.test(w)) bad.add(`${pn}: ${w}`);
    }
  }
  expect([...bad]).toEqual([]);
  expect(errors).toEqual([]);
});
