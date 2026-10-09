import {kv} from '../platform/index.js';
import {cmdGet,cmdIsEnabled,cmdRun} from '../commands/registry.js';
import {$,WBX} from './01-launch-and-version.js';
// ===== Task bar =====
// A slim bar of the commands you pin. Pin or unpin any command with the pin on its row in command search (Mod+K); the bar runs the
// same commands as the buttons and shortcuts. It is empty (and not shown) until you pin something, and the list is kept with your settings.
const TB_KEY='wb99_taskbar';
function pinLoad(){try{const a=JSON.parse(kv.get(TB_KEY)||'[]');return Array.isArray(a)?a.filter(id=>typeof id=='string'&&cmdGet(id)):[]}catch(e){return[]}}
function pinIs(id){return pinLoad().includes(id)}
function pinToggle(id){
  const a=pinLoad(),i=a.indexOf(id);if(i<0)a.push(id);else a.splice(i,1);
  try{kv.set(TB_KEY,JSON.stringify(a))}catch(e){}
  if(WBX.wbPinPaint)WBX.wbPinPaint();
  return i<0;
}
function init48(){
  const bar=$('tbar');let timer=0;
  const sync=()=>{[...bar.children].forEach(b=>{const on=cmdIsEnabled(b.dataset.id);b.classList.toggle('dis',!on);b.setAttribute('aria-disabled',on?'false':'true')})};
  function paint(){
    const a=pinLoad();bar.textContent='';bar.hidden=!a.length;clearInterval(timer);
    a.forEach(id=>{const c=cmdGet(id),b=document.createElement('button');b.type='button';b.className='tbb';b.dataset.id=id;b.textContent=c.label;bar.appendChild(b)});
    if(a.length){sync();timer=setInterval(sync,700)}
  }
  WBX.wbPinPaint=paint;
  bar.addEventListener('click',e=>{const b=e.target.closest('.tbb');if(b&&!b.classList.contains('dis'))cmdRun(b.dataset.id)});
  paint();
}
export {init48,pinIs,pinToggle};
