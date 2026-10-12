import {$,WBS} from './01-launch-and-version.js';
import {M,N} from './04-canvas-and-stamp-outlines.js';
import {CATS} from './05-motif-data.js';
import {BF,REN,cust,fClean,fSave,lsel,mcSave,mk,pal,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {selSet} from './12-selection-and-split.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
// ===== Motif library: folders, renaming, hiding sets, multi-select and moving =====
const fAll=()=>{const o=[...WBS.FOLD];Object.values(cust).forEach(v=>{if(v&&v.g&&!o.includes(v.g))o.push(v.g)});Object.values(BF).forEach(g=>{if(!o.includes(g))o.push(g)});return o};
const bOk=k=>/^b\d+$/.test(k)&&+k.slice(1)<M.length;
const fKeys=g=>[...Object.keys(cust).filter(k=>cust[k].g==g),...Object.keys(BF).filter(k=>BF[k]==g&&bOk(k))];
const fOf=k=>k[0]=='b'?BF[k]:(cust[k]||{}).g;
const fSet=(k,g)=>{if(k[0]=='b'){if(g)BF[k]=g;else delete BF[k]}else if(cust[k]){if(g)cust[k].g=g;else delete cust[k].g}};
const mNm=k=>k[0]=='b'?N[+k.slice(1)]||'Motif':cust[k]?cust[k].n:'Motif';
function libCats(){const ck=Object.keys(cust).filter(k=>!k.startsWith('i|')&&!k.startsWith('t|')&&!cust[k].g),ik=Object.keys(cust).filter(k=>k.startsWith('i|')&&!cust[k].g),o=[];
fAll().forEach(g=>o.push({v:'g:'+g,n:g,ks:fKeys(g),t:'f'}));
// the "Drawn by Claude" folder only shows when it holds something (an old project's drawings); new work is imported by the user
if(ck.length||WBS.mcat=='d')o.push({v:'d',n:'Drawn by Claude',ks:ck,t:'u'});o.push({v:'i',n:'My imports',ks:ik,t:'u'});
CATS.forEach((c,i)=>o.push({v:String(i),n:REN[c.n]||c.n,ks:c.k,t:'b',hid:WBS.HID.includes(c.n),orig:c.n}));return o}
const libCur=()=>{const L=libCats();let c=L.find(x=>x.v==WBS.mcat);if(!c){c=L.find(x=>x.t=='b'&&!x.hid)||L.find(x=>x.v=='i');WBS.mcat=c.v}return c};
const IC={del:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7M10.2 11v5M13.8 11v5"/></svg>',
hide:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 5.7A8.6 8.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-2.9 3.7M6.3 7.6C3.6 9.3 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.3 4-.9"/><path d="M4 4l16 16"/></svg>',
show:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
ck:'<svg viewBox="0 0 16 16"><path d="M4.3 8.4l2.4 2.4 5-5.3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
function renderLib(){const[pa,pb]=pal(),L=libCats(),c=libCur(),opt=x=>`<option value="${hx(x.v)}">${hx(x.n)} (${x.ks.length})</option>`,F=L.filter(x=>x.t=='f'),hid=L.filter(x=>x.hid);
$('mcat').innerHTML=(F.length?`<optgroup label="My folders">${F.map(opt).join('')}</optgroup>`:'')+`<optgroup label="My motifs">${L.filter(x=>x.t=='u').map(opt).join('')}</optgroup><optgroup label="Built-in sets">${L.filter(x=>x.t=='b'&&!x.hid).map(opt).join('')}</optgroup>`+(hid.length?`<optgroup label="Hidden sets">${hid.map(opt).join('')}</optgroup>`:'');
$('mcat').value=c.v;$('fdl').innerHTML=fAll().map(g=>`<option value="${hx(g)}">`).join('');
const fr=$('fren'),fd=$('fdel');fr.disabled=c.t=='u';fr.title=c.t=='b'?'Rename this set':'Rename this folder';
if(c.t=='b'){fd.disabled=false;fd.innerHTML=c.hid?IC.show:IC.hide;fd.title=c.hid?'Show this set again':'Hide this set from the list';delete fd.dataset.sure}
else{fd.disabled=c.t!='f';if(!fd.dataset.sure)fd.innerHTML=IC.del;fd.title='Delete this folder (its motifs are kept)'}
$('fsel').setAttribute('aria-pressed',String(WBS.lsm));
const all=new Set(L.flatMap(x=>x.ks));[...lsel].forEach(k=>{if(!all.has(k))lsel.delete(k)});
$('lib').classList.toggle('sel',WBS.lsm);
$('lib').innerHTML=c.ks.length?c.ks.map(k=>{const on=lsel.has(k),f=fOf(k),b=`<button data-m="${k}" class="${WBS.brush&&WBS.brush.m==k&&!WBS.lsm?'on':''}${on?' pk':''}" title="${hx(mNm(k))}${f&&c.t!='f'?' · in '+hx(f):''}"><svg viewBox="-50 -50 100 100" style="background:${pa};border-radius:4px">${mk(k,pb,pa)}</svg></button>`;
return`<div>${b}${on?`<i class="ck">${IC.ck}</i>`:''}${k[0]=='b'||WBS.lsm?'':`<button class="dx" data-x="${k}" title="Remove from library" aria-label="Remove from library">&#215;</button>`}</div>`}).join('')
:`<div class="em">${c.t=='f'?'This folder is empty. Open any other folder or set, select motifs (check-box button, or Ctrl/&#8984;-click), then choose Move to folder.':c.v=='i'?'No unsorted imports. Use Import artwork below.':c.v=='d'?'Nothing here yet. Use Draw below to have Claude make some.':'Nothing here.'}</div>`;
// selection bar
const n=lsel.size;$('fsbar').hidden=!WBS.lsm;$('fscnt').textContent=n?`${n} selected`:'None selected';
$('fall').textContent=c.ks.length&&c.ks.every(k=>lsel.has(k))?'Select none':'Select all';
const tg=fAll().filter(g=>c.v!='g:'+g);$('fmove').innerHTML=`<option value="">${n?'Move to folder…':'Select motifs to move'}</option>`+tg.map(g=>`<option value="g:${hx(g)}">${hx(g)}</option>`).join('')+'<option value="+">＋ New folder…</option>';$('fmove').disabled=!n;$('fmove').value='';
const fo=$('fout');fo.hidden=c.t!='f';fo.disabled=!n;const dm=$('fdelm'),cn=[...lsel].filter(k=>k[0]!='b').length;dm.disabled=!cn;if(!dm.dataset.sure)dm.textContent=cn?`Delete ${cn}`:'Delete'}
function libPick(k,e){if(!WBS.lsm){WBS.lsm=true;lsel.clear()}WBS.brush=null;const ks=libCur().ks;
if(e.shiftKey&&!WBS.lanc&&lsel.size==0&&ks.length)WBS.lanc=ks[0];
if(e.shiftKey&&WBS.lanc&&ks.includes(WBS.lanc)){const a=ks.indexOf(WBS.lanc),b=ks.indexOf(k);ks.slice(Math.min(a,b),Math.max(a,b)+1).forEach(x=>lsel.add(x))}else{lsel.has(k)?lsel.delete(k):lsel.add(k);WBS.lanc=k}upd()}
function libExit(){WBS.lsm=false;lsel.clear();WBS.lanc=null;closeF();upd()}
function fOpen(mode){WBS.fmode=mode;const c=libCur();$('fform').hidden=false;$('fname').value=mode=='ren'?c.n:'';$('fname').placeholder=mode=='ren'&&c.t=='b'?c.orig:'Folder name';$('fok').textContent=mode=='ren'?'Rename':mode=='mv'?'Create and move':'Create';$('fname').focus();$('fname').select()}
function closeF(){WBS.fmode=null;$('fform').hidden=true}
function libMove(g){const ks=[...lsel];if(!ks.length)return;const nb=ks.filter(k=>k[0]=='b').length;ks.forEach(k=>fSet(k,g));if(!WBS.FOLD.includes(g))WBS.FOLD.push(g);fSave();store();lsel.clear();WBS.lanc=null;upd();
$('pmsg').textContent=`Moved ${ks.length} motif${ks.length>1?'s':''} to “${g}”.`+(nb?` Built-in motifs also stay in their own set.`:'')}
function init21(){
$('mcat').oninput=()=>{WBS.mcat=$('mcat').value;mcSave();lsel.clear();WBS.lanc=null;closeF();renderLib()};
$('fsel').onclick=()=>{if(WBS.lsm)libExit();else{WBS.lsm=true;WBS.brush=null;upd()}};
$('fdone').onclick=libExit;
$('fall').onclick=()=>{const ks=libCur().ks;if(ks.length&&ks.every(k=>lsel.has(k)))ks.forEach(k=>lsel.delete(k));else ks.forEach(k=>lsel.add(k));renderLib()};
$('fnew').onclick=()=>fOpen(WBS.lsm&&lsel.size?'mv':'new');
$('fren').onclick=()=>fOpen('ren');
$('fcx').onclick=closeF;
$('fname').onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();$('fok').click()}else if(e.key=='Escape'){e.stopPropagation();closeF()}};
$('fok').onclick=()=>{const v=fClean($('fname').value),c=libCur();
if(WBS.fmode=='ren'&&c.t=='b'){if(!v||v==c.orig)delete REN[c.orig];else REN[c.orig]=v;fSave();closeF();renderLib();$('pmsg').textContent=v&&v!=c.orig?`Renamed the set to “${v}”.`:'Set name reset.';return}
if(!v){$('fname').focus();return}
if(WBS.fmode=='ren'){const old=c.n;if(v==old){closeF();return}const merge=fAll().includes(v);fKeys(old).forEach(k=>fSet(k,v));WBS.FOLD=WBS.FOLD.filter(x=>x!=old);if(!WBS.FOLD.includes(v)){const i=fAll().indexOf(old);WBS.FOLD.push(v)}WBS.mcat='g:'+v;mcSave();fSave();store();closeF();upd();$('pmsg').textContent=merge?`Merged “${old}” into “${v}”.`:`Renamed the folder to “${v}”.`;return}
if(!WBS.FOLD.includes(v)&&!fAll().includes(v))WBS.FOLD.push(v);fSave();const mv=WBS.fmode=='mv';closeF();
if(mv)libMove(v);else{WBS.mcat='g:'+v;mcSave();renderLib();$('pmsg').textContent=`Made the folder “${v}”. Select motifs anywhere and move them in.`}};
$('fdel').onclick=()=>{const c=libCur(),fd=$('fdel');
if(c.t=='b'){if(c.hid)WBS.HID=WBS.HID.filter(x=>x!=c.orig);else WBS.HID.push(c.orig);fSave();renderLib();$('pmsg').textContent=c.hid?`“${c.n}” is back in the list.`:`Hid “${c.n}”. You'll find it under Hidden sets at the bottom of the list.`;return}
if(c.t!='f')return;if(!fd.dataset.sure){fd.dataset.sure=1;fd.innerHTML='<b style="font-size:13px">?</b>';fd.title='Click again to delete the folder';$('pmsg').textContent=`Click again to delete “${c.n}”. Its motifs are kept.`;setTimeout(()=>{if(fd.dataset.sure){delete fd.dataset.sure;renderLib()}},3000);return}
delete fd.dataset.sure;const ks=fKeys(c.n);ks.forEach(k=>fSet(k,null));WBS.FOLD=WBS.FOLD.filter(x=>x!=c.n);fSave();store();WBS.mcat='i';mcSave();lsel.clear();upd();
$('pmsg').textContent=`Deleted the folder “${c.n}”.`+(ks.some(k=>k[0]!='b')?' Its imports went back to My imports and drawings back to Drawn by Claude.':'')};
$('fmove').oninput=()=>{const v=$('fmove').value;if(!v)return;if(v=='+'){$('fmove').value='';fOpen('mv');return}libMove(v.slice(2))};
$('fout').onclick=()=>{const c=libCur(),ks=[...lsel];if(c.t!='f'||!ks.length)return;ks.forEach(k=>fSet(k,null));fSave();store();lsel.clear();upd();$('pmsg').textContent=`Took ${ks.length} motif${ks.length>1?'s':''} out of “${c.n}”.`};
$('fdelm').onclick=()=>{const dm=$('fdelm'),ks=[...lsel].filter(k=>k[0]!='b'),usedK=new Set(WBS.tiles.flatMap(t=>t.items.map(q=>q.m))),ok=ks.filter(k=>!usedK.has(k));if(!ks.length)return;
if(!ok.length){$('pmsg').textContent='Those motifs are used on your stamps. Remove them from the stamps first.';return}
if(!dm.dataset.sure){dm.dataset.sure=1;dm.textContent='Click to confirm';setTimeout(()=>{if(dm.dataset.sure){delete dm.dataset.sure;renderLib()}},3000);return}
delete dm.dataset.sure;ok.forEach(k=>{delete cust[k];lsel.delete(k)});store();upd();$('pmsg').textContent=`Deleted ${ok.length} motif${ok.length>1?'s':''} from the library.`+(ok.length<ks.length?` ${ks.length-ok.length} in use on your stamps were kept.`:'')};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()=='a'&&!$('boardS').hidden&&!(e.target.matches&&e.target.matches('input,textarea,select,[contenteditable]'))){const n=WBS.tiles[WBS.cur].items.length;if(!n)return;e.preventDefault();selSet([...Array(n).keys()],false);upd();pmsg(`Selected all ${n} motif${n>1?'s':''} on this stamp.`)}});
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&WBS.lsm&&!(e.target.matches&&e.target.matches('input,textarea,select')))libExit()});
}
export {libPick,renderLib,init21,libCats,libCur,mNm};
