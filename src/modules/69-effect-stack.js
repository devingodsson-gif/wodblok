import {shGet} from './66-sheet-element.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {rng,tileOn} from './04-canvas-and-stamp-outlines.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {TXMD,TXMN,TXN,txEnsure,txFilt,txImgs,txIsW,txRid,txSpecs} from './16-texture-generators.js';
import {fpU} from './24-free-place-layers.js';
import {elKind,elSel,fxDef,fxFor,fxOf,fxRegister} from './65-element-core.js';
import {patCur} from './67-pattern-element.js';
import {paCur} from './70-paint-element.js';

// ===== The effect stack (element update, step 7, 2.1.7): an ordered list `fx` on an element, each {u, k, on, ...settings}, shown at the bottom of the element's panel.
// An effect can be switched off, moved up or down, and deleted; several of a kind are allowed. Effects that apply to a pattern apply to every placement.
// Texture {x: library texture, sd: seed, md: wear | relief | stain}: the Textures panel's library, used by one element. Works on stamps, pictures, text, patterns and the Sheet.
// Pressure offset {pst: uneven pressure 0 to 10, pfl: ink flooding 0 to 10}: the layer's pressure and flooding for one stamp (or a pattern's stamps).
const fxOn=q=>fxOf(q).filter(e=>e&&e.on!==false);
// the texture uses of an element, in the form the texture engine reads
const fxTexUses=q=>fxOn(q).filter(e=>e.k=='texture'&&e.x).map(e=>({x:e.x,sd:e.sd,md:e.md}));
// the mask and filter that carry an element's textures, for a box (x, y, W, H) in the element's own units; id names the mask. null = nothing to draw
function fxTex(q,id,b){const u=fxTexUses(q);if(!u.length||!WBS.edInk)return null;const s=txSpecs(u,'wear');if(!s.length)return null;const R=b.R||384;let defs='',attrs='';
const tl=!!b.tl&&tileOn(),v=tl?txImgs(s,b.W,b.H,R,'host',txIsW,b.x,b.y,true):txImgs(s,b.W,b.H,R,'host',txIsW,b.x,b.y);if(v){defs=`<mask id="${id}" maskUnits="userSpaceOnUse" x="${b.x}" y="${b.y}" width="${b.W}" height="${b.H}"><rect x="${b.x}" y="${b.y}" width="${b.W}" height="${b.H}" fill="#fff"/>${v}</mask>`;attrs+=` mask="url(#${id})"`}
const f=tl?txFilt(s,b.x,b.y,b.W,b.H,R,[0,0]):txFilt(s,b.x,b.y,b.W,b.H,R);if(f)attrs+=` filter="url(#${f})"`;return attrs?{defs,attrs}:null}
// Colour grade {ex ct hi sh wh bl tp tn sat vib hue fd}: the Grade panel's adjustments for one element. Returns {defs, wrap(markup)}: the markup inside one filter per grade effect, in the element's own units for a box b. null = no grade
const GRL=[['ex','Exposure',-100,100],['ct','Contrast',-100,100],['hi','Highlights',-100,100],['sh','Shadows',-100,100],['wh','Whites',-100,100],['bl','Blacks',-100,100],['tp','Temperature',-100,100],['tn','Tint',-100,100],['sat','Saturation',-100,100],['vib','Vibrance',-100,100],['hue','Hue',-180,180],['fd','Fade',0,100]];
function fxGr(q,id,b){if(!WBX.wbGrade||!WBX.wbGrade.elF)return null;const es=fxOn(q).filter(e=>e.k=='grade'),ds=[];es.forEach((e,i)=>{const d=WBX.wbGrade.elF(e,id+'_'+i,b.x,b.y,b.W,b.H);if(d)ds.push([id+'_'+i,d])});if(!ds.length)return null;return{defs:ds.map(d=>d[1]).join(''),wrap:c=>ds.reduce((o,d)=>`<g filter="url(#${d[0]})">${o}</g>`,c)}}
// the box a grade filter covers: the element's box with room round it, as for a stamp
const fxPad=(x,y,W,H)=>{const p=Math.max(W,H)*.15;return{x:x-p,y:y-p,W:W+2*p,H:H+2*p}};
// pressure for one element: null when it has none of its own (the layer's setting then applies)
function fxPress(q){const e=fxOn(q).filter(z=>z.k=='pressure');if(!e.length)return null;return{pst:Math.max(0,Math.min(10,+e[e.length-1].pst||0)),pfl:Math.max(0,Math.min(10,+e[e.length-1].pfl||0))}}

// Jitter {pos: 0 to 100 (% of the element's size), rot: 0 to 180 degrees, sz: 0 to 100 (%), fh, fv: random flips, sd: seed}: a repeatable random nudge for one element; on a pattern every placement gets its own.
// The result is the change to the element's own place: dx, dy (canvas units), dr (degrees), sz (a scale factor), sx, sy (1 or -1). null = no jitter.
const fxSeed=u=>{let h=7;for(const c of String(u))h=(h*31+c.charCodeAt(0))>>>0;return h%100000};
function fxJit(q){const es=fxOn(q).filter(e=>e.k=='jitter');if(!es.length)return null;const J={dx:0,dy:0,dr:0,sz:1,sx:1,sy:1};
es.forEach(e=>{const Q=rng(fxSeed(q.u)*15485863+(e.sd|0)*104729+101),a=Q(),b=Q(),c=Q(),d=Q(),h=Q(),v=Q(),P=Math.max(0,Math.min(100,+e.pos||0)),R=Math.max(0,Math.min(180,+e.rot||0)),Z=Math.max(0,Math.min(100,+e.sz||0)),s=+q.s||0;
J.dx+=(a*2-1)*P/100*s*.5;J.dy+=(b*2-1)*P/100*s*.5;J.dr+=(c*2-1)*R;J.sz*=1+(d*2-1)*Z/100*.6;if(e.fh&&h<.5)J.sx=-J.sx;if(e.fv&&v<.5)J.sy=-J.sy});return J}

// ---- the panels
const KIND_PANEL={stamp:'stmp',image:'elimg',text:'text',pattern:'layers',sheet:'elsheet',paint:'elpaint',shape:'mlist'};
const SEL={};   // the effect whose settings show, per kind
const fxHx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fxCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
function fxTarget(kind){if(kind=='sheet')return shGet();if(kind=='pattern')return patCur();if(kind=='paint')return paCur();const q=elSel();return q&&elKind(q)==kind?q:null}
// The list (2.3.0, Photoshop's layer effects): one row per effect (eye, name, ⋯), drag to reorder; the open effect's settings show right under its row.
// The + in the group's title adds one. Rows before the open one and the open row are in .fxl, the settings follow, the rest are in .fxl2.
const FXI={eye:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 off:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-3 3.7M6.3 7.9A16.4 16.4 0 002.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/></svg>',
 more:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></svg>',
 plus:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
 car:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'};
function fxGroup(kind){return`<details class="g fxg" data-fxk="${kind}" open hidden><summary>Effects<button type="button" class="ib fxadd" aria-haspopup="menu" aria-label="Add effect">${FXI.plus}</button></summary><div class="gb">
<div class="fxl"></div><div class="fxpane">
<div class="fxs" data-e="texture" hidden>
<div class="ctl"><label>Texture</label><select class="fxsx" aria-label="Texture"></select></div>
<div class="ctl"><label>Mode</label><select class="fxsm" aria-label="Mode">${TXMD.map(m=>`<option value="${m}">${TXMN[m]}</option>`).join('')}</select></div>
<div class="row"><button type="button" class="alt fxrr">Reroll</button></div>
</div>
<div class="fxs" data-e="jitter" hidden>
<div class="ctl"><label>Position</label><input type="range" class="fxjp" min="0" max="100" value="20" data-u="%" data-def="20"></div>
<div class="ctl"><label>Rotate</label><input type="range" class="fxjr2" min="0" max="180" value="15" data-u="&#176;" data-def="15"></div>
<div class="ctl"><label>Size</label><input type="range" class="fxjz" min="0" max="100" value="0" data-u="%" data-def="0"></div>
<label class="chk"><input type="checkbox" class="fxjh"><span>Flip across</span></label>
<label class="chk"><input type="checkbox" class="fxjv"><span>Flip down</span></label>
<div class="row"><button type="button" class="alt fxjrr">Reroll</button></div>
</div>
<div class="fxs" data-e="grade" hidden>
${GRL.map(([k,n,a,b])=>`<div class="ctl"><label>${n}</label><input type="range" class="fxg_${k}" min="${a}" max="${b}" value="0" data-def="0"></div>`).join('')}
</div>
<div class="fxs" data-e="pressure" hidden>
<div class="ctl"><label>Pressure</label><input type="range" class="fxpp" min="0" max="10" value="4" data-def="4"></div>
<div class="ctl"><label>Flooding</label><input type="range" class="fxpf" min="0" max="10" value="0" data-def="0"></div>
</div>
</div><div class="fxl fxl2"></div>
</div></details>`}
function fxSync(){if(!WBS.layers||!WBS.proj)return;document.querySelectorAll('.fxg').forEach(g=>{const kind=g.dataset.fxk,t=fxTarget(kind);if(g.hidden!==!t)g.hidden=!t;if(!t)return;const list=fxOf(t),sel=list.find(e=>e.u==SEL[kind])||null,lib=WBS.texLib||[];
const key=JSON.stringify([t.u||'sheet',list.map(e=>[e.u,e.k,e.on,e.x,e.md]),sel&&sel.u,lib.map(x=>[x.id,x.name])]);
const host=g.querySelector('.fxl'),host2=g.querySelector('.fxl2');if(host.dataset.k!==key){host.dataset.k=key;
const row=e=>{const d=fxDef(e.k),on=e.on!==false,op=sel&&e.u==sel.u;return`<div class="fxr${op?' on':''}${on?'':' off'}" data-fu="${e.u}" draggable="true"><button type="button" class="ib" data-fon aria-pressed="${on}" aria-label="${on?'Hide':'Show'} this effect">${on?FXI.eye:FXI.off}</button><span class="fxc${op?' open':''}">${FXI.car}</span><b>${fxHx(d?d.label:e.k)}</b><button type="button" class="ib" data-fmore aria-haspopup="menu" aria-label="More">${FXI.more}</button></div>`};
const si=sel?list.indexOf(sel):list.length-1;host.innerHTML=list.slice(0,si+1).map(row).join('');host2.innerHTML=list.slice(si+1).map(row).join('');
const sx=g.querySelector('.fxsx');sx.innerHTML=(lib.length?'':'<option value="">None</option>')+lib.map(x=>`<option value="${fxHx(x.id)}">${fxHx(x.name)}</option>`).join('')}
g.querySelectorAll('.fxs').forEach(s=>{const on=!!sel&&s.dataset.e==sel.k;if(s.hidden===on)s.hidden=!on});
if(sel&&sel.k=='texture'){const sx=g.querySelector('.fxsx'),sm=g.querySelector('.fxsm');if(sx.value!==sel.x)sx.value=sel.x||'';if(sm.value!==(sel.md||'wear'))sm.value=sel.md||'wear'}
if(sel&&sel.k=='jitter'){const set=(c,v)=>{const el=g.querySelector(c);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};set('.fxjp',+sel.pos||0);set('.fxjr2',+sel.rot||0);set('.fxjz',+sel.sz||0);g.querySelector('.fxjh').checked=!!sel.fh;g.querySelector('.fxjv').checked=!!sel.fv}
if(sel&&sel.k=='grade')GRL.forEach(([k])=>{const el=g.querySelector('.fxg_'+k),v=+sel[k]||0;if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}});
if(sel&&sel.k=='pressure'){const set=(c,v)=>{const el=g.querySelector(c);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};set('.fxpp',+sel.pst||0);set('.fxpf',+sel.pfl||0)}})}
function init69(){
// the Elements list opens an effect: select its element, show its panel, open that effect's settings
WBX.wbFxOpen=(kind,u)=>{SEL[kind]=u;const pn=KIND_PANEL[kind];if(pn&&WBX.wbOpenPanel)WBX.wbOpenPanel(pn);document.querySelectorAll('.fxl').forEach(x=>x.dataset.k='');fxSync()};
fxRegister('texture',{label:'Texture',kinds:['stamp','image','text','pattern','sheet','paint','shape'],make:()=>{const ids=(WBS.texLib||[]).map(x=>x.id),first=Object.keys(TXN)[0];const x=ids[0]||(first?txEnsure({t:first,a:40,sc:100,az:225}):'');return{k:'texture',on:true,x,sd:txRid(),md:'wear'}}});
fxRegister('pressure',{label:'Pressure offset',kinds:['stamp','pattern'],make:()=>({k:'pressure',on:true,pst:4,pfl:0})});
fxRegister('jitter',{label:'Jitter',kinds:['stamp','image','text','pattern','shape'],make:()=>({k:'jitter',on:true,pos:20,rot:15,sz:0,sd:txRid()})});
fxRegister('grade',{label:'Colour grade',kinds:['stamp','image','text','pattern','sheet','paint','shape'],make:()=>({k:'grade',on:true,...Object.fromEntries(GRL.map(r=>[r[0],0]))})});
Object.entries(KIND_PANEL).forEach(([kind,pn])=>{const sec=document.querySelector(`section.pn[data-p="${pn}"]`);if(!sec)return;sec.insertAdjacentHTML('beforeend',fxGroup(kind))});
document.querySelectorAll('.fxg').forEach(g=>{const kind=g.dataset.fxk,tg=()=>fxTarget(kind),cur=()=>{const t=tg();return t?fxOf(t).find(e=>e.u==SEL[kind])||null:null};
g.querySelector('.fxadd').onclick=e=>{e.stopPropagation();e.preventDefault();const t=tg();if(!t)return;rowMenu(e.currentTarget,fxFor(kind).map(d=>[d.label,()=>{const t2=tg();if(!t2)return;const f=d.make();f.u=fpU();(t2.fx=t2.fx||[]).push(f);SEL[kind]=f.u;fxCh()}]))};
const fxDel=(t,i)=>{const L=t.fx||[],u=L[i]&&L[i].u;L.splice(i,1);if(!L.length)delete t.fx;if(SEL[kind]==u)SEL[kind]=null;fxCh()};
const fxMv=(t,i,d)=>{const L=t.fx||[],j=i+d;if(j<0||j>=L.length)return;[L[i],L[j]]=[L[j],L[i]];fxCh()};
const lists=[...g.querySelectorAll('.fxl')];let dragU=null;
lists.forEach(h=>{h.onclick=e=>{const t=tg();if(!t)return;const r=e.target.closest('[data-fu]');if(!r)return;const L=t.fx||[],i=L.findIndex(z=>z.u==r.dataset.fu);if(i<0)return;
 if(e.target.closest('[data-fon]')){L[i].on=L[i].on===false;fxCh();return}
 const mb=e.target.closest('[data-fmore]');if(mb){e.stopPropagation();rowMenu(mb,[['Duplicate',()=>{const c=JSON.parse(JSON.stringify(L[i]));c.u=fpU();L.splice(i+1,0,c);SEL[kind]=c.u;fxCh()}],['Move up',()=>fxMv(t,i,-1)],['Move down',()=>fxMv(t,i,1)],['Delete',()=>fxDel(t,i)]]);return}
 // a click on the open effect's row closes it (accordion)
 SEL[kind]=SEL[kind]==L[i].u?null:L[i].u;g.querySelectorAll('.fxl').forEach(x=>x.dataset.k='');fxSync()};
 h.addEventListener('dragstart',e=>{const r=e.target.closest('[data-fu]');if(!r)return;dragU=r.dataset.fu;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain','effect')}catch(x){}});
 h.addEventListener('dragover',e=>{if(dragU==null)return;if(e.target.closest('[data-fu]'))e.preventDefault()});
 h.addEventListener('drop',e=>{if(dragU==null)return;e.preventDefault();const r=e.target.closest('[data-fu]'),t=tg();const u=dragU;dragU=null;if(!r||!t)return;const L=t.fx||[],i=L.findIndex(z=>z.u==u),j=L.findIndex(z=>z.u==r.dataset.fu);if(i<0||j<0||i==j)return;const[m]=L.splice(i,1);L.splice(j,0,m);fxCh()});
 h.addEventListener('dragend',()=>{dragU=null})});
g.querySelector('.fxsx').onchange=()=>{const e=cur();if(e){e.x=g.querySelector('.fxsx').value;fxCh()}};
g.querySelector('.fxsm').onchange=()=>{const e=cur();if(e){e.md=g.querySelector('.fxsm').value;fxCh()}};
g.querySelector('.fxrr').onclick=()=>{const e=cur();if(e){e.sd=txRid();fxCh()}};
GRL.forEach(([k])=>g.querySelector('.fxg_'+k).addEventListener('input',()=>{const e=cur();if(!e||e.k!='grade')return;const v=+g.querySelector('.fxg_'+k).value;if(e[k]!==v){e[k]=v;fxCh()}}));
[['.fxjp','pos'],['.fxjr2','rot'],['.fxjz','sz']].forEach(([c,f])=>g.querySelector(c).addEventListener('input',()=>{const e=cur();if(!e||e.k!='jitter')return;const v=+g.querySelector(c).value;if(e[f]!==v){e[f]=v;fxCh()}}));
[['.fxjh','fh'],['.fxjv','fv']].forEach(([c,f])=>g.querySelector(c).onchange=()=>{const e=cur();if(e&&e.k=='jitter'){e[f]=g.querySelector(c).checked;fxCh()}});
g.querySelector('.fxjrr').onclick=()=>{const e=cur();if(e&&e.k=='jitter'){e.sd=txRid();fxCh()}};
[['.fxpp','pst'],['.fxpf','pfl']].forEach(([c,f])=>g.querySelector(c).addEventListener('input',()=>{const e=cur();if(!e||e.k!='pressure')return;const v=+g.querySelector(c).value;if(e[f]!==v){e[f]=v;fxCh()}}))});
WBX.wbFxSync=fxSync}
// a text's Jitter is rolled per letter: letter i of text p gets its own seed, and the size it moves by is the font size
const fxJitL=(p,i,fs)=>fxJit({u:p.u+'#'+i,s:fs,fx:p.fx});
export {fxGr,fxJit,fxJitL,fxPad,fxPress,fxSync,fxTex,fxTexUses,init69};
