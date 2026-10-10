import {$,WBX} from './01-launch-and-version.js';
import {thumb} from './18-projects-and-cover-overlay.js';
// ===== Navigator, hand tool and zoom keys =====
// The Navigator panel shows the whole piece small, with a frame for the part you can see. Click or drag in it to go there.
// Hand tool: hold Space, press the middle mouse button, or switch the Hand button on, then drag the picture to move it.
// Zoom keys: + and - zoom, 1 shows the piece at 100%, 0 fits it to the screen (the Fit key already existed).
function init41(){
  const board=$('boardP'),art=$('art'),sec=document.querySelector('section.pn[data-p="nav"]'),box=$('nvv'),img=$('nvi'),frame=$('nvr');
  let hand=false,space=false,pan=null,dirty=true,busy=false,timer=0,raf=0;
  const open=()=>!sec.hidden&&sec.getClientRects().length>0;
  // ---- the little map
  function place(){
    raf=0;if(!open())return;
    const ar=art.getBoundingClientRect(),br=board.getBoundingClientRect(),ir=img.getBoundingClientRect(),bx=box.getBoundingClientRect();
    if(!ar.width||!ir.width)return;
    const x0=Math.max(0,(br.left-ar.left)/ar.width),y0=Math.max(0,(br.top-ar.top)/ar.height),x1=Math.min(1,(br.right-ar.left)/ar.width),y1=Math.min(1,(br.bottom-ar.top)/ar.height);
    frame.style.left=(ir.left-bx.left+x0*ir.width)+'px';frame.style.top=(ir.top-bx.top+y0*ir.height)+'px';
    frame.style.width=Math.max(4,(x1-x0)*ir.width)+'px';frame.style.height=Math.max(4,(y1-y0)*ir.height)+'px';
    $('nvz').textContent=Math.round(WBX.wbZoomNow()*100)+'%';
  }
  const later=()=>{if(!raf)raf=requestAnimationFrame(place)};
  async function paint(){
    if(busy||!dirty||!open())return;busy=true;dirty=false;
    try{const u=await thumb(300);if(u){img.src=u;img.onload=later}}finally{busy=false}
    if(dirty)soon();
  }
  const soon=()=>{clearTimeout(timer);timer=setTimeout(paint,700)};
  WBX.wbNavDirty=()=>{dirty=true;if(open())soon()};
  WBX.wbZoomed=later;
  board.addEventListener('scroll',later,{passive:true});
  window.addEventListener('resize',later);
  new MutationObserver(()=>{if(open()){later();if(dirty)paint()}}).observe(sec,{attributes:true,attributeFilter:['hidden']});
  // go to the point under the pointer (the middle of the screen moves there)
  function goto(e){
    const ir=img.getBoundingClientRect(),ar=art.getBoundingClientRect(),br=board.getBoundingClientRect();if(!ir.width)return;
    const nx=Math.min(1,Math.max(0,(e.clientX-ir.left)/ir.width)),ny=Math.min(1,Math.max(0,(e.clientY-ir.top)/ir.height));
    board.scrollLeft+=ar.left+nx*ar.width-(br.left+br.width/2);board.scrollTop+=ar.top+ny*ar.height-(br.top+br.height/2);
  }
  box.addEventListener('pointerdown',e=>{if(e.button)return;e.preventDefault();box.setPointerCapture(e.pointerId);goto(e);box._on=true});
  box.addEventListener('pointermove',e=>{if(box._on)goto(e)});
  const end=()=>{box._on=false};box.addEventListener('pointerup',end);box.addEventListener('pointercancel',end);
  $('nvzi').onclick=()=>$('zi').click();$('nvzo').onclick=()=>$('zo').click();$('nvfit').onclick=()=>$('zl').click();
  $('nv100').onclick=()=>WBX.wbZoomTo(1);
  // ---- hand tool
  const setHand=on=>{hand=on;document.body.classList.toggle('handtool',hand||space);$('nvhand').setAttribute('aria-pressed',String(hand))};
  $('nvhand').onclick=()=>setHand(!hand);
  board.addEventListener('pointerdown',e=>{
    if(!(e.button==1||(e.button==0&&(hand||space))))return;
    e.preventDefault();e.stopPropagation();board.setPointerCapture(e.pointerId);
    pan={x:e.clientX,y:e.clientY,l:board.scrollLeft,t:board.scrollTop,id:e.pointerId};document.body.classList.add('panning');
  },true);
  board.addEventListener('pointermove',e=>{if(!pan||e.pointerId!=pan.id)return;board.scrollLeft=pan.l-(e.clientX-pan.x);board.scrollTop=pan.t-(e.clientY-pan.y)});
  const stop=e=>{if(pan&&e.pointerId==pan.id){pan=null;document.body.classList.remove('panning')}};
  board.addEventListener('pointerup',stop);board.addEventListener('pointercancel',stop);
  // ---- keys
  const typing=t=>t&&t.matches&&t.matches('input,select,textarea,[contenteditable]');
  // Ctrl/Cmd and + - 0 zoom the picture, not the whole browser page (the habit from Photoshop and Figma)
  document.addEventListener('keydown',e=>{
    if(!(e.ctrlKey||e.metaKey)||e.altKey||typing(e.target)||$('boardP').classList.contains('off'))return;
    if(e.key=='='||e.key=='+'){e.preventDefault();$('zi').click()}
    else if(e.key=='-'||e.key=='_'){e.preventDefault();$('zo').click()}
    else if(e.key=='0'){e.preventDefault();$('zl').click()}
  });
  document.addEventListener('keydown',e=>{
    if(typing(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==' '&&!e.repeat&&!$('boardP').classList.contains('off')){space=true;document.body.classList.add('handtool');if(e.target==document.body||e.target==board)e.preventDefault();return}
    if(e.key=='+'||e.key=='='){e.preventDefault();$('zi').click()}
    else if(e.key=='-'){e.preventDefault();$('zo').click()}
    else if(e.key=='1'){e.preventDefault();WBX.wbZoomTo(1)}
    else if(e.key.toLowerCase()=='h'&&!e.shiftKey){e.preventDefault();setHand(!hand)}
  });
  document.addEventListener('keyup',e=>{if(e.key==' '){space=false;document.body.classList.toggle('handtool',hand)}});
  window.addEventListener('blur',()=>{space=false;document.body.classList.toggle('handtool',hand)});
}
export {init41};
