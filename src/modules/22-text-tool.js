import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,SH,SK,SW,shp,useT,wrapP} from './04-canvas-and-stamp-outlines.js';
import {cust,inkOf,it,pal,selOne,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {QS,delItems,selSet} from './12-selection-and-split.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {TXO_KEYS,TXO_IDS,txoRead,txoWrite,txoBind,txoSelBind,txoSeed} from './61-text-panel.js';
import {teRnd,teF,teFonts,teUF,teAddUF,teCss,teFitSz,teLayBox,teLayout,teLoadFonts,teReady,teSetNotify} from './60-text-engine.js';
import {stTxMode} from './63-stamp-tool.js';

function init22(){// ===== Text tool: type text, it's traced into carved letter shapes. Each letter becomes its own shape on the stamp,
// grouped under the text in the Motif list. The original text and settings are kept on the group, so it can be edited.
(()=>{
// --- panel state
const autoFit=()=>{if(!st.auto||edit||!st.text.trim())return;const v=teFitSz(st);if(v!=st.sz){st.sz=v;$('tx_sz').value=v;$('tx_sz').dispatchEvent(new Event('input',{bubbles:true}))}};let st={...teD},edit=null,tmr=0,syncing=0,ltmr=0,lastLive=0;
const A=(t)=>t.tgm||(t.tgm={});
const grpOf=()=>{const qs=QS();if(!qs.length)return null;const g=qs[0].tg;if(!g||!qs.every(o=>o.tg==g))return null;const t=WBS.tiles[WBS.cur];return A(t)[g]?g:null};
const idsOf=g=>(WBS.tiles[WBS.cur]||WBS.noTile).items.map((q,i)=>q.tg==g?i:-1).filter(i=>i>=0);
const mean=ids=>{const it2=(WBS.tiles[WBS.cur]||WBS.noTile).items;let x=0,y=0;ids.forEach(i=>{x+=it2[i].x;y+=it2[i].y});return[x/ids.length,y/ids.length]};
WBX.wbTxGrp=()=>grpOf();WBX.wbTxMeta=g=>A(WBS.tiles[WBS.cur])[g];
function fillFonts(){const cur0=$('tx_f').value||st.f;$('tx_f').innerHTML=`<optgroup label="Built-in fonts">${teFonts.map(x=>`<option value="${x[0]}" data-font="${hx(x[1])}" data-w="${x[3]}">${hx(x[1])}</option>`).join('')}</optgroup>`+(teUF.length?`<optgroup label="Your fonts">${teUF.map(id=>`<option value="${id}" data-font="${hx(teF[id].fam)}" data-w="400">${hx(teF[id].lbl)}</option>`).join('')}</optgroup>`:'');$('tx_f').value=teF[cur0]?cur0:'cinzel'}
function toUI(){syncing++;try{toUI0()}finally{syncing--}}
function toUI0(){txoWrite(st,null,true)}
function fromUI(){const o=txoRead();TXO_KEYS.forEach(k=>delete st[k]);Object.assign(st,o)}
async function preview(){await teReady(st);const t=WBS.tiles[WBS.cur];useT(t);autoFit();const[pa]=pal(),ink=inkOf(t),ps=st.text.trim()?teLayout(st):[],C=cen();
$('tx_pv').innerHTML=`<svg viewBox="-12 -12 ${SW+24} ${SH+24}"><path d="${shp(0)}" fill="${pa}" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/>`+ps.map(p=>`<g transform="translate(${(C[0]+p.x).toFixed(1)} ${(C[1]+p.y).toFixed(1)}) rotate(${p.r.toFixed(1)}) scale(${p.s})"><path d="${p.g.d}" fill="${ink}" fill-rule="evenodd"/></g>`).join('')+`</svg>`;
$('tx_go').disabled=stTxMode()&&!st.text.trim()}   // (2.25.0) only a stamp's text can be empty; on the canvas Add text puts in the word "Text" itself
const cen=()=>SK=='tri'?[SW/2,SH*2/3]:[SW/2,SH/2];
const later=()=>{if(!stTxMode())return;clearTimeout(tmr);tmr=setTimeout(preview,120)};
// Letters moved, turned or scaled by hand: how far each differs from where the layout puts it (the median offset is the group having been moved as a whole)
function adjOf(t,M,ids){const old=teLayout({...teD,...M}),its=ids.map(i=>t.items[i]);if(old.length!==its.length)return null;const nm=(d,P)=>d-Math.round(d/P)*P,
off=its.map((q,i)=>{const p=old[i],[ex,ey]=wrapP(M.ax+p.x,M.ay+p.y);return[nm(q.x-ex,SW),nm(q.y-ey,SH),q.r-+p.r.toFixed(1),q.s/p.s]}),med=a=>a.slice().sort((x,y)=>x-y)[a.length>>1],sx=med(off.map(o=>o[0])),sy=med(off.map(o=>o[1])),
ad=off.map(o=>[o[0]-sx,o[1]-sy,o[2],o[3]]);return{sx,sy,ad:ad.some(a=>Math.abs(a[0])>.05||Math.abs(a[1])>.05||Math.abs(a[2])>.05||Math.abs(a[3]-1)>.002)?ad:null}}
function letters(g,ax,ay){const ps=teLayout(st),out=[];ps.forEach(p=>{const k=p.g.k;if(!cust[k])cust[k]={n:p.c,svg:`<path d="${p.g.d}" fill="FILL" fill-rule="evenodd"/>`,txt:1};const[x,y]=wrapP(ax+p.x,ay+p.y);const q=it(k,x,y,p.s,+p.r.toFixed(1),1);q.tg=g;out.push(q)});return out}
// The text follows the cursor as a faint copy with its box drawn round it; a click puts it down there and it stays on the cursor to put down again (Esc or right-click stops), like the Text layer.
const txArmed=()=>!!(WBS.brush&&WBS.brush.txt);
function txBox(ps){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;ps.forEach(p=>{const nm=(p.g.d.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);let a=1e9,b=1e9,c=-1e9,e=-1e9;for(let i=0;i+1<nm.length;i+=2){a=Math.min(a,nm[i]);c=Math.max(c,nm[i]);b=Math.min(b,nm[i+1]);e=Math.max(e,nm[i+1])}const r=p.r*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r);[[a,b],[c,b],[c,e],[a,e]].forEach(([u,v])=>{const px=p.x+(u*cs-v*sn)*p.s,py=p.y+(u*sn+v*cs)*p.s;x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)})});
const S=Math.min(SW,SH)/100;if(st.wd>0){x1=st.wd*S/2;x0=-x1}if(st.ht>0){y1=st.ht*S/2;y0=-y1}return[x0,y0,x1,y1]}
async function txGhost(){if(!txArmed())return;fromUI();if(!st.text.trim()){WBS.txg=null;upd();return}await teReady(st);if(!txArmed())return;useT(WBS.tiles[WBS.cur]);autoFit();const ps=teLayout(st);WBS.txg=ps.length?{gl:ps.map(p=>({d:p.g.d,x:+p.x.toFixed(2),y:+p.y.toFixed(2),r:+p.r.toFixed(1),s:p.s})),box:txBox(ps),over:!!ps.over,id:(WBS.txg?WBS.txg.id:0)+1}:null;upd()}
function txArm(on){if(on){if(!st.text.trim())return;selOne(-1);edit=null;WBS.split=null;WBS.brush={txt:1,m:'',s:1,r:0};txGhost()}else if(txArmed()){WBS.brush=null;WBS.txg=null;upd()}txArmUI()}
function txArmUI(){const b=$('tx_go');if(b){const on=txArmed();b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))}}
WBX.wbTxStampAt=async(x,y,quiet)=>{fromUI();if(!st.text.trim())return;await teReady(st);if(WBX.wbCap)WBX.wbCap();const t=WBS.tiles[WBS.cur];useT(t);autoFit();const g='tx'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),L=letters(g,x,y);
if(!L.length){pmsg('No letters came out. Try another font.');return}const n0=t.items.length;t.items.push(...L);const ids=L.map((_,i)=>n0+i),[mx,my]=mean(ids);A(t)[g]={...st,ax:x,ay:y,mx,my};store();upd();if(WBX.wbCap)WBX.wbCap();if(!quiet)pmsg(`Put down “${st.text.replace(/\n/g,' ')}” as ${L.length} letter${L.length>1?'s':''}.`);return g};
// (2.25.0) a stamp text typed in place: select its letters (the panel edits it), and when the typing ends an empty text is taken out
WBX.wbTxStampSel=g=>{const ids=idsOf(g);if(!ids.length)return false;selSet(ids,false);WBS.sel=ids[0];upd();return true};
WBX.wbTxStampEnd=(g,empty)=>{const t=WBS.tiles[WBS.cur];if(!t||!A(t)[g])return;clearTimeout(ltmr);if(empty){delItems(idsOf(g));delete A(t)[g];selOne(-1);edit=null;store();upd()}else update(false)};
async function update(live){const g=edit;if(!g)return;fromUI();if(!st.text.trim())return;await teReady(st);if(g!==edit)return;const t=WBS.tiles[WBS.cur],M=A(t)[g],ids=idsOf(g);if(!M||!ids.length)return;if(live&&['text','f','sz','ls','ws','lh','al','tc','cv','rot','wd','ht','va','pd','ft','ov','rp','rr','rs','bb','sc','sd','ind','psp','bal','wp','wa','pt','pa','pw'].every(k=>(M[k]||0)===(st[k]||0))&&JSON.stringify(M.sty||0)===JSON.stringify(st.sty||0))return;if(WBX.wbCap&&(!live||performance.now()-lastLive>1500))WBX.wbCap();if(live)lastLive=performance.now();useT(t);
const[cx0,cy0]=mean(ids),AJ=adjOf(t,M,ids),ax=M.ax+(AJ?AJ.sx:cx0-M.mx),ay=M.ay+(AJ?AJ.sy:cy0-M.my),pos=Math.min(...ids);delItems(ids);const L=letters(g,ax,ay);
if(AJ&&AJ.ad)L.forEach((q,i)=>{const a=AJ.ad[i];if(!a)return;[q.x,q.y]=wrapP(q.x+a[0],q.y+a[1]);q.r=+(q.r+a[2]).toFixed(1);q.s=+(q.s*a[3]).toFixed(4)});t.items.splice(Math.min(pos,t.items.length),0,...L);const nids=L.map((_,i)=>Math.min(pos,t.items.length-L.length)+i);
const[mx,my]=mean(nids);A(t)[g]={...st,ax,ay,mx,my};selSet(nids,false);store();upd();if(!live){if(WBX.wbCap)WBX.wbCap();pmsg(`Updated the text.`)}}
// the text on the stamp follows every change in the panel while a text is being edited
const live=()=>{if(syncing||!stTxMode())return;if(!edit)return;   // 2.12.0: typing no longer arms a click-to-place text
clearTimeout(ltmr);ltmr=setTimeout(()=>update(true),150)};
// used by Randomize: set text on a stamp (fonts load first; a newer roll cancels an older one)
WBX.wbTxFonts=teFonts.map(x=>x[0]);
// Randomize uses the newer text options now and then. They come from the words themselves (not from Math.random), so a Randomize roll draws the same random numbers as before.
function txRandom(o){if(o.inner||[...o.text].length<4||o.pt||o.wp||o.rp||o.bb)return;const h=[...o.text].reduce((a,c)=>(Math.imul(a,31)+c.codePointAt(0))|0,7),R=k=>teRnd(h,0,k);
if(R(1)<.14){o.pt='w';o.pa=20+Math.floor(R(2)*25);o.pw=40+Math.floor(R(3)*30)}else if(R(4)<.16){o.wp='b';o.wa=30+Math.floor(R(5)*40)}else if(R(6)<.15){o.rp=5+Math.floor(R(7)*10);o.rr=3+Math.floor(R(8)*10)}else if(R(9)<.08)o.bb=20+Math.floor(R(10)*20)}
WBX.wbTxPlace=async(t,o,tok)=>{const f=teF[o.f]||teF.cinzel;try{await document.fonts.load(teCss(f),o.text);await document.fonts.ready}catch(e){}
if(tok!=null&&tok!==WBX.wbRndTok)return false;if(!WBS.tiles.includes(t))return false;const keep=st;st={...teD,...o,auto:false};txRandom(st);try{useT(t);st.sz=teFitSz(st);const g='tx'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),[ax,ay]=cen(),L=letters(g,ax,ay);if(!L.length)return false;
t.items.push(...L);const[mx,my]=(()=>{let x=0,y=0;L.forEach(q=>{x+=q.x;y+=q.y});return[x/L.length,y/L.length]})();const M={...st,ax,ay,mx,my};delete M.maxSz;delete M.inner;A(t)[g]=M;
if(o.inner){let rm=1e9;L.forEach(q=>{rm=Math.min(rm,Math.hypot(q.x-ax,q.y-ay)-26*q.s)});t.items.forEach(q=>{if(q.cz){q.s=+Math.min(q.s,.85*Math.max(8,rm)/48).toFixed(3);delete q.cz}})}
return true}finally{st=keep;useT(WBS.tiles[WBS.cur])}};
// keep a group's anchor in step when it's moved, turned or scaled as a whole
WBX.wbTxXf=(g,fn)=>{const t=WBS.tiles[WBS.cur],M=A(t)[g];if(!M)return;fn(M)};
// sync the panel with the selection: selecting a text group puts it into edit mode
WBX.wbTxSync=()=>{if(!$('tx_t')||!stTxMode())return;txArmUI();const g=grpOf();if(g===edit)return;edit=g;const box=$('tx_ed');
if(g){const M=A(WBS.tiles[WBS.cur])[g];st={...teD,...M,auto:false};delete st.ax;delete st.ay;delete st.mx;delete st.my;toUI();box.hidden=false;$('tx_convrow').hidden=false;$('tx_edn').textContent=st.text.replace(/\n/g,' ');$('tx_go').textContent='Add text'}
else{box.hidden=true;$('tx_convrow').hidden=true;$('tx_go').textContent='Add text';st.auto=true}later()};
teSetNotify(pmsg);teLoadFonts(fillFonts);fillFonts();toUI();
$('tx_t').addEventListener('input',()=>{fromUI();later();live()});
TXO_IDS.forEach(id=>$(id).addEventListener('input',e=>{if(id=='tx_sz'&&e.isTrusted)st.auto=false;fromUI();later();live()}));
['input','change'].forEach(ev=>document.addEventListener(ev,e=>{if(!e.isTrusted)return;const w=$('tx_sz').closest('.ctl');if(e.target===$('tx_sz')||(w&&w.contains(e.target)))st.auto=false},true));
txoBind(()=>stTxMode(),()=>{fromUI();later();live()});txoSelBind(()=>stTxMode(),()=>{fromUI();later();live()});
$('tx_vary').onclick=()=>{if(!stTxMode())return;txoSeed(1+Math.floor(Math.random()*1e6));fromUI();later();live()};
$('tx_go').onclick=()=>{if(!stTxMode())return;if(txArmed())txArm(false);else{fromUI();txArm(true)}};
$('tx_conv').onclick=()=>{if(!stTxMode()||!edit)return;const g=edit,t=WBS.tiles[WBS.cur];if(WBX.wbCap)WBX.wbCap();t.items.forEach(q=>{if(q.tg==g)delete q.tg});delete A(t)[g];edit=null;$('tx_ed').hidden=true;$('tx_convrow').hidden=true;store();upd();if(WBX.wbCap)WBX.wbCap();pmsg('Turned the text into plain shapes.')};
$('tx_new').onclick=()=>{if(!stTxMode())return;selOne(-1);edit=null;$('tx_ed').hidden=true;$('tx_convrow').hidden=true;$('tx_go').textContent='Add text';st={...teD,f:st.f};toUI();upd();later();$('tx_t').focus()};
$('tx_file').onchange=async()=>{if(!stTxMode())return;const fl=$('tx_file').files[0];$('tx_file').value='';if(!fl)return;try{const nm=fl.name.replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').replace(/["<>&|]/g,'').slice(0,40)||'My font';
const id=await teAddUF(nm,await fl.arrayBuffer(),fl.size<900000);fillFonts();$('tx_f').value=id;fromUI();later();pmsg(`Loaded “${nm}”.`+(fl.size>=900000?' It is large, so it will not be kept for next time.':''))}catch(e){pmsg('That font file could not be read. Try a .ttf or .otf file.')}};
// text boxes in the pattern: lay the text out at canvas scale, returning the letter paths (centred on the box)
WBX.wbTxLay=teLayBox;
WBX.wbTxUnit=()=>Math.min(CW,CH)/100;
WBX.wbTxAddFont=async fl=>{const nm=fl.name.replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').replace(/["<>&|]/g,'').slice(0,40)||'My font';const id=await teAddUF(nm,await fl.arrayBuffer(),fl.size<900000);fillFonts();return id};
// one Text panel: with a stamp unlocked it builds letters in the stamp, otherwise it fills a Text layer
WBX.wbTxArm=txArm;WBX.wbTxMode=v=>{const pat=v=='pattern';if(pat)$('tx_go').disabled=false;   // (2.25.0) leaving a stamp tab with an empty text left Add text switched off on the canvas
 $('tx_lay').hidden=!pat;$('tx_pv').hidden=pat;if(pat)$('tx_convrow').hidden=true;$('tx_sz').dataset.def=pat?'10':'30';if(pat){if(txArmed())txArm(false);if(WBX.wbTbMode)WBX.wbTbMode()}else{WBS.txArm=false;toUI();$('tx_ed').hidden=!edit;$('tx_convrow').hidden=!edit;$('tx_sprow').hidden=true;txArmUI()}};
// double-click a text on the canvas: the Text panel opens with the words selected, so typing replaces them and the canvas follows as you type
WBX.wbTxGrp=()=>grpOf();   // a text of the unlocked stamp is selected (a double click then goes to the text field, not to Done)
document.addEventListener('dblclick',e=>{const t=e.target;if(!t||!t.closest)return;const stamp=stTxMode()&&t.closest('#artwrap')&&grpOf(),lay=!stTxMode()&&t.closest('#boardP')&&WBX.wbTbHas&&WBX.wbTbHas();if(!stamp&&!lay)return;if(WBX.wbOpenPanel)WBX.wbOpenPanel('text');if(lay&&WBX.wbTxIn&&WBX.wbTxIn())return;const f=$('tx_t');f.focus();f.select()});
// redraw the preview whenever the panel is shown
new MutationObserver(()=>{const s=document.querySelector('section.pn[data-p="text"]');if(s&&!s.hidden)later()}).observe(document.querySelector('section.pn[data-p="text"]'),{attributes:true,attributeFilter:['hidden']});
later();
})();
}
export {init22};
