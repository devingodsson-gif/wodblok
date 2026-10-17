import {collection,kv,use} from '../platform/index.js';
import {fmtOpen,fmtPack,fmtPeek} from '../format/container.js';
import {TPL_BUILTIN} from '../data/templates.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {rowMenu} from './04-canvas-and-stamp-outlines.js';
import {coreStr,dirty,fileSnap,newId,openData,paintPst,pmsg,thumb} from './18-projects-and-cover-overlay.js';
import {fileUnlink,thumbPng} from './33-clear.js';
// ===== Templates =====
// A template is an ordinary saved project (a .wodblok file). "New from template" opens one as a new, unsaved project and never changes the
// template. Three kinds, found from the project itself: a book (the book cover is on), a repeating pattern (the canvas is a repeat tile), or a
// normal canvas. "Starting points" are built in (src/data/templates.js, made by `npm run templates`); "Yours" are saved here with
// "Save as template". The list (name, kind, a small picture) is kept in settings so the picker opens without reading any project; each
// project's bytes are kept in the records store and read only when it is opened.
const TP_INDEX='wb111_templates',TP_START='wb111_tplstart',TP_TYPE='wb111_tptype',TP_KINDS=[['canvas','Normal canvas'],['tile','Repeating pattern'],['book','Book']];
const tpEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TP_MORE='<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>';
// the three blank starting points draw their canvas outline instead of a stored picture
const TP_BLANK={canvas:'<svg viewBox="0 0 60 80" aria-hidden="true"><rect x="14" y="10" width="32" height="60" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
 tile:'<svg viewBox="0 0 60 80" aria-hidden="true"><rect x="16" y="22" width="28" height="36" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 22h6M44 22h6M10 58h6M44 58h6M16 16v6M44 16v6M16 58v6M44 58v6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
 book:'<svg viewBox="0 0 60 80" aria-hidden="true"><rect x="8" y="14" width="44" height="52" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M26 14v52M34 14v52" stroke="currentColor" stroke-width="2" fill="none"/></svg>'};
const TPS={kind:'canvas',ren:null,del:null,arm:null,list:[]};   // the kind shown, the card being renamed or deleted, the card waiting for a second click
let tpStore=null;                                              // the records collection (null: this browser keeps none)
const tpB64=u=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
const tpBytes=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
const tpKind=d=>d&&d.cover&&d.cover.book&&d.cover.book.on?'book':d&&d.dim&&d.dim.rt?'tile':'canvas';
const tpNow=()=>WBS.book&&WBS.book.on?'book':WBS.dim&&WBS.dim.rt?'tile':'canvas';
function tpIndex(){let a=[];try{a=JSON.parse(kv.get(TP_INDEX)||'[]')}catch(e){}return(Array.isArray(a)?a:[]).filter(t=>t&&typeof t.id=='string'&&typeof t.n=='string'&&TP_KINDS.some(k=>k[0]===t.type)).map(t=>({id:t.id,n:t.n.slice(0,40),type:t.type,t:+t.t||0,th:typeof t.th=='string'&&/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(t.th)?t.th:''}))}
const tpIndexSet=a=>{try{kv.set(TP_INDEX,JSON.stringify(a));return true}catch(e){return false}};
async function tpOpenStore(){if(tpStore===null)tpStore=(await collection('templates'))||false;return tpStore||null}
// a small JPEG picture from a PNG (the picture inside a project file)
const tpSmall=png=>new Promise(res=>{if(!png)return res('');const u=URL.createObjectURL(new Blob([png],{type:'image/png'})),im=new Image(),to=setTimeout(()=>{URL.revokeObjectURL(u);res('')},4000);
 im.onload=()=>{try{const w=240,h=Math.max(1,Math.round(w*im.naturalHeight/Math.max(1,im.naturalWidth))),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);clearTimeout(to);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.8))}catch(e){res('')}};
 im.onerror=()=>{clearTimeout(to);URL.revokeObjectURL(u);res('')};im.src=u});
// ---------------------------------------------------------------- the picker
const tpD=()=>$('tpdlg'),tpIsOpen=()=>!tpD().hidden;
function tpCard(t,own){const sel=TPS.arm===t.id,ren=own&&TPS.ren===t.id,del=own&&TPS.del===t.id;
 const pic=t.blank?`<div class="nt">${TP_BLANK[t.type]}</div>`:t.th?`<img src="${t.th}" alt="" loading="lazy" decoding="async">`:'<div class="nt"></div>';
 const nm=ren?`<input type="text" maxlength="40" value="${tpEsc(t.n)}" aria-label="Template name">`:`<b>${tpEsc(sel?'Discard changes?':t.n)}</b>`;
 const act=del?`<div class="row"><button type="button" class="alt" data-del="1">Delete</button><button type="button" class="alt" data-keep="1">Keep</button></div>`:'';
 return`<div class="pc tpc${sel?' sure':''}" role="listitem" tabindex="0" data-id="${tpEsc(t.id)}" aria-label="${tpEsc(t.n)}">${pic}<div class="tpm">${nm}${own&&!ren&&!del?`<button type="button" class="ib" data-more aria-haspopup="menu" aria-expanded="false" aria-label="Actions for ${tpEsc(t.n)}">${TP_MORE}</button>`:''}</div>${act}</div>`}
function tpPaint(){if(!tpIsOpen())return;const k=TPS.kind,mine=TPS.list.filter(t=>t.type===k).sort((a,b)=>b.t-a.t);
 $('tpty').querySelectorAll('[data-k]').forEach(b=>{const on=b.dataset.k===k;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
 const base=[{id:'blank:'+k,n:'Blank',type:k,blank:1},...TPL_BUILTIN.filter(t=>t.type===k)];
 $('tpg').innerHTML=base.map(t=>tpCard(t,false)).join('');
 $('tpyh').hidden=$('tpy').hidden=!mine.length;$('tpy').innerHTML=mine.map(t=>tpCard(t,true)).join('');
 const r=tpD().querySelector('.tpc input');if(r){r.focus();r.select()}}
async function tpShow(){TPS.list=tpIndex();TPS.ren=TPS.del=TPS.arm=null;try{const k=kv.get(TP_TYPE);if(TP_KINDS.some(x=>x[0]===k))TPS.kind=k}catch(e){}
 try{if(typeof WBX.wbCloseMenus=='function')WBX.wbCloseMenus()}catch(e){}
 tpD().hidden=false;tpPaint();const f=tpD().querySelector('.tpc');if(f)f.focus()}
function tpHide(){if(!tpD().hidden){tpD().hidden=true;TPS.ren=TPS.del=TPS.arm=null;const b=$('fileb');if(b&&b.focus)b.focus()}}
// ---------------------------------------------------------------- starting a project from a template
const tpWait=ms=>new Promise(r=>setTimeout(r,ms));
// every start is a new project: nothing is tied to a file, history starts again, and the unsaved dot stays off until the first change
async function tpFinish(name){fileUnlink();WBS.cp.saved='';if(WBX.wbResetHist)WBX.wbResetHist();await tpWait(50);WBS.cp.saved=coreStr();paintPst();pmsg('Started from “'+name+'”.')}
async function tpBlankStart(kind){const b=$('pnw');b.dataset.sure='1';b.click();   // New project, without its own question (this dialog asked already)
 if(kind==='tile'&&WBX.wbTileSet)WBX.wbTileSet(true);
 else if(kind==='book'){const f=$('cfmt').querySelector('[data-f="book"]');if(f)f.click();const s=$('bktr');if(s){s.value='6x9';s.dispatchEvent(new Event('change',{bubbles:true}))}}
 await tpFinish('Blank '+TP_KINDS.find(k=>k[0]===kind)[1].toLowerCase())}
async function tpStart(id){
 if(id.startsWith('blank:')){await tpBlankStart(id.slice(6));return}
 let bytes=null,name='';
 const bi=TPL_BUILTIN.find(t=>t.id===id);
 if(bi){bytes=tpBytes(bi.b);name=bi.n}
 else{const st=await tpOpenStore();if(!st)return pmsg('This browser does not keep templates.');const r=await st.doc(id).get();const v=r&&r.exists?r.data():null;if(!v||typeof v.b!='string')return pmsg('That template could not be read.');bytes=tpBytes(v.b);name=v.n||''}
 const r=await fmtOpen(bytes);openData(r.project,null,'');await tpFinish(name)}
// the card was chosen: with unsaved work it asks once
async function tpPick(id){
 if(dirty()&&TPS.arm!==id){TPS.arm=id;tpPaint();setTimeout(()=>{if(TPS.arm===id){TPS.arm=null;tpPaint()}},3500);return}
 TPS.arm=null;tpHide();
 try{await tpStart(id)}catch(e){pmsg((e&&e.message)||'Could not start from that template.')}}
// ---------------------------------------------------------------- Save as template
const tpSd=()=>$('tpsd');
function tpSaveShow(){try{if(typeof WBX.wbCloseMenus=='function')WBX.wbCloseMenus()}catch(e){}tpSd().hidden=false;const n=$('tpsn');n.value=($('pnm').value||'').trim().slice(0,40);tpSaveLabel();n.focus();n.select()}
function tpSaveHide(){tpSd().hidden=true;$('tpsok').dataset.arm='';const b=$('fileb');if(b&&b.focus)b.focus()}
const tpSame=()=>{const n=$('tpsn').value.trim().toLowerCase(),k=tpNow();return tpIndex().find(t=>t.type===k&&t.n.toLowerCase()===n)||null};
function tpSaveLabel(){const ok=$('tpsok'),same=tpSame();ok.textContent=same?(ok.dataset.arm?'Click again to replace':'Replace'):'Save';ok.disabled=!$('tpsn').value.trim()}
async function tpSave(){const ok=$('tpsok'),name=$('tpsn').value.trim().slice(0,40);if(!name)return;const same=tpSame();
 if(same&&!ok.dataset.arm){ok.dataset.arm='1';tpSaveLabel();return}
 const st=await tpOpenStore();if(!st){tpSaveHide();return pmsg('This browser does not keep templates.')}
 ok.disabled=true;
 try{const sn=await fileSnap(),th=await thumb(240),png=await thumbPng(th),bytes=await fmtPack({name,...sn},{thumbnail:png}),id=same?same.id:newId(),type=tpNow(),t=Date.now();
  await st.doc(id).set({id,n:name,type,t,b:tpB64(bytes)});
  const a=tpIndex().filter(x=>x.id!==id);a.unshift({id,n:name,type,t,th});
  if(!tpIndexSet(a)){await st.doc(id).delete().catch(()=>{});throw new Error('Could not keep the template list in this browser.')}
  tpSaveHide();pmsg((same?'Replaced the template “':'Saved the template “')+name+'”.')}
 catch(e){pmsg((e&&e.message)||'Could not save the template.')}
 finally{ok.disabled=false;ok.dataset.arm=''}}
// ---------------------------------------------------------------- your templates: rename, download, delete, add from a file
const tpFile=n=>(n||'template').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').toLowerCase().slice(0,50)||'template';
async function tpDownload(t){const st=await tpOpenStore(),d=await use('downloads');if(!st||!d)return pmsg('Saving is not available here.');
 try{const r=await st.doc(t.id).get(),v=r&&r.exists?r.data():null;if(!v)return pmsg('That template could not be read.');const fn=tpFile(t.n)+'.wodblok',h0=d.pick?await d.pick({filename:fn}):null;
  const res=await d.save({filename:fn,data:new Blob([tpBytes(v.b)],{type:'application/vnd.wodblok+zip'}),handle:h0});pmsg((res&&res.how=='saved'?'Saved “':'Downloaded “')+t.n+'”.')}
 catch(e){if(e&&e.code=='declined')return;pmsg((e&&e.message)||'Could not save the file.')}}
async function tpAddFile(fl){const st=await tpOpenStore();if(!st)return pmsg('This browser does not keep templates.');
 try{const bytes=new Uint8Array(await fl.arrayBuffer()),r=await fmtOpen(bytes);
  if(r.newer)return pmsg('That project was made by a newer WODBLOK, so it cannot be added here.');
  const pk=fmtPeek(bytes),name=(r.project.name||fl.name.replace(/\.wodblok(\.json)?$|\.json$/i,'')||'Template').slice(0,40),type=tpKind(r.project),id=newId(),t=Date.now(),th=await tpSmall(pk.thumbnail);
  // always keep it as the current container format
  const packed=await fmtPack({...r.project,name},{thumbnail:pk.thumbnail||undefined});
  await st.doc(id).set({id,n:name,type,t,b:tpB64(packed)});
  const a=tpIndex();a.unshift({id,n:name,type,t,th});if(!tpIndexSet(a)){await st.doc(id).delete().catch(()=>{});throw new Error('Could not keep the template list in this browser.')}
  TPS.list=tpIndex();TPS.kind=type;try{kv.set(TP_TYPE,type)}catch(e){}tpPaint();pmsg('Added “'+name+'” to your templates.')}
 catch(e){pmsg((e&&e.message)||'That file could not be added.')}}
async function tpRename(id,v){v=v.trim().slice(0,40);const a=tpIndex(),t=a.find(x=>x.id===id);if(!t||!v||v===t.n)return;const st=await tpOpenStore();
 try{if(st){const r=await st.doc(id).get(),d=r&&r.exists?r.data():null;if(d)await st.doc(id).set({...d,n:v})}t.n=v;tpIndexSet(a);TPS.list=tpIndex()}catch(e){pmsg('Could not rename the template.')}}
async function tpDelete(id){const st=await tpOpenStore();try{if(st)await st.doc(id).delete()}catch(e){}tpIndexSet(tpIndex().filter(x=>x.id!==id));TPS.list=tpIndex();TPS.del=null;tpPaint();pmsg('Deleted the template.')}
function init54(){
 $('tpnew').onclick=()=>tpShow();$('tpsave').onclick=()=>tpSaveShow();
 $('tpclose').onclick=tpHide;tpD().addEventListener('click',e=>{if(e.target===tpD())tpHide()});
 $('tpty').addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;TPS.kind=b.dataset.k;TPS.ren=TPS.del=TPS.arm=null;try{kv.set(TP_TYPE,TPS.kind)}catch(err){}tpPaint()});
 const onGrid=e=>{const c=e.target.closest('.tpc');if(!c||e.target.closest('input'))return;const id=c.dataset.id,t=TPS.list.find(x=>x.id===id);
  const more=e.target.closest('[data-more]');
  if(more){e.stopPropagation();if(!t)return;rowMenu(more,[['Rename',()=>{TPS.ren=id;tpPaint()}],['Download',()=>tpDownload(t)],['Delete',()=>{TPS.del=id;tpPaint()}]]);return}
  if(e.target.closest('[data-del]')){tpDelete(id);return}
  if(e.target.closest('[data-keep]')){TPS.del=null;tpPaint();return}
  if(TPS.del===id||TPS.ren===id)return;tpPick(id)};
 ['tpg','tpy'].forEach(i=>{const g=$(i);g.addEventListener('click',onGrid);
  g.addEventListener('keydown',e=>{const t=e.target;
   if(t.matches&&t.matches('.tpc input')){e.stopPropagation();if(e.key=='Enter')t.blur();else if(e.key=='Escape'){TPS.ren=null;tpPaint()}return}
   if(t.classList&&t.classList.contains('tpc')&&(e.key=='Enter'||e.key==' ')){e.preventDefault();t.click()}});
  g.addEventListener('focusout',e=>{const t=e.target;if(!t.matches||!t.matches('.tpc input')||TPS.ren==null)return;const id=TPS.ren,v=t.value;TPS.ren=null;tpRename(id,v).then(()=>{TPS.list=tpIndex();tpPaint()})})});
 // arrow keys move between the cards
 tpD().addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||(e.target.matches&&e.target.matches('input')))return;const cs=[...tpD().querySelectorAll('.tpc')],i=cs.indexOf(document.activeElement);if(i<0)return;e.preventDefault();
  const step=e.key=='ArrowLeft'||e.key=='ArrowUp'?-1:1,j=Math.max(0,Math.min(cs.length-1,i+step));cs[j].focus()});
 $('tpadd').onclick=()=>$('tpfile').click();$('tpfile').onchange=()=>{const f=$('tpfile').files[0];$('tpfile').value='';if(f)tpAddFile(f)};
 // Escape closes whichever of the two dialogs is open (before the app's own Escape handling)
 document.addEventListener('keydown',e=>{if(e.key!='Escape')return;if(!tpSd().hidden){e.stopImmediatePropagation();e.preventDefault();tpSaveHide()}else if(tpIsOpen()&&!(e.target.matches&&e.target.matches('.tpc input'))&&!document.querySelector('.rowm')){e.stopImmediatePropagation();e.preventDefault();tpHide()}},true);
 $('tpsx').onclick=tpSaveHide;$('tpscx').onclick=tpSaveHide;tpSd().addEventListener('click',e=>{if(e.target===tpSd())tpSaveHide()});
 $('tpsn').addEventListener('input',()=>{$('tpsok').dataset.arm='';tpSaveLabel()});
 $('tpsn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Enter'){e.preventDefault();tpSave()}});
 $('tpsok').onclick=tpSave;
 // the picker opens when the app starts, so the first choice is what to start from (Settings > General can turn this off)
 let on=true;try{on=kv.get(TP_START)!=='0'}catch(e){}
 if(on)requestAnimationFrame(()=>{if(!tpIsOpen())tpShow()})}
export {init54};
