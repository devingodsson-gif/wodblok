import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,inShape} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {txRid} from './16-texture-generators.js';
import {fpCell,fpFG,fpGrp,fpL,fpPoolOk,fpSnap,fpSnapS,fpTog,fpU} from './24-free-place-layers.js';
import {fpBox,fpFlip,fpHandles,fpHid,fpHit,fpPt,fpRot,fpSz,fpWH} from './25-art-layers.js';
import {sgClear,sgMove,sgPull,sgPullShow} from './84-smart-guides.js';
import {tbG,tbSty} from './26-text-boxes.js';
import {tlPts} from './92-pattern-tiling.js';
const xfEnd=()=>{sgClear();if(!WBS.fpXf)return;const mv=WBS.fpXf.moved;WBS.fpXf=null;if(mv){store();upd();if(WBX.wbCap)WBX.wbCap()}};
// moving a piece while it is dragged (2.4.0, owner Oct 21 2026: "render them as I'm dragging, not just when I'm done"): a stamp is a [data-fp] group whose transform is its position;
// a Motif or Shape has a [data-mv] body (it knows where it was drawn: data-mx, data-my) whose own transform is kept and shifted by how far it has moved since; anything else is drawn again, at most once a frame
function fpLive(q){const a=document.querySelector(`#art [data-fp="${q.u}"]`);if(a){a.setAttribute('transform',`translate(${q.x} ${q.y})`);return true}
 const m=document.querySelector(`#art [data-mv="${q.u}"]`);if(m){if(m.dataset.t0==null)m.dataset.t0=m.getAttribute('transform')||'';m.setAttribute('transform',`translate(${(q.x-(+m.dataset.mx||0)).toFixed(2)} ${(q.y-(+m.dataset.my||0)).toFixed(2)}) ${m.dataset.t0}`);return true}
 return false}
let fpRaf=0;function fpRedraw(){if(fpRaf)return;fpRaf=requestAnimationFrame(()=>{fpRaf=0;if(WBS.fpDrag)upd()})}
// Esc during a drag puts everything back as it was: no store, no history step (2.27.0)
const fpCancel=()=>{sgClear();const d=WBS.fpDrag,x=WBS.fpXf;if(d){if(d.g)d.g.forEach(([q,qx,qy])=>{q.x=qx;q.y=qy});else{d.p.x=d.s0[0];d.p.y=d.s0[1]}WBS.fpDrag=null}
if(x){const o=JSON.parse(x.orig);Object.keys(x.p).forEach(k=>{if(!(k in o))delete x.p[k]});Object.assign(x.p,o);WBS.fpXf=null;if(x.p.tx&&typeof tbRelay=='function')tbRelay(x.p)}upd()};
// Rubber band: every element the box touches is selected; Shift/Ctrl/Cmd adds to the selection (2.27.0)
function fpMqPick(L){const m=WBS.fpMq,a=Math.min(m.x0,m.x1),b=Math.max(m.x0,m.x1),c=Math.min(m.y0,m.y1),d=Math.max(m.y0,m.y1),pl=L.pl||[],hit=new Set(m.base);
pl.forEach(p=>{if(p.k=='pattern')return;const wh=fpWH(p);if(!wh||p.bgd||p.flt||p.lk||fpHid(pl,p))return;const r=-(+p.r||0)*Math.PI/180*-1,co=Math.cos(r),si=Math.sin(r),hw=wh[0]/2,hh=wh[1]/2,ex=Math.abs(hw*co)+Math.abs(hh*si),ey=Math.abs(hw*si)+Math.abs(hh*co);if(p.x+ex>=a&&p.x-ex<=b&&p.y+ey>=c&&p.y-ey<=d)hit.add(String(p.u))});
const arr=[...hit];WBS.fpMS=new Set(arr);WBS.fpSel=arr.length?arr[arr.length-1]:-1;WBS.fpAnc=WBS.fpSel===-1?null:String(WBS.fpSel);upd()}
// 2.60.0 (artist test: a click that moved a little drew a box and picked two elements): the box starts only after the pointer has moved this far, in screen pixels
const FP_MQ_PX=10;
const fpMqEnd=()=>{if(!WBS.fpMq)return;const on=WBS.fpMq.on;WBS.fpMq=null;if(on)upd();else WBH.fpOverlay()};
const fpEnd=()=>{sgClear();if(!WBS.fpDrag)return;const mv=WBS.fpDrag.moved;WBS.fpDrag=null;if(mv){store();upd();if(WBX.wbCap)WBX.wbCap()}};
function init28(){
 try{let raf=0;new ResizeObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(WBH.fpOverlay)WBH.fpOverlay()})}).observe($("art"))}catch(e){}   // the box keeps its pixel size when the view is zoomed (2.15.0)
// 2.60.0 (artist test): a click on the empty space round the canvas ends the selection, as a click on the canvas's own empty space does
{const st=document.querySelector('.stage');if(st)st.addEventListener('pointerdown',e=>{if(e.button!==0||WBS.plArm||WBS.txArm||WBS.fpB||WBS.fpDrag||WBS.fpXf)return;const t=e.target;if(!(t===st||t.id=='boardP'||t.id=='artwrap'||t.id=='artsh'))return;
 if(WBS.fpSel!==-1||(WBS.fpMS&&WBS.fpMS.size)){WBS.fpSel=-1;WBS.fpMS=new Set();upd()}})}
// --- canvas: place, select, drag
$('art').addEventListener('pointerdown',e=>{const L=fpL();if(!L||e.button!==0||$('boardP').classList.contains('off'))return;const[x,y]=fpPt(e);if(!inShape(x,y)&&!(e.target.closest&&e.target.closest('[data-fh]'))&&(WBS.plArm||WBS.txArm||WBS.fpB||!fpHit(L,x,y)))return;   // outside a round or shaped canvas a click still reaches an element (2.24.0)
const hd=e.target.closest&&e.target.closest('[data-fh]');if(hd&&!WBS.fpB){const hp=(L.pl||[]).find(q=>q.u==WBS.fpSel);if(hp&&!hp.lk){e.preventDefault();fpPatOwn(hp);WBS.fpXf={p:hp,k:hd.dataset.fh,s0:hp.s,d0:Math.hypot(x-hp.x,y-hp.y)||1,x0:hp.x,y0:hp.y,wx0:hp.wx||1,wy0:hp.wy||1,wh0:fpWH(hp)||[1,1],r0:+hp.r||0,f0:hp.f||1,moved:false,orig:JSON.stringify(hp)};try{$('art').setPointerCapture(e.pointerId)}catch(er){}return}}
if(WBS.plArm&&WBX.wbPlMake){e.preventDefault();const[sx,sy]=fpSnap(L,x,y,e);WBX.wbPlMake(WBS.plArm,+sx.toFixed(1),+sy.toFixed(1));return}
if(WBS.txArm&&tbG){e.preventDefault();L.pl=L.pl||[];const[sx,sy]=fpSnap(L,x,y,e),n=Math.max(tbG.bw,tbG.bh,.01);const nq={u:fpU(),k:'text',tx:{...tbRead()},G:tbG.G,Lt:tbG.Lt,bw:tbG.bw,bh:tbG.bh,n,x:+sx.toFixed(1),y:+sy.toFixed(1),s:+n.toFixed(2),r:0,f:1,...(tbSty.tu.length?{tu:tbSty.tu.map(u=>({x:u.x,sd:txRid()}))}:{}),...(tbSty.ink?{ink:tbSty.ink}:{})};L.pl.push(nq);store();upd();if(WBX.wbCap)WBX.wbCap();if(WBX.wbTxInNew)WBX.wbTxInNew(nq);return}
if(WBS.fpB&&(WBS.tiles.some(t=>t.id==WBS.fpB))){e.preventDefault();L.pl=L.pl||[];const[sx,sy]=fpSnap(L,x,y,e),q={u:fpU(),k:'stamp',t:WBS.fpB,x:+sx.toFixed(1),y:+sy.toFixed(1),s:+fpSnapS(L,fpSz(),e).toFixed(2),r:fpRot,f:fpFlip};L.pl.push(q);if(fpPoolOk()){const a=[...WBS.fpPool],nx=a[Math.floor(Math.random()*a.length)];WBS.fpB=+nx}store();upd();if(WBX.wbCap)WBX.wbCap();return}
const p=fpHit(L,x,y);if(!p){const add=e.shiftKey||e.ctrlKey||e.metaKey,base=add?new Set(fpGrp().map(q=>String(q.u))):new Set();if(!add&&(WBS.fpSel!==-1||WBS.fpMS.size)){WBS.fpSel=-1;WBS.fpMS=new Set();upd()}
if((L.pl||[]).length){WBS.fpMq={x0:x,y0:y,x1:x,y1:y,cx:e.clientX,cy:e.clientY,on:false,add,base,id:e.pointerId};try{$('art').setPointerCapture(e.pointerId)}catch(er){}}return}
if(e.shiftKey||e.ctrlKey||e.metaKey){e.preventDefault();fpTog(p.u);return}
e.preventDefault();fpPatOwn(p);const g0=fpGrp(),inG=g0.length>1&&g0.includes(p);if(!inG)WBS.fpMS=new Set();WBS.fpSel=p.u;WBS.fpAnc=String(p.u);const g=inG?g0.map(q=>[q,q.x,q.y]):null;WBS.fpDrag={p,g,s0:[p.x,p.y],dx:x-p.x,dy:y-p.y,moved:false,id:e.pointerId};try{$('art').setPointerCapture(e.pointerId)}catch(er){}upd()});
// a drag keeps the element's centre on the sheet (2.24.0), so it can always be clicked and dragged back
const fpOn=(v,m)=>Math.min(m,Math.max(0,v));
$('art').addEventListener('pointermove',e=>{const L=fpL();if(!L)return;if(WBS.fpMq){const m=WBS.fpMq,[x,y]=fpPt(e);m.x1=x;m.y1=y;if(!m.on&&Math.hypot(e.clientX-m.cx,e.clientY-m.cy)<FP_MQ_PX)return;m.on=true;fpMqPick(L);return}if(WBS.fpDrag){const[x0,y0]=fpPt(e),p=WBS.fpDrag.p;let[nx,ny]=fpSnap(L,fpOn(x0-WBS.fpDrag.dx,CW),fpOn(y0-WBS.fpDrag.dy,CH),e);[nx,ny]=sgMove(WBS.fpDrag,L,nx,ny,e);nx=fpOn(nx,CW);ny=fpOn(ny,CH);WBS.fpDrag.moved=true;if(WBS.fpDrag.g){const ddx=+nx.toFixed(1)-WBS.fpDrag.s0[0],ddy=+ny.toFixed(1)-WBS.fpDrag.s0[1];let oh='',live=true;WBS.fpDrag.g.forEach(([q,qx,qy])=>{q.x=+(qx+ddx).toFixed(1);q.y=+(qy+ddy).toFixed(1);if(!fpLive(q))live=false;oh+=fpBox(q,'sel')});$('fpov').innerHTML=oh+WBS.sgG;if(!live)fpRedraw();return}
p.x=+nx.toFixed(1);p.y=+ny.toFixed(1);
if(!fpLive(p))fpRedraw();$('fpov').innerHTML=fpBox(p,'sel')+fpHandles(p)+WBS.sgG;return}
if(WBS.fpB||WBS.txArm||WBS.plArm){WBS.fpAlt=e.altKey;WBS.fpGhost=fpSnap(L,...fpPt(e),e);WBH.fpOverlay()}});
// a pattern whose area follows the canvas gets an area of its own when it is moved or pulled (2.57.0)
function fpPatOwn(p){if(p.k!='pattern'||!(p.af||!(+p.aw>0)))return;p.x=+(CW/2).toFixed(1);p.y=+(CH/2).toFixed(1);p.aw=+CW.toFixed(1);p.ah=+CH.toFixed(1);delete p.af}
// Pulling a corner or a side square of a placed piece (2.56.0, owner Oct 26 2026): the opposite corner or side stays where it is; with Alt (Option) it grows from
// the middle. A corner pulls both ways at once (width and height follow the pointer); with Shift it keeps the proportions. A side pulls only the width or the height.
// Pulled past the opposite side, the piece turns over on that axis and keeps following the pointer (Photoshop's free transform): across, its flip f turns; down,
// the flip turns and it makes a half turn (a mirror top to bottom), so no new field is needed. Everything is worked out from the piece as it was when the pull began
// (its turn r0 and flip f0), so the frame does not move under the pointer while the piece turns over.
function fpResize(h,x,y,e){const p=h.p,S0=Math.min(CW,CH),r0=h.r0!=null?h.r0:(+p.r||0),a=-r0*Math.PI/180,dx=x-h.x0,dy=y-h.y0,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a),[w0,h0]=h.wh0,mid=e.altKey,cl=(v,lo,hi)=>Math.min(hi,Math.max(lo,v)),k0=h.k;
 let ox=0,oy=0,fx=1,fy=1;   // fx, fy: -1 when the pull has gone past the opposite side on that axis
 // a pattern's area (2.57.0): its sides and corners pull its size; the pieces keep theirs, so more or fewer fit; it never turns over
 if(p.k=='pattern'){const sx=k0.includes('e')?1:k0.includes('w')?-1:0,sy=k0.includes('s')?1:k0.includes('n')?-1:0;let w=w0,hh=h0;
  // 2.60.1 (artist test): the area is never smaller than one piece (Tiling: the piece box at its Size), else 5% of the canvas
  if(!h.pmin){h.pmin=[S0*.05,S0*.05];if(p.lay=='tile'){const T=tlPts(p,1,1),S=Math.max(1,S0*Math.max(1,Math.min(100,+p.ps||12))/100);h.pmin=[Math.max(h.pmin[0],T.box.w*S),Math.max(h.pmin[1],T.box.h*S)]}}
  if(sx)w=Math.max(h.pmin[0],mid?2*Math.abs(lx):sx*lx+w0/2);if(sy)hh=Math.max(h.pmin[1],mid?2*Math.abs(ly):sy*ly+h0/2);
  if(sx&&sy&&e.shiftKey){const k=Math.max(w/w0,hh/h0);w=w0*k;hh=h0*k}
  p.aw=+w.toFixed(1);p.ah=+hh.toFixed(1);if(!mid){ox=sx*(w-w0)/2;oy=sy*(hh-h0)/2}
  p.x=+(h.x0+ox).toFixed(1);p.y=+(h.y0+oy).toFixed(1);return}
 const turn=()=>{const f0=h.f0!=null?h.f0:(p.f||1),f=f0*fx*fy;if(f===-1)p.f=-1;else if(p.f!=null)p.f=1;const r=fy<0?r0+180:r0;p.r=Math.round(((r+180)%360+360)%360-180)};
 if(k0.length==2&&e.shiftKey){// a corner with Shift: the size along the line from the fixed corner (or the middle) through the pulled one; past the fixed point it turns right round
  const cx=k0[1]=='e'?1:-1,cy=k0[0]=='s'?1:-1,Cx=cx*w0/2,Cy=cy*h0/2,Fx=mid?0:-Cx,Fy=mid?0:-Cy,vx=Cx-Fx,vy=Cy-Fy;let k=((lx-Fx)*vx+(ly-Fy)*vy)/(vx*vx+vy*vy);if(k<0){fx=-1;fy=-1;k=-k}
  let s=cl(h.s0*k,S0*.02,S0*3);s=fpSnapS(fpL(),s,e);p.s=+s.toFixed(2);WBS.fpLast=p.s;k=p.s/h.s0;if(p.wx!=null||h.wx0!=1)p.wx=h.wx0;if(p.wy!=null||h.wy0!=1)p.wy=h.wy0;
  const sx=fx*k;if(!mid){ox=Fx+sx*vx/2;oy=Fy+sx*vy/2}turn()}
 else if(p.tx&&k0.length==2){// a text's corner keeps its proportions (its box holds lines of type), as before
  const cx=k0[1]=='e'?1:-1,cy=k0[0]=='s'?1:-1,Cx=cx*w0/2,Cy=cy*h0/2,Fx=mid?0:-Cx,Fy=mid?0:-Cy,vx=Cx-Fx,vy=Cy-Fy;let k=((lx-Fx)*vx+(ly-Fy)*vy)/(vx*vx+vy*vy),s=cl(h.s0*Math.max(k,.02),S0*.02,S0*3);s=fpSnapS(fpL(),s,e);p.s=+s.toFixed(2);WBS.fpLast=p.s;k=p.s/h.s0;if(!mid){ox=(k-1)*Cx;oy=(k-1)*Cy}}
 else if(k0.length==2){// a corner: width and height follow the pointer; the fixed corner (or the middle) stays
  const cx=k0[1]=='e'?1:-1,cy=k0[0]=='s'?1:-1,Fx=mid?0:-cx*w0/2,Fy=mid?0:-cy*h0/2,sw=mid?2*lx*cx:(lx-Fx)*cx,sh=mid?2*ly*cy:(ly-Fy)*cy;
  fx=sw<0?-1:1;fy=sh<0?-1:1;const w=Math.max(w0*.02,Math.abs(sw)),hh=Math.max(h0*.02,Math.abs(sh)),nx=cl(+(h.wx0*w/w0).toFixed(3),.05,20),ny=cl(+(h.wy0*hh/h0).toFixed(3),.05,20);
  if(nx!=1||p.wx)p.wx=nx;if(ny!=1||p.wy)p.wy=ny;if(!mid){ox=Fx+cx*fx*w0*nx/h.wx0/2;oy=Fy+cy*fy*h0*ny/h.wy0/2}turn()}
 else if(p.tx){// a text: the sides pull its box (width wraps the lines, height makes it a fixed box); past the other side it turns over
  const ra=p.s/Math.max(p.n||1,.01),U=WBX.wbTxUnit(),side=k0=='e'||k0=='w',d=k0=='e'||k0=='s'?1:-1;
  if(side){const sw=mid?2*d*lx:d*lx+w0/2;fx=sw<0?-1:1;const w=Math.max(U*3*ra,Math.abs(sw));p.tx={...p.tx,wd:+(w/ra/U).toFixed(2)};if(!mid)ox=-d*w0/2+d*fx*w/2}
  else{const sh=mid?2*d*ly:d*ly+h0/2;fy=sh<0?-1:1;const hh=Math.max(U*3*ra,Math.abs(sh));p.tx={...p.tx,ht:+(hh/ra/U).toFixed(2)};if(!mid)oy=-d*h0/2+d*fy*hh/2}
  turn();h.rel=[p,side&&!mid&&!(p.tx.ht>0)]}
 else if(k0=='e'||k0=='w'){const d=k0=='e'?1:-1,sw=mid?2*d*lx:d*lx+w0/2;fx=sw<0?-1:1;const w=Math.max(w0*.02,Math.abs(sw)),nx=cl(+(h.wx0*w/w0).toFixed(3),.05,20);if(nx!=1||p.wx)p.wx=nx;if(!mid)ox=-d*w0/2+d*fx*(w0*nx/h.wx0)/2;turn()}
 else{const d=k0=='s'?1:-1,sh=mid?2*d*ly:d*ly+h0/2;fy=sh<0?-1:1;const hh=Math.max(h0*.02,Math.abs(sh)),ny=cl(+(h.wy0*hh/h0).toFixed(3),.05,20);if(ny!=1||p.wy)p.wy=ny;if(!mid)oy=-d*h0/2+d*fy*(h0*ny/h.wy0)/2;turn()}
 const r=-a;p.x=+(h.x0+ox*Math.cos(r)-oy*Math.sin(r)).toFixed(1);p.y=+(h.y0+ox*Math.sin(r)+oy*Math.cos(r)).toFixed(1);if(h.rel&&WBX.wbTbRelay)WBX.wbTbRelay(h.rel[0],h.rel[1],h)}
$('art').addEventListener('pointermove',e=>{if(!WBS.fpXf)return;const[x,y]=fpPt(e),p=WBS.fpXf.p,S0=Math.min(CW,CH);
if(WBS.fpXf.k!='rot'){const[sx,sy]=sgPull(WBS.fpXf,fpL(),x,y,e);fpResize(WBS.fpXf,sx,sy,e);sgPullShow(WBS.fpXf)}   // smart guides (2.40.0, 84)
else{let r=Math.atan2(y-p.y,x-p.x)*180/Math.PI+90;r=((r+180)%360+360)%360-180;if(e.shiftKey)r=Math.round(r/15)*15;p.r=Math.round(r)}
WBS.fpXf.moved=true;upd()});$('art').addEventListener('pointerup',xfEnd);$('art').addEventListener('pointercancel',xfEnd);
$('art').addEventListener('pointerleave',()=>{if(WBS.fpGhost){WBS.fpGhost=null;WBH.fpOverlay()}});$('art').addEventListener('pointerup',fpEnd);$('art').addEventListener('pointercancel',fpEnd);$('art').addEventListener('pointerup',fpMqEnd);$('art').addEventListener('pointercancel',fpMqEnd);
// A drag ends wherever the button is let go (2.27.0): over the panels, outside the window, or with the capture lost, so the element never keeps following the mouse afterwards
{const endAll=()=>{xfEnd();fpEnd();fpMqEnd()},busy=()=>!!(WBS.fpXf||WBS.fpDrag||WBS.fpMq);
window.addEventListener('pointerup',endAll,true);window.addEventListener('pointercancel',endAll,true);window.addEventListener('blur',endAll);$('art').addEventListener('lostpointercapture',endAll);
window.addEventListener('pointermove',e=>{if(busy()&&e.buttons===0)endAll()},true)}
document.addEventListener('keydown',e=>{const L=fpL();if(!L||$('boardP').classList.contains('off')||(e.target.matches&&e.target.matches('input,textarea,select,[contenteditable]')))return;
if(e.key=='Escape'&&WBS.fpMq){e.preventDefault();WBS.fpMq=null;WBS.fpSel=-1;WBS.fpMS=new Set();upd();return}
if(e.key=='Escape'&&(WBS.fpDrag||WBS.fpXf)){e.preventDefault();fpCancel();return}
if(e.key=='Escape'&&(WBS.fpB||WBS.txArm||WBS.plArm||WBS.fpSel!==-1)){WBS.plArm=null;WBS.fpB=null;WBS.txArm=false;WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpPool=new Set();WBS.fpGhost=null;upd();return}
if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()=='a'&&(L.pl||[]).length){e.preventDefault();WBS.fpMS=new Set(L.pl.map(q=>String(q.u)));WBS.fpSel=L.pl[L.pl.length-1].u;WBS.fpB=null;WBS.fpGhost=null;upd();return}
const gr=fpGrp(),p=gr.find(q=>q.x!=null)||gr[0];if(!p)return;   // 2.53.0: a Sheet has no place, so the arrows move the others
if(e.key=='Delete'||e.key=='Backspace'){e.preventDefault();gr.forEach(q=>L.pl.splice(L.pl.indexOf(q),1));WBS.fpSel=-1;WBS.fpMS=new Set();store();upd();if(WBX.wbCap)WBX.wbCap();return}
const gg=fpFG(L),st=gg.snap?fpCell(L)*(e.shiftKey?5:1):(e.shiftKey?10:1)*Math.min(CW,CH)/400,mv={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]}[e.key];if(mv){e.preventDefault();let ddx=mv[0],ddy=mv[1];if(gg.snap){const pr=fpGrp().find(q=>q.u==WBS.fpSel)||p,[sx,sy]=fpSnap(L,pr.x+mv[0],pr.y+mv[1],null);ddx=sx-pr.x;ddy=sy-pr.y}ddx=fpOn(p.x+ddx,CW)-p.x;ddy=fpOn(p.y+ddy,CH)-p.y;if(p.x==null)return;gr.forEach(q=>{if(q.x==null)return;q.x=+(q.x+ddx).toFixed(1);q.y=+(q.y+ddy).toFixed(1)});store();upd()}});
}
export {init28};
