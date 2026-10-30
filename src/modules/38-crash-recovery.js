import {recovery} from '../platform/index.js';
import {$,WBS} from './01-launch-and-version.js';
import {coreStr,dirty,openData,paintPst,pmsg,snapshot} from './18-projects-and-cover-overlay.js';
// ===== Crash recovery =====
// While there is unsaved work, a copy is written to a recovery slot every few seconds. The app still starts blank; if a copy
// from an earlier session is waiting, "Restore unsaved work" appears in the status bar. The old copy is kept (in its own slot)
// until the person restores or dismisses it, so starting to work does not overwrite it.
let RC_EVERY=8000,rcTimer=null;   // Settings > Files changes it
let rcBlank='',rcLast='',rcPrev=null,rcQ=Promise.resolve();
function rcShow(on){$('rcv').hidden=!on;$('rcx').hidden=!on}   // the status bar only
// Is there work that would be lost by restarting now? (a project still blank from launch does not count)
const rcUnsaved=()=>(coreStr()!==rcBlank||!!WBS.cp.id)&&dirty();
// Ticks run one after another: a tick asked for while another is still writing (the timer, or Save finishing) waits its turn, so the last one always sees the latest state.
function rcTick(){if(WBS.WBDRG)return Promise.resolve();rcQ=rcQ.then(rcRun,rcRun);return rcQ}
async function rcRun(){
  try{
    const s=coreStr(),need=rcUnsaved(),key=need?s+'|'+$('pnm').value:'';
    if(key===rcLast)return;rcLast=key;
    if(!need)return await recovery.del('current');
    await recovery.put('current',{t:Date.now(),id:WBS.cp.id||null,name:$('pnm').value.trim()||'Untitled project',data:JSON.stringify(snapshot())});
  }catch(e){}
}
async function rcRestore(){
  const r=rcPrev;if(!r)return;
  try{
    const d=JSON.parse(r.data);openData(d,r.id,r.name);WBS.cp.saved='';paintPst();
    rcPrev=null;rcShow(false);await recovery.del('previous');pmsg('Restored “'+r.name+'”. It is not saved yet.');
  }catch(e){pmsg('That recovered work could not be opened.')}
}
async function rcDismiss(){rcPrev=null;rcShow(false);try{await recovery.del('previous')}catch(e){}}
async function rcFind(){
  try{
    const a=await recovery.get('previous'),b=await recovery.get('current'),c=[a,b].filter(x=>x&&typeof x.data=='string').sort((x,y)=>(y.t||0)-(x.t||0))[0];
    if(!c)return;
    await recovery.put('previous',c);await recovery.del('current');rcPrev=c;rcShow(true);
  }catch(e){}
}
function init38(){
  rcBlank=coreStr();
  $('rcv').onclick=rcRestore;$('rcx').onclick=rcDismiss;
  rcFind().then(()=>{rcStart()});
}
function rcStart(){clearInterval(rcTimer);rcTimer=setInterval(rcTick,RC_EVERY)}
function setAutosaveEvery(ms){RC_EVERY=ms>=8000?ms:8000;if(rcTimer)rcStart()}
export {init38,rcTick,rcUnsaved,setAutosaveEvery};
