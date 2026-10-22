import {$,WBS,WBX} from './01-launch-and-version.js';
import {CW} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpL} from './24-free-place-layers.js';
import {fpWH} from './25-art-layers.js';
import {tbArm} from './26-text-boxes.js';
import {elKind,elSel} from './65-element-core.js';

// ===== Type on the canvas (2.20.0, owner Oct 22 2026). A text element is typed into where it sits: a click with Text armed places a box and the typing starts in it (the word "Text" is selected,
// so the first key replaces it); double-clicking a text element edits it the same way. The letters on the canvas are drawn as before from the panel's text field; this is a transparent field laid over the
// element's box that takes the keys and shows the caret. It is kept equal to the panel's field in both directions. Esc, a click outside it or leaving it ends the edit; an empty text is deleted.
let TIN=null;   // the element being edited: its u
const tinCur=()=>{const q=elSel();return q&&elKind(q)=='text'&&TIN&&String(q.u)===TIN?q:null};
function tinEl(){let e=$('txin');if(e)return e;e=document.createElement('textarea');e.id='txin';e.hidden=true;e.setAttribute('aria-label','Text');e.spellcheck=false;document.body.appendChild(e);
 e.addEventListener('input',()=>{const t=$('tx_t');if(t&&t.value!==e.value){t.value=e.value;t.dispatchEvent(new Event('input',{bubbles:true}))}});
 e.addEventListener('keydown',ev=>{ev.stopPropagation();if(ev.key=='Escape'){ev.preventDefault();tinStop()}});
 e.addEventListener('blur',()=>{setTimeout(()=>{if(TIN&&document.activeElement!==e)tinStop()},0)});
 return e}
function tinPlace(){const e=$('txin');if(!e||e.hidden)return;const q=tinCur();if(!q){tinStop();return}
 const art=$('art'),m=art.getScreenCTM(),wh=fpWH(q);if(!m||!wh)return;const pt=art.createSVGPoint();pt.x=q.x-wh[0]/2;pt.y=q.y-wh[1]/2;const a=pt.matrixTransform(m);pt.x=q.x+wh[0]/2;pt.y=q.y+wh[1]/2;const b=pt.matrixTransform(m);
 const lines=Math.max(1,String(q.tx&&q.tx.text||'').split('\n').length),h=Math.max(8,b.y-a.y),s=e.style;
 s.left=a.x.toFixed(1)+'px';s.top=a.y.toFixed(1)+'px';s.width=Math.max(24,b.x-a.x).toFixed(1)+'px';s.height=h.toFixed(1)+'px';s.fontSize=Math.max(8,Math.min(120,h/lines*.8)).toFixed(1)+'px';s.lineHeight=(h/lines).toFixed(1)+'px';
 s.textAlign=(q.tx&&q.tx.al)||'left';s.transform=q.r?`rotate(${+q.r}deg)`:''}
function tinStart(){const q=elSel();if(!q||elKind(q)!='text'||WBS.txArm)return false;TIN=String(q.u);const e=tinEl(),t=$('tx_t');e.value=t?t.value:String((q.tx&&q.tx.text)||'');e.hidden=false;tinPlace();e.focus();e.select();return true}
function tinStop(){if(!TIN)return;const u=TIN;TIN=null;const e=$('txin');if(e){const v=e.value;e.hidden=true;if(!v.trim()){const L=fpL(),i=L?(L.pl||[]).findIndex(q=>String(q.u)===u):-1;if(i>=0){L.pl.splice(i,1);WBS.fpSel=-1;WBS.fpMS=new Set();store();upd();if(WBX.wbCap)WBX.wbCap()}}}}
// a text just placed by a click: it is selected, the tool is put away (one text at a time, you are typing now) and the typing starts
function tinNew(q){tbArm(false);WBS.fpSel=q.u;WBS.fpMS=new Set();WBS.fpAnc=q.u;WBS.fpGhost=null;upd();setTimeout(tinStart,0)}
function init79(){
 document.addEventListener('pointerdown',e=>{if(TIN&&e.target!==$('txin'))tinStop()},true);
 addEventListener('resize',tinPlace);
 const t=$('tx_t');if(t)t.addEventListener('input',()=>{const e=$('txin');if(TIN&&e&&e.value!==t.value){e.value=t.value;tinPlace()}});
 // a word typed on the canvas must not run off it (review bug 9): once the box is wider than the canvas, the size comes down until it fits, through the same Size field you would use
 let fitT=0;if(t)t.addEventListener('input',()=>{if(!TIN)return;clearTimeout(fitT);fitT=setTimeout(()=>{const L=fpL(),p=L&&(L.pl||[]).find(q=>q.u==TIN),z=$('tx_sz');if(!p||!z||!(+p.bw>CW*.92))return;const n=Math.max(+z.min||5,Math.floor(+z.value*CW*.92/p.bw));if(n<+z.value){z.value=n;z.dispatchEvent(new Event('input',{bubbles:true}))}},250)});
 WBX.wbTxIn=tinStart;WBX.wbTxInNew=tinNew;WBX.wbTxInPlace=tinPlace;WBX.wbTxInOn=()=>!!TIN}
export {init79};
