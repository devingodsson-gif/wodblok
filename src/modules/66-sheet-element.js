import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,col,okC,tileExt,tileOn} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elExtend} from './65-element-core.js';
import {trayDone} from './50-tray-core.js';
import {fxGr,fxPad,fxTex} from './69-effect-stack.js';

// ===== The Sheet element (2.2.4): a Sheet is a row in the element list, {u, k:'sheet', n, c, o, fx, op, bl, v}: c is a colour reference (the Paper slot when not set),
// o is the Sheet's own opacity in percent (100 when not set); op, bl and v are the row's opacity, blend and eye like any element's. It covers the canvas and sits where
// it is in the list (new ones go to the bottom). No Sheet means nothing is painted behind the elements; the screen shows a checkerboard there.
// The Sheet panel edits the selected Sheet, or the lowest one when none is selected.
const shAll=()=>{const L=fpL();return L?(L.pl||[]).filter(q=>q.k=='sheet'):[]};
const shGet=()=>{const a=shAll(),q=a.find(x=>String(x.u)===String(WBS.fpSel));return q||a[0]||null};
function shAdd(){const L=fpL();if(!L)return null;const q={u:fpU(),k:'sheet',n:'Sheet'};L.pl=L.pl||[];L.pl.unshift(q);WBS.fpSel=q.u;WBS.fpMS=new Set();return q}
// draws every Sheet of the list: a rectangle over the canvas (a tile and a margin on a Repeat tile); with effects, a tile-sized one copied round the tile
function shLayer(L,li,pa){const pl=(L.pl||[]).filter(p=>p.k=='sheet');if(!pl.length)return['',''];const fr=new Map();let defs='',out='';
pl.forEach((p,i)=>{const id=String(p.u).replace(/[^\w-]/g,''),sx=i?'_'+id:'',F=okC(p.c)?col(p.c):pa,A=p.o!=null&&p.o<100?` opacity="${(Math.max(0,+p.o)/100).toFixed(2)}"`:'',hasFx=!!(p.fx&&p.fx.length),tl=tileOn()&&hasFx,ex=tileExt(),B=tileOn()&&!hasFx?{x:-ex[0],y:-ex[1],W:CW+2*ex[0],H:CH+2*ex[1],R:800}:{x:0,y:0,W:CW,H:CH,R:800},T=hasFx?fxTex(p,'fmsheet'+sx,B):null,G=hasFx?fxGr(p,'fgsheet'+sx,fxPad(B.x,B.y,B.W,B.H)):null,rc=`<rect x="${B.x}" y="${B.y}" width="${B.W}" height="${B.H}" fill="${F}"${A}${T&&!G?T.attrs:''}/>`;
if(T)defs+=T.defs;if(G)defs+=G.defs;let one=G?`<g${T?T.attrs:''}>${G.wrap(rc)}</g>`:rc;
if(tl){const Rg=WBS.tilePv?[-2,-1,0,1,2]:[-1,0,1];let o=`<g id="shtl${id}">${one}</g>`;for(const dx of Rg)for(const dy of Rg)if(dx||dy)o+=`<use href="#shtl${id}" x="${dx*CW}" y="${dy*CH}"/>`;one=o}
out+=one;fr.set(String(p.u),one)});return[defs,out,'','',fr]}
function shSync(){const s=shGet(),on=$('sh_on');if(!on)return;if(on.checked!==!!s)on.checked=!!s;const o=$('sh_op');if(o){const v=s&&s.o!=null?s.o:100;if(+o.value!==v){o.value=v;o.dispatchEvent(new Event('input',{bubbles:true}))}o.disabled=!s}
const w=$('sh_wl');if(w)w.classList.toggle('off',!s);if(WBX.wbPaintWells)WBX.wbPaintWells()}
function init66(){
elExtend('sheet',{dz:0,notile:true,name:q=>q.n||'Sheet',draw:(L,li,pa)=>shLayer(L,li,pa)});
const pj=()=>WBS.proj;
if($('sh_wl')&&WBX.wbMkWell)WBX.wbMkWell($('sh_wl'),{label:'Sheet colour',what:'Sheet',defRef:()=>pj().bg,get:()=>{const s=shGet();return s&&s.c||pj().bg},set:v=>{if(!v)return;const s=shGet()||shAdd();if(s)s.c=v}});
$('sh_on').onchange=()=>{const L=fpL();if(!L)return;if($('sh_on').checked){if(!shGet())shAdd()}else{L.pl=(L.pl||[]).filter(q=>q.k!='sheet');WBS.fpSel=-1;WBS.fpMS=new Set()}trayDone($('sh_on').checked?'Added Sheet':'Removed Sheet');shSync()};
$('sh_op').addEventListener('input',()=>{const s=shGet();if(!s)return;const v=+$('sh_op').value;if(v<100)s.o=v;else delete s.o;store();upd()});
WBX.wbShSync=shSync;shSync()}
export {init66,shAdd,shAll,shGet,shLayer,shSync};
