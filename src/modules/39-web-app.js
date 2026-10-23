import {offline,reload,storage} from '../platform/index.js';
import {$} from './01-launch-and-version.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {rcUnsaved} from './38-crash-recovery.js';
// ===== Web app: offline use, updates and browser storage =====
// Only does anything when the page is served over http(s) (the installed or hosted web app); the single file and the claude.ai
// preview have no service worker. A new version is downloaded in the background and waits: it is used the next time the app is
// opened, or sooner when the person presses the small update dot in the status bar. Nothing here reloads the page by itself.
const MB=1048576,fmt=n=>n>=1024*MB?(n/1024/MB).toFixed(1)+' GB':n>=10*MB?Math.round(n/MB)+' MB':n>=MB?(n/MB).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
async function paintStorage(){
  const b=$('pstore');if(!b||!storage.available())return;
  try{const e=await storage.estimate(),keep=await storage.persisted();b.textContent='Stored '+fmt(e.used);b.title='Browser storage: '+fmt(e.used)+' of '+fmt(e.quota)+(keep?'. The browser will keep it.':'. The browser may clear it if space runs short; use Download to keep a copy.');b.hidden=false}catch(err){}
}
function init39(){
  if(!offline.available())return;
  const dot=$('pupd');
  dot.onclick=async()=>{
    if(rcUnsaved()){pmsg('Save your work first.');return}
    dot.disabled=true;await offline.apply();reload();
  };
  offline.register(()=>{dot.hidden=false}).catch(()=>{});
  paintStorage();
  // ask the browser to keep the data (it decides itself whether to say yes), then show how much is stored
  storage.persist().then(paintStorage,()=>{});
  setInterval(paintStorage,60000);
}
export {init39};
