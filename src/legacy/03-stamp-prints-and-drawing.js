// ---- v66 stamp prints. Every distinct impression (a stamp, its pressure side, its rim variant) is printed once into an image by the
// browser's own SVG engine; the pattern then places those images instead of re-running the masks and filters for every copy.
// The vector pattern is still built every time and is what every export, copy and eyedropper uses. Zoomed in past fit, the pattern draws live.
const BK={map:new Map(),alt:new Map(),q:new Map(),busy:0,tm:0,n:0,off:0,live:0,sc:1,sc0:0,wasLive:0,shown:0,defT:0,fail:0,last:0,inT:0,inTm:0,gen:0,cont:0,
 T:{},TD:{},P:{},PC:{},PF:{},PD:new Map(),dead:[],vdyn:null,vdefs:null,MAXC:2048,nHit:0,nStale:0,nRes:0,nMiss:0,st:{hit:0,stale:0,miss:0,bakes:0,ms:0,printed:0,defer:0}};
const DRS=()=>WBS.DRAFT&&(BK.off||BK.live); // stamp-level drafting is only needed when the pattern is drawn live
const bkH=s=>{s=s.replace(/(id="|#)k[csw]\d+/g,'$1k');let h=2166136261,g=0;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h=Math.imul(h^c,16777619);g=(Math.imul(g,31)+c)|0}return(h>>>0).toString(36)+'.'+(g>>>0).toString(36)+'.'+s.length};
// prints are made at exactly the size they show at (that is what makes them look the same as the live drawing)
const bkQ=x=>+Math.max(.02,x).toPrecision(5);
function bkScale(){if(WBS.WBDRG&&WBS._bkS>0)return WBS._bkS;return WBS._bkS=bkScale0()}
function bkScale0(){const d=window.devicePixelRatio||1,a=$('art');let s=0;try{const m=a.getScreenCTM();if(m&&m.a)s=Math.hypot(m.a,m.b)}catch(e){}
 if(!(s>0)){let w=parseFloat(a.style.width);if(!(w>0))w=a.getBoundingClientRect().width;s=(w>0?w:CW)/CW}
 try{if(WBS.curView=='stamp'){const r=$('pvw').getBoundingClientRect();if(r.width>0&&r.height>0)s=Math.max(s,Math.min(r.width/CW,r.height/CH)*pvZ)}}catch(e){}return s*d}
function bkPre(){BK.live=!!(window.wbZoomIn&&wbZoomIn());BK.sc=bkScale()}
const bkSurf=t=>SURFC[t]?(WBS.edInk?SURFC[t].s:`<mask id="is${t}" maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000"><rect x="-100000" y="-100000" width="200000" height="200000" fill="#fff"/></mask>`):'';
function bkTile(t,td){BK.TD[t.id]=td;BK.T[t.id]=bkH(td+'|'+(SURFC[t.id]?SURFC[t.id].k:'')+'|'+WBS.edInk)}
const RXU=/<use href="#(q(\d+)_(\d+)_(\d+)|s(\d+))"((?: data-[a-z]+="[^"]*")*)((?: opacity="[^"]*")?) transform="(translate\([^)]*\) rotate\([^)]*\) scale\(([-\d.]+) ([-\d.]+)\) translate\(([-\d.]+) ([-\d.]+)\))"((?: filter="url\(#[^)]+\)")?)\/>/g;
const RXG=/<g((?: data-[a-z]+="[^"]*")*)((?: opacity="[^"]*")?) transform="(translate\([^)]*\) rotate\([^)]*\) scale\(([-\d.]+) ([-\d.]+)\) translate\(([-\d.]+) ([-\d.]+)\))"((?: filter="url\(#[^)]+\)")?)><use href="#s(\d+)"\/><use href="#e(\d+)_(\d+)" fill="([^"]*)"\/><\/g>/g;
const RXM=/<!--@([FPE]):(\w+)-->([\s\S]*?)<!--@-->/g;
// one impression: the printed image when there is one (an out-of-date one is fine for a moment, it is reprinted right away), else null = draw it live
function bkOne(slot,inner,tid,pk,ch,sx,sy,tw,th,dc,op,tr,flt,used){const W=-2*tw,H=-2*th;if(!(W>0&&H>0))return null;
 const bx=bkQ(Math.abs(sx)*BK.sc),by=bkQ(Math.abs(sy)*BK.sc);if(W*bx>BK.MAXC||H*by>BK.MAXC)return null;
 const key=slot+'@'+bx+'x'+by,e=BK.map.get(key),fit=x=>x&&x.W===W&&x.H===H;let u=fit(e)?e:null;
 if(u&&u.h===ch)BK.nHit++;
 else{if(!u){const a=BK.map.get(BK.alt.get(slot));if(fit(a))u=a}
  if(u&&u.h===ch&&BK.cont)BK.nHit++; // only the size is off, and something is being dragged: reprinted when it is let go
  else{if(!BK.q.has(key))BK.q.set(key,{slot,inner,tid,pk,h:ch,W,H,bx,by});else{const j=BK.q.get(key);j.inner=inner;j.h=ch;j.tid=tid;j.pk=pk}
   if(!u)BK.nMiss++;else if(u.h!==ch)BK.nStale++;else BK.nRes++}}
 if(!u)return null;u.u=BK.gen;used.add(u);const f=v=>+v.toFixed(4);
 return`<use href="#bk${u.n}" x="${f(-2/u.sx)}" y="${f(-2/u.sy)}" width="${f(u.cw/u.sx)}" height="${f(u.ch/u.sy)}"${dc}${op} transform="${tr}"${flt}/>`}
function bkSub(s,used,need){
 s=s.replace(RXU,(m,href,li,t1,bin,t2,dc,op,tr,sx,sy,tw,th,flt)=>{const pk=li!=null?li+'_'+t1+'_'+bin:'',tid=pk?t1:t2;
  const r=bkOne(pk?'q'+pk:'s'+tid,`<use href="#${href}"/>`,tid,pk,pk?(BK.P[pk]||'?')+BK.T[tid]:BK.T[tid],+sx,+sy,+tw,+th,dc,op,tr,flt,used);
  if(!r&&pk){need.add('P'+pk);need.add('F'+li+'_'+t1);need.add('E'+t1)}return r||m});
 return s.replace(RXG,(m,dc,op,tr,sx,sy,tw,th,flt,tid,t2,ev,fill)=>{
  const r=bkOne('g'+tid+'_'+ev,`<g><use href="#s${tid}"/><use href="#e${t2}_${ev}" fill="${fill}"/></g>`,tid,'',BK.T[tid]+'|'+ev+'|'+fill,+sx,+sy,+tw,+th,dc,op,tr,flt,used);
  if(!r)need.add('E'+t2);return r||m})}
const bkDefs=used=>{let o='';used.forEach(e=>o+=`<symbol id="bk${e.n}" viewBox="${e.cx} ${e.cy} ${e.cw} ${e.ch}" preserveAspectRatio="none"><image href="${e.A.url}" width="${e.A.w}" height="${e.A.h}"/></symbol>`);return o};
const bkDrop=e=>{if(e&&e.A&&--e.A.live<=0)BK.dead.push(e.A.url)};
const bkFlush=()=>{if(window.wbHoldOn)return;if(BK.dead.length){const d=BK.dead;BK.dead=[];setTimeout(()=>d.forEach(u=>URL.revokeObjectURL(u)),3000)}};
// put the pattern on screen. f, defs, ik: the definitions; lg: the printed layers; body(lg): everything after the definitions
function bkShow(f,defs,ik,lg,body){BK.vdefs=f+defs+ik;BK.vdyn='<defs>'+BK.vdefs+'</defs>'+body(lg);BK.wasLive=BK.live;BK.sc0=BK.sc;
 if(BK.off||BK.live){$('dyn').innerHTML=BK.vdyn;BK.shown=1;BK.defT=0;return}
 const now=performance.now();BK.cont=WBS.DRAFT||now-BK.inT<450;BK.gen++;BK.nHit=BK.nStale=BK.nRes=BK.nMiss=0;const used=new Set(),need=new Set();
 const d2=bkSub(defs,used,need),l2=bkSub(lg,used,need);try{if(WBS.fpB!=null&&WBS.fpB!==false)need.add('E'+WBS.fpB)}catch(e){}
 BK.st.hit+=BK.nHit;BK.st.stale+=BK.nStale;BK.st.miss+=BK.nMiss;
 // a big one-off change (randomize, undo, a new palette): keep the old picture up for a moment while the new stamps print, rather than flashing
 // a mix of old and new. While something is being dragged or a slider moves, the picture always updates at once.
 const chg=BK.nStale+BK.nMiss,tot=chg+BK.nHit+BK.nRes;
 if(chg&&BK.shown&&!BK.cont&&BK.q.size&&(BK.nMiss||chg>=tot*.4)&&(!BK.defT||now-BK.defT<700||window.wbHoldOn&&now-BK.defT<15000)){if(!BK.defT)BK.defT=now;BK.st.defer++;bkKick(0);return}
 BK.defT=0;$('dyn').innerHTML=`<defs>${f}${d2.replace(RXM,(m,k,id,b)=>need.has(k+id)?b:'')}${ik}${bkDefs(used)}</defs>`+body(l2);BK.shown=1;
 // prints that have not been shown for a while are let go
 if(BK.map.size>300)for(const[k,e]of BK.map)if(BK.gen-(e.u||0)>4){bkDrop(e);BK.map.delete(k)}
 bkFlush();bkKick(WBS.DRAFT?120:20)}
function bkKick(d){if(BK.tm||BK.busy||!BK.q.size||BK.off)return;BK.tm=setTimeout(()=>{BK.tm=0;const n=performance.now();if((WBS.DRAFT||n-BK.inT<300)&&n-BK.last<350){bkKick(100);return}bkRun()},d==null?20:d)}
async function bkRun(){if(BK.busy||!BK.q.size||BK.off)return;BK.busy=1;const t0=performance.now();
 try{const MW=4096,MH=4096,G=4,P=2,take=[],cells=[],tids=new Set(),pks=new Set();let x=0,y=0,rh=0,aw=0;
  for(const[slot,j]of BK.q){const sx=Math.min(j.bx,BK.MAXC/j.W),sy=Math.min(j.by,BK.MAXC/j.H),cw=Math.ceil(j.W*sx)+2*P,ch=Math.ceil(j.H*sy)+2*P;
   if(x&&x+cw>MW){x=0;y+=rh+G;rh=0}if(take.length&&y+ch>MH)break;
   j.c={x,y,cw,ch,sx,sy};cells.push(`<g transform="translate(${x+P} ${y+P}) scale(${sx} ${sy})">${j.inner}</g>`);take.push([slot,j]);x+=cw+G;rh=Math.max(rh,ch);aw=Math.max(aw,x);tids.add(j.tid);if(j.pk)pks.add(j.pk)}
  take.forEach(([k])=>BK.q.delete(k));
  let defs='';tids.forEach(t=>defs+=(BK.TD[t]||'')+bkSurf(t));pks.forEach(k=>{const x=k.slice(0,k.lastIndexOf('_'));defs+=(BK.PF[x]||'')+(BK.PC[k]||'')});
  const ah=y+rh,u=URL.createObjectURL(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}"><defs>${defs}</defs>${cells.join('')}</svg>`],{type:'image/svg+xml'}));
  let img;try{img=await new Promise((r,f)=>{const i=new Image();i.onload=()=>r(i);i.onerror=f;i.src=u})}finally{URL.revokeObjectURL(u)}
  const C=document.createElement('canvas');C.width=aw;C.height=ah;const X=C.getContext('2d',{willReadFrequently:true});X.drawImage(img,0,0);
  const blob=bkPng(X.getImageData(0,0,aw,ah));
  const A={url:URL.createObjectURL(blob),w:aw,h:ah,live:0};
  take.forEach(([key,j])=>{bkDrop(BK.map.get(key));BK.map.delete(key);A.live++;BK.map.set(key,{n:++BK.n,A,cx:j.c.x,cy:j.c.y,cw:j.c.cw,ch:j.c.ch,sx:j.c.sx,sy:j.c.sy,h:j.h,W:j.W,H:j.H,u:BK.gen});BK.alt.set(j.slot,key)});
  if(!A.live)URL.revokeObjectURL(A.url);
  BK.st.printed+=take.length;BK.fail=0}
 catch(e){if(++BK.fail>2)BK.off=1}
 BK.st.bakes++;BK.st.ms+=performance.now()-t0;BK.busy=0;BK.last=performance.now();if(typeof upd=='function')upd();bkKick(20)}
// a plain, uncompressed PNG: the browser's own PNG encoder takes over a second on a big sheet of prints, this takes a few milliseconds
let bkCT=null;
function bkPng(id){const w=id.width,h=id.height,px=id.data,rl=w*4+1,n=rl*h,nb=Math.max(1,Math.ceil(n/65535)),zl=2+n+nb*5+4,buf=new Uint8Array(8+25+12+zl+12+12),dv=new DataView(buf.buffer);
 if(!bkCT){bkCT=new Int32Array(256);for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;bkCT[i]=c}}
 const crc=(s,e)=>{let c=-1;for(let i=s;i<e;i++)c=bkCT[(c^buf[i])&255]^(c>>>8);return ~c>>>0};
 buf.set([137,80,78,71,13,10,26,10]);let p=8;
 const chunk=(type,len,fill)=>{dv.setUint32(p,len);p+=4;const s=p;for(let i=0;i<4;i++)buf[p++]=type.charCodeAt(i);fill();dv.setUint32(p,crc(s,p));p+=4};
 chunk('IHDR',13,()=>{dv.setUint32(p,w);dv.setUint32(p+4,h);buf.set([8,6,0,0,0],p+8);p+=13});
 chunk('IDAT',zl,()=>{buf[p++]=0x78;buf[p++]=1;let a=1,b=0,left=n,y=0,col=0;
  for(let k=0;k<nb;k++){const l=Math.min(65535,left);left-=l;buf[p++]=left?0:1;buf[p++]=l&255;buf[p++]=l>>8;buf[p++]=~l&255;buf[p++]=(~l>>8)&255;
   let r=l;while(r){if(col==0){buf[p++]=0;a+=0;b+=a;col=1;r--;continue}const take=Math.min(r,rl-col),o=y*w*4+col-1;buf.set(px.subarray(o,o+take),p);
    for(let i=p,e=p+take;i<e;i++){a+=buf[i];b+=a;if((i&4095)==4095){a%=65521;b%=65521}}a%=65521;b%=65521;p+=take;r-=take;col+=take;if(col==rl){col=0;y++}}}
  dv.setUint32(p,((b%65521)<<16|(a%65521))>>>0);p+=4});
 chunk('IEND',0,()=>{});return new Blob([buf.subarray(0,p)],{type:'image/png'})}
// zooming or resizing: redraw when the pattern switches between printed and live, or shows at a new size
window.bkZ=()=>{if(BK.off||!BK.shown)return;const live=!!(window.wbZoomIn&&wbZoomIn());if(live!==!!BK.wasLive||(!live&&Math.abs(bkScale()/BK.sc0-1)>1e-4))upd()};
// the vector pattern, for exports and anything else that turns the canvas into a picture
window.wbVec=c=>{const d=c&&c.querySelector('#dyn');if(d&&BK.vdyn!=null)d.innerHTML=BK.vdyn.replace(/<!--@[^>]*-->/g,'')};
// sliders, colour pickers and wheel zoom count as continuous: the picture follows at once, exact prints come a moment after they stop
const bkIn=()=>{BK.inT=performance.now();clearTimeout(BK.inTm);BK.inTm=setTimeout(()=>{if(typeof upd=='function')upd()},500)};
document.addEventListener('input',e=>{const t=e.target;if(e.isTrusted&&t&&(t.type=='range'||t.type=='color'||t.type=='number'))bkIn()},true);addEventListener('wheel',e=>{if(e.isTrusted&&(e.ctrlKey||e.metaKey))bkIn()},{capture:true,passive:true});


