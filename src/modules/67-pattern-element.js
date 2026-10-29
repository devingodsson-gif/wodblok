import {ICN} from './00-icons.js';
import {mapPts,mapShape} from './77-map-to-shape.js';
import {cust,mk} from './06-motif-library-folders.js';
import {mNm} from './21-motif-library-ui.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,geom,PHU,physLen,physOf,physToCv,rowMenu,shOf,stNmId} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {fpL,fpU} from './24-free-place-layers.js';
import {fpSz} from './25-art-layers.js';
import {elExtend,elSel} from './65-element-core.js';
import {TL_AR,TL_TS,tlArr,tlPts,tlShape} from './92-pattern-tiling.js';

// ===== The Pattern element (element update, step 5, 2.1.5): a list of points plus sources placed at them.
// {u, k:'pattern', n:name, lay:'grid'|'brick'|'half'|'radial'|'scatter'|'frame', cn:columns, rn:rows, sz:size in % of a cell, rt:turn in degrees, ox, oy: shift in % of a cell, in: the frame's inset in % of the short side,
//  ds:'cycle'|'random'|'weight', sd:seed, src:[{k:'stamp',t,w} | {k:'motif',m,w, and its look: wx, wy, ink, fl, a, iz, im, sw, sk as on a Motif element} | {k:'text',w,it:{the text element without u, x, y}}]  (2.4.0: a new pattern has no sources; each point then shows as an arrow, in the editor only, pointing the way a placed piece would be turned), x, y, s, r, f (an anchor, so the element list stays uniform)}
// Sources are references: editing a stamp changes every placement. A pattern draws by turning itself into ordinary stamp, image and text elements (with the pattern's id in `pu`),
// which the kinds draw as always; nothing is drawn twice and nothing is stored for them.
const patClamp=(v,a,b)=>Math.max(a,Math.min(b,+v||0));
// A new Pattern starts with as many columns and rows as the canvas holds stamps of the size a stamp is placed at (2.48.0, owner Oct 26 2026): canvas 1000 and stamp 100 make 10 x 10.
// 2.57.0: a new Pattern tiles (From stamp, the shape's first arrangement), its pieces the size a stamp is placed at, touching, over the whole canvas (af)
const patNew=()=>({lay:'tile',ts:'auto',ps:+Math.max(1,Math.min(100,fpSz()/Math.min(CW,CH)*100)).toFixed(1),sp:0,...patStart(),sz:100,af:1});
const patStart=()=>{const s=Math.max(1,fpSz());return{cn:patClamp(Math.round(CW/s),1,40),rn:patClamp(Math.round(CH/s),1,40)}};
function patRnd(sd){let a=(+sd||1)>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
// the points: [x, y] and the size of the cell around each
// 2.57.0: a pattern fills its area: {x, y} its middle, {aw, ah} its size, in canvas units; af (area follows) keeps it the whole canvas until it is moved or resized
function patArea(p){if(p.af||!(+p.aw>0)||!(+p.ah>0)||p.x==null)return{x0:0,y0:0,w:CW,h:CH};const w=+p.aw,h=+p.ah;return{x0:+p.x-w/2,y0:+p.y-h/2,w,h}}
// the places of a pattern, in canvas units: the Tiling layout (92-pattern-tiling.js), or the free layouts (Radial, Scatter, Frame; Grid is kept for a stamp's own tab),
// laid in the pattern's area
function patPts(p){{const S=mapShape(p);if(S){const m=mapPts(p,S);if(m)return m}}
 const A=patArea(p),sh=r=>{r.pts=r.pts.map(q=>[q[0]+A.x0,q[1]+A.y0]);return r};
 if(p.lay=='tile')return sh(tlPts(p,A.w,A.h));
 return sh(patFree(p,A.w,A.h))}
// the free layouts, in an area W x H (CW and CH here are the area's, not the canvas's)
function patFree(p,CW,CH){
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
// 2.76.5: what makes the pieces look hand-printed. A piece's own ink (pcm: 'place' takes the colour by the place's class, as a Checkerboard's two colours; 'random' draws
// one; the colours are pcc, tray colours), its own pressure (iv, 0 to 100: how much lighter the lightest piece prints) and overprinting (ov: pieces multiply where they overlap).
// Each piece draws from its own seeded stream, so a piece keeps its look when the others change.
function patVary(p,o,i,cls){const iv=+p.iv||0,cm=p.pcm,cc=Array.isArray(p.pcc)?p.pcc:[];if(!(iv>0||p.ov||(cm&&cc.length)))return o;
 const r=patRnd((+p.sd||1)*7919+i*104729+3);
 if(cm&&cc.length){const c=cm=='place'?cc[((cls|0)%cc.length+cc.length)%cc.length]:cc[Math.floor(r()*cc.length)];if(c)o.ink=c}else r();
 if(iv>0)o.op=Math.max(5,Math.round(100-r()*Math.min(100,iv)*.9));
 if(p.ov)o.bl='multiply';return o}
const patLook=s=>{const o={};PAT_LOOK.forEach(k=>{if(s[k]!=null)o[k]=s[k]});return o};
const patSrcOk=s=>s&&(s.k=='stamp'?WBS.tiles.some(t=>t.id==s.t):s.k=='motif'?typeof s.m=='string'&&!!s.m:s.k=='text'&&s.it);
// the elements a pattern stands for
function patItems(p){const ss=(p.src||[]).filter(patSrcOk);if(!ss.length)return[];if(p.lay=='tile'&&!mapShape(p))return patTiles(p,ss);const{pts,cell,rot}=patPts(p),r=patRnd(p.sd),sz=cell*patClamp(p.sz||80,5,300)/100,tot=ss.reduce((a,s)=>a+(+s.w>0?+s.w:1),0),out=[];
pts.forEach((q,i)=>{let s;if(p.ds=='random')s=ss[Math.floor(r()*ss.length)];else if(p.ds=='weight'){let v=r()*tot;s=ss.find(z=>(v-=(+z.w>0?+z.w:1))<0)||ss[ss.length-1]}else s=ss[i%ss.length];
const b={u:p.u+'.'+i,pu:p.u,...(p.fx&&p.fx.length?{fx:p.fx}:{}),x:+q[0].toFixed(1),y:+q[1].toFixed(1),s:+sz.toFixed(2),r:(+p.rt||0)+(rot?rot[i]||0:0),f:1};
if(s.k=='stamp')out.push(patVary(p,{...b,k:'stamp',t:s.t},i,i));else if(s.k=='motif')out.push(patVary(p,{...b,k:'motif',m:s.m,s:+(sz/1.5).toFixed(2),...patLook(s)},i,i));else{const{u,x,y,s:_s,r:_r,f:_f,...it}=s.it;out.push(patVary(p,{...it,...b,k:'text'},i,i))}});return out}
// the pieces of a tiling: each place's own size, turn and flip; Cycle picks the source by the place's class (a Checkerboard's two colours, a Diagonal's stripes),
// so sources alternate the way the arrangement says; a place marked gap (the small squares of Octagons and squares) is left empty with only one source
function patTiles(p,ss){const T=patPts(p),r=patRnd(p.sd),tot=ss.reduce((a,s)=>a+(+s.w>0?+s.w:1),0),out=[],n=ss.length;
 T.pts.forEach((q,i)=>{if(T.gap[i]&&n<2)return;let s;if(p.ds=='random')s=ss[Math.floor(r()*n)];else if(p.ds=='weight'){let v=r()*tot;s=ss.find(z=>(v-=(+z.w>0?+z.w:1))<0)||ss[n-1]}else s=ss[((T.cls[i]%n)+n)%n];
  const sz=T.size[i],b={u:p.u+'.'+i,pu:p.u,...(p.fx&&p.fx.length?{fx:p.fx}:{}),x:+q[0].toFixed(2),y:+q[1].toFixed(2),s:+sz.toFixed(3),r:+(T.rot[i]||0).toFixed(2),f:T.flip[i]||1};
  if(s.k=='stamp')out.push(patVary(p,{...b,k:'stamp',t:s.t},i,T.cls[i]));else if(s.k=='motif'){// a shape fills the tile's own box (a hexagon tile is narrower than it is tall), times its own stretch
   const L=patLook(s),bw=T.gap[i]?1:T.box.w,bh=T.gap[i]?1:T.box.h;out.push(patVary(p,{...b,k:'motif',m:s.m,...L,wx:+((+L.wx||1)*bw).toFixed(4),wy:+((+L.wy||1)*bh).toFixed(4)},i,T.cls[i]))}else{const{u,x,y,s:_s,r:_r,f:_f,...it}=s.it;out.push(patVary(p,{...it,...b,k:'text'},i,T.cls[i]))}});
 return out}
// the layer as the kinds should draw it: each pattern replaced, in place, by the elements it stands for
function patExpand(L){const pl=L.pl||[];if(!pl.some(q=>q.k=='pattern'))return L;const o=[];pl.forEach(q=>{if(q.k=='pattern'){if(q.af){const cx=+(CW/2).toFixed(1),cy=+(CH/2).toFixed(1);if(q.x!==cx)q.x=cx;if(q.y!==cy)q.y=cy}   /* an area that follows the canvas keeps its middle on the canvas's (its box is drawn there) */
 const A=patArea(q),cl=!q.af&&+q.aw>0?{clp:[A.x0,A.y0,A.w,A.h]}:null,w=q.op!=null||q.bl||q.v===false||q.g||cl?{wk:q.u,...(cl||{}),...(q.g?{g:q.g}:{}),...(q.op!=null?{op:q.op}:{}),...(q.bl?{bl:q.bl}:{}),...(q.v===false?{v:false}:{})}:null;const vr=(+q.iv>0)||q.ov;   // pieces with their own pressure or overprinting are wrapped one by one (the pattern's own opacity and blend ride on each); their clip is shared by id
 o.push(...(w?patItems(q).map(i=>{if(!vr)return{...i,...w};const m={...i,...w,wk:i.u};if(cl)m.cwk=q.u;if(w.op!=null||i.op!=null)m.op=Math.round((i.op==null?100:i.op)*(w.op==null?100:w.op)/100);else delete m.op;if(i.bl||w.bl)m.bl=i.bl||w.bl;return m}):patItems(q)))}else o.push(q)});return{...L,pl:o}}

// Empty patterns (2.4.0): each point is drawn as an arrow pointing the way a placed piece would face (its top), so the pattern can be seen and set up before anything is in it.
// The arrows are editor overlay only: they are not part of the picture, nor of an export.
function patArrows(L){const pl=(L.pl||[]).filter(q=>q.k=='pattern'&&q.v!==false&&!(q.src||[]).some(patSrcOk));if(!pl.length)return'';let h='';
 pl.forEach(p=>{const T=patPts(p),{pts,cell,rot}=T,tile=!!T.size,r0=tile?0:cell*patClamp(p.sz||80,5,300)/200;pts.forEach((q,i)=>{const r=tile?T.size[i]/2:r0,a=tile?(rot[i]||0):(+p.rt||0)+(rot?rot[i]||0:0);   /* a tiling's places carry their own size and turn */
  h+=`<path d="M0 ${(r*.8).toFixed(2)}V${(-r).toFixed(2)}M${(-r*.45).toFixed(2)} ${(-r*.5).toFixed(2)}L0 ${(-r).toFixed(2)}L${(r*.45).toFixed(2)} ${(-r*.5).toFixed(2)}" transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)}) rotate(${a.toFixed(1)})" fill="none" stroke="var(--acc)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" pointer-events="none" data-pa="1"/>`})});return h}
// ---- the panel (the Pattern panel's first group)
const patList=()=>{const L=fpL();return L?(L.pl||[]).filter(q=>q.k=='pattern'):[]};
const patCur=()=>{const a=patList();return a.find(q=>q.u==WBS.patSel)||null};
const patHx=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const patCh=()=>{store();upd();if(WBX.wbCap)WBX.wbCap()};
function patSrcName(s){if(s.k=='stamp')return stNmId(s.t);if(s.k=='motif')return mNm(s.m);return String((s.it.tx&&s.it.tx.text)||'Text').replace(/\n/g,' ').slice(0,24)}
function patSync(){const host=$('pelist');if(!host)return;const a=patList(),p=patCur();if(WBS.patSel!=null&&!p&&a.length===0)WBS.patSel=null;
const key=JSON.stringify([a.map(q=>[q.u,q.n]),WBS.patSel,WBS.patSrc,p&&[p.pcm,p.iv,p.ov,JSON.stringify(WBS.dim),CW,CH,p.lay,p.ts,p.ar,p.ps,p.sp,p.cn,p.rn,p.sz,p.rt,p.ox,p.oy,p.in,p.ds,(p.src||[]).map(s=>[s.k,s.t,s.a,s.w,s.it&&s.it.tx&&s.it.tx.text])],WBS.tiles.map(t=>t.id).join()]);
if(host.dataset.k===key)return;host.dataset.k=key;
host.innerHTML=a.slice().reverse().map(q=>`<div class="mr${q.u==WBS.patSel?' on':''}" data-pe="${q.u}"><b>${patHx(q.n)}<i>${(q.src||[]).length} source${(q.src||[]).length==1?'':'s'}</i></b><button type="button" data-pd="${q.u}" aria-label="Delete this pattern">&#215;</button></div>`).join('');
$('peed').hidden=!p;if(!p)return;
$('pelay').querySelectorAll('[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l==p.lay));
// 2.57.0: Tiling shows its tile shape, arrangement, size and spacing; the free layouts their columns, rows and size
{const tile=p.lay=='tile';$('petl').hidden=!tile;$('pefr').hidden=tile;{const lb={radial:['Spokes','Rings'],scatter:['Across','Down'],frame:['Columns','Rows']}[p.lay]||['Columns','Rows'];$('pecn').closest('.ctl').firstElementChild.textContent=lb[0];$('pern').closest('.ctl').firstElementChild.textContent=lb[1]}if(tile){const sh=tlShape(p),ts=$('pets'),ar=$('pear');
 if(!ts.options.length)ts.innerHTML=TL_TS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');const tv=p.ts&&TL_AR[p.ts]?p.ts:'auto';if(ts.value!==tv)ts.value=tv;
 const ah=TL_AR[sh].map(([v,t])=>`<option value="${v}">${t}</option>`).join('');if(ar.dataset.sh!==sh){ar.dataset.sh=sh;ar.innerHTML=ah}const av=tlArr(p,sh);if(ar.value!==av)ar.value=av}}$('peds').querySelectorAll('[data-d]').forEach(b=>b.classList.toggle('on',b.dataset.d==p.ds));
const sv=(id,v)=>{const el=$(id);if(+el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}};sv('peps',+p.ps||12);sv('pesp',+p.sp||0);sv('pecn',p.cn);sv('pern',p.rn);sv('pesz',p.sz);sv('pert',p.rt);sv('peox',+p.ox||0);sv('peoy',+p.oy||0);sv('pein',p.in==null?4:+p.in);sv('peiv',+p.iv||0);{const P=physOf(),r=$('pepur');r.hidden=!P;if(P){const S=Math.min(CW,CH)*Math.max(1,Math.min(100,+p.ps||12))/100,v=physLen(S),u=WBS.dim.u;$('pepuu').textContent=PHU[u];if(document.activeElement!=$('pepu'))$('pepu').value=String(+v.toFixed(u=='px'?0:u=='mm'?1:2))}}$('peov').checked=!!p.ov;$('pepc').querySelectorAll('[data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c==(p.pcm||'')));$('peinr').hidden=p.lay!='frame';
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
$('penew').onclick=()=>{const L=fpL();if(!L)return;L.pl=L.pl||[];const n=patList().length+1,q={u:fpU(),k:'pattern',n:'Pattern '+n,lay:'grid',...patStart(),sz:100,rt:0,ds:'cycle',sd:1+Math.floor(Math.random()*9998),src:[],x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:Math.min(CW,CH),r:0,f:1};L.pl.push(q);WBS.patSel=q.u;patCh()};
$('pelist').onclick=e=>{const L=fpL();if(!L)return;WBS.patSrc=null;const d=e.target.closest('[data-pd]');if(d){const i=L.pl.findIndex(q=>q.u==d.dataset.pd);if(i>=0){L.pl.splice(i,1);if(WBS.patSel==d.dataset.pd)WBS.patSel=null;patCh()}return}const r=e.target.closest('[data-pe]');if(r){WBS.patSel=r.dataset.pe;patSync();}};
const set=(f,v)=>{const p=patCur();if(!p)return;if(p[f]===v)return;p[f]=v;patCh()};
$('pelay').onclick=e=>{const b=e.target.closest('[data-l]');if(b){set('lay',b.dataset.l);$('peinr').hidden=b.dataset.l!='frame'}};
$('pepc').onclick=e=>{const b=e.target.closest('[data-c]'),p=patCur();if(!b||!p)return;const v=b.dataset.c;if((p.pcm||'')===v)return;if(v){p.pcm=v;const ts=(WBS.proj.ts||[]).map(id=>'@'+id);p.pcc=ts.length?ts:[WBS.proj.ink]}else{delete p.pcm;delete p.pcc}patCh()};   // the colours are the tray's, taken when the choice is made
// 2.76.6: once the canvas has a physical size, a piece's size can be given in its unit (2 in, 50 mm); it sets Size (the % of the canvas's short side)
$('pepu').addEventListener('change',()=>{const p=patCur(),v=+$('pepu').value,S=physToCv(v);if(!p||!(S>0))return;const ps=+Math.max(1,Math.min(100,S/Math.min(CW,CH)*100)).toFixed(2);if(ps>60){pmsg('That is larger than a piece can be on this canvas.');patSync();return}if(p.ps!==ps){p.ps=ps;patCh()}});
$('peov').addEventListener('change',()=>{const p=patCur();if(!p)return;if($('peov').checked)p.ov=1;else delete p.ov;patCh()});
$('peds').onclick=e=>{const b=e.target.closest('[data-d]');if(b)set('ds',b.dataset.d)};
$('pets').addEventListener('change',()=>{const p=patCur();if(!p)return;const v=$('pets').value;if((p.ts||'auto')!==v){p.ts=v;delete p.ar;patCh()}});
$('pear').addEventListener('change',()=>{const p=patCur();if(!p)return;const v=$('pear').value;if(p.ar!==v){p.ar=v;patCh()}});
[['peps','ps'],['pesp','sp'],['pecn','cn'],['pern','rn'],['pesz','sz'],['pert','rt'],['peox','ox'],['peoy','oy'],['pein','in'],['peiv','iv']].forEach(([id,f])=>$(id).addEventListener('input',()=>{const p=patCur();if(!p)return;const v=+$(id).value;if(p[f]!==v){p[f]=v;patCh()}}));
$('pesd').onclick=()=>{const p=patCur();if(p){p.sd=1+Math.floor(Math.random()*9998);patCh()}};
// "Add element" (2.4.0): one list of everything a pattern can place: the stamps, the motifs of the library, and the text on the canvas
$('peadd').onclick=e=>{e.stopPropagation();patAddMenu()};
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&WBX.wbLibPick){WBX.wbLibPick=null;pmsg('')}},true);
// 2.31.0: a click on a motif source picks it: the Width and height, Fill and Outline groups come under the sources and set that source's look (79-motif-look.js)
$('pesrc').onclick=e=>{const p=patCur(),x=e.target.closest('[data-sx]');if(p&&x){p.src.splice(+x.dataset.sx,1);WBS.patSrc=null;patCh();return}const r=e.target.closest('[data-look]');if(p&&r&&!e.target.closest('input')){const i=+r.dataset.si;WBS.patSrc=WBS.patSrc===i?null:i;patSync();if(WBX.wbMfSync)WBX.wbMfSync()}};
$('pesrc').addEventListener('change',e=>{const p=patCur(),w=e.target.closest('[data-sw]');if(p&&w){p.src[+w.dataset.sw].w=Math.max(1,Math.min(99,Math.round(+w.value||1)));patCh()}});
WBX.wbPatSync=patSync;WBX.wbPatArrows=patArrows;patSync()}
export {init67,patCur,patExpand,patItems,patPts,patStart,patSync,patNew};
