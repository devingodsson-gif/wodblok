import {$,WBS,WBX} from './01-launch-and-version.js';
import {DRS} from './03-stamp-prints-and-drawing.js';
import {CH,CW,col,geom,rng,shOf,okC} from './04-canvas-and-stamp-outlines.js';
import {inkOf} from './06-motif-library-folders.js';
import {gModel,gNear} from './08-grid-shapes.js';
import {bhStrip,flipVOk,turnFit} from './10-layer-grids.js';
import {eNV,eT,pressDefs,upd} from './11-pressure-flooding-block-edges.js';
import {fxJit,fxPress,fxTex} from './69-effect-stack.js';

function tGrp(){const g=WBS.tiles.map((t,i)=>i).filter(i=>WBS.tM.has(WBS.tiles[i].id));return g.length>1&&WBS.tiles[WBS.cur]&&WBS.tM.has(WBS.tiles[WBS.cur].id)?g:[WBS.cur]}
function fpGrp(){const L=fpL();if(!L)return[];const pl=L.pl||[];if(WBS.fpMS.size>1&&WBS.fpMS.has(String(WBS.fpSel))){const g=pl.filter(q=>WBS.fpMS.has(String(q.u)));if(g.length>1)return g}const p=pl.find(q=>q.u==WBS.fpSel);return p?[p]:[]}
function fpPoolOk(){return!!(WBS.fpB&&WBS.fpPool.size>1&&WBS.fpPool.has(String(WBS.fpB)))}
function fpTog(u){u=String(u);let cur=fpGrp().map(q=>String(q.u));if(!cur.length&&WBS.fpSel!==-1)cur=[String(WBS.fpSel)];const st=new Set(cur);if(st.has(u)){st.delete(u);WBS.fpSel=st.size?[...st][st.size-1]:-1}else{st.add(u);WBS.fpSel=u}WBS.fpMS=st;WBS.fpAnc=u;WBS.fpB=null;WBS.fpGhost=null;upd()}
function fpRange(u){u=String(u);const L=fpL();if(!L)return;const order=(L.pl||[]).slice().reverse().map(q=>String(q.u)),a0=WBS.fpAnc!=null&&order.includes(String(WBS.fpAnc))?String(WBS.fpAnc):(WBS.fpSel!==-1?String(WBS.fpSel):u),a=order.indexOf(a0),b=order.indexOf(u);if(a<0||b<0){WBS.fpMS=new Set();WBS.fpSel=u;WBS.fpAnc=u;upd();return}WBS.fpMS=new Set(order.slice(Math.min(a,b),Math.max(a,b)+1));WBS.fpSel=u;WBS.fpB=null;WBS.fpGhost=null;upd()}
function fpPick(k,e,order,art){const same=!WBS.fpB||(typeof WBS.fpB=='string')==!!art;let cur=!same?[]:fpPoolOk()?[...WBS.fpPool]:(WBS.fpB?[String(WBS.fpB)]:[]);if(e.shiftKey&&WBS.fpPA!=null&&order.includes(WBS.fpPA)){const a=order.indexOf(WBS.fpPA),b=order.indexOf(k);cur=order.slice(Math.min(a,b),Math.max(a,b)+1)}else{const st=new Set(cur);st.has(k)?st.delete(k):st.add(k);cur=[...st];WBS.fpPA=k}WBS.fpPool=new Set(cur);if(!cur.length)WBS.fpB=null;else{const pk=cur.includes(String(WBS.fpB))?String(WBS.fpB):cur[cur.length-1];WBS.fpB=art?pk:+pk}WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpLast=null;upd()}
// snapping: one switch for the whole pattern, in the Grid tool (WBS.pgrid.snap, .ss for snapping sizes); the same grid is used by every Free place, Pictures and Text layer
const pgSnap=()=>!!WBS.pgrid.snap,pgSs=()=>!!WBS.pgrid.ss;
const fpFG=L=>({snap:pgSnap(),ss:pgSs(),show:WBS.pgrid.show,n:WBS.pgrid.n,m:WBS.pgrid.m});
const fpCell=L=>CW/Math.max(2,fpFG(L).n);
function fpSnap(L,x,y,e,force){const g=fpFG(L);if(!force&&(!g.snap||(e&&e.altKey)))return[x,y];if(WBS.pgrid.sh&&WBS.pgrid.sh!='rect'){const M=gModel(WBS.pgrid.sh,CW,CH,Math.max(2,WBS.pgrid.n),false),b=gNear((g.m!='l'?M.cents:[]).concat(g.m!='c'?M.verts:[]),x,y,CW,CH,false);if(b)return[b[0],b[1]]}
 const c=fpCell(L),cand=[];if(g.m!='l')cand.push([(Math.floor(x/c)+.5)*c,(Math.floor(y/c)+.5)*c]);if(g.m!='c')cand.push([Math.round(x/c)*c,Math.round(y/c)*c]);let b=cand[0],bd=1e18;cand.forEach(q=>{const d=(q[0]-x)**2+(q[1]-y)**2;if(d<bd){bd=d;b=q}});return b}
function fpSnapS(L,sz,e,force){const g=fpFG(L);if(!force&&(!g.snap||!g.ss||(e&&e.altKey)))return sz;const c=fpCell(L);return Math.max(c,Math.round(sz/c)*c)}
function fpGridDraw(){const g=$('fpgrid');if(!g)return;const on=WBS.pgrid.show&&!$('boardP').classList.contains('off');if(!on){if(g.dataset.k){g.innerHTML='';g.dataset.k=''}return}
const c=CW/Math.max(2,WBS.pgrid.n),k=CW+'x'+CH+'x'+WBS.pgrid.n+WBS.pgrid.m+WBS.pgrid.op+(WBS.pgrid.sh||'rect');if(g.dataset.k==k)return;g.dataset.k=k;
if(WBS.pgrid.sh&&WBS.pgrid.sh!='rect'){const M=gModel(WBS.pgrid.sh,CW,CH,Math.max(2,WBS.pgrid.n),false),a=c*.09,mk=[],rv=['rrect','circle','oval','arch'].includes(WBS.pgrid.sh)?M.verts:[],pm=WBS.pgrid.m=='c'?M.cents:WBS.pgrid.m=='b'?M.cents.concat(rv):rv;pm.forEach(q=>{if(q[0]>=0&&q[0]<=CW&&q[1]>=0&&q[1]<=CH)mk.push(`M${(q[0]-a).toFixed(2)} ${q[1].toFixed(2)}h${(2*a).toFixed(2)}M${q[0].toFixed(2)} ${(q[1]-a).toFixed(2)}v${(2*a).toFixed(2)}`)});
 const all=M.items.join('')+mk.join(''),w=Math.max(CW,CH)/900,o=WBS.pgrid.op/100;g.innerHTML=`<clipPath id="pgclip"><rect width="${CW}" height="${CH}"/></clipPath><g clip-path="url(#pgclip)"><path d="${all}" fill="none" stroke="#fff" stroke-opacity="${(.6*o).toFixed(2)}" stroke-width="${(w*2.6).toFixed(2)}"/><path d="${all}" fill="none" stroke="#2f6bff" stroke-opacity="${(.9*o).toFixed(2)}" stroke-width="${w.toFixed(2)}"/></g>`;return}
let d='',m='';for(let x=0;x<=CW+.01;x+=c)d+=`M${x.toFixed(2)} 0V${CH}`;for(let y=0;y<=CH+.01;y+=c)d+=`M0 ${y.toFixed(2)}H${CW}`;
if(WBS.pgrid.m!='l'){const a=c*.09;for(let y=c/2;y<CH;y+=c)for(let x=c/2;x<CW;x+=c)m+=`M${(x-a).toFixed(2)} ${y.toFixed(2)}h${(2*a).toFixed(2)}M${x.toFixed(2)} ${(y-a).toFixed(2)}v${(2*a).toFixed(2)}`}
const w=Math.max(CW,CH)/900,all=d+m,o=WBS.pgrid.op/100;g.innerHTML=`<path d="${all}" fill="none" stroke="#fff" stroke-opacity="${(.6*o).toFixed(2)}" stroke-width="${(w*2.6).toFixed(2)}"/><path d="${all}" fill="none" stroke="#2f6bff" stroke-opacity="${(.9*o).toFixed(2)}" stroke-width="${w.toFixed(2)}"/>`}
// every layer can hold items (layer update, step 2)
const fpL=()=>WBS.layers[WBS.selL]||null;
const fpU=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const fpSeed=u=>{let h=7;for(const c of String(u))h=(h*31+c.charCodeAt(0))>>>0;return h%100000};
function freeLayer(L,li,pa,lgB){const pl=(L.pl||[]).filter(p=>WBS.tiles.some(t=>t.id==p.t));if(!pl.length)return['',''];const fr=new Map();const amt=0,PR=new Map(),f=v=>v.toFixed(2),ed=li==WBS.selL&&!$('boardP').classList.contains('off');let defs='',out='';const bh=L.bl=='behind',prev=[];
pl.forEach(p=>{const tt=WBS.tiles.find(t=>t.id==p.t),G=geom(shOf(tt)),k=p.s/Math.max(G.SW,G.SH),sd=fpSeed(p.u),R=rng(sd+li*977),r1=R()-.5,r2=R()-.5,r3=R()-.5,r4=R(),pe=fxPress(p),pP=pe?pe.pst:(L.pst||0),pF=pe?pe.pfl:(L.pfl||0),act=!DRS()&&(pP>0||pF>0),pk=pe?li+1000*(1+pP*11+pF):li,pre=act?`#q${pk}_`:'#s',bin=act?Math.floor(rng(sd*7919+li*1299709+13)()*16):0;if(act){let m=PR.get(pk);if(!m)PR.set(pk,m={P:pP,F:pF,need:new Set()});m.need.add(tt.id+'_'+bin)}
let drr=0,dxr=0,dyr=0,sx=1,sy=1,szf=1;{const rR=+L.rrot||0,rP=+L.rpos||0,fH=!!L.rfh,fV=!!L.rfv,tN=!!L.rtn,rZ=Math.max(0,Math.min(100,+L.rsz||0));if(rR||rP||fH||fV||tN||rZ){const Q=rng(sd*15485863+li*7919+(L.rsd|0)*104729+101),u1=Q(),u2=Q(),u3=Q(),u4=Q(),u5=Q(),u6=Q(),u7=Q();if(rZ)szf=1+(u7*2-1)*rZ/100*.6;drr=(u1*2-1)*rR;dxr=(u2*2-1)*rP/100*p.s*.5;dyr=(u3*2-1)*rP/100*p.s*.5;if(fH&&u4<.5)sx=-1;if(fV&&u5<.5&&flipVOk(G))sy=-1;if(tN)drr+=turnFit(G,u6)}}
{const J=fxJit(p);if(J){dxr+=J.dx;dyr+=J.dy;drr+=J.dr;szf*=J.sz;if(J.sx<0)sx=-sx;if(J.sy<0&&flipVOk(G))sy=-sy}}
const ev=Math.floor(rng(sd*104729+li*15485863+(tt.es||0)*31)()*eNV(tt)),tr=`transform="translate(${f(r2*amt*.6+dxr)} ${f(r3*amt*.6+dyr)}) rotate(${(r1*amt+(+p.r||0)+drr).toFixed(2)}) scale(${(k*(p.f||1)*(p.wx||1)*sx*szf).toFixed(4)} ${(k*(p.wy||1)*sy*szf).toFixed(4)}) translate(${-G.SW/2} ${-G.SH/2})"`,op=`opacity="${(1-r4*amt*.03).toFixed(2)}"`,
fxT=p.fx&&p.fx.length?fxTex(p,'fm'+li+'_'+String(p.u).replace(/[^\w-]/g,''),{x:0,y:0,W:G.SW,H:G.SH}):null,trU=fxT?'':tr,inner0=act||DRS()||!eT(tt)?`<use href="${pre}${tt.id}${act?'_'+bin:''}" ${op} ${trU}${WBX.wbGrade&&WBX.wbGrade.stF(tt.id)?` filter="url(#${WBX.wbGrade.stF(tt.id)})"`:''}/>`:`<g ${op} ${trU}${WBX.wbGrade&&WBX.wbGrade.stF(tt.id)?` filter="url(#${WBX.wbGrade.stF(tt.id)})"`:''}><use href="#s${tt.id}"/><use href="#e${tt.id}_${ev}" fill="${inkOf(tt)}"/></g>`;
const inner=fxT?`<g ${tr}${fxT.attrs}>${inner0}</g>`:inner0;if(fxT)defs+=fxT.defs;
const hit=ed?`<rect transform="rotate(${+p.r||0})" x="${f(-G.SW*k/2)}" y="${f(-G.SH*k/2)}" width="${f(G.SW*k)}" height="${f(G.SH*k)}" fill="none" pointer-events="all" style="cursor:move"/>`:'';
const sg=`<g${ed?` data-fp="${p.u}"`:''} transform="translate(${f(+p.x)} ${f(+p.y)})">${hit}${inner}</g>`;
let one=sg;if(bh&&((lgB||'').length||prev.length)){const mid='bhf'+li+'_'+prev.length;defs+=`<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" fill="#fff"/><g filter="url(#bhk)">${bhStrip((lgB||'')+prev.join(''))}</g></mask>`;one=`<g mask="url(#${mid})">${sg}</g>`}out+=one;fr.set(String(p.u),one);prev.push(sg)});
PR.forEach((m,pk)=>{defs+=pressDefs({...L,pst:m.P,pfl:m.F},pk,WBS.tiles,m.need)});
const ink=okC(L.ink)?col(L.ink):'';if(ink)defs+=`<filter id="lk${li}" filterUnits="userSpaceOnUse" x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}" color-interpolation-filters="sRGB"><feFlood flood-color="${ink}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
const lop=L.op!=null?Math.max(0,Math.min(100,+L.op)):100,lbl=L.bl&&L.bl!='behind'&&L.bl!='cancel'&&L.bl!='replace'?L.bl:'',o0=`<g${ink?` filter="url(#lk${li})"`:''}${lop<100?` opacity="${(lop/100).toFixed(2)}"`:''}${lbl?` style="mix-blend-mode:${lbl}"`:''}>`;
// [defs, everything wrapped, the wrapper's open and close tags, each element's own markup by id] (the element list draws them in list order)
return[defs,o0+out+'</g>',o0,'</g>',fr]}
function init24(){// ===== Free-place layers: no arrangement, just stamps put down by hand anywhere on the canvas.
// L.pl = [{u, t: stamp id, x, y (canvas units), s: long side (canvas units), r: degrees, f: 1 | -1}]
WBS.selLM=new Set();WBS.lAnc=null;WBS.tM=new Set();WBS.tAnc=null;WBS.mAnc=null;
WBS.fpMS=new Set();WBS.fpAnc=null;WBS.fpPool=new Set();WBS.fpPA=null;
WBS.CR=null;WBS.fpB=null;WBS.fpSel=-1;WBS.fpDrag=null;WBS.fpGhost=null;WBS.fpXf=null;WBS.fpSyncing=0;WBS.fpTh={};WBS.fpAlt=false;
}
export {pgSnap,pgSs,fpCell,fpFG,fpGridDraw,fpGrp,fpL,fpPick,fpPoolOk,fpRange,fpSnap,fpSnapS,fpTog,fpU,freeLayer,tGrp,init24};
