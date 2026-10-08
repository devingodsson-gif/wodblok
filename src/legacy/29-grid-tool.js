// ===== Grid tool (Pattern mode): shows and edits the shared pattern grid. Snapping itself is chosen per Free place layer.
{let pgBusy=0;const gch=()=>{upd();if(window.wbCap)wbCap()};
window.pgSync=()=>{if(!$('pgs'))return;document.querySelectorAll('#pgsh [data-sh]').forEach(b=>b.classList.toggle('on',b.dataset.sh==(pgrid.sh||'rect')));$('pgs').checked=!!pgrid.show;document.querySelectorAll('#pgm [data-g]').forEach(b=>b.classList.toggle('on',b.dataset.g==pgrid.m));
 [['pgz',pgrid.n],['pgo',pgrid.op]].forEach(([id,v])=>{const el=$(id);if(+el.value!=v){el.value=v;pgBusy=1;try{el.dispatchEvent(new Event('input',{bubbles:true}))}finally{pgBusy=0}}});
 if(pgrid.sh&&pgrid.sh!='rect'){const M=gModel(pgrid.sh,CW,CH,Math.max(2,pgrid.n),false);$('pgi').textContent=`${pgrid.n} cells across, about ${M.m} rows. Stamp centres land ${pgrid.m=='c'?'in the middle of each cell':'where the grid lines meet'}.`;return}const c=CW/Math.max(2,pgrid.n);$('pgi').textContent=`${pgrid.n} columns × ${(CH/c).toFixed(1).replace(/\.0$/,'')} rows. Each cell is ${Math.round(c/Math.min(CW,CH)*100)}% of the short side.`};
$('pgs').onchange=()=>{pgrid.show=$('pgs').checked;gch()};
$('pgsh').onclick=e=>{const b=e.target.closest('[data-sh]');if(!b)return;pgrid.sh=gShOk(b.dataset.sh);pgrid.show=true;gch()};
$('pgm').onclick=e=>{const b=e.target.closest('[data-g]');if(!b)return;pgrid.m=b.dataset.g=='c'?'c':'l';gch()};
$('pgz').addEventListener('input',()=>{if(pgBusy)return;const v=Math.max(2,Math.min(60,Math.round(+$('pgz').value)||8));if(v==pgrid.n)return;pgrid.n=v;upd()});
$('pgo').addEventListener('input',()=>{if(pgBusy)return;const v=Math.max(10,Math.min(100,Math.round(+$('pgo').value)||70));if(v==pgrid.op)return;pgrid.op=v;upd()});
['pgz','pgo'].forEach(id=>$(id).addEventListener('change',()=>{if(window.wbCap)wbCap()}));
$('pgr').onclick=()=>{pgrid={...PGD,show:pgrid.show};gch()}}
