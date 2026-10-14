import {$,WBS,WBX} from './01-launch-and-version.js';
import {C,CC,CM,saveCC,paintColors} from './04-canvas-and-stamp-outlines.js';
import {createColorwaysEngine,cleanHex} from './50-colorways.js';
import {coreStr,pmsg} from './18-projects-and-cover-overlay.js';

function init51(){
 const list=$('cw-list'),empty=$('cw-empty'),count=$('cw-count'),actions=$('cw-actions'),preview=$('cw-preview');
 const add=$('cw-add'),rename=$('cw-rename'),duplicate=$('cw-duplicate'),update=$('cw-update'),del=$('cw-delete');
 const renameBox=$('cw-rename-box'),nameInput=$('cw-name'),nameSave=$('cw-name-save'),nameCancel=$('cw-name-cancel');
 if(!list||!add)return;
 const hexOf=value=>cleanHex(/^#[0-9a-f]{3,6}$/i.test(String(value||''))?value:(CM[value]||''));
 const readColors=()=>{
  const p=WBS.proj||{};
  return {paper:hexOf(p.bg)||'#ffffff',ink:hexOf(p.ink)||'#000000',accent1:hexOf(p.c3)||hexOf(p.ink)||'#000000',accent2:hexOf(p.c4)||hexOf(p.bg)||'#ffffff'};
 };
 const paletteName=hex=>{
  const h=cleanHex(hex);if(!h)throw new TypeError('Invalid colorway color.');
  const found=C.find(([name,value])=>cleanHex(value)===h);
  if(found)return found[0];
  let name='Colorway '+h.slice(1).toUpperCase(),n=2;
  while(CM[name]&&cleanHex(CM[name])!==h)name='Colorway '+h.slice(1).toUpperCase()+' '+(n++);
  if(!CM[name]){C.push([name,h.toUpperCase()]);CM[name]=h.toUpperCase();if(!CC.includes(name))CC.push(name);saveCC();paintColors()}
  return name;
 };
 const applyColors=next=>{
  const old=readColors(),d=JSON.parse(coreStr());
  const slots=['ink','accent1','accent2','paper'];
  const names={paper:paletteName(next.paper),ink:paletteName(next.ink),accent1:paletteName(next.accent1),accent2:paletteName(next.accent2)};
  const oldHex={paper:old.paper,ink:old.ink,accent1:old.accent1,accent2:old.accent2};
  const remap=value=>{
   const h=hexOf(value);if(!h)return value;
   for(const slot of slots)if(oldHex[slot]===h)return names[slot];
   return value;
  };
  (d.tiles||[]).forEach(t=>{if(t&&t.ink)t.ink=remap(t.ink)});
  (d.layers||[]).forEach(l=>{if(l&&l.ink)l.ink=remap(l.ink)});
  d.proj={...(d.proj||{}),bg:names.paper,ink:names.ink,c3:names.accent1,c4:names.accent2};
  if(WBX.wbApply)WBX.wbApply(d);else{WBS.proj=d.proj;WBS.tiles=d.tiles;WBS.layers=d.layers}
  if(WBX.wbCap)WBX.wbCap();
 };
 const engine=createColorwaysEngine({
  readColors,
  applyColors,
  onChange:snapshot=>{WBS.colorways=snapshot.records;WBS.activeColorway=snapshot.activeId}
 });
 engine.restore({records:WBS.colorways||[],activeId:WBS.activeColorway||null});
 let selected=engine.active()?.id||null,renaming=null;
 const current=()=>engine.list(),chosen=()=>current().find(x=>x.id===selected)||null;
 const slots=c=>[c.paper,c.ink,c.accent1,c.accent2];
 function apply(rec){engine.apply(rec.id);selected=rec.id;pmsg('Applied colorway “'+rec.name+'”.')}
 function paint(){
  const all=current();if(selected&&!all.some(x=>x.id===selected))selected=null;
  count.textContent=all.length+' / '+engine.max;add.disabled=all.length>=engine.max;
  empty.hidden=all.length>0;list.textContent='';
  for(const rec of all){
   const row=document.createElement('div');row.className='cw-row';row.dataset.id=rec.id;row.tabIndex=0;row.setAttribute('role','button');
   row.setAttribute('aria-label','Apply '+rec.name);row.setAttribute('aria-pressed',String(engine.active()?.id===rec.id));
   const sw=document.createElement('span');sw.className='cw-swatches';sw.setAttribute('aria-hidden','true');
   slots(rec.colors).forEach(color=>{const i=document.createElement('i');i.style.background=color;sw.appendChild(i)});
   const main=document.createElement('span');main.className='cw-row-main';
   const title=document.createElement('b');title.textContent=rec.name;main.appendChild(title);
   const status=document.createElement('small');status.textContent=engine.isModified(rec.id)?'Colours changed':'Saved colours';main.appendChild(status);
   const mark=document.createElement('span');mark.className='cw-row-mark';mark.textContent=engine.active()?.id===rec.id?'Active':'';
   row.append(sw,main,mark);
   row.addEventListener('click',()=>{selected=rec.id;apply(rec);paint()});
   row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=rec.id;apply(rec);paint()}});
   list.appendChild(row);
  }
  const rec=chosen();actions.hidden=!rec;preview.hidden=!rec;preview.textContent='';
  if(rec){slots(rec.colors).forEach(color=>{const i=document.createElement('i');i.style.background=color;preview.appendChild(i)});const small=document.createElement('small');small.textContent=rec.name+(engine.isModified(rec.id)?' · modified':'');preview.appendChild(small)}
  renameBox.hidden=!renaming;
  if(renaming){const r=all.find(x=>x.id===renaming);if(r&&document.activeElement!==nameInput)nameInput.value=r.name}
 }
 add.addEventListener('click',()=>{
  const all=current();if(all.length>=engine.max){pmsg('Colorway limit reached.');return}
  const base='Colorway '+(all.length+1);let name=base,n=2;while(all.some(x=>x.name.toLowerCase()===name.toLowerCase()))name=base+' ('+(n++)+')';
  const rec=engine.add(name);selected=rec.id;pmsg('Saved “'+rec.name+'”.');paint();
 });
 rename.addEventListener('click',()=>{const rec=chosen();if(!rec)return;renaming=rec.id;paint();nameInput.focus();nameInput.select()});
 nameSave.addEventListener('click',()=>{if(!renaming)return;try{engine.rename(renaming,nameInput.value);selected=renaming;renaming=null;paint()}catch(e){pmsg(e.message)}});
 nameCancel.addEventListener('click',()=>{renaming=null;paint()});
 nameInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();nameSave.click()}if(e.key==='Escape'){renaming=null;paint()}});
 duplicate.addEventListener('click',()=>{const rec=chosen();if(!rec)return;try{const copy=engine.duplicate(rec.id);selected=copy.id;paint()}catch(e){pmsg(e.message)}});
 update.addEventListener('click',()=>{const rec=chosen();if(!rec)return;engine.updateColors(rec.id);selected=rec.id;pmsg('Updated “'+rec.name+'”.');paint()});
 del.addEventListener('click',()=>{const rec=chosen();if(!rec)return;engine.remove(rec.id);selected=null;renaming=null;pmsg('Deleted “'+rec.name+'”.');paint()});
 WBX.wbColorways=engine;
 paint();
}
export {init51};
