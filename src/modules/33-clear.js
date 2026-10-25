import {files,kv,use} from '../platform/index.js';
import {FMT_MIME,fmtOpen,fmtPack,fmtPeek} from '../format/container.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {shOf} from './04-canvas-and-stamp-outlines.js';
import {mkL,selOne,store} from './06-motif-library-folders.js';
import {build,hx,migLayers} from './10-layer-grids.js';
import {trayDefault} from './50-tray-core.js';
import {bgNew} from './66-background.js';
import {fileSnap,thumb,confirm2,coreStr,dirty,newId,openData,paintPst,pmsg} from './18-projects-and-cover-overlay.js';
import {mkEL} from './71-randomize-elements.js';
// ===== Clear: one blank square stamp, default palette, plain arrangement, no print effects. Canvas size and cover are kept. Undoable.
function clearAll(fresh){if(fresh)link=null;if(!fresh&&WBX.wbCap)WBX.wbCap();if(WBX.wbGrade)WBX.wbGrade.set(null);const L=mkEL('Layer 1',[]),P0=trayDefault();L.pl=[bgNew(P0.bg)];   // 2.10.0: a new project starts with nothing in it (no Pattern)
WBS.cur=0;selOne(-1);if(typeof WBS.brush!='undefined')WBS.brush=null;
const dim0={...WBS.dim};['cs','cr','n','co','g','cp'].forEach(k=>delete dim0[k]); // the canvas outline goes back to a plain rectangle (the ratio stays)
(WBX.wbApply||applyCore)({texLib:[],tiles:[],layers:[L],proj:P0,dim:{...dim0,k:'rect',o:'p',s:[1,1]},pr:{e:0,q:0,t:'',a:0,sc:100,sd:811},tex:{u:[],v:87}});
store();if(fresh){if(WBX.wbResetHist)WBX.wbResetHist();pmsg('Started a new, empty project.')}else{if(WBX.wbCap)WBX.wbCap();pmsg('Cleared.')}}

const fname=n=>(n||'untitled').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').toLowerCase().slice(0,50)||'untitled';
// A small PNG preview for the file (file browsers can show it). Any picture that cannot be made is simply left out.
const putSnaps=(id,a)=>{if(!a||!a.length)return;try{kv.set('wb95_sn_'+(id||'draft'),JSON.stringify(a))}catch(e){}if(WBX.wbSnapLoad)WBX.wbSnapLoad()};
const thumbPng=url=>new Promise(res=>{if(!url)return res(null);const img=new Image(),to=setTimeout(()=>res(null),5000);img.onload=()=>{try{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);c.toBlob(async b=>{clearTimeout(to);res(b?new Uint8Array(await b.arrayBuffer()):null)},'image/png')}catch(e){res(null)}};img.onerror=()=>res(null);img.src=url});
// named snapshots are kept per project in settings (wb95_sn_<id>, or _draft); they travel inside the file
const snapsOf=id=>{try{const a=JSON.parse(kv.get('wb95_sn_'+(id||'draft'))||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}};
// The file this project was opened from or last saved to (browsers that can write back to a file). Not part of the document.
let link=null;
const fileUnlink=()=>{link=null};   // a new project from a template is not tied to a file
// A project is written back into its file only while its name is the one it had when the file was opened or saved: rename it and it becomes a new file.
const linkOf=(id,name)=>link&&link.id==(id||null)&&link.name===name?link.handle:null;
async function dl(name,data,thumbUrl,id){const d=await use('downloads');if(!d){pmsg('Saving is not available here.');return false}
try{const h0=!linkOf(id,name)&&!folder&&d.pick?await d.pick({filename:fname(name)+'.wodblok'}):null;   // no file to write into: ask where first, packing a big project takes a while
const zip=await fmtPack({name,...data},{thumbnail:await thumbPng(thumbUrl),snapshots:snapsOf(id)}),blob=new Blob([zip],{type:FMT_MIME});
// a project that is not tied to a file yet goes straight into the projects folder when one is chosen (never over a file that is already there)
if(folder&&!linkOf(id,name)){try{if(await files.folderWritable(folder)){const f=await files.saveToFolder(folder,fname(name)+'.wodblok',blob);link={id:id||null,name,handle:f.handle};if(WBX.wbRecentAdd)WBX.wbRecentAdd(name,f.handle);pmsg('Saved “'+name+'” to '+folder.name+'.');if(!$('plist').hidden)renderPL();return true}}catch(e){/* the folder cannot be written: use the Save dialog below */}}
const r=await d.save({filename:fname(name)+'.wodblok',data:blob,handle:linkOf(id,name)||h0});if(r&&r.handle){link={id:id||null,name,handle:r.handle};if(WBX.wbRecentAdd)WBX.wbRecentAdd(name,r.handle)}pmsg((r&&r.how=='saved'?'Saved “':'Downloaded “')+name+'”.');return true}catch(e){if(e&&e.code!='declined')pmsg('Could not save: '+e.message);else pmsg('');return false}}
// Save project: write the .wodblok file (into the file this project came from or was last saved to, where the browser allows; else the Save dialog; else a download).
async function saveProject(){const name=$('pnm').value.trim()||'Untitled pattern',id=WBS.cp.id||newId(),b=$('psv');b.disabled=true;pmsg('Saving…');
try{if(await dl(name,await fileSnap(),await thumb(),id)){WBS.cp={id,name,saved:coreStr()};$('pnm').value=name}}finally{b.disabled=false;paintPst()}}
// The projects folder: a folder on this computer that holds .wodblok files (Chrome and Edge). Its handle is remembered, so the next visit lists it again.
let folder=null,plTok=0,plUrls=[];
// a File menu item since 2.43.0 (it was a button in the top bar)
const folderPaint=()=>{const b=$('pls'),t=b.querySelector('span')||b;t.textContent=folder?'Projects folder…':'Open projects folder…';b.classList.toggle('on',!$('plist').hidden)};
const stem=n=>n.replace(/\.wodblok$/i,'');
async function renderPL(){const g=$('pgrid'),tok=++plTok;plUrls.forEach(u=>URL.revokeObjectURL(u));plUrls=[];$('pdlgt').textContent=folder?folder.name:'Projects';
g.innerHTML='<div class="hint">Loading…</div>';
try{if(!await files.folderAccess(folder)){g.innerHTML='<div class="hint">Allow access to the folder to see its projects.</div>';return}
const list=await files.listFolder(folder);if(tok!=plTok)return;
g.innerHTML=list.length?list.map((it,i)=>`<div class="pc" data-p="${i}"><div class="nt">&nbsp;</div><b title="${hx(it.name)}">${hx(stem(it.name))}</b><small></small><div class="row"><button class="alt" data-a="open">Open</button></div></div>`).join(''):'<div class="hint">No projects in this folder</div>';
plList=list;
for(let i=0;i<list.length;i++){if(tok!=plTok)return;const c=g.querySelector('[data-p="'+i+'"]');if(!c)continue;
try{const f=await list[i].handle.getFile();c.querySelector('small').textContent=new Date(f.lastModified).toLocaleString([],{dateStyle:'medium',timeStyle:'short'});const pk=fmtPeek(new Uint8Array(await f.arrayBuffer()));
if(tok!=plTok)return;if(pk.name)c.querySelector('b').textContent=pk.name;if(pk.thumbnail){const u=URL.createObjectURL(new Blob([pk.thumbnail],{type:'image/png'}));plUrls.push(u);c.querySelector('.nt').outerHTML='<img src="'+u+'" alt="">'}}catch(e){}}}
catch(e){if(tok==plTok)g.innerHTML='<div class="hint">Could not read the folder: '+hx((e&&e.message)||'unknown error')+'</div>'}}
let plList=[];
function init33(){
$('clr').onclick=()=>clearAll(false);
$('psv').onclick=saveProject;WBX.wbClearAll=()=>clearAll(false);WBX.wbOpenFile=(f,h)=>openFile(f,h);
// 2.21.0, the File menu: Save project as (a new file: the link to the file it came from is dropped first), Export opens the Export panel. Save project is the File menu's own item since 2.43.0 (the top bar button is gone)
$('psa').onclick=()=>{link=null;saveProject()};$('xrm').onclick=()=>{if(WBX.wbOpenPanel)WBX.wbOpenPanel('xrec')};

const openFile=async(fl,handle)=>{
try{const r=await fmtOpen(new Uint8Array(await fl.arrayBuffer())),d=r.project;
const name=(d.name||fl.name.replace(/\.wodblok$/i,'')).slice(0,60);
// a file from a newer app opens as an unsaved copy: nothing is written back
if(r.newer){openData(d,null,name);WBS.cp.saved='';paintPst();link=null;putSnaps(null,r.snapshots);pmsg('“'+name+'” was made by a newer WODBLOK, so it is open as a copy that is not saved. Update the app to work on the original.');return}
const id=newId();openData(d,id,name);link=handle?{id,name,handle}:null;if(handle&&WBX.wbRecentAdd)WBX.wbRecentAdd(name,handle);putSnaps(id,r.snapshots);await new Promise(r2=>setTimeout(r2,50));WBS.cp.saved=coreStr();paintPst();pmsg('Opened “'+name+'”.'+(r.missingAssets?' '+r.missingAssets+' picture'+(r.missingAssets>1?'s were':' was')+' missing from the file.':''))}
catch(e){pmsg((e&&e.message)||'Could not open that file.')}};
// (2.24.0) Open project with unsaved changes asks first, like New project: the first click turns the menu item into "Discard changes?", a second click opens
const pfAsk=e=>{const b=$('pop');if(!dirty()||b.dataset.sure)return false;e.preventDefault();e.stopImmediatePropagation();confirm2(b,'Discard changes?',()=>{});return true};
$('pop').addEventListener('click',pfAsk,true);   // on the menu item itself, so the menu stays open showing the question
$('pfile').addEventListener('click',e=>{if(pfAsk(e))return;const b=$('pop');if(b.dataset.sure)confirm2(b,'',()=>{});if(WBX.wbCloseMenus)WBX.wbCloseMenus()},true);   // also the Open project command
$('pfile').onchange=()=>{const fl=$('pfile').files[0];$('pfile').value='';if(fl)openFile(fl,null)};
// Where the browser has its own Open dialog (Chrome, Edge) use it, so Save can write back to the same file; elsewhere the plain file input opens as before
let pfNative=false;
$('pfile').addEventListener('click',async e=>{if(!files.canOpen()||pfNative)return;e.preventDefault();
try{const r=await files.open();if(r)openFile(r.file,r.handle)}catch(err){pfNative=true;$('pfile').click()}});   // the browser's own dialog is not available here (for example inside the claude.ai preview): use the plain file input
$('pfile').addEventListener('change',()=>{pfNative=false});
files.onLaunch((f,h)=>openFile(f,h));
// Projects folder
if(!files.canPickFolder())$('pls').hidden=true;else files.savedFolder().then(h=>{if(h){folder=h;folderPaint()}}).catch(()=>{});
const closeList=()=>{$('plist').hidden=true;folderPaint()};
$('pls').onclick=async()=>{if(!folder){try{const h=await files.pickFolder();if(!h)return;folder=h}catch(e){return pmsg('This browser did not allow opening a folder here.')}}else if(!$('plist').hidden)return closeList();
$('plist').hidden=false;folderPaint();renderPL()};
$('pcf').onclick=async()=>{try{await files.forgetFolder()}catch(e){}folder=null;plTok++;closeList()};
$('pgrid').onclick=async e=>{const c=e.target.closest('[data-p]');if(!c)return;const b=c.querySelector('[data-a="open"]'),it=plList[+c.dataset.p];if(!it)return;
try{confirm2(b,'Discard changes?',async()=>{const f=await it.handle.getFile();await openFile(f,it.handle);closeList()})}catch(err){pmsg('Something went wrong: '+((err&&err.message)||'unknown error'))}};
WBS.tiles.forEach(shOf);migLayers();store();WBH.draw();build();
}
export {clearAll,fileUnlink,renderPL,thumbPng,init33};
