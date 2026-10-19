import {$,WBX} from './01-launch-and-version.js';
import {BK,bkFlush} from './03-stamp-prints-and-drawing.js';
import {raf} from './11-pressure-flooding-block-edges.js';

// ===== v67 Randomize hold. A snapshot of what is on screen now (the pattern) is laid over
// the view while the new piece is made: its stamps printed, its lettering set. The finished piece then fades in at once, with a
// progress bar on top of the picture and in the status bar, instead of showing the steps of the build.
let wbHold;
function init19(){// ===== Randomize: a whole new piece in the current project. Undoable.
// Every roll starts from a calm, coherent base (two colours, overprint blends, one clear repeat, clean motifs),
// then features one or two "bold moves" picked from the rest of the options, so every option still turns up
// across rolls without them all piling into one piece.
// Left alone on purpose: canvas size and print cover (your document setup), hand-picked stamps, editor grid.
// Randomize reads your Stamp library first when the Stamp library switch is on, then rolls.
window.SLC=[];
wbHold=(()=>{let on=0,t0=0,armed=0,ovs=[],bar=null,prog=0,pr0=0,quiet=0,lastMut=0,lastLay=0,mo=null,loop=0,view='',vis=[];
 const RF=/(href="#|url\(#|url\(&quot;#|url\("#|url\('#)([^"'\)\s&]+)/g,RI=/\sid="([^"]+)"/g;
 // copy an element's markup with every id it refers to renamed, so the copy keeps looking the same while the original changes
 function snap(root,P){let html=root.outerHTML;const css=[];
  (root.matches('svg')?[root,...root.querySelectorAll('svg')]:[...root.querySelectorAll('svg')]).forEach((sv,si)=>{[...sv.children].forEach((c,ci)=>{if(c.hasAttribute('filter'))return;const f=getComputedStyle(c).filter;const m=f&&f.match(/url\(["']?[^"')]*#([^"')]+)["']?\)/);if(m)css.push([si,ci,m[1]])})});
  const defd=h=>{const d=new Set();let m;RI.lastIndex=0;while((m=RI.exec(h)))d.add(m[1]);return d};
  const refs=h=>{const r=new Set();let m;RF.lastIndex=0;while((m=RF.exec(h)))r.add(m[2]);return r};
  let extra='',have=defd(html),need=refs(html);css.forEach(c=>need.add(c[2]));
  for(let k=0;k<6;k++){let more='';need.forEach(id=>{if(have.has(id))return;have.add(id);const e=document.getElementById(id);if(e&&e instanceof SVGElement&&!root.contains(e))more+=e.outerHTML});if(!more)break;extra+=more;have=new Set([...have,...defd(more)]);need=refs(more)}
  const all=html+extra,ren=new Set();const R2=refs(all);css.forEach(c=>R2.add(c[2]));defd(all).forEach(id=>{if(R2.has(id))ren.add(id)});
  const fix=h=>h.replace(RI,(m,id)=>ren.has(id)?` id="${P}${id}"`:m).replace(RF,(m,a,id)=>ren.has(id)?a+P+id:m);
  return{html:fix(html),extra:extra?`<svg width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>${fix(extra)}</defs></svg>`:'',css,P}}
 function lay(o){if(o.pv)return;const b=o.src,st=b.parentElement;o.el.style.left=b.offsetLeft+'px';o.el.style.top=b.offsetTop+'px';o.el.style.width=b.offsetWidth+'px';o.el.style.height=b.offsetHeight+'px';
  if(bar){bar.style.left=b.offsetLeft+'px';bar.style.top=b.offsetTop+'px';bar.style.width=b.offsetWidth+'px'}}
 function freeze(src,host,P,pv){return freezeSn(snap(src,P),src,host,pv)}
 function freezeSn(sn,src,host,pv){const el=document.createElement('div');el.className='fzov'+(pv?' pv':'');el.setAttribute('aria-hidden','true');
  el.innerHTML=sn.extra+sn.html;const cl=el.lastElementChild;
  if(sn.css.length){const svs=cl.matches('svg')?[cl,...cl.querySelectorAll('svg')]:[...cl.querySelectorAll('svg')];sn.css.forEach(([si,ci,id])=>{const c=svs[si]&&svs[si].children[ci];if(c)c.style.filter=`url(#${sn.P}${id})`})}
  host.appendChild(el);const o={el,src,pv};lay(o);
  if(!pv){const a=src,b=cl;b.scrollLeft=a.scrollLeft;b.scrollTop=a.scrollTop}
  return o}
 function setP(v){prog=Math.max(prog,Math.min(1,v));const w=(prog*100).toFixed(1)+'%';if(bar)bar.firstChild.style.width=w;const s=$('fzsb');if(s)s.style.width=w;const t=$('fzt');if(t)t.textContent=prog>=1?'Done':prog>=.9?'Finishing…':'Randomizing… '+Math.round(prog*100)+'%'}
 function start(){if(on){armed=0;t0=performance.now();quiet=t0;return}
  const st=document.querySelector('.stage'),boards=[...st.querySelectorAll(':scope>.board')].filter(b=>!b.hidden);if(!boards.length)return;
  on=1;WBX.wbHoldOn=1;armed=0;t0=performance.now();lastMut=t0;lastLay=t0;prog=0;pr0=BK.st.printed;view=boards.map(b=>b.id).join();
  try{boards.forEach((b,i)=>ovs.push(freeze(b,st,'fz'+i+'_',0)));}
  catch(e){ovs.forEach(o=>o.el.remove());ovs=[];on=0;WBX.wbHoldOn=0;return}
  bar=document.createElement('div');bar.className='fzbar';bar.innerHTML='<i></i>';st.appendChild(bar);ovs.forEach(lay);
  $('fzst').classList.add('on');setP(.06);
  mo=new MutationObserver(()=>{lastMut=performance.now()});
  boards.forEach(b=>mo.observe(b,{childList:true,subtree:true,attributes:true,characterData:true}));
  ['grdf','cvdefs','surfd'].forEach(id=>{const e=$(id);if(e)mo.observe(e,{childList:true,subtree:true,attributes:true})});
  cancelAnimationFrame(loop);loop=requestAnimationFrame(tick)}
 function arm(){if(on){armed=1;quiet=performance.now()}}
 function tick(){loop=0;if(!on)return;const now=performance.now();
  const boards=[...document.querySelectorAll('.stage>.board')].filter(b=>!b.hidden).map(b=>b.id).join();
  if(boards!==view){stop(true);return} // the view was switched: let go straight away
  if(now-lastLay>250){lastLay=now;ovs.forEach(lay)}   // reading offsetLeft/offsetTop forces a layout; the board hardly ever moves during a roll, so not on every frame
  const busy=!armed||raf||BK.busy||BK.q.size||BK.tm||BK.defT||(WBX.wbTxBusy||0)>0;
  const done=BK.st.printed-pr0,left=BK.q.size,el=now-t0;
  let est=.06+Math.min(.3,el/4000);if(done+left>0)est=Math.max(est,.15+.8*done/(done+left));if((WBX.wbTxBusy||0)>0)est=Math.min(est,.6);if(!busy)est=Math.max(est,.92);setP(Math.min(.97,est));
  if(!busy&&now-lastMut>=140&&el>=90){stop(false);return}
  if(el>20000){stop(false);return} // never hold longer than this
  loop=requestAnimationFrame(tick)}
 function stop(now){if(!on)return;on=0;armed=0;WBX.wbHoldOn=0;if(mo){mo.disconnect();mo=null}cancelAnimationFrame(loop);loop=0;
  const os=ovs,b=bar;ovs=[];bar=null;setP(1);
  const gone=()=>{os.forEach(o=>o.el.remove());if(b)b.remove();if(!on)$('fzst').classList.remove('on');try{bkFlush()}catch(e){}};
  if(now){gone();return}
  os.forEach(o=>o.el.classList.add('out'));if(b)b.classList.add('out');setTimeout(gone,190)}
 return{start,arm,stop,snap,freezeSn,lay,get on(){return!!on}}})();
// A light progress bar for work that is not a Randomize roll: after a file is opened or the canvas shape changes, the stamps are printed
// a few at a time, and until they are done the picture is only paper. The same thin bar as Randomize's runs across the top of the stage
// while prints are queued; nothing is frozen or held, so the view stays live. Ends when the drawing has been quiet for a moment.
let wat=null;
WBX.wbWatch=()=>{if(wbHold.on||wat)return;const st=document.querySelector('.stage');if(!st)return;
 const bar=document.createElement('div');bar.className='fzbar';bar.setAttribute('aria-hidden','true');bar.innerHTML='<i></i>';st.appendChild(bar);
 const t0=performance.now(),pr0=BK.st.printed;let quiet=t0,prog=.05;wat=bar;bar.firstChild.style.width='5%';
 const end=()=>{bar.classList.add('out');setTimeout(()=>{bar.remove();if(wat===bar)wat=null},220)};
 const tick=()=>{if(!bar.isConnected)return;const now=performance.now(),el=now-t0;
  const busy=raf||BK.busy||BK.q.size||BK.tm||BK.defT||WBX.wbHoldOn;
  if(busy)quiet=now;
  const done=BK.st.printed-pr0,left=BK.q.size;let est=.05+Math.min(.3,el/4000);if(done+left>0)est=Math.max(est,.15+.8*done/(done+left));
  prog=Math.max(prog,Math.min(.95,est));bar.firstChild.style.width=(prog*100).toFixed(1)+'%';
  if((el>=500&&now-quiet>=250)||el>20000){bar.firstChild.style.width='100%';end();return}
  requestAnimationFrame(tick)};
 requestAnimationFrame(tick)};
}
export {wbHold,init19};
