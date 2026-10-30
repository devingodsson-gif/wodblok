import {plDisarm} from './72-placing.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,col,okC} from './04-canvas-and-stamp-outlines.js';
import {bkElMark} from './03-stamp-prints-and-drawing.js';
import {mk,store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elExtend,elSel} from './65-element-core.js';
import {fxGr,fxJit,fxTex} from './69-effect-stack.js';
import {abInsert} from './73-add-bar.js';
import {stUnlocked} from './63-stamp-tool.js';
import {mNm} from './21-motif-library-ui.js';
import {basicKey} from './76-basic-shapes.js';

// ===== The Motif element (2.3.0, owner Oct 20 2026: "add shapes freely to the canvas"): one library shape on the canvas on its own, not inside a stamp.
// {u, k:'motif', m: motif key, x, y (its middle, canvas units), s (its size: the 100-unit motif box becomes s units), r (degrees), f (1 or -1, flipped), ink?,
//  wx, wy (stretch: the box is s*wx by s*wy), fl ('none' = no fill, 'img' = filled with a picture: a = the picture's id in the project, iz = zoom in %, im = 'contain' to fit it whole, else it covers the box),
//  sw (outline width in canvas units, none = no outline), sk (outline colour, the project ink when not set)}.
// Its carved details are see-through, as on a stamp; fill, picture and outline follow them. Effects: Texture, Jitter and Colour grade.
// 2.31.0 (owner Oct 23 2026): the Shape element is gone; the Motif took over what it did (stretch, no fill, a picture, an outline) and its shapes are the Basic shapes set.
// Making one (2.4.0): the Motif button opens the library and makes nothing; picking a shape there arms it (a ghost follows the pointer) and every click on the canvas
// places one, as often as wanted. With a Motif selected and nothing armed, picking a shape changes the selected one instead. While a stamp is unlocked (stamp editing), a click on that stamp puts the shape in the stamp instead, as before.
const mtF=v=>(+v).toFixed(1);
const mt2=v=>(+v).toFixed(2);
let mtLast='';   // the motif key of the last shape used
// One motif drawn in its own frame (middle at 0,0, not turned or flipped; the turn and flip are the caller's), w by h units: its fill (a colour, or none), a picture in its
// place, and an outline of width sw round it, holes included. Used by the Motif element, by the motifs of a stamp (09) and so by Patterns.
// o: {w, h, fill (a colour or ''), pic ({A, iz, im}) , sw, sk (a colour), inner (the mask's markup in the 100 box, for Thickness)}; seen: picture ids already defined (one <image> each)
// The outline is the motif grown by sw (a blur of its outline cut at a low level: round, the same width all round), drawn under the motif (or, with no fill, less the motif itself),
// so it stands outside the shape and keeps its width however the motif is scaled or stretched.
// ip: the id prefix of the pictures; seen === true: the pictures are defined elsewhere (a stamp's pictures live in #stpix, see 10-layer-grids.js)
function mtDraw(m,o,id,seen,ip='mai_'){const w=Math.max(.01,o.w),h=Math.max(.01,o.h),sw=+o.sw>0?Math.min(400,+o.sw):0,X=w*.6+sw*1.5+1,Y=h*.6+sw*1.5+1,mid=id+'m',
 R=`x="${mt2(-X)}" y="${mt2(-Y)}" width="${mt2(2*X)}" height="${mt2(2*Y)}"`;
 let defs=`<mask id="${mid}" maskUnits="userSpaceOnUse" ${R}><g transform="scale(${(w/100).toFixed(4)} ${(h/100).toFixed(4)})">${o.inner||mk(m,'#fff','#000')}</g></mask>`,body='';
 const ring=!o.fill&&!(o.pic&&o.pic.A);   // with a fill the outline is the grown motif under it (no seam where they meet); with none it is only the ring
 if(sw&&o.sk){defs+=`<filter id="${id}o" filterUnits="userSpaceOnUse" ${R} color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${mt2(sw/2)}"/><feComponentTransfer result="d"><feFuncA type="linear" slope="48" intercept="-1.1"/></feComponentTransfer>${ring?'<feComposite in="d" in2="SourceAlpha" operator="out" result="r"/>':''}<feFlood flood-color="${o.sk}"/><feComposite in2="${ring?'r':'d'}" operator="in"/></filter>`;
  body+=`<g filter="url(#${id}o)"><rect ${R} fill="#000" mask="url(#${mid})"/></g>`}
 const A=o.pic&&o.pic.A;
 if(A){const aid=ip+String(o.pic.a).replace(/[^\w-]/g,'');if(seen!==true&&(!seen||!seen.has(aid))){if(seen)seen.add(aid);defs+=`<image id="${aid}" href="${A.src}" x="0" y="0" width="${A.w}" height="${A.h}" preserveAspectRatio="none"/>`}
  // 2.74.2: a cropped picture (ic: the part cut off left, top, right, bottom; 94-image-crop.js) is laid in as if it were only what is left
  const ic=Array.isArray(o.pic.ic)&&o.pic.ic.some(v=>+v>0)?o.pic.ic.map(v=>Math.max(0,Math.min(.98,+v||0))):null,cx=ic?A.w*ic[0]:0,cy=ic?A.h*ic[1]:0,cw=ic?A.w*(1-ic[0]-ic[2]):A.w,ch=ic?A.h*(1-ic[1]-ic[3]):A.h;
  const k=(o.pic.im=='contain'?Math.min(w/cw,h/ch):Math.max(w/cw,h/ch))*Math.max(.05,Math.min(8,(+o.pic.iz||100)/100));
  if(ic)defs+=`<clipPath id="${mid}ic"><rect x="${mt2(cx)}" y="${mt2(cy)}" width="${mt2(cw)}" height="${mt2(ch)}"/></clipPath>`;
  body+=`<g mask="url(#${mid})"><use href="#${aid}" transform="scale(${k.toFixed(5)}) translate(${mt2(-cx-cw/2)} ${mt2(-cy-ch/2)})"${ic?` clip-path="url(#${mid}ic)"`:''}/></g>`}
 else if(o.fill)body+=`<rect ${R} fill="${o.fill}" mask="url(#${mid})"/>`;
 return{defs,body}}
// the look of a motif (an element, a stamp's motif or a pattern's source) as mtDraw takes it; ink: its fill colour (a colour reference resolved by the caller)
const mtPic=p=>p.fl=='img'&&p.a&&WBS.ARTS[p.a]?{A:WBS.ARTS[p.a],a:p.a,iz:p.iz,im:p.im,ic:p.ic}:null;
// the shape that is being edited or moved draws live: its print would be out of date at every step
const mtLive=p=>{const d=WBS.fpDrag,m=WBS.fpMS;return p.u==WBS.fpSel||!!(m&&m.has&&m.has(p.u))||!!(d&&(d.p===p||d.g&&d.g.some(a=>a[0]===p)))};
// the box a w by h shape takes up on the canvas when it is turned r degrees: its effects work inside that box (2.74.2: a tall shape turned towards flat ran out of
// the unturned box and was cut off by an invisible edge)
const mtTurned=(w,h,r)=>{const a=r*Math.PI/180,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));return[w*c+h*s,w*s+h*c]};
function mtfLayer(L,li,pa){const pl=(L.pl||[]).filter(p=>p.k=='motif'&&p.m);if(!pl.length)return['',''];if(WBX.wbMtWarm)pl.forEach(p=>WBX.wbMtWarm(p.m));const fr=new Map(),ed=li==WBS.selL&&!$('boardP').classList.contains('off'),seen=new Set();let defs='',out='';
 pl.forEach(p=>{if(WBX.wbCropHide&&WBX.wbCropHide(p))return;   /* a picture being cropped is drawn by the crop's overlay */
  if(p.flt&&!p.bgd){const r=mtFilter(p,li,seen);defs+=r.defs;fr.set(String(p.u),r.piece);return}
  const id=String(p.u).replace(/[^\w-]/g,''),s=Math.max(1,+p.s||100),J=fxJit(p),k=s*(J?J.sz:1),fx=(J?J.dx:0),fy=(J?J.dy:0),rr=(+p.r||0)+(J?J.dr:0),fl=(+p.f||1)*(J&&J.sx<0?-1:1),fv=J&&J.sy<0?-1:1,
  w=k*(+p.wx||1),h=k*(+p.wy||1),sw=+p.sw>0?+p.sw:0,[bw,bh]=mtTurned(w,h,rr),box={x:(+p.x||0)+fx-bw*.6-sw,y:(+p.y||0)+fy-bh*.6-sw,W:bw*1.2+2*sw,H:bh*1.2+2*sw,R:400},T=p.fx&&p.fx.length?fxTex(p,'mtx'+li+'_'+id,box):null,G=p.fx&&p.fx.length?fxGr(p,'mtg'+li+'_'+id,box):null,
  da={w,h,fill:p.fl=='none'?'':okC(p.ink)?col(p.ink):col(WBS.proj.ink),pic:mtPic(p),sw,sk:col(okC(p.sk)?p.sk:WBS.proj.ink)},D=mtDraw(p.m,da,'mt'+li+'_'+id,seen);
  defs+=D.defs;if(T)defs+=T.defs;if(G)defs+=G.defs;
  const body=`<g transform="translate(${mtF((+p.x||0)+fx)} ${mtF((+p.y||0)+fy)}) rotate(${mtF(rr)}) scale(${fl} ${fv})">${D.body}</g>`;
  let one=T||G?`<g${T?T.attrs:''}>${G?G.wrap(body):body}</g>`:body;
  // 2.44.3: a shape with effects that is not being edited or moved is printed once into an image (03-stamp-prints-and-drawing.js); the picture it shows is the same, only the browser stops redrawing its effects on every change
  if((T||G)&&!mtLive(p))one=bkElMark('m'+li+'_'+id,one,(da.pic?mtDraw(p.m,da,'mt'+li+'_'+id,null).defs:D.defs)+(T?T.defs:'')+(G?G.defs:''),{x:(+p.x||0)+fx,y:(+p.y||0)+fy,r:Math.hypot(w,h)*.6+sw});
  // 2.56.0: the [data-mv] group a drag moves (28-canvas-select.js fpLive) is the outermost one, round the effects too: their filter regions are in canvas units,
  // so moving only the body inside them took the shape out of its effects' region and it vanished once it left its old box
  if(ed)one=`<g data-mv="${p.u}" data-mx="${+p.x||0}" data-my="${+p.y||0}">${one}</g>`;
  out+=one;fr.set(String(p.u),one)});
 return[defs,out,'','',fr]}
// ===== Filter mode (2.38.0, owner Oct 24 2026): a shape with {flt:1} draws no ink of its own; its effects work on what is drawn under it, inside its outline.
// The piece holds two tokens the element list fills in (elDraw's render): @@UNDER@@, the markup drawn so far at this level, and @@UID@@, an id for it.
// The picture is drawn as it is; inside the outline a copy with the shape's effects (Texture, the filter effects, Colour grade) is laid over it, so where an effect
// leaves a pixel see-through (a blur at the canvas edge) the picture still shows.
// The shape's opacity is the filter's strength. Jitter and Pressure offset do not apply. Effects that read an outline (Halftone, Line Screen, Stipple, Ink Bleed,
// Misregistration, Dust's holes) read the picture's darkness instead and fill their gaps with the Background's colour (white without one): they get {__fm:{paper}}.
const FLT_U='@@UNDER@@',FLT_I='@@UID@@',FLT_S='@@FSPLIT@@';   // 2.40.1: FLT_S splits the picture drawn so far from the filtered copy, which a repeat tile copies to the neighbouring tiles on its own
// 2.53.0: the Background is a Sheet; with a colour fill its colour is the paper, otherwise white
function mtPaper(){for(const L of WBS.layers||[])for(const q of L.pl||[])if(q.bgd&&q.v!==false&&q.k=='sheet'&&!q.fl)return okC(q.ink)?col(q.ink):col(WBS.proj.bg);return'#ffffff'}
function mtFilter(p,li,seen){if(WBS.DRAFT&&WBS.DRAFTCV)return{defs:'',piece:FLT_U};   // while something is dragged on the canvas the picture is drawn without the filter, and with it once the drag ends (a slider drag keeps it, so the filter is seen while it is set)
 const id=String(p.u).replace(/[^\w-]/g,''),s=Math.max(1,+p.s||100),w=s*(+p.wx||1),h=s*(+p.wy||1),op=p.op!=null?Math.max(0,Math.min(100,+p.op))/100:1,
 [bw,bh]=mtTurned(w,h,+p.r||0),box={x:(+p.x||0)-bw*.6,y:(+p.y||0)-bh*.6,W:bw*1.2,H:bh*1.2,R:400},q={...p,__fm:{paper:mtPaper()}},T=fxTex(q,'flx'+li+'_'+id,box),G=fxGr(q,'flg'+li+'_'+id,box),
 tf=`translate(${mtF(+p.x||0)} ${mtF(+p.y||0)}) rotate(${mtF(+p.r||0)}) scale(${+p.f||1} 1)`,
 Wi=mtDraw(p.m,{w,h,fill:'#fff'},'fli'+li+'_'+id,seen),R=`maskUnits="userSpaceOnUse" x="${mtF(-CW)}" y="${mtF(-CH)}" width="${mtF(3*CW)}" height="${mtF(3*CH)}"`;
 let defs=Wi.defs+(T?T.defs:'')+(G?G.defs:'');
 defs+=`<mask id="flmi${li}_${id}" ${R}><g opacity="${op.toFixed(3)}"><g transform="${tf}">${Wi.body}</g></g></mask>`;
 const use=`<use href="#${FLT_I}"/>`,fx=T||G?`<g${T?T.attrs:''}>${G?G.wrap(use):use}</g>`:use;
 return{defs,piece:`<g id="${FLT_I}">${FLT_U}</g>${FLT_S}<g mask="url(#flmi${li}_${id})">${fx}</g>`}}
// make a Motif element at x, y (canvas units) of motif m, above the selected element; it is selected
function mtfMake(m,x,y,s,r){const q=abInsert({u:fpU(),k:'motif',m,x:+mtF(x),y:+mtF(y),s:+(s||100).toFixed(1),r:+(r||0),f:1});if(!q)return null;mtLast=m;store();upd();if(WBX.wbCap)WBX.wbCap();return q}
const mtfSize=()=>{const b=WBS.brush;return b&&b.s?Math.max(20,Math.min(400,b.s*100)):100};
// 2.26.0 (review 12): a Motif on the canvas is edited in the Motif panel. Its Element group (size, turn, position, flip, order) sits at the top; the panel's Edit group, which works on the shapes of a stamp, switches to
// the canvas motif's Width, Height and Colour while one is selected (the rest of Edit is for stamp shapes and hides).
const mtSel=()=>{const q=elSel();return q&&q.k=='motif'&&stUnlocked()==null?q:null};
// 2.76.8: with no shape selected and no stamp open, the Shape panel shows the library only (its Edit group is the stamp tab's); a shape's Width and Height sit
// under Size in the Element group (lfpwh), the Edit group's own copies hidden
function mtSync(){const e=$('sel');if(!e)return;const q=mtSel();if(e.classList.contains('mtel')!==!!q)e.classList.toggle('mtel',!!q);
 {const g=e.closest('details.g'),off=!q&&stUnlocked()==null;if(g&&g.hidden!==off)g.hidden=off;const wh=$('lfpwh');if(wh&&wh.hidden!==!q)wh.hidden=!q}if(!q)return;
 const x=Math.round((+q.wx||1)*100),y=Math.round((+q.wy||1)*100);if($('ssx').value!=x)(WBX.wbRngSet||((r,v)=>r.value=v))($('ssx'),x);if($('ssy').value!=y)(WBX.wbRngSet||((r,v)=>r.value=v))($('ssy'),y);
 {const R=WBX.wbRngSet||((r,v)=>r.value=v);if($('lfpsw')&&$('lfpsw').value!=x)R($('lfpsw'),x);if($('lfpsh')&&$('lfpsh').value!=y)R($('lfpsh'),y)}}
function init74(){
 WBX.wbMotifSize=mtfSize;WBX.wbMtSel=mtSel;WBX.wbMtSync=mtSync;
 [['ssx','wx'],['ssy','wy'],['lfpsw','wx'],['lfpsh','wy']].forEach(([id,f])=>$(id).addEventListener('input',e=>{const q=mtSel();if(!q)return;e.stopImmediatePropagation();const v=+e.target.value/100;if(v==1)delete q[f];else q[f]=+v.toFixed(3);store();upd()},true));
 elExtend('motif',{dz:5,pn:'motifs',is:q=>q.k=='motif',name:q=>q.nm||mNm(q.m)||'Shape',draw:(L,li,pa)=>mtfLayer(L,li,pa)});
 // a click on the canvas with a shape armed and no stamp unlocked: a free Motif element there (64-stamp-canvas-edit.js asks first)
// Add motif (2.7.0): a Motif in the middle of the canvas, the last one used or else the first of the library, selected; the library then changes its shape
 WBX.wbMotifAdd=()=>{const m=mtLast||basicKey('rect');if(!m){if(WBX.wbOpenPanel)WBX.wbOpenPanel('motifs');return}   /* 2.76.8 (owner, Oct 22 and 29 2026): the Shape button arms the last shape at once, else a rectangle (2.26.0 opened the library and armed nothing) */WBS.brush=null;if(stUnlocked()!=null){if(WBX.wbStampAddMotif)WBX.wbStampAddMotif(m,.8);return}if(!fpL())return;plDisarm();WBS.fpSel=-1;WBS.fpMS=new Set();WBS.brush={m,s:.8,r:0};upd()};
 WBX.wbMotifAt=(x,y)=>{const b=WBS.brush;if(!b||b.txt||!b.m||!fpL())return false;mtfMake(b.m,x,y,mtfSize(),b.r||0);return true};
 // picking a library shape while a Motif element is selected changes that element's shape
 WBX.wbMotifSwap=m=>{if(WBS.brush)return false;const L=fpL(),q=L&&(L.pl||[]).find(x=>String(x.u)===String(WBS.fpSel));if(!q||q.k!='motif')return false;q.m=m;mtLast=m;store();upd();if(WBX.wbCap)WBX.wbCap();return true};
}
export {FLT_I,FLT_S,FLT_U,init74,mtfLayer,mtDraw,mtPaper,mtPic,mtTurned};
