import {kv} from '../platform/index.js';
import {CH,CW,SH,SK,SW} from './04-canvas-and-stamp-outlines.js';
// ===== Text engine (no panels, no document): fonts, letter outlines traced from the browser's own rendering, and the teLayout of lines,
// boxes and curves. The Text panel (22) and the Text layer (26) both use it, so a text looks the same in a stamp and in a layer.
let teNotify=()=>{};const teSetNotify=f=>{teNotify=f||(()=>{})};

const teFonts=[['cinzel','Cinzel','Cinzel',700,'Roman capitals'],['cinzeld','Cinzel Decorative','Cinzel+Decorative',700,'Decorated capitals'],
['fell','IM Fell English','IM+Fell+English',400,'Old-style print'],['fellsc','IM Fell English SC','IM+Fell+English+SC',400,'Old-style small caps'],
['garamond','Cormorant Garamond','Cormorant+Garamond',700,'Classic serif'],['frak','UnifrakturMaguntia','UnifrakturMaguntia',400,'Blackletter'],
['pirata','Pirata One','Pirata+One',400,'Narrow blackletter'],['uncial','Uncial Antiqua','Uncial+Antiqua',400,'Uncial'],
['medieval','MedievalSharp','MedievalSharp',400,'Hand-cut medieval'],['alfa','Alfa Slab One','Alfa+Slab+One',400,'Heavy slab'],
['holtwood','Holtwood One SC','Holtwood+One+SC',400,'Wood type'],['rye','Rye','Rye',400,'Ornamental wood type'],
['abril','Abril Fatface','Abril+Fatface',400,'Fat face'],['bebas','Bebas Neue','Bebas+Neue',400,'Condensed poster'],['playfair','Playfair Display','Playfair+Display',700,'High-contrast serif'],['bodoni','Bodoni Moda','Bodoni+Moda',700,'Fashion serif'],['dmserif','DM Serif Display','DM+Serif+Display',400,'Display serif'],['oswald','Oswald','Oswald',700,'Tall condensed sans'],['anton','Anton','Anton',400,'Heavy condensed'],['leaguegothic','League Gothic','League+Gothic',400,'Narrow gothic'],['montserrat','Montserrat','Montserrat',800,'Geometric sans'],['lobster','Lobster','Lobster',400,'Bold script'],['pacifico','Pacifico','Pacifico',400,'Surf script'],['dancing','Dancing Script','Dancing+Script',700,'Lively script'],['caveat','Caveat','Caveat',700,'Handwriting'],['marker','Permanent Marker','Permanent+Marker',400,'Marker pen'],['elite','Special Elite','Special+Elite',400,'Typewriter'],['bungee','Bungee','Bungee',400,'Signage'],['ultra','Ultra','Ultra',400,'Fat slab'],['vastshadow','Vast Shadow','Vast+Shadow',400,'Slab with shadow'],['limelight','Limelight','Limelight',400,'Art deco'],['almendra','Almendra','Almendra',700,'Calligraphic'],['metamorph','Metamorphous','Metamorphous',400,'Fantasy serif'],['grenze','Grenze Gotisch','Grenze+Gotisch',700,'Gothic blackletter']];
const teF={};teFonts.forEach(([id,fam,q,w,d])=>teF[id]={id,fam,w,d,lbl:fam});
// the lettering fonts are bundled with the page (@font-face rules in the shell), so nothing is fetched

// your own fonts (kept in this browser when they fit)
const teUF=[];const teAddUF=async(name,buf,save)=>{const id='u-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30);if(teF[id])return id;
const ff=new FontFace('wbu-'+id,buf);await ff.load();document.fonts.add(ff);teF[id]={id,fam:'wbu-'+id,w:400,d:'Your font',lbl:name,u:1};teUF.push(id);
if(save){try{const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));const all=JSON.parse(kv.get('wb17_fonts')||'{}');all[name]=btoa(s);kv.set('wb17_fonts',JSON.stringify(all))}catch(e){teNotify(`“${name}” is loaded for now, but it's too big to keep in this browser. Load it again next time.`)}}return id};
const teLoadFonts=done=>{try{const all=JSON.parse(kv.get('wb17_fonts')||'{}');Object.entries(all).forEach(([n,b64])=>{const s=atob(b64),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);teAddUF(n,b.buffer,false).then(()=>done&&done()).catch(()=>{})})}catch(e){}};

const teP=160,teE=60,teGL=new Map();let teCv=null,teCx=null;const teEns=()=>{if(!teCv){teCv=document.createElement('canvas');teCx=teCv.getContext('2d',{willReadFrequently:true})}};
const teCss=f=>`${f.w} ${teP}px "${f.fam}", Georgia, serif`;
// --- tracing (marching squares -> simplified closed loops -> smooth quadratic path)
function teTrace(b,W,H){const g=(x,y)=>x>0&&y>0&&x<=W&&y<=H?b[(y-1)*W+(x-1)]:0,adj=new Map(),add=(a,c)=>{(adj.get(a)||adj.set(a,[]).get(a)).push(c);(adj.get(c)||adj.set(c,[]).get(c)).push(a)},K=(x,y)=>x*100000+y;
for(let y=0;y<H+1;y++)for(let x=0;x<W+1;x++){const c=g(x,y)*8+g(x+1,y)*4+g(x+1,y+1)*2+g(x,y+1);if(c==0||c==15)continue;const T=K(2*x+1,2*y),R=K(2*x+2,2*y+1),B=K(2*x+1,2*y+2),L=K(2*x,2*y+1);
switch(c){case 1:case 14:add(L,B);break;case 2:case 13:add(B,R);break;case 3:case 12:add(L,R);break;case 4:case 11:add(T,R);break;case 6:case 9:add(T,B);break;case 7:case 8:add(L,T);break;case 5:add(L,T);add(B,R);break;case 10:add(T,R);add(L,B);break}}
const loops=[],used=new Set();for(const[s0]of adj){if(used.has(s0))continue;const lp=[];let pv=null,c=s0;while(c!=null&&!used.has(c)){used.add(c);lp.push([Math.floor(c/100000)/2-.5,(c%100000)/2-.5]);const nx=adj.get(c).find(n=>n!==pv&&!used.has(n));pv=c;c=nx==null?null:nx}if(lp.length>=4)loops.push(lp)}return loops}
function teRdp(p,eps){if(p.length<4)return p;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];while(st.length){const[a,z]=st.pop();let md=0,mi=-1;const[ax,ay]=p[a],[zx,zy]=p[z],dx=zx-ax,dy=zy-ay,L=Math.hypot(dx,dy)||1;
for(let i=a+1;i<z;i++){const d=Math.abs(dy*p[i][0]-dx*p[i][1]+zx*ay-zy*ax)/L;if(d>md){md=d;mi=i}}if(md>eps&&mi>0){keep[mi]=1;st.push([a,mi],[mi,z])}}return p.filter((_,i)=>keep[i])}
function teDens(l,step){const o=[];for(let i=0;i<l.length;i++){const a=l[i],b=l[(i+1)%l.length],n=Math.max(1,Math.floor(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}return o}
// one letter -> {k: motif key, teCx, cy: ink centre relative to the pen position on the baseline, in px}
const teFok=f=>[...document.fonts].some(x=>x.family.replace(/["']/g,'')==f.fam&&x.status=='loaded');
function teGlyph(f,ch){teEns();const ok=teFok(f),key='t|'+f.id+(ok?'':'~')+'|'+ch.codePointAt(0).toString(36);if(teGL.has(key))return teGL.get(key);
teCx.font=teCss(f);const m=teCx.measureText(ch),pad=Math.ceil(teP*.5),w=Math.ceil(Math.max(m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0)))+pad*2,h=Math.ceil(teP*2.1),ox=pad,oy=Math.round(teP*1.4);
teCv.width=w;teCv.height=h;teCx.font=teCss(f);teCx.textBaseline='alphabetic';teCx.fillStyle='#000';teCx.fillText(ch,ox,oy);const d=teCx.getImageData(0,0,w,h).data,b=new Uint8Array(w*h);let x0=w,y0=h,x1=-1,y1=-1;
for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>110){b[y*w+x]=1;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
if(x1<0){teGL.set(key,null);return null}
const gcx=(x0+x1+1)/2,gcy=(y0+y1+1)/2,u=teE/teP,fm=v=>(Math.round(v*10)/10).toString();let path='';
teTrace(b,w,h).forEach(l=>{let fi=0,fd=0;l.forEach((p,i)=>{const dd=(p[0]-l[0][0])**2+(p[1]-l[0][1])**2;if(dd>fd){fd=dd;fi=i}});const A=teRdp(l.slice(0,fi+1),.55),B=teRdp(l.slice(fi).concat([l[0]]),.55),q=teDens(A.concat(B.slice(1,-1)),3);
const n=q.length;if(n<3)return;const Pp=q.map(([x,y])=>[(x-gcx)*u,(y-gcy)*u]),mid=i=>{const a=Pp[i%n],c=Pp[(i+1)%n];return[(a[0]+c[0])/2,(a[1]+c[1])/2]};const m0=mid(0);path+='M'+fm(m0[0])+','+fm(m0[1]);
for(let i=1;i<=n;i++){const p=Pp[i%n],mm=mid(i);path+='Q'+fm(p[0])+','+fm(p[1])+' '+fm(mm[0])+','+fm(mm[1])}path+='Z'});
const r={k:key,cx:gcx-ox,cy:gcy-oy,d:path};teGL.set(key,r);return r}
// --- layout: letters on straight lines, or bent around a circle (curve = % of a full circle; negative curves down)
// Box and fit options (all optional, saved only when set): pd = padding inside the box (% of the short side), ft = how the text fits the box
// ('' off, 's' shrink to fit, 'f' fill the box, 'l' fit each line to the width, 'w' fit the width), ov = 'h' hides what runs past the box, va 's' = Spread.
function teCore(o){teEns();const f=teF[o.f]||teF.cinzel;teCx.font=teCss(f);const T0=o.tc=='u'?o.text.toUpperCase():o.tc=='l'?o.text.toLowerCase():o.tc=='t'?o.text.toLowerCase().replace(/(^|[\s(\-])(\S)/g,(m,a,b)=>a+b.toUpperCase()):o.text,lines0=T0.split('\n'),em=o.sz/100*Math.min(SW,SH),k=em/teP,ls=o.ls/100*teP,wsp=(o.ws||0)/100*teP,capH=teCx.measureText('H').actualBoundingBoxAscent||teP*.7,lhp=o.lh/100*teP;
// Box width: lines are broken at spaces so none is wider than the box (a single long word is left whole). Box height + Vertical: where the block of lines sits in a box of that height.
const U=Math.min(SW,SH)/100,pdc=(o.pd||0)*U,limP=o.wd>0?Math.max(1,o.wd*U-2*pdc)/k:0,wd1=s=>{let n=0,sp=0;for(const c of s){n++;if(/\s/.test(c))sp++}return teCx.measureText(s).width+ls*Math.max(0,n-1)+wsp*sp};let lines=lines0;
if(limP&&!o.nw&&o.ft!='l'){lines=[];lines0.forEach(ln=>{if(!ln.trim()){lines.push(ln);return}let cur='';ln.split(' ').forEach(w=>{const t=cur?cur+' '+w:w;if(cur&&wd1(t)>limP){lines.push(cur);cur=w}else cur=t});lines.push(cur)})}
const hbP=o.ht>0?Math.max(1,o.ht*U-2*pdc)/k:0;
const L=lines.map(line=>{const ch=[...line],out=[];let sp=0;ch.forEach((c,i)=>{if(/\s/.test(c)){sp++;return}const g=teGlyph(f,c);if(!g)return;const pen=teCx.measureText(ch.slice(0,i).join('')).width+ls*i+wsp*sp;out.push({g,c,x:pen+g.cx,y:g.cy,sp})});teCx.font=teCss(f);return{out,ns:sp,W:teCx.measureText(line).width+ls*Math.max(0,ch.length-1)+wsp*sp}});
const fj=L.map(l=>o.ft=='l'&&limP&&l.W>0?Math.min(8,limP/l.W):1),hj=fj.map(q=>lhp*q),H=hj.reduce((a,b)=>a+b,0),n=lines.length,fr2=hbP?(hbP-H)/2:0,vOff=hbP?(o.va=='b'?fr2:o.va=='m'?0:-fr2):0,spr=hbP&&o.va=='s'&&n>1,gap=spr?Math.max(0,hbP-H)/(n-1):0;
const maxW=limP||Math.max(1,...L.map((l,j)=>l.W*fj[j])),pts=[];let cum=hbP?(spr?-hbP/2:-H/2+vOff):-H/2,over=!!((hbP&&H>hbP+.5)||(limP&&Math.max(0,...L.map((l,j)=>l.W*fj[j]))>limP+.5));const cut=o.ov=='h'&&hbP;
L.forEach((l,j)=>{const q=fj[j],Wj=l.W*q,ex=o.al=='j'&&j<L.length-1&&l.ns>0&&q==1?(maxW-l.W)/l.ns:0,sh=o.al=='l'||o.al=='j'?-maxW/2:o.al=='r'?maxW/2-Wj:-Wj/2,yc=cum+hj[j]/2,by=yc+capH*q/2;cum+=hj[j]+gap;
if(cut&&(yc-hj[j]/2<-hbP/2-.5||yc+hj[j]/2>hbP/2+.5))return;l.out.forEach(c=>pts.push({g:c.g,c:c.c,px:sh+c.x*q+ex*c.sp,py:by+c.y*q,q}))});
const cvv=Math.max(-1,Math.min(1,o.cv/100)),rt=(o.rot||0)*Math.PI/180,cs=Math.cos(rt),sn=Math.sin(rt);let res;
if(Math.abs(cvv)<.005)res=pts.map(c=>({g:c.g,c:c.c,x:c.px,y:c.py,r:0,q:c.q}));
else{const phi=Math.abs(cvv)*2*Math.PI,R=maxW/phi,off=R*Math.max(0,Math.min(1,1-phi/Math.PI));
res=pts.map(c=>{if(cvv>0){const th=-Math.PI/2+c.px/R,rho=R-c.py;return{g:c.g,c:c.c,x:rho*Math.cos(th),y:off+rho*Math.sin(th),r:(th+Math.PI/2)*180/Math.PI,q:c.q}}
const th=Math.PI/2-c.px/R,rho=R+c.py;return{g:c.g,c:c.c,x:rho*Math.cos(th),y:-off+rho*Math.sin(th),r:(th-Math.PI/2)*180/Math.PI,q:c.q}})}
const out=res.map(p=>({g:p.g,c:p.c,x:(p.x*cs-p.y*sn)*k,y:(p.x*sn+p.y*cs)*k,r:p.r+(o.rot||0),s:+(em/teE*p.q).toFixed(4)}));out.over=over;out.tw=Math.max(0,...L.map((l,j)=>l.W*fj[j]))*k;return out}
// The layout, with the fit modes: Shrink to fit and Fill the box look for the size that fits (about 12 tries); Fit the width scales one run of lines to the box width.
function teLayout(o){const bx=o.wd>0||o.ht>0,ft=bx?(o.ft||''):'';if(!ft)return teCore({...o,ft:''});if(ft=='l')return teCore(o);
if(ft=='w'){if(!(o.wd>0))return teCore({...o,ft:''});const r0=teCore({...o,ft:'',sz:100,nw:1});if(!r0.length)return r0;const U=Math.min(SW,SH)/100,inner=Math.max(1,o.wd*U-2*(o.pd||0)*U);return teCore({...o,ft:'',sz:Math.max(1,100*inner/Math.max(1,r0.tw)),nw:1})}
const c0={...o,ft:''};if(ft=='s'){const r=teCore(c0);if(!r.over)return r}let lo=1,hi=ft=='s'?o.sz:400;for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(teCore({...c0,sz:mid}).over)hi=mid;else lo=mid}return teCore({...c0,sz:lo})}
// --- text options and defaults
const teD={text:'',f:'cinzel',sz:30,ls:0,ws:0,lh:115,al:'c',tc:'',cv:0,rot:0,wd:0,ht:0,va:'t',auto:true};
// largest size (up to 40%) at which the whole text sits inside the stamp, so it doesn't wrap round the edges
function teFitSz(o){const ps=teLayout({...o,sz:100});if(!ps.length)return o.sz;const h=Math.min(SW,SH)*.42;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;ps.forEach(p=>{x0=Math.min(x0,p.x-h);x1=Math.max(x1,p.x+h);y0=Math.min(y0,p.y-h);y1=Math.max(y1,p.y+h)});
const k=SK=='tri'?.55:SK=='rect'?.86:.74;return Math.max(5,Math.min(o.maxSz||40,Math.floor(100*Math.min(k*SW/(x1-x0),k*SH/(y1-y0)))))}
// load a font before using it (the browser draws a fallback otherwise)
async function teReady(st){const f=teF[st.f]||teF.cinzel;try{await document.fonts.load(teCss(f),st.text||'Aa');await document.fonts.ready}catch(e){}}

async function teLayBox(o){const f=teF[o.f]||teF.cinzel;try{await document.fonts.load(teCss(f),o.text||'Aa');await document.fonts.ready}catch(e){}
const q={...teD,...o};if(!q.text.trim())return null;const kk=Math.min(CW,CH)/Math.min(SW,SH),ps=teLayout(q);if(!ps.length)return null;const over=!!ps.over;
const G={},Lt=[];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
ps.forEach(p=>{const d=p.g.d;if(!/^[MLQZ0-9.,\- ]+$/.test(d))return;G[p.g.k]=d;const nm=(d.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);let a=1e9,b=1e9,c=-1e9,e=-1e9;for(let i=0;i+1<nm.length;i+=2){a=Math.min(a,nm[i]);c=Math.max(c,nm[i]);b=Math.min(b,nm[i+1]);e=Math.max(e,nm[i+1])}
const r=p.r*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),X=p.x*kk,Y=p.y*kk,S=p.s*kk;[[a,b],[c,b],[c,e],[a,e]].forEach(([u,v])=>{const px=X+(u*cs-v*sn)*S,py=Y+(u*sn+v*cs)*S;x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)});
Lt.push([p.g.k,X,Y,+p.r.toFixed(1),+S.toFixed(4)])});
if(!Lt.length)return null;const U=kk*Math.min(SW,SH)/100,boxW=q.wd>0,boxH=q.ht>0,mx=boxW?0:(x0+x1)/2,my=boxH?0:(y0+y1)/2;Lt.forEach(l=>{l[1]=+(l[1]-mx).toFixed(2);l[2]=+(l[2]-my).toFixed(2)});
// with a box width or height, the box (not the letters) is what the piece measures, so Align and Vertical sit inside it
return{G,Lt,bw:+(boxW?q.wd*U:x1-x0).toFixed(2),bh:+(boxH?q.ht*U:y1-y0).toFixed(2),over}}

export {teFonts,teF,teUF,teCss,teGlyph,teLayout,teD,teFitSz,teReady,teAddUF,teLoadFonts,teLayBox,teSetNotify};
