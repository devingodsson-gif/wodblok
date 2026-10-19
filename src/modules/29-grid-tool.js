import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {gModel,gShOk} from './08-grid-shapes.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpSnap,fpSnapS,pgSnap,pgSs} from './24-free-place-layers.js';

function init29(){// ===== Grid tool (Pattern mode): one grid for the whole pattern, and the one switch for snapping Free place, Pictures and Text layers.
{let pgBusy=0;const gch=()=>{upd();if(WBX.wbCap)WBX.wbCap()};
window.pgSync=()=>{if(!$('pgs'))return;const G=WBS.pgrid;document.querySelectorAll('#pgsh [data-sh]').forEach(b=>b.classList.toggle('on',b.dataset.sh==(G.sh||'rect')));$('pgs').checked=!!G.show;$('pgn').checked=pgSnap();$('pgss').checked=pgSs();document.querySelectorAll('#pgm [data-g]').forEach(b=>b.classList.toggle('on',b.dataset.g==G.m));
 [['pgz',G.n],['pgo',G.op]].forEach(([id,v])=>{const el=$(id);if(+el.value!=v){el.value=v;pgBusy=1;try{el.dispatchEvent(new Event('input',{bubbles:true}))}finally{pgBusy=0}}});
 const n=Math.max(2,G.n),rows=G.sh&&G.sh!='rect'?gModel(G.sh,CW,CH,n,false).m:Math.max(1,Math.round(CH/(CW/n)));$('pgd').textContent=`${n} × ${rows}`;
 const L=fpL();$('pgq').disabled=!(L&&(L.pl||[]).length)};
$('pgs').onchange=()=>{WBS.pgrid.show=$('pgs').checked;gch()};
$('pgn').onchange=()=>{WBS.pgrid.snap=$('pgn').checked;if(WBS.pgrid.snap)WBS.pgrid.show=true;gch()};
$('pgss').onchange=()=>{WBS.pgrid.ss=$('pgss').checked;if(WBS.pgrid.ss){WBS.pgrid.snap=true;WBS.pgrid.show=true}gch()};
$('pgsh').onclick=e=>{const b=e.target.closest('[data-sh]');if(!b)return;WBS.pgrid.sh=gShOk(b.dataset.sh);WBS.pgrid.show=true;gch()};
$('pgm').onclick=e=>{const b=e.target.closest('[data-g]');if(!b)return;WBS.pgrid.m=b.dataset.g=='c'||b.dataset.g=='b'?b.dataset.g:'l';WBS.pgrid.show=true;gch()};
$('pgz').addEventListener('input',()=>{if(pgBusy)return;const v=Math.max(2,Math.min(60,Math.round(+$('pgz').value)||8));if(v==WBS.pgrid.n)return;WBS.pgrid.n=v;WBS.pgrid.show=true;upd()});
$('pgo').addEventListener('input',()=>{if(pgBusy)return;const v=Math.max(10,Math.min(100,Math.round(+$('pgo').value)||70));if(v==WBS.pgrid.op)return;WBS.pgrid.op=v;upd()});
['pgz','pgo'].forEach(id=>$(id).addEventListener('change',()=>{if(WBX.wbCap)WBX.wbCap()}));
$('pgq').onclick=()=>{const L=fpL();if(!L||!(L.pl||[]).length)return;let moved=0;L.pl.forEach(q=>{const[x,y]=fpSnap(L,q.x,q.y,null,true),nx=+x.toFixed(1),ny=+y.toFixed(1);let ns=q.s;if(pgSs())ns=+fpSnapS(L,q.s,null,true).toFixed(2);if(Math.abs(nx-q.x)>.01||Math.abs(ny-q.y)>.01||ns!==q.s)moved++;q.x=nx;q.y=ny;q.s=ns});WBS.pgrid.show=true;store();gch();$('pmsg').textContent=moved?`Snapped ${moved} item${moved>1?'s':''} to the grid.`:'Everything is already on the grid.'};
$('pgr').onclick=()=>{const G=WBS.pgrid;WBS.pgrid={...PGD,show:G.show};if(G.snap!==undefined)WBS.pgrid.snap=G.snap;if(G.ss!==undefined)WBS.pgrid.ss=G.ss;gch()}}
}
export {init29};
