import {cmdFormatShortcut,cmdIsEnabled,cmdList,cmdRun} from '../commands/registry.js';
import {kv} from '../platform/index.js';
import {$} from './01-launch-and-version.js';
import {pinIs,pinToggle} from './48-task-bar.js';
// ===== Command search (Mod+K) =====
// Type to find any command in the registry and run it: the same commands the buttons and shortcuts run, so nothing here can drift
// from them. Up and Down move, Enter runs, Escape closes; a click or tap on a row runs it. Commands that cannot run right now are
// shown dimmed and are skipped. Opens from the search button in the top bar as well, so it needs no keyboard.
const isMac=()=>/Mac|iPhone|iPad/.test(navigator.platform||'');
// every typed word has to appear in the label; matches at the start of a word rank first
function score(label,q){
  const l=label.toLowerCase();let s=0;
  for(const w of q.toLowerCase().split(/\s+/).filter(Boolean)){
    const i=l.indexOf(w);if(i<0)return -1;
    s+=i==0?0:(l[i-1]==' '?1:3);
  }
  return s;
}
// With nothing typed, the list opens with the commands you ran last, then those that apply in the view you are in, then the rest.
const RK='wb_cmd_recent';
const recents=()=>{try{const a=JSON.parse(kv.get(RK)||'[]');return Array.isArray(a)?a.filter(x=>typeof x=='string').slice(0,5):[]}catch(e){return[]}};
const remember=id=>{try{kv.set(RK,JSON.stringify([id,...recents().filter(x=>x!==id)].slice(0,5)))}catch(e){}};
// a command whose button sits in a part of the page that is not showing now (the other view's tools) is out of view; menu items and file inputs count as in view
const inView=c=>{const e=c.elId&&$(c.elId);if(!e)return true;if(e.matches('input')||e.closest('.pop,.menu'))return true;return e.getClientRects().length>0};
function search(q){
  const rec=recents(),all=cmdList().map((c,i)=>({c,i,on:cmdIsEnabled(c.id),v:inView(c),r:rec.indexOf(c.id)}));
  if(q.trim()){const hits=all.map(r=>({...r,s:score(r.c.label,q)})).filter(r=>r.s>=0);return hits.sort((a,b)=>(b.on-a.on)||(a.s-b.s)||(a.i-b.i))}
  return all.sort((a,b)=>(b.on-a.on)||((b.r>=0)-(a.r>=0))||(a.r>=0&&b.r>=0?a.r-b.r:0)||(b.v-a.v)||(a.i-b.i));
}
// On a Mac the page says Cmd where it says Ctrl: button titles (now and when they are rewritten later) and the fixed panel text. Status messages
// are converted where they are written (pmsg in 18).
function macKeys(){
  if(!isMac())return;
  const fix=t=>t.replace(/Ctrl\+/g,'Cmd+');
  const fixEl=e=>{const t=e.getAttribute('title');if(t&&t.includes('Ctrl+'))e.setAttribute('title',fix(t))};
  document.querySelectorAll('[title*="Ctrl+"]').forEach(fixEl);
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(n.nodeValue.includes('Ctrl+'))n.nodeValue=fix(n.nodeValue)}
  new MutationObserver(ms=>ms.forEach(m=>{if(m.type=='attributes')fixEl(m.target)})).observe(document.body,{attributes:true,attributeFilter:['title'],subtree:true});
}
function init40(){
  const box=$('cmdk'),inp=$('cmdki'),list=$('cmdkl');
  let rows=[],cur=-1,back=null;
  const open=()=>{back=document.activeElement;inp.value='';box.hidden=false;paint();inp.focus()};
  const close=()=>{if(box.hidden)return;box.hidden=true;if(back&&back.isConnected&&back.focus)back.focus();back=null};
  const mark=()=>{[...list.children].forEach((e,i)=>e.classList.toggle('on',i==cur));const e=list.children[cur];if(e){inp.setAttribute('aria-activedescendant',e.id);e.scrollIntoView({block:'nearest'})}else inp.removeAttribute('aria-activedescendant')};
  function paint(){
    rows=search(inp.value);cur=rows.findIndex(r=>r.on);list.textContent='';
    if(!rows.length){const n=document.createElement('div');n.className='ckn';n.textContent='No matching command';list.appendChild(n);mark();return}
    rows.forEach((r,i)=>{
      const e=document.createElement('div'),b=document.createElement('b');
      e.id='ck'+i;e.className='ckr'+(r.on?'':' dis');e.setAttribute('role','option');e.setAttribute('aria-selected','false');if(!r.on)e.setAttribute('aria-disabled','true');e.dataset.i=i;
      b.textContent=r.c.label;e.appendChild(b);
      if(r.c.shortcut){const k=document.createElement('kbd');k.textContent=cmdFormatShortcut(r.c.shortcut,isMac());e.appendChild(k)}
      const pn=document.createElement('button'),on=pinIs(r.c.id);pn.type='button';pn.className='ckp'+(on?' on':'');pn.dataset.id=r.c.id;pn.tabIndex=-1;pn.setAttribute('aria-pressed',on?'true':'false');pn.setAttribute('aria-label',(on?'Unpin ':'Pin ')+r.c.label+(on?' from the task bar':' to the task bar'));
      pn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7"/></svg>';e.appendChild(pn);
      list.appendChild(e);
    });
    mark();
  }
  const go=i=>{const r=rows[i];if(!r||!r.on)return;close();remember(r.c.id);cmdRun(r.c.id)};
  const step=d=>{if(!rows.some(r=>r.on))return;let i=cur;do{i=(i+d+rows.length)%rows.length}while(!rows[i].on);cur=i;mark()};
  inp.addEventListener('input',paint);
  inp.addEventListener('keydown',e=>{
    if(e.key=='ArrowDown'){e.preventDefault();step(1)}
    else if(e.key=='ArrowUp'){e.preventDefault();step(-1)}
    else if(e.key=='Enter'){e.preventDefault();go(cur)}
    else if(e.key=='Escape'){e.preventDefault();e.stopPropagation();close()}
    else if(e.key=='Tab'){e.preventDefault()}   // the search box is the only stop in this window
  });
  list.addEventListener('click',e=>{
    const p=e.target.closest('.ckp');if(p){const on=pinToggle(p.dataset.id);p.classList.toggle('on',on);p.setAttribute('aria-pressed',on?'true':'false');const c=rows.find(r=>r.c.id==p.dataset.id).c;p.setAttribute('aria-label',(on?'Unpin ':'Pin ')+c.label+(on?' from the task bar':' to the task bar'));inp.focus();return}
    const r=e.target.closest('.ckr');if(r)go(+r.dataset.i)});
  list.addEventListener('pointermove',e=>{const r=e.target.closest('.ckr');if(r&&!r.classList.contains('dis')&&+r.dataset.i!=cur){cur=+r.dataset.i;mark()}});
  box.querySelector('.ckbd').addEventListener('click',close);
  $('cmdkb').addEventListener('click',()=>box.hidden?open():close());
  macKeys();
  // Mod+K opens it (and closes it again); capture phase so it works from inside any field
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()=='k'){e.preventDefault();e.stopPropagation();box.hidden?open():close()}},true);
}
export {init40};
