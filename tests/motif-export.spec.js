// Motif export (1.3.0): the library as a zip of SVG files, one folder per library folder or set.
const { test, expect } = require('@playwright/test');
const path = require('path'), { pathToFileURL } = require('url');
const { TARGET, openApp, setMode } = require('./helpers/harness');

const nativeImport = new Function('u', 'return import(u)');
const load = f => nativeImport(pathToFileURL(path.join(__dirname, '..', 'src', f)).href);

test.describe('pure zip builder', () => {
  test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

  test('names are made safe and duplicates are numbered, ignoring case; empty folders are left out', async () => {
    const { buildMotifZip, safeName } = await load('format/motifs.js');
    const { unzipSync, strFromU8 } = await load('vendor/fflate.js');
    expect(safeName('a/b:c*d?', 'x')).toBe('a b c d');
    expect(safeName('  ..hidden. ', 'x')).toBe('hidden');
    expect(safeName('', 'Motif')).toBe('Motif');
    expect(safeName('CON', 'x')).toBe('CON_');
    const { zip, count } = buildMotifZip([
      { name: 'Leaves', items: [{ name: 'Leaf', svg: '<svg>1</svg>' }, { name: 'leaf', svg: '<svg>2</svg>' }, { name: 'Leaf', svg: '<svg>3</svg>' }] },
      { name: 'Empty', items: [] },
      { name: 'leaves', items: [{ name: 'Fern', svg: '<svg>4</svg>' }] },
    ]);
    expect(count).toBe(4);
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(['Leaves/Leaf-3.svg', 'Leaves/Leaf.svg', 'Leaves/leaf-2.svg', 'leaves-2/Fern.svg']);
    expect(strFromU8(files['Leaves/Leaf.svg'])).toBe('<svg>1</svg>');
    expect(buildMotifZip([{ name: 'Empty', items: [] }])).toEqual({ zip: null, count: 0 });
  });

  test('a motif becomes black ink on transparent with its cut parts as holes', async () => {
    const { motifSvg } = await load('format/motifs.js');
    const s = motifSvg((c, d) => `<path d="M0,0" fill="${c}"/><path d="M1,1" stroke="${d}"/>`);
    expect(s).toContain('<mask id="m"');
    expect(s).toContain('<path d="M0,0" fill="#fff"/><path d="M1,1" stroke="#000"/>');   // ink white, cut black, inside the mask
    expect(s).toContain('fill="#000" mask="url(#m)"');                                   // the visible part is black
    expect(s).not.toMatch(/background|paper/i);
  });
});

const unzipDownload = (page, i) => page.evaluate(i => { const d = window.__wbDownloads[i]; return { filename: d.filename, base64: d.base64 }; }, i);
async function entries(page, i) {
  const { unzipSync, strFromU8 } = await load('vendor/fflate.js');
  const d = await unzipDownload(page, i), files = unzipSync(new Uint8Array(Buffer.from(d.base64, 'base64')));
  return { filename: d.filename, files, text: n => strFromU8(files[n]) };
}
const counts = page => page.locator('#mcat option').evaluateAll(os => os.map(o => ({ v: o.value, n: (o.textContent.match(/\((\d+)\)\s*$/) || [0, 0])[1] * 1, label: o.textContent.replace(/\s*\(\d+\)\s*$/, '') })));

test.describe('library buttons', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(TARGET === 'legacy', 'new in the repo build');
    await page.goto('about:blank');
  });

  test('Export all motifs: every folder and set as a folder of SVG files, one file per motif', async ({ page }) => {
    const { errors } = await openApp(page);
    await setMode(page, 'stamp');
    await page.click('.rail [data-pn="motifs"]');
    const opts = await counts(page), total = opts.reduce((a, o) => a + o.n, 0);
    expect(total).toBeGreaterThan(50);
    await page.click('#fexa');
    await page.waitForFunction(() => window.__wbDownloads.length > 0);
    const z = await entries(page, 0), names = Object.keys(z.files);
    expect(z.filename).toBe('wodblok-motifs.zip');
    expect(names.length).toBe(total);
    expect(names.every(n => /^[^/]+\/[^/]+\.svg$/.test(n))).toBe(true);
    const dirs = new Set(names.map(n => n.split('/')[0]));
    expect(dirs.size).toBe(opts.filter(o => o.n > 0).length);
    for (const o of opts.filter(o => o.n > 0)) expect(dirs.has(o.label), o.label).toBe(true);
    // every file is a real, parseable SVG: black ink on transparent, no palette colours
    const bad = await page.evaluate(svgs => svgs.filter(s => { const d = new DOMParser().parseFromString(s, 'image/svg+xml'); return d.querySelector('parsererror') || !d.querySelector('mask') || /FILL|CUT/.test(s); }).length, names.map(n => z.text(n)));
    expect(bad).toBe(0);
    await expect(page.locator('#pmsg')).toContainText(`Exported ${total} motifs`);
    expect(errors).toEqual([]);
  });

  test('Export this folder: only the folder chosen in the list', async ({ page }) => {
    const { errors } = await openApp(page);
    await setMode(page, 'stamp');
    await page.click('.rail [data-pn="motifs"]');
    const opts = await counts(page), pick = opts.find(o => o.n > 0 && /^\d+$/.test(o.v));
    await page.evaluate(v => { const s = document.getElementById('mcat'); s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); }, pick.v);   // the list is a custom dropdown over this select
    await page.click('#fexf');
    await page.waitForFunction(() => window.__wbDownloads.length > 0);
    const z = await entries(page, 0), names = Object.keys(z.files);
    expect(z.filename).toBe(`${pick.label} motifs.zip`.replace(/[\\/:*?"<>|]/g, ' '));
    expect(names.length).toBe(pick.n);
    expect(new Set(names.map(n => n.split('/')[0])).size).toBe(1);
    expect(errors).toEqual([]);
  });

  test('both buttons are commands, and neither shows tooltip or explanatory text', async ({ page }) => {
    const { errors } = await openApp(page);
    await setMode(page, 'stamp');
    await page.click('.rail [data-pn="motifs"]');
    const ids = await page.evaluate(() => window.__wbTest.commands.list().map(c => c.id));
    expect(ids).toEqual(expect.arrayContaining(['library.exportFolder', 'library.exportAllMotifs']));
    for (const id of ['fexa', 'fexf']) {
      await expect(page.locator('#' + id)).toHaveAttribute('aria-label', /Export/);
      await expect(page.locator('#' + id)).not.toHaveAttribute('title', /.+/);
    }
    expect(errors).toEqual([]);
  });
});
