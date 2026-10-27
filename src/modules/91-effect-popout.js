import {ICN} from './00-icons.js';
import {WBS,WBX} from './01-launch-and-version.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elKind,elSel,fxDef} from './65-element-core.js';
import {pmClose} from './90-panel-modes.js';

// ===== The effect pop-out (2.55.0, owner Oct 26 2026: "if we apply an effect from the top bar (Effects > Noise > Add noise) it should pop up a little detached
// effect editing window, just to edit that effect, with an Apply button"; "the options in that window must be identical to the in-panel effect options").
// An Effects menu item works only while elements are selected that all take the effect (otherwise it is greyed). It adds the effect to each of them at once, so the
// canvas shows it live, and opens a floating window titled with the effect's name. The window does not hold copies of the controls: it borrows the Effects group's own
// settings pane (.fxpane of the first element's kind) and gives it back when it closes, so its options are the panel's, by construction. A change there is copied to
// the same new effect on the other selected elements (each keeps its own seed). Apply keeps them as one history step named after the effect; Cancel, Esc, the close
// button, another Effects item, a new selection or Undo take them away and leave no step (owner, Oct 26 2026). The window remembers where it was dragged (this session).
let FO=null,foPos=null;
const foKey=a=>a.map(q=>String(q.u)).sort().join(',');
function foSel(){const L=fpL();if(!L)return[];const S=new Set(WBS.fpMS&&WBS.fpMS.size>1?[...WBS.fpMS].map(String):[]);if(WBS.fpSel!==-1&&WBS.fpSel!=null)S.add(String(WBS.fpSel));return(L.pl||[]).filter(q=>S.has(String(q.u)))}
// the menu item is on when an element is selected and every selected element's kind takes the effect
function foCan(k){const d=fxDef(k);if(!d)return false;const a=foSel();return a.length>0&&a.every(x=>d.kinds.includes(elKind(x)))}
function foOpen(k){if(FO)foCancel();if(!foCan(k))return false;pmClose();const d=fxDef(k),a=foSel();if(!elSel())WBS.fpSel=a[0].u;   // several selected with no first one (Select all): the first in the list leads, its panel's pane is lent
 const q0=elSel(),kind=elKind(q0),g=document.querySelector(`.fxg[data-fxk="${kind}"]`);if(!g)return false;
 WBX.wbNoCap=1;
 const list=[q0,...a.filter(x=>x!==q0)].map(q=>{const e=d.make();e.u=fpU();q.fx=Array.isArray(q.fx)?q.fx:[];q.fx.push(e);return[q,e]});
 if(WBX.wbFxSel)WBX.wbFxSel(kind,list[0][1].u);
 const pane=g._pane||(g._pane=g.querySelector('.fxpane'));
 const win=document.createElement('div');win.className='fxwin';win.setAttribute('role','dialog');win.setAttribute('aria-label',d.label);
 win.innerHTML=`<div class="fxwh"><span class="fxwt"></span><button type="button" class="ib fxwx" aria-label="Cancel"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.close}</svg></button></div><div class="fxwb"></div><div class="fxwf"><button type="button" class="alt fxwc">Cancel</button><button type="button" class="primary fxwa">Apply</button></div>`;
 win.querySelector('.fxwt').textContent=d.label;document.body.appendChild(win);
 const home=document.createComment('fx');pane.before(home);win.querySelector('.fxwb').appendChild(pane);
 FO={k,kind,list,pane,home,win,sel:foKey(a)};
 // a change in the window reaches the other selected elements' copy of the effect
 const copy=()=>{if(!FO||FO.list.length<2)return;const e0=FO.list[0][1];FO.list.slice(1).forEach(([,e])=>{Object.keys(e0).forEach(f=>{if(f!='u'&&f!='sd')e[f]=JSON.parse(JSON.stringify(e0[f]))})});upd()};
 ['input','change','click'].forEach(t=>win.addEventListener(t,()=>setTimeout(copy,0)));
 win.querySelector('.fxwa').onclick=foApply;win.querySelector('.fxwc').onclick=foCancel;win.querySelector('.fxwx').onclick=foCancel;
 // place: where it was last dragged, else by the top left of the canvas area
 const st=document.querySelector('.stage'),R=st?st.getBoundingClientRect():{left:60,top:80};const p=foPos||{x:Math.round(R.left+16),y:Math.round(R.top+48)};foPlace(p.x,p.y);
 const head=win.querySelector('.fxwh');head.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;e.preventDefault();const b=win.getBoundingClientRect(),ox=e.clientX-b.left,oy=e.clientY-b.top;head.setPointerCapture(e.pointerId);
  const mv=ev=>{foPlace(ev.clientX-ox,ev.clientY-oy)},up=()=>{head.removeEventListener('pointermove',mv);head.removeEventListener('pointerup',up);head.removeEventListener('pointercancel',up);const r=win.getBoundingClientRect();foPos={x:Math.round(r.left),y:Math.round(r.top)}};
  head.addEventListener('pointermove',mv);head.addEventListener('pointerup',up);head.addEventListener('pointercancel',up)});
 upd();return true}
function foPlace(x,y){if(!FO)return;const w=FO.win,b=w.getBoundingClientRect();w.style.left=Math.round(Math.max(4,Math.min(innerWidth-b.width-4,x)))+'px';w.style.top=Math.round(Math.max(4,Math.min(innerHeight-Math.min(b.height,120),y)))+'px'}
function foDone(){const o=FO;FO=null;o.home.replaceWith(o.pane);o.win.remove();WBX.wbNoCap=0;return o}
function foApply(){if(!FO)return;const o=foDone(),d=fxDef(o.k);store();WBX.wbLabelNext={t:d?d.label:'Effect',at:performance.now()};if(WBX.wbCap)WBX.wbCap();upd()}
function foCancel(){if(!FO)return;const o=foDone();o.list.forEach(([q,e])=>{if(!Array.isArray(q.fx))return;const i=q.fx.indexOf(e);if(i>=0)q.fx.splice(i,1);if(!q.fx.length)delete q.fx});if(WBX.wbFxSel)WBX.wbFxSel(o.kind,null);store();upd()}
// a new selection cancels it (called from elSync)
function foSync(){if(FO&&foKey(foSel())!==FO.sel)foCancel()}
function init91(){
 document.addEventListener('keydown',e=>{if(!FO)return;if(e.key=='Escape'){e.preventDefault();e.stopPropagation();foCancel();return}
  if((e.ctrlKey||e.metaKey)&&(e.key=='z'||e.key=='Z'||e.key=='y'||e.key=='Y')&&!(e.target&&e.target.matches&&e.target.matches('input[type=text],textarea'))){e.preventDefault();e.stopPropagation();foCancel()}},true);
 document.addEventListener('click',e=>{if(FO&&e.target.closest&&e.target.closest('#undo,#redo')){e.preventDefault();e.stopPropagation();foCancel()}},true);
 WBX.wbFxPop=foOpen;WBX.wbFxCan=foCan;WBX.wbFoSync=foSync}
export {foCan,foOpen,init91};
