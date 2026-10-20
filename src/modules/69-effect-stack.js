import {$,WBS,WBX} from './01-launch-and-version.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {TXMD,TXMN,TXN,txEnsure,txFilt,txImgs,txIsW,txRid,txSpecs} from './16-texture-generators.js';
import {fpU} from './24-free-place-layers.js';
import {elKind,elSel,fxDef,fxFor,fxOf,fxRegister} from './65-element-core.js';
import {patCur} from './67-pattern-element.js';

// ===== The effect stack (element update, step 7, 2.1.7): an ordered list `fx` on an element, each {u, k, on, ...settings}, shown at the bottom of the element's panel.
// An effect can be switched off, moved up or down, and deleted; several of a kind are allowed. Effects that apply to a pattern apply to every placement.
// Texture {x: library texture, sd: seed, md: wear | relief | stain}: the Textures panel's library, used by one element. Works on stamps, pictures, text, patterns and the Sheet.
// Pressure offset {pst: uneven pressure 0 to 10, pfl: ink flooding 0 to 10}: the layer's pressure and flooding for one stamp (or a pattern's stamps).
const fxOn=q=>fxOf(q).filter(e=>e&&e.on!==false);
// the texture uses of an element, in the form the texture engine reads
const fxTexUses=q=>fxOn(q).filter(e=>e.k=='texture'&&e.x).map(e=>({x:e.x,sd:e.sd,md:e.md}));
// the mask and filter that carry an element's textures, for a box (x, y, W, H) in the element's own units; id names the mask. null = nothing to draw
function fxTex(q,id,b){const u=fxTexUses(q);if(!u.length||!WBS.edInk)return null;const s=txSpecs(u,'wear');if(!s.length)return null;const R=b.R||384;let defs='',attrs='';
const v=txImgs(s,b.W,b.H,R,'host',txIsW,b.x,b.y);if(v){defs=`<mask id="${id}" maskUnits="userSpaceOnUse" x="${b.x}" y="${b.y}" width="${b.W}" height="${b.H}"><rect x="${b.x}" y="${b.y}" width="${b.W}" height="${b.H}" fill="#fff"/>${v}</mask>`;attrs+=` mask="url(#${id})"`}
const f=txFilt(s,b.x,b.y,b.W,b.H,R);if(f)attrs+=` filter="url(#${f})"`;return attrs?{defs,attrs}:null}
// pressure for one element: null when it has none of its own (the layer's setting then applies)
function fxPress(q){const e=fxOn(q).filter(z=>z.k=='pressure');if(!e.length)return null;return{pst:Math.max(0,Math.min(10,+e[e.length-1].pst||0)),pfl:Math.max(0,Math.min(10,+e[e.length-1].pfl||0))}}

// ---- the panels
const KIND_PANEL={stamp:'stmp',image:'elimg',text:'text',pattern:'layers',sheet:'elsheet'};
const SEL={};   // the effect whose settings show, per kind
const fxHx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fxCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
function fxTarget(kind){if(kind=='sheet')return WBS.proj&&WBS.proj.sh||null;if(kind=='pattern')return patCur();const q=elSel();return q&&elKind(q)==kind?q:null}
function fxGroup(kind){return`<details class="g fxg" data-fxk="${kind}" open hidden><summary>Effects</summary><div class="gb">
<div class="ml fxl"></div>
<div class="row"><button type="button" class="alt fxadd" aria-haspopup="menu">Add effect</button></div>
<div class="fxs" data-e="texture" hidden>
<div class="ctl"><label>Texture</label><select class="fxsx" aria-label="Texture"></select></div>
<div class="ctl"><label>Mode</label><select class="fxsm" aria-label="Mode">${TXMD.map(m=>`<option value="${m}">${TXMN[m]}</option>`).join('')}</select></div>
<div class="row"><button type="button" class="alt fxrr">Reroll</button></div>
</div>
<div class="fxs" data-e="pressure" hidden>
<div class="ctl"><label>Pressure</label><input type="range" class="fxpp" min="0" max="10" value="4" data-def="4"></div>
<div class="ctl"><label>Flooding</label><input type="range" class="fxpf" min="0" max="10" value="0" data-def="0"></div>
</div>
</div></details>`}
function fxSync(){if(!WBS.layers||!WBS.proj)return;document.querySelectorAll('.fxg').forEach(g=>{const kind=g.dataset.fxk,t=fxTarget(kind);if(g.hidden!==!t)g.hidden=!t;if(!t)return;const list=fxOf(t),sel=list.find(e=>e.u==SEL[kind])||null,lib=WBS.texLib||[];
const key=JSON.stringify([t.u||'sheet',list.map(e=>[e.u,e.k,e.on,e.x,e.md]),sel&&sel.u,lib.map(x=>[x.id,x.name])]);
const host=g.querySelector('.fxl');if(host.dataset.k!==key){host.dataset.k=key;
host.innerHTML=list.map((e,i)=>{const d=fxDef(e.k);return`<div class="mr${sel&&e.u==sel.u?' on':''}" data-fu="${e.u}"><button type="button" class="pvc" data-fon aria-pressed="${e.on!==false}" aria-label="Switch on or off">${e.on!==false?'On':'Off'}</button><b>${fxHx(d?d.label:e.k)}</b><button type="button" data-fup aria-label="Move up"${i?'':' disabled'}>&#8593;</button><button type="button" data-fdn aria-label="Move down"${i<list.length-1?'':' disabled'}>&#8595;</button><button type="button" data-fx aria-label="Delete this effect">&#215;</button></div>`}).join('');
const sx=g.querySelector('.fxsx');sx.innerHTML=(lib.length?'':'<option value="">None</option>')+lib.map(x=>`<option value="${fxHx(x.id)}">${fxHx(x.name)}</option>`).join('')}
g.querySelectorAll('.fxs').forEach(s=>{const on=!!sel&&s.dataset.e==sel.k;if(s.hidden===on)s.hidden=!on});
if(sel&&sel.k=='texture'){const sx=g.querySelector('.fxsx'),sm=g.querySelector('.fxsm');if(sx.value!==sel.x)sx.value=sel.x||'';if(sm.value!==(sel.md||'wear'))sm.value=sel.md||'wear'}
if(sel&&sel.k=='pressure'){const set=(c,v)=>{const el=g.querySelector(c);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};set('.fxpp',+sel.pst||0);set('.fxpf',+sel.pfl||0)}})}
function init69(){
fxRegister('texture',{label:'Texture',kinds:['stamp','image','text','pattern','sheet'],make:()=>{const ids=(WBS.texLib||[]).map(x=>x.id),first=Object.keys(TXN)[0];const x=ids[0]||(first?txEnsure({t:first,a:40,sc:100,az:225}):'');return{k:'texture',on:true,x,sd:txRid(),md:'wear'}}});
fxRegister('pressure',{label:'Pressure offset',kinds:['stamp','pattern'],make:()=>({k:'pressure',on:true,pst:4,pfl:0})});
Object.entries(KIND_PANEL).forEach(([kind,pn])=>{const sec=document.querySelector(`section.pn[data-p="${pn}"]`);if(!sec)return;sec.insertAdjacentHTML('beforeend',fxGroup(kind))});
document.querySelectorAll('.fxg').forEach(g=>{const kind=g.dataset.fxk,tg=()=>fxTarget(kind),cur=()=>{const t=tg();return t?fxOf(t).find(e=>e.u==SEL[kind])||null:null};
g.querySelector('.fxadd').onclick=e=>{e.stopPropagation();const t=tg();if(!t)return;rowMenu(e.currentTarget,fxFor(kind).map(d=>[d.label,()=>{const t2=tg();if(!t2)return;const f=d.make();f.u=fpU();(t2.fx=t2.fx||[]).push(f);SEL[kind]=f.u;fxCh()}]))};
g.querySelector('.fxl').onclick=e=>{const t=tg();if(!t)return;const r=e.target.closest('[data-fu]');if(!r)return;const L=t.fx||[],i=L.findIndex(z=>z.u==r.dataset.fu);if(i<0)return;
if(e.target.closest('[data-fon]')){L[i].on=L[i].on===false;fxCh();return}
if(e.target.closest('[data-fx]')){L.splice(i,1);if(!L.length)delete t.fx;if(SEL[kind]==r.dataset.fu)SEL[kind]=null;fxCh();return}
if(e.target.closest('[data-fup]')){if(i>0){[L[i-1],L[i]]=[L[i],L[i-1]];fxCh()}return}
if(e.target.closest('[data-fdn]')){if(i<L.length-1){[L[i+1],L[i]]=[L[i],L[i+1]];fxCh()}return}
SEL[kind]=L[i].u;fxSync()};
g.querySelector('.fxsx').onchange=()=>{const e=cur();if(e){e.x=g.querySelector('.fxsx').value;fxCh()}};
g.querySelector('.fxsm').onchange=()=>{const e=cur();if(e){e.md=g.querySelector('.fxsm').value;fxCh()}};
g.querySelector('.fxrr').onclick=()=>{const e=cur();if(e){e.sd=txRid();fxCh()}};
[['.fxpp','pst'],['.fxpf','pfl']].forEach(([c,f])=>g.querySelector(c).addEventListener('input',()=>{const e=cur();if(!e||e.k!='pressure')return;const v=+g.querySelector(c).value;if(e[f]!==v){e[f]=v;fxCh()}}))});
WBX.wbFxSync=fxSync}
export {fxPress,fxSync,fxTex,fxTexUses,init69};
