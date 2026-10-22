import {$,WBS,WBX} from './01-launch-and-version.js';
import {stUnlocked} from './63-stamp-tool.js';
import {plDisarm} from './72-placing.js';

// ===== An Add button at the top of every element panel (2.6.0). 2.19.0 (owner Oct 22 2026): the per-kind lists are gone; the Elements panel is the only list. Add makes a new element of the kind,
// selects it and shows its properties just below. Motifs and Stamps are also placed from their libraries. While a stamp is being edited in its tab only Motif and Text keep their Add.
const ELK={text:{pn:'text',add:'Add text'},shape:{pn:'mlist',add:'Add shape'},pattern:{pn:'layers',add:'Add pattern'},motif:{pn:'motifs',add:'Add motif'},stamp:{pn:'stmp',add:'Add stamp'}};
function elkSync(){const un=stUnlocked()!=null;
 {const ab=document.querySelector('.elk[data-k="stamp"] [data-add]');if(ab){const none=!WBS.tiles.length;if(ab.disabled!==none)ab.disabled=none}}   // no stamp yet: nothing to add
 {const ed=$('smkedit');if(ed){const none=!WBS.tiles.length;if(ed.disabled!==none)ed.disabled=none}}
 document.querySelectorAll('section.pn[data-p=stmp] .stonly').forEach(d=>{if(d.hidden===un)d.hidden=!un});   // Block, Block edge and Symmetry belong to a stamp tab (2.13.0)
 Object.keys(ELK).forEach(k=>{const box=document.querySelector(`.elk[data-k="${k}"]`);if(!box)return;const keep=un&&(k=='motif'||k=='text');box.hidden=un&&!keep})}
function elkAdd(k){plDisarm();if(WBX.wbPenStop)WBX.wbPenStop();
 if(k=='shape'){if(WBX.wbShapeNew)WBX.wbShapeNew('rect');return}
 if(WBX.wbAbAdd)WBX.wbAbAdd(k)}
function init78(){
 Object.keys(ELK).forEach(k=>{const o=ELK[k],sec=document.querySelector(`section.pn[data-p="${o.pn}"]`);if(!sec||sec.querySelector('.elk[data-k]'))return;
  const html=`<div class="elk" data-k="${k}">${o.add?`<div class="row"><button type="button" class="alt" data-add>${o.add}</button></div>`:''}</div>`,at=k=='stamp'?sec.querySelector('details.g'):null;   // the Stamp panel: Create New Stamp, the stamps, then Add stamp under them (2.13.0)
  if(at)at.insertAdjacentHTML('afterend',html);else sec.insertAdjacentHTML('afterbegin',html);
  const box=sec.querySelector('.elk[data-k]');box.onclick=e=>{if(e.target.closest('[data-add]'))elkAdd(k)}});
 WBX.wbElkSync=elkSync}
export {init78};
