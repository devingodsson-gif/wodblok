import {$,WBS} from './01-launch-and-version.js';
import {C,CM,DD,DDset,SH,SW,cItem,col,geom,mkdd,shOf} from './04-canvas-and-stamp-outlines.js';
import {luid,mkL,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {LY} from './14-presets-and-layer-grid-ui.js';
import {covOrder} from './18-projects-and-cover-overlay.js';
import {artBU} from './25-art-layers.js';
// ===== Layers: each layer is one printing pass (its own stamps, arrangement, ink, opacity and blend). The selected layer is what the tools edit.
const lyDef={v:'',h:'<span class="chip" style="border-style:dashed"></span>Stamp colours'};
function lyInkFill(){$('ly_ink').innerHTML='<option value="">Stamp colours</option>'+C.map(([n])=>`<option value="${hx(n)}">${hx(n)}</option>`).join('');if(DDset.ly_ink)DDset.ly_ink([lyDef,...C.map(cItem)]);$('ly_rp').innerHTML=C.map(([n])=>`<option value="${hx(n)}">${hx(n)}</option>`).join('');if(DDset.ly_rp)DDset.ly_rp(C.map(cItem))}
const EYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',NOEYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 5.7A8.6 8.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-2.9 3.7M6.3 7.6C3.6 9.3 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.3 4-.9"/><path d="M4 4l16 16"/></svg>';
let lyRen=-1;
function renderLayers(){const pa=col(WBS.proj.bg),L=LY();
$('lyl2').innerHTML=WBS.layers.map((_,i)=>i).reverse().map(i=>{const l=WBS.layers[i],ink=l.ink&&CM[l.ink]?col(l.ink):'',ts=WBS.tiles.filter(t=>l.st.includes(t.id)).slice(0,2),tg=ts.length?geom(shOf(ts[0])):{SW,SH},
sw=l.art&&WBS.ARTS[((l.pl||[])[0]||{}).a]?`<img class="ath" src="${artBU(WBS.ARTS[l.pl[0].a])}" alt="">`:`<svg viewBox="0 0 ${tg.SW} ${tg.SH}" preserveAspectRatio="xMidYMid slice"><rect width="${tg.SW}" height="${tg.SH}" fill="${pa}"/>${ts.length?`<g${ink?` filter="url(#lk${i})"`:''}><use href="#s${ts[0].id}"/></g>`:''}</svg>`,
meta=[l.bl?$('ly_bl').querySelector(`option[value="${l.bl}"]`).textContent.split(' ')[0]:'',(l.op??100)<100?(l.op+'%'):''].filter(Boolean).join(' · ');
return`<div class="lyr${i==WBS.selL?' on':''}${l.vis?'':' off'}" data-l="${i}" draggable="true"><button type="button" class="eye" data-eye title="${l.vis?'Hide':'Show'}">${l.vis?EYE:NOEYE}</button><span class="lysw"${ink?` style="box-shadow:inset 0 -4px 0 ${ink}"`:''}>${sw}</span><span class="lyn">${i==lyRen?`<input value="${hx(l.name)}" maxlength="30">`:hx(l.name)}${meta?` <span class="lym">${meta}</span>`:''}</span><span class="lyact"><button type="button" class="lyb" data-dup title="Duplicate layer" aria-label="Duplicate layer"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M8.5 15.5H6A2.5 2.5 0 013.5 13V6A2.5 2.5 0 016 3.5h7A2.5 2.5 0 0115.5 6v2.5"/></svg></button><button type="button" class="lyb" data-del title="${WBS.layers.length<2?'A project needs at least one layer':'Delete layer'}" aria-label="Delete layer"${WBS.layers.length<2?' disabled':''}><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7M10.2 11v5M13.8 11v5"/></svg></button></span></div>`}).join('');
$('lycnt').textContent=`${WBS.layers.length} layer${WBS.layers.length>1?'s':''}`;$('ly_bl').value=L.bl||'';if(+$('ly_op').value!=(L.op??100)){$('ly_op').value=L.op??100;$('ly_op').dispatchEvent(new Event('input',{bubbles:true}))}$('ly_ink').value=L.ink&&CM[L.ink]?L.ink:'';{const k=$('ly_ink').value,sw=$('lyS');sw.style.background=k?col(k):'transparent';sw.style.borderStyle=k?'solid':'dashed';DD.ly_ink()}{const rk=L.rp&&CM[L.rp]?L.rp:WBS.proj.ink;$('ly_rprow').hidden=L.bl!='replace';$('ly_rp').value=rk;$('lyRS').style.background=col(rk);DD.ly_rp()}
const inp=$('lyl2').querySelector('input');if(inp){inp.focus();inp.select();const done=ok=>{if(lyRen<0)return;if(ok&&inp.value.trim())WBS.layers[lyRen].name=inp.value.trim().slice(0,30);lyRen=-1;store();upd()};inp.onkeydown=e=>{if(e.key=='Enter')done(1);else if(e.key=='Escape')done(0);e.stopPropagation()};inp.onblur=()=>done(1)}}
let lyDrag=-1;
const lyClr=()=>$('lyl2').querySelectorAll('.lyr').forEach(x=>x.classList.remove('dragover-t','dragover-b'));
function init32(){
lyInkFill();mkdd('ly_ink',[lyDef,...C.map(cItem)]);mkdd('ly_rp',C.map(cItem));lyInkFill();window.lyInkOn=1;
$('lyl2').onclick=e=>{const r=e.target.closest('[data-l]');if(!r||e.target.closest('input'))return;const i=+r.dataset.l;if(e.target.closest('[data-eye]')){WBS.layers[i].vis=!WBS.layers[i].vis;store();upd();return}
if(e.target.closest('[data-dup]')){const c=JSON.parse(JSON.stringify(WBS.layers[i]));c.u=luid();c.name=(c.name+' copy').slice(0,30);WBS.layers.splice(i+1,0,c);WBS.selL=i+1;store();upd();return}
if(e.target.closest('[data-del]')){if(WBS.layers.length<2)return;WBS.layers.splice(i,1);WBS.selL=WBS.selL>i?WBS.selL-1:WBS.selL==i?Math.max(0,i-1):WBS.selL;WBS.selL=Math.max(0,Math.min(WBS.selL,WBS.layers.length-1));store();upd();return}
if(i!=WBS.selL){WBS.selL=i;upd()}};
$('lyl2').ondblclick=e=>{const r=e.target.closest('[data-l]');if(!r||e.target.closest('[data-eye],.lyact'))return;lyRen=+r.dataset.l;WBS.selL=lyRen;upd()};$('lyl2').addEventListener('dragstart',e=>{const r=e.target.closest('[data-l]');if(!r)return;lyDrag=+r.dataset.l;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain','layer')}catch(x){}});
$('lyl2').addEventListener('dragover',e=>{if(lyDrag<0)return;const r=e.target.closest('[data-l]');if(!r)return;e.preventDefault();lyClr();const b=r.getBoundingClientRect();r.classList.add(e.clientY<b.top+b.height/2?'dragover-t':'dragover-b')});
$('lyl2').addEventListener('drop',e=>{if(lyDrag<0)return;e.preventDefault();const r=e.target.closest('[data-l]');lyClr();if(!r){lyDrag=-1;return}const b=r.getBoundingClientRect(),above=e.clientY<b.top+b.height/2,t=+r.dataset.l;
// list is shown top-first: "above" a row means printed after it (higher index)
let to=above?t+1:t;const L=WBS.layers.splice(lyDrag,1)[0];if(lyDrag<to)to--;WBS.layers.splice(Math.max(0,Math.min(WBS.layers.length,to)),0,L);WBS.selL=WBS.layers.indexOf(L);lyDrag=-1;store();upd()});
$('lyl2').addEventListener('dragend',()=>{lyDrag=-1;lyClr()});
$('ly_add').onclick=()=>{const L=mkL('Layer '+(WBS.layers.length+1),[],'check',180);L.ak={};WBS.layers.splice(WBS.selL+1,0,L);WBS.selL++;store();upd();$('pmsg').textContent='New empty layer added above the selected one. Tick the stamps it should print in Arrangement.'};
$('ly_bl').onchange=()=>{const v=$('ly_bl').value;if(v)LY().bl=v;else delete LY().bl;store();upd()};
$('ly_op').addEventListener('input',()=>{const v=+$('ly_op').value;if(v<100)LY().op=v;else delete LY().op;store();upd()});
$('ly_rp').oninput=()=>{LY().rp=$('ly_rp').value;store();upd()};
$('ly_ink').oninput=()=>{const v=$('ly_ink').value;if(v)LY().ink=v;else delete LY().ink;store();upd()};

covOrder();
$('pswp').onclick=()=>{WBS.proj={ink:WBS.proj.bg,bg:WBS.proj.ink};store();upd()};
}
export {lyInkFill,renderLayers,init32};
