import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CASP,CH,CW,DD,HO,N,ORN,SHN,SK,col,csN,csk,shOf,wrapP} from './04-canvas-and-stamp-outlines.js';
import {DOTK} from './05-motif-data.js';
import {cols,cust,inkOf,it,mk,selOne,store} from './06-motif-library-folders.js';
import {SYM,expand,symOf} from './07-symmetry.js';
import {clipWrap,grid,snapPt} from './09-stamp-editor-grid-and-motif-ops.js';
import {GRAD,gArrAll,arrOf,arrOpts,build,fitTs,hx,lattice} from './10-layer-grids.js';
import {Q,eR,eT,ed,upd} from './11-pressure-flooding-block-edges.js';
import {QS,clampN,delItems,selSet,selToggle,wrapA} from './12-selection-and-split.js';
import {syncAsp,syncGrid} from './14-presets-and-layer-grid-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {libPick} from './21-motif-library-ui.js';
import {fpL,tGrp} from './24-free-place-layers.js';
// ---- live pattern preview panel (stamp editor): <use> mirrors of the pattern board, so it updates with every edit
let pvZ=1;
function pvView(){const w=CW/pvZ,h=CH/pvZ;$('pvw').setAttribute('viewBox',`${((CW-w)/2).toFixed(1)} ${((CH-h)/2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);document.querySelectorAll('#pvz [data-z]').forEach(b=>b.classList.toggle('on',+b.dataset.z==pvZ))}
function paintGhost(){let g=ed.querySelector('#ghost');ed.classList.toggle('brush',!!WBS.brush&&!!WBS.gp);
$('edh1').textContent=WBS.brush?'Click to stamp. Scroll to resize, [ and ] to rotate. Esc or right-click to stop.':'Drag to move. Click to select, Shift+click to add.';$('wrh').hidden=!!WBS.brush;
if(!WBS.brush||!WBS.gp){if(g)g.remove();return}
if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='ghost';g.setAttribute('pointer-events','none');g.setAttribute('opacity','.6');ed.appendChild(g)}
const cl=cols(WBS.tiles[WBS.cur]),key=WBS.brush.m+'|'+cl.c+'|'+cl.d;if(g.dataset.k!==key){g.innerHTML=mk(WBS.brush.m,cl.c,cl.d);g.dataset.k=key}
let x=WBS.gp.x,y=WBS.gp.y;if(grid.sd)[x,y]=snapPt(x,y);g.setAttribute('transform',`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${WBS.brush.r}) scale(${WBS.brush.s.toFixed(4)})`)}
const mName=k=>k[0]=='b'?N[+k.slice(1)]||'Shape':cust[k]?cust[k].n:'Shape';
let mlFold;
const CHEV='<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3l3 3-3 3"/></svg>';
let _mlK='';function renderML(){const t=WBS.tiles[WBS.cur],pa=col(WBS.proj.bg),pb=inkOf(t),el=$('mlist'),sc=el.querySelector('.ml')?el.querySelector('.ml').scrollTop:0;{const k=JSON.stringify([WBS.cur,pa,pb,[...WBS.msel],[...mlFold],t.items.map(q=>[q.m,q.k,q.cl,q.tg,cust[q.m]?[cust[q.m].n,cust[q.m].svg.length]:0]),t.tgm||0]);if(k===_mlK&&el.firstChild){if(WBX.wbTxSync)WBX.wbTxSync();return}_mlK=k}
const thumb=q=>`<svg viewBox="-50 -50 100 100" style="background:${q.k?pb:pa}">${clipWrap(q,q.k?mk(q.m,pa,pb):mk(q.m,pb,pa))}</svg>`;
const tags=q=>`${q.cl&&q.cl.length?' <i>piece</i>':''}${q.k?'<i title="Knocks out the shapes under it">knockout</i>':''}`;
const gk=q=>q.tg?'txt:'+q.tg:mName(q.m),gnm=k=>{if(k.startsWith('txt:')){const M=(t.tgm||{})[k.slice(4)];const s=M?M.text.replace(/\n/g,' '):'Text';return '“'+(s.length>24?s.slice(0,23)+'…':s)+'”'}return k};
const by={};t.items.forEach((q,i)=>{const nm=gk(q);(by[nm]=by[nm]||[]).push(i)});
const row=(i,n,kid)=>{const q=t.items[i],nm=mName(q.m);return`<div class="mr${kid?' kid':''}${WBS.msel.has(i)?' on':''}" data-r="${i}" title="Click to select. Shift+click to add or remove.">${thumb(q)}<b>${hx(nm)}${n?` <i>${n}</i>`:''}${tags(q)}</b><button type="button" data-rx="${i}" title="Delete" aria-label="Delete ${hx(nm)}">&#215;</button></div>`};
let h='';const done={};
for(let i=t.items.length-1;i>=0;i--){const nm=gk(t.items[i]);if(done[nm])continue;done[nm]=1;const g=by[nm],isT=nm.startsWith('txt:');
if(g.length==1&&!isT){h+=row(i);continue}
const fr=isT?[...g]:[...g].reverse(),ns=g.filter(j=>WBS.msel.has(j)).length,open=!mlFold.has(nm),e=hx(nm),lb=hx(gnm(nm));
h+=`<div class="mg${open?' open':''}"><div class="mr mh${ns==g.length?' on':ns?' part':''}" data-g="${e}" title="Click to select all ${g.length}. Shift+click to add them."><span class="car" data-f="${e}" role="button" aria-label="${open?'Fold':'Unfold'} ${e}" aria-expanded="${open}">${CHEV}</span>${thumb(t.items[fr[0]])}<b>${lb}<i class="cnt">${ns&&ns<g.length?ns+'/':''}${g.length}</i></b><button type="button" data-gx="${e}" title="Delete all ${g.length}" aria-label="Delete all ${lb}">&#215;</button></div>${open?`<div class="mk">${fr.map(j=>row(j,isT?0:g.indexOf(j)+1,1)).join('')}</div>`:''}</div>`}
el.innerHTML=`<h3>Shapes on stamp ${WBS.cur+1}<span>${WBS.msel.size>1?WBS.msel.size+' of ':''}${t.items.length}</span></h3><div class="ml">`+(h||`<div class="em">No shapes yet</div>`)+`</div>`;
if(sc)el.querySelector('.ml').scrollTop=sc;if(WBX.wbTxSync)WBX.wbTxSync()}
const txC=()=>{const qs=QS();let x=0,y=0;qs.forEach(o=>{x+=o.x;y+=o.y});return[x/qs.length,y/qs.length]};
const txAbs=(g,c)=>WBX.wbTxXf(g,M=>{M.ax+=c[0]-M.mx;M.ay+=c[1]-M.my;M.mx=c[0];M.my=c[1]});
const sAx=k=>e=>{const q=Q();if(!q)return;const v=e.target.value/100,f=v/(q[k]||1);QS().forEach(o=>o[k]=o===q?v:clampN((o[k]||1)*f,.2,3));store();upd()};
const addSt=t=>{const L=WBS.layers[WBS.selL];if(L&&!L.st.includes(t.id))L.st.push(t.id)};
const layName=()=>{const L=WBS.layers[WBS.selL];return L?L.name:'the pattern'};
function sync(){const t=WBS.tiles[WBS.cur],L=WBS.layers[WBS.selL],sv=(id,v)=>{if($(id).value!=v)$(id).value=v};syncAsp('c','c');syncAsp('s','s');{const k=csk();document.querySelectorAll('#cshp [data-s]').forEach(b=>{b.classList.toggle('on',b.dataset.s==k);b.disabled=WBS.book.on});
$('caspbox').hidden=!CASP.includes(k);$('crrbox').hidden=k!='rrect';$('cngbox').hidden=k!='ngon';$('ccobox').hidden=!['hex','tri','ngon'].includes(k);$('ccirh').hidden=k=='rect';
{const a=$('ccr'),b=$('cns');if(document.activeElement!==a)a.value=WBS.dim.cr==null?25:WBS.dim.cr;if(document.activeElement!==b)b.value=csN();if(typeof nums=='function')nums()}
const ob=document.querySelectorAll('#cor [data-o]');ob.forEach(x=>x.classList.toggle('on',x.dataset.o==(WBS.dim.co=='f'?'f':'p')));if(ob.length){ob[0].textContent=k=='hex'?'Pointy top':'Point up';ob[1].textContent=k=='tri'?'Point down':'Flat top'}
}document.querySelectorAll('#skind [data-k]').forEach(b=>b.classList.toggle('on',b.dataset.k==SK));$('sasprow').hidden=SK=='hex'||SK=='tri';$('shexrow').hidden=SK!='hex';$('shor').value=HO;$('wrh').textContent=SK=='circle'||SK=='tri'||ORN.includes(SK)?`Shapes are trimmed to the ${(SHN[SK]||'stamp').toLowerCase()}.`:'Shapes wrap around the stamp edges, so it tiles seamlessly.';
if(WBX.wbTraySync)WBX.wbTraySync();$('neg').checked=!!t.neg;
sv('lay',L.lay);sv('lgr',L.grid||'');const T=lattice(L),B=T.B,lk=T.linked;{const op=arrOpts(T.g),ky=T.g.SK+op.length;if($('larr').dataset.k!=ky){$('larr').innerHTML=op.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')+`<optgroup label="Round the middle">${GRAD.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</optgroup>`;$('larr').dataset.k=ky}sv('larr',arrOf(L,T.g).k)}sv('lgp',B.gap||0);sv('ts',B.fit?+fitTs(B).toFixed(1):B.size);document.querySelectorAll('#tsfit [data-f]').forEach(b=>{b.classList.toggle('on',b.dataset.f==(B.fit||''));b.disabled=lk});[['lox',!lk&&L.fit=='h'],['loy',!lk&&L.fit=='v'],['lrt',lk||!!L.fit],['lgp',lk],['ts',lk]].forEach(([id,off])=>{$(id).disabled=off;const n=$(id).parentNode.querySelector('.num input');if(n)n.disabled=off});sv('lox',L.ox);sv('loy',L.oy);sv('lrr',L.rrot||0);$('lborow').hidden=lk||!(T.gm=='brick'||T.gm=='drop');if($('lbo').value!=String(B.bo||50)){const ok=[...$('lbo').options].some(o=>+o.value==(B.bo||50));if(ok)$('lbo').value=[...$('lbo').options].find(o=>+o.value==(B.bo||50)).value}sv('lrp',L.rpos||0);sv('lrz',L.rsz||0);sv('lrg',L.rgp||0);$('lrsec').hidden=!!(L.art||L.txt);$('lrtn').checked=!!L.rtn;$('lrfh').checked=!!L.rfh;$('lrfv').checked=!!L.rfv;sv('lrt',B.rot||0);syncGrid(L,T);sv('shz',shOf(t).z||100);{const rr=$('shrad');if(rr){sv('shrad',shOf(t).rad||0);const row=rr.closest('.ctl');if(row)row.hidden=SK=='circle'}}sv('lps',L.pst||0);sv('lfs',L.pfl||0);sv('lnm',L.name);$('man').checked=!!L.man;{const c=Object.keys(L.ov||{}).length;$('mancnt').textContent=c?c+' changed':'';$('manr').disabled=!c}$('art').classList.toggle('man',!!L.man);sv('let',eT(t));sv('ler',eR(t));$('lers').disabled=!eT(t)||!eR(t);
Object.values(DD).forEach(f=>f())}
function init13(){try{pvZ=+kv.get('wb31_pvz')||1}catch(e){}
{let on=false;try{on=kv.get('wb31_pvc')=='1'}catch(e){}const setC=v=>{on=v;$('pvc').setAttribute('aria-pressed',v);$('pvcu').setAttribute('visibility',v?'visible':'hidden');try{kv.set('wb31_pvc',v?'1':'0')}catch(e){}};setC(on);$('pvc').onclick=()=>setC(!on)}
$('pvz').onclick=e=>{const b=e.target.closest('[data-z]');if(!b)return;pvZ=+b.dataset.z;try{kv.set('wb31_pvz',pvZ)}catch(e){}pvView()};
// ---- Stamp tool: pick a motif in the library, then click on the stamp to stamp it. Scroll resizes, [ ] rotates, Esc or right-click stops.
WBS.brush=null;WBS.gp=null;
ed.addEventListener('pointerleave',()=>{WBS.gp=null;paintGhost()});
document.addEventListener('contextmenu',e=>{if(WBS.brush){e.preventDefault();WBS.brush=null;upd();return}
if(typeof WBS.fpB!='undefined'&&(WBS.fpB||WBS.txArm||WBS.fpSel!==-1)&&fpL()){e.preventDefault();WBS.fpB=null;WBS.txArm=false;WBS.fpSel=-1;WBS.fpMS=new Set();WBS.fpPool=new Set();WBS.fpGhost=null;upd();return}e.preventDefault()},true);
ed.addEventListener('wheel',e=>{if(!WBS.brush||e.ctrlKey||e.metaKey)return;e.preventDefault();WBS.brush.s=Math.min(2.6,Math.max(.08,WBS.brush.s*(e.deltaY<0?1.08:1/1.08)));paintGhost()},{passive:false});
mlFold=new Set();try{mlFold=new Set(JSON.parse(kv.get('wb18_mlfold')||'[]'))}catch(e){}
$('mlist').onmousedown=e=>{if(e.shiftKey&&e.target.closest('.mr'))e.preventDefault()};
$('mlist').onclick=e=>{const ML=$('mlist'),C=q=>{const x=e.target.closest(q);return x&&ML.contains(x)?x:null},t=WBS.tiles[WBS.cur],add=e.shiftKey||e.ctrlKey||e.metaKey,rng=e.shiftKey,ofName=nm=>t.items.map((q,i)=>(q.tg?'txt:'+q.tg:mName(q.m))==nm?i:-1).filter(i=>i>=0);
const f=C('[data-f]');if(f){const nm=f.dataset.f;mlFold.has(nm)?mlFold.delete(nm):mlFold.add(nm);try{kv.set('wb18_mlfold',JSON.stringify([...mlFold]))}catch(er){}renderML();return}
const gx=C('[data-gx]');if(gx){if(!gx.dataset.sure){gx.dataset.sure=1;gx.textContent='?';gx.title='Click again to delete them all';setTimeout(()=>{if(gx.isConnected){delete gx.dataset.sure;gx.innerHTML='&#215;'}},2500);return}delItems(ofName(gx.dataset.gx));store();upd();return}
const x=C('[data-rx]');if(x){delItems([+x.dataset.rx]);store();upd();return}
const g=C('[data-g]');if(g){selSet(ofName(g.dataset.g),add);upd();return}
const r=C('[data-r]');if(!r)return;const i=+r.dataset.r;WBS.brush=null;if(rng){const ord=[...ML.querySelectorAll('[data-r]')].map(x=>+x.dataset.r),a=WBS.mAnc!=null&&ord.includes(WBS.mAnc)?ord.indexOf(WBS.mAnc):(WBS.sel>=0&&ord.includes(WBS.sel)?ord.indexOf(WBS.sel):-1),b=ord.indexOf(i);if(a>=0&&b>=0){selSet(ord.slice(Math.min(a,b),Math.max(a,b)+1),false);WBS.sel=i}else{selToggle(i);WBS.mAnc=i}}else if(e.ctrlKey||e.metaKey){selToggle(i);WBS.mAnc=i}else{selOne(i);WBS.mAnc=i}upd()};
$('ssz').oninput=e=>{const q=Q();if(!q)return;const v=e.target.value/100,f=v/q.s;{const g=WBX.wbTxGrp&&WBX.wbTxGrp();if(g&&WBS.msel.size>1){const c=txC();txAbs(g,c);QS().forEach(o=>{o.s=o===q?v:o.s*f;[o.x,o.y]=wrapP(c[0]+(o.x-c[0])*f,c[1]+(o.y-c[1])*f)});WBX.wbTxXf(g,M=>{M.sz=+(M.sz*f).toFixed(3);M.ax=c[0]+(M.ax-c[0])*f;M.ay=c[1]+(M.ay-c[1])*f});store();upd();return}}QS().forEach(o=>o.s=o===q?v:clampN(o.s*f,.08,2.6));store();upd()};
$('sth').oninput=e=>{if(!Q())return;const v=+e.target.value;QS().forEach(o=>{if(v)o.w=v;else delete o.w});store();upd()};
$('srt').oninput=e=>{const q=Q();if(!q)return;const v=+e.target.value,d=v-q.r;{const g=WBX.wbTxGrp&&WBX.wbTxGrp();if(g&&WBS.msel.size>1){const c=txC(),a=d*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a),R=(x,y)=>[c[0]+(x-c[0])*cs-(y-c[1])*sn,c[1]+(x-c[0])*sn+(y-c[1])*cs];txAbs(g,c);QS().forEach(o=>{o.r=o===q?v:wrapA(o.r+d);[o.x,o.y]=wrapP(...R(o.x,o.y))});WBX.wbTxXf(g,M=>{M.rot=wrapA((M.rot||0)+d);[M.ax,M.ay]=R(M.ax,M.ay)});store();upd();return}}QS().forEach(o=>o.r=o===q?v:wrapA(o.r+d));store();upd()};$('ssx').oninput=sAx('sx');$('ssy').oninput=sAx('sy');$('ssr').onclick=()=>{if(Q()){QS().forEach(o=>{delete o.sx;delete o.sy});store();upd()}};
$('sko').onclick=()=>{const q=Q();if(!q)return;const on=!q.k;QS().forEach(o=>{if(on)o.k=1;else delete o.k});store();upd()};
$('sfl').onclick=()=>{if(Q()){QS().forEach(o=>o.f*=-1);store();upd()}};
$('scp').onclick=()=>{if(!Q())return;const a=WBS.tiles[WBS.cur].items,src=QS(),p=src.indexOf(Q()),ids=[];src.forEach(o=>{const q=JSON.parse(JSON.stringify(o));[q.x,q.y]=wrapP(q.x+20,q.y+20);a.push(q);ids.push(a.length-1)});WBS.msel=new Set(ids);WBS.sel=ids[p];store();upd()};
$('sfr').onclick=()=>{if(!Q())return;const a=WBS.tiles[WBS.cur].items,pq=Q(),mv=QS(),rest=a.filter(o=>!mv.includes(o));a.length=0;a.push(...rest,...mv);WBS.msel=new Set(mv.map(o=>a.indexOf(o)));WBS.sel=a.indexOf(pq);store();upd()};
$('ssb').onclick=()=>{if(!Q())return;const a=WBS.tiles[WBS.cur].items,pq=Q(),mv=QS(),rest=a.filter(o=>!mv.includes(o));a.length=0;a.push(...mv,...rest);WBS.msel=new Set(mv.map(o=>a.indexOf(o)));WBS.sel=a.indexOf(pq);store();upd()};
$('sym').onclick=e=>{const b=e.target.closest('[data-y]');if(!b)return;const t=WBS.tiles[WBS.cur],d=SYM.find(x=>x[0]==b.dataset.y);t.sym={m:d[0],n:d[2]?(t.sym&&t.sym.m==d[0]?t.sym.n:d[4]):0,...(t.sym&&t.sym.tx?{tx:1}:{})};store();upd()};
$('symtx').onchange=()=>{const t=WBS.tiles[WBS.cur];t.sym={...(t.sym||{m:'off'})};if($('symtx').checked)t.sym.tx=1;else delete t.sym.tx;WBS.symKey='';store();upd();if(WBX.wbCap)WBX.wbCap()};
$('sn').oninput=e=>{const t=WBS.tiles[WBS.cur];if(t.sym){t.sym.n=+e.target.value;store();upd()}};
$('sbk').onclick=()=>{const t=WBS.tiles[WBS.cur];if(symOf(t).m=='off')return;t.items=expand(t).map(e=>({...e[0]}));t.sym={m:'off',n:0};selOne(-1);store();upd()};
$('sdl').onclick=()=>{if(Q()){delItems([...WBS.msel]);selOne(-1);store();upd()}};

{let ld=null,lsw=false;const L=$('lib');
L.addEventListener('pointerdown',e=>{if(e.button!==0||e.shiftKey||e.ctrlKey||e.metaKey||WBS.lsm)return;const b=e.target.closest('button[data-m]');if(!b)return;ld={k:b.dataset.m,x:e.clientX,y:e.clientY,on:false,g:null}});
document.addEventListener('pointermove',e=>{if(!ld)return;if(!ld.on){if(Math.hypot(e.clientX-ld.x,e.clientY-ld.y)<6)return;ld.on=true;const s=L.querySelector('button[data-m="'+ld.k+'"] svg');if(s){const g=s.cloneNode(true);g.id='mdg';g.style.cssText='position:fixed;width:44px;height:44px;pointer-events:none;z-index:70;opacity:.85;transform:translate(-50%,-50%)';document.body.appendChild(g);ld.g=g}}
if(ld.g){ld.g.style.left=e.clientX+'px';ld.g.style.top=e.clientY+'px';if(WBX.wbLibOver)WBX.wbLibOver(document.elementFromPoint(e.clientX,e.clientY))}});
const lend=e=>{if(!ld)return;const x=ld;ld=null;if(x.g)x.g.remove();if(!x.on)return;lsw=true;setTimeout(()=>{lsw=false},0);if(WBX.wbLibOver)WBX.wbLibOver(null);if(e.type!='pointerup')return;if(WBX.wbLibDrop&&WBX.wbLibDrop(x.k,document.elementFromPoint(e.clientX,e.clientY)))return;const r=ed.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
const p=ed.createSVGPoint();p.x=e.clientX;p.y=e.clientY;let[px,py]=(q=>[q.x,q.y])(p.matrixTransform(ed.getScreenCTM().inverse()));if(grid.sd)[px,py]=snapPt(px,py);[px,py]=wrapP(px,py);const a=WBS.tiles[WBS.cur].items;a.push(it(x.k,px,py,DOTK.has(x.k)?.22:.8,0));selOne(a.length-1);WBS.brush=null;store();upd();if(WBX.wbCap)WBX.wbCap()};
document.addEventListener('pointerup',lend);document.addEventListener('pointercancel',lend);
L.addEventListener('click',e=>{if(lsw){e.stopImmediatePropagation();e.preventDefault()}},true)}
$('lib').onclick=e=>{const x=e.target.closest('[data-x]');if(x){const k=x.dataset.x;if(WBS.tiles.some(t=>t.items.some(q=>q.m==k))){$('pmsg').textContent='That shape is used on a stamp. Remove it from your stamps first.';return}if(!x.dataset.sure){x.dataset.sure=1;x.textContent='?';setTimeout(()=>{if(x.isConnected){delete x.dataset.sure;x.innerHTML='&#215;'}},2500);return}delete cust[k];store();build();$('pmsg').textContent='Removed from the library.';return}const b=e.target.closest('[data-m]');if(!b)return;const k=b.dataset.m;if(WBS.lsm||e.ctrlKey||e.metaKey||e.shiftKey){libPick(k,e);return}WBS.brush=WBS.brush&&WBS.brush.m==k?null:{m:k,s:DOTK.has(k)?.22:.8,r:0};selOne(-1);upd()};
$('tabs').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=+b.dataset.k;if(e.shiftKey){const a=WBS.tAnc!=null?WBS.tiles.findIndex(t=>t.id==WBS.tAnc):WBS.cur,a1=a<0?WBS.cur:a;WBS.tM=new Set(WBS.tiles.slice(Math.min(a1,k),Math.max(a1,k)+1).map(t=>t.id));WBS.cur=k;selOne(-1);upd();return}if(e.ctrlKey||e.metaKey){const st=new Set(tGrp().map(i=>WBS.tiles[i].id)),id=WBS.tiles[k].id;if(st.has(id)&&st.size>1){st.delete(id);WBS.cur=WBS.tiles.findIndex(t=>st.has(t.id))}else{st.add(id);WBS.cur=k}WBS.tM=st;WBS.tAnc=id;selOne(-1);upd();return}WBS.tM=new Set();WBS.tAnc=WBS.tiles[k].id;WBS.cur=k;selOne(-1);upd()};
$('tabs').onmousedown=e=>{if(e.shiftKey)e.preventDefault()};
{const T=$('tabs');let d=null,sw=false;
const clr=()=>{T.classList.remove('tdrag');T.querySelectorAll('.tgh').forEach(b=>b.classList.remove('tgh'));const l=document.getElementById('tdl');if(l)l.remove()};
const slot=e=>{const bs=[...T.querySelectorAll('[data-k]')];let i=bs.length;for(let k=0;k<bs.length;k++){const r=bs[k].getBoundingClientRect();if(e.clientY<r.bottom&&e.clientX<r.left+r.width/2){i=k;break}}return[i,bs]};
T.addEventListener('pointerdown',e=>{if(e.button!==0||e.shiftKey||e.ctrlKey||e.metaKey)return;const b=e.target.closest('[data-k]');if(!b)return;d={k:+b.dataset.k,x:e.clientX,y:e.clientY,on:false,i:null}});
document.addEventListener('pointermove',e=>{if(!d)return;if(!d.on){if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<6)return;d.on=true;T.classList.add('tdrag');const g=tGrp(),mv=g.length>1&&g.includes(d.k)?g:[d.k];[...T.querySelectorAll('[data-k]')].forEach(b=>{if(mv.includes(+b.dataset.k))b.classList.add('tgh')})}
const[i,bs]=slot(e);d.i=i;let l=document.getElementById('tdl');if(!l){l=document.createElement('div');l.id='tdl';l.className='tdl';document.body.appendChild(l)}if(!bs.length)return;const a=bs[Math.max(0,i-1)].getBoundingClientRect(),c=bs[Math.min(bs.length-1,i)].getBoundingClientRect();let lx,r0;if(i<=0){lx=c.left-4;r0=c}else if(i>=bs.length){lx=a.right+4;r0=a}else if(Math.abs(a.top-c.top)<4){lx=(a.right+c.left)/2;r0=a}else{lx=c.left-4;r0=c}l.style.left=(lx-1.5)+'px';l.style.top=r0.top+'px';l.style.height=r0.height+'px'});
document.addEventListener('pointerup',e=>{if(!d)return;const x=d;d=null;if(!x.on){return}sw=true;setTimeout(()=>{sw=false},0);clr();
const g=tGrp(),mv=g.length>1&&g.includes(x.k)?g:[x.k],i=x.i==null?WBS.tiles.length:x.i,ii=i-mv.filter(k=>k<i).length,moved=mv.map(k=>WBS.tiles[k]),dragged=WBS.tiles[x.k],rest=WBS.tiles.filter((t,k)=>!mv.includes(k));
rest.splice(ii,0,...moved);if(rest.every((t,k)=>t===WBS.tiles[k]))return;
WBS.tiles.splice(0,WBS.tiles.length,...rest);WBS.cur=WBS.tiles.indexOf(dragged);if(mv.length<2)WBS.tM=new Set();selOne(-1);store();upd()});
document.addEventListener('pointercancel',()=>{if(d){d=null;clr()}});
T.addEventListener('click',e=>{if(sw){e.stopImmediatePropagation();e.preventDefault();sw=false}},true);
document.addEventListener('keydown',e=>{if(d&&d.on&&e.key=='Escape'){d=null;clr()}})}
$('addT').onclick=()=>{const t={id:WBS.nid++,items:[],sh:{k:'rect',o:'p',s:[1,1],z:100},sym:{m:'off'},et:0,er:0,es:Math.floor(Math.random()*999),tu:[]};WBS.tiles.push(t);addSt(t);WBS.cur=WBS.tiles.length-1;selOne(-1);store();upd();pmsg('New stamp added to '+layName()+'.')};
$('dupT').onclick=()=>{const g=tGrp(),pid=WBS.tiles[WBS.cur].id,cps=[];let pc=null;g.slice().reverse().forEach(k=>{const t=JSON.parse(JSON.stringify(WBS.tiles[k]));t.id=WBS.nid++;WBS.tiles.splice(k+1,0,t);cps.push(t.id);if(WBS.tiles[k].id==pid)pc=t.id});WBS.cur=WBS.tiles.findIndex(t=>t.id==pc);WBS.tM=cps.length>1?new Set(cps):new Set();cps.forEach(id=>addSt({id}));selOne(-1);store();upd();pmsg((cps.length>1?'Stamps duplicated':'Stamp duplicated')+' and added to '+layName()+'.')};
$('delT').onclick=()=>{const g=tGrp();if(WBS.tiles.length>g.length){const ids=g.map(k=>WBS.tiles[k].id);g.slice().reverse().forEach(k=>WBS.tiles.splice(k,1));WBS.layers.forEach(L=>L.st=L.st.filter(x=>!ids.includes(x)));WBS.tM=new Set();WBS.cur=Math.min(g[0],WBS.tiles.length-1);selOne(-1);store();upd()}};
}
export {paintGhost,pvView,pvZ,renderML,sync,init13};
