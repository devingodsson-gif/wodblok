import {$,WBS,WBX} from './01-launch-and-version.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL} from './24-free-place-layers.js';
import {stUnlocked} from './63-stamp-tool.js';
import {elDef,elKind,elSel} from './65-element-core.js';
import {plDisarm} from './72-placing.js';

// ===== One list at the top of every element panel (2.6.0, owner Oct 21 2026). Each kind's panel (Text, Shape, Pattern, Motif, Stamp) starts with the list of the elements of
// that kind on the selected layer, and every kind an Add button that makes a new one, selects it and shows its properties just below. Picking a row selects that element,
// and the panel below shows its properties. The Elements list does the same the other way: picking an element there (or on the canvas) opens its kind's panel (elSync in 65).
// Motifs and Stamps are also placed from their libraries (pick, then click the canvas); Add puts one in the middle. While a stamp is being edited in its tab the lists are hidden.
const ELK={text:{pn:'text',add:'Add text'},shape:{pn:'mlist',add:'Add shape'},pattern:{pn:'layers',add:'Add pattern'},motif:{pn:'motifs',add:'Add motif'},stamp:{pn:'stmp',add:'Add stamp'}};
const elkHx=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const elkName=(k,q)=>{if(q.nm)return String(q.nm);const d=elDef(k);return(d&&d.name&&String(d.name(q)||''))||(d&&d.label)||'Element'};
const elkIc=k=>{const d=elDef(k);return`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${(d&&d.icon)||''}</svg>`};
function elkItems(k){const L=fpL();return L?(L.pl||[]).filter(q=>elKind(q)==k).reverse():[]}   // the top of the list first, as in the Elements list
function elkSync(){const un=stUnlocked()!=null,s=elSel(),su=s?String(s.u):'';
 {const ab=document.querySelector('.elk[data-k="stamp"] [data-add]');if(ab){const none=!WBS.tiles.length;if(ab.disabled!==none)ab.disabled=none}}   // no stamp yet: nothing to add
 {const ed=$('smkedit');if(ed){const none=!WBS.tiles.length;if(ed.disabled!==none)ed.disabled=none}}
 document.querySelectorAll('section.pn[data-p=stmp] .stonly').forEach(d=>{if(d.hidden===un)d.hidden=!un});   // Block, Block edge and Symmetry belong to a stamp tab (2.13.0)
 Object.keys(ELK).forEach(k=>{const box=document.querySelector(`.elk[data-k="${k}"]`);if(!box)return;const keep=un&&(k=='motif'||k=='text');box.hidden=un&&!keep;if(un){if(keep){const h=box.querySelector('.lyl2');if(!h.hidden)h.hidden=true;h.dataset.k=''}return}const a=elkItems(k),host=box.querySelector('.lyl2'),
  key=JSON.stringify([a.map(q=>[q.u,elkName(k,q)]),su]);if(host.dataset.k===key)return;host.dataset.k=key;
  host.innerHTML=a.map(q=>`<div class="lyr${String(q.u)===su?' on':''}" data-u="${elkHx(q.u)}"><span class="gmi">${elkIc(k)}</span><span class="lyn">${elkHx(elkName(k,q))}</span></div>`).join('');
  host.hidden=!a.length})}
function elkPick(k,u){const q=elkItems(k).find(x=>String(x.u)===String(u));if(!q)return;plDisarm();if(WBX.wbPenStop)WBX.wbPenStop();
 WBS.fpMS=new Set([String(q.u)]);WBS.fpSel=String(q.u);WBS.fpAnc=String(q.u);WBS.fpB=null;WBS.fpGhost=null;if(k=='pattern')WBS.patSel=q.u;upd()}
function elkAdd(k){plDisarm();if(WBX.wbPenStop)WBX.wbPenStop();
 if(k=='shape'){if(WBX.wbShapeNew)WBX.wbShapeNew('rect');return}
 if(WBX.wbAbAdd)WBX.wbAbAdd(k)}
function init78(){
 Object.keys(ELK).forEach(k=>{const o=ELK[k],sec=document.querySelector(`section.pn[data-p="${o.pn}"]`);if(!sec||sec.querySelector('.elk[data-k]'))return;
  const html=`<div class="elk" data-k="${k}"><div class="lyl2" hidden></div>${o.add?`<div class="row"><button type="button" class="alt" data-add>${o.add}</button></div>`:''}</div>`,at=k=='stamp'?sec.querySelector('details.g'):null;   // the Stamp panel: Create New Stamp, the stamps, then Add stamp under them (2.13.0)
  if(at)at.insertAdjacentHTML('afterend',html);else sec.insertAdjacentHTML('afterbegin',html);
  const box=sec.querySelector('.elk[data-k]');box.onclick=e=>{const r=e.target.closest('[data-u]');if(r){elkPick(k,r.dataset.u);return}if(e.target.closest('[data-add]'))elkAdd(k)}});
 WBX.wbElkSync=elkSync}
export {init78};
