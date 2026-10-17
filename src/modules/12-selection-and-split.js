import {$,WBH,WBS} from './01-launch-and-version.js';
import {selOne,store} from './06-motif-library-folders.js';
import {latG} from './10-layer-grids.js';
import {Q,upd} from './11-pressure-flooding-block-edges.js';
import {LY} from './14-presets-and-layer-grid-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
// ---- multi-selection: msel holds every selected index on the current stamp, sel is the one the sliders show
const QS=()=>[...WBS.msel].sort((a,b)=>a-b).map(i=>WBS.tiles[WBS.cur].items[i]).filter(Boolean);
function selFix(){const n=WBS.tiles[WBS.cur].items.length;WBS.msel=new Set([...WBS.msel].filter(i=>i>=0&&i<n));if(WBS.sel>=n||(WBS.sel>=0&&!WBS.msel.has(WBS.sel)))WBS.sel=-1;if(WBS.sel<0&&WBS.msel.size)WBS.sel=Math.max(...WBS.msel)}
function selToggle(i){WBS.brush=null;if(WBS.msel.has(i)){WBS.msel.delete(i);if(WBS.sel==i)WBS.sel=WBS.msel.size?Math.max(...WBS.msel):-1}else{WBS.msel.add(i);WBS.sel=i}}
function selSet(ids,add){WBS.brush=null;if(!add){WBS.msel=new Set(ids);WBS.sel=ids.length?Math.max(...ids):-1;return}if(ids.every(i=>WBS.msel.has(i))){ids.forEach(i=>WBS.msel.delete(i));if(!WBS.msel.has(WBS.sel))WBS.sel=WBS.msel.size?Math.max(...WBS.msel):-1}else{ids.forEach(i=>WBS.msel.add(i));WBS.sel=Math.max(...ids)}}
function delItems(ids){const a=WBS.tiles[WBS.cur].items,d=new Set(ids),map=[];let n=0;a.forEach((q,i)=>map[i]=d.has(i)?-1:n++);[...d].sort((x,y)=>y-x).forEach(i=>a.splice(i,1));WBS.msel=new Set([...WBS.msel].map(i=>map[i]).filter(i=>i>=0));WBS.sel=WBS.sel>=0?map[WBS.sel]:-1;selFix()}
const clampN=(v,a,b)=>Math.min(b,Math.max(a,v)),wrapA=a=>((a+540)%360)-180;
function doSplit(){const t=WBS.tiles[WBS.cur],q=t.items[WBS.split.i];if(!q){WBS.split=null;WBH.draw();return}
const Sx=q.s*q.f*(q.sx||1),Sy=q.s*(q.sy||1),r=-q.r*Math.PI/180,rot=(x,y)=>[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];
const[px,py]=rot(WBS.split.x-q.x,WBS.split.y-q.y),L0=[px/Sx,py/Sy],a=WBS.split.a*Math.PI/180,[dx,dy]=rot(Math.cos(a),Math.sin(a)),U=[dx/Sx,dy/Sy],th=Math.atan2(U[1],U[0]),n=[-Math.sin(th),Math.cos(th)],d=L0[0]*n[0]+L0[1]*n[1];
const A=+(th*180/Math.PI).toFixed(3),D=+d.toFixed(3),q2=JSON.parse(JSON.stringify(q));q.cl=[...(q.cl||[]),[A,D,1]];q2.cl=[...(q2.cl||[]),[A,D,-1]];
t.items.splice(WBS.split.i+1,0,q2);selOne(WBS.split.i+1);WBS.split=null;store();upd();pmsg('Split into two pieces. Drag them apart, or select either one to change it.')}
function init12(){
// ---- Split: place a line over the selected motif, then cut it into two pieces (each keeps its own half).
WBS.split=null;WBS.spDrag=null;
addEventListener('pointerup',()=>{WBS.spDrag=null});
$('ssp').onclick=()=>{const q=Q();if(!q||WBS.msel.size>1)return;WBS.brush=null;WBS.split=WBS.split?null:{i:WBS.sel,x:q.x,y:q.y,a:q.r+90};WBH.draw()};
$('spok').onclick=doSplit;$('spno').onclick=()=>{WBS.split=null;WBH.draw()};
$('lbo').oninput=()=>{LY().bo=+$('lbo').value;store();upd()};
$('larr').oninput=()=>{const L=LY();if(!L.ak||typeof L.ak!='object')L.ak={};L.ak[latG(L).SK]=$('larr').value;store();upd()};
// ---- manual arrangement: click an impression on the pattern to cycle which stamp is printed there
$('man').onchange=()=>{const L=LY();L.man=$('man').checked;if(!L.ov)L.ov={};store();upd()};
$('manr').onclick=()=>{LY().ov={};store();upd()};
$('art').addEventListener('click',e=>{const L=LY();if(!L.man)return;const c=e.target.closest('[data-cell]');if(!c||+c.dataset.l!==WBS.selL)return;const ls=WBS.tiles;if(ls.length<2){$('pmsg').textContent='Make another stamp to swap between them.';return}
const k=ls.findIndex(t=>t.id==c.dataset.t),nx=ls[(k+(e.shiftKey?-1:1)+ls.length)%ls.length].id;if(!L.ov)L.ov={};if(nx==+c.dataset.d)delete L.ov[c.dataset.cell];else L.ov[c.dataset.cell]=nx;store();upd()});
}
export {QS,clampN,delItems,doSplit,selFix,selSet,selToggle,wrapA,init12};
