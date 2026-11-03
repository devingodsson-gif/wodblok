import {cmdRegister} from '../commands/registry.js';
import {collection,kv,use} from '../platform/index.js';
import {$,WBS,WBX} from './01-launch-and-version.js';
import {CH,CW,tileOn,tileRk} from './04-canvas-and-stamp-outlines.js';
import {expName,ser} from './14-presets-and-layer-grid-ui.js';
import {pmsg} from './18-projects-and-cover-overlay.js';
import {ltMake} from './87-library-tree.js';

// ===== Mockups (2.90.1, docs/mockups-plan.md; owner Nov 3 2026: "Let's do mockups": a live Mockup panel, people's own photos with four corners, built-in products later).
// A mockup is a photo and its print area: four corners on the photo (q: [x0,y0, x1,y1, x2,y2, x3,y3] as fractions of its width and height, top left, top right, bottom
// right, bottom left). The design (the canvas as it is exported) is laid flat at the print area's size, Repeat (side by side on the repeat tile's lattice) or Once, warped
// onto the four corners, multiplied by the photo's light by Shading, and cut to the print area; the photo shows everywhere else. Nothing goes in the project.
// Your mockups are a library on the shared folder tree (87-library-tree.js) as cards. The photos are kept in this browser (IndexedDB, collection 'mockups'); names, folders,
// corners and a small picture in kv (MK_KEY); the mockup in use and the panel's settings in MK_UI.
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
   .map(x=>({id:x.id,n:mkName(x.n),f:typeof x.f=='string'?x.f:'',w:+x.w,h:+x.h,th:x.th,q:mkQok(x.q)?x.q.slice():mkQ0.slice()}));
  d.h=(Array.isArray(d.h)?d.h:[]).filter(x=>typeof x=='string'&&x.length<=60);d.r=d.r&&typeof d.r=='object'&&!Array.isArray(d.r)?d.r:{};d.b={};mkC=d;mkCr=raw}
 return{f:[...mkC.f],t:mkC.t.map(x=>({...x,q:x.q.slice()})),h:[...mkC.h],r:{...mkC.r},b:{}}}
const mkStore=d=>{try{kv.set(MK_KEY,JSON.stringify(d));mkC=null;return true}catch(e){pmsg('Could not keep the mockups in this browser.');return false}};
const mkGet=id=>mkLoad().t.find(x=>x.id===id)||null;
// the panel's settings: the mockup in use, Fill, Scale (one value for Repeat and one for Once), Shading
function mkUi(){let u=null;try{u=JSON.parse(kv.get(MK_UI)||'null')}catch(e){}u=u&&typeof u=='object'?u:{};
 const n=(v,lo,hi,d)=>{v=+v;return isFinite(v)&&u!=null?Math.max(lo,Math.min(hi,v)):d};
 return{cur:typeof u.cur=='string'?u.cur:'',fill:u.fill=='one'||u.fill=='rep'?u.fill:'',sr:u.sr==null?25:n(u.sr,5,200,25),so:u.so==null?100:n(u.so,10,200,100),sh:u.sh==null?100:n(u.sh,0,100,100)}}
const mkUiSet=o=>{try{kv.set(MK_UI,JSON.stringify({...mkUi(),...o}))}catch(e){}};
const mkFill=u=>u.fill||(tileOn()?'rep':'one');
// ---- photos (IndexedDB; this session only where the browser has none)
const mkMem=new Map();
async function mkCol0(){if(mkCol===null)mkCol=(await collection('mockups'))||false;return mkCol||null}
async function mkPhotoPut(id,src){mkMem.set(id,src);const c=await mkCol0();if(c)try{await c.doc(id).set(src)}catch(e){}}
async function mkPhotoGet(id){if(mkMem.has(id))return mkMem.get(id);const c=await mkCol0();if(!c)return null;try{const s=await c.doc(id).get();if(s.exists){const v=s.data();if(typeof v=='string'){mkMem.set(id,v);return v}}}catch(e){}return null}
async function mkPhotoDel(id){mkMem.delete(id);mkPh.delete(id);const c=await mkCol0();if(c)try{await c.doc(id).delete()}catch(e){}}
const mkImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});
async function mkPhoto(id){if(mkPh.has(id))return mkPh.get(id);const s=await mkPhotoGet(id);const i=s?await mkImg(s):null;if(i)mkPh.set(id,i);return i}
// a picture you chose becomes a mockup in the open folder: at most MK_MAX pixels on its long side, its print area a rectangle in the middle until its corners are set
async function mkAdd(f){if(!f||!/^image\//.test(f.type)&&!/\.(png|jpe?g|webp)$/i.test(f.name||'')){pmsg('That file is not a picture.');return null}if(f.size>40e6){pmsg('That picture is too large. Try one under 40 MB.');return null}
 const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=()=>r(null);fr.readAsDataURL(f)}),img=url&&await mkImg(url);if(!img){pmsg('Could not read that picture.');return null}
 const nw=img.naturalWidth||1,nh=img.naturalHeight||1,k=Math.min(1,MK_MAX/Math.max(nw,nh)),w=Math.max(8,Math.round(nw*k)),h=Math.max(8,Math.round(nh*k)),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
 const enc=(cv,q)=>{const s=cv.toDataURL('image/webp',q);return s.startsWith('data:image/webp')?s:cv.toDataURL('image/jpeg',q)};
 const t=document.createElement('canvas'),tk=MK_TH/Math.max(w,h);t.width=Math.max(1,Math.round(w*tk));t.height=Math.max(1,Math.round(h*tk));t.getContext('2d').drawImage(c,0,0,t.width,t.height);
 const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),src=enc(c,.86),d=mkLoad();await mkPhotoPut(id,src);
 d.t.push({id,n:mkName(f.name),f:MKT?MKT.here():'',w,h,th:enc(t,.8),q:mkQ0.slice()});mkStore(d);return id}
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
  for(let j=-1;j<ny;j++)for(let i=-1;i<nx;i++){const X=i*tw+(k=='brick'&&j%2?tw/2:0),Y=j*th+(k=='half'&&i%2?th/2:0);x.drawImage(D,X,Y,tw+.5,th+.5)}}
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
function mkDraw(out,ph,m,D,u){const W=out.width,H=out.height,x=out.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);x.drawImage(ph,0,0,W,H);if(!D)return;
 const P=m.q.map((v,i)=>v*(i%2?H:W)),len=(a,b)=>Math.hypot(P[b*2]-P[a*2],P[b*2+1]-P[a*2+1]),fw=Math.max(4,Math.min(4096,(len(0,1)+len(3,2))/2)),fh=Math.max(4,Math.min(4096,(len(0,3)+len(1,2))/2)),fill=mkFill(u);
 const F=mkFlat(D,fw,fh,fill,fill=='rep'?u.sr:u.so),G=document.createElement('canvas');G.width=W;G.height=H;const g=G.getContext('2d'),T=mkHom(P),N=MK_N;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u0=i/N,u1=(i+1)/N,v0=j/N,v1=(j+1)/N,S=(a,b)=>[a*F.width,b*F.height];
  mkTri(g,F,[S(u0,v0),S(u1,v0),S(u1,v1)],[T(u0,v0),T(u1,v0),T(u1,v1)]);mkTri(g,F,[S(u0,v0),S(u1,v1),S(u0,v1)],[T(u0,v0),T(u1,v1),T(u0,v1)])}
 // the light only where the design prints (a clear part of the design shows the photo as it is)
 if(u.sh>0){const L=mkLight(ph,W,H,P),l=L.getContext('2d');l.globalCompositeOperation='destination-in';l.drawImage(G,0,0);g.globalCompositeOperation='multiply';g.globalAlpha=u.sh/100;g.drawImage(L,0,0);g.globalAlpha=1}
 g.globalCompositeOperation='destination-in';g.beginPath();g.moveTo(P[0],P[1]);for(let i=1;i<4;i++)g.lineTo(P[i*2],P[i*2+1]);g.closePath();g.fill();
 x.drawImage(G,0,0)}
// the design as a picture (as it is exported), made again a moment after it changes while the panel is open
function mkDesign(px){return new Promise(res=>{let svg='';try{svg=ser()}catch(e){return res(null)}const k=px/Math.max(CW,CH),w=Math.max(1,Math.round(CW*k)),h=Math.max(1,Math.round(CH*k)),img=new Image();
 img.onload=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);res(c)};img.onerror=()=>res(null);img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)})}
const mkOpen=()=>{const s=document.querySelector('section.pn[data-p="mock"]');return!!(s&&!s.hidden)};
// ---- the panel
const mkCfg=()=>({p:'mk',pane:'#mkpane',word:'mockup',words:'mockups',ui:MK_TREE,cards:true,z:5,exportName:'wodblok-mockups',exportAs:'pictures',usedFix:'',
 top:`<div class="row"><button type="button" class="alt" data-mkadd>Add mockup</button></div><input type="file" class="mkfile vh" accept="image/*" multiple tabindex="-1">`,
 read(){const d=mkLoad(),at={};d.t.forEach(x=>{at[x.id]=x.f});return{f:d.f,at,b:{},h:d.h,r:d.r}},
 write(m){const d=mkLoad();d.f=m.f;d.t.forEach(x=>{if(x.id in m.at)x.f=m.at[x.id]});d.h=m.h;d.r=m.r;mkStore(d)},
 sets:()=>[],name:id=>{const m=mkGet(id);return m?m.n:null},own:()=>true,used:()=>false,
 tile:id=>{const m=mkGet(id);return m?`<img src="${m.th}" alt="" draggable="false"><b>${mkEsc(m.n)}</b>`:''},
 remove(list){const d=mkLoad();d.t=d.t.filter(x=>!list.includes(x.id));mkStore(d);list.forEach(mkPhotoDel);if(list.includes(mkUi().cur))mkUiSet({cur:''});mkPaint(true)},
 rename(id,v){const d=mkLoad(),x=d.t.find(y=>y.id===id);if(x){x.n=mkName(v);mkStore(d)}},
 file(id){const m=mkGet(id),s=mkMem.get(id);if(!m||!s)return null;try{const i=s.indexOf(','),bin=atob(s.slice(i+1)),a=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)a[j]=bin.charCodeAt(j);return{name:m.n,data:a,ext:'.'+(s.slice(11,s.indexOf(';'))||'png').replace('jpeg','jpg'),fb:'Mockup'}}catch(e){return null}},
 wire(pane){const add=pane.querySelector('[data-mkadd]');if(!add||add.dataset.w)return;add.dataset.w='1';const file=pane.querySelector('.mkfile');add.onclick=()=>{file.value='';file.click()};
  file.onchange=async()=>{const fl=[...(file.files||[])];file.value='';let last=null;for(const f of fl){const id=await mkAdd(f);if(id)last=id}if(!last)return;mkUiSet({cur:last});MKT.paintAll(true);mkPaint(true);
   pmsg(fl.length>1?'Added '+fl.length+' mockups.':'Added the mockup “'+mkGet(last).n+'”.')}}});
// the view: the mockup in use at the panel's width (sharp on the screen), with the four corners over it while Edit corners is on
async function mkView(){const c=$('mkc'),wrap=$('mkvw');if(!c||!mkOpen())return;const u=mkUi(),m=u.cur?mkGet(u.cur):null;wrap.hidden=!m;$('mkg').hidden=!m;if(!m){mkCorners();return}
 const tok=++mkTok,ph=await mkPhoto(m.id);if(tok!==mkTok)return;if(!ph){wrap.hidden=true;return}
 const cw=Math.max(80,wrap.clientWidth||260),dpr=window.devicePixelRatio||1,W=Math.round(cw*dpr),H=Math.round(W*m.h/m.w);
 const dk=[CW,CH,Math.round(W*1.2/256)].join();if(!mkDes||mkDesK!==dk){mkDes=await mkDesign(Math.min(2048,Math.max(512,W*1.2)));mkDesK=dk;if(tok!==mkTok)return}
 if(c.width!==W||c.height!==H){c.width=W;c.height=H}c.style.aspectRatio=m.w+' / '+m.h;mkDraw(c,ph,m,mkDes,u);mkCorners()}
// the four squares and the outline of the print area, in the view's own units (0..1000 across)
function mkCorners(){const ov=$('mkov');if(!ov)return;const u=mkUi(),m=u.cur?mkGet(u.cur):null,on=!!(m&&$('mkcn').checked);ov.toggleAttribute('hidden',!on);if(!on){ov.innerHTML='';return}
 const H=1000*m.h/m.w;ov.setAttribute('viewBox',`0 0 1000 ${H.toFixed(2)}`);const P=m.q.map((v,i)=>v*(i%2?H:1000)),s=14;
 ov.innerHTML=`<path class="crln" d="M${P[0]} ${P[1]}L${P[2]} ${P[3]}L${P[4]} ${P[5]}L${P[6]} ${P[7]}Z"/>`+[0,1,2,3].map(i=>`<rect class="crhd" data-mkq="${i}" x="${(P[i*2]-s/2).toFixed(1)}" y="${(P[i*2+1]-s/2).toFixed(1)}" width="${s}" height="${s}"/>`).join('')}
// the controls follow the mockup in use and the settings
function mkSync(){const u=mkUi(),fill=mkFill(u);$('mkfl').querySelectorAll('[data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f==fill));
 const sc=$('mksc'),v=fill=='rep'?u.sr:u.so;sc.dataset.def=fill=='rep'?'25':'100';if(+sc.value!==v){sc.value=v;sc.dispatchEvent(new Event('input',{bubbles:true}))}
 const sh=$('mksh');if(+sh.value!==u.sh){sh.value=u.sh;sh.dispatchEvent(new Event('input',{bubbles:true}))}$('mkx').disabled=!(u.cur&&mkGet(u.cur))}
let mkKey='';
function mkPaint(force){const pane=$('mkpane');if(!pane||!MKT)return;const u=mkUi(),k=mkLoad().t.map(x=>x.id+':'+x.n+':'+x.f).join('|')+'#'+u.cur;if(force||k!==mkKey){mkKey=k;MKT.show(pane,u.cur,mkPick)}mkSync();mkView()}
function mkPick(id){if(!mkGet(id))return;mkUiSet({cur:id});mkPaint(true)}
const mkLater=()=>{if(!mkOpen())return;clearTimeout(mkT);mkT=setTimeout(()=>{mkDes=null;mkView()},400)};
// Export mockup: a PNG at the photo's own size, the design drawn for it
async function mkExport(){const u=mkUi(),m=u.cur?mkGet(u.cur):null;if(!m){if(WBX.wbOpenPanel)WBX.wbOpenPanel('mock');pmsg('Add a mockup first.');return}if(mkBusy)return;
 const d=await use('downloads');if(!d)return pmsg('Saving is not available here.');mkBusy=true;
 try{const name=expName('png').replace(/\.png$/,'')+'-'+m.n.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')+'.png',h0=d.pick?await d.pick({filename:name}):null;pmsg('Exporting…');
  const ph=await mkPhoto(m.id);if(!ph)throw new Error('The photo is not in this browser.');const D=await mkDesign(Math.min(4096,Math.max(m.w,m.h)*1.2)),c=document.createElement('canvas');c.width=m.w;c.height=m.h;mkDraw(c,ph,m,D,u);
  const b=await new Promise(r=>c.toBlob(r,'image/png'));if(!b)throw new Error('The picture could not be made.');await d.save({filename:name,data:b,handle:h0});pmsg('Exported “'+name+'”.')}
 catch(e){if(!e||e.code!=='declined')pmsg(e&&e.message?e.message:'Could not export the mockup.')}finally{mkBusy=false}}
function init23(){if(!$('mkpane'))return;MKT=ltMake(mkCfg());MKT.init();$('mkpane').innerHTML=MKT.paneHtml();
 $('mkfl').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;mkUiSet({fill:b.dataset.f});mkSync();mkView()};
 $('mksc').addEventListener('input',()=>{if(WBS.uiLoad)return;const u=mkUi(),v=+$('mksc').value;if(mkFill(u)=='rep'){if(u.sr===v)return;mkUiSet({sr:v})}else{if(u.so===v)return;mkUiSet({so:v})}mkView()});
 $('mksh').addEventListener('input',()=>{if(WBS.uiLoad)return;const v=+$('mksh').value;if(mkUi().sh===v)return;mkUiSet({sh:v});mkView()});
 $('mkcn').addEventListener('change',mkCorners);
 $('mkx').onclick=mkExport;
 // a corner square follows the pointer; the corners are kept when it is let go
 const ov=$('mkov'),pt=e=>{const r=ov.getBoundingClientRect();return[(e.clientX-r.left)/Math.max(1,r.width),(e.clientY-r.top)/Math.max(1,r.height)]};
 ov.addEventListener('pointerdown',e=>{const h=e.target.closest('[data-mkq]'),m=mkGet(mkUi().cur);if(!h||!m)return;e.preventDefault();ov.setPointerCapture(e.pointerId);mkDrag={i:+h.dataset.mkq,m}});
 ov.addEventListener('pointermove',e=>{if(!mkDrag)return;const[x,y]=pt(e),i=mkDrag.i;mkDrag.m.q[i*2]=+Math.max(-.2,Math.min(1.2,x)).toFixed(4);mkDrag.m.q[i*2+1]=+Math.max(-.2,Math.min(1.2,y)).toFixed(4);
  const d=mkLoad(),t=d.t.find(z=>z.id===mkDrag.m.id);if(t){t.q=mkDrag.m.q.slice();mkStore(d)}if(!mkDrag.f)mkDrag.f=requestAnimationFrame(()=>{if(mkDrag)mkDrag.f=0;mkView()})});
 const up=()=>{if(!mkDrag)return;mkDrag=null;mkView()};ov.addEventListener('pointerup',up);ov.addEventListener('pointercancel',up);
 {const s=document.querySelector('section.pn[data-p="mock"]');new MutationObserver(()=>{if(!s.hidden){mkDes=null;mkPaint()}}).observe(s,{attributes:true,attributeFilter:['hidden']});
  try{new ResizeObserver(()=>{if(mkOpen())mkView()}).observe($('mkvw'))}catch(e){}}
 WBX.wbMockDrawn=mkLater;
 cmdRegister({id:'export.mockup',label:'Export mockup',run:mkExport});
 mkPaint(true)}
export {init23,mkHom};
