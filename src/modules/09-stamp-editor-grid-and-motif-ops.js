import {kv} from '../platform/index.js';
import {$,WBH,WBS} from './01-launch-and-version.js';
import {CH,CW,OFFS,ORN,SH,SW,col,geom,okC,shOf,shp,useT,wrapP} from './04-canvas-and-stamp-outlines.js';
import {trayGuard} from './50-tray-core.js';
import {cols,inkOf,mk,mkL} from './06-motif-library-folders.js';
import {expand,renderSym,symG,symOf} from './07-symmetry.js';
import {gModel,gNear,gShOk} from './08-grid-shapes.js';
import {lattice} from './10-layer-grids.js';
import {drag,eR,eSeed,eT,edgeDef} from './11-pressure-flooding-block-edges.js';
import {selFix} from './12-selection-and-split.js';
import {paintGhost,renderML,sync} from './13-preview-and-stamp-tool.js';
import {isOf} from './16-texture-generators.js';
import {buildTex,inkCatch,surfFor,texNorm} from './17-texture-panel-and-previews.js';
import {stTxMode} from './63-stamp-tool.js';
 // the Stamp texture / Canvas texture view switches: one setting shared by the Pattern view and the Stamp editor
let grid={on:false,n:6,sp:'c',sd:false,ss:false,op:70,sh:'rect'};const saveGrid=()=>{try{kv.set('wb33_grid',JSON.stringify(grid))}catch(e){}};
const gDim=()=>{const n=Math.max(2,Math.min(60,Math.round(grid.n)));return[n,Math.max(1,Math.round(n*SH/SW))]};
function snapPt(x,y){if(grid.sh&&grid.sh!='rect'){const M=gModel(grid.sh,SW,SH,gDim()[0],true),[ux,uy]=wrapP(x,y),b=gNear((grid.sp!='l'?M.cents:[]).concat(grid.sp!='c'?M.verts:[]),ux,uy,SW,SH,true);if(b)return wrapP(b[0],b[1])}
const[n,m]=gDim(),cw=SW/n,ch=SH/m,[wx,wy]=wrapP(x,y);const cands=[];
if(grid.sp!='l')cands.push([(Math.floor(wx/cw)+.5)*cw,(Math.floor(wy/ch)+.5)*ch]);if(grid.sp!='c')cands.push([Math.round(wx/cw)*cw,Math.round(wy/ch)*ch]);
let b=cands[0],bd=1e9;cands.forEach(c=>{const d=(c[0]-wx)**2+(c[1]-wy)**2;if(d<bd){bd=d;b=c}});return wrapP(b[0],b[1])}
const snapSize=(q,s)=>{const cw=SW/gDim()[0],base=96*(q.sx||1),w=Math.max(cw,Math.round(base*s/cw)*cw);return Math.min(4,Math.max(.02,+(w/base).toFixed(3)))};
function gridSVG(){if(!grid.on)return'';const lo=(.55*Math.max(10,Math.min(100,+grid.op||70))/70).toFixed(2),dop=(.7*Math.max(10,Math.min(100,+grid.op||70))/70).toFixed(2);if(grid.sh&&grid.sh!='rect'){const M=gModel(grid.sh,SW,SH,gDim()[0],true),f=v=>v.toFixed(2);let dots='';if(grid.sp!='l')M.cents.forEach(q=>dots+=`<circle cx="${f(q[0])}" cy="${f(q[1])}" r="1.1"/>`);if(grid.sp!='c')M.verts.forEach(q=>dots+=`<circle cx="${f(q[0])}" cy="${f(q[1])}" r=".9"/>`);
 return`<g pointer-events="none" clip-path="url(#ec)" color="#6f8cff"><path d="${M.items.join('')}" fill="none" stroke="currentColor" stroke-width=".7" opacity="${lo}"/><rect width="${SW}" height="${SH}" fill="none" stroke="currentColor" stroke-width="1.4" opacity="${lo}"/><g fill="currentColor" opacity="${dop}">${dots}</g></g>`}const[n,m]=gDim(),cw=SW/n,ch=SH/m,f=v=>v.toFixed(2);let d='';for(let i=1;i<n;i++)d+=`M${f(i*cw)},0V${SH}`;for(let j=1;j<m;j++)d+=`M0,${f(j*ch)}H${SW}`;
let dots='';if(grid.sp!='l')for(let i=0;i<n;i++)for(let j=0;j<m;j++)dots+=`<circle cx="${f((i+.5)*cw)}" cy="${f((j+.5)*ch)}" r="1.1"/>`;
return`<g pointer-events="none" clip-path="url(#ec)" color="#6f8cff"><path d="${d}" fill="none" stroke="currentColor" stroke-width=".7" opacity="${lo}"/><rect width="${SW}" height="${SH}" fill="none" stroke="currentColor" stroke-width="1.4" opacity="${lo}"/><g fill="currentColor" opacity="${dop}">${dots}</g></g>`}
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
// Stamp editor view option: show this stamp's ink surface (view only, nothing is saved to the stamp). Toggle: Ink button in the editor bar.
const edInkDef=t=>{let o='';if(WBS.edInk&&isOf(t))o+=surfFor(t).replace('id="is'+t.id+'"','id="eis'+t.id+'"');
if(WBS.edTx&&WBS.tex.t){const c=inkCatch();if(c)o+=c.defs.replace('id="cw"','id="ecw"')}return o};
function edTxR(t){const G=geom(shOf(t)),k=edTexK(t),w=k*G.SW,h=k*G.SH,m=Math.max(w,h)*.04;return{x:CW/2-w/2-m,y:CH/2-h/2-m,w:w+2*m,h:h+2*m}}
function edRgnSet(s,id,r){const f=v=>(+v).toFixed(3);return s.replace(new RegExp('(<filter id="'+id+'"[^>]*?) x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"'),`$1 x="${f(r.x)}" y="${f(r.y)}" width="${f(r.w)}" height="${f(r.h)}"`)}
// Texture view: the canvas texture lives in canvas units, so it is mapped at the size this stamp prints in the pattern (same maths as the stamp PNG export)
function edTexK(t){const G=geom(shOf(t));let k=180/Math.max(G.SW,G.SH);
try{const li=WBS.layers.findIndex(l=>l.vis!==false&&(l.st||[]).includes(t.id)&&!(l.fr&&l.fr.on));if(li>=0){const L=WBS.layers[li];if(!L.free){const T=lattice(L);k=T.ts*(shOf(t).z||100)/(T.g.SW*T.z)*1.004}else{const q=(L.pl||[]).find(z=>z.t==t.id);if(q)k=q.s/Math.max(G.SW,G.SH)}}}catch(e){}
k=Math.min(k,.95*Math.min(CW,CH)/Math.max(G.SW,G.SH));return k>0?k:1}
function edInkOn(t,cl){const bg=`<path class="edbg" d="${shp(0)}" fill="${cl.bg}"/>`,it=`<g clip-path="url(#ec)">${items(t,cl,1,24)}</g>`,si=WBS.edInk&&isOf(t),tx=WBS.edTx&&!!WBS.tex.t;
if(!si&&!tx)return bg+'<g class="gw gi">'+it+'</g>';
const k=+edTexK(t).toFixed(5),fwd=`translate(${CW/2} ${CH/2}) scale(${k}) translate(${-SW/2} ${-SH/2})`,inv=`translate(${SW/2} ${SH/2}) scale(${+(1/k).toFixed(5)}) translate(${-CW/2} ${-CH/2})`;
const neg=!!t.neg;let L=neg?bg+it:it;
if(si)L=`<g mask="url(#eis${t.id})">${L}</g>`;
if(tx&&inkCatch())L=`<g transform="${inv}" mask="url(#ecw)"><g transform="${fwd}">${L}</g></g>`;
// the filters sit on nested groups: the editor's grade stylesheet rule puts its own filter on every direct child of #ed and would override these
let o=(neg?`<path class="edbg" d="${shp(0)}" fill="${col(WBS.proj.bg)}" pointer-events="none"/>`:bg)+`<g class="gw gi">${L}</g>`;
if(tx){let h=$('texg').innerHTML;if(h){h=h.replace(/id="(tx|txp|txpr)"/g,'id="e$1"').replace(/url\(#(tx|txp)\)/g,'url(#e$1)');h=edRgnSet(h,'etx',edTxR(t));const gr=$('grdf').querySelector('#wbgradeT');
o+=`<g class="edtx" pointer-events="none"><g clip-path="url(#ec)"><g transform="${inv}"><g${gr?' filter="url(#wbgradeT)"':''}>${h}</g></g></g></g>`}}
return o}
// Handles on the selected motif (one motif only): the four corners scale it, the four side squares pull its width or height, the round one above it turns it.
function hdlSVG(p){const f=v=>v.toFixed(1),rx=48*p.s*(p.sx||1),ry=48*p.s*(p.sy||1),h=2.8,k=h*2,st='style="fill:#fff;stroke:var(--acc);stroke-width:1.4"',hs=(a,b,n)=>`<rect data-hd="${n}" x="${f(a-h)}" y="${f(b-h)}" width="${k}" height="${k}" rx=".8" ${st} cursor="${n=='nw'||n=='se'?'nwse-resize':n=='n'||n=='s'?'ns-resize':n=='e'||n=='w'?'ew-resize':'nesw-resize'}"/>`;
return`<g transform="translate(${f(+p.x)} ${f(+p.y)}) rotate(${p.r})">${hs(-rx,-ry,'nw')}${hs(rx,-ry,'ne')}${hs(-rx,ry,'sw')}${hs(rx,ry,'se')}${hs(0,-ry,'n')}${hs(0,ry,'s')}${hs(rx,0,'e')}${hs(-rx,0,'w')}<line x1="0" y1="${f(-ry)}" x2="0" y2="${f(-ry-12)}" style="stroke:var(--acc);stroke-width:1.4" pointer-events="none"/><circle data-hd="rot" cx="0" cy="${f(-ry-12)}" r="3.3" ${st} cursor="grab"/></g>`}
function draw(){if(texNorm())buildTex();useT(WBS.tiles[WBS.cur]);if(!WBS.layers.length)WBS.layers=[mkL('Layer 1',WBS.tiles.map(t=>t.id),'check',180)];if(WBS.selL<0||WBS.selL>=WBS.layers.length)WBS.selL=WBS.layers.length-1;trayGuard();WBS.tiles.forEach(t=>{if(t.ink&&!okC(t.ink))delete t.ink});sync();const t=WBS.tiles[WBS.cur],cl=cols(t);selFix();const q=t.items[WBS.sel];$('ed').setAttribute('viewBox',`-24 -24 ${SW+48} ${SH+48}`);
$('ed').classList.toggle('multi',WBS.msel.size>1);if(!$('boardS').hidden)$('ed').innerHTML=`<defs><clipPath id="ec"><path d="${shp(0)}"/></clipPath>${edInkDef(t)}</defs><g class="gw"><g opacity=".3">${items(t,cl,0,24)}</g></g>${edInkOn(t,cl)}<g class="gw"><path d="${shp(0)}" fill="none" stroke="currentColor" stroke-dasharray="4 3" opacity=".5"/></g>`+(eT(t)?`<defs>${edgeDef(eT(t),eR(t),eSeed(t,0),'xe'+t.id,'ec')}</defs><g class="gw"><use href="#xe${t.id}" fill="${inkOf(t)}" pointer-events="none"/></g>`:'')+'<g class="gw">'+gridSVG()+symG(symOf(t).m,symOf(t).n,1.3,1)+(q?expand(t).filter(e=>WBS.msel.has(e[1])).map(([p,,c])=>`<ellipse cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="${(48*p.s*(p.sx||1)).toFixed(1)}" ry="${(48*p.s*(p.sy||1)).toFixed(1)}" transform="rotate(${p.r} ${p.x.toFixed(1)} ${p.y.toFixed(1)})" fill="none" style="stroke:var(--acc)" stroke-width="2" stroke-dasharray="3 3" opacity="${c?.45:1}" pointer-events="none"/>`).join('')+(WBS.msel.size==1&&!WBS.split?hdlSVG(q):''):'')+'</g>';
if(WBS.split&&(WBS.split.i!=WBS.sel||($('boardS').hidden&&!stTxMode())||!q))WBS.split=null;$('spbar').hidden=!WBS.split;$('edhint').classList.toggle('sphide',!!WBS.split);
if(WBS.split){const L=52*q.s*Math.max(q.sx||1,q.sy||1)+14,a=WBS.split.a*Math.PI/180,ux=Math.cos(a)*L,uy=Math.sin(a)*L,x1=WBS.split.x-ux,y1=WBS.split.y-uy,x2=WBS.split.x+ux,y2=WBS.split.y+uy,f=v=>v.toFixed(1);
$('ed').insertAdjacentHTML('beforeend',`<g class="spov"><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#fff" stroke-width="4" opacity=".8" pointer-events="none"/><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="var(--acc)" stroke-width="2" stroke-dasharray="6 4" pointer-events="none"/><line data-sp="m" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="transparent" stroke-width="16"/><circle data-sp="m" cx="${f(WBS.split.x)}" cy="${f(WBS.split.y)}" r="6" fill="var(--acc)" stroke="#fff" stroke-width="2"/><circle data-sp="r" cx="${f(x2)}" cy="${f(y2)}" r="7.5" fill="#fff" stroke="var(--acc)" stroke-width="2.5"/></g>`)}
renderSym(t);$('gti').classList.toggle('on',WBS.edInk);$('gti').setAttribute('aria-pressed',String(WBS.edInk));$('gtx').classList.toggle('on',WBS.edTx);$('gtx').setAttribute('aria-pressed',String(WBS.edTx));$('gtx').title=WBS.tex.t?'Show the canvas texture on the stamp (view only)':'This project has no canvas texture set';$('gti').title=isOf(t)?"Show the stamp texture in the editor (view only)":"This stamp has no stamp texture set (see Stamp texture in the stamp panel)";
$('sel').classList.toggle('none',!q);{const n=WBS.msel.size;$('msc').hidden=n<2;$('msc').textContent=n+' selected';$('ssp').disabled=n>1;$('sdl').title=n>1?`Delete ${n} shapes (Del)`:'Delete (Del)';$('scp').title=n>1?`Duplicate ${n} shapes (Ctrl+D)`:'Duplicate (Ctrl+D)'}if(q){$('ssz').value=q.s*100;$('srt').value=q.r;$('ssx').value=(q.sx||1)*100;$('ssy').value=(q.sy||1)*100;$('ssr').disabled=(q.sx||1)==1&&(q.sy||1)==1;$('sko').setAttribute('aria-pressed',q.k?'true':'false');$('sth').value=q.w||0}else{$('ssz').value=80;$('srt').value=0;$('ssx').value=100;$('ssy').value=100;$('sth').value=0;$('ssr').disabled=true;$('sko').setAttribute('aria-pressed','false')}if((!$('boardS').hidden||stTxMode())&&!(drag&&WBS.DRAFT))renderML();paintGhost()}
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
export {ARR,clipSeed,clipWrap,gDim,grid,hx3,inkRuns,items,saveGrid,snapPt,snapSize,init09};
