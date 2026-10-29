import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {setDim,tileOn,tileRk} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {buildTex} from './17-texture-panel-and-previews.js';
import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {ser} from './14-presets-and-layer-grid-ui.js';
// ===== Repeat tile (canvas format) =====
// A repeat tile is a rectangular canvas whose edges meet: what runs off one edge comes back on the opposite one, so copies placed side
// by side show no seam. While it is on, the grids stretch a little to fit a whole number of cells, frames and gradients across the
// whole canvas are not drawn, and "Repeat 3 x 3" shows the tile repeated so the seams can be checked. The canvas panel's Format switch
// turns it on; it is saved with the canvas (dim.rt) and can be undone.
function init44(){
  let last='';
  const tloSet=v=>{v=Math.round(+v);if(!(v>=0))v=92;v=Math.min(100,v);$('artwrap').style.setProperty('--tlo',v+'%');return v};
  try{const v=kv.get('wb_tlo');if(v!=null&&v!=='')$('tlo').value=tloSet(v);else tloSet(92)}catch(e){tloSet(92)}
  $('tlo').addEventListener('input',()=>{const v=tloSet($('tlo').value);try{kv.set('wb_tlo',String(v))}catch(e){}});
  const frames=()=>WBS.layers.filter(L=>L.fr&&L.fr.on&&L.vis!==false).length;
  const grads=()=>{const g=WBX.wbGrade?WBX.wbGrade.get():null;return g?g.masks.filter(m=>m.on&&(m.t=='lin'||m.t=='rad')&&m.sp!='s').length:0};
  WBX.wbTileSet=on=>{
    if(on){WBS.dim={...WBS.dim,rt:1}}else{delete WBS.dim.rt;WBS.tilePv=false;WBS.tpvImg=''}
    setDim();WBS.symKey='';try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}
    store();buildTex();upd();if(WBX.wbCap)WBX.wbCap();if(WBX.wbApplyZ)requestAnimationFrame(WBX.wbApplyZ);
  };
  WBX.wbTileUi=()=>{
    const on=tileOn(),n=frames(),g=on?grads():0,key=[on,!!WBS.tilePv,WBS.book.on,n,g,tileRk()].join();if(key===last)return;last=key;
    if(!on&&WBS.tilePv){WBS.tilePv=false;WBS.tpvImg=''}
    document.querySelectorAll('#cfmt [data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f==(WBS.book.on?'book':on?'tile':'free')));
    $('tlobox').hidden=!on;$('tlrkbox').hidden=!on;$('xrrq').hidden=!on;$('xrrp').disabled=$('xrrt').disabled=!on;$('tlrk').querySelectorAll('[data-k]').forEach(b=>{const o=b.dataset.k==tileRk();b.classList.toggle('on',o);b.setAttribute('aria-pressed',String(o))});$('tpvg').hidden=!on;$('tpv').disabled=!on;$('tpv').setAttribute('aria-pressed',String(on&&!!WBS.tilePv));
    
    const parts=[];if(on&&n)parts.push(n+(n>1?' frames':' frame'));if(g)parts.push(g+(g>1?' gradients':' gradient'));
    $('tpn').hidden=!parts.length;$('tpn').textContent=parts.length?'Hidden on a repeat tile: '+parts.join(', '):'';
    $('artwrap').classList.toggle('tpv',on&&!!WBS.tilePv);$('artwrap').classList.toggle('tpvk',tileRk()!='grid');
    $('tpx').hidden=!(on&&!!WBS.tilePv);
  };
  // 2.76.6: Grid, Brick or Half drop: how the tile repeats (dim.rk); the wrap at the edges, the 3 x 3 view and the exported repeat unit all follow it
  $('tlrk').onclick=e=>{const b=e.target.closest('[data-k]');if(!b||b.dataset.k==tileRk())return;if(b.dataset.k=='grid')delete WBS.dim.rk;else WBS.dim.rk=b.dataset.k;
   WBS.symKey='';try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}WBS.tpvImg='';store();buildTex();upd();if(WBX.wbCap)WBX.wbCap();if(WBS.tilePv)tpvMake()};
  // the 3 x 3 view cannot be edited: the pill and Esc both go back to editing
  $('tpx').onclick=()=>$('tpv').click();
  document.addEventListener('keydown',e=>{if(e.key!='Escape'||!WBS.tilePv||document.querySelector('.baX')||(e.target.matches&&e.target.matches('input,select,textarea')))return;e.preventDefault();$('tpv').click()});
  // 2.66.2: the 3 x 3 view is a picture of the tile, shown nine times. It drew the whole drawing twenty-five times with every filter widened to the 3 x 3, and a
  // roll full of effects stalled the page for minutes. The picture is made as an export is (the tile, as it is saved), at about the size it shows, and made again
  // a moment after anything changes while the view is on.
  let tpvUrl='',tpvTok=0,tpvT=0,tpvQuiet=0;
  const tpvMake=()=>{if(!WBS.tilePv||!tileOn())return;const tok=++tpvTok;tpvQuiet=performance.now()+500;let svg='';try{svg=ser()}catch(e){return}
   const r=$('artwrap').getBoundingClientRect(),cell=Math.max(256,Math.min(2048,Math.round(Math.max(r.width,r.height)/3*(window.devicePixelRatio||1)*1.5))),k=cell/Math.max(CW,CH),w=Math.max(1,Math.round(CW*k)),h=Math.max(1,Math.round(CH*k)),img=new Image();
   img.onload=()=>{if(tok!==tpvTok||!WBS.tilePv)return;const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
    c.toBlob(b=>{if(!b||tok!==tpvTok||!WBS.tilePv)return;if(tpvUrl)URL.revokeObjectURL(tpvUrl);tpvUrl=URL.createObjectURL(b);WBS.tpvImg=tpvUrl;tpvQuiet=performance.now()+500;upd();if(WBX.wbApplyZ)requestAnimationFrame(WBX.wbApplyZ)},'image/png')};
   img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)};
  WBX.wbTpvDrawn=()=>{if(!WBS.tilePv||performance.now()<tpvQuiet)return;clearTimeout(tpvT);tpvT=setTimeout(tpvMake,300)};
  $('tpv').onclick=()=>{WBS.tilePv=!WBS.tilePv;WBS.tpvImg='';clearTimeout(tpvT);tpvTok++;if(!WBS.tilePv&&tpvUrl){URL.revokeObjectURL(tpvUrl);tpvUrl=''}last='';buildTex();upd();if(WBX.wbApplyZ)requestAnimationFrame(WBX.wbApplyZ);if(WBS.tilePv)tpvMake()};
}
export {init44};
