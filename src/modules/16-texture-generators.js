import {WBS,WBX} from './01-launch-and-version.js';
import {sRng} from './15-print-effects-and-stamp-texture.js';
import {TXIMG} from '../data/textures.js';

// ===== Textures are pictures (2.50.0; owner Oct 26 2026: "instead of using procedural texture, have them all be images"). =====
// The built-in ones are grayscale WebP pictures in textures/<set>/<id>.webp, put into the app by the build (src/data/textures.js); placeholders made by
// tools/textures/bake.js from the generators this module had until 2.49.0. Imported ones come from the texture library (86-texture-library.js) and travel
// inside the project. A picture is one repeat of the texture at Scale 100%; Rotate, Flip across and Flip down turn it, and a use's variation moves it.
// The sets and ids of the built-in textures stay as they were, so saved projects and Randomize keep their meaning.
const TXF=[['Paper and board',{cotton:'Cotton Rag',cold:'Cold Press',laid:'Laid Lines',washi:'Washi',kraft:'Kraft',news:'Newsprint',crumple:'Crumpled'}],
['Cloth and weave',{linen:'Linen',canvas:'Canvas',burlap:'Burlap',denim:'Denim Twill',felt:'Felt'}],
['Natural',{wood:'Wood Grain',bark:'Bark',cork:'Cork',leather:'Leather'}],
['Stone and mineral',{plaster:'Plaster',granite:'Granite',marble:'Marble Veins',concrete:'Concrete'}],
['Metal and made',{brushed:'Brushed Metal',hammered:'Hammered',halftone:'Halftone Dots',riso:'Riso Grain'}],
['Print faults and wear',{dry:'Dry Roller',pinholes:'Pinholes',blotchy:'Blotchy Wash',worn:'Worn Block',scuff:'Scuffed',foxing:'Foxing'}]];
const TXN={};
// how much of the picture Strength can wear through, per texture (as the generators had it); scattered marks (raw) are not evened out first
const TXCOV={cotton:.6,cold:.6,news:.6,kraft:.6,felt:.6,brushed:.6,riso:.6,dry:.6,crumple:.5,burlap:.5,bark:.5,cork:.5,leather:.5,granite:.5,halftone:.5,worn:.5,pinholes:.5,scuff:.5,foxing:.5,marble:.35},TXRAW={pinholes:1,scuff:1,foxing:1};
const TXMD=['wear','relief','stain'],TXMN={wear:'Wear',relief:'Relief',stain:'Stain'};
const txRid=()=>1+Math.floor(Math.random()*99999),txUid=()=>'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const txLib=id=>id?WBS.texLib.find(x=>x.id===id)||null:null;
function txUniq(b){let n=b,i=2;while(WBS.texLib.some(x=>x.name===n))n=b+' '+i++;return n}
function txMake(t,o){return{id:txUid(),name:txUniq(TXN[t]||'Texture'),t,a:40,sc:100,az:225,sd:txRid(),rot:0,fh:0,fv:0,auto:false,...(o||{})}}
const txSame=(x,s)=>x.t===s.t&&+x.a===+s.a&&+x.sc===+s.sc&&+x.az===+s.az&&(+x.rot||0)===(+s.rot||0)&&!!x.fh===!!s.fh&&!!x.fv===!!s.fv;
function txEnsure(s){const m=WBS.texLib.find(x=>txSame(x,s));if(m)return m.id;const L=txMake(s.t,{...s,auto:true});WBS.texLib.push(L);return L.id}
function txClean(a){if(!Array.isArray(a))return[];const ok=[],ids=new Set(),n=(v,lo,hi,d)=>{v=+v;return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
a.slice(0,200).forEach(x=>{if(!x||typeof x!='object')return;const t=x.t;if(!t||!Object.prototype.hasOwnProperty.call(TXN,t))return;
const id=String(x.id||'').replace(/[^\w-]/g,'').slice(0,24);if(!id||ids.has(id))return;ids.add(id);
const L={id,name:String(x.name||TXN[t]).replace(/[<>&"]/g,'').slice(0,40),t,a:n(x.a,0,100,40),sc:n(x.sc,25,TXSCMAX,100),az:n(x.az,0,359,225),sd:n(x.sd,1,99999,1)|0,rot:n(x.rot,0,359,0),fh:x.fh?1:0,fv:x.fv?1:0,auto:!!x.auto};
ok.push(L)});return ok}
// a use -> everything the renderer needs (null = nothing to draw). def = the mode a use gets when it has none
const txSpec=(u,def)=>{const L=u&&typeof u=='object'?txLib(u.x):null;if(!L||!TXN[L.t]||!(+L.a>0))return null;return{x:L.id,t:L.t,a:+L.a,sc:+L.sc||100,az:isFinite(+L.az)?+L.az:225,sd:((+u.sd||+L.sd||1)|0)||1,rot:+L.rot||0,fh:L.fh?1:0,fv:L.fv?1:0,md:TXMD.includes(u.md)?u.md:def}};
const txSpecs=(l,def)=>(Array.isArray(l)?l:[]).slice(0,6).map(u=>txSpec(u,def)).filter(Boolean);
// the key of what a use draws; it changes once more when the texture's picture has been read, so everything drawn without it is drawn again
const txKey=q=>[q.t,q.a,q.sc,q.sd,q.md=='relief'?q.az:'',q.md,q.rot||0,q.fh?1:0,q.fv?1:0,txOk(q.t)?1:0].join(',');
const isOf=t=>{const r=txSpecs(t&&t.tu,'wear');return r.length?r:null};
// ---------- the pictures ----------
// TXS: id -> {n: name, set, src: data URL, imp: imported, img: the decoded picture once read, st: 0 not read, 1 reading, 2 ready, 3 failed, th: small picture for the library}
let TXS;let TXPEND=0,TXLT=0;
const txOk=id=>{const e=TXS&&TXS.get(id);return!!e&&e.st===2};
const txBusy=()=>TXPEND>0;
// the picture of a texture, or null while it is being read (it is read the first time it is wanted; everything is drawn again when it is ready)
function txImg(id){const e=TXS.get(id);if(!e)return null;if(e.st===2)return e.img;if(e.st)return null;e.st=1;TXPEND++;const img=new Image();
 const done=ok=>{e.st=ok?2:3;if(ok)e.img=img;TXPEND--;clearTimeout(TXLT);TXLT=setTimeout(()=>{if(WBX.wbTexPicReady)WBX.wbTexPicReady()},0)};
 img.onload=()=>done(img.naturalWidth>0);img.onerror=()=>done(false);img.src=e.src;return null}
// a texture made from a picture in the library or a project; the picture is a grayscale data URL
function txSrcAdd(id,n,src,o){if(!TXS||!id||typeof src!='string')return;const e=TXS.get(id);if(e&&e.src===src){e.n=n;TXN[id]=n;return}TXS.set(id,{n,src,st:0,img:null,th:'',...(o||{})});TXN[id]=n}
const txSrc=id=>TXS?TXS.get(id)||null:null;
// imported textures travel inside the project (texImgs: {id: {n, src}}, 2.50.0): the ones its texture list uses are saved with it, and opening it reads them back
// (and hands them to the texture library, so they are in Yours from then on). Ids of imported textures start with u.
const TXIMP=/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/;
function txImgsLoad(o){if(!o||typeof o!='object')return;const got=[];Object.entries(o).forEach(([id,A])=>{id=String(id);if(!/^u[\w-]{1,30}$/.test(id)||!A||typeof A.src!='string'||A.src.length>8e6||!TXIMP.test(A.src))return;
 txSrcAdd(id,String(A.n||'Texture').replace(/[<>&"|]/g,'').slice(0,40)||'Texture',A.src,{imp:1});got.push(id)});if(got.length&&WBX.wbTexLibTake)WBX.wbTexLibTake(got)}
function txImgsUsed(){const o={};(WBS.texLib||[]).forEach(L=>{const e=TXS.get(L.t);if(e&&e.imp&&!o[L.t])o[L.t]={n:e.n,src:e.src}});return o}
// a small square picture of a texture for the library (null until its picture has been read)
function txThumb(id){const e=TXS.get(id);if(!e)return null;if(e.th)return e.th;const img=txImg(id);if(!img)return null;
 const S=96,c=document.createElement('canvas');c.width=S;c.height=S;const x=c.getContext('2d'),k=S/Math.min(img.naturalWidth,img.naturalHeight)*1.5;x.fillStyle='#fff';x.fillRect(0,0,S,S);x.drawImage(img,(S-img.naturalWidth*k)/2,(S-img.naturalHeight*k)/2,img.naturalWidth*k,img.naturalHeight*k);e.th=c.toDataURL('image/webp',.85);return e.th}
// ---------- height maps, then the three looks ----------
let TXHC;
function txEq(h){const n=h.length,b=new Uint32Array(1026);for(let i=0;i<n;i++){const k=(h[i]*1024)|0;b[k<0?0:k>1024?1024:k]++}const cdf=new Float32Array(1026);let s=0;for(let i=0;i<1026;i++){s+=b[i];cdf[i]=s/n}const q=new Float32Array(n);for(let i=0;i<n;i++){const k=(h[i]*1024)|0;q[i]=cdf[k<0?0:k>1024?1024:k]}return q}
// The picture repeated over pw x ph pixels: one repeat is Scale % of the long side (times the picture's span: how many repeats it holds, textures/span.json), turned by Rotate, flipped, and moved by the use's variation. null while the picture is being read
function txHeight(S,pw,ph){const key=[S.t,S.sc,S.sd,S.rot||0,S.fh?1:0,S.fv?1:0,pw,ph].join('|'),hit=TXHC.get(key);if(hit){TXHC.delete(key);TXHC.set(key,hit);return hit}
const img=txImg(S.t);if(!img)return null;const P=Math.max(pw,ph),iw=img.naturalWidth,ih=img.naturalHeight,k=P*Math.max(5,S.sc)/100*((TXS.get(S.t)||{}).span||1)/Math.max(iw,ih),R=sRng((S.sd|0)*977+5),ox=R()*iw,oy=R()*ih;
const cv=document.createElement('canvas');cv.width=pw;cv.height=ph;const x=cv.getContext('2d',{willReadFrequently:true});x.imageSmoothingQuality='high';
x.translate(pw/2,ph/2);x.rotate((+S.rot||0)*Math.PI/180);x.scale(S.fh?-k:k,S.fv?-k:k);x.translate(-ox,-oy);x.fillStyle=x.createPattern(img,'repeat');const D=Math.hypot(pw,ph)/2/k+Math.max(iw,ih);x.fillRect(ox-D,oy-D,2*D,2*D);
const d=x.getImageData(0,0,pw,ph).data,h=new Float32Array(pw*ph);for(let i=0;i<h.length;i++)h[i]=d[i*4]/255;
const q=TXRAW[S.t]?h:txEq(h),st=Math.max(1,Math.round(P/420));let s2=0,m=0;for(let j=st;j<ph-st;j+=2)for(let i=st;i<pw-st;i+=2){const gx=h[j*pw+i+st]-h[j*pw+i-st],gy=h[(j+st)*pw+i]-h[(j-st)*pw+i];s2+=gx*gx+gy*gy;m++}
const e={h,q,st,g0:Math.sqrt(s2/Math.max(1,m))+1e-4};TXHC.set(key,e);if(TXHC.size>5)TXHC.delete(TXHC.keys().next().value);return e}
const txs=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
function txPix(S,pw,ph){const E=txHeight(S,pw,ph);if(!E)return null;const n=pw*ph,px=new Uint8ClampedArray(n*4),a=S.a/100,md=S.md,cov=TXCOV[S.t]||.55;
if(md=='wear'){const thr=a*cov,soft=TXRAW[S.t]?.05:.08,q=E.q;for(let i=0;i<n;i++)px[i*4+3]=Math.round(txs(thr+soft*.5,thr-soft*.5,q[i])*31)*8.2258}
else if(md=='stain'){const q=E.q;for(let i=0;i<n;i++){const v=Math.pow(1-q[i],1.6)*a*.8;px[i*4]=84;px[i*4+1]=58;px[i*4+2]=30;px[i*4+3]=Math.round(v*31)*8.2258}}
else{const h=E.h,st=E.st,r=S.az*Math.PI/180,lx=Math.cos(r),ly=Math.sin(r),k=1/(E.g0*2.2);
for(let j=0;j<ph;j++){const j0=Math.max(0,j-st),j1=Math.min(ph-1,j+st);for(let i=0;i<pw;i++){const i0=Math.max(0,i-st),i1=Math.min(pw-1,i+st),gx=(h[j*pw+i1]-h[j*pw+i0])/(i1-i0||1),gy=(h[j1*pw+i]-h[j0*pw+i])/(j1-j0||1),s=-(gx*lx+gy*ly)*st*k,al=Math.min(1,Math.abs(s))*a*.85,o=(j*pw+i)*4,w=s>0?255:0;px[o]=px[o+1]=px[o+2]=w;px[o+3]=Math.round(al*31)*8.2258}}}
return px}
let TXB;let TXBN=0;
// 2.49.0 (owner Oct 26 2026: textures render soft): every picture of 384 px or more is made 15% finer (the look is the same, only finer; the cost is about 1.3 times), and the Scale slider stops at 200%.
const TXRES=1.15,TXSCMAX=200;
function txDims(W,H,R){const s=(R>=384?R*TXRES:R)/Math.max(W,H,1e-6);return[Math.max(8,Math.round(W*s)),Math.max(8,Math.round(H*s))]}
// Repeat tile: make the picture meet itself at the edges. The middle is the texture as it was; towards each edge it fades into a copy
// moved half a picture across, and at the edge both sides show the same part of that copy, so the edges match.
function txSeam(px,pw,ph){const src=new Uint8ClampedArray(px),hx=pw>>1,hy=ph>>1,wx=new Float32Array(pw),wy=new Float32Array(ph);
for(let x=0;x<pw;x++)wx[x]=Math.pow(Math.sin(Math.PI*x/pw),2);for(let y=0;y<ph;y++)wy[y]=Math.pow(Math.sin(Math.PI*y/ph),2);
for(let y=0;y<ph;y++){const y2=(y+hy)%ph;for(let x=0;x<pw;x++){const a=wx[x]*wy[y],o=(y*pw+x)*4,o2=(y2*pw+(x+hx)%pw)*4;for(let c=0;c<4;c++)px[o+c]=src[o+c]*a+src[o2+c]*(1-a)}}}
// The texture keeps its size in canvas units (2.27.0): the picture is made for the whole box, so its scale is set against 200 units, whatever the box measures. A Shape or Motif
// (R 400) that is made bigger or smaller shows the same texture, not a magnified one.
function txBmp(S,W,H,R,tl){const M=Math.max(W,H),Z=R>=800?Math.max(1,M/200):R>=400?Math.max(.1,M/200):1;if(Z!==1)S={...S,sc:S.sc/Z};const[pw,ph]=txDims(W,H,R),key=txKey(S)+'|'+pw+'x'+ph+(tl?'|tile':'');let e=TXB.get(key);if(e){TXB.delete(key);TXB.set(key,e);return e}
const px=txPix(S,pw,ph);if(!px)return null;if(tl)txSeam(px,pw,ph);const cv=document.createElement('canvas');cv.width=pw;cv.height=ph;cv.getContext('2d').putImageData(new ImageData(px,pw,ph),0,0);
e={id:++TXBN,url:cv.toDataURL('image/png'),pw,ph,key};TXB.set(key,e);while(TXB.size>90){const k=TXB.keys().next().value;txUnhost(TXB.get(k).id);TXB.delete(k)}return e}
// big pictures stay out of the per-frame markup: they live once in a persistent block (#txd) and the page refers to them by id
let TXHS;
function txHostEl(){return document.getElementById('txd')}
function txUnhost(id){const h=txHostEl();if(!h)return;h.querySelectorAll('[data-e="'+id+'"]').forEach(n=>{TXHS.delete(n.id);n.remove()})}
function txHostImg(e,W,H){const id='txi'+e.id+'_'+(+W).toFixed(1)+'_'+(+H).toFixed(1),h=txHostEl();if(h&&!TXHS.has(id)){h.insertAdjacentHTML('beforeend',`<image id="${id}" data-e="${e.id}" href="${e.url}" width="${(+W).toFixed(2)}" height="${(+H).toFixed(2)}" preserveAspectRatio="none"/>`);TXHS.add(id)}return id}
// images for the specs of one mode-group. how: 'inline' = the picture is in the markup, 'host' = a reference to the persistent copy
function txImgs(list,W,H,R,how,want,ox,oy,tl){let o='';const x=ox||0,y=oy||0;list.forEach(S=>{if(!want(S))return;const e=txBmp(S,W,H,R,tl);if(!e)return;o+=how=='inline'?`<image${S.op!=null?` data-x="${S.x}" opacity="${S.op}"`:''} href="${e.url}" x="${x}" y="${y}" width="${(+W).toFixed(2)}" height="${(+H).toFixed(2)}" preserveAspectRatio="none"/>`:`<use href="#${txHostImg(e,W,H)}" x="${x}" y="${y}"/>`});return o}
const txIsW=S=>S.md=='wear',txIsO=S=>S.md!='wear';
const txHash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(Math.imul(h,33)+s.charCodeAt(i))|0;return(h>>>0).toString(36)};
// overlay filter (relief / stain on a layer or a text box): the picture is laid over the shape only where the shape has ink
let TXFL;
// ext = [ex,ey] on a repeat tile: the picture is repeated (feTile) over a filter area that reaches that far past the tile on every side
function txFilt(list,x,y,W,H,R,ext){const ov=list.filter(txIsO);if(!ov.length)return'';const ex=ext?ext[0]:0,ey=ext?ext[1]:0,key='txf'+txHash(ov.map(txKey).join(';')+'|'+[x,y,W,H,R].join(',')+(ext?'|'+ex+','+ey:'')),h=txHostEl();if(!TXFL.has(key)){let f='',m='<feMergeNode in="SourceGraphic"/>';ov.forEach((S,i)=>{const e=txBmp(S,W,H,R,!!ext);if(!e)return;f+=`<feImage href="${e.url}" x="${(+x).toFixed(2)}" y="${(+y).toFixed(2)}" width="${(+W).toFixed(2)}" height="${(+H).toFixed(2)}" preserveAspectRatio="none" result="o${i}"/>${ext?`<feTile in="o${i}" result="ot${i}"/>`:''}<feComposite in="${ext?'ot':'o'}${i}" in2="SourceAlpha" operator="in" result="c${i}"/>`;m+=`<feMergeNode in="c${i}"/>`});
if(!f)return'';if(h)h.insertAdjacentHTML('beforeend',`<filter id="${key}" data-f="1" filterUnits="userSpaceOnUse" x="${(x-ex).toFixed(2)}" y="${(y-ey).toFixed(2)}" width="${(+W+2*ex).toFixed(2)}" height="${(+H+2*ey).toFixed(2)}" color-interpolation-filters="sRGB">${f}<feMerge>${m}</feMerge></filter>`);TXFL.set(key,1);
while(TXFL.size>40){const k=TXFL.keys().next().value;TXFL.delete(k);const n=h&&h.querySelector('#'+k);if(n)n.remove()}}
else if(h&&!h.querySelector('#'+key)){TXFL.delete(key);return txFilt(list,x,y,W,H,R,ext)}return key}
function init16(){// ===== Texture library (v87) =====
// One kind of texture for everything. A texture is a named grayscale pattern in texLib: {id,name,t,a,sc,az,sd,rot,fh,fv,auto}.
// Wherever it is used (a stamp, a layer, a text box, the canvas) the use picks a mode: {x: texture id, sd: variation, md: 'wear'|'relief'|'stain'}.
//   wear   = the pattern knocks the ink out (worn, patchy, pinholes)
//   relief = the pattern becomes lit surface shading (light comes from the "Light from" angle)
//   stain  = the pattern tints / darkens
WBS.texLib=[];WBS.txSel='';TXS=new Map();
// the built-in pictures: the sets above first, in their order (Randomize counts on it), then any set or picture that only the textures/ folder has
TXIMG.forEach(e=>{let g=TXF.find(f=>f[0]===e.set);if(!g){g=[e.set,{}];TXF.push(g)}const n=g[1][e.id]||e.id.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());g[1][e.id]=n;TXS.set(e.id,{n,set:e.set,src:e.src,span:+e.span||1,st:0,img:null,th:''})});
TXF.forEach(([g,o])=>Object.keys(o).forEach(k=>{if(TXS.has(k))TXN[k]=o[k];else delete o[k]}));
WBX.wbTexBusy=txBusy;WBX.wbTexImgsLoad=txImgsLoad;WBX.wbTexImgsUsed=txImgsUsed;
TXHC=new Map();
TXB=new Map();
TXHS=new Set();
TXFL=new Map();
}
export {TXF,TXMD,TXMN,TXN,isOf,txBusy,txClean,txEnsure,txFilt,txImgs,txIsO,txIsW,txKey,txLib,txMake,txOk,txPix,txRid,txSame,txSpecs,txSrc,txSrcAdd,txThumb,txUid,txUniq,init16};
