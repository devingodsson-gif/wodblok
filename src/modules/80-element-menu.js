import {ICN} from './00-icons.js';
import {cmdRegister} from '../commands/registry.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpGrp,fpL,fpU} from './24-free-place-layers.js';
import {fpHit,fpPt} from './25-art-layers.js';
import {lyDupSel} from './32-layers-panel.js';
import {stUnlocked} from './63-stamp-tool.js';

// ===== Copy, paste and the right-click menu (2.22.0, owner Oct 22 2026). Cut, Copy and Paste work on the selected elements with Ctrl+X, C and V (inside the app: the clipboard is kept here, not the system's,
// so a picture copied elsewhere still pastes as an image). A right click on the canvas selects the element under the pointer and opens a menu: Cut, Copy, Paste, Duplicate, Bring to front, Send to back, Delete.
// On empty canvas it offers Paste. Nothing is hover-only: the menu is closed by a click outside it, Esc, or the next right click.
let EMCLIP=null;   // copies of the elements: [{...element}] (the same document only)
const emDone=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
const emCopy=()=>{const g=fpGrp().filter(q=>q.k!='group');if(!g.length)return false;EMCLIP=JSON.parse(JSON.stringify(g)).map(q=>{delete q.g;return q});return true};
function emPaste(){const L=fpL();if(!L||!EMCLIP||!EMCLIP.length)return false;L.pl=L.pl||[];const d=Math.min(CW,CH)*.03,ns=[];
 EMCLIP.forEach(o=>{const q=JSON.parse(JSON.stringify(o));q.u=fpU();if(q.x!=null)q.x=+(q.x+d).toFixed(1);if(q.y!=null)q.y=+(q.y+d).toFixed(1);L.pl.push(q);ns.push(q)});
 EMCLIP=JSON.parse(JSON.stringify(EMCLIP)).map(o=>{if(o.x!=null)o.x=+(o.x+d).toFixed(1);if(o.y!=null)o.y=+(o.y+d).toFixed(1);return o});   // the next paste lands a step further on
 WBS.fpMS=ns.length>1?new Set(ns.map(q=>String(q.u))):new Set();WBS.fpSel=ns[ns.length-1].u;WBS.fpAnc=WBS.fpSel;emDone();return true}
function emDel(){const L=fpL(),g=fpGrp();if(!L||!g.length)return false;g.forEach(q=>{const i=L.pl.indexOf(q);if(i>=0)L.pl.splice(i,1)});WBS.fpSel=-1;WBS.fpMS=new Set();emDone();return true}
const emCut=()=>{if(!emCopy())return false;return emDel()};
function emOrder(front){const L=fpL(),g=fpGrp();if(!L||!g.length)return false;g.forEach(q=>L.pl.splice(L.pl.indexOf(q),1));if(front)L.pl.push(...g);else L.pl.unshift(...g);emDone();return true}
const emCan={cut:()=>fpGrp().length>0,copy:()=>fpGrp().length>0,paste:()=>!!EMCLIP&&!!EMCLIP.length&&!!fpL(),dup:()=>fpGrp().length>0,front:()=>fpGrp().length>0,back:()=>fpGrp().length>0,del:()=>fpGrp().length>0};
const emRows=[['cut','Cut','Ctrl+X','split'],['copy','Copy','Ctrl+C','duplicate'],['paste','Paste','Ctrl+V','importIc'],['dup','Duplicate','Ctrl+D','layers'],null,['front','Bring to front','','front'],['back','Send to back','','back'],null,['del','Delete','Del','trash']];
const emRun={cut:emCut,copy:emCopy,paste:emPaste,dup:()=>lyDupSel(),front:()=>emOrder(true),back:()=>emOrder(false),del:emDel};
const emIc=n=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN[n]||''}</svg>`;
function emClose(){const m=$('ctxm');if(m)m.hidden=true}
function emOpen(e,over){let m=$('ctxm');if(!m){m=document.createElement('div');m.id='ctxm';m.className='pop';m.setAttribute('role','menu');document.body.appendChild(m);
  m.addEventListener('click',ev=>{const b=ev.target.closest('button[data-a]');if(!b||b.disabled)return;emClose();emRun[b.dataset.a]()})}
 m.innerHTML=emRows.map(r=>r?`<button type="button" role="menuitem" data-a="${r[0]}"${emCan[r[0]]()?'':' disabled'}>${emIc(r[3])}${r[1]}${r[2]?`<kbd>${r[2]}</kbd>`:''}</button>`:'<hr>').join('');
 m.hidden=false;m.style.cssText=`position:fixed;left:0;top:0;z-index:60`;const r=m.getBoundingClientRect();
 m.style.left=Math.max(4,Math.min(e.clientX,innerWidth-r.width-4))+'px';m.style.top=Math.max(4,Math.min(e.clientY,innerHeight-r.height-4))+'px'}
// returns true when it opened the menu (13 calls this first on a right click)
function emCtx(e){if(stUnlocked()!=null)return false;const L=fpL(),t=e.target;if(!L||!t||!t.closest||!t.closest('#boardP')||t.closest('button,input,select,textarea,label'))return false;
 const[x,y]=fpPt(e),p=fpHit(L,x,y);if(p){if(!fpGrp().includes(p)){WBS.fpMS=new Set();WBS.fpSel=p.u;WBS.fpAnc=String(p.u);upd()}}else{WBS.fpMS=new Set();WBS.fpSel=-1;upd()}
 if(!p&&!emCan.paste())return false;e.preventDefault();emOpen(e,p);return true}
function init80(){
 WBX.wbCtxMenu=emCtx;
 document.addEventListener('pointerdown',e=>{const m=$('ctxm');if(m&&!m.hidden&&!e.target.closest('#ctxm'))emClose()},true);
 document.addEventListener('keydown',e=>{const m=$('ctxm');if(e.key=='Escape'&&m&&!m.hidden){emClose();e.stopPropagation()}},true);
 addEventListener('blur',close);addEventListener('resize',close);
 // Ctrl or Cmd with X, C, V on the canvas (not in a field, not in a stamp's tab, which has its own copy and paste)
 document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey||e.shiftKey||stUnlocked()!=null)return;const t=e.target;if(t&&t.matches&&t.matches('input,textarea,select,[contenteditable]'))return;
  const k=e.key.toLowerCase();if(k=='c'){if(emCopy())e.preventDefault()}else if(k=='x'){if(emCut())e.preventDefault()}else if(k=='v'&&emCan.paste()){if(emPaste())e.preventDefault()}});
 [['edit.copy','Copy elements','Mod+C','copy'],['edit.cut','Cut elements','Mod+X','cut'],['edit.paste','Paste elements','Mod+V','paste']].forEach(([id,label,shortcut,a])=>cmdRegister({id,label,shortcut,enabled:()=>emCan[a](),run:()=>emRun[a]()}))}
export {init80};
