// ===== Import artwork: image -> clean black & white -> traced vector motif =====
(()=>{
const IMP_RE=/^<path d="[MLQZ0-9.,\- ]+" fill="FILL" fill-rule="evenodd"\/>$/;
let src=null,W=0,H=0,lum=null,name='',last=null,tmr=0;
const PROMPT=s=>`Create a single ${s||'[subject]'} designed as a bold woodblock stamp motif. Pure solid black shapes on a plain white background. No gray, no shading, no gradients, no texture, no frame, no text. Clean, smooth edges and a simple, readable silhouette, with a few thin white carved lines for detail. Centered, with generous white margin, square image.`;
$('ipr').onclick=async()=>{const t=PROMPT($('isub').value.trim());let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(e){}
if(ok){say2('Prompt copied. Paste it into ChatGPT, then import the image it makes.')}else{$('iprt').hidden=false;$('iprt').value=t;$('iprt').select();say2('Copy the prompt below, then paste it into ChatGPT.')}};
const say2=t=>{$('imsg').textContent=t};

$('ifile').onchange=()=>{const f=$('ifile').files[0];$('ifile').value='';if(f)loadFile(f)};
// drag & drop anywhere, and paste from the clipboard
document.addEventListener('dragover',e=>{if([...(e.dataTransfer&&e.dataTransfer.items||[])].some(i=>i.kind=='file')){e.preventDefault();document.body.classList.add('dropping')}});
document.addEventListener('dragleave',e=>{if(!e.relatedTarget)document.body.classList.remove('dropping')});
const onCover=()=>{const b=document.querySelector('.rail [data-pn="canvas"]');return !!(book.on&&b&&b.classList.contains('on'))};
document.addEventListener('drop',e=>{document.body.classList.remove('dropping');const f=[...(e.dataTransfer&&e.dataTransfer.files||[])].find(f=>/^image\//.test(f.type));if(f){e.preventDefault();onCover()?wbCoverFile(f):loadFile(f)}});
document.addEventListener('paste',e=>{if(e.target.matches&&e.target.matches('input,textarea')||e.target.closest&&e.target.closest('#ipaste,#cvpaste'))return;const it=[...(e.clipboardData&&e.clipboardData.items||[])].find(i=>/^image\//.test(i.type));if(it){e.preventDefault();onCover()?wbCoverFile(it.getAsFile()):loadFile(it.getAsFile(),'Pasted image')}});
function loadSrc(src,nm){const img=new Image();img.onload=()=>{prep(img);name=nm||'Imported motif';$('inm').value=name;$('ioimg').src=cv0.toDataURL('image/png');openDlg();run()};img.onerror=()=>say2('That image could not be read. Try copying it again, or save it as PNG.');img.src=src}
// paste box for phones: catches pasted image files, or pasted <img> elements some browsers insert instead
const pz=$('ipaste'),PZ=pz.innerHTML;pz.addEventListener('focus',()=>{if(pz.innerHTML==PZ)pz.innerHTML=''});pz.addEventListener('blur',()=>{if(!pz.textContent.trim()&&!pz.querySelector('img'))pz.innerHTML=PZ});
pz.addEventListener('paste',e=>{const it=[...(e.clipboardData&&e.clipboardData.items||[])].find(i=>/^image\//.test(i.type));if(it){e.preventDefault();e.stopPropagation();pz.innerHTML=PZ;pz.blur();loadFile(it.getAsFile(),'Pasted image')}else setTimeout(chk,60)});
const chk=()=>{const im=pz.querySelector('img');if(im&&im.src){const src=im.src;pz.innerHTML=PZ;pz.blur();loadSrc(src,'Pasted image')}else if(pz.textContent.trim()&&pz.innerHTML!=PZ){pz.innerHTML='';say2('That was text, not an image. Copy the image itself, then paste it here.')}};pz.addEventListener('input',()=>setTimeout(chk,30));
function loadFile(f,nm){if(f.type&&!/^image\//.test(f.type))return say2('That file is not an image. Use a PNG, JPG or WebP.');
const url=URL.createObjectURL(f),img=new Image();img.onload=()=>{prep(img);URL.revokeObjectURL(url);name=(nm||f.name||'Imported motif').replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').replace(/["<>&|]/g,'').slice(0,40)||'Imported motif';$('inm').value=name;$('ioimg').src=cv0.toDataURL('image/png');openDlg();run()};
img.onerror=()=>{URL.revokeObjectURL(url);say2('That image could not be read. Try a PNG or JPG (some phones save photos as HEIC).')};img.src=url}
const cv0=document.createElement('canvas');
function prep(img){const MX=440,s=Math.min(1,MX/Math.max(img.naturalWidth,img.naturalHeight));W=Math.max(8,Math.round(img.naturalWidth*s));H=Math.max(8,Math.round(img.naturalHeight*s));
cv0.width=W;cv0.height=H;const c=cv0.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,H);c.drawImage(img,0,0,W,H);const d=c.getImageData(0,0,W,H).data;lum=new Float32Array(W*H);
for(let i=0;i<W*H;i++)lum[i]=.2126*d[i*4]+.7152*d[i*4+1]+.0722*d[i*4+2];
// Otsu threshold as the starting point
const h=new Array(256).fill(0);for(let i=0;i<W*H;i++)h[Math.min(255,lum[i]|0)]++;let sum=0;for(let i=0;i<256;i++)sum+=i*h[i];let sB=0,wB=0,best=0,th=128;
for(let i=0;i<256;i++){wB+=h[i];if(!wB)continue;const wF=W*H-wB;if(!wF)break;sB+=i*h[i];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;th=i}}
$('ith').value=Math.max(10,Math.min(245,th));$('ith').dataset.def=$('ith').value;
// white-on-black artwork: suggest invert when the border is mostly dark
let dk=0,n=0;for(let x=0;x<W;x++){dk+=lum[x]<th;dk+=lum[(H-1)*W+x]<th;n+=2}for(let y=0;y<H;y++){dk+=lum[y*W]<th;dk+=lum[y*W+W-1]<th;n+=2}$('iinv').checked=dk/n>.6;
src=img}
function blur(a,r){if(r<1)return a;const o=new Float32Array(a.length),t=new Float32Array(a.length);for(let y=0;y<H;y++){let acc=0;for(let x=-r;x<=r;x++)acc+=a[y*W+Math.min(W-1,Math.max(0,x))];for(let x=0;x<W;x++){t[y*W+x]=acc/(2*r+1);acc+=a[y*W+Math.min(W-1,x+r+1)]-a[y*W+Math.max(0,x-r)]}}
for(let x=0;x<W;x++){let acc=0;for(let y=-r;y<=r;y++)acc+=t[Math.min(H-1,Math.max(0,y))*W+x];for(let y=0;y<H;y++){o[y*W+x]=acc/(2*r+1);acc+=t[Math.min(H-1,y+r+1)*W+x]-t[Math.max(0,y-r)*W+x]}}return o}
// remove ink specks and fill small holes smaller than `area` pixels
function despeckle(b,area){if(area<1)return;const seen=new Uint8Array(W*H),st=new Int32Array(W*H);
for(let i0=0;i0<W*H;i0++){if(seen[i0])continue;const v=b[i0];let sp=0,cnt=0,edge=false;st[sp++]=i0;seen[i0]=1;const comp=[];
while(sp){const i=st[--sp];comp.push(i);cnt++;const x=i%W,y=(i/W)|0;if(x==0||y==0||x==W-1||y==H-1)edge=true;
if(x>0&&!seen[i-1]&&b[i-1]==v){seen[i-1]=1;st[sp++]=i-1}if(x<W-1&&!seen[i+1]&&b[i+1]==v){seen[i+1]=1;st[sp++]=i+1}
if(y>0&&!seen[i-W]&&b[i-W]==v){seen[i-W]=1;st[sp++]=i-W}if(y<H-1&&!seen[i+W]&&b[i+W]==v){seen[i+W]=1;st[sp++]=i+W}}
if(cnt<area&&(v==1||!edge))comp.forEach(i=>b[i]=1-v)}}
// marching squares -> closed loops (pixel corner grid, one pixel of padding)
function trace(b){const w=W+2,h=H+2,g=(x,y)=>x>0&&y>0&&x<=W&&y<=H?b[(y-1)*W+(x-1)]:0,adj=new Map(),add=(a,c)=>{(adj.get(a)||adj.set(a,[]).get(a)).push(c);(adj.get(c)||adj.set(c,[]).get(c)).push(a)};
const K=(x,y)=>x*100000+y; // doubled coordinates of edge midpoints
for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++){const tl=g(x,y),tr=g(x+1,y),br=g(x+1,y+1),bl=g(x,y+1),c=tl*8+tr*4+br*2+bl;if(c==0||c==15)continue;
const T=K(2*x+1,2*y),R=K(2*x+2,2*y+1),B=K(2*x+1,2*y+2),Lf=K(2*x,2*y+1);
switch(c){case 1:case 14:add(Lf,B);break;case 2:case 13:add(B,R);break;case 3:case 12:add(Lf,R);break;case 4:case 11:add(T,R);break;case 6:case 9:add(T,B);break;case 7:case 8:add(Lf,T);break;case 5:add(Lf,T);add(B,R);break;case 10:add(T,R);add(Lf,B);break}}
const loops=[],used=new Set();
for(const [s0] of adj){if(used.has(s0))continue;const loop=[];let prev=null,cur=s0;while(cur!=null&&!used.has(cur)){used.add(cur);loop.push([Math.floor(cur/100000)/2-.5,(cur%100000)/2-.5]);const nb=adj.get(cur);const nx=nb.find(n=>n!==prev&&!used.has(n));prev=cur;cur=nx==null?null:nx}if(loop.length>=4)loops.push(loop)}
return loops}
function dens(l,step){const o=[];for(let i=0;i<l.length;i++){const a=l[i],b=l[(i+1)%l.length],d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.floor(d/step));for(let k=0;k<n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}return o}
function rdp(p,eps){if(p.length<4)return p;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];
while(st.length){const[a,z]=st.pop();let md=0,mi=-1;const[ax,ay]=p[a],[zx,zy]=p[z],dx=zx-ax,dy=zy-ay,L=Math.hypot(dx,dy)||1;
for(let i=a+1;i<z;i++){const d=Math.abs(dy*p[i][0]-dx*p[i][1]+zx*ay-zy*ax)/L;if(d>md){md=d;mi=i}}if(md>eps&&mi>0){keep[mi]=1;st.push([a,mi],[mi,z])}}return p.filter((_,i)=>keep[i])}
function run(){if(!lum)return;const th=+$('ith').value,r=+$('ism').value,area=Math.round(+$('isp').value/100*W*H*.0008+(+$('isp').value?2:0)),inv=$('iinv').checked,eps=+$('idt').value;
['ith','ism','isp','idt'].forEach(id=>{const r=$(id);r.style.setProperty('--p',((r.value-r.min)/(r.max-r.min)*100).toFixed(1)+'%')});$('ithv').textContent=th;$('ismv').textContent=r;$('ispv').textContent=$('isp').value;$('idtv').textContent=(+$('idt').value).toFixed(1);
const a=blur(lum,r),b=new Uint8Array(W*H);for(let i=0;i<W*H;i++)b[i]=(a[i]<th)!=inv?1:0;despeckle(b,area);
let x0=W,y0=H,x1=-1,y1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(b[y*W+x]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
if(x1<0){last=null;$('iout').innerHTML='';$('iinfo').textContent='No ink found. Lower the threshold or turn on Invert.';$('iadd').disabled=true;return}
let loops=trace(b).map(l=>{let fi=0,fd=0;l.forEach((p,i)=>{const d=(p[0]-l[0][0])**2+(p[1]-l[0][1])**2;if(d>fd){fd=d;fi=i}});const A=rdp(l.slice(0,fi+1),eps),B=rdp(l.slice(fi).concat([l[0]]),eps);return dens(A.concat(B.slice(1,-1)),3)}).filter(l=>l.length>=3);
const cx=(x0+x1+1)/2,cy=(y0+y1+1)/2,k=92/Math.max(x1-x0+1,y1-y0+1),f=v=>(Math.round(v*10)/10).toString();
let d='',pts=0;loops.forEach(l=>{const n=l.length,P=l.map(([x,y])=>[(x-cx)*k,(y-cy)*k]),mid=i=>{const a=P[i%n],c=P[(i+1)%n];return[(a[0]+c[0])/2,(a[1]+c[1])/2]};
if(n<3)return;const m0=mid(0);d+='M'+f(m0[0])+','+f(m0[1]);for(let i=1;i<=n;i++){const p=P[i%n],m=mid(i);d+='Q'+f(p[0])+','+f(p[1])+' '+f(m[0])+','+f(m[1])}d+='Z';pts+=n});
last={d,pts};const ink=col(proj.ink),bg=col(proj.bg);
$('iout').innerHTML=`<svg viewBox="-50 -50 100 100"><rect x="-50" y="-50" width="100" height="100" fill="${bg}"/><path d="${d}" fill="${ink}" fill-rule="evenodd"/></svg>`;
const kb=(d.length/1024).toFixed(0);$('iinfo').textContent=`${loops.length} shape${loops.length==1?'':'s'}, ${pts} points, ${kb} KB`+(d.length>180000?'. That is heavy; raise Simplify or Clean up.':'');$('iadd').disabled=d.length>400000}
['ith','ism','isp','idt'].forEach(id=>$(id).addEventListener('input',()=>{clearTimeout(tmr);tmr=setTimeout(run,60)}));$('iinv').addEventListener('input',run);
const openDlg=()=>{$('idlg').hidden=false;setTimeout(()=>$('iadd').focus(),50)};const closeDlg=()=>{$('idlg').hidden=true};
$('icl').onclick=closeDlg;$('icx').onclick=closeDlg;$('idlg').addEventListener('click',e=>{if(e.target===$('idlg'))closeDlg()});
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&!$('idlg').hidden)closeDlg()});
$('iadd').onclick=()=>{if(!last)return;const nm=($('inm').value.trim()||'Imported motif').replace(/["<>&|]/g,'').slice(0,40),key='i|'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const fg=mcat.startsWith('g:')?mcat.slice(2):'';cust[key]={n:nm,svg:`<path d="${last.d}" fill="FILL" fill-rule="evenodd"/>`,imp:1,...(fg?{g:fg}:{})};
const t=tiles[cur],full=$('ifull').checked,s=full?+(Math.min(SW,SH)/100*1.04).toFixed(3):.9;t.items.push(it(key,SW/2,SH/2,s));selOne(t.items.length-1);
if(!fg)mcat='i';mcSave();store();closeDlg();upd();document.querySelector('.rail [data-pn="motifs"]').click();
$('pmsg').textContent=`Added “${nm}” to ${fg?'“'+fg+'”':'My imports'} and placed it on the stamp.`};

// ===== Motif sheets: one image -> many motifs (grid you can adjust, or auto-detected shapes) =====
const SPROMPT=(sub,c,r)=>`Create a sheet of ${c*r} different ${sub||'[subject]'} designed as bold woodblock stamp motifs, arranged in a neat grid of ${c} columns and ${r} rows. Every motif: pure solid black shapes on a plain white background, no gray, no shading, no gradients, no texture, with a few thin white carved lines for detail, clean smooth edges and a simple readable silhouette. Each motif is about the same size and centered in its own cell. Leave wide empty white space between all motifs (at least a fifth of a cell); nothing may touch, overlap or cross into a neighbouring cell. No grid lines, no borders, no frames, no labels, no numbers, no text. ${c>r?'Wide landscape image.':c<r?'Tall portrait image.':'Square image.'}`;
$('spr').onclick=async()=>{const c=Math.max(1,Math.min(8,+$('scol').value||4)),r=Math.max(1,Math.min(8,+$('srow').value||4)),t=SPROMPT($('isub').value.trim(),c,r);$('sc').value=c;$('sr').value=r;let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(e){}
if(ok)say2(`Sheet prompt copied (${c} × ${r} = ${c*r} motifs). Paste it into ChatGPT, then use Import a motif sheet.`);else{$('iprt').hidden=false;$('iprt').value=t;$('iprt').select();say2('Copy the prompt below, then paste it into ChatGPT.')}};
let S=null,stmr=0;const sc=document.createElement('canvas');
const sOpen=(img,nm)=>{const MX=2000,k=Math.min(1,MX/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(8,Math.round(img.naturalWidth*k)),h=Math.max(8,Math.round(img.naturalHeight*k));
sc.width=w;sc.height=h;const c=sc.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,w,h);c.drawImage(img,0,0,w,h);const d=c.getImageData(0,0,w,h).data,L=new Float32Array(w*h);for(let i=0;i<w*h;i++)L[i]=.2126*d[i*4]+.7152*d[i*4+1]+.0722*d[i*4+2];
// Otsu threshold
const hg=new Array(256).fill(0);for(let i=0;i<w*h;i++)hg[Math.min(255,L[i]|0)]++;let sum=0;for(let i=0;i<256;i++)sum+=i*hg[i];let sB=0,wB=0,best=0,th=128;for(let i=0;i<256;i++){wB+=hg[i];if(!wB)continue;const wF=w*h-wB;if(!wF)break;sB+=i*hg[i];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)**2;if(v>best){best=v;th=Math.round((mB+mF)/2)}}
$('shth').value=Math.max(10,Math.min(245,th));let dk=0,n=0;for(let x=0;x<w;x++){dk+=L[x]<th;dk+=L[(h-1)*w+x]<th;n+=2}for(let y=0;y<h;y++){dk+=L[y*w]<th;dk+=L[y*w+w-1]<th;n+=2}$('sinv').checked=dk/n>.6;
const cols=Math.max(1,Math.min(12,+$('sc').value||4)),rows=Math.max(1,Math.min(12,+$('sr').value||4));
S={w,h,L,mode:'grid',view:'t',xs:[],ys:[],boxes:[],off:new Set(),res:[]};evenLines(cols,rows);
$('simg').src=sc.toDataURL('image/png');$('sov').setAttribute('viewBox',`0 0 ${w} ${h}`);$('sstage').style.maxWidth=`min(100%, calc(58vh * ${(w/h).toFixed(4)}))`;
$('snm').value=mcat.startsWith('g:')?mcat.slice(2):(($('isub').value.trim()||nm||'Sheet').replace(/[\"<>&|]/g,'').replace(/^./,c=>c.toUpperCase())).slice(0,30);
setMode('grid');$('sdlg').hidden=false;sRun()};
const evenLines=(c,r)=>{S.xs=Array.from({length:c+1},(_,i)=>i/c);S.ys=Array.from({length:r+1},(_,i)=>i/r)};
const setMode=m=>{S.mode=m;document.querySelectorAll('#smode [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m==m));$('sgc').hidden=m!='grid';$('sac').hidden=m!='auto';S.off.clear()};
$('sview').onclick=e=>{const b=e.target.closest('[data-v]');if(!b||!S)return;S.view=b.dataset.v;drawOv()};
$('smode').onclick=e=>{const b=e.target.closest('[data-m]');if(!b||!S)return;setMode(b.dataset.m);sRun()};
['sc','sr'].forEach(id=>$(id).addEventListener('input',()=>{if(!S)return;const c=Math.max(1,Math.min(12,+$('sc').value||1)),r=Math.max(1,Math.min(12,+$('sr').value||1));evenLines(c,r);S.off.clear();sQueue()}));
$('seven').onclick=()=>{if(S){evenLines(S.xs.length-1,S.ys.length-1);sRun()}};
const sQueue=()=>{clearTimeout(stmr);stmr=setTimeout(sRun,120)};
['shth','ssm','shsp','sdt','sgap'].forEach(id=>$(id).addEventListener('input',()=>{if(S&&id!='sgap')S.view='t';sQueue()}));$('sinv').addEventListener('input',()=>{if(S)S.view='t';sQueue()});
// auto-detect: ink blobs (joined when closer than the gap) -> boxes, in reading order
function autoBoxes(){const{w,h,L}=S,k=Math.min(1,700/Math.max(w,h)),aw=Math.max(8,Math.round(w*k)),ah=Math.max(8,Math.round(h*k)),th=+$('shth').value,inv=$('sinv').checked,b=new Uint8Array(aw*ah);
for(let y=0;y<ah;y++)for(let x=0;x<aw;x++){const v=L[Math.min(h-1,(y/k)|0)*w+Math.min(w-1,(x/k)|0)];b[y*aw+x]=(v<th)!=inv?1:0}
const g=Math.round(+$('sgap').value/1000*Math.max(aw,ah)*1.5),dl=new Uint8Array(aw*ah);
if(g>0){const t=new Uint8Array(aw*ah);for(let y=0;y<ah;y++){let last=-1e9;for(let x=0;x<aw;x++){if(b[y*aw+x])last=x;t[y*aw+x]=x-last<=g?1:0}last=1e9;for(let x=aw-1;x>=0;x--){if(b[y*aw+x])last=x;if(last-x<=g)t[y*aw+x]=1}}
for(let x=0;x<aw;x++){let last=-1e9;for(let y=0;y<ah;y++){if(t[y*aw+x])last=y;dl[y*aw+x]=y-last<=g?1:0}last=1e9;for(let y=ah-1;y>=0;y--){if(t[y*aw+x])last=y;if(last-y<=g)dl[y*aw+x]=1}}}else dl.set(b);
const lab=new Int32Array(aw*ah).fill(-1),st=new Int32Array(aw*ah),bx=[];
for(let i0=0;i0<aw*ah;i0++){if(!dl[i0]||lab[i0]>=0)continue;let sp=0,x0=aw,y0=ah,x1=-1,y1=-1,ink=0;st[sp++]=i0;lab[i0]=bx.length;
while(sp){const i=st[--sp],x=i%aw,y=(i/aw)|0;if(b[i]){ink++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
const nb=[x>0?i-1:-1,x<aw-1?i+1:-1,y>0?i-aw:-1,y<ah-1?i+aw:-1];for(const j of nb)if(j>=0&&dl[j]&&lab[j]<0){lab[j]=bx.length;st[sp++]=j}}
if(x1>=0)bx.push({x0,y0,x1,y1,ink})}
const tot=bx.reduce((a,c)=>a+c.ink,0),keep=bx.filter(c=>c.ink>tot*.004&&c.ink>12);
const pad=Math.round(Math.max(aw,ah)*.006);let B=keep.map(c=>({x0:Math.max(0,c.x0-pad)/aw,y0:Math.max(0,c.y0-pad)/ah,x1:Math.min(aw,c.x1+1+pad)/aw,y1:Math.min(ah,c.y1+1+pad)/ah}));
const mh=B.reduce((a,c)=>a+(c.y1-c.y0),0)/(B.length||1);B.sort((a,c)=>((a.y0+a.y1)/2-(c.y0+c.y1)/2));const rows=[];B.forEach(c=>{const cy=(c.y0+c.y1)/2,r=rows.find(r=>Math.abs(r.cy-cy)<mh*.5);if(r){r.b.push(c);r.cy=(r.cy*(r.b.length-1)+cy)/r.b.length}else rows.push({cy,b:[c]})});
return rows.sort((a,c)=>a.cy-c.cy).flatMap(r=>r.b.sort((a,c)=>a.x0-c.x0))}
// trace one box with the same clean-up as single imports
function cellVec(bx,dropEdge){const{w,h,L}=S,X0=Math.floor(bx.x0*w),Y0=Math.floor(bx.y0*h),X1=Math.ceil(bx.x1*w),Y1=Math.ceil(bx.y1*h),cw=X1-X0,ch=Y1-Y0;if(cw<4||ch<4)return null;
const k=Math.min(1,300/Math.max(cw,ch)),ww=Math.max(4,Math.round(cw*k)),hh=Math.max(4,Math.round(ch*k)),lm=new Float32Array(ww*hh);
for(let y=0;y<hh;y++)for(let x=0;x<ww;x++){let a=0,n=0;const sx0=X0+Math.floor(x/k),sy0=Y0+Math.floor(y/k),sx1=Math.min(X1,X0+Math.floor((x+1)/k)),sy1=Math.min(Y1,Y0+Math.floor((y+1)/k));
for(let yy=sy0;yy<Math.max(sy0+1,sy1);yy+=1)for(let xx=sx0;xx<Math.max(sx0+1,sx1);xx+=1){a+=L[Math.min(h-1,yy)*w+Math.min(w-1,xx)];n++}lm[y*ww+x]=a/n}
const oW=W,oH=H;W=ww;H=hh;try{const th=+$('shth').value,r=+$('ssm').value,area=Math.round(+$('shsp').value/100*W*H*.0008+(+$('shsp').value?2:0)),inv=$('sinv').checked,eps=+$('sdt').value;
const a=blur(lm,r),b=new Uint8Array(W*H);for(let i=0;i<W*H;i++)b[i]=(a[i]<th)!=inv?1:0;despeckle(b,area);
if(dropEdge){// remove small bits of neighbouring motifs that poke in across the cell edge
const lab=new Int32Array(W*H).fill(-1),st=new Int32Array(W*H),cs=[];let tot=0;for(let i0=0;i0<W*H;i0++){if(!b[i0]||lab[i0]>=0)continue;let sp=0,cnt=0,edge=false;const id=cs.length;st[sp++]=i0;lab[i0]=id;
while(sp){const i=st[--sp],x=i%W,y=(i/W)|0;cnt++;if(x==0||y==0||x==W-1||y==H-1)edge=true;for(const j of[x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&b[j]&&lab[j]<0){lab[j]=id;st[sp++]=j}}cs.push({cnt,edge});tot+=cnt}
for(let i=0;i<W*H;i++)if(b[i]){const c=cs[lab[i]];if(c.edge&&c.cnt<tot*.25)b[i]=0}}
let x0=W,y0=H,x1=-1,y1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(b[y*W+x]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}if(x1<0)return null;
const loops=trace(b).map(l=>{let fi=0,fd=0;l.forEach((p,i)=>{const d=(p[0]-l[0][0])**2+(p[1]-l[0][1])**2;if(d>fd){fd=d;fi=i}});const A=rdp(l.slice(0,fi+1),eps),B=rdp(l.slice(fi).concat([l[0]]),eps);return dens(A.concat(B.slice(1,-1)),3)}).filter(l=>l.length>=3);
const cx=(x0+x1+1)/2,cy=(y0+y1+1)/2,kk=92/Math.max(x1-x0+1,y1-y0+1),f=v=>(Math.round(v*10)/10).toString();let d='';
loops.forEach(l=>{const n=l.length,P=l.map(([x,y])=>[(x-cx)*kk,(y-cy)*kk]),mid=i=>{const a=P[i%n],c=P[(i+1)%n];return[(a[0]+c[0])/2,(a[1]+c[1])/2]};const m0=mid(0);d+='M'+f(m0[0])+','+f(m0[1]);for(let i=1;i<=n;i++){const p=P[i%n],m=mid(i);d+='Q'+f(p[0])+','+f(p[1])+' '+f(m[0])+','+f(m[1])}d+='Z'});
return d&&d.length<400000?{d,tf:`translate(${(X0+cx/k).toFixed(2)} ${(Y0+cy/k).toFixed(2)}) scale(${(1/(kk*k)).toFixed(5)})`}:null}finally{W=oW;H=oH}}
function sRun(){if(!S)return;['shth','ssm','shsp','sdt','sgap'].forEach(id=>{const r=$(id);r.style.setProperty('--p',((r.value-r.min)/(r.max-r.min)*100).toFixed(1)+'%');$(id+'v').textContent=id=='sdt'?(+r.value).toFixed(1):r.value});
if(S.mode=='grid'){const{xs,ys}=S;S.boxes=[];for(let j=0;j<ys.length-1;j++)for(let i=0;i<xs.length-1;i++)S.boxes.push({x0:xs[i],y0:ys[j],x1:xs[i+1],y1:ys[j+1]})}else S.boxes=autoBoxes();
if(S.off.size&&[...S.off].some(i=>i>=S.boxes.length))S.off.clear();
S.res=S.boxes.map(b=>cellVec(b,S.mode=='grid'));drawOv();drawCells()}
function drawOv(){const{w,h}=S,f=v=>v.toFixed(1),sw=Math.max(w,h)/320;let o='';
if(S.view=='t'){const ink=col(proj.ink),bg=col(proj.bg);o+=`<rect width="${w}" height="${h}" fill="${bg}"/>`;S.res.forEach((r,i)=>{if(r)o+=`<path d="${r.d}" transform="${r.tf}" fill="${ink}" fill-rule="evenodd" opacity="${S.off.has(i)?.25:1}"/>`})}
document.querySelectorAll('#sview [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v==S.view));
S.boxes.forEach((b,i)=>{const off=S.off.has(i)||!S.res[i];o+=`<rect x="${f(b.x0*w)}" y="${f(b.y0*h)}" width="${f((b.x1-b.x0)*w)}" height="${f((b.y1-b.y0)*h)}" fill="${off?'rgba(200,60,40,.12)':S.view=='t'?'none':'rgba(63,95,224,.06)'}" stroke="${S.mode=='auto'?'#3f5fe0':'none'}" stroke-width="${f(sw*1.5)}"/><text x="${f(b.x0*w+sw*5)}" y="${f(b.y0*h+sw*14)}" font-size="${f(sw*12)}" fill="#3f5fe0" font-family="sans-serif">${i+1}</text>`});
if(S.mode=='grid'){S.xs.forEach((x,i)=>{o+=`<line x1="${f(x*w)}" y1="0" x2="${f(x*w)}" y2="${h}" stroke="#3f5fe0" stroke-width="${f(sw*1.6)}" stroke-dasharray="${f(sw*6)} ${f(sw*4)}"/><line data-lx="${i}" x1="${f(x*w)}" y1="0" x2="${f(x*w)}" y2="${h}" stroke="transparent" stroke-width="${f(sw*14)}"/>`});
S.ys.forEach((y,j)=>{o+=`<line x1="0" y1="${f(y*h)}" x2="${w}" y2="${f(y*h)}" stroke="#3f5fe0" stroke-width="${f(sw*1.6)}" stroke-dasharray="${f(sw*6)} ${f(sw*4)}"/><line data-ly="${j}" x1="0" y1="${f(y*h)}" x2="${w}" y2="${f(y*h)}" stroke="transparent" stroke-width="${f(sw*14)}"/>`})}
$('sov').innerHTML=o;$('shint').textContent=S.mode=='grid'?'Drag any dashed line, including the outer edges, to line the grid up with the artwork.':'Each blue box is one motif. Raise "Join parts within" if a motif is split into pieces, lower it if two motifs are merged.'}
function drawCells(){const ink=col(proj.ink),bg=col(proj.bg);let n=0;
$('scells').innerHTML=S.boxes.length?S.boxes.map((b,i)=>{const r=S.res[i],d=r&&r.d,off=S.off.has(i)||!d;if(!off)n++;return`<button type="button" data-c="${i}" class="${off?'off':''}" title="${d?(off?'Left out. Click to include':'Click to leave out'):'No ink found in this cell'}"><svg viewBox="-50 -50 100 100" style="background:${bg}">${d?`<path d="${d}" fill="${ink}" fill-rule="evenodd"/>`:''}</svg><i>${i+1}</i></button>`}).join(''):'<div class="em">No motifs found. Adjust the threshold or try the other mode.</div>';
$('sadd').textContent=`Import ${n} motif${n==1?'':'s'}`;$('sadd').disabled=!n;$('shinfo').textContent=`${S.boxes.length} cell${S.boxes.length==1?'':'s'} found, ${n} will be imported.`}
$('scells').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;const i=+b.dataset.c;if(!S.res[i])return;S.off.has(i)?S.off.delete(i):S.off.add(i);drawOv();drawCells()};
// drag grid lines
let sd=null;$('sov').addEventListener('pointerdown',e=>{const t=e.target.closest('[data-lx],[data-ly]');if(!t||!S)return;e.preventDefault();$('sov').setPointerCapture(e.pointerId);sd={x:t.dataset.lx!=null,i:+(t.dataset.lx??t.dataset.ly)}});
$('sov').addEventListener('pointermove',e=>{if(!sd)return;const r=$('sov').getBoundingClientRect(),A=sd.x?S.xs:S.ys,v=sd.x?(e.clientX-r.left)/r.width:(e.clientY-r.top)/r.height,lo=sd.i>0?A[sd.i-1]+.02:0,hi=sd.i<A.length-1?A[sd.i+1]-.02:1;A[sd.i]=Math.max(lo,Math.min(hi,v));drawOv()});
$('sov').addEventListener('pointerup',()=>{if(sd){sd=null;sRun()}});
const sClose=()=>{$('sdlg').hidden=true};$('scl').onclick=sClose;$('scx').onclick=sClose;$('sdlg').addEventListener('click',e=>{if(e.target===$('sdlg'))sClose()});
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&!$('sdlg').hidden)sClose()});
$('sadd').onclick=()=>{if(!S)return;const cat=($('snm').value.trim()||'Sheet').replace(/[\"<>&|]/g,'').slice(0,30),base=Date.now().toString(36);let n=0;
S.boxes.forEach((b,i)=>{const d=S.res[i]&&S.res[i].d;if(!d||S.off.has(i))return;n++;const key='i|'+base+'s'+i+Math.random().toString(36).slice(2,4);cust[key]={n:`${cat} ${n}`.slice(0,40),svg:`<path d="${d}" fill="FILL" fill-rule="evenodd"/>`,imp:1,g:cat}});
mcat='g:'+cat;try{localStorage.setItem('wb11_mcat',mcat)}catch(e){}store();sClose();upd();document.querySelector('.rail [data-pn="motifs"]').click();$('pmsg').textContent=`Added ${n} motifs to “${cat}” in the library.`};
$('sfile').onchange=()=>{const f=$('sfile').files[0];$('sfile').value='';if(!f)return;if(f.type&&!/^image\//.test(f.type))return say2('That file is not an image. Use a PNG, JPG or WebP.');const url=URL.createObjectURL(f),img=new Image();
img.onload=()=>{URL.revokeObjectURL(url);sOpen(img,(f.name||'').replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' '))};img.onerror=()=>{URL.revokeObjectURL(url);say2('That image could not be read. Try a PNG or JPG.')};img.src=url};
$('isht').onclick=()=>{if(!src)return;closeDlg();sOpen(src,$('inm').value.trim())};
window.wbImpOk=(k,v)=>k.startsWith('i|')?!!(v&&typeof v.svg=='string'&&IMP_RE.test(v.svg)&&v.svg.length<600000):true;
})();

