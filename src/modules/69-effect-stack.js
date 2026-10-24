import {ICN} from './00-icons.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {rng,tileOn} from './04-canvas-and-stamp-outlines.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {TXF,TXMD,TXMN,TXN,txFilt,txImgs,txIsW,txLib,txMake,txRid,txSpecs} from './16-texture-generators.js';
import {fpU} from './24-free-place-layers.js';
import {elKind,elSel,fxDef,fxFor,fxOf,fxRegister} from './65-element-core.js';
import {patCur} from './67-pattern-element.js';
import {paCur} from './70-paint-element.js';
import {fqRegister,fqVal} from './83-filter-effects.js';

// ===== The effect stack (element update, step 7, 2.1.7): an ordered list `fx` on an element, each {u, k, on, ...settings}, shown at the bottom of the element's panel.
// An effect can be switched off, moved up or down, and deleted; several of a kind are allowed. Effects that apply to a pattern apply to every placement.
// Texture {x: its own library texture (type, strength, scale, light; edited right in the effect), sd: seed, md: wear | relief | stain}. Works on stamps, pictures, text, patterns and the Sheet.
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
// 2.35.0: the filter effects (Noise, Blur, Halftone; 83-filter-effects.js) chain with the grades in list order, the first one innermost
function fxGr(q,id,b){const ds=[];fxOn(q).forEach((e,i)=>{const fid=id+'_'+i;if(e.k=='grade'){if(!WBX.wbGrade||!WBX.wbGrade.elF)return;const d=WBX.wbGrade.elF(e,fid,b.x,b.y,b.W,b.H);if(d)ds.push({defs:d,wrap:c=>`<g filter="url(#${fid})">${c}</g>`});return}
 const def=fxDef(e.k);if(def&&def.filt){const r=def.filt(e,fid,b,q);if(r)ds.push(r)}});if(!ds.length)return null;return{defs:ds.map(d=>d.defs).join(''),wrap:c=>ds.reduce((o,d)=>d.wrap(o),c)}}
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
const KIND_PANEL={stamp:'stmp',text:'text',pattern:'layers',paint:'elpaint',motif:'motifs'};
const SEL={};   // the effect whose settings show, per kind
const fxHx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fxCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
function fxTarget(kind){if(kind=='pattern')return patCur();if(kind=='paint')return paCur();const q=elSel();return q&&elKind(q)==kind?q:null}
// The list (2.3.0, Photoshop's layer effects): one row per effect (eye, name, ⋯), drag to reorder; the open effect's settings show right under its row.
// The + in the group's title adds one. Rows before the open one and the open row are in .fxl, the settings follow, the rest are in .fxl2.
const FXI={eye:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.eye+'</svg>',
 off:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.eyeOff+'</svg>',
 more:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.more+'</svg>',
 plus:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.plus+'</svg>',
 car:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.chevR+'</svg>'};
function fxGroup(kind){return`<details class="g fxg" data-fxk="${kind}" open hidden><summary>Effects<button type="button" class="ib fxadd" aria-haspopup="menu" aria-label="Add effect">${FXI.plus}</button></summary><div class="gb">
<div class="fxl"></div><div class="fxpane">
<div class="fxs" data-e="texture" hidden>
<div class="ctl"><label>Type</label><select class="fxst" aria-label="Type">${TXF.map(([g,o])=>`<optgroup label="${g}">${Object.entries(o).map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</optgroup>`).join('')}</select></div>
<div class="ctl"><label>Strength</label><input type="range" class="fxsa" min="0" max="100" value="40" data-def="40"></div>
<div class="ctl"><label>Scale</label><input type="range" class="fxsc" min="25" max="300" value="100" data-u="%" data-def="100"></div>
<div class="ctl"><label>Light from</label><input type="range" class="fxsz" min="0" max="359" value="225" data-u="&#176;" data-def="225"></div>
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
${fxFor(kind).filter(d=>d.pane).map(d=>d.pane()).join('')}
</div><div class="fxl fxl2"></div>
</div></details>`}
function fxSync(){if(!WBS.layers||!WBS.proj)return;document.querySelectorAll('.fxg').forEach(g=>{const kind=g.dataset.fxk,t=fxTarget(kind);if(g.hidden!==!t)g.hidden=!t;if(!t)return;const list=fxOf(t),sel=list.find(e=>e.u==SEL[kind])||null;
const key=JSON.stringify([t.u||'x',list.map(e=>[e.u,e.k,e.on,e.x,e.md]),sel&&sel.u]);
const host=g.querySelector('.fxl'),host2=g.querySelector('.fxl2');if(host.dataset.k!==key){host.dataset.k=key;
const row=e=>{const d=fxDef(e.k),on=e.on!==false,op=sel&&e.u==sel.u;return`<div class="fxr${op?' on':''}${on?'':' off'}" data-fu="${e.u}" draggable="true"><button type="button" class="ib" data-fon aria-pressed="${on}" aria-label="${on?'Hide':'Show'} this effect">${on?FXI.eye:FXI.off}</button><span class="fxc${op?' open':''}">${FXI.car}</span><b>${fxHx(d?d.label:e.k)}</b><button type="button" class="ib" data-fmore aria-haspopup="menu" aria-label="More">${FXI.more}</button></div>`};
const si=sel?list.indexOf(sel):list.length-1;host.innerHTML=list.slice(0,si+1).map(row).join('');host2.innerHTML=list.slice(si+1).map(row).join('');}
g.querySelectorAll('.fxs').forEach(s=>{const on=!!sel&&s.dataset.e==sel.k;if(s.hidden===on)s.hidden=!on});
if(sel&&sel.k=='texture'){const L=txLib(sel.x)||{t:Object.keys(TXN)[0],a:40,sc:100,az:225},st=g.querySelector('.fxst'),sm=g.querySelector('.fxsm'),set=(c,v)=>{const el=g.querySelector(c);if(+el.value!==+v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};if(st.value!==L.t)st.value=L.t;set('.fxsa',+L.a);set('.fxsc',+L.sc);set('.fxsz',+L.az);if(sm.value!==(sel.md||'wear'))sm.value=sel.md||'wear'}
if(sel&&sel.k=='jitter'){const set=(c,v)=>{const el=g.querySelector(c);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};set('.fxjp',+sel.pos||0);set('.fxjr2',+sel.rot||0);set('.fxjz',+sel.sz||0);g.querySelector('.fxjh').checked=!!sel.fh;g.querySelector('.fxjv').checked=!!sel.fv}
if(sel&&sel.k=='grade')GRL.forEach(([k])=>{const el=g.querySelector('.fxg_'+k),v=+sel[k]||0;if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}});
if(sel){const d=fxDef(sel.k),pane=d&&d.sync&&g.querySelector(`.fxs[data-e="${sel.k}"]`);if(pane)d.sync(pane,sel)}
if(sel&&sel.k=='pressure'){const set=(c,v)=>{const el=g.querySelector(c);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};set('.fxpp',+sel.pst||0);set('.fxpf',+sel.pfl||0)}})}
function init69(){
// the Elements list opens an effect: select its element, show its panel, open that effect's settings
WBX.wbFxOpen=(kind,u)=>{SEL[kind]=u;const pn=KIND_PANEL[kind];if(pn&&WBX.wbOpenPanel)WBX.wbOpenPanel(pn);document.querySelectorAll('.fxl').forEach(x=>x.dataset.k='');fxSync()};
fxRegister('texture',{label:'Texture',kinds:['stamp','text','pattern','paint','motif'],make:()=>{const first=Object.keys(TXN)[0];let x='';if(first){const L=txMake(first,{auto:true});WBS.texLib.push(L);x=L.id}return{k:'texture',on:true,x,sd:txRid(),md:'wear'}}});
fxRegister('pressure',{label:'Pressure offset',kinds:['stamp','pattern'],make:()=>({k:'pressure',on:true,pst:4,pfl:0})});
fxRegister('jitter',{label:'Jitter',kinds:['stamp','text','pattern','motif'],make:()=>({k:'jitter',on:true,pos:20,rot:15,sz:0,sd:txRid()})});
fxRegister('grade',{label:'Colour grade',kinds:['stamp','text','pattern','paint','motif'],make:()=>({k:'grade',on:true,...Object.fromEntries(GRL.map(r=>[r[0],0]))})});
fqRegister();
Object.entries(KIND_PANEL).forEach(([kind,pn])=>{const sec=document.querySelector(`section.pn[data-p="${pn}"]`);if(!sec)return;sec.insertAdjacentHTML('beforeend',fxGroup(kind))});
document.querySelectorAll('.fxg').forEach(g=>{const kind=g.dataset.fxk,tg=()=>fxTarget(kind),cur=()=>{const t=tg();return t?fxOf(t).find(e=>e.u==SEL[kind])||null:null};
g.querySelector('.fxadd').onclick=e=>{e.stopPropagation();e.preventDefault();const t=tg();if(!t)return;const add=d=>()=>{const t2=tg();if(!t2)return;const f=d.make();f.u=fpU();(t2.fx=t2.fx||[]).push(f);SEL[kind]=f.u;fxCh()};
 // effects with a group (Noise, Blur) sit in a flyout under the group's name, at the place of the group's first effect (2.35.0)
 const items=[],grp={};fxFor(kind).forEach(d=>{const it=[d.label,add(d)];if(d.grp){if(!grp[d.grp]){grp[d.grp]=[d.grp,null,false,[]];items.push(grp[d.grp])}grp[d.grp][3].push(it)}else items.push(it)});
 rowMenu(e.currentTarget,items)};
// the declared settings of the filter effects: one listener for every field (data-q) and Reroll (data-qrr)
const pn=g.querySelector('.fxpane');pn.addEventListener('input',ev=>{const el=ev.target.closest('[data-q]');if(!el)return;const ef=cur(),s=el.closest('.fxs');if(!ef||!s||ef.k!==s.dataset.e)return;const v=fqVal(el);if(ef[el.dataset.q]!==v){ef[el.dataset.q]=v;fxCh()}});
pn.addEventListener('change',ev=>{const el=ev.target.closest('[data-q]');if(!el||el.type=='range')return;const ef=cur(),s=el.closest('.fxs');if(!ef||!s||ef.k!==s.dataset.e)return;const v=fqVal(el);if(ef[el.dataset.q]!==v){ef[el.dataset.q]=v;fxCh()}});
pn.addEventListener('click',ev=>{const b=ev.target.closest('[data-qrr]');if(!b)return;const ef=cur(),s=b.closest('.fxs');if(ef&&s&&ef.k===s.dataset.e){ef.sd=txRid();fxCh()}});
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
// a Texture effect owns its settings (2.9.0: there is no Textures tool): its own library entry, copied first when another element or a library texture shares it
const txOwn=e=>{let L=txLib(e.x);const n=WBS.layers.reduce((c,l)=>c+(l.pl||[]).reduce((c2,p)=>c2+fxOf(p).filter(f=>f.k=='texture'&&f.x===e.x).length,0),0);
 if(!L||n>1||!L.auto){const b=L||{t:Object.keys(TXN)[0],a:40,sc:100,az:225};L=txMake(b.t,{a:b.a,sc:b.sc,az:b.az,auto:true});WBS.texLib.push(L);e.x=L.id}return L};
const txSet=(k,v)=>{const e=cur();if(!e||e.k!='texture')return;const L=txOwn(e);if(L[k]===v)return;L[k]=v;fxCh()};
g.querySelector('.fxst').onchange=()=>txSet('t',g.querySelector('.fxst').value);
[['.fxsa','a'],['.fxsc','sc'],['.fxsz','az']].forEach(([c,k])=>g.querySelector(c).addEventListener('input',()=>txSet(k,+g.querySelector(c).value)));
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
