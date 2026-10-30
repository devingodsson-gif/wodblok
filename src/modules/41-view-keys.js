import {$,WBX} from './01-launch-and-version.js';
// ===== Zoom keys and hand tool =====
// Hand tool: hold Space, press the middle mouse button, or switch the Hand button on (or press H), then drag the picture to move it.
// Zoom keys: + and - zoom, 1 shows the piece at 100%, 0 fits it to the screen. (The Navigator panel was removed in 2.9.0.)
function init41(){
  const board=$('boardP');
  let hand=false,space=false,pan=null;
  $('nv100').onclick=()=>WBX.wbZoomTo(1);
  // ---- hand tool
  const setHand=on=>{hand=on;document.body.classList.toggle('handtool',hand||space);$('nvhand').setAttribute('aria-pressed',String(hand))};
  $('nvhand').onclick=()=>setHand(!hand);
  // on document (not the board) so a middle-button drag that starts on the round + of an empty canvas pans too
  document.addEventListener('pointerdown',e=>{
    if(!(e.button==1||(e.button==0&&(hand||space))))return;
    if(!board.contains(e.target))return;
    e.preventDefault();e.stopPropagation();board.setPointerCapture(e.pointerId);
    pan={x:e.clientX,y:e.clientY,l:board.scrollLeft,t:board.scrollTop,id:e.pointerId};document.body.classList.add('panning');
  },true);
  // 2.76.11: the browser's own middle-click autoscroll would take the drag; the board keeps it
  document.addEventListener('mousedown',e=>{if(e.button==1&&board.contains(e.target))e.preventDefault()},true);
  board.addEventListener('pointermove',e=>{if(!pan||e.pointerId!=pan.id)return;board.scrollLeft=pan.l-(e.clientX-pan.x);board.scrollTop=pan.t-(e.clientY-pan.y)});
  const stop=e=>{if(pan&&e.pointerId==pan.id){pan=null;document.body.classList.remove('panning')}};
  board.addEventListener('pointerup',stop);board.addEventListener('pointercancel',stop);
  // ---- keys
  const typing=t=>t&&t.matches&&t.matches('input,select,textarea,[contenteditable]');
  // Ctrl/Cmd and + - 0 zoom the picture, not the whole browser page (the habit from Photoshop and Figma)
  document.addEventListener('keydown',e=>{
    if(!(e.ctrlKey||e.metaKey)||e.altKey||typing(e.target))return;
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
