import {ICN} from './00-icons.js';
import {kv,use} from '../platform/index.js';
import {WBS,WBX} from './01-launch-and-version.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {TXF,txSrc,txSrcAdd,txThumb} from './16-texture-generators.js';
import {buildMotifZip,safeName} from '../format/motifs.js';
import {txzBytes,txzRead} from '../format/textures.js';

// ===== The texture library (2.50.0; owner Oct 26 2026: a list of every texture with its picture, "add texture" at the top to import one, in the file and folder system) =====
// It is the folder tree of the style guide (Part 9, section 12) with tiles: Yours (the home folder) holds your imported textures that are in no folder, your folders
// sit beside the built-in sets (Paper and board, Cloth and weave, ...), A to Z. It is shown in the Texture effect, where a tile picks the effect's texture.
// Your textures and folders are kept in this browser through the platform (kv), and every project that uses one carries its picture too (16-texture-generators.js).
// 2.51.0 (owner Oct 26 2026: "it should all work the exact same way"): it works as the Shapes library does. Select mode (tick tiles, then Move to, Take out of folder, Delete),
// drag a tile onto a folder, sets that can be renamed, hidden (they collect in Hidden sets) and hold folders of your own, and Export to a zip of pictures; Add texture also
// takes several pictures at once and a zip of pictures (its folders come back as folders).
// A folder is known by its path: "Linen/Plain" for your own, "s:Natural" for a built-in set (its original name, so renaming the set changes nothing) and "s:Natural/Mine" for a
// folder inside a set. The store: {f: folder paths, t: [{id, n, f, src}] your textures, b: {built-in id: folder path} built-in textures added to a folder (they also stay in their
// own set), h: names of hidden sets, r: {set name: your name for it}}.
const TL_KEY='wb250_textures',TL_UI='wb250_texturesui';
const TL={q:'',active:'',open:new Set(['']),form:null,z:6,pick:null,sm:false,sel:new Set(),anc:null,vis:[],hidOpen:false};
const tlEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tlIC=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const tlCHEV='<svg class="lfa" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"/></svg>';
const tlCK='<svg viewBox="0 0 16 16"><path d="M4.3 8.4l2.4 2.4 5-5.3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const tlCmp=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
const tlLeaf=p=>p.split('/').pop(),tlParent=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')):'';
const tlNameOk=s=>{s=String(s||'').trim();return s&&s.length<=30&&!/[\\"<>&|/]/.test(s)&&!/^s:/i.test(s)?s:''};
const tlIsSet=k=>/^s:[^/]+$/.test(k||'');
const tlIn=(p,a)=>typeof p=='string'&&(p===a||p.startsWith(a+'/'));
let tlC=null,tlCr=null,tlDrag=null,tlSw=false;
// the store, read from the platform once per change
function tlLoad(){let raw=null;try{raw=kv.get(TL_KEY)}catch(e){}
 if(tlC===null||raw!==tlCr){let d=null;try{d=JSON.parse(raw||'null')}catch(e){}if(!d||typeof d!='object')d={};
  d.f=(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x&&x.length<=200);
  d.t=(Array.isArray(d.t)?d.t:[]).filter(x=>x&&/^u[\w-]{1,30}$/.test(x.id)&&typeof x.src=='string'&&/^data:image\/(?:webp|png|jpeg);base64,/.test(x.src)).map(x=>({id:x.id,n:String(x.n||'Texture').replace(/[<>&"|]/g,'').slice(0,40)||'Texture',f:typeof x.f=='string'?x.f:'',src:x.src}));
  d.h=(Array.isArray(d.h)?d.h:[]).filter(x=>typeof x=='string'&&x.length<=60);
  const r=d.r&&typeof d.r=='object'&&!Array.isArray(d.r)?d.r:{},b=d.b&&typeof d.b=='object'&&!Array.isArray(d.b)?d.b:{};d.r={};d.b={};
  Object.keys(r).forEach(k=>{const v=tlNameOk(r[k]);if(v)d.r[k]=v});Object.keys(b).forEach(k=>{if(/^[\w-]{1,40}$/.test(k)&&typeof b[k]=='string'&&b[k]&&b[k].length<=200)d.b[k]=b[k]});
  tlC=d;tlCr=raw}
 return{f:[...tlC.f],t:tlC.t.map(x=>({...x})),h:[...tlC.h],r:{...tlC.r},b:{...tlC.b}}}
const tlStore=d=>{try{kv.set(TL_KEY,JSON.stringify(d));tlC=null;return true}catch(e){pmsg('Could not keep the texture library in this browser.');return false}};
const tlUi=()=>{try{const u=JSON.parse(kv.get(TL_UI)||'null');if(u){TL.open=new Set(['',...(Array.isArray(u.o)?u.o:[])]);TL.active=typeof u.a=='string'?u.a:'';if(u.z>=0&&u.z<=8)TL.z=+u.z;TL.hidOpen=!!u.hd}}catch(e){}};
const tlUiSave=()=>{try{kv.set(TL_UI,JSON.stringify({o:[...TL.open].filter(Boolean),a:TL.active,z:TL.z,hd:TL.hidOpen}))}catch(e){}};
const tlSets=()=>TXF.map(([n,o])=>({k:'s:'+n,n,ids:Object.keys(o)}));
const tlSetOf=(k,sets)=>(sets||tlSets()).find(s=>s.k===k);
const tlShown=(d,n)=>d.r[n]||n;
// every folder path of yours, parents of deeper ones included; the sets themselves are not folders, but your folders inside a set are
function tlFolders(d){const s=new Set(),sets=tlSets(),add=p=>{let q='';p.split('/').forEach(part=>{q=q?q+'/'+part:part;if(!tlIsSet(q))s.add(q)})};
 [...d.f,...d.t.map(x=>x.f),...Object.values(d.b)].forEach(p=>{if(!p)return;if(p.startsWith('s:')&&!tlSetOf(p.split('/')[0],sets))return;add(p)});return[...s]}
const tlKids=(fs,p)=>fs.filter(x=>tlParent(x)===p).sort((a,b)=>tlCmp(tlLeaf(a),tlLeaf(b)));
const tlName=id=>(txSrc(id)||{n:id}).n;
// the textures a folder holds itself: Yours and folders hold yours and the built-in ones added to them; a set holds its own too
function tlIds(d,k){const own=d.t.filter(x=>x.f===k).map(x=>x.id),bi=Object.keys(d.b).filter(i=>d.b[i]===k&&txSrc(i)&&!txSrc(i).imp);
 if(tlIsSet(k)){const s=tlSetOf(k);return[...new Set([...(s?s.ids:[]),...own,...bi])]}
 return[...own,...bi].sort((a,b)=>tlCmp(tlName(a),tlName(b)))}
// textures in a folder and every folder inside it
function tlCount(d,fs,k){const s=new Set(tlIds(d,k));if(k)fs.forEach(p=>{if(tlIn(p,k)&&p!==k)tlIds(d,p).forEach(i=>s.add(i))});return s.size}
// every folder in list order, named by its full path, for the Move to pickers
function tlTree(d,fs){const o=[{v:'y',n:'Yours',d:0}],sets=tlSets(),walk=(k,n,dep)=>{o.push({v:k,n,d:dep});tlKids(fs,k).forEach(c=>walk(c,n+' / '+tlLeaf(c),dep+1))};
 tlTops(d,fs,sets,false).forEach(t=>walk(t.k,t.n,0));return o}
// the folders at the top: your folders and the built-in sets together, A to Z (hid: only the hidden sets)
function tlTops(d,fs,sets,hid){const ts=hid?[]:tlKids(fs,'').map(f=>({k:f,n:f}));
 sets.forEach(s=>{if(d.h.includes(s.n)===!!hid)ts.push({k:s.k,n:tlShown(d,s.n),set:s})});return ts.sort((a,b)=>tlCmp(a.n,b.n))}
// is this texture used by the project (an imported one in use cannot be deleted)
const tlUsed=id=>(WBS.texLib||[]).some(L=>L.t===id);
// the folder that new textures and folders go to: the active folder, else Yours
const tlHere=()=>TL.active||'';
function tlTile(id,cur,own){const e=txSrc(id);if(!e)return'';const th=txThumb(id),n=tlEsc(e.n),pk=TL.sel.has(id);
 return`<div><button type="button" data-tx="${tlEsc(id)}" class="${id===cur?'on':''}${pk?' pk':''}" aria-label="${n}" aria-pressed="${id===cur}">${th?`<img src="${th}" alt="" draggable="false">`:''}</button>${pk?`<i class="ck">${tlCK}</i>`:''}${own&&!TL.sm?`<button type="button" class="dx" data-txx="${tlEsc(id)}" aria-label="Delete ${n}">&#215;</button>`:''}</div>`}
function tlRow(key,label,count,depth,o){const open=TL.open.has(key);
 return`<div class="lrw${TL.active===key?' act':''}${o.hid?' hid':''}" style="--d:${depth}"><button type="button" class="lfr" data-k="${tlEsc(key)}" aria-expanded="${open}">${tlCHEV}<span class="lfi">${tlIC(o.home?ICN.home:open?ICN.folderOpen:ICN.folder)}</span><span class="lfn">${tlEsc(label)}</span><span class="lfc">${count}</span></button>${o.menu?`<button type="button" class="lmo" data-fm="${tlEsc(key)}" aria-haspopup="menu" aria-label="Folder options">${tlIC(ICN.more)}</button>`:''}</div>`}
function tlForm(d,fs,depth){const f=TL.form;if(!f)return'';
 if(f.t=='del')return`<div class="fform" style="--d:${depth}"><span>Delete “${tlEsc(tlLeaf(f.p))}” and the folders inside?</span><button type="button" class="warn" data-fok>Delete</button><button type="button" class="alt" data-fcx>Cancel</button></div>`;
 if(f.t=='mvf'){const opts=tlTree(d,fs).filter(x=>x.v!='y'&&!tlIn(x.v,f.p)).map(x=>`<option value="${tlEsc(x.v)}"${x.v===tlParent(f.p)?' selected':''}>${tlEsc(x.n)}</option>`).join('');
  return`<div class="fform" style="--d:${depth}"><select aria-label="Move into" data-fdest><option value="/"${tlParent(f.p)?'':' selected'}>Top level</option>${opts}</select><button type="button" class="primary" data-fok>Move</button><button type="button" class="alt" data-fcx>Cancel</button></div>`}
 const nm=f.t=='iren';return`<div class="fform" style="--d:${depth}"><input type="text" maxlength="${nm?40:30}" value="${tlEsc(f.v||'')}" aria-label="${nm?'Texture name':'Folder name'}" placeholder="${tlEsc(f.ph||(nm?'Texture name':'Folder name'))}"><button type="button" class="primary" data-fok>${f.t=='new'?'Create':f.t=='mv'?'Create and move':'Rename'}</button><button type="button" class="alt" data-fcx>Cancel</button></div>`}
// draws the tree into one host (the Texture effect of a panel); cur = the texture in use, which gets the accent edge
function tlPaint(host,cur,force){if(!host||!host.isConnected)return;const d=tlLoad(),fs=tlFolders(d),q=TL.q.trim().toLowerCase().split(/\s+/).filter(Boolean),sets=tlSets();
 // the folder of a newly picked texture opens, so its tile shows
 if(host.dataset.cur!==cur){host.dataset.cur=cur||'';const e=txSrc(cur);if(e){const k=e.imp?(d.t.find(x=>x.id===cur)||{f:''}).f:'s:'+(sets.find(s=>s.ids.includes(cur))||{n:''}).n;if(!TL.open.has(k)){TL.open.add(k);tlUiSave()}}}
 const vis=new Set();let h='';
 const grid=(ids,depth)=>{ids.forEach(i=>vis.add(i));return`<div class="lib${TL.sm?' sel':''}" style="--d:${depth}">${ids.map(i=>tlTile(i,cur,(txSrc(i)||{}).imp)).join('')}</div>`};
 const node=(k,label,depth,o)=>{let s=tlRow(k,label,tlCount(d,fs,k),depth,o);if(!TL.open.has(k))return s;
  if(TL.form&&TL.form.p===k&&TL.form.t!='mv')s+=tlForm(d,fs,depth+1);
  const kids=k===''?[]:tlKids(fs,k);kids.forEach(c=>{s+=node(c,tlLeaf(c),depth+1,{menu:1,hid:o.hid})});
  const ids=tlIds(d,k);s+=ids.length?grid(ids,depth+1):kids.length?'':`<div class="lmt" style="--d:${depth+1}">${k===''?'No textures yet':'Empty folder'}</div>`;return s};
 if(q.length){const all=[...d.t.map(x=>x.id),...sets.filter(s=>!d.h.includes(s.n)).flatMap(s=>s.ids)],hit=[...new Set(all)].filter(i=>q.every(w=>tlName(i).toLowerCase().includes(w)));
  h=hit.length?grid(hit,0):'<div class="lmt" style="--d:0">No textures found</div>'}
 else{
  h+=node('','Yours',0,{home:1,menu:1});
  tlTops(d,fs,sets,false).forEach(t=>{h+=node(t.k,t.n,0,{menu:1})});
  const hs=tlTops(d,fs,sets,true);
  if(hs.length){h+=`<div class="lrw" style="--d:0"><button type="button" class="lfr lfh" data-txhid aria-expanded="${TL.hidOpen}">${tlCHEV}<span class="lfi">${tlIC(ICN.eyeOff)}</span><span class="lfn">Hidden sets</span><span class="lfc">${hs.length}</span></button></div>`;if(TL.hidOpen)hs.forEach(t=>{h+=node(t.k,t.n,1,{menu:1,hid:1})})}
  if(TL.form&&TL.form.t=='mv')h=tlForm(d,fs,0)+h}
 // only textures you can see stay selected
 if([...TL.sel].some(i=>!vis.has(i))){TL.sel=new Set([...TL.sel].filter(i=>vis.has(i)));tlPaint(host,cur,true);return}
 TL.vis=[...vis];
 const pane=host.closest('.fxs'),all=pane&&pane.querySelector('[data-txall]');if(all){const any=[...TL.open].some(Boolean);all.setAttribute('aria-label',any?'Collapse all folders':'Expand all folders');all.classList.toggle('on',any)}
 const z=pane&&pane.querySelector('.txsz');if(z&&+z.value!==TL.z){z.value=TL.z;z.style.setProperty('--p',(TL.z/8*100)+'%')}
 if(pane)tlBar(pane,d,fs);
 const key=JSON.stringify([h,TL.z]);if(!force&&host.dataset.k===key)return;host.dataset.k=key;
 host.innerHTML=h;host.style.setProperty('--lcols',10-TL.z);
 const fi=host.querySelector('.fform input');if(fi&&TL.form&&document.activeElement!==fi){fi.focus();fi.select()}
 const fd=host.querySelector('[data-fdest]');if(fd&&TL.form&&TL.form.t=='mvf'&&document.activeElement!==fd)fd.focus()}
// the select button, and the bar under the tree: how many are ticked, Move to, Take out of folder, Delete
function tlBar(pane,d,fs){const sb=pane.querySelector('[data-txsel]'),bar=pane.querySelector('.txbar');if(!sb||!bar)return;
 sb.setAttribute('aria-pressed',String(TL.sm));sb.disabled=!TL.vis.length&&!TL.sm;bar.hidden=!TL.sm;if(!TL.sm)return;
 const n=TL.sel.size;bar.querySelector('.fscnt').textContent=n?`${n} selected`:'None selected';
 bar.querySelector('.txsa').textContent=TL.vis.length&&TL.vis.every(i=>TL.sel.has(i))?'Select none':'Select all';
 const mv=bar.querySelector('.txmv');mv.innerHTML='<option value="">Move to…</option>'+tlTree(d,fs).map(x=>`<option value="${tlEsc(x.v)}">${tlEsc(x.n)}</option>`).join('')+'<option value="+">＋ New folder…</option>';mv.disabled=!n;mv.value='';
 const ids=[...TL.sel],out=ids.filter(i=>{const e=txSrc(i);return e&&(e.imp?(d.t.find(x=>x.id===i)||{f:''}).f:d.b[i])}).length;bar.querySelector('.txout').disabled=!out;
 const dm=bar.querySelector('.txdelm'),cn=ids.filter(i=>(txSrc(i)||{}).imp).length;dm.disabled=!cn;if(!dm.dataset.sure)dm.textContent=cn?`Delete ${cn}`:'Delete'}
// every Texture effect that is showing its library draws it again
function tlPaintAll(force){document.querySelectorAll('.txtr').forEach(h=>{if(h.closest('[hidden]'))return;tlPaint(h,h.dataset.cur||'',force)})}
// a picture you chose becomes a texture: grayscale, at most 1024 pixels on its long side, its edges blended so it repeats without a seam (as `npm run textures --seam` does)
// folder: the folder it goes to (null: the one that is open)
function tlMake(file,folder,done){const fr=new FileReader();fr.onerror=()=>pmsg('Could not read that picture.');fr.onload=()=>{const img=new Image();img.onerror=()=>pmsg('Could not read that picture.');
 img.onload=()=>{try{const k=Math.min(1,1024/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(8,Math.round(img.naturalWidth*k)),h=Math.max(8,Math.round(img.naturalHeight*k)),c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);const D=x.getImageData(0,0,w,h),g=new Float32Array(w*h);for(let i=0;i<w*h;i++)g[i]=.2126*D.data[i*4]+.7152*D.data[i*4+1]+.0722*D.data[i*4+2];
  const wx=new Float32Array(w),wy=new Float32Array(h);for(let i=0;i<w;i++)wx[i]=Math.sin(Math.PI*i/w)**2;for(let i=0;i<h;i++)wy[i]=Math.sin(Math.PI*i/h)**2;
  {const s=new Float32Array(g);for(let y=0;y<h;y++)for(let X=0;X<w;X++)g[y*w+X]=s[y*w+X]*wx[X]+s[y*w+(X+(w>>1))%w]*(1-wx[X])}
  {const s=new Float32Array(g);for(let y=0;y<h;y++)for(let X=0;X<w;X++)g[y*w+X]=s[y*w+X]*wy[y]+s[((y+(h>>1))%h)*w+X]*(1-wy[y])}
  for(let i=0;i<w*h;i++){const v=Math.round(g[i]);D.data[i*4]=D.data[i*4+1]=D.data[i*4+2]=v;D.data[i*4+3]=255}x.putImageData(D,0,0);
  let src=c.toDataURL('image/webp',.8);if(!src.startsWith('data:image/webp'))src=c.toDataURL('image/jpeg',.85);
  const n=String(file.name||'Texture').replace(/\.[^.]*$/,'').replace(/[<>&"|]/g,'').trim().slice(0,40)||'Texture',id='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),d=tlLoad(),f=folder==null?tlHere():folder;
  d.t.push({id,n,f,src});txSrcAdd(id,n,src,{imp:1});tlStore(d);if(f)TL.open.add(f);tlUiSave();done(id,n)}catch(e){pmsg('Could not read that picture.');done(null)}};img.src=fr.result};fr.readAsDataURL(file)}
const tlMakeP=(file,folder)=>new Promise(res=>tlMake(file,folder,(id,n)=>res(id?{id,n}:null)));
// pictures from the Add texture button: pictures, and zips of pictures whose folders come back as your folders
async function tlAddFiles(files,pick){const jobs=[];let bad=0;
 for(const f of files){if(/\.zip$/i.test(f.name)||f.type=='application/zip'||f.type=='application/x-zip-compressed'){const r=txzRead(new Uint8Array(await f.arrayBuffer()));if(!r||!r.length){bad++;continue}
   r.forEach(e=>{const dir=e.dir.map(s=>String(s).replace(/[\\"<>&|/]/g,'').trim().slice(0,30)).filter(s=>s&&!/^s:/i.test(s));jobs.push({file:new File([e.data],e.name+'.img',{type:e.type}),folder:dir.length?dir.join('/'):null})})}
  else if(/^image\//.test(f.type)||/\.(png|jpe?g|webp)$/i.test(f.name))jobs.push({file:f,folder:null});else bad++}
 const got=[];for(const j of jobs){const r=await tlMakeP(j.file,j.folder);if(r)got.push(r)}
 tlPaintAll(true);
 if(got.length==1){if(pick)pick(got[0].id);pmsg('Added the texture “'+got[0].n+'”.')}
 else if(got.length)pmsg('Added '+got.length+' textures.'+(bad?' '+bad+' file'+(bad>1?'s were':' was')+' not a picture.':''));
 else pmsg(bad?'That file is not a picture or a zip of pictures.':'')}
// textures a project brought that this browser's library does not have yet go to Yours
function tlTake(ids){const d=tlLoad();let n=0;ids.forEach(id=>{const e=txSrc(id);if(e&&e.imp&&!d.t.some(x=>x.id===id)){d.t.push({id,n:e.n,f:'',src:e.src});n++}});if(n){tlStore(d);tlPaintAll(true)}}
const tlPath=p=>p?p.split('/').map((s,i)=>i==0&&tlIsSet(s)?tlShown(tlLoad(),s.slice(2)):s).join(' / '):'Yours';
// moves textures to a folder (k: its path, '' for Yours); a built-in texture added to a folder also stays in its own set
function tlMoveIds(ids,k){const d=tlLoad();if(k&&!tlIsSet(k)&&!tlFolders(d).includes(k))return;if(tlIsSet(k)&&!tlSetOf(k))return;let n=0,nb=0;
 ids.forEach(id=>{const e=txSrc(id);if(!e)return;const x=d.t.find(y=>y.id===id);
  if(x){x.f=k;n++}else if(!e.imp){const home=e.set?'s:'+e.set:'';if(!k||k===home)delete d.b[id];else{d.b[id]=k;nb++}n++}});
 if(!n)return;tlStore(d);if(k){TL.open.add(k);tlUiSave()}TL.sel.clear();TL.anc=null;tlPaintAll(true);
 pmsg(`Moved ${n} texture${n>1?'s':''} to “${tlPath(k)}”.`+(nb?' Built-in textures also stay in their own set.':''))}
function tlDel(id){const d=tlLoad(),x=d.t.find(y=>y.id===id);if(!x)return;if(tlUsed(id)){pmsg('That texture is used in this project. Choose another texture for those effects first.');return}d.t=d.t.filter(y=>y.id!==id);tlStore(d);TL.sel.delete(id);tlPaintAll(true);pmsg('Deleted the texture “'+x.n+'”.')}
// the textures a folder export holds, as a flat list of folders each named by its path. deep: the folders inside too. At the top (k '/') it is the whole library, hidden sets included.
function tlExportList(k,deep){const d=tlLoad(),fs=tlFolders(d),sets=tlSets(),top=k==='/';
 const nm=kk=>kk===''?'Yours':tlIsSet(kk)?tlShown(d,kk.slice(2)):tlLeaf(kk);
 const item=i=>{const e=txSrc(i),b=e&&txzBytes(e.src);return b?{name:e.n,data:b.data,ext:b.ext,fb:'Texture'}:null};
 const out=[],walk=(kk,pre)=>{const p=[...pre,nm(kk)];out.push({path:p,items:tlIds(d,kk).map(item).filter(Boolean)});if(deep||top)tlKids(fs,kk).forEach(c=>walk(c,p))};
 if(top){walk('',[]);[...tlTops(d,fs,sets,false),...tlTops(d,fs,sets,true)].forEach(t=>walk(t.k,[]))}else walk(k,[]);
 return{root:top,name:top?'':nm(k),folders:out,sub:!top&&tlKids(fs,k).length>0}}
async function tlSave(l){const dl=await use('downloads');if(!dl)return pmsg('Saving is not available here.');
 const name=safeName(l.root?'wodblok-textures':l.name+' textures','textures')+'.zip';
 try{const {zip,count}=buildMotifZip(l.folders);if(!zip)return pmsg('There are no textures to export.');
  const h0=dl.pick?await dl.pick({filename:name}):null;await dl.save({filename:name,data:new Blob([zip],{type:'application/zip'}),handle:h0});pmsg(`Exported ${count} texture${count>1?'s':''} as pictures.`)}
 catch(e){if(e&&e.code=='declined')return pmsg('');pmsg((e&&e.message)||'Could not export.')}}
// the toolbar button exports the whole library; a folder's menu exports that folder, asking about the folders inside it if it has any
function tlExport(k,btn){const deep=tlExportList(k,true);if(deep.root||!deep.sub)return tlSave(deep);rowMenu(btn,[['This folder only',()=>tlSave(tlExportList(k,false))],['This folder and the folders inside it',()=>tlSave(tlExportList(k,true))]])}
// a folder's path moves: everything inside it follows
function tlRemap(d,from,to){const re=p=>tlIn(p,from)?to+p.slice(from.length):p;
 d.f=[...new Set(d.f.map(re))];d.t.forEach(x=>{x.f=re(x.f)});Object.keys(d.b).forEach(i=>{d.b[i]=re(d.b[i])});if(!d.f.includes(to))d.f.push(to);
 TL.open=new Set([...TL.open].map(re));TL.active=re(TL.active)}
function tlPick(id,e){if(!TL.sm){TL.sm=true;TL.sel.clear()}const ks=TL.vis;
 if(e.shiftKey&&!TL.anc&&TL.sel.size==0&&ks.length)TL.anc=ks[0];
 if(e.shiftKey&&TL.anc&&ks.includes(TL.anc)){const a=ks.indexOf(TL.anc),b=ks.indexOf(id);ks.slice(Math.min(a,b),Math.max(a,b)+1).forEach(x=>TL.sel.add(x))}else{TL.sel.has(id)?TL.sel.delete(id):TL.sel.add(id);TL.anc=id}tlPaintAll(true)}
function tlExit(){TL.sm=false;TL.sel.clear();TL.anc=null;TL.form=null;tlPaintAll(true)}
// one set of listeners per Texture effect pane (each panel that takes effects has its own)
function tlWire(pane){const host=pane.querySelector('.txtr');if(!host||host.dataset.w)return;host.dataset.w='1';
 let file=pane.querySelector('.txfile');
 pane.querySelector('[data-txadd]').onclick=()=>{file.value='';file.click()};
 file.onchange=()=>{const fl=[...(file.files||[])];file.value='';if(fl.length)tlAddFiles(fl,host._pick)};
 pane.querySelector('[data-txall]').onclick=()=>{const any=[...TL.open].some(Boolean);if(any){TL.open=new Set(['']);TL.active=''}else{const d=tlLoad();TL.open=new Set(['',...tlFolders(d),...tlSets().map(s=>s.k)])}tlUiSave();tlPaintAll(true)};
 pane.querySelector('[data-txnew]').onclick=()=>{if(TL.sm&&TL.sel.size){TL.form={t:'mv',p:'',v:''};tlPaintAll(true);return}const p=tlHere();TL.open.add(p);TL.form={t:'new',p,v:''};tlPaintAll(true)};
 pane.querySelector('[data-txsel]').onclick=()=>{if(TL.sm)tlExit();else{TL.sm=true;TL.sel.clear();TL.anc=null;tlPaintAll(true)}};
 pane.querySelector('[data-txexp]').onclick=e=>{e.stopPropagation();tlSave(tlExportList('/',true))};
 const z=pane.querySelector('.txsz');z.addEventListener('input',()=>{TL.z=+z.value;tlUiSave();tlPaintAll(true)});
 const q=pane.querySelector('.txq');q.addEventListener('keydown',e=>e.stopPropagation());q.addEventListener('input',()=>{TL.q=q.value;document.querySelectorAll('.txq').forEach(o=>{if(o!==q)o.value=q.value});tlPaintAll(true)});
 const bar=pane.querySelector('.txbar');
 bar.querySelector('.txdone').onclick=tlExit;
 bar.querySelector('.txsa').onclick=()=>{if(TL.vis.length&&TL.vis.every(i=>TL.sel.has(i)))TL.sel.clear();else TL.vis.forEach(i=>TL.sel.add(i));tlPaintAll(true)};
 bar.querySelector('.txmv').oninput=e=>{const v=e.target.value;if(!v)return;if(v=='+'){e.target.value='';TL.form={t:'mv',p:'',v:''};tlPaintAll(true);return}tlMoveIds([...TL.sel],v=='y'?'':v)};
 bar.querySelector('.txout').onclick=()=>{const d=tlLoad();let n=0;[...TL.sel].forEach(i=>{const x=d.t.find(y=>y.id===i);if(x&&x.f){x.f='';n++}else if(!x&&d.b[i]){delete d.b[i];n++}});if(!n)return;tlStore(d);TL.sel.clear();tlPaintAll(true);pmsg(`Took ${n} texture${n>1?'s':''} out of ${n>1?'their folders':'its folder'}.`)};
 bar.querySelector('.txdelm').onclick=e=>{const b=e.currentTarget,ids=[...TL.sel].filter(i=>(txSrc(i)||{}).imp),ok=ids.filter(i=>!tlUsed(i));if(!ids.length)return;
  if(!ok.length){pmsg('Those textures are used in this project. Choose other textures for those effects first.');return}
  if(!b.dataset.sure){b.dataset.sure=1;b.textContent='Click to confirm';setTimeout(()=>{if(b.dataset.sure){delete b.dataset.sure;tlPaintAll(true)}},3000);return}
  delete b.dataset.sure;const d=tlLoad();d.t=d.t.filter(x=>!ok.includes(x.id));tlStore(d);ok.forEach(i=>TL.sel.delete(i));tlPaintAll(true);pmsg(`Deleted ${ok.length} texture${ok.length>1?'s':''} from the library.`+(ok.length<ids.length?` ${ids.length-ok.length} in use in this project were kept.`:''))};
 const toggle=k=>{if(TL.open.has(k)&&k!==''){TL.open.delete(k);if(tlIn(TL.active,k))TL.active=tlParent(k)}else{TL.open.add(k);TL.active=k}TL.form=null;tlUiSave();tlPaintAll(true)};
 const folderMenu=(btn,k)=>{const d=tlLoad(),exp=['Export…',()=>setTimeout(()=>tlExport(k,btn),0),!tlCount(d,tlFolders(d),k)],sub=['New folder inside',()=>{TL.open.add(k);TL.active=k;TL.form={t:'new',p:k,v:''};tlUiSave();tlPaintAll(true)}];
  if(k==='')return rowMenu(btn,[exp]);
  if(tlIsSet(k)){const n=k.slice(2),hid=d.h.includes(n);return rowMenu(btn,[sub,['Rename',()=>{TL.open.add(k);TL.form={t:'ren',p:k,v:tlShown(d,n),ph:n};tlPaintAll(true)}],['Reset name',()=>{const e=tlLoad();delete e.r[n];tlStore(e);tlPaintAll(true);pmsg('Set name reset.')},!d.r[n]],
   [hid?'Show in the list':'Hide from the list',()=>{const e=tlLoad();e.h=hid?e.h.filter(x=>x!==n):[...e.h,n];tlStore(e);if(!hid&&tlIn(TL.active,k))TL.active='';tlUiSave();tlPaintAll(true);pmsg(hid?`“${tlShown(d,n)}” is back in the list.`:`Hid “${tlShown(d,n)}”.`)}],exp])}
  rowMenu(btn,[sub,['Rename',()=>{TL.open.add(k);TL.form={t:'ren',p:k,v:tlLeaf(k)};tlPaintAll(true)}],['Move to…',()=>{TL.open.add(k);TL.form={t:'mvf',p:k};tlPaintAll(true)}],exp,['Delete folder',()=>{TL.open.add(k);TL.form={t:'del',p:k};tlPaintAll(true)}]])};
 const itemMenu=(btn,id)=>{const d=tlLoad(),x=d.t.find(y=>y.id===id);if(!x)return;const items=[['Rename',()=>{TL.form={t:'iren',p:x.f,id,v:x.n};TL.open.add(x.f);tlPaintAll(true)}]];
  if(x.f)items.push(['Move to Yours',()=>tlMoveIds([id],'')]);tlFolders(d).sort((a,b)=>tlCmp(a,b)).filter(p=>p!==x.f).slice(0,40).forEach(p=>items.push(['Move to “'+tlPath(p)+'”',()=>tlMoveIds([id],p)]));items.push(['Delete',()=>tlDel(id)]);rowMenu(btn,items)};
 const ok=()=>{const f=TL.form,d=tlLoad();if(!f)return;
  if(f.t=='del'){const gone=p=>tlIn(p,f.p);d.f=d.f.filter(p=>!gone(p));d.t.forEach(x=>{if(x.f&&gone(x.f))x.f=''});Object.keys(d.b).forEach(i=>{if(gone(d.b[i]))delete d.b[i]});tlStore(d);TL.form=null;TL.open.delete(f.p);if(gone(TL.active))TL.active=tlParent(f.p);tlUiSave();tlPaintAll(true);pmsg('Deleted the folder “'+tlLeaf(f.p)+'”. Its textures went back to Yours.');return}
  if(f.t=='mvf'){const sel=host.querySelector('[data-fdest]'),t=sel?sel.value:'/';TL.form=null;
   if(t!=='/'&&!tlIsSet(t)&&!tlFolders(d).includes(t)||t!=='/'&&tlIsSet(t)&&!tlSetOf(t)){tlPaintAll(true);return}
   const np=(t==='/'?'':t+'/')+tlLeaf(f.p);if(np!==f.p&&!tlIn(t,f.p)){tlRemap(d,f.p,np);tlStore(d);tlUiSave();pmsg('Moved “'+tlLeaf(f.p)+'” to “'+tlPath(t==='/'?'':t)+'”.')}tlPaintAll(true);return}
  const inp=host.querySelector('.fform input');
  if(f.t=='iren'){const v=String(inp&&inp.value||'').replace(/[<>&"|]/g,'').trim().slice(0,40),x=d.t.find(y=>y.id===f.id);if(!v||!x){if(inp)inp.focus();return}x.n=v;tlStore(d);txSrcAdd(x.id,v,x.src,{imp:1});TL.form=null;tlPaintAll(true);pmsg('Renamed the texture to “'+v+'”.');return}
  if(f.t=='ren'&&tlIsSet(f.p)){const n=tlNameOk(inp&&inp.value),o=f.p.slice(2);if(!n){if(inp)inp.focus();return}if(n===o)delete d.r[o];else d.r[o]=n;tlStore(d);TL.form=null;tlPaintAll(true);pmsg(n!==o?'Renamed the set to “'+n+'”.':'Set name reset.');return}
  const n=tlNameOk(inp&&inp.value);if(!n){if(inp)inp.focus();return}
  if(f.t=='mv'||f.t=='new'){const path=f.p?f.p+'/'+n:n,ex=tlFolders(d).find(x=>x.toLowerCase()==path.toLowerCase()),use2=ex||path;if(!ex){d.f.push(path);tlStore(d)}
   TL.open.add(use2);if(f.p)TL.open.add(f.p);TL.form=null;
   if(f.t=='mv'){tlUiSave();tlMoveIds([...TL.sel],use2);return}
   TL.active=use2;tlUiSave();tlPaintAll(true);pmsg(ex?'Opened the folder “'+tlPath(use2)+'”.':'Made the folder “'+tlPath(use2)+'”.');return}
  if(f.t=='ren'){const path=(tlParent(f.p)?tlParent(f.p)+'/':'')+n;if(path!==f.p){const clash=tlFolders(d).find(x=>x.toLowerCase()==path.toLowerCase()&&x!==f.p);tlRemap(d,f.p,path);tlStore(d);pmsg(clash?'Merged “'+tlLeaf(f.p)+'” into “'+tlLeaf(path)+'”.':'Renamed the folder to “'+n+'”.')}TL.form=null;tlUiSave();tlPaintAll(true)}};
 host.addEventListener('click',e=>{if(tlSw){e.stopImmediatePropagation();e.preventDefault()}},true);
 host.addEventListener('click',e=>{if(e.target.closest('input,select'))return;
  if(e.target.closest('[data-fcx]')){TL.form=null;tlPaintAll(true);return}
  if(e.target.closest('[data-fok]')){ok();return}
  if(e.target.closest('[data-txhid]')){TL.hidOpen=!TL.hidOpen;tlUiSave();tlPaintAll(true);return}
  const fm=e.target.closest('[data-fm]');if(fm){e.stopPropagation();TL.active=fm.dataset.fm;folderMenu(fm,fm.dataset.fm);return}
  const fr=e.target.closest('.lfr[data-k]');if(fr){toggle(fr.dataset.k);return}
  const x=e.target.closest('[data-txx]');if(x){tlDel(x.dataset.txx);return}
  const t=e.target.closest('[data-tx]');if(!t)return;if(TL.sm||e.ctrlKey||e.metaKey||e.shiftKey){tlPick(t.dataset.tx,e);return}if(host._pick)host._pick(t.dataset.tx)});
 host.addEventListener('contextmenu',e=>{const fr=e.target.closest('.lrw'),b=fr&&fr.querySelector('[data-fm]');if(b){e.preventDefault();b.click();return}
  const t=e.target.closest('[data-tx]'),e2=t&&txSrc(t.dataset.tx);if(e2&&e2.imp&&tlLoad().t.some(y=>y.id===t.dataset.tx)){e.preventDefault();itemMenu(t,t.dataset.tx)}});
 host.addEventListener('keydown',e=>{const t=e.target;
  if(t.matches&&t.matches('.fform input')){e.stopPropagation();if(e.key=='Enter'){e.preventDefault();ok()}else if(e.key=='Escape'){TL.form=null;tlPaintAll(true)}return}
  if(t.matches&&t.matches('[data-fdest]')){e.stopPropagation();if(e.key=='Escape'){TL.form=null;tlPaintAll(true)}return}
  const fr=t.closest&&t.closest('.lfr[data-k]');if(fr){const k=fr.dataset.k;if(e.key=='ArrowRight'&&!TL.open.has(k)){e.preventDefault();toggle(k)}else if(e.key=='ArrowLeft'&&TL.open.has(k)&&k!==''){e.preventDefault();toggle(k)}}});
 host.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('.fform input')&&TL.form)TL.form.v=e.target.value});
 // drag a tile onto a folder to move it there (a tile that is not in select mode)
 host.addEventListener('pointerdown',e=>{if(e.button!==0||e.shiftKey||e.ctrlKey||e.metaKey||TL.sm)return;const b=e.target.closest('.lib button[data-tx]');if(!b)return;const im=b.querySelector('img');tlDrag={id:b.dataset.tx,x:e.clientX,y:e.clientY,on:false,g:null,src:im?im.src:''}})}
// the markup of the library inside a Texture effect: Add texture first (as Add in the element panels), then the library's own bar, the search, the tree and the select bar
const tlPane=()=>`<div class="row txrow"><button type="button" class="alt" data-txadd>Add texture</button></div><input type="file" class="txfile vh" accept="image/*,.zip,application/zip" multiple tabindex="-1">
<div class="lnav txnav"><button type="button" class="ib" data-txall aria-label="Expand all folders">${tlIC(ICN.unfold)}</button><input type="range" class="txsz" min="0" max="8" step="1" value="6" aria-label="Texture size" data-plain><button type="button" class="ib" data-txnew aria-label="New folder">${tlIC(ICN.folderNew)}</button><button type="button" class="ib" data-txsel aria-label="Select textures" aria-pressed="false">${tlIC(ICN.marquee)}</button><button type="button" class="ib" data-txexp aria-label="Export all textures" aria-haspopup="menu" data-more>${tlIC(ICN.download)}</button></div>
<input type="text" class="txq" maxlength="40" placeholder="Find a texture" aria-label="Find a texture"><div class="ltr txtr" role="tree" aria-label="Textures"></div>
<div class="fsbar txbar" hidden><div class="r"><span class="fscnt"></span><button type="button" class="alt txsa">Select all</button><button type="button" class="primary txdone">Done</button></div><select class="txmv" aria-label="Move to folder"></select><div class="r"><button type="button" class="alt txout">Take out of folder</button><button type="button" class="alt txdelm">Delete</button></div></div>`;
// shows the library in a pane, with the texture in use; pick(id) is called when a tile is chosen or a picture is added
function tlShow(pane,cur,pick){tlWire(pane);const host=pane.querySelector('.txtr');host._pick=pick;tlPaint(host,cur)}
function init86(){tlUi();
 // textures this browser kept: they can be picked in any project
 tlLoad().t.forEach(x=>txSrcAdd(x.id,x.n,x.src,{imp:1}));
 WBX.wbTexLibTake=tlTake;
 {const prev=WBX.wbTexPicReady;WBX.wbTexPicReady=()=>{if(prev)prev();tlPaintAll()}}
 // a tile dragged over the page: it carries a small picture of itself, the folder under it lights up, and letting go there moves it
 document.addEventListener('pointermove',e=>{if(!tlDrag)return;if(!tlDrag.on){if(Math.hypot(e.clientX-tlDrag.x,e.clientY-tlDrag.y)<6)return;tlDrag.on=true;const g=document.createElement('img');g.id='txdg';g.alt='';g.src=tlDrag.src;g.style.cssText='position:fixed;width:44px;height:44px;object-fit:cover;border-radius:var(--r-s);pointer-events:none;z-index:70;opacity:.85;transform:translate(-50%,-50%)';document.body.appendChild(g);tlDrag.g=g}
  tlDrag.g.style.left=e.clientX+'px';tlDrag.g.style.top=e.clientY+'px';const f=document.elementFromPoint(e.clientX,e.clientY),r=f&&f.closest&&f.closest('.txtr .lfr[data-k]');
  document.querySelectorAll('.txtr .lfr.dropt').forEach(x=>{if(x!==r)x.classList.remove('dropt')});if(r)r.classList.add('dropt')});
 const tlEnd=e=>{if(!tlDrag)return;const x=tlDrag;tlDrag=null;if(x.g)x.g.remove();if(!x.on)return;tlSw=true;setTimeout(()=>{tlSw=false},0);document.querySelectorAll('.txtr .lfr.dropt').forEach(r=>r.classList.remove('dropt'));
  if(e.type!='pointerup')return;const f=document.elementFromPoint(e.clientX,e.clientY),r=f&&f.closest&&f.closest('.txtr .lfr[data-k]');if(r)tlMoveIds([x.id],r.dataset.k)};
 document.addEventListener('pointerup',tlEnd);document.addEventListener('pointercancel',tlEnd);
 document.addEventListener('keydown',e=>{if(e.key=='Escape'&&TL.sm&&!(e.target.matches&&e.target.matches('input,textarea,select')))tlExit()});
 // a project opened before this ran may have brought textures of its own
 tlTake((WBS.texLib||[]).map(L=>L.t))}
export {init86,tlPane,tlShow};
