import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {bkElMark} from './03-stamp-prints-and-drawing.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {artBU} from './25-art-layers.js';
import {elExtend,elSel} from './65-element-core.js';
import {fxGr,fxTex} from './69-effect-stack.js';
import {abInsert} from './73-add-bar.js';
import {mtTurned} from './74-motif-element.js';
import {pmRegister} from './90-panel-modes.js';

// ===== The Image element (2.75.0, owner Oct 29 2026: "keep images in shapes and sheets just like we have it but also add a more specialized Image element ... I mostly
// want to be able to crop more specifically, like a point based crop"). A picture on the canvas on its own, always drawn whole in its box:
// {u, k:'image', n, a: the picture's id in the project (WBS.ARTS), x, y (its middle), s, wx, wy (its box is s*wx by s*wy canvas units), r (degrees), f (1 or -1, flipped),
//  ic: [left, top, right, bottom] the part of the picture cut off each side (0 to 1; the box shows what is left), pc: the point crop, a closed outline of points on the
//  picture, [[x, y, ix, iy, ox, oy], ...] (0 to 1 of the whole picture: the point, the handle coming in, the handle going out; a corner point has its handles on itself),
//  fe: feather, how soft the crop's edge is (0 to 100), and op, bl, v, fx as any element}.
// Cropping (rectangle or points) never changes the picture: Reset crop brings all of it back. The crop tools are in 94-image-crop.js; the Image panel holds them, the
// Feather slider, and the project's pictures (the library: every picture imported, wherever it is used).
const imF=v=>(+v).toFixed(2),imF4=v=>(+v).toFixed(4);
const imArt=p=>p&&p.a&&WBS.ARTS[p.a]&&WBS.ARTS[p.a].w>0?WBS.ARTS[p.a]:null;
// the part of the picture its box shows, in picture pixels
function imVis(p,A){const c=Array.isArray(p.ic)?p.ic.map(v=>Math.max(0,Math.min(.98,+v||0))):[0,0,0,0];return{c,x:A.w*c[0],y:A.h*c[1],w:Math.max(1,A.w*(1-c[0]-c[2])),h:Math.max(1,A.h*(1-c[1]-c[3]))}}
// the point crop as a path in picture pixels: straight lines between corner points, curves through smooth ones
function imPath(pc,A){if(!Array.isArray(pc)||pc.length<3)return'';const P=pc.map(q=>q.map((v,i)=>(+v||0)*(i%2?A.h:A.w)));let d=`M${imF(P[0][0])} ${imF(P[0][1])}`;
 for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];d+=`C${imF(a[4])} ${imF(a[5])} ${imF(b[2])} ${imF(b[3])} ${imF(b[0])} ${imF(b[1])}`}return d+'Z'}
// one image in its own frame (middle at 0, 0, not turned): {defs, body}. id: a prefix for its definitions; seen: the pictures already defined
// the picture is written as its data address (2.76.2): a print made once and every export are separate documents, which cannot load the page's blob address
function imDraw(p,A,id,seen){const s=Math.max(1,+p.s||100),w=s*(+p.wx||1),h=s*(+p.wy||1),V=imVis(p,A),aid='ima_'+String(p.a).replace(/[^\w-]/g,'');let defs='';
 if(!seen||!seen.has(aid)){if(seen)seen.add(aid);defs+=`<image id="${aid}" href="${A.src}" x="0" y="0" width="${A.w}" height="${A.h}" preserveAspectRatio="none"/>`}
 const d=imPath(p.pc,A),fe=Math.max(0,Math.min(100,+p.fe||0)),cut=V.c.some(v=>v>0),R=`x="${imF(V.x)}" y="${imF(V.y)}" width="${imF(V.w)}" height="${imF(V.h)}"`;let pic=`<use href="#${aid}"/>`;
 // feather: the kept part's edge (the points, else the rectangle) through a blur, as a mask; without it a clip
 if(fe>0){const sd=fe/100*.06*Math.min(V.w,V.h),m=sd*3;defs+=`<filter id="${id}fb" filterUnits="userSpaceOnUse" x="${imF(-m)}" y="${imF(-m)}" width="${imF(A.w+2*m)}" height="${imF(A.h+2*m)}"><feGaussianBlur stdDeviation="${imF(sd)}"/></filter>`+
  `<mask id="${id}fm" maskUnits="userSpaceOnUse" x="${imF(-m)}" y="${imF(-m)}" width="${imF(A.w+2*m)}" height="${imF(A.h+2*m)}"><g filter="url(#${id}fb)">${d?`<path d="${d}" fill="#fff"/>`:`<rect ${R} fill="#fff"/>`}</g></mask>`;pic=`<g mask="url(#${id}fm)">${pic}</g>`}
 else if(d){defs+=`<clipPath id="${id}pc"><path d="${d}"/></clipPath>`;pic=`<g clip-path="url(#${id}pc)">${pic}</g>`}
 if(cut){defs+=`<clipPath id="${id}rc"><rect ${R}/></clipPath>`;pic=`<g clip-path="url(#${id}rc)">${pic}</g>`}
 return{defs,body:`<g transform="scale(${imF4(w/V.w)} ${imF4(h/V.h)}) translate(${imF(-V.x-V.w/2)} ${imF(-V.y-V.h/2)})">${pic}</g>`}}
// the image being edited or moved draws live; one with effects is otherwise printed once (as a shape is, 74-motif-element.js)
const imLive=p=>{const d=WBS.fpDrag,m=WBS.fpMS;return p.u==WBS.fpSel||!!(m&&m.has&&m.has(p.u))||!!(d&&(d.p===p||d.g&&d.g.some(a=>a[0]===p)))};
function imLayer(L,li){const pl=(L.pl||[]).filter(p=>p.k=='image'&&imArt(p));if(!pl.length)return['',''];const fr=new Map(),ed=li==WBS.selL&&!$('boardP').classList.contains('off'),seen=new Set();let defs='',out='';
 pl.forEach(p=>{if(WBX.wbCropHide&&WBX.wbCropHide(p))return;   /* an image being cropped is drawn by the crop's overlay */
  const A=imArt(p),id='im'+li+'_'+String(p.u).replace(/[^\w-]/g,''),s=Math.max(1,+p.s||100),w=s*(+p.wx||1),h=s*(+p.wy||1),rr=+p.r||0,[bw,bh]=mtTurned(w,h,rr),
   box={x:(+p.x||0)-bw*.6,y:(+p.y||0)-bh*.6,W:bw*1.2,H:bh*1.2,R:400},T=p.fx&&p.fx.length?fxTex(p,id+'x',box):null,G=p.fx&&p.fx.length?fxGr(p,id+'g',box):null,D=imDraw(p,A,id,seen);
  defs+=D.defs;if(T)defs+=T.defs;if(G)defs+=G.defs;
  const body=`<g transform="translate(${imF(+p.x||0)} ${imF(+p.y||0)}) rotate(${imF(rr)}) scale(${+p.f||1} 1)">${D.body}</g>`;let one=T||G?`<g${T?T.attrs:''}>${G?G.wrap(body):body}</g>`:body;
  if((T||G)&&!imLive(p))one=bkElMark('i'+li+'_'+String(p.u).replace(/[^\w-]/g,''),one,imDraw(p,A,id,null).defs+(T?T.defs:'')+(G?G.defs:''),{x:+p.x||0,y:+p.y||0,r:Math.hypot(w,h)*.6});
  if(ed)one=`<g data-mv="${p.u}" data-mx="${+p.x||0}" data-my="${+p.y||0}">${one}</g>`;
  out+=one;fr.set(String(p.u),one)});
 return[defs,out,'','',fr]}
// a new image of a picture: half the canvas's short side on its long side, in the middle, selected (Import image, a pick in the library while creating)
function imAdd(a){const A=WBS.ARTS[a];if(!A||!fpL())return null;const S=Math.min(CW,CH)*.5,m=Math.max(A.w,A.h);
 const q=abInsert({u:fpU(),k:'image',n:String(A.n||'Image').slice(0,40),a,x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:+S.toFixed(1),wx:+(A.w/m).toFixed(4),wy:+(A.h/m).toFixed(4),r:0,f:1});
 if(q){store();upd();if(WBX.wbElSeen)WBX.wbElSeen(q.u);if(WBX.wbOpenPanel)WBX.wbOpenPanel('image')}return q}
// a selected image takes another picture: the box keeps its long side and takes the new picture's proportions; its crop is cleared
function imSwap(q,a){const A=WBS.ARTS[a];if(!A||q.a==a)return false;const L=Math.max(+q.s*(+q.wx||1),+q.s*(+q.wy||1)),m=Math.max(A.w,A.h);q.a=a;q.n=String(A.n||'Image').slice(0,40);q.s=+L.toFixed(1);q.wx=+(A.w/m).toFixed(4);q.wy=+(A.h/m).toFixed(4);delete q.ic;delete q.pc}
const imSel=()=>{const q=elSel();return q&&q.k=='image'&&imArt(q)?q:null};
// the panel: the Feather slider and Reset crop follow the selected image
function imSync(){const q=imSel(),g=$('imcrop');if(g&&g.hidden===!!q)g.hidden=!q;if(!q)return;const fe=Math.round(+q.fe||0);if(+$('im_fe').value!==fe)$('im_fe').value=fe;
 const cut=Array.isArray(q.ic)&&q.ic.some(v=>+v>0)||Array.isArray(q.pc)&&q.pc.length>2;if($('im_reset').disabled===cut)$('im_reset').disabled=!cut}
function init95(){
 elExtend('image',{dz:5,is:q=>q.k=='image',name:q=>q.n||(imArt(q)&&imArt(q).n)||'Image',draw:(L,li)=>imLayer(L,li)});
 WBX.wbImageAdd=imAdd;WBX.wbImSync=imSync;WBX.wbImSwap=imSwap;WBX.wbImSel=imSel;WBX.wbImDraw=imDraw;WBX.wbImVis=imVis;WBX.wbImPath=imPath;
 $('im_fe').addEventListener('input',()=>{const q=imSel();if(!q)return;const v=Math.round(+$('im_fe').value);if(v>0)q.fe=v;else delete q.fe;store();upd()});
 $('im_reset').onclick=()=>{const q=imSel(),A=q&&imArt(q);if(!A)return;const s=+q.s,V=imVis(q,A),kx=s*(+q.wx||1)/V.w,ky=s*(+q.wy||1)/V.h,cx=V.x+V.w/2-A.w/2,cy=V.y+V.h/2-A.h/2,a=(+q.r||0)*Math.PI/180,X=-cx*kx*(+q.f||1),Y=-cy*ky;
  // the whole picture comes back at the same scale, where it lay
  q.x=+(+q.x+X*Math.cos(a)-Y*Math.sin(a)).toFixed(2);q.y=+(+q.y+X*Math.sin(a)+Y*Math.cos(a)).toFixed(2);q.wx=+(A.w*kx/s).toFixed(4);q.wy=+(A.h*ky/s).toFixed(4);delete q.ic;delete q.pc;store();upd()};
 // the library of pictures (Replace while an image is selected): a pick swaps its picture
 pmRegister('image',{pn:'image',lib:'section.pn[data-p="image"] details.g:has(> #impane)',at:'#imcrop',pos:'beforebegin',key:q=>String(q.a),name:q=>(imArt(q)&&imArt(q).n)||'Image',
  thumb:q=>{const A=imArt(q);return A?`<img src="${artBU(A)}" alt="" style="width:100%;height:100%;object-fit:contain">`:''},picked:e=>!!e.target.closest('.pctr .lib button[data-pc]')&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey})}
export {imAdd,imDraw,imPath,imSel,imSwap,imVis,init95};
