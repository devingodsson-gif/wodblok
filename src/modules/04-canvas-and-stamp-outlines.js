import {kv} from '../platform/index.js';
import {$,WBS,mod} from './01-launch-and-version.js';
import {lyInkFill} from './32-layers-panel.js';
import {WADA_COLORS,WADA_COMBOS} from '../data/wada.js';
import {WADA_NAMES} from '../data/wada-names.js';
let SW=240,SH=240,CW=533,CH=800;
const fitD=([w,h],L)=>w>=h?[L,Math.round(L*h/w)]:[Math.round(L*w/h),L];
// Print cover (full wrap): back + spine + front, with bleed all round. Sizes in inches.
const TRIMS=[['5x8','5 × 8 in',5,8],['5.25x8','5.25 × 8 in',5.25,8],['5.5x8.5','5.5 × 8.5 in',5.5,8.5],['6x9','6 × 9 in',6,9],['6.14x9.21','6.14 × 9.21 in (Royal)',6.14,9.21],['6.69x9.61','6.69 × 9.61 in',6.69,9.61],['7x10','7 × 10 in',7,10],['7.5x9.25','7.5 × 9.25 in',7.5,9.25],['8x10','8 × 10 in',8,10],['8.25x8.25','8.25 × 8.25 in',8.25,8.25],['8.5x8.5','8.5 × 8.5 in',8.5,8.5],['8.5x11','8.5 × 11 in (Letter)',8.5,11],['8.27x11.69','8.27 × 11.69 in (A4)',8.27,11.69],['custom','Custom size']];
// spine width per page (Amazon KDP paperback figures)
const PAPER={white:['White paper',.002252],cream:['Cream paper',.0025],color:['Standard colour',.002252],premium:['Premium colour',.002347]};
const bk=()=>{const t=TRIMS.find(x=>x[0]==WBS.book.trim&&x[2]),tw=t?t[2]:Math.min(20,Math.max(1,+WBS.book.tw||6)),th=t?t[3]:Math.min(20,Math.max(1,+WBS.book.th||9)),
sw=WBS.book.man?Math.min(4,Math.max(0,+WBS.book.sw||0)):Math.max(0,(+WBS.book.pages||0)*(PAPER[WBS.book.paper]||PAPER.white)[1]),b=Math.min(1,Math.max(0,+WBS.book.bleed||0));return{tw,th,sw,b,W:2*b+2*tw+sw,H:2*b+th}};
// Stamp outline: SK = 'rect' | 'hex' | 'circle'; HO = hex orientation 'p' (pointy top) | 'f' (flat top).
// Rect and hex stamps tile seamlessly: motifs wrap across the edges (hex uses the honeycomb lattice). Circles just trim.
let SK='rect',HO='p',HL=[],HN=[],OFFS=[[0,0]],CRAD=0;
// Every stamp has its own outline: t.sh={k shape, o hex orientation, s [w,h] proportions, z size %}.
// geom() turns one into stamp-space measurements; useT(t) makes that stamp "current" for the shape code below
// (SW, SH, SK, HO, HL, HN, OFFS, wrapP, shp). Anything that switches to another stamp switches back to tiles[cur].
const ORN=['arch','oct','star','quat','lancet'],SHK=['rect','hex','circle','diamond','tri',...ORN];let GC; // ORN: single ornaments that trim motifs like a circle does and sit on the packed-circle layouts
function geom(sh){sh=sh||{};const k=SHK.includes(sh.k)?sh.k:'rect',o=sh.o=='f'?'f':'p',s=Array.isArray(sh.s)&&sh.s[0]>0&&sh.s[1]>0?sh.s:[1,1],rad=Math.max(0,Math.min(100,Math.round(+sh.rad||0))),key=k+o+s[0]+':'+s[1]+'r'+rad;let g=GC.get(key);if(g)return g;
let SW,SH,HL=[],HN=[],OFFS=[[0,0]];
if(k=='hex'){const R=120,s3=Math.sqrt(3);[SW,SH]=o=='p'?[R*s3,2*R]:[2*R,R*s3];HL=o=='p'?[[R*s3,0],[R*s3/2,1.5*R]]:[[1.5*R,R*s3/2],[0,R*s3]];
const[a,b]=HL;HN=[a,b,[b[0]-a[0],b[1]-a[1]]].flatMap(v=>[v,[-v[0],-v[1]]]);OFFS=[[0,0],...HN]}
else if(k=='tri'){SW=240;SH=+(120*Math.sqrt(3)).toFixed(3)}
else if(k=='diamond'){[SW,SH]=fitD(s,240);HL=[[SW/2,SH/2],[-SW/2,SH/2]];const[a,b]=HL;HN=[a,b,[b[0]-a[0],b[1]-a[1]]].flatMap(v=>[v,[-v[0],-v[1]]]);const ab=[a[0]+b[0],a[1]+b[1]];OFFS=[[0,0],...HN,ab,[-ab[0],-ab[1]]]}
else{[SW,SH]=fitD(s,240);if(k=='rect')OFFS=[-1,0,1].flatMap(a=>[-1,0,1].map(b=>[a*SW,b*SH]))}
g={SK:k,HO:o,SW,SH,HL,HN,OFFS,RAD:rad};GC.set(key,g);return g}
const useG=g=>{SK=g.SK;HO=g.HO;SW=g.SW;SH=g.SH;HL=g.HL;HN=g.HN;OFFS=g.OFFS;CRAD=g.RAD||0};
const shOf=t=>{if(!t.sh||typeof t.sh!='object')t.sh={k:SHK.includes(WBS.dim.k)?WBS.dim.k:'rect',o:WBS.dim.o=='f'?'f':'p',s:[...(WBS.dim.s||[1,1])],z:100};return t.sh};
const useT=t=>{if(t)useG(geom(shOf(t)))};
const SHN={rect:'Rectangle',hex:'Hexagon',circle:'Circle',diamond:'Diamond',tri:'Triangle',arch:'Arch',oct:'Octagon',star:'Star',quat:'Quatrefoil',lancet:'Lancet'};
// Repeat tile canvas (dim.rt): a rectangle whose edges wrap, so copies placed side by side show no seam. The content is drawn a little past
// each edge (tileExt) so filters see the neighbouring tile, and a whole 3 x 3 when the repeat preview is on (WBS.tilePv).
const tileOn=()=>!!WBS.dim.rt&&!WBS.book.on;
const tileExt=()=>tileOn()?(WBS.tilePv?[CW,CH]:[Math.min(CW,48),Math.min(CH,48)]):[0,0];
const setDim=()=>{if(WBS.dim.rt&&WBS.dim.cs)delete WBS.dim.cs;if(WBS.dim.cs&&!CSN[WBS.dim.cs]){delete WBS.dim.cs;delete WBS.dim.g}if(WBS.dim.cp)delete WBS.dim.cp;useG(geom(WBS.dim));try{useT(WBS.tiles[WBS.cur])}catch(e){}
if(WBS.book.on){const g=bk();if(g.W>=g.H){CW=1000;CH=+(1000*g.H/g.W).toFixed(3)}else{CH=1000;CW=+(1000*g.W/g.H).toFixed(3)}}else[CW,CH]=csDims(csk())};
// Canvas outline: dim.cs = rect (default) | rrect | circle | oval | arch | hex | tri | diamond | ngon.
// Everything is clipped to the outline. dim.cr = rounded corner %, dim.n = polygon sides, dim.co = 'f' for the flat orientation.
// Print covers always stay rectangular.
const CSH=[['rect','Rectangle'],['rrect','Rounded'],['circle','Circle'],['oval','Oval'],['arch','Arch'],['hex','Hexagon'],['tri','Triangle'],['diamond','Diamond'],['ngon','Polygon']];let CSN;const CASP=['rect','rrect','oval','arch','diamond'];
function csk(){if(WBS.book.on)return'rect';const k=WBS.dim.cs;return CSN[k]?k:'rect'}
const hasOut=()=>csk()!='rect';
const csN=()=>Math.max(3,Math.min(16,Math.round(+WBS.dim.n||5)));
function polyUnit(n,o){const off=o=='f'?Math.PI/n:0,P=[];for(let i=0;i<n;i++){const a=-Math.PI/2+off+2*Math.PI*i/n;P.push([Math.cos(a),Math.sin(a)])}return P}
function polyFit(n,o){const P=polyUnit(n,o),xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),x0=Math.min(...xs),y0=Math.min(...ys),bw=Math.max(...xs)-x0,bh=Math.max(...ys)-y0,k=800/Math.max(bw,bh);return{W:+(bw*k).toFixed(3),H:+(bh*k).toFixed(3),pts:P.map(p=>[(p[0]-x0)*k,(p[1]-y0)*k])}}
function csDims(k){if(k=='circle')return[800,800];if(k=='hex'||k=='tri'||k=='ngon'){const q=polyFit(k=='hex'?6:k=='tri'?3:csN(),WBS.dim.co);return[q.W,q.H]}return fitD(WBS.dim.c,800)}
const polyArea=P=>{let a=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1]}return a/2};
// Inset a closed outline by d (mitred corners). Needs the points to run clockwise on screen; returns null once it collapses.
function offPoly(P,d){const m=P.length;if(m<3)return null;const N=[];for(let i=0;i<m;i++){const a=P[i],b=P[(i+1)%m],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1e-9;N.push([-dy/L,dx/L])}
const R=[];for(let i=0;i<m;i++){const n1=N[(i+m-1)%m],n2=N[i],k=1+n1[0]*n2[0]+n1[1]*n2[1],c=d/Math.max(k,.15);R.push([P[i][0]+(n1[0]+n2[0])*c,P[i][1]+(n1[1]+n2[1])*c])}
return polyArea(R)>0?R:null}
// The outline of the canvas: d (SVG path), pts (clockwise polyline), keys (indices of the corner / marker points), vk (true when the keys are the real corners of a polygon)
function cOut(){const k=csk(),W=CW,H=CH,fm=v=>+(+v).toFixed(2),poly=P=>'M'+P.map(p=>fm(p[0])+' '+fm(p[1])).join('L')+'Z';let pts=[],keys=[],vk=false,d='';
if(k=='circle'||k=='oval'){const rx=W/2,ry=H/2,N=160;for(let i=0;i<N;i++){const a=-Math.PI/2+2*Math.PI*i/N;pts.push([rx+rx*Math.cos(a),ry+ry*Math.sin(a)])}keys=[0,N/4,N/2,3*N/4];d=`M${fm(rx)} 0A${fm(rx)} ${fm(ry)} 0 1 1 ${fm(rx)} ${fm(H)}A${fm(rx)} ${fm(ry)} 0 1 1 ${fm(rx)} 0Z`}
else if(k=='rrect'){const r=Math.min(W,H)/2*Math.max(0,Math.min(100,WBS.dim.cr==null?25:+WBS.dim.cr))/100;
if(r<.5){pts=[[0,0],[W,0],[W,H],[0,H]];keys=[0,1,2,3];vk=true;d=poly(pts)}
else{const M=10;[[W-r,r,-90],[W-r,H-r,0],[r,H-r,90],[r,r,180]].forEach(([cx,cy,a0],ci)=>{for(let j=0;j<=M;j++){const a=(a0+90*j/M)*Math.PI/180;pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}keys.push(ci*(M+1)+M/2)});
const q=fm(r);d=`M${q} 0H${fm(W-r)}A${q} ${q} 0 0 1 ${fm(W)} ${q}V${fm(H-r)}A${q} ${q} 0 0 1 ${fm(W-r)} ${fm(H)}H${q}A${q} ${q} 0 0 1 0 ${fm(H-r)}V${q}A${q} ${q} 0 0 1 ${q} 0Z`}}
else if(k=='arch'){const rx=W/2,ry=Math.min(rx,H*.8);pts.push([0,H],[0,ry]);for(let j=1;j<=28;j++){const a=Math.PI+Math.PI*j/28;pts.push([rx+rx*Math.cos(a),ry+ry*Math.sin(a)])}pts.push([W,H]);keys=[0,15,pts.length-1];d=`M0 ${fm(H)}V${fm(ry)}A${fm(rx)} ${fm(ry)} 0 0 1 ${fm(W)} ${fm(ry)}V${fm(H)}Z`}
else if(k=='hex'||k=='tri'||k=='ngon'){pts=polyFit(k=='hex'?6:k=='tri'?3:csN(),WBS.dim.co).pts;keys=pts.map((_,i)=>i);vk=true;d=poly(pts)}
else if(k=='diamond'){pts=[[W/2,0],[W,H/2],[W/2,H],[0,H/2]];keys=[0,1,2,3];vk=true;d=poly(pts)}
else{pts=[[0,0],[W,0],[W,H],[0,H]];keys=[0,1,2,3];vk=true;d=poly(pts)}
return{d,pts,keys,vk}}

function inShape(x,y){if(!hasOut())return true;const P=cOut().pts;let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function wrapP(x,y){if(SK=='rect')return[mod(x,SW),mod(y,SH)];if(SK=='circle'||SK=='tri'||ORN.includes(SK))return[x,y];
const[a,b]=HL,dx=x-SW/2,dy=y-SH/2,det=a[0]*b[1]-a[1]*b[0],u=Math.round((dx*b[1]-dy*b[0])/det),v=Math.round((a[0]*dy-a[1]*dx)/det);
let px=x-u*a[0]-v*b[0],py=y-u*a[1]-v*b[1];for(let k=0;k<2;k++){let best=null,bd=(px-SW/2)**2+(py-SH/2)**2;HN.forEach(n=>{const d=(px-n[0]-SW/2)**2+(py-n[1]-SH/2)**2;if(d<bd-1e-9){bd=d;best=n}});if(!best)break;px-=best[0];py-=best[1]}
return[px,py]}
// Outline path of the stamp, inset by e
// Outline of an ornament stamp (points, inset by e). All are drawn inside the stamp box, so the usual proportions control applies.
function ornPts(e){const x0=e,y0=e,x1=SW-e,y1=SH-e,w=Math.max(1,x1-x0),h=Math.max(1,y1-y0),cx=SW/2,cy=SH/2,P=[];
if(SK=='arch'){const ry=Math.min(w/2,h*.8),ay=y0+ry;P.push([x0,y1],[x0,ay]);for(let i=1;i<=28;i++){const a=Math.PI+Math.PI*i/28;P.push([cx+w/2*Math.cos(a),ay+ry*Math.sin(a)])}P.push([x1,y1])}
else if(SK=='oct'){const c=Math.min(w,h)*.29;P.push([x0+c,y0],[x1-c,y0],[x1,y0+c],[x1,y1-c],[x1-c,y1],[x0+c,y1],[x0,y1-c],[x0,y0+c])}
else if(SK=='star'){for(let i=0;i<16;i++){const a=(-90+22.5*i)*Math.PI/180,k=i%2?.62:1;P.push([cx+w/2*k*Math.cos(a),cy+h/2*k*Math.sin(a)])}}
else if(SK=='quat'){const d=.22,r=.28,C=[[d,0],[-d,0],[0,d],[0,-d]];for(let i=0;i<80;i++){const a=i/80*2*Math.PI,ux=Math.cos(a),uy=Math.sin(a);let t=0;C.forEach(([px,py])=>{const b=ux*px+uy*py,q=b*b-(px*px+py*py-r*r);if(q>=0)t=Math.max(t,b+Math.sqrt(q))});P.push([cx+t*ux*w,cy+t*uy*h])}}
else if(SK=='lancet'){const sy=y0+.52*h,B=(p0,p1,p2,p3,t)=>{const u=1-t;return[u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]]};
 P.push([x0,y1],[x0,sy]);const L=[[x0,sy],[x0,y0+.26*h],[cx-.13*w,y0+.12*h],[cx,y0]];for(let i=1;i<=14;i++)P.push(B(...L,i/14));
 const R=[[cx,y0],[cx+.13*w,y0+.12*h],[x1,y0+.26*h],[x1,sy]];for(let i=1;i<=14;i++)P.push(B(...R,i/14));P.push([x1,y1])}
return P}
// Rounded corners: every corner of a closed polygon is cut with a curve that reaches up to the given radius.
function rpoly(P,r){const n=P.length,f=v=>(+v).toFixed(2);let d='';
for(let i=0;i<n;i++){const a=P[(i+n-1)%n],b=P[i],c=P[(i+1)%n],v1=[a[0]-b[0],a[1]-b[1]],v2=[c[0]-b[0],c[1]-b[1]],l1=Math.hypot(v1[0],v1[1])||1,l2=Math.hypot(v2[0],v2[1])||1;
const ang=Math.acos(Math.max(-1,Math.min(1,(v1[0]*v2[0]+v1[1]*v2[1])/(l1*l2))));let t=ang>.02&&ang<Math.PI-.02?r/Math.tan(ang/2):0;t=Math.min(t,l1/2,l2/2);
const p1=[b[0]+v1[0]/l1*t,b[1]+v1[1]/l1*t],p2=[b[0]+v2[0]/l2*t,b[1]+v2[1]/l2*t];d+=(i?'L':'M')+f(p1[0])+' '+f(p1[1])+'Q'+f(b[0])+' '+f(b[1])+' '+f(p2[0])+' '+f(p2[1])}
return d+'Z'}
// Outline path of the stamp, inset by e
function shp(e){const f=v=>(+v).toFixed(2);let P;
if(SK=='circle'){const rx=SW/2-e,ry=SH/2-e;return`M${f(e)} ${f(SH/2)}A${f(rx)} ${f(ry)} 0 1 0 ${f(SW-e)} ${f(SH/2)}A${f(rx)} ${f(ry)} 0 1 0 ${f(e)} ${f(SH/2)}Z`}
if(SK=='diamond'){const A=SW/2,B=SH/2,h=Math.hypot(A,B),dx=e*h/B,dy=e*h/A;P=[[A,dy],[SW-dx,B],[A,SH-dy],[dx,B]]}
else if(SK=='tri'){const r=SH/3,cx=SW/2,cy=SH*2/3,k=Math.max(0,(r-e)/r);P=[[SW/2,0],[SW,SH],[0,SH]].map(([x,y])=>[cx+(x-cx)*k,cy+(y-cy)*k])}
else if(SK=='hex'){const r=120-e*2/Math.sqrt(3),a0=HO=='p'?-90:0;P=[0,1,2,3,4,5].map(k=>[SW/2+r*Math.cos((a0+60*k)*Math.PI/180),SH/2+r*Math.sin((a0+60*k)*Math.PI/180)])}
else if(ORN.includes(SK))P=ornPts(e);
else P=[[e,e],[SW-e,e],[SW-e,SH-e],[e,SH-e]];
return CRAD>0?rpoly(P,CRAD/100*Math.min(SW,SH)/2):'M'+P.map(p=>f(p[0])+' '+f(p[1])).join('L')+'Z'}
// The old 50 two-colour palettes. They are no longer shown: their colour names are kept only so older saved files still resolve (see LEG below).
// The colour library is now the Wada colours in src/data/wada.js, sorted by hue.
const PAL50=[["Lady Chapel", "Marian Blue", "#1e4fa3", "Lily White", "#f6f3ea"], ["Monk's Ledger", "Abbey Black", "#1f1b18", "Bone Vellum", "#efe6d2"], ["King's Seal", "Sealing Wax", "#b3261e", "Linen Parchment", "#f3ead8"], ["Abbot's Garden", "Rue Green", "#2f6b3a", "Pale Straw", "#f0e3b0"], ["Rosewater Hall", "Damask Crimson", "#8f1d3a", "Rosewater", "#f6d9d5"], ["Frost Fair", "Winter Navy", "#17325c", "Hoarfrost", "#dde9ef"], ["Mead Hall", "Old Bronze", "#6b4a1e", "Honeycomb", "#f2cc6b"], ["Herbwife", "Nightshade", "#4b2a5e", "Sage Leaf", "#c9d6b0"], ["Tourney Field", "Herald Red", "#c4302b", "Daffodil", "#f4d23c"], ["Cloister Mint", "Deep Juniper", "#1d4a3c", "Mint Cordial", "#cfe8d6"], ["Lavender Hours", "Bishop Purple", "#4a2370", "Lavender Milk", "#e4dcef"], ["Saffron Market", "Cinnamon", "#8a3a17", "Saffron Cream", "#f7e2a8"], ["Pilgrim Shell", "Seaward Teal", "#13646b", "Scallop Pink", "#f3d6c4"], ["Apothecary", "Copper Kettle", "#b45a24", "Chalk", "#f4f1ea"], ["Bluebell Wood", "Bluebell", "#4b55b8", "Primrose", "#f7efb8"], ["Unicorn Meadow", "Clover", "#3f8a3a", "Hawthorn Blossom", "#f9e9ec"], ["Ink and Ash", "Gallnut Ink", "#2b2a33", "Ash Grey", "#d8d6d0"], ["Royal Decree", "Purple Seal", "#6a1b5f", "Gilded Cream", "#f1e2b6"], ["Harvest Moon", "Ember Brown", "#3b1f12", "Harvest Orange", "#e08a2e"], ["Dragon's Hoard", "Dragon Green", "#123f2e", "Hoard Gold", "#d9a521"], ["Weald Oak", "Acorn Cap", "#f1e3c2", "Oak Moss", "#6f7a3a"], ["Tilers' Yard", "Kiln White", "#f7efe2", "Terracotta", "#b8532f"], ["Fen Mist", "Peat Black", "#1d2422", "Fen Sage", "#8fa58a"], ["Rose Briar", "Thorn Green", "#1e3b2b", "Briar Rose", "#d97c86"], ["Falconer", "Jess Leather", "#3d2617", "Falcon Tan", "#c79a64"], ["Tidewater", "Sea Foam", "#e6f2ea", "Harbour Teal", "#2b7a78"], ["Mustard Seed", "Oxblood", "#5b1620", "Mustard Field", "#d6a72c"], ["Duskbell", "Candle Glow", "#f6d98a", "Dusk Violet", "#5d4a8a"], ["Slate Roof", "Tallow", "#efe5cc", "Slate", "#4f5b66"], ["Coral Reliquary", "Reliquary Navy", "#1b2a4a", "Coral Enamel", "#e8775a"], ["Turquoise Chalice", "Chalice Gold", "#f6cf5e", "Turquoise", "#16797d"], ["Woad Dyer", "Weld Yellow", "#f1d54a", "Woad", "#3a5a9a"], ["Night Vigil", "Vigil Candle", "#f4c95d", "Midnight Vault", "#141b33"], ["Blood Moon", "Moon Ivory", "#f3e6cf", "Blood Red", "#7d1416"], ["Forest Hunt", "Stag Cream", "#eadcb8", "Sherwood", "#1f3a26"], ["Black Prince", "Prince Gold", "#d9b04a", "Sable", "#161514"], ["Plum Wine", "Rose Hip", "#f08a7e", "Mulled Plum", "#3e1631"], ["Kingfisher", "Kingfisher Orange", "#f08a2b", "Kingfisher Blue", "#0f3f63"], ["Mossy Crypt", "Lichen Glow", "#b9d36e", "Crypt Stone", "#262a2b"], ["Ermine", "Ermine White", "#f7f4ee", "Ermine Black", "#2a2630"], ["Cardinal", "Cardinal Pink", "#f2b8c0", "Cardinal Red", "#9b1b30"], ["Witch Hazel", "Hazel Flower", "#f2c43d", "Witch Brown", "#3a2416"], ["Holly King", "Holly Berry", "#e0303a", "Holly Leaf", "#18412c"], ["Starry Chancel", "Star Silver", "#d7dde3", "Chancel Blue", "#203f80"], ["Ember Forge", "Forge Spark", "#ff9a3c", "Anvil Iron", "#2a2c31"], ["Velvet Throne", "Throne Gold", "#e6b84a", "Royal Velvet", "#4a1452"], ["Peacock Court", "Peacock Plume", "#4fb3a5", "Peacock Night", "#102a3a"], ["Rust and Verdigris", "Verdigris", "#5fb39c", "Rust", "#7a3015"], ["Owl Light", "Owl Amber", "#e7a43c", "Owl Grey", "#4a4640"], ["Jester's Motley", "Motley Green", "#2f8f4e", "Motley Yellow", "#f5d03b"]];
let LEG;
const hsl=h=>{const r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let H=0;if(d){H=mx==r?((g-b)/d)%6:mx==g?(b-r)/d+2:(r-g)/d+4;H*=60;if(H<0)H+=360}return[H,d?d/(1-Math.abs(2*l-1)):0,l]};
const C=[];
let CM;const col=n=>CM[n]||LEG[n]||'#888888';
// Old colour names (from saved projects) map to the closest new colour.
const fixC=(n,d)=>{if(!n||CM[n])return n||d;const h=LEG[n];if(!h)return d;const v=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const a=v(h);let best=d,bd=1e9;C.forEach(([nm,hx])=>{const b=v(hx),e=(a[0]-b[0])**2*.3+(a[1]-b[1])**2*.59+(a[2]-b[2])**2*.11;if(e<bd){bd=e;best=nm}});return best};
let PL;
const PCOL={ink:"Dark Tyrian Blue",bg:"Pale Lemon Yellow"};
const CC=[];
// The project palette: slots 1 to 4 are proj.bg (paper), proj.ink, proj.c3, proj.c4. The 3rd and 4th are optional and absent from the document when empty.
const PSLOT=['bg','ink','c3','c4'];
const projSet=(k,v)=>{if(v)WBS.proj[k]=v;else delete WBS.proj[k]};
const projCols=()=>PSLOT.map(k=>WBS.proj[k]).filter(Boolean);
const saveCC=()=>{try{kv.set('wb7_colors',JSON.stringify(C.filter(c=>CC.includes(c[0]))))}catch(e){}};
// Open popups are lifted to the top of the page and placed against their button, so no panel, floating window,
// scrolling area or the phone-width header (which scrolls sideways) can clip them or draw over them.
// A small "..." menu for one row of a list: items are [label, action, disabled]. It opens next to the button, closes when you choose, click elsewhere or press Esc, and the items are real buttons (Tab and Enter work).
let ROWM=null;
function closeRowMenu(){if(ROWM){if(ROWM.btn)ROWM.btn.setAttribute('aria-expanded','false');ROWM.remove();ROWM=null}}
function rowMenu(btn,items){const was=ROWM&&ROWM.btn===btn;closeRowMenu();if(was)return;const m=document.createElement('div');m.className='ddl rowm';m.dataset.w='150';m.setAttribute('role','menu');
 m.innerHTML=items.map(([t,,off],i)=>`<button type="button" class="ddi" role="menuitem" data-i="${i}"${off?' disabled':''}><span>${t}</span></button>`).join('');
 document.body.appendChild(m);placeFloat(m,btn,true);m.btn=btn;ROWM=m;btn.setAttribute('aria-expanded','true');
 m.onclick=e=>{const b=e.target.closest('[data-i]');if(!b||b.disabled)return;const f=items[+b.dataset.i][1];closeRowMenu();f()};
 m.onkeydown=e=>{if(e.key=='Escape'){e.stopPropagation();const b=m.btn;closeRowMenu();b.focus()}else if(e.key=='ArrowDown'||e.key=='ArrowUp'){e.preventDefault();const bs=[...m.querySelectorAll('button:not(:disabled)')],i=bs.indexOf(document.activeElement);bs[(i+(e.key=='ArrowDown'?1:-1)+bs.length)%bs.length].focus()}};
 const f=m.querySelector('button:not(:disabled)');if(f)f.focus()}
document.addEventListener('pointerdown',e=>{if(ROWM&&!e.target.closest('.rowm,[data-more]'))closeRowMenu()},true);
addEventListener('scroll',e=>{if(ROWM&&!(e.target.closest&&e.target.closest('.rowm')))closeRowMenu()},true);
function placeFloat(el,a,right,cap){if(el.parentNode!==document.body)document.body.appendChild(el);el.classList.add('fx');el.style.maxHeight='';el.style.width='';
const r=a.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,g=4,pad=8;
if(el.classList.contains('ddl'))el.style.width=Math.min(vw-2*pad,Math.max(r.width,+el.dataset.w||180))+'px';
const h=Math.min(el.scrollHeight+2,cap||1e9),below=vh-r.bottom-g-pad,above=r.top-g-pad;
let top;if(h<=below||below>=above){top=r.bottom+g;el.style.maxHeight=Math.max(120,Math.min(h,below))+'px'}
else{const mh=Math.min(h,above);el.style.maxHeight=mh+'px';top=r.top-g-mh}
const w=el.offsetWidth;let left=right?r.right-w:r.left;left=Math.max(pad,Math.min(left,vw-w-pad));
el.style.left=left+'px';el.style.top=top+'px'}
const DD={},DDset={},esc=x=>String(x).replace(/&/g,'&amp;'),closeDD=()=>document.querySelectorAll('.ddl').forEach(l=>l.hidden=true);
function mkdd(id,items){const sel=$(id),w=document.createElement('div');w.className='dd';
w.innerHTML='<button type="button" class="ddb"></button><div class="ddl" hidden></div>';sel.after(w);sel.style.display='none';
const b=w.firstChild,l=w.lastChild;let last;
const fill=()=>{l.innerHTML=items.map(o=>`<div class="ddi" data-v="${o.v}">${o.h}</div>`).join('')};fill();
b.onclick=e=>{e.stopPropagation();const open=l.hidden;closeDD();if(typeof closeMenus=='function')closeMenus();l.hidden=!open;if(open){placeFloat(l,b,false,300);const c=l.querySelector('.cur');if(c)l.scrollTop=c.offsetTop-(l.clientHeight-c.offsetHeight)/2}};
l.onclick=e=>{const i=e.target.closest('.ddi');if(!i)return;sel.value=i.dataset.v;l.hidden=true;last=undefined;DD[id]();sel.dispatchEvent(new Event('input'))};
DD[id]=()=>{if(sel.value===last)return;last=sel.value;const o=items.find(o=>String(o.v)==sel.value)||items[0];b.innerHTML=o.h+'<em>▾</em>';l.querySelectorAll('.ddi').forEach(i=>i.classList.toggle('cur',i.dataset.v==sel.value))}
DDset[id]=n=>{items=n;fill();last=undefined;DD[id]()}}
const cItem=([n,h])=>({v:n,h:`<span class="chip" style="background:${h}"></span>${esc(n)}`});
const noneItem={v:'',h:'<span class="chip" style="border-style:dashed"></span>None'};
const defItem={v:'',h:'<span class="chip" style="border-style:dashed"></span>Project default'};
function paintColors(){const OPT=C.map(([n])=>`<option>${esc(n)}</option>`).join('');
$('pI').innerHTML=$('pB').innerHTML=OPT;$('p3').innerHTML=$('p4').innerHTML='<option value="">None</option>'+OPT;$('stI').innerHTML='<option value="">Project default</option>'+OPT;
DDset.pI(C.map(cItem));DDset.pB(C.map(cItem));DDset.p3([noneItem,...C.map(cItem)]);DDset.p4([noneItem,...C.map(cItem)]);DDset.stI([defItem,...C.map(cItem)]);if(window.lyInkOn)lyInkFill();
$('cl').innerHTML='<button id="addC" title="Add a colour"><i class="plus">+</i><span>Add colour</span></button>'+C.map(([n,h])=>`<button data-c="${esc(n)}" title="${esc(n)}"${CC.includes(n)?' class="cust"':''}><i style="background:${h}"></i><span>${esc(n)}</span></button>`).join('');
$('cth').textContent='Colour library ('+C.length+')'}
const N=[],M=[];
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const tk=s=>(c,b)=>s.split('FILL').join(c).split('CUT').join(b);
function init04(){// Stamp is SW x SH units (long side 240); canvas is CW x CH units (long side 800). Ratios live in dim.
WBS.dim={s:[1,1],c:[2,3]};
try{const d=JSON.parse(kv.get('wb14_dim')||'null');if(d&&d.s&&d.c)WBS.dim=d}catch(e){}
WBS.book={on:false,trim:'6x9',tw:6,th:9,pages:200,paper:'white',man:false,sw:.45,bleed:.125,gd:true};
try{const q=JSON.parse(kv.get('wb40_book')||'null');if(q&&typeof q=='object')WBS.book={...WBS.book,...q}}catch(e){}
GC=new Map();
CSN=Object.fromEntries(CSH);
setDim();
LEG=Object.fromEntries([
["Vermilion","#d13b26"],["Minium","#dc5a2c"],["Cinnabar","#b83a2e"],["Kermes Crimson","#9d1c2e"],["Madder Lake","#b23a48"],["Brazilwood Red","#a5342f"],["Lac Scarlet","#c1272d"],["Dragon's Blood","#7f1d1d"],["Oxblood Ink","#5a1f2a"],["Rubric Red","#c0392b"],["Sinopia","#8f3b2a"],["Carmine Rose","#c76b7c"],["Cardinal Wine","#6d1a2c"],["Armenian Bole","#9c3f2c"],
["Orpiment","#e6a91a"],["Realgar","#d9691f"],["Saffron","#eea11d"],["Weld Yellow","#d7b52c"],["Yellow Ochre","#c99a3b"],["Buckthorn Yellow","#c8b23a"],["Shell Gold","#d4a94a"],["Burnished Gold","#b8902f"],["Honey Wax","#d9b96a"],["Amber Resin","#b8741a"],["Mosaic Gold","#c9a227"],["Lead-Tin Yellow","#e0c34a"],["Gold Leaf","#e2b93b"],["Ochre Gold","#bf8f2e"],
["Verdigris","#3f8f7b"],["Malachite","#2f7a55"],["Terre Verte","#8a9d7b"],["Sap Green","#5b7a2c"],["Folium Green","#4b6b3a"],["Copper Resinate","#1f5a3c"],["Bice Green","#4f8a5a"],["Olive Leaf","#6b6b2c"],["Sage Glaze","#a9b790"],["Cloister Green","#3e5c47"],["Cypress","#2c4a3a"],["Lichen","#a3ad83"],["Emerald Glaze","#1f6f4f"],["Fern Wash","#4a6a2f"],
["Lapis Lazuli","#2a4a9e"],["Ultramarine Deep","#1b2f7a"],["Azurite","#2f6aa8"],["Indigo Vat","#2b3a67"],["Woad Blue","#3d5a80"],["Turnsole Blue","#5f7fc0"],["Smalt","#56728f"],["Sky Azure","#7fa8d1"],["Bice Blue","#8fa8c4"],["Mantle Blue","#3a58b0"],["Night Vault","#14213d"],["Cloister Teal","#173a3f"],["Turquoise Enamel","#4a9a94"],["Peacock Blue","#1f6b7a"],["Pewter Blue","#9fb0c3"],["Chartres Blue","#1c4f8c"],
["Tyrian Purple","#6a1b4d"],["Folium Violet","#6d4c8f"],["Orchil","#7a4a7c"],["Imperial Plum","#5a3a6a"],["Mulberry Ink","#4a2340"],["Heather Mauve","#8a6a9a"],["Amethyst","#7b5ea7"],["Bishop's Violet","#58306e"],["Lilac Wash","#b9a3c9"],["Damson","#4b1f3b"],
["Raw Umber","#6b4a2b"],["Burnt Umber","#4a2f1b"],["Sepia Ink","#3d2b1f"],["Iron-Gall Ink","#2b2118"],["Bistre","#4d3b2a"],["Tuscan Terracotta","#c8694a"],["Copper Glaze","#b5642f"],["Tawny Vellum","#c9a66b"],["Cordovan","#6b3528"],["Walnut Stain","#5a3e2b"],["Forge Rust","#7a2f14"],["Chestnut","#7b4a2d"],["Raw Sienna","#b5763a"],["Red Ochre","#a44a2f"],
["Lead White","#f0ebe0"],["Ivory Leaf","#e8dcc0"],["Calf Vellum","#efe3c8"],["Aged Parchment","#e6d7b5"],["Chalk Gesso","#f3eee2"],["Ivory Black","#1a1a1a"],["Lampblack","#181513"],["Vine Black","#22201c"],["Charcoal Wash","#3b3936"],["Tarnished Silver","#a7a9a4"],["Ash Wash","#8d8a82"],["Dove Grey","#b9b4a8"],["Lead Grey","#6e7175"],
["Flesh Tint","#e3b59a"],["Rose Madder Wash","#d98a8f"],["Verdaccio","#6f7a5a"],["Silver Leaf","#c3c7ca"],["Vellum Shadow","#cbb78f"]]);
Object.assign(LEG,{"Winchester Lapis": "#2f4f9a", "Wilton Ultramarine": "#23347a", "Arena Star Gold": "#e0c070", "Maestà Madder": "#8c2b2f", "Limbourg Azure": "#2e5aa8", "Ghent Green Velvet": "#2c4a2f", "Bayeux Woad": "#3f5a6e", "Bayeux Madder": "#9c4a35", "Scivias Gold": "#d7a93f", "Angelico Rose": "#a85a5c", "Cimabue Vermilion": "#b8402a", "Icon Gold": "#d4a94e", "Tessera Gold": "#cfa54a", "Mausoleum Stars": "#e8d9a8", "Sienese Umber": "#5a3b27", "Kells Orpiment": "#e2b23a", "Lindisfarne Red Lead": "#c65a2e", "Millefleur Cream": "#eadfbf", "Tapestry Blush": "#ecccb4", "Grisaille Grey": "#55565a", "Chapelle Ruby": "#c84050", "Chartres Blue": "#2c5aa0", "Albans Green": "#3d6b4a", "Beatus Vermilion": "#b8382a", "Utrecht Bistre": "#4a3726", "Aureus Gold": "#d9b45a", "Rossano Silver": "#cdc9bf", "Ebbo Sepia": "#5c3d22", "Assisi Terracotta": "#a9563a", "Verdaccio": "#5c6448", "Herbal Sap Green": "#4f6a2a", "Aberdeen Indigo": "#2a3558", "Ellesmere Rubric": "#a4342c", "Luttrell Ochre": "#c99a48", "Macclesfield Rose": "#a8485e", "Evreux Blue": "#3f6299", "Cistercian Stone": "#6e6656", "Taüll Black": "#23201d", "Pantocrator Red": "#a8352a", "Palatina Turquoise": "#2a6f6c", "Deesis Gold": "#d6b45f", "San Marco Gold": "#e0bd62", "Reichenau Leaf": "#93b07c", "Fouquet Azure": "#335d9a", "Angel Wing Blue": "#8aa6d0", "Heraldic Gules": "#b22a2a", "Heraldic Argent": "#ece9e1", "Heraldic Vert": "#5b9a5a", "Iron-Gall Ink": "#2a221b", "Cennini Ultramarine": "#1e3a8a", "Winchester Calf": "#f0e3c6", "Diptych Gold": "#d8b65e", "Scrovegni Vault": "#1f3e78", "Siena Gold Ground": "#dcbd77", "Book of Hours Vellum": "#f1e6cc", "Altar Linen": "#ece5d2", "Bayeux Linen": "#e3d6b4", "Unbleached Linen": "#ddd0ac", "Visionary Night": "#1d2440", "Convent Plaster": "#f0e7d8", "Tempera Gesso": "#f2ead6", "Maphorion Maroon": "#4f1c22", "San Vitale Green": "#1f4a3a", "Galla Placidia Blue": "#1b2c5e", "Fresco Ochre Wash": "#e9d2a0", "Kells Purple": "#4b2340", "Northumbrian Vellum": "#efe2c4", "Unicorn Madder": "#7a2a2a", "Cluny Vermilion": "#a53a2c", "Pucelle Vellum": "#f3ece0", "Leaded Dark": "#1a1c28", "Cathedral Limestone": "#e5ddc9", "Psalter Buff": "#ead8b0", "Beatus Saffron": "#eab53e", "Carolingian Parchment": "#e8dcbd", "Aureus Porphyry": "#3e1a2e", "Rossano Purple": "#5e2448", "Reims Gold Wash": "#e5cc8c", "Umbrian Plaster": "#efe1c8", "Flesh Ground": "#ecd2b8", "Herbarium Paper": "#ece2c2", "Bestiary Gilt": "#d9b867", "Ellesmere Vellum": "#f2e8d0", "Luttrell Green": "#2e4836", "Psalter Cream": "#f4ecda", "Evreux Blush": "#f1ddd6", "Whitewash": "#f5f1e8", "Taüll Ochre": "#d9a64a", "Romanesque White": "#f2ece0", "Byzantine Gold": "#e0be70", "Hagia Slate": "#2f3940", "Lagoon Teal": "#1d4a4f", "Ottonian Plum": "#3b2033", "Fouquet Gold Haze": "#e8d4a0", "Diptych Night": "#182447", "Heraldic Or": "#e3b84a", "Heraldic Azure": "#26478a", "Heraldic Sable": "#1e1d1b", "Scriptorium Parchment": "#ead9b6", "Gesso Sottile": "#f6f1e6"});PAL50.forEach(p=>{LEG[p[1]]=p[2];LEG[p[3]]=p[4]});WADA_COLORS.forEach(c=>C.push([c[0],c[1]]));
{const grp=h=>{const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255),ch=Math.max(...v)-Math.min(...v),l=hsl(h)[2];return l>=.78?1:ch>=.17?0:2};
C.sort((a,b)=>{const ga=grp(a[1]),gb=grp(b[1]),A=hsl(a[1]),B=hsl(b[1]);if(ga!=gb)return ga-gb;if(ga==2)return B[2]-A[2];const ha=Math.floor(((A[0]+12)%360)/24),hb=Math.floor(((B[0]+12)%360)/24);return ha-hb||B[2]-A[2]})}
CM=Object.fromEntries(C);
PL=WADA_COMBOS.map((cb,i)=>{const cs=cb.map(j=>WADA_COLORS[j]).sort((a,b)=>hsl(a[1])[2]-hsl(b[1])[2]);const mid=cs.slice(1,-1).reverse();return[WADA_NAMES[i]||'No. '+(i+1),cs[0][0],cs[cs.length-1][0],mid[0]?mid[0][0]:'',mid[1]?mid[1][0]:'']});WBS.proj={...PCOL};try{JSON.parse(kv.get('wb7_colors')||'[]').forEach(([n,h])=>{if(n&&/^#[0-9a-f]{6}$/i.test(h)&&!CM[n]){C.push([n,h]);CM[n]=h;CC.push(n)}})}catch(e){}
$('pal').innerHTML='<option value="">Custom mix</option>'+PL.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('');
document.addEventListener('click',closeDD);document.addEventListener('keydown',e=>{if(e.key=='Escape')closeDD()});
mkdd('pI',C.map(cItem));mkdd('pB',C.map(cItem));mkdd('p3',[noneItem,...C.map(cItem)]);mkdd('p4',[noneItem,...C.map(cItem)]);mkdd('stI',[defItem,...C.map(cItem)]);
paintColors();
mkdd('pal',[{v:'',h:'<span class="combo">&mdash;</span>Custom mix'},...PL.map((p,i)=>({v:i,h:`<span class="combo sws">${[p[2],p[1],p[3],p[4]].filter(Boolean).map(n=>`<i style="background:${CM[n]}"></i>`).join('')}</span><span>${esc(p[0])}<small>No. ${i+1} · ${[p[2],p[1],p[3],p[4]].filter(Boolean).map(esc).join(' · ')}</small></span>`}))]);
}
export {C,CASP,CC,CH,CM,CSN,CW,DD,DDset,HO,M,N,OFFS,ORN,PAPER,PCOL,PL,PSLOT,SH,SHN,SK,SW,TRIMS,bk,cItem,cOut,closeDD,closeRowMenu,col,csN,csk,fixC,geom,hasOut,inShape,init04,mkdd,offPoly,ornPts,paintColors,placeFloat,polyArea,projCols,projSet,rng,rowMenu,saveCC,setDim,shOf,shp,tileExt,tileOn,tk,useG,useT,wrapP};
