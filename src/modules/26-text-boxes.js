import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {C,CH,CM,CW,col,okC} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {txFilt,txImgs,txIsW,txRid,txSpecs} from './16-texture-generators.js';
import {txRefresh,txReg} from './17-texture-panel-and-previews.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {mkWell,paintWell} from './52-tray-ui.js';
import {fpGrp,fpL,fpU} from './24-free-place-layers.js';
import {fpWH} from './25-art-layers.js';
// ===== Text boxes (Layout > Text). A layer in Text mode has L.free = true, L.txt = true and L.pl = [{u, tx:{text,f,sz,ls,lh,al,cv,rot}, G:{key:path}, Lt:[[key,x,y,rot,scale]], bw,bh,n, x,y,s,r,f}].
// The letters are stored as outlines (centred on the box), so the project needs no fonts to show them. s = the box's long side on the canvas.
const fx1=v=>(+v).toFixed(1);
function txtGl(p,fill,pre){const G=p.G,Lt=p.Lt;if(!G||typeof G!='object'||!Array.isArray(Lt)||Lt.length>800)return'';let d0='',o='';const seen={};
for(const l of Lt){if(!Array.isArray(l))continue;const d=G[l[0]];if(typeof d!='string'||!/^[MLQZ0-9.,\- ]+$/.test(d))continue;const x=+l[1],y=+l[2],r=+l[3],s=+l[4];if(![x,y,r,s].every(isFinite))continue;
const id=pre+'_'+String(l[0]).replace(/[^\w-]/g,'_');if(!seen[id]){seen[id]=1;d0+=`<path id="${id}" d="${d}"/>`}o+=`<use href="#${id}" transform="translate(${x} ${y}) rotate(${r}) scale(${s})"/>`}
return`<defs>${d0}</defs><g fill="${fill}" fill-rule="evenodd">${o}</g>`}
let TXM;
function txMask(id,p){const q=txSpecs(p.tu,'wear');if(!q.length||!WBS.edInk)return'';const W=Math.max(1,+p.bw||1),H=Math.max(1,+p.bh||1),x=(-W/2).toFixed(2),y=(-H/2).toFixed(2),v=txImgs(q,W,H,384,'host',txIsW,x,y);if(!v)return'';
const key=id+'|'+v+'|'+W+'|'+H;if(TXM.has(key))return TXM.get(key);
const m=`<mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${W}" height="${H}"><rect x="${x}" y="${y}" width="${W}" height="${H}" fill="#fff"/>${v}</mask>`;
if(TXM.size>300)TXM.delete(TXM.keys().next().value);TXM.set(key,m);return m}
function txOvF(p){const q=txSpecs(p.tu,'wear');if(!q.length||!WBS.edInk)return'';const W=Math.max(1,+p.bw||1),H=Math.max(1,+p.bh||1);return txFilt(q,-W/2,-H/2,W,H,384)}
function txtLayer(L,li){const pl=(L.pl||[]).filter(p=>p.tx&&p.Lt&&p.G);if(!pl.length)return['',''];const f=v=>(+v).toFixed(2),ed=li==WBS.selL&&!$('boardP').classList.contains('off'),fill=okC(L.ink)?col(L.ink):col(WBS.proj.ink);let out='',defs='';
pl.forEach(p=>{const[w,h]=fpWH(p),k=p.s/Math.max(p.n||1,.01),mid='tm'+li+'_'+String(p.u).replace(/[^\w-]/g,''),mk=txMask(mid,p),fo=txOvF(p);if(mk)defs+=mk;const pf=okC(p.ink)?col(p.ink):fill,hit=ed?`<rect transform="rotate(${+p.r||0})" x="${f(-w/2)}" y="${f(-h/2)}" width="${f(w)}" height="${f(h)}" fill="none" pointer-events="all" style="cursor:move"/>`:'';
out+=`<g${ed?` data-fp="${p.u}"`:''} transform="translate(${f(+p.x)} ${f(+p.y)})">${hit}<g transform="rotate(${+p.r||0}) scale(${(k*(p.f||1)).toFixed(4)} ${k.toFixed(4)})"${fo?` filter="url(#${fo})"`:''}${mk?` mask="url(#${mid})"`:''}>${txtGl(p,pf,'tg'+li+'_'+String(p.u).replace(/[^\w-]/g,''))}</g></g>`});
const lop=L.op!=null?Math.max(0,Math.min(100,+L.op)):100,lbl=L.bl&&L.bl!='behind'&&L.bl!='cancel'&&L.bl!='replace'?L.bl:'';
return[defs,`<g${lop<100?` opacity="${(lop/100).toFixed(2)}"`:''}${lbl?` style="mix-blend-mode:${lbl}"`:''}>${out}</g>`]}
var tbSty={tu:[],ink:''},tbKey='',tbLoad=false,tbT=0,tbAl='c',tbTc='',tbVa='t',tbOv='',tbRelTok=0;var tbG=null,tbGT=0;
const tbSet=(id,v)=>{const el=$(id);if(+el.value!=+v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};
const tbSel=()=>{const L=fpL();return L&&L.txt?(L.pl||[]).find(q=>q.u==WBS.fpSel&&q.tx)||null:null};
function tbRead(){return{text:$('tx_t').value.replace(/\r/g,'').slice(0,200),f:$('tx_f').value||'cinzel',sz:+$('tx_sz').value,ls:+$('tx_ls').value,ws:+$('tx_ws').value,lh:+$('tx_lh').value,al:tbAl,tc:tbTc,va:tbVa,wd:+$('tx_wd').value,ht:+$('tx_ht').value,cv:+$('tx_cv').value,rot:+$('tx_rot').value,...(+$('tx_pd').value?{pd:+$('tx_pd').value}:{}),...($('tx_ft').value?{ft:$('tx_ft').value}:{}),...(tbOv?{ov:tbOv}:{})}}
// A placed text after its box width or height was pulled with a handle: the letters keep their size and the lines break again. keepTop keeps the top edge where it is while the height follows the lines.
async function tbRelay(p,keepTop,drag){const tok=++tbRelTok,R=await WBX.wbTxLay(p.tx);if(tok!==tbRelTok||!R)return;const L=fpL();if(!L||!(L.pl||[]).includes(p))return;const ra=p.s/Math.max(p.n||1,.01),dh=(R.bh-p.bh)*ra/2,r=(+p.r||0)*Math.PI/180;p.G=R.G;p.Lt=R.Lt;p.bw=R.bw;p.bh=R.bh;p.n=Math.max(R.bw,R.bh);p.s=+(ra*p.n).toFixed(2);if(keepTop){p.x=+(p.x-dh*Math.sin(r)).toFixed(1);p.y=+(p.y+dh*Math.cos(r)).toFixed(1);if(drag){drag.x0-=dh*Math.sin(r);drag.y0+=dh*Math.cos(r)}}tbKey='';upd()}
function tbArmUI(){const b=$('tx_go');if(b){b.classList.toggle('on',WBS.txArm);b.setAttribute('aria-pressed',String(WBS.txArm))}}
function tbGhost(){clearTimeout(tbGT);tbGT=setTimeout(async()=>{if(!WBS.txArm)return;const o=tbRead();if(!o.text.trim()){tbG=null;WBH.fpOverlay();return}const R=await WBX.wbTxLay(o);if(!WBS.txArm)return;tbG=R;WBH.fpOverlay()},120)}
function tbArm(on){WBS.txArm=on;if(on){WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpB=null;tbKey='';tbGhost()}else{tbG=null}tbArmUI();upd()}
var tbInkK='',TBW=null;
function tbStyUI(){tbLoad=true;try{if(TBW)paintWell(TBW,true)}finally{tbLoad=false}}
function tbStyle(k,v){const grp=fpGrp().filter(q=>q.tx);if(k=='ink'){tbSty.ink=v;grp.forEach(q=>{if(v)q.ink=v;else delete q.ink})}tbStyUI();if(grp.length){store();if(WBX.wbCap)WBX.wbCap()}upd();if(WBS.txArm)WBH.fpOverlay()}
function tbStySet(a){const grp=fpGrp().filter(q=>q.tx);tbSty.tu=a.map(u=>({...u}));grp.forEach(q=>{q.tu=a.map((u,i)=>{const o=(q.tu||[])[i];return o&&o.x===u.x?o:{x:u.x,sd:grp.length>1?txRid():u.sd}})});if(grp.length){store();if(WBX.wbCap)WBX.wbCap()}upd();if(WBS.txArm)WBH.fpOverlay();txRefresh()}
function tbStyVary(i){const grp=fpGrp().filter(q=>q.tx);if(tbSty.tu[i])tbSty.tu[i]={...tbSty.tu[i],sd:txRid()};grp.forEach(q=>{if(q.tu&&q.tu[i])q.tu[i]={...q.tu[i],sd:txRid()}});if(grp.length){store();if(WBX.wbCap)WBX.wbCap()}upd();txRefresh()}
function txbSync(L){if(!L.txt)WBS.txArm=false;else if(WBS.txArm&&tbSel()){WBS.txArm=false;tbArmUI()}
if(L.txt&&WBS.curView=='pattern'&&$('tx_sprow'))$('tx_sprow').hidden=!tbSel();{const sw=$('lfps').closest('.ctl')||$('lfps'),lb=sw.previousElementSibling;sw.style.display=L.txt?'none':'';if(lb&&lb.tagName=='LABEL')lb.style.display=L.txt?'none':''}if(!L.txt||!$('tx_t')||WBS.curView!='pattern')return;const p=tbSel();$('tx_ed').hidden=!p;if(p)$('tx_edn').textContent=String(p.tx.text).replace(/\n/g,' ').slice(0,30);
const key=p?p.u+'|'+Math.round(p.s*10)+'|'+(p.tx.wd||0)+'|'+(p.tx.ht||0)+'|'+(p.tx.va||'t')+'|'+(p.tx.pd||0)+(p.tx.ft||'')+(p.tx.ov||''):'-';if(key===tbKey)return;tbKey=key;if(!p)return;
tbSty={tu:(Array.isArray(p.tu)?p.tu:[]).map(u=>({...u})),ink:p.ink||''};tbStyUI();tbLoad=true;try{const o=p.tx,ra=p.s/Math.max(p.n||1,.01);if($('tx_t').value!==o.text)$('tx_t').value=o.text;$('tx_f').value=o.f;tbSet('tx_sz',Math.max(2,Math.min(60,+(o.sz*ra).toFixed(1))));tbSet('tx_ls',o.ls);tbSet('tx_ws',o.ws||0);tbSet('tx_lh',o.lh);tbSet('tx_wd',Math.max(0,Math.min(400,Math.round((o.wd||0)*ra))));tbSet('tx_ht',Math.max(0,Math.min(400,Math.round((o.ht||0)*ra))));tbVa=o.va||'t';document.querySelectorAll('#tx_va [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v==tbVa));tbSet('tx_pd',o.pd||0);$('tx_ft').value=o.ft||'';tbOv=o.ov||'';document.querySelectorAll('#tx_ov [data-o]').forEach(b=>b.classList.toggle('on',b.dataset.o==tbOv));tbSet('tx_cv',o.cv);tbSet('tx_rot',o.rot);tbAl=o.al||'c';tbTc=o.tc||'';document.querySelectorAll('#tx_al [data-a]').forEach(b=>b.classList.toggle('on',b.dataset.a==tbAl));document.querySelectorAll('#tx_tc [data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c==tbTc))}finally{tbLoad=false}}
// the Text tool in the Pattern editor: with no Text layer selected, typing makes one
function tbEnsure(){let L=fpL();if(L&&L.txt)return L;if(!WBX.wbAddLayer)return null;if(WBX.wbCap)WBX.wbCap();WBX.wbAddLayer('t');if(WBX.wbOpenPanel)WBX.wbOpenPanel('text');L=fpL();return L&&L.txt?L:null}
function tbLive(){if(tbLoad||WBS.curView!='pattern')return;let p=tbSel(),L=fpL();if(!p){if(!(L&&L.txt)){if(!tbRead().text.trim())return;L=tbEnsure();if(!L)return}if(!WBS.txArm&&tbRead().text.trim()){tbArm(true)}else if(WBS.txArm)tbGhost();return}clearTimeout(tbT);tbT=setTimeout(async()=>{const o=tbRead();if(!o.text.trim())return;const R=await WBX.wbTxLay(o);if(!R||!L.pl.includes(p))return;
p.tx=o;p.G=R.G;p.Lt=R.Lt;p.bw=R.bw;p.bh=R.bh;p.n=Math.max(R.bw,R.bh);p.s=+p.n.toFixed(2);tbKey=p.u+'|'+Math.round(p.s*10);store();upd();if(WBX.wbCap)WBX.wbCap()},160)}
async function tbAdd(){const L=fpL();if(!L||!L.txt)return;const o=tbRead();if(!o.text.trim())return;const R=await WBX.wbTxLay(o);if(!R){pmsg('No letters came out. Try another font.');return}
L.pl=L.pl||[];const c=L.pl.filter(z=>z.tx).length,n=Math.max(R.bw,R.bh),q={u:fpU(),tx:o,G:R.G,Lt:R.Lt,bw:R.bw,bh:R.bh,n,x:+(CW/2+((c%4)-1.5)*CW*.03).toFixed(1),y:+(CH/2+((c%4)-1.5)*CW*.03).toFixed(1),s:+n.toFixed(2),r:0,f:1};
L.pl.push(q);WBS.fpSel=q.u;WBS.fpMS=new Set();WBS.fpB=null;WBS.fpGhost=null;tbKey='';store();upd();if(WBX.wbCap)WBX.wbCap()}
function init26(){
TXM=new Map();WBS.txArm=false;
{['tx_t','tx_f','tx_sz','tx_ls','tx_ws','tx_lh','tx_wd','tx_ht','tx_cv','tx_rot','tx_pd','tx_ft'].forEach(id=>$(id).addEventListener('input',tbLive));
$('tx_al').addEventListener('click',e=>{if(WBS.curView!='pattern')return;const b=e.target.closest('[data-a]');if(!b)return;tbAl=b.dataset.a;document.querySelectorAll('#tx_al [data-a]').forEach(x=>x.classList.toggle('on',x==b));tbLive()});
$('tx_ov').addEventListener('click',e=>{if(WBS.curView!='pattern')return;const b=e.target.closest('[data-o]');if(!b)return;tbOv=b.dataset.o;document.querySelectorAll('#tx_ov [data-o]').forEach(x=>x.classList.toggle('on',x==b));tbLive()});
$('tx_va').addEventListener('click',e=>{if(WBS.curView!='pattern')return;const b=e.target.closest('[data-v]');if(!b)return;tbVa=b.dataset.v;document.querySelectorAll('#tx_va [data-v]').forEach(x=>x.classList.toggle('on',x==b));tbLive()});
$('tx_tc').addEventListener('click',e=>{if(WBS.curView!='pattern')return;const b=e.target.closest('[data-c]');if(!b)return;tbTc=b.dataset.c;document.querySelectorAll('#tx_tc [data-c]').forEach(x=>x.classList.toggle('on',x==b));tbLive()});
TBW=mkWell($('wl_tx'),{label:'Text colour',what:'Text',def:'Layer colour',defRef:()=>{const L=fpL();return L&&okC(L.ink)?L.ink:WBS.proj.ink},get:()=>okC(tbSty.ink)?tbSty.ink:'',set:v=>{if(!tbLoad)tbStyle('ink',v||'')}});
txReg('tx_tex',{md:'wear',def:'pinholes',get:()=>{const p=tbSel();return p?(Array.isArray(p.tu)?p.tu:[]):tbSty.tu},set:tbStySet,vary:tbStyVary});
WBX.wbTbRelay=tbRelay;WBX.wbTxUses=()=>tbSty.tu;WBX.wbTxCut=id=>{tbSty.tu=tbSty.tu.filter(u=>u.x!==id)};
$('tx_split').addEventListener('click',async()=>{if(WBS.curView!='pattern')return;const L=fpL();if(!L||!L.txt)return;const grp=fpGrp().filter(q=>q.tx);if(!grp.length)return;if(WBX.wbCap)WBX.wbCap();const cache=new Map(),made=[];let total=0;
for(const p of grp){const ra=p.s/Math.max(p.n||1,.01),k=ra,rr=(+p.r||0)*Math.PI/180,cs=Math.cos(rr),sn=Math.sin(rr),fl=p.f||1,out=[];
for(const l of (p.Lt||[])){const key=String(l[0]),cp=parseInt(key.split('|').pop(),36);if(!isFinite(cp))continue;let ch;try{ch=String.fromCodePoint(cp)}catch(e){continue}
const o={...p.tx,text:ch,cv:0,rot:0,wd:0,ht:0,sz:+(p.tx.sz*ra).toFixed(2)},ck=[o.f,o.sz,ch].join('|');let R=cache.get(ck);if(R===undefined){R=await WBX.wbTxLay(o);cache.set(ck,R)}if(!R)continue;
const lx=(+l[1])*k*fl,ly=(+l[2])*k,n=Math.max(R.bw,R.bh);
out.push({u:fpU(),tx:o,G:R.G,Lt:R.Lt,bw:R.bw,bh:R.bh,n,x:+((+p.x)+lx*cs-ly*sn).toFixed(1),y:+((+p.y)+lx*sn+ly*cs).toFixed(1),s:+n.toFixed(2),r:+(((+p.r||0)+fl*(+l[3]||0))%360).toFixed(1),f:fl,...(Array.isArray(p.tu)&&p.tu.length?{tu:p.tu.map(u=>({x:u.x,sd:txRid()}))}:{}),...(p.ink?{ink:p.ink}:{})})}
if(!out.length)continue;const i=L.pl.indexOf(p);if(i<0)continue;L.pl.splice(i,1,...out);made.push(...out);total+=out.length}
if(!made.length){pmsg('There were no letters to split.');return}
WBS.fpMS=new Set(made.map(q=>String(q.u)));WBS.fpSel=made[made.length-1].u;WBS.fpB=null;WBS.txArm=false;tbArmUI();tbKey='';store();upd();if(WBX.wbCap)WBX.wbCap();pmsg(`Split into ${total} letter${total>1?'s':''}. They are selected, so you can move them together or click one to change it alone.`)});
$('tx_go').addEventListener('click',()=>{if(WBS.curView!='pattern')return;if(WBS.txArm){tbArm(false);return}if(!tbRead().text.trim()){$('tx_t').focus();return}if(!tbEnsure())return;tbArm(true)});
$('tx_t').addEventListener('keydown',e=>{if(WBS.curView=='pattern')e.stopPropagation()});   // Enter is a new line, as in the Text tool
$('tx_new').addEventListener('click',()=>{if(WBS.curView!='pattern')return;WBS.fpSel=-1;WBS.fpMS=new Set();tbKey='';WBS.txArm=false;tbG=null;tbArmUI();$('tx_t').value='';upd();$('tx_t').focus()});
$('tx_file').addEventListener('change',async()=>{if(WBS.curView!='pattern')return;const fl=$('tx_file').files[0];$('tx_file').value='';if(!fl||!WBX.wbTxAddFont)return;try{const id=await WBX.wbTxAddFont(fl);$('tx_f').value=id;tbLive();pmsg(`Loaded “${fl.name.replace(/\.[a-z0-9]+$/i,'')}”.`)}catch(e){pmsg('That font file could not be read. Try a .ttf or .otf file.')}});
WBX.wbTbMode=()=>{tbKey='';const L=fpL();if(L&&L.txt)txbSync(L);else{$('tx_ed').hidden=true;$('tx_sprow').hidden=true}tbArmUI()};if(WBX.wbTxMode)WBX.wbTxMode(WBS.curView||'pattern')}
}
export {fx1,tbG,tbRead,tbSty,txbSync,txtGl,txtLayer,init26};
