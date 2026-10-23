import {$,WBS,WBX} from './01-launch-and-version.js';
import {stUnlocked} from './63-stamp-tool.js';
import {plDisarm} from './72-placing.js';
import {elKind,elSel} from './65-element-core.js';

// ===== An Add button at the top of every element panel (2.6.0). 2.19.0 (owner Oct 22 2026): the per-kind lists are gone; the Elements panel is the only list. Add makes a new element of the kind,
// selects it and shows its properties just below. Motifs and Stamps are also placed from their libraries. While a stamp is being edited in its tab only Motif and Text keep their Add.
const ELK={text:{pn:'text',add:'Add text'},pattern:{pn:'layers',add:'Add pattern'},motif:{pn:'motifs',add:'Add motif'},stamp:{pn:'stmp',add:'Add stamp'}};
// One Element group (Size, Rotate, Position, Flip, Duplicate, Order, Delete) for every kind (2.19.0): it sits at the top of the panel of the kind that is selected (a Motif's, a Text's, a placed Stamp's).
// A Pattern keeps its own grid controls. One set of controls, so one set of ids: the group moves, it is not copied.
const ELG_PN={motif:'motifs',text:'text',stamp:'stmp'};
function elgPlace(){const g=document.querySelector('details.g:has(>.gb>#lfree)');if(!g)return;const q=elSel(),pn=q&&ELG_PN[elKind(q)];if(!pn)return;
 const sec=document.querySelector(`section.pn[data-p="${pn}"]`);if(!sec||g.parentElement===sec)return;const at=sec.querySelector('.elk[data-k]');if(at)at.insertAdjacentElement('afterend',g);else sec.insertAdjacentElement('afterbegin',g);
 const al=document.getElementById('lalsec');if(al)g.insertAdjacentElement('afterend',al)}   // Align sits right under the element's own group (2.22.0)
function elkSync(){const un=stUnlocked()!=null;elgPlace();if(WBX.wbSlSync)WBX.wbSlSync();
 {const ab=document.querySelector('.elk[data-k="stamp"] [data-add]');if(ab){const none=!WBS.tiles.length;if(ab.disabled!==none)ab.disabled=none}}   // no stamp yet: nothing to add
 {const ed=$('smkedit');if(ed){const none=!WBS.tiles.length;if(ed.disabled!==none)ed.disabled=none}}
 document.querySelectorAll('section.pn[data-p=stmp] .stonly').forEach(d=>{if(d.hidden===un)d.hidden=!un});   // Block, Block edge and Symmetry belong to a stamp tab (2.13.0)
 Object.keys(ELK).forEach(k=>{const box=document.querySelector(`.elk[data-k="${k}"]`);if(!box)return;const keep=un&&(k=='motif'||k=='text');box.hidden=un&&!keep})}
function elkAdd(k){plDisarm();
 if(WBX.wbAbAdd)WBX.wbAbAdd(k)}
function init78(){
 Object.keys(ELK).forEach(k=>{const o=ELK[k],sec=document.querySelector(`section.pn[data-p="${o.pn}"]`);if(!sec||sec.querySelector('.elk[data-k]'))return;
  const html=`<div class="elk" data-k="${k}">${o.add?`<div class="row"><button type="button" class="alt" data-add>${o.add}</button></div>`:''}</div>`,at=k=='stamp'?sec.querySelector('details.g'):null;   // the Stamp panel: Create New Stamp, the stamps, then Add stamp under them (2.13.0)
  if(at)at.insertAdjacentHTML('afterend',html);else sec.insertAdjacentHTML('afterbegin',html);
  const box=sec.querySelector('.elk[data-k]');box.onclick=e=>{if(e.target.closest('[data-add]'))elkAdd(k)}});
 WBX.wbElkSync=elkSync}
export {init78};
