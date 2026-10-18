import {kv} from '../platform/index.js';
import {$,WBS} from './01-launch-and-version.js';
import {CH,CW,SH,SW,useT,shp} from './04-canvas-and-stamp-outlines.js';
import {pal} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
// ===== Stamps tool (layer update, step 4) =====
// The Stamps panel lists the project's stamps. A stamp is used on the selected layer when its thumbnail is on (several at once), and each
// stamp has a lock. Only one stamp is unlocked at a time, the unlocked state is never saved, and it ends when another layer is selected.
// The outlines of the selected layer's arrangement are drawn on the canvas (opacity from the panel). The arrangement code in
// 10-layer-grids.js hands every printed stamp to stOlAdd, so the outlines, the hit test and the canvas-to-stamp transform all use the
// same positions that were printed.
const STOLK='wb146_olop',STOLD=60;
const STP={p:{},items:[],on:false,rot:0,un:null,unL:null,op:STOLD,sig:''};
const stIc=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const STLK_ON=stIc('<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),STLK_OFF=stIc('<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/>');
const STTRRE=/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)/;
const stSel=()=>WBS.layers[WBS.selL];
const stName=id=>'Stamp '+(WBS.tiles.findIndex(t=>t.id==id)+1);
// the one unlocked stamp, or null; a different layer, or a stamp that is gone, locks it again
function stUnlocked(){if(STP.un==null)return null;const L=stSel();if(!L||L.u!==STP.unL||!WBS.tiles.some(t=>t.id==STP.un)){STP.un=null;STP.unL=null;return null}return STP.un}
// stamps in this layer's arrangement plus stamps placed freely on the layer, counted once per layer
const stUses=id=>WBS.layers.filter(L=>(L.st||[]).includes(id)||(L.pl||[]).some(p=>p.t==id)).length;
function stAccepts(id){return stUnlocked()===id}
// build() calls these three: begin before the layers are drawn, add for every printed stamp of the selected layer, end after
function stOlBegin(){const L=stSel();STP.on=!!L&&!!L.vis&&!L.free&&!(L.fr&&L.fr.on);STP.items=[];STP.rot=0}
function stOlPath(id,d){STP.p[id]={d,p2:null}}
function stOlAdd(id,tr,rot,w,h){if(!STP.on)return;const m=STTRRE.exec(tr);if(!m)return;STP.rot=rot||0;STP.items.push([id,+m[1],+m[2],+m[3],+m[4],+m[5],w,h])}
function stOlEnd(){stOlPaint();stPanel()}
function stOlFit(){const a=$('art'),v=$('stolsvg');if(!a||!v)return;v.style.width=a.style.width;v.style.height=a.style.height;const vb=a.getAttribute('viewBox');if(vb)v.setAttribute('viewBox',vb)}
function stOlPaint(){const g=$('stol');if(!g)return;stOlFit();const op=STP.op;if(!STP.on||!op||!STP.items.length){g.innerHTML='';return}
 if($('cvclip'))g.setAttribute('clip-path','url(#cvclip)');else g.removeAttribute('clip-path');
 const un=stUnlocked();let h='';
 for(const[id,x,y,a,sx,sy,w,hh]of STP.items){const o=STP.p[id];if(!o)continue;h+=`<path d="${o.d}" class="${id===un?'olu':'olk'}" transform="translate(${x} ${y}) rotate(${a}) scale(${sx} ${sy}) translate(${-w/2} ${-hh/2})"/>`}
 g.setAttribute('opacity',(op/100).toFixed(2));g.innerHTML=STP.rot?`<g transform="rotate(${STP.rot} ${CW/2} ${CH/2})">${h}</g>`:h}
// ----- finding the stamp under a point, and moving the point into the stamp's own space -----
let _cx=null;
const stCtx=()=>_cx||(_cx=document.createElement('canvas').getContext('2d'));
function stMatrix(it){const[,x,y,a,sx,sy,w,h]=it,m=new DOMMatrix();if(STP.rot)m.translateSelf(CW/2,CH/2).rotateSelf(STP.rot).translateSelf(-CW/2,-CH/2);return m.translateSelf(x,y).rotateSelf(a).scaleSelf(sx,sy).translateSelf(-w/2,-h/2)}
// canvas point (x, y) -> the stamp instance printed there on the selected layer: {t: stamp id, i: instance number, u, v: the point in the stamp's own coordinates}
function stampAt(x,y){for(let i=STP.items.length-1;i>=0;i--){const it=STP.items[i],o=STP.p[it[0]];if(!o)continue;const q=stMatrix(it).inverse().transformPoint({x,y});
  if(!o.p2)o.p2=new Path2D(o.d);if(stCtx().isPointInPath(o.p2,q.x,q.y))return{t:it[0],i,u:q.x,v:q.y}}return null}
// the other way: a point in a printed instance's own space -> canvas coordinates
function stampToCanvas(i,u,v){const it=STP.items[i];if(!it)return null;const q=stMatrix(it).transformPoint({x:u,y:v});return{x:q.x,y:q.y}}
// ----- the panel -----
function stLock(id){if(stUnlocked()===id){STP.un=null;STP.unL=null}else{STP.un=id;STP.unL=(stSel()||{}).u||null}stOlPaint();stPanel(true)}
function stPick(id){const L=stSel();if(!L)return;const a=L.st=L.st||[],k=a.indexOf(id);if(k<0)a.push(id);else a.splice(k,1);upd()}
function stSig(){const L=stSel()||{},un=stUnlocked();return[WBS.selL,(L.st||[]).join(),un,WBS.tiles.map(t=>t.id+':'+(t.items||[]).length).join(),WBS.layers.map(l=>(l.st||[]).length+'/'+(l.pl||[]).length).join(),WBS.proj&&WBS.proj.bg].join('|')}
function stPanel(force){const list=$('stmpl');if(!list||!list.offsetParent)return;const sig=stSig();if(!force&&sig===STP.sig&&list.childElementCount)return;STP.sig=sig;
 const L=stSel(),un=stUnlocked(),[pa]=pal(),cur=WBS.tiles[WBS.cur];let h='';
 WBS.tiles.forEach((t,k)=>{useT(t);const on=!!L&&(L.st||[]).includes(t.id),lk=un===t.id,n=stUses(t.id);
  h+=`<div class="smkr${on?' on':''}" data-t="${t.id}"><button type="button" class="smkth" aria-pressed="${on}" aria-label="Use Stamp ${k+1} on this layer"><svg viewBox="0 0 ${SW} ${SH}"><path d="${shp(0)}" fill="${pa}"/><use href="#s${t.id}"/></svg></button><span class="smkn">Stamp ${k+1}</span><span class="smkc" aria-label="Used on ${n} ${n==1?'layer':'layers'}">${n}</span><button type="button" class="ib smklk" data-lk aria-pressed="${lk}" aria-label="${lk?'Lock':'Unlock'} Stamp ${k+1}">${lk?STLK_OFF:STLK_ON}</button></div>`});
 if(cur)useT(cur);list.innerHTML=h;
 const ed=$('smked');if(ed){ed.hidden=un==null;ed.textContent=un==null?'':`Editing: ${stName(un)} (used on ${stUses(un)} ${stUses(un)==1?'layer':'layers'})`}}
function stSetOp(v,save){STP.op=Math.max(0,Math.min(100,Math.round(+v)));if(save){try{kv.set(STOLK,String(STP.op))}catch(e){}}stOlPaint()}
function init63(){
 try{const s=kv.get(STOLK);if(s!=null&&s!==''&&isFinite(+s))STP.op=Math.max(0,Math.min(100,+s))}catch(e){}
 try{new ResizeObserver(stOlFit).observe($('art'))}catch(e){}
 const op=$('stmpop');if(op){op.value=STP.op;op.addEventListener('input',()=>stSetOp(op.value,true))}
 const list=$('stmpl');if(list){
  list.addEventListener('click',e=>{const r=e.target.closest('.smkr');if(!r)return;const id=+r.dataset.t;if(e.target.closest('[data-lk]'))stLock(id);else stPick(id)});
  if(typeof IntersectionObserver=='function')new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting))stPanel(true)}).observe(list)}
}
export {STP,init63,stAccepts,stLock,stOlAdd,stOlBegin,stOlEnd,stOlPaint,stOlPath,stPanel,stSetOp,stUnlocked,stampAt,stampToCanvas};
