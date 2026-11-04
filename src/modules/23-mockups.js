import {cmdRegister} from '../commands/registry.js';
import {MKIMG} from '../data/mockups.js';
import {collection,kv,use} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,physOf,tileOn,tileRk} from './04-canvas-and-stamp-outlines.js';
import {expName,ser} from './14-presets-and-layer-grid-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {unGet} from './98-units.js';
import {ltMake} from './87-library-tree.js';

// ===== Mockups (2.90.1, docs/mockups-plan.md; owner Nov 3 2026: "Let's do mockups": a live Mockup panel, people's own photos with four corners, built-in products later).
// A mockup is a photo and its print area: four corners on the photo (q: [x0,y0, x1,y1, x2,y2, x3,y3] as fractions of its width and height, top left, top right, bottom
// right, bottom left). The design (the canvas as it is exported) is laid flat at the print area's size, Repeat (side by side on the repeat tile's lattice) or Once, warped
// onto the four corners, multiplied by the photo's light by Shading, and cut to the print area; the photo shows everywhere else. Nothing goes in the project.
// Your mockups are a library on the shared folder tree (87-library-tree.js) as cards. The photos are kept in this browser (IndexedDB, collection 'mockups'); names, folders,
// corners and a small picture in kv (MK_KEY); the mockup in use and the panel's settings in MK_UI.
// 2.90.2 (step 2): the built-in Products set (the owner's photos, mockups/ and src/data/mockups.js; ids 'p-' + the product's id). Each has a mask (where the design
// prints, so a T-shirt's sleeves and a cushion's corners take it and the background does not), its real width (cm: Real size lays the repeat at the size it prints at
// when the canvas has a real size) and warp (how much the design follows the folds: it is moved by the photo's light, as a displacement map).
const MK_KEY='wb2901_mockups',MK_UI='wb2901_mockui',MK_TREE='wb2901_mocktree',MK_MAX=2000,MK_TH=320,MK_N=14;
let MKT=null,mkC=null,mkCr=null,mkCol=null,mkDes=null,mkDesK='',mkT=0,mkTok=0,mkDrag=null,mkBusy=false;
const mkPh=new Map();   // id -> HTMLImageElement of the photo, loaded once
const mkEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mkName=s=>String(s||'').replace(/\.[^.]*$/,'').replace(/[<>&"|]/g,'').trim().slice(0,40)||'Mockup';
const mkQ0=[.15,.15,.85,.15,.85,.85,.15,.85];
const mkQok=q=>Array.isArray(q)&&q.length==8&&q.every(v=>typeof v=='number'&&isFinite(v)&&v>=-.5&&v<=1.5);
// ---- the store
function mkLoad(){let raw=null;try{raw=kv.get(MK_KEY)}catch(e){}
 if(mkC===null||raw!==mkCr){let d=null;try{d=JSON.parse(raw||'null')}catch(e){}if(!d||typeof d!='object')d={};
  d.f=(Array.isArray(d.f)?d.f:[]).filter(x=>typeof x=='string'&&x&&x.length<=200);
  d.t=(Array.isArray(d.t)?d.t:[]).filter(x=>x&&/^m[\w-]{1,30}$/.test(x.id)&&x.w>0&&x.h>0&&typeof x.th=='string'&&/^data:image\/(?:webp|png|jpeg);base64,/.test(x.th))
   .map(x=>({id:x.id,n:mkName(x.n),f:typeof x.f=='string'?x.f:'',w:+x.w,h:+x.h,th:x.th,q:mkQok(x.q)?x.q.slice():mkQ0.slice(),...(x.am?{am:1,tol:Number.isFinite(+x.tol)?Math.max(0,Math.min(100,+x.tol)):50}:{}),...(+x.warp>0?{warp:Math.min(1,+x.warp)}:{}),...(+x.cm>0?{cm:Math.min(10000,+x.cm)}:{})}));
  d.h=(Array.isArray(d.h)?d.h:[]).filter(x=>typeof x=='string'&&x.length<=60);d.r=d.r&&typeof d.r=='object'&&!Array.isArray(d.r)?d.r:{};d.b={};mkC=d;mkCr=raw}
 return{f:[...mkC.f],t:mkC.t.map(x=>({...x,q:x.q.slice()})),h:[...mkC.h],r:{...mkC.r},b:{}}}
const mkStore=d=>{try{kv.set(MK_KEY,JSON.stringify(d));mkC=null;return true}catch(e){pmsg('Could not keep the mockups in this browser.');return false}};
const MK_B=MKIMG.map(e=>({id:'p-'+e.id,n:e.n,w:e.w,h:e.h,q:e.q.slice(),th:e.src,src:e.src,mask:e.mask,cm:e.cm,warp:e.warp,b:1}));
const mkGet=id=>{if(typeof id!='string')return null;if(id.startsWith('p-')){const b=MK_B.find(x=>x.id===id);return b?{...b,q:b.q.slice()}:null}return mkLoad().t.find(x=>x.id===id)||null};
// the mockup showing: the one chosen, else the first product
const mkCur=()=>mkGet(mkUi().cur)||(MK_B[0]?mkGet(MK_B[0].id):null);
// the panel's settings: the mockup in use, Fill, Scale (one value for Repeat and one for Once), Shading
function mkUi(){let u=null;try{u=JSON.parse(kv.get(MK_UI)||'null')}catch(e){}u=u&&typeof u=='object'?u:{};
 const n=(v,lo,hi,d)=>{v=+v;return isFinite(v)&&u!=null?Math.max(lo,Math.min(hi,v)):d};
 return{cur:typeof u.cur=='string'?u.cur:'',rs:!!u.rs,fill:u.fill=='one'||u.fill=='rep'?u.fill:'',sr:u.sr==null?25:n(u.sr,5,200,25),so:u.so==null?100:n(u.so,10,200,100),sh:u.sh==null?100:n(u.sh,0,100,100)}}
const mkUiSet=o=>{try{kv.set(MK_UI,JSON.stringify({...mkUi(),...o}))}catch(e){}};
const mkFill=u=>u.fill||(tileOn()?'rep':'one');
// ---- photos (IndexedDB; this session only where the browser has none)
const mkMem=new Map();
async function mkCol0(){if(mkCol===null)mkCol=(await collection('mockups'))||false;return mkCol||null}
async function mkPhotoPut(id,src){mkMem.set(id,src);const c=await mkCol0();if(c)try{await c.doc(id).set(src)}catch(e){}}
async function mkPhotoGet(id){if(mkMem.has(id))return mkMem.get(id);const c=await mkCol0();if(!c)return null;try{const s=await c.doc(id).get();if(s.exists){const v=s.data();if(typeof v=='string'){mkMem.set(id,v);return v}}}catch(e){}return null}
async function mkPhotoDel(id){mkMem.delete(id);mkMem.delete(id+'~mask');mkPh.delete(id);const c=await mkCol0();if(c)try{await c.doc(id).delete();await c.doc(id+'~mask').delete()}catch(e){}}
const mkImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});
async function mkPhoto(id){if(mkPh.has(id))return mkPh.get(id);const b=MK_B.find(x=>x.id===id),s=b?b.src:await mkPhotoGet(id);const i=s?await mkImg(s):null;if(i)mkPh.set(id,i);return i}
// a picture you chose becomes a mockup in the open folder: at most MK_MAX pixels on its long side, its print area a rectangle in the middle until its corners are set
async function mkAdd(f){if(!f||!/^image\//.test(f.type)&&!/\.(png|jpe?g|webp)$/i.test(f.name||'')){pmsg('That file is not a picture.');return null}if(f.size>40e6){pmsg('That picture is too large. Try one under 40 MB.');return null}
 const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=()=>r(null);fr.readAsDataURL(f)}),img=url&&await mkImg(url);if(!img){pmsg('Could not read that picture.');return null}
 const nw=img.naturalWidth||1,nh=img.naturalHeight||1,k=Math.min(1,MK_MAX/Math.max(nw,nh)),w=Math.max(8,Math.round(nw*k)),h=Math.max(8,Math.round(nh*k)),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
 const enc=(cv,q)=>{const s=cv.toDataURL('image/webp',q);return s.startsWith('data:image/webp')?s:cv.toDataURL('image/jpeg',q)};
 const t=document.createElement('canvas'),tk=MK_TH/Math.max(w,h);t.width=Math.max(1,Math.round(w*tk));t.height=Math.max(1,Math.round(h*tk));t.getContext('2d').drawImage(c,0,0,t.width,t.height);
 const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),src=enc(c,.86),d=mkLoad();await mkPhotoPut(id,src);
 d.t.push({id,n:mkName(f.name),f:MKT?MKT.here():'',w,h,th:enc(t,.8),q:mkQ0.slice()});mkStore(d);
await mkFindSet(id,true,null);   // 2.92.2: the product is found at once, at the Tolerance that gives the smoothest outline; where it is not (it touches every edge), the corners stay in the middle
 return id}
// a product's mask, loaded once
const mkMk=new Map();
async function mkMask(m){if(!m||!(m.mask||m.am))return null;const k=m.id+'|'+(m.tol||0);if(mkMk.has(k))return mkMk.get(k);const src=m.mask||await mkPhotoGet(m.id+'~mask');const i=src?await mkImg(src):null;if(i)mkMk.set(k,i);return i}
// ---- Find product (2.92.2, docs/own-mockups-plan.md step 1; owner Nov 4 2026: "I want to give it a photo and it generates the mask with a tolerance slider to help").
// The background's colours are read from the photo's border (a ring 3% wide, in 32 pieces, each piece's median); every pixel's distance to the nearest of them is
// measured with colour counting more than light (a white product on a pale wall differs mostly in colour) and texture too (a linen cushion's shaded side is the wall's
// colour but not its smoothness: the fine detail left when the picture is blurred a little); what is within the Tolerance's distance and reaches the
// border is background, the rest product: its largest part, holes and all (a product's own shaded or pale parts stay in). Tolerance 0 to 100: the higher, the more
// counts as background (as Photoshop's Magic Wand on the background). Worked at up to 1200 pixels on the long side; the mask is that size and drawn at any size.
// Returns {c: the mask (white, alpha = product), q: the product's box as four corners} or null when nothing is found (a product that touches every edge, as a wall).
// each pixel's distance (squared) to the nearest background colour: light, colour and texture
function mkDist(d,W,H){const n=W*H,Y=new Float32Array(n),Cb=new Float32Array(n),Cr=new Float32Array(n);
 for(let i=0,p=0;i<n;i++,p+=4){const r=d[p],g=d[p+1],b=d[p+2];Y[i]=.299*r+.587*g+.114*b;Cb[i]=-.1687*r-.3313*g+.5*b;Cr[i]=.5*r-.4187*g-.0813*b}
 const box=(a,r)=>{const t=new Float32Array(n),o=new Float32Array(n),k=2*r+1;for(let yy=0;yy<H;yy++){let s=0;const b=yy*W;for(let xx=-r;xx<=r;xx++)s+=a[b+Math.min(W-1,Math.max(0,xx))];for(let xx=0;xx<W;xx++){t[b+xx]=s/k;s+=a[b+Math.min(W-1,xx+r+1)]-a[b+Math.max(0,xx-r)]}}
  for(let xx=0;xx<W;xx++){let s=0;for(let yy=-r;yy<=r;yy++)s+=t[Math.min(H-1,Math.max(0,yy))*W+xx];for(let yy=0;yy<H;yy++){o[yy*W+xx]=s/k;s+=t[Math.min(H-1,yy+r+1)*W+xx]-t[Math.max(0,yy-r)*W+xx]}}return o};
 const E=(()=>{const b=box(Y,1),h=new Float32Array(n);for(let i=0;i<n;i++){const v=Y[i]-b[i];h[i]=v*v}const e=box(h,4);for(let i=0;i<n;i++)e[i]=Math.sqrt(e[i]);return e})();   // the texture
 const bw=Math.max(2,Math.round(Math.min(W,H)*.03)),seg=Array.from({length:32},()=>[[],[],[],[]]);
 for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){if(yy>=bw&&yy<H-bw&&xx>=bw&&xx<W-bw)continue;const i=yy*W+xx,a=Math.floor((Math.atan2(yy-H/2,xx-W/2)+Math.PI)/(2*Math.PI)*32)%32;seg[a][0].push(Y[i]);seg[a][1].push(Cb[i]);seg[a][2].push(Cr[i]);seg[a][3].push(E[i])}
 const med=v=>{v.sort((p,q)=>p-q);return v[v.length>>1]},bg=seg.filter(s=>s[0].length).map(s=>[med(s[0]),med(s[1]),med(s[2]),med(s[3])]);
 const B=[];bg.forEach(c=>{if(!B.some(o=>.35*(o[0]-c[0])**2+(o[1]-c[1])**2+(o[2]-c[2])**2+9*(o[3]-c[3])**2<1))B.push(c)});   // near-equal border pieces once
 const out=new Float32Array(n);for(let i=0;i<n;i++){let m=1e9;const y=Y[i],cb=Cb[i],cr=Cr[i],e=E[i];for(let j=0;j<B.length;j++){const c=B[j],dy=y-c[0],db=cb-c[1],dr=cr-c[2],de=e-c[3],v=.35*dy*dy+db*db+dr*dr+9*de*de;if(v<m)m=v}out[i]=m}return{v:out,Y,Cb,Cr,E}}
const MK_OFF=10;   // how far (in Cb, Cr) a colour may be from the product's own colours and still be product
const mkFD=new WeakMap();   // per photo: its size at work and each pixel's distance to the background (the slow part, made once)
function mkFind(img,w,h,tol){const k=Math.min(1,1000/Math.max(w,h)),W=Math.max(8,Math.round(w*k)),H=Math.max(8,Math.round(h*k)),c=document.createElement('canvas');c.width=W;c.height=H;
 const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,W,H);const n=W*H;let D2=mkFD.get(img);if(!D2||D2.n!==n){D2={n,...mkDist(x.getImageData(0,0,W,H).data,W,H)};mkFD.set(img,D2)}const dist=D2.v,Cb=D2.Cb,Cr=D2.Cr;
 const thr=2+Math.max(0,Math.min(100,tol))*.16,t2=thr*thr,like=new Uint8Array(n);for(let i=0;i<n;i++)if(dist[i]<=t2)like[i]=1;
 // the background: like the border and joined to it
 const back=new Uint8Array(n),Q=new Int32Array(n);let qh=0,qt=0;const push=i=>{if(like[i]&&!back[i]){back[i]=1;Q[qt++]=i}};
 for(let xx=0;xx<W;xx++){push(xx);push((H-1)*W+xx)}for(let yy=0;yy<H;yy++){push(yy*W);push(yy*W+W-1)}
 while(qh<qt){const i=Q[qh++],xx=i%W;if(xx>0)push(i-1);if(xx<W-1)push(i+1);if(i>=W)push(i-W);if(i<n-W)push(i+W)}
 // 2.93.1 (owner Nov 4 2026: a stool touching a curtain took the design): the product's own colours, learnt from the middle of the photo (where a product photo puts it):
 // six colours (Cb, Cr) of what is not background there. Whatever is not background but of another colour (further than MK_OFF from every one of them: wood, leaves,
 // a pot, a rod) is not product; a shadow or a fold on the product keeps its colour, so it stays in.
 const keep=new Uint8Array(n),inMid=i=>{const xx=i%W,yy=(i/W)|0;return xx>=W/4&&xx<3*W/4&&yy>=H/4&&yy<3*H/4},sm=[];for(let i=0,st=Math.max(1,Math.floor(n/4/6000));i<n;i+=st)if(!back[i]&&inMid(i))sm.push([Cb[i],Cr[i]]);
 if(sm.length>=50){let C=[0,1,2,3,4,5].map(j=>sm[Math.floor((j+.5)*sm.length/6)].slice());for(let it=0;it<10;it++){const acc=C.map(()=>[0,0,0]);for(const p of sm){let bj=0,bd=1e9;C.forEach((c,j)=>{const d=(p[0]-c[0])**2+(p[1]-c[1])**2;if(d<bd){bd=d;bj=j}});acc[bj][0]+=p[0];acc[bj][1]+=p[1];acc[bj][2]++}C=C.map((c,j)=>acc[j][2]?[acc[j][0]/acc[j][2],acc[j][1]/acc[j][2]]:c)}
  const o2=MK_OFF*MK_OFF;for(let i=0;i<n;i++){if(back[i])continue;let m=1e9;for(const c of C){const d=(Cb[i]-c[0])**2+(Cr[i]-c[1])**2;if(d<m)m=d}if(m<=o2)keep[i]=1}}
 else for(let i=0;i<n;i++)keep[i]=back[i]?0:1;
 // the product: the part of what is kept that covers most of the middle (the largest when none does), its holes filled
 const lab=new Int32Array(n);let best=0,bestM=-1,bestN=0,id=0;for(let s0=0;s0<n;s0++){if(!keep[s0]||lab[s0])continue;id++;let cnt=0,mid=0;qh=qt=0;lab[s0]=id;Q[qt++]=s0;
  while(qh<qt){const i=Q[qh++],xx=i%W;cnt++;if(inMid(i))mid++;const go=j=>{if(keep[j]&&!lab[j]){lab[j]=id;Q[qt++]=j}};if(xx>0)go(i-1);if(xx<W-1)go(i+1);if(i>=W)go(i-W);if(i<n-W)go(i+W)}if(mid>bestM||(mid==bestM&&cnt>bestN)){bestM=mid;bestN=cnt;best=id}}
 if(!best||bestN<n*.01||bestN>n*.97)return null;
 {const out=new Uint8Array(n);qh=qt=0;const go=j=>{if(lab[j]!==best&&!out[j]){out[j]=1;Q[qt++]=j}};for(let xx=0;xx<W;xx++){go(xx);go((H-1)*W+xx)}for(let yy=0;yy<H;yy++){go(yy*W);go(yy*W+W-1)}
  while(qh<qt){const i=Q[qh++],xx=i%W;if(xx>0)go(i-1);if(xx<W-1)go(i+1);if(i>=W)go(i-W);if(i<n-W)go(i+W)}for(let i=0;i<n;i++)if(!out[i]&&lab[i]!==best){lab[i]=best;bestN++}}
 const im=x.createImageData(W,H),o=im.data;let x0=W,y0=H,x1=0,y1=0;for(let i=0;i<n;i++){const p=i*4;o[p]=o[p+1]=o[p+2]=255;if(lab[i]===best){o[p+3]=255;const xx=i%W,yy=(i/W)|0;if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(yy<y0)y0=yy;if(yy>y1)y1=yy}}
 let edge=0;for(let i=0;i<n;i++)if(lab[i]===best){const xx=i%W;if(xx==0||xx==W-1||i<W||i>=n-W||lab[i-1]!==best||lab[i+1]!==best||lab[i-W]!==best||lab[i+W]!==best)edge++}
 x.putImageData(im,0,0);const q=[x0/W,y0/H,(x1+1)/W,y0/H,(x1+1)/W,(y1+1)/H,x0/W,(y1+1)/H].map(v=>+v.toFixed(4));return{c,q,ragged:edge/Math.sqrt(bestN)}}
// a new photo: Find product at Tolerance 50, unless its outline is much more ragged (by 40%) than the smoothest of 20, 35 and 65 (a product broken up by its own shadows
// has a long, ragged edge; a lower Tolerance keeps it whole): then that one
function mkFindBest(img,w,h){const all=[20,35,50,65].map(tol=>({tol,r:mkFind(img,w,h,tol)})).filter(o=>o.r);if(!all.length)return null;const mid=all.find(o=>o.tol==50),best=all.reduce((a,b)=>b.r.ragged<a.r.ragged?b:a);
 return mid&&mid.r.ragged<=best.r.ragged*1.4?mid:best}
// your mockup's mask made again (Find product on, at its Tolerance): kept with the photo, its corners set to the product's box
// ---- click to add or remove (2.93.2, docs/own-mockups-plan.md): with Show mask on, a click on the view takes the part under it out of the product (a click on product)
// or puts it in (a click on what is not): what is joined to the click and like it (light, colour and texture, within Tolerance's distance; as the Magic Wand), at the
// mask's own size. The mask is kept with the photo; Find product off and on again (or a Tolerance change) makes it afresh.
async function mkWand(fx,fy){const m=mkCur();if(!m||m.b||!m.am)return;const ph=await mkPhoto(m.id),mask=await mkMask(m);if(!ph||!mask)return;
 const W=mask.naturalWidth,H=mask.naturalHeight,n=W*H,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});
 const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;tmp.getContext('2d').drawImage(ph,0,0,W,H);let F=mkFD.get(ph);if(!F||F.n!==n){F={n,...mkDist(tmp.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data,W,H)};mkFD.set(ph,F)}
 x.drawImage(mask,0,0);const im=x.getImageData(0,0,W,H),a=im.data,s0=Math.min(n-1,Math.max(0,Math.round(fy*H-.5)*W+Math.round(fx*W-.5))),inP=a[s0*4+3]>127,add=!inP;
 const thr=2+(m.tol==null?50:m.tol)*.16,t2=thr*thr,{Y,Cb,Cr,E}=F,y0=Y[s0],b0=Cb[s0],r0=Cr[s0],e0=E[s0],seen=new Uint8Array(n),Q=new Int32Array(n);let qh=0,qt=0,cnt=0;
 // it stops at an outline in the photo (a strong change of light across a pixel) and, when adding, at the edge of the product's box: a shaded side the colour of the wall
 // is not let out onto the wall
 const G=new Float32Array(n);for(let yy=1;yy<H-1;yy++)for(let xx=1;xx<W-1;xx++){const i=yy*W+xx;G[i]=Math.hypot(Y[i+1]-Y[i-1],Y[i+W]-Y[i-W])}
 const q=m.q,bx0=Math.min(q[0],q[6])*W,bx1=Math.max(q[2],q[4])*W,by0=Math.min(q[1],q[3])*H,by1=Math.max(q[5],q[7])*H,inBox=i=>{const xx=i%W,yy=(i/W)|0;return xx>=bx0&&xx<=bx1&&yy>=by0&&yy<=by1};
 const ok=i=>{if(seen[i])return false;seen[i]=1;if((a[i*4+3]>127)!==inP||G[i]>14||(add&&!inBox(i)))return false;const dy=Y[i]-y0,db=Cb[i]-b0,dr=Cr[i]-r0,de=E[i]-e0;return .35*dy*dy+db*db+dr*dr+9*de*de<=t2};
 seen[s0]=1;Q[qt++]=s0;while(qh<qt){const i=Q[qh++],xx=i%W;a[i*4+3]=add?255:0;a[i*4]=a[i*4+1]=a[i*4+2]=255;cnt++;const go=j=>{if(ok(j))Q[qt++]=j};if(xx>0)go(i-1);if(xx<W-1)go(i+1);if(i>=W)go(i-W);if(i<n-W)go(i+W)}
 x.putImageData(im,0,0);await mkPhotoPut(m.id+'~mask',c.toDataURL('image/png'));[...mkMk.keys()].forEach(k=>{if(k.startsWith(m.id+'|'))mkMk.delete(k)});
 pmsg(add?'Added to the product.':'Taken out of the product.');mkView()}
async function mkFindSet(id,on,tol){const d=mkLoad(),t=d.t.find(z=>z.id===id);if(!t)return false;if(!on){delete t.am;delete t.tol;mkStore(d);return true}
 const ph=await mkPhoto(id);if(!ph)return false;let r;if(tol==null){const b=mkFindBest(ph,t.w,t.h);r=b&&b.r;tol=b?b.tol:50}else r=mkFind(ph,t.w,t.h,tol);if(!r){if(t.am){delete t.am;delete t.tol;mkStore(d)}return false}
 await mkPhotoPut(id+'~mask',r.c.toDataURL('image/png'));t.am=1;t.tol=tol;t.q=r.q;mkStore(d);[...mkMk.keys()].forEach(k=>{if(k.startsWith(id+'|'))mkMk.delete(k)});return true}
// Scale as a % of the print area's width: Real size works it out from the canvas's real width and the product's (Repeat only)
const mkRealOk=(m,u)=>!!(m&&m.cm>0&&physOf()&&mkFill(u)=='rep');
const mkScale=(m,u)=>{const f=mkFill(u);if(f=='rep'&&u.rs&&mkRealOk(m,u)){const P=physOf();return Math.max(.5,Math.min(400,P.inW*2.54/m.cm*100))}return f=='rep'?u.sr:u.so};
// ---- drawing
// the perspective map from the unit square to the four corners (P: [x0,y0, ... x3,y3] in pixels, top left, top right, bottom right, bottom left)
function mkHom(P){const[x0,y0,x1,y1,x2,y2,x3,y3]=P,dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2,sx=x0-x1+x2-x3,sy=y0-y1+y2-y3,den=dx1*dy2-dx2*dy1||1e-9,
 g=(sx*dy2-dx2*sy)/den,h=(dx1*sy-sx*dy1)/den,a=x1-x0+g*x1,b=x3-x0+h*x3,d=y1-y0+g*y1,e=y3-y0+h*y3;
 return(u,v)=>{const w=g*u+h*v+1;return[(a*u+b*v+x0)/w,(d*u+e*v+y0)/w]}}
// one triangle of the flat picture F drawn onto the photo: the affine map from (s0, s1, s2) in F to (d0, d1, d2), clipped to the triangle (widened half a pixel, so no seams show)
function mkTri(x,F,s,d){const[[u0,v0],[u1,v1],[u2,v2]]=s,[[X0,Y0],[X1,Y1],[X2,Y2]]=d,den=(u1-u0)*(v2-v0)-(u2-u0)*(v1-v0);if(Math.abs(den)<1e-9)return;
 const a=((X1-X0)*(v2-v0)-(X2-X0)*(v1-v0))/den,b=((Y1-Y0)*(v2-v0)-(Y2-Y0)*(v1-v0))/den,c=((X2-X0)*(u1-u0)-(X1-X0)*(u2-u0))/den,e=((Y2-Y0)*(u1-u0)-(Y1-Y0)*(u2-u0))/den;
 const cx=(X0+X1+X2)/3,cy=(Y0+Y1+Y2)/3,gr=([X,Y])=>{const l=Math.hypot(X-cx,Y-cy)||1;return[X+(X-cx)/l*.6,Y+(Y-cy)/l*.6]},p=[gr(d[0]),gr(d[1]),gr(d[2])];
 x.save();x.beginPath();x.moveTo(p[0][0],p[0][1]);x.lineTo(p[1][0],p[1][1]);x.lineTo(p[2][0],p[2][1]);x.closePath();x.clip();
 x.setTransform(a,b,c,e,X0-a*u0-c*v0,Y0-b*u0-e*v0);x.drawImage(F,0,0);x.restore()}
// the design laid flat at fw x fh: Repeat on the repeat tile's lattice (grid, brick, half drop), one copy Scale% of the width; Once in the middle, Scale% of the area
function mkFlat(D,fw,fh,fill,sc){const F=document.createElement('canvas');F.width=Math.max(1,Math.round(fw));F.height=Math.max(1,Math.round(fh));const x=F.getContext('2d'),ar=CH/CW;
 if(fill=='rep'){const tw=Math.max(2,fw*sc/100),th=tw*ar,k=tileOn()?tileRk():'grid',nx=Math.ceil(fw/tw)+2,ny=Math.ceil(fh/th)+2;
  for(let j=-1;j<ny;j++)for(let i=-1;i<nx;i++){const X=i*tw+(k=='brick'&&j%2?tw/2:0),Y=j*th+(k=='half'&&i%2?th/2:0),fx=k=='mirror'&&i&1,fy=k=='mirror'&&j&1;   // 2.91.1: a mirror repeat flips odd columns and rows
   if(!fx&&!fy){x.drawImage(D,X,Y,tw+.5,th+.5);continue}x.save();x.translate(X+(fx?tw:0),Y+(fy?th:0));x.scale(fx?-1:1,fy?-1:1);x.drawImage(D,0,0,tw+.5,th+.5);x.restore()}}
 else{const k=Math.min(fw/CW,fh/CH)*sc/100,w=CW*k,h=CH*k;x.drawImage(D,(fw-w)/2,(fh-h)/2,w,h)}
 return F}
// the photo's light: its greyscale, made white at the print area's brightest (the 95th of a hundred), opaque, at W x H
function mkLight(ph,W,H,P){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(ph,0,0,W,H);const im=x.getImageData(0,0,W,H),d=im.data,n=W*H,L=new Float32Array(n);
 for(let i=0;i<n;i++)L[i]=.2126*d[i*4]+.7152*d[i*4+1]+.0722*d[i*4+2];
 const xs=[P[0],P[2],P[4],P[6]],ys=[P[1],P[3],P[5],P[7]],x0=Math.max(0,Math.floor(Math.min(...xs))),x1=Math.min(W-1,Math.ceil(Math.max(...xs))),y0=Math.max(0,Math.floor(Math.min(...ys))),y1=Math.min(H-1,Math.ceil(Math.max(...ys))),hist=new Uint32Array(256);let tot=0;
 const st=Math.max(1,Math.round(Math.sqrt((x1-x0+1)*(y1-y0+1)/40000)));for(let y=y0;y<=y1;y+=st)for(let X=x0;X<=x1;X+=st){hist[Math.min(255,Math.round(L[y*W+X]))]++;tot++}
 let top=255,acc=0;for(let v=255;v>=0;v--){acc+=hist[v];if(acc>=tot*.05){top=v;break}}const k=255/Math.max(40,top);
 for(let i=0;i<n;i++){const v=Math.min(255,L[i]*k);d[i*4]=d[i*4+1]=d[i*4+2]=v;d[i*4+3]=255}x.putImageData(im,0,0);return c}
// the mockup at W x H on a canvas: the photo, then the design warped onto the print area, shaded and cut to it
function mkDraw(out,ph,m,D,u,mask){const W=out.width,H=out.height,x=out.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);x.drawImage(ph,0,0,W,H);if(!D)return;
 const P=m.q.map((v,i)=>v*(i%2?H:W)),T0=mkHom(P),fill=mkFill(u),
  // 2.92.1: with a mask the design is laid a little past the print area (e of it on every side), so the mask's edge, and the folds' warp near it, always find design
  e=mask?.06:0,Q=e?[...T0(-e,-e),...T0(1+e,-e),...T0(1+e,1+e),...T0(-e,1+e)]:P,len=(a,b)=>Math.hypot(Q[b*2]-Q[a*2],Q[b*2+1]-Q[a*2+1]),fw=Math.max(4,Math.min(4096,(len(0,1)+len(3,2))/2)),fh=Math.max(4,Math.min(4096,(len(0,3)+len(1,2))/2));
 const F=mkFlat(D,fw,fh,fill,mkScale(m,u)/(1+2*e)),G=document.createElement('canvas');G.width=W;G.height=H;const g=G.getContext('2d'),T=mkHom(Q),N=MK_N;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u0=i/N,u1=(i+1)/N,v0=j/N,v1=(j+1)/N,S=(a,b)=>[a*F.width,b*F.height];
  mkTri(g,F,[S(u0,v0),S(u1,v0),S(u1,v1)],[T(u0,v0),T(u1,v0),T(u1,v1)]);mkTri(g,F,[S(u0,v0),S(u1,v1),S(u0,v1)],[T(u0,v0),T(u1,v1),T(u0,v1)])}
 if(m.warp>0)mkWarp(G,ph,m.warp);
 // the light only where the design prints (a clear part of the design shows the photo as it is)
 if(u.sh>0){const L=mkLight(ph,W,H,P),l=L.getContext('2d');l.globalCompositeOperation='destination-in';l.drawImage(G,0,0);g.globalCompositeOperation='multiply';g.globalAlpha=u.sh/100;g.drawImage(L,0,0);g.globalAlpha=1}
 g.globalCompositeOperation='destination-in';if(mask)g.drawImage(mask,0,0,W,H);else{g.beginPath();g.moveTo(P[0],P[1]);for(let i=1;i<4;i++)g.lineTo(P[i*2],P[i*2+1]);g.closePath();g.fill()}
 x.drawImage(G,0,0)}
// the folds: the design is moved by the photo's light, blurred (lighter: across and down one way, darker: the other), up to warp x 2% of the width
function mkWarp(G,ph,warp){const W=G.width,H=G.height,b=document.createElement('canvas'),k=Math.max(8,Math.round(W/28));b.width=k;b.height=Math.max(8,Math.round(k*H/W));
 const bx=b.getContext('2d');bx.drawImage(ph,0,0,b.width,b.height);const B=document.createElement('canvas');B.width=W;B.height=H;const Bx=B.getContext('2d',{willReadFrequently:true});Bx.imageSmoothingQuality='high';Bx.drawImage(b,0,0,W,H);
 const L=Bx.getImageData(0,0,W,H).data,g=G.getContext('2d',{willReadFrequently:true}),src=g.getImageData(0,0,W,H),S=src.data,out=g.createImageData(W,H),O=out.data;
 let sum=0,n=0;for(let i=3;i<S.length;i+=4)if(S[i]){sum+=L[i-3];n++}const mean=n?sum/n:128,A=warp*W*.02/64;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,d=(L[i]-mean)*A,sx=Math.min(W-1,Math.max(0,Math.round(x+d))),sy=Math.min(H-1,Math.max(0,Math.round(y+d*.6))),j=(sy*W+sx)*4;O[i]=S[j];O[i+1]=S[j+1];O[i+2]=S[j+2];O[i+3]=S[j+3]}
 g.putImageData(out,0,0)}
// the design as a picture (as it is exported), made again a moment after it changes while the panel is open
function mkDesign(px){return new Promise(res=>{let svg='';try{svg=ser()}catch(e){return res(null)}const k=px/Math.max(CW,CH),w=Math.max(1,Math.round(CW*k)),h=Math.max(1,Math.round(CH*k)),img=new Image();
 img.onload=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);res(c)};img.onerror=()=>res(null);img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)})}
const mkOpen=()=>{const s=document.querySelector('section.pn[data-p="mock"]');return!!(s&&!s.hidden)};
// ---- the panel
const mkCfg=()=>({p:'mk',pane:'#mkpane',word:'mockup',words:'mockups',ui:MK_TREE,cards:true,z:5,open:['s:Products'],exportName:'wodblok-mockups',exportAs:'pictures',usedFix:'',
 top:`<div class="row"><button type="button" class="alt" data-mkadd>Add mockup</button></div><input type="file" class="mkfile vh" accept="image/*" multiple tabindex="-1">`,
 read(){const d=mkLoad(),at={};d.t.forEach(x=>{at[x.id]=x.f});return{f:d.f,at,b:{},h:d.h,r:d.r}},
 write(m){const d=mkLoad();d.f=m.f;d.t.forEach(x=>{if(x.id in m.at)x.f=m.at[x.id]});d.h=m.h;d.r=m.r;mkStore(d)},
 sets:()=>MK_B.length?[{k:'s:Products',n:'Products',ids:MK_B.map(x=>x.id)}]:[],name:id=>{const m=mkGet(id);return m?m.n:null},own:id=>!String(id).startsWith('p-'),used:()=>false,
 tile:id=>{const m=mkGet(id);return m?`<img src="${m.th}" alt="" draggable="false"><b>${mkEsc(m.n)}</b>`:''},
 remove(list){const d=mkLoad();d.t=d.t.filter(x=>!list.includes(x.id));mkStore(d);list.forEach(mkPhotoDel);if(list.includes(mkUi().cur))mkUiSet({cur:''});mkPaint(true)},
 rename(id,v){const d=mkLoad(),x=d.t.find(y=>y.id===id);if(x){x.n=mkName(v);mkStore(d)}},
 file(id){const m=mkGet(id),s=m&&m.b?m.src:mkMem.get(id);if(!m||!s)return null;try{const i=s.indexOf(','),bin=atob(s.slice(i+1)),a=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)a[j]=bin.charCodeAt(j);return{name:m.n,data:a,ext:'.'+(s.slice(11,s.indexOf(';'))||'png').replace('jpeg','jpg'),fb:'Mockup'}}catch(e){return null}},
 wire(pane){const add=pane.querySelector('[data-mkadd]');if(!add||add.dataset.w)return;add.dataset.w='1';const file=pane.querySelector('.mkfile');add.onclick=()=>{file.value='';file.click()};
  file.onchange=async()=>{const fl=[...(file.files||[])];file.value='';let last=null;for(const f of fl){const id=await mkAdd(f);if(id)last=id}if(!last)return;mkUiSet({cur:last});MKT.paintAll(true);mkPaint(true);
   pmsg(fl.length>1?'Added '+fl.length+' mockups.':'Added the mockup “'+mkGet(last).n+'”.')}}});
// the view: the mockup in use at the panel's width (sharp on the screen), with the four corners over it while Edit corners is on
async function mkView(){const c=$('mkc'),wrap=$('mkvw');if(!c||!mkOpen())return;const u=mkUi(),m=mkCur();wrap.hidden=!m;$('mkg').hidden=!m;if(!m){mkCorners();return}
 const tok=++mkTok,ph=await mkPhoto(m.id),mask=await mkMask(m);if(tok!==mkTok)return;if(!ph){wrap.hidden=true;return}
 const cw=Math.max(80,wrap.clientWidth||260),dpr=window.devicePixelRatio||1,W=Math.round(cw*dpr),H=Math.round(W*m.h/m.w);
 const dk=[CW,CH,Math.round(W*1.2/256)].join();if(!mkDes||mkDesK!==dk){mkDes=await mkDesign(Math.min(2048,Math.max(512,W*1.2)));mkDesK=dk;if(tok!==mkTok)return}
 if(c.width!==W||c.height!==H){c.width=W;c.height=H}c.style.aspectRatio=m.w+' / '+m.h;mkDraw(c,ph,m,mkDes,u,mask);
 // 2.93.1: Show mask tints what is not product (the view only; Export mockup never shows it)
 if(mask&&!m.b&&m.am&&$('mkmv').checked){const t=document.createElement('canvas');t.width=W;t.height=H;const tx=t.getContext('2d');tx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--acc').trim()||'#b98a4b';tx.globalAlpha=.55;tx.fillRect(0,0,W,H);
  tx.globalAlpha=1;tx.globalCompositeOperation='destination-out';tx.drawImage(mask,0,0,W,H);c.getContext('2d').drawImage(t,0,0)}
 mkCorners()}
// the four squares and the outline of the print area, in the view's own units (0..1000 across)
function mkCorners(){const ov=$('mkov');if(!ov)return;const m=mkCur(),on=!!(m&&!m.b&&$('mkcn').checked);ov.toggleAttribute('hidden',!on);if(!on){ov.innerHTML='';return}
 const H=1000*m.h/m.w;ov.setAttribute('viewBox',`0 0 1000 ${H.toFixed(2)}`);const P=m.q.map((v,i)=>v*(i%2?H:1000)),s=14;
 ov.innerHTML=`<path class="crln" d="M${P[0]} ${P[1]}L${P[2]} ${P[3]}L${P[4]} ${P[5]}L${P[6]} ${P[7]}Z"/>`+[0,1,2,3].map(i=>`<rect class="crhd" data-mkq="${i}" x="${(P[i*2]-s/2).toFixed(1)}" y="${(P[i*2+1]-s/2).toFixed(1)}" width="${s}" height="${s}"/>`).join('')}
// 2.92.3 (docs/own-mockups-plan.md step 2): your mockup's Folds (warp, 0 to 1: how much the design follows the photo's folds, as the products') and Real width
// (cm: the print area's width, typed in Settings > General > Units; px counts as mm) for Real size
const MK_UPC={mm:.1,cm:1,in:2.54,px:.1},mkUnit=()=>{const u=unGet();return u=='px'?'mm':u};
function mkOwnSet(o){const m=mkCur();if(!m||m.b)return;const d=mkLoad(),t=d.t.find(z=>z.id===m.id);if(!t)return;Object.entries(o).forEach(([k,v])=>{if(v)t[k]=v;else delete t[k]});mkStore(d);mkSync();mkView()}
// the controls follow the mockup in use and the settings
function mkSync(){const u=mkUi(),fill=mkFill(u);$('mkfl').querySelectorAll('[data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f==fill));
 const m=mkCur(),real=mkRealOk(m,u);$('mkrsr').hidden=!real;$('mkrs').checked=real&&u.rs;$('mkcn').closest('label').hidden=!m||!!m.b;$('mkamr').hidden=!m||!!m.b;$('mkam').checked=!!(m&&m.am);$('mktolr').hidden=!m||!!m.b||!m.am;$('mkmvr').hidden=!m||!!m.b||!m.am;$('mkvw').classList.toggle('mkpk',!!(m&&!m.b&&m.am&&$('mkmv').checked));   /* a click on the view adds or removes */
 {const own=!!(m&&!m.b);$('mkfor').hidden=!own;$('mkcmr').hidden=!own;if(own){const fo=$('mkfo'),fv=Math.round((m.warp||0)*100);if(+fo.value!==fv&&document.activeElement!==fo){fo.value=fv;fo.dispatchEvent(new Event('input',{bubbles:true}))}
  const u=mkUnit(),cf=$('mkcm');$('mkcmu').textContent=u;if(document.activeElement!==cf)cf.value=m.cm?String(+(m.cm/MK_UPC[u]).toFixed(u=='in'?2:u=='cm'?1:0)):''}}
 {const tl=$('mktol'),tv=m&&m.am?m.tol:50;if(+tl.value!==tv&&document.activeElement!==tl){tl.value=tv;tl.dispatchEvent(new Event('input',{bubbles:true}))}}   /* a product's print area is its own */
 const sc=$('mksc'),v=fill=='rep'?u.sr:u.so;sc.dataset.def=fill=='rep'?'25':'100';sc.disabled=real&&u.rs;if(sc._n)sc._n.disabled=sc.disabled;if(+sc.value!==v){sc.value=v;sc.dispatchEvent(new Event('input',{bubbles:true}))}
 const sh=$('mksh');if(+sh.value!==u.sh){sh.value=u.sh;sh.dispatchEvent(new Event('input',{bubbles:true}))}$('mkx').disabled=!m}
let mkKey='';
function mkPaint(force){const pane=$('mkpane');if(!pane||!MKT)return;const u=mkUi(),cur=(mkCur()||{}).id,k=mkLoad().t.map(x=>x.id+':'+x.n+':'+x.f).join('|')+'#'+cur;if(force||k!==mkKey){mkKey=k;MKT.show(pane,cur,mkPick)}mkSync();mkView()}
function mkPick(id){if(!mkGet(id))return;mkUiSet({cur:id});mkPaint(true)}
const mkLater=()=>{if(!mkOpen())return;clearTimeout(mkT);mkT=setTimeout(()=>{mkDes=null;mkSync();mkView()},400)};   // the canvas's real size (Real size) can have changed too
// Export mockup: a PNG at the photo's own size, the design drawn for it
async function mkExport(){const u=mkUi(),m=mkCur();if(!m){if(WBX.wbOpenPanel)WBX.wbOpenPanel('mock');pmsg('Add a mockup first.');return}if(mkBusy)return;
 const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');mkBusy=true;
 try{const name=expName('png').replace(/\.png$/,'')+'-'+m.n.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')+'.png',h0=d.pick?await d.pick({filename:name}):null;pmsg('Exporting…');
  const ph=await mkPhoto(m.id);if(!ph)throw new Error('The photo is not in this browser.');const D=await mkDesign(Math.min(4096,Math.max(m.w,m.h)*1.2)),mask=await mkMask(m),c=document.createElement('canvas');c.width=m.w;c.height=m.h;mkDraw(c,ph,m,D,u,mask);
  const b=await new Promise(r=>c.toBlob(r,'image/png'));if(!b)throw new Error('The picture could not be made.');await d.save({filename:name,data:b,handle:h0});pmsg('Exported “'+name+'”.')}
 catch(e){if(!e||e.code!=='declined')pmsg(e&&e.message?e.message:'Could not export the mockup.')}finally{mkBusy=false}}
function init23(){if(!$('mkpane'))return;MKT=ltMake(mkCfg());MKT.init();$('mkpane').innerHTML=MKT.paneHtml();
 $('mkfl').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;mkUiSet({fill:b.dataset.f});mkSync();mkView()};
 $('mksc').addEventListener('input',()=>{if(WBS.uiLoad)return;const u=mkUi(),v=+$('mksc').value;if(mkFill(u)=='rep'){if(u.sr===v)return;mkUiSet({sr:v})}else{if(u.so===v)return;mkUiSet({so:v})}mkView()});
 $('mksh').addEventListener('input',()=>{if(WBS.uiLoad)return;const v=+$('mksh').value;if(mkUi().sh===v)return;mkUiSet({sh:v});mkView()});
 $('mkcn').addEventListener('change',mkCorners);
 $('mkmv').addEventListener('change',()=>{mkSync();mkView()});
 $('mkc').addEventListener('pointerdown',e=>{if(!$('mkvw').classList.contains('mkpk')||e.button>0)return;const r=$('mkc').getBoundingClientRect();e.preventDefault();mkWand((e.clientX-r.left)/Math.max(1,r.width),(e.clientY-r.top)/Math.max(1,r.height))});
 $('mkfo').addEventListener('input',()=>{if(WBS.uiLoad)return;const m=mkCur(),v=+$('mkfo').value/100;if(!m||m.b||(m.warp||0)===v)return;mkOwnSet({warp:v})});
 $('mkcm').addEventListener('change',()=>{const t=String($('mkcm').value).trim(),v=+t;if(t===''){mkOwnSet({cm:0});return}if(!(v>0)){mkSync();return}mkOwnSet({cm:+Math.min(10000,v*MK_UPC[mkUnit()]).toFixed(2)})});
 // Find product and Tolerance (2.92.2): the mask is made again a moment after the slider stops
 const mkRefind=async(on,tol)=>{const m=mkCur();if(!m||m.b)return;const ok=await mkFindSet(m.id,on,tol);if(on&&!ok)pmsg('No product found: it may touch every edge of the photo. Set its corners instead.');mkSync();mkView();mkCorners()};
 $('mkam').addEventListener('change',()=>mkRefind($('mkam').checked,+$('mktol').value));
 {let tt=0;$('mktol').addEventListener('input',()=>{if(WBS.uiLoad)return;const m=mkCur();if(!m||m.b||!m.am||m.tol===+$('mktol').value)return;clearTimeout(tt);tt=setTimeout(()=>mkRefind(true,+$('mktol').value),150)})}
 $('mkrs').addEventListener('change',()=>{mkUiSet({rs:$('mkrs').checked});mkSync();mkView()});
 $('mkx').onclick=mkExport;
 // a corner square follows the pointer; the corners are kept when it is let go
 const ov=$('mkov'),pt=e=>{const r=ov.getBoundingClientRect();return[(e.clientX-r.left)/Math.max(1,r.width),(e.clientY-r.top)/Math.max(1,r.height)]};
 ov.addEventListener('pointerdown',e=>{const h=e.target.closest('[data-mkq]'),m=mkCur();if(!h||!m||m.b)return;e.preventDefault();ov.setPointerCapture(e.pointerId);mkDrag={i:+h.dataset.mkq,m}});
 ov.addEventListener('pointermove',e=>{if(!mkDrag)return;const[x,y]=pt(e),i=mkDrag.i;mkDrag.m.q[i*2]=+Math.max(-.2,Math.min(1.2,x)).toFixed(4);mkDrag.m.q[i*2+1]=+Math.max(-.2,Math.min(1.2,y)).toFixed(4);
  const d=mkLoad(),t=d.t.find(z=>z.id===mkDrag.m.id);if(t){t.q=mkDrag.m.q.slice();mkStore(d)}if(!mkDrag.f)mkDrag.f=requestAnimationFrame(()=>{if(mkDrag)mkDrag.f=0;mkView()})});
 const up=()=>{if(!mkDrag)return;mkDrag=null;mkView()};ov.addEventListener('pointerup',up);ov.addEventListener('pointercancel',up);
 {const s=document.querySelector('section.pn[data-p="mock"]');new MutationObserver(()=>{if(!s.hidden){mkDes=null;mkPaint()}}).observe(s,{attributes:true,attributeFilter:['hidden']});
  try{new ResizeObserver(()=>{if(mkOpen())mkView()}).observe($('mkvw'))}catch(e){}}
 WBX.wbMockDrawn=mkLater;
 cmdRegister({id:'export.mockup',label:'Export mockup',run:mkExport});
 mkPaint(true)}
export {init23,mkHom};
