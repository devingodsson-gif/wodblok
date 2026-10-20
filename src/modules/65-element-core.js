import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,col,okC,tileOn} from './04-canvas-and-stamp-outlines.js';
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
function elExtend(k,o){if(EL_K[k])EL_K[k]={...EL_K[k],...o}}
function elKinds(){return EL_O.map(k=>EL_K[k])}
function elDef(k){return EL_K[k]||null}
function elKind(q){if(!q||typeof q!='object')return'';if(q.k&&EL_K[q.k])return q.k;for(const k of EL_O){const d=EL_K[k];if(d.is&&d.is(q))return k}return''}
// Draws a layer's elements in list order. Each kind draws all of its own elements once (so shared definitions are made once per kind, as before),
// then the list is walked in order: neighbouring elements of the same kind share that kind's wrapper (ink, opacity, blend), and a change of kind starts a new one.
// A layer whose elements are already grouped by kind draws exactly the markup it did before elements existed.
function elDraw(L,li,pa,lgB){let pl=L.pl||[];if(!pl.length)return['',''];// an element that stands for others (a pattern) is replaced, in place, by what it stands for before anything draws
for(const k of EL_O){const d=EL_K[k];if(d.expand&&pl.some(q=>q.k==k)){L=d.expand(L);pl=L.pl;break}}
const R={};let defs='';
EL_O.filter(k=>EL_K[k].draw).sort((a,b)=>(EL_K[a].dz||0)-(EL_K[b].dz||0)).forEach(k=>{const d=EL_K[k];const r=d.draw(L,li,pa,lgB);if(!r||!r[4])return;defs+=r[0];R[k]=r});
// Groups (2.2.2): a group is a row {k:'group', u, op, bl, v, ink} in the same list; its members carry g:<group u> and sit next to it in the list.
// A group wraps its members in one opacity, blend and eye (and ink); a group may itself be a member of another group.
const GP=new Map(pl.filter(q=>q.k=='group').map(q=>[q.u,q]));
const gpath=q=>{const o=[];let g=q.g,n=0;while(g&&GP.has(g)&&n++<16){o.unshift(GP.get(g));g=GP.get(g).g}return o};
const gid=G=>String(G.u).replace(/[^\w-]/g,'');
const gWrap=(G,inner)=>{if(!inner)return'';const ink=okC(G.ink)?col(G.ink):'';let o=inner;if(ink){defs+=`<filter id="gk${gid(G)}" filterUnits="userSpaceOnUse" x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}" color-interpolation-filters="sRGB"><feFlood flood-color="${ink}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;o=`<g filter="url(#gk${gid(G)})">${o}</g>`}return`<g${elOB(G)}>${o}</g>`};
const its=pl.filter(q=>q.k!='group').map(q=>({q,path:gpath(q)})).filter(it=>!it.path.some(G=>G.v===false));
// Repeat tile: every top-level piece (a group, a wrapped element, a run of one kind) is copied to the neighbouring tiles on its own, inside its own opacity, blend and ink, so a translucent piece spilling over a tile edge is not laid over its neighbour's copy twice
const tU=h=>tileOn()?elTile(`${li}_${tn++}`,h):h;let tn=0;
function render(its,d){let out='',run='',buf='',wb='',wk=null,wa='';const T=h=>d?h:tU(h);const flush=()=>{if(run&&buf){const r=R[run];out+=T(r[2]+buf+r[3])}buf='';run=''};
// an element with its own opacity (op), blend (bl) or eye (v:false) is wrapped on its own; the placements a pattern prints share their pattern's wrapper (key wk)
const emit=()=>{if(wb)out+=`<g${wa}>${T(wb)}</g>`;wb='';wk=null};
for(let i=0;i<its.length;i++){const it=its[i],G=it.path[d];
 if(G){let j=i;while(j<its.length&&its[j].path[d]&&its[j].path[d].u==G.u)j++;const inner=render(its.slice(i,j),d+1);i=j-1;emit();flush();out+=gWrap(G,T(inner));continue}
 const q=it.q;if(q.v===false)continue;const k=elKind(q),r=R[k];if(!r)continue;const s=r[4].get(String(q.u));if(s==null)continue;const a=elOB(q);
 if(a){flush();const key=q.wk||q.u;if(key!==wk){emit();wk=key;wa=a}wb+=r[2]+s+r[3];continue}
 emit();if(k!==run){flush();run=k}buf+=s}
flush();emit();return out}
return[defs,render(its,0)]}
function elTile(id,h){let o=`<g id="tw${id}">${h}</g>`;const R=WBS.tilePv?[-2,-1,0,1,2]:[-1,0,1];for(const dx of R)for(const dy of R)if(dx||dy)o+=`<use href="#tw${id}" x="${dx*CW}" y="${dy*CH}"/>`;return o}
// the opacity and blend attributes of one element ('' when it has neither); behind, cancel and replace stay layer-only
function elOB(q){const op=q.op!=null?Math.max(0,Math.min(100,+q.op)):100,bl=q.bl&&q.bl!='behind'&&q.bl!='cancel'&&q.bl!='replace'?q.bl:'';return(op<100?` opacity="${(op/100).toFixed(2)}"`:'')+(bl?` style="mix-blend-mode:${bl}"`:'')}

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
if(WBX.wbShSync)WBX.wbShSync();if(WBX.wbPatSync)WBX.wbPatSync();if(WBX.wbStcSync)WBX.wbStcSync();if(WBX.wbPaSync)WBX.wbPaSync();if(WBX.wbFxSync)WBX.wbFxSync();
const q=elSel(),k=elKind(q);document.querySelectorAll('.elmode[data-k]').forEach(m=>{const on=!!q&&m.dataset.k===k,d=EL_K[m.dataset.k];m.hidden=!on;const nb=m.querySelector('b');if(on&&nb&&d&&d.name){const t=d.name(q);if(nb.textContent!==t)nb.textContent=t}})}

function init65(){
// the kinds, in the order of the element bar. Image, Text and Stamp exist as placed elements today (their test and drawing; dz keeps the order their
// shared definitions were always written in); the others get them in later steps.
elRegister('sheet',{label:'Sheet',pn:'elsheet',icon:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 13L13 4M9 20L20 9"/>'});
elRegister('paint',{label:'Paint',pn:'elpaint',icon:'<path d="M19.5 4.5c-2.6 1-6.4 4.8-8.4 7.9l1.6 1.6c3.1-2 6.9-5.8 7.9-8.4z"/><path d="M10.2 13.6c-2 0-3.5 1.3-3.5 3.2 0 1.4-.8 2.4-2.4 2.7 2.6 1.3 7.4.6 7.4-4.4z"/>'});
elRegister('shape',{label:'Shape',pn:'motifs',icon:'<path d="M12 2.8l5.2 8.7H6.8z"/><circle cx="7" cy="17" r="4"/><rect x="12.8" y="13" width="8.4" height="8.4" rx="1.4"/>'});
elRegister('image',{label:'Image',pn:'elimg',icon:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 15.5L15 10l-9 9"/>',dz:2,is:q=>!!q.a,name:q=>(WBS.ARTS[q.a]&&WBS.ARTS[q.a].n)||'Image',draw:(L,li)=>artLayer(L,li)});
elRegister('text',{label:'Text',pn:'text',icon:'<path d="M5.5 7.5V5h13v2.5M12 5v14M9 19h6"/>',dz:3,is:q=>q.tx!=null,name:q=>String((q.tx&&q.tx.text)||'').replace(/\n/g,' ').slice(0,28),draw:(L,li)=>txtLayer(L,li)});
elRegister('stamp',{label:'Stamp',pn:'stmp',icon:'<rect x="3.5" y="10.5" width="9" height="9" rx="2"/><path d="M17 4.5l4 7h-8z"/>',dz:1,is:q=>q.t!=null,name:q=>'Stamp '+(WBS.tiles.findIndex(t=>t.id==q.t)+1),draw:(L,li,pa,lgB)=>freeLayer(L,li,pa,lgB)});
elRegister('pattern',{label:'Pattern',pn:'layers',icon:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'});
elBar();
const b=$('elb');if(b)b.onclick=e=>{const x=e.target.closest('.elbb');if(!x||x.disabled)return;const d=EL_K[x.dataset.k];if(d&&d.pn&&WBX.wbOpenPanel)WBX.wbOpenPanel(d.pn)};
WBX.wbElSync=elSync;
}
export {elExtend,elDef,elDraw,elKind,elKinds,elRegister,elSel,elSync,fxDef,fxFor,fxOf,fxRegister,init65};
