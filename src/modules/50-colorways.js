import {WBS,WBX} from './01-launch-and-version.js';

// Colorways are named sets of the four project palette slots. They belong to the
// project document (not browser settings), so they travel with .wodblok files.
const CW_SLOTS=['bg','ink','c3','c4'];
const CW_HEX=/^#[0-9a-f]{6}$/i;
const CW_MAX=60;
const cwClone=v=>JSON.parse(JSON.stringify(v));
function cwCleanColors(input){
  if(!input||typeof input!=='object')return null;
  const colors={};
  for(const k of CW_SLOTS){const v=input[k];if(typeof v==='string'&&CW_HEX.test(v))colors[k]=v.toUpperCase()}
  if(!colors.bg||!colors.ink)return null;
  return colors;
}
function cwNormalize(list){
  if(!Array.isArray(list))return[];
  const out=[],ids=new Set();
  for(const raw of list){
    if(out.length>=CW_MAX)break;
    if(!raw||typeof raw!=='object')continue;
    const colors=cwCleanColors(raw.colors||raw.palette);
    if(!colors)continue;
    let id=typeof raw.id==='string'?raw.id.slice(0,80):'';
    if(!id||ids.has(id))continue;
    ids.add(id);
    const name=String(raw.name||'Colorway').trim().slice(0,40)||'Colorway';
    out.push({id,name,colors});
  }
  return out;
}
function cwColorsFromCore(core){
  const p=core&&core.proj||{};
  return cwCleanColors({bg:p.bg,ink:p.ink,c3:p.c3,c4:p.c4});
}
function cwCapture(core,name,id){
  const colors=cwColorsFromCore(core);
  if(!colors)return null;
  const nm=String(name||'Colorway').trim().slice(0,40)||'Colorway';
  return{id:String(id||'').slice(0,80),name:nm,colors};
}
function cwSameColors(a,b){
  const x=cwCleanColors(a),y=cwCleanColors(b);
  if(!x||!y)return false;
  return CW_SLOTS.every(k=>(x[k]||'')===(y[k]||''));
}
function cwIsModified(core,colorway){
  return !colorway||!cwSameColors(cwColorsFromCore(core),colorway.colors);
}
// Apply only palette colors. Keep artwork/layout/effects untouched, and remap
// stamp/layer inks by palette-slot identity, matching the existing Presets logic.
function cwApply(core,colorway){
  if(!core||!colorway)return null;
  const next=cwCleanColors(colorway.colors);
  const old=cwColorsFromCore(core);
  if(!next||!old)return null;
  const c=cwClone(core),foreign=[];
  const slotOf=value=>CW_SLOTS.find(k=>old[k]&&old[k]===value)||null;
  const accents=[next.c3,next.c4].filter(Boolean),fallback=accents.length?accents:[next.ink];
  const remap=value=>{
    if(!value)return value;
    const slot=slotOf(value);
    if(slot)return next[slot]||next.ink;
    let i=foreign.indexOf(value);if(i<0){foreign.push(value);i=foreign.length-1}
    return fallback[i%fallback.length];
  };
  (c.tiles||[]).forEach(t=>{if(t&&t.ink)t.ink=remap(t.ink)});
  (c.layers||[]).forEach(l=>{if(l&&l.ink)l.ink=remap(l.ink)});
  c.proj={...c.proj,bg:next.bg,ink:next.ink};
  for(const k of ['c3','c4']){if(next[k])c.proj[k]=next[k];else delete c.proj[k]}
  c.activeColorway=String(colorway.id||'')||null;
  return c;
}
function init50(){
  // Shared API for the Colorways panel (Step 2) and deterministic tests.
  WBX.wbColorways={normalize:cwNormalize,capture:cwCapture,isModified:cwIsModified,apply:cwApply,sameColors:cwSameColors,slots:[...CW_SLOTS],max:CW_MAX};
}
export {cwNormalize,cwCapture,cwIsModified,cwApply,cwSameColors,init50};
