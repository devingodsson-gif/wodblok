import {WBS} from './01-launch-and-version.js';
import {CH,CW,geom,shOf} from './04-canvas-and-stamp-outlines.js';

// ===== Pattern tiling (2.57.0, owner Oct 26 2026: "patterns should place stamps right next to each other, not defined by rows and columns: square stamps edge to edge
// in a checkerboard or a descending diagonal, hex stamps in a hex arrangement, triangles flipping to fit. A setting for which shape the pattern tiles by. A spacing
// slider"; docs/polish-plan.md release 3). A Pattern on the Tiling layout ({lay:'tile'}) places its pieces edge to edge by a tile shape (ts) and an arrangement (ar):
//   ts: 'auto' (From stamp: the shape of its first stamp source) | 'square' | 'hex' | 'tri' | 'diamond' | 'circle' | 'oct'
//   ps: the size of one piece, its long side, in % of the canvas's short side; sp: spacing between pieces, in % of a piece (0 = touching)
// The arrangement is laid from the middle of the pattern's area outward, so it looks the same at every area and canvas size. Each place carries a turn, a flip
// and a class (cls): Cycle picks the source by class, so a Checkerboard alternates two sources like the squares of a board and a Diagonal runs them in stripes.
// The piece box (w x h) is the stamp's own outline box when the tile shape is the stamp's shape (geom: a hex stamp's box is exactly its hexagon), else the shape's.
const TL_S3=Math.sqrt(3);
const TL_TS=[['auto','From stamp'],['square','Square'],['hex','Hexagon'],['tri','Triangle'],['diamond','Diamond'],['circle','Circle'],['oct','Octagon']];
const TL_AR={square:[['grid','Grid'],['checker','Checkerboard'],['brick','Brick'],['half','Half drop'],['diag','Diagonal'],['basket','Basketweave'],['turn','Turned'],['pinwheel','Pinwheel'],['mirror','Mirror']],
 hex:[['honey','Honeycomb'],['honeyt','Honeycomb, turned'],['three','Three colours']],
 tri:[['alt','Alternating'],['rows','Alternating rows']],
 diamond:[['harl','Harlequin'],['dgrid','Diamond grid']],
 circle:[['packed','Packed'],['square','Square']],
 oct:[['octsq','Octagons and squares'],['octs','Octagons']]};
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
  fn={grid:(i,j)=>({}),checker:(i,j)=>({c:tlMod(i+j,2)}),brick:(i,j)=>({}),half:(i,j)=>({}),diag:(i,j)=>({c:i+j}),
   basket:(i,j)=>({r:tlMod(Math.floor(i/2)+Math.floor(j/2),2)*90}),turn:(i,j)=>({r:tlMod(i+j,2)*90}),
   pinwheel:(i,j)=>({r:[[0,270],[90,180]][tlMod(i,2)][tlMod(j,2)]}),mirror:(i,j)=>({f:(tlMod(i,2)?-1:1)*(tlMod(j,2)?-1:1),r:tlMod(j,2)?180:0})}[ar]||fn}
 else if(sh=='hex'){
  // a stamp's own hexagon keeps its orientation; Honeycomb, turned turns the pieces a quarter (a pointy hexagon lies flat)
  const tw=ar=='honeyt'?h:w,th=ar=='honeyt'?w:h,turn=ar=='honeyt'?90:0,pt=(B.o!='f')!==(ar=='honeyt');
  if(pt){a=[tw*g,0];b=[tw*g/2,th*.75*g]}else{a=[tw*.75*g,th*g/2];b=[0,th*g]}
  fn=(i,j)=>({r:turn,c:ar=='three'?tlMod(i-j,3):undefined})}
 else if(sh=='tri'){a=[w*g/2,0];b=[0,h*g];fn=(i,j)=>({r:tlMod(i+j,2)*180,c:ar=='rows'?j:undefined})}
 else if(sh=='diamond'){a=[w*g/2,h*g/2];b=[-w*g/2,h*g/2];fn=(i,j)=>({c:ar=='harl'?tlMod(i+j,2):undefined})}
 else if(sh=='circle'){if(ar=='packed'){a=[w*g,0];b=[w*g/2,h*TL_S3/2*g]}}
 else if(sh=='oct'){a=[w*g,0];b=[0,h*g];if(ar=='octsq')fn=()=>({c:0})}
 // enough places to cover the area from its middle, wherever the turn and shift put them
 const R=Math.hypot(W,H)/2+S*g*2,da=Math.hypot(a[0],a[1]),db=Math.hypot(b[0],b[1]),cross=Math.abs(a[0]*b[1]-a[1]*b[0])||1,ni=Math.ceil(R*db/cross)+2,nj=Math.ceil(R*da/cross)+2;
 const rt=(+p.rt||0)*Math.PI/180,co=Math.cos(rt),si=Math.sin(rt),ox=W/2+(Math.max(-100,Math.min(100,+p.ox||0))/100)*w*g,oy=H/2+(Math.max(-100,Math.min(100,+p.oy||0))/100)*h*g,lim=Math.max(w,h)*g;
 let k=0;const put=(lx,ly,o,sz)=>{const x=ox+lx*co-ly*si,y=oy+lx*si+ly*co;if(x<-lim||x>W+lim||y<-lim||y>H+lim)return;pts.push([x,y]);rot.push((o.r||0)+(+p.rt||0));flip.push(o.f||1);cls.push(o.c==null?k:o.c);size.push(sz||S);gap.push(!!o.gap);k++};
 for(let j=-nj;j<=nj;j++)for(let i=-ni;i<=ni;i++){const lx=i*a[0]+j*b[0],ly=i*a[1]+j*b[1];if(Math.hypot(lx,ly)>R)continue;put(lx,ly,fn(i,j));
  // Octagons and squares: the small square between four octagons takes the second source (left empty with one source) (a regular octagon's side is its width / (1 + √2))
  if(sh=='oct'&&ar=='octsq'){const s=w/(1+Math.SQRT2);put(lx+a[0]/2+b[0]/2,ly+a[1]/2+b[1]/2,{r:45,c:1,gap:1},s*Math.SQRT2)}}
 return{pts,rot,flip,cls,size,gap,shape:sh,arr:ar,box:{w:B.w,h:B.h}}}
export {TL_AR,TL_TS,tlArr,tlPts,tlShape};
