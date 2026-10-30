import {$,WBS,WBX,uiFire} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL} from './24-free-place-layers.js';
import {patCur} from './67-pattern-element.js';
import {elSel} from './65-element-core.js';
import {shBox,shFlat,basicSh} from './76-basic-shapes.js';
import {mNm} from './21-motif-library-ui.js';

// ===== Map to shape (2.3.3): a Text or a Pattern can follow the outline of a Shape element, or sit inside it. 2.31.0: of a Basic shapes motif (the Shape element is gone). They stay free until one is chosen.
// Text and Pattern fields: mp = the Shape's id, mm = 'on' (follow the outline) | 'in' (inside it), mo = where it starts, in % of the way round (-50 to 50), mc = how many along the outline (Pattern).
// The Shape stays where it is and keeps its own look; deleting the Shape sets the mapping aside (the element is free again, mp is ignored).
// Following the outline: each letter (or placement) goes to its place on the outline and turns to lie along it; the text stands outside, on the line. Inside: the text is laid out again
// in the widest width that fits the Shape (so it wraps), and a Pattern keeps the placements whose middle is inside. Owner, Oct 20 2026.
const mapOk=q=>q&&q.k=='motif'&&!q.bgd&&!!basicSh(q.m);
const mapShape=p=>{if(!p||!p.mp||!p.mm)return null;const L=fpL();if(!L)return null;const s=(L.pl||[]).find(q=>q.u==p.mp&&mapOk(q));return s||null};
const mapList=()=>{const L=fpL();return L?(L.pl||[]).filter(mapOk):[]};
const mapName=(q,i)=>(q.nm||mNm(q.m)||'Shape')+' '+(i+1);
// where the way round starts: the highest point of a closed shape, the middle of an open one; mo moves it
function mapRef(F,mo){let s0=F.L/2;if(F.closed){let b=0;F.pts.forEach((q,i)=>{if(q[1]<F.pts[b][1]-1e-6)b=i});s0=F.cum[b]}return s0+(+mo||0)/100*F.L}
// the point and the turn (degrees) at a length along the outline
function mapAt(F,s){const n=F.pts.length;if(F.closed){s=((s%F.L)+F.L)%F.L}else s=Math.max(0,Math.min(F.L,s));
 let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(F.cum[m]<=s)lo=m;else hi=m}
 let a=F.pts[lo],b=F.pts[F.closed&&lo==n-1?0:Math.min(lo+1,n-1)];if(F.closed&&s>=F.cum[n-1]){a=F.pts[n-1];b=F.pts[0]}
 const seg=Math.hypot(b[0]-a[0],b[1]-a[1])||1,t=Math.max(0,Math.min(1,(s-F.cum[lo])/seg));
 return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,a:Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI}}
const inPoly=(pts,x,y)=>{let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
// a Pattern's placements on a Shape: {pts, cell, rot} or null (then it is free)
function mapPts(p,S){const F=shFlat(S);if(!F)return null;
 if(p.mm=='on'){const n=Math.max(2,Math.min(300,Math.round(+p.mc||24))),s0=mapRef(F,p.mo),pts=[],rot=[];for(let i=0;i<n;i++){const q=mapAt(F,s0+i/n*F.L);pts.push([q.x,q.y]);rot.push(q.a)}return{pts,cell:Math.max(4,F.L/n),rot}}
 if(!F.closed)return null;
 const[bw,bh]=shBox(S),cn=Math.max(1,Math.min(40,+p.cn|0||1)),rn=Math.max(1,Math.min(40,+p.rn|0||1)),f=+S.f||1,r=(+S.r||0)*Math.PI/180,c=Math.cos(r),sn=Math.sin(r),pts=[],rot=[];
 for(let j=0;j<rn;j++)for(let i=0;i<cn;i++){const lx=-bw/2+(i+.5)*bw/cn,ly=-bh/2+(j+.5)*bh/rn,X=(+S.x||0)+lx*f*c-ly*sn,Y=(+S.y||0)+lx*f*sn+ly*c;if(inPoly(F.pts,X,Y)){pts.push([X,Y]);rot.push(0)}}
 return{pts,cell:Math.min(bw/cn,bh/rn),rot}}
// a text following the outline: a function that moves a letter (x, y, turn in text units, k = canvas units per text unit, bh = the text's height) to the canvas, or null
function mapText(p,S){const F=shFlat(S);if(!F)return null;const k0=p.s/Math.max(p.n||1,.01),bw=Math.max(.01,+p.bw||1),k=k0*Math.min(1,(F.closed?.9:1)*F.L/(bw*k0)),s0=mapRef(F,p.mo),bh=+p.bh||0;   // the text never runs past the end of the outline: it shrinks to fit
 const fn=(x,y,r)=>{const q=mapAt(F,s0+x*k),th=q.a*Math.PI/180,d=(bh/2-y)*k;return[q.x+Math.sin(th)*d,q.y-Math.cos(th)*d,q.a+r]};fn.k=k;return fn}
const mapBox=S=>{const F=shFlat(S);if(!F)return{x:0,y:0,W:CW,H:CH};let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;F.pts.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])});const m=Math.max(CW,CH)*.1;return{x:x0-m,y:y0-m,W:x1-x0+2*m,H:y1-y0+2*m}};

// ---- Inside: lay the text out again in the widest width the Shape allows
const chord=(pts,y)=>{const xs=[];for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>y)!=(b[1]>y))xs.push((b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])}return xs.length>1?Math.max(...xs)-Math.min(...xs):0};
const DONE=new Map();let TOK=0;
async function mapFit(p,S,key){const F=shFlat(S,true);if(!F||!F.closed||!p.tx||!p.tx.text)return;const tok=++TOK,k0=p.s/Math.max(p.n||1,.01);let ys=F.pts.map(q=>q[1]),sh=Math.max(...ys)-Math.min(...ys),kk=k0,W=Math.max(8,chord(F.pts,0)*.7),R=null,wd=0;
 // the letters keep their size unless the text would not fit: then they shrink until it does
 for(let it=0;it<10;it++){const g=p.tx.wd>0?p.tx.wd:50,R1=await WBX.wbTxLay({...p.tx,wd:g});if(tok!==TOK||!R1)return;wd=g*(W/kk)/R1.bw;R=await WBX.wbTxLay({...p.tx,wd});if(tok!==TOK||!R)return;
  const H=R.bh*kk,Wn=Math.max(8,Math.min(chord(F.pts,H/2),chord(F.pts,-H/2))*.92);if(H<=sh*.72&&!R.over&&Wn>=W*.95)break;kk*=H>sh*.72||R.over?.85:1;W=Wn}
 const L=fpL();if(!L||!(L.pl||[]).includes(p))return;
 p.tx={...p.tx,wd:+wd.toFixed(3)};p.G=R.G;p.Lt=R.Lt;p.bw=R.bw;p.bh=R.bh;p.n=Math.max(R.bw,R.bh);p.s=+(kk*p.n).toFixed(2);p.x=+(+S.x||0).toFixed(1);p.y=+(+S.y||0).toFixed(1);p.r=+(+S.r||0).toFixed(2);DONE.set(String(p.u),fitKey(p,S));store();upd()}
const fitKey=(p,S)=>JSON.stringify([S.m,S.x,S.y,S.s,S.wx,S.wy,S.r,S.f,{...p.tx,wd:0},+(p.s/Math.max(p.n||1,.01)).toFixed(3)]);

// ---- the panels (a "Map to shape" group in Text and in Pattern)
const GR={tx:{g:'mt_g',s:'mt_s',m:'mt_m',o:'mt_o',or:'mt_or',c:null,cr:null,cur:()=>{const q=elSel();return q&&q.tx?q:null}},
 pa:{g:'mp_g',s:'mp_s',m:'mp_m',o:'mp_o',or:'mp_or',c:'mp_c',cr:'mp_cr',cur:()=>patCur()}};
const mapCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
function mapSync(){Object.values(GR).forEach(G=>{const g=$(G.g);if(!g)return;const p=G.cur(),show=!!p&&mapList().length>0||!!p&&!!p.mp;if(g.hidden===show)g.hidden=!show;if(!p)return;
  const S=mapShape(p),sel=$(G.s),sh=mapList(),key=sh.map((q,i)=>q.u+mapName(q,i)).join('|')+'#'+(p.mp||'');
  if(sel.dataset.k!=key){sel.dataset.k=key;sel.innerHTML='<option value="">Free</option>'+sh.map((q,i)=>`<option value="${String(q.u).replace(/"/g,'')}">${mapName(q,i)}</option>`).join('')}
  const v=S?String(S.u):'';if(sel.value!==v)sel.value=v;
  const mm=S?p.mm:'';$(G.m).hidden=!S;$(G.m).querySelectorAll('[data-m]').forEach(b=>{const on=b.dataset.m==mm;if(b.getAttribute('aria-pressed')!=String(on)){b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on)}});
  const so=$(G.or);if(so.hidden!==!(S&&mm=='on'))so.hidden=!(S&&mm=='on');if(S&&mm=='on'){const o=$(G.o);if(+o.value!==(+p.mo||0)){o.value=+p.mo||0;uiFire(o)}}
  if(G.c){const cr=$(G.cr);if(cr.hidden!==!(S&&mm=='on'))cr.hidden=!(S&&mm=='on');if(S&&mm=='on'){const c=$(G.c);if(+c.value!==(+p.mc||24)){c.value=+p.mc||24;uiFire(c)}}}
 });
 // a Text inside a Shape follows it: lay out again when the Shape or the text changed
 const L=fpL();if(!L)return;(L.pl||[]).forEach(p=>{if(p.mm!='in'||!p.tx)return;const S=mapShape(p);if(!S)return;const k=fitKey(p,S);if(DONE.get(String(p.u))!==k){DONE.set(String(p.u),k);mapFit(p,S,k)}})}
function init77(){
 Object.entries(GR).forEach(([kind,G])=>{
  const sel=$(G.s);if(!sel)return;
  const set=(f)=>{const p=G.cur();if(!p)return;f(p);mapCh();mapSync()};
  sel.onchange=()=>set(p=>{if(!sel.value){delete p.mp;delete p.mm;DONE.delete(String(p.u))}else{p.mp=sel.value;if(!p.mm)p.mm='on'}});
  $(G.m).onclick=e=>{const b=e.target.closest('[data-m]');if(b)set(p=>{p.mm=b.dataset.m;DONE.delete(String(p.u))})};
  $(G.o).addEventListener('input',()=>{if(WBS.uiLoad)return;const p=G.cur();if(!p)return;const v=+$(G.o).value;if((+p.mo||0)===v)return;p.mo=v;store();upd()});
  if(G.c)$(G.c).addEventListener('input',()=>{if(WBS.uiLoad)return;const p=G.cur();if(!p)return;const v=+$(G.c).value;if((+p.mc||24)===v)return;p.mc=v;store();upd()});
  [G.o,G.c].forEach(id=>{if(id)$(id).addEventListener('change',()=>{if(WBX.wbCap)WBX.wbCap()})})});
 WBX.wbMapSync=mapSync}
export {init77,mapAt,mapBox,mapPts,mapShape,mapText,mapSync};
