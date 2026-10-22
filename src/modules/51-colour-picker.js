import {ICN} from './00-icons.js';
import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,closeDD,placeFloat} from './04-canvas-and-stamp-outlines.js';
import {DRT} from './02-draft-mode-speedups.js';
import {ser} from './14-presets-and-layer-grid-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {hexAlpha,normHexA,withAlpha} from './50-tray-core.js';
// ===== Colour picker and dropper =====
// One picker for every colour in the app: the tray slots, fixed colours, and the colour fields of other tools (grade masks and so on).
// Saturation/brightness square, hue, opacity, and hex, RGB and HSB fields that stay in step. Recent colours underneath. A dropper that
// samples the finished picture as it looks (textures, blends, grading, transparency, imported pictures), with a magnifier.
// openPicker(anchor, {value, alpha, name, onName, onInput(hex), onChange(hex), saved(), onPick(hex, name), actions:[[label, svg, fn]], onClose})
// saved() gives the colours for the "Saved colours" dropdown (with its search); onPick, when given, takes a chosen saved colour and its name as one step.
const PK_IC=(d,w)=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const DROP_IC=PK_IC(ICN.eyedropper);
const RC_KEY='wb200_recent',RC_MAX=20;
let PK=null;   // the open picker: {el, o (options), H,S,V,A, anchor}
const hx2=n=>Math.round(Math.max(0,Math.min(255,n))).toString(16).padStart(2,'0');
function hsv2rgb(h,s,v){const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return[f(5)*255,f(3)*255,f(1)*255]}
function rgb2hsv(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){if(mx==r)h=((g-b)/d+6)%6;else if(mx==g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60}return[h,mx?d/mx:0,mx]}
const hexOf=(H,S,V,A)=>withAlpha('#'+hsv2rgb(H,S,V).map(hx2).join(''),A);
function pkRecents(){try{const a=JSON.parse(kv.get(RC_KEY)||'[]');return Array.isArray(a)?a.map(normHexA).filter(Boolean).slice(0,RC_MAX):[]}catch(e){return[]}}
function addRecent(h){h=normHexA(h);if(!h)return;const a=pkRecents().filter(x=>x!==h);a.unshift(h);try{kv.set(RC_KEY,JSON.stringify(a.slice(0,RC_MAX)))}catch(e){}}
// a swatch that shows opacity: the colour over a checkerboard
const chk='repeating-conic-gradient(#c9c4ba 0 25%,#f4f1ea 0 50%) 50%/10px 10px';
const swBg=h=>h&&h.length==9&&!h.endsWith('ff')?`linear-gradient(${h},${h}),${chk}`:h;   // the checkerboard only where it shows
function pkBuild(){const el=document.createElement('div');el.className='cpk';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','Colour');
 el.innerHTML=`<div class="cpkh"><span class="cpkw"></span><input type="text" class="cpkn" maxlength="40" spellcheck="false" aria-label="Colour name"><span class="cpka"></span></div>
<div class="dd2 cpks" hidden><button type="button" class="ddb" aria-haspopup="listbox" aria-expanded="false"><span class="ddt">Saved colours</span><em>▾</em></button></div>
<div class="cpksv" tabindex="0" aria-label="Saturation and brightness"><i></i></div>
<div class="cpkr"><button type="button" class="ib cpkd" aria-label="Pick a colour from the picture">${DROP_IC}</button><div class="cpkbars"><div class="cpkhue" tabindex="0" aria-label="Hue"><i></i></div><div class="cpkal" tabindex="0" aria-label="Opacity"><b></b><i></i></div></div></div>
<div class="cpkf"><label>Hex<input type="text" data-f="hex" maxlength="9" spellcheck="false"></label><label class="cpkaf">Opacity<input type="text" data-f="a" inputmode="numeric" maxlength="3"></label></div>
<div class="cpkf3"><label>R<input type="text" data-f="r" inputmode="numeric" maxlength="3"></label><label>G<input type="text" data-f="g" inputmode="numeric" maxlength="3"></label><label>B<input type="text" data-f="b" inputmode="numeric" maxlength="3"></label></div>
<div class="cpkf3"><label>H<input type="text" data-f="h" inputmode="numeric" maxlength="3"></label><label>S<input type="text" data-f="s" inputmode="numeric" maxlength="3"></label><label>B<input type="text" data-f="v" inputmode="numeric" maxlength="3"></label></div>
<div class="cpkrc" role="list" aria-label="Recent colours"></div>`;
 document.body.appendChild(el);return el}
function pkPaint(skip){const p=PK;if(!p)return;const e=p.el,h=hexOf(p.H,p.S,p.V,p.A),rgb=hsv2rgb(p.H,p.S,p.V).map(Math.round),op=hexOf(p.H,p.S,p.V,1);
 const sv=e.querySelector('.cpksv');sv.style.background=`linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${p.H},100%,50%))`;sv.firstChild.style.left=p.S*100+'%';sv.firstChild.style.top=(1-p.V)*100+'%';
 e.querySelector('.cpkhue i').style.left=p.H/360*100+'%';
 const al=e.querySelector('.cpkal');al.querySelector('b').style.background=`linear-gradient(90deg,${op}00,${op}),${chk}`;al.querySelector('i').style.left=p.A*100+'%';
 e.querySelector('.cpkw').style.background=swBg(h);
 const set=(f,v)=>{const i=e.querySelector(`[data-f="${f}"]`);if(i&&i!==skip&&document.activeElement!==i)i.value=v};
 set('hex',h.toUpperCase());set('a',String(Math.round(p.A*100)));set('r',rgb[0]);set('g',rgb[1]);set('b',rgb[2]);set('h',Math.round(p.H));set('s',Math.round(p.S*100));set('v',Math.round(p.V*100));
 return h}
let rafI=0;
function emit(fin){const p=PK;if(!p)return;const h=pkPaint();if(h!==p.last){p.last=h;p.dirty=true;if(p.o.onInput){if(fin){cancelAnimationFrame(rafI);rafI=0;p.o.onInput(h)}else if(!rafI)rafI=requestAnimationFrame(()=>{rafI=0;if(PK===p&&p.o.onInput)p.o.onInput(p.last)})}}if(fin)commit()}
function commit(){const p=PK;if(!p||!p.dirty)return;p.dirty=false;if(rafI){cancelAnimationFrame(rafI);rafI=0;if(p.o.onInput)p.o.onInput(p.last)}addRecent(p.last);if(p.o.onChange)p.o.onChange(p.last);paintRecents()}
function setHex(h,fin){h=normHexA(h);if(!h||!PK)return;const [r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),[H,S,V]=rgb2hsv(r,g,b);if(S>0&&V>0)PK.H=H;PK.S=S;PK.V=V;PK.A=hexAlpha(h);if(!PK.o.alpha)PK.A=1;emit(fin)}
// ---- saved colours: a dropdown with a search field, offered when the caller passes saved():[{g:'Group', items:[{n name, h hex, t tray}]}]
const SV_IC=PK_IC(ICN.search,1.7),xe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let SVL=null,SVB=null,SVI=null,SVR=[];   // the list, its button, its search field, the rows now showing (flat, in order)
let SVX=-1;                                // the row the arrow keys are on
function svPaint(){if(!SVL||!PK||!PK.o.saved)return;const q=SVI.value.trim().toLowerCase().split(/\s+/).filter(Boolean);SVR=[];let h='';
 for(const g of PK.o.saved()){const hit=g.items.filter(it=>{const hay=(it.n+' '+it.h+' '+it.h.slice(1)+' '+(it.t||'')).toLowerCase();return q.every(w=>hay.includes(w))});
  if(!hit.length)continue;h+=`<div class="ddg" role="presentation">${xe(g.g)}</div>`;
  hit.forEach(it=>{h+=`<div class="ddi" role="option" data-k="${SVR.length}"><i class="chip" style="background:${swBg(it.h)}"></i><span class="ddt">${xe(it.n)}</span><small>${it.h.slice(0,7).toUpperCase()}</small></div>`;SVR.push(it)})}
 SVL.querySelector('.cpkli').innerHTML=h||'<div class="ddi dis">No matching colour</div>';SVX=SVR.length?0:-1;svMark()}
function svMark(){SVL.querySelectorAll('.ddi').forEach(r=>{const on=+r.dataset.k===SVX&&SVX>=0;r.classList.toggle('cur',on);if(on)r.scrollIntoView({block:'nearest'})})}
function svOpen(){if(!PK||!PK.o.saved)return;closeDD();SVI.value='';SVL.hidden=false;svPaint();SVB.setAttribute('aria-expanded','true');placeFloat(SVL,SVB,false,340);SVI.focus({preventScroll:true})}
function svClose(){if(SVL)SVL.hidden=true;if(SVB)SVB.setAttribute('aria-expanded','false')}
// choosing a saved colour: the colour (and its name, where the picker has a name field) in one step
function svPick(it){const p=PK;if(!p||!it)return;svClose();const h=normHexA(it.h);if(!h)return;
 if(p.o.onPick){const [r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),[H,S,V]=rgb2hsv(r,g,b);if(S>0&&V>0)p.H=H;p.S=S;p.V=V;p.A=p.o.alpha?hexAlpha(h):1;p.last=pkPaint();p.dirty=false;addRecent(p.last);paintRecents();p.o.onPick(p.last,it.n||'');const nm=p.el.querySelector('.cpkn');if(!nm.hidden)nm.value=it.n||''}
 else setHex(h,true)}
function paintRecents(){if(!PK)return;const box=PK.el.querySelector('.cpkrc'),a=pkRecents().filter(h=>PK.o.alpha||h.length==7);box.innerHTML=a.map(h=>`<button type="button" role="listitem" data-h="${h}" aria-label="${h.toUpperCase()}" style="background:${swBg(h)}"></button>`).join('');box.hidden=!a.length}
// dragging on the square or a bar: live updates (drawn in draft mode, as sliders are), one history step when let go
function dragOn(el,fn){el.addEventListener('pointerdown',e=>{if(e.button)return;e.preventDefault();el.setPointerCapture(e.pointerId);el.focus({preventScroll:true});WBX.wbNoCap=1;WBS.DRAFT=1;clearTimeout(DRT);fn(e);
 const mv=ev=>fn(ev),up=()=>{el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);WBX.wbNoCap=0;emit(true)};
 el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)})}
function keyOn(el,fn){el.addEventListener('keydown',e=>{const k=e.key,s=e.shiftKey?10:1;let d=null;if(k=='ArrowLeft')d=[-s,0];else if(k=='ArrowRight')d=[s,0];else if(k=='ArrowUp')d=[0,s];else if(k=='ArrowDown')d=[0,-s];if(!d)return;e.preventDefault();e.stopPropagation();fn(d);emit(true)})}
let EL=null;
function init51(){EL=pkBuild();const e=EL,sv=e.querySelector('.cpksv'),hb=e.querySelector('.cpkhue'),al=e.querySelector('.cpkal'),cl=v=>Math.max(0,Math.min(1,v));
 dragOn(sv,ev=>{const r=sv.getBoundingClientRect();PK.S=cl((ev.clientX-r.left)/r.width);PK.V=1-cl((ev.clientY-r.top)/r.height);emit()});
 dragOn(hb,ev=>{const r=hb.getBoundingClientRect();PK.H=cl((ev.clientX-r.left)/r.width)*359.9;emit()});
 dragOn(al,ev=>{const r=al.getBoundingClientRect();PK.A=Math.round(cl((ev.clientX-r.left)/r.width)*100)/100;emit()});
 keyOn(sv,([x,y])=>{PK.S=cl(PK.S+x/100);PK.V=cl(PK.V+y/100)});keyOn(hb,([x])=>{PK.H=(PK.H+x+360)%360});keyOn(al,([x])=>{PK.A=cl(Math.round(PK.A*100+x)/100)});
 e.addEventListener('keydown',ev=>{if(ev.key=='Escape'){ev.stopPropagation();closePicker(true)}else if(ev.target.matches('input'))ev.stopPropagation()});
 // fields: type, and Enter / leaving the field applies; arrow keys step numbers
 e.querySelectorAll('[data-f]').forEach(i=>{const f=i.dataset.f;
  const apply=fin=>{if(!PK)return;const v=i.value.trim();if(f=='hex'){const h=normHexA(v);if(h)setHex(PK.o.alpha?h:h.slice(0,7),fin);else if(fin)pkPaint();return}
   const n=parseFloat(v);if(!isFinite(n)){if(fin)pkPaint();return}
   if(f=='a')PK.A=cl(n/100);else if(f=='h')PK.H=Math.max(0,Math.min(359.9,n));else if(f=='s')PK.S=cl(n/100);else if(f=='v')PK.V=cl(n/100);
   else{const rgb=hsv2rgb(PK.H,PK.S,PK.V).map(Math.round),k='rgb'.indexOf(f);rgb[k]=Math.max(0,Math.min(255,Math.round(n)));const [H,S,V]=rgb2hsv(...rgb);if(S>0&&V>0)PK.H=H;PK.S=S;PK.V=V}
   if(fin)emit(true);else{const h=hexOf(PK.H,PK.S,PK.V,PK.A);PK.last=h;PK.dirty=true;pkPaint(i);if(PK.o.onInput)PK.o.onInput(h)}};
  i.addEventListener('input',()=>{if(f=='hex'?normHexA(i.value):isFinite(parseFloat(i.value)))apply(false)});
  i.addEventListener('change',()=>apply(true));
  i.addEventListener('keydown',ev=>{if(ev.key=='Enter'){ev.preventDefault();apply(true);i.select()}else if((ev.key=='ArrowUp'||ev.key=='ArrowDown')&&f!='hex'){ev.preventDefault();const n=(parseFloat(i.value)||0)+(ev.key=='ArrowUp'?1:-1)*(ev.shiftKey?10:1);i.value=String(n);apply(true);i.select()}});
  i.addEventListener('focus',()=>i.select())});
 e.querySelector('.cpkn').addEventListener('change',ev=>{if(PK&&PK.o.onName)PK.o.onName(ev.target.value.trim())});
 e.querySelector('.cpkn').addEventListener('keydown',ev=>{if(ev.key=='Enter')ev.target.blur()});
 e.querySelector('.cpkrc').addEventListener('click',ev=>{const b=ev.target.closest('[data-h]');if(b)setHex(b.dataset.h,true)});
 e.querySelector('.cpka').addEventListener('click',ev=>{const b=ev.target.closest('[data-a]');if(!b||!PK)return;const f=PK.o.actions[+b.dataset.a][2];f()});
 e.querySelector('.cpkd').addEventListener('click',()=>{if(!PK)return;const p=PK;startDropper((h,keepA)=>{if(PK!==p)return;setHex(p.o.alpha&&keepA?h:h.slice(0,7),true)})});   // a solid colour; Alt+click keeps how see-through the picked spot is
 // saved colours: the list lives on the page (so the picker's edges do not cut it), and a press inside it does not close the picker
 SVB=e.querySelector('.cpks .ddb');SVL=document.createElement('div');SVL.className='ddl cpkl cpkkeep';SVL.hidden=true;SVL.setAttribute('role','listbox');SVL.setAttribute('aria-label','Saved colours');
 SVL.innerHTML=`<div class="cpksq">${SV_IC}<input type="text" maxlength="40" spellcheck="false" autocomplete="off" placeholder="Search colours" aria-label="Search saved colours"></div><div class="cpkli"></div>`;document.body.appendChild(SVL);SVI=SVL.querySelector('input');
 SVB.addEventListener('click',ev=>{ev.stopPropagation();const open=SVL.hidden;if(open)svOpen();else svClose()});
 SVL.addEventListener('click',ev=>{ev.stopPropagation();const r=ev.target.closest('[data-k]');if(r)svPick(SVR[+r.dataset.k])});
 SVI.addEventListener('input',svPaint);
 SVI.addEventListener('keydown',ev=>{const k=ev.key;if(k=='ArrowDown'||k=='ArrowUp'){ev.preventDefault();if(SVR.length){SVX=(SVX+(k=='ArrowDown'?1:-1)+SVR.length)%SVR.length;svMark()}}
  else if(k=='Enter'){ev.preventDefault();if(SVX>=0)svPick(SVR[SVX])}else if(k=='Escape'){ev.preventDefault();ev.stopPropagation();svClose();SVB.focus()}});
 document.addEventListener('click',()=>{if(SVB)SVB.setAttribute('aria-expanded',String(!!SVL&&!SVL.hidden))});
 // close on a press outside (not on the thing that opened it: that one toggles)
 document.addEventListener('pointerdown',ev=>{if(PK&&!DROP&&!e.contains(ev.target)&&!(PK.anchor&&PK.anchor.contains(ev.target))&&!ev.target.closest('.cpkkeep'))closePicker()},true);
 addEventListener('resize',()=>{if(PK&&PK.anchor&&PK.anchor.isConnected)place()});
 WBX.wbPicker={open:openPicker,close:closePicker,isOpen:()=>!!PK,anchor:()=>PK&&PK.anchor};
}
function place(){const e=EL;placeFloat(e,PK.anchor,false);e.style.width=''}
function openPicker(anchor,o){closePicker();closeDD();if(typeof closeMenus=='function')closeMenus();const e=EL;
 PK={el:e,o:{alpha:true,...o},anchor,H:0,S:0,V:0,A:1,last:null,dirty:false};
 const h=normHexA(o.value)||'#888888',[r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),[H,S,V]=rgb2hsv(r,g,b);Object.assign(PK,{H,S,V,A:PK.o.alpha?hexAlpha(h):1,last:PK.o.alpha?h:h.slice(0,7)});
 const head=e.querySelector('.cpkh'),nm=e.querySelector('.cpkn'),acts=e.querySelector('.cpka');head.hidden=o.name==null&&!(o.actions&&o.actions.length);
 nm.hidden=o.name==null;nm.value=o.name||'';nm.placeholder=o.namePh||'';nm.readOnly=!o.onName;
 acts.innerHTML=(o.actions||[]).map(([l,svg],i)=>`<button type="button" class="ib" data-a="${i}" aria-label="${l}" title="${l}">${svg}</button>`).join('');
 svClose();e.querySelector('.cpks').hidden=!PK.o.saved;e.classList.toggle('noa',!PK.o.alpha);e.hidden=false;pkPaint();paintRecents();place();if(anchor&&anchor.setAttribute)anchor.setAttribute('aria-expanded','true');
 requestAnimationFrame(()=>{if(PK&&PK.el===e&&!e.contains(document.activeElement))e.querySelector('.cpksv').focus({preventScroll:true})})}
function closePicker(){const p=PK;if(!p)return;svClose();commit();PK=null;EL.hidden=true;if(p.anchor&&p.anchor.setAttribute)p.anchor.setAttribute('aria-expanded','false');if(p.o.onClose)p.o.onClose()}
// ===== Dropper =====
// The picture is drawn once into a canvas at the size it shows on screen (the same vector picture exports use), then the pixel under the
// pointer is read from it. A magnifier follows the pointer; click picks (Alt+click keeps the colour's opacity), Esc or a right-click cancels.
let DROP=null;
function artTargets(){const t=[];const a=$('art');if(a&&a.getClientRects().length&&!$('boardP').hidden)t.push(a);return t}
function startDropper(cb){if(DROP)return;const tg=artTargets();if(!tg.length){pmsg('The pattern is not on screen, so there is no picture to pick a colour from.');return}
 const ov=document.createElement('div');ov.className='edrov';ov.innerHTML='<div class="edrl"><canvas width="132" height="132"></canvas><b></b></div>';document.body.appendChild(ov);
 const lp=ov.firstChild,lc=lp.firstChild,lx=lc.getContext('2d'),lb=lp.lastChild;lx.imageSmoothingEnabled=false;
 DROP={ov,cb,img:null,W:0,H:0,data:null,busy:true};document.body.classList.add('eyedrop');
 // draw the picture
 const r0=$('art').getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);let W=Math.round(Math.max(r0.width,400)*dpr),H=Math.round(W*CH/CW);const mx=3200;if(W>mx||H>mx){const k=mx/Math.max(W,H);W=Math.round(W*k);H=Math.round(H*k)}
 const img=new Image();img.onload=()=>{if(!DROP)return;try{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,W,H);DROP.data=x.getImageData(0,0,W,H).data;DROP.W=W;DROP.H=H;DROP.busy=false;ov.classList.remove('busy');if(DROP.last)move(DROP.last)}catch(e){stopDropper()}};
 img.onerror=()=>stopDropper();ov.classList.add('busy');
 setTimeout(()=>{try{img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser())}catch(e){stopDropper()}},0);
 // where the pointer is in the picture (0..1), through whichever view of it is under the pointer
 const at=(cx,cy)=>{for(const el of tg){const m=el.getScreenCTM&&el.getScreenCTM();if(!m)continue;const r=el.getBoundingClientRect();if(cx<r.left||cx>r.right||cy<r.top||cy>r.bottom)continue;const p=new DOMPoint(cx,cy).matrixTransform(m.inverse()),u=p.x/CW,v=p.y/CH;if(u>=0&&u<1&&v>=0&&v<1)return[u,v]}return null};
 const px=(u,v)=>{const X=Math.floor(u*DROP.W),Y=Math.floor(v*DROP.H),i=(Y*DROP.W+X)*4,d=DROP.data;return[d[i],d[i+1],d[i+2],d[i+3]]};
 const hexAt=(u,v)=>{const [r,g,b,a]=px(u,v);return withAlpha('#'+[r,g,b].map(hx2).join(''),a/255)};
 function move(e){DROP.last={clientX:e.clientX,clientY:e.clientY};lp.style.left=e.clientX+'px';lp.style.top=e.clientY+'px';const uv=at(e.clientX,e.clientY);lp.classList.toggle('off',!uv);if(!uv||DROP.busy){lb.textContent='';return}
  const N=11,s=132/N,X0=Math.floor(uv[0]*DROP.W),Y0=Math.floor(uv[1]*DROP.H);lx.clearRect(0,0,132,132);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const X=X0+i-5,Y=Y0+j-5;if(X<0||Y<0||X>=DROP.W||Y>=DROP.H)continue;const k=(Y*DROP.W+X)*4,d=DROP.data;lx.fillStyle=`rgba(${d[k]},${d[k+1]},${d[k+2]},${d[k+3]/255})`;lx.fillRect(i*s,j*s,Math.ceil(s),Math.ceil(s))}
  lx.strokeStyle='#fff';lx.lineWidth=2;lx.strokeRect(5*s,5*s,s,s);lx.strokeStyle='rgba(0,0,0,.6)';lx.lineWidth=1;lx.strokeRect(5*s-1.5,5*s-1.5,s+3,s+3);
  const h=hexAt(uv[0],uv[1]);lb.textContent=h.slice(0,7).toUpperCase();lp.style.setProperty('--c',h.slice(0,7))}
 ov.addEventListener('pointermove',move);
 ov.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(e.button){stopDropper();return}if(DROP.busy)return;const uv=at(e.clientX,e.clientY);if(!uv)return;const h=hexAt(uv[0],uv[1]),f=DROP.cb,keep=e.altKey;stopDropper();f(h,keep)});
 ov.addEventListener('contextmenu',e=>{e.preventDefault();stopDropper()});
 DROP.key=e=>{if(e.key=='Escape'){e.preventDefault();e.stopPropagation();stopDropper()}};document.addEventListener('keydown',DROP.key,true)}
function stopDropper(){if(!DROP)return;document.removeEventListener('keydown',DROP.key,true);DROP.ov.remove();DROP=null;document.body.classList.remove('eyedrop')}
export {addRecent,closePicker,init51,openPicker,startDropper,swBg};
