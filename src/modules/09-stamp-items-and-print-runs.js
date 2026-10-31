import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {OFFS,ORN,SH,SW,col,okC,useT} from './04-canvas-and-stamp-outlines.js';
import {trayGuard} from './50-tray-core.js';
import {cols,mk,mkL} from './06-motif-library-folders.js';
import {expand,renderSym} from './07-symmetry.js';
import {selFix} from './12-selection-and-split.js';
import {renderML,sync} from './13-preview-and-stamp-tool.js';
import {buildTex,texNorm} from './17-texture-panel-and-previews.js';
import {stTxMode} from './63-stamp-tool.js';
import {mtDraw,mtPic} from './74-motif-element.js';
 // the Stamp texture / Canvas texture view switches: one setting for the pattern
// Split pieces: q.cl is a list of [angle, offset, side] half-planes in the motif's own -50..50 space.
let clipN=0;
// the pattern build numbers its ids from a fixed start, so the same stamps give the same text every time and the hosted outlines are only rewritten when something changed
function clipSeed(n){const o=clipN;clipN=n;return o}
function clipWrap(q,m){if(!q.cl||!q.cl.length)return m;let o=m;for(const[a,d,sd]of q.cl){const r=a*Math.PI/180,u=[Math.cos(r),Math.sin(r)],n=[-u[1]*sd,u[0]*sd],c=[-u[1]*d,u[0]*d],B=400,P=[[c[0]-u[0]*B,c[1]-u[1]*B],[c[0]+u[0]*B,c[1]+u[1]*B],[c[0]+u[0]*B+n[0]*B,c[1]+u[1]*B+n[1]*B],[c[0]-u[0]*B+n[0]*B,c[1]-u[1]*B+n[1]*B]],id='kc'+(clipN++);
o=`<clipPath id="${id}"><path d="M${P.map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join('L')}Z"/></clipPath><g clip-path="url(#${id})">${o}</g>`}return o}
// Thickness: q.w (motif units) grows (+) or thins (-) the whole motif, cut details included.
// The motif is drawn as white ink / black cuts, run through feMorphology, then recoloured to the real ink / cut colours.
const hx3=h=>{h=String(h||'#000').replace('#','');if(h.length==3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16)||0;return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
function thickF(q,mono,c,d){const w=+q.w||0,id='kw'+(clipN++),f=v=>v.toFixed(4),g=w>0,sd=(Math.abs(w)*.5/1.28).toFixed(3),ta=g?.1:.9,tc=(g!=!!q.k)?.1:.9,lin=t=>`type="linear" slope="24" intercept="${f(-24*t)}"`;
let cm='';if(!mono){const[ir,ig,ib]=hx3(c),[br,bg,bb]=hx3(d);cm=`<feColorMatrix type="matrix" values="${f(ir-br)} 0 0 0 ${f(br)} ${f(ig-bg)} 0 0 0 ${f(bg)} ${f(ib-bb)} 0 0 0 ${f(bb)} 0 0 0 1 0"/>`}
return`<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${sd}"/><feComponentTransfer><feFuncR ${lin(tc)}/><feFuncG ${lin(tc)}/><feFuncB ${lin(tc)}/><feFuncA ${lin(ta)}/></feComponentTransfer>${cm}</filter><g filter="url(#${id})">${q.k?mk(q.m,'#000','#fff'):mk(q.m,'#fff','#000')}</g>`}
// knockouts paint their shape in the background colour (that is their job)
function thick(q,c,d){return +q.w?thickF(q,0,c,d):null}
// ordinary motifs are ink only: their carved details are see-through, so motifs behind show through the holes
function solid(q,c,ed){const id='ks'+(clipN++),inner=+q.w?thickF(q,1):mk(q.m,'#fff','#000');
return`<mask id="${id}" maskUnits="userSpaceOnUse" x="-110" y="-110" width="220" height="220">${inner}</mask><rect x="-110" y="-110" width="220" height="220" fill="${c}" mask="url(#${id})" pointer-events="none"/>`+(ed?`<g opacity="0">${mk(q.m,'#000','#000')}</g>`:'')}
// A stamp whose shapes have colours of their own (shape.ic, a colour reference) is printed in runs: neighbouring shapes of the same colour print together,
// in the order they were put down, so a shape of one colour can lie over a shape of another. A knock-out erases what lies under it, in every run before it.
// 2.31.0: a stamp's motif can also have an outline of its own colour (sk; it prints just under the motif, as its own part 'o'+i) and a picture in place of its colour
// (fl 'img': a run of its own that is painted with the picture, img: true). A motif with fill 'none' prints only its outline.
// inkRuns gives [{c: colour ref or '' for the stamp's own ink, img, sel(k): which parts a run's mask holds (k: a shape number, or 'o'+number for its outline)}], or null for a one-colour stamp.
const lookOf=q=>!q.k&&(q.fl=='none'||(q.fl=='img'&&!!q.a)||+q.sw>0);
function inkRuns(t){const a=t.items;if(t.neg||!a.some(q=>q.ic||(!q.k&&(q.fl=='img'&&q.a||+q.sw>0&&q.sk))))return null;const seq=[];
 a.forEach((q,i)=>{if(q.k)return;if(+q.sw>0)seq.push({k:'o'+i,i,c:q.sk||q.ic||''});if(q.fl!='none')seq.push({k:i,i,c:q.fl=='img'&&q.a?'#img'+i:q.ic||''})});
 const runs=[];seq.forEach(x=>{const l=runs[runs.length-1];if(l&&l.c===x.c&&!x.c.startsWith('#img'))l.ks.push(x);else runs.push({c:x.c,ks:[x]})});
 runs.forEach(r=>{const set=new Set(r.ks.map(x=>x.k)),end=Math.max(...r.ks.map(x=>x.i));r.img=r.c.startsWith('#img');if(r.img)r.c='';r.sel=k=>set.has(k)||(typeof k=='number'&&!!a[k].k&&k>end)});return runs}
// cl: {c: ink, d: cut} colours; pic: paint the pictures of the selected motifs (a picture run); sel(k): only these parts (see inkRuns)
function items(t,cl,ed,e,sel){let o='';expand(t).forEach(([q,i,c])=>{const lk=lookOf(q),pb=!sel||sel(i),po=lk&&+q.sw>0&&(!sel||sel('o'+i));if(cl.pic?!(lk&&q.fl=='img'&&pb):!(pb||po))return;
const SX=q.sx||1,SY=q.sy||1,r=70*q.s*Math.max(SX,SY)+(+q.sw||0),own=ed&&q.ic&&!t.neg&&!q.k?col(q.ic):cl.c,m0=lk?null:q.k?mk(q.m,cl.d,cl.c):mk(q.m,own,cl.d);
for(const[dx,dy]of(t.wr===false?[[0,0]]:OFFS)){const x=q.x+dx,y=q.y+dy;if(x+r<-e||x-r>SW+e||y+r<-e||y-r>SH+e)continue;
if(lk){const w=100*q.s*SX,h=100*q.s*SY,id='kl'+(clipN++),pic=pb&&q.fl=='img'?(cl.pic||ed?mtPic(q):null):null,
  D=mtDraw(q.m,{w,h,fill:cl.pic||!pb||q.fl=='none'?'':pic?'':own,pic,sw:po&&!cl.pic?+q.sw:0,sk:ed&&q.sk?col(q.sk):own,inner:+q.w?thickF(q,1):null},id,true,'msi_');
 let m=D.defs+D.body;if(q.cl&&q.cl.length){const kx=(w/100).toFixed(4),ky=(h/100).toFixed(4);m=`<g transform="scale(${kx} ${ky})">${clipWrap(q,`<g transform="scale(${(100/w).toFixed(5)} ${(100/h).toFixed(5)})">${m}</g>`)}</g>`}
 o+=`<g${ed?` data-i="${i}" data-c="${c}"`:''} transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${q.r}) scale(${q.f||1} 1)">${m}${ed?`<g opacity="0" transform="scale(${(w/100).toFixed(4)} ${(h/100).toFixed(4)})">${mk(q.m,'#000','#000')}</g>`:''}</g>`;continue}
const m=clipWrap(q,q.k?(thick(q,cl.c,cl.d)||m0):solid(q,own,ed));
o+=`<g${ed?` data-i="${i}" data-c="${c}"`:''} transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${q.r}) scale(${+(q.s*q.f*SX).toFixed(4)} ${+(q.s*SY).toFixed(4)})">${m}</g>`}});return o}
function draw(){if(texNorm())buildTex();useT(WBS.tiles[WBS.cur]);if(!WBS.layers.length)WBS.layers=[mkL('Layer 1',WBS.tiles.map(t=>t.id),'check',180)];if(WBS.selL<0||WBS.selL>=WBS.layers.length)WBS.selL=WBS.layers.length-1;trayGuard();WBS.tiles.forEach(t=>{if(t.ink&&!okC(t.ink))delete t.ink});sync();const t=WBS.tiles[WBS.cur]||WBS.noTile,cl=cols(t);selFix();const q=t.items[WBS.sel];
if(WBS.split&&(WBS.split.i!=WBS.sel||!stTxMode()||!q))WBS.split=null;$('spbar').hidden=!WBS.split;
renderSym(t);
const bA=!q&&stTxMode()&&WBS.brush&&!WBS.brush.txt&&WBS.brush.m?WBS.brush:null;   // 2.79.1: a shape on the cursor in a stamp's tab: Size and Rotate are its own before it is placed
$('sel').classList.toggle('none',!(q||bA)||!stTxMode());{const n=WBS.msel.size;$('msc').hidden=n<2;$('msc').textContent=n+' selected';$('ssp').disabled=n>1;$('sdl').title=n>1?`Delete ${n} shapes (Del)`:'Delete (Del)';$('scp').title=n>1?`Duplicate ${n} shapes (Ctrl+D)`:'Duplicate (Ctrl+D)'}if(q){$('ssz').value=q.s*100;$('srt').value=q.r;(WBX.wbRngSet||((r,v)=>r.value=v))($('ssx'),(q.sx||1)*100);(WBX.wbRngSet||((r,v)=>r.value=v))($('ssy'),(q.sy||1)*100);$('ssr').disabled=(q.sx||1)==1&&(q.sy||1)==1;$('sko').setAttribute('aria-pressed',q.k?'true':'false');$('sth').value=q.w||0}else{$('ssz').value=bA?Math.round((+bA.s||.8)*100):80;$('srt').value=bA?+bA.r||0:0;(WBX.wbRngSet||((r,v)=>r.value=v))($('ssx'),100);(WBX.wbRngSet||((r,v)=>r.value=v))($('ssy'),100);$('sth').value=0;$('ssr').disabled=true;$('sko').setAttribute('aria-pressed','false')}renderML()}
// Pattern presets per stamp shape: [key, label, grid, order, turn]. One setting replaces grid type + stamp order.
const ARR={
rect:[['r-check','Checkerboard','square','check'],['r-rows','Rows','square','rows'],['r-cols','Columns','square','cols'],['r-diag','Diagonal stripes','square','diag'],['r-brick','Brick','brick','rows'],['r-brickc','Brick, checkered','brick','check'],['r-drop','Half-drop','drop','cols'],['r-dropc','Half-drop, checkered','drop','check'],['r-pin','Pinwheel (turned in fours)','square','pin','pin'],['r-rand','Random','square','rand'],['r-randt','Random, turned','square','rand','r90']],
hex:[['h-three','Three-colour honeycomb','honey','three'],['h-check','Alternating honeycomb','honey','check'],['h-rows','Honeycomb rows','honey','rows'],['h-cols','Honeycomb columns','honey','cols'],['h-rand','Random','honey','rand'],['h-randt','Random, turned','honey','rand','r60']],
circle:[['c-three','Packed, three-colour','honey','three'],['c-rows','Packed rows','honey','rows'],['c-check','Square grid, checkered','square','check'],['c-sqrows','Square grid, rows','square','rows'],['c-brick','Offset rows, checkered','brick','check'],['c-rand','Random','honey','rand'],['c-randt','Random, turned','honey','rand','rany']],
diamond:[['d-harl','Harlequin','diamond','rows'],['d-cols','Columns','diamond','cols'],['d-diag','Diagonal stripes','diamond','dgd'],['d-pairs','Checkered pairs','diamond','check'],['d-rand','Random','diamond','rand'],['d-randt','Random, flipped','diamond','rand','r180']],
tri:[['t-ud','Up and down','tri','check'],['t-rows','Rows','tri','rows'],['t-cols','Columns','tri','cols'],['t-diag','Diagonal stripes','tri','diag'],['t-rand','Random','tri','rand']]};
function init09(){WBH.draw=draw;
WBS.edMk=true;WBS.edInk=true;WBS.edTx=true;
ORN.forEach(k=>ARR[k]=ARR.circle);
}
export {ARR,clipSeed,clipWrap,hx3,inkRuns,items,lookOf,init09};
