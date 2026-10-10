import {kv} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {setDim,tileOn} from './04-canvas-and-stamp-outlines.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {buildTex} from './17-texture-panel-and-previews.js';
// ===== Repeat tile (canvas format) =====
// A repeat tile is a rectangular canvas whose edges meet: what runs off one edge comes back on the opposite one, so copies placed side
// by side show no seam. While it is on, the grids stretch a little to fit a whole number of cells, frames and gradients across the
// whole canvas are not drawn, and "Repeat 3 x 3" shows the tile repeated so the seams can be checked. The canvas panel's Format switch
// turns it on; it is saved with the canvas (dim.rt) and can be undone.
function init44(){
  let last='';
  const frames=()=>WBS.layers.filter(L=>L.fr&&L.fr.on&&L.vis!==false).length;
  const grads=()=>{const g=WBX.wbGrade?WBX.wbGrade.get():null;return g?g.masks.filter(m=>m.on&&(m.t=='lin'||m.t=='rad')&&m.sp!='s').length:0};
  WBX.wbTileSet=on=>{
    if(on){WBS.dim={...WBS.dim,rt:1};delete WBS.dim.cs}else{delete WBS.dim.rt;WBS.tilePv=false}
    setDim();WBS.symKey='';try{kv.set('wb14_dim',JSON.stringify(WBS.dim))}catch(e){}
    store();buildTex();upd();if(WBX.wbCap)WBX.wbCap();if(WBX.wbApplyZ)requestAnimationFrame(WBX.wbApplyZ);
  };
  WBX.wbTileUi=()=>{
    const on=tileOn(),n=frames(),g=on?grads():0,key=[on,!!WBS.tilePv,WBS.book.on,n,g].join();if(key===last)return;last=key;
    if(!on&&WBS.tilePv)WBS.tilePv=false;
    document.querySelectorAll('#cfmt [data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f==(WBS.book.on?'book':on?'tile':'free')));
    $('tpvg').hidden=!on;$('tpv').disabled=!on;$('tpv').setAttribute('aria-pressed',String(on&&!!WBS.tilePv));
    $('cshp').hidden=on;const lb=$('cshp').previousElementSibling;if(lb&&lb.tagName=='LABEL')lb.hidden=on;if(on)['crrbox','cngbox','ccobox'].forEach(id=>{$(id).hidden=true});
    const parts=[];if(on&&n)parts.push(n+(n>1?' frames':' frame'));if(g)parts.push(g+(g>1?' gradients':' gradient'));
    $('tpn').hidden=!parts.length;$('tpn').textContent=parts.length?'Hidden on a repeat tile: '+parts.join(', '):'';
    $('artwrap').classList.toggle('tpv',on&&!!WBS.tilePv);
    $('tpx').hidden=!(on&&!!WBS.tilePv);
  };
  // the 3 x 3 view cannot be edited: the pill and Esc both go back to editing
  $('tpx').onclick=()=>$('tpv').click();
  document.addEventListener('keydown',e=>{if(e.key!='Escape'||!WBS.tilePv||document.querySelector('.baX:not(#tpx)')||(e.target.matches&&e.target.matches('input,select,textarea')))return;e.preventDefault();$('tpv').click()});
  $('tpv').onclick=()=>{WBS.tilePv=!WBS.tilePv;last='';buildTex();upd();if(WBX.wbApplyZ)requestAnimationFrame(WBX.wbApplyZ)};
}
export {init44};
