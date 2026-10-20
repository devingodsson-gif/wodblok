import {$,WBS,WBX} from './01-launch-and-version.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {trayDone} from './50-tray-core.js';

// ===== The Sheet element (element update, step 3, 2.1.3): the canvas is transparent; a Sheet is the background that covers it.
// One Sheet per project, stored as proj.sh = {c, o}: c is a colour reference (the Paper slot when not set), o is the opacity in percent (100 when not set).
// No Sheet means no proj.sh and nothing is painted behind the layers; the screen shows a checkerboard there. build() paints the Sheet first, under every layer.
const shGet=()=>WBS.proj&&WBS.proj.sh||null;
function shSync(){const s=shGet(),on=$('sh_on');if(!on)return;if(on.checked!==!!s)on.checked=!!s;const o=$('sh_op');if(o){const v=s&&s.o!=null?s.o:100;if(+o.value!==v){o.value=v;o.dispatchEvent(new Event('input',{bubbles:true}))}o.disabled=!s}
const w=$('sh_wl');if(w)w.classList.toggle('off',!s);if(WBX.wbPaintWells)WBX.wbPaintWells()}
function init66(){
const pj=()=>WBS.proj;
if($('sh_wl')&&WBX.wbMkWell)WBX.wbMkWell($('sh_wl'),{label:'Sheet colour',what:'Sheet',defRef:()=>pj().bg,get:()=>{const s=shGet();return s&&s.c||pj().bg},set:v=>{if(!v)return;const s=shGet()||(pj().sh={});s.c=v}});
$('sh_on').onchange=()=>{if($('sh_on').checked){if(!shGet())pj().sh={}}else delete pj().sh;trayDone($('sh_on').checked?'Added Sheet':'Removed Sheet');shSync()};
$('sh_op').addEventListener('input',()=>{const s=shGet();if(!s)return;const v=+$('sh_op').value;if(v<100)s.o=v;else delete s.o;store();upd()});
WBX.wbShSync=shSync;shSync()}
export {init66,shGet,shSync};
