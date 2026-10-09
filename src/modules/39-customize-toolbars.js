import {kv} from '../platform/index.js';
import {cmdGet,cmdIsEnabled,cmdRun} from '../commands/registry.js';
import {$} from './01-launch-and-version.js';
// ===== Customizable toolbars (the top bar and the left tool rail) =====
// Edit mode (File > Customize toolbars, the command of the same name, or a right-click on either bar): items wiggle, drag
// one to reorder, click its dot to remove it, click a dimmed item (or its dot) to bring it back, Reset restores today's bars.
// Nothing is ever deleted from the page: a removed item is only hidden, because other code still finds the buttons by id.
// The rail holds panel buttons; the top bar holds commands (each one a command in the registry). Items stay on their own bar.
// The layout is one small setting (`wb105_tbar`), so Export everything carries it along with the rest.
const TZ_KEY='wb105_tbar';
// top bar catalogue: [command id, id of the button whose icon it borrows]. Undo and Redo are the page's own buttons.
const TZ_TOP=[['edit.undo','undo'],['edit.redo','redo'],['view.zoomOut','zo'],['view.zoomIn','zi'],['file.new','pnw'],['file.clear','clr'],['file.duplicate','pcp'],['file.open','pop'],['file.download','pdl'],['export.png','png'],['export.svg','sv'],['export.copySvg','cpy'],['file.exportEverything','xall']];
const TZ_TOP_ON=['edit.undo','edit.redo'];
const TZ_BARS={};                 // 'rail' | 'top' -> {box, end, ids, on, nodes, all()}
let tzS=null,tzEdit=false,tzDrag=null,tzRaf=0,tzSkip=false;
const tzCustom=[];                // [command id, button] for the top-bar buttons this module made (kept enabled/disabled like their command)
const tzOffSet=k=>new Set(tzS[k].off);

function tzDefaults(){const o={v:1};for(const k in TZ_BARS){const B=TZ_BARS[k];o[k]={order:B.ids.slice(),off:B.ids.filter(i=>!B.on.includes(i))}}return o}
// A saved layout is trusted only as far as it makes sense: unknown ids drop out, and an item the saved layout has never seen
// (added by a later version) goes after the item that precedes it by default, in its default on/off state.
function tzClean(raw){
  const d=tzDefaults();let r=null;try{r=JSON.parse(raw)}catch(e){}
  if(!r||typeof r!='object'||r.v!==1)return d;
  for(const k in TZ_BARS){
    const s=r[k],B=TZ_BARS[k];if(!s||!Array.isArray(s.order))continue;
    const seen=new Set(),order=s.order.filter(i=>B.ids.includes(i)&&!seen.has(i)&&seen.add(i)),off=new Set(Array.isArray(s.off)?s.off.filter(i=>B.ids.includes(i)):[]);
    B.ids.forEach((id,n)=>{if(seen.has(id))return;order.splice((n?order.indexOf(B.ids[n-1]):-1)+1,0,id);seen.add(id);if(!B.on.includes(id))off.add(id)});
    d[k]={order,off:[...off]};
  }
  return d;
}
const tzSave=()=>{try{kv.set(TZ_KEY,JSON.stringify(tzS))}catch(e){}};
function tzApply(){
  for(const k in TZ_BARS){const B=TZ_BARS[k],off=tzOffSet(k);tzS[k].order.forEach(id=>{const n=B.nodes.get(id);B.box.insertBefore(n,B.end);n.classList.toggle('tzoff',off.has(id))})}
  tzSync();
}
function tzSync(){for(const [cmd,n] of tzCustom)n.disabled=!cmdIsEnabled(cmd)}
const tzSoon=()=>{if(!tzRaf)tzRaf=requestAnimationFrame(()=>{tzRaf=0;tzSync()})};
const tzItem=t=>t&&t.closest?t.closest('[data-tzi]'):null;
const tzShown=(B,except)=>B.all().filter(m=>m!==except&&m.getClientRects().length>0);

// ---- edit mode
function tzEnter(){
  if(tzEdit)return;tzEdit=true;document.body.classList.add('tzedit');$('tzbar').hidden=false;
  for(const k in TZ_BARS)TZ_BARS[k].all().forEach(n=>{const b=document.createElement('span');b.className='tzb';b.setAttribute('aria-hidden','true');n.appendChild(b)});
  $('tzdn').focus();
}
function tzExit(){
  if(!tzEdit)return;tzCancelDrag();tzEdit=false;document.body.classList.remove('tzedit');$('tzbar').hidden=true;
  document.querySelectorAll('.tzb').forEach(b=>b.remove());tzSave();
}
function tzToggle(n){const k=n.dataset.tzb,id=n.dataset.tzi,off=tzS[k].off,i=off.indexOf(id);if(i<0)off.push(id);else off.splice(i,1);n.classList.toggle('tzoff',i<0);tzSave();tzSync()}
// the order lives in the page itself while dragging; read it back when the move is done
function tzRead(k){const B=TZ_BARS[k];tzS[k].order=[...B.box.children].filter(n=>n.dataset.tzb==k).map(n=>n.dataset.tzi);tzSave()}
function tzPlace(k,n,x,y){
  const B=TZ_BARS[k],vis=tzShown(B,n);if(!vis.length)return;
  const row=getComputedStyle(B.box).flexDirection.startsWith('row');
  const before=vis.find(m=>{const r=m.getBoundingClientRect();return (row?x:y)<(row?r.left+r.width/2:r.top+r.height/2)});
  if(before){if(n.nextElementSibling!==before)before.before(n)}else{const last=vis[vis.length-1];if(last.nextElementSibling!==n)last.after(n)}
}
function tzMove(n,dir){
  const k=n.dataset.tzb,vis=tzShown(TZ_BARS[k]),i=vis.indexOf(n),t=vis[i+dir];if(i<0||!t)return;
  if(dir<0)t.before(n);else t.after(n);tzRead(k);n.focus();
}
function tzCancelDrag(){if(!tzDrag)return;const d=tzDrag;tzDrag=null;if(d.ghost)d.ghost.remove();d.node.classList.remove('tzlift');document.removeEventListener('pointermove',tzMoveEv,true);document.removeEventListener('pointerup',tzUpEv,true);document.removeEventListener('pointercancel',tzUpEv,true)}
function tzMoveEv(e){
  const d=tzDrag;if(!d||e.pointerId!==d.pid)return;
  if(!d.ghost){
    if(Math.hypot(e.clientX-d.x0,e.clientY-d.y0)<5)return;
    const r=d.node.getBoundingClientRect(),g=d.node.cloneNode(true);
    g.removeAttribute('id');g.classList.add('tzghost');g.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    d.dx=d.x0-r.left;d.dy=d.y0-r.top;document.body.appendChild(g);d.ghost=g;d.node.classList.add('tzlift');
  }
  d.ghost.style.left=(e.clientX-d.dx)+'px';d.ghost.style.top=(e.clientY-d.dy)+'px';
  tzPlace(d.k,d.node,e.clientX,e.clientY);
}
// the click that ends a drag must not also toggle the item it was dropped on
function tzUpEv(e){const d=tzDrag;if(!d||e.pointerId!==d.pid)return;const moved=!!d.ghost,k=d.k;tzCancelDrag();if(moved){tzSkip=true;tzRead(k)}}

function init39(){
  // build the two bars' catalogues from the page as it is today
  const rail=document.querySelector('.rail'),railIds=[...rail.querySelectorAll('[data-pn]')].map(b=>b.dataset.pn);
  TZ_BARS.rail={box:rail,end:rail.querySelector('.rsp'),ids:railIds,on:railIds,nodes:new Map(railIds.map(i=>[i,rail.querySelector(`[data-pn="${i}"]`)]))};
  const tb=document.querySelector('.top .tb'),topNodes=new Map(),srcs=[];
  for(const [cmd,src] of TZ_TOP){
    let n;
    if(TZ_TOP_ON.includes(cmd))n=$(src);
    else{
      n=document.createElement('button');n.type='button';n.className='ib';n.id='tz_'+cmd.replace(/\./g,'_');
      const label=cmdGet(cmd).label;n.setAttribute('aria-label',label);n.title=label;
      n.appendChild($(src).querySelector('svg').cloneNode(true));n.addEventListener('click',()=>{cmdRun(cmd)});
      tzCustom.push([cmd,n]);srcs.push($(src));
    }
    topNodes.set(cmd,n);
  }
  TZ_BARS.top={box:tb,end:null,ids:TZ_TOP.map(t=>t[0]),on:TZ_TOP_ON,nodes:topNodes};
  for(const k in TZ_BARS){const B=TZ_BARS[k];B.all=()=>B.ids.map(i=>B.nodes.get(i));for(const [id,n] of B.nodes){n.dataset.tzi=id;n.dataset.tzb=k}}
  tzS=tzClean(kv.get(TZ_KEY));tzApply();
  // a custom top-bar button is disabled whenever its command is (the commands read these buttons' own state)
  const mo=new MutationObserver(tzSoon);srcs.forEach(s=>mo.observe(s,{attributes:true,attributeFilter:['disabled','hidden']}));

  // entry points
  $('tzopen').addEventListener('click',tzEnter);
  rail.addEventListener('contextmenu',e=>{e.preventDefault();tzEnter()});tb.addEventListener('contextmenu',e=>{e.preventDefault();tzEnter()});
  $('tzdn').addEventListener('click',tzExit);
  $('tzrs').addEventListener('click',()=>{tzS=tzDefaults();tzApply();tzSave()});
  // while editing, a bar does not act: a click on a dot toggles it, a click on a removed item brings it back, nothing else runs
  for(const B of [TZ_BARS.rail,TZ_BARS.top])B.box.addEventListener('click',e=>{
    if(!tzEdit)return;e.preventDefault();e.stopPropagation();
    if(tzSkip){tzSkip=false;return}
    const n=tzItem(e.target);if(n&&n.dataset.tzb&&(e.target.closest('.tzb')||n.classList.contains('tzoff')))tzToggle(n);
  },true);
  for(const B of [TZ_BARS.rail,TZ_BARS.top]){
    B.box.addEventListener('pointerdown',e=>{
      if(!tzEdit||e.button||e.target.closest('.tzb'))return;const n=tzItem(e.target);if(!n)return;
      tzSkip=false;
      tzCancelDrag();tzDrag={k:n.dataset.tzb,node:n,pid:e.pointerId,x0:e.clientX,y0:e.clientY,ghost:null,dx:0,dy:0};
      document.addEventListener('pointermove',tzMoveEv,true);document.addEventListener('pointerup',tzUpEv,true);document.addEventListener('pointercancel',tzUpEv,true);
    });
    // the keyboard way: Alt+arrows move the focused item, Enter / Space / Delete remove it or bring it back
    B.box.addEventListener('keydown',e=>{
      if(!tzEdit)return;const n=tzItem(e.target);if(!n||n!==e.target)return;
      if(e.altKey&&/^Arrow(Left|Up|Right|Down)$/.test(e.key)){e.preventDefault();e.stopPropagation();tzMove(n,/Left|Up/.test(e.key)?-1:1)}
      else if(e.key=='Enter'||e.key==' '||e.key=='Delete'||e.key=='Backspace'){e.preventDefault();e.stopPropagation();tzToggle(n)}
    });
  }
  // Esc leaves edit mode before anything else gets the key
  addEventListener('keydown',e=>{if(tzEdit&&e.key=='Escape'){e.preventDefault();e.stopPropagation();tzExit()}},true);
}
export {init39};
