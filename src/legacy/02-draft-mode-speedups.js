// ---- v65 speed-ups, shared parts.
// Draft while dragging: once a slider, the pattern or the stamp editor is actually dragged (not just clicked), roughness, ink-catch,
// uneven pressure, ink flooding and the worn block rims are skipped; they come back a moment after the pointer is released.
WBS.DRAFT=0;var DRT=0,DRA=null,WBDRG=0;WBS._bkS=0;WBS._edRR=null;
function drOff(){DRA=null;if(!WBS.DRAFT)return;clearTimeout(DRT);DRT=setTimeout(()=>{WBS.DRAFT=0;if(typeof upd=='function')upd()},220)}
// sliders that adjust the drafted effects themselves never draft, so you always see what you are changing
const NODRAFT=new Set(['rgh','psq','lps','lfs','let','ler','tink','tsc','tin','taz']);
document.addEventListener('pointerdown',e=>{const t=e.target,r=t&&t.matches&&t.matches('input[type=range]');DRA=t&&((r&&!NODRAFT.has(t.id))||(!r&&t.closest&&(t.closest('#ed')||t.closest('#art'))))?{x:e.clientX,y:e.clientY}:null},true);
document.addEventListener('pointermove',e=>{if(DRA&&!WBS.DRAFT&&e.buttons&&Math.abs(e.clientX-DRA.x)+Math.abs(e.clientY-DRA.y)>3){WBS.DRAFT=1;clearTimeout(DRT)}},true);
['pointerup','pointercancel'].forEach(k=>document.addEventListener(k,drOff,true));addEventListener('blur',drOff);
