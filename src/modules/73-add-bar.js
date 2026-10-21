import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {fpSz} from './25-art-layers.js';
import {elSel} from './65-element-core.js';
import {plDisarm} from './72-placing.js';

// ===== The Add bar (2.3.0, Photoshop): the element bar makes things. Every press makes a new element at once, just above the selected one (at the top
// of the list when nothing is selected; a Sheet then goes to the bottom), selects it, and shows its panel in Properties. Paint, Shape, Stamp and Text
// also arm their tool, so the next clicks on the canvas carry on; Select (first button, V) puts any tool away. Image asks for a picture first: a picture
// cannot be empty. Owner, Oct 20 2026: "every click makes an element", "just above the selected one".
const AB_SEL='<path d="M6 3.5l12 8.2-5.4 1.2 3.2 6.1-2.4 1.3-3.2-6.1-4.2 3.7z"/>';
// where a new element goes: just above the selected element (in the same group), else at the top; `bottom` puts it at the bottom when nothing is selected
function abInsert(q,bottom){const L=fpL();if(!L)return null;const a=(L.pl=L.pl||[]),s=elSel()||(WBS.fpSel!=null&&WBS.fpSel!==-1?a.find(x=>String(x.u)===String(WBS.fpSel)):null);
 if(s&&a.includes(s)){if(s.g)q.g=s.g;a.splice(a.indexOf(s)+1,0,q)}else if(bottom)a.unshift(q);else a.push(q);
 WBS.fpSel=q.u;WBS.fpMS=new Set();WBS.fpAnc=q.u;return q}
const abDone=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
const abOpen=pn=>{if(WBX.wbOpenPanel)WBX.wbOpenPanel(pn)};
const abCount=k=>{const L=fpL();return L?(L.pl||[]).filter(q=>q.k==k).length:0};
const AB={
 pattern(){const t=WBS.tiles[WBS.cur],q=abInsert({u:fpU(),k:'pattern',n:'Pattern '+(abCount('pattern')+1),lay:'grid',cn:4,rn:4,sz:80,rt:0,ds:'cycle',sd:1+Math.floor(Math.random()*9998),src:t?[{k:'stamp',t:t.id,w:1}]:[],x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:Math.min(CW,CH),r:0,f:1});if(!q)return;WBS.patSel=q.u;abDone();abOpen('layers')},
 paint(){const q=abInsert({u:fpU(),k:'paint',n:'Paint '+(abCount('paint')+1),x:0,y:0,st:[]});if(!q)return;WBS.paSel=q.u;if(WBX.wbPaArm)WBX.wbPaArm('brush');abDone();abOpen('elpaint')},
 stamp(){const t=WBS.tiles[WBS.cur];if(!t){abOpen('stmp');return}const q=abInsert({u:fpU(),k:'stamp',t:t.id,x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:+fpSz().toFixed(2),r:0,f:1});if(!q)return;abDone();abOpen('stmp');WBS.fpB=t.id;WBS.fpGhost=null;upd()},
 text(){const L=fpL(),before=new Set(L?(L.pl||[]).map(q=>String(q.u)):[]),anchor=elSel();abOpen('text');const ta=$('tx_t');if(!ta||!WBX.wbTbAdd)return;if(!ta.value.trim()){ta.value='Text';ta.dispatchEvent(new Event('input',{bubbles:true}))}
  Promise.resolve(WBX.wbTbAdd()).then(()=>{const L2=fpL();if(!L2)return;const a=L2.pl||[],q=a.find(x=>!before.has(String(x.u)));if(!q)return;a.splice(a.indexOf(q),1);
   if(anchor&&a.includes(anchor)){if(anchor.g)q.g=anchor.g;a.splice(a.indexOf(anchor)+1,0,q)}else a.push(q);WBS.fpSel=q.u;abDone();setTimeout(()=>{ta.focus();ta.select()},0)})},
 motif(){if(WBX.wbMotifNew)WBX.wbMotifNew(CW,CH);abOpen('motifs')},
 image(){abOpen('elimg')}};
// which tool is armed, for the pressed look of the bar: '' is Select
function abTool(){if(WBX.wbPaMode&&WBX.wbPaMode()!='off')return'paint';const k=WBX.plKind?WBX.plKind():'';return k=='picture'?'image':k}
function abSync(){const b=$('elb');if(!b)return;const t=abTool();b.querySelectorAll('.elbb').forEach(x=>{const on=x.dataset.k=='select'?!t:x.dataset.k==t;if(x.getAttribute('aria-pressed')!=String(on))x.setAttribute('aria-pressed',String(on))});abOpts(t)}
// The options strip (Photoshop's options bar): one line under the bar while the brush is on, with Brush / Eraser and its size. It drives the Paint panel's own controls.
function abOpts(t){const o=$('elopt');if(!o)return;const on=t=='paint';if(o.hidden===on)o.hidden=!on;if(!on)return;const m=WBX.wbPaMode?WBX.wbPaMode():'off';
 o.querySelectorAll('[data-m]').forEach(x=>{const p=x.dataset.m==m;if(x.getAttribute('aria-pressed')!=String(p)){x.setAttribute('aria-pressed',String(p));x.classList.toggle('on',p)}});
 const src=$('pasz'),r=o.querySelector('input');if(src&&r&&document.activeElement!==r&&r.value!==src.value)r.value=src.value}
function abSelect(){plDisarm();if(WBX.wbPaArm)WBX.wbPaArm('off');abSync()}
function init73(){const b=$('elb');if(!b)return;
 if(!b.querySelector('[data-k="select"]'))b.insertAdjacentHTML('afterbegin',`<button type="button" class="elbb" data-k="select" aria-label="Select" aria-pressed="true"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${AB_SEL}</svg></button>`);
 b.onclick=e=>{const x=e.target.closest('.elbb');if(!x||x.disabled)return;const k=x.dataset.k;if(k=='select'){abSelect();return}if(k!='paint'&&WBX.wbPaArm)WBX.wbPaArm('off');const f=AB[k];if(f)f();abSync()};
 document.addEventListener('keydown',e=>{const t=e.target;if(t&&t.matches&&t.matches('input,select,textarea,[contenteditable]'))return;if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;if(e.key=='v'||e.key=='V'){abSelect()}else if(e.key=='Escape'&&WBX.wbPaMode&&WBX.wbPaMode()!='off'){abSelect()}});
 const stg=document.querySelector('.stage');if(stg&&!$('elopt')){stg.insertAdjacentHTML('beforeend','<div class="elopt" id="elopt" hidden><div class="seg"><button type="button" data-m="brush">Brush</button><button type="button" data-m="erase">Eraser</button></div><label>Size</label><input type="range" min="1" max="200" value="14" aria-label="Brush size"></div>');
  const o=$('elopt');o.onclick=e=>{const x=e.target.closest('[data-m]');if(x&&WBX.wbPaArm)WBX.wbPaArm(x.dataset.m)};o.querySelector('input').addEventListener('input',e=>{const s=$('pasz');if(s){s.value=e.target.value;s.dispatchEvent(new Event('input',{bubbles:true}))}})}
 WBX.wbAbSync=abSync;WBX.wbAbAdd=k=>{const f=AB[k];if(f)f();abSync()}}
export {abInsert,init73};
