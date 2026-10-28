import {kv} from '../platform/index.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {C,CC,CH,CM,CW,bk,paintColors,saveCC,setDim,shOf,stvOn} from './04-canvas-and-stamp-outlines.js';
import {DEF_TILES,clean,cust,flatEls,mkL,oneLayer,selOne,store} from './06-motif-library-folders.js';
import {gShOk} from './08-grid-shapes.js';
import {migLayers} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {ser} from './14-presets-and-layer-grid-ui.js';
import {txClean} from './16-texture-generators.js';
import {buildTex,saveTex,texNorm} from './17-texture-panel-and-previews.js';
import {artLoad,artSnap,artUsed} from './25-art-layers.js';
import {clearAll} from './33-clear.js';
import {trayIn} from './50-tray-core.js';
import {mkEL} from './71-randomize-elements.js';
// ---- Projects: the document, the status line, New project. A project is a .wodblok file (see 33-clear.js); the working copy autosaves in this browser for crash recovery.
const PDEF={tex:{}};
// The pattern grid (its own tool in Pattern mode): show/hide, columns across, which points stamps snap to, line strength.
const PGD={show:false,n:8,m:'l',op:70,sh:'rect'};
const pgFix=o=>{let g={...PGD};const nn=v=>Math.max(2,Math.min(60,Math.round(+v)||8));
 if(o&&typeof o=='object'){g={show:!!o.show,n:nn(o.n),m:o.m=='c'||o.m=='b'?o.m:'l',op:Math.max(10,Math.min(100,Math.round(+o.op)||70)),sh:gShOk(o.sh)};if(o.snap!==undefined)g.snap=!!o.snap;if(o.ss!==undefined)g.ss=!!o.ss}
 return g};
const core=()=>({tiles:WBS.tiles,els:flatEls(WBS.layers),proj:WBS.proj,dim:WBS.dim,tex:WBS.tex,texLib:WBS.texLib,pg:{...WBS.pgrid},grade:WBX.wbGrade?WBX.wbGrade.get():null});
const coreStr=()=>JSON.stringify(core());
// ---- Book guides: trim, spine and safe-area lines drawn over the cover; redrawn only when the canvas, the book or the Stamp view changes.
function renderGuides(){const k=[stvOn(),CW,CH,WBS.book.on?JSON.stringify(WBS.book):''].join('|');if(k==WBS.guiKey)return;WBS.guiKey=k;drawGuides()}
function drawGuides(){const G=$('guig');if(stvOn()||!WBS.book.on||!WBS.book.gd){G.innerHTML='';return}const g=bk(),u=CW/g.W,f=v=>(v*u).toFixed(2),lw=(CW/1000).toFixed(2),b=g.b,x1=b+g.tw,x2=x1+g.sw,sf=.125,ss=.0625;
const R=(x,y,w,h,st,da)=>`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="${st}" stroke-width="${lw}"${da?` stroke-dasharray="${da}"`:''}/>`,T=(x,y,t,r)=>{const fs=CW/70,w=t.length*fs*.66+fs*1.1,h=fs*1.5,tr=r?` transform="rotate(90 ${f(x)} ${f(y)})"`:'';return`<g${tr}><rect x="${(x*u-w/2).toFixed(2)}" y="${(y*u-fs*1.05).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${(h/4).toFixed(2)}" fill="#fff" fill-opacity=".94" stroke="#e0006e" stroke-width="${lw}"/><text x="${f(x)}" y="${f(y)}" font-family="system-ui,sans-serif" font-size="${fs.toFixed(1)}" font-weight="600" fill="#e0006e" text-anchor="middle" letter-spacing="1">${t}</text></g>`};
let o=`<path d="M0 0H${CW}V${CH}H0Z M${f(b)} ${f(b)}V${f(b+g.th)}H${f(g.W-b)}V${f(b)}Z" fill="rgba(224,0,110,.16)" fill-rule="evenodd"/>`;
o+=R(b,b,g.W-2*b,g.th,'#00a3c4');o+=`<line x1="${f(x1)}" y1="0" x2="${f(x1)}" y2="${CH}" stroke="#e0006e" stroke-width="${lw}"/><line x1="${f(x2)}" y1="0" x2="${f(x2)}" y2="${CH}" stroke="#e0006e" stroke-width="${lw}"/>`;
o+=R(b+sf,b+sf,g.tw-2*sf,g.th-2*sf,'#1a9a4a','4 3')+R(x2+sf,b+sf,g.tw-2*sf,g.th-2*sf,'#1a9a4a','4 3');if(g.sw>2*ss)o+=R(x1+ss,b+sf,g.sw-2*ss,g.th-2*sf,'#1a9a4a','4 3');
o+=R(x1-.25-2,b+g.th-.25-1.2,2,1.2,'#e0006e','6 3')+T(x1-1.25,b+g.th-.25-.55,'BARCODE');
o+=T(b+g.tw/2,b+.4,'BACK')+T(x2+g.tw/2,b+.4,'FRONT');if(g.sw>.15)o+=T(x1+g.sw/2,b+g.th/2,'SPINE',1);G.innerHTML=o}
function snapshot(){const c=JSON.parse(coreStr()),used=new Set();c.tiles.forEach(t=>t.items.forEach(q=>used.add(q.m)));
const cm={};Object.keys(cust).forEach(k=>{if(used.has(k))cm[k]=cust[k]});
return{app:'WODBLOK',v:29,...c,arts:artUsed(),texImgs:WBX.wbTexImgsUsed?WBX.wbTexImgsUsed():{},cover:{book:WBS.book},grade:WBX.wbGrade?WBX.wbGrade.get():null,lib:{motifs:cm,colors:C.filter(x=>CC.includes(x[0]))}}}
function applySnap(d){if(!d||!Array.isArray(d.tiles)||!(Array.isArray(d.els)||Array.isArray(d.layers)))throw new Error('Not a WODBLOK project');
WBS.ARTS=artLoad(d.arts);const L=d.lib||{};Object.entries(L.motifs||{}).forEach(([k,v])=>{if(!v||typeof v.svg!='string')return;if(k.startsWith('t|')){if(/^<path d="[MLQZ0-9.,\- ]+" fill="FILL" fill-rule="evenodd"\/>$/.test(v.svg))cust[k]={n:String(v.n||'?').replace(/["<>&|]/g,'').slice(0,4),svg:v.svg,txt:1};return}if(k.startsWith('i|')){if(WBX.wbImpOk&&WBX.wbImpOk(k,v))cust[k]={n:String(v.n||'Imported shape').replace(/["<>&|]/g,'').slice(0,40),svg:v.svg,imp:1,...(v.g?{g:String(v.g).replace(/["<>&|]/g,'').slice(0,200)}:{})}}else{const c=clean(v.svg);if(c)cust[k]={n:String(v.n||'shape').replace(/["<>&|]/g,'').slice(0,40),svg:c,...(v.g?{g:String(v.g).replace(/["<>&|]/g,'').slice(0,200)}:{})}}});
(L.colors||[]).forEach(([n,h])=>{if(n&&/^#[0-9a-f]{6}$/i.test(h)&&!CM[n]){C.push([n,h]);CM[n]=h;CC.push(n)}});saveCC();paintColors();
WBS.tiles=JSON.parse(JSON.stringify(d.tiles));WBS.layers=[oneLayer(JSON.parse(JSON.stringify(Array.isArray(d.els)?d.els:flatEls(d.layers))),WBS.tiles.map(t=>t.id))];
WBS.proj=trayIn({proj:d.proj&&typeof d.proj=='object'?JSON.parse(JSON.stringify(d.proj)):{},tiles:WBS.tiles,layers:WBS.layers}).proj;
if(d.cover&&d.cover.book&&typeof d.cover.book=='object')WBS.book={...WBS.book,...d.cover.book};else WBS.book={...WBS.book,on:false};try{kv.set('wb40_book',JSON.stringify(WBS.book))}catch(e){}
WBS.dim=d.dim&&d.dim.s&&d.dim.c?JSON.parse(JSON.stringify(d.dim)):{s:[1,1],c:[2,3]};WBS.tiles.forEach(shOf);migLayers();setDim();WBS.pgrid=pgFix(d.pg);
WBS.tex={...PDEF.tex,...(d.tex||{})};if(WBX.wbTexImgsLoad)WBX.wbTexImgsLoad(d.texImgs);WBS.texLib=txClean(d.texLib);texNorm();if(WBX.wbGrade)WBX.wbGrade.set(d.grade||null);WBS.guiKey='';if(WBX.wbBookSync)WBX.wbBookSync();
WBS.nid=1+Math.max(0,...WBS.tiles.map(t=>+t.id||0));WBS.cur=0;selOne(-1);WBS.selL=WBS.layers.length-1;WBS.symKey='';$('sasp').dataset.custom='';$('casp').dataset.custom='';
try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}store();saveTex();WBH.syncTex();buildTex();upd()}
// The status line fades after a while so an old message is not mistaken for the result of the last action; progress notes (ending in …) stay until replaced.
let pmT=0;const pmsg=t=>{if(typeof t=='string'&&/Mac|iPhone|iPad/.test(navigator.platform||''))t=t.replace(/Ctrl\+/g,'Cmd+');$('pmsg').textContent=t;clearTimeout(pmT);if(t&&!/…$/.test(t))pmT=setTimeout(()=>{$('pmsg').textContent=''},12000);return t};
const dirty=()=>coreStr()!==WBS.cp.saved||$('pnm').value.trim()!==WBS.cp.name;
function paintPst(){const u=dirty(),e=$('pst');e.textContent='';e.className=u?'dirty':'';e.title=u?'Unsaved changes':'';if(u)e.setAttribute('role','img'),e.setAttribute('aria-label',e.title);else e.removeAttribute('aria-label')}
const newId=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function thumb(w0){return new Promise(res=>{try{const img=new Image(),to=setTimeout(()=>res(''),5000);img.onload=()=>{try{const w=w0||200,h=Math.round(w*CH/CW),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);clearTimeout(to);res(c.toDataURL('image/jpeg',.7))}catch(e){res('')}};img.onerror=()=>res('');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser())}catch(e){res('')}})}
// The project as it is written to a file: the document plus the pictures Art layers use (so another project can take this one as a picture).
async function fileSnap(){const sn=snapshot(),a=await artSnap();if(a)sn.art=a;return sn}
// two-tap confirm for actions that would drop unsaved work
// (2.24.0) only the button's words change, so a menu item keeps its icon
const c2Txt=btn=>[...btn.childNodes].reverse().find(n=>n.nodeType==3&&n.nodeValue.trim())||null;
const confirm2=(btn,label,fn)=>{if(!dirty()||btn.dataset.sure){delete btn.dataset.sure;return fn()}btn.dataset.sure='1';const t=c2Txt(btn),o=t?t.nodeValue:btn.textContent;if(t)t.nodeValue=label;else btn.textContent=label;setTimeout(()=>{delete btn.dataset.sure;const t2=c2Txt(btn);if(t2)t2.nodeValue=o;else btn.textContent=o},3500)};
function openData(d,id,name){if(WBX.wbSteReset)WBX.wbSteReset();applySnap(d);if(WBX.wbClipClear)WBX.wbClipClear();WBS.cp={id,name,saved:coreStr()};$('pnm').value=name;paintPst();if(WBX.wbResetHist)WBX.wbResetHist();if(WBX.wbWatch)WBX.wbWatch()}
function init18(){WBS.pgrid={...PGD};
WBS.guiKey='';
WBS.cp={id:null,name:'',saved:''};
$('pnm').value=WBS.cp.name||'';setInterval(paintPst,800);paintPst();
$('pnw').onclick=()=>{confirm2($('pnw'),'Click again: can’t be undone',()=>{const t=JSON.parse(DEF_TILES);
openData({tiles:t,layers:[mkEL('Layer 1',t.map(x=>x.id))],proj:{...PCOL},dim:{s:[1,1],c:[2,3]},tex:PDEF.tex},null,'');clearAll(true);WBS.guiKey='';renderGuides();WBS.cp.saved=coreStr();paintPst()});
// first click with unsaved work: the button says so (the File menu stays open, see 34-desktop-shell) and the status bar explains
if($('pnw').dataset.sure)pmsg('A new project can’t be undone. New project again to discard this one.')};
}
export {PGD,fileSnap,thumb,confirm2,coreStr,dirty,newId,openData,paintPst,pgFix,pmsg,renderGuides,snapshot,init18};
