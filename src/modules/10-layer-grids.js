import {tbSync} from './07-symmetry.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {bkPre,bkShow,bkTile} from './03-stamp-prints-and-drawing.js';
import {CH,col,cOut,CW,hasOut,okC,SH,shBleed,shp,SK,SW,tileOffs,tileOn,tileRk,useT} from './04-canvas-and-stamp-outlines.js';
import {inkOf,luid,pal} from './06-motif-library-folders.js';
import {clipSeed,inkRuns,items} from './09-stamp-items-and-print-runs.js';
import {edgeDefs} from './11-pressure-flooding-block-edges.js';
import {isOf} from './16-texture-generators.js';
import {renderGuides} from './18-projects-and-cover-overlay.js';
import {SURFC,inkCatch,layTexMask,layTexOv,surfFor,txoG} from './17-texture-panel-and-previews.js';
import {renderLib} from './21-motif-library-ui.js';
import {elDraw} from './65-element-core.js';
import {shUnder} from './89-sheet-element.js';
import {stContents} from './68-stamp-contents.js';
import {renderLayers} from './32-layers-panel.js';
import {stOlBegin,stOlEnd,stOlPath} from './63-stamp-tool.js';
// 2.60.1 (artist test: the see-through squares were small on a rectangle and large on every other shape): a shaped canvas draws its squares at 8 screen pixels too, like the
// rectangle's own background, at any zoom (the pattern is scaled by how many canvas units a screen pixel is, and again when the view changes size)
const ckK=()=>{const a=document.getElementById('art');if(!a)return 1;const r=a.getBoundingClientRect(),vb=a.viewBox&&a.viewBox.baseVal;return r.width>0&&vb&&vb.width?vb.width/r.width:1};
let ckRO=null;function ckWatch(){if(ckRO)return;try{let raf=0;ckRO=new ResizeObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const p=document.getElementById('ckp');if(p)p.setAttribute('patternTransform',`scale(${ckK().toFixed(4)})`)})});ckRO.observe(document.getElementById('art'))}catch(e){ckRO=1}}
// ---- Drawing: build() draws every element of the one layer in list order (65-element-core.js). The old grid and arrangement engine is gone (2.2.5).
function migLayers(){const seen=new Set();WBS.layers.forEach(L=>{if(!L.u||seen.has(L.u))L.u=luid();seen.add(L.u)})}
// turning upside down is only allowed for outlines that look the same upside down
const flipVOk=g=>!(g.SK=='tri'||g.SK=='arch'||g.SK=='lancet');
const RB=()=>tileOn()?`x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}"`:`x="0" y="0" width="${CW}" height="${CH}"`,RC=()=>tileOn()?`x="${-CW}" y="${-CH}" width="${3*CW}" height="${3*CH}"`:`width="${CW}" height="${CH}"`;
const bhStrip=x=>x.replace(/ opacity="[^"]*"/g,'');
// the pictures that fill motifs of stamps (2.31.0): defined once, in #stpix, for every print of every stamp
// one run of a stamp printed through its mask: a colour, or (a picture run) the stamp's pictures themselves
function runPaint(t,r,mid,ci,e){return r.img?`<g mask="url(#${mid})">${items(t,{c:'#fff',d:'#000',pic:1},0,e,r.sel)}</g>`:`<rect width="${SW}" height="${SH}" fill="${r.c?col(r.c):ci}" mask="url(#${mid})"/>`}
function stPix(){const e=$('stpix');if(!e)return;const ids=[...new Set(WBS.tiles.flatMap(t=>(t.items||[]).filter(q=>q&&q.fl=='img'&&q.a&&WBS.ARTS[q.a]).map(q=>q.a)))],k=ids.map(a=>a+':'+WBS.ARTS[a].src.length).join('|');if(e.dataset.k===k)return;e.dataset.k=k;
 e.innerHTML=ids.map(a=>{const A=WBS.ARTS[a];return`<image id="msi_${String(a).replace(/[^\w-]/g,'')}" href="${A.src}" x="0" y="0" width="${A.w}" height="${A.h}" preserveAspectRatio="none"/>`}).join('')}
function build(){if(WBX.wbSteFit)WBX.wbSteFit();bkPre();stPix();const _cn=clipSeed(1e7);
const[pa,pb]=pal();
let defs='',lg='',sd='',un='';
WBS.tiles.forEach(t=>{useT(t);surfFor(t);stOlPath(t.id,shp(0));const stc=stContents(t),ci=inkOf(t),sA=`<clipPath id="shc${t.id}"><path d="${shp(0)}"/></clipPath>`,eD=`<!--@E:${t.id}-->`+edgeDefs(t)+'<!--@-->',rn=inkRuns(t),xm=rn?rn.map((r,j)=>`<mask id="m${t.id}r${j}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}">${items(t,{c:'#fff',d:'#000'},0,0,r.sel)}</mask>`).join(''):'';const sB=`<mask id="m${t.id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SW}" height="${SH}">${t.neg?`<rect width="${SW}" height="${SH}" fill="#fff"/>${items(t,{c:'#000',d:'#fff'},0,0)}`:items(t,{c:'#fff',d:'#000'},0,0)}</mask>${xm}${stc.defs}${t.neg?`<g id="s${t.id}">${shBleed(ci)}<g clip-path="url(#shc${t.id})">`:`<g id="s${t.id}" clip-path="url(#shc${t.id})">`}${isOf(t)?`<g mask="url(#is${t.id})">`:''}${rn?rn.map((r,j)=>runPaint(t,r,`m${t.id}r${j}`,ci,0)).join(''):`<rect width="${SW}" height="${SH}" fill="${ci}" mask="url(#m${t.id})"/>`}${txoG(t,'m'+t.id)}${stc.body}${isOf(t)?'</g>':''}${t.neg?'</g></g>':'</g>'}`;defs+=eD;sd+=sA+sB;bkTile(t,sA+eD+sB)});useT(WBS.tiles[WBS.cur]);
stOlBegin();
(WBX.wbSteScene&&WBX.wbSteScene()||WBS.layers).forEach((L,li)=>{if(!L.vis)return;const lgB=lg;(()=>{const ls=WBS.tiles.filter(t=>L.st.includes(t.id)),n=ls.length;const lw=h=>{const lf=WBX.wbGrade?WBX.wbGrade.layF(L.u):'';let o=lf?`<g filter="url(#${lf})">${h}</g>`:h;const tm=layTexMask(L,li);if(tm){defs+=tm;o=`<g mask="url(#lt${li})">${o}</g>`}const ov=layTexOv(L);return ov[0]+o+ov[1]};const addItems=all=>{if(!all&&!(L.pl||[]).length)return;const r=elDraw(L,li,pa,lgB);defs+=r[0];lg+=lw(r[1])};addItems(true)})();
// Behind: this layer only prints where nothing below it has printed. Everything beneath becomes a black cut-out in a mask.
if((L.bl=='cancel'||L.bl=='replace'||(L.bl=='behind'&&!L.free))&&lg.length>lgB.length){const seg=lg.slice(lgB.length).split(' style="mix-blend-mode:behind"').join('').split(' style="mix-blend-mode:cancel"').join('').split(' style="mix-blend-mode:replace"').join('');defs+=`<mask id="bh${li}" maskUnits="userSpaceOnUse" ${RB()}><rect ${RC()} fill="#fff"/><g filter="url(#bhk)">${bhStrip(lgB)}</g></mask>`;if(L.bl=='cancel'||L.bl=='replace'){defs+=`<mask id="cx${li}" maskUnits="userSpaceOnUse" ${RB()}><rect ${RC()} fill="#fff"/><g filter="url(#bhk)">${bhStrip(seg)}</g></mask>`;lg=`<g mask="url(#cx${li})">${lgB}</g><g mask="url(#bh${li})">${seg}</g>`;if(L.bl=='replace'){const rc=col(okC(L.rp)?L.rp:WBS.proj.ink);defs+=`<mask id="rp${li}" maskUnits="userSpaceOnUse" ${RB()}><rect ${RC()} fill="#000"/><g filter="url(#bhw)">${bhStrip(lgB)}</g></mask><filter id="rc${li}" filterUnits="userSpaceOnUse" ${RB()} color-interpolation-filters="sRGB"><feFlood flood-color="${rc}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;lg+=`<g mask="url(#rp${li})"><g filter="url(#rc${li})">${seg}</g></g>`}}else lg=lgB+`<g mask="url(#bh${li})">${seg}</g>`}});
defs+=`<filter id="bhk" filterUnits="userSpaceOnUse" ${RB()} color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/><feComponentTransfer><feFuncA type="linear" slope="4"/></feComponentTransfer></filter><filter id="bhw" filterUnits="userSpaceOnUse" ${RB()} color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/><feComponentTransfer><feFuncA type="linear" slope="4"/></feComponentTransfer></filter>`;
{const U=shUnder();defs+=U.defs;un=U.body?`<g class="bgu">${U.body}</g>`:''}   /* 2.70.1: a solid copy of the Background under the print filter and the canvas Wear mask */
clipSeed(_cn);
renderGuides();
{const pv=tileOn()&&WBS.tilePv&&WBS.tpvImg,a=$('art');a.setAttribute('viewBox',pv?`${-CW} ${-CH} ${3*CW} ${3*CH}`:`0 0 ${CW} ${CH}`);a.classList.toggle('tpvr',!!pv);
 // 2.76.6: the 3 x 3 view's copies sit on the repeat's lattice (grid, brick or half drop), enough of them to fill the view
 let g=$('tpvi');if(!g&&pv){g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='tpvi';a.appendChild(g)}if(g){const h=pv?[[0,0],...tileOffs(2)].filter(([x,y])=>x>-2*CW+1e-6&&x<2*CW-1e-6&&y>-2*CH+1e-6&&y<2*CH-1e-6).map(([x,y])=>`<image href="${WBS.tpvImg}" x="${+x.toFixed(3)}" y="${+y.toFixed(3)}" width="${CW}" height="${CH}" preserveAspectRatio="none"/>`+(tileRk()!='grid'?`<rect class="tpe" x="${+x.toFixed(3)}" y="${+y.toFixed(3)}" width="${CW}" height="${CH}"/>`:'')).join(''):'';if(g.dataset.k!==h.length+'|'+(pv||'')){g.dataset.k=h.length+'|'+(pv||'');g.innerHTML=h}}
 if(WBX.wbTpvDrawn)WBX.wbTpvDrawn()}const ikc=typeof inkCatch=='function'&&!WBS.DRAFT?inkCatch():null;{const sk=WBS.tiles.map(t=>SURFC[t.id]?t.id+'#'+SURFC[t.id].k:'').join(';')+(WBS.edInk?'':'|plain');if(sk!==WBS.SURFK){WBS.SURFK=sk;$('surfd').innerHTML=WBS.tiles.map(t=>SURFC[t.id]?(WBS.edInk?SURFC[t.id].s:`<mask id="is${t.id}" maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000"><rect x="-100000" y="-100000" width="200000" height="200000" fill="#fff"/></mask>`):'').join('')}}bkShow(defs,ikc?ikc.defs:'',lg,L=>`${un}<g${ikc?(WBS.edTx?' mask="url(#cw)"':' data-tki="1"'):''}><g>${L}</g></g>`,sd);$('texg').style.display=WBS.edTx?'':'none';tbSync();
{const ci=hasOut(),O=ci?cOut():null;$('cvdefs').innerHTML=ci?`<clipPath id="cvclip" clipPathUnits="userSpaceOnUse"><path d="${O.d}"/></clipPath>`:'';['dyn','texg'].forEach(id=>ci?$(id).setAttribute('clip-path','url(#cvclip)'):$(id).removeAttribute('clip-path'));$('art').classList.toggle('shp',ci);const sh=$('artsh');sh.style.display=ci?'block':'none';sh.setAttribute('viewBox',`0 0 ${CW} ${CH}`);sh.innerHTML=ci?`<defs><pattern id="ckp" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="scale(${ckK().toFixed(4)})"><rect width="16" height="16" fill="#fff"/><rect width="8" height="8" fill="#dcdcdc"/><rect x="8" y="8" width="8" height="8" fill="#dcdcdc"/></pattern></defs><path d="${O.d}" fill="url(#ckp)"/>`:'';ckWatch();$('art').classList.toggle('cvck',!ci)}
useT(WBS.tiles[WBS.cur]);
if(typeof renderLayers=='function')renderLayers();stOlEnd();
renderLib();WBH.fpSync();WBH.fpOverlay();if(WBX.wbGrade)WBX.wbGrade.refresh();if(WBX.wbTileUi)WBX.wbTileUi()}
const hx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export {bhStrip,build,flipVOk,hx,migLayers,runPaint};
