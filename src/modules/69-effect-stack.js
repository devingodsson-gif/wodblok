import {ICN} from './00-icons.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {rng,tileOn} from './04-canvas-and-stamp-outlines.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {TXMD,TXMN,TXN,txFilt,txImgs,txIsW,txLib,txMake,txRid,txSpecs,txSrc,txThumb} from './16-texture-generators.js';
import {fpU} from './24-free-place-layers.js';
import {elKind,elSel,fxDef,fxFor,fxOf,fxRegister} from './65-element-core.js';
import {patCur} from './67-pattern-element.js';
import {paCur} from './70-paint-element.js';
import {mkWell} from './52-tray-ui.js';
import {FQ,fqRegister,fqVal} from './83-filter-effects.js';
import {tlPane,tlShow} from './86-texture-library.js';
import {pmClose,pmIsOpen,pmPop} from './90-panel-modes.js';

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
const KIND_PANEL={stamp:'stmp',text:'text',pattern:'layers',paint:'elpaint',motif:'motifs',image:'image',sheet:'sheet'};
const SEL={};   // the effect whose settings show, per kind
const fxHx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fxCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
function fxTarget(kind){if(kind=='pattern')return patCur();if(kind=='paint')return paCur();const q=elSel();return q&&elKind(q)==kind?q:null}
// Adds effect k to the element of that kind that is being edited and opens its settings. The + of the Effects group and the Effects menu (2.42.0) both use it. false = nothing to add it to
function fxAddTo(kind,k){const d=fxDef(k),t=fxTarget(kind);if(!d||!t||!d.kinds.includes(kind))return false;const f=d.make();f.u=fpU();(t.fx=t.fx||[]).push(f);SEL[kind]=f.u;fxCh();return true}
// The kind the Effects menu works on: the selected element's kind, when that element takes effects
function fxMenuKind(){const k=elKind(elSel());return k&&fxTarget(k)?k:''}
// The Effects menu's run: add effect k to the selected element and show its settings in the element's panel
function fxMenuAdd(k){const kind=fxMenuKind();if(!kind||!fxAddTo(kind,k))return false;if(WBX.wbFxOpen)WBX.wbFxOpen(kind,SEL[kind]);return true}
// The list (2.3.0, Photoshop's layer effects): one row per effect (eye, name, ⋯), drag to reorder; the open effect's settings show right under its row.
// Add effect, a full-width button at the top of the group like Add sheet (2.70.0; it was a + in the title), adds one. Rows before the open one and the open row are in .fxl, the settings follow, the rest are in .fxl2.
const FXI={eye:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.eye+'</svg>',
 off:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.eyeOff+'</svg>',
 more:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.more+'</svg>',
 car:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.chevR+'</svg>'};
function fxGroup(kind){return`<details class="g fxg" data-fxk="${kind}" open hidden><summary>Effects</summary><div class="gb">
<div class="row fxar"><button type="button" class="alt fxadd" aria-haspopup="menu" data-more>Add effect</button></div><div class="fxl"></div><div class="fxpane">
<div class="fxs" data-e="texture" hidden>
<div class="rprow fxtr"><span class="rpth"></span><span class="rpn"></span><button type="button" class="alt rpgo" aria-haspopup="dialog">Replace</button></div>
<div class="fxtl" hidden>${tlPane()}</div>
<div class="ctl"><label>Strength</label><input type="range" class="fxsa" min="0" max="100" value="40" data-def="40"></div>
<div class="ctl"><label>Scale</label><input type="range" class="fxsc" min="25" max="200" value="100" data-u="%" data-def="100"></div>
<div class="ctl"><label>Rotate</label><input type="range" class="fxsr" min="0" max="359" value="0" data-u="&#176;" data-def="0"></div>
<label class="chk"><input type="checkbox" class="fxsfh"><span>Flip across</span></label>
<label class="chk"><input type="checkbox" class="fxsfv"><span>Flip down</span></label>
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
// 2.55.0: a group's settings pane (.fxpane) can be lent to the effect pop-out (91-effect-popout.js); the group finds its controls there too
const fxPaneOf=g=>g._pane||(g._pane=g.querySelector('.fxpane'));
const gQ=(g,s)=>g.querySelector(s)||fxPaneOf(g).querySelector(s);
function fxSync(){if(!WBS.layers||!WBS.proj)return;document.querySelectorAll('.fxg').forEach(g=>{const kind=g.dataset.fxk,t=fxTarget(kind);if(g.hidden!==!t)g.hidden=!t;if(!t)return;const list=fxOf(t),sel=list.find(e=>e.u==SEL[kind])||null;
// 2.55.0 (owner Oct 26 2026): with no effects the group is only its title and +, with no fold arrow
if(g.classList.contains('fxnone')!==!list.length){g.classList.toggle('fxnone',!list.length);if(list.length)g.open=true}
const key=JSON.stringify([t.u||'x',list.map(e=>[e.u,e.k,e.on,e.x,e.md]),sel&&sel.u]);
const host=gQ(g,'.fxl'),host2=gQ(g,'.fxl2');if(host.dataset.k!==key){host.dataset.k=key;
const row=e=>{const d=fxDef(e.k),on=e.on!==false,op=sel&&e.u==sel.u;return`<div class="fxr${op?' on':''}${on?'':' off'}" data-fu="${e.u}" draggable="true"><button type="button" class="ib" data-fon aria-pressed="${on}" aria-label="${on?'Hide':'Show'} this effect">${on?FXI.eye:FXI.off}</button><span class="fxc${op?' open':''}">${FXI.car}</span><b>${fxHx(d?d.label:e.k)}</b><button type="button" class="ib" data-fmore aria-haspopup="menu" aria-label="More">${FXI.more}</button></div>`};
const si=sel?list.indexOf(sel):list.length-1;host.innerHTML=list.slice(0,si+1).map(row).join('');host2.innerHTML=list.slice(si+1).map(row).join('');}
fxPaneOf(g).querySelectorAll('.fxs').forEach(s=>{const on=!!sel&&s.dataset.e==sel.k;if(s.hidden===on)s.hidden=!on});
if(sel&&sel.k=='texture'){const L=txLib(sel.x)||{t:Object.keys(TXN)[0],a:40,sc:100,az:225},sm=gQ(g,'.fxsm'),set=(c,v)=>{const el=gQ(g,c);if(+el.value!==+v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};set('.fxsa',+L.a);set('.fxsc',+L.sc);set('.fxsr',+L.rot||0);set('.fxsz',+L.az);gQ(g,'.fxsfh').checked=!!L.fh;gQ(g,'.fxsfv').checked=!!L.fv;if(sm.value!==(sel.md||'wear'))sm.value=sel.md||'wear';
 // 2.50.0: the texture is picked from the texture library; 2.55.0 (creating and editing, docs/panel-modes-plan.md): an effect is always being edited, so its texture
 // shows as a row (thumbnail, name, Replace) and the library opens from Replace in a popover; the library keeps its place on the group while it is moved
 {const tl=g._fxtl||(g._fxtl=gQ(g,'.fxtl')),row=gQ(g,'.fxtr');tlShow(tl,L.t,id=>{if(WBX.wbFxTexSet)WBX.wbFxTexSet(kind,'t',id);pmClose()});
  const th=txThumb(L.t),rk=L.t+(th?'+':'');if(row&&row.dataset.key!==rk){row.dataset.key=rk;const e=txSrc(L.t);row.querySelector('.rpth').innerHTML=th?`<img src="${th}" alt="" draggable="false">`:'';row.querySelector('.rpn').textContent=e?e.n:'Texture'}
  if(row&&!row.dataset.w){row.dataset.w=1;row.querySelector('.rpgo').onclick=ev=>{ev.stopPropagation();const b=ev.currentTarget;if(pmIsOpen(b)){pmClose();return}tl.hidden=false;pmPop(b,tl,'')}}}}
if(sel&&sel.k=='jitter'){const set=(c,v)=>{const el=gQ(g,c);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};set('.fxjp',+sel.pos||0);set('.fxjr2',+sel.rot||0);set('.fxjz',+sel.sz||0);gQ(g,'.fxjh').checked=!!sel.fh;gQ(g,'.fxjv').checked=!!sel.fv}
if(sel&&sel.k=='grade')GRL.forEach(([k])=>{const el=gQ(g,'.fxg_'+k),v=+sel[k]||0;if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}});
if(sel){const d=fxDef(sel.k),pane=d&&d.sync&&gQ(g,`.fxs[data-e="${sel.k}"]`);if(pane)d.sync(pane,sel)}
if(sel&&sel.k=='pressure'){const set=(c,v)=>{const el=gQ(g,c);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};set('.fxpp',+sel.pst||0);set('.fxpf',+sel.pfl||0)}})}
function init69(){
document.addEventListener('click',e=>{const sm=e.target.closest&&e.target.closest('.fxg.fxnone>summary');if(sm)e.preventDefault()},true);
// the Elements list opens an effect: select its element, show its panel, open that effect's settings
// 2.55.0: the effect pop-out opens an effect's settings without showing the panel
WBX.wbFxSel=(kind,u)=>{SEL[kind]=u;document.querySelectorAll('.fxl').forEach(x=>x.dataset.k='');fxSync()};
WBX.wbFxOpen=(kind,u)=>{SEL[kind]=u;const pn=KIND_PANEL[kind];if(pn&&WBX.wbOpenPanel)WBX.wbOpenPanel(pn);document.querySelectorAll('.fxl').forEach(x=>x.dataset.k='');fxSync()};
fxRegister('texture',{label:'Texture',kinds:['stamp','text','pattern','paint','motif','image','sheet'],make:()=>{const first=Object.keys(TXN)[0];let x='';if(first){const L=txMake(first,{auto:true});WBS.texLib.push(L);x=L.id}return{k:'texture',on:true,x,sd:txRid(),md:'wear'}}});
fxRegister('pressure',{label:'Pressure offset',kinds:['stamp','pattern'],make:()=>({k:'pressure',on:true,pst:4,pfl:0})});
fxRegister('jitter',{label:'Jitter',kinds:['stamp','text','pattern','motif'],make:()=>({k:'jitter',on:true,pos:20,rot:15,sz:0,sd:txRid()})});
fxRegister('grade',{label:'Colour grade',kinds:['stamp','text','pattern','paint','motif','image','sheet'],make:()=>({k:'grade',on:true,...Object.fromEntries(GRL.map(r=>[r[0],0]))})});
fqRegister();
Object.entries(KIND_PANEL).forEach(([kind,pn])=>{const sec=document.querySelector(`section.pn[data-p="${pn}"]`);if(!sec)return;sec.insertAdjacentHTML('beforeend',fxGroup(kind))});
document.querySelectorAll('.fxg').forEach(g=>{const kind=g.dataset.fxk,tg=()=>fxTarget(kind),cur=()=>{const t=tg();return t?fxOf(t).find(e=>e.u==SEL[kind])||null:null};
gQ(g,'.fxadd').onclick=e=>{e.stopPropagation();e.preventDefault();const t=tg();if(!t)return;const add=d=>()=>fxAddTo(kind,d.k);
 // effects with a group (Noise, Blur) sit in a flyout under the group's name, at the place of the group's first effect (2.35.0)
 const items=[],grp={};fxFor(kind).forEach(d=>{const it=[d.label,add(d)];if(d.grp){if(!grp[d.grp]){grp[d.grp]=[d.grp,null,false,[]];items.push(grp[d.grp])}grp[d.grp][3].push(it)}else items.push(it)});
 rowMenu(e.currentTarget,items)};
// the declared settings of the filter effects: one listener for every field (data-q) and Reroll (data-qrr)
const pn=gQ(g,'.fxpane');pn.addEventListener('input',ev=>{const el=ev.target.closest('[data-q]');if(!el)return;const ef=cur(),s=el.closest('.fxs');if(!ef||!s||ef.k!==s.dataset.e)return;const v=fqVal(el);if(ef[el.dataset.q]!==v){ef[el.dataset.q]=v;fxCh()}});
pn.addEventListener('change',ev=>{const el=ev.target.closest('[data-q]');if(!el||el.type=='range')return;const ef=cur(),s=el.closest('.fxs');if(!ef||!s||ef.k!==s.dataset.e)return;const v=fqVal(el);if(ef[el.dataset.q]!==v){ef[el.dataset.q]=v;fxCh()}});
// a colour field of an effect is a tray colour well. Its declaration [field, label, default entry, default colour] says what empty means:
// a default entry ('Same ink', Misregistration) allows '' = the element's ink; null (Threshold's Dark and Light) has none, and an empty field shows the default colour
pn.querySelectorAll('[data-qw]').forEach(h=>{const f=h.dataset.qw,k=h.closest('.fxs').dataset.e,ef=()=>{const x=WBS.layers?cur():null;return x&&x.k===k?x:null},w=((FQ[k]&&FQ[k].W)||[]).find(x=>x[0]==f)||[f,'','Same ink',''];
 mkWell(h,{label:h.previousElementSibling.textContent,what:'Effect',...(w[2]?{def:w[2],defRef:()=>WBS.proj?WBS.proj.ink:''}:{defRef:()=>w[3]}),get:()=>{const x=ef();return x&&x[f]||''},set:v=>{const x=ef();if(!x)return;v=v||(w[2]?'':w[3]);if((x[f]||'')!==v){x[f]=v;fxCh()}}})});
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
 if(!L||n>1||!L.auto){const b=L||{t:Object.keys(TXN)[0],a:40,sc:100,az:225};L=txMake(b.t,{a:b.a,sc:b.sc,az:b.az,rot:+b.rot||0,fh:b.fh?1:0,fv:b.fv?1:0,auto:true});WBS.texLib.push(L);e.x=L.id}return L};
const txSet=(k,v)=>{const e=cur();if(!e||e.k!='texture')return;const L=txOwn(e);if(L[k]===v)return;L[k]=v;fxCh()};
// a tile of the library picks the texture (the library calls this for the panel it is in)
(WBX.wbFxTexSets=WBX.wbFxTexSets||{})[kind]=txSet;
[['.fxsa','a'],['.fxsc','sc'],['.fxsr','rot'],['.fxsz','az']].forEach(([c,k])=>gQ(g,c).addEventListener('input',()=>txSet(k,+gQ(g,c).value)));
[['.fxsfh','fh'],['.fxsfv','fv']].forEach(([c,k])=>gQ(g,c).onchange=()=>txSet(k,gQ(g,c).checked?1:0));
gQ(g,'.fxsm').onchange=()=>{const e=cur();if(e){e.md=gQ(g,'.fxsm').value;fxCh()}};
gQ(g,'.fxrr').onclick=()=>{const e=cur();if(e){e.sd=txRid();fxCh()}};
GRL.forEach(([k])=>gQ(g,'.fxg_'+k).addEventListener('input',()=>{const e=cur();if(!e||e.k!='grade')return;const v=+gQ(g,'.fxg_'+k).value;if(e[k]!==v){e[k]=v;fxCh()}}));
[['.fxjp','pos'],['.fxjr2','rot'],['.fxjz','sz']].forEach(([c,f])=>gQ(g,c).addEventListener('input',()=>{const e=cur();if(!e||e.k!='jitter')return;const v=+gQ(g,c).value;if(e[f]!==v){e[f]=v;fxCh()}}));
[['.fxjh','fh'],['.fxjv','fv']].forEach(([c,f])=>gQ(g,c).onchange=()=>{const e=cur();if(e&&e.k=='jitter'){e[f]=gQ(g,c).checked;fxCh()}});
gQ(g,'.fxjrr').onclick=()=>{const e=cur();if(e&&e.k=='jitter'){e.sd=txRid();fxCh()}};
[['.fxpp','pst'],['.fxpf','pfl']].forEach(([c,f])=>gQ(g,c).addEventListener('input',()=>{const e=cur();if(!e||e.k!='pressure')return;const v=+gQ(g,c).value;if(e[f]!==v){e[f]=v;fxCh()}}))});
WBX.wbFxSync=fxSync;WBX.wbFxTexSet=(kind,k,v)=>{const f=WBX.wbFxTexSets&&WBX.wbFxTexSets[kind];if(f)f(k,v)}}
// a text's Jitter is rolled per letter: letter i of text p gets its own seed, and the size it moves by is the font size
const fxJitL=(p,i,fs)=>fxJit({u:p.u+'#'+i,s:fs,fx:p.fx});
export {fxAddTo,fxMenuAdd,fxMenuKind,fxGr,fxJit,fxJitL,fxPad,fxPress,fxSync,fxTex,fxTexUses,init69};
