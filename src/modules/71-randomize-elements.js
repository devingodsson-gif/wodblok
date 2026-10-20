import {CH,CW,geom,shOf} from './04-canvas-and-stamp-outlines.js';
import {mkL} from './06-motif-library-folders.js';
import {ARR} from './09-stamp-items-and-print-runs.js';
import {txRid} from './16-texture-generators.js';
import {fpU} from './24-free-place-layers.js';

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
const patOf=(name,src,lay,cn,rn,sz,fx,sd)=>({u:fpU(),k:'pattern',n:name,lay,cn,rn,sz,rt:0,ds:src.length>1?'cycle':'cycle',sd:sd||1+Math.floor(Math.random()*9998),src:src.map(t=>({k:'stamp',t,w:1})),x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:Math.min(CW,CH),r:0,f:1,...(fx.length?{fx}:{})});
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
 if(l.gl&&base){p.rt=base.rt;const k=l.pa;if(k=='e'){if(o.ch(.5)){p.ox=50;p.oy=0}else{p.ox=0;p.oy=50}}else{p.ox=50;p.oy=50}p.sz=cl(Math.round(base.sz*(k=='c'?.6:.45)),20,100)}
 else if(l.ox||l.oy){p.ox=cl(+l.ox||0,0,100);p.oy=cl(+l.oy||0,0,100)}
 if(!l.gl&&!base)base=p;out.push(eLayer(l,[p],l.st))}
return out}
// frame layers -> a Pattern on the Frame layout (the strip stamp is the source; a corner stamp is not used)
function rzFrameEls(FL,T,o){return FL.map(l=>{const t=T.find(x=>x.id==(l.st||[])[0]);if(!t)return l;const rule=(l.name||'').startsWith('Frame rule'),R2=(t.sh&&t.sh.s&&+t.sh.s[0])||8,cn=cl(o.ri(3,6),3,6),rn=cl(Math.round(cn*CH/CW),1,10),
 p=patOf(l.name,[t.id],'frame',cn,rn,rule?40:100,rzFx(o,l.pst,0,null),null);p.in=cl(Math.round(2+(+(l.fr||{}).i||0)*.5+(rule?2:0)),2,12);return eLayer(l,[p],[t.id])})}
// Sheet: paper, with a Texture (and sometimes a Colour grade) effect
function rzSheet(prev,texUses,o){const sh={...(prev||{u:fpU(),k:'sheet',n:'Sheet',o:100})};let fx=(sh.fx||[]).slice();if(texUses)fx=fx.filter(e=>e.k!='texture').concat(texUses.map(fxT));
if(o.gradeOn&&o.ch(.25)&&!fx.some(e=>e.k=='grade'))fx.push(fxG({fd:o.ri(5,22),tp:o.ri(-20,24)}));if(fx.length)sh.fx=fx;else delete sh.fx;return sh}
// Layout on element layers: type, size, spacing, offset and rotation change the Pattern; scatter, turning and size variation become a Jitter effect
function rzLayoutEls(layers,f,o){const pats=[];layers.forEach(l=>{if(l.free&&l.rz!='free')(l.pl||[]).forEach(p=>{if(p.k=='pattern'&&p.lay!='frame')pats.push(p)})});
pats.forEach((p,i)=>{const set=(k,v)=>{if(v==null)delete p[k];else p[k]=v};
 if(f.type)p.lay=f.rad&&o.ch(.3)?'radial':o.pick(['grid','grid','brick','half','scatter']);
 if(f.size){const s=Math.round(o.rr(i?70:110,i?200:250));p.cn=cl(Math.round(CW/s),2,14);p.rn=cl(Math.round(CH/s),2,20);if(p.lay=='radial'){p.cn=o.pick([4,6,8]);p.rn=cl(Math.round(Math.min(CW,CH)/s),2,6)}}
 if(f.space)p.sz=o.ch(.6)?100:o.ri(70,125);
 if(f.offset&&p.ox!==50&&p.oy!==50){set('ox',o.ri(0,99));set('oy',o.ri(0,99))}
 if(f.rot)p.rt=f.tilt?o.pick([45,45,30,-30,15,-15,60,90]):0;
 if(f.space||f.rot||f.vary){const fx=(p.fx||[]).filter(e=>e.k!='jitter'),pos=f.scatter||f.gaps?o.ri(8,30):0,rot=f.spread?o.ri(8,60):0,sz=f.sizevar?o.ri(15,45):0;if(pos||rot||sz)fx.push(fxJ(pos,rot,sz));if(fx.length)p.fx=fx;else delete p.fx;p.sd=1+Math.floor(Math.random()*99999)}})}
// Print effects, Impression: Pressure offset on every pattern
function rzPressEls(layers,o){layers.forEach(l=>{if(!l.free||l.rz=='free')return;(l.pl||[]).forEach(p=>{if(p.k!='pattern')return;const fx=(p.fx||[]).filter(e=>e.k!='pressure');if(!o.ch(.5))fx.push(fxP(o.ri(1,6),p.lay=='frame'?0:o.ch(.65)?0:o.ri(1,3)));if(fx.length)p.fx=fx;else delete p.fx})})}
// Print effects, Textures: some patterns get a Texture effect
function rzTexEls(layers,o){layers.forEach(l=>{if(!l.free)return;(l.pl||[]).forEach(p=>{if(p.k!='pattern'||!o.ch(.35))return;const u=o.tex();if(!u.length)return;p.fx=(p.fx||[]).filter(e=>e.k!='texture').concat([fxT(u[0])])})})}
// a new layer: an element layer holding one Pattern of the given stamps (the old arrangement layer is no longer made)
const mkEL=(name,st)=>{const n=mkL(name,st,'check',180);n.free=true;n.ak={};n.man=false;n.ov={};n.fit='';n.gap=0;n.pl=[patOf('Pattern 1',st,'grid',cl(Math.round(CW/180),2,14),cl(Math.round(CH/180),2,20),100,[],null)];return n};
export {GRAD,arrOpts,gArrAll,mkEL,fxG,fxJ,fxP,fxT,rzFx,rzFrameEls,rzLayoutEls,rzMainEls,rzPressEls,rzSheet,rzTexEls};
