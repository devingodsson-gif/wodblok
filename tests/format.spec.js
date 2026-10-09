// Phase 3a: the project format (zip container, migrations, validation, SVG cleaning). Pure code: no browser needed.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const FX = path.join(__dirname, 'fixtures');
const nativeImport = new Function('u', 'return import(u)');                       // Playwright rewrites import(); this keeps the real one
const load = async f => nativeImport(pathToFileURL(path.join(__dirname, '..', 'src', 'format', f)).href);
const fixtures = fs.readdirSync(FX).filter(f => f.endsWith('.wodblok.json'));

test('every real v18 project opens as format 19 and the original bytes are not touched', async () => {
  const { fmtOpen } = await load('container.js');
  expect(fixtures.length).toBeGreaterThan(0);
  for (const f of fixtures) {
    const bytes = new Uint8Array(fs.readFileSync(path.join(FX, f))), before = Buffer.from(bytes).toString('base64');
    const r = await fmtOpen(bytes);
    expect(r.from, f).toBe('json'); expect(r.newer).toBe(false); expect(r.project.v).toBe(19); expect(r.project.app).toBe('WODBLOK');
    expect(Buffer.from(bytes).toString('base64')).toBe(before);
  }
});

test('v18 json -> zip -> back gives the same project (apart from the format number), and the zip starts with the mimetype', async () => {
  const { fmtOpen, fmtPack, FMT_MIME } = await load('container.js');
  for (const f of fixtures) {
    const a = await fmtOpen(new Uint8Array(fs.readFileSync(path.join(FX, f))));
    const zip = await fmtPack(a.project);
    expect(Buffer.from(zip.subarray(30, 38)).toString()).toBe('mimetype');          // first entry, name right after the 30-byte header
    expect(Buffer.from(zip.subarray(38, 38 + FMT_MIME.length)).toString()).toBe(FMT_MIME);   // stored, so readable as plain bytes
    const b = await fmtOpen(zip);
    expect(b.from).toBe('zip'); expect(b.missingAssets).toBe(0);
    expect(b.project).toEqual(a.project);
    const zip2 = await fmtPack(b.project), c = await fmtOpen(zip2);    // zip to zip
    expect(c.project).toEqual(a.project);
  }
});

test('an image used many times is stored once, big images survive, unknown fields are kept', async () => {
  const { fmtOpen, fmtPack } = await load('container.js');
  const { unzipSync } = require('fflate');
  const px = Buffer.alloc(3_000_000); for (let i = 0; i < px.length; i++) px[i] = (i * 7919) % 251;   // not compressible, like a photo
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), px]);
  const url = 'data:image/png;base64,' + png.toString('base64');
  const base = JSON.parse(fs.readFileSync(path.join(FX, fixtures[0]), 'utf8'));
  const p = { ...base, futureField: { keep: [1, 2, 3] }, arts: { a1: { n: 'A', src: url }, a2: { n: 'B', src: url } }, cover: { img: url, back: { img: url }, spine: { img: '' } } };
  const zip = await fmtPack(p), names = Object.keys(unzipSync(zip));
  expect(names.filter(n => n.startsWith('assets/') && n.endsWith('.png'))).toHaveLength(1);
  expect(zip.length).toBeLessThan(png.length * 1.25);                                       // stored once, not four times
  const r = await fmtOpen(zip);
  expect(r.project.arts.a2.src).toBe(url); expect(r.project.cover.back.img).toBe(url);
  expect(r.project.futureField).toEqual({ keep: [1, 2, 3] });
});

test('a file from a newer app is flagged read-only and left as it is', async () => {
  const { fmtOpen } = await load('container.js');
  const base = JSON.parse(fs.readFileSync(path.join(FX, fixtures[0]), 'utf8'));
  const r = await fmtOpen(new TextEncoder().encode(JSON.stringify({ ...base, v: 99, brandNew: true })));
  expect(r.newer).toBe(true); expect(r.project.v).toBe(99); expect(r.project.brandNew).toBe(true);
});

test('damaged and hostile files give a friendly error, never a crash', async () => {
  const { fmtOpen, fmtPack } = await load('container.js');
  const { FormatError } = await load('errors.js');
  const base = JSON.parse(fs.readFileSync(path.join(FX, fixtures[0]), 'utf8'));
  const good = Buffer.from(await fmtPack(base));
  const cases = [
    ['empty', new Uint8Array(0)], ['text', new TextEncoder().encode('hello')], ['json array', new TextEncoder().encode('[1,2]')],
    ['other app', new TextEncoder().encode('{"app":"X","v":1}')], ['no stamps', new TextEncoder().encode('{"app":"WODBLOK","v":18,"tiles":[],"layers":[]}')],
    ['bad item', new TextEncoder().encode(JSON.stringify({ ...base, tiles: [{ items: [{ m: 5 }] }] }))],
    ['truncated zip', good.subarray(0, Math.floor(good.length / 2))], ['zip header only', good.subarray(0, 30)],
  ];
  for (const [name, bytes] of cases) {
    const e = await fmtOpen(new Uint8Array(bytes)).then(() => null, e => e);
    expect(e, name).toBeInstanceOf(FormatError); expect(e.message.length, name).toBeGreaterThan(10);
  }
  // fuzz: flip random bytes in a real file; the only allowed outcomes are "opens" or a FormatError
  let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let n = 0; n < 300; n++) {
    const b = new Uint8Array(good); for (let k = 0; k < 1 + (n % 8); k++) b[Math.floor(rnd() * b.length)] = Math.floor(rnd() * 256);
    const out = await fmtOpen(b).then(() => 'ok', e => e);
    if (out !== 'ok') expect(out, 'fuzz ' + n).toBeInstanceOf(FormatError);
  }
});

test('a project that points at a missing picture still opens, and says so', async () => {
  const { fmtOpen } = await load('container.js');
  const { zipSync, strToU8 } = require('fflate');
  const base = JSON.parse(fs.readFileSync(path.join(FX, fixtures[0]), 'utf8'));
  const p = { ...base, v: 19, arts: { a: { n: 'A', src: 'wbasset:assets/' + 'a'.repeat(64) + '.png' } } };
  const zip = zipSync({ mimetype: [strToU8('application/vnd.wodblok+zip'), { level: 0 }], 'project.json': strToU8(JSON.stringify(p)) });
  const r = await fmtOpen(zip);
  expect(r.missingAssets).toBe(1); expect(r.project.arts.a.src).toBe('');
});

test('SVG from files is cleaned: scripts, handlers, outside references and unknown tags are removed; plain art is kept', async () => {
  const { fmtCleanSvg } = await load('svg.js');
  const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0,0L10,10" fill="#000"/></svg>';
  expect(fmtCleanSvg(ok)).toBe(ok.replace('fill="#000"/>', 'fill="#000"/>'));
  const hostile = [
    '<svg><script>alert(1)</script><path d="M0,0"/></svg>',
    '<svg onload="alert(1)"><path d="M0,0" onclick="x()"/></svg>',
    '<svg><foreignObject><div>hi</div></foreignObject><path d="M1,1"/></svg>',
    '<svg><image href="http://evil/x.png"/><path d="M1,1"/></svg>',
    '<svg><path d="M1,1" fill="url(http://evil/a)"/></svg>',
    '<svg><use href="#a"/><path d="M1,1" style="background:url(x)"/></svg>',
    '<svg><a href="javascript:alert(1)"><path d="M1,1"/></a></svg>',
  ];
  for (const h of hostile) {
    const c = fmtCleanSvg(h);
    expect(c, h).not.toBeNull();
    expect(c, h).not.toMatch(/script|onload|onclick|foreignObject|image|http|javascript|<use|style|<a[ >]/i);
    if (!/<a /.test(h)) expect(c, h).toContain('<path');          // an unknown element is removed with everything inside it
  }
  for (const bad of ['', null, '<div>hi</div>', '<!DOCTYPE svg><svg/>', '<!-- x --><svg><path d="M0,0"/></svg>', '<svg>' + 'x'.repeat(700000) + '</svg>']) expect(fmtCleanSvg(bad), String(bad).slice(0, 30)).toBeNull();
  expect(fmtCleanSvg('<svg><path d="M1,1" fill="url(#g)"/></svg>')).toContain('url(#g)');       // a reference inside the same file is fine
});

test('snapshots round-trip inside the zip, and a damaged snapshot is left out without stopping the project opening', async () => {
  const { fmtOpen, fmtPack } = await load('container.js');
  const { zipSync, unzipSync, strToU8 } = require('fflate');
  const base = JSON.parse(fs.readFileSync(path.join(FX, fixtures[0]), 'utf8'));
  const snaps = [{ n: 'First', t: 1, s: '{"a":1}' }, { n: 'Second', t: 2, s: '{"a":2}' }, { n: 5, t: 'x', s: 1 }];
  const zip = await fmtPack(base, { snapshots: snaps });
  expect(Object.keys(unzipSync(zip)).filter(k => k.startsWith('snapshots/'))).toHaveLength(2);       // the invalid one was never written
  const r = await fmtOpen(zip);
  expect(r.snapshots).toEqual([snaps[0], snaps[1]]);
  const files = unzipSync(zip); files['snapshots/00.json'] = strToU8('{not json');
  const r2 = await fmtOpen(zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, k === 'mimetype' ? [v, { level: 0 }] : v]))));
  expect(r2.snapshots.map(s => s.n)).toEqual(['Second']);
});

test('a single stamp file: round trip, and friendly errors for anything else', async () => {
  const { fmtStampOpen, fmtStampPack } = await load('stamp.js');
  const { FormatError } = await load('errors.js');
  const rec = { name: 'Fish "A"', updated: 5, w: 100, h: 100, img: 'data:image/png;base64,AAAA', tile: JSON.stringify({ items: [{ m: 'x', x: 1, y: 2 }] }), motifs: { x: { n: 'x', svg: '<path/>' } }, colors: [['Ink', '#112233']] };
  const back = fmtStampOpen(fmtStampPack(rec));
  expect(back.name).toBe('Fish A'); expect(back.tile).toBe(rec.tile); expect(back.motifs).toEqual(rec.motifs); expect(back.colors).toEqual(rec.colors);
  const bad = ['', 'nope', '[]', '{"app":"WODBLOK","v":1}', '{"app":"WODBLOK-STAMP","v":9,"tile":"{}"}', '{"app":"WODBLOK-STAMP","v":1,"tile":"{"}', '{"app":"WODBLOK-STAMP","v":1,"tile":"{\\"items\\":[]}","motifs":[]}', 'x'.repeat(9e6)];
  for (const b of bad) expect(() => fmtStampOpen(b), b.slice(0, 40)).toThrow(FormatError);
});
