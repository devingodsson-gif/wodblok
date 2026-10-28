import {txRid} from './16-texture-generators.js';
import {WBX} from './01-launch-and-version.js';
import {col} from './04-canvas-and-stamp-outlines.js';
import {fxRegister} from './65-element-core.js';

// 2.36.0 adds Print (Halftone moves in, with Line Screen, Stipple, Ink Bleed, Misregistration) and Distort (Roughen, Ripple).
// ===== Noise, Blur and Halftone effects (2.35.0, owner: "the top noise and blurs from Photoshop", in a Noise › and a Blur › flyout; and Halftone).
// Each is one SVG filter on the element, in the element's own units, for a box b {x, y, W, H} (the element's box with room round it, from fxPad).
// filt(e, id, b) returns {defs, wrap(markup)} or null; the effect stack (69) chains them in list order with the Colour grade.
// Settings are declared: P ranges [field, label, min, max, default, unit], S selects [field, label, [[value, name]...], default], C checks [field, label, default];
// seed: true adds a Reroll button and an `sd` field. Sizes scale with the element, so an effect looks the same on a small and a large one.
const FQK=['stamp','text','pattern','paint','motif','sheet'];
const q4=n=>+(+n).toFixed(4);
const fqClamp=(v,a,b,d)=>{v=+v;return Number.isFinite(v)?Math.max(a,Math.min(b,v)):d};
const fqFilter=(id,x,y,w,h,body)=>`<filter id="${id}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="${q4(x)}" y="${q4(y)}" width="${q4(w)}" height="${q4(h)}" color-interpolation-filters="sRGB">${body}</filter>`;
const fqWrap=id=>c=>`<g filter="url(#${id})">${c}</g>`;
// an effect that works along one direction runs in a turned frame: turn the element back inside, so only the effect is turned
const fqTurn=(id,a,cx,cy)=>c=>`<g transform="rotate(${q4(a)} ${q4(cx)} ${q4(cy)})"><g filter="url(#${id})"><g transform="rotate(${q4(-a)} ${q4(cx)} ${q4(cy)})">${c}</g></g></g>`;
const fqSize=b=>Math.max(1e-6,Math.max(b.W,b.H)/1.3);   // the element's own size (fxPad adds 15% each side)
const fqSeed=e=>Math.abs(e.sd|0)%100000;
// the i-th number (0 to 1) of a seed's own sequence
const fqRnd=(sd,i)=>{const x=Math.sin((sd+1)*12.9898+i*78.233)*43758.5453;return x-Math.floor(x)};
const fqPar=(e,f,a,b,d)=>fqClamp(e[f]==null?d:e[f],a,b,d);
// noise in R, G, B (or R copied to all three when mono), alpha 1
const fqMono='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1',fqRGB='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1';
const fqLin=(k,res,inp)=>`<feComponentTransfer in="${inp}" result="${res}">${['R','G','B'].map(c=>`<feFunc${c} type="linear" slope="${q4(k)}" intercept="${q4(.5-.5*k)}"/>`).join('')}</feComponentTransfer>`;
// add (noise - 0.5) times amp to the element's colour, kept to the element's ink
const fqAdd=(inp,amp)=>`<feComposite in="SourceGraphic" in2="${inp}" operator="arithmetic" k1="0" k2="1" k3="${q4(amp)}" k4="${q4(-amp/2)}" result="fqm"/><feComposite in="fqm" in2="SourceAlpha" operator="in"/>`;
// a cut: alpha 1 where the alpha channel is at or above t
const fqCut=(t,inp,res)=>{const N=50,v=[];for(let i=0;i<N;i++)v.push(i/N>=t?1:0);return`<feComponentTransfer in="${inp}" result="${res}"><feFuncA type="discrete" tableValues="${v.join(' ')}"/></feComponentTransfer>`};
const fqToA=(inp,res)=>`<feColorMatrix in="${inp}" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="${res}"/>`;
// one halftone cell: light in the middle, dark at the corners (tiled, it is a grid of cones)
const FQ_CELL='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><radialGradient id="g" cx=".5" cy=".5" r=".7071"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><rect width="64" height="64" fill="url(#g)"/></svg>`);
// a line-screen cell: a bright line across the middle, dark above and below
const FQ_LINE='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><rect width="64" height="64" fill="url(#g)"/></svg>`);
// a ripple cell: one wave in the red channel (128 = no move in green)
const FQ_WAVE='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">${Array.from({length:17},(_,i)=>`<stop offset="${i/16}" stop-color="rgb(${Math.round(127.5+127.5*Math.sin(i/16*2*Math.PI))},128,128)"/>`).join('')}</linearGradient><rect width="64" height="64" fill="url(#g)"/></svg>`);
// Slip's displacement picture: n bands of uneven height, each a sideways push (red; green stays at no push), about a third of them none. Kept for the last few seeds.
const FQ_SLIP=new Map();
function fqSlipMap(sd,n){const k=sd+':'+n;let u=FQ_SLIP.get(k);if(u)return u;
 const w=Array.from({length:n},(_,i)=>.5+fqRnd(sd,100+i)),t=w.reduce((x,y)=>x+y,0);let y=0,r='';
 w.forEach((x,i)=>{const hh=x/t,v=fqRnd(sd,200+i)<.35?0:fqRnd(sd,300+i)*2-1;r+=`<rect y="${q4(y)}" width="1" height="${q4(hh+.002)}" fill="rgb(${Math.round(127.5+127.5*v)},128,128)"/>`;y+=hh});
 u='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none" shape-rendering="crispEdges">${r}</svg>`);
 if(FQ_SLIP.size>40)FQ_SLIP.delete(FQ_SLIP.keys().next().value);FQ_SLIP.set(k,u);return u}
// Filter mode (2.38.0): q.__fm {paper} is set when the effect works on the picture under a filter shape. The effects that read an outline read darkness instead:
// the picture blurred, 1 - its brightness, as a grey with alpha 1; and what would be a gap shows the paper colour.
const fqFm=q=>q&&q.__fm||null;
const fqDark=(inp,res)=>`<feColorMatrix in="${inp}" type="matrix" values="-.2126 -.7152 -.0722 0 1 -.2126 -.7152 -.0722 0 1 -.2126 -.7152 -.0722 0 1 0 0 0 0 1" result="${res}"/>`;
const fqTone=(sg,fm)=>fm?`<feGaussianBlur in="SourceGraphic" stdDeviation="${q4(sg)}" result="a"/>`+fqDark('a','t'):`<feGaussianBlur in="SourceAlpha" stdDeviation="${q4(sg)}" result="a"/><feColorMatrix in="a" type="matrix" values="0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 1" result="t"/>`;
// the picture kept where the dots are (alpha in dot); on paper in filter mode
const fqInk=fm=>fm?`<feComposite in="SourceGraphic" in2="dot" operator="in" result="ink"/><feFlood flood-color="${fm.paper}" result="pp"/><feMerge><feMergeNode in="pp"/><feMergeNode in="ink"/></feMerge>`:`<feComposite in="SourceGraphic" in2="dot" operator="in"/>`;
// the dot or line screen: the element's own alpha, blurred (Spread), decides how wide each dot or line grows in a tiled cell, in a frame turned by the angle
function fqScreen(e,id,b,cell,dflt,q){const fm=fqFm(q);const S=fqSize(b),c=S*(.008+fqPar(e,'sz',1,100,dflt)/100*.1),T=fqPar(e,'tone',5,100,55)/100*1.02,a=fqPar(e,'ang',0,180,45),sg=c*(.15+fqPar(e,'spr',0,100,40)/100*1.5),cx=b.x+b.W/2,cy=b.y+b.H/2,h=Math.hypot(b.W,b.H)/2,x0=cx-h,y0=cy-h;
 const body=fqTone(sg,fm)
  +`<feImage href="${cell}" x="${q4(x0)}" y="${q4(y0)}" width="${q4(c)}" height="${q4(c)}" preserveAspectRatio="none" result="cell"/><feTile in="cell" result="cone"/>`
  +`<feComposite in="cone" in2="t" operator="arithmetic" k1="0" k2="1" k3="${q4(T)}" k4="-1" result="d"/><feColorMatrix in="d" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 40 0 0 0 0" result="dot"/>`+fqInk(fm);
 return{defs:fqFilter(id,x0,y0,2*h,2*h,body),wrap:fqTurn(id,a,cx,cy)}}

const FQ={
 noise:{label:'Add Noise',grp:'Noise',seed:true,P:[['amt','Amount',0,100,25,'%'],['sz','Size',1,100,20,'']],S:[['dist','Distribution',[['gauss','Gaussian'],['unif','Uniform']],'gauss']],C:[['mono','Monochromatic',true]],
  filt:(e,id,b)=>{const amt=fqPar(e,'amt',0,100,25);if(!amt)return null;const S=fqSize(b),g=S*(.002+fqPar(e,'sz',1,100,20)/100*.03),un=e.dist=='unif';
   const body=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="1" seed="${fqSeed(e)}" result="n0"/><feColorMatrix in="n0" type="matrix" values="${e.mono===false?fqRGB:fqMono}" result="n1"/>`+fqLin(2.6,'n2','n1')
    +(un?`<feComponentTransfer in="n2" result="n3">${['R','G','B'].map(c=>`<feFunc${c} type="table" tableValues="0 .08 .5 .92 1"/>`).join('')}</feComponentTransfer>`:'')+fqAdd(un?'n3':'n2',amt/100*1.2);
   return{defs:fqFilter(id,b.x,b.y,b.W,b.H,body),wrap:fqWrap(id)}}},
 grain:{label:'Film Grain',grp:'Noise',seed:true,P:[['amt','Amount',0,100,35,'%'],['sz','Size',1,100,30,''],['soft','Clumping',0,100,40,'%']],
  // 2.60.5 (artist test: "film grain looks horrible"; it was a coarse, blotchy pattern that greyed the picture): fine grain a pixel or two across at the default size,
  // with Clumping mixing in a larger, softer grain; laid over the picture by Overlay, so it shows most in the mid tones and leaves the blacks and whites, and the
  // picture's brightness is unchanged
  filt:(e,id,b)=>{const amt=fqPar(e,'amt',0,100,35);if(!amt)return null;const S=fqSize(b),g=S*(.0012+fqPar(e,'sz',1,100,30)/100*.006),so=fqPar(e,'soft',0,100,40)/100,sd=fqSeed(e);
   let body=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="1" seed="${sd}" result="g0"/><feColorMatrix in="g0" type="matrix" values="${fqMono}" result="g1"/>`,src='g1';
   if(so){body+=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/(g*3))}" numOctaves="1" seed="${sd+3}" result="c0"/><feColorMatrix in="c0" type="matrix" values="${fqMono}" result="c1"/><feComposite in="g1" in2="c1" operator="arithmetic" k2="${q4(1-so*.55)}" k3="${q4(so*.55)}" result="gm"/>`;src='gm'}
   body+=fqLin(amt/100*3.4,'g2',src)+`<feBlend in="g2" in2="SourceGraphic" mode="overlay" result="fqm"/><feComposite in="fqm" in2="SourceAlpha" operator="in"/>`;
   return{defs:fqFilter(id,b.x,b.y,b.W,b.H,body),wrap:fqWrap(id)}}},
 dust:{label:'Dust & Scratches',grp:'Noise',seed:true,P:[['amt','Dust',0,100,30,'%'],['sz','Size',1,100,30,''],['scr','Scratches',0,100,30,'%']],S:[['col','Show as',[['holes','Holes'],['specks','Dark specks']],'holes']],
  filt:(e,id,b,q)=>{const fm=fqFm(q),amt=fqPar(e,'amt',0,100,30),scr=fqPar(e,'scr',0,100,30);if(!amt&&!scr)return null;const S=fqSize(b),g=S*(.004+fqPar(e,'sz',1,100,30)/100*.02),sd=fqSeed(e);let body='',parts=[];
   if(amt){body+=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="1" seed="${sd}" result="sp0"/>`+fqToA('sp0','sp1')+fqCut(.76-amt/100*.14,'sp1','sp');parts.push('sp')}
   if(scr){body+=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/(g*1.2))} ${q4(1/(S*.3))}" numOctaves="1" seed="${sd+7}" result="sc0"/>`+fqToA('sc0','sc1')+fqCut(.78-scr/100*.14,'sc1','sc');parts.push('sc')}
   body+=`<feMerge result="d">${parts.map(p=>`<feMergeNode in="${p}"/>`).join('')}</feMerge>`;
   body+=e.col=='specks'?`<feFlood flood-color="#000" result="k"/><feComposite in="k" in2="d" operator="in" result="kd"/><feComposite in="kd" in2="SourceAlpha" operator="in" result="kd2"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="kd2"/></feMerge>`
    :fm?`<feFlood flood-color="${fm.paper}" result="pp"/><feComposite in="pp" in2="d" operator="in" result="pd"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="pd"/></feMerge>`:`<feComposite in="SourceGraphic" in2="d" operator="out"/>`;
   return{defs:fqFilter(id,b.x,b.y,b.W,b.H,body),wrap:fqWrap(id)}}},
 blur:{label:'Gaussian Blur',grp:'Blur',P:[['amt','Radius',0,100,10,'']],
  filt:(e,id,b)=>{const sg=fqSize(b)*fqPar(e,'amt',0,100,10)/100*.06;if(!(sg>0))return null;const m=3*sg;
   return{defs:fqFilter(id,b.x-m,b.y-m,b.W+2*m,b.H+2*m,`<feGaussianBlur in="SourceGraphic" stdDeviation="${q4(sg)}"/>`),wrap:fqWrap(id)}}},
 motion:{label:'Motion Blur',grp:'Blur',P:[['amt','Distance',0,100,20,''],['ang','Angle',0,359,0,'&#176;']],
  filt:(e,id,b)=>{const sg=fqSize(b)*fqPar(e,'amt',0,100,20)/100*.08;if(!(sg>0))return null;const a=fqPar(e,'ang',0,359,0),cx=b.x+b.W/2,cy=b.y+b.H/2,h=Math.hypot(b.W,b.H)/2+3*sg;
   return{defs:fqFilter(id,cx-h,cy-h,2*h,2*h,`<feGaussianBlur in="SourceGraphic" stdDeviation="${q4(sg)} 0"/>`),wrap:fqTurn(id,a,cx,cy)}}},
 halftone:{label:'Halftone',grp:'Print',P:[['sz','Dot size',1,100,30,''],['tone','Ink',5,100,55,'%'],['ang','Angle',0,90,45,'&#176;'],['spr','Spread',0,100,40,'%']],
  filt:(e,id,b,q)=>fqScreen(e,id,b,FQ_CELL,30,q)},
 lines:{label:'Line Screen',grp:'Print',P:[['sz','Line spacing',1,100,25,''],['tone','Ink',5,100,55,'%'],['ang','Angle',0,180,45,'&#176;'],['spr','Spread',0,100,40,'%']],
  filt:(e,id,b,q)=>fqScreen(e,id,b,FQ_LINE,25,q)},
 stipple:{label:'Stipple',grp:'Print',seed:true,P:[['sz','Dot size',1,100,20,''],['den','Density',0,100,55,'%'],['spr','Spread',0,100,80,'%']],
  filt:(e,id,b,q)=>{const fm=fqFm(q),S=fqSize(b),g=S*(.003+fqPar(e,'sz',1,100,20)/100*.02),sg=g*(.3+fqPar(e,'spr',0,100,80)/100*6),bias=(fqPar(e,'den',0,100,55)-50)/100*.7;
   const body=fqTone(sg,fm)
    +`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="1" seed="${fqSeed(e)}" result="n0"/><feColorMatrix in="n0" type="matrix" values="${fqMono}" result="n1"/>`+fqLin(-1.6,'n2','n1')
    +`<feComposite in="t" in2="n2" operator="arithmetic" k1="0" k2=".5" k3=".5" k4="0" result="d"/><feColorMatrix in="d" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 80 0 0 0 ${q4(-40+40*bias)}" result="dot"/>`+fqInk(fm);
   return{defs:fqFilter(id,b.x,b.y,b.W,b.H,body),wrap:fqWrap(id)}}},
 bleed:{label:'Ink Bleed',grp:'Print',seed:true,P:[['amt','Swell',0,100,20,'%'],['rag','Ragged',0,100,30,'%'],['soft','Softness',0,100,30,'%']],
  filt:(e,id,b,q)=>{const fm=fqFm(q),S=fqSize(b),amt=fqPar(e,'amt',0,100,20),so=fqPar(e,'soft',0,100,30),rg=fqPar(e,'rag',0,100,30);const r=S*amt/100*.03,sg=S*(.002+so/100*.012),sc=S*rg/100*.06,m=r+3*sg+sc;if(!(r>0)&&!rg)return null;
   const k=1.5+(1-so/100)*10; // in filter mode the dark parts of the picture swell (erode takes the darkest neighbour), and stay soft
   let body=r>0?`<feMorphology in="SourceGraphic" operator="${fm?'erode':'dilate'}" radius="${q4(r)}" result="m"/>`:`<feOffset in="SourceGraphic" dx="0" dy="0" result="m"/>`;
   if(rg)body+=`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/(S*.04))}" numOctaves="2" seed="${fqSeed(e)}" result="n"/><feDisplacementMap in="m" in2="n" scale="${q4(sc)}" xChannelSelector="R" yChannelSelector="G" result="m"/>`;
   body+=fm?`<feGaussianBlur in="m" stdDeviation="${q4(sg*.5)}"/>`:`<feGaussianBlur in="m" stdDeviation="${q4(sg)}" result="bl"/><feComponentTransfer in="bl"><feFuncA type="linear" slope="${q4(k)}" intercept="${q4(.5-.4*k)}"/></feComponentTransfer>`;
   return{defs:fqFilter(id,b.x-m,b.y-m,b.W+2*m,b.H+2*m,body),wrap:fqWrap(id)}}},
 misreg:{label:'Misregistration',grp:'Print',seed:true,P:[['amt','Offset',0,100,25,''],['ang','Angle',0,359,45,'&#176;'],['rnd','Random',0,100,0,'']],W:[['col','Colour','Same ink','#00aeef']],
  filt:(e,id,b,q)=>{const fm=fqFm(q),S=fqSize(b),d=S*fqPar(e,'amt',0,100,25)/100*.06,rm=S*fqPar(e,'rnd',0,100,0)/100*.06;if(!(d>0||rm>0))return null;
   // the offset (Offset along Angle) plus a random one: a seeded direction and distance up to Random, so Reroll moves the second copy and the same seed always lands the same
   const a=fqPar(e,'ang',0,359,45)*Math.PI/180,ra=fqRnd(fqSeed(e),0)*2*Math.PI,rr=rm*fqRnd(fqSeed(e),1),dx=d*Math.cos(a)+rr*Math.cos(ra),dy=d*Math.sin(a)+rr*Math.sin(ra),m=d+rm+1;
   // '' = the same ink; a tray link or fixed colour is resolved here, so a tray edit recolours the copy
   const ink=e.col===''?null:col(e.col==null?'#00aeef':e.col).slice(0,7);
   // in filter mode the second copy is the picture's dark parts (or the picture itself, Same ink), offset and printed over it (multiply)
   if(fm){const body=(ink?fqDark('SourceGraphic','dk0')+`<feColorMatrix in="dk0" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.6 0 0 0 -.4" result="dk1"/><feComposite in="dk1" in2="SourceAlpha" operator="in" result="dk"/><feOffset in="dk" dx="${q4(dx)}" dy="${q4(dy)}" result="oa"/><feFlood flood-color="${ink}" result="fc"/><feComposite in="fc" in2="oa" operator="in" result="o"/>`
     :`<feOffset in="SourceGraphic" dx="${q4(dx)}" dy="${q4(dy)}" result="o"/>`)+`<feBlend in="o" in2="SourceGraphic" mode="multiply"/>`;
    return{defs:fqFilter(id,b.x-m,b.y-m,b.W+2*m,b.H+2*m,body),wrap:fqWrap(id)}}
   const body=(ink?`<feOffset in="SourceAlpha" dx="${q4(dx)}" dy="${q4(dy)}" result="oa"/><feFlood flood-color="${ink}" result="fc"/><feComposite in="fc" in2="oa" operator="in" result="o"/>`:`<feOffset in="SourceGraphic" dx="${q4(dx)}" dy="${q4(dy)}" result="o"/>`)+`<feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>`;
   return{defs:fqFilter(id,b.x-m,b.y-m,b.W+2*m,b.H+2*m,body),wrap:fqWrap(id)}}},
 rough:{label:'Roughen',grp:'Distort',seed:true,P:[['amt','Amount',0,100,25,'%'],['sz','Size',1,100,30,'']],
  filt:(e,id,b)=>{const S=fqSize(b),sc=S*fqPar(e,'amt',0,100,25)/100*.12;if(!(sc>0))return null;const g=S*(.01+fqPar(e,'sz',1,100,30)/100*.1),m=sc;
   return{defs:fqFilter(id,b.x-m,b.y-m,b.W+2*m,b.H+2*m,`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="3" seed="${fqSeed(e)}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${q4(sc)}" xChannelSelector="R" yChannelSelector="G"/>`),wrap:fqWrap(id)}}},
 ripple:{label:'Ripple',grp:'Distort',P:[['amt','Amount',0,100,20,'%'],['wl','Wavelength',1,100,30,''],['ang','Angle',0,179,0,'&#176;']],
  filt:(e,id,b)=>{const S=fqSize(b),sc=S*fqPar(e,'amt',0,100,20)/100*.1;if(!(sc>0))return null;const c=S*(.02+fqPar(e,'wl',1,100,30)/100*.4),a=fqPar(e,'ang',0,179,0),cx=b.x+b.W/2,cy=b.y+b.H/2,h=Math.hypot(b.W,b.H)/2+sc,x0=cx-h,y0=cy-h;
   return{defs:fqFilter(id,x0,y0,2*h,2*h,`<feImage href="${FQ_WAVE}" x="${q4(x0)}" y="${q4(y0)}" width="${q4(c)}" height="${q4(2*h)}" preserveAspectRatio="none" result="w"/><feTile in="w" result="wt"/><feDisplacementMap in="SourceGraphic" in2="wt" scale="${q4(sc*2)}" xChannelSelector="G" yChannelSelector="R"/>`),wrap:fqTurn(id,a,cx,cy)}}},
 // 2.68.0 (owner Oct 28 2026): Wobble, Warp and Slip join Roughen and Ripple. Wobble is Roughen's slow cousin: one soft, large wave of noise, a hand-drawn wiggle.
 wobble:{label:'Wobble',grp:'Distort',seed:true,P:[['amt','Amount',0,100,25,'%'],['sz','Size',1,100,40,'']],
  filt:(e,id,b)=>{const S=fqSize(b),sc=S*fqPar(e,'amt',0,100,25)/100*.2;if(!(sc>0))return null;const g=S*(.12+fqPar(e,'sz',1,100,40)/100*.7),m=sc;
   return{defs:fqFilter(id,b.x-m,b.y-m,b.W+2*m,b.H+2*m,`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="2" seed="${fqSeed(e)}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${q4(sc)}" xChannelSelector="R" yChannelSelector="G"/>`),wrap:fqWrap(id)}}},
 // Warp is liquid: the picture is pushed by a large noise, then pushed again by a finer one (a different seed and channels), so lines flow into each other like a melted print.
 warp:{label:'Warp',grp:'Distort',seed:true,P:[['amt','Amount',0,100,30,'%'],['sz','Size',1,100,50,'']],
  filt:(e,id,b)=>{const S=fqSize(b),sc=S*fqPar(e,'amt',0,100,30)/100*.3;if(!(sc>0))return null;const g=S*(.1+fqPar(e,'sz',1,100,50)/100*.5),m=sc*1.7,sd=fqSeed(e);
   return{defs:fqFilter(id,b.x-m,b.y-m,b.W+2*m,b.H+2*m,`<feTurbulence type="fractalNoise" baseFrequency="${q4(1/g)}" numOctaves="2" seed="${sd}" result="n1"/><feDisplacementMap in="SourceGraphic" in2="n1" scale="${q4(sc)}" xChannelSelector="R" yChannelSelector="G" result="d1"/><feTurbulence type="fractalNoise" baseFrequency="${q4(2.6/g)}" numOctaves="2" seed="${sd+7}" result="n2"/><feDisplacementMap in="d1" in2="n2" scale="${q4(sc*.7)}" xChannelSelector="B" yChannelSelector="R"/>`),wrap:fqWrap(id)}}},
 // Slip: bands of the picture slide sideways by small, uneven amounts (some not at all), like a misfed press. The bands are a displacement picture made from the seed, run in a turned frame like Ripple.
 slip:{label:'Slip',grp:'Distort',seed:true,P:[['amt','Amount',0,100,25,'%'],['bh','Band height',1,100,30,''],['ang','Angle',0,179,0,'&#176;']],
  filt:(e,id,b)=>{const S=fqSize(b),sc=S*fqPar(e,'amt',0,100,25)/100*.16;if(!(sc>0))return null;const a=fqPar(e,'ang',0,179,0),cx=b.x+b.W/2,cy=b.y+b.H/2,h=Math.hypot(b.W,b.H)/2+sc,x0=cx-h,y0=cy-h,n=Math.max(3,Math.min(90,Math.round(2*h/(S*(.02+fqPar(e,'bh',1,100,30)/100*.18)))));
   return{defs:fqFilter(id,x0,y0,2*h,2*h,`<feImage href="${fqSlipMap(fqSeed(e),n)}" x="${q4(x0)}" y="${q4(y0)}" width="${q4(2*h)}" height="${q4(2*h)}" preserveAspectRatio="none" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="${q4(sc*2)}" xChannelSelector="R" yChannelSelector="G"/>`),wrap:fqTurn(id,a,cx,cy)}}}
};
// the defaults of a new effect of kind k
function fqMake(k){const d=FQ[k],o={k,on:true};(d.P||[]).forEach(p=>o[p[0]]=p[4]);(d.S||[]).forEach(s=>o[s[0]]=s[3]);(d.C||[]).forEach(c=>o[c[0]]=c[2]);(d.W||[]).forEach(w=>o[w[0]]=w[3]);if(d.seed)o.sd=txRid();return o}
// the settings pane of one effect, for the effect stack's group (fields carry data-q; Reroll carries data-qrr)
function fqPane(k){const d=FQ[k];return`<div class="fxs" data-e="${k}" hidden>`
 +(d.P||[]).map(([f,n,a,b,v,u])=>`<div class="ctl"><label>${n}</label><input type="range" data-q="${f}" min="${a}" max="${b}" value="${v}"${u?` data-u="${u}"`:''} data-def="${v}" aria-label="${n}"></div>`).join('')
 +(d.S||[]).map(([f,n,o,v])=>`<div class="ctl"><label>${n}</label><select data-q="${f}" aria-label="${n}">${o.map(([x,t])=>`<option value="${x}"${x==v?' selected':''}>${t}</option>`).join('')}</select></div>`).join('')
 +(d.W||[]).map(([f,n])=>`<div class="cwrow"><span class="cwk">${n}</span><div class="cwell" data-qw="${f}"></div></div>`).join('')
 +(d.C||[]).map(([f,n,v])=>`<label class="chk"><input type="checkbox" data-q="${f}"${v?' checked':''}><span>${n}</span></label>`).join('')
 +(d.seed?'<div class="row"><button type="button" class="alt" data-qrr>Reroll</button></div>':'')+'</div>'}
// show effect e's settings in its pane
function fqSync(pane,e){const d=FQ[e.k];if(!d)return;
 (d.P||[]).forEach(([f,,a,b,v])=>{const el=pane.querySelector(`[data-q="${f}"]`),x=fqPar(e,f,a,b,v);if(el&&+el.value!==x){el.value=x;el.dispatchEvent(new Event('input',{bubbles:true}))}});
 (d.S||[]).forEach(([f,,,v])=>{const el=pane.querySelector(`[data-q="${f}"]`),x=e[f]==null?v:e[f];if(el&&el.value!==x)el.value=x});
 (d.C||[]).forEach(([f,,v])=>{const el=pane.querySelector(`[data-q="${f}"]`),x=e[f]==null?v:!!e[f];if(el&&el.checked!==x)el.checked=x});
 if(d.W&&WBX.wbPaintWells)WBX.wbPaintWells()}
// a field's value from its control
const fqVal=el=>el.type=='checkbox'?el.checked:el.tagName=='SELECT'?el.value:+el.value;
// registered by the effect stack (69) after its own four, so the menu lists Texture, Pressure offset, Jitter and Colour grade first
function fqRegister(){Object.entries(FQ).forEach(([k,d])=>fxRegister(k,{label:d.label,grp:d.grp||null,kinds:FQK,make:()=>fqMake(k),filt:d.filt,pane:()=>fqPane(k),sync:fqSync,seed:!!d.seed}))}
export {FQ,fqMake,fqRegister,fqVal};
