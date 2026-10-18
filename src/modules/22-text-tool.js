import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,SH,SK,SW,shp,useT,wrapP} from './04-canvas-and-stamp-outlines.js';
import {cust,inkOf,it,pal,selOne,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {QS,delItems,selSet} from './12-selection-and-split.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {teD,teF,teFonts,teUF,teAddUF,teCss,teFitSz,teLayBox,teLayout,teLoadFonts,teReady,teSetNotify} from './60-text-engine.js';

function init22(){// ===== Text tool: type text, it's traced into carved letter shapes. Each letter becomes its own shape on the stamp,
// grouped under the text in the Motif list. The original text and settings are kept on the group, so it can be edited.
(()=>{
// --- panel state
const autoFit=()=>{if(!st.auto||edit||!st.text.trim())return;const v=teFitSz(st);if(v!=st.sz){st.sz=v;$('tx_sz').value=v;$('tx_sz').dispatchEvent(new Event('input',{bubbles:true}))}};let st={...teD},edit=null,tmr=0,syncing=0,ltmr=0,lastLive=0;
const A=(t)=>t.tgm||(t.tgm={});
const grpOf=()=>{const qs=QS();if(!qs.length)return null;const g=qs[0].tg;if(!g||!qs.every(o=>o.tg==g))return null;const t=WBS.tiles[WBS.cur];return A(t)[g]?g:null};
const idsOf=g=>WBS.tiles[WBS.cur].items.map((q,i)=>q.tg==g?i:-1).filter(i=>i>=0);
const mean=ids=>{const it2=WBS.tiles[WBS.cur].items;let x=0,y=0;ids.forEach(i=>{x+=it2[i].x;y+=it2[i].y});return[x/ids.length,y/ids.length]};
WBX.wbTxGrp=()=>grpOf();WBX.wbTxMeta=g=>A(WBS.tiles[WBS.cur])[g];
function fillFonts(){const cur0=$('tx_f').value||st.f;$('tx_f').innerHTML=`<optgroup label="Built-in fonts">${teFonts.map(x=>`<option value="${x[0]}" data-font="${hx(x[1])}" data-w="${x[3]}">${hx(x[1])}</option>`).join('')}</optgroup>`+(teUF.length?`<optgroup label="Your fonts">${teUF.map(id=>`<option value="${id}" data-font="${hx(teF[id].fam)}" data-w="400">${hx(teF[id].lbl)}</option>`).join('')}</optgroup>`:'');$('tx_f').value=teF[cur0]?cur0:'cinzel'}
function toUI(){syncing++;try{toUI0()}finally{syncing--}}
function toUI0(){$('tx_t').value=st.text;$('tx_f').value=teF[st.f]?st.f:'cinzel';[['tx_sz','sz'],['tx_ls','ls'],['tx_ws','ws'],['tx_lh','lh'],['tx_wd','wd'],['tx_ht','ht'],['tx_cv','cv'],['tx_rot','rot']].forEach(([id,k])=>{$(id).value=st[k]||0;$(id).dispatchEvent(new Event('input',{bubbles:true,cancelable:true}))});
document.querySelectorAll('#tx_al [data-a]').forEach(b=>b.classList.toggle('on',b.dataset.a==st.al));document.querySelectorAll('#tx_tc [data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c==(st.tc||'')));document.querySelectorAll('#tx_va [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v==(st.va||'t')))}
function fromUI(){st.text=$('tx_t').value.replace(/\r/g,'').slice(0,200);st.f=$('tx_f').value;st.sz=+$('tx_sz').value;st.ls=+$('tx_ls').value;st.ws=+$('tx_ws').value;st.lh=+$('tx_lh').value;st.wd=+$('tx_wd').value;st.ht=+$('tx_ht').value;st.cv=+$('tx_cv').value;st.rot=+$('tx_rot').value}
async function preview(){await teReady(st);const t=WBS.tiles[WBS.cur];useT(t);autoFit();const[pa]=pal(),ink=inkOf(t),ps=st.text.trim()?teLayout(st):[],C=cen();
$('tx_pv').innerHTML=`<svg viewBox="-12 -12 ${SW+24} ${SH+24}"><path d="${shp(0)}" fill="${pa}" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/>`+ps.map(p=>`<g transform="translate(${(C[0]+p.x).toFixed(1)} ${(C[1]+p.y).toFixed(1)}) rotate(${p.r.toFixed(1)}) scale(${p.s})"><path d="${p.g.d}" fill="${ink}" fill-rule="evenodd"/></g>`).join('')+`</svg>`;
$('tx_go').disabled=!st.text.trim()}
const cen=()=>SK=='tri'?[SW/2,SH*2/3]:[SW/2,SH/2];
const later=()=>{if(WBS.curView=='pattern')return;clearTimeout(tmr);tmr=setTimeout(preview,120)};
// Letters moved, turned or scaled by hand: how far each differs from where the layout puts it (the median offset is the group having been moved as a whole)
function adjOf(t,M,ids){const old=teLayout({...teD,...M}),its=ids.map(i=>t.items[i]);if(old.length!==its.length)return null;const nm=(d,P)=>d-Math.round(d/P)*P,
off=its.map((q,i)=>{const p=old[i],[ex,ey]=wrapP(M.ax+p.x,M.ay+p.y);return[nm(q.x-ex,SW),nm(q.y-ey,SH),q.r-+p.r.toFixed(1),q.s/p.s]}),med=a=>a.slice().sort((x,y)=>x-y)[a.length>>1],sx=med(off.map(o=>o[0])),sy=med(off.map(o=>o[1])),
ad=off.map(o=>[o[0]-sx,o[1]-sy,o[2],o[3]]);return{sx,sy,ad:ad.some(a=>Math.abs(a[0])>.05||Math.abs(a[1])>.05||Math.abs(a[2])>.05||Math.abs(a[3]-1)>.002)?ad:null}}
function letters(g,ax,ay){const ps=teLayout(st),out=[];ps.forEach(p=>{const k=p.g.k;if(!cust[k])cust[k]={n:p.c,svg:`<path d="${p.g.d}" fill="FILL" fill-rule="evenodd"/>`,txt:1};const[x,y]=wrapP(ax+p.x,ay+p.y);const q=it(k,x,y,p.s,+p.r.toFixed(1),1);q.tg=g;out.push(q)});return out}
// The text follows the cursor as a faint copy with its box drawn round it; a click puts it down there and it stays on the cursor to put down again (Esc or right-click stops), like the Text layer.
const txArmed=()=>!!(WBS.brush&&WBS.brush.txt);
function txBox(ps){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;ps.forEach(p=>{const nm=(p.g.d.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);let a=1e9,b=1e9,c=-1e9,e=-1e9;for(let i=0;i+1<nm.length;i+=2){a=Math.min(a,nm[i]);c=Math.max(c,nm[i]);b=Math.min(b,nm[i+1]);e=Math.max(e,nm[i+1])}const r=p.r*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r);[[a,b],[c,b],[c,e],[a,e]].forEach(([u,v])=>{const px=p.x+(u*cs-v*sn)*p.s,py=p.y+(u*sn+v*cs)*p.s;x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)})});
const S=Math.min(SW,SH)/100;if(st.wd>0){x1=st.wd*S/2;x0=-x1}if(st.ht>0){y1=st.ht*S/2;y0=-y1}return[x0,y0,x1,y1]}
async function txGhost(){if(!txArmed())return;fromUI();if(!st.text.trim()){WBS.txg=null;upd();return}await teReady(st);if(!txArmed())return;useT(WBS.tiles[WBS.cur]);autoFit();const ps=teLayout(st);WBS.txg=ps.length?{gl:ps.map(p=>({d:p.g.d,x:+p.x.toFixed(2),y:+p.y.toFixed(2),r:+p.r.toFixed(1),s:p.s})),box:txBox(ps),id:(WBS.txg?WBS.txg.id:0)+1}:null;upd()}
function txArm(on){if(on){if(!st.text.trim())return;selOne(-1);edit=null;WBS.split=null;WBS.brush={txt:1,m:'',s:1,r:0};txGhost()}else if(txArmed()){WBS.brush=null;WBS.txg=null;upd()}txArmUI()}
function txArmUI(){const b=$('tx_go');if(b){const on=txArmed();b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))}}
WBX.wbTxStampAt=async(x,y)=>{fromUI();if(!st.text.trim())return;await teReady(st);if(WBX.wbCap)WBX.wbCap();const t=WBS.tiles[WBS.cur];useT(t);autoFit();const g='tx'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),L=letters(g,x,y);
if(!L.length){pmsg('No letters came out. Try another font.');return}const n0=t.items.length;t.items.push(...L);const ids=L.map((_,i)=>n0+i),[mx,my]=mean(ids);A(t)[g]={...st,ax:x,ay:y,mx,my};store();upd();if(WBX.wbCap)WBX.wbCap();pmsg(`Put down “${st.text.replace(/\n/g,' ')}” as ${L.length} letter${L.length>1?'s':''}. Click again to put it down again, Esc to stop.`)};
async function update(live){const g=edit;if(!g)return;fromUI();if(!st.text.trim())return;await teReady(st);if(g!==edit)return;const t=WBS.tiles[WBS.cur],M=A(t)[g],ids=idsOf(g);if(!M||!ids.length)return;if(live&&['text','f','sz','ls','ws','lh','al','tc','cv','rot','wd','ht','va'].every(k=>(M[k]||0)===(st[k]||0)))return;if(WBX.wbCap&&(!live||performance.now()-lastLive>1500))WBX.wbCap();if(live)lastLive=performance.now();useT(t);
const[cx0,cy0]=mean(ids),AJ=adjOf(t,M,ids),ax=M.ax+(AJ?AJ.sx:cx0-M.mx),ay=M.ay+(AJ?AJ.sy:cy0-M.my),pos=Math.min(...ids);delItems(ids);const L=letters(g,ax,ay);
if(AJ&&AJ.ad)L.forEach((q,i)=>{const a=AJ.ad[i];if(!a)return;[q.x,q.y]=wrapP(q.x+a[0],q.y+a[1]);q.r=+(q.r+a[2]).toFixed(1);q.s=+(q.s*a[3]).toFixed(4)});t.items.splice(Math.min(pos,t.items.length),0,...L);const nids=L.map((_,i)=>Math.min(pos,t.items.length-L.length)+i);
const[mx,my]=mean(nids);A(t)[g]={...st,ax,ay,mx,my};selSet(nids,false);store();upd();if(!live){if(WBX.wbCap)WBX.wbCap();pmsg(`Updated the text.`)}}
// the text on the stamp follows every change in the panel while a text is being edited
const live=()=>{if(syncing||WBS.curView=='pattern')return;if(!edit){if(txArmed())txGhost();else if(st.text.trim())txArm(true);return}clearTimeout(ltmr);ltmr=setTimeout(()=>update(true),150)};
// used by Randomize: set text on a stamp (fonts load first; a newer roll cancels an older one)
WBX.wbTxFonts=teFonts.map(x=>x[0]);
WBX.wbTxPlace=async(t,o,tok)=>{const f=teF[o.f]||teF.cinzel;try{await document.fonts.load(teCss(f),o.text);await document.fonts.ready}catch(e){}
if(tok!=null&&tok!==WBX.wbRndTok)return false;if(!WBS.tiles.includes(t))return false;const keep=st;st={...teD,...o,auto:false};try{useT(t);st.sz=teFitSz(st);const g='tx'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),[ax,ay]=cen(),L=letters(g,ax,ay);if(!L.length)return false;
t.items.push(...L);const[mx,my]=(()=>{let x=0,y=0;L.forEach(q=>{x+=q.x;y+=q.y});return[x/L.length,y/L.length]})();const M={...st,ax,ay,mx,my};delete M.maxSz;delete M.inner;A(t)[g]=M;
if(o.inner){let rm=1e9;L.forEach(q=>{rm=Math.min(rm,Math.hypot(q.x-ax,q.y-ay)-26*q.s)});t.items.forEach(q=>{if(q.cz){q.s=+Math.min(q.s,.85*Math.max(8,rm)/48).toFixed(3);delete q.cz}})}
return true}finally{st=keep;useT(WBS.tiles[WBS.cur])}};
// keep a group's anchor in step when it's moved, turned or scaled as a whole
WBX.wbTxXf=(g,fn)=>{const t=WBS.tiles[WBS.cur],M=A(t)[g];if(!M)return;fn(M)};
// sync the panel with the selection: selecting a text group puts it into edit mode
WBX.wbTxSync=()=>{if(!$('tx_t')||WBS.curView=='pattern')return;txArmUI();const g=grpOf();if(g===edit)return;edit=g;const box=$('tx_ed');
if(g){const M=A(WBS.tiles[WBS.cur])[g];st={...teD,...M,auto:false};delete st.ax;delete st.ay;delete st.mx;delete st.my;toUI();box.hidden=false;$('tx_convrow').hidden=false;$('tx_edn').textContent=st.text.replace(/\n/g,' ');$('tx_go').textContent='Add text'}
else{box.hidden=true;$('tx_convrow').hidden=true;$('tx_go').textContent='Add text';st.auto=true}later()};
teSetNotify(pmsg);teLoadFonts(fillFonts);fillFonts();toUI();
$('tx_t').addEventListener('input',()=>{fromUI();later();live()});
['tx_f','tx_sz','tx_ls','tx_ws','tx_lh','tx_wd','tx_ht','tx_cv','tx_rot'].forEach(id=>$(id).addEventListener('input',e=>{if(id=='tx_sz'&&e.isTrusted)st.auto=false;fromUI();later();live()}));
['input','change'].forEach(ev=>document.addEventListener(ev,e=>{if(!e.isTrusted)return;const w=$('tx_sz').closest('.ctl');if(e.target===$('tx_sz')||(w&&w.contains(e.target)))st.auto=false},true));
$('tx_al').onclick=e=>{if(WBS.curView=='pattern')return;const b=e.target.closest('[data-a]');if(!b)return;st.al=b.dataset.a;document.querySelectorAll('#tx_al [data-a]').forEach(x=>x.classList.toggle('on',x==b));later();live()};
$('tx_va').onclick=e=>{if(WBS.curView=='pattern')return;const b=e.target.closest('[data-v]');if(!b)return;st.va=b.dataset.v;document.querySelectorAll('#tx_va [data-v]').forEach(x=>x.classList.toggle('on',x==b));later();live()};
$('tx_tc').onclick=e=>{if(WBS.curView=='pattern')return;const b=e.target.closest('[data-c]');if(!b)return;st.tc=b.dataset.c;document.querySelectorAll('#tx_tc [data-c]').forEach(x=>x.classList.toggle('on',x==b));later();live()};
$('tx_go').onclick=()=>{if(WBS.curView=='pattern')return;if(txArmed())txArm(false);else{fromUI();txArm(true)}};
$('tx_conv').onclick=()=>{if(WBS.curView=='pattern'||!edit)return;const g=edit,t=WBS.tiles[WBS.cur];if(WBX.wbCap)WBX.wbCap();t.items.forEach(q=>{if(q.tg==g)delete q.tg});delete A(t)[g];edit=null;$('tx_ed').hidden=true;$('tx_convrow').hidden=true;store();upd();if(WBX.wbCap)WBX.wbCap();pmsg('Turned the text into plain shapes.')};
$('tx_new').onclick=()=>{if(WBS.curView=='pattern')return;selOne(-1);edit=null;$('tx_ed').hidden=true;$('tx_convrow').hidden=true;$('tx_go').textContent='Add text';st={...teD,f:st.f};toUI();upd();later();$('tx_t').focus()};
$('tx_file').onchange=async()=>{if(WBS.curView=='pattern')return;const fl=$('tx_file').files[0];$('tx_file').value='';if(!fl)return;try{const nm=fl.name.replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').replace(/["<>&|]/g,'').slice(0,40)||'My font';
const id=await teAddUF(nm,await fl.arrayBuffer(),fl.size<900000);fillFonts();$('tx_f').value=id;fromUI();later();pmsg(`Loaded “${nm}”.`+(fl.size>=900000?' It is large, so it will not be kept for next time.':''))}catch(e){pmsg('That font file could not be read. Try a .ttf or .otf file.')}};
// text boxes in the pattern: lay the text out at canvas scale, returning the letter paths (centred on the box)
WBX.wbTxLay=teLayBox;
WBX.wbTxUnit=()=>Math.min(CW,CH)/100;
WBX.wbTxAddFont=async fl=>{const nm=fl.name.replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').replace(/["<>&|]/g,'').slice(0,40)||'My font';const id=await teAddUF(nm,await fl.arrayBuffer(),fl.size<900000);fillFonts();return id};
// one Text panel for both editors: the Stamp editor builds letters on the stamp, the Pattern editor fills a Text layer
WBX.wbTxMode=v=>{const pat=v=='pattern';$('tx_lay').hidden=!pat;$('tx_pv').hidden=pat;if(pat)$('tx_convrow').hidden=true;$('tx_sz').dataset.def=pat?'10':'30';if(pat){if(txArmed())txArm(false);if(WBX.wbTbMode)WBX.wbTbMode()}else{WBS.txArm=false;toUI();$('tx_ed').hidden=!edit;$('tx_convrow').hidden=!edit;$('tx_sprow').hidden=true;txArmUI()}};
// redraw the preview whenever the panel is shown
new MutationObserver(()=>{const s=document.querySelector('section.pn[data-p="text"]');if(s&&!s.hidden)later()}).observe(document.querySelector('section.pn[data-p="text"]'),{attributes:true,attributeFilter:['hidden']});
later();
})();
}
export {init22};
