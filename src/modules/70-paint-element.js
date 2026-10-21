import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,col,geom,okC,shOf} from './04-canvas-and-stamp-outlines.js';
import {inkOf,store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elExtend} from './65-element-core.js';
import {fxGr,fxPad,fxTex} from './69-effect-stack.js';

// ===== The Paint element (element update, step 10, 2.1.10): one element holds many strokes, in canvas units: {u, k:'paint', n, x, y, st:[stroke]}.
// A stroke is {u, c: colour, w: size, pts: [[x, y]...], t?: stamp id (the brush tip is that stamp; none = round), er?: true (an eraser stroke)}.
// You keep drawing into the selected Paint element until you start a new one. An eraser stroke only rubs out the strokes drawn before it in the same element.
// Effects that work on it: Texture and Colour grade.
const paList=()=>{const L=fpL();return L?(L.pl||[]).filter(q=>q.k=='paint'):[]};
const paCur=()=>{const a=paList();return a.find(q=>q.u==WBS.paSel)||null};
const paCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
const BR={mode:'off',w:14,tip:'round',c:''};   // the brush: mode off | brush | erase; size in canvas units; tip round | stamp; colour ('' = the project ink)
const f1=v=>(+v).toFixed(1);
// a smooth path through the points (midpoints as the curve's end points)
function paPath(P){if(!P.length)return'';if(P.length==1)return`M${f1(P[0][0])} ${f1(P[0][1])}l.01 0`;let d=`M${f1(P[0][0])} ${f1(P[0][1])}`;for(let i=1;i<P.length-1;i++){const a=P[i],b=P[i+1];d+=`Q${f1(a[0])} ${f1(a[1])} ${f1((a[0]+b[0])/2)} ${f1((a[1]+b[1])/2)}`}const e=P[P.length-1];return d+`L${f1(e[0])} ${f1(e[1])}`}
// points along the path, one every `sp` units
function paSpaced(P,sp){const o=[];if(!P.length)return o;let acc=0;o.push(P[0]);for(let i=1;i<P.length;i++){let[x0,y0]=P[i-1];const[x1,y1]=P[i];let d=Math.hypot(x1-x0,y1-y0);while(acc+d>=sp){const t=(sp-acc)/d;x0+=(x1-x0)*t;y0+=(y1-y0)*t;o.push([x0,y0]);d=Math.hypot(x1-x0,y1-y0);acc=0}acc+=d}return o}
function paStroke(s,force){const P=s.pts||[],w=Math.max(.5,+s.w||1);const tt=!s.er&&s.t!=null?WBS.tiles.find(t=>t.id==s.t):null;
if(tt){const G=geom(shOf(tt)),k=w/Math.max(G.SW,G.SH);return paSpaced(P,Math.max(2,w*.6)).map(([x,y])=>`<use href="#s${tt.id}" transform="translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(4)}) translate(${-G.SW/2} ${-G.SH/2})"/>`).join('')}
const c=force||(okC(s.c)?col(s.c):col(WBS.proj.ink));return`<path d="${paPath(P)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`}
// the element's strokes in order; an eraser stroke wraps what is drawn so far in a mask that it cuts out of
function paBody(p,li,id){let body='',defs='';(p.st||[]).forEach((s,i)=>{if(s.er){const m='pe'+li+'_'+id+'_'+i;defs+=`<mask id="${m}" maskUnits="userSpaceOnUse" x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}"><rect x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}" fill="#fff"/>${paStroke(s,'#000')}</mask>`;body=`<g mask="url(#${m})">${body}</g>`}else body+=paStroke(s)});return[defs,body]}
function paintLayer(L,li){const pl=(L.pl||[]).filter(p=>p.k=='paint'&&(p.st||[]).length);if(!pl.length)return['',''];const fr=new Map();let defs='',out='';
pl.forEach(p=>{const id=String(p.u).replace(/[^\w-]/g,''),[d,body]=paBody(p,li,id),fxT=p.fx&&p.fx.length?fxTex(p,'fm'+li+'_'+id,{x:0,y:0,W:CW,H:CH,R:800}):null,fxG=p.fx&&p.fx.length?fxGr(p,'fg'+li+'_'+id,fxPad(0,0,CW,CH)):null;defs+=d;if(fxT)defs+=fxT.defs;if(fxG)defs+=fxG.defs;
const one=`<g transform="translate(${f1(+p.x||0)} ${f1(+p.y||0)})"${fxT?fxT.attrs:''}>${fxG?fxG.wrap(body):body}</g>`;out+=one;fr.set(String(p.u),one)});
const lop=L.op!=null?Math.max(0,Math.min(100,+L.op)):100,lbl=L.bl&&L.bl!='behind'&&L.bl!='cancel'&&L.bl!='replace'?L.bl:'';
const o0=`<g${lop<100?` opacity="${(lop/100).toFixed(2)}"`:''}${lbl?` style="mix-blend-mode:${lbl}"`:''}>`;return[defs,o0+out+'</g>',o0,'</g>',fr]}

// ---- the panel
function paSync(){const host=$('pamode');if(!host)return;const a=paList(),p=paCur();if(WBS.paSel!=null&&!p)WBS.paSel=null;
const key=JSON.stringify([a.map(q=>[q.u,q.n,(q.st||[]).length]),WBS.paSel,BR.mode,BR.tip,BR.w,BR.c,WBS.cur,WBS.tiles.length]);
if(host.dataset.k!==key){host.dataset.k=key;
$('pamode').querySelectorAll('[data-m]').forEach(b=>{const on=b.dataset.m==BR.mode;if(b.classList.contains('on')!==on)b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
$('patip').querySelectorAll('[data-t]').forEach(b=>{const on=b.dataset.t==BR.tip;if(b.classList.contains('on')!==on)b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
const sz=$('pasz');if(+sz.value!==BR.w){sz.value=BR.w;sz.dispatchEvent(new Event('input',{bubbles:true}))}
$('paund').disabled=!p||!(p.st||[]).length;$('paclr').disabled=!p||!(p.st||[]).length}
}
const paPt=e=>{const a=$('art'),pt=a.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const q=pt.matrixTransform(a.getScreenCTM().inverse());return[q.x,q.y]};
function paNew(L){L.pl=L.pl||[];const q={u:fpU(),k:'paint',n:'Paint '+(paList().length+1),x:0,y:0,st:[]};L.pl.push(q);WBS.paSel=q.u;return q}
function init70(){
elExtend('paint',{pn:'elpaint',dz:4,name:q=>q.n,draw:(L,li)=>paintLayer(L,li)});
if(!$('pamode'))return;
WBX.wbPaSync=paSync;WBX.wbPaArm=m=>{BR.mode=m;paSync();if(WBX.wbAbSync)WBX.wbAbSync()};WBX.wbPaMode=()=>BR.mode;
$('pamode').onclick=e=>{const b=e.target.closest('[data-m]');if(b){BR.mode=b.dataset.m;paSync();if(WBX.wbAbSync)WBX.wbAbSync()}};
$('patip').onclick=e=>{const b=e.target.closest('[data-t]');if(b){BR.tip=b.dataset.t;paSync()}};
$('pasz').addEventListener('input',()=>{BR.w=+$('pasz').value});
$('paund').onclick=()=>{const p=paCur();if(p&&(p.st||[]).length){p.st.pop();paCh()}};
$('paclr').onclick=()=>{const p=paCur();if(p&&(p.st||[]).length){p.st=[];paCh()}};
if(WBX.wbMkWell)WBX.wbMkWell($('pawl'),{label:'Brush colour',what:'Brush',def:'Project ink',defRef:()=>WBS.proj.ink,get:()=>BR.c,set:v=>{BR.c=v||'';paSync()}});
// the live stroke: a plain path that follows the pointer; the stroke joins the element (and the picture is redrawn once) when the pointer comes up
const art=$('art');let live=null;
// the path is added to the picture only while a stroke is being drawn, so nothing of it stays in the picture's markup
const liveOn=()=>{if(live)return live;live=document.createElementNS('http://www.w3.org/2000/svg','path');live.setAttribute('fill','none');live.setAttribute('stroke-linecap','round');live.setAttribute('stroke-linejoin','round');live.setAttribute('pointer-events','none');const ov=$('fpov');if(ov)ov.after(live);else art.appendChild(live);return live};
const liveOff=()=>{if(live){live.remove();live=null}};
let cur=null;
art.addEventListener('pointerdown',e=>{if(BR.mode=='off'||e.button!==0||$('boardP').classList.contains('off'))return;const L=fpL();if(!L)return;e.preventDefault();e.stopImmediatePropagation();
const[x,y]=paPt(e),p=paCur()||paNew(L),er=BR.mode=='erase'||e.altKey,s={u:fpU(),w:BR.w,pts:[[+f1(x-(+p.x||0)),+f1(y-(+p.y||0))]]};if(er)s.er=true;else{if(BR.c)s.c=BR.c;if(BR.tip=='stamp'){const t=WBS.tiles[WBS.cur];if(t)s.t=t.id}}
cur={p,s,ox:+p.x||0,oy:+p.y||0};try{art.setPointerCapture(e.pointerId)}catch(er2){}
liveOn();live.setAttribute('stroke',er?'#888':(okC(s.c)?col(s.c):col(WBS.proj.ink)));live.setAttribute('stroke-opacity',er||s.t!=null?'.45':'1');live.setAttribute('stroke-width',String(s.w));live.setAttribute('d',paPath(s.pts))},true);
art.addEventListener('pointermove',e=>{if(!cur||!live)return;const[x,y]=paPt(e),P=cur.s.pts,l=P[P.length-1],px=x-cur.ox,py=y-cur.oy;if(Math.hypot(px-l[0],py-l[1])<1.5)return;P.push([+f1(px),+f1(py)]);live.setAttribute('d',paPath(P));live.setAttribute('transform',`translate(${cur.ox} ${cur.oy})`)},true);
const done=e=>{if(!cur)return;const c=cur;cur=null;try{art.releasePointerCapture(e.pointerId)}catch(er){}liveOff();(c.p.st=c.p.st||[]).push(c.s);paCh()};
art.addEventListener('pointerup',done,true);art.addEventListener('pointercancel',done,true);
paSync()}
export {init70,paCur,paintLayer};
