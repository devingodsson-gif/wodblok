import {ICN} from './00-icons.js';
import {mapPts,mapShape} from './77-map-to-shape.js';
import {cust,mk} from './06-motif-library-folders.js';
import {mNm} from './21-motif-library-ui.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,geom,okC,PHU,physLen,physOf,physToCv,rowMenu,shOf,stNmId} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {refLabel} from './50-tray-core.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {fpSz} from './25-art-layers.js';
import {elDef,elExtend,elKind,elSel} from './65-element-core.js';
import {TL_AR,TL_TS,tlArr,tlPts,tlShape,tlWallPreview} from './92-pattern-tiling.js';

// ===== The Pattern element (element update, step 5, 2.1.5): a list of points plus sources placed at them.
// {u, k:'pattern', n:name, lay:'grid'|'brick'|'half'|'radial'|'scatter'|'frame', cn:columns, rn:rows, sz:size in % of a cell, rt:turn in degrees, ox, oy: shift in % of a cell, in: the frame's inset in % of the short side,
//  ds:'cycle'|'random'|'weight', sd:seed, src:[{k:'stamp',t,w} | {k:'motif',m,w, and its look: wx, wy, ink, fl, a, iz, im, sw, sk as on a Motif element} | {k:'text',w,it:{the text element without u, x, y}}]  (2.4.0: a new pattern has no sources; each point then shows as an arrow, in the editor only, pointing the way a placed piece would be turned), x, y, s, r, f (an anchor, so the element list stays uniform)}
// Sources are references: editing a stamp changes every placement. A pattern draws by turning itself into ordinary stamp, image and text elements (with the pattern's id in `pu`),
// which the kinds draw as always; nothing is drawn twice and nothing is stored for them.
const patClamp=(v,a,b)=>Math.max(a,Math.min(b,+v||0));
// A new Pattern starts with as many columns and rows as the canvas holds stamps of the size a stamp is placed at (2.48.0, owner Oct 26 2026): canvas 1000 and stamp 100 make 10 x 10.
// 2.57.0: a new Pattern tiles (From stamp, the shape's first arrangement), its pieces the size a stamp is placed at, touching, over the whole canvas (af)
const patNew=()=>({lay:'tile',ts:'auto',ps:+Math.max(1,Math.min(100,fpSz()/Math.min(CW,CH)*100)).toFixed(1),sp:0,...patStart(),sz:100,af:1});
const patStart=()=>{const s=Math.max(1,fpSz());return{cn:patClamp(Math.round(CW/s),1,40),rn:patClamp(Math.round(CH/s),1,40)}};
function patRnd(sd){let a=(+sd||1)>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
// the points: [x, y] and the size of the cell around each
// 2.57.0: a pattern fills its area: {x, y} its middle, {aw, ah} its size, in canvas units; af (area follows) keeps it the whole canvas until it is moved or resized
function patArea(p){if(p.af||!(+p.aw>0)||!(+p.ah>0)||p.x==null)return{x0:0,y0:0,w:CW,h:CH};const w=+p.aw,h=+p.ah;return{x0:+p.x-w/2,y0:+p.y-h/2,w,h}}
// the places of a pattern, in canvas units: the Tiling layout (92-pattern-tiling.js), or the free layouts (Radial, Scatter, Frame; Grid is kept for a stamp's own tab),
// laid in the pattern's area
// 2.76.7: the area pieces are laid in: the pattern's area less its margin (mg, % of the area's short side). Edges (ed): 'cut' (pieces cut at the edge, as before) or
// 'whole' (only pieces that fit inside whole are kept)
function patIn(p){const A=patArea(p),m=Math.min(A.w,A.h)*patClamp(p.mg||0,0,40)/100;return{x0:A.x0+m,y0:A.y0+m,w:Math.max(1,A.w-2*m),h:Math.max(1,A.h-2*m)}}
const patWhole=(p,I,x,y,s,r)=>{if(p.ed!='whole')return true;const h=s/2*(Math.abs(((+r||0)%90+90)%90)>.5?Math.SQRT2:1);return x-h>=I.x0-1e-6&&y-h>=I.y0-1e-6&&x+h<=I.x0+I.w+1e-6&&y+h<=I.y0+I.h+1e-6};
function patPts(p){{const S=mapShape(p);if(S){const m=mapPts(p,S);if(m)return m}}
 const A=patIn(p),sh=r=>{r.pts=r.pts.map(q=>[q[0]+A.x0,q[1]+A.y0]);return r};
 if(p.lay=='tile')return sh(tlPts(p,A.w,A.h));
 return sh(patFree(p,A.w,A.h))}
// the free layouts, in an area W x H (CW and CH here are the area's, not the canvas's)
function patFree(p,CW,CH){
const cn=patClamp(p.cn,1,40)|0||1,rn=patClamp(p.rn,1,40)|0||1,cw=CW/cn,ch=CH/rn,cell=Math.min(cw,ch),o=[];
// frame: a row of points along each edge, turned to lie along it
if(p.lay=='frame'){const m=Math.min(CW,CH)*patClamp(p.in==null?4:p.in,0,40)/100,W=CW-2*m,H=CH-2*m,rot=[];for(let i=0;i<cn;i++){const x=m+(i+.5)*W/cn;o.push([x,m]);rot.push(0);o.push([x,CH-m]);rot.push(0)}for(let j=0;j<rn;j++){const y=m+(j+.5)*H/rn;o.push([m,y]);rot.push(90);o.push([CW-m,y]);rot.push(90)}return{pts:o,cell:W/cn,rot}}
const ox=patClamp(p.ox,-100,100)/100*cw,oy=patClamp(p.oy,-100,100)/100*ch,sh=a=>a.map(q=>[q[0]+ox,q[1]+oy]).filter(q=>q[0]>-cw/2+1e-6&&q[0]<CW+cw/2-1e-6&&q[1]>-ch/2+1e-6&&q[1]<CH+ch/2-1e-6);
if(p.lay=='radial'){const R=Math.min(CW,CH)/2*.92,st=R/rn;o.push([CW/2,CH/2]);for(let k=1;k<=rn;k++){const n=cn*k;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o.push([CW/2+Math.cos(a)*st*k,CH/2+Math.sin(a)*st*k])}}return{pts:o,cell:Math.min(st*1.1,2*Math.PI*st/Math.max(3,cn))}}
// 2.76.7: Scatter keeps pieces at least md (% of a cell) apart: each piece is drawn up to 30 times from the seed and the first place far enough from the others is kept
// (even spacing that still looks placed by hand); md 0 is the old scatter. A grid of buckets keeps the check fast.
if(p.lay=='scatter'){const r=patRnd((+p.sd||1)+77),n=cn*rn,md=patClamp(p.md||0,0,100)/100*cell;if(!(md>0)){for(let i=0;i<n;i++)o.push([r()*CW,r()*CH]);return{pts:o,cell}}
 const bs=md,G=new Map(),key=(x,y)=>Math.floor(x/bs)+','+Math.floor(y/bs),near=(x,y)=>{const gx=Math.floor(x/bs),gy=Math.floor(y/bs);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const L=G.get((gx+dx)+','+(gy+dy));if(L)for(const q of L)if((q[0]-x)**2+(q[1]-y)**2<md*md)return true}return false};
 for(let i=0;i<n;i++){for(let t=0;t<30;t++){const x=r()*CW,y=r()*CH;if(near(x,y))continue;o.push([x,y]);const k=key(x,y);(G.get(k)||G.set(k,[]).get(k)).push([x,y]);break}}return{pts:o,cell}}
// 2.76.7: Spiral (a sunflower): Columns x Rows pieces, each turned by the golden angle from the one before and further out by the square root of its number,
// so they fill a disc evenly; the pieces face outward
if(p.lay=='spiral'){const n=cn*rn,R=Math.min(CW,CH)/2*.94,c=R/Math.sqrt(n+.5),GA=Math.PI*(3-Math.sqrt(5)),rot=[];for(let k=0;k<n;k++){const a=k*GA,rr=c*Math.sqrt(k+.5);o.push([CW/2+Math.cos(a)*rr,CH/2+Math.sin(a)*rr]);rot.push(+(a*180/Math.PI+90).toFixed(2)%360)}return{pts:o,cell:c*1.6,rot}}
if(p.lay=='brick'){for(let j=-1;j<=rn;j++)for(let i=-1;i<=cn;i++){const x=(i+.5)*cw+(Math.abs(j)%2?cw/2:0);if(x>-cw/2+1e-6&&x<CW+cw/2-1e-6)o.push([x,(j+.5)*ch])}return{pts:sh(o),cell}}
if(p.lay=='half'){for(let i=-1;i<=cn;i++)for(let j=-1;j<=rn;j++){const y=(j+.5)*ch+(Math.abs(i)%2?ch/2:0);if(y>-ch/2+1e-6&&y<CH+ch/2-1e-6)o.push([(i+.5)*cw,y])}return{pts:sh(o),cell}}
for(let j=-1;j<=rn;j++)for(let i=-1;i<=cn;i++)o.push([(i+.5)*cw,(j+.5)*ch]);return{pts:sh(o),cell}}
// 2.31.0: a motif source carries its own look (stretch, colour, fill, picture, outline), which every placement of it takes
const PAT_LOOK=['wx','wy','ink','fl','a','iz','im','sw','sk'];
// 2.76.5: what makes the pieces look hand-printed. A piece's own ink (pcm: 'place' takes the colour by the place's class, as a Checkerboard's two colours; 'random' draws
// one; the colours are pcc, tray colours), its own pressure (iv, 0 to 100: how much lighter the lightest piece prints) and overprinting (ov: pieces multiply where they overlap).
// Each piece draws from its own seeded stream, so a piece keeps its look when the others change.
// 2.76.9: density (dm: 'img' a picture of the project (da), 'lin' a fade at an angle (dg), 'rad' from the middle out) gives each place a darkness t (0 light, 1 dark;
// di turns it round). Amount dv (0 to 100) and Effect dk ('size' smaller pieces where it is light, 'count' fewer, 'both'): a halftone made of stamps, or a fade.
// A picture is read once, small, into a grid of darkness (patLum); until it is read, pieces print as without density.
const PDC={};
function patLum(a){const A=WBS.ARTS&&WBS.ARTS[a];if(!A||!A.src)return null;const k=a+':'+A.src.length,c=PDC[k];if(c)return c.d?c:null;PDC[k]={};
 const im=new Image();im.onload=()=>{const w=96,h=Math.max(1,Math.round(96*(im.naturalHeight||1)/(im.naturalWidth||1))),cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.drawImage(im,0,0,w,h);
  const px=g.getImageData(0,0,w,h).data,d=new Float32Array(w*h);for(let i=0;i<w*h;i++){const al=px[i*4+3]/255;d[i]=1-((.2126*px[i*4]+.7152*px[i*4+1]+.0722*px[i*4+2])/255*al+(1-al))}PDC[k]={w,h,d};upd()};im.src=A.src;return null}
function patDark(p,x,y){const A=patArea(p),u=(x-A.x0)/A.w,v=(y-A.y0)/A.h;let t=null;
 if(p.dm=='img'){const L=patLum(p.da);if(!L)return null;const ix=Math.max(0,Math.min(L.w-1,Math.floor(u*L.w))),iy=Math.max(0,Math.min(L.h-1,Math.floor(v*L.h)));t=L.d[iy*L.w+ix]}
 else if(p.dm=='lin'){const a=(+p.dg||0)*Math.PI/180,cx=u-.5,cy=v-.5,h=(Math.abs(Math.cos(a))+Math.abs(Math.sin(a)))/2||1;t=(cx*Math.cos(a)+cy*Math.sin(a))/h/2+.5}
 else if(p.dm=='rad'){t=1-Math.min(1,Math.hypot(u-.5,v-.5)/Math.SQRT1_2)}
 if(t==null)return null;t=Math.max(0,Math.min(1,t));return p.di?1-t:t}
function patVary(p,o,i,cls){const iv=+p.iv||0,cm=p.pcm,cc=Array.isArray(p.pcc)?p.pcc:[],dn=p.dm=='img'||p.dm=='lin'||p.dm=='rad';if(!(iv>0||p.ov||(cm&&cc.length)||dn))return o;
 const r=patRnd((+p.sd||1)*7919+i*104729+3);
 if(cm&&cc.length){const c=cm=='place'?cc[((cls|0)%cc.length+cc.length)%cc.length]:cc[Math.floor(r()*cc.length)];if(c)o.ink=c}else r();
 if(iv>0)o.op=Math.max(5,Math.round(100-r()*Math.min(100,iv)*.9));
 if(p.ov)o.bl='multiply';
 if(dn){const t=patDark(p,+o.x,+o.y);if(t!=null){const v=Math.max(0,Math.min(100,p.dv==null?70:+p.dv))/100,lt=v*(1-t),k=p.dk=='count'?'count':p.dk=='both'?'both':'size';
  if(k!='size'&&r()<lt)return null;   // thinned out where it is light
  if(k!='count'){const f=Math.max(.05,1-lt*(k=='both'?.7:1));o.s=+(+o.s*f).toFixed(3)}}}
 return o}
// 2.76.8 (docs/pattern-plan.md step 5): a new Pattern starts ready. Its source is the selected stamp or shape (with the shape's look), else the project's only stamp;
// it goes just above the Background (patPut) instead of over everything. Make pattern does the same at once for the selected stamp or shape.
function patSrcNow(){const q=elSel();if(q&&(q.k=='stamp'||!q.k)&&q.t!=null&&WBS.tiles.some(t=>t.id==q.t))return[{k:'stamp',t:q.t,w:1}];if(q&&q.k=='motif'&&q.m)return[{k:'motif',m:q.m,w:1,...patLook(q)}];return WBS.tiles.length==1?[{k:'stamp',t:WBS.tiles[0].id,w:1}]:[]}
function patPut(L,q){const a=(L.pl=L.pl||[]);let i=-1;a.forEach((x,k)=>{if(x.bgd)i=k});a.splice(i+1,0,q);WBS.fpSel=q.u;WBS.fpMS=new Set();WBS.fpAnc=q.u;WBS.patSel=q.u;return q}
const patCanMake=()=>{const q=elSel();return!!q&&((q.k=='motif'&&!!q.m)||((q.k=='stamp'||!q.k)&&q.t!=null))};
function patMakeFrom(){if(!patCanMake())return false;const L=fpL();if(!L)return false;const src=patSrcNow(),n=patList().length+1;
 const q=patPut(L,{u:fpU(),k:'pattern',n:'Pattern '+n,...patNew(),rt:0,ds:'cycle',sd:1+Math.floor(Math.random()*9998),src,x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:Math.min(CW,CH),r:0,f:1});
 patCh();if(WBX.wbOpenPanel)WBX.wbOpenPanel('layers');pmsg('Made '+q.n+' from the selection.');return true}
const patLook=s=>{const o={};PAT_LOOK.forEach(k=>{if(s[k]!=null)o[k]=s[k]});return o};
const patSrcOk=s=>s&&(s.k=='stamp'?WBS.tiles.some(t=>t.id==s.t):s.k=='motif'?typeof s.m=='string'&&!!s.m:s.k=='pattern'?!!s.p&&!!patRef(s.p):s.k=='text'&&s.it);
// the elements a pattern stands for
// 2.76.10: the piece a source makes at a place (b: the place's fields); a stamp, a shape (in the tile's own box when bw is given) or a text. A source that is another
// Pattern (k:'pattern', p: its u) prints that pattern, small, at the place (patNest).
function patMk(p,s,b,i,cls,bw,bh,ms){if(s.k=='stamp')return patVary(p,{...b,k:'stamp',t:s.t},i,cls);
 if(s.k=='motif'){const L=patLook(s);return patVary(p,{...b,k:'motif',m:s.m,...(ms!=null?{s:ms}:{}),...L,...(bw!=null?{wx:+((+L.wx||1)*bw).toFixed(4),wy:+((+L.wy||1)*bh).toFixed(4)}:{})},i,cls)}
 if(s.k=='text'){const{u,x,y,s:_s,r:_r,f:_f,...it}=s.it;return patVary(p,{...it,...b,k:'text'},i,cls)}return null}
// a Pattern as a source (one level deep): its pieces, its area scaled to the place's size, turned with the place; at most 64 a place and 4,000 in all (speed)
const PAT_NEST_MAX=4000;
function patRef(u){for(const L of WBS.layers){const q=(L.pl||[]).find(x=>x.k=='pattern'&&String(x.u)===String(u));if(q)return q}return null}
function patNest(p,s,b,cache){const ref=patRef(s.p);if(!ref||ref.u===p.u||(ref.src||[]).some(x=>x.k=='pattern'))return[];let its=cache.get(ref.u);if(!its){its=patItems(ref).slice(0,64);cache.set(ref.u,its)}
 if(cache.n>=PAT_NEST_MAX)return[];const A=patArea(ref),cx=A.x0+A.w/2,cy=A.y0+A.h/2,f=(+b.s||1)/Math.max(1,Math.min(A.w,A.h)),a=(+b.r||0)*Math.PI/180,co=Math.cos(a),si=Math.sin(a),out=[];
 for(const it of its){if(cache.n>=PAT_NEST_MAX)break;const dx=(+it.x-cx)*f,dy=(+it.y-cy)*f,{wk,clp,cwk,pin,pk,op,bl,v,g,...o}=it;
  out.push({...o,u:b.u+'.'+String(it.u).split('.').pop(),pu:p.u,x:+(b.x+dx*co-dy*si).toFixed(2),y:+(b.y+dx*si+dy*co).toFixed(2),s:+((+it.s||1)*f).toFixed(3),r:+((+it.r||0)+(+b.r||0)).toFixed(2)});cache.n++}
 return out}
// 2.76.10: one piece's own edit (p.pe[key]: d deleted, s another source by its number, c a colour, dx dy a move, dr a turn), applied to the piece made at its place
function patEd(o,E,key){if(!o)return o;o.pk=key;if(!E)return o;if(E.dx)o.x=+(+o.x+ +E.dx).toFixed(2);if(E.dy)o.y=+(+o.y+ +E.dy).toFixed(2);if(E.dr)o.r=+((+o.r||0)+ +E.dr).toFixed(2);if(okC(E.c))o.ink=E.c;return o}
function patSrcAt(p,s,E){if(E&&E.s!=null){const s2=(p.src||[])[E.s];if(patSrcOk(s2))return s2}return s}
function patItems(p){const ss=(p.src||[]).filter(patSrcOk);if(!ss.length)return[];if(p.lay=='tile'&&!mapShape(p))return patTiles(p,ss);const{pts,cell,rot}=patPts(p),r=patRnd(p.sd),sz=cell*patClamp(p.sz||80,5,300)/100,tot=ss.reduce((a,s)=>a+(+s.w>0?+s.w:1),0),out=[],nc=new Map();nc.n=0;
const I=patIn(p);pts.forEach((q,i)=>{if(!patWhole(p,I,q[0],q[1],sz,(+p.rt||0)+(rot?rot[i]||0:0)))return;let s;if(p.ds=='random')s=ss[Math.floor(r()*ss.length)];else if(p.ds=='weight'){let v=r()*tot;s=ss.find(z=>(v-=(+z.w>0?+z.w:1))<0)||ss[ss.length-1]}else s=ss[i%ss.length];
const key=String(i),E=p.pe&&p.pe[key];if(E&&E.d)return;s=patSrcAt(p,s,E);
const b={u:p.u+'.'+i,pu:p.u,...(p.fx&&p.fx.length?{fx:p.fx}:{}),x:+q[0].toFixed(1),y:+q[1].toFixed(1),s:+sz.toFixed(2),r:(+p.rt||0)+(rot?rot[i]||0:0),f:1};
if(s.k=='pattern'){const b2=patEd({...b},E,key);out.push(...patNest(p,s,b2,nc).map(o=>{o.pk=key;return o}));return}
out.push(patEd(patMk(p,s,b,i,i,null,null,+(sz/1.5).toFixed(2)),E,key))});return out.filter(Boolean)}
// the pieces of a tiling: each place's own size, turn and flip; Cycle picks the source by the place's class (a Checkerboard's two colours, a Diagonal's stripes),
// so sources alternate the way the arrangement says; a place marked gap (the small squares of Octagons and squares) is left empty with only one source; an accent
// place (2.76.10) takes the accent's source (p.ac.s, else the last one)
function patTiles(p,ss){const T=patPts(p),r=patRnd(p.sd),tot=ss.reduce((a,s)=>a+(+s.w>0?+s.w:1),0),out=[],n=ss.length,nc=new Map();nc.n=0;
 const I=patIn(p);T.pts.forEach((q,i)=>{if(T.gap[i]&&n<2)return;if(!patWhole(p,I,q[0],q[1],T.size[i],T.rot[i]))return;let s;
  if(T.acc&&T.acc[i]){const a=(p.src||[])[p.ac&&p.ac.s];s=patSrcOk(a)?a:ss[n-1]}else if(p.ds=='random')s=ss[Math.floor(r()*n)];else if(p.ds=='weight'){let v=r()*tot;s=ss.find(z=>(v-=(+z.w>0?+z.w:1))<0)||ss[n-1]}else s=ss[((T.cls[i]%n)+n)%n];
  const key=T.keys&&T.keys[i]!=null?T.keys[i]:String(i),E=p.pe&&p.pe[key];if(E&&E.d)return;s=patSrcAt(p,s,E);
  const sz=T.size[i],b={u:p.u+'.'+i,pu:p.u,...(p.fx&&p.fx.length?{fx:p.fx}:{}),x:+q[0].toFixed(2),y:+q[1].toFixed(2),s:+sz.toFixed(3),r:+(T.rot[i]||0).toFixed(2),f:T.flip[i]||1};
  if(s.k=='pattern'){const b2=patEd({...b},E,key);out.push(...patNest(p,s,b2,nc).map(o=>{o.pk=key;return o}));return}
  const bw=s.k=='motif'?(T.gap[i]||T.acc&&T.acc[i]?1:T.box.w):null,bh=s.k=='motif'?(T.gap[i]||T.acc&&T.acc[i]?1:T.box.h):null;   // a shape fills the tile's own box (a hexagon tile is narrower than it is tall), times its own stretch
  out.push(patEd(patMk(p,s,b,i,T.cls[i],bw,bh),E,key))});
 return out.filter(Boolean)}
// the layer as the kinds should draw it: each pattern replaced, in place, by the elements it stands for
function patExpand(L){const pl=L.pl||[];if(!pl.some(q=>q.k=='pattern'))return L;const o=[];pl.forEach(q=>{if(q.k=='pattern'){if(q.af){const cx=+(CW/2).toFixed(1),cy=+(CH/2).toFixed(1);if(q.x!==cx)q.x=cx;if(q.y!==cy)q.y=cy}   /* an area that follows the canvas keeps its middle on the canvas's (its box is drawn there) */
 const A=(+q.mg>0)&&q.ed!='whole'?patIn(q):patArea(q),cl=(!q.af&&+q.aw>0)||((+q.mg>0)&&q.ed!='whole')?{clp:[A.x0,A.y0,A.w,A.h]}:null,pin=q.pin&&(L.pl||[]).some(x=>String(x.u)===String(q.pin))?{pin:q.pin}:null,w=q.op!=null||q.bl||q.v===false||q.g||cl||pin?{wk:q.u,...(cl||{}),...(pin||{}),...(q.g?{g:q.g}:{}),...(q.op!=null?{op:q.op}:{}),...(q.bl?{bl:q.bl}:{}),...(q.v===false?{v:false}:{})}:null;const vr=(+q.iv>0)||q.ov;   // pieces with their own pressure or overprinting are wrapped one by one (the pattern's own opacity and blend ride on each); their clip is shared by id
 o.push(...(w?patItems(q).map(i=>{if(!vr)return{...i,...w};const m={...i,...w,wk:i.u};if(cl)m.cwk=q.u;if(w.op!=null||i.op!=null)m.op=Math.round((i.op==null?100:i.op)*(w.op==null?100:w.op)/100);else delete m.op;if(i.bl||w.bl)m.bl=i.bl||w.bl;return m}):patItems(q)))}else o.push(q)});return{...L,pl:o}}

// Empty patterns (2.4.0): each point is drawn as an arrow pointing the way a placed piece would face (its top), so the pattern can be seen and set up before anything is in it.
// The arrows are editor overlay only: they are not part of the picture, nor of an export.
function patArrows(L){const pl=(L.pl||[]).filter(q=>q.k=='pattern'&&q.v!==false&&!(q.src||[]).some(patSrcOk));if(!pl.length)return'';let h='';
 pl.forEach(p=>{const T=patPts(p),{pts,cell,rot}=T,tile=!!T.size,r0=tile?0:cell*patClamp(p.sz||80,5,300)/200;pts.forEach((q,i)=>{const r=tile?T.size[i]/2:r0,a=tile?(rot[i]||0):(+p.rt||0)+(rot?rot[i]||0:0);   /* a tiling's places carry their own size and turn */
  h+=`<path d="M0 ${(r*.8).toFixed(2)}V${(-r).toFixed(2)}M${(-r*.45).toFixed(2)} ${(-r*.5).toFixed(2)}L0 ${(-r).toFixed(2)}L${(r*.45).toFixed(2)} ${(-r*.5).toFixed(2)}" transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)}) rotate(${a.toFixed(1)})" fill="none" stroke="var(--acc)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" pointer-events="none" data-pa="1"/>`})});return h}
// ---- the panel (the Pattern panel's first group)
const patList=()=>{const L=fpL();return L?(L.pl||[]).filter(q=>q.k=='pattern'):[]};
const patCur=()=>{const a=patList();return a.find(q=>q.u==WBS.patSel)||null};
const patHx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const patCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
function patSrcName(s){if(s.k=='pattern'){const r=patRef(s.p);return String(r&&r.n||'Pattern').slice(0,24)}if(s.k=='stamp')return stNmId(s.t);if(s.k=='motif')return mNm(s.m);return String((s.it.tx&&s.it.tx.text)||'Text').replace(/\n/g,' ').slice(0,24)}
function patSync(){const host=$('pelist');if(!host)return;const a=patList(),p=patCur();if(WBS.patSel!=null&&!p&&a.length===0)WBS.patSel=null;
const key=JSON.stringify([a.map(q=>[q.u,q.n]),WBS.patSel,WBS.patSrc,p&&[WBS.patPE,WBS.patPc,JSON.stringify(p.pe||null),JSON.stringify(p.ac||null),(WBS.proj.ts||[]).join(),p.pin,p.dm,p.da,p.dk,p.dv,p.dg,p.di,Object.keys(WBS.ARTS||{}).join(),(fpL()&&fpL().pl||[]).map(q=>q.u+(q.n||q.nm||'')).join(),p.md,p.mg,p.ed,p.pcm,p.iv,p.ov,JSON.stringify(WBS.dim),CW,CH,p.lay,p.ts,p.ar,p.ps,p.sp,p.cn,p.rn,p.sz,p.rt,p.ox,p.oy,p.in,p.ds,(p.src||[]).map(s=>[s.k,s.t,s.a,s.w,s.it&&s.it.tx&&s.it.tx.text])],WBS.tiles.map(t=>t.id).join()]);
if(host.dataset.k===key)return;host.dataset.k=key;
host.innerHTML=a.slice().reverse().map(q=>`<div class="mr${q.u==WBS.patSel?' on':''}" data-pe="${q.u}"><b>${patHx(q.n)}<i>${(q.src||[]).length} source${(q.src||[]).length==1?'':'s'}</i></b><button type="button" data-pd="${q.u}" aria-label="Delete this pattern">&#215;</button></div>`).join('');
$('peed').hidden=!p;if(!p)return;
$('pelay').querySelectorAll('[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l==p.lay));
// 2.57.0: Tiling shows its tile shape, arrangement, size and spacing; the free layouts their columns, rows and size
{const tile=p.lay=='tile';$('petl').hidden=!tile;$('pefr').hidden=tile;{const lb={radial:['Spokes','Rings'],scatter:['Across','Down'],spiral:['Across','Down'],frame:['Columns','Rows']}[p.lay]||['Columns','Rows'];$('pecn').closest('.ctl').firstElementChild.textContent=lb[0];$('pern').closest('.ctl').firstElementChild.textContent=lb[1]}if(tile){const sh=tlShape(p),ts=$('pets'),ar=$('pear');
 if(!ts.options.length)ts.innerHTML=TL_TS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');const tv=p.ts&&TL_AR[p.ts]?p.ts:'auto';if(ts.value!==tv)ts.value=tv;
 const ah=TL_AR[sh].map(([v,t])=>`<option value="${v}">${t}</option>`).join('');if(ar.dataset.sh!==sh){ar.dataset.sh=sh;ar.innerHTML=ah}const av=tlArr(p,sh);if(ar.value!==av)ar.value=av;{const pv=$('pewpv'),k=sh=='wall'?av:'';pv.hidden=!k;if(pv.dataset.k!==k){pv.dataset.k=k;pv.innerHTML=k?tlWallPreview(k):''}}}}$('peds').querySelectorAll('[data-d]').forEach(b=>b.classList.toggle('on',b.dataset.d==p.ds));
const sv=(id,v)=>{const el=$(id);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};sv('peps',+p.ps||12);sv('pesp',+p.sp||0);sv('pecn',p.cn);sv('pern',p.rn);sv('pesz',p.sz);sv('pert',p.rt);sv('peox',+p.ox||0);sv('peoy',+p.oy||0);sv('pein',p.in==null?4:+p.in);sv('peiv',+p.iv||0);sv('pemd',+p.md||0);
 // Accent (2.76.10, Tiling): a second set of pieces at the middles between the main ones, its own source and size
 {const ac=p.ac&&p.ac.on;$('peac').checked=!!ac;$('peacb').hidden=!ac;const so=(p.src||[]).map((x,i)=>[String(i),patSrcName(x)]),h=so.map(([v,t])=>`<option value="${v}">${patHx(t)}</option>`).join(''),as=$('peacs');if(as.dataset.h!==h){as.dataset.h=h;as.innerHTML=h}
  if(ac){const v=String(p.ac.s!=null&&p.src&&p.src[p.ac.s]?p.ac.s:Math.max(0,(p.src||[]).length-1));if(as.value!==v)as.value=v;sv('peacz',+p.ac.z||40)}}
 // Edit pieces (2.76.10): the piece picked on the canvas, its source, colour and turn
 {const on=WBS.patPE===p.u;$('pepe').checked=on;const k=on?WBS.patPc:null,E=k!=null&&p.pe?p.pe[k]||{}:{};$('pepg').hidden=k==null;
  if(k!=null){const so=[['','Own'],...(p.src||[]).map((x,i)=>[String(i),patSrcName(x)])],h=so.map(([v,t])=>`<option value="${v}">${patHx(t)}</option>`).join(''),ps=$('pepsrc');if(ps.dataset.h!==h){ps.dataset.h=h;ps.innerHTML=h}const sv2=E.s!=null?String(E.s):'';if(ps.value!==sv2)ps.value=sv2;
   const co=[['','Own'],...(WBS.proj.ts||[]).map(id=>['@'+id,refLabel('@'+id)||'Colour'])],hc=co.map(([v,t])=>`<option value="${patHx(v)}">${patHx(t)}</option>`).join(''),pc=$('pepcol');if(pc.dataset.h!==hc){pc.dataset.h=hc;pc.innerHTML=hc}const cv=okC(E.c)?E.c:'';if(pc.value!==cv)pc.value=cv;sv('pepdr',+E.dr||0)}}
 // Inside (2.76.9): the layer's other elements that have a drawing of their own
 {const L=fpL(),nm=q=>{const d=elDef(elKind(q));return String((d&&d.name&&d.name(q))||q.n||q.nm||'Element').slice(0,40)},opts=[['','None'],...((L&&L.pl)||[]).filter(q=>q.u!==p.u&&q.k!='pattern'&&q.k!='group'&&!q.bgd&&elKind(q)).map(q=>[String(q.u),nm(q)])],h=opts.map(([v,t])=>`<option value="${patHx(v)}">${patHx(t)}</option>`).join(''),sel=$('pepin');
  if(sel.dataset.h!==h){sel.dataset.h=h;sel.innerHTML=h}const pv=p.pin&&opts.some(o=>o[0]===String(p.pin))?String(p.pin):'';if(sel.value!==pv)sel.value=pv}
 // Density (2.76.9)
 {const dm=p.dm=='img'||p.dm=='lin'||p.dm=='rad'?p.dm:'';$('pedm').querySelectorAll('[data-d]').forEach(b=>b.classList.toggle('on',b.dataset.d==dm));$('pedb').hidden=!dm;
  const pa=$('peda'),ids=Object.keys(WBS.ARTS||{}),h=ids.length?ids.map(i=>`<option value="${patHx(i)}">${patHx(WBS.ARTS[i].n||'Picture')}</option>`).join(''):'<option value="">No pictures</option>';if(pa.dataset.h!==h){pa.dataset.h=h;pa.innerHTML=h}pa.hidden=dm!='img';if(dm=='img'&&p.da&&pa.value!==p.da)pa.value=p.da;
  $('pedk').querySelectorAll('[data-k]').forEach(b=>b.classList.toggle('on',b.dataset.k==(p.dk||'size')));sv('pedv',p.dv==null?70:+p.dv);sv('pedg',+p.dg||0);$('pedgr').hidden=dm!='lin';$('pedi').checked=!!p.di}sv('pemg',+p.mg||0);$('pemdr').hidden=p.lay!='scatter';$('peeg').querySelectorAll('[data-e]').forEach(b=>b.classList.toggle('on',b.dataset.e==(p.ed=='whole'?'whole':'cut')));{const P=physOf(),r=$('pepur');r.hidden=!P;if(P){const S=Math.min(CW,CH)*Math.max(1,Math.min(100,+p.ps||12))/100,v=physLen(S),u=WBS.dim.u;$('pepuu').textContent=PHU[u];if(document.activeElement!=$('pepu'))$('pepu').value=String(+v.toFixed(u=='px'?0:u=='mm'?1:2))}}$('peov').checked=!!p.ov;$('pepc').querySelectorAll('[data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c==(p.pcm||'')));$('peinr').hidden=p.lay!='frame';
// the sources (2.3.0): one row each, a thumbnail of the stamp (or the kind's icon), its name, its weight when the pattern picks by weight, and remove
$('pesrc').innerHTML=(p.src||[]).map((s,i)=>{const t=s.k=='stamp'?WBS.tiles.find(x=>x.id==s.t):null,G=t?geom(shOf(t)):null,th=s.k=='motif'?`<svg viewBox="-110 -110 220 220">${mk(s.m,'currentColor','transparent')}</svg>`:G?`<svg viewBox="0 0 ${G.SW} ${G.SH}"><use href="#s${t.id}"/></svg>`:`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${s.k=='pattern'?ICN.pattern:ICN.text}</svg>`;
 return`<div class="psr2${s.k=='motif'&&WBS.patSrc===i?' on':''}" data-si="${i}"${s.k=='motif'?' data-look':''}><span class="pth">${th}</span><b>${patHx(patSrcName(s))}${patSrcOk(s)?'':' <i>missing</i>'}</b>${p.ds=='weighted'?`<input type="number" min="1" max="99" value="${+s.w>0?+s.w:1}" data-sw="${i}" aria-label="Weight">`:'<span></span>'}<button type="button" class="ib" data-sx="${i}" aria-label="Remove this source"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.close}</svg></button></div>`}).join('')}
// Add source (2.28.0): a menu with the project's stamps and texts, and "Motif from the library…", which opens the Motifs panel's folder tree: the next motif clicked
// there becomes a source of this pattern and the Pattern panel comes back (Esc lets go). It replaces one dropdown of every motif in the library (464 of them).
function patAddSrc(p,src){const q=patList().find(x=>x.u===p.u);if(!q)return;q.src=q.src||[];q.src.push(src);WBS.patSel=q.u;patCh()}
function patAddMenu(){const p=patCur(),b=$('peadd');if(!p||!b)return;const L=fpL(),tx=L?(L.pl||[]).filter(q=>q.k=='text'||(q.tx!=null&&q.k!='pattern')):[];
 const items=WBS.tiles.map(t=>[patHx(stNmId(t.id)),()=>patAddSrc(p,{k:'stamp',t:t.id,w:1})]).concat(tx.map(q=>[patHx(String((q.tx&&q.tx.text)||'Text').replace(/\n/g,' ').slice(0,24)),()=>{const{u,x,y,s,r,f,k:_k,g,...it}=q;patAddSrc(p,{k:'text',w:1,it:JSON.parse(JSON.stringify(it))})}]));
 // 2.76.10: the layer's other patterns (one level deep: a pattern that prints a pattern is not offered)
 (L?(L.pl||[]):[]).filter(q=>q.k=='pattern'&&q.u!==p.u&&!(q.src||[]).some(x=>x.k=='pattern')).forEach(q=>items.push([patHx(q.n||'Pattern'),()=>patAddSrc(p,{k:'pattern',p:q.u,w:1})]));
 items.push(['Shape from the library…',()=>{WBX.wbLibPick=m=>{WBX.wbLibPick=null;patAddSrc(p,{k:'motif',m,w:1});if(WBX.wbOpenPanel)WBX.wbOpenPanel('layers');pmsg('Added '+mNm(m)+' to '+p.n+'.')};if(WBX.wbOpenPanel)WBX.wbOpenPanel('motifs');pmsg('Choose a shape for '+p.n+'.')}]);
 rowMenu(b,items)}
function init67(){
elExtend('pattern',{expand:patExpand,name:q=>q.n});
if(!$('pelist'))return;
$('penew').onclick=()=>{const L=fpL();if(!L)return;L.pl=L.pl||[];const n=patList().length+1,q={u:fpU(),k:'pattern',n:'Pattern '+n,lay:'grid',...patStart(),sz:100,rt:0,ds:'cycle',sd:1+Math.floor(Math.random()*9998),src:[],x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:Math.min(CW,CH),r:0,f:1};L.pl.push(q);WBS.patSel=q.u;patCh()};
$('pelist').onclick=e=>{const L=fpL();if(!L)return;WBS.patSrc=null;const d=e.target.closest('[data-pd]');if(d){const i=L.pl.findIndex(q=>q.u==d.dataset.pd);if(i>=0){L.pl.splice(i,1);if(WBS.patSel==d.dataset.pd)WBS.patSel=null;patCh()}return}const r=e.target.closest('[data-pe]');if(r){WBS.patSel=r.dataset.pe;patSync();}};
const set=(f,v)=>{const p=patCur();if(!p)return;if(p[f]===v)return;p[f]=v;patCh()};
$('pelay').onclick=e=>{const b=e.target.closest('[data-l]');if(b){set('lay',b.dataset.l);$('peinr').hidden=b.dataset.l!='frame'}};
// ---- Edit pieces (2.76.10, owner Oct 29 2026: delete, swap, recolour, move and turn one piece, and make it its own element). WBS.patPE: the pattern whose pieces
// are being edited; WBS.patPc: the key of the piece picked; p.pe[key]: that piece's edit, kept with its place. A drag moves the piece; one history step a change.
const patPcSet=(f)=>{const p=patCur(),k=WBS.patPc;if(!p||k==null)return;p.pe=p.pe||{};const E={...(p.pe[k]||{})};f(E);Object.keys(E).forEach(x=>{if(E[x]==null||E[x]===''||E[x]===0)delete E[x]});if(Object.keys(E).length)p.pe[k]=E;else delete p.pe[k];if(!Object.keys(p.pe).length)delete p.pe;patCh()};
const patPcItem=p=>WBS.patPc==null?null:patItems(p).find(o=>o.pk===WBS.patPc)||null;
WBX.wbPatPieceDown=(x,y)=>{const p=patCur();if(!p||WBS.patPE!==p.u||String(WBS.fpSel)!==String(p.u))return false;let best=null,bd=1e9;for(const o of patItems(p)){const d=Math.hypot(+o.x-x,+o.y-y),r=Math.max(4,(+o.s||0)*(o.k=='motif'?.8:.6));if(d<=r&&d<bd){bd=d;best=o}}
 if(!best)return false;WBS.patPc=best.pk;const E=p.pe&&p.pe[best.pk]||{};WBS.patPD={k:best.pk,x0:x,y0:y,dx0:+E.dx||0,dy0:+E.dy||0,moved:false};upd();patSync();return true};
let patPR=0;WBX.wbPatPieceMove=(x,y)=>{const D=WBS.patPD,p=patCur();if(!D||!p)return false;p.pe=p.pe||{};const E=p.pe[D.k]=p.pe[D.k]||{};E.dx=+(D.dx0+x-D.x0).toFixed(2);E.dy=+(D.dy0+y-D.y0).toFixed(2);D.moved=true;if(!patPR)patPR=requestAnimationFrame(()=>{patPR=0;upd()});return true};
WBX.wbPatPieceUp=()=>{const D=WBS.patPD;if(!D)return false;WBS.patPD=null;if(D.moved){const p=patCur();if(p&&p.pe&&p.pe[D.k]){const E=p.pe[D.k];if(!E.dx)delete E.dx;if(!E.dy)delete E.dy;if(!Object.keys(E).length)delete p.pe[D.k]}patCh()}return true};
WBX.wbPatPieceOv=L=>{const p=patCur();if(!p||WBS.patPE!==p.u||WBS.patPc==null||!(L.pl||[]).includes(p))return'';const o=patPcItem(p);return o&&WBX.wbFpBox?WBX.wbFpBox(o,'sel'):''};
$('pepe').addEventListener('change',()=>{const p=patCur();if(!p)return;WBS.patPE=$('pepe').checked?p.u:null;WBS.patPc=null;upd();patSync()});
$('pepsrc').addEventListener('change',()=>{const v=$('pepsrc').value;patPcSet(E=>{E.s=v===''?null:+v})});
$('pepcol').addEventListener('change',()=>{const v=$('pepcol').value;patPcSet(E=>{E.c=v||null})});
$('pepdr').addEventListener('input',()=>{if(WBS.fpSyncing)return;const v=+$('pepdr').value,p=patCur(),k=WBS.patPc;if(!p||k==null||((p.pe&&p.pe[k]&&+p.pe[k].dr)||0)===v)return;patPcSet(E=>{E.dr=v})});
$('pepdel').onclick=()=>{patPcSet(E=>{Object.keys(E).forEach(x=>delete E[x]);E.d=1});WBS.patPc=null;patSync()};
$('peprs').onclick=()=>patPcSet(E=>{Object.keys(E).forEach(x=>delete E[x])});
// Make its own element: the piece leaves the pattern and becomes an ordinary element (a stamp, shape or text) at the same place, size, turn and colour, just above
// the pattern; its place in the pattern stays empty. One history step.
$('pepown').onclick=()=>{const p=patCur(),L=fpL(),k=WBS.patPc;if(!p||!L||k==null)return;const o=patPcItem(p);if(!o||o.k=='pattern')return;
 const{pu,pk,wk,clp,cwk,pin,u,...rest}=JSON.parse(JSON.stringify(o)),q={...rest,u:fpU()};if(q.k=='text'){q.n=+q.s||q.n}
 const a=L.pl;a.splice(a.indexOf(p)+1,0,q);p.pe=p.pe||{};p.pe[k]={d:1};WBS.patPc=null;WBS.patPE=null;WBS.fpSel=q.u;WBS.fpMS=new Set();WBS.fpAnc=q.u;patCh();pmsg('The piece is now its own element.')};
$('peac').addEventListener('change',()=>{const p=patCur();if(!p)return;if($('peac').checked)p.ac={on:1,s:Math.max(0,(p.src||[]).length-1),z:40};else delete p.ac;patCh()});
$('peacs').addEventListener('change',()=>{const p=patCur();if(!p||!p.ac)return;p.ac.s=+$('peacs').value;patCh()});
$('peacz').addEventListener('input',()=>{const p=patCur();if(!p||!p.ac)return;const v=+$('peacz').value;if(p.ac.z!==v){p.ac.z=v;patCh()}});
$('pepin').addEventListener('change',()=>{const p=patCur();if(!p)return;const v=$('pepin').value;if(v)p.pin=v;else delete p.pin;patCh()});
$('pedm').onclick=e=>{const b=e.target.closest('[data-d]'),p=patCur();if(!b||!p)return;const v=b.dataset.d;if((p.dm||'')===v)return;if(v){p.dm=v;if(v=='img'&&!p.da){const a=Object.keys(WBS.ARTS||{})[0];if(a)p.da=a}}else delete p.dm;patCh()};
$('peda').addEventListener('change',()=>{const p=patCur();if(!p)return;const v=$('peda').value;if(v&&p.da!==v){p.da=v;patCh()}});
$('pedk').onclick=e=>{const b=e.target.closest('[data-k]'),p=patCur();if(!b||!p)return;const v=b.dataset.k;if((p.dk||'size')===v)return;if(v=='size')delete p.dk;else p.dk=v;patCh()};
$('pedi').addEventListener('change',()=>{const p=patCur();if(!p)return;if($('pedi').checked)p.di=1;else delete p.di;patCh()});
$('peeg').onclick=e=>{const b=e.target.closest('[data-e]'),p=patCur();if(!b||!p)return;const v=b.dataset.e;if((p.ed||'cut')===v)return;if(v=='whole')p.ed='whole';else delete p.ed;patCh()};
$('pepc').onclick=e=>{const b=e.target.closest('[data-c]'),p=patCur();if(!b||!p)return;const v=b.dataset.c;if((p.pcm||'')===v)return;if(v){p.pcm=v;const ts=(WBS.proj.ts||[]).map(id=>'@'+id);p.pcc=ts.length?ts:[WBS.proj.ink]}else{delete p.pcm;delete p.pcc}patCh()};   // the colours are the tray's, taken when the choice is made
// 2.76.6: once the canvas has a physical size, a piece's size can be given in its unit (2 in, 50 mm); it sets Size (the % of the canvas's short side)
$('pepu').addEventListener('change',()=>{const p=patCur(),v=+$('pepu').value,S=physToCv(v);if(!p||!(S>0))return;const ps=+Math.max(1,Math.min(100,S/Math.min(CW,CH)*100)).toFixed(2);if(ps>60){pmsg('That is larger than a piece can be on this canvas.');patSync();return}if(p.ps!==ps){p.ps=ps;patCh()}});
$('peov').addEventListener('change',()=>{const p=patCur();if(!p)return;if($('peov').checked)p.ov=1;else delete p.ov;patCh()});
$('peds').onclick=e=>{const b=e.target.closest('[data-d]');if(b)set('ds',b.dataset.d)};
$('pets').addEventListener('change',()=>{const p=patCur();if(!p)return;const v=$('pets').value;if((p.ts||'auto')!==v){p.ts=v;delete p.ar;patCh()}});
$('pear').addEventListener('change',()=>{const p=patCur();if(!p)return;const v=$('pear').value;if(p.ar!==v){p.ar=v;patCh()}});
[['peps','ps'],['pesp','sp'],['pecn','cn'],['pern','rn'],['pesz','sz'],['pert','rt'],['peox','ox'],['peoy','oy'],['pein','in'],['peiv','iv'],['pemd','md'],['pemg','mg'],['pedv','dv'],['pedg','dg']].forEach(([id,f])=>$(id).addEventListener('input',()=>{const p=patCur();if(!p)return;const v=+$(id).value;if(p[f]!==v){p[f]=v;patCh()}}));
$('pesd').onclick=()=>{const p=patCur();if(p){p.sd=1+Math.floor(Math.random()*9998);patCh()}};
// "Add element" (2.4.0): one list of everything a pattern can place: the stamps, the motifs of the library, and the text on the canvas
$('peadd').onclick=e=>{e.stopPropagation();patAddMenu()};
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&WBX.wbLibPick){WBX.wbLibPick=null;pmsg('')}},true);
// 2.31.0: a click on a motif source picks it: the Width and height, Fill and Outline groups come under the sources and set that source's look (79-motif-look.js)
$('pesrc').onclick=e=>{const p=patCur(),x=e.target.closest('[data-sx]');if(p&&x){p.src.splice(+x.dataset.sx,1);WBS.patSrc=null;patCh();return}const r=e.target.closest('[data-look]');if(p&&r&&!e.target.closest('input')){const i=+r.dataset.si;WBS.patSrc=WBS.patSrc===i?null:i;patSync();if(WBX.wbMfSync)WBX.wbMfSync()}};
$('pesrc').addEventListener('change',e=>{const p=patCur(),w=e.target.closest('[data-sw]');if(p&&w){p.src[+w.dataset.sw].w=Math.max(1,Math.min(99,Math.round(+w.value||1)));patCh()}});
WBX.wbPatSync=patSync;WBX.wbPatArrows=patArrows;patSync()}
export {init67,patCanMake,patCur,patExpand,patItems,patMakeFrom,patPts,patPut,patSrcNow,patStart,patSync,patNew};
