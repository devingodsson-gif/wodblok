import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {CH,CM,col,CW,geom,SH,shOf,shp,stNm,SW,useT} from './04-canvas-and-stamp-outlines.js';
import {inkOf,pal,store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {eT,upd} from './11-pressure-flooding-block-edges.js';
import {ser} from './14-presets-and-layer-grid-ui.js';
import {fpGridDraw,fpGrp,fpL,fpPick,fpPoolOk,fpRange,fpSnapS,fpTog,fpU} from './24-free-place-layers.js';
import {fx1,tbG,tbSty,txbSync,txtGl} from './26-text-boxes.js';
import {fxGr,fxJit,fxPad,fxTex} from './69-effect-stack.js';

// ===== Art layers: imported images and saved WODBLOK projects, placed by hand like Free place stamps =====
// ARTS[id] = {n name, k 'img'|'proj', src data URL, w, h, and for projects pid (source project) + ver (when it was last saved)}.
// Pictures: any layer may hold them, in L.pl = [{u, a: art id, x, y, s: long side (canvas units), r: degrees, f: 1 | -1}].
const artOk=s=>typeof s=='string'&&s.length<14e6&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]*$/.test(s);
const artId=()=>'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
function artBU(A){if(A.bu)return A.bu;try{const s=A.src,i=s.indexOf(','),bin=atob(s.slice(i+1)),u=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)u[j]=bin.charCodeAt(j);A.bu=URL.createObjectURL(new Blob([u],{type:s.slice(5,s.indexOf(';'))}))}catch(e){A.bu=A.src}return A.bu}
function artUsed(){const o={},add=p=>{const A=p.a&&WBS.ARTS[p.a];if(A&&!o[p.a])o[p.a]={n:A.n,k:A.k,src:A.src,w:A.w,h:A.h,...(A.pid?{pid:A.pid,ver:A.ver||0}:{})}};WBS.layers.forEach(L=>{(L.pl||[]).forEach(add)});WBS.tiles.forEach(t=>{(t.el||[]).forEach(add)});return o}
// is a picture used by an element, a pattern's source or a stamp's contents
function artRefd(id){return WBS.layers.some(l=>(l.pl||[]).some(p=>p.a==id))||WBS.tiles.some(t=>(t.el||[]).some(p=>p.a==id))}
function artLoad(o){const r={};Object.entries(o||{}).forEach(([id,A])=>{if(!A||!artOk(A.src)||!(+A.w>0)||!(+A.h>0))return;r[String(id).replace(/[^\w-]/g,'').slice(0,24)]={n:String(A.n||'Art').replace(/["<>&|]/g,'').slice(0,40),k:A.k=='proj'?'proj':'img',src:A.src,w:+A.w,h:+A.h,...(A.k=='proj'&&A.pid?{pid:String(A.pid).slice(0,40),ver:+A.ver||0}:{})}});return r}
const artEnc=c=>{const w=c.toDataURL('image/webp',.88);return w.startsWith('data:image/webp')?w:c.toDataURL('image/png')};
// A flat picture of this project as it is now (transparent outside a shaped canvas). It is saved with the project so other projects can use it as art.
function artSnap(){return new Promise(res=>{try{const k=1400/Math.max(CW,CH),w=Math.max(1,Math.round(CW*k)),h=Math.max(1,Math.round(CH*k)),img=new Image(),to=setTimeout(()=>res(null),8000);img.onload=()=>{try{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);clearTimeout(to);res({src:artEnc(c),w,h})}catch(e){res(null)}};img.onerror=()=>res(null);img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ser())}catch(e){res(null)}})}
function fpWH(p){if(p.k=='motif'||p.k=='shape'){const s=+p.s||100;return[s*(p.wx||1),s*(p.wy||1)]}if(p.tx){const k=p.s/Math.max(p.n||1,.01);return[(+p.bw||1)*k,(+p.bh||1)*k]}const tt=WBS.tiles.find(t=>t.id==p.t);if(!tt)return null;const G=geom(shOf(tt)),k=p.s/Math.max(G.SW,G.SH);return[G.SW*k*(p.wx||1),G.SH*k*(p.wy||1)]}
// selection outline and the ghost of the stamp you're about to place
// The selection box (2.15.0): a one-pixel line in the accent, square handles and a round rotate handle in the panel colours, every size in screen pixels at any zoom.
// Colours and line come from the style tokens in the page CSS (#fpov .sel, .gh, .fhd, .frt, .frl); nothing here sets a colour.
function fpUnit(){const a=$('art'),r=a&&a.getBoundingClientRect(),vb=a&&a.viewBox&&a.viewBox.baseVal;return r&&r.width>0&&vb&&vb.width>0?vb.width/r.width:Math.max(CW,CH)/800}
function fpBox(p,cls){const wh=fpWH(p);if(!wh)return'';const w=wh[0],h=wh[1];
return`<rect class="${cls}" transform="translate(${(+p.x).toFixed(1)} ${(+p.y).toFixed(1)}) rotate(${+p.r||0})" x="${(-w/2).toFixed(2)}" y="${(-h/2).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}"/>`}
// a side handle is left out while its side is too short to keep it clear of the corner handles (2.27.0)
function fpHandles(p){const wh=fpWH(p);if(!wh)return'';const w=wh[0],h=wh[1],u=fpUnit(),hs=4.5*u,arm=20*u,f=v=>v.toFixed(2),r=+p.r||0;
let o=`<g transform="translate(${f(+p.x)} ${f(+p.y)}) rotate(${r})"><line class="frl" x1="0" y1="${f(-h/2)}" x2="0" y2="${f(-h/2-arm)}"/><circle class="frt" data-fh="rot" cx="0" cy="${f(-h/2-arm)}" r="${f(hs)}" style="cursor:grab"><title>Rotate</title></circle>`;
[[-1,-1,'nw'],[1,-1,'ne'],[1,1,'se'],[-1,1,'sw'],[0,-1,'n'],[0,1,'s'],[1,0,'e'],[-1,0,'w']].forEach(([cx,cy,nm])=>{if(nm.length==1&&(cy?w:h)<hs*5)return;const a=(((Math.atan2(cy*h,cx*w)*180/Math.PI+r)%180)+180)%180,cu=a<22.5||a>=157.5?'ew-resize':a<67.5?'nwse-resize':a<112.5?'ns-resize':'nesw-resize';
o+=`<rect class="fhd" data-fh="${nm}" x="${f(cx*w/2-hs)}" y="${f(cy*h/2-hs)}" width="${f(hs*2)}" height="${f(hs*2)}" style="cursor:${cu}"><title>Resize</title></rect>`});
return o+'</g>'}
// the rubber-band box of a drag on empty canvas (2.27.0)
function fpMqSvg(){const m=WBS.fpMq;return`<rect class="fpmq" x="${Math.min(m.x0,m.x1).toFixed(1)}" y="${Math.min(m.y0,m.y1).toFixed(1)}" width="${Math.abs(m.x1-m.x0).toFixed(1)}" height="${Math.abs(m.y1-m.y0).toFixed(1)}"/>`}
function fpOverlay(){const ov=$('fpov');if(!ov)return;const L=fpL();fpGridDraw();if(window.pgSync)pgSync();$('art').classList.toggle('fpm',!!(L&&(L.free||WBS.fpB||WBS.txArm||WBS.plArm||(L.pl||[]).length)));$('art').classList.toggle('brush',!!(L&&(WBS.fpB||WBS.txArm||WBS.plArm)));if(!L||$('boardP').classList.contains('off')){ov.innerHTML='';return}let h=WBX.wbPatArrows?WBX.wbPatArrows(L):'';const gr0=fpGrp();if(gr0.length>1)gr0.forEach(q=>{h+=fpBox(q,'sel')});else{const p=(L.pl||[]).find(q=>q.u==WBS.fpSel);if(p)h+=fpBox(p,'sel')+fpHandles(p)}
if(WBS.fpB&&WBS.fpGhost){const tt=WBS.tiles.find(t=>t.id==WBS.fpB);if(tt){const G=geom(shOf(tt)),gs=fpSnapS(L,fpSz(),{altKey:WBS.fpAlt}),k=gs/Math.max(G.SW,G.SH);h+=`<g opacity=".6" transform="translate(${WBS.fpGhost[0].toFixed(1)} ${WBS.fpGhost[1].toFixed(1)}) rotate(${fpRot}) scale(${(k*fpFlip).toFixed(4)} ${k.toFixed(4)}) translate(${-G.SW/2} ${-G.SH/2})"><use href="#s${tt.id}"/>${eT(tt)?`<use href="#e${tt.id}_0" fill="${inkOf(tt)}"/>`:''}</g>`+fpBox({t:tt.id,x:WBS.fpGhost[0],y:WBS.fpGhost[1],s:gs,r:fpRot},'gh')}}if(WBS.plArm&&WBS.fpGhost){const a=WBS.plArm;h+=fpBox({k:'shape',s:a.s||Math.min(CW,CH)*.4,wy:a.wy||1,x:WBS.fpGhost[0],y:WBS.fpGhost[1],r:0},'gh')}if(WBS.txArm&&tbG&&WBS.fpGhost){const fl=tbSty.ink&&CM[tbSty.ink]?col(tbSty.ink):L.ink&&CM[L.ink]?col(L.ink):col(WBS.proj.ink);h+=`<g opacity=".6" transform="translate(${WBS.fpGhost[0].toFixed(1)} ${WBS.fpGhost[1].toFixed(1)})">${txtGl(tbG,fl,'tgh')}</g>`;const gn=Math.max(tbG.bw,tbG.bh,.01);h+=fpBox({tx:1,bw:tbG.bw,bh:tbG.bh,n:gn,s:gn,x:WBS.fpGhost[0],y:WBS.fpGhost[1],r:0},tbG.over?'gh ov':'gh')}if(WBS.fpMq&&WBS.fpMq.on)h+=fpMqSvg();ov.innerHTML=h}let fpRot=0,fpFlip=1;const fpSz=()=>WBS.fpLast||Math.round(Math.min(CW,CH)*(typeof WBS.fpB=='string'?.5:.2));
// (the Background, {bgd:1}, is never hit by a click on the canvas: it is picked from the element list)
// topmost placed stamp whose outline box contains the point (works even when other layers print on top)
// hidden (2.24.0): an element switched off, or inside a group that is, takes no clicks
const fpHid=(pl,p)=>{let q=p,n=0;while(q&&n++<16){if(q.v===false)return true;const g=q.g;q=g?pl.find(z=>z.k=='group'&&z.u==g):null}return false};
const fpHit=(L,x,y)=>{const pl=L.pl||[];for(let i=pl.length-1;i>=0;i--){const p=pl[i],wh=fpWH(p);if(!wh||p.bgd||fpHid(pl,p))continue;const a=-(+p.r||0)*Math.PI/180,dx=x-p.x,dy=y-p.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(lx)<=wh[0]/2&&Math.abs(ly)<=wh[1]/2)return p}return null};
const fpPt=e=>{const a=$('art'),pt=a.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const q=pt.matrixTransform(a.getScreenCTM().inverse());return[q.x,q.y]};
// --- panel
function fpSync(){const L=fpL();if(!L||!$('lfree'))return;txbSync(L);const[pa]=pal(),ky=WBS.tiles.map(t=>t.id+JSON.stringify(t.items.length)+JSON.stringify(shOf(t))).join('|')+pa;
if($('lfpst').dataset.k!=ky){WBS.fpTh={};$('lfpst').innerHTML=WBS.tiles.map((t,i)=>{useT(t);const sv=`<svg viewBox="0 0 ${SW} ${SH}"><path d="${shp(0)}" fill="${pa}"/><use href="#s${t.id}"/></svg>`;WBS.fpTh[t.id]=sv;return`<button type="button" data-t="${t.id}" title="${stNm(t)}" aria-label="${stNm(t)}">${sv}</button>`}).join('');useT(WBS.tiles[WBS.cur]);$('lfpst').dataset.k=ky}
document.querySelectorAll('#lfpst [data-t]').forEach(b=>b.classList.toggle('on',+b.dataset.t==WBS.fpB||(fpPoolOk()&&WBS.fpPool.has(b.dataset.t))));
const n=(L.pl||[]).length,p=(L.pl||[]).find(q=>q.u==WBS.fpSel);if(WBX.alSync)WBX.alSync();$('lfpsel').hidden=!(p||WBS.fpB);['lfpdu','lfpup','lfpdn','lfpdl'].forEach(id=>{if($(id))$(id).hidden=!p});
if(p||WBS.fpB){const S0=Math.min(CW,CH),sv=(id,v)=>{const el=$(id);if(+el.value!=v){el.value=v;WBS.fpSyncing=1;try{el.dispatchEvent(new Event('input',{bubbles:true}))}finally{WBS.fpSyncing=0}}};sv('lfps',Math.round((p?p.s:fpSz())/S0*100));sv('lfpr',Math.round(p?(+p.r||0):fpRot));$('lfpxy').hidden=!p;if(p){sv('lfpx',+(p.x/CW*100).toFixed(1));sv('lfpy',+(p.y/CH*100).toFixed(1))}}if(WBX.wbElSync)WBX.wbElSync()}
function init25(){WBH.fpOverlay=fpOverlay;WBH.fpSync=fpSync;
WBS.fpLast=null;
{const ch=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()},cur2=()=>{const L=fpL();return L&&(L.pl||[]).find(q=>q.u==WBS.fpSel)};
$('lfpst').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;const id=+b.dataset.t;if(e.shiftKey||e.ctrlKey||e.metaKey){fpPick(String(id),e,[...$('lfpst').querySelectorAll('[data-t]')].map(x=>x.dataset.t),false);return}WBS.fpPool=new Set();WBS.fpPA=String(id);WBS.fpB=WBS.fpB==id&&!fpPoolOk()?null:id;if(WBS.fpB){WBS.fpSel=-1;WBS.fpMS=new Set()}upd()};
$('lfps').addEventListener('input',()=>{if(WBS.fpSyncing)return;const p=cur2();if(!p){if(WBS.fpB){WBS.fpLast=+($('lfps').value/100*Math.min(CW,CH)).toFixed(2);WBH.fpOverlay()}return}const v=+$('lfps').value/100*Math.min(CW,CH);if(Math.abs(v-p.s)<.01)return;const k=v/p.s,S0=Math.min(CW,CH);fpGrp().forEach(q=>{if(q!==p)q.s=+Math.max(S0*.02,Math.min(S0*3,q.s*k)).toFixed(2)});p.s=+v.toFixed(2);WBS.fpLast=p.s;store();upd()});
$('lfpr').addEventListener('input',()=>{if(WBS.fpSyncing)return;const p=cur2();if(!p){if(WBS.fpB){fpRot=Math.round(+$('lfpr').value);WBH.fpOverlay()}return}const v=+$('lfpr').value;if(v==p.r)return;const d=v-(+p.r||0);fpGrp().forEach(q=>{if(q!==p){let r=Math.round((+q.r||0)+d);r=((r+180)%360+360)%360-180;q.r=r}});p.r=v;store();upd()});
['lfpx','lfpy'].forEach((id,ax)=>$(id).addEventListener('input',()=>{if(WBS.fpSyncing)return;const p=cur2();if(!p)return;const k=ax?'y':'x',W=ax?CH:CW,v=+$(id).value/100*W,d=v-p[k];if(Math.abs(d)<.01)return;fpGrp().forEach(q=>{q[k]=+(q[k]+d).toFixed(1)});store();upd()}));
['lfps','lfpr','lfpx','lfpy'].forEach(id=>$(id).addEventListener('change',()=>{if(WBX.wbCap)WBX.wbCap()}));
$('lfpfl').onclick=()=>{const p=cur2();if(p){fpGrp().forEach(q=>{q.f=(q.f||1)*-1});ch()}else if(WBS.fpB){fpFlip*=-1;WBH.fpOverlay()}};
$('lfpdu').onclick=()=>{const L=fpL(),p=cur2();if(!p)return;const d=Math.min(CW,CH)*.04,g=fpGrp(),ns=[];g.forEach(o=>{const q={...o,u:fpU(),x:o.x+d,y:o.y+d};L.pl.push(q);ns.push(q);if(o===p)WBS.fpSel=q.u});WBS.fpMS=ns.length>1?new Set(ns.map(q=>String(q.u))):new Set();ch()};
$('lfpup').onclick=()=>{const L=fpL(),p=cur2();if(!p)return;const g=fpGrp();g.forEach(q=>L.pl.splice(L.pl.indexOf(q),1));L.pl.push(...g);ch()};
$('lfpdn').onclick=()=>{const L=fpL(),p=cur2();if(!p)return;const g=fpGrp();g.forEach(q=>L.pl.splice(L.pl.indexOf(q),1));L.pl.unshift(...g);ch()};
$('lfpdl').onclick=()=>{const L=fpL(),p=cur2();if(!p)return;fpGrp().forEach(q=>L.pl.splice(L.pl.indexOf(q),1));WBS.fpSel=-1;WBS.fpMS=new Set();ch()};}
}
export {fpUnit,artRefd,artBU,artEnc,artId,artLoad,artOk,artSnap,artUsed,fpBox,fpFlip,fpHandles,fpHit,fpPt,fpRot,fpSz,fpWH,init25};
