import {$,WBS,WBX} from './01-launch-and-version.js';
import {geom,shOf} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {fpGrp,fpL,fpU} from './24-free-place-layers.js';
import {fpWH} from './25-art-layers.js';
import {txtLayer} from './26-text-boxes.js';

// ===== Stamp as composite (element update, step 6, 2.1.6): a stamp holds pictures and text as well as shapes.
// tile.el = [ {u, k:'text', tx, G, Lt, bw, bh, n, x, y, s, r, f, ...} ], in the stamp's own units (0..SW, 0..SH), drawn over the shapes inside the stamp's outline.
// They are the same records the layer's picture and text elements use, so they draw with the same code (artLayer and txtLayer, on a stand-in layer made of the stamp's list).
// A stamp that has none draws exactly as before. "Make stamp from selection" turns the selected pictures and text into a new stamp and puts one copy of it where they were.
const stcOk=q=>q&&((q.k=='text'&&q.tx&&q.Lt&&q.G));
// what to add to a stamp's symbol: the definitions (pictures are defined once) and the drawing, in list order
function stContents(t){const el=(t.el||[]).filter(stcOk);if(!el.length)return{defs:'',body:''};const li='s'+t.id,F={ink:t.ink,pl:el},X=txtLayer(F,li);let body='';
el.forEach(q=>{const m=X[4];const s=m&&m.get(String(q.u));if(s)body+=s});return{defs:X[0]||'',body}}
// the pictures a stamp needs saved with the project
function stArts(t,o){(t.el||[]).forEach(q=>{if(q.a)o.add(q.a)})}

function stcSel(){const L=fpL();return L?fpGrp().filter(q=>q.k=='text'):[]}
function stcMake(){const L=fpL(),sel=stcSel();if(!L||!sel.length)return;
const bs=sel.map(q=>{const wh=fpWH(q);if(!wh)return null;const h=Math.max(wh[0],wh[1])/2;return[q.x-h,q.y-h,q.x+h,q.y+h]}).filter(Boolean);if(!bs.length)return;
const x0=Math.min(...bs.map(b=>b[0])),y0=Math.min(...bs.map(b=>b[1])),x1=Math.max(...bs.map(b=>b[2])),y1=Math.max(...bs.map(b=>b[3])),cx=(x0+x1)/2,cy=(y0+y1)/2,big=Math.max(x1-x0,y1-y0,1);
const t={id:WBS.nid++,items:[],sh:{k:'rect',o:'p',s:[1,1],z:100},sym:{m:'off'},et:0,er:0,es:Math.floor(Math.random()*999),tu:[]},G=geom(shOf(t)),M=Math.max(G.SW,G.SH),kf=.9*M/big;
t.el=sel.map(q=>{const{x,y,s,...r}=q;return{...r,x:+(G.SW/2+(x-cx)*kf).toFixed(2),y:+(G.SH/2+(y-cy)*kf).toFixed(2),s:+(s*kf).toFixed(3)}});
WBS.tiles.push(t);WBS.cur=WBS.tiles.length-1;
const gone=new Set(sel.map(q=>q.u));L.pl=(L.pl||[]).filter(q=>!gone.has(q.u));
const q={u:fpU(),k:'stamp',t:t.id,x:+cx.toFixed(1),y:+cy.toFixed(1),s:+(M/kf).toFixed(2),r:0,f:1};L.pl.push(q);WBS.fpSel=q.u;WBS.fpMS=new Set();WBS.fpB=null;WBS.fpGhost=null;
WBX.wbLabelNext='Made stamp from selection';store();upd();if(WBX.wbCap)WBX.wbCap()}

const stcHx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function stcSync(){const b=$('stmksel'),host=$('stcl');if(!b||!host)return;const n=stcSel().length;if(b.disabled!==!n)b.disabled=!n;
const t=WBS.tiles[WBS.cur],el=t?(t.el||[]).filter(stcOk):[],key=JSON.stringify([t&&t.id,el.map(q=>[q.u,q.tx&&q.tx.text])]);if(host.dataset.k===key)return;host.dataset.k=key;
host.hidden=!el.length;
host.innerHTML=el.map((q,i)=>`<div class="mr"><b>${stcHx(String((q.tx&&q.tx.text)||'Text').replace(/\n/g,' ').slice(0,28))}<i>Text</i></b><button type="button" data-xi="${i}" aria-label="Take this out of the stamp">&#215;</button></div>`).join('')}
function init68(){
if(!$('stmksel'))return;
$('stmksel').onclick=stcMake;
$('stcl').onclick=e=>{const x=e.target.closest('[data-xi]'),t=WBS.tiles[WBS.cur];if(!x||!t)return;const list=(t.el||[]).filter(stcOk);const q=list[+x.dataset.xi];if(!q)return;t.el=t.el.filter(z=>z!==q);if(!t.el.length)delete t.el;store();upd();if(WBX.wbCap)WBX.wbCap()};
WBX.wbStcSync=stcSync;stcSync()}
export {init68,stArts,stContents,stcMake,stcSync};
