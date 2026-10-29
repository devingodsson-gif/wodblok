import {cmdRegister} from '../commands/registry.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL} from './24-free-place-layers.js';
import {fpPt,fpUnit} from './25-art-layers.js';
import {elSel} from './65-element-core.js';

// ===== Cropping a picture (2.74.2, owner Oct 29 2026: "I need to be able to crop images"; he chose a crop mode with handles, like Photoshop's crop of a layer).
// A picture on the canvas is a shape filled with it (fl 'img'). Its crop is ic = [left, top, right, bottom], the part of the picture cut off each side (0 to 1 of its
// width or height); none when nothing is cut. The shape shows only what is left (74-motif-element.js, mtDraw).
// Crop (in the Fill group, or the command) starts the mode on the selected picture: the whole picture shows faintly where it lies, the part that is kept shows as it is,
// with eight squares on its edges. A square pulls its edge or corner; a pull inside the frame moves the frame over the picture. Enter, or a click outside the frame,
// applies the crop; Esc leaves it as it was. Applying keeps the picture's scale and where it lies: the shape becomes the size of what is left, in its place.
const CR={on:null};   // {p: the shape, A: its picture, c: the crop being set, c0: the crop it had, k: canvas units per picture pixel, d: the pull in progress}
const crOk=p=>!!(p&&p.k=='motif'&&!p.bgd&&!p.flt&&p.fl=='img'&&p.a&&WBS.ARTS[p.a]&&WBS.ARTS[p.a].w>0);
const crOf=p=>{const c=Array.isArray(p.ic)?p.ic.map(v=>Math.max(0,Math.min(.98,+v||0))):[0,0,0,0];return c};
const crSel=()=>{const p=elSel();return crOk(p)?p:null};
// the scale (canvas units per picture pixel) the shape draws its picture at, with crop c
function crScale(p,A,c){const s=Math.max(1,+p.s||100),w=s*(+p.wx||1),h=s*(+p.wy||1),cw=A.w*(1-c[0]-c[2]),ch=A.h*(1-c[1]-c[3]),z=Math.max(.05,Math.min(8,(+p.iz||100)/100));
 return(p.im=='contain'?Math.min(w/cw,h/ch):Math.max(w/cw,h/ch))*z}
// a point of the picture (u, v: 0 to 1 across and down) in the shape's own frame (its middle at 0, 0, not turned), with the crop it has now
const crLoc=(u,v)=>{const{A,c0,k}=CR.on,cw=A.w*(1-c0[0]-c0[2]),ch=A.h*(1-c0[1]-c0[3]);return[(u*A.w-c0[0]*A.w-cw/2)*k,(v*A.h-c0[1]*A.h-ch/2)*k]};
// the shape's frame and the canvas: turned by r, flipped across by f
const crToC=(x,y)=>{const p=CR.on.p,a=(+p.r||0)*Math.PI/180,f=+p.f||1;x*=f;return[+p.x+x*Math.cos(a)-y*Math.sin(a),+p.y+x*Math.sin(a)+y*Math.cos(a)]};
const crFromC=(X,Y)=>{const p=CR.on.p,a=-(+p.r||0)*Math.PI/180,f=+p.f||1,dx=X-p.x,dy=Y-p.y;return[(dx*Math.cos(a)-dy*Math.sin(a))*f,dx*Math.sin(a)+dy*Math.cos(a)]};
// The frame starts on what shows: a picture that covers its shape runs past it, and that part counts as cut off already
function crStart(){const p=crSel();if(!p)return;if(CR.on)crEnd(true);const A=WBS.ARTS[p.a],c0=crOf(p),k=crScale(p,A,c0),s=Math.max(1,+p.s||100),w=s*(+p.wx||1),h=s*(+p.wy||1);
 const ox=Math.max(0,(A.w*(1-c0[0]-c0[2])*k-w)/2)/(A.w*k),oy=Math.max(0,(A.h*(1-c0[1]-c0[3])*k-h)/2)/(A.h*k),c=[c0[0]+ox,c0[1]+oy,c0[2]+ox,c0[3]+oy];
 CR.on={p,A,c0,c,cs:c.slice(),k,d:null};upd();crPaint()}
// the overlay: the whole picture faintly, the kept part as it is, the frame and its squares (the same squares as the canvas's handles, 25-art-layers.js)
function crOv(){if(!CR.on)return null;const{p,A,c}=CR.on;if(!fpL()||!(fpL().pl||[]).includes(p)){CR.on=null;return null}
 const f=v=>(+v).toFixed(2),[x0,y0]=crLoc(0,0),[x1,y1]=crLoc(1,1),[l,t]=crLoc(c[0],c[1]),[r,b]=crLoc(1-c[2],1-c[3]),u=fpUnit(),hs=4.5*u,cid='crclip';
 let o=`<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${+p.r||0}) scale(${+p.f||1} 1)" pointer-events="none"><clipPath id="${cid}"><rect x="${f(l)}" y="${f(t)}" width="${f(r-l)}" height="${f(b-t)}"/></clipPath>`+
  `<image href="${A.src}" x="${f(x0)}" y="${f(y0)}" width="${f(x1-x0)}" height="${f(y1-y0)}" preserveAspectRatio="none" opacity=".35"/>`+
  `<image href="${A.src}" x="${f(x0)}" y="${f(y0)}" width="${f(x1-x0)}" height="${f(y1-y0)}" preserveAspectRatio="none" clip-path="url(#${cid})"/></g>`;
 o+=`<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${+p.r||0})"><rect class="sel" x="${f((+p.f||1)>0?l:-r)}" y="${f(t)}" width="${f(Math.abs(r-l))}" height="${f(b-t)}"/>`;
 crHd().forEach(([nm,x,y])=>{const X=x*(+p.f||1);o+=`<rect class="fhd" data-crh="${nm}" x="${f(X-hs)}" y="${f(y-hs)}" width="${f(hs*2)}" height="${f(hs*2)}"/>`});return o+'</g>'}
// the squares, in the shape's frame (unflipped): corners and sides of the frame
function crHd(){const{c}=CR.on,[l,t]=crLoc(c[0],c[1]),[r,b]=crLoc(1-c[2],1-c[3]),mx=(l+r)/2,my=(t+b)/2;return[['nw',l,t],['ne',r,t],['se',r,b],['sw',l,b],['n',mx,t],['s',mx,b],['e',r,my],['w',l,my]]}
const crPaint=()=>{if(WBH.fpOverlay)WBH.fpOverlay()};
// a pull: a square moves its edges, inside the frame moves the frame; each edge keeps at least 2 % of the picture
function crMove(lx,ly){const{A,k,d}=CR.on,du=(lx-d.lx)/(A.w*k),dv=(ly-d.ly)/(A.h*k),c=d.c.slice(),mn=.02;
 if(d.h=='in'){const sx=Math.max(-c[0],Math.min(c[2],du)),sy=Math.max(-c[1],Math.min(c[3],dv));c[0]+=sx;c[2]-=sx;c[1]+=sy;c[3]-=sy}
 else{if(d.h.includes('w'))c[0]=Math.max(0,Math.min(1-c[2]-mn,c[0]+du));if(d.h.includes('e'))c[2]=Math.max(0,Math.min(1-c[0]-mn,c[2]-du));
  if(d.h.includes('n'))c[1]=Math.max(0,Math.min(1-c[3]-mn,c[1]+dv));if(d.h.includes('s'))c[3]=Math.max(0,Math.min(1-c[1]-mn,c[3]-dv))}
 CR.on.c=c;crPaint()}
// apply: the shape becomes the size of what is left, where it lay, filled with it at the same scale (Cover, no zoom); its size s stays and its width and height change
function crEnd(apply){const S=CR.on;if(!S)return;
 if(apply&&S.c.some((v,i)=>Math.abs(v-S.cs[i])>1e-4)){const{p,A,c,k}=S,cw=1-c[0]-c[2],ch=1-c[1]-c[3],[mx,my]=crLoc(c[0]+cw/2,c[1]+ch/2),[X,Y]=crToC(mx,my),s=Math.max(1,+p.s||100);
  p.x=+X.toFixed(2);p.y=+Y.toFixed(2);p.wx=+(cw*A.w*k/s).toFixed(4);p.wy=+(ch*A.h*k/s).toFixed(4);delete p.iz;delete p.im;
  if(c.every(v=>v<1e-4))delete p.ic;else p.ic=c.map(v=>+v.toFixed(4));CR.on=null;store()}
 CR.on=null;upd();crPaint()}
function init94(){
 WBX.wbCropOv=crOv;WBX.wbCropHide=p=>!!(CR.on&&CR.on.p===p);WBX.wbCropOn=()=>!!CR.on;WBX.wbCropSync=()=>{const b=$('mf_cropr');if(b){const v=!!crSel();if(b.hidden===v)b.hidden=!v}};
 cmdRegister({id:'image.crop',label:'Crop the picture',elId:'mf_crop',enabled:()=>!!crSel(),run:()=>crStart()});
 $('mf_crop').addEventListener('click',crStart);
 const art=$('art');
 art.addEventListener('pointerdown',e=>{if(!CR.on||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();const[X,Y]=fpPt(e),[lx0,ly]=crFromC(X,Y),lx=lx0,hs=4.5*fpUnit()*1.6;
  const h=crHd().find(([,x,y])=>Math.abs(x-lx)<=hs&&Math.abs(y-ly)<=hs),{c}=CR.on,[l,t]=crLoc(c[0],c[1]),[r,b]=crLoc(1-c[2],1-c[3]);
  if(h)CR.on.d={h:h[0],lx,ly,c:c.slice()};else if(lx>=Math.min(l,r)&&lx<=Math.max(l,r)&&ly>=t&&ly<=b)CR.on.d={h:'in',lx,ly,c:c.slice()};else{crEnd(true);return}
  try{art.setPointerCapture(e.pointerId)}catch(x){}},true);
 art.addEventListener('pointermove',e=>{if(!CR.on||!CR.on.d)return;e.stopImmediatePropagation();const[X,Y]=fpPt(e),[lx,ly]=crFromC(X,Y);crMove(lx,ly)},true);
 art.addEventListener('pointerup',e=>{if(!CR.on||!CR.on.d)return;e.stopImmediatePropagation();CR.on.d=null},true);
 document.addEventListener('keydown',e=>{if(!CR.on)return;if(e.key=='Enter'){e.preventDefault();e.stopImmediatePropagation();crEnd(true)}else if(e.key=='Escape'){e.preventDefault();e.stopImmediatePropagation();crEnd(false)}},true)}
export {init94};
