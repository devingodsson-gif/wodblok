import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,SH,SW} from './04-canvas-and-stamp-outlines.js';
import {mk,store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {hx} from './10-layer-grids.js';
import {artBU,artRefd} from './25-art-layers.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elSel} from './65-element-core.js';
import {stUnlocked} from './63-stamp-tool.js';
import {patCur,patSync} from './67-pattern-element.js';
import {abInsert} from './73-add-bar.js';
import {basicKey} from './76-basic-shapes.js';

// ===== The look of a motif (2.31.0, owner Oct 23 2026: the Shape element is gone and motifs took over what it did). Three groups set it:
// Width and height (a pattern's motif source only: a motif on the canvas or in a stamp has them in its Edit group), Fill (Colour, None, or an Image in its place:
// Cover or Fit, Zoom) and Outline (on or off, Thickness, Colour). They work on what is picked:
//  - a motif source of the selected Pattern (a click on it in the Sources list): the groups then sit under the Pattern's sources and every placement takes the look;
//  - the selected motifs of the stamp open in its tab;
//  - the selected Motif element on the canvas.
// The same fields everywhere (fl, a, iz, im, sw, sk; ink on an element or a source, ic on a stamp's motif, which its Colour sets). One set of controls, so one set of ids: the groups move, they are not copied.
const MF_G=['mf_s','mf_f','mf_o'];
// what the groups set: {k:'src'|'items'|'el', list}
function mfT(){const q=elSel(),p=patCur();
 if(p&&q&&q.u==p.u&&WBS.patSrc!=null){const s=(p.src||[])[WBS.patSrc];if(s&&s.k=='motif')return{k:'src',list:[s]}}
 if(stUnlocked()!=null){const t=WBS.tiles[WBS.cur];if(!t)return null;const it=[...(WBS.msel||[])].map(i=>t.items[i]).filter(z=>z&&!z.k&&z.m);return it.length?{k:'items',list:it}:null}
 const m=WBX.wbMtSel&&WBX.wbMtSel();return m?{k:'el',list:[m]}:null}
const mfOw=T=>Math.max(1,Math.round(T.k=='items'?Math.min(SW,SH)/80:Math.min(CW,CH)/80));
const mfCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
const mfSet=(el,on)=>{if(el.getAttribute('aria-pressed')!=String(on)){el.setAttribute('aria-pressed',String(on));el.classList.toggle('on',on)}};
const mfVis=(id,v)=>{const e=$(id);if(e&&e.hidden===v)e.hidden=!v};
const mfVal=(id,v)=>{const e=$(id);if(e&&+e.value!==v){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))}};
// the groups go where the thing they set is edited: under a Pattern's sources, else under the Motif panel's Edit group
function mfPlace(T){const at=T&&T.k=='src'?$('pesrc').closest('details.g'):document.querySelector('section.pn[data-p="motifs"] #sel').closest('details.g');if(!at)return;
 let prev=at;MF_G.forEach(id=>{const g=$(id);if(!g)return;if(prev.nextElementSibling!==g)prev.insertAdjacentElement('afterend',g);prev=g})}
// the pictures of this project, as a strip to choose from
function mfStrip(a){const ids=Object.keys(WBS.ARTS),st=$('lfars');if(!st)return;const ky=ids.map(i=>i+':'+WBS.ARTS[i].src.length+(artRefd(i)?'u':'')).join('|')+'#'+a;
 if(st.dataset.k==ky)return;st.dataset.k=ky;st.innerHTML=ids.map(i=>{const A=WBS.ARTS[i];return`<button type="button" data-a="${hx(i)}" class="${a==i?'on':''}" title="${hx(A.n)}"><img src="${artBU(A)}" alt="">${artRefd(i)?'':`<i data-ax="${hx(i)}" title="Remove from this project">&#215;</i>`}</button>`}).join('')}
function mfSync(){if(!$('mf_f'))return;const T=mfT();MF_G.forEach(id=>mfVis(id,!!T&&(id!='mf_s'||T.k=='src')));if(!T)return;mfPlace(T);const p=T.list[0];
 if(T.k=='src'){mfVal('mf_sx',Math.round((+p.wx||1)*100));mfVal('mf_sy',Math.round((+p.wy||1)*100))}
 const fk=p.fl=='none'?'none':p.fl=='img'?'img':'solid';$('mf_fk').querySelectorAll('[data-f]').forEach(b=>mfSet(b,b.dataset.f==fk));mfVis('mf_img',fk=='img');
 if(fk=='img'){mfStrip(p.a);mfVal('mf_iz',Math.round(+p.iz||100));$('mf_im').querySelectorAll('[data-i]').forEach(b=>mfSet(b,(b.dataset.i=='contain')==(p.im=='contain')))}
 const so=+p.sw>0,oc=$('mf_oon');if(oc.checked!==so)oc.checked=so;mfVis('mf_owr',so);mfVis('mf_ocr',so);if(so)mfVal('mf_ow',Math.round(+p.sw));
 if(WBX.wbPaintWells)WBX.wbPaintWells()}
// a picture: the picked motifs take it; with nothing picked it makes a Rectangle motif the shape of the picture, filled with it (Import image, Use a project)
function mfImage(id){const A=WBS.ARTS[id];if(!A)return;const T=mfT();
 if(T){T.list.forEach(q=>{q.fl='img';q.a=id});mfCh();mfSync();return}
 if(!fpL())return;const S=Math.min(CW,CH)*.5,r=A.h/A.w,q=abInsert({u:fpU(),k:'motif',m:basicKey('rect')||'b0',x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:+(r>1?S/r:S).toFixed(1),wy:+r.toFixed(4),r:0,f:1,fl:'img',a:id});
 if(q){mfCh();if(WBX.wbElSeen)WBX.wbElSeen(q.u);if(WBX.wbOpenPanel)WBX.wbOpenPanel('motifs')}}

// ---- a click picks a motif by its outline (2.31.0): a click in a hole, or beside a thin shape inside its box, reaches what is behind. Each motif's shape is drawn once,
// small (128 px over its -60..60 box), and kept; until it is ready the box counts.
const MH=new Map();
function mtShape(m){let e=MH.get(m);if(e)return e;e={a:null};MH.set(m,e);if(MH.size>400){const k=MH.keys().next().value;MH.delete(k)}
 const N=128,svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}" viewBox="-60 -60 120 120"><defs><mask id="m" maskUnits="userSpaceOnUse" x="-60" y="-60" width="120" height="120"><rect x="-60" y="-60" width="120" height="120" fill="#000"/>${mk(m,'#fff','#000')}</mask></defs><rect x="-60" y="-60" width="120" height="120" fill="#000" mask="url(#m)"/></svg>`;
 try{const u=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),i=new Image();i.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(i,0,0);const d=x.getImageData(0,0,N,N).data,a=new Uint8Array(N*N);for(let j=0;j<N*N;j++)a[j]=d[j*4+3];e.a=a}catch(er){}URL.revokeObjectURL(u)};i.onerror=()=>URL.revokeObjectURL(u);i.src=u}catch(er){}
 return e}
// lx, ly: the point in the motif's own frame (middle at 0,0, turned back, canvas units). false: the point misses the motif; true: it is on it; undefined: not known yet
function mtHit(p,lx,ly){const e=mtShape(p.m);if(!e.a)return undefined;const s=Math.max(1,+p.s||100),w=s*(+p.wx||1),h=s*(+p.wy||1),N=128,sw=+p.sw>0?+p.sw:0;
 const on=(x,y)=>{const u=Math.floor(((x*(+p.f||1))/w*100+60)/120*N),v=Math.floor((y/h*100+60)/120*N);return u>=0&&v>=0&&u<N&&v<N&&e.a[v*N+u]>40};
 if(on(lx,ly))return true;if(!sw)return false;for(let k=0;k<8;k++){const t=k*Math.PI/4;if(on(lx+Math.cos(t)*sw,ly+Math.sin(t)*sw))return true}return false}

function init82(){if(!$('mf_f'))return;
 const each=f=>{const T=mfT();if(!T)return null;T.list.forEach(q=>f(q,T));return T};
 $('mf_fk').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;const f=b.dataset.f;each(q=>{if(f=='none')q.fl='none';else if(f=='img'){q.fl='img';if(!WBS.ARTS[q.a]){const k=Object.keys(WBS.ARTS);if(k.length)q.a=k[0];else delete q.a}}else delete q.fl});mfCh();mfSync()};
 $('mf_im').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;each(q=>{if(b.dataset.i=='contain')q.im='contain';else delete q.im});mfCh();mfSync()};
 const sl=(id,f,k)=>{$(id).addEventListener('input',()=>{const v=+$(id).value;each(q=>{const n=k?+(v/100).toFixed(3):v;if(k&&n==1)delete q[f];else q[f]=n});store();upd()});$(id).addEventListener('change',()=>{if(WBX.wbCap)WBX.wbCap()})};
 sl('mf_iz','iz');sl('mf_ow','sw');sl('mf_sx','wx',1);sl('mf_sy','wy',1);
 $('mf_oon').onchange=()=>{const on=$('mf_oon').checked;each((q,T)=>{if(on){if(!(+q.sw>0))q.sw=mfOw(T)}else delete q.sw});mfCh();mfSync()};
 if(WBX.wbMkWell){const pj=()=>WBS.proj,first=()=>{const T=mfT();return T?T.list[0]:null};
  WBX.wbMkWell($('mf_ow2'),{label:'Outline colour',what:'Outline',defRef:()=>{const T=mfT();if(T&&T.k=='items'){const t=WBS.tiles[WBS.cur];return T.list[0].ic||(t&&t.ink)||pj().ink}return pj().ink},get:()=>{const q=first();return q&&q.sk||''},set:v=>{each(q=>{if(v)q.sk=v;else delete q.sk})}});
  WBX.wbMkWell($('mf_cw'),{label:'Motif colour',what:'Motif',defRef:()=>pj().ink,get:()=>{const q=first();return q&&q.ink||''},set:v=>{each(q=>{if(v)q.ink=v;else delete q.ink})}})}
 WBX.wbMfSync=mfSync;WBX.wbMotifImage=mfImage;WBX.wbMtHit=mtHit}
export {init82,mfSync,mtHit};
