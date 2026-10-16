// The per-run choices (palette name, your own colours, mood). No dependencies, so tests and the gate can load it freely.
// A choice narrows what config.js allows for this one run; it never writes anything back.

const MOODS = ['any', 'light', 'dark'];
const HEX = /^#[0-9a-f]{6}$/i;
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const named = cfg => cfg.roll.palettes.map((colours, i) => ({ name: (cfg.roll.paletteNames && cfg.roll.paletteNames[i]) || 'palette-' + (i + 1), colours }));

// "#f6f1e7, 14213d fca311" -> ['#f6f1e7', '#14213d', '#fca311']. Paper first, then ink, then up to two accents.
function parseColours(text) {
  const parts = String(text).split(/[\s,;]+/).filter(Boolean).map(s => (s[0] === '#' ? s : '#' + s).toLowerCase());
  if (parts.length < 2 || parts.length > 4) throw new Error(`colours: give 2 to 4 hex colours, paper first (got ${parts.length})`);
  for (const p of parts) if (!HEX.test(p)) throw new Error(`colours: "${p}" is not a hex colour like #14213d`);
  if (parts[0] === parts[1]) throw new Error('colours: paper and ink (the first two) must differ');
  if (contrast(parts[0], parts[1]) < 3) throw new Error(`colours: paper ${parts[0]} and ink ${parts[1]} are too close to read (contrast ${contrast(parts[0], parts[1]).toFixed(1)}, need 3 or more)`);
  return parts;
}

// choice: { palette, colours, mood } (all optional). Returns { pool: [{name, colours}], mood }
function resolveChoices(cfg, choice = {}) {
  const all = named(cfg);
  const mood = choice.mood || 'any';
  if (!MOODS.includes(mood)) throw new Error(`mood "${mood}" is not one of ${MOODS.join(' ')}`);
  let pool;
  if (choice.colours) pool = [{ name: 'custom', colours: parseColours(choice.colours) }];
  else if (choice.palette && choice.palette !== 'any') {
    const p = all.find(x => x.name === String(choice.palette).trim().toLowerCase());
    if (!p) throw new Error(`palette "${choice.palette}" is not in config.js. Names: ${all.map(x => x.name).join(', ')}`);
    pool = [p];
  } else pool = all;
  if (mood !== 'any' && !choice.colours && !(choice.palette && choice.palette !== 'any')) {
    pool = pool.filter(p => (lum(p.colours[0]) > 0.35) === (mood === 'light'));
    if (!pool.length) throw new Error(`no ${mood} palette in config.js`);
  }
  return { pool, mood };
}

module.exports = { resolveChoices, parseColours, contrast, MOODS };
