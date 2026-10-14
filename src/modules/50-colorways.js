import {WBS,WBX} from './01-launch-and-version.js';
import {C,CM,CC,saveCC,paintColors} from './04-canvas-and-stamp-outlines.js';

// Colorways are named sets of the four project palette slots. They belong to the
// project document (not browser settings), so they travel with .wodblok files.
const CW_SLOTS=['bg','ink','c3','c4'];
const CW_HEX=/^#[0-9a-f]{6}$/i;
const CW_MAX=60;
const cwClone=v=>JSON.parse(JSON.stringify(v));
const cwTemporaryNames=new Set();
const cwHex=v=>typeof v==='string'?(CW_HEX.test(v)?v.toUpperCase():(CM[v]&&CW_HEX.test(CM[v])?CM[v].toUpperCase():null)):null;
const cwPaletteName=(hex,persist=true)=>{const h=cwHex(hex);if(!h)return null;const found=C.find(([,v])=>cwHex(v)===h);if(found)return found[0];let name='Colorway '+h.slice(1),n=2;while(CM[name]&&cwHex(CM[name])!==h)name='Colorway '+h.slice(1)+' '+(n++);if(!CM[name]){C.push([name,h]);CM[name]=h;if(persist){CC.push(name);saveCC();paintColors()}else cwTemporaryNames.add(name)}return name;};
function cwCleanColors(input){
  if(!input||typeof input!=='object')return null;
  const colors={};
  for(const k of CW_SLOTS){const v=cwHex(input[k]);if(v)colors[k]=v}
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
  return cwCleanColors({bg:cwHex(p.bg),ink:cwHex(p.ink),c3:cwHex(p.c3),c4:cwHex(p.c4)});
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
  const slotOf=value=>{const h=cwHex(value);return CW_SLOTS.find(k=>old[k]&&old[k]===h)||null};
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
function cwToProject(core,persist=true){
  if(!core||!core.proj)return null;
  const c=cwClone(core),map=v=>cwPaletteName(v,persist)||v;
  c.proj={...c.proj};
  for(const k of CW_SLOTS){if(c.proj[k])c.proj[k]=map(c.proj[k]);else if(k==='c3'||k==='c4')delete c.proj[k]}
  (c.tiles||[]).forEach(t=>{if(t&&t.ink)t.ink=map(t.ink)});
  (c.layers||[]).forEach(l=>{if(l&&l.ink)l.ink=map(l.ink)});
  return c;
}
function cwClearTemporary(){for(const name of cwTemporaryNames){const i=C.findIndex(([n])=>n===name);if(i>=0)C.splice(i,1);delete CM[name]}cwTemporaryNames.clear()}
function init50(){
  // Shared API for the Colorways panel (Step 2) and deterministic tests.
  const currentCore=()=>{try{const c=WBX.wbCoreStr?JSON.parse(WBX.wbCoreStr()):{proj:WBS.proj||{}};c.proj={bg:c.proj&&c.proj.bg||'#FFFFFF',ink:c.proj&&c.proj.ink||'#000000',...(c.proj&&c.proj.c3?{c3:c.proj.c3}:{}),...(c.proj&&c.proj.c4?{c4:c.proj.c4}:{})};return c}catch(e){return{proj:{bg:WBS.proj&&WBS.proj.bg||'#FFFFFF',ink:WBS.proj&&WBS.proj.ink||'#000000'}}}};
  const captureCurrent=(name,id)=>{const c=currentCore();if(!c.proj)c.proj={bg:'#FFFFFF',ink:'#000000'};return cwCapture(c,name,id)};
  WBX.wbColorways={normalize:cwNormalize,toProject:cwToProject,clearTemporary:cwClearTemporary,capture:(name,id)=>captureCurrent(name,id),captureCore:cwCapture,captureCurrent,isModified:cwIsModified,apply:cwApply,sameColors:cwSameColors,slots:[...CW_SLOTS],max:CW_MAX,list:()=>cwNormalize(WBS.colorways),active:()=>WBS.activeColorway||null,setList:list=>{WBS.colorways=cwNormalize(list);if(!WBS.colorways.some(x=>x.id===WBS.activeColorway))WBS.activeColorway=null;if(WBX.wbCap)WBX.wbCap();return WBS.colorways},setActive:id=>{WBS.activeColorway=WBS.colorways&&WBS.colorways.some(x=>x.id===id)?id:null;if(WBX.wbCap)WBX.wbCap();return WBS.activeColorway}};
}
export {cwNormalize,cwCapture,cwIsModified,cwApply,cwSameColors,init50};
