import {clipboard,kv,use} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,SK,csk,geom,setDim,shOf,tileOn,useG,useT,wrapP} from './04-canvas-and-stamp-outlines.js';
import {say,store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {SURFC} from './17-texture-panel-and-previews.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {wmDraw,wmGet,wmReady} from './56-watermark.js';
// ---- Canvas & stamp shape presets
const ASP={c:[['2:3',2,3],['3:4',3,4],['4:5',4,5],['5:7',5,7],['1:1 square',1,1],['A4 / A-series',1,1.4142],['US Letter',8.5,11],['6×9 book',6,9],['9:16 tall',9,16],['3:2',3,2],['4:3',4,3],['16:9 wide',16,9]],
s:[['1:1 square',1,1],['2:3',2,3],['3:2',3,2],['3:4',3,4],['4:3',4,3],['1:2',1,2],['2:1',2,1],['1:3',1,3],['3:1',3,1],['6:1 frame strip',6,1],['8:1 frame strip',8,1],['12:1 frame strip',12,1],['16:1 frame strip',16,1]]};
const aspKey=([w,h])=>(+w).toFixed(4)+':'+(+h).toFixed(4);
function syncAsp(k,p){const cur=k=='s'?shOf(WBS.tiles[WBX.wbCur()]||undefined).s:WBS.dim[k],i=ASP[k].findIndex(a=>aspKey([a[1],a[2]])==aspKey(cur));
if(!$(p+'asp').options.length)$(p+'asp').innerHTML=ASP[k].map((a,j)=>`<option value="${j}">${a[0]}</option>`).join('')+'<option value="x">Custom…</option>';
const custom=i<0||$(p+'asp').dataset.custom=='1';$(p+'asp').value=custom?'x':i;
const f=v=>String(+(+v).toFixed(3));if(document.activeElement!=$(p+'aw'))$(p+'aw').value=f(cur[0]);if(document.activeElement!=$(p+'ah'))$(p+'ah').value=f(cur[1])}
// Change one stamp's outline and stretch its motifs to match
function reshape(t,ch){const sh=shOf(t),a=geom(sh);if(ch.k)sh.k=ch.k;if(ch.o)sh.o=ch.o;if(ch.s)sh.s=[+ch.s[0],+ch.s[1]];const b=geom(sh);useG(b);t.items.forEach(q=>{[q.x,q.y]=wrapP(q.x*b.SW/a.SW,q.y*b.SH/a.SH)});useT(WBS.tiles[WBS.cur])}
function applyAsp(k,v,ch){if(v){const r=v[0]/v[1],lim=k=='s'?20:5;if(!(r>=1/lim&&r<=lim)){if(k=='s')pmsg('Stamps can be up to 20 times longer than they are wide.');return}}
if(k=='c'){if(v)WBS.dim.c=v;setDim()}
else{const t=WBS.tiles[WBS.cur],c={...(ch||{})};if(v)c.s=v;reshape(t,c);const sh=shOf(t);WBS.dim={...WBS.dim,k:sh.k,o:sh.o,s:[...sh.s]}}
WBS.symKey='';try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}store();upd()}
function csSet(ch){Object.assign(WBS.dim,ch);if(WBS.dim.cs=='rect')delete WBS.dim.cs;setDim();WBS.symKey='';try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}store();upd()}
const LY=()=>WBS.layers[WBS.selL];
const expName=ext=>{const n=($('pnm')&&$('pnm').value.trim()||'').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'wodblok-pattern';return n+'.'+ext};
const ser=()=>{const k=WBS.edMk;if(!k){WBS.edMk=true;upd()}try{return ser0()}finally{if(!k){WBS.edMk=false;upd()}}};
// Knockouts repeat the same shape as a mask once per placement (about 1,300 copies in a busy piece: 10 MB of the 13 MB).
// The saved, copied and exported picture keeps one copy of each identical mask and points the rest at it; the stage is untouched.
function svShare(s){const seen=new Map(),to=new Map();
  s=s.replace(/<mask id="(ks\d+)"([^>]*)>([\s\S]*?)<\/mask>/g,(m,id,a,b)=>{const k=a+'|'+b,f=seen.get(k);if(f){to.set(id,f);return''}seen.set(k,id);return m});
  if(!to.size)return s;return s.replace(/url\(#(ks\d+)\)/g,(m,id)=>to.has(id)?'url(#'+to.get(id)+')':m)}
const ser0=()=>{const c=$('art').cloneNode(true);WBX.wbVec(c);if(tileOn())c.setAttribute('viewBox',`0 0 ${CW} ${CH}`);   // a repeat tile is saved as the tile, also while the 3 x 3 view is on
['#guig','#fpgrid','#fpov','#gmov'].forEach(q=>{const g=c.querySelector(q);if(g)g.remove()});const gd=c.querySelector('#grdf');if(gd&&WBX.wbGrade)gd.innerHTML=WBX.wbGrade.defs(false);{const sd=c.querySelector('#surfd');if(sd&&!WBS.edInk)sd.innerHTML=WBS.tiles.map(t=>SURFC[t.id]?SURFC[t.id].s:'').join('');c.querySelectorAll('[data-tki]').forEach(g=>{g.setAttribute('mask','url(#cw)');g.removeAttribute('data-tki')});c.querySelectorAll('.txo[display]').forEach(g=>g.removeAttribute('display'));const tg=c.querySelector('#texg');if(tg)tg.style.display=''}return svShare(new XMLSerializer().serializeToString(c))};
function init14(){
[['c','c'],['s','s']].forEach(([k,p])=>{
$(p+'asp').oninput=()=>{const v=$(p+'asp').value;if(v=='x'){$(p+'asp').dataset.custom='1';$(p+'aw').focus();return}
$(p+'asp').dataset.custom='';const a=ASP[k][+v];applyAsp(k,[a[1],a[2]])};
const cu=()=>{const w=+$(p+'aw').value,h=+$(p+'ah').value;if(w>0&&h>0)applyAsp(k,[w,h])};$(p+'aw').oninput=$(p+'ah').oninput=cu;
$(p+'swp').onclick=()=>{const a=k=='s'?shOf(WBS.tiles[WBS.cur]).s:WBS.dim[k];applyAsp(k,[a[1],a[0]])}});
$('cshp').onclick=e=>{const b=e.target.closest('[data-s]');if(!b||WBS.book.on||b.disabled)return;const v=b.dataset.s;if(v==csk())return;csSet({cs:v});if(WBX.wbWatch)WBX.wbWatch()};
$('ccr').oninput=()=>csSet({cr:Math.max(0,Math.min(100,Math.round(+$('ccr').value)||0))});
$('cns').oninput=()=>csSet({n:Math.max(3,Math.min(16,Math.round(+$('cns').value)||5))});
$('cor').onclick=e=>{const b=e.target.closest('[data-o]');if(!b)return;const o=b.dataset.o=='f'?'f':'p';if((WBS.dim.co=='f'?'f':'p')==o)return;const ch={co:o};if(o=='p')delete WBS.dim.co;csSet(o=='p'?{}:ch)};
$('skind').onclick=e=>{const b=e.target.closest('[data-k]');if(b&&b.dataset.k!=SK)applyAsp('s',null,{k:b.dataset.k})};
$('shor').oninput=()=>applyAsp('s',null,{o:$('shor').value});
$('shz').oninput=()=>{shOf(WBS.tiles[WBS.cur]).z=+$('shz').value;store();upd()};
$('shrad').oninput=()=>{const sh=shOf(WBS.tiles[WBS.cur]),v=Math.max(0,Math.min(100,Math.round(+$('shrad').value)||0));if((sh.rad||0)==v)return;if(v>0)sh.rad=v;else delete sh.rad;WBS.symKey='';store();upd()};
$('sall').onclick=()=>{const sh=shOf(WBS.tiles[WBS.cur]);let n=0;WBS.tiles.forEach(t=>{if(t===WBS.tiles[WBS.cur])return;const o=shOf(t);if(o.k!=sh.k||o.o!=sh.o||o.s[0]!=sh.s[0]||o.s[1]!=sh.s[1]){reshape(t,{k:sh.k,o:sh.o,s:sh.s});n++}});WBS.symKey='';store();upd();pmsg(n?`${n} other stamp${n>1?'s':''} now use this shape.`:'Every stamp already has this shape.')};
$('neg').oninput=()=>{WBS.tiles[WBS.cur].neg=$('neg').checked;store();upd()};$('swrap').oninput=()=>{const t=WBS.tiles[WBS.cur];if($('swrap').checked)delete t.wr;else t.wr=false;store();upd()};
$('let').oninput=()=>{WBS.tiles[WBS.cur].et=+$('let').value;store();upd()};$('ler').oninput=()=>{WBS.tiles[WBS.cur].er=+$('ler').value;store();upd()};$('lers').onclick=()=>{WBS.tiles[WBS.cur].es=(WBS.tiles[WBS.cur].es||0)+1;store();upd()};
$('cov').addEventListener('input',upd);
$('cpy').onclick=async()=>{try{await clipboard.writeText(ser());say('SVG copied.')}catch(e){say('Copy was blocked here.')}};
$('sv').onclick=async()=>{const d=await use('downloads');if(!d)return say('Saving is not available here.');
try{await d.save({filename:expName('svg'),data:ser()})}catch(e){if(e&&e.code!='declined')say('Could not save: '+e.message)}};
$('png').onclick=async()=>{const d=await use('downloads');if(!d)return say('Saving is not available here.');
let h0=null;try{h0=d.pick?await d.pick({filename:expName('png')}):null}catch(e){return}   // ask where to save first: making the picture takes a while
pmsg('Making the PNG…');await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));   // let the message show before the page is busy
if(wmGet())await wmReady();
const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=CW*3;c.height=CH*3;const x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);if(wmGet())wmDraw(x,c.width,c.height);
c.toBlob(async b=>{try{await d.save({filename:expName('png'),data:b,handle:h0});pmsg('')}catch(e){pmsg('');if(e&&e.code!='declined')say('Could not save: '+e.message)}},'image/png')};
img.onerror=()=>{pmsg('');say('PNG export failed.')};
img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser())};
}
export {LY,expName,ser,syncAsp,init14};
