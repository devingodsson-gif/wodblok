import {$,WBS,WBX} from './01-launch-and-version.js';
import {useT,wrapP} from './04-canvas-and-stamp-outlines.js';
import {it,selOne,store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {delItems,selToggle} from './12-selection-and-split.js';
import {STP,stMatrix,stUnlocked,stampAt} from './63-stamp-tool.js';
// ===== Editing the unlocked stamp on the canvas (layer update, step 5) =====
// With a stamp unlocked, the Pattern canvas edits that stamp through the instance printed under the pointer: a click with a shape picked in the
// Shapes panel puts the shape in the stamp, a click on a shape inside an instance selects it, dragging moves it, the square handles resize it and
// the round one turns it. Every point is moved from the canvas into the stamp's own space with the inverse of the instance's matrix (see 63-stamp-tool.js),
// so the shape lands where it was pointed at whatever the layer's rotation, turn, flip or size variation. The stamp's items are the same list the
// Stamp editor edits, so every instance and every layer that uses the stamp shows the edit. Clicks that do not land on an instance of the unlocked stamp
// are left to the layer, as before. Text typed in the Text panel is put into the stamp the same way (as the letters the Stamp editor makes).
const SCE={d:null,h:null,ai:null};
// the unlocked stamp, if it is also the open stamp (the selection indexes belong to the open stamp)
const sceRO=()=>{const id=stUnlocked();if(id==null)return null;const t=WBS.tiles[WBS.cur];return t&&t.id===id?t:null};
function sceOpen(){const id=stUnlocked();if(id==null)return null;const k=WBS.tiles.findIndex(t=>t.id===id);if(k<0)return null;if(WBS.cur!==k){WBS.cur=k;selOne(-1)}return WBS.tiles[k]}
function sceWith(t,fn){const p=WBS.tiles[WBS.cur];useT(t);try{return fn()}finally{if(p)useT(p)}}
function scePt(e){const a=$('art'),m=a&&a.getScreenCTM();if(!m)return null;const p=a.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(m.inverse());return{x:q.x,y:q.y}}
const sceTo=(M,x,y)=>{const q=M.transformPoint({x,y});return{x:q.x,y:q.y}};
const sceInv=i=>stMatrix(STP.items[i]).inverse();
// the topmost shape of the stamp whose box holds the point (the same box the selection square shows)
function sceItemAt(t,u,v){for(let i=t.items.length-1;i>=0;i--){const q=t.items[i],r=-(+q.r||0)*Math.PI/180,dx=u-q.x,dy=v-q.y,lx=dx*Math.cos(r)-dy*Math.sin(r),ly=dx*Math.sin(r)+dy*Math.cos(r);
 if(Math.abs(lx)<=48*q.s*(q.sx||1)+3&&Math.abs(ly)<=48*q.s*(q.sy||1)+3)return i}return-1}
const sceFree=()=>{WBS.fpSel=-1;WBS.fpMS=new Set()};
function sceDown(e){if(e.button!==0)return;const t0=stUnlocked();if(t0==null)return;
 const hand=$('nvhand');if(hand&&hand.getAttribute('aria-pressed')=='true')return;
 const hd=e.target.closest&&e.target.closest('[data-hd]');
 if(hd){const t=sceRO();if(!t||WBS.msel.size!=1||WBS.sel<0||SCE.ai==null||!STP.items[SCE.ai])return;const q=t.items[WBS.sel];if(!q)return;e.preventDefault();e.stopPropagation();
  SCE.h={k:hd.dataset.hd,q,t,cx:+q.x,cy:+q.y,s0:q.s,sx0:q.sx||1,sy0:q.sy||1,r0:+q.r||0,M:sceInv(SCE.ai)};WBS.WBDRG=1;$('texg').style.display='none';return}
 const c=scePt(e);if(!c)return;const h=stampAt(c.x,c.y,t0);if(!h)return;const t=sceOpen();if(!t)return;
 e.preventDefault();e.stopPropagation();SCE.ai=h.i;
 if(WBS.txArm&&WBX.wbTxStampAt){const[x,y]=sceWith(t,()=>wrapP(h.u,h.v));WBX.wbTxStampAt(+x.toFixed(1),+y.toFixed(1));return}
 if(WBS.brush&&!WBS.brush.txt){const M=stMatrix(STP.items[h.i]),th=Math.atan2(M.b,M.a)*180/Math.PI,flip=M.a*M.d-M.b*M.c<0;let r=WBS.brush.r+(flip?th:-th);r=+(((r+540)%360)-180).toFixed(1);
  const[x,y]=sceWith(t,()=>wrapP(h.u,h.v));t.items.push(it(WBS.brush.m,+x.toFixed(2),+y.toFixed(2),WBS.brush.s,r));selOne(t.items.length-1);sceFree();store();upd();return}
 const i=sceItemAt(t,h.u,h.v);
 if(i<0){if(!(e.shiftKey||e.ctrlKey||e.metaKey))selOne(-1);sceDraw();return}
 sceFree();
 if(e.shiftKey||e.ctrlKey||e.metaKey){selToggle(i);if(!WBS.msel.has(i)){sceDraw();return}}else if(!WBS.msel.has(i))selOne(i);
 WBS.sel=i;const q=t.items[i];
 SCE.d={t,q,M:sceInv(h.i),dx:q.x-h.u,dy:q.y-h.v,x0:e.clientX,y0:e.clientY,moved:false,st:[...WBS.msel].filter(j=>j!=i).map(j=>t.items[j]).filter(Boolean).map(w=>[w,w.x,w.y]),px:q.x,py:q.y};
 sceDraw()}
function sceMove(e){if(!SCE.h&&!SCE.d)return;const c=scePt(e);if(!c)return;
 if(SCE.h){const h=SCE.h,p=sceTo(h.M,c.x,c.y);sceWith(h.t,()=>{if(h.k=='rot'){let a=Math.atan2(p.y-h.cy,p.x-h.cx)*180/Math.PI+90;if(e.shiftKey)a=Math.round(a/15)*15;h.q.r=+(((a+540)%360)-180).toFixed(1)}else WBX.hdResize(h,p,e)});upd();return}
 const d=SCE.d;if(!d.moved){const dx=e.clientX-d.x0,dy=e.clientY-d.y0;if(dx*dx+dy*dy<9)return;d.moved=true;WBS.WBDRG=1;$('texg').style.display='none'}
 const p=sceTo(d.M,c.x,c.y);d.q.x=+(p.x+d.dx).toFixed(2);d.q.y=+(p.y+d.dy).toFixed(2);const ax=d.q.x-d.px,ay=d.q.y-d.py;d.st.forEach(([w,ox,oy])=>{w.x=+(ox+ax).toFixed(2);w.y=+(oy+ay).toFixed(2)});upd()}
function sceUp(){if(SCE.h){SCE.h=null;WBS.WBDRG=0;$('texg').style.display='';store();upd();return}
 const d=SCE.d;if(!d)return;SCE.d=null;WBS.WBDRG=0;$('texg').style.display='';if(!d.moved)return;
 sceWith(d.t,()=>{[d.q.x,d.q.y]=wrapP(d.q.x,d.q.y);d.st.forEach(([w])=>{[w.x,w.y]=wrapP(w.x,w.y)})});store();upd()}
// the selection box (and, for one shape, the handles) drawn on the instance that was last used, in canvas units; handle sizes are fixed on screen
function sceDraw(){const g=$('stoh');if(!g)return;const t=sceRO();if(!t||!WBS.msel.size){g.innerHTML='';return}
 let ai=SCE.ai;if(ai==null||!STP.items[ai]||STP.items[ai][0]!==t.id)ai=SCE.ai=STP.items.findIndex(x=>x[0]===t.id);if(ai<0){g.innerHTML='';return}
 const a=$('art'),m0=a&&a.getScreenCTM(),sc=(m0&&m0.a)||1,hs=3.5/sc,off=18/sc,M=stMatrix(STP.items[ai]),f=v=>v.toFixed(2);let h='';
 const P=(x,y)=>{const q=M.transformPoint({x,y});return[q.x,q.y]};
 const box=q=>{const rx=48*q.s*(q.sx||1),ry=48*q.s*(q.sy||1),r=(+q.r||0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return{rx,ry,L:(u,v)=>P(+q.x+u*c-v*s,+q.y+u*s+v*c)}};
 for(const i of WBS.msel){const q=t.items[i];if(!q)continue;const b=box(q);h+=`<polygon class="stes" points="${[b.L(-b.rx,-b.ry),b.L(b.rx,-b.ry),b.L(b.rx,b.ry),b.L(-b.rx,b.ry)].map(p=>f(p[0])+','+f(p[1])).join(' ')}"/>`}
 const q=WBS.msel.size==1?t.items[WBS.sel]:null;
 if(q){const b=box(q),hd=[['nw',-1,-1],['ne',1,-1],['sw',-1,1],['se',1,1],['n',0,-1],['s',0,1],['e',1,0],['w',-1,0]],cur={nw:'nwse-resize',se:'nwse-resize',ne:'nesw-resize',sw:'nesw-resize',n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize'};
  for(const[k,sx,sy]of hd){const p=b.L(sx*b.rx,sy*b.ry);h+=`<rect class="steh" data-hd="${k}" x="${f(p[0]-hs)}" y="${f(p[1]-hs)}" width="${f(hs*2)}" height="${f(hs*2)}" cursor="${cur[k]}"/>`}
  const T=b.L(0,-b.ry),C=b.L(0,0),dx=T[0]-C[0],dy=T[1]-C[1],n=Math.hypot(dx,dy)||1,R=[T[0]+dx/n*off,T[1]+dy/n*off];
  h+=`<line class="stes" x1="${f(T[0])}" y1="${f(T[1])}" x2="${f(R[0])}" y2="${f(R[1])}"/><circle class="steh" data-hd="rot" cx="${f(R[0])}" cy="${f(R[1])}" r="${f(hs*1.15)}" cursor="grab"/>`}
 g.innerHTML=h}
function sceKey(e){if(WBS.curView!=='pattern'||WBS.brush&&e.key!=='Delete')return;const tg=e.target;if(tg&&tg.matches&&tg.matches('input,select,textarea,[contenteditable]'))return;const t=sceRO();if(!t||!WBS.msel.size)return;
 if(e.key=='Delete'||e.key=='Backspace'){e.preventDefault();delItems([...WBS.msel]);selOne(-1);store();upd()}else if(e.key=='Escape'){selOne(-1);sceDraw()}}
function init64(){
 STP.after=sceDraw;
 const w=$('artwrap');if(w)w.addEventListener('pointerdown',sceDown,true);
 document.addEventListener('pointermove',sceMove);document.addEventListener('pointerup',sceUp);document.addEventListener('pointercancel',sceUp);
 document.addEventListener('keydown',sceKey);
 try{new ResizeObserver(sceDraw).observe($('art'))}catch(e){}}
export {SCE,init64,sceItemAt};
