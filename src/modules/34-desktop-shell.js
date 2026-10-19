import {kv} from '../platform/index.js';
import {cmdGet} from '../commands/registry.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {DRT,NODRAFT,drOff} from './02-draft-mode-speedups.js';
import {CASP,CH,CSN,CW,SH,SHN,SW,bk,closeDD,csk,placeFloat,rowMenu,setDim,shOf,wrapP} from './04-canvas-and-stamp-outlines.js';
import {trayIn} from './50-tray-core.js';
import {selOne,store} from './06-motif-library-folders.js';
import {nr,symOf,tbSync} from './07-symmetry.js';
import {fitTs,migLayers} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {QS,doSplit} from './12-selection-and-split.js';
import {sync} from './13-preview-and-stamp-tool.js';
import {LY} from './14-presets-and-layer-grid-ui.js';
import {savePr} from './15-print-effects-and-stamp-texture.js';
import {txClean} from './16-texture-generators.js';
import {buildTex,saveTex,texNorm} from './17-texture-panel-and-previews.js';
import {coreStr,dirty,paintPst,pgFix,pmsg,thumb} from './18-projects-and-cover-overlay.js';
import {libRz} from './21-motif-library-ui.js';
import {randomize,wbBA} from './20-before-after-and-randomizer.js';
import {clearAll} from './33-clear.js';
import {stUnlocked} from './63-stamp-tool.js';

function init34(){// ===== Desktop shell: panels, views, zoom, number fields, menus, undo/redo, shortcuts =====
(()=>{
const PN={tex:'Textures',slib:'Stamp library',text:'Text',lyrs:'Layers',canvas:'Canvas',colors:'Colours',stamp:'Stamp settings',motifs:'Shapes',sedit:'Element editor',layers:'Layout',cover:'Book cover'};
let panel='canvas',z=0,fitS=1;try{panel=kv.get('wb24_panel')||'canvas';if(!PN[panel])panel='canvas'}catch(e){}

// ===== Workspace: one set of panels. Panels live in groups (tabs).
// Groups are docked on the left, right, top or bottom edge of the window, or float over the stage. Drag a tab or a group's title bar to move it:
// drop on another group's title bar to tab it in, on a dock to stack it there, on an empty window edge to open a dock, anywhere else to float it.
const PNAME={cways:'Colourways',vars:'Variations',pres:'Presets',xrec:'Export recipes',wspc:'Workspaces',nav:'Navigator',slib:'Stamp library',text:'Text',lyrs:'Layers',canvas:'Canvas',colors:'Colours',stamp:'Stamp settings',motifs:'Shapes',mlist:'Shape list',sedit:'Element editor',layers:'Layout',stmp:'Stamps',pgrid:'Grid',grade:'Colour grading',tex:'Textures',rand:'Randomize',hist:'History'};
const MODEP={pattern:['lyrs','layers','stmp','stamp','motifs','mlist','sedit','text','pgrid','canvas','colors','cways','grade','tex','rand','hist','slib','nav','wspc','xrec','pres','vars']};
let wsReady=false,wsZ=10,wd=null,wsJust=0;
const wsG=(tabs,o={})=>({id:'g'+Math.random().toString(36).slice(2,9),tabs,a:tabs[0],f:1,e:'r',...o});
const wsDef=()=>({dock:[wsG(['lyrs'],{f:.85}),wsG(['layers','canvas']),wsG(['colors','grade','tex'],{f:.8})],float:[]});
let WS={pattern:wsDef()};
try{const sv=JSON.parse(kv.get('wb30_ws')||'null');if(sv)['pattern'].forEach(m=>{const L=sv[m];if(!L||!Array.isArray(L.dock)||!Array.isArray(L.float))return;const seen=new Set(),ok=g=>{if(!g||!Array.isArray(g.tabs))return false;g.tabs=g.tabs.filter(p=>MODEP[m].includes(p)&&!seen.has(p)&&seen.add(p));if(!g.tabs.includes(g.a))g.a=g.tabs[0];g.id=String(g.id||wsG([]).id);g.f=+g.f||1;return g.tabs.length>0};WS[m]={dock:L.dock.filter(ok),float:L.float.filter(ok)}})}catch(e){}

const wsSave=()=>{try{kv.set('wb30_ws',JSON.stringify(WS))}catch(e){}};
const wsL=()=>WS.pattern;
const wsAll=()=>[...wsL().dock,...wsL().float];
const wsFind=p=>wsAll().find(g=>g.tabs.includes(p))||null;
const wsGroup=id=>wsAll().find(g=>g.id==id)||null;
const wsDetach=g=>{const L=wsL();['dock','float'].forEach(k=>{const i=L[k].indexOf(g);if(i>=0)L[k].splice(i,1)})};
const wsSec=p=>document.querySelector(`section.pn[data-p="${p}"]`);
const wsStash=document.createElement('div'),wsFl=document.createElement('div'),wsInd=document.createElement('div'),wsTint=document.createElement('div');
const wsDk={},wsBox={},wsZn={};
{const R=document.querySelector('aside.dock');R.classList.add('dk','dk-r');R.dataset.e='r';wsDk.r=R;wsBox.r=R.querySelector('.dock-b');
['l','t','b'].forEach(k=>{const a=document.createElement('aside');a.className='dock dk dk-'+k;a.dataset.e=k;a.hidden=true;const b=document.createElement('div');b.className='dock-b';a.appendChild(b);$('app').appendChild(a);wsDk[k]=a;wsBox[k]=b});
['l','r','t','b'].forEach(k=>{const b=wsBox[k];b.classList.add('wsd');if(k=='t'||k=='b')b.classList.add('hz');const h=document.createElement('div');h.className='wed';h.title='Drag to resize';wsDk[k].appendChild(h);
const z=document.createElement('div');z.className='wzn';z.dataset.e=k;z.hidden=true;document.body.appendChild(z);wsZn[k]=z})}
wsBox.r.id='wsdock';
// size of each dock (width for left/right, height for top/bottom), kept per mode for this session only
const wsSz=k=>{const L=wsL();return(L.sz&&L.sz[k])||{l:316,r:316,t:260,b:260}[k]};
const wsClampSz=(k,v)=>{const hz=k=='t'||k=='b',o=hz?(k=='t'?'b':'t'):(k=='l'?'r':'l'),oth=wsDk[o]&&!wsDk[o].hidden?wsSz(o):0,mn=hz?110:200,mx=hz?innerHeight-46-26-330-oth:innerWidth-52-420-oth;return Math.round(Math.max(mn,Math.min(v,Math.max(mn,mx))))};
const wsSetSz=(k,v)=>{const L=wsL();v=wsClampSz(k,v);(L.sz=L.sz||{})[k]=v;if(k=='t'||k=='b')wsDk[k].style.height=v+'px';else wsDk[k].style.width=v+'px'};
// put a group into one edge's stack at position i (i past the end means last)
const wsDockIns=(L,g,k,i)=>{g.e=k;g.f=1;L.dock.forEach(x=>{if((x.e||'r')==k)x.f=1});const el=L.dock.filter(x=>x!==g&&(x.e||'r')==k);if(i>=el.length){const last=el[el.length-1];if(last)L.dock.splice(L.dock.indexOf(last)+1,0,g);else L.dock.push(g)}else L.dock.splice(L.dock.indexOf(el[i]),0,g)};
// the strip of window that docks can use: right of the tool bar, below the top bar, above the status bar
function wsWR(){const rl=document.querySelector('.rail').getBoundingClientRect(),tp=document.querySelector('.top').getBoundingClientRect(),sb=document.querySelector('.status').getBoundingClientRect();
return{ox0:rl.right,ox1:innerWidth,y0:tp.bottom,y1:sb.top,x0:wsDk.l.hidden?rl.right:wsDk.l.getBoundingClientRect().right,x1:wsDk.r.hidden?innerWidth:wsDk.r.getBoundingClientRect().left}}
// which empty window edge the pointer is close to (null if none)
function wsEdgeAt(e){const W=wsWR(),T=56,x=Math.max(W.ox0,Math.min(W.ox1,e.clientX)),y=Math.max(W.y0,Math.min(W.y1,e.clientY));let best=null,bd=T;
const c=(k,d,ok)=>{if(ok&&wsDk[k].hidden&&d>=0&&d<bd){bd=d;best=k}};
c('l',x-W.ox0,true);c('r',W.ox1-x,true);c('t',y-W.y0,x>=W.x0&&x<=W.x1);c('b',W.y1-y,x>=W.x0&&x<=W.x1);return best}
// drop zones: a faint strip on every empty edge while dragging; the chosen one opens up to the size the dock would have
function wsZones(hot){const W=wsWR();['l','r','t','b'].forEach(k=>{const z=wsZn[k],emp=wsDk[k].hidden;z.hidden=!emp;if(!emp)return;const th=hot==k?wsClampSz(k,wsSz(k)):26,s=z.style;
if(k=='l'||k=='r'){s.left=(k=='l'?W.ox0:W.ox1-th)+'px';s.top=W.y0+'px';s.width=th+'px';s.height=(W.y1-W.y0)+'px'}
else{s.left=W.x0+'px';s.top=(k=='t'?W.y0:W.y1-th)+'px';s.width=(W.x1-W.x0)+'px';s.height=th+'px'}
z.classList.toggle('hot',hot==k)})}
wsStash.hidden=true;wsFl.id='wsfl';wsInd.id='wsind';wsInd.hidden=true;wsTint.id='wstint';wsTint.hidden=true;document.body.append(wsStash,wsFl,wsTint,wsInd);
const IC={col:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9.5l5 5 5-5"/></svg>',
exp:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 7l5 5-5 5"/></svg>',
pop:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M12 3.5h8.5V12M20.5 3.5L12.5 11.5"/></svg>',
dock:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M14.5 3.5v17"/></svg>',
x:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'};
const wsNarrow=()=>innerWidth<=860;
function wsClamp(g){const st=document.querySelector('.stage').getBoundingClientRect();if(g.x==null){if(g.pos=='bc'){g.x=Math.round(st.left+(st.width-(+g.w||300))/2);g.y=Math.round(st.bottom-(parseFloat(getComputedStyle(document.querySelector('.stage')).getPropertyValue('--film-h'))||79)-12-(+g.h||420))}else{const r=g.pos=='r'||g.pos=='rb';g.x=Math.round(r?st.right-(+g.w||300)-12:st.left+12);g.y=Math.round(st.top+52+(g.pos=='rb'?392:0))}}
g.w=Math.max(200,Math.min(+g.w||300,innerWidth-20));g.h=Math.max(120,Math.min(+g.h||420,innerHeight-60));g.x=Math.max(-g.w+80,Math.min(g.x,innerWidth-80));g.y=Math.max(0,Math.min(g.y,innerHeight-36));if(g.y+g.h>innerHeight-8)g.y=Math.max(0,innerHeight-8-g.h);g.h=Math.min(g.h,innerHeight-8-g.y)}
function wsEl(g,fl){const el=document.createElement('div');el.className='wg'+(fl?' fl':'')+(g.col?' col':'');el.dataset.g=g.id;
if(fl){wsClamp(g);el.style.cssText=`left:${g.x}px;top:${g.y}px;width:${g.w}px;${g.col?'':`height:${g.h}px;`}z-index:${++wsZ}`}else el.style.flexGrow=g.f;
el.innerHTML=`<div class="wh" title="Drag to move"><div class="wt">${g.tabs.map(p=>`<button type="button" class="wtab${p==g.a?' on':''}" data-t="${p}">${PNAME[p]}</button>`).join('')}</div>`+
`<button type="button" class="wb" data-act="col" title="${g.col?'Expand':'Collapse'}">${g.col?IC.exp:IC.col}</button><button type="button" class="wb" data-act="${fl?'dock':'float'}" title="${fl?'Dock to the side':'Pop out'}">${fl?IC.dock:IC.pop}</button><button type="button" class="wb" data-act="close" title="Close (reopen from the left bar)">${IC.x}</button></div><div class="wbd"></div>${fl?'<div class="wrs" title="Resize"></div>':''}`;
const bd=el.querySelector('.wbd');g.tabs.forEach(p=>{const sc=wsSec(p);if(sc){sc.classList.toggle('mc',!!sc.querySelector(':scope>details.g'));sc.hidden=p!=g.a;bd.appendChild(sc)}});return el}
// the tool bar: the user's own order and the tools they took off it (kept in settings)
const RO={order:[],off:[]};try{const r=JSON.parse(kv.get('wb120_rail')||'null');if(r){if(Array.isArray(r.order))RO.order=r.order.filter(x=>typeof x=='string');if(Array.isArray(r.off))RO.off=r.off.filter(x=>typeof x=='string')}}catch(e){}
const railEl=document.querySelector('.rail'),railSave=()=>{try{kv.set('wb120_rail',JSON.stringify(RO))}catch(e){}};
const railBtns=()=>[...railEl.querySelectorAll(':scope > [data-pn]')];
function railOrder(){const bs=railBtns(),by={};bs.forEach(b=>by[b.dataset.pn]=b);const ids=RO.order.filter(x=>by[x]);bs.forEach(b=>{if(!ids.includes(b.dataset.pn))ids.push(b.dataset.pn)});const sp=railEl.querySelector('.rsp');ids.forEach(id=>railEl.insertBefore(by[id],sp))}
let railHook=null;
function wsRender(){wsReady=true;const L=wsL(),nar=wsNarrow(),dl=nar?[...L.dock,...L.float]:L.dock;
document.querySelectorAll('section.pn').forEach(sc=>wsStash.appendChild(sc));wsFl.innerHTML='';
['l','r','t','b'].forEach(k=>{const box=wsBox[k],dk=wsDk[k],gs=dl.filter(g=>(nar?'r':(g.e||'r'))==k);box.innerHTML='';
gs.forEach((g,i)=>{if(i){const sp=document.createElement('div');sp.className='wsp';sp.dataset.i=i;box.appendChild(sp)}box.appendChild(wsEl(g,false))});
dk.hidden=!gs.length;if(nar){dk.style.width='';dk.style.height=''}else if(gs.length){const ac=gs.every(g=>g.col);if(k=='l'||k=='r')dk.style.width=(ac?Math.min(200,wsClampSz(k,wsSz(k))):wsClampSz(k,wsSz(k)))+'px';else dk.style.height=(ac?34:wsClampSz(k,wsSz(k)))+'px'}});
if(!nar)L.float.forEach(g=>wsFl.appendChild(wsEl(g,true)));
document.querySelectorAll('.rail [data-pn]').forEach(b=>{const p=b.dataset.pn,g=wsFind(p);b.hidden=!MODEP.pattern.includes(p)||RO.off.includes(p);const fr=!!g&&g.a==p&&!g.col;b.classList.toggle('on',fr);b.classList.toggle('op',!!g&&!fr);b.title=fr?'':(g?'Open in a tab. Click to bring it to the front':'')});
wsTabFit();nums();if(railHook)railHook();if(WBX.wbRcls)WBX.wbRcls()}
// a panel with more tabs than fit: the chosen tab is scrolled into view and the edge that hides more tabs fades
function wsTabEdge(t){const h=t.parentElement;h.classList.toggle('ovr',t.scrollLeft+t.clientWidth<t.scrollWidth-1);h.classList.toggle('ovl',t.scrollLeft>1)}
function wsTabFit(){document.querySelectorAll('.wh .wt').forEach(t=>{const a=t.querySelector('.wtab.on');if(a){if(a.offsetLeft+a.offsetWidth>t.scrollLeft+t.clientWidth)t.scrollLeft=a.offsetLeft+a.offsetWidth-t.clientWidth;else if(a.offsetLeft<t.scrollLeft)t.scrollLeft=a.offsetLeft}wsTabEdge(t)})}
document.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('wt'))wsTabEdge(e.target)},true);
addEventListener('resize',()=>{if(wsReady)wsTabFit()});
// tabs and buttons
document.addEventListener('click',e=>{const w=e.target.closest('.wg');if(!w||Date.now()-wsJust<250)return;const g=wsGroup(w.dataset.g);if(!g)return;
const b=e.target.closest('.wb');if(b){const a=b.dataset.act,r=w.getBoundingClientRect();
if(a=='col')g.col=!g.col;else if(a=='close'){wsDetach(g)}else if(a=='float'){wsDetach(g);const ek=g.e||'r',hz=ek=='t'||ek=='b',fw=Math.round(hz?Math.min(340,r.width):Math.min(320,r.width)),fh=Math.round(hz?Math.max(300,Math.min(420,innerHeight-120)):Math.min(Math.max(r.height,260),560));Object.assign(g,{x:Math.round(ek=='l'?r.right+14:ek=='r'?r.left-fw-14:r.left),y:Math.max(Math.round(document.querySelector('.stage').getBoundingClientRect().top+56),Math.round(ek=='t'?r.bottom+14:ek=='b'?r.top-fh-14:r.top)),w:fw,h:fh,col:false});wsL().float.push(g)}
else if(a=='dock'){wsDetach(g);g.col=false;g.f=1;wsDockIns(wsL(),g,g.e||'r',1e9)}wsSave();wsRender();return}
const t=e.target.closest('.wtab');if(t){g.a=t.dataset.t;g.col=false;panel=g.a;wsSave();wsRender()}});
// floating windows come to the front when touched
document.addEventListener('pointerdown',e=>{const w=e.target.closest('.wg.fl');if(w){w.style.zIndex=++wsZ;const g=wsGroup(w.dataset.g),F=wsL().float,i=F.indexOf(g);if(i>=0&&i<F.length-1){F.splice(i,1);F.push(g);wsSave()}}},true);
// dragging: tabs, title bars, splitters, resize corner
document.addEventListener('pointerdown',e=>{if(e.button!==0)return;const tg=e.target;
const eh=tg.closest('.wed');if(eh){const dk=eh.parentElement,k=dk.dataset.e;e.preventDefault();eh.classList.add('on');document.body.classList.add('wsedge');wd={k:'edge',h:eh,e:k,sx:e.clientX,sy:e.clientY,s0:dk.getBoundingClientRect()[k=='t'||k=='b'?'height':'width'],on:true};return}
const sp=tg.closest('.wsp');if(sp){const a=sp.previousElementSibling,b=sp.nextElementSibling,ga=wsGroup(a.dataset.g),gb=wsGroup(b.dataset.g);if(!ga||!gb||ga.col||gb.col)return;e.preventDefault();const hz=sp.parentElement.classList.contains('hz');wd={k:'split',sp,a,b,ga,gb,hz,ha:hz?a.getBoundingClientRect().width:a.getBoundingClientRect().height,hb:hz?b.getBoundingClientRect().width:b.getBoundingClientRect().height,sy:hz?e.clientX:e.clientY,on:true};sp.classList.add('on');return}
const rs=tg.closest('.wrs');if(rs){const w=rs.closest('.wg');e.preventDefault();wd={k:'size',w,g:wsGroup(w.dataset.g),sx:e.clientX,sy:e.clientY,r:w.getBoundingClientRect(),on:true};return}
const h=tg.closest('.wg .wh');if(!h||tg.closest('.wb'))return;const el=h.closest('.wg'),g=wsGroup(el.dataset.g);if(!g)return;const tab=tg.closest('.wtab');
wd={k:'move',g,el,p:tab?tab.dataset.t:null,sx:e.clientX,sy:e.clientY,on:false,fl:el.classList.contains('fl'),r:el.getBoundingClientRect(),t:null}});
function wsTarget(e){wsInd.hidden=true;wsTint.hidden=true;document.querySelectorAll('.wg.wdrop').forEach(x=>x.classList.remove('wdrop'));document.querySelectorAll('.dk.dropz').forEach(x=>x.classList.remove('dropz'));wsZones(null);
const x=document.elementFromPoint(e.clientX,e.clientY);if(!x)return{k:'float'};const tb=x.closest('.wg .wh'),own=wd.whole?wd.el:null;
if(tb){const w=tb.closest('.wg');if(w!==own&&!(w===wd.el&&!wd.whole)){w.classList.add('wdrop');return{k:'merge',g:wsGroup(w.dataset.g)}}}
if(wsNarrow())return{k:'float'};
const dk=x.closest('.dk');
if(dk&&!dk.hidden){const ed=dk.dataset.e,box=wsBox[ed],vert=ed=='l'||ed=='r',gs=[...box.querySelectorAll(':scope>.wg')].filter(w=>w!==own),br=box.getBoundingClientRect(),cur=vert?e.clientY:e.clientX;
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
if(wd.k=='edge'){const k=wd.e,d=k=='r'?wd.sx-e.clientX:k=='l'?e.clientX-wd.sx:k=='b'?wd.sy-e.clientY:e.clientY-wd.sy;wsSetSz(k,wd.s0+d);return}
if(wd.k=='split'){const dy=(wd.hz?e.clientX:e.clientY)-wd.sy,mn=wd.hz?160:80,ha=Math.max(mn,wd.ha+dy),hb=Math.max(mn,wd.hb-(ha-wd.ha)),tot=wd.ga.f+wd.gb.f;wd.ga.f=tot*ha/(ha+hb);wd.gb.f=tot-wd.ga.f;wd.a.style.flexGrow=wd.ga.f;wd.b.style.flexGrow=wd.gb.f;return}
if(wd.k=='size'){wd.g.w=Math.max(200,Math.round(wd.r.width+e.clientX-wd.sx));wd.g.h=Math.max(120,Math.round(wd.r.height+e.clientY-wd.sy));wd.w.style.width=wd.g.w+'px';wd.w.style.height=wd.g.h+'px';return}
if(!wd.on){if(Math.hypot(e.clientX-wd.sx,e.clientY-wd.sy)<6)return;wd.on=true;wd.whole=!wd.p||wd.g.tabs.length==1;document.body.classList.add('wsdrag');
if(wd.whole&&wd.fl){wd.live=true;wd.el.classList.add('lift');wd.ox=wd.sx-wd.r.left;wd.oy=wd.sy-wd.r.top}
else{wd.gh=document.createElement('div');wd.gh.className='wghost';wd.gh.textContent=wd.whole?wd.g.tabs.map(p=>PNAME[p]).join(' · '):PNAME[wd.p];document.body.appendChild(wd.gh);wd.ox=40;wd.oy=14;if(wd.whole)wd.el.classList.add('lift')}}
if(wd.live){wd.el.style.left=(e.clientX-wd.ox)+'px';wd.el.style.top=Math.max(0,e.clientY-wd.oy)+'px'}else{wd.gh.style.left=(e.clientX+12)+'px';wd.gh.style.top=(e.clientY+10)+'px'}
wd.t=wsTarget(e)});
document.addEventListener('pointerup',e=>{if(!wd)return;const d=wd;wd=null;
if(d.k=='split'){d.sp.classList.remove('on');wsSave();return}if(d.k=='size'){wsSave();return}if(d.k=='edge'){d.h.classList.remove('on');document.body.classList.remove('wsedge');wsSave();return}
if(!d.on)return;wsJust=Date.now();document.body.classList.remove('wsdrag');if(d.gh)d.gh.remove();wsInd.hidden=true;wsTint.hidden=true;document.querySelectorAll('.dk.dropz').forEach(x=>x.classList.remove('dropz'));document.querySelectorAll('.wg.wdrop').forEach(x=>x.classList.remove('wdrop'));
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
function setPanel(p){if(!PNAME[p])p='canvas';if(!wsReady)setView();
const L=wsL();let g=wsFind(p);
// a tool that is not open yet opens docked on the right: Randomize beside the colour tools, anything else as a tab in the first group
if(!g&&p=='sedit'){g=wsG([p],{e:'b'});L.dock.push(g)}   // the Shape editor opens docked along the bottom
if(!g){const own=(p=='rand'||!L.dock.length)?wsG([p]):null;   // made in the same cases as before, so the series of random ids (and the seeded test runs) stays as it was
g=(p=='rand'&&L.dock.find(x=>x.tabs.includes('grade')))||L.dock[0];if(g)g.tabs.push(p);else{g=own;L.dock.push(g)}}g.a=p;g.col=false;panel=p;try{kv.set('wb24_panel',p)}catch(e){}
wsSave();wsRender();const el=document.querySelector(`.wg[data-g="${g.id}"]`);if(el&&el.classList.contains('fl'))el.style.zIndex=++wsZ;info();nums()}
WBX.wbOpenPanel=setPanel;
// Workspaces: read the arrangement of the tools, or put one in place (unknown tools are dropped, every tool stays in one place only)
WBX.wbWsGet=()=>JSON.parse(JSON.stringify({pattern:WS.pattern}));
WBX.wbWsSet=o=>{const had=!!wsFind('wspc');['pattern'].forEach(m=>{const L=o&&o[m];if(!L)return;const seen=new Set(),ok=g=>{if(!g||!Array.isArray(g.tabs))return false;g.tabs=g.tabs.filter(p=>MODEP[m].includes(p)&&!seen.has(p)&&seen.add(p));if(!g.tabs.includes(g.a))g.a=g.tabs[0];g.id=wsG([]).id;g.f=+g.f||1;g.e=g.e||'r';g.col=false;return g.tabs.length>0};
 const c=JSON.parse(JSON.stringify(L));WS[m]={dock:(c.dock||[]).filter(ok),float:(c.float||[]).filter(ok)}});
 // applying a workspace sets exactly that arrangement: the Workspaces tool closes with the rest, so a starting workspace never opens more than its own groups
 wsSave();wsRender();info();nums()};
// The Close all panels button turns into Default when no panel is open and a Default workspace exists: pressing it opens that layout, and it turns back into Close.
{const b=$('rcls'),CL=b.querySelector('svg').outerHTML,tp=b.querySelector('.tip'),DF='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M14.5 4.5v15"/><path d="M7 12h4M9 10v4"/></svg>';let dm=false;
const paint=()=>{const L=wsL(),e=!L.dock.length&&!L.float.length,d=e&&!!(WBX.wbWsDefault&&WBX.wbWsDefault());if(d===dm&&b.dataset.m)return;dm=d;b.dataset.m=d?'d':'c';b.setAttribute('aria-label',d?'Default panels':'Close all panels');b.querySelector('svg').outerHTML=d?DF:CL;tp.textContent=d?'Default panels':'Close all panels'};
WBX.wbRcls=paint;
b.onclick=()=>{const L=wsL();if(!L.dock.length&&!L.float.length){const w=WBX.wbWsDefault&&WBX.wbWsDefault();if(w){WBX.wbWsSet(w.layout);pmsg('Default panels.')}return}L.dock=[];L.float=[];wsSave();wsRender();pmsg('Closed all panels. Open any tool from the bar on the left.')}}
document.querySelector('.rail').onclick=e=>{const b=e.target.closest('[data-pn]');if(!b)return;const p=b.dataset.pn,g=wsFind(p);
// double-clicking the Randomize tool rolls a new piece, the same as pressing the Randomize button in its window (the window is left open)
if(p=='rand'&&e.isTrusted&&e.detail>1){const g2=wsFind('rand');if(!(g2&&g2.a=='rand'&&!g2.col))setPanel('rand');$('rzdo').click();return}
// clicking the button of a panel that is already showing closes it (only for real clicks, not when the app opens a panel itself)
if(e.isTrusted&&g&&g.a==p&&!g.col){const i=g.tabs.indexOf(p);g.tabs.splice(i,1);if(g.a==p)g.a=g.tabs[Math.max(0,i-1)];if(!g.tabs.length)wsDetach(g);wsSave();wsRender();return}
setPanel(p)};

// tool bar editing: the three-line button lists the tools that are off the bar; while it is open each tool on the bar shows an X to take it off; tools drag to a new place
{const more=$('rmore'),menu=$('rmenu');let ed=false,drag=null,jus=0;
const vis=()=>railBtns().filter(b=>!MODEP.pattern.includes(b.dataset.pn)||RO.off.includes(b.dataset.pn)?false:true);
function fill(){menu.innerHTML='';const off=railBtns().filter(b=>MODEP.pattern.includes(b.dataset.pn)&&RO.off.includes(b.dataset.pn));
{const g=document.createElement('div');g.className='rmg';off.forEach(b=>{const m=document.createElement('button');m.type='button';m.dataset.add=b.dataset.pn;m.setAttribute('aria-label','Add '+b.getAttribute('aria-label'));m.innerHTML=b.querySelector('svg').outerHTML+'<span class="tip">'+b.getAttribute('aria-label')+'</span>';if(wsFind(b.dataset.pn))m.classList.add('on');g.appendChild(m)});menu.append(g)}
menu.hidden=!ed;if(!menu.hidden){const w=railEl.getBoundingClientRect(),row=w.width>w.height;menu.style.left=(row?w.left:w.left-52)+'px';menu.style.top=(row?w.bottom:w.top)+'px';menu.style.width=w.width+'px';menu.style.height=w.height+'px';menu.style.bottom=''}}
function edit(on){ed=on;document.body.classList.toggle('rtray',on);more.classList.toggle('on',on);more.setAttribute('aria-expanded',String(on));fill()}
const refresh=()=>wsRender();railHook=()=>{if(ed)fill()};addEventListener('resize',()=>{if(ed)fill()});
more.onclick=()=>edit(!ed);
menu.onclick=e=>{if(Date.now()-jus<300)return;const m=e.target.closest('[data-add]');if(!m)return;const b=railEl.querySelector('[data-pn="'+m.dataset.add+'"]');if(b)b.click()};
addEventListener('keydown',e=>{if(e.key=='Escape'&&ed)edit(false)});
// a click that ends a drag is not a tool click
railEl.addEventListener('click',e=>{if(Date.now()-jus<300){e.stopPropagation();e.preventDefault()}},true);
// one drag for both columns: the bar and the repository get the same highlight, a line shows exactly where the tool will land, and the move happens on drop
const rowMode=()=>getComputedStyle(railEl).flexDirection=='row';
const inRect=(el,x,y)=>{const r=el.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom};
const hvClear=()=>railEl.querySelectorAll('.hv').forEach(x=>x.classList.remove('hv'));
const idOf=el=>el.dataset.pn||el.dataset.add;
const colItems=c=>c=='rail'?vis():[...menu.querySelectorAll('[data-add]')];
const colAt=(x,y)=>(!menu.hidden&&inRect(menu,x,y))?'tray':inRect(railEl,x,y)?'rail':null;
let D=null,ins=null;
function slot(c,x,y){const row=rowMode(),list=colItems(c).filter(el=>idOf(el)!==D.id);let idx=0;list.forEach(el=>{const r=el.getBoundingClientRect(),m=row?r.left+r.width/2:r.top+r.height/2;if((row?x:y)>m)idx++});return{c,idx,list,row}}
function showIns(sl){if(!ins){ins=document.createElement('div');ins.className='rins';document.body.appendChild(ins)}
const {list,idx,row,c}=sl,box=(c=='tray'?menu:railEl).getBoundingClientRect();let st,sz,cs,cz;
const R=el=>el.getBoundingClientRect();
if(list.length){const f=R(list[0]);cs=row?f.top:f.left;cz=row?f.height:f.width;
 const p=idx>0?(row?R(list[idx-1]).right:R(list[idx-1]).bottom):null,n=idx<list.length?(row?R(list[idx]).left:R(list[idx]).top):null;
 st=p!=null&&n!=null?(p+n)/2:p!=null?p+2:n-2}
else{cs=row?box.top+4:box.left+6;cz=row?box.height-8:40;st=row?box.left+8:box.top+8}
ins.style.display='block';
if(row){ins.style.left=(st-1.5)+'px';ins.style.top=cs+'px';ins.style.width='3px';ins.style.height=cz+'px'}
else{ins.style.top=(st-1.5)+'px';ins.style.left=cs+'px';ins.style.height='3px';ins.style.width=cz+'px'}}
function dragEnd(){if(!D)return;const d=D;D=null;if(d.g)d.g.remove();d.el.classList.remove('rsrc');document.body.classList.remove('rdragging');railEl.classList.remove('rtgt','rover');menu.classList.remove('rtgt','rover');if(ins)ins.style.display='none';return d}
railEl.addEventListener('pointerdown',e=>{if(e.button>0)return;const el=e.target.closest('.rail > [data-pn], #rmenu [data-add]');if(!el)return;D={el,id:idOf(el),src:el.dataset.pn?'rail':'tray',x:e.clientX,y:e.clientY,on:false,pid:e.pointerId,g:null}});
railEl.addEventListener('pointermove',e=>{if(!D||e.pointerId!==D.pid)return;
if(!D.on){if(Math.hypot(e.clientX-D.x,e.clientY-D.y)<7)return;D.on=true;hvClear();try{D.el.setPointerCapture(e.pointerId)}catch(_){}
 const g=document.createElement('div');g.className='rghost';g.innerHTML=D.el.querySelector('svg').outerHTML;document.body.appendChild(g);D.g=g;D.el.classList.add('rsrc');
 document.body.classList.add('rdragging');railEl.classList.add('rtgt');if(!menu.hidden)menu.classList.add('rtgt')}
D.g.style.left=(e.clientX-18)+'px';D.g.style.top=(e.clientY-18)+'px';
const c=colAt(e.clientX,e.clientY);railEl.classList.toggle('rover',c=='rail');menu.classList.toggle('rover',c=='tray');
if(c)showIns(slot(c,e.clientX,e.clientY));else if(ins)ins.style.display='none'});
const dragUp=e=>{if(!D||e.pointerId!==D.pid)return;const wasOn=D.on,x=e.clientX,y=e.clientY,cancel=e.type=='pointercancel';let sl=null;if(wasOn&&!cancel){const c=colAt(x,y);if(c)sl=slot(c,x,y)}
const d=dragEnd();if(!wasOn)return;jus=Date.now();if(!sl)return;
const el=railEl.querySelector('[data-pn="'+d.id+'"]'),ref=sl.list[sl.idx],end=railEl.querySelector('.rsp');
if(sl.c=='rail'){RO.off=RO.off.filter(k=>k!==d.id);railEl.insertBefore(el,ref||end)}
else{if(!RO.off.includes(d.id))RO.off.push(d.id);const rb=ref&&railEl.querySelector('[data-pn="'+idOf(ref)+'"]');railEl.insertBefore(el,rb||end)}
RO.order=railBtns().map(b=>b.dataset.pn);railSave();refresh()};
railEl.addEventListener('pointerup',dragUp);railEl.addEventListener('pointercancel',dragUp);railEl.addEventListener('lostpointercapture',e=>{if(D&&D.on&&e.pointerId===D.pid&&!D.el.isConnected)dragUp(e)});
// the name label and highlight follow the mouse itself (not the browser's hover state, which can stick after a drag or a touch)
railEl.addEventListener('pointermove',e=>{if(e.pointerType!='mouse'||D&&D.on)return;const b=document.elementFromPoint(e.clientX,e.clientY),t=b&&b.closest('.rail button');if(t&&t.classList.contains('hv'))return;hvClear();if(t)t.classList.add('hv')});
railEl.addEventListener('pointerleave',hvClear);
railOrder();
}

// ===== Randomize panel: which main features a roll may change. Anything switched off stays exactly as it is. Settings are remembered.
(()=>{const sec=document.querySelector('section.pn[data-p="rand"]'),fts=[...sec.querySelectorAll('[data-ft]')],subs=[...sec.querySelectorAll('[data-sub]')],KEY='wb38_rzft',SKEY='wb50_rzsub',by=k=>fts.find(c=>c.dataset.ft==k),sk=m=>subs.filter(c=>c.dataset.sub.startsWith(m+'.'));
// a main switch is a slider (0 off, 100 fully on) or, for Colours, a tick box. Older saves held true/false: true is 100.
const amtOf=c=>c.type=='range'?(+c.value||0)/100:(c.checked?1:0),isOn=c=>amtOf(c)>0,setAmt=(c,v)=>{if(c.type=='range')c.value=v?100:0;else c.checked=!!v};
try{const z=JSON.parse(kv.get(KEY)||'null');if(z)fts.forEach(c=>{const v=z[c.dataset.ft];if(v===undefined)return;if(c.type=='range')c.value=typeof v=='number'?Math.max(0,Math.min(100,v)):(v?100:0);else c.checked=!!v})}catch(e){}
try{const z=JSON.parse(kv.get(SKEY)||'null');if(z)subs.forEach(c=>{if(c.dataset.sub in z)c.checked=!!z[c.dataset.sub]})}catch(e){}
// a switch counts as on only if something under it is ticked (Stamps also counts Lettering)
const eff=c=>{const k=c.dataset.ft,ss=sk(k);if(!isOn(c))return false;if(!ss.length)return true;return ss.some(x=>x.checked)||(k=='stamps'&&isOn(by('text')))};
const get=()=>{const o={};fts.forEach(c=>o[c.dataset.ft]=eff(c));return o};
const sub=m=>{const ss=sk(m);return ss.length?new Set(ss.filter(c=>c.checked).map(c=>c.dataset.sub.slice(m.length+1))):null};
const sync=()=>{const st=isOn(by('stamps')),t=by('text');t.disabled=!st;(t.closest('.ctl')||t.parentNode).style.opacity=st?'':'.45';
sec.querySelectorAll('.rzx[data-rzx]').forEach(b=>{const m=b.dataset.rzx,ss=sk(m),n=ss.filter(c=>c.checked).length,all=n==ss.length;b.querySelector('.rzn').textContent=all?'All':n+'/'+ss.length;b.classList.toggle('part',!all);const box=sec.querySelector('[data-rzs="'+m+'"]');if(box)box.classList.toggle('off',!isOn(by(m)))});
const any=fts.some(c=>eff(c)&&!c.disabled),b=$('rzdo');if(b)b.disabled=!any;
const h=$('rzhint');if(h)h.textContent=any?'Only what is switched on changes. Everything else stays exactly as it is. Use the arrows to choose which kinds of change are allowed. The canvas stays the same size and shape unless Canvas shape or Canvas size is on, and the book cover is always kept.':'Nothing is switched on, so Randomize has nothing to change.'};
const save=()=>{try{kv.set(KEY,JSON.stringify(Object.fromEntries(fts.map(c=>[c.dataset.ft,c.type=='range'?+c.value:c.checked]))));kv.set(SKEY,JSON.stringify(Object.fromEntries(subs.map(c=>[c.dataset.sub,c.checked]))))}catch(e){}sync()};
sec.addEventListener('change',save);sec.addEventListener('input',save);
sec.addEventListener('click',e=>{const x=e.target.closest('[data-rzx]');if(x){const m=x.dataset.rzx,box=sec.querySelector('[data-rzs="'+m+'"]'),open=box.hidden;box.hidden=!open;x.setAttribute('aria-expanded',open?'true':'false');return}
const a=e.target.closest('[data-rzall],[data-rzno]');if(a){const m=a.dataset.rzall||a.dataset.rzno,on=!!a.dataset.rzall;sk(m).forEach(c=>c.checked=on);save()}});
$('rzall').onclick=()=>{fts.forEach(c=>setAmt(c,true));subs.forEach(c=>c.checked=true);nums();save()};$('rznone').onclick=()=>{fts.forEach(c=>setAmt(c,false));nums();save()};
const amt=k=>{const c=by(k);return c&&eff(c)?amtOf(c):0};
// Shape folders: which library folders a roll may take shapes from. New folders start ticked; only the unticked ones are remembered.
// Ticking a folder ticks the folders inside it. At least one folder that holds shapes always stays ticked.
const FK='wb160_rzfold',fbox=sec.querySelector('[data-rzfbox]'),flist=sec.querySelector('[data-rzflist]'),fbtn=sec.querySelector('[data-rzfx]');
let foff=new Set(),FS=[];try{const z=JSON.parse(kv.get(FK)||'[]');if(Array.isArray(z))foff=new Set(z.filter(v=>typeof v=='string'))}catch(e){}
const fPick=()=>FS.filter(x=>x.c>0),fOn=x=>!foff.has(x.v),fHas=()=>FS.some(x=>x.ks.length&&fOn(x));
const fLabel=()=>{try{FS=libRz()}catch(e){return}const p=fPick(),n=p.filter(fOn).length,all=n==p.length;fbtn.querySelector('.rzn').textContent=all?'All':n+'/'+p.length;fbtn.classList.toggle('part',!all)};
const fSaveOff=()=>{try{kv.set(FK,JSON.stringify([...foff]))}catch(e){}};
function fPaint(){try{FS=libRz()}catch(e){FS=[]}flist.textContent='';FS.forEach(x=>{const l=document.createElement('label'),c=document.createElement('input'),s=document.createElement('span');l.className='chk sub';l.style.marginLeft=(x.d*14)+'px';if(!x.c)l.style.opacity='.45';c.type='checkbox';c.dataset.fv=x.v;c.checked=x.c>0&&fOn(x);c.disabled=!x.c;s.textContent=x.n;l.append(c,s);flist.appendChild(l)});fLabel()}
const fKids=i=>{const o=[];for(let j=i+1;j<FS.length&&FS[j].d>FS[i].d;j++)o.push(FS[j]);return o};
flist.addEventListener('change',e=>{const c=e.target.closest('[data-fv]');if(!c)return;const i=FS.findIndex(x=>x.v==c.dataset.fv);if(i<0)return;const prev=new Set(foff);[FS[i],...fKids(i)].forEach(x=>{if(!x.c)return;if(c.checked)foff.delete(x.v);else foff.add(x.v)});if(!fHas())foff=prev;fSaveOff();fPaint()});
fbox.addEventListener('click',e=>{if(e.target.closest('[data-rzfall]')){foff.clear();fSaveOff();fPaint()}else if(e.target.closest('[data-rzfno]')){try{FS=libRz()}catch(e2){return}const keep=FS.find(x=>x.ks.length);foff=new Set(fPick().filter(x=>x!==keep).map(x=>x.v));fSaveOff();fPaint()}});
fbtn.onclick=()=>{const open=fbox.hidden;if(open)fPaint();fbox.hidden=!open;fbtn.setAttribute('aria-expanded',open?'true':'false')};
// null while every folder is ticked (the roll then works exactly as before); otherwise the shapes of each ticked folder, with the Dots set kept apart as the accents
const folders=()=>{fLabel();const p=fPick();if(p.every(fOn)||!fHas())return null;const on=p.filter(x=>fOn(x)&&x.ks.length),dots=on.find(x=>x.v=='b:Dots'),th=on.filter(x=>x!==dots).map(x=>x.ks);return th.length||dots?{themes:th,dots:dots?dots.ks:null}:null};
sync();fLabel();WBX.wbRZ={get,sub,amt,folders};
$('rzdo').onclick=()=>randomize(false);
})();

// ---- zoom
function fitZ(){const b=$('boardP');if(b.classList.contains('off'))return;const w=b.clientWidth-64,h=b.clientHeight-64;fitS=Math.max(.05,Math.min(w/CW,h/CH))}
function applyZ(){fitZ();const s=z||fitS;$('art').style.width=Math.round(CW*s)+'px';$('art').style.height=Math.round(CH*s)+'px';$('artsh').style.width=$('art').style.width;$('artsh').style.height=$('art').style.height;$('zl').textContent=Math.round(s*100)+'%';$('zl').title=z?'Fit to screen':'Fitted to screen';if(window.bkZ)bkZ();if(WBX.wbZoomed)WBX.wbZoomed()}
function zoomAt(ns,cx,cy){const b=$('boardP'),a=$('art'),r0=a.getBoundingClientRect(),fx=(cx-r0.left)/(r0.width||1),fy=(cy-r0.top)/(r0.height||1);z=Math.min(8,Math.max(.1,ns));applyZ();const r1=a.getBoundingClientRect();b.scrollLeft+=r1.left+fx*r1.width-cx;b.scrollTop+=r1.top+fy*r1.height-cy}
const zoomMid=f=>{const r=$('boardP').getBoundingClientRect();zoomAt((z||fitS)*f,r.left+r.width/2,r.top+r.height/2)};
WBX.wbApplyZ=applyZ;WBX.wbZoomAt=zoomAt;WBX.wbZoomTo=s=>{const r=$('boardP').getBoundingClientRect();zoomAt(s,r.left+r.width/2,r.top+r.height/2)};WBX.wbZoomNow=()=>z||fitS;WBX.wbZoomIn=()=>!!z&&z>fitS*1.001;
$('zi').onclick=()=>zoomMid(1.25);$('zo').onclick=()=>zoomMid(1/1.25);$('zl').onclick=()=>{z=0;applyZ()};
$('boardP').addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();zoomAt((z||fitS)*(e.deltaY<0?1.1:1/1.1),e.clientX,e.clientY)},{passive:false});
try{new ResizeObserver(()=>applyZ()).observe($('boardP'))}catch(e){window.addEventListener('resize',applyZ)}
new MutationObserver(()=>applyZ()).observe($('art'),{attributes:true,attributeFilter:['viewBox']});

// ---- slider rows with editable number fields
function addNum(row,r){const w=document.createElement('div');w.className='num';const n=document.createElement('input');n.type='number';n.min=r.min;n.max=r.max;n.step=r.step||1;
const lb=row.querySelector('label');n.setAttribute('aria-label',lb?lb.textContent:'Value');if(r.dataset.u){n.className='u';const i=document.createElement('i');i.textContent=r.dataset.u;w.appendChild(i)}
w.prepend(n);row.appendChild(w);r._n=n;
n.addEventListener('change',()=>{if(paintBack){n.value=+(+r.value).toFixed(2);return}let v=+n.value;if(n.value===''||isNaN(v))return paint(r);v=Math.min(+r.max,Math.max(+r.min,v));r.value=v;r.dispatchEvent(new Event('input',{bubbles:true}));paint(r)});
n.addEventListener('keydown',e=>{if(e.key=='Enter')n.blur();else if(e.key=='Escape'){e.stopPropagation();paintBack=1;n.blur();paintBack=0;n.value=+(+r.value).toFixed(2)}})}
// double-click any number box to select all of it; whatever you type then replaces it (Enter or click away to apply, Esc to cancel)
let paintBack=0;document.addEventListener('dblclick',e=>{const t=e.target;if(t&&t.matches&&t.matches('input[type=number]')){t.focus();t.select()}});
function enhance(){document.querySelectorAll('.dock input[type=range]').forEach(r=>{if(r.closest('.ctl')||r.hasAttribute('data-plain'))return;const lb=r.previousElementSibling,row=document.createElement('div');row.className='ctl';
const hasL=lb&&lb.tagName=='LABEL';r.parentNode.insertBefore(row,hasL?lb:r);if(hasL){row.appendChild(lb);if(!r.id)0;lb.htmlFor=r.id}row.appendChild(r);addNum(row,r)});
document.querySelectorAll('#sel input[type=range]').forEach(r=>{const row=r.closest('.ctl');if(row&&!row.querySelector('.num')){row.querySelector('label').htmlFor=r.id;addNum(row,r)}})}
function paint(r){const lo=+r.min,hi=+r.max,p=hi>lo?(r.value-lo)/(hi-lo)*100:0;r.style.setProperty('--p',p.toFixed(1)+'%');if(r._n&&document.activeElement!==r._n)r._n.value=+(+r.value).toFixed(2)}
function nums(){document.querySelectorAll('input[type=range]').forEach(paint)}
WBX.wbNums=nums;
document.addEventListener('input',e=>{if(e.target.type=='range')paint(e.target)});

// ---- status line + dock subtitle
function info(){const ks=new Set(WBS.tiles.map(t=>shOf(t).k)),k=ks.size>1?'Mixed':SHN[[...ks][0]]||'Rectangle',c=WBS.dim.c;
$('sinfo').innerHTML=`${WBS.book.on?`<span class="it">Print cover <b>${bk().W.toFixed(2)} × ${bk().H.toFixed(2)} in</b></span>`:`<span class="it">Canvas <b>${(()=>{const k=csk(),r=(+(+c[0]).toFixed(2))+':'+(+(+c[1]).toFixed(2));return k=='rect'?r:CSN[k]+(CASP.includes(k)?' '+r:'')})()}</b></span>`}<span class="it">Block <b>${k}</b></span><span class="it">Stamps <b>${WBS.tiles.length}</b></span><span class="it">Layers <b>${WBS.layers.length}</b></span>`;
}
// wrap redraw hooks so the shell stays in sync
$('rzbar').onclick=()=>$('rzdo').click();
const _draw=WBH.draw;WBH.draw=function(){_draw();nums();info()};
const _sp=WBH.syncPr;WBH.syncPr=function(){_sp();nums()};const _stx=WBH.syncTex;WBH.syncTex=function(){_stx();nums()};

// ---- toast-style status messages
let mt=0;new MutationObserver(()=>{clearTimeout(mt);$('pmsg').style.opacity=1;if($('pmsg').textContent)mt=setTimeout(()=>{$('pmsg').style.transition='opacity .6s';$('pmsg').style.opacity=0;setTimeout(()=>{$('pmsg').style.transition=''},700)},6000)}).observe($('pmsg'),{childList:true,characterData:true,subtree:true});

// ---- menus
const menus=[['fileb','filem']];
const closeMenus=()=>menus.forEach(([b,m])=>{$(m).hidden=true;$(b).setAttribute('aria-expanded','false')});WBX.wbCloseMenus=closeMenus;
menus.forEach(([b,m])=>{$(b).onclick=e=>{e.stopPropagation();const o=$(m).hidden;closeMenus();closeDD();$(m).hidden=!o;if(o)placeFloat($(m),$(b),$(m).classList.contains('r'));$(b).setAttribute('aria-expanded',String(o))};$(m).addEventListener('click',e=>{if(e.target.closest('button,label')&&!e.target.closest('[data-sure]'))closeMenus()})});
document.addEventListener('click',e=>{if(!e.target.closest('.menu,.pop'))closeMenus()});
// A floating popup would drift away from its button if the page or a panel scrolled under it, so close it instead.
addEventListener('scroll',e=>{const t=e.target;if(t&&t.closest&&t.closest('.pop,.ddl'))return;if(typeof typing=='function'&&typing())return;closeMenus();closeDD()},true);addEventListener('resize',()=>{if(typeof typing=='function'&&typing())return;closeMenus();closeDD()});

// ---- projects dialog
const closeDlg=()=>{$('plist').hidden=true;$('pls').classList.remove('on')};
$('pclose').onclick=closeDlg;$('plist').addEventListener('click',e=>{if(e.target===$('plist'))closeDlg()});
$('pnw2').onclick=()=>{const b=$('pnw2');$('pnw').click();if($('pnw').dataset.sure){const o=b.dataset.o||b.textContent;b.dataset.o=o;b.textContent='Click again: can’t be undone';setTimeout(()=>{b.textContent=o;delete b.dataset.o},3500)}else if(b.dataset.o){b.textContent=b.dataset.o;delete b.dataset.o}};
$('pgrid').addEventListener('click',e=>{const b=e.target.closest('[data-a="open"]');if(b)setTimeout(()=>{if(b.textContent=='Open')closeDlg()},60)});

// ---- undo / redo (snapshots of the whole project state)
let hist=[coreStr()],hi=0;
const ub=()=>{$('undo').disabled=hi<=0;$('redo').disabled=hi>=hist.length-1;if(WBX.wbHistPaint)WBX.wbHistPaint()};
let histL=['Start'],histT=[Date.now()],histTh=[''];
const HK={tiles:'Stamp change',layers:'Layer change',proj:'Colours',dim:'Canvas size',pg:'Grid',pr:'Roughness',tex:'Texture',texLib:'Texture library',grade:'Grade'};
function hLabel(a,b){try{const A=JSON.parse(a),B=JSON.parse(b),ch=Object.keys(HK).filter(k=>JSON.stringify(A[k])!==JSON.stringify(B[k]));if(!ch.length)return 'Change';if(ch.length>2)return 'Several changes';if(ch[0]=='tiles'){const n=t=>t.reduce((q,x)=>q+(x.items||[]).length,0),x=n(A.tiles),y=n(B.tiles);if(A.tiles.length!=B.tiles.length)return B.tiles.length>A.tiles.length?'Added stamp':'Removed stamp';if(y>x)return 'Added shape'+(y-x>1?'s':'');if(y<x)return 'Removed shape'+(x-y>1?'s':'');return 'Moved or edited shape'}return ch.map(k=>HK[k]).join(' + ')}catch(e){return 'Change'}}
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
function cap(){if(WBS.WBDRG||WBX.wbNoCap||WBX.wbRollHold)return;if(texNorm())buildTex();const s=coreStr();if(s!==hist[hi]){const prev=hist[hi];hist.length=hi+1;histL.length=hi+1;histT.length=hi+1;histTh.length=hi+1;hist.push(s);{const nl=WBX.wbLabelNext,pl=WBX.wbLabelPlain;WBX.wbLabelNext=null;WBX.wbLabelPlain=null;const named=nl&&performance.now()-nl.at<3000,plain=!named&&pl&&performance.now()-pl.at<3000;histL.push(named?nl.t:plain?pl.t:hLabel(prev,s));if(stUnlocked()!=null&&!named&&/^Added shape/.test(histL[histL.length-1])&&seAuto()&&!wsFind('sedit'))setPanel('sedit');if(named){thWant=s;clearTimeout(thT);thT=setTimeout(thRun,1500)}}histT.push(Date.now());histTh.push('');navDirty();if(hist.length>120){hist.shift();histL.shift();histT.shift();histTh.shift()}hi=hist.length-1}ub()}
setInterval(cap,450);
function applyCore(c){trayIn(c);WBS.tiles=c.tiles;WBS.layers=c.layers;WBS.proj=c.proj;WBS.dim=c.dim;WBS.pgrid=pgFix(c.pg,c.layers);WBS.cur=Math.min(WBS.cur,WBS.tiles.length-1);WBS.tiles.forEach(shOf);migLayers();setDim();WBS.pr=c.pr;WBS.tex=c.tex;if(Array.isArray(c.texLib))WBS.texLib=txClean(c.texLib);texNorm();if(c.grade&&WBX.wbGrade&&JSON.stringify(c.grade)!=JSON.stringify(WBX.wbGrade.get()))WBX.wbGrade.set(c.grade);WBS.nid=1+Math.max(0,...WBS.tiles.map(t=>+t.id||0));
WBS.cur=Math.min(WBS.cur,WBS.tiles.length-1);WBS.selL=Math.min(WBS.selL,WBS.layers.length-1);selOne(-1);WBS.symKey='';try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}
store();savePr();saveTex();WBH.syncPr();WBH.syncTex();buildTex();upd();if(WBX.wbGrade&&WBX.wbGrade.sync)WBX.wbGrade.sync()}   // a stamp's own grade is part of the stamp, so the Grading sliders are read again after every step
// Loading a step normalises the document a little (for example every stamp gets an empty texture list), so the entry is re-read
// after loading; otherwise the next capture sees a difference, adds a step and cuts off the steps still to redo.
function goTo(i){hi=i;applyCore(JSON.parse(hist[hi]));hist[hi]=coreStr();navDirty()}
function undo(){cap();if(hi>0){const was=histL[hi];goTo(hi-1);pmsg('Undid: '+was)}ub()}
function redo(){if(hi<hist.length-1){goTo(hi+1);pmsg('Redid: '+histL[hi])}ub()}
$('undo').onclick=undo;$('redo').onclick=redo;ub();
WBX.wbHistGet=i=>hist[i];WBX.wbHistIdx=()=>hi;WBX.wbHistLabel=i=>histL[i]||'Change';WBX.wbResetHist=()=>{if(WBX.wbBA)wbBA.reset();hist=[coreStr()];histL=['Start'];histT=[Date.now()];histTh=[''];hi=0;thWant=null;ub();if(WBX.wbSnapLoad)WBX.wbSnapLoad()};WBX.wbCap=cap;WBX.wbApply=applyCore;
// ---- History panel + named snapshots
(()=>{const sec=document.querySelector('section.pn[data-p="hist"]'),hl=$('hhl'),sl=$('hsl'),XI=`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
let snaps=[],sk='',raf=0,ren=-1;
const DOTS='<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>';
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


// ---- keyboard shortcuts
document.addEventListener('keydown',e=>{const t=e.target,typing=t.matches&&t.matches('input,select,textarea'),m=e.metaKey||e.ctrlKey,k=e.key.toLowerCase(),q=WBS.tiles[WBS.cur]&&WBS.tiles[WBS.cur].items[WBS.sel];
if(m&&k=='z'){if(typing&&(t.type=='text'||t.type=='number'))return;e.preventDefault();e.shiftKey?redo():undo()}
else if(m&&k=='y'){e.preventDefault();redo()}
else if(m&&k=='s'){e.preventDefault();cmdGet('file.save').run()}
else if(m&&k=='d'&&!typing&&q&&stUnlocked()!=null){e.preventDefault();cmdGet('stamp.duplicateMotif').run()}
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
const tipRows=()=>document.querySelectorAll('.ctl').forEach(row=>{const r=row.querySelector('input[type=range]');if(r&&!row.title)row.title='Double-click to reset'});
$('gti').onclick=()=>{WBS.edInk=!WBS.edInk;tbSync();upd()};
$('gtx').onclick=()=>{WBS.edTx=!WBS.edTx;tbSync();upd()};
$('gtm').onclick=()=>{WBS.edMk=!WBS.edMk;$('gtm').classList.toggle('on',WBS.edMk);$('gtm').setAttribute('aria-pressed',String(WBS.edMk));upd()};
document.addEventListener('keydown',e=>{if(e.target.matches&&e.target.matches('input,select,textarea'))return;if(!e.metaKey&&!e.ctrlKey&&e.key.toLowerCase()=='g'){WBS.pgrid.show=!WBS.pgrid.show;upd();if(WBX.wbCap)WBX.wbCap()}});
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

enhance();{const r=$('ts'),row=r.closest('.ctl'),f=document.createElement('div');f.className='ctl fitrow';
const ic=(d)=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
f.innerHTML=`<label>Fit to frame</label><div class="seg" id="tsfit">`+
`<button type="button" data-f="" title="Off: stamps run off the frame edges">${ic('<circle cx="12" cy="12" r="7.5"/><path d="M6.7 17.3l10.6-10.6"/>')}Off</button>`+
`<button type="button" data-f="h" title="Fit width">${ic('<path d="M3.5 12h17M7 8.5L3.5 12 7 15.5M17 8.5l3.5 3.5-3.5 3.5"/><path d="M3.5 5v2.5M20.5 5v2.5M3.5 16.5V19M20.5 16.5V19"/>')}Width</button>`+
`<button type="button" data-f="v" title="Fit height">${ic('<path d="M12 3.5v17M8.5 7L12 3.5 15.5 7M8.5 17l3.5 3.5 3.5-3.5"/><path d="M5 3.5h2.5M16.5 3.5H19M5 20.5h2.5M16.5 20.5H19"/>')}Height</button></div>`;
row.after(f);
f.onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;const L=LY();L.fit=b.dataset.f;if(L.fit)L.size=+fitTs(L).toFixed(3);store();upd();sync();nums()};
r.oninput=()=>{const L=LY();L.size=L.fit?+fitTs(L,+r.value).toFixed(3):+r.value;if(L.fit){r.value=L.size;paint(r)}store();upd()}}
tipRows();WS.pattern={dock:[],float:[]};setView();info();nums();requestAnimationFrame(()=>{applyZ();nums()});

{const sp=document.getElementById('splash'),t0=performance.now();if(sp){const go=()=>{const w=Math.max(0,520-(performance.now()-t0));setTimeout(()=>{sp.classList.add('out');setTimeout(()=>sp.remove(),320)},w)};const f=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1400))]):Promise.resolve();requestAnimationFrame(()=>requestAnimationFrame(()=>f.then(go)))}}
{const b=$('gdt');let on=true;try{on=kv.get('wb93_dots')!=='0'}catch(e){}const ap=()=>{document.body.classList.toggle('plain',!on);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))};ap();b.onclick=()=>{on=!on;try{kv.set('wb93_dots',on?'1':'0')}catch(e){}ap()}}
clearAll(true);WBS.cp={id:null,name:'',saved:coreStr()};$('pnm').value='';paintPst();$('pmsg').textContent='';
// warn before leaving if there's unsaved work (a fresh blank document doesn't count)
{addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue=''}})}
})();
}
export {init34};
