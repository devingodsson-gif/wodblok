import {kv} from '../platform/index.js';
import {$,WBX} from './01-launch-and-version.js';
import {C,rowMenu} from './04-canvas-and-stamp-outlines.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
import {normHexA,trayAdd,trayDone} from './50-tray-core.js';
import {openPicker,closePicker} from './51-colour-picker.js';
// ===== Saved colours: one big list of single colours you keep, in folders (style guide 12) =====
// Yours (home) holds colours that are in no folder; your folders sit beside Wada's colours, a built-in set. A folder is known by its
// path ("Greens/Moss"); a colour stores that one path string. Kept in the settings record through the platform, like the saved trays.
// Offered first in the colour picker's "Saved colours" dropdown (WBX.scList).
const SC_KEY='wb200_colours',SC_OPEN='wb200_coloursui';
const SC_SET='Wada colours';
const scEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SC={q:'',active:'',open:new Set(['']),scForm:null,ren:null,sel:null,k:''};
const scIC=(d,w)=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const scFOLDER=scIC('<path d="M3.5 7.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V9.5A1.5 1.5 0 0 0 19 8h-7l-2-2.5H5A1.5 1.5 0 0 0 3.5 7z"/>'),scFOLDER_O=scIC('<path d="M3.5 18.5V7A1.5 1.5 0 0 1 5 5.5h4l2 2.5h6.5A1.5 1.5 0 0 1 19 9.5V11M3.5 18.5l2.4-7a1.5 1.5 0 0 1 1.4-1h13.2a1 1 0 0 1 .95 1.3l-2 6.2a1.5 1.5 0 0 1-1.4 1H3.5z"/>');
const scHOME=scIC('<path d="M4 11l8-6.5 8 6.5M6 9.5V19h12V9.5"/>'),scCHEV='<svg class="lfa" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"/></svg>';
const scMORE='<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>',scX=scIC('<path d="M6 6l12 12M18 6L6 18"/>',2);
function scLoad(){let d=null;try{d=JSON.parse(kv.get(SC_KEY)||'null')}catch(e){}
 if(!d||typeof d!='object')d={f:[],c:[]};
 d.f=(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x);
 d.c=(Array.isArray(d.c)?d.c:[]).filter(x=>x&&typeof x.id=='string'&&normHexA(x.h)).map(x=>({id:x.id,n:String(x.n||'').slice(0,40),h:normHexA(x.h),f:typeof x.f=='string'?x.f:''}));
 return d}
const scStore=d=>{try{kv.set(SC_KEY,JSON.stringify(d))}catch(e){pmsg('Could not keep the saved colours in this browser.')}};
const scUi=()=>{try{const u=JSON.parse(kv.get(SC_OPEN)||'null');if(u){SC.open=new Set(['',...(u.o||[])]);SC.active=u.a||''}}catch(e){}};
const scUiSave=()=>{try{kv.set(SC_OPEN,JSON.stringify({o:[...SC.open].filter(Boolean),a:SC.active}))}catch(e){}};
const scNameOf=c=>c.n||c.h.slice(0,7).toUpperCase();
const scCmp=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
const scLeaf=p=>p.split('/').pop(),scParent=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')):'';
// every folder path that exists, including parents of deeper ones
function scFolders(d){const s=new Set();d.f.forEach(p=>{let q='';p.split('/').forEach(part=>{q=q?q+'/'+part:part;s.add(q)})});d.c.forEach(c=>{let q='';if(c.f)c.f.split('/').forEach(part=>{q=q?q+'/'+part:part;s.add(q)})});return[...s]}
const scKids=(fs,p)=>fs.filter(x=>scParent(x)===p).sort((a,b)=>scCmp(scLeaf(a),scLeaf(b)));
const scInside=(c,p)=>c.f===p||c.f.startsWith(p+'/');
const scWada=()=>C.map(([n,h])=>({id:'w:'+n,n,h:normHexA(h)||h,f:SC_SET,set:1}));
// the list the colour picker offers, own colours first
WBX.scList=()=>{const d=scLoad(),out=[],own=d.c.map(c=>({n:scNameOf(c),h:c.h,t:c.f||'Yours'}));
 return own.length?[{g:'Saved colours',items:own}]:[]};
function scNameOk(s){s=String(s||'').trim();return s&&s.length<=30&&!/[\\"<>&|/]/.test(s)?s:''}
function scRow(c,depth,own){const sw=`<span class="sts"><i style="background:${c.h}"></i></span>`;
 if(SC.ren===c.id)return`<div class="str scr ren" data-c="${c.id}" style="--d:${depth}">${sw}<input type="text" maxlength="40" value="${scEsc(c.n)}" placeholder="${c.h.slice(0,7).toUpperCase()}" aria-label="Colour name"></div>`;
 return`<div class="str scr" data-c="${c.id}" role="listitem" tabindex="0" style="--d:${depth}" aria-label="${scEsc(scNameOf(c))}">${sw}<b>${scEsc(scNameOf(c))}</b>${c.n?`<small>${c.h.slice(0,7).toUpperCase()}</small>`:'<small></small>'}<button type="button" class="ib" data-more aria-haspopup="menu" aria-expanded="false" aria-label="Colour menu">${scMORE}</button>${own?`<button type="button" class="ib" data-del aria-label="Delete ${scEsc(scNameOf(c))}">${scX}</button>`:''}</div>`}
function scFrow(key,label,count,depth,o){const open=SC.open.has(key);
 return`<div class="lfr scf${SC.active===key?' act':''}" data-k="${scEsc(key)}" role="treeitem" tabindex="0" aria-expanded="${open}" style="--d:${depth}">${scCHEV}<span class="lfi">${o.home?scHOME:open?scFOLDER_O:scFOLDER}</span><span class="lfn">${scEsc(label)}</span><span class="lfc">${count}</span>${o.menu?`<button type="button" class="ib" data-fmore aria-haspopup="menu" aria-expanded="false" aria-label="Menu for ${scEsc(label)}">${scMORE}</button>`:''}</div>`}
function scForm(depth){const f=SC.form;if(!f)return'';
 if(f.t=='del')return`<div class="scform" style="--d:${depth}"><span>Delete “${scEsc(scLeaf(f.p))}” and the folders scInside?</span><button type="button" class="alt warn" data-fok>Delete</button><button type="button" class="alt" data-fcx>Cancel</button></div>`;
 return`<div class="scform" style="--d:${depth}"><input type="text" maxlength="30" value="${scEsc(f.v||'')}" aria-label="Folder name" placeholder="Folder name"><button type="button" class="primary" data-fok>${f.t=='ren'?'Rename':'Create'}</button><button type="button" class="alt" data-fcx>Cancel</button></div>`}
function scPaint(force){const box=$('scl');if(!box||!box.isConnected)return;const d=scLoad(),fs=scFolders(d),q=SC.q.trim().toLowerCase().split(/\s+/).filter(Boolean),W=scWada();
 const k=JSON.stringify([d,SC.q,[...SC.open],SC.active,SC.form,SC.ren]);if(!force&&k===SC.k)return;SC.k=k;
 $('scn').textContent=d.c.length+W.length?String(d.c.length):'';
 let h='';
 const hay=c=>(scNameOf(c)+' '+c.h+' '+c.f).toLowerCase();
 if(q.length){const hit=[...d.c,...W].filter(c=>q.every(w=>hay(c).includes(w)));h=hit.slice(0,300).map(c=>scRow(c,0,!c.set)).join('')||'<div class="stno">No matching colour</div>';$('scn').textContent=hit.length+' found'}
 else{
  const count=p=>d.c.filter(c=>scInside(c,p)).length;
  const tree=(p,depth)=>{let s='';scKids(fs,p).forEach(f=>{s+=scFrow(f,scLeaf(f),count(f),depth,{menu:1});if(SC.open.has(f)){if(SC.form&&SC.form.p===f)s+=scForm(depth+1);s+=tree(f,depth+1);const own=d.c.filter(c=>c.f===f).sort((a,b)=>scCmp(scNameOf(a),scNameOf(b)));s+=own.map(c=>scRow(c,depth+1,1)).join('')||(scKids(fs,f).length?'':`<div class="stno" style="--d:${depth+1}">Empty folder</div>`)}});return s};
  // Yours, then your top-level folders and the built-in set together, A to Z
  const home=d.c.filter(c=>!c.f).sort((a,b)=>scCmp(scNameOf(a),scNameOf(b)));
  h+=scFrow('','Yours',home.length,0,{home:1});
  if(SC.open.has('')){if(SC.form&&SC.form.p===''&&SC.form.t=='new')h+=scForm(1);h+=home.map(c=>scRow(c,1,1)).join('')||'<div class="stno" style="--d:1">No colours yet</div>'}
  const tops=[...scKids(fs,'').map(f=>({k:f,set:0})),{k:SC_SET,set:1}].sort((a,b)=>scCmp(scLeaf(a.k),scLeaf(b.k)));
  tops.forEach(t=>{if(t.set){h+=scFrow(SC_SET,SC_SET,W.length,0,{});if(SC.open.has(SC_SET))h+=W.map(c=>scRow(c,1,0)).join('')}
   else{h+=scFrow(t.k,scLeaf(t.k),count(t.k),0,{menu:1});if(SC.open.has(t.k)){if(SC.form&&SC.form.p===t.k)h+=scForm(1);h+=tree(t.k,1);const own=d.c.filter(c=>c.f===t.k).sort((a,b)=>scCmp(scNameOf(a),scNameOf(b)));h+=own.map(c=>scRow(c,1,1)).join('')||(scKids(fs,t.k).length?'':'<div class="stno" style="--d:1">Empty folder</div>')}}});
 }
 box.innerHTML=h;
 const ri=box.querySelector('.ren input,.scform input');if(ri&&(SC.ren||SC.form)){ri.focus();ri.select()}
 const all=$('scall');if(all){const anyOpen=[...SC.open].some(Boolean);all.setAttribute('aria-label',anyOpen?'Collapse all':'Expand all');all.setAttribute('aria-pressed',String(anyOpen))}}
function scAddColour(hex,name,folder){const d=scLoad(),c={id:newId(),n:name||'',h:normHexA(hex)||'#888888',f:folder||''};d.c.push(c);scStore(d);return c}
function scEdit(id,anchor){const d=scLoad(),c=d.c.find(x=>x.id===id);if(!c)return;
 const set=fn=>{const e=scLoad(),y=e.c.find(x=>x.id===id);if(y){fn(y);scStore(e);scPaint(true)}};
 openPicker(anchor,{value:c.h,alpha:true,name:c.n,namePh:c.h.slice(0,7).toUpperCase(),onName:v=>set(y=>{y.n=String(v||'').trim().slice(0,40)}),onInput:h=>set(y=>{y.h=normHexA(h)||y.h}),
  actions:[['Add to the tray',scIC('<path d="M12 5v14M5 12h14"/>',2),()=>{const y=scLoad().c.find(x=>x.id===id);if(!y)return;if(trayAdd(y.h,y.n)==null)pmsg('The tray is full.');else{trayDone('Added “'+scNameOf(y)+'” to the tray');pmsg('Added “'+scNameOf(y)+'” to the tray.')}}]]})}
function scFolderPaths(d){const fs=scFolders(d).sort((a,b)=>scCmp(a.replace(/\//g,' / '),b.replace(/\//g,' / ')));return fs}
function init57(){
 scUi();
 const box=$('scl');if(!box)return;
 const scFolderMenu=(btn,p)=>rowMenu(btn,[['New folder inside',()=>{SC.open.add(p);SC.active=p;SC.form={t:'new',p,v:''};scUiSave();scPaint(true)}],['Rename',()=>{SC.form={t:'ren',p,v:scLeaf(p)};scPaint(true)}],['Delete folder',()=>{SC.form={t:'del',p};scPaint(true)}]]);
 const scToggle=k=>{if(SC.open.has(k)&&k!==''){SC.open.delete(k);if(SC.active===k||SC.active.startsWith(k+'/'))SC.active=k===SC_SET?'':scParent(k)}else{SC.open.add(k);if(k!==SC_SET)SC.active=k}scUiSave();scPaint(true)};
 box.addEventListener('click',e=>{if(e.target.closest('input'))return;
  const fb=e.target.closest('[data-fok]'),cx=e.target.closest('[data-fcx]');
  if(cx){SC.form=null;scPaint(true);return}
  if(fb){const f=SC.form,d=scLoad();if(!f)return;
   if(f.t=='del'){const gone=p=>p===f.p||p.startsWith(f.p+'/');d.f=d.f.filter(p=>!gone(p));d.c.forEach(c=>{if(c.f&&gone(c.f))c.f=''});scStore(d);SC.form=null;SC.open.delete(f.p);if(gone(SC.active))SC.active=scParent(f.p);scUiSave();scPaint(true);pmsg('Deleted the folder “'+scLeaf(f.p)+'”. Its colours went back to Yours.');return}
   const inp=box.querySelector('.scform input'),n=scNameOk(inp&&inp.value);if(!n){if(inp)inp.focus();return}
   if(f.t=='new'){const path=f.p?f.p+'/'+n:n,ex=scFolders(d).find(x=>x.toLowerCase()==path.toLowerCase());if(!ex){d.f.push(path);scStore(d)}const use=ex||path;SC.open.add(use);if(f.p)SC.open.add(f.p);SC.active=use;SC.form=null;scUiSave();scPaint(true);pmsg(ex?'Opened the folder “'+use.replace(/\//g,' / ')+'”.':'Made the folder “'+use.replace(/\//g,' / ')+'”.');return}
   if(f.t=='ren'){const path=f.p.slice(0,f.p.length-scLeaf(f.p).length)+n;if(path.toLowerCase()!=f.p.toLowerCase()||path!=f.p){const re=p=>p===f.p?path:p.startsWith(f.p+'/')?path+p.slice(f.p.length):p;
     const clash=scFolders(d).find(x=>x.toLowerCase()==path.toLowerCase()&&x!==f.p);
     d.f=[...new Set(d.f.map(re))];d.c.forEach(c=>{c.f=re(c.f)});if(!d.f.includes(path))d.f.push(path);scStore(d);SC.open=new Set([...SC.open].map(re));SC.active=re(SC.active);
     pmsg(clash?'Merged “'+scLeaf(f.p)+'” into “'+scLeaf(path)+'”.':'Renamed the folder to “'+n+'”.')}SC.form=null;scUiSave();scPaint(true)}return}
  const fm=e.target.closest('[data-fmore]'),fr=e.target.closest('.scf');
  if(fm){e.stopPropagation();scFolderMenu(fm,fr.dataset.k);return}
  if(fr){scToggle(fr.dataset.k);return}
  const r=e.target.closest('.scr');if(!r)return;const id=r.dataset.c,d=scLoad(),own=d.c.find(c=>c.id==id),set=scWada().find(c=>c.id==id),c=own||set;if(!c)return;
  if(e.target.closest('[data-del]')){d.c=d.c.filter(x=>x.id!==id);scStore(d);scPaint(true);pmsg('Deleted the colour “'+scNameOf(c)+'”.');return}
  const more=e.target.closest('[data-more]');
  const items=own?[['Edit colour',()=>scEdit(id,r)],['Rename',()=>{SC.ren=id;scPaint(true)}],['Add to the tray',()=>{if(trayAdd(c.h,c.n)==null)pmsg('The tray is full.');else{trayDone('Added “'+scNameOf(c)+'” to the tray');pmsg('Added “'+scNameOf(c)+'” to the tray.')}}]]
   :[['Copy to Yours',()=>{const n=scAddColour(c.h,c.n,SC.active&&SC.active!==SC_SET?SC.active:'');pmsg('Copied “'+scNameOf(c)+'” to “'+(n.f?n.f.replace(/\//g,' / '):'Yours')+'”.');scPaint(true)}],['Add to the tray',()=>{if(trayAdd(c.h,c.n)==null)pmsg('The tray is full.');else{trayDone('Added “'+scNameOf(c)+'” to the tray');pmsg('Added “'+scNameOf(c)+'” to the tray.')}}]];
  if(own){const fp=scFolderPaths(d);if(c.f)items.push(['Move to Yours',()=>scMv(id,'')]);fp.filter(p=>p!==c.f).slice(0,40).forEach(p=>items.push(['Move to “'+scEsc(p.replace(/\//g,' / '))+'”',()=>scMv(id,p)]))}
  if(more){e.stopPropagation();rowMenu(more,items);return}
  if(own)scEdit(id,r);else items[0][1]()});
 const scMv=(id,p)=>{const d=scLoad(),c=d.c.find(x=>x.id===id);if(!c)return;c.f=p;scStore(d);if(p)SC.open.add(p);scUiSave();scPaint(true);pmsg('Moved “'+scNameOf(c)+'” to “'+(p?p.replace(/\//g,' / '):'Yours')+'”.')};
 box.addEventListener('contextmenu',e=>{const fr=e.target.closest('.scf[data-k]'),r=e.target.closest('.scr');const b=(fr||r)&&(fr||r).querySelector('[data-fmore],[data-more]');if(b){e.preventDefault();b.click()}});
 box.addEventListener('keydown',e=>{const t=e.target;
  if(t.matches&&t.matches('.ren input')){e.stopPropagation();if(e.key=='Enter')t.blur();else if(e.key=='Escape'){SC.ren=null;scPaint(true)}return}
  if(t.matches&&t.matches('.scform input')){e.stopPropagation();if(e.key=='Enter'){SC.form.v=t.value;box.querySelector('[data-fok]').click()}else if(e.key=='Escape'){SC.form=null;scPaint(true)}return}
  if(t.classList&&t.classList.contains('scf')){const k=t.dataset.k;if(e.key=='ArrowRight'&&!SC.open.has(k)){e.preventDefault();scToggle(k)}else if(e.key=='ArrowLeft'&&SC.open.has(k)&&k!==''){e.preventDefault();scToggle(k)}else if(e.key=='Enter'||e.key==' '){e.preventDefault();scToggle(k)}return}
  if(t.classList&&t.classList.contains('scr')&&(e.key=='Enter'||e.key==' ')){e.preventDefault();t.click()}});
 box.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('.scform input')&&SC.form)SC.form.v=e.target.value});
 box.addEventListener('focusout',e=>{const i=e.target;if(!i.matches||!i.matches('.ren input')||!SC.ren)return;const v=i.value.trim().slice(0,40),id=SC.ren;SC.ren=null;const d=scLoad(),c=d.c.find(x=>x.id===id);if(c){c.n=v;scStore(d)}scPaint(true)});
 $('scq').addEventListener('keydown',e=>e.stopPropagation());$('scq').addEventListener('input',()=>{SC.q=$('scq').value;scPaint(true)});
 $('scall').onclick=()=>{const anyOpen=[...SC.open].some(Boolean);if(anyOpen){SC.open=new Set(['']);SC.active=''}else{const d=scLoad();SC.open=new Set(['',SC_SET,...scFolders(d)])}scUiSave();scPaint(true)};
 $('scnew').onclick=()=>{const p=SC.active&&SC.active!==SC_SET?SC.active:'';SC.open.add(p);SC.form={t:'new',p,v:''};scPaint(true)};
 $('scadd').onclick=()=>{const p=SC.active&&SC.active!==SC_SET?SC.active:'',c=scAddColour('#b8914f','',p);SC.open.add(p);scUiSave();scPaint(true);const r=box.querySelector(`[data-c="${c.id}"]`);scEdit(c.id,r||$('scadd'))};
 {const prev=WBX.wbTrayPaint;WBX.wbTrayPaint=f=>{if(prev)prev(f);scPaint(f)}}
 scPaint(true)}
export {init57,scLoad};
