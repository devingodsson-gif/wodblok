import {kv} from '../platform/index.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {C,CC,CH,CM,CW,bk,paintColors,saveCC,setDim,shOf} from './04-canvas-and-stamp-outlines.js';
import {DEF_TILES,clean,cust,mkL,selOne,store} from './06-motif-library-folders.js';
import {gShOk} from './08-grid-shapes.js';
import {migLayers} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {ser} from './14-presets-and-layer-grid-ui.js';
import {savePr} from './15-print-effects-and-stamp-texture.js';
import {txClean} from './16-texture-generators.js';
import {buildTex,saveTex,texNorm} from './17-texture-panel-and-previews.js';
import {artLoad,artSnap,artUsed} from './25-art-layers.js';
import {clearAll} from './33-clear.js';
import {trayIn} from './50-tray-core.js';
// ---- Projects: the document, the status line, New project. A project is a .wodblok file (see 33-clear.js); the working copy autosaves in this browser for crash recovery.
const PDEF={pr:{e:3,q:0,t:'speckle',a:35,sc:100,sd:811},tex:{}};
// The pattern grid (its own tool in Pattern mode): show/hide, columns across, which points stamps snap to, line strength.
const PGD={show:false,n:8,m:'l',op:70,sh:'rect'};
const pgFix=o=>{let g={...PGD};const nn=v=>Math.max(2,Math.min(60,Math.round(+v)||8));
 if(o&&typeof o=='object'){g={show:!!o.show,n:nn(o.n),m:o.m=='c'||o.m=='b'?o.m:'l',op:Math.max(10,Math.min(100,Math.round(+o.op)||70)),sh:gShOk(o.sh)};if(o.snap!==undefined)g.snap=!!o.snap;if(o.ss!==undefined)g.ss=!!o.ss}
 return g};
const core=()=>({tiles:WBS.tiles,layers:WBS.layers,proj:WBS.proj,dim:WBS.dim,pr:WBS.pr,tex:WBS.tex,texLib:WBS.texLib,pg:{...WBS.pgrid},grade:WBX.wbGrade?WBX.wbGrade.get():null});
const coreStr=()=>JSON.stringify(core());
// ---- Book cover overlay: built-in label template, or the user's own image, centered with one scale.
const blank=()=>({img:'',iw:0,ih:0,sc:100});let covB;let covS;
let cov={img:'',iw:0,ih:0,sc:100};
const okImg=u=>typeof u=='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u);
const slotC=()=>WBS.cslot=='b'?covB:WBS.cslot=='s'?covS:cov,setSlotC=o=>{if(WBS.cslot=='b')covB=o;else if(WBS.cslot=='s')covS=o;else cov=o};
function covOrder(){const on=cov.tx!==false,a=$('art');if(on)a.insertBefore($('covg'),$('texg'));else a.appendChild($('covg'));$('covtx').checked=on;a.appendChild($('guig'))}
const saveCov=()=>{try{kv.set('wb40_coverB',JSON.stringify(covB));kv.set('wb40_coverS',JSON.stringify(covS))}catch(e){}try{kv.set('wb31_cover',JSON.stringify({...cov,on:$('cov').checked}))}catch(e){$('cvmsg').textContent='This image is too large to keep in the browser; it will stay until you reload. Saving the project keeps it.'}};
function renderCover(){const on=$('cov').checked,k=[on,CW,CH,WBS.book.on?JSON.stringify(WBS.book):'',...[cov,covB,covS].map(c=>[c.sc,c.img.length,c.img.slice(-24)].join(','))].join('|');if(k==WBS.covKey)return;WBS.covKey=k;let h='';
const put=(c,x,y,w,hh)=>{if(!c.img||!c.iw)return'';const f=Math.min(w/c.iw,hh/c.ih)*c.sc/100,iw=c.iw*f,ih=c.ih*f;return`<image href="${c.img}" x="${(x+(w-iw)/2).toFixed(1)}" y="${(y+(hh-ih)/2).toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}" preserveAspectRatio="xMidYMid meet"/>`};
if(on){if(WBS.book.on){const g=bk(),u=CW/g.W,y=g.b*u,hh=g.th*u;h=put(covB,g.b*u,y,g.tw*u,hh)+put(covS,(g.b+g.tw)*u,y,g.sw*u,hh)+put(cov,(g.b+g.tw+g.sw)*u,y,g.tw*u,hh)}else h=put(cov,0,0,CW,CH)}
drawGuides();
$('covg').innerHTML=h;covOrder()}
function drawGuides(){const G=$('guig');if(!WBS.book.on||!WBS.book.gd){G.innerHTML='';return}const g=bk(),u=CW/g.W,f=v=>(v*u).toFixed(2),lw=(CW/1000).toFixed(2),b=g.b,x1=b+g.tw,x2=x1+g.sw,sf=.125,ss=.0625;
const R=(x,y,w,h,st,da)=>`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="${st}" stroke-width="${lw}"${da?` stroke-dasharray="${da}"`:''}/>`,T=(x,y,t,r)=>{const fs=CW/70,w=t.length*fs*.66+fs*1.1,h=fs*1.5,tr=r?` transform="rotate(90 ${f(x)} ${f(y)})"`:'';return`<g${tr}><rect x="${(x*u-w/2).toFixed(2)}" y="${(y*u-fs*1.05).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${(h/4).toFixed(2)}" fill="#fff" fill-opacity=".94" stroke="#e0006e" stroke-width="${lw}"/><text x="${f(x)}" y="${f(y)}" font-family="system-ui,sans-serif" font-size="${fs.toFixed(1)}" font-weight="600" fill="#e0006e" text-anchor="middle" letter-spacing="1">${t}</text></g>`};
let o=`<path d="M0 0H${CW}V${CH}H0Z M${f(b)} ${f(b)}V${f(b+g.th)}H${f(g.W-b)}V${f(b)}Z" fill="rgba(224,0,110,.16)" fill-rule="evenodd"/>`;
o+=R(b,b,g.W-2*b,g.th,'#00a3c4');o+=`<line x1="${f(x1)}" y1="0" x2="${f(x1)}" y2="${CH}" stroke="#e0006e" stroke-width="${lw}"/><line x1="${f(x2)}" y1="0" x2="${f(x2)}" y2="${CH}" stroke="#e0006e" stroke-width="${lw}"/>`;
o+=R(b+sf,b+sf,g.tw-2*sf,g.th-2*sf,'#1a9a4a','4 3')+R(x2+sf,b+sf,g.tw-2*sf,g.th-2*sf,'#1a9a4a','4 3');if(g.sw>2*ss)o+=R(x1+ss,b+sf,g.sw-2*ss,g.th-2*sf,'#1a9a4a','4 3');
o+=R(x1-.25-2,b+g.th-.25-1.2,2,1.2,'#e0006e','6 3')+T(x1-1.25,b+g.th-.25-.55,'BARCODE');
o+=T(b+g.tw/2,b+.4,'BACK')+T(x2+g.tw/2,b+.4,'FRONT');if(g.sw>.15)o+=T(x1+g.sw/2,b+g.th/2,'SPINE',1);G.innerHTML=o}
function snapshot(){const c=JSON.parse(coreStr()),used=new Set();c.tiles.forEach(t=>t.items.forEach(q=>used.add(q.m)));
const cm={};Object.keys(cust).forEach(k=>{if(used.has(k))cm[k]=cust[k]});
return{app:'WODBLOK',v:21,...c,arts:artUsed(),cover:{img:cov.img,iw:cov.iw,ih:cov.ih,sc:cov.sc,tx:cov.tx!==false,on:$('cov').checked,back:covB,spine:covS,book:WBS.book},grade:WBX.wbGrade?WBX.wbGrade.get():null,lib:{motifs:cm,colors:C.filter(x=>CC.includes(x[0]))}}}
function applySnap(d){if(!d||!Array.isArray(d.tiles)||!d.tiles.length||!Array.isArray(d.layers))throw new Error('Not a WODBLOK project');
WBS.ARTS=artLoad(d.arts);const L=d.lib||{};Object.entries(L.motifs||{}).forEach(([k,v])=>{if(!v||typeof v.svg!='string')return;if(k.startsWith('t|')){if(/^<path d="[MLQZ0-9.,\- ]+" fill="FILL" fill-rule="evenodd"\/>$/.test(v.svg))cust[k]={n:String(v.n||'?').replace(/["<>&|]/g,'').slice(0,4),svg:v.svg,txt:1};return}if(k.startsWith('i|')){if(WBX.wbImpOk&&WBX.wbImpOk(k,v))cust[k]={n:String(v.n||'Imported shape').replace(/["<>&|]/g,'').slice(0,40),svg:v.svg,imp:1,...(v.g?{g:String(v.g).replace(/["<>&|]/g,'').slice(0,200)}:{})}}else{const c=clean(v.svg);if(c)cust[k]={n:String(v.n||'shape').replace(/["<>&|]/g,'').slice(0,40),svg:c,...(v.g?{g:String(v.g).replace(/["<>&|]/g,'').slice(0,200)}:{})}}});
(L.colors||[]).forEach(([n,h])=>{if(n&&/^#[0-9a-f]{6}$/i.test(h)&&!CM[n]){C.push([n,h]);CM[n]=h;CC.push(n)}});saveCC();paintColors();
WBS.tiles=JSON.parse(JSON.stringify(d.tiles));WBS.layers=JSON.parse(JSON.stringify(d.layers));
WBS.layers.forEach(L=>{L.st=(L.st||[]).filter(id=>WBS.tiles.some(t=>t.id==id));});if(!WBS.layers.length)WBS.layers=[mkL('Layer 1',WBS.tiles.map(t=>t.id),'check',180)];
WBS.proj=trayIn({proj:d.proj&&typeof d.proj=='object'?JSON.parse(JSON.stringify(d.proj)):{},tiles:WBS.tiles,layers:WBS.layers}).proj;
if(d.cover&&d.cover.book&&typeof d.cover.book=='object')WBS.book={...WBS.book,...d.cover.book};else WBS.book={...WBS.book,on:false};try{kv.set('wb40_book',JSON.stringify(WBS.book))}catch(e){}
WBS.dim=d.dim&&d.dim.s&&d.dim.c?JSON.parse(JSON.stringify(d.dim)):{s:[1,1],c:[2,3]};WBS.tiles.forEach(shOf);migLayers();setDim();WBS.pgrid=pgFix(d.pg);
WBS.pr={...PDEF.pr,...(d.pr||{})};WBS.tex={...PDEF.tex,...(d.tex||{})};WBS.texLib=txClean(d.texLib);texNorm();if(WBX.wbGrade)WBX.wbGrade.set(d.grade||null);{const c2=d.cover||{};cov={img:okImg(c2.img)?c2.img:'',iw:+c2.iw||0,ih:+c2.ih||0,sc:+c2.sc||100,tx:c2.tx!==false};if(!cov.iw||!cov.ih)cov.img='';const sl=o=>o&&okImg(o.img)&&+o.iw&&+o.ih?{img:o.img,iw:+o.iw,ih:+o.ih,sc:+o.sc||100}:blank();covB=sl(c2.back);covS=sl(c2.spine);WBS.cslot='f';$('cov').checked=c2.on!==false;saveCov();WBS.covKey='';if(WBX.wbBookSync)WBX.wbBookSync()}
WBS.nid=1+Math.max(0,...WBS.tiles.map(t=>+t.id||0));WBS.cur=0;selOne(-1);WBS.selL=WBS.layers.length-1;WBS.symKey='';$('sasp').dataset.custom='';$('casp').dataset.custom='';
try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}store();savePr();saveTex();WBH.syncPr();WBH.syncTex();buildTex();upd()}
// The status line fades after a while so an old message is not mistaken for the result of the last action; progress notes (ending in …) stay until replaced.
let pmT=0;const pmsg=t=>{if(typeof t=='string'&&/Mac|iPhone|iPad/.test(navigator.platform||''))t=t.replace(/Ctrl\+/g,'Cmd+');$('pmsg').textContent=t;clearTimeout(pmT);if(t&&!/…$/.test(t))pmT=setTimeout(()=>{$('pmsg').textContent=''},12000);return t};
const dirty=()=>coreStr()!==WBS.cp.saved||$('pnm').value.trim()!==WBS.cp.name;
function paintPst(){const u=dirty(),e=$('pst');e.textContent='';e.className=u?'dirty':'';e.title=u?'Unsaved changes':'';if(u)e.setAttribute('role','img'),e.setAttribute('aria-label',e.title);else e.removeAttribute('aria-label')}
const newId=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function thumb(w0){return new Promise(res=>{try{const img=new Image(),to=setTimeout(()=>res(''),5000);img.onload=()=>{try{const w=w0||200,h=Math.round(w*CH/CW),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);clearTimeout(to);res(c.toDataURL('image/jpeg',.7))}catch(e){res('')}};img.onerror=()=>res('');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser())}catch(e){res('')}})}
// The project as it is written to a file: the document plus the pictures Art layers use (so another project can take this one as a picture).
async function fileSnap(){const sn=snapshot(),a=await artSnap();if(a)sn.art=a;return sn}
// two-tap confirm for actions that would drop unsaved work
const confirm2=(btn,label,fn)=>{if(!dirty()||btn.dataset.sure){delete btn.dataset.sure;return fn()}btn.dataset.sure='1';const o=btn.textContent;btn.textContent=label;setTimeout(()=>{delete btn.dataset.sure;btn.textContent=o},3500)};
function openData(d,id,name){applySnap(d);WBS.cp={id,name,saved:coreStr()};$('pnm').value=name;paintPst();if(WBX.wbResetHist)WBX.wbResetHist();if(WBX.wbWatch)WBX.wbWatch()}
function init18(){WBS.pgrid={...PGD};
covB=blank();covS=blank();WBS.cslot='f';
try{const q=JSON.parse(kv.get('wb40_coverB')||'null');if(q&&typeof q.sc=='number')covB={...covB,...q}}catch(e){}
try{const q=JSON.parse(kv.get('wb40_coverS')||'null');if(q&&typeof q.sc=='number')covS={...covS,...q}}catch(e){}try{const q=JSON.parse(kv.get('wb31_cover')||'null');if(q&&typeof q.sc=='number')cov={...cov,...q};if(q&&q.on===false)$('cov').checked=false}catch(e){}if(!okImg(cov.img))cov.img='';if(!okImg(covB.img))covB.img='';if(!okImg(covS.img))covS.img='';
$('covtx').onchange=()=>{cov.tx=$('covtx').checked;saveCov();covOrder()};
WBS.covKey='';
$('cov').addEventListener('input',()=>{saveCov();renderCover()});
WBS.cp={id:null,name:'',saved:''};
$('pnm').value=WBS.cp.name||'';setInterval(paintPst,800);paintPst();
$('pnw').onclick=()=>{confirm2($('pnw'),'Click again: can’t be undone',()=>{const t=JSON.parse(DEF_TILES);
openData({tiles:t,layers:[mkL('Layer 1',t.map(x=>x.id),'check',180)],proj:{...PCOL},dim:{s:[1,1],c:[2,3]},pr:PDEF.pr,tex:PDEF.tex},null,'');clearAll(true);cov={img:'',iw:0,ih:0,sc:100};covB=blank();covS=blank();WBS.cslot='f';saveCov();WBS.covKey='';renderCover();WBS.cp.saved=coreStr();paintPst()});
// first click with unsaved work: the button says so (the File menu stays open, see 34-desktop-shell) and the status bar explains
if($('pnw').dataset.sure)pmsg('Starting a new project can’t be undone. Click New project again to discard this one.')};
}
export {PGD,fileSnap,thumb,confirm2,coreStr,covOrder,covS,dirty,newId,openData,paintPst,pgFix,pmsg,renderCover,snapshot,init18};
