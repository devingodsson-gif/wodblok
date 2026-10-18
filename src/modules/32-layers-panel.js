import {$,WBS,WBX} from './01-launch-and-version.js';
import {C,CM,DD,DDset,SH,SW,cItem,closeDD,col,geom,mkdd,placeFloat,rowMenu,shOf,okC} from './04-canvas-and-stamp-outlines.js';
import {luid,mkL,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {LY} from './14-presets-and-layer-grid-ui.js';
import {covOrder} from './18-projects-and-cover-overlay.js';
import {artBU} from './25-art-layers.js';
// ===== Layers: each layer is one printing pass (its own stamps, arrangement, ink, opacity and blend). The selected layer is what the tools edit.
// the default ink is whatever colours each stamp already has: shown as the project's ink and background split in two
function lyInkFill(){if(WBX.wbPaintWells)WBX.wbPaintWells()}
const EYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',NOEYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 5.7A8.6 8.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-2.9 3.7M6.3 7.6C3.6 9.3 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.3 4-.9"/><path d="M4 4l16 16"/></svg>';
let lyRen=-1;
function renderLayers(){const pa=col(WBS.proj.bg),L=LY();
$('lyl2').innerHTML=WBS.layers.map((_,i)=>i).reverse().map(i=>{const l=WBS.layers[i],ink=okC(l.ink)?col(l.ink):'',ts=WBS.tiles.filter(t=>l.st.includes(t.id)).slice(0,2),tg=ts.length?geom(shOf(ts[0])):{SW,SH},
sw=l.free&&WBS.ARTS[((l.pl||[])[0]||{}).a]?`<img class="ath" src="${artBU(WBS.ARTS[l.pl[0].a])}" alt="">`:`<svg viewBox="0 0 ${tg.SW} ${tg.SH}" preserveAspectRatio="xMidYMid slice"><rect width="${tg.SW}" height="${tg.SH}" fill="${pa}"/>${ts.length?`<g${ink?` filter="url(#lk${i})"`:''}><use href="#s${ts[0].id}"/></g>`:''}</svg>`,
meta=[(l.fr&&l.fr.on)?'Frame':'',(l.pl||[]).length?`${l.pl.length} placed`:'',l.bl?$('ly_bl').querySelector(`option[value="${l.bl}"]`).textContent.split(' ')[0]:'',(l.op??100)<100?(l.op+'%'):''].filter(Boolean).join(' · ');
return`<div class="lyr${i==WBS.selL?' on':''}${l.vis?'':' off'}" data-l="${i}" draggable="true"><button type="button" class="eye" data-eye title="${l.vis?'Hide':'Show'}">${l.vis?EYE:NOEYE}</button><span class="lysw"${ink?` style="box-shadow:inset 0 -4px 0 ${ink}"`:''}>${sw}</span><span class="lyn">${i==lyRen?`<input value="${hx(l.name)}" maxlength="30">`:hx(l.name)}${meta?` <span class="lym">${meta}</span>`:''}</span><span class="lyact"><button type="button" class="lyb" data-more aria-haspopup="menu" aria-expanded="false" title="Layer actions" aria-label="Layer actions"><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg></button></span></div>`}).join('');
$('lycnt').textContent=`${WBS.layers.length} layer${WBS.layers.length>1?'s':''}`;$('ly_bl').value=L.bl||'';if(+$('ly_op').value!=(L.op??100)){$('ly_op').value=L.op??100;$('ly_op').dispatchEvent(new Event('input',{bubbles:true}))}$('ly_rprow').hidden=L.bl!='replace';if(WBX.wbPaintWells)WBX.wbPaintWells()
const inp=$('lyl2').querySelector('input');if(inp){inp.focus();inp.select();const done=ok=>{if(lyRen<0)return;if(ok&&inp.value.trim())WBS.layers[lyRen].name=inp.value.trim().slice(0,30);lyRen=-1;store();upd()};inp.onkeydown=e=>{if(e.key=='Enter')done(1);else if(e.key=='Escape')done(0);e.stopPropagation()};inp.onblur=()=>done(1)}}
let lyDrag=-1;
const lyClr=()=>$('lyl2').querySelectorAll('.lyr').forEach(x=>x.classList.remove('dragover-t','dragover-b'));
function init32(){
window.lyInkOn=1;
$('lyl2').onclick=e=>{const r=e.target.closest('[data-l]');if(!r||e.target.closest('input'))return;const i=+r.dataset.l;if(e.target.closest('[data-eye]')){WBS.layers[i].vis=!WBS.layers[i].vis;store();upd();return}
{const mb=e.target.closest('[data-more]');if(mb){e.stopPropagation();const n=WBS.layers.length,
 dup=()=>{const c=JSON.parse(JSON.stringify(WBS.layers[i]));c.u=luid();c.name=(c.name+' copy').slice(0,30);WBS.layers.splice(i+1,0,c);WBS.selL=i+1;store();upd()},
 del=()=>{if(WBS.layers.length<2)return;WBS.layers.splice(i,1);WBS.selL=WBS.selL>i?WBS.selL-1:WBS.selL==i?Math.max(0,i-1):WBS.selL;WBS.selL=Math.max(0,Math.min(WBS.selL,WBS.layers.length-1));store();upd()},
 mv=d=>{const L=WBS.layers.splice(i,1)[0];WBS.layers.splice(i+d,0,L);WBS.selL=i+d;store();upd()};   // the list is shown top first: up means printed later, a higher index
 rowMenu(mb,[['Rename',()=>{lyRen=i;WBS.selL=i;upd()}],['Duplicate',dup],['Move up',()=>mv(1),i>=n-1],['Move down',()=>mv(-1),i<=0],['Delete',del,n<2]]);return}}
if(i!=WBS.selL){WBS.selL=i;upd()}};
$('lyl2').ondblclick=e=>{const r=e.target.closest('[data-l]');if(!r||e.target.closest('[data-eye],.lyact'))return;lyRen=+r.dataset.l;WBS.selL=lyRen;upd()};$('lyl2').addEventListener('dragstart',e=>{const r=e.target.closest('[data-l]');if(!r)return;lyDrag=+r.dataset.l;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain','layer')}catch(x){}});
$('lyl2').addEventListener('dragover',e=>{if(lyDrag<0)return;const r=e.target.closest('[data-l]');if(!r)return;e.preventDefault();lyClr();const b=r.getBoundingClientRect();r.classList.add(e.clientY<b.top+b.height/2?'dragover-t':'dragover-b')});
$('lyl2').addEventListener('drop',e=>{if(lyDrag<0)return;e.preventDefault();const r=e.target.closest('[data-l]');lyClr();if(!r){lyDrag=-1;return}const b=r.getBoundingClientRect(),above=e.clientY<b.top+b.height/2,t=+r.dataset.l;
// list is shown top-first: "above" a row means printed after it (higher index)
let to=above?t+1:t;const L=WBS.layers.splice(lyDrag,1)[0];if(lyDrag<to)to--;WBS.layers.splice(Math.max(0,Math.min(WBS.layers.length,to)),0,L);WBS.selL=WBS.layers.indexOf(L);lyDrag=-1;store();upd()});
$('lyl2').addEventListener('dragend',()=>{lyDrag=-1;lyClr()});
// "+" asks what kind of layer to add; the new layer goes above the selected one, holds the current stamp, and is made the selected layer.
const LT={p:'Layer',f:'Frame',x:'Free stamps',a:'Pictures',t:'Text'};
WBX.wbAddLayer=addLayer;
$('ly_add').onclick=e=>{e.stopPropagation();addLayer('p')};
function addLayer(m){const base=LT[m]||'Layer',n=WBS.layers.filter(x=>x.name==base||x.name.startsWith(base+' ')).length,cur=WBS.tiles[WBS.cur],
 L=mkL(m=='p'?'Layer '+(WBS.layers.length+1):(n?base+' '+(n+1):base),cur?[cur.id]:[],'check',180);L.ak={};
 WBS.layers.splice(WBS.selL+1,0,L);WBS.selL++;
 if(m!='p'){const b=$('lmode').querySelector('[data-m="'+m+'"]');if(b)b.click()}   // the same switch the Layer type buttons use, on the new layer
 store();upd();
 $('pmsg').textContent='Layer added above the selected one.';
 if(m!='p'){const sec=document.querySelector('section.pn[data-p="layers"]');if(sec&&sec.hidden){const r=$('rail-layers');if(r)r.click()}}}
$('ly_bl').onchange=()=>{const v=$('ly_bl').value;if(v)LY().bl=v;else delete LY().bl;store();upd()};
$('ly_op').addEventListener('input',()=>{const v=+$('ly_op').value;if(v<100)LY().op=v;else delete LY().op;store();upd()});

covOrder();
}
export {lyInkFill,renderLayers,init32};
