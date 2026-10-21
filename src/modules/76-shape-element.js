import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,col,okC} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elExtend,elSel} from './65-element-core.js';
import {fxGr,fxJit,fxTex} from './69-effect-stack.js';
import {abInsert} from './73-add-bar.js';

// ===== The Shape element (2.3.2): a geometric shape on the canvas, drawn as a vector path, solid or an outline (or both), with a pen for your own shapes.
// {u, k:'shape', sh: preset | 'path', x, y (its middle, canvas units), s (width), wx, wy (stretch: the box is s*wx by s*wy), r (degrees), f (1 or -1, flipped),
//  ink (fill colour reference, the project ink when not set), fl ('none' = no fill), sw (outline width in canvas units, 0 or none = no outline), sk (outline colour),
//  cr (corner, % of the short side, Rounded), np (points, Star), pts + cl (a pen path, see below), fx (effects)}.
// Pen path: pts = [[x, y, ix, iy, ox, oy], ...] in shares of the box (-.5 to .5 across it), (ix, iy) is the handle that comes in and (ox, oy) the one that goes out, as
// offsets from the point; cl is 1 when the path is closed. Stretching the box stretches the path; the outline stays the same width.
// Texture, Jitter and Colour grade work on a Shape like on any element. Owner, Oct 20 2026.
const SHPL=[['rect','Rectangle','<rect x="4.5" y="6.5" width="15" height="11"/>'],['rrect','Rounded','<rect x="4.5" y="6.5" width="15" height="11" rx="4"/>'],['ellipse','Ellipse','<ellipse cx="12" cy="12" rx="8" ry="6.2"/>'],
 ['tri','Triangle','<path d="M12 5L20 18H4z"/>'],['dia','Diamond','<path d="M12 4l8 8-8 8-8-8z"/>'],['pent','Pentagon','<path d="M12 4.5l7.5 5.5-2.9 8.5H7.4L4.5 10z"/>'],
 ['hex','Hexagon','<path d="M8 5h8l4.5 7-4.5 7H8l-4.5-7z"/>'],['star','Star','<path d="M12 4l2.4 5 5.6.7-4.1 3.8 1.1 5.5L12 16.2 7 19l1.1-5.5L4 9.7 9.6 9z"/>'],
 ['arrow','Arrow','<path d="M4 9.5h9V5l7 7-7 7v-4.5H4z"/>'],['heart','Heart','<path d="M12 19.5C5 14.5 3.5 10.5 5.5 8c1.7-2 4.7-1.6 6.5 1 1.8-2.6 4.8-3 6.5-1 2 2.5.5 6.5-6.5 11.5z"/>'],
 ['line','Line','<path d="M5 18L19 6"/>']];
const SHPN=Object.fromEntries(SHPL.map(a=>[a[0],a[1]]));SHPN.path='Path';
const sf=v=>(+v).toFixed(2);
// the outline of a preset in its box (w by h, middle at 0,0) as path data
function shGeom(p,w,h){const a=w/2,b=h/2,P=(pts,close=true)=>'M'+pts.map(q=>sf(q[0])+' '+sf(q[1])).join('L')+(close?'Z':''),
 ngon=(n,a0)=>P(Array.from({length:n},(_,i)=>{const t=(a0+i*360/n)*Math.PI/180;return[a*Math.cos(t),b*Math.sin(t)]}));
 switch(p.sh){
 case'ellipse':return`M${sf(-a)} 0A${sf(a)} ${sf(b)} 0 1 0 ${sf(a)} 0A${sf(a)} ${sf(b)} 0 1 0 ${sf(-a)} 0Z`;
 case'rrect':{const r=Math.max(0,Math.min(50,p.cr==null?18:+p.cr))/100*Math.min(w,h);return r<.01?P([[-a,-b],[a,-b],[a,b],[-a,b]]):`M${sf(-a+r)} ${sf(-b)}H${sf(a-r)}A${sf(r)} ${sf(r)} 0 0 1 ${sf(a)} ${sf(-b+r)}V${sf(b-r)}A${sf(r)} ${sf(r)} 0 0 1 ${sf(a-r)} ${sf(b)}H${sf(-a+r)}A${sf(r)} ${sf(r)} 0 0 1 ${sf(-a)} ${sf(b-r)}V${sf(-b+r)}A${sf(r)} ${sf(r)} 0 0 1 ${sf(-a+r)} ${sf(-b)}Z`}
 case'tri':return P([[0,-b],[a,b],[-a,b]]);
 case'dia':return P([[0,-b],[a,0],[0,b],[-a,0]]);
 case'pent':return ngon(5,-90);
 case'hex':return ngon(6,0);
 case'star':{const n=Math.max(3,Math.min(12,Math.round(+p.np||5))),pts=[];for(let i=0;i<n*2;i++){const t=(-90+i*180/n)*Math.PI/180,k=i%2?.42:1;pts.push([a*k*Math.cos(t),b*k*Math.sin(t)])}return P(pts)}
 case'arrow':return P([[-a,-b*.36],[a*.1,-b*.36],[a*.1,-b],[a,0],[a*.1,b],[a*.1,b*.36],[-a,b*.36]]);
 case'heart':{const X=v=>sf(v*w),Y=v=>sf(v*h);return`M${X(0)} ${Y(.5)}C${X(-.55)} ${Y(.12)} ${X(-.5)} ${Y(-.36)} ${X(-.25)} ${Y(-.42)}C${X(-.1)} ${Y(-.45)} ${X(0)} ${Y(-.32)} ${X(0)} ${Y(-.2)}C${X(0)} ${Y(-.32)} ${X(.1)} ${Y(-.45)} ${X(.25)} ${Y(-.42)}C${X(.5)} ${Y(-.36)} ${X(.55)} ${Y(.12)} ${X(0)} ${Y(.5)}Z`}
 case'line':return`M${sf(-a)} 0L${sf(a)} 0`;
 case'path':return shPath(p,w,h);
 default:return P([[-a,-b],[a,-b],[a,b],[-a,b]])}}
// a pen path in its box
function shPath(p,w,h){const q=Array.isArray(p.pts)?p.pts:[];if(q.length<2)return'';const X=v=>sf(v*w),Y=v=>sf(v*h);let d=`M${X(q[0][0])} ${Y(q[0][1])}`;
 const seg=(a,b)=>`C${X(a[0]+(a[4]||0))} ${Y(a[1]+(a[5]||0))} ${X(b[0]+(b[2]||0))} ${Y(b[1]+(b[3]||0))} ${X(b[0])} ${Y(b[1])}`;
 for(let i=1;i<q.length;i++)d+=seg(q[i-1],q[i]);if(p.cl&&q.length>2)d+=seg(q[q.length-1],q[0])+'Z';return d}
const shOpen=p=>p.sh=='line'||(p.sh=='path'&&!p.cl);
const shBox=p=>{const s=Math.max(1,+p.s||100);return[s*(p.wx||1),s*(p.wy||1)]};
function shpLayer(L,li,pa){const pl=(L.pl||[]).filter(p=>p.k=='shape');if(!pl.length)return['',''];const fr=new Map();let defs='',out='';
 pl.forEach(p=>{const id=String(p.u).replace(/[^\w-]/g,''),J=fxJit(p),[w0,h0]=shBox(p),sz=J?J.sz:1,w=w0*sz,h=h0*sz,d=shGeom(p,w,h);if(!d)return;
  const fill=p.fl=='none'||shOpen(p)&&p.fl!='solid'?'none':col(okC(p.ink)?p.ink:WBS.proj.ink),sw=+p.sw>0?Math.min(400,+p.sw):0,stroke=sw?` stroke="${col(okC(p.sk)?p.sk:WBS.proj.ink)}" stroke-width="${sf(sw)}" stroke-linejoin="round" stroke-linecap="round"`:'';
  if(fill=='none'&&!sw){fr.set(String(p.u),'');return}
  const rr=(+p.r||0)+(J?J.dr:0),fl=(+p.f||1)*(J&&J.sx<0?-1:1),fv=J&&J.sy<0?-1:1,bx={x:(+p.x||0)-w/2-sw,y:(+p.y||0)-h/2-sw,W:w+2*sw,H:h+2*sw,R:400},
   T=p.fx&&p.fx.length?fxTex(p,'spx'+li+'_'+id,bx):null,G=p.fx&&p.fx.length?fxGr(p,'spg'+li+'_'+id,bx):null;if(T)defs+=T.defs;if(G)defs+=G.defs;
  const body=`<g transform="translate(${sf((+p.x||0)+(J?J.dx:0))} ${sf((+p.y||0)+(J?J.dy:0))}) rotate(${sf(rr)}) scale(${fl} ${fv})"><path d="${d}" fill="${fill}" fill-rule="evenodd"${stroke}/></g>`,
   one=T||G?`<g${T?T.attrs:''}>${G?G.wrap(body):body}</g>`:body;out+=one;fr.set(String(p.u),one)});
 return[defs,out,'','',fr]}

// ---- making one
let shLast='rect';
function shNew(g){const S=Math.min(CW,CH),p={u:fpU(),k:'shape',sh:g,x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:+(S*.4).toFixed(1),r:0,f:1};
 if(g=='line'){p.wy=.06;p.sw=Math.max(2,Math.round(S/60));p.s=+(S*.5).toFixed(1)}
 if(g=='rrect')p.cr=18;if(g=='star')p.np=5;if(g=='arrow'||g=='rect'||g=='rrect')p.wy=.7;
 const q=abInsert(p);if(!q)return null;shLast=g;store();upd();if(WBX.wbCap)WBX.wbCap();if(WBX.wbElSeen)WBX.wbElSeen(q.u);return q}
const shCur=()=>{const q=elSel();return q&&q.k=='shape'?q:null};
const shCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};

// ---- the pen: click for a corner point, drag to pull curve handles, click the first point to close, Enter to finish an open path, Backspace to take back a point, Esc to stop
// Points are kept in canvas units while drawing: [x, y, ix, iy, ox, oy] with the handles as offsets.
const PEN={pts:null,cur:null,drag:null,edit:null,nd:null};   // pts: points so far (drawing); cur: pointer; drag: the point being pulled; edit: u of the Shape being edited; nd: node drag
const penPt=e=>{const a=$('art'),m=a&&a.getScreenCTM();if(!m)return null;const pt=a.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const q=pt.matrixTransform(m.inverse());return[q.x,q.y]};
const penK=()=>Math.max(CW,CH)/95;   // handle size, as the selection handles
// a path in canvas units to data
function penD(pts,closed,cur){if(!pts.length)return'';let d=`M${sf(pts[0][0])} ${sf(pts[0][1])}`;const seg=(a,b)=>`C${sf(a[0]+a[4])} ${sf(a[1]+a[5])} ${sf(b[0]+b[2])} ${sf(b[1]+b[3])} ${sf(b[0])} ${sf(b[1])}`;
 for(let i=1;i<pts.length;i++)d+=seg(pts[i-1],pts[i]);if(closed)d+=seg(pts[pts.length-1],pts[0])+'Z';else if(cur){const a=pts[pts.length-1];d+=`C${sf(a[0]+a[4])} ${sf(a[1]+a[5])} ${sf(cur[0])} ${sf(cur[1])} ${sf(cur[0])} ${sf(cur[1])}`}return d}
function penDraw(){const g=$('penov');if(!g)return;const k=penK(),lw=(k/5).toFixed(2);let h='';
 if(PEN.pts){h+=`<path d="${penD(PEN.pts,false,PEN.cur&&!PEN.drag?PEN.cur:null)}" fill="none" stroke="#e33" stroke-width="${lw}" stroke-dasharray="${sf(k/2)} ${sf(k/3)}"/>`;
  PEN.pts.forEach((q,i)=>{if(PEN.drag==i||(i==PEN.pts.length-1&&(q[4]||q[5]))){h+=`<line x1="${sf(q[0]+q[2])}" y1="${sf(q[1]+q[3])}" x2="${sf(q[0]+q[4])}" y2="${sf(q[1]+q[5])}" stroke="#e33" stroke-width="${lw}"/><circle cx="${sf(q[0]+q[4])}" cy="${sf(q[1]+q[5])}" r="${sf(k*.5)}" fill="#e33"/><circle cx="${sf(q[0]+q[2])}" cy="${sf(q[1]+q[3])}" r="${sf(k*.5)}" fill="#e33"/>`}
   h+=`<rect x="${sf(q[0]-k*.6)}" y="${sf(q[1]-k*.6)}" width="${sf(k*1.2)}" height="${sf(k*1.2)}" fill="${i==0?'#e33':'#fff'}" stroke="#e33" stroke-width="${lw}"/>`})}
 else if(PEN.edit){const p=(fpL()?.pl||[]).find(q=>q.u==PEN.edit);if(p&&p.sh=='path'){const T=penXf(p),n=p.pts.length;
  p.pts.forEach((q,i)=>{const a=T.to(q[0],q[1]),hi=T.to(q[0]+q[2],q[1]+q[3]),ho=T.to(q[0]+q[4],q[1]+q[5]);
   if(q[2]||q[3]||q[4]||q[5])h+=`<line x1="${sf(hi[0])}" y1="${sf(hi[1])}" x2="${sf(ho[0])}" y2="${sf(ho[1])}" stroke="#e33" stroke-width="${lw}" pointer-events="none"/>`;
   if(q[2]||q[3])h+=`<circle data-pn="i" data-i="${i}" cx="${sf(hi[0])}" cy="${sf(hi[1])}" r="${sf(k*.5)}" fill="#e33" pointer-events="all" style="cursor:move"/>`;
   if(q[4]||q[5])h+=`<circle data-pn="o" data-i="${i}" cx="${sf(ho[0])}" cy="${sf(ho[1])}" r="${sf(k*.5)}" fill="#e33" pointer-events="all" style="cursor:move"/>`;
   h+=`<rect data-pn="a" data-i="${i}" x="${sf(a[0]-k*.6)}" y="${sf(a[1]-k*.6)}" width="${sf(k*1.2)}" height="${sf(k*1.2)}" fill="#fff" stroke="#e33" stroke-width="${lw}" pointer-events="all" style="cursor:move"/>`});
  h+=`<path data-pn="seg" d="${penD(p.pts.map(q=>{const a=T.to(q[0],q[1]),i=T.vec(q[2],q[3]),o=T.vec(q[4],q[5]);return[a[0],a[1],i[0],i[1],o[0],o[1]]}),!!p.cl&&n>2)}" fill="none" stroke="transparent" stroke-width="${sf(k*1.2)}" pointer-events="stroke"/>`}}
 if(g.innerHTML!==h)g.innerHTML=h}
// the box of a path Shape: points in shares of it to canvas units and back
function penXf(p){const[w,h]=shBox(p),r=(+p.r||0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r),f=+p.f||1,x=+p.x||0,y=+p.y||0;
 const vec=(a,b)=>{const lx=a*w*f,ly=b*h;return[lx*c-ly*s,lx*s+ly*c]},inv=(dx,dy)=>{const lx=dx*c+dy*s,ly=-dx*s+dy*c;return[lx*f/w,ly/h]};
 return{vec,to:(a,b)=>{const v=vec(a,b);return[x+v[0],y+v[1]]},from:(cx,cy)=>inv(cx-x,cy-y),fromVec:inv}}
// bounding box of the points and their curves (canvas units)
function penBox(pts,closed){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const add=(x,y)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)},seg=(a,b)=>{for(let i=0;i<=16;i++){const t=i/16,u=1-t,c1=[a[0]+a[4],a[1]+a[5]],c2=[b[0]+b[2],b[1]+b[3]];add(u*u*u*a[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*b[0],u*u*u*a[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*b[1])}};
 add(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)seg(pts[i-1],pts[i]);if(closed)seg(pts[pts.length-1],pts[0]);return[x0,y0,x1,y1]}
function penFinish(closed){const pts=PEN.pts;PEN.pts=null;PEN.cur=null;PEN.drag=null;document.body.classList.remove('penon');
 if(!pts||pts.length<2){penDraw();penSync();return}
 const[x0,y0,x1,y1]=penBox(pts,closed),bw=Math.max(2,x1-x0),bh=Math.max(2,y1-y0),cx=(x0+x1)/2,cy=(y0+y1)/2,n4=v=>+v.toFixed(4);
 const q=abInsert({u:fpU(),k:'shape',sh:'path',x:+cx.toFixed(1),y:+cy.toFixed(1),s:+bw.toFixed(1),wy:n4(bh/bw),r:0,f:1,cl:closed?1:0,pts:pts.map(a=>[n4((a[0]-cx)/bw),n4((a[1]-cy)/bh),n4(a[2]/bw),n4(a[3]/bh),n4(a[4]/bw),n4(a[5]/bh)]),...(closed?{}:{fl:'none',sw:Math.max(2,Math.round(Math.min(CW,CH)/80))})});
 if(q){shLast='path';shCh();if(WBX.wbElSeen)WBX.wbElSeen(q.u)}penDraw();penSync()}
function penStop(){PEN.pts=null;PEN.cur=null;PEN.drag=null;document.body.classList.remove('penon');penDraw();penSync()}
function penStart(){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();PEN.edit=null;PEN.pts=[];PEN.cur=null;PEN.drag=null;document.body.classList.add('penon');if(WBX.plDisarm)WBX.plDisarm();penDraw();penSync()}
const penOn=()=>!!PEN.pts;
function penSync(){const b=$('shp_pen');if(b){const on=penOn();if(b.getAttribute('aria-pressed')!=String(on)){b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on)}}if(WBX.wbAbSync)WBX.wbAbSync();shpSync()}
// editing the points of the selected path Shape
function penEditOn(on){const p=shCur();PEN.edit=on&&p&&p.sh=='path'?p.u:null;penDraw();penSync()}
function penNodeDown(e){const t=e.target.closest&&e.target.closest('[data-pn]');if(!t)return false;const p=(fpL()?.pl||[]).find(q=>q.u==PEN.edit);if(!p)return false;const T=penXf(p),kind=t.dataset.pn,i=+t.dataset.i;
 if(kind=='seg'){if(e.detail<2)return false;const c=penPt(e);if(!c)return false;e.preventDefault();e.stopImmediatePropagation();penSplit(p,T,c);return true}
 e.preventDefault();e.stopImmediatePropagation();
 if(kind=='a'&&e.altKey&&p.pts.length>2){p.pts.splice(i,1);shCh();penDraw();return true}
 if(kind=='a'&&e.detail>=2){const q=p.pts[i];if(q[2]||q[3]||q[4]||q[5]){q[2]=q[3]=q[4]=q[5]=0}else{const a=p.pts[(i+p.pts.length-1)%p.pts.length],b=p.pts[(i+1)%p.pts.length],dx=(b[0]-a[0])/6,dy=(b[1]-a[1])/6;q[2]=-dx;q[3]=-dy;q[4]=dx;q[5]=dy}shCh();penDraw();return true}
 PEN.nd={p,T,kind,i};try{$('art').setPointerCapture(e.pointerId)}catch(x){}return true}
function penNodeMove(e){const n=PEN.nd;if(!n)return false;const c=penPt(e);if(!c)return true;const q=n.p.pts[n.i],T=n.T;
 if(n.kind=='a'){const m=T.from(c[0],c[1]);q[0]=+m[0].toFixed(4);q[1]=+m[1].toFixed(4)}
 else{const m=T.from(c[0],c[1]),dx=m[0]-q[0],dy=m[1]-q[1];if(n.kind=='o'){q[4]=+dx.toFixed(4);q[5]=+dy.toFixed(4);if(!e.altKey){q[2]=-q[4];q[3]=-q[5]}}else{q[2]=+dx.toFixed(4);q[3]=+dy.toFixed(4);if(!e.altKey){q[4]=-q[2];q[5]=-q[3]}}}
 upd();penDraw();return true}
// a double click on the path puts a new point there (the curve is split in two where it was clicked)
function penSplit(p,T,c){const q=p.pts,n=q.length,segs=p.cl&&n>2?n:n-1;let best=null;
 for(let i=0;i<segs;i++){const a=q[i],b=q[(i+1)%n],A=T.to(a[0],a[1]),B=T.to(b[0],b[1]),C1=T.to(a[0]+a[4],a[1]+a[5]),C2=T.to(b[0]+b[2],b[1]+b[3]);
  for(let j=0;j<=40;j++){const t=j/40,u=1-t,x=u*u*u*A[0]+3*u*u*t*C1[0]+3*u*t*t*C2[0]+t*t*t*B[0],y=u*u*u*A[1]+3*u*u*t*C1[1]+3*u*t*t*C2[1]+t*t*t*B[1],d=(x-c[0])**2+(y-c[1])**2;if(!best||d<best.d)best={d,i,t}}}
 if(!best)return;const a=q[best.i],b=q[(best.i+1)%n],t=best.t,L=(p0,p1,k)=>p0+(p1-p0)*k,P0=[a[0],a[1]],P1=[a[0]+a[4],a[1]+a[5]],P2=[b[0]+b[2],b[1]+b[3]],P3=[b[0],b[1]],
  A1=[L(P0[0],P1[0],t),L(P0[1],P1[1],t)],B1=[L(P1[0],P2[0],t),L(P1[1],P2[1],t)],C1=[L(P2[0],P3[0],t),L(P2[1],P3[1],t)],A2=[L(A1[0],B1[0],t),L(A1[1],B1[1],t)],B2=[L(B1[0],C1[0],t),L(B1[1],C1[1],t)],M=[L(A2[0],B2[0],t),L(A2[1],B2[1],t)],r4=v=>+v.toFixed(4);
 a[4]=r4(A1[0]-a[0]);a[5]=r4(A1[1]-a[1]);b[2]=r4(C1[0]-b[0]);b[3]=r4(C1[1]-b[1]);
 q.splice(best.i+1,0,[r4(M[0]),r4(M[1]),r4(A2[0]-M[0]),r4(A2[1]-M[1]),r4(B2[0]-M[0]),r4(B2[1]-M[1])]);shCh();penDraw()}

// ---- the panel: three groups (Shape, Fill, Outline) in the Element panel, shown while a Shape is selected
function shpSync(){const p=shCur(),k=$('shp_k');if(!k)return;const show=!!p;['shp_k','shp_f','shp_o'].forEach(id=>{const e=$(id);if(e&&e.hidden===show)e.hidden=!show});
 if(!show){if(PEN.edit){PEN.edit=null;penDraw()}return}
 $('shp_pre').querySelectorAll('[data-g]').forEach(b=>{const on=b.dataset.g==p.sh;if(b.getAttribute('aria-pressed')!=String(on)){b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on)}});
 const vis=(id,v)=>{const e=$(id);if(e&&e.hidden===v)e.hidden=!v},set=(id,v)=>{const e=$(id);if(e&&+e.value!==v){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))}};
 vis('shp_crw',p.sh=='rrect');vis('shp_npw',p.sh=='star');vis('shp_ed',p.sh=='path');if(p.sh=='rrect')set('shp_cr',p.cr==null?18:+p.cr);if(p.sh=='star')set('shp_np',+p.np||5);
 const ed=PEN.edit==p.u,eb=$('shp_ed');if(eb&&eb.getAttribute('aria-pressed')!=String(ed)){eb.setAttribute('aria-pressed',String(ed));eb.classList.toggle('on',ed)}
 const open=shOpen(p),fk=p.fl=='none'?'none':'solid';$('shp_fk').querySelectorAll('[data-f]').forEach(b=>{const on=b.dataset.f==fk;if(b.getAttribute('aria-pressed')!=String(on)){b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on)}});
 vis('shp_fcr',fk=='solid');const so=+p.sw>0,oc=$('shp_oon');if(oc.checked!==so)oc.checked=so;vis('shp_owr',so);vis('shp_ocr',so);if(so)set('shp_ow',Math.round(+p.sw));
 if(WBX.wbPaintWells)WBX.wbPaintWells()}
function init76(){
 elExtend('shape',{dz:6,is:q=>q.k=='shape',name:q=>q.nm||SHPN[q.sh]||'Shape',draw:(L,li,pa)=>shpLayer(L,li,pa)});
 const pre=$('shp_pre');if(!pre)return;
 pre.innerHTML=SHPL.map(a=>`<button type="button" data-g="${a[0]}" aria-label="${a[1]}" title="${a[1]}" aria-pressed="false"><svg viewBox="0 0 24 24">${a[2]}</svg></button>`).join('');
 pre.onclick=e=>{const b=e.target.closest('[data-g]');const p=shCur();if(!b||!p)return;const g=b.dataset.g;if(p.sh==g)return;p.sh=g;shLast=g;if(g=='rrect'&&p.cr==null)p.cr=18;if(g=='star'&&p.np==null)p.np=5;if(g=='line'&&!(+p.sw>0))p.sw=Math.max(2,Math.round(Math.min(CW,CH)/60));PEN.edit=null;shCh();shpSync()};
 const sl=(id,key)=>$(id).addEventListener('input',()=>{const p=shCur();if(!p)return;const v=+$(id).value;if(p[key]===v)return;p[key]=v;store();upd()});
 sl('shp_cr','cr');sl('shp_np','np');['shp_cr','shp_np','shp_ow'].forEach(id=>$(id).addEventListener('change',()=>{if(WBX.wbCap)WBX.wbCap()}));
 $('shp_pen').onclick=()=>{if(penOn())penStop();else penStart()};
 $('shp_ed').onclick=()=>penEditOn(PEN.edit==null);
 $('shp_fk').onclick=e=>{const b=e.target.closest('[data-f]');const p=shCur();if(!b||!p)return;if(b.dataset.f=='none')p.fl='none';else if(shOpen(p))p.fl='solid';else delete p.fl;shCh();shpSync()};
 $('shp_oon').onchange=()=>{const p=shCur();if(!p)return;if($('shp_oon').checked)p.sw=+p.sw>0?p.sw:Math.max(2,Math.round(Math.min(CW,CH)/80));else delete p.sw;shCh();shpSync()};
 $('shp_ow').addEventListener('input',()=>{const p=shCur();if(!p)return;const v=+$('shp_ow').value;if(p.sw===v)return;p.sw=v;store();upd()});
 if(WBX.wbMkWell){const pj=()=>WBS.proj;
  WBX.wbMkWell($('shp_fw'),{label:'Fill colour',what:'Shape fill',defRef:()=>pj().ink,get:()=>{const p=shCur();return p&&p.ink||pj().ink},set:v=>{const p=shCur();if(p&&v)p.ink=v}});
  WBX.wbMkWell($('shp_ow2'),{label:'Outline colour',what:'Shape outline',defRef:()=>pj().ink,get:()=>{const p=shCur();return p&&p.sk||pj().ink},set:v=>{const p=shCur();if(p&&v)p.sk=v}})}
 // the pen on the canvas
 const art=$('art');
 art.addEventListener('pointerdown',e=>{if(e.button||e.target.closest&&e.target.closest('#fpov [data-fh]'))return;
  if(PEN.pts){e.preventDefault();e.stopImmediatePropagation();const c=penPt(e);if(!c)return;const P=PEN.pts,f=P[0];if(P.length>2&&Math.hypot(c[0]-f[0],c[1]-f[1])<penK()*1.2){penFinish(true);return}
   P.push([c[0],c[1],0,0,0,0]);PEN.drag=P.length-1;PEN.cur=c;try{art.setPointerCapture(e.pointerId)}catch(x){}penDraw();return}
  if(PEN.edit&&penNodeDown(e))return},true);
 art.addEventListener('pointermove',e=>{if(PEN.pts){const c=penPt(e);if(!c)return;PEN.cur=c;if(PEN.drag!=null){const q=PEN.pts[PEN.drag],dx=c[0]-q[0],dy=c[1]-q[1];if(Math.hypot(dx,dy)>penK()*.3){q[4]=dx;q[5]=dy;q[2]=-dx;q[3]=-dy}}penDraw();return}
  if(PEN.nd)penNodeMove(e)},true);
 const up=()=>{if(PEN.pts)PEN.drag=null;if(PEN.nd){PEN.nd=null;shCh()}};art.addEventListener('pointerup',up,true);art.addEventListener('pointercancel',up,true);
 art.addEventListener('dblclick',e=>{if(PEN.pts){e.preventDefault();e.stopPropagation()}},true);
 document.addEventListener('keydown',e=>{const t=e.target;if(t&&t.matches&&t.matches('input,select,textarea,[contenteditable]'))return;
  if(PEN.pts){if(e.key=='Enter'){e.preventDefault();penFinish(false)}else if(e.key=='Escape'){e.preventDefault();e.stopPropagation();penStop()}else if(e.key=='Backspace'){e.preventDefault();PEN.pts.pop();if(!PEN.pts.length)PEN.cur=null;penDraw()}}
  else if(PEN.edit&&e.key=='Escape'){penEditOn(false)}},true);
 WBX.wbShpSync=()=>{shpSync();if(PEN.edit)penDraw()};WBX.wbShapeNew=shNew;WBX.wbShapeLast=()=>shLast;WBX.wbPenOn=penOn;WBX.wbPenStop=penStop;WBX.wbPenStart=penStart}
export {init76,shpLayer,shNew,shBox,shGeom,shOpen};
