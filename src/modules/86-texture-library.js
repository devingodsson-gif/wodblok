import {ICN} from './00-icons.js';
import {kv} from '../platform/index.js';
import {WBS,WBX} from './01-launch-and-version.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {TXF,txSrc,txSrcAdd,txThumb} from './16-texture-generators.js';

// ===== The texture library (2.50.0; owner Oct 26 2026: a list of every texture with its picture, "add texture" at the top to import one, in the file and folder system) =====
// It is the folder tree of the style guide (Part 9, section 12) with tiles: Yours (the home folder) holds your imported textures that are in no folder, your folders
// sit beside the built-in sets (Paper and board, Cloth and weave, ...), A to Z. It is shown in the Texture effect, where a tile picks the effect's texture.
// Your textures and folders are kept in this browser through the platform (kv), and every project that uses one carries its picture too (16-texture-generators.js).
// Not built yet: select mode, dragging a texture onto a folder, hiding sets, Export and Import from file.
const TL_KEY='wb250_textures',TL_UI='wb250_texturesui';
const TL={q:'',active:'',open:new Set(['']),form:null,z:6,pick:null};
const tlEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tlIC=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const tlCHEV='<svg class="lfa" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"/></svg>';
const tlCmp=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
const tlLeaf=p=>p.split('/').pop(),tlParent=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')):'';
const tlNameOk=s=>{s=String(s||'').trim();return s&&s.length<=30&&!/[\\"<>&|/]/.test(s)?s:''};
// the store: {f: folder paths, t: [{id, n: name, f: folder path ('' = Yours), src: the picture}]}
function tlLoad(){let d=null;try{d=JSON.parse(kv.get(TL_KEY)||'null')}catch(e){}if(!d||typeof d!='object')d={};
 d.f=(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x&&x.length<=200);
 d.t=(Array.isArray(d.t)?d.t:[]).filter(x=>x&&/^u[\w-]{1,30}$/.test(x.id)&&typeof x.src=='string'&&/^data:image\/(?:webp|png|jpeg);base64,/.test(x.src)).map(x=>({id:x.id,n:String(x.n||'Texture').replace(/[<>&"|]/g,'').slice(0,40)||'Texture',f:typeof x.f=='string'?x.f:'',src:x.src}));
 return d}
const tlStore=d=>{try{kv.set(TL_KEY,JSON.stringify(d));return true}catch(e){pmsg('Could not keep the texture library in this browser.');return false}};
const tlUi=()=>{try{const u=JSON.parse(kv.get(TL_UI)||'null');if(u){TL.open=new Set(['',...(Array.isArray(u.o)?u.o:[])]);TL.active=typeof u.a=='string'?u.a:'';if(u.z>=0&&u.z<=8)TL.z=+u.z}}catch(e){}};
const tlUiSave=()=>{try{kv.set(TL_UI,JSON.stringify({o:[...TL.open].filter(Boolean),a:TL.active,z:TL.z}))}catch(e){}};
// every folder path, parents of deeper ones included
function tlFolders(d){const s=new Set(),add=p=>{let q='';p.split('/').forEach(part=>{q=q?q+'/'+part:part;s.add(q)})};d.f.forEach(add);d.t.forEach(x=>{if(x.f)add(x.f)});return[...s]}
const tlKids=(fs,p)=>fs.filter(x=>tlParent(x)===p).sort((a,b)=>tlCmp(tlLeaf(a),tlLeaf(b)));
const tlSets=()=>TXF.map(([n,o])=>({k:'s:'+n,n,ids:Object.keys(o)}));
// is this texture used by the project (an imported one in use cannot be deleted)
const tlUsed=id=>(WBS.texLib||[]).some(L=>L.t===id);
// the folder that new textures and folders go to: the active folder when it is one of yours, else Yours
const tlHere=()=>TL.active&&!TL.active.startsWith('s:')?TL.active:'';
function tlTile(id,cur,own){const e=txSrc(id);if(!e)return'';const th=txThumb(id),n=tlEsc(e.n);
 return`<div><button type="button" data-tx="${tlEsc(id)}" class="${id===cur?'on':''}" aria-label="${n}" aria-pressed="${id===cur}">${th?`<img src="${th}" alt="">`:''}</button>${own?`<button type="button" class="dx" data-txx="${tlEsc(id)}" aria-label="Delete ${n}">&#215;</button>`:''}</div>`}
function tlRow(key,label,count,depth,o){const open=TL.open.has(key);
 return`<div class="lrw${TL.active===key?' act':''}" style="--d:${depth}"><button type="button" class="lfr" data-k="${tlEsc(key)}" aria-expanded="${open}">${tlCHEV}<span class="lfi">${tlIC(o.home?ICN.home:open?ICN.folderOpen:ICN.folder)}</span><span class="lfn">${tlEsc(label)}</span><span class="lfc">${count}</span></button>${o.menu?`<button type="button" class="lmo" data-fm="${tlEsc(key)}" aria-haspopup="menu" aria-label="Folder options">${tlIC(ICN.more)}</button>`:''}</div>`}
function tlForm(depth){const f=TL.form;if(!f)return'';
 if(f.t=='del')return`<div class="fform" style="--d:${depth}"><span>Delete “${tlEsc(tlLeaf(f.p))}” and the folders inside?</span><button type="button" class="warn" data-fok>Delete</button><button type="button" class="alt" data-fcx>Cancel</button></div>`;
 const nm=f.t=='iren';return`<div class="fform" style="--d:${depth}"><input type="text" maxlength="${nm?40:30}" value="${tlEsc(f.v||'')}" aria-label="${nm?'Texture name':'Folder name'}" placeholder="${nm?'Texture name':'Folder name'}"><button type="button" class="primary" data-fok>${f.t=='new'?'Create':'Rename'}</button><button type="button" class="alt" data-fcx>Cancel</button></div>`}
// draws the tree into one host (the Texture effect of a panel); cur = the texture in use, which gets the accent edge
function tlPaint(host,cur,force){if(!host||!host.isConnected)return;const d=tlLoad(),fs=tlFolders(d),q=TL.q.trim().toLowerCase().split(/\s+/).filter(Boolean),sets=tlSets();
 // the folder of a newly picked texture opens, so its tile shows
 if(host.dataset.cur!==cur){host.dataset.cur=cur||'';const e=txSrc(cur);if(e){const k=e.imp?(d.t.find(x=>x.id===cur)||{f:''}).f:'s:'+(sets.find(s=>s.ids.includes(cur))||{n:''}).n;if(!TL.open.has(k)){TL.open.add(k);tlUiSave()}}}
 const thumbs=[];let h='';
 const own=p=>d.t.filter(x=>x.f===p).sort((a,b)=>tlCmp(a.n,b.n));
 const count=p=>d.t.filter(x=>x.f===p||x.f.startsWith(p+'/')).length;
 const grid=(ids,depth,mine)=>{ids.forEach(i=>thumbs.push(i));return`<div class="lib" style="--d:${depth}">${ids.map(i=>tlTile(i,cur,mine)).join('')}</div>`};
 if(q.length){const all=[...d.t.map(x=>({id:x.id,n:x.n,own:1})),...sets.flatMap(s=>s.ids.map(i=>({id:i,n:(txSrc(i)||{n:i}).n})))],hit=all.filter(x=>q.every(w=>x.n.toLowerCase().includes(w)));
  h=hit.length?`<div class="lib" style="--d:0">${hit.map(x=>{thumbs.push(x.id);return tlTile(x.id,cur,x.own)}).join('')}</div>`:'<div class="lmt" style="--d:0">No textures found</div>'}
 else{
  const tree=(p,depth)=>{let s='';tlKids(fs,p).forEach(f=>{s+=tlRow(f,tlLeaf(f),count(f),depth,{menu:1});if(TL.open.has(f)){if(TL.form&&TL.form.p===f)s+=tlForm(depth+1);s+=tree(f,depth+1);const o=own(f);s+=o.length?grid(o.map(x=>x.id),depth+1,1):tlKids(fs,f).length?'':`<div class="lmt" style="--d:${depth+1}">Empty folder</div>`}});return s};
  const home=own('');h+=tlRow('','Yours',home.length,0,{home:1});
  if(TL.open.has('')){if(TL.form&&TL.form.p==='')h+=tlForm(1);h+=home.length?grid(home.map(x=>x.id),1,1):'<div class="lmt" style="--d:1">No textures yet</div>'}
  const tops=[...tlKids(fs,'').map(f=>({k:f,n:f})),...sets.map(s=>({k:s.k,n:s.n,set:s}))].sort((a,b)=>tlCmp(a.n,b.n));
  tops.forEach(t=>{if(t.set){h+=tlRow(t.k,t.n,t.set.ids.length,0,{});if(TL.open.has(t.k))h+=grid(t.set.ids,1,0)}
   else{h+=tlRow(t.k,t.n,count(t.k),0,{menu:1});if(TL.open.has(t.k)){if(TL.form&&TL.form.p===t.k)h+=tlForm(1);h+=tree(t.k,1);const o=own(t.k);h+=o.length?grid(o.map(x=>x.id),1,1):tlKids(fs,t.k).length?'':'<div class="lmt" style="--d:1">Empty folder</div>'}}})}
 const key=JSON.stringify([h,TL.z]);if(!force&&host.dataset.k===key)return;host.dataset.k=key;
 host.innerHTML=h;host.style.setProperty('--lcols',10-TL.z);
 const pane=host.closest('.fxs'),all=pane&&pane.querySelector('[data-txall]');if(all){const any=[...TL.open].some(Boolean);all.setAttribute('aria-label',any?'Collapse all folders':'Expand all folders');all.classList.toggle('on',any)}
 const z=pane&&pane.querySelector('.txsz');if(z&&+z.value!==TL.z){z.value=TL.z;z.style.setProperty('--p',(TL.z/8*100)+'%')}
 const fi=host.querySelector('.fform input');if(fi&&TL.form&&document.activeElement!==fi){fi.focus();fi.select()}}
// every Texture effect that is showing its library draws it again
function tlPaintAll(force){document.querySelectorAll('.txtr').forEach(h=>{if(h.closest('[hidden]'))return;tlPaint(h,h.dataset.cur||'',force)})}
// a picture you chose becomes a texture: grayscale, at most 1024 pixels on its long side, its edges blended so it repeats without a seam (as `npm run textures --seam` does)
function tlMake(file,done){const fr=new FileReader();fr.onerror=()=>pmsg('Could not read that picture.');fr.onload=()=>{const img=new Image();img.onerror=()=>pmsg('Could not read that picture.');
 img.onload=()=>{try{const k=Math.min(1,1024/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(8,Math.round(img.naturalWidth*k)),h=Math.max(8,Math.round(img.naturalHeight*k)),c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);const D=x.getImageData(0,0,w,h),g=new Float32Array(w*h);for(let i=0;i<w*h;i++)g[i]=.2126*D.data[i*4]+.7152*D.data[i*4+1]+.0722*D.data[i*4+2];
  const wx=new Float32Array(w),wy=new Float32Array(h);for(let i=0;i<w;i++)wx[i]=Math.sin(Math.PI*i/w)**2;for(let i=0;i<h;i++)wy[i]=Math.sin(Math.PI*i/h)**2;
  {const s=new Float32Array(g);for(let y=0;y<h;y++)for(let X=0;X<w;X++)g[y*w+X]=s[y*w+X]*wx[X]+s[y*w+(X+(w>>1))%w]*(1-wx[X])}
  {const s=new Float32Array(g);for(let y=0;y<h;y++)for(let X=0;X<w;X++)g[y*w+X]=s[y*w+X]*wy[y]+s[((y+(h>>1))%h)*w+X]*(1-wy[y])}
  for(let i=0;i<w*h;i++){const v=Math.round(g[i]);D.data[i*4]=D.data[i*4+1]=D.data[i*4+2]=v;D.data[i*4+3]=255}x.putImageData(D,0,0);
  let src=c.toDataURL('image/webp',.8);if(!src.startsWith('data:image/webp'))src=c.toDataURL('image/jpeg',.85);
  const n=String(file.name||'Texture').replace(/\.[^.]*$/,'').replace(/[<>&"|]/g,'').trim().slice(0,40)||'Texture',id='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),d=tlLoad(),f=tlHere();
  d.t.push({id,n,f,src});txSrcAdd(id,n,src,{imp:1});tlStore(d);TL.open.add(f);tlUiSave();done(id,n)}catch(e){pmsg('Could not read that picture.')}};img.src=fr.result};fr.readAsDataURL(file)}
// textures a project brought that this browser's library does not have yet go to Yours
function tlTake(ids){const d=tlLoad();let n=0;ids.forEach(id=>{const e=txSrc(id);if(e&&e.imp&&!d.t.some(x=>x.id===id)){d.t.push({id,n:e.n,f:'',src:e.src});n++}});if(n){tlStore(d);tlPaintAll(true)}}
const tlMv=(id,p)=>{const d=tlLoad(),x=d.t.find(y=>y.id===id);if(!x)return;x.f=p;tlStore(d);if(p)TL.open.add(p);tlUiSave();tlPaintAll(true);pmsg('Moved “'+x.n+'” to “'+(p?p.replace(/\//g,' / '):'Yours')+'”.')};
function tlDel(id){const d=tlLoad(),x=d.t.find(y=>y.id===id);if(!x)return;if(tlUsed(id)){pmsg('That texture is used in this project. Choose another texture for those effects first.');return}d.t=d.t.filter(y=>y.id!==id);tlStore(d);tlPaintAll(true);pmsg('Deleted the texture “'+x.n+'”.')}
// one set of listeners per Texture effect pane (each panel that takes effects has its own)
function tlWire(pane){const host=pane.querySelector('.txtr');if(!host||host.dataset.w)return;host.dataset.w='1';
 let file=pane.querySelector('.txfile');
 pane.querySelector('[data-txadd]').onclick=()=>{file.value='';file.click()};
 file.onchange=()=>{const f=file.files&&file.files[0];if(!f)return;tlMake(f,(id,n)=>{if(host._pick)host._pick(id);tlPaintAll(true);pmsg('Added the texture “'+n+'”.')})};
 pane.querySelector('[data-txall]').onclick=()=>{const any=[...TL.open].some(Boolean);if(any){TL.open=new Set(['']);TL.active=''}else{const d=tlLoad();TL.open=new Set(['',...tlFolders(d),...tlSets().map(s=>s.k)])}tlUiSave();tlPaintAll(true)};
 pane.querySelector('[data-txnew]').onclick=()=>{const p=tlHere();TL.open.add(p);TL.form={t:'new',p,v:''};tlPaintAll(true)};
 const z=pane.querySelector('.txsz');z.addEventListener('input',()=>{TL.z=+z.value;tlUiSave();tlPaintAll(true)});
 const q=pane.querySelector('.txq');q.addEventListener('keydown',e=>e.stopPropagation());q.addEventListener('input',()=>{TL.q=q.value;document.querySelectorAll('.txq').forEach(o=>{if(o!==q)o.value=q.value});tlPaintAll(true)});
 const toggle=k=>{if(TL.open.has(k)&&k!==''){TL.open.delete(k);if(TL.active===k||TL.active.startsWith(k+'/'))TL.active=k.startsWith('s:')?'':tlParent(k)}else{TL.open.add(k);TL.active=k}tlUiSave();tlPaintAll(true)};
 const folderMenu=(btn,p)=>rowMenu(btn,[['New folder inside',()=>{TL.open.add(p);TL.active=p;TL.form={t:'new',p,v:''};tlUiSave();tlPaintAll(true)}],['Rename',()=>{TL.form={t:'ren',p,v:tlLeaf(p)};tlPaintAll(true)}],['Delete folder',()=>{TL.form={t:'del',p};tlPaintAll(true)}]]);
 const itemMenu=(btn,id)=>{const d=tlLoad(),x=d.t.find(y=>y.id===id);if(!x)return;const items=[['Rename',()=>{TL.form={t:'iren',p:x.f,id,v:x.n};TL.open.add(x.f);tlPaintAll(true)}]];
  if(x.f)items.push(['Move to Yours',()=>tlMv(id,'')]);tlFolders(d).sort((a,b)=>tlCmp(a,b)).filter(p=>p!==x.f).slice(0,40).forEach(p=>items.push(['Move to “'+p.replace(/\//g,' / ')+'”',()=>tlMv(id,p)]));items.push(['Delete',()=>tlDel(id)]);rowMenu(btn,items)};
 const ok=()=>{const f=TL.form,d=tlLoad();if(!f)return;
  if(f.t=='del'){const gone=p=>p===f.p||p.startsWith(f.p+'/');d.f=d.f.filter(p=>!gone(p));d.t.forEach(x=>{if(x.f&&gone(x.f))x.f=''});tlStore(d);TL.form=null;TL.open.delete(f.p);if(gone(TL.active))TL.active=tlParent(f.p);tlUiSave();tlPaintAll(true);pmsg('Deleted the folder “'+tlLeaf(f.p)+'”. Its textures went back to Yours.');return}
  const inp=host.querySelector('.fform input');
  if(f.t=='iren'){const v=String(inp&&inp.value||'').replace(/[<>&"|]/g,'').trim().slice(0,40),x=d.t.find(y=>y.id===f.id);if(!v||!x){if(inp)inp.focus();return}x.n=v;tlStore(d);txSrcAdd(x.id,v,x.src,{imp:1});TL.form=null;tlPaintAll(true);pmsg('Renamed the texture to “'+v+'”.');return}
  const n=tlNameOk(inp&&inp.value);if(!n){if(inp)inp.focus();return}
  if(f.t=='new'){const path=f.p?f.p+'/'+n:n,ex=tlFolders(d).find(x=>x.toLowerCase()==path.toLowerCase());if(!ex){d.f.push(path);tlStore(d)}const use=ex||path;TL.open.add(use);if(f.p)TL.open.add(f.p);TL.active=use;TL.form=null;tlUiSave();tlPaintAll(true);pmsg(ex?'Opened the folder “'+use.replace(/\//g,' / ')+'”.':'Made the folder “'+use.replace(/\//g,' / ')+'”.');return}
  if(f.t=='ren'){const path=tlParent(f.p)?tlParent(f.p)+'/'+n:n;if(path!==f.p){const re=p=>p===f.p?path:p.startsWith(f.p+'/')?path+p.slice(f.p.length):p,clash=tlFolders(d).find(x=>x.toLowerCase()==path.toLowerCase()&&x!==f.p);
    d.f=[...new Set(d.f.map(re))];d.t.forEach(x=>{x.f=re(x.f)});if(!d.f.includes(path))d.f.push(path);tlStore(d);TL.open=new Set([...TL.open].map(re));TL.active=re(TL.active);pmsg(clash?'Merged “'+tlLeaf(f.p)+'” into “'+tlLeaf(path)+'”.':'Renamed the folder to “'+n+'”.')}TL.form=null;tlUiSave();tlPaintAll(true)}};
 host.addEventListener('click',e=>{if(e.target.closest('input'))return;
  if(e.target.closest('[data-fcx]')){TL.form=null;tlPaintAll(true);return}
  if(e.target.closest('[data-fok]')){ok();return}
  const fm=e.target.closest('[data-fm]');if(fm){e.stopPropagation();folderMenu(fm,fm.dataset.fm);return}
  const fr=e.target.closest('.lfr[data-k]');if(fr){toggle(fr.dataset.k);return}
  const x=e.target.closest('[data-txx]');if(x){tlDel(x.dataset.txx);return}
  const t=e.target.closest('[data-tx]');if(t&&host._pick)host._pick(t.dataset.tx)});
 host.addEventListener('contextmenu',e=>{const fr=e.target.closest('.lrw'),b=fr&&fr.querySelector('[data-fm]');if(b){e.preventDefault();b.click();return}
  const t=e.target.closest('[data-tx]'),e2=t&&txSrc(t.dataset.tx);if(e2&&e2.imp&&tlLoad().t.some(y=>y.id===t.dataset.tx)){e.preventDefault();itemMenu(t,t.dataset.tx)}});
 host.addEventListener('keydown',e=>{const t=e.target;
  if(t.matches&&t.matches('.fform input')){e.stopPropagation();if(e.key=='Enter'){e.preventDefault();ok()}else if(e.key=='Escape'){TL.form=null;tlPaintAll(true)}return}
  const fr=t.closest&&t.closest('.lfr[data-k]');if(fr){const k=fr.dataset.k;if(e.key=='ArrowRight'&&!TL.open.has(k)){e.preventDefault();toggle(k)}else if(e.key=='ArrowLeft'&&TL.open.has(k)&&k!==''){e.preventDefault();toggle(k)}}});
 host.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('.fform input')&&TL.form)TL.form.v=e.target.value})}
// the markup of the library inside a Texture effect: Add texture first (as Add in the element panels), then the library's own bar, the search and the tree
const tlPane=()=>`<div class="row txrow"><button type="button" class="alt" data-txadd>Add texture</button></div><input type="file" class="txfile vh" accept="image/*" tabindex="-1">
<div class="lnav txnav"><button type="button" class="ib" data-txall aria-label="Expand all folders">${tlIC(ICN.unfold)}</button><input type="range" class="txsz" min="0" max="8" step="1" value="6" aria-label="Texture size" data-plain><button type="button" class="ib" data-txnew aria-label="New folder">${tlIC(ICN.folderNew)}</button></div>
<input type="text" class="txq" maxlength="40" placeholder="Find a texture" aria-label="Find a texture"><div class="ltr txtr" role="tree" aria-label="Textures"></div>`;
// shows the library in a pane, with the texture in use; pick(id) is called when a tile is chosen or a picture is added
function tlShow(pane,cur,pick){tlWire(pane);const host=pane.querySelector('.txtr');host._pick=pick;tlPaint(host,cur)}
function init86(){tlUi();
 // textures this browser kept: they can be picked in any project
 tlLoad().t.forEach(x=>txSrcAdd(x.id,x.n,x.src,{imp:1}));
 WBX.wbTexLibTake=tlTake;
 {const prev=WBX.wbTexPicReady;WBX.wbTexPicReady=()=>{if(prev)prev();tlPaintAll()}}
 // a project opened before this ran may have brought textures of its own
 tlTake((WBS.texLib||[]).map(L=>L.t))}
export {init86,tlPane,tlShow};
