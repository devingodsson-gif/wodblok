// Shape export (1.3.0): the library as a zip of SVG files, folders inside folders kept.
const { test, expect } = require('@playwright/test');
const path = require('path'), { pathToFileURL } = require('url');
const { openApp, openPanel, settle } = require('./helpers/harness');

const nativeImport = new Function('u', 'return import(u)');
const load = f => nativeImport(pathToFileURL(path.join(__dirname, '..', 'src', f)).href);

test.describe('pure zip builder', () => {

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

  test('folders inside folders stay folders inside folders, and a renamed folder takes the ones inside it along', async () => {
    const { buildMotifZip } = await load('format/motifs.js');
    const { unzipSync } = await load('vendor/fflate.js');
    const it = n => ({ items: [{ name: n, svg: '<svg/>' }] });
    const { zip, count } = buildMotifZip([
      { path: ['Florals'], ...it('Rose') },
      { path: ['Florals', 'Tulips'], ...it('Red') },
      { path: ['Florals', 'Tulips', 'Dark'], ...it('Black') },
      { path: ['florals'], ...it('Daisy') },                       // same folder name apart from case: the second one is numbered
      { path: ['florals', 'Tulips'], ...it('Pink') },              // ... and its inner folder follows it
      { path: ['Top', 'Only inside'], ...it('Deep') },             // a folder with nothing in it of its own is not written
    ]);
    expect(count).toBe(6);
    expect(Object.keys(unzipSync(zip)).sort()).toEqual([
      'Florals/Rose.svg', 'Florals/Tulips/Dark/Black.svg', 'Florals/Tulips/Red.svg',
      'Top/Only inside/Deep.svg', 'florals-2/Daisy.svg', 'florals-2/Tulips/Pink.svg']);
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

const downloaded = async (page, i) => {
  const { unzipSync, strFromU8 } = await load('vendor/fflate.js');
  const d = await page.evaluate(i => { const x = window.__wbDownloads[i]; return { filename: x.filename, base64: x.base64 }; }, i);
  const files = unzipSync(new Uint8Array(Buffer.from(d.base64, 'base64')));
  return { filename: d.filename, files, names: Object.keys(files).sort(), text: n => strFromU8(files[n]) };
};
async function open(page) { const r = await openApp(page); await openPanel(page, 'motifs'); return r; }
async function pick(page, sel, v) {
  await page.locator(sel).locator('xpath=following-sibling::div[contains(@class,"dd2")][1]/button').click();
  await page.locator(`.ddl:not([hidden]) .ddi[data-v="${v}"]`).click();
}
async function mkFolder(page, name) { await page.click('#fnew'); await page.fill('#fname', name); await page.click('#fok'); await settle(page); }
const menuItem = (page, name) => page.locator('.rowm').getByRole('menuitem', { name, exact: true });
async function folderMenu(page, v) {                                              // scroll first: a scroll closes an open menu
  const b = page.locator(`#lib .lrw:has(> .lfr[data-f="${v}"]) .lmo`);
  await b.scrollIntoViewIfNeeded(); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await b.click();
}
// Picks (2 shapes) with Inner inside it (1 shape); everything else is the built-in sets
async function build(page) {
  await mkFolder(page, 'Picks'); await mkFolder(page, 'Inner');
  await page.click('#ltog');                                                        // close every folder
  await page.click('#lib .lfr[data-f="b:Flowers"]');
  await page.click('#fsel');
  await page.locator('#lib button[data-m]').nth(0).click(); await page.locator('#lib button[data-m]').nth(1).click();
  await pick(page, '#fmove', 'g:Picks'); await settle(page);
  await page.locator('#lib button[data-m]').nth(2).click();
  await pick(page, '#fmove', 'g:Picks/Inner'); await settle(page);
  await page.click('#fdone');
  await page.click('#ltog');
}

test.describe('library button', () => {

  test('the toolbar button exports every shape, folder by folder, with folders inside folders kept', async ({ page }) => {
    const { errors } = await open(page);
    await build(page);
    await expect(page.locator('#fexp')).toHaveAttribute('aria-label', 'Export all motifs');
    await page.click('#fexp');
    await page.waitForFunction(() => window.__wbDownloads.length > 0);
    const z = await downloaded(page, 0), under = d => z.names.filter(n => n.startsWith(d + '/') && !n.slice(d.length + 1).includes('/'));
    expect(z.filename).toBe('wodblok-shapes.zip');
    expect(under('Picks').length).toBe(2);
    expect(under('Picks/Inner').length).toBe(1);
    expect(under('Flowers').length).toBe(55);
    expect(z.names.some(n => n.startsWith('Mammals/'))).toBe(true);
    expect(z.names.length).toBeGreaterThan(90);
    expect(z.names.every(n => n.endsWith('.svg'))).toBe(true);
    // every file is a real, parseable SVG: black ink on transparent, with no leftover colour words
    const bad = await page.evaluate(svgs => svgs.filter(s => { const d = new DOMParser().parseFromString(s, 'image/svg+xml'); return d.querySelector('parsererror') || !d.querySelector('mask') || /FILL|CUT/.test(s); }).length, z.names.map(n => z.text(n)));
    expect(bad).toBe(0);
    await expect(page.locator('#pmsg')).toContainText(`Exported ${z.names.length} shapes`);
    expect(errors).toEqual([]);
  });

  test('a folder that has folders in it asks from its menu: this folder only, or with the folders inside it', async ({ page }) => {
    const { errors } = await open(page);
    await build(page);
    await folderMenu(page, 'g:Picks');
    await menuItem(page, 'Export…').click();
    await expect(page.locator('.rowm [role="menuitem"]')).toHaveCount(2);
    await menuItem(page, 'This folder only').click();
    await page.waitForFunction(() => window.__wbDownloads.length > 0);
    let z = await downloaded(page, 0);
    expect(z.filename).toBe('Picks shapes.zip');
    expect(z.names.length).toBe(2);
    expect(z.names.every(n => /^Picks\/[^/]+\.svg$/.test(n))).toBe(true);
    await folderMenu(page, 'g:Picks');
    await menuItem(page, 'Export…').click();
    await menuItem(page, 'This folder and the folders inside it').click();
    await page.waitForFunction(() => window.__wbDownloads.length > 1);
    z = await downloaded(page, 1);
    expect(z.names.length).toBe(3);
    expect(z.names.filter(n => n.startsWith('Picks/Inner/')).length).toBe(1);
    expect(errors).toEqual([]);
  });

  test('a folder with nothing inside it exports straight away; an empty folder cannot export', async ({ page }) => {
    const { errors } = await open(page);
    await build(page);
    await page.click('#lib .lfr[data-f="g:Picks"]');
    await folderMenu(page, 'g:Picks/Inner');
    await menuItem(page, 'Export…').click();
    await expect(page.locator('.rowm')).toHaveCount(0);                                // no menu: there is nothing to choose
    await page.waitForFunction(() => window.__wbDownloads.length > 0);
    const z = await downloaded(page, 0);
    expect(z.filename).toBe('Inner shapes.zip');
    expect(z.names.length).toBe(1);
    await page.click('#ltog');
    await mkFolder(page, 'Nothing here');
    await folderMenu(page, 'g:Nothing here');
    await expect(menuItem(page, 'Export…')).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test('it is a command, and has no tooltip or explanatory text', async ({ page }) => {
    const { errors } = await open(page);
    expect(await page.evaluate(() => window.__wbTest.commands.list().map(c => c.id))).toContain('library.exportShapes');
    await expect(page.locator('#fexp')).not.toHaveAttribute('title', /.+/);
    expect(errors).toEqual([]);
  });
});
