// Colorways core — deliberately isolated from the UI and export code.
// A colorway stores portable colors, not palette labels or artwork. Applying one
// changes only palette-bearing fields and leaves geometry, motifs, effects and layout intact.
const VERSION = 1;
const MAX_COLORWAYS = 60;
const SLOT_KEYS = Object.freeze(['paper', 'ink', 'accent1', 'accent2']);
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const clone = value => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};
const cleanHex = value => {
  if (typeof value !== 'string') return null;
  let hex = value.trim();
  if (!HEX.test(hex)) return null;
  hex = hex.slice(1).toLowerCase();
  if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
  return '#' + hex;
};
const cleanName = value => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80);
const makeId = () => 'cw-' + Math.random().toString(36).slice(2, 8) + '-' + Date.now().toString(36);

function normalizeColorway(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const id = cleanName(input.id);
  const name = cleanName(input.name);
  const colors = {};
  for (const slot of SLOT_KEYS) {
    const hex = cleanHex(input.colors && input.colors[slot]);
    if (!hex) return null;
    colors[slot] = hex;
  }
  if (!id || !name) return null;
  return { id, name, colors, version: VERSION };
}

function normalizeColorways(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const item of input) {
    const cw = normalizeColorway(item);
    if (!cw || seen.has(cw.id) || out.length >= MAX_COLORWAYS) continue;
    seen.add(cw.id);
    out.push(cw);
  }
  return out;
}

function createColorway(name, colors, id = makeId()) {
  const cw = normalizeColorway({ id, name: cleanName(name), colors, version: VERSION });
  if (!cw) throw new TypeError('A colorway needs a name and valid paper, ink, accent 1, and accent 2 hex colors.');
  return cw;
}

function colorsEqual(a, b) {
  const x = normalizeColorway({ id: 'a', name: 'a', colors: a });
  const y = normalizeColorway({ id: 'b', name: 'b', colors: b });
  return !!x && !!y && SLOT_KEYS.every(slot => x.colors[slot] === y.colors[slot]);
}

function colorwayIsModified(colorway, currentColors) {
  return !colorsEqual(colorway && colorway.colors, currentColors);
}

// Engine is adapter-driven so it can be tested without a DOM and does not own
// the editor's project/history systems. The host supplies document access and
// conversion between portable hex colors and Wodblok's native palette tokens.
function createColorwaysEngine(adapter = {}) {
  let records = [];
  let activeId = null;

  const emit = () => {
    if (typeof adapter.onChange === 'function') adapter.onChange(snapshot());
  };
  const snapshot = () => ({ version: VERSION, records: clone(records), activeId });
  const currentColors = () => {
    if (typeof adapter.readColors !== 'function') throw new Error('Colorways adapter is missing readColors().');
    const colors = adapter.readColors();
    const out = {};
    for (const slot of SLOT_KEYS) {
      out[slot] = cleanHex(colors && colors[slot]);
      if (!out[slot]) throw new TypeError('The current document has an invalid ' + slot + ' color.');
    }
    return out;
  };
  const get = id => records.find(record => record.id === id) || null;

  function restore(data) {
    records = normalizeColorways(data && data.records);
    activeId = records.some(record => record.id === data.activeId) ? data.activeId : null;
    emit();
    return snapshot();
  }
  function list() { return clone(records); }
  function active() { return get(activeId) ? clone(get(activeId)) : null; }
  function isModified(id = activeId) {
    const record = get(id);
    return record ? colorwayIsModified(record, currentColors()) : false;
  }
  function add(name) {
    if (records.length >= MAX_COLORWAYS) throw new RangeError('You can save up to ' + MAX_COLORWAYS + ' colorways.');
    const record = createColorway(name, currentColors());
    records.push(record);
    activeId = record.id;
    emit();
    return clone(record);
  }
  function rename(id, name) {
    const record = get(id), nextName = cleanName(name);
    if (!record) throw new RangeError('Colorway not found.');
    if (!nextName) throw new TypeError('A colorway name cannot be empty.');
    record.name = nextName;
    emit();
    return clone(record);
  }
  function duplicate(id, name) {
    const record = get(id);
    if (!record) throw new RangeError('Colorway not found.');
    if (records.length >= MAX_COLORWAYS) throw new RangeError('You can save up to ' + MAX_COLORWAYS + ' colorways.');
    const copy = createColorway(name || (record.name + ' copy'), record.colors);
    records.push(copy);
    activeId = copy.id;
    emit();
    return clone(copy);
  }
  function updateColors(id) {
    const record = get(id);
    if (!record) throw new RangeError('Colorway not found.');
    record.colors = currentColors();
    activeId = id;
    emit();
    return clone(record);
  }
  function remove(id) {
    const index = records.findIndex(record => record.id === id);
    if (index < 0) return false;
    records.splice(index, 1);
    if (activeId === id) activeId = null;
    emit();
    return true;
  }
  function apply(id) {
    const record = get(id);
    if (!record) throw new RangeError('Colorway not found.');
    if (typeof adapter.applyColors !== 'function') throw new Error('Colorways adapter is missing applyColors().');
    // The adapter must perform one ordinary editor transaction, remapping palette
    // assignments by slot identity. The engine never mutates document geometry.
    adapter.applyColors(clone(record.colors), { source: 'colorway', id: record.id });
    activeId = id;
    emit();
    return clone(record);
  }

  return Object.freeze({
    version: VERSION, max: MAX_COLORWAYS, slots: SLOT_KEYS,
    snapshot, restore, list, active, isModified, add, rename,
    duplicate, updateColors, remove, apply
  });
}

export {
  VERSION as COLORWAYS_VERSION,
  MAX_COLORWAYS,
  SLOT_KEYS,
  cleanHex,
  normalizeColorway,
  normalizeColorways,
  createColorway,
  colorsEqual,
  colorwayIsModified,
  createColorwaysEngine
};
