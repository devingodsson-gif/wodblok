import {$,WBS,WBX} from './01-launch-and-version.js';
import {M,N,rowMenu} from './04-canvas-and-stamp-outlines.js';
import {CATS} from './05-motif-data.js';
import {BF,REN,cust,fClean,fSave,lsel,mcSave,mk,pal,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {selSet} from './12-selection-and-split.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
// ===== Shape library: one list of folders, folders inside folders, multi-select and moving =====
// Your own folders and the built-in sets sit side by side in one list (A to Z, My imports first), and any of them can hold
// folders of its own. A folder is known by its path: "Florals/Roses" for your own, "b:Plants" for a built-in set (its
// original name, so renaming the set changes nothing) and "b:Plants/Mine" for a folder inside a set. A shape's folder is
// that path, kept in cust[k].g for your imports (projects already save it as a plain string, so nesting needs no new file
// format) and in BF[k] for a built-in shape added to a folder (it also stays in its own set). WBS.mcat is the open folder:
// "/" the list of all folders, "i" My imports, "d" Drawn by Claude (old projects only), "b:<set>" or "g:<path>".
const bOk=k=>/^b\d+$/.test(k)&&+k.slice(1)<M.length;
// The built-in sets sit in the same list as your own folders, and you can add your own folders to them.
const lbSet=n=>CATS.findIndex(c=>c.n==n);
const lbRoot=p=>p.startsWith('b:')&&!p.includes('/')&&lbSet(p.slice(2))>=0;
const lbPar=p=>{const i=p.lastIndexOf('/');return i<0?'':p.slice(0,i)};
const lbLeaf=p=>p.slice(p.lastIndexOf('/')+1);
const lbIn=(p,a)=>typeof p=='string'&&(p===a||p.startsWith(a+'/'));
const lbId=p=>!p?'/':lbRoot(p)?p:'g:'+p;
const lbName=v=>fClean(v).replace(/\//g,'').replace(/^b:/i,'').trim();
const lbSort=(a,b)=>a.n.localeCompare(b.n,undefined,{numeric:true,sensitivity:'base'});
const fOf=k=>k[0]=='b'?BF[k]:(cust[k]||{}).g;
const fSet=(k,g)=>{if(k[0]=='b'){if(g)BF[k]=g;else delete BF[k]}else if(cust[k]){if(g)cust[k].g=g;else delete cust[k].g}};
const mNm=k=>k[0]=='b'?N[+k.slice(1)]||'Shape':cust[k]?cust[k].n:'Shape';
let LBX=null,lbHidOpen=false,lbSig='';
// one pass over the library: every folder path, and which shapes each folder holds
function lbIndex(){const all=new Set(),by=new Map(),imp=[],drw=[],put=(g,k)=>{(by.get(g)||by.set(g,[]).get(g)).push(k)};
const add=p=>{if(typeof p!='string'||!p)return;const a=p.split('/');for(let i=1;i<=a.length;i++){if(!a[i-1])return;const q=a.slice(0,i).join('/');if(i==1&&lbRoot(q))continue;all.add(q)}};
WBS.FOLD.forEach(add);
Object.keys(cust).forEach(k=>{const v=cust[k];if(!v)return;if(v.g){add(v.g);put(v.g,k)}else if(k.startsWith('i|'))imp.push(k);else if(!k.startsWith('t|'))drw.push(k)});
Object.keys(BF).forEach(k=>{if(bOk(k)&&BF[k]){add(BF[k]);put(BF[k],k)}});
return{all,by,imp,drw}}
const lbX=()=>LBX||(LBX=lbIndex());
const lbDirty=()=>{LBX=null};
function lbNode(v){const X=lbX();if(typeof v!='string')return null;
if(v=='/')return{v,t:'r',n:'All folders',ks:[]};
if(v=='i')return{v,t:'u',n:'My imports',ks:X.imp};
if(v=='d')return{v,t:'u',n:'Drawn by Claude',ks:X.drw};
if(v.startsWith('b:')){const i=lbSet(v.slice(2));if(i<0)return null;const c=CATS[i],ex=X.by.get(v)||[];return{v,t:'b',n:REN[c.n]||c.n,orig:c.n,hid:WBS.HID.includes(c.n),g:v,p:v,ks:ex.length?[...new Set([...c.k,...ex])]:c.k}}
if(v.startsWith('g:')){const p=v.slice(2);if(!X.all.has(p))return null;return{v,t:'f',n:lbLeaf(p),g:p,p,ks:X.by.get(p)||[]}}
return null}
// the folders inside a folder, A to Z; at the top: your folders and the built-in sets together (hid: only the hidden sets)
function lbKids(nd,hid){const X=lbX();
const sets=()=>CATS.filter(c=>!WBS.HID.includes(c.n)).map(c=>lbNode('b:'+c.n));
if(nd.t=='r')return hid?CATS.filter(c=>WBS.HID.includes(c.n)).map(c=>lbNode('b:'+c.n)).sort(lbSort):[...[...X.all].filter(p=>!lbPar(p)).map(p=>lbNode('g:'+p)),...sets()].sort(lbSort);
if(nd.t!='f'&&nd.t!='b')return[];return[...[...X.all].filter(p=>lbPar(p)===nd.p).map(p=>lbNode('g:'+p))].sort(lbSort)}
// shapes in a folder and every folder inside it
function lbCount(nd){if(nd.t!='f'&&nd.t!='b')return nd.ks.length;const s=new Set(nd.ks);lbX().by.forEach((ks,g)=>{if(g!==nd.p&&lbIn(g,nd.p))ks.forEach(k=>s.add(k))});return s.size}
function lbCrumbs(nd){if(nd.t!='f'&&nd.t!='b')return nd.t=='r'?[]:[nd];const a=nd.p.split('/'),o=[];for(let i=1;i<=a.length;i++){const n=lbNode(lbId(a.slice(0,i).join('/')));if(n)o.push(n)}
return o}
// every folder in list order, named by its full path, for the "Move to" and "Save to" pickers
function lbTree(){const o=[{v:'i',n:'My imports',d:0}],walk=(nd,d,pre)=>{const n=pre?pre+' / '+nd.n:nd.n;o.push({v:nd.v,n,d});lbKids(nd).forEach(k=>walk(k,d+1,n))};lbKids(lbNode('/')).forEach(n=>walk(n,0,''));return o}
const lbOpts=(sel,skip)=>lbTree().filter(x=>!skip||!skip(x)).map(x=>`<option value="${hx(x.v)}"${x.v==sel?' selected':''}>${hx(x.n)}</option>`).join('');
function libCur(){let v=WBS.mcat;if(/^\d+$/.test(v||'')){const c=CATS[+v];v=c?'b:'+c.n:'/'}const c=lbNode(v)||lbNode('/');if(WBS.mcat!==c.v)WBS.mcat=c.v;return c}
// ---- for the import window: where new shapes go, how that folder is named, the folder picker, and making a folder
function libDest(){lbDirty();const c=libCur();return c.t=='f'||c.t=='b'?c.v:'i'}
function libG(v){lbDirty();const n=lbNode(v);return n&&(n.t=='f'||n.t=='b')?n.g:''}
function libPath(v){lbDirty();const n=lbNode(v);return n?(n.t=='r'?n.n:lbCrumbs(n).map(x=>x.n).join(' / ')):'My imports'}
function libOptions(sel){lbDirty();return lbOpts(sel)}
function libMk(parentV,name){lbDirty();const nm=lbName(name);if(!nm)return null;const pn=lbNode(parentV)||lbNode('/'),own=pn.t=='f'||pn.t=='b'?pn:lbNode('/');
const ex=lbKids(own).concat(own.t=='r'?lbKids(own,true):[]).find(x=>x.n.toLowerCase()==nm.toLowerCase());if(ex)return ex.v;
const p=own.t=='r'?nm:own.p+'/'+nm;if(!WBS.FOLD.includes(p))WBS.FOLD.push(p);fSave();lbDirty();return lbId(p)}
// for the export: what the open folder holds, as a flat list of folders, each named by its path. deep: the folders inside it too.
// At the top (all folders) it is the whole library, hidden sets included.
function libExportList(deep){lbDirty();const c=libCur(),out=[],top=c.t=='r',walk=(n,pre)=>{const p=[...pre,n.n];out.push({path:p,ks:n.ks});if(deep||top)lbKids(n).forEach(k=>walk(k,p))};
if(top)[lbNode('i'),...(lbX().drw.length?[lbNode('d')]:[]),...lbKids(c),...lbKids(c,true)].forEach(n=>walk(n,[]));else walk(c,[]);
return{root:top,name:c.n,folders:out,sub:!top&&lbKids(c).length>0}}
function libOpen(v){lbDirty();const n=lbNode(v)||lbNode('/');WBS.mcat=n.v;mcSave();lsel.clear();WBS.lanc=null;if(n.t=='r')WBS.lsm=false;closeF();renderLib(true)}
// a folder's path moves: everything inside it, and every shape filed there, follows
function lbRemap(p,np){const m=x=>lbIn(x,p)?np+x.slice(p.length):x;
WBS.FOLD=[...new Set(WBS.FOLD.map(m))];Object.values(cust).forEach(v=>{if(v&&v.g)v.g=m(v.g)});Object.keys(BF).forEach(k=>{BF[k]=m(BF[k])});
if(WBS.mcat.startsWith('g:'))WBS.mcat=lbId(m(WBS.mcat.slice(2)));mcSave();fSave();store();lbDirty()}
const IC={del:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7M10.2 11v5M13.8 11v5"/></svg>',
hide:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 5.7A8.6 8.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-2.9 3.7M6.3 7.6C3.6 9.3 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.3 4-.9"/><path d="M4 4l16 16"/></svg>',
fold:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5A2.5 2.5 0 016 5h3.2l2 2.5H18a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5H6A2.5 2.5 0 013.5 17z"/></svg>',
set:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6l4.4 7.4H7.6z"/><circle cx="7.6" cy="16.6" r="3.4"/><rect x="13" y="13.2" width="7" height="7" rx="1.2"/></svg>',
tray:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.8 13.5l2.3-6.8A1.8 1.8 0 017.8 5.5h8.4a1.8 1.8 0 011.7 1.2l2.3 6.8V18a1.5 1.5 0 01-1.5 1.5H5.3A1.5 1.5 0 013.8 18z"/><path d="M3.8 13.5h4.6l1.1 2.2h5l1.1-2.2h4.6"/></svg>',
pen:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5l.9-3.9L16 5a2.1 2.1 0 013 3L8.4 18.6z"/></svg>',
chev:'<svg class="lfa" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 7l5 5-5 5"/></svg>',
ck:'<svg viewBox="0 0 16 16"><path d="M4.3 8.4l2.4 2.4 5-5.3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
function renderLib(force){lbDirty();const c=libCur(),[pa,pb]=pal(),root=c.t=='r',own=c.t=='f'||c.t=='b';
// build() calls this on every change, so skip the work when nothing the library shows has changed
const sig=[c.v,WBS.lsm,[...lsel].join(','),WBS.brush&&!WBS.lsm?WBS.brush.m:'',pa,pb,lbHidOpen,WBS.fmode,JSON.stringify(REN),WBS.HID.join(','),WBS.FOLD.join('|'),JSON.stringify(BF),Object.keys(cust).map(k=>{const v=cust[k]||{};return k+'>'+(v.g||'')+(v.svg||'').length+(v.n||'')}).join(',')].join('#');
if(!force&&sig===lbSig)return;lbSig=sig;
// path bar, and where Import will put new shapes
$('lback').hidden=root;$('idest').textContent=own?lbCrumbs(c).map(x=>x.n).join(' / '):'My imports';
const cr=lbCrumbs(c);$('lcr').innerHTML=root?'<span class="lcc">All folders</span>':cr.map((n,i)=>i<cr.length-1?`<button type="button" class="lcb" data-f="${hx(n.v)}">${hx(n.n)}</button><i class="lcs">/</i>`:`<span class="lcc">${hx(n.n)}</span>`).join('');
$('fnew').disabled=c.t=='u';$('fsel').hidden=root;$('fsel').disabled=!c.ks.length&&!WBS.lsm;$('fsel').setAttribute('aria-pressed',String(WBS.lsm));$('fmore').hidden=!own;$('fexp').setAttribute('aria-label',root?'Export all shapes':'Export this folder');$('fexp').disabled=!root&&!lbCount(c);
// folders
const rows=root?[lbNode('i'),...(lbX().drw.length?[lbNode('d')]:[]),...lbKids(c)]:lbKids(c),hidL=root?lbKids(c,true):[];
const row=n=>`<button type="button" class="lfr${n.hid?' hid':''}" data-f="${hx(n.v)}"><span class="lfi">${n.t=='u'?(n.v=='i'?IC.tray:IC.pen):n.t=='b'?IC.set:IC.fold}</span><span class="lfn">${hx(n.n)}</span><span class="lfc">${lbCount(n)}</span>${IC.chev}</button>`;
$('lfold').innerHTML=rows.map(row).join('')+(hidL.length?`<button type="button" class="lfh" id="lhid" aria-expanded="${lbHidOpen}"><span class="lfi">${IC.hide}</span><span class="lfn">Hidden sets</span><span class="lfc">${hidL.length}</span>${IC.chev}</button>`+(lbHidOpen?hidL.map(row).join(''):''):'');
$('lfold').hidden=!rows.length&&!hidL.length;$('lfold').classList.toggle('sub',!root);
// shapes
[...lsel].forEach(k=>{if(!c.ks.includes(k))lsel.delete(k)});
const L=$('lib');L.hidden=root||!c.ks.length;L.classList.toggle('sel',WBS.lsm);
L.innerHTML=root?'':c.ks.map(k=>{const on=lsel.has(k),b=`<button data-m="${k}" class="${WBS.brush&&WBS.brush.m==k&&!WBS.lsm?'on':''}${on?' pk':''}" aria-label="${hx(mNm(k))}"><svg viewBox="-50 -50 100 100" style="background:${pa};border-radius:4px">${mk(k,pb,pa)}</svg></button>`;
return`<div>${b}${on?`<i class="ck">${IC.ck}</i>`:''}${k[0]=='b'||WBS.lsm?'':`<button class="dx" data-x="${k}" aria-label="Remove from library">&#215;</button>`}</div>`}).join('');
$('lem').hidden=root||!!c.ks.length||!!rows.length;$('lem').textContent=c.v=='i'?'No imports yet':'Empty folder';
// selection bar
const n=lsel.size;$('fsbar').hidden=!WBS.lsm||root;$('fscnt').textContent=n?`${n} selected`:'None selected';
$('fall').textContent=c.ks.length&&c.ks.every(k=>lsel.has(k))?'Select none':'Select all';
$('fmove').innerHTML='<option value="">Move to…</option>'+lbOpts('',x=>x.v==c.v)+'<option value="+">＋ New folder…</option>';$('fmove').disabled=!n;$('fmove').value='';
const rm=own?[...lsel].filter(k=>fOf(k)===c.g).length:0;$('fout').hidden=!own;$('fout').disabled=!rm;
const dm=$('fdelm'),cn=[...lsel].filter(k=>k[0]!='b').length;dm.disabled=!cn;if(!dm.dataset.sure)dm.textContent=cn?`Delete ${cn}`:'Delete'}
function libPick(k,e){if(!WBS.lsm){WBS.lsm=true;lsel.clear()}WBS.brush=null;const ks=libCur().ks;
if(e.shiftKey&&!WBS.lanc&&lsel.size==0&&ks.length)WBS.lanc=ks[0];
if(e.shiftKey&&WBS.lanc&&ks.includes(WBS.lanc)){const a=ks.indexOf(WBS.lanc),b=ks.indexOf(k);ks.slice(Math.min(a,b),Math.max(a,b)+1).forEach(x=>lsel.add(x))}else{lsel.has(k)?lsel.delete(k):lsel.add(k);WBS.lanc=k}upd()}
function libExit(){WBS.lsm=false;lsel.clear();WBS.lanc=null;closeF();upd()}
// the small form under the path bar: new folder, rename, move the folder, or confirm deleting it
function fOpen(mode){const c=libCur(),nm=$('fname'),ds=$('fdest');WBS.fmode=mode;$('fform').hidden=false;$('fform').dataset.m=mode;
nm.hidden=!['new','mv','ren'].includes(mode);ds.hidden=mode!='mvf';$('fq').hidden=mode!='del';
$('fok').textContent={new:'Create',mv:'Create and move',ren:'Rename',mvf:'Move',del:'Delete'}[mode];$('fok').classList.toggle('warn',mode=='del');
if(mode=='ren'){nm.value=c.n;nm.placeholder=c.t=='b'?c.orig:'Folder name'}else{nm.value='';nm.placeholder='Folder name'}
if(mode=='mvf')ds.innerHTML='<option value="/">All folders</option>'+lbOpts(lbId(lbPar(c.p)),x=>x.v=='i'||x.v==c.v||x.v.startsWith('g:')&&lbIn(x.v.slice(2),c.p));
if(mode=='del'){const sub=[...lbX().all].filter(p=>p!==c.p&&lbIn(p,c.p)).length;$('fq').textContent=`Delete “${c.n}”${sub?` and ${sub} folder${sub>1?'s':''} inside`:''}?`}
renderLib(true);const f=mode=='mvf'?ds:mode=='del'?$('fok'):nm;f.focus();if(f===nm)nm.select()}
function closeF(){WBS.fmode=null;$('fform').hidden=true}
function libMoveKeys(ks,t){const n=lbNode(t);if(!ks.length||!n||n.t=='r')return;const g=n.t=='f'||n.t=='b'?n.g:'';let nb=0;
ks.forEach(k=>{if(k[0]=='b'){if(n.t=='b'&&CATS[lbSet(n.orig)].k.includes(k)){delete BF[k];return}if(!g){delete BF[k];return}nb++}fSet(k,g||null)});
fSave();store();lsel.clear();WBS.lanc=null;lbDirty();upd();
pmsg(`Moved ${ks.length} shape${ks.length>1?'s':''} to “${libPath(t)}”.`+(nb?' Built-in shapes also stay in their own set.':''))}
const libMove=t=>libMoveKeys([...lsel],t);
function init21(){
WBX.wbLibOpen=libOpen;
$('lfold').onclick=e=>{if(e.target.closest('#lhid')){lbHidOpen=!lbHidOpen;renderLib(true);return}const b=e.target.closest('[data-f]');if(b)libOpen(b.dataset.f)};
$('lcr').onclick=e=>{const b=e.target.closest('[data-f]');if(b)libOpen(b.dataset.f)};
$('lback').onclick=()=>{const c=libCur();libOpen(c.t=='f'&&lbPar(c.p)?lbId(lbPar(c.p)):'/')};
// drop a shape dragged from the grid onto a folder (or a crumb of the path) to move it there
WBX.wbLibDrop=(k,el)=>{const f=el&&el.closest&&el.closest('#lfold [data-f],#lcr [data-f]');if(!f)return false;const t=f.dataset.f;if(t=='/'||t==libCur().v)return true;libMoveKeys(lsel.has(k)?[...lsel]:[k],t);return true};
WBX.wbLibOver=el=>{const f=el&&el.closest&&el.closest('#lfold [data-f],#lcr [data-f]');document.querySelectorAll('.lfr.dropt,.lcb.dropt').forEach(x=>{if(x!==f)x.classList.remove('dropt')});if(f)f.classList.add('dropt')};
$('fsel').onclick=()=>{if(WBS.lsm)libExit();else{WBS.lsm=true;WBS.brush=null;upd()}};
$('fdone').onclick=libExit;
$('fall').onclick=()=>{const ks=libCur().ks;if(ks.length&&ks.every(k=>lsel.has(k)))ks.forEach(k=>lsel.delete(k));else ks.forEach(k=>lsel.add(k));renderLib(true)};
$('fnew').onclick=()=>fOpen(WBS.lsm&&lsel.size?'mv':'new');
$('fmore').onclick=e=>{e.stopPropagation();const c=libCur();
rowMenu($('fmore'),c.t=='b'?[['Rename',()=>fOpen('ren')],['Reset name',()=>{delete REN[c.orig];fSave();renderLib(true);pmsg('Set name reset.')},!REN[c.orig]],[c.hid?'Show in the list':'Hide from the list',()=>{if(c.hid)WBS.HID=WBS.HID.filter(x=>x!=c.orig);else WBS.HID.push(c.orig);fSave();renderLib(true);pmsg(c.hid?`“${c.n}” is back in the list.`:`Hid “${c.n}”.`)}]]
:[['Rename',()=>fOpen('ren')],['Move to…',()=>fOpen('mvf')],['Delete folder',()=>fOpen('del')]])};
$('fcx').onclick=()=>{closeF();renderLib(true)};
$('fname').onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();$('fok').click()}else if(e.key=='Escape'){e.stopPropagation();$('fcx').click()}};
$('fdest').onkeydown=e=>{if(e.key=='Escape'){e.stopPropagation();$('fcx').click()}};
$('fok').onclick=()=>{const c=libCur(),mode=WBS.fmode,v=lbName($('fname').value);
if(mode=='del'){if(c.t!='f')return;const p=c.p;let back=0;Object.values(cust).forEach(x=>{if(x&&lbIn(x.g,p)){delete x.g;back++}});Object.keys(BF).forEach(k=>{if(lbIn(BF[k],p))delete BF[k]});WBS.FOLD=WBS.FOLD.filter(x=>!lbIn(x,p));fSave();store();closeF();libOpen(lbId(lbPar(p)));upd();
pmsg(`Deleted the folder “${c.n}”.`+(back?` Its imported shapes went back to My imports.`:''));return}
if(mode=='mvf'){if(c.t!='f')return;const t=$('fdest').value,tn=lbNode(t);if(!tn)return;const np=(tn.t=='r'?'':tn.p+'/')+lbLeaf(c.p);closeF();if(np!==c.p&&!lbIn(tn.p||'',c.p)){lbRemap(c.p,np);upd()}else renderLib(true);pmsg(`Moved “${c.n}” to “${libPath(t)}”.`);return}
if(mode=='ren'&&c.t=='b'){const r=fClean($('fname').value);if(!r||r==c.orig)delete REN[c.orig];else REN[c.orig]=r;fSave();closeF();renderLib(true);pmsg(r&&r!=c.orig?`Renamed the set to “${r}”.`:'Set name reset.');return}
if(!v){$('fname').focus();return}
if(mode=='ren'){if(c.t!='f')return;const np=(lbPar(c.p)?lbPar(c.p)+'/':'')+v;closeF();if(np===c.p){renderLib(true);return}const merge=lbX().all.has(np);lbRemap(c.p,np);upd();pmsg(merge?`Merged “${c.n}” into “${v}”.`:`Renamed the folder to “${v}”.`);return}
if(mode=='mv'){const t=libMk('/',v);closeF();if(t)libMove(t);return}
const t=libMk(c.t=='u'?'/':c.v,v);if(t){libOpen(t);pmsg(`Made the folder “${libPath(t)}”.`)}};
$('fmove').oninput=()=>{const v=$('fmove').value;if(!v)return;if(v=='+'){$('fmove').value='';fOpen('mv');return}libMove(v)};
$('fout').onclick=()=>{const c=libCur(),ks=[...lsel].filter(k=>fOf(k)===c.g);if(!ks.length)return;ks.forEach(k=>fSet(k,null));fSave();store();lsel.clear();lbDirty();upd();pmsg(`Took ${ks.length} shape${ks.length>1?'s':''} out of “${c.n}”.`)};
$('fdelm').onclick=()=>{const dm=$('fdelm'),ks=[...lsel].filter(k=>k[0]!='b'),usedK=new Set(WBS.tiles.flatMap(t=>t.items.map(q=>q.m))),ok=ks.filter(k=>!usedK.has(k));if(!ks.length)return;
if(!ok.length){pmsg('Those shapes are used on your stamps. Remove them from the stamps first.');return}
if(!dm.dataset.sure){dm.dataset.sure=1;dm.textContent='Click to confirm';setTimeout(()=>{if(dm.dataset.sure){delete dm.dataset.sure;renderLib(true)}},3000);return}
delete dm.dataset.sure;ok.forEach(k=>{delete cust[k];lsel.delete(k)});store();lbDirty();upd();pmsg(`Deleted ${ok.length} shape${ok.length>1?'s':''} from the library.`+(ok.length<ks.length?` ${ks.length-ok.length} in use on your stamps were kept.`:''))};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()=='a'&&!$('boardS').hidden&&!(e.target.matches&&e.target.matches('input,textarea,select,[contenteditable]'))){const n=WBS.tiles[WBS.cur].items.length;if(!n)return;e.preventDefault();selSet([...Array(n).keys()],false);upd();pmsg(`Selected all ${n} shape${n>1?'s':''} on this stamp.`)}});
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&WBS.lsm&&!(e.target.matches&&e.target.matches('input,textarea,select')))libExit()});
}
export {libDest,libExportList,libG,libMk,libOpen,libOptions,libPath,libPick,mNm,renderLib,init21};
