import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {C,CH,CM,CW,closeDD,col,geom,okC,placeFloat,shOf} from './04-canvas-and-stamp-outlines.js';
import {refLabel} from './50-tray-core.js';
import {store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {LY} from './14-presets-and-layer-grid-ui.js';
// ===== Colour grading: a render-only filter (palette untouched). Global sliders, plus Lightroom-style masks that add their own
// adjustments to part of the print: linear/radial gradients (over the whole canvas, or inside every print of a stamp), one layer,
// a colour range or a luminance range. Applied to the pattern, texture, stamp editor and exports.
const GK=['ex','ct','hi','sh','wh','bl','tp','tn','sat','vib','hue','fd'],zA=()=>Object.fromEntries(GK.map(k=>[k,0]));
const MT={lin:'Linear gradient',rad:'Radial gradient',lay:'Layer',col:'Colour range',lum:'Luminance range'},MS={lin:'Linear',rad:'Radial',lay:'Layer',col:'Colour',lum:'Luminance'};
const MD={lin:{sp:'c',st:'',x1:.5,y1:.1,x2:.5,y2:.5},rad:{sp:'c',st:'',cx:.5,cy:.5,rx:.32,ry:.22,fe:50},lay:{lay:''},col:{c:'#000000',rg:20,sm:50},lum:{lo:0,hi:35,sm:25}};
const MIC={lin:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M3.5 12h17" stroke-dasharray="2.4 2.4"/></svg>',
rad:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4" stroke-dasharray="2.2 2"/></svg>',
lay:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12l8.5 4.5 8.5-4.5"/><path d="M3.5 16l8.5 4.5 8.5-4.5"/></svg>',
col:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5s6 6.2 6 10.2a6 6 0 01-12 0c0-4 6-10.2 6-10.2z"/></svg>',
lum:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 010 17z" fill="currentColor"/></svg>',
glob:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M3.5 15l5-5 4 4 2.5-2.5 5.5 5.5"/></svg>'};
const cl01=v=>Math.max(0,Math.min(1,v)),f4=v=>(+v).toFixed(4),sst=t=>{t=cl01(t);return t*t*(3-2*t)},hasA=a=>!!a&&GK.some(k=>+a[k]);
function mFix(m){if(!m||!MT[m.t])return null;const d=MD[m.t],o={sc:m.sc?String(m.sc):'',id:String(m.id||('m'+Math.random().toString(36).slice(2,8))),t:m.t,name:String(m.name||MS[m.t]).slice(0,30),on:m.on!==false,inv:!!m.inv,amt:m.amt==null||!isFinite(+m.amt)?100:Math.max(0,Math.min(100,+m.amt)),a:zA()};
GK.forEach(k=>{if(m.a&&isFinite(+m.a[k]))o.a[k]=+m.a[k]});Object.keys(d).forEach(k=>{const v=m[k]??d[k];o[k]=typeof d[k]=='number'?(isFinite(+v)?+v:d[k]):String(v)});
if(o.sp!==undefined&&o.sp!='s')o.sp='c';if(!o.sc&&o.sp=='s'&&o.st)o.sc=o.st;if(o.c!==undefined&&!/^#[0-9a-f]{6}$/i.test(o.c))o.c=d.c;return o}
const gFix=o=>{const g={...zA(),cov:false,masks:[]};if(o&&typeof o=='object'){GK.forEach(k=>{if(isFinite(+o[k]))g[k]=+o[k]});g.cov=!!o.cov;if(Array.isArray(o.masks))g.masks=o.masks.map(mFix).filter(Boolean)}return g};
let grd;
let gdLast='',gdBypass=false,gmSel=-1,gmOv=false,gmRen=-1,OVX=true,gBuilt='',gmVis=false;
const gmVisM=m=>{if(!m)return false;if(vw()=='stamp'){const t=WBS.tiles[WBS.cur];return !!t&&((m.sc&&m.sc==String(t.id))||(!m.sc&&isPos(m)&&m.sp=='s'&&!m.st))}return !m.sc};
const gmCur=()=>{const m=gmSel>=0?grd.masks[gmSel]||null:null;return m&&gmVisM(m)?m:null},tgtA=w=>{const m=gmCur();if(m)return m.a;if(vw()=='stamp'){const t=WBS.tiles[WBS.cur];if(t)return w?(t.gr||(t.gr=zA())):(t.gr||zA())}return grd};
const ovOf=m=>OVX&&gmOv&&m===gmCur()&&m.on;
const isPos=m=>m&&(m.t=='lin'||m.t=='rad');
const stMasks=tid=>grd.masks.filter(m=>m.on&&WBS.edMk&&m.t!='lay'&&((m.sc&&m.sc==String(tid))||(!m.sc&&isPos(m)&&m.sp=='s'&&(!m.st||m.st==String(tid)))));
const tOf=tid=>WBS.tiles.find(t=>String(t.id)==String(tid));
const layMasks=u=>grd.masks.filter(m=>m.on&&WBS.edMk&&m.t=='lay'&&m.lay&&m.lay==u);
const stF=tid=>stMasks(tid).length||hasA((tOf(tid)||{}).gr)?'wbgs'+tid:'',layF=u=>layMasks(u).length?'wbgl'+u:'';
// one set of grade adjustments as filter primitives: [prims, result name]
function adjP(a,inp,res){const g=k=>(+a[k]||0)/100,ex=Math.pow(2,g('ex')*2),tp=g('tp'),tn=g('tn');
const r=ex*(1+tp*.18)*(1+tn*.06),gg=ex*(1-tn*.14),b=ex*(1-tp*.18)*(1+tn*.06);
const ct=g('ct'),hi=g('hi'),sh=g('sh'),wh=g('wh'),bl=g('bl'),fd=g('fd'),N=48,tv=[];
for(let i=0;i<=N;i++){const x=i/N;let y=x;
 y=y+sh*.32*Math.pow(Math.sin(Math.PI*Math.min(1,y*1.6)),2)*(y<.625?1:0);            // shadows: lift/lower the low-mids
 y=y+hi*.32*Math.pow(Math.sin(Math.PI*Math.max(0,(y-.375)*1.6)),2)*(y>.375?1:0);      // highlights: the upper-mids
 y=y+wh*.25*Math.pow(y,3);y=y+bl*.25*Math.pow(1-y,3);                                   // whites / blacks: the ends
 const k=ct>=0?1+ct*1.2:1+ct*.8;y=.5+(y-.5)*k;                                          // contrast around mid-grey
 y=fd*.22+y*(1-fd*.3);                                                                  // fade: lifted, softened blacks
 tv.push(f4(cl01(y)))}
const sat=Math.max(0,(1+g('sat'))*(1+g('vib')*.5)),hue=+a.hue||0,T=tv.join(' ');
let o=`<feColorMatrix in="${inp}" type="matrix" values="${f4(r)} 0 0 0 0 0 ${f4(gg)} 0 0 0 0 0 ${f4(b)} 0 0 0 0 0 1 0" result="${res}1"/><feComponentTransfer in="${res}1" result="${res}2"><feFuncR type="table" tableValues="${T}"/><feFuncG type="table" tableValues="${T}"/><feFuncB type="table" tableValues="${T}"/></feComponentTransfer>`,c=res+'2';
if(Math.abs(sat-1)>1e-4){o+=`<feColorMatrix in="${c}" type="saturate" values="${f4(sat)}" result="${res}3"/>`;c=res+'3'}
if(hue){o+=`<feColorMatrix in="${c}" type="hueRotate" values="${hue}" result="${res}4"/>`;c=res+'4'}return[o,c]}
// gradient masks: white with falling opacity, drawn by feImage. ctx: W,H = the space the mask's 0..1 coordinates map to; X,Y,RW,RH = filter region
function gImg(m,c,res){const W=c.W,H=c.H;let g;
if(m.t=='lin'){const x1=m.x1*W,y1=m.y1*H;let x2=m.x2*W,y2=m.y2*H;if(Math.hypot(x2-x1,y2-y1)<.5)y2=y1+.5;
 const st=[0,.15,.3,.45,.55,.7,.85,1].map(t=>`<stop offset="${t}" stop-color="#fff" stop-opacity="${f4(1-sst(t))}"/>`).join('');
 g=`<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="${f4(x1)}" y1="${f4(y1)}" x2="${f4(x2)}" y2="${f4(y2)}">${st}</linearGradient>`}
else{const cx=m.cx*W,cy=m.cy*H,rx=Math.max(.5,Math.abs(m.rx)*W),ry=Math.max(.5,Math.abs(m.ry)*H),inr=Math.min(.99,cl01(1-m.fe/100));
 const st=`<stop offset="0" stop-color="#fff"/>`+[0,.2,.4,.6,.8,1].map(t=>`<stop offset="${f4(inr+(1-inr)*t)}" stop-color="#fff" stop-opacity="${f4(1-sst(t))}"/>`).join('');
 g=`<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="${f4(cx)}" cy="${f4(cy)}" r="${f4(rx)}" gradientTransform="translate(${f4(cx)} ${f4(cy)}) scale(1 ${f4(ry/rx)}) translate(${f4(-cx)} ${f4(-cy)})">${st}</radialGradient>`}
const sv=`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(c.RW)}" height="${Math.ceil(c.RH)}" viewBox="${f4(c.X)} ${f4(c.Y)} ${f4(c.RW)} ${f4(c.RH)}" preserveAspectRatio="none"><defs>${g}</defs><rect x="${f4(c.X)}" y="${f4(c.Y)}" width="${f4(c.RW)}" height="${f4(c.RH)}" fill="url(#g)"/></svg>`;
return[`<feImage href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(sv)}" x="${f4(c.X)}" y="${f4(c.Y)}" width="${f4(c.RW)}" height="${f4(c.RH)}" preserveAspectRatio="none" result="${res}"/>`,res]}
// luminance range: alpha = brightness, then a soft band between From and To
function lumP(m,res){const lo=m.lo/100,hi=m.hi/100,s=Math.max(.01,m.sm/100*.5),tv=[];
for(let i=0;i<=64;i++){const x=i/64,a=lo<=0?1:sst((x-lo+s)/(2*s)),b=hi>=1?1:sst((hi+s-x)/(2*s));tv.push(f4(lo>hi?0:Math.min(a,b)))}
return[`<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2126 .7152 .0722 0 0" result="${res}l"/><feComponentTransfer in="${res}l" result="${res}"><feFuncA type="table" tableValues="${tv.join(' ')}"/></feComponentTransfer>`,res]}
// colour range: per-channel closeness to the picked colour, combined, then softened
function colP(m,res){const h=m.c,t=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255),w=.03+m.rg/100*.42,tab=c=>{const v=[];for(let i=0;i<=128;i++)v.push(f4(cl01(1-Math.abs(i/128-c)/w)));return v.join(' ')};
const k=.04+m.sm/100*.96,sv=[];for(let i=0;i<=32;i++)sv.push(f4(sst((i/32-(1-k))/k)));
return[`<feComponentTransfer in="SourceGraphic" result="${res}d"><feFuncR type="table" tableValues="${tab(t[0])}"/><feFuncG type="table" tableValues="${tab(t[1])}"/><feFuncB type="table" tableValues="${tab(t[2])}"/></feComponentTransfer><feColorMatrix in="${res}d" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 -2" result="${res}s"/><feComponentTransfer in="${res}s" result="${res}"><feFuncA type="table" tableValues="${sv.join(' ')}"/></feComponentTransfer>`,res]}
const vw=()=>$('boardS').hidden?'pattern':'stamp';
const OVC='#ff2d55',GEYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',GNOEYE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 5.7A8.6 8.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-2.9 3.7M6.3 7.6C3.6 9.3 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.3 4-.9"/><path d="M4 4l16 16"/></svg>';
function maskStep(m,i,cur,ctx){const p='k'+i+ctx.k,ov=ovOf(m);if(!hasA(m.a)&&!ov)return['',cur];
let o='',aR=cur;if(hasA(m.a)){const r=adjP(m.a,cur,p+'a');o+=r[0];aR=r[1]}
const mm=isPos(m)?gImg(m,ctx,p+'i'):m.t=='lum'?lumP(m,p+'i'):colP(m,p+'i'),k=m.amt/100;
o+=mm[0]+`<feComponentTransfer in="${mm[1]}" result="${p}m"><feFuncA type="linear" slope="${f4(m.inv?-k:k)}" intercept="${f4(m.inv?k:0)}"/></feComponentTransfer>`;
o+=`<feComposite in="${aR}" in2="${p}m" operator="in" result="${p}A"/><feComposite in="${cur}" in2="${p}m" operator="out" result="${p}B"/><feComposite in="${p}A" in2="${p}B" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="${p}b"/>`;
let c=p+'b';if(ov){o+=`<feFlood flood-color="${OVC}" flood-opacity=".55" result="${p}F"/><feComposite in="${p}F" in2="${p}m" operator="in" result="${p}G"/><feComposite in="${p}G" in2="SourceAlpha" operator="in" result="${p}H"/><feComposite in="${p}H" in2="${c}" operator="over" result="${p}O"/>`;c=p+'O'}
return[o,c]}
const flt=(id,x,y,w,h,pr)=>`<filter id="${id}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="${f4(x)}" y="${f4(y)}" width="${f4(w)}" height="${f4(h)}" color-interpolation-filters="sRGB">${pr||'<feComponentTransfer/>'}</filter>`;
// The area the grade covers: the canvas, or on a repeat tile the tile and the part of its neighbours that is drawn (a margin, or a whole tile for the 3 x 3 view)
const gRg=()=>{if(!(WBS.dim.rt&&!WBS.book.on))return[0,0,CW,CH];const ex=WBS.tilePv?CW:Math.min(CW,48),ey=WBS.tilePv?CH:Math.min(CH,48);return[-ex,-ey,CW+2*ex,CH+2*ey]};
// the whole print (texture=1: the paper texture, which skips colour/luminance masks since it has no print colours of its own)
function canvasF(id,texture){let o='',c='SourceGraphic';if(hasA(grd)){const r=adjP(grd,c,'G');o+=r[0];c=r[1]}
const ctx={W:CW,H:CH,X:0,Y:0,RW:CW,RH:CH,k:'c'};
grd.masks.forEach((m,i)=>{if(!m.on||!WBS.edMk||m.t=='lay'||(isPos(m)&&m.sp=='s')||(texture&&!isPos(m))||(isPos(m)&&WBS.dim.rt&&!WBS.book.on))return;const r=maskStep(m,i,c,ctx);o+=r[0];c=r[1]});
return o?flt(id,...gRg(),o):''}
// stamp-space gradients ride along with every print of the stamp
function stampF(t){const g=geom(shOf(t)),W=g.SW,H=g.SH,p=Math.max(W,H)*.15,ctx={W,H,X:-p,Y:-p,RW:W+2*p,RH:H+2*p,k:'s'},ms=stMasks(t.id);let o='',c='SourceGraphic';
if(!gdBypass&&hasA(t.gr)){const r=adjP(t.gr,c,'T');o+=r[0];c=r[1]}
if(!gdBypass)grd.masks.forEach((m,i)=>{if(!ms.includes(m))return;const r=maskStep(m,i,c,ctx);o+=r[0];c=r[1]});return flt('wbgs'+t.id,-p,-p,W+2*p,H+2*p,o)}
function layerF(u){let o='',c='SourceGraphic';if(!gdBypass)grd.masks.forEach((m,i)=>{if(!layMasks(u).includes(m))return;const p='y'+i;
 if(hasA(m.a)){const r=adjP(m.a,c,p+'a'),k=m.amt/100;o+=r[0];if(k<1){o+=`<feComposite in="${r[1]}" in2="${c}" operator="arithmetic" k1="0" k2="${f4(k)}" k3="${f4(1-k)}" k4="0" result="${p}b"/>`;c=p+'b'}else c=r[1]}
 if(ovOf(m)){o+=`<feFlood flood-color="${OVC}" flood-opacity="${f4(.55*m.amt/100)}" result="${p}F"/><feComposite in="${p}F" in2="SourceAlpha" operator="in" result="${p}G"/><feComposite in="${p}G" in2="${c}" operator="over" result="${p}O"/>`;c=p+'O'}});
return flt('wbgl'+u,...gRg(),o)}
// stamp editor: the current stamp's gradients, then the global grade, then colour/luminance masks
// (bg=1: the stamp's paper, which stamp gradients leave alone, as in the pattern where they only touch the ink)
// the editor's grade covers what is on screen (the stamp, its margin and the side areas), not three stamps' width all round
function edRgn(W,H){const X=-W,Y=-H;let X2=2*W,Y2=2*H;try{const r=(WBS.WBDRG&&WBS._edRR)||(WBS._edRR=document.getElementById('ed').getBoundingClientRect());if(!WBS.WBDRG)WBS._edRR=null;if(r.width>0&&r.height>0){const vw=W+48,vh=H+48,s=Math.min(r.width/vw,r.height/vh),uw=r.width/s,uh=r.height/s,x0=-24-(uw-vw)/2,y0=-24-(uh-vh)/2,m=8;X2=Math.max(W,Math.min(X2,Math.ceil(x0+uw+m)));Y2=Math.max(H,Math.min(Y2,Math.ceil(y0+uh+m)))}}catch(e){}return{W,H,X,Y,RW:X2-X,RH:Y2-Y,k:'e'}}
function edF(bg,ink){const t=WBS.tiles[WBS.cur];if(!t)return'';const g=geom(shOf(t)),W=g.SW,H=g.SH,ctx=(bg||ink)?{W,H,X:-W,Y:-H,RW:2*W+8,RH:2*H+8,k:'e'}:edRgn(W,H),ms=bg?[]:stMasks(t.id);let o='',c='SourceGraphic';
if(!bg&&hasA(t.gr)){const r=adjP(t.gr,c,'T');o+=r[0];c=r[1]}
grd.masks.forEach((m,i)=>{if(!ms.includes(m))return;const r=maskStep(m,i,c,ctx);o+=r[0];c=r[1]});
if(hasA(grd)){const r=adjP(grd,c,'G');o+=r[0];c=r[1]}
grd.masks.forEach((m,i)=>{if(!m.on||!WBS.edMk||(m.t!='col'&&m.t!='lum'))return;const r=maskStep(m,i,c,ctx);o+=r[0];c=r[1]});
return o||bg?flt(bg?'wbgradeEB':ink?'wbgradeEI':'wbgradeE',ctx.X,ctx.Y,ctx.RW,ctx.RH,o):''}
function gDefs(ov){OVX=ov;let o='';try{if(!gdBypass){const e=edF(0);o+=canvasF('wbgrade',0)+canvasF('wbgradeT',1)+(e?e+edF(1)+edF(0,1):'')}
WBS.tiles.forEach(t=>{if(stF(t.id))o+=stampF(t)});new Set(grd.masks.filter(m=>m.on&&WBS.edMk&&m.t=='lay'&&m.lay).map(m=>m.lay)).forEach(u=>o+=layerF(u))}finally{OVX=true}return o}
const gKey=()=>JSON.stringify([WBS.tiles.map(t=>stF(t.id)),grd.masks.filter(m=>m.on&&WBS.edMk&&m.t=='lay').map(m=>m.lay)]);
// structural changes (which stamps / layers carry a mask filter) need a rebuild; slider moves only refresh the filters
function applyGrade(){if(gKey()!==gBuilt&&typeof upd=='function'){gBuilt=gKey();upd();return}refreshG()}
function refreshG(){gBuilt=gKey();const d=gDefs(true),has=id=>d.includes(`id="${id}"`);{const G=$('grdf');if(G._d!==d){G.innerHTML=d;G._d=d}}
has('wbgrade')?$('dyn').setAttribute('filter','url(#wbgrade)'):$('dyn').removeAttribute('filter');
has('wbgradeT')?$('texg').setAttribute('filter','url(#wbgradeT)'):$('texg').removeAttribute('filter');
if(has('wbgrade')&&grd.cov)$('covg').setAttribute('filter','url(#wbgrade)');else $('covg').removeAttribute('filter');$('ed').classList.toggle('graded',has('wbgradeE'));
document.querySelector('.rail [data-pn="grade"]').classList.toggle('gdon',hasA(grd)||grd.masks.some(m=>m.on&&hasA(m.a)));gmHandles()}
const gdSave=()=>{try{kv.set('wb41_grade',JSON.stringify(grd))}catch(e){}};
const gCap=()=>{if(WBX.wbCap)WBX.wbCap()};
// ---- mask list + settings
const tileN=id=>{const i=WBS.tiles.findIndex(t=>String(t.id)==String(id));return i<0?'':'Stamp '+(i+1)};
const colName=h=>{const e=C.find(c=>c[1].toLowerCase()==h.toLowerCase());return e?e[0]:h.toUpperCase()};
function gmMeta(m){let s=m.t=='lay'?((WBS.layers.find(L=>L.u==m.lay)||{}).name||'Pick a layer'):m.t=='col'?colName(m.c):m.t=='lum'?`${m.lo}–${m.hi}%`:m.sp=='s'?(m.st?tileN(m.st)||'Each stamp':'Each stamp'):'Canvas';
if(m.inv&&m.t!='lay')s+=', inverted';if(!hasA(m.a))s+=' · no changes yet';return s}
function renderGM(){if(gmSel>=grd.masks.length)gmSel=grd.masks.length-1;if(gmSel>=0&&!gmVisM(grd.masks[gmSel]))gmSel=-1;const m=gmCur();
$('gm_list').innerHTML=`<div class="lyr${gmSel<0?' on':''}" data-gm="-1"><span class="gmsp"></span><span class="gmi">${MIC.glob}</span><span class="lyn">${vw()=='stamp'?'Stamp '+(WBS.cur+1)+' <span class="lym">This stamp only</span>':'Global <span class="lym">Whole print</span>'}</span></div>`+grd.masks.map((q,i)=>!gmVisM(q)?'':`<div class="lyr${i==gmSel?' on':''}${q.on?'':' off'}" data-gm="${i}"><button type="button" class="eye" data-eye title="${q.on?'Hide':'Show'}">${q.on?GEYE:GNOEYE}</button><span class="gmi">${MIC[q.t]}</span><span class="lyn">${i==gmRen?`<input value="${hx(q.name)}" maxlength="30">`:hx(q.name)} <span class="lym">${hx(gmMeta(q))}</span></span></div>`).join('');
{const nv=grd.masks.filter(gmVisM).length;$('gm_cnt').textContent=nv?String(nv):''}$('gm_dup').disabled=$('gm_del').disabled=!m;$('gd_who').textContent=m?m.name:(vw()=='stamp'?'Stamp '+(WBS.cur+1):'Global');{const co=$('gdcov');if(co&&co.closest('label'))co.closest('label').hidden=vw()=='stamp'}$('gm_body').hidden=!m;
const inp=$('gm_list').querySelector('input');if(inp){inp.focus();inp.select();const done=ok=>{if(gmRen<0)return;const q=grd.masks[gmRen];if(ok&&q&&inp.value.trim())q.name=inp.value.trim().slice(0,30);gmRen=-1;gdSave();renderGM();gCap()};inp.onkeydown=e=>{if(e.key=='Enter')done(1);else if(e.key=='Escape')done(0);e.stopPropagation()};inp.onblur=()=>done(1)}
if(!m)return;const T=m.t,show=(id,on)=>$(id).hidden=!on;
show('gm_sp_r',isPos(m)&&!m.sc&&m.sp=='s');show('gm_st_r',isPos(m)&&m.sp=='s'&&!m.sc&&WBS.tiles.length>1);show('gm_eye',!m.sc);show('gm_lay_r',T=='lay');show('gm_col_r',T=='col');show('gm_lo_r',T=='lum');show('gm_hi_r',T=='lum');show('gm_rg_r',T=='col');show('gm_sm_r',T=='col'||T=='lum');show('gm_fe_r',T=='rad');show('gm_inv_r',T!='lay');
$('gm_sp').querySelectorAll('[data-gs]').forEach(b=>b.classList.toggle('on',b.dataset.gs==m.sp));
if(isPos(m)){$('gm_st').innerHTML='<option value="">All stamps</option>'+WBS.tiles.map((t,i)=>`<option value="${t.id}">Stamp ${i+1}</option>`).join('');$('gm_st').value=WBS.tiles.some(t=>String(t.id)==m.st)?m.st:''}
if(T=='lay'){$('gm_lay').innerHTML=(m.lay&&WBS.layers.some(L=>L.u==m.lay)?'':'<option value="">Pick a layer</option>')+WBS.layers.map((L,i)=>i).reverse().map(i=>`<option value="${WBS.layers[i].u}">${hx(WBS.layers[i].name)}</option>`).join('');$('gm_lay').value=WBS.layers.some(L=>L.u==m.lay)?m.lay:''}
if(T=='col'){const used=[...new Set([...WBS.proj.ts.map(id=>'@'+id),WBS.proj.bg,WBS.proj.ink,...WBS.tiles.map(t=>t.ink),...WBS.layers.map(L=>L.ink)].filter(n=>okC(n)))],hs=[...new Map(used.map(n=>[col(n).slice(0,7).toLowerCase(),refLabel(n)])).entries()].map(([h,n])=>[n,h]),cur0=m.c.toLowerCase();
 $('gm_col').innerHTML=hs.map(([n,h])=>`<option value="${h}">${hx(n)}</option>`).join('')+(hs.some(x=>x[1]==cur0)?'':`<option value="${cur0}">${hx(colName(cur0))}</option>`);$('gm_col').value=cur0;$('gm_cc').value=cur0}
['lo','hi','rg','sm','fe','amt'].forEach(k=>{const r=$('gm_'+k);if(m[k]!==undefined&&+r.value!=+m[k]){r.value=m[k];r.dispatchEvent(new Event('input',{bubbles:true}))}});
$('gm_inv').checked=!!m.inv;$('gm_ov').checked=gmOv;
const inEd=vw()=='stamp';$('gm_hint').textContent='';
$('gm_go').hidden=!(isPos(m)&&m.sp=='s'&&!inEd)}
function gradeSync(){const A=tgtA();GK.forEach(k=>{const r=$('gd_'+k);if(+r.value!=+(A[k]||0)){r.value=A[k]||0;r.dispatchEvent(new Event('input',{bubbles:true}))}});$('gdcov').checked=!!grd.cov;renderGM()}
const gmSet=(k,v)=>{const m=gmCur();if(!m)return;m[k]=v;gdSave();applyGrade();renderGM();gCap()};
// eyedropper: samples the print as the colour mask sees it (pattern only, before the canvas-wide grade)
let gmPick=null;const gmPickEnd=()=>{gmPick=null;$('art').classList.remove('gmpick');$('gm_eye').setAttribute('aria-pressed','false');if(gmCur())renderGM()};
// ---- on-canvas handles (Lightroom style): white lines and dots with a dark edge so they read on any print
function hSVG(m,W,H,k){const f=v=>v.toFixed(2),r=6.5*k,lw=1.5*k,ln=(x1,y1,x2,y2,d,dash)=>{const a=`x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"`;
 return`<g data-gh="${d}" style="cursor:grab"><line ${a} stroke="#000" stroke-opacity=".45" stroke-width="${f(lw*2.2)}"/><line ${a} stroke="#fff" stroke-width="${f(lw)}"${dash?` stroke-dasharray="${f(6*k)} ${f(5*k)}"`:''}/><line ${a} stroke="transparent" stroke-width="${f(12*k)}"/></g>`},
 dot=(x,y,d,big,cur)=>`<circle data-gh="${d}" cx="${f(x)}" cy="${f(y)}" r="${f(big?r*1.2:r)}" fill="${big?'var(--acc)':'#fff'}" stroke="${big?'#fff':'#000'}" stroke-opacity="${big?1:.55}" stroke-width="${f(big?2*k:1.2*k)}" style="cursor:${cur||'move'}"/>`;
if(m.t=='lin'){const x1=m.x1*W,y1=m.y1*H,x2=m.x2*W,y2=m.y2*H,L=Math.hypot(x2-x1,y2-y1)||1,nx=-(y2-y1)/L,ny=(x2-x1)/L,E=Math.hypot(W,H)*2,mx=(x1+x2)/2,my=(y1+y2)/2,cut=(x,y,d,dash)=>ln(x-nx*E,y-ny*E,x+nx*E,y+ny*E,d,dash);
 return cut(x2,y2,'p2',0)+cut(mx,my,'mv',1)+cut(x1,y1,'p1',0)+`<circle data-gh="p2" cx="${f(x2)}" cy="${f(y2)}" r="${f(r*.85)}" fill="rgba(0,0,0,.35)" stroke="#fff" stroke-width="${f(2*k)}" style="cursor:move"/>`+dot(x1,y1,'p1',0)+dot(mx,my,'mv',1)}
const cx=m.cx*W,cy=m.cy*H,rx=Math.abs(m.rx)*W,ry=Math.abs(m.ry)*H,inr=Math.min(.99,cl01(1-m.fe/100)),el=(a,b,dash)=>`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(a)}" ry="${f(b)}" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="${f(lw*2.2)}"/><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(a)}" ry="${f(b)}" fill="none" stroke="#fff" stroke-width="${f(lw)}"${dash?` stroke-dasharray="${f(6*k)} ${f(5*k)}"`:''}/>`;
return`<g pointer-events="none">${el(rx,ry,0)}${el(rx*inr,ry*inr,1)}</g>`+dot(cx+rx,cy,'rx','','ew-resize')+dot(cx-rx,cy,'rx','','ew-resize')+dot(cx,cy+ry,'ry','','ns-resize')+dot(cx,cy-ry,'ry','','ns-resize')+dot(cx,cy,'mv',1)}
let gmSec;const gmShown=()=>!!(gmSec&&!gmSec.hidden&&gmSec.offsetParent);
function gmHandles(){gmVis=gmShown();const m=gmCur(),G=$('gmov');if(G){let h='';if(gmVis&&m&&m.on&&isPos(m)&&m.sp!='s'&&vw()=='pattern'){const ctm=$('art').getScreenCTM();h=hSVG(m,CW,CH,ctm&&ctm.a?1/ctm.a:1)}G.innerHTML=h}edH()}
function edH(){const ed=$('ed');ed.querySelectorAll('.gmh').forEach(x=>x.remove());const m=gmCur(),t=WBS.tiles[WBS.cur];if(!gmVis||!m||!m.on||!isPos(m)||m.sp!='s'||vw()!='stamp'||!t||(m.st&&m.st!=String(t.id)))return;
const g=geom(shOf(t)),ctm=ed.getScreenCTM();ed.insertAdjacentHTML('beforeend',`<g class="gmh">${hSVG(m,g.SW,g.SH,ctm&&ctm.a?1/ctm.a:1)}</g>`)}
let gmDrag=null,gmRaf=0;
function gmDown(e,svg,W,H){const h=e.target.closest('[data-gh]');if(!h||e.button!==0)return;const m=gmCur();if(!m)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
const P=ev=>{const p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return[q.x/W,q.y/H]};gmDrag={m,h:h.dataset.gh,P,p0:P(e),o:{...m},moved:false}}
const gmUp=()=>{if(!gmDrag)return;const mv=gmDrag.moved;gmDrag=null;if(mv){gdSave();gCap()}};
function init31(){
document.querySelectorAll('#gm_menu [data-ic]').forEach(e=>e.innerHTML=MIC[e.dataset.ic]);
grd=gFix(null);try{const q=JSON.parse(kv.get('wb41_grade')||'null');if(q&&typeof q=='object')grd=gFix(q)}catch(e){}
GK.forEach(k=>{const r=$('gd_'+k);r.addEventListener('input',e=>{const v=+e.target.value,A=tgtA();if(A[k]===v)return;const W=tgtA(1);W[k]=v;if(W!==grd&&!gmCur())store();gdSave();applyGrade();if(gmCur())renderGM()});r.addEventListener('change',gCap)});
['lo','hi','rg','sm','fe','amt'].forEach(k=>{const r=$('gm_'+k);r.addEventListener('input',()=>{const m=gmCur();if(!m||m[k]===undefined||m[k]===+r.value)return;m[k]=+r.value;gdSave();applyGrade();if(k=='lo'||k=='hi')renderGM()});r.addEventListener('change',gCap)});
$('gm_sp').onclick=e=>{const b=e.target.closest('[data-gs]');if(b)gmSet('sp',b.dataset.gs)};
$('gm_st').onchange=()=>gmSet('st',$('gm_st').value);$('gm_lay').onchange=()=>gmSet('lay',$('gm_lay').value);
$('gm_col').onchange=()=>gmSet('c',$('gm_col').value);$('gm_cc').addEventListener('input',()=>{const m=gmCur();if(!m)return;m.c=$('gm_cc').value;gdSave();applyGrade()});$('gm_cc').addEventListener('change',()=>{renderGM();gCap()});
$('gm_eye').onclick=()=>{if(gmPick){gmPickEnd();return}if(vw()!='pattern'){const vb=document.querySelector('button[data-v="pattern"]');if(vb)vb.click()}
const c=$('art').cloneNode(true);WBX.wbVec(c);['#texg','#covg','#guig','#gmov','#fpov'].forEach(q=>{const e=c.querySelector(q);if(e)e.remove()});c.querySelector('#dyn').removeAttribute('filter');c.querySelector('#grdf').innerHTML=gDefs(false);c.setAttribute('width',CW);c.setAttribute('height',CH);
const W=Math.round(CW),H=Math.round(CH),img=new Image();gmPick={d:null,W,H};$('art').classList.add('gmpick');$('gm_eye').setAttribute('aria-pressed','true');$('gm_hint').textContent='Click the print to pick the colour to mask. Esc cancels.';
img.onload=()=>{if(!gmPick)return;try{const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.drawImage(img,0,0,W,H);gmPick.d=x.getImageData(0,0,W,H).data}catch(e){gmPickEnd()}};img.onerror=gmPickEnd;
img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(c))};
$('art').addEventListener('pointerdown',e=>{if(!gmPick)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const m=gmCur();if(!m||m.t!='col'||!gmPick.d){gmPickEnd();return}
const a=$('art'),p=a.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(a.getScreenCTM().inverse()),X=Math.max(0,Math.min(gmPick.W-1,Math.floor(q.x))),Y=Math.max(0,Math.min(gmPick.H-1,Math.floor(q.y))),i=(Y*gmPick.W+X)*4,d=gmPick.d;
m.c='#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');gdSave();applyGrade();gmPickEnd();gCap()},true);
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&gmPick)gmPickEnd()});
$('gm_inv').onchange=()=>gmSet('inv',$('gm_inv').checked);
$('gm_ov').onchange=()=>{gmOv=$('gm_ov').checked;refreshG()};
$('gm_go').onclick=()=>{const m=gmCur();if(m&&m.st){const i=WBS.tiles.findIndex(t=>String(t.id)==m.st);if(i>=0)WBS.cur=i}const vb=document.querySelector('button[data-v="stamp"]');if(vb)vb.click();upd();setTimeout(()=>{const rb=document.querySelector('.rail [data-pn="grade"]');if(rb&&!gmShown())rb.click();setTimeout(()=>{renderGM();gmHandles()},60)},60)};
$('gm_add').onclick=e=>{e.stopPropagation();{const li=$('gm_menu').querySelector('[data-gt=lay]');if(li)li.hidden=vw()=='stamp'}const l=$('gm_menu'),open=l.hidden;closeDD();if(WBX.wbCloseMenus)WBX.wbCloseMenus();l.hidden=!open;if(open)placeFloat(l,$('gm_add'),true)};
$('gm_menu').onclick=e=>{const it=e.target.closest('[data-gt]');if(!it)return;$('gm_menu').hidden=true;const t=it.dataset.gt,n=grd.masks.filter(q=>q.t==t).length+1,o={t,name:MS[t]+' '+n};
if(t=='lay')o.lay=(LY()||{}).u||'';if(t=='col')o.c=col(WBS.proj.ink).slice(0,7);if(vw()=='stamp'){const tt=WBS.tiles[WBS.cur];if(tt){o.sc=String(tt.id);if(isPos(o)){o.sp='s';o.st=o.sc}}}
grd.masks.push(mFix(o));gmSel=grd.masks.length-1;gdSave();gradeSync();applyGrade();gCap()};
$('gm_dup').onclick=()=>{const m=gmCur();if(!m)return;const c=mFix({...JSON.parse(JSON.stringify(m)),id:'',name:(m.name+' copy').slice(0,30)});grd.masks.splice(gmSel+1,0,c);gmSel++;gdSave();gradeSync();applyGrade();gCap()};
$('gm_del').onclick=()=>{if(!gmCur())return;grd.masks.splice(gmSel,1);gmSel=Math.min(gmSel,grd.masks.length-1);gdSave();gradeSync();applyGrade();gCap()};
$('gm_list').onclick=e=>{const r=e.target.closest('[data-gm]');if(!r||e.target.closest('input'))return;const i=+r.dataset.gm;
if(e.target.closest('[data-eye]')){const m=grd.masks[i];m.on=!m.on;gdSave();applyGrade();renderGM();gCap();return}if(i!=gmSel){gmSel=i;gradeSync();refreshG()}};
$('gm_list').ondblclick=e=>{const r=e.target.closest('[data-gm]');if(!r||+r.dataset.gm<0||e.target.closest('[data-eye]'))return;gmRen=+r.dataset.gm;gmSel=gmRen;gradeSync()};
$('gdcov').onchange=()=>{grd.cov=$('gdcov').checked;gdSave();applyGrade()};
$('gdrst').onclick=()=>{const A=tgtA(1);if(A!==grd&&!gmCur())store();GK.forEach(k=>A[k]=0);gdSave();gradeSync();applyGrade();gCap()};
{const b=$('gdcmp'),dn=()=>{gdBypass=true;refreshG();b.textContent='Showing original'},up=()=>{if(!gdBypass)return;gdBypass=false;refreshG();b.textContent='Hold to compare'};
b.addEventListener('pointerdown',dn);['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,up))}
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()!='o'||e.ctrlKey||e.metaKey||e.altKey||!gmCur()||!gmVis)return;const t=e.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)&&t.type!='range'&&t.type!='checkbox'))return;e.preventDefault();gmOv=!gmOv;$('gm_ov').checked=gmOv;refreshG()});
gmSec=document.querySelector('section.pn[data-p="grade"]');
try{new IntersectionObserver(()=>gmHandles()).observe(gmSec)}catch(e){}
document.querySelectorAll('button[data-v]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{if(gmSel>=0&&!gmVisM(grd.masks[gmSel]))gmSel=-1;gdLast=vw()+'|'+WBS.cur+'|'+gmSel;gradeSync();gmHandles()},40)));
try{new ResizeObserver(()=>{if(gmCur())gmHandles()}).observe($('art'))}catch(e){}
$('art').addEventListener('pointerdown',e=>{if(e.target.closest('#gmov'))gmDown(e,$('art'),CW,CH)},true);
$('ed').addEventListener('pointerdown',e=>{if(!e.target.closest('.gmh'))return;const g=geom(shOf(WBS.tiles[WBS.cur]));gmDown(e,$('ed'),g.SW,g.SH)},true);
window.addEventListener('pointermove',e=>{if(!gmDrag)return;const{m,h,o,p0}=gmDrag,[x,y]=gmDrag.P(e),dx=x-p0[0],dy=y-p0[1],c=v=>Math.max(-1,Math.min(2,v));gmDrag.moved=true;
if(m.t=='lin'){if(h=='p1'||h=='mv'){m.x1=c(o.x1+dx);m.y1=c(o.y1+dy)}if(h=='p2'||h=='mv'){m.x2=c(o.x2+dx);m.y2=c(o.y2+dy)}}
else{if(h=='mv'){m.cx=c(o.cx+dx);m.cy=c(o.cy+dy)}else if(h=='rx')m.rx=Math.max(.01,Math.min(3,Math.abs(x-m.cx)));else if(h=='ry')m.ry=Math.max(.01,Math.min(3,Math.abs(y-m.cy)))}
if(!gmRaf)gmRaf=requestAnimationFrame(()=>{gmRaf=0;refreshG()})});window.addEventListener('pointerup',gmUp);window.addEventListener('pointercancel',gmUp);
WBX.wbGrade={get:()=>JSON.parse(JSON.stringify(grd)),set:o=>{grd=gFix(o);if(gmSel>=grd.masks.length)gmSel=grd.masks.length-1;gdSave();gradeSync();applyGrade()},
sync:()=>gradeSync(),defs:ov=>gDefs(!!ov),stF,layF,refresh:()=>{refreshG();const k=vw()+'|'+WBS.cur+'|'+gmSel;if(gmCur()||k!==gdLast){gdLast=k;gradeSync()}},edH:()=>edH()};
gradeSync();applyGrade();
}
export {init31};
