import {kv} from '../platform/index.js';
import {cmdRegister} from '../commands/registry.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {store} from './06-motif-library-folders.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {unFmt,unGet,unParse,unTo} from './98-units.js';
// ===== Rulers and guides (2.87.2, step 2 of docs/pro-basics-plan.md; owner Nov 3 2026: rulers on the Canvas tab only, none in a stamp's tab).
// The rulers run along the top and left of the board in the chosen units (Settings > General > Units), measuring the canvas from its top-left corner,
// and follow zoom and pan: everything is worked out from where #art sits on screen and its viewBox, so any way the view moves is covered.
// Guides are lines across the whole board. Drag one out of a ruler, drag it to move it, drag it back onto a ruler to remove it. They are kept in the
// project (proj.gd = {x: [...], y: [...]}, canvas units; format 30, optional) and every change is one History step. Elements snap to them with the
// smart guides (84-smart-guides.js asks WBX.wbGuideLines). A stamp's tab (body.stedit) shows neither rulers nor guides.
// View > Rulers (Mod+R), Guides (Mod+'), Lock guides, Clear guides, New guide… The three switches are view settings (kv), not part of the project.
const RU_K={on:'wb2872_rul',sh:'wb2872_gsh',lk:'wb2872_glk'},RU_W=18;
const ruFlag=(k,d)=>{try{const v=kv.get(RU_K[k]);return v==null?d:v==='1'}catch(e){return d}};
const ruSetF=(k,v)=>{try{kv.set(RU_K[k],v?'1':'0')}catch(e){}};
const ruSt={on:false,sh:true,lk:false,raf:0,key:'',drag:null};
const ruStamp=()=>document.body.classList.contains('stedit');
const ruNum=a=>Array.isArray(a)?a.map(Number).filter(Number.isFinite):[];
function ruGd(){const g=WBS.proj&&WBS.proj.gd;return{x:ruNum(g&&g.x),y:ruNum(g&&g.y)}}
// keep the guides (rounded to a thousandth of a canvas unit), store and make one History step named for what happened
function ruPut(g,label){const r=a=>a.map(v=>Math.round(v*1000)/1000);if(!WBS.proj)return;
 if(g.x.length||g.y.length)WBS.proj.gd={x:r(g.x),y:r(g.y)};else delete WBS.proj.gd;
 store();WBX.wbLabelNext={t:label,at:performance.now()};if(WBX.wbCap)WBX.wbCap();ruSched()}
// where the canvas is on screen: canvas x -> client x is a + x * k (and the same down)
function ruMap(){const a=$('art'),r=a&&a.getBoundingClientRect(),vb=a&&a.viewBox&&a.viewBox.baseVal;if(!r||!vb||!(vb.width>0)||!(r.width>0))return null;
 const kx=r.width/vb.width,ky=r.height/vb.height;return{kx,ky,ax:r.left-vb.x*kx,ay:r.top-vb.y*ky}}
// one ruler: the tick spacing is the first of 1, 2, 5 x 10^n display units that leaves 56 screen pixels between labels
function ruTicks(cv,horiz,M,b,u){const dpr=window.devicePixelRatio||1,len=horiz?b.width-RU_W:b.height-RU_W;if(len<=0)return;
 const cw=horiz?len:RU_W,ch=horiz?RU_W:len,W=Math.round(cw*dpr),H=Math.round(ch*dpr);if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;cv.style.width=cw+'px';cv.style.height=ch+'px';
 const c=cv.getContext('2d'),cs=getComputedStyle(cv),ink=cs.color,line=cs.borderTopColor||ink;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,cw,ch);
 const per=unTo(1,u),k=horiz?M.kx:M.ky,ppu=k/per;if(!(ppu>0))return;
 let step=1;{const want=56/ppu,p=Math.pow(10,Math.floor(Math.log10(want)));step=[1,2,5,10].map(m=>m*p).find(s=>s>=want)||10*p}
 const sub=step*ppu/10>=5?10:step*ppu/5>=5?5:step*ppu/2>=5?2:1,o=(horiz?M.ax-b.left:M.ay-b.top)-RU_W;   // screen position of canvas 0 along the ruler
 const v0=Math.floor(-o/ppu/step)*step,v1=(len-o)/ppu;c.strokeStyle=line;c.fillStyle=ink;c.lineWidth=1;c.font=cs.font;c.textBaseline='top';c.beginPath();
 for(let v=v0;v<=v1+step;v+=step)for(let i=0;i<sub;i++){const w=v+i*step/sub,s=Math.round(o+w*ppu)+.5;if(s<0||s>len)continue;const h=i==0?RU_W:i*2==sub?RU_W*.45:RU_W*.25;
  if(horiz){c.moveTo(s,RU_W-h);c.lineTo(s,RU_W)}else{c.moveTo(RU_W-h,s);c.lineTo(RU_W,s)}}
 c.stroke();for(let v=v0;v<=v1+step;v+=step){const s=Math.round(o+v*ppu);if(s<-40||s>len)continue;const t=String(+v.toFixed(6));
  if(horiz)c.fillText(t,s+3,2);else{c.save();c.translate(2,s+3);c.rotate(Math.PI/2);c.translate(0,-RU_W+4);c.fillText(t,0,0);c.restore()}}}
// everything over the board: the box and the rulers sit on the board's top-left, the guides span it
function ruDraw(){ruSt.raf=0;const R=$('rul'),bd=$('boardP');if(!R||!bd)return;const stp=ruStamp(),off=bd.classList.contains('off');
 const g=ruGd(),show=!stp&&!off&&(ruSt.on||(ruSt.sh&&(g.x.length||g.y.length)));R.hidden=!show;if(!show){ruSt.key='';$('rug').textContent='';return}
 const b=bd.getBoundingClientRect(),st=R.offsetParent?R.offsetParent.getBoundingClientRect():{left:0,top:0},M=ruMap();if(!M)return;
 const bw=bd.clientWidth,bh=bd.clientHeight,u=unGet(),key=[b.left,b.top,bw,bh,M.kx,M.ky,M.ax,M.ay,u,unTo(1,u),ruSt.on,ruSt.sh,ruSt.lk,JSON.stringify(g),ruSt.drag?ruSt.drag.ax+ruSt.drag.i+':'+ruSt.drag.v:'',document.documentElement.className,document.documentElement.dataset.theme||'',document.body.className].join('|');
 if(key===ruSt.key)return;ruSt.key=key;
 Object.assign(R.style,{left:(b.left-st.left)+'px',top:(b.top-st.top)+'px',width:bw+'px',height:bh+'px'});
 R.classList.toggle('rulon',ruSt.on);R.classList.toggle('rulk',ruSt.lk);
 if(ruSt.on){const bb={left:b.left,top:b.top,width:bw,height:bh};ruTicks($('rux'),true,M,bb,u);ruTicks($('ruy'),false,M,bb,u)}
 // the guides: one element each, reused; the one being dragged shows where it is going
 const G=$('rug'),list=[];if(ruSt.sh){g.x.forEach((v,i)=>list.push(['x',i,v]));g.y.forEach((v,i)=>list.push(['y',i,v]))}
 const D=ruSt.drag;if(D){const j=list.findIndex(z=>z[0]==D.ax&&z[1]===D.i);if(D.v==null){if(j>=0)list.splice(j,1)}else if(j>=0)list[j]=[D.ax,D.i,D.v];else list.push([D.ax,-1,D.v])}
 while(G.children.length>list.length)G.lastChild.remove();while(G.children.length<list.length){const e=document.createElement('div');e.className='rgd';G.appendChild(e)}
 list.forEach(([ax,i,v],n)=>{const e=G.children[n],p=ax=='x'?M.ax+v*M.kx-b.left:M.ay+v*M.ky-b.top;e.classList.toggle('rgv',ax=='x');e.classList.toggle('rgh',ax=='y');
  e.dataset.ax=ax;e.dataset.i=i;e.style.transform=ax=='x'?`translateX(${Math.round(p)}px)`:`translateY(${Math.round(p)}px)`})}
const ruSched=()=>{if(!ruSt.raf)ruSt.raf=requestAnimationFrame(ruDraw)};
// a drag: from a ruler (a new guide; ax 'y' from the top ruler, a line across) or of a guide. Letting go over the ruler it belongs to removes it
function ruStart(e,ax,i){if(e.button!==0||ruSt.drag)return;const M=ruMap();if(!M)return;e.preventDefault();e.stopPropagation();
 const D=ruSt.drag={ax,i,v:i>=0?ruGd()[ax][i]:null,id:e.pointerId};
 const at=ev=>{const M2=ruMap();if(!M2)return null;return ax=='x'?(ev.clientX-M2.ax)/M2.kx:(ev.clientY-M2.ay)/M2.ky};
 const onR=ev=>{const b=$('boardP').getBoundingClientRect();return ax=='x'?ev.clientX<b.left+RU_W:ev.clientY<b.top+RU_W};
 const mv=ev=>{if(ev.pointerId!==D.id)return;D.v=onR(ev)?null:at(ev);if(D.v!=null&&ev.shiftKey){const s=ruSnapStep();D.v=Math.round(D.v/s)*s}ruSched()};
 const end=ev=>{if(ev.pointerId!==D.id)return;removeEventListener('pointermove',mv,true);removeEventListener('pointerup',end,true);removeEventListener('pointercancel',end,true);
  ruSt.drag=null;const g=ruGd(),arr=g[ax];if(ev.type=='pointercancel'){ruSched();return}
  if(D.v==null){if(i>=0){arr.splice(i,1);ruPut(g,'Removed guide')}else ruSched();return}
  if(i>=0){if(Math.abs(arr[i]-D.v)<1e-6){ruSched();return}arr[i]=D.v;ruPut(g,'Moved guide')}else{arr.push(D.v);ruPut(g,'Added guide')}};
 addEventListener('pointermove',mv,true);addEventListener('pointerup',end,true);addEventListener('pointercancel',end,true);if(i<0)mv(e);ruSched()}   // window listeners: the guide's element is reused as the list redraws
// Shift while dragging a guide: whole display units at a sensible step for the zoom (the ruler's small ticks)
function ruSnapStep(){const M=ruMap(),per=unTo(1,unGet()),ppu=M?M.kx/per:1,want=8/ppu,p=Math.pow(10,Math.floor(Math.log10(want||1)));return([1,2,5,10].map(m=>m*p).find(s=>s>=want)||10*p)*per}
// for the smart guides: the lines elements snap to (none in a stamp's tab, when hidden, or with no guides)
WBX.wbGuideLines=()=>{if(ruStamp()||!ruSt.sh)return null;const g=ruGd();return g.x.length||g.y.length?g:null};
// the switches
function ruToggle(k,v,msg){ruSt[k]=v;ruSetF(k,v);ruSt.key='';ruSched();if(msg)pmsg(msg)}
const ruRulers=()=>ruToggle('on',!ruSt.on,ruSt.on?'Rulers off.':'Rulers on.');
const ruGuides=()=>ruToggle('sh',!ruSt.sh,ruSt.sh?'Guides hidden.':'Guides shown.');
const ruLock=()=>ruToggle('lk',!ruSt.lk,ruSt.lk?'Guides unlocked.':'Guides locked.');
function ruClear(){const g=ruGd();if(!g.x.length&&!g.y.length)return;ruPut({x:[],y:[]},'Cleared guides');pmsg('Guides cleared.')}
// New guide…: a small dialog with the direction and a position typed like the Element group's fields (units, sums)
const ruDlg={ax:'y',from:null};
function ruNewOpen(){const d=$('rngd');if(!d)return;ruDlg.from=document.activeElement;try{if(typeof WBX.wbCloseMenus=='function')WBX.wbCloseMenus()}catch(e){}
 ruAx(ruDlg.ax);const f=$('rngp');f.value=unFmt(0);f.classList.remove('bad');$('rngu').textContent=unGet();d.hidden=false;f.focus();f.select()}
function ruAx(ax){ruDlg.ax=ax;[['rngh','y'],['rngv','x']].forEach(([id,a])=>{const b=$(id);b.classList.toggle('on',ax==a);b.setAttribute('aria-pressed',String(ax==a))})}
function ruNewHide(){$('rngd').hidden=true;const f=ruDlg.from;ruDlg.from=null;if(f&&f.focus&&document.contains(f))try{f.focus()}catch(e){}}
function ruNewOk(){const f=$('rngp'),v=unParse(f.value,0);if(v==null){f.classList.add('bad');f.focus();return}
 const g=ruGd();g[ruDlg.ax].push(v);ruNewHide();ruPut(g,'Added guide');if(!ruSt.sh)ruToggle('sh',true)}
function init99(){ruSt.on=ruFlag('on',false);ruSt.sh=ruFlag('sh',true);ruSt.lk=ruFlag('lk',false);
 const R=$('rul'),bd=$('boardP');if(!R||!bd)return;
 $('rux').addEventListener('pointerdown',e=>ruStart(e,'y',-1));$('ruy').addEventListener('pointerdown',e=>ruStart(e,'x',-1));
 $('rug').addEventListener('pointerdown',e=>{const t=e.target.closest('.rgd');if(!t||ruSt.lk)return;ruStart(e,t.dataset.ax,+t.dataset.i)});
 // redraw whenever the view or the document may have moved: zoom and pan change #art and #artwrap, the board scrolls or resizes, a draw follows every change
 const mo=new MutationObserver(ruSched);mo.observe($('art'),{attributes:true,attributeFilter:['style','viewBox']});mo.observe($('artwrap'),{attributes:true,attributeFilter:['style']});
 mo.observe(document.body,{attributes:true,attributeFilter:['class']});mo.observe(bd,{attributes:true,attributeFilter:['class']});
 bd.addEventListener('scroll',ruSched,{passive:true});addEventListener('resize',ruSched);if(window.ResizeObserver)new ResizeObserver(ruSched).observe(bd);
 const d0=WBH.draw;WBH.draw=function(){const r=d0.apply(this,arguments);ruSched();return r};WBX.wbRulDraw=()=>{ruSt.key='';ruSched()};
 const on=k=>()=>!!ruSt[k],canvas=()=>!ruStamp();
 cmdRegister({id:'view.rulers',label:'Rulers',shortcut:'Mod+R',on:on('on'),enabled:canvas,run:ruRulers});
 cmdRegister({id:'view.guides',label:'Guides',shortcut:"Mod+'",on:on('sh'),enabled:canvas,run:ruGuides});
 cmdRegister({id:'view.lockGuides',label:'Lock guides',on:on('lk'),enabled:canvas,run:ruLock});
 cmdRegister({id:'view.clearGuides',label:'Clear guides',enabled:()=>canvas()&&!!WBX.wbGuideLines(),run:ruClear});
 cmdRegister({id:'view.newGuide',label:'New guide',enabled:canvas,run:ruNewOpen});
 document.addEventListener('keydown',e=>{const t=e.target;if(!(e.metaKey||e.ctrlKey)||e.altKey||e.shiftKey||(t.matches&&t.matches('input,textarea,select,[contenteditable]'))||ruStamp())return;
  if(e.key=='r'||e.key=='R'){e.preventDefault();ruRulers()}else if(e.key=="'"){e.preventDefault();ruGuides()}});
 $('rngh').onclick=()=>ruAx('y');$('rngv').onclick=()=>ruAx('x');$('rngok').onclick=ruNewOk;$('rngcx').onclick=ruNewHide;$('rngx').onclick=ruNewHide;
 $('rngd').addEventListener('click',e=>{if(e.target===$('rngd'))ruNewHide()});
 $('rngd').addEventListener('keydown',e=>{if(e.key=='Escape'){e.preventDefault();e.stopPropagation();ruNewHide()}else if(e.key=='Enter'&&e.target.id=='rngp'){e.preventDefault();ruNewOk()}});
 ruSched()}
export {init99};
