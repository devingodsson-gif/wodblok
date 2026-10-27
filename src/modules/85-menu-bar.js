import {ic} from './00-icons.js';
import {$,WBX} from './01-launch-and-version.js';
import {cmdFormatShortcut,cmdGet,cmdIsEnabled,cmdRegister,cmdRun} from '../commands/registry.js';
import {fxAll} from './65-element-core.js';
import {foCan,foOpen} from './91-effect-popout.js';

// ===== The menu bar (2.42.0, owner Oct 24 2026: "a top bar with File, Export, Effects, Elements and more", Photoshop's menu bar).
// Every item is a command from the registry, so a menu, its shortcut and command search can never disagree: the label is the command's label,
// the shortcut is the command's shortcut, and an item is greyed out exactly when the command is. Nothing here does work of its own.
// File is the existing File menu (its fixed order, section 13.2 of the UI standard), moved to the left; the others are drawn here each time they open.
// 2.44.0 (owner, Oct 25 2026): the rail is gone; its panels are here: Canvas and Grid in Image, the element list first in Elements, History in Edit
// (and beside undo in the top bar), Colours in Colour, Export recipes in Export, Randomize behind the gear beside the Randomize button.
// Desktop first (owner, Oct 24 2026); the same list can become the native menu of a desktop build later.
// An entry is a command id, '-' for a divider, [name, entries] for a submenu, or a function that returns entries when the menu opens.
const mnbFx=()=>{const out=[],grp={};fxAll().forEach(d=>{const id='effect.'+d.k;if(!d.grp){out.push(id);return}if(!grp[d.grp]){grp[d.grp]=[d.grp,[]];out.push(grp[d.grp])}grp[d.grp][1].push(id)});return out};
// the element bar's kinds, as Add commands, in the bar's order; a kind whose button is hidden (Paint, for now) is left out
const mnbAdds=()=>[...document.querySelectorAll('#elb .elbb[data-k]')].filter(b=>b.dataset.k!='select'&&!b.hidden).map(b=>'element.add.'+b.dataset.k);
const MNB=[
 ['export','Export',['file.export','-','export.png','export.svg','export.copySvg','-','colourway.exportAll','library.exportShapes','-','export.proofPdf','export.proofPng','-','panel.xrec','export.now','export.allRecipes']],
 ['edit','Edit',['edit.undo','edit.redo','panel.hist','-','edit.cut','edit.copy','edit.paste','stamp.duplicateMotif','stamp.deleteMotif','-','element.group','element.ungroup','-',['Align',['align.0','align.1','align.2','align.3','align.4','align.5','align.6','align.7','align.8','-','align.ch','align.cv','-','align.dh','align.dv']],'shape.fitToCanvas','shape.stretchToCanvas']],
 ['image','Image',['panel.canvas','panel.pgrid']],
 ['elements','Elements',['panel.lyrs','-',mnbAdds,'-','stamp.new','stamp.duplicate','stamp.delete','stamp.saveToLibrary','library.importStamp','-','library.importImage','library.importSheet','library.newFolder','-','stamp.split','stamp.knockout']],
 ['effects','Effects',[mnbFx,'-','randomize.roll','panel.rand']],
 ['colour','Colour',['panel.colors','tray.add','tray.save','-','colourway.new','colourway.exportAll']],
 ['view','View',['view.zoomIn','view.zoomOut','view.fit','view.actualSize','view.hand','-','view.grid','view.smartGuides','-','view.before','view.split','view.tileRepeat','-','view.theme']],
 ['window','Window',['panel.canvas','panel.colors','panel.lyrs','panel.layers','panel.stmp','panel.motifs','panel.text','panel.pgrid','panel.hist','panel.rand','panel.xrec','-','panels.closeAll']],
 ['help','Help',['help.shortcuts','app.commandSearch','feedback.open','-','help.about']]];
// commands that open a dialog or a file picker: their menu item ends with … (section 13.2)
const MNB_DOTS=new Set(['file.export','library.importStamp','library.importImage','library.importSheet','app.commandSearch','feedback.open','help.shortcuts','help.about']);
const mnbMac=()=>/Mac|iPhone|iPad/.test(navigator.platform||'');
const mnbEsc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// an on/off command is ticked while its button is pressed or its switch is on
function mnbOn(c){const b=c&&c.elId?$(c.elId):null;if(!b)return null;if(b.type=='checkbox')return b.checked;const p=b.getAttribute('aria-pressed');return p==null?null:p==='true'}
const mnbList=es=>es.flatMap(e=>typeof e=='function'?e():[e]);
// one menu's items. Unknown commands (an account command while signed out) are left out, and so are dividers left at an edge or doubled
function mnbHtml(es){const rows=[];mnbList(es).forEach((e,i)=>{
 if(e==='-'){if(rows.length&&rows[rows.length-1]!=='<hr>')rows.push('<hr>');return}
 if(Array.isArray(e)){const kids=mnbList(e[1]).filter(x=>x!=='-'&&cmdGet(x));if(!kids.length)return;const on=kids.some(cmdIsEnabled);
  rows.push(`<button type="button" role="menuitem" class="mnbs" data-sub="${i}" aria-haspopup="menu" aria-expanded="false"${on?'':' disabled'}><span class="mnbc"></span><span class="mnbt">${mnbEsc(e[0])}</span>${ic('chevR')}</button>`);return}
 const c=cmdGet(e);if(!c)return;const t=mnbOn(c),sc=c.shortcut?cmdFormatShortcut(c.shortcut,mnbMac()):'';
 rows.push(`<button type="button" role="${t==null?'menuitem':'menuitemcheckbox'}" data-cmd="${mnbEsc(c.id)}"${t==null?'':` aria-checked="${t}"`}${cmdIsEnabled(c.id)?'':' disabled'}><span class="mnbc">${t?ic('check'):''}</span><span class="mnbt">${mnbEsc(c.label+(MNB_DOTS.has(c.id)?'…':''))}</span>${sc?`<kbd>${mnbEsc(sc)}</kbd>`:''}</button>`)});
 while(rows.length&&rows[rows.length-1]==='<hr>')rows.pop();return rows.join('')}
// ---- submenus (Align, the effect groups): a second menu beside the item, open while the pointer is on the item or after a click or the right arrow
let mnbSub=null;
function mnbSubClose(){if(!mnbSub)return;const s=mnbSub;mnbSub=null;if(s.src)s.src.setAttribute('aria-expanded','false');s.remove()}
function mnbSubOpen(item,es,focus){if(mnbSub&&mnbSub.src===item){if(focus)mnbFocus(mnbSub,0);return}mnbSubClose();if(item.disabled)return;
 const f=document.createElement('div');f.className='pop mnbm mnbsub fx';f.setAttribute('role','menu');f.innerHTML=mnbHtml(es);f.src=item;document.body.appendChild(f);item.setAttribute('aria-expanded','true');mnbSub=f;
 const r=item.getBoundingClientRect(),m=item.closest('.pop').getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,w=f.offsetWidth,h=f.offsetHeight;
 let left=m.right+2;if(left+w>vw-8)left=Math.max(8,m.left-w-2);f.style.left=left+'px';f.style.top=Math.max(8,Math.min(r.top-7,vh-h-8))+'px';
 f.addEventListener('click',mnbClick);if(focus)mnbFocus(f,0)}
// ---- running an item: the File menu's own wiring closes the menus first (34-desktop-shell.js), then the command runs
function mnbClick(e){const b=e.target.closest('button');if(!b||b.disabled)return;const m=b.closest('.pop');
 if(b.dataset.sub!=null){e.stopPropagation();const k=m&&m.dataset.mnb,M=MNB.find(x=>x[0]===k),en=M&&mnbList(M[2])[+b.dataset.sub];if(en)mnbSubOpen(b,en[1],false);return}
 const id=b.dataset.cmd;if(!id)return;if(m&&m.classList.contains('mnbsub')&&WBX.wbCloseMenus)WBX.wbCloseMenus();cmdRun(id)}
// ---- keyboard (section 13.2): arrows move, Enter picks, Esc closes and returns focus; left and right move along the bar
const mnbItems=m=>[...m.querySelectorAll('button,label.mi')].filter(x=>!x.disabled&&!x.hidden&&x.offsetParent!==null);
function mnbFocus(m,i){const its=mnbItems(m);if(!its.length)return;its[(i+its.length)%its.length].focus()}
const mnbBars=()=>[...document.querySelectorAll('#mbar .mnbb')];
const mnbOpenBtn=()=>mnbBars().find(b=>b.getAttribute('aria-expanded')==='true')||null;
const mnbPopOf=b=>$(b.getAttribute('aria-controls'));
function mnbKey(e){const b=mnbOpenBtn(),a=document.activeElement;
 if(!b){if(a&&a.classList&&a.classList.contains('mnbb')&&(e.key=='ArrowDown'||e.key=='ArrowLeft'||e.key=='ArrowRight')){e.preventDefault();if(e.key=='ArrowDown'){a.click();mnbFocus(mnbPopOf(a),0)}else{const bs=mnbBars(),n=bs[(bs.indexOf(a)+(e.key=='ArrowRight'?1:-1)+bs.length)%bs.length];n.focus()}}return}
 const m=mnbPopOf(b),inSub=!!(mnbSub&&a&&mnbSub.contains(a)),cur=inSub?mnbSub:m,k=e.key;
 if(k=='Escape'){e.preventDefault();e.stopImmediatePropagation();if(inSub){const s=mnbSub.src;mnbSubClose();s.focus();return}if(WBX.wbCloseMenus)WBX.wbCloseMenus();b.focus();return}
 if(k=='ArrowDown'||k=='ArrowUp'){e.preventDefault();e.stopImmediatePropagation();const its=mnbItems(cur),i=its.indexOf(a);mnbFocus(cur,i<0?(k=='ArrowDown'?0:-1):i+(k=='ArrowDown'?1:-1));return}
 if(k=='Home'||k=='End'){e.preventDefault();mnbFocus(cur,k=='Home'?0:-1);return}
 if(k=='ArrowRight'&&!inSub&&a&&a.dataset&&a.dataset.sub!=null&&m.contains(a)){e.preventDefault();e.stopImmediatePropagation();a.click();if(mnbSub)mnbFocus(mnbSub,0);return}
 if(k=='ArrowLeft'&&inSub){e.preventDefault();e.stopImmediatePropagation();const s=mnbSub.src;mnbSubClose();s.focus();return}
 if(k=='ArrowLeft'||k=='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();const bs=mnbBars(),n=bs[(bs.indexOf(b)+(k=='ArrowRight'?1:-1)+bs.length)%bs.length];n.click();n.focus();mnbFocus(mnbPopOf(n),0)}}
function init85(){const bar=$('mbar');if(!bar||!WBX.wbMenuWire)return;
 // the commands only the menus give a name to: adding each element kind, each effect, and the two Help pages
 mnbAdds().forEach(id=>{const k=id.slice(12),b=()=>document.querySelector(`#elb .elbb[data-k="${k}"]`),lb=b().getAttribute('aria-label')||k;
  if(!cmdGet(id))cmdRegister({id,label:'Add '+lb.toLowerCase(),enabled:()=>{const x=b();return!!x&&!x.hidden&&!x.disabled},run:()=>b().click()})});
 fxAll().forEach(d=>{const id='effect.'+d.k;if(!cmdGet(id))cmdRegister({id,label:d.label,enabled:()=>foCan(d.k),run:()=>foOpen(d.k)})});   /* 2.55.0: an Effects item opens the effect pop-out (91-effect-popout.js) */
 [['help.shortcuts','Keyboard shortcuts','keys'],['help.about','About Wodblok','about']].forEach(([id,label,p])=>{if(!cmdGet(id))cmdRegister({id,label,enabled:()=>!!WBX.wbStgOpen,run:()=>WBX.wbStgOpen(p)})});
 // the bar: File first (already in the page), then one button and one menu per entry
 bar.insertAdjacentHTML('beforeend',MNB.map(([k,t])=>`<div class="menu"><button type="button" class="mnbb" id="mnb-${k}" role="menuitem" aria-haspopup="menu" aria-expanded="false" aria-controls="mnbm-${k}">${t}</button><div class="pop mnbm" id="mnbm-${k}" data-mnb="${k}" role="menu" aria-label="${t}" hidden></div></div>`).join(''));
 MNB.forEach(([k,,es])=>{const m=$('mnbm-'+k);WBX.wbMenuWire('mnb-'+k,'mnbm-'+k,()=>{mnbSubClose();m.innerHTML=mnbHtml(es)});m.addEventListener('click',mnbClick);
  m.addEventListener('pointerover',e=>{const it=e.target.closest('button');if(!it||!m.contains(it))return;if(it.dataset.sub!=null){const M=mnbList(es)[+it.dataset.sub];if(M)mnbSubOpen(it,M[1],false)}else if(mnbSub)mnbSubClose()})});
 WBX.wbMenuSubClose=mnbSubClose;
 // with one menu open, moving the pointer along the bar opens the menu under it (the menu still opens and closes with a click)
 // the click that follows (the pointer came to rest and was pressed) must not close it again at once
 let hov=null;
 bar.addEventListener('pointerover',e=>{const b=e.target.closest('.mnbb');if(!b)return;const o=mnbOpenBtn();if(o&&o!==b){b.click();hov=b}});
 bar.addEventListener('pointerout',e=>{const b=e.target.closest('.mnbb');if(b&&b===hov&&!b.contains(e.relatedTarget))hov=null});
 bar.addEventListener('click',e=>{const b=e.target.closest('.mnbb');if(b&&b===hov&&b.getAttribute('aria-expanded')==='true'){hov=null;e.stopImmediatePropagation();e.preventDefault()}},true);
 addEventListener('keydown',mnbKey,true)}
export {init85};
