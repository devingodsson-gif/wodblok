import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,inShape} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {txRid} from './16-texture-generators.js';
import {fpCell,fpFG,fpGrp,fpL,fpPoolOk,fpSnap,fpSnapS,fpTog,fpU} from './24-free-place-layers.js';
import {fpBox,fpFlip,fpHandles,fpHit,fpPt,fpRot,fpSz,fpWH} from './25-art-layers.js';
import {tbG,tbSty} from './26-text-boxes.js';
const xfEnd=()=>{if(!WBS.fpXf)return;const mv=WBS.fpXf.moved;WBS.fpXf=null;if(mv){store();upd();if(WBX.wbCap)WBX.wbCap()}};
// moving a piece while it is dragged (2.4.0, owner Oct 21 2026: "render them as I'm dragging, not just when I'm done"): a stamp is a [data-fp] group whose transform is its position;
// a Motif or Shape has a [data-mv] body (it knows where it was drawn: data-mx, data-my) whose own transform is kept and shifted by how far it has moved since; anything else is drawn again, at most once a frame
function fpLive(q){const a=document.querySelector(`#art [data-fp="${q.u}"]`);if(a){a.setAttribute('transform',`translate(${q.x} ${q.y})`);return true}
 const m=document.querySelector(`#art [data-mv="${q.u}"]`);if(m){if(m.dataset.t0==null)m.dataset.t0=m.getAttribute('transform')||'';m.setAttribute('transform',`translate(${(q.x-(+m.dataset.mx||0)).toFixed(2)} ${(q.y-(+m.dataset.my||0)).toFixed(2)}) ${m.dataset.t0}`);return true}
 return false}
let fpRaf=0;function fpRedraw(){if(fpRaf)return;fpRaf=requestAnimationFrame(()=>{fpRaf=0;if(WBS.fpDrag)upd()})}
const fpEnd=()=>{if(!WBS.fpDrag)return;const mv=WBS.fpDrag.moved;WBS.fpDrag=null;if(mv){store();upd();if(WBX.wbCap)WBX.wbCap()}};
function init28(){
 try{let raf=0;new ResizeObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(WBH.fpOverlay)WBH.fpOverlay()})}).observe($("art"))}catch(e){}   // the box keeps its pixel size when the view is zoomed (2.15.0)
// --- canvas: place, select, drag
$('art').addEventListener('pointerdown',e=>{const L=fpL();if(!L||e.button!==0||$('boardP').classList.contains('off'))return;const[x,y]=fpPt(e);if(!inShape(x,y)&&!(e.target.closest&&e.target.closest('[data-fh]')))return;
const hd=e.target.closest&&e.target.closest('[data-fh]');if(hd&&!WBS.fpB){const hp=(L.pl||[]).find(q=>q.u==WBS.fpSel);if(hp){e.preventDefault();WBS.fpXf={p:hp,k:hd.dataset.fh,s0:hp.s,d0:Math.hypot(x-hp.x,y-hp.y)||1,x0:hp.x,y0:hp.y,wx0:hp.wx||1,wy0:hp.wy||1,wh0:fpWH(hp)||[1,1],moved:false};try{$('art').setPointerCapture(e.pointerId)}catch(er){}return}}
if(WBS.plArm&&WBX.wbPlMake){e.preventDefault();const[sx,sy]=fpSnap(L,x,y,e);WBX.wbPlMake(WBS.plArm,+sx.toFixed(1),+sy.toFixed(1));return}
if(WBS.txArm&&tbG){e.preventDefault();L.pl=L.pl||[];const[sx,sy]=fpSnap(L,x,y,e),n=Math.max(tbG.bw,tbG.bh,.01);L.pl.push({u:fpU(),k:'text',tx:{...tbRead()},G:tbG.G,Lt:tbG.Lt,bw:tbG.bw,bh:tbG.bh,n,x:+sx.toFixed(1),y:+sy.toFixed(1),s:+n.toFixed(2),r:0,f:1,...(tbSty.tu.length?{tu:tbSty.tu.map(u=>({x:u.x,sd:txRid()}))}:{}),...(tbSty.ink?{ink:tbSty.ink}:{})});store();upd();if(WBX.wbCap)WBX.wbCap();return}
if(WBS.fpB&&(WBS.tiles.some(t=>t.id==WBS.fpB))){e.preventDefault();L.pl=L.pl||[];const[sx,sy]=fpSnap(L,x,y,e),q={u:fpU(),k:'stamp',t:WBS.fpB,x:+sx.toFixed(1),y:+sy.toFixed(1),s:+fpSnapS(L,fpSz(),e).toFixed(2),r:fpRot,f:fpFlip};L.pl.push(q);if(fpPoolOk()){const a=[...WBS.fpPool],nx=a[Math.floor(Math.random()*a.length)];WBS.fpB=+nx}store();upd();if(WBX.wbCap)WBX.wbCap();return}
const p=fpHit(L,x,y);if(!p){if(WBS.fpSel!==-1||WBS.fpMS.size){WBS.fpSel=-1;WBS.fpMS=new Set();upd()}return}
if(e.shiftKey||e.ctrlKey||e.metaKey){e.preventDefault();fpTog(p.u);return}
e.preventDefault();const g0=fpGrp(),inG=g0.length>1&&g0.includes(p);if(!inG)WBS.fpMS=new Set();WBS.fpSel=p.u;WBS.fpAnc=String(p.u);const g=inG?g0.map(q=>[q,q.x,q.y]):null;WBS.fpDrag={p,g,s0:[p.x,p.y],dx:x-p.x,dy:y-p.y,moved:false,id:e.pointerId};try{$('art').setPointerCapture(e.pointerId)}catch(er){}upd()});
$('art').addEventListener('pointermove',e=>{const L=fpL();if(!L)return;if(WBS.fpDrag){const[x,y]=fpPt(e),p=WBS.fpDrag.p,[nx,ny]=fpSnap(L,x-WBS.fpDrag.dx,y-WBS.fpDrag.dy,e);WBS.fpDrag.moved=true;if(WBS.fpDrag.g){const ddx=+nx.toFixed(1)-WBS.fpDrag.s0[0],ddy=+ny.toFixed(1)-WBS.fpDrag.s0[1];let oh='',live=true;WBS.fpDrag.g.forEach(([q,qx,qy])=>{q.x=+(qx+ddx).toFixed(1);q.y=+(qy+ddy).toFixed(1);if(!fpLive(q))live=false;oh+=fpBox(q,'sel')});$('fpov').innerHTML=oh;if(!live)fpRedraw();return}
p.x=+nx.toFixed(1);p.y=+ny.toFixed(1);
if(!fpLive(p))fpRedraw();$('fpov').innerHTML=fpBox(p,'sel')+fpHandles(p);return}
if(WBS.fpB||WBS.txArm||WBS.plArm){WBS.fpAlt=e.altKey;WBS.fpGhost=fpSnap(L,...fpPt(e),e);WBH.fpOverlay()}});
// Pulling a corner or a side square of a placed piece: the opposite corner or side stays where it is; with Shift it grows from the middle. Corners keep the proportions, sides pull only the width or the height.
function fpResize(h,x,y,e){const p=h.p,S0=Math.min(CW,CH),a=-(+p.r||0)*Math.PI/180,dx=x-h.x0,dy=y-h.y0,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a),[w0,h0]=h.wh0,mid=e.shiftKey,cl=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));let ox=0,oy=0,k0=h.k;
// A corner stretches one side (2.15.0): the first clear pull sideways sets the width, up or down the height; Ctrl or Cmd keeps scaling both together.
if(k0.length==2&&!(e.ctrlKey||e.metaKey)){{const mx=lx-(k0[1]=='e'?w0/2:-w0/2),my=ly-(k0[0]=='s'?h0/2:-h0/2);if(!h.ax&&Math.hypot(mx,my)>S0*.006)h.ax=Math.abs(mx)>=Math.abs(my)?'x':'y'}if(!h.ax)return;k0=h.ax=='x'?(k0[1]=='e'?'e':'w'):(k0[0]=='s'?'s':'n')}
if(k0.length==2){const cx=k0[1]=='e'?1:-1,cy=k0[0]=='s'?1:-1,Cx=cx*w0/2,Cy=cy*h0/2,Fx=mid?0:-Cx,Fy=mid?0:-Cy,vx=Cx-Fx,vy=Cy-Fy;let k=((lx-Fx)*vx+(ly-Fy)*vy)/(vx*vx+vy*vy),s=cl(h.s0*k,S0*.02,S0*3);s=fpSnapS(fpL(),s,e);p.s=+s.toFixed(2);WBS.fpLast=p.s;k=p.s/h.s0;if(!mid){ox=(k-1)*Cx;oy=(k-1)*Cy}}
else if(p.tx&&k0.length==1){// a text: the sides pull its box (width wraps the lines, height makes it a fixed box)
const ra=p.s/Math.max(p.n||1,.01),U=WBX.wbTxUnit(),side=k0=='e'||k0=='w',d=k0=='e'||k0=='s'?1:-1;if(side){const w=Math.max(U*3*ra,mid?Math.abs(lx)*2:d*lx+w0/2);p.tx={...p.tx,wd:+(w/ra/U).toFixed(2)};if(!mid)ox=d*(w-w0)/2}else{const hh=Math.max(U*3*ra,mid?Math.abs(ly)*2:d*ly+h0/2);p.tx={...p.tx,ht:+(hh/ra/U).toFixed(2)};if(!mid)oy=d*(hh-h0)/2}h.rel=[p,side&&!mid&&!(p.tx.ht>0)]}
else if(k0=='e'||k0=='w'){const d=k0=='e'?1:-1,w=Math.max(w0*.02,mid?Math.abs(lx)*2:d*lx+w0/2),nx=cl(+(h.wx0*w/w0).toFixed(3),.05,20);if(nx!=1||p.wx)p.wx=nx;if(!mid)ox=d*(w0*nx/h.wx0-w0)/2}
else{const d=k0=='s'?1:-1,hh=Math.max(h0*.02,mid?Math.abs(ly)*2:d*ly+h0/2),ny=cl(+(h.wy0*hh/h0).toFixed(3),.05,20);if(ny!=1||p.wy)p.wy=ny;if(!mid)oy=d*(h0*ny/h.wy0-h0)/2}
const r=-a;p.x=+(h.x0+ox*Math.cos(r)-oy*Math.sin(r)).toFixed(1);p.y=+(h.y0+ox*Math.sin(r)+oy*Math.cos(r)).toFixed(1);if(h.rel&&WBX.wbTbRelay)WBX.wbTbRelay(h.rel[0],h.rel[1],h)}
$('art').addEventListener('pointermove',e=>{if(!WBS.fpXf)return;const[x,y]=fpPt(e),p=WBS.fpXf.p,S0=Math.min(CW,CH);
if(WBS.fpXf.k!='rot')fpResize(WBS.fpXf,x,y,e);
else{let r=Math.atan2(y-p.y,x-p.x)*180/Math.PI+90;r=((r+180)%360+360)%360-180;if(e.shiftKey)r=Math.round(r/15)*15;p.r=Math.round(r)}
WBS.fpXf.moved=true;upd()});$('art').addEventListener('pointerup',xfEnd);$('art').addEventListener('pointercancel',xfEnd);
$('art').addEventListener('pointerleave',()=>{if(WBS.fpGhost){WBS.fpGhost=null;WBH.fpOverlay()}});$('art').addEventListener('pointerup',fpEnd);$('art').addEventListener('pointercancel',fpEnd);
document.addEventListener('keydown',e=>{const L=fpL();if(!L||$('boardP').classList.contains('off')||(e.target.matches&&e.target.matches('input,textarea,select,[contenteditable]')))return;
if(e.key=='Escape'&&(WBS.fpB||WBS.txArm||WBS.plArm||WBS.fpSel!==-1)){WBS.plArm=null;WBS.fpB=null;WBS.txArm=false;WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpPool=new Set();WBS.fpGhost=null;upd();return}
if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()=='a'&&(L.pl||[]).length){e.preventDefault();WBS.fpMS=new Set(L.pl.map(q=>String(q.u)));WBS.fpSel=L.pl[L.pl.length-1].u;WBS.fpB=null;WBS.fpGhost=null;upd();return}
const gr=fpGrp(),p=gr[0];if(!p)return;
if(e.key=='Delete'||e.key=='Backspace'){e.preventDefault();gr.forEach(q=>L.pl.splice(L.pl.indexOf(q),1));WBS.fpSel=-1;WBS.fpMS=new Set();store();upd();if(WBX.wbCap)WBX.wbCap();return}
const gg=fpFG(L),st=gg.snap?fpCell(L)*(e.shiftKey?5:1):(e.shiftKey?10:1)*Math.min(CW,CH)/400,mv={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]}[e.key];if(mv){e.preventDefault();let ddx=mv[0],ddy=mv[1];if(gg.snap){const pr=fpGrp().find(q=>q.u==WBS.fpSel)||p,[sx,sy]=fpSnap(L,pr.x+mv[0],pr.y+mv[1],null);ddx=sx-pr.x;ddy=sy-pr.y}gr.forEach(q=>{q.x=+(q.x+ddx).toFixed(1);q.y=+(q.y+ddy).toFixed(1)});store();upd()}});
}
export {init28};
