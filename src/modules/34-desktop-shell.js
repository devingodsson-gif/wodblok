import {ICN} from './00-icons.js';
import {kv} from '../platform/index.js';
import {cmdGet,cmdIsEnabled,cmdRun} from '../commands/registry.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {DRT,NODRAFT,drOff} from './02-draft-mode-speedups.js';
import {CH,CW,SH,SHN,SW,bk,closeDD,placeFloat,rowMenu,setDim,shOf,wrapP} from './04-canvas-and-stamp-outlines.js';
import {trayIn} from './50-tray-core.js';
import {flatEls,oneLayer,selOne,store} from './06-motif-library-folders.js';
import {nr,symOf,tbSync} from './07-symmetry.js';
import {migLayers} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {QS,doSplit} from './12-selection-and-split.js';
import {sync} from './13-preview-and-stamp-tool.js';
import {LY} from './14-presets-and-layer-grid-ui.js';
import {txClean} from './16-texture-generators.js';
import {buildTex,saveTex,texNorm} from './17-texture-panel-and-previews.js';
import {coreStr,dirty,paintPst,pgFix,pmsg,thumb} from './18-projects-and-cover-overlay.js';
import {randomize,wbBA} from './20-before-after-and-randomizer.js';
import {clearAll} from './33-clear.js';
import {stUnlocked} from './63-stamp-tool.js';
import {lyDupSel} from './32-layers-panel.js';
import {elDef,elKind,fxDef} from './65-element-core.js';

function init34(){// ===== Desktop shell: panels, views, zoom, number fields, menus, undo/redo, shortcuts =====
(()=>{
const PN={tex:'Textures',slib:'Stamp library',text:'Text',lyrs:'Elements',canvas:'Canvas',colors:'Colours',stamp:'Stamp settings',motifs:'Shape',layers:'Pattern',cover:'Book cover'};
let panel='canvas',z=0,fitS=1;try{panel=kv.get('wb24_panel')||'canvas';if(!PN[panel])panel='canvas'}catch(e){}

// ===== Workspace: one set of panels. Panels live in groups (tabs).
// Groups are docked on the left, right, top or bottom edge of the window, or float over the stage. Drag a tab or a group's title bar to move it:
// drop on another group's title bar to tab it in, on a dock to stack it there, on an empty window edge to open a dock, anywhere else to float it.
const PNAME={xrec:'Export',slib:'Stamp library',text:'Text',lyrs:'Elements',canvas:'Canvas',colors:'Colours',stamp:'Stamp settings',motifs:'Shape',image:'Image',sheet:'Sheet',elpaint:'Paint',layers:'Pattern',stmp:'Stamp',pgrid:'Grid',rand:'Randomize',hist:'History'};
// the element panels open from the element bar only (owner, Oct 20 2026): no rail button, not in the tool repository
const EL_ONLY=['layers','stmp','motifs','image','sheet','text','elpaint'];
// Element panels (2.3.0; 2.6.0 shows each under its own name, not as one "Properties" tab): every element panel opens in one group, right under the Elements list
const ELP=EL_ONLY,wsIsP=g=>!!g&&g.tabs.length>0&&g.tabs.every(p=>ELP.includes(p));
const MODEP={pattern:['lyrs','layers','stmp','motifs','image','sheet','elpaint','text','pgrid','canvas','colors','rand','hist','xrec']};
let wsReady=false,wsZ=10,wd=null,wsJust=0;
const wsG=(tabs,o={})=>({id:'g'+Math.random().toString(36).slice(2,9),tabs,a:tabs[0],f:1,e:'r',...o});
const wsDef=()=>({dock:[wsG(['lyrs'],{f:.85,lk:1}),wsG(['layers']),wsG(['canvas','colors'],{f:.8})],float:[]});   // Elements, Properties, then the document tools (three groups, three random ids as before)
let WS={pattern:wsDef()};
try{const sv=JSON.parse(kv.get('wb30_ws')||'null');if(sv)['pattern'].forEach(m=>{const L=sv[m];if(!L||!Array.isArray(L.dock)||!Array.isArray(L.float))return;const seen=new Set(),ok=g=>{if(!g||!Array.isArray(g.tabs))return false;g.tabs=g.tabs.filter(p=>MODEP[m].includes(p)&&!seen.has(p)&&seen.add(p));if(!g.tabs.includes(g.a))g.a=g.tabs[0];g.id=String(g.id||wsG([]).id);g.f=+g.f||1;if(g.lk===undefined&&g.tabs.includes('lyrs'))g.lk=1;return g.tabs.length>0};WS[m]={dock:L.dock.filter(g=>ok(g)&&g.id!='gstmp'),float:L.float.filter(ok)}})}catch(e){}   // gstmp: the Stamp panel of a stamp's tab (2.79.3); no tab is open at launch

// 2.55.0 (owner Oct 26 2026): "every panel opens on the left by default (the Elements list on the right), and panels remember where they were opened".
// Each panel's last place is kept across sessions: its dock edge and the panels it shared a group with, or its floating box. A panel with no place yet opens on
// the side set in Settings > General > Open panels on (wb255_pside, default left).
let wsMem={},wsN=0;try{const m=JSON.parse(kv.get('wb255_pmem')||'null');if(m&&typeof m=='object')wsMem=m}catch(e){}
const wsSide=()=>{let v='';try{v=kv.get('wb255_pside')||''}catch(e){}return v=='r'?'r':'l'};
const wsRemember=()=>{const L=WS.pattern;L.float.forEach(g=>g.tabs.forEach(p=>{wsMem[p]={fl:{x:g.x,y:g.y,w:g.w,h:g.h},with:g.tabs.filter(t=>t!=p)}}));L.dock.forEach(g=>g.tabs.forEach(p=>{wsMem[p]={e:g.e||'r',with:g.tabs.filter(t=>t!=p)}}));try{kv.set('wb255_pmem',JSON.stringify(wsMem))}catch(e){}};
const wsSave=()=>{wsRemember();try{kv.set('wb30_ws',JSON.stringify(WS))}catch(e){}};
const wsL=()=>WS.pattern;
const wsAll=()=>[...wsL().dock,...wsL().float];
const wsFind=p=>wsAll().find(g=>g.tabs.includes(p))||null;
const wsGroup=id=>wsAll().find(g=>g.id==id)||null;
const wsDetach=g=>{const L=wsL();['dock','float'].forEach(k=>{const i=L[k].indexOf(g);if(i>=0)L[k].splice(i,1)})};
const wsSec=p=>document.querySelector(`section.pn[data-p="${p}"]`);
const wsStash=document.createElement('div'),wsFl=document.createElement('div'),wsInd=document.createElement('div'),wsTint=document.createElement('div');
const wsDk={},wsBox={},wsZn={},WS_E=['l','li','ri','r','t','b'],wsVt=k=>k!='t'&&k!='b',wsOut=k=>k=='li'?'l':k=='ri'?'r':k;
{const R=document.querySelector('aside.dock');R.classList.add('dk','dk-r');R.dataset.e='r';wsDk.r=R;wsBox.r=R.querySelector('.dock-b');
// 2.79.3 (owner Oct 31 2026: "panels ... attached to each other ... docked next to the other one"): beside the left and the right dock stands an inner column of its own,
// 'li' and 'ri', a dock like the others (its groups, splitters and width); it shows only while its outer dock does
['l','li','ri','t','b'].forEach(k=>{const a=document.createElement('aside');a.className='dock dk dk-'+k;a.dataset.e=k;a.hidden=true;const b=document.createElement('div');b.className='dock-b';a.appendChild(b);$('app').appendChild(a);wsDk[k]=a;wsBox[k]=b});
WS_E.forEach(k=>{const b=wsBox[k];b.classList.add('wsd');if(k=='t'||k=='b')b.classList.add('hz');const h=document.createElement('div');h.className='wed';h.title='Resize';wsDk[k].appendChild(h);
const z=document.createElement('div');z.className='wzn';z.dataset.e=k;z.hidden=true;document.body.appendChild(z);wsZn[k]=z})}
wsBox.r.id='wsdock';
// size of each dock (width for left/right, height for top/bottom), kept per mode for this session only
const wsSz=k=>{const L=wsL();return(L.sz&&L.sz[k])||{l:316,li:300,ri:300,r:316,t:260,b:260}[k]};
const wsClampSz=(k,v)=>{const hz=k=='t'||k=='b',os=hz?[k=='t'?'b':'t']:WS_E.filter(o=>o!=k&&wsVt(o)),oth=os.reduce((n,o)=>n+(wsDk[o]&&!wsDk[o].hidden?wsSz(o):0),0),mn=hz?110:200,mx=hz?innerHeight-46-26-330-oth:innerWidth-44-420-oth;return Math.round(Math.max(mn,Math.min(v,Math.max(mn,mx))))};
const wsSetSz=(k,v)=>{const L=wsL();v=wsClampSz(k,v);(L.sz=L.sz||{})[k]=v;if(k=='t'||k=='b')wsDk[k].style.height=v+'px';else wsDk[k].style.width=v+'px'};
// put a group into one edge's stack at position i (i past the end means last)
const wsDockIns=(L,g,k,i)=>{g.e=k;g.f=1;L.dock.forEach(x=>{if((x.e||'r')==k)x.f=1});const el=L.dock.filter(x=>x!==g&&(x.e||'r')==k);if(i>=el.length){const last=el[el.length-1];if(last)L.dock.splice(L.dock.indexOf(last)+1,0,g);else L.dock.push(g)}else L.dock.splice(L.dock.indexOf(el[i]),0,g)};
// the strip of window that docks can use: the full width (2.44.0: no rail), below the top bar, above the status bar
function wsWR(){const rl={right:0},tp=document.querySelector('.top').getBoundingClientRect(),sb=document.querySelector('.status').getBoundingClientRect();
return{ox0:rl.right,ox1:innerWidth,y0:tp.bottom,y1:sb.top,x0:!wsDk.li.hidden?wsDk.li.getBoundingClientRect().right:wsDk.l.hidden?rl.right:wsDk.l.getBoundingClientRect().right,x1:!wsDk.ri.hidden?wsDk.ri.getBoundingClientRect().left:wsDk.r.hidden?innerWidth:wsDk.r.getBoundingClientRect().left}}
// which empty window edge the pointer is close to (null if none)
function wsEdgeAt(e){const W=wsWR(),T=56,x=Math.max(W.ox0,Math.min(W.ox1,e.clientX)),y=Math.max(W.y0,Math.min(W.y1,e.clientY));let best=null,bd=T;
const c=(k,d,ok)=>{if(ok&&wsDk[k].hidden&&d>=0&&d<bd){bd=d;best=k}};
c('l',x-W.ox0,true);c('r',W.ox1-x,true);c('t',y-W.y0,x>=W.x0&&x<=W.x1);c('b',W.y1-y,x>=W.x0&&x<=W.x1);
if(!wsDk.l.hidden){const d=x-wsDk.l.getBoundingClientRect().right;c('li',Math.abs(d),d>-24)}if(!wsDk.r.hidden){const d=wsDk.r.getBoundingClientRect().left-x;c('ri',Math.abs(d),d>-24)}return best}   // the inner edge of a dock (2.79.3)
// drop zones: a faint strip on every empty edge while dragging; the chosen one opens up to the size the dock would have
function wsZones(hot){const W=wsWR();WS_E.forEach(k=>{const z=wsZn[k],emp=wsDk[k].hidden&&(wsOut(k)==k||!wsDk[wsOut(k)].hidden);z.hidden=!emp;if(!emp)return;const th=hot==k?wsClampSz(k,wsSz(k)):26,s=z.style;
if(k=='li'||k=='ri'){const r=wsDk[wsOut(k)].getBoundingClientRect();s.left=(k=='li'?r.right:r.left-th)+'px';s.top=W.y0+'px';s.width=th+'px';s.height=(W.y1-W.y0)+'px'}
else if(k=='l'||k=='r'){s.left=(k=='l'?W.ox0:W.ox1-th)+'px';s.top=W.y0+'px';s.width=th+'px';s.height=(W.y1-W.y0)+'px'}
else{s.left=W.x0+'px';s.top=(k=='t'?W.y0:W.y1-th)+'px';s.width=(W.x1-W.x0)+'px';s.height=th+'px'}
z.classList.toggle('hot',hot==k)})}
wsStash.hidden=true;wsFl.id='wsfl';wsInd.id='wsind';wsInd.hidden=true;wsTint.id='wstint';wsTint.hidden=true;document.body.append(wsStash,wsFl,wsTint,wsInd);
const IC={col:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.chevD+'</svg>',
exp:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.chevR+'</svg>',
pop:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.popout+'</svg>',
dock:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.panels+'</svg>',
x:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.close+'</svg>',
lk:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.lock+'</svg>',
ul:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.unlock+'</svg>'};
const wsNarrow=()=>innerWidth<=860;
function wsClamp(g){const st=document.querySelector('.stage').getBoundingClientRect();if(g.x==null){if(g.pos=='bc'){g.x=Math.round(st.left+(st.width-(+g.w||300))/2);g.y=Math.round(st.bottom-(parseFloat(getComputedStyle(document.querySelector('.stage')).getPropertyValue('--film-h'))||79)-12-(+g.h||420))}else{const r=g.pos=='r'||g.pos=='rb';g.x=Math.round(r?st.right-(+g.w||300)-12:st.left+12);g.y=Math.round(st.top+52+(g.pos=='rb'?392:0))}}
g.w=Math.max(200,Math.min(+g.w||300,innerWidth-20));g.h=Math.max(120,Math.min(+g.h||420,innerHeight-60));g.x=Math.max(-g.w+80,Math.min(g.x,innerWidth-80));g.y=Math.max(0,Math.min(g.y,innerHeight-36));if(g.y+g.h>innerHeight-8)g.y=Math.max(0,innerHeight-8-g.h);g.h=Math.min(g.h,innerHeight-8-g.y)}
// 2.76.8 (2.76 review: "panel tabs pile up"): a group shows at most four tabs, and fewer when they do not fit; the open one always shows. The others fold, from
// the end, into a More tabs menu at the end of the strip (wsTabFold, run with the fit)
const WS_TABS=4;
function wsTabFold(t){const h=t.parentElement,more=h.querySelector('[data-act="tmore"]'),tabs=[...t.querySelectorAll('.wtab')],x=b=>{const n=b.nextElementSibling;return n&&n.classList.contains('wtx')?n:null};
 tabs.forEach(b=>{if(b.hidden){b.hidden=false;const c=x(b);if(c)c.hidden=false}});if(more)more.hidden=true;if(tabs.length<2)return;
 let vis=tabs.length;const one=()=>{for(let i=tabs.length-1;i>=0;i--){const b=tabs[i];if(!b.hidden&&!b.classList.contains('on')){b.hidden=true;const c=x(b);if(c)c.hidden=true;vis--;if(more)more.hidden=false;return true}}return false};
 while(vis>WS_TABS&&one());while(t.scrollWidth>t.clientWidth+1&&vis>1&&one());}
function wsEl(g,fl){const el=document.createElement('div');el.className='wg'+(fl?' fl':'')+(g.col?' col':'');el.dataset.g=g.id;
if(fl){wsClamp(g);el.style.cssText=`left:${g.x}px;top:${g.y}px;width:${g.w}px;${g.col?'':`height:${g.h}px;`}z-index:${++wsZ}`}else el.style.flexGrow=g.f;
el.innerHTML=`<div class="wh"><button type="button" class="wb wta l" data-act="tl" aria-label="Earlier tabs"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.chevL}</svg></button><div class="wt">${g.tabs.map(p=>`<button type="button" class="wtab${p==g.a?' on':''}" data-t="${p}">${PNAME[p]}</button>${g.tabs.length>1&&!g.lk?`<button type="button" class="wb wtx" data-act="tclose" data-tx="${p}" aria-label="Close ${PNAME[p]}">${IC.x}</button>`:''}`).join('')}</div>${g.tabs.length>1?`<button type="button" class="wb wtm" data-act="tmore" aria-haspopup="menu" aria-label="More tabs" hidden><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.more}</svg></button>`:''}<button type="button" class="wb wta r" data-act="tr" aria-label="Later tabs"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.chevR}</svg></button>`+
`<button type="button" class="wb" data-act="lock" aria-pressed="${g.lk?'true':'false'}" aria-label="${g.lk?'Unlock panel':'Lock panel'}">${g.lk?IC.lk:IC.ul}</button><button type="button" class="wb" data-act="col" title="${g.col?'Expand':'Collapse'}">${g.col?IC.exp:IC.col}</button>${g.lk?'':`<button type="button" class="wb" data-act="${fl?'dock':'float'}" title="${fl?'Dock to the side':'Pop out'}">${fl?IC.dock:IC.pop}</button><button type="button" class="wb" data-act="close" title="Close" aria-label="Close">${IC.x}</button>`}</div><div class="wbd"></div>${fl?'<div class="wrs" title="Resize"></div>':''}`;
const bd=el.querySelector('.wbd');g.tabs.forEach(p=>{const sc=wsSec(p);if(sc){sc.classList.toggle('mc',!!sc.querySelector(':scope>details.g'));sc.hidden=p!=g.a;bd.appendChild(sc)}});return el}
function wsRender(){wsReady=true;const L=wsL(),nar=wsNarrow(),dl=nar?[...L.dock,...L.float]:L.dock;
['li','ri'].forEach(k=>{const o=wsOut(k);if(!L.dock.some(g=>g.e==o))L.dock.forEach(g=>{if(g.e==k)g.e=o})});   // an inner column whose outer dock emptied becomes the outer dock
document.querySelectorAll('section.pn').forEach(sc=>wsStash.appendChild(sc));wsFl.innerHTML='';
WS_E.forEach(k=>{const box=wsBox[k],dk=wsDk[k],gs=dl.filter(g=>(nar?'r':(g.e||'r'))==k);box.innerHTML='';
gs.forEach((g,i)=>{if(i){const sp=document.createElement('div');sp.className='wsp';sp.dataset.i=i;box.appendChild(sp)}box.appendChild(wsEl(g,false))});
dk.hidden=!gs.length;if(nar){dk.style.width='';dk.style.height=''}else if(gs.length){const ac=gs.every(g=>g.col);if(wsVt(k))dk.style.width=(ac?Math.min(200,wsClampSz(k,wsSz(k))):wsClampSz(k,wsSz(k)))+'px';else dk.style.height=(ac?34:wsClampSz(k,wsSz(k)))+'px'}});
if(!nar)L.float.forEach(g=>wsFl.appendChild(wsEl(g,true)));
// the openers of the element panels are hidden (their commands check that the button exists, not that it shows); a top bar button that opens a panel is pressed while that panel shows
document.querySelectorAll('#pnop [data-pn]').forEach(b=>{const p=b.dataset.pn;b.hidden=!MODEP.pattern.includes(p)||EL_ONLY.includes(p)});
document.querySelectorAll('[data-opn]').forEach(b=>{const g=wsFind(b.dataset.opn),on=String(!!g&&g.a==b.dataset.opn&&!g.col);if(b.getAttribute('aria-pressed')!=on)b.setAttribute('aria-pressed',on)});
wsTabFit();nums();if(WBX.wbElSync)WBX.wbElSync()}
// a panel with more tabs than fit: the chosen tab is scrolled into view and the edge that hides more tabs fades
function wsTabEdge(t){const h=t.parentElement;h.classList.toggle('ovr',t.scrollLeft+t.clientWidth<t.scrollWidth-1);h.classList.toggle('ovl',t.scrollLeft>1)}
function wsTabFit(){document.querySelectorAll('.wh .wt').forEach(t=>{wsTabFold(t);for(let k=0;k<3;k++){wsTabEdge(t);const a=t.querySelector('.wtab.on');if(!a)break;let m=0;if(a.offsetLeft+a.offsetWidth>t.scrollLeft+t.clientWidth){t.scrollLeft=a.offsetLeft+a.offsetWidth-t.clientWidth;m=1}else if(a.offsetLeft<t.scrollLeft){t.scrollLeft=a.offsetLeft;m=1}wsTabEdge(t);if(!m)break}})}   // the arrows (2.26.0) change the strip's width as they show or hide, so fit again until the open tab is in view
document.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('wt'))wsTabEdge(e.target)},true);
addEventListener('resize',()=>{if(wsReady)wsTabFit()});
// tabs and buttons
document.addEventListener('click',e=>{const w=e.target.closest('.wg');if(!w||performance.now()-wsJust<250)return;const g=wsGroup(w.dataset.g);if(!g)return;
const b=e.target.closest('.wb');if(b){const a=b.dataset.act,r=w.getBoundingClientRect();
if(a=='tmore'){rowMenu(b,[...w.querySelectorAll('.wt .wtab[hidden]')].map(t=>t.dataset.t).map(p=>[PNAME[p],()=>{g.a=p;g.col=false;panel=p;wsSave();wsRender()}]));return}
if(a=='tl'||a=='tr'){const t=w.querySelector('.wt');if(t)t.scrollBy({left:(a=='tl'?-1:1)*Math.max(80,Math.round(t.clientWidth*.7)),behavior:'smooth'});return}   /* 2.26.0: more tabs than fit */
if(a=='lock')g.lk=g.lk?0:1;else if(g.lk&&a!='col'){return}else if(a=='col')g.col=!g.col;else if(a=='close'){wsDetach(g)}else if(a=='tclose'){const p=b.dataset.tx,i=g.tabs.indexOf(p);if(i<0)return;g.tabs.splice(i,1);if(g.a==p)g.a=g.tabs[Math.max(0,i-1)];if(!g.tabs.length)wsDetach(g)}   /* 2.60.1 (artist test): each tab of a group closes on its own */else if(a=='float'){wsDetach(g);const ek=g.e||'r',hz=ek=='t'||ek=='b',fw=Math.round(hz?Math.min(340,r.width):Math.min(320,r.width)),fh=Math.round(hz?Math.max(300,Math.min(420,innerHeight-120)):Math.min(Math.max(r.height,260),560));Object.assign(g,{x:Math.round(ek=='l'||ek=='li'?r.right+14:ek=='r'||ek=='ri'?r.left-fw-14:r.left),y:Math.max(Math.round(document.querySelector('.stage').getBoundingClientRect().top+56),Math.round(ek=='t'?r.bottom+14:ek=='b'?r.top-fh-14:r.top)),w:fw,h:fh,col:false});wsL().float.push(g)}
else if(a=='dock'){wsDetach(g);g.col=false;g.f=1;wsDockIns(wsL(),g,g.e||'r',1e9)}wsSave();wsRender();return}
const t=e.target.closest('.wtab');if(t){g.a=t.dataset.t;g.col=false;panel=g.a;wsSave();wsRender()}});
// 2.79.1 (owner Oct 31 2026): a panel's sections start folded but for its first one (and the selected element's own group); which ones are open is remembered for each
// panel in this browser, so a panel closed and opened again shows the same sections open
{const K='wb279_secs',key=d=>{const s=d.querySelector(':scope>summary');return(d.id||'')+'|'+(s?s.textContent.trim():'')};let M={};try{M=JSON.parse(kv.get(K)||'{}')||{}}catch(e){M={}}
 document.querySelectorAll('section.pn[data-p]').forEach(sec=>{const p=sec.dataset.p;const top=[...sec.querySelectorAll(':scope>details.g')].find(d=>!d.hidden);[...sec.querySelectorAll(':scope>details.g')].forEach(d=>{const m=M[p]&&M[p][key(d)];d.open=m!=null?!!m:(d===top||!!d.querySelector('#lfree'))})});
 document.addEventListener('toggle',e=>{const d=e.target;if(!d||!d.matches||!d.matches('details.g'))return;const sec=d.closest('section.pn[data-p]');if(!sec)return;const p=sec.dataset.p;(M[p]=M[p]||{})[key(d)]=d.open?1:0;try{kv.set(K,JSON.stringify(M))}catch(x){}},true)}
// 2.79.2 (owner Oct 31 2026: "a minimal tooltip which appears very quickly"): an icon-only control's name (its title, or the aria-label of a button that shows no text)
// shows in a small tip 0.3 s after the pointer rests on it, at once when moving on from another tip; the title is lifted while the tip shows so the slow native one does not
// also appear, and is back before any press (so code reading it sees it). Mouse and pen only; a press, a key, the wheel or a scroll hides it
{let tip=null,el=null,tm=0,seen=0;const mo=new MutationObserver(()=>{if(!el)return;const t=el.getAttribute('title');if(t==null)return;el.dataset.wbtip=t;el.removeAttribute('title');if(tip&&!tip.hidden)tip.textContent=t});   // the app renames a control while it is pointed at (Undo's title)
 const hide=()=>{clearTimeout(tm);mo.disconnect();if(el&&el.dataset.wbtip!=null){el.setAttribute('title',el.dataset.wbtip);delete el.dataset.wbtip}el=null;if(tip&&!tip.hidden){tip.hidden=true;seen=performance.now()}};
 const name=x=>{const t=x.dataset.wbtip!=null?x.dataset.wbtip:x.getAttribute('title');if(t)return t;if(x.matches('button,[role=button]')){const tp=x.querySelector('.tip');if(!x.textContent.replace(tp?tp.textContent:'','').trim())return x.getAttribute('aria-label')||''}return''};
 const show=()=>{if(!el||!el.isConnected)return hide();const t=name(el);if(!t)return;if(!tip){tip=document.createElement('div');tip.className='wbtip';tip.setAttribute('role','tooltip');document.body.appendChild(tip)}
  tip.textContent=t;tip.hidden=false;const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight,vw=document.documentElement.clientWidth,vh=innerHeight;let y=r.bottom+4;if(y+h>vh-4)y=r.top-4-h;
  tip.style.left=Math.round(Math.max(4,Math.min(vw-w-4,r.left+r.width/2-w/2)))+'px';tip.style.top=Math.round(Math.max(4,y))+'px'};
 document.addEventListener('pointerover',e=>{if(e.pointerType=='touch')return;const x=e.target.closest&&e.target.closest('[title],[data-wbtip],button[aria-label],[role=button][aria-label]');if(x===el)return;const quick=(tip&&!tip.hidden)||performance.now()-seen<400;hide();if(!x||!name(x))return;el=x;
  const t=x.getAttribute('title');if(t){x.dataset.wbtip=t;x.removeAttribute('title')}mo.observe(x,{attributes:true,attributeFilter:['title']});if(quick)show();else tm=setTimeout(show,300)},true);
 document.addEventListener('pointerout',e=>{if(el&&!(e.relatedTarget&&el.contains(e.relatedTarget))&&el.contains(e.target))hide()},true);
 ['pointerdown','keydown','wheel','scroll'].forEach(k=>addEventListener(k,()=>{if(el){hide();seen=0}},{capture:true,passive:true}))}
// 2.79.3 (owner Oct 31 2026): the Element panel is gone (2.78.5 offered its tab only while a stamp was open); its section stays as the hidden home of the Element
// group, Align and a stamp's shape list until they move into an element's panel or the Elements list
// floating windows come to the front when touched
document.addEventListener('pointerdown',e=>{const w=e.target.closest('.wg.fl');if(w){w.style.zIndex=++wsZ;const g=wsGroup(w.dataset.g),F=wsL().float,i=F.indexOf(g);if(i>=0&&i<F.length-1){F.splice(i,1);F.push(g);wsSave()}}},true);
// dragging: tabs, title bars, splitters, resize corner
document.addEventListener('pointerdown',e=>{if(e.button!==0)return;const tg=e.target;
const eh=tg.closest('.wed');if(eh){const dk=eh.parentElement,k=dk.dataset.e;e.preventDefault();eh.classList.add('on');document.body.classList.add('wsedge');wd={k:'edge',h:eh,e:k,sx:e.clientX,sy:e.clientY,s0:dk.getBoundingClientRect()[k=='t'||k=='b'?'height':'width'],on:true};return}
const sp=tg.closest('.wsp');if(sp){const a=sp.previousElementSibling,b=sp.nextElementSibling,ga=wsGroup(a.dataset.g),gb=wsGroup(b.dataset.g);if(!ga||!gb||ga.col||gb.col)return;e.preventDefault();const hz=sp.parentElement.classList.contains('hz');wd={k:'split',sp,a,b,ga,gb,hz,ha:hz?a.getBoundingClientRect().width:a.getBoundingClientRect().height,hb:hz?b.getBoundingClientRect().width:b.getBoundingClientRect().height,sy:hz?e.clientX:e.clientY,on:true};sp.classList.add('on');return}
const rs=tg.closest('.wrs');if(rs){const w=rs.closest('.wg');e.preventDefault();wd={k:'size',w,g:wsGroup(w.dataset.g),sx:e.clientX,sy:e.clientY,r:w.getBoundingClientRect(),on:true};return}
const h=tg.closest('.wg .wh');if(!h||tg.closest('.wb'))return;const el=h.closest('.wg'),g=wsGroup(el.dataset.g);if(!g||g.lk)return;const tab=tg.closest('.wtab');
wd={k:'move',g,el,p:tab?tab.dataset.t:null,sx:e.clientX,sy:e.clientY,on:false,fl:el.classList.contains('fl'),r:el.getBoundingClientRect(),t:null}});
function wsTarget(e){wsInd.hidden=true;wsTint.hidden=true;document.querySelectorAll('.wg.wdrop').forEach(x=>x.classList.remove('wdrop'));document.querySelectorAll('.dk.dropz').forEach(x=>x.classList.remove('dropz'));wsZones(null);
const x=document.elementFromPoint(e.clientX,e.clientY);if(!x)return{k:'float'};const tb=x.closest('.wg .wh'),own=wd.whole?wd.el:null;
if(tb){const w=tb.closest('.wg');if(w!==own&&!(w===wd.el&&!wd.whole)){w.classList.add('wdrop');return{k:'merge',g:wsGroup(w.dataset.g)}}}
if(wsNarrow())return{k:'float'};
{const z=wsEdgeAt(e);if(z=='li'||z=='ri'){wsZones(z);return{k:'dock',e:z,i:1e9}}}   // the inner edge of a dock: a column beside it (2.79.3)
const dk=x.closest('.dk');
if(dk&&!dk.hidden){const ed=dk.dataset.e,box=wsBox[ed],vert=wsVt(ed),gs=[...box.querySelectorAll(':scope>.wg')].filter(w=>w!==own),br=box.getBoundingClientRect(),cur=vert?e.clientY:e.clientX;
let i=gs.length;for(let k=0;k<gs.length;k++){const r=gs[k].getBoundingClientRect();if(cur<(vert?r.top+r.height/2:r.left+r.width/2)){i=k;break}}
const same=!!wd.whole&&!wd.fl&&(wd.g.e||'r')==ed,mr=same?wd.el.getBoundingClientRect():null,inMine=!!mr&&e.clientX>=mr.left&&e.clientX<=mr.right&&e.clientY>=mr.top&&e.clientY<=mr.bottom,p=same?wsL().dock.filter(x=>(x.e||'r')==ed).indexOf(wd.g):-1;
const hk=gs.find(w=>{const r=w.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom});
// over the panel being moved, or a spot that would leave it where it already is: nothing to preview; next to another panel that means joining it as a tab
if(inMine)return{k:'noop'};
if(same&&i==p){if(hk){hk.classList.add('wdrop');return{k:'merge',g:wsGroup(hk.dataset.g)}}return{k:'noop'}}
if(!gs.length)dk.classList.add('dropz');
else{const n=gs.length,sz=vert?br.height:br.width,sl=sz/(n+1),st=(vert?br.top:br.left)+i*sl;wsTint.hidden=false;wsInd.hidden=false;
const r=hk&&hk.getBoundingClientRect(),first=hk?cur<(vert?r.top+r.height/2:r.left+r.width/2):false,ln=hk&&first?st+sl:st;
wsTint.style.cssText=vert?`left:${br.left+3}px;width:${br.width-6}px;top:${st+2}px;height:${sl-4}px`:`top:${br.top+3}px;height:${br.height-6}px;left:${st+2}px;width:${sl-4}px`;
wsInd.style.cssText=vert?`left:${br.left+2}px;width:${br.width-4}px;top:${Math.max(br.top,Math.min(ln-2,br.bottom-4))}px`:`top:${br.top+2}px;height:${br.height-4}px;width:4px;left:${Math.max(br.left,Math.min(ln-2,br.right-4))}px`}
return{k:'dock',e:ed,i}}
const z=wsEdgeAt(e);if(z){wsZones(z);return{k:'dock',e:z,i:1e9}}
return{k:'float'}}
document.addEventListener('pointermove',e=>{if(!wd||wd.cancel)return;
if(wd.k=='edge'){const k=wd.e,d=k=='r'||k=='ri'?wd.sx-e.clientX:k=='l'||k=='li'?e.clientX-wd.sx:k=='b'?wd.sy-e.clientY:e.clientY-wd.sy;wsSetSz(k,wd.s0+d);return}
if(wd.k=='split'){const dy=(wd.hz?e.clientX:e.clientY)-wd.sy,mn=wd.hz?160:80,ha=Math.max(mn,wd.ha+dy),hb=Math.max(mn,wd.hb-(ha-wd.ha)),tot=wd.ga.f+wd.gb.f;wd.ga.f=tot*ha/(ha+hb);wd.gb.f=tot-wd.ga.f;wd.a.style.flexGrow=wd.ga.f;wd.b.style.flexGrow=wd.gb.f;return}
if(wd.k=='size'){wd.g.w=Math.max(200,Math.round(wd.r.width+e.clientX-wd.sx));wd.g.h=Math.max(120,Math.round(wd.r.height+e.clientY-wd.sy));wd.w.style.width=wd.g.w+'px';wd.w.style.height=wd.g.h+'px';return}
if(!wd.on){if(Math.hypot(e.clientX-wd.sx,e.clientY-wd.sy)<6)return;wd.on=true;wd.whole=!wd.p||wd.g.tabs.length==1;document.body.classList.add('wsdrag');
if(wd.whole&&wd.fl){wd.live=true;wd.el.classList.add('lift');wd.ox=wd.sx-wd.r.left;wd.oy=wd.sy-wd.r.top}
else{wd.gh=document.createElement('div');wd.gh.className='wghost';wd.gh.textContent=wd.whole?wd.g.tabs.map(p=>PNAME[p]).join(' · '):PNAME[wd.p];document.body.appendChild(wd.gh);wd.ox=40;wd.oy=14;if(wd.whole)wd.el.classList.add('lift')}}
if(wd.live){wd.el.style.left=(e.clientX-wd.ox)+'px';wd.el.style.top=Math.max(0,e.clientY-wd.oy)+'px'}else{wd.gh.style.left=(e.clientX+12)+'px';wd.gh.style.top=(e.clientY+10)+'px'}
wd.t=wsTarget(e)});
document.addEventListener('pointerup',e=>{if(!wd)return;const d=wd;wd=null;
if(d.k=='split'){d.sp.classList.remove('on');wsSave();return}if(d.k=='size'){wsSave();return}if(d.k=='edge'){d.h.classList.remove('on');document.body.classList.remove('wsedge');wsSave();return}
if(!d.on)return;wsJust=performance.now();document.body.classList.remove('wsdrag');if(d.gh)d.gh.remove();wsInd.hidden=true;wsTint.hidden=true;document.querySelectorAll('.dk.dropz').forEach(x=>x.classList.remove('dropz'));document.querySelectorAll('.wg.wdrop').forEach(x=>x.classList.remove('wdrop'));
if(d.cancel){wsRender();return}
const t=d.t||{k:'float'},L=wsL();
if(t.k=='noop'||(t.k=='merge'&&t.g===d.g)){wsRender();return}
let mv;if(d.whole){wsDetach(d.g);mv=d.g}else{const i=d.g.tabs.indexOf(d.p);d.g.tabs.splice(i,1);if(d.g.a==d.p)d.g.a=d.g.tabs[Math.max(0,i-1)];mv=wsG([d.p])}
if(t.k=='merge'){t.g.tabs.push(...mv.tabs);t.g.a=mv.a||mv.tabs[0];t.g.col=false}
else if(t.k=='dock'){mv.col=false;mv.f=1;wsDockIns(L,mv,t.e||'r',t.i)}
else{if(!(d.whole&&d.fl)){mv.w=Math.round(d.whole?Math.min(360,Math.max(240,d.r.width)):300);mv.h=Math.round(d.whole?Math.min(560,Math.max(220,d.r.height)):440);mv.col=false}mv.x=Math.round(e.clientX-d.ox);mv.y=Math.round(Math.max(0,e.clientY-d.oy));L.float.push(mv)}
wsSave();wsRender()});
document.addEventListener('keydown',e=>{if(e.key!='Escape'||!wd||wd.k!='move'||!wd.on||wd.cancel)return;e.stopImmediatePropagation();e.preventDefault();wd.cancel=true;wd.t=null;document.body.classList.remove('wsdrag');if(wd.gh)wd.gh.remove();wsInd.hidden=true;wsTint.hidden=true;wsZones(null);document.querySelectorAll('.dk.dropz,.wg.wdrop').forEach(x=>x.classList.remove('dropz','wdrop'));if(wd.live)wsRender();else if(wd.el)wd.el.classList.remove('lift')},true);
// On phones the on-screen keyboard resizes the window. Rebuilding the panels then throws away the field being typed in, so the keyboard closed at once.
// While a text field has focus the panels are left alone, and they are laid out again when you leave it.
const typing=()=>{const a=document.activeElement;if(!a||a===document.body)return false;return a.isContentEditable||a.tagName=='TEXTAREA'||a.tagName=='SELECT'||(a.tagName=='INPUT'&&!/^(checkbox|radio|button|submit|range|file|color|image|reset)$/i.test(a.type||'text'))};
let wsRT=0,wsPend=false;addEventListener('resize',()=>{clearTimeout(wsRT);wsRT=setTimeout(()=>{if(!wsReady)return;if(typing()){wsPend=true;return}wsRender()},150)});
addEventListener('focusout',()=>{setTimeout(()=>{if(wsPend&&!typing()){wsPend=false;if(wsReady)wsRender()}},300)});
const stage=document.querySelector('.stage');
function setView(){if(window.bkZ)requestAnimationFrame(()=>bkZ());$('boardP').classList.remove('off');$('zoomc').style.display='';requestAnimationFrame(applyZ);tbSync();if(WBX.wbTxMode)WBX.wbTxMode(stUnlocked()==null?'pattern':'stamp');wsRender()}
function setPanel(p,bot){if(!PNAME[p])p='canvas';if(!wsReady)setView();
const L=wsL();let g=wsFind(p);
// where a panel that is not open goes (2.55.0): back to its remembered place (beside a panel it shared a group with, else its edge or its floating box);
// with none, the side set in Settings. An element panel joins the open element panels' group; Randomize goes beside the colour tools. Locked groups take no new tab.
if(!g){const m=wsMem[p],e=m&&m.e?m.e:wsSide(),free=x=>!x.lk;
 // a random group id is drawn in the same cases as before 2.55.0, so the seeded series (and the tests' rolls) stays as it was; other new groups count up
 const own=!ELP.includes(p)&&(p=='rand'||!L.dock.length)?wsG([]):null,nid=()=>own?own.id:'gn'+(++wsN);
 if(m&&m.with&&m.with.length)g=wsAll().find(x=>free(x)&&x.tabs.some(t=>m.with.includes(t)))||null;
 if(!g&&m&&m.fl){g={id:nid(),tabs:[],a:p,f:1,e:'r',x:m.fl.x,y:m.fl.y,w:m.fl.w,h:m.fl.h};L.float.push(g)}
 // Export (2.76.1, owner Oct 29 2026): with no remembered place it pops out in the middle of the window
 if(!g&&p=='xrec'){const w=Math.min(380,Math.max(260,innerWidth-40)),h=Math.round(Math.min(560,Math.max(260,innerHeight-120)));g={id:nid(),tabs:[],a:p,f:1,e:'r',x:Math.round((innerWidth-w)/2),y:Math.round(Math.max(56,(innerHeight-h)/2)),w,h};L.float.push(g)}
 // the Shape panel that opens by itself when a shape is added gets a group of its own (on the panels' side), so the panel you are working in stays in front
 if(!g&&bot){g=wsG([],{e});g.a=p;L.dock.push(g)}   /* a random id here as before 2.55.0 (the seeded series) */
 if(!g&&ELP.includes(p))g=wsAll().find(x=>free(x)&&wsIsP(x))||null;
 if(!g&&p=='rand')g=L.dock.find(x=>free(x)&&x.tabs.includes('colors'))||null;
 if(!g&&!ELP.includes(p))g=L.dock.find(x=>free(x)&&(x.e||'r')==e&&!wsIsP(x))||null;
 if(!g){g={id:ELP.includes(p)?'gprops':nid(),tabs:[],a:p,f:1,e};L.dock.push(g)}
 g.tabs.push(p)}
g.a=p;g.col=false;panel=p;try{kv.set('wb24_panel',p)}catch(e){}
wsSave();wsRender();const el=document.querySelector(`.wg[data-g="${g.id}"]`);if(el&&el.classList.contains('fl'))el.style.zIndex=++wsZ;info();nums()}
WBX.wbOpenPanel=setPanel;
// 2.79.3 (owner Oct 31 2026: "the stamp panel should always be out when the stamp tab mode is opened ... on the right side of the left panel"): opening a stamp's tab
// brings the Stamp panel into a group of its own in the inner column right of the left dock (the left dock itself when it is empty); closing the tabs puts it back
// where it was, or closes it if it was not open, unless it was moved meanwhile
let wsStM=null;
WBX.wbStampDock=on=>{if(!wsReady||wsNarrow())return;const L=wsL(),G='gstmp',mine=()=>L.dock.find(g=>g.id==G&&g.tabs.length==1&&g.tabs[0]=='stmp');
 if(on){const g0=wsFind('stmp');if(g0&&g0.id==G)return;wsStM=g0?{id:g0.id,i:g0.tabs.indexOf('stmp'),a:g0.a==='stmp',e:g0.e,fl:L.float.includes(g0)}:{none:1};
  if(g0){g0.tabs.splice(g0.tabs.indexOf('stmp'),1);if(g0.a=='stmp')g0.a=g0.tabs[0];if(!g0.tabs.length)wsDetach(g0)}
  const g=wsG(['stmp'],{id:G});wsDockIns(L,g,L.dock.some(x=>x.e=='l')?'li':'l',1e9)}
 else{const g=mine(),m=wsStM;wsStM=null;if(!g||!m)return;wsDetach(g);
  if(!m.none){let h=wsGroup(m.id);if(h){h.tabs.splice(Math.min(m.i,h.tabs.length),0,'stmp');if(m.a)h.a='stmp'}else{h=wsG(['stmp']);if(m.fl)L.float.push(Object.assign(h,{x:null}));else wsDockIns(L,h,m.e||'l',1e9)}}}
 wsSave();wsRender()};
WBX.wbApart=pn=>{const a=wsFind('lyrs'),b=wsFind(pn);return!(a&&b&&a===b)};   // false when the panel is a tab beside the Elements list: showing it would hide the list
// The panels the app opens with (2.9.0: the Workspaces tool is gone; this is the one built-in layout, opened at launch). Read the arrangement of the tools, or put one in place (unknown tools are dropped, every tool stays in one place only)
const wsLaunch=()=>({pattern:{dock:[wsG(['canvas','colors'],{e:'l'}),wsG(['lyrs','layers'],{e:'r',lk:1})],float:[]}});
WBX.wbWsSet=o=>{['pattern'].forEach(m=>{const L=o&&o[m];if(!L)return;const seen=new Set(),ok=g=>{if(!g||!Array.isArray(g.tabs))return false;g.tabs=g.tabs.filter(p=>MODEP[m].includes(p)&&!seen.has(p)&&seen.add(p));if(!g.tabs.includes(g.a))g.a=g.tabs[0];g.id=wsG([]).id;g.f=+g.f||1;g.e=g.e||'r';g.col=false;return g.tabs.length>0};
 const c=JSON.parse(JSON.stringify(L));WS[m]={dock:(c.dock||[]).filter(ok),float:(c.float||[]).filter(ok)}});
  wsSave();wsRender();info();nums()};
// The Close all panels button closes every panel that is not locked.
{const b=$('rcls');b.onclick=()=>{const L=wsL();L.dock=L.dock.filter(g=>g.lk);L.float=L.float.filter(g=>g.lk);wsSave();wsRender();pmsg('Closed all panels.')}}
// a panel opener (2.44.0: the hidden openers, and the top bar buttons with data-opn): it opens the panel, and pressing it again while the panel shows closes it.
// A real click only; when the app or a command presses an opener, the panel opens (or stays open).
function wsToggle(p,user){const g=wsFind(p);
if(user&&g&&g.a==p&&!g.col&&!g.lk){const i=g.tabs.indexOf(p);g.tabs.splice(i,1);if(g.a==p)g.a=g.tabs[Math.max(0,i-1)];if(!g.tabs.length)wsDetach(g);wsSave();wsRender();return}
setPanel(p)}
$('pnop').onclick=e=>{const b=e.target.closest('[data-pn]');if(b)wsToggle(b.dataset.pn,e.isTrusted)};
document.querySelectorAll('[data-opn]').forEach(b=>b.addEventListener('click',e=>wsToggle(b.dataset.opn,e.isTrusted)));


// ===== Randomize panel (2.76.3, docs/pattern-plan.md step 0; owner Oct 28 2026: "a Look choice and a few switches"). The Look a roll makes (Any, or one Look; the names are
// 93-randomize-looks.js's RZ_NAMES) and nine switches: the parts a roll makes (Background, Pattern, Focal point, Text, Frame) and what it changes (Colours, Effects,
// Finish, Canvas size). With none of the parts on, a roll reworks what is there (20-before-after-and-randomizer.js). Both are remembered in the settings.
(()=>{const sec=document.querySelector('section.pn[data-p="rand"]'),cs=[...sec.querySelectorAll('[data-rz]')],KEY='wb2763_rz';
try{const z=JSON.parse(kv.get(KEY)||'null');if(z)cs.forEach(c=>{if(c.dataset.rz in z)c.checked=!!z[c.dataset.rz]})}catch(e){}
const get=()=>Object.fromEntries(cs.map(c=>[c.dataset.rz,c.checked?1:0]));
const sync=()=>{const b=$('rzdo');if(b)b.disabled=!cs.some(c=>c.checked)};
const save=()=>{try{kv.set(KEY,JSON.stringify(get()))}catch(e){}sync()};
sec.addEventListener('change',e=>{if(e.target.closest('[data-rz]'))save()});
$('rzall').onclick=()=>{cs.forEach(c=>c.checked=true);save()};$('rznone').onclick=()=>{cs.forEach(c=>c.checked=false);save()};
sync();WBX.wbRZ={get,look:()=>{try{return kv.get('wb167_rzlook')||'any'}catch(e){return'any'}}};
{const ls=$('rzlook');if(ls){try{const v=kv.get('wb167_rzlook');if(v&&[...ls.options].some(o=>o.value==v))ls.value=v}catch(e){}ls.addEventListener('change',()=>{try{kv.set('wb167_rzlook',ls.value)}catch(e){}})}}
$('rzdo').onclick=()=>randomize(false);
})();

// ---- zoom
// 2.76.8 (2.76 review): the canvas no longer jumps sideways when the left column opens. While it is fitted to the screen, the left column's width is left out of
// the fit and the canvas is moved back by half of it, so its middle stays where it was; a zoomed canvas keeps its own scroll
const dkL=()=>[...document.querySelectorAll('.dock.dk-l,.dock.dk-li')].reduce((n,d)=>n+Math.round(d.getBoundingClientRect().width),0);
function fitZ(){const b=$('boardP');if(b.classList.contains('off'))return;const w=b.clientWidth-64-dkL(),h=b.clientHeight-64;fitS=Math.max(.05,Math.min(w/CW,h/CH))}
function applyZ(){fitZ();const s=z||fitS;{const sh=z?'':(dkL()?`translateX(${-dkL()/2}px)`:'');if($('artwrap').style.transform!==sh)$('artwrap').style.transform=sh}$('art').style.width=Math.round(CW*s)+'px';$('art').style.height=Math.round(CH*s)+'px';$('artsh').style.width=$('art').style.width;$('artsh').style.height=$('art').style.height;$('zl').textContent=Math.round(s*100)+'%';$('zl').title=z?'Fit to screen':'Fitted to screen';if(window.bkZ)bkZ();if(WBX.wbZoomed)WBX.wbZoomed()}
function zoomAt(ns,cx,cy){const b=$('boardP'),a=$('art'),r0=a.getBoundingClientRect(),fx=(cx-r0.left)/(r0.width||1),fy=(cy-r0.top)/(r0.height||1);z=Math.min(8,Math.max(.1,ns));applyZ();const r1=a.getBoundingClientRect();b.scrollLeft+=r1.left+fx*r1.width-cx;b.scrollTop+=r1.top+fy*r1.height-cy}
const zoomMid=f=>{const r=$('boardP').getBoundingClientRect();zoomAt((z||fitS)*f,r.left+r.width/2,r.top+r.height/2)};
WBX.wbApplyZ=applyZ;WBX.wbZoomAt=zoomAt;WBX.wbZoomTo=s=>{const r=$('boardP').getBoundingClientRect();zoomAt(s,r.left+r.width/2,r.top+r.height/2)};WBX.wbZoomNow=()=>z||fitS;WBX.wbZoomIn=()=>!!z&&z>fitS*1.001;
$('zi').onclick=()=>zoomMid(1.25);$('zo').onclick=()=>zoomMid(1/1.25);$('zl').onclick=()=>{z=0;applyZ()};
// 2.76.11 (2.76 review: "Ctrl+wheel zooms in small steps"): Ctrl/Cmd+wheel goes up or down one clear zoom level at a time (Photoshop's ladder); a trackpad's small
// deltas add up to one step, a mouse notch is one step
// 2.77.0: a step goes to the next level at least 5% away, so a fit near a level (95% next to 100%) still moves visibly
const ZLAD=[.05,.1,.125,.167,.25,.333,.5,.667,1,1.5,2,3,4,6,8];let zAcc=0,zAt=0;
$('boardP').addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();const d=e.deltaY*(e.deltaMode==1?33:e.deltaMode==2?400:1),now=performance.now();if(now-zAt>400)zAcc=0;zAt=now;zAcc+=d;if(Math.abs(zAcc)<40)return;
 const up=zAcc<0;zAcc=0;const s=z||fitS,n=up?ZLAD.find(v=>v>s*1.05):[...ZLAD].reverse().find(v=>v<s/1.05);if(n)zoomAt(n,e.clientX,e.clientY)},{passive:false});
try{new ResizeObserver(()=>applyZ()).observe($('boardP'))}catch(e){window.addEventListener('resize',applyZ)}
new MutationObserver(()=>applyZ()).observe($('art'),{attributes:true,attributeFilter:['viewBox']});

// ---- slider rows with editable number fields
// 2.74.2 (owner Oct 29 2026: "you should be able to type in any width/height"): a slider with data-omin and data-omax takes a typed value past its own ends, up to those;
// its track grows to hold the value (and shrinks back to its own ends for a value inside them). rngSet sets such a slider from the panel's code too.
function rngSet(r,v){v=+v;if(r.dataset.omax!=null){if(r.dataset.max0==null){r.dataset.max0=r.max;r.dataset.min0=r.min}v=Math.min(+r.dataset.omax,Math.max(+r.dataset.omin,v));r.max=Math.max(+r.dataset.max0,v);r.min=Math.min(+r.dataset.min0,v)}r.value=v;return v}
function addNum(row,r){const w=document.createElement('div');w.className='num';const n=document.createElement('input');n.type='number';n.min=r.dataset.omin!=null?r.dataset.omin:r.min;n.max=r.dataset.omax!=null?r.dataset.omax:r.max;n.step=r.step||1;
const lb=row.querySelector('label');n.setAttribute('aria-label',lb?lb.textContent:'Value');if(r.dataset.u){n.className='u';const i=document.createElement('i');i.textContent=r.dataset.u;w.appendChild(i)}
w.prepend(n);row.appendChild(w);r._n=n;
n.addEventListener('change',()=>{if(paintBack){n.value=+(+r.value).toFixed(2);return}let v=+n.value;if(n.value===''||isNaN(v))return paint(r);if(r.dataset.omax!=null)rngSet(r,v);else{v=Math.min(+r.max,Math.max(+r.min,v));r.value=v}r.dispatchEvent(new Event('input',{bubbles:true}));paint(r)});
n.addEventListener('keydown',e=>{if(e.key=='Enter')n.blur();else if(e.key=='Escape'){e.stopPropagation();paintBack=1;n.blur();paintBack=0;n.value=+(+r.value).toFixed(2)}})}
// double-click any number box to select all of it; whatever you type then replaces it (Enter or click away to apply, Esc to cancel)
let paintBack=0;document.addEventListener('dblclick',e=>{const t=e.target;if(t&&t.matches&&t.matches('input[type=number]')){t.focus();t.select()}});
function enhance(){document.querySelectorAll('.dock input[type=range]').forEach(r=>{if(r.closest('.ctl')||r.hasAttribute('data-plain'))return;const lb=r.previousElementSibling,row=document.createElement('div');row.className='ctl';
const hasL=lb&&lb.tagName=='LABEL';r.parentNode.insertBefore(row,hasL?lb:r);if(hasL){row.appendChild(lb);if(!r.id)0;lb.htmlFor=r.id}row.appendChild(r);addNum(row,r)});
// every slider row in a panel has a value box (Part 9): rows written in the page or by a panel's own markup get theirs here
document.querySelectorAll('#sel input[type=range],.dock .ctl input[type=range]').forEach(r=>{const row=r.closest('.ctl');if(row&&!row.querySelector('.num')&&!row.querySelector('input[type=number]')&&!r.hasAttribute('data-plain')){const lb=row.querySelector('label');if(lb&&r.id)lb.htmlFor=r.id;addNum(row,r)}})}
function paint(r){const lo=+r.min,hi=+r.max,p=hi>lo?(r.value-lo)/(hi-lo)*100:0;r.style.setProperty('--p',p.toFixed(1)+'%');const typing=r._n&&document.activeElement===r._n;if(r._n&&!typing)r._n.value=+(+r.value).toFixed(2);r._pk=typing?null:r.value+'|'+r.min+'|'+r.max}
// 2.44.2 (docs/speed-plan.md): every redraw repainted all 363 sliders of the app. Now only the sliders that can be seen are repainted (those of a panel that is open, and the few
// outside panels), and only when their value or range changed since the last paint. A panel is repainted when it opens (wsRender calls nums), so a hidden one is never out of date when it shows.
const NUMS_SEL='section.pn:not([hidden]) input[type=range],input[type=range]:not(section.pn input)';
function nums(){document.querySelectorAll(NUMS_SEL).forEach(r=>{if(r._pk!==r.value+'|'+r.min+'|'+r.max)paint(r)})}
WBX.wbNums=nums;WBX.wbEnhance=enhance;WBX.wbRngSet=rngSet;
document.addEventListener('input',e=>{if(e.target.type=='range')paint(e.target)});

// ---- status line + dock subtitle
function info(){const ks=new Set(WBS.tiles.map(t=>shOf(t).k)),k=ks.size>1?'Mixed':SHN[[...ks][0]]||'Rectangle',c=WBS.dim.c;
$('sinfo').innerHTML=`${WBS.book.on?`<span class="it">Print cover <b>${bk().W.toFixed(2)} × ${bk().H.toFixed(2)} in</b></span>`:`<span class="it">Canvas <b>${(+(+c[0]).toFixed(2))+':'+(+(+c[1]).toFixed(2))}</b></span>`}<span class="it">Stamp shape <b>${k}</b></span><span class="it">Stamps <b>${WBS.tiles.length}</b></span>`;
}
// wrap redraw hooks so the shell stays in sync
{const f=$('rzfresh');if(f){try{f.checked=kv.get('wb121_rzfresh')==='1'}catch(e){}f.addEventListener('change',()=>{try{kv.set('wb121_rzfresh',f.checked?'1':'0')}catch(e){}})}}
const _draw=WBH.draw;WBH.draw=function(){_draw();nums();info()};
const _stx=WBH.syncTex;WBH.syncTex=function(){_stx();nums()};

// ---- toast-style status messages
let mt=0;new MutationObserver(()=>{clearTimeout(mt);$('pmsg').style.opacity=1;if($('pmsg').textContent)mt=setTimeout(()=>{$('pmsg').style.transition='opacity .6s';$('pmsg').style.opacity=0;setTimeout(()=>{$('pmsg').style.transition=''},700)},6000)}).observe($('pmsg'),{childList:true,characterData:true,subtree:true});

// ---- menus
// The menus of the menu bar (2.42.0): File here, the rest from 85-menu-bar.js through WBX.wbMenuWire. `before` fills a menu just before it opens.
// A click on an item closes the menus; an item that opens a submenu (aria-haspopup) or asks twice (data-sure) keeps them open.
const menus=[];
const closeMenus=()=>{menus.forEach(([b,m])=>{$(m).hidden=true;$(b).setAttribute('aria-expanded','false')});if(WBX.wbMenuSubClose)WBX.wbMenuSubClose()};WBX.wbCloseMenus=closeMenus;
function menuWire(b,m,before){menus.push([b,m]);$(b).onclick=e=>{e.stopPropagation();const o=$(m).hidden;closeMenus();closeDD();if(o&&before)before();$(m).hidden=!o;if(o)placeFloat($(m),$(b),$(m).classList.contains('r'));$(b).setAttribute('aria-expanded',String(o))};$(m).addEventListener('click',e=>{if(e.target.closest('button,label')&&!e.target.closest('[data-sure],[aria-haspopup]'))closeMenus()})}
menuWire('fileb','filem');WBX.wbMenuWire=menuWire;WBX.wbMenuOpen=()=>menus.some(([,m])=>!$(m).hidden);
document.addEventListener('click',e=>{if(!e.target.closest('.menu,.pop'))closeMenus()});
// A floating popup would drift away from its button if the page or a panel scrolled under it, so close it instead.
addEventListener('scroll',e=>{const t=e.target;if(t&&t.closest&&t.closest('.pop,.ddl'))return;if(typeof typing=='function'&&typing())return;closeMenus();closeDD()},true);addEventListener('resize',()=>{if(typeof typing=='function'&&typing())return;closeMenus();closeDD()});

// ---- projects dialog
const closeDlg=()=>{$('plist').hidden=true;$('pls').classList.remove('on')};
$('pclose').onclick=closeDlg;$('plist').addEventListener('click',e=>{if(e.target===$('plist'))closeDlg()});
$('pnw2').onclick=()=>{const pl=$('plist');if(pl)pl.hidden=true;$('pnw').click()};   // 2.76.8: New project asks in its own dialog, so the Projects dialog closes first
$('pgrid').addEventListener('click',e=>{const b=e.target.closest('[data-a="open"]');if(b)setTimeout(()=>{if(b.textContent=='Open')closeDlg()},60)});

// ---- undo / redo (snapshots of the whole project state)
let hist=[coreStr()],hi=0;
const ub=()=>{$('undo').disabled=hi<=0;$('redo').disabled=hi>=hist.length-1;if(WBX.wbHistPaint)WBX.wbHistPaint()};
let histL=['Start'],histT=[Date.now()],histTh=[''],histU=[''];
const HK={tiles:'Stamp change',els:'Element change',layers:'Layer change',proj:'Colours',dim:'Canvas size',pg:'Grid',tex:'Texture',texLib:'Texture library',grade:'Grade'};
// What one step did to the elements, in words (2.27.0): "Moved shape", "Edited text", "Resized 3 elements"... hLU keeps the uid when only one element changed
let hLU='';
const hKN={text:'text',motif:'shape',stamp:'stamp',pattern:'pattern',paint:'paint',group:'group'};
function hEls(c){const m=new Map();(Array.isArray(c.els)?c.els:[]).forEach(p=>m.set(String(p.u),p));return m}
// 2.76.11 (2.76 review: history "mostly Changed element"): a step names the element by its own name ("Moved Diamond", "Added Pattern 2"), an effect by its name
// ("Halftone on photo", "Removed Blur from Star"), and locking, renaming and a pattern's piece edits too
function hNm(p){try{const d=elDef(elKind(p)),n=d&&d.name?d.name(p):'';if(n)return String(n).replace(/\s+/g,' ').trim().slice(0,24)}catch(e){}return hKN[p.k]||'element'}
function hFxWord(p,q){const A=p.fx||[],B=q.fx||[],ia=new Map(A.map(e=>[e.u,e])),ib=new Map(B.map(e=>[e.u,e])),nm=e=>{const d=fxDef(e.k);return d&&d.label||'Effect'},on=hNm(q);
 const add=B.filter(e=>!ia.has(e.u)),rem=A.filter(e=>!ib.has(e.u)),chg=B.filter(e=>ia.has(e.u)&&JSON.stringify(ia.get(e.u))!==JSON.stringify(e));
 if(add.length==1&&!rem.length)return nm(add[0])+' on '+on;if(rem.length==1&&!add.length)return'Removed '+nm(rem[0])+' from '+on;if(!add.length&&!rem.length&&chg.length==1)return(chg[0].on===false&&ia.get(chg[0].u).on!==false?'Turned off ':'')+nm(chg[0])+' on '+on;
 if(!add.length&&!rem.length&&!chg.length&&A.length==B.length)return'Reordered effects on '+on;return'Effects on '+on}
function hElWords(A,B){const a=hEls(A),b=hEls(B);if(!a.size&&!b.size)return'';const add=[...b.keys()].filter(u=>!a.has(u)),rem=[...a.keys()].filter(u=>!b.has(u)),kn=hNm;
if(add.length||rem.length){if(add.length&&rem.length)return'';const ks=(add.length?add.map(u=>b.get(u)):rem.map(u=>a.get(u))),n=ks.length,w=add.length?'Added ':'Removed ';return w+(n==1?kn(ks[0]):n+' elements')}
const chg=[...b.keys()].filter(u=>JSON.stringify(a.get(u))!==JSON.stringify(b.get(u)));if(!chg.length)return'';
const keys=u=>{const p=a.get(u),q=b.get(u);return[...new Set([...Object.keys(p),...Object.keys(q)])].filter(k=>JSON.stringify(p[k])!==JSON.stringify(q[k]))};
const only=(ks,ok)=>ks.every(k=>ok.includes(k)),all=chg.map(keys);let w='Changed';
if(all.every(ks=>only(ks,['x','y'])))w='Moved';else if(all.every(ks=>only(ks,['r'])))w='Rotated';else if(all.every(ks=>only(ks,['s','wx','wy','bw','bh','n','x','y','G','Lt'])&&!ks.includes('tx')))w='Resized';else if(all.every(ks=>only(ks,['tx','G','Lt','bw','bh','n','tu'])))w='Edited';else if(all.every(ks=>only(ks,['ink','col','fill','op','a'])))w='Recoloured';else if(all.every(ks=>only(ks,['v'])))w=b.get(chg[0]).v===false?'Hid':'Showed';else if(all.every(ks=>only(ks,['name','nm'])))w='Renamed';else if(all.every(ks=>only(ks,['lk'])))w=b.get(chg[0]).lk?'Locked':'Unlocked';else if(all.every(ks=>only(ks,['f'])))w='Flipped';else if(all.every(ks=>only(ks,['pe'])))w='Edited a piece of';
if(chg.length==1){const p=b.get(chg[0]);hLU=String(chg[0]);if(all[0].length==1&&all[0][0]=='fx')return hFxWord(a.get(chg[0]),p);if(w=='Renamed')return'Renamed '+hNm(a.get(chg[0]))+' to '+hNm(p);return w+' '+(w=='Edited'&&p.k=='text'?'text':kn(p))}return w+' '+chg.length+' elements'}
function hLabel(a,b){hLU='';try{const A=JSON.parse(a),B=JSON.parse(b),ch=Object.keys(HK).filter(k=>JSON.stringify(A[k])!==JSON.stringify(B[k]));if(!ch.length)return 'Change';if(ch.length==1&&ch[0]=='els'){const w=hElWords(A,B);if(w)return w}if(ch.length>2)return 'Several changes';if(ch[0]=='tiles'){const n=t=>t.reduce((q,x)=>q+(x.items||[]).length,0),x=n(A.tiles),y=n(B.tiles);if(A.tiles.length!=B.tiles.length)return B.tiles.length>A.tiles.length?'Added stamp':'Removed stamp';if(y>x)return 'Added shape'+(y-x>1?'s':'');if(y<x)return 'Removed shape'+(x-y>1?'s':'');return 'Moved or edited shape'}return ch.map(k=>HK[k]).join(' + ')}catch(e){return 'Change'}}
// wbRollHold: a Randomize roll is still setting its lettering, so the half-made piece is not a history step
// Shape editor: opens by itself when a shape is placed, unless Auto-open (top of the panel) is switched off; the choice is remembered
let seOn=true;try{seOn=kv.get('wb_se_auto')!=='0'}catch(e){}
const seAuto=()=>seOn;
{const b=$('seauto');if(b){const pt=()=>{b.setAttribute('aria-pressed',String(seOn));b.textContent=seOn?'On':'Off'};pt();b.onclick=()=>{seOn=!seOn;pt();try{kv.set('wb_se_auto',seOn?'1':'0')}catch(e){}}}}
const navDirty=()=>{if(WBX.wbNavDirty)WBX.wbNavDirty();if(WBX.wbVarDirty)WBX.wbVarDirty();if(WBX.wbCwDirty)WBX.wbCwDirty()};
// A step can be named by whoever makes it: WBX.wbLabelNext={t:'Randomize 3',at:performance.now()} just before wbCap(); otherwise the label says what changed.
// A step named by whoever made it (a Randomize roll, a look, a palette) gets a small picture, taken once from the finished piece when nothing is happening
// (never during a drag or a roll). Steps made by hand have none.
let thT=0,thWant=null;
function thRun(){if(WBS.WBDRG||WBX.wbHoldOn||WBX.wbRollHold||(WBX.wbTxBusy||0)>0||document.body.classList.contains('babusy')){thT=setTimeout(thRun,800);return}
 const s=thWant;if(!s||s!==coreStr())return;thWant=null;thumb(120).then(u=>{const i=hist.lastIndexOf(s);if(u&&i>=0){histTh[i]=u;if(WBX.wbHistPaint)WBX.wbHistPaint()}})}
function cap(){if(WBS.WBDRG||WBX.wbNoCap||WBX.wbRollHold||(WBS.fpXf&&WBS.fpXf.moved)||(WBS.fpDrag&&WBS.fpDrag.moved))return;   // a drag in progress is not a step yet (2.27.0)
if(texNorm())buildTex();const s=coreStr();if(s!==hist[hi]){const prev=hist[hi];
// typing in a text is one step, not one per pause (2.27.0): the same text edited again within a few seconds replaces the last step
if(hi>0&&hi==hist.length-1&&!(WBX.wbLabelNext&&performance.now()-WBX.wbLabelNext.at<3000)&&hLabel(prev,s)=='Edited text'&&hLU&&histL[hi]=='Edited text'&&hLU===histU[hi]&&Date.now()-histT[hi]<6000){hist[hi]=s;histT[hi]=Date.now();histTh[hi]='';navDirty();ub();return}
hist.length=hi+1;histL.length=hi+1;histT.length=hi+1;histTh.length=hi+1;histU.length=hi+1;hist.push(s);{const nl=WBX.wbLabelNext,pl=WBX.wbLabelPlain;WBX.wbLabelNext=null;WBX.wbLabelPlain=null;const named=nl&&performance.now()-nl.at<3000,plain=!named&&pl&&performance.now()-pl.at<3000;histL.push(named?nl.t:plain?pl.t:hLabel(prev,s));histU[histL.length-1]=(!named&&!plain)?hLU:'';if(stUnlocked()!=null&&!named&&/^Added shape/.test(histL[histL.length-1])&&seAuto()&&!wsFind('motifs'))setPanel('motifs',1);if(named){thWant=s;clearTimeout(thT);thT=setTimeout(thRun,1500)}}histT.push(Date.now());histTh.push('');navDirty();if(hist.length>120){hist.shift();histL.shift();histT.shift();histTh.shift();histU.shift()}hi=hist.length-1}ub()}
setInterval(cap,450);
// the one list keeps its id (2.25.0): a stamp tab belongs to it, so Undo and Redo stay in the tab that is open (the id is not part of the document)
function applyCore(c){const els=Array.isArray(c.els)?c.els:flatEls(c.layers),L0=WBS.layers&&WBS.layers[0];c.layers=[oneLayer(els,c.tiles.map(t=>t.id),L0&&L0.u)];trayIn(c);WBS.tiles=c.tiles;WBS.layers=c.layers;WBS.proj=c.proj;WBS.dim=c.dim;WBS.pgrid=pgFix(c.pg,c.layers);WBS.cur=Math.min(WBS.cur,WBS.tiles.length-1);WBS.tiles.forEach(shOf);migLayers();setDim();WBS.tex=c.tex;if(Array.isArray(c.texLib))WBS.texLib=txClean(c.texLib);texNorm();if(c.grade&&WBX.wbGrade&&JSON.stringify(c.grade)!=JSON.stringify(WBX.wbGrade.get()))WBX.wbGrade.set(c.grade);WBS.nid=1+Math.max(0,...WBS.tiles.map(t=>+t.id||0));
WBS.cur=Math.max(0,Math.min(WBS.cur,WBS.tiles.length-1));WBS.selL=0;   // (2.24.0) a current stamp after Undo, Redo and Open whenever the project has one
selOne(-1);WBS.symKey='';try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}
store();saveTex();WBH.syncTex();buildTex();upd();if(WBX.wbGrade&&WBX.wbGrade.sync)WBX.wbGrade.sync()}   // a stamp's own grade is part of the stamp, so the Grading sliders are read again after every step
// Loading a step normalises the document a little (for example every stamp gets an empty texture list), so the entry is re-read
// after loading; otherwise the next capture sees a difference, adds a step and cuts off the steps still to redo.
function goTo(i){hi=i;applyCore(JSON.parse(hist[hi]));hist[hi]=coreStr();navDirty()}
function undo(){cap();if(hi>0){const was=histL[hi];goTo(hi-1);pmsg('Undid: '+was)}ub()}
function redo(){if(hi<hist.length-1){goTo(hi+1);pmsg('Redid: '+histL[hi])}ub()}
$('undo').onclick=undo;$('redo').onclick=redo;ub();
WBX.wbHistLabels=()=>histL.slice();WBX.wbHistGet=i=>hist[i];WBX.wbHistIdx=()=>hi;WBX.wbHistLabel=i=>histL[i]||'Change';WBX.wbResetHist=()=>{if(WBX.wbBA)wbBA.reset();hist=[coreStr()];histL=['Start'];histT=[Date.now()];histTh=[''];histU=[''];hi=0;thWant=null;ub();if(WBX.wbSnapLoad)WBX.wbSnapLoad()};WBX.wbCap=cap;WBX.wbApply=applyCore;
// ---- History panel + named snapshots
(()=>{const sec=document.querySelector('section.pn[data-p="hist"]'),hl=$('hhl'),sl=$('hsl'),XI=`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.close}</svg>`;
let snaps=[],sk='',raf=0,ren=-1;
const DOTS='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.more+'</svg>';
const key=()=>'wb95_sn_'+(WBS.cp&&WBS.cp.id?WBS.cp.id:'draft');
const persist=()=>{try{kv.set(sk,JSON.stringify(snaps))}catch(e){pmsg('This snapshot is kept for now, but is too large to keep after you close the page.')}};
function load(){const k=key();try{if(WBS.cp&&WBS.cp.id){const d=kv.get('wb95_sn_draft');if(d&&!kv.get(k)&&sk=='wb95_sn_draft'){kv.set(k,d);kv.remove('wb95_sn_draft')}}}catch(e){}
if(k!=sk||!snaps){sk=k;try{snaps=JSON.parse(kv.get(k)||'[]')}catch(e){snaps=[]}if(!Array.isArray(snaps))snaps=[]}paint()}
const ago=t=>{const d=(Date.now()-t)/1000;return d<45?'now':d<3600?Math.round(d/60)+' min':d<86400?Math.round(d/3600)+' h':Math.round(d/86400)+' d'};
const esc2=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function paint(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(sec.hidden)return;const k=key();if(k!=sk){load();return}
if(!(ren>=0&&sl.querySelector('input')))sl.innerHTML=snaps.map((n,i)=>i==ren?`<div class="hr sn" data-sn="${i}"><input type="text" value="${esc2(n.n)}" maxlength="40" aria-label="Snapshot name"><span></span><span></span></div>`:`<div class="hr sn${n.th?' th':''}" data-sn="${i}">${n.th?`<img class="hth" src="${n.th}" alt="">`:''}<b>${esc2(n.n)}</b><i>${ago(n.t)}</i><button type="button" class="rfb" data-sref="${i}">Compare</button><button type="button" data-more="${i}" aria-haspopup="menu" aria-expanded="false" title="Snapshot actions" aria-label="Snapshot actions">${DOTS}</button></div>`).join('');
let h='';for(let i=hist.length-1;i>=0;i--)h+=`<div class="hr${i==hi?' on':''}${i>hi?' fut':''}${histTh[i]?' th':''}" data-h="${i}">${histTh[i]?`<img class="hth" src="${histTh[i]}" alt="">`:''}<b>${esc2(histL[i]||'Change')}</b><i>${ago(histT[i]||Date.now())}</i>${i==hi?'<span></span>':`<button type="button" class="rfb" data-href="${i}">Compare</button>`}</div>`;
hl.innerHTML=h;if(WBX.wbBAPaint)WBX.wbBAPaint();$('hsc').textContent=hist.length+(hist.length==1?' step':' steps');const inp=sl.querySelector('input');if(inp&&document.activeElement!==inp){inp.focus();inp.select()}})}
WBX.wbHistPaint=paint;WBX.wbSnapLoad=()=>{sk='';load()};
function jump(i){cap();if(i<0||i>=hist.length||i==hi)return;goTo(i);ub()}
hl.addEventListener('click',e=>{const b=e.target.closest('[data-href]');if(b){const i=+b.dataset.href;wbBA.setRef((histL[i]||'Change')+' · '+ago(histT[i]||Date.now()),hist[i],1);return}const r=e.target.closest('[data-h]');if(r)jump(+r.dataset.h)});
$('hsadd').onclick=()=>{cap();const sn={n:'Snapshot '+(snaps.length+1),t:Date.now(),s:coreStr()};snaps.unshift(sn);if(snaps.length>30)snaps.length=30;persist();ren=0;paint();thumb(120).then(u=>{if(u&&snaps.includes(sn)){sn.th=u;persist();paint()}})};
sl.addEventListener('click',e=>{const q=e.target.closest('[data-sref]');if(q){const n=snaps[+q.dataset.sref];if(n)wbBA.setRef(n.n,n.s,1);return}const d=e.target.closest('[data-more]');if(d){e.stopPropagation();const k=+d.dataset.more;rowMenu(d,[['Rename',()=>{ren=k;paint()}],['Delete',()=>{snaps.splice(k,1);persist();ren=-1;paint()}]]);return}
if(e.target.closest('input'))return;const r=e.target.closest('[data-sn]');if(!r)return;const n=snaps[+r.dataset.sn];if(!n)return;cap();applyCore(JSON.parse(n.s));cap();pmsg('Restored “'+n.n+'”. Ctrl+Z goes back.')});
sl.addEventListener('dblclick',e=>{const r=e.target.closest('[data-sn]');if(r&&!e.target.closest('input,button')){ren=+r.dataset.sn;paint()}});
function fin(ok){const inp=sl.querySelector('input');if(inp&&ren>=0&&snaps[ren]){const v=inp.value.trim();if(ok&&v)snaps[ren].n=v.slice(0,40);persist()}ren=-1;paint()}
sl.addEventListener('keydown',e=>{if(!e.target.matches('input'))return;if(e.key=='Enter'){e.preventDefault();fin(1)}else if(e.key=='Escape'){e.stopPropagation();fin(0)}});
sl.addEventListener('focusout',e=>{if(e.target.matches&&e.target.matches('input')&&ren>=0)setTimeout(()=>{if(ren>=0)fin(1)},0)});
new MutationObserver(()=>{if(!sec.hidden)paint()}).observe(sec,{attributes:true,attributeFilter:['hidden']});
WBX.wbBAPaint=()=>{const m=wbBA.mode;$('bacmp').hidden=!m;$('bab').setAttribute('aria-pressed',String(m==1));$('bas').setAttribute('aria-pressed',String(m==2));const lb=wbBA.label;$('barst').hidden=!wbBA.custom;if(!sec.hidden&&$('bal').dataset.l!==lb){$('bal').dataset.l=lb;$('bal').innerHTML=`<div class="hr"><b><u class="ab a">A</u>${esc2(lb)}</b><i>Compared to</i><span></span></div><div class="hr"><b><u class="ab b">B</u>Current</b><i>Now</i><span></span></div>`}
 if(sec.hidden)return;const c=wbBA.core;hl.querySelectorAll('[data-h]').forEach(r=>{const i=+r.dataset.h;r.classList.toggle('ra',c!=null&&hist[i]===c);r.classList.toggle('rb',i==hi)});sl.querySelectorAll('[data-sn]').forEach(r=>{const n=snaps[+r.dataset.sn];r.classList.toggle('ra',!!n&&n.s===c)})};
$('barst').onclick=()=>wbBA.clearRef();
$('bab').onclick=()=>{$('bab').blur();wbBA.toggle()};$('bas').onclick=()=>{$('bas').blur();wbBA.split()};
sk=key();try{snaps=JSON.parse(kv.get(sk)||'[]')}catch(e){snaps=[]}
setInterval(()=>{if(!sec.hidden)paint()},30000)})();


// ---- names on hover (Part 9, owner Oct 22 2026): an icon-only button shows its aria-label; a button that shows its own words shows nothing extra
document.addEventListener('pointerover',e=>{const b=e.target.closest&&e.target.closest('button[aria-label],[role=button][aria-label]');if(!b||b.title||b.dataset.wbtip!=null)return;   // 2.79.2: its title is lifted while the quick tip shows
const tip=b.querySelector('.tip');const words=b.textContent.replace(tip?tip.textContent:'','').trim();if(!words)b.title=b.getAttribute('aria-label')},true);

// ---- keyboard shortcuts
document.addEventListener('keydown',e=>{const t=e.target,typing=t.matches&&t.matches('input,select,textarea'),m=e.metaKey||e.ctrlKey,k=e.key.toLowerCase(),q=WBS.tiles[WBS.cur]&&(WBS.tiles[WBS.cur]||WBS.noTile).items[WBS.sel];
if(m&&k=='z'){if(typing&&(t.type=='text'||t.type=='number'))return;e.preventDefault();e.shiftKey?redo():undo()}
else if(m&&k=='y'){e.preventDefault();redo()}
else if(m&&k=='s'){e.preventDefault();cmdGet('file.save').run()}
else if(m&&k=='d'&&!typing&&q&&stUnlocked()!=null){e.preventDefault();cmdGet('stamp.duplicateMotif').run()}
else if(m&&k=='d'&&!typing&&lyDupSel())e.preventDefault();
else if(m&&!typing&&!e.altKey&&(e.code=='BracketRight'||e.code=='BracketLeft')){const id=e.code=='BracketRight'?(e.shiftKey?'element.front':'element.forward'):(e.shiftKey?'element.back':'element.backward');if(cmdIsEnabled(id)){e.preventDefault();cmdRun(id)}}   // 2.76.11: Photoshop's order keys
else if(!typing&&WBS.split&&e.key=='Enter'){e.preventDefault();doSplit()}
else if(!typing&&WBS.split&&e.key=='Escape'){WBS.split=null;WBH.draw()}
else if(!typing&&WBS.brush&&!WBS.brush.txt&&(e.key=='['||e.key==']')){e.preventDefault();WBS.brush.r=((WBS.brush.r+(e.key==']'?15:-15)+540)%360)-180}
else if(e.key=='Escape'&&WBS.brush&&!typing){WBS.brush=null;WBS.txg=null;upd()}
else if(e.key=='Escape'){closeMenus();if(!$('plist').hidden)closeDlg();else if(WBS.sel>=0){selOne(-1);upd()}}
else if(!typing&&!m&&k=='0'){z=0;applyZ()}});

document.querySelectorAll('label[role=button]').forEach(l=>l.addEventListener('keydown',e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();l.click()}}));
// ---- double-click (or double-tap) a slider or its label to reset it to its default (double-click the number box instead to type a value)
function resetRange(r){let d=r.dataset.def!=null?r.dataset.def:r.getAttribute('value');if(r.id=='sn'){const sy=symOf(WBS.tiles[WBS.cur]);d=sy.d[4]}if(d==null||d==='')return false;
r.value=d;r.dispatchEvent(new Event('input',{bubbles:true}));paint(r);const row=r.closest('.ctl');if(row){row.classList.remove('rst');void row.offsetWidth;row.classList.add('rst')}return true}
const rowRange=t=>{if(t.closest&&t.closest('.num'))return null; /* the number box has its own double-click: select all */ const row=t.closest&&t.closest('.ctl');return row&&row.querySelector('input[type=range]')};
document.addEventListener('dblclick',e=>{const r=rowRange(e.target);if(r&&resetRange(r)){e.preventDefault();if(document.activeElement&&document.activeElement.type=='number')document.activeElement.blur();const sel=getSelection&&getSelection();if(sel)sel.removeAllRanges()}});
let lastTap={r:null,t:0};document.addEventListener('pointerup',e=>{if(e.pointerType!='touch')return;const r=rowRange(e.target);if(!r)return;const now=Date.now();if(lastTap.r===r&&now-lastTap.t<320){resetRange(r);lastTap={r:null,t:0}}else lastTap={r,t:now}});
const rs=document.createElement('style');rs.textContent='.ctl.rst{animation:rstf .5s ease-out}@keyframes rstf{0%{background:var(--acc-soft)}100%{background:transparent}}.ctl{border-radius:var(--r-m)}.ctl label{cursor:default}';document.head.appendChild(rs);
// (2.29.0) slider rows carry no hover sentence; double-click still resets a slider
$('gti').onclick=()=>{WBS.edInk=!WBS.edInk;tbSync();upd()};
$('gtx').onclick=()=>{WBS.edTx=!WBS.edTx;tbSync();upd()};
$('gtm').onclick=()=>{WBS.edMk=!WBS.edMk;$('gtm').classList.toggle('on',WBS.edMk);$('gtm').setAttribute('aria-pressed',String(WBS.edMk));upd()};
document.addEventListener('keydown',e=>{if(e.target.matches&&e.target.matches('input,select,textarea'))return;if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&e.key.toLowerCase()=='g'){WBS.pgrid.show=!WBS.pgrid.show;upd();if(WBX.wbCap)WBX.wbCap()}});
// ---- randomize motifs on the current stamp
try{const z=JSON.parse(kv.get('wb36_rz')||'null');if(z){$('rzp').value=z.p;$('rzr').value=z.r;$('rzs').value=z.s}}catch(e){}
['rzp','rzr','rzs'].forEach(id=>$(id).addEventListener('input',()=>{try{kv.set('wb36_rz',JSON.stringify({p:+$('rzp').value,r:+$('rzr').value,s:+$('rzs').value}))}catch(e){}}));
$('rzgo').onclick=()=>{const qs=QS();if(!qs.length){$('pmsg').textContent='Select some shapes first.';return}if(WBX.wbCap)WBX.wbCap();
const P=+$('rzp').value/100*Math.min(SW,SH)*.25,R=+$('rzr').value,S=+$('rzs').value/100,rnd=()=>Math.random()*2-1;
qs.forEach(q=>{if(P){const a=Math.random()*Math.PI*2,d=Math.sqrt(Math.random())*P;[q.x,q.y]=wrapP(q.x+Math.cos(a)*d,q.y+Math.sin(a)*d)}
if(R)q.r=Math.round(nr(q.r+rnd()*R))||0;if(S)q.s=+Math.min(2.6,Math.max(.2,q.s*(1+rnd()*S))).toFixed(3)});
store();upd();if(WBX.wbCap)WBX.wbCap();$('pmsg').textContent=`Randomized ${qs.length} shape${qs.length>1?'s':''}. Press again for another shuffle, or Ctrl+Z to undo.`};
// ===== v90 controls: styled dropdowns, colour picker, slider scrub =====
(()=>{
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),SEL_SKIP=s=>s.style.display==='none'||s.classList.contains('ddsel')||s.dataset.native!=null;
const desc=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
const all=[];
function optList(s){const out=[];[...s.children].forEach(c=>{if(c.tagName=='OPTGROUP'){out.push({g:c.label});[...c.children].forEach(o=>out.push({v:o.value,t:o.textContent,d:o.disabled||c.disabled,f:o.dataset.font||'',w:o.dataset.w||''}))}else if(c.tagName=='OPTION')out.push({v:c.value,t:c.textContent,d:c.disabled,f:c.dataset.font||'',w:c.dataset.w||''})});return out}   // data-font: the item is written in that typeface (the font list)
const ffOf=(f,w)=>f?`font-family:'${f.replace(/['"<>&]/g,'')}',Georgia,serif${w?';font-weight:'+(+w||400):''}`:''
function mk(sel){if(sel._dd||SEL_SKIP(sel))return;
const w=document.createElement('div');w.className='dd dd2';w.innerHTML='<button type="button" class="ddb"><span class="ddt"></span><em>▾</em></button><div class="ddl" hidden role="listbox"></div>';
sel.after(w);sel.classList.add('ddsel');const b=w.firstChild,l=w.lastChild,t=b.firstChild;
if(sel.getAttribute('aria-label'))b.setAttribute('aria-label',sel.getAttribute('aria-label'));
let key='',hi=-1;
const st={sel,w,b,l,sync(force){const k=sel.selectedIndex+'|'+sel.options.length+'|'+(sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].textContent:'')+'|'+sel.disabled+'|'+(sel.hidden?1:0);if(!force&&k===key)return;key=k;
 const o=sel.options[sel.selectedIndex];t.textContent=o?o.textContent:'';t.style.cssText=o&&o.dataset.font?ffOf(o.dataset.font,o.dataset.w):'';b.disabled=sel.disabled;w.hidden=sel.hidden;if(!l.hidden)fill()},
 fill};
function fill(){const items=optList(sel),cv=sel.value;l.innerHTML=items.map((o,i)=>o.g!=null?`<div class="ddg">${esc(o.g)}</div>`:`<div class="ddi${o.v===cv?' cur':''}${o.d?' dis':''}" role="option" data-i="${i}" data-v="${esc(o.v).replace(/"/g,'&quot;')}"${o.f?` style="${ffOf(o.f,o.w)}"`:''}>${esc(o.t)}</div>`).join('')}
function pick(v){desc.set.call(sel,v);key='';st.sync(true);close();sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}))}
function close(){l.hidden=true;b.setAttribute('aria-expanded','false')}
function open(){closeDD();if(typeof closeMenus=='function')closeMenus();fill();l.hidden=false;b.setAttribute('aria-expanded','true');placeFloat(l,b,false,320);const c=l.querySelector('.cur');if(c){l.scrollTop=c.offsetTop-(l.clientHeight-c.offsetHeight)/2;hi=+c.dataset.i}}
b.onclick=e=>{e.stopPropagation();l.hidden?open():close()};
l.onclick=e=>{const i=e.target.closest('.ddi');if(!i||i.classList.contains('dis'))return;e.stopPropagation();pick(i.dataset.v)};
b.addEventListener('keydown',e=>{const k=e.key;
 if(k=='ArrowDown'||k=='ArrowUp'){e.preventDefault();const op=[...sel.options],n=op.length;let i=sel.selectedIndex;do{i+=k=='ArrowDown'?1:-1}while(i>=0&&i<n&&op[i].disabled);if(i>=0&&i<n){desc.set.call(sel,op[i].value);key='';st.sync(true);if(!l.hidden)fill();sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}))}}
 else if(k=='Escape'&&!l.hidden){e.stopPropagation();close()}});
// programmatic changes: value setter + option changes + disabled/hidden
Object.defineProperty(sel,'value',{configurable:true,get(){return desc.get.call(sel)},set(v){desc.set.call(sel,v);st.sync()}});
new MutationObserver(()=>st.sync()).observe(sel,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','hidden']});
sel._dd=st;all.push(st);st.sync(true)}
function scan(root){(root||document).querySelectorAll('select').forEach(mk)}
WBX.wbDDsync=()=>{for(let i=all.length;i--;){const s=all[i];if(!s.sel.isConnected){all.splice(i,1);s.w.remove();continue}s.sync()}};
// selects that appear later (rebuilt lists)
{let q=0;const run=()=>{q=0;scan()};new MutationObserver(m=>{for(const r of m)for(const n of r.addedNodes){if(n.nodeType==1&&!(n instanceof SVGElement)&&(n.tagName=='SELECT'||n.querySelector&&n.querySelector('select'))){if(!q)q=requestAnimationFrame(run);return}}}).observe(document.body,{childList:true,subtree:true})}
scan();
// ---- colour fields (input type=color in other tools): a swatch button that opens the shared colour picker (51-colour-picker.js)
const cdesc=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
function mkc(inp){if(inp._cc)return;const b=document.createElement('button');b.type='button';b.className='ccb';b.setAttribute('aria-label',inp.title||'Colour');b.setAttribute('aria-haspopup','dialog');inp.after(b);inp.classList.add('ccsel');
const sync=()=>{b.style.setProperty('--c',cdesc.get.call(inp))};
Object.defineProperty(inp,'value',{configurable:true,get(){return cdesc.get.call(inp)},set(v){cdesc.set.call(inp,v);sync()}});
b.onclick=e=>{e.stopPropagation();const P=WBX.wbPicker;if(!P)return;if(P.isOpen()&&P.anchor()===b){P.close();return}closeDD();if(typeof closeMenus=='function')closeMenus();
 P.open(b,{value:inp.value,alpha:false,onInput:h=>{if(inp.value!==h){inp.value=h;inp.dispatchEvent(new Event('input',{bubbles:true}))}},onChange:()=>inp.dispatchEvent(new Event('change',{bubbles:true}))})};
inp._cc=1;sync()}
document.querySelectorAll('input[type=color]').forEach(mkc);
// ---- sliders: drag the label to scrub; hold Shift for fine control (also on the slider itself)
const rangeOf=l=>{const row=l.closest&&l.closest('.ctl');return row&&row.querySelector('input[type=range]')};
function setR(r,v){const lo=+r.min,hi=+r.max,stp=+r.step||1;v=Math.max(lo,Math.min(hi,Math.round(v/stp)*stp));v=+v.toFixed(6);if(+r.value===v)return;r.value=v;r.dispatchEvent(new Event('input',{bubbles:true}))}
function scrub(el,r,e,fine0){if(r.disabled)return;let x0=e.clientX,v0=+r.value,sh=e.shiftKey,moved=false;const span=+r.max-+r.min,W=(r.getBoundingClientRect().width||200)*(fine0?1:1.4);
const dr=window.NODRAFT&&NODRAFT.has(r.id);
const mv=ev=>{if(!moved&&Math.abs(ev.clientX-x0)<3)return;if(!moved){moved=true;document.body.classList.add('scrubbing');if(!dr&&typeof WBS.DRAFT!='undefined'){WBS.DRAFT=1;clearTimeout(DRT)}}
 if(ev.shiftKey!==sh){sh=ev.shiftKey;x0=ev.clientX;v0=+r.value}
 const k=sh?.1:1;setR(r,v0+(ev.clientX-x0)/W*span*k)};
const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);document.body.classList.remove('scrubbing');if(moved){r.dispatchEvent(new Event('change',{bubbles:true}));if(typeof drOff=='function')drOff()}};
addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up)}
document.addEventListener('pointerdown',e=>{if(e.button||e.pointerType=='touch')return;const t=e.target;
 if(t.matches&&t.matches('input[type=range]')){if(e.shiftKey){e.preventDefault();scrub(t,t,e,true)}return}
 if(t.tagName=='LABEL'&&t.closest('.ctl')){const r=rangeOf(t);if(r){e.preventDefault();scrub(t,r,e,false)}}},true);
// keep labels in step with programmatic changes
if(typeof nums=='function'){const _n=nums;nums=function(){_n();WBX.wbDDsync()}}
})();

enhance();
WS.pattern={dock:[],float:[]};setView();{let st='';try{st=kv.get('wb96_launch')||''}catch(e){}if(st==='on')WBX.wbWsSet(wsLaunch());else if(st!=='none')WBX.wbWsSet({pattern:{dock:[wsG(['lyrs'],{e:'r',lk:1})],float:[]}})}   /* 2.55.0 (owner Oct 26 2026): the app starts with the Elements list on the right, locked ('none' is the tests' empty start) */info();nums();requestAnimationFrame(()=>{applyZ();nums()});

{const sp=document.getElementById('splash'),t0=performance.now();if(sp){const go=()=>{const w=Math.max(0,520-(performance.now()-t0));setTimeout(()=>{sp.classList.add('out');setTimeout(()=>sp.remove(),320)},w)};const f=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1400))]):Promise.resolve();requestAnimationFrame(()=>requestAnimationFrame(()=>f.then(go)))}}
{const b=$('gdt');let on=true;try{on=kv.get('wb93_dots')!=='0'}catch(e){}const ap=()=>{document.body.classList.toggle('plain',!on);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))};ap();b.onclick=()=>{on=!on;try{kv.set('wb93_dots',on?'1':'0')}catch(e){}ap()}}
clearAll(true);WBS.cp={id:null,name:'',saved:coreStr()};$('pnm').value='';paintPst();$('pmsg').textContent='';
// warn before leaving if there's unsaved work (a fresh blank document doesn't count)
{addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue=''}})}
})();
}
export {init34};
