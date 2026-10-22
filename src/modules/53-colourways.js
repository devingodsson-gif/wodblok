import {ICN} from './00-icons.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,rowMenu} from './04-canvas-and-stamp-outlines.js';
import {ser} from './14-presets-and-layer-grid-ui.js';
import {coreStr,pmsg} from './18-projects-and-cover-overlay.js';
import {cwAdd,cwDel,cwMove,cwNow,cwUse,trayDone} from './50-tray-core.js';
import {swBg} from './51-colour-picker.js';
// ===== Colourways =====
// A colourway is one set of colours for the tray's places (see 50-tray-core.js). This tool shows each one as a small picture of the piece in
// those colours; click one to use it (one step in the history). New makes a copy of the one showing; rename, duplicate, move and delete
// from the "..." menu. Exporting them all is in Export recipes (Colourways: All); the Export… button here opens it.
// the piece's own picture with every colour moved to its new place (exact colour words only)
function vrRecolor(svg,from){
  // from: Map of colour (as drawn) -> new colour. Both cases of the hex are swapped.
  let s=svg;const pairs=[...from.entries()].filter(([a,b])=>a&&b&&a!==b);
  // a 6-digit colour must not match the start of an 8-digit one (a see-through colour is a different colour)
  pairs.forEach(([a],k)=>{s=s.replace(new RegExp(a.replace(/[^#0-9a-fA-F]/g,'')+'(?![0-9a-fA-F])','gi'),'\u0001'+k+'\u0001')});
  pairs.forEach(([a,b],k)=>{s=s.split('\u0001'+k+'\u0001').join(a.length==9&&b.length==7?b+a.slice(7):b)});
  return s;
}
const cwEsc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CW_MORE='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICN.more+'</svg>';
const TH=new Map();   // pictures: key (piece + colours) -> data URL
let ren=-1,busy=false,stale=true,timer=0;
const sec=()=>document.querySelector('section.pn[data-p="colors"]');   // 2.11.0: Colourways sit at the bottom of the Colours panel
const isOpen=()=>{const s=sec();return s&&!s.hidden&&s.getClientRects().length>0&&!!$('cwg')&&$('cwg').getClientRects().length>0};
const cwStrip=w=>{const o=WBS.proj;return`<span class="cwst">${o.ts.map(id=>`<i style="background:${swBg(w.c[id])}"></i>`).join('')}</span>`};
function cwPaint(){const g=$('cwg');if(!g)return;const o=WBS.proj,base=coreKey();
 g.innerHTML=o.cw.map((w,i)=>{const k=base+'|'+JSON.stringify(o.ts.map(id=>w.c[id])),u=TH.get(k);
  return`<div class="cwc${i==o.cwa?' on':''}" data-i="${i}" role="listitem" tabindex="0" aria-label="${cwEsc(w.n)}${i==o.cwa?' (showing)':''}"><div class="cwim" style="aspect-ratio:${CW} / ${CH}">${u?`<img src="${u}" alt="">`:'<i></i>'}</div>
<div class="cwm">${i==ren?`<input type="text" maxlength="40" value="${cwEsc(w.n)}" aria-label="Colourway name">`:`<b>${cwEsc(w.n)}</b><button type="button" class="ib" data-more aria-haspopup="menu" aria-expanded="false" aria-label="Actions for ${cwEsc(w.n)}">${CW_MORE}</button>`}</div>${cwStrip(w)}</div>`}).join('');
 const inp=g.querySelector('input');if(inp){inp.focus();inp.select()}
 if(stale||o.cw.some((w,i)=>!TH.get(base+'|'+JSON.stringify(o.ts.map(id=>w.c[id])))))soon()}
// the piece without its tray colours: pictures are remade when the piece changes, not when only the colourway does
function coreKey(){const c=JSON.parse(coreStr());delete c.proj.cw;delete c.proj.cwa;const s=JSON.stringify(c);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)+s.length}
const soon=()=>{clearTimeout(timer);timer=setTimeout(make,700)};
const img=url=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=url});
async function make(){if(busy||!isOpen()||WBX.wbHoldOn||document.body.classList.contains('babusy'))return soon();busy=true;stale=false;
 try{const o=WBS.proj,base=coreKey(),cur=cwNow(o),need=o.cw.map((w,i)=>[w,i,base+'|'+JSON.stringify(o.ts.map(id=>w.c[id]))]).filter(([,,k])=>!TH.has(k));if(!need.length)return;
  const svg=ser();
  for(const [w,,k] of need){const map=new Map();o.ts.forEach(id=>{if(!map.has(cur.c[id]))map.set(cur.c[id],w.c[id])});
   const im=await img('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(w===cur?svg:vrRecolor(svg,map)));if(!im)continue;
   const W=260,H=Math.max(1,Math.round(W*im.naturalHeight/im.naturalWidth)),c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);x.drawImage(im,0,0,W,H);TH.set(k,c.toDataURL('image/jpeg',.82))}
  if(TH.size>120)[...TH.keys()].slice(0,TH.size-120).forEach(k=>TH.delete(k))}
 finally{busy=false}if(isOpen())cwPaint()}
function init53(){const g=$('cwg');
 g.addEventListener('click',e=>{if(e.target.closest('input'))return;const c=e.target.closest('.cwc');if(!c)return;const i=+c.dataset.i,o=WBS.proj,w=o.cw[i];if(!w)return;
  const more=e.target.closest('[data-more]');
  if(more){e.stopPropagation();rowMenu(more,[['Rename',()=>{ren=i;cwPaint()}],['Duplicate',()=>{const k=cwAdd(i);o.cw[k].n=(w.n+' copy').slice(0,40);cwUse(k);trayDone('New colourway');cwPaint()}],
   ['Move left',()=>{cwMove(i,i-1);trayDone('Moved colourway');cwPaint()},i==0],['Move right',()=>{cwMove(i,i+1);trayDone('Moved colourway');cwPaint()},i==o.cw.length-1],
   ['Delete',()=>{const n=w.n;cwDel(i);trayDone('Deleted colourway “'+n+'”');cwPaint();pmsg('Deleted the colourway “'+n+'”.')},o.cw.length<2]]);return}
  if(i!==o.cwa){cwUse(i);trayDone('Colourway “'+w.n+'”');cwPaint()}});
 g.addEventListener('keydown',e=>{const t=e.target;if(t.matches&&t.matches('.cwm input')){e.stopPropagation();if(e.key=='Enter')t.blur();else if(e.key=='Escape'){ren=-1;cwPaint()}return}
  if(t.classList&&t.classList.contains('cwc')&&(e.key=='Enter'||e.key==' ')){e.preventDefault();t.click()}});
 g.addEventListener('focusout',e=>{const t=e.target;if(!t.matches||!t.matches('.cwm input')||ren<0)return;const i=ren,v=t.value.trim().slice(0,40);ren=-1;const w=WBS.proj.cw[i];if(w&&v&&v!==w.n){w.n=v;trayDone('Renamed colourway')}cwPaint()});
 $('cwnew').onclick=()=>{const k=cwAdd();cwUse(k);trayDone('New colourway');ren=k;cwPaint()};
 $('cwgo').onclick=()=>{const p=document.querySelector('section.pn[data-p="xrec"]');if(p&&p.hidden)$('rail-xrec').click();if(WBX.wbXrScope)WBX.wbXrScope('all')};
 // redraw the cards when the tool opens and a moment after the piece changes
 new MutationObserver(()=>{if(isOpen())cwPaint()}).observe(sec(),{attributes:true,attributeFilter:['hidden']});
 $('cwg').closest('details').addEventListener('toggle',()=>{if(isOpen())cwPaint()});
 let lastK='';WBX.wbCwDirty=()=>{stale=true;if(isOpen())soon()};
 const prev=WBX.wbTrayPaint;WBX.wbTrayPaint=f=>{if(prev)prev(f);if(isOpen()){const o=WBS.proj,k=JSON.stringify([o.cw.map(w=>[w.n,o.ts.map(id=>w.c[id])]),o.cwa]);if(k!==lastK||f){lastK=k;cwPaint()}}}}
export {init53};
