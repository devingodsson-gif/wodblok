import {$,WBS,WBX} from './01-launch-and-version.js';
import {coreStr,pmsg} from './18-projects-and-cover-overlay.js';

function init51(){
 const list=$('cw-list'),empty=$('cw-empty'),count=$('cw-count'),actions=$('cw-actions'),preview=$('cw-preview');
 const add=$('cw-add'),rename=$('cw-rename'),duplicate=$('cw-duplicate'),update=$('cw-update'),del=$('cw-delete');
 const renameBox=$('cw-rename-box'),nameInput=$('cw-name'),nameSave=$('cw-name-save'),nameCancel=$('cw-name-cancel');
 if(!list||!WBX.wbColorways)return;
 let selected=null,renaming=null;
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const core=()=>{try{return JSON.parse(coreStr())}catch(e){return{proj:WBS.proj||{}}}};
 const palette=()=>{const c=core().proj||{};return{bg:c.bg||'#FFFFFF',ink:c.ink||'#000000',c3:c.c3||c.ink||'#000000',c4:c.c4||c.bg||'#FFFFFF'}};
 const current=()=>WBX.wbColorways.list();
 const chosen=()=>current().find(x=>x.id===selected)||null;
 const setList=a=>WBX.wbColorways.setList(a);
 const makeId=()=> 'cw-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
 function doApply(rec){
  const c=WBX.wbColorways.apply(core(),rec);if(!c)return;
  if(WBX.wbApply)WBX.wbApply(c);
  if(WBX.wbCap)WBX.wbCap();
  WBX.wbColorways.setActive(rec.id);
  pmsg('Colorway “'+rec.name+'”.');
 }
 function swatches(colors){
  const cs=[colors.bg,colors.ink,colors.c3||colors.ink,colors.c4||colors.bg];
  return '<span class="cw-swatches" aria-hidden="true">'+cs.map(c=>'<i style="background:'+esc(c)+'"></i>').join('')+'</span>';
 }
 function paint(){
  const all=current();if(selected&&!all.some(x=>x.id===selected))selected=null;
  count.textContent=all.length+' / '+WBX.wbColorways.max;
  add.disabled=all.length>=WBX.wbColorways.max;
  empty.hidden=all.length>0;list.textContent='';
  const frag=document.createDocumentFragment();
  all.forEach(rec=>{
   const row=document.createElement('div');row.className='cw-row';row.dataset.id=rec.id;row.tabIndex=0;row.setAttribute('role','button');
   row.setAttribute('aria-label','Apply '+rec.name);row.setAttribute('aria-pressed',String(WBX.wbColorways.active()===rec.id));
   const pick=document.createElement('input');pick.type='checkbox';pick.className='cw-pick';pick.value=rec.id;pick.setAttribute('aria-label','Select '+rec.name+' for export');pick.addEventListener('click',e=>e.stopPropagation());
   const sw=document.createElement('span');sw.className='cw-swatches';sw.setAttribute('aria-hidden','true');
   [rec.colors.bg,rec.colors.ink,rec.colors.c3||rec.colors.ink,rec.colors.c4||rec.colors.bg].forEach(c=>{const i=document.createElement('i');i.style.background=c;sw.appendChild(i)});
   const main=document.createElement('span');main.className='cw-row-main';
   const b=document.createElement('b');b.textContent=rec.name;main.appendChild(b);
   const small=document.createElement('small');small.textContent=WBX.wbColorways.isModified(core(),rec)?'Colours changed':'Saved colours';main.appendChild(small);
   const mark=document.createElement('span');mark.className='cw-row-mark';mark.textContent=WBX.wbColorways.active()===rec.id?'Active':'';
   row.append(pick,sw,main,mark);row.addEventListener('click',e=>{if(e.target.closest('.cw-pick'))return;selected=rec.id;doApply(rec);paint()});
   row.addEventListener('keydown',e=>{if(e.target.closest('.cw-pick'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=rec.id;doApply(rec);paint()}});
   frag.appendChild(row);
  });
  list.appendChild(frag);const rec=chosen();actions.hidden=!rec;
  preview.hidden=!rec;preview.textContent='';
  if(rec){[rec.colors.bg,rec.colors.ink,rec.colors.c3||rec.colors.ink,rec.colors.c4||rec.colors.bg].forEach(c=>{const i=document.createElement('i');i.style.background=c;preview.appendChild(i)});const s=document.createElement('small');s.textContent=rec.name+(WBX.wbColorways.isModified(core(),rec)?' · modified':'');preview.appendChild(s)}
  renameBox.hidden=!renaming;
  if(renaming){const r=all.find(x=>x.id===renaming);if(r&&document.activeElement!==nameInput)nameInput.value=r.name}
 }
 add.addEventListener('click',()=>{
  const all=current();if(all.length>=WBX.wbColorways.max){pmsg('Colorway limit reached.');return}
  let base='Colorway '+(all.length+1),n=base,i=2;while(all.some(x=>x.name.toLowerCase()===n.toLowerCase()))n=base+' ('+(i++)+')';
  const rec=WBX.wbColorways.captureCurrent(n,makeId());if(!rec)return;
  setList([...all,rec]);selected=rec.id;WBX.wbColorways.setActive(rec.id);pmsg('Added “'+rec.name+'”.');paint();
 });
 rename.addEventListener('click',()=>{const r=chosen();if(!r)return;renaming=r.id;paint();nameInput.focus();nameInput.select()});
 nameSave.addEventListener('click',()=>{const r=chosen();if(!r||!renaming)return;const n=nameInput.value.trim().slice(0,40);if(!n){nameInput.focus();return}setList(current().map(x=>x.id===r.id?{...x,name:n}:x));renaming=null;paint()});
 nameCancel.addEventListener('click',()=>{renaming=null;paint()});
 nameInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();nameSave.click()}if(e.key==='Escape'){renaming=null;paint()}});
 duplicate.addEventListener('click',()=>{const r=chosen(),all=current();if(!r)return;if(all.length>=WBX.wbColorways.max){pmsg('Colorway limit reached.');return}const cp={...r,id:makeId(),name:(r.name+' copy').slice(0,40),colors:{...r.colors}};setList([...all,cp]);selected=cp.id;WBX.wbColorways.setActive(cp.id);paint()});
 update.addEventListener('click',()=>{const r=chosen();if(!r)return;const snap=WBX.wbColorways.captureCurrent(r.name,r.id);if(!snap)return;setList(current().map(x=>x.id===r.id?snap:x));WBX.wbColorways.setActive(r.id);pmsg('Updated “'+r.name+'”.');paint()});
 del.addEventListener('click',()=>{const r=chosen();if(!r)return;setList(current().filter(x=>x.id!==r.id));if(WBX.wbColorways.active()===r.id)WBX.wbColorways.setActive(null);selected=null;renaming=null;pmsg('Deleted “'+r.name+'”.');paint()});
 paint();
}
export {init51};
