import {$,WBS,WBX} from './01-launch-and-version.js';
import {STP,stLock,stUnlocked,stZoom,stampAt} from './63-stamp-tool.js';

// ===== Stamp editing as a mode (2.3.0, like a Photoshop smart object): double-click a stamp on the canvas to edit it. A bar over the stage names it
// with Done; the Elements list shows what is on the stamp (its shapes, text and pictures) in place of the elements; Properties shows the Stamp panel
// (its block, edge, texture, symmetry). Done or a second double-click closes it (Esc only puts the selection away, as before). Under the hood this is the stamp's unlocked state (63-stamp-tool.js).
let steHome=null;   // where the list of the stamp's contents lives when it is not shown in the Elements panel
const stePt=e=>{const a=$('art'),m=a&&a.getScreenCTM();if(!m)return null;const p=a.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(m.inverse());return{x:q.x,y:q.y}};
function steOpen(id){if(stUnlocked()!==id)stLock(id);if(WBX.wbOpenPanel)WBX.wbOpenPanel('stmp');try{stZoom()}catch(e){}steSync()}
function steDone(){const id=stUnlocked();if(id!=null)stLock(id);steSync()}
function steSync(){const un=stUnlocked(),bar=$('stebar'),ml=$('mlist'),body=$('lybody'),list=$('lyl2');if(!bar||!ml||!body||!list)return;
 const on=un!=null;if(bar.hidden===on)bar.hidden=!on;document.body.classList.toggle('stedit',on);
 if(on){const n=bar.querySelector('b'),k=WBS.tiles.findIndex(t=>t.id==un),t='Stamp '+(k+1);if(n&&n.textContent!==t)n.textContent=t}
 if(on&&ml.parentNode!==body){if(!steHome)steHome=ml.parentNode;body.insertBefore(ml,list);list.hidden=true}
 else if(!on&&steHome&&ml.parentNode!==steHome){steHome.appendChild(ml);list.hidden=false}}
function init75(){const a=$('art');if(!a)return;
 const st=document.querySelector('.stage');if(st&&!$('stebar'))st.insertAdjacentHTML('beforeend','<div class="stebar" id="stebar" hidden><span>Editing <b></b></span><button type="button" class="primary" id="stedone">Done</button></div>');
 $('stedone').onclick=()=>steDone();
 ($('boardP')||a).addEventListener('dblclick',e=>{if(WBS.brush||WBS.txArm||WBS.fpB!=null)return;const c=stePt(e);if(!c)return;const h=stampAt(c.x,c.y,null);if(!h)return;e.preventDefault();const it=STP.items[h.i],id=it?it[0]:null;if(id==null)return;if(stUnlocked()===id){if(WBX.wbTxGrp&&WBX.wbTxGrp())return;steDone()}else steOpen(id)});
 WBX.wbSteSync=steSync}
export {init75,steDone,steOpen};
