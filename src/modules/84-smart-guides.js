import {kv} from '../platform/index.js';
import {cmdRegister} from '../commands/registry.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {fpFG} from './24-free-place-layers.js';
import {fpHid,fpUnit,fpWH} from './25-art-layers.js';
// ===== Smart guides (2.40.0, owner Oct 24 2026: every element kind, settings for what to snap to, on by default).
// While an element (or a selection of several) is dragged, its edges and middle snap to the canvas edges and middle and to the edges and middles of
// the other elements, and a line shows each match. It also snaps to equal spacing: the same gap as its neighbours, or the middle between two of
// them, and marks the equal gaps. Pulling a side of an upright element snaps that side the same way. Alt held turns snapping off for the moment,
// as it does for the grid; with the grid's snapping on, the grid wins and there are no smart guides.
// Everything is measured in the boxes the selection outline shows (a turned element counts by the upright box round it). The targets are worked out
// once, when the drag starts; each frame only compares numbers. The lines are drawn in the selection overlay (#fpov) in the accent colour, one
// screen pixel wide at any zoom (classes .sgl and .sgs in the page CSS; nothing here sets a colour).
const SG_K={on:'wb114_sg',cv:'wb114_sgcv',el:'wb114_sgel',sp:'wb114_sgsp',d:'wb114_sgd'};
// how close, in screen pixels, an edge has to come before it snaps
const SG_DIST=[[4,'4 px'],[6,'6 px'],[10,'10 px']];
const sgFlag=(k,d)=>{try{const v=kv.get(k);return v==null?d:v==='1'}catch(e){return d}};
const sgDist=()=>{try{const n=+kv.get(SG_K.d);if(SG_DIST.some(x=>x[0]===n))return n}catch(e){}return 6};
const sgOpts=()=>({on:sgFlag(SG_K.on,true),cv:sgFlag(SG_K.cv,true),el:sgFlag(SG_K.el,true),sp:sgFlag(SG_K.sp,true),d:sgDist()});
// the upright box round an element (its outline box, turned)
function sgBox(q){const wh=fpWH(q);if(!wh)return null;const a=(+q.r||0)*Math.PI/180,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a)),ex=(wh[0]*c+wh[1]*s)/2,ey=(wh[0]*s+wh[1]*c)/2,x=+q.x,y=+q.y;
 return Number.isFinite(x+y+ex+ey)?{l:x-ex,r:x+ex,t:y-ey,b:y+ey}:null}
// What the moving elements can snap to: the other elements' boxes (not the Background, a Filter shape, a hidden one or a Pattern, which has no box)
// as lines across (X) and down (Y), each tagged with its box (-1 for the canvas), and the moving selection's box relative to its anchor (ax, ay).
function sgPrep(L,mv,ax,ay,o){const ids=new Set(mv.map(q=>String(q.u))),pl=L.pl||[],T=[],X=[],Y=[];
 if(o.el)pl.forEach(q=>{if(ids.has(String(q.u))||q.bgd||q.flt||q.k=='group'||fpHid(pl,q))return;const b=sgBox(q);if(b&&b.r>b.l&&b.b>b.t)T.push(b)});
 T.forEach((b,i)=>{X.push([b.l,i],[(b.l+b.r)/2,i],[b.r,i]);Y.push([b.t,i],[(b.t+b.b)/2,i],[b.b,i])});
 if(o.cv){X.push([0,-1],[CW/2,-1],[CW,-1]);Y.push([0,-1],[CH/2,-1],[CH,-1])}
 let B=null;mv.forEach(q=>{const b=sgBox(q);if(b)B=B?{l:Math.min(B.l,b.l),r:Math.max(B.r,b.r),t:Math.min(B.t,b.t),b:Math.max(B.b,b.b)}:b});
 return{T,X,Y,o,off:B?{l:B.l-ax,r:B.r-ax,t:B.t-ay,b:B.b-ay}:null}}
// the nearest match within the snap distance: [shift, line] or null
function sgNear(ms,lines,lim){let best=null;for(const m of ms)for(const z of lines){const d=z[0]-m;if(Math.abs(d)<=lim&&(!best||Math.abs(d)<Math.abs(best[0])))best=[d,z[0]]}return best}
// Equal spacing along one axis ('x': side by side, among the boxes that share some of its height). Three ways: the middle between the nearest
// box on each side; the gap between the two boxes on its left repeated on its right; the gap between the two on its right repeated on its left.
// Returns the nearest within the snap distance: {d: shift, g: the gaps to mark, each [from, to, box, box] (null = the moving box)}.
function sgGap(B,T,lim,ax){const[l,r,t,b]=ax=='x'?['l','r','t','b']:['t','b','l','r'],w=B[r]-B[l],c=(B[l]+B[r])/2,row=T.filter(q=>q[b]>B[t]&&q[t]<B[b]);if(!row.length)return null;
 const lefts=row.filter(q=>q[r]<=B[l]+lim&&(q[l]+q[r])/2<c),rights=row.filter(q=>q[l]>=B[r]-lim&&(q[l]+q[r])/2>c);
 const most=(a,k,hi)=>a.reduce((m,q)=>!m||(hi?q[k]>m[k]:q[k]<m[k])?q:m,null),Lb=most(lefts,r,true),Rb=most(rights,l,false),cand=[];
 if(Lb&&Rb&&Rb[l]-Lb[r]>w){const s=(Lb[r]+Rb[l]-w)/2;cand.push([s,[[Lb[r],s,Lb,null],[s+w,Rb[l],null,Rb]]])}
 if(Lb){const A=most(row.filter(q=>q!==Lb&&q[r]<=Lb[l]),r,true);if(A&&Lb[l]-A[r]>0){const g=Lb[l]-A[r],s=Lb[r]+g;cand.push([s,[[A[r],Lb[l],A,Lb],[Lb[r],s,Lb,null]]])}}
 if(Rb){const C=most(row.filter(q=>q!==Rb&&q[l]>=Rb[r]),l,false);if(C&&C[l]-Rb[r]>0){const g=C[l]-Rb[r],s=Rb[l]-g-w;cand.push([s,[[s+w,Rb[l],null,Rb],[Rb[r],C[l],Rb,C]]])}}
 let best=null;cand.forEach(([s,g])=>{const d=s-B[l];if(Math.abs(d)<=lim&&(!best||Math.abs(d)<Math.abs(best.d)))best={d,g}});return best}
const f2=v=>v.toFixed(2);
// The guides for the moving box B where it ended up: a line through every edge or middle that lines up (across the boxes it lines up with, or the
// whole canvas), and each equal gap as a line with a short tick at each end. edges: only the box's sides count (a side being pulled).
function sgDraw(S,B,u,gx,gy,edges){const eps=Math.max(.06,u*.5),T=S.T;let h='';
 const axis=(ms,lines,lo,hi,full,vert)=>{const seen=new Set();ms.forEach(m=>lines.forEach(([v,i])=>{if(Math.abs(v-m)>eps)return;const k=v.toFixed(2);if(seen.has(k+'|'+i))return;seen.add(k+'|'+i)}));
  const by=new Map();seen.forEach(z=>{const[k,i]=z.split('|');if(!by.has(k))by.set(k,[]);by.get(k).push(+i)});
  by.forEach((is,k)=>{let a=B[lo],b=B[hi];if(is.includes(-1)){a=0;b=full}else is.forEach(i=>{a=Math.min(a,T[i][lo]);b=Math.max(b,T[i][hi])});
   h+=vert?`<line class="sgl" x1="${k}" y1="${f2(a)}" x2="${k}" y2="${f2(b)}"/>`:`<line class="sgl" x1="${f2(a)}" y1="${k}" x2="${f2(b)}" y2="${k}"/>`})};
 axis(edges?[B.l,B.r]:[B.l,(B.l+B.r)/2,B.r],S.X,'t','b',CH,true);axis(edges?[B.t,B.b]:[B.t,(B.t+B.b)/2,B.b],S.Y,'l','r',CW,false);
 // a gap mark sits three quarters of the way down (or across) the part the two boxes share, clear of a line through their middles
 const tk=4*u,mid=(p,q,lo,hi)=>{const P=p||B,Q=q||B,a=Math.max(P[lo],Q[lo]),b=Math.min(P[hi],Q[hi]);return a<b?a+(b-a)*.75:(P[lo]+P[hi])/2};
 if(gx)gx.g.forEach(([a,b,p,q])=>{const y=mid(p,q,'t','b');h+=`<path class="sgs" d="M${f2(a)} ${f2(y)}H${f2(b)}M${f2(a)} ${f2(y-tk)}V${f2(y+tk)}M${f2(b)} ${f2(y-tk)}V${f2(y+tk)}"/>`});
 if(gy)gy.g.forEach(([a,b,p,q])=>{const x=mid(p,q,'l','r');h+=`<path class="sgs" d="M${f2(x)} ${f2(a)}V${f2(b)}M${f2(x-tk)} ${f2(a)}H${f2(x+tk)}M${f2(x-tk)} ${f2(b)}H${f2(x+tk)}"/>`});
 return h?`<g class="sgg">${h}</g>`:''}
const sgLive=(L,e,o)=>o.on&&(o.cv||o.el)&&!(e&&e.altKey)&&!fpFG(L).snap;
// A move: D is the drag (WBS.fpDrag: p, g, s0); (nx, ny) where its anchor would go. Returns where it goes; the guides are left in WBS.sgG for the overlay.
function sgMove(D,L,nx,ny,e){WBS.sgG='';if(!D.sgO)D.sgO=sgOpts();const o=D.sgO;if(!sgLive(L,e,o))return[nx,ny];
 if(!D.sg)D.sg=sgPrep(L,D.g?D.g.map(z=>z[0]):[D.p],D.s0[0],D.s0[1],o);const S=D.sg;if(!S.off)return[nx,ny];
 const u=fpUnit(),lim=o.d*u,box=(x,y)=>({l:x+S.off.l,r:x+S.off.r,t:y+S.off.t,b:y+S.off.b});let B=box(nx,ny),fx=0,fy=0,gx=null,gy=null;
 const ax=sgNear([B.l,(B.l+B.r)/2,B.r],S.X,lim),ay=sgNear([B.t,(B.t+B.b)/2,B.b],S.Y,lim);if(ax)fx=ax[0];if(ay)fy=ay[0];
 if(o.sp&&o.el&&S.T.length>1){const sx=sgGap(B,S.T,lim,'x'),sy=sgGap(B,S.T,lim,'y');
  if(sx&&(!ax||Math.abs(sx.d)<Math.abs(ax[0])-1e-9)){fx=sx.d;gx=sx}if(sy&&(!ay||Math.abs(sy.d)<Math.abs(ay[0])-1e-9)){fy=sy.d;gy=sy}}
 nx+=fx;ny+=fy;B=box(nx,ny);WBS.sgG=sgDraw(S,B,u,gx,gy,false);return[nx,ny]}
// A pull on a side handle of an upright element (X is WBS.fpXf): the pointer is snapped, since the side being pulled follows it (fpResize, 28).
// A corner counts once its direction is set (it then pulls one side); a corner pulled with Ctrl or Cmd (both sides together) and a turn do not snap.
function sgPull(X,L,x,y,e){WBS.sgG='';X.sgOn=false;if(!X.sgO)X.sgO=sgOpts();const o=X.sgO,p=X.p;if(!sgLive(L,e,o)||X.k=='rot'||Math.round(+p.r||0)%360!==0)return[x,y];
 let k=X.k;if(k.length==2){if(e.ctrlKey||e.metaKey||!X.ax)return[x,y];k=X.ax=='x'?'e':'s'}
 if(!X.sg)X.sg=sgPrep(L,[p],+p.x,+p.y,o);const lim=o.d*fpUnit();X.sgOn=true;
 if(k=='e'||k=='w'){const a=sgNear([x],X.sg.X,lim);if(a)x+=a[0]}else{const a=sgNear([y],X.sg.Y,lim);if(a)y+=a[0]}return[x,y]}
// after the pull: the lines for the sides that now line up
function sgPullShow(X){if(!X.sgOn||!X.sg)return;const b=sgBox(X.p);WBS.sgG=b?sgDraw(X.sg,b,fpUnit(),null,null,true):''}
const sgClear=()=>{WBS.sgG=''};
// Settings > Guides (55-settings.js) reads and writes these
const sgSet=(k,v)=>{try{kv.set(SG_K[k],typeof v=='boolean'?(v?'1':'0'):String(v))}catch(e){}};
// The switch is also the Smart guides tick box in the Grid panel, next to Snap to grid (#pgsg); the command and Mod+; click it.
function sgToggle(on){sgSet('on',on);pmsg(on?'Smart guides on.':'Smart guides off.');if(WBX.wbStgSync)WBX.wbStgSync()}
const sgSyncBox=()=>{const c=$('pgsg');if(c)c.checked=sgFlag(SG_K.on,true)};
function init84(){WBS.sgG='';const c=$('pgsg');if(c){sgSyncBox();c.addEventListener('change',()=>sgToggle(c.checked))}
 cmdRegister({id:'view.smartGuides',label:'Smart guides',elId:'pgsg',shortcut:'Mod+;',run:()=>$('pgsg').click()});
 document.addEventListener('keydown',e=>{const t=e.target;if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&!e.altKey&&e.key==';'&&!(t.matches&&t.matches('input,textarea,select,[contenteditable]'))){e.preventDefault();$('pgsg').click()}})}
export {SG_DIST,SG_K,init84,sgClear,sgSyncBox,sgDist,sgFlag,sgMove,sgPull,sgPullShow,sgSet};
