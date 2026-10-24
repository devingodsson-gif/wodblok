import {WBS} from './01-launch-and-version.js';
import {upd} from './11-pressure-flooding-block-edges.js';
var DRT=0,DRA=null;
function drOff(){DRA=null;if(!WBS.DRAFT)return;clearTimeout(DRT);DRT=setTimeout(()=>{WBS.DRAFT=0;if(typeof upd=='function')upd()},220)}
// sliders that adjust the drafted effects themselves never draft, so you always see what you are changing
let NODRAFT;
function init02(){// ---- v65 speed-ups, shared parts.
// Draft while dragging: once a slider or the pattern is actually dragged (not just clicked), roughness, ink-catch,
// uneven pressure, ink flooding and the worn block rims are skipped; they come back a moment after the pointer is released.
WBS.DRAFT=0;WBS.WBDRG=0;WBS._bkS=0;
NODRAFT=new Set(['rgh','psq','let','ler','tink','tsc','tin','taz']);
document.addEventListener('pointerdown',e=>{const t=e.target,r=t&&t.matches&&t.matches('input[type=range]');DRA=t&&((r&&!NODRAFT.has(t.id))||(!r&&t.closest&&(t.closest('#art')||t.closest('#stolsvg'))))?{x:e.clientX,y:e.clientY,cv:!r}:null},true);
document.addEventListener('pointermove',e=>{if(DRA&&!WBS.DRAFT&&!WBS.NODR&&e.buttons&&Math.abs(e.clientX-DRA.x)+Math.abs(e.clientY-DRA.y)>3){WBS.DRAFT=1;WBS.DRAFTCV=DRA.cv?1:0;clearTimeout(DRT)}},true);   // DRAFTCV (2.38.0): the drag is on the canvas, not a slider
['pointerup','pointercancel'].forEach(k=>document.addEventListener(k,drOff,true));addEventListener('blur',drOff);
}
export {DRT,NODRAFT,drOff,init02};
