import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanHex, normalizeColorway, normalizeColorways, createColorway,
  colorsEqual, colorwayIsModified, createColorwaysEngine
} from '../src/modules/50-colorways.js';

const palette = { paper:'#fff', ink:'#121212', accent1:'#cc3300', accent2:'#2468ac' };

test('normalizes short and mixed-case hex into canonical six-digit colors', () => {
  assert.equal(cleanHex(' #AbC '), '#aabbcc');
  assert.equal(cleanHex('#12G'), null);
  assert.equal(cleanHex('red'), null);
});

test('rejects incomplete records and normalizes valid records', () => {
  assert.equal(normalizeColorway({id:'x',name:'x',colors:{paper:'#fff'}}), null);
  assert.deepEqual(normalizeColorway({id:'x',name:'  Autumn  ',colors:palette}), {
    id:'x', name:'Autumn',
    colors:{paper:'#ffffff',ink:'#121212',accent1:'#cc3300',accent2:'#2468ac'},
    version:1
  });
});

test('normalization removes malformed and duplicate IDs and caps the list at 60', () => {
  const records = Array.from({length:65},(_,i)=>createColorway('Palette '+i,palette,'id-'+i));
  records.push(records[0], {id:'bad',name:'bad',colors:{paper:'#fff'}});
  const normalized=normalizeColorways(records);
  assert.equal(normalized.length,60);
  assert.equal(new Set(normalized.map(x=>x.id)).size,60);
});

test('compares portable colors independent of hex case and shorthand', () => {
  assert.equal(colorsEqual(palette,{paper:'#FFFFFF',ink:'#121212',accent1:'#cc3300',accent2:'#2468ac'}),true);
  assert.equal(colorwayIsModified({colors:palette},{...palette,ink:'#000'}),true);
});

test('engine supports add, rename, duplicate, update, apply, remove and restore', () => {
  let current={...palette};
  const applied=[];
  const engine=createColorwaysEngine({
    readColors:()=>current,
    applyColors:(colors,meta)=>{current={...colors};applied.push(meta)},
  });
  const first=engine.add('Original');
  assert.equal(engine.active().id,first.id);
  current={...palette,ink:'#000000'};
  assert.equal(engine.isModified(first.id),true);
  engine.updateColors(first.id);
  assert.equal(engine.isModified(first.id),false);
  const copy=engine.duplicate(first.id,'Night');
  assert.equal(engine.active().id,copy.id);
  engine.rename(copy.id,'Night palette');
  current={...palette,paper:'#eeeeee'};
  engine.apply(first.id);
  assert.deepEqual(current,first.colors);
  assert.equal(engine.active().id,first.id);
  assert.equal(applied.length,1);
  assert.equal(engine.remove(copy.id),true);
  assert.equal(engine.remove('missing'),false);
  const saved=engine.snapshot();
  const other=createColorwaysEngine({readColors:()=>current,applyColors:()=>{}});
  other.restore(saved);
  assert.deepEqual(other.snapshot(),saved);
});

test('engine enforces the saved-colorway limit', () => {
  const engine=createColorwaysEngine({readColors:()=>palette,applyColors:()=>{}});
  for(let i=0;i<60;i++)engine.add('Colorway '+i);
  assert.throws(()=>engine.add('One too many'),RangeError);
  assert.throws(()=>engine.duplicate(engine.list()[0].id),RangeError);
});

test('apply fails clearly when the adapter is incomplete or an ID is missing', () => {
  const engine=createColorwaysEngine({readColors:()=>palette});
  assert.throws(()=>engine.apply('missing'),/not found/i);
  const row=engine.add('Only');
  assert.throws(()=>engine.apply(row.id),/applyColors/);
});
