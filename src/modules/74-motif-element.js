import {$,WBS,WBX} from './01-launch-and-version.js';
import {CW,col,okC} from './04-canvas-and-stamp-outlines.js';
import {CATS} from './05-motif-data.js';
import {mk,store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elExtend} from './65-element-core.js';
import {fxGr,fxJit,fxTex} from './69-effect-stack.js';
import {abInsert} from './73-add-bar.js';

// ===== The Motif element (2.3.0, owner Oct 20 2026: "add shapes freely to the canvas"): one library shape on the canvas on its own, not inside a stamp.
// {u, k:'motif', m: motif key, x, y (its middle, canvas units), s (its size: the 100-unit motif box becomes s units), r (degrees), f (1 or -1, flipped), ink?}
// Its carved details are see-through, as on a stamp. Effects: Texture, Jitter and Colour grade.
// Making one (2.4.0): the Motif button opens the library and makes nothing; picking a shape there arms it (a ghost follows the pointer) and every click on the canvas
// places one, as often as wanted. With a Motif selected and nothing armed, picking a shape changes the selected one instead. While a stamp is unlocked (stamp editing), a click on that stamp puts the shape in the stamp instead, as before.
const mtF=v=>(+v).toFixed(1);
let mtLast='';   // the motif key of the last shape used
function mtfLayer(L,li,pa){const pl=(L.pl||[]).filter(p=>p.k=='motif'&&p.m);if(!pl.length)return['',''];const fr=new Map(),ed=li==WBS.selL&&!$('boardP').classList.contains('off');let defs='',out='';
 pl.forEach(p=>{const id=String(p.u).replace(/[^\w-]/g,''),ink=okC(p.ink)?col(p.ink):col(WBS.proj.ink),s=Math.max(1,+p.s||100),J=fxJit(p),k=s/100*(J?J.sz:1),fx=(J?J.dx:0),fy=(J?J.dy:0),rr=(+p.r||0)+(J?J.dr:0),fl=(+p.f||1)*(J&&J.sx<0?-1:1),fv=J&&J.sy<0?-1:1,
  mid='mtm'+li+'_'+id,box={x:(+p.x||0)-s*.75,y:(+p.y||0)-s*.75,W:s*1.5,H:s*1.5,R:400},T=p.fx&&p.fx.length?fxTex(p,'mtx'+li+'_'+id,box):null,G=p.fx&&p.fx.length?fxGr(p,'mtg'+li+'_'+id,box):null;
  defs+=`<mask id="${mid}" maskUnits="userSpaceOnUse" x="-110" y="-110" width="220" height="220">${mk(p.m,'#fff','#000')}</mask>`;if(T)defs+=T.defs;if(G)defs+=G.defs;
  const body=`<g${ed?` data-mv="${p.u}" data-mx="${+p.x||0}" data-my="${+p.y||0}"`:''} transform="translate(${mtF((+p.x||0)+fx)} ${mtF((+p.y||0)+fy)}) rotate(${mtF(rr)}) scale(${(k*fl*(+p.wx||1)).toFixed(4)} ${(k*fv*(+p.wy||1)).toFixed(4)})"><rect x="-110" y="-110" width="220" height="220" fill="${ink}" mask="url(#${mid})"/></g>`;
  const one=T||G?`<g${T?T.attrs:''}>${G?G.wrap(body):body}</g>`:body;out+=one;fr.set(String(p.u),one)});
 return[defs,out,'','',fr]}
// make a Motif element at x, y (canvas units) of motif m, above the selected element; it is selected
function mtfMake(m,x,y,s,r){const q=abInsert({u:fpU(),k:'motif',m,x:+mtF(x),y:+mtF(y),s:+(s||100).toFixed(1),r:+(r||0),f:1});if(!q)return null;mtLast=m;store();upd();if(WBX.wbCap)WBX.wbCap();return q}
const mtfSize=()=>{const b=WBS.brush;return b&&b.s?Math.max(20,Math.min(400,b.s*100)):100};
function init74(){
 elExtend('motif',{dz:5,pn:'mlist',is:q=>q.k=='motif',name:q=>q.nm||'Motif',draw:(L,li,pa)=>mtfLayer(L,li,pa)});
 // a click on the canvas with a shape armed and no stamp unlocked: a free Motif element there (64-stamp-canvas-edit.js asks first)
// Add motif (2.7.0): a Motif in the middle of the canvas, the last one used or else the first of the library, selected; the library then changes its shape
 WBX.wbMotifAdd=()=>{const c=CATS.find(x=>!WBS.HID.includes(x.n)&&x.k.length),m=mtLast||(c&&c.k[0]);if(!m||!fpL())return;WBS.brush=null;mtfMake(m,CW/2,CH/2,100,0)};
 WBX.wbMotifAt=(x,y)=>{const b=WBS.brush;if(!b||b.txt||!b.m||!fpL())return false;mtfMake(b.m,x,y,mtfSize(),b.r||0);return true};
 // picking a library shape while a Motif element is selected changes that element's shape
 WBX.wbMotifSwap=m=>{if(WBS.brush)return false;const L=fpL(),q=L&&(L.pl||[]).find(x=>String(x.u)===String(WBS.fpSel));if(!q||q.k!='motif')return false;q.m=m;mtLast=m;store();upd();if(WBX.wbCap)WBX.wbCap();return true};
}
export {init74,mtfLayer};
