import {ICN} from './00-icons.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,hEsc,rowMenu,SH,SHN,shp,stFreeNm,stNm,stNmId,SW,useT} from './04-canvas-and-stamp-outlines.js';
import {pal,selOne,store} from './06-motif-library-folders.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {upd} from './11-pressure-flooding-block-edges.js';
// ===== Stamps tool (layer update, step 4) =====
// The Stamps panel lists the project's stamps. A stamp is used on the selected layer when its thumbnail is on (several at once), and each
// stamp has a lock. Only one stamp is unlocked at a time, the unlocked state is never saved, and it ends when another layer is selected.
// The outlines of the selected layer's arrangement are drawn on the canvas (opacity from the panel). The arrangement code in
// 10-layer-grids.js hands every printed stamp to stOlAdd, so the outlines, the hit test and the canvas-to-stamp transform all use the
// same positions that were printed.
const STP={p:{},items:[],on:false,rot:0,un:null,unL:null,sig:'',ai:null,after:null,ren:null};
const stIc=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const STEDIT=stIc(ICN.pencil);   // the Edit pencil on a stamp row (2.5.0, was the lock)
const STTRRE=/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)/;
const stSel=()=>WBS.layers[WBS.selL];
const stName=id=>stNmId(id);
// the one unlocked stamp, or null; a different layer, or a stamp that is gone, locks it again
function stUnlocked(){if(STP.un==null)return null;const L=stSel();if(!L||L.u!==STP.unL||!WBS.tiles.some(t=>t.id==STP.un)){STP.un=null;STP.unL=null;return null}return STP.un}
// stamps in this layer's arrangement plus stamps placed freely on the layer, counted once per layer
const stUses=id=>WBS.layers.reduce((n,L)=>n+(L.pl||[]).filter(p=>p.t==id||(p.k=='pattern'&&(p.src||[]).some(s=>s.t==id))).length,0);
// build() calls these three: begin before the layers are drawn, add for every printed stamp of the selected layer, end after
function stOlBegin(){const L=stSel();STP.on=!!L&&!!L.vis&&(!L.free||(L.pl||[]).some(p=>p.k=='pattern')||(!!WBX.wbSteScene&&WBX.wbSteScene()!=null))&&!(L.fr&&L.fr.on);STP.items=[];STP.rot=0}
function stOlPath(id,d){STP.p[id]={d,p2:null}}
function stOlAdd(id,tr,rot,w,h){if(!STP.on)return;const m=STTRRE.exec(tr);if(!m)return;STP.rot=rot||0;STP.items.push([id,+m[1],+m[2],+m[3],+m[4],+m[5],w,h])}
// The Text panel builds letters in the stamp (letters tagged tg) while a stamp is unlocked, and fills a Text layer otherwise
const stTxMode=()=>stUnlocked()!=null;
function stTextSync(){if(!WBX.wbTxMode)return;const m=stTxMode();if(STP.txm===m)return;STP.txm=m;WBX.wbTxMode(m?'stamp':'pattern')}
function stOlEnd(){stOlPaint();stPanel();stTextSync()}
function stOlFit(){const a=$('art'),v=$('stolsvg');if(!a||!v)return;v.style.width=a.style.width;v.style.height=a.style.height;const vb=a.getAttribute('viewBox');if(vb)v.setAttribute('viewBox',vb)}
function stOlPaint(){const g=$('stol');if(g&&g.firstChild)g.innerHTML='';stOlFit();if(STP.after)STP.after()}   // 2.13.0: the stamp outlines are no longer drawn; the stamp tab's own editing frame (sceDraw) still is
// ----- finding the stamp under a point, and moving the point into the stamp's own space -----
let _cx=null;
const stCtx=()=>_cx||(_cx=document.createElement('canvas').getContext('2d'));
function stMatrix(it){const[,x,y,a,sx,sy,w,h]=it,m=new DOMMatrix();if(STP.rot)m.translateSelf(CW/2,CH/2).rotateSelf(STP.rot).translateSelf(-CW/2,-CH/2);return m.translateSelf(x,y).rotateSelf(a).scaleSelf(sx,sy).translateSelf(-w/2,-h/2)}
// canvas point (x, y) -> the stamp instance printed there on the selected layer: {t: stamp id, i: instance number, u, v: the point in the stamp's own coordinates}
function stampAt(x,y,only){for(let i=STP.items.length-1;i>=0;i--){const it=STP.items[i],o=STP.p[it[0]];if(!o||(only!=null&&it[0]!==only))continue;const q=stMatrix(it).inverse().transformPoint({x,y});
  if(!o.p2)o.p2=new Path2D(o.d);if(stCtx().isPointInPath(o.p2,q.x,q.y))return{t:it[0],i,u:q.x,v:q.y}}return null}
// the other way: a point in a printed instance's own space -> canvas coordinates
function stampToCanvas(i,u,v){const it=STP.items[i];if(!it)return null;const q=stMatrix(it).transformPoint({x:u,y:v});return{x:q.x,y:q.y}}
// ----- the panel -----
function stLock(id){if(stUnlocked()===id){STP.un=null;STP.unL=null;selOne(-1)}else{STP.un=id;STP.unL=(stSel()||{}).u||null;const k=WBS.tiles.findIndex(t=>t.id==id);if(k>=0&&WBS.cur!=k){WBS.cur=k;selOne(-1)}}STP.ai=null;stOlPaint();stPanel(true);stTextSync();if(WBX.wbGrade)WBX.wbGrade.refresh();WBH.draw()}
function stSig(){const L=stSel()||{},un=stUnlocked();return[STP.ren,WBS.tiles.map(t=>t.nm||'').join('\u0001'),WBS.cur,WBS.selL,(L.st||[]).join(),un,WBS.tiles.map(t=>t.id+':'+(t.items||[]).length).join(),WBS.layers.map(l=>(l.st||[]).length+'/'+(l.pl||[]).length).join(),WBS.proj&&WBS.proj.bg].join('|')}
// 2.44.2: the list is skipped while its panel is hidden by asking the panel, not by reading offsetParent (which forced a layout of the page right after every redraw)
// 2.77.0: a hidden list that no longer matches the stamps is emptied (a roll can take stamps away, and its pictures would point at them); it is made again when the panel opens
function stPanel(force){const list=$('stmpl');if(!list)return;const sc=list.closest('section.pn');if(sc&&sc.hidden){if(list.childElementCount&&stSig()!==STP.sig)list.textContent='';return}const sig=stSig();if(!force&&sig===STP.sig&&list.childElementCount)return;STP.sig=sig;
 const L=stSel(),un=stUnlocked(),[pa]=pal(),cur=WBS.tiles[WBS.cur];let h='';
 WBS.tiles.forEach((t,k)=>{useT(t);const lk=un===t.id,n=stUses(t.id);
  h+=`<div class="smkr${WBS.cur===k?' cur':''}" data-t="${t.id}"><button type="button" class="smkth" aria-label="${hEsc(stNm(t))}"><svg viewBox="0 0 ${SW} ${SH}"><path d="${shp(0)}" fill="${pa}"/><use href="#s${t.id}"/></svg></button><span class="smkn">${STP.ren===t.id?`<input value="${hEsc(stNm(t))}" maxlength="40" aria-label="Stamp name">`:hEsc(stNm(t))}</span><span class="smkc" aria-label="Used by ${n} ${n==1?'element':'elements'}">${n}</span><button type="button" class="ib smklk" data-lk aria-pressed="${lk}" aria-label="Edit ${hEsc(stNm(t))}">${STEDIT}</button></div>`});
 if(cur)useT(cur);list.innerHTML=h;stRenWire(list);
 const ed=$('smked');if(ed){ed.hidden=un==null;ed.textContent=un==null?'':`${stName(un)} · ${stUses(un)} ${stUses(un)==1?'element':'elements'}`}}
// A stamp is renamed in place (2.28.0), like a row of the Elements list: double-click its name, Enter or a click elsewhere keeps it, Esc leaves it as it was
function stRenWire(list){const inp=list.querySelector('.smkn input');if(!inp)return;inp.focus();inp.select();
 const done=ok=>{if(STP.ren==null)return;const t=WBS.tiles.find(x=>x.id===STP.ren);STP.ren=null;const v=inp.value.replace(/[\u0000-\u001f]/g,'').trim().slice(0,40);
  if(ok&&t&&v&&v!==stNm(t)){t.nm=v;stLabel('Renamed stamp');store();upd();if(WBX.wbCap)WBX.wbCap()}else stPanel(true)};
 inp.onkeydown=e=>{e.stopPropagation();if(e.key=='Enter')done(1);else if(e.key=='Escape')done(0)};inp.onblur=()=>done(1);inp.onclick=e=>e.stopPropagation()}
const stRename=id=>{if(!WBS.tiles.some(t=>t.id===id))return;STP.ren=id;stPanel(true)};
// ----- the project's stamps: choose one, make a new one, copy one, delete one, keep one in the library, bring the camera to one -----
const stLabel=t=>{WBX.wbLabelPlain={t,at:performance.now()}};
const stAddTo=id=>{const L=stSel();if(L&&!(L.st||[]).includes(id)){L.st=L.st||[];L.st.push(id)}};
const stNo=id=>WBS.tiles.findIndex(t=>t.id==id)+1;
function stCurrent(id){const k=WBS.tiles.findIndex(t=>t.id==id);if(k<0||WBS.cur===k)return;if(STP.un!=null&&STP.un!==id){STP.un=null;STP.unL=null}WBS.cur=k;selOne(-1);STP.ai=null;upd()}
// a new stamp (an outline can be chosen) is added to the selected layer's arrangement, becomes the open stamp and starts locked
function stNew(kind){const t={id:WBS.nid++,items:[],sh:{k:'rect',o:'p',s:[1,1],z:100},sym:{m:'off'},et:0,er:0,es:Math.floor(Math.random()*999),tu:[]};t.nm=stFreeNm();WBS.tiles.push(t);stAddTo(t.id);WBS.cur=WBS.tiles.length-1;selOne(-1);STP.un=null;STP.unL=null;STP.ai=null;
 if(kind&&kind!='rect'){const b=document.querySelector('#skind [data-k="'+kind+'"]');if(b)b.click()}stLabel('New stamp');store();upd();pmsg('Added '+stNm(t)+'.');if(WBX.wbSteGo)WBX.wbSteGo(t.id)}   // (2.25.0) a new stamp opens in its tab, where it can be seen and filled
// a copy edits separately from the original
function stDup(){const k=WBS.cur,src=WBS.tiles[k];if(!src)return;const t=JSON.parse(JSON.stringify(src));t.id=WBS.nid++;t.nm=(stNm(src)+' copy').slice(0,40);WBS.tiles.splice(k+1,0,t);stAddTo(t.id);WBS.cur=k+1;selOne(-1);STP.un=null;STP.unL=null;STP.ai=null;stLabel('Duplicated stamp');store();upd();pmsg('Duplicated '+stNm(src)+'.')}
// deleting a stamp that is in use takes it out of every arrangement and every free item that points at it, in one step
// how many patterns and placed stamps use a stamp (2.24.0: deleting asks with this count, and its patterns let go of it too)
function stUseN(id){let pa=0,el=0;WBS.layers.forEach(L=>(L.pl||[]).forEach(p=>{if(p.k=='pattern'){if((p.src||[]).some(r=>r.k=='stamp'&&r.t==id))pa++}else if(p.t==id)el++}));return{pa,el}}
const stUseSay=id=>{const u=stUseN(id),w=[];if(u.pa)w.push(u.pa+' pattern'+(u.pa>1?'s':''));if(u.el)w.push(u.el+' placed cop'+(u.el>1?'ies':'y'));return w.length?' It is used by '+w.join(' and ')+'.':''};
function stDelete(id){const k=WBS.tiles.findIndex(t=>t.id==id);if(k<0)return false;WBS.tiles.splice(k,1);
 WBS.layers.forEach(L=>{L.st=(L.st||[]).filter(x=>x!=id);if(L.lead==id)delete L.lead;if(L.pl)L.pl=L.pl.filter(p=>p.k=='pattern'||p.t!=id).map(p=>p.k=='pattern'&&Array.isArray(p.src)&&p.src.some(r=>r.k=='stamp'&&r.t==id)?{...p,src:p.src.filter(r=>!(r.k=='stamp'&&r.t==id))}:p);if(L.ov)Object.keys(L.ov).forEach(c=>{if(L.ov[c]==id)delete L.ov[c]})});
 WBS.tM=new Set();WBS.cur=Math.max(0,Math.min(k,WBS.tiles.length-1));selOne(-1);if(STP.un===id){STP.un=null;STP.unL=null}STP.ai=null;stLabel('Deleted stamp');store();upd();return true}
// the camera goes to one printed copy of the open stamp (the one nearest the middle of the canvas); the layers stay as they are
function stZoom(){const t=WBS.tiles[WBS.cur];if(!t||!WBX.wbZoomTo)return;let best=-1,bd=1e18;STP.items.forEach((it,i)=>{if(it[0]!==t.id)return;const p=stMatrix(it).transformPoint({x:it[6]/2,y:it[7]/2}),d=Math.hypot(p.x-CW/2,p.y-CH/2);if(d<bd){bd=d;best=i}});
 if(best<0)return pmsg(stNm(t)+' is not on this layer.');
 const it=STP.items[best],M=stMatrix(it),xs=[],ys=[];[[0,0],[it[6],0],[it[6],it[7]],[0,it[7]]].forEach(([u,v])=>{const q=M.transformPoint({x:u,y:v});xs.push(q.x);ys.push(q.y)});
 const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),b=$('boardP'),s=Math.min(8,Math.max(.1,Math.min(b.clientWidth,b.clientHeight)*.8/Math.max(w,h,1)));
 WBX.wbZoomTo(s);const a=$('art'),m=a.getScreenCTM(),P=a.createSVGPoint();P.x=(Math.min(...xs)+Math.max(...xs))/2;P.y=(Math.min(...ys)+Math.max(...ys))/2;const c=P.matrixTransform(m),r=b.getBoundingClientRect();b.scrollLeft+=c.x-(r.left+r.width/2);b.scrollTop+=c.y-(r.top+r.height/2)}
function stBar(){const on=(id,f)=>{const b=$(id);if(b)b.addEventListener('click',f)};
 on('smknew',()=>stNew('rect'));   // like every Add button: it makes one at once (2.15.0) and opens its tab (2.25.0); the outline is changed in the stamp's tab
 on('smkdup',()=>stDup());
 {const d=$('smkdel');if(d){let tm=0;d.addEventListener('click',()=>{const t=WBS.tiles[WBS.cur];if(!t)return;
  if(!d.classList.contains('sure')){d.classList.add('sure');d.setAttribute('aria-label','Click to confirm');pmsg('Click again to delete '+stNm(t)+'.'+stUseSay(t.id));tm=setTimeout(()=>{d.classList.remove('sure');d.setAttribute('aria-label','Delete stamp')},3000);return}
  clearTimeout(tm);d.classList.remove('sure');d.setAttribute('aria-label','Delete stamp');const n=stNm(t);if(stDelete(t.id))pmsg('Deleted '+n+'.')})}}
 on('smkzoom',()=>stZoom());
 on('smksave',()=>{const b=$('slsave');if(b)b.click()})}
function init63(){
 try{new ResizeObserver(stOlFit).observe($('art'))}catch(e){}
 const list=$('stmpl');if(list){
  list.addEventListener('dblclick',e=>{const n=e.target.closest('.smkn');const r=n&&n.closest('.smkr');if(!r||n.querySelector('input'))return;stRename(+r.dataset.t)});
  list.addEventListener('click',e=>{const r=e.target.closest('.smkr');if(!r||e.target.closest('.smkn input'))return;const id=+r.dataset.t;if(e.target.closest('[data-lk]')){if(WBX.wbSteEdit)WBX.wbSteEdit(id);else stLock(id)}else if(stUnlocked()!=null&&stUnlocked()!==id&&WBX.wbSteEdit)WBX.wbSteEdit(id);else stCurrent(id)});   // 2.79.1 (owner Oct 31 2026): in a stamp's tab, another stamp's row opens that stamp's tab
 stBar();
  if(typeof IntersectionObserver=='function')new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting))stPanel(true)}).observe(list)}
}
export {STP,stTxMode,stMatrix,stDelete,stDup,stNew,stZoom,init63,stLock,stOlAdd,stOlBegin,stOlEnd,stOlPaint,stOlPath,stPanel,stUnlocked,stampAt,stampToCanvas};
