import {TL_AR,tlShape} from './92-pattern-tiling.js';
import {WBS} from './01-launch-and-version.js';
import {CH,CW,geom,shOf} from './04-canvas-and-stamp-outlines.js';
import {mkL} from './06-motif-library-folders.js';
import {ARR} from './09-stamp-items-and-print-runs.js';
import {txRid} from './16-texture-generators.js';
import {fpU} from './24-free-place-layers.js';
import {basicKey} from './76-basic-shapes.js';
import {FQ} from './83-filter-effects.js';

// The arrangements a roll chooses between (data only, no drawing): for each stamp shape a list of [key, name, grid, layout, rule], plus the radial ones.
// A roll picks one and turns it into a Pattern layout (rzArrLay below); keeping the lists as they were keeps every seeded roll the same.
const arrOpts=g=>(ARR[g.SK]||ARR.rect).filter(o=>!(o[4]=='pin'||o[4]=='r90')||Math.abs(g.SW-g.SH)<1);
// Radial arrangements: stamps sit on rings, a spiral, spiral arms, a sunflower seed head or spokes round the middle of the canvas. They are added to
// the Pattern list for every stamp shape but are not part of the random pick (arrOpts), so Randomize keeps giving the arrangements it always did.
const GRAD=[['x-rings','Rings','rings','check','out'],['x-ringu','Rings, upright','rings','check'],['x-spi','Spiral','spiral','cols','out'],['x-spiu','Spiral, upright','spiral','cols'],['x-arm','Spiral arms','arms','cols','out'],['x-armu','Spiral arms, upright','arms','cols'],['x-sun','Sunflower','sunflower','cols','out'],['x-sunu','Sunflower, upright','sunflower','cols'],['x-spk','Spokes','spokes','check','out'],['x-spku','Spokes, upright','spokes','check']];
const gArrAll=g=>arrOpts(g).concat(GRAD);
// ===== Randomize on elements (element update, step 11, 2.1.11): a roll builds Pattern elements (and Paint) with effects, not arrangement layers.
// `o` holds the roll's helpers and switches: {R, pick, ri, rr, ch, pres, jit, tex(): texture uses, grade, sub(k)}.
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const fxP=(pst,pfl)=>({u:fpU(),k:'pressure',on:true,pst,pfl});
const fxJ=(pos,rot,sz)=>({u:fpU(),k:'jitter',on:true,pos,rot,sz,sd:txRid()});
const fxT=u=>({u:fpU(),k:'texture',on:true,x:u.x,sd:u.sd,md:u.md});
const fxG=a=>({u:fpU(),k:'grade',on:true,ex:0,ct:0,hi:0,sh:0,wh:0,bl:0,tp:0,tn:0,sat:0,vib:0,hue:0,fd:0,...a});
// the Pattern layout an old arrangement stands for
function rzArrLay(g,key){const am=gArrAll(g).find(x=>x[0]==key)||[];if(GRAD.some(x=>x[0]==key))return'radial';if(am[3]=='rand')return'scatter';const t=am[2];return t=='brick'||t=='honey'?'brick':t=='drop'||t=='diamond'?'half':'grid'}
const eLayer=(l,pl,st)=>{const n=mkL(l.name,st,'check',180);n.u=l.u;n.free=true;n.pl=pl;n.ak={};n.man=false;n.ov={};n.fit='';n.gap=0;if(l.ink)n.ink=l.ink;if(l.bl)n.bl=l.bl;if(l.op!=null)n.op=l.op;return n};
// 2.57.0: a roll's Grid, Brick and Half-drop become a Tiling of the stamp's own shape: pieces the size of a cell (Size %), the rest of the cell as spacing
const patTileOf=(lay,cn,rn,sz)=>{const cell=Math.min(CW/cn,CH/rn),k=Math.max(.2,Math.min(1,sz/100));return{lay:'tile',ts:'auto',ar:lay=='grid'?'':lay,ps:+Math.max(1,Math.min(60,cell*k/Math.min(CW,CH)*100)).toFixed(1),sp:Math.round(Math.max(0,Math.min(100,(1/k-1)*100)))}};
const patOf=(name,src,lay,cn,rn,sz,fx,sd)=>({u:fpU(),k:'pattern',n:name,lay,cn,rn,sz,...(lay=='grid'||lay=='brick'||lay=='half'?patTileOf(lay,cn,rn,sz):{}),af:1,rt:0,ds:src.length>1?'cycle':'cycle',sd:sd||1+Math.floor(Math.random()*9998),src:src.map(t=>({k:'stamp',t,w:1})),x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:Math.min(CW,CH),r:0,f:1,...(fx.length?{fx}:{})});
// effects on a rolled pattern: Pressure offset, Jitter and Texture each by chance (the switches decide what is allowed)
function rzFx(o,pst,pfl,jp,force){const fx=[];if(pst||pfl)fx.push(fxP(pst||0,pfl||0));if(jp)fx.push(jp);else if(o.jit&&o.ch(.35))fx.push(fxJ(o.ri(4,24),o.ch(.5)?o.ri(4,30):0,o.ch(.4)?o.ri(5,30):0));
if(o.texOn&&o.ch(.35)){const u=o.tex();if(u.length)fx.push(fxT(u[0]))}if(o.gradeOn&&o.ch(.2))fx.push(fxG(o.pick([{fd:o.ri(8,25)},{sat:-o.ri(10,35)},{tp:o.ri(8,30)},{ex:-o.ri(6,18),ct:o.ri(5,18)}])));return fx}
// the main and accent layers of a roll -> element layers. `T` = the rolled tiles.
function rzMainEls(LS,T,o){const out=[];let base=null;
for(const l of LS){const lead=T.find(t=>t.id==(l.lead!=null?l.lead:(l.st||[])[0]));if(!lead){out.push(l);continue}
 const g=geom(shOf(lead)),size=Math.max(40,+l.size||180),lay=l.gl?(base&&base.lay)||'grid':rzArrLay(g,(l.ak||{})[g.SK]);
 let cn=cl(Math.round(CW/size),2,14),rn=cl(Math.round(CH/size),2,20);if(lay=='radial'){cn=o.pick([4,6,8]);rn=cl(Math.round(Math.min(CW,CH)/size),2,6)}
 if(l.gl&&base){cn=base.cn;rn=base.rn}
 const sz=cl(Math.round(100*size/(size+(+l.gap||0))),55,125),jp=l.rsz||l.rgp?fxJ(o.ri(4,18),0,+l.rsz||0):null;
 const p=patOf(l.name,l.st,lay,cn,rn,l.gl?(base?base.sz:sz):sz,rzFx(o,l.pst,l.pfl,jp),null);p.rt=+l.rot||0;
 if(p.lay=='tile'&&!p.ar)p.ar=o.pick(TL_AR[tlShape(p)])[0];   // 2.57.0: an arrangement of the stamp's shape, by chance
 if(l.gl&&base){p.rt=base.rt;const k=l.pa;if(k=='e'){if(o.ch(.5)){p.ox=50;p.oy=0}else{p.ox=0;p.oy=50}}else{p.ox=50;p.oy=50}p.sz=cl(Math.round(base.sz*(k=='c'?.6:.45)),20,100);
  // a Tiling accent: smaller pieces on the base's own lattice (the same step), halfway between its pieces
  if(p.lay=='tile'&&base.lay=='tile'){p.ts=base.ts;p.ar=base.ar;p.ps=+Math.max(1,(+base.ps)*(k=='c'?.6:.45)).toFixed(1);p.sp=Math.round(Math.max(0,Math.min(200,((+base.ps)*(1+(+base.sp||0)/100)/p.ps-1)*100)))}}
 else if(l.ox||l.oy){p.ox=cl(+l.ox||0,0,100);p.oy=cl(+l.oy||0,0,100)}
 if(!l.gl&&!base)base=p;out.push(eLayer(l,[p],l.st))}
return out}
// frame layers -> a Pattern on the Frame layout (the strip stamp is the source; a corner stamp is not used)
function rzFrameEls(FL,T,o){return FL.map(l=>{const t=T.find(x=>x.id==(l.st||[])[0]);if(!t)return l;const rule=(l.name||'').startsWith('Frame rule'),R2=(t.sh&&t.sh.s&&+t.sh.s[0])||8,cn=cl(o.ri(3,6),3,6),rn=cl(Math.round(cn*CH/CW),1,10),
 p=patOf(l.name,[t.id],'frame',cn,rn,rule?40:100,rzFx(o,l.pst,0,null),null);p.in=cl(Math.round(2+(+(l.fr||{}).i||0)*.5+(rule?2:0)),2,12);return eLayer(l,[p],[t.id])})}
// Layout on element layers: type, size, spacing, offset and rotation change the Pattern; scatter, turning and size variation become a Jitter effect
function rzLayoutEls(layers,f,o){const pats=[];layers.forEach(l=>{if(l.free&&l.rz!='free')(l.pl||[]).forEach(p=>{if(p.k=='pattern'&&p.lay!='frame')pats.push(p)})});
pats.forEach((p,i)=>{const set=(k,v)=>{if(v==null)delete p[k];else p[k]=v};
 if(f.type)p.lay=f.rad&&o.ch(.3)?'radial':o.pick(['grid','grid','brick','half','scatter']);
 if(f.size){const s=Math.round(o.rr(i?70:110,i?200:250));p.cn=cl(Math.round(CW/s),2,14);p.rn=cl(Math.round(CH/s),2,20);if(p.lay=='radial'){p.cn=o.pick([4,6,8]);p.rn=cl(Math.round(Math.min(CW,CH)/s),2,6)}}
 if(f.space){p.sz=o.ch(.6)?100:o.ri(70,125);if(p.lay=='tile')p.sp=o.ch(.6)?0:o.ri(5,25)}
 if(f.offset&&p.ox!==50&&p.oy!==50){set('ox',o.ri(0,99));set('oy',o.ri(0,99))}
 if(f.rot)p.rt=f.tilt?o.pick([45,45,30,-30,15,-15,60,90]):0;
 if(f.space||f.rot||f.vary){const fx=(p.fx||[]).filter(e=>e.k!='jitter'),pos=f.scatter||f.gaps?o.ri(8,30):0,rot=f.spread?o.ri(8,60):0,sz=f.sizevar?o.ri(15,45):0;if(pos||rot||sz)fx.push(fxJ(pos,rot,sz));if(fx.length)p.fx=fx;else delete p.fx;p.sd=1+Math.floor(Math.random()*99999)}})}
// Print effects, Impression: Pressure offset on every pattern
function rzPressEls(layers,o){layers.forEach(l=>{if(!l.free||l.rz=='free')return;(l.pl||[]).forEach(p=>{if(p.k!='pattern')return;const fx=(p.fx||[]).filter(e=>e.k!='pressure');if(!o.ch(.5))fx.push(fxP(o.ri(1,6),p.lay=='frame'?0:o.ch(.65)?0:o.ri(1,3)));if(fx.length)p.fx=fx;else delete p.fx})})}
// Print effects, Textures: some patterns get a Texture effect
function rzTexEls(layers,o){layers.forEach(l=>{if(!l.free)return;(l.pl||[]).forEach(p=>{if(p.k!='pattern'||!o.ch(.35))return;const u=o.tex();if(!u.length)return;p.fx=(p.fx||[]).filter(e=>e.k!='texture').concat([fxT(u[0])])})})}
// a new layer: an element layer holding one Pattern of the given stamps (the old arrangement layer is no longer made)
const mkEL=(name,st)=>{const n=mkL(name,st,'check',180);n.free=true;n.ak={};n.man=false;n.ov={};n.fit='';n.gap=0;n.pl=[patOf('Pattern 1',st,'grid',cl(Math.round(CW/180),2,14),cl(Math.round(CH/180),2,20),100,[],null)];return n};
// ===== 2.39.0 (owner Oct 24 2026): the Noise, Blur, Print and Distort effects (2.35.0, 2.36.0) and Filter shapes (2.38.0) in a roll.
// These draw from a number stream of their own, seeded from what the roll built, so everything else a seeded roll makes stays exactly as it was.
// Each effect's settings are drawn from a range that stays printable (a roll never lands on a picture lost in noise or blur); a setting not listed keeps its default.
const RZQ={noise:{amt:[10,40],sz:[10,40]},grain:{amt:[20,50],sz:[15,45],soft:[20,60]},dust:{amt:[15,45],sz:[15,45],scr:[0,40]},blur:{amt:[3,14]},motion:{amt:[8,28],ang:[0,359]},
 halftone:{sz:[15,45],tone:[40,75],ang:[0,90],spr:[20,60]},lines:{sz:[15,40],tone:[40,70],ang:[0,180],spr:[20,60]},stipple:{sz:[10,35],den:[35,70],spr:[50,90]},
 bleed:{amt:[10,35],rag:[10,50],soft:[10,40]},misreg:{amt:[10,35],ang:[0,359],rnd:[0,35]},rough:{amt:[10,35],sz:[15,45]},ripple:{amt:[8,25],wl:[15,50],ang:[0,179]}};
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
 (d.W||[]).forEach(([f])=>{const ts=(WBS.proj&&WBS.proj.ts)||[];e[f]=ts.length?'@'+o.pick(ts):''});   // a colour from the tray
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
export {GRAD,arrOpts,gArrAll,mkEL,fxG,fxJ,fxP,fxT,rzFx,rzFrameEls,rzLayoutEls,rzMainEls,rzPressEls,rzTexEls,rzEffectsEls};
