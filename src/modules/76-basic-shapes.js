import {N} from './04-canvas-and-stamp-outlines.js';
import {CATS} from './05-motif-data.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';

// ===== Basic shapes (2.31.0, owner Oct 23 2026: "getting rid of the shapes all together and making motifs more flexible"). The Shape element is gone; its plain geometric
// shapes are the motif set "Basic shapes" (made by tools/basic-shapes.mjs, the last set of src/data/shapes.js, shown first in the library). They are ordinary motifs:
// fill, picture, outline and stretch work on every motif. What only a basic shape can do is be walked: Map to shape follows the outline of a basic-shape motif, so its
// geometry is kept here, by name, in the motif's own box (w by h, middle at 0,0).
const BASIC_ID={'Rectangle':'rect','Rounded rectangle':'rrect','Oval':'ellipse','Triangle':'tri','Diamond':'dia','Pentagon':'pent','Hexagon':'hex','Star':'star','Arrow':'arrow','Heart':'heart','Line':'line'};
let BSK=null,BSKEY=null;   // motif key -> geometry id, geometry id -> motif key
function basicMap(){if(BSK)return;const c=(CATS||[]).find(x=>x.n=='Basic shapes');if(!c)return;BSK=new Map();BSKEY={};c.k.forEach(k=>{const id=BASIC_ID[N[+k.slice(1)]];if(id){BSK.set(k,id);BSKEY[id]=k}})}
// the geometry id of a motif key (null for any other motif), and the motif key of a geometry id
const basicSh=m=>{basicMap();return BSK&&BSK.get(m)||null};
const basicKey=id=>{basicMap();return BSK&&BSKEY[id]||null};
const sf=v=>(+v).toFixed(2);
// the outline of a basic shape in its box (w by h, middle at 0,0) as path data; the corner of the rounded rectangle and the points of the star are fixed, as in the motifs
function shGeom(p,w,h){const a=w/2,b=h/2,P=(pts)=>'M'+pts.map(q=>sf(q[0])+' '+sf(q[1])).join('L')+'Z',
 ngon=(n,a0)=>P(Array.from({length:n},(_,i)=>{const t=(a0+i*360/n)*Math.PI/180;return[a*Math.cos(t),b*Math.sin(t)]}));
 switch(basicSh(p.m)){
 case'ellipse':return`M${sf(-a)} 0A${sf(a)} ${sf(b)} 0 1 0 ${sf(a)} 0A${sf(a)} ${sf(b)} 0 1 0 ${sf(-a)} 0Z`;
 case'rrect':{const r=.18*Math.min(w,h);return`M${sf(-a+r)} ${sf(-b)}H${sf(a-r)}A${sf(r)} ${sf(r)} 0 0 1 ${sf(a)} ${sf(-b+r)}V${sf(b-r)}A${sf(r)} ${sf(r)} 0 0 1 ${sf(a-r)} ${sf(b)}H${sf(-a+r)}A${sf(r)} ${sf(r)} 0 0 1 ${sf(-a)} ${sf(b-r)}V${sf(-b+r)}A${sf(r)} ${sf(r)} 0 0 1 ${sf(-a+r)} ${sf(-b)}Z`}
 case'tri':return P([[0,-b],[a,b],[-a,b]]);
 case'dia':return P([[0,-b],[a,0],[0,b],[-a,0]]);
 case'pent':return ngon(5,-90);
 case'hex':return ngon(6,0);
 case'star':{const pts=[];for(let i=0;i<10;i++){const t=(-90+i*36)*Math.PI/180,k=i%2?.42:1;pts.push([a*k*Math.cos(t),b*k*Math.sin(t)])}return P(pts)}
 case'arrow':return P([[-a,-b*.36],[a*.1,-b*.36],[a*.1,-b],[a,0],[a*.1,b],[a*.1,b*.36],[-a,b*.36]]);
 case'heart':{const X=v=>sf(v*w),Y=v=>sf(v*h);return`M${X(0)} ${Y(.5)}C${X(-.55)} ${Y(.12)} ${X(-.5)} ${Y(-.36)} ${X(-.25)} ${Y(-.42)}C${X(-.1)} ${Y(-.45)} ${X(0)} ${Y(-.32)} ${X(0)} ${Y(-.2)}C${X(0)} ${Y(-.32)} ${X(.1)} ${Y(-.45)} ${X(.25)} ${Y(-.42)}C${X(.5)} ${Y(-.36)} ${X(.55)} ${Y(.12)} ${X(0)} ${Y(.5)}Z`}
 case'line':return`M${sf(-a)} 0L${sf(a)} 0`;
 case'rect':return P([[-a,-b],[a,-b],[a,b],[-a,b]]);
 default:return''}}
// a Line is walked as a line (open), every other basic shape round its outline
const shOpen=p=>basicSh(p.m)=='line';
const shBox=p=>{const s=Math.max(1,+p.s||100);return[s*(p.wx||1),s*(p.wy||1)]};

// the outline of a basic-shape motif as a polyline, walked clockwise as seen on the canvas: {pts, closed, L (its length), cum (length up to each point)}. local = true leaves it unmoved
// (middle at 0,0, not turned or flipped), for measuring. Text and Patterns mapped to a basic shape use it.
const SHF=new Map();
function shFlat(p,local){const[w,h]=shBox(p),d=shGeom(p,w,h);if(!d)return null;const f=+p.f||1,r=(+p.r||0)*Math.PI/180,x=+p.x||0,y=+p.y||0,key=d+'|'+(local?'l':[f,r,x,y].join());if(SHF.has(key))return SHF.get(key);
 const e=document.createElementNS('http://www.w3.org/2000/svg','path');e.setAttribute('d',d);let L=0;try{L=e.getTotalLength()}catch(x){}if(!(L>0))return null;
 const closed=!shOpen(p),N0=Math.max(48,Math.min(720,Math.round(L/(Math.max(CW,CH)/260)))),n=closed?N0:N0+1,c=Math.cos(r),sn=Math.sin(r);let pts=[];
 for(let i=0;i<n;i++){const q=e.getPointAtLength(L*i/N0);let lx=q.x,ly=q.y;if(local)pts.push([lx,ly]);else{lx*=f;pts.push([x+lx*c-ly*sn,y+lx*sn+ly*c])}}
 if(closed){let a=0;for(let i=0;i<n;i++){const u=pts[i],v=pts[(i+1)%n];a+=u[0]*v[1]-v[0]*u[1]}if(a<0)pts.reverse()}
 else if(!local&&f<0)pts.reverse();
 const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));let tot=cum[cum.length-1];if(closed)tot+=Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][1]-pts[pts.length-1][1]);
 const o={pts,closed,L:tot,cum};if(SHF.size>60)SHF.clear();SHF.set(key,o);return o}
function init76(){basicMap()}
export {init76,basicKey,basicSh,shBox,shGeom,shOpen,shFlat};
