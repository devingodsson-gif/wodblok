import {ICN} from './00-icons.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpSnap} from './24-free-place-layers.js';
import {fpHit,fpPt,fpUnit,fpWH} from './25-art-layers.js';
import {elRegister,elSel,fxOf} from './65-element-core.js';
import {fxGr,fxPad,fxTex} from './69-effect-stack.js';
import {unFmt,unGet,unParse} from './98-units.js';

// ===== The Group panel (2.104.1, docs/group-panel-plan.md step 1; owner Nov 5 2026: "if I have a group I can click the group and there's a group panel that has
// rotation, adjust hor/ver and add effects"; "No group selection by the canvas only the elements list"). A group is selected in the Elements list only; its panel
// moves, sizes and turns the group as one: X, Y, W and H of its box (W or H scales it evenly from the box's top-left), Rotate (about the middle of its members) and
// Shift across and Shift down (in hundredths of the canvas). Every control changes the members themselves, so Ungroup leaves them where they are; the group keeps
// only what its sliders show (gr, gox, goy) and its own effects (fx, step 2). A Pattern's area moves and sizes with the group but does not turn; a Sheet, the Background and a Pattern that
// fills the canvas stay where they are, as they do everywhere else.
// the group's members, its sub-groups' included, that have a place of their own
function gpMembers(G,list){const L=list?null:fpL();if(!G||(!list&&!L))return[];const pl=list||L.pl||[],by=new Map(pl.filter(q=>q.k=='group').map(q=>[String(q.u),q])),inG=q=>{let g=q.g,n=0;while(g!=null&&n<32){if(String(g)===String(G.u))return true;const P=by.get(String(g));g=P?P.g:null;n++}return false};
 return pl.filter(q=>q&&q.k!='group'&&inG(q)&&!q.bgd&&q.k!='sheet'&&q.x!=null&&q.y!=null&&!(q.k=='pattern'&&(q.af||!(+q.aw>0))))}
// a member's box on the canvas: [x0, y0, x1, y1] (a paint element's from its strokes; anything else from its own box, turned)
function gpBoxOf(q){if(q.k=='paint'){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;(q.st||[]).forEach(s=>{const h=(+s.w||1)/2;(s.pts||[]).forEach(([x,y])=>{x0=Math.min(x0,x-h);y0=Math.min(y0,y-h);x1=Math.max(x1,x+h);y1=Math.max(y1,y+h)})});
  return x1<x0?null:[x0+ +q.x,y0+ +q.y,x1+ +q.x,y1+ +q.y]}
 const wh=fpWH(q);if(!wh)return null;const r=(q.k=='pattern'?0:+q.r||0)*Math.PI/180,c=Math.abs(Math.cos(r)),s=Math.abs(Math.sin(r)),hw=(wh[0]*c+wh[1]*s)/2,hh=(wh[0]*s+wh[1]*c)/2;return[+q.x-hw,+q.y-hh,+q.x+hw,+q.y+hh]}
function gpBox(G,list){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;gpMembers(G,list).forEach(q=>{const b=gpBoxOf(q);if(!b)return;x0=Math.min(x0,b[0]);y0=Math.min(y0,b[1]);x1=Math.max(x1,b[2]);y1=Math.max(y1,b[3])});return x1<x0?null:{x:x0,y:y0,w:x1-x0,h:y1-y0}}
const r2=v=>+(+v).toFixed(2),wrapD=d=>((d+180)%360+360)%360-180;
// what the controls do to the members
function gpMove(G,dx,dy){gpMembers(G).forEach(q=>{q.x=r2(+q.x+dx);q.y=r2(+q.y+dy)})}
// turned by d degrees about the middle of the members' places (a point that stays where it is as they turn, so a slider drag does not wander)
function gpTurn(G,d){const M=gpMembers(G);if(!M.length||!d)return;const cx=M.reduce((s,q)=>s+ +q.x,0)/M.length,cy=M.reduce((s,q)=>s+ +q.y,0)/M.length,a=d*Math.PI/180,c=Math.cos(a),s=Math.sin(a),rot=(x,y)=>[x*c-y*s,x*s+y*c];
 M.forEach(q=>{const[x,y]=rot(+q.x-cx,+q.y-cy);q.x=r2(cx+x);q.y=r2(cy+y);
  if(q.k=='paint')(q.st||[]).forEach(st=>{st.pts=(st.pts||[]).map(([px,py])=>{const[u,v]=rot(px,py);return[+u.toFixed(1),+v.toFixed(1)]})});
  else if(q.k!='pattern')q.r=+wrapD((+q.r||0)+d).toFixed(1)})}
// scaled by k from (ox, oy)
function gpScale(G,k,ox,oy){if(!(k>0)||Math.abs(k-1)<1e-6)return;gpMembers(G).forEach(q=>{q.x=r2(ox+(+q.x-ox)*k);q.y=r2(oy+(+q.y-oy)*k);
 if(q.k=='paint')(q.st||[]).forEach(st=>{st.pts=(st.pts||[]).map(([px,py])=>[+(px*k).toFixed(1),+(py*k).toFixed(1)]);if(st.w!=null)st.w=+(+st.w*k).toFixed(2)});
 else if(q.k=='pattern'){q.aw=+(+q.aw*k).toFixed(1);q.ah=+(+q.ah*k).toFixed(1)}
 else q.s=+((+q.s||100)*k).toFixed(4)})}
// ---- effects (2.104.2, step 2; owner: "Yes one combined effect"): a group's effects are drawn over its members drawn together, in its box with room round it, as an
// element's are over the element: Colour grade and the filter effects in list order, then Texture's mask. The members keep their own; Ungroup drops the group's.
function gpFx(G,pl,li){if(!fxOf(G).some(e=>e&&e.on!==false))return null;const b=gpBox(G,pl);if(!b)return null;const B=fxPad(b.x,b.y,b.w,b.h),id='gfx'+li+'_'+String(G.u).replace(/[^\w-]/g,'');
 const g=fxGr(G,id,B),t=fxTex(G,id+'t',{x:B.x,y:B.y,W:B.W,H:B.H});if(!g&&!t)return null;
 return{defs:(g?g.defs:'')+(t?t.defs:''),wrap:c=>{const o=g?g.wrap(c):c;return t?`<g${t.attrs}>${o}</g>`:o}}}
// ---- the panel
const gpSel=()=>{const q=elSel();return q&&q.k=='group'?q:null};
let gpSyncing=0;
function gpSync(){const G=gpSel(),sec=document.querySelector('section.pn[data-p="group"]');if(!sec||!G)return;const b=gpBox(G),u=unGet();
 $('gpbox').hidden=!b;if(b)[['gpx',b.x],['gpy',b.y],['gpw',b.w],['gph',b.h]].forEach(([id,v])=>{const e=$(id);if(document.activeElement===e)return;const t=unFmt(v,u);if(e.value!==t)e.value=t;e.classList.remove('bad')});
 sec.querySelectorAll('.unu').forEach(s=>{if(s.textContent!==u)s.textContent=u});
 [['gprt',+G.gr||0],['gpox',+G.gox||0],['gpoy',+G.goy||0]].forEach(([id,v])=>{const e=$(id);if(+e.value!==v){e.value=v;gpSyncing++;try{e.dispatchEvent(new Event('input',{bubbles:true}))}finally{gpSyncing--}}})}
// the group's box on the canvas while it is selected (the Elements list is where it is picked; a click on the canvas still picks one element, owner Nov 5 2026).
// 2.112.0 (owner Nov 5 2026: "When i click a group i want the selection rectangle over the group and the ability to click and drag to move it"): the box is the
// selection rectangle with the element box's handles (fpHandles' classes and sizes): four corners, which scale the group evenly as W and H do (a group never
// stretches, so it has no side handles), and the rotate handle, which turns it as Rotate does. A drag inside the box moves the group (Snap to grid puts its
// top-left on the grid); a press inside it that does not move picks the element under the pointer, as a click does. Each drag is one History step.
function gpOverlay(G){const b=gpBox(G);if(!b)return'';const f=v=>v.toFixed(2),u=fpUnit(),hs=4.5*u,arm=20*u,cx=b.x+b.w/2;
 let o=`<rect class="sel" x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}"/>`;
 if(G.lk)return o;
 o+=`<line class="frl" x1="${f(cx)}" y1="${f(b.y)}" x2="${f(cx)}" y2="${f(b.y-arm)}"/><circle class="frt" data-gh="rot" cx="${f(cx)}" cy="${f(b.y-arm)}" r="${f(hs)}" style="cursor:grab"><title>Rotate</title></circle>`;
 [['nw',0,0],['ne',1,0],['se',1,1],['sw',0,1]].forEach(([n,ax,ay])=>{o+=`<rect class="fhd" data-gh="${n}" x="${f(b.x+ax*b.w-hs)}" y="${f(b.y+ay*b.h-hs)}" width="${f(hs*2)}" height="${f(hs*2)}" style="cursor:${n=='nw'||n=='se'?'nwse':'nesw'}-resize"><title>Resize</title></rect>`});
 return o}
// a press on the canvas while a group is selected: a handle, or inside its box. true when the group takes it
function gpDown(L,x,y,e){const G=(L.pl||[]).find(q=>q.k=='group'&&q.u==WBS.fpSel);if(!G||G.lk||e.shiftKey||e.ctrlKey||e.metaKey)return false;const b=gpBox(G);if(!b)return false;
 const hd=e.target.closest&&e.target.closest('[data-gh]'),k=hd?hd.dataset.gh:null;if(!k&&!(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h))return false;
 e.preventDefault();const M=gpMembers(G),D={G,k:k||'mv',b,x0:x,y0:y,cx0:e.clientX,cy0:e.clientY,ax:0,ay:0,moved:false,id:e.pointerId,orig:new Map(M.map(q=>[String(q.u),JSON.stringify(q)])),gr0:+G.gr||0,
  mx:M.reduce((s,q)=>s+ +q.x,0)/Math.max(1,M.length),my:M.reduce((s,q)=>s+ +q.y,0)/Math.max(1,M.length)};
 const art=$('art');try{art.setPointerCapture(e.pointerId)}catch(er){}
 const back=()=>gpMembers(G).forEach(q=>{const o=D.orig.get(String(q.u));if(!o)return;const v=JSON.parse(o);Object.keys(q).forEach(n=>{if(!(n in v))delete q[n]});Object.assign(q,v)});
 const mv=ev=>{if(ev.pointerId!==D.id)return;if(!D.moved){if(Math.hypot(ev.clientX-D.cx0,ev.clientY-D.cy0)<3)return;D.moved=true}const[px,py]=fpPt(ev);
  if(D.k=='mv'){let dx=px-D.x0,dy=py-D.y0;const[sx,sy]=fpSnap(L,D.b.x+dx,D.b.y+dy,ev);dx=sx-D.b.x;dy=sy-D.b.y;gpMove(G,dx-D.ax,dy-D.ay);D.ax=dx;D.ay=dy}
  else if(D.k=='rot'){let d=(Math.atan2(py-D.my,px-D.mx)-Math.atan2(D.y0-D.my,D.x0-D.mx))*180/Math.PI;d=wrapD(d);if(ev.shiftKey)d=Math.round((D.gr0+d)/15)*15-D.gr0;back();gpTurn(G,d);G.gr=+wrapD(D.gr0+d).toFixed(1)}
  else{const[qx,qy]=fpSnap(L,px,py,ev),b=D.b,cx=D.k.includes('e')?b.x+b.w:b.x,cy=D.k.includes('s')?b.y+b.h:b.y,Fx=ev.altKey?b.x+b.w/2:2*b.x+b.w-cx,Fy=ev.altKey?b.y+b.h/2:2*b.y+b.h-cy,vx=cx-Fx,vy=cy-Fy,
    kk=Math.max(.02,((qx-Fx)*vx+(qy-Fy)*vy)/(vx*vx+vy*vy||1));back();gpScale(G,kk,Fx,Fy)}
  upd();gpSync()};
 const end=ev=>{if(ev.pointerId!==D.id)return;removeEventListener('pointermove',mv,true);removeEventListener('pointerup',end,true);removeEventListener('pointercancel',end,true);
  if(ev.type=='pointercancel'){if(D.moved){back();upd();gpSync()}return}
  if(D.moved){WBX.wbLabelNext={t:D.k=='mv'?'Moved group':D.k=='rot'?'Turned group':'Sized group',at:performance.now()};gpDone(true);gpSync();return}
  if(D.k=='mv'){const[px,py]=fpPt(ev),h=fpHit(L,px,py);if(h&&h.u!=G.u){WBS.fpSel=h.u;WBS.fpMS=new Set();WBS.fpAnc=String(h.u);upd()}}};
 addEventListener('pointermove',mv,true);addEventListener('pointerup',end,true);addEventListener('pointercancel',end,true);return true}
const gpDone=cap=>{store();upd();if(cap&&WBX.wbCap)WBX.wbCap()};
function init100(){
 elRegister('group',{hide:true,label:'Group',pn:'group',icon:ICN.group,is:q=>q.k=='group',name:q=>q.nm||q.n||'Group'});
 if(!$('gpbox'))return;
 WBX.wbGpSync=gpSync;WBX.wbGpBox=gpOverlay;WBX.wbGpFx=gpFx;WBX.wbGpDown=gpDown;
 // X, Y: the box's top-left; W, H: its size (the group scales evenly from the top-left)
 const go=id=>{const G=gpSel(),e=$(id);if(!G||!e)return;const b=gpBox(G);if(!b)return;const cur=id=='gpx'?b.x:id=='gpy'?b.y:id=='gpw'?b.w:b.h,v=unParse(e.value,cur);
  if(v==null||!isFinite(v)){e.classList.add('bad');return}e.classList.remove('bad');let ch=false;
  if(id=='gpx'||id=='gpy'){const d=v-cur;if(Math.abs(d)>.005){gpMove(G,id=='gpx'?d:0,id=='gpy'?d:0);ch=true}}
  else if(v>0&&cur>0&&Math.abs(v-cur)>.005){gpScale(G,v/cur,b.x,b.y);ch=true}
  if(ch)gpDone(true);gpSync()};
 ['gpx','gpy','gpw','gph'].forEach(id=>{const e=$(id);e.addEventListener('change',()=>go(id));
  e.addEventListener('keydown',ev=>{if(ev.key=='Enter'){ev.preventDefault();go(id);e.select()}else if(ev.key=='Escape'){ev.preventDefault();ev.stopPropagation();e.classList.remove('bad');gpSync();e.blur()}})});
 // Rotate and Shift: the slider shows the group's own value; a change turns or moves the members by the difference
 $('gprt').addEventListener('input',()=>{if(gpSyncing)return;const G=gpSel();if(!G)return;const v=+$('gprt').value,d=v-(+G.gr||0);if(!d)return;gpTurn(G,d);G.gr=v;gpDone(false)});
 [['gpox','gox',()=>CW],['gpoy','goy',()=>CH]].forEach(([id,k,size])=>$(id).addEventListener('input',()=>{if(gpSyncing)return;const G=gpSel();if(!G)return;const v=+$(id).value,d=v-(+G[k]||0);if(!d)return;
  const m=d/100*size();gpMove(G,k=='gox'?m:0,k=='goy'?m:0);G[k]=v;gpDone(false)}));
 ['gprt','gpox','gpoy'].forEach(id=>$(id).addEventListener('change',()=>{if(!gpSyncing&&gpSel()&&WBX.wbCap)WBX.wbCap()}));
 if(WBH)WBH.gpSync=gpSync}
export {gpBox,gpMembers,init100};
