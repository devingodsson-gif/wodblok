import {ICN} from './00-icons.js';
import {cmdRegister} from '../commands/registry.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {luid,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {mkWell} from './52-tray-ui.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpTog,fpRange} from './24-free-place-layers.js';
import {elDef,elKind,fxDef} from './65-element-core.js';
// ===== The element list (2.2.2). There are no layers: the document is one ordered list of elements, drawn in list order, first = bottom.
// This panel shows that list top first. Every row has an eye, a name, an opacity and a blend (the controls above the list act on the selected rows).
// Groups: a lyGroup is a row {k:'group'} in the same list. Its members carry g:<lyGroup u>; the lyGroup row sits just after (above) its members, so the list reads
// lyGroup, then its members, newest first. Select rows (Shift or Ctrl click), press Group (or Ctrl+G; Ungroup is Ctrl+Shift+G); Ungroup gives the members back.
// lyInkFill is kept because the colour wells still call it.
function lyInkFill(){if(WBX.wbPaintWells)WBX.wbPaintWells()}
// 2.60.0 (artist test: "lock elements so they can't be selected or moved by clicking on the canvas"): a locked element (lk: 1) is skipped by a click and by the box on the
// canvas; it is still picked here, in the Elements list. One history step.
function lyLock(u,on){const L=fpL();if(!L)return;const q=(L.pl||[]).find(x=>String(x.u)===String(u));if(!q)return;if(on)q.lk=1;else delete q.lk;
 WBX.wbLabelNext={t:on?'Lock':'Unlock',at:performance.now()};store();upd();if(WBX.wbCap)WBX.wbCap()}
const EYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.eye+'</svg>';
const NOEYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.eyeOff+'</svg>';
const GIC='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.group+'</svg>';
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
 const key=JSON.stringify([a.map(q=>[q.u,q.k,q.g||'',q.v===false?0:1,q.lk?1:0,q.op==null?100:q.op,q.bl||'',q.nm||'',lyIsG(q)?q.n:'',elKind(q)=='text'&&q.tx?q.tx.text:'',(q.fx||[]).map(e=>[e.u,e.k,e.on])]),[...S],[...lyFold],[...lyFxO],lyRen]);
 if(host.dataset.k!==key){host.dataset.k=key;
  host.innerHTML=a.map((q,i)=>i).reverse().filter(i=>!lyHid(a,a[i])).map(i=>{const q=a[i],g=lyIsG(q),d=lyDepth(a,q),off=q.v===false,op=q.op!=null&&q.op<100?q.op+'%':'',bl=q.bl?(($('ly_bl').querySelector(`option[value="${q.bl}"]`)||{}).textContent||q.bl).split(' ')[0]:'',kids=g?a.filter(x=>x.g===q.u).length:0,
   meta=[g?`${kids} item${kids==1?'':'s'}`:'',bl,op].filter(Boolean).join(' · '),fxs=g?[]:(Array.isArray(q.fx)?q.fx:[]),fxOpen=fxs.length>0&&lyFxO.has(String(q.u));
   return`<div class="lyr${S.has(String(q.u))?' on':''}${off?' off':''}" data-u="${q.u}" draggable="true"${d?` style="margin-left:${12*d}px"`:''}><button type="button" class="eye" data-eye title="${off?'Show':'Hide'}">${off?NOEYE:EYE}</button>${g?`<button type="button" class="lyb" data-fold aria-expanded="${lyFold.has(String(q.u))?'false':'true'}" title="${lyFold.has(String(q.u))?'Open':'Fold'} this group"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${lyFold.has(String(q.u))?ICN.chevR:ICN.chevD}</svg></button>`:''}<span class="lysw">${lyIc(q)}</span><span class="lyn">${String(lyRen)===String(q.u)?`<input value="${hx(lyName(q))}" maxlength="30">`:hx(lyName(q))}${meta?` <span class="lym">${meta}</span>`:''}</span>${fxs.length?`<button type="button" class="lyfxb" data-fxo aria-expanded="${fxOpen?'true':'false'}" aria-label="${fxOpen?'Fold':'Show'} effects">fx</button>`:''}<span class="lyact">${q.lk?`<button type="button" class="lyb lylk" data-unlk aria-label="Unlock"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.lock}</svg></button>`:''}<button type="button" class="lyb" data-more aria-haspopup="menu" aria-expanded="false" title="Element actions" aria-label="Element actions"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.more}</svg></button></span></div>`+
   (fxOpen?fxs.map(e=>{const fd=fxDef(e.k),on=e.on!==false;return`<div class="lyfx${on?'':' off'}" data-u="${q.u}" data-lfx="${e.u}" style="margin-left:${12*d+24}px"><button type="button" class="eye" data-fxeye title="${on?'Hide':'Show'}">${on?EYE:NOEYE}</button><span class="lyn">${hx(fd?fd.label:e.k)}</span></div>`}).join(''):'')}).join('');
  const inp=host.querySelector('input');if(inp){inp.focus();inp.select();const lyDone=ok=>{if(lyRen==null)return;const q=lyBy(lyP(),lyRen);if(ok&&q&&inp.value.trim())q.nm=inp.value.trim().slice(0,30);lyRen=null;store();upd()};inp.onkeydown=e=>{if(e.key=='Enter')lyDone(1);else if(e.key=='Escape')lyDone(0)};inp.onblur=()=>lyDone(1);inp.onclick=e=>e.stopPropagation()}}
 const n=a.filter(q=>!lyIsG(q)).length;if(!document.body.classList.contains('stedit'))$('lycnt').textContent=`${n} element${n==1?'':'s'}`;
 const s=lySel(),one=s[0]||null;$('ly_bl').value=one&&one.bl||'';{const rp=s.some(q=>q.bl=='replace');$('ly_rarow').hidden=$('ly_rprow').hidden=$('ly_rmrow').hidden=!rp;const q1=s.find(q=>q.bl=='replace'),rv=q1&&q1.rm!=null?+q1.rm:25;if(+$('ly_rm').value!=rv){lySync=true;try{$('ly_rm').value=rv;$('ly_rm').dispatchEvent(new Event('input',{bubbles:true}))}finally{lySync=false}}}$('ly_bl').disabled=!s.length;$('ly_op').disabled=!s.length;const ov=one?(one.op==null?100:one.op):100;if(+$('ly_op').value!=ov){lySync=true;try{$('ly_op').value=ov;$('ly_op').dispatchEvent(new Event('input',{bubbles:true}))}finally{lySync=false}}
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
function lyDup(u){const a=lyP(),i=a.findIndex(q=>String(q.u)===String(u));if(i<0)return;const [s,e]=lyBlk(a,i),m=new Map(),c=a.slice(s,e+1).map(q=>{const n=JSON.parse(JSON.stringify(q));n.u=(lyIsG(q)?'g':'p')+luid();{const d=Math.min(CW,CH)*.03;if(n.x!=null&&!n.bgd){n.x=+(n.x+d).toFixed(1);if(n.y!=null)n.y=+(n.y+d).toFixed(1)}}m.set(q.u,n.u);return n});c.forEach(n=>{if(n.g&&m.has(n.g))n.g=m.get(n.g)});a.splice(e+1,0,...c);lySetSel([c[c.length-1].u]);lyDone()}
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
// 2.76.11 (2.76 review, "for experienced users"): the element actions as commands, so the Edit menu, the right-click menu, the shortcuts and command search all
// reach them: order one step or all the way, lock, hide, rename, select all, deselect, turn a quarter and flip. Each is one history step, named.
const lyLbl=t=>{WBX.wbLabelNext={t,at:performance.now()}};
const lyNm=q=>{const d=elDef(elKind(q)),n=d&&d.name?d.name(q):'';return String(n||'element').replace(/\s+/g,' ').trim().slice(0,24)};
const lyAct=(t,f)=>()=>{const s=lySel();if(!s.length)return false;lyLbl(t+' '+(s.length==1?lyNm(s[0]):s.length+' elements'));f(s);lyDone();return true};
const lyOrdAll=front=>()=>{const s=lySel();if(!s.length)return false;const a=lyP();lyLbl(front?'Bring to front':'Send to back');s.forEach(q=>a.splice(a.indexOf(q),1));const bg=a.filter(q=>q.bgd).length;if(front)a.push(...s);else a.splice(bg,0,...s);lyDone();return true};
function lyCmds(){const any=()=>lySel().length>0,one=()=>lySel().length==1,KW=(id,label,kw,run,enabled,shortcut)=>cmdRegister({id,label,kw,run,enabled:enabled||any,...(shortcut?{shortcut}:{})});
 KW('element.forward','Bring forward','order up raise',()=>{const s=lySel();if(!s.length)return false;lyLbl('Bring forward');lyMove(s[s.length-1].u,1);return true},null,'Mod+]');
 KW('element.backward','Send backward','order down lower',()=>{const s=lySel();if(!s.length)return false;lyLbl('Send backward');lyMove(s[s.length-1].u,-1);return true},null,'Mod+[');
 KW('element.front','Bring to front','order top',lyOrdAll(true),null,'Mod+Shift+]');KW('element.back','Send to back','order bottom',lyOrdAll(false),null,'Mod+Shift+[');
 KW('element.lock','Lock','freeze',lyAct('Lock',s=>s.forEach(q=>{q.lk=1})),()=>lySel().some(q=>!q.lk));
 KW('element.unlock','Unlock','',lyAct('Unlock',s=>s.forEach(q=>{delete q.lk})),()=>lySel().some(q=>q.lk));
 KW('element.hide','Hide','visibility eye',lyAct('Hide',s=>s.forEach(q=>{q.v=false})),()=>lySel().some(q=>q.v!==false));
 KW('element.show','Show','visibility eye',lyAct('Show',s=>s.forEach(q=>{delete q.v})),()=>lySel().some(q=>q.v===false));
 KW('element.rename','Rename','name',()=>{const s=lySel();if(s.length!=1)return false;if(WBX.wbOpenPanel)WBX.wbOpenPanel('lyrs');lyRen=s[0].u;upd();return true},one);
 KW('element.rotateCw','Rotate 90° clockwise','turn rotate quarter',lyAct('Rotated',s=>s.forEach(q=>{q.r=((((+q.r||0)+90)%360)+540)%360-180})));
 KW('element.rotateCcw','Rotate 90° anticlockwise','turn rotate quarter counterclockwise',lyAct('Rotated',s=>s.forEach(q=>{q.r=((((+q.r||0)-90)%360)+540)%360-180})));
 KW('element.flip','Flip across','mirror flip horizontal',lyAct('Flipped',s=>s.forEach(q=>{q.f=-(q.f||1)})));
 KW('edit.selectAll','Select all','select everything',()=>{const a=lyP().filter(q=>!q.bgd&&!q.lk&&q.v!==false&&q.k!='group');if(!a.length)return false;lySetSel(a.map(q=>q.u));upd();return true},()=>lyP().some(q=>!q.bgd&&!q.lk));
 KW('edit.deselect','Deselect','select none clear selection',()=>{lySetSel([]);upd();return true})}
function init32(){lyCmds();
 window.lyInkOn=1;
 // Behind and Cancel make no sense on one element; Replace (2.73.0) works against the elements below it
 ['behind','cancel'].forEach(v=>{const o=$('ly_bl').querySelector(`option[value="${v}"]`);if(o)o.remove()});
 mkWell($('wl_ra'),{label:'Replace colour A',what:'Replace',def:'Element ink',defRef:()=>WBS.proj.ink,get:()=>{const q=lySel().find(x=>x.bl=='replace');return q&&q.ra||''},set:v=>{lySel().forEach(q=>{if(q.bl!='replace')return;if(v)q.ra=v;else delete q.ra});lyDone()}});
 mkWell($('wl_rp'),{label:'Replace colour B',what:'Replace',def:'Paper',defRef:()=>WBS.proj.bg,get:()=>{const q=lySel().find(x=>x.bl=='replace');return q&&q.rp||''},set:v=>{lySel().forEach(q=>{if(q.bl!='replace')return;if(v)q.rp=v;else delete q.rp});lyDone()}});
 $('ly_rm').addEventListener('input',()=>{if(lySync||WBS.fpSyncing)return;const v=+$('ly_rm').value;lySel().forEach(q=>{if(q.bl=='replace'){if(v==25)delete q.rm;else q.rm=v}});lyDone()});
 const host=$('lyl2');
 host.onclick=e=>{const r=e.target.closest('[data-u]');if(!r||e.target.closest('input'))return;const u=r.dataset.u,a=lyP(),q=lyBy(a,u);if(!q)return;
  if(e.target.closest('[data-eye]')){if(q.v===false)delete q.v;else q.v=false;lyDone();return}
  if(e.target.closest('[data-unlk]')){e.stopPropagation();lyLock(u,false);return}
  {const fe=e.target.closest('[data-lfx]');if(fe){const L=q.fx||[],x=L.find(z=>String(z.u)===fe.dataset.lfx);if(!x)return;if(e.target.closest('[data-fxeye]')){x.on=x.on===false;lyDone();return}lySetSel([u]);if(q.k=='pattern')WBS.patSel=q.u;if(q.k=='paint')WBS.paSel=q.u;if(WBX.wbFxOpen)WBX.wbFxOpen(elKind(q),x.u);upd();return}}
  if(e.target.closest('[data-fxo]')){const k=String(u);if(lyFxO.has(k))lyFxO.delete(k);else lyFxO.add(k);renderLayers();return}
  if(e.target.closest('[data-fold]')){if(lyFold.has(String(u)))lyFold.delete(String(u));else lyFold.add(String(u));renderLayers();return}
  {const mb=e.target.closest('[data-more]');if(mb){e.stopPropagation();rowMenu(mb,[['Rename',()=>{lyRen=u;upd()}],['Duplicate',()=>lyDup(u)],['Move up',()=>lyMove(u,1)],['Move down',()=>lyMove(u,-1)],[q.lk?'Unlock':'Lock',()=>lyLock(u,!q.lk)],lyIsG(q)?['Ungroup',()=>{lySetSel([u]);lyUngroup()}]:null,['Delete',()=>lyRemove(u)]].filter(Boolean));return}}
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
 cmdRegister({id:'element.group',label:'Group the selected elements',shortcut:'Mod+G',elId:'lygrp',enabled:()=>!$('lygrp').disabled,run:()=>lyGroup()});
 cmdRegister({id:'element.ungroup',label:'Ungroup',shortcut:'Mod+Shift+G',elId:'lyung',enabled:()=>!$('lyung').disabled,run:()=>lyUngroup()});
 document.addEventListener('keydown',e=>{const t=e.target;if(t.matches&&t.matches('input,select,textarea'))return;if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()=='g'){e.preventDefault();if(e.shiftKey){if(!$('lyung').disabled)lyUngroup()}else if(!$('lygrp').disabled)lyGroup()}});   // Photoshop's: Ctrl+G groups, Ctrl+Shift+G ungroups (2.27.0; it was Shift+G)
 $('ly_bl').onchange=()=>{const v=$('ly_bl').value;lySel().forEach(q=>{if(v)q.bl=v;else delete q.bl});lyDone()};
 $('ly_op').addEventListener('input',()=>{if(lySync||WBS.fpSyncing)return;const v=+$('ly_op').value,s=lySel();if(!s.length)return;let ch=false;s.forEach(q=>{const o=q.op==null?100:q.op;if(o!==v){ch=true;if(v<100)q.op=v;else delete q.op}});if(ch){store();upd()}});
}
// Ctrl/Cmd+D on the canvas: duplicate the selected element (the last one when several are selected)
function lyDupSel(){const s=lySel();if(!s.length)return false;lyDup(s[s.length-1].u);return true}
export {lyInkFill,renderLayers,init32,lyDupSel};
