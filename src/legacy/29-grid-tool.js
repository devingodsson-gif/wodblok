// ===== Grid tool (Pattern mode): shows and edits the shared pattern grid. Snapping itself is chosen per Free place layer.
{let pgBusy=0;const gch=()=>{upd();if(window.wbCap)wbCap()};
window.pgSync=()=>{if(!$('pgs'))return;document.querySelectorAll('#pgsh [data-sh]').forEach(b=>b.classList.toggle('on',b.dataset.sh==(WBS.pgrid.sh||'rect')));$('pgs').checked=!!WBS.pgrid.show;document.querySelectorAll('#pgm [data-g]').forEach(b=>b.classList.toggle('on',b.dataset.g==WBS.pgrid.m));
 [['pgz',WBS.pgrid.n],['pgo',WBS.pgrid.op]].forEach(([id,v])=>{const el=$(id);if(+el.value!=v){el.value=v;pgBusy=1;try{el.dispatchEvent(new Event('input',{bubbles:true}))}finally{pgBusy=0}}});
 if(WBS.pgrid.sh&&WBS.pgrid.sh!='rect'){const M=gModel(WBS.pgrid.sh,CW,CH,Math.max(2,WBS.pgrid.n),false);$('pgi').textContent=`${WBS.pgrid.n} cells across, about ${M.m} rows. Stamp centres land ${WBS.pgrid.m=='c'?'in the middle of each cell':'where the grid lines meet'}.`;return}const c=CW/Math.max(2,WBS.pgrid.n);$('pgi').textContent=`${WBS.pgrid.n} columns × ${(CH/c).toFixed(1).replace(/\.0$/,'')} rows. Each cell is ${Math.round(c/Math.min(CW,CH)*100)}% of the short side.`};
$('pgs').onchange=()=>{WBS.pgrid.show=$('pgs').checked;gch()};
$('pgsh').onclick=e=>{const b=e.target.closest('[data-sh]');if(!b)return;WBS.pgrid.sh=gShOk(b.dataset.sh);WBS.pgrid.show=true;gch()};
$('pgm').onclick=e=>{const b=e.target.closest('[data-g]');if(!b)return;WBS.pgrid.m=b.dataset.g=='c'?'c':'l';gch()};
$('pgz').addEventListener('input',()=>{if(pgBusy)return;const v=Math.max(2,Math.min(60,Math.round(+$('pgz').value)||8));if(v==WBS.pgrid.n)return;WBS.pgrid.n=v;upd()});
$('pgo').addEventListener('input',()=>{if(pgBusy)return;const v=Math.max(10,Math.min(100,Math.round(+$('pgo').value)||70));if(v==WBS.pgrid.op)return;WBS.pgrid.op=v;upd()});
['pgz','pgo'].forEach(id=>$(id).addEventListener('change',()=>{if(window.wbCap)wbCap()}));
$('pgr').onclick=()=>{WBS.pgrid={...PGD,show:WBS.pgrid.show};gch()}}
