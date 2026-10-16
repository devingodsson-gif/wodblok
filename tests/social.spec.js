// The social batch tool (tools/social): settings checks, the schedule check, the email, and a small dry run of the real thing.
// Tooling only: the app itself is not touched. The first tests need no browser; the dry run drives the built app (npm run build first).
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { validate } = require('../tools/social/validate');
const { isDue, isoWeek } = require('../tools/social/due');
const { parseArgs } = require('../tools/social/run');
const { checkRoll, strayColours, seedFor } = require('../tools/social/render');
const { buildEmail, sendEmail } = require('../tools/social/email');

const ROOT = path.resolve(__dirname, '..');
const clone = o => JSON.parse(JSON.stringify(o));
const base = () => clone(require('../tools/social/config'));
const rejects = (mutate, text, opts) => { const c = base(); mutate(c); expect(() => validate(c, opts)).toThrow(text); };

test.describe('settings', () => {
  test('the shipped settings are valid, and without email settings a dry run still passes', () => {
    expect(() => validate(base())).not.toThrow();
  });
  test('a wrong value stops with a message that names it', () => {
    rejects(c => { c.types = ['canvas', 'repeat']; }, /only "canvas"/);
    rejects(c => { c.types = ['book']; }, /only "canvas"/);
    rejects(c => { c.count = 0; }, /count must be/);
    rejects(c => { c.size = 100; }, /size must be/);
    rejects(c => { c.schedule.hour = 24; }, /schedule.hour/);
    rejects(c => { c.schedule.every = 'monthly'; }, /schedule.every/);
    rejects(c => { c.schedule.days = ['monday']; }, /schedule.days/);
    rejects(c => { c.schedule.tz = 'Mars/Base'; }, /time zone/);
    rejects(c => { c.roll.features = {}; }, /nothing on/);
    rejects(c => { c.roll.features = { colours: 100 }; }, /roll.features has "colours"/);
    rejects(c => { c.roll.palettes = []; }, /at least one palette/);
    rejects(c => { c.roll.palettes = [['#fff', '#000']]; }, /write colours like/);
    rejects(c => { c.roll.palettes = [['#111111', '#111111']]; }, /paper and ink/);
    rejects(c => { c.roll.layouts = ['spiral']; }, /roll.layouts has "spiral"/);
    rejects(c => { c.roll.layers = [3, 1]; }, /min is larger/);
    rejects(c => { c.seedBase = 'today'; }, /seedBase/);
  });
  test('sending needs the address settings and the key, and names the secret that is missing', () => {
    const keep = { ...process.env };
    try {
      delete process.env.RESEND_API_KEY;
      rejects(c => { c.email = { to: '', from: 'a@b.co', subjectPrefix: 'x', maxAttachmentMB: 25 }; }, /WB_SOCIAL_TO/, { needEmail: true });
      rejects(c => { c.email = { to: 'me@example.com', from: '', subjectPrefix: 'x', maxAttachmentMB: 25 }; }, /WB_SOCIAL_FROM/, { needEmail: true });
      rejects(c => { c.email = { to: 'not an address', from: 'a@b.co', subjectPrefix: 'x', maxAttachmentMB: 25 }; }, /not an email/, { needEmail: true });
      rejects(c => { c.email = { to: 'me@example.com', from: 'WODBLOK <batch@example.com>', subjectPrefix: 'x', maxAttachmentMB: 25 }; }, /RESEND_API_KEY/, { needEmail: true });
      process.env.RESEND_API_KEY = 'k';
      expect(() => validate(Object.assign(base(), { email: { to: 'me@example.com', from: 'WODBLOK <batch@example.com>', subjectPrefix: 'x', maxAttachmentMB: 25 } }), { needEmail: true })).not.toThrow();
    } finally { for (const k of ['RESEND_API_KEY']) { if (keep[k] === undefined) delete process.env[k]; else process.env[k] = keep[k]; } }
  });
  test('command line options', () => {
    expect(parseArgs(['--dry', '--count', '3', '--seeds', '5,6', '--size', '512'])).toMatchObject({ dry: true, count: 3, seeds: [5, 6], size: 512 });
    expect(() => parseArgs(['--count', '0'])).toThrow(/--count/);
    expect(() => parseArgs(['--size', '9000'])).toThrow(/--size/);
    expect(() => parseArgs(['--seeds', 'a'])).toThrow(/--seeds/);
    expect(() => parseArgs(['--send'])).toThrow(/unknown option/);
  });
});

test.describe('schedule', () => {
  const week = { every: 'week', days: ['mon'], hour: 8, tz: 'America/New_York', weekParity: 0 };
  test('due only on the chosen day and local hour', () => {
    expect(isDue(week, new Date('2026-10-19T12:00:00Z'))).toBe(true);     // Mon 8:00 EDT
    expect(isDue(week, new Date('2026-10-19T12:59:59Z'))).toBe(true);
    expect(isDue(week, new Date('2026-10-19T11:00:00Z'))).toBe(false);    // 7:00
    expect(isDue(week, new Date('2026-10-19T13:00:00Z'))).toBe(false);    // 9:00
    expect(isDue(week, new Date('2026-10-20T12:00:00Z'))).toBe(false);    // Tuesday
  });
  test('follows the clock change in November', () => {
    expect(isDue(week, new Date('2026-11-02T13:00:00Z'))).toBe(true);     // Mon 8:00 EST, after the change
    expect(isDue(week, new Date('2026-11-02T12:00:00Z'))).toBe(false);    // that is 7:00 EST now
    expect(isDue(week, new Date('2026-10-26T12:00:00Z'))).toBe(true);     // still EDT the week before
  });
  test('late-night local time counts as that local day', () => {
    const sun = { ...week, days: ['sun'], hour: 23 };
    expect(isDue(sun, new Date('2026-10-26T03:00:00Z'))).toBe(true);      // Sun 23:00 EDT is already Monday in UTC
    expect(isDue({ ...week, hour: 23 }, new Date('2026-10-26T03:00:00Z'))).toBe(false);
  });
  test('every day, and every second week', () => {
    const day = { every: 'day', hour: 8, tz: 'America/New_York' };
    expect(isDue(day, new Date('2026-10-21T12:00:00Z'))).toBe(true);
    expect(isDue(day, new Date('2026-10-21T13:00:00Z'))).toBe(false);
    const a = new Date('2026-10-19T12:00:00Z'), b = new Date('2026-10-26T12:00:00Z'), c = new Date('2026-11-02T13:00:00Z');
    for (const parity of [0, 1]) {
      const f = { ...week, every: 'fortnight', weekParity: parity };
      expect([isDue(f, a), isDue(f, b), isDue(f, c)].filter(Boolean).length).toBeGreaterThan(0);
      expect(isDue(f, a)).not.toBe(isDue(f, b));
      expect(isDue(f, b)).not.toBe(isDue(f, c));
    }
  });
  test('ISO week numbers', () => {
    expect(isoWeek(2026, 1, 1)).toBe(1);
    expect(isoWeek(2026, 12, 31)).toBe(53);
    expect(isoWeek(2027, 1, 3)).toBe(53);
    expect(isoWeek(2027, 1, 4)).toBe(1);
  });
  test('the check runs by itself and writes its answer to the output file', () => {
    const out = path.join(os.tmpdir(), 'wb-social-' + process.pid + '.out');
    fs.writeFileSync(out, '');
    const shown = execFileSync('node', ['tools/social/due.js', '--now', '2026-10-20T12:00:00Z'], { cwd: ROOT, env: { ...process.env, GITHUB_OUTPUT: out } }).toString();
    expect(shown).toContain('due=false');
    expect(fs.readFileSync(out, 'utf8')).toBe('due=false\n');
    fs.rmSync(out);
  });
});

test.describe('rolls and colours', () => {
  const cfg = base();
  test('a roll is kept only when its layers and layouts are allowed', () => {
    const layer = grid => ({ grid });
    expect(checkRoll(cfg, { layers: [layer('')] })).toBe('');
    expect(checkRoll(cfg, { layers: [layer('brick'), layer('honey')] })).toBe('');
    expect(checkRoll(cfg, { layers: [layer(''), layer(''), layer(''), layer('')] })).toMatch(/4 layers/);
    cfg.roll.layouts = ['grid'];
    expect(checkRoll(cfg, { layers: [layer('honey')] })).toMatch(/honey/);
    expect(checkRoll(cfg, { layers: [layer('square')] })).toBe('');
  });
  test('a colour from outside the chosen palette is caught', () => {
    const pal = ['#f4ecd8', '#23395b'];
    expect(strayColours({ proj: { c: { k1: '#f4ecd8', k2: '#23395B' } }, x: '#ffffff' }, pal)).toEqual([]);
    expect(strayColours({ proj: { c: { k1: '#f4ecd8', k2: '#b5decc' } } }, pal)).toEqual(['#b5decc']);
  });
  test('seeds differ per image and per retry, and repeat for the same inputs', () => {
    const s = [1, 2, 3].map(i => seedFor(20261019, i, 0));
    expect(new Set(s).size).toBe(3);
    expect(seedFor(20261019, 1, 1)).not.toBe(seedFor(20261019, 1, 0));
    expect(seedFor(20261019, 1, 0)).toBe(seedFor(20261019, 1, 0));
  });
});

test.describe('email', () => {
  function fakeBatch(n) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-social-mail-'));
    fs.writeFileSync(path.join(dir, 'contact-sheet.jpg'), Buffer.alloc(1000, 1));
    const items = [];
    for (let i = 1; i <= n; i++) { const file = String(i).padStart(2, '0') + '.png'; fs.writeFileSync(path.join(dir, file), Buffer.alloc(100000, i)); items.push({ n: i, file, seed: 1000 + i, palette: ['#111111', '#eeeeee'] }); }
    return { outDir: dir, items, manifest: { size: 1080, rerender: 'npm run social -- --dry --seeds <seed>' } };
  }
  const mailCfg = mb => ({ email: { to: 'me@example.com', from: 'WODBLOK <batch@example.com>', subjectPrefix: 'WODBLOK batch', maxAttachmentMB: mb } });
  test('the sheet is inline and attached, the pictures are attached while they fit', () => {
    const b = fakeBatch(3), m = buildEmail(mailCfg(25), b, '2026-10-19');
    expect(m.to).toEqual(['me@example.com']);
    expect(m.subject).toBe('WODBLOK batch: 2026-10-19 (3 images)');
    expect(m.html).toContain('cid:contact-sheet');
    expect(m.attachments.map(a => a.filename)).toEqual(['contact-sheet.jpg', '01.png', '02.png', '03.png']);
    expect(m.attachments[0].content_id).toBe('contact-sheet');
    expect(m.text).toContain('1. seed 1001');
    expect(m.text).toContain('All 3 full-size PNGs are attached');
    fs.rmSync(b.outDir, { recursive: true });
  });
  test('when the pictures would be too big only the sheet is sent, and the email says so', () => {
    const b = fakeBatch(3), m = buildEmail(mailCfg(0.2), b, '2026-10-19');   // 0.2 MB: room for one 100 KB picture
    expect(m.attachments.map(a => a.filename)).toEqual(['contact-sheet.jpg', '01.png']);
    expect(m.text).toContain('Only 1 of 3');
    fs.rmSync(b.outDir, { recursive: true });
  });
  test('sending posts to Resend with the key; a refusal is an error that does not show the key', async () => {
    let seen;
    const ok = async (url, init) => { seen = { url, init }; return { ok: true, status: 200, text: async () => '{"id":"abc"}' }; };
    expect(await sendEmail({ subject: 's' }, 'KEY123', ok)).toBe('abc');
    expect(seen.url).toBe('https://api.resend.com/emails');
    expect(seen.init.headers.Authorization).toBe('Bearer KEY123');
    const no = async () => ({ ok: false, status: 403, text: async () => 'bad key KEY123' });
    await expect(sendEmail({}, 'KEY123', no)).rejects.toThrow(/HTTP 403/);
    await expect(sendEmail({}, 'KEY123', no)).rejects.not.toThrow(/KEY123/);
  });
});

test.describe('dry run of the real thing', () => {
  const dist = path.join(ROOT, 'dist', 'wodblok.html');
  test.skip(!fs.existsSync(dist), 'run `npm run build` first');
  test.setTimeout(300000);
  const run = (args, out) => {
    const env = { ...process.env }; for (const k of ['RESEND_API_KEY', 'WB_SOCIAL_TO', 'WB_SOCIAL_FROM']) delete env[k];     // proves nothing is sent: no key, no address
    return execFileSync('node', ['tools/social/run.js', '--dry', ...args, '--out', out], { cwd: ROOT, env, timeout: 280000 }).toString();
  };
  const png = f => { const b = fs.readFileSync(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), sig: b.toString('latin1', 1, 4) }; };

  test('three small square pictures, a contact sheet and a manifest, and nothing is sent', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-social-run-'));
    const shown = run(['--count', '3', '--size', '512'], out);
    expect(shown).toContain('Dry run: nothing sent.');
    const m = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
    expect(m.got).toBe(3); expect(m.images).toHaveLength(3); expect(m.size).toBe(512);
    for (const im of m.images) {
      expect(png(path.join(out, im.file))).toEqual({ w: 512, h: 512, sig: 'PNG' });
      expect(im.seed).toBeGreaterThan(0);
      expect(im.palette.length).toBeGreaterThanOrEqual(2);
    }
    expect(fs.statSync(path.join(out, 'contact-sheet.jpg')).size).toBeGreaterThan(5000);
    expect(new Set(m.images.map(i => i.seed)).size).toBe(3);
    fs.rmSync(out, { recursive: true });
  });

  test('the same seed gives the same document again', () => {
    const first = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-social-a-')), second = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-social-b-'));
    run(['--count', '1', '--size', '512'], first);
    const a = JSON.parse(fs.readFileSync(path.join(first, 'manifest.json'), 'utf8')).images[0];
    run(['--seeds', String(a.seed), '--size', '512'], second);
    const b = JSON.parse(fs.readFileSync(path.join(second, 'manifest.json'), 'utf8')).images[0];
    expect(b.seed).toBe(a.seed);
    expect(b.stateHash).toBe(a.stateHash);
    expect(b.palette).toEqual(a.palette);
    expect(b.layouts).toEqual(a.layouts);
    for (const d of [first, second]) fs.rmSync(d, { recursive: true });
  });
});
