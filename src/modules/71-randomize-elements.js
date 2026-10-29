import {WBS} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {mkL} from './06-motif-library-folders.js';
import {txRid} from './16-texture-generators.js';
import {fpU} from './24-free-place-layers.js';
import {basicKey} from './76-basic-shapes.js';
import {FQ} from './83-filter-effects.js';

// ===== Randomize on elements (element update, step 11, 2.1.11): the makers a roll's elements share. 2.76.3: the old roll's layers-to-elements code is gone with it;
// what is left: a Pattern element (patOf), the Pressure offset and Jitter effects, a new layer with one Pattern (mkEL), and the effects a roll gives (rzEffectsEls).
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const fxP=(pst,pfl)=>({u:fpU(),k:'pressure',on:true,pst,pfl});
const fxJ=(pos,rot,sz)=>({u:fpU(),k:'jitter',on:true,pos,rot,sz,sd:txRid()});
// 2.57.0: a roll's Grid, Brick and Half-drop become a Tiling of the stamp's own shape: pieces the size of a cell (Size %), the rest of the cell as spacing
const patTileOf=(lay,cn,rn,sz)=>{const cell=Math.min(CW/cn,CH/rn),k=Math.max(.2,Math.min(1,sz/100));return{lay:'tile',ts:'auto',ar:lay=='grid'?'':lay,ps:+Math.max(1,Math.min(60,cell*k/Math.min(CW,CH)*100)).toFixed(1),sp:Math.round(Math.max(0,Math.min(100,(1/k-1)*100)))}};
const patOf=(name,src,lay,cn,rn,sz,fx,sd)=>({u:fpU(),k:'pattern',n:name,lay,cn,rn,sz,...(lay=='grid'||lay=='brick'||lay=='half'?patTileOf(lay,cn,rn,sz):{}),af:1,rt:0,ds:src.length>1?'cycle':'cycle',sd:sd||1+Math.floor(Math.random()*9998),src:src.map(t=>({k:'stamp',t,w:1})),x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:Math.min(CW,CH),r:0,f:1,...(fx.length?{fx}:{})});
// a new layer: an element layer holding one Pattern of the given stamps (the old arrangement layer is no longer made)
const mkEL=(name,st)=>{const n=mkL(name,st,'check',180);n.free=true;n.ak={};n.man=false;n.ov={};n.fit='';n.gap=0;n.pl=[patOf('Pattern 1',st,'grid',cl(Math.round(CW/180),2,14),cl(Math.round(CH/180),2,20),100,[],null)];return n};
// ===== 2.39.0 (owner Oct 24 2026): the Noise, Blur, Print and Distort effects (2.35.0, 2.36.0) and Filter shapes (2.38.0) in a roll.
// These draw from a number stream of their own, seeded from what the roll built, so everything else a seeded roll makes stays exactly as it was.
// Each effect's settings are drawn from a range that stays printable (a roll never lands on a picture lost in noise or blur); a setting not listed keeps its default.
const RZQ={noise:{amt:[10,40],sz:[10,40]},grain:{amt:[20,50],sz:[15,45],soft:[20,60]},dust:{amt:[15,45],sz:[15,45],scr:[0,40]},blur:{amt:[3,14]},motion:{amt:[8,28],ang:[0,359]},
 halftone:{sz:[15,45],tone:[40,75],ang:[0,90],spr:[20,60]},lines:{sz:[15,40],tone:[40,70],ang:[0,180],spr:[20,60]},stipple:{sz:[10,35],den:[35,70],spr:[50,90]},
 bleed:{amt:[10,35],rag:[10,50],soft:[10,40]},misreg:{amt:[10,35],ang:[0,359],rnd:[0,35]},thresh:{lv:[35,65],edge:[35,65],soft:[0,30]},rough:{amt:[10,35],sz:[15,45]},ripple:{amt:[8,25],wl:[15,50],ang:[0,179]},wobble:{amt:[10,30],sz:[25,60]},warp:{amt:[10,30],sz:[30,65]},slip:{amt:[8,25],bh:[15,50],ang:[0,179]}};
// the Randomize kinds (the panel's ticks) -> the effect menu's groups, with how often each comes up
const RZG={noise:['Noise',1.2],blur:['Blur',.6],print:['Print',1],distort:['Distort',.6]};
// what a Filter shape does when no effect group is ticked: a gentle colour grade
const RZFG=[{sat:-100},{sat:-45,fd:30},{tp:30,fd:20,sat:-20},{ct:25,sat:20},{tp:-30,ct:15}];
const RZFK=['ellipse','ellipse','heart','star','hex','dia','rrect'];
const rzRng=str=>{let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}let a=h>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
// one effect of kind k with drawn settings
function rzQ(k,o){const d=FQ[k],r=RZQ[k]||{},e={u:o.id(),k,on:true};
 (d.P||[]).forEach(([f,,,,v])=>{const g=r[f];e[f]=g?o.ri(g[0],g[1]):v});
 (d.S||[]).forEach(([f,,opts])=>{const xs=opts.map(x=>x[0]).filter(x=>x!='same');e[f]=o.pick(xs)});
 (d.C||[]).forEach(([f,,v])=>{e[f]=o.ch(.75)?v:!v});
 {const ts=(WBS.proj&&WBS.proj.ts)||[],own=(d.W||[]).filter(w=>w[2]===null);   // a colour from the tray; wells with no default entry (Threshold) keep their defaults or take different tray colours
 (d.W||[]).forEach(([f,,dl])=>{if(dl!==null)e[f]=ts.length?'@'+o.pick(ts):''});
 if(own.length){const left=[...ts],tray=ts.length>=own.length&&o.ch(.5);own.forEach(([f,,,v])=>{e[f]=tray?'@'+left.splice(o.ri(0,left.length-1),1)[0]:v})}}
 if(d.seed)e.sd=o.ri(1,99999);return e}
// one effect from the ticked groups (a group by its weight, then any effect in it)
function rzQPick(groups,o){const g=o.wpick(groups.map(k=>[k,RZG[k][1]])),ks=Object.keys(FQ).filter(k=>FQ[k].grp==RZG[g][0]);return rzQ(o.pick(ks),o)}
// els: the project's element list (top last). opt: {seed, groups (ticked kinds), filter (Filter shapes ticked), rework (change the effects of every element, not only
// the roll's new ones), isNew(q), prev (ids of the Filter shapes the last roll made: a roll replaces them), only (Effects is the only switch on: something must change)}
function rzEffectsEls(L,opt){const R=rzRng(opt.seed),n0=Date.now().toString(36);let nid=0;
 const o={R,ri:(a,b)=>a+Math.floor(R()*(b-a+1)),rr:(a,b)=>a+R()*(b-a),ch:p=>R()<p,pick:a=>a[Math.floor(R()*a.length)],id:()=>'p'+n0+'e'+(++nid)+Math.floor(R()*1e4).toString(36)};
 o.wpick=w=>{let t=R()*w.reduce((x,y)=>x+y[1],0);for(const x of w){if((t-=x[1])<=0)return x[0]}return w[0][0]};
 const all=L.flatMap(l=>l.pl||[]),isQ=e=>!!FQ[e.k],tg=[],changed={n:0};
 // the last roll's Filter shapes go; a rework clears the effects a roll can give
 if(opt.prev&&opt.prev.size)L.forEach(l=>{if(l.pl)l.pl=l.pl.filter(q=>!((q.flt||q.k=='sheet'&&!q.bgd)&&opt.prev.has(String(q.u))))});
 all.forEach(q=>{if(q.bgd||q.flt||!['pattern','stamp','motif','paint'].includes(q.k))return;if(!opt.rework&&!opt.isNew(q))return;
  if(opt.rework&&q.fx){const fx=q.fx.filter(e=>!isQ(e));if(fx.length)q.fx=fx;else delete q.fx}tg.push(q)});
 const put=(q,e)=>{q.fx=(q.fx||[]).concat([e]);changed.n++};
 // effects on elements: none, one or two of the roll's elements, the main pattern most often
 if(opt.groups.length&&tg.length){let n=o.wpick([[0,.35],[1,.45],[2,.2]]);if(!n&&opt.only&&!opt.filter)n=1;
  const pats=tg.filter(q=>q.k=='pattern'),order=[];if(pats.length&&o.ch(.6))order.push(pats[0]);
  tg.slice().sort(()=>R()-.5).forEach(q=>{if(!order.includes(q))order.push(q)});order.slice(0,n).forEach(q=>put(q,rzQPick(opt.groups,o)))}
 // a filter on top: over the whole canvas most often (a Sheet with no fill, 2.53.0), otherwise a Filter shape round the middle
 if(opt.filter&&(o.ch(.4)||(opt.only&&!changed.n))){const full=o.ch(.6),k=full?'rect':o.pick(RZFK),m=basicKey(k)||basicKey('rect');
  if(m){const S=Math.min(CW,CH)*o.rr(.5,.85),fx=opt.groups.length?[rzQPick(opt.groups,o)]:[{u:o.id(),k:'grade',on:true,ex:0,ct:0,hi:0,sh:0,wh:0,bl:0,tp:0,tn:0,sat:0,vib:0,hue:0,fd:0,...o.pick(RZFG)}];
   const q=full?{u:o.id(),k:'sheet',n:'Filter',fl:'none'}
    :{u:o.id(),k:'motif',m,x:+(CW/2+o.rr(-.12,.12)*CW).toFixed(1),y:+(CH/2+o.rr(-.12,.12)*CH).toFixed(1),s:+S.toFixed(1),r:k=='heart'||o.ch(.6)?0:o.pick([15,-15,30,45]),f:1};
   const top=L[L.length-1];if(top){if(!full){q.nm='Filter';q.flt=1}q.fx=fx;top.pl=(top.pl||[]).concat([q]);changed.n++}}}
 return changed.n}
export {mkEL,patOf,fxJ,fxP,rzEffectsEls};
