import {$,WBS,WBX} from './01-launch-and-version.js';
import {geom,shOf,stvSet} from './04-canvas-and-stamp-outlines.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {STP,stLock,stUnlocked,stampAt} from './63-stamp-tool.js';

// ===== Stamp editing in tabs (2.5.0; as a mode since 2.3.0, like a Photoshop smart object). A strip over the stage holds the Canvas tab and one tab for each stamp that is
// open; the strip is hidden while no stamp is open. A stamp tab shows the stamp on its own (2.5.1): the stage becomes a canvas of the stamp's own size with just that stamp on it
// (no background, canvas outline, tile or other element), so any stamp can be opened whether or not it is printed anywhere. Its contents (shapes, text) are in the Elements list and its settings
// (block, edge, texture, symmetry) in Properties. Everything else, the tools, the panels and the one undo history, is the same: a tab is a view, not a copy.
// Each tab keeps its own zoom and scroll. Edit (in the Stamp properties, on a stamp row, or a double click on a stamp on the canvas) opens a stamp's tab; its × or Edit
// again closes it. There is no lock any more. Under the hood a tab is the stamp's unlocked state (63-stamp-tool.js) and the build draws a one-stamp scene in place of the layers
// (steScene, 10-layer-grids.js asks); nothing of the scene is stored. Owner, Oct 21 2026: "edit the stamps in their own view, a tabs bar with the canvas as a tab and any open
// stamp windows as a tab", then "I don't want to see the rest of the canvas, I just want to see the stamp rendered on its own".
let steHome=null;   // where the list of the stamp's contents lives when it is not shown in the Elements panel
const STE={tabs:[],views:{},key:''};   // tabs: the open stamp ids in the order opened; views: zoom and scroll left by each tab ('c' is the Canvas)
const stePt=e=>{const a=$('art'),m=a&&a.getScreenCTM();if(!m)return null;const p=a.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(m.inverse());return{x:q.x,y:q.y}};
const steView=()=>{const b=$('boardP');return{z:WBX.wbZoomNow?WBX.wbZoomNow():1,fit:!(WBX.wbZoomIn&&WBX.wbZoomIn()),sl:b.scrollLeft,st:b.scrollTop}};
function steBack(v){const b=$('boardP');if(!v||!b)return;if(v.fit){if(WBX.wbZoomIn&&WBX.wbZoomIn())$('zl').click()}else if(WBX.wbZoomTo)WBX.wbZoomTo(v.z);b.scrollLeft=v.sl;b.scrollTop=v.st}
let STID=null;   // the stamp shown alone, or null while the Canvas is shown
// the scene the build draws while a stamp is shown: one layer holding a 1 x 1 pattern of the stamp, so the stamp prints once, in the middle, and every tool that works on a
// printed stamp works on it. It takes the selected layer's id because the unlocked stamp belongs to that layer.
function steScene(){if(STID==null)return null;const t=WBS.tiles.find(x=>x.id==STID),rl=WBS.layers[WBS.selL];if(!t||!rl)return null;const G=geom(shOf(t));
 return[{u:rl.u,name:'Stamp',vis:true,st:[t.id],lay:'check',size:180,ox:0,oy:0,rot:0,pst:0,pfl:0,free:true,pl:[{u:'ste',k:'pattern',lay:'grid',cn:1,rn:1,sz:STSZ,rt:0,ds:'cycle',sd:1,src:[{k:'stamp',t:t.id,w:1}],x:+(G.SW/2).toFixed(1),y:+(G.SH/2).toFixed(1),s:Math.min(G.SW,G.SH),r:0,f:1}]}]}
const STSZ=100;
// switch the stage between the Canvas and a stamp (the canvas size is the stamp's while one is shown)
function steStage(id){STID=id;const t=id==null?null:WBS.tiles.find(x=>x.id==id);if(t){const G=geom(shOf(t));stvSet(G.SW,G.SH)}else{STID=null;stvSet(null)}if(WBX.wbApplyZ)WBX.wbApplyZ()}
// show a tab: a stamp id, or null for the Canvas
function steGo(id){const cur=stUnlocked();if((cur==null?null:cur)===(id==null?null:id))return;
 STE.views[cur==null?'c':cur]=steView();
 if(id==null){steStage(null);stLock(cur)}else{if(!STE.tabs.includes(id))STE.tabs.push(id);steStage(id);stLock(id)}
 const v=STE.views[id==null?'c':id];if(v)steBack(v);else if(id!=null&&WBX.wbZoomIn&&WBX.wbZoomIn())$('zl').click();
 steSync()}
function steClose(id){const i=STE.tabs.indexOf(id);if(i<0)return;const act=stUnlocked()===id;if(act)steGo(null);STE.tabs.splice(i,1);delete STE.views[id];steSync()}
// Edit on a stamp: opens its tab, or closes it when it is the one shown
const steEdit=id=>{if(stUnlocked()===id)steClose(id);else steGo(id)};
const steOpen=id=>steGo(id);
const steDone=()=>{const id=stUnlocked();if(id!=null)steClose(id)};
const stIcX='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function steTabs(un){const bar=$('stetabs');if(!bar)return;STE.tabs=STE.tabs.filter(id=>WBS.tiles.some(t=>t.id==id));
 const key=[un,STE.tabs.map(id=>id+':'+(WBS.tiles.findIndex(t=>t.id==id)+1)).join()].join('|');if(key===STE.key)return;STE.key=key;
 const on=STE.tabs.length>0;if(bar.classList.contains('on')!==on)bar.classList.toggle('on',on);
 bar.innerHTML=on?`<button type="button" class="wtab${un==null?' on':''}" role="tab" aria-selected="${un==null}" data-sv="c">Canvas</button>`+STE.tabs.map(id=>{const k=WBS.tiles.findIndex(t=>t.id==id)+1,a=un===id;return`<span class="wtg${a?' on':''}"><button type="button" class="wtab${a?' on':''}" role="tab" aria-selected="${a}" data-sv="${id}">Stamp ${k}</button><button type="button" class="ib" data-sx="${id}" aria-label="Close Stamp ${k}">${stIcX}</button></span>`}).join(''):''}
function steSync(){const un=stUnlocked(),ml=$('mlist'),body=$('lybody'),list=$('lyl2');if(!ml||!body||!list)return;
 if(STID!=null&&un!==STID){steStage(null);STE.views.c&&steBack(STE.views.c);upd();return}   // the stamp went away (deleted, another layer): back on the Canvas
 // a stamp that opened some other way (a double click, or the stamp list) gets its tab too
 if(un!=null&&!STE.tabs.includes(un))STE.tabs.push(un);
 steTabs(un);
 const on=un!=null;document.body.classList.toggle('stedit',on);
 if(on&&ml.parentNode!==body){if(!steHome)steHome=ml.parentNode;body.insertBefore(ml,list);list.hidden=true}
 else if(!on&&steHome&&ml.parentNode!==steHome){steHome.appendChild(ml);list.hidden=false}}
function init75(){const a=$('art');if(!a)return;
 const st=document.querySelector('.stage');if(st&&!$('stetabs'))st.insertAdjacentHTML('afterbegin','<div class="stt" id="stetabs" role="tablist" aria-label="Views"></div>');
 $('stetabs').onclick=e=>{const x=e.target.closest('[data-sx]');if(x){steClose(+x.dataset.sx);return}const t=e.target.closest('[data-sv]');if(!t)return;steGo(t.dataset.sv=='c'?null:+t.dataset.sv)};
 const ed=$('smkedit');if(ed)ed.onclick=()=>{const t=WBS.tiles[WBS.cur];if(t)steGo(t.id)};
 ($('boardP')||a).addEventListener('dblclick',e=>{if(WBS.brush||WBS.txArm||WBS.fpB!=null)return;const c=stePt(e);if(!c)return;const h=stampAt(c.x,c.y,null);if(!h)return;e.preventDefault();const it=STP.items[h.i],id=it?it[0]:null;if(id==null)return;if(stUnlocked()===id){if(WBX.wbTxGrp&&WBX.wbTxGrp())return;steClose(id)}else steGo(id)});
 WBX.wbSteSync=steSync;WBX.wbSteEdit=steEdit;WBX.wbSteScene=steScene}
export {init75,steDone,steOpen};
