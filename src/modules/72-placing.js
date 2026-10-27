import {$,WBS,WBX} from './01-launch-and-version.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {tbArm} from './26-text-boxes.js';
// ===== Placing (2.2.3): a shape, a stamp, a picture or text is "armed" and follows the pointer as a ghost until it is placed.
// One rule for all four: using anything in the interface (a button, a slider, a window) puts the armed item away, so a click on the canvas afterwards cannot place
// it by accident; a button that arms something (a shape, a stamp, a picture, Place text) arms it again and the ghost is back on the pointer; a right click puts it away.
// Paint (2.3.0) follows the same rule: the brush is 'paint' while it is on.
// What is armed: 'motif' (WBS.brush), 'text' (WBS.txArm or a text brush), 'stamp' or 'picture' (WBS.fpB: a stamp id or a picture id).
function plKind(){if(WBX.wbPaMode&&WBX.wbPaMode()!='off')return'paint';if(WBS.txArm||(WBS.brush&&WBS.brush.txt))return'text';if(WBS.plArm)return WBS.plArm.k;if(WBS.brush)return'motif';if(WBS.fpB!=null&&WBS.fpB!==false&&WBS.fpB!=='')return'stamp';return''}
// the control that arms each kind: pressing it while another kind is armed puts that one away first; pressing it while its own kind is armed is left to the control (it switches or toggles)
const PL_ARM={motif:'#lib [data-m]',stamp:'#lfpst [data-t]',text:'#tx_go',copy:'#lfpcp',paint:'section.pn[data-p="elpaint"],#elopt'};   // Paint (2.3.0): its own panel (size, colour, tip, eraser) does not put the brush away
function plDisarm(){const k=plKind();if(!k)return false;
 if(k=='paint'){WBX.wbPaArm('off');return true}
 if(WBS.txArm)tbArm(false);
 if(WBS.brush&&WBS.brush.txt&&WBX.wbTxArm)WBX.wbTxArm(false);
 WBS.brush=null;WBS.txg=null;WBS.fpB=null;WBS.plArm=null;WBS.fpPool=new Set();WBS.fpGhost=null;upd();return true}
function plDown(e){const k=plKind();if(!k)return;const t=e.target;if(!t||!t.closest)return;
 for(const kk in PL_ARM)if(t.closest(PL_ARM[kk])){if(kk!==k)plDisarm();return}
 // the canvas and the empty board round it are not interface; a button, field or window anywhere is
 if(t.closest('#boardP')&&!t.closest('button,input,select,textarea,a,label,[contenteditable]'))return;
 plDisarm()}
function init72(){WBX.plKind=plKind;WBX.plDisarm=plDisarm;document.addEventListener('pointerdown',plDown,true)}
export {init72,plDisarm,plKind};
