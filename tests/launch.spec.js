// The launch guardrails from CLAUDE.md, as tests:
// opens in Pattern mode, fully cleared, no tool windows open, dark theme, one blank stamp and one layer,
// no network requests, no page errors.
const { test, expect } = require('@playwright/test');
const { openApp, getState, checkpoint } = require('./helpers/harness');

for (const runtime of ['artifact', 'none']) {
  test(`launch state (${runtime} runtime) @smoke`, async ({ page }, testInfo) => {
    const requests = [];
    page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
    const { errors } = await openApp(page, { runtime });

    const facts = await page.evaluate(() => ({
      title: document.title,
      oldEditor: !!document.getElementById('boardS') || !!document.getElementById('ed'),
      openDocks: [...document.querySelectorAll('.dock.dk')].filter(d => d.offsetWidth * d.offsetHeight > 0).length,
      theme: document.documentElement.dataset.theme,
      name: document.getElementById('pnm').value,
    }));
    expect(facts.title).toMatch(/^Wodblok v\d+(\.\d+)*$/);
    expect(facts.oldEditor, 'the Stamp editor is gone').toBe(false);
    expect(facts.openDocks, 'no tool windows open at launch').toBe(0);
    expect(facts.theme).toBe('dark');
    expect(facts.name).toBe('');

    const s = JSON.parse(await getState(page));
    expect(s.tiles).toHaveLength(1);
    expect(s.els || []).toHaveLength(0);   // 2.10.0: nothing is created at start

    // Google Fonts is the only network the app touches; that dependency is recorded, not hidden.
    for (const u of requests.filter(u => !u.startsWith('http://127.0.0.1:5199/'))) expect(u).toMatch(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//);

    if (runtime === 'artifact') await checkpoint(page, testInfo, errors, 'launch');
    else expect(errors).toEqual([]);
  });
}
