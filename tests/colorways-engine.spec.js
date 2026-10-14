const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

let api;
test.beforeAll(async () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'modules', '50-colorways.js'), 'utf8');
  api = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
});

const colors = { paper:'#fff', ink:'#121212', accent1:'#cc3300', accent2:'#2468ac' };

test('Colorways normalizes portable hex and rejects invalid values', async () => {
  expect(api.cleanHex(' #AbC ')).toBe('#aabbcc');
  expect(api.cleanHex('red')).toBeNull();
  expect(api.normalizeColorway({id:'x',name:'x',colors:{paper:'#fff'}})).toBeNull();
  expect(api.normalizeColorway({id:'x',name:' Autumn ',colors})).toEqual({
    id:'x', name:'Autumn',
    colors:{paper:'#ffffff',ink:'#121212',accent1:'#cc3300',accent2:'#2468ac'},
    version:1
  });
});

test('Colorways ignores malformed records and duplicate IDs and caps records at 60', async () => {
  const records = Array.from({length:65},(_,i)=>api.createColorway('Palette '+i,colors,'id-'+i));
  records.push(records[0], {id:'bad',name:'bad',colors:{paper:'#fff'}});
  const normalized=api.normalizeColorways(records);
  expect(normalized).toHaveLength(60);
  expect(new Set(normalized.map(x=>x.id)).size).toBe(60);
});

test('engine add, rename, duplicate, update, apply, remove and restore are deterministic', async () => {
  let current={...colors};
  const applied=[];
  const engine=api.createColorwaysEngine({
    readColors:()=>current,
    applyColors:(next,meta)=>{current={...next};applied.push(meta)},
  });
  const first=engine.add('Original');
  expect(engine.active().id).toBe(first.id);
  current={...colors,ink:'#000000'};
  expect(engine.isModified(first.id)).toBe(true);
  engine.updateColors(first.id);
  expect(engine.isModified(first.id)).toBe(false);
  const copy=engine.duplicate(first.id,'Night');
  engine.rename(copy.id,'Night palette');
  current={...colors,paper:'#eeeeee'};
  engine.apply(first.id);
  expect(current).toEqual(first.colors);
  expect(engine.active().id).toBe(first.id);
  expect(applied).toHaveLength(1);
  expect(engine.remove(copy.id)).toBe(true);
  expect(engine.remove('missing')).toBe(false);
  const saved=engine.snapshot();
  const other=api.createColorwaysEngine({readColors:()=>current,applyColors:()=>{}});
  other.restore(saved);
  expect(other.snapshot()).toEqual(saved);
});

test('engine enforces its 60-colorway limit and reports invalid actions', async () => {
  const engine=api.createColorwaysEngine({readColors:()=>colors});
  for(let i=0;i<60;i++)engine.add('Colorway '+i);
  expect(()=>engine.add('One too many')).toThrow(/60 colorways/);
  expect(()=>engine.duplicate(engine.list()[0].id)).toThrow(/60 colorways/);
  expect(()=>engine.apply('missing')).toThrow(/not found/i);
  const incomplete=api.createColorwaysEngine({readColors:()=>colors});
  const row=incomplete.add('Only');
  expect(()=>incomplete.apply(row.id)).toThrow(/applyColors/);
});
