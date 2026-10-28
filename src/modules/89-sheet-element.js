import {WBS} from './01-launch-and-version.js';
import {CH,col,CW,okC} from './04-canvas-and-stamp-outlines.js';
import {bkElMark} from './03-stamp-prints-and-drawing.js';
import {elExtend,elOB,fxOf} from './65-element-core.js';
import {fxGr,fxTex} from './69-effect-stack.js';
import {FLT_I,FLT_S,FLT_U,mtPaper} from './74-motif-element.js';

// ===== The Sheet (2.53.0, owner Oct 26 2026: "an element called a Sheet. It always covers the whole canvas and can't be resized"; docs/sheet-plan.md).
// A Sheet is {u, k:'sheet', n, fl, ink, a, im, iz, fx, op, bl, v, g, bgd}. It has no place, size or turn: it is always the whole canvas, at every canvas size.
// Its fill uses a shape's fields: fl 'none' (a new Sheet), 'img' (the picture a, fitted by im: absent Cover, 'contain' Fit, 'stretch', 'tile'; zoomed by iz %), or absent for a colour (ink,
// the paper colour when it has none). The Background of a new project is a Sheet with a colour (66-background.js).
// Effects (Texture, Colour grade, the filter effects) work on the Sheet's own fill, as on any element, and on everything drawn under it at its level, as a Filter shape's do
// (74-motif-element.js): the picture under it is kept and a copy through the effects is laid over it. The Sheet's opacity is how strong both are; its blend applies to its fill.
// A Sheet is not hit by a click on the canvas: it is picked from the Elements list.
const shF=v=>(+v).toFixed(2);
// half way between two colours (#rgb, #rrggbb or #rrggbbaa), for the gradient's midpoint
const shMix=(a,b)=>{const p=h=>{h=String(h).replace('#','');if(h.length<6)h=h.split('').map(c=>c+c).join('');return[0,2,4,6].map(i=>i<h.length?parseInt(h.slice(i,i+2),16):255)};const x=p(a),y=p(b);if(x.some(isNaN)||y.some(isNaN))return a;const m=x.map((v,i)=>Math.round((v+y[i])/2));return'#'+m.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('')+(m[3]<255?m[3].toString(16).padStart(2,'0'):'')};
// a Sheet's gradient (its line, or its circle) with the stops st
function shGrad(q,gid,st){if(q.gk=='rad'){const cx=CW*(q.gx!=null?+q.gx:50)/100,cy=CH*(q.gy!=null?+q.gy:50)/100,r=Math.max(CW,CH)*Math.max(5,+(q.gs!=null?q.gs:70))/100;return`<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${shF(cx)}" cy="${shF(cy)}" r="${shF(r)}">${st}</radialGradient>`}
 const a=(q.ga!=null?+q.ga:90)*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),L=(Math.abs(CW*dx)+Math.abs(CH*dy))/2;return`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${shF(CW/2-dx*L)}" y1="${shF(CH/2-dy*L)}" x2="${shF(CW/2+dx*L)}" y2="${shF(CH/2+dy*L)}">${st}</linearGradient>`}
// 2.67.0 (owner Oct 27 2026: "the gradient modes in a sheet should have the effects also be a gradient: a texture or noise is normal on the gradient's positive side and
// fades out on the negative side"): a gradient Sheet's effects are at full strength at its End and fade out towards its Start, along the same line or circle, with the
// same Midpoint. The fill itself is drawn as it is underneath. Returns the mask's defs and its id.
function shFxFade(q,id){const m=Math.max(5,Math.min(95,q.gm!=null?+q.gm:50))/100,st=`<stop offset="0" stop-color="#000"/>${Math.abs(m-.5)>.001?`<stop offset="${m.toFixed(3)}" stop-color="#808080"/>`:''}<stop offset="1" stop-color="#fff"/>`;
 return{defs:shGrad(q,id+'fg0',st)+`<mask id="${id}fm" maskUnits="userSpaceOnUse" x="0" y="0" width="${shF(CW)}" height="${shF(CH)}"><rect x="0" y="0" width="${shF(CW)}" height="${shF(CH)}" fill="url(#${id}fg0)"/></mask>`,id:id+'fm'}}
// the fill, in canvas units: {defs, body}; seen: the pictures already defined (null: define them here)
function shFill(q,id,seen){const R=`x="0" y="0" width="${shF(CW)}" height="${shF(CH)}"`;
 if(q.fl=='none')return{defs:'',body:''};
 if(q.fl=='img'){const A=WBS.ARTS[q.a];if(!A||!(A.w>0)||!(A.h>0))return{defs:'',body:''};const aid='shi_'+String(q.a).replace(/[^\w-]/g,''),z=Math.max(.1,Math.min(4,(+q.iz||100)/100));let defs='';
  if(!seen||!seen.has(aid)){if(seen)seen.add(aid);defs+=`<image id="${aid}" href="${A.src}" x="0" y="0" width="${A.w}" height="${A.h}" preserveAspectRatio="none"/>`}
  defs+=`<clipPath id="${id}c"><rect ${R}/></clipPath>`;let inner;
  // Tile: at 100% a quarter of the canvas wide, one tile in the middle
  if(q.im=='tile'){const tw=CW/4*z,th=tw*A.h/A.w;defs+=`<pattern id="${id}p" patternUnits="userSpaceOnUse" x="${shF(CW/2-tw/2)}" y="${shF(CH/2-th/2)}" width="${shF(tw)}" height="${shF(th)}"><use href="#${aid}" transform="scale(${(tw/A.w).toFixed(5)} ${(th/A.h).toFixed(5)})"/></pattern>`;inner=`<rect ${R} fill="url(#${id}p)"/>`}
  else{let sx,sy;if(q.im=='stretch'){sx=CW/A.w*z;sy=CH/A.h*z}else sx=sy=(q.im=='contain'?Math.min(CW/A.w,CH/A.h):Math.max(CW/A.w,CH/A.h))*z;
   inner=`<use href="#${aid}" transform="translate(${shF(CW/2)} ${shF(CH/2)}) scale(${sx.toFixed(5)} ${sy.toFixed(5)}) translate(${shF(-A.w/2)} ${shF(-A.h/2)})"/>`}
  return{defs,body:`<g clip-path="url(#${id}c)">${inner}</g>`}}
 // 2.60.4 (owner Oct 27 2026: "linear and radial gradients that we can apply effects to"): fl 'grad', from ink (the paper colour when it has none) to ink2
 // (the ink colour when it has none); gk 'rad' for Radial (centre gx, gy % of the canvas, size gs % of its long side), else Linear by ga degrees (90: top to bottom);
 // gm % is where the two colours meet half way. The effects work on it as on any fill.
 if(q.fl=='grad'){const c1=okC(q.ink)?col(q.ink):col(WBS.proj.bg),c2=okC(q.ink2)?col(q.ink2):col(WBS.proj.ink),m=Math.max(5,Math.min(95,q.gm!=null?+q.gm:50))/100;
  const st=`<stop offset="0" stop-color="${c1}"/>${Math.abs(m-.5)>.001?`<stop offset="${m.toFixed(3)}" stop-color="${shMix(c1,c2)}"/>`:''}<stop offset="1" stop-color="${c2}"/>`;let g;
  return{defs:shGrad(q,id+'g',st),body:`<rect ${R} fill="url(#${id}g)"/>`}}
 return{defs:'',body:`<rect ${R} fill="${okC(q.ink)?col(q.ink):col(WBS.proj.bg)}"/>`}}
// the Sheet that is being edited draws live (its print would be out of date at every step)
const shLive=q=>q.u==WBS.fpSel||!!(WBS.fpMS&&WBS.fpMS.has&&WBS.fpMS.has(q.u));
function shLayer(L,li){const pl=(L.pl||[]).filter(q=>q.k=='sheet');if(!pl.length)return['',''];const fr=new Map(),seen=new Set();let defs='';
 pl.forEach(q=>{const id='sh'+li+'_'+String(q.u).replace(/[^\w-]/g,''),F=shFill(q,id,seen),on=fxOf(q).some(e=>e&&e.on!==false);defs+=F.defs;
  // no effects, or a drag on the canvas in progress: the fill alone (the element list wraps it in its opacity and blend)
  if(!on||(WBS.DRAFT&&WBS.DRAFTCV)){fr.set(String(q.u),F.body);return}
  const p=Math.max(CW,CH)*.05,box={x:-p,y:-p,W:CW+2*p,H:CH+2*p,R:400},op=q.op!=null?Math.max(0,Math.min(100,+q.op))/100:1;
  // the fill through the effects, as any element's
  const fade=q.fl=='grad'?shFxFade(q,id):null;if(fade)defs+=fade.defs;
  let self='';if(F.body){const T=fxTex(q,id+'ft',box),G=fxGr(q,id+'fg',box),own=(T?T.defs:'')+(G?G.defs:'');defs+=own;self=T||G?`<g${T?T.attrs:''}>${G?G.wrap(F.body):F.body}</g>`:F.body;
   if((T||G)&&!shLive(q))self=bkElMark('s'+li+'_'+id,self,shFill(q,id,null).defs+own,{x:CW/2,y:CH/2,r:Math.hypot(CW,CH)*.6});
   if(fade&&(T||G))self=F.body+`<g mask="url(#${fade.id})">${self}</g>`;self=`<g${elOB(q)}>${self}</g>`}
  // what is under it through the effects; the outline-reading effects fill their gaps with the paper colour
  const z={...q,__fm:{paper:mtPaper()}},T=fxTex(z,id+'ut',box),G=fxGr(z,id+'ug',box),use=`<use href="#${FLT_I}"/>`;defs+=(T?T.defs:'')+(G?G.defs:'');
  const under=T||G?`<g${op<1?` opacity="${op.toFixed(3)}"`:''}${fade?` mask="url(#${fade.id})"`:''}><g${T?T.attrs:''}>${G?G.wrap(use):use}</g></g>`:'';
  fr.set(String(q.u),`<g id="${FLT_I}">${FLT_U}</g>${FLT_S}${under}${self}`)});
 return[defs,'','','',fr]}
function init89(){elExtend('sheet',{draw:(L,li)=>shLayer(L,li)})}
export {init89};
