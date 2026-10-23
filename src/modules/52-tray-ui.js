import {ICN} from './00-icons.js';
import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {C,CM,PL,col,placeFloat,rowMenu} from './04-canvas-and-stamp-outlines.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {QS} from './12-selection-and-split.js';
import {LY} from './14-presets-and-layer-grid-ui.js';
import {newId,pmsg} from './18-projects-and-cover-overlay.js';
import {TRAY_MAX,TRAY_VIEW,cwAdd,cwNow,cwUse,hexAlpha,isFixed,isLink,lockRef,normHexA,refSlot,slotHex,slotName,trayAdd,trayDone,trayLoad,trayMove,trayRemove,traySet,trayUses,unlockRef} from './50-tray-core.js';
import {closePicker,openPicker,swBg} from './51-colour-picker.js';
// ===== The tray on screen =====
// 1. The dock: the tray's colours above the canvas in both views (7 places, "+" to add more, up to 16). Click a colour to edit it; drag
//    one along the tray to move it. With more than one colourway, a switcher sits next to it.
// 2. Colour wells: everywhere a colour is chosen (paper, ink, a stamp, a layer, the Replace colour, a text). A lock beside each one:
//    open = follows a tray colour, closed = a fixed colour of its own. The well opens the tray to choose from.
// 3. The Colours tool: the tray as a list (name, hex, what uses it), paper and ink, and saved trays in folders (Wada's sets built in).
const TY_IC=(d,w)=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const LOCK_ON=TY_IC(ICN.lock),LOCK_OFF=TY_IC(ICN.unlock);
const TRASH=TY_IC(ICN.trash),TY_MORE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.more+'</svg>';
const TY_CHEV='<svg class="chev" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l5 5 5-5"/></svg>';
const FOLDER=TY_IC(ICN.folder,1.8),BACK=TY_IC(ICN.chevL);
const tyEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tyP=()=>WBS.proj;
// the label a well shows for a reference, and the small number of its tray place
const hexText=h=>h.slice(0,7).toUpperCase()+(hexAlpha(h)<1?' · '+Math.round(hexAlpha(h)*100)+'%':'');
const wellText=r=>{if(!r)return'';if(isLink(r)){const id=r.slice(1);return slotName(id)||hexText(slotHex(id))}return hexText(col(r))};
// the colours the picker offers in its "Saved colours" dropdown: every colour in your saved trays, then Wada's colours
function tySaved(){const seen=new Set(),own=[];stLoad().t.forEach(t=>t.c.forEach(([h,n])=>{const k=h+'|'+n;if(seen.has(k))return;seen.add(k);own.push({n:n||h.slice(0,7).toUpperCase(),h,t:t.n})}));
 return[...(WBX.scList?WBX.scList():[]),{g:'Your trays',items:own},{g:'Wada colours',items:C.map(([n,h])=>({n,h:normHexA(h)||h}))}].filter(g=>g.items.length)}
// ---------------------------------------------------------------- picker for one tray slot
function editSlot(id,anchor){const o=tyP();if(!o.ts.includes(id))return;
 openPicker(anchor,{value:slotHex(id),alpha:true,name:slotName(id),namePh:slotHex(id).toUpperCase(),saved:tySaved,
  onPick:(h,n)=>{traySet(id,h,null);const w=cwNow();if(n)w.m[id]=n.slice(0,40);else delete w.m[id];WBS.trayEdit=id;trayDone('Tray colour');upd();paintAll()},
  onName:n=>{const w=cwNow();if(n)w.m[id]=n.slice(0,40);else delete w.m[id];trayDone('Renamed tray colour')},
  onInput:h=>{traySet(id,h,null);WBS.trayEdit=id;upd();paintAll()},
  onChange:()=>{trayDone('Tray colour')},
  onClose:()=>{WBS.trayEdit=null;paintAll(true)},
  actions:o.ts.length>1?[['Remove from the tray',TRASH,()=>removeSlot(id)]]:[]});
 WBS.trayEdit=id;paintAll(true)}
// removing a slot that is in use: the first press says how many things will keep their colour as a fixed colour; the second removes it
let rmAsk=null;
function removeSlot(id){const n=trayUses(id).length;if(n&&rmAsk!==id){rmAsk=id;setTimeout(()=>{if(rmAsk===id)rmAsk=null},4000);pmsg(`Used by ${n} element${n>1?'s':''}. Remove again to take it out of the tray.`);return}
 rmAsk=null;closePicker();const k=trayRemove(id);trayDone('Removed tray colour');pmsg(k?`Removed from the tray. ${k} thing${k>1?'s':''} kept the colour as a fixed colour.`:'Removed from the tray.')}
function addSlot(anchorFn){const o=tyP();if(o.ts.length>=TRAY_MAX){pmsg(`The tray holds ${TRAY_MAX} colours.`);return}
 const last=slotHex(o.ts[o.ts.length-1]),id=trayAdd(last.slice(0,7),'');trayDone('Added tray colour');paintAll(true);
 requestAnimationFrame(()=>{const a=anchorFn&&anchorFn(id);if(a)editSlot(id,a)})}
// ---------------------------------------------------------------- 1. the dock
let dockK='';
function paintDock(force){const o=tyP(),w=cwNow(o),box=$('tyc');if(!box)return;
 const used=new Set();refsUsed().forEach(id=>used.add(id));
 const k=JSON.stringify([o.ts,o.ts.map(id=>w.c[id]),[...used],WBS.trayEdit,o.cw.length,o.cwa,w.n]);if(!force&&k===dockK)return;dockK=k;
 let h=o.ts.map((id,i)=>{const c=w.c[id],nm=w.m[id];return`<button type="button" class="tys${WBS.trayEdit===id?' on':''}${used.has(id)?' used':''}${hexAlpha(c)<1?' see':''}" data-s="${id}" role="listitem" aria-label="Colour ${i+1}${nm?': '+tyEsc(nm):''}" style="--c:${c}">${hexAlpha(c)<1?'<b></b>':''}</button>`}).join('');
 for(let i=o.ts.length;i<TRAY_VIEW;i++)h+=`<button type="button" class="tye" data-add="1" aria-label="Add a colour"></button>`;
 if(o.ts.length<TRAY_MAX)h+=`<button type="button" class="tyadd" data-add="1" aria-label="Add a colour">${TY_IC(ICN.plus,2.2)}</button>`;
 box.innerHTML=h;
 const cw=$('tycw');cw.hidden=o.cw.length<2;if(!cw.hidden){cw.querySelector('span').textContent=w.n;cw.querySelector('i').style.background=`linear-gradient(90deg,${o.ts.slice(0,4).map((id,i,a)=>`${w.c[id]} ${i/a.length*100}% ${(i+1)/a.length*100}%`).join(',')})`;cw.setAttribute('aria-label','Colourway: '+w.n)}}
// which slots something links to
function refsUsed(){const o=tyP(),s=new Set(),a=r=>{if(isLink(r))s.add(r.slice(1))};a(o.bg);a(o.ink);WBS.tiles.forEach(t=>a(t.ink));WBS.layers.forEach(L=>{a(L.ink);a(L.rp);(L.pl||[]).forEach(q=>{if(q){a(q.ink);a(q.sk)}})});
 // stamps without their own ink use the default ink
 return s}
function dockEvents(){const box=$('tyc');let dr=null;
 box.addEventListener('pointerdown',e=>{const b=e.target.closest('.tys');if(!b||e.button)return;dr={b,id:b.dataset.s,x:e.clientX,moved:false,pid:e.pointerId}});
 box.addEventListener('pointermove',e=>{if(!dr||e.pointerId!==dr.pid)return;if(!dr.moved&&Math.abs(e.clientX-dr.x)<5)return;
  if(!dr.moved){dr.moved=true;box.setPointerCapture(e.pointerId);dr.b.classList.add('drag');closePicker()}
  dr.b.style.transform=`translateX(${e.clientX-dr.x}px)`;const cells=[...box.querySelectorAll('.tys')];let to=cells.length-1;for(let i=0;i<cells.length;i++){const r=cells[i].getBoundingClientRect();if(e.clientX<r.left+r.width/2){to=i;break}}
  cells.forEach(c=>c.classList.remove('dropb'));const tgt=cells[to];if(tgt&&tgt!==dr.b)tgt.classList.add('dropb');dr.to=to});
 const end=e=>{if(!dr)return;const d=dr;dr=null;box.querySelectorAll('.dropb').forEach(c=>c.classList.remove('dropb'));
  if(d.moved){d.b.classList.remove('drag');d.b.style.transform='';const from=tyP().ts.indexOf(d.id);let to=d.to==null?from:d.to;if(to>from)to--;if(to!==from&&to>=0){trayMove(d.id,to);trayDone('Moved tray colour')}else paintDock(true);return}
  if(e.type=='pointerup'){if(WBX.wbPicker.isOpen()&&WBX.wbPicker.anchor()===d.b){closePicker();return}editSlot(d.id,d.b)}};
 box.addEventListener('pointerup',end);box.addEventListener('pointercancel',end);
 box.addEventListener('keydown',e=>{const b=e.target.closest('.tys');if(b&&(e.key=='Enter'||e.key==' ')){e.preventDefault();editSlot(b.dataset.s,b)}});
 box.addEventListener('click',e=>{const a=e.target.closest('[data-add]');if(a)addSlot(id=>box.querySelector(`[data-s="${id}"]`))});
 $('tycw').addEventListener('click',e=>{e.stopPropagation();const o=tyP(),btn=$('tycw');
  rowMenu(btn,[...o.cw.map((w,i)=>[`<i class="cwsw" style="background:linear-gradient(90deg,${o.ts.slice(0,4).map((id,j,a)=>`${w.c[id]} ${j/a.length*100}% ${(j+1)/a.length*100}%`).join(',')})"></i>${i==o.cwa?'<b>'+tyEsc(w.n)+'</b>':tyEsc(w.n)}`,()=>{if(i!==o.cwa){cwUse(i);trayDone('Colourway “'+w.n+'”')}}]),['Colourways…',()=>{const r=$('rail-cways');if(r&&!r.classList.contains('on'))r.click()}]])})}
// ---------------------------------------------------------------- 2. colour wells
// spec: {get():ref, set(ref), def: label for "no colour of its own" (then '' is allowed), defRef():ref it shows when empty, what: words for history}
const WELLS=[];
function mkWell(host,spec){if(!host)return null;host.classList.add('cwl');
 host.innerHTML=`<button type="button" class="cwlk" aria-pressed="false">${LOCK_OFF}</button><button type="button" class="cwsb" aria-haspopup="dialog" aria-expanded="false"><i></i><span></span><em></em>${TY_CHEV}</button>`;
 const lk=host.firstChild,sb=host.lastChild,W={host,spec,lk,sb,k:''};WELLS.push(W);
 lk.onclick=()=>{const r=spec.get();if(!r)return;if(isLink(r)){spec.set(lockRef(r));trayDone('Locked '+spec.what+' colour');return}
  const u=unlockRef(r);if(u){spec.set(u);trayDone('Unlocked '+spec.what+' colour');return}openWell(W)};
 sb.onclick=e=>{e.stopPropagation();if(WP&&WP.W===W){closeWell();return}openWell(W)};
 paintWell(W,true);return W}
const shown=el=>{const sc=el.closest('section.pn');return!sc||!sc.hidden};
function paintWell(W,force){if(!W.host.isConnected||(!force&&!shown(W.host)))return;const r=W.spec.get(),show=r||(W.spec.defRef&&W.spec.defRef())||'',def=!r&&W.spec.def;
 const k=[r,col(show),wellText(show),isLink(show)?tyP().ts.indexOf(show.slice(1)):-1,def,def&&W.spec.defSwatch?W.spec.defSwatch():''].join('|');if(!force&&k===W.k)return;W.k=k;
 const i=W.sb.querySelector('i'),sp=W.sb.querySelector('span'),em=W.sb.querySelector('em');
 const ds=def&&W.spec.defSwatch?W.spec.defSwatch():'';i.style.background=ds||(show?swBg(col(show)):'transparent');i.classList.toggle('none',!show&&!ds);
 sp.textContent=def?W.spec.def:wellText(show);
 const n=isLink(r)?tyP().ts.indexOf(r.slice(1))+1:0;em.textContent=n?String(n):'';em.hidden=!n;
 const fixed=isFixed(r);W.lk.innerHTML=fixed?LOCK_ON:LOCK_OFF;W.lk.setAttribute('aria-pressed',String(fixed));W.lk.disabled=!r;
 W.lk.setAttribute('aria-label',fixed?'Fixed colour':'Follows tray');W.lk.title=fixed?'Fixed colour':'Follows tray';
 W.host.classList.toggle('fixed',fixed);W.sb.setAttribute('aria-label',(W.spec.label||'Colour')+': '+(def?W.spec.def:wellText(show)))}
let WP=null;   // the open well popover
function closeWell(){if(!WP)return;WP.el.remove();WP.W.sb.setAttribute('aria-expanded','false');WP=null}
function openWell(W){closeWell();closePicker();const o=tyP(),w=cwNow(o),r=W.spec.get(),el=document.createElement('div');el.className='cwp';el.setAttribute('role','dialog');el.setAttribute('aria-label',W.spec.label||'Colour');
 const cur=isLink(r)?r.slice(1):null;
 let h='';if(W.spec.def){const ds=W.spec.defSwatch?W.spec.defSwatch():W.spec.defRef?swBg(col(W.spec.defRef())):'';h+=`<button type="button" class="cwpd${!r?' on':''}" data-def="1"><i${ds?` style="background:${ds};border-style:solid"`:''}></i><span>${tyEsc(W.spec.def)}</span></button>`}
 h+=`<div class="cwpg" role="list">${o.ts.map((id,i)=>`<button type="button" role="listitem" class="cwpc${id===cur?' on':''}" data-s="${id}" aria-label="Colour ${i+1}${w.m[id]?': '+tyEsc(w.m[id]):''}" title="${tyEsc(w.m[id]||w.c[id].toUpperCase())}" style="--c:${w.c[id]}"><em>${i+1}</em></button>`).join('')}${o.ts.length<TRAY_MAX?`<button type="button" class="cwpc add" data-add="1" aria-label="Add a colour to the tray">${TY_IC(ICN.plus,2.2)}</button>`:''}</div>`;
 h+=`<div class="cwpr"><button type="button" class="alt" data-fix="1">${LOCK_ON}Fixed colour</button>${isFixed(r)&&o.ts.length<TRAY_MAX?`<button type="button" class="alt" data-adopt="1">${TY_IC(ICN.plus)}Add to tray</button>`:''}</div>`;
 el.innerHTML=h;document.body.appendChild(el);placeFloat(el,W.sb,false);el.style.width='';WP={el,W};W.sb.setAttribute('aria-expanded','true');
 el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();
  if(b.dataset.def){W.spec.set('');closeWell();trayDone(W.spec.what+' colour');return}
  if(b.dataset.s){W.spec.set('@'+b.dataset.s);closeWell();trayDone(W.spec.what+' colour');return}
  if(b.dataset.add){const id=trayAdd(col(r||(W.spec.defRef&&W.spec.defRef())||o.ink).slice(0,7),'');if(!id)return;W.spec.set('@'+id);closeWell();trayDone('Added tray colour');paintAll(true);requestAnimationFrame(()=>{const c=$('tyc').querySelector(`[data-s="${id}"]`);editSlot(id,c||W.sb)});return}
  if(b.dataset.adopt){const h0=col(r),id=trayAdd(h0,'');if(!id)return;W.spec.set('@'+id);closeWell();trayDone('Added tray colour');return}
  if(b.dataset.fix){closeWell();const start=col(r||(W.spec.defRef&&W.spec.defRef())||o.ink);
   const set=h=>{const r0=W.spec.get(),s=refSlot(r0);W.spec.set(h+(s&&tyP().ts.includes(s)?'|'+s:''))};
   openPicker(W.sb,{value:start,alpha:true,saved:tySaved,onInput:h=>{set(h);upd();paintWells()},onChange:()=>trayDone('Fixed '+W.spec.what+' colour')})}});
 el.addEventListener('keydown',e=>{if(e.key=='Escape'){e.stopPropagation();const b=W.sb;closeWell();b.focus()}});
 const f=el.querySelector('.on')||el.querySelector('button');if(f)f.focus({preventScroll:true})}
function paintWells(force){WELLS.forEach(W=>paintWell(W,force))}
// ---------------------------------------------------------------- 3. the Colours tool: the tray as a list
function usesText(id){const u=trayUses(id),n={};u.forEach(x=>{n[x.k]=(n[x.k]||0)+1});const out=[];if(n.paper)out.push('Paper');if(n.ink)out.push('Ink');
 const pl=(k,a,b)=>{if(n[k])out.push(n[k]+' '+(n[k]>1?b:a))};pl('stamp','stamp','stamps');pl('shape','motif','motifs');pl('layer','layer','layers');pl('replace','replace','replaces');pl('text','text','texts');pl('element','element','elements');pl('outline','outline','outlines');return out.join(' · ')}
let listK='';
function paintList(force){const box=$('tyl');if(!box||!box.isConnected||(!force&&!shown(box)))return;const o=tyP(),w=cwNow(o);
 const k=JSON.stringify([o.ts,o.ts.map(id=>[w.c[id],w.m[id]]),o.bg,o.ink,WBS.tiles.map(t=>t.ink),WBS.layers.map(L=>[L.ink,L.rp,(L.pl||[]).map(q=>q&&[q.ink,q.sk])]),WBS.trayEdit]);if(!force&&k===listK)return;listK=k;
 box.innerHTML=o.ts.map((id,i)=>{const c=w.c[id],nm=w.m[id],u=usesText(id);return`<div class="tyr${WBS.trayEdit===id?' on':''}" data-s="${id}" role="listitem" tabindex="0"><span class="tyn">${i+1}</span><i style="background:${swBg(c)}"></i><span class="tyt"><b>${tyEsc(nm||c.slice(0,7).toUpperCase())}</b><small>${tyEsc([nm?c.slice(0,7).toUpperCase():'',hexAlpha(c)<1?Math.round(hexAlpha(c)*100)+'%':'',u].filter(Boolean).join(' · '))}</small></span><button type="button" class="ib" data-more aria-haspopup="menu" aria-expanded="false" aria-label="Actions for colour ${i+1}">${TY_MORE}</button></div>`}).join('');
 $('tycnt').textContent=o.ts.length+' of '+TRAY_MAX;$('tyaddl').disabled=o.ts.length>=TRAY_MAX}
function listEvents(){const box=$('tyl');
 box.addEventListener('click',e=>{const r=e.target.closest('.tyr');if(!r)return;const id=r.dataset.s,o=tyP(),i=o.ts.indexOf(id);
  if(e.target.closest('[data-more]')){e.stopPropagation();const b=e.target.closest('[data-more]');rowMenu(b,[
   ['Edit colour',()=>editSlot(id,r)],
   ['Move up',()=>{trayMove(id,i-1);trayDone('Moved tray colour')},i==0],
   ['Move down',()=>{trayMove(id,i+1);trayDone('Moved tray colour')},i==o.ts.length-1],
   ['Duplicate',()=>{const nid=trayAdd(slotHex(id),slotName(id),i+1);if(nid){tyP().cw.forEach(w=>{w.c[nid]=w.c[id];if(w.m[id])w.m[nid]=w.m[id]});trayDone('Duplicated tray colour')}},o.ts.length>=TRAY_MAX],
   ['Remove',()=>removeSlot(id),o.ts.length<=1]]);return}
  if(WBX.wbPicker.isOpen()&&WBX.wbPicker.anchor()===r){closePicker();return}editSlot(id,r)});
 box.addEventListener('keydown',e=>{const r=e.target.closest('.tyr');if(r&&e.target===r&&(e.key=='Enter'||e.key==' ')){e.preventDefault();editSlot(r.dataset.s,r)}});
 $('tyaddl').onclick=()=>addSlot(id=>$('tyl').querySelector(`[data-s="${id}"]`));
 $('tysave').onclick=()=>{$('tysvf').hidden=false;$('tysave').parentNode.hidden=true;const o=tyP(),w=cwNow(o);$('tysvn').value=o.cw.length>1?w.n:'';$('tysvn').focus()};
 const done=ok=>{if(ok){const n=$('tysvn').value.trim().slice(0,40)||'Tray '+(stLoad().t.length+1),o=tyP(),w=cwNow(o),d=stLoad();d.t.unshift({id:newId(),n,f:ST.f&&!ST.f.startsWith('wada')?ST.f:'',c:o.ts.map(id=>[w.c[id],w.m[id]||''])});stStore(d);pmsg('Saved tray “'+n+'”.');paintST(true)}$('tysvf').hidden=true;$('tysave').parentNode.hidden=false};
 $('tysvok').onclick=()=>done(true);$('tysvcx').onclick=()=>done(false);
 $('tysvn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter')done(true);else if(e.key=='Escape')done(false)})}
// ---------------------------------------------------------------- 3b. saved trays: your own in folders (settings), and Wada's sets built in
const ST_KEY='wb200_trays';
const ST={f:'',q:'',ren:null};   // the folder open ('' = the top), the search words, the tray or folder being renamed
function stLoad(){let d=null;try{d=JSON.parse(kv.get(ST_KEY)||'null')}catch(e){}
 if(!d||typeof d!='object'||!Array.isArray(d.t)){d={f:[],t:[]};
  try{kv.set(ST_KEY,JSON.stringify(d))}catch(e){}}
 d.f=(Array.isArray(d.f)?d.f:[]).filter(f=>f&&typeof f.id=='string'&&typeof f.n=='string');
 d.t=d.t.filter(t=>t&&typeof t.id=='string'&&typeof t.n=='string'&&Array.isArray(t.c)).map(t=>({...t,c:t.c.map(x=>Array.isArray(x)?[normHexA(x[0]),String(x[1]||'')]:null).filter(x=>x&&x[0]).slice(0,TRAY_MAX)})).filter(t=>t.c.length);
 return d}
const stStore=d=>{try{kv.set(ST_KEY,JSON.stringify(d))}catch(e){pmsg('Could not keep the trays in this browser.')}};
// Wada's 348 combinations, paper first, as saved trays in three folders by size
let WADA=null;
function wada(){if(WADA)return WADA;WADA=PL.map((p,i)=>({id:'wada'+i,n:p[0],no:i+1,f:'wada'+[p[1],p[2],p[3],p[4]].filter(Boolean).length,c:[p[2],p[1],p[3],p[4]].filter(Boolean).map(n=>[CM[n],n])}));return WADA}
const WF=[['wada2','Wada · 2 colours'],['wada3','Wada · 3 colours'],['wada4','Wada · 4 colours']];
const tyStrip=c=>`<span class="sts">${c.map(([h])=>`<i style="background:${h}"></i>`).join('')}</span>`;
let stK='';
function paintST(force){const box=$('stl');if(!box||!box.isConnected)return;const d=stLoad(),W=wada(),q=ST.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const k=JSON.stringify([d,ST]);if(!force&&k===stK)return;stK=k;
 const row=(t,own)=>ST.ren===t.id?`<div class="str ren" data-t="${t.id}">${tyStrip(t.c)}<input type="text" maxlength="40" value="${tyEsc(t.n)}" aria-label="Tray name"></div>`:`<div class="str" data-t="${t.id}" role="listitem" tabindex="0">${tyStrip(t.c)}<b>${tyEsc(t.n)}</b>${t.no?`<small>No. ${t.no}</small>`:''}<button type="button" class="ib" data-more aria-haspopup="menu" aria-expanded="false" aria-label="Actions for ${tyEsc(t.n)}">${TY_MORE}</button></div>`;
 const frow=(id,n,c,own)=>ST.ren===id?`<div class="stf ren" data-f="${id}">${FOLDER}<input type="text" maxlength="40" value="${tyEsc(n)}" aria-label="Folder name"></div>`:`<div class="stf" data-f="${id}" role="listitem" tabindex="0">${FOLDER}<b>${tyEsc(n)}</b><small>${c}</small>${own?`<button type="button" class="ib" data-more aria-haspopup="menu" aria-expanded="false" aria-label="Actions for ${tyEsc(n)}">${TY_MORE}</button>`:''}</div>`;
 let h='',nav='';
 if(q.length){const hay=t=>(t.n+' '+t.c.map(x=>x[1]).join(' ')+(t.no?' no '+t.no+' no. '+t.no+' no.'+t.no:'')).toLowerCase();const hit=[...d.t,...W].filter(t=>q.every(w=>hay(t).includes(w)));
  h=hit.slice(0,200).map(t=>row(t,!t.no)).join('')||'<div class="stno">No matching tray</div>';$('stcnt').textContent=hit.length+' found'}
 else if(!ST.f){h=d.f.map(f=>frow(f.id,f.n,d.t.filter(t=>t.f===f.id).length,true)).join('')+d.t.filter(t=>!t.f||!d.f.some(f=>f.id===t.f)).map(t=>row(t,true)).join('')+WF.map(([id,n])=>frow(id,n,W.filter(t=>t.f===id).length,false)).join('');$('stcnt').textContent=String(d.t.length+W.length)}
 else{const wf=WF.find(x=>x[0]===ST.f),uf=d.f.find(f=>f.id===ST.f);if(!wf&&!uf){ST.f='';return paintST(true)}
  nav=`<button type="button" class="ib" data-up aria-label="Back to all trays">${BACK}</button><b>${tyEsc(wf?wf[1]:uf.n)}</b>`;
  h=(wf?W.filter(t=>t.f===ST.f):d.t.filter(t=>t.f===ST.f)).map(t=>row(t,!wf)).join('')||'<div class="stno">Empty folder</div>';$('stcnt').textContent=''}
 $('stnav').innerHTML=nav;$('stnav').hidden=!nav;box.innerHTML=h;$('stnew').disabled=!!(ST.f||q.length);
 const ri=box.querySelector('.ren input');if(ri){ri.focus();ri.select()}}
function stFind(id){return stLoad().t.find(t=>t.id===id)||wada().find(t=>t.id===id)}
function stUse(t){trayLoad(t.c);trayDone('Tray “'+t.n+'”');pmsg('Loaded “'+t.n+'” into the tray.')}
function stAsCw(t){const i=cwAdd();cwUse(i);const w=cwNow();w.n=t.n.slice(0,40);trayLoad(t.c);trayDone('New colourway “'+t.n+'”');pmsg('Added the colourway “'+t.n+'”.')}
function stEvents(){const box=$('stl');
 box.addEventListener('click',e=>{if(e.target.closest('input'))return;const f=e.target.closest('.stf'),r=e.target.closest('.str'),more=e.target.closest('[data-more]');
  if(f&&!more){ST.f=f.dataset.f;paintST(true);return}
  if(more)e.stopPropagation();
  if(f&&more){const id=f.dataset.f;rowMenu(more,[['Rename',()=>{ST.ren=id;paintST(true)}],['Delete folder',()=>{const d=stLoad();d.f=d.f.filter(x=>x.id!==id);d.t.forEach(t=>{if(t.f===id)t.f=''});stStore(d);paintST(true);pmsg('Deleted the folder. Its trays moved to the top.')}]]);return}
  if(!r)return;const t=stFind(r.dataset.t);if(!t)return;
  if(more){const own=!t.no,d=stLoad(),items=[['Load into the tray',()=>stUse(t)],['Add as a colourway',()=>stAsCw(t)]];
   if(own){items.push(['Rename',()=>{ST.ren=t.id;paintST(true)}]);if(d.f.length)d.f.filter(x=>x.id!==t.f).forEach(x=>items.push(['Move to “'+tyEsc(x.n)+'”',()=>{const d2=stLoad(),y=d2.t.find(z=>z.id===t.id);if(y){y.f=x.id;stStore(d2);paintST(true)}}]));if(t.f)items.push(['Move to the top',()=>{const d2=stLoad(),y=d2.t.find(z=>z.id===t.id);if(y){y.f='';stStore(d2);paintST(true)}}]);items.push(['Delete',()=>{const d2=stLoad();d2.t=d2.t.filter(z=>z.id!==t.id);stStore(d2);paintST(true)}])}
   else items.push(['Copy to your trays',()=>{const d2=stLoad();d2.t.unshift({id:newId(),n:t.n,f:'',c:t.c.map(x=>[...x])});stStore(d2);paintST(true);pmsg('Copied “'+t.n+'” to your trays.')}]);
   rowMenu(more,items);return}
  stUse(t)});
 box.addEventListener('keydown',e=>{const r=e.target;if(r.classList&&(r.classList.contains('str')||r.classList.contains('stf'))&&(e.key=='Enter'||e.key==' ')){e.preventDefault();r.click()}
  if(r.matches&&r.matches('.ren input')){e.stopPropagation();if(e.key=='Enter')r.blur();else if(e.key=='Escape'){ST.ren=null;paintST(true)}}});
 box.addEventListener('focusout',e=>{const i=e.target;if(!i.matches||!i.matches('.ren input')||!ST.ren)return;const v=i.value.trim().slice(0,40),id=ST.ren;ST.ren=null;if(v){const d=stLoad(),t=d.t.find(x=>x.id===id),f=d.f.find(x=>x.id===id);if(t)t.n=v;if(f)f.n=v;stStore(d)}paintST(true)});
 $('stnav').addEventListener('click',e=>{if(e.target.closest('[data-up]')){ST.f='';paintST(true)}});
 $('stq').addEventListener('keydown',e=>e.stopPropagation());$('stq').addEventListener('input',()=>{ST.q=$('stq').value;paintST(true)});
 $('stnew').onclick=()=>{const d=stLoad(),id=newId();let n='New folder',k=2;while(d.f.some(f=>f.n===n))n='New folder '+(k++);d.f.push({id,n});stStore(d);ST.ren=id;paintST(true)}}
// ---------------------------------------------------------------- painting everything that shows the tray
function paintAll(force){paintDock(force);paintList(force);paintWells(force)}
// the wells for the stamp, layer and text depend on what is selected; their specs read it each time
function init52(){
 dockEvents();listEvents();stEvents();
 const o=()=>tyP();
 mkWell($('wl_pi'),{label:'Ink',what:'Ink',get:()=>o().ink,set:v=>{o().ink=v||o().ink}});
 mkWell($('wl_st'),{label:'Stamp ink',what:'Stamp ink',def:'Ink',defRef:()=>o().ink,get:()=>{const t=WBS.tiles[WBS.cur];return t&&t.ink||''},set:v=>{const t=WBS.tiles[WBS.cur];if(!t)return;if(v)t.ink=v;else delete t.ink}});
 mkWell($('wl_sh'),{label:'Motif colour',what:'Motif',def:'Stamp ink',defRef:()=>{const t=WBS.tiles[WBS.cur];return t&&t.ink||o().ink},get:()=>{const m=WBX.wbMtSel&&WBX.wbMtSel();if(m)return m.ink||'';const q=QS()[0];return q&&q.ic||''},set:v=>{const m=WBX.wbMtSel&&WBX.wbMtSel();if(m){if(v)m.ink=v;else delete m.ink;return}QS().forEach(q=>{if(v)q.ic=v;else delete q.ic})}});
 mkWell($('wl_ly'),{label:'Layer ink',what:'Layer ink',def:'Stamp colours',defSwatch:()=>`linear-gradient(135deg,${col(o().ink)} 50%,${col(o().bg)} 50%)`,get:()=>{const L=LY();return L&&L.ink||''},set:v=>{const L=LY();if(!L)return;if(v)L.ink=v;else delete L.ink}});
 mkWell($('wl_rp'),{label:'Replace colour',what:'Replace',defRef:()=>o().ink,get:()=>{const L=LY();return L&&L.rp||o().ink},set:v=>{const L=LY();if(L&&v)L.rp=v}});
 {const prev=WBX.wbTrayPaint;WBX.wbTrayPaint=f=>{if(prev)prev(f);paintAll(f);paintST(f)}}   // earlier tools (Export recipes) listen too
 WBX.wbTraySync=()=>paintAll(false);
 WBX.wbMkWell=mkWell;WBX.wbPaintWells=paintWells;
 document.addEventListener('pointerdown',e=>{if(WP&&!WP.el.contains(e.target)&&!WP.W.sb.contains(e.target))closeWell()},true);
 addEventListener('scroll',e=>{if(WP&&!(e.target.closest&&e.target.closest('.cwp')))closeWell()},true);
 // the saved trays list is drawn when the Colours tool opens
 // wells in a panel that was hidden are brought up to date when it opens
 {const mo=new MutationObserver(()=>paintWells(false));document.querySelectorAll('section.pn').forEach(sc=>{if(sc.querySelector('.cwl'))mo.observe(sc,{attributes:true,attributeFilter:['hidden']})})}
 const sec=document.querySelector('section.pn[data-p="colors"]');new MutationObserver(()=>{if(!sec.hidden){paintList(true);paintST(false)}}).observe(sec,{attributes:true,attributeFilter:['hidden']});
 paintAll(true)}
export {init52,mkWell,paintDock,paintWell,paintWells};
