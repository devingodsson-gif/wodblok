import {ICN} from './00-icons.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {fpSz} from './25-art-layers.js';
import {elSel} from './65-element-core.js';
import {plDisarm} from './72-placing.js';
import {stUnlocked} from './63-stamp-tool.js';

// ===== The Add bar (2.3.0, Photoshop): the element bar makes things. Pattern, Text and Image make a new element at once, just above the selected one (at the top
// of the list when nothing is selected), selects it, and shows its panel in Properties. Motif, Stamp and Text
// also arm (Paint is hidden since 2.3.1) their tool, so the next clicks on the canvas carry on; Select (first button, V) puts any tool away. An imported picture makes a Rectangle motif filled with it
// (2.3.1: there is no Image element and no Sheet; 2.31.0: no Shape element either, its shapes are the Basic shapes motifs). Owner, Oct 20 2026: "every click makes an element", "just above the selected one".
const AB_SEL=ICN.cursor;
// where a new element goes: just above the selected element (in the same group), else at the top; `bottom` puts it at the bottom when nothing is selected
function abInsert(q,bottom){const L=fpL();if(!L)return null;const a=(L.pl=L.pl||[]),s=elSel()||(WBS.fpSel!=null&&WBS.fpSel!==-1?a.find(x=>String(x.u)===String(WBS.fpSel)):null);
 if(s&&a.includes(s)){if(s.g)q.g=s.g;a.splice(a.indexOf(s)+1,0,q)}else if(bottom)a.unshift(q);else a.push(q);
 WBS.fpSel=q.u;WBS.fpMS=new Set();WBS.fpAnc=q.u;return q}
const abDone=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
const abOpen=pn=>{if(WBX.wbOpenPanel)WBX.wbOpenPanel(pn)};
const abCount=k=>{const L=fpL();return L?(L.pl||[]).filter(q=>q.k==k).length:0};
// Shape, Motif and Stamp (2.4.0), and Text and Pattern too (2.6.0), owner Oct 21 2026: the button makes nothing. It puts everything away, clears the selection and opens that kind's properties;
// what is picked there is made (a Shape preset) or follows the pointer as a ghost and is placed as often as wanted (a Motif, a Stamp).
let ABP='';   // which of 'motif', 'stamp', 'text', 'pattern' was last chosen on the bar and is waiting for a pick, '' for none
const abPick=k=>{plDisarm();WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpAnc=null;ABP=k;upd();abOpen(k=='motif'?'motifs':k=='text'?'text':k=='pattern'?'layers':'stmp')};
// 2.20.0 (owner Oct 22 2026): every Add arms its kind, a ghost follows the pointer and each click on the canvas places one; Esc or V puts it away. Text, Motif and Stamp use their own ghosts; Pattern uses a box.
function plArm(o){plDisarm();WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpAnc=null;WBS.plArm=o;upd();abOpen('layers');abSync()}
function plMake(o,x,y){if(o.k=='pattern'){const q=abInsert({u:fpU(),k:'pattern',n:'Pattern '+(abCount('pattern')+1),lay:'grid',cn:4,rn:4,sz:80,rt:0,ds:'cycle',sd:1+Math.floor(Math.random()*9998),src:[],x,y,s:Math.min(CW,CH),r:0,f:1});if(!q)return;WBS.patSel=q.u;abDone()}}
// 2.26.0: what a bar button does after it opened the panel. In a stamp's tab only Motif and Text have an Add, so the other buttons stay as they were (they only open the panel).
function abArm(k){const un=stUnlocked()!=null;if(un&&k!='motif'&&k!='text')return;
 if(k=='stamp'){if(!WBS.tiles.length)return;AD.stamp();return}
 if(k=='pattern'){AD.pattern();return}
 if(k=='text'){AD.text();return}
 if(k=='motif'&&WBX.wbMotifAdd)WBX.wbMotifAdd()}
const AB={
 pattern(){abPick('pattern');abArm('pattern')},
 text(){abPick('text');abArm('text')},   /* 2.26.0 (owner Oct 22 2026): a bar button opens the panel and arms the tool at once, as Add in the panel does (AD below) */
 paint(){const q=abInsert({u:fpU(),k:'paint',n:'Paint '+(abCount('paint')+1),x:0,y:0,st:[]});if(!q)return;WBS.paSel=q.u;if(WBX.wbPaArm)WBX.wbPaArm('brush');abDone();abOpen('elpaint')},
 stamp(){abPick('stamp');abArm('stamp')},
 motif(){abPick('motif');abArm('motif')},
 select(){abSelect()}};
// what Add in an element panel makes (2.6.0; Motif and Stamp too from 2.7.0): just above the selected element
const AD={
 stamp(){const t=WBS.tiles[WBS.cur];if(!t)return;plDisarm();WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpB=t.id;upd();abOpen('stmp')},
 motif(){if(WBX.wbMotifAdd)WBX.wbMotifAdd()},   // arms the last motif (74); in a stamp's tab it puts one in at once
 pattern(){plArm({k:'pattern',s:Math.min(CW,CH)})},
 text(){if(stUnlocked()!=null){abOpen('text');const ta=$('tx_t');if(!ta||!WBX.wbTxStampAt||!WBX.wbStampMid)return;if(!ta.value.trim()){ta.value='Text';ta.dispatchEvent(new Event('input',{bubbles:true}))}const[x,y]=WBX.wbStampMid()||[0,0];Promise.resolve(WBX.wbTxStampAt(x,y,true)).then(g=>setTimeout(()=>{if(!(g&&WBX.wbTxInStamp&&WBX.wbTxInStamp(g))){ta.focus();ta.select()}},0));return}   // (2.25.0) the typing starts on the stamp, in place
  abOpen('text');const ta=$('tx_t'),go=$('tx_go');if(!ta||!go)return;plDisarm();WBS.fpSel=-1;WBS.fpMS=new Set();if(!ta.value.trim()){ta.value='Text';ta.dispatchEvent(new Event('input',{bubbles:true}))}if(!WBS.txArm)go.click();return;
  const L=fpL(),before=new Set(L?(L.pl||[]).map(q=>String(q.u)):[]),anchor=elSel();if(!WBX.wbTbAdd)return;
  Promise.resolve(WBX.wbTbAdd()).then(()=>{const L2=fpL();if(!L2)return;const a=L2.pl||[],q=a.find(x=>!before.has(String(x.u)));if(!q)return;a.splice(a.indexOf(q),1);
   if(anchor&&a.includes(anchor)){if(anchor.g)q.g=anchor.g;a.splice(a.indexOf(anchor)+1,0,q)}else a.push(q);WBS.fpSel=q.u;abDone();setTimeout(()=>{ta.focus();ta.select()},0)})},
};
// which tool is armed, for the pressed look of the bar: '' is Select
function abTool(){if(WBX.wbPaMode&&WBX.wbPaMode()!='off')return'paint';const k=WBX.plKind?WBX.plKind():'';return k||ABP}
function abSync(){const b=$('elb');if(!b)return;if(ABP&&elSel())ABP='';const t=abTool();b.querySelectorAll('.elbb').forEach(x=>{const on=x.dataset.k==(t||'select');if(x.getAttribute('aria-pressed')!=String(on))x.setAttribute('aria-pressed',String(on))});abOpts(t)}
// The options strip (Photoshop's options bar): one line under the bar while the brush is on, with Brush / Eraser and its size. It drives the Paint panel's own controls.
function abOpts(t){const o=$('elopt');if(!o)return;const on=t=='paint';if(o.hidden===on)o.hidden=!on;if(!on)return;const m=WBX.wbPaMode?WBX.wbPaMode():'off';
 o.querySelectorAll('[data-m]').forEach(x=>{const p=x.dataset.m==m;if(x.getAttribute('aria-pressed')!=String(p)){x.setAttribute('aria-pressed',String(p));x.classList.toggle('on',p)}});
 const src=$('pasz'),r=o.querySelector('input');if(src&&r&&document.activeElement!==r&&r.value!==src.value)r.value=src.value}
function abSelect(){ABP='';plDisarm();if(WBX.wbPaArm)WBX.wbPaArm('off');abSync()}
function init73(){const b=$('elb');if(!b)return;
 if(!b.querySelector('[data-k="select"]'))b.insertAdjacentHTML('afterbegin',`<button type="button" class="elbb" data-k="select" aria-label="Select" title="Select (V)" aria-pressed="true"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${AB_SEL}</svg></button>`);
 b.onclick=e=>{const x=e.target.closest('.elbb');if(!x||x.disabled)return;const k=x.dataset.k;if(k!='motif'&&k!='stamp'&&k!='text'&&k!='pattern')ABP='';if(k!='paint'&&WBX.wbPaArm)WBX.wbPaArm('off');const f=AB[k];if(f)f();abSync()};
 document.addEventListener('keydown',e=>{const t=e.target;if(t&&t.matches&&t.matches('input,select,textarea,[contenteditable]'))return;if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;if(e.key=='v'||e.key=='V'){abSelect()}else if(e.key=='Escape'&&((WBX.wbPaMode&&WBX.wbPaMode()!='off')||ABP||(WBX.plKind&&WBX.plKind()))){abSelect()}});
 const stg=document.querySelector('.stage');if(stg&&!$('elopt')){stg.insertAdjacentHTML('beforeend','<div class="elopt" id="elopt" hidden><div class="seg"><button type="button" data-m="brush">Brush</button><button type="button" data-m="erase">Eraser</button></div><label>Size</label><input type="range" min="1" max="200" value="14" aria-label="Brush size"></div>');
  const o=$('elopt');o.onclick=e=>{const x=e.target.closest('[data-m]');if(x&&WBX.wbPaArm)WBX.wbPaArm(x.dataset.m)};o.querySelector('input').addEventListener('input',e=>{const s=$('pasz');if(s){s.value=e.target.value;s.dispatchEvent(new Event('input',{bubbles:true}))}})}
 WBX.wbPlArm=plArm;WBX.wbPlMake=plMake;WBX.wbAbSync=abSync;WBX.wbAbPick=()=>ABP;WBX.wbAbAdd=k=>{const f=AD[k]||AB[k];if(f)f();abSync()}}
export {abInsert,init73};
