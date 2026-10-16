// Makes the built-in templates from tools/templates/recipes.js (not a test: it only runs with WB_MAKE_TEMPLATES=1, via `npm run templates`).
// It drives the built app (WB_TARGET=build), saves each project with the app's own Save, keeps the file and a small picture of it.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openPanel, setMode, settle } = require('./helpers/harness');
const { RECIPES } = require('../tools/templates/recipes');

test.skip(!process.env.WB_MAKE_TEMPLATES, 'only with `npm run templates`');
test.describe.configure({ mode: 'serial' });
const made = [];
const only = process.env.WB_ONLY ? process.env.WB_ONLY.split(',') : null;

for (const r of RECIPES) {
  if (only && !only.includes(r.id)) continue;
  test('template: ' + r.id, async ({ page }) => {
    test.setTimeout(180000);
    const { errors } = await openApp(page, { seed: r.seed });
    if (r.kind === 'tile') { await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="tile"]'); await settle(page); }
    if (r.shape) { await openPanel(page, 'canvas'); await page.click(`#cshp [data-s="${r.shape}"]`); await settle(page); }
    if (r.block) { await setMode(page, 'stamp'); await openPanel(page, 'stamp'); await page.click(`#skind [data-k="${r.block}"]`); await settle(page); await setMode(page, 'pattern'); }
    // Randomize: only the stamps, a new palette and (when asked) the layout change
    await openPanel(page, 'rand'); await page.click('#rznone');
    await page.locator('[data-ft="stamps"]').fill('100'); await page.locator('[data-ft="col"]').check();
    if (r.look.layout) await page.locator('[data-ft="layout"]').fill('100');
    await page.click('#rzdo'); await settle(page, { max: 90000 });
    if (r.grid) { await page.evaluate(g => { const s = document.getElementById('lgr'); s.value = g; s.dispatchEvent(new Event('change', { bubbles: true })); }, r.grid); await settle(page, { max: 60000 }); }
    if (r.kind === 'book') {
      await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="book"]'); await settle(page);
      await page.evaluate(t => { const s = document.getElementById('bktr'); s.value = t; s.dispatchEvent(new Event('change', { bubbles: true })); }, r.trim);
      await settle(page, { max: 60000 });
    }
    await page.fill('#pnm', r.n);
    await page.evaluate(() => { window.__wbDownloads.length = 0; });
    await page.click('#psv');
    await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 60000 });
    const dl = await page.evaluate(() => window.__wbDownloads[0]);
    const dir = path.join(ROOT, 'src', 'templates', r.kind); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, r.id + '.wodblok'), Buffer.from(dl.base64, 'base64'));
    const png = require('child_process').execFileSync('python3', ['-I', '-c', 'import sys,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read("thumbnail.png"))', path.join(dir, r.id + '.wodblok')], { maxBuffer: 1 << 26 });
    const th = await page.evaluate(b64 => new Promise(res => { const im = new Image(); im.onload = () => { const w = 240, h = Math.max(1, Math.round(w * im.naturalHeight / im.naturalWidth)), c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); res(c.toDataURL('image/jpeg', .8)); }; im.onerror = () => res(''); im.src = 'data:image/png;base64,' + b64; }), png.toString('base64'));
    // the picture lives in the list (th), so the stored file drops its own copy: smaller, and the same project
    require('child_process').execFileSync('python3', ['-I', '-c', 'import sys,zipfile\nf=sys.argv[1]\nz=zipfile.ZipFile(f)\nk=[(i,z.read(i)) for i in z.infolist() if i.filename!="thumbnail.png"]\nz.close()\no=zipfile.ZipFile(f,"w")\n[o.writestr(i,b,i.compress_type) for i,b in k]\no.close()', path.join(dir, r.id + '.wodblok')]);
    const stripped = fs.readFileSync(path.join(dir, r.id + '.wodblok'));
    fs.mkdirSync(path.join(ROOT, 'test-results', 'templates'), { recursive: true });
    await page.locator('#art').first().screenshot({ path: path.join(ROOT, 'test-results', 'templates', r.id + '.png') });
    made.push({ id: 'tpl-' + r.id, type: r.kind, n: r.n, th, b: stripped.toString('base64') });
    expect(th, 'a picture was made').toMatch(/^data:image\/jpeg/);
    expect(errors).toEqual([]);
  });
}

test.afterAll(() => {
  if (only || made.length !== RECIPES.length) return;     // a partial run does not rewrite the list
  const order = RECIPES.map(r => 'tpl-' + r.id);
  made.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const body = '// Built-in templates ("Starting points"): made by `npm run templates` from tools/templates/recipes.js. Do not edit by hand.\n// Each is {id, type: canvas | tile | book, n: name, th: small picture (data URL), b: the .wodblok file as base64}.\nconst TPL_BUILTIN=' + JSON.stringify(made) + ';\nexport {TPL_BUILTIN};\n';
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'templates.js'), body);
});
