import {$,WBS,WBX} from './01-launch-and-version.js';
import {freeLayer} from './24-free-place-layers.js';
import {artLayer} from './25-art-layers.js';
import {txtLayer} from './26-text-boxes.js';

// ===== Element core (element update, step 1, 2.1.1): the two registries every element kind and every effect joins.
// An element is one record in a layer's element list (layer.pl). Its kind comes from `k` when it is stored, otherwise from the kind's own test (`is`),
// so the elements made before the format stores `k` are still read correctly.
// A kind registers: label, dz (the order kinds write their shared definitions in), icon (the inside of a 24 x 24 line icon), pn (the panel that creates and edits it; none yet means its button is shown but off),
// name(q) (what the panel's "Editing" line calls one element), is(q) (does this record belong to me),
// draw(L, li, pa, lgB) returning [defs, wrapped markup, open tag, close tag, Map(id -> markup)].
// Adding a kind or an effect later is one module that calls elRegister / fxRegister from its init; nothing else lists them.
const EL_K={},EL_O=[];
function elRegister(k,o){if(!EL_K[k])EL_O.push(k);EL_K[k]={k,...o}}
function elKinds(){return EL_O.map(k=>EL_K[k])}
function elDef(k){return EL_K[k]||null}
function elKind(q){if(!q||typeof q!='object')return'';if(q.k&&EL_K[q.k])return q.k;for(const k of EL_O){const d=EL_K[k];if(d.is&&d.is(q))return k}return''}
// Draws a layer's elements in list order. Each kind draws all of its own elements once (so shared definitions are made once per kind, as before),
// then the list is walked in order: neighbouring elements of the same kind share that kind's wrapper (ink, opacity, blend), and a change of kind starts a new one.
// A layer whose elements are already grouped by kind draws exactly the markup it did before elements existed.
function elDraw(L,li,pa,lgB){const pl=L.pl||[];if(!pl.length)return['',''];const R={};let defs='';
EL_O.filter(k=>EL_K[k].draw).sort((a,b)=>(EL_K[a].dz||0)-(EL_K[b].dz||0)).forEach(k=>{const d=EL_K[k];const r=d.draw(L,li,pa,lgB);if(!r||!r[4])return;defs+=r[0];R[k]=r});
let out='',run='',buf='';const flush=()=>{if(run&&buf){const r=R[run];out+=r[2]+buf+r[3]}buf=''};
pl.forEach(q=>{const k=elKind(q),r=R[k];if(!r)return;const s=r[4].get(String(q.u));if(s==null)return;if(k!==run){flush();run=k}buf+=s});flush();
return[defs,out]}

// Effects: an ordered list `fx` on an element, each {u, k, on, sd, ...settings}. An effect registers: label, kinds (the element kinds it works on), defaults.
// No effect is registered yet; the stack and the effects themselves arrive in steps 7 to 10 of docs/element-update-plan.md.
const FX_K={},FX_O=[];
function fxRegister(k,o){if(!FX_K[k])FX_O.push(k);FX_K[k]={k,kinds:[],...o}}
function fxDef(k){return FX_K[k]||null}
function fxFor(kind){return FX_O.map(k=>FX_K[k]).filter(d=>d.kinds.includes(kind))}
function fxOf(q){return q&&Array.isArray(q.fx)?q.fx:[]}

// ===== The element bar: one button per kind, left of the centre of the window (the colour tray sits right of it). A button opens its kind's panel;
// it shows pressed while that panel is the one in front. Kinds whose panel is not built yet show their button switched off.
const elIc=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
function elBar(){const b=$('elb');if(!b)return;b.innerHTML=EL_O.map(k=>{const d=EL_K[k];return`<button type="button" class="elbb" data-k="${k}" aria-label="${d.label}" title="${d.label}" aria-pressed="false"${d.pn?'':' disabled'}>${elIc(d.icon||'')}</button>`}).join('')}
// the selected element on the current layer, if any
function elSel(){const L=WBS.layers[WBS.selL];if(!L||WBS.fpSel==null||WBS.fpSel===-1)return null;return(L.pl||[]).find(q=>q.u==WBS.fpSel)||null}
function elSync(){const b=$('elb');if(b)b.querySelectorAll('.elbb').forEach(x=>{const d=EL_K[x.dataset.k],r=d&&d.pn&&document.querySelector(`.rail [data-pn="${d.pn}"]`),on=!!(r&&r.classList.contains('on'));if(x.getAttribute('aria-pressed')!=String(on))x.setAttribute('aria-pressed',String(on))});
// the Image panel's Crop group shows only when there is a picture to crop
{const c=$('lcrop'),g=$('elcrg');if(c&&g&&g.hidden!==c.hidden)g.hidden=c.hidden}
// each element panel says which element it is editing; with nothing of its kind selected it is creating, and the line is hidden
const q=elSel(),k=elKind(q);document.querySelectorAll('.elmode[data-k]').forEach(m=>{const on=!!q&&m.dataset.k===k,d=EL_K[m.dataset.k];m.hidden=!on;const nb=m.querySelector('b');if(on&&nb&&d&&d.name){const t=d.name(q);if(nb.textContent!==t)nb.textContent=t}})}

function init65(){
// the kinds, in the order of the element bar. Image, Text and Stamp exist as placed elements today (their test and drawing; dz keeps the order their
// shared definitions were always written in); the others get them in later steps.
elRegister('sheet',{label:'Sheet',icon:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 13L13 4M9 20L20 9"/>'});
elRegister('paint',{label:'Paint',icon:'<path d="M19.5 4.5c-2.6 1-6.4 4.8-8.4 7.9l1.6 1.6c3.1-2 6.9-5.8 7.9-8.4z"/><path d="M10.2 13.6c-2 0-3.5 1.3-3.5 3.2 0 1.4-.8 2.4-2.4 2.7 2.6 1.3 7.4.6 7.4-4.4z"/>'});
elRegister('shape',{label:'Shape',pn:'motifs',icon:'<path d="M12 2.8l5.2 8.7H6.8z"/><circle cx="7" cy="17" r="4"/><rect x="12.8" y="13" width="8.4" height="8.4" rx="1.4"/>'});
elRegister('image',{label:'Image',pn:'elimg',icon:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 15.5L15 10l-9 9"/>',dz:2,is:q=>!!q.a,name:q=>(WBS.ARTS[q.a]&&WBS.ARTS[q.a].n)||'Image',draw:(L,li)=>artLayer(L,li)});
elRegister('text',{label:'Text',pn:'text',icon:'<path d="M5.5 7.5V5h13v2.5M12 5v14M9 19h6"/>',dz:3,is:q=>q.tx!=null,name:q=>String((q.tx&&q.tx.text)||'').replace(/\n/g,' ').slice(0,28),draw:(L,li)=>txtLayer(L,li)});
elRegister('stamp',{label:'Stamp',pn:'stmp',icon:'<rect x="3.5" y="10.5" width="9" height="9" rx="2"/><path d="M17 4.5l4 7h-8z"/>',dz:1,is:q=>q.t!=null,name:q=>'Stamp '+(WBS.tiles.findIndex(t=>t.id==q.t)+1),draw:(L,li,pa,lgB)=>freeLayer(L,li,pa,lgB)});
elRegister('pattern',{label:'Pattern',pn:'layers',icon:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'});
elBar();
const b=$('elb');if(b)b.onclick=e=>{const x=e.target.closest('.elbb');if(!x||x.disabled)return;const d=EL_K[x.dataset.k];if(d&&d.pn&&WBX.wbOpenPanel)WBX.wbOpenPanel(d.pn)};
WBX.wbElSync=elSync;
}
export {elDef,elDraw,elKind,elKinds,elRegister,elSel,elSync,fxDef,fxFor,fxOf,fxRegister,init65};
