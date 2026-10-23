import {kv} from '../platform/index.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,SH,SW,col,tileExt,tileOn} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {hx} from './10-layer-grids.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {LY} from './14-presets-and-layer-grid-ui.js';
import {savePr} from './15-print-effects-and-stamp-texture.js';
import {TXF,TXMD,TXMN,TXN,isOf,txClean,txFilt,txImgs,txIsO,txIsW,txKey,txLib,txMake,txPix,txRid,txSame,txSpecs,txUid,txUniq} from './16-texture-generators.js';
import {pmsg} from './18-projects-and-cover-overlay.js';

// ---- where each target gets its pictures ----
// stamps: a wear mask (is<id>) and an overlay group; both kept in SURFC and only rebuilt when the stamp's textures change
const SURFC={};
function inkSurfF(t,q){const w=txImgs(q,SW,SH,512,'inline',txIsW);return`<mask id="is${t.id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}"><rect width="${SW}" height="${SH}" fill="#fff"/>${w}</mask>`}
function surfFor(t){const q=isOf(t);if(!q){delete SURFC[t.id];return''}const k=q.map(txKey).join(';')+'|'+SW+'|'+SH;let c=SURFC[t.id];if(!c||c.k!==k){const o=txImgs(q,SW,SH,512,'inline',txIsO);c=SURFC[t.id]={k,o:!!o,s:inkSurfF(t,q)+(o?`<g id="txo${t.id}">${o}</g>`:'')}}return c.s}
// the overlay, clipped to the stamp's ink by the stamp's own mask (mid)
const txoG=(t,mid)=>{const c=SURFC[t.id];return c&&c.o?`<g class="txo"${WBS.edInk?'':' display="none"'} mask="url(#${mid})"><use href="#txo${t.id}"/></g>`:''};
// a whole layer: wear = one mask over the canvas, relief / stain = a filter on the layer
// Repeat tile: a picture that covers the tile is repeated one tile over in every direction (used by masks, which must reach past the edges)
const tileCopies=(v,id)=>{let o=`<g id="${id}">${v}</g>`;for(const dx of[-1,0,1])for(const dy of[-1,0,1])if(dx||dy)o+=`<use href="#${id}" x="${dx*CW}" y="${dy*CH}"/>`;return o};
function layTexMask(L,li){const q=txSpecs(L.tu,'wear');if(!q.length||!WBS.edInk)return'';const tl=tileOn(),v=txImgs(q,CW,CH,800,'host',txIsW,0,0,tl);if(!v)return'';
return tl?`<mask id="lt${li}" maskUnits="userSpaceOnUse" x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}"><rect x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}" fill="#fff"/>${tileCopies(v,'ltc'+li)}</mask>`:`<mask id="lt${li}" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" fill="#fff"/>${v}</mask>`}
function layTexOv(L){const q=txSpecs(L.tu,'wear');if(!q.length||!WBS.edInk)return['',''];const f=txFilt(q,0,0,CW,CH,800,tileOn()?tileExt():undefined);return f?[`<g filter="url(#${f})">`,'</g>']:['','']}
function txRefs(){const m=new Map(),add=u=>(Array.isArray(u)?u:[]).forEach(z=>{if(z&&z.x)m.set(z.x,(m.get(z.x)||0)+1)});WBS.tiles.forEach(t=>add(t.tu));WBS.layers.forEach(L=>{add(L.tu);(L.pl||[]).forEach(p=>{add(p.tu);add(p.fx)})});if(WBS.tex&&Array.isArray(WBS.tex.u))add(WBS.tex.u);if(WBX.wbTxUses)add(WBX.wbTxUses());return m}
// Older projects kept their texture in other places (per-stamp "is", the single canvas surface). They become library textures here.
// Returns true when the canvas texture changed and has to be rebuilt.
let TEXK='';
function texNorm(){if(!Array.isArray(WBS.texLib))WBS.texLib=[];let ch=0;
WBS.tiles.forEach(t=>{if(!Array.isArray(t.tu)){t.tu=[];ch=1}});
if(WBS.tex&&WBS.tex.v!==87){WBS.tex.u=[];WBS.tex.v=87;ch=1}
if(WBS.tex&&!Array.isArray(WBS.tex.u)){WBS.tex.u=[];ch=1}
if(WBS.tex&&WBS.tex.v===87){WBS.tex.u=WBS.tex.u.filter(u=>u&&typeof u=='object'&&txLib(u.x)).slice(0,4).map(u=>({x:u.x,sd:((+u.sd||1)|0)||1,md:TXMD.includes(u.md)?u.md:'relief'}));WBS.tex.t=WBS.tex.u.length?'1':''}
WBS.texLib.forEach(L=>{if(L._k!==undefined){delete L._k;ch=1}});
if(ch||WBS.texLib.some(x=>x.auto)){const r=txRefs();WBS.texLib=WBS.texLib.filter(x=>!x.auto||r.get(x.id))}
return txCvKey()!==TEXK}
// the canvas texture the drawing uses: none while the project's switch (Canvas panel, Texture group; tex.off) is off (2.26.0)
const txCvU=()=>WBS.tex&&!WBS.tex.off&&Array.isArray(WBS.tex.u)?WBS.tex.u:[];
const txCvKey=()=>{const q=txSpecs(txCvU(),'relief');return q.map(txKey).join(';')+'|'+CW+'|'+CH};
// stamps saved to the stamp library carry the textures they use, so they look the same in another project
function txPack(t){return(Array.isArray(t.tu)?t.tu:[]).map(u=>txLib(u&&u.x)).filter((x,i,a)=>x&&a.indexOf(x)===i).map(x=>({...x}))}
function txMerge(t){const pk=txClean(t.txl);delete t.txl;if(!pk.length||!Array.isArray(t.tu))return;const map={};
pk.forEach(p=>{const same=txLib(p.id);if(same&&txSame(same,p)){map[p.id]=p.id;return}const eq=WBS.texLib.find(x=>txSame(x,p));if(eq){map[p.id]=eq.id;return}const n={...p,id:same?txUid():p.id,name:txUniq(p.name),auto:false};WBS.texLib.push(n);map[p.id]=n.id});
t.tu=t.tu.map(u=>({...u,x:map[u.x]||u.x}))}
// projects made before this: the one canvas-wide surface is handed to every stamp (each with its own variation), then retired
function roughFilter(){
const E=WBS.pr.e,Q=WBS.pr.q,A=WBS.pr.a/100,k=100/Math.max(25,WBS.pr.sc),f=v=>+(v*k).toFixed(5),S=WBS.pr.sd;
if(!E&&!Q)return'';
const tl=tileOn(),nz=(id,type,bf,oc,sd)=>tl?`<feTurbulence type="${type}" baseFrequency="${bf}" numOctaves="${oc}" seed="${sd}" stitchTiles="stitch" x="0" y="0" width="${CW}" height="${CH}" result="${id}0"/><feTile in="${id}0" result="${id}"/>`:`<feTurbulence type="${type}" baseFrequency="${bf}" numOctaves="${oc}" seed="${sd}" result="${id}"/>`;
const th=(src,id,sl,ic)=>`<feComponentTransfer in="${src}" result="${id}"><feFuncA type="linear" slope="${sl}" intercept="${(+ic).toFixed(3)}"/></feComponentTransfer>`;
const mix=(a,b,ka,kb,id)=>`<feComposite in="${a}" in2="${b}" operator="arithmetic" k1="0" k2="${ka}" k3="${kb}" k4="0" result="${id}"/>`;
let b='',cur='SourceGraphic';
if(E){b+=nz('en','fractalNoise',.045,2,S)+`<feDisplacementMap in="SourceGraphic" in2="en" scale="${(E*1.1).toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="${(.5+E*.07).toFixed(2)}" result="bl"/>`+th('bl','th',7,-3)+th('d','ds',20,0)+`<feComposite in="th" in2="ds" operator="out" result="sp"/><feComposite in="d" in2="th" operator="in" result="di"/><feMerge result="r1"><feMergeNode in="sp"/><feMergeNode in="di"/></feMerge>`;cur='r1'}
if(Q){const r=(.8+Q*.22).toFixed(2),dk=(1-Q*.04).toFixed(3),lt=(1-Q*.035).toFixed(3);
b+=`<feColorMatrix in="${cur}" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${lt} 0" result="qc"/><feColorMatrix in="${cur}" type="matrix" values="${dk} 0 0 0 0 0 ${dk} 0 0 0 0 0 ${dk} 0 0 0 0 0 1 0" result="qd"/><feMorphology in="${cur}" operator="erode" radius="${r}" result="qe"/><feGaussianBlur in="qe" stdDeviation="${(r*.6).toFixed(2)}" result="qb"/><feComposite in="qd" in2="qb" operator="out" result="qr"/><feMerge result="r2"><feMergeNode in="qc"/><feMergeNode in="qr"/></feMerge>`;cur='r2'}

if(tl){const[ex,ey]=tileExt();return`<filter id="rf" filterUnits="userSpaceOnUse" x="${-ex}" y="${-ey}" width="${CW+2*ex}" height="${CH+2*ey}" color-interpolation-filters="sRGB">${b}</filter>`}
return`<filter id="rf" filterUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}" color-interpolation-filters="sRGB">${b}</filter>`}
function syncPr(){$('rgh').value=WBS.pr.e;$('psq').value=WBS.pr.q;}
const saveTex=()=>{try{kv.set('wb10_tex',JSON.stringify(WBS.tex))}catch(e){}};
function buildTex(noPat,pv){let o='';try{o=txImgs(txSpecs(txCvU(),'relief').map(S=>pv&&S.x===pv&&txIsO(S)?{...S,a:100,op:(S.a/100).toFixed(3)}:S),CW,CH,900,'inline',txIsO,0,0,tileOn());if(o&&tileOn()&&WBS.tilePv)o=tileCopies(o,'txgc')}catch(e){o=''}
TEXK=txCvKey();txSw();$('texg').innerHTML=o?`<g pointer-events="none">${o}</g>`:'';if(pv)$('texg').dataset.pv=pv;else delete $('texg').dataset.pv;if(typeof upd=='function'&&WBX.wbTexReady&&!noPat)upd()}
// the mask used on the ink so it skips the worn spots of the canvas texture (inl: pictures inside the markup, for a stand-alone file)
function inkCatch(inl){const q=txSpecs(txCvU(),'relief').filter(txIsW);if(!q.length)return null;const tl=tileOn(),v=txImgs(q,CW,CH,900,inl?'inline':'host',txIsW,0,0,tl);
if(!v)return null;return tl?{defs:`<mask id="cw" maskUnits="userSpaceOnUse" x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}"><rect x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}" fill="#fff"/>${tileCopies(v,'cwc')}</mask>`}:{defs:`<mask id="cw" maskUnits="userSpaceOnUse" x="0" y="0" width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" fill="#fff"/>${v}</mask>`}}
function syncTex(){texNorm()}
// the Texture group of the Canvas panel: shown when the project has a canvas texture, with the switch for it
function txSw(){const g=$('ctxg'),c=$('ctxon');if(!g||!c)return;const has=!!(WBS.tex&&Array.isArray(WBS.tex.u)&&WBS.tex.u.length);if(g.hidden===has)g.hidden=!has;const on=!(WBS.tex&&WBS.tex.off);if(c.checked!==on)c.checked=on}
function init17(){WBH.syncPr=syncPr;WBH.syncTex=syncTex;WBS.SURFK='';
[['rgh','e'],['psq','q']].forEach(([id,key])=>$(id).oninput=()=>{WBS.pr[key]=+$(id).value;WBH.syncPr();savePr();upd()});

WBH.syncPr();
// ---- Canvas texture. Its uses live in tex.u: relief / stain become pictures laid over the canvas, wear knocks ink out of every layer ----
WBS.tex={};
try{const q=JSON.parse(kv.get('wb10_tex')||'null');if(q&&typeof q=='object')WBS.tex=q}catch(e){}
{const c=$('ctxon');if(c)c.onchange=()=>{if(!WBS.tex)return;if(c.checked)delete WBS.tex.off;else WBS.tex.off=1;saveTex();upd();if(WBX.wbCap)WBX.wbCap()}}
WBH.syncTex();buildTex();WBX.wbTexReady=1;
}
export {SURFC,buildTex,inkCatch,layTexMask,layTexOv,roughFilter,saveTex,surfFor,texNorm,txMerge,txPack,txoG,init17};
