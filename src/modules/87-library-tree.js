import {ICN} from './00-icons.js';
import {kv,use} from '../platform/index.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {buildMotifZip,safeName} from '../format/motifs.js';
import {zipRead} from '../format/libzip.js';

// ===== The folder tree of the style guide (Part 9, section 12), as one component (2.51.1) =====
// Every library (textures first, then saved stamps, saved trays, templates, workspaces, export recipes and saved colourways) is this tree: Home ("Yours") first, then your folders and the
// built-in sets together A to Z, hidden sets in a row of their own, the folder row and its menu and form, select mode, drag onto a folder, Export, the same messages. A library gives
// it only what differs, as `cfg`:
//   open: set keys that start open (until the person closes them); cards: true for cards (a picture and a name) instead of plain tiles; z: the size the slider starts at (0 to 8);
//   rows: true for a list of rows instead of tiles (no size slider); hay(id): the text a search looks in (default: the name)
//   p: the class prefix of its markup (".{p}tr" the tree, "[data-{p}sel]" the select button ...); word, words: what its items are called in messages;
//   ui: the settings key for open folders and size; exportName: the zip's name; cur(): the item in use (for the accent edge)
//   read(): the library as {f: folder paths, at: {own item id: folder path}, b: {built-in item id: folder path}, h: hidden set names, r: {set name: your name for it}, d: whatever write needs back}
//   write(m): saves that; sets(): [{k: "s:Name", n: "Name", ids: [built-in item ids]}]; name(id); own(id): true for an item you made
//   tile(id, {cur, pk}): the inside of an item's tile (a picture); used(id): in use in the project (cannot be deleted); remove(ids): deletes your items
//   rename(id, name): your item gets a name; file(id): {name, data, ext, fb} for Export, or null; usedFix: what to do when an item in use cannot be deleted; itemMenu(id): more entries at the top of an item's right-click menu; ids trId, qId: ids for the tree and the search field; top: markup above the bar; wire(pane, pick): its listeners; pane: the pane's selector
// What it returns: pane() markup for the tree (after the library's own top row), show(pane, cur, pick), paintAll(), here() (the active folder, where new items go), init().
function ltMake(cfg){
const P=cfg.p,W=cfg.word,WS=cfg.words;
const TL={q:'',active:'',open:new Set(['',...(cfg.open||[])]),form:null,z:cfg.z||6,sm:false,sel:new Set(),anc:null,vis:[],hidOpen:false};
let drag=null,sw=false;
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IC=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const CHEV='<svg class="lfa" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"/></svg>';
const CK='<svg viewBox="0 0 16 16"><path d="M4.3 8.4l2.4 2.4 5-5.3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const cmp=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
const leaf=p=>p.split('/').pop(),parent=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')):'';
const nameOk=s=>{s=String(s||'').trim();return s&&s.length<=30&&!/[\\"<>&|/]/.test(s)&&!/^s:/i.test(s)?s:''};
const isSet=k=>/^s:[^/]+$/.test(k||'');
const within=(p,a)=>typeof p=='string'&&(p===a||p.startsWith(a+'/'));
const setOf=(k,sets)=>(sets||cfg.sets()).find(s=>s.k===k);
const shown=(m,n)=>m.r[n]||n;
const uiLoad=()=>{try{const u=JSON.parse(kv.get(cfg.ui)||'null');if(u){TL.open=new Set(['',...(Array.isArray(u.o)?u.o:[])]);TL.active=typeof u.a=='string'?u.a:'';if(u.z>=0&&u.z<=8)TL.z=+u.z;TL.hidOpen=!!u.hd}}catch(e){}};
const uiSave=()=>{try{kv.set(cfg.ui,JSON.stringify({o:[...TL.open].filter(Boolean),a:TL.active,z:TL.z,hd:TL.hidOpen}))}catch(e){}};
// every folder path of yours, parents of deeper ones included; the sets themselves are not folders, but your folders inside a set are
function folders(m){const s=new Set(),sets=cfg.sets(),add=p=>{let q='';p.split('/').forEach(part=>{q=q?q+'/'+part:part;if(!isSet(q))s.add(q)})};
 [...m.f,...Object.values(m.at),...Object.values(m.b)].forEach(p=>{if(!p)return;if(p.startsWith('s:')&&!setOf(p.split('/')[0],sets))return;add(p)});return[...s]}
const kids=(fs,p)=>fs.filter(x=>parent(x)===p).sort((a,b)=>cmp(leaf(a),leaf(b)));
// the items a folder holds itself: Yours and folders hold yours and the built-in ones added to them; a set holds its own too
function ids(m,k){const own=Object.keys(m.at).filter(i=>m.at[i]===k),bi=Object.keys(m.b).filter(i=>m.b[i]===k&&!cfg.own(i)&&cfg.name(i)!=null);
 if(isSet(k)){const s=setOf(k);return[...new Set([...(s?s.ids:[]),...own,...bi])]}
 return[...own,...bi].sort((a,b)=>cmp(cfg.name(a),cfg.name(b)))}
// items in a folder and every folder inside it, each once
function count(m,fs,k){const s=new Set(ids(m,k));if(k)fs.forEach(p=>{if(within(p,k)&&p!==k)ids(m,p).forEach(i=>s.add(i))});return s.size}
// the folders at the top: your folders and the built-in sets together, A to Z (hid: only the hidden sets)
function tops(m,fs,sets,hid){const ts=hid?[]:kids(fs,'').map(f=>({k:f,n:f}));
 sets.forEach(s=>{if(m.h.includes(s.n)===!!hid)ts.push({k:s.k,n:shown(m,s.n),set:s})});return ts.sort((a,b)=>cmp(a.n,b.n))}
// every folder in list order, named by its full path, for the Move to pickers
function tree(m,fs){const o=[{v:'y',n:'Yours',d:0}],walk=(k,n,dep)=>{o.push({v:k,n,d:dep});kids(fs,k).forEach(c=>walk(c,n+' / '+leaf(c),dep+1))};
 tops(m,fs,cfg.sets(),false).forEach(t=>walk(t.k,t.n,0));return o}
const here=()=>TL.active||'';
const pathName=p=>{if(!p)return'Yours';const m=cfg.read();return p.split('/').map((s,i)=>i==0&&isSet(s)?shown(m,s.slice(2)):s).join(' / ')};
function tile(id,cur){const n=cfg.name(id);if(n==null)return'';const pk=TL.sel.has(id),own=cfg.own(id);
 return`<div><button type="button" data-${P}="${esc(id)}" class="${id===cur?'on':''}${pk?' pk':''}" aria-label="${esc(n)}" aria-pressed="${id===cur}">${cfg.tile(id,{cur,pk})}</button>${pk?`<i class="ck">${CK}</i>`:''}${own&&!TL.sm?`<button type="button" class="dx" data-${P}x="${esc(id)}" aria-label="Delete ${esc(n)}">&#215;</button>`:''}</div>`}
function row(key,label,n,depth,o){const open=TL.open.has(key);
 return`<div class="lrw${TL.active===key?' act':''}${o.hid?' hid':''}" style="--d:${depth}"><button type="button" class="lfr" data-k="${esc(key)}" aria-expanded="${open}">${CHEV}<span class="lfi">${IC(o.home?ICN.home:open?ICN.folderOpen:ICN.folder)}</span><span class="lfn">${esc(label)}</span><span class="lfc">${n}</span></button>${o.menu?`<button type="button" class="lmo" data-fm="${esc(key)}" aria-haspopup="menu" aria-label="Folder options">${IC(ICN.more)}</button>`:''}</div>`}
function form(m,fs,depth){const f=TL.form;if(!f)return'';
 if(f.t=='del')return`<div class="fform" style="--d:${depth}"><span>Delete “${esc(leaf(f.p))}” and the folders inside?</span><button type="button" class="warn" data-fok>Delete</button><button type="button" class="alt" data-fcx>Cancel</button></div>`;
 if(f.t=='mvf'){const opts=tree(m,fs).filter(x=>x.v!='y'&&!within(x.v,f.p)).map(x=>`<option value="${esc(x.v)}"${x.v===parent(f.p)?' selected':''}>${esc(x.n)}</option>`).join('');
  return`<div class="fform" style="--d:${depth}"><select aria-label="Move into" data-fdest><option value="/"${parent(f.p)?'':' selected'}>Top level</option>${opts}</select><button type="button" class="primary" data-fok>Move</button><button type="button" class="alt" data-fcx>Cancel</button></div>`}
 const nm=f.t=='iren',ph=f.ph||(nm?W[0].toUpperCase()+W.slice(1)+' name':'Folder name');
 return`<div class="fform" style="--d:${depth}"><input type="text" maxlength="${nm?40:30}" value="${esc(f.v||'')}" aria-label="${nm?W[0].toUpperCase()+W.slice(1)+' name':'Folder name'}" placeholder="${esc(ph)}"><button type="button" class="primary" data-fok>${f.t=='new'?'Create':f.t=='mv'?'Create and move':'Rename'}</button><button type="button" class="alt" data-fcx>Cancel</button></div>`}
// draws the tree into one host; cur = the item in use, which gets the accent edge
function paint(host,cur,force){if(!host||!host.isConnected)return;const m=cfg.read(),fs=folders(m),q=TL.q.trim().toLowerCase().split(/\s+/).filter(Boolean),sets=cfg.sets();
 // the folder of a newly picked item opens, so its tile shows
 if(cur!=null&&host.dataset.cur!==cur){host.dataset.cur=cur||'';if(cur&&cfg.name(cur)!=null){const k=cfg.own(cur)?(m.at[cur]||''):'s:'+((sets.find(s=>s.ids.includes(cur))||{n:''}).n);if(!TL.open.has(k)){TL.open.add(k);uiSave()}}}
 const vis=new Set();let h='';
 const grid=(list,depth)=>{list.forEach(i=>vis.add(i));return`<div class="lib${cfg.rows?' rws':''}${cfg.cards?' crd':''}${TL.sm?' sel':''}" style="--d:${depth}">${list.map(i=>tile(i,cur)).join('')}</div>`};
 const node=(k,label,depth,o)=>{let s=row(k,label,count(m,fs,k),depth,o);if(!TL.open.has(k))return s;
  if(TL.form&&TL.form.p===k&&TL.form.t!='mv')s+=form(m,fs,depth+1);
  const ks=k===''?[]:kids(fs,k);ks.forEach(c=>{s+=node(c,leaf(c),depth+1,{menu:1,hid:o.hid})});
  const list=ids(m,k);s+=list.length?grid(list,depth+1):ks.length?'':`<div class="lmt" style="--d:${depth+1}">${k===''?'No '+WS+' yet':'Empty folder'}</div>`;return s};
 if(q.length){const all=[...Object.keys(m.at),...sets.filter(s=>!m.h.includes(s.n)).flatMap(s=>s.ids)],hit=[...new Set(all)].filter(i=>cfg.name(i)!=null&&q.every(w=>(cfg.hay?cfg.hay(i):cfg.name(i)).toLowerCase().includes(w)));
  h=hit.length?grid(hit,0):`<div class="lmt" style="--d:0">No ${WS} found</div>`}
 else{
  h+=node('','Yours',0,{home:1,menu:1});
  tops(m,fs,sets,false).forEach(t=>{h+=node(t.k,t.n,0,{menu:1})});
  const hs=tops(m,fs,sets,true);
  if(hs.length){h+=`<div class="lrw" style="--d:0"><button type="button" class="lfr lfh" data-${P}hid aria-expanded="${TL.hidOpen}">${CHEV}<span class="lfi">${IC(ICN.eyeOff)}</span><span class="lfn">Hidden sets</span><span class="lfc">${hs.length}</span></button></div>`;if(TL.hidOpen)hs.forEach(t=>{h+=node(t.k,t.n,1,{menu:1,hid:1})})}
  if(TL.form&&TL.form.t=='mv')h=form(m,fs,0)+h}
 // only items you can see stay selected
 if([...TL.sel].some(i=>!vis.has(i))){TL.sel=new Set([...TL.sel].filter(i=>vis.has(i)));paint(host,cur,true);return}
 TL.vis=[...vis];
 const pane=host.closest(cfg.pane||'.fxs'),all=pane&&pane.querySelector(`[data-${P}all]`);if(all){const any=[...TL.open].some(Boolean);all.setAttribute('aria-label',any?'Collapse all folders':'Expand all folders');all.classList.toggle('on',any)}
 const z=pane&&pane.querySelector(`.${P}sz`);if(z&&+z.value!==TL.z){z.value=TL.z;z.style.setProperty('--p',(TL.z/8*100)+'%')}
 if(pane)bar(pane,m,fs);
 const key=JSON.stringify([h,TL.z]);if(!force&&host.dataset.k===key)return;host.dataset.k=key;
 host.innerHTML=h;host.style.setProperty('--lcols',10-TL.z);
 const fi=host.querySelector('.fform input');if(fi&&TL.form&&document.activeElement!==fi){fi.focus();fi.select()}
 const fd=host.querySelector('[data-fdest]');if(fd&&TL.form&&TL.form.t=='mvf'&&document.activeElement!==fd)fd.focus()}
// the select button, and the bar under the tree: how many are ticked, Move to, Take out of folder, Delete
function bar(pane,m,fs){const sb=pane.querySelector(`[data-${P}sel]`),b=pane.querySelector(`.${P}bar`);if(!sb||!b)return;
 sb.setAttribute('aria-pressed',String(TL.sm));sb.disabled=!TL.vis.length&&!TL.sm;b.hidden=!TL.sm;if(!TL.sm)return;
 const n=TL.sel.size;b.querySelector('.fscnt').textContent=n?`${n} selected`:'None selected';
 b.querySelector(`.${P}sa`).textContent=TL.vis.length&&TL.vis.every(i=>TL.sel.has(i))?'Select none':'Select all';
 const mv=b.querySelector(`.${P}mv`);mv.innerHTML='<option value="">Move to…</option>'+tree(m,fs).map(x=>`<option value="${esc(x.v)}">${esc(x.n)}</option>`).join('')+'<option value="+">＋ New folder…</option>';mv.disabled=!n;mv.value='';
 const sel=[...TL.sel],out=sel.filter(i=>cfg.own(i)?m.at[i]:m.b[i]).length;b.querySelector(`.${P}out`).disabled=!out;
 const dm=b.querySelector(`.${P}delm`),cn=sel.filter(i=>cfg.own(i)).length;dm.disabled=!cn;if(!dm.dataset.sure)dm.textContent=cn?`Delete ${cn}`:'Delete'}
// every tree that is showing draws itself again
function paintAll(force){document.querySelectorAll(`.${P}tr`).forEach(h=>{if(h.closest('[hidden]'))return;paint(h,h.dataset.cur||'',force)})}
// moves items to a folder (k: its path, '' for Yours); a built-in item added to a folder also stays in its own set
function moveIds(list,k){const m=cfg.read();if(k&&!isSet(k)&&!folders(m).includes(k))return;if(isSet(k)&&!setOf(k))return;let n=0,nb=0;
 list.forEach(id=>{if(cfg.name(id)==null)return;
  if(cfg.own(id)){m.at[id]=k;n++}else{const s=cfg.sets().find(z=>z.ids.includes(id)),home=s?s.k:'';if(!k||k===home)delete m.b[id];else{m.b[id]=k;nb++}n++}});
 if(!n)return;cfg.write(m);if(k){TL.open.add(k);uiSave()}TL.sel.clear();TL.anc=null;paintAll(true);
 pmsg(`Moved ${n} ${n>1?WS:W} to “${pathName(k)}”.`+(nb?` Built-in ${WS} also stay in their own set.`:''))}
// the × on a tile is two taps in place (Part 9 section 12.7): the first turns it into a ?, the second deletes
function removeAsk(x){const id=x.dataset[P+'x'];if(cfg.used(id)||x.dataset.sure){delete x.dataset.sure;removeOne(id);return}x.dataset.sure=1;x.textContent='?';setTimeout(()=>{if(x.isConnected&&x.dataset.sure){delete x.dataset.sure;x.innerHTML='&#215;'}},2500)}
function removeOne(id){if(!cfg.own(id))return;if(cfg.used(id)){pmsg(`That ${W} is used in this project.${cfg.usedFix?' '+cfg.usedFix:''}`);return}const n=cfg.name(id);cfg.remove([id]);TL.sel.delete(id);paintAll(true);pmsg(`Deleted the ${W} “${n}”.`)}
// what an export holds, as a flat list of folders each named by its path. deep: the folders inside too. At the top (k '/') it is the whole library, hidden sets included.
function exportList(k,deep){const m=cfg.read(),fs=folders(m),sets=cfg.sets(),top=k==='/';
 const nm=kk=>kk===''?'Yours':isSet(kk)?shown(m,kk.slice(2)):leaf(kk);
 const item=i=>cfg.file(i);
 const out=[],walk=(kk,pre)=>{const p=[...pre,nm(kk)];out.push({path:p,items:ids(m,kk).map(item)});if(deep||top)kids(fs,kk).forEach(c=>walk(c,p))};
 if(top){walk('',[]);[...tops(m,fs,sets,false),...tops(m,fs,sets,true)].forEach(t=>walk(t.k,[]))}else walk(k,[]);
 return{root:top,name:top?'':nm(k),folders:out,sub:!top&&kids(fs,k).length>0}}
async function save(l0){const dl=await use('downloads');if(!dl)return pmsg('Saving is not available here.');
 const l={...l0,folders:await Promise.all(l0.folders.map(async f=>({...f,items:(await Promise.all(f.items)).filter(Boolean)})))};
 const name=safeName(l.root?cfg.exportName:l.name+' '+WS,WS)+'.zip';
 try{const {zip,count:n}=buildMotifZip(l.folders);if(!zip)return pmsg(`There are no ${WS} to export.`);
  const h0=dl.pick?await dl.pick({filename:name}):null;await dl.save({filename:name,data:new Blob([zip],{type:'application/zip'}),handle:h0});pmsg(`Exported ${n} ${n>1?WS:W} as ${cfg.exportAs||'files'}.`)}
 catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}}
// the toolbar button exports the whole library; a folder's menu exports that folder, asking about the folders inside it if it has any
function exportAt(k,btn){const deep=exportList(k,true);if(deep.root||!deep.sub)return save(deep);rowMenu(btn,[['This folder only',()=>save(exportList(k,false))],['This folder and the folders inside it',()=>save(exportList(k,true))]])}
// a folder's path moves: everything inside it follows
function remap(m,from,to){const re=p=>within(p,from)?to+p.slice(from.length):p;
 m.f=[...new Set(m.f.map(re))];Object.keys(m.at).forEach(i=>{m.at[i]=re(m.at[i])});Object.keys(m.b).forEach(i=>{m.b[i]=re(m.b[i])});if(!m.f.includes(to))m.f.push(to);
 TL.open=new Set([...TL.open].map(re));TL.active=re(TL.active)}
function pick(id,e){if(!TL.sm){TL.sm=true;TL.sel.clear()}const ks=TL.vis;
 if(e.shiftKey&&!TL.anc&&TL.sel.size==0&&ks.length)TL.anc=ks[0];
 if(e.shiftKey&&TL.anc&&ks.includes(TL.anc)){const a=ks.indexOf(TL.anc),b=ks.indexOf(id);ks.slice(Math.min(a,b),Math.max(a,b)+1).forEach(x=>TL.sel.add(x))}else{TL.sel.has(id)?TL.sel.delete(id):TL.sel.add(id);TL.anc=id}paintAll(true)}
function exit(){TL.sm=false;TL.sel.clear();TL.anc=null;TL.form=null;paintAll(true)}
// one set of listeners per pane (a library can be shown in more than one place)
async function importFiles(files){const I=cfg.importFile,h=here(),g0=h.startsWith('s:')?'':h;let n=0,bad=0,last='';const re=new RegExp('\\'+I.ext.replace(/^\./,'.')+'$|\\.json$','i');
 const put=(text,g)=>{try{last=I.add(text,g);n++}catch(e){bad++}};
 for(const f of files){if(/\.zip$/i.test(f.name)||/zip/.test(f.type)){const r=zipRead(new Uint8Array(await f.arrayBuffer()),re);if(!r||!r.length){bad++;continue}
   for(const e of r){const dir=e.dir.map(x=>String(x).replace(/[\\"<>&|/]/g,'').trim().slice(0,30)).filter(x=>x&&!/^s:/i.test(x));put(new TextDecoder().decode(e.data),dir.length?(g0?g0+'/':'')+dir.join('/'):g0)}}
  else put(await f.text(),g0)}
 if(g0)TL.open.add(g0);uiSave();paintAll(true);if(I.done)I.done();
 pmsg(n==1?`Added “${last}” to the library.`:n?`Added ${n} ${WS}.`+(bad?` ${bad} file${bad>1?'s were':' was'} not a ${W}.`:''):`Could not read that file.`)}
function wire(pane){const host=pane.querySelector(`.${P}tr`);if(!host||host.dataset.w)return;host.dataset.w='1';
 pane.querySelector(`[data-${P}all]`).onclick=()=>{const any=[...TL.open].some(Boolean);if(any){TL.open=new Set(['']);TL.active=''}else{const m=cfg.read();TL.open=new Set(['',...folders(m),...cfg.sets().map(s=>s.k)])}uiSave();paintAll(true)};
 pane.querySelector(`[data-${P}new]`).onclick=()=>{if(TL.sm&&TL.sel.size){TL.form={t:'mv',p:'',v:''};paintAll(true);return}const p=here();TL.open.add(p);TL.form={t:'new',p,v:''};paintAll(true)};
 pane.querySelector(`[data-${P}sel]`).onclick=()=>{if(TL.sm)exit();else{TL.sm=true;TL.sel.clear();TL.anc=null;paintAll(true)}};
 pane.querySelector(`[data-${P}exp]`).onclick=e=>{e.stopPropagation();save(exportList('/',true))};
 // 2.58.0: Import, the counterpart of Export: the library's own files (cfg.importFile: {ext, add(text, folder) -> name}) or a zip of them, its folders kept
 const ib=pane.querySelector(`[data-${P}imp]`),inp=pane.querySelector(`.${P}impf`);if(ib&&inp){ib.onclick=()=>inp.click();inp.onchange=async()=>{const fl=[...(inp.files||[])];inp.value='';if(fl.length)importFiles(fl)}}
 const z=pane.querySelector(`.${P}sz`);if(z)z.addEventListener('input',()=>{TL.z=+z.value;uiSave();paintAll(true)});
 const q=pane.querySelector(`.${P}q`);q.addEventListener('keydown',e=>e.stopPropagation());q.addEventListener('input',()=>{TL.q=q.value;document.querySelectorAll(`.${P}q`).forEach(o=>{if(o!==q)o.value=q.value});paintAll(true)});
 const b=pane.querySelector(`.${P}bar`);
 b.querySelector(`.${P}done`).onclick=exit;
 b.querySelector(`.${P}sa`).onclick=()=>{if(TL.vis.length&&TL.vis.every(i=>TL.sel.has(i)))TL.sel.clear();else TL.vis.forEach(i=>TL.sel.add(i));paintAll(true)};
 b.querySelector(`.${P}mv`).oninput=e=>{const v=e.target.value;if(!v)return;if(v=='+'){e.target.value='';TL.form={t:'mv',p:'',v:''};paintAll(true);return}moveIds([...TL.sel],v=='y'?'':v)};
 b.querySelector(`.${P}out`).onclick=()=>{const m=cfg.read();let n=0;[...TL.sel].forEach(i=>{if(cfg.own(i)){if(m.at[i]){m.at[i]='';n++}}else if(m.b[i]){delete m.b[i];n++}});if(!n)return;cfg.write(m);TL.sel.clear();paintAll(true);pmsg(`Took ${n} ${n>1?WS:W} out of ${n>1?'their folders':'its folder'}.`)};
 b.querySelector(`.${P}delm`).onclick=e=>{const bt=e.currentTarget,mine=[...TL.sel].filter(i=>cfg.own(i)),ok=mine.filter(i=>!cfg.used(i));if(!mine.length)return;
  if(!ok.length){pmsg(`Those ${WS} are used in this project.${cfg.usedFix?' '+cfg.usedFix:''}`);return}
  if(!bt.dataset.sure){bt.dataset.sure=1;bt.textContent='Click to confirm';setTimeout(()=>{if(bt.dataset.sure){delete bt.dataset.sure;paintAll(true)}},3000);return}
  delete bt.dataset.sure;cfg.remove(ok);ok.forEach(i=>TL.sel.delete(i));paintAll(true);pmsg(`Deleted ${ok.length} ${ok.length>1?WS:W} from the library.`+(ok.length<mine.length?` ${mine.length-ok.length} in use in this project were kept.`:''))};
 const toggle=k=>{if(TL.open.has(k)&&k!==''){TL.open.delete(k);if(within(TL.active,k))TL.active=parent(k)}else{TL.open.add(k);TL.active=k}TL.form=null;uiSave();paintAll(true)};
 const folderMenu=(btn,k)=>{const m=cfg.read(),fs=folders(m),exp=['Export…',()=>setTimeout(()=>exportAt(k,btn),0),!count(m,fs,k)],sub=['New folder inside',()=>{TL.open.add(k);TL.active=k;TL.form={t:'new',p:k,v:''};uiSave();paintAll(true)}];
  if(k==='')return rowMenu(btn,[exp]);
  if(isSet(k)){const n=k.slice(2),hid=m.h.includes(n);return rowMenu(btn,[sub,['Rename',()=>{TL.open.add(k);TL.form={t:'ren',p:k,v:shown(m,n),ph:n};paintAll(true)}],['Reset name',()=>{const e=cfg.read();delete e.r[n];cfg.write(e);paintAll(true);pmsg('Set name reset.')},!m.r[n]],
   [hid?'Show in the list':'Hide from the list',()=>{const e=cfg.read();e.h=hid?e.h.filter(x=>x!==n):[...e.h,n];cfg.write(e);if(!hid&&within(TL.active,k))TL.active='';uiSave();paintAll(true);pmsg(hid?`“${shown(m,n)}” is back in the list.`:`Hid “${shown(m,n)}”.`)}],exp])}
  rowMenu(btn,[sub,['Rename',()=>{TL.open.add(k);TL.form={t:'ren',p:k,v:leaf(k)};paintAll(true)}],['Move to…',()=>{TL.open.add(k);TL.form={t:'mvf',p:k};paintAll(true)}],exp,['Delete folder',()=>{TL.open.add(k);TL.form={t:'del',p:k};paintAll(true)}]])};
 const itemMenu=(btn,id)=>{const m=cfg.read();if(cfg.name(id)==null)return;const extra=cfg.itemMenu?cfg.itemMenu(id):[];if(!cfg.own(id)){if(extra.length)rowMenu(btn,extra);return}const at=m.at[id]||'',items=[...extra,['Rename',()=>{TL.form={t:'iren',p:at,id,v:cfg.name(id)};TL.open.add(at);paintAll(true)}]];
  if(at)items.push(['Move to Yours',()=>moveIds([id],'')]);folders(m).sort(cmp).filter(p=>p!==at).slice(0,40).forEach(p=>items.push(['Move to “'+pathName(p)+'”',()=>moveIds([id],p)]));items.push(['Delete',()=>removeOne(id)]);rowMenu(btn,items)};
 const ok=()=>{const f=TL.form,m=cfg.read();if(!f)return;
  if(f.t=='del'){const gone=p=>within(p,f.p);m.f=m.f.filter(p=>!gone(p));Object.keys(m.at).forEach(i=>{if(gone(m.at[i]))m.at[i]=''});Object.keys(m.b).forEach(i=>{if(gone(m.b[i]))delete m.b[i]});cfg.write(m);TL.form=null;TL.open.delete(f.p);if(gone(TL.active))TL.active=parent(f.p);uiSave();paintAll(true);pmsg(`Deleted the folder “${leaf(f.p)}”. Its ${WS} went back to Yours.`);return}
  if(f.t=='mvf'){const sel=host.querySelector('[data-fdest]'),t=sel?sel.value:'/';TL.form=null;
   if(t!=='/'&&!isSet(t)&&!folders(m).includes(t)||t!=='/'&&isSet(t)&&!setOf(t)){paintAll(true);return}
   const np=(t==='/'?'':t+'/')+leaf(f.p);if(np!==f.p&&!within(t,f.p)){remap(m,f.p,np);cfg.write(m);uiSave();pmsg(`Moved “${leaf(f.p)}” to “${pathName(t==='/'?'':t)}”.`)}paintAll(true);return}
  const inp=host.querySelector('.fform input');
  if(f.t=='iren'){const v=String(inp&&inp.value||'').replace(/[<>&"|]/g,'').trim().slice(0,40);if(!v||!cfg.own(f.id)){if(inp)inp.focus();return}cfg.rename(f.id,v);TL.form=null;paintAll(true);pmsg(`Renamed the ${W} to “${v}”.`);return}
  if(f.t=='ren'&&isSet(f.p)){const n=nameOk(inp&&inp.value),o=f.p.slice(2);if(!n){if(inp)inp.focus();return}if(n===o)delete m.r[o];else m.r[o]=n;cfg.write(m);TL.form=null;paintAll(true);pmsg(n!==o?`Renamed the set to “${n}”.`:'Set name reset.');return}
  const n=nameOk(inp&&inp.value);if(!n){if(inp)inp.focus();return}
  if(f.t=='mv'||f.t=='new'){const path=f.p?f.p+'/'+n:n,ex=folders(m).find(x=>x.toLowerCase()==path.toLowerCase()),use2=ex||path;if(!ex){m.f.push(path);cfg.write(m)}
   TL.open.add(use2);if(f.p)TL.open.add(f.p);TL.form=null;
   if(f.t=='mv'){uiSave();moveIds([...TL.sel],use2);return}
   TL.active=use2;uiSave();paintAll(true);pmsg(ex?`Opened the folder “${pathName(use2)}”.`:`Made the folder “${pathName(use2)}”.`);return}
  if(f.t=='ren'){const path=(parent(f.p)?parent(f.p)+'/':'')+n;if(path!==f.p){const clash=folders(m).find(x=>x.toLowerCase()==path.toLowerCase()&&x!==f.p);remap(m,f.p,path);cfg.write(m);pmsg(clash?`Merged “${leaf(f.p)}” into “${leaf(path)}”.`:`Renamed the folder to “${n}”.`)}TL.form=null;uiSave();paintAll(true)}};
 host.addEventListener('click',e=>{if(sw){e.stopImmediatePropagation();e.preventDefault()}},true);
 host.addEventListener('click',e=>{if(e.target.closest('input,select'))return;
  if(e.target.closest('[data-fcx]')){TL.form=null;paintAll(true);return}
  if(e.target.closest('[data-fok]')){ok();return}
  if(e.target.closest(`[data-${P}hid]`)){TL.hidOpen=!TL.hidOpen;uiSave();paintAll(true);return}
  const fm=e.target.closest('[data-fm]');if(fm){e.stopPropagation();TL.active=fm.dataset.fm;folderMenu(fm,fm.dataset.fm);return}
  const fr=e.target.closest('.lfr[data-k]');if(fr){toggle(fr.dataset.k);return}
  const x=e.target.closest(`[data-${P}x]`);if(x){removeAsk(x);return}
  const t=e.target.closest(`[data-${P}]`);if(!t)return;if(TL.sm||e.ctrlKey||e.metaKey||e.shiftKey){pick(t.dataset[P],e);return}if(host._pick)host._pick(t.dataset[P])});
 host.addEventListener('contextmenu',e=>{const fr=e.target.closest('.lrw'),b=fr&&fr.querySelector('[data-fm]');if(b){e.preventDefault();b.click();return}
  const t=e.target.closest(`[data-${P}]`);if(t&&(cfg.own(t.dataset[P])||cfg.itemMenu)){e.preventDefault();itemMenu(t,t.dataset[P])}});
 host.addEventListener('keydown',e=>{const t=e.target;
  if(t.matches&&t.matches('.fform input')){e.stopPropagation();if(e.key=='Enter'){e.preventDefault();ok()}else if(e.key=='Escape'){TL.form=null;paintAll(true)}return}
  if(t.matches&&t.matches('[data-fdest]')){e.stopPropagation();if(e.key=='Escape'){TL.form=null;paintAll(true)}return}
  const fr=t.closest&&t.closest('.lfr[data-k]');if(fr){const k=fr.dataset.k;if(e.key=='ArrowRight'&&!TL.open.has(k)){e.preventDefault();toggle(k)}else if(e.key=='ArrowLeft'&&TL.open.has(k)&&k!==''){e.preventDefault();toggle(k)}}});
 host.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('.fform input')&&TL.form)TL.form.v=e.target.value});
 // drag an item onto a folder to move it there (not in select mode)
 host.addEventListener('pointerdown',e=>{if(e.button!==0||e.shiftKey||e.ctrlKey||e.metaKey||TL.sm)return;const b=e.target.closest(`.lib button[data-${P}]`);if(!b)return;const im=b.querySelector('img');drag={id:b.dataset[P],x:e.clientX,y:e.clientY,on:false,g:null,src:im?im.src:''}})}
// the markup of the tree: the library's own top row first (Add texture), then the bar, the search, the tree and the select bar
const paneHtml=()=>`${cfg.top||''}<div class="lnav ${P}nav"><button type="button" class="ib" data-${P}all aria-label="Expand all folders">${IC(ICN.unfold)}</button>${cfg.rows?'':`<input type="range" class="${P}sz" min="0" max="8" step="1" value="${cfg.z||6}" aria-label="${W[0].toUpperCase()+W.slice(1)} size" data-plain>`}<button type="button" class="ib" data-${P}new aria-label="New folder">${IC(ICN.folderNew)}</button><button type="button" class="ib" data-${P}sel aria-label="Select ${WS}" aria-pressed="false">${IC(ICN.marquee)}</button>${cfg.importFile?`<button type="button" class="ib" data-${P}imp aria-label="Import ${WS}">${IC(ICN.importIc)}</button>`:''}<button type="button" class="ib" data-${P}exp aria-label="Export all ${WS}" aria-haspopup="menu" data-more>${IC(ICN.download)}</button></div>${cfg.importFile?`<input type="file" class="${P}impf vh" accept="${cfg.importFile.ext},.json,.zip,application/zip,application/json" multiple tabindex="-1">`:''}
<input type="text" class="${P}q"${cfg.qId?` id="${cfg.qId}"`:''} maxlength="40" placeholder="Find a ${W}" aria-label="Find a ${W}"><div class="ltr ${P}tr"${cfg.trId?` id="${cfg.trId}"`:''} role="tree" aria-label="${W[0].toUpperCase()+W.slice(1)}s"></div>
<div class="fsbar ${P}bar" hidden><div class="r"><span class="fscnt"></span><button type="button" class="alt ${P}sa">Select all</button><button type="button" class="primary ${P}done">Done</button></div><select class="${P}mv" aria-label="Move to folder"></select><div class="r"><button type="button" class="alt ${P}out">Take out of folder</button><button type="button" class="alt ${P}delm">Delete</button></div></div>`;
// shows the tree in a pane, with the item in use; pick(id) is called when a tile is chosen
function show(pane,cur,pk){wire(pane);if(cfg.wire)cfg.wire(pane,pk);const host=pane.querySelector(`.${P}tr`);host._pick=pk;paint(host,cur)}
function init(){uiLoad();
 // an item dragged over the page: it carries a small picture of itself, the folder under it lights up, and letting go there moves it
 document.addEventListener('pointermove',e=>{if(!drag)return;if(!drag.on){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;drag.on=true;const g=document.createElement(drag.src?'img':'div');g.id=P+'dg';if(drag.src){g.alt='';g.src=drag.src}else g.textContent=cfg.name(drag.id)||'';g.style.cssText='position:fixed;'+(drag.src?'width:44px;height:44px;object-fit:cover;':'max-width:180px;padding:4px 8px;background:var(--raise);border:1px solid var(--line2);font-size:var(--fs-s);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;')+'border-radius:var(--r-s);pointer-events:none;z-index:70;opacity:.85;transform:translate(-50%,-50%)';document.body.appendChild(g);drag.g=g}
  drag.g.style.left=e.clientX+'px';drag.g.style.top=e.clientY+'px';const f=document.elementFromPoint(e.clientX,e.clientY),r=f&&f.closest&&f.closest(`.${P}tr .lfr[data-k]`);
  document.querySelectorAll(`.${P}tr .lfr.dropt`).forEach(x=>{if(x!==r)x.classList.remove('dropt')});if(r)r.classList.add('dropt')});
 const end=e=>{if(!drag)return;const x=drag;drag=null;if(x.g)x.g.remove();if(!x.on)return;sw=true;setTimeout(()=>{sw=false},0);document.querySelectorAll(`.${P}tr .lfr.dropt`).forEach(r=>r.classList.remove('dropt'));
  if(e.type!='pointerup')return;const f=document.elementFromPoint(e.clientX,e.clientY),r=f&&f.closest&&f.closest(`.${P}tr .lfr[data-k]`);if(r)moveIds([x.id],r.dataset.k)};
 document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
 document.addEventListener('keydown',e=>{if(e.key=='Escape'&&TL.sm&&!(e.target.matches&&e.target.matches('input,textarea,select')))exit()})}
return{paneHtml,show,paintAll,here,init,open:k=>{TL.open.add(k);uiSave()},state:TL}}
export {ltMake};
