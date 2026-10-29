import {ICN} from './00-icons.js';
import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {DD,HO,N,SK,col,shOf,wrapP} from './04-canvas-and-stamp-outlines.js';
import {DOTK} from './05-motif-data.js';
import {cust,inkOf,it,mk,selOne,store} from './06-motif-library-folders.js';
import {SYM,expand,symOf} from './07-symmetry.js';
import {clipWrap} from './09-stamp-items-and-print-runs.js';
import {build,hx} from './10-layer-grids.js';
import {Q,eR,eT,upd} from './11-pressure-flooding-block-edges.js';
import {sceDropShape} from './64-stamp-canvas-edit.js';
import {QS,clampN,delItems,selSet,selToggle,wrapA} from './12-selection-and-split.js';
import {syncAsp,syncPhys} from './14-presets-and-layer-grid-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {libPick} from './21-motif-library-ui.js';
import {fpL} from './24-free-place-layers.js';
import {stUnlocked} from './63-stamp-tool.js';
const mName=k=>k[0]=='b'?N[+k.slice(1)]||'Shape':cust[k]?cust[k].n:'Shape';
let mlFold;
const CHEV='<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3l3 3-3 3"/></svg>';
const MLMORE=`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.more}</svg>`;
let _mlK='';function renderML(){const el=$('mlist'),eg=$('elstg');if(eg)eg.hidden=stUnlocked()==null;if(stUnlocked()==null){if(_mlK){el.innerHTML='';_mlK=''}return}   // a locked stamp does not change, so its shapes are not listed
const t=WBS.tiles[WBS.cur],pa=col(WBS.proj.bg),pb=inkOf(t),sc=el.querySelector('.ml')?el.querySelector('.ml').scrollTop:0;{const k=JSON.stringify([WBS.cur,pa,pb,[...WBS.msel],[...mlFold],t.items.map(q=>[q.m,q.k,q.cl,q.tg,cust[q.m]?[cust[q.m].n,cust[q.m].svg.length]:0]),t.tgm||0]);if(k===_mlK&&el.firstChild){if(WBX.wbTxSync)WBX.wbTxSync();return}_mlK=k}
const thumb=q=>`<svg viewBox="-50 -50 100 100" style="background:${q.k?pb:pa}">${clipWrap(q,q.k?mk(q.m,pa,pb):mk(q.m,pb,pa))}</svg>`;
const tags=q=>`${q.cl&&q.cl.length?' <i>piece</i>':''}${q.k?'<i>knockout</i>':''}`;
const gk=q=>q.tg?'txt:'+q.tg:mName(q.m),gnm=k=>{if(k.startsWith('txt:')){const M=(t.tgm||{})[k.slice(4)];const s=M?M.text.replace(/\n/g,' '):'Text';return '“'+(s.length>24?s.slice(0,23)+'…':s)+'”'}return k};
const by={};t.items.forEach((q,i)=>{const nm=gk(q);(by[nm]=by[nm]||[]).push(i)});
const row=(i,n,kid)=>{const q=t.items[i],nm=mName(q.m);return`<div class="mr${kid?' kid':''}${WBS.msel.has(i)?' on':''}" data-r="${i}">${thumb(q)}<b>${hx(nm)}${n?` <i>${n}</i>`:''}${tags(q)}</b><button type="button" class="lyb" data-rm="${i}" aria-haspopup="menu" aria-label="Actions for ${hx(nm)}">${MLMORE}</button></div>`};
let h='';const done={};
for(let i=t.items.length-1;i>=0;i--){const nm=gk(t.items[i]);if(done[nm])continue;done[nm]=1;const g=by[nm],isT=nm.startsWith('txt:');
if(g.length==1&&!isT){h+=row(i);continue}
const fr=isT?[...g]:[...g].reverse(),ns=g.filter(j=>WBS.msel.has(j)).length,open=!mlFold.has(nm),e=hx(nm),lb=hx(gnm(nm));
h+=`<div class="mg${open?' open':''}"><div class="mr mh${ns==g.length?' on':ns?' part':''}" data-g="${e}"><span class="car" data-f="${e}" role="button" aria-label="${open?'Fold':'Unfold'} ${e}" aria-expanded="${open}">${CHEV}</span>${thumb(t.items[fr[0]])}<b>${lb}<i class="cnt">${ns&&ns<g.length?ns+'/':''}${g.length}</i></b><button type="button" class="lyb" data-gm="${e}" aria-haspopup="menu" aria-label="Actions for ${lb}">${MLMORE}</button></div>${open?`<div class="mk">${fr.map(j=>row(j,isT?0:g.indexOf(j)+1,1)).join('')}</div>`:''}</div>`}
el.innerHTML=`<div class="ml">`+(h||`<div class="em">No shapes yet</div>`)+`</div>`;
// the Elements header counts what the tab lists (2.25.0): each motif, and a text once
{const n=t.items.filter(q=>!q.tg).length+new Set(t.items.filter(q=>q.tg).map(q=>q.tg)).size,c=$('lycnt');if(c)c.textContent=`${n} element${n==1?'':'s'}`}
if(sc)el.querySelector('.ml').scrollTop=sc;if(WBX.wbTxSync)WBX.wbTxSync()}
const txC=()=>{const qs=QS();let x=0,y=0;qs.forEach(o=>{x+=o.x;y+=o.y});return[x/qs.length,y/qs.length]};
const txAbs=(g,c)=>WBX.wbTxXf(g,M=>{M.ax+=c[0]-M.mx;M.ay+=c[1]-M.my;M.mx=c[0];M.my=c[1]});
const sAx=k=>e=>{const q=Q();if(!q)return;const v=e.target.value/100,f=v/(q[k]||1);QS().forEach(o=>o[k]=o===q?v:clampN((o[k]||1)*f,.05,20));store();upd()};
const addSt=t=>{const L=WBS.layers[WBS.selL];if(L&&!L.st.includes(t.id))L.st.push(t.id)};
const layName=()=>{const L=WBS.layers[WBS.selL];return L?L.name:'the pattern'};
function sync(){const t=WBS.tiles[WBS.cur]||WBS.noTile,L=WBS.layers[WBS.selL],sv=(id,v)=>{if($(id).value!=v)$(id).value=v};syncAsp('c','c');syncPhys();syncAsp('s','s');{
if(WBX.wbNums)WBX.wbNums()
}document.querySelectorAll('#skind [data-k]').forEach(b=>b.classList.toggle('on',b.dataset.k==SK));$('sasprow').hidden=SK=='hex'||SK=='tri';$('shexrow').hidden=SK!='hex';$('shor').value=HO;
if(WBX.wbTraySync)WBX.wbTraySync();$('neg').checked=!!(t&&t.neg);$('swrap').checked=!t||t.wr!==false;
sv('shz',shOf(t).z||100);{const rr=$('shrad');if(rr){sv('shrad',shOf(t).rad||0);const row=rr.closest('.ctl');if(row)row.hidden=SK=='circle'}}sv('let',eT(t));sv('ler',eR(t));$('lers').disabled=!eT(t)||!eR(t);
Object.values(DD).forEach(f=>f())}
function init13(){
// ---- Stamp tool: pick a motif in the library, then click on the stamp to stamp it. Scroll resizes, [ ] rotates, Esc or right-click stops.
WBS.brush=null;
document.addEventListener('contextmenu',e=>{const was=WBX.plDisarm?WBX.plDisarm():false;if(!was&&WBX.wbCtxMenu&&WBX.wbCtxMenu(e))return;
if(typeof WBS.fpB!='undefined'&&(was||WBS.fpSel!==-1)&&fpL()){e.preventDefault();WBS.fpB=null;WBS.txArm=false;WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpPool=new Set();WBS.fpGhost=null;upd();return}e.preventDefault()},true);
mlFold=new Set();try{mlFold=new Set(JSON.parse(kv.get('wb18_mlfold')||'[]'))}catch(e){}
$('mlist').onmousedown=e=>{if(e.shiftKey&&e.target.closest('.mr'))e.preventDefault()};
$('mlist').onclick=e=>{const ML=$('mlist'),C=q=>{const x=e.target.closest(q);return x&&ML.contains(x)?x:null},t=WBS.tiles[WBS.cur],add=e.shiftKey||e.ctrlKey||e.metaKey,rng=e.shiftKey,ofName=nm=>t.items.map((q,i)=>(q.tg?'txt:'+q.tg:mName(q.m))==nm?i:-1).filter(i=>i>=0);
const f=C('[data-f]');if(f){const nm=f.dataset.f;mlFold.has(nm)?mlFold.delete(nm):mlFold.add(nm);try{kv.set('wb18_mlfold',JSON.stringify([...mlFold]))}catch(er){}renderML();return}
// a row's … button (2.25.0, like an Elements row): selects the row and opens the element menu there
const gm=C('[data-gm]');if(gm){selSet(ofName(gm.dataset.gm),false);upd();if(WBX.wbCtxAt)WBX.wbCtxAt(gm);return}
const rm=C('[data-rm]');if(rm){const i=+rm.dataset.rm;if(!WBS.msel.has(i))selOne(i);WBS.sel=i;upd();if(WBX.wbCtxAt)WBX.wbCtxAt(rm);return}
const g=C('[data-g]');if(g){selSet(ofName(g.dataset.g),add);upd();return}
const r=C('[data-r]');if(!r)return;const i=+r.dataset.r;WBS.brush=null;if(rng){const ord=[...ML.querySelectorAll('[data-r]')].map(x=>+x.dataset.r),a=WBS.mAnc!=null&&ord.includes(WBS.mAnc)?ord.indexOf(WBS.mAnc):(WBS.sel>=0&&ord.includes(WBS.sel)?ord.indexOf(WBS.sel):-1),b=ord.indexOf(i);if(a>=0&&b>=0){selSet(ord.slice(Math.min(a,b),Math.max(a,b)+1),false);WBS.sel=i}else{selToggle(i);WBS.mAnc=i}}else if(e.ctrlKey||e.metaKey){selToggle(i);WBS.mAnc=i}else{selOne(i);WBS.mAnc=i}upd()};
$('ssz').oninput=e=>{const q=Q();if(!q)return;const v=e.target.value/100,f=v/q.s;{const g=WBX.wbTxGrp&&WBX.wbTxGrp();if(g&&WBS.msel.size>1){const c=txC();txAbs(g,c);QS().forEach(o=>{o.s=o===q?v:o.s*f;[o.x,o.y]=wrapP(c[0]+(o.x-c[0])*f,c[1]+(o.y-c[1])*f)});WBX.wbTxXf(g,M=>{M.sz=+(M.sz*f).toFixed(3);M.ax=c[0]+(M.ax-c[0])*f;M.ay=c[1]+(M.ay-c[1])*f});store();upd();return}}QS().forEach(o=>o.s=o===q?v:clampN(o.s*f,.08,2.6));store();upd()};
$('sth').oninput=e=>{if(!Q())return;const v=+e.target.value;QS().forEach(o=>{if(v)o.w=v;else delete o.w});store();upd()};
$('srt').oninput=e=>{const q=Q();if(!q)return;const v=+e.target.value,d=v-q.r;{const g=WBX.wbTxGrp&&WBX.wbTxGrp();if(g&&WBS.msel.size>1){const c=txC(),a=d*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a),R=(x,y)=>[c[0]+(x-c[0])*cs-(y-c[1])*sn,c[1]+(x-c[0])*sn+(y-c[1])*cs];txAbs(g,c);QS().forEach(o=>{o.r=o===q?v:wrapA(o.r+d);[o.x,o.y]=wrapP(...R(o.x,o.y))});WBX.wbTxXf(g,M=>{M.rot=wrapA((M.rot||0)+d);[M.ax,M.ay]=R(M.ax,M.ay)});store();upd();return}}QS().forEach(o=>o.r=o===q?v:wrapA(o.r+d));store();upd()};$('ssx').oninput=sAx('sx');$('ssy').oninput=sAx('sy');$('ssr').onclick=()=>{if(Q()){QS().forEach(o=>{delete o.sx;delete o.sy});store();upd()}};
$('sko').onclick=()=>{const q=Q();if(!q)return;const on=!q.k;QS().forEach(o=>{if(on)o.k=1;else delete o.k});store();upd()};
$('sfl').onclick=()=>{if(Q()){QS().forEach(o=>o.f*=-1);store();upd()}};
$('scp').onclick=()=>{if(!Q())return;const a=(WBS.tiles[WBS.cur]||WBS.noTile).items,src=QS(),p=src.indexOf(Q()),ids=[];src.forEach(o=>{const q=JSON.parse(JSON.stringify(o));[q.x,q.y]=wrapP(q.x+20,q.y+20);a.push(q);ids.push(a.length-1)});WBS.msel=new Set(ids);WBS.sel=ids[p];store();upd()};
// Copy and paste of shapes on an unlocked stamp: Cmd/Ctrl+C keeps the selected shapes, Cmd/Ctrl+V puts copies on the open stamp (also another stamp),
// each paste a little further along; a picture on the clipboard still goes to the importer.
// the open stamp takes copy and paste, with a stamp unlocked, on the Pattern canvas
const stEdit=()=>stUnlocked()!=null;
{let mclip=null,mpaste=0;const typingIn=t=>!!(t&&t.matches&&t.matches('input,select,textarea,[contenteditable]'));
// the stamp tab's own clipboard (shapes inside a stamp): Copy, Cut (2.25.0) and Paste, by keys and by the right-click menu (WBX.wbStClip)
const mCopy=()=>{const src=QS();if(!src.length)return false;mclip=src.map(o=>{const q=JSON.parse(JSON.stringify(o));delete q.tg;return q});mpaste=0;return true};
const mPaste=()=>{if(!stEdit()||!mclip)return false;const t=WBS.tiles[WBS.cur],a=t.items,ids=[];mpaste++;const d=20*mpaste;mclip.forEach(o=>{const q=JSON.parse(JSON.stringify(o));[q.x,q.y]=wrapP(q.x+d,q.y+d);a.push(q);ids.push(a.length-1)});
WBS.msel=new Set(ids);WBS.sel=ids[0];store();upd();if(WBX.wbCap)WBX.wbCap();return true};
WBX.wbStClip={copy:mCopy,cut:()=>mCopy()&&!!WBX.wbSceDelSel&&WBX.wbSceDelSel(),paste:mPaste,has:()=>!!mclip,sel:()=>QS().length>0};
document.addEventListener('keydown',e=>{if(!(e.metaKey||e.ctrlKey)||e.altKey||e.shiftKey||typingIn(e.target)||!stEdit())return;const k=e.key.toLowerCase();if(k!='c'&&k!='x')return;if(String(getSelection&&getSelection()||'').length)return;
if(k=='c')mCopy();else if(WBX.wbStClip.cut())e.preventDefault()});
document.addEventListener('paste',e=>{if(!stEdit()||!mclip||typingIn(e.target))return;if([...(e.clipboardData&&e.clipboardData.items||[])].some(i=>/^image\//.test(i.type)))return;e.preventDefault();mPaste()});}
$('sfr').onclick=()=>{if(!Q())return;const a=(WBS.tiles[WBS.cur]||WBS.noTile).items,pq=Q(),mv=QS(),rest=a.filter(o=>!mv.includes(o));a.length=0;a.push(...rest,...mv);WBS.msel=new Set(mv.map(o=>a.indexOf(o)));WBS.sel=a.indexOf(pq);store();upd()};
$('ssb').onclick=()=>{if(!Q())return;const a=(WBS.tiles[WBS.cur]||WBS.noTile).items,pq=Q(),mv=QS(),rest=a.filter(o=>!mv.includes(o));a.length=0;a.push(...mv,...rest);WBS.msel=new Set(mv.map(o=>a.indexOf(o)));WBS.sel=a.indexOf(pq);store();upd()};
$('sym').onclick=e=>{const b=e.target.closest('[data-y]');if(!b)return;const t=WBS.tiles[WBS.cur],d=SYM.find(x=>x[0]==b.dataset.y);t.sym={m:d[0],n:d[2]?(t.sym&&t.sym.m==d[0]?t.sym.n:d[4]):0,...(t.sym&&t.sym.tx?{tx:1}:{})};store();upd()};
$('symtx').onchange=()=>{const t=WBS.tiles[WBS.cur];t.sym={...(t.sym||{m:'off'})};if($('symtx').checked)t.sym.tx=1;else delete t.sym.tx;WBS.symKey='';store();upd();if(WBX.wbCap)WBX.wbCap()};
$('sn').oninput=e=>{const t=WBS.tiles[WBS.cur];if(t.sym){t.sym.n=+e.target.value;store();upd()}};
$('sbk').onclick=()=>{const t=WBS.tiles[WBS.cur];if(symOf(t).m=='off')return;t.items=expand(t).map(e=>({...e[0]}));t.sym={m:'off',n:0};selOne(-1);store();upd()};
$('sdl').onclick=()=>{if(Q()){delItems([...WBS.msel]);selOne(-1);store();upd()}};

{let ld=null,lsw=false;const L=$('lib');
L.addEventListener('pointerdown',e=>{if(e.button!==0||e.shiftKey||e.ctrlKey||e.metaKey||WBS.lsm)return;const b=e.target.closest('button[data-m]');if(!b)return;ld={k:b.dataset.m,x:e.clientX,y:e.clientY,on:false,g:null}});
document.addEventListener('pointermove',e=>{if(!ld)return;if(!ld.on){if(Math.hypot(e.clientX-ld.x,e.clientY-ld.y)<6)return;ld.on=true;const s=L.querySelector('button[data-m="'+ld.k+'"] svg');if(s){const g=s.cloneNode(true);g.id='mdg';g.style.cssText='position:fixed;width:44px;height:44px;pointer-events:none;z-index:70;opacity:.85;transform:translate(-50%,-50%)';document.body.appendChild(g);ld.g=g}}
if(ld.g){ld.g.style.left=e.clientX+'px';ld.g.style.top=e.clientY+'px';if(WBX.wbLibOver)WBX.wbLibOver(document.elementFromPoint(e.clientX,e.clientY))}});
const lend=e=>{if(!ld)return;const x=ld;ld=null;if(x.g)x.g.remove();if(!x.on)return;lsw=true;setTimeout(()=>{lsw=false},0);if(WBX.wbLibOver)WBX.wbLibOver(null);if(e.type!='pointerup')return;if(WBX.wbLibDrop&&WBX.wbLibDrop(x.k,document.elementFromPoint(e.clientX,e.clientY)))return;sceDropShape(x.k,e)};
document.addEventListener('pointerup',lend);document.addEventListener('pointercancel',lend);
L.addEventListener('click',e=>{if(lsw){e.stopImmediatePropagation();e.preventDefault()}},true)}
$('lib').onclick=e=>{const x=e.target.closest('[data-x]');if(x){const k=x.dataset.x;if(WBS.tiles.some(t=>t.items.some(q=>q.m==k))){$('pmsg').textContent='That shape is used on a stamp. Remove it from your stamps first.';return}if(!x.dataset.sure){x.dataset.sure=1;x.textContent='?';setTimeout(()=>{if(x.isConnected){delete x.dataset.sure;x.innerHTML='&#215;'}},2500);return}delete cust[k];store();build();$('pmsg').textContent='Removed from the library.';return}const b=e.target.closest('[data-m]');if(!b)return;const k=b.dataset.m;if(WBX.wbLibPick&&!WBS.lsm){WBX.wbLibPick(k);return}   // (2.28.0) a pattern is waiting for a source
if(WBS.lsm||e.ctrlKey||e.metaKey||e.shiftKey){libPick(k,e);return}if(WBX.wbMotifSwap&&WBX.wbMotifSwap(k)){upd();return}WBS.brush=WBS.brush&&WBS.brush.m==k?null:{m:k,s:DOTK.has(k)?.22:.8,r:0};selOne(-1);upd()};
}
export {renderML,sync,init13};
