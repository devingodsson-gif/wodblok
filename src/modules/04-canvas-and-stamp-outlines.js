import {kv} from '../platform/index.js';
import {$,WBS,WBX,mod} from './01-launch-and-version.js';
import {lyInkFill} from './32-layers-panel.js';
import {WADA_COLORS,WADA_COMBOS} from '../data/wada.js';
import {WADA_NAMES} from '../data/wada-names.js';
import {trayDefault} from './50-tray-core.js';
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
const shOf=t=>{if(!t)t={};   // no stamp at all (2.15.0): a plain default shape that nothing keeps
if(!t.sh||typeof t.sh!='object')t.sh={k:SHK.includes(WBS.dim.k)?WBS.dim.k:'rect',o:WBS.dim.o=='f'?'f':'p',s:[...(WBS.dim.s||[1,1])],z:100};return t.sh};
const useT=t=>{if(t)useG(geom(shOf(t)))};
const SHN={rect:'Rectangle',hex:'Hexagon',circle:'Circle',diamond:'Diamond',tri:'Triangle',arch:'Arch',oct:'Octagon',star:'Star',quat:'Quatrefoil',lancet:'Lancet'};
// Repeat tile canvas (dim.rt): a rectangle whose edges wrap, so copies placed side by side show no seam. The content is drawn a little past
// each edge (tileExt) so filters see the neighbouring tile, and a whole 3 x 3 when the repeat preview is on (WBS.tilePv).
// The stamp view (2.5.1): while a stamp is open in its tab the stage is a canvas of the stamp's own size, alone (no outline, tile, book or background)
// A stamp's name (2.28.0): its own name when it has been given one (t.nm, renamed in the Stamps list), else "Stamp <id>". The id never changes, so the names do not
// renumber when a stamp is deleted, and "Stamp 7" in the Elements list stays the same stamp. A new stamp is given its name when it is made.
// the next free "Stamp N" (a running count of the stamps there are, not the internal id: B11, 2.76.4)
const stFreeNm=(extra)=>{const u=new Set([...WBS.tiles,...(extra||[])].map(t=>/^Stamp (\d+)$/.test(t.nm||'')?+RegExp.$1:0));let n=1;while(u.has(n))n++;return 'Stamp '+n};
const stNm=t=>t?(typeof t.nm=='string'&&t.nm.trim()?t.nm.trim().slice(0,40):'Stamp '+t.id):'Missing stamp';
const stNmId=id=>stNm(WBS.tiles.find(t=>t.id==id));
const hEsc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));   // a name a person typed, put into markup
let STV=null;const stvOn=()=>!!STV;
function stvSet(w,h){STV=w?[w,h]:null;setDim()}
const tileOn=()=>!STV&&!!WBS.dim.rt&&!WBS.book.on;
// 2.76.6: how the repeat tile repeats (dim.rk): 'grid' (side by side), 'brick' (every row moved half a tile across) or 'half' (half drop: every column moved half a tile down).
// The tile's neighbours are i * a + j * b on that lattice; tileOffs(r) lists them for i, j from -r to r, without the tile itself.
const tileRk=()=>WBS.dim.rk=='brick'||WBS.dim.rk=='half'?WBS.dim.rk:'grid';
function tileOffs(r=1){const k=tileRk(),o=[];for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++){if(!i&&!j)continue;o.push(k=='brick'?[i*CW+j*CW/2,j*CH]:k=='half'?[i*CW,j*CH+i*CH/2]:[i*CW,j*CH])}return o}
// 2.76.6: a canvas can have a physical size (dim.u: 'px', 'in' or 'mm'; dim.pw, dim.ph in that unit; dim.dpi), so it prints and exports at that size; its ratio is dim.c.
// physOf() is null for a canvas that only has a ratio, else its size in pixels at its DPI and in inches.
const PHU={px:'px',in:'in',mm:'mm'};
function physOf(d=WBS.dim){if(!d||!PHU[d.u]||!(+d.pw>0)||!(+d.ph>0))return null;const dpi=Math.max(30,Math.min(1200,+d.dpi||300)),toIn=v=>d.u=='px'?v/dpi:d.u=='mm'?v/25.4:v;
 const iw=toIn(+d.pw),ih=toIn(+d.ph);return{u:d.u,w:+d.pw,h:+d.ph,dpi,inW:iw,inH:ih,pxW:Math.max(1,Math.round(d.u=='px'?+d.pw:iw*dpi)),pxH:Math.max(1,Math.round(d.u=='px'?+d.ph:ih*dpi))}}
// a length on the canvas (canvas units) in the canvas's own unit, and back; null without a physical size
const physLen=v=>{const P=physOf();return P?v/CW*P.w:null};
const physToCv=v=>{const P=physOf();return P?v/P.w*CW:null};
const tileExt=()=>tileOn()?[Math.min(CW,48),Math.min(CH,48)]:[0,0];   // 2.66.2: the 3 x 3 view is a picture of the tile (44-repeat-tile.js), so the drawing is the same with it on
const setDim=()=>{['cs','cr','n','co','g','cp'].forEach(x=>{if(x in WBS.dim)delete WBS.dim[x]});useG(geom(WBS.dim));try{useT(WBS.tiles[WBS.cur])}catch(e){}
if(STV){CW=STV[0];CH=STV[1]}else if(WBS.book.on){const g=bk();if(g.W>=g.H){CW=1000;CH=+(1000*g.H/g.W).toFixed(3)}else{CH=1000;CW=+(1000*g.W/g.H).toFixed(3)}}else[CW,CH]=csDims()};
// Canvas (2.32.0, owner Oct 23 2026): the canvas is always a rectangle. The other outlines (rounded, circle, oval, arch, hex, triangle, diamond, polygon) are gone; setDim drops the old fields.
const CSH=[['rect','Rectangle']];let CSN;const CASP=['rect'];
function csk(){return'rect'}
// In a stamp tab the canvas is the stamp's own outline (2.27.0), not its bounding rectangle: a circle stamp has a circle canvas
const stvOut=()=>!!STV&&SK!='rect';
let STPC=['',[]];
function stPts(d){if(STPC[0]==d)return STPC[1];const h=document.getElementById('cvdefs'),p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);if(h)h.appendChild(p);const o=[];try{const L=p.getTotalLength(),N=240;for(let i=0;i<N;i++){const q=p.getPointAtLength(L*i/N);o.push([q.x,q.y])}}catch(e){}if(p.parentNode)p.parentNode.removeChild(p);STPC=[d,o];return o}
const hasOut=()=>stvOut();
function csDims(){return fitD(WBS.dim.c,800)}
const polyArea=P=>{let a=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1]}return a/2};
// Inset a closed outline by d (mitred corners). Needs the points to run clockwise on screen; returns null once it collapses.
function offPoly(P,d){const m=P.length;if(m<3)return null;const N=[];for(let i=0;i<m;i++){const a=P[i],b=P[(i+1)%m],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1e-9;N.push([-dy/L,dx/L])}
const R=[];for(let i=0;i<m;i++){const n1=N[(i+m-1)%m],n2=N[i],k=1+n1[0]*n2[0]+n1[1]*n2[1],c=d/Math.max(k,.15);R.push([P[i][0]+(n1[0]+n2[0])*c,P[i][1]+(n1[1]+n2[1])*c])}
return polyArea(R)>0?R:null}
// The outline of the canvas: d (SVG path), pts (clockwise polyline), keys (indices of the corner / marker points), vk (true when the keys are the real corners of a polygon)
function cOut(){if(stvOut()){const d=shp(0);return{d,pts:stPts(d),keys:[],vk:false}}const W=CW,H=CH,fm=v=>+(+v).toFixed(2),pts=[[0,0],[W,0],[W,H],[0,H]];return{d:'M'+pts.map(p=>fm(p[0])+' '+fm(p[1])).join('L')+'Z',pts,keys:[0,1,2,3],vk:true}}

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
// An inverted stamp is a solid tile with the shapes carved out. Next to each other, two tiles each fade out at the shared edge, so a thin light line of the
// background shows between them. A thin stroke of the tile's own colour along the outline closes it (normal stamps do not need it: they are the background colour).
const shBleed=ci=>`<path d="${shp(0)}" fill="none" stroke="${ci}" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
function shp(e){const f=v=>(+v).toFixed(2);let P;
if(SK=='circle'){const rx=SW/2-e,ry=SH/2-e;return`M${f(e)} ${f(SH/2)}A${f(rx)} ${f(ry)} 0 1 0 ${f(SW-e)} ${f(SH/2)}A${f(rx)} ${f(ry)} 0 1 0 ${f(e)} ${f(SH/2)}Z`}
if(SK=='diamond'){const A=SW/2,B=SH/2,h=Math.hypot(A,B),dx=e*h/B,dy=e*h/A;P=[[A,dy],[SW-dx,B],[A,SH-dy],[dx,B]]}
else if(SK=='tri'){const r=SH/3,cx=SW/2,cy=SH*2/3,k=Math.max(0,(r-e)/r);P=[[SW/2,0],[SW,SH],[0,SH]].map(([x,y])=>[cx+(x-cx)*k,cy+(y-cy)*k])}
else if(SK=='hex'){const r=120-e*2/Math.sqrt(3),a0=HO=='p'?-90:0;P=[0,1,2,3,4,5].map(k=>[SW/2+r*Math.cos((a0+60*k)*Math.PI/180),SH/2+r*Math.sin((a0+60*k)*Math.PI/180)])}
else if(ORN.includes(SK))P=ornPts(e);
else P=[[e,e],[SW-e,e],[SW-e,SH-e],[e,SH-e]];
return CRAD>0?rpoly(P,CRAD/100*Math.min(SW,SH)/2):'M'+P.map(p=>f(p[0])+' '+f(p[1])).join('L')+'Z'}
const hsl=h=>{const r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let H=0;if(d){H=mx==r?((g-b)/d)%6:mx==g?(b-r)/d+2:(r-g)/d+4;H*=60;if(H<0)H+=360}return[H,d?d/(1-Math.abs(2*l-1)):0,l]};
const C=[];
let CM;
// A colour reference (see 50-tray-core.js): '@slot' follows a tray slot in the colourway that is showing, '#rrggbb[aa][|slot]' is a fixed colour,
// anything else is an old colour name (files from before the tray). The result is a CSS colour, '#rrggbb' or '#rrggbbaa' with its opacity.
const col=n=>{if(!n)return'#888888';const c=n.charCodeAt(0);if(c===64){const p=WBS.proj,w=p&&p.cw&&p.cw[p.cwa|0];return(w&&w.c[n.slice(1)])||'#888888'}if(c===35){const i=n.indexOf('|');return i<0?n:n.slice(0,i)}return CM[n]||'#888888'};
// does a colour reference point at something that exists
const okC=n=>{if(!n||typeof n!='string')return false;const c=n.charCodeAt(0);if(c===64){const p=WBS.proj;return!!(p&&p.ts&&p.ts.includes(n.slice(1)))}if(c===35)return/^#[0-9a-f]{6}([0-9a-f]{2})?(\|\w+)?$/.test(n);return!!CM[n]};
let PL;
const PCOL={ink:"Dark Tyrian Blue",bg:"Pale Lemon Yellow"};
const CC=[];
const saveCC=()=>{try{kv.set('wb7_colors',JSON.stringify(C.filter(c=>CC.includes(c[0]))))}catch(e){}};
// Open popups are lifted to the top of the page and placed against their button, so no panel, floating window,
// scrolling area or the phone-width header (which scrolls sideways) can clip them or draw over them.
// A small "..." menu for one row of a list: items are [label, action, disabled]. It opens next to the button, closes when you choose, click elsewhere or press Esc, and the items are real buttons (Tab and Enter work).
let ROWM=null,ROWS=null;
function closeRowSub(){if(ROWS){ROWS.remove();ROWS=null}if(ROWM)ROWM.querySelectorAll('.ddi[aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'))}
function closeRowMenu(){closeRowSub();if(ROWM){if(ROWM.btn)ROWM.btn.setAttribute('aria-expanded','false');ROWM.remove();ROWM=null}}
// An item is [label, action, disabled, sub]. An item with sub (a list of items, like the menu's own) opens a flyout beside it on hover, click, Enter or Right Arrow (2.35.0).
function rowMenu(btn,items){const was=ROWM&&ROWM.btn===btn;closeRowMenu();if(was)return;const m=document.createElement('div');m.className='ddl rowm';m.dataset.w='150';m.setAttribute('role','menu');
 m.innerHTML=items.map(([t,,off,sub],i)=>`<button type="button" class="ddi${sub?' hassub':''}" role="menuitem" data-i="${i}"${off?' disabled':''}${sub?' aria-haspopup="menu" aria-expanded="false"':''}><span>${t}</span>${sub?'<span class="rmcar" aria-hidden="true">&#8250;</span>':''}</button>`).join('');
 document.body.appendChild(m);{m.style.width='max-content';const nw=Math.ceil(m.getBoundingClientRect().width);m.style.width='';m.dataset.w=String(Math.max(150,nw))}   // 2.60.1 (artist test: long items wrapped over each other): the menu is as wide as its longest item
 placeFloat(m,btn,true);m.btn=btn;ROWM=m;btn.setAttribute('aria-expanded','true');
 m.sc=new Map();for(let a=btn.parentElement;a;a=a.parentElement)m.sc.set(a,[a.scrollTop,a.scrollLeft,a.scrollHeight]);   // 2.79.1: how its panels stood when it opened
 const openSub=(b,focus)=>{const it=items[+b.dataset.i];if(!it||!it[3])return;if(ROWS&&ROWS.src===b){if(focus){const f=ROWS.querySelector('button');if(f)f.focus()}return}closeRowSub();
  const f=document.createElement('div');f.className='ddl rowm rowsub fx';f.setAttribute('role','menu');f.src=b;
  f.innerHTML=it[3].map(([t,,off],i)=>`<button type="button" class="ddi" role="menuitem" data-j="${i}"${off?' disabled':''}><span>${t}</span></button>`).join('');
  document.body.appendChild(f);b.setAttribute('aria-expanded','true');
  const r=b.getBoundingClientRect(),mr=m.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,w=f.offsetWidth,h=f.offsetHeight;
  let left=mr.right+2;if(left+w>vw-8)left=Math.max(8,mr.left-w-2);f.style.left=left+'px';f.style.top=Math.max(8,Math.min(r.top-6,vh-h-8))+'px';f.style.zIndex=9001;ROWS=f;
  f.onclick=e=>{const c=e.target.closest('[data-j]');if(!c||c.disabled)return;const fn=it[3][+c.dataset.j][1];closeRowMenu();fn()};
  f.onkeydown=e=>{if(e.key=='Escape'||e.key=='ArrowLeft'){e.stopPropagation();e.preventDefault();closeRowSub();b.focus()}else if(e.key=='ArrowDown'||e.key=='ArrowUp'){e.preventDefault();e.stopPropagation();const bs=[...f.querySelectorAll('button:not(:disabled)')],i=bs.indexOf(document.activeElement);bs[(i+(e.key=='ArrowDown'?1:-1)+bs.length)%bs.length].focus()}};
  if(focus){const c=f.querySelector('button:not(:disabled)');if(c)c.focus()}};
 m.onclick=e=>{const b=e.target.closest('[data-i]');if(!b||b.disabled)return;const it=items[+b.dataset.i];if(it[3]){e.stopPropagation();openSub(b,false);return}closeRowMenu();it[1]()};
 m.addEventListener('mouseover',e=>{const b=e.target.closest('[data-i]');if(!b||b.disabled)return;if(items[+b.dataset.i][3])openSub(b,false);else if(ROWS)closeRowSub()});
 m.onkeydown=e=>{if(e.key=='Escape'){e.stopPropagation();const b=m.btn;closeRowMenu();b.focus()}else if(e.key=='ArrowDown'||e.key=='ArrowUp'){e.preventDefault();const bs=[...m.querySelectorAll('button:not(:disabled)')],i=bs.indexOf(document.activeElement);bs[(i+(e.key=='ArrowDown'?1:-1)+bs.length)%bs.length].focus()}
  else if(e.key=='ArrowRight'||e.key=='Enter'){const b=document.activeElement;if(b&&b.dataset&&b.dataset.i!=null&&items[+b.dataset.i][3]){e.preventDefault();openSub(b,true)}}};
 const f=m.querySelector('button:not(:disabled)');if(f)f.focus()}
document.addEventListener('pointerdown',e=>{if(ROWM&&!e.target.closest('.rowm,[data-more]'))closeRowMenu()},true);
// a scroll closes the menu; a panel that only got shorter under it (the click changed what the panel shows, 2.79.1) moves the menu with its button instead
addEventListener('scroll',e=>{if(!ROWM||(e.target.closest&&e.target.closest('.rowm')))return;const t=e.target,v=ROWM.sc&&ROWM.sc.get(t);
 if(v&&v[0]===t.scrollTop&&v[1]===t.scrollLeft)return;
 if(v&&v[2]!==t.scrollHeight&&ROWM.btn&&ROWM.btn.isConnected){v[0]=t.scrollTop;v[1]=t.scrollLeft;v[2]=t.scrollHeight;closeRowSub();placeFloat(ROWM,ROWM.btn,true);return}
 closeRowMenu()},true);
function placeFloat(el,a,right,cap){if(el.parentNode!==document.body)document.body.appendChild(el);el.classList.add('fx');el.style.maxHeight='';el.style.width='';
const r=a.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,g=4,pad=8;
if(el.classList.contains('ddl'))el.style.width=Math.min(vw-2*pad,Math.max(r.width,+el.dataset.w||180))+'px';
const h=Math.min(el.scrollHeight+2,cap||1e9),below=vh-r.bottom-g-pad,above=r.top-g-pad;
let top;if(h<=below||below>=above){top=r.bottom+g;el.style.maxHeight=Math.max(120,Math.min(h,below))+'px'}
else{const mh=Math.min(h,above);el.style.maxHeight=mh+'px';top=r.top-g-mh}
const w=el.offsetWidth;let left=right?r.right-w:r.left;left=Math.max(pad,Math.min(left,vw-w-pad));
el.style.left=left+'px';el.style.top=top+'px'}
const DD={},DDset={},esc=x=>String(x).replace(/&/g,'&amp;'),closeDD=()=>document.querySelectorAll('.ddl:not(.rowm)').forEach(l=>l.hidden=true);   // a row's menu keeps its own closing (closeRowMenu, 2.79.1)
function paintColors(){if(window.lyInkOn)lyInkFill();if(WBX.wbTrayPaint)WBX.wbTrayPaint(true)}
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
WADA_COLORS.forEach(c=>C.push([c[0],c[1]]));
{const grp=h=>{const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255),ch=Math.max(...v)-Math.min(...v),l=hsl(h)[2];return l>=.78?1:ch>=.17?0:2};
C.sort((a,b)=>{const ga=grp(a[1]),gb=grp(b[1]),A=hsl(a[1]),B=hsl(b[1]);if(ga!=gb)return ga-gb;if(ga==2)return B[2]-A[2];const ha=Math.floor(((A[0]+12)%360)/24),hb=Math.floor(((B[0]+12)%360)/24);return ha-hb||B[2]-A[2]})}
CM=Object.fromEntries(C);
PL=WADA_COMBOS.map((cb,i)=>{const cs=cb.map(j=>WADA_COLORS[j]).sort((a,b)=>hsl(a[1])[2]-hsl(b[1])[2]);const mid=cs.slice(1,-1).reverse();return[WADA_NAMES[i]||'No. '+(i+1),cs[0][0],cs[cs.length-1][0],mid[0]?mid[0][0]:'',mid[1]?mid[1][0]:'']});WBS.proj=trayDefault();try{JSON.parse(kv.get('wb7_colors')||'[]').forEach(([n,h])=>{if(n&&/^#[0-9a-f]{6}$/i.test(h)&&!CM[n]){C.push([n,h]);CM[n]=h;CC.push(n)}})}catch(e){}
document.addEventListener('click',closeDD);document.addEventListener('keydown',e=>{if(e.key=='Escape')closeDD()});
}
export {hEsc,physLen,physOf,physToCv,PHU,tileOffs,tileRk,stFreeNm,stNm,stNmId,stvOn,stvSet,shBleed,C,CASP,CC,okC,CH,CM,CSN,CW,DD,DDset,HO,M,N,OFFS,ORN,PAPER,PCOL,PL,SH,SHN,SK,SW,TRIMS,bk,cOut,closeDD,closeRowMenu,col,csk,geom,hasOut,inShape,init04,offPoly,ornPts,paintColors,placeFloat,polyArea,rng,rowMenu,saveCC,setDim,shOf,shp,tileExt,tileOn,tk,useG,useT,wrapP};
