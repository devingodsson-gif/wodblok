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
 return{defs:'',body:`<rect ${R} fill="${okC(q.ink)?col(q.ink):col(WBS.proj.bg)}"/>`}}
// the Sheet that is being edited draws live (its print would be out of date at every step)
const shLive=q=>q.u==WBS.fpSel||!!(WBS.fpMS&&WBS.fpMS.has&&WBS.fpMS.has(q.u));
function shLayer(L,li){const pl=(L.pl||[]).filter(q=>q.k=='sheet');if(!pl.length)return['',''];const fr=new Map(),seen=new Set();let defs='';
 pl.forEach(q=>{const id='sh'+li+'_'+String(q.u).replace(/[^\w-]/g,''),F=shFill(q,id,seen),on=fxOf(q).some(e=>e&&e.on!==false);defs+=F.defs;
  // no effects, or a drag on the canvas in progress: the fill alone (the element list wraps it in its opacity and blend)
  if(!on||(WBS.DRAFT&&WBS.DRAFTCV)){fr.set(String(q.u),F.body);return}
  const p=Math.max(CW,CH)*.05,box={x:-p,y:-p,W:CW+2*p,H:CH+2*p,R:400},op=q.op!=null?Math.max(0,Math.min(100,+q.op))/100:1;
  // the fill through the effects, as any element's
  let self='';if(F.body){const T=fxTex(q,id+'ft',box),G=fxGr(q,id+'fg',box),own=(T?T.defs:'')+(G?G.defs:'');defs+=own;self=T||G?`<g${T?T.attrs:''}>${G?G.wrap(F.body):F.body}</g>`:F.body;
   if((T||G)&&!shLive(q))self=bkElMark('s'+li+'_'+id,self,shFill(q,id,null).defs+own,{x:CW/2,y:CH/2,r:Math.hypot(CW,CH)*.6});self=`<g${elOB(q)}>${self}</g>`}
  // what is under it through the effects; the outline-reading effects fill their gaps with the paper colour
  const z={...q,__fm:{paper:mtPaper()}},T=fxTex(z,id+'ut',box),G=fxGr(z,id+'ug',box),use=`<use href="#${FLT_I}"/>`;defs+=(T?T.defs:'')+(G?G.defs:'');
  const under=T||G?`<g${op<1?` opacity="${op.toFixed(3)}"`:''}><g${T?T.attrs:''}>${G?G.wrap(use):use}</g></g>`:'';
  fr.set(String(q.u),`<g id="${FLT_I}">${FLT_U}</g>${FLT_S}${under}${self}`)});
 return[defs,'','','',fr]}
function init89(){elExtend('sheet',{draw:(L,li)=>shLayer(L,li)})}
export {init89};
