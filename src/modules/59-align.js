import {ICN,icAlign} from './00-icons.js';
import {cmdRegister} from '../commands/registry.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,bk} from './04-canvas-and-stamp-outlines.js';
import {mk,store} from './06-motif-library-folders.js';
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
function alItems(){const L=WBS.layers[WBS.selL];if(!L)return[];return fpGrp().map(alBox).filter(Boolean)}
const alMargin=()=>+($('lalm')||{value:0}).value||0;
function alDone(){store();upd();if(WBX.wbCap)WBX.wbCap()}
function alTo(fx,fy){const bs=alItems();if(!bs.length)return;const bb=alBounds(bs),A=alArea(bb),m=alMargin()/100*Math.min(A.x1-A.x0,A.y1-A.y0);let dx=0,dy=0;
 if(fx!=null)dx=fx==0?A.x0+m-bb.x0:fx==1?A.x1-m-bb.x1:(A.x0+A.x1)/2-(bb.x0+bb.x1)/2;
 if(fy!=null)dy=fy==0?A.y0+m-bb.y0:fy==1?A.y1-m-bb.y1:(A.y0+A.y1)/2-(bb.y0+bb.y1)/2;
 if(!dx&&!dy)return;bs.forEach(b=>{b.p.x+=dx;b.p.y+=dy});alDone()}
function alSpread(ax){const bs=alItems();if(bs.length<3)return;const lo=ax=='x'?'x0':'y0',hi=ax=='x'?'x1':'y1',k=ax,s=bs.slice().sort((a,b)=>(a[lo]+a[hi])-(b[lo]+b[hi]));const first=s[0],last=s[s.length-1],total=last[hi]-first[lo],sum=s.reduce((t,b)=>t+(b[hi]-b[lo]),0),gap=(total-sum)/(s.length-1);let pos=first[hi]+gap,ch=false;
 for(let i=1;i<s.length-1;i++){const b=s[i],d=pos-b[lo];if(Math.abs(d)>1e-6){b.p[k]+=d;ch=true}pos+=(b[hi]-b[lo])+gap}if(ch)alDone()}
// ===== Stretch to canvas and Fit to canvas (2.37.0, owner Oct 24 2026: "a button that makes them fit to the whole canvas size ... have both options").
// For each selected shape: turned upright and centred, its drawn outline (not its box) made exactly the canvas size (stretch) or as large as fits with its proportions kept (fit).
// The outline is measured once per shape from its own markup, in the shape's 100-unit frame (middle at 0,0).
const OB=new Map();
function alOutline(m){if(OB.has(m))return OB.get(m);let r={x:-50,y:-50,w:100,h:100};
 try{let sv=document.getElementById('alob');if(!sv){sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.id='alob';sv.setAttribute('aria-hidden','true');sv.style.cssText='position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';document.body.appendChild(sv)}
  sv.innerHTML=`<g>${mk(m,'#fff','#000')}</g>`;const b=sv.firstChild.getBBox();if(b.width>.01&&b.height>.01)r={x:b.x,y:b.y,w:b.width,h:b.height};sv.innerHTML=''}catch(e){}
 OB.set(m,r);return r}
const alShapes=()=>fpGrp().filter(p=>p&&p.k=='motif'&&p.m);
function alCanvas(keep){const ps=alShapes();if(!ps.length)return;
 ps.forEach(p=>{const o=alOutline(p.m),s=Math.max(1,+p.s||100);let w=s*(+p.wx||1),h=s*(+p.wy||1);
  if(keep){const k=Math.min(CW/(w*o.w/100),CH/(h*o.h/100));w*=k;h*=k}else{w=CW*100/o.w;h=CH*100/o.h}
  const f=+p.f||1;p.r=0;p.s=+w.toFixed(2);p.wy=+(h/w).toFixed(4);delete p.wx;
  p.x=+(CW/2-f*(o.x+o.w/2)*w/100).toFixed(2);p.y=+(CH/2-(o.y+o.h/2)*h/100).toFixed(2)});
 alDone()}
function alSync(){const n=alItems().length,g=$('lalsec');if(!g)return;g.querySelectorAll('#lalg button,#lalr button').forEach(b=>{b.disabled=b.dataset.k=='d'?n<3:!n});
 const fr=$('lalfit');if(fr){const sh=alShapes().length>0;if(fr.hidden===sh)fr.hidden=!sh;fr.querySelectorAll('button').forEach(b=>{if(b.disabled===sh)b.disabled=!sh})}}
const alIc=b=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
function init59(){
 const g=$('lalg');if(!g)return;
 g.innerHTML=ALN.map((t,i)=>{const r=Math.floor(i/3),c=i%3;return`<button type="button" id="al_${r}${c}" data-k="a" data-x="${c/2}" data-y="${r/2}" disabled aria-label="${t}" title="${t}">${alIc(icAlign(r,c))}</button>`}).join('');
 g.onclick=e=>{const b=e.target.closest('button[data-k="a"]');if(b&&!b.disabled)alTo(+b.dataset.x,+b.dataset.y)};
 const X=[['al_ch','Centre across','c','x',alIc(ICN.alignCx),()=>alTo(.5,null)],
  ['al_cv','Centre down','c','y',alIc(ICN.alignCy),()=>alTo(null,.5)],
  ['al_dh','Distribute across','d','x',alIc(ICN.distX),()=>alSpread('x')],
  ['al_dv','Distribute down','d','y',alIc(ICN.distY),()=>alSpread('y')]];
 const row=$('lalr');row.innerHTML=X.map(([id,t,k,,svg])=>`<button class="ib" type="button" id="${id}" data-k="${k}" disabled aria-label="${t}" title="${t}">${svg}</button>`).join('');
 X.forEach(([id,,,,,fn])=>{$(id).onclick=fn});
 // in the Element group, under Position (2.37.0)
 {const at=$('lfpxy')||row;at.insertAdjacentHTML('afterend','<div class="row" id="lalfit" hidden><button type="button" class="alt" id="al_fit" data-k="f" disabled>Fit to canvas</button><button type="button" class="alt" id="al_str" data-k="f" disabled>Stretch to canvas</button></div>');
 }
 $('al_fit').onclick=()=>alCanvas(true);$('al_str').onclick=()=>alCanvas(false);
 const cmds=[...ALN.map((t,i)=>['align.'+i,'Align: '+t,'al_'+Math.floor(i/3)+(i%3)]),...X.map(([id,t])=>['align.'+id.slice(3),'Align: '+t,id])];
 cmds.push(['shape.fitToCanvas','Fit shape to canvas','al_fit'],['shape.stretchToCanvas','Stretch shape to canvas','al_str']);
 for(const [id,label,elId] of cmds)cmdRegister({id,label,elId,enabled:()=>{const b=$(elId);return!!b&&!b.hidden&&!b.disabled},run:()=>$(elId).click()});
 WBX.alSync=alSync;
}
export {init59};
