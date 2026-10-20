import {kv} from '../platform/index.js';
import {$,WBH,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,SH,SHN,SW,rowMenu,useT,shp} from './04-canvas-and-stamp-outlines.js';
import {pal,selOne,store} from './06-motif-library-folders.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {upd} from './11-pressure-flooding-block-edges.js';
// ===== Stamps tool (layer update, step 4) =====
// The Stamps panel lists the project's stamps. A stamp is used on the selected layer when its thumbnail is on (several at once), and each
// stamp has a lock. Only one stamp is unlocked at a time, the unlocked state is never saved, and it ends when another layer is selected.
// The outlines of the selected layer's arrangement are drawn on the canvas (opacity from the panel). The arrangement code in
// 10-layer-grids.js hands every printed stamp to stOlAdd, so the outlines, the hit test and the canvas-to-stamp transform all use the
// same positions that were printed.
const STOLK='wb146_olop',STOLD=60;
const STP={p:{},items:[],on:false,rot:0,un:null,unL:null,op:STOLD,sig:'',ai:null,after:null};
const stIc=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const STLK_ON=stIc('<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),STLK_OFF=stIc('<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/>');
const STTRRE=/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)/;
const stSel=()=>WBS.layers[WBS.selL];
const stName=id=>'Stamp '+(WBS.tiles.findIndex(t=>t.id==id)+1);
// the one unlocked stamp, or null; a different layer, or a stamp that is gone, locks it again
function stUnlocked(){if(STP.un==null)return null;const L=stSel();if(!L||L.u!==STP.unL||!WBS.tiles.some(t=>t.id==STP.un)){STP.un=null;STP.unL=null;return null}return STP.un}
// stamps in this layer's arrangement plus stamps placed freely on the layer, counted once per layer
const stUses=id=>WBS.layers.filter(L=>(L.st||[]).includes(id)||(L.pl||[]).some(p=>p.t==id)).length;
// build() calls these three: begin before the layers are drawn, add for every printed stamp of the selected layer, end after
function stOlBegin(){const L=stSel();STP.on=!!L&&!!L.vis&&(!L.free||(L.pl||[]).some(p=>p.k=='pattern'))&&!(L.fr&&L.fr.on);STP.items=[];STP.rot=0}
function stOlPath(id,d){STP.p[id]={d,p2:null}}
function stOlAdd(id,tr,rot,w,h){if(!STP.on)return;const m=STTRRE.exec(tr);if(!m)return;STP.rot=rot||0;STP.items.push([id,+m[1],+m[2],+m[3],+m[4],+m[5],w,h])}
// The Text panel builds letters in the stamp (letters tagged tg) while a stamp is unlocked, and fills a Text layer otherwise
const stTxMode=()=>stUnlocked()!=null;
function stTextSync(){if(!WBX.wbTxMode)return;const m=stTxMode();if(STP.txm===m)return;STP.txm=m;WBX.wbTxMode(m?'stamp':'pattern')}
function stOlEnd(){stOlPaint();stPanel();stTextSync()}
function stOlFit(){const a=$('art'),v=$('stolsvg');if(!a||!v)return;v.style.width=a.style.width;v.style.height=a.style.height;const vb=a.getAttribute('viewBox');if(vb)v.setAttribute('viewBox',vb)}
function stOlPaint(){const g=$('stol');if(!g)return;stOlFit();if(STP.after)STP.after();const op=STP.op;if(!STP.on||!op||!STP.items.length||WBS.tilePv){g.innerHTML='';return}
 if($('cvclip'))g.setAttribute('clip-path','url(#cvclip)');else g.removeAttribute('clip-path');
 const un=stUnlocked();let h='';
 for(const[id,x,y,a,sx,sy,w,hh]of STP.items){const o=STP.p[id];if(!o)continue;h+=`<path d="${o.d}" class="${id===un?'olu':'olk'}" transform="translate(${x} ${y}) rotate(${a}) scale(${sx} ${sy}) translate(${-w/2} ${-hh/2})"/>`}
 g.setAttribute('opacity',(op/100).toFixed(2));g.innerHTML=STP.rot?`<g transform="rotate(${STP.rot} ${CW/2} ${CH/2})">${h}</g>`:h}
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
function stPick(id){const L=stSel();if(!L)return;const a=L.st=L.st||[],k=a.indexOf(id);if(k<0)a.push(id);else a.splice(k,1);upd()}
function stSig(){const L=stSel()||{},un=stUnlocked();return[WBS.cur,WBS.selL,(L.st||[]).join(),un,WBS.tiles.map(t=>t.id+':'+(t.items||[]).length).join(),WBS.layers.map(l=>(l.st||[]).length+'/'+(l.pl||[]).length).join(),WBS.proj&&WBS.proj.bg].join('|')}
function stPanel(force){const list=$('stmpl');if(!list||!list.offsetParent)return;const sig=stSig();if(!force&&sig===STP.sig&&list.childElementCount)return;STP.sig=sig;
 const L=stSel(),un=stUnlocked(),[pa]=pal(),cur=WBS.tiles[WBS.cur];let h='';
 WBS.tiles.forEach((t,k)=>{useT(t);const on=!!L&&(L.st||[]).includes(t.id),lk=un===t.id,n=stUses(t.id);
  h+=`<div class="smkr${WBS.cur===k?' cur':''}" data-t="${t.id}"><button type="button" class="smkth" aria-pressed="${on}" aria-label="Use Stamp ${k+1} on this layer"><svg viewBox="0 0 ${SW} ${SH}"><path d="${shp(0)}" fill="${pa}"/><use href="#s${t.id}"/></svg></button><span class="smkn">Stamp ${k+1}</span><span class="smkc" aria-label="Used on ${n} ${n==1?'layer':'layers'}">${n}</span><button type="button" class="ib smklk" data-lk aria-pressed="${lk}" aria-label="${lk?'Lock':'Unlock'} Stamp ${k+1}">${lk?STLK_OFF:STLK_ON}</button></div>`});
 if(cur)useT(cur);list.innerHTML=h;
 const ed=$('smked');if(ed){ed.hidden=un==null;ed.textContent=un==null?'':`Editing: ${stName(un)} (used on ${stUses(un)} ${stUses(un)==1?'layer':'layers'})`}}
// ----- the project's stamps: choose one, make a new one, copy one, delete one, keep one in the library, bring the camera to one -----
const stLabel=t=>{WBX.wbLabelPlain={t,at:performance.now()}};
const stAddTo=id=>{const L=stSel();if(L&&!(L.st||[]).includes(id)){L.st=L.st||[];L.st.push(id)}};
const stNo=id=>WBS.tiles.findIndex(t=>t.id==id)+1;
function stCurrent(id){const k=WBS.tiles.findIndex(t=>t.id==id);if(k<0||WBS.cur===k)return;if(STP.un!=null&&STP.un!==id){STP.un=null;STP.unL=null}WBS.cur=k;selOne(-1);STP.ai=null;upd()}
// a new stamp (an outline can be chosen) is added to the selected layer's arrangement, becomes the open stamp and starts locked
function stNew(kind){const t={id:WBS.nid++,items:[],sh:{k:'rect',o:'p',s:[1,1],z:100},sym:{m:'off'},et:0,er:0,es:Math.floor(Math.random()*999),tu:[]};WBS.tiles.push(t);stAddTo(t.id);WBS.cur=WBS.tiles.length-1;selOne(-1);STP.un=null;STP.unL=null;STP.ai=null;
 if(kind&&kind!='rect'){const b=document.querySelector('#skind [data-k="'+kind+'"]');if(b)b.click()}stLabel('New stamp');store();upd();pmsg('Added Stamp '+stNo(t.id)+'.')}
// a copy edits separately from the original
function stDup(){const k=WBS.cur,src=WBS.tiles[k];if(!src)return;const t=JSON.parse(JSON.stringify(src));t.id=WBS.nid++;WBS.tiles.splice(k+1,0,t);stAddTo(t.id);WBS.cur=k+1;selOne(-1);STP.un=null;STP.unL=null;STP.ai=null;stLabel('Duplicated stamp');store();upd();pmsg('Duplicated Stamp '+(k+1)+' as Stamp '+(k+2)+'.')}
// deleting a stamp that is in use takes it out of every arrangement and every free item that points at it, in one step
function stDelete(id){if(WBS.tiles.length<2)return false;const k=WBS.tiles.findIndex(t=>t.id==id);if(k<0)return false;WBS.tiles.splice(k,1);
 WBS.layers.forEach(L=>{L.st=(L.st||[]).filter(x=>x!=id);if(L.lead==id)delete L.lead;if(L.pl)L.pl=L.pl.filter(p=>p.t!=id);if(L.ov)Object.keys(L.ov).forEach(c=>{if(L.ov[c]==id)delete L.ov[c]})});
 WBS.tM=new Set();WBS.cur=Math.min(k,WBS.tiles.length-1);selOne(-1);if(STP.un===id){STP.un=null;STP.unL=null}STP.ai=null;stLabel('Deleted stamp');store();upd();return true}
// the camera goes to one printed copy of the open stamp (the one nearest the middle of the canvas); the layers stay as they are
function stZoom(){const t=WBS.tiles[WBS.cur];if(!t||!WBX.wbZoomTo)return;let best=-1,bd=1e18;STP.items.forEach((it,i)=>{if(it[0]!==t.id)return;const p=stMatrix(it).transformPoint({x:it[6]/2,y:it[7]/2}),d=Math.hypot(p.x-CW/2,p.y-CH/2);if(d<bd){bd=d;best=i}});
 if(best<0)return pmsg('Stamp '+(WBS.cur+1)+' is not on this layer.');
 const it=STP.items[best],M=stMatrix(it),xs=[],ys=[];[[0,0],[it[6],0],[it[6],it[7]],[0,it[7]]].forEach(([u,v])=>{const q=M.transformPoint({x:u,y:v});xs.push(q.x);ys.push(q.y)});
 const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),b=$('boardP'),s=Math.min(8,Math.max(.1,Math.min(b.clientWidth,b.clientHeight)*.8/Math.max(w,h,1)));
 WBX.wbZoomTo(s);const a=$('art'),m=a.getScreenCTM(),P=a.createSVGPoint();P.x=(Math.min(...xs)+Math.max(...xs))/2;P.y=(Math.min(...ys)+Math.max(...ys))/2;const c=P.matrixTransform(m),r=b.getBoundingClientRect();b.scrollLeft+=c.x-(r.left+r.width/2);b.scrollTop+=c.y-(r.top+r.height/2)}
function stBar(){const on=(id,f)=>{const b=$(id);if(b)b.addEventListener('click',f)};
 on('smknew',e=>{e.stopPropagation();const kinds=[...document.querySelectorAll('#skind [data-k]')].map(b=>b.dataset.k);rowMenu($('smknew'),kinds.map(k=>[SHN[k]||k,()=>stNew(k)]))});
 on('smkdup',()=>stDup());
 {const d=$('smkdel');if(d){let tm=0;d.addEventListener('click',()=>{const t=WBS.tiles[WBS.cur];if(!t)return;if(WBS.tiles.length<2){pmsg('A project keeps at least one stamp.');return}
  if(!d.classList.contains('sure')){d.classList.add('sure');d.setAttribute('aria-label','Click to confirm');pmsg('Click again to delete Stamp '+(WBS.cur+1)+'.');tm=setTimeout(()=>{d.classList.remove('sure');d.setAttribute('aria-label','Delete stamp')},3000);return}
  clearTimeout(tm);d.classList.remove('sure');d.setAttribute('aria-label','Delete stamp');const n=WBS.cur+1;if(stDelete(t.id))pmsg('Deleted Stamp '+n+'.')})}}
 on('smkzoom',()=>stZoom());
 on('smksave',()=>{const b=$('slsave');if(b)b.click()});
 on('smklib',()=>{const r=$('rail-slib');if(r)r.click()})}
function stSetOp(v,save){STP.op=Math.max(0,Math.min(100,Math.round(+v)));if(save){try{kv.set(STOLK,String(STP.op))}catch(e){}}stOlPaint()}
function init63(){
 try{const s=kv.get(STOLK);if(s!=null&&s!==''&&isFinite(+s))STP.op=Math.max(0,Math.min(100,+s))}catch(e){}
 try{new ResizeObserver(stOlFit).observe($('art'))}catch(e){}
 const op=$('stmpop');if(op){op.value=STP.op;op.addEventListener('input',()=>stSetOp(op.value,true))}
 const list=$('stmpl');if(list){
  list.addEventListener('click',e=>{const r=e.target.closest('.smkr');if(!r)return;const id=+r.dataset.t;if(e.target.closest('[data-lk]'))stLock(id);else if(e.target.closest('.smkth'))stPick(id);else stCurrent(id)});
 stBar();
  if(typeof IntersectionObserver=='function')new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting))stPanel(true)}).observe(list)}
}
export {STP,stTxMode,stMatrix,stDelete,stDup,stNew,stZoom,init63,stLock,stOlAdd,stOlBegin,stOlEnd,stOlPaint,stOlPath,stPanel,stSetOp,stUnlocked,stampAt,stampToCanvas};
