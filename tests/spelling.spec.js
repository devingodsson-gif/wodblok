// One spelling (UX review P1): British, as the colour names and the print proof already are. No panel, button, title or label says "color" or "center".
// (The title of Wada's book, "Dictionary of Color Combinations", is a title and stays as printed.)
const { test, expect } = require('@playwright/test');
const { openApp, unlockStamp } = require('./helpers/harness');

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
    const tools = await page.locator('.rail [data-pn]:not([hidden])').evaluateAll(b => b.map(x => x.dataset.pn).filter(p => !(p === 'mlist' && __wbTest.unlockedStamp() == null)));   // the Shape list is empty in Pattern until a stamp is unlocked
    for (const pn of tools) {
      // the rail buttons toggle, and the first button in the rail is Default panels / Close all: open a panel only if it is not already open (2.19.0)
      if (!(await page.locator(`section.pn[data-p="${pn}"]:visible`).count())) await page.locator(`.rail [data-pn="${pn}"]`).dispatchEvent('click');
      await page.waitForSelector(`section.pn[data-p="${pn}"]:visible`, { timeout: 5000 }).catch(e => { throw new Error('panel did not open: ' + pn + ' (' + mode + ')'); });
      for (const w of await visibleWords(page)) if (US.test(w) && !/Dictionary of Color Combinations/.test(w)) bad.add(`${pn}: ${w}`);
    }
  }
  expect([...bad]).toEqual([]);
  expect(errors).toEqual([]);
});
