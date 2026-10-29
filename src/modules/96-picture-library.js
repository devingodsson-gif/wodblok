import {$,WBS,WBX} from './01-launch-and-version.js';
import {store} from './06-motif-library-folders.js';
import {upd} from './11-pressure-flooding-block-edges.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {artBU,artEnc,artId,artRefd} from './25-art-layers.js';
import {ltMake} from './87-library-tree.js';

// ===== The Pictures library (2.75.0, owner Oct 29 2026: "a panel to see all the images we have imported across all elements"). It is the Image panel's library:
// every picture in this project (WBS.ARTS: imported for an Image, a shape's or a Sheet's fill, a stamp's shape), shown as cards in the folder tree every library uses
// (87-library-tree.js). Creating, a pick makes a new Image of it; with an Image selected, Replace opens it and a pick swaps the picture. Import image adds pictures.
// A picture's folder is kept on the picture (ARTS[id].f). A picture in use cannot be deleted; one not in use is not saved with the project (as before).
const PC_UI='wb261_picturesui';
let PT=null,PC_F=[];
const pcIds=()=>Object.keys(WBS.ARTS).filter(i=>WBS.ARTS[i]&&WBS.ARTS[i].k=='img');
const pcEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// a picture file -> a new picture of this project (at most 2000 pixels on its long side, as Import image always made them); returns its id
async function pcImport(f){if(!f||!/^image\//.test(f.type)){pmsg('That file is not an image.');return null}if(f.size>30e6){pmsg('That image is too large. Try one under 30 MB.');return null}
 const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=()=>r(null);fr.readAsDataURL(f)}),img=url&&await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=url});
 if(!img){pmsg('Could not read that image.');return null}const nw=img.naturalWidth||img.width||1000,nh=img.naturalHeight||img.height||1000,k=Math.min(1,2000/Math.max(nw,nh)),w=Math.max(1,Math.round(nw*k)),h=Math.max(1,Math.round(nh*k)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
 const id=artId();WBS.ARTS[id]={n:(f.name||'Image').replace(/\.[^.]+$/,'').replace(/["<>&|]/g,'').slice(0,40)||'Image',k:'img',src:artEnc(c),w,h};const here=PT&&PT.here();if(here)WBS.ARTS[id].f=here;return id}
const pcCfg=()=>({p:'pc',pane:'#impane',word:'picture',words:'pictures',ui:PC_UI,cards:true,z:5,exportName:'wodblok-pictures',exportAs:'pictures',usedFix:'Take it out of the elements that use it first.',
 top:`<div class="row"><button type="button" class="primary" data-pcadd>Import image&#8230;</button></div><input type="file" class="pcfile vh" accept="image/*" multiple tabindex="-1">`,
 read(){const at={};pcIds().forEach(i=>{at[i]=WBS.ARTS[i].f||''});const f=[...new Set([...PC_F,...Object.values(at).filter(Boolean)])];return{f,at,b:{},h:[],r:{}}},
 write(m){PC_F=m.f.slice();Object.keys(m.at).forEach(i=>{const A=WBS.ARTS[i];if(!A)return;if(m.at[i])A.f=m.at[i];else delete A.f})},
 sets:()=>[],name:id=>WBS.ARTS[id]?WBS.ARTS[id].n:null,own:()=>true,used:id=>artRefd(id),
 tile:id=>{const A=WBS.ARTS[id];return A?`<img src="${artBU(A)}" alt="" loading="lazy" decoding="async" draggable="false"><b>${pcEsc(A.n)}</b>`:''},
 remove(list){list.forEach(i=>{if(!artRefd(i))delete WBS.ARTS[i]});store();upd()},
 rename(id,v){const A=WBS.ARTS[id];if(A){A.n=String(v).replace(/["<>&|]/g,'').slice(0,40)||A.n;store();upd()}},
 file(id){const A=WBS.ARTS[id];if(!A)return null;try{const s=A.src,i=s.indexOf(','),bin=atob(s.slice(i+1)),u=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)u[j]=bin.charCodeAt(j);const t=s.slice(5,s.indexOf(';'));return{name:A.n,data:u,ext:'.'+(t.split('/')[1]||'png').replace('jpeg','jpg'),fb:'Picture'}}catch(e){return null}},
 wire(pane){const add=pane.querySelector('[data-pcadd]');if(!add||add.dataset.w)return;add.dataset.w='1';const file=pane.querySelector('.pcfile');add.onclick=()=>{file.value='';file.click()};
  file.onchange=async()=>{const fl=[...(file.files||[])];file.value='';let last=null;for(const f of fl){const id=await pcImport(f);if(id)last=id}if(!last)return;
   // creating: the last picture becomes a new Image; an Image selected takes it
   const q=WBX.wbImSel&&WBX.wbImSel();if(q){if(WBX.wbImSwap(q,last)!==false){store();upd()}}else if(WBX.wbImageAdd)WBX.wbImageAdd(last);pcPaint(true)}}});
// a pick: an Image selected takes the picture, else a new Image is made of it
function pcPick(id){const q=WBX.wbImSel&&WBX.wbImSel();if(q){if(WBX.wbImSwap(q,id)!==false){store();upd()}return}if(WBX.wbImageAdd)WBX.wbImageAdd(id)}
// the library draws again when the project's pictures or the selected Image change
let pcKey='';
function pcPaint(force){const pane=$('impane');if(!pane||!PT)return;const q=WBX.wbImSel&&WBX.wbImSel(),k=pcIds().map(i=>i+':'+WBS.ARTS[i].n+':'+(WBS.ARTS[i].f||'')+(artRefd(i)?'u':'')).join('|')+'#'+(q?q.a:'');
 if(!force&&k===pcKey)return;pcKey=k;PT.show(pane,q?q.a:null,pcPick)}
function init96(){PT=ltMake(pcCfg());PT.init();$('impane').innerHTML=PT.paneHtml();WBX.wbPicImport=pcImport;WBX.wbPicPaint=pcPaint;pcPaint(true)}
export {init96,pcImport};
