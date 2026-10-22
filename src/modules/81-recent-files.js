import {files} from '../platform/index.js';
import {$,WBX} from './01-launch-and-version.js';
import {hx} from './10-layer-grids.js';
import {confirm2,pmsg} from './18-projects-and-cover-overlay.js';

// ===== Open recent (2.23.0, owner Oct 22 2026). The File menu lists the last three project files that were opened or saved, where the browser gave the app a file handle (Chrome, Edge). Click one to open it;
// the browser may ask once for permission. A file that has been moved or deleted is dropped from the list. The list is kept in the browser's records, and for this visit even where the handle cannot be stored.
const RFMAXN=3;let RECL=null;
async function rfLoad(){if(RECL)return RECL;try{RECL=(await files.recentGet()).filter(r=>r&&r.name&&r.handle)}catch(e){RECL=[]}return RECL}
async function rfAdd(name,handle){if(!name||!handle)return;const L=await rfLoad();RECL=[{name,handle,at:Date.now()},...L.filter(r=>r.name!==name)].slice(0,RFMAXN);try{await files.recentPut(RECL)}catch(e){}}
async function rfPaint(){const box=$('pmr');if(!box)return;const L=files.canOpen()||RECL&&RECL.length?await rfLoad():[];box.hidden=!L.length;
 box.innerHTML=L.length?'<div class="glb">Recent</div>'+L.map((r,i)=>`<button type="button" data-ri="${i}" title="${hx(r.name)}">${hx(r.name)}</button>`).join(''):''}
async function rfOpen(i,btn){const L=await rfLoad(),r=L[i];if(!r)return;
 confirm2(btn,'Discard changes?',async()=>{try{
  if(r.handle.queryPermission&&(await r.handle.queryPermission({mode:'readwrite'}))!=='granted'&&r.handle.requestPermission&&(await r.handle.requestPermission({mode:'readwrite'}))!=='granted')return pmsg('Not opened: the browser did not give access to “'+r.name+'”.');
  const f=await r.handle.getFile();if(WBX.wbOpenFile)await WBX.wbOpenFile(f,r.handle);await rfAdd(r.name,r.handle)}
  catch(e){RECL=(await rfLoad()).filter(x=>x!==r);try{await files.recentPut(RECL)}catch(e2){}pmsg('Could not open “'+r.name+'”. It may have been moved or deleted, so it is off the list.');rfPaint()}})}
function init81(){
 WBX.wbRecentAdd=rfAdd;
 const fb=$('fileb');if(fb)fb.addEventListener('click',()=>rfPaint());
 const box=$('pmr');if(box)box.addEventListener('click',e=>{const b=e.target.closest('button[data-ri]');if(b)rfOpen(+b.dataset.ri,b)})}
export {init81};
