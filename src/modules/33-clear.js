import {use} from '../platform/index.js';
import {FMT_MIME,fmtOpen,fmtPack} from '../format/container.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {PCOL,shOf} from './04-canvas-and-stamp-outlines.js';
import {mkL,selOne,store} from './06-motif-library-folders.js';
import {build,hx,migLayers} from './10-layer-grids.js';
import {migEdges} from './11-pressure-flooding-block-edges.js';
import {migInk} from './17-texture-panel-and-previews.js';
import {ST,confirm2,coreStr,dirty,newId,openData,paintPst,pmsg,saveCp,saveTo,snapshot} from './18-projects-and-cover-overlay.js';
// ===== Clear: one blank square stamp, default palette, plain arrangement, no print effects. Canvas size and cover are kept. Undoable.
function clearAll(fresh){if(WBX.wbGrade)WBX.wbGrade.set(null);if(!fresh&&WBX.wbCap)WBX.wbCap();const L=mkL('Layer 1',[1],'check',180);L.ak={};L.fit='';L.gap=0;L.pst=0;L.pfl=0;L.man=false;L.ov={};
WBS.cur=0;selOne(-1);if(typeof WBS.brush!='undefined')WBS.brush=null;
const dim0={...WBS.dim};['cs','cr','n','co','g','cp'].forEach(k=>delete dim0[k]); // the canvas outline goes back to a plain rectangle (the ratio stays)
(WBX.wbApply||applyCore)({texLib:[],tiles:[{id:1,items:[],et:0,er:0}],layers:[L],proj:{...PCOL},dim:{...dim0,k:'rect',o:'p',s:[1,1]},pr:{e:0,q:0,t:'',a:0,sc:100,sd:811},tex:{u:[],v:87}});
store();if(fresh){if(WBX.wbResetHist)WBX.wbResetHist();pmsg('Started a new, empty project.')}else{if(WBX.wbCap)WBX.wbCap();pmsg('Cleared. Ctrl+Z brings back what you had.')}}

const fname=n=>(n||'untitled').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').toLowerCase().slice(0,50)||'untitled';
async function dl(name,data){const d=await use('downloads');if(!d)return pmsg('Downloading is not available here.');
try{const zip=await fmtPack({name,...data});await d.save({filename:fname(name)+'.wodblok',data:new Blob([zip],{type:FMT_MIME})});pmsg('Downloaded “'+name+'”.')}catch(e){if(e&&e.code!='declined')pmsg('Could not download: '+e.message)}}
async function renderPL(){$('pgrid').innerHTML='<div class="hint">Loading…</div>';
try{const ps=await ST.list();$('pgrid').innerHTML=ps.length?ps.map(p=>`<div class="pc${p.id==WBS.cp.id?' on':''}${WBS.pSel.has(p.id)?' ps':''}" data-p="${hx(p.id)}">${p.thumb?`<img src="${hx(p.thumb)}" alt="">`:'<div class="nt">No preview</div>'}<b title="${hx(p.name)}">${hx(p.name||'Untitled')}</b><small>${new Date(p.updated||0).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}<br>${hx(p.info||'')}</small><div class="row"><button class="alt" data-a="open">Open</button><button class="alt" data-a="dup">Duplicate</button><button class="alt" data-a="dl">Download</button><button class="alt" data-a="del">Delete</button></div></div>`).join(''):'<div class="hint">No saved projects yet. Click Save to keep this one.</div>';WBS.pSel=new Set([...WBS.pSel].filter(id=>ps.some(p=>p.id==id)));pSelUp()}
catch(e){$('pgrid').innerHTML='<div class="hint">Could not load projects: '+hx((e&&e.message)||'unknown error')+'</div>'}}
function pSelUp(){const g=$('pgrid');let bar=$('pselbar');if(!bar){bar=document.createElement('div');bar.id='pselbar';bar.className='row';bar.style.cssText='margin:6px 0;align-items:center;gap:8px';bar.innerHTML='<span id="pselc"></span><button class="alt" id="pseld">Delete selected</button><button class="alt" id="pselx">Download selected</button><button class="alt" id="pselc2">Clear</button>';g.parentNode.insertBefore(bar,g)}
g.querySelectorAll('[data-p]').forEach(c=>c.classList.toggle('ps',WBS.pSel.has(c.dataset.p)));bar.hidden=WBS.pSel.size<1;$('pselc').textContent=WBS.pSel.size+' selected';const d=$('pseld');delete d.dataset.sure;d.textContent='Delete selected'}
function init33(){
$('clr').onclick=()=>clearAll(false);
$('pdl').onclick=()=>dl($('pnm').value.trim()||'Untitled pattern',snapshot());

$('pfile').onchange=async()=>{const fl=$('pfile').files[0];$('pfile').value='';if(!fl)return;
try{const r=await fmtOpen(new Uint8Array(await fl.arrayBuffer())),d=r.project;
const name=(d.name||fl.name.replace(/\.wodblok(\.json)?$|\.json$/i,'')).slice(0,60);
// a file from a newer app opens as an unsaved copy: nothing is added to your projects and nothing is written back
if(r.newer){openData(d,null,name);pmsg('“'+name+'” was made by a newer WODBLOK, so it is open as a copy that is not saved. Update the app to work on the original.');return}
const id=newId();openData(d,id,name);await saveTo(id,name);WBS.cp.saved=coreStr();saveCp();pmsg('Opened “'+name+'” and added it to your projects.'+(r.missingAssets?' '+r.missingAssets+' picture'+(r.missingAssets>1?'s were':' was')+' missing from the file.':''));if(!$('plist').hidden)renderPL()}
catch(e){pmsg((e&&e.message)||'Could not open that file.')}};
$('pls').onclick=()=>{$('plist').hidden=!$('plist').hidden;$('pls').classList.toggle('on',!$('plist').hidden);if(!$('plist').hidden)renderPL()};
document.addEventListener('click',async e=>{const t=e.target;if(!t||!t.id)return;if(t.id=='pselc2'){WBS.pSel=new Set();pSelUp()}else if(t.id=='pselx'){for(const id of [...WBS.pSel]){const p=await ST.get(id);if(p)dl(p.name,JSON.parse(p.data))}}
else if(t.id=='pseld'){if(!t.dataset.sure){t.dataset.sure='1';t.textContent='Sure?';setTimeout(()=>{if(t.isConnected){delete t.dataset.sure;t.textContent='Delete selected'}},3500);return}const ids=[...WBS.pSel];for(const id of ids){await ST.del(id);if(id==WBS.cp.id){WBS.cp.id=null;saveCp()}}WBS.pSel=new Set();pmsg('Deleted '+ids.length+' project'+(ids.length>1?'s':'')+'.');renderPL();paintPst()}});
$('pgrid').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b){const c=e.target.closest('[data-p]');if(c&&(e.ctrlKey||e.metaKey||e.shiftKey)){const id=c.dataset.p,ord=[...$('pgrid').querySelectorAll('[data-p]')].map(x=>x.dataset.p);if(e.shiftKey&&WBS.pAnc&&ord.includes(WBS.pAnc)){const a=ord.indexOf(WBS.pAnc),z=ord.indexOf(id);WBS.pSel=new Set(ord.slice(Math.min(a,z),Math.max(a,z)+1))}else{WBS.pSel.has(id)?WBS.pSel.delete(id):WBS.pSel.add(id);WBS.pAnc=id}pSelUp()}return}const id=b.closest('[data-p]').dataset.p,a=b.dataset.a;
try{if(a=='open'){if(id==WBS.cp.id&&!dirty())return pmsg('That project is already open.');confirm2(b,'Discard changes?',async()=>{const p=await ST.get(id);if(!p)return pmsg('That project is gone.');openData(JSON.parse(p.data),id,p.name);pmsg('Opened “'+p.name+'”.');renderPL()})}
else if(a=='dup'){const p=await ST.get(id);if(!p)return;const nm=p.name+' copy';await ST.put(newId(),{name:nm,updated:Date.now(),info:p.info||'',thumb:p.thumb||'',data:p.data});pmsg('Duplicated as “'+nm+'”.');renderPL()}
else if(a=='dl'){const p=await ST.get(id);if(p)dl(p.name,JSON.parse(p.data))}
else if(a=='del'){if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Sure?';setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent='Delete'}},3500);return}
const p=await ST.get(id);await ST.del(id);if(id==WBS.cp.id){WBS.cp.id=null;saveCp()}pmsg('Deleted “'+(p&&p.name||'project')+'”.');renderPL();paintPst()}}
catch(err){pmsg('Something went wrong: '+((err&&err.message)||'unknown error'))}};
WBS.tiles.forEach(shOf);migLayers();migEdges();migInk();store();WBH.draw();build();
}
export {clearAll,renderPL,init33};
