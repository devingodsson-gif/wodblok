import {kv} from '../platform/index.js';
import {$,WBH,WBS} from './01-launch-and-version.js';
import {CH,CW,OFFS,ORN,SH,SW,col,geom,okC,shOf,shp,useT,wrapP} from './04-canvas-and-stamp-outlines.js';
import {trayGuard} from './50-tray-core.js';
import {cols,inkOf,mk,mkL} from './06-motif-library-folders.js';
import {expand,renderSym,symG,symOf} from './07-symmetry.js';
import {gModel,gNear,gShOk} from './08-grid-shapes.js';
import {lattice} from './10-layer-grids.js';
import {eR,eSeed,eT,edgeDef} from './11-pressure-flooding-block-edges.js';
import {selFix} from './12-selection-and-split.js';
import {renderML,sync} from './13-preview-and-stamp-tool.js';
import {isOf} from './16-texture-generators.js';
import {buildTex,inkCatch,surfFor,texNorm} from './17-texture-panel-and-previews.js';
import {stTxMode} from './63-stamp-tool.js';
 // the Stamp texture / Canvas texture view switches: one setting shared by the Pattern view and the Stamp editor
let grid={on:false,n:6,sp:'c',sd:false,ss:false,op:70,sh:'rect'};const saveGrid=()=>{try{kv.set('wb33_grid',JSON.stringify(grid))}catch(e){}};
const gDim=()=>{const n=Math.max(2,Math.min(60,Math.round(grid.n)));return[n,Math.max(1,Math.round(n*SH/SW))]};
const snapSize=(q,s)=>{const cw=SW/gDim()[0],base=96*(q.sx||1),w=Math.max(cw,Math.round(base*s/cw)*cw);return Math.min(4,Math.max(.02,+(w/base).toFixed(3)))};
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
// inkRuns gives [{c: colour ref or '' for the stamp's own ink, ix: the shape numbers, sel(i): which shapes a run's mask holds}], or null for a one-colour stamp.
function inkRuns(t){if(t.neg||!t.items.some(q=>q.ic))return null;const a=t.items,runs=[];a.forEach((q,i)=>{if(q.k)return;const c=q.ic||'',l=runs[runs.length-1];if(l&&l.c===c)l.ix.push(i);else runs.push({c,ix:[i]})});
 runs.forEach(r=>{const set=new Set(r.ix),end=r.ix[r.ix.length-1];r.sel=i=>set.has(i)||(!!a[i].k&&i>end)});return runs}
function items(t,cl,ed,e,sel){let o='';expand(t).forEach(([q,i,c])=>{if(sel&&!sel(i))return;const SX=q.sx||1,SY=q.sy||1,r=70*q.s*Math.max(SX,SY),own=ed&&q.ic&&!t.neg&&!q.k?col(q.ic):cl.c,m0=q.k?mk(q.m,cl.d,cl.c):mk(q.m,own,cl.d);
for(const[dx,dy]of OFFS){const m=clipWrap(q,q.k?(thick(q,cl.c,cl.d)||m0):solid(q,own,ed));const x=q.x+dx,y=q.y+dy;if(x+r<-e||x-r>SW+e||y+r<-e||y-r>SH+e)continue;
o+=`<g${ed?` data-i="${i}" data-c="${c}"`:''} transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${q.r}) scale(${+(q.s*q.f*SX).toFixed(4)} ${+(q.s*SY).toFixed(4)})">${m}</g>`}});return o}
function draw(){if(texNorm())buildTex();useT(WBS.tiles[WBS.cur]);if(!WBS.layers.length)WBS.layers=[mkL('Layer 1',WBS.tiles.map(t=>t.id),'check',180)];if(WBS.selL<0||WBS.selL>=WBS.layers.length)WBS.selL=WBS.layers.length-1;trayGuard();WBS.tiles.forEach(t=>{if(t.ink&&!okC(t.ink))delete t.ink});sync();const t=WBS.tiles[WBS.cur],cl=cols(t);selFix();const q=t.items[WBS.sel];
if(WBS.split&&(WBS.split.i!=WBS.sel||!stTxMode()||!q))WBS.split=null;$('spbar').hidden=!WBS.split;
renderSym(t);
$('sel').classList.toggle('none',!q);{const n=WBS.msel.size;$('msc').hidden=n<2;$('msc').textContent=n+' selected';$('ssp').disabled=n>1;$('sdl').title=n>1?`Delete ${n} shapes (Del)`:'Delete (Del)';$('scp').title=n>1?`Duplicate ${n} shapes (Ctrl+D)`:'Duplicate (Ctrl+D)'}if(q){$('ssz').value=q.s*100;$('srt').value=q.r;$('ssx').value=(q.sx||1)*100;$('ssy').value=(q.sy||1)*100;$('ssr').disabled=(q.sx||1)==1&&(q.sy||1)==1;$('sko').setAttribute('aria-pressed',q.k?'true':'false');$('sth').value=q.w||0}else{$('ssz').value=80;$('srt').value=0;$('ssx').value=100;$('ssy').value=100;$('sth').value=0;$('ssr').disabled=true;$('sko').setAttribute('aria-pressed','false')}if(stTxMode())renderML()}
// Pattern presets per stamp shape: [key, label, grid, order, turn]. One setting replaces grid type + stamp order.
const ARR={
rect:[['r-check','Checkerboard','square','check'],['r-rows','Rows','square','rows'],['r-cols','Columns','square','cols'],['r-diag','Diagonal stripes','square','diag'],['r-brick','Brick','brick','rows'],['r-brickc','Brick, checkered','brick','check'],['r-drop','Half-drop','drop','cols'],['r-dropc','Half-drop, checkered','drop','check'],['r-pin','Pinwheel (turned in fours)','square','pin','pin'],['r-rand','Random','square','rand'],['r-randt','Random, turned','square','rand','r90']],
hex:[['h-three','Three-colour honeycomb','honey','three'],['h-check','Alternating honeycomb','honey','check'],['h-rows','Honeycomb rows','honey','rows'],['h-cols','Honeycomb columns','honey','cols'],['h-rand','Random','honey','rand'],['h-randt','Random, turned','honey','rand','r60']],
circle:[['c-three','Packed, three-colour','honey','three'],['c-rows','Packed rows','honey','rows'],['c-check','Square grid, checkered','square','check'],['c-sqrows','Square grid, rows','square','rows'],['c-brick','Offset rows, checkered','brick','check'],['c-rand','Random','honey','rand'],['c-randt','Random, turned','honey','rand','rany']],
diamond:[['d-harl','Harlequin','diamond','rows'],['d-cols','Columns','diamond','cols'],['d-diag','Diagonal stripes','diamond','dgd'],['d-pairs','Checkered pairs','diamond','check'],['d-rand','Random','diamond','rand'],['d-randt','Random, flipped','diamond','rand','r180']],
tri:[['t-ud','Up and down','tri','check'],['t-rows','Rows','tri','rows'],['t-cols','Columns','tri','cols'],['t-diag','Diagonal stripes','tri','diag'],['t-rand','Random','tri','rand']]};
function init09(){WBH.draw=draw;
// ---- Stamp editor grid: N cells across, rows chosen so cells stay near-square and always whole.
WBS.edMk=true;WBS.edInk=true;WBS.edTx=true;try{const g=JSON.parse(kv.get('wb33_grid')||'null');if(g)grid={...grid,...g}}catch(e){}
grid.sh=gShOk(grid.sh);
ORN.forEach(k=>ARR[k]=ARR.circle);
}
export {ARR,clipSeed,clipWrap,gDim,grid,hx3,inkRuns,items,saveGrid,snapSize,init09};
