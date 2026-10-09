import {$,WBS,WBX} from './01-launch-and-version.js';
import {PL,col} from './04-canvas-and-stamp-outlines.js';
import {ser} from './14-presets-and-layer-grid-ui.js';
import {coreStr} from './18-projects-and-cover-overlay.js';
import {lkApplyPalette,lkNameMap} from './46-presets.js';
// ===== Variations =====
// Six other colour schemes for the piece you have, shown as small pictures. Click one to use it (one step in the history); More
// makes six new ones. They come from Wada's 348 combinations, with the same number of colours as the palette you have and a paper of
// a similar lightness. The pictures are the piece's own drawing with its colours swapped, so nothing on the canvas changes until you click.
const VR_N=6;
const vrLum=h=>{const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(u=>u<=.04045?u/12.92:Math.pow((u+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2]};
const vrSize=p=>[p[1],p[2],p[3],p[4]].filter(Boolean).length;
const vrImg=url=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=url});
function vrPick(){
  const op=WBS.proj,n=[op.ink,op.bg,op.c3,op.c4].filter(Boolean).length,L0=vrLum(col(op.bg));
  const same=(p,i)=>p[2]==op.bg&&p[1]==op.ink&&(p[3]||'')==(op.c3||'')&&(p[4]||'')==(op.c4||'');
  let pool=PL.map((p,i)=>({p,i})).filter(x=>vrSize(x.p)==n&&!same(x.p));
  const near=pool.filter(x=>Math.abs(vrLum(col(x.p[2]))-L0)<.3);if(near.length>=VR_N)pool=near;
  const out=[];while(out.length<VR_N&&pool.length){const k=Math.floor(Math.random()*pool.length);out.push(pool.splice(k,1)[0])}
  return out;
}
// the piece's own picture with every colour moved to its new place (exact colour words only)
function vrRecolor(svg,from,to){
  let s=svg;const pairs=[...from.entries()].filter(([a,b])=>a&&b&&a!==b);
  pairs.forEach(([a],k)=>{s=s.split(new RegExp(col(a).replace('#','#'),'i').source).join('\u0001'+k+'\u0001')});
  pairs.forEach(([,b],k)=>{s=s.split('\u0001'+k+'\u0001').join(col(b))});
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
        const np={ink:x.p[1],bg:x.p[2],c3:x.p[3],c4:x.p[4]},to=lkNameMap(c,np),names=new Set([c.proj.bg,c.proj.ink,c.proj.c3,c.proj.c4,...c.tiles.map(t=>t.ink),...c.layers.map(l=>l.ink)].filter(Boolean)),map=new Map();
        names.forEach(n=>map.set(n,to(n)));
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
export {init47};
