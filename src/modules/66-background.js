import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,col,stvOn,tileExt,tileOn} from './04-canvas-and-stamp-outlines.js';
import {trayDone} from './50-tray-core.js';

// ===== The Background (2.3.1, replaces the Sheet element): the canvas's own colour. It is the project's Paper colour (proj.bg: a link to a tray colour while that colour
// is unlocked, a copy of it when it is locked, like every colour), and proj.bgOn === false means no background (the screen shows a checkerboard, an export is
// transparent). New projects start with the first tray colour. It sits under every element, outside the rough-edge filter and the ink mask (build() adds it).
// The Canvas panel edits it. Owner, Oct 20 2026: "remove the sheets completely, replace them with a solid background colour on the canvas tool, with an option for none".
const bgOn=()=>!!WBS.proj&&WBS.proj.bgOn!==false;
// a rectangle over the canvas (a tile and a margin on a Repeat tile); '' when there is no background
function bgDraw(){if(!bgOn()||stvOn())return'';const ex=tileOn()?tileExt():[0,0];return`<rect x="${-ex[0]}" y="${-ex[1]}" width="${CW+2*ex[0]}" height="${CH+2*ex[1]}" fill="${col(WBS.proj.bg)}"/>`}
function bgSync(){const on=$('bg_on');if(!on||!WBS.proj)return;const v=bgOn();if(on.checked!==v)on.checked=v;const w=$('bg_wl');if(w)w.classList.toggle('off',!v);if(WBX.wbPaintWells)WBX.wbPaintWells()}
function init66(){
const on=$('bg_on');if(!on)return;
on.onchange=()=>{if(on.checked)delete WBS.proj.bgOn;else WBS.proj.bgOn=false;trayDone(on.checked?'Background on':'Background off');bgSync()};
WBX.wbBgSync=bgSync;bgSync()}
export {bgDraw,bgOn,bgSync,init66};
