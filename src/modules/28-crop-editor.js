import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,inShape} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {txRid} from './16-texture-generators.js';
import {fpCell,fpFG,fpGrp,fpL,fpPoolOk,fpSnap,fpSnapS,fpTog,fpU} from './24-free-place-layers.js';
import {artBU,crBox,crPts,crRef,fpBox,fpFlip,fpHandles,fpHit,fpPt,fpRot,fpSz,fpWH} from './25-art-layers.js';
import {tbG,tbSty} from './26-text-boxes.js';
// ===== Crop editor for Art pieces. CR = {u piece, A picture, pts, m 'r'|'p', lv ratio, osw, all, sel vertex, drag, cu/cv middle of the crop the piece was placed by}
function crP(){const L=fpL();return L&&WBS.CR?(L.pl||[]).find(q=>q.u==WBS.CR.u):null}
const crC=v=>Math.max(0,Math.min(1,v)),crRect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
function crRatio(){if(!WBS.CR||WBS.CR.lv=='free')return null;if(WBS.CR.lv=='orig'){const R=WBS.CR.A.w/WBS.CR.A.h;return WBS.CR.osw?1/R:R}const[a,b]=WBS.CR.lv.split(':').map(Number);return a/b}
function crFit(){const R=crRatio();if(!R)return;const[b0,b1,b2,b3]=crBox(WBS.CR.pts),A=WBS.CR.A,cx=(b0+b2)/2,cy=(b1+b3)/2,bw=(b2-b0)*A.w,bh=(b3-b1)*A.h;let w,h;if(bw/bh>R){h=bh;w=h*R}else{w=bw;h=w/R}const hw=w/A.w/2,hh=h/A.h/2;WBS.CR.pts=crRect(cx-hw,cy-hh,cx+hw,cy+hh)}
function crToRect(){const[a,b,c,d]=crBox(WBS.CR.pts);WBS.CR.pts=crRect(a,b,c,d);WBS.CR.m='r'}
function crLocal(x,y){const p=crP(),A=WBS.CR.A,k=p.s/Math.max(A.w,A.h),f=(p.f||1)*(p.wx||1),a=-(+p.r||0)*Math.PI/180,dx=x-p.x,dy=y-p.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);return[WBS.CR.cu+lx/(k*f)/A.w,WBS.CR.cv+ly/(k*(p.wy||1))/A.h]}
// put a crop on a piece. The visible picture stays exactly where it is on the canvas; only the piece's anchor moves to the middle of the new crop.
function crSet(q,pts,m){const A=WBS.ARTS[q.a];if(!A)return;const o=crRef(q),bb=crBox(pts),full=m=='r'&&bb[0]<.0005&&bb[1]<.0005&&bb[2]>.9995&&bb[3]>.9995,nu=full?.5:(bb[0]+bb[2])/2,nv=full?.5:(bb[1]+bb[3])/2,k=q.s/Math.max(A.w,A.h),f=(q.f||1)*(q.wx||1),r=(+q.r||0)*Math.PI/180,lx=(nu-o.cu)*A.w*k*f,ly=(nv-o.cv)*A.h*k*(q.wy||1);
q.x=+(q.x+lx*Math.cos(r)-ly*Math.sin(r)).toFixed(1);q.y=+(q.y+lx*Math.sin(r)+ly*Math.cos(r)).toFixed(1);if(full)delete q.c;else q.c={m:m=='p'?'p':'r',pts}}
function crDragRect(hn,u,v,alt){const A=WBS.CR.A,R=crRatio(),thr=alt?0:.012,sn=q=>q<thr?0:q>1-thr?1:q;let[u0,v0,u1,v1]=crBox(WBS.CR.pts);const cx=(u0+u1)/2,cy=(v0+v1)/2,mn=.01;u=sn(crC(u));v=sn(crC(v));
const W=hn.includes('w'),E=hn.includes('e'),N=hn.includes('n'),S=hn.includes('s');
if(!R){if(W)u0=Math.min(u,u1-mn);if(E)u1=Math.max(u,u0+mn);if(N)v0=Math.min(v,v1-mn);if(S)v1=Math.max(v,v0+mn);WBS.CR.pts=crRect(u0,v0,u1,v1);return}
const hx=W||E,hy=N||S,ax=W?u1:E?u0:cx,ay=N?v1:S?v0:cy,dx=W?-1:1,dy=N?-1:1;let w=hx?Math.abs(u-ax)*A.w:0,h=hy?Math.abs(v-ay)*A.h:0;
if(hx&&hy){if(w/R>h)h=w/R;else w=h*R}else if(hx)h=w/R;else w=h*R;
const mw=hx?(dx<0?ax:1-ax)*A.w:2*Math.min(cx,1-cx)*A.w,mh=hy?(dy<0?ay:1-ay)*A.h:2*Math.min(cy,1-cy)*A.h;
if(w>mw){w=mw;h=w/R}if(h>mh){h=mh;w=h*R}const mnp=mn*Math.min(A.w,A.h);if(w<mnp){w=mnp;h=w/R}if(h<mnp){h=mnp;w=h*R}
const wn=w/A.w,hh=h/A.h;if(hx){if(dx<0){u0=ax-wn;u1=ax}else{u0=ax;u1=ax+wn}}else{u0=cx-wn/2;u1=cx+wn/2}if(hy){if(dy<0){v0=ay-hh;v1=ay}else{v0=ay;v1=ay+hh}}else{v0=cy-hh/2;v1=cy+hh/2}
WBS.CR.pts=crRect(crC(u0),crC(v0),crC(u1),crC(v1))}
function crNums(){if(!WBS.CR)return;const[b0,b1,b2,b3]=crBox(WBS.CR.pts);[['lcrnx',b0],['lcrny',b1],['lcrnw',b2-b0],['lcrnh',b3-b1]].forEach(([id,v])=>{const el=$(id);if(el&&document.activeElement!==el)el.value=+(v*100).toFixed(1)})}
function crNumIn(id){if(!WBS.CR)return;if(WBS.CR.m=='p')crToRect();const A=WBS.CR.A,R=crRatio();let[b0,b1,b2,b3]=crBox(WBS.CR.pts),x=b0,y=b1,w=b2-b0,h=b3-b1;const val=Math.max(0,Math.min(100,+$(id).value||0))/100;
if(id=='lcrnx')x=val;else if(id=='lcrny')y=val;else if(id=='lcrnw'){w=Math.max(.01,val);if(R)h=w*A.w/R/A.h}else{h=Math.max(.01,val);if(R)w=h*A.h*R/A.w}
if(w>1){const s=1/w;w=1;h*=s}if(h>1){const s=1/h;h=1;w*=s}x=Math.max(0,Math.min(1-w,x));y=Math.max(0,Math.min(1-h,y));WBS.CR.pts=crRect(x,y,x+w,y+h);crOv();crSync();crNums()}
function crPreset(k){const[b0,b1,b2,b3]=crBox(WBS.CR.pts),cx=(b0+b2)/2,cy=(b1+b3)/2,w=b2-b0;let P;
if(k=='ell'){P=[];for(let i=0;i<36;i++){const t=2*Math.PI*i/36-Math.PI/2;P.push([cx+(w/2)*Math.cos(t),cy+((b3-b1)/2)*Math.sin(t)])}}
else if(k=='tri')P=[[cx,b1],[b2,b3],[b0,b3]];else if(k=='dia')P=[[cx,b1],[b2,cy],[cx,b3],[b0,cy]];else P=[[b0+.25*w,b1],[b2-.25*w,b1],[b2,cy],[b2-.25*w,b3],[b0+.25*w,b3],[b0,cy]];
WBS.CR.pts=P;WBS.CR.m='p';WBS.CR.sel=-1}
function crOv(){if(!WBS.CR)return;const ov=$('fpov'),p=crP();if(!ov||!p||WBS.fpSel!=WBS.CR.u||$('boardP').classList.contains('off'))return;
const A=WBS.CR.A,k=p.s/Math.max(A.w,A.h),f=(p.f||1)*(p.wx||1),hs=Math.max(CW,CH)/95/k,lw=hs/5,n=v=>(+v).toFixed(2),P=WBS.CR.pts.map(q=>n(q[0]*A.w)+','+n(q[1]*A.h)).join(' '),src=artBU(A);
let g=`<g transform="translate(${n(p.x)} ${n(p.y)}) rotate(${+p.r||0}) scale(${n(k*f)} ${n(k*(p.wy||1))}) translate(${n(-WBS.CR.cu*A.w)} ${n(-WBS.CR.cv*A.h)})">`;
g+=`<image href="${src}" x="0" y="0" width="${A.w}" height="${A.h}" preserveAspectRatio="none" opacity=".32" pointer-events="none"/><rect x="0" y="0" width="${A.w}" height="${A.h}" fill="none" stroke="#e33" stroke-opacity=".45" stroke-width="${n(lw)}" stroke-dasharray="${n(lw*4)} ${n(lw*3)}" pointer-events="none"/>`;
g+=`<clipPath id="crcl"><polygon points="${P}"/></clipPath><image href="${src}" x="0" y="0" width="${A.w}" height="${A.h}" preserveAspectRatio="none" clip-path="url(#crcl)" pointer-events="none"/>`;
g+=`<polygon data-ch="mv" points="${P}" fill="#e33" fill-opacity=".001" stroke="#e33" stroke-width="${n(lw*1.4)}" pointer-events="all" style="cursor:move"/>`;
const T=WBS.CR.pts;
if(WBS.CR.m=='p'){T.forEach((a,i)=>{const b=T[(i+1)%T.length];g+=`<line data-ch="e" data-i="${i}" x1="${n(a[0]*A.w)}" y1="${n(a[1]*A.h)}" x2="${n(b[0]*A.w)}" y2="${n(b[1]*A.h)}" stroke="#e33" stroke-opacity="0" stroke-width="${n(hs*2.2)}" pointer-events="stroke" style="cursor:copy"><title>Click to add a point</title></line>`});
T.forEach((a,i)=>{g+=`<circle data-ch="v" data-i="${i}" cx="${n(a[0]*A.w)}" cy="${n(a[1]*A.h)}" r="${n(hs*.85)}" fill="${i==WBS.CR.sel?'#e33':'#fff'}" stroke="#e33" stroke-width="${n(lw)}" pointer-events="all" style="cursor:pointer"><title>Drag to move. Double-click to remove</title></circle>`})}
else{const[b0,b1,b2,b3]=crBox(T),xs=[b0,(b0+b2)/2,b2],ys=[b1,(b1+b3)/2,b3],nm=[['nw','n','ne'],['w',null,'e'],['sw','s','se']],cu={nw:'nwse-resize',se:'nwse-resize',ne:'nesw-resize',sw:'nesw-resize',n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize'};
ys.forEach((y,r)=>xs.forEach((x,c)=>{const h=nm[r][c];if(!h)return;g+=`<rect data-ch="h" data-h="${h}" x="${n(x*A.w-hs*.8)}" y="${n(y*A.h-hs*.8)}" width="${n(hs*1.6)}" height="${n(hs*1.6)}" fill="#fff" stroke="#e33" stroke-width="${n(lw)}" pointer-events="all" style="cursor:${cu[h]}"/>`}))}
ov.innerHTML=g+'</g>';crBarUpd()}
// Apply / Cancel buttons that float next to the crop box, so you never have to scroll back to the panel to confirm.
function crBarUpd(){let b=$('crbar');if(!b){b=document.createElement('div');b.id='crbar';b.hidden=true;b.innerHTML='<button type="button" class="primary" id="crbok" title="Apply crop (Enter)">Apply crop</button><button type="button" class="alt" id="crbno" title="Cancel (Esc)">Cancel</button>';document.body.appendChild(b);$('crbok').onclick=crApply;$('crbno').onclick=()=>{WBS.CR=null;upd()}}
const p=WBS.CR&&crP();if(!WBS.CR||!p||WBS.fpSel!=WBS.CR.u||$('boardP').classList.contains('off')){b.hidden=true;return}
const A=WBS.CR.A,k=p.s/Math.max(A.w,A.h),f=(p.f||1)*(p.wx||1),r=(+p.r||0)*Math.PI/180,c=Math.cos(r),sn=Math.sin(r),bb=crBox(WBS.CR.pts),art=$('art'),m=art.getScreenCTM();if(!m){b.hidden=true;return}
let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;[[bb[0],bb[1]],[bb[2],bb[1]],[bb[2],bb[3]],[bb[0],bb[3]]].forEach(([u,v])=>{const lx=(u-WBS.CR.cu)*A.w*k*f,ly=(v-WBS.CR.cv)*A.h*k*(p.wy||1),q=art.createSVGPoint();q.x=p.x+lx*c-ly*sn;q.y=p.y+lx*sn+ly*c;const t=q.matrixTransform(m);x0=Math.min(x0,t.x);y0=Math.min(y0,t.y);x1=Math.max(x1,t.x);y1=Math.max(y1,t.y)});
b.hidden=false;const bw=b.offsetWidth,bh=b.offsetHeight,br=$('boardP').getBoundingClientRect();let y=y1+12;if(y+bh>br.bottom-6){y=y0-bh-12;if(y<br.top+6)y=Math.max(br.top+6,Math.min(y1-bh-10,br.bottom-bh-6))}
const x=Math.max(br.left+6,Math.min((x0+x1)/2-bw/2,br.right-bw-6));b.style.left=Math.round(x)+'px';b.style.top=Math.round(y)+'px'}
function crSync(){const L=fpL(),p=L?(L.pl||[]).find(q=>q.u==WBS.fpSel&&q.a):null;if(WBS.CR&&(!p||p.u!=WBS.CR.u))WBS.CR=null;const box=$('lcrop');if(!box)return;box.hidden=!(p&&p.a);{const g=$('elcrg');if(g)g.hidden=box.hidden}if(!p||!p.a)return;
$('lcrb').hidden=!!WBS.CR;$('lcrx').hidden=!!WBS.CR||!crPts(p);$('lcred').hidden=!WBS.CR;$('lcrb').textContent=crPts(p)?'Edit crop…':'Crop…';if(!WBS.CR)return;
document.querySelectorAll('#lcrm [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m==WBS.CR.m));$('lcrr').hidden=WBS.CR.m!='r';if($('lcra').value!=WBS.CR.lv)$('lcra').value=WBS.CR.lv;$('lcrall').checked=!!WBS.CR.all;crNums();
$('lcrih').textContent=WBS.CR.m=='r'?'Drag a corner or an edge to crop. Drag inside to move the crop. Enter applies it, Esc cancels. Hold Alt to turn off snapping to the picture edge.':'Drag a point to move it. Click an edge to add a point; double-click a point, or select it and press Delete, to remove it. Drag inside to move the whole shape. Enter applies, Esc cancels.'}
function crApply(){const L=fpL(),p=crP();if(!WBS.CR||!L||!p){WBS.CR=null;upd();return}const pts=WBS.CR.pts.map(q=>[+crC(q[0]).toFixed(4),+crC(q[1]).toFixed(4)]),m=WBS.CR.m,ts=WBS.CR.all?(L.pl||[]).filter(q=>q.a==p.a):[p];ts.forEach(q=>crSet(q,pts,m));WBS.CR=null;store();upd();if(WBX.wbCap)WBX.wbCap()}
const crUp=()=>{if(WBS.CR&&WBS.CR.drag){WBS.CR.drag=null;crOv();crSync()}};
const xfEnd=()=>{if(!WBS.fpXf)return;const mv=WBS.fpXf.moved;WBS.fpXf=null;if(mv){store();upd();if(WBX.wbCap)WBX.wbCap()}};
const fpEnd=()=>{if(!WBS.fpDrag)return;const mv=WBS.fpDrag.moved;WBS.fpDrag=null;if(mv){store();upd();if(WBX.wbCap)WBX.wbCap()}};
function init28(){
$('lcrb').onclick=()=>{const L=fpL(),p=L&&(L.pl||[]).find(q=>q.u==WBS.fpSel);if(!p||!p.a||!WBS.ARTS[p.a])return;const ex=crPts(p),ref=crRef(p);WBS.CR={u:p.u,A:WBS.ARTS[p.a],pts:ex?ex.map(q=>q.slice()):crRect(0,0,1,1),m:ex&&p.c.m=='p'?'p':'r',lv:'free',osw:false,all:false,sel:-1,drag:null,cu:ref.cu,cv:ref.cv};WBS.fpB=null;WBS.fpGhost=null;upd()};
$('lcrx').onclick=()=>{const L=fpL(),p=L&&(L.pl||[]).find(q=>q.u==WBS.fpSel);if(!p)return;crSet(p,crRect(0,0,1,1),'r');store();upd();if(WBX.wbCap)WBX.wbCap()};
$('lcrok').onclick=crApply;$('lcrno').onclick=()=>{WBS.CR=null;upd()};
$('lcrrs').onclick=()=>{if(!WBS.CR)return;WBS.CR.pts=crRect(0,0,1,1);WBS.CR.m='r';crFit();crOv();crSync()};
$('lcrm').onclick=e=>{const b=e.target.closest('[data-m]');if(!b||!WBS.CR||b.dataset.m==WBS.CR.m)return;if(b.dataset.m=='r'){crToRect();crFit()}else WBS.CR.m='p';crOv();crSync()};
$('lcra').onchange=()=>{if(!WBS.CR)return;WBS.CR.lv=$('lcra').value;WBS.CR.osw=false;if(WBS.CR.m=='p')crToRect();crFit();crOv();crSync()};
$('lcrsw').onclick=()=>{if(!WBS.CR)return;if(WBS.CR.lv=='orig')WBS.CR.osw=!WBS.CR.osw;else if(/^\d+:\d+$/.test(WBS.CR.lv)){const[a,b]=WBS.CR.lv.split(':');WBS.CR.lv=b+':'+a}if(WBS.CR.m=='p')crToRect();crFit();crOv();crSync()};
$('lcrpr').onchange=()=>{const v=$('lcrpr').value;$('lcrpr').value='';if(!WBS.CR||!v)return;crPreset(v);crOv();crSync()};
$('lcrall').onchange=()=>{if(WBS.CR)WBS.CR.all=$('lcrall').checked};
['lcrnx','lcrny','lcrnw','lcrnh'].forEach(id=>$(id).addEventListener('change',()=>crNumIn(id)));
// canvas: these listeners come before the normal Free place ones and keep them out of the way while a crop is open
$('art').addEventListener('pointerdown',e=>{if(!WBS.CR||e.button!==0)return;e.stopImmediatePropagation();e.preventDefault();const p=crP(),h=e.target.closest&&e.target.closest('[data-ch]');if(!p||!h)return;const[x,y]=fpPt(e),t=h.dataset.ch;
if(t=='v'){const i=+h.dataset.i,now=Date.now();if(WBS.CR.m=='p'&&WBS.CR.lv0&&WBS.CR.lv0.i===i&&now-WBS.CR.lv0.t<450&&WBS.CR.pts.length>3){WBS.CR.pts.splice(i,1);WBS.CR.sel=-1;WBS.CR.lv0=null;WBS.CR.drag=null;crOv();crSync();return}WBS.CR.lv0={i,t:now};WBS.CR.sel=i;WBS.CR.drag={k:'v',i}}
else if(t=='e'){const[u,v]=crLocal(x,y),i=+h.dataset.i;WBS.CR.pts.splice(i+1,0,[crC(u),crC(v)]);WBS.CR.sel=i+1;WBS.CR.drag={k:'v',i:i+1}}
else if(t=='h')WBS.CR.drag={k:'h',h:h.dataset.h};
else if(t=='mv'){const[u,v]=crLocal(x,y);WBS.CR.drag={k:'mv',u0:u,v0:v,pts0:WBS.CR.pts.map(q=>q.slice())};WBS.CR.sel=-1}
try{$('art').setPointerCapture(e.pointerId)}catch(er){}crOv()});
$('art').addEventListener('pointermove',e=>{if(!WBS.CR||!WBS.CR.drag)return;e.stopImmediatePropagation();const d=WBS.CR.drag,[x,y]=fpPt(e),[u,v]=crLocal(x,y);
if(d.k=='v'){const thr=e.altKey?0:.012,sn=q=>q<thr?0:q>1-thr?1:q;WBS.CR.pts[d.i]=[sn(crC(u)),sn(crC(v))]}
else if(d.k=='h')crDragRect(d.h,u,v,e.altKey);
else{const[b0,b1,b2,b3]=crBox(d.pts0);let du=u-d.u0,dv=v-d.v0;du=Math.max(-b0,Math.min(1-b2,du));dv=Math.max(-b1,Math.min(1-b3,dv));WBS.CR.pts=d.pts0.map(q=>[q[0]+du,q[1]+dv])}
crOv();crNums()});$('art').addEventListener('pointerup',crUp);$('art').addEventListener('pointercancel',crUp);
document.addEventListener('keydown',e=>{if(!WBS.CR||(e.target.matches&&e.target.matches('input,textarea,select,[contenteditable]')))return;
if(e.key=='Escape'){e.stopImmediatePropagation();e.preventDefault();WBS.CR=null;upd();return}
if(e.key=='Enter'){e.stopImmediatePropagation();e.preventDefault();crApply();return}
if(e.key=='Delete'||e.key=='Backspace'){e.stopImmediatePropagation();e.preventDefault();if(WBS.CR.m=='p'&&WBS.CR.sel>=0&&WBS.CR.pts.length>3){WBS.CR.pts.splice(WBS.CR.sel,1);WBS.CR.sel=-1;crOv();crSync()}}});
{const o1=WBH.fpSync;WBH.fpSync=function(){o1.apply(this,arguments);crSync()};const o2=WBH.fpOverlay;WBH.fpOverlay=function(){o2.apply(this,arguments);crOv();crBarUpd()}}
// --- canvas: place, select, drag
$('art').addEventListener('pointerdown',e=>{const L=fpL();if(!L||e.button!==0||$('boardP').classList.contains('off'))return;const[x,y]=fpPt(e);if(!inShape(x,y)&&!(e.target.closest&&e.target.closest('[data-fh]')))return;
const hd=e.target.closest&&e.target.closest('[data-fh]');if(hd&&!WBS.fpB){const hp=(L.pl||[]).find(q=>q.u==WBS.fpSel);if(hp){e.preventDefault();WBS.fpXf={p:hp,k:hd.dataset.fh,s0:hp.s,d0:Math.hypot(x-hp.x,y-hp.y)||1,x0:hp.x,y0:hp.y,wx0:hp.wx||1,wy0:hp.wy||1,wh0:fpWH(hp)||[1,1],moved:false};try{$('art').setPointerCapture(e.pointerId)}catch(er){}return}}
if(WBS.txArm&&tbG){e.preventDefault();L.pl=L.pl||[];const[sx,sy]=fpSnap(L,x,y,e),n=Math.max(tbG.bw,tbG.bh,.01);L.pl.push({u:fpU(),k:'text',tx:{...tbRead()},G:tbG.G,Lt:tbG.Lt,bw:tbG.bw,bh:tbG.bh,n,x:+sx.toFixed(1),y:+sy.toFixed(1),s:+n.toFixed(2),r:0,f:1,...(tbSty.tu.length?{tu:tbSty.tu.map(u=>({x:u.x,sd:txRid()}))}:{}),...(tbSty.ink?{ink:tbSty.ink}:{})});store();upd();if(WBX.wbCap)WBX.wbCap();return}
if(WBS.fpB&&(typeof WBS.fpB=='string'?WBS.ARTS[WBS.fpB]:WBS.tiles.some(t=>t.id==WBS.fpB))){e.preventDefault();L.pl=L.pl||[];const[sx,sy]=fpSnap(L,x,y,e),q={u:fpU(),k:typeof WBS.fpB=='string'?'image':'stamp',[typeof WBS.fpB=='string'?'a':'t']:WBS.fpB,x:+sx.toFixed(1),y:+sy.toFixed(1),s:+fpSnapS(L,fpSz(),e).toFixed(2),r:fpRot,f:fpFlip};L.pl.push(q);if(fpPoolOk()){const a=[...WBS.fpPool],nx=a[Math.floor(Math.random()*a.length)];WBS.fpB=typeof WBS.fpB=='string'?nx:+nx}store();upd();if(WBX.wbCap)WBX.wbCap();return}
const p=fpHit(L,x,y);if(!p){if(WBS.fpSel!==-1||WBS.fpMS.size){WBS.fpSel=-1;WBS.fpMS=new Set();upd()}return}
if(e.shiftKey||e.ctrlKey||e.metaKey){e.preventDefault();fpTog(p.u);return}
e.preventDefault();const g0=fpGrp(),inG=g0.length>1&&g0.includes(p);if(!inG)WBS.fpMS=new Set();WBS.fpSel=p.u;WBS.fpAnc=String(p.u);const g=inG?g0.map(q=>[q,q.x,q.y]):null;WBS.fpDrag={p,g,s0:[p.x,p.y],dx:x-p.x,dy:y-p.y,moved:false,id:e.pointerId};try{$('art').setPointerCapture(e.pointerId)}catch(er){}upd()});
$('art').addEventListener('pointermove',e=>{const L=fpL();if(!L)return;if(WBS.fpDrag){const[x,y]=fpPt(e),p=WBS.fpDrag.p,[nx,ny]=fpSnap(L,x-WBS.fpDrag.dx,y-WBS.fpDrag.dy,e);WBS.fpDrag.moved=true;if(WBS.fpDrag.g){const ddx=+nx.toFixed(1)-WBS.fpDrag.s0[0],ddy=+ny.toFixed(1)-WBS.fpDrag.s0[1];let oh='';WBS.fpDrag.g.forEach(([q,qx,qy])=>{q.x=+(qx+ddx).toFixed(1);q.y=+(qy+ddy).toFixed(1);const g2=document.querySelector(`#art [data-fp="${q.u}"]`);if(g2)g2.setAttribute('transform',`translate(${q.x} ${q.y})`);oh+=fpBox(q,'sel')});$('fpov').innerHTML=oh;return}
p.x=+nx.toFixed(1);p.y=+ny.toFixed(1);
const g=document.querySelector(`#art [data-fp="${p.u}"]`);if(g)g.setAttribute('transform',`translate(${p.x} ${p.y})`);$('fpov').innerHTML=fpBox(p,'sel')+fpHandles(p);return}
if(WBS.fpB||WBS.txArm){WBS.fpAlt=e.altKey;WBS.fpGhost=fpSnap(L,...fpPt(e),e);WBH.fpOverlay()}});
// Pulling a corner or a side square of a placed piece: the opposite corner or side stays where it is; with Shift it grows from the middle. Corners keep the proportions, sides pull only the width or the height.
function fpResize(h,x,y,e){const p=h.p,S0=Math.min(CW,CH),a=-(+p.r||0)*Math.PI/180,dx=x-h.x0,dy=y-h.y0,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a),[w0,h0]=h.wh0,mid=e.shiftKey,cl=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));let ox=0,oy=0;
if(h.k.length==2){const cx=h.k[1]=='e'?1:-1,cy=h.k[0]=='s'?1:-1,Cx=cx*w0/2,Cy=cy*h0/2,Fx=mid?0:-Cx,Fy=mid?0:-Cy,vx=Cx-Fx,vy=Cy-Fy;let k=((lx-Fx)*vx+(ly-Fy)*vy)/(vx*vx+vy*vy),s=cl(h.s0*k,S0*.02,S0*3);s=fpSnapS(fpL(),s,e);p.s=+s.toFixed(2);WBS.fpLast=p.s;k=p.s/h.s0;if(!mid){ox=(k-1)*Cx;oy=(k-1)*Cy}}
else if(p.tx&&h.k.length==1){// a text: the sides pull its box (width wraps the lines, height makes it a fixed box)
const ra=p.s/Math.max(p.n||1,.01),U=WBX.wbTxUnit(),side=h.k=='e'||h.k=='w',d=h.k=='e'||h.k=='s'?1:-1;if(side){const w=Math.max(U*3*ra,mid?Math.abs(lx)*2:d*lx+w0/2);p.tx={...p.tx,wd:+(w/ra/U).toFixed(2)};if(!mid)ox=d*(w-w0)/2}else{const hh=Math.max(U*3*ra,mid?Math.abs(ly)*2:d*ly+h0/2);p.tx={...p.tx,ht:+(hh/ra/U).toFixed(2)};if(!mid)oy=d*(hh-h0)/2}h.rel=[p,side&&!mid&&!(p.tx.ht>0)]}
else if(h.k=='e'||h.k=='w'){const d=h.k=='e'?1:-1,w=Math.max(w0*.02,mid?Math.abs(lx)*2:d*lx+w0/2),nx=cl(+(h.wx0*w/w0).toFixed(3),.05,20);if(nx!=1||p.wx)p.wx=nx;if(!mid)ox=d*(w0*nx/h.wx0-w0)/2}
else{const d=h.k=='s'?1:-1,hh=Math.max(h0*.02,mid?Math.abs(ly)*2:d*ly+h0/2),ny=cl(+(h.wy0*hh/h0).toFixed(3),.05,20);if(ny!=1||p.wy)p.wy=ny;if(!mid)oy=d*(h0*ny/h.wy0-h0)/2}
const r=-a;p.x=+(h.x0+ox*Math.cos(r)-oy*Math.sin(r)).toFixed(1);p.y=+(h.y0+ox*Math.sin(r)+oy*Math.cos(r)).toFixed(1);if(h.rel&&WBX.wbTbRelay)WBX.wbTbRelay(h.rel[0],h.rel[1],h)}
$('art').addEventListener('pointermove',e=>{if(!WBS.fpXf)return;const[x,y]=fpPt(e),p=WBS.fpXf.p,S0=Math.min(CW,CH);
if(WBS.fpXf.k!='rot')fpResize(WBS.fpXf,x,y,e);
else{let r=Math.atan2(y-p.y,x-p.x)*180/Math.PI+90;r=((r+180)%360+360)%360-180;if(e.shiftKey)r=Math.round(r/15)*15;p.r=Math.round(r)}
WBS.fpXf.moved=true;upd()});$('art').addEventListener('pointerup',xfEnd);$('art').addEventListener('pointercancel',xfEnd);
$('art').addEventListener('pointerleave',()=>{if(WBS.fpGhost){WBS.fpGhost=null;WBH.fpOverlay()}});$('art').addEventListener('pointerup',fpEnd);$('art').addEventListener('pointercancel',fpEnd);
document.addEventListener('keydown',e=>{const L=fpL();if(!L||$('boardP').classList.contains('off')||(e.target.matches&&e.target.matches('input,textarea,select,[contenteditable]')))return;
if(e.key=='Escape'&&(WBS.fpB||WBS.txArm||WBS.fpSel!==-1)){WBS.fpB=null;WBS.txArm=false;WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpPool=new Set();WBS.fpGhost=null;upd();return}
if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()=='a'&&(L.pl||[]).length){e.preventDefault();WBS.fpMS=new Set(L.pl.map(q=>String(q.u)));WBS.fpSel=L.pl[L.pl.length-1].u;WBS.fpB=null;WBS.fpGhost=null;upd();return}
const gr=fpGrp(),p=gr[0];if(!p)return;
if(e.key=='Delete'||e.key=='Backspace'){e.preventDefault();gr.forEach(q=>L.pl.splice(L.pl.indexOf(q),1));WBS.fpSel=-1;WBS.fpMS=new Set();store();upd();if(WBX.wbCap)WBX.wbCap();return}
const gg=fpFG(L),st=gg.snap?fpCell(L)*(e.shiftKey?5:1):(e.shiftKey?10:1)*Math.min(CW,CH)/400,mv={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]}[e.key];if(mv){e.preventDefault();let ddx=mv[0],ddy=mv[1];if(gg.snap){const pr=fpGrp().find(q=>q.u==WBS.fpSel)||p,[sx,sy]=fpSnap(L,pr.x+mv[0],pr.y+mv[1],null);ddx=sx-pr.x;ddy=sy-pr.y}gr.forEach(q=>{q.x=+(q.x+ddx).toFixed(1);q.y=+(q.y+ddy).toFixed(1)});store();upd()}});
}
export {init28};
