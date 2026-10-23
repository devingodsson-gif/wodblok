import {ICN} from './00-icons.js';
import {mapPts,mapShape} from './77-map-to-shape.js';
import {cust,mk} from './06-motif-library-folders.js';
import {mNm} from './21-motif-library-ui.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,geom,rowMenu,shOf,stNmId} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {elExtend,elSel} from './65-element-core.js';

// ===== The Pattern element (element update, step 5, 2.1.5): a list of points plus sources placed at them.
// {u, k:'pattern', n:name, lay:'grid'|'brick'|'half'|'radial'|'scatter'|'frame', cn:columns, rn:rows, sz:size in % of a cell, rt:turn in degrees, ox, oy: shift in % of a cell, in: the frame's inset in % of the short side,
//  ds:'cycle'|'random'|'weight', sd:seed, src:[{k:'stamp',t,w} | {k:'motif',m,w, and its look: wx, wy, ink, fl, a, iz, im, sw, sk as on a Motif element} | {k:'text',w,it:{the text element without u, x, y}}]  (2.4.0: a new pattern has no sources; each point then shows as an arrow, in the editor only, pointing the way a placed piece would be turned), x, y, s, r, f (an anchor, so the element list stays uniform)}
// Sources are references: editing a stamp changes every placement. A pattern draws by turning itself into ordinary stamp, image and text elements (with the pattern's id in `pu`),
// which the kinds draw as always; nothing is drawn twice and nothing is stored for them.
const patClamp=(v,a,b)=>Math.max(a,Math.min(b,+v||0));
function patRnd(sd){let a=(+sd||1)>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
// the points: [x, y] and the size of the cell around each
function patPts(p){{const S=mapShape(p);if(S){const m=mapPts(p,S);if(m)return m}}
const cn=patClamp(p.cn,1,40)|0||1,rn=patClamp(p.rn,1,40)|0||1,cw=CW/cn,ch=CH/rn,cell=Math.min(cw,ch),o=[];
// frame: a row of points along each edge, turned to lie along it
if(p.lay=='frame'){const m=Math.min(CW,CH)*patClamp(p.in==null?4:p.in,0,40)/100,W=CW-2*m,H=CH-2*m,rot=[];for(let i=0;i<cn;i++){const x=m+(i+.5)*W/cn;o.push([x,m]);rot.push(0);o.push([x,CH-m]);rot.push(0)}for(let j=0;j<rn;j++){const y=m+(j+.5)*H/rn;o.push([m,y]);rot.push(90);o.push([CW-m,y]);rot.push(90)}return{pts:o,cell:W/cn,rot}}
const ox=patClamp(p.ox,-100,100)/100*cw,oy=patClamp(p.oy,-100,100)/100*ch,sh=a=>a.map(q=>[q[0]+ox,q[1]+oy]).filter(q=>q[0]>-cw/2+1e-6&&q[0]<CW+cw/2-1e-6&&q[1]>-ch/2+1e-6&&q[1]<CH+ch/2-1e-6);
if(p.lay=='radial'){const R=Math.min(CW,CH)/2*.92,st=R/rn;o.push([CW/2,CH/2]);for(let k=1;k<=rn;k++){const n=cn*k;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o.push([CW/2+Math.cos(a)*st*k,CH/2+Math.sin(a)*st*k])}}return{pts:o,cell:Math.min(st*1.1,2*Math.PI*st/Math.max(3,cn))}}
if(p.lay=='scatter'){const r=patRnd((+p.sd||1)+77);for(let i=0;i<cn*rn;i++)o.push([r()*CW,r()*CH]);return{pts:o,cell}}
if(p.lay=='brick'){for(let j=-1;j<=rn;j++)for(let i=-1;i<=cn;i++){const x=(i+.5)*cw+(Math.abs(j)%2?cw/2:0);if(x>-cw/2+1e-6&&x<CW+cw/2-1e-6)o.push([x,(j+.5)*ch])}return{pts:sh(o),cell}}
if(p.lay=='half'){for(let i=-1;i<=cn;i++)for(let j=-1;j<=rn;j++){const y=(j+.5)*ch+(Math.abs(i)%2?ch/2:0);if(y>-ch/2+1e-6&&y<CH+ch/2-1e-6)o.push([(i+.5)*cw,y])}return{pts:sh(o),cell}}
for(let j=-1;j<=rn;j++)for(let i=-1;i<=cn;i++)o.push([(i+.5)*cw,(j+.5)*ch]);return{pts:sh(o),cell}}
// 2.31.0: a motif source carries its own look (stretch, colour, fill, picture, outline), which every placement of it takes
const PAT_LOOK=['wx','wy','ink','fl','a','iz','im','sw','sk'];
const patLook=s=>{const o={};PAT_LOOK.forEach(k=>{if(s[k]!=null)o[k]=s[k]});return o};
const patSrcOk=s=>s&&(s.k=='stamp'?WBS.tiles.some(t=>t.id==s.t):s.k=='motif'?typeof s.m=='string'&&!!s.m:s.k=='text'&&s.it);
// the elements a pattern stands for
function patItems(p){const ss=(p.src||[]).filter(patSrcOk);if(!ss.length)return[];const{pts,cell,rot}=patPts(p),r=patRnd(p.sd),sz=cell*patClamp(p.sz||80,5,300)/100,tot=ss.reduce((a,s)=>a+(+s.w>0?+s.w:1),0),out=[];
pts.forEach((q,i)=>{let s;if(p.ds=='random')s=ss[Math.floor(r()*ss.length)];else if(p.ds=='weight'){let v=r()*tot;s=ss.find(z=>(v-=(+z.w>0?+z.w:1))<0)||ss[ss.length-1]}else s=ss[i%ss.length];
const b={u:p.u+'.'+i,pu:p.u,...(p.fx&&p.fx.length?{fx:p.fx}:{}),x:+q[0].toFixed(1),y:+q[1].toFixed(1),s:+sz.toFixed(2),r:(+p.rt||0)+(rot?rot[i]||0:0),f:1};
if(s.k=='stamp')out.push({...b,k:'stamp',t:s.t});else if(s.k=='motif')out.push({...b,k:'motif',m:s.m,s:+(sz/1.5).toFixed(2),...patLook(s)});else{const{u,x,y,s:_s,r:_r,f:_f,...it}=s.it;out.push({...it,...b,k:'text'})}});return out}
// the layer as the kinds should draw it: each pattern replaced, in place, by the elements it stands for
function patExpand(L){const pl=L.pl||[];if(!pl.some(q=>q.k=='pattern'))return L;const o=[];pl.forEach(q=>{if(q.k=='pattern'){const w=q.op!=null||q.bl||q.v===false||q.g?{wk:q.u,...(q.g?{g:q.g}:{}),...(q.op!=null?{op:q.op}:{}),...(q.bl?{bl:q.bl}:{}),...(q.v===false?{v:false}:{})}:null;o.push(...(w?patItems(q).map(i=>({...i,...w})):patItems(q)))}else o.push(q)});return{...L,pl:o}}

// Empty patterns (2.4.0): each point is drawn as an arrow pointing the way a placed piece would face (its top), so the pattern can be seen and set up before anything is in it.
// The arrows are editor overlay only: they are not part of the picture, nor of an export.
function patArrows(L){const pl=(L.pl||[]).filter(q=>q.k=='pattern'&&q.v!==false&&!(q.src||[]).some(patSrcOk));if(!pl.length)return'';let h='';
 pl.forEach(p=>{const{pts,cell,rot}=patPts(p),r=cell*patClamp(p.sz||80,5,300)/200;pts.forEach((q,i)=>{const a=(+p.rt||0)+(rot?rot[i]||0:0);
  h+=`<path d="M0 ${(r*.8).toFixed(2)}V${(-r).toFixed(2)}M${(-r*.45).toFixed(2)} ${(-r*.5).toFixed(2)}L0 ${(-r).toFixed(2)}L${(r*.45).toFixed(2)} ${(-r*.5).toFixed(2)}" transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)}) rotate(${a.toFixed(1)})" fill="none" stroke="var(--acc)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" pointer-events="none" data-pa="1"/>`})});return h}
// ---- the panel (the Pattern panel's first group)
const patList=()=>{const L=fpL();return L?(L.pl||[]).filter(q=>q.k=='pattern'):[]};
const patCur=()=>{const a=patList();return a.find(q=>q.u==WBS.patSel)||null};
const patHx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const patCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
function patSrcName(s){if(s.k=='stamp')return stNmId(s.t);if(s.k=='motif')return mNm(s.m);return String((s.it.tx&&s.it.tx.text)||'Text').replace(/\n/g,' ').slice(0,24)}
function patSync(){const host=$('pelist');if(!host)return;const a=patList(),p=patCur();if(WBS.patSel!=null&&!p&&a.length===0)WBS.patSel=null;
const key=JSON.stringify([a.map(q=>[q.u,q.n]),WBS.patSel,WBS.patSrc,p&&[p.lay,p.cn,p.rn,p.sz,p.rt,p.ox,p.oy,p.in,p.ds,(p.src||[]).map(s=>[s.k,s.t,s.a,s.w,s.it&&s.it.tx&&s.it.tx.text])],WBS.tiles.map(t=>t.id).join()]);
if(host.dataset.k===key)return;host.dataset.k=key;
host.innerHTML=a.slice().reverse().map(q=>`<div class="mr${q.u==WBS.patSel?' on':''}" data-pe="${q.u}"><b>${patHx(q.n)}<i>${(q.src||[]).length} source${(q.src||[]).length==1?'':'s'}</i></b><button type="button" data-pd="${q.u}" aria-label="Delete this pattern">&#215;</button></div>`).join('');
$('peed').hidden=!p;if(!p)return;
$('pelay').querySelectorAll('[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l==p.lay));$('peds').querySelectorAll('[data-d]').forEach(b=>b.classList.toggle('on',b.dataset.d==p.ds));
const sv=(id,v)=>{const el=$(id);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};sv('pecn',p.cn);sv('pern',p.rn);sv('pesz',p.sz);sv('pert',p.rt);sv('peox',+p.ox||0);sv('peoy',+p.oy||0);sv('pein',p.in==null?4:+p.in);$('peinr').hidden=p.lay!='frame';
// the sources (2.3.0): one row each, a thumbnail of the stamp (or the kind's icon), its name, its weight when the pattern picks by weight, and remove
$('pesrc').innerHTML=(p.src||[]).map((s,i)=>{const t=s.k=='stamp'?WBS.tiles.find(x=>x.id==s.t):null,G=t?geom(shOf(t)):null,th=s.k=='motif'?`<svg viewBox="-110 -110 220 220">${mk(s.m,'currentColor','transparent')}</svg>`:G?`<svg viewBox="0 0 ${G.SW} ${G.SH}"><use href="#s${t.id}"/></svg>`:`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.text}</svg>`;
 return`<div class="psr2${s.k=='motif'&&WBS.patSrc===i?' on':''}" data-si="${i}"${s.k=='motif'?' data-look':''}><span class="pth">${th}</span><b>${patHx(patSrcName(s))}${patSrcOk(s)?'':' <i>missing</i>'}</b>${p.ds=='weighted'?`<input type="number" min="1" max="99" value="${+s.w>0?+s.w:1}" data-sw="${i}" aria-label="Weight">`:'<span></span>'}<button type="button" class="ib" data-sx="${i}" aria-label="Remove this source"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN.close}</svg></button></div>`}).join('')}
// Add source (2.28.0): a menu with the project's stamps and texts, and "Motif from the library…", which opens the Motifs panel's folder tree: the next motif clicked
// there becomes a source of this pattern and the Pattern panel comes back (Esc lets go). It replaces one dropdown of every motif in the library (464 of them).
function patAddSrc(p,src){const q=patList().find(x=>x.u===p.u);if(!q)return;q.src=q.src||[];q.src.push(src);WBS.patSel=q.u;patCh()}
function patAddMenu(){const p=patCur(),b=$('peadd');if(!p||!b)return;const L=fpL(),tx=L?(L.pl||[]).filter(q=>q.k=='text'||(q.tx!=null&&q.k!='pattern')):[];
 const items=WBS.tiles.map(t=>[patHx(stNmId(t.id)),()=>patAddSrc(p,{k:'stamp',t:t.id,w:1})]).concat(tx.map(q=>[patHx(String((q.tx&&q.tx.text)||'Text').replace(/\n/g,' ').slice(0,24)),()=>{const{u,x,y,s,r,f,k:_k,g,...it}=q;patAddSrc(p,{k:'text',w:1,it:JSON.parse(JSON.stringify(it))})}]));
 items.push(['Shape from the library…',()=>{WBX.wbLibPick=m=>{WBX.wbLibPick=null;patAddSrc(p,{k:'motif',m,w:1});if(WBX.wbOpenPanel)WBX.wbOpenPanel('layers');pmsg('Added '+mNm(m)+' to '+p.n+'.')};if(WBX.wbOpenPanel)WBX.wbOpenPanel('motifs');pmsg('Choose a shape for '+p.n+'.')}]);
 rowMenu(b,items)}
function init67(){
elExtend('pattern',{expand:patExpand,name:q=>q.n});
if(!$('pelist'))return;
$('penew').onclick=()=>{const L=fpL();if(!L)return;L.pl=L.pl||[];const n=patList().length+1,q={u:fpU(),k:'pattern',n:'Pattern '+n,lay:'grid',cn:4,rn:4,sz:80,rt:0,ds:'cycle',sd:1+Math.floor(Math.random()*9998),src:[],x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:Math.min(CW,CH),r:0,f:1};L.pl.push(q);WBS.patSel=q.u;patCh()};
$('pelist').onclick=e=>{const L=fpL();if(!L)return;WBS.patSrc=null;const d=e.target.closest('[data-pd]');if(d){const i=L.pl.findIndex(q=>q.u==d.dataset.pd);if(i>=0){L.pl.splice(i,1);if(WBS.patSel==d.dataset.pd)WBS.patSel=null;patCh()}return}const r=e.target.closest('[data-pe]');if(r){WBS.patSel=r.dataset.pe;patSync();}};
const set=(f,v)=>{const p=patCur();if(!p)return;if(p[f]===v)return;p[f]=v;patCh()};
$('pelay').onclick=e=>{const b=e.target.closest('[data-l]');if(b){set('lay',b.dataset.l);$('peinr').hidden=b.dataset.l!='frame'}};
$('peds').onclick=e=>{const b=e.target.closest('[data-d]');if(b)set('ds',b.dataset.d)};
[['pecn','cn'],['pern','rn'],['pesz','sz'],['pert','rt'],['peox','ox'],['peoy','oy'],['pein','in']].forEach(([id,f])=>$(id).addEventListener('input',()=>{const p=patCur();if(!p)return;const v=+$(id).value;if(p[f]!==v){p[f]=v;patCh()}}));
$('pesd').onclick=()=>{const p=patCur();if(p){p.sd=1+Math.floor(Math.random()*9998);patCh()}};
// "Add element" (2.4.0): one list of everything a pattern can place: the stamps, the motifs of the library, and the text on the canvas
$('peadd').onclick=e=>{e.stopPropagation();patAddMenu()};
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&WBX.wbLibPick){WBX.wbLibPick=null;pmsg('')}},true);
// 2.31.0: a click on a motif source picks it: the Width and height, Fill and Outline groups come under the sources and set that source's look (79-motif-look.js)
$('pesrc').onclick=e=>{const p=patCur(),x=e.target.closest('[data-sx]');if(p&&x){p.src.splice(+x.dataset.sx,1);WBS.patSrc=null;patCh();return}const r=e.target.closest('[data-look]');if(p&&r&&!e.target.closest('input')){const i=+r.dataset.si;WBS.patSrc=WBS.patSrc===i?null:i;patSync();if(WBX.wbMfSync)WBX.wbMfSync()}};
$('pesrc').addEventListener('change',e=>{const p=patCur(),w=e.target.closest('[data-sw]');if(p&&w){p.src[+w.dataset.sw].w=Math.max(1,Math.min(99,Math.round(+w.value||1)));patCh()}});
WBX.wbPatSync=patSync;WBX.wbPatArrows=patArrows;patSync()}
export {init67,patCur,patExpand,patItems,patPts,patSync};
