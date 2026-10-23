import {plDisarm} from './72-placing.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CW,col,okC} from './04-canvas-and-stamp-outlines.js';
import {mk,store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elExtend,elSel} from './65-element-core.js';
import {fxGr,fxJit,fxTex} from './69-effect-stack.js';
import {abInsert} from './73-add-bar.js';
import {stUnlocked} from './63-stamp-tool.js';
import {mNm} from './21-motif-library-ui.js';

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
  const k=(o.pic.im=='contain'?Math.min(w/A.w,h/A.h):Math.max(w/A.w,h/A.h))*Math.max(.05,Math.min(8,(+o.pic.iz||100)/100));
  body+=`<g mask="url(#${mid})"><use href="#${aid}" transform="scale(${k.toFixed(5)}) translate(${mt2(-A.w/2)} ${mt2(-A.h/2)})"/></g>`}
 else if(o.fill)body+=`<rect ${R} fill="${o.fill}" mask="url(#${mid})"/>`;
 return{defs,body}}
// the look of a motif (an element, a stamp's motif or a pattern's source) as mtDraw takes it; ink: its fill colour (a colour reference resolved by the caller)
const mtPic=p=>p.fl=='img'&&p.a&&WBS.ARTS[p.a]?{A:WBS.ARTS[p.a],a:p.a,iz:p.iz,im:p.im}:null;
function mtfLayer(L,li,pa){const pl=(L.pl||[]).filter(p=>p.k=='motif'&&p.m);if(!pl.length)return['',''];const fr=new Map(),ed=li==WBS.selL&&!$('boardP').classList.contains('off'),seen=new Set();let defs='',out='';
 pl.forEach(p=>{const id=String(p.u).replace(/[^\w-]/g,''),s=Math.max(1,+p.s||100),J=fxJit(p),k=s*(J?J.sz:1),fx=(J?J.dx:0),fy=(J?J.dy:0),rr=(+p.r||0)+(J?J.dr:0),fl=(+p.f||1)*(J&&J.sx<0?-1:1),fv=J&&J.sy<0?-1:1,
  w=k*(+p.wx||1),h=k*(+p.wy||1),sw=+p.sw>0?+p.sw:0,box={x:(+p.x||0)-w*.6-sw,y:(+p.y||0)-h*.6-sw,W:w*1.2+2*sw,H:h*1.2+2*sw,R:400},T=p.fx&&p.fx.length?fxTex(p,'mtx'+li+'_'+id,box):null,G=p.fx&&p.fx.length?fxGr(p,'mtg'+li+'_'+id,box):null,
  D=mtDraw(p.m,{w,h,fill:p.fl=='none'?'':okC(p.ink)?col(p.ink):col(WBS.proj.ink),pic:mtPic(p),sw,sk:col(okC(p.sk)?p.sk:WBS.proj.ink)},'mt'+li+'_'+id,seen);
  defs+=D.defs;if(T)defs+=T.defs;if(G)defs+=G.defs;
  const body=`<g${ed?` data-mv="${p.u}" data-mx="${+p.x||0}" data-my="${+p.y||0}"`:''} transform="translate(${mtF((+p.x||0)+fx)} ${mtF((+p.y||0)+fy)}) rotate(${mtF(rr)}) scale(${fl} ${fv})">${D.body}</g>`;
  const one=T||G?`<g${T?T.attrs:''}>${G?G.wrap(body):body}</g>`:body;out+=one;fr.set(String(p.u),one)});
 return[defs,out,'','',fr]}
// make a Motif element at x, y (canvas units) of motif m, above the selected element; it is selected
function mtfMake(m,x,y,s,r){const q=abInsert({u:fpU(),k:'motif',m,x:+mtF(x),y:+mtF(y),s:+(s||100).toFixed(1),r:+(r||0),f:1});if(!q)return null;mtLast=m;store();upd();if(WBX.wbCap)WBX.wbCap();return q}
const mtfSize=()=>{const b=WBS.brush;return b&&b.s?Math.max(20,Math.min(400,b.s*100)):100};
// 2.26.0 (review 12): a Motif on the canvas is edited in the Motif panel. Its Element group (size, turn, position, flip, order) sits at the top; the panel's Edit group, which works on the shapes of a stamp, switches to
// the canvas motif's Width, Height and Colour while one is selected (the rest of Edit is for stamp shapes and hides).
const mtSel=()=>{const q=elSel();return q&&q.k=='motif'&&stUnlocked()==null?q:null};
function mtSync(){const e=$('sel');if(!e)return;const q=mtSel();if(e.classList.contains('mtel')!==!!q)e.classList.toggle('mtel',!!q);if(!q)return;
 const x=Math.round((+q.wx||1)*100),y=Math.round((+q.wy||1)*100);if($('ssx').value!=x)$('ssx').value=x;if($('ssy').value!=y)$('ssy').value=y}
function init74(){
 WBX.wbMotifSize=mtfSize;WBX.wbMtSel=mtSel;WBX.wbMtSync=mtSync;
 [['ssx','wx'],['ssy','wy']].forEach(([id,f])=>$(id).addEventListener('input',e=>{const q=mtSel();if(!q)return;e.stopImmediatePropagation();const v=+e.target.value/100;if(v==1)delete q[f];else q[f]=+v.toFixed(3);store();upd()},true));
 elExtend('motif',{dz:5,pn:'motifs',is:q=>q.k=='motif',name:q=>q.nm||mNm(q.m)||'Motif',draw:(L,li,pa)=>mtfLayer(L,li,pa)});
 // a click on the canvas with a shape armed and no stamp unlocked: a free Motif element there (64-stamp-canvas-edit.js asks first)
// Add motif (2.7.0): a Motif in the middle of the canvas, the last one used or else the first of the library, selected; the library then changes its shape
 WBX.wbMotifAdd=()=>{const m=mtLast;if(!m){if(WBX.wbOpenPanel)WBX.wbOpenPanel('motifs');return}   /* 2.26.0: nothing chosen yet, so the library opens (it used to place the first shape, a battle axe) */WBS.brush=null;if(stUnlocked()!=null){if(WBX.wbStampAddMotif)WBX.wbStampAddMotif(m,.8);return}if(!fpL())return;plDisarm();WBS.fpSel=-1;WBS.fpMS=new Set();WBS.brush={m,s:.8,r:0};upd()};
 WBX.wbMotifAt=(x,y)=>{const b=WBS.brush;if(!b||b.txt||!b.m||!fpL())return false;mtfMake(b.m,x,y,mtfSize(),b.r||0);return true};
 // picking a library shape while a Motif element is selected changes that element's shape
 WBX.wbMotifSwap=m=>{if(WBS.brush)return false;const L=fpL(),q=L&&(L.pl||[]).find(x=>String(x.u)===String(WBS.fpSel));if(!q||q.k!='motif')return false;q.m=m;mtLast=m;store();upd();if(WBX.wbCap)WBX.wbCap();return true};
}
export {init74,mtfLayer,mtDraw,mtPic};
