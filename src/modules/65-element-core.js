import {freeLayer} from './24-free-place-layers.js';
import {artLayer} from './25-art-layers.js';
import {txtLayer} from './26-text-boxes.js';

// ===== Element core (element update, step 1, 2.1.1): the two registries every element kind and every effect joins.
// An element is one record in a layer's element list (layer.pl). Its kind comes from `k` when it is stored, otherwise from the kind's own test (`is`),
// so the elements made before the format stores `k` are still read correctly.
// A kind registers: label, is(q) (does this record belong to me), draw(L, li, pa, lgB) returning [defs, wrapped markup, open tag, close tag, Map(id -> markup)].
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
EL_O.forEach(k=>{const d=EL_K[k];if(!d.draw)return;const r=d.draw(L,li,pa,lgB);if(!r||!r[4])return;defs+=r[0];R[k]=r});
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

function init65(){
// the three kinds that exist today; the order is the order they are tested in
elRegister('stamp',{label:'Stamp',is:q=>q.t!=null,draw:(L,li,pa,lgB)=>freeLayer(L,li,pa,lgB)});
elRegister('image',{label:'Image',is:q=>!!q.a,draw:(L,li)=>artLayer(L,li)});
elRegister('text',{label:'Text',is:q=>q.tx!=null,draw:(L,li)=>txtLayer(L,li)});
}
export {elDef,elDraw,elKind,elKinds,elRegister,fxDef,fxFor,fxOf,fxRegister,init65};
