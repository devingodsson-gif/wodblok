import {cmdRegister} from '../commands/registry.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,bk} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpGrp} from './24-free-place-layers.js';
import {fpWH} from './25-art-layers.js';
// ===== Align: snap the selected items of a Free place, Pictures or Text layer to a spot in their area =====
// The area is the canvas (the tile on a repeat tile); on a book cover it is the region the selection sits in (back cover, spine
// or front cover), inside the safe area. Several selected items move as one group and keep their spacing.
const ALN=['Top left','Top centre','Top right','Middle left','Centre','Middle right','Bottom left','Bottom centre','Bottom right'];
function alBox(p){const wh=fpWH(p);if(!wh)return null;const r=(+p.r||0)*Math.PI/180,c=Math.abs(Math.cos(r)),s=Math.abs(Math.sin(r)),hw=(wh[0]*c+wh[1]*s)/2,hh=(wh[0]*s+wh[1]*c)/2;return{p,x0:p.x-hw,x1:p.x+hw,y0:p.y-hh,y1:p.y+hh}}
function alBounds(bs){return{x0:Math.min(...bs.map(b=>b.x0)),x1:Math.max(...bs.map(b=>b.x1)),y0:Math.min(...bs.map(b=>b.y0)),y1:Math.max(...bs.map(b=>b.y1))}}
function alArea(bb){if(!WBS.book.on)return{x0:0,x1:CW,y0:0,y1:CH};const g=bk(),u=CW/g.W,b=g.b*u,tw=g.tw*u,sw=g.sw*u,th=g.th*u,sf=.125*u,ss=.0625*u,cx=(bb.x0+bb.x1)/2;
 const R=[[b,b+tw,sf],[b+tw,b+tw+sw,ss],[b+tw+sw,b+2*tw+sw,sf]].filter(r=>r[1]-r[0]>0),r=R.find(q=>cx>=q[0]&&cx<=q[1])||R.reduce((a,q)=>Math.abs((q[0]+q[1])/2-cx)<Math.abs((a[0]+a[1])/2-cx)?q:a);
 return{x0:r[0]+r[2],x1:r[1]-r[2],y0:b+sf,y1:b+th-sf}}
function alItems(){const L=WBS.layers[WBS.selL];if(!L||!L.free)return[];return fpGrp().map(alBox).filter(Boolean)}
const alMargin=()=>+($('lalm')||{value:0}).value||0;
function alDone(){store();upd();if(WBX.wbCap)WBX.wbCap()}
function alTo(fx,fy){const bs=alItems();if(!bs.length)return;const bb=alBounds(bs),A=alArea(bb),m=alMargin()/100*Math.min(A.x1-A.x0,A.y1-A.y0);let dx=0,dy=0;
 if(fx!=null)dx=fx==0?A.x0+m-bb.x0:fx==1?A.x1-m-bb.x1:(A.x0+A.x1)/2-(bb.x0+bb.x1)/2;
 if(fy!=null)dy=fy==0?A.y0+m-bb.y0:fy==1?A.y1-m-bb.y1:(A.y0+A.y1)/2-(bb.y0+bb.y1)/2;
 if(!dx&&!dy)return;bs.forEach(b=>{b.p.x+=dx;b.p.y+=dy});alDone()}
function alSpread(ax){const bs=alItems();if(bs.length<3)return;const lo=ax=='x'?'x0':'y0',hi=ax=='x'?'x1':'y1',k=ax,s=bs.slice().sort((a,b)=>(a[lo]+a[hi])-(b[lo]+b[hi]));const first=s[0],last=s[s.length-1],total=last[hi]-first[lo],sum=s.reduce((t,b)=>t+(b[hi]-b[lo]),0),gap=(total-sum)/(s.length-1);let pos=first[hi]+gap,ch=false;
 for(let i=1;i<s.length-1;i++){const b=s[i],d=pos-b[lo];if(Math.abs(d)>1e-6){b.p[k]+=d;ch=true}pos+=(b[hi]-b[lo])+gap}if(ch)alDone()}
function alSync(){const n=alItems().length,g=$('lalsec');if(!g)return;g.querySelectorAll('button').forEach(b=>{b.disabled=b.dataset.k=='d'?n<3:!n})}
const alIc=b=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
function init58(){
 const g=$('lalg');if(!g)return;
 g.innerHTML=ALN.map((t,i)=>{const r=Math.floor(i/3),c=i%3;return`<button type="button" id="al_${r}${c}" data-k="a" data-x="${c/2}" data-y="${r/2}" disabled aria-label="${t}" title="${t}">${alIc(`<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><rect x="${5+c*4.5}" y="${5+r*4.5}" width="5" height="5" rx="1" fill="currentColor" fill-opacity=".55"/>`)}</button>`}).join('');
 g.onclick=e=>{const b=e.target.closest('button[data-k="a"]');if(b&&!b.disabled)alTo(+b.dataset.x,+b.dataset.y)};
 const X=[['al_ch','Centre across','c','x',alIc('<path d="M12 3.5v17" stroke-dasharray="2.4 2.6"/><rect x="6" y="9.5" width="12" height="5" rx="1.2"/>'),()=>alTo(.5,null)],
  ['al_cv','Centre down','c','y',alIc('<path d="M3.5 12h17" stroke-dasharray="2.4 2.6"/><rect x="9.5" y="6" width="5" height="12" rx="1.2"/>'),()=>alTo(null,.5)],
  ['al_dh','Distribute across','d','x',alIc('<path d="M4 4v16M20 4v16"/><rect x="9.5" y="8" width="5" height="8" rx="1.2"/>'),()=>alSpread('x')],
  ['al_dv','Distribute down','d','y',alIc('<path d="M4 4h16M4 20h16"/><rect x="8" y="9.5" width="8" height="5" rx="1.2"/>'),()=>alSpread('y')]];
 const row=$('lalr');row.innerHTML=X.map(([id,t,k,,svg])=>`<button class="ib" type="button" id="${id}" data-k="${k}" disabled aria-label="${t}" title="${t}">${svg}</button>`).join('');
 X.forEach(([id,,,,,fn])=>{$(id).onclick=fn});
 const cmds=[...ALN.map((t,i)=>['align.'+i,'Align: '+t,'al_'+Math.floor(i/3)+(i%3)]),...X.map(([id,t])=>['align.'+id.slice(3),'Align: '+t,id])];
 for(const [id,label,elId] of cmds)cmdRegister({id,label,elId,enabled:()=>{const b=$(elId);return!!b&&!b.hidden&&!b.disabled},run:()=>$(elId).click()});
 WBX.alSync=alSync;
}
export {init58};
