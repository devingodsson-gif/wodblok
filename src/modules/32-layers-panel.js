import {cmdRegister} from '../commands/registry.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {luid,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {covOrder} from './18-projects-and-cover-overlay.js';
import {fpL,fpTog,fpRange} from './24-free-place-layers.js';
import {elDef,elKind,fxDef} from './65-element-core.js';
// ===== The element list (2.2.2). There are no layers: the document is one ordered list of elements, drawn in list order, first = bottom.
// This panel shows that list top first. Every row has an eye, a name, an opacity and a blend (the controls above the list act on the selected rows).
// Groups: a lyGroup is a row {k:'group'} in the same list. Its members carry g:<lyGroup u>; the lyGroup row sits just after (above) its members, so the list reads
// lyGroup, then its members, newest first. Select rows (Shift or Ctrl click), press Group (or Shift+G); Ungroup gives the members back.
// lyInkFill is kept because the colour wells still call it.
function lyInkFill(){if(WBX.wbPaintWells)WBX.wbPaintWells()}
const EYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const NOEYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-3 3.7M6.3 7.9A16.4 16.4 0 002.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/></svg>';
const GIC='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5V6a2 2 0 012-2H7M17 4h1.5a2 2 0 012 2v1.5M20.5 16.5V18a2 2 0 01-2 2H17M7 20H5.5a2 2 0 01-2-2v-1.5"/><rect x="8" y="8" width="8" height="8" rx="1.5"/></svg>';
const lyFold=new Set();      // groups the person has folded (kept for the session, not saved)
const lyFxO=new Set();       // rows whose effects are shown under them (2.3.0: Photoshop's fx rows; kept for the session)
let lySync=false;
let lyRen=null,lyDrag=null;
const lyP=()=>{const L=fpL();return L?(L.pl=L.pl||[]):[]};
const lyBy=(a,u)=>a.find(q=>String(q.u)===String(u))||null;
const lyIsG=q=>!!q&&q.k=='group';
function lyDepth(a,q){let n=0,g=q.g;while(g&&n<16){const G=lyBy(a,g);if(!G||!lyIsG(G))break;n++;g=G.g}return n}
// is q lyIn lyGroup u (any depth)?
function lyIn(a,q,u){let g=q.g,n=0;while(g&&n++<16){if(String(g)===String(u))return true;const G=lyBy(a,g);if(!G)return false;g=G.g}return false}
function lyHid(a,q){let g=q.g,n=0;while(g&&n++<16){if(lyFold.has(String(g)))return true;const G=lyBy(a,g);if(!G)return false;g=G.g}return false}
// the index range [start, end] of q's lyBlk: a lyGroup row with all its members, or the element alone
function lyBlk(a,i){const q=a[i];if(!lyIsG(q))return[i,i];let s=i;while(s>0&&lyIn(a,a[s-1],q.u))s--;return[s,i]}
const lySel=()=>{const a=lyP(),S=new Set(WBS.fpMS&&WBS.fpMS.size>1?[...WBS.fpMS].map(String):[]);if(WBS.fpSel!==-1&&WBS.fpSel!=null)S.add(String(WBS.fpSel));return a.filter(q=>S.has(String(q.u)))};
const lyName=q=>{if(q.nm)return String(q.nm);if(lyIsG(q))return q.n||'Group';const d=elDef(elKind(q));return(d&&d.name&&String(d.name(q)||''))||(d&&d.label)||'Element'};
function lyIc(q){if(lyIsG(q))return GIC;const d=elDef(elKind(q));return`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${(d&&d.icon)||''}</svg>`}
function renderLayers(){const host=$('lyl2');if(!host)return;const a=lyP(),S=new Set(lySel().map(q=>String(q.u)));
 const key=JSON.stringify([a.map(q=>[q.u,q.k,q.g||'',q.v===false?0:1,q.op==null?100:q.op,q.bl||'',q.nm||'',lyIsG(q)?q.n:'',elKind(q)=='text'&&q.tx?q.tx.text:'',(q.fx||[]).map(e=>[e.u,e.k,e.on])]),[...S],[...lyFold],[...lyFxO],lyRen]);
 if(host.dataset.k!==key){host.dataset.k=key;
  host.innerHTML=a.map((q,i)=>i).reverse().filter(i=>!lyHid(a,a[i])).map(i=>{const q=a[i],g=lyIsG(q),d=lyDepth(a,q),off=q.v===false,op=q.op!=null&&q.op<100?q.op+'%':'',bl=q.bl?(($('ly_bl').querySelector(`option[value="${q.bl}"]`)||{}).textContent||q.bl).split(' ')[0]:'',kids=g?a.filter(x=>x.g===q.u).length:0,
   meta=[g?`${kids} item${kids==1?'':'s'}`:'',bl,op].filter(Boolean).join(' · '),fxs=g?[]:(Array.isArray(q.fx)?q.fx:[]),fxOpen=fxs.length>0&&lyFxO.has(String(q.u));
   return`<div class="lyr${S.has(String(q.u))?' on':''}${off?' off':''}" data-u="${q.u}" draggable="true"${d?` style="margin-left:${12*d}px"`:''}><button type="button" class="eye" data-eye title="${off?'Show':'Hide'}">${off?NOEYE:EYE}</button>${g?`<button type="button" class="lyb" data-fold aria-expanded="${lyFold.has(String(q.u))?'false':'true'}" title="${lyFold.has(String(q.u))?'Open':'Fold'} this group"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${lyFold.has(String(q.u))?'M9 6l6 6-6 6':'M6 9l6 6 6-6'}"/></svg></button>`:''}<span class="lysw">${lyIc(q)}</span><span class="lyn">${String(lyRen)===String(q.u)?`<input value="${hx(lyName(q))}" maxlength="30">`:hx(lyName(q))}${meta?` <span class="lym">${meta}</span>`:''}</span>${fxs.length?`<button type="button" class="lyfxb" data-fxo aria-expanded="${fxOpen?'true':'false'}" aria-label="${fxOpen?'Fold':'Show'} effects">fx</button>`:''}<span class="lyact"><button type="button" class="lyb" data-more aria-haspopup="menu" aria-expanded="false" title="Element actions" aria-label="Element actions"><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg></button></span></div>`+
   (fxOpen?fxs.map(e=>{const fd=fxDef(e.k),on=e.on!==false;return`<div class="lyfx${on?'':' off'}" data-u="${q.u}" data-lfx="${e.u}" style="margin-left:${12*d+24}px"><button type="button" class="eye" data-fxeye title="${on?'Hide':'Show'}">${on?EYE:NOEYE}</button><span class="lyn">${hx(fd?fd.label:e.k)}</span></div>`}).join(''):'')}).join('');
  const inp=host.querySelector('input');if(inp){inp.focus();inp.select();const lyDone=ok=>{if(lyRen==null)return;const q=lyBy(lyP(),lyRen);if(ok&&q&&inp.value.trim())q.nm=inp.value.trim().slice(0,30);lyRen=null;store();upd()};inp.onkeydown=e=>{if(e.key=='Enter')lyDone(1);else if(e.key=='Escape')lyDone(0)};inp.onblur=()=>lyDone(1);inp.onclick=e=>e.stopPropagation()}}
 const n=a.filter(q=>!lyIsG(q)).length;$('lycnt').textContent=`${n} element${n==1?'':'s'}`;
 const s=lySel(),one=s[0]||null;$('ly_bl').value=one&&one.bl||'';$('ly_bl').disabled=!s.length;$('ly_op').disabled=!s.length;const ov=one?(one.op==null?100:one.op):100;if(+$('ly_op').value!=ov){lySync=true;try{$('ly_op').value=ov;$('ly_op').dispatchEvent(new Event('input',{bubbles:true}))}finally{lySync=false}}
 $('lygrp').disabled=s.length<2;$('lyung').disabled=!s.some(lyIsG)}
// ---- changing the list
const lyDone=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
function lySetSel(us){const l=us.map(String);WBS.fpMS=new Set(l);WBS.fpSel=l.length?l[l.length-1]:-1;WBS.fpB=null;WBS.fpGhost=null}
// Group: the selected rows (with everything lyIn any selected lyGroup) become members of one new lyGroup row, put where the highest of them was
function lyGroup(){const a=lyP(),s=lySel();if(s.length<2)return;const S=new Set(s.map(q=>String(q.u)));s.filter(lyIsG).forEach(G=>a.forEach(q=>{if(lyIn(a,q,G.u))S.add(String(q.u))}));
 const mem=a.filter(q=>S.has(String(q.u))),top=Math.max(...mem.map(q=>a.indexOf(q))),at=a.slice(0,top+1).filter(q=>!S.has(String(q.u))).length,rest=a.filter(q=>!S.has(String(q.u))),G={u:'g'+luid(),k:'group',n:'Group'};
 // members whose lyGroup is not itself selected become members of the new one; the rest keep their own lyGroup
 mem.forEach(q=>{if(!q.g||!S.has(String(q.g)))q.g=G.u});
 rest.splice(at,0,...mem,G);const L=fpL();L.pl=rest;lySetSel([G.u]);lyDone()}
function lyUngroup(){const a=lyP(),gs=lySel().filter(lyIsG);if(!gs.length)return;gs.forEach(G=>{a.forEach(q=>{if(q.g===G.u){if(G.g)q.g=G.g;else delete q.g}});a.splice(a.indexOf(G),1)});lySetSel([]);lyDone()}
function lyRemove(u){const a=lyP(),i=a.findIndex(q=>String(q.u)===String(u));if(i<0)return;const q=a[i],[s,e]=lyBlk(a,i);a.splice(s,e-s+1);if(WBS.fpSel==q.u||String(WBS.fpSel)===String(u))WBS.fpSel=-1;WBS.fpMS=new Set();lyDone()}
function lyDup(u){const a=lyP(),i=a.findIndex(q=>String(q.u)===String(u));if(i<0)return;const [s,e]=lyBlk(a,i),m=new Map(),c=a.slice(s,e+1).map(q=>{const n=JSON.parse(JSON.stringify(q));n.u=(lyIsG(q)?'g':'p')+luid();m.set(q.u,n.u);return n});c.forEach(n=>{if(n.g&&m.has(n.g))n.g=m.get(n.g)});a.splice(e+1,0,...c);lySetSel([c[c.length-1].u]);lyDone()}
// lyMove a lyBlk one place up (printed later) or down within its lyGroup
function lyMove(u,dir){const a=lyP(),i=a.findIndex(q=>String(q.u)===String(u));if(i<0)return;const[s,e]=lyBlk(a,i),par=a[i].g||null,sibOf=j=>{let k=j,n=0;while(k>=0&&k<a.length&&(a[k].g||null)!==par&&n++<64){const g=lyBy(a,a[k].g);if(!g)return-1;k=a.indexOf(g)}return k};
 if(dir>0){if(e+1>=a.length)return;const k=sibOf(e+1);if(k<0||(a[k].g||null)!==par)return;const[s2,e2]=lyBlk(a,k);if(s2<=e)return;const m=a.splice(s,e-s+1);a.splice(e2-(e-s),0,...m)}
 else{if(s<=0)return;const k=sibOf(s-1);if(k<0||(a[k].g||null)!==par)return;const[s2]=lyBlk(a,k);const m=a.splice(s,e-s+1);a.splice(s2,0,...m)}
 lyDone()}
// lyDrop a lyBlk above or below a row; dropping below an open group's own row puts it lyIn that lyGroup
function lyDrop(u,tu,above){const a=lyP(),i=a.findIndex(q=>String(q.u)===String(u)),t=a.findIndex(q=>String(q.u)===String(tu));if(i<0||t<0||i===t)return;const T=a[t];if(lyIsG(a[i])&&(String(T.u)===String(a[i].u)||lyIn(a,T,a[i].u)))return;
 const[s,e]=lyBlk(a,i),m=a.splice(s,e-s+1),root=m[m.length-1],t2=a.findIndex(q=>String(q.u)===String(tu)),[ts,te]=lyBlk(a,t2);let at,g=T.g||null;
 if(above)at=te+1;else if(lyIsG(T)&&!lyFold.has(String(T.u))){at=t2;g=T.u}else at=ts;
 if(g)root.g=g;else delete root.g;a.splice(at,0,...m);lyDone()}
function init32(){
 window.lyInkOn=1;
 // the old layer-only blend modes make no sense on one element
 ['behind','cancel','replace'].forEach(v=>{const o=$('ly_bl').querySelector(`option[value="${v}"]`);if(o)o.remove()});
 const host=$('lyl2');
 host.onclick=e=>{const r=e.target.closest('[data-u]');if(!r||e.target.closest('input'))return;const u=r.dataset.u,a=lyP(),q=lyBy(a,u);if(!q)return;
  if(e.target.closest('[data-eye]')){if(q.v===false)delete q.v;else q.v=false;lyDone();return}
  {const fe=e.target.closest('[data-lfx]');if(fe){const L=q.fx||[],x=L.find(z=>String(z.u)===fe.dataset.lfx);if(!x)return;if(e.target.closest('[data-fxeye]')){x.on=x.on===false;lyDone();return}lySetSel([u]);if(q.k=='pattern')WBS.patSel=q.u;if(q.k=='paint')WBS.paSel=q.u;if(WBX.wbFxOpen)WBX.wbFxOpen(elKind(q),x.u);upd();return}}
  if(e.target.closest('[data-fxo]')){const k=String(u);if(lyFxO.has(k))lyFxO.delete(k);else lyFxO.add(k);renderLayers();return}
  if(e.target.closest('[data-fold]')){if(lyFold.has(String(u)))lyFold.delete(String(u));else lyFold.add(String(u));renderLayers();return}
  {const mb=e.target.closest('[data-more]');if(mb){e.stopPropagation();rowMenu(mb,[['Rename',()=>{lyRen=u;upd()}],['Duplicate',()=>lyDup(u)],['Move up',()=>lyMove(u,1)],['Move down',()=>lyMove(u,-1)],lyIsG(q)?['Ungroup',()=>{lySetSel([u]);lyUngroup()}]:null,['Delete',()=>lyRemove(u)]].filter(Boolean));return}}
  if(e.shiftKey){fpRange(u);return}if(e.ctrlKey||e.metaKey){fpTog(u);return}
  lySetSel([u]);WBS.fpAnc=u;if(q.k=='pattern')WBS.patSel=q.u;if(q.k=='paint')WBS.paSel=q.u;upd()};
 host.ondblclick=e=>{const r=e.target.closest('[data-u]');if(!r||e.target.closest('[data-eye],.lyact'))return;lyRen=r.dataset.u;upd()};
 host.addEventListener('dragstart',e=>{const r=e.target.closest('[data-u]');if(!r)return;lyDrag=r.dataset.u;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain','element')}catch(x){}});
 const lyClr=()=>host.querySelectorAll('.lyr').forEach(x=>x.classList.remove('dragover-t','dragover-b'));
 host.addEventListener('dragover',e=>{if(lyDrag==null)return;const r=e.target.closest('[data-u]');if(!r)return;e.preventDefault();lyClr();const b=r.getBoundingClientRect();r.classList.add(e.clientY<b.top+b.height/2?'dragover-t':'dragover-b')});
 host.addEventListener('drop',e=>{if(lyDrag==null)return;e.preventDefault();const r=e.target.closest('[data-u]');lyClr();const u=lyDrag;lyDrag=null;if(!r)return;const b=r.getBoundingClientRect();lyDrop(u,r.dataset.u,e.clientY<b.top+b.height/2)});
 host.addEventListener('dragend',()=>{lyDrag=null;lyClr()});
 $('lygrp').onclick=e=>{e.stopPropagation();lyGroup()};
 $('lyung').onclick=e=>{e.stopPropagation();lyUngroup()};
 cmdRegister({id:'element.group',label:'Group the selected elements',shortcut:'Shift+G',elId:'lygrp',enabled:()=>!$('lygrp').disabled,run:()=>lyGroup()});
 cmdRegister({id:'element.ungroup',label:'Ungroup',elId:'lyung',enabled:()=>!$('lyung').disabled,run:()=>lyUngroup()});
 document.addEventListener('keydown',e=>{const t=e.target;if(t.matches&&t.matches('input,select,textarea'))return;if(e.shiftKey&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()=='g'){e.preventDefault();if(!$('lygrp').disabled)lyGroup()}});
 $('ly_bl').onchange=()=>{const v=$('ly_bl').value;lySel().forEach(q=>{if(v)q.bl=v;else delete q.bl});lyDone()};
 $('ly_op').addEventListener('input',()=>{if(lySync||WBS.fpSyncing)return;const v=+$('ly_op').value,s=lySel();if(!s.length)return;let ch=false;s.forEach(q=>{const o=q.op==null?100:q.op;if(o!==v){ch=true;if(v<100)q.op=v;else delete q.op}});if(ch){store();upd()}});
 covOrder();
}
export {lyInkFill,renderLayers,init32};
