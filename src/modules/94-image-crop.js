import {cmdRegister} from '../commands/registry.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL} from './24-free-place-layers.js';
import {artBU,fpPt,fpUnit} from './25-art-layers.js';
import {elSel} from './65-element-core.js';

// ===== Cropping a picture (2.74.2, owner Oct 29 2026: "I need to be able to crop images"; he chose a crop mode with handles, like Photoshop's crop of a layer).
// A picture on the canvas is a shape filled with it (fl 'img') or, since 2.75.0, an Image (95-image-element.js). Its crop is ic = [left, top, right, bottom], the part of the
// picture cut off each side (0 to 1 of its width or height); none when nothing is cut. It shows only what is left.
// Crop (in the shape's Fill group or the Image panel, or the command) starts the mode on the selected picture: the whole picture shows faintly where it lies, the part
// that is kept shows as it is, with eight squares on its edges. A square pulls its edge or corner; a pull inside the frame moves the frame over the picture. Enter, or a
// click outside the frame, applies the crop; Esc leaves it as it was. Applying keeps the picture's scale and where it lies: the shape becomes the size of what is left.
// Point crop (2.75.0, an Image only; owner: "a point based crop", with curves and feather): a closed outline of points on the picture keeps what is inside it.
// Click to put a corner point, click and drag to put a smooth one (its handles follow the pointer), click the first point to close the outline. Then: drag a point to
// move it, drag a handle of the selected point to bend the line (Alt moves one handle on its own), Alt-click a point to switch it between corner and smooth, click the
// line to add a point there, Delete removes the selected point. Enter (or a click outside the picture) applies, Esc leaves it as it was.
const CR={on:null};   // {mode: 'rect' | 'pts', p, A, c0: the crop it had, kx, ky: canvas units per picture pixel across and down, and for rect: c, cs; for pts: pts, closed, sel; d: the pull in progress}
const crPic=p=>!!(p&&p.a&&WBS.ARTS[p.a]&&WBS.ARTS[p.a].w>0);
const crOk=p=>!!(p&&!p.bgd&&crPic(p)&&(p.k=='image'||p.k=='motif'&&!p.flt&&p.fl=='img'));
const crOf=p=>Array.isArray(p.ic)?p.ic.map(v=>Math.max(0,Math.min(.98,+v||0))):[0,0,0,0];
const crSel=()=>{const p=elSel();return crOk(p)?p:null};
const crBox=p=>{const s=Math.max(1,+p.s||100);return[s*(+p.wx||1),s*(+p.wy||1)]};
// the scale (canvas units per picture pixel) the picture is drawn at, with crop c: an Image fills its box with what is left; a shape covers or fits it, with its zoom
function crScale(p,A,c){const[w,h]=crBox(p),cw=A.w*(1-c[0]-c[2]),ch=A.h*(1-c[1]-c[3]);if(p.k=='image')return[w/cw,h/ch];
 const z=Math.max(.05,Math.min(8,(+p.iz||100)/100)),k=(p.im=='contain'?Math.min(w/cw,h/ch):Math.max(w/cw,h/ch))*z;return[k,k]}
// a point of the picture (u, v: 0 to 1 across and down) in the picture's own frame on the canvas (its middle at 0, 0, not turned), with the crop it has now; and back
const crLoc=(u,v)=>{const{A,c0,kx,ky}=CR.on,cw=A.w*(1-c0[0]-c0[2]),ch=A.h*(1-c0[1]-c0[3]);return[(u*A.w-c0[0]*A.w-cw/2)*kx,(v*A.h-c0[1]*A.h-ch/2)*ky]};
const crUV=(x,y)=>{const{A,c0,kx,ky}=CR.on,cw=A.w*(1-c0[0]-c0[2]),ch=A.h*(1-c0[1]-c0[3]);return[(x/kx+c0[0]*A.w+cw/2)/A.w,(y/ky+c0[1]*A.h+ch/2)/A.h]};
// the picture's frame and the canvas: turned by r, flipped across by f
const crToC=(x,y)=>{const p=CR.on.p,a=(+p.r||0)*Math.PI/180,f=+p.f||1;x*=f;return[+p.x+x*Math.cos(a)-y*Math.sin(a),+p.y+x*Math.sin(a)+y*Math.cos(a)]};
const crFromC=(X,Y)=>{const p=CR.on.p,a=-(+p.r||0)*Math.PI/180,f=+p.f||1,dx=X-p.x,dy=Y-p.y;return[(dx*Math.cos(a)-dy*Math.sin(a))*f,dx*Math.sin(a)+dy*Math.cos(a)]};
// The frame starts on what shows: a picture that covers its shape runs past it, and that part counts as cut off already
function crStart(){const p=crSel();if(!p)return;if(CR.on)crEnd(true);const A=WBS.ARTS[p.a],c0=crOf(p),[kx,ky]=crScale(p,A,c0),[w,h]=crBox(p);
 const ox=p.k=='image'?0:Math.max(0,(A.w*(1-c0[0]-c0[2])*kx-w)/2)/(A.w*kx),oy=p.k=='image'?0:Math.max(0,(A.h*(1-c0[1]-c0[3])*ky-h)/2)/(A.h*ky),c=[c0[0]+ox,c0[1]+oy,c0[2]+ox,c0[3]+oy];
 CR.on={mode:'rect',p,A,c0,c,cs:c.slice(),kx,ky,d:null};upd();crPaint()}
function crPtsStart(){const p=crSel();if(!p||p.k!='image')return;if(CR.on)crEnd(true);const A=WBS.ARTS[p.a],c0=crOf(p),[kx,ky]=crScale(p,A,c0),pts=Array.isArray(p.pc)&&p.pc.length>2?p.pc.map(q=>q.map(v=>+v||0)):[];
 CR.on={mode:'pts',p,A,c0,kx,ky,pts,p0:JSON.stringify(pts),closed:pts.length>2,sel:-1,d:null};upd();crPaint();if(pts.length<3)pmsg('Point crop: click the picture to add points (at least 3), Enter to apply, Esc to leave it.')}
const crF2=v=>(+v).toFixed(2);
// the point outline in the picture's frame (canvas units): its path, closed or not
function crPathD(pts,closed){if(!pts.length)return'';const L=pts.map(q=>[...crLoc(q[0],q[1]),...crLoc(q[2],q[3]),...crLoc(q[4],q[5])]);let d=`M${crF2(L[0][0])} ${crF2(L[0][1])}`;
 const n=closed?L.length:L.length-1;for(let i=0;i<n;i++){const a=L[i],b=L[(i+1)%L.length];d+=`C${crF2(a[4])} ${crF2(a[5])} ${crF2(b[2])} ${crF2(b[3])} ${crF2(b[0])} ${crF2(b[1])}`}return d+(closed?'Z':'')}
// the overlay: the whole picture faintly, the kept part as it is, then the frame and its squares (rect), or the outline, its points and the selected point's handles
// (the same squares, round handles and lines as the canvas's selection, 25-art-layers.js)
function crOv(){if(!CR.on)return null;const S=CR.on,{p,A}=S;if(!fpL()||!(fpL().pl||[]).includes(p)){CR.on=null;return null}
 const f=crF2,[x0,y0]=crLoc(0,0),[x1,y1]=crLoc(1,1),u=fpUnit(),hs=4.5*u,src=artBU(A),img=x=>`<image href="${src}" x="${f(x0)}" y="${f(y0)}" width="${f(x1-x0)}" height="${f(y1-y0)}" preserveAspectRatio="none"${x}/>`,fl=+p.f||1;
 let keep='',ui='';
 if(S.mode=='rect'){const c=S.c,[l,t]=crLoc(c[0],c[1]),[r,b]=crLoc(1-c[2],1-c[3]);keep=`<clipPath id="crclip"><rect x="${f(l)}" y="${f(t)}" width="${f(r-l)}" height="${f(b-t)}"/></clipPath>${img(' clip-path="url(#crclip)"')}`;
  ui=`<rect class="sel" x="${f(fl>0?l:-r)}" y="${f(t)}" width="${f(Math.abs(r-l))}" height="${f(b-t)}"/>`+crHd().map(([nm,x,y])=>`<rect class="fhd" data-crh="${nm}" x="${f(x*fl-hs)}" y="${f(y-hs)}" width="${f(hs*2)}" height="${f(hs*2)}"/>`).join('')}
 else{const d=crPathD(S.pts,S.closed);if(S.closed&&S.pts.length>2)keep=`<clipPath id="crclip"><path d="${d}"/></clipPath>${img(' clip-path="url(#crclip)"')}`;
  // the outline and the points are drawn in the flipped frame too, so they sit on the picture
  ui=`<g transform="scale(${fl} 1)">${d?`<path class="crp" d="${d}"/>`:''}`;
  const q=S.pts[S.sel];if(q){const[px,py]=crLoc(q[0],q[1]);[[q[2],q[3],'in'],[q[4],q[5],'out']].forEach(([a,b,k])=>{const[hx,hy]=crLoc(a,b);if(Math.hypot(hx-px,hy-py)<1e-6)return;ui+=`<line class="frl" x1="${f(px)}" y1="${f(py)}" x2="${f(hx)}" y2="${f(hy)}"/><circle class="frt" data-crk="${k}" cx="${f(hx)}" cy="${f(hy)}" r="${f(hs*.8)}"/>`})}
  S.pts.forEach((q,i)=>{const[x,y]=crLoc(q[0],q[1]);ui+=`<rect class="fhd${i==S.sel?' on':''}" data-crp="${i}" x="${f(x-hs)}" y="${f(y-hs)}" width="${f(hs*2)}" height="${f(hs*2)}"/>`});ui+='</g>'}
 return`<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${+p.r||0}) scale(${fl} 1)" pointer-events="none">${img(' opacity=".35"')}${keep}</g><g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${+p.r||0})">${ui}</g>`}
// the squares, in the picture's frame (unflipped): corners and sides of the frame
function crHd(){const{c}=CR.on,[l,t]=crLoc(c[0],c[1]),[r,b]=crLoc(1-c[2],1-c[3]),mx=(l+r)/2,my=(t+b)/2;return[['nw',l,t],['ne',r,t],['se',r,b],['sw',l,b],['n',mx,t],['s',mx,b],['e',r,my],['w',l,my]]}
const crPaint=()=>{if(WBH.fpOverlay)WBH.fpOverlay()};
// a pull in the rectangle: a square moves its edges, inside the frame moves the frame; each edge keeps at least 2 % of the picture
function crMove(lx,ly){const{A,kx,ky,d}=CR.on,du=(lx-d.lx)/(A.w*kx),dv=(ly-d.ly)/(A.h*ky),c=d.c.slice(),mn=.02;
 if(d.h=='in'){const sx=Math.max(-c[0],Math.min(c[2],du)),sy=Math.max(-c[1],Math.min(c[3],dv));c[0]+=sx;c[2]-=sx;c[1]+=sy;c[3]-=sy}
 else{if(d.h.includes('w'))c[0]=Math.max(0,Math.min(1-c[2]-mn,c[0]+du));if(d.h.includes('e'))c[2]=Math.max(0,Math.min(1-c[0]-mn,c[2]-du));
  if(d.h.includes('n'))c[1]=Math.max(0,Math.min(1-c[3]-mn,c[1]+dv));if(d.h.includes('s'))c[3]=Math.max(0,Math.min(1-c[1]-mn,c[3]-dv))}
 CR.on.c=c;crPaint()}
// --- points
const crCl=v=>Math.max(-.5,Math.min(1.5,v));
// the place on the outline nearest (x, y) (canvas units, the picture's frame), within tol: {i: the segment's first point, t}
function crOnLine(x,y,tol){const S=CR.on,P=S.pts,n=P.length;let best=null;for(let i=0;i<(S.closed?n:n-1);i++){const a=P[i],b=P[(i+1)%n],A=crLoc(a[0],a[1]),B=crLoc(a[4],a[5]),C=crLoc(b[2],b[3]),D=crLoc(b[0],b[1]);
  for(let k=1;k<24;k++){const t=k/24,m=1-t,px=m*m*m*A[0]+3*m*m*t*B[0]+3*m*t*t*C[0]+t*t*t*D[0],py=m*m*m*A[1]+3*m*m*t*B[1]+3*m*t*t*C[1]+t*t*t*D[1],dd=Math.hypot(px-x,py-y);if(dd<tol&&(!best||dd<best.dd))best={i,t,dd}}}return best}
// a point made smooth gets handles along the line through its neighbours, a third of the way to each; made a corner, its handles go back onto it
function crSmooth(i,on){const P=CR.on.pts,q=P[i];if(!on){q[2]=q[4]=q[0];q[3]=q[5]=q[1];return}const a=P[(i-1+P.length)%P.length],b=P[(i+1)%P.length],dx=(b[0]-a[0])/6,dy=(b[1]-a[1])/6;q[2]=q[0]-dx;q[3]=q[1]-dy;q[4]=q[0]+dx;q[5]=q[1]+dy}
function crPtsDown(lx,ly,e){const S=CR.on,hs=4.5*fpUnit()*1.6,[u,v]=crUV(lx,ly),near=(a,b)=>{const[x,y]=crLoc(a,b);return Math.abs(x-lx)<=hs&&Math.abs(y-ly)<=hs};
 const q=S.pts[S.sel];if(q){if(near(q[4],q[5])&&(q[4]!=q[0]||q[5]!=q[1])){S.d={k:'out',i:S.sel};return}if(near(q[2],q[3])&&(q[2]!=q[0]||q[3]!=q[1])){S.d={k:'in',i:S.sel};return}}
 const hit=S.pts.findIndex(p=>near(p[0],p[1]));
 if(!S.closed){if(hit==0&&S.pts.length>2){S.closed=true;S.sel=-1;crPaint();return}if(hit>=0){S.sel=hit;S.d={k:'pt',i:hit,u,v};crPaint();return}
  S.pts.push([u,v,u,v,u,v]);S.sel=S.pts.length-1;S.d={k:'new',i:S.sel};crPaint();return}
 if(hit>=0){S.sel=hit;if(e.altKey){const p=S.pts[hit];crSmooth(hit,p[2]==p[0]&&p[3]==p[1]&&p[4]==p[0]&&p[5]==p[1])}else S.d={k:'pt',i:hit,u,v};crPaint();return}
 const on=crOnLine(lx,ly,hs);if(on){S.pts.splice(on.i+1,0,[u,v,u,v,u,v]);S.sel=on.i+1;S.d={k:'pt',i:on.i+1,u,v};crPaint();return}
 if(u<0||u>1||v<0||v>1){crEnd(true);return}
 S.sel=-1;crPaint()}
function crPtsMove(lx,ly,e){const S=CR.on,d=S.d,[u,v]=crUV(lx,ly),q=S.pts[d.i];if(!q)return;
 if(d.k=='new'){q[4]=crCl(u);q[5]=crCl(v);q[2]=crCl(2*q[0]-u);q[3]=crCl(2*q[1]-v)}
 else if(d.k=='pt'){const du=u-d.u,dv=v-d.v;for(let j=0;j<6;j++)q[j]=crCl(q[j]+(j%2?dv:du));d.u=u;d.v=v}
 else{const[a,b,c,dd]=d.k=='out'?[4,5,2,3]:[2,3,4,5];q[a]=crCl(u);q[b]=crCl(v);if(!e.altKey){const L=Math.hypot(q[c]-q[0],q[dd]-q[1])||Math.hypot(u-q[0],v-q[1]),M=Math.hypot(u-q[0],v-q[1])||1;q[c]=crCl(q[0]-(u-q[0])/M*L);q[dd]=crCl(q[1]-(v-q[1])/M*L)}}
 crPaint()}
// apply. Rectangle: the picture becomes the size of what is left, where it lay, at the same scale (a shape: Cover, no zoom); its size s stays and its width and height change.
// Points: the outline is kept on the picture (an outline of fewer than three points takes the point crop away)
function crEnd(apply){const S=CR.on;if(!S)return;CR.on=null;
 if(apply&&S.mode=='rect'&&S.c.some((v,i)=>Math.abs(v-S.cs[i])>1e-4)){const{p,A,c,kx,ky}=S,cw=1-c[0]-c[2],ch=1-c[1]-c[3];CR.on=S;const[mx,my]=crLoc(c[0]+cw/2,c[1]+ch/2),[X,Y]=crToC(mx,my);CR.on=null;const s=Math.max(1,+p.s||100);
  p.x=+X.toFixed(2);p.y=+Y.toFixed(2);p.wx=+(cw*A.w*kx/s).toFixed(4);p.wy=+(ch*A.h*ky/s).toFixed(4);if(p.k!='image'){delete p.iz;delete p.im}
  if(c.every(v=>v<1e-4))delete p.ic;else p.ic=c.map(v=>+v.toFixed(4));store()}
 if(apply&&S.mode=='pts'&&S.pts.length&&S.pts.length<3)pmsg('Point crop needs at least 3 points, so no crop was made.');
 if(apply&&S.mode=='pts'){const pts=S.pts.length>2?S.pts.map(q=>q.map(v=>+(+v).toFixed(4))):[];if(JSON.stringify(pts)!==S.p0){if(pts.length)S.p.pc=pts;else delete S.p.pc;store()}}
 upd();crPaint()}
function init94(){
 WBX.wbCropOv=crOv;WBX.wbCropHide=p=>!!(CR.on&&CR.on.p===p);WBX.wbCropOn=()=>!!CR.on;WBX.wbCropSync=()=>{const b=$('mf_cropr');if(b){const p=crSel(),v=!!p&&p.k=='motif';if(b.hidden===v)b.hidden=!v}};
 cmdRegister({id:'image.crop',label:'Crop the picture',elId:'mf_crop',enabled:()=>!!crSel(),run:()=>crStart()});
 cmdRegister({id:'image.pointcrop',label:'Point crop the image',elId:'im_pcrop',enabled:()=>{const p=crSel();return!!p&&p.k=='image'},run:()=>crPtsStart()});
 $('mf_crop').addEventListener('click',crStart);$('im_crop').addEventListener('click',crStart);$('im_pcrop').addEventListener('click',crPtsStart);
 const art=$('art');
 art.addEventListener('pointerdown',e=>{if(!CR.on||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();const[X,Y]=fpPt(e),[lx,ly]=crFromC(X,Y);
  if(CR.on.mode=='pts'){crPtsDown(lx,ly,e);if(CR.on&&CR.on.d)try{art.setPointerCapture(e.pointerId)}catch(x){}return}
  const hs=4.5*fpUnit()*1.6,h=crHd().find(([,x,y])=>Math.abs(x-lx)<=hs&&Math.abs(y-ly)<=hs),{c}=CR.on,[l,t]=crLoc(c[0],c[1]),[r,b]=crLoc(1-c[2],1-c[3]);
  if(h)CR.on.d={h:h[0],lx,ly,c:c.slice()};else if(lx>=Math.min(l,r)&&lx<=Math.max(l,r)&&ly>=t&&ly<=b)CR.on.d={h:'in',lx,ly,c:c.slice()};else{crEnd(true);return}
  try{art.setPointerCapture(e.pointerId)}catch(x){}},true);
 art.addEventListener('pointermove',e=>{if(!CR.on||!CR.on.d)return;e.stopImmediatePropagation();const[X,Y]=fpPt(e),[lx,ly]=crFromC(X,Y);if(CR.on.mode=='pts')crPtsMove(lx,ly,e);else crMove(lx,ly)},true);
 art.addEventListener('pointerup',e=>{if(!CR.on||!CR.on.d)return;e.stopImmediatePropagation();CR.on.d=null},true);
 document.addEventListener('keydown',e=>{if(!CR.on||(e.target.matches&&e.target.matches('input,textarea,select')))return;const S=CR.on;
  if(e.key=='Enter'){e.preventDefault();e.stopImmediatePropagation();if(S.mode=='pts'&&S.pts.length<3){pmsg('Point crop needs at least 3 points: click the picture to add more.');return}if(S.mode=='pts')S.closed=true;crEnd(true)}
  else if(e.key=='Escape'){e.preventDefault();e.stopImmediatePropagation();crEnd(false)}
  else if(S.mode=='pts'&&(e.key=='Delete'||e.key=='Backspace')&&S.sel>=0){e.preventDefault();e.stopImmediatePropagation();S.pts.splice(S.sel,1);S.sel=-1;if(S.pts.length<3)S.closed=false;crPaint()}},true)}
export {init94};
