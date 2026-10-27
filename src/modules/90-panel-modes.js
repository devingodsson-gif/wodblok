import {$,WBS,WBX} from './01-launch-and-version.js';
import {SH,SW,shp,stNmId} from './04-canvas-and-stamp-outlines.js';
import {mk,pal,store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {ICN} from './00-icons.js';
import {mNm} from './21-motif-library-ui.js';
import {elKind,elSel} from './65-element-core.js';

// ===== Creating and editing (2.54.2, owner Oct 26 2026: "there should be a difference between creating a new element and editing one"; docs/panel-modes-plan.md).
// An element panel is in one of two modes. Creating (nothing of its kind selected): the panel shows its library and the settings for the next one.
// Editing (an element of its kind selected): the panel shows that element's own groups and no library; in its place, one row shows what the element is made from
// (thumbnail and name) with Replace, which opens the same library in a popover. The library's own body is moved into the popover and put back after, so it is the
// same tree with the same search, folders and picks, never a copy. A pick there is the library's usual pick (it swaps what the selected element is made from).
// Each kind says, in PM_K, where its library groups are (lib: one selector, or several joined by ','; the first one is the one Replace opens), where the row goes,
// what it is made from, and how a pick there works: either the library's own pick (picked: which clicks close the popover) or a swap done here (item: the rows that
// swap, swap(q, row): one history step), for a list whose own click does something else.
const PM_K={};
function pmRegister(kind,d){PM_K[kind]=d}
let pmOpen=null;   // {kind, gb, home, pop}
// the library group is found once: while the popover is open its body is elsewhere
const pmLibs=d=>d.els||(d.els=d.lib.split(',').map(x=>document.querySelector(x.trim())).filter(Boolean));
const pmLib=d=>pmLibs(d)[0]||null;
// while its tool is armed a panel keeps creating, even with the element it just placed selected (each click places another)
const pmEdit=kind=>{const d=PM_K[kind];if(d.armed&&d.armed())return null;const q=elSel();return q&&elKind(q)==kind?q:null};
function pmRow(kind,d){const sec=document.querySelector(`section.pn[data-p="${d.pn}"]`);if(!sec)return null;let r=sec.querySelector(`.rprow[data-pmk="${kind}"]`);
 if(!r){const at=sec.querySelector(d.at);if(!at)return null;at.insertAdjacentHTML('afterbegin',`<div class="rprow" data-pmk="${kind}" hidden><span class="rpth"></span><span class="rpn"></span><button type="button" class="alt rpgo" aria-haspopup="dialog">Replace</button></div>`);r=at.querySelector(`.rprow[data-pmk="${kind}"]`);
  r.querySelector('.rpgo').onclick=e=>{e.stopPropagation();if(pmOpen&&pmOpen.kind==kind){pmClose();return}pmShow(kind,r.querySelector('.rpgo'))}}
 return r}
function pmSync(){for(const kind in PM_K){const d=PM_K[kind],q=pmEdit(kind),lib=pmLib(d),r=pmRow(kind,d);if(!lib||!r)continue;const ed=!!q;
 if(!ed&&pmOpen&&pmOpen.kind==kind)pmClose();
 pmLibs(d).forEach(x=>{if(x.hidden!==ed)x.hidden=ed});if(r.hidden!==!ed)r.hidden=!ed;if(!ed)continue;
 const key=d.key(q);if(r.dataset.key!==key){r.dataset.key=key;r.querySelector('.rpth').innerHTML=d.thumb(q);r.querySelector('.rpn').textContent=d.name(q)}}}
// the popover: under the Replace button, the panel's width, the library's body moved inside (put back on close). pmPop is also used by the Texture effect's row.
function pmPop(btn,body,kind){pmClose();if(!body)return null;
 const pop=document.createElement('div');pop.className='rpop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Replace');document.body.appendChild(pop);
 const home=document.createComment('pm');body.before(home);pop.appendChild(body);pmOpen={kind:kind||'',gb:body,home,pop,btn};btn.setAttribute('aria-expanded','true');
 const sec=btn.closest('section.pn'),R=(sec||btn).getBoundingClientRect(),B=btn.getBoundingClientRect(),w=Math.max(220,Math.min(R.width-8,360));
 pop.style.width=w+'px';pop.style.left=Math.max(8,Math.min(innerWidth-w-8,R.left+4))+'px';const top=B.bottom+6,room=innerHeight-top-8;
 if(room>=240){pop.style.top=top+'px';pop.style.maxHeight=room+'px'}else{const h=Math.min(innerHeight*.7,B.top-14);pop.style.top=Math.max(8,B.top-6-h)+'px';pop.style.maxHeight=h+'px'}
 return pop}
const pmIsOpen=btn=>!!pmOpen&&pmOpen.btn===btn;
function pmShow(kind,btn){const d=PM_K[kind],lib=pmLib(d),gb=lib&&lib.querySelector(':scope > .gb'),pop=pmPop(btn,gb,kind);if(!pop)return;
 if(d.shown)d.shown();
 pop.addEventListener('click',e=>{if(d.picked&&d.picked(e))setTimeout(pmClose,0)});
 if(d.item)pop.addEventListener('click',e=>{const it=e.target.closest(d.item);if(!it||(d.skip&&e.target.closest(d.skip)))return;e.stopPropagation();e.preventDefault();const q=pmEdit(kind);if(q&&d.swap(q,it)!==false){store();upd();if(WBX.wbCap)WBX.wbCap()}pmClose()},true)}
function pmClose(){if(!pmOpen)return;const o=pmOpen;pmOpen=null;o.home.replaceWith(o.gb);o.pop.remove();if(o.btn)o.btn.setAttribute('aria-expanded','false');if(o.gb.classList.contains('fxtl'))o.gb.hidden=true}
function init90(){
 // Shape (a canvas motif): the Library group; the row starts the Edit group
 pmRegister('motif',{pn:'motifs',lib:'section.pn[data-p="motifs"] details.g:has(> .gb #lib)',at:'#sel',key:q=>String(q.m),name:q=>mNm(q.m)||'Shape',armed:()=>!!(WBX.plKind&&WBX.plKind()=='motif'),
  thumb:q=>{const[pa,pb]=pal();return`<svg viewBox="-50 -50 100 100" style="background:${pa};border-radius:var(--r-s)" aria-hidden="true">${mk(q.m,pb,pa)}</svg>`},
  picked:e=>{const b=e.target.closest('#lib [data-m]');return!!b&&!WBS.lsm&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey},shown:()=>{const q=$('lq');if(q)q.focus()}});
 // Stamp (a placed stamp): the project's Stamps list opens in Replace and a row there swaps the stamp; the saved stamps Library shows only while creating
 pmRegister('stamp',{pn:'stmp',lib:'section.pn[data-p="stmp"] details.g:has(> .gb #stmpl),section.pn[data-p="stmp"] details.g:has(> .gb #slpane)',at:'.smkp',key:q=>String(q.t)+'|'+stNmId(q.t),name:q=>stNmId(q.t)||'Stamp',
  thumb:q=>{const[pa]=pal();return`<svg viewBox="0 0 ${SW} ${SH}" aria-hidden="true"><path d="${shp(0)}" fill="${pa}"/><use href="#s${q.t}"/></svg>`},
  armed:()=>!!(WBX.plKind&&WBX.plKind()=='stamp'),item:'#stmpl .smkr',skip:'[data-lk],.smkn input',swap:(q,r)=>{const id=+r.dataset.t;if(!WBS.tiles.some(t=>t.id==id)||q.t==id)return false;q.t=id}});
 // Text (a text selected): the Text styles library opens from the row, and a style picked there is applied to the text (the library's own click)
 pmRegister('text',{pn:'text',lib:'section.pn[data-p="text"] details.g:has(> .gb #tsl)',at:'section.pn[data-p="text"] details.g:has(#tx_go) > .gb',key:()=>'style',name:()=>'Text style',
  thumb:()=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICN.text}</svg>`,
  armed:()=>!!(WBX.plKind&&WBX.plKind()=='text'),picked:e=>!!e.target.closest('#tsl [data-c]')&&!e.target.closest('.lmo,[data-more],button[aria-haspopup]')});
 document.addEventListener('pointerdown',e=>{if(pmOpen&&!pmOpen.pop.contains(e.target)&&!(pmOpen.btn&&pmOpen.btn.contains(e.target)))pmClose()},true);
 document.addEventListener('keydown',e=>{if(e.key=='Escape'&&pmOpen){e.stopPropagation();pmClose()}},true);
 WBX.wbPmSync=pmSync;WBX.wbPmClose=pmClose}
export {init90,pmClose,pmIsOpen,pmPop,pmRegister,pmSync};
