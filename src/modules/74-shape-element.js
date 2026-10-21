import {WBS,WBX} from './01-launch-and-version.js';
import {col,okC} from './04-canvas-and-stamp-outlines.js';
import {mk,store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elExtend} from './65-element-core.js';
import {fxGr,fxJit,fxTex} from './69-effect-stack.js';
import {abInsert} from './73-add-bar.js';

// ===== The Shape element (2.3.0, owner Oct 20 2026: "add shapes freely to the canvas"): one library shape on the canvas on its own, not inside a stamp.
// {u, k:'shape', m: motif key, x, y (its middle, canvas units), s (its size: the 100-unit motif box becomes s units), r (degrees), f (1 or -1, flipped), ink?}
// Its carved details are see-through, as on a stamp. Effects: Texture, Jitter and Colour grade.
// Making one: the Shape button makes one in the middle of the view (the last shape used) and arms that shape; with a shape armed, a click on the canvas
// makes another there. While a stamp is unlocked (stamp editing), a click on that stamp puts the shape in the stamp instead, as before.
const shF=v=>(+v).toFixed(1);
let shLast='';   // the motif key of the last shape used
function shpLayer(L,li,pa){const pl=(L.pl||[]).filter(p=>p.k=='shape'&&p.m);if(!pl.length)return['',''];const fr=new Map();let defs='',out='';
 pl.forEach(p=>{const id=String(p.u).replace(/[^\w-]/g,''),ink=okC(p.ink)?col(p.ink):col(WBS.proj.ink),s=Math.max(1,+p.s||100),J=fxJit(p),k=s/100*(J?J.sz:1),fx=(J?J.dx:0),fy=(J?J.dy:0),rr=(+p.r||0)+(J?J.dr:0),fl=(+p.f||1)*(J&&J.sx<0?-1:1),fv=J&&J.sy<0?-1:1,
  mid='shm'+li+'_'+id,box={x:(+p.x||0)-s*.75,y:(+p.y||0)-s*.75,W:s*1.5,H:s*1.5,R:400},T=p.fx&&p.fx.length?fxTex(p,'shx'+li+'_'+id,box):null,G=p.fx&&p.fx.length?fxGr(p,'shg'+li+'_'+id,box):null;
  defs+=`<mask id="${mid}" maskUnits="userSpaceOnUse" x="-110" y="-110" width="220" height="220">${mk(p.m,'#fff','#000')}</mask>`;if(T)defs+=T.defs;if(G)defs+=G.defs;
  const body=`<g transform="translate(${shF((+p.x||0)+fx)} ${shF((+p.y||0)+fy)}) rotate(${shF(rr)}) scale(${(k*fl*(+p.wx||1)).toFixed(4)} ${(k*fv*(+p.wy||1)).toFixed(4)})"><rect x="-110" y="-110" width="220" height="220" fill="${ink}" mask="url(#${mid})"/></g>`;
  const one=T||G?`<g${T?T.attrs:''}>${G?G.wrap(body):body}</g>`:body;out+=one;fr.set(String(p.u),one)});
 return[defs,out,'','',fr]}
// make a Shape element at x, y (canvas units) of motif m, above the selected element; it is selected
function shpMake(m,x,y,s,r){const q=abInsert({u:fpU(),k:'shape',m,x:+shF(x),y:+shF(y),s:+(s||100).toFixed(1),r:+(r||0),f:1});if(!q)return null;shLast=m;store();upd();if(WBX.wbCap)WBX.wbCap();return q}
const shpSize=()=>{const b=WBS.brush;return b&&b.s?Math.max(20,Math.min(400,b.s*100)):100};
function init74(){
 elExtend('shape',{dz:5,pn:'mlist',is:q=>q.k=='shape',name:q=>q.nm||'Shape',draw:(L,li,pa)=>shpLayer(L,li,pa)});
 // a click on the canvas with a shape armed and no stamp unlocked: a free Shape element there (64-stamp-canvas-edit.js asks first)
 WBX.wbShapeAt=(x,y)=>{const b=WBS.brush;if(!b||b.txt||!b.m||!fpL())return false;shpMake(b.m,x,y,shpSize(),b.r||0);return true};
 // the Shape button: one in the middle of the view, the last shape used (or the first of the library); then that shape stays armed
 WBX.wbShapeNew=(CWv,CHv)=>{const m=shLast||(WBS.brush&&WBS.brush.m)||'b0';const q=shpMake(m,CWv/2,CHv/2,100,0);if(q){WBS.brush={m,s:1,r:0};if(WBX.wbElSeen)WBX.wbElSeen(q.u)}return q};
 // picking a library shape while a Shape element is selected changes that element's shape
 WBX.wbShapeSwap=m=>{const L=fpL(),q=L&&(L.pl||[]).find(x=>String(x.u)===String(WBS.fpSel));if(!q||q.k!='shape')return false;q.m=m;shLast=m;store();upd();if(WBX.wbCap)WBX.wbCap();return true};
}
export {init74,shpLayer};
