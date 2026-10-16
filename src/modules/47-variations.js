import {$,WBS,WBX} from './01-launch-and-version.js';
import {CM,PL,col} from './04-canvas-and-stamp-outlines.js';
import {ser} from './14-presets-and-layer-grid-ui.js';
import {coreStr} from './18-projects-and-cover-overlay.js';
import {lkApplyPalette} from './46-presets.js';
import {slotHex,slotName} from './50-tray-core.js';
// ===== Variations =====
// Six other colour schemes for the piece you have, shown as small pictures. Click one to use it (one step in the history); More
// makes six new ones. They come from Wada's 348 combinations, with the same number of colours as the palette you have and a paper of
// a similar lightness. The pictures are the piece's own drawing with its colours swapped, so nothing on the canvas changes until you click.
const VR_N=6;
const vrLum=h=>{const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(u=>u<=.04045?u/12.92:Math.pow((u+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2]};
const vrSize=p=>[p[1],p[2],p[3],p[4]].filter(Boolean).length;
const vrImg=url=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=url});
function vrPick(){
  // as many colours as the tray's first places hold (2 to 4), a paper of a similar lightness, and never the colours you already have
  const op=WBS.proj,n=Math.max(2,Math.min(4,op.ts.length)),L0=vrLum(col(op.bg)),nm=op.ts.slice(0,n).map(id=>slotName(id));
  const same=p=>[p[2],p[1],p[3],p[4]].filter(Boolean).every((x,i)=>x===nm[i]);
  let pool=PL.map((p,i)=>({p,i})).filter(x=>vrSize(x.p)==n&&!same(x.p));
  const near=pool.filter(x=>Math.abs(vrLum(col(x.p[2]))-L0)<.3);if(near.length>=VR_N)pool=near;
  const out=[];while(out.length<VR_N&&pool.length){const k=Math.floor(Math.random()*pool.length);out.push(pool.splice(k,1)[0])}
  return out;
}
// the piece's own picture with every colour moved to its new place (exact colour words only)
function vrRecolor(svg,from){
  // from: Map of colour (as drawn) -> new colour. Both cases of the hex are swapped.
  let s=svg;const pairs=[...from.entries()].filter(([a,b])=>a&&b&&a!==b);
  pairs.forEach(([a],k)=>{[a,a.toUpperCase()].forEach(v=>{s=s.split(v).join('\u0001'+k+'\u0001')})});
  pairs.forEach(([a,b],k)=>{s=s.split('\u0001'+k+'\u0001').join(a.length==9&&b.length==7?b+a.slice(7):b)});
  return s;
}
function init47(){
  const grid=$('vrg'),sec=document.querySelector('section.pn[data-p="vars"]');let stale=true,busy=false,timer=0,items=[];
  const open=()=>!sec.hidden&&sec.getClientRects().length>0;
  async function make(){
    if(busy||!open())return;busy=true;stale=false;
    try{
      const pick=vrPick(),c=JSON.parse(coreStr()),svg=ser();
      grid.textContent='';items=pick;
      const cells=pick.map(x=>{const b=document.createElement('button');b.type='button';b.className='vrb';b.dataset.i=x.i;b.setAttribute('role','listitem');b.setAttribute('aria-label',x.p[0]);
        const im=document.createElement('span');im.className='im';im.appendChild(document.createElement('i'));const nm=document.createElement('b');nm.textContent=x.p[0];b.append(im,nm);grid.appendChild(b);return{b,im,x}});
      await Promise.all(cells.map(async({im,x})=>{
        // the tray's first places take the combination's colours, paper first: every colour linked to them moves with them
        const nc=[x.p[2],x.p[1],x.p[3],x.p[4]].filter(Boolean).map(n=>CM[n]),map=new Map();
        c.proj.ts.slice(0,nc.length).forEach((id,k)=>map.set(slotHex(id),nc[k]));
        const img=await vrImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(vrRecolor(svg,map)));
        if(!img){im.textContent='';return}
        const w=220,h=Math.max(1,Math.round(w*img.naturalHeight/img.naturalWidth)),cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(img,0,0,w,h);
        const t=document.createElement('img');t.alt='';t.src=cv.toDataURL('image/jpeg',.8);im.textContent='';im.appendChild(t);
      }));
    }finally{busy=false}
    if(stale)soon();
  }
  const soon=()=>{clearTimeout(timer);timer=setTimeout(make,900)};
  WBX.wbVarDirty=()=>{stale=true;if(open())soon()};
  new MutationObserver(()=>{if(open()&&(stale||!items.length))make()}).observe(sec,{attributes:true,attributeFilter:['hidden']});
  grid.addEventListener('click',e=>{const b=e.target.closest('.vrb');if(b)lkApplyPalette(+b.dataset.i)});
  $('vrmore').onclick=()=>{stale=true;make()};
}
export {init47,vrRecolor};
