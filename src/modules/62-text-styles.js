import {kv} from '../platform/index.js';
import {$,WBX} from './01-launch-and-version.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
import {teF} from './60-text-engine.js';
import {txoRead,txoWrite} from './61-text-panel.js';
// ===== Text styles: a library of looks for text (font, spacing, case, curve, path, warp, effects), in folders (style guide 12, same tree as Saved colours) =====
// Yours (home) holds styles that are in no folder; your folders sit beside Starter styles, a built-in set. A folder is known by its path ("Posters/Wood"); a style stores that one path string.
// A style keeps every Text panel setting except the words and the styled letters. Applying one keeps the words, the size and the box unless the style sets them.
const TS_KEY='wb200_textstyles',TS_OPEN='wb200_textstylesui',TS_SET='Starter styles';
const tsEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TS={q:'',active:'',open:new Set(['']),form:null,ren:null,k:''};
const tsIC=(d,w)=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const tsFOLDER=tsIC('<path d="M3.5 7.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V9.5A1.5 1.5 0 0 0 19 8h-7l-2-2.5H5A1.5 1.5 0 0 0 3.5 7z"/>'),tsFOLDER_O=tsIC('<path d="M3.5 18.5V7A1.5 1.5 0 0 1 5 5.5h4.5l2 2.5H19A1.5 1.5 0 0 1 20.5 9.5V11M3.5 18.5l2.4-7a1.5 1.5 0 0 1 1.4-1h13.2a1 1 0 0 1 1 1.3l-2 6.2a1.5 1.5 0 0 1-1.4 1H5"/>');
const tsHOME=tsIC('<path d="M4 11l8-6.5 8 6.5M6 9.5V19h12V9.5"/>'),tsCHEV='<svg class="lfa" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"/></svg>';
const tsMORE='<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>',tsX=tsIC('<path d="M6 6l12 12M18 6L6 18"/>');
// the built-in set (fonts that are not installed fall back to the current font when applied)
const TS_BUILT=[['Wood type poster',{f:'rye',tc:'u',lh:90,ls:2,rp:8,rr:4}],['Seal',{f:'cinzel',tc:'u',ls:12,cv:100}],['Wavy',{f:'lobster',pt:'w',pa:45,pw:45}],['Typewriter',{f:'elite',ls:4,rp:10,rr:3,rs:6}],['Bold block',{f:'montserrat',tc:'u',ls:2,lh:100}],['Swell',{f:'cinzel',tc:'u',wp:'b',wa:60}],['Spiral',{f:'cinzel',tc:'u',pt:'s',pa:40,pw:60}],['Bounce',{f:'lobster',bb:40,rr:8}],['Flag',{f:'cinzel',tc:'u',wp:'f',wa:70}],['Stacked lines',{f:'bebas',tc:'u',lh:85,al:'j',ls:2}]];
const tsBuilt=()=>TS_BUILT.filter(([,o])=>teF[o.f]).map(([n,o])=>({id:'b:'+n,n,o,f:TS_SET,set:1}));
function tsLoad(){let d=null;try{d=JSON.parse(kv.get(TS_KEY)||'null')}catch(e){}
 if(!d||typeof d!='object')d={f:[],c:[]};
 d.f=(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x);
 d.c=(Array.isArray(d.c)?d.c:[]).filter(x=>x&&typeof x.id=='string'&&x.o&&typeof x.o=='object').map(x=>({id:x.id,n:String(x.n||'').slice(0,40),o:x.o,f:typeof x.f=='string'?x.f:''}));
 return d}
const tsStore=d=>{try{kv.set(TS_KEY,JSON.stringify(d))}catch(e){pmsg('Could not keep the text styles in this browser.')}};
const tsUi=()=>{try{const u=JSON.parse(kv.get(TS_OPEN)||'null');if(u){TS.open=new Set(['',...(u.o||[])]);TS.active=u.a||''}}catch(e){}};
const tsUiSave=()=>{try{kv.set(TS_OPEN,JSON.stringify({o:[...TS.open].filter(Boolean),a:TS.active}))}catch(e){}};
const tsNameOf=c=>c.n||'Text style';
const tsCmp=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
const tsLeaf=p=>p.split('/').pop(),tsParent=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')):'';
function tsFolders(d){const s=new Set();d.f.forEach(p=>{let q='';p.split('/').forEach(part=>{q=q?q+'/'+part:part;s.add(q)})});d.c.forEach(c=>{let q='';if(c.f)c.f.split('/').forEach(part=>{q=q?q+'/'+part:part;s.add(q)})});return[...s]}
const tsKids=(fs,p)=>fs.filter(x=>tsParent(x)===p).sort((a,b)=>tsCmp(tsLeaf(a),tsLeaf(b)));
const tsInside=(c,p)=>c.f===p||c.f.startsWith(p+'/');
function tsNameOk(s){s=String(s||'').trim();return s&&s.length<=30&&!/[\\"<>&|/]/.test(s)?s:''}
// what a style keeps: everything in the panel except the words, the styled letters and the seed's unset state
function tsSnap(){const o=txoRead();delete o.text;delete o.sty;return o}
function tsApply(c){const cur=txoRead(),keep=teF[c.o.f]?{}:{f:cur.f},o={text:cur.text,f:cur.f,sz:cur.sz,wd:cur.wd,ht:cur.ht,ls:0,ws:0,lh:115,al:'c',tc:'',va:'t',cv:0,rot:0,...c.o,...keep};if(cur.sty)o.sty=cur.sty;o.text=cur.text;
 txoWrite(o,null,false);$('tx_f').dispatchEvent(new Event('input',{bubbles:true}));pmsg('Applied the style “'+tsNameOf(c)+'”.')}
function tsRow(c,depth,own){const f=teF[c.o.f]||teF.cinzel,pv=`<span class="tsa" style="font-family:'${tsEsc(f.fam||'Cinzel')}',sans-serif;font-weight:${f.w||400}" aria-hidden="true">Aa</span>`;
 if(TS.ren===c.id)return`<div class="str scr ren" data-c="${c.id}" style="--d:${depth}">${pv}<input type="text" maxlength="40" value="${tsEsc(c.n)}" placeholder="Text style" aria-label="Style name"></div>`;
 return`<div class="str scr" data-c="${c.id}" role="listitem" tabindex="0" style="--d:${depth}" aria-label="${tsEsc(tsNameOf(c))}">${pv}<b>${tsEsc(tsNameOf(c))}</b><small>${tsEsc(f.lbl||f.fam||'')}</small><button type="button" class="ib" data-more aria-haspopup="menu" aria-expanded="false" aria-label="Style menu">${tsMORE}</button>${own?`<button type="button" class="ib" data-del aria-label="Delete ${tsEsc(tsNameOf(c))}">${tsX}</button>`:''}</div>`}
function tsFrow(key,label,count,depth,o){const open=TS.open.has(key);
 return`<div class="lfr scf${TS.active===key?' act':''}" data-k="${tsEsc(key)}" role="treeitem" tabindex="0" aria-expanded="${open}" style="--d:${depth}">${tsCHEV}<span class="lfi">${o.home?tsHOME:open?tsFOLDER_O:tsFOLDER}</span><span class="lfn">${tsEsc(label)}</span><span class="lfc">${count}</span>${o.menu?`<button type="button" class="ib" data-fmore aria-haspopup="menu" aria-expanded="false" aria-label="Menu for ${tsEsc(label)}">${tsMORE}</button>`:''}</div>`}
function tsForm(depth){const f=TS.form;if(!f)return'';
 if(f.t=='del')return`<div class="scform" style="--d:${depth}"><span>Delete “${tsEsc(tsLeaf(f.p))}” and the folders inside?</span><button type="button" class="alt warn" data-fok>Delete</button><button type="button" class="alt" data-fcx>Cancel</button></div>`;
 return`<div class="scform" style="--d:${depth}"><input type="text" maxlength="30" value="${tsEsc(f.v||'')}" aria-label="Folder name" placeholder="Folder name"><button type="button" class="primary" data-fok>${f.t=='ren'?'Rename':'Create'}</button><button type="button" class="alt" data-fcx>Cancel</button></div>`}
function tsPaint(force){const box=$('tsl');if(!box||!box.isConnected)return;const d=tsLoad(),fs=tsFolders(d),q=TS.q.trim().toLowerCase().split(/\s+/).filter(Boolean),B=tsBuilt();
 const k=JSON.stringify([d,TS.q,[...TS.open],TS.active,TS.form,TS.ren,B.length]);if(!force&&k===TS.k)return;TS.k=k;
 $('tsn').textContent=d.c.length+B.length?String(d.c.length):'';
 let h='';const hay=c=>(tsNameOf(c)+' '+c.f+' '+c.o.f).toLowerCase();
 if(q.length){const hit=[...d.c,...B].filter(c=>q.every(w=>hay(c).includes(w)));h=hit.slice(0,300).map(c=>tsRow(c,0,!c.set)).join('')||'<div class="stno">No matching style</div>';$('tsn').textContent=hit.length+' found'}
 else{
  const count=p=>d.c.filter(c=>tsInside(c,p)).length;
  const own=p=>d.c.filter(c=>c.f===p).sort((a,b)=>tsCmp(tsNameOf(a),tsNameOf(b)));
  const tree=(p,depth)=>{let s='';tsKids(fs,p).forEach(f=>{s+=tsFrow(f,tsLeaf(f),count(f),depth,{menu:1});if(TS.open.has(f)){if(TS.form&&TS.form.p===f)s+=tsForm(depth+1);s+=tree(f,depth+1);const o=own(f);s+=o.map(c=>tsRow(c,depth+1,1)).join('')||(tsKids(fs,f).length?'':`<div class="stno" style="--d:${depth+1}">Empty folder</div>`)}});return s};
  const home=own('');
  h+=tsFrow('','Yours',home.length,0,{home:1});
  if(TS.open.has('')){if(TS.form&&TS.form.p===''&&TS.form.t=='new')h+=tsForm(1);h+=home.map(c=>tsRow(c,1,1)).join('')||'<div class="stno" style="--d:1">No styles yet</div>'}
  const tops=[...tsKids(fs,'').map(f=>({k:f,set:0})),{k:TS_SET,set:1}].sort((a,b)=>tsCmp(tsLeaf(a.k),tsLeaf(b.k)));
  tops.forEach(t=>{if(t.set){h+=tsFrow(TS_SET,TS_SET,B.length,0,{});if(TS.open.has(TS_SET))h+=B.map(c=>tsRow(c,1,0)).join('')}
   else{h+=tsFrow(t.k,tsLeaf(t.k),count(t.k),0,{menu:1});if(TS.open.has(t.k)){if(TS.form&&TS.form.p===t.k)h+=tsForm(1);h+=tree(t.k,1);const o=own(t.k);h+=o.map(c=>tsRow(c,1,1)).join('')||(tsKids(fs,t.k).length?'':'<div class="stno" style="--d:1">Empty folder</div>')}}});
 }
 box.innerHTML=h;
 const ri=box.querySelector('.ren input,.scform input');if(ri&&(TS.ren||TS.form)){ri.focus();ri.select()}
 const all=$('tsall');if(all){const anyOpen=[...TS.open].some(Boolean);all.setAttribute('aria-label',anyOpen?'Collapse all':'Expand all');all.setAttribute('aria-pressed',String(anyOpen))}}
function tsAdd(o,name,folder){const d=tsLoad(),c={id:newId(),n:name||'',o,f:folder||''};d.c.push(c);tsStore(d);return c}
function tsFolderPaths(d){return tsFolders(d).sort((a,b)=>tsCmp(a.replace(/\//g,' / '),b.replace(/\//g,' / ')))}
function init62(){
 tsUi();
 const box=$('tsl');if(!box)return;
 const folderMenu=(btn,p)=>rowMenu(btn,[['New folder inside',()=>{TS.open.add(p);TS.active=p;TS.form={t:'new',p,v:''};tsUiSave();tsPaint(true)}],['Rename',()=>{TS.form={t:'ren',p,v:tsLeaf(p)};tsPaint(true)}],['Delete folder',()=>{TS.form={t:'del',p};tsPaint(true)}]]);
 const toggle=k=>{if(TS.open.has(k)&&k!==''){TS.open.delete(k);if(TS.active===k||TS.active.startsWith(k+'/'))TS.active=k===TS_SET?'':tsParent(k)}else{TS.open.add(k);if(k!==TS_SET)TS.active=k}tsUiSave();tsPaint(true)};
 const mv=(id,p)=>{const d=tsLoad(),c=d.c.find(x=>x.id===id);if(!c)return;c.f=p;tsStore(d);if(p)TS.open.add(p);tsUiSave();tsPaint(true);pmsg('Moved “'+tsNameOf(c)+'” to “'+(p?p.replace(/\//g,' / '):'Yours')+'”.')};
 box.addEventListener('click',e=>{if(e.target.closest('input'))return;
  const fb=e.target.closest('[data-fok]'),cx=e.target.closest('[data-fcx]');
  if(cx){TS.form=null;tsPaint(true);return}
  if(fb){const f=TS.form,d=tsLoad();if(!f)return;
   if(f.t=='del'){const gone=p=>p===f.p||p.startsWith(f.p+'/');d.f=d.f.filter(p=>!gone(p));d.c.forEach(c=>{if(c.f&&gone(c.f))c.f=''});tsStore(d);TS.form=null;TS.open.delete(f.p);if(gone(TS.active))TS.active=tsParent(f.p);tsUiSave();tsPaint(true);pmsg('Deleted the folder “'+tsLeaf(f.p)+'”. Its styles went back to Yours.');return}
   const inp=box.querySelector('.scform input'),n=tsNameOk(inp&&inp.value);if(!n){if(inp)inp.focus();return}
   if(f.t=='new'){const path=f.p?f.p+'/'+n:n,ex=tsFolders(d).find(x=>x.toLowerCase()==path.toLowerCase());if(!ex){d.f.push(path);tsStore(d)}const use=ex||path;TS.open.add(use);if(f.p)TS.open.add(f.p);TS.active=use;TS.form=null;tsUiSave();tsPaint(true);pmsg(ex?'Opened the folder “'+use.replace(/\//g,' / ')+'”.':'Made the folder “'+use.replace(/\//g,' / ')+'”.');return}
   if(f.t=='ren'){const path=f.p.slice(0,f.p.length-tsLeaf(f.p).length)+n;if(path!=f.p){const re=p=>p===f.p?path:p.startsWith(f.p+'/')?path+p.slice(f.p.length):p,clash=tsFolders(d).find(x=>x.toLowerCase()==path.toLowerCase()&&x!==f.p);
     d.f=[...new Set(d.f.map(re))];d.c.forEach(c=>{c.f=re(c.f)});if(!d.f.includes(path))d.f.push(path);tsStore(d);TS.open=new Set([...TS.open].map(re));TS.active=re(TS.active);
     pmsg(clash?'Merged “'+tsLeaf(f.p)+'” into “'+tsLeaf(path)+'”.':'Renamed the folder to “'+n+'”.')}TS.form=null;tsUiSave();tsPaint(true)}return}
  const fm=e.target.closest('[data-fmore]'),fr=e.target.closest('.scf');
  if(fm){e.stopPropagation();folderMenu(fm,fr.dataset.k);return}
  if(fr){toggle(fr.dataset.k);return}
  const r=e.target.closest('.scr');if(!r)return;const id=r.dataset.c,d=tsLoad(),own=d.c.find(c=>c.id==id),set=tsBuilt().find(c=>c.id==id),c=own||set;if(!c)return;
  if(e.target.closest('[data-del]')){d.c=d.c.filter(x=>x.id!==id);tsStore(d);tsPaint(true);pmsg('Deleted the style “'+tsNameOf(c)+'”.');return}
  const more=e.target.closest('[data-more]');
  const items=own?[['Apply',()=>tsApply(c)],['Rename',()=>{TS.ren=id;tsPaint(true)}],['Update from the panel',()=>{const e2=tsLoad(),y=e2.c.find(x=>x.id===id);if(y){y.o=tsSnap();tsStore(e2);tsPaint(true);pmsg('Updated the style “'+tsNameOf(y)+'” from the panel.')}}]]
   :[['Apply',()=>tsApply(c)],['Copy to Yours',()=>{const n=tsAdd({...c.o},c.n,TS.active&&TS.active!==TS_SET?TS.active:'');pmsg('Copied “'+tsNameOf(c)+'” to “'+(n.f?n.f.replace(/\//g,' / '):'Yours')+'”.');tsPaint(true)}]];
  if(own){const fp=tsFolderPaths(d);if(c.f)items.push(['Move to Yours',()=>mv(id,'')]);fp.filter(p=>p!==c.f).slice(0,40).forEach(p=>items.push(['Move to “'+tsEsc(p.replace(/\//g,' / '))+'”',()=>mv(id,p)]))}
  if(more){e.stopPropagation();rowMenu(more,items);return}
  tsApply(c)});
 box.addEventListener('contextmenu',e=>{const fr=e.target.closest('.scf[data-k]'),r=e.target.closest('.scr');const b=(fr||r)&&(fr||r).querySelector('[data-fmore],[data-more]');if(b){e.preventDefault();b.click()}});
 box.addEventListener('keydown',e=>{const t=e.target;
  if(t.matches&&t.matches('.ren input')){e.stopPropagation();if(e.key=='Enter')t.blur();else if(e.key=='Escape'){TS.ren=null;tsPaint(true)}return}
  if(t.matches&&t.matches('.scform input')){e.stopPropagation();if(e.key=='Enter'){TS.form.v=t.value;box.querySelector('[data-fok]').click()}else if(e.key=='Escape'){TS.form=null;tsPaint(true)}return}
  if(t.classList&&t.classList.contains('scf')){const k=t.dataset.k;if(e.key=='ArrowRight'&&!TS.open.has(k)){e.preventDefault();toggle(k)}else if(e.key=='ArrowLeft'&&TS.open.has(k)&&k!==''){e.preventDefault();toggle(k)}else if(e.key=='Enter'||e.key==' '){e.preventDefault();toggle(k)}return}
  if(t.classList&&t.classList.contains('scr')&&(e.key=='Enter'||e.key==' ')){e.preventDefault();t.click()}});
 box.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('.scform input')&&TS.form)TS.form.v=e.target.value});
 box.addEventListener('focusout',e=>{const i=e.target;if(!i.matches||!i.matches('.ren input')||!TS.ren)return;const v=i.value.trim().slice(0,40),id=TS.ren;TS.ren=null;const d=tsLoad(),c=d.c.find(x=>x.id===id);if(c){c.n=v;tsStore(d)}tsPaint(true)});
 $('tsq').addEventListener('keydown',e=>e.stopPropagation());$('tsq').addEventListener('input',()=>{TS.q=$('tsq').value;tsPaint(true)});
 $('tsall').onclick=()=>{const anyOpen=[...TS.open].some(Boolean);if(anyOpen){TS.open=new Set(['']);TS.active=''}else{const d=tsLoad();TS.open=new Set(['',TS_SET,...tsFolders(d)])}tsUiSave();tsPaint(true)};
 $('tsnew').onclick=()=>{const p=TS.active&&TS.active!==TS_SET?TS.active:'';TS.open.add(p);TS.form={t:'new',p,v:''};tsPaint(true)};
 $('tsadd').onclick=()=>{const p=TS.active&&TS.active!==TS_SET?TS.active:'',c=tsAdd(tsSnap(),'Text style '+(tsLoad().c.length+1),p);TS.open.add(p);TS.ren=c.id;tsUiSave();tsPaint(true);pmsg('Saved the panel as a text style. Type a name.')};
 tsPaint(true)}
export {init62,tsLoad};
