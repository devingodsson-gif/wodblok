// Checks tools/social/config.js. No dependencies, so the hourly schedule check can use it without installing anything.
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const EVERY = ['day', 'week', 'fortnight'];
const FEATURES = ['stamps', 'text', 'layout', 'frame', 'shape', 'size', 'free', 'gr', 'masks', 'tx', 'pr', 'look'];
const LAYOUTS = { auto: '', grid: 'square', brick: 'brick', halfdrop: 'drop', hex: 'honey' };   // name in this file -> the layer's grid setting in the app
const HEX = /^#[0-9a-f]{6}$/i;

function fail(msg) { throw new Error('social config: ' + msg); }
const int = (v, lo, hi, name) => { if (!Number.isInteger(v) || v < lo || v > hi) fail(`${name} must be a whole number from ${lo} to ${hi} (got ${JSON.stringify(v)})`); };

function validateSchedule(s) {
  if (!s || typeof s !== 'object') fail('schedule is missing');
  if (!EVERY.includes(s.every)) fail(`schedule.every must be one of ${EVERY.join(', ')} (got ${JSON.stringify(s.every)})`);
  if (s.every !== 'day') {
    if (!Array.isArray(s.days) || !s.days.length) fail('schedule.days needs at least one day');
    for (const d of s.days) if (!DAYS.includes(d)) fail(`schedule.days has "${d}"; use ${DAYS.join(' ')}`);
  }
  int(s.hour, 0, 23, 'schedule.hour');
  try { new Intl.DateTimeFormat('en-US', { timeZone: s.tz }); } catch (e) { fail(`schedule.tz "${s.tz}" is not a time zone name (for example America/New_York)`); }
  if (s.every === 'fortnight' && ![0, 1].includes(s.weekParity)) fail('schedule.weekParity must be 0 or 1');
  return s;
}

// needEmail: also check the address settings (a dry run does not need them)
function validate(cfg, { needEmail = false } = {}) {
  if (!cfg || typeof cfg !== 'object') fail('the config is empty');
  int(cfg.count, 1, 50, 'count');
  int(cfg.size, 256, 4096, 'size');
  if (!Array.isArray(cfg.types) || !cfg.types.length) fail('types must list at least one type');
  for (const t of cfg.types) if (t !== 'canvas') fail(`types has "${t}", but only "canvas" works in this stage`);
  validateSchedule(cfg.schedule);

  const r = cfg.roll;
  if (!r || typeof r !== 'object') fail('roll is missing');
  if (!r.features || typeof r.features !== 'object') fail('roll.features is missing');
  let on = 0;
  for (const [k, v] of Object.entries(r.features)) {
    if (!FEATURES.includes(k)) fail(`roll.features has "${k}"; use ${FEATURES.join(' ')} (colours are set by roll.colours)`);
    int(v, 0, 100, 'roll.features.' + k);
    if (v > 0) on++;
  }
  if (!on) fail('roll.features switches nothing on, so there would be nothing to roll');
  if (!['app', 'plain'].includes(r.colours)) fail(`roll.colours must be "app" or "plain" (got ${JSON.stringify(r.colours)})`);
  if (!Array.isArray(r.palettes) || !r.palettes.length) fail('roll.palettes needs at least one palette');
  r.palettes.forEach((p, i) => {
    if (!Array.isArray(p) || p.length < 2 || p.length > 4) fail(`roll.palettes[${i}] needs 2 to 4 colours`);
    for (const c of p) if (!HEX.test(c)) fail(`roll.palettes[${i}] has "${c}"; write colours like #1f2a44`);
    if (p[0].toLowerCase() === p[1].toLowerCase()) fail(`roll.palettes[${i}]: paper and ink (the first two colours) must differ`);
  });
  if (!Array.isArray(r.layouts) || !r.layouts.length) fail('roll.layouts needs at least one layout');
  for (const l of r.layouts) if (!(l in LAYOUTS)) fail(`roll.layouts has "${l}"; use ${Object.keys(LAYOUTS).join(' ')}`);
  if (!Array.isArray(r.layers) || r.layers.length !== 2) fail('roll.layers must be [min, max]');
  int(r.layers[0], 1, 20, 'roll.layers min'); int(r.layers[1], 1, 20, 'roll.layers max');
  if (r.layers[0] > r.layers[1]) fail('roll.layers min is larger than max');
  int(r.maxAttempts, 1, 20, 'roll.maxAttempts');
  if (!['date', 'random'].includes(cfg.seedBase) && !(Number.isInteger(cfg.seedBase) && cfg.seedBase >= 0 && cfg.seedBase < 40000000)) fail('seedBase must be "random", "date" or a whole number below 40000000');

  if (needEmail) {
    const e = cfg.email || {};
    const addr = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
    if (!e.to) fail('no recipient: set the WB_SOCIAL_TO secret (or environment variable)');
    if (!e.from) fail('no sender: set the WB_SOCIAL_FROM secret (or environment variable)');
    if (!addr.test(e.to)) fail('WB_SOCIAL_TO is not an email address');
    if (!(addr.test(e.from) || /<[^<>@\s]+@[^<>@\s]+>$/.test(e.from))) fail('WB_SOCIAL_FROM is not an email address (a name like "WODBLOK <batch@example.com>" is fine)');
    if (!process.env.RESEND_API_KEY) fail('no API key: set the RESEND_API_KEY secret (or environment variable)');
    if (!Number.isFinite(e.maxAttachmentMB) || e.maxAttachmentMB <= 0) fail('email.maxAttachmentMB must be a positive number');
  }
  return cfg;
}

module.exports = { validate, validateSchedule, DAYS, LAYOUTS, FEATURES };
