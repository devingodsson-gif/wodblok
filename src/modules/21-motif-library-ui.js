import {ICN} from './00-icons.js';
import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {M,N,rowMenu} from './04-canvas-and-stamp-outlines.js';
import {CATS} from './05-motif-data.js';
import {BF,REN,cust,fClean,fSave,lsel,mcSave,mk,pal,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
// ===== Shape library: one list of folders, folders inside folders, multi-select and moving =====
// Your own folders and the built-in sets sit side by side in one list (A to Z, Yours first), and any of them can hold
// folders of its own. A folder is known by its path: "Florals/Roses" for your own, "b:Plants" for a built-in set (its
// original name, so renaming the set changes nothing) and "b:Plants/Mine" for a folder inside a set. A shape's folder is
// that path, kept in cust[k].g for your imports (projects already save it as a plain string, so nesting needs no new file
// format) and in BF[k] for a built-in shape added to a folder (it also stays in its own set). WBS.mcat is the active folder:
// "/" none, "i" Yours, "d" Drawn by Claude (old projects only), "b:<set>" or "g:<path>".
const bOk=k=>/^b\d+$/.test(k)&&+k.slice(1)<M.length;
// The built-in sets sit in the same list as your own folders, and you can add your own folders to them.
const lbSet=n=>CATS.findIndex(c=>c.n==n);
const lbRoot=p=>p.startsWith('b:')&&!p.includes('/')&&lbSet(p.slice(2))>=0;
const lbPar=p=>{const i=p.lastIndexOf('/');return i<0?'':p.slice(0,i)};
const lbLeaf=p=>p.slice(p.lastIndexOf('/')+1);
const lbIn=(p,a)=>typeof p=='string'&&(p===a||p.startsWith(a+'/'));
const lbId=p=>!p?'/':lbRoot(p)?p:'g:'+p;
const lbName=v=>fClean(v).replace(/\//g,'').replace(/^b:/i,'').trim();
const lbBasicTop=n=>n&&n.t=='b'&&n.orig=='Basic shapes'?1:0;   // 2.31.0: the Basic shapes set comes first
const lbSort=(a,b)=>(lbBasicTop(b)-lbBasicTop(a))||a.n.localeCompare(b.n,undefined,{numeric:true,sensitivity:'base'});
const fOf=k=>k[0]=='b'?BF[k]:(cust[k]||{}).g;
const fSet=(k,g)=>{if(k[0]=='b'){if(g)BF[k]=g;else delete BF[k]}else if(cust[k]){if(g)cust[k].g=g;else delete cust[k].g}};
const mNm=k=>k[0]=='b'?N[+k.slice(1)]||'Shape':cust[k]?cust[k].n:'Shape';
// The library is one tree: click a folder to open it in place (its folders, then its shapes, under it) and as many folders as you
// like can be open at once. lbOpen: the open folders (kept between sessions). WBS.mcat is the active folder (the last one opened,
// or the one whose menu was used): new folders, imports and the folder form go there; "/" when none is.
let LBX=null,lbHidOpen=false,lbSig='',lbBr='',lbScroll=null;const lbOpen=new Set();
const loSave=()=>{try{kv.set('wb150_lopen',JSON.stringify([...lbOpen]))}catch(e){}};
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
if(v=='i')return{v,t:'u',n:'Yours',ks:X.imp};
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
function lbTree(){const o=[{v:'i',n:'Yours',d:0}],walk=(nd,d,pre)=>{const n=pre?pre+' / '+nd.n:nd.n;o.push({v:nd.v,n,d});lbKids(nd).forEach(k=>walk(k,d+1,n))};lbKids(lbNode('/')).forEach(n=>walk(n,0,''));return o}
const lbOpts=(sel,skip)=>lbTree().filter(x=>!skip||!skip(x)).map(x=>`<option value="${hx(x.v)}"${x.v==sel?' selected':''}>${hx(x.n)}</option>`).join('');
// for Randomize: every folder in list order (v: its id, n: its name, d: how deep, c: shapes inside it and its folders, ks: the shapes it holds itself)
function libRz(){lbDirty();return lbTree().map(x=>{const nd=lbNode(x.v);return{v:x.v,n:nd?nd.n:x.n,d:x.d,c:nd?lbCount(nd):0,ks:nd?nd.ks.slice():[]}})}
function libCur(){let v=WBS.mcat;if(/^\d+$/.test(v||'')){const c=CATS[+v];v=c?'b:'+c.n:'/'}const c=lbNode(v)||lbNode('/');if(WBS.mcat!==c.v)WBS.mcat=c.v;return c}
// ---- for the import window: where new shapes go, how that folder is named, the folder picker, and making a folder
function libDest(){lbDirty();const c=libCur();return c.t=='f'||c.t=='b'?c.v:'i'}
function libG(v){lbDirty();const n=lbNode(v);return n&&(n.t=='f'||n.t=='b')?n.g:''}
function libPath(v){lbDirty();const n=lbNode(v);return n?(n.t=='r'?n.n:lbCrumbs(n).map(x=>x.n).join(' / ')):'Yours'}
function libOptions(sel){lbDirty();return lbOpts(sel)}
function libMk(parentV,name){lbDirty();const nm=lbName(name);if(!nm)return null;const pn=lbNode(parentV)||lbNode('/'),own=pn.t=='f'||pn.t=='b'?pn:lbNode('/');
const ex=lbKids(own).concat(own.t=='r'?lbKids(own,true):[]).find(x=>x.n.toLowerCase()==nm.toLowerCase());if(ex)return ex.v;
const p=own.t=='r'?nm:own.p+'/'+nm;if(!WBS.FOLD.includes(p))WBS.FOLD.push(p);fSave();lbDirty();return lbId(p)}
// for the export: what the open folder holds, as a flat list of folders, each named by its path. deep: the folders inside it too.
// At the top (all folders) it is the whole library, hidden sets included.
function libExportList(deep,v){lbDirty();const c=v?lbNode(v)||lbNode('/'):libCur(),out=[],top=c.t=='r',walk=(n,pre)=>{const p=[...pre,n.n];out.push({path:p,ks:n.ks});if(deep||top)lbKids(n).forEach(k=>walk(k,p))};
if(top)[lbNode('i'),...(lbX().drw.length?[lbNode('d')]:[]),...lbKids(c),...lbKids(c,true)].forEach(n=>walk(n,[]));else walk(c,[]);
return{root:top,name:c.n,folders:out,sub:!top&&lbKids(c).length>0}}
function libOpen(v){lbDirty();const n=lbNode(v)||lbNode('/');WBS.mcat=n.v;mcSave();if(n.t!='r'){lbCrumbs(n).forEach(x=>lbOpen.add(x.v));loSave();lbScroll=n.v}lsel.clear();WBS.lanc=null;if(n.t=='r')WBS.lsm=false;closeF();renderLib(true)}
// a folder's path moves: everything inside it, and every shape filed there, follows
function lbRemap(p,np){const m=x=>lbIn(x,p)?np+x.slice(p.length):x;
WBS.FOLD=[...new Set(WBS.FOLD.map(m))];Object.values(cust).forEach(v=>{if(v&&v.g)v.g=m(v.g)});Object.keys(BF).forEach(k=>{BF[k]=m(BF[k])});
if(WBS.mcat.startsWith('g:'))WBS.mcat=lbId(m(WBS.mcat.slice(2)));const lo=[...lbOpen];lbOpen.clear();lo.forEach(v=>lbOpen.add(v.startsWith('g:')?lbId(m(v.slice(2))):v));loSave();mcSave();fSave();store();lbDirty()}
const IC={del:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.trash+'</svg>',
hide:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.eyeOff+'</svg>',
fold:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.folder+'</svg>',
set:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.motif+'</svg>',
tray:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.tray+'</svg>',
pen:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.pencil+'</svg>',
chev:'<svg class="lfa" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.chevR+'</svg>',
ck:'<svg viewBox="0 0 16 16"><path d="M4.3 8.4l2.4 2.4 5-5.3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
const IC2={foldo:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.folderOpen+'</svg>',
more:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round">'+ICN.more+'</svg>'};
// the folders at the top of the tree: Yours, Drawn by Claude (old projects only), then your folders and the sets, A to Z
const lbTop=()=>[lbNode('i'),...(lbX().drw.length?[lbNode('d')]:[]),...lbKids(lbNode('/'))];
const lbVis=()=>[...new Set([...$('lib').querySelectorAll('button[data-m]')].map(b=>b.dataset.m))];
function renderLib(force){lbDirty();const c=libCur(),[pa,pb]=pal(),L=$('lib'),F=$('fform');
[...lbOpen].forEach(v=>{if(!lbNode(v))lbOpen.delete(v)});
// build() calls this on every change, so skip the work when nothing the library shows has changed; a new brush only moves a highlight
const br=WBS.brush&&!WBS.lsm?WBS.brush.m:'';
const LQ=($('lq')?$('lq').value:'').trim().toLowerCase();
const sig=[LQ,c.v,WBS.lsm,[...lsel].join(','),pa,pb,lbHidOpen,[...lbOpen].join('|'),WBS.fmode,JSON.stringify(REN),WBS.HID.join(','),WBS.FOLD.join('|'),JSON.stringify(BF),Object.keys(cust).map(k=>{const v=cust[k]||{};return k+'>'+(v.g||'')+(v.svg||'').length+(v.n||'')}).join(',')].join('#');
if(!force&&sig===lbSig){if(br!==lbBr){lbBr=br;L.querySelectorAll('button[data-m].on').forEach(b=>b.classList.remove('on'));if(br)L.querySelectorAll(`button[data-m="${br}"]`).forEach(b=>b.classList.add('on'))}return}
lbSig=sig;lbBr=br;
const tile=k=>{const on=lsel.has(k),b=`<button data-m="${k}" class="${br==k?'on':''}${on?' pk':''}" aria-label="${hx(mNm(k))}"><svg viewBox="-50 -50 100 100" style="background:${pa};border-radius:var(--r-s)">${mk(k,pb,pa)}</svg></button>`;
return`<div>${b}${on?`<i class="ck">${IC.ck}</i>`:''}${k[0]=='b'||WBS.lsm?'':`<button class="dx" data-x="${k}" aria-label="Remove from library">&#215;</button>`}</div>`};
const out=[],vis=new Set();
const walk=(n,d)=>{const open=lbOpen.has(n.v),kids=open?lbKids(n):[];
out.push(`<div class="lrw${n.v===c.v?' act':''}${n.hid?' hid':''}" style="--d:${d}"><button type="button" class="lfr" data-f="${hx(n.v)}" aria-expanded="${open}">${IC.chev}<span class="lfi">${n.t=='u'?(n.v=='i'?IC.tray:IC.pen):open?IC2.foldo:IC.fold}</span><span class="lfn">${hx(n.n)}</span><span class="lfc">${lbCount(n)}</span></button><button type="button" class="lmo" data-fm="${hx(n.v)}" data-more aria-haspopup="menu" aria-label="Folder options">${IC2.more}</button></div>`);
if(!open)return;kids.forEach(x=>walk(x,d+1));
if(n.ks.length){n.ks.forEach(k=>vis.add(k));out.push(`<div class="lib${WBS.lsm?' sel':''}" style="--d:${d+1}">${n.ks.map(tile).join('')}</div>`)}
else if(!kids.length)out.push(`<div class="lmt" style="--d:${d+1}">${n.v=='i'?'No imports yet':'Empty folder'}</div>`)};
if(LQ){const seen=new Set(),all=[],col=n=>{n.ks.forEach(k=>{if(!seen.has(k)){seen.add(k);all.push(k)}});lbKids(n).forEach(col)};   // a search lists the matches from every folder in one grid (2.22.0)
 lbTop().forEach(col);const hit=all.filter(k=>mNm(k).toLowerCase().includes(LQ));hit.forEach(k=>vis.add(k));
 out.push(hit.length?`<div class="lib${WBS.lsm?' sel':''}" style="--d:0">${hit.map(tile).join('')}</div>`:'<div class="lmt" style="--d:0">No shapes found</div>')}
else lbTop().forEach(n=>walk(n,0));
const hidL=LQ?[]:lbKids(lbNode('/'),true);
if(hidL.length){out.push(`<div class="lrw" style="--d:0"><button type="button" class="lfr lfh" id="lhid" aria-expanded="${lbHidOpen}">${IC.chev}<span class="lfi">${IC.hide}</span><span class="lfn">Hidden sets</span><span class="lfc">${hidL.length}</span></button></div>`);if(lbHidOpen)hidL.forEach(n=>walk(n,1))}
// the folder form (new folder, rename, move, delete) sits under the active folder
if(L.contains(F))L.before(F);
L.innerHTML=out.join('');
if(WBS.fmode){const a=WBS.fmode!='mv'&&L.querySelector('.lrw.act');if(a){a.after(F);F.style.setProperty('--d',+a.style.getPropertyValue('--d')+1)}else{L.prepend(F);F.style.setProperty('--d',0)}}
if(lbScroll){const r=L.querySelector(`.lrw.act`);lbScroll=null;if(r&&r.scrollIntoView)r.scrollIntoView({block:'nearest'})}
// toolbar
const any=lbOpen.size>0;$('ltog').setAttribute('aria-label',any?'Collapse all folders':'Expand all folders');$('ltog').classList.toggle('on',any);
$('fsel').setAttribute('aria-pressed',String(WBS.lsm));$('fsel').disabled=!vis.size&&!WBS.lsm;
// selection bar: only shapes you can see stay selected
[...lsel].forEach(k=>{if(!vis.has(k))lsel.delete(k)});
const n=lsel.size;$('fsbar').hidden=!WBS.lsm;$('fscnt').textContent=n?`${n} selected`:'None selected';
$('fall').textContent=vis.size&&[...vis].every(k=>lsel.has(k))?'Select none':'Select all';
$('fmove').innerHTML='<option value="">Move to…</option>'+lbOpts('')+'<option value="+">＋ New folder…</option>';$('fmove').disabled=!n;$('fmove').value='';
const rm=[...lsel].filter(k=>fOf(k)).length;$('fout').disabled=!rm;
const dm=$('fdelm'),cn=[...lsel].filter(k=>k[0]!='b').length;dm.disabled=!cn;if(!dm.dataset.sure)dm.textContent=cn?`Delete ${cn}`:'Delete'}
function libPick(k,e){if(!WBS.lsm){WBS.lsm=true;lsel.clear()}WBS.brush=null;const ks=lbVis();
if(e.shiftKey&&!WBS.lanc&&lsel.size==0&&ks.length)WBS.lanc=ks[0];
if(e.shiftKey&&WBS.lanc&&ks.includes(WBS.lanc)){const a=ks.indexOf(WBS.lanc),b=ks.indexOf(k);ks.slice(Math.min(a,b),Math.max(a,b)+1).forEach(x=>lsel.add(x))}else{lsel.has(k)?lsel.delete(k):lsel.add(k);WBS.lanc=k}upd()}
function libExit(){WBS.lsm=false;lsel.clear();WBS.lanc=null;closeF();upd()}
// open or close a folder in place; opening makes it the active folder, closing hands that to the folder above it
function lbToggle(v){const n=lbNode(v);if(!n)return;const fo=document.activeElement,hadF=!!(fo&&fo.closest&&fo.closest('#lib .lfr'));
if(lbOpen.has(v)){lbOpen.delete(v);const c=libCur();if(c.v===v||n.p&&c.p&&lbIn(c.p,n.p)){WBS.mcat=n.p?lbId(lbPar(n.p)):'/';mcSave()}}
else{lbOpen.add(v);WBS.mcat=v;mcSave()}
loSave();closeF();renderLib(true);if(hadF){const r=$('lib').querySelector(`.lfr[data-f="${CSS.escape(v)}"]`);if(r)r.focus({preventScroll:true})}}
function lbAll(){if(lbOpen.size){lbOpen.clear();WBS.mcat='/';mcSave()}else{const w=n=>{lbOpen.add(n.v);lbKids(n).forEach(w)};lbTop().forEach(w);if(lbHidOpen)lbKids(lbNode('/'),true).forEach(w)}
loSave();closeF();renderLib(true)}
// the small form under the active folder: new folder, rename, move the folder, or confirm deleting it
function fOpen(mode){const c=libCur(),nm=$('fname'),ds=$('fdest');WBS.fmode=mode;$('fform').hidden=false;$('fform').dataset.m=mode;
nm.hidden=!['new','mv','ren'].includes(mode);ds.hidden=mode!='mvf';$('fq').hidden=mode!='del';
$('fok').textContent={new:'Create',mv:'Create and move',ren:'Rename',mvf:'Move',del:'Delete'}[mode];$('fok').classList.toggle('warn',mode=='del');
if(mode=='ren'){nm.value=c.n;nm.placeholder=c.t=='b'?c.orig:'Folder name'}else{nm.value='';nm.placeholder='Folder name'}
if(mode=='mvf')ds.innerHTML='<option value="/">Top level</option>'+lbOpts(lbId(lbPar(c.p)),x=>x.v=='i'||x.v==c.v||x.v.startsWith('g:')&&lbIn(x.v.slice(2),c.p));
if(mode=='del'){const sub=[...lbX().all].filter(p=>p!==c.p&&lbIn(p,c.p)).length;$('fq').textContent=`Delete “${c.n}”${sub?` and ${sub} folder${sub>1?'s':''} inside`:''}?`}
renderLib(true);const f=mode=='mvf'?ds:mode=='del'?$('fok'):nm;f.focus();if(f===nm)nm.select()}
// a folder's menu (its ⋯ button, or a right-click on its row); using it makes that folder the active one
function fMenu(v){const c=lbNode(v);if(!c)return;WBS.mcat=c.v;mcSave();closeF();renderLib();const btn=$('lib').querySelector(`.lmo[data-fm="${CSS.escape(c.v)}"]`);if(!btn)return;
// Export opens its own small menu once this click is done (opened during it, the click would close it again)
const exp=['Export…',()=>{if(WBX.wbExport)setTimeout(()=>WBX.wbExport(c.v,btn),0)},!lbCount(c)],sub=['New folder inside',()=>{lbOpen.add(c.v);loSave();fOpen('new')}];
rowMenu(btn,c.t=='b'?[sub,['Rename',()=>fOpen('ren')],['Reset name',()=>{delete REN[c.orig];fSave();renderLib(true);pmsg('Set name reset.')},!REN[c.orig]],[c.hid?'Show in the list':'Hide from the list',()=>{if(c.hid)WBS.HID=WBS.HID.filter(x=>x!=c.orig);else WBS.HID.push(c.orig);fSave();renderLib(true);pmsg(c.hid?`“${c.n}” is back in the list.`:`Hid “${c.n}”.`)}],exp]
:c.t=='f'?[sub,['Rename',()=>fOpen('ren')],['Move to…',()=>fOpen('mvf')],exp,['Delete folder',()=>fOpen('del')]]:[exp])}
function closeF(){WBS.fmode=null;$('fform').hidden=true}
function libMoveKeys(ks,t){const n=lbNode(t);if(!ks.length||!n||n.t=='r')return;const g=n.t=='f'||n.t=='b'?n.g:'';let nb=0;
ks.forEach(k=>{if(k[0]=='b'){if(n.t=='b'&&CATS[lbSet(n.orig)].k.includes(k)){delete BF[k];return}if(!g){delete BF[k];return}nb++}fSet(k,g||null)});
fSave();store();lsel.clear();WBS.lanc=null;lbDirty();upd();
pmsg(`Moved ${ks.length} shape${ks.length>1?'s':''} to “${libPath(t)}”.`+(nb?' Built-in shapes also stay in their own set.':''))}
const libMove=t=>libMoveKeys([...lsel],t);
function init21(){
WBX.wbLibOpen=libOpen;
// the size slider sets how many shapes sit in a row; the first button opens every folder, or closes them all
const SZ=$('lsz'),szSet=v=>{SZ.value=v;$('lib').style.setProperty('--lcols',10-v);SZ.style.setProperty('--p',(v/8*100)+'%')};
let sz0=6;try{const v=kv.get('wb150_lsz');if(v!=null&&+v>=0&&+v<=8)sz0=Math.round(+v)}catch(e){}
szSet(sz0);
$('lq').addEventListener('keydown',e=>e.stopPropagation());$('lq').addEventListener('input',()=>renderLib());
SZ.oninput=()=>{szSet(+SZ.value);try{kv.set('wb150_lsz',String(SZ.value))}catch(e){}};
try{const o=JSON.parse(kv.get('wb150_lopen')||'[]');if(Array.isArray(o))o.forEach(v=>{if(typeof v=='string')lbOpen.add(v)})}catch(e){}
$('ltog').onclick=lbAll;
$('limp').onclick=e=>{e.stopPropagation();rowMenu($('limp'),[['Image…',()=>$('ifile').click()],['Sheet…',()=>$('sfile').click()],['Copy a prompt for an image',()=>WBX.wbPromptCopy&&WBX.wbPromptCopy(false)],['Copy a prompt for a sheet',()=>WBX.wbPromptCopy&&WBX.wbPromptCopy(true)]])};
const L=$('lib');
L.addEventListener('click',e=>{const mo=e.target.closest('[data-fm]');if(mo){e.stopPropagation();fMenu(mo.dataset.fm);return}
if(e.target.closest('#lhid')){lbHidOpen=!lbHidOpen;renderLib(true);return}const r=e.target.closest('.lfr[data-f]');if(r)lbToggle(r.dataset.f)});
L.addEventListener('contextmenu',e=>{const r=e.target.closest('.lrw'),b=r&&r.querySelector('[data-fm]');if(b){e.preventDefault();e.stopPropagation();fMenu(b.dataset.fm)}});
L.addEventListener('keydown',e=>{const r=e.target.closest&&e.target.closest('.lfr[data-f]');if(!r||e.target!==r)return;const v=r.dataset.f,o=lbOpen.has(v);
if(e.key=='ArrowRight'&&!o||e.key=='ArrowLeft'&&o){e.preventDefault();lbToggle(v)}});
// drop a shape dragged from the library onto a folder to move it there
WBX.wbLibDrop=(k,el)=>{const f=el&&el.closest&&el.closest('#lib .lfr[data-f]');if(!f)return false;const n=lbNode(f.dataset.f);if(!n||n.t=='r')return true;libMoveKeys(lsel.has(k)?[...lsel]:[k],n.v);return true};
WBX.wbLibOver=el=>{const f=el&&el.closest&&el.closest('#lib .lfr[data-f]');document.querySelectorAll('.lfr.dropt').forEach(x=>{if(x!==f)x.classList.remove('dropt')});if(f)f.classList.add('dropt')};
$('fsel').onclick=()=>{if(WBS.lsm)libExit();else{WBS.lsm=true;WBS.brush=null;upd()}};
$('fdone').onclick=libExit;
$('fall').onclick=()=>{const ks=lbVis();if(ks.length&&ks.every(k=>lsel.has(k)))ks.forEach(k=>lsel.delete(k));else ks.forEach(k=>lsel.add(k));renderLib(true)};
$('fnew').onclick=()=>fOpen(WBS.lsm&&lsel.size?'mv':'new');
$('fcx').onclick=()=>{closeF();renderLib(true)};
$('fname').onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();$('fok').click()}else if(e.key=='Escape'){e.stopPropagation();$('fcx').click()}};
$('fdest').onkeydown=e=>{if(e.key=='Escape'){e.stopPropagation();$('fcx').click()}};
$('fok').onclick=()=>{const c=libCur(),mode=WBS.fmode,v=lbName($('fname').value);
if(mode=='del'){if(c.t!='f')return;const p=c.p;let back=0;Object.values(cust).forEach(x=>{if(x&&lbIn(x.g,p)){delete x.g;back++}});Object.keys(BF).forEach(k=>{if(lbIn(BF[k],p))delete BF[k]});WBS.FOLD=WBS.FOLD.filter(x=>!lbIn(x,p));fSave();store();closeF();libOpen(lbId(lbPar(p)));upd();
pmsg(`Deleted the folder “${c.n}”.`+(back?` Its imported shapes went back to Yours.`:''));return}
if(mode=='mvf'){if(c.t!='f')return;const t=$('fdest').value,tn=lbNode(t);if(!tn)return;const np=(tn.t=='r'?'':tn.p+'/')+lbLeaf(c.p);closeF();if(np!==c.p&&!lbIn(tn.p||'',c.p)){lbRemap(c.p,np);upd()}else renderLib(true);pmsg(`Moved “${c.n}” to “${libPath(t)}”.`);return}
if(mode=='ren'&&c.t=='b'){const r=fClean($('fname').value);if(!r||r==c.orig)delete REN[c.orig];else REN[c.orig]=r;fSave();closeF();renderLib(true);pmsg(r&&r!=c.orig?`Renamed the set to “${r}”.`:'Set name reset.');return}
if(!v){$('fname').focus();return}
if(mode=='ren'){if(c.t!='f')return;const np=(lbPar(c.p)?lbPar(c.p)+'/':'')+v;closeF();if(np===c.p){renderLib(true);return}const merge=lbX().all.has(np);lbRemap(c.p,np);upd();pmsg(merge?`Merged “${c.n}” into “${v}”.`:`Renamed the folder to “${v}”.`);return}
if(mode=='mv'){const t=libMk('/',v);closeF();if(t)libMove(t);return}
const t=libMk(c.t=='u'?'/':c.v,v);if(t){libOpen(t);pmsg(`Made the folder “${libPath(t)}”.`)}};
$('fmove').oninput=()=>{const v=$('fmove').value;if(!v)return;if(v=='+'){$('fmove').value='';fOpen('mv');return}libMove(v)};
$('fout').onclick=()=>{const ks=[...lsel].filter(k=>fOf(k));if(!ks.length)return;ks.forEach(k=>fSet(k,null));fSave();store();lsel.clear();lbDirty();upd();pmsg(`Took ${ks.length} shape${ks.length>1?'s':''} out of ${ks.length>1?'their folders':'its folder'}.`)};
$('fdelm').onclick=()=>{const dm=$('fdelm'),ks=[...lsel].filter(k=>k[0]!='b'),usedK=new Set(WBS.tiles.flatMap(t=>t.items.map(q=>q.m))),ok=ks.filter(k=>!usedK.has(k));if(!ks.length)return;
if(!ok.length){pmsg('Those shapes are used on your stamps. Remove them from the stamps first.');return}
if(!dm.dataset.sure){dm.dataset.sure=1;dm.textContent='Click to confirm';setTimeout(()=>{if(dm.dataset.sure){delete dm.dataset.sure;renderLib(true)}},3000);return}
delete dm.dataset.sure;ok.forEach(k=>{delete cust[k];lsel.delete(k)});store();lbDirty();upd();pmsg(`Deleted ${ok.length} shape${ok.length>1?'s':''} from the library.`+(ok.length<ks.length?` ${ks.length-ok.length} in use on your stamps were kept.`:''))};
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&WBS.lsm&&!(e.target.matches&&e.target.matches('input,textarea,select')))libExit()});
}
export {libDest,libExportList,libG,libMk,libOpen,libOptions,libPath,libPick,libRz,mNm,renderLib,init21};
