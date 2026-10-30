import {WBS} from './01-launch-and-version.js';
import {CH,CW,geom,shOf,tileOn} from './04-canvas-and-stamp-outlines.js';

// ===== Pattern tiling (2.57.0, owner Oct 26 2026: "patterns should place stamps right next to each other, not defined by rows and columns: square stamps edge to edge
// in a checkerboard or a descending diagonal, hex stamps in a hex arrangement, triangles flipping to fit. A setting for which shape the pattern tiles by. A spacing
// slider"; docs/polish-plan.md release 3). A Pattern on the Tiling layout ({lay:'tile'}) places its pieces edge to edge by a tile shape (ts) and an arrangement (ar):
//   ts: 'auto' (From stamp: the shape of its first stamp source) | 'square' | 'hex' | 'tri' | 'diamond' | 'circle' | 'oct'
//   ps: the size of one piece, its long side, in % of the canvas's short side; sp: spacing between pieces, in % of a piece (0 = touching)
// The arrangement is laid from the middle of the pattern's area outward, so it looks the same at every area and canvas size. Each place carries a turn, a flip
// and a class (cls): Cycle picks the source by class, so a Checkerboard alternates two sources like the squares of a board and a Diagonal runs them in stripes.
// The piece box (w x h) is the stamp's own outline box when the tile shape is the stamp's shape (geom: a hex stamp's box is exactly its hexagon), else the shape's.
const TL_S3=Math.sqrt(3);
const TL_TS=[['auto','From stamp'],['square','Square'],['hex','Hexagon'],['tri','Triangle'],['diamond','Diamond'],['circle','Circle'],['oct','Octagon'],['wall','Wallpaper']];
// 2.76.7: Stripes (rows alternate sources), Bands (two rows each), Chevron (pieces turned left and right a column at a time) and Herringbone (the same, each column
// half a piece lower) on squares; Ogee (rows of diamonds mirrored in turn) on diamonds; Fish scale (rows of circles half overlapping) on circles; Wallpaper: the 17
// wallpaper groups (TL_WG)
const TL_AR={square:[['grid','Grid'],['checker','Checkerboard'],['brick','Brick'],['half','Half drop'],['diag','Diagonal'],['basket','Basketweave'],['turn','Turned'],['pinwheel','Pinwheel'],['mirror','Mirror'],['stripes','Stripes'],['bands','Bands'],['chevron','Chevron'],['herring','Herringbone']],
 hex:[['honey','Honeycomb'],['honeyt','Honeycomb, turned'],['three','Three colours']],
 tri:[['alt','Alternating'],['rows','Alternating rows']],
 diamond:[['harl','Harlequin'],['dgrid','Diamond grid'],['ogee','Ogee']],
 circle:[['packed','Packed'],['square','Square'],['scale','Fish scale']],
 oct:[['octsq','Octagons and squares'],['octs','Octagons']],
 wall:[['p1','Shifted'],['p2','Half turns'],['pm','Mirrored'],['pg','Glided'],['cm','Mirrored, staggered'],['pmm','Mirrored both ways'],['pmg','Mirrored with half turns'],['pgg','Glided both ways'],['cmm','Mirrored both ways, staggered'],
  ['p4','Quarter turns'],['p4m','Quarter turns, mirrored'],['p4g','Quarter turns, glided'],['p3','Third turns'],['p3m1','Third turns, mirrored through'],['p31m','Third turns, mirrored between'],['p6','Sixth turns'],['p6m','Sixth turns, mirrored']]};
// ---- The 17 wallpaper groups (2.76.7). Each is its lattice (a square cell, or a hexagonal one for the third and sixth turns) and the moves that generate it: a 2 x 2
// matrix m and a shift t (in cells). The group is closed by composing the moves until nothing new appears, shifts taken back into the cell; each move puts one copy of a
// piece: at m p0 + t (p0 a point with no symmetry of its own), turned and mirrored as m says (a piece is drawn rotate(r) scale(f, 1)). The copy's number is its class,
// so Cycle and colours By place follow the group.
const TL_H3=[[1,0],[.5,TL_S3/2]];
const tlM=(a,b,c,d,tx=0,ty=0)=>({m:[a,b,c,d],t:[tx,ty]});
const TL_R=k=>{const a=k*Math.PI/180,c=Math.round(Math.cos(a)*1e9)/1e9,s=Math.round(Math.sin(a)*1e9)/1e9;return tlM(c,-s,s,c)};
const TL_MX=(tx=0,ty=0)=>tlM(-1,0,0,1,tx,ty),TL_MY=(tx=0,ty=0)=>tlM(1,0,0,-1,tx,ty),TL_T=(tx,ty)=>tlM(1,0,0,1,tx,ty);
const TL_WG={p1:[0,[]],p2:[0,[TL_R(180)]],pm:[0,[TL_MX()]],pg:[0,[TL_MX(0,.5)]],cm:[0,[TL_MX(),TL_T(.5,.5)]],pmm:[0,[TL_MX(),TL_MY()]],pmg:[0,[TL_R(180),TL_MY(.5,0)]],
 pgg:[0,[TL_R(180),TL_MX(.5,.5)]],cmm:[0,[TL_MX(),TL_MY(),TL_T(.5,.5)]],p4:[0,[TL_R(90)]],p4m:[0,[TL_R(90),TL_MX()]],p4g:[0,[TL_R(90),TL_MX(.5,.5)]],
 p3:[1,[TL_R(120)]],p3m1:[1,[TL_R(120),TL_MY()]],p31m:[1,[TL_R(120),TL_MX()]],p6:[1,[TL_R(60)]],p6m:[1,[TL_R(60),TL_MX()]]};
const TL_WC={};
// the copies of one cell: [{x, y (in cells, Cartesian), r, f}]; the lattice basis is the square or TL_H3
function tlWall(g){if(TL_WC[g])return TL_WC[g];const[hex,gens]=TL_WG[g]||TL_WG.p1,B=hex?TL_H3:[[1,0],[0,1]],det=B[0][0]*B[1][1]-B[1][0]*B[0][1],
 red=t=>{let u=(t[0]*B[1][1]-t[1]*B[1][0])/det,v=(-t[0]*B[0][1]+t[1]*B[0][0])/det;u-=Math.floor(u+1e-9);v-=Math.floor(v+1e-9);return[u*B[0][0]+v*B[1][0],u*B[0][1]+v*B[1][1]]},
 cmp=(A,C)=>({m:[A.m[0]*C.m[0]+A.m[1]*C.m[2],A.m[0]*C.m[1]+A.m[1]*C.m[3],A.m[2]*C.m[0]+A.m[3]*C.m[2],A.m[2]*C.m[1]+A.m[3]*C.m[3]],t:red([A.m[0]*C.t[0]+A.m[1]*C.t[1]+A.t[0],A.m[2]*C.t[0]+A.m[3]*C.t[1]+A.t[1]])}),
 key=o=>o.m.map(v=>Math.round(v*1e6)).join()+'|'+o.t.map(v=>Math.round(v*1e6)).join(),ops=[tlM(1,0,0,1)],seen=new Set([key(ops[0])]);
 for(let i=0;i<ops.length&&ops.length<48;i++)for(const G of gens){const n=cmp(G,ops[i]);const k=key(n);if(!seen.has(k)){seen.add(k);ops.push(n)}}
 const p0=hex?[.31,.13]:[.21,.14],out=ops.map(o=>{const[x,y]=red([o.m[0]*p0[0]+o.m[1]*p0[1]+o.t[0],o.m[2]*p0[0]+o.m[3]*p0[1]+o.t[1]]),d=o.m[0]*o.m[3]-o.m[1]*o.m[2],
  r=d>0?Math.atan2(o.m[2],o.m[0]):Math.atan2(-o.m[2],-o.m[0]);return{x,y,r:+(r*180/Math.PI).toFixed(3),f:d>0?1:-1}});
 return TL_WC[g]={hex,ops:out}}
// a small picture of a group: an asymmetric mark (a flag) at each copy, over 2 x 2 cells, in the current colour
function tlWallPreview(g){const W=tlWall(g),B=W.hex?TL_H3:[[1,0],[0,1]],L=34,o=[],F='M-5 6V-7h8l-2 3 2 3h-8';let mk='';
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)W.ops.forEach(c=>{const x=(i*B[0][0]+j*B[1][0]+c.x)*L,y=(i*B[0][1]+j*B[1][1]+c.y)*L;mk+=`<path d="${F}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${c.r}) scale(${c.f} 1) scale(1.15)"/>`});
 const w=(2*B[0][0]+2*B[1][0])*L,h=(2*B[0][1]+2*B[1][1])*L;return`<svg viewBox="-8 -8 ${(w+16).toFixed(1)} ${(h+16).toFixed(1)}" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${mk}</g></svg>`}
// the stamp outline kinds and the tile shape each one tiles by
const TL_KIND={rect:'square',hex:'hex',tri:'tri',diamond:'diamond',circle:'circle',oct:'oct'};
function tlStamp(p){const s=(p.src||[]).find(x=>x.k=='stamp'&&WBS.tiles.some(t=>t.id==x.t));return s?WBS.tiles.find(t=>t.id==s.t):null}
// the tile shape a pattern tiles by (From stamp resolved), and the arrangement it uses (the shape's first when the stored one belongs to another shape)
function tlShape(p){if(p.ts&&p.ts!='auto'&&TL_AR[p.ts])return p.ts;const t=tlStamp(p);return t?TL_KIND[shOf(t).k]||'square':'square'}
function tlArr(p,sh){const a=TL_AR[sh||tlShape(p)];return a.some(x=>x[0]==p.ar)?p.ar:a[0][0]}
// the piece box, long side 1: the stamp's own box when it has this shape, else the shape's
function tlBox(p,sh){const t=tlStamp(p),G=t?geom(shOf(t)):null,own=G&&TL_KIND[G.SK]==sh,n=(w,h)=>{const m=Math.max(w,h);return{w:w/m,h:h/m,o:G?G.HO:'p'}};
 if(own)return n(G.SW,G.SH);
 // a hexagon that is not the stamp's own lies flat (as the Hexagon of the Basic shapes does): two points left and right
 if(sh=='hex')return{...n(2,TL_S3),o:'f'};if(sh=='tri')return n(2,TL_S3);return n(1,1)}
const tlMod=(a,n)=>((a%n)+n)%n;
// the places, in the area's own units (0..W, 0..H): {pts:[[x,y]], rot, flip, cls, size: the long side of a piece in canvas units}
function tlPts(p,W,H){const sh=tlShape(p),ar=tlArr(p,sh),B=tlBox(p,sh),S=Math.max(1,Math.min(CW,CH)*Math.max(1,Math.min(100,+p.ps||12))/100),g=1+Math.max(0,Math.min(200,+p.sp||0))/100,
 w=B.w*S,h=B.h*S,pts=[],rot=[],flip=[],cls=[],size=[],gap=[];
 // the lattice: a place for each (i, j), with its turn, flip and class; the step vectors grow with the spacing
 let a=[w*g,0],b=[0,h*g],fn=(i,j)=>({});
 if(sh=='square'){
  if(ar=='brick')b=[w*g/2,h*g];
  if(ar=='half'){a=[w*g,h*g/2];b=[0,h*g]}
  if(ar=='chevron')a=[w*g*.75,0];
  if(ar=='herring'){a=[w*g*.75,h*g/2];b=[0,h*g]}
  fn={grid:(i,j)=>({}),checker:(i,j)=>({c:tlMod(i+j,2)}),brick:(i,j)=>({}),half:(i,j)=>({}),diag:(i,j)=>({c:i+j}),
   basket:(i,j)=>({r:tlMod(Math.floor(i/2)+Math.floor(j/2),2)*90}),turn:(i,j)=>({r:tlMod(i+j,2)*90}),
   pinwheel:(i,j)=>({r:[[0,270],[90,180]][tlMod(i,2)][tlMod(j,2)]}),mirror:(i,j)=>({f:(tlMod(i,2)?-1:1)*(tlMod(j,2)?-1:1),r:tlMod(j,2)?180:0}),
   stripes:(i,j)=>({c:j}),bands:(i,j)=>({c:Math.floor(j/2)}),chevron:(i,j)=>({r:tlMod(i,2)?-45:45,c:i}),herring:(i,j)=>({r:tlMod(i,2)?-45:45,c:i})}[ar]||fn}
 else if(sh=='hex'){
  // a stamp's own hexagon keeps its orientation; Honeycomb, turned turns the pieces a quarter (a pointy hexagon lies flat)
  const tw=ar=='honeyt'?h:w,th=ar=='honeyt'?w:h,turn=ar=='honeyt'?90:0,pt=(B.o!='f')!==(ar=='honeyt');
  if(pt){a=[tw*g,0];b=[tw*g/2,th*.75*g]}else{a=[tw*.75*g,th*g/2];b=[0,th*g]}
  fn=(i,j)=>({r:turn,c:ar=='three'?tlMod(i-j,3):undefined})}
 else if(sh=='tri'){a=[w*g/2,0];b=[0,h*g];fn=(i,j)=>({r:tlMod(i+j,2)*180,c:ar=='rows'?j:undefined})}
 else if(sh=='diamond'){a=[w*g/2,h*g/2];b=[-w*g/2,h*g/2];fn=(i,j)=>(ar=='ogee'?{c:tlMod(i+j,2),f:tlMod(i+j,2)?-1:1,r:tlMod(i+j,2)?180:0}:{c:ar=='harl'?tlMod(i+j,2):undefined})}
 else if(sh=='circle'){if(ar=='packed'){a=[w*g,0];b=[w*g/2,h*TL_S3/2*g]}if(ar=='scale'){a=[w*g,0];b=[w*g/2,h*g/2]}}
 else if(sh=='wall'){const W=tlWall(ar),L=S*g*Math.max(1.4,Math.sqrt(W.ops.length)*(W.hex?1.25:1.1));a=[L,0];b=W.hex?[L/2,L*TL_S3/2]:[0,L]}
 else if(sh=='oct'){a=[w*g,0];b=[0,h*g];if(ar=='octsq')fn=()=>({c:0})}
 // on a repeat tile the arrangement must repeat with the tile: its rectangle of repeat (Px x Py: how far across and down it is the same again, sources
 // included) is stretched, by at most half a step, so a whole number of them fits the tile; the pieces keep their size
 if(tileOn()&&Math.abs(W-CW)<.01&&Math.abs(H-CH)<.01){const n=Math.max(1,(p.src||[]).length),lcm=(x,y)=>{let m=x;while(m%y)m+=x;return m},hexP=sh=='hex'&&Math.abs(a[1])<1e-9;
  const P={square:{grid:[a[0]*n,b[1]],checker:[a[0]*2,b[1]*2],brick:[a[0]*n,b[1]*2],half:[a[0]*lcm(2,n),b[1]],diag:[a[0]*n,b[1]*n],basket:[a[0]*lcm(4,n),b[1]*4],turn:[a[0]*lcm(2,n),b[1]*2],pinwheel:[a[0]*lcm(2,n),b[1]*2],mirror:[a[0]*lcm(2,n),b[1]*2],stripes:[a[0],b[1]*n],bands:[a[0],b[1]*2*n],chevron:[a[0]*lcm(2,n),b[1]],herring:[a[0]*lcm(2,n),b[1]]}[ar],
   hex:hexP?[a[0]*(ar=='three'?3:n),b[1]*2]:[a[0]*2*(ar=='three'?1:n),b[1]*(ar=='three'?3:1)],
   tri:[a[0]*2*lcm(2,n)/2,b[1]*2*(ar=='rows'?lcm(2,n)/2:1)],diamond:[a[0]*2*(ar=='harl'||ar=='ogee'?1:n),a[1]*2],
   circle:[a[0]*n,ar=='packed'||ar=='scale'?b[1]*2:b[1]],oct:[a[0]*(ar=='octsq'?1:n),b[1]],wall:[a[0],b[1]*(Math.abs(b[0])>1e-9?2:1)]}[sh]||[a[0],b[1]];
  const kx=P[0]>0?W/Math.max(1,Math.round(W/P[0]))/P[0]:1,ky=P[1]>0?H/Math.max(1,Math.round(H/P[1]))/P[1]:1;a=[a[0]*kx,a[1]*ky];b=[b[0]*kx,b[1]*ky]}
 // enough places to cover the area from its middle, wherever the turn and shift put them
 const R=Math.hypot(W,H)/2+S*g*2+(sh=='wall'?Math.hypot(a[0]+b[0],a[1]+b[1]):0),da=Math.hypot(a[0],a[1]),db=Math.hypot(b[0],b[1]),cross=Math.abs(a[0]*b[1]-a[1]*b[0])||1,ni=Math.ceil(R*db/cross)+2,nj=Math.ceil(R*da/cross)+2;
 const rt=(+p.rt||0)*Math.PI/180,co=Math.cos(rt),si=Math.sin(rt),ox=W/2+(Math.max(-100,Math.min(100,+p.ox||0))/100)*w*g,oy=H/2+(Math.max(-100,Math.min(100,+p.oy||0))/100)*h*g,lim=Math.max(w,h)*g;
 let k=0;const put=(lx,ly,o,sz)=>{const x=ox+lx*co-ly*si,y=oy+lx*si+ly*co;if(x<-lim||x>W+lim||y<-lim||y>H+lim)return;pts.push([x,y]);rot.push((o.r||0)+(+p.rt||0));flip.push(o.f||1);cls.push(o.c==null?o.i:o.c);size.push(sz||S);gap.push(!!o.gap);k++};
 // a wallpaper cell's copies follow the lattice's own stretch across and down (a repeat tile stretches them apart)
 const WG=sh=='wall'?tlWall(ar):null,WX=WG?a[0]:0,WY=WG?(WG.hex?b[1]/(TL_S3/2):b[1]):0;
 for(let j=-nj;j<=nj;j++)for(let i=-ni;i<=ni;i++){const lx=i*a[0]+j*b[0],ly=i*a[1]+j*b[1];if(Math.hypot(lx,ly)>R)continue;if(WG){WG.ops.forEach((c,k)=>put(lx+c.x*WX,ly+c.y*WY,{i,r:c.r,f:c.f,c:k}));continue}put(lx,ly,{i,...fn(i,j)});
  // Octagons and squares: the small square between four octagons takes the second source (left empty with one source) (a regular octagon's side is its width / (1 + √2))
  if(sh=='oct'&&ar=='octsq'){const s=w/(1+Math.SQRT2);put(lx+a[0]/2+b[0]/2,ly+a[1]/2+b[1]/2,{i,r:45,c:1,gap:1},s*Math.SQRT2)}}
 return{pts,rot,flip,cls,size,gap,shape:sh,arr:ar,box:{w:B.w,h:B.h}}}
export {TL_AR,TL_TS,tlArr,tlPts,tlShape,tlWallPreview};
