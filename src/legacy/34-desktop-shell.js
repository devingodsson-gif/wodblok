// ===== Desktop shell: panels, views, zoom, number fields, menus, undo/redo, shortcuts =====
(()=>{
const PN={tex:'Textures',slib:'Stamp library',text:'Text',lyrs:'Layers',canvas:'Canvas',colors:'Colors',stamp:'Stamp',motifs:'Motifs',layers:'Arrangement',cover:'Book cover'};
let view='pattern',panel='canvas',z=0,fitS=1;try{panel=localStorage.getItem('wb24_panel')||'canvas';if(!PN[panel])panel='canvas'}catch(e){}

// ===== Workspace: each mode (Pattern / Stamp editor) has its own set of panels. Panels live in groups (tabs).
// Groups are docked on the left, right, top or bottom edge of the window, or float over the stage. Drag a tab or a group's title bar to move it:
// drop on another group's title bar to tab it in, on a dock to stack it there, on an empty window edge to open a dock, anywhere else to float it.
const PNAME={slib:'Stamp library',text:'Text',lyrs:'Layers',canvas:'Canvas',colors:'Colors',stamp:'Stamp',motifs:'Motifs',mlist:'Motif list',preview:'Preview',grid:'Grid',layers:'Arrangement',pgrid:'Grid',grade:'Grade',tex:'Textures',rand:'Randomize',hist:'History'};
const MODEP={pattern:['lyrs','layers','pgrid','canvas','colors','grade','tex','rand','hist','slib'],stamp:['motifs','text','mlist','preview','grid','stamp','colors','grade','tex','rand','hist','slib']};
let wsReady=false,wsZ=10,wd=null,wsJust=0;
const wsG=(tabs,o={})=>({id:'g'+Math.random().toString(36).slice(2,9),tabs,a:tabs[0],f:1,e:'r',...o});
const wsDef=m=>m=='pattern'?{dock:[wsG(['lyrs'],{f:.85}),wsG(['layers','canvas']),wsG(['colors','grade','tex'],{f:.8})],float:[]}:{dock:[wsG(['motifs']),wsG(['stamp','colors','grade','tex','rand'])],float:[wsG(['mlist'],{x:null,y:null,w:230,h:440}),wsG(['preview'],{x:null,y:null,w:260,h:380,pos:'r'}),wsG(['grid'],{x:null,y:null,w:260,h:250,pos:'rb'})]};
let WS={pattern:wsDef('pattern'),stamp:wsDef('stamp')};
try{const sv=JSON.parse(localStorage.getItem('wb30_ws')||'null');if(sv)['pattern','stamp'].forEach(m=>{const L=sv[m];if(!L||!Array.isArray(L.dock)||!Array.isArray(L.float))return;const seen=new Set(),ok=g=>{if(!g||!Array.isArray(g.tabs))return false;g.tabs=g.tabs.filter(p=>MODEP[m].includes(p)&&!seen.has(p)&&seen.add(p));if(!g.tabs.includes(g.a))g.a=g.tabs[0];g.id=String(g.id||wsG([]).id);g.f=+g.f||1;return g.tabs.length>0};WS[m]={dock:L.dock.filter(ok),float:L.float.filter(ok)}});if(sv&&!sv.pv&&!WS.stamp.dock.concat(WS.stamp.float).some(g=>g.tabs.includes('preview')))WS.stamp.float.push(wsG(['preview'],{x:null,y:null,w:260,h:380,pos:'r'}));if(sv&&!sv.gr&&!WS.stamp.dock.concat(WS.stamp.float).some(g=>g.tabs.includes('grid')))WS.stamp.float.push(wsG(['grid'],{x:null,y:null,w:260,h:250,pos:'rb'}))}catch(e){}
try{const sv0=JSON.parse(localStorage.getItem('wb30_ws')||'null');if(sv0&&!sv0.ly&&!WS.pattern.dock.concat(WS.pattern.float).some(g=>g.tabs.includes('lyrs')))WS.pattern.dock.unshift(wsG(['lyrs'],{f:.85}))}catch(e){}
try{const sv1=JSON.parse(localStorage.getItem('wb30_ws')||'null');if(sv1&&!sv1.rs&&!WS.stamp.dock.concat(WS.stamp.float).some(g=>g.tabs.includes('rand'))){const g=WS.stamp.dock.find(g=>g.tabs.includes('grade'))||WS.stamp.dock[0];if(g)g.tabs.push('rand');else WS.stamp.dock.push(wsG(['rand']))}}catch(e){}
try{const sv2=JSON.parse(localStorage.getItem('wb30_ws')||'null');if(sv2&&!sv2.tx)['pattern','stamp'].forEach(m=>{if(!WS[m].dock.concat(WS[m].float).some(g=>g.tabs.includes('tex'))){const g=WS[m].dock.find(g=>g.tabs.includes('grade'))||WS[m].dock[0];if(g)g.tabs.push('tex');else WS[m].dock.push(wsG(['tex']))}})}catch(e){}
WS.pv=1;WS.gr=1;WS.ly=1;WS.rs=1;WS.tx=1;
const wsSave=()=>{try{localStorage.setItem('wb30_ws',JSON.stringify(WS))}catch(e){}};
const wsL=()=>WS[view]||WS.pattern;
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
function wsClamp(g){const st=document.querySelector('.stage').getBoundingClientRect();if(g.x==null){const r=g.pos=='r'||g.pos=='rb';g.x=Math.round(r?st.right-(+g.w||300)-12:st.left+12);g.y=Math.round(st.top+52+(g.pos=='rb'?392:0))}
g.w=Math.max(200,Math.min(+g.w||300,innerWidth-20));g.h=Math.max(120,Math.min(+g.h||420,innerHeight-60));g.x=Math.max(-g.w+80,Math.min(g.x,innerWidth-80));g.y=Math.max(0,Math.min(g.y,innerHeight-36));if(g.y+g.h>innerHeight-8)g.y=Math.max(0,innerHeight-8-g.h);g.h=Math.min(g.h,innerHeight-8-g.y)}
function wsEl(g,fl){const el=document.createElement('div');el.className='wg'+(fl?' fl':'')+(g.col?' col':'');el.dataset.g=g.id;
if(fl){wsClamp(g);el.style.cssText=`left:${g.x}px;top:${g.y}px;width:${g.w}px;${g.col?'':`height:${g.h}px;`}z-index:${++wsZ}`}else el.style.flexGrow=g.f;
el.innerHTML=`<div class="wh" title="Drag to move. Drop on another panel's tabs to group it, on a dock to stack it there, or at any edge of the window to dock it."><div class="wt">${g.tabs.map(p=>`<button type="button" class="wtab${p==g.a?' on':''}" data-t="${p}">${PNAME[p]}</button>`).join('')}</div>`+
`<button type="button" class="wb" data-act="col" title="${g.col?'Expand':'Collapse'}">${g.col?IC.exp:IC.col}</button><button type="button" class="wb" data-act="${fl?'dock':'float'}" title="${fl?'Dock to the side':'Pop out'}">${fl?IC.dock:IC.pop}</button><button type="button" class="wb" data-act="close" title="Close (reopen from the left bar)">${IC.x}</button></div><div class="wbd"></div>${fl?'<div class="wrs" title="Resize"></div>':''}`;
const bd=el.querySelector('.wbd');g.tabs.forEach(p=>{const sc=wsSec(p);if(sc){sc.classList.toggle('mc',!!sc.querySelector(':scope>details.g'));sc.hidden=p!=g.a;bd.appendChild(sc)}});return el}
function wsRender(){wsReady=true;const L=wsL(),nar=wsNarrow(),dl=nar?[...L.dock,...L.float]:L.dock;
document.querySelectorAll('section.pn').forEach(sc=>wsStash.appendChild(sc));wsFl.innerHTML='';
['l','r','t','b'].forEach(k=>{const box=wsBox[k],dk=wsDk[k],gs=dl.filter(g=>(nar?'r':(g.e||'r'))==k);box.innerHTML='';
gs.forEach((g,i)=>{if(i){const sp=document.createElement('div');sp.className='wsp';sp.dataset.i=i;box.appendChild(sp)}box.appendChild(wsEl(g,false))});
dk.hidden=!gs.length;if(nar){dk.style.width='';dk.style.height=''}else if(gs.length){const ac=gs.every(g=>g.col);if(k=='l'||k=='r')dk.style.width=(ac?Math.min(200,wsClampSz(k,wsSz(k))):wsClampSz(k,wsSz(k)))+'px';else dk.style.height=(ac?34:wsClampSz(k,wsSz(k)))+'px'}});
if(!nar)L.float.forEach(g=>wsFl.appendChild(wsEl(g,true)));
document.querySelectorAll('.rail [data-pn]').forEach(b=>{const p=b.dataset.pn,g=wsFind(p);b.hidden=!MODEP[view].includes(p);const fr=!!g&&g.a==p&&!g.col;b.classList.toggle('on',fr);b.classList.toggle('op',!!g&&!fr);b.title=fr?'':(g?'Open in a tab. Click to bring it to the front':'')});
nums()}
// tabs and buttons
document.addEventListener('click',e=>{const w=e.target.closest('.wg');if(!w||Date.now()-wsJust<250)return;const g=wsGroup(w.dataset.g);if(!g)return;
const b=e.target.closest('.wb');if(b){const a=b.dataset.act,r=w.getBoundingClientRect();
if(a=='col')g.col=!g.col;else if(a=='close'){wsDetach(g)}else if(a=='float'){wsDetach(g);const ek=g.e||'r',hz=ek=='t'||ek=='b',fw=Math.round(hz?Math.min(340,r.width):Math.min(320,r.width)),fh=Math.round(hz?Math.max(300,Math.min(420,innerHeight-120)):Math.min(Math.max(r.height,260),560));Object.assign(g,{x:Math.round(ek=='l'?r.right+14:ek=='r'?r.left-fw-14:r.left),y:Math.round(ek=='t'?r.bottom+14:ek=='b'?r.top-fh-14:r.top),w:fw,h:fh,col:false});wsL().float.push(g)}
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
function setView(v){const was=view;view=v;curView=v;if(was!=v)requestAnimationFrame(()=>{if(window.bkZ)bkZ()});if(v=='stamp'&&was!=v)setTimeout(()=>{try{draw()}catch(e){}},0);document.querySelectorAll('[data-v]').forEach(b=>{const on=b.dataset.v==v;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
$('boardP').classList.toggle('off',v!='pattern');$('boardS').hidden=v!='stamp';$('edhint').hidden=v!='stamp';stage.classList.toggle('pv',v=='pattern');$('zoomc').style.display=v=='pattern'?'':'none';$('gtb').style.display=v=='stamp'?'':'none';$('itb').style.display='';if(v=='pattern')requestAnimationFrame(applyZ);tbSync();if(was!=v||!wsReady)wsRender()}
function setPanel(p){if(!PNAME[p])p='canvas';const m=MODEP[view].includes(p)?view:MODEP.stamp.includes(p)?'stamp':'pattern';if(m!=view||!wsReady)setView(m);
const L=wsL();let g=wsFind(p);if(!g&&p=='rand'){g=wsG([p],{x:null,y:null,w:272,h:620,pos:'r'});L.float.push(g)}
if(!g){g=L.dock[0];if(g)g.tabs.push(p);else{g=wsG([p]);L.dock.push(g)}}g.a=p;g.col=false;panel=p;try{localStorage.setItem('wb24_panel',p)}catch(e){}
wsSave();wsRender();const el=document.querySelector(`.wg[data-g="${g.id}"]`);if(el&&el.classList.contains('fl'))el.style.zIndex=++wsZ;info();nums()}
window.wbOpenPanel=setPanel;
$('rcls').onclick=()=>{const L=wsL();if(!L.dock.length&&!L.float.length)return;L.dock=[];L.float=[];wsSave();wsRender();pmsg('Closed all panels. Open any tool from the bar on the left.')};
document.querySelector('.rail').onclick=e=>{const b=e.target.closest('[data-pn]');if(!b)return;const p=b.dataset.pn,g=wsFind(p);
// double-clicking the Randomize tool rolls a new piece, the same as pressing the Randomize button in its window (the window is left open)
if(p=='rand'&&e.isTrusted&&e.detail>1){const g2=wsFind('rand');if(!(g2&&g2.a=='rand'&&!g2.col))setPanel('rand');$('rzdo').click();return}
// clicking the button of a panel that is already showing closes it (only for real clicks, not when the app opens a panel itself)
if(e.isTrusted&&g&&g.a==p&&!g.col){const i=g.tabs.indexOf(p);g.tabs.splice(i,1);if(g.a==p)g.a=g.tabs[Math.max(0,i-1)];if(!g.tabs.length)wsDetach(g);wsSave();wsRender();return}
setPanel(p)};
document.querySelector('.seg2').onclick=e=>{const b=e.target.closest('[data-v]');if(b)setView(b.dataset.v)};
$('tabs').addEventListener('click',e=>{if(e.target.closest('[data-k]'))setView('stamp')});
$('lib').addEventListener('click',e=>{if(e.target.closest('[data-m]'))setView('stamp')});
$('addT').addEventListener('click',()=>setView('stamp'));$('dupT').addEventListener('click',()=>setView('stamp'));
// hide the motif bar outside the stamp editor
const st=document.createElement('style');st.textContent='.stage.pv #sel{display:none!important}';document.head.appendChild(st);

// ===== Randomize panel: which main features a roll may change. Anything switched off stays exactly as it is. Settings are remembered.
(()=>{const sec=document.querySelector('section.pn[data-p="rand"]'),fts=[...sec.querySelectorAll('[data-ft]')],subs=[...sec.querySelectorAll('[data-sub]')],KEY='wb38_rzft',SKEY='wb50_rzsub',by=k=>fts.find(c=>c.dataset.ft==k),sk=m=>subs.filter(c=>c.dataset.sub.startsWith(m+'.'));
try{const z=JSON.parse(localStorage.getItem(KEY)||'null');if(z)fts.forEach(c=>{if(c.dataset.ft in z)c.checked=!!z[c.dataset.ft]})}catch(e){}
try{const z=JSON.parse(localStorage.getItem(SKEY)||'null');if(z)subs.forEach(c=>{if(c.dataset.sub in z)c.checked=!!z[c.dataset.sub]})}catch(e){}
// a switch counts as on only if something under it is ticked (Stamps also counts Lettering)
const eff=c=>{const k=c.dataset.ft,ss=sk(k);if(!c.checked)return false;if(!ss.length)return true;return ss.some(x=>x.checked)||(k=='stamps'&&by('text').checked)};
const get=()=>{const o={};fts.forEach(c=>o[c.dataset.ft]=eff(c));return o};
const sub=m=>{const ss=sk(m);return ss.length?new Set(ss.filter(c=>c.checked).map(c=>c.dataset.sub.slice(m.length+1))):null};
const sync=()=>{const st=by('stamps').checked,t=by('text');t.disabled=!st;t.closest('label').style.opacity=st?'':'.45';
sec.querySelectorAll('.rzx').forEach(b=>{const m=b.dataset.rzx,ss=sk(m),n=ss.filter(c=>c.checked).length,all=n==ss.length;b.querySelector('.rzn').textContent=all?'All':n+'/'+ss.length;b.classList.toggle('part',!all);const box=sec.querySelector('[data-rzs="'+m+'"]');if(box)box.classList.toggle('off',!by(m).checked)});
const any=fts.some(c=>eff(c)&&!c.disabled),b=$('rzdo');if(b)b.disabled=!any;
const h=$('rzhint');if(h)h.textContent=any?'Only what is switched on changes. Everything else stays exactly as it is. Use the arrows to choose which kinds of change are allowed. The canvas stays the same size and shape unless Canvas shape or Canvas size is on, and the book cover is always kept.':'Nothing is switched on, so Randomize has nothing to change.'};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(fts.map(c=>[c.dataset.ft,c.checked]))));localStorage.setItem(SKEY,JSON.stringify(Object.fromEntries(subs.map(c=>[c.dataset.sub,c.checked]))))}catch(e){}sync()};
sec.addEventListener('change',save);
sec.addEventListener('click',e=>{const x=e.target.closest('[data-rzx]');if(x){const m=x.dataset.rzx,box=sec.querySelector('[data-rzs="'+m+'"]'),open=box.hidden;box.hidden=!open;x.setAttribute('aria-expanded',open?'true':'false');return}
const a=e.target.closest('[data-rzall],[data-rzno]');if(a){const m=a.dataset.rzall||a.dataset.rzno,on=!!a.dataset.rzall;sk(m).forEach(c=>c.checked=on);save()}});
$('rzall').onclick=()=>{fts.forEach(c=>c.checked=true);subs.forEach(c=>c.checked=true);save()};$('rznone').onclick=()=>{fts.forEach(c=>c.checked=false);save()};
sync();window.wbRZ={get,sub};
$('rzdo').onclick=()=>randomize(false);
})();

// ---- zoom
function fitZ(){const b=$('boardP');if(b.classList.contains('off'))return;const w=b.clientWidth-64,h=b.clientHeight-64;fitS=Math.max(.05,Math.min(w/CW,h/CH))}
function applyZ(){fitZ();const s=z||fitS;$('art').style.width=Math.round(CW*s)+'px';$('art').style.height=Math.round(CH*s)+'px';$('artsh').style.width=$('art').style.width;$('artsh').style.height=$('art').style.height;$('zl').textContent=Math.round(s*100)+'%';$('zl').title=z?'Fit to screen':'Fitted to screen';if(window.bkZ)bkZ()}
window.wbApplyZ=applyZ;window.wbZoomIn=()=>view=='pattern'&&!!z&&z>fitS*1.001;
$('zi').onclick=()=>{z=Math.min(8,(z||fitS)*1.25);applyZ()};$('zo').onclick=()=>{z=Math.max(.1,(z||fitS)/1.25);applyZ()};$('zl').onclick=()=>{z=0;applyZ()};
$('boardP').addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();z=Math.min(8,Math.max(.1,(z||fitS)*(e.deltaY<0?1.1:1/1.1)));applyZ()},{passive:false});
try{new ResizeObserver(()=>{if(view=='pattern')applyZ()}).observe($('boardP'))}catch(e){window.addEventListener('resize',applyZ)}
new MutationObserver(()=>applyZ()).observe($('art'),{attributes:true,attributeFilter:['viewBox']});

// ---- slider rows with editable number fields
function addNum(row,r){const w=document.createElement('div');w.className='num';const n=document.createElement('input');n.type='number';n.min=r.min;n.max=r.max;n.step=r.step||1;
const lb=row.querySelector('label');n.setAttribute('aria-label',lb?lb.textContent:'Value');if(r.dataset.u){n.className='u';const i=document.createElement('i');i.textContent=r.dataset.u;w.appendChild(i)}
w.prepend(n);row.appendChild(w);r._n=n;
n.addEventListener('change',()=>{if(paintBack){n.value=+(+r.value).toFixed(2);return}let v=+n.value;if(n.value===''||isNaN(v))return paint(r);v=Math.min(+r.max,Math.max(+r.min,v));r.value=v;r.dispatchEvent(new Event('input',{bubbles:true}));paint(r)});
n.addEventListener('keydown',e=>{if(e.key=='Enter')n.blur();else if(e.key=='Escape'){e.stopPropagation();paintBack=1;n.blur();paintBack=0;n.value=+(+r.value).toFixed(2)}})}
// double-click any number box to select all of it; whatever you type then replaces it (Enter or click away to apply, Esc to cancel)
let paintBack=0;document.addEventListener('dblclick',e=>{const t=e.target;if(t&&t.matches&&t.matches('input[type=number]')){t.focus();t.select()}});
function enhance(){document.querySelectorAll('.dock input[type=range]').forEach(r=>{if(r.closest('.ctl'))return;const lb=r.previousElementSibling,row=document.createElement('div');row.className='ctl';
const hasL=lb&&lb.tagName=='LABEL';r.parentNode.insertBefore(row,hasL?lb:r);if(hasL){row.appendChild(lb);if(!r.id)0;lb.htmlFor=r.id}row.appendChild(r);addNum(row,r)});
document.querySelectorAll('#sel input[type=range]').forEach(r=>{const row=r.closest('.ctl');if(row&&!row.querySelector('.num')){row.querySelector('label').htmlFor=r.id;addNum(row,r)}})}
function paint(r){const lo=+r.min,hi=+r.max,p=hi>lo?(r.value-lo)/(hi-lo)*100:0;r.style.setProperty('--p',p.toFixed(1)+'%');if(r._n&&document.activeElement!==r._n)r._n.value=+(+r.value).toFixed(2)}
function nums(){document.querySelectorAll('input[type=range]').forEach(paint)}
document.addEventListener('input',e=>{if(e.target.type=='range')paint(e.target)});

// ---- status line + dock subtitle
function info(){const ks=new Set(tiles.map(t=>shOf(t).k)),k=ks.size>1?'Mixed':SHN[[...ks][0]]||'Rectangle',c=dim.c;
$('sinfo').innerHTML=`${book.on?`<span class="it">Print cover <b>${bk().W.toFixed(2)} × ${bk().H.toFixed(2)} in</b></span>`:`<span class="it">Canvas <b>${(()=>{const k=csk(),r=(+(+c[0]).toFixed(2))+':'+(+(+c[1]).toFixed(2));return k=='rect'?r:CSN[k]+(CASP.includes(k)?' '+r:'')})()}</b></span>`}<span class="it">Block <b>${k}</b></span><span class="it">Stamps <b>${tiles.length}</b></span><span class="it">Layers <b>${layers.length}</b></span>`;
$('docks').textContent=panel=='stamp'||panel=='motifs'?`Stamp ${cur+1} of ${tiles.length}`:'';
if(layers[selL])$('lnmx').textContent=layers[selL].name}
// wrap redraw hooks so the shell stays in sync
const _draw=draw;draw=function(){_draw();nums();info()};
const _sp=syncPr;syncPr=function(){_sp();nums()};const _stx=syncTex;syncTex=function(){_stx();nums()};

// ---- toast-style status messages
let mt=0;new MutationObserver(()=>{clearTimeout(mt);$('pmsg').style.opacity=1;if($('pmsg').textContent)mt=setTimeout(()=>{$('pmsg').style.transition='opacity .6s';$('pmsg').style.opacity=0;setTimeout(()=>{$('pmsg').style.transition=''},700)},6000)}).observe($('pmsg'),{childList:true,characterData:true,subtree:true});
new MutationObserver(()=>{$('pwhere2').textContent=$('pwhere').textContent}).observe($('pwhere'),{childList:true,characterData:true,subtree:true});

// ---- menus
const menus=[['fileb','filem'],['expb','expm']];
const closeMenus=()=>menus.forEach(([b,m])=>{$(m).hidden=true;$(b).setAttribute('aria-expanded','false')});window.wbCloseMenus=closeMenus;
menus.forEach(([b,m])=>{$(b).onclick=e=>{e.stopPropagation();const o=$(m).hidden;closeMenus();closeDD();$(m).hidden=!o;if(o)placeFloat($(m),$(b),$(m).classList.contains('r'));$(b).setAttribute('aria-expanded',String(o))};$(m).addEventListener('click',e=>{if(e.target.closest('button,label'))closeMenus()})});
document.addEventListener('click',e=>{if(!e.target.closest('.menu,.pop'))closeMenus()});
// A floating popup would drift away from its button if the page or a panel scrolled under it, so close it instead.
addEventListener('scroll',e=>{const t=e.target;if(t&&t.closest&&t.closest('.pop,.ddl'))return;if(typeof typing=='function'&&typing())return;closeMenus();closeDD()},true);addEventListener('resize',()=>{if(typeof typing=='function'&&typing())return;closeMenus();closeDD()});

// ---- projects dialog
const closeDlg=()=>{$('plist').hidden=true;$('pls').classList.remove('on')};
$('pclose').onclick=closeDlg;$('plist').addEventListener('click',e=>{if(e.target===$('plist'))closeDlg()});
$('pnw2').onclick=()=>$('pnw').click();
$('pgrid').addEventListener('click',e=>{const b=e.target.closest('[data-a="open"]');if(b)setTimeout(()=>{if(b.textContent=='Open')closeDlg()},60)});

// ---- undo / redo (snapshots of the whole project state)
let hist=[coreStr()],hi=0;
const ub=()=>{$('undo').disabled=hi<=0;$('redo').disabled=hi>=hist.length-1;if(window.wbHistPaint)wbHistPaint()};
let histL=['Start'],histT=[Date.now()];
const HK={tiles:'Stamp change',layers:'Layer change',proj:'Colours',dim:'Canvas size',pg:'Grid',pr:'Roughness',tex:'Texture',texLib:'Texture library',grade:'Grade'};
function hLabel(a,b){try{const A=JSON.parse(a),B=JSON.parse(b),ch=Object.keys(HK).filter(k=>JSON.stringify(A[k])!==JSON.stringify(B[k]));if(!ch.length)return 'Change';if(ch.length>2)return 'Several changes';if(ch[0]=='tiles'){const n=t=>t.reduce((q,x)=>q+(x.items||[]).length,0),x=n(A.tiles),y=n(B.tiles);if(A.tiles.length!=B.tiles.length)return B.tiles.length>A.tiles.length?'Added stamp':'Removed stamp';if(y>x)return 'Added motif'+(y-x>1?'s':'');if(y<x)return 'Removed motif'+(x-y>1?'s':'');return 'Moved or edited motif'}return ch.map(k=>HK[k]).join(' + ')}catch(e){return 'Change'}}
function cap(){if(drag||window.wbNoCap)return;const s=coreStr();if(s!==hist[hi]){const prev=hist[hi];hist.length=hi+1;histL.length=hi+1;histT.length=hi+1;hist.push(s);histL.push(hLabel(prev,s));histT.push(Date.now());if(hist.length>120){hist.shift();histL.shift();histT.shift()}hi=hist.length-1}ub()}
setInterval(cap,450);
function applyCore(c){tiles=c.tiles;layers=c.layers;proj=c.proj;dim=c.dim;pgrid=pgFix(c.pg,c.layers);cur=Math.min(cur,tiles.length-1);tiles.forEach(shOf);migLayers();setDim();pr=c.pr;migInk();tex=c.tex;if(Array.isArray(c.texLib))texLib=txClean(c.texLib);texNorm();if(c.grade&&window.wbGrade&&JSON.stringify(c.grade)!=JSON.stringify(wbGrade.get()))wbGrade.set(c.grade);nid=1+Math.max(0,...tiles.map(t=>+t.id||0));
cur=Math.min(cur,tiles.length-1);selL=Math.min(selL,layers.length-1);selOne(-1);symKey='';try{localStorage.setItem('wb14_dim',JSON.stringify(dim))}catch(e){}
store();savePr();saveTex();syncPr();syncTex();buildTex();upd()}
function undo(){cap();if(hi>0){hi--;applyCore(JSON.parse(hist[hi]))}ub()}
function redo(){if(hi<hist.length-1){hi++;applyCore(JSON.parse(hist[hi]))}ub()}
$('undo').onclick=undo;$('redo').onclick=redo;ub();
window.wbHistGet=i=>hist[i];window.wbResetHist=()=>{if(window.wbBA)wbBA.reset();hist=[coreStr()];histL=['Start'];histT=[Date.now()];hi=0;ub();if(window.wbSnapLoad)wbSnapLoad()};window.wbCap=cap;window.wbApply=applyCore;
// ---- History panel + named snapshots
(()=>{const sec=document.querySelector('section.pn[data-p="hist"]'),hl=$('hhl'),sl=$('hsl'),XI=`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
let snaps=[],sk='',raf=0,ren=-1;
const key=()=>'wb95_sn_'+(cp&&cp.id?cp.id:'draft');
const persist=()=>{try{localStorage.setItem(sk,JSON.stringify(snaps))}catch(e){pmsg('This snapshot is kept for now, but is too large to keep after you close the page.')}};
function load(){const k=key();try{if(cp&&cp.id){const d=localStorage.getItem('wb95_sn_draft');if(d&&!localStorage.getItem(k)&&sk=='wb95_sn_draft'){localStorage.setItem(k,d);localStorage.removeItem('wb95_sn_draft')}}}catch(e){}
if(k!=sk||!snaps){sk=k;try{snaps=JSON.parse(localStorage.getItem(k)||'[]')}catch(e){snaps=[]}if(!Array.isArray(snaps))snaps=[]}paint()}
const ago=t=>{const d=(Date.now()-t)/1000;return d<45?'now':d<3600?Math.round(d/60)+' min':d<86400?Math.round(d/3600)+' h':Math.round(d/86400)+' d'};
const esc2=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function paint(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(sec.hidden)return;const k=key();if(k!=sk){load();return}
if(!(ren>=0&&sl.querySelector('input')))sl.innerHTML=snaps.map((n,i)=>i==ren?`<div class="hr sn" data-sn="${i}"><input type="text" value="${esc2(n.n)}" maxlength="40" aria-label="Snapshot name"><span></span><span></span></div>`:`<div class="hr sn" data-sn="${i}"><b>${esc2(n.n)}</b><i>${ago(n.t)}</i><button type="button" class="rfb" data-sref="${i}">Compare</button><button type="button" data-del="${i}" aria-label="Delete snapshot">${XI}</button></div>`).join('');
let h='';for(let i=hist.length-1;i>=0;i--)h+=`<div class="hr${i==hi?' on':''}${i>hi?' fut':''}" data-h="${i}"><b>${esc2(histL[i]||'Change')}</b><i>${ago(histT[i]||Date.now())}</i>${i==hi?'<span></span>':`<button type="button" class="rfb" data-href="${i}">Compare</button>`}</div>`;
hl.innerHTML=h;if(window.wbBAPaint)wbBAPaint();$('hsc').textContent=hist.length+' steps';const inp=sl.querySelector('input');if(inp&&document.activeElement!==inp){inp.focus();inp.select()}})}
window.wbHistPaint=paint;window.wbSnapLoad=()=>{sk='';load()};
function jump(i){cap();if(i<0||i>=hist.length||i==hi)return;hi=i;applyCore(JSON.parse(hist[hi]));ub()}
hl.addEventListener('click',e=>{const b=e.target.closest('[data-href]');if(b){const i=+b.dataset.href;wbBA.setRef((histL[i]||'Change')+' · '+ago(histT[i]||Date.now()),hist[i],1);return}const r=e.target.closest('[data-h]');if(r)jump(+r.dataset.h)});
$('hsadd').onclick=()=>{cap();snaps.unshift({n:'Snapshot '+(snaps.length+1),t:Date.now(),s:coreStr()});if(snaps.length>30)snaps.length=30;persist();ren=0;paint()};
sl.addEventListener('click',e=>{const q=e.target.closest('[data-sref]');if(q){const n=snaps[+q.dataset.sref];if(n)wbBA.setRef(n.n,n.s,1);return}const d=e.target.closest('[data-del]');if(d){snaps.splice(+d.dataset.del,1);persist();ren=-1;paint();return}
if(e.target.closest('input'))return;const r=e.target.closest('[data-sn]');if(!r)return;const n=snaps[+r.dataset.sn];if(!n)return;cap();applyCore(JSON.parse(n.s));cap();pmsg('Restored “'+n.n+'”. Ctrl+Z goes back.')});
sl.addEventListener('dblclick',e=>{const r=e.target.closest('[data-sn]');if(r&&!e.target.closest('input,button')){ren=+r.dataset.sn;paint()}});
function fin(ok){const inp=sl.querySelector('input');if(inp&&ren>=0&&snaps[ren]){const v=inp.value.trim();if(ok&&v)snaps[ren].n=v.slice(0,40);persist()}ren=-1;paint()}
sl.addEventListener('keydown',e=>{if(!e.target.matches('input'))return;if(e.key=='Enter'){e.preventDefault();fin(1)}else if(e.key=='Escape'){e.stopPropagation();fin(0)}});
sl.addEventListener('focusout',e=>{if(e.target.matches&&e.target.matches('input')&&ren>=0)setTimeout(()=>{if(ren>=0)fin(1)},0)});
new MutationObserver(()=>{if(!sec.hidden)paint()}).observe(sec,{attributes:true,attributeFilter:['hidden']});
window.wbBAPaint=()=>{const m=wbBA.mode;$('bab').setAttribute('aria-pressed',String(m==1));$('bas').setAttribute('aria-pressed',String(m==2));const lb=wbBA.label;$('barst').hidden=!wbBA.custom;if(!sec.hidden&&$('bal').dataset.l!==lb){$('bal').dataset.l=lb;$('bal').innerHTML=`<div class="hr"><b><u class="ab a">A</u>${esc2(lb)}</b><i>Compared to</i><span></span></div><div class="hr"><b><u class="ab b">B</u>Current</b><i>Now</i><span></span></div>`}
 if(sec.hidden)return;const c=wbBA.core;hl.querySelectorAll('[data-h]').forEach(r=>{const i=+r.dataset.h;r.classList.toggle('ra',c!=null&&hist[i]===c);r.classList.toggle('rb',i==hi)});sl.querySelectorAll('[data-sn]').forEach(r=>{const n=snaps[+r.dataset.sn];r.classList.toggle('ra',!!n&&n.s===c)})};
$('barst').onclick=()=>wbBA.clearRef();
$('bab').onclick=()=>{$('bab').blur();wbBA.toggle()};$('bas').onclick=()=>{$('bas').blur();wbBA.split()};
sk=key();try{snaps=JSON.parse(localStorage.getItem(sk)||'[]')}catch(e){snaps=[]}
setInterval(()=>{if(!sec.hidden)paint()},30000)})();


// ---- keyboard shortcuts
document.addEventListener('keydown',e=>{const t=e.target,typing=t.matches&&t.matches('input,select,textarea'),m=e.metaKey||e.ctrlKey,k=e.key.toLowerCase(),q=tiles[cur]&&tiles[cur].items[sel];
if(m&&k=='z'){if(typing&&(t.type=='text'||t.type=='number'))return;e.preventDefault();e.shiftKey?redo():undo()}
else if(m&&k=='y'){e.preventDefault();redo()}
else if(m&&k=='s'){e.preventDefault();$('psv').click()}
else if(m&&k=='a'&&!typing&&view=='stamp'&&tiles[cur].items.length){e.preventDefault();selSet(tiles[cur].items.map((_,i)=>i));upd()}
else if(m&&k=='d'&&!typing&&q){e.preventDefault();$('scp').click()}
else if(!typing&&(e.key=='Delete'||e.key=='Backspace')&&q&&view=='stamp'){e.preventDefault();$('sdl').click()}
else if(!typing&&split&&e.key=='Enter'){e.preventDefault();doSplit()}
else if(!typing&&split&&e.key=='Escape'){split=null;draw()}
else if(!typing&&!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()=='s'&&view=='stamp'&&Q()){e.preventDefault();$('ssp').click()}
else if(!typing&&brush&&(e.key=='['||e.key==']')){e.preventDefault();brush.r=((brush.r+(e.key==']'?15:-15)+540)%360)-180;paintGhost()}
else if(e.key=='Escape'&&brush&&!typing){brush=null;upd()}
else if(e.key=='Escape'){closeMenus();if(!$('plist').hidden)closeDlg();else if(sel>=0){selOne(-1);upd()}}
else if(!typing&&!m&&q&&view=='stamp'&&e.key.startsWith('Arrow')){e.preventDefault();const d=e.shiftKey?10:1,dx=e.key=='ArrowLeft'?-d:e.key=='ArrowRight'?d:0,dy=e.key=='ArrowUp'?-d:e.key=='ArrowDown'?d:0;QS().forEach(o=>{o.x+=dx;o.y+=dy;[o.x,o.y]=wrapP(o.x,o.y)});store();upd()}
else if(!typing&&!m&&k=='k'&&q&&view=='stamp'){e.preventDefault();$('sko').click()}
else if(!typing&&!m&&(k=='v'||k=='p')){setView(k=='v'?'stamp':'pattern')}
else if(!typing&&!m&&k=='0'&&view=='pattern'){z=0;applyZ()}});

document.querySelectorAll('label[role=button]').forEach(l=>l.addEventListener('keydown',e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();l.click()}}));
// ---- double-click (or double-tap) a slider or its label to reset it to its default (double-click the number box instead to type a value)
function resetRange(r){let d=r.dataset.def!=null?r.dataset.def:r.getAttribute('value');if(r.id=='sn'){const sy=symOf(tiles[cur]);d=sy.d[4]}if(d==null||d==='')return false;
r.value=d;r.dispatchEvent(new Event('input',{bubbles:true}));paint(r);const row=r.closest('.ctl');if(row){row.classList.remove('rst');void row.offsetWidth;row.classList.add('rst')}return true}
const rowRange=t=>{if(t.closest&&t.closest('.num'))return null; /* the number box has its own double-click: select all */ const row=t.closest&&t.closest('.ctl');return row&&row.querySelector('input[type=range]')};
document.addEventListener('dblclick',e=>{const r=rowRange(e.target);if(r&&resetRange(r)){e.preventDefault();if(document.activeElement&&document.activeElement.type=='number')document.activeElement.blur();const sel=getSelection&&getSelection();if(sel)sel.removeAllRanges()}});
let lastTap={r:null,t:0};document.addEventListener('pointerup',e=>{if(e.pointerType!='touch')return;const r=rowRange(e.target);if(!r)return;const now=Date.now();if(lastTap.r===r&&now-lastTap.t<320){resetRange(r);lastTap={r:null,t:0}}else lastTap={r,t:now}});
const rs=document.createElement('style');rs.textContent='.ctl.rst{animation:rstf .5s ease-out}@keyframes rstf{0%{background:var(--acc-soft)}100%{background:transparent}}.ctl{border-radius:5px}.ctl label{cursor:default}';document.head.appendChild(rs);
const tipRows=()=>document.querySelectorAll('.ctl').forEach(row=>{const r=row.querySelector('input[type=range]');if(r&&!row.title)row.title='Double-click to reset'});
function syncGrid(){$('gtg').classList.toggle('on',grid.on);$('gtg').setAttribute('aria-pressed',String(grid.on));$('gon').checked=grid.on;$('gn').value=grid.n;$('gsp').value=grid.sp;$('gsd').checked=grid.sd;document.querySelectorAll('#gsh [data-sh]').forEach(b=>b.classList.toggle('on',b.dataset.sh==(grid.sh||'rect')));const[n,m0]=gDim(),m=grid.sh&&grid.sh!='rect'?gModel(grid.sh,SW,SH,n,true).m:m0;$('gdim').textContent=`${n} × ${m}`;paint($('gn'))}
$('gsh').onclick=e=>{const b=e.target.closest('[data-sh]');if(!b)return;grid.sh=gShOk(b.dataset.sh);grid.on=true;saveGrid();upd()};
$('gon').addEventListener('input',()=>{grid.on=$('gon').checked;saveGrid();upd()});
$('gn').addEventListener('input',()=>{grid.n=+$('gn').value;if(!grid.on){grid.on=true}saveGrid();upd()});
$('gsp').addEventListener('input',()=>{grid.sp=$('gsp').value;saveGrid();upd()});
$('gsd').addEventListener('input',()=>{grid.sd=$('gsd').checked;if(grid.sd)grid.on=true;saveGrid();upd()});
$('gq').onclick=()=>{const t=tiles[cur];if(!t.items.length)return;let moved=0;t.items.forEach(q=>{const[x,y]=snapPt(q.x,q.y);if(Math.abs(x-q.x)>.01||Math.abs(y-q.y)>.01)moved++;q.x=x;q.y=y});grid.on=true;saveGrid();store();upd();$('pmsg').textContent=moved?`Snapped ${moved} motif${moved>1?'s':''} to the grid.`:'Every motif is already on the grid.'};
$('gtg').onclick=()=>{grid.on=!grid.on;saveGrid();upd()};$('gtq').onclick=()=>$('gq').click();
$('gti').onclick=()=>{edInk=!edInk;tbSync();upd()};
$('gtx').onclick=()=>{edTx=!edTx;tbSync();upd()};
{const w=$('itbw'),b=$('itbb'),set=o=>{w.classList.toggle('open',o);b.setAttribute('aria-expanded',String(o))};b.onclick=e=>{e.stopPropagation();set(!w.classList.contains('open'))};document.addEventListener('click',e=>{if(!e.target.closest('#itbw'))set(false)});document.addEventListener('keydown',e=>{if(e.key=='Escape')set(false)})}
$('gtm').onclick=()=>{edMk=!edMk;$('gtm').classList.toggle('on',edMk);$('gtm').setAttribute('aria-pressed',String(edMk));upd()};
document.addEventListener('keydown',e=>{if(e.target.matches&&e.target.matches('input,select,textarea'))return;if(!e.metaKey&&!e.ctrlKey&&e.key.toLowerCase()=='g'){grid.on=!grid.on;saveGrid();upd()}});
const _draw2=draw;draw=function(){_draw2();syncGrid()};
// ---- randomize motifs on the current stamp
try{const z=JSON.parse(localStorage.getItem('wb36_rz')||'null');if(z){$('rzp').value=z.p;$('rzr').value=z.r;$('rzs').value=z.s}}catch(e){}
['rzp','rzr','rzs'].forEach(id=>$(id).addEventListener('input',()=>{try{localStorage.setItem('wb36_rz',JSON.stringify({p:+$('rzp').value,r:+$('rzr').value,s:+$('rzs').value}))}catch(e){}}));
$('rzgo').onclick=()=>{const qs=QS();if(!qs.length){$('pmsg').textContent='Select some motifs first.';return}if(window.wbCap)wbCap();
const P=+$('rzp').value/100*Math.min(SW,SH)*.25,R=+$('rzr').value,S=+$('rzs').value/100,rnd=()=>Math.random()*2-1;
qs.forEach(q=>{if(P){const a=Math.random()*Math.PI*2,d=Math.sqrt(Math.random())*P;[q.x,q.y]=wrapP(q.x+Math.cos(a)*d,q.y+Math.sin(a)*d)}
if(R)q.r=Math.round(nr(q.r+rnd()*R))||0;if(S)q.s=+Math.min(2.6,Math.max(.2,q.s*(1+rnd()*S))).toFixed(3)});
store();upd();if(window.wbCap)wbCap();$('pmsg').textContent=`Randomized ${qs.length} motif${qs.length>1?'s':''}. Press again for another shuffle, or Ctrl+Z to undo.`};
// ===== v90 controls: styled dropdowns, colour picker, slider scrub =====
(()=>{
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),SEL_SKIP=s=>s.style.display==='none'||s.classList.contains('ddsel')||s.dataset.native!=null;
const desc=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
const all=[];
function optList(s){const out=[];[...s.children].forEach(c=>{if(c.tagName=='OPTGROUP'){out.push({g:c.label});[...c.children].forEach(o=>out.push({v:o.value,t:o.textContent,d:o.disabled||c.disabled}))}else if(c.tagName=='OPTION')out.push({v:c.value,t:c.textContent,d:c.disabled})});return out}
function mk(sel){if(sel._dd||SEL_SKIP(sel))return;
const w=document.createElement('div');w.className='dd dd2';w.innerHTML='<button type="button" class="ddb"><span class="ddt"></span><em>▾</em></button><div class="ddl" hidden role="listbox"></div>';
sel.after(w);sel.classList.add('ddsel');const b=w.firstChild,l=w.lastChild,t=b.firstChild;
if(sel.getAttribute('aria-label'))b.setAttribute('aria-label',sel.getAttribute('aria-label'));
let key='',hi=-1;
const st={sel,w,b,l,sync(force){const k=sel.selectedIndex+'|'+sel.options.length+'|'+(sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].textContent:'')+'|'+sel.disabled+'|'+(sel.hidden?1:0);if(!force&&k===key)return;key=k;
 const o=sel.options[sel.selectedIndex];t.textContent=o?o.textContent:'';b.disabled=sel.disabled;w.hidden=sel.hidden;if(!l.hidden)fill()},
 fill};
function fill(){const items=optList(sel),cv=sel.value;l.innerHTML=items.map((o,i)=>o.g!=null?`<div class="ddg">${esc(o.g)}</div>`:`<div class="ddi${o.v===cv?' cur':''}${o.d?' dis':''}" role="option" data-i="${i}" data-v="${esc(o.v).replace(/"/g,'&quot;')}">${esc(o.t)}</div>`).join('')}
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
window.wbDDsync=()=>{for(let i=all.length;i--;){const s=all[i];if(!s.sel.isConnected){all.splice(i,1);s.w.remove();continue}s.sync()}};
// selects that appear later (rebuilt lists)
{let q=0;const run=()=>{q=0;scan()};new MutationObserver(m=>{for(const r of m)for(const n of r.addedNodes){if(n.nodeType==1&&!(n instanceof SVGElement)&&(n.tagName=='SELECT'||n.querySelector&&n.querySelector('select'))){if(!q)q=requestAnimationFrame(run);return}}}).observe(document.body,{childList:true,subtree:true})}
scan();
// ---- colour picker
const NC=document.createElement('div');NC.className='cpop';NC.hidden=true;
NC.innerHTML='<div class="cpsv"><i></i></div><div class="cph"><i></i></div><div class="cprow"><span class="cpsw"></span><input type="text" class="cpx" maxlength="7" spellcheck="false" aria-label="Hex colour"><button type="button" class="ib cpe" aria-label="Pick from screen" hidden><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19l.7-3.3L14 7.4 16.6 10 8.3 18.3z"/><path d="M13 6.4l1.2-1.2a1.8 1.8 0 012.6 0l2 2a1.8 1.8 0 010 2.6L17.6 11"/></svg></button></div>';
document.body.appendChild(NC);
const sv=NC.querySelector('.cpsv'),svi=sv.firstChild,hb=NC.querySelector('.cph'),hbi=hb.firstChild,hx=NC.querySelector('.cpx'),sw=NC.querySelector('.cpsw'),eb=NC.querySelector('.cpe');
let H=0,S=1,V=1,cur=null,dragging=false,dirty=false;
const hex2=n=>Math.round(n).toString(16).padStart(2,'0');
function rgb(h,s,v){const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return[f(5)*255,f(3)*255,f(1)*255]}
const toHex=(h,s,v)=>'#'+rgb(h,s,v).map(hex2).join('');
function fromHex(x){const m=/^#?([0-9a-f]{6})$/i.exec(x);if(!m)return null;const n=parseInt(m[1],16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=n&255;const bb=b/255,mx=Math.max(r,g,bb),mn=Math.min(r,g,bb),d=mx-mn;let h=0;if(d){if(mx==r)h=((g-bb)/d+6)%6;else if(mx==g)h=(bb-r)/d+2;else h=(r-g)/d+4;h*=60}return[h,mx?d/mx:0,mx]}
function paintPop(){const c=toHex(H,S,V);sv.style.background=`linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${H},100%,50%))`;svi.style.left=S*100+'%';svi.style.top=(1-V)*100+'%';hbi.style.left=H/360*100+'%';sw.style.background=c;if(document.activeElement!==hx)hx.value=c;return c}
function emit(fin){if(!cur)return;const c=paintPop();if(cur.value!==c){cur.value=c;cur.dispatchEvent(new Event('input',{bubbles:true}));dirty=true}if(fin&&dirty){dirty=false;cur.dispatchEvent(new Event('change',{bubbles:true}))}}
function drag(el,fn){el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);dragging=true;fn(e);const mv=ev=>fn(ev),up=()=>{el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);dragging=false;emit(true)};el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)})}
drag(sv,e=>{const r=sv.getBoundingClientRect();S=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));V=1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));emit()});
drag(hb,e=>{const r=hb.getBoundingClientRect();H=Math.max(0,Math.min(359.9,(e.clientX-r.left)/r.width*360));emit()});
hx.addEventListener('input',()=>{const v=fromHex(hx.value);if(v){[H,S,V]=v;emit(true)}});
hx.addEventListener('keydown',e=>{if(e.key=='Enter')hx.blur()});
if(window.EyeDropper){eb.hidden=false;eb.onclick=async()=>{try{const r=await new EyeDropper().open(),v=fromHex(r.sRGBHex);if(v){[H,S,V]=v;emit(true)}}catch(e){}}}
function closeC(){NC.hidden=true;if(cur&&dirty){dirty=false;cur.dispatchEvent(new Event('change',{bubbles:true}))}cur=null}
document.addEventListener('pointerdown',e=>{if(!NC.hidden&&!NC.contains(e.target)&&!e.target.closest('.ccb'))closeC()},true);
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&!NC.hidden)closeC()});
const cdesc=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
function mkc(inp){if(inp._cc)return;const b=document.createElement('button');b.type='button';b.className='ccb';b.setAttribute('aria-label',inp.title||'Colour');inp.after(b);inp.classList.add('ccsel');
const sync=()=>{b.style.setProperty('--c',cdesc.get.call(inp))};
Object.defineProperty(inp,'value',{configurable:true,get(){return cdesc.get.call(inp)},set(v){cdesc.set.call(inp,v);sync()}});
b.onclick=e=>{e.stopPropagation();if(!NC.hidden&&cur===inp){closeC();return}closeC();closeDD();if(typeof closeMenus=='function')closeMenus();cur=inp;const v=fromHex(inp.value)||[0,1,1];[H,S,V]=v;paintPop();NC.hidden=false;placeFloat(NC,b,false);NC.style.width='';hx.value=inp.value};
inp._cc=1;sync()}
document.querySelectorAll('input[type=color]').forEach(mkc);
// ---- sliders: drag the label to scrub; hold Shift for fine control (also on the slider itself)
const rangeOf=l=>{const row=l.closest&&l.closest('.ctl');return row&&row.querySelector('input[type=range]')};
function setR(r,v){const lo=+r.min,hi=+r.max,stp=+r.step||1;v=Math.max(lo,Math.min(hi,Math.round(v/stp)*stp));v=+v.toFixed(6);if(+r.value===v)return;r.value=v;r.dispatchEvent(new Event('input',{bubbles:true}))}
function scrub(el,r,e,fine0){if(r.disabled)return;let x0=e.clientX,v0=+r.value,sh=e.shiftKey,moved=false;const span=+r.max-+r.min,W=(r.getBoundingClientRect().width||200)*(fine0?1:1.4);
const dr=window.NODRAFT&&NODRAFT.has(r.id);
const mv=ev=>{if(!moved&&Math.abs(ev.clientX-x0)<3)return;if(!moved){moved=true;document.body.classList.add('scrubbing');if(!dr&&typeof DRAFT!='undefined'){DRAFT=1;clearTimeout(DRT)}}
 if(ev.shiftKey!==sh){sh=ev.shiftKey;x0=ev.clientX;v0=+r.value}
 const k=sh?.1:1;setR(r,v0+(ev.clientX-x0)/W*span*k)};
const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);document.body.classList.remove('scrubbing');if(moved){r.dispatchEvent(new Event('change',{bubbles:true}));if(typeof drOff=='function')drOff()}};
addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up)}
document.addEventListener('pointerdown',e=>{if(e.button||e.pointerType=='touch')return;const t=e.target;
 if(t.matches&&t.matches('input[type=range]')){if(e.shiftKey){e.preventDefault();scrub(t,t,e,true)}return}
 if(t.tagName=='LABEL'&&t.closest('.ctl')){const r=rangeOf(t);if(r){e.preventDefault();scrub(t,r,e,false)}}},true);
// keep labels in step with programmatic changes
if(typeof nums=='function'){const _n=nums;nums=function(){_n();wbDDsync()}}
})();

enhance();{const r=$('ts'),row=r.closest('.ctl'),f=document.createElement('div');f.className='ctl fitrow';
const ic=(d)=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
f.innerHTML=`<label>Fit to frame</label><div class="seg" id="tsfit">`+
`<button type="button" data-f="" title="Off: stamps run off the frame edges">${ic('<circle cx="12" cy="12" r="7.5"/><path d="M6.7 17.3l10.6-10.6"/>')}Off</button>`+
`<button type="button" data-f="h" title="Fit width: a whole number of stamps spans the width exactly; stamps may run off the top and bottom">${ic('<path d="M3.5 12h17M7 8.5L3.5 12 7 15.5M17 8.5l3.5 3.5-3.5 3.5"/><path d="M3.5 5v2.5M20.5 5v2.5M3.5 16.5V19M20.5 16.5V19"/>')}Width</button>`+
`<button type="button" data-f="v" title="Fit height: a whole number of stamps spans the height exactly; stamps may run off the sides">${ic('<path d="M12 3.5v17M8.5 7L12 3.5 15.5 7M8.5 17l3.5 3.5 3.5-3.5"/><path d="M5 3.5h2.5M16.5 3.5H19M5 20.5h2.5M16.5 20.5H19"/>')}Height</button></div>`;
row.after(f);
f.onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;const L=LY();L.fit=b.dataset.f;if(L.fit)L.size=+fitTs(L).toFixed(3);store();upd();sync();nums()};
r.oninput=()=>{const L=LY();L.size=L.fit?+fitTs(L,+r.value).toFixed(3):+r.value;if(L.fit){r.value=L.size;paint(r)}store();upd()}}
tipRows();WS.stamp={dock:[],float:[]};WS.pattern={dock:[],float:[]};setView('pattern');info();nums();requestAnimationFrame(()=>{applyZ();nums()});

{const sp=document.getElementById('splash'),t0=performance.now();if(sp){const go=()=>{const w=Math.max(0,520-(performance.now()-t0));setTimeout(()=>{sp.classList.add('out');setTimeout(()=>sp.remove(),320)},w)};const f=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1400))]):Promise.resolve();requestAnimationFrame(()=>requestAnimationFrame(()=>f.then(go)))}}
{const b=$('gdt');let on=true;try{on=localStorage.getItem('wb93_dots')!=='0'}catch(e){}const ap=()=>{document.body.classList.toggle('plain',!on);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))};ap();b.onclick=()=>{on=!on;try{localStorage.setItem('wb93_dots',on?'1':'0')}catch(e){}ap()}}
clearAll(true);cp={id:null,name:'',saved:coreStr()};saveCp();$('pnm').value='';paintPst();$('pmsg').textContent='';
// warn before leaving if there's unsaved work (a fresh blank stamp doesn't count)
{const blank=coreStr();addEventListener('beforeunload',e=>{if(cp.id?dirty():coreStr()!==blank){e.preventDefault();e.returnValue=''}})}
})();
