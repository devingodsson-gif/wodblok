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
      pattern: document.querySelector('.seg2 [data-v="pattern"]').getAttribute('aria-selected'),
      stamp: document.querySelector('.seg2 [data-v="stamp"]').getAttribute('aria-selected'),
      openDocks: [...document.querySelectorAll('.dock.dk')].filter(d => d.offsetWidth * d.offsetHeight > 0).length,
      theme: document.documentElement.dataset.theme,
      name: document.getElementById('pnm').value,
    }));
    expect(facts.title).toMatch(/^Wodblok v\d+$/);
    expect(facts.pattern).toBe('true');
    expect(facts.stamp).toBe('false');
    expect(facts.openDocks, 'no tool windows open at launch').toBe(0);
    expect(facts.theme).toBe('dark');
    expect(facts.name).toBe('');

    const s = JSON.parse(await getState(page));
    expect(s.tiles).toHaveLength(1);
    expect(s.layers).toHaveLength(1);

    // Google Fonts is the only network the app touches; that dependency is recorded, not hidden.
    for (const u of requests) expect(u).toMatch(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//);

    if (runtime === 'artifact') await checkpoint(page, testInfo, errors, 'launch');
    else expect(errors).toEqual([]);
  });
}
