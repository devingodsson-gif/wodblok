import {$,WBH,WBS,WBX,mod} from './01-launch-and-version.js';
import {OFFS,SH,SW,useT,wrapP} from './04-canvas-and-stamp-outlines.js';
import {inkOf,it,mk,pal,selOne,store} from './06-motif-library-folders.js';
import {DOTK} from './05-motif-data.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {symOps} from './07-symmetry.js';
import {delItems,selSet,selToggle} from './12-selection-and-split.js';
import {fpL,fpSnap} from './24-free-place-layers.js';
import {STP,stMatrix,stUnlocked,stampAt,stLock} from './63-stamp-tool.js';
// ===== Editing the unlocked stamp on the canvas (layer update, step 5) =====
// With a stamp unlocked, the Pattern canvas edits that stamp through the instance printed under the pointer: a click with a shape picked in the
// Shapes panel puts the shape in the stamp, a click on a shape inside an instance selects it, dragging moves it, the square handles resize it and
// the round one turns it. Every point is moved from the canvas into the stamp's own space with the inverse of the instance's matrix (see 63-stamp-tool.js),
// so the shape lands where it was pointed at whatever the layer's rotation, turn, flip or size variation. The stamp's items are one list, so every instance and every layer that uses the stamp shows the edit. Clicks that do not land on an instance of the unlocked stamp
// are left to the layer, as before. Text typed in the Text panel is put into the stamp the same way (as letters tagged tg); a click on a
// letter of such a text selects the whole text (Alt-click one letter), which puts the text into the Text panel to be edited live.
const SCE={d:null,h:null,m:null,sp:null,ai:null,g:null};
// the unlocked stamp, if it is also the open stamp (the selection indexes belong to the open stamp)
const sceRO=()=>{const id=stUnlocked();if(id==null)return null;const t=WBS.tiles[WBS.cur];return t&&t.id===id?t:null};
function sceOpen(){const id=stUnlocked();if(id==null)return null;const k=WBS.tiles.findIndex(t=>t.id===id);if(k<0)return null;if(WBS.cur!==k){WBS.cur=k;selOne(-1)}return WBS.tiles[k]}
function sceWith(t,fn){const p=WBS.tiles[WBS.cur];useT(t);try{return fn()}finally{if(p)useT(p)}}
function scePt(e){const a=$('art'),m=a&&a.getScreenCTM();if(!m)return null;const p=a.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(m.inverse());return{x:q.x,y:q.y}}
const sceTo=(M,x,y)=>{const q=M.transformPoint({x,y});return{x:q.x,y:q.y}};
const sceInv=i=>stMatrix(STP.items[i]).inverse();
// the topmost shape of the stamp whose box holds the point, also where a symmetry copy or a copy wrapped over the stamp's edge is drawn: the point is moved
// back into the shape's own frame first. Returns {i, c, ax, ay, o}: the shape, which copy (0 is the shape itself), the wrap offset, the symmetry operation.
function sceBox(q,x,y){const r=-(+q.r||0)*Math.PI/180,dx=x-q.x,dy=y-q.y,lx=dx*Math.cos(r)-dy*Math.sin(r),ly=dx*Math.sin(r)+dy*Math.cos(r);return Math.abs(lx)<=48*q.s*(q.sx||1)+3&&Math.abs(ly)<=48*q.s*(q.sy||1)+3}
function sceItemAt(t,u,v){return sceWith(t,()=>{const ops=symOps(t),offs=OFFS.slice();
 for(let i=t.items.length-1;i>=0;i--){const q=t.items[i],w=wrapP(q.x,q.y),b={...q,x:w[0],y:w[1]};
  for(const[ax,ay]of offs)if(sceBox(q,u-ax,v-ay))return{i,c:0,ax,ay,o:null};
  if(q.tg&&!(t.sym&&t.sym.tx))continue;
  for(let c=0;c<ops.length;c++)for(const[ax,ay]of offs){const[x,y]=ops[c].i(u-ax,v-ay);if(sceBox(b,x,y))return{i,c:c+1,ax,ay,o:ops[c]}}}
 return null})}
const sceFree=()=>{WBS.fpSel=-1;WBS.fpMS=new Set()};
const sceSel=()=>{if(WBH.draw)WBH.draw();sceDraw()};
// the Grid tool snaps in canvas units (Alt skips it); a point is snapped there and then moved back into the stamp
function sceSnap(M,x,y,e){const L=fpL();if(!L)return{x,y};const q=sceTo(M,x,y),n=fpSnap(L,q.x,q.y,e);return sceTo(M.inverse(),n[0],n[1])}
function sceDown(e){if(e.button!==0)return;let t0=stUnlocked();
 // a shape armed while no stamp is unlocked goes on the canvas as a Shape element of its own (2.3.0); an unlocked stamp still takes it
 if(t0==null&&WBS.brush&&!WBS.brush.txt&&!WBS.txArm&&WBS.fpB==null){const c0=scePt(e);if(c0&&WBX.wbShapeAt&&WBX.wbShapeAt(c0.x,c0.y)){e.preventDefault();e.stopPropagation();return}}
 if(t0==null)return;
 const hand=$('nvhand');if(hand&&hand.getAttribute('aria-pressed')=='true')return;
 const spk=e.target.closest&&e.target.closest('[data-sp]');
 if(spk&&WBS.split&&SCE.ai!=null&&STP.items[SCE.ai]){const c=scePt(e),M=sceInv(SCE.ai);if(!c)return;const p=sceTo(M,c.x,c.y);e.preventDefault();e.stopPropagation();SCE.sp={k:spk.dataset.sp,M,ox:WBS.split.x-p.x,oy:WBS.split.y-p.y};return}
 const hd=e.target.closest&&e.target.closest('[data-hd]');
 if(hd){const t=sceRO();if(!t||WBS.msel.size!=1||WBS.sel<0||SCE.ai==null||!STP.items[SCE.ai])return;const q=t.items[WBS.sel];if(!q)return;e.preventDefault();e.stopPropagation();
  SCE.h={k:hd.dataset.hd,q,t,cx:+q.x,cy:+q.y,s0:q.s,sx0:q.sx||1,sy0:q.sy||1,r0:+q.r||0,M:sceInv(SCE.ai)};WBS.WBDRG=1;$('texg').style.display='none';return}
 const c=scePt(e);if(!c)return;const h=stampAt(c.x,c.y,t0);if(!h)return;const t=sceOpen();if(!t)return;
 e.preventDefault();e.stopPropagation();SCE.ai=h.i;
 const M0=stMatrix(STP.items[h.i]),sn=sceSnap(M0,h.u,h.v,e);
 if((WBS.txArm||(WBS.brush&&WBS.brush.txt))&&WBX.wbTxStampAt){const[x,y]=sceWith(t,()=>wrapP(sn.x,sn.y));WBX.wbTxStampAt(+x.toFixed(1),+y.toFixed(1));return}
 if(WBS.brush&&!WBS.brush.txt){const M=stMatrix(STP.items[h.i]),th=Math.atan2(M.b,M.a)*180/Math.PI,flip=M.a*M.d-M.b*M.c<0;let r=WBS.brush.r+(flip?th:-th);r=+(((r+540)%360)-180).toFixed(1);
  const[x,y]=sceWith(t,()=>wrapP(sn.x,sn.y));t.items.push(it(WBS.brush.m,+x.toFixed(2),+y.toFixed(2),WBS.brush.s,r));selOne(t.items.length-1);sceFree();store();upd();return}
 const hit=sceItemAt(t,h.u,h.v),add=e.shiftKey||e.ctrlKey||e.metaKey;
 if(!hit){if(!add)selOne(-1);SCE.m={x0:e.clientX,y0:e.clientY,add,on:false,ai:h.i,t};sceSel();return}
 const i=hit.i;sceFree();
 if(add){selToggle(i);if(!WBS.msel.has(i)){sceSel();return}}else if(!WBS.msel.has(i)){const g=t.items[i].tg;if(g&&!e.altKey)selSet(t.items.map((x,j)=>x.tg===g?j:-1).filter(j=>j>=0),false);else selOne(i)}
 WBS.sel=i;const q=t.items[i],cp=hit.o?sceWith(t,()=>hit.o.p(mod(q.x,SW),mod(q.y,SH))):null;
 SCE.d={t,q,o:hit.o,M:sceInv(h.i),dx:(cp?cp[0]:q.x+hit.ax)-h.u,dy:(cp?cp[1]:q.y+hit.ay)-h.v,x0:e.clientX,y0:e.clientY,moved:false,st:[...WBS.msel].filter(j=>j!=i).map(j=>t.items[j]).filter(Boolean).map(w=>[w,w.x,w.y]),px:q.x,py:q.y};
 sceSel()}
function sceMove(e){if(SCE.sp){const c=scePt(e);if(!c||!WBS.split)return;const p=sceTo(SCE.sp.M,c.x,c.y);if(SCE.sp.k=='m'){WBS.split.x=p.x+SCE.sp.ox;WBS.split.y=p.y+SCE.sp.oy}else{let a=Math.atan2(p.y-WBS.split.y,p.x-WBS.split.x)*180/Math.PI;if(e.shiftKey)a=Math.round(a/15)*15;WBS.split.a=a}sceDraw();return}
 if(SCE.m){const m=SCE.m,dx=e.clientX-m.x0,dy=e.clientY-m.y0;if(!m.on&&dx*dx+dy*dy<25)return;m.on=true;let b=$('mqb');if(!b){b=document.createElement('div');b.id='mqb';document.body.appendChild(b)}Object.assign(b.style,{display:'block',left:Math.min(m.x0,e.clientX)+'px',top:Math.min(m.y0,e.clientY)+'px',width:Math.abs(dx)+'px',height:Math.abs(dy)+'px'});return}
 if(!SCE.h&&!SCE.d)return;const c=scePt(e);if(!c)return;
 if(SCE.h){const h=SCE.h,p=sceTo(h.M,c.x,c.y);sceWith(h.t,()=>{if(h.k=='rot'){let a=Math.atan2(p.y-h.cy,p.x-h.cx)*180/Math.PI+90;if(e.shiftKey)a=Math.round(a/15)*15;h.q.r=+(((a+540)%360)-180).toFixed(1)}else WBX.hdResize(h,p,e)});upd();return}
 const d=SCE.d;if(!d.moved){const dx=e.clientX-d.x0,dy=e.clientY-d.y0;if(dx*dx+dy*dy<9)return;d.moved=true;WBS.WBDRG=1;$('texg').style.display='none'}
 const p=sceTo(d.M,c.x,c.y),sn=sceSnap(d.M,p.x+d.dx,p.y+d.dy,e),np=d.o?d.o.i(sn.x,sn.y):[sn.x,sn.y];d.q.x=+np[0].toFixed(2);d.q.y=+np[1].toFixed(2);const ax=d.q.x-d.px,ay=d.q.y-d.py;d.st.forEach(([w,ox,oy])=>{w.x=+(ox+ax).toFixed(2);w.y=+(oy+ay).toFixed(2)});upd()}
function sceUp(e){if(SCE.sp){SCE.sp=null;return}
 if(SCE.m){const m=SCE.m;SCE.m=null;const b=$('mqb');if(b)b.style.display='none';if(m.on&&e.type=='pointerup'){const x0=Math.min(m.x0,e.clientX),x1=Math.max(m.x0,e.clientX),y0=Math.min(m.y0,e.clientY),y1=Math.max(m.y0,e.clientY),M=STP.items[m.ai]?stMatrix(STP.items[m.ai]):null,a=$('art'),sm=a&&a.getScreenCTM();
  if(M&&sm){const hit=[];m.t.items.forEach((q,i)=>{const rx=48*q.s*(q.sx||1),ry=48*q.s*(q.sy||1),r=(+q.r||0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
    if([[-rx,-ry],[rx,-ry],[rx,ry],[-rx,ry]].every(([u,v])=>{const p=M.transformPoint({x:+q.x+u*c-v*s,y:+q.y+u*s+v*c}),P=a.createSVGPoint();P.x=p.x;P.y=p.y;const k=P.matrixTransform(sm);return k.x>=x0-1&&k.x<=x1+1&&k.y>=y0-1&&k.y<=y1+1}))hit.push(i)});
   hit.forEach(i=>{if(!WBS.msel.has(i))selToggle(i)});upd()}}return}
 if(SCE.h){SCE.h=null;WBS.WBDRG=0;$('texg').style.display='';store();upd();return}
 const d=SCE.d;if(!d)return;SCE.d=null;WBS.WBDRG=0;$('texg').style.display='';if(!d.moved)return;
 sceWith(d.t,()=>{[d.q.x,d.q.y]=wrapP(d.q.x,d.q.y);d.st.forEach(([w])=>{[w.x,w.y]=wrapP(w.x,w.y)})});store();upd()}
// the selection box (and, for one shape, the handles) drawn on the instance that was last used, in canvas units; handle sizes are fixed on screen
// The ghost of the shape picked in the Shapes panel, on the pointer: over a stamp it sits where a click would put it (same snap, same size and turn, drawn through the
// instance's matrix); anywhere else on the canvas it follows the pointer, fainter, at the size of the first stamp.
function sceGhost(){const b=WBS.brush,g=SCE.g;if(!b||b.txt||!g||!b.m)return'';const t=WBS.tiles[WBS.cur];if(!t)return'';const t0=stUnlocked(),h=stampAt(g.x,g.y,t0),ink=inkOf(t),bg=pal()[0],f=v=>v.toFixed(3);let tr,op;
 if(h){const M=stMatrix(STP.items[h.i]),sn=sceSnap(M,h.u,h.v,{altKey:g.alt}),th=Math.atan2(M.b,M.a)*180/Math.PI,flip=M.a*M.d-M.b*M.c<0,r=b.r+(flip?th:-th);tr=`matrix(${f(M.a)} ${f(M.b)} ${f(M.c)} ${f(M.d)} ${f(M.e)} ${f(M.f)}) translate(${f(sn.x)} ${f(sn.y)}) rotate(${f(r)}) scale(${f(b.s)})`;op=.6}
 else{const it0=STP.items[0];if(!it0)return'';const M=stMatrix(it0),k=Math.hypot(M.a,M.b);tr=`translate(${f(g.x)} ${f(g.y)}) rotate(${f(b.r)}) scale(${f(k*b.s)})`;op=.3}
 return`<g class="stgh" pointer-events="none" opacity="${op}" transform="${tr}">${mk(b.m,ink,bg)}</g>`}
function sceDraw(){const g=$('stoh');if(!g)return;const gh=sceGhost(),t=sceRO();if(!t||!WBS.msel.size){g.innerHTML=gh;return}
 let ai=SCE.ai;if(ai==null||!STP.items[ai]||STP.items[ai][0]!==t.id)ai=SCE.ai=STP.items.findIndex(x=>x[0]===t.id);if(ai<0){g.innerHTML=gh;return}
 const a=$('art'),m0=a&&a.getScreenCTM(),sc=(m0&&m0.a)||1,hs=3.5/sc,off=18/sc,M=stMatrix(STP.items[ai]),f=v=>v.toFixed(2);let h='';
 const P=(x,y)=>{const q=M.transformPoint({x,y});return[q.x,q.y]};
 const box=q=>{const rx=48*q.s*(q.sx||1),ry=48*q.s*(q.sy||1),r=(+q.r||0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return{rx,ry,L:(u,v)=>P(+q.x+u*c-v*s,+q.y+u*s+v*c)}};
 for(const i of WBS.msel){const q=t.items[i];if(!q)continue;const b=box(q);h+=`<polygon class="stes" points="${[b.L(-b.rx,-b.ry),b.L(b.rx,-b.ry),b.L(b.rx,b.ry),b.L(-b.rx,b.ry)].map(p=>f(p[0])+','+f(p[1])).join(' ')}"/>`}
 const q=WBS.msel.size==1?t.items[WBS.sel]:null;
 if(q){const b=box(q),hd=[['nw',-1,-1],['ne',1,-1],['sw',-1,1],['se',1,1],['n',0,-1],['s',0,1],['e',1,0],['w',-1,0]],cur={nw:'nwse-resize',se:'nwse-resize',ne:'nesw-resize',sw:'nesw-resize',n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize'};
  for(const[k,sx,sy]of hd){const p=b.L(sx*b.rx,sy*b.ry);h+=`<rect class="steh" data-hd="${k}" x="${f(p[0]-hs)}" y="${f(p[1]-hs)}" width="${f(hs*2)}" height="${f(hs*2)}" cursor="${cur[k]}"/>`}
  const T=b.L(0,-b.ry),C=b.L(0,0),dx=T[0]-C[0],dy=T[1]-C[1],n=Math.hypot(dx,dy)||1,R=[T[0]+dx/n*off,T[1]+dy/n*off];
  h+=`<line class="stes" x1="${f(T[0])}" y1="${f(T[1])}" x2="${f(R[0])}" y2="${f(R[1])}"/><circle class="steh" data-hd="rot" cx="${f(R[0])}" cy="${f(R[1])}" r="${f(hs*1.15)}" cursor="grab"/>`}
 if(WBS.split&&WBS.split.i===WBS.sel){const q2=t.items[WBS.split.i];if(q2){const L=52*q2.s*Math.max(q2.sx||1,q2.sy||1)+14,a=WBS.split.a*Math.PI/180,ux=Math.cos(a)*L,uy=Math.sin(a)*L,p1=P(WBS.split.x-ux,WBS.split.y-uy),p2=P(WBS.split.x+ux,WBS.split.y+uy),pc=P(WBS.split.x,WBS.split.y),ln=(c,x)=>`<line class="${c}" ${x} x1="${f(p1[0])}" y1="${f(p1[1])}" x2="${f(p2[0])}" y2="${f(p2[1])}"/>`;
  h+=ln('stsp','')+ln('stsph','data-sp="m"')+`<circle class="steh" data-sp="m" cx="${f(pc[0])}" cy="${f(pc[1])}" r="${f(hs*1.15)}" cursor="move"/><circle class="steh" data-sp="r" cx="${f(p2[0])}" cy="${f(p2[1])}" r="${f(hs*1.4)}" cursor="grab"/>`}}
 g.innerHTML=h+gh}
function sceKey(e){if(WBS.brush&&e.key!=='Delete')return;const tg=e.target;if(tg&&tg.matches&&tg.matches('input,select,textarea,[contenteditable]'))return;const t=sceRO();if(!t||!WBS.msel.size)return;
 if(e.key=='Delete'||e.key=='Backspace'){e.preventDefault();delItems([...WBS.msel]);selOne(-1);store();upd()}else if(e.key=='Escape'){selOne(-1);sceSel()}
 else if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&(e.key=='s'||e.key=='S')){e.preventDefault();$('ssp').click()}
 else if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&(e.key=='k'||e.key=='K')){e.preventDefault();$('sko').click()}}
function init64(){
 STP.after=sceDraw;WBX.wbSceDraw=sceDraw;
 const w=$('artwrap');if(w)w.addEventListener('pointerdown',sceDown,true);
 document.addEventListener('pointermove',sceMove);document.addEventListener('pointerup',sceUp);document.addEventListener('pointercancel',sceUp);
 document.addEventListener('keydown',sceKey);
 if(w){w.addEventListener('pointermove',e=>{if(!WBS.brush||WBS.brush.txt){if(SCE.g){SCE.g=null;sceDraw()}return}const c=scePt(e);SCE.g=c?{x:c.x,y:c.y,alt:e.altKey}:null;sceDraw()});w.addEventListener('pointerleave',()=>{if(SCE.g){SCE.g=null;sceDraw()}})}
 try{new ResizeObserver(sceDraw).observe($('art'))}catch(e){}}
// a shape dragged from the Shapes panel and let go over an instance of the unlocked stamp is put in the stamp at that point
function sceDropShape(k,e){const t0=stUnlocked();if(t0==null)return false;const c=scePt(e);if(!c)return false;const h=stampAt(c.x,c.y,t0);if(!h)return false;const t=sceOpen();if(!t)return false;
 const M=stMatrix(STP.items[h.i]),sn=sceSnap(M,h.u,h.v,e),th=Math.atan2(M.b,M.a)*180/Math.PI,flip=M.a*M.d-M.b*M.c<0,r=+(((( flip?th:-th)+540)%360)-180).toFixed(1),[x,y]=sceWith(t,()=>wrapP(sn.x,sn.y));
 t.items.push(it(k,+x.toFixed(2),+y.toFixed(2),DOTK.has(k)?.22:.8,r));selOne(t.items.length-1);sceFree();store();upd();if(WBX.wbCap)WBX.wbCap();return true}
export {SCE,init64,sceItemAt,sceDropShape};
